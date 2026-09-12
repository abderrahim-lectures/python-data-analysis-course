// Resolve a stored badge (quest id from current builds, or a legacy English
// label pushed by older builds) to a localized name for the level-up overlay.
import {m} from '../paraglide/messages.js';

const questById: Record<string, () => string> = {
  'first-run': () => m.progress_quest_first_run(),
  'first-lesson': () => m.progress_quest_first_lesson(),
  'first-project': () => m.progress_quest_first_project(),
  'first-project-done': () => m.progress_quest_first_project_done(),
  'first-project-step': () => m.progress_quest_first_project_step(),
  'project-steps-10': () => m.progress_quest_project_steps_10(),
  'project-steps-25': () => m.progress_quest_project_steps_25(),
  'project-steps-50': () => m.progress_quest_project_steps_50(),
  'track-python-101': () => m.progress_quest_track_python_101(),
  'track-data-analysis': () => m.progress_quest_track_data_analysis(),
  'streak-3': () => m.progress_quest_streak_3(),
  'streak-7': () => m.progress_quest_streak_7(),
  'streak-14': () => m.progress_quest_streak_14(),
  'streak-30': () => m.progress_quest_streak_30(),
  'xp-100': () => m.progress_quest_xp_100(),
  'xp-500': () => m.progress_quest_xp_500(),
  'xp-1000': () => m.progress_quest_xp_1000(),
  'xp-2000': () => m.progress_quest_xp_2000(),
  'xp-3000': () => m.progress_quest_xp_3000(),
  'xp-5000': () => m.progress_quest_xp_5000(),
  'xp-7500': () => m.progress_quest_xp_7500(),
  'projects-5': () => m.progress_quest_projects_5(),
  'projects-10': () => m.progress_quest_projects_10(),
  'projects-25': () => m.progress_quest_projects_25(),
  'projects-50': () => m.progress_quest_projects_50(),
  'first-challenge': () => m.progress_quest_first_challenge(),
  'challenges-10': () => m.progress_quest_challenges_10(),
  'challenges-25': () => m.progress_quest_challenges_25(),
  'challenges-50': () => m.progress_quest_challenges_50(),
  'all-python': () => m.progress_quest_all_python(),
  'all-data': () => m.progress_quest_all_data(),
};

const legacyLabelToId: Record<string, string> = {
  'First run': 'first-run',
  'First Step': 'first-lesson',
  Explorer: 'first-project',
  Builder: 'first-project-done',
  'Step by Step': 'first-project-step',
  '10 Steps': 'project-steps-10',
  '25 Steps': 'project-steps-25',
  '50 Steps': 'project-steps-50',
  'Python track': 'track-python-101',
  'Data track': 'track-data-analysis',
  '3-day streak': 'streak-3',
  '7-day streak': 'streak-7',
  '14-day streak': 'streak-14',
  '30-day streak': 'streak-30',
  '100 XP': 'xp-100',
  '500 XP': 'xp-500',
  '1K XP': 'xp-1000',
  '2K XP': 'xp-2000',
  '3K XP': 'xp-3000',
  '5K XP': 'xp-5000',
  '7.5K XP': 'xp-7500',
  '5 Projects': 'projects-5',
  '10 Projects': 'projects-10',
  '25 Projects': 'projects-25',
  '50 Projects': 'projects-50',
  'Problem Solver': 'first-challenge',
  '10 Challenges': 'challenges-10',
  '25 Challenges': 'challenges-25',
  '50 Challenges': 'challenges-50',
  'Python 101 done': 'all-python',
  'Data Analysis done': 'all-data',
};

const legacyGeneric: Record<string, () => string> = {
  'Lesson complete': () => m.progress_badge_lesson(),
  'Track starter': () => m.progress_badge_track(),
  'Daily login': () => m.progress_badge_login(),
  'Perfect quiz!': () => m.progress_badge_quiz(),
};

export function badgeLabel(badge: string): string {
  const direct = questById[badge];
  if (direct) return direct();
  const generic = legacyGeneric[badge];
  if (generic) return generic();
  if (badge.startsWith('login-')) return m.progress_badge_login();
  if (badge.startsWith('completed-')) return m.progress_badge_lesson();
  if (badge.startsWith('track-')) return m.progress_badge_track();
  if (badge.startsWith('quiz-perfect-')) return m.progress_badge_quiz();
  const id = legacyLabelToId[badge];
  if (id) return questById[id]();
  return badge;
}