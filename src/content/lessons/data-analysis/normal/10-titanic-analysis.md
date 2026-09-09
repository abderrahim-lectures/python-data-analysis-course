---

title: "Titanic EDA Analysis"
description: "Clean the Titanic data, analyze survival patterns with groupby, and draw actionable conclusions from your exploration."
module: "titanic-eda"
order: 10
difficulty: "intermediate"
estimatedMinutes: 30
learningObjectives:
  - "Clean the Titanic dataset by handling missing values and dropping useless columns"
  - "Analyze survival rates by passenger class, sex, and age group"
  - "Create summary tables with groupby and aggregation"
  - "Draw data-driven conclusions from exploratory analysis"
prerequisites: ["titanic-loading"]
tags: ["pandas", "eda", "titanic", "analysis", "conclusions"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "What percentage of Titanic passengers survived?"
    options:
      - text: "About 25%"
      - text: "About 38%"
        correct: true
      - text: "About 50%"
      - text: "About 75%"
  - question: "Which class had the highest survival rate?"
    options:
      - text: "Third class"
      - text: "First class"
        correct: true
      - text: "Second class"
      - text: "All classes had equal rates"
  - question: "What does pd.crosstab(df.pclass, df.survived) show?"
    options:
      - text: "The average fare by class"
      - text: "The count of passengers by class and survival status"
        correct: true
      - text: "The total revenue per class"
      - text: "The age distribution"
---

## End-to-end analysis

This lesson ties together everything from the previous modules. We will load, clean, explore, and analyze the Titanic dataset in a complete workflow.

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")
```

## Step 1: Clean the data

```python
# Drop Cabin — 77% missing, not useful
df = df.drop(columns=["Cabin"])

# Fill Age with median
df["Age"] = df["Age"].fillna(df["Age"].median())

# Fill Embarked with mode (most common port)
df["Embarked"] = df["Embarked"].fillna(df["Embarked"].mode()[0])

# Verify no missing values remain
print(df.isna().sum().sum())   # 0
```

## Step 2: Feature engineering

Create useful derived columns:

```python
# Travel alone indicator
df["IsAlone"] = ((df["SibSp"] + df["Parch"]) == 0).astype(int)

# Age groups
df["AgeGroup"] = pd.cut(df["Age"], bins=[0, 12, 18, 35, 60, 100],
                         labels=["Child", "Teen", "Adult", "Middle-aged", "Senior"])

# Family size
df["FamilySize"] = df["SibSp"] + df["Parch"] + 1
```

## Step 3: Survival by class

```python
print(df.groupby("Pclass")["Survived"].agg(["mean", "count"]))
```

Output:

```
            mean  count
Pclass                 
1       0.629630    216
2       0.472826    184
3       0.242363    491
```

First-class passengers survived at nearly three times the rate of third-class passengers.

## Step 4: Survival by sex

```python
print(df.groupby("Sex")["Survived"].agg(["mean", "count"]))
```

Output:

```
            mean  count
Sex                    
female  0.742038    314
male    0.188908    577
```

74% of women survived versus 19% of men — the "women and children first" policy is clearly reflected.

## Step 5: Combined analysis — class and sex

```python
print(df.groupby(["Pclass", "Sex"])["Survived"].mean().unstack())
```

Output:

```
Sex      female      male
Pclass                   
1       0.968085  0.368852
2       0.921053  0.157407
3       0.500000  0.135447
```

First-class women had a 97% survival rate. Third-class men had just 14%.

## Step 6: Survival by age group

```python
print(df.groupby("AgeGroup", observed=True)["Survived"].agg(["mean", "count"]))
```

Output:

```
                mean  count
AgeGroup                   
Child       0.580645     62
Teen        0.347826     46
Adult       0.339869    306
Middle-aged 0.385965    228
Senior      0.227273     22
```

Children had the highest survival rate at 58%.

## Step 7: Survival by family size

```python
print(df.groupby("FamilySize")["Survived"].agg(["mean", "count"]))
```

Output:

```
                mean  count
FamilySize                  
1           0.303538    537
2           0.552795    161
3           0.578431     89
4           0.724138     58
5           0.200000     20
6           0.166667     12
7           0.333333      6
8           0.000000      5
```

Families of 2-4 had the best survival rates. Solo travelers and very large families fared worse.

## Step 8: Fare distribution by survival

```python
print(df.groupby("Survived")["Fare"].describe().round(2))
```

Output:

```
         count   mean    std  min   25%   50%    75%      max
Survived                                                     
0        549.0  22.12  31.42  0.0  7.85  10.5  26.00   263.00
1        342.0  48.40  66.33  0.0  12.48  26.0  57.01  512.33
```

Survivors paid significantly higher fares on average.

## Step 9: Embarkation port

```python
print(df.groupby("Embarked")["Survived"].agg(["mean", "count"]))
```

Output:

```
            mean  count
Embarked               
C       0.553571    168
Q       0.389610     77
S       0.368821    646
```

Passengers from Cherbourg had the highest survival rate — likely because more first-class passengers boarded there.

## Step 10: Summary of findings

```python
# Create a final summary table
summary = df.groupby(["Pclass", "Sex"]).agg(
    passengers=("Survived", "count"),
    survival_rate=("Survived", "mean"),
    avg_fare=("Fare", "mean"),
    avg_age=("Age", "mean")
).round(3)

print(summary)
```

## Key conclusions

1. **Class was the strongest predictor of survival** — first-class passengers survived at 63% versus 24% for third class
2. **Gender was equally powerful** — 74% of women survived versus 19% of men
3. **The combination matters most** — first-class women: 97% survival; third-class men: 14%
4. **Children had an advantage** — 58% survival rate, the highest of any age group
5. **Moderate family sizes helped** — families of 2-4 survived more often than solo travelers
6. **Fare paid correlated with survival** — higher-paying passengers survived more often, likely reflecting class and cabin location

## Try It

Replicate this analysis with a different question: Did having a travel companion (family member) improve survival chances? Compare solo travelers (FamilySize == 1) against small families (2-4 members) and large families (5+ members).

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")

df["FamilySize"] = df["SibSp"] + df["Parch"] + 1
df["Group"] = pd.cut(df["FamilySize"], bins=[0, 1, 4, 20], labels=["Solo", "Small", "Large"])

print(df.groupby("Group")["Survived"].agg(["mean", "count"]))
```

## Key Takeaways

- A complete EDA follows a pipeline: load → clean → engineer features → group → analyze → conclude
- Cleaning should happen before analysis — missing values skew groupby results
- Feature engineering (age groups, alone flags) reveals patterns hidden in raw numbers
- Multiple groupby angles (class, sex, age, family) build a complete picture

## Practice Challenge

Conduct your own mini-EDA on the Titanic dataset. Choose one question not covered above (for example: "Did passengers with titles like 'Dr' or 'Rev' have different survival rates?") and answer it using the pandas skills from this course. Write your findings in 3-5 sentences.
