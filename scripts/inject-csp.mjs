// Postbuild pass for HTML files that ship without a Content-Security-Policy:
// the Archify-generated `public/architecture.html`.
//
// Every page the Astro build renders carries the policy declared in
// src/layouts/Base.astro, and harden-csp.mjs then replaces its 'unsafe-inline'
// with per-page script hashes. `public/architecture.html` is copied verbatim
// and has no policy at all, which made it the only page on the site where an
// injected script would run unopposed -- on a page that is linked from every
// footer and carries 480 KB of unminified inline JavaScript.
//
// This pass gives such a page the same shape of policy the rest of the site
// uses, and harden-csp.mjs then treats it like any other page: it contributes
// its inline-script hashes to the global union and gets the union applied back.
//
// The policy is deliberately strict. The page is self-contained -- one HTML
// file with inline scripts, inline styles and no network requests -- so it
// needs nothing beyond 'self', and `frame-src`/`object-src` can stay 'none'.
import {readFile, writeFile, glob} from 'node:fs/promises';

const DIST = new URL('../dist/', import.meta.url);
const CSP_META_RE = /<meta http-equiv="Content-Security-Policy"/i;

// The marker harden-csp.mjs replaces with the real hash list. Keeping
// 'unsafe-inline' here means the two passes compose: this one adds the policy,
// the next one converts the inline allowance into hashes.
const POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

let injected = 0;
let skipped = 0;

for await (const rel of glob('**/*.html', {cwd: DIST})) {
  const path = new URL(rel, DIST);
  const html = await readFile(path, 'utf-8');
  if (CSP_META_RE.test(html)) { skipped++; continue; }

  // Insert immediately after <head> so the policy is declared before any
  // script the browser could reach, matching where Base.astro puts it.
  const headAt = html.search(/<head[^>]*>/i);
  if (headAt === -1) { skipped++; continue; }
  const insertAt = html.indexOf('>', headAt) + 1;
  const meta = `\n  <meta http-equiv="Content-Security-Policy" content="${POLICY}">`;
  await writeFile(path, html.slice(0, insertAt) + meta + html.slice(insertAt), 'utf-8');
  injected++;
}

if (injected > 0) {
  console.log(`[inject-csp] Added a base policy to ${injected} page(s) that shipped without one.`);
} else {
  console.log('[inject-csp] Every page already declared a policy.');
}
