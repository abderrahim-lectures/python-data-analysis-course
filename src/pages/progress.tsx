import type {CSSProperties, ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Head from '@docusaurus/Head';
import Translate, {translate} from '@docusaurus/Translate';
import Layout from '@theme/Layout';
import BadgeCase from '@site/src/components/BadgeCase';
import ShareProgress from '@site/src/components/ShareProgress';
import DataTransfer from '@site/src/components/DataTransfer';
import {useLocalStorage} from '@site/src/hooks/useLocalStorage';
import {useCourseComplete} from '@site/src/hooks/useUnlockCondition';
import {PROJECTS} from '@site/src/data/projects';
import {STORAGE_KEYS} from '@site/src/utils/storageKeys';
import {getChosenWeeksPartial} from '@site/src/utils/weeks';
import type {PerSectionTrack, ProgressMap, ProjectProgressMap} from '@site/src/types/progress';
import styles from './progress.module.css';

function OverallProgress(): React.JSX.Element {
  const [progress] = useLocalStorage<ProgressMap>(STORAGE_KEYS.progress, {});
  const [tracks] = useLocalStorage<PerSectionTrack>(STORAGE_KEYS.track, {});
  const [projectProgress] = useLocalStorage<ProjectProgressMap>(STORAGE_KEYS.projectProgress, {});

  const chosenWeeks = getChosenWeeksPartial(tracks);
  const weeksDone = chosenWeeks.filter((w) => progress[w.weekId]).length;
  const weeksTotal = chosenWeeks.length;
  const projectsDone = PROJECTS.filter((p) => projectProgress[p.id]).length;
  const projectsTotal = PROJECTS.length;

  const tracked = weeksTotal > 0;
  const itemsDone = weeksDone + projectsDone;
  const itemsTotal = weeksTotal + projectsTotal;
  const percent = tracked && itemsTotal > 0 ? Math.round((itemsDone / itemsTotal) * 100) : 0;

  if (!tracked) {
    return (
      <section className={styles.overall}>
        <p className={styles.overallEmpty}>
          <Translate id="progressPage.overall.empty">
            Choose a track on Python 101 or Data Analysis to start tracking progress.
          </Translate>
        </p>
      </section>
    );
  }

  return (
    <section className={styles.overall}>
      <div className={styles.overallInner}>
        <div
          className={styles.ring}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={translate({
            id: 'progressPage.overall.heading',
            message: 'Overall progress',
          })}
          style={{'--ring-pct': `${percent}%`} as CSSProperties}>
          <div className={styles.ringInner}>
            <span className={styles.ringPercent}>{percent}%</span>
          </div>
        </div>
        <div className={styles.overallBody}>
          <div className={styles.overallHeader}>
            <h2>
              <Translate id="progressPage.overall.heading">Overall progress</Translate>
            </h2>
          </div>
          <div className={styles.barTrack}>
            <div className={styles.barFill} style={{width: `${percent}%`}} />
          </div>
          <p className={styles.overallDetail}>
            <Translate
              id="progressPage.overall.detail"
              values={{
                weeks: (
                  <strong>
                    {weeksDone} / {weeksTotal} <Translate id="progressPage.overall.weeks">weeks</Translate>
                  </strong>
                ),
                projects: (
                  <strong>
                    {projectsDone} / {projectsTotal}{' '}
                    <Translate id="progressPage.overall.projects">projects</Translate>
                  </strong>
                ),
              }}>
              {'{weeks} completed and {projects} built'}
            </Translate>
          </p>
        </div>
      </div>
    </section>
  );
}

export default function ProgressPage(): ReactNode {
  const courseComplete = useCourseComplete();

  return (
    <Layout
      title={translate({id: 'progressPage.pageTitle', message: 'My Progress'})}
      description={translate({
        id: 'progressPage.pageDescription',
        message: 'Track your course progress and badges.',
      })}>
      {/* Personal, localStorage-driven page — thin duplicate content with no
          standalone SEO value, so keep it out of search results. */}
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main className="container margin-vert--lg">
        <h1>
          <Translate id="progressPage.heading">My Progress</Translate>
        </h1>
        {courseComplete && (
          <div className="alert alert--success margin-bottom--lg" role="alert">
            🎓{' '}
            <Translate
              id="progressPage.courseComplete"
              values={{
                link: (
                  <Link to="/docs/projects">
                    <strong>
                      <Translate id="progressPage.courseComplete.linkText">
                        build one of the real-world projects
                      </Translate>
                    </strong>
                  </Link>
                ),
              }}>
              {"You've finished the whole course! Nice work — go {link}."}
            </Translate>
          </div>
        )}
        <OverallProgress />
        <BadgeCase />
        <ShareProgress />
        <DataTransfer />
      </main>
    </Layout>
  );
}
