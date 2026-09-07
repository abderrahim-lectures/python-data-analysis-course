---
title: "Limpiador de Datos con IA"
description: "Detecta y corrige automáticamente problemas de calidad de datos — valores faltantes, outliers, duplicados y errores de formato."
difficulty: "intermediate"
estimatedMinutes: 90
xpReward: 100
tags: ["Data Visualization", "Developer Tools", "Pandas"]
prerequisites:
  - "Conceptos básicos de Python (variables, loops, funciones, diccionarios)"
  - "Análisis de Datos con pandas (cargar un CSV, filtrar filas, seleccionar columnas)"
learningObjectives:
  - "Perfilar un DataFrame para detectar valores faltantes, filas duplicadas y tipos inconsistentes sin modificarlo"
  - "Diseñar un pipeline de transformación documentado donde cada cambio quede registrado, no solo aplicado"
  - "Elegir estrategias de relleno sensatas para columnas numéricas frente a columnas de texto"
  - "Detectar outliers con la regla del IQR y recortarlos en lugar de borrar datos"
  - "Normalizar fechas y cadenas para que los valores se comparen limpiamente"
  - "Construir un pipeline de limpieza completo que devuelva un DataFrame limpio más un resumen de auditoría"
---

# 🛠️ 🐼 Construye un Limpiador de Datos con IA

Todo analista ha conocido el mismo dataset: filas duplicadas, celdas en blanco, una columna `price` donde un valor es `"2.5 USD"` y otro es `2.5`, y una fecha de pedido donde unas filas dicen `2024-01-05` y otras `05/01/2024`. Estos problemas ocultan señal real y rompen las herramientas posteriores de formas confusas. Este proyecto construye un limpiador de datos de línea de comandos que toma un CSV desordenado, encuentra esos problemas automáticamente, aplica la corrección adecuada por columna y — la parte que lo hace confiable — registra cada cambio que hace en un registro de auditoría que puedes leer como un recibo.

Esto asume Python 101 y los fundamentos de pandas del módulo de Análisis de Datos — nada más allá. Es opcional y no calificado; consulta [Proyectos del mundo real](/docs/projects) para la lista completa y creciente.

## 🎯 Lo que harás

1. Perfilar un CSV desordenado con pandas y producir un informe de calidad que cubra valores faltantes, duplicados y problemas de tipo — sin modificar los datos.
2. Eliminar filas duplicadas y demostrar exactamente cuántas filas desaparecieron.
3. Rellenar valores faltantes con una estrategia elegida por columna (mediana para números, moda para texto) y registrar la decisión.
4. Encontrar outliers con la regla del IQR y recortarlos a un corredor razonable.
5. Normalizar fechas y cadenas para que `2.5 USD` y `2.5` finalmente se comparen igual.
6. Ensamblar todo en una sola función `clean_dataset()` que devuelva un DataFrame limpio más un diccionario de auditoría legible.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino recomendado — el limpiador es un script determinista de pandas y el flujo de trabajo principal consiste en ejecutarlo contra archivos CSV en tu propio disco, así que un entorno Python real con pandas instalado es exactamente el hogar adecuado para él. La Configuración de abajo recorre `uv` y un entorno virtual.

**GitHub Codespaces** también funciona bien: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) — pandas y `uv` ya están instalados, y cada paso de abajo se ejecuta sin cambios.

**Google Colab, Kaggle Notebooks y Binder son una forma genuinamente buena de ejecutar esto** — a diferencia de los proyectos que necesitan un repositorio git local o un estado real del sistema de archivos, un limpiador de datos solo necesita un CSV en memoria. El notebook de abajo construye un pequeño DataFrame intencionalmente desordenado para que cada detección y corrección se ejecute de verdad; usa un notebook para experimentar rápido, y luego cambia al `uv` local cuando quieras apuntar la herramienta a archivos `.csv` reales en tu máquina.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-data-cleaner/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-data-cleaner/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fai-data-cleaner%2Fnotebook.ipynb)

## Configuración

Todo lo que necesitas antes de escribir una línea del limpiador en sí: un entorno Python con pandas, y un CSV deliberadamente desordenado al que apuntarlo.

### Configura el proyecto

```bash
uv init ai-data-cleaner
cd ai-data-cleaner
uv add pandas
```

`uv` instala Python por ti, crea el proyecto y agrega pandas a su entorno virtual — una sola cadena de comandos en lugar del habitual recorrido "instala Python, instala pip, crea un venv, pip install".

### Crea un CSV desordenado para probar

Esboza un archivo pequeño con los problemas que la herramienta existe para detectar — pégalo en `messy.csv`:

```csv
order_id,customer,units,price,order_date
1,  alice ,2,2.50,2024-01-05
2,alice,,,05/01/2024
1,  alice ,2,2.50,2024-01-05
3,bob,10,2.5 USD,2024-02-01
4,carol,0,1.00,2024-01-31
5,dave,2,0.75,2024/03/15
5,dave,2,0.75,2024/03/15
2,alice,2,3.50,05/01/2024
6,erin,2,4.00,2024-03-20
7,frank,2,3.50,2024-03-22
8,grace,,2.25,2024-03-25
9,henry,1000,9.99,2024-04-01
```

Este único archivo contiene cada modo de falla que el pipeline maneja: dos filas duplicadas exactas, dos valores faltantes de `units`, un `price` faltante, espacio en blanco en un nombre de cliente, un `price` escrito en tres formatos diferentes, un `order_id` duplicado con detalles diferentes (un duplicado de casi-igual), un pedido imposible de cero unidades, un outlier extremo y fechas en tres formatos.

**✅ Lista de verificación**

- ✅ `uv add pandas` termina sin errores.
- ✅ `messy.csv` existe en tu carpeta de proyecto y tiene las trece líneas (encabezado más doce filas de datos) mostradas arriba.

## Paso 1: Perfila el dataset sin tocarlo

La primera pasada de cualquier script de limpieza debe ser *de solo lectura* — no puedes confiar en las correcciones de una herramienta hasta que pueda describir qué está mal, y no puedes describir qué está mal en un dataset que ya has mutilado. El perfilado carga el CSV y luego recorre columna por columna haciendo tres preguntas: cuántos valores faltan, cuántas filas son duplicados exactos y qué dtype tiene realmente cada columna.

### 1.1 Carga y evalúa los datos

**👟 Pista inicial :** Carga `messy.csv` en `df`, imprime su shape, dtypes, la cantidad de valores faltantes por columna y su cantidad de filas duplicadas — todo lecturas, nada de escrituras.

```python
# clean.py
import pandas as pd

df = pd.read_csv("messy.csv")
print("shape:", df.shape)
print("\ndtypes:\n", df.dtypes)
print("\nmissing per column:\n", df.isna().sum())
print("\nduplicate rows:", df.duplicated().sum())
print("\nfirst 3 rows:\n", df.head(3))
```

`df.isna().sum()` devuelve un conteo por columna de celdas faltantes y `df.duplicated().sum()` cuenta las filas que repiten exactamente una fila previa — ambas son lecturas puras que producen los números sobre los que actuará el pipeline. El `head(3)` sobre un frame desordenado es el hábito que detecta problemas incluso antes que los números: en este, ya puedes ver que `price` contiene texto y un nombre con espacios iniciales.

**🎯 Resultado esperado :** Un informe impreso que muestre `shape: (12, 5)`, `price` con tipo `object` (no numérico) por la fila `"2.5 USD"`, exactamente dos valores faltantes en `units`, un valor faltante en `price` y `duplicate rows: 2`.

**🩹 Si sale mal :** Si `price` aparece como `int64`/`float64`, alguien editó el CSV a mano y eliminó la fila `"2.5 USD"` de la que depende la sonda. Si `df` falla al cargar por completo, el CSV tiene un comentario `#` o una línea de encabezado extraviada — abre `messy.csv` y verifica que las primeras dos líneas coincidan exactamente con el encabezado esbozado.

### 1.2 Convierte el perfil en un dict de informe

**👟 Pista inicial :** Extiende el script con `profile(df)` que devuelva un diccionario describiendo los problemas de cada columna, para que los pasos posteriores (y el registro de auditoría) puedan leer los hallazgos como datos en lugar de como texto de terminal.

```python
# clean.py (continued)
from typing import Any

import pandas as pd

def profile(df: pd.DataFrame) -> dict[str, dict[str, Any]]:
    report: dict[str, dict[str, Any]] = {}
    for col in df.columns:
        report[col] = {
            "dtype": str(df[col].dtype),
            "missing": int(df[col].isna().sum()),
            "n_unique": int(df[col].nunique()),
            "issues": [],
        }
        if df[col].dtype == object:
            non_blank = df[col].dropna().astype(str)
            if non_blank.str.strip().ne(non_blank).any():
                report[col]["issues"].append("leading/trailing whitespace")
    return report

print(profile(df))
```

El informe deja de describir problemas en prosa y empieza a describirlos como datos — cada función posterior puede consumir `report[col]["missing"]` y decidir qué hacer. La comprobación de espacios en blanco es la sutil: `.str.strip().ne(itself)` es verdadera para cualquier valor que cambia cuando se eliminan los espacios circundantes.

**🎯 Resultado esperado :** `profile(df)` devuelve un dict en el que `price` figura con `dtype: object`, `units` figura con `missing: 2` y `customer` lista `leading/trailing whitespace` en su lista de issues.

**🩹 Si sale mal :** Si ninguna columna reporta espacios en blanco, el CSV fue vuelto a guardar con comillas incrustadas alrededor de los valores y los espacios finales pasaron a ser parte del texto — comprueba los valores de `df["customer"]` directamente con `.repr()`. Si una columna numérica aparece como `object`, al menos una celda contiene una cadena; la corrección correcta es decidir qué hacer con esa cadena, no forzar el cast aún.

### 1.3 Verifica el perfil

**✅ Lista de verificación**

- ✅ `df.shape` lee `(12, 5)` y `df.duplicated().sum()` lee `2`.
- ✅ `units` reporta dos valores faltantes, `price` reporta un valor faltante y un dtype `object`.
- ✅ `profile(df)` devuelve sus hallazgos como un diccionario que el código posterior puede leer.
- ✅ No aparece ninguna advertencia de pandas sobre `mixed types` al cargar — esa es tu primera señal de deriva.

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué empezar deliberadamente con un perfil de solo lectura en lugar de ir corrigiendo sobre la marcha? ¿Qué pieza específica de información destruye un script ansioso por arreglarlo todo antes de poder quedar registrada?
- `profile()` reporta `n_unique` para cada columna. ¿Qué te diría una columna `customer` con `n_unique` igual a 6 (su cantidad de filas) que `duplicated().sum()` solo podría pasar por alto? Pista: piensa en cómo se ve `customer` después de la corrección de espacios en blanco.

## Paso 2: Elimina duplicados — y cuenta lo que eliminaste

Los duplicados son el problema más barato de resolver, y el que la gente más a menudo corrige a mano ("déjame simplemente borrar las repeticiones obvias"). La versión del pipeline es mejor que una pasada manual porque registra el conteo, así que cualquiera que audite el resultado sabe que se eliminó información — una transparencia que una edición manual en una hoja de cálculo nunca te da.

### 2.1 Elimina duplicados exactos con un recibo

**👟 Pista inicial :** `df.drop_duplicates()` una sola vez, pero captura el conteo de filas antes menos el conteo de filas después en el registro de auditoría antes de que el DataFrame sea mutado.

```python
# clean.py
import pandas as pd

def drop_duplicates(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    before = len(df)
    df = df.drop_duplicates()
    removed = before - len(df)
    return df, {"action": "drop_duplicates", "removed_rows": removed, "before": before, "after": len(df)}

df = pd.read_csv("messy.csv")
df, audit = drop_duplicates(df)
print(audit)
print("rows now:", len(df))
```

Por defecto `drop_duplicates()` conserva la primera aparición de cada fila repetida — determinista, y eso importa, porque el registro de auditoría afirma una cantidad específica de filas eliminadas. Capturar `before` y `after` alrededor de la llamada convierte "creo que eliminé algunas" en un conteo exacto y comprobable.

**🎯 Resultado esperado :** El dict de auditoría reporta `removed_rows: 2` y `rows now:` lee `10`. Las dos filas previamente marcadas por `duplicated()` (la repetición de `order_id` 1 y la repetición de `order_id` 5) desaparecen y el DataFrame aún conserva la primera copia de cada una.

**🩹 Si sale mal :** Si `removed_rows` lee `0`, las filas duplicadas de tu CSV difieren por un carácter invisible (un espacio final en una de ellas) — la normalización de espacios en blanco del Paso 5 debe ejecutarse *antes* de la pasada de duplicados en datos que no autoraste tú. Si la fila 3 (la repetición `1, alice, 2, 2.50`) sobrevive, los valores siguen difiriendo en algún lugar — imprime `df.iloc[[0, 2]]` fila por fila para inspeccionar la diferencia exacta.

### 2.2 Considera qué significa "duplicado"

**👟 Pista inicial :** Explora una comprobación de duplicados *parcial* — `df.drop_duplicates(subset=["order_id"])` — y compara su conteo de eliminados con el conteo de duplicados exactos.

```python
# clean.py (continued)
df_partial = pd.read_csv("messy.csv")
print("exact duplicates:", df_partial.duplicated().sum())
print("duplicates by order_id only:", df_partial.duplicated(subset=["order_id"]).sum())
```

`subset=[...]` cambia la definición de duplicación de "todas las columnas iguales" a "las columnas clave iguales". Los dos números casi siempre discrepan, y elegir la definición correcta es una decisión de negocio, no de código: solo-exacto es seguro, solo-clave es agresivo y puede borrar a dos clientes diferentes que casualmente comparten un ID.

**🎯 Resultado esperado :** El conteo exacto imprime `2`; el conteo con subconjunto `order_id` imprime `3` (las filas 2, 3 y 8 son todas repeticiones de un `order_id` existente), que son más filas de las que un humano probablemente estaba preparado para borrar.

**🩹 Si sale mal :** Si el conteo de subconjunto es igual al exacto, revisa el CSV en busca de un cuarto `order_id` que no intencionaste. Si el enfoque de subconjunto elimina más de lo que te sientes cómodo eliminando, esa reacción es el punto — recurre a `keep="last"` o a una regla explícita cuando los datos valen más que el atajo.

### 2.3 Verifica la pasada de duplicados

**✅ Lista de verificación**

- ✅ La eliminación de duplicados exactos elimina exactamente 2 filas y registra `removed_rows: 2` en un dict de auditoría.
- ✅ Puedes explicar qué cambia cuando se usa `subset=["order_id"]` y por qué eso es más agresivo.
- ✅ El registro de auditoría ahora contiene una entrada cada vez que el DataFrame pierde filas.

**🤔 Pregunta(s) socrática(s)**

- ¿Qué pasaría con la honestidad del registro de auditoría si `drop_duplicates()` eliminara silenciosamente 4 filas en lugar de 2 porque el CSV tuviera dos versiones del mismo cliente con grafías distintas de `price`? ¿En qué punto del pipeline puedes detectar eso antes de que alguien confíe en el archivo limpiado?
- El conteo de subconjunto `3` supera al conteo exacto `2`. ¿Es siempre la versión exacta la respuesta "correcta"? Da un escenario real donde la eliminación basada en subconjunto sea el comportamiento correcto y la versión exacta deje el dataset mal.

## Paso 3: Rellena valores faltantes, columna por columna

Las celdas faltantes se rellenan de forma diferente según qué significa la columna. Un precio numérico al que le falta un valor se estima mejor con la mediana de sus pares; un campo de texto libre faltante (como un segundo nombre) a menudo es mejor dejarlo como un "desconocido" explícito. El trabajo del pipeline es *decidir por columna* y registrar el razonamiento, para que quien lea sepa que `units = 4.0` fue un relleno de mediana y no un valor original.

### 3.1 Rellena los numéricos con la mediana, el texto con la moda

**👟 Pista inicial :** Escribe `fill_missing(df)` que rellene cada columna numérica con su mediana y cada columna de texto con su valor más común, omitiendo cualquier columna que no tenga nada que rellenar.

```python
# clean.py (continued)
def fill_missing(df: pd.DataFrame) -> pd.DataFrame:
    for col in df.columns:
        if df[col].isna().sum() == 0:
            continue
        if pd.api.types.is_numeric_dtype(df[col]):
            df[col] = df[col].fillna(df[col].median())
        else:
            df[col] = df[col].fillna(df[col].mode()[0])
    return df
```

La forma del loop es el patrón: observa una columna, cuenta sus celdas faltantes y actúa solo si el conteo es distinto de cero. Omitir las columnas sin faltantes evita las entradas de auditoría ruidosas que registrarían un "relleno" de nada, e `is_numeric_dtype` mantiene honesta la estrategia — los números reciben una mediana, el texto recibe una moda, y ninguna estrategia se aplica jamás al tipo de columna equivocado.

**🎯 Resultado esperado :** Ejecutar esto sobre el frame al que ya se eliminaron los duplicados establece las dos celdas faltantes de `units` en `2` (la mediana de los valores `[2, 10, 0, 2, 2, 2, 1000]`), y un `price` numérico rellena su celda faltante única con `2.5`.

**🩹 Si sale mal :** Si las celdas faltantes siguen como `NaN` después de la llamada, la ruta de relleno nunca se alcanzó — confirma que `isna().sum()` era realmente distinto de cero para esa columna (las celdas faltantes de `units` viven en las filas de `alice` y `grace`; confirma que se eliminaron los duplicados, no las filas portadoras). Si una columna de texto como `customer` se rellenó con moda-como-mediana y te resulta extraño, ese es el comportamiento correcto aquí — la elección de estrategia solo se comporta mal cuando hay identificadores de por medio, que es lo que aborda el Paso 5.

### 3.2 Registra la decisión en el registro de auditoría

**👟 Pista inicial :** Ahora que el relleno funciona, agrega las entradas de auditoría dentro del loop — una por columna rellenada — nombrando la columna, la estrategia y cuántas celdas se rellenaron, y luego imprime el registro creciente.

```python
# clean.py (continued)
def fill_missing_audited(df: pd.DataFrame, audit: list[dict]) -> pd.DataFrame:
    for col in df.columns:
        n = int(df[col].isna().sum())
        if n == 0:
            continue
        if pd.api.types.is_numeric_dtype(df[col]):
            df[col] = df[col].fillna(df[col].median())
            strategy = f"median ({df[col].median():.2f})"
        else:
            df[col] = df[col].fillna(df[col].mode()[0])
            strategy = f"mode ({df[col].mode()[0]!r})"
        audit.append({"action": "fill_missing", "column": col, "cells_filled": n, "strategy": strategy})
    return df

audit = []
df = pd.read_csv("messy.csv")
df, a1 = drop_duplicates(df)
audit.append(a1)
df = fill_missing_audited(df, audit)
print(*audit, sep="\n")
```

`pd.api.types.is_numeric_dtype(df[col])` es la rama que mantiene honesta la estrategia: los números reciben una mediana, el texto recibe una moda. Cada relleno ahora aterriza en `audit` como una fila con su propia cadena de estrategia, así que el dataset limpio final se entrega con un documento complementario de exactamente qué se inventó y por qué.

**🎯 Resultado esperado :** Una entrada de relleno de `units` que lea `"median (2.00)"` con `cells_filled: 2`, más una entrada de relleno de `price` que use la estrategia `mode` — que esté presente con una estrategia de texto es la señal de que `price` *sigue siendo texto en este punto*, que es precisamente el bug de orden que el pipeline completo evita normalizando formatos primero (Paso 5).

**🩹 Si sale mal :** Si la entrada de `price` inexplicablemente muestra una estrategia de estilo numérico, ejecutaste el relleno después de convertir `price` fuera de orden — bien como resultado, pero ten en cuenta que la demo depende de texto-por-dentro-texto-por-fuera. Si las celdas se rellenan pero la auditoría nunca las contiene, el append a la lista está dentro de la rama `if` equivocada o la función retornó sin hacer el append.

### 3.3 Verifica la pasada de relleno

**✅ Lista de verificación**

- ✅ Las columnas numéricas se rellenan con su mediana; las columnas de texto con su moda.
- ✅ Existe una entrada de auditoría por columna rellenada, cada una nombrando estrategia y cantidad de celdas.
- ✅ Las columnas sin faltantes no producen ninguna entrada de auditoría.

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué es defendible rellenar `units` con la mediana mientras que rellenar `order_id` con la mediana es un sinsentido? ¿Qué información transporta el dtype que la función de relleno necesita respetar?
- La auditoría almacena la cadena de *estrategia*, no solo la acción. ¿Qué pregunta futura te permite responder que una auditoría de solo `action: fill_missing` no podría?

## Paso 4: Detecta outliers con la regla del IQR

Un valor de `units` de `1000` junto a pares de `0` y `2` es casi con certeza un error tipográfico, pero borrarlo a ciegas pierde las otras columnas de la fila. La regla del IQR encuentra el corredor de valores razonables — cualquier cosa más de `1.5 × IQR` por debajo del primer cuartil o por encima del tercero — y *recorta* a los infractores al límite del corredor, preservando la fila mientras neutraliza la distorsión.

### 4.1 Calcula el corredor y marca a los infractores

**👟 Pista inicial :** Para las columnas numéricas de un frame, calcula `Q1`, `Q3` e `IQR`, y luego lista cada fila fuera de `[Q1 - 1.5*IQR, Q3 + 1.5*IQR]`.

```python
# clean.py (continued)
def flag_outliers(df: pd.DataFrame, columns: list[str]) -> dict[str, list]:
    outliers: dict[str, list] = {}
    for col in columns:
        if not pd.api.types.is_numeric_dtype(df[col]):
            continue
        q1, q3 = df[col].quantile([0.25, 0.75])
        iqr = q3 - q1
        lo, hi = q1 - 1.5 * iqr, q3 + 1.5 * iqr
        found = df[(df[col] < lo) | (df[col] > hi)]
        if len(found):
            outliers[col] = [found.index.tolist(), round(lo, 2), round(hi, 2)]
    return outliers

df = pd.read_csv("messy.csv")
df, _ = drop_duplicates(df)
print(flag_outliers(df, ["units", "price"]))
```

`df[col].quantile([0.25, 0.75])` devuelve ambos cuartiles en una sola llamada, y la máscara booleana `(df[col] < lo) | (df[col] > hi)` selecciona las filas fuera del corredor — fíjate en el operador `|`, no `or`, porque pandas necesita máscaras combinadas elemento por elemento, y el `or` de Python las colapsa en un único valor de verdad.

**🎯 Resultado esperado :** La función reporta `units` con una fila outlier (el valor `1000` en el índice original `11`) dentro de un corredor de aproximadamente `(-1.0, 7.0)` — y `price` se omite por completo porque en este punto sigue siendo texto y la rama numérica correctamente se niega a juzgarlo.

**🩹 Si sale mal :** Si cada columna reporta no-outliers, la guarda numérica te está omitiendo silenciosamente — un dtype `object` produce una máscara vacía bajo esta regla, razón por la cual `price` no muestra nada a propósito; ejecuta esto *después* del paso de normalización de `price` y la guarda finalmente lo dejará pasar. Si aparece `ValueError: The truth value of a Series is ambiguous`, usaste `or` donde se requiere `|`.

### 4.2 Recorta en lugar de borrar

**👟 Pista inicial :** Reemplaza los valores infractores con `Series.clip(lower=lo, upper=hi)` y registra tanto el valor antiguo como el nuevo en el registro de auditoría — el caso raro donde el registro almacena un par antes/después.

```python
# clean.py (continued)
def clip_outliers(df: pd.DataFrame, columns: list[str], audit: list[dict]) -> pd.DataFrame:
    for col in columns:
        if not pd.api.types.is_numeric_dtype(df[col]):
            continue
        q1, q3 = df[col].quantile([0.25, 0.75])
        lo, hi = q1 - 1.5 * (q3 - q1), q3 + 1.5 * (q3 - q1)
        mask = (df[col] < lo) | (df[col] > hi)
        clipped = df.loc[mask, col].tolist()
        df[col] = df[col].clip(lower=lo, upper=hi)
        if clipped:
            audit.append({"action": "clip_outlier", "column": col, "from": clipped, "to": round(hi, 2)})
    return df

audit = []
df = pd.read_csv("messy.csv")
df, _ = drop_duplicates(df)
df = clip_outliers(df, ["units", "price"], audit)
print(*audit, sep="\n")
```

`clip(lower=lo, upper=hi)` empuja cada valor dentro del corredor en una sola llamada vectorizada — sin loops, y conserva `1000` como `7.0` en lugar de borrar los otros cuatro campos de la fila. Almacenar la lista `from` junto con `to` hace que el registro de auditoría sea un paso mejor que la mayoría de los logs de producción: puede responder "¿qué cambiamos realmente para esta fila?" en lugar de solo "¿qué tocamos?".

**🎯 Resultado esperado :** El `1000` en `units` se convierte en `12.0`, y aparece una entrada de auditoría `{"action": "clip_outlier", "column": "units", "from": [1000], "to": 7.0}`. La columna `price` se omite mientras sea texto y permanece intacta.

**🩹 Si sale mal :** Si no ocurre ningún recorte a pesar de un `1000` claro, confirma que la conversión numérica del Paso 5 se ejecutó primero. Si la entrada de auditoría registra un recorte pero el DataFrame aún muestra `1000`, se eliminó la asignación `df[col] = df[col].clip(...)` y estás imprimiendo el frame previo al recorte.

### 4.3 Verifica la pasada de outliers

**✅ Lista de verificación**

- ✅ `units = 1000` se recorta a `7.0` y las otras columnas de la fila se preservan.
- ✅ El registro de auditoría registra un par antes/después para el valor recortado.
- ✅ Puedes explicar por qué recortar es mejor que borrar toda la fila aquí.

**🤔 Pregunta(s) socrática(s)**

- El corredor oculta un juicio: `1.5` es convención, no ley. ¿Qué pasaría con `units` si usaras `3.0` en su lugar? ¿Qué tipo de datos se sentarían *legítimamente* fuera del corredor de `1.5` y serían aplanados incorrectamente por esta regla?
- ¿Por qué recortar en lugar de eliminar la fila? ¿Qué información sobrevive en la fila que de otro modo se perdería, y en qué análisis posterior esa supervivencia importa de verdad?

## Paso 5: Normaliza formatos para que los valores se comparen limpiamente

La columna numérica contiene `"2.5 USD"` junto a `3.00`, y las fechas usan `2024-01-05`, `05/01/2024` y `2024/03/15` en la misma columna. Un `mean()` sobre cualquiera de las dos columnas falla o miente hoy. La normalización de formatos obliga a cada valor a tomar una sola forma — un float para `price`, un `datetime.date` para fechas, texto recortado para nombres — y este paso es *la razón* por la que los rellenos y las comprobaciones de outliers anteriores empezaron a funcionar sobre el frame.

### 5.1 Convierte price a una única forma numérica

**👟 Pista inicial :** Escribe `normalize_price(series)` que elimine el ruido no numérico, fuerce el resultado y reporte cada celda que no pudo convertir como un problema aparte.

```python
# clean.py (continued)
import pandas as pd

def normalize_price(s: pd.Series) -> tuple[pd.Series, list[str]]:
    cleaned = s.astype(str).str.replace(r"[^\d.]", "", regex=True)
    converted = pd.to_numeric(cleaned, errors="coerce")
    undecodable = s[converted.isna() & s.notna()].tolist()
    return converted, [str(v) for v in undecodable]

df = pd.read_csv("messy.csv")
df, _ = drop_duplicates(df)
p, stuck = normalize_price(df["price"])
df["price"] = p
print(df["price"].tolist())
print("could not convert:", stuck)
```

La regex `[^\d.]` elimina todo lo que no sea un dígito o un punto decimal — esa es la anchura del hacha aquí, y es honesta: maneja `"2.5 USD"`, pero también destruiría un valor de moneda genuinamente diferente como `"2,50€"`. `errors="coerce"` convierte todo lo que sigue siendo imposible de analizar en `NaN` en lugar de fallar, y esas celdas sobrantes se exponen como la lista `stuck` para que el pipeline nunca queme silenciosamente un valor que no pudo leer.

**🎯 Resultado esperado :** `df["price"]` se convierte en `[2.5, nan, 2.5, 1.0, 0.75, 3.5, 4.0, 3.5, 2.25, 9.99]` — la celda `"2.5 USD"` ahora es un float — y `stuck` está vacío para este CSV.

**🩹 Si sale mal :** Si un valor sobrevive como `"2.5 USD"`, la regex `[^\d.]` no se ejecutó sobre esa fila porque la serie contenía algo que no es una cadena (una celda ya numérica) — fuerza con `.astype(str)` primero como se muestra. Si `stuck` no está vacío, tu CSV tiene un valor que la regex mutiló en lugar de limpiar — decide una regla por moneda y extiende la regex deliberadamente, o deja la fila marcada en lugar de borrarla.

### 5.2 Normaliza fechas y texto en una sola pasada

**👟 Pista inicial :** Entrega las fechas con `pd.to_datetime(..., format="mixed")` y recorta las columnas de texto, añadiendo notas de limpieza a la creciente lista de auditoría.

```python
# clean.py (continued)
def normalize_formats(df: pd.DataFrame, audit: list[dict]) -> pd.DataFrame:
    for col in df.columns:
        if df[col].dtype == object and "date" in col.lower():
            before = df[col].nunique()
            df[col] = pd.to_datetime(df[col], format="mixed")
            audit.append({"action": "normalize_date", "column": col, "unique_before": before, "dtype": str(df[col].dtype)})
        elif df[col].dtype == object:
            stripped = df[col].astype(str).str.strip().astype("string")
            if stripped.ne(df[col].astype(str)).any():
                audit.append({"action": "strip_text", "column": col})
            df[col] = stripped
    return df

df = pd.read_csv("messy.csv")
_, a1 = drop_duplicates(df)
audit = [a1]
df = normalize_formats(df, audit)
print(df[["order_date", "customer"]])
print(*audit, sep="\n")
```

`fast-date` gana aquí la carrera mientras conserva las tres formas de entrada: `format="mixed"` permite que pandas adivine por celda en lugar de insistir en que un único formato describa cada fila. El `astype("string")` al final usa el propio tipo de cadena anulable de pandas, así que una columna recortada deja de almacenar silenciosamente `NaN` como el tipo float y registra la falta con honestidad.

**🎯 Resultado esperado :** `order_date` se imprime como una única columna `datetime64` consistente, `customer` muestra `alice`, `bob`, `carol`, `dave`, `erin`, `frank`, `grace`, `henry` sin espacios circundantes, y la auditoría gana entradas `normalize_date` y `strip_text`.

**🩹 Si sale mal :** Si el análisis `Mixed format` lanza una excepción, una celda contiene una ambigüedad real como `02/03/2024` donde mes y día podrían intercambiarse — `format="mixed"` lo mantiene analizable pero eligió silenciosamente una lectura; fija el formato con `format="%d/%m/%Y"` cuando conozcas tus datos. Si las columnas de texto se ven recortadas en la salida de pantalla pero conservan espacios en el frame, el DataFrame no se reasignó desde `stripped`.

### 5.3 Verifica la pasada de normalización

**✅ Lista de verificación**

- ✅ `price` es una única columna numérica; `stuck` no reporta nada ilegible.
- ✅ Todas las celdas de `order_date` son un solo dtype `datetime64`, sea cual sea su grafía original.
- ✅ Las columnas de texto están recortadas y almacenadas con el dtype `string` de pandas.
- ✅ Existen entradas de auditoría para cada normalización que realmente cambió datos.

**🤔 Pregunta(s) socrática(s)**

- La regex `[^\d.]` convierte `"2.5 USD"` limpiamente — pero ¿qué hace con un valor como `"2,500.00"` de una localidad que usa separadores de miles? ¿Qué dice eso sobre reemplazar una decisión humana con una regex?
- Después de la normalización, pueden aparecer duplicados que no existían antes (dos filas cuyos precios eran `"2.5 USD"` y `2.5`). ¿Por qué deberían compartir la eliminación de duplicados y la normalización de formatos una sola pasada final en lugar de ser dos etapas separadas?

## Paso 6: Ensambla el pipeline completo con su registro de auditoría

Cada pieza hasta ahora corrige un problema de forma aislada; el pipeline las conecta en un orden que tiene sentido — perfila, luego normaliza formatos, luego elimina duplicados (ahora confiable), luego rellena por columna, luego recorta outliers — y devuelve un DataFrame limpio *más* la lista de auditoría completa como un registro serializable a JSON.

### 6.1 Escribe `clean_dataset(path)`

**👟 Pista inicial :** Compón las funciones en orden de dependencia dentro de `clean_dataset(path)` que devuelva `(clean_df, audit)` y agrega un bloque `__main__` que imprima ambos; asegúrate de que cualquier función que falle lance un error claro que nombre la columna en la que estaba.

```python
# clean.py (final -- every helper from Steps 1-5 now lives in this same file)
import json

import pandas as pd

def clean_dataset(path: str) -> tuple[pd.DataFrame, list[dict]]:
    df = pd.read_csv(path)
    report = profile(df)
    if not report:
        raise ValueError(f"Cannot profile {path} -- is the file empty?")
    audit: list[dict] = [{"action": "profile", "issues": report}]
    df = normalize_formats(df, audit)
    price, _stuck = normalize_price(df["price"])
    df["price"] = price
    df, a = drop_duplicates(df)
    audit.append(a)
    df = fill_missing_audited(df, audit)
    df = clip_outliers(df, ["units", "price"], audit)
    return df, audit
if __name__ == "__main__":
    clean, trail = clean_dataset("messy.csv")
    print(clean)
    print("\naudit:\n", json.dumps(trail, indent=2, default=str))
```

El orden codifica juicio, no hábito: los formatos se normalizan *primero* para que la pasada de duplicados vea valores comparables, y el recorte de outliers corre *al final* para operar sobre datos rellenados y numéricos. Fallar rápido dentro de `clean_dataset` con `raise ValueError(...)` es mejor que entregar un archivo medio limpiado en silencio que una hoja de cálculo revele solo después. El único `json.dumps(trail, indent=2, default=str)` imprime la auditoría como un recibo legible.

**🎯 Resultado esperado :** Un frame limpio impreso con exactamente 10 filas (12 menos los dos duplicados), `price` numérico, nombres recortados, fechas uniformes, `units` y `price` rellenados con mediana, un `units` outlier recortado a `7.0` y una lista de auditoría que contiene cada acción que tomó el pipeline, en orden de ejecución.

**🩹 Si sale mal :** Si aparece un `KeyError: 'price'`, la columna de precio del CSV no se llama `price` — el pipeline codifica un solo nombre; conviértelo en un parámetro `column` cuando los datos discrepen. Si la eliminación de duplicados borra más de `2` filas en el pipeline completo, una pasada de normalización fusionó dos cadenas previamente distintas — compara qué filas desaparecieron re-ejecutando sobre el archivo original.

### 6.2 Verifica todo el pipeline

**✅ Lista de verificación**

- ✅ `clean_dataset("messy.csv")` devuelve un frame limpio con 10 filas y columnas tipadas.
- ✅ La lista de auditoría contiene entradas en orden: perfil, normalización de formatos, eliminación de duplicados, relleno de valores faltantes, recorte de outliers.
- ✅ Puedes reconstruir a partir de la auditoría exactamente en qué se cambió cada valor original.

**🤔 Pregunta(s) socrática(s)**

- El pipeline ejecuta la normalización de formatos antes de la eliminación de duplicados. Rastrea qué pasaría si intercambiaras esas dos etapas en el `messy.csv` original: ¿qué filas sobreviven y qué decisión sobre `price` ahora es diferente?
- `clean_dataset` devuelve una lista fija de columnas numéricas para el recorte. ¿Qué cambiarías en la firma de la función para que siga siendo correcta en un dataset sin columna `price` — una lista de columnas específica o una regla? ¿En cuál confías para que la mantenga un compañero de equipo?

## ⚠️ Errores comunes

- **Corregir datos antes de poder describirlos.** Un script que imputa y recorta al cargar destruye la evidencia de que una corrección era necesaria — perfila primero, siempre, y conserva ese primer informe en la auditoría.
- **Rellenar identificadores con estadísticas.** Rellenar `order_id` con la mediana o `timestamp` con la moda produce valores que parecen reales y no significan nada. Restringe los rellenos por dtype y por una allowlist de columnas.
- **Borrar en lugar de recortar.** Eliminar filas outliers pierde silenciosamente las columnas no outliers de esas filas. Cuando un campo es absurdo pero el resto es confiable, recorta el campo.
- **Exceso de la regex en formatos.** Una limpieza `[^\d.]` convierte `"2,500.00"` y `"2.50€"` en números sorprendentes. Expón los valores irrecuperables mediante una lista `stuck` en lugar de fingir que la regex los entendió.
- **Transformaciones rastreables a medias.** Datos limpios sin registro de auditoría son indistinguibles de datos que estaban mal desde el principio. Cada mutación — drop, relleno, recorte, normalización — es una acción auditable, y este pipeline la trata como tal.

## Lo que acabas de construir

Un CLI de limpieza de datos funcional: carga un CSV genuinamente desordenado, reporta qué está mal antes de tocar una celda y luego corrige duplicados, valores faltantes, outliers y caos de formato en un orden deliberado — devolviendo tanto un DataFrame limpio como una auditoría completa de cada cambio. La habilidad transferible aquí sobrevive a la herramienta: el hábito de registrar cada transformación como datos, para que un dataset limpiado siempre pueda responder "¿qué me hiciste y por qué?".

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/ai-data-cleaner/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-data-cleaner) en el repositorio del curso es el mismo pipeline empaquetado para un notebook, con los pasos de perfilado y auditoría impresos en cada etapa. Clónalo, o abre todo el repositorio en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde ahí.
:::

## A dónde ir desde aquí

- Convierte la lista `stuck` en un punto de decisión: una bandera `--strict` que *se niegue a escribir salida* mientras haya algún valor irrecuperable, para que el pipeline no pueda entregar un archivo que no entendió por completo.
- Agrega manejo de espacios en blanco de ventana completa y codificaciones mixtas con la opción `--encoding` de argparse, y normaliza archivos UTF-8 BOM que pandas lee mal en silencio.
- Alimenta el registro de auditoría al módulo de [Visualización de Datos](/docs/projects) del curso: renderiza un gráfico de barras de issues por columna y estrategia para que un humano pueda aprobar los rellenos de un vistazo.
- Apunta el pipeline a la API del proyecto [Panel de Calidad del Aire](/projects/air-quality) y limpia las respuestas de `/api` antes de que lleguen a tus gráficos.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓