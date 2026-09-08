---

title: "Merging DataFrames"
description: "Combine related datasets using merge(), join(), and concat() to build comprehensive analysis tables."
module: "groupby-aggregation"
order: 8
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "Merge two DataFrames on a shared key with merge()"
  - "Understand inner, left, right, and outer joins"
  - "Concatenate DataFrames vertically with concat()"
  - "Handle merge conflicts when columns have overlapping names"
prerequisites: ["data-cleaning", "groupby-basics"]
tags: ["pandas", "merge", "join", "concat", "combining"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "What is a pandas merge?"
    options:
      - text: "Combining two DataFrames by common columns or indices"
        correct: true
      - text: "Adding rows to a DataFrame"
      - text: "Deleting duplicate rows"
      - text: "Sorting a DataFrame"
  - question: "What type of merge keeps only matching rows?"
    options:
      - text: "outer"
      - text: "inner"
        correct: true
      - text: "left"
      - text: "right"
  - question: "What happens with a left merge if the right DataFrame has no match?"
    options:
      - text: "The row is dropped"
      - text: "NaN values fill the right columns"
        correct: true
      - text: "An error occurs"
      - text: "The row is duplicated"
---

## Why merge?

Real analyses often require data from multiple sources. Merging combines two DataFrames based on a shared key — like a SQL JOIN or a VLOOKUP in Excel.

```python
import pandas as pd

# Create sample DataFrames
passengers = pd.DataFrame({
    "passenger_id": [1, 2, 3, 4, 5],
    "name": ["Alice", "Bob", "Carol", "David", "Eve"],
    "class": [1, 3, 2, 3, 1]
})

tickets = pd.DataFrame({
    "passenger_id": [1, 2, 3, 6],
    "fare": [100.0, 15.5, 26.0, 30.0],
    "embarked": ["S", "C", "S", "Q"]
})
```

## Basic merge

```python
merged = pd.merge(passengers, tickets, on="passenger_id")
print(merged)
```

Output:

```
   passenger_id   name  class   fare embarked
0             1  Alice      1  100.0        S
1             2    Bob      3   15.5        C
2             3  Carol      2   26.0        S
```

Only passengers 1, 2, and 3 appear — this is an **inner join** (the default). Passenger 4 and 5 have no ticket data; passenger 6 has no passenger data.

## Join types

**Inner join** (default) — only matching rows from both sides:

```python
pd.merge(passengers, tickets, on="passenger_id")
```

**Left join** — keep all rows from the left DataFrame:

```python
pd.merge(passengers, tickets, on="passenger_id", how="left")
```

Output:

```
   passenger_id   name  class   fare embarked
0             1  Alice      1  100.0        S
1             2    Bob      3   15.5        C
2             3  Carol      2   26.0        S
3             4  David      3    NaN      NaN
4             5    Eve      1    NaN      NaN
```

**Right join** — keep all rows from the right DataFrame:

```python
pd.merge(passengers, tickets, on="passenger_id", how="right")
```

**Outer join** — keep all rows from both sides:

```python
pd.merge(passengers, tickets, on="passenger_id", how="outer")
```

Output:

```
   passenger_id   name  class   fare embarked
0             1  Alice    1.0  100.0        S
1             2    Bob    3.0   15.5        C
2             3  Carol    2.0   26.0        S
3             4  David    3.0    NaN      NaN
4             5    Eve    1.0    NaN      NaN
5             6    NaN    NaN   30.0        Q
```

## Merging on different column names

When the key columns have different names, use `left_on` and `right_on`:

```python
df1 = pd.DataFrame({"id_a": [1, 2, 3], "val": ["x", "y", "z"]})
df2 = pd.DataFrame({"id_b": [1, 2, 3], "score": [10, 20, 30]})

merged = pd.merge(df1, df2, left_on="id_a", right_on="id_b")
print(merged)
```

## Handling overlapping column names

When both DataFrames have columns with the same name (other than the key), pandas adds suffixes:

```python
merged = pd.merge(passengers, tickets, on="passenger_id", suffixes=("_pass", "_tick"))
```

## Merging on index

If the key is the index, use `left_index` and `right_index`:

```python
passengers_idx = passengers.set_index("passenger_id")
tickets_idx = tickets.set_index("passenger_id")

merged = pd.merge(passengers_idx, tickets_idx, left_index=True, right_index=True)
```

## Concatenation

`concat()` stacks DataFrames vertically or horizontally:

**Vertical (stacking rows):**

```python
df_top = pd.DataFrame({"name": ["Alice", "Bob"], "score": [88, 92]})
df_bottom = pd.DataFrame({"name": ["Carol", "David"], "score": [79, 95]})

combined = pd.concat([df_top, df_bottom], ignore_index=True)
print(combined)
```

**Horizontal (adding columns):**

```python
df_a = pd.DataFrame({"name": ["Alice", "Bob"]})
df_b = pd.DataFrame({"score": [88, 92]})

combined = pd.concat([df_a, df_b], axis=1)
```

## Practical example: Titanic data

```python
url = "https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv"
titanic = pd.read_csv(url)

# Create a summary DataFrame
class_stats = titanic.groupby("Pclass").agg(
    avg_fare=("Fare", "mean"),
    avg_age=("Age", "median"),
    survival_rate=("Survived", "mean")
).reset_index()

print(class_stats)
```

The `reset_index()` converts the grouped index back to a regular column, which is necessary before merging.

## Try It

Create two DataFrames: `students` with columns `id`, `name` and `grades` with columns `id`, `math`, `english`. Merge them on `id` with a left join. Then concatenate two small DataFrames vertically.

```python
import pandas as pd

students = pd.DataFrame({"id": [1, 2, 3], "name": ["Alice", "Bob", "Carol"]})
grades = pd.DataFrame({"id": [1, 2, 4], "math": [88, 92, 75], "english": [90, 85, 80]})

merged = pd.merge(students, grades, on="id", how="left")
print(merged)

df1 = pd.DataFrame({"name": ["X", "Y"], "val": [1, 2]})
df2 = pd.DataFrame({"name": ["Z"], "val": [3]})
print(pd.concat([df1, df2], ignore_index=True))
```

## Key Takeaways

- `merge()` combines DataFrames on shared keys; `concat()` stacks them vertically or horizontally
- The `how` parameter controls join type: inner (default), left, right, outer
- Use `left_on`/`right_on` when key columns have different names
- Always `reset_index()` after groupby before merging

## Practice Challenge

From the Titanic dataset, create a summary DataFrame grouped by Pclass with columns: Pclass, avg_fare, survival_rate, passenger_count. Then create another summary grouped by Embarked. Merge these two summaries on Pclass using a left join. What information is lost or gained?
