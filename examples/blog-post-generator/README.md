# Outline→Blog Post Generator Example

The local companion to the course's [Build an Outline→Blog Post Generator](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/docs/projects/blog-post-generator) lesson -- a real, runnable CLI that reads a rough Markdown outline from a file and asks a free-tier LLM to expand it into a polished blog post draft. You keep control of the structure and ideas; the model does the writing.

## What's here

`generate.py` -- a single-file CLI with:

- `load_outline(path)` -- reads a Markdown outline from a `.md` or `.txt` file with `pathlib`.
- `SYSTEM_PROMPT` -- an expansion-specific system prompt with a hard **faithfulness rule**: cover every section and bullet in order, never invent sections or examples, and mark outline holes with honest `[expand: ...]` notes instead of fabricating.
- `generate(outline, provider=...)` -- sends the outline to whichever free-tier provider you've configured and returns the expanded draft.
- `truncate(outline)` -- caps oversized outlines before they're sent, so a long outline doesn't silently blow past a free-tier context window or token quota.

`sample_outline.md` -- a bundled outline (about building a habit-tracking heatmap) with real substance -- a thesis, a story arc, a deliberate "TODO" bullet -- so the generated draft has something genuine to work with.

**You're free to use whichever free-tier provider you like** -- this isn't locked to any one of them. Six are wired up already: **GitHub Models** (the default -- no separate signup, uses a GitHub account you already have), Gemini, Groq, Mistral, Cerebras, and OpenRouter, all through the same `openai` client pointed at each provider's own OpenAI-compatible endpoint.

## Running it

1. **Get a free-tier API key** from your chosen provider -- see the table in the [lesson's Setup section](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/docs/projects/blog-post-generator#get-a-free-llm-api-key) for where to get one for each.
2. **Copy `.env.example` to `.env`** and fill in the key for your provider (and `LLM_PROVIDER` if you're not using the default):
   ```bash
   cp .env.example .env
   # then edit .env
   ```
   `.env` is already gitignored -- never commit a real key.
3. **Run it with `uv`** -- no manual virtual environment setup needed:
   ```bash
   uv run python generate.py sample_outline.md
   # or with your own outline:
   uv run python generate.py my_outline.md
   uv run python generate.py my_outline.md --provider groq
   ```

`uv` reads `pyproject.toml`/`uv.lock` and creates an isolated environment for this project automatically on first run.

### The iteration loop

The tool is a draft engine, not a text factory: generate a draft, edit it by hand in your editor (`uv run python generate.py my_outline.md > draft.md`), then when you change the outline, regenerate and watch the draft track your structural changes. If a change to the outline *doesn't* show up in the next draft, that's a signal your prompt's faithfulness rule needs strengthening -- not a reason to ignore it.

## Running it in GitHub Codespaces

Click into a [Codespace for the whole repo](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are preinstalled) -- the bundled sample outline is already there, so you can run every command above immediately, no setup beyond copying `.env.example` to `.env`.

## Try it with zero setup: `notebook.ipynb`

[`notebook.ipynb`](./notebook.ipynb) in this folder is a runnable notebook version of this same tool, for Colab, Kaggle, or Binder:

<!-- TODO: update these badge links to point at main once this PR merges -->
[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/blog-post-generator/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/blog-post-generator/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fblog-post-generator%2Fnotebook.ipynb)

A notebook environment has no local files, which is this tool's whole premise -- so rather than pretending that gap doesn't exist, the notebook fetches the bundled `sample_outline.md` straight from the course repo and asks for your API key interactively with `getpass`. Every other part of the tool -- the `pathlib` file reading, the system prompt, the LLM call, the structured output -- runs unmodified. It's a fast way to see the whole thing work end to end before setting it up locally; once you want to run it against your real outlines, come back to `uv run python generate.py` above or a Codespace.

## A note on staying current

Model names and provider free-tier terms change fast -- the model IDs and endpoints in `generate.py`'s `PROVIDERS` dict were verified against a live run while writing this example, but check each provider's own docs before relying on them, since they may have drifted by the time you read this.

## Built your own version?

See [`examples/student-projects/`](../student-projects/) for how to share it with the class via a pull request -- no git experience required, it walks through every step.
