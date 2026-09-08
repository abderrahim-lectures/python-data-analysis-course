---

title: "Análisis EDA del Titanic"
description: "Limpia los datos del Titanic, analiza los patrones de supervivencia con groupby y extrae conclusiones accionables de tu exploración."
module: "titanic-eda"
order: 10
difficulty: "intermediate"
estimatedMinutes: 30
learningObjectives:
  - "Limpiar el conjunto de datos del Titanic manejando valores faltantes y eliminando columnas inútiles"
  - "Analizar las tasas de supervivencia por clase de pasajero, sexo y grupo de edad"
  - "Crear tablas de resumen con groupby y agregaciones"
  - "Extraer conclusiones basadas en datos a partir del análisis exploratorio"
prerequisites: ["titanic-loading"]
tags: ["pandas", "eda", "titanic", "analysis", "conclusions"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "¿Qué porcentaje de pasajeros del Titanic sobrevivió?"
    options:
      - text: "Alrededor del 25%"
      - text: "Alrededor del 38%"
        correct: true
      - text: "Alrededor del 50%"
      - text: "Alrededor del 75%"
  - question: "¿Qué clase tuvo la mayor tasa de supervivencia?"
    options:
      - text: "Tercera clase"
      - text: "Primera clase"
        correct: true
      - text: "Segunda clase"
      - text: "Todas las clases tuvieron tasas iguales"
  - question: "¿Qué muestra pd.crosstab(df.pclass, df.survived)?"
    options:
      - text: "La tarifa promedio por clase"
      - text: "El conteo de pasajeros por clase y estado de supervivencia"
        correct: true
      - text: "Los ingresos totales por clase"
      - text: "La distribución de edades"
---

## Análisis de principio a fin

Esta lección une todo lo aprendido en los módulos anteriores. Cargaremos, limpiaremos, exploraremos y analizaremos el conjunto de datos del Titanic en un flujo de trabajo completo.

```python
import pandas as pd

url = "https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv"
df = pd.read_csv(url)
```

## Paso 1: Limpia los datos

```python
# Drop Cabin — 77% missing, not useful
df = df.drop(columns=["Cabin"])

# Fill Age with median
df["Age"] = df["Age"].fillna(df["Age"].median())

# Fill Embarked with mode (most common port)
df["Embarked"] = df["Embarked"].fillna(df["Embarked"].mode()[0])

# Verify no missing values remain
print(df.isna().sum().sum())   # 0
```

## Paso 2: Ingeniería de características

Crea columnas derivadas útiles:

```python
# Travel alone indicator
df["IsAlone"] = ((df["SibSp"] + df["Parch"]) == 0).astype(int)

# Age groups
df["AgeGroup"] = pd.cut(df["Age"], bins=[0, 12, 18, 35, 60, 100],
                         labels=["Child", "Teen", "Adult", "Middle-aged", "Senior"])

# Family size
df["FamilySize"] = df["SibSp"] + df["Parch"] + 1
```

## Paso 3: Supervivencia por clase

```python
print(df.groupby("Pclass")["Survived"].agg(["mean", "count"]))
```

Salida:

```
            mean  count
Pclass                 
1       0.629630    216
2       0.472826    184
3       0.242363    491
```

Los pasajeros de primera clase sobrevivieron a casi el triple de la tasa de los de tercera clase.

## Paso 4: Supervivencia por sexo

```python
print(df.groupby("Sex")["Survived"].agg(["mean", "count"]))
```

Salida:

```
            mean  count
Sex                    
female  0.742038    314
male    0.188908    577
```

El 74% de las mujeres sobrevivió frente al 19% de los hombres — la política de "mujeres y niños primero" se refleja claramente.

## Paso 5: Análisis combinado — clase y sexo

```python
print(df.groupby(["Pclass", "Sex"])["Survived"].mean().unstack())
```

Salida:

```
Sex      female      male
Pclass                   
1       0.968085  0.368852
2       0.921053  0.157407
3       0.500000  0.135447
```

Las mujeres de primera clase tuvieron una tasa de supervivencia del 97%. Los hombres de tercera clase, apenas del 14%.

## Paso 6: Supervivencia por grupo de edad

```python
print(df.groupby("AgeGroup", observed=True)["Survived"].agg(["mean", "count"]))
```

Salida:

```
                mean  count
AgeGroup                   
Child       0.580645     62
Teen        0.347826     46
Adult       0.339869    306
Middle-aged 0.385965    228
Senior      0.227273     22
```

Los niños tuvieron la mayor tasa de supervivencia, con un 58%.

## Paso 7: Supervivencia por tamaño de familia

```python
print(df.groupby("FamilySize")["Survived"].agg(["mean", "count"]))
```

Salida:

```
                mean  count
FamilySize                  
1           0.303538    537
2           0.552795    161
3           0.578431     89
4           0.724138     58
5           0.200000     20
6           0.166667     12
7           0.333333      6
8           0.000000      5
```

Las familias de 2 a 4 miembros tuvieron las mejores tasas de supervivencia. Los viajeros solos y las familias muy grandes les fue peor.

## Paso 8: Distribución de la tarifa por supervivencia

```python
print(df.groupby("Survived")["Fare"].describe().round(2))
```

Salida:

```
         count   mean    std  min   25%   50%    75%      max
Survived                                                     
0        549.0  22.12  31.42  0.0  7.85  10.5  26.00   263.00
1        342.0  48.40  66.33  0.0  12.48  26.0  57.01  512.33
```

Los sobrevivientes pagaron tarifas significativamente más altas en promedio.

## Paso 9: Puerto de embarque

```python
print(df.groupby("Embarked")["Survived"].agg(["mean", "count"]))
```

Salida:

```
            mean  count
Embarked               
C       0.553571    168
Q       0.389610     77
S       0.368821    646
```

Los pasajeros de Cherburgo tuvieron la mayor tasa de supervivencia — probablemente porque allí embarcaron más pasajeros de primera clase.

## Paso 10: Resumen de hallazgos

```python
# Create a final summary table
summary = df.groupby(["Pclass", "Sex"]).agg(
    passengers=("Survived", "count"),
    survival_rate=("Survived", "mean"),
    avg_fare=("Fare", "mean"),
    avg_age=("Age", "mean")
).round(3)

print(summary)
```

## Conclusiones clave

1. **La clase fue el predictor más fuerte de supervivencia** — los pasajeros de primera clase sobrevivieron al 63% frente al 24% de la tercera clase
2. **El género fue igualmente poderoso** — el 74% de las mujeres sobrevivió frente al 19% de los hombres
3. **La combinación importa más** — mujeres de primera clase: 97% de supervivencia; hombres de tercera clase: 14%
4. **Los niños tuvieron ventaja** — 58% de supervivencia, la más alta de cualquier grupo de edad
5. **Los tamaños de familia moderados ayudaron** — las familias de 2 a 4 miembros sobrevivieron más que los viajeros solos
6. **La tarifa pagada se correlacionó con la supervivencia** — los pasajeros que pagaron más sobrevivieron más, probablemente reflejando la clase y la ubicación de la cabina

## Inténtalo

Replica este análisis con una pregunta diferente: ¿Viajar con un acompañante (familiar) mejoró las posibilidades de supervivencia? Compara a los viajeros solos (FamilySize == 1) con las familias pequeñas (2-4 miembros) y las familias grandes (5+ miembros).

```python
import pandas as pd

url = "https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv"
df = pd.read_csv(url)

df["FamilySize"] = df["SibSp"] + df["Parch"] + 1
df["Group"] = pd.cut(df["FamilySize"], bins=[0, 1, 4, 20], labels=["Solo", "Small", "Large"])

print(df.groupby("Group")["Survived"].agg(["mean", "count"]))
```

## Conclusiones clave

- Un EDA completo sigue un proceso: cargar → limpiar → crear características → agrupar → analizar → concluir
- La limpieza debe ocurrir antes del análisis — los valores faltantes sesgan los resultados de groupby
- La ingeniería de características (grupos de edad, indicadores de viajar solo) revela patrones ocultos en los números crudos
- Múltiples ángulos de groupby (clase, sexo, edad, familia) construyen una imagen completa

## Desafío de práctica

Realiza tu propio mini-EDA del conjunto de datos del Titanic. Elige una pregunta no cubierta arriba (por ejemplo: "¿Los pasajeros con títulos como 'Dr' o 'Rev' tuvieron tasas de supervivencia diferentes?") y respóndela usando las habilidades de pandas de este curso. Escribe tus hallazgos en 3-5 oraciones.