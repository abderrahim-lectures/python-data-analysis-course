import {test, expect} from '@playwright/test';
import {skipOnboarding} from './helpers';

test('choosing Hard on Data Analysis shows the placement quiz; continuing reaches Week 6', async ({
  page,
}) => {
  await skipOnboarding(page);
  await page.goto('docs/data-analysis');

  await page.getByRole('link', {name: /start hard/i}).click();
  await expect(
    page.getByRole('heading', {name: /quick self-check: python 101 fundamentals/i}),
  ).toBeVisible();

  // Answer every question with its first option — the placement quiz is a soft
  // gate, so the score doesn't matter for this test, only that submitting works.
  const questions = page.locator('fieldset');
  const count = await questions.count();
  for (let i = 0; i < count; i += 1) {
    await questions.nth(i).locator('input[type="radio"]').first().check();
  }

  await page.getByRole('button', {name: /^submit quiz$/i}).click();
  await page.getByRole('button', {name: /continue anyway/i}).click();

  await expect(page).toHaveURL(/\/docs\/data-analysis\/hard\/week-6/);
  await expect(page.getByRole('heading', {name: /week 6/i})).toBeVisible();
});
