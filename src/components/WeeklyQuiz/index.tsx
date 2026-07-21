import React, {useEffect} from 'react';
import Translate from '@docusaurus/Translate';
import {useLocalStorage} from '@site/src/hooks/useLocalStorage';
import {useQuizScore} from '@site/src/hooks/useQuizScore';
import {useBadges} from '@site/src/hooks/useBadges';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';
import {weekQuizAceBadge, bonusUnlockedBadge} from '@site/src/utils/badges';
import type {DisplayQuizQuestion} from '@site/src/types/quiz';
import type {WeekId, WeeklyQuizResults} from '@site/src/types/progress';
import styles from './styles.module.css';

interface Props {
  weekId: WeekId;
  questions: DisplayQuizQuestion[];
}

/** Short auto-graded quiz at the end of a week — passing unlocks that week's BonusContent. */
export default function WeeklyQuiz({weekId, questions}: Props): React.JSX.Element {
  const [weeklyResults, setWeeklyResults] = useLocalStorage<WeeklyQuizResults>(
    STORAGE_KEYS.weeklyQuiz,
    {},
  );
  const {awardBadge} = useBadges();
  const {answers, setAnswer, allAnswered, submitted, result, submit, reset} =
    useQuizScore(questions);

  const existing = weeklyResults[weekId];

  useEffect(() => {
    if (result) {
      setWeeklyResults((prev) => ({...prev, [weekId]: result}));
      if (result.passed) {
        awardBadge(weekQuizAceBadge(weekId));
        awardBadge(bonusUnlockedBadge(weekId));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const handleRetake = () => {
    setWeeklyResults((prev) => {
      const next = {...prev};
      delete next[weekId];
      return next;
    });
    reset();
  };

  if (existing && !submitted) {
    return (
      <div className={styles.card}>
        <h3>
          <Translate id="weeklyQuiz.title">✅ Weekly quiz</Translate>
        </h3>
        <p>
          {existing.passed ? (
            <Translate id="weeklyQuiz.passedSummary">
              You passed this week's quiz — bonus content below is unlocked.
            </Translate>
          ) : (
            <Translate
              id="weeklyQuiz.failedSummary"
              values={{percent: Math.round(existing.score * 100)}}>
              {'You scored {percent}% — not quite the bonus threshold yet.'}
            </Translate>
          )}
        </p>
        <button className="button button--secondary" type="button" onClick={handleRetake}>
          <Translate id="weeklyQuiz.retake">Retake quiz</Translate>
        </button>
      </div>
    );
  }

  if (submitted && result) {
    return (
      <div className={styles.card}>
        <h3>
          {result.passed ? (
            <Translate id="weeklyQuiz.result.passed">🔓 Nice — bonus content unlocked!</Translate>
          ) : (
            <Translate id="weeklyQuiz.result.notPassed">
              Not quite — review the lesson and try again any time.
            </Translate>
          )}
        </h3>
        <p>
          <Translate id="weeklyQuiz.result.score" values={{percent: Math.round(result.score * 100)}}>
            {'You scored {percent}%.'}
          </Translate>
        </p>
        <button className="button button--secondary" type="button" onClick={handleRetake}>
          <Translate id="weeklyQuiz.retake">Retake quiz</Translate>
        </button>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h3>
        <Translate id="weeklyQuiz.title">✅ Weekly quiz</Translate>
      </h3>
      {questions.map((q, qIndex) => (
        <fieldset className={styles.question} key={q.id}>
          <legend>
            {qIndex + 1}. {q.prompt}
          </legend>
          {q.options.map((option, optIndex) => (
            <label className={styles.option} key={optIndex}>
              <input
                type="radio"
                name={`${weekId}-${q.id}`}
                checked={answers[q.id] === optIndex}
                onChange={() => setAnswer(q.id, optIndex)}
              />
              <span>{option}</span>
            </label>
          ))}
        </fieldset>
      ))}
      <button
        className="button button--primary button--block"
        type="button"
        disabled={!allAnswered}
        onClick={submit}>
        <Translate id="weeklyQuiz.submit">Submit quiz</Translate>
      </button>
    </div>
  );
}
