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
            id="2027-dependency-freshness-checker"
            title={
              <Translate
                id="homepage.projects.dependencyFreshnessChecker.title"
                description="Homepage project card title">
                Build a Dependency-Freshness Checker
              </Translate>
            }
            summary={
              <Translate
                id="homepage.projects.dependencyFreshnessChecker.summary"
                description="Homepage project card summary">
                A real CLI that reads a pyproject.toml, checks PyPI for newer dependency
                versions, and reports what's outdated — no API key needed.
              </Translate>
            }
          />
          <HomepageProjectCard
            id="2027-commit-message-agent"
            title={
              <Translate
                id="homepage.projects.commitMessageAgent.title"
                description="Homepage project card title">
                Build a Git Commit-Message Generator
              </Translate>
            }
            summary={
              <Translate
                id="homepage.projects.commitMessageAgent.summary"
                description="Homepage project card summary">
                Draft a Conventional-Commits-style message from a real staged git diff with a
                free-tier LLM, and only commit it after you explicitly confirm.
              </Translate>
            }
          />
          <HomepageProjectCard
            id="2027-mcp-sqlite-server"
            title={
              <Translate
                id="homepage.projects.mcpSqliteServer.title"
                description="Homepage project card title">
                Query a Database in Plain English with MCP
              </Translate>
            }
            summary={
              <Translate
                id="homepage.projects.mcpSqliteServer.summary"
                description="Homepage project card summary">
                Build an MCP server that exposes a local SQLite database, then watch an LLM
                client write and run its own SQL to answer plain-English questions about it.
              </Translate>
            }
          />
          <HomepageProjectCard
            id="trivia-bot"
            title={
              <Translate id="homepage.projects.triviaBot.title" description="Homepage project card title">
                Build a Discord Trivia Bot
              </Translate>
            }
            summary={
              <Translate
                id="homepage.projects.triviaBot.summary"
                description="Homepage project card summary">
                Run trivia rounds in a Discord server with discord.py: a persistent leaderboard, and
                questions generated fresh on any topic with a free-tier LLM.
              </Translate>
            }
          />
          <HomepageProjectCard
            id="2027-mcp-notes-server"
            title={
              <Translate
                id="homepage.projects.mcpNotesServer.title"
                description="Homepage project card title">
                Build an MCP Server for Your Notes
              </Translate>
            }
            summary={
              <Translate
                id="homepage.projects.mcpNotesServer.summary"
                description="Homepage project card summary">
                Index a real folder of Markdown notes and expose it to Claude Desktop as
                searchable tools with the Model Context Protocol.
              </Translate>
            }
          />
          <HomepageProjectCard
            id="recipe-planner-agent"
            title={
              <Translate
                id="homepage.projects.recipePlannerAgent.title"
                description="Homepage project card title">
                Build a Recipe-Planner Agent
              </Translate>
            }
            summary={
              <Translate
                id="homepage.projects.recipePlannerAgent.summary"
                description="Homepage project card summary">
                Build a tool-using AI agent that suggests meals from ingredients you have on
                hand, grounded in a real local recipe database instead of guessing.
              </Translate>
            }
          />
          <HomepageProjectCard
            id="meeting-notes-summarizer"
            title={
              <Translate
                id="homepage.projects.meetingNotesSummarizer.title"
                description="Homepage project card title">
                Build a Meeting-Notes Summarizer
              </Translate>
            }
            summary={
              <Translate
                id="homepage.projects.meetingNotesSummarizer.summary"
                description="Homepage project card summary">
                Turn a raw meeting transcript into structured decisions, action items, and open
                questions using a free-tier LLM and a carefully designed JSON-extraction prompt.
              </Translate>
            }
          />
          <HomepageProjectCard
            id="github-issue-triage-agent"
            title={
              <Translate
                id="homepage.projects.githubIssueTriageAgent.title"
                description="Homepage project card title">
                Build a GitHub Issue Triage Agent
              </Translate>
            }
            summary={
              <Translate
                id="homepage.projects.githubIssueTriageAgent.summary"
                description="Homepage project card summary">
                Fetch open issues from a real public GitHub repo and use a free-tier LLM to draft
                suggested triage labels for a human maintainer to review.
              </Translate>
            }
          />
          <HomepageProjectCard
            id="voice-to-task-agent"
            title={
              <Translate
                id="homepage.projects.voiceToTaskAgent.title"
                description="Homepage project card title">
                Build a Voice-to-Task Agent
              </Translate>
            }
            summary={
              <Translate
                id="homepage.projects.voiceToTaskAgent.summary"
                description="Homepage project card summary">
                Transcribe a voice memo locally and for free with OpenAI's open-source Whisper
                model, then use a free-tier LLM to turn it into a structured task list.
              </Translate>
            }
          />
          <HomepageProjectCard
            id="study-buddy-agent"
            title={
              <Translate
                id="homepage.projects.studyBuddyAgent.title"
                description="Homepage project card title">
                Build a Study-Buddy Quiz Agent
              </Translate>
            }
            summary={
              <Translate
                id="homepage.projects.studyBuddyAgent.summary"
                description="Homepage project card summary">
                Turn your own study notes into an interactive quiz: a free-tier LLM writes
                questions grounded in your notes, then judges your typed answers.
              </Translate>
            }
          />
          <HomepageProjectCard
            id="codebase-knowledge-graph"
            title={
              <Translate
                id="homepage.projects.codebaseKnowledgeGraph.title"
                description="Homepage project card title">
                Turn a Codebase into a Knowledge Graph
              </Translate>
            }
            summary={
              <Translate
                id="homepage.projects.codebaseKnowledgeGraph.summary"
                description="Homepage project card summary">
                Parse a real codebase's Python files with the ast module, build a graph of its
                structure with networkx, and visualize and query it — no API key needed.
              </Translate>
            }
          />
          <HomepageProjectCard
            id="docs-qa-bot"
            title={
              <Translate id="homepage.projects.docsQaBot.title" description="Homepage project card title">
                Build a RAG-Backed Docs Q&A Discord Bot
              </Translate>
            }
            summary={
              <Translate
                id="homepage.projects.docsQaBot.summary"
                description="Homepage project card summary">
                Wrap the RAG App project's retrieval pipeline in a live Discord bot that answers
                questions from a folder of documentation.
              </Translate>
            }
          />
          <HomepageProjectCard
            id="email-triage-agent"
            title={
              <Translate
                id="homepage.projects.emailTriageAgent.title"
                description="Homepage project card title">
                Build a Personal Email-Triage Agent
              </Translate>
            }
            summary={
              <Translate
                id="homepage.projects.emailTriageAgent.summary"
                description="Homepage project card summary">
                Categorize, prioritize, and draft replies for a batch of emails with a free-tier
                LLM — the agent never sends anything, only you do.
              </Translate>
            }
          />
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
            id="agentic-code-reviewer"
            title={
              <Translate
                id="homepage.projects.agenticCodeReviewer.title"
                description="Homepage project card title">
                Build an Agentic Code Reviewer
              </Translate>
            }
            summary={
              <Translate
                id="homepage.projects.agenticCodeReviewer.summary"
                description="Homepage project card summary">
                Build a CLI tool that reads a real git diff via subprocess and asks a free-tier
                LLM to review it like a human reviewer would.
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
            id="2027-chat-with-pdfs"
            title={
              <Translate id="homepage.projects.chatWithPdfs.title" description="Homepage project card title">
                Chat with Your PDFs
              </Translate>
            }
            summary={
              <Translate
                id="homepage.projects.chatWithPdfs.summary"
                description="Homepage project card summary">
                Multi-document RAG over a folder of PDFs: page-aware chunking, local embeddings, and
                page-cited answers from a free-tier LLM.
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
            id="2027-job-aggregator"
            title={
              <Translate
                id="homepage.projects.jobAggregator.title"
                description="Homepage project card title">
                Build a Job-Listing Aggregator
              </Translate>
            }
            summary={
              <Translate
                id="homepage.projects.jobAggregator.summary"
                description="Homepage project card summary">
                Scrape multiple job-board-style sources, dedupe listings across them, and alert on
                new matches against a keyword filter — no API key needed.
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
          <HomepageProjectCard
            id="2027-rate-limited-api"
            title={
              <Translate
                id="homepage.projects.rateLimitedApi.title"
                description="Homepage project card title">
                Build a Rate-Limited API Service
              </Translate>
            }
            summary={
              <Translate
                id="homepage.projects.rateLimitedApi.summary"
                description="Homepage project card summary">
                Build a real FastAPI service wrapping your own dataset, with API-key auth and a
                sliding-window rate limiter built from scratch.
              </Translate>
            }
          />
          <HomepageProjectCard
            id="2027-finance-agent"
            title={
              <Translate id="homepage.projects.financeAgent.title" description="Homepage project card title">
                Build a Personal Finance Agent
              </Translate>
            }
            summary={
              <Translate
                id="homepage.projects.financeAgent.summary"
                description="Homepage project card summary">
                Categorize a bank CSV export and flag spending anomalies, combining pandas with an
                LLM tool-calling agent.
              </Translate>
            }
          />
          <HomepageProjectCard
            id="2027-browser-automation-agent"
            title={
              <Translate
                id="homepage.projects.browserAutomationAgent.title"
                description="Homepage project card title">
                Build a Browser-Automation Agent
              </Translate>
            }
            summary={
              <Translate
                id="homepage.projects.browserAutomationAgent.summary"
                description="Homepage project card summary">
                Combine Playwright browser automation with a free-tier LLM tool-calling agent
                that fills out a real practice web form on its own.
              </Translate>
            }
          />
          <HomepageProjectCard
            id="2027-webcam-object-counter"
            title={
              <Translate
                id="homepage.projects.webcamObjectCounter.title"
                description="Homepage project card title">
                Count Objects in Real Time with a Webcam
              </Translate>
            }
            summary={
              <Translate
                id="homepage.projects.webcamObjectCounter.summary"
                description="Homepage project card summary">
                Count objects live from a webcam feed with OpenCV and a pretrained YOLO11n model, no
                API key or signup needed.
              </Translate>
            }
          />
          <HomepageProjectCard
            id="2027-wordle-clone"
            title={
              <Translate
                id="homepage.projects.wordleClone.title"
                description="Homepage project card title">
                Build a Wordle Clone
              </Translate>
            }
            summary={
              <Translate
                id="homepage.projects.wordleClone.summary"
                description="Homepage project card summary">
                Build a real terminal Wordle game from scratch: correct guess feedback, a custom
                word list, and persistent stats tracking across sessions.
              </Translate>
            }
          />
          <HomepageProjectCard
            id="2027-habit-streak-visualizer"
            title={
              <Translate
                id="homepage.projects.habitStreakVisualizer.title"
                description="Homepage project card title">
                Build a Habit-Streak Visualizer
              </Translate>
            }
            summary={
              <Translate
                id="homepage.projects.habitStreakVisualizer.summary"
                description="Homepage project card summary">
                Track daily habit check-ins locally and render a GitHub-contributions-graph-style
                calendar heatmap, for any habit you want to track.
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
