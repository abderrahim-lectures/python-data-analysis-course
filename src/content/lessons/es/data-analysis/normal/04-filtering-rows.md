---

title: "Filtrando Filas"
description: "Usa condiciones booleanas para conservar solo las filas que coincidan con tus criterios en un DataFrame de pandas."
module: "selection-filtering"
order: 4
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "Filtrar filas usando una sola condición booleana"
  - "Combinar varias condiciones con los operadores & y |"
  - "Usar .isin() y .between() para patrones de filtrado comunes"
  - "Filtrar con métodos de cadena usando el accesor .str"
prerequisites: ["series-dataframe", "selecting-columns"]
tags: ["pandas", "filtering", "boolean", "conditions"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "¿Cómo filtras las filas donde edad > 30?"
    options:
      - text: "df.filter(age > 30)"
      - text: "df[df.age > 30]"
        correct: true
      - text: "df.where('age > 30')"
      - text: "df.select(age > 30)"
  - question: "¿Qué devuelve df[df.age > 30]?"
    options:
      - text: "Una Series"
      - text: "Un DataFrame con solo las filas donde edad > 30"
        correct: true
      - text: "Un único valor"
      - text: "Una lista de índices"
  - question: "¿Cómo filtras con varias condiciones?"
    options:
      - text: "df[df.age > 30 and df.salary > 50000]"
      - text: "df[(df.age > 30) & (df.salary > 50000)]"
        correct: true
      - text: "df.filter(age > 30, salary > 50000)"
      - text: "df.where(age > 30 and salary > 50000)"
---

## Filtrando con condiciones booleanas

Filtrar es la forma de centrarte en el subconjunto de datos que importa. Creas una **máscara booleana** — una Series de valores True/False — y la usas para seleccionar filas.

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")

# Filter passengers older than 30
older = df[df["Age"] > 30]
print(older.shape)   # fewer rows than original 891
```

La expresión `df["Age"] > 30` produce una Series booleana:

```
0       True
1       True
2      False
3       True
...
```

Pasarla dentro de `df[...]` conserva solo las filas donde el valor es `True`.

## Combinando condiciones

Usa `&` (y) y `|` (o) para combinar condiciones. **Cada condición debe ir entre paréntesis:**

```python
# Female passengers in first class
first_class_female = df[(df["Sex"] == "female") & (df["Pclass"] == 1)]
print(first_class_female.head())
```

```python
# Passengers younger than 25 OR older than 60
young_or_old = df[(df["Age"] < 25) | (df["Age"] > 60)]
print(young_or_old.shape)
```

Error común: usar `and`/`or` en lugar de `&`/`|`. Los operadores `and`/`or` de Python no funcionan elemento por elemento sobre las Series de pandas y lanzarán un error.

## Usando .isin() para varios valores

Cuando necesitas coincidir con una lista de valores, usa `.isin()`:

```python
# Passengers who embarked from Cherbourg or Southampton
embarked_filter = df[df["Embarked"].isin(["C", "S"])]
```

```python
# Passengers in class 1 or 2
upper_classes = df[df["Pclass"].isin([1, 2])]
```

## Usando .between() para rangos

El método `.between()` es más limpio que encadenar dos comparaciones:

```python
# Passengers aged 20 to 30 (inclusive by default)
twenties = df[df["Age"].between(20, 30)]
print(twenties.shape)
```

Esto es equivalente a `df[(df["Age"] >= 20) & (df["Age"] <= 30)]` pero más legible.

## Filtrando con métodos de cadena

El accesor `.str` te permite aplicar operaciones de cadena a una columna completa:

```python
# Passengers whose name contains "Master" (a title)
masters = df[df["Name"].str.contains("Master", na=False)]
print(masters.shape)
```

```python
# Passengers whose ticket starts with "A"
a_tickets = df[df["Ticket"].str.startswith("A", na=False)]
```

El parámetro `na=False` maneja los valores faltantes con elegancia — sin él, las entradas NaN causarían errores.

## Filtrando con .query()

Para filtros complejos, `.query()` ofrece una alternativa legible:

```python
# Equivalent to df[(df["Age"] > 25) & (df["Survived"] == 1)]
survivors_over_25 = df.query("Age > 25 and Survived == 1")
```

Esto se lee casi como inglés y evita la sintaxis repetitiva `df["column"]`.

## Almacenando filtros en variables

Para condiciones complejas, guarda la máscara booleana en una variable primero:

```python
is_female = df["Sex"] == "female"
is_first_class = df["Pclass"] == 1
is_survived = df["Survived"] == 1

# Combine them
result = df[is_female & is_first_class & is_survived]
print(f"Female first-class survivors: {len(result)}")
```

Este enfoque hace que tu código sea mucho más fácil de leer y depurar.

## Inténtalo

Del conjunto de datos del Titanic, filtra para encontrar:
1. Todos los pasajeros que pagaron más de 100 en tarifa
2. Todas las pasajeras en tercera clase
3. Todos los pasajeros con el título "Mrs" en su nombre

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")

high_fare = df[df["Fare"] > 100]
print(f"High fare passengers: {len(high_fare)}")

third_class_female = df[(df["Sex"] == "female") & (df["Pclass"] == 3)]
print(f"Third-class females: {len(third_class_female)}")

mrs = df[df["Name"].str.contains("Mrs", na=False)]
print(f"Passengers with title Mrs: {len(mrs)}")
```

## Conclusiones clave

- La indexación booleana `df[mask]` es el mecanismo principal de filtrado en pandas
- Usa `&` para Y, `|` para O — envuelve siempre las condiciones individuales entre paréntesis
- `.isin()` coincide con una lista; `.between()` maneja rangos con limpieza
- `.str.contains()` filtra por coincidencia de subcadena — usa `na=False` por seguridad

## Desafío de práctica

Del conjunto de datos del Titanic, encuentra todos los pasajeros que: (1) fueran hombres, (2) estuvieran en segunda o tercera clase, (3) tuvieran entre 18 y 35 años, y (4) sobrevivieran. ¿Cuántos pasajeros cumplen las cuatro condiciones?
