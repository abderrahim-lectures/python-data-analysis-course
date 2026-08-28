import {test, expect} from '@playwright/test';
import {skipOnboarding, goto} from './helpers';

const DESKTOP_VIEWPORT = {width: 1600, height: 900};

test.describe('VS Code web playground (advanced editor)', () => {
  test.beforeEach(async ({page}) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await skipOnboarding(page);
  });

  test('a Python 101 lesson page shows Trail cells and the advanced editor closed by default', async ({
    page,
  }) => {
    await goto(page, 'docs/python-101/normal/week-1');

    // The Trail is primary: python fences are inline runnable cells and the
    // docked editor is hidden until the student opts in via the Code strip.
    await expect(page.locator('article').first()).toBeVisible();
    await expect(page.getByTestId('runnable-cell').first()).toBeVisible();
    await expect(page.locator('.vsc-dock')).toBeHidden();
    await expect(page.getByTestId('vsc-reopen')).toBeVisible();
  });

  test('opening the advanced editor reveals the editor on the right', async ({page}) => {
    await goto(page, 'docs/python-101/normal/week-1');

    await page.getByTestId('vsc-reopen').click();
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
    await goto(page, 'docs/python-101/normal/week-1');

    await page.getByTestId('vsc-reopen').click();
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
    await goto(page, 'docs/python-101/normal/week-1');

    await page.getByTestId('vsc-reopen').click();
    await page.getByTestId('vsc-tab-notebook').click();
    const iframe = page.locator('iframe[title="JupyterLite Python console"]');
    await expect(iframe).toBeVisible();
    await expect(iframe).toHaveAttribute('src', /\/lite\/repl\//);
  });

  test('an open editor can be collapsed and reopened via the Code strip', async ({page}) => {
    await goto(page, 'docs/python-101/normal/week-1');

    await page.getByTestId('vsc-reopen').click();
    await expect(page.locator('.vsc-dock')).toBeVisible();
    await page.getByTestId('vsc-collapse').click();
    await expect(page.locator('.vsc-dock')).toBeHidden();
    await expect(page.getByTestId('vsc-reopen')).toBeVisible();

    await page.getByTestId('vsc-reopen').click();
    await expect(page.locator('.vsc-dock')).toBeVisible();
  });
});