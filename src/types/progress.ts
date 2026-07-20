export type SectionId = 'python-101' | 'data-analysis';
export type TrackId = 'normal' | 'hard';
export type UiMode = 'gamified' | 'classical';

/** e.g. "python-101-normal-week-1" — see utils/weekId.ts for the builder. */
export type WeekId = string;

/** weekId -> completed */
export type ProgressMap = Record<WeekId, boolean>;

/** challengeId -> revealed */
export type RevealedMap = Record<string, boolean>;

export interface QuizResult {
  score: number;
  passed: boolean;
  timestamp: number;
}

/** weekId -> latest quiz result */
export type WeeklyQuizResults = Record<WeekId, QuizResult>;

export type BadgeId = string;
export type BadgeSet = BadgeId[];

export type PerSectionTrack = Partial<Record<SectionId, TrackId>>;
