# Multi-Agent Research Assistant Example

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)

A real, runnable multi-agent research assistant — the fuller version of the one built step by step in the course's [Multi-Agent Research Assistant project](../../docs/projects/multi-agent-research/index.md), built with LangChain's [`deepagents`](https://github.com/langchain-ai/deepagents) and your choice of free-tier API provider.

## Objective

Given a research question, three narrowly-instructed sub-agents work together instead of one big agent trying to do everything:

- **`planner`** breaks the question into 3-5 focused, independently-answerable sub-questions.
- **`researcher`** answers each sub-question on its own, one at a time.
- **`writer`** synthesizes every sub-question/answer pair into one coherent final report.

A top-level agent coordinates the hand-offs, using `deepagents`' `subagents=[...]` feature — the same delegation mechanism taught in the [AI Agent project](../ai-agent/), just used for the whole pipeline here instead of for one extra specialist alongside a general-purpose agent.

**Honesty note:** the `researcher` sub-agent answers from the model's own training knowledge — there is no real web search tool wired in. That keeps this example small and free-tier friendly, but answers can be stale or wrong on anything the model wasn't trained on well. See the lesson's "Where to go from here" for how to add a real search tool.

## Running it

**You're free to use whichever free-tier provider you like** — this isn't locked to any one of them. Six are wired up already: **GitHub Models** (the default — no separate signup, uses a GitHub account you already have), Gemini, Groq, Mistral, Cerebras, and OpenRouter.

1. **Get a free-tier API key** from your chosen provider — see the table in the [project's Setup section](../../docs/projects/multi-agent-research/index.md#get-a-free-ai-api-key) for where to get one for each.
2. **Copy `.env.example` to `.env`** and fill in the key for your provider (and `LLM_PROVIDER` if you're not using the default):
   ```bash
   cp .env.example .env
   # then edit .env
   ```
   `.env` is already gitignored — never commit a real key. If you'd rather not use a `.env` file, exporting the same variable in your shell works too.
3. **Run it with `uv`** — no manual virtual environment setup needed:
   ```bash
   uv run python agent.py
   ```

`uv` reads `pyproject.toml`/`uv.lock` and creates an isolated environment for this project automatically on first run. The script asks the pipeline one example research question and prints a readable, step-by-step trace of every delegation (see `print_conversation` in `agent.py`), followed by the writer's final report. It also automatically retries once on a rate-limit error (common on free tiers, and more likely here than in a single-agent example since one question costs six to eight round trips) before giving up gracefully.

### Using it from your own code

```python
from agent import build_agent, ask, print_conversation, final_answer

agent = build_agent()
result = ask(agent, "What makes a programming language good for beginners to learn first?")

print_conversation(result)   # readable step-by-step trace of every delegation
print(final_answer(result))  # just the writer's final report
```

## Running it in GitHub Codespaces

Click the badge above, or go to the [repo's Codespaces page](https://github.com/abderrahim-lectures/python-data-analysis-course), to get a ready-to-go cloud dev environment (Node + Python + `uv` preinstalled via [`.devcontainer/devcontainer.json`](../../.devcontainer/devcontainer.json)). Once it's open, add your API key as a [Codespaces secret](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-encrypted-secrets-for-your-repository-and-organization#adding-secrets-for-a-repository) named for whichever provider you're using (`GITHUB_TOKEN` for the default, `GOOGLE_API_KEY` for Gemini, etc. — see `.env.example`), or just `export` it in the Codespace's terminal for a one-off session, then run:

```bash
cd examples/multi-agent-research
uv run python agent.py
```

## A note on staying current

Model names and library APIs in this space change fast, and `deepagents`' sub-agent API is newer and less battle-tested than its plain tool-calling API — the model ID and `subagents=[...]` shape here were both verified against a live run while writing this example, but may have drifted by the time you read this. See the callout in the [project doc](../../docs/projects/multi-agent-research/index.md#step-2-wire-the-sub-agents-together-and-run-it) for what to check before relying on this code.

## Built your own multi-agent project?

See [`examples/student-projects/`](../student-projects/) for how to share it with the class via a pull request — no git experience required, it walks through every step.
