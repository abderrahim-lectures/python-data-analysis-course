import {test, expect} from '@playwright/test';
import {skipOnboarding, goto} from './helpers';

test('a lesson page swaps the docs tree for the trail rail, and the rail tracks progress', async ({
  page,
}) => {
  await skipOnboarding(page);
  await goto(page, 'docs/python-101/normal/week-1');

  // The docs tree is gone on lesson pages.
  await expect(page.locator('nav[aria-label="Docs sidebar"]')).toHaveCount(0);

  const rail = page.getByTestId('trail-rail');
  await expect(rail).toBeVisible();
  await expect(rail.getByRole('link', {name: 'Week 1: here'})).toBeVisible();
  await expect(rail.getByRole('link', {name: 'Week 2: upcoming'})).toBeVisible();

  // Completing the week marks its node as done — visible from the next stop
  // on the trail (the current week always reads "here").
  await page.getByRole('checkbox', {name: /mark this week complete/i}).check();
  await page.reload();

  // The rail is the way forward: click through to the next week.
  await rail.getByRole('link', {name: 'Week 2: upcoming'}).click();
  await expect(page).toHaveURL(/week-2$/);
  await expect(page.getByTestId('trail-rail').getByRole('link', {name: 'Week 2: here'})).toBeVisible();
  await expect(page.getByTestId('trail-rail').getByRole('link', {name: 'Week 1: completed'})).toBeVisible();
});

test('non-lesson docs keep the regular sidebar', async ({page}) => {
  await skipOnboarding(page);
  await goto(page, 'docs/data-analysis');

  await expect(page.locator('nav[aria-label="Docs sidebar"]')).toBeVisible();
  await expect(page.getByTestId('trail-rail')).toHaveCount(0);
});