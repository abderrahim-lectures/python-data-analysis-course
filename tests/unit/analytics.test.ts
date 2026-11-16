import {describe, expect, test} from 'vitest';
import {readFileSync} from 'node:fs';

// Analytics has three independent failure modes, all of which were live at
// once and none of which produced an error anywhere:
//   1. The measurement ID was never configured. Base.astro renders the gtag
//      block only when PUBLIC_GA_ID is set, and it was absent from .env and
//      from the deploy workflow, so the whole feature was dead code in
//      production while reading correctly in review.
//   2. GA4 beacons to region1.google-analytics.com as well as
//      www.google-analytics.com; the CSP allow-listed only the second.
//   3. The site is an Astro ClientRouter app, so GA's automatic page_view
//      covered the first document load only.
const BASE = readFileSync('src/layouts/Base.astro', 'utf8');
const WORKFLOW = readFileSync('.github/workflows/deploy.yml', 'utf8');

describe('analytics is wired end to end', () => {
  test('the deploy build passes PUBLIC_GA_ID through', () => {
    expect(WORKFLOW).toContain('PUBLIC_GA_ID');
    expect(WORKFLOW).toMatch(/PUBLIC_GA_ID:\s*\$\{\{\s*vars\.PUBLIC_GA_ID\s*\}\}/);
  });

  test('the layout only ships gtag when the id is present', () => {
    expect(BASE).toContain('import.meta.env.PUBLIC_GA_ID &&');
  });

  test('the CSP allows every host GA4 talks to', () => {
    const csp = /content=\{`([^`]*Content-Security-Policy|default-src[^`]*)`\}/.exec(BASE)?.[1] ?? BASE;
    const connect = /connect-src ([^;]*)/.exec(BASE)?.[1] ?? '';
    expect(connect).toContain('*.google-analytics.com');
    expect(connect).toContain('*.analytics.google.com');
    expect(connect).toContain('googletagmanager.com');
    expect(csp.length).toBeGreaterThan(0);
  });
});

describe('pageviews survive soft navigation without double-counting', () => {
  test('automatic page_view is disabled in favour of an explicit one', () => {
    // With automatic page_view on, the explicit event double-counts the first
    // load; with it off and no explicit event, nothing is counted at all.
    expect(BASE).toContain('send_page_view: false');
    expect(BASE).toContain("'event', 'page_view'");
  });

  test('soft navigations are tracked', () => {
    expect(BASE).toContain("addEventListener('astro:page-load', track)");
  });

  test('the URL guard prevents the initial page being counted twice', () => {
    // The router fires astro:page-load for the first page too.
    expect(BASE).toContain('if (url === lastUrl) return;');
  });

  test('the loader is idempotent so gtag.js is appended once', () => {
    expect(BASE).toContain('if (window.__pydaGtag) return;');
  });

  test('consent is checked on every track, not only at load', () => {
    expect(BASE).toMatch(/function consented\(\)[\s\S]*pda:analytics-consent/);
    expect(BASE).toContain("if (!consented()) return;");
  });
});
