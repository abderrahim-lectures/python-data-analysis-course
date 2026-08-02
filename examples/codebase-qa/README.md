# Codebase Q&A Example

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)

The local companion to the course's [Build a Codebase Q&A Tool](../../docs/projects/codebase-qa/index.md) project — answer "where is X defined?" with an exact `ast`-based symbol index and "how does X work?" with local embedding search, grounding a free-tier LLM in `file:line` citations you can verify.

## What's here

- `symbols.py` — walks a Python repo's top-level AST and records every function/class/method/import with its line number — exact answer to "where is X defined?" — [Step 1](../../docs/projects/codebase-qa/index.md#step-1-extract-exact-symbols-with-ast).
- `prepare_repo.py` — the code-aware chunker (function/class boundaries for code, paragraphs for docs), same as the RAG-over-GitHub-repo example — feeds the semantic half.
- `build_index.py` — builds both indexes: `symbols.json` (exact) and `index.npy`/`chunks.json` (embeddings) — [Step 2](../../docs/projects/codebase-qa/index.md#step-2-build-the-semantic-index).
- `retrieve.py` — `retrieve(question, top_k)`: cosine-similarity retrieval over the embedding index.
- `query.py` — the dispatcher: routes "where is X?" to exact symbol lookup, "how does X work?" to semantic search, and grounds LLM answers in the retrieved context — [Step 3](../../docs/projects/codebase-qa/index.md#step-3-dispatcher--pick-the-right-tool-per-question).
- `sample_repo/` — a tiny self-contained training pipeline (`main.py`, `utils.py`) with a clear `train_model`/`split_data`/`evaluate` story, so both query modes have obvious answers.
- `notebook.ipynb` — a Colab/Kaggle/Binder-ready notebook that writes the sample repo inline and runs both query modes over it. Launch it from the badges on the [lesson page](../../docs/projects/codebase-qa/index.md#where-to-run-this), or open it directly: [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/codebase-qa/notebook.ipynb) [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/codebase-qa/notebook.ipynb) [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcodebase-qa%2Fnotebook.ipynb)

## Running it

Steps 1-3 (indexes + exact symbol lookup) need **no API key and no network access**:

```bash
uv sync
uv run python build_index.py sample_repo       # builds both indexes locally
uv run python symbols.py sample_repo           # quick look at the symbol index
uv run python query.py "where is split_data defined?"
```

The LLM-grounded answers need a free-tier API key:

1. **Get a free-tier API key** from your chosen provider — see the table in the [lesson's Setup](../../docs/projects/codebase-qa/index.md#get-a-free-llm-api-key).
2. **Copy `.env.example` to `.env`** and fill in the key:
   ```bash
   cp .env.example .env
   # then edit .env
   ```
   `.env` is already gitignored — never commit a real key.
3. **Ask a "how does it work?" question**:
   ```bash
   uv run python query.py "how does the training loop work?"
   ```

`uv` reads `pyproject.toml`/`uv.lock` and creates an isolated environment for this project automatically on first run.

### Using a real repo

Point the same commands at any Python repo (the course repo works well):

```bash
git clone --depth 1 https://github.com/abderrahim-lectures/python-data-analysis-course
uv run python build_index.py python-data-analysis-course
uv run python query.py "where is HomepageProjectCard defined?"
uv run python query.py "how does the course build this website?"
```

Re-run `build_index.py` after the repo changes — the indexes are snapshots, not live views.

## Running it in GitHub Codespaces

Click the badge above, or go to the [repo's Codespaces page](https://github.com/abderrahim-lectures/python-data-analysis-course), for a ready-to-go cloud dev environment (Node + Python + `uv` preinstalled via [`.devcontainer/devcontainer.json`](../../.devcontainer/devcontainer.json)). Once it's open:

```bash
cd examples/codebase-qa
uv run python build_index.py sample_repo
uv run python query.py "where is split_data defined?"
```

(add your API key as a [Codespaces secret](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-encrypted-secrets-for-your-repository-and-organization#adding-secrets-for-a-repository) or `export` it for a one-off session before asking a "how does it work?" question).

## A note on staying current

Model names and library APIs in this space change fast. `all-MiniLM-L6-v2` and the GitHub Models endpoint used here were both verified working while writing this example, but may have drifted by the time you read it — see the callout in the [lesson](../../docs/projects/codebase-qa/index.md#step-3-dispatcher--pick-the-right-tool-per-question) for what to check before relying on this code.

## Built your own Q&A tool?

See [`examples/student-projects/`](../student-projects/) for how to share it with the class via a pull request — no git experience required, it walks through every step.
