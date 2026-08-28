import {test, expect} from '@playwright/test';
import {skipOnboarding, goto} from './helpers';

test('the lesson is gamified by default, with no classical mode toggle', async ({page}) => {
  await skipOnboarding(page);
  await goto(page, 'docs/python-101/normal/week-1');

  await expect(page.locator('body')).toHaveAttribute('data-ui-mode', 'gamified');
  await expect(page.locator('.gamified-flourish').first()).toBeVisible();

  // The gamified/Classical reversible toggle was removed: gamified is always on.
  const toggle = page.getByRole('button', {
    name: /switch between gamified and classical/i,
  });
  await expect(toggle).toHaveCount(0);
});