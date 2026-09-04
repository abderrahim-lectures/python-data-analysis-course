// @ts-nocheck
import {highlightPython} from './pyHighlight.ts';
// Hydrates every `.cell[data-runnable]` on the page (whether hand-authored via
// <RunnableCell> or generated from ```python fences by rehype-runnable-python)
// with a Pyodide-backed Run button. Loaded once per page from Base.astro.
import {usesJsBridge} from './pythonGuard.ts';
import {encodeShareCode} from './codeShare.ts';

const PYODIDE_VERSION = '0.26.4';
const INDEX = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
let pyPromise: Promise<any> | null = null;

async function py() {
  if (!pyPromise) {
    const mod = await import(/* @vite-ignore */ `${INDEX}pyodide.mjs`);
    pyPromise = mod.loadPyodide({indexURL: INDEX});
  }
  return pyPromise;
}

const BEGINNER_ERRORS: Record<string, string> = {
  'SyntaxError: invalid syntax': "Python can't understand that line. Check for missing colons (:), unmatched parentheses, or quotes.",
  'TypeError: can only concatenate': "You're trying to add text and a number. Use str() to convert the number first.",
  'NameError: name': "Python doesn't recognize that name. Did you spell it correctly? Names are case-sensitive.",
  'IndentationError: unexpected indent': "Python uses indentation. Check your spaces vs tabs — be consistent.",
  'IndentationError: expected an indented block': "After a colon (:), the next line must be indented.",
  'ZeroDivisionError': "You can't divide by zero. Check your denominator.",
  'ValueError: invalid literal for int()': "Can't convert that to a number. Make sure it's digits only.",
  'ModuleNotFoundError': "This package isn't available in the browser. Try importing built-in Python modules only.",
};
function friendlyError(msg: string): string {
  for (const [pattern, hint] of Object.entries(BEGINNER_ERRORS)) {
    if (msg.includes(pattern)) return hint;
  }
  return msg;
}

function initCell(cell: Element) {
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
  const expand = cell.querySelector('[data-expand]') as HTMLButtonElement | null;
  const out = cell.querySelector('[data-output]') as HTMLElement | null;
  const lines = cell.querySelector('[data-lines]') as HTMLElement | null;
  const clear = cell.querySelector('[data-clear]') as HTMLButtonElement | null;
  const codeEl = cell.querySelector('code');
  if (!run || !out || !lines || !clear || !codeEl) return;

  expand?.addEventListener('click', async () => {
    const src = codeEl.textContent ?? '';
    const packed = await encodeShareCode(src);
    // Remember which cell the user was on so we can scroll back to it.
    const allCells = Array.from(document.querySelectorAll('[data-runnable]'));
    const idx = allCells.indexOf(cell);
    try { sessionStorage.setItem('pg:returnCell', String(idx)); } catch {}
    window.location.href = `${import.meta.env.BASE_URL}playground/${packed}`;
  });

  const appendLine = (kind: string, text: string) => {
    const d = document.createElement('div');
    d.className = `o-line o-line--${kind}`;
    d.textContent = text;
    lines.appendChild(d);
  };

  run.addEventListener('click', async () => {
    if (run.disabled) return;
    const src = codeEl.textContent ?? '';
    out.hidden = false;
    clear.hidden = false;
    lines.innerHTML = '';
    appendLine('cmd', '$ python');
    run.disabled = true;
    run.textContent = '⟳ Loading…';
    run.classList.add('cell__run--loading');
    const engine = await py();
    run.textContent = '▶ Run';
    run.disabled = false;
    run.classList.remove('cell__run--loading');
    engine.setStdout({batched: (s: string) => appendLine('out', s)});
    engine.setStderr({batched: (s: string) => appendLine('err', s)});
    engine.setStdin({stdin: () => window.prompt('') ?? ''});
    try {
      if (usesJsBridge(src)) {
        appendLine('err', "Blocked: the 'js' and 'pyodide' bridge modules are disabled here.");
        return;
      }
      await engine.loadPackagesFromImports(src);
      await engine.runPythonAsync(src);
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      const friendly = friendlyError(raw);
      appendLine('err', friendly);
    }
    if (!awarded && lessonId) {
      awarded = true;
      try {
        const m = await import('./gameState.ts');
        const prevXp = m.read().xp;
        m.addXP(lessonId);
        const gained = m.read().xp - prevXp;
        cell.dispatchEvent(new CustomEvent('lesson:complete', {bubbles: true, detail: {lessonId, xp: gained}}));
        if (prevXp === 0) {
          const style = document.createElement('style');
          style.textContent = `.firstsuccess-toast{position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%) translateY(20px);background:var(--accent);color:var(--accent-contrast);padding:.85rem 1.5rem;border-radius:var(--radius-lg);font-weight:700;font-size:.9rem;box-shadow:var(--shadow-md);opacity:0;transition:all .4s cubic-bezier(.4,0,.2,1);z-index:9999;pointer-events:none;white-space:nowrap}.firstsuccess-toast--visible{opacity:1;transform:translateX(-50%) translateY(0)}`;
          document.head.appendChild(style);
          const toast = document.createElement('div');
          toast.className = 'firstsuccess-toast';
          toast.textContent = '🎉 First success! You just ran Python in the browser.';
          document.body.appendChild(toast);
          requestAnimationFrame(() => toast.classList.add('firstsuccess-toast--visible'));
          setTimeout(() => { toast.classList.remove('firstsuccess-toast--visible'); setTimeout(() => toast.remove(), 400); }, 3000);
          setTimeout(() => style.remove(), 3500);
        }
      } catch { /* offline: skip XP award */ }
    }
  });
  clear.addEventListener('click', () => { lines.innerHTML = ''; out.hidden = true; clear.hidden = true; });

  // Copy output button.
  const copyBtn = document.createElement('button');
  copyBtn.className = 'btn btn-ghost btn-sm cell__copy';
  copyBtn.textContent = '📋 Copy';
  copyBtn.addEventListener('click', () => {
    const text = lines.textContent ?? '';
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.textContent = '✓ Copied!';
      setTimeout(() => { copyBtn.textContent = '📋 Copy'; }, 1500);
    }).catch(() => {});
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

  // Loading spinner styles.
  const spinnerStyle = document.createElement('style');
  spinnerStyle.textContent = `.cell__run--loading{opacity:.7;cursor:wait}.cell__run--loading::after{content:' ⟳';animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.cell__copy{margin-left:.5rem!important}`;
  document.head.appendChild(spinnerStyle);

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

export function initRunnableCells(root: ParentNode = document) {
  root.querySelectorAll('[data-runnable]').forEach(initCell);
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initRunnableCells();
    // After returning from the playground, scroll to the cell the user was on.
    try {
      const idx = sessionStorage.getItem('pg:returnCell');
      if (idx !== null) {
        sessionStorage.removeItem('pg:returnCell');
        const cells = document.querySelectorAll('[data-runnable]');
        const cell = cells[parseInt(idx, 10)];
        if (cell) {
          requestAnimationFrame(() => cell.scrollIntoView({behavior: 'smooth', block: 'center'}));
        }
      }
    } catch {}
    // Preload Pyodide immediately on DOMContentLoaded so the first Run click is instant.
    const preload = () => py();
    preload();
  });
}
