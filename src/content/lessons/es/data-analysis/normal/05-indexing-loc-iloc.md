---

title: "loc e iloc"
description: "Accede a filas y columnas específicas usando loc basado en etiquetas e iloc basado en posiciones para una selección precisa de datos."
module: "data-cleaning"
order: 5
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "Usar loc para seleccionar filas y columnas por etiqueta"
  - "Usar iloc para seleccionar filas y columnas por posición entera"
  - "Combinar la selección de filas y columnas en una sola operación"
  - "Usar loc para asignación y edición dirigidas"
prerequisites: ["selection-filtering"]
tags: ["pandas", "loc", "iloc", "indexing"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "¿Cuál es la diferencia entre loc e iloc?"
    options:
      - text: "loc usa etiquetas, iloc usa posiciones enteras"
        correct: true
      - text: "loc es más rápido que iloc"
      - text: "iloc usa etiquetas, loc usa posiciones"
      - text: "No hay diferencia"
  - question: "¿Cómo seleccionas las primeras 3 filas con iloc?"
    options:
      - text: "df.iloc[0:3]"
        correct: true
      - text: "df.iloc[0, 3]"
      - text: "df.loc[0:3]"
      - text: "df.head(3).iloc"
  - question: "¿Cómo seleccionas una celda específica con loc?"
    options:
      - text: "df.iloc[row, col]"
      - text: "df.loc[index, column]"
        correct: true
      - text: "df.get(row, col)"
      - text: "df.select(row, col)"
---

## El problema con la indexación por corchetes

La indexación básica por corchetes `df[mask]` funciona para filtrar filas y `df["col"]` para seleccionar columnas. Pero cuando necesitas seleccionar filas específicas **y** columnas específicas en un solo paso, o editar celdas individuales, necesitas `loc` e `iloc`.

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")
```

## loc: selección basada en etiquetas

`loc` selecciona por **etiqueta**, las etiquetas del índice de filas y los nombres de las columnas:

```python
# Select row at index label 0, columns "Name" and "Age"
print(df.loc[0, ["Name", "Age"]])
```

Salida:

```
Name    Braund, Mr. Owen Harris
Age                        22.0
Name: 0, dtype: object
```

**Corte (slice) por etiqueta**, el punto final es inclusivo (a diferencia del slicing de Python):

```python
# Rows 0 through 4, columns Name through Age
print(df.loc[0:4, "Name":"Age"])
```

**Selecciona todas las filas para columnas específicas:**

```python
print(df.loc[:, ["Name", "Survived"]].head())
```

**Selecciona todas las columnas para filas específicas:**

```python
print(df.loc[[0, 5, 10]])
```

## iloc: selección basada en posiciones

`iloc` selecciona por **posición entera**, el número de fila/columna comenzando desde 0:

```python
# First row, first three columns
print(df.iloc[0, :3])
```

Salida:

```
PassengerId                            1
Survived                               0
Pclass                                 3
Name: 0, dtype: object
```

**Corte por posición**, el punto final es exclusivo (comportamiento estándar de Python):

```python
# Rows 0-4 (5 rows), columns 0-2 (3 columns)
print(df.iloc[0:5, 0:3])
```

**Selecciona filas y columnas específicas:**

```python
# Rows 0, 1, 5; columns 3 (Name) and 4 (Age)
print(df.iloc[[0, 1, 5], [3, 4]])
```

## loc vs iloc: diferencias clave

| Característica | loc | iloc |
|---|---|---|
| Selección por | Etiquetas (nombres) | Posiciones enteras |
| Extremo del corte | Inclusivo | Exclusivo |
| Selección de columnas | Por nombre | Por posición |
| Mejor para | Índices nombrados | Índice entero por defecto |

```python
# These are different:
df.loc[0:5]       # rows with labels 0 through 5 (inclusive) — 6 rows
df.iloc[0:5]      # rows at positions 0 through 4 (exclusive) — 5 rows
```

## Usando loc para asignaciones

`loc` no es solo para leer, puedes usarlo para **editar** celdas específicas:

```python
# Set Age to 0 for the first passenger
df.loc[0, "Age"] = 0

# Set Fare to -1 for rows where Fare is negative
df.loc[df["Fare"] < 0, "Fare"] = 0

# Create a new column based on conditions
df.loc[df["Age"] < 18, "Category"] = "Minor"
df.loc[df["Age"] >= 18, "Category"] = "Adult"
```

Esta edición dirigida es esencial para la limpieza de datos.

## Patrones prácticos

**Obtener el valor de una celda específica:**

```python
# The name of the passenger at position 100
name = df.loc[100, "Name"]
print(name)
```

**Seleccionar un rango de columnas:**

```python
# All rows, columns from "Name" to "Fare"
print(df.loc[:, "Name":"Fare"].head())
```

**Selección condicional con ambos ejes:**

```python
# Female passengers, only Name and Age columns
women = df.loc[df["Sex"] == "female", ["Name", "Age"]]
print(women.head())
```

## Inténtalo

Del conjunto de datos del Titanic:
1. Usa `iloc` para imprimir las primeras 3 filas y las primeras 4 columnas
2. Usa `loc` para imprimir el Nombre y la Tarifa del pasajero en el índice 50
3. Usa `loc` para establecer la Edad del pasajero en el índice 0 a 25

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")

# First 3 rows, first 4 columns
print(df.iloc[0:3, 0:4])

# Name and Fare at index 50
print(df.loc[50, ["Name", "Fare"]])

# Set Age to 25
df.loc[0, "Age"] = 25
print(df.loc[0, "Age"])
```

## Conclusiones clave

- `loc` selecciona por etiqueta (nombres); `iloc` selecciona por posición entera
- Los cortes de `loc` son inclusivos en ambos extremos; los cortes de `iloc` siguen la convención de Python (extremo exclusivo)
- `loc` admite asignación para editar celdas de forma dirigida
- Combinar la selección de filas y columnas en una sola llamada a `loc` es más limpio que la indexación encadenada

## Desafío de práctica

Del conjunto de datos del Titanic, usa `iloc` para extraer las filas 100-109 y las columnas 2-5 (Pclass hasta Age). Luego usa `loc` para encontrar los nombres de todos los pasajeros con las etiquetas de índice 0, 50, 100 y 500. Finalmente, usa `loc` para cambiar la Tarifa del pasajero en el índice 7 a 999 y verifica el cambio.
