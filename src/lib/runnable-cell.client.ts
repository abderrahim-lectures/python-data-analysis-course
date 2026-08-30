// @ts-nocheck
// Hydrates every `.cell[data-runnable]` on the page (whether hand-authored via
// <RunnableCell> or generated from ```python fences by rehype-runnable-python)
// with a Pyodide-backed Run button. Loaded once per page from Base.astro.
import {usesJsBridge} from './pythonGuard.ts';

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

  expand?.addEventListener('click', () => {
    const src = codeEl.textContent ?? '';
    window.location.href = `${import.meta.env.BASE_URL}playground?code=${encodeURIComponent(src)}`;
  });

  const appendLine = (kind: string, text: string) => {
    const d = document.createElement('div');
    d.className = `o-line o-line--${kind}`;
    d.textContent = text;
    lines.appendChild(d);
  };

  run.addEventListener('click', async () => {
    // Read live, in case the learner edited the code in place before running.
    const src = codeEl.textContent ?? '';
    if (cell.hasAttribute('data-untrusted')) return;
    out.hidden = false;
    clear.hidden = false;
    lines.innerHTML = '';
    appendLine('cmd', '$ python');
    const engine = await py();
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
      appendLine('err', e instanceof Error ? e.message : String(e));
    }
    if (!awarded && lessonId) {
      awarded = true;
      try {
        const m = await import('./gameState.ts');
        const xp = m.addXP(lessonId);
        const t = document.createElement('div');
        t.className = 'rctoast';
        t.textContent = `⚡ +${xp} XP`;
        t.style.cssText = 'position:fixed;z-index:9999;left:50%;top:50%;transform:translate(-50%,-50%) scale(.9);background:linear-gradient(135deg,#5b21b6,#4c1d95);color:#fff;padding:.5rem 1.2rem;border-radius:999px;font-weight:800;font-size:.95rem;box-shadow:0 6px 24px rgba(91,33,182,.45);pointer-events:none;';
        document.body.appendChild(t);
        requestAnimationFrame(() => {
          t.style.transition = 'all .7s cubic-bezier(.22,.61,.36,1)';
          t.style.transform = 'translate(-50%,-70%) scale(1.05)';
          t.style.opacity = '0';
        });
        setTimeout(() => t.remove(), 900);
        cell.dispatchEvent(new CustomEvent('lesson:complete', {bubbles: true, detail: {lessonId, xp}}));
        document.dispatchEvent(new CustomEvent('lesson:complete'));
      } catch { /* offline: skip XP award */ }
    }
  });
  clear.addEventListener('click', () => { lines.innerHTML = ''; out.hidden = true; clear.hidden = true; });

  // Learners can edit the snippet in place before running it — this is the
  // "playground" part of a runnable cell, not just a static example.
  codeEl.setAttribute('contenteditable', 'plaintext-only' as string);
  codeEl.setAttribute('spellcheck', 'false');
  codeEl.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    document.execCommand('insertText', false, '    ');
  });
}

export function initRunnableCells(root: ParentNode = document) {
  root.querySelectorAll('[data-runnable]').forEach(initCell);
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => initRunnableCells());
}
