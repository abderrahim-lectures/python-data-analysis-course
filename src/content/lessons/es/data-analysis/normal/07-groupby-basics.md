---

title: "Fundamentos de GroupBy"
description: "Divide los datos en grupos y calcula resúmenes usando el patrón dividir-aplicar-combinar con groupby()."
module: "groupby-aggregation"
order: 7
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "Comprender el patrón dividir-aplicar-combinar"
  - "Agrupar datos por una o más columnas con groupby()"
  - "Aplicar agregaciones como mean(), sum(), count() y describe()"
  - "Usar agg() para varias agregaciones a la vez"
prerequisites: ["data-cleaning"]
tags: ["pandas", "groupby", "aggregation", "split-apply-combine"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "¿Qué hace df.groupby('col')?"
    options:
      - text: "Ordena el DataFrame"
      - text: "Agrupa las filas por valores únicos en la columna"
        correct: true
      - text: "Elimina los duplicados"
      - text: "Crea una nueva columna"
  - question: "¿Cómo calculas la media de cada grupo?"
    options:
      - text: "df.groupby('col').mean()"
        correct: true
      - text: "df.mean().groupby('col')"
      - text: "df.group('col').average()"
      - text: "df.groupby('col').sum() / df.groupby('col').count()"
  - question: "¿Qué devuelve df.groupby('col').size()?"
    options:
      - text: "El número total de filas"
      - text: "El conteo de filas por grupo"
        correct: true
      - text: "El tamaño de memoria de cada grupo"
      - text: "El número de columnas"
---

## El patrón dividir-aplicar-combinar

GroupBy es una de las características más potentes de pandas. Sigue un patrón de tres pasos:

1. **Dividir** — divide el DataFrame en grupos según una o más columnas
2. **Aplicar** — calcula una función en cada grupo de forma independiente
3. **Combinar** — une los resultados de nuevo en un solo DataFrame

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")
```

## Agrupando por una sola columna

```python
# Average survival rate by passenger class
print(df.groupby("Pclass")["Survived"].mean())
```

Salida:

```
Pclass
1    0.629630
2    0.472826
3    0.242363
Name: Survived, dtype: float64
```

Los pasajeros de primera clase tuvieron una tasa de supervivencia del 63%, en comparación con el 24% de la tercera clase. Groupby reveló una diferencia de clase marcada en segundos.

**Qué sucede paso a paso:**

```python
# This is conceptually what groupby does:
for pclass, group_df in df.groupby("Pclass"):
    print(f"Class {pclass}: {group_df['Survived'].mean():.3f}")
```

## Agrupando por varias columnas

```python
# Survival rate by class and sex
print(df.groupby(["Pclass", "Sex"])["Survived"].mean())
```

Salida:

```
Pclass  Sex   
1       female    0.968085
        male      0.368852
2       female    0.921053
        male      0.157407
3       female    0.500000
        male      0.135447
Name: Survived, dtype: float64
```

Usa `unstack()` para hacer esto más fácil de leer:

```python
print(df.groupby(["Pclass", "Sex"])["Survived"].mean().unstack())
```

## Métodos de agregación

Groupby admite todas las agregaciones estándar:

```python
# Mean fare by class
print(df.groupby("Pclass")["Fare"].mean())

# Total fare collected per class
print(df.groupby("Pclass")["Fare"].sum())

# Count of passengers per class
print(df.groupby("Pclass")["PassengerId"].count())
```

## Múltiples agregaciones con agg()

El método `agg()` aplica varias funciones a la vez:

```python
print(df.groupby("Pclass")["Fare"].agg(["mean", "median", "min", "max", "count"]))
```

Salida:

```
              mean  median     min       max  count
Pclass                                             
1        84.154687  60.287  0.0000  512.3292    216
2        20.662183  19.575  0.0000   73.5000    184
3        13.675550   8.050  0.0000   56.4958    491
```

**Diferentes agregaciones por columna:**

```python
print(df.groupby("Pclass").agg({
    "Survived": "mean",
    "Fare": ["mean", "max"],
    "Age": "median",
    "Name": "count"
}))
```

## Agregando todas las columnas numéricas

```python
# Quick summary of all numeric columns per group
print(df.groupby("Pclass").mean(numeric_only=True))
```

## GroupBy con filtros

Después de agrupar, puedes filtrar grupos completos:

```python
# Keep only groups with more than 50 passengers
large_groups = df.groupby("Pclass").filter(lambda x: len(x) > 50)
print(large_groups["Pclass"].value_counts())
```

## Inténtalo

Usando el conjunto de datos del Titanic, calcula:
1. La tarifa promedio para cada puerto de embarque
2. La tasa de supervivencia para cada combinación de sexo y puerto de embarque
3. Las estadísticas de edad (media, mediana, mín, máx) para cada clase de pasajero

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")

print("Average fare by port:")
print(df.groupby("Embarked")["Fare"].mean())

print("\nSurvival by sex and port:")
print(df.groupby(["Sex", "Embarked"])["Survived"].mean().unstack())

print("\nAge stats by class:")
print(df.groupby("Pclass")["Age"].agg(["mean", "median", "min", "max"]))
```

## Conclusiones clave

- GroupBy sigue el patrón dividir-aplicar-combinar: divide los datos, aplica una función, combina los resultados
- Agrupa por una columna para resúmenes simples y por varias columnas para análisis más profundos
- `agg()` te permite calcular varias estadísticas a la vez, por columna si es necesario
- Groupby revela patrones invisibles en los datos crudos

## Desafío de práctica

Del conjunto de datos del Titanic, calcula la tasa de supervivencia para cada combinación de Pclass, Sex y si el pasajero viajaba solo (SibSp + Parch == 0). ¿Qué grupo tuvo la mayor tasa de supervivencia? ¿Cuál tuvo la menor?
