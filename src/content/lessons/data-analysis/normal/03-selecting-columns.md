---

title: "Selecting Columns"
description: "Pull out single or multiple columns from a DataFrame using bracket notation, dot access, and loc."
module: "selection-filtering"
order: 3
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "Select a single column by name using bracket and dot notation"
  - "Select multiple columns by passing a list of names"
  - "Use loc to select columns by label"
  - "Understand when to prefer one method over another"
prerequisites: ["series-dataframe"]
tags: ["pandas", "selection", "columns", "loc"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "How do you select a single column from a DataFrame?"
    options:
      - text: "df[0]"
      - text: "df.column_name"
        correct: true
      - text: "df.get(0)"
      - text: "df.select(0)"
  - question: "What type is df['column']?"
    options:
      - text: "DataFrame"
      - text: "Series"
        correct: true
      - text: "List"
      - text: "Dictionary"
  - question: "How do you select multiple columns?"
    options:
      - text: "df[0, 1]"
      - text: "df[['col1', 'col2']]"
        correct: true
      - text: "df.select('col1', 'col2')"
      - text: "df.get(['col1', 'col2'])"
---

## Why column selection matters

Datasets often have dozens of columns. Most analysis focuses on a subset. Selecting the right columns reduces memory usage, speeds up computation, and makes your code clearer.

We will use the Titanic dataset throughout this lesson:

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")
```

## Selecting a single column

**Bracket notation** — the most common approach:

```python
ages = df["Age"]
print(type(ages))   # <class 'pandas.core.series.Series'>
```

**Dot notation** — shorter but only works when the column name has no spaces or special characters:

```python
print(df.Age.head())   # first 5 ages
```

Both return a **Series** (one-dimensional). The column name becomes the Series name, and the DataFrame index is preserved.

## Selecting multiple columns

Pass a **list of column names** inside brackets. This returns a **DataFrame**, not a Series:

```python
subset = df[["Name", "Age", "Fare"]]
print(type(subset))   # <class 'pandas.core.frame.DataFrame'>
print(subset.head())
```

Output:

```
                                                Name   Age     Fare
0                            Braund, Mr. Owen Harris  22.0   7.2500
1  Cumings, Mrs. John Bradley (Florence Briggs Th...  38.0  71.2833
2                             Heikkinen, Miss. Laina  26.0   7.9250
3       Futrelle, Mrs. Jacques Heath (Lily May Peel)  35.0  53.1000
0                           Allen, Mr. William Henry  35.0   8.0500
```

The order of columns in the list determines the order in the output.

## Using loc for column selection

`loc` selects by label and can handle both rows and columns:

```python
# select all rows, specific columns
subset = df.loc[:, ["Name", "Survived"]]
```

The `:` means "all rows." The list of column names selects specific columns. This is equivalent to `df[["Name", "Survived"]]` but becomes essential when combining row and column selection in one step.

## Practical patterns

**Rename after selecting** — keep only what you need with clearer names:

```python
demographics = df[["Name", "Age", "Sex"]].copy()
demographics.columns = ["passenger", "age", "gender"]
```

**Select columns by data type** — useful when you have many columns:

```python
numeric_cols = df.select_dtypes(include=["number"])
print(numeric_cols.columns.tolist())
# ['PassengerId', 'Survived', 'Pclass', 'Age', 'SibSp', 'Parch', 'Fare']

categorical_cols = df.select_dtypes(include=["object"])
print(categorical_cols.columns.tolist())
# ['Name', 'Ticket', 'Cabin', 'Embarked']
```

**Select columns containing a substring**:

```python
# useful for wide datasets with naming conventions
age_cols = [col for col in df.columns if "age" in col.lower()]
```

## When to use what

| Method | Returns | Best for |
|---|---|---|
| `df["col"]` | Series | Single column access |
| `df[["col1", "col2"]]` | DataFrame | Multiple columns |
| `df.loc[:, cols]` | DataFrame | Combining row + column selection |
| `df.col` | Series | Quick access, no special chars |
| `df.select_dtypes()` | DataFrame | Selecting by type |

## Try It

From the Titanic dataset, select only the columns `Name`, `Pclass`, and `Fare`. Print the first 5 rows. Then select only the numeric columns and print their column names.

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")

subset = df[["Name", "Pclass", "Fare"]]
print(subset.head())

numeric = df.select_dtypes(include=["number"])
print(numeric.columns.tolist())
```

## Key Takeaways

- Bracket notation `df["col"]` is the standard way to select a single column
- `df[["col1", "col2"]]` returns a DataFrame with multiple columns
- `loc` becomes essential when combining row and column selection
- `select_dtypes()` is powerful for selecting columns by data type

## Practice Challenge

From the Titanic dataset, create a new DataFrame called `passenger_info` containing only `Name`, `Age`, `Sex`, and `Survived`. How many rows have missing Age values in this subset? (Hint: use `.isna().sum()`)
