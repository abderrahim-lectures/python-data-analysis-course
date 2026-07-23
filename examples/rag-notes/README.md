# RAG Notes Example

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)

The local companion to the course's [Build a RAG App Over Your Own Notes](../../docs/projects/rag-notes/index.md) project — a small, complete retrieval-augmented generation pipeline over a folder of `.md`/`.txt` notes, with local embeddings and your choice of free-tier LLM.

## What's here

- `notes/` — three short sample notes about the course itself, so the embedding and retrieval steps run out of the box with no setup.
- `prepare_notes.py` — splits every file in `notes/` into small text chunks (`load_chunks()`), explained in [Step 2](../../docs/projects/rag-notes/index.md#step-2-prepare-your-notes) of the lesson.
- `build_index.py` — embeds every chunk locally with `sentence-transformers` and saves the vectors (`index.npy`) and chunk text (`chunks.json`) — [Step 3](../../docs/projects/rag-notes/index.md#step-3-embed-your-notes-locally).
- `retrieve.py` — `retrieve(question, top_k)`: finds the most relevant chunks for a question using NumPy cosine similarity — [Step 4](../../docs/projects/rag-notes/index.md#step-4-retrieve-relevant-chunks).
- `ask.py` — retrieves relevant chunks, builds a prompt, and asks a free-tier LLM to answer using only that context — [Step 5](../../docs/projects/rag-notes/index.md#step-5-generate-an-answer-with-a-free-llm).

## Running it

```bash
uv sync
uv run python build_index.py   # embeds notes/ -- no API key needed, runs locally
uv run python retrieve.py      # try a search with no LLM involved yet
```

The generation step (`ask.py`) needs a free-tier API key, since that part actually calls a hosted language model:

1. **Get a free-tier API key** from your chosen provider — see the table in the [lesson's Step 5](../../docs/projects/rag-notes/index.md#step-5-generate-an-answer-with-a-free-llm) for where to get one.
2. **Copy `.env.example` to `.env`** and fill in the key for your provider:
   ```bash
   cp .env.example .env
   # then edit .env
   ```
   `.env` is already gitignored — never commit a real key.
3. **Run it**:
   ```bash
   uv run python ask.py "What is this course about?"
   ```

`uv` reads `pyproject.toml`/`uv.lock` and creates an isolated environment for this project automatically on first run.

### Using your own notes

Replace the files in `notes/` with your own `.md`/`.txt` files, then re-run `uv run python build_index.py` — the index only updates when you explicitly rebuild it.

## Running it in GitHub Codespaces

Click the badge above, or go to the [repo's Codespaces page](https://github.com/abderrahim-lectures/python-data-analysis-course), for a ready-to-go cloud dev environment (Node + Python + `uv` preinstalled via [`.devcontainer/devcontainer.json`](../../.devcontainer/devcontainer.json)). Once it's open:

```bash
cd examples/rag-notes
uv run python build_index.py
uv run python ask.py "What is this course about?"
```

(add your API key as a [Codespaces secret](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-encrypted-secrets-for-your-repository-and-organization#adding-secrets-for-a-repository) or `export` it for a one-off session before running `ask.py`).

## A note on staying current

Model names and library APIs in this space change fast. `all-MiniLM-L6-v2` and the GitHub Models endpoint used here were both verified working while writing this example, but may have drifted by the time you read this — see the callout in the [lesson](../../docs/projects/rag-notes/index.md#step-5-generate-an-answer-with-a-free-llm) for what to check before relying on this code.

## Built your own RAG app?

See [`examples/student-projects/`](../student-projects/) for how to share it with the class via a pull request — no git experience required, it walks through every step.
