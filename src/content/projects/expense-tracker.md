---
title: "Expense Tracker"
description: "Build a command-line expense tracker that logs spending, analyzes categories with pandas, monitors budgets with threshold alerts, and generates charts with matplotlib."
difficulty: "beginner"
estimatedMinutes: 50
xpReward: 50
tags: ["pandas", "matplotlib", "data-analysis", "visualization"]
prerequisites:
  - "Python basics (variables, loops, functions, dictionaries)"
  - "Basic pandas (DataFrames, groupby)"
  - "Basic matplotlib"
learningObjectives:
  - "Model financial data with Python dictionaries and lists"
  - "Convert raw data into pandas DataFrames for analysis"
  - "Group and aggregate expenses by category and month"
  - "Build a threshold-based budget alert system"
  - "Create bar charts and pie charts with matplotlib"
  - "Persist data to CSV and load it back across sessions"
---

# 💰 Expense Tracker

Track your spending, stick to budgets, and visualize where your money goes — all from the command line. This project takes you from raw Python dictionaries through pandas analysis to matplotlib charts, building a practical tool you can actually use to manage your finances.

This is optional and ungraded. See [Real-World Projects](/projects) for the full list.

## What you'll do

1. Define a data model for expenses and budgets using plain Python dictionaries and lists.
2. Write functions to log new expenses with date, amount, category, and description.
3. Convert expense data into a pandas DataFrame and compute per-category and monthly summaries.
4. Build a budget alert system that flags overspending with configurable thresholds.
5. Generate bar charts and pie charts showing where your money goes.
6. Persist expenses to a CSV file and load them back across sessions.
7. Polish the whole thing into an interactive CLI with a menu, colored output, and input validation.

## Where to run this

- **Locally with `uv` (recommended).** This project uses `pandas` and `matplotlib`, so a local install is the smoothest path. The Setup section below walks through it.
- **JupyterLite playground.** Paste the code cells directly into a notebook — works well for exploring the analysis steps (2–5), though the CLI menu (Step 7) is designed for a real terminal.
- **Google Colab.** Open a new notebook and paste the cells. Same caveat as JupyterLite: the interactive CLI works best in a real terminal.

## Setup

`uv` is a single tool that replaces the usual "install Python, then pip, then a virtual environment" chain — it can install and manage Python versions alongside your project's dependencies.

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Close and reopen your terminal, then confirm it installed:

```bash
uv --version
```

Then set up the project:

```bash
uv init expense-tracker
cd expense-tracker
uv add pandas matplotlib
```

`pandas` handles the data analysis (DataFrames, groupby, aggregations) and `matplotlib` generates the charts. Everything else is standard-library Python.

## Step 1: Define the data model

Before writing any functions, decide how expenses and budgets live in memory. Each expense is a dictionary with four fields — date, amount, category, and description. A list holds all expenses. A separate dictionary maps each category to its monthly budget limit.

### 1.1 Create the empty containers

**👟 Starter hint:** Import `pandas` and `date` from `datetime`. Create an empty list called `expenses` and a dictionary called `budgets` with four categories: groceries, transport, dining, and entertainment. Pick reasonable dollar amounts for each budget.

```python
import pandas as pd
from datetime import date

expenses = []
budgets = {
    "groceries": 500,
    "transport": 200,
    "dining": 300,
    "entertainment": 150,
}
```

**🎯 Expected output:** No visible output yet — you just created two empty containers. Running `print(expenses)` gives `[]` and `print(budgets)` shows the four categories with their limits.

**🩹 If it's off:** If you get a `NameError` on `pd`, make sure `import pandas as pd` is at the top of the cell or script. If `budgets` shows an empty dictionary, check that you included the colons between category names and amounts.

### 1.2 Understand the expense structure

Each expense you log will be a dictionary that looks like this:

```python
{
    "date": "2026-09-06",
    "amount": 42.50,
    "category": "groceries",
    "description": "Weekly farmer's market",
}
```

The `date` is stored as an ISO-format string (`YYYY-MM-DD`) so it sorts correctly. The `amount` is a float rounded to two decimal places. The `category` is always lowercased for consistency. The `description` is freeform text.

**✅ Checklist**

- ✅ `expenses` is an empty list `[]`.
- ✅ `budgets` has four keys: `"groceries"`, `"transport"`, `"dining"`, `"entertainment"`.
- ✅ You can explain what each field in an expense dictionary represents.

---

## Step 2: Add expenses

Write a function that takes an amount, category, and description, builds an expense dictionary, and appends it to the list. Include date normalization and basic validation.

### 2.1 Write the `add_expense` function

**👟 Starter hint:** Define `add_expense(amount, category, description)` that appends a dictionary to `expenses`. Use `date.today().isoformat()` for the date. Round the amount to two decimal places. Lowercase the category. Print a confirmation message after each add.

```python
def add_expense(amount: float, category: str, description: str) -> None:
    expenses.append({
        "date": date.today().isoformat(),
        "amount": round(amount, 2),
        "category": category.lower(),
        "description": description,
    })
    print(f"Added: ${amount:.2f} in {category}")
```

### 2.2 Test it with sample data

**👟 Starter hint:** Call `add_expense` four times with different amounts, categories, and descriptions. Then print the `expenses` list to confirm all four are there.

```python
add_expense(42.50, "groceries", "Weekly farmer's market")
add_expense(15.00, "transport", "Bus pass top-up")
add_expense(28.00, "dining", "Lunch with colleague")
add_expense(55.00, "groceries", "Pantry restock")
```

**🎯 Expected output:**

```
Added: $42.50 in groceries
Added: $15.00 in transport
Added: $28.00 in dining
Added: $55.00 in groceries
```

Printing `expenses` shows a list of four dictionaries, each with `date`, `amount`, `category`, and `description` keys.

**🩹 If it's off:** If the category doesn't appear lowercased in the output, make sure you call `.lower()` on the input — this prevents `"Groceries"` and `"groceries"` from becoming separate categories. If the date shows today's date even though you entered a different one, that's expected: the function always stamps the current date.

### 2.3 Verify the data

**✅ Checklist**

- ✅ Four expenses are in the list after calling `add_expense` four times.
- ✅ Each expense has all four keys: `date`, `amount`, `category`, `description`.
- ✅ The category is lowercased regardless of how you typed it.
- ✅ The amount is rounded to two decimal places.

**🤔 Socratic Question(s)**

Why lowercase the category inside the function rather than requiring the caller to type it lowercase? What would happen to your `groupby` analysis in Step 3 if `"Groceries"` and `"groceries"` counted as separate categories?

---

## Step 3: Convert to DataFrame and analyze

Raw lists of dictionaries are fine for logging, but real analysis needs pandas. Convert the list into a DataFrame, then use `groupby` to compute per-category totals and monthly summaries.

### 3.1 Build the DataFrame

**👟 Starter hint:** Pass the `expenses` list directly to `pd.DataFrame()`. Print the result with `to_string(index=False)` for clean output — no row numbers cluttering the view.

```python
df = pd.DataFrame(expenses)
print("All expenses:")
print(df.to_string(index=False))
```

**🎯 Expected output:**

```
All expenses:
       date  amount    category                description
 2026-09-06   42.50   groceries  Weekly farmer's market
 2026-09-06   15.00   transport          Bus pass top-up
 2026-09-06   28.00      dining      Lunch with colleague
 2026-09-06   55.00   groceries          Pantry restock
```

**🩹 If it's off:** If you see an empty DataFrame with `RangeIndex(start=0, stop=0, step=0)`, the `expenses` list is empty — you haven't called `add_expense` yet in this session. If column names look wrong, check that your expense dictionaries use exactly `"date"`, `"amount"`, `"category"`, and `"description"` as keys.

### 3.2 Compute per-category totals

**👟 Starter hint:** Use `df.groupby("category")["amount"].sum()` to get a Series where the index is the category name and the values are total spending. Print it.

```python
category_totals = df.groupby("category")["amount"].sum()
print("\nSpending by category:")
print(category_totals)
```

**🎯 Expected output:**

```
Spending by category:
category
groceries     97.50
dining        28.00
transport     15.00
```

**🩹 If it's off:** If you get a `KeyError`, the column name doesn't match — check for typos like `"cat"` instead of `"category"`. If totals look wrong, verify you passed `["amount"]` before `.sum()` — without it, you'd try to sum every numeric column, which might include unexpected data.

### 3.3 Add monthly summaries

**👟 Starter hint:** Convert the `date` column to datetime with `pd.to_datetime()`, then extract the month period with `.dt.to_period("M")`. Group by that and sum.

```python
df["date"] = pd.to_datetime(df["date"])
monthly = df.groupby(df["date"].dt.to_period("M"))["amount"].sum()
print("\nMonthly totals:")
print(monthly)
```

**🎯 Expected output:** If all expenses are from September 2026, you'll see a single row:

```
Monthly totals:
date
2026-09    140.5
```

**🩹 If it's off:** A `TypeError` on `pd.to_datetime` means the date strings aren't in a recognizable format — go back to `add_expense` and confirm you're using `date.today().isoformat()`. If dates from different months don't appear separately, your test data is all from the same month — add an expense with a different date to test.

### 3.4 Verify the analysis

**✅ Checklist**

- ✅ `df` has exactly four columns: `date`, `amount`, `category`, `description`.
- ✅ `category_totals` sums to the same total as adding all amounts by hand.
- ✅ Monthly summaries group expenses correctly by year-month.
- ✅ Empty categories don't appear in the groupby output.

**🤔 Socratic Question(s)**

What would `df.groupby("category")["amount"].mean()` tell you that `.sum()` doesn't? When would average spending per expense matter more than total spending?

---

## Step 4: Budget alerts

Spending analysis is interesting, but a budget tracker needs to *warn* you when you're about to overspend. Check each category against its budget limit and print alerts at a configurable threshold.

### 4.1 Write the `check_budgets` function

**👟 Starter hint:** Define `check_budgets(spending, budgets, threshold=0.8)` that loops over each category in `budgets`, looks up how much was spent, computes the percentage, and prints a status line: OK if under threshold, WARNING if between threshold and 100%, OVER BUDGET if exceeded.

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
```

### 4.2 Run it against your data

**👟 Starter hint:** Convert `category_totals` to a dict with `.to_dict()` and pass it to `check_budgets` along with `budgets`.

```python
print("Budget status:")
check_budgets(category_totals.to_dict(), budgets)
```

**🎯 Expected output** (with the sample data):

```
Budget status:
  OK: groceries — $97 / $500
  OK: transport — $15 / $200
  OK: dining — $28 / $300
  OK: entertainment — $0 / $150
```

Add a bigger expense to see the warning:

```python
add_expense(450.00, "groceries", "Big grocery run")
check_budgets(
    pd.DataFrame(expenses).groupby("category")["amount"].sum().to_dict(),
    budgets,
)
```

Now groceries shows a WARNING at 90% ($547 / $500). Exceed the limit and it prints OVER BUDGET.

**🩹 If it's off:** If all categories show `OK` even with heavy spending, check that you're passing the *summed* totals dict, not the raw expenses list. If you get a `ZeroDivisionError`, one of your budget limits is zero — every category in `budgets` needs a positive limit.

### 4.3 Test the threshold

**✅ Checklist**

- ✅ A category under 80% of its budget shows "OK".
- ✅ A category between 80% and 100% shows "WARNING" with the percentage.
- ✅ A category over 100% shows "OVER BUDGET".
- ✅ Categories not in the spending dict (like `entertainment` with zero spending) show "OK" at 0%.

**🤔 Socratic Question(s)**

Why default to 80% as the warning threshold? What kinds of expenses might need a lower threshold (say 50%) versus a higher one (90%)? How would you let users set per-category thresholds instead of a single global one?

---

## Step 5: Visualize spending

Numbers in a table are useful, but charts make spending patterns immediately obvious. Build a bar chart for category totals and a pie chart for proportions — side by side in one figure.

### 5.1 Create the side-by-side charts

**👟 Starter hint:** Import `matplotlib.pyplot`. Use `plt.subplots(1, 2, figsize=(12, 5))` to create two axes. Plot a bar chart on the left and a pie chart on the right. Save the figure with `savefig`.

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

**🎯 Expected output:** A window opens (or inline image in a notebook) showing two charts: a bar chart on the left with one bar per category, and a pie chart on the right showing percentage breakdowns. A file called `spending_report.png` appears in your working directory.

**🩹 If it's off:** If the pie chart shows overlapping labels, increase `figsize` to `(14, 6)` or reduce font size with `plt.rcParams["font.size"] = 10` before plotting. If `savefig` saves a blank image, make sure `plt.show()` comes *after* `savefig` — some backends clear the figure on `show()`. If you get an `IndexError` on `colors[:len(category_totals)]`, your spending data has more categories than colors — add more hex codes to the list.

### 5.2 Customize the appearance

**👟 Starter hint:** Add a title to the figure with `fig.suptitle("September 2026 Spending Report", fontsize=14)`. Use `plt.tight_layout(rect=[0, 0, 1, 0.95])` to make room for the title.

```python
fig.suptitle("September 2026 Spending Report", fontsize=14, fontweight="bold")
plt.tight_layout(rect=[0, 0, 1, 0.95])
plt.savefig("spending_report.png", dpi=150, bbox_inches="tight")
plt.show()
```

### 5.3 Verify the charts

**✅ Checklist**

- ✅ The bar chart has one bar per category with labels on the x-axis.
- ✅ The pie chart shows percentage labels (e.g., "69.4%") on each slice.
- ✅ A PNG file is saved to disk and is non-empty.
- ✅ Charts are readable — no overlapping text or clipped labels.

**🤔 Socratic Question(s)**

When would a bar chart be more useful than a pie chart, and vice versa? What happens to the pie chart if one category dominates at 95% of spending — can you still read the smaller slices?

---

## Step 6: Save and load data

Your expenses disappear when the program exits. Fix that by writing to a CSV file on disk and loading it back at startup.

### 6.1 Save expenses to CSV

**👟 Starter hint:** Write `save_expenses(df, filename)` that calls `df.to_csv(filename, index=False)`. Using `index=False` keeps pandas from writing row numbers that would clutter the file.

```python
def save_expenses(df: pd.DataFrame, filename: str = "expenses.csv") -> None:
    df.to_csv(filename, index=False)
    print(f"Saved {len(df)} expenses to {filename}")
```

**🎯 Expected output:** Calling `save_expenses(df)` writes `expenses.csv` and prints `Saved 4 expenses to expenses.csv`. The CSV file has a header row followed by one row per expense.

### 6.2 Load expenses from CSV

**👟 Starter hint:** Write `load_expenses(filename)` that checks if the file exists first. If it does, read it with `pd.read_csv` and parse the date column. If not, return an empty DataFrame with the right columns.

```python
from pathlib import Path

def load_expenses(filename: str = "expenses.csv") -> pd.DataFrame:
    path = Path(filename)
    if not path.exists():
        print(f"No existing data found — starting fresh.")
        return pd.DataFrame(columns=["date", "amount", "category", "description"])
    df = pd.read_csv(filename, parse_dates=["date"])
    print(f"Loaded {len(df)} expenses from {filename}")
    return df
```

**🎯 Expected output:** On first run (no CSV yet): `No existing data found — starting fresh.` On subsequent runs: `Loaded 4 expenses from expenses.csv`.

**🩹 If it's off:** If you get a `ParserError` on `pd.read_csv`, the CSV has malformed rows — open it in a text editor to check for stray commas or broken quotes. If dates show up as strings instead of datetime objects, make sure you included `parse_dates=["date"]`. If the file exists but `load_expenses` returns an empty DataFrame, the file path is wrong — run your script from the same directory where you saved the CSV.

### 6.3 Verify persistence

**✅ Checklist**

- ✅ After saving, `expenses.csv` exists and contains the header row plus data rows.
- ✅ After loading, the DataFrame has the same data you saved.
- ✅ Missing the CSV file doesn't crash the program — it starts fresh gracefully.
- ✅ Dates are parsed as datetime objects after loading, not plain strings.

---

## Step 7: Polish the CLI

Bring everything together into an interactive menu system. The user picks actions from a numbered list, input is validated before processing, and the experience feels polished.

### 7.1 Build the menu loop

**👟 Starter hint:** Write a `main()` function that loads saved data at startup, then loops: print a menu, read the user's choice, dispatch to the right function, and save after every change. Use a `while True` loop that breaks on the "quit" option.

```python
def show_menu() -> None:
    print("\n=== Expense Tracker ===")
    print("1. Add expense")
    print("2. View all expenses")
    print("3. Spending by category")
    print("4. Monthly summary")
    print("5. Budget status")
    print("6. Generate chart")
    print("7. Quit")

def view_expenses(df: pd.DataFrame) -> None:
    if df.empty:
        print("No expenses recorded yet.")
        return
    print(df.to_string(index=False))

def show_category_summary(df: pd.DataFrame) -> None:
    if df.empty:
        print("No expenses to summarize.")
        return
    totals = df.groupby("category")["amount"].sum().sort_values(ascending=False)
    print("\nSpending by category:")
    for cat, amt in totals.items():
        print(f"  {cat:15s} ${amt:>8.2f}")

def show_monthly_summary(df: pd.DataFrame) -> None:
    if df.empty:
        print("No expenses to summarize.")
        return
    monthly = df.groupby(df["date"].dt.to_period("M"))["amount"].sum()
    print("\nMonthly totals:")
    for period, amt in monthly.items():
        print(f"  {period}  ${amt:.2f}")
```

### 7.2 Wire up input validation

**👟 Starter hint:** When the user adds an expense, validate that the amount is a positive number and the category isn't empty. Re-prompt on bad input instead of crashing.

```python
def get_valid_amount() -> float:
    while True:
        try:
            amt = float(input("Amount: $"))
            if amt <= 0:
                print("  Amount must be positive.")
                continue
            return round(amt, 2)
        except ValueError:
            print("  Please enter a valid number.")

def get_valid_category() -> str:
    while True:
        cat = input("Category: ").strip().lower()
        if cat:
            return cat
        print("  Category cannot be empty.")
```

### 7.3 Assemble the full `main()`

**👟 Starter hint:** Load data into a global `df` at startup. After each action that modifies data, recompute `df` and save it. The menu loops until the user picks quit.

```python
def main() -> None:
    global expenses, df
    df = load_expenses()
    expenses = df.to_dict("records")

    while True:
        show_menu()
        choice = input("Choose (1-7): ").strip()

        if choice == "1":
            amt = get_valid_amount()
            cat = get_valid_category()
            desc = input("Description: ").strip()
            add_expense(amt, cat, desc)
            expenses = df.to_dict("records")
            expenses.append({
                "date": date.today().isoformat(),
                "amount": amt,
                "category": cat,
                "description": desc,
            })
            df = pd.DataFrame(expenses)
            df["date"] = pd.to_datetime(df["date"])
            save_expenses(df)
        elif choice == "2":
            view_expenses(df)
        elif choice == "3":
            show_category_summary(df)
        elif choice == "4":
            show_monthly_summary(df)
        elif choice == "5":
            print("\nBudget status:")
            check_budgets(
                df.groupby("category")["amount"].sum().to_dict(),
                budgets,
            )
        elif choice == "6":
            if df.empty:
                print("No data to chart yet.")
            else:
                category_totals = df.groupby("category")["amount"].sum()
                fig, axes = plt.subplots(1, 2, figsize=(12, 5))
                colors = ["#2ecc71", "#3498db", "#e74c3c", "#f39c12", "#9b59b6"]
                category_totals.plot(kind="bar", ax=axes[0], color=colors[:len(category_totals)])
                axes[0].set_title("Spending by Category")
                axes[0].set_ylabel("Amount ($)")
                axes[0].tick_params(axis="x", rotation=45)
                category_totals.plot(kind="pie", ax=axes[1], autopct="%1.1f%%", startangle=90)
                axes[1].set_title("Spending Distribution")
                axes[1].set_ylabel("")
                plt.tight_layout()
                plt.savefig("spending_report.png", dpi=150)
                plt.show()
                print("Chart saved to spending_report.png")
        elif choice == "7":
            print("Goodbye!")
            break
        else:
            print("Invalid choice — pick 1 through 7.")

if __name__ == "__main__":
    main()
```

**🎯 Expected output:** The program prints a numbered menu, accepts your choice, performs the action, and returns to the menu. Adding an expense immediately updates the CSV. Invalid input (letters where a number is expected, empty category) prints an error and re-prompts.

**🩹 If it's off:** If you get `UnboundLocalError`, the `global df` declaration is missing or `df` isn't initialized before the menu loop. If saving produces an empty CSV, make sure `save_expenses(df)` is called *after* appending to the list and rebuilding the DataFrame, not before.

### 7.4 Run the full program

**✅ Checklist**

- ✅ The menu prints on startup and reappears after every action.
- ✅ Adding an expense updates `expenses.csv` immediately.
- ✅ Non-numeric amounts and empty categories are rejected with a clear message.
- ✅ Quitting the program and restarting loads the previous session's expenses.
- ✅ All seven menu options work without errors.

---

## ⚠️ Common pitfalls

- **Forgetting to save after changes.** If you modify `expenses` or `df` but don't call `save_expenses`, the CSV is stale. Always save right after a data-changing operation — not just at program exit — so a crash or Ctrl+C only loses the current action.
- **Date string vs. datetime confusion.** Loading from CSV without `parse_dates=["date"]` gives you strings like `"2026-09-06"` instead of datetime objects. The `.dt.to_period("M")` call in the monthly summary will crash with a `TypeError` on strings.
- **Inconsistent category casing.** If `"Groceries"` and `"groceries"` both appear in the data, `groupby` treats them as separate categories. Always lowercase the category inside `add_expense`, not at the call site.
- **Pie chart with too many categories.** With 10+ categories, the pie chart becomes unreadable. Consider filtering to the top 5 and lumping the rest into "other" for the pie, while keeping the bar chart complete.
- **Overwriting the CSV on load.** `load_expenses` should *read* the file, not write to it. A common slip is importing the wrong function or calling `save` inside `load`.

## What you just built

A working command-line expense tracker that logs spending, analyzes it with pandas, monitors budgets with threshold alerts, generates charts with matplotlib, and persists everything to a CSV file. You modeled financial data with plain Python dictionaries, converted it to DataFrames for analysis, built aggregation pipelines with `groupby`, implemented threshold-based alert logic, and created publication-quality charts — all practical skills that transfer directly to real financial analysis work.

## Where to go from here

- **Recurring expense projections.** Add a `recurring` field (weekly, monthly, none) to each expense and project total spending for the next 3 months based on recurring entries.
- **Category recommendations.** When a user types a description, scan previously logged expenses and suggest the most common category for similar descriptions using simple string matching.
- **Savings goal tracker.** Add a monthly savings target (e.g., $1000). After each expense is logged, print how much more can be spent while still meeting the goal.
- **Bank statement import.** Read CSV exports from your bank and auto-categorize transactions based on description patterns.
- **GUI with tkinter.** Wrap the same logic in a desktop GUI with input fields, buttons, and an embedded chart canvas.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓
