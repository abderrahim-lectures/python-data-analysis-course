import {makeEditableCode} from './codeEditor.ts';
import {copyToClipboard} from './clipboard.ts';
// Hydrates every `.cell[data-runnable]` on the page (whether hand-authored via
// <RunnableCell> or generated from ```python fences by rehype-runnable-python)
// with a Pyodide-backed Run button. Loaded once per page from Base.astro.
//
// Every cell runs in a Web Worker (pyodide.worker.ts via
// pyodideWorkerClient.ts) so a slow cell — a cold engine boot, a heavy pandas
// operation, a cell waiting on input() — can't freeze the page. Cells that call
// input() get an inline form above the output: the learner types the answers
// there and the worker replays them through Pyodide's (synchronous) stdin
// callback. See pythonInputs.ts for why the values are collected before the
// run rather than asked for mid-run.
import {createCellInputForm} from './cellInputForm.ts';
import {m} from '../paraglide/messages.js';
import {getLocale} from '../paraglide/runtime.js';
import {
  runCellCode,
  mountDatasets,
  resetExtraPackagesCache,
  resetMountedDatasetsCache,
  type PyodideModel,
  type CellRuntime,
} from './pythonRunnerCore.ts';
import {runInWorker} from './pyodideWorkerClient.ts';
import {addXP, loadState} from './gameState.ts';

// Re-exported for unit tests, which import these from this module rather
// than pythonRunnerCore.ts directly (kept stable across the worker-migration
// refactor so the existing test suite didn't need to change its imports).
export {runCellCode, resetExtraPackagesCache, resetMountedDatasetsCache};
export type {PyodideModel, CellRuntime};

// `window.dispatchEvent?.()` only guards the *property* lookup, not the
// `window` identifier itself -- it still throws a ReferenceError wherever
// `window` isn't declared at all (unit tests that stub then unstub it as a
// global; a stray microtask from one test's fixture can resume after a
// later test's `afterEach` has already un-stubbed it). These dispatches are
// a UI hook for the busy overlay, never load-bearing for the actual Python
// run, so a missing `window` should be a silent no-op, not a crash.
function dispatchPyodideEvent(name: string, detail?: unknown): void {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
  window.dispatchEvent(new CustomEvent(name, detail === undefined ? undefined : {detail}));
}

// Award XP for running a code cell and report how much was gained and the
// pre-award balance (the first-success toast keys off xpBefore === 0).
// gained comes straight from addXP's own atomic before/after, not a second
// loadState() call here -- two overlapping runs could otherwise interleave
// between this function's own reads and report the other run's gain.
export async function awardLessonXp(lessonId: string): Promise<{gained: number; firstRunEver: boolean}> {
  // "First success" has to mean the first run, not "XP was zero": the daily
  // login (gamestrip's boot) pays 5 XP before the learner can click anything,
  // so a balance of 0 was unreachable and the toast never rendered for anyone
  // with working storage.
  const firstRunEver = Object.keys(loadState().lessonsRun ?? {}).length === 0;
  const {gained} = addXP(lessonId);
  return {gained, firstRunEver};
}

export interface InitCellDeps {
  loadEngine?: () => Promise<PyodideModel>;
}

// Hydrate one `.cell[data-runnable]` (localized chrome, Run/Clear/Copy wiring,
// edit + re-highlight, line gutter). The engine loader is injectable so the
// DOM wiring is unit-testable without touching the Pyodide CDN download.
export function initCell(cell: Element, deps: InitCellDeps = {}): void {
  if (cell.hasAttribute('data-hydrated')) return;
  cell.setAttribute('data-hydrated', '1');
  // Cells generated from markdown ```python fences carry no data-lesson, so
  // fall back to the lesson the page itself declares — otherwise running code
  // in a lesson awards nothing.
  const lessonId = (cell as HTMLElement).dataset.lesson
    || document.querySelector('[data-lesson-id]')?.getAttribute('data-lesson-id')
    || '';
  let awarded = false;
  const run = cell.querySelector('[data-run]') as HTMLButtonElement | null;
  const out = cell.querySelector('[data-output]') as HTMLElement | null;
  const lines = cell.querySelector('[data-lines]') as HTMLElement | null;
  const clear = cell.querySelector('[data-clear]') as HTMLButtonElement | null;
  const codeEl = cell.querySelector('code');
  if (!run || !out || !lines || !clear || !codeEl) return;

  // Cells emitted by the markdown rehype plugin share one EN render across all
  // locale trees (the lesson body itself is EN content), so their Run/Clear
  // chrome is baked as EN. Localize it here — idempotent for cells authored via
  // the components, which are already SSG-localized.
  run.textContent = m.run_button();
  run.setAttribute('aria-label', m.run_aria());
  clear.textContent = m.clear_button();

  const appendLine = (kind: string, text: string) => {
    const d = document.createElement('div');
    d.className = `o-line o-line--${kind}`;
    d.textContent = text;
    lines.appendChild(d);
  };

  const appendFigure = (pngB64: string) => {
    const img = document.createElement('img');
    img.className = 'o-line--fig';
    img.src = `data:image/png;base64,${pngB64}`;
    img.alt = '';
    img.loading = 'lazy';
    lines.appendChild(img);
  };

  // --- input() values -----------------------------------------------------
  // Pyodide's stdin callback is synchronous, so a browser prompt() inside it
  // would freeze whichever thread runs the interpreter (and used to boot a
  // second engine on the main thread just for that). The cell shows one field
  // per input() call site instead, and the run replays them from a queue; see
  // cellInputForm.ts.
  const inputs = createCellInputForm({
    output: out,
    source: () => codeEl.textContent ?? '',
    hint: m.cell_input_hint(),
    fallbackLabel: (n) => `${m.cell_input_label()} ${n}`,
    run: () => run.click(),
  });

  run.addEventListener('click', async () => {
    if (run.disabled) return;
    const src = codeEl.textContent ?? '';
    out.hidden = false;
    clear.hidden = false;
    lines.innerHTML = '';
    // Added a frame after clearing [hidden] (not in the same tick) so the
    // browser paints the opacity:0/translateY starting state first -- the
    // .cell__output--show CSS transition needs that before-and-after to
    // animate instead of snapping straight to visible.
    requestAnimationFrame(() => out.classList.add('cell__output--show'));
    appendLine('cmd', '$ python');
    run.disabled = true;
    run.textContent = m.run_loading();
    run.classList.add('cell__run--loading');
    // The busy overlay stays up for the whole run -- engine bootstrap,
    // package installs, and code execution -- not just the parts with their
    // own progress signal, and regardless of which path below runs the code.
    // It's dismissed before afterRun's XP toast is created (not just before
    // the toast is awaited) -- the toast sits at a lower z-index than the
    // overlay, so if it were created first it would render invisible, hidden
    // behind the still-active backdrop until the overlay caught up and
    // cleared.
    const setPhaseLabel = (phase: 'packages' | 'running') => {
      run.textContent = phase === 'packages' ? m.run_loading_packages() : m.run_loading();
    };

    let executed: boolean;
    const cellCodeEls = Array.from(document.querySelectorAll('[data-runnable] code'));
    const allSource = cellCodeEls.map((el) => el.textContent ?? '').join('\n');
    const otherCellSources = cellCodeEls
      .filter((el) => el !== codeEl)
      .map((el) => el.textContent ?? '')
      .join('\n');
    // Pick up any input() call site the learner just added (or removed) before
    // reading the values, so the queue matches the code about to run.
    inputs.sync();
    const stdin = inputs.values();
    // A test-injected mock engine (deps.loadEngine) means "run this in-page
    // with the fake I supplied" -- a real Worker can't be meaningfully mocked
    // that way, and the DOM-wiring test suite isn't testing worker plumbing.
    // Production never takes this branch: input() cells included.
    if (deps.loadEngine) {
      let engine: PyodideModel;
      dispatchPyodideEvent('pyodide:loading');
      try {
        engine = await deps.loadEngine();
      } catch (e) {
        dispatchPyodideEvent('pyodide:ready');
        console.warn('[runnable-cell] failed to load Pyodide', e);
        appendLine('err', m.cell_engine_load_failed());
        run.textContent = m.run_button();
        run.disabled = false;
        run.classList.remove('cell__run--loading');
        return;
      }
      await mountDatasets(engine, allSource);
      executed = await runCellCode(src, {
        appendLine,
        appendFigure,
        engine,
        otherCellSources,
        stdin: inputs.stdin(),
        onPhase: (phase) => {
          setPhaseLabel(phase);
          dispatchPyodideEvent('pyodide:loading', {phase});
        },
      });
      dispatchPyodideEvent('pyodide:ready');
    } else {
      executed = await runInWorker(src, {allSource, otherCellSources, locale: getLocale(), stdin}, {
        appendLine,
        appendFigure,
        onPhase: setPhaseLabel,
        onLoading: (detail) => dispatchPyodideEvent('pyodide:loading', detail),
        onProgress: (pct) => dispatchPyodideEvent('pyodide:progress', {pct}),
        onReady: () => dispatchPyodideEvent('pyodide:ready'),
        onStdinExhausted: inputs.grow,
      });
    }

    run.textContent = m.run_button();
    run.disabled = false;
    run.classList.remove('cell__run--loading');
    await afterRun(executed);
  });

  async function afterRun(executed: boolean): Promise<void> {
    if (executed && !awarded && lessonId) {
      awarded = true;
      try {
        const {gained, firstRunEver} = await awardLessonXp(lessonId);
        cell.dispatchEvent(new CustomEvent('lesson:complete', {bubbles: true, detail: {lessonId, xp: gained}}));
        if (firstRunEver) {
          const toast = document.createElement('div');
          toast.className = 'firstsuccess-toast';
          toast.setAttribute('role', 'status');
          toast.textContent = m.first_success_toast();
          document.body.appendChild(toast);
          requestAnimationFrame(() => toast.classList.add('firstsuccess-toast--visible'));
          setTimeout(() => {
            toast.classList.remove('firstsuccess-toast--visible');
            setTimeout(() => toast.remove(), 400);
          }, 3000);
        }
      } catch { /* offline: skip XP award */ }
    }
  }
  clear.addEventListener('click', () => {
    lines.innerHTML = '';
    out.hidden = true;
    out.classList.remove('cell__output--show'); // next Run re-triggers the entrance transition
    clear.hidden = true;
  });

  // Copy source code button.
  const copyBtn = document.createElement('button');
  copyBtn.className = 'btn btn-ghost btn-sm cell__copy';
  const setCopyLabel = (state: 'idle' | 'done') => {
    copyBtn.textContent = state === 'done' ? m.copied_button() : m.copy_button();
  };
  setCopyLabel('idle');
  copyBtn.addEventListener('click', async () => {
    const ok = await copyToClipboard(codeEl.textContent ?? '');
    if (ok) {
      setCopyLabel('done');
      setTimeout(() => setCopyLabel('idle'), 1500);
    }
  });
  cell.querySelector('.cell__actions')?.appendChild(copyBtn);

  // Editing, highlighting and the line-number gutter; onEdit keeps the input
  // form in step with the source (see cellInputForm.ts).
  makeEditableCode(codeEl, {
    onEdit: () => inputs.sync(),
    onRun: () => run.click(),
  });

  // Cells that call input() show their fields on load, before the first Run --
  // that is where the learner is supposed to type.
  inputs.sync();
}

export function initRunnableCells(root: ParentNode = document): void {
  root.querySelectorAll('[data-runnable]').forEach((cell) => initCell(cell));
}

if (typeof document !== 'undefined') {
  // astro:page-load fires once on the initial load and again after every
  // client-side (View Transitions) navigation -- DOMContentLoaded only ever
  // fires once, so cells on a page reached via soft navigation would never
  // get wired up. Module-level state (the shared Pyodide worker, the
  // main-thread engine promise) is untouched by a swap since the JS module
  // itself isn't re-evaluated, so this only re-attaches DOM listeners for
  // the cells the swap just inserted.
  document.addEventListener('astro:page-load', () => {
    initRunnableCells();
  });
  // The initial astro:page-load dispatch fires on window's `load` event via
  // Astro's own router script, not this one -- if this deferred bundle is
  // still fetching (cold cache, slow connection) when `load` fires, that
  // one-time event is gone before the listener above ever registers, and
  // every cell on a real visitor's first page would stay unwired. readyState
  // is 'complete' only after `load` has already fired, so this covers
  // exactly that miss without ever double-firing (either this runs, or the
  // listener does, never both for the same dispatch).
  if (document.readyState === 'complete') initRunnableCells();
}