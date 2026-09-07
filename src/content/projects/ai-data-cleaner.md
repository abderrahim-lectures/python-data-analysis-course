---
title: "Build an AI Data Cleaner"
description: "Automatically detect and fix data quality issues with a pandas pipeline that profiles a messy CSV, drops duplicates, fills missing values, clips outliers, and keeps a full audit trail of every transform it applied."
difficulty: "intermediate"
estimatedMinutes: 90
xpReward: 100
tags: ["Data Visualization", "Developer Tools", "Pandas"]
prerequisites:
  - "Python basics (variables, loops, functions, dictionaries)"
  - "Data Analysis with pandas (loading a CSV, filtering rows, selecting columns)"
learningObjectives:
  - "Profile a DataFrame for missing values, duplicate rows, and inconsistent types without modifying it"
  - "Design a documented transform pipeline where every change is recorded, not just applied"
  - "Choose sensible fill strategies for numeric versus text columns"
  - "Detect outliers with the IQR rule and clip them instead of deleting data"
  - "Normalize dates and strings so values compare cleanly"
  - "Build a full clean pipeline that returns one clean DataFrame plus an audit summary"
---

# 🛠️ 🐼 Build an AI Data Cleaner

Every analyst has met the same dataset: duplicate rows, blank cells, a `price` column where one value is `"2.5 USD"` and another is `2.5`, and an order date where some rows say `2024-01-05` and some say `05/01/2024`. These problems hide real signal and crash downstream tools in confusing ways. This project builds a command-line data cleaner that takes a messy CSV, finds those problems automatically, applies the right fix per column, and — the part that makes it trustworthy — records every change it makes into an audit trail you can read like a receipt.

This assumes Python 101 and the Data Analysis module's pandas basics — nothing beyond. It's optional and ungraded; see [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Profile a messy CSV with pandas and produce a quality report covering missing values, duplicates, and type problems — without modifying the data.
2. Remove duplicate rows and prove exactly how many rows disappeared.
3. Fill missing values with strategy chosen per column (median for numbers, mode for text) and log the decision.
4. Find outliers with the IQR rule and clip them to a sane corridor.
5. Normalize dates and strings so `2.5 USD` and `2.5` finally compare equal.
6. Assemble the whole thing into one `clean_dataset()` function that returns a clean DataFrame plus a readable audit dict.

## Where to run this

**Locally with `uv`** is the recommended path — the cleaner is a deterministic pandas script and the primary workflow is running it against CSV files on your own disk, so a real Python environment with pandas installed is exactly the right home for it. The Setup below walks through `uv` and a virtual environment.

**GitHub Codespaces** works well too: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) — pandas and `uv` are already installed, and every step below runs unchanged.

**Google Colab, Kaggle Notebooks, and Binder are a genuinely good way to run this** — unlike projects that need a local git repo or real filesystem state, a data cleaner only needs a CSV in memory. The notebook below builds a small intentionally-messy DataFrame so every detection and fix runs for real; use a notebook to experiment quickly, then switch to local `uv` when you want to point the tool at actual `.csv` files on your machine.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-data-cleaner/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-data-cleaner/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fai-data-cleaner%2Fnotebook.ipynb)

## Setup

Everything you need before a line of the cleaner itself: a Python environment with pandas, and a deliberately messy CSV to point it at.

### Set up the project

```bash
uv init ai-data-cleaner
cd ai-data-cleaner
uv add pandas
```

`uv` installs Python for you, creates the project, and adds pandas to its virtual environment — one command chain instead of the usual "install Python, install pip, make a venv, pip install" tour.

### Create a messy CSV to test with

Sketch a small file with the problems the tool exists to catch — paste this into `messy.csv`:

```csv
order_id,customer,units,price,order_date
1,  alice ,2,2.50,2024-01-05
2,alice,,,05/01/2024
1,  alice ,2,2.50,2024-01-05
3,bob,10,2.5 USD,2024-02-01
4,carol,0,1.00,2024-01-31
5,dave,2,0.75,2024/03/15
5,dave,2,0.75,2024/03/15
2,alice,2,3.50,05/01/2024
6,erin,2,4.00,2024-03-20
7,frank,2,3.50,2024-03-22
8,grace,,2.25,2024-03-25
9,henry,1000,9.99,2024-04-01
```

This one file contains every failure mode the pipeline handles: two exact duplicate rows, two missing `units` values, a missing `price`, blank space in a customer name, a `price` written in three different formats, a duplicated `order_id` with different details (a near-miss duplicate), an impossible zero-unit order, an extreme outlier, and dates in three formats.

**✅ Checklist**

- ✅ `uv add pandas` finishes without errors.
- ✅ `messy.csv` exists in your project folder and has the thirteen lines (header plus twelve data rows) shown above.

## Step 1: Profile the dataset without touching it

The first pass of any cleaning script must be *read-only* — you can't trust a tool's fixes until it can describe what's wrong, and you can't describe what's wrong with a dataset you've already mutilated. Profiling loads the CSV, then walks column by column asking three questions: how many values are missing, how many rows are exact duplicates, and what dtype each column actually holds.

### 1.1 Load and size up the data

**👟 Starter hint:** Load `messy.csv` into `df`, print its shape, dtypes, missing-value count per column, and its duplicate-row count — all reads, no writes.

```python
# clean.py
import pandas as pd

df = pd.read_csv("messy.csv")
print("shape:", df.shape)
print("\ndtypes:\n", df.dtypes)
print("\nmissing per column:\n", df.isna().sum())
print("\nduplicate rows:", df.duplicated().sum())
print("\nfirst 3 rows:\n", df.head(3))
```

`df.isna().sum()` returns a per-column count of missing cells and `df.duplicated().sum()` counts rows that repeat a previous row exactly — both are pure reads that produce the numbers the pipeline will act on. The `head(3)` on a messy frame is the habit that catches problems even before the numbers do: in this one, you can already see `price` holding text and a name with leading spaces.

**🎯 Expected output:** A printed report showing `shape: (12, 5)`, `price` typed as `object` (not numeric) because of the `"2.5 USD"` row, exactly two missing values in `units`, one missing value in `price`, and `duplicate rows: 2`.

**🩹 If it's off:** If `price` shows as `int64`/`float64`, someone hand-edited the CSV and removed the `"2.5 USD"` row the probe relies on. If `df` fails to load entirely, the CSV has a `#` comment or a stray header line — open `messy.csv` and check the first two lines match the header sketch exactly.

### 1.2 Turn the profile into a report dict

**👟 Starter hint:** Extend the script with `profile(df)` that returns a dictionary describing each column's problems, so later steps (and the audit trail) can read the findings as data rather than as terminal text.

```python
# clean.py (continued)
from typing import Any

import pandas as pd

def profile(df: pd.DataFrame) -> dict[str, dict[str, Any]]:
    report: dict[str, dict[str, Any]] = {}
    for col in df.columns:
        report[col] = {
            "dtype": str(df[col].dtype),
            "missing": int(df[col].isna().sum()),
            "n_unique": int(df[col].nunique()),
            "issues": [],
        }
        if df[col].dtype == object:
            non_blank = df[col].dropna().astype(str)
            if non_blank.str.strip().ne(non_blank).any():
                report[col]["issues"].append("leading/trailing whitespace")
    return report

print(profile(df))
```

The report stops describing problems in prose and starts describing them as data — every later function can consume `report[col]["missing"]` and decide what to do. The whitespace check is the subtle one: `.str.strip().ne(itself)` is true for any value that changes when surrounding spaces are removed.

**🎯 Expected output:** `profile(df)` returns a dict in which `price` lists `dtype: object`, `units` lists `missing: 2`, and `customer` lists `leading/trailing whitespace` in its issues list.

**🩹 If it's off:** If no column reports whitespace, the CSV was re-saved with embedded quoting around values and the trailing spaces became part of the text — check `df["customer"]` values directly with `.repr()`. If a numeric column shows as `object`, at least one cell holds a string; the right fix is to decide what to do with that string, not to force-cast yet.

### 1.3 Verify the profile

**✅ Checklist**

- ✅ `df.shape` reads `(12, 5)` and `df.duplicated().sum()` reads `2`.
- ✅ `units` reports two missing values, `price` reports one missing value and an `object` dtype.
- ✅ `profile(df)` returns its findings as a dictionary that later code can read.
- ✅ No warning appears from pandas about `mixed types` when loading — that's your first drift signal.

**🤔 Socratic Question(s)**

- Why deliberately start with a read-only profile instead of fixing as you go? What specific piece of information does a fix-everything-eagerly script destroy before it can be recorded?
- `profile()` reports `n_unique` for every column. What would a `customer` column with `n_unique` equal to 6 (its row count) tell you that `duplicated().sum()` alone could miss? Hint: think about what `customer` looks like after the whitespace fix.

## Step 2: Drop duplicates — and count what you removed

Duplicates are the cheapest problem to fix, and the one people most often fix manually ("let me just delete the obvious repeats"). The pipeline's version is better than a manual pass because it records the count, so anyone auditing the result knows data was removed — transparency a spreadsheet hand-edit never gives you.

### 2.1 Drop exact duplicates with a receipt

**👟 Starter hint:** `df.drop_duplicates()` once, but capture the before-row-count minus after-row-count into the audit trail before the DataFrame is mutated.

```python
# clean.py
import pandas as pd

def drop_duplicates(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    before = len(df)
    df = df.drop_duplicates()
    removed = before - len(df)
    return df, {"action": "drop_duplicates", "removed_rows": removed, "before": before, "after": len(df)}

df = pd.read_csv("messy.csv")
df, audit = drop_duplicates(df)
print(audit)
print("rows now:", len(df))
```

`drop_duplicates()` keeps the first occurrence of each repeated row by default — deterministic, which matters, because the audit trail claims a specific number of removed rows. Capturing `before` and `after` around the call turns "I think I removed some" into an exact, provable count.

**🎯 Expected output:** The audit dict reports `removed_rows: 2`, and `rows now:` reads `10`. The two rows previously flagged by `duplicated()` (the `order_id` 1 repeat and the `order_id` 5 repeat) are gone and the DataFrame still has the first copy of each.

**🩹 If it's off:** If `removed_rows` reads `0`, your CSV's duplicate rows differ by an invisible character (a trailing space on one) — the whitespace normalization in Step 5 must run *before* the duplicate pass on data you didn't author. If row 3 (the `1, alice, 2, 2.50` repeat) survives, the values still differ somewhere — print `df.iloc[[0, 2]]` row by row to eyeball the exact difference.

### 2.2 Consider what "duplicate" means

**👟 Starter hint:** Explore a *partial* duplicate check — `df.drop_duplicates(subset=["order_id"])` — and compare its removed count with the exact-duplicate count.

```python
# clean.py (continued)
df_partial = pd.read_csv("messy.csv")
print("exact duplicates:", df_partial.duplicated().sum())
print("duplicates by order_id only:", df_partial.duplicated(subset=["order_id"]).sum())
```

`subset=[...]` changes the definition of duplication from "every column equal" to "the key columns equal". The two numbers almost always disagree, and choosing the right definition is a business decision, not a code decision: exact-only is safe, key-only is aggressive and can delete two different customers who happen to share an ID.

**🎯 Expected output:** The exact count prints `2`; the `order_id`-subset count prints `3` (rows 2, 3, and 8 are all repeats of an existing `order_id`), which is more rows than a human was probably prepared to delete.

**🩹 If it's off:** If the subset count equals the exact count, revisit the CSV for a fourth `order_id` you didn't intend. If the subset approach deletes more than you're comfortable with, that reaction is the point — reach for `keep="last"` or an explicit rule when the data is worth more than the shortcut.

### 2.3 Verify the duplicate pass

**✅ Checklist**

- ✅ Exact duplicate removal removes exactly 2 rows and records `removed_rows: 2` in an audit dict.
- ✅ You can explain what changes when `subset=["order_id"]` is used, and why that is more aggressive.
- ✅ The audit trail now contains an entry every time the DataFrame loses rows.

**🤔 Socratic Question(s)**

- What would happen to the audit trail's honesty if `drop_duplicates()` silently removed 4 rows instead of 2 because the CSV had two versions of the same customer with different `price` spellings? Where does the pipeline let you catch that before anyone relies on the cleaned file?
- The subset count `3` exceeds the exact count `2`. Is the exact version always the "right" answer? Give a real scenario where subset-based deletion is the correct behavior and the exact version leaves the dataset wrong.

## Step 3: Fill missing values, column by column

Missing cells get filled differently depending on what the column means. A numeric price missing one value is best guessed by the median of its peers; a missing free-text field (like a middle name) is often better left as an explicit "unknown". The pipeline's job is to *decide per column* and log the reasoning, so a reader knows `units = 4.0` was a median fill and not an original value.

### 3.1 Fill numerics with the median, text with the mode

**👟 Starter hint:** Write `fill_missing(df)` that fills each numeric column with its median and each text column with its most common value, skipping any column with nothing to fill.

```python
# clean.py (continued)
def fill_missing(df: pd.DataFrame) -> pd.DataFrame:
    for col in df.columns:
        if df[col].isna().sum() == 0:
            continue
        if pd.api.types.is_numeric_dtype(df[col]):
            df[col] = df[col].fillna(df[col].median())
        else:
            df[col] = df[col].fillna(df[col].mode()[0])
    return df
```

The loop's shape is the pattern: look at a column, count its missing cells, and act only if the count is nonzero. Skipping zero-missing columns avoids the noisy audit entries that would record a "fill" of nothing, and `is_numeric_dtype` keeps the strategy honest — numbers get a median, text gets a mode, and neither strategy is ever applied to the wrong column type.

**🎯 Expected output:** Running this on the duplicate-dropped frame sets the two missing `units` cells to `2` (the median of values `[2, 10, 0, 2, 2, 2, 1000]`), and a numeric `price` gets its single missing cell filled with `2.5`.

**🩹 If it's off:** If missing cells stay `NaN` after the call, the fill path was never reached — confirm `isna().sum()` was actually nonzero for that column (the missing `units` cells live in the `alice` and `grace` rows; confirm the duplicates were dropped, not the carrier rows). If a text column like `customer` got median-filled-as-mode and you find that odd, that's the correct behavior here — the strategy choice only misbehaves when identifiers are involved, which Step 5 addresses.

### 3.2 Record the decision in the audit trail

**👟 Starter hint:** Now that the fill works, add the audit entries inside the loop — one per filled column — naming the column, the strategy, and how many cells were filled, then print the growing trail.

```python
# clean.py (continued)
def fill_missing_audited(df: pd.DataFrame, audit: list[dict]) -> pd.DataFrame:
    for col in df.columns:
        n = int(df[col].isna().sum())
        if n == 0:
            continue
        if pd.api.types.is_numeric_dtype(df[col]):
            df[col] = df[col].fillna(df[col].median())
            strategy = f"median ({df[col].median():.2f})"
        else:
            df[col] = df[col].fillna(df[col].mode()[0])
            strategy = f"mode ({df[col].mode()[0]!r})"
        audit.append({"action": "fill_missing", "column": col, "cells_filled": n, "strategy": strategy})
    return df

audit = []
df = pd.read_csv("messy.csv")
df, a1 = drop_duplicates(df)
audit.append(a1)
df = fill_missing_audited(df, audit)
print(*audit, sep="\n")
```

`pd.api.types.is_numeric_dtype(df[col])` is the branch that keeps the strategy honest: numbers get a median, text gets a mode. Every fill now lands in `audit` as a row with its own strategy string, so the final clean dataset ships with a companion document of exactly what was invented and why.

**🎯 Expected output:** A `units` fill entry reading `"median (2.00)"` with `cells_filled: 2`, plus a `price` fill entry using the `mode` strategy — its presence with a text strategy is the tell that `price` is *still text at this point*, which is precisely the ordering bug the full pipeline prevents by normalizing formats first (Step 5).

**🩹 If it's off:** If `price`'s entry inexplicably shows a numeric-style strategy, you ran the fill after converting `price` out of order — fine as a result, but note the demo depends on text-in, text-out. If cells are filled but the audit never contains them, the list append is inside the wrong `if` branch or the function returned without appending.

### 3.3 Verify the fill pass

**✅ Checklist**

- ✅ Numeric columns are filled with their median; text columns with their mode.
- ✅ One audit entry exists per filled column, each naming strategy and cell count.
- ✅ Zero-missing columns produce no audit entry.

**🤔 Socratic Question(s)**

- Why is filling `units` with the median defensible while filling `order_id` with the median is nonsense? What information does the dtype carry that the fill function needs to respect?
- The audit stores the *strategy* string, not just the action. What future question does that let you answer that an audit of `action: fill_missing` alone couldn't?

## Step 4: Catch outliers with the IQR rule

A `units` value of `1000` next to peers of `0` and `2` is almost certainly a typo, but blindly deleting it loses the row's other columns. The IQR rule finds the corridor of reasonable values — anything more than `1.5 × IQR` below the first quartile or above the third — and *clips* offenders to the corridor's edge, preserving the row while neutralizing the distortion.

### 4.1 Compute the corridor and flag the offenders

**👟 Starter hint:** For the numeric columns in a frame, compute `Q1`, `Q3`, and `IQR`, then list every row outside `[Q1 - 1.5*IQR, Q3 + 1.5*IQR]`.

```python
# clean.py (continued)
def flag_outliers(df: pd.DataFrame, columns: list[str]) -> dict[str, list]:
    outliers: dict[str, list] = {}
    for col in columns:
        if not pd.api.types.is_numeric_dtype(df[col]):
            continue
        q1, q3 = df[col].quantile([0.25, 0.75])
        iqr = q3 - q1
        lo, hi = q1 - 1.5 * iqr, q3 + 1.5 * iqr
        found = df[(df[col] < lo) | (df[col] > hi)]
        if len(found):
            outliers[col] = [found.index.tolist(), round(lo, 2), round(hi, 2)]
    return outliers

df = pd.read_csv("messy.csv")
df, _ = drop_duplicates(df)
print(flag_outliers(df, ["units", "price"]))
```

`df[col].quantile([0.25, 0.75])` returns both quartiles in one call, and the boolean mask `(df[col] < lo) | (df[col] > hi)` selects rows outside the corridor — note the `|` operator, not `or`, because pandas needs element-wise masks combined, and Python's `or` collapses them into a single truth value.

**🎯 Expected output:** The function reports `units` with one outlier row (the `1000` value at original index `11`) inside a corridor of roughly `(-1.0, 7.0)` — and `price` skipped entirely because at this point it is still text and the numeric branch correctly declines to judge it.

**🩹 If it's off:** If every column reports no outliers, the numeric guard is skipping you silently — an `object` dtype yields an empty mask under this rule, which is why `price` intentionally shows nothing; run this *after* the `price` normalization step and the guard will finally let it through. If `ValueError: The truth value of a Series is ambiguous` appears, you used `or` where `|` is required.

### 4.2 Clip instead of delete

**👟 Starter hint:** Replace offending values with `Series.clip(lower=lo, upper=hi)` and record both the old and new value in the audit trail — the rare case where the trail stores a before/after pair.

```python
# clean.py (continued)
def clip_outliers(df: pd.DataFrame, columns: list[str], audit: list[dict]) -> pd.DataFrame:
    for col in columns:
        if not pd.api.types.is_numeric_dtype(df[col]):
            continue
        q1, q3 = df[col].quantile([0.25, 0.75])
        lo, hi = q1 - 1.5 * (q3 - q1), q3 + 1.5 * (q3 - q1)
        mask = (df[col] < lo) | (df[col] > hi)
        clipped = df.loc[mask, col].tolist()
        df[col] = df[col].clip(lower=lo, upper=hi)
        if clipped:
            audit.append({"action": "clip_outlier", "column": col, "from": clipped, "to": round(hi, 2)})
    return df

audit = []
df = pd.read_csv("messy.csv")
df, _ = drop_duplicates(df)
df = clip_outliers(df, ["units", "price"], audit)
print(*audit, sep="\n")
```

`clip(lower=lo, upper=hi)` pushes every value inside the corridor in one vectorized call — no loop, and it keeps `1000` as `7.0` rather than deleting the row's other four fields. Storing the `from` list alongside `to` makes the audit trail one step better than most production logs: it can answer "what did we actually change for this row?" instead of only "what did we touch?".

**🎯 Expected output:** The `1000` in `units` becomes `12.0`, and an audit entry `{"action": "clip_outlier", "column": "units", "from": [1000], "to": 7.0}` appears. The `price` column is skipped while text and remains untouched.

**🩹 If it's off:** If no clipping happens despite a clear `1000`, confirm the numeric conversion of Step 5 ran first. If the audit entry records a clip but the DataFrame still shows `1000`, the assignment `df[col] = df[col].clip(...)` was dropped and you're printing the pre-clip frame.

### 4.3 Verify the outlier pass

**✅ Checklist**

- ✅ `units = 1000` is clipped to `7.0`, and the row's other columns are preserved.
- ✅ The audit trail records a before/after pair for the clipped value.
- ✅ You can state why clipping beats deleting the whole row here.

**🤔 Socratic Question(s)**

- The corridor hides a judgment call: `1.5` is convention, not law. What would happen to `units` if you used `3.0` instead? What type of data would *legitimately* sit outside the `1.5` corridor and be wrongly flattened by this rule?
- Why clip rather than remove the row? What information survives in the row that would otherwise be lost, and in what downstream analysis does that survival actually matter?

## Step 5: Normalize formats so values compare cleanly

The numeric column holds `"2.5 USD"` next to `3.00`, and dates use `2024-01-05`, `05/01/2024`, and `2024/03/15` in the same column. A `mean()` on either column fails or lies today. Format normalization coerces every value into one shape — a float for `price`, a `datetime.date` for dates, stripped text for names — and this step is *why* the earlier fills and outlier checks started working on the frame.

### 5.1 Convert price to one numeric shape

**👟 Starter hint:** Write `normalize_price(series)` that strips non-numeric noise, coerces the result, and reports every cell it could not convert as a separate problem.

```python
# clean.py (continued)
import pandas as pd

def normalize_price(s: pd.Series) -> tuple[pd.Series, list[str]]:
    cleaned = s.astype(str).str.replace(r"[^\d.]", "", regex=True)
    converted = pd.to_numeric(cleaned, errors="coerce")
    undecodable = s[converted.isna() & s.notna()].tolist()
    return converted, [str(v) for v in undecodable]

df = pd.read_csv("messy.csv")
df, _ = drop_duplicates(df)
p, stuck = normalize_price(df["price"])
df["price"] = p
print(df["price"].tolist())
print("could not convert:", stuck)
```

The `[^\d.]` regex removes everything that isn't a digit or a decimal point — that's the width of the hatchet here, and it's honest: it handles `"2.5 USD"`, but it would also destroy a genuinely different currency value like `"2,50€"`. `errors="coerce"` turns anything still unparseable into `NaN` instead of crashing, and those leftover cells are surfaced as the `stuck` list so the pipeline never silently burns a value it couldn't read.

**🎯 Expected output:** `df["price"]` becomes `[2.5, nan, 2.5, 1.0, 0.75, 3.5, 4.0, 3.5, 2.25, 9.99]` — the `"2.5 USD"` cell now a float — and `stuck` is empty for this CSV.

**🩹 If it's off:** If a value survives as `"2.5 USD"`, the regex `[^\d.]` didn't run on that row because the series held a non-string (an already-numeric cell) — coerce with `.astype(str)` first as shown. If `stuck` is non-empty, your CSV has a value the regex mangled rather than cleaned — decide one rule per currency and extend the regex deliberately, or leave the row flagged rather than delete it.

### 5.2 Normalize dates and text in one pass

**👟 Starter hint:** Deliver dates with `pd.to_datetime(..., format="mixed")` and strip text columns, appending cleanup notes to the growing audit list.

```python
# clean.py (continued)
def normalize_formats(df: pd.DataFrame, audit: list[dict]) -> pd.DataFrame:
    for col in df.columns:
        if df[col].dtype == object and "date" in col.lower():
            before = df[col].nunique()
            df[col] = pd.to_datetime(df[col], format="mixed")
            audit.append({"action": "normalize_date", "column": col, "unique_before": before, "dtype": str(df[col].dtype)})
        elif df[col].dtype == object:
            stripped = df[col].astype(str).str.strip().astype("string")
            if stripped.ne(df[col].astype(str)).any():
                audit.append({"action": "strip_text", "column": col})
            df[col] = stripped
    return df

df = pd.read_csv("messy.csv")
_, a1 = drop_duplicates(df)
audit = [a1]
df = normalize_formats(df, audit)
print(df[["order_date", "customer"]])
print(*audit, sep="\n")
```

`fast-date` wins the race here while keeping all three input shapes: `format="mixed"` lets pandas guess per cell instead of insisting a single format describes every row. The `astype("string")` at the end uses pandas' own nullable string type, so a stripped column stops silently storing `NaN` as the float type and records missingness honestly.

**🎯 Expected output:** `order_date` prints as one consistent `datetime64` column, `customer` shows `alice`, `bob`, `carol`, `dave`, `erin`, `frank`, `grace`, `henry` with no surrounding spaces, and the audit gains `normalize_date` and `strip_text` entries.

**🩹 If it's off:** If `Mixed format` parsing raises, a cell holds a real ambiguity like `02/03/2024` where month and day could swap — `format="mixed"` keeps it parseable but silently chose a reading; pin the format with `format="%d/%m/%Y"` when you know your data. If text columns stay trimmed in the screen output but keep spaces in the frame, the DataFrame was not re-assigned from `stripped`.

### 5.3 Verify the normalization pass

**✅ Checklist**

- ✅ `price` is a single numeric column; `stuck` reports nothing unreadable.
- ✅ All `order_date` cells are one `datetime64` dtype, whatever their original spelling.
- ✅ Text columns are stripped and stored as pandas `string` dtype.
- ✅ Audit entries exist for every normalization that actually changed data.

**🤔 Socratic Question(s)**

- The `[^\d.]` regex converts `"2.5 USD"` cleanly — but what does it do to a value like `"2,500.00"` from a locale that uses thousands separators? What does that say about replacing a human decision with a regex?
- After normalization, duplicates can appear that didn't exist before (two rows whose prices were `"2.5 USD"` and `2.5`). Why should duplicate removal and format normalization share one final pass rather than being two separate stages?

## Step 6: Assemble the full pipeline with its audit trail

Each piece so far fixes one problem in isolation; the pipeline wires them in an order that makes sense — profile, then normalize formats, then drop duplicates (now reliable), then fill by column, then clip outliers — and returns one clean DataFrame *plus* the complete audit list as a JSON-serializable record.

### 6.1 Write `clean_dataset(path)`

**👟 Starter hint:** Compose the functions in dependency order into `clean_dataset(path)` that returns `(clean_df, audit)` and add a `__main__` block that prints both; make sure any function that fails raises a clear error naming which column it was on.

```python
# clean.py (final -- every helper from Steps 1-5 now lives in this same file)
import json

import pandas as pd

def clean_dataset(path: str) -> tuple[pd.DataFrame, list[dict]]:
    df = pd.read_csv(path)
    report = profile(df)
    if not report:
        raise ValueError(f"Cannot profile {path} -- is the file empty?")
    audit: list[dict] = [{"action": "profile", "issues": report}]
    df = normalize_formats(df, audit)
    price, _stuck = normalize_price(df["price"])
    df["price"] = price
    df, a = drop_duplicates(df)
    audit.append(a)
    df = fill_missing_audited(df, audit)
    df = clip_outliers(df, ["units", "price"], audit)
    return df, audit
if __name__ == "__main__":
    clean, trail = clean_dataset("messy.csv")
    print(clean)
    print("\naudit:\n", json.dumps(trail, indent=2, default=str))
```

The order encodes judgment, not habit: formats normalize *first* so the duplicate pass sees comparable values, and outlier clipping runs *last* so it operates on filled, numeric data. Failing fast inside `clean_dataset` with `raise ValueError(...)` beats shipping a silently half-cleaned file that a spreadsheet reveals only later. The single `json.dumps(trail, indent=2, default=str)` prints the audit as a readable receipt.

**🎯 Expected output:** A printed clean frame with exactly 10 rows (12 minus the two duplicates), numeric `price`, stripped names, uniform dates, median-filled `units` and `price`, an outlier `units` clipped to `7.0`, and an audit list containing every action the pipeline took, in execution order.

**🩹 If it's off:** If a `KeyError: 'price'` surfaces, the CSV's price column isn't named `price` — the pipeline hardcodes one name; make it a `column` parameter when the data disagrees. If duplicate removal deletes more than `2` rows in the full pipeline, a normalization pass merged two previously-distinct strings — compare which rows vanished by re-running on the original file.

### 6.2 Verify the whole pipeline

**✅ Checklist**

- ✅ `clean_dataset("messy.csv")` returns a clean frame with 10 rows and typed columns.
- ✅ The audit list contains entries in order: profile, format normalization, duplicate drop, missing-value fills, outlier clip.
- ✅ You can reconstruct from the audit exactly what each original value was changed to.

**🤔 Socratic Question(s)**

- The pipeline runs format normalization before duplicate removal. Trace what happens if you swapped those two stages on the original `messy.csv`: which rows survive, and which decision is now different about `price`?
- `clean_dataset` returns a fixed list of numeric columns for clipping. What would you change about the function's signature so it stays correct on a dataset without a `price` column — a specific column list, or a rule? Which do you trust a teammate to maintain?

## ⚠️ Common pitfalls

- **Fixing data before you can describe it.** A script that imputes and clips on load destroys the evidence that a fix was needed — profile first, always, and keep that first report in the audit.
- **Filling identifiers with statistics.** Median-filling `order_id` or mode-filling `timestamp` produces values that look real and mean nothing. Restrict fills by dtype and by a column allowlist.
- **Deleting instead of clipping.** Removing outlier rows silently loses the non-outlier columns of those rows. When one field is absurd but the rest is trustworthy, clip the field.
- **Regex overreach on formats.** A `[^\d.]` clean converts `"2,500.00"` and `"2.50€"` into surprising numbers. Surface unrecoverable values via a `stuck` list instead of pretending the regex understood them.
- **Untraceable transforms.** Clean data with no audit trail is indistinguishable from data that was wrong to begin with. Every mutation — drop, fill, clip, normalize — is an auditable action, and this pipeline treats it as one.

## What you just built

A working data-cleaner CLI: it loads a genuinely messy CSV, reports what's wrong before touching a cell, then fixes duplicates, missing values, outliers, and format chaos in a deliberate order — returning both a clean DataFrame and a full audit of every change. The transferable skill here outlives the tool: the habit of recording every transformation as data, so a cleaned dataset can always answer "what did you do to me, and why?".

:::tip[Run a fuller version without any local setup]
[`examples/ai-data-cleaner/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-data-cleaner) in the course repo is the same pipeline packaged for a notebook, with the profiling and audit steps printed at each stage. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Turn the `stuck` list into a decision point: a `--strict` flag that *refuses to write output* while any value is unrecoverable, so the pipeline can't ship a file it didn't fully understand.
- Add full-window whitespace and mixed-encoding handling with the argparse `--encoding` option, and normalize UTF-8 BOM files that pandas silently misreads.
- Feed the audit trail into the course's [Data Visualization](/docs/projects) module: render a bar chart of issues by column and strategy so a human can approve fills at a glance.
- Point the pipeline at the API from the [Air Quality Dashboard](/projects/air-quality) project and clean `/api` responses before they hit your charts.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓