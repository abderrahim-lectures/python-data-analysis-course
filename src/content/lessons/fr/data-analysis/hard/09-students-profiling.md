---

title: "Profil du jeu de données Students Performance"
description: "Appliquer l'ensemble du cadre EDA au jeu de données Students Performance : profiler, explorer l'univarié, tester le bivarié, les corrélations et produire un constat central."
module: "students-performance-eda"
order: 9
difficulty: "advanced"
estimatedMinutes: 30
learningObjectives:
  - "Appliquer le cadre EDA complet à un jeu de données réel"
  - "Documenter le profilage, l'analyse univariée et bivariée de manière cohérente"
  - "Produire une heatmap de corrélation et identifier les relations les plus informatives"
  - "Extraire et rédiger un constat central exploitable issu de l'analyse"
prerequisites: ["08-storytelling-principles"]
tags: ["eda", "projet", "students", "profile", "constats"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 150
section: "data-analysis"
track: "hard"
quiz:
  - question: "De combien d'observations est composé le jeu de données Students Performance ?"
    options:
      - text: "Environ 500"
      - text: "Environ 1 000"
        correct: true
      - text: "Environ 2 000"
      - text: "Environ 10 000"
  - question: "Quelle paire de variables présente la corrélation la plus élevée ?"
    options:
      - text: "reading score et writing score"
        correct: true
      - text: "math score et parental level of education"
      - text: "reading score et lunch"
      - text: "writing score et test preparation course"
  - question: "Quel est le plus grand écart entre les groupes observés dans le jeu de données ?"
    options:
      - text: "L'écart entre les genres en lecture"
      - text: "L'écart entre les groupes ethniques en maths"
      - text: "L'écart entre les types de repas dans toutes les notes"
        correct: true
      - text: "L'écart entre les catégories de parental level of education"
---

C'est le début de votre projet de synthèse. Vous allez charger le jeu de données Students Performance in Exams, le profiler avec le flux de travail systématique du Module 1, et formuler les questions d'analyse exploratoire (EDA) qui guideront votre rapport final. Le travail que vous faites ici détermine la qualité de tout ce qui suit.

## Concepts clés

### Charger le jeu de données

Le jeu de données Students Performance contient 1 000 étudiants avec 8 caractéristiques : genre, origine ethnique, éducation parentale, type de repas, cours de préparation aux tests, et les notes en maths, en lecture et en rédaction.

```python
import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt

# Load directly from URL
url = "https://raw.githubusercontent.com/rashida048/Datasets/master/StudentsPerformance.csv"
df = pd.read_csv(url)

print(f"Dataset loaded: {df.shape[0]} rows, {df.shape[1]} columns")
print(f"\nColumns: {list(df.columns)}")
print(f"\nFirst 5 rows:")
df.head()
```

### Flux de profilage complet

Exécutez le rapport de profilage complet à l'aide de la fonction du Module 1 :

```python
def profile_dataset(df, name="Dataset"):
    """Generate a complete profiling report."""
    print(f"{'='*60}")
    print(f"  PROFILING REPORT: {name}")
    print(f"{'='*60}")

    print(f"\nSTRUCTURE")
    print(f"  Rows: {df.shape[0]:,}")
    print(f"  Columns: {df.shape[1]}")
    print(f"  Memory: {df.memory_usage(deep=True).sum() / 1e6:.2f} MB")

    print(f"\nCOLUMN TYPES")
    print(df.dtypes.value_counts().to_string())

    missing = df.isnull().sum()
    if missing.any():
        print(f"\nMISSING VALUES")
        for col in missing[missing > 0].index:
            pct = missing[col] / len(df) * 100
            print(f"  {col}: {missing[col]:,} ({pct:.1f}%)")
    else:
        print(f"\nMISSING VALUES: None detected")

    n_dupes = df.duplicated().sum()
    print(f"\nDUPLICATES: {n_dupes} rows ({n_dupes/len(df)*100:.1f}%)")

    num_df = df.select_dtypes(include="number")
    if not num_df.empty:
        print(f"\nNUMERICAL SUMMARY")
        print(num_df.describe().round(2).to_string())

    cat_df = df.select_dtypes(include="object")
    if not cat_df.empty:
        print(f"\nCATEGORICAL SUMMARY")
        for col in cat_df.columns:
            n_unique = df[col].nunique()
            print(f"  {col}: {n_unique} unique — {df[col].value_counts().to_dict()}")

    print(f"\n{'='*60}")

profile_dataset(df, "Students Performance in Exams")
```

### Analyse catégorielle détaillée

```python
cat_cols = ["gender", "race/ethnicity", "parental level of education",
            "lunch", "test preparation course"]

for col in cat_cols:
    print(f"\n{'─'*40}")
    print(f"  {col.upper()}")
    print(f"{'─'*40}")
    vc = df[col].value_counts()
    pct = df[col].value_counts(normalize=True).round(3)
    summary = pd.DataFrame({"count": vc, "proportion": pct})
    print(summary)
```

### Analyse numérique détaillée

```python
num_cols = ["math score", "reading score", "writing score"]

for col in num_cols:
    print(f"\n{'─'*40}")
    print(f"  {col.upper()}")
    print(f"{'─'*40}")
    s = df[col]
    print(f"  Mean:   {s.mean():.2f}")
    print(f"  Median: {s.median():.2f}")
    print(f"  Std:    {s.std():.2f}")
    print(f"  Min:    {s.min()}")
    print(f"  Max:    {s.max()}")
    print(f"  Skew:   {s.skew():.3f}")
    print(f"  Kurt:   {s.kurtosis():.3f}")
    print(f"  IQR:    {s.quantile(0.75) - s.quantile(0.25):.2f}")
    print(f"  Outliers (IQR): {((s < s.quantile(0.25) - 1.5 * (s.quantile(0.75) - s.quantile(0.25))) | (s > s.quantile(0.75) + 1.5 * (s.quantile(0.75) - s.quantile(0.25)))).sum()}")
```

### Résumé visuel du profilage

```python
fig, axes = plt.subplots(2, 3, figsize=(15, 10))

# Numerical distributions
for i, col in enumerate(num_cols):
    sns.histplot(df[col], kde=True, ax=axes[0, i], bins=20, color="steelblue")
    mean_val = df[col].mean()
    axes[0, i].axvline(mean_val, color="red", linestyle="--", label=f"Mean: {mean_val:.1f}")
    axes[0, i].set_title(col.replace(" score", " Scores").title())
    axes[0, i].legend(fontsize=9)

# Categorical counts
cat_to_plot = ["gender", "race/ethnicity", "lunch"]
for i, col in enumerate(cat_to_plot):
    sns.countplot(data=df, x=col, ax=axes[1, i], palette="Set2")
    axes[1, i].set_title(col.title())
    axes[1, i].tick_params(axis="x", rotation=45)

plt.suptitle("Students Performance — Visual Profile", fontsize=14, fontweight="bold")
plt.tight_layout()
plt.show()
```

### Formuler les questions d'analyse exploratoire

À partir du profilage, formulez vos questions d'analyse :

```python
eda_questions = {
    "primary": "What factors most strongly predict student performance on exams?",

    "secondary": [
        "How do math, reading, and writing scores distribute across the population?",
        "Do gender and ethnicity interact to produce score differences?",
        "What is the magnitude of the test preparation effect?",
        "Does lunch type (proxy for socioeconomic status) predict scores?",
        "How does parental education level relate to student performance?",
    ],

    "tertiary": [
        "Are the three scores correlated? Is the correlation the same across genders?",
        "Do outliers represent data entry errors or genuine high/low performers?",
        "Is there an interaction between test preparation and lunch type?",
        "Which subgroup shows the largest performance gap?",
    ],

    "analysis_plan": [
        "Step 1: Univariate analysis of all 8 variables",
        "Step 2: Bivariate analysis — scores vs each categorical variable",
        "Step 3: Correlation analysis of the three score variables",
        "Step 4: Multivariate analysis — interactions between factors",
        "Step 5: Advanced visualizations and storytelling",
        "Step 6: Final report with findings and recommendations",
    ]
}

print("PRIMARY QUESTION:")
print(f"  {eda_questions['primary']}\n")

print("SECONDARY QUESTIONS:")
for i, q in enumerate(eda_questions["secondary"], 1):
    print(f"  {i}. {q}")

print("\nTERTIARY QUESTIONS:")
for i, q in enumerate(eda_questions["tertiary"], 1):
    print(f"  {i}. {q}")

print("\nANALYSIS PLAN:")
for step in eda_questions["analysis_plan"]:
    print(f"  {step}")
```

## Essayez-le

Exécutez le flux de profilage complet sur le jeu de données Students Performance. Répondez à ces questions à partir de la sortie de votre profilage :

```python
# Complete the profiling and answer:
questions = {
    "q1": "How many students are in the dataset?",
    "q2": "What are the column names?",
    "q3": "Are there any missing values?",
    "q4": "How many unique values does each categorical column have?",
    "q5": "What is the mean math score?",
    "q6": "What is the standard deviation of reading scores?",
    "q7": "Which categorical column has the most balanced distribution?",
    "q8": "Are there any numerical outliers in the score columns?",
}

# Your answers:
answers = {
    "q1": "1000 students",
    "q2": "gender, race/ethnicity, parental level of education, lunch, test preparation course, math score, reading score, writing score",
    "q3": "No missing values",
    "q4": "gender: 2, race/ethnicity: 5, parental level of education: 6, lunch: 2, test preparation course: 2",
    "q5": "66.1",
    "q6": "14.6",
    "q7": "gender (50/50 split) or lunch (roughly 65/35 split)",
    "q8": "Yes — some students scored below 30 on math (potential outliers)",
}

for q, a in answers.items():
    print(f"{questions[q]}\n  → {a}\n")
```

## Points clés à retenir

- Chargez toujours les données depuis une source reproductible (URL) pour que d'autres puissent répliquer votre analyse
- Le flux de profilage du Module 1 est votre point de départ standard pour tout jeu de données
- Formulez vos questions avant l'analyse : elles vous maintiennent concentré et évitent l'élargissement du périmètre
- Le jeu de données Students Performance est propre (aucune valeur manquante) mais possède des variables catégorielles intéressantes à explorer
- Votre plan d'analyse doit s'enchaîner logiquement : univarié → bivarié → multivarié → narration

## Défi pratique

Écrivez un script Python qui charge le jeu de données, le profile et génère un dictionnaire récapitulatif avec : `row_count`, `column_count`, `missing_columns`, `score_means`, `score_stds`, `categorical_cardinalities` et `eda_questions`. Affichez le dictionnaire mis en forme.

<details class="challenge">
<summary>🧩 Défi — réfléchissez d'abord, puis révélez</summary>
<div class="challenge__body">

```python
import pandas as pd

url = "https://raw.githubusercontent.com/rashida048/Datasets/master/StudentsPerformance.csv"
df = pd.read_csv(url)

score_cols = ["math score", "reading score", "writing score"]
cat_cols = ["gender", "race/ethnicity", "parental level of education",
            "lunch", "test preparation course"]

summary = {
    "row_count": len(df),
    "column_count": len(df.columns),
    "missing_columns": {col: int(df[col].isnull().sum()) for col in df.columns if df[col].isnull().sum() > 0},
    "score_means": {col: round(df[col].mean(), 2) for col in score_cols},
    "score_stds": {col: round(df[col].std(), 2) for col in score_cols},
    "categorical_cardinalities": {col: df[col].nunique() for col in cat_cols},
    "eda_questions": {
        "primary": "What factors most strongly predict student performance?",
        "secondary": [
            "How do scores distribute across subjects?",
            "Do demographic factors correlate with performance gaps?",
            "What is the effect of test preparation course completion?",
        ],
    },
}

for key, value in summary.items():
    print(f"\n{key.upper().replace('_', ' ')}:")
    if isinstance(value, dict):
        for k, v in value.items():
            print(f"  {k}: {v}")
    elif isinstance(value, list):
        for item in value:
            print(f"  - {item}")
    else:
        print(f"  {value}")
```

</div>
</details>