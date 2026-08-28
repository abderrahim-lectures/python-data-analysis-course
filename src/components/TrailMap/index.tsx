import {useEffect, useState} from 'react';
import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
import {useLocalStorage} from '@site/src/hooks/useLocalStorage';
import {useXp} from '@site/src/hooks/useXp';
import {useStreak} from '@site/src/hooks/useStreak';
import {getChosenWeeksPartial} from '@site/src/utils/weeks';
import {PROJECTS} from '@site/src/data/projects';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';
import type {PerSectionTrack, ProgressMap, ProjectProgressMap, SectionId} from '@site/src/types/progress';
import styles from './styles.module.css';

const SECTION_LABEL: Record<SectionId, string> = {
  'python-101': 'Python 101',
  'data-analysis': 'Data Analysis',
};

const SECTION_DOC: Record<SectionId, string> = {
  'python-101': '/docs/python-101',
  'data-analysis': '/docs/data-analysis',
};

/**
 * Full-page trail map: the student's chosen track rendered as a path of week
 * stations, with a "you are here" marker on the first unfinished week. Feeds
 * off the same progress map as the lesson-side trail rail.
 */
export default function TrailMap(): React.JSX.Element {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [tracks] = useLocalStorage<PerSectionTrack>(STORAGE_KEYS.track, {});
  const [progress] = useLocalStorage<ProgressMap>(STORAGE_KEYS.progress, {});
  const [projectProgress] = useLocalStorage<ProjectProgressMap>(STORAGE_KEYS.projectProgress, {});
  const {xp} = useXp();
  const {streak} = useStreak();

  const weeks = getChosenWeeksPartial(tracks);
  const weeksDone = weeks?.filter((w) => progress[w.weekId]).length ?? 0;
  const currentIndex = weeks?.findIndex((w) => !progress[w.weekId]) ?? -1;
  const hasCurrent = currentIndex >= 0;

  if (!mounted) {
    return (
      <section className={styles.wrap}>
        <p className={styles.empty}>
          <Translate id="progressPage.map.emptySsr">
            Your trail map loads here once you start.
          </Translate>
        </p>
      </section>
    );
  }

  if (!weeks || weeks.length === 0) {
    return (
      <section className={styles.wrap}>
        <p className={styles.empty}>
          <Translate id="progressPage.map.empty">
            Choose a track on Python 101 or Data Analysis to reveal your trail map.
          </Translate>
        </p>
      </section>
    );
  }

  const projectsDone = PROJECTS.filter((p) => projectProgress[p.id]).length;
  const bySection = (section: SectionId) =>
    weeks.filter((w) => w.section === section);

  return (
    <section className={styles.map} aria-label={translate({id: 'progressPage.map.label', message: 'Trail map'})}>
      <div className={styles.hud}>
        <span className={styles.hudItem} aria-label={translate({id: 'progressPage.map.xp', message: 'Total XP'})}>
          <span className={styles.hudIcon}>⭐</span> <strong>{xp.total}</strong>{' '}
          <Translate id="progressPage.map.xpLabel">XP</Translate>
        </span>
        <span className={styles.hudItem} aria-label={translate({id: 'progressPage.map.streak', message: 'Current streak'})}>
          <span className={styles.hudIcon}>🔥</span> <strong>{streak.current}</strong>{' '}
          <Translate id="progressPage.map.streakLabel">day streak</Translate>
        </span>
        <span className={styles.hudItem} aria-label={translate({id: 'progressPage.map.weeks', message: 'Weeks completed'})}>
          <span className={styles.hudIcon}>📚</span>{' '}
          <strong>
            {weeksDone} / {weeks.length}
          </strong>
        </span>
        <span className={styles.hudItem} aria-label={translate({id: 'progressPage.map.projects', message: 'Projects built'})}>
          <span className={styles.hudIcon}>🛠️</span>{' '}
          <strong>
            {projectsDone} / {PROJECTS.length}
          </strong>
        </span>
      </div>

      <ol className={styles.weeks}>
        {(['python-101', 'data-analysis'] as SectionId[]).map((section) => {
          const sectionWeeks = bySection(section);
          if (sectionWeeks.length === 0) return null;
          const sectionDone = sectionWeeks.every((w) => progress[w.weekId]);
          return (
            <li key={section} className={styles.section}>
              <header className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  <Link to={SECTION_DOC[section]}>{SECTION_LABEL[section]}</Link>
                </h2>
                {sectionDone && (
                  <span className={styles.sectionDone}>
                    <Translate id="progressPage.map.sectionDone">Section complete 🎉</Translate>
                  </span>
                )}
              </header>
              <ol className={styles.sectionPath}>
                {sectionWeeks.map((w) => {
                  const done = Boolean(progress[w.weekId]);
                  const current = hasCurrent && w.weekId === weeks[currentIndex].weekId;
                  const state = done ? 'done' : current ? 'current' : 'upcoming';
                  return (
                    <li key={w.weekId} className={styles.station} data-state={state}>
                      <span className={styles.line} aria-hidden="true" />
                      <Link className={styles.button} to={w.path} aria-current={current ? 'step' : undefined}>
                        <span className={styles.dot} aria-hidden="true">
                          {done ? '✓' : w.week}
                        </span>
                        <span className={styles.stationBody}>
                          <span className={styles.stationTitle}>
                            <Translate
                              id="progressPage.map.weekLabel"
                              values={{number: w.week}}>
                              {'Week {number}'}
                            </Translate>
                          </span>
                          <span className={styles.stateBadge} data-state={state}>
                            {done ? (
                              <Translate id="progressPage.map.done">Completed</Translate>
                            ) : current ? (
                              <Translate id="progressPage.map.current">You are here</Translate>
                            ) : (
                              <Translate id="progressPage.map.upcoming">Upcoming</Translate>
                            )}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </li>
          );
        })}
        {hasCurrent && (
          <Link className={styles.nextUp} to={weeks[currentIndex].path}>
            <Translate id="progressPage.map.nextUp">Continue your trail →</Translate>
          </Link>
        )}
      </ol>
    </section>
  );
}