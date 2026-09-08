---

title: "Perfilado de Conjuntos de Datos"
description: "Evalúa sistemáticamente la estructura, los tipos, la falta de valores, la cardinalidad y los problemas de calidad de los datos antes de cualquier análisis."
module: "eda-framework"
order: 2
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Perfilar la estructura, las dimensiones y los tipos de columna de un conjunto de datos en menos de 2 minutos"
  - "Detectar valores faltantes, duplicados, columnas constantes y características de alta cardinalidad"
  - "Usar pandas-profiling o el perfilado manual para generar un informe completo de calidad de datos"
  - "Documentar los hallazgos del perfilado como base para el análisis posterior"
prerequisites: ["01-framing-questions"]
tags: ["eda", "profiling", "data-quality", "pandas"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "hard"
quiz:
  - question: "Descubres que el 40% de los valores de una columna faltan. ¿Qué deberías hacer primero?"
    options:
      - text: "Eliminar todas las filas con valores faltantes"
      - text: "Rellenarlas con la media"
      - text: "Investigar si la falta es aleatoria o sistemática"
        correct: true
      - text: "Eliminar la columna por completo"
  - question: "Una columna tiene 10 000 filas y solo 1 valor único. ¿Qué significa esto?"
    options:
      - text: "Es una columna de alta cardinalidad"
      - text: "Es una columna constante sin valor analítico"
        correct: true
      - text: "Necesita ser imputada"
      - text: "Es la columna más importante"
  - question: "¿Cuál es el primer paso en el perfilado de un conjunto de datos?"
    options:
      - text: "Comenzar a construir modelos"
      - text: "Revisar shape, dtypes y head del DataFrame"
        correct: true
      - text: "Eliminar todos los valores faltantes"
      - text: "Normalizar todas las columnas numéricas"
---
El perfilado es la evaluación sistemática de un conjunto de datos antes de que comience cualquier análisis. Responde las preguntas básicas: ¿Cuántas filas? ¿Qué columnas? ¿Cuáles tienen datos faltantes? ¿Cuáles son redundantes? Esta lección enseña un flujo de trabajo de perfilado repetible que detecta problemas de calidad de datos antes de que corrompan tus resultados.

## Conceptos clave

### El perfilado de 60 segundos

Cuando cargas un conjunto de datos por primera vez, ejecuta esta secuencia para orientarte:

```python
import pandas as pd

df = pd.read_csv("StudentsPerformance.csv")

# 1. Shape — how much data do we have?
print(f"Rows: {df.shape[0]}, Columns: {df.shape[1]}")

# 2. Column names and types
print(df.dtypes)

# 3. First and last rows
df.head(3)
df.tail(3)

# 4. Basic statistics for numerical columns
df.describe()

# 5. Categorical value counts
for col in df.select_dtypes(include="object").columns:
    print(f"\n{col}:")
    print(df[col].value_counts())
```

Esto te da la estructura, los tipos de datos, las distribuciones numéricas y las frecuencias categóricas — todo lo que necesitas para decidir qué hacer a continuación.

### Evaluación de datos faltantes

Los datos faltantes son el problema de calidad de datos más común. Detéctalo sistemáticamente:

```python
# Count and percentage of missing values per column
missing = df.isnull().sum()
missing_pct = (missing / len(df) * 100).round(2)
missing_report = pd.DataFrame({
    "missing_count": missing,
    "missing_pct": missing_pct
})
print(missing_report[missing_report["missing_count"] > 0])
```

Interpreta los patrones de falta:
- **MCAR (Falta completamente al azar)**: la falta no tiene relación con ninguna variable — seguro eliminar filas
- **MAR (Falta al azar)**: la falta se relaciona con variables observadas — puede ser imputada
- **MNAR (Falta no al azar)**: la falta se relaciona con el valor faltante en sí — requiere conocimiento del dominio

```python
# Visualize missing data with a heatmap
import seaborn as sns
import matplotlib.pyplot as plt

plt.figure(figsize=(10, 6))
sns.heatmap(df.isnull(), cbar=True, yticklabels=False, cmap="viridis")
plt.title("Missing Data Pattern")
plt.tight_layout()
plt.show()
```

### Detección de duplicados

Los duplicados inflan los conteos en silencio y sesgan las estadísticas:

```python
# Exact duplicates
n_dupes = df.duplicated().sum()
print(f"Exact duplicate rows: {n_dupes}")

# Near-duplicates on key columns
key_cols = ["gender", "race/ethnicity", "parental level of education"]
n_near = df.duplicated(subset=key_cols).sum()
print(f"Near-duplicates on demographic columns: {n_near}")
```

### Columnas constantes y de baja varianza

Las columnas con un solo valor único no aportan información:

```python
# Find constant columns
constant_cols = [col for col in df.columns if df[col].nunique() == 1]
print(f"Constant columns: {constant_cols}")

# Find near-constant columns (>95% same value)
for col in df.columns:
    top_pct = df[col].value_counts(normalize=True).iloc[0]
    if top_pct > 0.95:
        print(f"  Near-constant: {col} — {top_pct:.1%} same value")
```

### Evaluación de la cardinalidad

La alta cardinalidad (muchos valores únicos) en columnas categóricas puede causar sobreajuste en los modelos y visualizaciones desordenadas:

```python
# Cardinality for each categorical column
cat_cols = df.select_dtypes(include="object").columns
for col in cat_cols:
    n_unique = df[col].nunique()
    print(f"{col}: {n_unique} unique values")
    if n_unique > 10:
        print(f"  WARNING: High cardinality — consider grouping")
```

### El informe de perfilado completo

Combina todo en una función reutilizable:

```python
def profile_dataset(df, name="Dataset"):
    """Generate a complete profiling report for a DataFrame."""
    print(f"{'='*60}")
    print(f"  PROFILING REPORT: {name}")
    print(f"{'='*60}")

    # Structure
    print(f"\nSTRUCTURE")
    print(f"  Rows: {df.shape[0]:,}")
    print(f"  Columns: {df.shape[1]}")
    print(f"  Memory usage: {df.memory_usage(deep=True).sum() / 1e6:.2f} MB")

    # Types
    print(f"\nCOLUMN TYPES")
    print(df.dtypes.value_counts().to_string())

    # Missing
    missing = df.isnull().sum()
    if missing.any():
        print(f"\nMISSING VALUES")
        for col in missing[missing > 0].index:
            pct = missing[col] / len(df) * 100
            print(f"  {col}: {missing[col]:,} ({pct:.1f}%)")
    else:
        print(f"\nMISSING VALUES: None detected")

    # Duplicates
    n_dupes = df.duplicated().sum()
    print(f"\nDUPLICATES: {n_dupes} rows ({n_dupes/len(df)*100:.1f}%)")

    # Numerical summary
    num_df = df.select_dtypes(include="number")
    if not num_df.empty:
        print(f"\nNUMERICAL SUMMARY")
        print(num_df.describe().round(2).to_string())

    # Categorical summary
    cat_df = df.select_dtypes(include="object")
    if not cat_df.empty:
        print(f"\nCATEGORICAL SUMMARY")
        for col in cat_df.columns:
            n_unique = df[col].nunique()
            print(f"  {col}: {n_unique} unique values")

    print(f"\n{'='*60}")

# Usage:
# profile_dataset(df, "Students Performance")
```

## Inténtalo

Perfila el conjunto de datos Students Performance usando el flujo de trabajo anterior. Responde estas preguntas solo a partir de la salida del perfilado — no grafiques nada todavía.

```python
import pandas as pd

# Load the dataset (adjust path as needed)
url = "https://raw.githubusercontent.com/rashida048/Datasets/master/StudentsPerformance.csv"
df = pd.read_csv(url)

# Quick profile
print("Shape:", df.shape)
print("\nDtypes:\n", df.dtypes)
print("\nMissing:\n", df.isnull().sum())
print("\nNumerical stats:\n", df.describe())
print("\nCategorical values:")
for col in df.select_dtypes(include="object").columns:
    print(f"\n{col}:")
    print(df[col].value_counts())
```

Preguntas para responder:
1. ¿Cuántas filas y columnas hay?
2. ¿Qué columnas tienen valores faltantes?
3. ¿Cuántos valores únicos tiene cada columna categórica?
4. ¿Cuáles son los puntajes mínimo y máximo de matemáticas?
5. ¿Hay columnas constantes o casi constantes?

## Conclusiones clave

- Perfila antes de graficar — una pasada de perfilado de 60 segundos detecta problemas que desperdiciarían horas después
- Los datos faltantes tienen tres mecanismos (MCAR, MAR, MNAR); identifica cuál aplica antes de elegir una estrategia
- Los duplicados y las columnas constantes degradan la calidad del análisis en silencio
- La cardinalidad importa — las categóricas de alta cardinalidad necesitan agrupación antes de la visualización
- Construye una función de perfilado reutilizable para que cada nuevo conjunto de datos reciba el mismo tratamiento sistemático

## Desafío de práctica

Escribe una función `quick_profile(df)` que devuelva un diccionario con las claves: `shape`, `dtypes`, `missing_cols`, `duplicate_count`, `constant_cols` y `cardinality`. Pruébala en el conjunto de datos Students Performance.

<details class="challenge">
<summary>🧩 Desafío — piensa primero, luego revela</summary>
<div class="challenge__body">

```python
import pandas as pd

def quick_profile(df):
    """Return a profiling summary dictionary."""
    missing = df.isnull().sum()
    return {
        "shape": df.shape,
        "dtypes": df.dtypes.value_counts().to_dict(),
        "missing_cols": {
            col: {"count": int(missing[col]), "pct": round(missing[col] / len(df) * 100, 2)}
            for col in missing[missing > 0].index
        },
        "duplicate_count": int(df.duplicated().sum()),
        "constant_cols": [col for col in df.columns if df[col].nunique() == 1],
        "cardinality": {
            col: df[col].nunique()
            for col in df.select_dtypes(include="object").columns
        },
    }

url = "https://raw.githubusercontent.com/rashida048/Datasets/master/StudentsPerformance.csv"
df = pd.read_csv(url)
report = quick_profile(df)

for key, value in report.items():
    print(f"\n{key}:")
    if isinstance(value, dict):
        for k, v in value.items():
            print(f"  {k}: {v}")
    elif isinstance(value, list):
        print(f"  {value if value else 'None'}")
    else:
        print(f"  {value}")
```

</div>
</details>