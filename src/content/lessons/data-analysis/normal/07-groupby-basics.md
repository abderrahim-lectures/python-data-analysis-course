---

title: "GroupBy Basics"
description: "Split data into groups and compute summaries using the split-apply-combine pattern with groupby()."
module: "groupby-aggregation"
order: 7
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "Understand the split-apply-combine pattern"
  - "Group data by one or more columns with groupby()"
  - "Apply aggregations like mean(), sum(), count(), and describe()"
  - "Use agg() for multiple aggregations at once"
prerequisites: ["data-cleaning"]
tags: ["pandas", "groupby", "aggregation", "split-apply-combine"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "What does df.groupby('col') do?"
    options:
      - text: "Sorts the DataFrame"
      - text: "Groups rows by unique values in the column"
        correct: true
      - text: "Removes duplicates"
      - text: "Creates a new column"
  - question: "How do you calculate the mean of each group?"
    options:
      - text: "df.groupby('col').mean()"
        correct: true
      - text: "df.mean().groupby('col')"
      - text: "df.group('col').average()"
      - text: "df.groupby('col').sum() / df.groupby('col').count()"
  - question: "What does df.groupby('col').size() return?"
    options:
      - text: "The total number of rows"
      - text: "The count of rows per group"
        correct: true
      - text: "The memory size of each group"
      - text: "The number of columns"
---

## The split-apply-combine pattern

GroupBy is one of pandas' most powerful features. It follows a three-step pattern:

1. **Split** — divide the DataFrame into groups based on one or more columns
2. **Apply** — compute a function on each group independently
3. **Combine** — merge the results back into a single DataFrame

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")
```

## Grouping by a single column

```python
# Average survival rate by passenger class
print(df.groupby("Pclass")["Survived"].mean())
```

Output:

```
Pclass
1    0.629630
2    0.472826
3    0.242363
Name: Survived, dtype: float64
```

First-class passengers had a 63% survival rate, compared to 24% for third class. Groupby revealed a stark class difference in seconds.

**What happens step by step:**

```python
# This is conceptually what groupby does:
for pclass, group_df in df.groupby("Pclass"):
    print(f"Class {pclass}: {group_df['Survived'].mean():.3f}")
```

## Grouping by multiple columns

```python
# Survival rate by class and sex
print(df.groupby(["Pclass", "Sex"])["Survived"].mean())
```

Output:

```
Pclass  Sex   
1       female    0.968085
        male      0.368852
2       female    0.921053
        male      0.157407
3       female    0.500000
        male      0.135447
Name: Survived, dtype: float64
```

Use `unstack()` to make this easier to read:

```python
print(df.groupby(["Pclass", "Sex"])["Survived"].mean().unstack())
```

## Aggregation methods

Groupby supports all standard aggregations:

```python
# Mean fare by class
print(df.groupby("Pclass")["Fare"].mean())

# Total fare collected per class
print(df.groupby("Pclass")["Fare"].sum())

# Count of passengers per class
print(df.groupby("Pclass")["PassengerId"].count())
```

## Multiple aggregations with agg()

The `agg()` method applies multiple functions at once:

```python
print(df.groupby("Pclass")["Fare"].agg(["mean", "median", "min", "max", "count"]))
```

Output:

```
              mean  median     min       max  count
Pclass                                             
1        84.154687  60.287  0.0000  512.3292    216
2        20.662183  19.575  0.0000   73.5000    184
3        13.675550   8.050  0.0000   56.4958    491
```

**Different aggregations per column:**

```python
print(df.groupby("Pclass").agg({
    "Survived": "mean",
    "Fare": ["mean", "max"],
    "Age": "median",
    "Name": "count"
}))
```

## Aggregating all numeric columns

```python
# Quick summary of all numeric columns per group
print(df.groupby("Pclass").mean(numeric_only=True))
```

## GroupBy with filters

After grouping, you can filter entire groups:

```python
# Keep only groups with more than 50 passengers
large_groups = df.groupby("Pclass").filter(lambda x: len(x) > 50)
print(large_groups["Pclass"].value_counts())
```

## Try It

Using the Titanic dataset, calculate:
1. The average fare for each embarkation port
2. The survival rate for each combination of sex and embarkation port
3. The age statistics (mean, median, min, max) for each passenger class

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")

print("Average fare by port:")
print(df.groupby("Embarked")["Fare"].mean())

print("\nSurvival by sex and port:")
print(df.groupby(["Sex", "Embarked"])["Survived"].mean().unstack())

print("\nAge stats by class:")
print(df.groupby("Pclass")["Age"].agg(["mean", "median", "min", "max"]))
```

## Key Takeaways

- GroupBy follows the split-apply-combine pattern: split data, apply a function, combine results
- Group by one column for simple summaries, multiple columns for deeper analysis
- `agg()` lets you compute multiple statistics at once, per column if needed
- Groupby reveals patterns that are invisible in the raw data

## Practice Challenge

From the Titanic dataset, calculate the survival rate for each combination of Pclass, Sex, and whether the passenger was traveling alone (SibSp + Parch == 0). Which group had the highest survival rate? Which had the lowest?
