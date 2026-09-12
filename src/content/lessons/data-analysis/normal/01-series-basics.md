---

title: "Creating Series"
description: "Build one-dimensional labeled arrays from lists, dictionaries, and scalar values using pandas Series."
module: "series-dataframe"
order: 1
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "Create a Series from a list, dictionary, or scalar value"
  - "Understand the role of the index in a Series"
  - "Access values and indices in a Series"
  - "Perform vectorized operations on Series data"
prerequisites: ["python-basics"]
tags: ["pandas", "series", "data-structures"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "What is a pandas Series?"
    options:
      - text: "A 2D table of data"
      - text: "A 1D labeled array"
        correct: true
      - text: "A Python list"
      - text: "A SQL table"
  - question: "How do you create a Series from a list?"
    options:
      - text: "pd.Series([1, 2, 3])"
        correct: true
      - text: "pd.array([1, 2, 3])"
      - text: "pd.List([1, 2, 3])"
      - text: "pd.DataFrame([1, 2, 3])"
  - question: "What does s.dtype tell you?"
    options:
      - text: "The length of the Series"
      - text: "The data type of each element"
        correct: true
      - text: "The sum of all values"
      - text: "The index labels"
---

## What is a Series?

A pandas **Series** is a one-dimensional labeled array. Think of it as a single column from a spreadsheet, each value has a label (the index) and the data can be any type: integers, floats, strings, or even Python objects.

```python
import pandas as pd

scores = pd.Series([88, 92, 75, 81])
print(scores)
```

Output:

```
0    88
1    92
2    75
3    81
dtype: int64
```

The left column is the **index** (0, 1, 2, 3 by default). The right column is the data. Together they form a Series.

## Creating Series from different sources

**From a list**, the index defaults to a range of integers:

```python
temperatures = pd.Series([22.5, 24.1, 19.8, 26.3])
print(temperatures)
```

**From a dictionary**, the keys become the index:

```python
population = pd.Series({
    "Lagos": 15_400_000,
    "Cairo": 20_900_000,
    "Johannesburg": 5_600_000,
})
print(population)
```

Output:

```
Lagos           15400000
Cairo           20900000
Johannesburg     5600000
dtype: int64
```

**From a scalar**, a single value is repeated to fill the index:

```python
zeros = pd.Series(0, index=["a", "b", "c", "d"])
print(zeros)
```

## Accessing values

Use the index to retrieve values. With a labeled index, you can use bracket notation or dot access:

```python
print(population["Cairo"])           # 20900000
print(population[["Lagos", "Johannesburg"]])  # subset with multiple labels
```

With an integer index, you can slice like a list:

```python
print(scores[1:3])   # select index 1 and 2
```

## Vectorized operations

Series support element-wise operations without loops:

```python
celsius = pd.Series([22, 25, 18, 30])
fahrenheit = celsius * 9 / 5 + 32
print(fahrenheit)
```

Output:

```
0    71.6
1    77.0
2    64.4
3    86.0
dtype: float64
```

Comparison operators return a boolean Series:

```python
print(celsius > 24)
```

Output:

```
0    False
1     True
2    False
3     True
dtype: bool
```

## Useful Series attributes and methods

| Attribute/Method | Description |
|---|---|
| `.values` | Returns the underlying NumPy array |
| `.index` | Returns the index object |
| `.dtype` | Returns the data type |
| `.shape` | Returns `(n,)` tuple |
| `.mean()`, `.sum()`, `.max()` | Aggregation methods |
| `.value_counts()` | Count unique values |

```python
print(scores.mean())       # 84.0
print(scores.max())        # 92
print(scores.shape)        # (4,)
```

## Try It

Create a Series called `grades` with the following student scores: Alice: 87, Bob: 92, Carol: 78, David: 95. Print the Series, then calculate and print the mean score. Finally, create a boolean Series showing which students scored above 85.

```python
import pandas as pd

grades = pd.Series({"Alice": 87, "Bob": 92, "Carol": 78, "David": 95})
print(grades)
print(f"Mean: {grades.mean()}")
print(grades > 85)
```

## Key Takeaways

- A Series is a one-dimensional labeled array, the foundation of pandas
- The index provides labels for accessing and slicing data
- Vectorized operations let you transform entire columns without loops
- Dictionaries are a natural source for Series with meaningful labels

## Practice Challenge

You have a dictionary representing monthly rainfall in millimeters: `{"Jan": 45, "Feb": 38, "Mar": 52, "Apr": 61, "May": 48, "Jun": 35}`. Create a Series from it, then calculate the total rainfall and the average monthly rainfall. Which month had the most rain? Which had the least?
