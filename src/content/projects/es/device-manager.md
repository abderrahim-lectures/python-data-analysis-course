---
title: "Gestor de Dispositivos"
description: "Gestiona dispositivos IoT con configuración remota, actualizaciones de firmware y monitoreo de salud."
difficulty: "beginner"
estimatedMinutes: 60
tags: ["cli", "json", "datetimes", "file-persistence"]
prerequisites:
  - "Fundamentos de Python (listas, diccionarios, bucles, funciones)"
  - "Abrir y leer archivos"
learningObjectives:
  - "Cargar un registro de dispositivos desde JSON y mantenerlo ordenado por id de dispositivo"
  - "Medir la antigüedad del heartbeat con aritmética de datetime y clasificar la salud del dispositivo"
  - "Detectar desviación de firmware contra un mapa de últimas versiones"
  - "Resolver la configuración efectiva de cada dispositivo superponiendo anulaciones por habitación"
  - "Imprimir un informe de flota y exponerlo como CLI"
---

# 📡 Construir un Gestor de Dispositivos

Una flota de dispositivos conectados es una pila creciente de problemas pequeños hasta que alguien la rastrea: los sensores reportan un heartbeat y luego se callan, `cam-01` lleva seis días en silencio, dos de tus tres sensores `temp-hum` van un release de firmware atrás, y el sensor del garaje debería alertar a −5 °C mientras el resto advierte a 28. Un gestor de dispositivos convierte esos hechos dispersos en un registro que puedes ordenar, un veredicto de salud por dispositivo, una cola de actualización, una configuración resuelta por dispositivo y un informe de flota en una sola pantalla, todo desde JSON y un poco de aritmética de `datetime`, sin necesidad de red.

Esto asume Python 101, listas, diccionarios, bucles, funciones, además de comodidad para abrir archivos. No se requiere nada del módulo de Análisis de Datos. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa, en crecimiento.

## 🎯 Lo que harás

1. Cargar un registro de dispositivos desde `devices.json`, ordenado por id.
2. Clasificar la salud de cada dispositivo según cuánto tiempo pasó desde su último heartbeat (online / warning / offline).
3. Comparar el firmware de cada dispositivo contra el último de su modelo y construir una cola de actualización.
4. Resolver la configuración efectiva de cada dispositivo superponiendo anulaciones a nivel de habitación sobre los defaults del modelo.
5. Imprimir un informe de flota agrupado por habitación y enviarlo como una pequeña CLI.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino recomendado, un gestor de dispositivos es una herramienta de persistencia de archivos (tu propio `devices.json`), y eso vive en un sistema de archivos real.

**GitHub Codespaces** es una alternativa sin configuración: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node y Python ya están instalados) y ejecuta los mismos comandos desde una terminal del navegador.

**Google Colab, Kaggle Notebooks, o Binder** funcionan para cada paso, el notebook en [`examples/device-manager/notebook.es.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/device-manager/notebook.es.ipynb) ejecuta la misma lógica de flota sobre el registro de cuatro dispositivos incluido en memoria. El trade-off honesto: un notebook no puede mantener un archivo actualizado como sí puede una CLI.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/device-manager/notebook.es.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/device-manager/notebook.es.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdevice-manager%2Fnotebook.es.ipynb)

## Configuración

`uv` es una sola herramienta que reemplaza la cadena "instalar Python, luego pip, luego una herramienta de entornos virtuales", y este proyecto es biblioteca estándar pura.

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Cierra y vuelve a abrir tu terminal, y confirma que quedó instalado:

```bash
uv --version
```

Luego configura el proyecto:

```bash
uv init device-manager
cd device-manager
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `device-manager/` existe con un `pyproject.toml`.
- ✅ `python -c "import json, datetime"` tiene éxito, sin paquetes de terceros.

## Paso 1: Cargar el registro de dispositivos

Cada decisión aguas abajo necesita el mismo punto de partida: la lista completa y ordenada de dispositivos. Un registro no es más que JSON, un registro por dispositivo con id, nombre, habitación, modelo, firmware y último heartbeat, y cargarlo significa abrir el archivo, analizar dos vistas, y decidir un *orden estable* en el que te apoyarás durante todo el proyecto.

### 1.1 Crear `devices.json` y `registry.py`

**👟 Pista inicial :** Guarda el registro, y luego haz que `load_devices()` lo devuelva con `sorted(...)` por id de dispositivo para que cada informe sea determinista:

```bash
cat > devices.json <<'EOF'
[
  {"id": "th-01", "name": "Living Room Sensor", "room": "living", "model": "temp-hum", "firmware": "1.2.0", "last_seen": "2026-09-06T08:15:00"},
  {"id": "th-02", "name": "Kitchen Sensor", "room": "kitchen", "model": "temp-hum", "firmware": "1.2.0", "last_seen": "2026-09-06T09:00:00"},
  {"id": "cam-01", "name": "Front Door Camera", "room": "entry", "model": "cam-1080", "firmware": "2.0.5", "last_seen": "2026-08-30T22:10:00"},
  {"id": "th-03", "name": "Garage Sensor", "room": "garage", "model": "temp-hum", "firmware": "1.1.9", "last_seen": "2026-09-06T06:40:00"}
]
EOF
```

```python
# registry.py
import json

def load_devices(path: str = "devices.json") -> list[dict]:
    with open(path) as f:
        devices = json.load(f)
    return sorted(devices, key=lambda d: d["id"])

if __name__ == "__main__":
    for d in load_devices():
        print(f"{d['id']:<8} {d['name']:<22} {d['model']:<10} firmware {d['firmware']}  ({d['room']})")
```

```bash
uv run python registry.py
```

`sorted(devices, key=lambda d: d["id"])` es la decisión silenciosa que mantiene aburrido a cada paso posterior en el buen sentido: `fleet_report` mostrará `cam-01` antes que `th-01` *porque el cargador ordena*, así que ninguna otra función vuelve a implementar esa regla. Los anchos de formato `:<8` / `:<22` son el comienzo de cada tabla bonita de este proyecto, una columna a la izquierda de ancho fijo.

**🎯 Resultado esperado :**

```
cam-01   Front Door Camera      cam-1080   firmware 2.0.5  (entry)
th-01    Living Room Sensor     temp-hum   firmware 1.2.0  (living)
th-02    Kitchen Sensor         temp-hum   firmware 1.2.0  (kitchen)
th-03    Garage Sensor          temp-hum   firmware 1.1.9  (garage)
```

**🩹 Si sale mal :** Si el orden es th-01 antes que cam-01, el `sorted` o bien falta dentro de `load_devices` o está ordenando otro campo (`key=lambda d: d["id"]`, no `d["name"]`). Si se dispara `json.decoder.JSONDecodeError`, el heredoc escribió JSON malformado, al `]` final le falta un último registro sin coma; `json.load` es despiadado con una coma que falta.

### 1.2 Verifica el registro

**✅ Lista de verificación**

- ✅ `load_devices()` devuelve cuatro dicts ordenados por `id` ascendente.
- ✅ Cada dispositivo tiene las seis claves (`id`, `name`, `room`, `model`, `firmware`, `last_seen`).
- ✅ Volver a ejecutar la demo imprime una salida idéntica, JSON conserva el layout, el ordenamiento lo vuelve estable.

**🤔 Pregunta(s) socrática(s)**

- El registro no tiene ningún campo `status`, la salud se *calculará* a partir de `last_seen` en el Paso 2. ¿Por qué guardar "online" en el JSON es una idea peor que recomputarlo siempre a partir del heartbeat?
- Los IDs son legibles para humanos (`th-01`) en lugar de aleatorios. ¿Cuándo es un id legible para humanos una trampa (`th-10` se ordena antes que `th-2` léxicamente, mira `sorted` sin una clave)? ¿Qué propiedad del ordenamiento de strings hace que los ids necesiten relleno?

## Paso 2: Juzgar la salud a partir de los heartbeats

La pieza más útil de inteligencia de flota es "cuánto tiempo pasó desde que cada dispositivo habló por última vez". La aritmética de `datetime` convierte una cadena `last_seen` en una antigüedad, y un veredicto de salud es entonces una pequeña decisión de umbrales: momentos → online, menos de un par de horas → warning, más de medio día → offline. Mismo conjunto de reglas, cada dispositivo, sin campo que se desincronice.

### 2.1 Escribir `health.py`

**👟 Pista inicial :** Analiza `last_seen` con `datetime.fromisoformat`, réstalo de un "ahora" de referencia fijo, y clasifica el `timedelta` resultante con una cadena de comparaciones:

```python
# health.py
from datetime import datetime, timedelta

from registry import load_devices

NOW = datetime.fromisoformat("2026-09-06T09:05:00")

def age_of(device: dict, now: datetime = NOW) -> timedelta:
    return now - datetime.fromisoformat(device["last_seen"])

def health_status(age: timedelta) -> str:
    if age > timedelta(hours=12):
        return "offline"
    if age > timedelta(minutes=30):
        return "warning"
    return "online"

if __name__ == "__main__":
    for d in load_devices():
        age = age_of(d)
        print(f"{d['id']:<8} {health_status(age):<8} age {age}")
```

`NOW` es el truco honesto para un sistema sin baterías: el código de heartbeats real compara contra `datetime.now()`, que rompe la reproducibilidad de las pruebas y las capturas de pantalla. Aquí `NOW` es un instante fijo, pasado como default, así la salida de la demo es estable *y* un llamador puede anularlo con el reloj en vivo. Mira lo que significan los límites para un humano: offline no es "dispositivo apagado", es literalmente "nada se ha oído de esta cosa durante doce horas", que es el veredicto por el que le localizas a alguien.

**🎯 Resultado esperado :**

```
cam-01   offline  age 6 days, 10:55:00
th-01    warning  age 0:50:00
th-02    online   age 0:05:00
th-03    warning  age 2:25:00
```

**🩹 Si sale mal :** Si cada antigüedad lee `0:00:00`, pasaste `datetime.now()` en algún lugar *después* de la construcción del default, borra el argumento y deja que se use `NOW`. Si las marcas de tiempo lanzan `ValueError`, la cadena ISO contiene un sufijo `Z` (marcador UTC) que `fromisoformat` de esta versión de Python no acepta, reemplaza `Z` por `+00:00` antes de analizar, y trátalo como una trampa de formato de datos del mundo real ante la que acabas de subir de nivel.

### 2.2 Verifica la verificación de salud

**✅ Lista de verificación**

- ✅ `cam-01` (6 días 10 h) → offline; `th-03` (2 h 25 m) → warning; `th-02` (5 m) → online.
- ✅ El límite de 30 minutos es "warning a más de 30 minutos", no "online hasta el 31", una *antigüedad de exactamente* 30:00 es `online`.
- ✅ `health_status` no necesita el dict del dispositivo, solo toma el `timedelta`, así que dos dispositivos cualesquiera con la misma antigüedad obtienen el mismo veredicto.

**🤔 Pregunta(s) socrática(s)**

- Los umbrales enteros (30 minutos, 12 horas) codifican una política de triaje. ¿Qué cambia en `health_status` si quieres que "los congeladores médicos localicen a los 10 minutos de silencio pero las cámaras a los 2 días", y dice algo la firma de la función sobre quién es dueño de esa elección?
- `cam-01` está "offline" a los 6 días. Si el registro en su lugar *tuviera* un campo `status: "offline"` guardado (el anti-patrón del Paso 1), ¿cuál es la primera cosa que pasa en el momento en que un monitor rellena un heartbeat pero nadie cambia el campo guardado de vuelta?

## Paso 3: Detectar desviación de firmware

"Desactualizado" es una comparación: la cadena de firmware de cada dispositivo contra la versión más nueva publicada para *su* modelo. Las cadenas de versión no son números, así que las comparas correctamente dividiendo por puntos y comparando tuplas de enteros, `(1, 2, 0) < (1, 3, 0)` es `True` en toda clase de Python que importa, y `"1.2.0" < "1.3.0"` funciona de casualidad también, pero solo hasta que *2.0.0* quede junto a *11.0.0*.

### 3.1 Escribir `firmware.py`

**👟 Pista inicial :** Un mapa `LATEST` por modelo, un divisor `version_tuple`, y un predicado `needs_update` que los compone:

```python
# firmware.py
from registry import load_devices

LATEST = {"temp-hum": "1.3.0", "cam-1080": "2.0.5"}

def version_tuple(version: str) -> tuple[int, ...]:
    return tuple(int(part) for part in version.split("."))

def needs_update(device: dict) -> bool:
    target = LATEST[device["model"]]
    return version_tuple(device["firmware"]) < version_tuple(target)

if __name__ == "__main__":
    for d in load_devices():
        target = LATEST[d["model"]]
        flag = f"-> update to {target}" if needs_update(d) else "up to date"
        print(f"{d['id']:<8} {d['model']:<10} {d['firmware']:<8} {flag}")
```

Tres de cuatro dispositivos van un release atrás en `temp-hum` y uno está al día, buena demo, porque el que está al día prueba que la comparación no se limita a marcar todo. El predicado `needs_update` no tiene estado: sin cola de actualización que cargar, sin "última corrida de actualización" que guardar, solo *dispositivo → booleano* según el mapa `LATEST`. Nota lo que este paso deliberadamente no hace: reporta lo que *se actualizaría*, en realidad enviar versiones por la red es territorio de OTA de firmware, y falsificarás el acuse de recibo en el informe.

**🎯 Resultado esperado :**

```
cam-01   cam-1080   2.0.5    up to date
th-01    temp-hum   1.2.0    -> update to 1.3.0
th-02    temp-hum   1.2.0    -> update to 1.3.0
th-03    temp-hum   1.1.9    -> update to 1.3.0
```

**🩹 Si sale mal :** Si *cada* dispositivo reporta `up to date`, `version_tuple` probablemente está dividiendo en otra cosa ("`1.2.0rc1`" se divide en cuatro pedazos, pero la demo usa versiones de tres partes), verifica que la conversión a int no se esté atragantando con un marcador de pre-release. Si un modelo desconocido lanza `KeyError`, esa es la reacción *correcta* (una flota con información de firmware faltante es un problema de datos, no uno que se tolera), pero quizá prefieras `LATEST.get(model)` devolviendo `None` para los dispositivos que de verdad no rastreas.

### 3.2 Verifica la desviación de firmware

**✅ Lista de verificación**

- ✅ `version_tuple("1.2.0") == (1, 2, 0)` y `(1, 2, 0) < (1, 3, 0)`, tuplas de int, así que `2.10` le gana a `2.9` numéricamente.
- ✅ `cam-01` reporta al día (su 2.0.5 iguala el objetivo del mapa); tres dispositivos `temp-hum` programan una actualización a 1.3.0.
- ✅ La demo opera sobre el registro ordenado de `load_devices()`, así que las filas siempre se imprimen en el orden del Paso 1.

**🤔 Pregunta(s) socrática(s)**

- `LATEST` es un dict codificado en el código fuente. En producción vendría de la API del fabricante o de un manifiesto. ¿Qué *contrato* ya satisface `needs_update` (dispositivo, dict solamente) en el que un feed de versiones simplemente se enchufa, es decir, qué forma tendría que tener el endpoint del fabricante para que nada más del código cambiara?
- `th-03` va en 1.1.9 mientras sus hermanos van en 1.2.0, mismo modelo, release más viejo. ¿Qué causas de "sesgo de firmware de flota" (además de la pereza) ayuda a ver realmente a un stakeholder un informe que muestra *modelo+release* por fila?

## Paso 4: Resolver la configuración efectiva

La configuración es *por capas*: cada `temp-hum` por defecto alerta a 28 °C, pero el del garaje debería alertar a −5 °C. El patrón es defaults → defaults de modelo → anulaciones de habitación → anulaciones por dispositivo (la última gana), y la palabra correcta para la salida es la configuración *efectiva*, el único dict que un dispositivo realmente ejecuta, después de que todas las capas se pliegan.

### 4.1 Escribir el resolvedor

**👟 Pista inicial :** Copia los defaults del modelo, luego haz `.update()` con las anulaciones a nivel de habitación (y deja espacio para una pasada a nivel de dispositivo después):

```python
# config.py
from registry import load_devices

DEFAULTS = {
    "temp-hum": {"poll_rate_s": 60, "alert_threshold_c": 28, "units": "c"},
    "cam-1080": {"recording": False, "motion": True, "retention_days": 7},
}
ROOM_OVERRIDES = {"garage": {"alert_threshold_c": -5}, "entry": {"recording": True}}

def resolve_config(device: dict) -> dict:
    config = dict(DEFAULTS[device["model"]])
    config.update(ROOM_OVERRIDES.get(device["room"], {}))
    return config

if __name__ == "__main__":
    for d in load_devices():
        print(f"{d['id']:<8} {resolve_config(d)}")
```

`dict(DEFAULTS[...])` *copia* los defaults compartidos del modelo antes de `.update()`, esa copia es la diferencia entre "el garaje obtiene −5 mientras el living se queda en 28" y "cada `temp-hum` hereda silenciosamente −5 porque todos comparten un dict en memoria". Plantear esto como un pipeline (defaults → anulaciones) en lugar de escribir un dict `winter` y un dict `summer` mantiene cada dispositivo sobre una verdad *derivada*: cuando cambias las unidades a `f`, una sola capa base lo actualiza en toda la flota.

**🎯 Resultado esperado :**

```
cam-01   {'recording': True, 'motion': True, 'retention_days': 7}
th-01    {'poll_rate_s': 60, 'alert_threshold_c': 28, 'units': 'c'}
th-02    {'poll_rate_s': 60, 'alert_threshold_c': 28, 'units': 'c'}
th-03    {'poll_rate_s': 60, 'alert_threshold_c': -5, 'units': 'c'}
```

**🩹 Si sale mal :** Si th-01 también muestra `-5`, `resolve_config` está mutando `DEFAULTS[model]` en el lugar (el `.update` ocurre sobre el dict compartido, no sobre la copia). Si la cámara de la entrada perdió `recording`, una rama `else` está reemplazando toda la configuración en lugar de fusionar, la guardia `ROOM_OVERRIDES.get(device["room"], {})` debería ser una *fusión vacía*, nunca un reemplazo.

### 4.2 Verifica la resolución de configuración

**✅ Lista de verificación**

- ✅ `th-03` tiene `alert_threshold_c: -5`; `th-01` y `th-02` conservan el default de 28, la anulación del garaje tocó un solo dispositivo.
- ✅ `cam-01` cambia `recording` del default `False` a `True`; cada otra clave `cam-1080` queda sin cambios.
- ✅ El propio dict de defaults queda intacto después de la corrida (cada llamada obtuvo una copia).

**🤔 Pregunta(s) socrática(s)**

- Las anulaciones por habitación se parecen a una *política*: "el garaje se congela". Si el mismo tipo de dispositivo lo usan dos inquilinos con necesidades distintas, tus capas necesitarían un paso por inquilino. ¿Dónde en este pipeline pertenece por-inquilino (antes o después de la capa de habitación), y cómo lo ordenaría una función de fusión sin contradecir la anulación de habitación?
- El dict resuelto tiene un `alert_threshold_c` que un dispositivo podría no honrar (firmware con polvo). ¿Cuál es la diferencia entre la configuración *deseada* y la configuración *aplicada*, y por cuál de las dos es genuinamente responsable esta función?

## Paso 5: Informe de flota y CLI

Las cuatro capacidades son funciones; el entregable es la única pantalla que lo muestra todo: agrupada por habitación, una línea por dispositivo con su salud, y una línea de resumen. Luego el mismo informe obtiene una CLI de una sola bandera para que "¿qué está haciendo la flota?" sea un comando en lugar de cinco corridas de `__main__`.

### 5.1 Escribir `report.py` y `manage.py`

**👟 Pista inicial :** Reutiliza `age_of`/`health_status` del Paso 2, agrupa por habitación con un conjunto de habitaciones ordenado, cuenta estados con `collections.Counter`, y deja que `manage.py --report` imprima todo:

```python
# report.py
from collections import Counter

from health import NOW, age_of, health_status
from registry import load_devices

def fleet_report(devices: list[dict] | None = None, now=NOW) -> str:
    if devices is None:
        devices = load_devices()
    lines = [f"Fleet report — {len(devices)} devices"]
    statuses = Counter()
    for room in sorted({d["room"] for d in devices}):
        lines.append(f"== {room}")
        for d in devices:
            if d["room"] != room:
                continue
            status = health_status(age_of(d, now))
            statuses[status] += 1
            lines.append(f"  {d['id']:<8} {d['name']:<22} {status}")
    counts = ", ".join(f"{n} {s}" for s, n in sorted(statuses.items()))
    lines.append(f"summary: {counts}")
    return "\n".join(lines)
```

```python
# manage.py
import argparse

from report import fleet_report

def main() -> None:
    parser = argparse.ArgumentParser(description="Manage a fleet of devices.")
    parser.add_argument("--report", action="store_true")
    args = parser.parse_args()
    if args.report:
        print(fleet_report())
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
```

```bash
uv run python manage.py --report
```

El informe es *composición en lugar de ramificaciones*: solo orquesta funciones que ya construiste (`health_status`, `age_of`, `load_devices`), por eso tiene ~12 líneas. `Counter()` con una clave string es el momento de un solo truco nuevo, `statuses["offline"] += 1` mágicamente empieza en 0 en lugar de lanzar, que es lo conveniente que `dict` no hace. La bandera `action="store_true"` mantiene la CLI en un solo verbo (`--report`), lo cual es exactamente suficiente para este proyecto y un techo muy deliberado, los gestores de dispositivos reales crecen hacia `--update`, `--push-config`, `--add-device`, y tu arquitectura ya tiene las funciones que esos verbos llamarían.

**🎯 Resultado esperado :**

```
Fleet report — 4 devices
== entry
  cam-01   Front Door Camera      offline
== garage
  th-03    Garage Sensor          warning
== kitchen
  th-02    Kitchen Sensor         online
== living
  th-01    Living Room Sensor     warning
summary: 1 offline, 1 online, 2 warning
```

**🩹 Si sale mal :** Si el resumen dice `0 offline`, el `Counter` se está incrementando sobre un *booleano crudo* (`statuses[is_offline]`) en lugar de la cadena de estado. Si `--report` imprime la ayuda de argparse en lugar de la flota, la rama `if args.report:` está verificando otra cosa, confirma que lea `args.report`, el atributo de `store_true`.

### 5.2 Verifica el informe de flota

**✅ Lista de verificación**

- ✅ Las habitaciones aparecen alfabéticamente; los dispositivos dentro de una habitación conservan el orden de `load_devices()` (ordenación por id).
- ✅ Los recuentos del resumen suman 4 y coinciden con las líneas por dispositivo (1 offline / 1 online / 2 warning).
- ✅ `uv run python manage.py --report` imprime el informe; sin bandera imprime el uso

**🤔 Pregunta(s) socrática(s)**

- El resumen es `sorted(statuses.items())`, un orden *alfabético* de los nombres de estado. Si prefieres resumir "1 offline, 2 warning, 1 online" en orden de severidad, ¿qué argumento de `sorted` (con un pequeño helper) lo arregla, y vale la pena el orden de severidad las dos líneas extra?
- `fleet_report` tiene parámetros `devices` y `now` con defaults. ¿Quién (un humano, un cron job, una prueba) la llama con un `now` *distinto*, y qué dice ese parámetro sobre la parte del informe que es una instantánea en lugar de una verdad en vivo?

## ⚠️ Errores comunes

- **Guardar el estado en lugar de calcularlo.** Un campo `"online"` guardado se vuelve obsoleto en el momento en que un heartbeat llega o muere. Deriva la salud de `last_seen`; nunca confíes en un veredicto persistido.
- **Ordenar por string cuando un número se esconde detrás de una string.** `cam-2` se ordena *después* de `cam-10` léxicamente. Si los IDs alguna vez pasan de 9, rellénalos (`cam-02`) u ordena con una clave int, el `sorted(... by id)` del registro se reordenará silenciosamente en el peor momento posible.
- **Sorpresas de forma de zona horaria.** `2026-09-06T08:15:00Z` (un `Z` al final) estrella `fromisoformat` en la mayoría de los Pythons. Maneja la normalización `Z → +00:00` exactamente una vez, en `age_of`, no en cada sitio de llamada.
- **Mutar el dict de defaults compartido.** `DEFAULTS[model].update(...)` sin una copia hace que cada dispositivo herede la primera anulación. `dict(DEFAULTS[model])` primero, *luego* update.
- **Comparaciones de versión hechas como strings.** `"2.10.0" < "2.9.0"` es `True` léxicamente y absurdo semánticamente. Convierte versiones a tupla antes de comparar, una vez, en un lugar, en todos lados.

## Lo que acabas de construir

Un gestor de dispositivos de cuatro capas: registro (JSON ordenado), salud (calculada a partir de la antigüedad del heartbeat), detección de desviación de firmware y resolución de configuración por capas, todo compuesto en un único `manage.py --report`. El patrón para llevar adelante es *derivar, no guardar*: salud, necesidad de actualización y configuración efectiva son todas funciones del registro, así que el registro nunca miente sobre lo que está al día, y cada nuevo informe o comando que añadas es un consumidor más de la misma fuente honesta, ordenada y versionada.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/device-manager/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/device-manager) en el repositorio del curso tiene los scripts completos más un `devices.json` inicial. O abre todo el repositorio en un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## A dónde ir desde aquí

- Añade una capa de anulación a nivel de dispositivo (`PER_DEVICE`) que le gane a la capa de habitación, la regla de que una cuarta parte de tus habitaciones se congela, sin tocar los defaults de las habitaciones.
- Emite una **instantánea JSON** del informe de flota (`manage.py --report --json`), una vista legible por máquina de las mismas letras que lee un humano.
- Rastrea el **historial de cambios de configuración**: `resolve_config` gana un `when` y un `who`, y el informe gana una bandera `--changes` que muestra las últimas N acciones.
- Simula **acuses de recibo OTA**: `needs_update` devuelve un objetivo pero nada guarda un ack, añade `ack_at` al registro, y el informe de flota marca los dispositivos "actualización pendiente".

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientes orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README tiene una guía completa, amigable para principiantes, para agregar el tuyo mediante un **pull request**, incluso si nunca has usado git: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, paso a paso. No se asume experiencia previa en git.

Bienvenido a escribir Python fuera del navegador. 🎓