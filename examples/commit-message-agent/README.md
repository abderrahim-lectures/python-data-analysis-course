# Commit-Message Agent Example

The local companion to the course's [Build a Git Commit-Message Generator](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/docs/projects/commit-message-agent) lesson -- a real, runnable CLI tool that reads your staged `git diff`, drafts a Conventional-Commits-style message with a free-tier LLM, and only commits after you explicitly say so.

## What's here

`commit_helper.py` -- a single-file CLI with:

- `get_diff_staged()` / `get_diff_for_commit(commit)` -- run real `git diff --staged` / `git show` commands via `subprocess` and return their output as text.
- `SYSTEM_PROMPT` -- a commit-message-specific system prompt asking for a Conventional Commits `type(scope): summary` line plus an optional body, instead of a vague one-liner.
- `draft_commit_message(diff, provider=...)` -- sends the diff to whichever free-tier provider you've configured and returns the drafted message as a plain string. It does nothing else -- no `subprocess`, no committing.
- `truncate_diff(diff)` -- caps oversized diffs before they're sent, so a huge diff doesn't silently blow past a free-tier context window or token quota.
- `run_interactive_loop(diff, ...)` -- shows the draft, then lets you accept it, edit it, ask for a fresh draft, or cancel. Only calls `_commit()` -- the one function that actually runs `git commit -m` -- after you type `y`.

**This tool never commits anything on its own.** `draft_commit_message` only ever returns a string; `_commit` is the single place `git commit` is invoked, and it's only reachable through the interactive loop's explicit `y` confirmation. There is no "auto-commit if confident" mode, and there shouldn't be one -- see the lesson's tip on why that boundary matters.

**You're free to use whichever free-tier provider you like** -- this isn't locked to any one of them. Six are wired up already: **GitHub Models** (the default -- no separate signup, uses a GitHub account you already have), Gemini, Groq, Mistral, Cerebras, and OpenRouter, all through the same `openai` client pointed at each provider's own OpenAI-compatible endpoint.

## Running it

1. **Get a free-tier API key** from your chosen provider -- see the table in the [lesson's Setup section](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/docs/projects/commit-message-agent#get-a-free-llm-api-key) for where to get one for each.
2. **Copy `.env.example` to `.env`** and fill in the key for your provider (and `LLM_PROVIDER` if you're not using the default):
   ```bash
   cp .env.example .env
   # then edit .env
   ```
   `.env` is already gitignored -- never commit a real key.
3. **Stage some real changes** in a real git repo (this one, or any project of yours):
   ```bash
   git add <files you changed>
   ```
4. **Run it with `uv`** -- no manual virtual environment setup needed:
   ```bash
   uv run python commit_helper.py                     # draft from staged changes, ask before committing
   uv run python commit_helper.py --dry-run            # draft and print only, never offer to commit
   uv run python commit_helper.py --commit <sha>       # draft a message for one past commit (dry-run only)
   git diff --staged | uv run python commit_helper.py --stdin --dry-run   # draft from a piped-in diff
   ```

`uv` reads `pyproject.toml`/`uv.lock` and creates an isolated environment for this project automatically on first run.

At the prompt, type `y` to actually run `git commit -m "..."` with the drafted (or edited) message, `e` to edit it first, `r` to ask the model for a fresh draft, or `n` to cancel -- nothing is committed unless you type `y`.

### Try it on this course's own history

Because this script is just running real `git` commands, it works unmodified against any repo -- including this one. `--commit` always runs in dry-run mode (drafting a message for history isn't something you'd actually commit):

```bash
git log --oneline -10                       # find a real commit hash
uv run python commit_helper.py --commit <hash>
```

## Running it in GitHub Codespaces

Click into a [Codespace for the whole repo](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, `uv`, and git are preinstalled) -- it's a real clone with real history and a real place to stage changes, so every command above works exactly as it does locally.

## Try it with zero setup: `notebook.ipynb`

[`notebook.ipynb`](./notebook.ipynb) in this folder is a runnable notebook version of the message-drafting logic, for Colab or Kaggle:

<!-- TODO: update these badge links to point at main once this PR merges -->
[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/commit-message-agent/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/commit-message-agent/notebook.ipynb)

A notebook environment has no local git repository of your own with staged changes, which is this tool's whole premise -- so rather than pretending that gap doesn't exist, the notebook shallow-clones this course's own repository and drafts a message for one real, small, historical commit's diff (`git show` on a real commit hash) instead of your own staged work. It demos `SYSTEM_PROMPT`, `truncate_diff`, and `draft_commit_message` unmodified -- it does **not** demo the interactive accept/edit/commit loop, since that only makes sense against a real repo you're actually working in. Come back to `uv run python commit_helper.py` above or a Codespace for that part.

## A note on staying current

Model names and provider free-tier terms change fast -- the model IDs and endpoints in `commit_helper.py`'s `PROVIDERS` dict were verified against a live run while writing this example, but check each provider's own docs before relying on them, since they may have drifted by the time you read this.

## Built your own version?

See [`examples/student-projects/`](../student-projects/) for how to share it with the class via a pull request -- no git experience required, it walks through every step.
