// Hreflang alternate integrity check (no Chrome needed — pure HTTP).
//
//   BASE_URL=http://localhost:4331 node tests/e2e/hreflang.mjs
//
// Every `rel="alternate"` on a page must resolve to an existing page. The
// i18n migration gates on this: an EN-only project (`data-visualization`)
// must fall back to its EN page in ar/es/fr alternates instead of emitting
// 404 links.
import {accessSync} from 'node:fs';
import {join} from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://localhost:4321';

const PAGES = [
  '/',
  '/projects/data-visualization',
  '/projects/agentic-code-reviewer',
  '/learn/python-101/normal',
  '/learn/data-analysis/normal/lessons/reading-files',
  '/es/',
  '/fr/',
  '/ar/',
];

const distRoot = 'dist';
function routeExists(path) {
  const p = path.replace(/^\/+/, '').replace(/\/+$/, '');
  if (p === '') return true;
  // Astro emits <dir>/index.html for every page route.
  const candidate = p.endsWith('.html') ? join(distRoot, p) : join(distRoot, p, 'index.html');
  try { accessSync(candidate); return true; } catch { return false; }
}

const errors = [];
let checked = 0;

for (const page of PAGES) {
  const res = await fetch(`${BASE}${page}`);
  const html = await res.text();
  const hrefs = [...html.matchAll(/rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => ([m[1], m[2]]));
  checked += hrefs.length;
  for (const [hreflang, href] of hrefs) {
    const path = decodeURIComponent(new URL(href).pathname);
    if (!routeExists(path)) errors.push(`${page}: alternate ${hreflang} -> ${path} does not exist in dist`);
  }
}

if (errors.length) {
  console.error(`${errors.length} hreflang error(s) across ${PAGES.length} page(s)`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`${checked} alternate link(s) across ${PAGES.length} page(s): all resolve`);