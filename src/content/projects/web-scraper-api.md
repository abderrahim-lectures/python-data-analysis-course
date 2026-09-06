---
title: "Web Scraper API"
description: "Build a reusable web scraping API with proxy rotation, rate limiting, and structured data extraction."
difficulty: "intermediate"
estimatedMinutes: 100
tags: ["requests", "beautifulsoup", "web-scraping", "html-parsing", "api"]
learningObjectives:
  - Fetch web pages with `requests` and handle errors gracefully
  - Parse HTML with BeautifulSoup using CSS selectors
  - Implement rate limiting to respect target servers
  - Build a reusable scraping function that outputs structured JSON
prerequisites:
  - "Python basics (functions, loops, dictionaries)"
  - "Understanding of HTTP and HTML structure"
  - "Familiarity with JSON format"
---

## What You'll Learn

- Fetch web pages with `requests` and handle HTTP errors gracefully
- Parse HTML content with BeautifulSoup using CSS selectors
- Implement rate limiting to crawl responsibly
- Extract structured data from HTML and save it as JSON

## What You'll Build

A web scraping toolkit with a resilient HTTP client (retry logic + rate limiting), an HTML parser using CSS selectors, a multi-page scraper for books.toscrape.com, and a data analysis summary function.

## Where to Run It

- **Local with `uv`**: Required — `requests` needs network access
- **Google Colab**: Works well for experimentation
- **JupyterLite**: Not suitable (limited network requests)

## Setup

```bash
uv init web-scraper-api
cd web-scraper-api
uv add requests beautifulsoup4 lxml
```

## Step 1: Build a Resilient HTTP Client

Create a fetch function with retries, rate limiting, and proper error handling.

```python
import requests
import time
import json

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
            if response.status_code == 429:
                time.sleep(2 ** attempt)
            elif response.status_code >= 500:
                time.sleep(2 ** attempt)
            else:
                raise
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
            time.sleep(2 ** attempt)

    raise RuntimeError(f"Failed to fetch {url} after {max_retries} retries")

response = fetch_page("https://books.toscrape.com/")
print(f"Status: {response.status_code}, Length: {len(response.text)} chars")
```

## Step 2: Parse HTML with BeautifulSoup

Build a parser that uses CSS selectors to extract structured data from HTML.

```python
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
    print(f"  {book['title']} — {book['price']} — {'*' * book['rating']}")
```

## Step 3: Build a Multi-Page Scraper

Extend the scraper to handle pagination and collect data across multiple pages.

```python
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

with open("books.json", "w") as f:
    json.dump(books, f, indent=2)
print("Saved to books.json")
```

## Step 4: Analyze Scraped Data

Use basic Python to generate summary statistics from the scraped data.

```python
def analyze_books(books: list[dict]) -> dict:
    """Generate summary statistics from scraped book data."""
    if not books:
        return {"error": "No books to analyze"}

    ratings = [b["rating"] for b in books if b["rating"] > 0]
    prices = []
    for b in books:
        try:
            prices.append(float(b["price"].replace("£", "").replace("Â", "")))
        except (ValueError, AttributeError):
            continue

    in_stock = sum(1 for b in books if "in stock" in b["availability"].lower())
    return {
        "total_books": len(books),
        "average_rating": round(sum(ratings) / len(ratings), 2) if ratings else 0,
        "price_range": {"min": min(prices), "max": max(prices), "avg": round(sum(prices) / len(prices), 2)} if prices else {},
        "in_stock_percent": round(in_stock / len(books) * 100, 1),
    }

stats = analyze_books(books)
print(json.dumps(stats, indent=2))
```

## Challenges

<details>
<summary><strong>Challenge 1: Custom Selectors</strong></summary>

Modify the parser to extract the book category from the breadcrumb navigation (e.g., `Home > Books > Travel`). Add it as a field in each book record.

</details>

<details>
<summary><strong>Challenge 2: CSV Export</strong></summary>

Add a function that exports scraped books to a CSV file using the `csv` module. Include all fields and handle edge cases like commas in titles.

</details>

<details>
<summary><strong>Challenge 3: Proxy Support</strong></summary>

Add optional proxy support to `fetch_page`. Accept a `proxy` parameter as a dict (e.g., `{"http": "http://proxy:8080"}`) and pass it to `requests.get`.

</details>

## Stretch Goals

- [ ] Add headless browser support for JavaScript-rendered pages
- [ ] Build a job queue system for distributed scraping
- [ ] Implement automatic pagination and recursive crawling
- [ ] Add caching with `sqlite3` to avoid re-fetching pages
- [ ] Create a simple FastAPI endpoint that accepts a URL and returns scraped data

## What You Learned

- Built a resilient HTTP client with retry logic and rate limiting
- Parsed HTML with BeautifulSoup using CSS selectors
- Handled pagination to scrape across multiple pages
- Extracted structured data and saved it as JSON
- Analyzed scraped data to generate summary statistics
