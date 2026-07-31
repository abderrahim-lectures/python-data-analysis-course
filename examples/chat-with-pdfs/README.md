# Chat with Your PDFs Example

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)

The local companion to the course's [Chat with Your PDFs](../../docs/projects/chat-with-pdfs/index.md) project — a small, complete multi-document retrieval-augmented generation pipeline over a folder of PDFs, with page-number citations in every answer.

## What's here

- `pdfs/` — three short sample PDFs (an employee handbook, a product warranty guide, a city permit guide) so the pipeline runs out of the box with no setup.
- `generate_sample_pdfs.py` — regenerates the sample PDFs in `pdfs/` with `reportlab`. Only needed if you want to reset the samples; not part of the RAG pipeline itself.
- `load_pdfs.py` — extracts text from every PDF in `pdfs/` page by page with `pypdf`, and splits each page into small chunks, keeping the source filename and page number attached (`load_chunks()`) — [Step 1](../../docs/projects/chat-with-pdfs/index.md#step-1-load-and-chunk-your-pdfs) of the lesson.
- `build_index.py` — embeds every chunk locally with `sentence-transformers` and saves the vectors (`index.npy`) and chunk text/metadata (`chunks.json`) — [Step 2](../../docs/projects/chat-with-pdfs/index.md#step-2-embed-your-chunks-locally).
- `retrieve.py` — `retrieve(question, top_k)`: finds the most relevant chunks for a question across every PDF, using NumPy cosine similarity — [Step 3](../../docs/projects/chat-with-pdfs/index.md#step-3-retrieve-and-generate-a-cited-answer).
- `ask.py` — retrieves relevant chunks, builds a prompt that requires a `(source, page N)` citation for every fact, and asks a free-tier LLM to answer using only that context — also [Step 3](../../docs/projects/chat-with-pdfs/index.md#step-3-retrieve-and-generate-a-cited-answer).
- `chat.py` — a small interactive loop for asking multiple questions in a row — [Step 4](../../docs/projects/chat-with-pdfs/index.md#step-4-a-small-interactive-loop).
- `notebook.ipynb` — a Colab/Kaggle/Binder-friendly version of the same pipeline, using `getpass()` for the API key instead of a `.env` file.

## Running it

```bash
uv sync
uv run python build_index.py   # embeds pdfs/ -- no API key needed, runs locally
uv run python retrieve.py      # try a search with no LLM involved yet
```

The generation steps (`ask.py`, `chat.py`) need a free-tier API key, since that part actually calls a hosted language model:

1. **Get a free-tier API key** from your chosen provider — see the table in the [lesson's Setup section](../../docs/projects/chat-with-pdfs/index.md#setup) for where to get one.
2. **Copy `.env.example` to `.env`** and fill in the key for your provider:
   ```bash
   cp .env.example .env
   # then edit .env
   ```
   `.env` is already gitignored — never commit a real key.
3. **Run it**:
   ```bash
   uv run python ask.py "How many days of paid time off do employees get?"
   uv run python chat.py   # or: keep asking questions in a loop
   ```

`uv` reads `pyproject.toml`/`uv.lock` and creates an isolated environment for this project automatically on first run.

### Using your own PDFs

Replace the files in `pdfs/` with your own `.pdf` files, then re-run `uv run python build_index.py` — the index only updates when you explicitly rebuild it. Scanned image-only PDFs won't extract any text this way (`pypdf` only reads text that's actually embedded in the file, not pixels) — this example assumes text-based PDFs, the same way most exported documents, reports, and guides are.

## Running it in GitHub Codespaces

Click the badge above, or go to the [repo's Codespaces page](https://github.com/abderrahim-lectures/python-data-analysis-course), for a ready-to-go cloud dev environment (Node + Python + `uv` preinstalled via [`.devcontainer/devcontainer.json`](../../.devcontainer/devcontainer.json)). Once it's open:

```bash
cd examples/chat-with-pdfs
uv run python build_index.py
uv run python ask.py "How many days of paid time off do employees get?"
```

(add your API key as a [Codespaces secret](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-encrypted-secrets-for-your-repository-and-organization#adding-secrets-for-a-repository) or `export` it for a one-off session before running `ask.py`).

## Running it as a notebook

`notebook.ipynb` mirrors the same four steps as plain cells, with `getpass()` prompting for your API key at runtime instead of a `.env` file (notebook sessions are ephemeral, so there's nothing to persist). Launch it directly with no local install:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/chat-with-pdfs/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/chat-with-pdfs/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fchat-with-pdfs%2Fnotebook.ipynb)

(these badges point at this PR's branch for now — they'll point at `main` once merged)

## A note on staying current

Model names and library APIs in this space change fast. `all-MiniLM-L6-v2` and the GitHub Models endpoint used here were both verified working while writing this example, but may have drifted by the time you read this — see the callout in the [lesson](../../docs/projects/chat-with-pdfs/index.md#setup) for what to check before relying on this code.

## Built your own PDF chatbot?

See [`examples/student-projects/`](../student-projects/) for how to share it with the class via a pull request — no git experience required, it walks through every step.
