import type {Page} from '@playwright/test';

/**
 * Seeds a fake student ID before any page script runs, so LearningStylePicker's
 * one-time onboarding modal doesn't block the test (hasOnboarded === true).
 */
export async function skipOnboarding(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // useLocalStorage stores values JSON-serialized, so the seeded value must be too.
    window.localStorage.setItem('pda-course:student-id', JSON.stringify('TEST1234'));
  });
}
