---
id: job-aggregator
title: "Build a Job-Listing Aggregator"
sidebar_label: "Job-Listing Aggregator"
slug: /projects/job-aggregator
description: "Scrape multiple job-board-style sources, dedupe listings across them, and alert on new matches against a keyword filter — with requests/BeautifulSoup and pandas, no API key needed."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Build a Job-Listing Aggregator

<ProjectPublishedDate projectId="2027-job-aggregator" />

<ProjectGreeting />

[Scrape and Analyze a Live Website](/docs/projects/scrape-analyze) fetched one site and turned its HTML into a CSV. Real job hunting means watching *several* sources at once, none of which agree on markup, and caring only about what's genuinely new since you last checked. This project builds that: parse listings out of a handful of differently-structured "job board" pages, combine them into one table, dedupe the postings that show up on more than one board, filter to the roles that match a keyword you care about, and alert only on new matches — not the same ten listings every single run. It assumes Python 101-level Python and, for the dedupe/filter step, Data Analysis-level pandas comfort — filtering, `drop_duplicates`, boolean masks.

This is optional and ungraded. See [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Parse a single job-listing page's HTML into structured fields with BeautifulSoup.
2. Write one small parser per source and combine several differently-structured sources into one table.
3. Dedupe listings that were posted to more than one board, using pandas.
4. Filter by keyword and print/save only the matches that are new since the last run.

## Where to run this

**Locally with `uv`** is the path this lesson's steps follow, and the recommended one — it's real Python running on your own machine, the same "graduate to real Python" move as every other project in this section. The Setup section below walks through installing it.

**GitHub Codespaces** is a zero-setup alternative if you'd rather not install anything locally yet: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed, per the repo's `.devcontainer/devcontainer.json`) and run the exact same `uv` commands from a terminal in your browser tab.

**Google Colab, Kaggle Notebooks, or Binder** are a genuinely good fit for this particular project — no GPU, no API key, no long-running process to manage, and the whole pipeline fits comfortably in a handful of cells. A real, runnable notebook version (the same parsers, dedupe key, and keyword filter as the steps below) lives at [`examples/job-aggregator/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/add-job-aggregator-project/examples/job-aggregator/notebook.ipynb). Click a badge to launch it directly, no local install at all (these currently point at this project's own branch — they'll point at `main` once it's merged):

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/add-job-aggregator-project/examples/job-aggregator/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/add-job-aggregator-project/examples/job-aggregator/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/add-job-aggregator-project?filepath=examples%2Fjob-aggregator%2Fnotebook.ipynb)

Be honest with yourself about the tradeoff, though: this is a lower-fidelity way to experience the project than a real local `uv` project — no separate files, no real project structure, just cells in a notebook. Treat it as a quick way to experiment, not the primary path.

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
uv init job-aggregator
cd job-aggregator
uv add beautifulsoup4 pandas
```

No API key, no free-tier signup, nothing to configure before you can run a single line of code.

## A note on what this project scrapes

Real job boards — LinkedIn, Indeed, and similar sites — explicitly forbid automated scraping in their terms of service, actively fingerprint and block scrapers, and change their markup often enough that any lesson built against them would break within months. None of that is a good foundation for a course project meant to keep working for years.

Instead, this project ships with its own small **bundled sample dataset**: three static HTML files under [`examples/job-aggregator/sample_data/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/add-job-aggregator-project/examples/job-aggregator/sample_data), each styled like a different toy "job board" (`board_alpha.html`, `board_beta.html`, `board_gamma.html`), each using genuinely different HTML for its listings — a div-and-span card layout, a bulleted list, and a plain `<table>`. Two of the ten listings across them are the same job posted to more than one board, on purpose, so there's something real to dedupe. You're parsing real HTML with real BeautifulSoup calls the entire way through — the only difference from scraping a live site is that `requests.get()` is replaced by reading a local file, so the lesson never depends on some external site's uptime, markup, or tolerance for being scraped.

:::tip[Always check robots.txt and terms of service before scraping any real site]
If you extend this project to point at a real, live job board or any other real site, check that site's `robots.txt` (e.g. `https://example.com/robots.txt`) and terms of service first. `robots.txt` states which parts of a site automated tools are and aren't allowed to fetch. Many job boards go further and explicitly prohibit scraping in their terms — read those, not just `robots.txt`, since a site can permit a URL in `robots.txt` while still forbidding automated access in its terms of service.
:::

## Step 1: Parse a single listing page into structured fields

Open [`board_alpha.html`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/add-job-aggregator-project/examples/job-aggregator/sample_data/board_alpha.html) in a text editor. Each listing sits inside a `<div class="job-card">`, with the title in an `<h2 class="job-title">`, the company in a `<span class="company">`, the location in a `<span class="location">`, and a description in a `<p class="description">`. That's the same `find`/`find_all` pattern from Scrape and Analyze a Live Website, just applied to a local file instead of a live response:

```python
# aggregate.py
from pathlib import Path

from bs4 import BeautifulSoup

html = Path("sample_data/board_alpha.html").read_text(encoding="utf-8")
soup = BeautifulSoup(html, "html.parser")

for card in soup.find_all("div", class_="job-card"):
    title = card.find("h2", class_="job-title").get_text(strip=True)
    company = card.find("span", class_="company").get_text(strip=True)
    location = card.find("span", class_="location").get_text(strip=True)
    description = card.find("p", class_="description").get_text(strip=True)
    print(f"{title} @ {company} ({location})")
```

```bash
uv run python aggregate.py
```

You should see four printed lines, one per listing on Alpha's board.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python aggregate.py` runs without errors.</StepChecklistItem>
<StepChecklistItem>It prints exactly 4 lines, one per listing in `board_alpha.html`.</StepChecklistItem>
<StepChecklistItem>Each line has a real title, company, and location — not `None` or an empty string.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- `.get_text(strip=True)` strips leading/trailing whitespace from a tag's text. What could go wrong two steps from now, when you compare titles across boards for deduping, if you left `strip=True` off?
- Every field here is required by the parser (`card.find(...)` immediately calls `.get_text(...)` on the result). What happens if one listing on a differently-formatted board is missing its location `<span>` entirely? Where exactly would that fail, and how would the error message help you find it?

## Step 2: Parse multiple sources and combine them

`board_beta.html` and `board_gamma.html` hold the same *kind* of data — title, company, location, description — but neither uses Alpha's markup. Beta lists jobs as `<li class="listing">` items with an `<a class="position-title">`; Gamma lists them as `<tr class="job-row">` table rows with plain `<td>` cells. A single "one selector fits all boards" scraper doesn't exist — instead, write one small parser function per source, each returning the exact same shape of dict, so the rest of the pipeline never has to know which board a listing came from:

```python
# aggregate.py (continued)
def parse_board_alpha(html):
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


PARSERS = {
    "board_alpha.html": parse_board_alpha,
    "board_beta.html": parse_board_beta,
    "board_gamma.html": parse_board_gamma,
}


def scrape_all_boards():
    all_listings = []
    for filename, parser in PARSERS.items():
        html = (Path("sample_data") / filename).read_text(encoding="utf-8")
        all_listings.extend(parser(html))
    return all_listings


if __name__ == "__main__":
    listings = scrape_all_boards()
    print(f"Parsed {len(listings)} raw listings from {len(PARSERS)} boards")
```

```bash
uv run python aggregate.py
```

You should see 10 raw listings total (4 + 3 + 3) — "raw" because nothing has been deduped yet.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`scrape_all_boards()` returns 10 listings.</StepChecklistItem>
<StepChecklistItem>Every listing dict has the same five keys (`title`, `company`, `location`, `description`, `source`), regardless of which board it came from.</StepChecklistItem>
<StepChecklistItem>The `source` field correctly identifies which board each listing came from.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- `PARSERS` maps a filename to a function. What would you need to add to support a fourth board, without changing `scrape_all_boards` at all?
- `parse_board_gamma` accesses `cells[0]`, `cells[1]`, etc. by position instead of by class name, unlike the other two parsers. What would silently break if Gamma's table added a new first column (say, a posting date) without you noticing?

## Step 3: Dedupe listings with pandas

Two of the ten listings are the exact same job, posted on two different boards: a "Senior Python Developer" role at Northwind Analytics appears on both Alpha and Beta, and a "Data Analyst" role at Contoso Retail appears on both Alpha and Gamma. Left alone, a downstream alert would report the same opening twice. The fix is a dedupe key — something stable enough to recognize "the same job" across sources even though the wording of the description differs slightly board to board:

```python
# aggregate.py (continued)
import hashlib
import re

import pandas as pd


def dedupe_key(listing):
    """A stable id for "the same job", independent of which board posted it."""
    normalized = f"{listing['title'].strip().lower()}|{listing['company'].strip().lower()}"
    normalized = re.sub(r"\s+", " ", normalized)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:16]


listings = scrape_all_boards()
for listing in listings:
    listing["dedupe_key"] = dedupe_key(listing)

df = pd.DataFrame(listings)
before = len(df)
df = df.drop_duplicates(subset="dedupe_key", keep="first").reset_index(drop=True)
print(f"Deduped {before} listings -> {len(df)} unique jobs ({before - len(df)} duplicate posting(s) removed)")

df.to_csv("listings.csv", index=False)
```

```bash
uv run python aggregate.py
```

You should see "Deduped 10 listings -> 8 unique jobs (2 duplicate posting(s) removed)".

The dedupe key here is normalized `title + company` text, not a hash of the entire row — deliberately. Hashing the whole row (including `description`) would treat Alpha's and Beta's slightly differently-worded descriptions of the same job as two *different* jobs, defeating the point.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`aggregate.py` prints "2 duplicate posting(s) removed".</StepChecklistItem>
<StepChecklistItem>`listings.csv` has exactly 8 rows (plus the header).</StepChecklistItem>
<StepChecklistItem>The Northwind Analytics "Senior Python Developer" row and the Contoso Retail "Data Analyst" row each appear exactly once in `listings.csv`.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- `drop_duplicates(..., keep="first")` keeps whichever row happens to come first in the DataFrame. For these two duplicate jobs, which board's copy gets kept, and does it matter which one wins here? When *would* it matter?
- If two different companies happened to post two different jobs with the exact same title (e.g. two unrelated "Data Analyst" openings), would this dedupe key incorrectly merge them? Why or why not?

## Step 4: Filter by keyword and alert on new matches

The last step is the "alert" half of the project: filter the deduped listings to ones matching a keyword, then remember what you've already alerted on so a second run against the same data doesn't repeat itself:

```python
# filter_alerts.py
import json
from pathlib import Path

import pandas as pd

SEEN_FILE = Path("seen.json")
KEYWORDS = ["python"]


def load_seen():
    if SEEN_FILE.exists():
        return set(json.loads(SEEN_FILE.read_text(encoding="utf-8")))
    return set()


def save_seen(dedupe_keys):
    SEEN_FILE.write_text(json.dumps(sorted(dedupe_keys)), encoding="utf-8")


def keyword_filter(df, keywords):
    pattern = "|".join(keywords)
    text = df["title"].str.cat(df["description"], sep=" ")
    return df[text.str.contains(pattern, case=False, regex=True, na=False)]


if __name__ == "__main__":
    df = pd.read_csv("listings.csv")
    matches = keyword_filter(df, KEYWORDS)
    print(f"{len(matches)} unique listing(s) match keywords {KEYWORDS}")

    seen = load_seen()
    new_matches = matches[~matches["dedupe_key"].isin(seen)]

    if new_matches.empty:
        print("No new matches since the last run.")
    else:
        print(f"\n{len(new_matches)} NEW match(es):\n")
        for _, row in new_matches.iterrows():
            print(f"- {row['title']} @ {row['company']} ({row['location']}) [{row['source']}]")
        new_matches.to_csv("new_matches.csv", index=False)

    save_seen(seen | set(matches["dedupe_key"]))
```

```bash
uv run python filter_alerts.py
```

The first run should report 6 new matches (every listing whose title or description mentions "python"). Run it again without changing anything, and it should report zero new matches — `seen.json` remembers what it already alerted on, exactly like a real scheduled aggregator checking in every morning would need to.

:::tip[A keyword filter is just the simplest version of "match against what I care about"]
`str.contains` with a `|`-joined pattern is intentionally the simplest possible filter — good enough to prove the alerting logic works. A more realistic version might match against several keyword *groups* (e.g. "python" OR "django" for backend roles, "remote" as a separate required filter on `location`), or score a match by how many keywords hit rather than treating it as pass/fail. Get the simple version working first; the matching logic is the easiest part to swap out later.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>The first run of `filter_alerts.py` reports 6 new matches and creates `new_matches.csv`.</StepChecklistItem>
<StepChecklistItem>A second run, with no changes to `listings.csv`, reports "No new matches since the last run."</StepChecklistItem>
<StepChecklistItem>Deleting `seen.json` and running again brings back all 6 matches as "new."</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- If a listing's `description` were missing (`NaN` after a `pd.read_csv`), what would `text.str.contains(..., na=False)` do with that row, and why does `na=False` matter here specifically?
- `seen` is stored as a JSON list of dedupe keys, loaded fresh from disk on every run. What would happen to the "no repeat alerts" guarantee if two copies of this script ran concurrently and both read `seen.json` before either had a chance to write it back?

## ⚠️ Common pitfalls

- **Writing one universal parser instead of one per source.** It's tempting to try a single set of selectors that "mostly works" across boards. It won't — Alpha, Beta, and Gamma don't share a single class name. One small function per source, all returning the same dict shape, is less code overall than fighting a one-size-fits-all selector.
- **Deduping on the wrong key.** Hashing the entire listing (including `description`) means two postings of the same job with slightly different wording never match, defeating the point of deduping at all. Pick a key that's stable across *how* a job is described, not just *whether* it's word-for-word identical.
- **Losing the "new since last run" state between runs.** Without something like `seen.json` persisted to disk, every run re-reports every match as new, which is exactly the noisy behavior a real alert should avoid. This is also the first place a real cron job or background process differs from a one-off script: state has to survive between invocations, not just live in a variable.
- **Forgetting `na=False` in a pandas string filter.** `Series.str.contains` on a column with any missing values raises or produces `NaN` results without it, which can silently drop rows out of a boolean mask in ways that are easy to miss.

## What you just built

A complete parse → combine → dedupe → filter → alert pipeline: real HTML parsing across multiple differently-structured sources, a dedupe strategy that survives near-duplicate wording, and a keyword alert that remembers what it already told you. Point the same four steps at a different set of scraping-friendly sources (after checking their `robots.txt` and terms of service) and the pipeline doesn't change — only the per-source parser functions do.

## Where to go from here

- Wire up a real notification instead of printing to the terminal — `smtplib` for an email, or a webhook `POST` to a Discord or Slack channel, fired only for `new_matches`.
- Schedule the whole pipeline to run periodically (a cron job, GitHub Actions on a schedule, or a simple loop with `time.sleep()`) so it checks for new listings on its own instead of by hand.
- Score matches instead of treating the keyword filter as pass/fail — e.g. count how many of several keyword groups a listing hits, and sort `new_matches` by that score before alerting.
- Swap the CSV/JSON files for a small SQLite database (Python's built-in `sqlite3` module) once you're tracking enough history to want to query it — e.g. "how many new Python listings appeared each week this month?"

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

<ProjectProgressCheckbox projectId="2027-job-aggregator" />
