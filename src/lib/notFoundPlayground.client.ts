// Handles the /playground/<code> half of 404.astro. Deliberately a real
// module script (imported plainly, no `define:vars`) — an earlier version
// used `<script define:vars>` with a dynamic `import('../lib/codeShare.ts')`
// inside it, which looked fine in dev but silently failed in the production
// build: define:vars scripts are not bundled by Vite, so the relative import
// path was never rewritten and just 404'd in the browser. Every shared link
// fell through to the "page not found" state. Plain `<script>import ...`
// blocks (like this one) go through the normal Vite/Astro bundling that
// rewrites the path and hashes the asset, same as runnable-cell.client.ts.
import {decodeShareCode} from './codeShare.ts';

// Bounds on the base64url segment (compressed) and the decoded result
// (uncompressed): without the second cap, gzip lets a tiny URL expand into
// an enormous string — a decompression bomb that would hang the tab trying
// to render/highlight it.
const MAX_SEGMENT_LENGTH = 20000;
const MAX_DECODED_LENGTH = 200000;

async function init() {
  const base = import.meta.env.BASE_URL;
  const prefix = `${base}playground/`;
  const path = location.pathname;
  if (!path.startsWith(prefix) || path.length <= prefix.length) return;

  const segment = decodeURIComponent(path.slice(prefix.length).replace(/\/$/, ''));
  if (segment.length > MAX_SEGMENT_LENGTH) return;
  try {
    const code = await decodeShareCode(segment);
    if (code.length > MAX_DECODED_LENGTH) return;
    document.getElementById('notfound')?.setAttribute('hidden', '');
    document.getElementById('pg-head')?.removeAttribute('hidden');
    document.getElementById('pg-section')?.removeAttribute('hidden');
    document.title = 'Playground — PyDA Course';
    const codeEl = document.getElementById('pg-code');
    if (codeEl) {
      codeEl.textContent = code;
      codeEl.dispatchEvent(new Event('input', {bubbles: true}));
    }
  } catch {
    // Malformed segment (hand-edited URL, truncated link) — leave the plain
    // 404 showing rather than a broken-looking empty editor.
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
