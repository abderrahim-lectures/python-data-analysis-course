// Temporary: run one arbitrary snippet through the real cell runner (worker +
// engine + guard), so a browser can tell "blocked" from "ran".
import {initCell} from './src/lib/runnable-cell.client.ts';

const src = new TextDecoder().decode(Uint8Array.from(atob(new URLSearchParams(location.search).get('code') ?? ''), (c) => c.charCodeAt(0)));
const stage = document.getElementById('stage')!;
const el = (tag: string, cls?: string): HTMLElement => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  return n;
};
const cell = el('div', 'cell');
cell.setAttribute('data-runnable', '');
const actions = el('div', 'cell__actions');
const run = el('button', 'btn btn-primary cell__run');
run.setAttribute('data-run', '');
run.textContent = 'Run';
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
stage.appendChild(cell);
initCell(cell, {});
(window as unknown as {__probe: unknown}).__probe = {
  run: () => (cell.querySelector('[data-run]') as HTMLButtonElement).click(),
  done: () => !(cell.querySelector('[data-run]') as HTMLButtonElement).disabled && cell.querySelectorAll('.o-line').length > 0,
  lines: () => [...cell.querySelectorAll('.o-line')].map((n) => ({kind: n.className.replace('o-line ', ''), text: n.textContent ?? ''})),
};
