/** Single source of truth for every `localStorage` key this site writes. */
export const STORAGE_KEYS = {
  uiMode: 'pda-course:ui-mode',
  progress: 'pda-course:progress',
  revealed: 'pda-course:revealed',
  playgroundCode: 'pda-course:playground-code',
  track: 'pda-course:track',
  placementQuiz: 'pda-course:quiz-data-analysis',
  weeklyQuiz: 'pda-course:weekly-quiz',
  badges: 'pda-course:badges',
  capstoneProgress: 'pda-course:capstone-progress',
  studentName: 'pda-course:student-name',
  lastVisit: 'pda-course:last-visit',
  studentId: 'pda-course:student-id',
  welcomeBackDismissedDate: 'pda-course:welcome-back-dismissed-date',
  localeRedirectChecked: 'pda-course:locale-redirect-checked',
  localeAutoRedirectNotice: 'pda-course:locale-auto-redirect-notice',
} as const;

/** Every key this site owns — used by DataTransfer export/import and the reset control. */
export const ALL_STORAGE_KEYS: string[] = Object.values(STORAGE_KEYS);
