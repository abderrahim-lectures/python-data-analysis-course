// Postbuild pass: replaces 'unsafe-inline' in each page's CSP script-src
// with the exact sha256 hashes of that page's own inline <script> content.
//
// This is a static site (output: 'static') -- there's no per-request server
// to mint a per-response nonce, and a nonce baked into the static HTML at
// build time would be the same string on every visit, readable in the very
// page an attacker is injecting into, so it wouldn't gate anything. Content
// hashes are the correct primitive for a prerendered site instead: the
// build is deterministic, so every legitimate inline script/style's hash is
// known in advance, and attacker-injected content (different bytes) never
// matches an allow-listed hash no matter how it got onto the page.
//
// style-src stays 'unsafe-inline' rather than being hashed: every dynamic
// and per-instance inline style attribute in our own code was converted to
// a fixed class name (see the pt-*/w-pct-*/diff-* classes in global.css),
// but third-party content we don't control -- KaTeX renders each formula
// with unique, per-formula inline style="" attributes baked in at build
// time (e.g. style="top:-2.314em;") -- can't be hash-allow-listed the same
// way, since a hash only matches one exact string and these values vary per
// formula. 'unsafe-hashes' (CSP3) would let hashed style attributes coexist
// with hash-source for the rest, but browsers ignore 'unsafe-inline'
// entirely once ANY hash-source is present in a directive, so hashing
// *some* style-src content forces hashing all of it -- infeasible for
// KaTeX's per-formula values. script-src (the higher-value target for XSS)
// stays fully hashed; style-src keeps 'unsafe-inline' rather than lose
// KaTeX rendering.
//
// <script type="application/ld+json"> and type="application/json"> blocks
// are skipped: per the CSP "script-like element" definition, those aren't
// executable script elements, so script-src doesn't govern them and hashing
// them would only bloat the header with page-specific structured-data noise.
import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {glob} from 'node:fs/promises';

const DIST = new URL('../dist/', import.meta.url);
const SCRIPT_RE = /<script([^>]*)>([\s\S]*?)<\/script>/g;
const CSP_RE = /(<meta http-equiv="Content-Security-Policy" content=")([^"]*)(")/;

function sha256(content) {
  return 'sha256-' + createHash('sha256').update(content, 'utf-8').digest('base64');
}

// Astro's ClientRouter (View Transitions) inserts a fixed
// `<script type="module" src="data:application/javascript,"/>` on every
// soft navigation as a synchronization barrier while waiting for other
// module scripts to load. Its content never varies across builds or pages,
// so its hash is hardcoded here rather than computed -- without it, EVERY
// soft navigation on the site throws a CSP violation and blocks the
// ClientRouter's own script re-execution.
const CLIENT_ROUTER_PLACEHOLDER_HASH = 'sha256-REaHnPdgxmRomsKzMwMY6VF7JTR0qH10P8XPa+y2FGU=';

function isHashableScript(attrs) {
  if (/\bsrc\s*=/.test(attrs)) return false; // external script, governed by 'self' already
  const typeMatch = attrs.match(/type\s*=\s*["']([^"']+)["']/);
  const type = typeMatch?.[1];
  return !type || type === 'module' || /javascript$/i.test(type);
}

function replaceUnsafeInline(directive, content, hashes) {
  const re = new RegExp(`${directive} ([^;]*)'unsafe-inline'([^;]*);`);
  return content.replace(
    re,
    (_m, before, after) => `${directive} ${before}${[...hashes].map((h) => `'${h}'`).join(' ')}${after};`,
  );
}

function stripComments(html) {
  // Strip HTML comments before scanning: SCRIPT_RE/STYLE_RE are plain
  // regexes, not a real HTML parser, so an authoring comment that happens
  // to mention "<script>" or "<style>" in prose would otherwise be
  // mistaken for a real tag, corrupting where the "content" capture
  // starts and producing a hash that never matches what the browser
  // actually executes.
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

function collectScriptHashes(html) {
  const hashes = new Set();
  for (const m of stripComments(html).matchAll(SCRIPT_RE)) {
    const [, attrs, content] = m;
    if (isHashableScript(attrs)) hashes.add(sha256(content));
  }
  return hashes;
}

async function main() {
  let files = [];
  for await (const f of glob('**/*.html', {cwd: DIST})) files.push(f);
  if (files.length === 0) {
    console.error('[harden-csp] No HTML files found under dist/ -- run `astro build` first.');
    process.exitCode = 1;
    return;
  }

  // Content-Security-Policy delivered via <meta http-equiv> is locked in by
  // the browser at the moment it parses the real HTML document -- it is
  // NOT re-evaluated when Astro's ClientRouter (View Transitions) swaps in
  // a different page's DOM on a soft navigation. That means whichever page
  // a visitor happens to land on first is the ONLY page whose CSP <meta>
  // ever actually takes effect for their whole session; every other page's
  // own (never-enforced) per-page hash list is irrelevant once they've
  // navigated once. A per-page hash set therefore breaks as soon as a
  // visitor soft-navigates to a page whose inline scripts weren't also
  // present, byte-for-byte, on their entry page. The fix is to compute one
  // global union of every page's inline-script hashes and apply that same
  // set to every page -- whichever page loads first, its CSP already covers
  // every other page's scripts too.
  const html = new Map();
  const globalHashes = new Set([CLIENT_ROUTER_PLACEHOLDER_HASH]);
  for (const rel of files) {
    const path = new URL(rel, DIST);
    const content = await readFile(path, 'utf-8');
    html.set(rel, content);
    if (!CSP_RE.test(content)) continue;
    for (const h of collectScriptHashes(content)) globalHashes.add(h);
  }

  let patched = 0;
  for (const rel of files) {
    const content = html.get(rel);
    if (!CSP_RE.test(content)) continue;
    const next = content.replace(CSP_RE, (_full, pre, directives, post) => {
      return pre + replaceUnsafeInline('script-src', directives, globalHashes) + post;
    });
    if (next !== content) {
      await writeFile(new URL(rel, DIST), next, 'utf-8');
      patched++;
    }
  }
  console.log(`[harden-csp] Patched ${patched}/${files.length} HTML files with ${globalHashes.size} shared script hashes.`);
}

main();
