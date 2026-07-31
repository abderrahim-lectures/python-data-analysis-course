# Job-Listing Aggregator Example

The local companion to the course's [Build a Job-Listing Aggregator](../../docs/projects/job-aggregator/index.md) project — a real, runnable scraper, dedupe, and keyword-alert pipeline over a small bundled sample dataset of "job board" HTML pages.

## What's here

- `sample_data/board_alpha.html`, `board_beta.html`, `board_gamma.html` — three static HTML pages styled like three different job boards, each with its own HTML structure (cards, a list, a table). Ten listings total, two of them posted to more than one board on purpose, so there's something real to dedupe. See the lesson for why this project uses bundled sample HTML instead of a live site.
- `aggregate.py` — a small parser function per board (Steps 1-2 of the lesson), combining all three into one table and writing `listings.csv`.
- `filter_alerts.py` — loads `listings.csv`, dedupes with pandas (Step 3), filters by keyword, and diffs against a `seen.json` file of previously-alerted jobs to print only *new* matches (Step 4), saving them to `new_matches.csv`.
- `notebook.ipynb` — the same pipeline as one Colab/Kaggle/Binder-friendly notebook.

Nothing here needs an API key, a free-tier signup, or a live network connection — just `beautifulsoup4` and `pandas`, running entirely on your own machine against the bundled HTML.

## How to run this

```bash
uv run python aggregate.py
uv run python filter_alerts.py
```

`uv run` reads `pyproject.toml`/`uv.lock` and creates an isolated environment for this project automatically on first run — no manual virtual environment setup needed. `aggregate.py` must run first; `filter_alerts.py` reads the `listings.csv` it produces.

Run `filter_alerts.py` a second time without changing anything and it will report zero new matches — `seen.json` remembers what it already alerted on, the same way a real scheduled aggregator would.

See the full [Build a Job-Listing Aggregator lesson](../../docs/projects/job-aggregator/index.md) for the step-by-step walkthrough, including how the dedupe key is chosen and how to extend this to a real, live source.

## Built your own aggregator?

See [`examples/student-projects/`](../student-projects/) for how to share it with the class via a pull request — no git experience required, it walks through every step.
