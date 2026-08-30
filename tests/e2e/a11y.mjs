// Structural accessibility audit: heading structure, landmarks, accessible
// names, and a keyboard-driven focus-visible check.
//
//   npm run test:a11y             (needs the dev server running)
//
// Focus is checked by dispatching real Tab keys, not element.focus():
// Chrome does not apply :focus-visible to programmatic focus on links, so a
// naive check reports every link as having no focus ring.
import {spawn} from 'node:child_process';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://localhost:4321';
const PORT = Number(process.env.CDP_PORT ?? 9364);
const CHROME = process.env.CHROME_BIN ?? 'google-chrome';

const profile = mkdtempSync(join(tmpdir(), 'pyda-a11y-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, 'about:blank',
], {stdio: 'ignore'});
const cleanup = () => {
  chrome.kill();
  try { rmSync(profile, {recursive: true, force: true}); } catch { /* best effort */ }
};
process.on('exit', cleanup);

const waitFor = async (fn, label) => {
  for (let i = 0; i < 60; i++) {
    try { return await fn(); } catch { await new Promise(r => setTimeout(r, 500)); }
  }
  throw new Error(`timed out waiting for ${label}`);
};
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
  if (v === undefined) throw new Error('evaluate returned nothing');
  return JSON.parse(v);
};
async function goto(path) {
  await send('Page.navigate', {url: BASE + path});
  for (let i = 0; i < 80; i++) {
    if (await evaluate('document.readyState') === 'complete') break;
    await new Promise(r => setTimeout(r, 100));
  }
  await new Promise(r => setTimeout(r, 350));
}
const tab = async () => {
  for (const type of ['rawKeyDown', 'keyUp']) {
    await send('Input.dispatchKeyEvent', {type, windowsVirtualKeyCode: 9, key: 'Tab', code: 'Tab'});
  }
  await new Promise(r => setTimeout(r, 50));
};

const PAGES = [
  '/?onboarded=1', '/progress?onboarded=1', '/learn?onboarded=1',
  '/projects?onboarded=1', '/playground?onboarded=1',
  '/learn/python-101/normal/week-1?onboarded=1', '/projects/wordle-clone?onboarded=1',
];

let issues = 0;
for (const path of PAGES) {
  await goto(path);
  const r = await evaluate(`(() => {
    const hs = [...document.querySelectorAll('h1,h2,h3,h4')].map(h => +h.tagName[1]);
    const jumps = [];
    for (let i = 1; i < hs.length; i++) if (hs[i] - hs[i-1] > 1) jumps.push(hs[i-1] + '->' + hs[i]);
    return {
      h1: document.querySelectorAll('h1').length,
      jumps: jumps.slice(0, 3),
      noName: [...document.querySelectorAll('a,button')]
        .filter(el => {
          if (!el.getClientRects().length) return false;
          // An image-only link (e.g. a Colab badge) is named by its img alt.
          const imgAlt = [...el.querySelectorAll('img')].map(i => i.getAttribute('alt') || '').join(' ');
          const name = (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || '') + ' ' + imgAlt;
          return !name.trim();
        })
        .slice(0, 3).map(el => el.outerHTML.slice(0, 60)),
      lang: document.documentElement.lang || null,
      main: document.querySelectorAll('main').length,
      skip: !!document.querySelector('a.skip-link'),
    };
  })()`);

  // Keyboard focus ring on the first few stops.
  const noRing = [];
  for (let i = 0; i < 6; i++) {
    await tab();
    const f = await evaluate(`(() => {
      const a = document.activeElement;
      if (!a || a === document.body) return null;
      const cs = getComputedStyle(a);
      const ring = a.matches(':focus-visible')
        && ((cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none');
      return ring ? null : ((typeof a.className === 'string' && a.className) || a.tagName);
    })()`);
    if (f) noRing.push(f);
  }

  const probs = [];
  if (r.h1 !== 1) probs.push(`h1 count = ${r.h1} (expected exactly 1)`);
  if (r.jumps.length) probs.push(`heading level jumps: ${r.jumps.join(', ')}`);
  if (r.noName.length) probs.push(`interactive element with no accessible name: ${r.noName.join(' | ')}`);
  if (!r.lang) probs.push('missing lang attribute');
  if (r.main !== 1) probs.push(`main landmarks = ${r.main}`);
  if (!r.skip) probs.push('no skip-to-content link');
  if (noRing.length) probs.push(`no keyboard focus ring: ${[...new Set(noRing)].join(' | ')}`);

  if (probs.length) { issues += probs.length; console.log(`  ${path}`); probs.forEach(x => console.log(`     ${x}`)); }
  else console.log(`  ok  ${path}`);
}
console.log(`\n${issues} a11y issue(s)`);
ws.close();
cleanup();
process.exit(issues ? 1 : 0);
