---
title: "Newsletter Builder"
description: "Build and send newsletters with Markdown templates, subscriber management, and analytics."
difficulty: "beginner"
estimatedMinutes: 45
tags: ["markdown", "email", "templates", "data-management", "pandas"]
learningObjectives:
  - Write and render Markdown templates with variable substitution
  - Build a subscriber management system with CSV storage
  - Track email opens and click-through rates
  - Run A/B tests on subject lines
prerequisites:
  - Basic Python functions and loops
  - Understanding of dictionaries and lists
  - Familiarity with pip/uv for installing packages
---

# Newsletter Builder

Build and send newsletters with Markdown templates, subscriber management, and analytics. You'll learn to create a repeatable content pipeline that handles subscribers, tracks engagement, and tests what works.

## What You'll Learn

- How to write Markdown templates with variable substitution
- How to manage subscriber lists with segmentation and tagging
- How to track email opens and click-through rates
- How to run A/B tests on subject lines to improve engagement

## What You'll Build

A Python tool that:

- Renders newsletters from Markdown templates with dynamic variables
- Manages subscriber lists stored as CSV files with tags and segments
- Generates open-rate and click-rate analytics from tracking data
- Runs A/B tests on subject lines and reports which version performed better

## Where to Run It

This project runs anywhere Python is available. You can use:

- **JupyterLite playground** — paste code blocks into cells and run them in the browser
- **Local with uv** — install dependencies and run from your terminal
- **Google Colab** — click the Colab badge on the project page to run in a cloud notebook

## Setup

Create a new project and install dependencies:

```bash
uv init newsletter-builder
cd newsletter-builder
uv add pandas
```

The `re` and `csv` modules come with Python. We will use pandas for subscriber analytics and CSV handling.

## Step 1 — Create a Markdown Template Engine

Build a simple template engine that replaces `{{variable}}` placeholders with values from a dictionary.

```python
import re
from datetime import datetime

def render_template(template: str, variables: dict) -> str:
    """Replace {{variable}} placeholders with values from the variables dict."""
    def replacer(match):
        key = match.group(1).strip()
        return str(variables.get(key, f"[MISSING: {key}]"))

    return re.sub(r"\{\{(.+?)\}\}", replacer, template)

# Example newsletter template
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

# Render with sample data
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

The `re.sub` approach is simple and readable. For a production system you might use Jinja2, but this keeps things dependency-free.

## Step 2 — Manage Subscribers with CSV

Build functions to add, remove, filter, and segment subscribers stored in a CSV file.

```python
import csv
import os

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

# Set up subscribers
create_subscriber_file()
add_subscriber("alice@example.com", "Alice", ["python", "data-science"])
add_subscriber("bob@example.com", "Bob", ["python", "web-dev"])
add_subscriber("carol@example.com", "Carol", ["data-science"])

subscribers = load_subscribers()
print(f"\nAll subscribers: {len(subscribers)}")
print(f"Python subscribers: {len(filter_by_tag(subscribers, 'python'))}")
print(f"Data science subscribers: {len(filter_by_tag(subscribers, 'data-science'))}")
```

Tags let you segment your audience. When sending a newsletter you can filter to only Python subscribers or only data-science subscribers.

## Step 3 — Track Opens and Clicks

Build a simple tracking system that logs events to a CSV file and generates analytics.

```python
import pandas as pd

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
            # 30% of openers click a link
            if random.random() < 0.3:
                log_event(sub["email"], issue, "click", "https://example.com/article")

def generate_analytics(filepath: str = "tracking.csv") -> pd.DataFrame:
    """Generate analytics summary from tracking data."""
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
        total = df["subscriber_email"].nunique()
        open_rate = (opens / total * 100) if total > 0 else 0
        click_rate = (clicks / total * 100) if total > 0 else 0

        print(f"\n  Issue: {issue}")
        print(f"    Opens:       {opens}/{total} ({open_rate:.1f}%)")
        print(f"    Clicks:      {clicks}/{total} ({click_rate:.1f}%)")

    return df

# Simulate and analyze
simulate_tracking(subscribers, "Issue #42")
analytics = generate_analytics()
```

The tracking CSV grows over time. The `generate_analytics` function reads it into a pandas DataFrame for easy aggregation and filtering.

## Step 4 — A/B Test Subject Lines

Split subscribers into two groups and compare open rates for different subject lines.

```python
def ab_test_subject_lines(
    subscribers: list[dict],
    subject_a: str,
    subject_b: str,
    issue: str = "A/B Test",
) -> dict:
    """Run an A/B test by splitting subscribers and measuring open rates."""
    import random
    random.seed()

    # Split subscribers randomly
    shuffled = subscribers.copy()
    random.shuffle(shuffled)
    mid = len(shuffled) // 2
    group_a = shuffled[:mid]
    group_b = shuffled[mid:]

    print(f"\n  A/B Test: Subject Line Comparison")
    print(f"  " + "=" * 50)
    print(f"  Version A: {subject_a}")
    print(f"  Version B: {subject_b}")
    print(f"  Group A: {len(group_a)} subscribers")
    print(f"  Group B: {len(group_b)} subscribers")

    # Simulate opens for each group
    for sub in group_a:
        if random.random() < 0.45:  # 45% open rate for A
            log_event(sub["email"], f"{issue}-A", "open")

    for sub in group_b:
        if random.random() < 0.62:  # 62% open rate for B
            log_event(sub["email"], f"{issue}-B", "open")

    # Calculate results
    df = pd.read_csv("tracking.csv")
    a_data = df[df["newsletter_issue"] == f"{issue}-A"]
    b_data = df[df["newsletter_issue"] == f"{issue}-B"]

    opens_a = len(a_data[a_data["event_type"] == "open"])
    opens_b = len(b_data[b_data["event_type"] == "open"])

    rate_a = (opens_a / len(group_a) * 100) if group_a else 0
    rate_b = (opens_b / len(group_b) * 100) if group_b else 0

    results = {
        "subject_a": subject_a,
        "subject_b": subject_b,
        "open_rate_a": round(rate_a, 1),
        "open_rate_b": round(rate_b, 1),
        "winner": "B" if rate_b > rate_a else "A",
    }

    print(f"\n  Results:")
    print(f"    Version A open rate: {rate_a:.1f}%")
    print(f"    Version B open rate: {rate_b:.1f}%")
    print(f"    Winner: Version {results['winner']}")

    return results

results = ab_test_subject_lines(
    subscribers,
    subject_a="This Week in Python",
    subject_b="5 Python Tricks You Missed Last Week",
)
```

A/B testing helps you learn what resonates with your audience. The version with the higher open rate should become your default going forward.

## 🧩 Challenges

### Challenge 1 — Build a Newsletter Archive

Write a function that saves each rendered newsletter to a dated file (for example, `newsletter_2024-03-15.html`). Build an index page that links to all past issues.

### Challenge 2 — Add Unsubscribe Handling

Write a function that reads the tracking CSV, finds any "unsubscribe" events, and updates the subscriber's status to "unsubscribed" in the subscribers CSV. Then filter them out of future sends.

### Challenge 3 — Build a Segment Builder

Create a class that lets you define segments with rules like `tag=python AND status=active`. Store segments as named JSON files so you can reuse them across newsletters.

## Stretch Goals

- [ ] Add drip campaign automation for subscriber onboarding sequences
- [ ] Build a drag-and-drop visual editor alongside Markdown using a local web server
- [ ] Implement integration with popular email service providers (Mailchimp, SendGrid)
- [ ] Generate a weekly analytics dashboard with matplotlib charts showing growth trends

## What You Learned

You built a Markdown template engine, managed subscribers with CSV storage and segmentation, tracked opens and clicks for analytics, and ran A/B tests on subject lines. These patterns form the foundation of any email marketing or newsletter system in Python.
