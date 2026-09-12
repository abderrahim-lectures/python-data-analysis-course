// Gated e2e: running a lesson cell over real Pyodide awards XP and fires
// lesson:complete. This is the browser-level validation of the runCellCode /
// awardLessonXp path extracted into runnable-cell.client.ts.
//
//   npm run dev                      # default port 4321
//   npm run test:lesson              # or: node tests/e2e/lesson-runtime.mjs
import {reset, goto, check, summary, evaluate, BASE} from './_harness.mjs';

console.log('lesson cell execution over Pyodide');

await goto('/learn/python-101/normal/lessons/01-printing');
await reset();

const cellInfo = await evaluate(`(() => ({
  hasCell: !!document.querySelector('[data-runnable]'),
  hasRun: !!document.querySelector('[data-runnable] [data-run]'),
  hasCode: !!document.querySelector('[data-runnable] code'),
  lessonId: document.querySelector('[data-lesson-id]')?.getAttribute('data-lesson-id') ?? null,
}))()`);
check('a runnable cell exists on the lesson', cellInfo.hasCell, true);
check('its Run button is present', cellInfo.hasRun, true);
check('its code block is present', cellInfo.hasCode, true);

// Count lesson:complete events dispatched from the cell.
await evaluate(`(() => {
  window.__completes = 0;
  window.addEventListener('lesson:complete', () => { window.__completes++; });
  1;
})()`);

const started = Date.now();
await evaluate('(document.querySelector("[data-runnable] [data-run]").click(), 1)');

// Pyodide downloads from the CDN on first run; give the engine a real window.
let kinds = await evaluate('[...document.querySelectorAll(".o-line")].map(l => l.className.replace("o-line ", ""))');
while (Date.now() - started < 120000 && (kinds.length === 0 || kinds[kinds.length - 1] === 'o-line--cmd')) {
  await new Promise(r => setTimeout(r, 1000));
  kinds = await evaluate('[...document.querySelectorAll(".o-line")].map(l => l.className.replace("o-line ", ""))');
}

check('output lines were produced', kinds.length > 1, true);
check('stdout was routed (out line last)', kinds[kinds.length - 1], 'o-line--out');
const err = await evaluate('[...document.querySelectorAll(".o-line--err")].map(l => l.textContent).join(" | ")');
check('no friendly-error was surfaced', err.length === 0, true);

const state = await evaluate('JSON.parse(localStorage.getItem("pda:state") || "null")');
check('XP was awarded for the run', Number(state?.xp) >= 5, true);
check('the lesson is recorded as run', state?.lessonsRun?.['python-101/normal/01-printing'], true);
check('lesson:complete fired', await evaluate('window.__completes'), 1);

summary();