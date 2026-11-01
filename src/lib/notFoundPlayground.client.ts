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
import {NAV_WORDS, type Locale} from './routeSegments.ts';

// Bounds on the base64url segment (compressed) and the decoded result
// (uncompressed): without the second cap, gzip lets a tiny URL expand into
// an enormous string — a decompression bomb that would hang the tab trying
// to render/highlight it.
const MAX_SEGMENT_LENGTH = 20000;
const MAX_DECODED_LENGTH = 200000;

async function init() {
  const base = import.meta.env.BASE_URL;
  const path = location.pathname;
  // Locale-aware copy: 404.astro embeds `window.__PDA404_LOCALE__` (from the
  // failed path's first segment) and the matching strings in `__PDA404_I18N__`.
  const w = window as unknown as {__PDA404_I18N__?: Record<string, string>; __PDA404_LOCALE__?: string};
  const t: Record<string, string> = w.__PDA404_I18N__ ?? {};
  // A shared link can arrive under a locale prefix, and there is no static
  // route for `/<locale>/playground/<code>` -- the locale's playground page is
  // only `/es/playground`, so a code suffix 404s here like any missing path.
  // The prefix test used to be the bare `/playground/`, so a Spanish learner
  // pasting `.../es/playground/<code>` got the plain 404 (while 404.astro had
  // already gone to the trouble of switching the copy to Spanish).
  const locale: Locale = w.__PDA404_LOCALE__ === 'ar' || w.__PDA404_LOCALE__ === 'es' || w.__PDA404_LOCALE__ === 'fr'
    ? w.__PDA404_LOCALE__
    : 'en';
  // `/` for EN, `/<locale>/` otherwise — the same prefix learnHref() builds,
  // without pulling paraglide's runtime into this tiny 404 bundle (the locale
  // is already known from the path, so there is nothing to resolve).
  const localeBase = locale === 'en' ? base : `${base}${locale}/`;
  const prefix = `${localeBase}playground/`;
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
      // `${base}learn` regardless of locale: a Spanish/French/Arabic learner
      // arriving from a pasted link was sent to the English learn hub (the
      // same "English slug behind a locale prefix" bug as the learn-hub
      // cheatsheet links), which is also a locale switch for them.
      back.setAttribute('href', fromThisSite ? document.referrer : `${localeBase}${NAV_WORDS[locale].learn}`);
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
  // astro:page-load fires once on the initial load and again after every
  // View Transitions swap; DOMContentLoaded only ever fires once. But the
  // initial dispatch fires on window's `load` event via Astro's own router
  // script, not this one -- if this deferred bundle is still fetching (cold
  // cache, slow connection) when `load` fires, that one-time event is gone
  // before the listener below ever registers. readyState is 'complete' only
  // after `load` has already fired, so this covers exactly that miss without
  // ever double-firing (either this runs, or the listener does, never both).
  document.addEventListener('astro:page-load', init);
  if (document.readyState === 'complete') init();
}
