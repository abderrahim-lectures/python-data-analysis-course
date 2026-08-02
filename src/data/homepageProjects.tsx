import Translate from '@docusaurus/Translate';
import type {ReactNode} from 'react';
import type {ProjectId} from '@site/src/types/progress';

/**
 * Every real-world project's homepage card content, as literal <Translate>
 * JSX. Docusaurus's static i18n extraction scans all of `src` (this directory
 * included), so the ids below keep being written into code.json — even though
 * the <ProjectGallery> that renders them lives in src/components. Keep the id
 * of every entry in sync with src/data/projects.ts and docs/projects/index.mdx.
 * Order here is irrelevant: the gallery always sorts newest-first.
 */
export interface HomepageProjectEntry {
  id: ProjectId;
  title: ReactNode;
  summary: ReactNode;
}

export const HOMEPAGE_PROJECTS: HomepageProjectEntry[] = [
  {
    id: '2027-dependency-freshness-checker',
    title: (
      <Translate
        id="homepage.projects.dependencyFreshnessChecker.title"
        description="Homepage project card title">
        Build a Dependency-Freshness Checker
      </Translate>
    ),
    summary: (
      <Translate
        id="homepage.projects.dependencyFreshnessChecker.summary"
        description="Homepage project card summary">
        A real CLI that reads a pyproject.toml, checks PyPI for newer dependency
        versions, and reports what's outdated — no API key needed.
      </Translate>
    ),
  },
  {
    id: '2027-commit-message-agent',
    title: (
      <Translate
        id="homepage.projects.commitMessageAgent.title"
        description="Homepage project card title">
        Build a Git Commit-Message Generator
      </Translate>
    ),
    summary: (
      <Translate
        id="homepage.projects.commitMessageAgent.summary"
        description="Homepage project card summary">
        Draft a Conventional-Commits-style message from a real staged git diff with a
        free-tier LLM, and only commit it after you explicitly confirm.
      </Translate>
    ),
  },
  {
    id: '2027-mcp-sqlite-server',
    title: (
      <Translate
        id="homepage.projects.mcpSqliteServer.title"
        description="Homepage project card title">
        Query a Database in Plain English with MCP
      </Translate>
    ),
    summary: (
      <Translate
        id="homepage.projects.mcpSqliteServer.summary"
        description="Homepage project card summary">
        Build an MCP server that exposes a local SQLite database, then watch an LLM
        client write and run its own SQL to answer plain-English questions about it.
      </Translate>
    ),
  },
  {
    id: 'trivia-bot',
    title: (
      <Translate id="homepage.projects.triviaBot.title" description="Homepage project card title">
        Build a Discord Trivia Bot
      </Translate>
    ),
    summary: (
      <Translate
        id="homepage.projects.triviaBot.summary"
        description="Homepage project card summary">
        Run trivia rounds in a Discord server with discord.py: a persistent leaderboard, and
        questions generated fresh on any topic with a free-tier LLM.
      </Translate>
    ),
  },
  {
    id: '2027-mcp-notes-server',
    title: (
      <Translate
        id="homepage.projects.mcpNotesServer.title"
        description="Homepage project card title">
        Build an MCP Server for Your Notes
      </Translate>
    ),
    summary: (
      <Translate
        id="homepage.projects.mcpNotesServer.summary"
        description="Homepage project card summary">
        Index a real folder of Markdown notes and expose it to Claude Desktop as
        searchable tools with the Model Context Protocol.
      </Translate>
    ),
  },
  {
    id: 'recipe-planner-agent',
    title: (
      <Translate
        id="homepage.projects.recipePlannerAgent.title"
        description="Homepage project card title">
        Build a Recipe-Planner Agent
      </Translate>
    ),
    summary: (
      <Translate
        id="homepage.projects.recipePlannerAgent.summary"
        description="Homepage project card summary">
        Build a tool-using AI agent that suggests meals from ingredients you have on
        hand, grounded in a real local recipe database instead of guessing.
      </Translate>
    ),
  },
  {
    id: 'meeting-notes-summarizer',
    title: (
      <Translate
        id="homepage.projects.meetingNotesSummarizer.title"
        description="Homepage project card title">
        Build a Meeting-Notes Summarizer
      </Translate>
    ),
    summary: (
      <Translate
        id="homepage.projects.meetingNotesSummarizer.summary"
        description="Homepage project card summary">
        Turn a raw meeting transcript into structured decisions, action items, and open
        questions using a free-tier LLM and a carefully designed JSON-extraction prompt.
      </Translate>
    ),
  },
  {
    id: 'github-issue-triage-agent',
    title: (
      <Translate
        id="homepage.projects.githubIssueTriageAgent.title"
        description="Homepage project card title">
        Build a GitHub Issue Triage Agent
      </Translate>
    ),
    summary: (
      <Translate
        id="homepage.projects.githubIssueTriageAgent.summary"
        description="Homepage project card summary">
        Fetch open issues from a real public GitHub repo and use a free-tier LLM to draft
        suggested triage labels for a human maintainer to review.
      </Translate>
    ),
  },
  {
    id: 'voice-to-task-agent',
    title: (
      <Translate
        id="homepage.projects.voiceToTaskAgent.title"
        description="Homepage project card title">
        Build a Voice-to-Task Agent
      </Translate>
    ),
    summary: (
      <Translate
        id="homepage.projects.voiceToTaskAgent.summary"
        description="Homepage project card summary">
        Transcribe a voice memo locally and for free with OpenAI's open-source Whisper
        model, then use a free-tier LLM to turn it into a structured task list.
      </Translate>
    ),
  },
  {
    id: 'study-buddy-agent',
    title: (
      <Translate
        id="homepage.projects.studyBuddyAgent.title"
        description="Homepage project card title">
        Build a Study-Buddy Quiz Agent
      </Translate>
    ),
    summary: (
      <Translate
        id="homepage.projects.studyBuddyAgent.summary"
        description="Homepage project card summary">
        Turn your own study notes into an interactive quiz: a free-tier LLM writes
        questions grounded in your notes, then judges your typed answers.
      </Translate>
    ),
  },
  {
    id: 'codebase-knowledge-graph',
    title: (
      <Translate
        id="homepage.projects.codebaseKnowledgeGraph.title"
        description="Homepage project card title">
        Turn a Codebase into a Knowledge Graph
      </Translate>
    ),
    summary: (
      <Translate
        id="homepage.projects.codebaseKnowledgeGraph.summary"
        description="Homepage project card summary">
        Parse a real codebase's Python files with the ast module, build a graph of its
        structure with networkx, and visualize and query it — no API key needed.
      </Translate>
    ),
  },
  {
    id: 'docs-qa-bot',
    title: (
      <Translate id="homepage.projects.docsQaBot.title" description="Homepage project card title">
        Build a RAG-Backed Docs Q&A Discord Bot
      </Translate>
    ),
    summary: (
      <Translate
        id="homepage.projects.docsQaBot.summary"
        description="Homepage project card summary">
        Wrap the RAG App project's retrieval pipeline in a live Discord bot that answers
        questions from a folder of documentation.
      </Translate>
    ),
  },
  {
    id: 'email-triage-agent',
    title: (
      <Translate
        id="homepage.projects.emailTriageAgent.title"
        description="Homepage project card title">
        Build a Personal Email-Triage Agent
      </Translate>
    ),
    summary: (
      <Translate
        id="homepage.projects.emailTriageAgent.summary"
        description="Homepage project card summary">
        Categorize, prioritize, and draft replies for a batch of emails with a free-tier
        LLM — the agent never sends anything, only you do.
      </Translate>
    ),
  },
  {
    id: 'multi-agent-research',
    title: (
      <Translate
        id="homepage.projects.multiAgentResearch.title"
        description="Homepage project card title">
        Build a Multi-Agent Research Assistant
      </Translate>
    ),
    summary: (
      <Translate
        id="homepage.projects.multiAgentResearch.summary"
        description="Homepage project card summary">
        Build a small multi-agent system — a planner, a researcher, and a writer — that
        breaks down a research question and synthesizes a final report, using deepagents
        sub-agents and a free-tier LLM.
      </Translate>
    ),
  },
  {
    id: 'agentic-code-reviewer',
    title: (
      <Translate
        id="homepage.projects.agenticCodeReviewer.title"
        description="Homepage project card title">
        Build an Agentic Code Reviewer
      </Translate>
    ),
    summary: (
      <Translate
        id="homepage.projects.agenticCodeReviewer.summary"
        description="Homepage project card summary">
        Build a CLI tool that reads a real git diff via subprocess and asks a free-tier
        LLM to review it like a human reviewer would.
      </Translate>
    ),
  },
  {
    id: 'mcp-server',
    title: (
      <Translate id="homepage.projects.mcpServer.title" description="Homepage project card title">
        Build an MCP Server
      </Translate>
    ),
    summary: (
      <Translate
        id="homepage.projects.mcpServer.summary"
        description="Homepage project card summary">
        Build a Model Context Protocol server exposing your own tools, and connect it to a
        real AI client like Claude Desktop.
      </Translate>
    ),
  },
  {
    id: 'ml-classifier',
    title: (
      <Translate
        id="homepage.projects.mlClassifier.title"
        description="Homepage project card title">
        Train Your First Machine Learning Model
      </Translate>
    ),
    summary: (
      <Translate
        id="homepage.projects.mlClassifier.summary"
        description="Homepage project card summary">
        Go from describing data to predicting from it: train and compare binary
        classifiers with scikit-learn on the Titanic dataset.
      </Translate>
    ),
  },
  {
    id: 'rag-notes',
    title: (
      <Translate id="homepage.projects.ragNotes.title" description="Homepage project card title">
        Build a RAG App Over Your Own Notes
      </Translate>
    ),
    summary: (
      <Translate
        id="homepage.projects.ragNotes.summary"
        description="Homepage project card summary">
        Chat with your own notes: local embeddings with sentence-transformers, NumPy
        similarity search, and a free-tier LLM for the final answer.
      </Translate>
    ),
  },
  {
    id: '2027-chat-with-pdfs',
    title: (
      <Translate id="homepage.projects.chatWithPdfs.title" description="Homepage project card title">
        Chat with Your PDFs
      </Translate>
    ),
    summary: (
      <Translate
        id="homepage.projects.chatWithPdfs.summary"
        description="Homepage project card summary">
        Multi-document RAG over a folder of PDFs: page-aware chunking, local embeddings, and
        page-cited answers from a free-tier LLM.
      </Translate>
    ),
  },
  {
    id: 'scrape-analyze',
    title: (
      <Translate
        id="homepage.projects.scrapeAnalyze.title"
        description="Homepage project card title">
        Scrape and Analyze a Live Website
      </Translate>
    ),
    summary: (
      <Translate
        id="homepage.projects.scrapeAnalyze.summary"
        description="Homepage project card summary">
        Scrape a real, scraping-friendly website with requests and BeautifulSoup, then
        clean and chart the results with pandas and matplotlib — no API key needed.
      </Translate>
    ),
  },
  {
    id: '2027-job-aggregator',
    title: (
      <Translate
        id="homepage.projects.jobAggregator.title"
        description="Homepage project card title">
        Build a Job-Listing Aggregator
      </Translate>
    ),
    summary: (
      <Translate
        id="homepage.projects.jobAggregator.summary"
        description="Homepage project card summary">
        Scrape multiple job-board-style sources, dedupe listings across them, and alert on
        new matches against a keyword filter — no API key needed.
      </Translate>
    ),
  },
  {
    id: '2027-finetune-llm',
    title: (
      <Translate id="homepage.projects.finetuneLlm.title" description="Homepage project card title">
        Fine-tune a Small Language Model
      </Translate>
    ),
    summary: (
      <Translate
        id="homepage.projects.finetuneLlm.summary"
        description="Homepage project card summary">
        Fine-tune a small open-source language model with LoRA using Unsloth, on a free
        Colab/Kaggle GPU.
      </Translate>
    ),
  },
  {
    id: '2026-ai-agent',
    title: (
      <Translate id="homepage.projects.aiAgent.title" description="Homepage project card title">
        Build an AI Agent
      </Translate>
    ),
    summary: (
      <Translate
        id="homepage.projects.aiAgent.summary"
        description="Homepage project card summary">
        Install Python for real and build your first AI agent with LangChain's deepagents,
        using a free-tier API key.
      </Translate>
    ),
  },
  {
    id: '2027-rate-limited-api',
    title: (
      <Translate
        id="homepage.projects.rateLimitedApi.title"
        description="Homepage project card title">
        Build a Rate-Limited API Service
      </Translate>
    ),
    summary: (
      <Translate
        id="homepage.projects.rateLimitedApi.summary"
        description="Homepage project card summary">
        Build a real FastAPI service wrapping your own dataset, with API-key auth and a
        sliding-window rate limiter built from scratch.
      </Translate>
    ),
  },
  {
    id: '2027-finance-agent',
    title: (
      <Translate id="homepage.projects.financeAgent.title" description="Homepage project card title">
        Build a Personal Finance Agent
      </Translate>
    ),
    summary: (
      <Translate
        id="homepage.projects.financeAgent.summary"
        description="Homepage project card summary">
        Categorize a bank CSV export and flag spending anomalies, combining pandas with an
        LLM tool-calling agent.
      </Translate>
    ),
  },
  {
    id: '2027-browser-automation-agent',
    title: (
      <Translate
        id="homepage.projects.browserAutomationAgent.title"
        description="Homepage project card title">
        Build a Browser-Automation Agent
      </Translate>
    ),
    summary: (
      <Translate
        id="homepage.projects.browserAutomationAgent.summary"
        description="Homepage project card summary">
        Combine Playwright browser automation with a free-tier LLM tool-calling agent
        that fills out a real practice web form on its own.
      </Translate>
    ),
  },
  {
    id: '2027-webcam-object-counter',
    title: (
      <Translate
        id="homepage.projects.webcamObjectCounter.title"
        description="Homepage project card title">
        Count Objects in Real Time with a Webcam
      </Translate>
    ),
    summary: (
      <Translate
        id="homepage.projects.webcamObjectCounter.summary"
        description="Homepage project card summary">
        Count objects live from a webcam feed with OpenCV and a pretrained YOLO11n model, no
        API key or signup needed.
      </Translate>
    ),
  },
  {
    id: '2027-wordle-clone',
    title: (
      <Translate
        id="homepage.projects.wordleClone.title"
        description="Homepage project card title">
        Build a Wordle Clone
      </Translate>
    ),
    summary: (
      <Translate
        id="homepage.projects.wordleClone.summary"
        description="Homepage project card summary">
        Build a real terminal Wordle game from scratch: correct guess feedback, a custom
        word list, and persistent stats tracking across sessions.
      </Translate>
    ),
  },
  {
    id: '2027-habit-streak-visualizer',
    title: (
      <Translate
        id="homepage.projects.habitStreakVisualizer.title"
        description="Homepage project card title">
        Build a Habit-Streak Visualizer
      </Translate>
    ),
    summary: (
      <Translate
        id="homepage.projects.habitStreakVisualizer.summary"
        description="Homepage project card summary">
        Track daily habit check-ins locally and render a GitHub-contributions-graph-style
        calendar heatmap, for any habit you want to track.
      </Translate>
    ),
  },
];
