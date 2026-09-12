// Shared CDP harness for the lesson-runtime e2e — launches headless Chrome,
// attaches over the DevTools websocket, and exposes goto/evaluate/check.
import {spawn} from 'node:child_process';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

export const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4321';
const PORT = Number(process.env.CDP_PORT ?? 9334);
const CHROME = process.env.CHROME_BIN ?? 'google-chrome';

const profile = mkdtempSync(join(tmpdir(), 'pyda-lesson-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, 'about:blank',
], {stdio: 'ignore'});

const cleanup = () => {
  try { chrome.kill(); } catch {}
  try { rmSync(profile, {recursive: true, force: true}); } catch {}
};

const waitFor = async (fn, label, tries = 120) => {
  for (let i = 0; i < tries; i++) {
    try { return await fn(); } catch { await new Promise(r => setTimeout(r, 500)); }
  }
  throw new Error(`timed out waiting for ${label}`);
};

await waitFor(() => fetch(`http://127.0.0.1:${PORT}/json/version`).then(r => r.ok || Promise.reject()), 'chrome');
await waitFor(() => fetch(BASE).then(r => r.ok || Promise.reject()), `site at ${BASE}`);

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

export async function goto(path) {
  await send('Page.navigate', {url: BASE + path});
  await waitFor(() => evaluate('document.readyState').then(s => s === 'complete' || Promise.reject()), `page ${path}`);
  await new Promise(r => setTimeout(r, 300));
}

export const reset = () => evaluate('(localStorage.clear(), localStorage.setItem("pda:onboarded", "1"), 1)');

const results = [];
const check = (name, actual, expected) => {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  results.push({name, pass});
  console.log(`${pass ? '  ok  ' : ' FAIL '} ${name}`);
  if (!pass) console.log(`        expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
};

export function summary() {
  const failed = results.filter(r => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  cleanup();
  process.exit(failed ? 1 : 0);
}

export {check, evaluate};