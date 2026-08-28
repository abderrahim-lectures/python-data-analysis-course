import type {Page} from '@playwright/test';

/**
 * Navigates without waiting on images/fonts (`load`). All content assertions
 * poll afterwards with explicit timeouts, so `load` latency is pure flake.
 */
export async function goto(page: Page, url: string): Promise<void> {
  await page.goto(url, {waitUntil: 'domcontentloaded'});
}

/**
 * Seeds first-run state before any page script runs, so one-time onboarding
 * modals can't block the tests:
 * - a fake student ID (LearningStylePicker's hasOnboarded gate), and
 * - completed editor tutorial + tips (their overlays are full-screen and would
 *   otherwise intercept clicks on the Trail cells / advanced editor).
 */
export async function skipOnboarding(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // useLocalStorage stores values JSON-serialized, so the seeded value must be too.
    window.localStorage.setItem('pda-course:student-id', JSON.stringify('TEST1234'));
    window.localStorage.setItem('pda-course:editor-tutorial-seen', 'true');
    window.localStorage.setItem('tipsSeen', 'true');
  });
}
