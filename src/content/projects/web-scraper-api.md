---
title: "Build a Web Scraper API"
description: "Fetch pages responsibly with rate limiting and retries, parse them into structured records with BeautifulSoup, crawl pagination, and wrap the whole pipeline in one reusable JSON-producing function."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["requests", "beautifulsoup", "web-scraping", "html-parsing", "api"]
learningObjectives:
  - Fetch pages with requests and handle HTTP errors gracefully
  - Parse HTML with BeautifulSoup using CSS selectors
  - Rate-limit and retry to crawl responsibly
  - Crawl paginated sites into one dataset
  - Wrap the pipeline in one reusable function returning structured JSON
prerequisites:
  - "Python basics (functions, loops, dictionaries)"
  - "Understanding of HTTP and basic HTML structure"
  - "Familiarity with JSON format"
---

# 🛠️ 🕷️ Build a Web Scraper API

The web is mostly HTML served to humans, but every "dataset" you can't download started as someone scraping it. This project builds a small, responsible scraping API against [books.toscrape.com](https://books.toscrape.com/), a site built *for* practicing this, with a rate-limited HTTP client that retries politely, a BeautifulSoup parser that turns HTML into structured records, a pagination crawler, and a single reusable function that returns clean JSON. The result is your own little read API over a public website.

This assumes Python 101 and enough HTML to recognize a heading, a link, and a `div`, nothing from Data Analysis is required. It's optional and ungraded; see [Real-World Projects](/projects) for the full, growing list.

## 🎯 What you'll do

1. Build a rate-limited HTTP client that retries transient failures and respects the target server.
2. Parse real HTML into structured book records with CSS selectors.
3. Crawl the site's pagination and combine pages into one dataset.
4. Wrap the pipeline in one reusable function that writes and returns JSON.
5. Analyze the collected records into summary statistics.

## Where to run this

**Locally with `uv`** is the primary path, and here it's not just convenient, it's load-bearing. This project's entire premise is making real HTTP requests, which means the environment has to have outbound network access. Local `uv` does, and `requests`, `beautifulsoup4`, and `lxml` install cleanly for it.

**Google Colab and Binder notebook runs** also work, both have network access, and the notebook mirrors every step with a `!pip install` and live requests to books.toscrape.com. **JupyterLite** is genuinely unsuitable: it runs Python in a browser sandbox with no general outbound network, so a `requests.get` has nothing to reach. Use the notebook badges or a local run for this one, honestly.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/web-scraper-api/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/web-scraper-api/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fweb-scraper-api%2Fnotebook.ipynb)

## Setup

Create the project and install the three libraries this pipeline is built on.

```bash
uv init web-scraper-api
cd web-scraper-api
uv add requests beautifulsoup4 lxml
```

**`requests`** does the HTTP, **`beautifulsoup4`** parses HTML and does the CSS-selector querying, and **`lxml`** is the fast C parser that BeautifulSoup uses underneath, it's what makes `soup.select` quick on a full page. One perfect-scraping-ethics note before you start: only scrape sites that allow it. This course uses books.toscrape.com because its name is its contract, it exists to be scraped. For anything you write beyond this project, check `robots.txt` first and keep your request rate humane; the rate limiter you're about to build is the *polite* version of that.

**✅ Checklist**

- ✅ `uv add requests beautifulsoup4 lxml` finished and `uv run python -c "import requests, bs4, lxml"` exits silently.
- ✅ You can reach the target: `uv run python -c "import requests; print(requests.get('https://books.toscrape.com/').status_code)"` prints `200`.

## Step 1: Build a resilient HTTP client

The internet drops packets, throttles clients, and occasionally returns a broken page. A scraper that crashes on the first hiccup is useless, and one that hammers a server is rude, so this step builds a client with two personalities: it waits politely between requests (rate limiting) and retries politely when something transient fails (backoff).

### 1.1 Write the rate limiter

**👟 Starter hint:** Enforce a minimum interval between requests in one small class, track the last request time and `sleep` for the difference when needed.

```python
# scraper.py
import time
import json
import requests

class RateLimiter:
    def __init__(self, requests_per_second: float = 1.0):
        self.min_interval = 1.0 / requests_per_second
        self.last_request = 0.0

    def wait(self) -> None:
        elapsed = time.time() - self.last_request
        if elapsed < self.min_interval:
            time.sleep(self.min_interval - elapsed)
        self.last_request = time.time()

limiter = RateLimiter(requests_per_second=0.5)

limiter.wait()
print(f"Just waited; last_request={limiter.last_request:.2f}")
limiter.wait()
print(f"Immediate second call also waited; last_request={limiter.last_request:.2f}")
```

The unit conversion in the constructor is the whole idea: `requests_per_second=0.5` means two seconds between requests, and `1.0 / 0.5` computes that interval. `wait()` then does *two* jobs, sleep if we're too early, and always stamp `last_request = time.time()`, so the second call in a row has no choice but to wait. `last_request` starts at `0.0`, which means the very first `wait()` never sleeps (a huge elapsed time) yet correctly primes the clock. This is the textbook token-bucket-adjacent pattern behind every respectful crawler.

**🎯 Expected output:** Both waits run and each line prints a monotonically increasing `last_request` timestamp roughly two seconds apart.

**🩹 If it's off:** If the second wait is instant, the `time.sleep` branch never fires because `last_request` wasn't updated after the first wait. If waits are much longer than two seconds, `requests_per_second` is being passed as an integer rate but divided somewhere else. If `rate_per_second` spelling leaks in from another example, only the `__init__` signature is authoritative, the test above calls `RateLimiter(requests_per_second=0.5)`.

### 1.2 Fetch a page with retries

**👟 Starter hint:** Wrap `requests.get` in a loop that retries on transient failures (timeouts, connection errors, 429/5xx) with growing delays, and give the request a real User-Agent.

```python
# scraper.py (continued)
def fetch_page(url: str, max_retries: int = 3, timeout: int = 10) -> requests.Response:
    """Fetch a URL with retry logic and rate limiting."""
    headers = {"User-Agent": "PythonScraper/1.0 (educational project)"}

    for attempt in range(1, max_retries + 1):
        limiter.wait()
        try:
            response = requests.get(url, headers=headers, timeout=timeout)
            response.raise_for_status()
            return response
        except requests.exceptions.HTTPError:
            if response.status_code == 429 or response.status_code >= 500:
                time.sleep(2 ** attempt)
            else:
                raise
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
            time.sleep(2 ** attempt)

    raise RuntimeError(f"Failed to fetch {url} after {max_retries} retries")

response = fetch_page("https://books.toscrape.com/")
print(f"Status: {response.status_code}, Length: {len(response.text)} chars")
```

Three decisions make this client production-shaped. **The User-Agent is explicit**, `PythonScraper/1.0 (educational project)` tells the server *who* is calling instead of hiding behind the library default, which is what a polite crawler does. **Only transient failures retry**: 4xx errors like 404 are the server saying "this is final," so they re-raise immediately, while 429 (rate-limited) and 5xx (server hiccup) and a timeout/connection error all get `time.sleep(2 ** attempt)`, exponential backoff, 2s, then 4s, so retries get gentler, not angrier. And `limiter.wait()` runs *before* every attempt, folding the Step 1.1 discipline into the fetch so no caller can skip it.

**🎯 Expected output:** `Status: 200, Length: ...`, a real HTTP 200 and the home page's character count. Pointing `fetch_page` at a deliberately nonexistent page (e.g. `https://books.toscrape.com/nope`) raises an HTTP error rather than returning garbage.

**🩹 If it's off:** If you get `NameError: response is not defined` in the `HTTPError` branch, `requests.get` itself raised before assigning `response`, passing `timeout` in the call (already there) is what prevents that. If a 404 loops forever, the `else: raise` branch is missing, so *every* HTTP status retries. If the retry sleeps never visibly wait, `2 ** attempt` timing flies past on a fast network, that's correct; test with `timeout=1` on an unreachable host to feel the backoff.

### 1.3 Verify the HTTP client

**✅ Checklist**

- ✅ `RateLimiter(requests_per_second=0.5)` enforces ~2s gaps between consecutive `wait()` calls.
- ✅ `fetch_page` returns a `200` response for the home page and raises cleanly for a nonexistent path.
- ✅ Only transient statuses (429, 5xx, timeouts, connection errors) trigger retries.

**🤔 Socratic Question(s)**

- `limiter.wait()` sleeps for the gap *before* a request. What changes if the sleep instead happened after the response arrives, and which pattern is kinder to the server when responses are slow?
- The retry loop uses `time.sleep(2 ** attempt)`. Why *exponential* backoff instead of waiting a fixed second each time, and what would a server experiencing an overload feel from a fixed-interval retrier that it wouldn't feel from this one?

## Step 2: Parse HTML into structured records

A fetched page is a wall of text; a usable dataset is a list of dicts. This step builds the parser that turns each `article` on the bookstore's page into one clean record, using BeautifulSoup's CSS selectors, which read like the CSS you'd write for a stylesheet.

### 2.1 Write the book parser

**👟 Starter hint:** Select every product card with one `select`, pull each field with `select_one`, and always guard for missing elements so one absent field doesn't kill a record.

```python
# scraper.py (continued)
from bs4 import BeautifulSoup

def parse_books(html: str) -> list[dict]:
    """Extract book data from books.toscrape.com HTML."""
    soup = BeautifulSoup(html, "lxml")
    books = []

    for article in soup.select("article.product_pod"):
        title_tag = article.select_one("h3 a")
        price_tag = article.select_one(".price_color")
        availability_tag = article.select_one(".availability")
        rating_tag = article.select_one(".star-rating")

        rating_classes = rating_tag.get("class", []) if rating_tag else []
        rating_map = {"One": 1, "Two": 2, "Three": 3, "Four": 4, "Five": 5}
        rating = rating_map.get(rating_classes[1], 0) if len(rating_classes) > 1 else 0

        books.append({
            "title": title_tag["title"] if title_tag else "Unknown",
            "url": "https://books.toscrape.com/" + title_tag["href"] if title_tag else "",
            "price": price_tag.text.strip() if price_tag else "N/A",
            "availability": availability_tag.text.strip() if availability_tag else "Unknown",
            "rating": rating,
        })
    return books

html = fetch_page("https://books.toscrape.com/").text
books = parse_books(html)
print(f"Found {len(books)} books")
for book in books[:3]:
    print(f"  {book['title']} -- {book['price']} -- {'*' * book['rating']}")
```

The selector `"article.product_pod"` is the whole vocabulary: it asks the soup for every `<article>` element carrying the class `product_pod`, which is exactly how the site marks a book card. Each `select_one` then grabs *one* match inside that card: `"h3 a"` the title link (whose `title` attribute holds the name), `".price_color"` the price, and `".star-rating"` a tag whose *second class* names the rating in words. The parser reads `rating_classes[1]` and maps the word to a number, a clean demonstration that HTML sometimes encodes data in classes rather than text. Every field is guarded for absence (`if title_tag else ...`), because a site that changes one class shape shouldn't crash your entire crawl.

**🎯 Expected output:** `Found 20 books` and a preview of three rows like `A Light in the Attic -- £51.77 -- *****`.

**🩹 If it's off:** If `Found 0 books`, the selector `"article.product_pod"` doesn't match the site's markup, inspect with `soup.select_one("article")` to see what's actually there (the site may have changed). If prices come back empty, the class is `.price_color` and the `text` attribute requires the tag to have been found. If every rating is `0`, `rating_classes[1]` is empty or the class list order changed.

### 2.2 Verify the parser on a known shape

**👟 Starter hint:** Count distinct titles and confirm all five fields are populated per record, a quick shape check before you trust the parser with a full crawl.

```python
# scraper.py (continued)
print(f"Records: {len(books)}")
print("Fields per record:", sorted(books[0].keys()))
print("Non-empty titles:", sum(1 for b in books if b["title"]))
print("Ratings seen:", sorted({b["rating"] for b in books}))
```

Verify-before-scale is the discipline here: one page, 20 records, and you check that every field exists and every rating maps to 1–5 *before* several pages of crawling trust the parser. The set comprehension `{b["rating"] for b in books}` shows, in one glance, whether the rating mapping produced sane values.

**🎯 Expected output:** `Records: 20`, the five field names, `Non-empty titles: 20`, and `Ratings seen: [1, 2, 3, 4, 5]` (or the subset present on that page).

**🩹 If it's off:** If a field name is misspelled, the parser's `books.append` dict and the check here disagree, grep both. If `Ratings seen` includes `0`, some cards lack the star-rating class and the fallback ate them; that's expected for a few listings, and the mapping still worked.

### 2.3 Verify the parsing step

**✅ Checklist**

- ✅ `parse_books` on the home page returns 20 records with exactly the five fields.
- ✅ Each record's `rating` is an integer 1–5, derived from a class word.
- ✅ A record with a missing element degrades to a placeholder instead of crashing the loop.

**🤔 Socratic Question(s)**

- The parser extracts the URL by string-concatenating `"https://books.toscrape.com/" + title_tag["href"]`. What breaks if the site switches to *absolute* hrefs like `/catalogue/foo.html`, and what would a robust `urljoin` do that concatenation can't?
- Ratings are read from a class name, not the visible text. When would the site's developers change those class names, and what does that imply about how long a CSS-selector parser stays correct compared to a parser reading visible text?

## Step 3: Crawl across pages

One page is a sample; the catalogue is the dataset. Books.toscrape paginates at 20 books per page with a `next` link, and this step follows that link, bound by a `max_pages` cap, until the crawl finishes or the pagination runs out.

### 3.1 Follow the pagination chain

**👟 Starter hint:** Loop page by page, parse each response, extend the accumulator, read the `next` link from the page HTML, and resolve it into the next URL.

```python
# scraper.py (continued)
def scrape_books(base_url: str, max_pages: int = 3) -> list[dict]:
    """Scrape books across multiple pages with progress reporting."""
    all_books = []
    url = base_url

    for page in range(1, max_pages + 1):
        print(f"Scraping page {page}...")
        try:
            response = fetch_page(url)
            books = parse_books(response.text)
            all_books.extend(books)
            print(f"  Found {len(books)} books (total: {len(all_books)})")

            soup = BeautifulSoup(response.text, "lxml")
            next_btn = soup.select_one("li.next a")
            if next_btn:
                url = base_url.rsplit("/", 1)[0] + "/" + next_btn["href"]
            else:
                break
        except Exception as e:
            print(f"  Error on page {page}: {e}")
            break
    return all_books

books = scrape_books("https://books.toscrape.com/catalogue/page-1.html", max_pages=3)
print(f"\nTotal books scraped: {len(books)}")
```

Every interesting choice is in a different line. `all_books.extend(books)` is the accumulation primitive, turn the per-page list into a combined dataset, one `extend` at a time. The next-URL line, `url = base_url.rsplit("/", 1)[0] + "/" + next_btn["href"]`, is crawling in two parts: `rsplit("/", 1)` chops the last path segment (`page-1.html`) off, and the `next` link's `href` (which is `catalogue/page-2.html`, relative) gets appended, a hand-rolled relative-URL resolution. And `max_pages` is the politeness *and* safety bound: you explore page 1→2→3 and stop, so neither the site nor your budget is surprised by an accidental hundred-page crawl.

**🎯 Expected output:** Three progress lines (`Scraping page 1...`, `Found 20 books (total: 20)`, etc.), then `Total books scraped: 60`.

**🩹 If it's off:** If the crawl stops after one page, `li.next a` didn't match (the site's next-button markup changed) or the `break` fires unconditionally. If *every* page re-fetches page 1 in a loop, `url` updates to an identical string each time, check the `rsplit` is actually replacing the segment, or print `url` before fetching. If an exception halfway through kills the whole run, the per-page `try/except` that prints and `break`s is missing.

### 3.2 Verify the crawl

**✅ Checklist**

- ✅ `scrape_books(..., max_pages=3)` returns 60 records with unique URLs.
- ✅ The loop stops at `max_pages` even when more pages exist.
- ✅ The total printed equals the sum of the per-page counts.

**🤔 Socratic Question(s)**

- The loop breaks when there's no `next` button *and* when `max_pages` is reached. If a real crawl needed to resume where it stopped (say, after a crash), what would you have to persist to make it resumable, and is the current code anywhere close to that?
- Pagination crawls tend to be sequential: you can't know the third URL until you've read the second page's `next` link. Under what circumstance could a crawl parallelize pages, and what new problem does that create for the rate limiter in Step 1?

## Step 4: Make it a reusable API function

The crop of functions you've built is a pipeline; a *reusable* one is a single function that runs the whole pipeline and hands back structured data. This step wraps crawl → parse → save into one `scrape_books_to_json` call and adds the load-back, so `books.json` behaves like the response of a small read API.

### 4.1 Wrap the pipeline into one function

**👟 Starter hint:** Have the wrapper return what it saves, write with `json.dump(indent=2)`, and return the list so callers get data even if they ignore the file.

```python
# scraper.py (continued)
def scrape_books_to_json(base_url: str, max_pages: int = 3, outfile: str = "books.json") -> list[dict]:
    """Crawl pages and write the combined records to a JSON file."""
    records = scrape_books(base_url, max_pages=max_pages)
    with open(outfile, "w") as f:
        json.dump(records, f, indent=2)
    print(f"Wrote {len(records)} records to {outfile}")
    return records

books = scrape_books_to_json("https://books.toscrape.com/catalogue/page-1.html", max_pages=3)
print(f"Returned {len(records := books)} records ready to use in memory")
```

The contract here is the interesting part: `scrape_books_to_json` returns a plain `list[dict]`, exactly what an API call would return, *and* writes the same thing to disk. Wrapping the pipeline changes the function's surface from "three separate tools" to "one call that gives you the dataset," which is the API-shaped interface behind the project's name. `json.dump(records, f, indent=2)` makes the file human-readable, and because loading is a pure `json.load`, the saved file becomes a portable snapshot you can re-analyze without touching the network again.

**🎯 Expected output:** The crawl's progress lines, `Wrote 60 records to books.json`, and `Returned 60 records ready to use in memory`.

**🩹 If it's off:** If the file writes but the function returns `None`, the `return records` line is missing. If the file is one dense line, `indent=2` was dropped. If a second call with `outfile="books2.json"` still overwrites `books.json`, the hardcoded default won the argument, they must differ at the call site.

### 4.2 Load and count from the saved JSON

**👟 Starter hint:** Read the snapshot back with `json.load` so you can re-run the analysis without re-hitting the network and re-scraping.

```python
# scraper.py (continued)
with open("books.json") as f:
    saved_books = json.load(f)

print(f"Reloaded {len(saved_books)} records from books.json")
print("First title:", saved_books[0]["title"])
```

The point of persisting a snapshot is that analysis becomes a *reading* operation: no network, no retries, no rate-limiter, just a file. `json.load` brings back exactly the list the wrapper wrote, because every value (strings, ints, dicts) in the records is JSON-serializable by construction. This is the offline half of a scrape-and-what-next workflow: scrape once, analyze many times.

**🎯 Expected output:** `Reloaded 60 records from books.json` and the first book's title.

**🩹 If it's off:** If the file is missing, the wrapper in 4.1 never ran (run it first). If loading raises `json.decoder.JSONDecodeError`, the file was hand-edited or partially written, regenerate it with the wrapper. If `saved_books[0]` fails, the file contains a top-level structure that isn't a list.

### 4.3 Verify the reusable API

**✅ Checklist**

- ✅ `scrape_books_to_json(".../page-1.html", max_pages=3)` returns 60 records *and* writes `books.json`.
- ✅ `json.load` re-reads the same 60 records offline.
- ✅ The saved file is human-readable and looks like a list of book objects.

**🤔 Socratic Question(s)**

- The wrapper both writes a file and returns data. What's the argument *against* returning data when the primary purpose is a file on disk, and what would a caller who only wanted the file expect this function's return value to be?
- The `url` field in each record stores the full concatenated URL. In 2.1's Socratic question, we worried about absolute vs relative hrefs. Where does that design decision surface now that you're re-loading `books.json` later, and why does a *stored* dataset hide those bugs if they were already baked into the URLs at parse time?

## Step 5: Analyze the scraped dataset

Scraping is only half the value; the other half is answering "so what?" This step reads the records and produces summary statistics, ratings, price ranges, stock, with careful guards for data that's missing or non-numeric.

### 5.1 Compute summary statistics

**👟 Starter hint:** Convert the price strings to floats defensively, average the ratings, and compute the in-stock percentage, each guarded so a bad record can't kill the summary.

```python
# scraper.py (continued)
def analyze_books(records: list[dict]) -> dict:
    """Generate summary statistics from scraped book data."""
    if not records:
        return {"error": "No books to analyze"}

    ratings = [b["rating"] for b in records if b["rating"] > 0]
    prices = []
    for b in records:
        try:
            prices.append(float(b["price"].replace("\u00a3", "")))
        except (ValueError, AttributeError):
            continue

    in_stock = sum(1 for b in records if "in stock" in b["availability"].lower())
    return {
        "total_books": len(records),
        "average_rating": round(sum(ratings) / len(ratings), 2) if ratings else 0,
        "price_min": min(prices) if prices else None,
        "price_max": max(prices) if prices else None,
        "price_avg": round(sum(prices) / len(prices), 2) if prices else None,
        "in_stock_percent": round(in_stock / len(records) * 100, 1),
    }

print(json.dumps(analyze_books(books), indent=2))
```

The price line is the one worth sitting with: `float(b["price"].replace("\u00a3", ""))`. The scraper stored prices as live strings like `"£51.77"`, so analysis needs to strip the pound sign, written as its Unicode escape `\u00a3` to be explicit about exactly which character, then parse the number. The `try/except` isolates one bad record: a price that survived parsing as `"N/A"` (the Step 2 "unknown" fallback) fails `float()` cleanly and is *skipped*, not fatal. Ratings are averaged only over books that actually have a rating (`if b["rating"] > 0`), and every aggregate that could divide by zero carries an `if ... else` guard, the same defensive shape you practiced in the grant-tracker's budgets.

**🎯 Expected output:** A JSON block reporting `total_books`, `average_rating`, min/max/avg price, and `in_stock_percent`, with real numbers derived from the 60 scraped records (for example `"total_books": 60`, `"in_stock_percent": 100.0`).

**🩹 If it's off:** If all prices are `None`, the `.replace("\u00a3", "")` didn't match the actual currency character (maybe your data uses a different symbol), print one raw `b["price"]` and check its bytes. If `in_stock_percent` is suspiciously 0.0, the availability string's lowercase comparison isn't finding `"in stock"`, print a sample availability string and adjust the match. If an obvious bad record crashed the run, the `try/except` around `float()` is missing, it's the guard that turns one bad row into a skip.

### 5.2 Verify the analysis

**✅ Checklist**

- ✅ `analyze_books` returns all six summary keys, none of them raising on dirty data.
- ✅ Prices are numeric (min ≤ avg ≤ max), ratings average to a 1–5 figure.
- ✅ An empty records list returns `{"error": "No books to analyze"}` rather than crashing.

**🤔 Socratic Question(s)**

- The summary silently *skips* unparseable prices. When is skipping the honest choice, and when does it quietly produce a misleading average, what would you add (a count of skipped rows, a warning) to tell a reader the number isn't the whole dataset?
- `in_stock_percent` divides by `len(records)`. If the site's availability text changed from `"In stock"` to `"Available"`, every record silently counts as not-in-stock. What does that suggest about hardcoded string matching in analysis pipelines, and how would you make the "in stock" definition a single, inspectable constant?

## ⚠️ Common pitfalls

- **Scraping sites that don't want it.** The ethical rule is concrete: check `robots.txt`, note the site's ToS, and keep your rate humane. Fix: this project targets books.toscrape.com *because* it's built for practice; for real targets, respect the file that exists at `/robots.txt` before writing a single selector.
- **No rate limiting, or the limiter bypassed.** Requesting in a tight loop gets you rate-limited (429) or blocked outright, and eventually the site owner's logs are your problem. Fix: make `limiter.wait()` part of `fetch_page` itself (as Step 1 does) so *every* request path pays the toll, not just the ones you remembered to guard.
- **Retrying on permanent errors.** A 404 or 403 is final; retrying it just wastes your quota and annoys the server. Fix: only back off on 429, 5xx, timeouts, and connection errors, re-raise anything else, exactly as `fetch_page` branches.
- **CSS selector brittleness.** One class rename or a missing element yields zero records or a crash. Fix: guard every `select_one` result (the `if tag else default` pattern in Step 2), and re-verify against a live page when the site changes shape.
- **Encoding mojibake in scraped text.** Text that decodes as `"Â£51.77"` instead of `"£51.77"` comes from reading bytes under the wrong codec. Fix: rely on `requests`' `response.text` (which uses the charset the server declares), and if mojibake appears anyway, decode explicitly (`response.content.decode("utf-8")`) and norm your parsing around the real character.

## What you just built

A small, polite web scraping API: a rate-limited client that retries only transient failures, a CSS-selector parser that turns HTML into clean records, a pagination crawler, a single `scrape_books_to_json` function that returns the dataset and saves it, and an analysis pass over the result. The transferable skill is *responsible data collection*: turning an unstructured public page into structured, storable, analyzable records, while treating the server the way you'd want to be treated, is the exact skill behind price trackers, job-board aggregators, and research datasets.

:::tip[Run a fuller version without any local setup]
[`examples/web-scraper-api/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/web-scraper-api) in the course repo ships the complete pipeline with CSV export and a proxy option ready to switch on. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Extract the **book category** from each page's breadcrumb (`Home > Books > Travel`) and add it as a field, one `select` on the breadcrumb list and a split on the `>` separator is the whole feature.
- Add **CSV export** next to the JSON: `csv.DictWriter` with the five record fields gives you a spreadsheet anyone can open, and the `csv` module quotes the comma-heavy titles for you.
- Support **proxies and retry headers**: give `fetch_page` an optional `proxies={"http": ..., "https": ...}` dict for `requests.get`, and a `Retry-After`-aware sleep on 429, the two knobs that turn a scraper into a crawler.
- Wrap the whole thing in a **FastAPI endpoint**: `@app.get("/books")` returning `scrape_books_to_json(...)` turns your function into a literal HTTP API other programs can call.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to reading the web with Python. 🎓