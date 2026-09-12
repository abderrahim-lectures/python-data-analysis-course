---

title: "Univariate Categorical Analysis"
description: "Analyze frequency distributions, proportions, and patterns in categorical variables with count plots and bar charts."
module: "univariate-analysis"
order: 4
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Compute frequency tables, proportions, and cumulative frequencies for categorical variables"
  - "Create count plots, bar charts, and horizontal bar charts with matplotlib and seaborn"
  - "Distinguish between nominal, ordinal, and binary categorical variables"
  - "Handle high-cardinality categoricals with grouping and top-N filtering"
prerequisites: ["03-univariate-numerical"]
tags: ["univariate", "categorical", "count-plots", "bar-charts", "frequency"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "hard"
quiz:
  - question: "A categorical column has 50 unique values. What should you do before plotting?"
    options:
      - text: "Plot all 50 categories in a bar chart"
      - text: "Group rare categories into Other and show the top N"
        correct: true
      - text: "Convert the column to numerical"
      - text: "Drop the column entirely"
  - question: "Why should you explicitly sort ordinal categories instead of letting pandas sort alphabetically?"
    options:
      - text: "Alphabetical order is always wrong"
      - text: "It preserves the logical rank order that reveals meaningful patterns"
        correct: true
      - text: "It makes the plot colors look better"
      - text: "It prevents missing values"
  - question: "What is the difference between nominal and ordinal categorical data?"
    options:
      - text: "Nominal has numbers, ordinal has text"
      - text: "Ordinal has a natural ranking order, nominal does not"
        correct: true
      - text: "Nominal is always binary"
      - text: "Ordinal can only have 3 categories"
---
Categorical variables describe groups, categories, or labels, gender, ethnicity, lunch type, education level. Unlike numerical data, you cannot compute means and standard deviations. Instead, you analyze frequencies, proportions, and mode. This lesson covers the tools and techniques for understanding categorical data.

## Key Concepts

### Frequency tables

The foundation of categorical analysis is the frequency table:

```python
import pandas as pd

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

# Absolute frequencies
print("Gender counts:")
print(df["gender"].value_counts())

# Relative frequencies (proportions)
print("\nGender proportions:")
print(df["gender"].value_counts(normalize=True).round(3))

# Parental education — ordinal, so sort logically
edu_order = [
    "some high school",
    "high school",
    "some college",
    "associate's degree",
    "master's degree",
    "bachelor's degree",
]
print("\nParental education:")
print(df["parental level of education"].value_counts().reindex(edu_order))
```

### Nominal vs ordinal vs binary

Understanding the type of categorical variable determines how you analyze and visualize it:

| Type | Description | Example | Analysis |
|------|-------------|---------|----------|
| **Binary** | Two categories | gender | Proportion, odds ratio |
| **Nominal** | No natural order | race/ethnicity | Frequency, mode |
| **Ordinal** | Natural order exists | education level | Median category, rank correlation |

Ordinal variables need explicit ordering, do not let pandas sort them alphabetically:

```python
import seaborn as sns
import matplotlib.pyplot as plt

# Without ordering — misleading
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

sns.countplot(data=df, x="parental level of education", ax=axes[0])
axes[0].set_title("Without explicit order")
axes[0].tick_params(axis="x", rotation=45)

# With ordering — correct
sns.countplot(
    data=df,
    x="parental level of education",
    order=edu_order,
    ax=axes[1],
    palette="viridis"
)
axes[1].set_title("With explicit order")
axes[1].tick_params(axis="x", rotation=45)

plt.tight_layout()
plt.show()
```

### Count plots with seaborn

Count plots are the categorical equivalent of histograms, they show frequencies:

```python
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

# Binary variable
sns.countplot(data=df, x="gender", ax=axes[0, 0], palette="Set2")
axes[0, 0].set_title("Gender Distribution")

# Nominal variable
sns.countplot(data=df, x="race/ethnicity", ax=axes[0, 1], palette="Set3")
axes[0, 1].set_title("Ethnicity Distribution")

# Ordinal variable
sns.countplot(
    data=df,
    x="parental level of education",
    order=edu_order,
    ax=axes[1, 0],
    palette="viridis"
)
axes[1, 0].set_title("Parental Education Level")
axes[1, 0].tick_params(axis="x", rotation=45)

# Binary with hue
sns.countplot(data=df, x="test preparation course", hue="gender", ax=axes[1, 1], palette="Set1")
axes[1, 1].set_title("Test Prep by Gender")

plt.tight_layout()
plt.show()
```

### Horizontal bar charts

When category labels are long, horizontal bars improve readability:

```python
# Ethnicity with horizontal bars
ethnicity_counts = df["race/ethnicity"].value_counts()

fig, ax = plt.subplots(figsize=(8, 5))
ethnicity_counts.plot(kind="barh", ax=ax, color="steelblue", edgecolor="black")
ax.set_title("Ethnicity Distribution")
ax.set_xlabel("Count")
ax.set_ylabel("Ethnicity Group")
plt.show()
```

### Proportion plots

When sample sizes differ, proportions are more informative than counts:

```python
# Proportion by gender
gender_prop = df["gender"].value_counts(normalize=True)

fig, axes = plt.subplots(1, 2, figsize=(12, 5))

# Bar chart of proportions
gender_prop.plot(kind="bar", ax=axes[0], color=["#4ECDC4", "#FF6B6B"], edgecolor="black")
axes[0].set_title("Gender Proportions")
axes[0].set_ylabel("Proportion")
axes[0].set_ylim(0, 1)

# Pie chart (use sparingly — bar charts are almost always better)
axes[1].pie(gender_prop, labels=gender_prop.index, autopct="%1.1f%%", colors=["#4ECDC4", "#FF6B6B"])
axes[1].set_title("Gender Split")

plt.tight_layout()
plt.show()
```

### Handling high-cardinality categoricals

When a categorical column has many unique values, group rare categories into an "Other" category:

```python
def top_n_with_other(series, n=5):
    """Keep top n categories, merge the rest into 'Other'."""
    top = series.value_counts().head(n).index
    return series.where(series.isin(top), other="Other")

# Example with education level
df["education_grouped"] = top_n_with_other(df["parental level of education"], n=4)

print(df["education_grouped"].value_counts())

fig, ax = plt.subplots(figsize=(8, 5))
sns.countplot(data=df, x="education_grouped", palette="pastel", ax=ax)
ax.set_title("Parental Education (Top 4 + Other)")
plt.show()
```

### Annotating counts on bars

Adding counts to bars makes charts self-documenting:

```python
fig, ax = plt.subplots(figsize=(8, 5))
counts = df["race/ethnicity"].value_counts()
bars = ax.bar(counts.index, counts.values, color=sns.color_palette("Set3", len(counts)), edgecolor="black")

for bar in bars:
    height = bar.get_height()
    ax.text(
        bar.get_x() + bar.get_width() / 2.,
        height + 0.5,
        f"{int(height)}",
        ha="center",
        va="bottom",
        fontweight="bold"
    )

ax.set_title("Ethnicity Distribution with Counts")
ax.set_ylabel("Count")
plt.show()
```

## Try It

Analyze the categorical variables in the Students Performance dataset.

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

cat_cols = ["gender", "race/ethnicity", "parental level of education",
            "lunch", "test preparation course"]

# Frequency tables
for col in cat_cols:
    print(f"\n{col}:")
    print(df[col].value_counts())

# Visualize all categorical variables
fig, axes = plt.subplots(2, 3, figsize=(15, 10))
axes = axes.flatten()

for i, col in enumerate(cat_cols):
    sns.countplot(data=df, x=col, ax=axes[i], palette="Set2")
    axes[i].set_title(col.title())
    axes[i].tick_params(axis="x", rotation=45)

# Hide unused subplot
axes[5].set_visible(False)

plt.tight_layout()
plt.show()
```

## Key Takeaways

- Frequency tables are the foundation of categorical analysis, always compute them first
- Distinguish nominal, ordinal, and binary variables; ordinal variables need explicit ordering
- Horizontal bar charts are better than vertical ones when category labels are long
- Use proportions instead of counts when comparing groups of different sizes
- Group rare categories into "Other" when cardinality is high
- Annotate counts on bars to make charts self-documenting

## Practice Challenge

Create a figure showing the distribution of `lunch` types, with bars colored by `test preparation course` completion. Add count annotations to each bar segment. Then compute the proportion of students who completed test preparation for each lunch type.

<details class="challenge">
<summary>🧩 Challenge, think first, then reveal</summary>
<div class="challenge__body">

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

fig, ax = plt.subplots(figsize=(8, 6))
sns.countplot(data=df, x="lunch", hue="test preparation course", ax=ax, palette="Set1")
ax.set_title("Lunch Type by Test Preparation Completion")
ax.set_xlabel("Lunch Type")
ax.set_ylabel("Count")
ax.legend(title="Test Prep")

# Add count annotations
for container in ax.containers:
    ax.bar_label(container, fontweight="bold")

plt.tight_layout()
plt.show()

# Proportions
print("\nTest prep completion by lunch type:")
print(df.groupby("lunch")["test preparation course"].value_counts(normalize=True).round(3))
```

</div>
</details>
