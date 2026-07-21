import React from 'react';
import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
import {useLocalStorage} from '@site/src/hooks/useLocalStorage';
import {useQuizScore} from '@site/src/hooks/useQuizScore';
import {useBadges} from '@site/src/hooks/useBadges';
import {usePlacementQuizStatus} from '@site/src/hooks/useUnlockCondition';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';
import {PLACEMENT_QUIZ_PASSED_BADGE} from '@site/src/utils/badges';
import {PLACEMENT_QUIZ_QUESTIONS} from './questions';
import type {QuizResult} from '@site/src/types/progress';
import styles from './styles.module.css';

interface Props {
  onProceed: () => void;
}

export default function PlacementQuiz({onProceed}: Props): React.JSX.Element {
  const {result: storedResult, hasTaken} = usePlacementQuizStatus();
  const [, setStoredResult] = useLocalStorage<QuizResult | null>(
    STORAGE_KEYS.placementQuiz,
    null,
  );
  const {awardBadge} = useBadges();
  const {answers, setAnswer, allAnswered, submitted, result, submit, reset} =
    useQuizScore(PLACEMENT_QUIZ_QUESTIONS);

  const handleSubmit = () => {
    submit();
  };

  React.useEffect(() => {
    if (result) {
      setStoredResult(result);
      if (result.passed) awardBadge(PLACEMENT_QUIZ_PASSED_BADGE);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const handleRetake = () => {
    setStoredResult(null);
    reset();
  };

  // Already taken previously and not currently retaking — show the compact summary.
  if (hasTaken && !submitted) {
    return (
      <div className={styles.card}>
        <p>
          <Translate id="placementQuiz.alreadyTaken">
            You already took this self-check —
          </Translate>{' '}
          {storedResult?.passed ? (
            <Translate id="placementQuiz.passed">nice, you passed! ✅</Translate>
          ) : (
            <Translate id="placementQuiz.notPassed">
              no worries, you can still continue. 🙂
            </Translate>
          )}
        </p>
        <div className={styles.actions}>
          <button className="button button--primary" type="button" onClick={onProceed}>
            <Translate id="placementQuiz.continue">Continue →</Translate>
          </button>
          <button className="button button--secondary" type="button" onClick={handleRetake}>
            <Translate id="placementQuiz.retake">Retake quiz</Translate>
          </button>
        </div>
      </div>
    );
  }

  if (submitted && result) {
    return (
      <div className={styles.card}>
        <h3>
          {result.passed ? (
            <Translate id="placementQuiz.result.passedTitle">
              🎉 You're ready for the Hard track!
            </Translate>
          ) : (
            <Translate id="placementQuiz.result.softGateTitle">
              You might want a quick refresher first
            </Translate>
          )}
        </h3>
        <p>
          <Translate id="placementQuiz.result.score" values={{percent: Math.round(result.score * 100)}}>
            {'You scored {percent}%.'}
          </Translate>
        </p>
        {!result.passed && (
          <p>
            <Translate id="placementQuiz.result.nudge">
              You may want to revisit Python 101 Normal weeks 2–5 first — but you can also
              continue straight into the Hard track if you'd rather learn by doing.
            </Translate>{' '}
            <Link to="/docs/python-101">
              <Translate id="placementQuiz.result.nudgeLink">Review Python 101 →</Translate>
            </Link>
          </p>
        )}
        <div className={styles.actions}>
          <button className="button button--primary" type="button" onClick={onProceed}>
            <Translate id="placementQuiz.continueAnyway">Continue anyway →</Translate>
          </button>
          <button className="button button--secondary" type="button" onClick={handleRetake}>
            <Translate id="placementQuiz.retake">Retake quiz</Translate>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h3>
        <Translate id="placementQuiz.title">Quick self-check: Python 101 fundamentals</Translate>
      </h3>
      <p>
        <Translate id="placementQuiz.intro">
          8 questions, instant results — this is a self-check, not a real gate. You can always
          continue afterward, whatever your score.
        </Translate>
      </p>
      {PLACEMENT_QUIZ_QUESTIONS.map((q, qIndex) => (
        <fieldset className={styles.question} key={q.id}>
          <legend>
            {qIndex + 1}. {q.prompt}
          </legend>
          {q.options.map((option, optIndex) => (
            <label className={styles.option} key={optIndex}>
              <input
                type="radio"
                name={q.id}
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
        onClick={handleSubmit}
        aria-label={translate({id: 'placementQuiz.submit', message: 'Submit quiz'})}>
        <Translate id="placementQuiz.submit">Submit quiz</Translate>
      </button>
    </div>
  );
}
