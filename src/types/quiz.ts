import type {QuizQuestion} from '@site/src/utils/quizScoring';

/** A quiz question with the display text needed to render it, not just score it. */
export interface DisplayQuizQuestion extends QuizQuestion {
  prompt: string;
  options: string[];
}
