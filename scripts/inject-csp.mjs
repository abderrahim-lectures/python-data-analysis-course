// Postbuild pass for HTML files that ship without a Content-Security-Policy:
// the Archify-generated `public/architecture.html`.
//
// It also adds the `<main>` landmark to such a page. The generated diagram is
// one toolbar plus one content container and has no landmark at all, which
// made it the only page on the site where a screen-reader user could not jump
// past the toolbar. Both edits live here rather than in the generated file so
// regenerating the diagram does not silently drop them.
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
const MAIN_RE = /<main[\s>]/i;

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
  let next = html;
  let touched = false;

  // Insert immediately after <head> so the policy is declared before any
  // script the browser could reach, matching where Base.astro puts it. A page
  // that already declares one is left alone, but still gets the landmark check
  // below -- the two edits are independent.
  if (!CSP_META_RE.test(html)) {
    const headAt = html.search(/<head[^>]*>/i);
    if (headAt !== -1) {
      const insertAt = html.indexOf('>', headAt) + 1;
      const meta = `\n  <meta http-equiv="Content-Security-Policy" content="${POLICY}">`;
      next = html.slice(0, insertAt) + meta + html.slice(insertAt);
      touched = true;
    }
  } else {
    skipped++;
  }

  // Landmark: wrap the page's single content container. The generated page has
  // a toolbar then one `div.container`; without a <main> there is nothing to
  // skip the toolbar with.
  if (!MAIN_RE.test(next)) {
    const open = /<div class="container">/.exec(next);
    if (open) {
      const start = open.index;
      // Find the matching close by counting nested divs from the open tag.
      const bodyStart = start;
      let depth = 0;
      let i = bodyStart;
      let closeAt = -1;
      while (i < next.length) {
        const openTag = next.indexOf('<div', i);
        const closeTag = next.indexOf('</div>', i);
        if (closeTag === -1) break;
        if (openTag !== -1 && openTag < closeTag) { depth++; i = openTag + 4; }
        else {
          depth--;
          i = closeTag + 6;
          if (depth === 0) { closeAt = closeTag; break; }
        }
      }
      if (closeAt !== -1) {
        next = next.slice(0, bodyStart) + '<main>' + next.slice(bodyStart, closeAt + 6) + '</main>' + next.slice(closeAt + 6);
      }
    }
  }

  if (next !== html) { touched = true; }
  if (touched) {
    await writeFile(path, next, 'utf-8');
    injected++;
  }
}

if (injected > 0) {
  console.log(`[inject-csp] Added a base policy (and a <main> landmark where missing) to ${injected} page(s).`);
} else {
  console.log('[inject-csp] Every page already declared a policy.');
}
