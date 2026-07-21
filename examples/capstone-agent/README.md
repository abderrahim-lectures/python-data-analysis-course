# Capstone Agent Example

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)

A real, runnable "course study assistant" agent — the fuller version of the one built step by step in the course's [Capstone Bonus](../../docs/bonus/capstone-ai-agent.md), built with LangChain's [`deepagents`](https://github.com/langchain-ai/deepagents) and Gemini's free-tier API.

## Objective

Answer questions about **this course** by actually checking, not guessing:

- **"Which lessons cover X?"** → `search_course_docs` really searches every lesson file under `docs/` for the topic and returns the actual matching pages.
- **"What does dataset Y look like?"** → `analyze_dataset` really loads that dataset with pandas and returns its real shape, columns, and summary statistics.
- **"What datasets are there?"** → `list_datasets` really lists the files in `static/datasets/`.

This is the difference between a chatbot that might hallucinate an answer and an agent that can go verify one. Nothing here is faked or hardcoded — every tool reads real files from the actual course repo it's running in.

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

`uv` reads `pyproject.toml`/`uv.lock` and creates an isolated environment for this project automatically on first run. The script asks the agent two example questions and prints a readable, step-by-step trace of what it did (see `print_conversation` in `agent.py`) instead of a raw Python object dump.

### Using it from your own code

```python
from agent import build_agent, ask, print_conversation, final_answer

agent = build_agent()
result = ask(agent, "Which lessons cover groupby?")

print_conversation(result)   # readable step-by-step trace
print(final_answer(result))  # just the final text answer
```

## Running it in GitHub Codespaces

Click the badge above, or go to the [repo's Codespaces page](https://github.com/abderrahim-lectures/python-data-analysis-course), to get a ready-to-go cloud dev environment (Node + Python + `uv` preinstalled via [`.devcontainer/devcontainer.json`](../../.devcontainer/devcontainer.json)). Once it's open, add your API key as a [Codespaces secret](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-encrypted-secrets-for-your-repository-and-organization#adding-secrets-for-a-repository) named `GOOGLE_API_KEY` (Settings → Codespaces → your repo), or just `export` it in the Codespace's terminal for a one-off session, then run:

```bash
cd examples/capstone-agent
uv run python agent.py
```

## A note on staying current

Model names and library APIs in this space change fast — the model ID and `create_deep_agent()` call here were both verified against a live run while writing this example, but may have drifted by the time you read this. See the callout in the [Capstone Bonus doc](../../docs/bonus/capstone-ai-agent.md#step-4-write-your-first-agent) for what to check before relying on this code.

## Built your own agent for the capstone?

See [`examples/student-agents/`](../student-agents/) for how to share it with the class via a pull request — no git experience required, it walks through every step.
