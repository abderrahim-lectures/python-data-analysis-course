import {highlightPython} from './pyHighlight.ts';
// Hydrates every `.cell[data-runnable]` on the page (whether hand-authored via
// <RunnableCell> or generated from ```python fences by rehype-runnable-python)
// with a Pyodide-backed Run button. Loaded once per page from Base.astro.
import {usesJsBridge} from './pythonGuard.ts';
import {m} from '../paraglide/messages.js';
import {planDatasetMounts} from './datasetMount.ts';
import {friendlyError} from './friendlyError.ts';

const PYODIDE_VERSION = '0.26.4';
const INDEX = `${import.meta.env.BASE_URL}pyodide/`;

// Pure-Python packages the lessons use that are NOT part of the Pyodide wheel
// set. seaborn is the only one today; its runtime deps (numpy, pandas,
// matplotlib, scipy, statsmodels) are all Pyodide packages, so we preload
// those from the regular index and then install the vendored wheel from our
// own origin (`public/`), which the site CSP's connect-src 'self' allows.
type ExtraPackages = {imports: string; wheel: string};
const EXTRA_PACKAGES: Record<string, string> = {
  seaborn: `${import.meta.env.BASE_URL}pyodide/seaborn-0.13.2-py3-none-any.whl`,
};
const EXTRA_PACKAGE_IMPORTS = 'micropip, numpy, pandas, matplotlib, scipy, statsmodels';
const extraPackagesInstalled = new Set<string>();

// Unit tests reset the per-install cache between cases (it is per-page-load in
// the browser, but module-scoped in a single vitest process).
export function resetExtraPackagesCache(): void {
  extraPackagesInstalled.clear();
}

// Minimal structural typing for the subset of the Pyodide runtime this module
// touches (stdout/stderr/stdin wiring, package loading, script execution, and
// the virtual filesystem used to pre-mount datasets). Keeps the CDN import
// (`loadPyodide`) and the DOM wiring fully typed instead of `any`.
export interface PyodideModel {
  setStdout(cb: {batched: (s: string) => void}): void;
  setStderr(cb: {batched: (s: string) => void}): void;
  setStdin(cb: {stdin: () => string}): void;
  loadPackagesFromImports(src: string): Promise<unknown>;
  runPython(src: string): Promise<(src: string) => string>;
  runPythonAsync(src: string): Promise<unknown>;
  FS: {writeFile(path: string, data: Uint8Array): void};
}

type PyodideModule = {loadPyodide: (opts: {indexURL: string}) => Promise<PyodideModel>};
let pyPromise: Promise<PyodideModel> | null = null;

async function py(): Promise<PyodideModel> {
  if (!pyPromise) {
    const mod = (await import(/* @vite-ignore */ `${INDEX}pyodide.mjs`)) as PyodideModule;
    pyPromise = mod.loadPyodide({indexURL: INDEX}).then(async (engine) => {
      // Deprecation/Future warnings from third-party stack (Pyarrow becoming a
      // pandas requirement, seaborn's `palette`-without-`hue` deprecation) are
      // noise for learners — they'd render as red error lines. Filter them so
      // a successful cell shows clean stdout-only output.
      await engine.runPython('import warnings; warnings.filterwarnings("ignore")');
      return engine;
    });
  }
  return pyPromise;
}

// Datasets the course ships (public/datasets/*) are fetched into the Pyodide
// virtual filesystem before first run, so lesson code can do
// `open('slm-corpus.csv')` / `pd.read_csv(...)` the same way it would on disk.
// Only files actually referenced by the page's code are mounted. Mounted names
// are cached so each file is fetched once per page load.
let datasetManifest: Record<string, string> | null = null;
async function getDatasetManifest(): Promise<Record<string, string> | null> {
  if (datasetManifest) return datasetManifest;
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}datasets/index.json`);
    if (!res.ok) return null;
    datasetManifest = (await res.json()) as Record<string, string>;
  } catch (e) {
    console.warn('[datasetMount] failed to load manifest', e);
  }
  return datasetManifest;
}

// Pyodide runs each cell as a script, so a bare expression (`` 2 ** 10 ``,
// `` df.head() ``) silently produces nothing — while the identical cell in a
// Jupyter/Colab notebook echoes its value. Restore that REPL behavior: the
// cell's last top-level expression is wrapped in print(repr(...)), mirroring
// how a notebook displays a cell's trailing value. Detection is done with
// Python's own ast so assignments, control flow, def/class, and
// already-printing cells are never touched.
const WRAP_EXPR_SRC = `
import ast

def _wrap_bare_expr(src):
    try:
        tree = ast.parse(src)
    except SyntaxError:
        return src
    if not tree.body:
        return src
    node = tree.body[-1]
    if not isinstance(node, ast.Expr):
        return src
    value = node.value
    if (
        isinstance(value, ast.Call)
        and (
            (isinstance(value.func, ast.Name) and value.func.id in ('print', 'display'))
            or (isinstance(value.func, ast.Attribute) and value.func.attr in ('show', 'display'))
        )
    ):
        return src
    # Mirror how a Jupyter/Colab cell echoes its last expression: rerun the
    # cell but replace that trailing expression with print(repr(<expr>)).
    # repr() gives 'hello' with quotes and escapes for strings, plain text for
    # numbers and collections. Precise AST offsets keep same-line statements
    # ('x = 1; 2 + 3'), multi-line expressions, and trailing comments intact
    # (the comment lands on the line after the closing paren).
    lines = src.splitlines(keepends=True)
    start_off = sum(len(l) for l in lines[: node.lineno - 1]) + node.col_offset
    expr = ast.get_source_segment(src, node) or ''
    end_off = start_off + len(expr)
    return src[:start_off] + 'print(repr(\\n' + expr + '\\n))' + src[end_off:]
`;

// Pyodide ships matplotlib with a canvas backend (matplotlib-pyodide) that, on
// a real browser, renders `plt.show()` by appending a canvas to the bottom of
// the document — then closes the figure. That places the plot at the page
// bottom instead of in the cell, and closes figures before we can read them.
// Before each run we force matplotlib onto the compiled Agg backend: plt.show()
// becomes a no-op, no canvas reaches the page body, and every figure stays in
// the Gcf manager where the post-run drain collects it as an inline PNG.
const FIG_SHOW_PATCH_SRC = `
import sys as _sys
try:
    import matplotlib as _mpl
    try:
        _mpl.use('Agg')
    except Exception:
        pass
    # A previous cell may have died mid-figure (a NameError after
    # plt.subplots() leaves the figure in the Gcf manager; the failed run's
    # drain never runs). Detach those orphaned figures so THIS cell's drain
    # renders only the figures this cell actually created.
    _plt = _sys.modules.get('matplotlib.pyplot')
    if _plt is not None:
        import matplotlib._pylab_helpers as _gcf
        for _num in list(_plt.get_fignums()):
            _gcf.Gcf.figs.pop(_num, None)
except Exception:
    pass
`;

// After a cell run, collect every matplotlib figure the cell left open (Agg's
// plt.show() is a no-op, so figures stay managed) as base64 PNGs for JS to
// render inline. The figures are detached from the Gcf manager here so a
// re-run doesn't accumulate stale figures. Returns a JSON string (a PyProxy
// list does not survive the runPythonAsync boundary as a JS array).
const FIG_DRAIN_SRC = `
import sys as _sys
import io as _io
import base64 as _b64
def _drain_figs():
    _out = []
    _plt = _sys.modules.get('matplotlib.pyplot')
    if _plt is None:
        return '[]'
    import matplotlib._pylab_helpers as _gcf
    for _num in list(_plt.get_fignums()):
        _fig = _plt.figure(_num)
        _buf = _io.BytesIO()
        _fig.savefig(_buf, format='png', dpi=110, bbox_inches='tight')
        _out.append(_b64.b64encode(_buf.getvalue()).decode('ascii'))
        _gcf.Gcf.figs.pop(_num, None)
    import json as _dj
    return _dj.dumps(_out)
_drain_figs()
`;

// Run a cell against a Pyodide model, route script stdout/stderr to the
// output lines, and restore notebook-style `print(repr(...))` for trailing bare
// expressions. Resolves false when the code was refused (js/pyodide bridge) so
// callers can skip XP awards — a refused cell never ran, so it earns nothing.
// Exported for unit tests; initCell wires it to the DOM.
export interface CellRuntime {
  appendLine(kind: 'out' | 'err', text: string): void;
  /** Render a matplotlib figure captured after a successful cell run into the
   *  output panel. Optional so callers that only route text (unit tests) can
   *  omit it. */
  appendFigure?(pngB64: string): void;
  engine: PyodideModel;
  /** Concatenated source of every other runnable cell on the page, so a
   *  NameError can be distinguished from "that dataset was never loaded".
   *  Optional so unit tests can omit it. */
  otherCellSources?: string;
}

// Some lesson cells `import seaborn`, which is not a Pyodide wheel. seaborn is
// pure Python, so instead of rewriting the lessons we preload its Pyodide deps
// (numpy/pandas/matplotlib/scipy/statsmodels are all in the index) and install
// the vendored wheel from our own origin via micropip. scipy is also required
// at runtime, not just at import time: pandas' `corr(method="spearman")`
// imports it internally, so the deps are loaded once per page whenever ANY
// cell on the page needs the seaborn stack — not only the cell that imports it.
async function ensureExtraPackages(
  engine: PyodideModel,
  code: string,
  pageSource: string = '',
): Promise<void> {
  const source = pageSource ? `${pageSource}\n${code}` : code;
  for (const [pkg, wheelUrl] of Object.entries(EXTRA_PACKAGES)) {
    if (extraPackagesInstalled.has(pkg)) continue;
    if (!new RegExp(`import ${pkg}|from ${pkg}`).test(source)) continue;
    await engine.loadPackagesFromImports(`import ${EXTRA_PACKAGE_IMPORTS}`);
    await engine.runPythonAsync(`import micropip; await micropip.install(${JSON.stringify(wheelUrl)}, deps=False)`);
    extraPackagesInstalled.add(pkg);
  }
}
export async function runCellCode(code: string, rt: CellRuntime): Promise<boolean> {
  rt.engine.setStdout({batched: (s: string) => rt.appendLine('out', s)});
  rt.engine.setStderr({batched: (s: string) => rt.appendLine('err', s)});
  rt.engine.setStdin({stdin: () => window.prompt('') ?? ''});
  if (usesJsBridge(code)) {
    rt.appendLine('err', m.blocked_bridge());
    return false;
  }
  try {
    const pageSource = rt.otherCellSources ?? '';
    await ensureExtraPackages(rt.engine, code, pageSource);
    await rt.engine.loadPackagesFromImports(code);
    // Force matplotlib onto the compiled Agg backend *before* the cell's code
    // runs. matplotlib-pyodide's default canvas backend appends a <canvas> to
    // the bottom of the page on plt.show() and then closes the figure, so
    // without this the plots land at the page bottom and can't be drained.
    // Under Agg, plt.show() is a silent no-op and figures stay in the manager.
    await rt.engine.runPythonAsync(FIG_SHOW_PATCH_SRC);
    const toRun = await rt.engine.runPython(WRAP_EXPR_SRC + '_wrap_bare_expr');
    await rt.engine.runPythonAsync(toRun(code));
    // Drain every figure the cell left open, render each inline in the output
    // panel. Skipped on error — a failed cell renders its traceback, not
    // half-drawn figures.
    const pngsJson = (await rt.engine.runPythonAsync(FIG_DRAIN_SRC)) as string | undefined;
    const pngs = typeof pngsJson === 'string' ? (JSON.parse(pngsJson) as string[]) : undefined;
    if (Array.isArray(pngs) && pngs.length && rt.appendFigure) {
      for (const png of pngs) rt.appendFigure(png);
    }
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    let hint = friendlyError(raw);
    // A name that should exist but hasn't been created yet most often means the
    // dataset-loading cell at the top of the page hasn't been run. Point them
    // there only when the missing name is literally assigned by that cell —
    // `df = pd.read_csv(...)` — not for e.g. `np` or `plt` imports.
    const missing = raw.match(/NameError: name '([^']+)' is not defined/)?.[1];
    if (
      missing &&
      rt.otherCellSources &&
      new RegExp(`\\b${missing}\\s*=\\s*(?:pd\\.read_csv|open\\s*\\(\\s*['"][^'"]+\\.csv)`).test(rt.otherCellSources) &&
      !code.match(/pd\.read_csv\s*\(|open\s*\(\s*['"][^'"]+\.csv/)
    ) {
      hint += ` ${m.cell_load_dataset_first()}`;
    }
    rt.appendLine('err', hint);
  }
  return true;
}

// Award XP for completing a lesson run and report how much was gained and the
// pre-award balance (the first-success toast keys off xpBefore === 0).
export async function awardLessonXp(lessonId: string, reward?: number): Promise<{gained: number; xpBefore: number}> {
  const gs = await import('./gameState.ts');
  const xpBefore = gs.loadState().xp;
  gs.addXP(lessonId, reward);
  return {gained: gs.loadState().xp - xpBefore, xpBefore};
}

const mountedDatasets = new Set<string>();
async function mountDatasets(engine: PyodideModel): Promise<void> {
  const manifest = await getDatasetManifest();
  if (!manifest) return;
  const source = Array.from(document.querySelectorAll('[data-runnable] code'))
    .map((el) => el.textContent ?? '')
    .join('\n');
  for (const {ref, shipped} of planDatasetMounts(source, manifest)) {
    if (mountedDatasets.has(shipped)) continue;
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}datasets/${encodeURIComponent(shipped)}`);
      if (!res.ok) continue;
      const data = new Uint8Array(await res.arrayBuffer());
      // Pyodide starts in /home/pyodide — writing there (and at the root for
      // code that uses an absolute path) makes `open('name.csv')` work with a
      // bare filename, matching how the lesson cells reference it. Write under
      // both the shipped name and the reference, so `StudentsPerformance.csv`
      // vs `students-performance.csv` both work.
      engine.FS.writeFile(`/home/pyodide/${shipped}`, data);
      engine.FS.writeFile(`/${shipped}`, data);
      if (ref !== shipped) {
        engine.FS.writeFile(`/home/pyodide/${ref}`, data);
        engine.FS.writeFile(`/${ref}`, data);
      }
      mountedDatasets.add(shipped);
    } catch (e) {
      console.warn('[datasetMount] failed to mount', shipped, e);
    }
  }
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
    appendLine('cmd', '$ python');
    run.disabled = true;
    run.textContent = m.run_loading();
    run.classList.add('cell__run--loading');
    let engine: PyodideModel;
    window.dispatchEvent?.(new CustomEvent('pyodide:loading'));
    try {
      engine = await (deps.loadEngine ?? py)();
      window.dispatchEvent?.(new CustomEvent('pyodide:ready'));
    } catch (e) {
      window.dispatchEvent?.(new CustomEvent('pyodide:ready'));
      console.warn('[runnable-cell] failed to load Pyodide', e);
      appendLine('err', m.cell_engine_load_failed());
      run.textContent = m.run_button();
      run.disabled = false;
      run.classList.remove('cell__run--loading');
      return;
    }
    await mountDatasets(engine);
    const otherCellSources = Array.from(document.querySelectorAll('[data-runnable] code'))
      .filter((el) => el !== codeEl)
      .map((el) => el.textContent ?? '')
      .join('\n');
    const executed = await runCellCode(src, {appendLine, appendFigure, engine, otherCellSources});
    run.textContent = m.run_button();
    run.disabled = false;
    run.classList.remove('cell__run--loading');
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
  });
  clear.addEventListener('click', () => { lines.innerHTML = ''; out.hidden = true; clear.hidden = true; });

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
  document.addEventListener('DOMContentLoaded', () => {
    initRunnableCells();
  });
}