import React, {useMemo} from 'react';
import clsx from 'clsx';
import Translate, {translate} from '@docusaurus/Translate';
import {useLocation} from '@docusaurus/router';
import {useLocalStorage} from '@site/src/hooks/useLocalStorage';
import type {ProgressMap} from '@site/src/types/progress';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';
import styles from './styles.module.css';

const LESSON_WEEKS = 5;

export interface LessonPath {
  section: string;
  track: string;
  week: number;
}

/** Matches ".../docs/<section>/<track>/week-N" in any locale (default locale has no prefix). */
export function parseLessonPath(pathname: string): LessonPath | null {
  const parts = pathname.split('/').filter(Boolean);
  const docsIdx = parts.findIndex((p) => p === 'docs');
  if (docsIdx === -1 || docsIdx + 3 > parts.length - 1) return null;
  const [section, track, weekRaw] = parts.slice(docsIdx + 1);
  if (!section || !track) return null;
  const m = /^week-(\d+)$/.exec(weekRaw ?? '');
  if (!m) return null;
  return {section, track, week: Number(m[1])};
}

/**
 * "Trail rail" — the lesson sidebar becomes a short vertical map of the weeks
 * (done / here / upcoming), so a beginner always knows where they stand on the
 * path instead of staring at the full docs tree. Replaces the Docusaurus
 * sidebar on lesson pages only; every other doc keeps the normal sidebar.
 */
export default function TrailRail(): React.JSX.Element | null {
  const {pathname} = useLocation();
  const lesson = useMemo(() => parseLessonPath(pathname), [pathname]);
  const [progress] = useLocalStorage<ProgressMap>(STORAGE_KEYS.progress, {});

  const baseUrl = pathname.replace(/week-\d+$/, '');
  const weekId = (week: number) => `${lesson?.section}-${lesson?.track}-week-${week}`;
  const stateFor = (week: number): 'done' | 'current' | 'upcoming' => {
    if (lesson && lesson.week === week) return 'current';
    if (progress[weekId(week)]) return 'done';
    return 'upcoming';
  };

  if (!lesson) return null;

  return (
    <nav
        className={styles.rail}
        data-testid="trail-rail"
        aria-label={translate({
          id: 'trailRail.label',
          message: 'Your learning trail',
        })}>
      <p className={styles.title}>
        <Translate id="trailRail.title">Your trail</Translate>
      </p>

      <ol className={styles.trail}>
        {Array.from({length: LESSON_WEEKS}, (_, i) => {
          const week = i + 1;
          const state = stateFor(week);
          return (
            <li key={week} className={styles.nodeWrap}>
              <a
                className={clsx(styles.node, styles[`node--${state}`])}
                href={`${baseUrl}week-${week}`}
                data-trail-week={week}
                data-trail-state={state}
                aria-current={state === 'current' ? 'step' : undefined}
                aria-label={
                  state === 'current'
                    ? translate(
                        {
                          id: 'trailRail.current',
                          message: 'Week {number}: here',
                        },
                        {number: week},
                      )
                    : state === 'done'
                      ? translate(
                          {
                            id: 'trailRail.done',
                            message: 'Week {number}: completed',
                          },
                          {number: week},
                        )
                      : translate(
                          {
                            id: 'trailRail.upcoming',
                            message: 'Week {number}: upcoming',
                          },
                          {number: week},
                        )
                }>
                <span className={styles.marker} aria-hidden="true">
                  {state === 'done' ? '✓' : ''}
                </span>
                <span className={styles.label}>
                  {translate(
                    {
                      id: 'trailRail.weekLabel',
                      message: 'Week {number}',
                    },
                    {number: week},
                  )}
                </span>
              </a>
            </li>
          );
        })}
      </ol>

      <a className={styles.home} href={`/docs/${lesson.section}`}>
        <Translate id="trailRail.home">
          Back to the track
        </Translate>
      </a>
    </nav>
  );
}