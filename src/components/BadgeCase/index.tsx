import React from 'react';
import Translate from '@docusaurus/Translate';
import {useUiMode} from '@site/src/context/UiModeContext';
import {useBadges} from '@site/src/hooks/useBadges';
import {useLocalStorage} from '@site/src/hooks/useLocalStorage';
import {STORAGE_KEYS, ALL_STORAGE_KEYS} from '@site/src/utils/storageKeys';
import {getChosenWeeksPartial} from '@site/src/utils/weeks';
import {describeBadge} from '@site/src/utils/describeBadge';
import type {PerSectionTrack, ProgressMap} from '@site/src/types/progress';
import styles from './styles.module.css';

/**
 * Earned badges + overall completion — the "trophy case." Same underlying
 * data either way; Gamified mode renders badge icons, Classical mode
 * renders the same facts as a plain checklist/percentage.
 */
export default function BadgeCase(): React.JSX.Element {
  const {isGamified} = useUiMode();
  const {badges} = useBadges();
  const [progress, setProgress] = useLocalStorage<ProgressMap>(STORAGE_KEYS.progress, {});
  const [tracks] = useLocalStorage<PerSectionTrack>(STORAGE_KEYS.track, {});

  // Partial on purpose: counts progress in whichever section(s) already have
  // a track chosen, so a student who's only started one section sees real
  // numbers instead of "0 / 0" (getChosenWeeks' strict both-sections version
  // is still what gates actual course completion, in useCourseComplete).
  const chosenWeeks = getChosenWeeksPartial(tracks);
  const completedCount = chosenWeeks.filter((w) => progress[w.weekId]).length;
  const totalCount = chosenWeeks.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleReset = () => {
    if (typeof window === 'undefined') return;
    const confirmed = window.confirm(
      'This clears all your saved progress, badges, and settings on this device. Continue?',
    );
    if (!confirmed) return;
    ALL_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
    setProgress({});
    window.location.reload();
  };

  return (
    <div>
      <section className={styles.progressSummary}>
        {totalCount === 0 ? (
          <p>
            <Translate id="badgeCase.noTrack">
              Choose a track on Python 101 or Data Analysis to start tracking progress.
            </Translate>
          </p>
        ) : (
          <>
            <p className={styles.percent}>
              {completedCount} / {totalCount}{' '}
              <Translate id="badgeCase.weeksComplete">weeks complete</Translate> ({percent}%)
            </p>
            <div className={styles.barTrack}>
              <div className={styles.barFill} style={{width: `${percent}%`}} />
            </div>
          </>
        )}
      </section>

      <section>
        <h2>
          {isGamified ? (
            <Translate id="badgeCase.heading.gamified">My Badges</Translate>
          ) : (
            <Translate id="badgeCase.heading.classical">Milestones Earned</Translate>
          )}
        </h2>
        {badges.length === 0 ? (
          <p>
            <Translate id="badgeCase.empty">No badges yet — complete a week to earn one!</Translate>
          </p>
        ) : isGamified ? (
          <div className={styles.badgeGrid}>
            {badges.map((badgeId) => {
              const {emoji, label} = describeBadge(badgeId);
              return (
                <div className={styles.badge} key={badgeId} title={label}>
                  <span className={styles.badgeEmoji}>{emoji}</span>
                  <span className={styles.badgeLabel}>{label}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <ul>
            {badges.map((badgeId) => (
              <li key={badgeId}>{describeBadge(badgeId).label}</li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.settings}>
        <button className="button button--danger button--outline" type="button" onClick={handleReset}>
          <Translate id="badgeCase.reset">Reset my progress</Translate>
        </button>
      </section>
    </div>
  );
}
