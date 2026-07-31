# Personal Finance Agent Example

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)
[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/finance-agent/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/finance-agent/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Ffinance-agent%2Fnotebook.ipynb)

The local companion to the course's [Build a Personal Finance Agent](../../docs/projects/finance-agent/index.md) Real-World Project — a real, runnable pipeline that categorizes a bank CSV export and flags spending anomalies, combining pandas with a LangChain [`deepagents`](https://github.com/langchain-ai/deepagents) tool-calling agent.

Badges above point at this PR's branch and will be updated to point at `main` once it's merged.

## Objective

Take a raw bank CSV export and turn it into something a person can actually act on:

- **Categorize every transaction.** A fast rule-based pass (`rules.py`) handles obvious merchants (`STARBUCKS`, `NETFLIX.COM`, ...) for free. Whatever it can't confidently label — payment-processor prefixes like `SQ *`, `TST*`, `PAYPAL *`, `AMZN MKTP US*...`, or peer-to-peer transfers like Venmo — gets handed to an LLM tool-calling agent instead of guessed at.
- **Flag statistical anomalies.** `anomalies.py` computes a per-category z-score, so a transaction is compared against *its own category's* typical spend, not some single global threshold.
- **Explain findings in plain English.** The same agent is asked to summarize flagged anomalies for a non-technical reader, without inventing numbers beyond what it was given.

## What's here

- `transactions.csv` — a **synthetic** two-month sample bank export: fake dates, fake merchant names, fake amounts. No real financial data, obviously — see the privacy note below for why that matters beyond this example.
- `rules.py` — the keyword-based baseline categorizer, and its known limits.
- `anomalies.py` — per-category z-score anomaly detection.
- `finance_agent.py` — ties it all together: load → clean → rule-categorize → agent-categorize the leftovers → flag anomalies → agent-summarize.
- `notebook.ipynb` — a Colab/Kaggle/Binder-friendly version of the same pipeline.

## A note on privacy

`transactions.csv` is entirely made up. **Never point a real version of this script at your actual bank export.** Sending real, unredacted transaction data (real merchant names, real amounts, potentially your real account details if you exported more than three columns) to a third-party LLM API means that provider's servers now have a copy of your financial history — outside your control, subject to their own retention and training policies, whatever those currently are. If you want to try this on your own spending, redact or synthesize it first: strip account numbers, replace merchant names that reveal something sensitive, round or jitter amounts. The categorization logic doesn't care whether the data is real.

## Running it

**You're free to use whichever free-tier provider you like** — this isn't locked to any one of them. Six are wired up already: **GitHub Models** (the default), Gemini, Groq, Mistral, Cerebras, and OpenRouter.

1. **Get a free-tier API key** from your chosen provider — see the table in the [project doc](../../docs/projects/finance-agent/index.md#setup) for where to get one for each.
2. **Copy `.env.example` to `.env`** and fill in the key for your provider:
   ```bash
   cp .env.example .env
   # then edit .env
   ```
3. **Run it with `uv`** — no manual virtual environment setup needed:
   ```bash
   uv run python finance_agent.py
   ```

`uv` reads `pyproject.toml`/`uv.lock` and creates an isolated environment for this project automatically on first run. The script prints how many transactions the rule-based pass resolved on its own, a per-category spending breakdown, the raw flagged anomalies, and the agent's plain-English summary of them.

## Running it without any local install

[`notebook.ipynb`](./notebook.ipynb) in this folder mirrors the same pipeline and prompts for your API key with `getpass`, so no `.env` file or local setup is needed. Click a badge above to launch it directly in your browser.

## Running it in GitHub Codespaces

Click the badge above, or go to the [repo's Codespaces page](https://github.com/abderrahim-lectures/python-data-analysis-course), to get a ready-to-go cloud dev environment (Node + Python + `uv` preinstalled via [`.devcontainer/devcontainer.json`](../../.devcontainer/devcontainer.json)). Add your API key as a Codespaces secret or `export` it for a one-off session, then:

```bash
cd examples/finance-agent
uv run python finance_agent.py
```

## A note on staying current

Model names and library APIs in this space change fast — the model IDs and `create_deep_agent()` call here were verified against a live run while writing this example, but may have drifted by the time you read this. Check your provider's current pricing/model page and `deepagents`' own README before relying on this beyond a course project.

## Built your own version for the project?

See [`examples/student-projects/`](../student-projects/) for how to share it with the class via a pull request — no git experience required, it walks through every step.
