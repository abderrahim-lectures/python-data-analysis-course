"""Parse job listings out of several differently-structured HTML "job board"
pages, combine them into one table, and drop the duplicates that were posted
to more than one board.

Each sample board in sample_data/ uses genuinely different HTML — different
tag names, different class names, one of them a <table> instead of cards or
a list — on purpose. A real aggregator has to deal with exactly this: every
site markups its listings differently, so there's no single CSS selector
that works everywhere. The fix is the same in both cases: one small parser
function per source, each one returning the same shape of data.
"""
import csv
import hashlib
import re
from pathlib import Path

from bs4 import BeautifulSoup

SAMPLE_DATA_DIR = Path(__file__).parent / "sample_data"


def parse_board_alpha(html):
    """Alpha Jobs: <div class="job-card"> cards."""
    soup = BeautifulSoup(html, "html.parser")
    listings = []
    for card in soup.find_all("div", class_="job-card"):
        listings.append({
            "title": card.find("h2", class_="job-title").get_text(strip=True),
            "company": card.find("span", class_="company").get_text(strip=True),
            "location": card.find("span", class_="location").get_text(strip=True),
            "description": card.find("p", class_="description").get_text(strip=True),
            "source": "board_alpha",
        })
    return listings


def parse_board_beta(html):
    """Beta Careers: <li class="listing"> items."""
    soup = BeautifulSoup(html, "html.parser")
    listings = []
    for item in soup.find_all("li", class_="listing"):
        listings.append({
            "title": item.find("a", class_="position-title").get_text(strip=True),
            "company": item.find("div", class_="employer").get_text(strip=True),
            "location": item.find("div", class_="loc").get_text(strip=True),
            "description": item.find("div", class_="summary").get_text(strip=True),
            "source": "board_beta",
        })
    return listings


def parse_board_gamma(html):
    """Gamma Talent: a plain <table> of rows."""
    soup = BeautifulSoup(html, "html.parser")
    listings = []
    for row in soup.find_all("tr", class_="job-row"):
        cells = row.find_all("td")
        listings.append({
            "title": cells[0].get_text(strip=True),
            "company": cells[1].get_text(strip=True),
            "location": cells[2].get_text(strip=True),
            "description": cells[3].get_text(strip=True),
            "source": "board_gamma",
        })
    return listings


# One parser function per source file. Adding a fourth board later means
# writing one more parser and one more line here -- nothing else changes.
PARSERS = {
    "board_alpha.html": parse_board_alpha,
    "board_beta.html": parse_board_beta,
    "board_gamma.html": parse_board_gamma,
}


def scrape_all_boards():
    """Parses every sample board and returns one combined list of listings."""
    all_listings = []
    for filename, parser in PARSERS.items():
        html = (SAMPLE_DATA_DIR / filename).read_text(encoding="utf-8")
        all_listings.extend(parser(html))
    return all_listings


def dedupe_key(listing):
    """A stable id for "the same job", independent of which board posted it.

    Two boards listing the exact same opening will use the exact same title
    and company text (that's how it plays out in this sample data, and is
    common in practice too), but a different source and possibly different
    description wording -- so title+company, normalized, is a better dedupe
    key here than a hash of the whole row would be.
    """
    normalized = f"{listing['title'].strip().lower()}|{listing['company'].strip().lower()}"
    normalized = re.sub(r"\s+", " ", normalized)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:16]


if __name__ == "__main__":
    listings = scrape_all_boards()
    for listing in listings:
        listing["dedupe_key"] = dedupe_key(listing)

    fieldnames = ["title", "company", "location", "description", "source", "dedupe_key"]
    with open("listings.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(listings)
    print(f"Saved {len(listings)} raw listings (before dedup) to listings.csv")
