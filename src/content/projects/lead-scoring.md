---
title: "Build a Lead Scoring Engine"
description: "Score and prioritize sales leads based on engagement, demographics, and behavior signals."
difficulty: "intermediate"
---
# 🎯 Build a Lead Scoring Engine

Sales teams drown in leads. A lead scoring engine ranks them by how likely each is to convert, so the team calls the hot ones first. This project builds a scoring model that combines engagement, demographic, and behavior signals, then prioritizes the pipeline and A/B-tests different scoring schemes.

This assumes Python 101 and comfort with pandas from Data Analysis. Optional and ungraded; see [Real-World Projects](/projects) for the full list.

## 🎯 What you'll do

1. Set up a project with `uv` and install the analysis dependencies.
2. Build a multi-factor lead scoring model from engagement and demographic data.
3. Prioritize the sales pipeline by score tier.
4. A/B-test two scoring models and compare conversion outcomes.
5. Summarize pipeline health with pandas analytics.

## Where to run this

**Locally with `uv`** is the primary path.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/lead-scoring/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/lead-scoring/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Flead-scoring%2Fnotebook.ipynb)

## Setup

Everything you need before building: a Python environment and pandas.

### Install `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Close and reopen your terminal, then confirm:

```bash
uv --version
```

### Scaffold the project

```bash
uv init lead-scoring
cd lead-scoring
uv add pandas numpy click
```

`pandas` drives the analysis. `numpy` provides math. `click` gives the CLI.

### Create the project structure

```bash
mkdir -p scoring
touch scoring/__init__.py scoring/leads.py scoring/model.py scoring/abtest.py scoring/analytics.py scoring/cli.py
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `lead-scoring/` exists with `pyproject.toml` and all dependencies installed.
- ✅ The `scoring/` directory has all required module files.

## Step 1: Create sample lead data

You need a realistic lead dataset to score. Build a function that generates leads with engagement, demographics, and behavior fields.

### 1.1 Generate the dataset

**👟 Starter hint:** Create `scoring/leads.py`.

```python
# scoring/leads.py
import random, pandas as pd

random.seed(42)

def generate_leads(n=1000) -> pd.DataFrame:
    rows = []
    for i in range(n):
        visited = random.randint(0, 40)
        opened = random.randint(0, 15)
        downloaded = random.randint(0, 5)
        company_size = random.choice(["small", "mid", "enterprise"])
        source = random.choice(["organic", "ads", "referral"])
        rows.append({
            "lead_id": i,
            "visits": visited,
            "emails_opened": opened,
            "assets_downloaded": downloaded,
            "company_size": company_size,
            "source": source,
            "converted": random.random() < 0.3,
        })
    return pd.DataFrame(rows)
```

**🎯 Expected output:** `generate_leads()` returns a 1000-row DataFrame with engagement and demographic columns.

**🩹 If it's off:** If column names don't match later code, fix them here first.

### 1.2 Verify lead data

**✅ Checklist**

- ✅ `generate_leads()` returns a DataFrame with all expected columns.
- ✅ Values are within the intended ranges.
- ✅ A `converted` boolean column exists.

**🤔 Socratic Question(s)**

- What real-world signal is missing from this dataset that a CRM would actually have (e.g., time-to-contact, budget)?

## Step 2: Build the scoring model

Score combines weighted signals. Engagement (visits, opens, downloads) usually predicts conversion best, so it gets the highest weight.

### 2.1 Define the model

**👟 Starter hint:** Create `scoring/model.py`.

```python
# scoring/model.py
import pandas as pd


def score_lead(row) -> float:
    engagement = row["visits"] * 1.0 + row["emails_opened"] * 2.0 + row["assets_downloaded"] * 5.0
    if row["company_size"] == "enterprise":
        engagement += 20
    elif row["company_size"] == "mid":
        engagement += 10
    if row["source"] == "referral":
        engagement += 15
    elif row["source"] == "organic":
        engagement += 5
    return engagement


def apply_score(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["score"] = df.apply(score_lead, axis=1)
    df["tier"] = pd.cut(df["score"],
                        bins=[-1, 20, 45, float("inf")],
                        labels=["cold", "warm", "hot"])
    return df
```

**🎯 Expected output:** `apply_score(df)` adds `score` and `tier` columns, where downloads and referral source boost the score most.

**🩹 If it's off:** If no lead is "hot", the threshold in `pd.cut` may be too high for the data.

### 2.2 Verify the model

**✅ Checklist**

- ✅ A `score` column is added.
- ✅ A `tier` column categorizes leads into `cold`, `warm`, or `hot`.
- ✅ Every lead receives a numeric score.

**🤔 Socratic Question(s)**

- The weights are hand-picked. What could go wrong if a weight is wrong, and how would you discover it?

## Step 3: Prioritize the pipeline

Sales should attack hot leads first. Sort the pipeline by tier and score, and measure the conversion rate per tier.

### 3.1 Sort and measure conversion

**👟 Starter hint:** Add a prioritization helper.

```python
# scoring/model.py (continued)
def prioritize(df: pd.DataFrame) -> pd.DataFrame:
    tier_order = {"hot": 0, "warm": 1, "cold": 2}
    return (df.assign(tier_rank=df["tier"].map(tier_order))
              .sort_values(["tier_rank", "score"], ascending=[True, False])
              .drop(columns="tier_rank"))


def conversion_by_tier(df: pd.DataFrame) -> pd.DataFrame:
    return (df.groupby("tier", observed=True)["converted"]
              .agg(["count", "mean"])
              .rename(columns={"count": "leads", "mean": "conversion_rate"})
              .round(3))
```

**🎯 Expected output:** `prioritize(df)` orders hot leads first; `conversion_by_tier` shows hot leads converting at a higher rate.

**🩹 If it's off:** If conversion rates are flat across tiers, the scoring weights don't discriminate, tighten them.

### 3.2 Verify prioritization

**✅ Checklist**

- ✅ `prioritize` sorts by tier then score descending.
- ✅ `conversion_by_tier` reports lead counts and conversion rates.
- ✅ Hot tier has a higher conversion rate than cold (for well-separated data).

**🤔 Socratic Question(s)**

- How would you use the per-tier conversion rate to decide how many leads to hand the sales team each day?

## Step 4: A/B-test two scoring models

Instead of trusting hand-picked weights, compare two models on the same data and see which better separates converters from non-converters.

### 4.1 Implement the A/B test

**👟 Starter hint:** Create `scoring/abtest.py`.

```python
# scoring/abtest.py
import pandas as pd
from numpy import mean


def model_a(row):
    return row["visits"] + 2 * row["emails_opened"] + 5 * row["assets_downloaded"]


def model_b(row):
    return row["visits"] ** 1.5 + row["emails_opened"] * 3 + row["assets_downloaded"] * 8


def compare_models(df: pd.DataFrame) -> pd.DataFrame:
    results = {}
    for name, fn in [("model_a", model_a), ("model_b", model_b)]:
        df2 = df.copy()
        df2["score"] = df2.apply(fn, axis=1)
        df2["tier"] = pd.cut(df2["score"], bins=[-1, 20, 45, float("inf")], labels=["cold", "warm", "hot"])
        top = df2.sort_values("score", ascending=False).head(300)
        results[name] = {
            "top300_conversion": mean(top["converted"]),
            "hot_count": (df2["tier"] == "hot").sum(),
        }
    return pd.DataFrame(results).T
```

**🎯 Expected output:** `compare_models(df)` reports which model yields higher conversion on its top 300 leads.

**🩹 If it's off:** If both models tie, the differentiation between them is too weak to matter.

### 4.2 Verify the A/B test

**✅ Checklist**

- ✅ Both models are scored and their top 300 leads compared.
- ✅ Output includes conversion rate and hot count.
- ✅ The better model on conversion is identifiable.

**🤔 Socratic Question(s)**

- Why compare on the *top 300 leads* rather than the full dataset? What are we implicitly deciding about how sales works?

## Step 5: Summarize pipeline health

A scorecard of aggregate metrics tells the team whether the pipeline is healthy overall.

### 5.1 Build the analytics summary

**👟 Starter hint:** Create `scoring/analytics.py`.

```python
# scoring/analytics.py
import pandas as pd


def summarize(df: pd.DataFrame) -> pd.DataFrame:
    summary = {
        "leads": len(df),
        "hot_leads": (df["tier"] == "hot").sum(),
        "warm_leads": (df["tier"] == "warm").sum(),
        "cold_leads": (df["tier"] == "cold").sum(),
        "avg_score": round(df["score"].mean(), 2),
        "overall_conversion": round(df["converted"].mean(), 3),
    }
    return pd.DataFrame([summary])


def by_source(df: pd.DataFrame) -> pd.DataFrame:
    return (df.groupby("source")["converted"]
              .agg(["count", "mean"])
              .rename(columns={"count": "leads", "mean": "conversion_rate"})
              .round(3))
```

**🎯 Expected output:** `summarize(df)` returns one row of pipeline health; `by_source` shows which acquisition source converts best.

**🩹 If it's off:** If overall conversion is much higher or lower than expected, the `converted` random assignment may need a different threshold.

### 5.2 Verify the summary

**✅ Checklist**

- ✅ `summarize` returns lead counts by tier, average score, and overall conversion.
- ✅ `by_source` reports conversion by acquisition channel.

**🤔 Socratic Question(s)**

- If "referral" converts at 40% but "ads" at 15%, what change would you make to the marketing budget?

## ⚠️ Common pitfalls

- **Overfit hand-picked weights.** Weights that look right on one dataset can be wrong on the next. A/B-testing weights against real conversion data guards against this.
- **NaN from `pd.cut`.** If a score exceeds the highest bin edge, it becomes `NaN` tier. Use `float("inf")` as the final edge.
- **Copy before adding columns.** `df.apply` inside the scoring function can trigger `SettingWithCopyWarning`. Call `.copy()` first, as shown in `apply_score`.
- **Ignoring the cost of chasing conversions.** A "hot" tier that converts 30% still wastes 70% of calls. Pair score with expected value, not just probability.
- **Demo data != production.** Randomly generated leads won't mirror real conversion behavior. Validate your model on real historical leads before trusting it.

## What you just built

A lead scoring engine: a generated lead dataset, a weighted multi-factor scoring model that ranks leads into cold/warm/hot tiers, prioritized pipeline sorting, an A/B comparison of two scoring schemes, and a pandas-based pipeline-health summary. This is the analytics core of a sales operations team, deciding whom to call, in what order, and whether the current model is working.

:::tip[Run a fuller version without any local setup]
[`examples/lead-scoring/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/lead-scoring) in the course repo has a richer version with ML-based scoring, automated lead routing, and the CLI wired up end to end. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Train a real classifier (logistic regression) on converted vs non-converted leads and compare its ranking to your hand-built model.
- Add lead enrichment from an external data source to feed new signals into the score.
- Build a routing rule that auto-assigns hot leads to the highest-performing rep.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓
