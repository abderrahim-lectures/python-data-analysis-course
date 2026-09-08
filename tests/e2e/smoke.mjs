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
// The onboarding dialog is gated on pda:onboarded — after the reset above it
// would re-appear on the next navigation and swallow the completion clicks.
await evaluate('(localStorage.setItem("pda:onboarded", "1"), 1)');
await goto('/learn/python-101/normal/lessons/02-variables');
check('a mid-track lesson offers a completion button', await evaluate('!!document.querySelector("[data-mark-complete]")'), true);
check('it starts enabled', await evaluate('document.querySelector("[data-mark-complete]").disabled'), false);

await evaluate('(document.querySelector("[data-mark-complete]").click(), 1)');
await new Promise(r => setTimeout(r, 300));
check('clicking it marks the lesson done', await evaluate('document.querySelector("[data-mark-complete]").disabled'), true);
check('XP is awarded', await evaluate('JSON.parse(localStorage.getItem("pda:state")).xp'), 60);
check('the streak starts at 1, not 0', await evaluate('JSON.parse(localStorage.getItem("pda:state")).streak'), 1);

await goto('/learn/python-101/normal/lessons/02-variables');
check('completion survives a reload', await evaluate('document.querySelector("[data-mark-complete]").disabled'), true);

console.log('\nprogress page reflects it');
await goto('/progress');
// Note: python-101 has 7 modules, trackProgress counts unique lessons
check('the track counter advances', await evaluate('document.getElementById("pct-python-101").textContent'), '1/7 done');
check('the streak is no longer stuck at 0', await evaluate('document.getElementById("p-streak").textContent'), '1🔥');
check('quests are no longer 0/32', await evaluate('document.getElementById("p-quests").textContent'), '2/32');

console.log('\nlegacy state repair');
// The shape earlier builds left behind: real XP, but a dead streak and no quests.
await evaluate(`(localStorage.setItem('pda:state', JSON.stringify({
  xp:150, lessonsCompleted:{'python-101/normal/02-variables':true},
  lessonsRun:{'python-101/normal/02-variables':true},
  quizCorrect:0,quizTotal:0,streak:0,bestStreak:0,lastActive:'',quests:{},badges:[]
})),1)`);
await goto('/progress');
check('earned XP is preserved', await evaluate('document.getElementById("xpbar-text").textContent'), '175 XP');
check('the dead streak is repaired', await evaluate('document.getElementById("p-streak").textContent'), '1🔥');
check('missing quests are backfilled', await evaluate('document.getElementById("p-quests").textContent'), '4/32');

console.log('\nweek-model parity');
// Complete all 7 python lessons + 2 data lessons: python stations 1-7 must
// light (previously capped at 5) and data must count 2/5, with per-station
// done state matching trackProgress on both server and client.
const fullState = JSON.stringify({
  xp: 700,
  lessonsCompleted: {
    'python-101/normal/01-printing': true, 'python-101/normal/02-variables': true,
    'python-101/normal/03-control-flow': true, 'python-101/normal/04-functions': true,
    'python-101/normal/05-strings': true, 'python-101/normal/06-data-structures': true,
    'python-101/normal/07-file-io': true,
    'data-analysis/normal/05-titanic-eda': true,
    'data-analysis/normal/04-groupby-aggregation': true,
  },
  lessonsRun: {
    'python-101/normal/01-printing': true, 'python-101/normal/02-variables': true,
    'python-101/normal/03-control-flow': true, 'python-101/normal/04-functions': true,
    'python-101/normal/05-strings': true, 'python-101/normal/06-data-structures': true,
    'python-101/normal/07-file-io': true,
    'data-analysis/normal/05-titanic-eda': true,
    'data-analysis/normal/04-groupby-aggregation': true,
  },
  quizCorrect: 0, quizTotal: 0, streak: 3, bestStreak: 3, lastActive: '',
  quests: {}, badges: [],
});
await evaluate(`(localStorage.setItem('pda:state', '${fullState}'), 1)`);
await goto('/progress');
check('all 7 python stations light', await evaluate('document.querySelector(".stations[data-track=\'python-101\'] li[data-week=\'7\']").classList.contains("station--done")'), true);
check('python track reports 7/7 done', await evaluate('document.getElementById("pct-python-101").textContent'), '7/7 done');
check('data track counts progressive done', await evaluate('document.getElementById("pct-data-analysis").textContent'), '2/5 done');
check('data stations beyond done stay dim', await evaluate('document.querySelector(".stations[data-track=\'data-analysis\'] li[data-week=\'3\']").classList.contains("station--done")'), false);
await evaluate('(localStorage.setItem("pda:state", JSON.stringify({xp:0,lessonsCompleted:{},lessonsRun:{},quizCorrect:0,quizTotal:0,streak:0,bestStreak:0,lastActive:\'\',quests:{},badges:[]})),1)');

console.log('\nplayground');
await goto('/playground');
check('Run is enabled with the starter code', await evaluate('document.querySelector("[data-run]").disabled'), false);

console.log('\npages render');
for (const path of ['/', '/progress', '/playground', '/projects', '/learn', '/learn/python-101/normal/lessons/01-printing']) {
  await goto(path);
  check(`${path} renders a heading`, await evaluate('!!document.querySelector("h1")'), true);
}

console.log('\nprojects search and filter');
await goto('/projects');
// The project set, and the per-tag counts, grow as course content expands —
// derive the totals from the live grid rather than hardcoding them so this
// section checks the mechanism instead of drifting with the catalog.
const totalText = await evaluate('document.getElementById("project-count").textContent');
const totalMatches = totalText.match(/(\d+) of (\d+) projects/);
if (!totalMatches) throw new Error(`unexpected count text: ${totalText}`);
const total = Number(totalMatches[2]);
check('starts showing every project', totalMatches[1], String(total));
const gridCount = async () => await evaluate('document.querySelectorAll("#project-grid [data-project]:not([hidden])").length');
await evaluate(`((() => { const el = document.getElementById('project-search'); el.value = 'wordle'; el.dispatchEvent(new Event('input', {bubbles:true})); })(), 1)`);
check('search narrows to a single match', await evaluate('document.getElementById("project-count").textContent'), `1 of ${total} projects`);
check('the empty state stays hidden with a real match', await evaluate('document.getElementById("project-empty").hidden'), true);
check('the query lands in the URL', await evaluate('location.search'), '?q=wordle');
await evaluate(`((() => { const el = document.getElementById('project-search'); el.value = 'zzz-no-such-project'; el.dispatchEvent(new Event('input', {bubbles:true})); })(), 1)`);
check('a non-matching search shows the empty state', await evaluate('!document.getElementById("project-empty").hidden'), true);
await evaluate(`((() => { const el = document.getElementById('project-search'); el.value = ''; el.dispatchEvent(new Event('input', {bubbles:true})); })(), 1)`);
await evaluate('(document.querySelector(\'[data-tag="AI Agents"]\').click(), 1)');
await new Promise((r) => setTimeout(r, 300));
const tagText = await evaluate('document.getElementById("project-count").textContent');
const tagCount = Number((tagText.match(/(\d+) of (\d+) projects/) ?? [])[1]);
check('the tag filter narrows the grid', tagText, `${tagCount} of ${total} projects`);
check('the narrowed grid shows exactly that many cards', await gridCount(), tagCount);
check('the tag lands in the URL', await evaluate('location.search'), '?tag=AI+Agents');
const filteredUrl = await evaluate('location.href');
await goto(filteredUrl.replace(/^https?:\/\/[^/]+/, ''));
check('the tag filter survives a reload from the URL', await evaluate('document.getElementById("project-count").textContent'), `${tagCount} of ${total} projects`);
check('the reloaded tag pill is marked active', await evaluate('document.querySelector(\'[data-tag="AI Agents"]\').classList.contains("is-active")'), true);

console.log('\nthe ⛶ expand button hands code to the playground');
  // Shared code travels as a gzip+base64url path segment (/playground/<code>),
  // not a query string: the site is fully static, so this resolves through
  // 404.astro's client-side fallback rather than a real server route.
  await goto('/learn/python-101/normal/lessons/01-printing');
  const hasExpand = await evaluate('!!document.querySelector("[data-expand]")');
  if (hasExpand) {
    await evaluate('(document.querySelector("[data-expand]").click(), 1)');
    await new Promise(r => setTimeout(r, 1500));
    check('lands on a /playground/<code> path, not a query string', await evaluate('location.pathname.includes("/playground/") && !location.search'), true);
    check('Run is enabled for the shared code', await evaluate('document.querySelector("[data-run]").disabled'), false);
    check('the "not found" message is hidden for a valid share link', await evaluate('document.getElementById("notfound").hidden'), true);
  } else {
    console.log('  skip  expand button test (no runnable cell in this lesson)');
  }

console.log('\na real 404 still shows a real 404');
await goto('/this-page-does-not-exist-xyz');
check('shows the not-found message', await evaluate('!document.getElementById("notfound").hidden'), true);
check('playground section stays hidden', await evaluate('document.getElementById("pg-section").hidden'), true);

console.log('\na malformed /playground/<code> fails closed');
await goto('/playground/not-valid-base64url!!!');
check('shows the not-found message, not a broken editor', await evaluate('!document.getElementById("notfound").hidden'), true);

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
