import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import InstallPwaButton from '@site/src/components/InstallPwaButton';
import {PROJECTS, formatProjectDate} from '@site/src/data/projects';

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

interface HomepageProjectCardProps {
  id: string;
  title: ReactNode;
  summary: ReactNode;
}

/**
 * date/url/tags come from the shared PROJECTS source of truth; title/summary
 * are passed in as already-built <Translate> elements from the call site
 * (not string props) so Docusaurus's static i18n extraction — which needs a
 * literal <Translate id="..."> with literal children right there in the
 * JSX — can still find them despite the shared layout being a component.
 */
function HomepageProjectCard({id, title, summary}: HomepageProjectCardProps) {
  const meta = projectMeta(id);
  const {
    i18n: {currentLocale},
  } = useDocusaurusContext();

  return (
    <Link to={meta.url} className={styles.projectCard}>
      <h3>{title}</h3>
      <p className={styles.projectDate}>{formatProjectDate(meta.date, currentLocale)}</p>
      <p>{summary}</p>
      <div className={styles.projectTags}>
        {meta.tags.map((tag) => (
          <span key={tag} className={styles.projectTag}>
            {tag}
          </span>
        ))}
      </div>
    </Link>
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
        <div className={styles.projectGrid}>
          <HomepageProjectCard
            id="multi-agent-research"
            title={
              <Translate
                id="homepage.projects.multiAgentResearch.title"
                description="Homepage project card title">
                Build a Multi-Agent Research Assistant
              </Translate>
            }
            summary={
              <Translate
                id="homepage.projects.multiAgentResearch.summary"
                description="Homepage project card summary">
                Build a small multi-agent system — a planner, a researcher, and a writer — that
                breaks down a research question and synthesizes a final report, using deepagents
                sub-agents and a free-tier LLM.
              </Translate>
            }
          />
          <HomepageProjectCard
            id="mcp-server"
            title={
              <Translate id="homepage.projects.mcpServer.title" description="Homepage project card title">
                Build an MCP Server
              </Translate>
            }
            summary={
              <Translate
                id="homepage.projects.mcpServer.summary"
                description="Homepage project card summary">
                Build a Model Context Protocol server exposing your own tools, and connect it to a
                real AI client like Claude Desktop.
              </Translate>
            }
          />
          <HomepageProjectCard
            id="ml-classifier"
            title={
              <Translate
                id="homepage.projects.mlClassifier.title"
                description="Homepage project card title">
                Train Your First Machine Learning Model
              </Translate>
            }
            summary={
              <Translate
                id="homepage.projects.mlClassifier.summary"
                description="Homepage project card summary">
                Go from describing data to predicting from it: train and compare binary
                classifiers with scikit-learn on the Titanic dataset.
              </Translate>
            }
          />
          <HomepageProjectCard
            id="rag-notes"
            title={
              <Translate id="homepage.projects.ragNotes.title" description="Homepage project card title">
                Build a RAG App Over Your Own Notes
              </Translate>
            }
            summary={
              <Translate
                id="homepage.projects.ragNotes.summary"
                description="Homepage project card summary">
                Chat with your own notes: local embeddings with sentence-transformers, NumPy
                similarity search, and a free-tier LLM for the final answer.
              </Translate>
            }
          />
          <HomepageProjectCard
            id="scrape-analyze"
            title={
              <Translate
                id="homepage.projects.scrapeAnalyze.title"
                description="Homepage project card title">
                Scrape and Analyze a Live Website
              </Translate>
            }
            summary={
              <Translate
                id="homepage.projects.scrapeAnalyze.summary"
                description="Homepage project card summary">
                Scrape a real, scraping-friendly website with requests and BeautifulSoup, then
                clean and chart the results with pandas and matplotlib — no API key needed.
              </Translate>
            }
          />
          <HomepageProjectCard
            id="2027-finetune-llm"
            title={
              <Translate id="homepage.projects.finetuneLlm.title" description="Homepage project card title">
                Fine-tune a Small Language Model
              </Translate>
            }
            summary={
              <Translate
                id="homepage.projects.finetuneLlm.summary"
                description="Homepage project card summary">
                Fine-tune a small open-source language model with LoRA using Unsloth, on a free
                Colab/Kaggle GPU.
              </Translate>
            }
          />
          <HomepageProjectCard
            id="2026-ai-agent"
            title={
              <Translate id="homepage.projects.aiAgent.title" description="Homepage project card title">
                Build an AI Agent
              </Translate>
            }
            summary={
              <Translate
                id="homepage.projects.aiAgent.summary"
                description="Homepage project card summary">
                Install Python for real and build your first AI agent with LangChain's deepagents,
                using a free-tier API key.
              </Translate>
            }
          />
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
