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
// Fallback origin if jsdelivr is unreachable or serving errors. The official
// Pyodide release host serves the same layout, so a CDN incident on one edge
// no longer fails a deploy that has no other way to get these bytes.
const MIRRORS = [BASE, `https://github.com/pyodide/pyodide/releases/download/${VERSION}/`];
const CORE = ['pyodide.mjs', 'pyodide.js', 'pyodide.js.map', 'pyodide.asm.js',
  'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'];
const ROOTS = ['numpy', 'pandas', 'matplotlib', 'scipy', 'statsmodels', 'micropip'];
const CONCURRENCY = 8;
const RETRIES = 3;
const RETRY_DELAY_MS = 800;

const fs = await import('node:fs');
const path = await import('node:path');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// One file, tried against every mirror with a short backoff. A CDN blip that
// used to fail the whole build (process.exit on the first bad response) now
// costs a second and a half and the deploy continues.
async function fetchBytes(name) {
  let lastError;
  for (let attempt = 0; attempt < RETRIES; attempt++) {
    for (const origin of MIRRORS) {
      try {
        const res = await fetch(origin + encodeURIComponent(name), {signal: AbortSignal.timeout(120_000)});
        if (!res.ok) { lastError = new Error(`${origin}${name} -> HTTP ${res.status}`); continue; }
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length === 0) { lastError = new Error(`${origin}${name} -> empty body`); continue; }
        return buf;
      } catch (e) {
        lastError = e; // network error, DNS, timeout -- try the next mirror
      }
    }
    if (attempt < RETRIES - 1) await sleep(RETRY_DELAY_MS * (attempt + 1));
  }
  throw new Error(`[vendor-pyodide] ${name}: ${lastError?.message ?? 'unknown error'}`);
}

const lock = await (async () => {
  const buf = await fetchBytes('pyodide-lock.json');
  return JSON.parse(buf.toString('utf8'));
})();

function closureFor(rootNames) {
  const closure = new Set();
  const seen = new Set();
  const walk = (name) => {
    const p = lock.packages[name.replace(/==\d.*/, '')];
    if (!p || seen.has(name)) return;
    seen.add(name);
    // Pyodide ships some dependencies as separate shared libraries
    // (`openblas-0.3.26.zip`, `libhdf5-…zip`, …) rather than wheels. Skipping
    // them broke scipy for every visitor: `scipy.linalg._fblas.so` needs
    // openblas, and without it `import scipy.stats` dies with "Could not load
    // dynamic lib … bad export type for 'ztrsm_'".
    if (/\.(?:whl|zip)$/.test(p.file_name)) closure.add(p.file_name);
    (p.depends ?? []).forEach(walk);
  };
  rootNames.forEach(walk);
  return closure;
}

const files = [...new Set([...CORE, ...closureFor(ROOTS)])];
async function save(name) {
  const dest = path.join(TARGET.pathname, name);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return 'skip';
  const buf = await fetchBytes(name);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  return 'down';
}
let down = 0, skipped = 0;
const queue = [...files];
let failed = null;
async function worker() {
  while (queue.length && !failed) {
    const name = queue.shift();
    try {
      (await save(name)) === 'down' ? down++ : skipped++;
    } catch (e) {
      // Stop pulling new files after the first hard failure, but let the
      // in-flight ones finish and report every failure at once rather than
      // an unhandled rejection from one of eight concurrent workers.
      failed = failed ?? e;
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
if (failed) {
  console.error(`[vendor-pyodide] FAILED after ${down} download(s): ${failed.message}`);
  console.error('[vendor-pyodide] public/pyodide/ is incomplete; a build from it would serve 404s for the missing files.');
  process.exit(1);
}
const sizeOf = (name) => fs.statSync(path.join(TARGET.pathname, name)).size;
const totalBytes = fs.readdirSync(TARGET.pathname)
  .reduce((n, f) => n + fs.statSync(path.join(TARGET.pathname, f)).size, 0);
// coreBytes covers only the files every page load must fetch (the runtime
// itself, before any lesson-specific package wheel) -- the browser uses it
// to show an accurate download-percent for that unavoidable first chunk
// (see runnable-cell.client.ts). Package wheels are fetched on demand and
// vary per lesson, so they're shown as an indeterminate step instead.
const coreBytes = CORE.reduce((n, f) => n + sizeOf(f), 0);
fs.writeFileSync(path.join(TARGET.pathname, 'manifest.json'), JSON.stringify({version: VERSION, totalBytes, coreBytes}));
const totalMB = (totalBytes / 1048576).toFixed(0);
console.log(`[vendor-pyodide] v${VERSION}: ${down} downloaded, ${skipped} up-to-date (${files.length} files, ~${totalMB} MB in ${TARGET.pathname})`);