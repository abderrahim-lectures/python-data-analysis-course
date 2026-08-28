import {test, expect} from '@playwright/test';
import {skipOnboarding, goto} from './helpers';

const DESKTOP_VIEWPORT = {width: 1600, height: 900};

test.describe('Trail inline runnable cells', () => {
  test.beforeEach(async ({page}) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await skipOnboarding(page);
  });

  test('a python fence runs inline and streams its output below the code', async ({page}) => {
    test.setTimeout(180_000);
    await goto(page, 'docs/python-101/normal/week-1');

    const target = page.getByTestId('runnable-cell').filter({hasText: 'price = 19.999'}).first();
    await expect(target).toBeVisible();

    await target.getByRole('button', {name: 'Run this Python code'}).click();

    // Pyodide (~10 MB) streams in on the first run.
    const output = target.getByTestId('runnable-cell-output');
    await expect(output).toBeVisible({timeout: 120_000});
    await expect(output).toContainText('Total: $20.00', {timeout: 20_000});
  });

  test('predicting first, then running, surfaces the Surprise when the guess was wrong', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await goto(page, 'docs/python-101/normal/week-1');

    const target = page.getByTestId('runnable-cell').filter({hasText: 'price = 19.999'}).first();
    await target.getByRole('button', {name: /Predict/}).click();
    await target.locator('input').fill('5');
    await target.getByRole('button', {name: /Run & check/}).click();

    // Predicting wrong is the teaching moment, not a failure signal.
    await expect(target).toContainText('Surprise!', {timeout: 120_000});
    await expect(target).toContainText('Total: $20.00');
  });

  test('cells that wait for input() are blocked instead of hanging', async ({page}) => {
    await goto(page, 'docs/python-101/normal/week-1');

    const inputCell = page.getByTestId('runnable-cell').filter({hasText: "What's your name?"}).first();
    await inputCell.getByRole('button', {name: 'Run this Python code'}).click();

    await expect(inputCell).toContainText('input()', {timeout: 15_000});
  });

  test('an errored edit surfaces the still-red hints and is recorded', async ({page}) => {
    test.setTimeout(180_000);
    await goto(page, 'docs/python-101/normal/week-1');

    const target = page.getByTestId('runnable-cell').first();
    await target.getByRole('button', {name: 'Edit and run this code'}).click();

    const dialog = page.getByRole('dialog', {name: 'Python editor'});
    const editor = dialog.getByLabel('Python code');
    await editor.fill('1 + "a"');
    await dialog.getByRole('button', {name: 'Run', exact: true}).click();

    // A red traceback lands in the inline console…
    await expect(target.getByTestId('runnable-cell-output')).toContainText('TypeError', {
      timeout: 120_000,
    });

    // …and the cell links you back to the teaching paragraph instead of leaving you alone.
    await expect(target).toContainText('Re-read the teaching paragraph');

    const errorHistory = await page.evaluate(() =>
      window.localStorage.getItem('pda-course:error-history'),
    );
    expect(errorHistory).toContain('TypeError');
  });
});