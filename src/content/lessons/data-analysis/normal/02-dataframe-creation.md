---

title: "Creating DataFrames"
description: "Build two-dimensional tabular data from dictionaries, lists of records, and CSV files using pandas DataFrames."
module: "series-dataframe"
order: 2
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "Create a DataFrame from a dictionary of lists"
  - "Create a DataFrame from a list of dictionaries"
  - "Read a CSV file into a DataFrame with pd.read_csv()"
  - "Inspect a DataFrame with head(), info(), describe(), and shape"
prerequisites: ["series-dataframe"]
tags: ["pandas", "dataframe", "csv", "inspection"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "What is a pandas DataFrame?"
    options:
      - text: "A 1D array"
      - text: "A 2D labeled data structure with columns"
        correct: true
      - text: "A Python dictionary"
      - text: "A SQL query"
  - question: "How do you create a DataFrame from a dictionary?"
    options:
      - text: "pd.DataFrame({'col': [1, 2]})"
        correct: true
      - text: "pd.Table({'col': [1, 2]})"
      - text: "pd.Array({'col': [1, 2]})"
      - text: "pd.Series({'col': [1, 2]})"
  - question: "What does df.shape return?"
    options:
      - text: "The column names"
      - text: "(rows, columns) as a tuple"
        correct: true
      - text: "The data types"
      - text: "The first 5 rows"
---

## What is a DataFrame?

A pandas **DataFrame** is a two-dimensional labeled data structure, think of it as a spreadsheet, SQL table, or dictionary of Series objects. Each column is a Series, and all columns share the same index.

```python
import pandas as pd

df = pd.DataFrame({
    "Name": ["Alice", "Bob", "Carol"],
    "Age": [24, 30, 28],
    "Score": [88, 92, 79]
})
print(df)
```

Output:

```
    Name  Age  Score
0  Alice   24     88
1    Bob   30     92
2  Carol   28     79
```

## Creating DataFrames from different sources

**From a dictionary of lists**, each key becomes a column name:

```python
df = pd.DataFrame({
    "City": ["Lagos", "Nairobi", "Cairo"],
    "Population": [15_400_000, 4_400_000, 20_900_000],
    "Country": ["Nigeria", "Kenya", "Egypt"]
})
```

**From a list of dictionaries**, each dictionary is a row:

```python
records = [
    {"Name": "Alice", "Score": 88},
    {"Name": "Bob", "Score": 92},
    {"Name": "Carol", "Score": 79},
]
df = pd.DataFrame(records)
```

**From a Series**, multiple Series combine into columns:

```python
names = pd.Series(["Alice", "Bob", "Carol"])
scores = pd.Series([88, 92, 79])
df = pd.DataFrame({"Name": names, "Score": scores})
```

## Reading CSV files

The most common way to load real data is from a CSV file:

```python
df = pd.read_csv("titanic.csv")
```

Useful parameters for `read_csv()`:

```python
df = pd.read_csv(
    "data.csv",
    index_col="id",        # use 'id' column as the index
    usecols=["name", "age", "fare"],  # load only these columns
    na_values=["?", ""],   # treat '?' and empty strings as NaN
    dtype={"age": "float"} # force column type
)
```

For this course we will use the Titanic dataset, which is available at:

```python
# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")
```

## Inspecting your data

After loading data, always inspect it first:

```python
df.head()        # first 5 rows
df.tail(3)       # last 3 rows
df.shape          # (rows, columns) — e.g. (891, 12)
df.info()         # column names, non-null counts, dtypes
df.describe()     # statistical summary of numeric columns
```

The `info()` method is particularly important, it reveals missing values and data types:

```
<class 'pandas.core.frame.DataFrame'>
RangeIndex: 891 entries, 0 to 890
Data columns (total 12 columns):
 #   Column    Non-Null Count  Dtype  
---  ------    --------------  -----  
 0   PassengerId  891 non-null   int64  
 1   Survived     891 non-null   int64  
 2   Pclass       891 non-null   int64  
 3   Name         891 non-null   object 
 4   Age          714 non-null   float64
 5   SibSp        891 non-null   int64  
 ...
```

Notice that `Age` has 714 non-null values out of 891, that means 177 missing values. Cleaning this up is a core skill you will learn later.

## Column access

Once you have a DataFrame, you can access columns as Series:

```python
print(df["Age"])       # returns a Series
print(df.Age)          # dot notation also works (if column name has no spaces)
```

Select multiple columns by passing a list:

```python
df[["Name", "Age"]]
```

## Try It

Create a DataFrame representing three employees with columns for Name, Department, and Salary. Print the DataFrame, then display only the Name and Salary columns.

```python
import pandas as pd

employees = pd.DataFrame({
    "Name": ["Amina", "Kofi", "Zara"],
    "Department": ["Engineering", "Marketing", "Engineering"],
    "Salary": [95000, 72000, 88000]
})
print(employees)
print(employees[["Name", "Salary"]])
```

## Key Takeaways

- A DataFrame is a table with labeled rows (index) and labeled columns
- Dictionaries of lists and lists of dictionaries are the most common construction methods
- `pd.read_csv()` loads external data, use `index_col`, `usecols`, and `na_values` for control
- Always inspect new data with `head()`, `info()`, and `describe()` before analyzing

## Practice Challenge

Load the Titanic dataset from the URL above. How many rows and columns does it have? What are the column names? How many columns have missing values? Use `info()` to find out.
