import {type ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import InstallPwaButton from '@site/src/components/InstallPwaButton';
import ProjectGallery from '@site/src/components/ProjectGallery';
import {PROJECTS, getProjectMeta} from '@site/src/data/projects';
import {HOMEPAGE_PROJECTS} from '@site/src/data/homepageProjects';

import styles from './index.module.css';

/* Browser-window mockup that illustrates "run Python in your browser":
   a tiny Jupyter-style notebook with syntax-highlighted code and a plot. */
function HeroVisual() {
  return (
    <div className={styles.heroVisual} aria-hidden="true">
      <div className={styles.window}>
        <div className={styles.windowBar}>
          <span className={styles.windowDot} />
          <span className={styles.windowDot} />
          <span className={styles.windowDot} />
          <span className={styles.windowUrl}>python-course.app/notebook</span>
        </div>
        <div className={styles.windowBody}>
          <div className={styles.editor}>
            <div className={styles.lineGutter} aria-hidden="true">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
            </div>
            <div className={styles.code}>
              <span>
                <span className={styles.kw}>import</span> <span className={styles.mod}>pandas</span> <span className={styles.kw}>as</span>{' '}
                <span className={styles.mod}>pd</span>
              </span>
              <span>
                <span className={styles.mod}>df</span> = pd.<span className={styles.fn}>read_csv</span>(
                <span className={styles.str}>"sales.csv"</span>)
              </span>
              <span>
                <span className={styles.mod}>df</span>.<span className={styles.fn}>groupby</span>(
                <span className={styles.str}>"region"</span>).<span className={styles.fn}>sum</span>()
              </span>
              <span className={styles.output}>✓ 0.42s · 42 rows</span>
            </div>
          </div>
          <div className={styles.plot}>
            <svg viewBox="0 0 240 96" role="presentation" focusable="false">
              <defs>
                <linearGradient id="heroPlotFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a894fa" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#a894fa" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {[16, 32, 48, 64, 80].map((y) => (
                <line key={y} x1="0" x2="240" y1={y} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              ))}
              <path
                d="M0 76 L30 66 L60 70 L90 52 L120 56 L150 38 L180 44 L210 24 L240 30 L240 96 L0 96 Z"
                fill="url(#heroPlotFill)"
              />
              <polyline
                points="0 76,30 66,60 70,90 52,120 56,150 38,180 44,210 24,240 30"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {[30, 90, 150, 210].map((x) => (
                <circle key={x} cx={x} cy={[66, 52, 38, 24][[30, 90, 150, 210].indexOf(x)]} r="3.5" fill="#fbbf24" stroke="#1e1b2e" strokeWidth="1.5" />
              ))}
            </svg>
          </div>
        </div>
      </div>
      <span className={styles.runChip}>
        <span className={styles.runArrow}>▶</span>
        <Translate id="homepage.hero.runChip" description="Homepage hero floating chip">
          Run in your browser
        </Translate>
      </span>
    </div>
  );
}

function HomepageHeader() {
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <div className={styles.heroGrid}>
          <div>
            <Heading as="h1" className={styles.heroTitle}>
              <Translate id="homepage.hero.title" description="Homepage hero title">
                Python & Data Analysis Course
              </Translate>
            </Heading>
            <p className={styles.heroSubtitle}>
              <Translate id="homepage.hero.tagline" description="Homepage hero tagline">
                Learn Python and data analysis in your browser — no installs needed
              </Translate>
            </p>
            <div className={styles.heroStats} aria-label="Course highlights">
              <div className={styles.heroStat}>
                <span className={styles.heroStatValue}>10</span>
                <span className={styles.heroStatLabel}>
                  <Translate id="homepage.hero.statWeeks" description="Homepage hero stat: weeks">
                    weeks
                  </Translate>
                </span>
              </div>
              <div className={styles.heroStat}>
                <span className={styles.heroStatValue}>{PROJECTS.length}+</span>
                <span className={styles.heroStatLabel}>
                  <Translate id="homepage.hero.statProjects" description="Homepage hero stat: projects">
                    real-world projects
                  </Translate>
                </span>
              </div>
              <div className={styles.heroStat}>
                <span className={styles.heroStatValue}>0</span>
                <span className={styles.heroStatLabel}>
                  <Translate id="homepage.hero.statInstalls" description="Homepage hero stat: installs">
                    installs to start
                  </Translate>
                </span>
              </div>
            </div>
            <div className={styles.buttons}>
              <Link className={clsx('button button--lg', styles.heroCta)} to="/docs/python-101">
                <Translate id="homepage.hero.startButton" description="Homepage hero CTA button">
                  Start Python 101 →
                </Translate>
              </Link>
              <InstallPwaButton />
            </div>
          </div>
          <HeroVisual />
        </div>
      </div>
    </header>
  );
}

function SectionCards() {
  return (
    <section className={styles.sections}>
      <div className="container">
        <div className="row">
          <div className="col col--6">
            <div className={styles.sectionCard}>
              <h2>
                <Translate id="homepage.section1.title" description="Homepage Python 101 card title">
                  🐍 Section 1: Python 101
                </Translate>
              </h2>
              <p>
                <Translate
                  id="homepage.section1.description"
                  description="Homepage Python 101 card description"
                  values={{
                    normal: (
                      <strong>
                        <Translate id="homepage.trackNormal" description="Normal track, short label">
                          Normal
                        </Translate>
                      </strong>
                    ),
                    hard: (
                      <strong>
                        <Translate id="homepage.trackHard" description="Hard track, short label">
                          Hard
                        </Translate>
                      </strong>
                    ),
                  }}>
                  {
                    '5 weeks of Python fundamentals. Choose a {normal} track (no installs, code right in your browser) or a {hard} track where you build a tiny language model from scratch using nothing but built-in Python.'
                  }
                </Translate>
              </p>
              <div className={styles.sectionTracks}>
                <span className={styles.sectionTrack}>
                  <Translate id="homepage.trackNormal" description="Normal track, short label">
                    Normal
                  </Translate>
                </span>
                <span className={styles.sectionTrack}>
                  <Translate id="homepage.trackHard" description="Hard track, short label">
                    Hard
                  </Translate>
                </span>
              </div>
              <Link className="button button--primary" to="/docs/python-101">
                <Translate id="homepage.section1.cta" description="Homepage Python 101 card CTA">
                  Explore Python 101
                </Translate>
              </Link>
            </div>
          </div>
          <div className="col col--6">
            <div className={styles.sectionCard}>
              <h2>
                <Translate
                  id="homepage.section2.title"
                  description="Homepage Data Analysis card title">
                  📊 Section 2: Pandas &amp; Data Analysis
                </Translate>
              </h2>
              <p>
                <Translate
                  id="homepage.section2.description"
                  description="Homepage Data Analysis card description"
                  values={{
                    normal: (
                      <strong>
                        <Translate id="homepage.trackNormal" description="Normal track, short label">
                          Normal
                        </Translate>
                      </strong>
                    ),
                    hard: (
                      <strong>
                        <Translate id="homepage.trackHard" description="Hard track, short label">
                          Hard
                        </Translate>
                      </strong>
                    ),
                  }}>
                  {
                    '5 weeks of pandas and exploratory data analysis. Reproduce a Kaggle-style notebook on the {normal} track, or run a full EDA project with visualizations on the {hard} track.'
                  }
                </Translate>
              </p>
              <div className={styles.sectionTracks}>
                <span className={styles.sectionTrack}>
                  <Translate id="homepage.trackNormal" description="Normal track, short label">
                    Normal
                  </Translate>
                </span>
                <span className={styles.sectionTrack}>
                  <Translate id="homepage.trackHard" description="Hard track, short label">
                    Hard
                  </Translate>
                </span>
              </div>
              <Link className="button button--primary" to="/docs/data-analysis">
                <Translate id="homepage.section2.cta" description="Homepage Data Analysis card CTA">
                  Explore Data Analysis
                </Translate>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RealWorldProjects() {
  return (
    <section className={styles.projects}>
      <div className="container">
        <Heading as="h2">
          <Translate id="homepage.projects.title" description="Homepage real-world projects section title">
            🌍 Real-World Projects
          </Translate>
        </Heading>
        <p className={styles.projectsIntro}>
          <Translate
            id="homepage.projects.intro"
            description="Homepage real-world projects section intro">
            Practical projects you can build with Python, installed for real on your own machine —
            browse any time, no need to finish the course first.
          </Translate>
        </p>
        <ProjectGallery
          projects={HOMEPAGE_PROJECTS.map(({id, title, summary}) => ({
            ...getProjectMeta(id),
            title,
            summary,
          }))}
        />
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title={translate({id: 'homepage.pageTitle', message: 'Python & Data Analysis Course'})}
      description={translate({
        id: 'homepage.pageDescription',
        message:
          "A free, browser-based Python and data analysis course — no installs required until you're ready to graduate to the real thing.",
      })}>
      <HomepageHeader />
      <main>
        <SectionCards />
        <RealWorldProjects />
      </main>
    </Layout>
  );
}
