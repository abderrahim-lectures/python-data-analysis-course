// Postbuild pass: replaces 'unsafe-inline' in each page's CSP script-src
// with the exact sha256 hashes of that page's own inline <script> content.
//
// This is a static site (output: 'static') -- there's no per-request server
// to mint a per-response nonce, and a nonce baked into the static HTML at
// build time would be the same string on every visit, readable in the very
// page an attacker is injecting into, so it wouldn't gate anything. Content
// hashes are the correct primitive for a prerendered site instead: the
// build is deterministic, so every legitimate inline script's hash is known
// in advance, and an attacker-injected script (different content) never
// matches an allow-listed hash no matter how it got onto the page.
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

function isHashable(attrs) {
  if (/\bsrc\s*=/.test(attrs)) return false; // external script, governed by 'self' already
  const typeMatch = attrs.match(/type\s*=\s*["']([^"']+)["']/);
  const type = typeMatch?.[1];
  return !type || type === 'module' || /javascript$/i.test(type);
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

    const hashes = new Set();
    for (const m of html.matchAll(SCRIPT_RE)) {
      const [, attrs, content] = m;
      if (isHashable(attrs)) hashes.add(sha256(content));
    }

    const next = html.replace(CSP_RE, (_full, pre, content, post) => {
      const withHashes = content.replace(
        /script-src ([^;]*)'unsafe-inline'([^;]*);/,
        (_m, before, after) => `script-src ${before}${[...hashes].map((h) => `'${h}'`).join(' ')}${after};`,
      );
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
