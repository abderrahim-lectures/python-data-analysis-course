---
title: "Univariate Analysis & Visualization"
description: "Master distributions, summaries, and visual encoding for single variables using matplotlib and seaborn."
order: 2
section: "data-analysis"
track: "hard"
difficulty: "advanced"
estimatedHours: 5
lessonCount: 2
tags: ["univariate", "matplotlib", "seaborn", "distributions"]
prerequisites: ["module-01-eda-framework"]
icon: "📊"
---

## Why This Matters

Looking at one variable at a time seems boring. It feels like a warm-up before the real work. But every insight in data science begins with univariate analysis. If you do not understand the distribution of your individual variables, any analysis you build on top is built on sand.

Consider a salary dataset. Before you can compare salaries across departments, you need to know: What does the overall salary distribution look like? Is it symmetric or heavily right-skewed? Are there suspicious outliers — maybe someone earning $10 million when everyone else earns between $40K and $150K? Is there a secondary peak suggesting two distinct populations? None of these questions involve a second variable. They all require you to look carefully at one column.

The consequences of skipping univariate analysis are real. A mean salary of $85,000 sounds reasonable until you realize it is pulled upward by a handful of CEO salaries in a dataset of median earners. A model trained on unexamined features will learn from these distortions. Visualization reveals what summary statistics hide: the shape, the gaps, the clusters, the tails. A histogram tells you more than a mean ever will.

This module trains your intuition. After completing it, you will be able to look at a distribution and instantly recognize skewness, multimodality, heavy tails, and outliers — patterns that guide every decision from feature engineering to model selection.

## What You'll Learn

- Select and compute appropriate summary statistics for numerical and categorical variables
- Create histograms, KDE plots, box plots, and violin plots for numerical distributions
- Build count plots, bar charts, and pie charts for categorical frequency analysis
- Read distribution shapes and detect skewness, outliers, and multimodality from plots alone
- Choose between statistical tests based on distribution characteristics

## The Derivation

The problem univariate analysis solves is fundamental: raw numbers are hard to interpret. Looking at a column of 10,000 values tells you nothing. You need to compress that information into something human-readable.

The naive approach is to compute the mean and call it a day. But the mean is fragile. A single extreme outlier can pull it wildly. Consider incomes: {30K, 35K, 40K, 45K, 50K, 500K}. The mean is $116,667, which represents nobody. The median is $42,500, which represents most people. This is why you need both central tendency measures and spread measures — standard deviation, interquartile range, range — to understand a distribution's true character.

Now consider the visual approach. A histogram bins values and counts them. It immediately reveals: Is the distribution bell-shaped (normal)? Right-skewed (like income)? Left-skewed (like age at retirement)? Bimodal (suggesting two hidden subgroups)? This visual fingerprint guides everything that follows. A normal distribution justifies parametric tests. A skewed distribution demands transformation or non-parametric alternatives.

KDE (Kernel Density Estimation) smooths the histogram into a continuous curve, making it easier to read and compare distributions. Box plots compress the distribution into five numbers plus outliers. Violin plots combine the box plot with KDE, showing both summary statistics and full shape. Each visualization serves a different analytical purpose. Mastering them means you can extract maximum information from a single variable with minimum effort.

## Gamification

- **XP Reward**: +150 XP per lesson (advanced track bonus)
- **Challenges**: Identify the distribution type from a mystery histogram, detect outliers without code, build a summary statistics dashboard from scratch
- **Progress**: Complete both lessons to unlock Module 3
- **Streak Bonus**: Complete Modules 1 and 2 in sequence for +15 XP bonus
- **Capstone Unlock**: Your univariate skills feed directly into the Module 5 capstone

## Projects You Can Build

After completing this module, you'll be ready to tackle these real projects:

- 💰 **Salary Distribution Analyzer** — visualize and analyze compensation data across industries
- 🎮 **Game Rating Explorer** — profile game review scores and identify rating patterns
- 🏋️ **Fitness Tracker Profiler** — analyze daily step counts, calories, and sleep distributions
- 📚 **Book Length Analyst** — explore page count distributions across genres
- 🌡️ **Climate Data Profiler** — visualize temperature and rainfall distributions by region

## Lessons

1. Univariate Numerical Analysis — Distributions, histograms, KDE, box plots, and summary statistics for numerical columns
2. Univariate Categorical Analysis — Frequency tables, count plots, bar charts, and ordinal vs nominal handling
