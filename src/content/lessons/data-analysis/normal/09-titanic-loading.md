---

title: "Loading & Exploring Titanic"
description: "Load the Titanic dataset, inspect its structure, understand each column, and prepare for analysis."
module: "titanic-eda"
order: 9
difficulty: "intermediate"
estimatedMinutes: 30
learningObjectives:
  - "Load the Titanic dataset and inspect its structure"
  - "Inspect the dataset structure with head(), info(), describe(), and value_counts()"
  - "Identify data quality issues: missing values, wrong types, inconsistencies"
  - "Document initial observations before cleaning"
prerequisites: ["groupby-aggregation"]
tags: ["pandas", "eda", "titanic", "exploration"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "How do you load a CSV file with pandas?"
    options:
      - text: "pd.read_csv('file.csv')"
        correct: true
      - text: "pd.load('file.csv')"
      - text: "pd.open('file.csv')"
      - text: "pd.import_csv('file.csv')"
  - question: "What does df.head() show?"
    options:
      - text: "The last 5 rows"
      - text: "The first 5 rows"
        correct: true
      - text: "All rows"
      - text: "Column names only"
  - question: "How do you check the data types of all columns?"
    options:
      - text: "df.types"
      - text: "df.dtypes"
        correct: true
      - text: "df.info.types"
      - text: "df.schema()"
---

## The Titanic dataset

The RMS Titanic sank on April 15, 1912, after hitting an iceberg. This dataset contains information about 891 passengers, including whether they survived. It is the most widely used dataset for learning data analysis because it mixes numeric, categorical, and missing data in realistic ways.

## Loading the data

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")
```

## First look at the data

Always start with `head()` to see what you are working with:

```python
print(df.head(10))
```

Output:

```
   PassengerId  Survived  Pclass  \
0            1         0       3   
1            2         1       1   
2            3         1       3   
3            4         1       1   
4            5         0       3   
...

                                                Name     Sex   Age  SibSp  \
0                            Braund, Mr. Owen Harris    male  22.0      1   
1  Cumings, Mrs. John Bradley (Florence Briggs Th...  female  38.0      1   
2                             Heikkinen, Miss. Laina  female  26.0      0   
3       Futrelle, Mrs. Jacques Heath (Lily May Peel)  female  35.0      1   
4                           Allen, Mr. William Henry    male  35.0      0   

   Parch            Ticket     Fare Cabin Embarked  
0      0         A/5 21171   7.2500   NaN        S  
1      0          PC 17599  71.2833   C85        C  
2      0  STON/O2. 3101282   7.9250   NaN        S  
3      0            113803  53.1000  C123        S  
4      0            373450   8.0500   NaN        S  
```

## Understanding each column

| Column | Description | Type |
|---|---|---|
| PassengerId | Unique ID for each passenger | int |
| Survived | Survival (0 = No, 1 = Yes) | int (binary) |
| Pclass | Ticket class (1 = 1st, 2 = 2nd, 3 = 3rd) | int (ordinal) |
| Name | Passenger name | string |
| Sex | Gender | string (binary) |
| Age | Age in years | float (has missing) |
| SibSp | Number of siblings/spouses aboard | int |
| Parch | Number of parents/children aboard | int |
| Ticket | Ticket number | string |
| Fare | Passenger fare | float |
| Cabin | Cabin number | string (mostly missing) |
| Embarked | Port of embarkation (C, Q, S) | string (categorical) |

## Deep inspection with info()

```python
print(df.info())
```

Output:

```
<class 'pandas.core.frame.DataFrame'>
RangeIndex: 891 entries, 0 to 890
Data columns (total 12 columns):
 #   Column       Non-Null Count  Dtype  
---  ------       --------------  -----  
 0   PassengerId  891 non-null    int64  
 1   Survived     891 non-null    int64  
 2   Pclass       891 non-null    int64  
 3   Name         891 non-null    object 
 4   Sex          891 non-null    object 
 5   Age          714 non-null    float64
 6   SibSp        891 non-null    int64  
 7   Parch        891 non-null    int64  
 8   Ticket       891 non-null    object 
 9   Fare         891 non-null    float64
 10  Cabin        204 non-null    object 
 11  Embarked     889 non-null    object 
dtypes: float64(2), int64(5), object(5)
```

Key observations:
- **Age**: 177 missing values (20%)
- **Cabin**: 687 missing values (77%), too much to fill
- **Embarked**: only 2 missing values, easy to fix

## Statistical summary

```python
print(df.describe())
```

This shows count, mean, std, min, quartiles, and max for all numeric columns. Notice:
- `Fare` has a wide range (0 to 512) with a high max, likely outliers
- `Age` ranges from 0.42 (infant) to 80 years
- `Survived` is binary, mean of 0.38 means 38% survived

## Categorical distributions

```python
print(df["Sex"].value_counts())
# male      577
# female    314

print(df["Pclass"].value_counts().sort_index())
# 1    216
# 2    184
# 3    491

print(df["Embarked"].value_counts())
# S    644
# C    168
# Q     77
```

## Missing values summary

```python
missing = df.isna().sum()
missing_pct = (missing / len(df) * 100).round(1)
print(pd.DataFrame({"count": missing, "percent": missing_pct}).query("count > 0"))
```

Output:

```
        count  percent
Age       177     19.9
Cabin     687     77.1
Embarked    2      0.2
```

## Initial observations

Before any analysis, note these patterns:
1. **Class survival gap**, first class likely had higher survival rates
2. **Gender bias**, "women and children first" policy may show in the data
3. **Missing Age**, 20% missing, needs a filling strategy
4. **Cabin useless**, 77% missing, probably should be dropped
5. **Fare outliers**, some passengers paid vastly more than others

## Try It

Load the Titanic dataset and answer these questions:
1. How many passengers were traveling alone (SibSp == 0 and Parch == 0)?
2. What is the average age of male vs female passengers?
3. Which embarkation port had the highest survival rate?

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")

alone = ((df["SibSp"] == 0) & (df["Parch"] == 0)).sum()
print(f"Traveling alone: {alone}")

print(df.groupby("Sex")["Age"].mean())

print(df.groupby("Embarked")["Survived"].mean())
```

## Key Takeaways

- Always start EDA with `head()`, `info()`, and `describe()` to understand structure
- `value_counts()` reveals the distribution of categorical columns
- Missing value analysis should happen before any cleaning decisions
- Document observations, they guide your entire analysis plan

## Practice Challenge

Create a "data quality report" for the Titanic dataset: for each column, note the data type, number of missing values, and one interesting fact (e.g., "Fare ranges from 0 to 512"). This report will guide your cleaning steps in the next lesson.
