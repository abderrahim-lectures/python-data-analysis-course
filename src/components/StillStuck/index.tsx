import React from 'react';
import clsx from 'clsx';
import Translate, {translate} from '@docusaurus/Translate';
import {countErrorsForWeek, STUCK_THRESHOLD, type StoredError} from '@site/src/hooks/useErrorHistory';
import styles from './styles.module.css';

interface Props {
  weekId: string;
  errors: StoredError[];
  /** 'overlay' renders the panel floating over the terminal inside the dock. */
  variant?: 'inline' | 'overlay';
}

/**
 * "Still stuck?" escalation panel (Part 7.7): after 3+ distinct error patterns
 * on the same week, offer a kind, concrete helping hand rather than letting the
 * student churn alone. Follows the wait-what principle — re-explain with the
 * path forward, not just "try again". Zero-pressure: dismissable, links out to
 * search and the week's lesson.
 */
export default function StillStuck({weekId, errors}: Props): React.JSX.Element | null {
  const [dismissed, setDismissed] = React.useState(false);
  const [showErrors, setShowErrors] = React.useState(false);

  const weekErrors = errors.filter((e) => e.weekId === weekId);
  const distinctCount = countErrorsForWeek(errors, weekId);

  if (dismissed || distinctCount < STUCK_THRESHOLD) return null;

  const searchQuery = encodeURIComponent(
    weekErrors.map((e) => e.message).slice(0, 3).join(' '),
  );

  return (
    <aside className={styles.panel} role="complementary" aria-label="Still stuck?">
      <div className={styles.header}>
        <span className={styles.emoji} aria-hidden="true">
          🙋
        </span>
        <div>
          <p className={styles.title}>
            <Translate id="stillStuck.title">You're not stuck — every coder hits this</Translate>
          </p>
          <p className={styles.subtitle}>
            <Translate
              id="stillStuck.subtitle"
              values={{count: `${distinctCount} different errors`}}>
              {"I noticed {count} on this lesson. That's completely normal. Here's a plan."}
            </Translate>
          </p>
        </div>
        <button
          type="button"
          className={styles.dismiss}
          onClick={() => setDismissed(true)}
          aria-label={translate({id: 'stillStuck.dismiss', message: 'Dismiss help'})}>
          ×
        </button>
      </div>

      <ol className={styles.steps}>
        <li>
          <Translate id="stillStuck.step1">
            Fix one error at a time — read the colored hint under the red message below the editor first.
          </Translate>
        </li>
        <li>
          <Translate id="stillStuck.step2">
            Look back at the code block in the lesson right above you — copy it exactly, then change the one part the challenge asks for.
          </Translate>
        </li>
        <li>
          <Translate id="stillStuck.step3">
            Still red after three tries? Peek at the challenge answer — reading a worked solution is how everyone learns.
          </Translate>
        </li>
      </ol>

      <div className={styles.actions}>
        <a
          className="button button--primary button--sm"
          href="https://github.com/abderrahim-lectures/python-data-analysis-course/discussions"
          target="_blank"
          rel="noopener noreferrer">
          <Translate id="stillStuck.actions.help">Ask for help</Translate>
        </a>
        <a
          className="button button--secondary button--sm"
          href={`https://www.google.com/search?q=${searchQuery} python`}
          target="_blank"
          rel="noopener noreferrer">
          <Translate id="stillStuck.actions.search">Search this error</Translate>
        </a>
        <a
          className="button button--link button--sm"
          href={`https://github.com/abderrahim-lectures/python-data-analysis-course/issues/new?title=Stuck%20on%20${encodeURIComponent(weekId)}&body=${searchQuery}`}
          target="_blank"
          rel="noopener noreferrer">
          <Translate id="stillStuck.actions.report">Report this issue</Translate>
        </a>
      </div>

      <button
        type="button"
        className={styles.toggleErrors}
        onClick={() => setShowErrors((s) => !s)}
        aria-expanded={showErrors}>
        <Translate id="stillStuck.toggleErrors">
          Show the exact errors I hit
        </Translate>
      </button>
      {showErrors && (
        <ul className={styles.errorList}>
          {[...new Set(weekErrors.map((e) => e.message))].map((msg) => (
            <li key={msg} className={styles.errorItem}>
              <code>{msg}</code>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}