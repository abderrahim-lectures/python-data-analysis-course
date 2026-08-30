// End-to-end smoke test driven over the Chrome DevTools Protocol using Node's
// built-in WebSocket — no Playwright/Puppeteer dependency.
//
//   npm run dev                      # in one terminal (default port 4321)
//   npm run test:e2e                 # in another
//
// Override with BASE_URL / CDP_PORT. Chrome is launched and torn down here.
import {spawn} from 'node:child_process';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://localhost:4321';
const PORT = Number(process.env.CDP_PORT ?? 9333);
const CHROME = process.env.CHROME_BIN ?? 'google-chrome';

const profile = mkdtempSync(join(tmpdir(), 'pyda-e2e-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, 'about:blank',
], {stdio: 'ignore'});

const cleanup = () => {
  chrome.kill();
  try { rmSync(profile, {recursive: true, force: true}); } catch { /* best effort */ }
};
process.on('exit', cleanup);

async function waitFor(fn, label, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try { return await fn(); } catch { await new Promise(r => setTimeout(r, 500)); }
  }
  throw new Error(`timed out waiting for ${label}`);
}

await waitFor(() => fetch(`http://127.0.0.1:${PORT}/json/version`).then(r => r.ok || Promise.reject()), 'chrome');
await waitFor(() => fetch(BASE).then(r => r.ok || Promise.reject()), `dev server at ${BASE}`);

const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));

let id = 0;
const pending = new Map();
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
const send = (method, params = {}) => new Promise(res => {
  const n = ++id;
  pending.set(n, res);
  ws.send(JSON.stringify({id: n, method, params}));
});

await send('Page.enable');
await send('Runtime.enable');

const evaluate = async (expr) => {
  const r = await send('Runtime.evaluate', {
    expression: `(() => { try { return JSON.stringify(${expr}); } catch (e) { return JSON.stringify('ERR: ' + e.message); } })()`,
    awaitPromise: true, returnByValue: true,
  });
  const v = r.result?.result?.value;
  return v === undefined ? undefined : JSON.parse(v);
};

async function goto(path) {
  await send('Page.navigate', {url: BASE + path});
  for (let i = 0; i < 100; i++) {
    if (await evaluate('document.readyState') === 'complete') break;
    await new Promise(r => setTimeout(r, 100));
  }
  await new Promise(r => setTimeout(r, 400));
}

const results = [];
const check = (name, actual, expected) => {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  results.push({name, pass});
  console.log(`${pass ? '  ok  ' : ' FAIL '} ${name}`);
  if (!pass) console.log(`        expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
};

const reset = () => evaluate('(localStorage.clear(), 1)');

console.log('\nlesson completion');
await goto('/progress');
await reset();
await goto('/learn/python-101/normal/week-2');
check('a mid-track week offers a completion button', await evaluate('!!document.querySelector("[data-mark-complete]")'), true);
check('it starts enabled', await evaluate('document.querySelector("[data-mark-complete]").disabled'), false);

await evaluate('(document.querySelector("[data-mark-complete]").click(), 1)');
await new Promise(r => setTimeout(r, 300));
check('clicking it marks the lesson done', await evaluate('document.querySelector("[data-mark-complete]").disabled'), true);
check('XP is awarded', await evaluate('JSON.parse(localStorage.getItem("pda:state")).xp'), 20);
check('the streak starts at 1, not 0', await evaluate('JSON.parse(localStorage.getItem("pda:state")).streak'), 1);

await goto('/learn/python-101/normal/week-2');
check('completion survives a reload', await evaluate('document.querySelector("[data-mark-complete]").disabled'), true);

console.log('\nprogress page reflects it');
await goto('/progress');
check('the completed week lights up', await evaluate('document.querySelector(\'.stations[data-track="python-101"] li[data-week="2"]\').classList.contains("station--done")'), true);
check('an untouched week stays dark', await evaluate('document.querySelector(\'.stations[data-track="python-101"] li[data-week="3"]\').classList.contains("station--done")'), false);
check('the track counter advances', await evaluate('document.getElementById("pct-python-101").textContent'), '1/5 done');
check('the streak is no longer stuck at 0', await evaluate('document.getElementById("p-streak").textContent'), '1🔥');
// 2, not 3: "First run" is for running a code cell, which this path never did.
check('quests are no longer 0/11', await evaluate('document.getElementById("p-quests").textContent'), '2/11');

console.log('\nlegacy state repair');
// The shape earlier builds left behind: real XP, but a dead streak and no quests.
await evaluate(`(localStorage.setItem('pda:state', JSON.stringify({
  xp:20, lessonsCompleted:{'python-101/normal/week-2':true},
  lessonsRun:{'python-101/normal/week-2':true},
  quizCorrect:0,quizTotal:0,streak:0,bestStreak:0,lastActive:'',quests:{},badges:[]
})),1)`);
await goto('/progress');
check('earned XP is preserved', await evaluate('document.getElementById("xpbar-text").textContent'), '20 XP');
check('the dead streak is repaired', await evaluate('document.getElementById("p-streak").textContent'), '1🔥');
check('missing quests are backfilled', await evaluate('document.getElementById("p-quests").textContent'), '3/11');

console.log('\nplayground safety');
await goto(`/playground?code=${encodeURIComponent('print("hi")')}`);
check('shared code loads into the editor', await evaluate('document.getElementById("pg-code").textContent'), 'print("hi")');
check('it is flagged untrusted', await evaluate('!document.getElementById("pg-warn").hidden'), true);
check('Run is blocked until reviewed', await evaluate('document.querySelector("[data-run]").disabled'), true);
await evaluate('(document.getElementById("pg-trust").click(), 1)');
check('Run unlocks after review', await evaluate('document.querySelector("[data-run]").disabled'), false);

await goto('/playground');
check('no warning without a shared link', await evaluate('document.getElementById("pg-warn").hidden'), true);
check('Run is enabled normally', await evaluate('document.querySelector("[data-run]").disabled'), false);

console.log('\npages render');
for (const path of ['/', '/progress', '/playground', '/projects', '/learn', '/learn/python-101/normal/week-1']) {
  await goto(path);
  check(`${path} renders a heading`, await evaluate('!!document.querySelector("h1")'), true);
}

console.log('\nonboarding');
await goto('/');
await evaluate('(localStorage.clear(), 1)');
await goto('/');
check('shows on a first visit', await evaluate('!document.getElementById("onboarding").hidden'), true);
check('is a labelled dialog', await evaluate('document.getElementById("onboarding").getAttribute("role")'), 'dialog');
check('moves focus into the dialog', await evaluate('document.getElementById("onboarding").contains(document.activeElement)'), true);
await evaluate('(document.getElementById("onboarding-start").click(), 1)');
check('dismisses on the CTA', await evaluate('document.getElementById("onboarding").hidden'), true);
check('remembers the dismissal', await evaluate('localStorage.getItem("pda:onboarded")'), '1');

await goto('/progress');
check('does not reappear for a returning visitor', await evaluate('document.getElementById("onboarding").hidden'), true);

await evaluate('(localStorage.clear(), 1)');
await goto('/');
await evaluate(`(document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'})), 1)`);
check('closes on Escape', await evaluate('document.getElementById("onboarding").hidden'), true);

await evaluate('(localStorage.clear(), 1)');
await goto('/?onboarded=1');
check('the ?onboarded= escape hatch suppresses it', await evaluate('document.getElementById("onboarding").hidden'), true);

const failed = results.filter(r => !r.pass).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
ws.close();
cleanup();
process.exit(failed ? 1 : 0);
