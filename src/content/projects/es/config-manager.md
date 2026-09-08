---
title: "Gestor de Configuración"
description: "Gestionar configs de aplicaciones en múltiples entornos con validación, cifrado y detección de deriva."
difficulty: "beginner"
estimatedMinutes: 45
tags: ["cli", "config", "toml", "stdlib"]
prerequisites:
  - "Fundamentos de Python (variables, loops, funciones, diccionarios)"
learningObjectives:
  - "Fusionar config de valores predeterminados, archivos y variables de entorno en un solo dict"
  - "Leer archivos de config TOML con el tomllib de la biblioteca estándar"
  - "Validar claves requeridas y tipos contra un esquema"
  - "Redactar automáticamente valores secretos en cualquier volcado legible para humanos"
  - "Envolver carga, validación e inspección en un solo CLI"
---

# ⚙️ Construir un Gestor de Configuración

Toda aplicación real tiene configuración que nunca debería ir hardcodeada: qué puerto vincular, qué nivel de log usar, qué claves de API confiar. La forma estándar de organizarla es *en capas* — valores predeterminados sensatos, reemplazados por un archivo de config por entorno, reemplazados por variables de entorno — así que "ejecutarlo localmente" y "ejecutarlo en producción" difieren sin que nadie edite código. Este proyecto construye exactamente ese cargador: una pequeña librería que fusiona valores predeterminados, JSON y TOML con reemplazos de variables de entorno, valida el resultado contra un esquema y — lo crucial — nunca imprime un secreto.

Esto asume Python 101 (diccionarios, funciones y `json` a nivel `import`) — no se requiere nada de Análisis de Datos. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa, en crecimiento.

## 🎯 Lo que harás

1. Escribir un merge recursivo que combine tres capas de config en el orden correcto.
2. Cargar un archivo de config TOML con el módulo `tomllib` integrado de Python.
3. Validar la config fusionada contra un esquema de claves y tipos requeridos.
4. Detectar claves con aspecto de secreto y redactarlas de cualquier salida.
5. Ejecutar todo como un CLI que imprime un resumen de config seguro y validado.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino recomendado — la versión "real" de este proyecto lee archivos reales del disco y variables de entorno reales, que es exactamente lo que un notebook no tiene, así que el CLI local es su hogar honesto. El setup es corto porque todo el proyecto usa la biblioteca estándar de Python (más `tomllib`, incluido desde Python 3.11).

**GitHub Codespaces** es una alternativa sin setup: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python y `uv` ya están instalados) y ejecuta los mismos comandos desde una terminal del navegador.

**Google Colab, Kaggle Notebooks o Binder** son una buena manera de *aprender los conceptos* — la versión en notebook de [`examples/config-manager/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/config-manager/notebook.ipynb) ejecuta cada función con archivos de muestra incluidos. La limitación honesta: un notebook no puede ver las variables de entorno de tu propia máquina, así que la capa de env vars se demuestra con un reemplazo simulado.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/config-manager/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/config-manager/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fconfig-manager%2Fnotebook.ipynb)

## Configuración

`uv` es una sola herramienta que reemplaza la cadena "instalar Python, luego pip, luego una herramienta de entorno virtual" — y este proyecto no tiene ningún paquete de terceros, así que una vez que tienes un Python estás genuinamente listo.

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
uv init config-manager
cd config-manager
uv python pin 3.12
```

`uv python pin 3.12` (o cualquier 3.11+) importa aquí: el lector de TOML `tomllib` solo existe desde Python 3.11, así que fijar la versión garantiza que la característica que usarás en el Paso 2 esté presente.

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `config-manager/` existe con un `pyproject.toml`.
- ✅ `python -c "import tomllib"` tiene éxito en la versión que `uv` fijó.

## Paso 1: Fusionar configuración en capas

Los sistemas de config son casi siempre un *pipeline de reemplazos*: empieza con `DEFAULTS`, superpones un archivo por entorno, y luego dejas que ganen las variables de entorno. El merge es el corazón — y la sutileza es que la config es *anidada*, así que `{"app": {"port": 9000}}` debe actualizar `{"app": {"name": "demo", "port": 8000}}` sin borrar `name`.

### 1.1 Escribir un merge profundo y las dos primeras capas

**👟 Pista inicial :** Escribe `deep_merge` — que recurre solo cuando *ambos* lados son dicts, reemplazando en caso contrario, que es lo que preserva las claves intocadas — y luego combínalo con un archivo JSON y variables de entorno coercidas:

```python
# layers.py
import json
import os

DEFAULTS = {"app": {"name": "demo", "port": 8000}, "logging": {"level": "INFO"}}

def deep_merge(base: dict, override: dict) -> dict:
    """Merge override into a copy of base. Nested dicts merge recursively;
    anything on the right replaces the left for that key."""
    out = dict(base)
    for key, value in override.items():
        if isinstance(value, dict) and isinstance(out.get(key), dict):
            out[key] = deep_merge(out[key], value)
        else:
            out[key] = value
    return out

def load_layer(path: str = "config.json") -> dict:
    with open(path) as f:
        return json.load(f)

def _coerce(raw: str):
    if raw.lower() in {"true", "false"}:
        return raw.lower() == "true"
    try:
        return int(raw)
    except ValueError:
        return raw

def apply_env(config: dict, prefix: str = "APP_") -> dict:
    """Overlay environment variables named APP_<KEY>, e.g. APP_PORT=9000.
    Double underscores mark nesting: APP_LOGGING__LEVEL=DEBUG."""
    for key, raw in os.environ.items():
        if not key.startswith(prefix):
            continue
        parts = key[len(prefix):].lower().split("__")
        target = config
        for part in parts[:-1]:
            target = target.setdefault(part, {})
        target[parts[-1]] = _coerce(raw)
    return config

if __name__ == "__main__":
    sample = json.dumps({"app": {"name": "api"}, "logging": {"level": "DEBUG"}})
    with open("config.json", "w") as f:
        f.write(sample)
    config = deep_merge(dict(DEFAULTS), load_layer("config.json"))
    config = apply_env(config)
    print(config)
```

La línea `dict(base)` al inicio de `deep_merge` es lo que hace a esta función *pura*: los llamadores conservan sus valores predeterminados intactos y reciben un dict nuevo de vuelta, así que "ejecutar una vez con un archivo malo, recargar, sobrescribir de nuevo" siempre es seguro. La capa de env vars demuestra el caballo oscuro del diseño de config — *todo es un string en el entorno* — de ahí que `_coerce` convierta `"9000"` en `9000` y `"true"` en `True` antes de que aterricen en el dict.

**🎯 Resultado esperado :**

```
{'app': {'name': 'api', 'port': 8000}, 'logging': {'level': 'DEBUG'}}
```

**🩹 Si sale mal :** Si a `app` le falta `port`, tu `deep_merge` aplanó en lugar de recurrir — verifica la rama `isinstance(value, dict)`. Si la salida *reemplaza* `logging` por completo, intercambiaste el orden del merge; `deep_merge(base, override)` conserva todo en `base` que `override` no toca.

### 1.2 Prueba el reemplazo por entorno

```bash
APP_PORT=9000 APP_LOGGING__LEVEL=WARN uv run python layers.py
```

**👟 Pista inicial :** Re-ejecuta con dos env vars definidas en la línea de comandos y observa cómo cambian el puerto y el nivel de log, con `app.name` intacto.

**🎯 Resultado esperado :** `{'app': {'name': 'api', 'port': 9000}, 'logging': {'level': 'WARN'}}` — las dos env vars reemplazan exactamente sus claves, nada más.

**🩹 Si sale mal :** Si nada cambia, el filtro de prefijo `APP_` no está coincidiendo — confirma que las vars están definidas *en el mismo comando* (`APP_PORT=9000 uv run ...`, no un `export` separado en otra ventana). Si `APP_LOGGING__LEVEL` aterriza como una clave *nueva* de nivel superior en lugar de anidar bajo `logging`, el bucle `__` → ruta punteada no está dividiendo.

### 1.3 Verifica el apilamiento

**✅ Lista de verificación**

- ✅ Sin env vars, la salida fusionada es `{'app': {'name': 'api', 'port': 8000}, 'logging': {'level': 'DEBUG'}}`.
- ✅ Con `APP_PORT=9000`, el puerto cambia y `app.name` sigue siendo `'api'`.
- ✅ `apply_env` coerce `"9000"` al entero `9000`, no al string.

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué reemplazar al fusionar (en lugar de recurrir siempre) es el comportamiento *correcto* para una clave como `port`? ¿Qué dato real se rompería silenciosamente si recurrieras dentro de una lista o un no-dict?
- Las env vars son todas strings. ¿Qué clase de bug previene `_coerce`, y qué *nuevo* riesgo introduce el coerción silenciosa cuando un valor como `"0012"` (pensado como un ID de string) se convierte en `12`?

## Paso 2: Leer archivos de config TOML

JSON sufre un problema práctico como formato de config: no hay comentarios, lo que hace que los archivos de config se lean como volcados de datos en lugar de instrucciones. TOML — usado por `pyproject.toml`, Cargo y muchas herramientas modernas — añade comentarios, tipos amigables y la misma estructura anidada. Python 3.11+ lo lee con `tomllib`, igual que `json` lee JSON.

### 2.1 Escribir la capa TOML

**👟 Pista inicial :** Escribe un `config.toml` con comentarios y anidación, luego un `load_toml_layer` que lo lea en modo binario (`tomllib` requiere bytes) y lo fusione encima de los valores predeterminados:

```python
# toml_layer.py
from pathlib import Path
import tomllib

from layers import DEFAULTS, apply_env, deep_merge

def load_toml_layer(path: str = "config.toml") -> dict:
    with Path(path).open("rb") as f:
        return tomllib.load(f)

if __name__ == "__main__":
    toml_text = '''
# Production-like overrides
[app]
name = "prod-api"
port = 8080

[logging]
level = "PROD"
'''
    Path("config.toml").write_text(toml_text)
    config = deep_merge(dict(DEFAULTS), load_toml_layer())
    config = apply_env(config)
    print(config)
```

El patrón `deep_merge(dict(DEFAULTS), layer)` es deliberadamente idéntico al merge JSON del Paso 1 — una vez que existe la función de merge, cada nueva fuente son las mismas dos líneas. Dos cosas pequeñas son fáciles de pasar por alto: `tomllib.load` exige modo *binario* (`Path.open("rb")`), una peculiaridad que no comparte con ningún otro formato popular, y los encabezados `[logging]` de TOML producen los mismos dicts anidados que tu `deep_merge` ya maneja.

**🎯 Resultado esperado :**

```
{'app': {'name': 'prod-api', 'port': 8080}, 'logging': {'level': 'PROD'}}
```

**🩹 Si sale mal :** Un `TypeError: File must be opened in binary mode` significa que abriste con `"r"` en lugar de `"rb"`. Un `TOMLDecodeError` normalmente apunta a la línea exacta — las comas finales *sí* están permitidas en TOML, pero una segunda sección `[app]` o un `=` suelto es un error duro en tiempo de parse.

### 2.2 Verifica la capa TOML

**✅ Lista de verificación**

- ✅ `load_toml_layer()` devuelve `{'app': {'name': 'prod-api', 'port': 8080}, 'logging': {'level': 'PROD'}}`.
- ✅ Las configuraciones de `config.toml` reemplazan a `DEFAULTS`, y los campos que TOML no menciona (`app.port` intocado por el archivo seguiría `8000`) sobreviven intactos.
- ✅ Puedes afirmar por qué el archivo debe abrirse en modo binario.

**🤔 Pregunta(s) socrática(s)**

- TOML te deja escribir `port = 8080` (un entero, sin comillas). ¿Cómo cambiaría el *tipo* de `port` si el archivo dijera `port = "8080"`, y dónde aparecería esa diferencia — rompiendo silenciosamente qué más tarde? (Pista: recuerda la ruta sin validación del paso 1.)
- El merge trata la capa TOML y la capa JSON como intercambiables. ¿Qué tendrías que cambiar si quisieras *"TOML siempre gana sobre JSON, sin importar el orden de carga"* — y es hornear eso una buena idea o una trampa de mantenibilidad?

## Paso 3: Validar la config fusionada

Una vez que tres fuentes alimentan un dict, el merge puede producir silenciosamente una config con una *clave faltante* o un *valor de tipo equivocado* — y esos fallan más tarde, lejos de la config, de maneras confusas. La validación mueve el fallo al frente: verifica la config fusionada contra un esquema y lanza una lista de errores legible antes de que corra cualquier cosa.

### 3.1 Escribir el aplanado y el verificador

**👟 Pista inicial :** `flatten` convierte los dicts anidados en rutas punteadas (`app.port`) para que un esquema plano pueda nombrar exactamente dónde está mal; `validate` compara contra un dict `REQUIRED` de ruta → tipo y devuelve una lista de problemas legibles:

```python
# validate.py
REQUIRED = {
    "app.name": str,
    "app.port": int,
    "logging.level": str,
}

def flatten(config: dict, prefix: str = "") -> dict[str, object]:
    out = {}
    for key, value in config.items():
        path = f"{prefix}.{key}" if prefix else key
        if isinstance(value, dict):
            out.update(flatten(value, path))
        else:
            out[path] = value
    return out

def validate(config: dict) -> list[str]:
    errors = []
    flat = flatten(config)
    for path, wanted in REQUIRED.items():
        if path not in flat:
            errors.append(f"missing required key: {path}")
        elif not isinstance(flat[path], wanted):
            errors.append(
                f"{path} should be {wanted.__name__}, got {type(flat[path]).__name__}"
            )
    return errors

if __name__ == "__main__":
    broken = {"app": {"name": "api", "port": "8000"}}
    for error in validate(broken):
        print(error)
```

`flatten` es el caballo de batalla silencioso: convierte "¿dónde está el problema?" de un laberinto de búsquedas anidadas en una sola lista plana, y reutiliza el mismo recorrido en `secrets.py` (Paso 4) — una travesía, dos consumidores. `isinstance(flat[path], wanted)` captura las trampas de *tipo* de las que la config es famosa, como un puerto string que explotará en un socket bind: `ValueError` más tarde en lugar de una frase clara ahora.

**🎯 Resultado esperado :**

```
app.port should be int, got str
```

**🩹 Si sale mal :** Si no se reporta nada para el dict roto, tu esquema `REQUIRED` escribe la ruta distinto de como la produce `flatten` — verifica que un desajuste de `logging.level` vs `logging__level` (el estilo de env vars) se esté filtrando al esquema. Si obtienes `should be type, got str`, verifica si `got {type(...).__name__}` en el f-string está imprimiendo el nombre heredado de un valor con subclase.

### 3.2 Verifica el validador

**✅ Lista de verificación**

- ✅ `validate({"app": {"name": "x", "port": "8000"}, "logging": {"level": 5}})` reporta tanto el `app.port` mal tipado como el `logging.level` mal tipado, una línea cada uno.
- ✅ Una config sin `app.name` reporta `missing required key: app.name`.
- ✅ Una config totalmente correcta devuelve una lista vacía.

**🤔 Pregunta(s) socrática(s)**

- `flatten` lo comparten la validación y (siguiente paso) la redacción de secretos. ¿Cuál es el argumento de responsabilidad única para una sola travesía — y qué habría que duplicar si hubieras inlineado el recorrido dos veces?
- El esquema verifica *tipos*, no *rangos*. ¿Qué fallo seguiría pasando un `port` de `-1` o `65536` — y vale la pena añadir una verificación de rango al esquema o es esa la capa equivocada para ello?

## Paso 4: Redactar secretos antes de imprimir

Una config que *contiene* un secreto es normal; una config que *imprime* uno es un incidente. La regla de oro en las herramientas reales: tratar cualquier clave que luzca sensible (`password`, `token`, `api_key`, …) como no imprimible por defecto, y solo revelarla cuando se pida explícitamente. Este paso lo vuelve automático.

### 4.1 Escribir el detector y el redactor

**👟 Pista inicial :** Usa un regex compilado sin distinguir mayúsculas sobre los *nombres* de las claves (no los valores — emparejar valores sería un juego de adivinanzas), luego `flatten` + reconstrucción como rutas punteadas enmascaradas:

```python
# secrets.py
import re

from validate import flatten

SENSITIVE = re.compile(r"(password|passwd|token|secret|api[_-]?key|apikey)", re.I)

def is_sensitive(path: str) -> bool:
    return bool(SENSITIVE.search(path))

def redact(config: dict) -> dict[str, object]:
    return {path: "***" if is_sensitive(path) else value
            for path, value in flatten(config).items()}

if __name__ == "__main__":
    sample = {
        "app": {"name": "api", "port": 8000, "api_key": "sk-live-abc123"},
        "database": {"password": "hunter2", "host": "db.internal"},
    }
    for path, value in redact(sample).items():
        print(f"{path} = {value}")
```

El regex está deliberadamente anclado de la forma dura pero segura: empareja *substrings* de una ruta (`database.password` contiene `password`), lo que captura `db_password`, `github_token` y `api_key` sin requerir una taxonomía de cada nombre posible. Y como el enmascaramiento ocurre sobre la *clave*, no el valor, nunca necesita adivinar cómo luce un secreto — un valor `"sk-…"` o `"hunter2"` se redacta idénticamente basándose puramente en dónde vive.

**🎯 Resultado esperado :**

```
app.name = api
app.port = 8000
app.api_key = ***
database.host = db.internal
database.password = ***
```

**🩹 Si sale mal :** Si `api_key` se imprime sin ocultarse, tu regex usó un anclaje `$` o un límite de palabra que la alternativa `api[_-]?key` no satisface — `api_key` tiene un guion bajo, así que el patrón debe permitirlo (`[_-]?`). Si `host` se redacta, el patrón es demasiado laxo — una alternativa `key` desnuda coincide con la cola de `monkey`; apriétalo a solo formas estilo `api[_-]?key`.

### 4.2 Verifica la redacción

**✅ Lista de verificación**

- ✅ `database.password` y `app.api_key` se imprimen como `***`.
- ✅ `app.name`, `app.port` y `database.host` imprimen sus valores reales.
- ✅ Un valor con forma de secreto guardado bajo una clave *no secreta* (p. ej. `app.notes = "contains sk-abc"`) no se redacta — la redacción se basa en las claves.

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué emparejar *nombres* de claves es fundamentalmente más confiable que emparejar los *valores* de las claves? ¿Cuál es un valor real que querrías mantener visible y que por casualidad contenga el substring `token`?
- La redacción devuelve `***` en lugar de eliminar la clave. ¿Qué rompería del CLI del Paso 5 (o de cualquier validador de esquemas) si la redacción *removiera* por completo las rutas secretas en lugar de enmascararlas?

## Paso 5: El CLI final

Cada función hasta ahora es una librería; este paso las convierte en una herramienta: `config.py --check` valida, `config.py --show` imprime una vista aplanada y redactada. El CLI es donde la promesa "nunca imprimir un secreto" se vuelve un comportamiento que un humano realmente toca.

### 5.1 Construir `load_config` y el manejo de argumentos

**👟 Pista inicial :** Compón el pipeline en una sola función — valores predeterminados → JSON → TOML → env vars — y luego cablea `--check` y `--show` a través de `argparse`:

```python
# config.py
import argparse

from layers import DEFAULTS, apply_env, deep_merge, load_layer
from secrets import redact
from toml_layer import load_toml_layer
from validate import validate

def load_config(json_path: str = "config.json", toml_path: str = "config.toml") -> dict:
    config = deep_merge(dict(DEFAULTS), load_layer(json_path))
    config = deep_merge(config, load_toml_layer(toml_path))
    return apply_env(config)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Load, validate, and inspect layered config.")
    parser.add_argument("--check", action="store_true", help="Validate against the schema")
    parser.add_argument("--show", action="store_true", help="Print the merged config with secrets masked")
    args = parser.parse_args()

    if args.check:
        errors = validate(load_config())
        print("\n".join(errors) if errors else "config OK")
    if args.show:
        for path, value in redact(load_config()).items():
            print(f"{path} = {value}")
```

```bash
uv run python config.py --show
```

Cada bandera re-ejecuta `load_config()` de forma independiente — barato aquí, y significa que `--show` nunca imprime estado obsoleto de una corrida de `--check`. El orden de composición es todo el comportamiento del sistema en una sola cadena de llamadas de función: `DEFAULTS < JSON < TOML < env`, así que la fuente de mayor precedencia siempre es el último merge.

**🎯 Resultado esperado :** `app.name = prod-api`, `app.port = 8080`, `logging.level = PROD` (más cualquier clave que añadas cuyo nombre coincida con un patrón sensible impresa como `***`).

**🩹 Si sale mal :** Un `FileNotFoundError` por `config.json` o `config.toml` significa que estás ejecutando desde la carpeta equivocada — los archivos están en la carpeta donde los escribieron los Pasos 1–2, así que ejecuta el CLI desde ahí, o pasa la ruta. Si `--show` y `--check` juntos imprimen la config validada *y* la redacción a la vez, recuerda que las banderas `action="store_true"` son independientes — combínalas con `&&`, o añade un `--show` implícito cuando `--check` pase.

### 5.2 Verifica el CLI

**✅ Lista de verificación**

- ✅ `uv run python config.py --show` imprime solo valores redactados y fusionados, con cualquier clave sensible enmascarada.
- ✅ `uv run python config.py --check` imprime `config OK` para una config válida — o una línea `path should be…` por campo roto.
- ✅ `uv run python config.py --help` lista ambas banderas y la descripción de la herramienta.

**🤔 Pregunta(s) socrática(s)**

- `--show` re-ejecuta `load_config()` en lugar de compartir un solo objeto de config con `--check`. ¿Cuándo mordería esa elección — qué podría diferir entre las dos corridas en un despliegue *real* (pista: piensa en variables de entorno cambiando a mitad del proceso)?
- El CLI imprime secretos solo **como** `***`. Si añadieras una bandera `--reveal` para mostrar valores reales, ¿qué protección pondrías alrededor para que nadie vuelque accidentalmente credenciales de producción en logs de CI?

## ⚠️ Errores comunes

- **Fusionar superficialmente y perder claves hermanas.** `dict(base) | override` (o `base.update(override)`) reemplaza dicts anidados enteros, borrando `app.name` en el momento en que `app.port` se reemplaza. Fusiona siempre recursivamente — la rama `isinstance(value, dict)` del Paso 1 no es opcional.
- **Olvidar que `tomllib` quiere modo binario.** `tomllib.load(open("config.toml"))` falla con un `TypeError`; el manejador de archivo debe abrirse como `"rb"`. Es el único cargador de formatos de la stdlib con esta peculiaridad.
- **Hardcodear secretos en código "solo por ahora".** Una `API_KEY` dentro de `DEFAULTS` es exactamente el valor que el Paso 4 enmascararía — que es la herramienta diciéndote que no debería estar en código. Muévela a una env var antes de que el enmascaramiento la oculte también de tu propio debugging.
- **Validar después del primer uso.** Si haces `socket.bind((host, port))` antes de verificar `isinstance(port, int)`, un puerto string falla a tres archivos de profundidad en tu programa. La validación pertenece al *límite* de la config, no después de que corrieron las primeras cien líneas.
- **Detectar secretos por la forma del valor.** Emparejar valores (regexes para `sk-…`) parece ingenioso y engaña: los valores reales te sorprenden constantemente, y los nombres de claves son ya lo único estable. Empareja nombres.

## Lo que acabas de construir

Un sistema de config en capas genuino — valores predeterminados, JSON, TOML y variables de entorno fusionados en el orden de precedencia correcto, validados contra un esquema y renderizados con secretos enmascarados de forma segura — todo Python de biblioteca estándar puro más `tomllib`. La habilidad transferible es la arquitectura misma: un *pipeline de reemplazos que termina en el entorno*, la forma detrás de los sistemas de config desde los settings de Django hasta las herramientas de despliegue, y una regla defendible que vale la pena copiar por completo: los secretos se imprimen solo cuando el trabajo central de la herramienta es revelarlos.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/config-manager/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/config-manager) en el repositorio del curso tiene estos scripts completos más archivos de muestra `config.json`/`config.toml`, ejecutables de extremo a extremo. O abre todo el repositorio en un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## A dónde ir desde aquí

- Añade una bandera `--env prod` que cargue `config.prod.toml` en lugar del archivo predeterminado — reemplazos específicos por entorno como una selección, no un hack — y observa cómo el pipeline de merge queda sin cambios.
- Soporta una clave `include = ["shared.toml"]` para que un archivo de config pueda importar otros — tu `deep_merge` compone los includes gratis.
- Emite la config fusionada como un **archivo `clave=valor` aplanado** para una herramienta estilo 12-factor que consume puntos, no anidación — `flatten` del Paso 3 es tu punto de partida.
- Escribe el veredicto de redacción como una prueba `pytest` que afirme que `redact` nunca devuelve un valor que contenga `sk-` — la misma garantía que los sistemas de CI ejecutan hoy sobre scanneos de secretos reales.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientes orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene una guía completa, amigable para principiantes, para agregar el tuyo mediante un **pull request**, incluso si nunca has usado git: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, paso a paso. No se asume experiencia previa en git.

Bienvenido a escribir Python fuera del navegador. 🎓