import {test, expect} from '@playwright/test';
import {skipOnboarding} from './helpers';

test('progress, badges, and ui-mode survive a reload', async ({page}) => {
  await skipOnboarding(page);
  await page.goto('docs/python-101/normal/week-1');

  const checkbox = page.getByRole('checkbox', {name: /mark this week complete/i});
  await expect(checkbox).toBeVisible();
  await checkbox.check();
  await expect(checkbox).toBeChecked();

  const progress = await page.evaluate(() =>
    window.localStorage.getItem('pda-course:progress'),
  );
  expect(progress).toContain('python-101-normal-week-1');

  const badges = await page.evaluate(() => window.localStorage.getItem('pda-course:badges'));
  expect(badges).toContain('python-101-normal-week-1');

  await page.reload();
  await expect(page.getByRole('checkbox', {name: /mark this week complete/i})).toBeChecked();
});
