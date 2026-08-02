import {test, expect} from '@playwright/test';
import {skipOnboarding} from './helpers';

const TOTAL = 29;

test.describe('projects gallery', () => {
  test.beforeEach(async ({page}) => {
    await skipOnboarding(page);
  });

  test('serves only the initial batch server-side (SSR) and loads more on scroll', async ({page, request}) => {
    // SSR: the raw HTML must contain exactly the initial batch, not all projects.
    // (React SSR omits attribute quotes, hence the optional quotes in the match.)
    const raw = await (await request.get('/')).text();
    expect(raw.match(/data-testid=["']?gallery-card/g)?.length).toBe(12);

    await page.goto('/');
    await expect(page.getByTestId('gallery-counter')).toHaveText(`Showing ${12} of ${TOTAL}`);

    const cardCount = () => page.getByTestId('gallery-card').count();
    const atEnd = async () => (await page.getByTestId('gallery-end').count()) > 0;

    // Scroll down a viewport at a time; each batch the sentinel loads pushes
    // it further down, so this keeps re-crossing its intersection boundary.
    for (let i = 0; i < 20 && !(await atEnd()); i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(120);
    }

    await expect(page.getByTestId('gallery-end')).toBeVisible();
    await expect(page.getByTestId('gallery-counter')).toHaveText(
      `Showing ${TOTAL} of ${TOTAL}`,
    );
    await expect.poll(async () => cardCount()).toBe(TOTAL);
  });

  test('starring a card persists to localStorage and toggles off', async ({page}) => {
    await page.goto('/');

    const card = page.getByTestId('gallery-card').filter({
      has: page.getByRole('heading', {name: 'Build a Dependency-Freshness Checker'}),
    });
    const star = card.getByTestId('favorite-button');
    await expect(star).toHaveAttribute('aria-pressed', 'false');

    await star.click();
    await expect(star).toHaveAttribute('aria-pressed', 'true');

    const stored = await page.evaluate(() =>
      window.localStorage.getItem('pda-course:favorite-projects'),
    );
    expect(stored).toContain('2027-dependency-freshness-checker');

    await star.click();
    await expect(star).toHaveAttribute('aria-pressed', 'false');
  });

  test('favorites filter shows only starred projects', async ({page}) => {
    await page.goto('/');

    const card = page.getByTestId('gallery-card').filter({
      has: page.getByRole('heading', {name: 'Build a Dependency-Freshness Checker'}),
    });
    await card.getByTestId('favorite-button').click();

    await page.getByRole('button', {name: /Favorites/}).click();

    await expect(page.getByTestId('gallery-counter')).toHaveText(`Showing ${1} of ${1}`);
    await expect(page.getByTestId('gallery-card')).toHaveCount(1);
    await expect(
      page.getByRole('heading', {name: 'Build a Dependency-Freshness Checker'}),
    ).toBeVisible();
  });

  test('favorites are shared across the homepage and the docs projects page', async ({page}) => {
    await page.goto('/');

    const card = page.getByTestId('gallery-card').filter({
      has: page.getByRole('heading', {name: 'Build a Browser-Automation Agent'}),
    });
    await card.getByTestId('favorite-button').click();

    await page.goto('/docs/projects');
    const favoritesButton = page.getByRole('button', {name: /Favorites/});
    await expect(favoritesButton).toContainText('1');
    await favoritesButton.click();
    await expect(page.getByTestId('gallery-counter')).toHaveText(`Showing ${1} of ${1}`);
    await expect(
      page.getByRole('heading', {name: 'Build a Browser-Automation Agent'}),
    ).toBeVisible();
  });

  test('every card shows a level badge and a tools row', async ({page}) => {
    await page.goto('/');

    const firstCard = page.getByTestId('gallery-card').first();
    await expect(firstCard.getByTestId('level-badge')).toBeVisible();
    await expect(firstCard.getByTestId('card-tools')).toBeVisible();
    await expect(firstCard.getByTestId('card-tools').getByRole('listitem').first()).toBeVisible();
    await expect(firstCard.locator('svg').first()).toBeAttached();
  });

  test('level filter narrows to projects of that difficulty', async ({page}) => {
    await page.goto('/');

    await page.getByTestId('level-filter-beginner').click();
    await expect(page.getByTestId('gallery-counter')).toHaveText(`Showing ${12} of ${17}`);
    await expect(page.getByTestId('level-badge')).toHaveCount(12);
    await expect(page.getByTestId('level-badge').first()).toHaveText('Beginner');

    // A beginner project is in the first batch and now visible.
    await expect(
      page.getByRole('heading', {name: 'Build a Wordle Clone'}),
    ).toBeVisible();

    // Toggle off, then try Advanced (a single Hard-track project).
    await page.getByTestId('level-filter-beginner').click();
    await page.getByTestId('level-filter-advanced').click();
    await expect(page.getByTestId('gallery-counter')).toHaveText(`Showing ${1} of ${1}`);
    await expect(page.getByTestId('level-badge')).toHaveCount(1);
    await expect(page.getByTestId('level-badge').first()).toHaveText('Advanced');
    await expect(
      page.getByRole('heading', {name: 'Fine-tune a Small Language Model'}),
    ).toBeVisible();
  });
});
