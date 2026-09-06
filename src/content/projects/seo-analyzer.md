---
title: "SEO Analyzer"
description: "Analyze websites for SEO issues — meta tags, headings, performance, and keyword optimization."
difficulty: "intermediate"
estimatedMinutes: 55
tags: ["requests", "beautifulsoup4", "seo", "web-scraping", "pandas"]
learningObjectives:
  - "Fetch and parse web pages to extract SEO-relevant elements"
  - "Audit meta tags, Open Graph data, and heading hierarchy"
  - "Calculate keyword density and content scores"
  - "Generate structured reports from crawl data"
prerequisites: ["Python basics", "HTML basics", "Requests library"]
---

# SEO Analyzer

## What You'll Learn
- Fetch web pages and parse HTML with BeautifulSoup
- Extract and validate meta tags, titles, and Open Graph data
- Analyze heading structure for proper H1–H6 hierarchy
- Calculate keyword density and content relevance
- Generate structured reports using pandas DataFrames

## What You'll Build
An SEO analysis toolkit that can:
- Fetch any URL and extract all SEO-critical metadata
- Validate title length, description length, and heading structure
- Score content for keyword density and readability
- Compare multiple pages side by side in a pandas report

## Where to Run It
This project works in **JupyterLite**, **Google Colab**, and **locally with `uv`**. All libraries (requests, BeautifulSoup, pandas) are pure Python and run anywhere.

## Setup

```bash
# Create the project
uv init seo-analyzer && cd seo-analyzer

# Add dependencies
uv add requests beautifulsoup4 pandas lxml

uv run python main.py
```

```python
# Also works in JupyterLite / Colab — all libraries are pure Python
import requests
from bs4 import BeautifulSoup
import pandas as pd
```

## Step 1 — Fetch and Parse a Page

```python
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse

def fetch_page(url: str) -> BeautifulSoup:
    """Fetch a URL and return a BeautifulSoup object."""
    try:
        headers = {"User-Agent": "SEOAnalyzer/1.0 (Educational Project)"}
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return BeautifulSoup(response.text, "lxml")
    except requests.exceptions.Timeout:
        print(f"Timeout fetching {url}")
        raise
    except requests.exceptions.HTTPError as e:
        print(f"HTTP error: {e}")
        raise
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        raise

def extract_meta(soup: BeautifulSoup, url: str) -> dict:
    """Extract SEO-relevant metadata from a parsed page."""
    title_tag = soup.find("title")
    title = title_tag.get_text(strip=True) if title_tag else ""

    desc_tag = soup.find("meta", attrs={"name": "description"})
    description = desc_tag["content"] if desc_tag and desc_tag.get("content") else ""

    # Open Graph tags
    og_title = soup.find("meta", property="og:title")
    og_desc = soup.find("meta", property="og:description")
    og_image = soup.find("meta", property="og:image")

    return {
        "url": url,
        "domain": urlparse(url).netloc,
        "title": title,
        "title_length": len(title),
        "description": description,
        "desc_length": len(description),
        "og_title": og_title["content"] if og_title and og_title.get("content") else "",
        "og_description": og_desc["content"] if og_desc and og_desc.get("content") else "",
        "og_image": og_image["content"] if og_image and og_image.get("content") else "",
    }

# Analyze a page
soup = fetch_page("https://example.com")
meta = extract_meta(soup, "https://example.com")
print(f"Title: {meta['title']!r} ({meta['title_length']} chars)")
print(f"Description: {meta['description'][:80]!r} ({meta['desc_length']} chars)")
```

## Step 2 — Analyze Heading Structure

```python
def analyze_headings(soup: BeautifulSoup) -> dict:
    """Audit heading hierarchy for SEO best practices."""
    headings = {}
    for level in range(1, 7):
        headings[f"h{level}"] = [tag.get_text(strip=True)[:80] for tag in soup.find_all(f"h{level}")]

    h1_count = len(headings["h1"])
    issues = []
    if h1_count == 0:
        issues.append("Missing H1 tag — every page should have exactly one H1")
    elif h1_count > 1:
        issues.append(f"Multiple H1 tags ({h1_count}) — use only one per page")

    used_levels = [int(k[1]) for k, v in headings.items() if v]
    if used_levels:
        full_range = set(range(min(used_levels), max(used_levels) + 1))
        if not full_range.issubset(set(used_levels)):
            issues.append(f"Skipped heading levels: h{sorted(full_range - set(used_levels))}")

    return {"headings": headings, "h1_count": h1_count,
            "total_headings": sum(len(v) for v in headings.values()), "issues": issues}

heading_data = analyze_headings(soup)
print(f"H1 count: {heading_data['h1_count']}, Total: {heading_data['total_headings']}")
for issue in heading_data["issues"]:
    print(f"  ⚠ {issue}")
```

## Step 3 — Calculate Keyword Density

```python
import re

def keyword_density(text: str, keyword: str) -> dict:
    """Calculate keyword density in page text."""
    words = re.findall(r'\b\w+\b', text.lower())
    total_words = len(words)
    if total_words == 0:
        return {"keyword": keyword, "count": 0, "density": 0.0, "total_words": 0}
    count = sum(1 for w in words if w == keyword.lower())
    return {"keyword": keyword, "count": count, "density": round(count / total_words * 100, 2), "total_words": total_words}

def analyze_content(soup: BeautifulSoup) -> dict:
    """Extract visible text and compute basic content metrics."""
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    text = soup.get_text(separator=" ", strip=True)
    words = re.findall(r'\b\w+\b', text)
    return {"text": text, "word_count": len(words), "char_count": len(text)}

content = analyze_content(soup)
print(f"Word count: {content['word_count']}")

# Check keyword density
for kw in ["example", "domain", "web"]:
    d = keyword_density(content["text"], kw)
    print(f"  '{kw}': {d['count']} occurrences ({d['density']}%)")
```

## Step 4 — Generate a Full Report

```python
def analyze_url(url: str) -> dict:
    """Run a complete SEO audit on a single URL."""
    soup = fetch_page(url)
    meta = extract_meta(soup, url)
    headings = analyze_headings(soup)
    content = analyze_content(soup)

    scores = {}
    scores["title"] = 10 if 30 <= meta["title_length"] <= 60 else 5 if meta["title_length"] > 0 else 0
    scores["description"] = 10 if 120 <= meta["desc_length"] <= 160 else 5 if meta["desc_length"] > 0 else 0
    scores["h1"] = 10 if headings["h1_count"] == 1 else 0
    scores["headings"] = min(10, headings["total_headings"])
    scores["og_tags"] = sum(10 for k in ["og_title", "og_description", "og_image"] if meta[k])

    overall = sum(scores.values()) / (len(scores) * 10) * 100
    return {"url": url, "meta": meta, "headings": headings, "content": content, "scores": scores, "overall_score": round(overall, 1)}

# Audit and print scores
report = analyze_url("https://example.com")
print(f"\n{'='*50}\nSEO Report: {report['url']}\n{'='*50}")
print(f"Overall Score: {report['overall_score']}/100")
for cat, score in report["scores"].items():
    print(f"  {cat}: {score}/10")

# Build a comparison table
def compare_urls(urls: list[str]) -> pd.DataFrame:
    results = []
    for url in urls:
        try:
            r = analyze_url(url)
            results.append({"URL": url, "Score": r["overall_score"], "Title": r["meta"]["title"][:40],
                            "Title Len": r["meta"]["title_length"], "Desc Len": r["meta"]["desc_length"],
                            "H1 Count": r["headings"]["h1_count"], "Words": r["content"]["word_count"]})
        except Exception as e:
            results.append({"URL": url, "Score": 0, "Error": str(e)})
    return pd.DataFrame(results)

df = compare_urls(["https://example.com", "https://python.org"])
print(df.to_string(index=False))
```

## 🧩 Challenges

<details>
<summary><strong>Challenge 1: Add image alt-text auditing</strong></summary>

Write a function that finds all `<img>` tags and reports which ones are missing `alt` attributes. Calculate the percentage of images with alt text and flag accessibility issues.
</details>

<details>
<summary><strong>Challenge 2: Check for internal vs external links</strong></summary>

Extract all `<a href>` links, classify them as internal or external, and compute the ratio. Flag pages with too few internal links (below 3) as a potential SEO issue.
</details>

<details>
<summary><strong>Challenge 3: Build a sitemap crawler</strong></summary>

Given a sitemap URL, fetch all pages listed in it, run the full audit on each, and generate a summary CSV with scores. Use `concurrent.futures.ThreadPoolExecutor` for parallel fetching.
</details>

## Stretch Goals
- [ ] Add backlink analysis and domain authority scoring
- [ ] Build a competitor SEO comparison report
- [ ] Implement automated fix suggestions with priority ranking
- [ ] Add page speed analysis using Lighthouse or PageSpeed Insights API
- [ ] Build a historical tracking system that saves scores over time

## What You Learned
- Fetching and parsing web pages with requests and BeautifulSoup
- Extracting and validating meta tags and Open Graph data
- Auditing heading hierarchy for SEO compliance
- Calculating keyword density and content relevance scores
- Generating comparison reports with pandas DataFrames
- Building a structured audit pipeline with scoring rubrics
