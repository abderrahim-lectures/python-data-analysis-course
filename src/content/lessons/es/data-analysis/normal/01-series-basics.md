---

title: "Creando Series"
description: "Construye arreglos unidimensionales etiquetados a partir de listas, diccionarios y valores escalares usando Series de pandas."
module: "series-dataframe"
order: 1
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "Crear una Series a partir de una lista, un diccionario o un valor escalar"
  - "Comprender el papel del índice en una Series"
  - "Acceder a valores e índices de una Series"
  - "Realizar operaciones vectorizadas sobre datos de una Series"
prerequisites: ["python-basics"]
tags: ["pandas", "series", "data-structures"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "¿Qué es una Series de pandas?"
    options:
      - text: "Una tabla de datos 2D"
      - text: "Un arreglo etiquetado 1D"
        correct: true
      - text: "Una lista de Python"
      - text: "Una tabla SQL"
  - question: "¿Cómo creas una Series a partir de una lista?"
    options:
      - text: "pd.Series([1, 2, 3])"
        correct: true
      - text: "pd.array([1, 2, 3])"
      - text: "pd.List([1, 2, 3])"
      - text: "pd.DataFrame([1, 2, 3])"
  - question: "¿Qué te indica s.dtype?"
    options:
      - text: "La longitud de la Series"
      - text: "El tipo de datos de cada elemento"
        correct: true
      - text: "La suma de todos los valores"
      - text: "Las etiquetas del índice"
---

## ¿Qué es una Series?

Una **Series** de pandas es un arreglo unidimensional etiquetado. Piensa en ella como una única columna de una hoja de cálculo: cada valor tiene una etiqueta (el índice) y los datos pueden ser de cualquier tipo: enteros, flotantes, cadenas o incluso objetos de Python.

```python
import pandas as pd

scores = pd.Series([88, 92, 75, 81])
print(scores)
```

Salida:

```
0    88
1    92
2    75
3    81
dtype: int64
```

La columna izquierda es el **índice** (0, 1, 2, 3 por defecto). La columna derecha son los datos. Juntos forman una Series.

## Creando Series desde diferentes fuentes

**Desde una lista**, el índice toma como valor por defecto un rango de enteros:

```python
temperatures = pd.Series([22.5, 24.1, 19.8, 26.3])
print(temperatures)
```

**Desde un diccionario**, las claves se convierten en el índice:

```python
population = pd.Series({
    "Lagos": 15_400_000,
    "Cairo": 20_900_000,
    "Johannesburg": 5_600_000,
})
print(population)
```

Salida:

```
Lagos           15400000
Cairo           20900000
Johannesburg     5600000
dtype: int64
```

**Desde un escalar**, un único valor se repite para llenar el índice:

```python
zeros = pd.Series(0, index=["a", "b", "c", "d"])
print(zeros)
```

## Accediendo a los valores

Usa el índice para recuperar valores. Con un índice etiquetado, puedes usar la notación de corchetes o el acceso con punto:

```python
print(population["Cairo"])           # 20900000
print(population[["Lagos", "Johannesburg"]])  # subset with multiple labels
```

Con un índice de enteros, puedes hacer cortes (slicing) como con una lista:

```python
print(scores[1:3])   # select index 1 and 2
```

## Operaciones vectorizadas

Las Series admiten operaciones elemento por elemento sin usar bucles:

```python
celsius = pd.Series([22, 25, 18, 30])
fahrenheit = celsius * 9 / 5 + 32
print(fahrenheit)
```

Salida:

```
0    71.6
1    77.0
2    64.4
3    86.0
dtype: float64
```

Los operadores de comparación devuelven una Series booleana:

```python
print(celsius > 24)
```

Salida:

```
0    False
1     True
2    False
3     True
dtype: bool
```

## Atributos y métodos útiles de Series

| Atributo/Método | Descripción |
|---|---|
| `.values` | Devuelve el arreglo NumPy subyacente |
| `.index` | Devuelve el objeto índice |
| `.dtype` | Devuelve el tipo de datos |
| `.shape` | Devuelve la tupla `(n,)` |
| `.mean()`, `.sum()`, `.max()` | Métodos de agregación |
| `.value_counts()` | Cuenta los valores únicos |

```python
print(scores.mean())       # 84.0
print(scores.max())        # 92
print(scores.shape)        # (4,)
```

## Inténtalo

Crea una Series llamada `grades` con las siguientes calificaciones de estudiantes: Alice: 87, Bob: 92, Carol: 78, David: 95. Imprime la Series y luego calcula e imprime la calificación media. Finalmente, crea una Series booleana que muestre qué estudiantes obtuvieron más de 85.

```python
import pandas as pd

grades = pd.Series({"Alice": 87, "Bob": 92, "Carol": 78, "David": 95})
print(grades)
print(f"Mean: {grades.mean()}")
print(grades > 85)
```

## Conclusiones clave

- Una Series es un arreglo unidimensional etiquetado, la base de pandas
- El índice proporciona etiquetas para acceder a los datos y hacer cortes
- Las operaciones vectorizadas te permiten transformar columnas completas sin bucles
- Los diccionarios son una fuente natural para Series con etiquetas significativas

## Desafío de práctica

Tienes un diccionario que representa la lluvia mensual en milímetros: `{"Jan": 45, "Feb": 38, "Mar": 52, "Apr": 61, "May": 48, "Jun": 35}`. Crea una Series a partir de él y luego calcula la lluvia total y la lluvia mensual promedio. ¿Qué mes tuvo más lluvia? ¿Cuál tuvo menos?
