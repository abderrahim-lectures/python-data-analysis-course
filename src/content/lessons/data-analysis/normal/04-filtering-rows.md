---

title: "Filtering Rows"
description: "Use boolean conditions to keep only the rows that match your criteria in a pandas DataFrame."
module: "selection-filtering"
order: 4
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "Filter rows using a single boolean condition"
  - "Combine multiple conditions with & and | operators"
  - "Use .isin() and .between() for common filter patterns"
  - "Filter with string methods using .str accessor"
prerequisites: ["series-dataframe", "selecting-columns"]
tags: ["pandas", "filtering", "boolean", "conditions"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "How do you filter rows where age > 30?"
    options:
      - text: "df.filter(age > 30)"
      - text: "df[df.age > 30]"
        correct: true
      - text: "df.where('age > 30')"
      - text: "df.select(age > 30)"
  - question: "What does df[df.age > 30] return?"
    options:
      - text: "A Series"
      - text: "A DataFrame with only rows where age > 30"
        correct: true
      - text: "A single value"
      - text: "A list of indices"
  - question: "How do you filter with multiple conditions?"
    options:
      - text: "df[df.age > 30 and df.salary > 50000]"
      - text: "df[(df.age > 30) & (df.salary > 50000)]"
        correct: true
      - text: "df.filter(age > 30, salary > 50000)"
      - text: "df.where(age > 30 and salary > 50000)"
---

## Filtering with boolean conditions

Filtering is how you focus on the subset of data that matters. You create a **boolean mask**, a Series of True/False values, and use it to select rows.

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")

# Filter passengers older than 30
older = df[df["Age"] > 30]
print(older.shape)   # fewer rows than original 891
```

The expression `df["Age"] > 30` produces a boolean Series:

```
0       True
1       True
2      False
3       True
...
```

Passing it inside `df[...]` keeps only the rows where the value is `True`.

## Combining conditions

Use `&` (and) and `|` (or) to combine conditions. **Each condition must be wrapped in parentheses:**

```python
# Female passengers in first class
first_class_female = df[(df["Sex"] == "female") & (df["Pclass"] == 1)]
print(first_class_female.head())
```

```python
# Passengers younger than 25 OR older than 60
young_or_old = df[(df["Age"] < 25) | (df["Age"] > 60)]
print(young_or_old.shape)
```

Common mistake: using `and`/`or` instead of `&`/`|`. Python's `and`/`or` operators do not work element-wise on pandas Series and will raise an error.

## Using .isin() for multiple values

When you need to match against a list of values, use `.isin()`:

```python
# Passengers who embarked from Cherbourg or Southampton
embarked_filter = df[df["Embarked"].isin(["C", "S"])]
```

```python
# Passengers in class 1 or 2
upper_classes = df[df["Pclass"].isin([1, 2])]
```

## Using .between() for ranges

The `.between()` method is cleaner than chaining two comparisons:

```python
# Passengers aged 20 to 30 (inclusive by default)
twenties = df[df["Age"].between(20, 30)]
print(twenties.shape)
```

This is equivalent to `df[(df["Age"] >= 20) & (df["Age"] <= 30)]` but more readable.

## Filtering with string methods

The `.str` accessor lets you apply string operations to an entire column:

```python
# Passengers whose name contains "Master" (a title)
masters = df[df["Name"].str.contains("Master", na=False)]
print(masters.shape)
```

```python
# Passengers whose ticket starts with "A"
a_tickets = df[df["Ticket"].str.startswith("A", na=False)]
```

The `na=False` parameter handles missing values gracefully, without it, NaN entries would cause errors.

## Filtering with .query()

For complex filters, `.query()` provides a readable alternative:

```python
# Equivalent to df[(df["Age"] > 25) & (df["Survived"] == 1)]
survivors_over_25 = df.query("Age > 25 and Survived == 1")
```

This reads almost like English and avoids repetitive `df["column"]` syntax.

## Storing filters in variables

For complex conditions, store the boolean mask in a variable first:

```python
is_female = df["Sex"] == "female"
is_first_class = df["Pclass"] == 1
is_survived = df["Survived"] == 1

# Combine them
result = df[is_female & is_first_class & is_survived]
print(f"Female first-class survivors: {len(result)}")
```

This approach makes your code much easier to read and debug.

## Try It

From the Titanic dataset, filter to find:
1. All passengers who paid more than 100 in fare
2. All female passengers in third class
3. All passengers with the title "Mrs" in their name

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")

high_fare = df[df["Fare"] > 100]
print(f"High fare passengers: {len(high_fare)}")

third_class_female = df[(df["Sex"] == "female") & (df["Pclass"] == 3)]
print(f"Third-class females: {len(third_class_female)}")

mrs = df[df["Name"].str.contains("Mrs", na=False)]
print(f"Passengers with title Mrs: {len(mrs)}")
```

## Key Takeaways

- Boolean indexing `df[mask]` is the primary filtering mechanism in pandas
- Use `&` for AND, `|` for OR, always wrap individual conditions in parentheses
- `.isin()` matches against a list; `.between()` handles ranges cleanly
- `.str.contains()` filters by substring match, use `na=False` for safety

## Practice Challenge

From the Titanic dataset, find all passengers who: (1) were male, (2) were in second or third class, (3) were between 18 and 35 years old, and (4) survived. How many passengers match all four conditions?
