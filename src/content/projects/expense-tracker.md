---
title: "Expense Tracker"
description: "Track expenses with categories, budgets, receipt scanning, and financial reports."
difficulty: "beginner"
estimatedMinutes: 60
tags: ["pandas", "matplotlib", "data-analysis", "visualization"]
learningObjectives:
  - "Use pandas DataFrames to store and filter expense data"
  - "Group expenses by category and calculate summaries"
  - "Build a budget monitoring system with threshold alerts"
  - "Create bar charts and pie charts with matplotlib"
prerequisites: ["Python basics (variables, loops, functions)", "pip install pandas matplotlib"]
---

# Expense Tracker

Track your spending, stick to budgets, and visualize where your money goes.

## What You'll Learn

1. Store tabular data in pandas DataFrames and filter by multiple criteria
2. Group and aggregate data to compute per-category spending totals
3. Use matplotlib to build bar charts and pie charts from real data
4. Implement a simple budget alert system with threshold checks

## What You'll Build

A command-line expense tracker that lets you:

- **Log expenses** with date, amount, category, and description
- **Organize by category** — groceries, transport, dining, entertainment, and custom labels
- **Set budgets** per category and get alerts when spending exceeds a percentage threshold
- **Generate reports** showing monthly spending breakdowns as charts

## Where to Run It

- **JupyterLite playground** — paste the code cells directly into a notebook
- **Local with uv** — run as a standalone script
- **Google Colab** — open a new notebook and paste the cells

## Setup

```bash
uv init expense-tracker
cd expense-tracker
uv add pandas matplotlib
```

## Step 1 — Define the Data Model

Start by creating a list to hold expenses and a dictionary for budget limits. Each expense is a dictionary with date, amount, category, and description fields.

```python
import pandas as pd
from datetime import date

expenses = []
budgets = {"groceries": 500, "transport": 200, "dining": 300, "entertainment": 150}

def add_expense(amount: float, category: str, description: str) -> None:
    expenses.append({
        "date": date.today().isoformat(),
        "amount": round(amount, 2),
        "category": category.lower(),
        "description": description,
    })
    print(f"Added: ${amount:.2f} in {category}")

add_expense(42.50, "groceries", "Weekly farmer's market")
add_expense(15.00, "transport", "Bus pass top-up")
add_expense(28.00, "dining", "Lunch with colleague")
add_expense(55.00, "groceries", "Pantry restock")
```

## Step 2 — Convert to DataFrame and Analyze

Turn the list into a DataFrame and compute per-category totals with `groupby`.

```python
df = pd.DataFrame(expenses)
print("All expenses:")
print(df.to_string(index=False))

# Spending by category
category_totals = df.groupby("category")["amount"].sum()
print(f"\nSpending by category:\n{category_totals}")

# Monthly summary
df["date"] = pd.to_datetime(df["date"])
monthly = df.groupby(df["date"].dt.to_period("M"))["amount"].sum()
print(f"\nMonthly totals:\n{monthly}")
```

## Step 3 — Budget Alerts

Check each category against its budget limit and print warnings.

```python
def check_budgets(spending: dict, budgets: dict, threshold: float = 0.8) -> None:
    for category, limit in budgets.items():
        spent = spending.get(category, 0)
        pct = spent / limit if limit else 0
        if pct >= 1.0:
            print(f"  OVER BUDGET: {category} — ${spent:.0f} / ${limit:.0f}")
        elif pct >= threshold:
            print(f"  WARNING: {category} — ${spent:.0f} / ${limit:.0f} ({pct:.0%})")
        else:
            print(f"  OK: {category} — ${spent:.0f} / ${limit:.0f}")

print("Budget status:")
check_budgets(category_totals.to_dict(), budgets)
```

## Step 4 — Visualize Spending

Generate a bar chart for category totals and a pie chart for proportions.

```python
import matplotlib.pyplot as plt

fig, axes = plt.subplots(1, 2, figsize=(12, 5))

# Bar chart
colors = ["#2ecc71", "#3498db", "#e74c3c", "#f39c12"]
category_totals.plot(kind="bar", ax=axes[0], color=colors[:len(category_totals)])
axes[0].set_title("Spending by Category")
axes[0].set_ylabel("Amount ($)")
axes[0].tick_params(axis="x", rotation=45)

# Pie chart
category_totals.plot(kind="pie", ax=axes[1], autopct="%1.1f%%", startangle=90)
axes[1].set_title("Spending Distribution")
axes[1].set_ylabel("")

plt.tight_layout()
plt.savefig("spending_report.png", dpi=150)
plt.show()
print("Chart saved to spending_report.png")
```

## 🧩 Challenges

**Challenge 1 — Recurring expenses**
Add a `recurring` field (weekly, monthly, none) to each expense. Write a function that projects total spending for the next 3 months based on recurring entries.

**Challenge 2 — Category recommendations**
When a user types a description, scan previously logged expenses and suggest the most common category for similar descriptions using simple string matching.

**Challenge 3 — Savings goal tracker**
Add a monthly savings target (e.g., $1000). After each expense is logged, print how much more can be spent while still meeting the goal.

## Stretch Goals

- [ ] Add bank statement import and automatic categorization
- [ ] Build a shared expense system for teams and groups
- [ ] Implement currency conversion for international expenses
- [ ] Export reports to PDF with `matplotlib.backends.backend_pdf`
- [ ] Add a simple GUI with `tkinter` for desktop use

## What You Learned

- Converting raw lists into pandas DataFrames for analysis
- Grouping and aggregating data with `groupby`
- Building threshold-based alert logic
- Creating publication-quality charts with matplotlib
