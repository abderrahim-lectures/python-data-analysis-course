import {test, expect} from '@playwright/test';
import {skipOnboarding} from './helpers';

const DESKTOP_VIEWPORT = {width: 1600, height: 900};

test.describe('VS Code web playground (split view)', () => {
  test.beforeEach(async ({page}) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await skipOnboarding(page);
  });

  test('a Python 101 lesson page shows the course on the left and the editor on the right', async ({
    page,
  }) => {
    await page.goto('docs/python-101/normal/week-1');

    // The persistent split: the lesson is still readable, and the docked
    // editor is present alongside it (not hidden behind a FAB).
    await expect(page.locator('article').first()).toBeVisible();
    await expect(page.locator('.vsc-dock')).toBeVisible();
    await expect(page.locator('.vsc-monaco-host .monaco-editor').first()).toBeVisible({
      timeout: 20_000,
    });
    // Python 101 gets the plain REPL starter (not the Data Analysis one).
    await expect(page.locator('.vsc-monaco-host .monaco-editor')).toContainText('Python 101', {
      timeout: 20_000,
    });
  });

  test('running the starter code prints output into the integrated terminal', async ({page}) => {
    test.setTimeout(180_000);
    await page.goto('docs/python-101/normal/week-1');

    await expect(page.locator('.vsc-monaco-host .monaco-editor').first()).toBeVisible({
      timeout: 20_000,
    });

    // The initial run is slow: Pyodide (~10 MB) streams in from the CDN.
    await page.getByTestId('vsc-run').click();
    const terminal = page.getByTestId('vsc-terminal');
    await expect(terminal).toBeVisible();
    await expect(terminal).toContainText('Hello, Python!', {timeout: 120_000});
    await expect(terminal).toContainText('4', {timeout: 10_000});
  });

  test('the Notebook tab deep-links the JupyterLite app for the current week', async ({page}) => {
    await page.goto('docs/python-101/normal/week-1');

    await page.getByTestId('vsc-tab-notebook').click();
    const iframe = page.locator('iframe[title="JupyterLite Python console"]');
    await expect(iframe).toBeVisible();
    await expect(iframe).toHaveAttribute('src', /\/lite\/repl\//);
  });

  test('collapsing the editor on desktop hides it and the Code strip can reopen it', async ({
    page,
  }) => {
    await page.goto('docs/python-101/normal/week-1');

    await expect(page.locator('.vsc-dock')).toBeVisible();
    await page.getByTestId('vsc-collapse').click();
    await expect(page.locator('.vsc-dock')).toBeHidden();
    await expect(page.getByTestId('vsc-reopen')).toBeVisible();

    await page.getByTestId('vsc-reopen').click();
    await expect(page.locator('.vsc-dock')).toBeVisible();
  });
});
