---
id: scrape-analyze
title: "Scrape and Analyze a Live Website"
sidebar_label: "Scrape and Analyze a Website"
slug: /projects/scrape-analyze
description: "Graduate from the in-browser playground to real Python: scrape a real website, clean the data with pandas, and produce your own charts — no API key needed."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Scrape and Analyze a Live Website

<ProjectPublishedDate projectId="scrape-analyze" />

<ProjectGreeting />

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

**Google Colab or Kaggle Notebooks** are a genuinely good fit for this particular project, not just a fallback — there's no local file server, no GPU, and no long-running process to manage, and inline chart output is exactly what a notebook does well. Run `!pip install requests beautifulsoup4 pandas matplotlib` in a cell, then paste the scripts below in as notebook cells, adapting file paths (e.g. saving `quotes.csv` to the notebook's working directory instead of your own machine) as needed. This is a comfortable, legitimate way to do this project end-to-end without leaving the browser.

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

An HTTP `GET` request is the same thing your browser does every time you visit a page — it asks a server for a URL and gets back the raw HTML as text. `requests` does this in one line:

```python
import requests

response = requests.get("https://quotes.toscrape.com/")
response.raise_for_status()  # turns a 404/500 into a loud exception instead of a silent bad parse
html = response.text
```

That `html` string is a tree of nested tags — `<div>`, `<span>`, `<a>` — each one optionally carrying attributes like `class` or `href`. BeautifulSoup parses that text into a navigable tree and gives you two main tools to search it: `find` (the first match) and `find_all` (every match), both filterable by tag name and by attributes like `class_`. Open the page's HTML in your browser's "View Page Source" and you'll see each quote sits inside a `<div class="quote">`, with the quote text in a `<span class="text">`, the author in a `<small class="author">`, and each tag in an `<a class="tag">`.

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

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python scrape.py` runs without errors.</StepChecklistItem>
<StepChecklistItem>It prints exactly 10 lines, one per quote on the front page.</StepChecklistItem>
<StepChecklistItem>Each printed line has real text, a real author name, and a non-empty list of tags — not `None` or empty strings.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- `.get_text(strip=True)` and `.text` both return a tag's text content, but only one of them strips leading/trailing whitespace. What would break later in this project — specifically in Step 3's cleaning step — if you used `.text` everywhere instead?
- The quote text on the page is wrapped in curly quotation marks (`"…"`), not straight ones. If you're comparing quote text against a hardcoded string later, what could go wrong, and how would you notice?

## Step 2: Handle pagination and collect all the data

quotes.toscrape.com spreads its quotes across multiple pages, with a "Next" link at the bottom of every page except the last. Rather than hardcode "loop 10 times," follow the link itself — that way the script keeps working even if the number of pages changes:

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

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python scrape.py` finishes and prints a "Saved N quotes" line.</StepChecklistItem>
<StepChecklistItem>`quotes.csv` exists and has more than 10 rows (i.e. it actually followed pagination, not just the front page).</StepChecklistItem>
<StepChecklistItem>Opening `quotes.csv` in a text editor shows three columns — `text`, `author`, `tags` — with no obviously broken/empty rows.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- What would happen to your scraper if the site added a tenth field to each quote — say, a publication year? How would you notice, and how would you adapt `parse_quotes` to pick it up?
- The loop stops when `find("li", class_="next")` returns `None`. What would happen if the site's last page still had a (disabled-looking) "Next" link in its HTML, just not a clickable one? How would you check for that before trusting this stopping condition on a different site?

## Step 3: Clean and load into pandas

Section 2 introduced pandas as the fix for plain Python loops getting slow as data grows — vectorized operations in C instead of a Python `for` loop over every row. Scraped data adds a second, equally real reason to reach for it: it rarely arrives clean, and pandas' string and type-checking tools make cleaning it fast to write and easy to verify.

```python
# analyze.py
import pandas as pd

df = pd.read_csv("quotes.csv")

# tags was saved as a single "tag1, tag2, tag3" string -- split it into a real
# list column so each tag can be counted separately.
df["tags"] = df["tags"].fillna("").apply(
    lambda raw: [tag.strip() for tag in raw.split(",") if tag.strip()]
)

# Whitespace and dtype sanity checks -- cheap to do, easy to skip, and the kind
# of thing that silently breaks a groupby later if left unchecked.
df["text"] = df["text"].str.strip()
df["author"] = df["author"].str.strip()
assert df["text"].notna().all(), "some quotes have no text -- check the scrape"

df["quote_length"] = df["text"].str.len()
print(df.head())
print(df.dtypes)
```

Two things worth noticing here. First, `tags` is stored in the CSV as one comma-joined string because CSV cells can't hold a real Python list — reconstructing the list on load, with `.apply`, is the standard pattern for any "packed" column like this. Second, `df["text"].str.len()` computing every quote's length in one vectorized call, instead of a Python loop calling `len()` row by row, is exactly the speed argument from Section 2 — just applied to data you fetched yourself instead of a bundled CSV.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`df["tags"]` holds real Python lists after the `.apply` call, not strings — check with `type(df["tags"].iloc[0])`.</StepChecklistItem>
<StepChecklistItem>`df["quote_length"]` is a numeric column with no missing values.</StepChecklistItem>
<StepChecklistItem>`df.head()` shows clean text with no stray leading/trailing whitespace.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- If one row's `tags` cell were empty (a quote with no tags), what would `raw.split(",")` return, and does the `if tag.strip()` filter in the list comprehension handle that case correctly? Test it.
- Why compute `quote_length` from `text` after stripping whitespace rather than before? What number would be wrong if you computed it before?

## Step 4: Analyze and visualize

With clean, typed columns, the actual analysis is a few lines of `groupby`/`value_counts`, exactly like Section 2's guided notebooks — the difference is that this data came from your own scraper, not a bundled file.

**Most common tags** — `explode` turns the list-of-tags column into one row per tag, so `value_counts` can count them individually:

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

**Most-quoted authors:**

```python
most_quoted = df["author"].value_counts().head(5)
print(most_quoted)
```

**Quote-length distribution** — a histogram, to see the shape of the data rather than just a single average:

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

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`top_tags.png` and `quote_length_dist.png` both exist and open as real images.</StepChecklistItem>
<StepChecklistItem>The bar chart's x-axis starts at 0.</StepChecklistItem>
<StepChecklistItem>Both charts have a title and labeled axes — no bare numbers with no units.</StepChecklistItem>
</StepChecklist>

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

<ProjectProgressCheckbox projectId="scrape-analyze" />
