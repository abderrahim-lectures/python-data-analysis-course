# Hybrid Search Demo Example

The local companion to the course's [Build a Hybrid Search Demo (Keyword + Embedding)](../../docs/projects/hybrid-search/index.md) project — a small CLI that runs **keyword** (a from-scratch BM25-style scorer), **embedding** (local `sentence-transformers`), and **hybrid** retrieval side by side over the same tiny corpus, so you can see where each approach wins and loses.

No LLM, no API key, no `.env` — the only download is the small local embedding model, which `sentence-transformers` fetches on first run.

<!-- TODO: update these badge links to point at main once this PR merges -->
[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/hybrid-search/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/hybrid-search/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fhybrid-search%2Fnotebook.ipynb)

## What's here

- `main.py` — a single-file CLI with the three retrievers:
  - `KeywordScorer` — a small BM25-style lexical scorer built from scratch (idf + term-frequency saturation), so you can read every line of the math instead of trusting a library.
  - `semantic_scores()` — local embeddings via `all-MiniLM-L6-v2` (384-dim), ranked by cosine similarity.
  - `hybrid_scores()` — min-max-normalized keyword and semantic scores combined with a configurable `--alpha` weight.
- `data/corpus/` — eleven short `.txt` passages on a mix of topics (Neptune, espresso, deep sea, piano, cycling, sourdough, ...), deliberately written so **keyword and semantic retrieval disagree**: each "paraphrase" passage expresses the same idea as its neighbor without sharing its vocabulary.
- `data/test_queries.json` — ten test queries, each with the document that *should* rank first and a note on whether it's an exact-match or a paraphrase query.
- `notebook.ipynb` — the same comparison as a self-contained notebook (the corpus is embedded inline, so nothing needs downloading beyond the packages and the model). Click a badge above to run it in Colab, Kaggle, or Binder with no local setup.

## How to run this

```bash
# Build the embedding index once (downloads all-MiniLM-L6-v2 on first run)
uv run python main.py --build

# Compare all three methods on a single query
uv run python main.py "Neptune planet winds"

# Run the bundled test queries and print the per-method winners table
uv run python main.py --evaluate
```

Other things to try:

```bash
# Show more hits per method, and shift the hybrid blend toward keyword
uv run python main.py "grand piano sustain pedal" --top-k 5 --alpha 0.7

# Reuse an existing data/index.npy instead of re-embedding on every run
uv run python main.py "bicycle hill climbing gears" --reuse-index
```

`uv run` reads `pyproject.toml`/`uv.lock` and creates an isolated environment for this project automatically on first run — no manual virtual environment setup needed.

## What the output means

For each query you get three small tables (keyword / semantic / hybrid), each showing the top hits with a score. The `--evaluate` winners table then counts, across all test queries, how often each method put the *expected* document at rank 1 — in this bundled corpus keyword wins the exact-match queries, embeddings win the paraphrase queries, and hybrid inherits both. That's the honest takeaway: **there is no single "best" retriever** — it depends on the query, and on your corpus.

See the full [Build a Hybrid Search Demo lesson](../../docs/projects/hybrid-search/index.md) for the step-by-step walkthrough, including the BM25 math and how the scores get combined.

## Built your own version?

See [`examples/student-projects/`](../student-projects/) for how to share it with the class via a pull request — no git experience required, it walks through every step.
