---
title: "Build a Social Media Manager"
description: "Learn to make data-driven content decisions: determine the best posting time per platform, generate scorable hashtag suggestions, plan a week-long content calendar, and produce an analytics report."
difficulty: "intermediate"
estimatedMinutes: 60
tags: ["pandas", "data-viz", "productivity"]
learningObjectives:
  - Load and explore engagement data with pandas
  - Rank the best posting time per platform from real distributions
  - "Build a scorable hashtag suggestion engine"
  - Generate a week-long content calendar from the winning times
  - Produce a shareable analytics report with matplotlib
prerequisites:
  - "Python basics (functions, loops, dictionaries)"
  - "Grouping and aggregating with pandas"
  - "Installing packages with uv"
---

# 🛠️ 📱 Build a Social Media Manager

Posting when your audience is actually awake, with hashtags people genuinely search, is most of social marketing. This project builds a small manager that studies past engagement data with pandas, learns the best posting time for each platform, suggests hashtags per topic through a small scoring engine, plans a week of posts into a content calendar, and closes with a matplotlib analytics report you could rotate straight into a real brand's routine.

This assumes Python 101 and comfort with pandas `groupby`, nothing from Data Analysis beyond that is required. It's optional and ungraded; see [Real-World Projects](/projects) for the full, growing list.

## 🎯 What you'll do

1. Generate a realistic engagement dataset and load it with pandas.
2. Aggregate engagements by platform and hour to find each platform's best posting window.
3. Build a hashtag suggestion engine that scores hashtags against a topic.
4. Generate a 7-day content calendar from the best-time ranking.
5. Draw a weekly analytics report chart of platform performance.

## Where to run this

**Locally with `uv`** is the primary path. `pandas` and `matplotlib` install cleanly, matplotlib's non-interactive `Agg` backend (used in Step 5) renders charts even on a headless machine, and the CSV files and PNG report genuinely land in your project folder.

**Google Colab, Kaggle Notebooks, and Binder** are reasonable ways to *try* the entire build, pandas and matplotlib both run there out of the box. The honest caveat is that a notebook's ephemeral filesystem doesn't keep your `posts.csv` or your saved report across sessions, so treat them as try-it paths and switch to local `uv` when you want the calendar and report artifacts to persist.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/social-media-manager/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/social-media-manager/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fsocial-media-manager%2Fnotebook.ipynb)

## Setup

Create the project and install the two libraries the whole manager is built on.

```bash
uv init social-media-manager
cd social-media-manager
uv add pandas matplotlib
```

```bash
uv run python -c "import pandas, matplotlib; print('ok')"
```

`pandas` is the data layer, load, group, and rank engagements, and `matplotlib` is the drawing layer for the final report. Installing both up front means every step below is about the *marketing* ideas rather than dependency wrangling.

**✅ Checklist**

- ✅ `uv add pandas matplotlib` finished and `uv run python -c "import pandas, matplotlib"` prints `ok`.
- ✅ A fresh `social-media-manager/` project exists with a `pyproject.toml`.

## Step 1: Build the engagement dataset

Every content decision in this project, best time, best hashtags, best platform, is a calculation over past engagements. This step builds a realistic, reproducible engagement table so the later steps have something real to rank.

### 1.1 Generate a reproducible dataset

**👟 Starter hint:** Use `random.seed` so every run produces the *same* dataset, then build a pandas DataFrame with one row per past post and save it to CSV.

```python
# smm.py
import random
import pandas as pd

PLATFORMS = ["Instagram", "X", "LinkedIn", "TikTok"]
DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
TOPICS = ["python", "data", "career", "product"]

def build_dataset(rows: int = 120, seed: int = 7) -> pd.DataFrame:
    random.seed(seed)
    df = pd.DataFrame({
        "platform": [random.choice(PLATFORMS) for _ in range(rows)],
        "topic": [random.choice(TOPICS) for _ in range(rows)],
        "day": [random.choice(DAYS) for _ in range(rows)],
        "hour": [random.randint(7, 23) for _ in range(rows)],
        "engagements": [random.randint(4, 240) for _ in range(rows)],
    })
    return df

df = build_dataset()
df.to_csv("posts.csv", index=False)

print(df.head(3).to_string(index=False))
print(df.groupby("platform")["engagements"].mean().round(1))
```

`random.seed(seed)` is what makes this dataset *reproducible*: the same seed yields the same "random" hour and engagement for every run, so the best-time ranking you get in Step 2 is the ranking in the expected output rather than a new answer each time. Pinning the `seed` inside the function, not at module top, keeps the table stable even if you call `build_dataset` more than once. `index=False` on `to_csv` keeps a stray index column out of the file so re-loading produces a clean DataFrame.

**🎯 Expected output:** `platform`, `topic`, `day`, `hour`, `engagements` columns in the preview, then a mean-engagements row per platform, e.g. `Instagram` somewhere between 100 and 140.

**🩹 If it's off:** If columns differ, check the dictionary keys in the DataFrame constructor spell every column. If a second run produces different numbers, `random.seed` is missing or is being called with a *different* seed than the one in the signature. If `to_csv` writes an `Unnamed: 0` column on reload, `index=False` is missing.

### 1.2 Verify the dataset

**✅ Checklist**

- ✅ `smm.py` runs and prints a 3-row preview plus a mean-per-platform table.
- ✅ A `posts.csv` file exists with 120 rows and the five columns.
- ✅ Running the script twice prints identical numbers (reproducible data).

**🤔 Socratic Question(s)**

- If you changed `random.seed(7)` to `random.seed(8)`, the *file* changes, why does that matter for a Step 2 ranking you want to compare against friends, and what does it tell you about when a seed is a feature rather than an accident?
- The dataset has no `date` column, only `day` and `hour`. What weekday-level question can you answer, and what weekday-level question becomes impossible?

## Step 2: Find the best posting time per platform

A content calendar is only as good as the times it schedules. This step turns the engagement table into the one number marketers actually want: the average engagement for posting at each hour on each platform.

### 2.1 Group, average, and rank

**👟 Starter hint:** `groupby(["platform", "hour"])` the engagements, take the mean, and inspect the top hours, that's the whole ranking, no loop required.

```python
# smm.py (continued)
def best_times(df: pd.DataFrame, top_n: int = 3) -> pd.DataFrame:
    hourly = (
        df.groupby(["platform", "hour"])["engagements"]
        .mean()
        .round(1)
    )
    ranking = (
        hourly.reset_index()
        .sort_values(["platform", "engagements"], ascending=[True, False])
        .groupby("platform", sort=False)
        .head(top_n)
        .reset_index(drop=True)
    )
    return ranking

ranking = best_times(df)
print(ranking.to_string(index=False))
```

Read the chain bottom-up: `groupby(["platform", "hour"])` creates one group per platform-hour pair, `["engagements"].mean()` collapses each group to its average, `.round(1)` keeps the report tidy, and `sort_values(["platform", "engagements"], ascending=[True, False])` sorts by platform first and then by engagement *descending* so the best hour for each platform floats to the top of its block. The final `.groupby("platform", sort=False).head(top_n)` keeps only the top `top_n` rows *within* each platform, that's the "top 3 hours per platform" you'll hand to the calendar.

**🎯 Expected output:** A table with `platform`, `hour`, `engagements`, where every platform appears exactly 3 times and its own 3 rows are ordered high-to-low.

**🩹 If it's off:** If you get one 3-row block instead of four, the inner `sort_values` step is missing so `head(3)` grabbed the first groups rather than the best. If the hourly averages look identical across platforms, you grouped on only one column. If the order of rows looks scrambled, the two-column `sort_values` list is in the wrong order.

### 2.2 Verify the ranking

**✅ Checklist**

- ✅ `ranking` has exactly `top_n` rows per platform, sorted high-to-low within each.
- ✅ The top hour for at least one platform is a late-evening hour (18–23), a classic high-engagement window in seeded data.
- ✅ You can point at the two lines that do the grouping and the ranking.

**🤔 Socratic Question(s)**

- The ranking averages raw engagements per hour, so a platform with three lucky posts in one hour looks "best" there. What would change about the recommendation if you used the *median* instead of the *mean*?
- A weekday-hour table has 7 × 17 cells. What new statistic would you add if a brand only ever posted in the morning, and how would you tell the difference between "morning is their best time" and "they never posted in the evening"?

## Step 3: Build the hashtag suggestion engine

Hashtags are the search index of most platforms: the right ones surface a post to people who were already looking. This step builds a tiny scoring engine that maps a topic to ranked hashtags, the same shape a real suggestion API returns.

### 3.1 Score and rank hashtags

**👟 Starter hint:** Store each hashtag with a relevance score in a topic dictionary, sort by score, and truncate to `n`, the "engine" is just data plus `sorted`.

```python
# smm.py (continued)
HASHTAG_POOL = {
    "python": [("#Python", 95), ("#100DaysOfCode", 88), ("#CodeNewbie", 81),
               ("#DataScience", 79), ("#PythonTips", 70)],
    "data":   [("#DataScience", 97), ("#Analytics", 90), ("#DataViz", 84),
               ("#BigData", 80), ("#DataStorytelling", 72)],
    "career": [("#CareerGrowth", 91), ("#TechCareers", 85), ("#JobSearchTips", 78)],
    "product":[("#ProductManagement", 92), ("#BuildInPublic", 84), ("#PM", 77)],
}

def suggest_hashtags(topic: str, n: int = 4) -> list[str]:
    pool = HASHTAG_POOL.get(topic.lower(), [("#ContentTips", 60)])
    pool = sorted(pool, key=lambda item: item[1], reverse=True)
    return [tag for tag, _score in pool[:n]]

print(suggest_hashtags("python"))
print(suggest_hashtags("analytics"))
```

The whole "engine" is a `sorted` over scored tuples and a slice. Modeling each hashtag as `("#Tag", 95)` rather than just a string makes the ranking a data question instead of a hardcoded choice, `reverse=True` puts the highest score first, and `pool[:n]` truncates to the requested bucket size. The `.get(topic.lower(), ...)` default means an unknown topic degrades to a generic fallback instead of crashing the calendar you'll build in Step 4.

**🎯 Expected output:** `['#Python', '#100DaysOfCode', '#CodeNewbie', '#DataScience']` for `"python"`, and the `data`-pool hashtags for `"analytics"` thanks to `.lower()`.

**🩹 If it's off:** If order looks arbitrary, the `key=lambda item: item[1]` scoring key is missing so `sorted` compares whole tuples. If `"analytics"` returns the generic fallback, the dictionary keys, `data`, not `analytics`, don't match; the `.get` default hides that silently. If the wrong length comes back, the `[:n]` slice uses a different `n` than you asked for.

### 3.2 Verify the hashtag engine

**✅ Checklist**

- ✅ `suggest_hashtags("python")` returns 4 hashtags, highest-scored first.
- ✅ An unknown topic returns the fallback `#ContentTips` instead of raising `KeyError`.
- ✅ You can explain why the hashtags, and their order, are *data* rather than logic.

**🤔 Socratic Question(s)**

- The scores (95, 88, …) are hand-written. What would a real manager compute them *from* so the ranking updates automatically as a hashtag grows stale?
- `sorted` here is stable for equal scores. When would two hashtags with the same score need a tie-breaker, and what would it be?

## Step 4: Generate a real content calendar

A calendar is where decisions become a schedule. This step merges the Step 2 best-time ranking with the Step 3 hashtag engine to plan seven concrete posts, day, platform, hour, topic, and hashtags, ready to paste into any scheduler.

### 4.1 Plan the week from the ranking

**👟 Starter hint:** Loop the seven days, pick the day's platform from the single best result and a rotating topic, and reuse the two functions you already wrote instead of duplicating their logic.

```python
# smm.py (continued)
def build_calendar(ranking: pd.DataFrame, topics: list[str], days: int = 7) -> list[dict]:
    best_time = (
        ranking.groupby("platform", sort=False)
        .head(1)
        .set_index("platform")["hour"]
        .to_dict()
    )
    calendar = []
    for day_offset in range(days):
        day = DAYS[day_offset % 7]
        platform = list(best_time.keys())[day_offset % len(best_time)]
        topic = topics[day_offset % len(topics)]
        calendar.append({
            "day": day,
            "platform": platform,
            "hour": best_time[platform],
            "topic": topic,
            "hashtags": ", ".join(suggest_hashtags(topic)),
        })
    return calendar

for post in build_calendar(ranking, TOPICS):
    print(f"{post['day']:>3} {post['platform']:<10} {post['hour']:>2}:00  "
          f"{post['topic']:<10} {post['hashtags']}")
```

`best_time` collapses the ranking to the single winning hour per platform via `.groupby(...).head(1)` and turns it into a `{platform: hour}` dict with `set_index` + `to_dict`, that dict is the small lookup table the loop consults. Rotating through platforms with the modulo (`% len(best_time)`) and through topics the same way means a 7-day plan spreads across all four platforms and all four topics without repeats stacking up. Reusing `suggest_hashtags` here is the payoff of Step 3: the calendar's hashtags *come from* the scoring engine, so improving scores improves every scheduled post.

**🎯 Expected output:** Seven printable rows, one per day, each with a day name, platform, winning hour, topic, and four comma-joined hashtags, no two consecutive rows sharing a platform.

**🩹 If it's off:** If a `KeyError` on `best_time[platform]` appears, a platform in the loop isn't in the dict, check `ranking` actually contains all four platforms from Step 2. If every row has the same platform, the modulo rotation is using `len(best_time)` but indexing with the wrong value. If hashtags print as a Python list, `", ".join(...)` is missing.

### 4.2 Verify the calendar

**✅ Checklist**

- ✅ The calendar has exactly 7 rows with day, platform, hour, topic, hashtags.
- ✅ Every scheduled hour matches a platform's best hour from the Step 2 ranking.
- ✅ No platform appears twice on consecutive days.

**🤔 Socratic Question(s)**

- The calendar rotates platforms evenly, ignoring that some platforms outperformed others. How would you bias the rotation toward high-performing platforms without abandoning the weak ones entirely?
- Scheduling exactly one post per day is arbitrary. What data, from Step 2's ranking, would justify posting *twice* on some platforms and *zero* on others?

## Step 5: Build the weekly analytics report

The last artifact is the one you'd actually share: a visual report of which platform delivered, generated as a PNG you can attach to a meeting invite. This step draws the headline chart and prints a summary table beside it.

### 5.1 Draw the platform performance chart

**👟 Starter hint:** Set matplotlib to the headless `Agg` backend, compute total engagements per platform, and save the bar chart to a file, then print the same numbers as text so the report works even when nobody can see the PNG.

```python
# smm.py (continued)
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

def weekly_report(df: pd.DataFrame, out: str = "weekly_report.png") -> None:
    totals = df.groupby("platform")["engagements"].sum().sort_values(ascending=False)

    fig, ax = plt.subplots(figsize=(8, 5))
    ax.bar(totals.index, totals.values, color="#4C86C6")
    ax.set_title("Engagements per platform (last week)")
    ax.set_ylabel("Total engagements")
    ax.tick_params(axis="x", rotation=20)
    fig.tight_layout()
    fig.savefig(out, dpi=100)
    plt.close(fig)

    print("Total engagements per platform:")
    print(totals.to_string())

weekly_report(df)
```

`matplotlib.use("Agg")` must run *before* `pyplot` is imported, it swaps the interactive window for a non-display backend, which is what lets this chart render on a server, inside a notebook, or on a machine with no screen at all. `fig.savefig(out, dpi=100)` is the money line: it writes a real PNG file, and the `plt.close(fig)` after it frees the figure so a loop calling `weekly_report` repeatedly won't accumulate memory. Printing the same totals as a table keeps the report useful to anyone reading the terminal output rather than the image.

**🎯 Expected output:** A `weekly_report.png` file appears in the project folder (visible in your file explorer), and the terminal prints the four platform totals in descending order.

**🩹 If it's off:** If a backend-error traceback mentions `Agg`, `matplotlib.use("Agg")` comes *after* the `import matplotlib.pyplot` line, move it above. If no PNG appears, check `savefig`'s path: it saves relative to the current working directory. If the chart is otherwise blank, `plt.close(fig)` ran before `savefig` finished, swap the order.

### 5.2 Verify end to end

**✅ Checklist**

- ✅ `weekly_report.py` runs cleanly and writes `weekly_report.png` to disk.
- ✅ The printed totals match the visual bar heights.
- ✅ The whole pipeline, dataset → ranking → hashtags → calendar → report, runs from a single `smm.py` with no copy-paste edits between steps.

**🤔 Socratic Question(s)**

- The report sums raw engagements, so a platform with one viral post looks dominant. What metric would you plot instead to show *sustained* performance rather than a single lucky day?
- `savefig` wrote to whichever directory you ran the script from. How would you make the report path explicit and portable if your project folder lived under `content/`?

## ⚠️ Common pitfalls

- **Forgetting the seed, so every run re-ranks differently.** Engagement numbers are random; without `random.seed(seed)` at the top of `build_dataset`, Step 2's "best hour" changes between runs and friends can't compare results. Fix: keep the seed as a parameter with a fixed default.
- **Confirming wins with raw sums instead of averages.** Summing engagements rewards platforms that simply posted more. The report is honest only when it uses the *mean* engagement (Step 2 and Step 5's table) alongside totals.
- **Not handling unknown topics.** One misspelled topic in the calendar crashes the engine with `KeyError`. The `.get(topic, [("#ContentTips", 60)])` fallback turns that crash into a sensible default.
- **A hardcoded calendar instead of a generated one.** Writing Monday–Sunday by hand ignores both the Step 2 ranking and the Step 3 hashtag scores. Fix: keep the calendar a function of the data so improving the data improves the schedule.
- **Plotting while connected to a display.** Interactive matplotlib backends break on headless machines (CI, some notebooks). Set `matplotlib.use("Agg")` *before* `import pyplot`, as in Step 5.

## What you just built

A working social media manager: it learns each platform's best posting window from real engagement distributions, suggests scored hashtags per topic, plans a full week of posts, and renders a shareable analytics chart, a complete version of the research-then-publish loop a social team runs manually. The transferable skill is *letting data make scheduling decisions*: any "when should we do this" question in your future, from email sends to study sessions, is the same groupby-and-rank pattern you used here.

:::tip[Run a fuller version without any local setup]
[`examples/social-media-manager/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/social-media-manager) in the course repo is a fuller version of the code above, with the hashtag engine and calendar already wired into a single CLI. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Feed it real data: export your own platform's post history, drop it into `posts.csv`, and watch the best-time ranking recompute from actual engagements instead of seeded ones.
- Add a day-of-week factor by grouping on `(day, hour)` together, so a Monday 9:00 window that works for a Tuesday 20:00 slot no longer pretends they're the same.
- Persist the calendar with a proper `datetime` column (weekday + hour + date) and write it to CSV so it imports directly into Buffer, Hootsuite, or Meta's scheduler.
- Score hashtags from real performance, cross-referencing each post's hashtags against its engagement, instead of the hand-written scores in Step 3.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓