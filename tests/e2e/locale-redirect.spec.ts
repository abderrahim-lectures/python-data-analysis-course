import {test, expect} from '@playwright/test';
import {goto} from './helpers';

test('a French browser is redirected to /fr/ on first visit only', async ({browser}) => {
  const context = await browser.newContext({locale: 'fr-FR'});
  const page = await context.newPage();

  await goto(page, '/');
  await expect(page).toHaveURL(/\/fr\/?$/);

  // Manually navigating to an unprefixed (English) URL afterward must NOT be
  // fought by another redirect -- this only ever runs once per device.
  await goto(page, 'docs/python-101');
  await expect(page).toHaveURL(/\/docs\/python-101$/);

  await context.close();
});

test('an unsupported browser locale stays on the default (English) site', async ({browser}) => {
  const context = await browser.newContext({locale: 'de-DE'});
  const page = await context.newPage();

  await goto(page, '/');
  await expect(page).not.toHaveURL(/\/(ar|es|fr)\//);

  await context.close();
});
