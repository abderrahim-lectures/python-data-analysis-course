---
title: "Hub de Sensores IoT"
description: "Recolecta y agrega datos de múltiples sensores con paneles en tiempo real y alertas."
difficulty: "intermediate"
estimatedMinutes: 120
tags: ["simulation", "matplotlib", "csv", "dictionaries", "scripting", "iot"]
learningObjectives:
  - "Representa múltiples tipos de sensores y emula sus lecturas en un bucle de ticks"
  - "Agrega lecturas crudas en un log de series de tiempo normalizado"
  - "Dispara alertas de umbral y persístelas junto con la transmisión"
  - "Visualiza datos históricos de sensores con Matplotlib"
prerequisites: ["python-101/file-io", "python-101/dictionaries", "python-101/functions", "data-visualization/matplotlib"]
---

# 📡 Construye un Hub de Sensores IoT

Entra a una habitación y un termostato lee 21.4 °C; un detector de movimiento parpadea cada vez que alguien cruza; un chip de humedad mide un rincón húmedo. Un *hub de sensores IoT* es la cosa que recolecta todas esas lecturas de cada sensor, las normaliza en una sola transmisión, marca las que están fuera de un rango seguro y las almacena para que puedas mirar hacia atrás un gráfico. Los sensores físicos son opcionales — este proyecto los simula honestamente con un bucle de ticks configurable, así que todo el hub (agregación, alertas, persistencia y un dashboard de Matplotlib) corre en Python puro sin hardware y sin red. Todo lo que construyes tiene la misma forma que toma un hub real respaldado por MQTT; solo la fuente del "sensor" es falsa, y lo sabrás, porque reemplazar el simulador por una transmisión real es un cambio documentado.

Esto asume Python 101 más el módulo del curso de Matplotlib. Opcional y no calificado; consulta [Proyectos del mundo real](/docs/projects) para la lista completa.

## 🎯 Lo que harás

1. Construir un registro de sensores que emula lecturas de temperatura, humedad y movimiento en un tick.
2. Agregar cada tick en un log de series de tiempo normalizado con columnas unificadas.
3. Alertar cuando una lectura cruza un umbral por sensor y registrar cada alerta.
4. Persistir la transmisión a CSV y el rastro de alertas junto a ella.
5. Graficar el historial con Matplotlib — el visual de "¿se está calentando mi habitación?".

## Dónde ejecutar esto

**Localmente con `uv` es el camino principal** — el hub es un script que ejecutas, ves imprimir y re-ejecutas para añadir; el CSV y el `PNG` de Matplotlib aterrizan como archivos reales que puedes abrir, y la sensación de "ejecútalo en vivo y mira los números ticar" es todo el punto del hobbyista. `uv add matplotlib` cubre la única dependencia no-estándar.

**GitHub Codespaces** ejecuta el script idéntico: abre [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) y ejecútalo en una pestaña del navegador, con `history.csv` y `dashboard.png` visibles en el árbol de archivos.

**Google Colab, Kaggle Notebooks y Binder ejecutan el pipeline honestamente** — el hub es simulación pura y matemática sin NumPy, y Matplotlib renderiza el gráfico *en línea* en el notebook, así que `dashboard.png` se vuelve una salida de celda en vivo en lugar de un archivo. Lo único que un notebook no puede hacer es ticar en *reloj de pared real* como lo hace un bucle local — pero la simulación está bajo tu control, así que tanto "1 segundo por tick" como "avance rápido 100 ticks" funcionan, y ese es el lugar honesto donde el notebook realmente brilla (obtienes toda la transmisión más gráficos en un solo artefacto).

[![Abrir en Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/sensor-hub/notebook.ipynb)
[![Abrir en Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/sensor-hub/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fsensor-hub%2Fnotebook.ipynb)

## Configuración

Python más Matplotlib, y sin hardware.

### Instala `uv` y Matplotlib

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Cierra y vuelve a abrir tu terminal, luego:

```bash
uv --version
mkdir sensor-hub && cd sensor-hub
uv init --bare
uv add matplotlib
```

### El simulador de sensores

Crea `sensors.py` — la pieza que actúa en lugar del hardware físico:

```python
# sensors.py
import random

class Sensor:
    def __init__(self, name, base, noise, unit, low=None, high=None):
        self.name, self.base, self.noise = name, base, noise
        self.unit, self.low, self.high = unit, low, high

    def read(self):
        value = self.base + random.gauss(0, self.noise)
        return round(value, 1), self.unit, self.low, self.high

def make_registry():
    return [
        Sensor("thermostat", base=21.4, noise=0.5, unit="C", low=15, high=26),
        Sensor("humidity", base=43.0, noise=2.0, unit="%", low=20, high=70),
        Sensor("motion", base=0.0, noise=0.0, unit="bool", low=None, high=None),
    ]
```

`Sensor.read()` envuelve la física en un objeto: un nombre, un valor *base* en reposo, una sigma de *noise*, una unidad y un rango seguro *low/high* opcional. `random.gauss(base, noise)` es el sustituto honesto del jitter de un sensor — la temperatura oscila alrededor de 21.4, la humedad alrededor de 43, y el movimiento es un caso especial (un detector binario que farfullarás en un momento a mano). `low/high=None` expresa "este sensor no tiene umbral" — el movimiento simplemente está o no está moviéndose.

**✅ Lista de verificación**

- ✅ `uv --version` imprime una versión; `matplotlib` instalada vía `uv add`.
- ✅ `sensors.py` importa y `make_registry()` devuelve los tres sensores.
- ✅ Puedes explicar por qué `random.gauss` modela un sensor real (jitter alrededor de un valor verdadero) mejor que un número fijo.

## Paso 1: Emula un bucle de ticks

El corazón de cualquier hub es el *bucle de muestreo*: cada tick, pregunta a cada sensor por su lectura actual y recolecta todo el lote como una fila con marca de tiempo. Este paso ejecuta un número fijo de ticks y los imprime con marcas de tiempo — el feed crudo que un gateway real empujaría.

**👟 Pista inicial:** Empieza escribiendo `sample()` que estampa una hora UTC, recorre `make_registry()` llamando a `.read()` de cada sensor y devuelve un dict de fila con `ts`, `source` y un valor más una columna `_unit` por sensor — luego imprime cinco ticks.

```python
# hub.py
from datetime import datetime, timezone
import os
from sensors import make_registry

SENSORS = make_registry()

def sample(force: dict = None) -> dict:
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    reading = {"ts": now, "source": "sim"}
    for s in SENSORS:
        value, unit, lo, hi = s.read()
        reading[s.name] = value
        reading[f"{s.name}_unit"] = unit
    if force:
        reading.update(force)
    return reading

for tick in range(5):
    print(sample())
```

`sample` construye una fila del hub: una marca de tiempo UTC, `source: "sim"` (para que sepas qué filas vinieron de datos simulados vs inyectados) y una columna por sensor más su unidad. El dict `force` es la escotilla de inyección — te permite *sobrescribir* una lectura (digamos, poner `motion=1` o empujar `thermostat=28`) para probar umbrales sin esperar a que un paseo aleatorio exceda uno. Ese único parámetro es por qué el hub es testeable: puedes forzar-disparar una alerta bajo demanda en lugar de esperar que el generador de números aleatorios coopere.

**🎯 Resultado esperado:** Cinco filas de dict con marca de tiempo, cada una con `ts`, `source`, `thermostat` (~21±0.5), `humidity` (~43±2), `motion` (0) y las columnas `_unit`.

**🩹 Si sale mal:** Si los cinco termostatos son idénticos, `random.gauss` no se está llamando o `SENSORS` se congeló con la misma semilla de noise — un `Sensors` fresco está bien; un `base` en caché significa que tomaste `base` en lugar de `read()`. Si las marcas de tiempo son todas iguales, `timespec="seconds"` pudo haberlas truncado más rápido de lo que corrió el bucle — usa `timespec="milliseconds"` para ver la extensión. Si `force` nunca cambia la salida, pasaste `force` antes del bucle de sensores así que sus sobrescrituras fueron pisoteadas — aplica `force` *después* del bucle, como está escrito.

**✅ Lista de verificación**

- ✅ Cinco filas distintas, termostatos fluctuando alrededor de 21.4, humedad alrededor de 43.
- ✅ `motion` es 0 y tiene `unit` `bool`; la escotilla `force` sobrescribe bajo demanda.
- ✅ Las marcas de tiempo difieren por tick a precisión de milisegundos.

**🤔 Pregunta(s) socrática(s)**

- La escotilla `force` está deliberadamente separada del bucle de lectura. Si hubieras fusionado una sobrescritura *dentro* de `Sensor.read()`, ¿qué superpoder de prueba perderías — y cuál es el riesgo después de haberlo comprado (una prueba que pasa porque inyectó `thermostat=28` mientras una ejecución real nunca excede 24)?
- El tiempo se registra UTC, no local. ¿Por qué un hub *insiste* en UTC incluso en una demo de una sola habitación — y en qué punto una columna de hora local se vuelve un bug de corrección (horario de verano, una habitación en otra zona horaria, un gráfico analizado por CDN)?

## Paso 2: Agrega en un log normalizado

Los sensores no se ponen de acuerdo en el diseño de columnas; el trabajo del hub es hacer un *único* log de series de tiempo normalizado a partir de lecturas heterogéneas. Este paso convierte los dicts crudos del Paso 1 en una sola lista de filas con una forma fija `(ts, sensor, value, unit)` — la forma que después puedes pivotear, alertar y graficar. El cambio de forma es trivial; la disciplina (renombrar a un esquema canónico de antemano) es lo que detiene que cada paso posterior vuelva a analizar.

**👟 Pista inicial:** Empieza escribiendo `normalize(row)` que pivota una fila ancha del hub en un dict angosto por sensor con la forma fija `ts, sensor, value, unit`, luego imprime algunos ticks normalizados.

```python
# hub.py (continuación)

def normalize(row: dict) -> list[dict]:
    sensor_cols = [s.name for s in SENSORS]          # the numeric reading columns
    out = []
    for name in sensor_cols:
        out.append({
            "ts": row["ts"],
            "sensor": name,
            "value": row[name],
            "unit": row[f"{name}_unit"],
        })
    return out

for row in (sample(force={"thermostat": 21.4}) for _ in range(3)):
    for entry in normalize(row):
        print(f"{entry['ts'][11:]}  {entry['sensor']:<9} {entry['value']:>6} {entry['unit']}")
```

`normalize` es un pivote clásico de *largo-vs-ancho*: la fila ancha del hub (`thermostat`, `humidity`, `motion` como columnas) se vuelve una fila *angosta* por sensor (`sensor`, `value`, `unit`). Este es el formato "largo" canónico de series de tiempo — una observación por fila — porque es la forma que `pandas` pivotea, Matplotlib grafica y los umbrales evalúan sin ninguna ramificación `if` por sensor. La columna de nombre `sensor` es la clave foránea que une cada operación futura de vuelta a qué dispositivo produjo la lectura.

**🎯 Resultado esperado:** Nueve líneas (3 ticks × 3 sensores), cada una `HH:MM:SS  sensor  value  unit`, con una fila por sensor — termostatos en °C, humedad en %, movimiento en `bool`.

**🩹 Si sale mal:** Si un `KeyError` nombra `thermostat_unit`, la fila ancha se construyó antes de que existiera la columna `_unit` — normalizaste un dict que nunca pobló unidades (crea las unidades en `sample`, antes de `normalize`). Si el movimiento aparece con un `float` 0.0 en lugar de `bool`, la columna de unidad dijo `bool` pero el valor no se forzó — codifica el movimiento como `int(motion)` en `sample`. Si el *orden* de filas se siente mal, ordena por `(ts, sensor)` para reproducibilidad.

**✅ Lista de verificación**

- ✅ Cada fila del hub se vuelve exactamente `len(SENSORS)` entradas normalizadas.
- ✅ El esquema angosto es `ts, sensor, value, unit` — una observación por fila.
- ✅ No se necesita ningún `if` por sensor para conocer la unidad de una fila; la columna `unit` la lleva.

**🤔 Pregunta(s) socrática(s)**

- Ancho-a-largo es el movimiento de "canonicalizar una vez". ¿Qué sale mal *después* si lo saltas y en su lugar mantienes las columnas `thermostat`, `humidity`, `motion` y codificas a mano un `if name == "thermostat"` en tu lógica de alertas? Nombra el sensor futuro que hace colapsar esa cadena-`if`.
- `normalize` codifica a mano `sensor_cols` iterando `SENSORS`. Si se añade un nuevo tipo de sensor al registro, ¿`normalize` sigue funcionando sin ediciones — y por qué esa *propiedad* (columnas impulsadas por datos, no codificadas a mano) es la prueba real de "hub"?

## Paso 3: Alertas de umbral

Un hub que solo almacena es un log; la parte de *hub* es decidir que algo pasó. La alerta de umbral compara cada lectura contra el `low/high` seguro de su sensor y registra una fila de alerta cuando cae fuera. La escotilla `force` del Paso 1 hace esto *testeable* — disparas una alerta de manera determinista en lugar de esperar a la aleatoriedad.

**👟 Pista inicial:** Empieza escribiendo `ingest(row)` que normaliza la fila, busca el `low`/`high` de cada sensor en el registro y añade una alerta `out_of_range` cuando un valor cae fuera — luego fuerza un pico con `sample(force={"thermostat": 29.0})`.

```python
# hub.py (continuación)

ALERTS = []

def ingest(row: dict) -> None:
    for entry in normalize(row):
        lo, hi = None, None
        for s in SENSORS:
            if s.name == entry["sensor"]:
                lo, hi = s.low, s.high
                break
        value = entry["value"]
        if (hi is not None and value > hi) or (lo is not None and value < lo):
            ALERTS.append({**entry, "event": "out_of_range"})
            print(f"ALERT {entry['sensor']}: {value}{entry['unit']} outside {lo}-{hi}")

# force a thermometer spike and a normal tick
ingest(sample(force={"thermostat": 29.0}))
ingest(sample())
print("alerts:", len(ALERTS))
```

`ingest` es el pipeline de leer-y-reaccionar: normaliza la fila, busca el rango de umbral de ese sensor y añade una alerta (con la etiqueta de evento `out_of_range`) cuando el valor cruza. Como los termostatos son seguros en `low=15, high=26`, forzar 29.0 dispara la alerta; el tick tranquilo después no. El spread `{**entry, "event": ...}` copia la lectura *y* añade el marcador de alerta, así que una fila de alerta lleva todas las mismas columnas más una razón — exactamente lo que querrías en un log que auditas después.

**🎯 Resultado esperado:** Una sola línea `ALERT thermostat: 29.0C outside 15.0-26.0` para el pico forzado, `alerts: 1`, y una fila silenciosa para el tick normal.

**🩹 Si sale mal:** Si el pico forzado *no* alerta, `force` golpeó la columna equivocada o el `high` de `SENSORS` es `None` — imprime `make_registry()` y confirma `high=26`. Si *cada* tick alerta, la búsqueda de umbral está comparando contra el sensor equivocado (un fallo de `s.name == entry["sensor"]` que se comporta por defecto como `None` significa "sin umbral", así que un bug de `None is not None` alertaría sobre todo) — verifica que la rama de coincidencia resuelva. Si el tick tranquilo *también* pico por suerte, eso es aleatoriedad honesta — re-ejecuta con un noise más bajo; el camino forzado es en lo que afirmas.

**✅ Lista de verificación**

- ✅ El `thermostat=29.0` forzado dispara exactamente una alerta con `event="out_of_range"`.
- ✅ Un tick normal produce cero alertas.
- ✅ El desbordamiento (value > high) y el sub-desbordamiento (value < low) están ambos cubiertos por la comprobación de rango.

**🤔 Pregunta(s) socrática(s)**

- Las alertas viven en una lista Python (`ALERTS`) que muere cuando el proceso sale. ¿Cuál es el argumento de *persistencia* para escribir cada alerta a disco inmediatamente, y el contraargumento de *latencia* (una escritura a disco por alerta vs lotes) cuando un hub embebido diminuto no debe bloquear el bucle de lectura?
- La condición de alerta `value > high` trata dos lecturas de un pico *transitorio* igual que una altura *sostenida*. ¿Cómo se vería un "debounce" (requerir N ticks consecutivos dentro de rango antes del silencio) y por qué un umbral crudo es ruidoso para sensores binarios estilo-movimiento?

## Paso 4: Persiste historial y rastro de alertas

Un hub en vivo solo es útil mientras lo miras; una capa de *almacenamiento* lo convierte en un registro histórico que puedes re-analizar después. Este paso añade cada tick de filas normalizadas a `history.csv` y cada alerta a `alerts.csv`, enmarcando el CSV como la elección honesta sin base de datos para una serie de tiempo pequeña.

**👟 Pista inicial:** Empieza escribiendo `append_rows(path, rows)` que escribe el encabezado una vez (`if not path.exists()`) y luego añade con `csv.DictWriter` en modo `"a"`, luego conéctalo en `run_ticks(n)`.

```python
# hub.py (continuación)
import csv
from pathlib import Path

HIST = Path("history.csv")
ALERT_LOG = Path("alerts.csv")

def append_rows(path: Path, rows: list[dict]) -> None:
    if not rows:
        return
    if not path.exists():
        path.write_text(",".join(rows[0].keys()) + "\n")   # header once
    with path.open("a", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writerows(rows)

def run_ticks(n: int) -> None:
    for _ in range(n):
        row = sample()
        ingest(row)                       # alerts land on ALERTS + stdout
        append_rows(HIST, normalize(row))
        append_rows(ALERT_LOG, ALERTS)
        ALERTS.clear()

run_ticks(50)
print("history rows:", sum(1 for _ in open(HIST)) - 1)
print("alert rows  :", sum(1 for _ in open(ALERT_LOG)) - 1 if ALERT_LOG.exists() else 0)
```

`append_rows` escribe el encabezado *una vez* (`if not path.exists()`), luego añade con `csv.DictWriter` — el patrón de "escribe una vez, añade para siempre" que mantiene barata una serie de tiempo creciente. `run_ticks(50)` es todo el hub bajo un mismo techo: muestra → ingesta (que añade alertas en-proceso) → persiste historial y el lote de alertas actual → limpia el buffer por tick. En 50 ticks × 3 sensores obtienes ~150 filas de historial y (a menos que un paseo aleatorio pique) 0 filas de alerta; forzar un pico antes lo añadiría alertas a un `alerts.csv` real.

**🎯 Resultado esperado:** `history.csv` con un encabezado + ~150 filas (~50 ticks × 3 sensores), `alerts.csv` con un encabezado + las alertas que hayan corrido; las líneas de conteo imprimen los conteos de filas.

**🩹 Si sale mal:** Si el encabezado se escribe en *cada* añadido, `path.exists()` se comprobó después de escribir o el archivo se abre en modo `w` (truncando) — la escritura `if not path.exists()` debe preceder al añadido en modo `a`. Si `writerows` lanza un `ValueError` por una clave faltante, los dicts normalizados carecen de uno de los `fieldnames` — el esquema `sensor`/`value`/`unit` se desvió de `normalize`; alinéalos. Si `alerts.csv` está vacío después de un pico forzado, `append_rows(ALERT_LOG, ALERTS)` corrió antes de que se ingiriera el pico — ordena las llamadas `ingest` y luego `append`.

**✅ Lista de verificación**

- ✅ `history.csv` contiene exactamente 1 + 3*n filas de ticks con un solo encabezado.
- ✅ `alerts.csv` tiene una línea de encabezado y una fila por alerta vía prueba-`force`.
- ✅ Re-ejecutar `run_ticks(50)` *añade* en lugar de truncar los CSV.

**🤔 Pregunta(s) socrática(s)**

- La escritura de encabezado-una-vez es el equivalente CSV de una migración de esquema. Si la lista de columnas de un sensor cambia *a mitad del archivo* (digamos que se añade un cuarto sensor), ¿qué les pasa a las columnas de las filas existentes — y qué comportamiento de `DictWriter` enmascara o expone esa deriva?
- El CSV es amigable para añadir pero no tiene transacciones — un crash entre `writerows` para historial y para alertas deja los dos archivos desincronizados. Para un hub que debe tolerar pérdida de energía, ¿cuál es la alternativa *atómica* (escribir ambos en un temp, renombrar) que una capa de almacenamiento de un solo archivo proporciona gratis?

## Paso 5: Grafica el historial

Los números en un CSV son el material crudo; el *dashboard* es el producto que una persona realmente lee. Este paso carga `history.csv` en Matplotlib y dibuja dos subplots de series de tiempo — temperatura y humedad sobre sus umbrales — convirtiendo "¿se está calentando la habitación?" en un vistazo.

**👟 Pista inicial:** Empieza configurando `matplotlib.use("Agg")` primero, luego escribe `chart()` para leer `history.csv` con `csv.DictReader`, agrupar filas por sensor y graficar las transmisiones del termostato y la humedad con cercas `axhline` de umbral antes de `plt.savefig(out)`.

```python
# hub.py (continuación)
import matplotlib
matplotlib.use("Agg")                       # headless: save PNG, no window
import matplotlib.pyplot as plt
import csv

def chart(path: Path = HIST, out: str = "dashboard.png") -> None:
    rows = list(csv.DictReader(open(path)))
    by = {}
    for r in rows:
        by.setdefault(r["sensor"], []).append((r["ts"], float(r["value"])))
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(8, 6), sharex=True)
    th = by.get("thermostat", [])
    hu = by.get("humidity", [])
    ax1.plot([t for t, _ in th], [v for _, v in th]  if th else [], marker="o", label="thermostat")
    ax2.plot([t for t, _ in hu], [v for _, v in hu]  if hu else [], marker="o", label="humidity")
    ax1.axhline(26, color="r", ls="--"); ax1.axhline(15, color="r", ls="--")
    ax2.axhline(70, color="r", ls="--"); ax2.axhline(20, color="r", ls="--")
    ax1.set_ylabel("°C"); ax2.set_ylabel("%")
    ax2.set_xlabel("time"); ax2.tick_params(axis="x", rotation=30)
    for ax in (ax1, ax2):
        ax.legend(); ax.grid(alpha=0.3)
    plt.tight_layout(); plt.savefig(out)
    print("wrote", out)

chart()
```

`matplotlib.use("Agg")` fuerza un backend sin pantalla — sin ventana de visualización, solo un `dashboard.png` guardado — que es lo que convierte este script en un reporte *cron-eable* en lugar de una herramienta interactiva. El código es deliberadamente explícito (`.setdefault` agrupa por sensor; `axhline` dibuja las cercas de rango seguro; los tiempos son strings ISO crudos para que Matplotlib los trate como etiquetas). Las cercas son el mensaje del dashboard: lecturas que rebotan cruzando la línea roja punteada son las cosas que un humano quiere notar, y 50 ticks simulados bajo `high` no cruzarán mayormente — pero un pico forzado sí.

**🎯 Resultado esperado:** `dashboard.png` escrito (guardado, sin popup) — dos subplots: termostato °C sobre el tiempo con cercas rojas en 15/26, humedad % en 20/70, ambos fluctuando alrededor de sus bases.

**🩹 Si sale mal:** Si `plt.savefig` lanza `RuntimeError` sobre el backend, `Agg` no surtió efecto antes de que se creara una figura — configúralo como la *primera* llamada a matplotlib (antes de que `pyplot` se use). Si el eje x está vacío o rotado de forma extraña, las marcas de tiempo ISO se renderizan como strings — castea `ts` con `datetime.strptime` o deja que las etiquetas de string estén; para un gráfico de fluctuación de 50 puntos, las etiquetas de string son honestas. Si un subplot está en blanco, `by.get("sensor")` devolvió `[]` para un sensor faltante — confirma que el CSV realmente tiene una columna `humidity`.

**✅ Lista de verificación**

- ✅ `dashboard.png` existe y muestra ambos subplots con umbrales rojos claros.
- ✅ El gráfico se renderiza sin pantalla (`Agg`) — ninguna ventana bloquea una ejecución de script.
- ✅ Leer el archivo de vuelta impulsa el gráfico, así que re-ejecutar después de más ticks muestra la tendencia actualizada.

**🤔 Pregunta(s) socrática(s)**

- `sharex=True` fuerza el mismo eje x en ambos subplots. Cuando las dos transmisiones de sensores tienen dinámicas muy diferentes (la temperatura avanza lenta, el movimiento pica), ¿qué *esconde* compartir el eje sobre la transmisión más ruidosa — y cuándo contarían ejes independientes la historia honesta mejor?
- Un dashboard muestra un día de datos, y un pico que cruza la cerca es obvio. ¿Cuál es la señal *sorprendente* que un gráfico de líneas crudo *no puede* mostrar pero una media *móvil* (promediando los últimos N ticks) revela de forma fiable — y cuál es el costo de latencia del suavizado que esconde un pico rápido?

## ⚠️ Errores comunes

- **Sensor aleatorio ≠ prueba determinista.** `random.gauss` hace que las repeticiones no sean reproducibles. Afirma alertas vía la escotilla `force` (`sample(force={"thermostat": 29.0})`), nunca esperando que un paseo aleatorio cruce un umbral en los primeros 50 ticks.
- **Filas anchas para siempre.** Mantener `thermostat`, `humidity`, `motion` como columnas y `if name == ...` por sensor significa que añadir un sensor significa editar el bucle. Normaliza a `(ts, sensor, value, unit)` una vez y deja que los datos impulsen la lógica.
- **Re-escribir el encabezado en cada añadido.** Abrir en modo `w` trunca el historial. Usa añadido-`a` y escribe el encabezado solo cuando el archivo no exista todavía — el invariante de un solo encabezado es lo que mantiene consistentes los análisis `csv.DictReader` posteriores.
- **Saltarse el backend sin pantalla.** Un `savefig` que abre una ventana bloquea el bucle en una GUI que puede que no tengas. `matplotlib.use("Agg")` *primero* convierte el gráfico en un archivo sin efectos secundarios que el hub puede emitir según un horario.
- **Olvidar el orden de `force`.** Pasar `force` a `sample` *antes* del bucle de sensores significa que el bucle pisotea tu sobrescritura. Aplica `force` *después* de las lecturas para que la inyección realmente aterrice.

## Lo que acabas de construir

Un hub de sensores IoT honesto: modelaste tres tipos de sensores, los emulaste en un bucle de ticks configurable, normalizaste lecturas heterogéneas en un log de series de tiempo unificado, disparaste alertas de umbral con una escotilla de inyección, persististe historial y alertas a CSV y graficaste el resultado con un dashboard de Matplotlib sin pantalla. Las ideas transferibles escalan más allá de un mock: el patrón de inyección-`force` es cómo haces *testeable* a un sistema en vivo; la normalización ancho-a-largo es la disciplina de esquema que toda herramienta downstream espera; y los hábitos de "un encabezado, añade para siempre, renderiza sin pantalla" son la diferencia entre un script de garabato y un dashboard en el que un monitor de habitación puede confiar de verdad.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/sensor-hub/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/sensor-hub) en el repositorio del curso agrupa el módulo del hub, el registro de sensores y un notebook que tica, ingiere, persiste y grafica en línea (el gráfico se renderiza como salida de celda). Clónalo, o abre todo el repositorio en un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y mira la habitación calentarse en pantalla.
:::

## A dónde ir desde aquí

- **MQTT real (opcional):** instala `paho-mqtt` y reemplaza el sim de `sample()` con un manejador `client.on_message` — la lógica del hub sigue igual; solo la "fuente" cambia de `sim` a `mqtt`, que es exactamente el intercambio que el diseño anticipó.
- **Un reporte de `dashboard` según un horario:** envuelve `run_ticks(60)` + `chart()` en un bucle `while True: sleep(60)` (o una línea de cron) para que un monitor de habitación emita un PNG fresco cada minuto.
- **Detección de anomalías (stretch):** en lugar de umbrales duros, calcula una media/desviación estándar móvil y alerta cuando una lectura se desvía `> 3σ` de la ventana reciente — la señal "sorprendente" del gancho socrático del Paso 5.
- **Un registro de complementos:** convierte `make_registry` en una API `register(name, reader)` para que nuevos tipos de sensores se auto-agreguen sin editar `SENSORS` — la lección de columnas impulsadas por datos, promovida a arquitectura.

## Comparte tu proyecto con la clase

¿Monitoreaste una habitación (simulada), atrapaste un pico forzado, o conectaste un gráfico que te gusta? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README recorre cómo añadir el tuyo vía un **pull request** de principio a fin: fork, rama, commit y abrir el PR. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓