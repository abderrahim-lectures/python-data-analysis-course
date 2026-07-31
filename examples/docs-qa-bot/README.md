# Docs Q&A Discord Bot Example

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)
[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/add-docs-qa-bot-project/examples/docs-qa-bot/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/add-docs-qa-bot-project/examples/docs-qa-bot/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/add-docs-qa-bot-project?filepath=examples%2Fdocs-qa-bot%2Fnotebook.ipynb)

The local companion to the course's [Build a RAG-Backed Docs Q&A Discord Bot](../../docs/projects/docs-qa-bot/index.md) project — the same local-embedding, NumPy-cosine-similarity retrieval pipeline as the [RAG App project](../../docs/projects/rag-notes/index.md), wrapped in a live `discord.py` bot instead of a CLI script.

## What's here

- `docs/` — three short sample docs (course structure, Discord bot basics, a RAG recap) so the embedding, retrieval, and bot all run out of the box with no setup.
- `prepare_docs.py` — splits every file in `docs/` into small text chunks (`load_chunks()`), same approach as `rag-notes`'s `prepare_notes.py`.
- `build_index.py` — embeds every chunk locally with `sentence-transformers` and saves the vectors (`index.npy`) and chunk text (`chunks.json`).
- `retrieve.py` — `retrieve(question, top_k)`: finds the most relevant chunks for a question using NumPy cosine similarity. Identical logic to `rag-notes`'s `retrieve.py`.
- `bot.py` — the actual Discord bot: connects with `discord.py`, answers when mentioned, using `retrieve()` + a free-tier LLM to generate an answer grounded in `docs/`.
- `notebook.ipynb` — a Colab/Kaggle/Binder-runnable notebook demoing the RAG **core** (chunk the sample docs, embed them, retrieve, generate answers) with no setup beyond a free-tier LLM key. It deliberately does **not** run the Discord bot itself — Colab/Kaggle/Binder sessions can't host a persistent background process like `bot.py`'s event loop, so that part still needs `uv run python bot.py` locally or in Codespaces (see below).

## Running it

```bash
uv sync
uv run python build_index.py   # embeds docs/ -- no API key/token needed, runs locally
uv run python retrieve.py      # try a search with no bot or LLM involved yet
```

Running the bot itself needs two things the retrieval steps above don't:

1. **A Discord bot token** — create an application at the [Discord Developer Portal](https://discord.com/developers/applications), add a Bot to it, reset/copy its token, and **enable the "Message Content" privileged intent** under Bot settings (the bot's `on_message` handler otherwise only ever sees empty content). See [Step 1 of the lesson](../../docs/projects/docs-qa-bot/index.md#step-1-create-a-discord-bot-application) for the full walkthrough.
2. **A free-tier LLM API key**, same as the RAG App project — see the table in the [lesson's generation step](../../docs/projects/docs-qa-bot/index.md#step-4-wire-up-the-bots-message-handler) for where to get one.

```bash
cp .env.example .env
# then edit .env: DISCORD_BOT_TOKEN=... and GITHUB_TOKEN=... (or your provider's key)
```

`.env` is already gitignored — never commit a real token or key.

```bash
uv run python bot.py
```

Once it's running, invite the bot to a test server (OAuth2 URL Generator in the Developer Portal, `bot` scope, `Send Messages` + `Read Message History` permissions) and mention it with a question:

```
@docs-qa-bot how do I enable the message content intent?
```

`uv` reads `pyproject.toml`/`uv.lock` and creates an isolated environment for this project automatically on first run.

## Trying the RAG core in a notebook

If you just want to see the retrieval-and-generation pipeline work without installing anything locally, click one of the Colab/Kaggle/Binder badges above to open `notebook.ipynb`. It embeds the same three sample docs from `docs/`, builds an in-memory index, and runs a few example questions through `retrieve()` + a free-tier LLM — the same logic as `build_index.py`/`retrieve.py`/`bot.py`'s `answer()`, minus the Discord wiring. It's a good way to sanity-check the pipeline or experiment with the sample docs before setting up the full local project below.

### Using your own docs

Replace the files in `docs/` with your own project's `.md`/`.txt` documentation, then re-run `uv run python build_index.py` — the index only updates when you explicitly rebuild it, and the bot must be restarted (or reload the index itself) to pick up a rebuilt one.

## Running it in GitHub Codespaces

Click the badge above, or go to the [repo's Codespaces page](https://github.com/abderrahim-lectures/python-data-analysis-course), for a ready-to-go cloud dev environment (Node + Python + `uv` preinstalled via [`.devcontainer/devcontainer.json`](../../.devcontainer/devcontainer.json)). A Codespace can keep `bot.py` running in a terminal for as long as the browser tab (and the Codespace) stays open — a reasonable way to run this without installing anything locally, unlike Colab/Kaggle notebooks, which aren't built for a long-running background process like a bot's event loop. Once it's open:

```bash
cd examples/docs-qa-bot
uv run python build_index.py
uv run python bot.py
```

(add `DISCORD_BOT_TOKEN` and your LLM key as [Codespaces secrets](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-encrypted-secrets-for-your-repository-and-organization#adding-secrets-for-a-repository), or `export` them for a one-off session before running `bot.py`).

## A note on staying current

Model names and library APIs in this space change fast. `all-MiniLM-L6-v2`, the GitHub Models endpoint, and `discord.py`'s intents API used here were all verified working while writing this example, but may have drifted by the time you read this — see the callout in the [lesson](../../docs/projects/docs-qa-bot/index.md) for what to check before relying on this code.

## Built your own docs bot?

See [`examples/student-projects/`](../student-projects/) for how to share it with the class via a pull request — no git experience required, it walks through every step.
