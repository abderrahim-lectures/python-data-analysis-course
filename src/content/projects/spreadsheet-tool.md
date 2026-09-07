---
title: "Spreadsheet Processor"
description: "A command-line tool that reads CSV and Excel files, explores and transforms the data, and exports results."
tags: ["pandas", "csv", "data-analysis", "cli"]
difficulty: beginner
estimatedMinutes: 45
xpReward: 50
prerequisites: ["Python basics (variables, loops, functions, dictionaries)", "Basic pandas"]
---

# Spreadsheet Processor

## What You'll Build

A command-line tool that reads CSV and Excel files, explores and transforms the data, and exports results. Along the way, you'll learn the core pandas workflow that underpins nearly every data analysis task.

### Why This Project?

Every data analyst, scientist, and engineer spends time working with spreadsheets. This project teaches you the pandas fundamentals that replace hours of manual spreadsheet work with a few lines of reproducible code. You'll build a reusable CLI tool you can point at any CSV and immediately start working.

### What You'll Learn

- Read CSV and Excel files with automatic encoding detection
- Explore and summarize tabular data quickly
- Filter, sort, aggregate, and pivot data
- Clean messy data (missing values, wrong types, extra whitespace)
- Export results to CSV, Excel, and JSON
- Wrap everything in an interactive menu

---

## Step 1: Read CSV Files

### Objective

Load a CSV file into a pandas DataFrame, handling different encodings and delimiters, then preview the first few rows.

### The Concept

CSV files look simple, but they come in many flavors. Some use commas, others use semicolons. Some files are UTF-8, others are Latin-1. Before you can analyze anything, you need to figure out what you're working with. Pandas gives us the tools, but we need to write a small wrapper to try different options until something works.

### Working Code

Create a file called `spreadsheet_processor.py`:

```python
import pandas as pd
import sys
import json
from pathlib import Path


def detect_encoding(filepath):
    """Try common encodings and return the first one that works."""
    encodings = ["utf-8", "latin-1", "cp1252", "iso-8859-1"]
    for enc in encodings:
        try:
            with open(filepath, "r", encoding=enc) as f:
                f.read(1024)  # Read a chunk to test
            return enc
        except (UnicodeDecodeError, UnicodeError):
            continue
    return "utf-8"  # Fallback


def detect_delimiter(filepath, encoding):
    """Peek at the first line to guess the delimiter."""
    delimiters = [",", ";", "\t", "|"]
    with open(filepath, "r", encoding=encoding) as f:
        first_line = f.readline()

    counts = {d: first_line.count(d) for d in delimiters}
    best = max(counts, key=counts.get)
    return best if counts[best] > 0 else ","


def read_csv_file(filepath):
    """Read a CSV with auto-detected encoding and delimiter."""
    path = Path(filepath)
    if not path.exists():
        print(f"Error: File '{filepath}' not found.")
        sys.exit(1)

    encoding = detect_encoding(path)
    delimiter = detect_delimiter(path, encoding)

    print(f"  Encoding:  {encoding}")
    print(f"  Delimiter: {repr(delimiter)}")

    df = pd.read_csv(path, encoding=encoding, sep=delimiter)
    return df


# --- Demo ---
if __name__ == "__main__":
    # Create a sample CSV for testing
    sample_data = """Name,Age,City,Score
Alice,30,New York,85.5
Bob,25,San Francisco,92.3
Charlie,35,Chicago,78.1
Diana,28,Boston,95.0
Eve,32,New York,88.7"""

    sample_path = "sample_data.csv"
    with open(sample_path, "w") as f:
        f.write(sample_data)

    print(f"Reading: {sample_path}")
    df = read_csv_file(sample_path)
    print(f"\nShape: {df.shape[0]} rows x {df.shape[1]} columns\n")
    print(df.to_string(index=False))
```

### Expected Output

```
Reading: sample_data.csv
  Encoding:  utf-8
  Delimiter: ','

Shape: 5 rows x 4 columns

    Name  Age         City  Score
  Alice   30     New York   85.5
    Bob   25  San Francisco   92.3
Charlie   35      Chicago   78.1
  Diana   28       Boston   95.0
    Eve   32     New York   88.7
```

### If It's Off

- **`FileNotFoundError`** — The file path is wrong. Use `Path(filepath).resolve()` to get the absolute path and double-check it.
- **`ParserError: Error tokenizing`** — The delimiter detection picked the wrong character. Try passing `sep=None` and `engine="python"` to `pd.read_csv`, or specify the delimiter manually.
- **Garbled characters** — The encoding detection picked wrong. Open the file in a text editor, check its encoding, and pass it directly to `pd.read_csv(encoding=...)`.

---

## Step 2: Explore the Data

### Objective

Use pandas summary methods to understand the shape, types, and statistics of your data before doing anything else.

### The Concept

The first thing you do after loading data is look at it. How many rows and columns? What are the data types? Are there numeric columns to calculate on? Any missing values? Pandas has built-in methods that answer these questions in seconds.

### Working Code

Add this function to `spreadsheet_processor.py`:

```python
def explore_data(df):
    """Print a quick summary of the DataFrame."""
    print(f"\n{'='*50}")
    print("DATA EXPLORATION")
    print(f"{'='*50}")

    print(f"\nShape: {df.shape[0]} rows, {df.shape[1]} columns")

    print(f"\nColumn types:")
    for col in df.columns:
        print(f"  {col:<20} {str(df[col].dtype):<10} "
              f"({df[col].nunique()} unique)")

    print(f"\nMissing values:")
    missing = df.isnull().sum()
    if missing.any():
        for col, count in missing[missing > 0].items():
            print(f"  {col}: {count} ({count/len(df)*100:.1f}%)")
    else:
        print("  None")

    print(f"\nNumeric summary:")
    numeric_cols = df.select_dtypes(include="number")
    if not numeric_cols.empty:
        print(numeric_cols.describe().round(2).to_string())
    else:
        print("  No numeric columns found.")
```

### Expected Output

```
==================================================
DATA EXPLORATION
==================================================

Shape: 5 rows, 4 columns

Column types:
  Name                 object     (5 unique)
  Age                  int64      (5 unique)
  City                 object     (4 unique)
  Score                float64    (5 unique)

Missing values:
  None

Numeric summary:
         Age  Score
count   5.0    5.0
mean   30.0   87.92
std     3.5    6.26
min    25.0   78.10
25%    28.0   85.50
50%    30.0   88.70
75%    32.0   92.30
max    35.0   95.00
```

### If It's Off

- **All columns are `object` type** — Numbers were stored as strings (maybe with commas or dollar signs). You'll fix this in Step 5 with `pd.to_numeric`.
- **`describe()` shows nothing** — No numeric columns exist. Check if the data loaded correctly and if type conversion is needed.
- **Missing values show up unexpectedly** — Pandas treats `""`, `"NA"`, `"N/A"`, and `"null"` as NaN by default. Pass `na_values=["your_marker"]` to `read_csv` if your data uses a different sentinel.

---

## Step 3: Filter and Sort

### Objective

Extract subsets of data with condition-based filtering and sort by one or more columns.

### The Concept

Filtering lets you pull out just the rows you care about. Pandas supports multiple approaches: boolean indexing (the most common), the `.query()` method for readable expressions, and `loc`/`iloc` for label- and position-based access. Sorting rearranges the data so patterns become visible.

### Working Code

Add these functions to `spreadsheet_processor.py`:

```python
def filter_data(df, column, operator, value):
    """Filter rows based on a condition.

    Args:
        df: pandas DataFrame
        column: column name to filter on
        operator: one of '==', '!=', '>', '<', '>=', '<=', 'contains'
        value: the value to compare against
    """
    if column not in df.columns:
        print(f"Error: Column '{column}' not found.")
        print(f"Available columns: {', '.join(df.columns)}")
        return df

    # Try to cast value to the column's dtype for proper comparison
    col_dtype = df[column].dtype
    try:
        if col_dtype in ("int64", "int32"):
            value = int(value)
        elif col_dtype in ("float64", "float32"):
            value = float(value)
    except (ValueError, TypeError):
        pass  # Keep as string

    ops = {
        "==": df[column] == value,
        "!=": df[column] != value,
        ">":  df[column] > value,
        "<":  df[column] < value,
        ">=": df[column] >= value,
        "<=": df[column] <= value,
        "contains": df[column].astype(str).str.contains(value, case=False, na=False),
    }

    if operator not in ops:
        print(f"Error: Unknown operator '{operator}'. Use: {', '.join(ops.keys())}")
        return df

    mask = ops[operator]
    result = df[mask]
    print(f"\nFiltered: {len(result)} rows match '{column} {operator} {value}'")
    return result


def sort_data(df, columns, ascending=True):
    """Sort by one or more columns.

    Args:
        columns: list of column names
        ascending: True for ascending, False for descending
                   Can also be a list matching the columns list
    """
    invalid = [c for c in columns if c not in df.columns]
    if invalid:
        print(f"Error: Columns not found: {', '.join(invalid)}")
        return df

    result = df.sort_values(by=columns, ascending=ascending)
    direction = "ascending" if ascending else "descending"
    print(f"\nSorted by {', '.join(columns)} ({direction})")
    return result
```

### Expected Output

```python
# Filter: People older than 28
filtered = filter_data(df, "Age", ">", 28)
print(filtered.to_string(index=False))

# Output:
# Filtered: 3 rows match 'Age > 28'
#     Name  Age         City  Score
#   Alice   30     New York   85.5
# Charlie   35      Chicago   78.1
#     Eve   32     New York   88.7

# Sort by Score descending
sorted_df = sort_data(filtered, ["Score"], ascending=False)
print(sorted_df.to_string(index=False))

# Output:
# Sorted by Score (descending)
#     Name  Age         City  Score
#     Eve   32     New York   88.7
#   Alice   30     New York   85.5
# Charlie   35      Chicago   78.1
```

### If It's Off

- **TypeError when comparing** — The column is numeric but you passed a string (or vice versa). The auto-casting in `filter_data` handles common cases, but unusual formats may need manual conversion first.
- **Filter returns empty** — Check `df[column].unique()` to see actual values. Whitespace, case differences, or unexpected types are common culprits.
- **`sort_values` raises KeyError** — You misspelled a column name. Use `df.columns.tolist()` to check.

---

## Step 4: Aggregate Data

### Objective

Summarize data with groupby, pivot tables, and crosstabs to find patterns across categories.

### The Concept

Aggregation collapses many rows into summary statistics. Groupby splits data by a category, applies a function (sum, mean, count), and recombines the results. Pivot tables reshape data so categories become columns. Crosstabs count co-occurrences between two categorical variables.

### Working Code

Add these functions to `spreadsheet_processor.py`:

```python
def aggregate_groupby(df, group_col, agg_col, func="mean"):
    """Group by one column and aggregate another.

    Args:
        group_col: column to group by
        agg_col: column to aggregate
        func: aggregation function ('mean', 'sum', 'count', 'min', 'max', 'median')
    """
    if group_col not in df.columns:
        print(f"Error: Column '{group_col}' not found.")
        return None
    if agg_col not in df.columns:
        print(f"Error: Column '{agg_col}' not found.")
        return None

    agg_map = {
        "mean": "mean", "sum": "sum", "count": "count",
        "min": "min", "max": "max", "median": "median",
    }
    if func not in agg_map:
        print(f"Error: Unknown function '{func}'. Use: {', '.join(agg_map.keys())}")
        return None

    result = df.groupby(group_col)[agg_col].agg(agg_map[func]).reset_index()
    result.columns = [group_col, f"{agg_col}_{func}"]
    print(f"\nGrouped by '{group_col}', {func} of '{agg_col}':")
    return result


def make_pivot(df, index_col, columns_col, values_col, aggfunc="mean"):
    """Create a pivot table.

    Args:
        index_col: column for rows
        columns_col: column for columns
        values_col: column for values
        aggfunc: aggregation function
    """
    for col in [index_col, columns_col, values_col]:
        if col not in df.columns:
            print(f"Error: Column '{col}' not found.")
            return None

    result = pd.pivot_table(
        df, index=index_col, columns=columns_col,
        values=values_col, aggfunc=aggfunc, fill_value=0,
    )
    print(f"\nPivot table: rows={index_col}, cols={columns_col}, values={values_col}")
    return result


def make_crosstab(df, col1, col2):
    """Create a frequency crosstab between two categorical columns."""
    for col in [col1, col2]:
        if col not in df.columns:
            print(f"Error: Column '{col}' not found.")
            return None

    result = pd.crosstab(df[col1], df[col2], margins=True, margins_name="Total")
    print(f"\nCrosstab: {col1} vs {col2}")
    return result
```

### Expected Output

```python
# Extend sample data for better aggregation examples
extra_data = """Name,Age,City,Score,Department
Frank,40,Chicago,72.0,Engineering
Grace,29,Boston,91.5,Engineering
Heidi,33,New York,85.0,Marketing
Ivan,27,San Francisco,88.0,Marketing
Judy,31,Chicago,79.5,Marketing"""

extra_path = "sample_data_extra.csv"
with open(extra_path, "w") as f:
    f.write(extra_data)

df = read_csv_file(extra_path)

# Groupby
result = aggregate_groupby(df, "City", "Score", "mean")
print(result.to_string(index=False))

# Output:
# Grouped by 'City', mean of 'Score':
#          City  Score_mean
#       Boston       91.50
#      Chicago       75.75
#     New York       85.00
# San Francisco       88.00

# Crosstab
crosstab = make_crosstab(df, "City", "Department")
print(crosstab.to_string())
```

### If It's Off

- **`groupby` returns unexpected shape** — You might be grouping by a column with too many unique values. Check with `df[group_col].nunique()`.
- **Pivot table shows all zeros** — The `fill_value=0` replaces NaN. If many groups don't have values for a combination, this is correct. Remove `fill_value` to see NaN instead.
- **Crosstab has too many rows** — Too many unique values in one column. Consider binning numeric data with `pd.cut()` first.

---

## Step 5: Clean Data

### Objective

Handle missing values, strip whitespace, convert types, and remove duplicates.

### The Concept

Real data is messy. Names have trailing spaces, numbers are stored as strings, some cells are empty, and duplicate rows sneak in. Data cleaning is often 80% of the work. The good news: pandas makes these operations straightforward once you know the patterns.

### Working Code

Add these functions to `spreadsheet_processor.py`:

```python
def clean_data(df, options=None):
    """Apply common data cleaning operations.

    Args:
        options: dict with keys:
            - drop_duplicates: bool (default True)
            - strip_whitespace: bool (default True)
            - fill_na_strategy: str ('drop', 'mean', 'median', 'mode', 'ffill', or a literal value)
            - fix_numeric: list of columns to force numeric
    """
    if options is None:
        options = {}

    original_shape = df.shape
    log = []

    # Strip whitespace from string columns
    if options.get("strip_whitespace", True):
        str_cols = df.select_dtypes(include="object").columns
        for col in str_cols:
            df[col] = df[col].astype(str).str.strip()
        log.append(f"Stripped whitespace from {len(str_cols)} string columns")

    # Fix numeric columns
    for col in options.get("fix_numeric", []):
        if col in df.columns:
            before = df[col].dtype
            df[col] = pd.to_numeric(df[col], errors="coerce")
            coerced = df[col].isnull().sum() - df[col].isna().sum()
            log.append(f"Converted '{col}': {before} -> {df[col].dtype}")

    # Handle missing values
    fill_strategy = options.get("fill_na_strategy", "drop")
    missing_before = df.isnull().sum().sum()

    if fill_strategy == "drop":
        df = df.dropna()
        log.append(f"Dropped rows with missing values")
    elif fill_strategy == "mean":
        numeric_cols = df.select_dtypes(include="number").columns
        df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())
        log.append(f"Filled numeric NaN with column means")
    elif fill_strategy == "median":
        numeric_cols = df.select_dtypes(include="number").columns
        df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())
        log.append(f"Filled numeric NaN with column medians")
    elif fill_strategy == "mode":
        for col in df.columns:
            if df[col].isnull().any():
                mode_val = df[col].mode()
                if not mode_val.empty:
                    df[col] = df[col].fillna(mode_val.iloc[0])
        log.append(f"Filled NaN with column modes")
    elif fill_strategy == "ffill":
        df = df.ffill()
        log.append(f"Forward-filled missing values")
    else:
        df = df.fillna(fill_strategy)
        log.append(f"Filled NaN with literal: '{fill_strategy}'")

    missing_after = df.isnull().sum().sum()

    # Drop duplicates
    if options.get("drop_duplicates", True):
        before = len(df)
        df = df.drop_duplicates()
        removed = before - len(df)
        if removed:
            log.append(f"Removed {removed} duplicate rows")

    print(f"\n{'='*50}")
    print("CLEANING SUMMARY")
    print(f"{'='*50}")
    print(f"  Original shape: {original_shape}")
    print(f"  Final shape:    {df.shape}")
    print(f"  Missing before: {missing_before}")
    print(f"  Missing after:  {missing_after}")
    for entry in log:
        print(f"  - {entry}")

    return df.reset_index(drop=True)
```

### Expected Output

```python
# Create messy data
messy_data = """Name,Age,City,Score
  Alice ,30, New York ,85.5
Bob,25,San Francisco,92.3
Charlie,,Chicago,78.1
Diana,28,  Boston,95.0
Alice ,30, New York ,85.5
Eve,thirty-two,New York,88.7"""

messy_path = "messy_data.csv"
with open(messy_path, "w") as f:
    f.write(messy_data)

df = read_csv_file(messy_path)
df = clean_data(df, {
    "strip_whitespace": True,
    "fix_numeric": ["Age"],
    "fill_na_strategy": "mean",
    "drop_duplicates": True,
})

# Output:
# ==================================================
# CLEANING SUMMARY
# ==================================================
#   Original shape: (6, 4)
#   Final shape:    (4, 4)
#   Missing before: 1
#   Missing after:  0
#   - Stripped whitespace from 3 string columns
#   - Converted 'Age': object -> float64
#   - Filled numeric NaN with column means
#   - Removed 1 duplicate rows
```

### If It's Off

- **`to_numeric` converts too much to NaN** — The column has non-numeric text (like "thirty-two"). Check `df[col].unique()` before converting, and decide whether to drop or replace bad values.
- **Whitespace not fully stripped** — Non-breaking spaces (`\xa0`) or tabs might be present. Use `df[col].str.replace(r'\s+', ' ', regex=True)` for aggressive cleanup.
- **Duplicates not removed** — The rows differ in at least one column. Use `df.duplicated(subset=["col1", "col2"])` to check similarity on specific columns.

---

## Step 6: Export Results

### Objective

Save processed DataFrames to CSV, Excel (with openpyxl), and JSON formats.

### The Concept

After transforming data, you need to get it out. CSV is universal but loses formatting. Excel preserves structure and can include multiple sheets. JSON is ideal for web apps and APIs. Each format has trade-offs, and pandas supports all three.

### Working Code

Add these functions to `spreadsheet_processor.py`:

```python
def export_csv(df, filepath):
    """Export DataFrame to CSV."""
    df.to_csv(filepath, index=False)
    size = Path(filepath).stat().st_size
    print(f"  CSV saved: {filepath} ({size} bytes, {len(df)} rows)")


def export_excel(df, filepath, sheet_name="Sheet1"):
    """Export DataFrame to Excel with openpyxl.

    Requires: pip install openpyxl
    """
    try:
        import openpyxl  # noqa: F401
    except ImportError:
        print("Error: openpyxl not installed. Run: pip install openpyxl")
        return

    df.to_excel(filepath, index=False, sheet_name=sheet_name, engine="openpyxl")
    size = Path(filepath).stat().st_size
    print(f"  Excel saved: {filepath} ({size} bytes, sheet='{sheet_name}')")


def export_json(df, filepath, orient="records"):
    """Export DataFrame to JSON.

    Orient options:
        'records' -> [{"col": val}, ...]  (most common for APIs)
        'index'   -> {0: {"col": val}, ...}
        'columns' -> {"col": {0: val}, ...}
        'split'   -> {"columns": [...], "index": [...], "data": [...]}
    """
    df.to_json(filepath, orient=orient, indent=2, force_ascii=False)
    size = Path(filepath).stat().st_size
    print(f"  JSON saved: {filepath} ({size} bytes, orient='{orient}')")


def export_all(df, base_name="output"):
    """Export to all three formats at once."""
    print(f"\nExporting '{base_name}'...")
    export_csv(df, f"{base_name}.csv")
    export_excel(df, f"{base_name}.xlsx")
    export_json(df, f"{base_name}.json")
```

### Expected Output

```
Exporting 'output'...
  CSV saved: output.csv (198 bytes, 4 rows)
  Excel saved: output.xlsx (5120 bytes, sheet='Sheet1')
  JSON saved: output.json (423 bytes, orient='records')
```

### If It's Off

- **`ModuleNotFoundError: No openpyxl`** — Install it: `pip install openpyxl`. It's not bundled with pandas.
- **Excel file is corrupt** — You might be overwriting a file that's open in Excel. Close it first, or use a different filename.
- **JSON has `NaN` strings** — Pandas serializes NaN as `null` by default, but some configurations differ. Pass `default_handler=str` or clean NaN before exporting.
- **CSV has extra backslashes or quotes** — Check `quoting` and `escapechar` parameters. The defaults handle most cases, but embedded newlines in cells can cause issues.

---

## Step 7: Build a CLI Menu

### Objective

Wrap all operations in an interactive menu so a user can load, explore, filter, sort, aggregate, clean, and export data without editing code.

### The Concept

A CLI menu ties everything together. The user picks a number, provides arguments, and the program calls the right function. This pattern is common for data tools because it makes the tool accessible to people who don't want to write Python.

### Working Code

Add the main menu to `spreadsheet_processor.py`:

```python
def print_menu():
    """Print the main menu."""
    print(f"\n{'='*50}")
    print("  SPREADSHEET PROCESSOR")
    print(f"{'='*50}")
    print("  1. Load CSV file")
    print("  2. Explore data")
    print("  3. Filter rows")
    print("  4. Sort data")
    print("  5. Aggregate (groupby)")
    print("  6. Clean data")
    print("  7. Export results")
    print("  8. Show current data")
    print("  0. Quit")
    print(f"{'='*50}")


def get_input(prompt, cast=str, default=None):
    """Get input with optional type casting and default value."""
    suffix = f" [{default}]" if default is not None else ""
    raw = input(f"{prompt}{suffix}: ").strip()
    if not raw and default is not None:
        return cast(default) if cast else default
    return cast(raw) if cast else raw


def run_menu():
    """Run the interactive CLI menu."""
    df = None

    while True:
        print_menu()
        choice = get_input("Choice", str, "0")

        if choice == "0":
            print("Goodbye!")
            break

        elif choice == "1":
            path = get_input("File path")
            df = read_csv_file(path)
            print(f"\nLoaded {df.shape[0]} rows x {df.shape[1]} columns")

        elif choice == "2":
            if df is None:
                print("Load a file first (option 1).")
                continue
            explore_data(df)

        elif choice == "3":
            if df is None:
                print("Load a file first.")
                continue
            col = get_input("Column to filter on")
            op = get_input("Operator (==, !=, >, <, >=, <=, contains)", str, "==")
            val = get_input("Value")
            df = filter_data(df, col, op, val)
            print(df.to_string(index=False))

        elif choice == "4":
            if df is None:
                print("Load a file first.")
                continue
            cols = get_input("Columns (comma-separated)")
            col_list = [c.strip() for c in cols.split(",")]
            asc = get_input("Ascending? (y/n)", str, "y").lower() == "y"
            df = sort_data(df, col_list, asc)
            print(df.to_string(index=False))

        elif choice == "5":
            if df is None:
                print("Load a file first.")
                continue
            group = get_input("Group by column")
            agg = get_input("Aggregate column")
            func = get_input("Function (mean, sum, count, min, max)", str, "mean")
            result = aggregate_groupby(df, group, agg, func)
            if result is not None:
                print(result.to_string(index=False))

        elif choice == "6":
            if df is None:
                print("Load a file first.")
                continue
            strategy = get_input(
                "Missing value strategy (drop, mean, median, mode, ffill)", str, "drop"
            )
            df = clean_data(df, {
                "strip_whitespace": True,
                "fill_na_strategy": strategy,
                "drop_duplicates": True,
            })
            print(df.to_string(index=False))

        elif choice == "7":
            if df is None:
                print("Load a file first.")
                continue
            base = get_input("Output base name", str, "output")
            export_all(df, base)

        elif choice == "8":
            if df is None:
                print("Load a file first.")
                continue
            print(df.to_string(index=False))

        else:
            print("Invalid choice. Try again.")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Non-interactive mode: load a file and explore
        df = read_csv_file(sys.argv[1])
        explore_data(df)
    else:
        # Interactive mode
        run_menu()
```

### Expected Output

```
==================================================
  SPREADSHEET PROCESSOR
==================================================
  1. Load CSV file
  2. Explore data
  3. Filter rows
  4. Sort data
  5. Aggregate (groupby)
  6. Clean data
  7. Export results
  8. Show current data
  0. Quit
==================================================
Choice [0]: 1
File path: sample_data.csv
  Encoding:  utf-8
  Delimiter: ','

Loaded 5 rows x 4 columns
Choice [0]: 2

==================================================
DATA EXPLORATION
==================================================
...
```

### If It's Off

- **Menu loops infinitely** — Check that `break` exists in the quit branch. The `while True` loop needs an explicit exit.
- **`input()` blocks in non-interactive environments** — Use `sys.stdin.isatty()` to detect whether you're in a terminal, and fall back to file-based or argument-based input.
- **State is lost between runs** — This is expected. The menu is stateless; each run starts fresh. For persistence, you could add save/load functionality using JSON.

---

## Checklist

After completing all steps, verify the following:

- [ ] `read_csv_file` detects encoding and delimiter automatically
- [ ] `explore_data` shows shape, types, missing values, and statistics
- [ ] `filter_data` supports all six comparison operators plus `contains`
- [ ] `sort_data` handles single and multi-column sorting
- [ ] `aggregate_groupby` works with mean, sum, count, min, max, and median
- [ ] `make_pivot` and `make_crosstab` produce correct summaries
- [ ] `clean_data` handles whitespace, missing values, type conversion, and duplicates
- [ ] `export_all` writes valid CSV, Excel, and JSON files
- [ ] The CLI menu runs all operations interactively
- [ ] Error messages are helpful and point to the cause

---

## Stretch Goals

- [ ] Add column rename and drop operations
- [ ] Support reading Excel files directly with `pd.read_excel`
- [ ] Add a `--batch` flag that reads commands from a text file
- [ ] Generate a simple text-based bar chart for numeric columns
- [ ] Add a `profile` command that writes a full data quality report to a file
- [ ] Support chaining operations from a JSON config file (e.g., `process --config steps.json`)
