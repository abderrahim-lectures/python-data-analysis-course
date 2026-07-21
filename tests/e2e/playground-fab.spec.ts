import {test, expect} from '@playwright/test';
import {skipOnboarding} from './helpers';

test('FAB opens Trinket on a Python 101 page', async ({page}) => {
  await skipOnboarding(page);
  await page.goto('docs/python-101/normal/week-1');

  await page.getByRole('button', {name: /open the code playground/i}).click();
  const iframe = page.locator('iframe[title="Trinket Python playground"]');
  await expect(iframe).toBeVisible();
  await expect(iframe).toHaveAttribute('src', /trinket\.io/);
});

test('FAB opens JupyterLite on a Data Analysis page', async ({page}) => {
  await skipOnboarding(page);
  await page.goto('docs/data-analysis/normal/week-6');

  await page.getByRole('button', {name: /open the code playground/i}).click();
  const iframe = page.locator('iframe[title="JupyterLite notebook"]');
  await expect(iframe).toBeVisible();
  await expect(iframe).toHaveAttribute('src', /\/lite\/notebooks\//);
});
