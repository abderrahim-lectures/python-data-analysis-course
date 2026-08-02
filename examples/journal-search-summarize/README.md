# Journal Search-and-Summarize Example

The local companion to the course's [Search and Summarize Your Own Journal](../../docs/projects/journal-search-summarize/index.md) project — a real CLI that indexes a folder of dated Markdown journal entries with local embeddings, lets you search them semantically, and summarizes a date range with your choice of free-tier LLM.

## What's here

- `data/journal/` — twelve short, realistic dated journal entries (one `YYYY-MM-DD.md` file per day, spanning July 6–22, 2026), so the tool runs out of the box with no setup.
- `data/sample_queries.json` — six example queries with notes on which entries hold the ground truth, for the lesson's end-to-end step.
- `main.py` — a single-file CLI with three commands:
  - `index` — embeds every entry locally with `sentence-transformers` and saves the vectors (`data/index.npy`) and entry text (`data/chunks.json`) — no API key needed.
  - `search "<query>"` — finds the entries most relevant to a question using NumPy cosine similarity, and prints each with a score, its date, and a snippet.
  - `summarize START END` — sends every entry in the date range to a free-tier LLM and prints a **dated summary**: one bullet per event, each starting with the date it came from, plus an audit trail that maps every cited date back to its source file.
- `notebook.ipynb` — a Colab/Kaggle/Binder-ready notebook that mirrors the same tool end to end, with the sample journal embedded directly in it (no local files needed). Launch it from the badges on the [lesson page](../../docs/projects/journal-search-summarize/index.md#where-to-run-this).

## Running it

```bash
uv sync
uv run python main.py index                 # embeds data/journal/ -- no API key, runs locally
uv run python main.py search "when did I last mention planning a trip?"
uv run python main.py search "running" --top-k 3
```

`index` and `search` are fully local and free. Only `summarize` calls a hosted language model, so it needs a free-tier API key:

1. **Get a free-tier API key** from your chosen provider — see the table in the [lesson's Setup section](../../docs/projects/journal-search-summarize/index.md#get-a-free-llm-api-key) for where to get one.
2. **Copy `.env.example` to `.env`** and fill in the key for your provider (and `LLM_PROVIDER` if you're not using the default):
   ```bash
   cp .env.example .env
   # then edit .env
   ```
   `.env` is already gitignored — never commit a real key.
3. **Run it**:
   ```bash
   uv run python main.py summarize 2026-07-06 2026-07-12
   uv run python main.py summarize 2026-07-13 2026-07-22 --provider groq
   ```

`uv` reads `pyproject.toml`/`uv.lock` and creates an isolated environment for this project automatically on first run.

### Using your own journal

Replace the files in `data/journal/` with your own `YYYY-MM-DD.md` files, then re-run `uv run python main.py index` — the index only updates when you explicitly rebuild it.

### Browsing the bundled sample queries

```bash
uv run python main.py search "what did I do for my mother's birthday?"
uv run python main.py search "when are my friends and I going to Chefchaouen?"
```

Each entry in `data/sample_queries.json` has a `note` naming the entries that hold the answer, so you can check whether search actually found them.

## Running it in GitHub Codespaces

Click the badge above, or go to the [repo's Codespaces page](https://github.com/abderrahim-lectures/python-data-analysis-course), for a ready-to-go cloud dev environment (Node + Python + `uv` preinstalled via [`.devcontainer/devcontainer.json`](../../.devcontainer/devcontainer.json)). Once it's open:

```bash
cd examples/journal-search-summarize
uv run python main.py index
uv run python main.py search "what is the finance tracker project about?"
```

(add your API key as a [Codespaces secret](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-encrypted-secrets-for-your-repository-and-organization#adding-secrets-for-a-repository) or `export` it for a one-off session before running `summarize`).

## A note on staying current

Model names and library APIs in this space change fast. `all-MiniLM-L6-v2` and the free-tier endpoints used here were both verified working while writing this example, but may have drifted by the time you read this — see the callout in the [lesson](../../docs/projects/journal-search-summarize/index.md) for what to check before relying on this code.

## Built your own version?

See [`examples/student-projects/`](../student-projects/) for how to share it with the class via a pull request — no git experience required, it walks through every step.
