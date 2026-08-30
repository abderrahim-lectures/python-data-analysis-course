// WCAG AA contrast audit across the main pages, in both themes.
// Composites translucent colours over their ancestors and skips elements
// painted over a gradient (where a single background colour is meaningless),
// so it reports real failures rather than measurement artifacts.
//
//   npm run test:contrast          (needs the dev server running)
import {spawn} from 'node:child_process';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://localhost:4321';
const PORT = Number(process.env.CDP_PORT ?? 9342);
const CHROME = process.env.CHROME_BIN ?? 'google-chrome';

const profile = mkdtempSync(join(tmpdir(), 'pyda-contrast-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, 'about:blank',
], {stdio: 'ignore'});
const cleanup = () => {
  chrome.kill();
  try { rmSync(profile, {recursive: true, force: true}); } catch { /* best effort */ }
};
process.on('exit', cleanup);

async function waitFor(fn, label) {
  for (let i = 0; i < 60; i++) {
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
  const n = ++id; pending.set(n, res);
  ws.send(JSON.stringify({id: n, method, params}));
});
await send('Page.enable');
await send('Runtime.enable');

const evaluate = async (expr) => {
  const r = await send('Runtime.evaluate', {expression: `JSON.stringify(${expr})`, awaitPromise: true, returnByValue: true});
  const v = r.result?.result?.value;
  if (v === undefined) throw new Error('evaluate returned nothing (page target lost?)');
  return JSON.parse(v);
};
async function goto(path) {
  await send('Page.navigate', {url: BASE + path});
  for (let i = 0; i < 80; i++) {
    if (await evaluate('document.readyState') === 'complete') break;
    await new Promise(r => setTimeout(r, 100));
  }
  await new Promise(r => setTimeout(r, 400));
}

const AUDIT = `(() => {
  const num = s => (s.match(/[\\d.]+/g) || [0,0,0,1]).map(Number);
  const lin = v => { v /= 255; return v <= .03928 ? v/12.92 : Math.pow((v+.055)/1.055, 2.4); };
  const L = ([r,g,b]) => .2126*lin(r) + .7152*lin(g) + .0722*lin(b);
  function bgOf(el) {
    let acc = null;
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return null;
      const c = num(cs.backgroundColor);
      const a = c[3] === undefined ? 1 : c[3];
      if (a === 0) continue;
      if (acc === null) acc = [c[0], c[1], c[2], a];
      if (a === 1) return acc.slice(0,3).map((v,i) => Math.round(acc[3]*v + (1-acc[3])*c[i]));
    }
    return acc ? acc.slice(0,3) : [255,255,255];
  }
  const out = [];
  for (const el of document.querySelectorAll('h1,h2,h3,p,a,span,button,li,small,strong,td,th,label')) {
    if (el.children.length || !el.textContent.trim()) continue;
    if (!el.getClientRects().length) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.opacity === '0') continue;
    const bg = bgOf(el);
    if (!bg) continue;
    const fc = num(cs.color);
    const fa = fc[3] === undefined ? 1 : fc[3];
    const fg = [0,1,2].map(i => Math.round(fa*fc[i] + (1-fa)*bg[i]));
    const ratio = (Math.max(L(fg), L(bg)) + .05) / (Math.min(L(fg), L(bg)) + .05);
    const size = parseFloat(cs.fontSize);
    const need = (size >= 24 || (size >= 18.66 && parseInt(cs.fontWeight) >= 700)) ? 3 : 4.5;
    if (ratio < need - 0.01) out.push({t: el.textContent.trim().slice(0,34), ratio: +ratio.toFixed(2), need, sel: el.className || el.tagName, fg: 'rgb('+fg.join(',')+')', bg: 'rgb('+bg.join(',')+')'});
  }
  const seen = new Set();
  return out.filter(o => { const k = o.t + o.ratio; if (seen.has(k)) return false; seen.add(k); return true; });
})()`;

const PAGES = [
  '/?onboarded=1', '/progress?onboarded=1', '/learn?onboarded=1',
  '/projects?onboarded=1', '/playground?onboarded=1',
  // Lesson + project bodies carry admonitions, quizzes and code cells whose
  // colours appear nowhere else — H1 (green-as-text) hid here.
  '/learn/python-101/normal/week-1?onboarded=1',
  '/learn/python-101/hard/week-1?onboarded=1',
  '/projects/wordle-clone?onboarded=1',
];
let total = 0;
for (const theme of ['light', 'dark']) {
  await goto('/?onboarded=1');
  await evaluate(`(localStorage.setItem('pda:theme','${theme}'), 1)`);
  console.log(`\n--- ${theme} ---`);
  for (const path of PAGES) {
    await goto(path);
    const bad = await evaluate(AUDIT);
    if (bad.length) {
      total += bad.length;
      console.log(`  ${path}`);
      for (const b of bad) console.log(`    ${b.ratio} < ${b.need}   ${JSON.stringify(b.t)}  [${b.sel}] ${b.fg} on ${b.bg}`);
    } else {
      console.log(`  ok  ${path}`);
    }
  }
}
console.log(`\n${total} contrast failure(s)`);
ws.close();
cleanup();
process.exit(total ? 1 : 0);
