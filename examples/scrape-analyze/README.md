# Scrape and Analyze a Live Website Example

The local companion to the course's [Scrape and Analyze a Live Website](../../docs/projects/scrape-analyze/index.md) project — a real, runnable scraper and analysis pipeline targeting [quotes.toscrape.com](https://quotes.toscrape.com), a public site built specifically for scraping practice.

## What's here

- `scrape.py` — fetches every page of quotes.toscrape.com (following its "Next" links), parses out each quote's text, author, and tags with BeautifulSoup, and writes the results to `quotes.csv`. Sleeps briefly between requests — see the lesson for why.
- `analyze.py` — loads `quotes.csv` with pandas, cleans it (splits the tags string, strips whitespace, checks dtypes), prints a short summary (most common tags, most-quoted authors, average quote length), and saves two charts: `top_tags.png` and `quote_length_dist.png`.

Neither script needs an API key, a free-tier signup, or any paid service — just `requests`, `beautifulsoup4`, `pandas`, and `matplotlib`, all free and running entirely on your own machine.

## How to run this

```bash
uv run python scrape.py
uv run python analyze.py
```

`uv run` reads `pyproject.toml`/`uv.lock` and creates an isolated environment for this project automatically on first run — no manual virtual environment setup needed. `scrape.py` must run first; `analyze.py` reads the `quotes.csv` it produces.

See the full [Scrape and Analyze a Live Website lesson](../../docs/projects/scrape-analyze/index.md) for the step-by-step walkthrough, including what each part of the scraper does and how to read the resulting charts.

## Built your own scraper?

See [`examples/student-projects/`](../student-projects/) for how to share it with the class via a pull request — no git experience required, it walks through every step.
