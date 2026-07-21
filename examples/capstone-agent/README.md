# Capstone Agent Example

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)

A real, runnable "course study assistant" agent — the fuller version of the one built step by step in the course's [Capstone Bonus](../../docs/bonus/capstone-ai-agent.md), built with LangChain's [`deepagents`](https://github.com/langchain-ai/deepagents) and your choice of free-tier API provider.

## Objective

Answer questions about **this course** by actually checking, not guessing:

- **"Which lessons cover X?"** → `search_course_docs` really searches every lesson file under `docs/` for the topic and returns the actual matching pages.
- **"What does dataset Y look like?"** → `analyze_dataset` really loads that dataset with pandas and returns its real shape, columns, and summary statistics.
- **"What datasets are there?"** → `list_datasets` really lists the files in `static/datasets/`.

This is the difference between a chatbot that might hallucinate an answer and an agent that can go verify one. Nothing here is faked or hardcoded — every tool reads real files from the actual course repo it's running in.

## Running it

**You're free to use whichever free-tier provider you like** — this isn't locked to any one of them. Six are wired up already: **GitHub Models** (the default — no separate signup, uses a GitHub account you already have), Gemini, Groq, Mistral, Cerebras, and OpenRouter.

1. **Get a free-tier API key** from your chosen provider — see the table in the [Capstone Bonus doc](../../docs/bonus/capstone-ai-agent.md#step-2-get-a-free-ai-api-key) for where to get one for each.
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

`uv` reads `pyproject.toml`/`uv.lock` and creates an isolated environment for this project automatically on first run. The script asks the agent two example questions and prints a readable, step-by-step trace of what it did (see `print_conversation` in `agent.py`) instead of a raw Python object dump. It also automatically retries once on a rate-limit error (common on free tiers) before giving up gracefully.

### Using it from your own code

```python
from agent import build_agent, ask, print_conversation, final_answer

agent = build_agent()
result = ask(agent, "Which lessons cover groupby?")

print_conversation(result)   # readable step-by-step trace
print(final_answer(result))  # just the final text answer
```

## Running it in GitHub Codespaces

Click the badge above, or go to the [repo's Codespaces page](https://github.com/abderrahim-lectures/python-data-analysis-course), to get a ready-to-go cloud dev environment (Node + Python + `uv` preinstalled via [`.devcontainer/devcontainer.json`](../../.devcontainer/devcontainer.json)). Once it's open, add your API key as a [Codespaces secret](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-encrypted-secrets-for-your-repository-and-organization#adding-secrets-for-a-repository) named for whichever provider you're using (`GITHUB_TOKEN` for the default, `GOOGLE_API_KEY` for Gemini, etc. — see `.env.example`), or just `export` it in the Codespace's terminal for a one-off session, then run:

```bash
cd examples/capstone-agent
uv run python agent.py
```

## A note on staying current

Model names and library APIs in this space change fast — the model ID and `create_deep_agent()` call here were both verified against a live run while writing this example, but may have drifted by the time you read this. See the callout in the [Capstone Bonus doc](../../docs/bonus/capstone-ai-agent.md#step-4-write-your-first-agent) for what to check before relying on this code.

## Built your own agent for the capstone?

See [`examples/student-agents/`](../student-agents/) for how to share it with the class via a pull request — no git experience required, it walks through every step.
