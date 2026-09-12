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
  // Locale-aware copy: 404.astro embeds `window.__PDA404_LOCALE__` (from the
  // failed path's first segment) and the matching strings in `__PDA404_I18N__`.
  const w = window as unknown as {__PDA404_I18N__?: Record<string, string>; __PDA404_LOCALE__?: string};
  const t: Record<string, string> = w.__PDA404_I18N__ ?? {};
  if (!path.startsWith(prefix) || path.length <= prefix.length) return;

  const segment = decodeURIComponent(path.slice(prefix.length).replace(/\/$/, ''));
  if (segment.length > MAX_SEGMENT_LENGTH) return;
  try {
    const code = await decodeShareCode(segment);
    if (code.length > MAX_DECODED_LENGTH) return;
    document.getElementById('notfound')?.setAttribute('hidden', '');
    document.getElementById('pg-head')?.removeAttribute('hidden');
    document.getElementById('pg-section')?.removeAttribute('hidden');
    document.title = t.notfound_play_title ?? 'Playground — PyDA Course';
    const head = document.getElementById('pg-head');
    if (head) {
      const eyebrow = head.querySelector('.head__eyebrow span');
      if (eyebrow) eyebrow.textContent = t.notfound_play_eyebrow ?? '';
      const h1 = head.querySelector('h1');
      if (h1) h1.textContent = t.playground_title ?? 'Playground';
      const lead = head.querySelector('p');
      if (lead) lead.textContent = t.notfound_play_lead ?? '';
    }
    const codeEl = document.getElementById('pg-code');
    if (codeEl) {
      codeEl.textContent = code;
      codeEl.dispatchEvent(new Event('input', {bubbles: true}));
    }

    // Referrer is same-origin for the ⛶ button (a real in-app navigation);
    // empty or cross-origin for a pasted/emailed link, where there's no
    // lesson to go "back" to — send those to the learn hub instead.
    const back = document.getElementById('pg-back');
    if (back) {
      const fromThisSite = document.referrer && new URL(document.referrer).origin === location.origin;
      back.setAttribute('href', fromThisSite ? document.referrer : `${base}learn`);
      back.textContent = fromThisSite
        ? t.back_to_lesson ?? '← Back to the lesson'
        : t.notfound_browse_lessons ?? '← Browse lessons';
      back.removeAttribute('hidden');
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
