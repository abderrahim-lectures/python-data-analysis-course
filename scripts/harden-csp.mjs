// Postbuild pass: replaces 'unsafe-inline' in each page's CSP script-src
// and style-src with the exact sha256 hashes of that page's own inline
// <script> and <style> content.
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
// style-src hashing only needs to cover <style> elements here, not style=""
// attributes: every dynamic and per-instance inline style attribute in the
// app was converted to a fixed class name (see the pt-*/w-pct-*/diff-*
// classes in global.css) specifically so this script doesn't need
// 'unsafe-hashes', a newer CSP3 feature with weaker browser support than
// plain hash-source.
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
const STYLE_RE = /<style([^>]*)>([\s\S]*?)<\/style>/g;
const CSP_RE = /(<meta http-equiv="Content-Security-Policy" content=")([^"]*)(")/;

function sha256(content) {
  return 'sha256-' + createHash('sha256').update(content, 'utf-8').digest('base64');
}

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

async function main() {
  let files = [];
  for await (const f of glob('**/*.html', {cwd: DIST})) files.push(f);
  if (files.length === 0) {
    console.error('[harden-csp] No HTML files found under dist/ -- run `astro build` first.');
    process.exitCode = 1;
    return;
  }

  let patched = 0;
  for (const rel of files) {
    const path = new URL(rel, DIST);
    const html = await readFile(path, 'utf-8');
    if (!CSP_RE.test(html)) continue;

    // Strip HTML comments before scanning: SCRIPT_RE/STYLE_RE are plain
    // regexes, not a real HTML parser, so an authoring comment that happens
    // to mention "<script>" or "<style>" in prose would otherwise be
    // mistaken for a real tag, corrupting where the "content" capture
    // starts and producing a hash that never matches what the browser
    // actually executes.
    const stripped = html.replace(/<!--[\s\S]*?-->/g, '');

    const scriptHashes = new Set();
    for (const m of stripped.matchAll(SCRIPT_RE)) {
      const [, attrs, content] = m;
      if (isHashableScript(attrs)) scriptHashes.add(sha256(content));
    }
    const styleHashes = new Set();
    for (const m of stripped.matchAll(STYLE_RE)) {
      styleHashes.add(sha256(m[2]));
    }

    const next = html.replace(CSP_RE, (_full, pre, content, post) => {
      let withHashes = replaceUnsafeInline('script-src', content, scriptHashes);
      withHashes = replaceUnsafeInline('style-src', withHashes, styleHashes);
      return pre + withHashes + post;
    });

    if (next !== html) {
      await writeFile(path, next, 'utf-8');
      patched++;
    }
  }
  console.log(`[harden-csp] Patched ${patched}/${files.length} HTML files.`);
}

main();
