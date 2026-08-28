import {test, expect} from '@playwright/test';
import {skipOnboarding, goto} from './helpers';

test('the progress page renders a trail map from the chosen track and current week', async ({page}) => {
  await skipOnboarding(page);
  await page.addInitScript(() => {
    window.localStorage.setItem('pda-course:track', JSON.stringify({'python-101': 'normal'}));
  });
  await goto(page, 'progress');

  const map = page.getByRole('region', {name: 'Trail map'});
  await expect(map).toBeVisible();

  // HUD stats reflect stored state (zero XP but the map itself is drawn).
  await expect(page.getByText('day streak')).toBeVisible();

  // All 5 weeks of the chosen Python-101 track appear; week 1 is current.
  const stations = map.locator('li[data-state]');
  await expect(stations).toHaveCount(5);
  await expect(map.getByRole('link', {name: /Week 1/})).toHaveAttribute('aria-current', 'step');
  await expect(map.getByText('You are here').first()).toBeVisible();
  await expect(map.getByText('Upcoming').first()).toBeVisible();

  // Completing week 1 via its lesson, then reloading, marks the station done.
  await map.getByRole('link', {name: /Week 1/}).click();
  await expect(page).toHaveURL(/\/week-1$/);
  await page.getByRole('checkbox', {name: /mark this week complete/i}).check();
  await goto(page, 'progress');
  const map2 = page.getByRole('region', {name: 'Trail map'});
  await expect(map2.locator('li[data-state="done"]', {hasText: 'Week 1'})).toBeVisible();
  await expect(map2.getByText('Completed').first()).toBeVisible();
  await expect(map2.locator('li[data-state="current"]', {hasText: 'Week 2'})).toBeVisible();
});
