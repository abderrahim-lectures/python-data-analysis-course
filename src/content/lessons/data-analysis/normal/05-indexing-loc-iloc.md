---

title: "loc and iloc"
description: "Access specific rows and columns using label-based loc and position-based iloc for precise data selection."
module: "data-cleaning"
order: 5
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "Use loc to select rows and columns by label"
  - "Use iloc to select rows and columns by integer position"
  - "Combine row and column selection in a single operation"
  - "Use loc for targeted assignment and editing"
prerequisites: ["selection-filtering"]
tags: ["pandas", "loc", "iloc", "indexing"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "What is the difference between loc and iloc?"
    options:
      - text: "loc uses labels, iloc uses integer positions"
        correct: true
      - text: "loc is faster than iloc"
      - text: "iloc uses labels, loc uses positions"
      - text: "There is no difference"
  - question: "How do you select the first 3 rows with iloc?"
    options:
      - text: "df.iloc[0:3]"
        correct: true
      - text: "df.iloc[0, 3]"
      - text: "df.loc[0:3]"
      - text: "df.head(3).iloc"
  - question: "How do you select a specific cell with loc?"
    options:
      - text: "df.iloc[row, col]"
      - text: "df.loc[index, column]"
        correct: true
      - text: "df.get(row, col)"
      - text: "df.select(row, col)"
---

## The problem with bracket indexing

Basic bracket indexing `df[mask]` works for row filtering and `df["col"]` for column selection. But when you need to select specific rows **and** specific columns in one step, or edit individual cells, you need `loc` and `iloc`.

```python
import pandas as pd

url = "https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv"
df = pd.read_csv(url)
```

## loc: label-based selection

`loc` selects by **label** — the row index labels and column names:

```python
# Select row at index label 0, columns "Name" and "Age"
print(df.loc[0, ["Name", "Age"]])
```

Output:

```
Name    Braund, Mr. Owen Harris
Age                        22.0
Name: 0, dtype: object
```

**Slice by label** — the endpoint is inclusive (unlike Python slicing):

```python
# Rows 0 through 4, columns Name through Age
print(df.loc[0:4, "Name":"Age"])
```

**Select all rows for specific columns:**

```python
print(df.loc[:, ["Name", "Survived"]].head())
```

**Select all columns for specific rows:**

```python
print(df.loc[[0, 5, 10]])
```

## iloc: position-based selection

`iloc` selects by **integer position** — the row/column number starting from 0:

```python
# First row, first three columns
print(df.iloc[0, :3])
```

Output:

```
PassengerId                            1
Survived                               0
Pclass                                 3
Name: 0, dtype: object
```

**Slice by position** — the endpoint is exclusive (standard Python behavior):

```python
# Rows 0-4 (5 rows), columns 0-2 (3 columns)
print(df.iloc[0:5, 0:3])
```

**Select specific rows and columns:**

```python
# Rows 0, 1, 5; columns 3 (Name) and 4 (Age)
print(df.iloc[[0, 1, 5], [3, 4]])
```

## loc vs iloc: key differences

| Feature | loc | iloc |
|---|---|---|
| Selection by | Labels (names) | Integer positions |
| Slice endpoint | Inclusive | Exclusive |
| Column selection | By name | By position |
| Best for | Named indices | Default integer index |

```python
# These are different:
df.loc[0:5]       # rows with labels 0 through 5 (inclusive) — 6 rows
df.iloc[0:5]      # rows at positions 0 through 4 (exclusive) — 5 rows
```

## Using loc for assignment

`loc` is not just for reading — you can use it to **edit** specific cells:

```python
# Set Age to 0 for the first passenger
df.loc[0, "Age"] = 0

# Set Fare to -1 for rows where Fare is negative
df.loc[df["Fare"] < 0, "Fare"] = 0

# Create a new column based on conditions
df.loc[df["Age"] < 18, "Category"] = "Minor"
df.loc[df["Age"] >= 18, "Category"] = "Adult"
```

This targeted editing is essential for data cleaning.

## Practical patterns

**Get a specific cell value:**

```python
# The name of the passenger at position 100
name = df.loc[100, "Name"]
print(name)
```

**Select a range of columns:**

```python
# All rows, columns from "Name" to "Fare"
print(df.loc[:, "Name":"Fare"].head())
```

**Conditional selection with both axes:**

```python
# Female passengers, only Name and Age columns
women = df.loc[df["Sex"] == "female", ["Name", "Age"]]
print(women.head())
```

## Try It

From the Titanic dataset:
1. Use `iloc` to print the first 3 rows and first 4 columns
2. Use `loc` to print the Name and Fare of the passenger at index 50
3. Use `loc` to set the Age of the passenger at index 0 to 25

```python
import pandas as pd

url = "https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv"
df = pd.read_csv(url)

# First 3 rows, first 4 columns
print(df.iloc[0:3, 0:4])

# Name and Fare at index 50
print(df.loc[50, ["Name", "Fare"]])

# Set Age to 25
df.loc[0, "Age"] = 25
print(df.loc[0, "Age"])
```

## Key Takeaways

- `loc` selects by label (names); `iloc` selects by integer position
- `loc` slices are inclusive on both ends; `iloc` slices follow Python convention (exclusive end)
- `loc` supports assignment for targeted cell editing
- Combining row and column selection in one `loc` call is cleaner than chained indexing

## Practice Challenge

From the Titanic dataset, use `iloc` to extract rows 100-109 and columns 2-5 (Pclass through Age). Then use `loc` to find the names of all passengers with index labels 0, 50, 100, and 500. Finally, use `loc` to change the Fare of passenger at index 7 to 999 and verify the change.
