---
title: "Build an SEO Analyzer"
description: "Analyze websites for SEO issues, meta tags, headings, keyword density, and structured reports."
difficulty: "intermediate"
estimatedMinutes: 55
tags: ["requests", "beautifulsoup4", "seo", "web-scraping", "pandas"]
learningObjectives:
  - Fetch and parse web pages to extract SEO-relevant elements
  - Audit meta tags, Open Graph data, and heading hierarchy
  - Calculate keyword density and content scores
  - Generate structured comparison reports with pandas
prerequisites:
  - "Python basics (functions, dicts, lists)"
  - "HTML basics (tags, attributes, nesting)"
  - "Comfort with `requests` or willingness to learn it in the setup"
---

# 🔍 Build an SEO Analyzer

Every website has invisible SEO signals, meta descriptions, heading hierarchy, Open Graph tags, that determine whether search engines rank it well or bury it. This project builds a toolkit that fetches any URL, extracts those signals, scores them against best practices, and generates a structured report you can compare across multiple pages, all with pure Python libraries that run anywhere.

This assumes Python basics, HTML basics, and the `requests` library (covered in Setup), nothing from Data Analysis is required. It's optional and ungraded; see [Real-World Projects](/projects) for the full, growing list.

## 🎯 What you'll do

1. Fetch any URL and parse its HTML with `requests` and BeautifulSoup.
2. Extract and validate meta tags, titles, and Open Graph data.
3. Audit heading structure for proper H1–H6 hierarchy.
4. Calculate keyword density and content relevance scores.
5. Generate a side-by-side comparison report across multiple pages with pandas.

## Where to run this

This project works almost anywhere, `requests`, `BeautifulSoup`, and `pandas` are all pure Python with no system-level dependencies.

**JupyterLite playground** works well: paste the code cells directly into a notebook. You'll need to `!pip install requests beautifulsoup4 pandas lxml` in a cell first.

**Google Colab** works out of the box, all three libraries are pre-installed on Colab's runtime.

**Locally with `uv`** is the recommended path for building a real project with files, not just cells, follow the Setup section below.

**Binder and Kaggle Notebooks** also work, since no GPU or native dependencies are needed.

- **Run it in your browser.** An interactive companion notebook is ready, open it in Colab, Kaggle, or Binder and follow along top-to-bottom.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/seo-analyzer/notebook.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/seo-analyzer/notebook.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fseo-analyzer%2Fnotebook.ipynb)

## Setup

Everything you need before writing a line of analysis.

### Install `uv`

`uv` is a single tool that replaces the usual "install Python, then install pip, then install a virtual environment tool, then install packages" chain, it can install and manage Python versions itself, alongside your project's dependencies.

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

### Set up the project

```bash
uv init seo-analyzer
cd seo-analyzer
uv add requests beautifulsoup4 pandas lxml
```

`requests` fetches web pages; `beautifulsoup4` parses HTML into a navigable tree; `lxml` is a fast parser backend for BeautifulSoup; `pandas` builds the comparison reports. All four are pure Python, no compiler, no system libraries needed.

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `seo-analyzer/` exists with a `pyproject.toml`, and all four packages are installed.
- ✅ `uv run python -c "import requests, bs4, pandas; print('all good')"` prints `all good`.

## Step 1: Fetch a page and extract meta tags

The first building block: given a URL, fetch its HTML and pull out the SEO-critical metadata, title, description, Open Graph tags, that search engines and social platforms read.

### 1.1 Write the fetcher and meta extractor

```python
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse

def fetch_page(url: str) -> BeautifulSoup:
    """Fetch a URL and return a parsed BeautifulSoup tree."""
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

soup = fetch_page("https://example.com")
meta = extract_meta(soup, "https://example.com")
print(f"Title: {meta['title']!r} ({meta['title_length']} chars)")
print(f"Description: {meta['description'][:80]!r} ({meta['desc_length']} chars)")
```

**👟 Starter hint:** `fetch_page` sends a request with a custom `User-Agent` header (good practice, it identifies your crawler) and returns a BeautifulSoup object. `extract_meta` then uses `soup.find()` to pull specific tags: `<title>`, `<meta name="description">`, and the three `og:` tags. Each extraction handles the "tag missing" case gracefully by returning an empty string.

**🎯 Expected output:**
```
Title: 'Example Domain' (14 chars)
Description: '' (0 chars)
```

**🩹 If it's off:** A `requests.exceptions.ConnectionError` means the URL is wrong or unreachable, try `https://example.com` first (it's always up). A `Timeout` means the server took longer than 10 seconds, increase the timeout or try a faster site. If `title` is empty where you expected content, the page might be JavaScript-rendered (BeautifulSoup can't see it), try a server-rendered page instead.

### 1.2 Verify the meta extraction

**✅ Checklist**

- ✅ `fetch_page("https://example.com")` returns a BeautifulSoup object without errors.
- ✅ `extract_meta` returns a dict with keys `title`, `title_length`, `description`, `desc_length`, and all three `og_*` fields.
- ✅ A non-existent URL raises a clear error, not a confusing traceback from deep inside `requests`.

**🤔 Socratic Question(s)**

- The `User-Agent` header says `SEOAnalyzer/1.0`. What would happen if you removed it entirely, would most servers reject the request? Why do well-behaved crawlers identify themselves?
- BeautifulSoup with `lxml` can parse malformed HTML. What would happen with `"html.parser"` (the built-in) instead, would you notice a difference on a well-formed page? On a broken one?

## Step 2: Audit heading hierarchy

Heading tags (`<h1>` through `<h6>`) tell search engines the document structure, a page with no `<h1>`, or with `<h3>` directly after `<h1>` (skipping `<h2>`), signals poor structure. This step builds a checker that counts every heading level and flags structural issues.

### 2.1 Build the heading analyzer

```python
def analyze_headings(soup: BeautifulSoup) -> dict:
    """Audit heading hierarchy for SEO best practices."""
    headings = {}
    for level in range(1, 7):
        headings[f"h{level}"] = [
            tag.get_text(strip=True)[:80] for tag in soup.find_all(f"h{level}")
        ]

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

    return {
        "headings": headings,
        "h1_count": h1_count,
        "total_headings": sum(len(v) for v in headings.values()),
        "issues": issues,
    }

heading_data = analyze_headings(soup)
print(f"H1 count: {heading_data['h1_count']}, Total: {heading_data['total_headings']}")
for issue in heading_data["issues"]:
    print(f"  ⚠ {issue}")
```

**👟 Starter hint:** The function loops through `h1` to `h6`, collects all tags at each level, then applies two rules: exactly one `<h1>` per page, and no skipped heading levels. `used_levels` tracks which levels actually appear, if `h1` and `h3` both appear but `h2` doesn't, that's a skipped level. The `[:80]` slice keeps the report readable when headings are long.

**🎯 Expected output:** For `https://example.com` (which has no headings):
```
H1 count: 0, Total: 0
  ⚠ Missing H1 tag — every page should have exactly one H1
```

**🩹 If it's off:** If `total_headings` is 0 for a page you know has headings, the page might be JavaScript-rendered, BeautifulSoup only sees the initial HTML, not content loaded after page load. If the skipped-level check fires unexpectedly, confirm that `used_levels` is pulling from the right keys, a typo like `"h7"` in the range would silently shift the min/max.

### 2.2 Verify the heading audit

**✅ Checklist**

- ✅ `analyze_headings(soup)` returns a dict with `headings`, `h1_count`, `total_headings`, and `issues`.
- ✅ A page with no headings returns `h1_count=0` and includes the "Missing H1" issue.
- ✅ You can explain why exactly one `<h1>` is the SEO standard (not zero, not multiple).

**🤔 Socratic Question(s)**

- A page has `<h1>Title</h1>` then `<h3>Section</h3>` with no `<h2>` in between. Your analyzer flags this as a skipped level. Why do search engines care about heading hierarchy being consecutive, even though HTML doesn't enforce it?
- What would happen if you searched for headings inside `<script>` or `<style>` tags? Would that change the count? How does `get_text(strip=True)` help or not help here?

## Step 3: Calculate keyword density and content metrics

Keyword density tells you how often a specific word appears relative to the total word count, too low and the page isn't about that topic; too high and it reads like keyword stuffing. This step also strips out non-visible content (scripts, navbars, footers) before counting, so the numbers reflect what a human reader actually sees.

### 3.1 Build the content analyzer and keyword checker

```python
import re

def keyword_density(text: str, keyword: str) -> dict:
    """Calculate keyword density in visible page text."""
    words = re.findall(r"\b\w+\b", text.lower())
    total_words = len(words)
    if total_words == 0:
        return {"keyword": keyword, "count": 0, "density": 0.0, "total_words": 0}
    count = sum(1 for w in words if w == keyword.lower())
    return {
        "keyword": keyword,
        "count": count,
        "density": round(count / total_words * 100, 2),
        "total_words": total_words,
    }

def analyze_content(soup: BeautifulSoup) -> dict:
    """Extract visible text and compute basic content metrics."""
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    text = soup.get_text(separator=" ", strip=True)
    words = re.findall(r"\b\w+\b", text)
    return {"text": text, "word_count": len(words), "char_count": len(text)}

content = analyze_content(soup)
print(f"Word count: {content['word_count']}")

for kw in ["example", "domain", "web"]:
    d = keyword_density(content["text"], kw)
    print(f"  '{kw}': {d['count']} occurrences ({d['density']}%)")
```

**👟 Starter hint:** `analyze_content` uses `soup.decompose()` to remove non-visible tags (`script`, `style`, `nav`, `footer`, `header`) before extracting text, this prevents navigation links and boilerplate from inflating your word count. `keyword_density` then does a case-insensitive word-boundary match (`\b\w+\b`) for the exact keyword, and divides by total words. A 1–3% density is typically healthy; above 5% looks like stuffing.

**🎯 Expected output:** For `https://example.com`:
```
Word count: <some number around 20-40>
  'example': <count> occurrences (<density>%)
  'domain': <count> occurrences (<density>%)
  'web': <count> occurrences (<density>%)
```

**🩹 If it's off:** If `word_count` is suspiciously high (thousands), `decompose()` didn't remove enough, the page might use `<div>` wrappers around navigation instead of `<nav>`. If `keyword_density` returns `0.0` for a word you can see on the page, the word might be split across tags or wrapped in a `<span>`, `get_text()` joins text from nested tags, but `\b\w+\b` won't match across tag boundaries.

### 3.2 Verify the content analysis

**✅ Checklist**

- ✅ `analyze_content(soup)` returns `text`, `word_count`, and `char_count`, all non-zero for a page with visible content.
- ✅ `keyword_density` returns `count=0` and `density=0.0` for a word that doesn't appear on the page.
- ✅ The `decompose()` call removes `<script>`, `<style>`, `<nav>`, `<footer>`, and `<header>` tags before text extraction.

**🤔 Socratic Question(s)**

- You're counting word frequency with exact match (`w == keyword.lower()`). What would change if you wanted to match "web" inside "website", would that be better or worse for SEO analysis, and why?
- A page has 500 words of visible text and 5,000 words inside `<script>` tags. Why is stripping the scripts important for keyword density, and what other non-visible content would you add to the removal list?

## Step 4: Generate a scoring report

The payoff: combine meta extraction, heading audit, and content analysis into one scoring function that produces a single number (0–100) for any URL, then compare multiple pages side by side in a pandas DataFrame.

### 4.1 Build the scoring function

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
    return {
        "url": url,
        "meta": meta,
        "headings": headings,
        "content": content,
        "scores": scores,
        "overall_score": round(overall, 1),
    }

report = analyze_url("https://example.com")
print(f"\n{'='*50}\nSEO Report: {report['url']}\n{'='*50}")
print(f"Overall Score: {report['overall_score']}/100")
for cat, score in report["scores"].items():
    print(f"  {cat}: {score}/10")
```

**👟 Starter hint:** The scoring rubric is deliberate: title length gets 10 points if it's in the 30–60 sweet spot (5 if it exists but is wrong length, 0 if missing), description gets 10 if it's 120–160 characters (Google's display range), H1 gets 10 only if there's exactly one, and OG tags get 10 each for the three you check. `overall_score` divides the sum by the maximum possible (50) and multiplies by 100.

**🎯 Expected output:**
```
==================================================
SEO Report: https://example.com
==================================================
Overall Score: <number>/100
  title: <score>/10
  description: <score>/10
  h1: <score>/10
  headings: <score>/10
  og_tags: <score>/10
```

**🩹 If it's off:** If `overall_score` is 0.0 for a page you know has some SEO elements, one of the sub-scores is zeroing out, check `meta["title_length"]` and `headings["h1_count"]` individually. If `scores["og_tags"]` is 0 for a page with Open Graph tags, verify the `property="og:*"` attribute name matches exactly (some sites use `name=` instead of `property=`).

### 4.2 Build the comparison DataFrame

```python
import pandas as pd

def compare_urls(urls: list[str]) -> pd.DataFrame:
    """Audit multiple URLs and return a comparison table."""
    results = []
    for url in urls:
        try:
            r = analyze_url(url)
            results.append({
                "URL": url,
                "Score": r["overall_score"],
                "Title": r["meta"]["title"][:40],
                "Title Len": r["meta"]["title_length"],
                "Desc Len": r["meta"]["desc_length"],
                "H1 Count": r["headings"]["h1_count"],
                "Words": r["content"]["word_count"],
            })
        except Exception as e:
            results.append({"URL": url, "Score": 0, "Error": str(e)})
    return pd.DataFrame(results)

df = compare_urls(["https://example.com", "https://python.org"])
print(df.to_string(index=False))
```

**👟 Starter hint:** `compare_urls` wraps `analyze_url` in a try/except so one failing URL doesn't kill the whole comparison, it logs the error in the DataFrame instead. The DataFrame columns are deliberately flat (strings and numbers, not nested dicts) so pandas can sort, filter, and export them without extra wrangling.

**🎯 Expected output:** A pandas DataFrame with two rows (one per URL), columns for `Score`, `Title`, `Title Len`, `Desc Len`, `H1 Count`, and `Words`.

**🩹 If it's off:** If the DataFrame shows `Error` in the `Score` column for one URL, that site blocked or timed out, try a different URL. If `compare_urls` takes a long time, it's running sequentially, see the Common Pitfalls section for a note on parallel fetching.

### 4.3 Verify the scoring report

**✅ Checklist**

- ✅ `analyze_url("https://example.com")` returns a dict with `url`, `meta`, `headings`, `content`, `scores`, and `overall_score`.
- ✅ `overall_score` is between 0 and 100, and each sub-score is between 0 and 10.
- ✅ `compare_urls` returns a DataFrame where each row is one URL and each column is one metric.

**🤔 Socratic Question(s)**

- A page with a perfect title (30–60 chars) and a missing description scores 50/100. A page with both perfect scores 70/100. What does this tell you about the relative weight of description vs title in this rubric, and would you change those weights for a real audit tool?
- If you ran `compare_urls` on 50 URLs and one timed out, it appears as `Score=0` with an `Error` column. Is `Score=0` the right default for a failed fetch, or would you use `NaN`, and what would change in the DataFrame if you used `NaN`?

## ⚠️ Common pitfalls

- **JavaScript-rendered pages return empty or wrong content.** `requests` + BeautifulSoup only see the initial HTML, any content loaded by JavaScript (single-page apps, lazy-loaded images) won't appear in the parsed tree. If a page looks empty but works in your browser, it's JS-rendered; use a headless browser (Playwright, Selenium) instead, or pick a server-rendered page for testing.
- **Blocking or rate-limiting on repeated requests.** Some sites block aggressive crawling. The 10-second timeout and custom `User-Agent` help, but if you're auditing many pages, add `time.sleep(1)` between requests or use `concurrent.futures.ThreadPoolExecutor` with a bounded pool to stay polite.
- **Fragile `og:` tag matching.** The code uses `property="og:title"`, some sites use `name="og:title"` instead (technically wrong per the Open Graph spec, but common). If OG tags are missing on a site you know has them, try also searching for `name=` variants.
- **Word count includes boilerplate.** The `decompose()` list removes `script`, `style`, `nav`, `footer`, `header`, but not all boilerplate lives in those tags. A page with a large `<aside>` or `<div class="sidebar">` full of links will inflate the word count. For more precise counts, you'd need site-specific selectors.

## What you just built

An SEO audit toolkit that fetches any URL, extracts its meta tags and heading structure, scores them against established best practices, and produces a comparison table across multiple pages, all with four pure-Python libraries and no browser automation. The scoring rubric is simple enough to understand and extend, and the `compare_urls` function gives you a pandas DataFrame ready for sorting, filtering, or exporting to CSV.

:::tip[Run a fuller version without any local setup]
[`examples/seo-analyzer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/seo-analyzer) in the course repo is a fuller version with image alt-text auditing, internal/external link classification, and a sitemap crawler that audits every page listed in a sitemap XML. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) and run it from there.
:::

## Where to go from here

- Add image alt-text auditing: find every `<img>` tag, report which ones are missing `alt`, and calculate the percentage of images with alt text, a direct accessibility and SEO win.
- Add internal vs external link classification: extract all `<a href>` links, count each category, and flag pages with too few internal links (below 3) as a potential SEO issue.
- Build a sitemap crawler: given a sitemap URL, fetch every page listed in it, run the full audit on each, and export a summary CSV with `concurrent.futures.ThreadPoolExecutor` for parallel fetching.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓
