---
title: "Scrape and Analyze a Live Website"
slug: /projects/scrape-analyze
description: "Graduate from the in-browser playground to real Python: scrape a real website, clean the data with pandas, and produce your own charts — no API key needed."
---

# 🕷️ Scrape and Analyze a Live Website

Every dataset in the Data Analysis section so far arrived as a ready-made CSV, already sitting in `static/datasets/`, waiting to be loaded with `pd.read_csv`. Real analysis rarely starts there — usually you have to go get the data yourself. This project is that step: fetch a real, live web page over HTTP, parse the HTML into structured rows, clean the result with pandas, and produce your own small analysis with charts. It assumes Data Analysis Normal-track-level pandas comfort — selection, filtering, `groupby`, basic cleaning — the same skills you already used to reproduce a guided EDA notebook. This project asks you to point those same skills at data nobody handed you.

This is optional and ungraded. See [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Install `uv` and set up a local project.
2. Fetch a real web page with `requests` and parse its HTML with `beautifulsoup4`.
3. Follow pagination links to collect an entire site's worth of data into a CSV.
4. Load that CSV into pandas and clean it — splitting a packed string column, checking whitespace and dtypes.
5. Analyze the cleaned data and produce a couple of honest, properly labeled charts with `matplotlib`.

## Where to run this

**Locally with `uv`** is the path this lesson's steps follow, and the recommended one — it's real Python running on your own machine, the same "graduate to real Python" move as every other project in this section. The Setup section below walks through installing it.

**GitHub Codespaces** is a zero-setup alternative if you'd rather not install anything locally yet: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed, per the repo's `.devcontainer/devcontainer.json`) and run the exact same `uv` commands from a terminal in your browser tab.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/scrape-analyze/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/scrape-analyze/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fscrape-analyze%2Fnotebook.ipynb)

**Google Colab or Kaggle Notebooks** are a genuinely good fit for this particular project, not just a fallback — there's no local file server, no GPU, and no long-running process to manage, and inline chart output is exactly what a notebook does well. Click a badge above to open a ready-to-run notebook (`examples/scrape-analyze/notebook.ipynb`) with the same scraper and analysis already filled in — install cell, pagination-following scraper, pandas cleanup, and both charts, adapted to save `quotes.csv` to the notebook's working directory instead of your own machine. This is a comfortable, legitimate way to do this project end-to-end without leaving the browser.

## Setup

`uv` is a single tool that replaces the usual "install Python, then install pip, then install a virtual environment tool, then install packages" chain — it can install and manage Python versions itself, alongside your project's dependencies.

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Close and reopen your terminal, then confirm it installed:

```bash
uv --version
```

Then set up a local project:

```bash
uv init scrape-analyze
cd scrape-analyze
uv add requests beautifulsoup4 pandas matplotlib
```

Notice what's missing from that list: no API key, no free-tier signup, nothing to configure before you can run a single line of code — just your own script and a real website. That's a deliberate contrast with this section's AI-flavored projects, and one of the reasons scraping is a good next step to try.

## Step 1: Fetch and parse the page

This project targets [quotes.toscrape.com](https://quotes.toscrape.com) — a public site built and maintained specifically for scraping practice. It has no login wall, no rate limiting to fight, a stable, well-structured HTML layout, and pagination, tags, and author pages to work with. That matters: scraping a real commercial site raises real questions about its terms of service and `robots.txt` that this lesson deliberately sidesteps by using a site built for exactly this purpose.

:::tip[Always check robots.txt before scraping anywhere else]
Before pointing this code at any site other than quotes.toscrape.com, check that site's `robots.txt` (e.g. `https://example.com/robots.txt`) and terms of service. `robots.txt` states which parts of a site automated tools are and aren't allowed to fetch — respecting it is the baseline expectation for any scraper, and some sites explicitly forbid scraping in their terms even where `robots.txt` stays silent.
:::

An HTTP `GET` request is the same thing your browser does every time you visit a page — it asks a server for a URL and gets back the raw HTML as text. Two small sub-steps: fetch the raw HTML, then parse it into the fields you actually want.

### 1.1 Fetch the raw HTML

**👟 Starter hint:** `requests.get(url)` does the HTTP request; `.raise_for_status()` right after it turns a 404/500 into a loud exception instead of letting a broken page silently flow into the parser as if it were real content:

```python
import requests

response = requests.get("https://quotes.toscrape.com/")
response.raise_for_status()  # turns a 404/500 into a loud exception instead of a silent bad parse
html = response.text
```

**🎯 Expected output:** No visible output yet — `html` should be a long string starting with `<!DOCTYPE html>`. Check with `print(html[:100])` or `print(len(html))` (several thousand characters).

**🩹 If it's off:** A `ConnectionError` usually means you're offline, not a bug in this code. If `raise_for_status()` raises, check the URL for a typo — `quotes.toscrape.com` (not `.org` or missing the trailing content).

### 1.2 Parse it into quote, author, and tags

That `html` string is a tree of nested tags — `<div>`, `<span>`, `<a>` — each one optionally carrying attributes like `class` or `href`. BeautifulSoup parses that text into a navigable tree and gives you two main tools to search it: `find` (the first match) and `find_all` (every match), both filterable by tag name and by attributes like `class_`. Open the page's HTML in your browser's "View Page Source" and you'll see each quote sits inside a `<div class="quote">`, with the quote text in a `<span class="text">`, the author in a `<small class="author">`, and each tag in an `<a class="tag">`.

**👟 Starter hint:** `find_all("div", class_="quote")` gets you one BeautifulSoup tag per quote; inside each, `find("span", class_="text")` and `find("small", class_="author")` narrow to the two fields you need, and `.get_text(strip=True)` pulls out clean text:

```python
# scrape.py
import time

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

time.sleep(1)  # see the tip below
```

```bash
uv run python scrape.py
```

You should see ten printed lines, one per quote on the front page.

:::tip[Rate-limit yourself, even on a practice site]
`time.sleep(1)` between requests isn't strictly required by quotes.toscrape.com, but it's a habit worth building now rather than after you accidentally hammer a real server with dozens of requests per second. A short, deliberate delay between requests is standard scraping etiquette — it keeps your script from looking like (or acting like) a denial-of-service attempt, and it's cheap insurance against getting your IP temporarily blocked on sites that do enforce limits.
:::

**🎯 Expected output:** Ten lines, one per quote, each shaped like `Albert Einstein: "Life is like riding a bicycle..." ['change', 'deep-thoughts', 'thinking', 'world']`.

**🩹 If it's off:** An `AttributeError: 'NoneType' object has no attribute 'get_text'` means `find(...)` returned `None` — the class name you passed doesn't match anything on the page; re-check "View Page Source" for the exact current class names. Fewer than 10 lines usually means the CSS class filter is too narrow or slightly misspelled, not that the page has fewer quotes.

**✅ Checklist**

- ✅ `uv run python scrape.py` runs without errors.
- ✅ It prints exactly 10 lines, one per quote on the front page.
- ✅ Each printed line has real text, a real author name, and a non-empty list of tags — not `None` or empty strings.

**🤔 Socratic Question(s)**

- `.get_text(strip=True)` and `.text` both return a tag's text content, but only one of them strips leading/trailing whitespace. What would break later in this project — specifically in Step 3's cleaning step — if you used `.text` everywhere instead?
- The quote text on the page is wrapped in curly quotation marks (`"…"`), not straight ones. If you're comparing quote text against a hardcoded string later, what could go wrong, and how would you notice?

## Step 2: Handle pagination and collect all the data

quotes.toscrape.com spreads its quotes across multiple pages, with a "Next" link at the bottom of every page except the last. Rather than hardcode "loop 10 times," follow the link itself — that way the script keeps working even if the number of pages changes. Three sub-steps: turn Step 1's per-page loop into a reusable function, follow "Next" links across every page, then save the result to a CSV.

### 2.1 Turn the per-page parsing into a function

**👟 Starter hint:** Take the exact loop body from Step 1 and wrap it in a function that takes a parsed `soup` and returns a list of dicts — this is the same parsing logic, just reusable across however many pages you end up fetching:

```python
# scrape.py (continued)
import csv

BASE_URL = "https://quotes.toscrape.com"

def parse_quotes(soup):
    """Extracts {"text", "author", "tags"} for every quote on one parsed page."""
    quotes = []
    for quote_div in soup.find_all("div", class_="quote"):
        text = quote_div.find("span", class_="text").get_text(strip=True)
        author = quote_div.find("small", class_="author").get_text(strip=True)
        tags = [t.get_text(strip=True) for t in quote_div.find_all("a", class_="tag")]
        quotes.append({"text": text, "author": author, "tags": ", ".join(tags)})
    return quotes
```

**🎯 Expected output:** No output yet — this is a function definition. The check is that it matches Step 1's loop body exactly, just returning instead of printing.

**🩹 If it's off:** If you find yourself needing to re-check the class names, that's a sign you copied from memory instead of Step 1's working code — copy it directly to avoid reintroducing a typo you already fixed once.

### 2.2 Follow "Next" links across every page, then save

**👟 Starter hint:** Loop with `while url is not None:`, fetching and parsing each page, then look for `<li class="next">` — its presence (or absence) *is* your loop's continue/stop signal, no page-count needed:

```python
def scrape_all_quotes():
    all_quotes = []
    url = f"{BASE_URL}/"

    while url is not None:
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
        except requests.RequestException as exc:
            # One failed request shouldn't kill a scrape that already collected
            # data from several pages -- log it and stop cleanly instead of crashing.
            print(f"Failed to fetch {url}: {exc}. Stopping here.")
            break

        soup = BeautifulSoup(response.text, "html.parser")
        all_quotes.extend(parse_quotes(soup))

        next_li = soup.find("li", class_="next")
        url = requests.compat.urljoin(url, next_li.find("a")["href"]) if next_li else None
        if url is not None:
            time.sleep(1)

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

The `try`/`except` around the request is the important addition here, not a formality: without it, one flaky request on page 7 of 10 would throw an unhandled exception and lose the six pages already fetched, instead of saving what you have and stopping cleanly. `requests.compat.urljoin` turns the "Next" link's relative `href` (like `/page/2/`) into a full URL by combining it with the current page's URL — the same thing your browser does automatically when you click a relative link.

**🎯 Expected output:** `Saved N quotes to quotes.csv` where N is comfortably more than 10 (quotes.toscrape.com has 10 pages of 10 quotes each — expect around 100), and a real `quotes.csv` with a header row plus one row per quote.

**🩹 If it's off:** If the script only ever saves 10 quotes, `next_li` is being found but the URL isn't actually being followed — check that `url = requests.compat.urljoin(...)` is inside the `if next_li else None` branch, not accidentally always resetting to the front page. If it hangs or runs very slowly, that's the `time.sleep(1)` between every one of ~10 pages working as intended, not a bug — ~10 seconds total is expected.

**✅ Checklist**

- ✅ `uv run python scrape.py` finishes and prints a "Saved N quotes" line.
- ✅ `quotes.csv` exists and has more than 10 rows (i.e. it actually followed pagination, not just the front page).
- ✅ Opening `quotes.csv` in a text editor shows three columns — `text`, `author`, `tags` — with no obviously broken/empty rows.

**🤔 Socratic Question(s)**

- What would happen to your scraper if the site added a tenth field to each quote — say, a publication year? How would you notice, and how would you adapt `parse_quotes` to pick it up?
- The loop stops when `find("li", class_="next")` returns `None`. What would happen if the site's last page still had a (disabled-looking) "Next" link in its HTML, just not a clickable one? How would you check for that before trusting this stopping condition on a different site?

## Step 3: Clean and load into pandas

Section 2 introduced pandas as the fix for plain Python loops getting slow as data grows — vectorized operations in C instead of a Python `for` loop over every row. Scraped data adds a second, equally real reason to reach for it: it rarely arrives clean, and pandas' string and type-checking tools make cleaning it fast to write and easy to verify. Two sub-steps: reconstruct the packed tags column, then run whitespace/dtype sanity checks.

### 3.1 Reconstruct the packed `tags` column

`tags` is stored in the CSV as one comma-joined string because CSV cells can't hold a real Python list — reconstructing the list on load, with `.apply`, is the standard pattern for any "packed" column like this.

**👟 Starter hint:** `.fillna("")` first so a genuinely empty cell doesn't crash `.split`, then `.apply` a small lambda that splits on `,`, strips whitespace off each piece, and drops any that end up empty:

```python
# analyze.py
import pandas as pd

df = pd.read_csv("quotes.csv")

# tags was saved as a single "tag1, tag2, tag3" string -- split it into a real
# list column so each tag can be counted separately.
df["tags"] = df["tags"].fillna("").apply(
    lambda raw: [tag.strip() for tag in raw.split(",") if tag.strip()]
)
```

**🎯 Expected output:** `type(df["tags"].iloc[0])` prints `<class 'list'>`, and `df["tags"].iloc[0]` shows real strings like `['change', 'deep-thoughts']`, not one long comma-joined string.

**🩹 If it's off:** If `df["tags"]` still holds strings after this, the `.apply` result wasn't assigned back to `df["tags"]` — check you didn't drop the assignment while copying. A `AttributeError: 'float' object has no attribute 'split'` means a `NaN` slipped through — confirm `.fillna("")` ran before `.apply`, not after.

### 3.2 Whitespace and dtype sanity checks

Cheap to do, easy to skip, and the kind of thing that silently breaks a `groupby` later if left unchecked.

**👟 Starter hint:** `.str.strip()` on both text columns, then an `assert` that would fail loudly (not silently produce wrong charts) if the scrape ever left a truly empty quote behind:

```python
# Whitespace and dtype sanity checks -- cheap to do, easy to skip, and the kind
# of thing that silently breaks a groupby later if left unchecked.
df["text"] = df["text"].str.strip()
df["author"] = df["author"].str.strip()
assert df["text"].notna().all(), "some quotes have no text -- check the scrape"

df["quote_length"] = df["text"].str.len()
print(df.head())
print(df.dtypes)
```

`df["text"].str.len()` computing every quote's length in one vectorized call, instead of a Python loop calling `len()` row by row, is exactly the speed argument from Section 2 — just applied to data you fetched yourself instead of a bundled CSV.

**🎯 Expected output:** `df.head()` shows clean rows with no stray leading/trailing whitespace, `df.dtypes` shows `quote_length` as an integer type, and the `assert` runs with no `AssertionError`.

**🩹 If it's off:** If the `assert` fires, something upstream in Step 2 saved a row with missing text — check `quotes.csv` directly for a blank `text` cell before assuming this step's code is wrong. If `quote_length` prints as `object` instead of a numeric dtype in `df.dtypes`, `.str.len()` was probably called on the wrong column (double-check it's `df["text"]`, already stripped, not the raw CSV column).

**✅ Checklist**

- ✅ `df["tags"]` holds real Python lists after the `.apply` call, not strings — check with `type(df["tags"].iloc[0])`.
- ✅ `df["quote_length"]` is a numeric column with no missing values.
- ✅ `df.head()` shows clean text with no stray leading/trailing whitespace.

**🤔 Socratic Question(s)**

- If one row's `tags` cell were empty (a quote with no tags), what would `raw.split(",")` return, and does the `if tag.strip()` filter in the list comprehension handle that case correctly? Test it.
- Why compute `quote_length` from `text` after stripping whitespace rather than before? What number would be wrong if you computed it before?

## Step 4: Analyze and visualize

With clean, typed columns, the actual analysis is a few lines of `groupby`/`value_counts`, exactly like Section 2's guided notebooks — the difference is that this data came from your own scraper, not a bundled file. Three sub-steps, one per chart/number.

### 4.1 Most common tags

`explode` turns the list-of-tags column into one row per tag, so `value_counts` can count them individually.

**👟 Starter hint:** `df.explode("tags")` first, filter out the empty-string rows that came from quotes with no tags, then `.value_counts().head(10)` and plot it as a horizontal bar chart with the x-axis pinned to start at 0:

```python
import matplotlib.pyplot as plt

exploded = df.explode("tags")
exploded = exploded[exploded["tags"] != ""]
tag_counts = exploded["tags"].value_counts().head(10)

fig, ax = plt.subplots(figsize=(8, 5))
tag_counts.sort_values().plot(kind="barh", ax=ax, color="#3b82f6")
ax.set_xlabel("Number of quotes")
ax.set_ylabel("Tag")
ax.set_title("Top 10 tags on quotes.toscrape.com")
ax.set_xlim(left=0)  # bar charts should start at 0 -- Data Analysis Hard Week 9's chart-honesty rule
fig.tight_layout()
fig.savefig("top_tags.png")
```

**🎯 Expected output:** `top_tags.png` opens as a horizontal bar chart, longest bar at top, x-axis starting at 0, with a real title and axis labels — not a bare, unlabeled plot.

**🩹 If it's off:** An empty or all-zero chart usually means `exploded["tags"] != ""` filtered out everything — check that Step 3.1's list-building actually dropped empty strings itself (`if tag.strip()`), rather than leaving `""` entries inside each list for `explode` to surface here. If bars look reasonable but the x-axis doesn't start at 0, the `ax.set_xlim(left=0)` line was dropped.

### 4.2 Most-quoted authors

**👟 Starter hint:** One line — `.value_counts()` on the author column, same pattern as the tag counts above, just without exploding since `author` is already one value per row:

```python
most_quoted = df["author"].value_counts().head(5)
print(most_quoted)
```

**🎯 Expected output:** A printed pandas Series, five author names as the index and their quote counts as values, sorted highest first.

**🩹 If it's off:** If one author appears twice with slightly different counts split between them, that's a whitespace-cleaning bug from Step 3.2 resurfacing — `"Albert Einstein"` and `"Albert Einstein "` count as different groups to `value_counts()`.

### 4.3 Quote-length distribution

A histogram, to see the shape of the data rather than just a single average.

**👟 Starter hint:** `ax.hist(df["quote_length"], bins=20, ...)` — a histogram bins numeric values into ranges and counts how many fall in each, unlike the bar charts above which count discrete categories directly:

```python
fig, ax = plt.subplots(figsize=(8, 5))
ax.hist(df["quote_length"], bins=20, color="#3b82f6", edgecolor="white")
ax.set_xlabel("Quote length (characters)")
ax.set_ylabel("Number of quotes")
ax.set_title("Distribution of quote lengths")
fig.tight_layout()
fig.savefig("quote_length_dist.png")
```

Both charts follow the same honesty rules from Data Analysis Hard Week 9: axes are labeled, the bar chart's x-axis starts at 0 rather than being truncated to exaggerate small differences, and titles say exactly what's being counted rather than leaving it to guesswork.

**🎯 Expected output:** `quote_length_dist.png` opens as a histogram with a real shape (not a single flat bar or dozens of empty bins) — most quote lengths clustered somewhere in the low hundreds of characters, with a tail of longer ones.

**🩹 If it's off:** A histogram that's one solid bar means `quote_length` didn't vary — re-check Step 3.2 actually computed it from the *stripped* `text` column, not a constant or a miscomputed column. If the file doesn't save, confirm `fig.savefig(...)` is called on the same `fig` object `plt.subplots()` returned, not a stale one from the previous chart.

**✅ Checklist**

- ✅ `top_tags.png` and `quote_length_dist.png` both exist and open as real images.
- ✅ The bar chart's x-axis starts at 0.
- ✅ Both charts have a title and labeled axes — no bare numbers with no units.

**🤔 Socratic Question(s)**

- If you set the bar chart's `ax.set_xlim(left=5)` instead of `0`, how would the *visual* difference between the top and tenth tag change, even though the underlying counts haven't changed at all?
- The histogram uses `bins=20`. Try `bins=5` and `bins=50` on the same data. Does the shape of the distribution look meaningfully different depending on the bin count — and if so, what does that tell you about how much a histogram's *parameters*, not just its data, shape the story it tells?

## ⚠️ Common pitfalls

- **Scraping too fast and getting rate-limited or blocked.** Even a practice-friendly site can slow down or reject requests fired with no delay between them. The `time.sleep()` calls in Steps 1-2 aren't decorative — remove them and you're more likely to see connection errors or missing pages, especially on a real (non-practice) site.
- **HTML structure changing and breaking your selectors.** `find("div", class_="quote")` only works because that's the *current* class name on quotes.toscrape.com. Sites change their markup over time (a redesign, an A/B test, a new CSS framework); a scraper that worked yesterday can silently stop finding anything today. If a scrape returns zero results, check the live page's HTML before assuming your code is the problem.
- **Forgetting `try`/`except` around network calls.** One flaky request or timeout, on page 7 of 10, without a `try`/`except`, throws an unhandled exception and loses everything already collected. Step 2's version catches `requests.RequestException` and saves what it has instead.
- **Confusing `.text` with `.get_text(strip=True)`.** BeautifulSoup's `.text` property returns a tag's text content as-is, including any surrounding whitespace from the HTML's own indentation; `.get_text(strip=True)` strips it. Skipping `strip=True` is a common source of quietly broken string comparisons and grouping later — two "identical" author names that don't match because one has trailing whitespace.

## What you just built

A complete, honest fetch → parse → clean → analyze → visualize pipeline, running against a real live website instead of a file someone else prepared for you. Nothing here was simplified into a toy that doesn't generalize: swap in a different scraping-friendly site, and the same five steps — request the page, parse the HTML, follow pagination, clean the result with pandas, chart it — are still the whole pipeline.

## Where to go from here

- Try scraping a different site, after actually reading its `robots.txt` and terms of service first — the tag/author structure here is a reasonable template, but every site's HTML is different, so you'll need to inspect its markup yourself rather than reusing these exact selectors.
- Swap the CSV for a small **SQLite database** (Python's built-in `sqlite3` module needs no separate install) — a better fit once a dataset grows past what comfortably fits in one CSV, or if you want to query it with SQL instead of pandas.
- Schedule the scraper to run periodically (a cron job, or a simple loop with a long `time.sleep()`) and append each run's results with a timestamp column, so you can track how the data changes over time — a real dataset like this one rarely stays static forever.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓
