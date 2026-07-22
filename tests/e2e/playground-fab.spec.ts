import {test, expect} from '@playwright/test';
import {skipOnboarding} from './helpers';

test('FAB opens the JupyterLite REPL on a Python 101 page', async ({page}) => {
  await skipOnboarding(page);
  await page.goto('docs/python-101/normal/week-1');

  await page.getByRole('button', {name: /open the code playground/i}).click();
  const iframe = page.locator('iframe[title="JupyterLite Python console"]');
  await expect(iframe).toBeVisible();
  await expect(iframe).toHaveAttribute('src', /\/lite\/repl\//);
});

test('FAB opens the JupyterLite Notebook app on a Data Analysis page', async ({page}) => {
  await skipOnboarding(page);
  await page.goto('docs/data-analysis/normal/week-6');

  await page.getByRole('button', {name: /open the code playground/i}).click();
  const iframe = page.locator('iframe[title="JupyterLite notebook"]');
  await expect(iframe).toBeVisible();
  await expect(iframe).toHaveAttribute('src', /\/lite\/notebooks\//);
});

test('closing the FAB hides the embed without unmounting it, and does not block the page', async ({
  page,
}) => {
  await skipOnboarding(page);
  await page.goto('docs/python-101/normal/week-1');

  await page.getByRole('button', {name: /open the code playground/i}).click();
  const iframe = page.locator('iframe[title="JupyterLite Python console"]');
  await expect(iframe).toBeVisible();

  await page.getByRole('button', {name: /^close$/i}).click();

  // Regression guard: closing must hide (not unmount) the embed -- an
  // unmount would destroy and reload the iframe, which for JupyterLite loses
  // any notebook edits not yet autosaved. The iframe should still exist in
  // the DOM, just not visible.
  await expect(iframe).toBeHidden();
  await expect(iframe).toHaveCount(1);

  // Regression guard: this is not a modal. With the panel closed, a nav
  // link elsewhere on the page must still be clickable -- nothing should be
  // silently intercepting pointer events over the rest of the page.
  await expect(page.getByRole('link', {name: 'Data Analysis'}).first()).toBeVisible();
});
