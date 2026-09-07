---
title: "Herramienta de Enmascaramiento de Datos"
description: "Anonimizar datos sensibles para desarrollo y pruebas preservando propiedades estadísticas."
difficulty: "intermediate"
estimatedMinutes: 80
tags: ["cli", "csv", "pii", "hashing"]
prerequisites:
  - "Fundamentos de Python (variables, bucles, funciones, diccionarios)"
  - "Leer archivos CSV con el módulo csv"
learningObjectives:
  - "Detectar columnas sensibles por pistas de nombre y patrones de valor"
  - "Aplicar estrategias de enmascaramiento de redacción, hash y preservación de formato"
  - "Construir automáticamente un plan de enmascaramiento por columna a partir de la detección"
  - "Enmascarar identificadores numéricos preservando la distribución de la columna"
  - "Escribir un registro de auditoría de cada operación de enmascaramiento"
---

# 🕶️ Construir un Enmascarador de Datos

Copiar datos reales de clientes hacia una base de datos de desarrollo, un informe de bug o una demo es así como se filtran los datos sensibles — y la solución es la disciplina del *enmascaramiento*: reemplazar valores reales por versiones falsas pero plausibles antes de que los datos vayan a cualquier lugar a donde no deberían. El oficio está en los detalles: un correo debe conservar su dominio (para que el código de pruebas siga enrutando), un número de teléfono debería seguir teniendo forma de teléfono, un campo numérico como el salario debe conservar su *distribución* (para que la analítica de pruebas no colapse). Este proyecto construye un enmascarador que detecta columnas sensibles, aplica la estrategia correcta por columna, preserva lo que debe preservarse y escribe un registro de auditoría de cada operación.

Esto asume Python 101 más lectura cómoda de `csv` y `re` — funciones, listas, conjuntos. No se requiere nada del módulo de Análisis de Datos. Es opcional y no calificado; consulta [Proyectos del mundo real](/docs/projects) para la lista completa, en crecimiento.

## 🎯 Lo que harás

1. Detectar columnas sensibles usando pistas de nombre (`email`, `phone`, `name`, …) y regex de patrones de valor.
2. Implementar un zoológico de estrategias: redacción, hash determinista, enmascaramiento de texto que preserva longitud, correo y teléfono que preservan formato.
3. Construir automáticamente un plan de enmascaramiento por columna a partir de la detección + pistas de nombre de columna.
4. Enmascarar identificadores numéricos mediante permutación dentro de la columna, probando que la distribución sobrevive mientras se corta la asociación fila-*sobre*-id.
5. Armar una CLI `masker.py` que enmascara un CSV, escribe `masked.csv` y agrega a `audit.jsonl`.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino recomendado — el enmascaramiento es inherentemente una operación de *archivo* ("enmascara este CSV, conserva aquel"), así que la CLI local contra tus propios archivos es su hogar honesto.

**GitHub Codespaces** es una alternativa sin configuración: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node y Python ya están instalados) y ejecuta los mismos comandos desde una terminal del navegador.

**Google Colab, Kaggle Notebooks o Binder** funcionan bien para la mitad de estrategias y planificador — el notebook en [`examples/data-masker/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-masker/notebook.ipynb) ejecuta cada paso sobre filas de muestra incluidas. La nota honesta: el notebook maneja datos de muestra fijos, mientras que la CLI local se puede apuntar a un CSV real que realmente poseas.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-masker/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-masker/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdata-masker%2Fnotebook.ipynb)

## Configuración

`uv` es una sola herramienta que reemplaza la cadena "instalar Python, luego pip, luego una herramienta de entorno virtual" — y este proyecto es biblioteca estándar pura.

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
uv init data-masker
cd data-masker
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `data-masker/` existe con un `pyproject.toml`.
- ✅ `python -c "import csv, hashlib, re"` se ejecuta — sin paquetes de terceros.

## Paso 1: Detectar columnas sensibles

El enmascaramiento comienza con *encontrar* los secretos. Existen dos señales independientes: el *nombre* de la columna (casi todo lo sensible es honesto siendo `email` o `phone` en el encabezado) y los *valores* (un `@` que contiene un punto es una fuerte pista de correo sin importar cómo se llame la columna). La detección confía en ambas, porque cualquiera de las dos puede ser la única que funcione.

### 1.1 Escribir el detector

**👟 Pista inicial :** Tres grupos de pistas de nombre más un patrón `re` de correo/teléfono, todos alimentando un conjunto de columnas sensibles; ejecútalo sobre un CSV de muestra con una columna sensible de nombre obvio y una de nombre astuto:

```python
# detect.py
import re

EMAIL_RE = re.compile(r"[^@\s]+@[^@\s]+\.[^@\s]+")
PHONE_RE = re.compile(r"\+?\d[\d\s().-]{6,}\d")
NAME_HINTS = ("name", "person", "student", "customer", "user")
PII_HINTS = ("email", "phone", "ssn", "sin", "address", "iban", "credit")

def detect_columns(headers: list[str], rows: list[dict]) -> list[str]:
    sensitive: set[str] = set()
    for col in headers:
        lowered = col.lower()
        if any(hint in lowered for hint in NAME_HINTS):
            sensitive.add(col)
        if any(hint in lowered for hint in PII_HINTS):
            sensitive.add(col)
        values = [row[col] for row in rows]
        joined = " ".join(values)
        if EMAIL_RE.search(joined) or PHONE_RE.search(joined):
            sensitive.add(col)
    return [col for col in headers if col in sensitive]

if __name__ == "__main__":
    csv_text = """id,full_name,email,phone,contact,city
1,Ada Lovelace,ada@example.com,+1 555 0101,ada@example.com,London
2,Grace Hopper,grace@navy.mil,+1 555 0102,grace@navy.mil,Arlington
3,Alan Turing,alan@bletchley.uk,+44 20 7946 0000,alan@bletchley.uk,Bletchley
"""
    lines = [line for line in csv_text.strip().splitlines()]
    import csv
    reader = csv.DictReader(lines)
    headers = reader.fieldnames or []
    rows = list(reader)
    print(detect_columns(headers, rows))
```

`contact` es la prueba que mantiene honesto al detector: su encabezado no dice nada sensible, pero sus valores son correos, así que `EMAIL_RE.search(joined)` es lo que lo atrapa. Nota que la detección trabaja sobre el *texto unido* de una columna, no celda por celda — una sola búsqueda de regex sobre la columna completa es a la vez más simple y suficiente para las señales de patrón, al costo de no decirte qué *filas* son sensibles (el paso del plan aún no lo necesita).

**🎯 Resultado esperado :**

```
['full_name', 'email', 'phone', 'contact']
```

**🩹 Si sale mal :** Si se pierde `contact`, la búsqueda `EMAIL_RE` unida no se está ejecutando para cada columna — confirma que el bloque de regex está dentro del bucle `for col`. Si `city` se marca, un fragmento de `NAME_HINTS` como `user` está coincidiendo con una subcadena de un encabezado inocente (`city`? no — verifica si hay un encabezado como `username_last_change`); la lista de pistas se basa en subcadenas por diseño, y la coincidencia de subcadenas es exactamente tan laxa como parece.

### 1.2 Verifica la detección

**✅ Lista de verificación**

- ✅ La muestra detecta `full_name`, `email`, `phone` y `contact`, en ese orden de encabezado.
- ✅ Eliminar los *valores* de correo de la columna `contact` (pero conservando su encabezado) hace que ya no se marque — los patrones de valor son genuinamente basados en valores.
- ✅ Una columna `address` y una columna `iban` se marcan solo por su nombre, incluso con valores vacíos.

**🤔 Pregunta(s) socrática(s)**

- La detección es por *columna*, no por *celda*: un correo en una columna de "notes" de 10,000 filas marca toda la columna. ¿Qué tendría que ganar (y perder) el enmascarador al cambiar a detección a nivel de celda para columnas de texto libre como `notes`?
- Las pistas de nombre coinciden con subcadenas (`user` coincide con `user_name` *y* con `userscript_repo`). ¿Por qué la coincidencia de subcadenas es el default pragmático aquí en lugar de una coincidencia `==` exacta — y qué único falso positivo cambiaría tu opinión?

## Paso 2: Construir el zoológico de estrategias

La detección decide *qué* columnas; las estrategias deciden *cómo* se enmascara cada una. El conjunto útil es: redactar (la trituradora), hash (seudónimo determinista — la misma entrada siempre mapea a la misma salida, así que los joins siguen funcionando), texto que preserva longitud (los artefactos de prueba siguen siendo plausibles), correo/teléfono que preservan formato (el dominio y la estructura sobreviven al enrutamiento/la coincidencia). Cada una es una función de una sola idea.

### 2.1 Escribir una estrategia por función

**👟 Pista inicial :** Cinco funciones pequeñas, luego un auxiliar `apply` que cualquier planificador pueda reutilizar — `mask_email` conserva el dominio después del `@`, `mask_phone` conserva solo los últimos cuatro dígitos, ambas bajo una tabla de despacho compartida:

```python
# mask.py
import hashlib
import re

STRATEGY = {}

def mask_redact(value: str) -> str:
    return "****"

def mask_hash(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()[:12]

def mask_text(value: str) -> str:
    if not value.strip():
        return value
    return "".join("*" if ch.isalpha() else ch for ch in value)

def mask_email(value: str) -> str:
    local, sep, domain = value.partition("@")
    if not sep:
        return mask_hash(value)
    return f"{hashlib.sha256(local.encode()).hexdigest()[:8]}@{domain}"

def mask_phone(value: str) -> str:
    digits = re.sub(r"\D", "", value)
    if len(digits) < 5:
        return "****"
    return f"+X{'-' * (len(digits) - 4)}-{digits[-4:]}"

STRATEGY.update({
    "redact": mask_redact, "hash": mask_hash, "text": mask_text,
    "email": mask_email, "phone": mask_phone,
})

def apply(rows: list[dict], plan: dict[str, str]) -> list[dict]:
    masked_rows = []
    for row in rows:
        out = dict(row)
        for col, strategy in plan.items():
            out[col] = STRATEGY[strategy](out[col])
        masked_rows.append(out)
    return masked_rows

if __name__ == "__main__":
    rows = [
        {"full_name": "Ada Lovelace", "email": "ada@example.com", "phone": "+1 555 0101", "city": "London"},
        {"full_name": "Grace Hopper", "email": "grace@navy.mil", "phone": "+1 555 0102", "city": "Arlington"},
    ]
    plan = {"full_name": "text", "email": "email", "phone": "phone"}
    for row in apply(rows, plan):
        print(row)
```

El dict `STRATEGY` que mapea nombres a funciones es la *tabla de despacho* — el planificador (siguiente paso) produce nombres de estrategia en string y `apply` los convierte en comportamiento, así que añadir la estrategia #6 significa una función más una entrada de tabla, no una reescritura del planificador. Dos formatos que admirar: `mask_email` conserva todo después del `@` (un correo unido sigue enrutando al mismo dominio) y hashea la parte local; `mask_phone` cuenta dígitos para preservar la *forma* de marcado (`+X-----0101`) mientras destruye la identidad del número.

**🎯 Resultado esperado :**

```
{'full_name': '*** ********', 'email': 'fdee430d@example.com', 'phone': '+X-----0101', 'city': 'London'}
{'full_name': '***** ******', 'email': 'e010fd1c@navy.mil', 'phone': '+X-----0102', 'city': 'Arlington'}
```

**🩹 Si sale mal :** Si los hashes de `mask_email` difieren en cada corrida, usaste `random` en algún lugar en lugar de `hashlib` — lo determinista es todo el punto. Si la longitud del enmascarado de `mask_phone` está mal, `len(digits)` cuenta un código de país que no debería ser visible — ese es el comportamiento correcto (forma preservada, prefijo real destruido); verifica el conteo de `-` contra `len(digits) - 4` en lugar de estimar a ojo.

### 2.2 Verifica las estrategias

**✅ Lista de verificación**

- ✅ `mask_hash("Ada")` es igual a `mask_hash("Ada")` entre corridas, pero difiere de `mask_hash("ada")` (las mayúsculas importan — eso es una trampa real, ver abajo).
- ✅ `mask_email("grace@navy.mil")` sigue terminando en `@navy.mil`; `mask_phone("+1 555 0102")` sigue terminando en `0102`.
- ✅ `mask_text("Ada")` es `***` — misma longitud, sin letras.
- ✅ `apply` enmascara solo las columnas nombradas por el plan y deja intacta cualquier otra celda.

**🤔 Pregunta(s) socrática(s)**

- `mask_hash` es determinista, que es lo que lo hace reversible por adivinación: `mask_hash("secret")` es conocimiento público una vez que has visto el hash. ¿Cuándo es aceptable el enmascaramiento por hash (qué propiedad de los datos lo hace seguro), y cuándo es trivialmente desenmascarable?
- `mask_email` hashea la parte *local* pero conserva el dominio. ¿Qué comportamiento real posterior destruiría un correo completamente redactado — y cuál es el riesgo residual de privacidad de mantener el dominio visible?

## Paso 3: Construir automáticamente el plan de enmascaramiento

Nadie quiere escribir a mano `{"email": "email", "full_name": "text", ...}` por conjunto de datos. El planificador cierra el bucle con la detección: las columnas sensibles reciben una estrategia elegida por *la pista de su nombre* — `email` → preservador de correo, phone → preservador de teléfono, variantes de `name` → texto que preserva longitud, todo lo demás sensible → hash. Detección + una consulta = un plan completo.

### 3.1 Escribir el planificador

**👟 Pista inicial :** Reutiliza `detect_columns`, luego recorre la lista detectada eligiendo una estrategia por pista con un pequeño `if/elif` — el plan es un dict simple que `mask.apply` ya sabe cómo ejecutar:

```python
# planner.py
from detect import detect_columns
from mask import apply

def build_plan(headers: list[str], rows: list[dict]) -> dict[str, str]:
    sensitive = detect_columns(headers, rows)
    plan: dict[str, str] = {}
    for col in sensitive:
        lowered = col.lower()
        if "email" in lowered:
            plan[col] = "email"
        elif "phone" in lowered:
            plan[col] = "phone"
        elif any(hint in lowered for hint in ("name", "person", "student")):
            plan[col] = "text"
        else:
            plan[col] = "hash"
    return plan

def mask_with_plan(rows: list[dict], plan: dict[str, str]) -> list[dict]:
    return apply(rows, plan)

if __name__ == "__main__":
    import csv
    csv_text = """id,full_name,email,phone,ssn,city
1,Ada Lovelace,ada@example.com,+1 555 0101,111-22-3333,London
2,Grace Hopper,grace@navy.mil,+1 555 0102,444-55-6666,Arlington
"""
    reader = csv.DictReader(csv_text.strip().splitlines())
    rows = list(reader)
    plan = build_plan(reader.fieldnames or [], rows)
    print("plan:", plan)
    for row in mask_with_plan(rows, plan):
        print(row)
```

La cascada `email → phone → name → hash` está deliberadamente ordenada por *cuánto formato debe sobrevivir*: el correo conserva la mayor estructura, y todo lo que se cae termina como hash — el default conservador de privacidad. Como `build_plan` devuelve un dict simple y `apply` consume un dict simple, las dos mitades podrían reemplazarse independientemente (un planificador impulsado por YAML, un registro de estrategias) sin tocarse entre sí.

**🎯 Resultado esperado :**

```
plan: {'full_name': 'text', 'email': 'email', 'phone': 'phone', 'ssn': 'hash'}
{'id': '1', 'full_name': '*** ********', 'email': 'fdee430d@example.com', 'phone': '+X-----0101', 'ssn': '2e54cc08456e', 'city': 'London'}
{'id': '2', 'full_name': '***** ******', 'email': 'e010fd1c@navy.mil', 'phone': '+X-----0102', 'ssn': '74e4145b168a', 'city': 'Arlington'}
```

**🩹 Si sale mal :** Si `ssn` no está en el plan, `detect_columns` lo encontró sensible pero no se alcanza la rama "else → hash" del plan — verifica que el orden `if/elif` no haya tragado accidentalmente a `ssn` bajo una pista `name` (no debería). Si la salida enmascarada *descarta* `city`, `apply` está reconstruyendo filas en lugar de copiarlas — debe hacer `dict(row)` y luego sobrescribir en su lugar.

### 3.2 Verifica el planificador

**✅ Lista de verificación**

- ✅ `build_plan` mapea las cuatro columnas sensibles a `text`/`email`/`phone`/`hash` respectivamente.
- ✅ `id` y `city` están ausentes del plan y sin cambios en cada fila enmascarada.
- ✅ Llamar a `mask_with_plan` dos veces sobre las mismas filas produce una salida idéntica — determinismo de extremo a extremo.

**🤔 Pregunta(s) socrática(s)**

- El respaldo es `hash` "por default". Si un conjunto de datos tuviera una columna `date_of_birth`, `hash` es lo que obtendría — pero el hash de un cumpleaños es exactamente el caso *trivialmente adivinable* marcado en la pregunta del Paso 2. ¿De qué se apoyaría un respaldo más inteligente (la *forma* del valor, no solo el nombre) y es el default actual un bug o una decisión de alcance?
- `build_plan` devuelve un dict pero no sabe cómo se aplicará. ¿Dónde se vuelve valiosa esa separación — cuál es un ejemplo de aplicar el *mismo* plan a un pipeline diferente (una base de datos, una respuesta de API) sin tocar el planificador?

## Paso 4: Preservar distribuciones para identificadores numéricos

El enmascaramiento de texto tiene una vara de medir de "preservar" fácil (misma longitud). Para números — salario, edad, bonus — la vara de medir es una *distribución*, y la técnica honesta para preservarla exactamente es la **permutación dentro de la columna**: baraja cada columna numérica sensible por sí sola. Cada valor sobrevive, así que la media/mediana están intactas por construcción; lo que se destruye es la *asociación* entre la identidad de una fila y su número.

### 4.1 Escribir el enmascarador por permutación y los verificadores de estadísticas

**👟 Pista inicial :** Un barajado con semilla por columna más `column_stats` (media, mediana) y una verificación de igualdad de multiconjuntos que *prueba* la preservación de la distribución sin estimar a ojo:

```python
# preserve.py
import random

def shuffle_column(values: list[str], seed: int = 42) -> list[str]:
    rng = random.Random(seed)
    shuffled = list(values)
    rng.shuffle(shuffled)
    return shuffled

def column_stats(values: list[float]) -> dict[str, float]:
    mean = sum(values) / len(values)
    ordered = sorted(values)
    n = len(ordered)
    if n % 2:
        median = ordered[n // 2]
    else:
        median = (ordered[n // 2 - 1] + ordered[n // 2]) / 2
    return {"mean": mean, "median": median}

if __name__ == "__main__":
    original = [52000.0, 61000.0, 47000.0, 75000.0, 66000.0, 58000.0]
    masked = [float(v) for v in shuffle_column([str(v) for v in original])]

    print("same multiset of values:", sorted(masked) == sorted(original))
    before = column_stats(original)
    after = column_stats(masked)
    print(f"mean  before {before['mean']:>9,.2f}  after {after['mean']:>9,.2f}")
    print(f"median before {before['median']:>9,.2f}  after {after['median']:>9,.2f}")
```

El barajado preserva *exactamente* la distribución porque el resultado es el mismo multiconjunto de valores — `sorted(masked) == sorted(original)` no es una heurística, es una prueba. Lo que la permutación compra en términos de privacidad es más sutil y valioso: el mapeo *persona ↔ salario* se corta, mientras que la *forma* que modelan los analistas ("seis salarios promediando ~59.8k, mediana ~59.5k") sobrevive intacta. El argumento `seed` es lo que hace las corridas reproducibles — sin él, cada corrida de enmascarado esparciría tus artefactos de prueba de manera diferente.

**🎯 Resultado esperado :**

```
same multiset of values: True
mean  before 59,833.33  after 59,833.33
median before 59,500.00  after 59,500.00
```

**🩹 Si sale mal :** Si la media difiere, mutaste valores en lugar de permutarlos — una transformación como `value * factor` cambia la distribución; un *barajado* no puede. Si la misma `seed` produce barajados diferentes entre corridas, `random.Random(seed)` se está recreando dentro de un bucle en lugar de una vez.

### 4.2 Verifica la preservación

**✅ Lista de verificación**

- ✅ `sorted(masked) == sorted(original)` es `True`.
- ✅ Tanto la media como la mediana son idénticas antes y después, al centavo.
- ✅ Re-ejecutar con la misma semilla reproduce el mismo orden enmascarado exacto.

**🤔 Pregunta(s) socrática(s)**

- La permutación preserva la distribución de cada columna pero *tampoco rompe nada sobre las distribuciones de otras columnas*. Así que, ¿qué se pierde realmente para un analista que consume esos datos — aún pueden responder "¿los ingenieros ganan más que los diseñadores aquí?", y aún pueden responder "¿qué *persona* gana más?"? ¿Qué pérdida es la victoria de privacidad?
- `column_stats` reporta media y mediana. ¿En qué *otra* propiedad de la distribución diferirían todavía dos columnas con la misma media/mediana, y la permutación también preserva esa propiedad — o solo se rompió la asociación?

## Paso 5: Registro de auditoría y la CLI

Enmascarar sin registros es un agujero de cumplimiento — necesitas poder probar *qué* archivo se enmascaró, *qué* columnas, *cuántas* filas y *cuándo*. Un registro de auditoría JSONL solo de append proporciona eso, y una CLI `masker.py` compone detección → plan → aplicar → guardar → auditar en un solo comando.

### 5.1 Escribir `AuditLog` y la CLI

**👟 Pista inicial :** Un escritor `audit.jsonl` solo de append (un objeto JSON por línea), luego una CLI que lee un CSV, construye el plan, escribe `masked.csv` vía `csv.DictWriter` y registra la operación:

```python
# masker.py
import argparse
import csv
import json
from datetime import datetime, timezone

from planner import build_plan, mask_with_plan

class AuditLog:
    def __init__(self, path: str = "audit.jsonl"):
        self.path = path

    def record(self, source: str, masked_columns: list[str], rows_masked: int) -> None:
        entry = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "source": source,
            "masked_columns": masked_columns,
            "rows_masked": rows_masked,
        }
        with open(self.path, "a") as f:
            f.write(json.dumps(entry) + "\n")

    def count(self) -> int:
        try:
            with open(self.path) as f:
                return sum(1 for _ in f)
        except FileNotFoundError:
            return 0

def main() -> None:
    parser = argparse.ArgumentParser(description="Mask sensitive columns of a CSV, preserving the rest.")
    parser.add_argument("csv_path")
    parser.add_argument("--output", default="masked.csv")
    args = parser.parse_args()

    with open(args.csv_path, newline="") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []
        rows = list(reader)

    plan = build_plan(headers, rows)
    masked = mask_with_plan(rows, plan)

    with open(args.output, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(masked)

    audit = AuditLog()
    audit.record(args.csv_path, list(plan), len(rows))
    print(f"masked {len(plan)} columns across {len(rows)} rows -> {args.output}")
    print(f"audit entries: {audit.count()}")
```

```bash
cat > users.csv <<'EOF'
id,full_name,email,phone,ssn,city
1,Ada Lovelace,ada@example.com,+1 555 0101,111-22-3333,London
2,Grace Hopper,grace@navy.mil,+1 555 0102,444-55-6666,Arlington
EOF
uv run python masker.py users.csv --output masked.csv
```

La forma solo de append del registro de auditoría es la disciplina: *nunca reescribir* — cada `record` agrega una línea JSON delimitada por nueva línea, así que el registro es la historia completa, imposible de encoger accidentalmente. La CLI compone todo el pipeline en once líneas porque cada etapa es una función que ya escribiste: `build_plan(headers, rows)` → `mask_with_plan(rows, plan)` → `DictWriter`.

**🎯 Resultado esperado :** `masked 4 columns across 2 rows -> masked.csv` luego `audit entries: 1` — y `masked.csv` comparte los encabezados de la entrada con las celdas sensibles enmascaradas, `audit.jsonl` conteniendo una línea JSON con marca de tiempo ISO.

**🩹 Si sale mal :** Si `masked.csv` queda vacío, `DictReader` consumió el archivo pero no se leyeron filas — verifica que el CSV no sea un encabezado único sin datos y que no abriste `args.output` antes de cerrar el lector. Si el conteo de auditoría sube de a más de uno por corrida, llamaste a `record` dentro de un bucle en lugar de una vez.

### 5.2 Verifica la CLI

**✅ Lista de verificación**

- ✅ Después de una corrida, `masked.csv` tiene encabezados idénticos a la fuente y valores idénticos en todas las columnas no sensibles.
- ✅ `audit.jsonl` contiene exactamente una línea por corrida, con marca de tiempo UTC, fuente, columnas enmascaradas y conteo de filas.
- ✅ Re-enmascarar el mismo archivo sigue funcionando (enmascarar datos enmascarados está bien — los planes apuntan a las mismas columnas).

**🤔 Pregunta(s) socrática(s)**

- La auditoría registra *qué se enmascaró* pero no los *secretos* del enmascaramiento (las semillas de hash o la transformación específica). ¿Registrar la semilla haría el registro más auditable o más peligroso — y qué te dice eso sobre los registros que contienen *justo lo suficiente* para reproducir resultados sin revelar datos?
- `masker.py` escribe un archivo nuevo y nunca toca la fuente. ¿Qué tendría que añadir un flag `--in-place` (pista: auditoría — y ¿qué hay de `output == csv_path`?) antes de que fuera lo suficientemente seguro para enviar?

## ⚠️ Errores comunes

- **Usar aleatoriedad sin semilla.** `random.shuffle` sin semilla produce un conjunto de datos enmascarado diferente en cada corrida, lo que rompe pruebas y hace imposible "reproducir este trabajo de enmascaramiento". Siempre construye `random.Random(seed)` explícitamente.
- **Hashear sin tener el determinismo en mente.** `hash()` está salado por proceso en Python y es inútil aquí; `hashlib.sha256(...)` es estable. Además, las diferencias de minúsculas/espacios en blanco cambian silenciosamente los hashes — normaliza la entrada o documenta que las mayúsculas importan.
- **Enmascarar reemplazando valores en lugar de permutar.** `salary * 1.1` cambia la distribución de la que dependen tus analíticas de prueba. Si la forma debe sobrevivir, permuta; transforma solo cuando quieras que la forma se desvíe.
- **Preservar el formato más allá del punto de privacidad.** Conservar 8 de 10 dígitos del teléfono "por realismo" filtra la mayor parte del número. Preserva la *forma*, no los dígitos — los últimos 4 son de todos modos los más densos en información, así que incluso eso es un juicio que vale la pena revisitar.
- **Sin rastro de auditoría.** Un enmascarador que no puede responder "¿qué se enmascaró, cuándo, dónde?" falla el propósito de cumplimiento para el que existe. El JSONL solo de append son diez líneas; su ausencia es una bandera roja en cualquier revisión real.

## Lo que acabas de construir

Un enmascarador de datos funcional: detección de columnas por nombres y patrones de valor, un zoológico de estrategias desde redactar hasta preservar formato, un plan que se auto-construye, permutación que preserva la distribución para números, y un rastro de auditoría solo de append — todo biblioteca estándar, todo detrás de un verbo de CLI. La habilidad transferible es la *anonimización ajustada al propósito*: elegir destrucción (redactar), seudonimia (hash), preservación de estructura (formato) o preservación de distribución (permutar) preguntando qué necesita realmente el dato posterior, y luego probar cada elección con una verificación en lugar de una esperanza.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/data-masker/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/data-masker) en el repositorio del curso tiene estos scripts completos más CSVs de muestra y una auditoría preescrita. O abre todo el repositorio en un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## A dónde ir desde aquí

- Añade un modo **a nivel de celda** para columnas de texto libre (enmascara solo las celdas que coinciden con la regex de correo/teléfono), manteniendo intactos los valores no sensibles de la columna — la respuesta honesta a la pregunta socrática del Paso 1.
- Haz el respaldo de estilo `ssn` más inteligente con un **registro de formas de valor** (grupos de `\d{3}-\d{2}-\d{4}` → enmascarador SSN dedicado) en lugar del hash comodín.
- Emite estadísticas por estrategia en la entrada de auditoría (columnas con formato preservado, columnas permutadas, columnas hasheadas) para que las revisiones de cumplimiento puedan hojear una línea por trabajo.
- Añade `--seed` como flag de CLI para que un equipo socio pueda reproducir *tu snapshot* exacto enmascarado para sus propias pruebas — reproducibilidad como API pública.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientes orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene una guía completa, amigable para principiantes, para agregar el tuyo mediante un **pull request**, incluso si nunca has usado git: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, paso a paso. No se asume experiencia previa en git.

Bienvenido a escribir Python fuera del navegador. 🎓