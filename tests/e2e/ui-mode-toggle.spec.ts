import {test, expect} from '@playwright/test';
import {skipOnboarding} from './helpers';

test('toggling Gamified/Classical actually changes rendering', async ({page}) => {
  await skipOnboarding(page);
  await page.goto('docs/python-101/normal/week-1');

  await expect(page.locator('body')).toHaveAttribute('data-ui-mode', 'gamified');
  const flourish = page.locator('.gamified-flourish').first();
  await expect(flourish).toBeVisible();

  const toggle = page.getByRole('button', {name: /switch between gamified and classical/i});
  await toggle.click();

  await expect(page.locator('body')).toHaveAttribute('data-ui-mode', 'classical');
  await expect(flourish).toBeHidden();

  // Flip back and confirm it's reversible, per the plan's "reversible" requirement.
  await toggle.click();
  await expect(page.locator('body')).toHaveAttribute('data-ui-mode', 'gamified');
  await expect(flourish).toBeVisible();
});
