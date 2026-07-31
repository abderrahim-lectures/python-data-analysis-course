# Agentic Code Reviewer Example

The local companion to the course's [Build an Agentic Code Reviewer](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/docs/projects/agentic-code-reviewer) lesson -- a real, runnable CLI tool that captures a git diff with `subprocess` and asks a free-tier LLM to review it like a human reviewer would.

## What's here

`review.py` -- a single-file CLI with:

- `get_diff_uncommitted()` / `get_diff_against(ref)` / `get_diff_for_commit(commit)` -- run real `git diff`/`git show` commands via `subprocess` and return their output as text.
- `SYSTEM_PROMPT` -- a code-review-specific system prompt asking for structured feedback (file, category, severity, explanation, fix) instead of vague commentary.
- `review_diff(diff, provider=...)` -- sends the diff to whichever free-tier provider you've configured and returns the model's review.
- `truncate_diff(diff)` -- caps oversized diffs before they're sent, so a huge diff doesn't silently blow past a free-tier context window or token quota.

**You're free to use whichever free-tier provider you like** -- this isn't locked to any one of them. Six are wired up already: **GitHub Models** (the default -- no separate signup, uses a GitHub account you already have), Gemini, Groq, Mistral, Cerebras, and OpenRouter, all through the same `openai` client pointed at each provider's own OpenAI-compatible endpoint.

## Running it

1. **Get a free-tier API key** from your chosen provider -- see the table in the [lesson's Setup section](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/docs/projects/agentic-code-reviewer#get-a-free-llm-api-key) for where to get one for each.
2. **Copy `.env.example` to `.env`** and fill in the key for your provider (and `LLM_PROVIDER` if you're not using the default):
   ```bash
   cp .env.example .env
   # then edit .env
   ```
   `.env` is already gitignored -- never commit a real key.
3. **Run it with `uv`** -- no manual virtual environment setup needed:
   ```bash
   uv run python review.py                    # review your own uncommitted changes
   uv run python review.py --against main      # review the diff against another ref
   uv run python review.py --commit <sha>       # review one specific past commit
   git diff main | uv run python review.py --stdin   # review a piped-in diff
   ```

`uv` reads `pyproject.toml`/`uv.lock` and creates an isolated environment for this project automatically on first run.

### Try it on this course's own history

Because this script is just running real `git` commands, it works unmodified against any repo -- including this one:

```bash
git log --oneline -10          # find a real commit hash
uv run python review.py --commit <hash>
```

## Running it in GitHub Codespaces

Click into a [Codespace for the whole repo](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, `uv`, and git are preinstalled) -- it's a real clone with real history, so every command above, including `--commit`, works exactly as it does locally.

## Try it with zero setup: `notebook.ipynb`

[`notebook.ipynb`](./notebook.ipynb) in this folder is a runnable notebook version of this same tool, for Colab, Kaggle, or Binder:

<!-- TODO: update these badge links to point at main once this PR merges -->
[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/add-agentic-code-reviewer-project/examples/agentic-code-reviewer/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/add-agentic-code-reviewer-project/examples/agentic-code-reviewer/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/add-agentic-code-reviewer-project?filepath=examples%2Fagentic-code-reviewer%2Fnotebook.ipynb)

A notebook environment has no local git repository of your own to diff, which is this tool's whole premise -- so rather than pretending that gap doesn't exist, the notebook shallow-clones this course's own repository and reviews one real, small, historical commit from it (`git show` on a real commit hash) instead of your own uncommitted work. Every other part of the tool -- the `subprocess` diff capture, the system prompt, the LLM call, the structured output -- runs unmodified. It's a fast way to see the whole thing work end to end before setting it up locally; once you want to review your own actual changes, come back to `uv run python review.py` above or a Codespace.

## A note on staying current

Model names and provider free-tier terms change fast -- the model IDs and endpoints in `review.py`'s `PROVIDERS` dict were verified against a live run while writing this example, but check each provider's own docs before relying on them, since they may have drifted by the time you read this.

## Built your own version?

See [`examples/student-projects/`](../student-projects/) for how to share it with the class via a pull request -- no git experience required, it walks through every step.
