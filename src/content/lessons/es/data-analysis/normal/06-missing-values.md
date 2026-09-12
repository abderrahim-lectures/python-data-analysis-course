---

title: "Manejando Valores Faltantes"
description: "Detecta, elimina y rellena valores faltantes con isna(), dropna() y fillna() para preparar los datos para el análisis."
module: "data-cleaning"
order: 6
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "Detectar valores faltantes con isna() y notna()"
  - "Eliminar filas o columnas con valores faltantes usando dropna()"
  - "Rellenar valores faltantes con números específicos, estadísticas o estrategias usando fillna()"
  - "Elegir la estrategia correcta para manejar los datos faltantes"
prerequisites: ["selection-filtering"]
tags: ["pandas", "missing-values", "cleaning", "fillna"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "¿Cómo verificas los valores faltantes en un DataFrame?"
    options:
      - text: "df.isnull()"
        correct: true
      - text: "df.missing()"
      - text: "df.hasna()"
      - text: "df.nodata()"
  - question: "¿Qué hace df.dropna()?"
    options:
      - text: "Rellena los valores faltantes con 0"
      - text: "Elimina las filas con cualquier valor faltante"
        correct: true
      - text: "Elimina las columnas con valores faltantes"
      - text: "Cuenta los valores faltantes"
  - question: "¿Cómo rellenas los valores faltantes con la media de la columna?"
    options:
      - text: "df.fillna(0)"
      - text: "df.fillna(df.mean())"
        correct: true
      - text: "df.replace(nan, mean)"
      - text: "df.mean().fill()"
---

## Por qué importan los valores faltantes

Casi todos los conjuntos de datos reales tienen valores faltantes. Si los ignoras, las agregaciones devuelven NaN, las visualizaciones se rompen y los modelos de aprendizaje automático fallan. El primer paso en cualquier análisis es comprender y abordar los datos faltantes.

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")
```

## Detectando valores faltantes

**Verifica una sola columna:**

```python
print(df["Age"].isna().sum())   # 177 missing Age values
```

**Verifica todas las columnas a la vez:**

```python
print(df.isna().sum())
```

Salida:

```
PassengerId      0
Survived         0
Pclass           0
Name             0
Sex              0
Age            177
SibSp            0
Parch            0
Ticket           0
Fare             0
Cabin          687
Embarked         2
dtype: int64
```

**Mira el porcentaje faltante:**

```python
print((df.isna().sum() / len(df) * 100).round(1))
```

Salida:

```
Cabin          77.1%
Age            19.9%
Embarked        0.2%
...
```

Cabin falta en un 77%, demasiado para rellenarlo de forma significativa. Age falta en un 20%, vale la pena intentar rellenarla. Embarked tiene solo 2 faltantes, fácil de manejar.

## Eliminando valores faltantes

**Elimina filas con cualquier valor faltante:**

```python
df_clean = df.dropna()
print(df_clean.shape)   # (183, 12) — lost most rows
```

Esto es demasiado agresivo para la mayoría de los conjuntos de datos. Pierdes 708 de 891 filas.

**Elimina filas donde todos los valores faltan:**

```python
df_clean = df.dropna(how="all")
```

**Elimina filas que faltan en columnas específicas:**

```python
df_clean = df.dropna(subset=["Age", "Embarked"])
print(df_clean.shape)   # (712, 12) — much better
```

**Elimina columnas con demasiados valores faltantes:**

```python
# Drop columns where more than 50% is missing
threshold = len(df) * 0.5
df_clean = df.dropna(thresh=threshold, axis=1)
```

## Rellenando valores faltantes

**Rellena con una constante:**

```python
df["Embarked"] = df["Embarked"].fillna("S")   # most common port
```

**Rellena con una estadística:**

```python
df["Age"] = df["Age"].fillna(df["Age"].median())
```

**Rellenar hacia adelante o hacia atrás**, útil para series de tiempo:

```python
# Use the previous valid value to fill gaps
df["Price"] = df["Price"].ffill()

# Use the next valid value
df["Price"] = df["Price"].bfill()
```

**Rellena con valores diferentes por columna:**

```python
fill_values = {"Age": df["Age"].median(), "Embarked": "S", "Cabin": "Unknown"}
df = df.fillna(fill_values)
```

## Elegir una estrategia

| Escenario | Estrategia |
|---|---|
| Los valores faltantes son aleatorios y pocos (< 5%) | Eliminar con `dropna(subset=[...])` |
| Valores faltantes en una columna numérica | Rellenar con la mediana (robusta a los atípicos) |
| Valores faltantes en una columna categórica | Rellenar con la moda o "Desconocido" |
| La columna falta en > 50% | Eliminar la columna completa |
| Datos de series de tiempo | Usar `ffill()` o `bfill()` |

## Errores comunes

**Rellenar antes de dividir en entrenamiento/prueba**, esto filtra información. Calcula los valores de relleno solo con los datos de entrenamiento y luego aplícalos a ambos.

**Eliminar demasiado agresivamente**, verifica siempre cuántas filas pierdes. `dropna()` sin argumentos suele eliminar mucho más de lo esperado.

**Olvidar verificar**, ejecuta siempre `df.isna().sum()` después de rellenar para confirmar que no queden valores NaN.

## Inténtalo

Del conjunto de datos del Titanic:
1. Calcula el porcentaje de valores faltantes para cada columna
2. Elimina la columna Cabin (demasiados valores faltantes)
3. Rellena Age con la edad mediana
4. Rellena Embarked con el valor más común
5. Verifica que no queden valores faltantes

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")

print((df.isna().sum() / len(df) * 100).round(1))

df = df.drop(columns=["Cabin"])
df["Age"] = df["Age"].fillna(df["Age"].median())
df["Embarked"] = df["Embarked"].fillna(df["Embarked"].mode()[0])

print(df.isna().sum())
```

## Conclusiones clave

- Inspecciona siempre los valores faltantes primero con `isna().sum()` antes de decidir una estrategia
- `dropna()` es potente, pero suele ser demasiado agresivo sin `subset` o `thresh`
- `fillna()` con la mediana o la moda es la estrategia de relleno más común
- Las columnas con > 50% de valores faltantes generalmente es mejor eliminarlas que rellenarlas

## Desafío de práctica

Carga el conjunto de datos del Titanic y crea una versión limpia: elimina Cabin, rellena Age con la mediana, rellena Embarked con la moda. Luego compara la tasa de supervivencia antes y después de la limpieza. ¿La limpieza cambió la tasa de supervivencia general? ¿Por qué sí o por qué no?
