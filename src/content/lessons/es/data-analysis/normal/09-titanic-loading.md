---

title: "Cargando y Explorando el Titanic"
description: "Carga el conjunto de datos del Titanic, inspecciona su estructura, comprende cada columna y prepárate para el análisis."
module: "titanic-eda"
order: 9
difficulty: "intermediate"
estimatedMinutes: 30
learningObjectives:
  - "Cargar el conjunto de datos del Titanic e inspeccionar su estructura"
  - "Inspeccionar la estructura del conjunto de datos con head(), info(), describe() y value_counts()"
  - "Identificar problemas de calidad de datos: valores faltantes, tipos incorrectos, inconsistencias"
  - "Documentar las observaciones iniciales antes de limpiar"
prerequisites: ["groupby-aggregation"]
tags: ["pandas", "eda", "titanic", "exploration"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "¿Cómo cargas un archivo CSV con pandas?"
    options:
      - text: "pd.read_csv('file.csv')"
        correct: true
      - text: "pd.load('file.csv')"
      - text: "pd.open('file.csv')"
      - text: "pd.import_csv('file.csv')"
  - question: "¿Qué muestra df.head()?"
    options:
      - text: "Las últimas 5 filas"
      - text: "Las primeras 5 filas"
        correct: true
      - text: "Todas las filas"
      - text: "Solo los nombres de las columnas"
  - question: "¿Cómo verificas los tipos de datos de todas las columnas?"
    options:
      - text: "df.types"
      - text: "df.dtypes"
        correct: true
      - text: "df.info.types"
      - text: "df.schema()"
---

## El conjunto de datos del Titanic

El RMS Titanic se hundió el 15 de abril de 1912 después de chocar con un iceberg. Este conjunto de datos contiene información sobre 891 pasajeros, incluido si sobrevivieron. Es el conjunto de datos más utilizado para aprender análisis de datos porque combina datos numéricos, categóricos y faltantes de maneras realistas.

## Cargando los datos

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")
```

## Primer vistazo a los datos

Empieza siempre con `head()` para ver con qué estás trabajando:

```python
print(df.head(10))
```

Salida:

```
   PassengerId  Survived  Pclass  \
0            1         0       3   
1            2         1       1   
2            3         1       3   
3            4         1       1   
4            5         0       3   
...

                                                Name     Sex   Age  SibSp  \
0                            Braund, Mr. Owen Harris    male  22.0      1   
1  Cumings, Mrs. John Bradley (Florence Briggs Th...  female  38.0      1   
2                             Heikkinen, Miss. Laina  female  26.0      0   
3       Futrelle, Mrs. Jacques Heath (Lily May Peel)  female  35.0      1   
4                           Allen, Mr. William Henry    male  35.0      0   

   Parch            Ticket     Fare Cabin Embarked  
0      0         A/5 21171   7.2500   NaN        S  
1      0          PC 17599  71.2833   C85        C  
2      0  STON/O2. 3101282   7.9250   NaN        S  
3      0            113803  53.1000  C123        S  
4      0            373450   8.0500   NaN        S  
```

## Comprendiendo cada columna

| Columna | Descripción | Tipo |
|---|---|---|
| PassengerId | ID único para cada pasajero | int |
| Survived | Supervivencia (0 = No, 1 = Sí) | int (binario) |
| Pclass | Clase de boleto (1 = 1ª, 2 = 2ª, 3 = 3ª) | int (ordinal) |
| Name | Nombre del pasajero | string |
| Sex | Género | string (binario) |
| Age | Edad en años | float (tiene faltantes) |
| SibSp | Número de hermanos/cónyuges a bordo | int |
| Parch | Número de padres/hijos a bordo | int |
| Ticket | Número de boleto | string |
| Fare | Tarifa del pasajero | float |
| Cabin | Número de cabina | string (mayormente faltante) |
| Embarked | Puerto de embarque (C, Q, S) | string (categórico) |

## Inspección profunda con info()

```python
print(df.info())
```

Salida:

```
<class 'pandas.core.frame.DataFrame'>
RangeIndex: 891 entries, 0 to 890
Data columns (total 12 columns):
 #   Column       Non-Null Count  Dtype  
---  ------       --------------  -----  
 0   PassengerId  891 non-null    int64  
 1   Survived     891 non-null    int64  
 2   Pclass       891 non-null    int64  
 3   Name         891 non-null    object 
 4   Sex          891 non-null    object 
 5   Age          714 non-null    float64
 6   SibSp        891 non-null    int64  
 7   Parch        891 non-null    int64  
 8   Ticket       891 non-null    object 
 9   Fare         891 non-null    float64
 10  Cabin        204 non-null    object 
 11  Embarked     889 non-null    object 
dtypes: float64(2), int64(5), object(5)
```

Observaciones clave:
- **Age**: 177 valores faltantes (20%)
- **Cabin**: 687 valores faltantes (77%) — demasiado para rellenar
- **Embarked**: solo 2 valores faltantes — fácil de corregir

## Resumen estadístico

```python
print(df.describe())
```

Esto muestra conteo, media, desviación estándar, mín, cuartiles y máx para todas las columnas numéricas. Observa:
- `Fare` tiene un rango amplio (0 a 512) con un máximo alto — probablemente valores atípicos
- `Age` va de 0.42 (bebé) a 80 años
- `Survived` es binario — una media de 0.38 significa que sobrevivió el 38%

## Distribuciones categóricas

```python
print(df["Sex"].value_counts())
# male      577
# female    314

print(df["Pclass"].value_counts().sort_index())
# 1    216
# 2    184
# 3    491

print(df["Embarked"].value_counts())
# S    644
# C    168
# Q     77
```

## Resumen de valores faltantes

```python
missing = df.isna().sum()
missing_pct = (missing / len(df) * 100).round(1)
print(pd.DataFrame({"count": missing, "percent": missing_pct}).query("count > 0"))
```

Salida:

```
        count  percent
Age       177     19.9
Cabin     687     77.1
Embarked    2      0.2
```

## Observaciones iniciales

Antes de cualquier análisis, anota estos patrones:
1. **Brecha de clase en la supervivencia** — la primera clase probablemente tuvo tasas de supervivencia más altas
2. **Sesgo de género** — la política de "mujeres y niños primero" puede reflejarse en los datos
3. **Edad faltante** — 20% faltante, necesita una estrategia de relleno
4. **Cabin inútil** — 77% faltante, probablemente debería eliminarse
5. **Atípicos en Fare** — algunos pasajeros pagaron mucho más que otros

## Inténtalo

Carga el conjunto de datos del Titanic y responde estas preguntas:
1. ¿Cuántos pasajeros viajaban solos (SibSp == 0 y Parch == 0)?
2. ¿Cuál es la edad promedio de los pasajeros hombres vs. las mujeres?
3. ¿Qué puerto de embarque tuvo la mayor tasa de supervivencia?

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")

alone = ((df["SibSp"] == 0) & (df["Parch"] == 0)).sum()
print(f"Traveling alone: {alone}")

print(df.groupby("Sex")["Age"].mean())

print(df.groupby("Embarked")["Survived"].mean())
```

## Conclusiones clave

- Empieza siempre el EDA con `head()`, `info()` y `describe()` para comprender la estructura
- `value_counts()` revela la distribución de las columnas categóricas
- El análisis de valores faltantes debe ocurrir antes de cualquier decisión de limpieza
- Documenta las observaciones — guían tu plan de análisis completo

## Desafío de práctica

Crea un "informe de calidad de datos" para el conjunto de datos del Titanic: para cada columna, anota el tipo de datos, el número de valores faltantes y un dato interesante (p. ej., "Fare va de 0 a 512"). Este informe guiará tus pasos de limpieza en la próxima lección.
