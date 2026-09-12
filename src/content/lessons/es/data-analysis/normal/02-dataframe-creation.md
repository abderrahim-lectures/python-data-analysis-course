---

title: "Creando DataFrames"
description: "Construye datos tabulares bidimensionales a partir de diccionarios, listas de registros y archivos CSV usando DataFrames de pandas."
module: "series-dataframe"
order: 2
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "Crear un DataFrame a partir de un diccionario de listas"
  - "Crear un DataFrame a partir de una lista de diccionarios"
  - "Leer un archivo CSV en un DataFrame con pd.read_csv()"
  - "Inspeccionar un DataFrame con head(), info(), describe() y shape"
prerequisites: ["series-dataframe"]
tags: ["pandas", "dataframe", "csv", "inspection"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "¿Qué es un DataFrame de pandas?"
    options:
      - text: "Un arreglo 1D"
      - text: "Una estructura de datos 2D con columnas etiquetadas"
        correct: true
      - text: "Un diccionario de Python"
      - text: "Una consulta SQL"
  - question: "¿Cómo creas un DataFrame a partir de un diccionario?"
    options:
      - text: "pd.DataFrame({'col': [1, 2]})"
        correct: true
      - text: "pd.Table({'col': [1, 2]})"
      - text: "pd.Array({'col': [1, 2]})"
      - text: "pd.Series({'col': [1, 2]})"
  - question: "¿Qué devuelve df.shape?"
    options:
      - text: "Los nombres de las columnas"
      - text: "(filas, columnas) como una tupla"
        correct: true
      - text: "Los tipos de datos"
      - text: "Las primeras 5 filas"
---

## ¿Qué es un DataFrame?

Un **DataFrame** de pandas es una estructura de datos bidimensional etiquetada, piensa en él como una hoja de cálculo, una tabla SQL o un diccionario de objetos Series. Cada columna es una Series y todas las columnas comparten el mismo índice.

```python
import pandas as pd

df = pd.DataFrame({
    "Name": ["Alice", "Bob", "Carol"],
    "Age": [24, 30, 28],
    "Score": [88, 92, 79]
})
print(df)
```

Salida:

```
    Name  Age  Score
0  Alice   24     88
1    Bob   30     92
2  Carol   28     79
```

## Creando DataFrames desde diferentes fuentes

**Desde un diccionario de listas**, cada clave se convierte en un nombre de columna:

```python
df = pd.DataFrame({
    "City": ["Lagos", "Nairobi", "Cairo"],
    "Population": [15_400_000, 4_400_000, 20_900_000],
    "Country": ["Nigeria", "Kenya", "Egypt"]
})
```

**Desde una lista de diccionarios**, cada diccionario es una fila:

```python
records = [
    {"Name": "Alice", "Score": 88},
    {"Name": "Bob", "Score": 92},
    {"Name": "Carol", "Score": 79},
]
df = pd.DataFrame(records)
```

**Desde una Series**, varias Series se combinan en columnas:

```python
names = pd.Series(["Alice", "Bob", "Carol"])
scores = pd.Series([88, 92, 79])
df = pd.DataFrame({"Name": names, "Score": scores})
```

## Leyendo archivos CSV

La forma más común de cargar datos reales es desde un archivo CSV:

```python
df = pd.read_csv("titanic.csv")
```

Parámetros útiles para `read_csv()`:

```python
df = pd.read_csv(
    "data.csv",
    index_col="id",        # use 'id' column as the index
    usecols=["name", "age", "fare"],  # load only these columns
    na_values=["?", ""],   # treat '?' and empty strings as NaN
    dtype={"age": "float"} # force column type
)
```

Para este curso usaremos el conjunto de datos del Titanic, que está disponible en:

```python
# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")
```

## Inspeccionando tus datos

Después de cargar los datos, inspecciónalos siempre primero:

```python
df.head()        # first 5 rows
df.tail(3)       # last 3 rows
df.shape          # (rows, columns) — e.g. (891, 12)
df.info()         # column names, non-null counts, dtypes
df.describe()     # statistical summary of numeric columns
```

El método `info()` es particularmente importante, revela valores faltantes y tipos de datos:

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

Observa que `Age` tiene 714 valores no nulos de 891, eso significa 177 valores faltantes. Limpiarlos es una habilidad central que aprenderás más adelante.

## Acceso a columnas

Una vez que tienes un DataFrame, puedes acceder a las columnas como Series:

```python
print(df["Age"])       # returns a Series
print(df.Age)          # dot notation also works (if column name has no spaces)
```

Selecciona varias columnas pasando una lista:

```python
df[["Name", "Age"]]
```

## Inténtalo

Crea un DataFrame que represente a tres empleados con columnas para Nombre, Departamento y Salario. Imprime el DataFrame y luego muestra solo las columnas Nombre y Salario.

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

## Conclusiones clave

- Un DataFrame es una tabla con filas etiquetadas (índice) y columnas etiquetadas
- Los diccionarios de listas y las listas de diccionarios son los métodos de construcción más comunes
- `pd.read_csv()` carga datos externos, usa `index_col`, `usecols` y `na_values` para tener control
- Inspecciona siempre los datos nuevos con `head()`, `info()` y `describe()` antes de analizarlos

## Desafío de práctica

Carga el conjunto de datos del Titanic desde la URL anterior. ¿Cuántas filas y columnas tiene? ¿Cuáles son los nombres de las columnas? ¿Cuántas columnas tienen valores faltantes? Usa `info()` para averiguarlo.
