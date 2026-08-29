import {test, expect} from '@playwright/test';
import {spawn, type ChildProcess} from 'node:child_process';
import {readdirSync} from 'node:fs';
import {join} from 'node:path';

/**
 * The JupyterLite playground (/lite/) is a single shared static app served for
 * every Docusaurus locale, localized per deep-link locale via the `?locale=`
 * param that JupyterLiteEmbed.tsx appends. JupyterLite boots the multi-MB
 * Pyodide runtime purely in the browser, and the local Playwright webServer
 * (`docusaurus serve`) strips trailing slashes — which breaks the lite bundle's
 * relative imports (it only works on a plain static server matching GitHub
 * Pages). So these tests run their own static server and assert the served
 * localization payload plus the document-level config-utils bootstrap, rather
 * than a full kernel boot.
 */

test.describe('JupyterLite localization payload', () => {
  // The static server is spawned once and shared across tests in this file.
  // Force a single worker so one worker's afterAll can't kill the server the
  // other is mid-flight on.
  test.describe.configure({mode: 'serial'});
  let server: ChildProcess | null = null;
  const PORT = 3099;
  const BASE = `http://127.0.0.1:${PORT}`;

  test.beforeAll(async () => {
    server = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', 'build'], {
      stdio: 'ignore',
      detached: true,
    });
    // Wait until the static server is actually serving before any request hits it.
    const deadline = Date.now() + 10_000;
    for (;;) {
      try {
        const res = await fetch(`${BASE}/lite/index.html`);
        if (res.ok) break;
      } catch {
        /* not up yet */
      }
      if (Date.now() > deadline) throw new Error('static lite server did not start');
      await new Promise((r) => setTimeout(r, 200));
    }
  });

  test.afterAll(async () => {
    if (server) {
      server.kill('SIGTERM');
      server = null;
    }
  });

  test('the JupyterLite translation packs ship for ar/es/fr', async ({request}) => {
    const base = `${BASE}/lite/api/translations`;

    const all = await (await request.get(`${base}/all.json`)).json();
    for (const locale of ['ar_SA', 'es_ES', 'fr_FR']) {
      expect(all.data).toHaveProperty(locale);
    }

    const ar = await (await request.get(`${base}/ar_SA.json`)).json();
    expect(ar.data.jupyterlab[''].language).toBe('ar-SA');
    // A representative UI string must actually be translated (not English).
    expect(ar.data.jupyterlab['Save']?.[0]).toBeTruthy();
    expect(ar.data.jupyterlab['Save'][0]).not.toBe('Save');

    for (const loc of ['es_ES', 'fr_FR']) {
      const pack = await (await request.get(`${base}/${loc}.json`)).json();
      expect(pack.data.jupyterlab[''].language).toBe(loc.replace('_', '-'));
    }
  });

  test('config-utils.js carries the ?locale= override hook', async ({request}) => {
    const src = await (await request.get(`${BASE}/lite/config-utils.js`)).text();
    expect(src).toContain('pda-locale-override');
    expect(src).toContain("'@jupyterlab/translation-extension:plugin'");
    expect(src).toContain("pdaParams.get('locale')");
  });

  test('the ?locale= deep-link flips the JupyterLite document language', async ({page}) => {
    test.setTimeout(150_000);
    await page.goto(`${BASE}/lite/notebooks/?locale=ar_SA`, {
      waitUntil: 'domcontentloaded',
    });
    // config-utils boots the app; the document lang is set once the
    // translation extension activates from the requested pack.
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar-SA', {timeout: 90_000});
  });
});

test('JupyterLite build tree includes the notebooks app used by the Data Analysis embed', async () => {
  const files = readdirSync(join(process.cwd(), 'build', 'lite'));
  expect(files).toContain('notebooks');
  expect(files).toContain('repl');
});
