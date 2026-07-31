# Discord Trivia Bot Example

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)
[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/add-trivia-bot-project/examples/trivia-bot/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/add-trivia-bot-project/examples/trivia-bot/notebook.ipynb)

<!-- TODO: update the Colab/Kaggle badge links above to point at main once this PR merges -->

The local companion to the course's [Build a Discord Trivia Bot](../../docs/projects/trivia-bot/index.md) project — a `discord.py` bot that runs trivia rounds in a server, from a fixed question bank or freshly LLM-generated on a topic, and keeps a persistent per-player leaderboard.

## What's here

- `questions.py` — a small fixed bank of trivia questions (`random_question()`), used when `/trivia` is run with no topic.
- `scores.py` — per-player score persistence in `scores.json` (`load_scores()`, `award_point()`, `leaderboard_text()`). Keyed by Discord user id so scores survive a nickname change.
- `generate.py` — `generate_question(topic)`: asks a free-tier LLM for a fresh multiple-choice question on any topic, in the same shape as `questions.py`'s bank entries.
- `round.py` — non-Discord round logic (`pick_question()`, `format_question()`, `check_answer()`) shared by the bot and the notebook. Contains no `discord` import at all, which is what makes it testable without a live bot.
- `bot.py` — the actual Discord bot: `/trivia [topic]` starts a round (posts a question, waits up to 30s for the first correct answer), `/leaderboard` shows the running scores.
- `notebook.ipynb` — a Colab/Kaggle-runnable notebook demoing question generation and scoring with plain function calls and a few fake "players" answering. It deliberately does **not** run the Discord bot itself — see below for why.

## Running it

```bash
uv sync
uv run python questions.py   # sanity-check the fixed question bank, no key/token needed
uv run python scores.py      # sanity-check score persistence with fake players
```

Running the bot itself needs two things the steps above don't:

1. **A Discord bot token** — create an application at the [Discord Developer Portal](https://discord.com/developers/applications), add a Bot to it, reset/copy its token, and **enable the "Message Content" privileged intent** under Bot settings (the bot's answer-collection otherwise only ever sees empty message content). See the [lesson's Setup section](../../docs/projects/trivia-bot/index.md#setup) for the full walkthrough.
2. **A free-tier LLM API key** — only needed for `/trivia` with a topic (`generate.py`); the fixed question bank works with no key at all. See the table in the [lesson's Setup section](../../docs/projects/trivia-bot/index.md#setup) for where to get one.

```bash
cp .env.example .env
# then edit .env: DISCORD_BOT_TOKEN=... and GITHUB_TOKEN=... (or your provider's key)
```

`.env` is already gitignored — never commit a real token or key.

```bash
uv run python bot.py
```

Once it's running, invite the bot to a test server (OAuth2 URL Generator in the Developer Portal, `bot` and `applications.commands` scopes, `Send Messages` + `Read Message History` permissions) and try it:

```
/trivia
/trivia topic: classic video games
/leaderboard
```

`uv` reads `pyproject.toml`/`uv.lock` and creates an isolated environment for this project automatically on first run.

## Trying question generation and scoring in a notebook

If you just want to see question generation and score tracking work without installing anything locally, click one of the Colab/Kaggle badges above to open `notebook.ipynb`. It calls `generate_question()` and `round.py`/`scores.py`'s functions directly, with a few sample topics and fake "players" answering — the same logic `bot.py` uses, minus the Discord wiring. It's a good way to sanity-check question generation and scoring before setting up the full local project below.

## Running it in GitHub Codespaces

Click the badge above, or go to the [repo's Codespaces page](https://github.com/abderrahim-lectures/python-data-analysis-course), for a ready-to-go cloud dev environment (Node + Python + `uv` preinstalled via [`.devcontainer/devcontainer.json`](../../.devcontainer/devcontainer.json)). A Codespace can keep `bot.py` running in a terminal for as long as the browser tab (and the Codespace) stays open — a reasonable way to run this without installing anything locally, unlike Colab/Kaggle notebooks, which aren't built for a long-running background process like a bot's event loop. Once it's open:

```bash
cd examples/trivia-bot
uv run python bot.py
```

(add `DISCORD_BOT_TOKEN` and your LLM key as [Codespaces secrets](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-encrypted-secrets-for-your-repository-and-organization#adding-secrets-for-a-repository), or `export` them for a one-off session before running `bot.py`).

## A note on staying current

Model names and library APIs in this space change fast. `gpt-4o-mini` via the GitHub Models endpoint and `discord.py`'s `app_commands`/intents APIs used here were all verified working while writing this example, but may have drifted by the time you read this — see the callout in the [lesson](../../docs/projects/trivia-bot/index.md) for what to check before relying on this code.

## Built your own trivia bot?

See [`examples/student-projects/`](../student-projects/) for how to share it with the class via a pull request — no git experience required, it walks through every step.
