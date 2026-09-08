---
title: "Build a Newsletter Builder"
description: "Turn a Markdown template into personalized issues for real subscribers: render with regex, manage a CSV list with tags, track opens and clicks, A/B-test subject lines, and ship a personalized issue to one segment."
difficulty: "intermediate"
estimatedMinutes: 60
tags: ["markdown", "email", "templates", "data-management", "pandas"]
learningObjectives:
  - Render Markdown templates with {{variable}} substitution
  - Manage a CSV subscriber list with tags and segmentation
  - Track opens and clicks and compute honest open/click rates
  - Run A/B tests on subject lines and read the winner
  - Render one personalized issue per subscriber in a segment
prerequisites:
  - "Python basics (functions, loops, dictionaries)"
  - "CSV basics and installing packages with uv"
---

# 🛠️ 📰 Build a Newsletter Builder

Every email list faces the same pipeline: take a template, fill it in for each subscriber, track who opened and clicked, and figure out what subject line actually works. This project builds that pipeline in Python — a regex template engine, a CSV subscriber list with tags, an open/click tracker that computes honest rates, an A/B test for subject lines, and a final step that renders a personalized issue for every subscriber in a segment.

This assumes Python 101 and comfort with functions, dictionaries, and lists — you'll meet pandas in one step, but nothing beyond that is required. It's optional and ungraded; see [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Build a template engine that replaces `{{placeholders}}` in a Markdown newsletter with values from a dictionary.
2. Manage a CSV subscriber list with tags so you can address just the Python readers, not everyone.
3. Log opens and clicks and compute open/click rates against the real audience size.
4. Run an A/B test on two subject lines and pick a winner from the data.
5. Render one personalized issue per subscriber into its own file.

## Where to run this

**Locally with `uv`** is the primary path. The only external dependency is `pandas`, which you'll use once, for the analytics step — everything else is the standard library (`re`, `csv`, `os`, `datetime`), and the CSV files you generate are first-class citizens of your own folder.

**Google Colab, Binder, and Kaggle Notebooks** run the whole thing identically: `!pip install pandas` once, then every step below, with the notebook returning the same rendered issues and analytics tables. **JupyterLite** can run the template and subscriber steps in the browser, and pandas is available there too — the honest caveat is the same as everywhere in this series: files created in the browser live on an ephemeral virtual filesystem, so treat it as a try-it path and use local `uv` when you want `subscribers.csv` and `issues/` to actually persist.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/newsletter-builder/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/newsletter-builder/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fnewsletter-builder%2Fnotebook.ipynb)

## Setup

Create the project and install the single dependency you'll use for analytics.

```bash
uv init newsletter-builder
cd newsletter-builder
uv add pandas
```

The `re` and `csv` modules ship with Python, so `pandas` is the only package in this project — and it arrives exactly once, in Step 3's analytics. Installing everything up front keeps later steps about the *ideas* (templates, tracking, testing) rather than about dependency wrangling.

**✅ Checklist**

- ✅ `uv add pandas` finished and `uv run python -c "import pandas"` exits silently.
- ✅ Create an empty `newsletter-builder/` project that runs a one-line script.

## Step 1: Render a Markdown template

A newsletter that changes for every reader starts from a template with holes in it. The holes are `{{curly}}` placeholders, and this step builds the tiny engine that swaps them for real values — the dependency-free core of a system that would otherwise pull in a full templating library.

### 1.1 Write the render function

**👟 Starter hint:** Use one `re.sub` call with a callback that looks each placeholder up in a dictionary, and decide explicitly what happens when a placeholder is missing.

```python
# newsletter.py
import re

def render_template(template: str, variables: dict) -> str:
    """Replace {{variable}} placeholders with values from the variables dict."""
    def replacer(match):
        key = match.group(1).strip()
        return str(variables.get(key, f"[MISSING: {key}]"))

    return re.sub(r"\{\{(.+?)\}\}", replacer, template)

print(render_template(
    "Hello {{name}}, this is issue {{issue}}.",
    {"name": "Alice", "issue": "42"},
))
print(render_template("Hi {{name}}!", {}))
```

The single line that does all the work is `re.sub(r"\{\{(.+?)\}\}", replacer, template)`. The pattern `\{\{(.+?)\}\}` matches an opening `{{`, captures anything inside, then closes at the first `}}` — the `.+?` is *non-greedy*, so it stops early instead of swallowing across multiple placeholders. For each match, the callback `replacer` looks up the captured key in `variables`, and `str(...)` coerces non-string values (like the integer `42`) so templates never crash on a number. The explicit `variables.get(key, "[MISSING: {key}]")` fallback is a design decision: a missing variable becomes a *visible* marker rather than a silent `None`.

**🎯 Expected output:** First print: `Hello Alice, this is issue 42.` Second print: `Hi [MISSING: name]!`

**🩹 If it's off:** If output shows `None` in place of values, `str()` wrapping is missing on the lookup. If placeholders survive literally in the output, the regex escaped braces are wrong — `\{\{` not `{{`. If *every* variable shows missing, the keys in `variables` and the names in the template differ (check for a stray space after `{{` — which is why `.strip()` is there).

### 1.2 Render a real issue from a template

**👟 Starter hint:** Write the newsletter as one triple-quoted Markdown string, give it every placeholder in the dict, and print the fully rendered issue.

```python
# newsletter.py (continued)
from datetime import datetime

NEWSLETTER_TEMPLATE = """# {{title}}

**Issue #{{issue_number}}** | {{date}}

---

## Hello {{subscriber_name}}!

{{intro}}

### This Week's Highlights

{{highlights}}

### Featured Article

**{{article_title}}**

{{article_summary}}

---

*You received this because you subscribed to {{newsletter_name}}.*
*Unsubscribe: {{unsubscribe_url}}*
"""

variables = {
    "title": "Weekly Python Tips",
    "issue_number": "42",
    "date": datetime.now().strftime("%B %d, %Y"),
    "subscriber_name": "Reader",
    "intro": "Welcome to this week's edition of Python Tips. Here is what we covered.",
    "highlights": "- List comprehensions\n- Decorator patterns\n- Type hints deep dive",
    "article_title": "Understanding Decorators",
    "article_summary": "Decorators let you modify function behavior without changing the function itself.",
    "newsletter_name": "Python Tips Weekly",
    "unsubscribe_url": "https://example.com/unsubscribe",
}

rendered = render_template(NEWSLETTER_TEMPLATE, variables)
print(rendered)
```

The template is data, not code — it even includes Markdown bullet items inside `{{highlights}}`, because the value is inserted *verbatim* and the surrounding Markdown is what gives it structure. Rendering and content are fully separated: edit the template, tweak the dict, or both, without touching the render function. The `{{date}}` value is computed once, at render time, so two readers of the same issue see the same date.

**🎯 Expected output:** A complete Markdown issue printed under an `# Weekly Python Tips` H1, with the date filled in, three highlight bullets, and the subscribe/unsubscribe footer.

**🩹 If it's off:** If the output contains a raw `{{...}}`, that placeholder is missing from `variables` and the dictionary has a typo — the `[MISSING: ...]` fallback from 1.1 would have told you, unless the key genuinely differs in spelling. If bullets are missing, the `highlights` value doesn't contain the `\n`-joined lines.

### 1.3 Verify the template engine

**✅ Checklist**

- ✅ Unknown placeholders render as `[MISSING: key]`, never as `None`.
- ✅ Non-string values (numbers, dates) render without error.
- ✅ The full newsletter template renders end to end with every placeholder filled.

**🤔 Socratic Question(s)**

- The pattern uses non-greedy `.+?`. What would change in the rendered output if you wrote `\{\{(.+)\}\}` (greedy) instead, in a template containing *two* placeholders on one line?
- The fallback for a missing variable is a visible `[MISSING: ...]` string. When is silently inserting an empty string the *better* behavior — and what kind of template bug would that choice hide?

## Step 2: Manage subscribers with CSV

A list of people is a flat table: one row per subscriber, a few columns per row. CSV is the plainest honest storage for that — it's human-readable, opens in any spreadsheet, and the `csv` module handles quoting for you. This step builds add/load/segment functions around one subscriber file.

### 2.1 Create and add subscribers

**👟 Starter hint:** Define a fixed set of column names once, reuse it for both the header and every row, and let `datetime` stamp the subscription date.

```python
# newsletter.py (continued)
import csv
import os
from datetime import datetime

SUBSCRIBER_FIELDS = ["email", "name", "tags", "subscribed_at", "status"]

def create_subscriber_file(filepath: str = "subscribers.csv"):
    """Create a new subscriber CSV file with headers."""
    with open(filepath, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=SUBSCRIBER_FIELDS)
        writer.writeheader()
    print(f"Created subscriber file: {filepath}")

def add_subscriber(email: str, name: str, tags: list[str], filepath: str = "subscribers.csv"):
    """Add a subscriber to the CSV file."""
    row = {
        "email": email,
        "name": name,
        "tags": ";".join(tags),
        "subscribed_at": datetime.now().isoformat(),
        "status": "active",
    }

    file_exists = os.path.exists(filepath)
    with open(filepath, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=SUBSCRIBER_FIELDS)
        if not file_exists:
            writer.writeheader()
        writer.writerow(row)
    print(f"Added subscriber: {email}")

create_subscriber_file()
add_subscriber("alice@example.com", "Alice", ["python", "data-science"])
add_subscriber("bob@example.com", "Bob", ["python", "web-dev"])
add_subscriber("carol@example.com", "Carol", ["data-science"])
```

The `tags` column stores a list as a semicolon-joined string, `";".join(tags)` — CSV cells are flat, so a multi-valued field has to be packed somehow, and `;` is chosen because commas are already the column separator. The `file_exists` check is the subtle correctness detail: appending with `"a"` to an *existing* file must not write a second header row, while a *fresh* file created without a header would have no column names at all. `csv.DictWriter` writes rows by the column names, which guarantees every row matches every other row's shape.

**🎯 Expected output:** `Created subscriber file: subscribers.csv` followed by three `Added subscriber: ...` lines, and a CSV whose header is `email,name,tags,subscribed_at,status` with three data rows.

**🩹 If it's off:** If the CSV has a header after every row, each call is writing headers because `file_exists` is evaluated against a stale path or the file is deleted between calls. If a tag contains a comma, `.join` didn't cause breakage *because the csv module quotes that field* — but if you see the row split, you hand-built the row as a raw string instead of using `DictWriter`. If a timestamp is missing, the `datetime.now().isoformat()` assignment is absent from the row dict.

### 2.2 Load and segment the list

**👟 Starter hint:** Read the file back with `csv.DictReader` and filter by unpacking the packed tags — or by comparing a single status column.

```python
# newsletter.py (continued)
def load_subscribers(filepath: str = "subscribers.csv") -> list[dict]:
    """Load all subscribers from the CSV file."""
    if not os.path.exists(filepath):
        return []
    with open(filepath, "r") as f:
        reader = csv.DictReader(f)
        return list(reader)

def filter_by_tag(subscribers: list[dict], tag: str) -> list[dict]:
    """Filter subscribers who have a specific tag."""
    return [s for s in subscribers if tag in s.get("tags", "").split(";")]

def filter_by_status(subscribers: list[dict], status: str) -> list[dict]:
    """Filter subscribers by status (active, unsubscribed, bounced)."""
    return [s for s in subscribers if s.get("status") == status]

subscribers = load_subscribers()
print(f"All subscribers: {len(subscribers)}")
print(f"Python subscribers: {len(filter_by_tag(subscribers, 'python'))}")
print(f"Data science subscribers: {len(filter_by_tag(subscribers, 'data-science'))}")
```

`csv.DictReader` turns each CSV row into a dict keyed by the header names — the exact inverse of the `DictWriter` from 2.1, so load and save are symmetric by construction. The two filters are tiny list comprehensions, but they're built on the earlier packing choice: `s.get("tags", "").split(";")` unpacks the stored string back into a list so the `in` membership test is per-tag, not a sloppy substring match (which would falsely match "python" against "python3🐍"). Keeping the filters as separate named functions means you can compose them — a later step combines `filter_by_tag` and `filter_by_status` in one expression.

**🎯 Expected output:** `All subscribers: 3`, `Python subscribers: 2`, `Data science subscribers: 2` — Alice and Bob carry the `python` tag, Alice and Carol the `data-science` tag.

**🩹 If it's off:** If Python subscribers shows `0`, the `.split(";")` step is missing and membership is being tested against the raw wire string. If loading crashes on a file with an unexpected header, the file was created by something other than this project's functions. If loads return an empty list, the working directory differs from where `subscribers.csv` lives — absolute paths or a fixed relative path fix that.

### 2.3 Verify the subscriber list

**✅ Checklist**

- ✅ The CSV has exactly one header row and three data rows.
- ✅ `load_subscribers()` returns three dicts, each with the five fields.
- ✅ Tag filtering returns 2, 1, or 0 exactly matching how you tagged people.

**🤔 Socratic Question(s)**

- Tags are packed with `;`, and filters unpack with `.split(";")`. What would go wrong if a tag name *itself* contained a semicolon — and where in the pipeline would that ambiguity first surface?
- `add_subscriber` writes a header only when the file is new. Why is that branch better than always calling `create_subscriber_file()` first — and what happens to the two functions' outputs if a caller does both anyway?

## Step 3: Track opens and clicks

Email providers report opens and clicks because they tell you whether a subject line was worth reading. This project doesn't send real email, so you'll log the same event stream a real mailer produces — subscriber, issue, event type, timestamp, URL — and then read it back with pandas to compute rates that mean something.

### 3.1 Log events to a tracking CSV

**👟 Starter hint:** One `log_event` function appends a single row to a growing tracking file — the same shape a real email service would emit, just written by you.

```python
# newsletter.py (continued)
TRACK_FIELDS = ["subscriber_email", "newsletter_issue", "event_type", "timestamp", "url"]

def log_event(email: str, issue: str, event_type: str, url: str = "", filepath: str = "tracking.csv"):
    """Log an email event (open, click, bounce)."""
    row = {
        "subscriber_email": email,
        "newsletter_issue": issue,
        "event_type": event_type,
        "timestamp": datetime.now().isoformat(),
        "url": url,
    }

    file_exists = os.path.exists(filepath)
    with open(filepath, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=TRACK_FIELDS)
        if not file_exists:
            writer.writeheader()
        writer.writerow(row)

def simulate_tracking(subscribers: list[dict], issue: str):
    """Simulate opens and clicks for demonstration purposes."""
    import random
    random.seed(42)

    for sub in subscribers:
        if random.random() < 0.7:  # 70% open rate
            log_event(sub["email"], issue, "open")
            if random.random() < 0.3:  # 30% of openers click the link
                log_event(sub["email"], issue, "click", "https://pyda.example/article")

simulate_tracking(subscribers, "Issue #42")
```

The tracker is append-only: every event is one row, and rows are never edited — that's the shape of a log, and it's what makes the analytics in 3.2 meaningful later. `simulate_tracking` stands in for a real mailer, and the calls to `log_event` it makes are exactly what a production service's webhook would produce. `random.seed(42)` makes the simulation reproducible, so the numbers you see are the numbers every learner sees — which makes the expected output below verifiable rather than vibes.

**🎯 Expected output:** A `tracking.csv` file created with the five headers and several event rows: some subscribers opened (and a couple also clicked) Issue #42.

**🩹 If it's off:** If `tracking.csv` never appears, `simulate_tracking` wasn't called, or the working directory was recreated after setup. If events have no timestamp, the `datetime` import from Step 1 is missing in this chunk's scope. If the file racks up duplicate headers, the `file_exists` branch is logging to an existing file but writing the header anyway.

### 3.2 Compute honest open and click rates

**👟 Starter hint:** Load the tracking log with `pandas.read_csv`, group by issue, and divide by the *actual audience size* — pass the real subscriber count in, so rates aren't inflated by counting only the people who showed up.

```python
# newsletter.py (continued)
import pandas as pd

def generate_analytics(filepath: str = "tracking.csv", total_subscribers: int = 0) -> pd.DataFrame:
    """Compute per-issue open and click rates from the tracking log."""
    if not os.path.exists(filepath):
        print("No tracking data found.")
        return pd.DataFrame()

    df = pd.read_csv(filepath)

    print("\n  Newsletter Analytics")
    print("  " + "=" * 50)

    for issue in df["newsletter_issue"].unique():
        issue_data = df[df["newsletter_issue"] == issue]
        opens = len(issue_data[issue_data["event_type"] == "open"])
        clicks = len(issue_data[issue_data["event_type"] == "click"])
        total = total_subscribers or len(df["subscriber_email"].unique())
        open_rate = (opens / total * 100) if total > 0 else 0
        click_rate = (clicks / total * 100) if total > 0 else 0

        print(f"\n  Issue: {issue}")
        print(f"    Opens:       {opens}/{total} ({open_rate:.1f}%)")
        print(f"    Clicks:      {clicks}/{total} ({click_rate:.1f}%)")

    return df

simulate_tracking(subscribers, "Issue #42")
analytics = generate_analytics(total_subscribers=len(subscribers))
```

The line that carries the whole step is `total = total_subscribers or len(...)`. The denominator of a rate decides whether it's honest: dividing opens by **everyone the issue was sent to** gives the real open rate; dividing by the 2 people who happened to open inflates it to ~100% and teaches nothing. Filtering with pandas — `df["newsletter_issue"] == issue` and `df["event_type"] == "open"` — produces boolean masks, and `len` of the masked frame counts matching rows, which is the idiomatic pandas way to count without looping. The `or` fallback keeps the function usable on a file with no known audience size.

**🎯 Expected output:** An analytics block for `Issue #42` — with 3 subscribers, something like `Opens: 2/3 (66.7%)` and `Clicks: 1/3 (33.3%)`, each rate this issue's events divided by 3.

**🩹 If it's off:** If open rates read `100.0%`, `total_subscribers` isn't being passed (or the `or` fallback kicked in because you passed `0`). If multiple issues appear when you expected one, earlier runs left events in `tracking.csv` — the log is append-only on purpose; delete the file for a clean slate. If you get `FileNotFoundError`, `simulate_tracking` ran on the wrong path or never ran — run 3.1 first.

### 3.3 Verify the tracking step

**✅ Checklist**

- ✅ `tracking.csv` contains one row per event (no duplicated headers, no hand-edited rows).
- ✅ `generate_analytics(total_subscribers=len(subscribers))` prints per-issue open and click rates.
- ✅ The open rate is computed against the send audience, not only against openers.

**🤔 Socratic Question(s)**

- The code deliberately prefers `total_subscribers or len(df['subscriber_email'].unique())` over just the unique-emails count. When would those two numbers *disagree* — and which of them produces a misleadingly high open rate?
- A tracking log is append-only: rows are never updated or deleted. What kind of answer becomes *impossible* to give correctly with an append-only log if a subscriber unsubscribes and re-subscribes under the same email?

## Step 4: A/B-test subject lines

You can't argue someone into opening your email, but you can measure it. An A/B test splits the audience in two, sends subject line A to one half and B to the other, and lets the open rates decide. This step runs that experiment with the tracking machinery you just built.

### 4.1 Split the list and simulate the test

**👟 Starter hint:** Shuffle a copy of the subscriber list, split it at the midpoint into two groups, then log opens for each group under *distinct* issue labels so the analytics can tell them apart.

```python
# newsletter.py (continued)
import random

def ab_test_subject_lines(
    subscribers: list[dict],
    subject_a: str,
    subject_b: str,
    issue: str = "A/B Test",
) -> dict:
    """Run an A/B test by splitting subscribers and measuring open rates."""
    shuffled = subscribers.copy()
    random.shuffle(shuffled)
    mid = len(shuffled) // 2
    group_a = shuffled[:mid]
    group_b = shuffled[mid:]

    print(f"\n  A/B Test: Subject Line Comparison")
    print(f"  Version A: {subject_a}")
    print(f"  Version B: {subject_b}")
    print(f"  Group A: {len(group_a)} subscribers")
    print(f"  Group B: {len(group_b)} subscribers")

    for sub in group_a:
        if random.random() < 0.45:  # 45% open rate for A
            log_event(sub["email"], f"{issue}-A", "open")

    for sub in group_b:
        if random.random() < 0.62:  # 62% open rate for B
            log_event(sub["email"], f"{issue}-B", "open")

    df = pd.read_csv("tracking.csv")
    opens_a = len(df[(df["newsletter_issue"] == f"{issue}-A") & (df["event_type"] == "open")])
    opens_b = len(df[(df["newsletter_issue"] == f"{issue}-B") & (df["event_type"] == "open")])

    rate_a = (opens_a / len(group_a) * 100) if group_a else 0
    rate_b = (opens_b / len(group_b) * 100) if group_b else 0

    results = {
        "subject_a": subject_a,
        "subject_b": subject_b,
        "open_rate_a": round(rate_a, 1),
        "open_rate_b": round(rate_b, 1),
        "winner": "B" if rate_b > rate_a else "A",
    }

    print(f"  Version A open rate: {rate_a:.1f}%")
    print(f"  Version B open rate: {rate_b:.1f}%")
    print(f"  Winner: Version {results['winner']}")
    return results

results = ab_test_subject_lines(
    subscribers,
    subject_a="This Week in Python",
    subject_b="5 Python Tricks You Missed Last Week",
)
```

The crucial decision is tagging each group's events with a *different* issue label (`A/B Test-A` vs `A/B Test-B`) instead of both writing `open` rows you can't tell apart later. The wolf in this step is the `&` in `df[(df["newsletter_issue"] == f"{issue}-A") & (df["event_type"] == "open")]`: pandas requires the element-wise `&` (not Python's `and`) because each comparison produces an array of booleans, and `and` can't evaluate arrays. The `shuffled = subscribers.copy()` prevents the shuffle from reordering the list other functions still rely on.

**🎯 Expected output:** A test banner, group sizes that sum to the audience, two open rates (B's near 62%, A's near 45%), a `winner: "B"`, and a `results` dict with both rounded rates.

**🩹 If it's off:** If you get `ValueError: The truth value of a DataFrame is ambiguous`, a bare `and` has leaked into the mask expression — both filters must join with `&` and each be parenthesized. If both groups are the same size as the whole list, the list wasn't spliced (`[:mid]`/`[mid:]`) from the shuffled copy. If rates are exactly 0, the events were logged under labels that don't match the read-back labels — compare `f"{issue}-A"` in both places character by character.

### 4.2 Reason about the result

**👟 Starter hint:** Before re-running, ask what the numbers are *allowed to say* given how small the sample is — the winner is only as trustworthy as the denominator.

**🎯 Expected output:** A `results` dict with `winner` matching whichever rate was higher, and a one-sentence explanation of whether you'd bet your next send on that winner.

**🩹 If it's off:** If a second run flips the winner, that's not a bug — it's the honest behavior of a small, unseeded sample. If that surprises you, this is the point: with three-person groups, 45% vs 62% is noise, and the fix (bigger audiences, or repeat runs) is part of the learning, not a code problem.

### 4.3 Verify the A/B test

**✅ Checklist**

- ✅ Group A and group B sizes sum to the full subscriber count.
- ✅ Events for the two versions are distinguishable in `tracking.csv` by their issue labels.
- ✅ The computed `results` dict contains both rates and a winner, and `tracking.csv` was not double-written with duplicate headers.

**🤔 Socratic Question(s)**

- `random.shuffle` operates on the list in place, which is why 4.1 copies it first. What would `subscribers.copy()` actually protect, given that the list holds *dictionaries* — does it copy the dicts too? (Hint: try mutating one subscriber after the copy.)
- The winner is `"B" if rate_b > rate_a else "A"` — note A wins ties. With this audience of three, would you trust that tiebreaker? What would a real experiment need (a p-value, a bigger `n`, a confidence interval) before you'd change your default subject line on it?

## Step 5: Ship one issue to a segment

Now the pipeline closes its loop: pick a segment (say, active Python readers), render the template once *per subscriber* with their own name, and write each personalized issue to its own file. Everything from Steps 1 and 2 comes together in a single reusable function.

### 5.1 Render and write personalized issues

**👟 Starter hint:** Compose your existing filters into one segment, then render the template repeatedly with per-person variables via a dict merge — and let the email address generate safe filenames.

```python
# newsletter.py (continued)
from pathlib import Path

def render_issue_to_files(subscribers: list[dict], template: str, variables: dict, out_dir: str = "issues") -> list[str]:
    """Render one personalized issue per subscriber and write it to disk."""
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    paths = []
    for sub in subscribers:
vars_for_sub = {**variables, "subscriber_name": sub.get("name", ""), "email": sub["email"]}
        rendered = render_template(template, vars_for_sub)
        safe_name = sub["email"].split("@")[0]
        path = out / f"{safe_name}.md"
        path.write_text(rendered)
        paths.append(str(path))
    return paths

targets = filter_by_status(filter_by_tag(load_subscribers(), "python"), "active")
written = render_issue_to_files(targets, NEWSLETTER_TEMPLATE, variables)
print(f"Rendered {len(written)} personalized issues into issues/")
print(open(written[0]).read())
```

The line `vars_for_sub = {**variables, "subscriber_name": sub["name"], "email": sub["email"]}` is dict merging: it copies the shared variables then *overrides* the per-person keys, so the same base for everyone becomes personal for each person — the template's `Hello {{subscriber_name}}!` greets the actual reader. Composing filters (`filter_by_status(filter_by_tag(...))`) is the payoff of 2.2's named, composable functions: segmenting is just nesting them. The filename comes from `sub["email"].split("@")[0]`, which turns an email into a filesystem-safe stem, and `Path.write_text` makes the file I/O a one-liner.

**🎯 Expected output:** `Rendered 2 personalized issues into issues/` and the first file prints as a complete issue greeting `Hello Alice!` — with the same body as every other issue but that one line personalized.

**🩹 If it's off:** If every file says `Hello Reader!`, the per-person override is losing to `variables` — check the merge order in `vars_for_sub` (overrides come *after* the shared dict). If a subscriber has an empty `name`, the greeting reads `Hello !` — `sub.get("name", "")` returns an empty string for a blank CSV cell, and `[MISSING: subscriber_name]` only appears for a genuinely absent key. If `written[0]` has the wrong audience, the composed segment filters are pulling the wrong tag.

### 5.2 Verify the person-alized send

**✅ Checklist**

- ✅ Only subscribers matching the segment (e.g. active + `python` tag) get files in `issues/`.
- ✅ Each file greets its own subscriber by name and shares the same issue body.
- ✅ `issues/` contains no stray files from earlier runs the loop didn't touch.

**🤔 Socratic Question(s)**

- The per-person merge lives *inside* the loop, but the shared `variables` dict sits outside it. What would change about the rendered date if the `datetime.now()` call ran once inside the loop for every subscriber instead — and why is "computed once, not per identity" generally the right call?
- The merge is `{**variables, "subscriber_name": <name>, "email": <email>}` — order matters. If `variables` itself already contained a `subscriber_name` key, does the merge override it, and how would you *intentionally* keep the template's default for subscribers missing a name?

## ⚠️ Common pitfalls

- **Greedy regex swallowing many placeholders.** `\{\{(.+?)\}\}` needs the non-greedy `?` — with plain `.+` a two-placeholder line collapses into one bogus match. Fix: keep `+?`, and test with two placeholders on one line as 1.1 does.
- **Unsplittable tag matching.** If you test `tag in s["tags"]` without `split(";")`, "python" substring-matches "python3🐍" and false positives leak into segments. Fix: always unpick the packed field with `.split(";")` before membership.
- **Duplicate headers in log files.** Appending with `"a"` and writing a header every time corrupts `tracking.csv` and `subscribers.csv`. Fix: gate `writeheader()` behind the `os.path.exists` check exactly as written in 2.1/3.1.
- **`and` instead of `&` in pandas filters.** `df["event_type"] == "open" and ...` raises `ValueError: The truth value of a DataFrame is ambiguous`. Fix: parenthesize each comparison and join with `&`.
- **Rates computed against the wrong denominator.** Dividing opens by *openers* (unique-emails in the log) inflates open rates toward 100%. Fix: pass the real audience count (`total_subscribers=len(subscribers)`), as 3.2 does.

## What you just built

A complete newsletter pipeline, end to end: a regex template engine that fills Markdown issues, a CSV subscriber manager with tag-based segmentation, an honest open/click analytics step, a subject-line A/B test, and a final pass that writes a personalized issue per reader. The transferable skill is *the content pipeline*: template + data + segment + measure are the same four blocks behind real ESP integrations (Mailchimp, SendGrid), marketing automation, and every "send a report to the right people weekly" script you'll write on a job.

:::tip[Run a fuller version without any local setup]
[`examples/newsletter-builder/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/newsletter-builder) in the course repo ships the complete pipeline with an unsubscribe handler and a named segment class. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Add **unsubscribe handling**: scan `tracking.csv` for `"unsubscribe"` events and flip that subscriber's status to `unsubscribed` in `subscribers.csv` — you already have `filter_by_status` waiting for exactly that value.
- Build an **issue archive**: change `render_issue_to_files` to write each issue under a dated filename (`newsletter-2026-09-06.md`) and emit an `index.md` listing every past issue — `datetime.now().strftime("%Y-%m-%d")` is the whole trick.
- Make a **named segment catalog**: store segment rules like `tag=python AND status=active` as little JSON files and evaluate them with the two filters — the "rules as data" pattern that turns one-off scripts into a system.
- Draw a **growth chart**: read `subscribers.csv` and plot `subscribed_at` counts over time with matplotlib — a one-`value_counts` step plus `plot()` that turns the subscriber list into a trend line.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python that builds its own audience. 🎓