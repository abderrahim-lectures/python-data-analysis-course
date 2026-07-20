import {useCallback, useMemo, useState} from 'react';
import {scoreQuiz, type QuizQuestion} from '@site/src/utils/quizScoring';
import type {QuizResult} from '@site/src/types/progress';

/**
 * Thin React-state wrapper around the pure scoring functions in utils/quizScoring.ts.
 * Shared by WeeklyQuiz and PlacementQuiz — persistence is each component's own concern
 * (their storage shapes differ: a map keyed by weekId vs. a single result).
 */
export function useQuizScore(questions: QuizQuestion[]) {
  const [answers, setAnswers] = useState<Record<string, number | undefined>>({});
  const [submitted, setSubmitted] = useState(false);

  const setAnswer = useCallback((questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({...prev, [questionId]: optionIndex}));
  }, []);

  const allAnswered = useMemo(
    () => questions.every((q) => answers[q.id] !== undefined),
    [questions, answers],
  );

  const result: QuizResult | null = useMemo(() => {
    if (!submitted) return null;
    return scoreQuiz(questions, answers);
  }, [submitted, questions, answers]);

  const submit = useCallback(() => setSubmitted(true), []);
  const reset = useCallback(() => {
    setAnswers({});
    setSubmitted(false);
  }, []);

  return {answers, setAnswer, allAnswered, submitted, result, submit, reset};
}
