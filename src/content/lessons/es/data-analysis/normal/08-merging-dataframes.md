---

title: "Combinando DataFrames"
description: "Combina conjuntos de datos relacionados usando merge(), join() y concat() para construir tablas de análisis completas."
module: "groupby-aggregation"
order: 8
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "Combinar dos DataFrames con una clave compartida usando merge()"
  - "Comprender las uniones inner, left, right y outer"
  - "Concatenar DataFrames verticalmente con concat()"
  - "Manejar conflictos de combinación cuando las columnas tienen nombres superpuestos"
prerequisites: ["data-cleaning", "groupby-basics"]
tags: ["pandas", "merge", "join", "concat", "combining"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "¿Qué es una combinación (merge) en pandas?"
    options:
      - text: "Combinar dos DataFrames por columnas o índices comunes"
        correct: true
      - text: "Agregar filas a un DataFrame"
      - text: "Eliminar filas duplicadas"
      - text: "Ordenar un DataFrame"
  - question: "¿Qué tipo de combinación conserva solo las filas coincidentes?"
    options:
      - text: "outer"
      - text: "inner"
        correct: true
      - text: "left"
      - text: "right"
  - question: "¿Qué sucede con una combinación left si el DataFrame derecho no tiene coincidencia?"
    options:
      - text: "La fila se elimina"
      - text: "Los valores NaN llenan las columnas derechas"
        correct: true
      - text: "Ocurre un error"
      - text: "La fila se duplica"
---

## ¿Por qué combinar?

Los análisis reales suelen requerir datos de múltiples fuentes. Combinar une dos DataFrames basándose en una clave compartida, como una JOIN en SQL o un BUSCARV en Excel.

```python
import pandas as pd

# Create sample DataFrames
passengers = pd.DataFrame({
    "passenger_id": [1, 2, 3, 4, 5],
    "name": ["Alice", "Bob", "Carol", "David", "Eve"],
    "class": [1, 3, 2, 3, 1]
})

tickets = pd.DataFrame({
    "passenger_id": [1, 2, 3, 6],
    "fare": [100.0, 15.5, 26.0, 30.0],
    "embarked": ["S", "C", "S", "Q"]
})
```

## Combinación básica

```python
merged = pd.merge(passengers, tickets, on="passenger_id")
print(merged)
```

Salida:

```
   passenger_id   name  class   fare embarked
0             1  Alice      1  100.0        S
1             2    Bob      3   15.5        C
2             3  Carol      2   26.0        S
```

Solo aparecen los pasajeros 1, 2 y 3, esto es una **unión inner** (la predeterminada). Los pasajeros 4 y 5 no tienen datos de boleto; el pasajero 6 no tiene datos de pasajero.

## Tipos de unión

**Unión inner** (predeterminada), solo las filas coincidentes de ambos lados:

```python
pd.merge(passengers, tickets, on="passenger_id")
```

**Unión left**, conserva todas las filas del DataFrame izquierdo:

```python
pd.merge(passengers, tickets, on="passenger_id", how="left")
```

Salida:

```
   passenger_id   name  class   fare embarked
0             1  Alice      1  100.0        S
1             2    Bob      3   15.5        C
2             3  Carol      2   26.0        S
3             4  David      3    NaN      NaN
4             5    Eve      1    NaN      NaN
```

**Unión right**, conserva todas las filas del DataFrame derecho:

```python
pd.merge(passengers, tickets, on="passenger_id", how="right")
```

**Unión outer**, conserva todas las filas de ambos lados:

```python
pd.merge(passengers, tickets, on="passenger_id", how="outer")
```

Salida:

```
   passenger_id   name  class   fare embarked
0             1  Alice    1.0  100.0        S
1             2    Bob    3.0   15.5        C
2             3  Carol    2.0   26.0        S
3             4  David    3.0    NaN      NaN
4             5    Eve    1.0    NaN      NaN
5             6    NaN    NaN   30.0        Q
```

## Combinando con nombres de columnas diferentes

Cuando las columnas clave tienen nombres diferentes, usa `left_on` y `right_on`:

```python
df1 = pd.DataFrame({"id_a": [1, 2, 3], "val": ["x", "y", "z"]})
df2 = pd.DataFrame({"id_b": [1, 2, 3], "score": [10, 20, 30]})

merged = pd.merge(df1, df2, left_on="id_a", right_on="id_b")
print(merged)
```

## Manejando nombres de columnas superpuestos

Cuando ambos DataFrames tienen columnas con el mismo nombre (además de la clave), pandas agrega sufijos:

```python
merged = pd.merge(passengers, tickets, on="passenger_id", suffixes=("_pass", "_tick"))
```

## Combinando por índice

Si la clave es el índice, usa `left_index` y `right_index`:

```python
passengers_idx = passengers.set_index("passenger_id")
tickets_idx = tickets.set_index("passenger_id")

merged = pd.merge(passengers_idx, tickets_idx, left_index=True, right_index=True)
```

## Concatenación

`concat()` apila DataFrames vertical u horizontalmente:

**Vertical (apilar filas):**

```python
df_top = pd.DataFrame({"name": ["Alice", "Bob"], "score": [88, 92]})
df_bottom = pd.DataFrame({"name": ["Carol", "David"], "score": [79, 95]})

combined = pd.concat([df_top, df_bottom], ignore_index=True)
print(combined)
```

**Horizontal (agregar columnas):**

```python
df_a = pd.DataFrame({"name": ["Alice", "Bob"]})
df_b = pd.DataFrame({"score": [88, 92]})

combined = pd.concat([df_a, df_b], axis=1)
```

## Ejemplo práctico: datos del Titanic

```python
# titanic.csv ships with the course — load it from the browser file system.
titanic = pd.read_csv("titanic.csv")

# Create a summary DataFrame
class_stats = titanic.groupby("Pclass").agg(
    avg_fare=("Fare", "mean"),
    avg_age=("Age", "median"),
    survival_rate=("Survived", "mean")
).reset_index()

print(class_stats)
```

El `reset_index()` convierte el índice agrupado de nuevo en una columna regular, lo cual es necesario antes de combinar.

## Inténtalo

Crea dos DataFrames: `students` con las columnas `id`, `name` y `grades` con las columnas `id`, `math`, `english`. Combínalos con `id` usando una unión left. Luego concatena dos DataFrames pequeños verticalmente.

```python
import pandas as pd

students = pd.DataFrame({"id": [1, 2, 3], "name": ["Alice", "Bob", "Carol"]})
grades = pd.DataFrame({"id": [1, 2, 4], "math": [88, 92, 75], "english": [90, 85, 80]})

merged = pd.merge(students, grades, on="id", how="left")
print(merged)

df1 = pd.DataFrame({"name": ["X", "Y"], "val": [1, 2]})
df2 = pd.DataFrame({"name": ["Z"], "val": [3]})
print(pd.concat([df1, df2], ignore_index=True))
```

## Conclusiones clave

- `merge()` combina DataFrames con claves compartidas; `concat()` los apila vertical u horizontalmente
- El parámetro `how` controla el tipo de unión: inner (predeterminado), left, right, outer
- Usa `left_on`/`right_on` cuando las columnas clave tienen nombres diferentes
- Ejecuta siempre `reset_index()` después de groupby antes de combinar

## Desafío de práctica

Del conjunto de datos del Titanic, crea un DataFrame de resumen agrupado por Pclass con las columnas: Pclass, avg_fare, survival_rate, passenger_count. Luego crea otro resumen agrupado por Embarked. Combina estos dos resúmenes con Pclass usando una unión left. ¿Qué información se pierde o se gana?
