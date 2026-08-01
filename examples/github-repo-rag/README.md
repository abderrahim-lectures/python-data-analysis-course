# GitHub Repo RAG Example

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)

The local companion to the course's [Build a RAG App Over a GitHub Repo](../../docs/projects/github-repo-rag/index.md) project — clone a real repo, chunk its code *and* docs with line tracking, embed everything locally, and ask questions that come back with `file.py:line` citations you can verify.

## What's here

- `prepare_repo.py` — walks a cloned repo, skips junk directories (`.git`, `node_modules`, `build/`, …), and chunks code at function/class boundaries while prose chunks by paragraph. Every chunk records its source file **and line range** — [Step 1](../../docs/projects/github-repo-rag/index.md#step-1-walk-the-repo-and-chunk-its-files).
- `build_index.py` — embeds every chunk locally with `sentence-transformers` and saves the vectors (`index.npy`) and chunk metadata (`chunks.json`) — [Step 2](../../docs/projects/github-repo-rag/index.md#step-2-embed-every-chunk-locally).
- `retrieve.py` — `retrieve(question, top_k)`: finds the most relevant chunks using NumPy cosine similarity — [Step 3](../../docs/projects/github-repo-rag/index.md#step-3-retrieve-relevant-chunks).
- `query.py` — retrieves chunks, builds a prompt that demands `[path:start-end]` citations, and asks a free-tier LLM to answer using only that context — [Step 4](../../docs/projects/github-repo-rag/index.md#step-4-generate-an-answer-with-citations).
- `notebook.ipynb` — a Colab/Kaggle/Binder-ready notebook that clones the course repo and runs the whole pipeline over it, no local files needed. Launch it from the badges on the [lesson page](../../docs/projects/github-repo-rag/index.md#where-to-run-this), or open it directly: [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/github-repo-rag/notebook.ipynb) [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/github-repo-rag/notebook.ipynb) [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fgithub-repo-rag%2Fnotebook.ipynb)

## Running it

First, clone a test repo (the course repo works great — small, and you know the content):

```bash
git clone --depth 1 https://github.com/abderrahim-lectures/python-data-analysis-course
```

Then index and search it — steps 1-3 need **no API key**; everything runs locally:

```bash
uv sync
uv run python prepare_repo.py python-data-analysis-course   # chunk the repo
uv run python build_index.py python-data-analysis-course    # embed locally
uv run python retrieve.py                                   # try a search, no LLM yet
```

The generation step (`query.py`) needs a free-tier API key, since that part calls a hosted language model:

1. **Get a free-tier API key** from your chosen provider — see the table in the [lesson's Setup](../../docs/projects/github-repo-rag/index.md#get-a-free-llm-api-key) for where to get one.
2. **Copy `.env.example` to `.env`** and fill in the key for your provider:
   ```bash
   cp .env.example .env
   # then edit .env
   ```
   `.env` is already gitignored — never commit a real key.
3. **Run it**:
   ```bash
   uv run python query.py "How does the course build this website?"
   ```

Answers come back with citations like `[src/pages/index.tsx:12-34]` — open the file, jump to the lines, and check the answer is really grounded there.

`uv` reads `pyproject.toml`/`uv.lock` and creates an isolated environment for this project automatically on first run.

### Using your own repo

Point the same commands at any public repo — or a local folder — instead:

```bash
uv run python prepare_repo.py /path/to/your/repo
uv run python build_index.py /path/to/your/repo
```

If the repo has noisy generated directories the default `SKIP_DIRS` doesn't cover, add them in `prepare_repo.py` before rebuilding the index.

## Running it in GitHub Codespaces

Click the badge above, or go to the [repo's Codespaces page](https://github.com/abderrahim-lectures/python-data-analysis-course), for a ready-to-go cloud dev environment (Node + Python + `uv` preinstalled via [`.devcontainer/devcontainer.json`](../../.devcontainer/devcontainer.json)). Once it's open:

```bash
cd examples/github-repo-rag
git clone --depth 1 https://github.com/abderrahim-lectures/python-data-analysis-course
uv run python build_index.py python-data-analysis-course
uv run python query.py "How does the course build this website?"
```

(add your API key as a [Codespaces secret](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-encrypted-secrets-for-your-repository-and-organization#adding-secrets-for-a-repository) or `export` it for a one-off session before running `query.py`).

## A note on staying current

Model names and library APIs in this space change fast. `all-MiniLM-L6-v2` and the GitHub Models endpoint used here were both verified working while writing this example, but may have drifted by the time you read this — see the callout in the [lesson](../../docs/projects/github-repo-rag/index.md#step-4-generate-an-answer-with-citations) for what to check before relying on this code.

## Built your own RAG tool?

See [`examples/student-projects/`](../student-projects/) for how to share it with the class via a pull request — no git experience required, it walks through every step.
