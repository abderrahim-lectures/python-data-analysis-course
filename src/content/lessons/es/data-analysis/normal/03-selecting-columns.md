---

title: "Seleccionando Columnas"
description: "Extrae una o varias columnas de un DataFrame usando la notación de corchetes, el acceso con punto y loc."
module: "selection-filtering"
order: 3
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "Seleccionar una sola columna por nombre usando la notación de corchetes y con punto"
  - "Seleccionar varias columnas pasando una lista de nombres"
  - "Usar loc para seleccionar columnas por etiqueta"
  - "Comprender cuándo preferir un método sobre otro"
prerequisites: ["series-dataframe"]
tags: ["pandas", "selection", "columns", "loc"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "¿Cómo seleccionas una sola columna de un DataFrame?"
    options:
      - text: "df[0]"
      - text: "df.column_name"
        correct: true
      - text: "df.get(0)"
      - text: "df.select(0)"
  - question: "¿Qué tipo es df['column']?"
    options:
      - text: "DataFrame"
      - text: "Series"
        correct: true
      - text: "List"
      - text: "Dictionary"
  - question: "¿Cómo seleccionas varias columnas?"
    options:
      - text: "df[0, 1]"
      - text: "df[['col1', 'col2']]"
        correct: true
      - text: "df.select('col1', 'col2')"
      - text: "df.get(['col1', 'col2'])"
---

## Por qué importa la selección de columnas

Los conjuntos de datos suelen tener decenas de columnas. La mayor parte de los análisis se centra en un subconjunto. Seleccionar las columnas correctas reduce el uso de memoria, acelera los cálculos y hace tu código más claro.

Usaremos el conjunto de datos del Titanic a lo largo de esta lección:

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")
```

## Seleccionando una sola columna

**Notación de corchetes** — el enfoque más común:

```python
ages = df["Age"]
print(type(ages))   # <class 'pandas.core.series.Series'>
```

**Notación con punto** — más corta, pero solo funciona cuando el nombre de la columna no tiene espacios ni caracteres especiales:

```python
print(df.Age.head())   # first 5 ages
```

Ambas devuelven una **Series** (unidimensional). El nombre de la columna se convierte en el nombre de la Series y se conserva el índice del DataFrame.

## Seleccionando varias columnas

Pasa una **lista de nombres de columnas** dentro de los corchetes. Esto devuelve un **DataFrame**, no una Series:

```python
subset = df[["Name", "Age", "Fare"]]
print(type(subset))   # <class 'pandas.core.frame.DataFrame'>
print(subset.head())
```

Salida:

```
                                                Name   Age     Fare
0                            Braund, Mr. Owen Harris  22.0   7.2500
1  Cumings, Mrs. John Bradley (Florence Briggs Th...  38.0  71.2833
2                             Heikkinen, Miss. Laina  26.0   7.9250
3       Futrelle, Mrs. Jacques Heath (Lily May Peel)  35.0  53.1000
0                           Allen, Mr. William Henry  35.0   8.0500
```

El orden de las columnas en la lista determina el orden en la salida.

## Usando loc para la selección de columnas

`loc` selecciona por etiqueta y puede manejar tanto filas como columnas:

```python
# select all rows, specific columns
subset = df.loc[:, ["Name", "Survived"]]
```

El `:` significa "todas las filas". La lista de nombres de columnas selecciona columnas específicas. Esto es equivalente a `df[["Name", "Survived"]]` pero se vuelve esencial cuando se combina la selección de filas y columnas en un solo paso.

## Patrones prácticos

**Renombrar después de seleccionar** — conserva solo lo que necesitas con nombres más claros:

```python
demographics = df[["Name", "Age", "Sex"]].copy()
demographics.columns = ["passenger", "age", "gender"]
```

**Seleccionar columnas por tipo de datos** — útil cuando tienes muchas columnas:

```python
numeric_cols = df.select_dtypes(include=["number"])
print(numeric_cols.columns.tolist())
# ['PassengerId', 'Survived', 'Pclass', 'Age', 'SibSp', 'Parch', 'Fare']

categorical_cols = df.select_dtypes(include=["object"])
print(categorical_cols.columns.tolist())
# ['Name', 'Ticket', 'Cabin', 'Embarked']
```

**Seleccionar columnas que contienen una subcadena:**

```python
# useful for wide datasets with naming conventions
age_cols = [col for col in df.columns if "age" in col.lower()]
```

## Cuándo usar qué

| Método | Devuelve | Mejor para |
|---|---|---|
| `df["col"]` | Series | Acceso a una sola columna |
| `df[["col1", "col2"]]` | DataFrame | Varias columnas |
| `df.loc[:, cols]` | DataFrame | Combinar la selección de filas y columnas |
| `df.col` | Series | Acceso rápido, sin caracteres especiales |
| `df.select_dtypes()` | DataFrame | Seleccionar por tipo |

## Inténtalo

Del conjunto de datos del Titanic, selecciona solo las columnas `Name`, `Pclass` y `Fare`. Imprime las primeras 5 filas. Luego selecciona solo las columnas numéricas e imprime sus nombres.

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")

subset = df[["Name", "Pclass", "Fare"]]
print(subset.head())

numeric = df.select_dtypes(include=["number"])
print(numeric.columns.tolist())
```

## Conclusiones clave

- La notación de corchetes `df["col"]` es la forma estándar de seleccionar una sola columna
- `df[["col1", "col2"]]` devuelve un DataFrame con varias columnas
- `loc` se vuelve esencial al combinar la selección de filas y columnas
- `select_dtypes()` es potente para seleccionar columnas por tipo de datos

## Desafío de práctica

Del conjunto de datos del Titanic, crea un nuevo DataFrame llamado `passenger_info` que contenga solo `Name`, `Age`, `Sex` y `Survived`. ¿Cuántas filas tienen valores de Age faltantes en este subconjunto? (Pista: usa `.isna().sum()`)
