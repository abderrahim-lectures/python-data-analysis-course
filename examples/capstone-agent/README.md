# Capstone Agent Example

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)

A real, runnable copy of the agent built in the course's [Capstone Bonus](../../docs/bonus/capstone-ai-agent.md) — a minimal tool-calling agent built with LangChain's [`deepagents`](https://github.com/langchain-ai/deepagents), backed by Gemini's free-tier API.

## What it does

Ask it something like *"Did we cover groupby?"* and the agent doesn't just guess from what it already knows — it decides it needs to check, calls a real Python function (`search_course_topics`) to look it up, reads the actual result, and only then answers. That reasoning → tool call → observe → answer loop is the core idea behind agent frameworks: a model that can act, not just respond.

The included tool (`search_course_topics`) is intentionally trivial — a hardcoded list of course topics — so the *mechanism* stays easy to follow. The same pattern scales to tools that search the web, query a database, or edit files.

## Running it

1. **Get a free-tier Gemini API key** at [Google AI Studio](https://aistudio.google.com/).
2. **Set it as an environment variable** (never hardcode it or commit it):
   ```bash
   export GOOGLE_API_KEY="your-key-here"
   ```
3. **Run it with `uv`** — no manual virtual environment setup needed:
   ```bash
   uv run python agent.py
   ```

`uv` reads `pyproject.toml`/`uv.lock` and creates an isolated environment for this project automatically on first run.

## Running it in GitHub Codespaces

Click the badge above, or go to the [repo's Codespaces page](https://github.com/abderrahim-lectures/python-data-analysis-course), to get a ready-to-go cloud dev environment (Node + Python + `uv` preinstalled via [`.devcontainer/devcontainer.json`](../../.devcontainer/devcontainer.json)). Once it's open, add your API key as a [Codespaces secret](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-encrypted-secrets-for-your-repository-and-organization#adding-secrets-for-a-repository) named `GOOGLE_API_KEY` (Settings → Codespaces → your repo), or just `export` it in the Codespace's terminal for a one-off session, then run:

```bash
cd examples/capstone-agent
uv run python agent.py
```

## A note on staying current

Model names and library APIs in this space change fast — the model ID and `create_deep_agent()` call here were both verified against a live run while writing this example, but may have drifted by the time you read this. See the callout in the [Capstone Bonus doc](../../docs/bonus/capstone-ai-agent.md#step-4-write-your-first-agent) for what to check before relying on this code.
