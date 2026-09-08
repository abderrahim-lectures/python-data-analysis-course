---

title: "Perfilado del Desempeño de los Estudiantes"
description: "Carga el conjunto de datos Students Performance, perfílalo a fondo y formula las preguntas de EDA para el informe final."
module: "students-performance-eda"
order: 9
difficulty: "advanced"
estimatedMinutes: 30
learningObjectives:
  - "Cargar el conjunto de datos Students Performance desde la URL y verificar la integridad de los datos"
  - "Perfilar el conjunto de datos usando el flujo de trabajo completo del Módulo 1"
  - "Formular las preguntas de EDA primarias, secundarias y terciarias para el informe final"
  - "Identificar los problemas de calidad de datos y planificar la estrategia de análisis"
prerequisites: ["08-storytelling-principles"]
tags: ["capstone", "students-performance", "profiling", "eda", "final-project"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 150
section: "data-analysis"
track: "hard"
quiz:
  - question: "¿Qué deberías hacer antes de comenzar cualquier análisis sobre un conjunto de datos nuevo?"
    options:
      - text: "Comenzar a graficar de inmediato"
      - text: "Perfilar el conjunto de datos y formular preguntas"
        correct: true
      - text: "Construir un modelo de aprendizaje automático"
      - text: "Eliminar cualquier columna que no entiendas"
  - question: "¿Cuántas filas tiene el conjunto de datos Students Performance?"
    options:
      - text: "500"
      - text: "800"
      - text: "1000"
        correct: true
      - text: "1500"
  - question: "¿Qué es lo primero que deberías comprobar después de cargar un conjunto de datos?"
    options:
      - text: "La media de cada columna"
      - text: "Shape, dtypes, head e info"
        correct: true
      - text: "La matriz de correlación"
      - text: "El número de filas duplicadas"
---
Este es el comienzo de tu proyecto final. Cargarás el conjunto de datos Students Performance in Exams, lo perfilarás usando el flujo de trabajo sistemático del Módulo 1 y formularás las preguntas de EDA que guiarán tu informe final. El trabajo que hagas aquí determina la calidad de todo lo que sigue.

## Conceptos clave

### Cargar el conjunto de datos

El conjunto de datos Students Performance contiene 1000 estudiantes con 8 características: género, raza/etnia, educación de los padres, tipo de almuerzo, curso de preparación para el examen y puntajes en matemáticas, lectura y escritura.

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

### Flujo de trabajo de perfilado completo

Ejecuta el informe de perfilado completo usando la función del Módulo 1:

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

### Análisis categórico detallado

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

### Análisis numérico detallado

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

### Resumen de perfilado visual

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

### Formular las preguntas de EDA

Con base en el perfilado, formula tus preguntas analíticas:

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

## Inténtalo

Ejecuta el flujo de trabajo de perfilado completo sobre el conjunto de datos Students Performance. Responde estas preguntas a partir de la salida de tu perfilado:

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

## Conclusiones clave

- Carga siempre los datos desde una fuente reproducible (URL) para que otros puedan replicar tu análisis
- El flujo de trabajo de perfilado del Módulo 1 es tu punto de partida estándar para cualquier conjunto de datos
- Formula preguntas antes del análisis — te mantienen enfocado y evitan que el alcance se expanda
- El conjunto de datos Students Performance está limpio (sin valores faltantes) pero tiene variables categóricas interesantes para explorar
- Tu plan de análisis debe fluir de forma lógica: univariado → bivariado → multivariado → narración

## Desafío de práctica

Escribe un script de Python que cargue el conjunto de datos, lo perfiles y genere un diccionario de resumen con: `row_count`, `column_count`, `missing_columns`, `score_means`, `score_stds`, `categorical_cardinalities` y `eda_questions`. Imprime el diccionario formateado.

<details class="challenge">
<summary>🧩 Desafío — piensa primero, luego revela</summary>
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