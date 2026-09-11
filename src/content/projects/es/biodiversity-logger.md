---
title: "Registro de Biodiversidad"
description: "Un agente de muestreo que ingiere semanas de observaciones sintéticas de aves, compara los conteos recientes con una línea base de temporada, marca a las especies como SURVEY/WATCH/OK, registra las decisiones en un CSV y prioriza qué especies revisar primero con un gráfico de tendencia ASCII."
difficulty: "intermediate"
estimatedMinutes: 90
xpReward: 100
tags: ["Environment", "AI Agents", "Data Visualization"]
prerequisites:
  - "groupby, filtrado y fusión de pandas"
  - "Funciones y listas de Python"
  - "Leer un CSV como entregable"
learningObjectives:
  - "Generar un registro de observaciones sintético determinista con un RNG de numpy y fechas de pandas"
  - "Derivar las líneas base por especie y las ventanas recientes de un solo DataFrame"
  - "Aplicar una regla de umbral (SURVEY/WATCH/OK) como función de decisión del agente"
  - "Ingerir lotes semanales de observaciones y registrar las decisiones por especie en un CSV"
  - "Visualizar los totales por especie como gráfico de barras ASCII y ordenar una cola de prioridad de muestreo"
---

# 🛠️ 🦉 Construye un Registro de Biodiversidad

Los ecólogos no observan a cada individuo — observan *señales*. Una caída del 30% o más en las aves observadas en una temporada es un disparador de muestreo; una oscilación cerca de la línea base merece vigilarse; un conteo estable es "déjalo en paz". Este proyecto construye ese bucle de decisión como un pequeño **agente de muestreo**: mantiene un registro de observaciones de toda una temporada (sintético, por lo tanto reproducible), calcula la línea base de cada especie y su ventana reciente, aplica una regla de umbral para marcar `SURVEY` / `WATCH` / `OK`, ingiere nuevos lotes semanales y registra cada decisión en un CSV, para luego renderizar un gráfico de barras ASCII de los totales por especie e imprimir una cola de muestreo priorizada. Todo corre en pandas y la biblioteca estándar, con una semilla fija — la misma ejecución marca a las mismas especies cada vez, en cualquier máquina.

Esto asume `groupby`, filtrado y fusión de pandas. Es un proyecto opcional y no calificado — consulta [Proyectos del mundo real](/es/proyectos) para la lista completa y creciente. Una sola instalación: `pandas`.

## 🎯 Lo que harás

1. Generar un registro de observaciones determinista de 111 días para cinco especies en tres sitios.
2. Escribir el cerebro del agente: ventanas de línea base y recientes más una regla de umbral de tres niveles.
3. Ejecutar el bucle de ingesta: absorber tres lotes semanales, añadir una fila de decisión por especie.
4. Visualizar los totales por especie como un gráfico de barras ASCII.
5. Priorizar: ordenar las especies para el siguiente muestreo, SURVEY primero.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino recomendado:

```bash
uv init biodiversity-logger && cd biodiversity-logger
uv add pandas
```

**Google Colab, Kaggle Notebooks y Binder** ejecutan cada paso sin modificar — pandas viene preinstalado en ambas plataformas, y el fijo `default_rng(11)` hace la salida idéntica en todas partes.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/biodiversity-logger/notebook.es.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/biodiversity-logger/notebook.es.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fbiodiversity-logger%2Fnotebook.es.ipynb)

## Configuración

Todo lo necesario antes del primer avistamiento.

### Configura el proyecto

```bash
uv init biodiversity-logger
cd biodiversity-logger
uv add pandas
```

Los imports que usarás en todo el proyecto:

```python
import numpy as np
import pandas as pd
```

**✅ Lista de verificación**

- ✅ `uv run python3 -c "import pandas, numpy"` tiene éxito.
- ✅ Puedes imaginarte una fila como `date | site | species | count` antes de escribir nada.

**🤔 Pregunta(s) socrática(s)**

- Un "registro" que solo almacena filas es una hoja de cálculo. ¿Qué agrega este proyecto que lo convierte en un *agente* — un tomador de decisiones que reacciona a los datos en lugar de solo registrarlos?
- Los conteos de especies son sintéticos, con dos especies con tendencia deliberadamente descendente. Si cada especie cayera un 10% *simultáneamente*, ¿lo detectaría siquiera una razón reciente-vs-línea base — y qué punto ciego revela eso sobre el monitoreo basado en razones?

## Paso 1: Genera el registro de observaciones

Cada número posterior proviene de este bloque, así que es determinista: un RNG, una semilla, un rango de días.

### 1.1 El marco de temporada

**👟 Pista inicial :** Construye un marco de 111 días con `pd.date_range`; tres sitios; cinco especies con conteos base por especie, multiplicadores por sitio y dos tendencias descendentes.

```python
# main.py
import numpy as np
import pandas as pd

rng = np.random.default_rng(11)
species = ["acorn_woodpecker", "blue_jay", "eastern_bluebird",
           "northern_cardinal", "tree_swallow"]
sites = ["riverside", "meadow", "forest"]
base = {"acorn_woodpecker": 48, "blue_jay": 62, "eastern_bluebird": 70,
        "northern_cardinal": 55, "tree_swallow": 60}
trend = {"acorn_woodpecker": -2.0, "blue_jay": 0.0, "eastern_bluebird": 0.0,
         "northern_cardinal": 0.0, "tree_swallow": -1.5}
site_mult = {"riverside": 1.2, "meadow": 0.8, "forest": 1.4}

day = pd.date_range("2025-04-01", periods=111, freq="D")
rows = []
for s in species:
    for site in sites:
        for i, d in enumerate(day):
            week = i // 7
            mu = base[s] * site_mult[site] + trend[s] * week
            rows.append({"date": d, "site": site, "species": s,
                         "count": max(0, round(mu + rng.normal(0, 4)))})
full = pd.DataFrame(rows)
print(full.head(3).to_string(index=False))
print("shape:", full.shape)
```

Las dos entradas de `trend` — acorn woodpecker −2 por semana, tree swallow −1.5 — son las especies que el agente eventualmente debe *notar*. El término `rng.normal(0, 4)` es ruido diario realista: los conteos oscilan ±4 incluso en una tendencia estable, así que un estricto "hoy el conteo bajó" se dispararía constantemente. La lógica de razón del Paso 2 promedia ese ruido.

**🎯 Resultado esperado :**

```
        date      site          species  count
0 2025-04-01 riverside acorn_woodpecker     58
1 2025-04-02 riverside acorn_woodpecker     63
2 2025-04-03 riverside acorn_woodpecker     62
shape: (1665, 4)
```

**🩹 Si sale mal :** Si el primer conteo de la cabecera difiere de 58, la semilla del RNG o el orden de llamadas cambió. Si `shape` no es `(1665, 4)`, el bucle factorizó mal `5 especies × 3 sitios × 111 días = 1665`.

### 1.2 Retén las semanas "entrantes"

**👟 Pista inicial :** Guarda los días anteriores a 2025-06-30 (`<2025-06-30`) como la temporada *observada*; las últimas tres semanas se entregarán al agente como "nuevos lotes de sensor" en el Paso 3.

```python
# main.py (continued)
observed = full[full["date"] < pd.Timestamp("2025-06-30")].copy()
print("observed rows (days 1–90):", len(observed))
```

El Paso 3 necesita lotes frescos que el agente *no haya visto*. En lugar de regenerarlos desde cero (una segunda corriente de RNG), el script generó una temporada de 111 días por adelantado y simplemente retiene la cola: el mismo marco es el entregable, y el corte es la ficción de "datos nuevos que llegan". Esto mantiene todo en una semilla — sin una segunda corriente aleatoria que documentar.

**🎯 Resultado esperado :** `observed rows (days 1–90): 1350` — 90 días × 30 filas/día.

**🩹 Si sale mal :** Si 1350 aparece como 1665, el `<` se volvió `<=` (incluyendo el día 91) o la copia perdió el filtro. Si muestra un conteo diferente, la comparación de fechas mezcla zonas horarias — compara objetos `Timestamp`, no cadenas.

### 1.3 Verifica la capa de datos

**✅ Lista de verificación**

- ✅ `full.shape == (1665, 4)`; cada especie tiene `270` filas (`species` distintas contadas en `groupby`).
- ✅ Las filas de cabecera y los conteos son deterministas (misma ejecución, mismos números).
- ✅ `observed` es exactamente los primeros 90 días — `1350` filas.

**🤔 Pregunta(s) socrática(s)**

- Tres sitios multiplican el conteo base de forma distinta (`forest` 1.4×, `meadow` 0.8×). Cuando el agente compara totales *por especie*, ¿debe contar aves crudas o aves-por-sitio? ¿Qué le pasa a la razón de una especie abundante en el bosque si comparas conteos crudos entre regiones con esfuerzo desigual?
- El ruido diario `rng.normal(0, 4)` significa que un solo día puede perder 8 aves por casualidad. ¿Cuántos días de promediado se necesitan antes de que la tendencia de −2/semana empiece a dominar sobre el ruido de ±4 — y qué dice eso sobre por qué el agente usa *ventanas*, no días individuales?

## Paso 2: El cerebro del agente

La regla de decisión es todo el agente. El Paso 2 define las ventanas y el umbral de tres niveles.

### 2.1 Ventanas de línea base y recientes

**👟 Pista inicial :** Calcula los conteos medios por especie para la línea base (primeros 28 días) y la ventana reciente (del 1 de junio en adelante), y luego su razón.

```python
# main.py (continued)
BASE_END = pd.Timestamp("2025-04-29")
RECENT_START = pd.Timestamp("2025-06-01")

base_mean = observed[observed["date"] < BASE_END].groupby("species")["count"].mean()
recent_mean = observed[observed["date"] >= RECENT_START].groupby("species")["count"].mean()
ratio = recent_mean / base_mean
print(ratio.round(3))
```

La línea base es lo "normal" de la especie — los conteos de primavera de las primeras cuatro semanas. La ventana reciente es "lo que pasa ahora" — los conteos de junio en adelante. Dividir reciente entre línea base da una razón adimensional: `0.66` significa "los avistamientos recientes son un tercio más bajos que la línea base", `1.0` significa "a la par", `1.2` significa "en auge". Las razones borran la escala, así que una sola regla de umbral funciona entre especies sin importar cuán comunes sean.

**🎯 Resultado esperado :**

```
acorn_woodpecker     0.659
blue_jay             1.003
eastern_bluebird     1.004
northern_cardinal    1.003
tree_swallow         0.804
Name: count, dtype: float64
```

**🩹 Si sale mal :** Si las especies estables muestran razones como `1.20`, la ventana reciente capturó el pico de temporada mientras la línea base capturó el valle — los límites de ventana importan. Si acorn muestra ~1.0, el dict `trend` no se aplicó (revisa `trend[s] * week`).

### 2.2 La regla de niveles

**👟 Pista inicial :** Convierte la razón en un nivel con `alert_level(r)` — `< 0.7` SURVEY, `< 1.0` WATCH, si no OK.

```python
# main.py (continued)
def alert_level(r):
    if r < 0.7:
        return "SURVEY"
    if r < 1.0:
        return "WATCH"
    return "OK"

for s in species:
    print(f"{s:<20} {ratio[s]:.3f}  {alert_level(ratio[s])}")
```

Los umbrales son la *política* del agente: un tercio por debajo de la línea base justifica despachar un muestreo de campo; cualquier caída por debajo de la par merece vigilancia; a la par o por encima se deja en paz. Dos especies caen por debajo de 1.0: acorn woodpecker en 0.659 (suficientemente profunda para SURVEY) y tree swallow en 0.804 (un WATCH). Las estables se sientan justo en 1.00 — el piso de ruido, no una señal real (nota que el umbral no le importa que la diferencia entre 1.003 y 0.999 sea ruido puro).

**🎯 Resultado esperado :**

```
acorn_woodpecker     0.659  SURVEY
blue_jay             1.003  OK
eastern_bluebird     1.004  OK
northern_cardinal    1.003  OK
tree_swallow         0.804  WATCH
```

**🩹 Si sale mal :** Si la columna de nivel es todo `OK`, `alert_level` comparó `str` con `float` (pasa la razón, no la etiqueta). Si SURVEY muestra `WATCH`, el límite `0.7` es `<` vs `<=` — elige uno y sé consistente.

### 2.3 Verifica el cerebro

**✅ Lista de verificación**

- ✅ Las razones son comparaciones adimensionales reciente/línea base; las especies estables están en ≈ 1.00.
- ✅ Niveles: acorn SURVEY (0.659), swallow WATCH (0.804), tres OK.
- ✅ `alert_level` es una función pura — misma razón, mismo nivel, cada llamada.

**🤔 Pregunta(s) socrática(s)**

- Las razones de las especies estables se ciernen dentro de ±0.005 de 1.00 — eso es ruido de medición, no una tendencia. Un usuario de `alert_level` ve `WATCH` para 0.999 y `OK` para 1.001. ¿Qué *banda muerta* (p. ej. tratar 0.95–1.05 como "sin cambio") reduciría las falsas alarmas, y cómo la implementarías sin cambiar el espíritu de tres niveles?
- `ratio` divide reciente entre línea base. Si una especie estuvo *ausente* en la línea base (línea base = 0), la razón explota a `inf`. ¿Qué resguardo agregarías — y qué haría una alerta sensata para "especie recién aparecida"?

## Paso 3: El bucle de ingesta

El agente no evalúa una vez — recibe datos nuevos y vuelve a decidir. El Paso 3 le alimenta tres semanas de lotes "nuevos" y registra cada decisión.

### 3.1 Alimenta un lote, vuelve a decidir

**👟 Pista inicial :** Para cada una de las tres semanas retenidas, fusiona el fragmento en `observed`, recalcula la razón/nivel por especie y añade una fila `(checked, species, ratio, level)` por especie.

```python
# main.py (continued)
BASE_END = pd.Timestamp("2025-04-29")
RECENT_START = pd.Timestamp("2025-06-01")

def alert_level(r):
    return "SURVEY" if r < 0.7 else ("WATCH" if r < 1.0 else "OK")

def status_of(obs, checked):
    base_mean = obs[obs["date"] < BASE_END].groupby("species")["count"].mean()
    recent_mean = obs[obs["date"] >= RECENT_START].groupby("species")["count"].mean()
    rows = []
    for s in species:
        r = recent_mean[s] / base_mean[s]
        rows.append({"checked_after_days": checked, "species": s,
                     "ratio": round(r, 3), "level": alert_level(r)})
    return pd.DataFrame(rows)

decisions = pd.DataFrame()
weeks = [(pd.Timestamp("2025-06-30"), pd.Timestamp("2025-07-06")),
         (pd.Timestamp("2025-07-07"), pd.Timestamp("2025-07-13")),
         (pd.Timestamp("2025-07-14"), pd.Timestamp("2025-07-20"))]

for week, (start, end) in enumerate(weeks, start=1):
    chunk = full[(full["date"] >= start) & (full["date"] <= end)]
    observed = pd.concat([observed, chunk], ignore_index=True)
    status = status_of(observed, checked=90 + 7 * week)
    decisions = pd.concat([decisions, status], ignore_index=True)

print(decisions.head(10).to_string(index=False))
```

Cada pasada es *re-decisión*: la línea base permanece fijada a las primeras cuatro semanas (un contrato histórico), mientras la ventana reciente absorbe el lote nuevo — así que la razón se mueve de forma continua conforme llegan semanas frescas. Las decisiones son una tabla en crecimiento, una fila por especie por revisión: 5 especies × 3 revisiones = 15 filas al final.

**🎯 Resultado esperado :**

```
 checked_after_days           species  ratio level
                 97  acorn_woodpecker  0.644 SURVEY
                 97          blue_jay  1.001    OK
                 97  eastern_bluebird  1.003    OK
                 97 northern_cardinal  1.003    OK
                 97      tree_swallow  0.789 WATCH
                104  acorn_woodpecker  0.626 SURVEY
                104          blue_jay  1.000 WATCH
                104  eastern_bluebird  1.001    OK
                104 northern_cardinal  0.998 WATCH
                104      tree_swallow  0.779 WATCH
```

**🩹 Si sale mal :** Si `chunk` se fusionó pero los números no se movieron, `status_of` usó una razón global en caché — recalcula desde `obs` en cada pasada. Si las decisiones tienen 10 filas en cabecera en lugar de 5, `status_of` corrió por semana *y* por especie dos veces.

### 3.2 Persistir las decisiones

**👟 Pista inicial :** `to_csv("decisions.csv", index=False)` y vuelve a leerlo para probar que el entregable sobrevive la sesión.

```python
# main.py (continued)
decisions.to_csv("decisions.csv", index=False)
print(pd.read_csv("decisions.csv").shape)
print(pd.read_csv("decisions.csv").tail(5).to_string(index=False))
```

Un CSV de decisiones es lo que un interesado no-Python consume de verdad: 15 filas, cinco por revisión, cada una con `checked_after_days`, especie, razón, nivel. Leerlo de vuelta con pandas hace el round-trip del entregable — la cola de prioridad del siguiente paso leerá de este mismo archivo.

**🎯 Resultado esperado :**

```
(15, 4)
 checked_after_days           species  ratio level
                111  acorn_woodpecker  0.607 SURVEY
                111          blue_jay  0.999 WATCH
                111  eastern_bluebird  0.999 WATCH
                111 northern_cardinal  0.996 WATCH
                111      tree_swallow  0.767 WATCH
```

**🩹 Si sale mal :** Si la forma del round-trip no es `(15, 4)`, `to_csv`/`read_csv` perdió una columna (el flag `index` escribió una columna extra sin nombre). Si la cola muestra filas obsoletas de una ejecución previa, limpia el CSV antes del bucle.

### 3.3 Verifica el bucle

**✅ Lista de verificación**

- ✅ Tres fusiones → 15 filas de decisión; días de revisión `97, 104, 111`.
- ✅ Acorn woodpecker es `SURVEY` en cada revisión; su razón *cae* 0.644 → 0.626 → 0.607 (declive que se acelera).
- ✅ `decisions.csv` hace round-trip a `(15, 4)`.

**🤔 Pregunta(s) socrática(s)**

- La razón de acorn *cayó* a lo largo de las tres revisiones mientras las especies estables parpadeaban `OK ↔ WATCH` cerca de 1.00. ¿Cuál patrón es la señal y cuál es el ruido — y qué te dice el declive monótono de la razón que una sola instantánea en el día 97 jamás podría?
- La línea base está fijada a **las primeras cuatro semanas para siempre**. Una especie que se recuperó a 2.0× de la línea base aún se compara contra la primavera. ¿Cuándo es mejor una línea base *móvil* (recalcular de los últimos 90 días) que una fija — y qué riesgo nuevo (girar hacia un declive autocumplido) introduce?

## Paso 4: Visualiza los totales

Las decisiones te dicen *qué* especie; un gráfico te dice *cuánto* importa cada una. El Paso 4 renderiza los totales por especie como un gráfico de barras ASCII — una visualización amigable para terminal.

### 4.1 Avistamientos totales por especie

**👟 Pista inicial :** `groupby("species")["count"].sum()` sobre la temporada de 111 días, ordenado ascendentemente para el gráfico.

```python
# main.py (continued)
totals = full.groupby("species")["count"].sum().sort_values()
print(totals.to_dict())
```

Los totales responden "quién es abundante, quién es raro" — un instinto de reporte, no una regla de decisión. Las dos especies marcadas (acorn 13,223 y swallow 18,954) están en el medio del grupo: no son las más raras, que es exactamente por qué importa la razón — una especie *rara* *y* una especie *común* merecen ambas un muestreo cuando sus conteos caen por debajo de la línea base.

**🎯 Resultado esperado :**

```
{'acorn_woodpecker': 13223, 'tree_swallow': 18954, 'northern_cardinal': 20705, 'blue_jay': 23398, 'eastern_bluebird': 26435}
```

**🩹 Si sale mal :** Si los valores suman salvajemente por arriba de 1665×~50, `concat` duplicó fragmentos (el Paso 4 corre antes del bucle — calcula sobre `full`, no sobre `observed` a mitad de ingesta).

### 4.2 Renderiza las barras ASCII

**👟 Pista inicial :** Mapea cada total a `"#" * round(v / max * 40)` para un gráfico de ancho fijo de 40 barras.

```python
# main.py (continued)
mx = totals.max()
for s, v in totals.items():
    bar = "#" * round(v / mx * 40)
    print(f"  {s:<20} {v:6d}  {bar}")
```

`v / mx * 40` re-escala la especie más grande (eastern bluebird, 26,435) a 40 caracteres y a todas las demás proporcionalmente — un gráfico de barras que no depende de la magnitud absoluta. Es una primitiva de visualización que funciona en cualquier terminal, cualquier notebook, cualquier plataforma, y hace visible la abundancia *relativa* de un vistazo.

**🎯 Resultado esperado :**

```
  acorn_woodpecker      13223  ####################
  tree_swallow          18954  #############################
  northern_cardinal     20705  ###############################
  blue_jay              23398  ###################################
  eastern_bluebird      26435  ########################################
```

**🩹 Si sale mal :** Si una barra está vacía (`""`) el total de la especie tocó fondo en 0 (el resguardo de razón del Socrático del Paso 2 debería avisar). Si las barras desbordan la línea, `round(v / mx * 40)` limita a 40 solo si `v <= mx` — lo es, por definición de `max`.

### 4.3 Verifica el gráfico

**✅ Lista de verificación**

- ✅ Los totales coinciden con el dict ordenado: acorn 13,223 … bluebird 26,435.
- ✅ La barra más larga (40 `#`) pertenece al total más grande (eastern bluebird).
- ✅ Marcas y barras provienen del mismo marco determinista — gráfico y decisiones no pueden discrepar.

**🤔 Pregunta(s) socrática(s)**

- El gráfico ordena por *total*, el agente por *razón*. Eastern bluebird encabeza el gráfico (26,435) pero es `OK`; acorn es el segundo menos (13,223) pero es `SURVEY`. ¿A dónde enviaría un muestreo un gráfico que solo mostrara totales — y qué enseña eso sobre "la mayoría de aves" vs "la mayor amenaza"?
- 40 `#` da 2.6% de resolución por carácter — 13,223 vs 13,223+300 no se puede distinguir. Para señalización de *decisiones* querrías una escala mayor o una escala logarítmica. ¿Cuándo es el gráfico de barras ASCII la visualización *incorrecta* para poner junto a una cola de prioridad?

## Paso 5: La cola de prioridad de muestreo

Decisiones + totales no son un plan de acción; el agente debe decir *quién va primero*. Las especies `SURVEY` primero, luego las `WATCH` por severidad (razón más baja), luego OK.

### 5.1 Ordena las especies

**👟 Pista inicial :** Lee las decisiones más recientes, mapea los niveles a un número de prioridad (`SURVEY=0 < WATCH=1 < OK=2`) y ordena por `(priority, ratio, species)`.

```python
# main.py (continued)
latest = pd.read_csv("decisions.csv")
latest = latest[latest["checked_after_days"] == latest["checked_after_days"].max()]
prio = {"SURVEY": 0, "WATCH": 1, "OK": 2}
latest["priority"] = latest["level"].map(prio)
latest = latest.sort_values(["priority", "ratio", "species"])

for i, row in latest.iterrows():
    print(f"{i+1:>2}. {row['level']:<6} {row['species']:<20} ratio {row['ratio']:.3f}")
```

Filtrar a la revisión más nueva (`checked_after_days == max`) conserva solo la imagen *actual* — las decisiones de la semana 1 son historia, no prioridades. Mapear el nivel a un número deja que `sort_values` haga el trabajo de política: todas las `SURVEY` por delante de todas las `WATCH` por delante de todas las `OK`, los empates se rompen por severidad (razón más baja = peor) y luego por nombre para el determinismo.

**🎯 Resultado esperado :**

```
 1. SURVEY  acorn_woodpecker      ratio 0.607
 2. WATCH   tree_swallow          ratio 0.767
 3. WATCH   northern_cardinal     ratio 0.996
 4. WATCH   blue_jay              ratio 0.999
 5. WATCH   eastern_bluebird      ratio 0.999
```

**🩹 Si sale mal :** Si acorn no está primero, el mapa de prioridad o las claves de orden están intercambiados (ordena por `("priority", "ratio")`, no por nombre). Si se imprimen más de 5 filas, no corrió el filtro al `checked_after_days` máximo.

### 5.2 Entrega el plan

**👟 Pista inicial :** Emite una línea de plan de una sola cadena para que el entregable funcione también como mensaje accionable.

```python
# main.py (continued)
plan = "; ".join(f"{row['level']}:{row['species']}"
                 for _, row in latest.iterrows())
print("SURVEY PLAN ->", plan)
```

La línea del plan es lo que un ecólogo lee de verdad: `SURVEY:acorn_woodpecker; WATCH:tree_swallow; …`. El turno completo del agente — ingerir → decidir → registrar → priorizar → mensaje — es ahora una salida de pipeline única sobre la que un humano puede actuar.

**🎯 Resultado esperado :** `SURVEY PLAN -> SURVEY:acorn_woodpecker; WATCH:tree_swallow; WATCH:northern_cardinal; WATCH:blue_jay; WATCH:eastern_bluebird`

**🩹 Si sale mal :** Si el plan lista las especies en orden de archivo, el `sort_values` previo a la línea del plan se perdió. Los desajustes de nombre de columna (`ratio` vs `Ratios`) rompen la unión en silencio — mantén el esquema del CSV del Paso 3.2 exactamente.

### 5.3 Verifica la cola

**✅ Lista de verificación**

- ✅ Orden de prioridad: SURVEY (acorn) antes de todos los WATCH; WATCH ordenado por razón ascendente.
- ✅ La línea `plan` encadena cada especie en el mismo orden que la lista impresa.
- ✅ Todo se lee de `decisions.csv` — el archivo **es** el sistema de registro.

**🤔 Pregunta(s) socrática(s)**

- La cola ordena `WATCH` por razón, así que tree swallow (0.767) precede a northern cardinal (0.996). Pero una especie *rara* en 0.996 puede ser más frágil que una común en 0.767. ¿Qué peso combinaría la razón **y** la abundancia absoluta en una sola puntuación de prioridad — y qué cuesta en explicabilidad?
- Este agente decidió por umbrales que un humano eligió (0.7/1.0). Un pipeline "automatizado" con umbrales elegidos a mano es automatización con un humano en el circuito. ¿Dónde en este proyecto *registrarías* la elección del umbral para que una futura ejecución del agente no sea una caja negra silenciosa?

## ⚠️ Errores comunes

- **Dos corrientes aleatorias.** Si los fragmentos se regeneraron con su propio RNG, los datos "nuevos" rompen la reproducibilidad y la historia de decisiones no se puede explicar. Mantén toda la temporada en un solo `default_rng(11)` y corta.
- **Ventanas que incluyen el futuro.** `date >= 2025-06-01` donde el marco observado ya termina el 29-06 está bien; pero filtrar con `<=` en la *ventana del fragmento* puede contar dos veces los días compartidos entre la fusión y el estado. Usa comparaciones semi-abiertas (`>= start & < end_next`).
- **Razón sobre una línea base cero.** Una especie ausente en primavera produce una razón `inf` y un nivel incorrecto. Resguarda con una rama `baseline == 0` (siempre `SURVEY` para una línea base desaparecida).
- **`concat` versus mutación.** `pd.concat([observed, chunk])` re-vincula el nombre — un hábito de `.append` en su lugar reproduce en silencio fragmentos viejos e infla las razones. Siempre re-vincula explícitamente y elimina duplicados si re-ejecutas.
- **Leer `decisions.csv` a mitad del bucle.** Si el archivo ya existe de una ejecución previa, `to_csv` sin semántica de sobrescritura duplica filas. Trunca o reconstruye antes de cada bucle.
- **Ordenar con las claves equivocadas.** Priorizar solo por `ratio` pone un OK de 0.60 antes de un SURVEY de 0.90. El orden de política es `level` primero, luego `ratio`, luego el nombre de la especie.

## Lo que acabas de construir

Un agente de muestreo que convierte un flujo de observaciones en un plan de conservación accionable: registros de temporada sintéticos, líneas base y ventanas recientes por especie, una política de umbral de tres niveles, un bucle de ingesta que vuelve a decidir conforme llegan semanas nuevas y añade cada decisión a un CSV, un gráfico de barras ASCII que ordena la abundancia, y una cola de prioridad que dice a quién muestrear primero. Las ideas centrales se transfieren dondequiera que aparezcan umbrales + ventanas de tiempo: **compara el comportamiento reciente con una línea base fijada, decide con una política pequeña legible por humanos, registra cada decisión como dato y empareja siempre una señal (la razón) con su magnitud (los totales)** — porque "bajó el 40%" no significa nada hasta que sabes que es el acorn woodpecker, y una especie estable es una razón para mirar a otra parte, no para apartar la mirada.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/biodiversity-logger/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/biodiversity-logger) en el repositorio del curso es el agente completo como notebook — generación de temporada, ventanas, el bucle de ingesta de tres semanas, el gráfico ASCII y el plan de prioridad, ejecutable en Colab/Kaggle/Binder. Clona el repositorio o [ábrelo en un Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## A dónde ir desde aquí

- Agrega una **banda muerta** a `alert_level` (`WATCH` solo para razones en `[0.7, 0.95)`, trata `0.95–1.05` como `OK`) para que el ruido límite deje de voltear la cola.
- Agrega desgloses por sitio: en lugar de una razón por especie, marca pares *sitio×especie* (p. ej. `tree_swallow@meadow`), y apila el gráfico ASCII por sitio.
- Visualiza con una biblioteca de gráficos real: `totals.plot.barh()` o `sevplot` — los mismos datos de groupby alimentan tanto el gráfico ASCII como una figura de matplotlib.
- Programa el bucle: envuelve los pasos 3–5 en una función `run_check(observed, new_chunk)` y llámala cada noche, cargando `observed` del CSV previo en lugar de regenerarlo.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓