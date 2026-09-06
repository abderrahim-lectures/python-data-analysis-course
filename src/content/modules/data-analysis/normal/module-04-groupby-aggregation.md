---
title: "GroupBy, Aggregation & Merging"
description: "Split-apply-combine with groupby, compute aggregations, and combine DataFrames with merge, join, and concat."
order: 4
section: "data-analysis"
track: "normal"
difficulty: "intermediate"
estimatedHours: 2
lessonCount: 2
tags: ["pandas", "groupby", "aggregation", "merge", "concat"]
prerequisites: ["module-03-data-cleaning"]
icon: "🔗"
---

## Why This Matters

Once your data is clean, the real analysis begins — and almost every analysis question is really a groupby question. "What is the average revenue per region?" "How many customers signed up each month?" "What is the survival rate by passenger class?" Each of these requires splitting your data into groups, computing a statistic for each group, and combining the results into a summary. Without pandas, you would write nested loops: outer loop over groups, inner loop to collect values, then compute the statistic manually. With pandas, `df.groupby('region')['revenue'].mean()` does the entire split-apply-combine in one line. But groupby is only half the story. Real datasets rarely come in a single table. You have customer data in one file and transactions in another. Sales figures in one sheet and product details in another. Merging — joining two DataFrames on a shared key — is how you bring related data together. Together, groupby and merge are the workhorses of data analysis. They turn raw rows into insights and separate tables into unified views.

The deeper motivation: data analysis is about comparison. You compare regions, time periods, customer segments, experimental conditions. Every comparison requires grouping. And every group-level insight needs to be put back into context — which requires merging. A groupby without merge gives you summary tables. A merge without groupby gives you wide, unstructured DataFrames. Together, they give you the power to answer questions like: "Which product category has the highest growth rate compared to last quarter?" — a question that requires grouping by category and time, computing growth, and merging the result back with product metadata. This module teaches you both skills and shows you how they compose into analytical pipelines.

## What You'll Learn

- The split-apply-combine paradigm: how `groupby()` splits data, applies a function to each group, and combines results
- Common aggregations: `mean()`, `sum()`, `count()`, `min()`, `max()`, `std()`, and custom aggregations with `agg()`
- Grouping by multiple columns and computing different aggregations per column
- Merging two DataFrames on a shared key with `merge()` using inner, left, right, and outer joins
- Concatenating DataFrames vertically with `concat()` for stacking related datasets
- The difference between `merge()` (column-based join) and `concat()` (row-based stacking) and when to use each

## The Derivation

Start with the problem: you have a sales DataFrame with columns `region`, `product`, `revenue`, and `date`. You want total revenue per region. The brute-force way is to collect unique regions, loop through each, filter rows matching that region, and sum the revenue. That is O(n * k) operations — slow for large datasets and verbose in code. Pandas `groupby()` solves this with the split-apply-combine pattern. First, split: `df.groupby('region')` creates a GroupBy object that internally partitions the DataFrame into groups, one per unique region value. Second, apply: when you call `['revenue'].sum()`, pandas applies the sum function to the revenue column of each group independently. Third, combine: the results are assembled into a new Series (or DataFrame) with the group keys as the index. The entire operation runs in compiled code — no Python loops.

Now the second half: merging. You have a `customers` DataFrame with `customer_id`, `name`, and `region`, and a `transactions` DataFrame with `customer_id`, `amount`, and `date`. You want to know total spending per customer name. You need to join these tables on `customer_id`. `pd.merge(customers, transactions, on='customer_id', how='inner')` does this — it matches rows where `customer_id` is the same in both tables. The `how` parameter controls which rows survive: `inner` keeps only matches, `left` keeps all rows from the left table (filling NaN where no match exists), `right` keeps all from the right, and `outer` keeps everything. Concatenation is simpler: `pd.concat([df1, df2])` stacks DataFrames vertically, useful when you have the same columns across multiple files (e.g., monthly sales files). The key insight: groupby summarizes, merge connects, concat stacks. Every data pipeline uses at least two of these three.

## Gamification

- **XP Reward**: +100 XP per lesson completed (200 XP total for this module)
- **Challenges**: Compute average salary per department and find which department has the highest; merge a customers table with an orders table and compute total spending per customer; concatenate 12 monthly CSVs into a single yearly DataFrame
- **Progress**: Complete both lessons to unlock Module 05 (Guided Titanic EDA)
- **Streak Bonus**: Complete this module immediately after Module 03 for +10 XP streak bonus
- **Groupby Gauntlet**: Given a complex dataset, write a single chain of groupby → agg → merge that answers a multi-part analytical question

## Projects You Can Build

After completing this module, you will be ready to tackle these real projects:

- 📊 **Sales Report Generator** — group sales data by region and product, compute aggregations, and generate a summary report
- 🐼 **Multi-File Consolidator** — merge customer, order, and product tables into a unified analysis dataset
- 🕷️ **E-commerce Analytics** — scrape multiple product pages, concat the results, and group by category for comparison
- 📈 **Financial Portfolio Aggregator** — merge stock prices with holdings data and compute portfolio-level aggregations
- 💰 **Revenue Forecaster** — group historical revenue by month, compute trends, and merge with economic indicators

## Lessons

1. GroupBy Basics — Split data into groups and compute aggregations with split-apply-combine
2. Merging DataFrames — Combine related datasets with merge (joins) and concat (stacking)
