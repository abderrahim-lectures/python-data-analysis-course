"""Scrapes every quote from quotes.toscrape.com and saves them to quotes.csv.

quotes.toscrape.com is a public site built and maintained specifically for
scraping practice -- no login, no rate limiting to work around, no robots.txt
restrictions. That's why this example targets it instead of a real commercial
site; see the course lesson for why that distinction matters.

Run with: uv run python scrape.py
"""

import csv
import time

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://quotes.toscrape.com"
OUTPUT_PATH = "quotes.csv"
REQUEST_DELAY_SECONDS = 1.0  # be polite -- see the lesson's "Rate-limit yourself" tip


def fetch_page(url: str) -> BeautifulSoup:
    """GETs one page and returns it parsed as a BeautifulSoup tree."""
    response = requests.get(url, timeout=10)
    response.raise_for_status()  # turns a 404/500 into a loud exception, not a silent bad parse
    return BeautifulSoup(response.text, "html.parser")


def parse_quotes(soup: BeautifulSoup) -> list[dict]:
    """Extracts {"text", "author", "tags"} for every quote on one parsed page."""
    quotes = []
    for quote_div in soup.find_all("div", class_="quote"):
        text = quote_div.find("span", class_="text").get_text(strip=True)
        author = quote_div.find("small", class_="author").get_text(strip=True)
        tags = [tag.get_text(strip=True) for tag in quote_div.find_all("a", class_="tag")]
        quotes.append({"text": text, "author": author, "tags": ", ".join(tags)})
    return quotes


def find_next_page_url(soup: BeautifulSoup, current_url: str) -> str | None:
    """Returns the absolute URL of the "Next" link, or None on the last page."""
    next_li = soup.find("li", class_="next")
    if next_li is None:
        return None
    next_href = next_li.find("a")["href"]
    return requests.compat.urljoin(current_url, next_href)


def scrape_all_quotes() -> list[dict]:
    """Follows "Next" links from the front page until there isn't one, collecting
    every quote along the way. Sleeps between requests -- see the lesson for why."""
    all_quotes = []
    url = f"{BASE_URL}/"
    page_number = 1

    while url is not None:
        print(f"Fetching page {page_number}: {url}")
        try:
            soup = fetch_page(url)
        except requests.RequestException as exc:
            # One failed request shouldn't kill a scrape that's already collected
            # data from several pages -- log it and stop cleanly instead of crashing.
            print(f"  Failed to fetch {url}: {exc}. Stopping here.")
            break

        page_quotes = parse_quotes(soup)
        print(f"  Found {len(page_quotes)} quotes.")
        all_quotes.extend(page_quotes)

        url = find_next_page_url(soup, url)
        page_number += 1
        if url is not None:
            time.sleep(REQUEST_DELAY_SECONDS)

    return all_quotes


def save_to_csv(quotes: list[dict], path: str) -> None:
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["text", "author", "tags"])
        writer.writeheader()
        writer.writerows(quotes)


if __name__ == "__main__":
    quotes = scrape_all_quotes()
    save_to_csv(quotes, OUTPUT_PATH)
    print(f"\nSaved {len(quotes)} quotes to {OUTPUT_PATH}")
