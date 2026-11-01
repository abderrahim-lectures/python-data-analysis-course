// Temporary harness: mounts one lesson's cells (from its markdown fences) so a
// browser can run every cell of every lesson.
import {initCell} from './src/lib/runnable-cell.client.ts';
import {LESSONS} from './cells-data.ts';

const index = Number(new URLSearchParams(location.search).get('lesson') ?? 0);
const lesson = LESSONS[index];
const host = document.getElementById('cells')!;
const cells: HTMLElement[] = [];

const el = (tag: string, cls?: string): HTMLElement => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  return n;
};

for (const src of lesson.cells) {
  const cell = el('div', 'cell');
  cell.setAttribute('data-runnable', '');
  const actions = el('div', 'cell__actions');
  const run = el('button', 'btn btn-primary cell__run');
  run.setAttribute('data-run', '');
  run.textContent = '▶ Run';
  actions.append(run);
  const pre = el('pre', 'cell__code');
  const code = document.createElement('code');
  code.textContent = src;
  pre.appendChild(code);
  const out = el('div', 'cell__output');
  out.setAttribute('data-output', '');
  out.hidden = true;
  const lines = el('div', 'cell__lines');
  lines.setAttribute('data-lines', '');
  const clear = el('button', 'cell__clear');
  clear.setAttribute('data-clear', '');
  clear.hidden = true;
  out.append(lines, clear);
  cell.append(actions, pre, out);
  host.appendChild(cell);
  initCell(cell, {});
  cells.push(cell);
}

(window as unknown as {__sweep: unknown}).__sweep = {
  lesson: lesson.path,
  count: cells.length,
  fields: (i: number) => cells[i].querySelectorAll('.cell__stdin-input').length,
  fill: (i: number, v: string) => {
    cells[i].querySelectorAll('.cell__stdin-input').forEach((n) => ((n as HTMLInputElement).value = v));
  },
  run: (i: number) => (cells[i].querySelector('[data-run]') as HTMLButtonElement).click(),
  done: (i: number) => {
    const btn = cells[i].querySelector('[data-run]') as HTMLButtonElement;
    return !btn.disabled && cells[i].querySelectorAll('.o-line').length > 0;
  },
  lines: (i: number) => [...cells[i].querySelectorAll('.o-line')].map((n) => ({
    kind: n.className.replace('o-line ', ''), text: n.textContent ?? '',
  })),
};
