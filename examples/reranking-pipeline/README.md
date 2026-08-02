# Re-Ranking Pipeline Example

The local companion to the course's [Build a Re-Ranking Pipeline](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/docs/projects/reranking-pipeline) project — a real, runnable two-stage retrieval pipeline that makes the compute/quality tradeoff of re-ranking visible.

## What's here

- `main.py` — the whole pipeline in one CLI:
  - **Stage 1 (fast):** a pure-Python keyword-overlap scorer. Tokenizes the query, drops stopwords, and counts how much each document's words overlap with it. Milliseconds per query, no model, no download.
  - **Stage 2 (accurate):** a sentence-transformers `CrossEncoder` (`cross-encoder/ms-marco-MiniLM-L-6-v2`) that reads each (query, document) *pair* together and re-scores just the top-K shortlist.
  - A benchmark that runs the same test queries through both pipelines and prints `precision@1`, `precision@3`, and average time per query side by side.
- `data/corpus/*.txt` — 25 short passages on varied topics, with deliberate "same word, different meaning" traps (Python the language vs. the snake, Mercury the planet vs. the god vs. the metal, a river bank vs. a money bank, ...) so the fast stage makes plausible-but-wrong top picks that the cross-encoder corrects.
- `data/test_queries.json` — 12 test queries, each labeled with the relevant passage id, used by the benchmark.
- `notebook.ipynb` — the same walkthrough as a self-contained notebook for Colab, Kaggle, or Binder (the corpus is embedded inline).

**No API key, no `.env`, no LLM.** The only download is the cross-encoder model (~80MB) on its first run — it's a local model that scores query–document pairs on your own CPU.

## How to run this

```bash
uv run python main.py            # benchmark: fast-only vs fast + re-rank
uv run python main.py --query "what metal is liquid at room temperature"
uv run python main.py --top-k 8  # hand the re-ranker a bigger shortlist
```

The first run downloads and caches the cross-encoder (~80MB) and then prints the benchmark. Later runs skip the download.

`uv run` reads `pyproject.toml`/`uv.lock` and creates an isolated environment for this project automatically on first run — no manual virtual environment setup needed.

## Project layout

```
reranking-pipeline/
├── main.py                  # the pipeline + CLI + benchmark
├── data/
│   ├── corpus/*.txt         # 25 short passages to search over
│   └── test_queries.json    # benchmark queries with ground-truth relevance
├── notebook.ipynb           # hosted-notebook version (corpus embedded inline)
├── pyproject.toml           # project metadata + deps
└── uv.lock                  # pinned dependency lockfile
```

## A note on what re-ranking can and can't do

Re-ranking only re-scores the top-K the fast stage already retrieved. If the right document never makes it into that shortlist, no re-ranker can save it — which is exactly why production systems tune their first stage too. What re-ranking *does* fix is the ordering: a correct-but-under-ranked hit (say, Jupiter ranked 2nd by "biggest planet" because a naive stage can't tell "biggest" and "smallest" apart) gets promoted to the top. The benchmark is honest about this — run it and compare.

## Built your own version?

See [`examples/student-projects/`](../student-projects/) for how to share it with the class via a pull request — no git experience required, it walks through every step.
