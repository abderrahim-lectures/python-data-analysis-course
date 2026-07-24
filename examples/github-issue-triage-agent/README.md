# GitHub Issue Triage Agent Example

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)

A real, runnable issue-triage *drafting* script — the fuller version of the one built step by step in [the course's Real-World Projects lesson](../../docs/projects/github-issue-triage-agent/index.md). Fetches OPEN issues from a real public GitHub repo, asks a free-tier LLM to suggest a triage label and a one-sentence rationale for each one, and prints a readable report.

## This drafts suggestions. It never applies anything.

Every suggestion this script prints is exactly that — a suggestion, for a human maintainer to read and decide on. `triage.py` never calls any GitHub endpoint that would add a label, comment, or otherwise change a real issue. See "Where to go from here" in the lesson for how you could extend it to actually apply labels, carefully, once you trust its output.

## Running it

**You're free to use whichever free-tier LLM provider you like** — this isn't locked to GitHub Models. Six are wired up in `triage.py`'s `PROVIDERS` dict: **GitHub Models** (the default — no separate signup, uses a GitHub account you already have), Gemini, Groq, Mistral, Cerebras, and OpenRouter.

1. **Get a free-tier API key** from your chosen provider — see the table in the [lesson's Setup section](../../docs/projects/github-issue-triage-agent/index.md#setup) for where to get one for each.
2. **Copy `.env.example` to `.env`** and fill in the key for your provider (and `LLM_PROVIDER`/`GITHUB_REPO` if you don't want the defaults):
   ```bash
   cp .env.example .env
   # then edit .env
   ```
   `.env` is already gitignored — never commit a real key.
3. **If you picked a provider other than GitHub Models, Cerebras, or OpenRouter**, add its SDK — `triage.py` only declares `openai` as a dependency by default, since GitHub Models/Cerebras/OpenRouter are all OpenAI-compatible and share it:
   ```bash
   uv add google-generativeai   # gemini
   uv add groq                  # groq
   uv add mistralai             # mistral
   ```
4. **Run it with `uv`** — no manual virtual environment setup needed:
   ```bash
   uv run python triage.py
   ```

`uv` reads `pyproject.toml`/`uv.lock` and creates an isolated environment for this project automatically on first run. By default this triages the 10 most recently updated open issues on [`psf/requests`](https://github.com/psf/requests) — set `GITHUB_REPO=owner/repo` in `.env` to point it at a different public repo.

### Using it from your own code

```python
from triage import fetch_open_issues, build_llm_caller, suggest_triage, print_triage_report

issues = fetch_open_issues("psf", "requests", limit=5)
call_llm = build_llm_caller()
suggestions = [suggest_triage(issue, call_llm) for issue in issues]
print_triage_report("psf", "requests", issues, suggestions)
```

## Running it in a hosted notebook (Colab / Kaggle / Binder)

Prefer not to set up `uv` locally? [`notebook.ipynb`](notebook.ipynb) in this folder is a self-contained port of `triage.py` — same fetch-issues / build-prompt / call-LLM / print-report logic, split into cells with a `getpass()` prompt for your GitHub Models API key (and an optional second one for a higher GitHub REST API rate limit). Open it with the "Open in Colab" / "Open in Kaggle" / "Binder" badges at the top of the [lesson's "Where to run this" section](../../docs/projects/github-issue-triage-agent/index.md#where-to-run-this) and run the cells top to bottom — no local install required.

## Running it in GitHub Codespaces

Click the badge above, or go to the [repo's Codespaces page](https://github.com/abderrahim-lectures/python-data-analysis-course), to get a ready-to-go cloud dev environment (Node + Python + `uv` preinstalled via [`.devcontainer/devcontainer.json`](../../.devcontainer/devcontainer.json)) — notably convenient here since a Codespace already has `git`/`gh` context for the repo you're in. Once it's open, add your API key as a [Codespaces secret](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-encrypted-secrets-for-your-repository-and-organization#adding-secrets-for-a-repository), or just `export` it in the terminal for a one-off session, then run:

```bash
cd examples/github-issue-triage-agent
uv run python triage.py
```

## A note on rate limits

Unauthenticated calls to GitHub's REST API are capped at 60 requests/hour — plenty for one run of this script (it makes one request total to list issues), but easy to burn through if you're iterating quickly or running it in a loop. Set `GITHUB_API_TOKEN` in `.env` (any personal access token, no scopes needed for public repo reads) to raise that to 5,000 requests/hour. This is entirely separate from your LLM provider's own rate limits, which apply per issue triaged.

## A note on staying current

Model names and provider SDKs in this space change fast — the model IDs and client calls here were verified against a live run while writing this example, but may have drifted by the time you read this. Check your provider's current docs before relying on this code long-term.

## Built your own version for a Real-World Project?

See [`examples/student-projects/`](../student-projects/) for how to share it with the class via a pull request — no git experience required, it walks through every step.
