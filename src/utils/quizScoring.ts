import {QUIZ_PASS_THRESHOLD} from '@site/src/utils/badges';
import type {QuizResult} from '@site/src/types/progress';

export interface QuizQuestion {
  id: string;
  correctOptionIndex: number;
}

/** Pure scoring: given questions and the student's chosen option per question, compute a result. */
export function scoreQuiz(
  questions: QuizQuestion[],
  answers: Record<string, number | undefined>,
): QuizResult {
  const total = questions.length;
  const correct = questions.filter((q) => answers[q.id] === q.correctOptionIndex).length;
  const score = total === 0 ? 0 : correct / total;
  return {
    score,
    passed: score >= QUIZ_PASS_THRESHOLD,
    timestamp: Date.now(),
  };
}
