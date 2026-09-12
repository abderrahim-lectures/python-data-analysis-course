// Vendors the Pyodide runtime + the wheel dependency-closure the lessons use
// (numpy, pandas, matplotlib, scipy, statsmodels) from jsdelivr into
// public/pyodide/ so Python runs entirely from the site's own origin — no
// runtime CDN, and nothing is fetched until a lesson's first "Run" click
// (runnable-cell.client.ts loads it lazily). Only the build machine talks to
// the CDN; browsers never do. Re-runs are cheap: existing files at the
// expected location are skipped. Everything here is gitignored.
const VERSION = '0.26.4';
const TARGET = new URL('../public/pyodide/', import.meta.url);
const BASE = `https://cdn.jsdelivr.net/pyodide/v${VERSION}/full/`;
const CORE = ['pyodide.mjs', 'pyodide.js', 'pyodide.js.map', 'pyodide.asm.js',
  'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'];
const ROOTS = ['numpy', 'pandas', 'matplotlib', 'scipy', 'statsmodels', 'micropip'];
const CONCURRENCY = 8;

const fs = await import('node:fs');
const path = await import('node:path');

const lock = await (await fetch(`${BASE}pyodide-lock.json`)).json().catch((e) => {
  console.error(`[vendor-pyodide] failed to fetch ${BASE}pyodide-lock.json: ${e}`);
  process.exit(1);
});

function closureFor(rootNames) {
  const closure = new Set();
  const seen = new Set();
  const walk = (name) => {
    const p = lock.packages[name.replace(/==\d.*/, '')];
    if (!p || seen.has(name)) return;
    seen.add(name);
    if (/\S+\.whl$/.test(p.file_name)) closure.add(p.file_name);
    (p.depends ?? []).forEach(walk);
  };
  rootNames.forEach(walk);
  return closure;
}

const files = [...new Set([...CORE, ...closureFor(ROOTS)])];
async function save(name) {
  const dest = path.join(TARGET.pathname, name);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return 'skip';
  const res = await fetch(BASE + encodeURIComponent(name));
  if (!res.ok) throw new Error(`${name} -> HTTP ${res.status}`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  return 'down';
}
let down = 0, skipped = 0;
const queue = [...files];
async function worker() {
  while (queue.length) {
    const name = queue.shift();
    (await save(name)) === 'down' ? down++ : skipped++;
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
const totalMB = (fs.readdirSync(TARGET.pathname)
  .reduce((n, f) => n + fs.statSync(path.join(TARGET.pathname, f)).size, 0) / 1048576).toFixed(0);
console.log(`[vendor-pyodide] v${VERSION}: ${down} downloaded, ${skipped} up-to-date (${files.length} files, ~${totalMB} MB in ${TARGET.pathname})`);