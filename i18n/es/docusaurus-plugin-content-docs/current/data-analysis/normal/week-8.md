---
title: "Semana 8: Limpieza de Datos"
sidebar_position: 3
section: data-analysis
track: normal
week: 8
description: "Limpia datos del mundo real con pandas: maneja valores faltantes, corrige tipos de datos y trabaja con columnas de texto."
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Semana 8: Limpieza de Datos

<span className="gamified-flourish">🧹 Los datasets reales son desordenados. Esta semana se trata de hacer que un dataset sea confiable antes de analizarlo.</span>

## 🎯 Objetivos de aprendizaje

Al final de esta semana podrás:
- Detectar y manejar valores faltantes con `.isna()`, `.dropna()` y `.fillna()`.
- Encontrar y eliminar filas duplicadas.
- Convertir explícitamente el dtype de una columna con `.astype()` y `pd.to_numeric()`.
- Usar los métodos del accesor `.str` para limpiar columnas de texto.
- Aplicar una función personalizada a una columna con `.apply()` cuando ningún método incorporado encaje.

## Lección

### Valores faltantes

Pandas representa "sin valor" como `NaN` (Not a Number) para columnas numéricas. `.isna()` devuelve una máscara booleana de dónde faltan valores — la misma idea de máscara booleana de la semana pasada, aplicada a una pregunta distinta:

```python
df.isna()             # True/False por celda
df.isna().sum()        # conteo de valores faltantes por columna
```

Dos estrategias para manejarlos:

```python
df.dropna()                     # elimina cualquier fila con al menos un valor faltante
df.dropna(subset=["quiz1"])      # elimina filas solo si falta específicamente quiz1
df.fillna(0)                     # reemplaza todos los NaN con 0
df["quiz1"].fillna(df["quiz1"].mean())   # reemplaza con la media de la columna — un valor por defecto común
```

No hay una elección universalmente "correcta" — eliminar una fila pierde por completo los otros datos de ese estudiante, mientras que rellenar con una media puede distorsionar las estadísticas si hay muchos datos faltantes. Cuál es apropiada depende de *por qué* faltan los datos y de cuántos hay, una decisión de criterio que practicarás a lo largo del marco de EDA del track Difícil.

### Filas duplicadas

Los datasets reales a veces contienen el mismo registro más de una vez — un error de captura de datos, o un archivo que se fusionó consigo mismo por accidente:

```python
df.duplicated()             # True/False por fila — ¿es esta una repetición exacta de una fila anterior?
df.duplicated().sum()        # cuántas filas duplicadas existen
df = df.drop_duplicates()     # conserva solo la primera aparición de cada grupo de duplicados
```

`.duplicated(subset=["name"])` restringe la comprobación a columnas específicas — útil cuando dos filas no deberían existir ambas para el mismo *estudiante*, aunque alguna otra columna (como una marca de tiempo) resulte ser distinta entre ellas.

### Convertir dtypes

`pd.read_csv` a veces infiere el dtype incorrecto — una columna de números almacenada como texto si aunque sea una fila tiene un carácter extraviado, por ejemplo. `.astype()` convierte explícitamente:

```python
df["quiz1"] = df["quiz1"].astype(int)
df["quiz1"] = pd.to_numeric(df["quiz1"], errors="coerce")   # los valores inválidos se vuelven NaN en lugar de fallar
```

`pd.to_numeric(..., errors="coerce")` suele ser más seguro que `.astype(int)` para datos reales desordenados: en lugar de lanzar un error en el momento en que encuentra algo que no se puede convertir, silenciosamente convierte ese valor en `NaN`, que luego puedes manejar con las herramientas de arriba.

### Limpiar texto con `.str`

Las columnas de string tienen su propio accesor, `.str`, que expone versiones vectorizadas de métodos de string conocidos — el equivalente en pandas de `.lower()`/`.strip()` de Python 101, aplicado a una columna entera de una vez:

```python
df["name"] = df["name"].str.strip()          # elimina espacios en blanco al inicio/final
df["name"] = df["name"].str.lower()           # minúsculas, misma razón que tokenize() de Python 101
df["name"].str.contains("amina")               # máscara booleana: ¿cada nombre contiene "amina"?
df["name"] = df["name"].str.replace("amina", "Amina")   # buscar y reemplazar dentro de cada valor
df["first_name"] = df["name"].str.split(" ").str[0]      # divide cada nombre, conserva la primera parte
```

`.str.split(" ")` produce una Series donde cada valor es a su vez una *lista* de partes; un segundo `.str[0]` entonces entra en cada una de esas listas y extrae el primer elemento — encadenar operaciones `.str` así es un patrón común cuando un solo método de string no basta del todo.

### Cuando ningún método incorporado encaja: `.apply()`

Para una transformación que no tiene un método `.str`/numérico ya hecho, `.apply()` ejecuta cualquier función que elijas sobre cada valor de una columna:

```python
def grade_letter(score):
    if score >= 90:
        return "A"
    elif score >= 80:
        return "B"
    elif score >= 70:
        return "C"
    else:
        return "F"

df["quiz1_grade"] = df["quiz1"].apply(grade_letter)
```

Esto es genuinamente solo las funciones de Python 101 otra vez — `grade_letter` es una función ordinaria, y `.apply()` es lo que la ejecuta una vez por valor, el equivalente con sensación vectorizada de recorrer la columna tú mismo con un bucle y llamar a `grade_letter` en cada valor a mano.

## ⚠️ Errores comunes

- **Llamar a `.fillna()`/`.dropna()` sin reasignar.** Como la mayoría de las operaciones de pandas, estas devuelven por defecto una Series/DataFrame *nueva* — `df.fillna(0)` solo no cambia `df`; necesitas `df = df.fillna(0)` (o `inplace=True`).
- **Rellenar valores faltantes antes de entender por qué faltan.** Un `df.fillna(0)` general sobre una columna de calificaciones podría convertir silenciosamente "este estudiante estuvo ausente" en "este estudiante sacó cero", que son hechos muy diferentes.
- **Olvidar que los duplicados pueden ser *parciales*, no solo exactos.** `.duplicated()` sin `subset` solo marca filas que coinciden exactamente en *todas* las columnas — dos filas del mismo estudiante con un error tipográfico en una columna no serán detectadas sin restringir la comprobación.
- **Usar `.apply()` cuando ya existe un método vectorizado.** `.apply()` ejecuta tu función de Python una vez por fila, lo cual es más lento que un método vectorizado incorporado como `.str.lower()` haciendo el mismo trabajo en código optimizado — recurre a `.apply()` solo cuando nada incorporado encaja.

## 🧩 Retos

<Challenge id="dataanalysis-normal-w8-c1" answer={<><code>df.isna().sum()</code> — un número por columna, el conteo de valores faltantes (NaN) en esa columna.</>}>

Carga `students-normal.csv` e imprime cuántos valores faltantes tiene cada columna.

</Challenge>

<Challenge id="dataanalysis-normal-w8-c2" answer={<>Introduce un NaN manualmente primero (p. ej. <code>df.loc[0, "quiz1"] = None</code>), y luego compara <code>df.dropna(subset=["quiz1"])</code> (menos filas) con <code>df["quiz1"].fillna(df["quiz1"].mean())</code> (mismo conteo de filas, valor faltante reemplazado) para ver directamente la diferencia en el conteo de filas.</>}>

Establece manualmente un valor de `quiz1` como faltante (p. ej. `df.loc[0, "quiz1"] = None`), y luego compara el conteo de filas resultante después de `.dropna(subset=["quiz1"])` frente a después de `.fillna(df["quiz1"].mean())`.

</Challenge>

<Challenge id="dataanalysis-normal-w8-c3" answer={<><code>df["name"].str.lower()</code> convierte toda la columna a minúsculas en una sola llamada, de forma vectorizada — equivalente a recorrerla con un bucle y llamar a <code>.lower()</code> en cada nombre individualmente, pero sin escribir el bucle.</>}>

Convierte a minúsculas cada valor de la columna `name` usando `.str`, sin escribir un bucle manual.

</Challenge>

<Challenge id="dataanalysis-normal-w8-c4" answer={<><code>df["name"].str.contains("a")</code> devuelve una máscara booleana; envuélvela en <code>df[...]</code> para obtener solo las filas coincidentes, o llama a <code>.sum()</code> sobre la máscara para simplemente contarlas.</>}>

Usando `.str.contains(...)`, encuentra cuántos estudiantes tienen la letra "a" en cualquier parte de su nombre.

</Challenge>

<Challenge id="dataanalysis-normal-w8-c5" answer={<>Duplica una fila primero (p. ej. pd.concat([df, df.iloc[[0]]])), luego ejecuta .duplicated().sum() para confirmar que se detecta al menos un duplicado, y .drop_duplicates() para eliminarlo, comprobando df.shape antes y después para confirmar que el conteo de filas bajó en uno.</>}>

Duplica manualmente una fila del DataFrame (agrega una copia de una fila existente), confirma que `.duplicated()` la detecta, y luego elimínala con `.drop_duplicates()`.

</Challenge>

<Challenge id="dataanalysis-normal-w8-c6" answer={<>Escribe una función como grade_letter que devuelva "Pass" si la calificación es &gt;= 60 y "Fail" en caso contrario, y luego aplícala: df["quiz1_result"] = df["quiz1"].apply(pass_fail).</>}>

Escribe tu propia función que tome una calificación y devuelva `"Pass"` o `"Fail"` según un umbral del 60%, y luego usa `.apply()` para agregar una nueva columna `quiz1_result` construida a partir de ella.

</Challenge>

## 🤔 Preguntas socráticas

- `.dropna()` y `.fillna(mean)` dan conteos finales de filas y estadísticas finales distintas. Para un dataset donde el 40% de los valores de una columna faltan, ¿qué elección crees que es más probable que engañe a alguien que lea tus estadísticas resumen, y por qué?
- `pd.to_numeric(col, errors="coerce")` convierte silenciosamente los valores incorrectos en `NaN` en lugar de fallar. ¿Es "silencioso" realmente algo bueno aquí? ¿Qué podría salir mal si ejecutaras esto en una columna y nunca comprobaras `.isna().sum()` después?
- ¿Por qué las columnas de string necesitan un accesor `.str` separado (`df["name"].str.lower()`) en lugar de simplemente `df["name"].lower()`? ¿Qué significaría siquiera `.lower()` si se llamara directamente sobre una Series entera en lugar de un solo string?
- `.duplicated()` sin argumento `subset` solo detecta filas que coinciden en *todas* las columnas. ¿Se te ocurre un escenario realista en este dataset donde dos filas representen al mismo estudiante real pero no serían detectadas por una comprobación de duplicados de coincidencia exacta?
- `.apply()` puede ejecutar *cualquier* función de Python, incluyendo aquellas con efectos secundarios (como imprimir, o escribir en un archivo) — no solo las que devuelven un valor transformado. ¿Por qué podría ser mala idea ejecutar código con efectos secundarios dentro de `.apply()`, dado que no controlas exactamente cuántas veces ni en qué orden podría pandas llamar internamente a tu función?

## ✅ Cuestionario semanal

<WeeklyQuiz
  weekId="data-analysis-normal-week-8"
  questions={[
    {
      id: 'q1',
      prompt: '¿Qué método cuenta los valores faltantes por columna?',
      options: ['df.count()', 'df.isna().sum()', 'df.dropna()', 'df.fillna()'],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: '¿Qué hace pd.to_numeric(col, errors="coerce") con un valor que no puede convertir?',
      options: [
        'Lanza una excepción inmediatamente',
        'Lo convierte en NaN',
        'Lo deja como el string original',
        'Elimina esa fila',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q3',
      prompt: '¿Por qué usar df["col"].str.lower() en lugar de df["col"].lower()?',
      options: [
        'Son idénticos, solo es distinto estilo',
        '.str es necesario para aplicar métodos de string elemento a elemento a través de una Series',
        '.lower() solo funciona en DataFrames, no en Series',
        '.str.lower() es más rápido para columnas numéricas',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'df.dropna(subset=["quiz1"]) elimina filas donde:',
      options: [
        'A cualquier columna le falta un valor',
        'Específicamente a quiz1 le falta un valor',
        'quiz1 está por debajo de 60',
        'Al índice de la fila le falta un valor',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q5',
      prompt: '.apply() sobre una Series se usa mejor cuando:',
      options: [
        'Siempre quieres el máximo rendimiento',
        'Ningún método vectorizado incorporado ya hace lo que necesitas',
        'Estás trabajando con un DataFrame, nunca con una Series',
        'La columna contiene solo números',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="data-analysis-normal-week-8" />
