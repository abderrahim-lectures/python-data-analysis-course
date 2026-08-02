# Semantic Bookmark Search Example

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)

The local companion to the course's [Build Semantic Search Over Your Browser Bookmarks](../../docs/projects/bookmarks-semantic-search/index.md) project — parse a standard Netscape bookmarks export, embed every bookmark locally, and search by *meaning* instead of guessing the title.

## What's here

- `parse_bookmarks.py` — parses a Netscape-format bookmarks HTML export (the format Chrome/Firefox/Edge all export) into records of `title`, `url`, and `folder` path, using only the standard library's `html.parser` — [Step 1](../../docs/projects/bookmarks-semantic-search/index.md#step-1-parse-the-export-into-records).
- `build_index.py` — embeds every bookmark title locally with `sentence-transformers` and saves the vectors (`index.npy`) and records (`records.json`) — [Step 2](../../docs/projects/bookmarks-semantic-search/index.md#step-2-build-a-searchable-index).
- `search.py` — `search(query, top_k)`: ranks bookmarks against a natural-language query using NumPy cosine similarity — [Step 3](../../docs/projects/bookmarks-semantic-search/index.md#step-3-search-by-meaning).
- `compare.py` — runs the same query through a simple keyword ranker and the semantic search side by side, so you can see where each wins — [Step 4](../../docs/projects/bookmarks-semantic-search/index.md#step-4-compare-against-keyword-search).
- `sample_bookmarks.html` — a small, realistic bookmarks export (ML, web dev, databases, productivity, news folders) so the pipeline runs out of the box with no setup.
- `notebook.ipynb` — a Colab/Kaggle/Binder-ready notebook that runs the whole pipeline over an embedded sample export. Launch it from the badges on the [lesson page](../../docs/projects/bookmarks-semantic-search/index.md#where-to-run-this), or open it directly: [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/bookmarks-semantic-search/notebook.ipynb) [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/bookmarks-semantic-search/notebook.ipynb) [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fbookmarks-semantic-search%2Fnotebook.ipynb)

## Running it

This project needs **no API key and no network access** — everything runs locally:

```bash
uv sync
uv run python parse_bookmarks.py sample_bookmarks.html   # parse the export
uv run python build_index.py sample_bookmarks.html       # embed locally
uv run python search.py "how do I split data into train and test sets"
uv run python compare.py "scikit learn train test split" # semantic vs keyword
```

`uv` reads `pyproject.toml`/`uv.lock` and creates an isolated environment for this project automatically on first run.

### Using your own bookmarks

1. **Export your bookmarks to HTML** from your browser (Chrome/Edge: `⋮` → Bookmarks → Bookmark manager → `⋮` → Export bookmarks; Firefox: Library → Bookmarks → Import and Backup → Export bookmarks to HTML).
2. Run the same three commands with your export file instead of `sample_bookmarks.html`:
   ```bash
   uv run python parse_bookmarks.py /path/to/your/bookmarks.html
   uv run python build_index.py /path/to/your/bookmarks.html
   uv run python search.py "the page about the thing I forgot"
   ```

Save new bookmarks? Re-export the HTML and re-run `build_index.py` — the index is a snapshot, not a live view.

## Running it in GitHub Codespaces

Click the badge above, or go to the [repo's Codespaces page](https://github.com/abderrahim-lectures/python-data-analysis-course), for a ready-to-go cloud dev environment (Node + Python + `uv` preinstalled via [`.devcontainer/devcontainer.json`](../../.devcontainer/devcontainer.json)). Once it's open:

```bash
cd examples/bookmarks-semantic-search
uv run python build_index.py sample_bookmarks.html
uv run python search.py "train test split"
```

Your own bookmarks live on your own machine, so in a Codespace you'll be searching the bundled sample — perfect for trying the pipeline, less useful for finding your own lost pages.

## A note on staying current

Model names and library APIs in this space change fast. `all-MiniLM-L6-v2` was verified working while writing this example, but may have drifted by the time you read it — the embedding call is the only moving part, so if a version error appears, pinning a newer `sentence-transformers` release is usually enough.

## Built your own search tool?

See [`examples/student-projects/`](../student-projects/) for how to share it with the class via a pull request — no git experience required, it walks through every step.
