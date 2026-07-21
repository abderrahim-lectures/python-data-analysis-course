import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import InstallPwaButton from '@site/src/components/InstallPwaButton';

import styles from './index.module.css';

function HomepageHeader() {
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          <Translate id="homepage.hero.title" description="Homepage hero title">
            Python & Data Analysis Course
          </Translate>
        </Heading>
        <p className="hero__subtitle">
          <Translate id="homepage.hero.tagline" description="Homepage hero tagline">
            Learn Python and data analysis in your browser — no installs needed
          </Translate>
        </p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/docs/python-101">
            <Translate id="homepage.hero.startButton" description="Homepage hero CTA button">
              Start Python 101 →
            </Translate>
          </Link>
          <InstallPwaButton />
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
              <Link className="button button--primary" to="/docs/data-analysis">
                <Translate id="homepage.section2.cta" description="Homepage Data Analysis card CTA">
                  Explore Data Analysis
                </Translate>
              </Link>
            </div>
          </div>
        </div>
        <div className={styles.capstoneTeaser}>
          <p>
            🎁{' '}
            <Translate
              id="homepage.capstoneTeaser"
              description="Homepage capstone teaser"
              values={{
                finishBold: (
                  <strong>
                    <Translate id="homepage.capstoneTeaser.finishBold" description="Bolded lead-in phrase">
                      Finish the course
                    </Translate>
                  </strong>
                ),
                link: (
                  <Link to="/docs/bonus/capstone-ai-agent">
                    <Translate id="homepage.capstoneTeaser.linkText" description="Capstone teaser link text">
                      see the Capstone Bonus
                    </Translate>
                  </Link>
                ),
              }}>
              {
                '{finishBold} to unlock a guided walkthrough: install Python for real and build your own AI agent — {link}.'
              }
            </Translate>
          </p>
        </div>
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
      </main>
    </Layout>
  );
}
