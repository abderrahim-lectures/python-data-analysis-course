// Makes a runnable cell's code block an editor: contenteditable, Tab inserts
// four spaces, Ctrl/Cmd+Enter runs, a line-number gutter, and re-highlighting
// on every edit that preserves the caret.
//
// Extracted from runnable-cell.client.ts: this is pure DOM chrome over one
// <code> element and knows nothing about Pyodide, the worker or the cell's
// input form. The two things the runner cares about come back as callbacks.
import {highlightPython} from './pyHighlight.ts';

export interface CodeEditorOptions {
  /** After an edit: the cell re-syncs whatever depends on the source. */
  onEdit?(): void;
  /** Ctrl/Cmd+Enter, and nothing else — the Run button is the runner's. */
  onRun?(): void;
}

export function makeEditableCode(codeEl: HTMLElement, opts: CodeEditorOptions = {}): void {
  // Learners can edit the snippet in place before running it — this is the
  // "playground" part of a runnable cell, not just a static example.
  codeEl.setAttribute('contenteditable', 'plaintext-only' as string);
  codeEl.setAttribute('spellcheck', 'false');
  codeEl.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    document.execCommand('insertText', false, '    ');
  });
  codeEl.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      opts.onRun?.();
      return;
    }
    // Enter inserts the newline ourselves, like Tab inserts spaces. Left to the
    // browser, Firefox puts the caret *before* the newline it just added inside
    // the highlighted markup, so the next characters land on the previous line
    // ("a = 1b = 2" with an empty line below). insertText leaves the caret
    // after the text it inserted.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      document.execCommand('insertText', false, '\n');
    }
  });

  // Lesson cells arrive pre-highlighted by Shiki at build time; the playground
  // and any shared-code handoff arrive as plain text. Paint those on load too,
  // so highlighting isn't something that only appears after the first edit.
  if (!codeEl.querySelector('span')) {
    codeEl.innerHTML = highlightPython(codeEl.textContent ?? '');
  }

  // Line-number gutter — every cell gets one, not just the playground.
  // Inserted client-side rather than at build/markdown time so it works
  // uniformly for markdown-generated cells, <RunnableCell>, and the playground
  // alike.
  const gutter = document.createElement('span');
  gutter.className = 'cell__gutter';
  gutter.setAttribute('aria-hidden', 'true');
  codeEl.parentElement?.insertBefore(gutter, codeEl);
  const renumber = (): void => {
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
    const upToCaret = range.cloneRange();
    upToCaret.selectNodeContents(codeEl);
    upToCaret.setEnd(range.endContainer, range.endOffset);
    return upToCaret.toString().length;
  };
  const restoreCaret = (offset: number): void => {
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
    // A trailing newline needs somewhere for the caret to sit: inside a <pre>,
    // a caret cannot be placed after the last newline, so Firefox (and Chrome)
    // put it *before* it and the next characters land on the previous line
    // ("a = 1b = 2"). A trailing <br> gives it a home and costs no text.
    const src = codeEl.textContent ?? '';
    codeEl.innerHTML = highlightPython(src) + (src.endsWith('\n') ? '<br>' : '');
    restoreCaret(offset);
    renumber();
    opts.onEdit?.();
  });
}
