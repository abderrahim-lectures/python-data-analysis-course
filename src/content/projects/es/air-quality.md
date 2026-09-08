---
title: "Panel de Calidad del Aire"
description: "Carga una semana de lecturas de PM2.5 (en vivo cuando es accesible, si no una muestra realista), convierte concentraciones crudas en valores AQI de la EPA con una fórmula por tramos, identifica la peor hora y genera un informe de texto además de una gráfica."
difficulty: "intermediate"
estimatedMinutes: 90
xpReward: 100
tags: ["Environment", "APIs", "Data Visualization"]
prerequisites:
  - "Fundamentos de datos ordenados: DataFrames, dtypes, describir una columna"
  - "Aplicar una función de Python a cada fila de un DataFrame"
  - "Agrupar y contar con pandas"
learningObjectives:
  - "Cargar un conjunto de datos ordenado e indexado por tiempo e inspeccionar su forma y sus dtypes"
  - "Traducir concentraciones crudas de PM2.5 a números AQI de la EPA con una fórmula por tramos (puntos de ruptura)"
  - "Etiquetar cada hora con una categoría y encontrar las lecturas peor y mejor"
  - "Agregar lecturas por hora a lo largo de una semana e imprimir un informe de salud en lenguaje sencillo"
  - "Graficar el AQI por hora contra los umbrales de categoría y guardar la figura en disco"
---

# 🛠️ 🌬️ Construye un Panel de Calidad del Aire

La calidad del aire es un problema de cálculo numérico escondido tras un flujo de sensores. Este proyecto toma una semana de lecturas de PM2.5 — pequeñas partículas en suspensión que son el contaminante urbano más común — convierte cada concentración por hora en un valor de Índice de Calidad del Aire (AQI) de la EPA, agrupa esos valores en categorías de salud y produce las dos cosas que un ciudadano preocupado realmente quiere: un informe en lenguaje sencillo ("el martes en la noche fue el peor tramo") y una gráfica que muestra la semana de un vistazo. Los datos son reales en forma y honestos en origen: el proyecto intenta obtener lecturas en vivo de una API pública y, si falla, usa una muestra determinista que puedes reproducir hasta el decimal, así que tus números reportados siempre son verificables.

Esto asume conocimientos básicos de datos ordenados y nada de esto es calificado; es opcional y no calificado — consulta [Proyectos del mundo real](/es/proyectos) para la lista completa y creciente.

## 🎯 Lo que harás

1. Cargar una semana ordenada de lecturas de PM2.5 en un DataFrame y verificar su forma y sus dtypes.
2. Escribir la fórmula de puntos de ruptura de la EPA que convierte concentración en un AQI de número entero.
3. Etiquetar cada hora con una categoría, y encontrar la peor hora y la mejor hora de la semana.
4. Agregar la semana a un informe de texto legible con consejos de salud.
5. Graficar el AQI medio por hora contra las líneas de umbral seguro y guardar un PNG.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino recomendado: este proyecto vive y muere con pandas + matplotlib, ambos a un `uv add` de distancia, y el `aqi_week.png` guardado aterriza en tu propio disco.

**Google Colab, Kaggle Notebooks y Binder** son de primera clase aquí — pandas y matplotlib vienen preinstalados en cada uno, `!pip install requests` cubre el envoltorio de la obtención en vivo y `matplotlib.use("Agg")` del Paso 5 mantiene el graficado compatible con entornos sin pantalla. Los notebooks encajan muy bien si tu máquina del curso no tiene Python local; solo recuerda que cualquier dato de API en vivo cambiará entre sesiones, que es exactamente para lo que sirve la muestra determinista.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/air-quality/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/air-quality/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fair-quality%2Fnotebook.ipynb)

## Configuración

Todo lo necesario antes de que el panel funcione: un proyecto con pandas, y una semana determinista de lecturas para alimentarlo.

### Configura el proyecto

```bash
uv init air-quality
cd air-quality
uv add pandas numpy matplotlib requests
```

`pandas` hace el trabajo de dataframes, `numpy` construye la muestra determinista, `matplotlib` dibuja la gráfica y `requests` alimenta la obtención en vivo opcional. Si omites `requests`, elimina `fetch_live()` del Paso 1 — cada salida esperada de este proyecto se calcula a partir de la muestra determinista, así que nada posterior se rompe.

**✅ Lista de verificación**

- ✅ `uv add pandas numpy matplotlib requests` termina sin errores.
- ✅ Puedes `import pandas as pd` desde dentro del directorio del proyecto.

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué la ruta de obtención en vivo de este proyecto *necesita* un respaldo en absoluto — qué hace de una API una mala garantía sobre la que construir un informe completo, y cómo mantiene honestos los números una muestra determinista de todos modos?
- Una semana de lecturas por hora son 168 filas. Antes de escribir cualquier código, ¿qué predices que serán las columnas de forma y dtypes de ese marco ordenado?

## Paso 1: Carga una semana ordenada de lecturas

Este paso construye el DataFrame que consumirá cada paso posterior. El núcleo es una semana *sintética pero determinista* — un ritmo de 24 horas más ruido, con semilla, para que los mismos números exactos aparezcan en todas las máquinas. Un envoltorio fino de obtención en vivo intenta la API de OpenAQ y se omite cuando la red o la API no están disponibles.

### 1.1 Genera la semana determinista

**👟 Pista inicial :** Construye una semana de polución creíble: un perfil sinusoidal de 24 horas (en esta ciudad sintética el aire empeora en la madrugada — una clásica "inversión matinal"), ruido gaussiano, valores recortados para que nunca bajen de cero, y filas por hora con marca de tiempo.

```python
# aqi.py
import numpy as np
import pandas as pd

def load_week() -> pd.DataFrame:
    rng = np.random.default_rng(42)
    hours = np.arange(168)
    daily = 20 + 10 * np.sin(2 * np.pi * hours / 24)   # daily rhythm
    noise = rng.normal(0, 5, size=168)
    pm25 = np.clip(daily + noise, 0, None).round(1)    # µg/m³, never negative
    dates = pd.date_range("2025-03-03", periods=168, freq="h")
    return pd.DataFrame({"date": dates, "pm25": pm25})

df = load_week()
print(df.shape)
```

`np.random.default_rng(42)` es la expresión idiomática de la aleatoriedad reproducible: la misma semilla produce el mismo "ruido" en todas las máquinas, por eso cada salida esperada de este proyecto es exacta. El perfil `20 + 10·sin(2πh/24)` vuelve visible la física subyacente, y `.round(1)` mantiene las concentraciones a la décima de µg/m³ como las reporta un monitor real.

**🎯 Resultado esperado :** `(168, 2)` — siete días de lecturas por hora, dos columnas (`date`, `pm25`).

**🩹 Si sale mal :** Si las *filas* de la forma difieren de 168, revisa `periods=168` y `freq="h"` en `date_range`. Si es `(168, 3)` o más, una columna extraviada (como la `hour` de un paso posterior) se filtró a `load_week` — mantén al generador construyendo exactamente las dos columnas ordenadas.

### 1.2 Inspecciona el marco

**👟 Pista inicial :** Haz una verificación de cordura con `describe()` y busca la historia de los dtypes: `date` debe ser datetime, `pm25` float, y el intervalo de concentraciones debe parecer aire urbano real.

```python
# aqi.py (continued)
print(df.info())
```

**🎯 Resultado esperado :** 168 entradas no nulas en ambas columnas; `date` es `datetime64[ns]` (o `datetime64[us]`), `pm25` es `float64`. Sin nulos — un marco ordenado.

**🩹 Si sale mal :** Si `date` aparece como `object`, `date_range` no se asignó a la columna (una lista llana de strings en su lugar). Si `pm25` muestra 168 *no nulas* pero se imprime como `object`, `.round(1)` se aplicó a una lista de tipo mixto — reconstruye la columna con el arreglo de numpy.

### 1.3 Opcional: ¿en qué ruta estás?

**👟 Pista inicial :** Imprime una línea para declarar claramente si estás analizando datos en vivo o la muestra determinista — un informe nunca debe mentir sobre su fuente.

```python
# aqi.py (continued)
SOURCE = "sample (deterministic)"
try:
    import requests
    r = requests.get("https://api.openaq.org/v2/measurements",
                     params={"city": "Stockholm", "parameter": "pm25", "limit": 168},
                     timeout=10)
    r.raise_for_status()
    results = r.json().get("results", [])
    if results:
        live = pd.DataFrame({
            "date": pd.to_datetime([m["date"]["utc"] for m in results]),
            "pm25": [float(m["value"]) for m in results],
        })
        df = live.sort_values("date").reset_index(drop=True)
        SOURCE = "live OpenAQ"
except Exception:
    pass   # network down, key missing, or API changed — sample it is

print("analyzing:", SOURCE)
```

El `try/except` que cubre todo en la obtención es deliberado: una API que está caída, se movió o necesita una clave nunca debe matar un informe. Cuando la ruta en vivo tiene éxito, `df` se convierte en aire real de Estocolmo y los números del resto de este proyecto diferirán — cada salida esperada de abajo *asume la muestra determinista*, así que la línea de fuente te mantiene con los pies en la tierra.

**🎯 Resultado esperado :** `analyzing: sample (deterministic)` en una máquina sin acceso confiable a OpenAQ — y `analyzing: live OpenAQ` en una donde la obtención aterriza.

**🩹 Si sale mal :** Si ves un `KeyError` en `m["date"]` a partir de una llamada a la API *exitosa*, la forma de la respuesta de OpenAQ cambió — imprimir `results[0].keys()` es la forma más rápida de ver los campos nuevos, y la ruta de la muestra igualmente salva el proyecto.

### 1.4 Verifica la carga

**✅ Lista de verificación**

- ✅ `load_week()` devuelve `(168, 2)` sin nulos y sin concentraciones negativas.
- ✅ `df["pm25"].min()` es alrededor de `3.1` y `df["pm25"].max()` alrededor de `40.7` (µg/m³) — un rango urbano creíble.
- ✅ Una línea de fuente declara si estás ejecutando datos de muestra o en vivo.

**🤔 Pregunta(s) socrática(s)**

- El perfil de concentración de la muestra *alcanza su pico a las 6 a.m.*, la clásica "inversión matinal" cuando la capa donde respiramos está en su punto más delgado. ¿Qué matemática de un paso futuro cambiaría si invirtieras el perfil para que alcanzara su pico a las 3 p.m. — y por qué serían las etiquetas de *categoría* el verdadero dolor de cabeza, y no el promediado?
- ¿Por qué limitar la obtención a 168 filas (`limit=168`) en lugar de traer "todo"? ¿Qué se rompe en un informe semanal si el sensor de un día se queda en silencio a mitad del archivo?

## Paso 2: Convierte concentraciones en AQI

Los µg/m³ crudos no significan nada para un no científico. La EPA lo convierte a la escala de AQI de 0–500 con una **tabla de puntos de ruptura**: rangos de concentración se mapean a rangos de AQI, conectados por líneas rectas. Este paso escribe esa fórmula por tramos como una única función honesta de Python.

### 2.1 Escribe la fórmula de puntos de ruptura

**👟 Pista inicial :** Implementa `pm25_to_aqi(pm25)` — recorre la tabla de puntos de ruptura de PM2.5 de la EPA en orden y, para la banda que coincida, escala linealmente la concentración dentro de su rango de AQI.

```python
# aqi.py (continued)
def pm25_to_aqi(pm25: float) -> int:
    breakpoints = [
        (0.0, 12.0,  0,  50),   # Good
        (12.1, 35.4, 51, 100),  # Moderate
        (35.5, 55.4, 101, 150), # USG
        (55.5, 150.4, 151, 200),# Unhealthy
        (150.5, 250.4, 201, 300),
    ]
    for low, high, aqi_low, aqi_high in breakpoints:
        if low <= pm25 <= high:
            return round((aqi_high - aqi_low) / (high - low) * (pm25 - low) + aqi_low)
    return round((300 - 201) / (250.4 - 150.5) * (pm25 - 150.5) + 201) if pm25 > 250.4 else 0

print(pm25_to_aqi(12.0), pm25_to_aqi(30.0), pm25_to_aqi(35.4), pm25_to_aqi(50.0))
```

`(aqi_high - aqi_low) / (high - low)` es la pendiente de un segmento de línea de AQI contra concentración; escalar `(pm25 - low)` y sumar `aqi_low` te desliza hacia arriba por esa línea — interpolación lineal ordinaria sobre la banda. Este es el "estándar" completo de la EPA codificado en un `for`, que es exactamente por lo que la propia EPA lo publica como tabla: cuatro números por banda, sin magia.

**🎯 Resultado esperado :** `50 89 100 137` — los bordes de la banda limpia se mapean a enteros (12.0 → 50, 35.4 → 100) y los puntos medios de banda interpolan (30.0 → 89, 50.0 → 137).

**🩹 Si sale mal :** Si un borde de banda como `pm25_to_aqi(12.0)` imprime `51` en lugar de `50`, tu límite de banda `(0.0, 12.0)` es exclusivo por la izquierda — cada banda debe ser `low <= pm25 <= high`. Si la salida es un float con decimales, falta `round(...)`; el AQI es un número entero por definición.

### 2.2 Aplícalo a toda la semana

**👟 Pista inicial :** `.apply(pm25_to_aqi)` sobre la columna `pm25` — una función, 168 filas, una nueva columna de enteros.

```python
# aqi.py (continued)
df["aqi"] = df["pm25"].apply(pm25_to_aqi)
print(df["aqi"].min(), df["aqi"].max())
print(df[df["date"] == "2025-03-04 06:00"])   # the worst hour, we suspect
```

`.apply` transmite la *misma* función pura a través de cada fila — sin bucles y sin forma de tratar filas de manera diferente por accidente. Como la función no tiene estado, es trivialmente comprobable: verifica tres valores calculados a mano una vez, y toda la columna hereda esa confianza.

**🎯 Resultado esperado :** `13 114`, y la fila de `2025-03-04 06:00` muestra `aqi` = `114` — la peor lectura individual de la semana, una hora "No saludable para Grupos Sensibles".

**🩹 Si sale mal :** Si `min`/`max` son negativos o absurdos, `pm25_to_aqi` devolvió la rama `else 0` / de respaldo para la mayoría de las filas — imprime `df["pm25"].describe()` y revisa una llamada a `pm25_to_aqi` contra un borde de banda conocido. Si la fila de las 06:00 imprime un `aqi` diferente, tu muestra proviene de la ruta en vivo (números completamente diferentes — la muestra es `(168, 2)` con un máximo de pm25 de `40.7`).

### 2.3 Verifica la conversión

**✅ Lista de verificación**

- ✅ Los bordes de banda comprobados a mano se mantienen: `12.0 → 50`, `35.4 → 100`.
- ✅ El rango de toda la columna es `13..114`, entero, sin NaNs.
- ✅ `.apply` agregó exactamente una columna nueva (`aqi`) sin perturbar `date` ni `pm25`.

**🤔 Pregunta(s) socrática(s)**

- La fórmula por tramos interpola *dentro* de una banda pero salta donde las bandas se encuentran (12.0 → AQI 50, pero 12.1 → AQI 51). Inventa una concentración, resuelve la fórmula y dime qué significaría un AQI de 50.6 si la EPA no hubiera redondeado a enteros — ¿por qué redondear a un número entero en realidad *ayuda* al mensaje público?
- `pm25_to_aqi` devuelve `0` para cualquier cosa por debajo de 0.0, y sin embargo `.clip(0, None)` garantiza una entrada no negativa. ¿Cuándo es la rama de `return 0` verdaderamente alcanzable, y qué diría un revisor *purista funcional* sobre mantener código muerto por ahí?

## Paso 3: Etiqueta categorías y caza la peor hora

Ahora el marco recibe su tercera y cuarta columna: una categoría humana para cada AQI, y luego las preguntas de resumen — ¿cuál fue la peor hora de la semana, cuál la mejor, y cómo se vio la semana por categoría?

### 3.1 Agrupa los valores AQI en categorías

**👟 Pista inicial :** Escribe `category(aqi)` recorriendo los cortes de categoría de la EPA, luego `.apply` y cuenta con `value_counts()`.

```python
# aqi.py (continued)
def category(aqi: int) -> str:
    if aqi <= 50:   return "Good"
    if aqi <= 100:  return "Moderate"
    if aqi <= 150:  return "Unhealthy for Sensitive Groups"
    if aqi <= 200:  return "Unhealthy"
    return "Very Unhealthy"

df["category"] = df["aqi"].apply(category)
print(df["category"].value_counts())
```

Ordenar los `if` de lo más limpio a lo más sucio y usar `<=` en cada corte significa que la *primera* banda que coincida gana — la clásica regla de "cubeta mutuamente excluyente". `value_counts()` desciende por conteo, así que la primera línea de la salida es al mismo tiempo la respuesta a "¿qué clase de semana fue esta?"

**🎯 Resultado esperado :** `Moderate 132`, `Good 33`, `Unhealthy for Sensitive Groups 3` — una semana moderadamente contaminada con un puñado de horas de grupos sensibles y ningún aire verdaderamente no saludable.

**🩹 Si sale mal :** Si los conteos no suman 168, las categorías se superponen o tienen huecos — revisa las fronteras `<=` por superposición de uno fuera, o vuelve a ejecutar con `df["category"].isna().sum()` para atrapar filas sin etiquetar. Si todo cae en una sola cubeta, `category` se aplicó a `aqi` pero un orden de cortes (p. ej. `<= 100` antes de `<= 50`) hizo que los retornos tempranos se tragaran todo.

### 3.2 Encuentra las horas peor y mejor

**👟 Pista inicial :** `idxmax`/`idxmin` sobre la columna `aqi`, luego búsqueda de fila por esos índices — la historia de la semana en dos impresiones.

```python
# aqi.py (continued)
worst = df.loc[df["aqi"].idxmax()]
best = df.loc[df["aqi"].idxmin()]
print("worst:", worst["date"], worst["pm25"], worst["aqi"])
print("best: ", best["date"], best["pm25"], best["aqi"])
```

`df["aqi"].idxmax()` devuelve la *etiqueta de índice* de la fila máxima — emparejarla con `.loc` es la expresión idiomática de dos pasos para "encontrar y mostrar el registro" que se generaliza a cualquier búsqueda por clave. Con un índice datetime esto se vuelve nativo de series de tiempo, que es exactamente como un panel de monitoreo extrae "la alerta estuvo aquí, en este segundo".

**🎯 Resultado esperado :** `worst: 2025-03-04 06:00:00 40.7 114` y `best:  2025-03-07 17:00:00 3.1 13` — antes del amanecer del martes contra a última hora de la tarde del viernes.

**🩹 Si sale mal :** Si se muestra la fila equivocada, `idxmax` devolvió el máximo de una columna *float* cuando `.loc[...]` coincidía con un marco diferente — confirma que `worst` es una fila de `df`, y no de una copia reagrupada. Si ambas imprimen la misma fecha, la columna `date` no es el índice y `.loc[df["aqi"].idxmax()]` reutilizó en silencio la etiqueta entera.

### 3.3 Verifica la caza

**✅ Lista de verificación**

- ✅ Los conteos de categoría suman 168 con tres cubetas distintas.
- ✅ El `aqi` de la peor hora (114) es `USG`, el de la mejor (13) es `Good`.
- ✅ `worst` y `best` son filas reales de `df`, no marcos reagrupados o copiados.

**🤔 Pregunta(s) socrática(s)**

- Los promedios por día de semana estaban todos a un par de µg/m³ uno de otro, y sin embargo el *día pico* sobresale en un informe. ¿Dónde empieza a engañar "agregar por día y luego clasificar días", y qué hecho de una sola fila (la peor hora) esconden activamente los promedios diarios?
- `value_counts()` ordena descendente por defecto. ¿Por qué el orden descendente es el *default* correcto para este informe — y qué pregunta respondería el orden ascendente en su lugar?

## Paso 4: Imprime el informe ciudadano

Las gráficas son para observar; un informe es para actuar. Este paso convierte los agregados del Paso 3 en unas pocas líneas sencillas sobre las que un lector puede actuar esta noche — porcentajes, una hora pico y el diccionario de consejos concretos que acompaña a cada categoría.

### 4.1 Escribe el diccionario de consejos

**👟 Pista inicial :** Mapea cada categoría a una oración accionable — el "y qué" de salud pública de cada AQI.

```python
# aqi.py (continued)
ADVICE = {
    "Good": "Open the windows — air is clean today.",
    "Moderate": "Fine for most people; sensitive folks, take it easy outside.",
    "Unhealthy for Sensitive Groups": "Sensitive groups: reduce prolonged outdoor exertion.",
    "Unhealthy": "Everyone: cut back prolonged or heavy outdoor effort.",
    "Very Unhealthy": "Stay indoors; keep windows shut.",
}
```

Un diccionario mapea las cadenas de categoría exactas a consejos, así que el informe nunca *decide* qué decir — lo busca. Mantener los consejos como datos en lugar de prosa `if/elif` significa que el mismo diccionario podría conducir una alerta por SMS, un círculo de panel o un póster, sin cambios.

**🎯 Resultado esperado :** Sin salida por la sola definición — pero el diccionario debe contener una clave para exactamente cada cadena que `category()` pueda producir.

**🩹 Si sale mal :** Si el informe luego lanza `KeyError`, una cadena de categoría en `df["category"]` no está en `ADVICE` — ejecuta `set(df["category"]) - set(ADVICE)` para imprimir los huérfanos en una línea.

### 4.2 Agrega e imprime

**👟 Pista inicial :** Calcula los porcentajes de categoría, la hora con el AQI *medio* más alto y la peor lectura individual, luego `print` un informe de 6 líneas ordenado.

```python
# aqi.py (continued)
df["hour"] = df["date"].dt.hour  # pull the clock value for hour-of-day aggregation

def print_report(df: pd.DataFrame, advice: dict[str, str]) -> None:
    counts = df["category"].value_counts()
    n = len(df)
    hourly_mean = df.groupby("hour")["aqi"].mean()
    peak_hour = int(hourly_mean.idxmax())
    peak_value = round(float(hourly_mean.max()))
    worst = df.loc[df["aqi"].idxmax()]

    print(f"Week: {n} hourly readings")
    print(f"Most common category: {counts.index[0]} ({counts.iloc[0]}h, {counts.iloc[0] / n * 100:.0f}%)")
    print(f"Peak pollution hour (avg AQI): {peak_hour:02d}:00 (~{peak_value})")
    print(f"Worst single hour: {worst['date']}  AQI {worst['aqi']}")
    print("Advice:", advice[counts.index[0]])

print_report(df, ADVICE)
```

`df["hour"] = df["date"].dt.hour` proyecta la marca de tiempo al valor de reloj — una llamada al descriptor `.dt` que convierte una columna datetime en la partición de 24 vías que el informe necesita. Luego `groupby("hour")["aqi"].mean()` colapsa la semana en 24 promedios horarios, y `idxmax()` sobre esa serie encuentra la hora pico *por hora del día* — un hecho en lenguaje natural ("antes del amanecer es el peor tramo") en lugar de un artefacto de hoja de cálculo. `counts.index[0]` es la categoría moda, que el informe empareja con su línea de consejo para que el lector obtenga una oración accionable.

**🎯 Resultado esperado :**

```
Week: 168 hourly readings
Most common category: Moderate (132h, 79%)
Peak pollution hour (avg AQI): 06:00 (~94)
Worst single hour: 2025-03-04 06:00:00  AQI 114
Advice: Fine for most people; sensitive folks, take it easy outside.
```

**🩹 Si sale mal :** Si `counts.iloc[0] / n * 100` imprime `79.0%` en lugar de `79%`, el formato `:.0f` se perdió. Si `peak_hour:02d` da error, `idxmax()` devolvió `numpy.float64` — envuélvelo con `int(...)`. Si el consejo es para la categoría equivocada, `advice[counts.index[0]]` buscó la fila moda, pero una *moda* equivocada significa que `value_counts` no se ejecutó sobre la semana completa.

### 4.3 Verifica el informe

**✅ Lista de verificación**

- ✅ Las cinco líneas reproducen la salida esperada con la muestra.
- ✅ Los porcentajes suman ~100 entre las categorías.
- ✅ La línea de consejo coincide con la categoría moda, no con la de la peor hora.

**🤔 Pregunta(s) socrática(s)**

- El informe imprime consejo para la categoría *moda* mientras señala la *peor* hora. ¿Cuándo aconsejar desde la moda engaña activamente — y cómo cambiarías una línea para volver honesta la única oración accionable del informe tanto para una semana 79%-Moderada como para un día 2%-Muy No Saludable?
- `hourly_mean.idxmax()` ignora *en qué* día cae el pico, así que "06:00" aparece aunque la peor hora haya sido el martes. Reformula esa brecha socrática como una operación de pandas de una línea que reporte "martes 06:00" en su lugar — ¿qué cambia conceptualmente?

## Paso 5: Grafica la semana y guárdala

Un informe dice; una gráfica muestra. Este paso dibuja 24 puntos de AQI medio por hora con las líneas de umbral de 50 y 100 anotadas, y guarda la figura como PNG — el artefacto que puedes poner de verdad en una presentación de diapositivas o enviar a un amigo.

### 5.1 Grafica el AQI medio por hora

**👟 Pista inicial :** `groupby("hour")["aqi"].mean()` otra vez, `plt.plot` con marcadores, dos `axhline` de umbral, y `Agg` para que la gráfica se renderice sin pantalla (sin display) en cualquier entorno.

```python
# aqi.py (continued)
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

def plot_week(df: pd.DataFrame, out: str = "aqi_week.png") -> None:
    hourly = df.groupby("hour")["aqi"].mean()
    fig, ax = plt.subplots(figsize=(8, 4))
    ax.plot(hourly.index, hourly.values, marker="o", label="mean AQI")
    ax.axhline(50, color="green", ls="--", lw=1, label="Good / Moderate")
    ax.axhline(100, color="orange", ls="--", lw=1, label="Moderate / USG")
    ax.set_xlabel("Hour of day")
    ax.set_ylabel("Mean AQI")
    ax.set_title("Average weekly AQI by hour of day")
    ax.legend()
    fig.tight_layout()
    fig.savefig(out)
    plt.close(fig)

plot_week(df)
```

`matplotlib.use("Agg")` selecciona el renderizador sin pantalla — dibuja a un buffer y `savefig` escribe el PNG, sin dependencia alguna de un sistema de ventanas, que es lo que hace a esta celda a prueba de plataforma entre notebooks y servidores. Los dos `axhline` cargan las mismas fronteras de puntos de ruptura que codificaste numéricamente en el Paso 2, pero aquí como *líneas* de corte visuales: cualquier punto por encima de `100` es una violación de la línea naranja de un vistazo.

**🎯 Resultado esperado :** La figura muestra una joroba de la madrugada que cruza la frontera naranja (USG) alrededor de las 06:00 y lecturas de la tarde que bajan al territorio Good — coincidiendo con `hourly_mean.max()` ≈ 94 del Paso 4.

**🩹 Si sale mal :** Si no aparece ningún archivo, `plt.close(fig)` se ejecutó antes de `savefig` o la ruta está mal — pon `savefig` antes de `close`. Si la gráfica está vacía, `hourly` está vacío porque la columna `"hour"` no existe — la extracción de `hour` ocurrió en una copia, no en `df`. Si los ejes están intercambiados (horas en el eje y), `hourly.index` y `hourly.values` fueron a los argumentos equivocados.

### 5.2 Confirma el artefacto

**👟 Pista inicial :** Verifica que el PNG existe y no está vacío antes de dar por terminado — el archivo en disco es el entregable.

```python
# aqi.py (continued)
import os
print("exists:", os.path.exists("aqi_week.png"), "size:", os.path.getsize("aqi_week.png"), "bytes")
```

**🎯 Resultado esperado :** `exists: True size: <a few tens of kB> bytes` — un PNG real y abrible.

**🩹 Si sale mal :** Si `exists: False`, la función de graficado nunca se ejecutó (revisa el nombre de archivo pasado a `savefig` contra el nombre verificado). Si el tamaño es de un puñado de bytes, el renderizador escribió un archivo vacío o de relleno — vuelve a ejecutar la celda y observa si hay una excepción entre `plot_week(df)` y la comprobación.

### 5.3 Verifica la gráfica

**✅ Lista de verificación**

- ✅ El PNG existe, no está vacío y muestra la joroba de AQI previa al amanecer cruzando la línea de 100.
- ✅ Las líneas de umbral de 50 y 100 tienen etiquetas, y la leyenda se renderiza.
- ✅ La gráfica se guarda como `aqi_week.png` en el directorio del proyecto.

**🤔 Pregunta(s) socrática(s)**

- Los dos `axhline` codifican los *cortes* pero no las *bandas* — la gráfica no puede mostrar horas "USG" como sombreado sin importar dónde se sienten los puntos. ¿Qué llamada única de matplotlib sombrearía la banda entre 51 y 100, y por qué el sombreado suele ser *más* honesto que las líneas de corte para un lector lego?
- `savefig` escribe píxeles, así que la gráfica queda congelada en el momento en que se crea. Si quisieras que *el mismo* notebook enviara una gráfica cuyos números se actualizaran con los datos de la próxima semana, ¿qué partes de `plot_week` tendrían que permanecer puras — y qué parte es inherentemente un efecto secundario?

## ⚠️ Errores comunes

- **Fronteras de banda que se solapan.** Si alguna banda usa `< low` y la siguiente usa `<= high`, los cortes de la EPA cuentan de más y `value_counts` suma más de 168. Cada banda debe ser `low <= pm25 <= high` y las bandas deben tocarse exactamente.
- **Olvidar que `.round(1) → AQI es un entero.** El AQI son números enteros por definición; devolver floats desde `pm25_to_aqi` pasa las pruebas en verde pero hace parecer absurdos los promedios de `groupby` (p. ej. `94.3333`).
- **`idxmax` sobre la columna equivocada.** `.idxmax` devuelve una *etiqueta de índice*; usa `.loc[label]` sobre el *mismo* marco, o mostrarás en silencio la fila de otro registro.
- **`dtypes` mezclados en el informe.** `f"{peak_hour:02d}"` necesita un `int`; los floats de numpy lanzan `TypeError` con `:02d`. Envuelve con `int(...)`.
- **Graficar en un ejecutor sin pantalla sin `Agg`.** Los notebooks y servidores no tienen display; `matplotlib.use("Agg")` antes de importar `pyplot` es la diferencia entre un PNG guardado y un `TclError`.
- **Deriva del diccionario de consejos.** `ADVICE` debe contener una clave para *cada* cadena que `category()` pueda emitir; una categoría nueva agregada sin una entrada de diccionario estrella el informe en tiempo de ejecución.

## Lo que acabas de construir

Un pipeline de calidad del aire real: datos ordenados por hora adentro, un informe humano y una gráfica afuera. En el camino codificaste un estándar regulatorio completo (la tabla de puntos de ruptura de la EPA) como datos, convertiste una columna numérica de sensores en información categórica y produjiste los dos artefactos que la gente realmente consume — una declaración en texto plano de la semana y un PNG que la muestra. La forma transferible — cargar → transformar con funciones puras → agregar → reportar + visualizar — es el mismo esqueleto detrás de los monitores de sensores, los paneles de producto y los correos semanales de analítica.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/air-quality/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/air-quality) en el repositorio del curso es el panel completo como notebook — rutas de muestra y en vivo, informe y gráfica, todo en un solo lugar. Clona el repositorio o [ábrelo en un Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## A dónde ir desde aquí

- Agrega un segundo contaminante (PM10 u ozono) y un AQI *combinado* — el contaminante que puntúa peor en una hora dada es el que conduce el valor del informe, que es como funciona el AQI real de la EPA.
- Re-clave el marco sobre `df["date"]` y agrega `resample("D").mean()` para que el informe semanal pueda señalar *días* enteros por encima de un umbral.
- Construye la mitad de alarma: una función que devuelva "enviar SMS" cuando una categoría como `Unhealthy` aparezca más de N horas en una ventana móvil de 24 — y luego conéctala a un trabajo de cron/Playwright.
- Cambia la semilla determinista por los datos reales de OpenAQ de tu ciudad y compara los dos informes — una lección memorable sobre cuánto pueden esconder los promedios.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓