---

title: "Dataset Profiling"
description: "Systematically assess structure, types, missingness, cardinality, and data quality issues before any analysis."
module: "eda-framework"
order: 2
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Profile a dataset's structure, dimensions, and column types in under 2 minutes"
  - "Detect missing values, duplicates, constant columns, and high-cardinality features"
  - "Use pandas-profiling or manual profiling to generate a complete data quality report"
  - "Document profiling findings as the foundation for subsequent analysis"
prerequisites: ["01-framing-questions"]
tags: ["eda", "profiling", "data-quality", "pandas"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "hard"
quiz:
  - question: "You find that 40% of a columns values are missing. What should you do first?"
    options:
      - text: "Drop all rows with missing values"
      - text: "Fill them with the mean"
      - text: "Investigate whether the missingness is random or systematic"
        correct: true
      - text: "Delete the column entirely"
  - question: "A column has 10,000 rows and only 1 unique value. What does this mean?"
    options:
      - text: "It is a high-cardinality column"
      - text: "It is a constant column with no analytical value"
        correct: true
      - text: "It needs to be imputed"
      - text: "It is the most important column"
  - question: "What is the first step in dataset profiling?"
    options:
      - text: "Start building models"
      - text: "Check shape, dtypes, and head of the DataFrame"
        correct: true
      - text: "Drop all missing values"
      - text: "Normalize all numerical columns"
---
Profiling is the systematic assessment of a dataset before any analysis begins. It answers the basic questions: How many rows? What columns? Which are missing data? Which are redundant? This lesson teaches a repeatable profiling workflow that catches data quality problems before they corrupt your results.

## Key Concepts

### The 60-second profile

When you first load a dataset, run this sequence to get oriented:

```python
import pandas as pd

df = pd.read_csv("students-performance.csv")

# 1. Shape — how much data do we have?
print(f"Rows: {df.shape[0]}, Columns: {df.shape[1]}")

# 2. Column names and types
print(df.dtypes)

# 3. First and last rows
df.head(3)
df.tail(3)

# 4. Basic statistics for numerical columns
df.describe()

# 5. Categorical value counts
for col in df.select_dtypes(include="object").columns:
    print(f"\n{col}:")
    print(df[col].value_counts())
```

This gives you the structure, the data types, the numerical distributions, and the categorical frequencies, everything you need to decide what to do next.

### Missing data assessment

Missing data is the most common data quality issue. Detect it systematically:

```python
# Count and percentage of missing values per column
missing = df.isnull().sum()
missing_pct = (missing / len(df) * 100).round(2)
missing_report = pd.DataFrame({
    "missing_count": missing,
    "missing_pct": missing_pct
})
print(missing_report[missing_report["missing_count"] > 0])
```

Interpret missingness patterns:
- **MCAR (Missing Completely at Random)**: missingness has no relationship with any variable, safe to drop rows
- **MAR (Missing at Random)**: missingness relates to observed variables, can be imputed
- **MNAR (Missing Not at Random)**: missingness relates to the missing value itself, requires domain knowledge

```python
# Visualize missing data with a heatmap
import seaborn as sns
import matplotlib.pyplot as plt

plt.figure(figsize=(10, 6))
sns.heatmap(df.isnull(), cbar=True, yticklabels=False, cmap="viridis")
plt.title("Missing Data Pattern")
plt.tight_layout()
plt.show()
```

### Duplicate detection

Duplicates silently inflate counts and skew statistics:

```python
# Exact duplicates
n_dupes = df.duplicated().sum()
print(f"Exact duplicate rows: {n_dupes}")

# Near-duplicates on key columns
key_cols = ["gender", "race/ethnicity", "parental level of education"]
n_near = df.duplicated(subset=key_cols).sum()
print(f"Near-duplicates on demographic columns: {n_near}")
```

### Constant and low-variance columns

Columns with a single unique value carry no information:

```python
# Find constant columns
constant_cols = [col for col in df.columns if df[col].nunique() == 1]
print(f"Constant columns: {constant_cols}")

# Find near-constant columns (>95% same value)
for col in df.columns:
    top_pct = df[col].value_counts(normalize=True).iloc[0]
    if top_pct > 0.95:
        print(f"  Near-constant: {col} — {top_pct:.1%} same value")
```

### Cardinality assessment

High cardinality (many unique values) in categorical columns can cause overfitting in models and messy visualizations:

```python
# Cardinality for each categorical column
cat_cols = df.select_dtypes(include="object").columns
for col in cat_cols:
    n_unique = df[col].nunique()
    print(f"{col}: {n_unique} unique values")
    if n_unique > 10:
        print(f"  WARNING: High cardinality — consider grouping")
```

### The full profiling report

Combine everything into a reusable function:

```python
def profile_dataset(df, name="Dataset"):
    """Generate a complete profiling report for a DataFrame."""
    print(f"{'='*60}")
    print(f"  PROFILING REPORT: {name}")
    print(f"{'='*60}")

    # Structure
    print(f"\nSTRUCTURE")
    print(f"  Rows: {df.shape[0]:,}")
    print(f"  Columns: {df.shape[1]}")
    print(f"  Memory usage: {df.memory_usage(deep=True).sum() / 1e6:.2f} MB")

    # Types
    print(f"\nCOLUMN TYPES")
    print(df.dtypes.value_counts().to_string())

    # Missing
    missing = df.isnull().sum()
    if missing.any():
        print(f"\nMISSING VALUES")
        for col in missing[missing > 0].index:
            pct = missing[col] / len(df) * 100
            print(f"  {col}: {missing[col]:,} ({pct:.1f}%)")
    else:
        print(f"\nMISSING VALUES: None detected")

    # Duplicates
    n_dupes = df.duplicated().sum()
    print(f"\nDUPLICATES: {n_dupes} rows ({n_dupes/len(df)*100:.1f}%)")

    # Numerical summary
    num_df = df.select_dtypes(include="number")
    if not num_df.empty:
        print(f"\nNUMERICAL SUMMARY")
        print(num_df.describe().round(2).to_string())

    # Categorical summary
    cat_df = df.select_dtypes(include="object")
    if not cat_df.empty:
        print(f"\nCATEGORICAL SUMMARY")
        for col in cat_df.columns:
            n_unique = df[col].nunique()
            print(f"  {col}: {n_unique} unique values")

    print(f"\n{'='*60}")

# Usage:
# profile_dataset(df, "Students Performance")
```

## Try It

Profile the Students Performance dataset using the workflow above. Answer these questions from the profiling output alone, do not plot anything yet.

```python
import pandas as pd

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

# Quick profile
print("Shape:", df.shape)
print("\nDtypes:\n", df.dtypes)
print("\nMissing:\n", df.isnull().sum())
print("\nNumerical stats:\n", df.describe())
print("\nCategorical values:")
for col in df.select_dtypes(include="object").columns:
    print(f"\n{col}:")
    print(df[col].value_counts())
```

Questions to answer:
1. How many rows and columns?
2. Which columns have missing values?
3. How many unique values does each categorical column have?
4. What are the min and max math scores?
5. Are there any constant or near-constant columns?

## Key Takeaways

- Profile before you plot, a 60-second profiling pass catches issues that would waste hours later
- Missing data has three mechanisms (MCAR, MAR, MNAR); identify which applies before choosing a strategy
- Duplicates and constant columns silently degrade analysis quality
- Cardinality matters, high-cardinality categoricals need grouping before visualization
- Build a reusable profiling function so every new dataset gets the same systematic treatment

## Practice Challenge

Write a function `quick_profile(df)` that returns a dictionary with keys: `shape`, `dtypes`, `missing_cols`, `duplicate_count`, `constant_cols`, and `cardinality`. Test it on the Students Performance dataset.

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

```python
import pandas as pd

def quick_profile(df):
    """Return a profiling summary dictionary."""
    missing = df.isnull().sum()
    return {
        "shape": df.shape,
        "dtypes": df.dtypes.value_counts().to_dict(),
        "missing_cols": {
            col: {"count": int(missing[col]), "pct": round(missing[col] / len(df) * 100, 2)}
            for col in missing[missing > 0].index
        },
        "duplicate_count": int(df.duplicated().sum()),
        "constant_cols": [col for col in df.columns if df[col].nunique() == 1],
        "cardinality": {
            col: df[col].nunique()
            for col in df.select_dtypes(include="object").columns
        },
    }

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")
report = quick_profile(df)

for key, value in report.items():
    print(f"\n{key}:")
    if isinstance(value, dict):
        for k, v in value.items():
            print(f"  {k}: {v}")
    elif isinstance(value, list):
        print(f"  {value if value else 'None'}")
    else:
        print(f"  {value}")
```

</div>
</details>
