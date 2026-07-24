# Email-Triage Agent Example

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)
<!-- TODO: update these badge links to point at main once this PR merges -->
[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/add-email-triage-agent-project/examples/email-triage-agent/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/add-email-triage-agent-project/examples/email-triage-agent/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/add-email-triage-agent-project?filepath=examples%2Femail-triage-agent%2Fnotebook.ipynb)

The local companion to the course's [Build a Personal Email-Triage Agent](../../docs/projects/email-triage-agent/index.md) project — an agent that categorizes, prioritizes, and drafts (but **never sends**) replies for a batch of emails, using your choice of free-tier LLM.

## What's here

- `sample_emails/` — six short, realistic sample emails (urgent, newsletter, two needing a reply, spam-ish, and an automated FYI) so the whole pipeline runs with no real inbox or credentials needed.
- `triage.py` — parses the sample emails, categorizes/prioritizes each with an LLM (`triage_email`), and drafts a reply for anything that needs one (`draft_reply`) — saved to `drafts/`, never sent. Explained step by step in the [lesson](../../docs/projects/email-triage-agent/index.md).
- `notebook.ipynb` — a zero-install alternative to running `triage.py` locally: the same pipeline, with the sample emails embedded directly in the notebook, runnable straight from your browser via the Colab/Kaggle/Binder badges above — no clone, no `uv`, no `.env` file. Prompts interactively for your API key with `getpass` instead of reading one from disk. Lower-fidelity than the real local project (no separate files, one long notebook instead of a real project structure), so treat it as a quick way to experiment rather than the primary path — see the lesson's "Where to run this" section.
- `fetch_from_imap.py` — **optional, not part of the core lesson path.** Fetches your most recent *unread* emails from a real inbox over IMAP, read-only (`mark_seen=False`), and saves them in the same format `triage.py` reads — see the lesson's "Optional, go further" section.

## Safety boundary

This project never sends email. There is no SMTP code anywhere in this repo — not commented out, not behind a flag. `draft_reply` returns a string; `triage.py`'s `main()` only ever prints it and writes it to a local file in `drafts/` for you to review and send yourself, from your own email client. Keep that boundary if you extend this example.

## Running it

```bash
uv sync
uv run python triage.py   # triages sample_emails/ and writes drafts/ for anything needing a reply
```

1. **Get a free-tier API key** from your chosen provider — see the table in the [lesson's Setup section](../../docs/projects/email-triage-agent/index.md#get-a-free-ai-api-key) for where to get one.
2. **Copy `.env.example` to `.env`** and fill in the key for your provider:
   ```bash
   cp .env.example .env
   # then edit .env
   ```
   `.env` is already gitignored — never commit a real key.
3. **Run it**:
   ```bash
   uv run python triage.py
   ```
4. **Read `drafts/`** — every generated reply is saved there, not sent anywhere. Review before copying anything into a real reply.

`uv` reads `pyproject.toml`/`uv.lock` and creates an isolated environment for this project automatically on first run.

### Optional: triage a real inbox instead

Not the primary path — see the lesson's "Optional, go further" section for the full Gmail App Password walkthrough first.

```bash
uv add imap-tools
uv run python fetch_from_imap.py
uv run python triage.py real_emails
```

## Running it in GitHub Codespaces

Click the badge above, or go to the [repo's Codespaces page](https://github.com/abderrahim-lectures/python-data-analysis-course), for a ready-to-go cloud dev environment (Node + Python + `uv` preinstalled via [`.devcontainer/devcontainer.json`](../../.devcontainer/devcontainer.json)). Once it's open:

```bash
cd examples/email-triage-agent
uv run python triage.py
```

(add your API key as a [Codespaces secret](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-encrypted-secrets-for-your-repository-and-organization#adding-secrets-for-a-repository) or `export` it for a one-off session first).

## A note on staying current

Model names and provider API endpoints in this space change fast — the model IDs and OpenAI-compatible endpoints used here were verified while writing this example, but may have drifted by the time you read this. See the callout in the [lesson](../../docs/projects/email-triage-agent/index.md#get-a-free-ai-api-key) for what to check before relying on this code.

## Built your own email-triage agent?

See [`examples/student-projects/`](../student-projects/) for how to share it with the class via a pull request — no git experience required, it walks through every step.
