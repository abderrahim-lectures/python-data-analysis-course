import {highlightPython} from './pyHighlight.ts';
// Hydrates every `.cell[data-runnable]` on the page (whether hand-authored via
// <RunnableCell> or generated from ```python fences by rehype-runnable-python)
// with a Pyodide-backed Run button. Loaded once per page from Base.astro.
//
// Two execution paths:
// - The vast majority of cells run in a Web Worker (pyodide.worker.ts via
//   pyodideWorkerClient.ts) so a slow cell can't freeze the page.
// - Cells that call input() run on the main thread instead, through py()/
//   runCellCode() directly (both now in pythonRunnerCore.ts, shared with the
//   worker) -- Pyodide's stdin callback is synchronous and a Worker has no
//   way to satisfy that without cross-origin-isolation headers GitHub Pages
//   can't set (see pythonGuard.usesBlockingInput for the full rationale).
import {usesBlockingInput} from './pythonGuard.ts';
import {m} from '../paraglide/messages.js';
import {getLocale} from '../paraglide/runtime.js';
import {
  py,
  runCellCode,
  mountDatasets,
  resetExtraPackagesCache,
  resetMountedDatasetsCache,
  type PyodideModel,
  type CellRuntime,
} from './pythonRunnerCore.ts';
import {runInWorker} from './pyodideWorkerClient.ts';

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

// Award XP for completing a lesson run and report how much was gained and the
// pre-award balance (the first-success toast keys off xpBefore === 0).
export async function awardLessonXp(lessonId: string, reward?: number): Promise<{gained: number; xpBefore: number}> {
  const gs = await import('./gameState.ts');
  const xpBefore = gs.loadState().xp;
  gs.addXP(lessonId, reward);
  return {gained: gs.loadState().xp - xpBefore, xpBefore};
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
  const lessonReward = Number(document.querySelector('[data-lesson-xp]')?.getAttribute('data-lesson-xp') || 0) || undefined;
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
    // A test-injected mock engine (deps.loadEngine) always means "run this
    // on the main thread with the fake I supplied" -- a real Worker can't be
    // meaningfully mocked that way, and the DOM-wiring test suite isn't
    // testing worker plumbing. Cells that call input() also stay on the main
    // thread in production: Pyodide's stdin callback is synchronous and a
    // Worker has no way to satisfy that (see pythonGuard.usesBlockingInput).
    if (deps.loadEngine || usesBlockingInput(src)) {
      let engine: PyodideModel;
      dispatchPyodideEvent('pyodide:loading');
      try {
        engine = await (deps.loadEngine ?? py)();
      } catch (e) {
        dispatchPyodideEvent('pyodide:ready');
        console.warn('[runnable-cell] failed to load Pyodide', e);
        appendLine('err', m.cell_engine_load_failed());
        run.textContent = m.run_button();
        run.disabled = false;
        run.classList.remove('cell__run--loading');
        return;
      }
      const allSource = Array.from(document.querySelectorAll('[data-runnable] code'))
        .map((el) => el.textContent ?? '')
        .join('\n');
      await mountDatasets(engine, allSource);
      const otherCellSources = Array.from(document.querySelectorAll('[data-runnable] code'))
        .filter((el) => el !== codeEl)
        .map((el) => el.textContent ?? '')
        .join('\n');
      executed = await runCellCode(src, {
        appendLine,
        appendFigure,
        engine,
        otherCellSources,
        onPhase: (phase) => {
          setPhaseLabel(phase);
          dispatchPyodideEvent('pyodide:loading', {phase});
        },
      });
      dispatchPyodideEvent('pyodide:ready');
    } else {
      const allSource = Array.from(document.querySelectorAll('[data-runnable] code'))
        .map((el) => el.textContent ?? '')
        .join('\n');
      const otherCellSources = Array.from(document.querySelectorAll('[data-runnable] code'))
        .filter((el) => el !== codeEl)
        .map((el) => el.textContent ?? '')
        .join('\n');
      executed = await runInWorker(src, {allSource, otherCellSources, locale: getLocale()}, {
        appendLine,
        appendFigure,
        onPhase: setPhaseLabel,
        onLoading: (detail) => dispatchPyodideEvent('pyodide:loading', detail),
        onProgress: (pct) => dispatchPyodideEvent('pyodide:progress', {pct}),
        onReady: () => dispatchPyodideEvent('pyodide:ready'),
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
        const {gained, xpBefore} = await awardLessonXp(lessonId, lessonReward);
        cell.dispatchEvent(new CustomEvent('lesson:complete', {bubbles: true, detail: {lessonId, xp: gained}}));
        if (xpBefore === 0) {
          const style = document.createElement('style');
          style.textContent = `.firstsuccess-toast{position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%) translateY(20px);background:var(--accent);color:var(--accent-contrast);padding:.85rem 1.5rem;border-radius:var(--radius-lg);font-weight:700;font-size:.9rem;box-shadow:var(--shadow-md);opacity:0;transition:all .4s cubic-bezier(.4,0,.2,1);z-index:9999;pointer-events:none;white-space:nowrap}.firstsuccess-toast--visible{opacity:1;transform:translateX(-50%) translateY(0)}`;
          document.head.appendChild(style);
          const toast = document.createElement('div');
          toast.className = 'firstsuccess-toast';
          toast.setAttribute('role', 'status');
          toast.textContent = m.first_success_toast();
          document.body.appendChild(toast);
          requestAnimationFrame(() => toast.classList.add('firstsuccess-toast--visible'));
          setTimeout(() => { toast.classList.remove('firstsuccess-toast--visible'); setTimeout(() => toast.remove(), 400); }, 3000);
          setTimeout(() => style.remove(), 3500);
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
    const text = codeEl.textContent ?? '';
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      // The async Clipboard API can be blocked (permissions, private mode);
      // fall back to the legacy selection-based copy before giving up.
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand('copy');
        ta.remove();
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setCopyLabel('done');
      setTimeout(() => setCopyLabel('idle'), 1500);
    }
  });
  cell.querySelector('.cell__actions')?.appendChild(copyBtn);

  // Learners can edit the snippet in place before running it — this is the
  // "playground" part of a runnable cell, not just a static example.
  codeEl.setAttribute('contenteditable', 'plaintext-only' as string);
  codeEl.setAttribute('spellcheck', 'false');
  codeEl.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    document.execCommand('insertText', false, '    ');
  });

  // Ctrl+Enter (or Cmd+Enter) to run code.
  codeEl.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      run.click();
    }
  });

  // Lesson cells arrive pre-highlighted by Shiki at build time; the
  // playground and any ?code= handoff arrive as plain text. Paint those on
  // load too, so highlighting isn't something that only appears after the
  // first edit.
  if (!codeEl.querySelector('span')) {
    codeEl.innerHTML = highlightPython(codeEl.textContent ?? '');
  }

  // Line-number gutter — every cell gets one, not just the playground.
  // Inserted client-side rather than at build/markdown time so it works
  // uniformly for markdown-generated cells, <RunnableCell>, and the
  // playground alike.
  const gutter = document.createElement('span');
  gutter.className = 'cell__gutter';
  gutter.setAttribute('aria-hidden', 'true');
  codeEl.parentElement?.insertBefore(gutter, codeEl);
  const renumber = () => {
    const n = (codeEl.textContent ?? '').split('\n').length;
    let out = '';
    for (let i = 1; i <= n; i++) out += i + '\n';
    gutter.textContent = out;
  };
  renumber();

  // Re-highlight on every edit, preserving the caret by character offset —
  // innerHTML replacement otherwise drops the cursor to the start.
  const caretOffset = (): number => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return 0;
    const range = sel.getRangeAt(0);
    const pre = range.cloneRange();
    pre.selectNodeContents(codeEl);
    pre.setEnd(range.endContainer, range.endOffset);
    return pre.toString().length;
  };
  const restoreCaret = (offset: number) => {
    const sel = window.getSelection();
    if (!sel) return;
    const walker = document.createTreeWalker(codeEl, NodeFilter.SHOW_TEXT);
    let remaining = offset;
    let node = walker.nextNode();
    while (node) {
      const len = node.textContent?.length ?? 0;
      if (remaining <= len) {
        const range = document.createRange();
        range.setStart(node, remaining);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        return;
      }
      remaining -= len;
      node = walker.nextNode();
    }
    // Offset past the end (e.g. typed at the very end) — park at the last node.
    const range = document.createRange();
    range.selectNodeContents(codeEl);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  };
  codeEl.addEventListener('input', () => {
    const offset = caretOffset();
    codeEl.innerHTML = highlightPython(codeEl.textContent ?? '');
    restoreCaret(offset);
    renumber();
  });
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