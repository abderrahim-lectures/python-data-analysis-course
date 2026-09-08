---

title: "Handling Missing Values"
description: "Detect, drop, and fill missing values with isna(), dropna(), and fillna() to prepare data for analysis."
module: "data-cleaning"
order: 6
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "Detect missing values with isna() and notna()"
  - "Drop rows or columns with missing values using dropna()"
  - "Fill missing values with specific numbers, statistics, or strategies using fillna()"
  - "Choose the right strategy for handling missing data"
prerequisites: ["selection-filtering"]
tags: ["pandas", "missing-values", "cleaning", "fillna"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "How do you check for missing values in a DataFrame?"
    options:
      - text: "df.isnull()"
        correct: true
      - text: "df.missing()"
      - text: "df.hasna()"
      - text: "df.nodata()"
  - question: "What does df.dropna() do?"
    options:
      - text: "Fills missing values with 0"
      - text: "Removes rows with any missing values"
        correct: true
      - text: "Removes columns with missing values"
      - text: "Counts missing values"
  - question: "How do you fill missing values with the column mean?"
    options:
      - text: "df.fillna(0)"
      - text: "df.fillna(df.mean())"
        correct: true
      - text: "df.replace(nan, mean)"
      - text: "df.mean().fill()"
---

## Why missing values matter

Almost every real dataset has missing values. If you ignore them, aggregations return NaN, visualizations break, and machine learning models fail. The first step in any analysis is understanding and addressing missing data.

```python
import pandas as pd

url = "https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv"
df = pd.read_csv(url)
```

## Detecting missing values

**Check a single column:**

```python
print(df["Age"].isna().sum())   # 177 missing Age values
```

**Check all columns at once:**

```python
print(df.isna().sum())
```

Output:

```
PassengerId      0
Survived         0
Pclass           0
Name             0
Sex              0
Age            177
SibSp            0
Parch            0
Ticket           0
Fare             0
Cabin          687
Embarked         2
dtype: int64
```

**See the percentage missing:**

```python
print((df.isna().sum() / len(df) * 100).round(1))
```

Output:

```
Cabin          77.1%
Age            19.9%
Embarked        0.2%
...
```

Cabin is 77% missing — too much to fill meaningfully. Age is 20% — worth attempting to fill. Embarked has only 2 missing — easy to handle.

## Dropping missing values

**Drop rows with any missing values:**

```python
df_clean = df.dropna()
print(df_clean.shape)   # (183, 12) — lost most rows
```

This is too aggressive for most datasets. You lose 708 of 891 rows.

**Drop rows where all values are missing:**

```python
df_clean = df.dropna(how="all")
```

**Drop rows missing values in specific columns:**

```python
df_clean = df.dropna(subset=["Age", "Embarked"])
print(df_clean.shape)   # (712, 12) — much better
```

**Drop columns with too many missing values:**

```python
# Drop columns where more than 50% is missing
threshold = len(df) * 0.5
df_clean = df.dropna(thresh=threshold, axis=1)
```

## Filling missing values

**Fill with a constant:**

```python
df["Embarked"] = df["Embarked"].fillna("S")   # most common port
```

**Fill with a statistic:**

```python
df["Age"] = df["Age"].fillna(df["Age"].median())
```

**Fill forward or backward** — useful for time series:

```python
# Use the previous valid value to fill gaps
df["Price"] = df["Price"].ffill()

# Use the next valid value
df["Price"] = df["Price"].bfill()
```

**Fill with different values per column:**

```python
fill_values = {"Age": df["Age"].median(), "Embarked": "S", "Cabin": "Unknown"}
df = df.fillna(fill_values)
```

## Choosing a strategy

| Scenario | Strategy |
|---|---|
| Missing values are random and few (< 5%) | Drop with `dropna(subset=[...])` |
| Missing values in numeric column | Fill with median (robust to outliers) |
| Missing values in categorical column | Fill with mode or "Unknown" |
| Column is > 50% missing | Drop the entire column |
| Time series data | Use `ffill()` or `bfill()` |

## Common pitfalls

**Filling before splitting train/test** — this leaks information. Calculate fill values on training data only, then apply to both.

**Dropping too aggressively** — always check how many rows you lose. `dropna()` without arguments often removes far more than expected.

**Forgetting to check** — always run `df.isna().sum()` after filling to confirm no NaN values remain.

## Try It

From the Titanic dataset:
1. Calculate the percentage of missing values for each column
2. Drop the Cabin column (too many missing values)
3. Fill Age with the median age
4. Fill Embarked with the most common value
5. Verify no missing values remain

```python
import pandas as pd

url = "https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv"
df = pd.read_csv(url)

print((df.isna().sum() / len(df) * 100).round(1))

df = df.drop(columns=["Cabin"])
df["Age"] = df["Age"].fillna(df["Age"].median())
df["Embarked"] = df["Embarked"].fillna(df["Embarked"].mode()[0])

print(df.isna().sum())
```

## Key Takeaways

- Always inspect missing values first with `isna().sum()` before deciding on a strategy
- `dropna()` is powerful but often too aggressive without `subset` or `thresh`
- `fillna()` with median or mode is the most common filling strategy
- Columns with > 50% missing values are usually better dropped than filled

## Practice Challenge

Load the Titanic dataset and create a cleaned version: drop Cabin, fill Age with median, fill Embarked with mode. Then compare the survival rate before and after cleaning. Did cleaning change the overall survival rate? Why or why not?
