---
title: "Scrape and Analyze a Live Website"
description: "Scrape real web data, clean it with pandas, and produce charts, no API key needed."
difficulty: "intermediate"
estimatedMinutes: 60
xpReward: 50
tags: ["Web Scraping", "pandas", "matplotlib", "data-analysis"]
prerequisites: ["Python basics", "Basic pandas", "Basic matplotlib"]
---

# Scrape and Analyze a Live Website

Every dataset so far arrived as a ready-made CSV. Real analysis rarely starts there. This project teaches you to fetch a live web page over HTTP, parse the HTML into structured rows, clean the result with pandas, and produce charts, no API key, no external service, just your script and a server.

- **Run it in your browser.** An interactive companion notebook is ready, open it in Colab, Kaggle, or Binder and follow along top-to-bottom.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/scrape-analyze/notebook.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/scrape-analyze/notebook.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fscrape-analyze%2Fnotebook.ipynb)

## What You'll Learn

1. Fetch web pages with `requests`
2. Parse HTML with `BeautifulSoup`
3. Handle pagination across multiple pages
4. Clean scraped data with `pandas`
5. Create visualizations from real data
6. Handle common scraping challenges (encoding, rate limits, broken selectors)

## What You'll Build

A scraper that:

- Fetches a real webpage over HTTP
- Parses HTML tables and lists into structured data
- Follows "Next" links to collect all pages
- Cleans and transforms data with pandas
- Generates charts and summary statistics
- Exports results to CSV

## Setup

### Install `uv`

`uv` manages Python versions and project dependencies in one tool.

**macOS / Linux:**

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows (PowerShell):**

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Close and reopen your terminal, then confirm:

```bash
uv --version
```

### Create the project

```bash
uv init scrape-analyze
cd scrape-analyze
uv add requests beautifulsoup4 pandas matplotlib
```

No API key. No free-tier signup. Just your script and a real website.

---

## Step 1: Fetch a Web Page

### Objective

Make an HTTP request to a live website and receive its raw HTML content.

### Explanation

An HTTP `GET` request is the same thing your browser does every time you visit a page, it asks a server for a URL and gets back raw HTML as text. The `requests` library makes this straightforward in Python. We target [quotes.toscrape.com](https://quotes.toscrape.com), a site built specifically for scraping practice: no login wall, no rate limiting, stable HTML structure.

:::tip[Always check robots.txt before scraping anywhere else]
Before pointing this code at any site other than quotes.toscrape.com, check that site's `robots.txt` (e.g. `https://example.com/robots.txt`) and terms of service. Respecting `robots.txt` is the baseline expectation for any scraper.
:::

### Starter Hint

`requests.get(url)` performs the HTTP request. Call `.raise_for_status()` immediately after to turn a 404 or 500 into a loud exception instead of letting broken content silently flow into your parser.

### Working Code

```python
# scrape.py
import requests

response = requests.get("https://quotes.toscrape.com/")
response.raise_for_status()  # turns a 404/500 into a loud exception
html = response.text

print(f"Fetched {len(html)} characters")
print(html[:100])
```

Run it:

```bash
uv run python scrape.py
```

### Expected Output

```
Fetched 12345 characters
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
```

The exact character count varies, but `html` should be a long string starting with `<!DOCTYPE html>`.

### Troubleshooting

| Problem | Fix |
|---|---|
| `ConnectionError` | You're offline or the URL is wrong. Check your internet and the URL spelling. |
| `HTTPError 404` | The URL path is wrong, use exactly `https://quotes.toscrape.com/` |
| `HTTPError 403` | Some sites block requests without a browser User-Agent header. Add one: `requests.get(url, headers={"User-Agent": "Mozilla/5.0"})` |

### Checklist

- [ ] `uv run python scrape.py` runs without errors
- [ ] Output shows a character count in the thousands
- [ ] The first 100 characters start with `<!DOCTYPE html>`

### Socratic Question

What happens if you skip `raise_for_status()` and the server returns a 404? How would the error surface later in your pipeline, and why is that harder to debug?

---

## Step 2: Parse HTML Content

### Objective

Turn raw HTML text into a navigable tree and extract structured data from it.

### Explanation

That `html` string is a tree of nested tags, `<div>`, `<span>`, `<a>`, each optionally carrying attributes like `class` or `href`. BeautifulSoup parses that text into a tree and gives you `find` (first match) and `find_all` (every match), both filterable by tag name and attributes.

Open the page in your browser's "View Page Source" and you'll see: each quote sits inside `<div class="quote">`, the text is in `<span class="text">`, the author in `<small class="author">`, and tags in `<a class="tag">`.

### Starter Hint

`find_all("div", class_="quote")` returns one BeautifulSoup tag per quote. Inside each, `find` and `find_all` narrow to the fields you need, and `.get_text(strip=True)` pulls out clean text.

### Working Code

```python
# scrape.py
import requests
from bs4 import BeautifulSoup

response = requests.get("https://quotes.toscrape.com/")
response.raise_for_status()
soup = BeautifulSoup(response.text, "html.parser")

for quote_div in soup.find_all("div", class_="quote"):
    text = quote_div.find("span", class_="text").get_text(strip=True)
    author = quote_div.find("small", class_="author").get_text(strip=True)
    tags = [tag.get_text(strip=True) for tag in quote_div.find_all("a", class_="tag")]
    print(f"{author}: {text} {tags}")
```

```bash
uv run python scrape.py
```

### Expected Output

Ten lines, one per quote on the front page:

```
Albert Einstein: "Life is like riding a bicycle..." ['change', 'deep-thoughts', 'thinking', 'world']
J.K. Rowling: "It is our choices..." ['abilities', 'choices', 'deep-thoughts', 'flying', 'harry-potter']
...
```

### Troubleshooting

| Problem | Fix |
|---|---|
| `AttributeError: 'NoneType' has no attribute 'get_text'` | `find(...)` returned `None`, the class name doesn't match. Re-check "View Page Source" for exact class names. |
| Fewer than 10 lines printed | The CSS class filter is too narrow or misspelled. Verify `class_="quote"` matches the actual HTML. |
| Output shows garbled characters | Encoding issue. Try `soup = BeautifulSoup(response.content, "html.parser")` instead of `response.text`. |

### Checklist

- [ ] `uv run python scrape.py` runs without errors
- [ ] Exactly 10 lines are printed, one per quote
- [ ] Each line has real text, a real author name, and a non-empty list of tags

### Socratic Question

`.get_text(strip=True)` and `.text` both return a tag's text content, but only one strips whitespace. What would break later if you used `.text` everywhere instead? Think about string comparisons and `groupby` operations.

---

## Step 3: Extract Structured Data

### Objective

Turn the per-page parsing into a reusable function, follow pagination across all pages, and save results to CSV.

### Explanation

quotes.toscrape.com spreads quotes across 10 pages, with a "Next" link at the bottom of every page except the last. Rather than hardcode "loop 10 times," follow the link itself, that way the script works even if the page count changes. Two sub-steps: wrap Step 2's loop in a function, then follow links until there are no more.

### Starter Hint

The loop structure: `while url is not None:`, fetch and parse each page, then check for `<li class="next">`. Its presence or absence is your continue/stop signal.

### Working Code

```python
# scrape.py
import csv
import time

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://quotes.toscrape.com"


def parse_quotes(soup):
    """Extract {"text", "author", "tags"} for every quote on one parsed page."""
    quotes = []
    for quote_div in soup.find_all("div", class_="quote"):
        text = quote_div.find("span", class_="text").get_text(strip=True)
        author = quote_div.find("small", class_="author").get_text(strip=True)
        tags = [t.get_text(strip=True) for t in quote_div.find_all("a", class_="tag")]
        quotes.append({"text": text, "author": author, "tags": ", ".join(tags)})
    return quotes


def scrape_all_quotes():
    all_quotes = []
    url = f"{BASE_URL}/"

    while url is not None:
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
        except requests.RequestException as exc:
            print(f"Failed to fetch {url}: {exc}. Stopping here.")
            break

        soup = BeautifulSoup(response.text, "html.parser")
        all_quotes.extend(parse_quotes(soup))

        next_li = soup.find("li", class_="next")
        url = (
            requests.compat.urljoin(url, next_li.find("a")["href"])
            if next_li
            else None
        )
        if url is not None:
            time.sleep(1)  # rate-limit yourself even on a practice site

    return all_quotes


if __name__ == "__main__":
    quotes = scrape_all_quotes()
    with open("quotes.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["text", "author", "tags"])
        writer.writeheader()
        writer.writerows(quotes)
    print(f"Saved {len(quotes)} quotes to quotes.csv")
```

```bash
uv run python scrape.py
```

### Expected Output

```
Saved 100 quotes to quotes.csv
```

A real `quotes.csv` file appears with a header row plus one row per quote.

### Troubleshooting

| Problem | Fix |
|---|---|
| Only 10 quotes saved | The `next_li` URL isn't being followed. Check that `url = requests.compat.urljoin(...)` is inside the conditional, not resetting to the front page. |
| Script hangs or is slow | Expected, `time.sleep(1)` between ~10 pages means ~10 seconds total. |
| `Failed to fetch ... Stopping here` | A network glitch or timeout. The script saves what it has so far instead of crashing. |
| `quotes.csv` has blank rows | A `None` or empty string got into the quotes list. Check the `parse_quotes` function for missing `.get_text(strip=True)` calls. |

### Checklist

- [ ] `uv run python scrape.py` finishes and prints "Saved N quotes"
- [ ] `quotes.csv` exists with more than 10 rows (proves pagination worked)
- [ ] Opening `quotes.csv` shows three clean columns: `text`, `author`, `tags`

### Socratic Question

What would happen if the site's last page still had a "Next" link in its HTML but it wasn't clickable? How would you check for that before trusting this stopping condition on a different site?

---

## Step 4: Clean with pandas

### Objective

Load the scraped CSV into pandas and clean it for analysis.

### Explanation

Scraped data rarely arrives clean. The `tags` column is stored as one comma-joined string (CSV cells can't hold Python lists), and whitespace inconsistencies are common. Pandas' string and type-checking tools make cleaning fast to write and easy to verify.

### Starter Hint

Two sub-steps: split the packed `tags` column back into a real list, then run whitespace and dtype checks to catch problems early.

### Working Code

```python
# analyze.py
import pandas as pd

df = pd.read_csv("quotes.csv")

# Step 4a: Reconstruct the packed tags column
# tags was saved as "tag1, tag2, tag3" — split into a real list column
df["tags"] = df["tags"].fillna("").apply(
    lambda raw: [tag.strip() for tag in raw.split(",") if tag.strip()]
)

# Step 4b: Whitespace and dtype sanity checks
df["text"] = df["text"].str.strip()
df["author"] = df["author"].str.strip()
assert df["text"].notna().all(), "some quotes have no text — check the scrape"

df["quote_length"] = df["text"].str.len()

print(df.head())
print()
print(df.dtypes)
```

```bash
uv run python analyze.py
```

### Expected Output

```
                                                text           author  \
0  "Life is like riding a bicycle. To keep your ba...  Albert Einstein
1  "It is our choices, Harry, that show what we tr...     J.K. Rowling
2  "Only two things are infinite, the universe and...  Albert Einstein
3  "The person, as well as the artist, strives for...  Albert Einstein
4  "Imagination is more important than knowledge. ...  Albert Einstein

                               tags  quote_length
0  [change, deep-thoughts, thinking, world]           123
1  [abilities, choices, deep-thoughts, flying, ...           106
2  [humor, infinite, universe]            89
3  [fake, inspectors, life, real]           93
4  [creativity, humor, imagination, life]           107

         text   author    tags  quote_length
0     object   object  object         int64
```

### Troubleshooting

| Problem | Fix |
|---|---|
| `AttributeError: 'float' has no attribute 'split'` | A `NaN` slipped through. Confirm `.fillna("")` ran before `.apply`. |
| `df["tags"]` still holds strings | The `.apply` result wasn't assigned back. Check you didn't drop the `df["tags"] =` prefix. |
| `AssertionError: some quotes have no text` | Something upstream saved a row with missing text. Inspect `quotes.csv` directly for blank `text` cells. |
| `quote_length` shows `object` dtype | `.str.len()` was called on the wrong column or before stripping. Verify it's on the already-stripped `df["text"]`. |

### Checklist

- [ ] `type(df["tags"].iloc[0])` prints `<class 'list'>`, not `str`
- [ ] `df["quote_length"]` is a numeric column with no missing values
- [ ] `df.head()` shows clean text with no stray leading/trailing whitespace

### Socratic Question

If one row's `tags` cell were empty (a quote with no tags), what would `raw.split(",")` return? Does the `if tag.strip()` filter handle that case correctly? Test it.

---

## Step 5: Analyze and Visualize

### Objective

Produce charts and summary statistics from the cleaned data.

### Explanation

With clean, typed columns, analysis is a few lines of `groupby` / `value_counts`, the same pattern from pandas notebooks, just pointed at data you fetched yourself. Three charts: most common tags, most-quoted authors, and quote-length distribution.

### Starter Hint

Three sub-steps, one per chart. Use `explode` for the tags column (one row per tag), `value_counts` for categorical counts, and `hist` for the numeric distribution.

### Working Code

```python
# analyze.py (continued)
import matplotlib.pyplot as plt
import pandas as pd

df = pd.read_csv("quotes.csv")

# Clean (same as Step 4)
df["tags"] = df["tags"].fillna("").apply(
    lambda raw: [tag.strip() for tag in raw.split(",") if tag.strip()]
)
df["text"] = df["text"].str.strip()
df["author"] = df["author"].str.strip()
df["quote_length"] = df["text"].str.len()

# Chart 1: Top 10 tags
exploded = df.explode("tags")
exploded = exploded[exploded["tags"] != ""]
tag_counts = exploded["tags"].value_counts().head(10)

fig, ax = plt.subplots(figsize=(8, 5))
tag_counts.sort_values().plot(kind="barh", ax=ax, color="#3b82f6")
ax.set_xlabel("Number of quotes")
ax.set_ylabel("Tag")
ax.set_title("Top 10 tags on quotes.toscrape.com")
ax.set_xlim(left=0)
fig.tight_layout()
fig.savefig("top_tags.png")
plt.close()

# Chart 2: Most-quoted authors
most_quoted = df["author"].value_counts().head(5)
print("Most-quoted authors:")
print(most_quoted)

# Chart 3: Quote-length distribution
fig, ax = plt.subplots(figsize=(8, 5))
ax.hist(df["quote_length"], bins=20, color="#3b82f6", edgecolor="white")
ax.set_xlabel("Quote length (characters)")
ax.set_ylabel("Number of quotes")
ax.set_title("Distribution of quote lengths")
fig.tight_layout()
fig.savefig("quote_length_dist.png")
plt.close()

print("\nSaved top_tags.png and quote_length_dist.png")
```

```bash
uv run python analyze.py
```

### Expected Output

```
Most-quoted authors:
author
Albert Einstein    10
André Gide          5
J.K. Rowling        3
...
dtype: int64

Saved top_tags.png and quote_length_dist.png
```

Two image files appear: `top_tags.png` (horizontal bar chart, longest bar at top, x-axis starting at 0) and `quote_length_dist.png` (histogram with a real shape, most quotes clustered in the low hundreds of characters).

### Troubleshooting

| Problem | Fix |
|---|---|
| Empty or all-zero bar chart | `exploded["tags"] != ""` filtered out everything. Check that Step 4's list-building actually dropped empty strings. |
| X-axis doesn't start at 0 | The `ax.set_xlim(left=0)` line was dropped. |
| Histogram is one solid bar | `quote_length` has no variation. Re-check that it was computed from stripped `text`. |
| `top_tags.png` doesn't save | Confirm `fig.savefig(...)` is called on the same `fig` object `plt.subplots()` returned. |
| Bars look reasonable but differ from expected | The dataset is live, counts change as the source site updates. |

### Checklist

- [ ] `top_tags.png` and `quote_length_dist.png` both exist and open as real images
- [ ] The bar chart's x-axis starts at 0
- [ ] Both charts have a title and labeled axes
- [ ] The histogram shows a real distribution shape, not a single flat bar

### Socratic Question

If you set the bar chart's `ax.set_xlim(left=5)` instead of `0`, how would the visual difference between the top and tenth tag change, even though the underlying counts haven't changed at all?

---

## Step 6: Export Results

### Objective

Save the cleaned, analysis-ready dataset for reuse.

### Explanation

CSV is the simplest interchange format, but the cleaned version (with real list columns) doesn't serialize cleanly. Two approaches: export a flat version for spreadsheet use, or use JSON to preserve the lists.

### Working Code

```python
# analyze.py (continued)

# Flat CSV: tags joined back to a string for spreadsheet compatibility
df["tags_flat"] = df["tags"].apply(lambda t: ", ".join(t))
df[["text", "author", "tags_flat", "quote_length"]].to_csv(
    "quotes_clean.csv", index=False
)
print(f"Saved quotes_clean.csv with {len(df)} rows")

# JSON: preserves list structure
df.to_json("quotes_clean.json", orient="records", indent=2)
print("Saved quotes_clean.json")
```

### Expected Output

```
Saved quotes_clean.csv with 100 rows
Saved quotes_clean.json
```

Two new files: `quotes_clean.csv` (flat, spreadsheet-friendly) and `quotes_clean.json` (preserves tag lists as arrays).

### Checklist

- [ ] `quotes_clean.csv` exists and opens in a spreadsheet or text editor
- [ ] `quotes_clean.json` contains valid JSON with arrays for the `tags` field

### Socratic Question

Why does the CSV export need `tags_flat` (a string) instead of writing the list directly? What format is naturally suited to nested data like lists-of-strings, and what tradeoffs does each format carry?

---

## Challenges

Once the basic pipeline works, try these extensions:

### Challenge 1: Extract author pages

Each author name on quotes.toscrape.com links to a bio page with a birth date and birthplace. Extend `parse_quotes` to follow each author link, fetch the bio page, and add `birth_date` and `birthplace` columns to the DataFrame. This introduces relative URL resolution and multi-level page traversal.

### Challenge 2: Scrape a table-based site

Target a site with HTML `<table>` elements instead of `<div>` cards, for example, a Wikipedia comparison table. Use BeautifulSoup to find `<tr>` and `<td>` tags, then feed the rows into a DataFrame with `pd.DataFrame(rows, columns=headers)`. The parsing logic changes, but the fetch-clean-analyze pipeline stays the same.

### Challenge 3: Add rate limiting and retry logic

Replace the fixed `time.sleep(1)` with exponential backoff: on a failed request, wait 1 second, then 2, then 4, up to a maximum. Combine this with `requests.adapters.HTTPAdapter` for automatic retries. This is the pattern production scrapers use.

### Challenge 4: Visualize trends over time

If you've run the scraper multiple times with timestamps, plot how tag popularity or author counts change across runs. Use `matplotlib` with multiple lines or a stacked area chart.

---

## What You Learned

1. **HTTP requests**, `requests.get()` with `raise_for_status()` and timeouts for robust fetching
2. **HTML parsing**, `BeautifulSoup` with `find` / `find_all` and CSS class selectors
3. **Pagination**, following "Next" links with `urljoin` instead of hardcoding page counts
4. **Error handling**, `try`/`except` around network calls to preserve partial progress
5. **Data cleaning**, splitting packed columns, stripping whitespace, asserting invariants
6. **Visualization**, bar charts, histograms, and the honesty rules (labeled axes, x-axis at 0, descriptive titles)
7. **Scraping etiquette**, rate limiting with `sleep`, respecting `robots.txt`

The pipeline generalizes: swap in a different scraping-friendly site, and the same five steps, request, parse, follow pagination, clean, chart, are still the whole pipeline.

## Where to Go From Here

- **Different sites**, read each site's `robots.txt` and terms of service first; every site's HTML is different, so you'll need to inspect its markup yourself
- **SQLite**, replace CSV with Python's built-in `sqlite3` module once data outgrows a single file
- **Scheduling**, run the scraper periodically with cron or a loop, appending a timestamp column to track how data changes over time
- **Scrapy**, a full framework for large-scale scraping with built-in concurrency, middleware, and export pipelines

---

## Share Your Project

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted. Its README has a beginner-friendly walkthrough for adding yours via a pull request, forking the repo, making a branch, committing, and opening the PR. No prior git experience required.
