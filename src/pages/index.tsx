import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import InstallPwaButton from '@site/src/components/InstallPwaButton';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/docs/python-101">
            Start Python 101 →
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
              <h2>🐍 Section 1: Python 101</h2>
              <p>
                5 weeks of Python fundamentals. Choose a <strong>Normal</strong> track (no
                installs, code right in your browser) or a <strong>Hard</strong> track where
                you build a tiny language model from scratch using nothing but built-in Python.
              </p>
              <Link className="button button--primary" to="/docs/python-101">
                Explore Python 101
              </Link>
            </div>
          </div>
          <div className="col col--6">
            <div className={styles.sectionCard}>
              <h2>📊 Section 2: Pandas &amp; Data Analysis</h2>
              <p>
                5 weeks of pandas and exploratory data analysis. Reproduce a Kaggle-style
                notebook on the <strong>Normal</strong> track, or run a full EDA project with
                visualizations on the <strong>Hard</strong> track.
              </p>
              <Link className="button button--primary" to="/docs/data-analysis">
                Explore Data Analysis
              </Link>
            </div>
          </div>
        </div>
        <div className={styles.capstoneTeaser}>
          <p>
            🎁 <strong>Finish the course</strong> to unlock a guided walkthrough: install Python
            for real and build your own AI agent —{' '}
            <Link to="/docs/bonus/capstone-ai-agent">see the Capstone Bonus</Link>.
          </p>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="A free, browser-based Python and data analysis course — no installs required until you're ready to graduate to the real thing.">
      <HomepageHeader />
      <main>
        <SectionCards />
      </main>
    </Layout>
  );
}
