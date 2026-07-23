import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import InstallPwaButton from '@site/src/components/InstallPwaButton';
import {PROJECTS} from '@site/src/data/projects';

import styles from './index.module.css';

/** Structural metadata (date/url/tags) looked up by id, from the shared PROJECTS source of truth. */
function projectMeta(id: string) {
  const meta = PROJECTS.find((p) => p.id === id);
  if (!meta) {
    throw new Error(`No PROJECTS entry for id "${id}" — add one to src/data/projects.ts`);
  }
  return meta;
}

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
      </div>
    </section>
  );
}

function RealWorldProjects() {
  const aiAgent = projectMeta('2026-ai-agent');
  const finetuneLlm = projectMeta('2027-finetune-llm');

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
        <div className={styles.projectGrid}>
          <Link to={finetuneLlm.url} className={styles.projectCard}>
            <h3>
              <Translate
                id="homepage.projects.finetuneLlm.title"
                description="Homepage project card title">
                Fine-tune a Small Language Model
              </Translate>
            </h3>
            <p>
              <Translate
                id="homepage.projects.finetuneLlm.summary"
                description="Homepage project card summary">
                Fine-tune a small open-source language model with LoRA using Unsloth, on a free
                Colab/Kaggle GPU.
              </Translate>
            </p>
            <div className={styles.projectTags}>
              {finetuneLlm.tags.map((tag) => (
                <span key={tag} className={styles.projectTag}>
                  {tag}
                </span>
              ))}
            </div>
          </Link>
          <Link to={aiAgent.url} className={styles.projectCard}>
            <h3>
              <Translate id="homepage.projects.aiAgent.title" description="Homepage project card title">
                Build an AI Agent
              </Translate>
            </h3>
            <p>
              <Translate
                id="homepage.projects.aiAgent.summary"
                description="Homepage project card summary">
                Install Python for real and build your first AI agent with LangChain's deepagents,
                using a free-tier API key.
              </Translate>
            </p>
            <div className={styles.projectTags}>
              {aiAgent.tags.map((tag) => (
                <span key={tag} className={styles.projectTag}>
                  {tag}
                </span>
              ))}
            </div>
          </Link>
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
        <RealWorldProjects />
      </main>
    </Layout>
  );
}
