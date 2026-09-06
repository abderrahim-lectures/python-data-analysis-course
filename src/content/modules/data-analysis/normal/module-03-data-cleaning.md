---
title: "Data Cleaning"
description: "Fix real-world mess: handle missing values, convert dtypes, apply string operations, and use loc/iloc for targeted edits."
order: 3
section: "data-analysis"
track: "normal"
difficulty: "intermediate"
estimatedHours: 2
lessonCount: 2
tags: ["pandas", "missing-values", "dtypes", "string-ops"]
prerequisites: ["module-02-selection-filtering"]
icon: "🧹"
---

## Why This Matters

Real-world data is messy. A survey column meant to hold numbers contains `"N/A"` strings. A date column is stored as an object instead of a datetime. A name column has leading whitespace and inconsistent capitalization. A financial dataset has missing values in 40% of its rows. If you try to compute the mean of a column that contains `"N/A"` strings, pandas either throws an error or silently returns garbage. Data scientists spend 60-80% of their time cleaning data — not because cleaning is glamorous, but because every analysis built on dirty data is wrong. The consequences range from embarrassing (averages that include string literals) to dangerous (medical records with missing dosages). This module teaches you the core cleaning techniques that turn raw imports into analysis-ready DataFrames.

The philosophy is simple: you cannot analyze what you cannot trust. Missing values distort statistics. Wrong dtypes prevent date arithmetic and string operations. Inconsistent formatting breaks groupby operations. Cleaning is not a separate phase — it is an ongoing conversation with your data. You load it, inspect it, find problems, fix them, and verify the fix. Pandas gives you a rich toolkit for this: `isna()` to detect missing values, `fillna()` and `dropna()` to handle them, `astype()` and `pd.to_numeric()` to fix types, and the `.str` accessor to clean text columns. Combined with `loc` and `iloc` from the previous module, you can target specific cells for surgical edits. This module makes you dangerous — in the good way — at turning chaos into clean, trustworthy data.

## What You'll Learn

- Detect missing values with `isna()`, `isnull()`, and their inverses, and count them per column
- Drop missing values with `dropna()` using `axis`, `thresh`, and `subset` parameters for fine-grained control
- Fill missing values with `fillna()` using constants, forward-fill, backward-fill, and column-specific strategies
- Convert column types with `astype()` and safely convert to numeric with `pd.to_numeric(errors='coerce')`
- Apply string cleaning operations via the `.str` accessor: `strip()`, `lower()`, `replace()`, `contains()`, `split()`
- Use `loc` and `iloc` for targeted edits on specific cells when blanket operations are too broad

## The Derivation

Start with the problem: a CSV file where the `age` column contains mixed types — some numbers, some `"N/A"` strings, some empty strings. When you load it with `pd.read_csv()`, pandas reads the entire column as `object` dtype (strings). You cannot compute the mean, the median, or any statistic. The first step is detection: `df['age'].isna()` returns a boolean Series marking which cells are NaN. `df.isna().sum()` tells you exactly how many missing values each column has. This diagnostic step is non-negotiable — you need to know the scope of the problem before fixing it.

Now the fix. Dropping is the blunt instrument: `df.dropna(subset=['age'])` removes every row where age is missing. That works if missing values are rare and随机, but if 40% of your data is missing age, you just lost 40% of your dataset. Filling is often better: `df['age'].fillna(df['age'].median())` replaces missing ages with the median — a reasonable estimate that does not skew the distribution. For time-series data, forward-fill (`method='ffill'`) propagates the last known value forward, which makes sense for cumulative metrics. For text columns, `.str.strip()` removes whitespace, `.str.lower()` normalizes case, and `.str.replace()` fixes known issues like replacing `"N/A"` with actual NaN so `isna()` can detect it. The key insight: cleaning is not one operation but a sequence — detect, decide, fix, verify. Each step informs the next. This module teaches you the full sequence so you can handle any dirty dataset with confidence.

## Gamification

- **XP Reward**: +100 XP per lesson completed (200 XP total for this module)
- **Challenges**: Clean a dataset where 30% of values are missing — choose the right strategy for each column; fix a column where dates are stored as strings and convert to datetime; apply five different string operations to normalize a messy text column
- **Progress**: Complete both lessons to unlock Module 04 (GroupBy, Aggregation & Merging)
- **Streak Bonus**: Complete this module immediately after Module 02 for +10 XP streak bonus
- **Cleaning Speedrun**: Given a deliberately dirty CSV, identify all issues and fix them in a reproducible pipeline — aim for under 10 lines of cleaning code

## Projects You Can Build

After completing this module, you will be ready to tackle these real projects:

- 📊 **Survey Cleaner** — build a pipeline that ingests messy survey responses and outputs a clean, analysis-ready CSV
- 🐼 **Healthcare Data Prep** — clean patient records with mixed types, missing diagnoses, and inconsistent formatting
- 🕷️ **Scrape-to-Analysis** — scrape web data (often dirty HTML tables) and clean it for downstream analysis
- 📈 **Financial Data Normalizer** — normalize stock or crypto data from multiple sources with different formats
- 💰 **Expense Categorizer** — clean and standardize bank transaction descriptions for consistent categorization

## Lessons

1. loc and iloc — Label-based and position-based access for targeted edits on specific cells and ranges
2. Handling Missing Values — Detect, drop, and fill NaN values with strategies matched to each column's role
