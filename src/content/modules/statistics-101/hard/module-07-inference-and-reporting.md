---
title: "Inference and Reporting"
description: "Multiple regression and resampling: adjusting for confounders, and stating uncertainty a reviewer can check."
order: 7
section: "statistics-101"
track: "hard"
difficulty: "advanced"
estimatedHours: 3
lessonCount: 2
tags: ["multiple-regression", "confounding", "bootstrap", "reporting"]
prerequisites: []
icon: "🧪"
---

## Why This Matters

The last two hard lessons are about defensibility. A single-variable coefficient is the easiest number in statistics to produce and the easiest to overturn; an interval built on an assumption nobody checked can look precise and be wrong.

Both lessons replace a shortcut with a procedure: adjusting for a measured confounder rather than pooling, and resampling rather than assuming a shape. Neither is complicated, and either one turns a claim into something a reviewer can examine.

## What You'll Learn

- Read an adjusted coefficient with its "holding others fixed" clause, and know when adjusting is wrong
- Distinguish a confounder from a mediator from a collider
- Build an interval by resampling when a formula's assumptions do not hold
- Separate sampling error from bias, and write up an analysis that names its own limits
