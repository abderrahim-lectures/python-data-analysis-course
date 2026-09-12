---
title: "Rastreador de Solicitudes de Subvenciones"
description: "Gestiona solicitudes de subvenciones con fechas límite, presupuestos y flujos de trabajo colaborativos."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["data-management", "csv", "datetime", "json", "cli"]
learningObjectives:
  - "Modelar entidades del mundo real con diccionarios y listas anidadas"
  - "Analizar, comparar y formatear fechas para el seguimiento de fechas límite"
  - "Persistir y recargar datos estructurados con JSON y CSV"
  - "Construir una aplicación CLI controlada por menús con validación de entrada"
prerequisites:
  - "Conceptos básicos de Python (variables, bucles, funciones)"
  - "Diccionarios y listas"
---

# 🛠️ 💰 Rastreador de Solicitudes de Subvenciones

Las oficinas de investigación manejan docenas de propuestas a la vez, cada una con un financiador, una fecha límite estricta, un presupuesto, un equipo y un rastro de gastos. Este proyecto construye un rastreador de subvenciones de línea de comandos que modela cada solicitud como un diccionario anidado, vigila el gasto contra su presupuesto, ordena las fechas límite próximas y guarda todo en disco para que tu trabajo sobreviva entre sesiones.

Esto asume Python 101 y comodidad con diccionarios y listas, no se requiere nada de Análisis de Datos. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa y creciente.

## 🎯 Lo que harás

1. Modelar una solicitud de subvención como un diccionario anidado que contiene un equipo, un presupuesto y un libro de gastos.
2. Añadir gastos con validación para que una propuesta nunca pueda gastar de más en silencio respecto a su presupuesto.
3. Construir un panel de fechas límite que marque las solicitudes vencidas y próximas a vencer, ordenadas por urgencia.
4. Persistir todo en JSON y exportar un CSV que alguien pueda abrir en una hoja de cálculo.
5. Guiar todo desde una CLI interactiva controlada por menús que sobrevive a entradas incorrectas.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal, pero a diferencia de la mayoría de los proyectos de esta serie, este no tiene dependencias externas: todo usa la biblioteca estándar (`datetime`, `json`, `csv`, `os`). Eso lo convierte en uno de los proyectos más amigables para probar de verdad el flujo de trabajo local del curso: una carpeta de proyecto real, un script real y archivos reales escritos en disco en cada ejecución.

**Google Colab, Binder y Kaggle Notebooks** también lo ejecutan cómodamente, el notebook refleja cada paso de abajo, y como no hace falta instalar paquetes, el camino del navegador tiene fidelidad completa en lugar de ser una simulación degradada. **JupyterLite**, el playground en el navegador, también ejecutará los pasos de modelo de datos y panel, ya que nada aquí necesita bibliotecas nativas. Una advertencia honesta: el archivo JSON que guardes vive en el sistema de archivos efímero del notebook en el navegador, así que trátalo como un camino de prueba y usa una carpeta local cuando quieras que los datos persistan de verdad entre sesiones reales.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/grant-tracker/notebook.es.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/grant-tracker/notebook.es.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fgrant-tracker%2Fnotebook.es.ipynb)

## Configuración

Crea la carpeta del proyecto. No hay dependencia que instalar, cada módulo que este proyecto usa viene con Python.

```bash
uv init grant-tracker
cd grant-tracker
```

```bash
uv run python --version
```

Cada módulo que este proyecto usa, `datetime`, `json`, `csv`, `os`, es parte de la biblioteca estándar, así que no hay paso de `uv add` ni un `requirements.txt` que pueda salir mal. Es una característica deliberada: el mismo `grant_tracker.py` se ejecuta en tu terminal, en el notebook del curso y en el navegador, porque nada de esto necesita un paquete nativo.

**✅ Lista de verificación**

- ✅ `uv run python --version` imprime Python 3.9 o más reciente (el código usa type hints `list[str]`).
- ✅ `grant-tracker/` existe y `uv init grant-tracker` terminó sin errores.
- ✅ `uv run python -c "import json, csv, datetime, os"` sale en silencio, todo el kit de herramientas está presente.

## Paso 1: Modela una subvención como un diccionario anidado

Una solicitud de subvención es más que una fila plana de campos: tiene un presupuesto, un equipo de personas y una lista creciente de gastos. La forma natural en Python para eso es un **diccionario anidado**, un `dict` cuyos valores son a su vez listas y cadenas, porque te permite llevar una solicitud completa como un solo objeto, pasarla a funciones y persistirla directamente a JSON más adelante.

### 1.1 Escribe la fábrica de subvenciones

**👟 Pista inicial :** Escribe una función que devuelva un diccionario de subvención completamente formado, para que cada subvención que crees tenga las mismas claves desde el principio, la consistencia gana sobre la conveniencia cuando más tarde iterarás sobre cientos de estas.

```python
# grant_tracker.py
from datetime import datetime

def create_grant(
    title: str,
    funder: str,
    deadline: str,
    total_budget: float,
    team: list[str] | None = None,
) -> dict:
    """Create a new grant application record."""
    return {
        "id": datetime.now().strftime("%Y%m%d%H%M%S"),
        "title": title,
        "funder": funder,
        "deadline": deadline,
        "total_budget": total_budget,
        "spent": 0.0,
        "team": team or [],
        "status": "draft",
        "created": datetime.now().isoformat(),
        "expenses": [],
    }

grant = create_grant(
    "NSF Career Development",
    "National Science Foundation",
    "2026-10-15",
    500000.00,
    ["Alice", "Bob"],
)
print(grant)
```

Las dos líneas que cargan con el diseño son `"team": team or []` y `"expenses": []`. `team or []` colapsa tanto `None` como una lista vacía en el mismo estado inicial seguro, así que los llamadores pueden no pasar nada y aun así obtener una lista, nunca un `None` con el que tropezarse más tarde. Y `"expenses": []` inicia un libro de gastos vacío al que el Paso 2 añadirá; mantenerlo dentro del dict de la subvención, en lugar de en una lista global paralela, es lo que hace que cada subvención sea autocontenida.

**🎯 Resultado esperado :** Un diccionario cuyo `id` y `created` coinciden con la hora actual, con `spent: 0.0`, `status: "draft"`, `team: ["Alice", "Bob"]` y `expenses: []`.

**🩹 Si sale mal :** Si `team` muestra `[]` cuando pasaste `["Alice", "Bob"]`, probablemente estás imprimiendo la variable equivocada, `create_grant` *devuelve* un dict nuevo, así que reasigna el resultado (`grant = create_grant(...)`) en lugar de imprimir un dict que guardaste con otro nombre. Si `NameError: name 'datetime' is not defined`, falta la línea `from datetime import datetime` o está debajo de la función. Si el propio hint `list[str]` da error, tienes Python anterior a 3.9, ve al punto de control de versión en Configuración.

### 1.2 Crea el portafolio que harás seguimiento

**👟 Pista inicial :** Crea tres subvenciones con financiadores, presupuestos y fechas límite diferentes, incluyendo una fecha límite dentro de los próximos 30 días, para que el panel del Paso 3 tenga variedad real.

```python
# grant_tracker.py (continued)
grants = [
    create_grant("NSF Career Development", "National Science Foundation", "2026-10-15", 500000.00, ["Alice", "Bob"]),
    create_grant("NIH R01 Proposal", "National Institutes of Health", "2026-11-01", 350000.00, ["Carol"]),
    create_grant("Local Community Grant", "City Foundation", "2026-09-30", 25000.00, ["Bob", "Carol"]),
]

for g in grants:
    print(f"{g['title']:28} {g['funder']:28} {g['deadline']}  ${g['total_budget']:>12,.2f}")
```

Una lista de dicts es la unidad básica que tomará cada función posterior: ordenarla, filtrarla, guardarla. Los especificadores de ancho del f-string (`:28`, `:>12`) rellenan cada valor para que las columnas queden alineadas, un pequeño truco de formato que convierte dicts crudos en algo legible de un vistazo, sin ninguna biblioteca de reportes.

**🎯 Resultado esperado :** Tres líneas alineadas, una por subvención, mostrando título, financiador, fecha límite y un presupuesto formateado, por ejemplo `Local Community Grant      City Foundation          2026-09-30  $    25,000.00`.

**🩹 Si sale mal :** Si las columnas se pegan, tus números de ancho son menores que el valor más largo, sube el `:28`. Si ves presupuestos numéricamente correctos pero con espaciado raro, es el separador de miles `,` más el ancho de campo haciendo su trabajo; ajusta el ancho, no el especificador de formato.

### 1.3 Verifica el modelo de datos

**✅ Lista de verificación**

- ✅ `create_grant(...)` devuelve un dict con todas las claves esperadas: `id`, `title`, `funder`, `deadline`, `total_budget`, `spent`, `team`, `status`, `created`, `expenses`.
- ✅ Llamarla sin el argumento `team` produce `team: []`, nunca `None`.
- ✅ `grants` es una lista de tres dicts y el bucle imprime tres filas alineadas.

**🤔 Pregunta(s) socrática(s)**

- `team or []` trata `None` y `[]` de forma idéntica, pero, ¿qué haría si alguien pasara la *cadena* `"Bob"` como equipo en lugar de una lista? ¿Por qué eso es una receta para un error confuso más tarde, y qué única comprobación dentro de `create_grant` lo atraparía?
- La fecha límite se guarda como la cadena `"2026-10-15"`, no como un objeto `datetime`. ¿Qué se rompe en el momento en que intentas guardar un `datetime` real en un archivo JSON, y por qué, entonces, una cadena ISO simple es la representación más honesta aquí?

## Paso 2: Protege el presupuesto mientras registras gastos

El presupuesto de una subvención es una restricción dura: el gasto es legítimo solo mientras se mantenga dentro de `total_budget`. Este paso construye un libro de gastos que hace cumplir esa regla en el momento de la inserción, para que un sobre-gasto se convierta en un error sonoro e inmediato en lugar de un número negativo silencioso en un reporte meses después.

### 2.1 Registra un gasto con validación

**👟 Pista inicial :** Una función, tres trabajos: verifica que el monto sea positivo, verifica que quepa en el presupuesto restante, y solo entonces añádelo al libro de gastos de la subvención y actualiza `spent`.

```python
# grant_tracker.py (continued)
def add_expense(grant: dict, description: str, amount: float, phase: str) -> dict:
    """Record an expense against a grant."""
    if amount <= 0:
        raise ValueError("Expense amount must be positive")
    if amount > grant["total_budget"] - grant["spent"]:
        raise ValueError("Expense exceeds remaining budget")

    expense = {
        "date": datetime.now().isoformat(),
        "description": description,
        "amount": amount,
        "phase": phase,
    }
    grant["expenses"].append(expense)
    grant["spent"] = round(grant["spent"] + amount, 2)
    return expense

expense = add_expense(grant, "Statistician consultation", 4500.00, "writing")
print(grant["spent"])
print(grant["expenses"][-1]["description"])
```

La validación ocurre **antes** de cualquier mutación: ambas comprobaciones `if` lanzan antes de que cambie un solo campo, así que un gasto rechazado no puede corromper el total `spent` de la subvención. Ese orden, comprobar todo, luego mutar, es la misma disciplina que verás en el código de libros bancarios y en transacciones de bases de datos. El `round(..., 2)` evita que la aritmética de punto flotante (que acumula errores diminutos como `0.1 + 0.2`) se desvíe hacia los centavos a lo largo de cientos de entradas.

**🎯 Resultado esperado :** Imprime `4500.0` y luego `Statistician consultation`. Llamar a `add_expense(grant, "Over", 999999, "writing")` lanza `ValueError: Expense exceeds remaining budget` y deja `spent` intacto.

**🩹 Si sale mal :** Si un gasto sobredimensionado *suma* a `spent` en lugar de lanzar, falta el segundo `if` o el raise ocurre después de la mutación. Si ves `4500.0` donde esperabas `4500.00`, es el despliegue de punto flotante, no un bug, imprime `f"{grant['spent']:.2f}"`. Si obtienes `KeyError: 'spent'`, el dict que estás pasando no fue construido por `create_grant` (Paso 1), así que sus claves no coinciden.

### 2.2 Resume el estado del presupuesto

**👟 Pista inicial :** Escribe una función *pura* que lea una subvención y devuelva su fotografía del presupuesto, total, gastado, restante, porcentaje usado, para que cada pantalla posterior muestre números idénticos.

```python
# grant_tracker.py (continued)
def budget_summary(grant: dict) -> dict:
    """Return a budget summary for a single grant."""
    remaining = round(grant["total_budget"] - grant["spent"], 2)
    pct_used = 0.0
    if grant["total_budget"] > 0:
        pct_used = round((grant["spent"] / grant["total_budget"]) * 100, 1)
    return {
        "title": grant["title"],
        "total": grant["total_budget"],
        "spent": grant["spent"],
        "remaining": remaining,
        "percent_used": pct_used,
    }

print(budget_summary(grant))
```

Las funciones puras, entrada adentro, números derivados afuera, no se toca ningún estado, son el corazón de un script de datos mantenible. `budget_summary` no cambia el presupuesto; lo reporta, que es por qué el Paso 3 puede llamarla dentro de un bucle sin efectos secundarios. La guarda explícita `if grant["total_budget"] > 0`, en lugar de dividir a ciegas, maneja la propuesta aún en redacción con un presupuesto de cero para que obtengas `0.0` en lugar de un `ZeroDivisionError`.

**🎯 Resultado esperado :** Un dict como `{'title': 'NSF Career Development', 'total': 500000.0, 'spent': 4500.0, 'remaining': 495500.0, 'percent_used': 0.9}`.

**🩹 Si sale mal :** Si te encuentras con `ZeroDivisionError`, falta la guarda del presupuesto total. Si `percent_used` es un flotante largo como `0.8999999...`, falta el `round` en la línea de división, aplica `round(x, 1)` al porcentaje final.

### 2.3 Verifica la guarda del presupuesto

**✅ Lista de verificación**

- ✅ Un gasto válido se añade a `grant["expenses"]` y aumenta `grant["spent"]`.
- ✅ Un monto de `0`, un monto negativo, o uno mayor que el presupuesto restante lanza un `ValueError`, y `spent` queda sin cambios después.
- ✅ `budget_summary(grant)` devuelve `total`, `spent`, `remaining` y `percent_used`, y nunca divide entre cero.

**🤔 Pregunta(s) socrática(s)**

- La comprobación de sobre-gasto usa `amount > grant["total_budget"] - grant["spent"]`. ¿Qué pasaría si movieras el `round(...)` a esa resta en lugar de a la actualización, podría una secuencia de gastos válidos pequeños llegar a *parecer* sobre-gastada? (Prueba `0.1 + 0.2` en un REPL para ver por qué esto es una pregunta real.)
- Un reembolso es económicamente un gasto negativo. ¿Debería `add_expense` aceptar montos negativos, o permitirlos debilitaría la guarda? ¿Qué necesitaría el punto de llamada para distinguir un reembolso legítimo de un error de escritura?

## Paso 3: Construye el panel de fechas límite

Las fechas límite son lo que de verdad decide quién recibe financiamiento. Este paso convierte las cadenas de fecha ISO crudas en decisiones basadas en el tiempo: cuántos días faltan para cada fecha límite, qué subvenciones ya están vencidas y en qué orden deberías trabajar.

### 3.1 Calcula los días hasta cada fecha límite

**👟 Pista inicial :** Analiza cada fecha límite con `datetime.fromisoformat`, resta *hoy*, adjunta una etiqueta de `status` lista para humanos, y luego ordena toda la lista por urgencia.

```python
# grant_tracker.py (continued)
from datetime import timedelta

def upcoming_deadlines(grants: list[dict], days_ahead: int = 30) -> list[dict]:
    """Return grants with deadlines within the next N days, sorted soonest first."""
    today = datetime.now()
    cutoff = today + timedelta(days=days_ahead)

    results = []
    for grant in grants:
        deadline = datetime.fromisoformat(grant["deadline"])
        days_left = (deadline - today).days
        results.append({
            "title": grant["title"],
            "funder": grant["funder"],
            "deadline": grant["deadline"],
            "days_left": days_left,
            "status": "OVERDUE" if days_left < 0 else f"{days_left} days left",
            "budget_status": budget_summary(grant),
        })

    results.sort(key=lambda g: g["days_left"])
    return results

for item in upcoming_deadlines(grants):
    print(f"{item['status']:>16}  {item['title']}  ({item['budget_status']['percent_used']}% used)")
```

`datetime.fromisoformat` analiza la cadena ISO de vuelta a un `datetime` real para que la resta tenga sentido: `(deadline - today).days` produce un entero simple, negativo cuando está vencido y positivo cuando está próximo. Ordenar por `days_left` organiza la lista de lo más vencido a lo más lejano en una línea, porque la clave de orden ya codifica la urgencia. Anidar `budget_status` dentro de cada elemento es el beneficio de la función pura del Paso 2: una llamada, y el panel obtiene contexto presupuestario gratis.

**🎯 Resultado esperado :** Tres líneas, una por subvención, mostrando `OVERDUE` o `N days left` más el porcentaje del presupuesto usado, con la subvención vencida o más urgente primero.

**🩹 Si sale mal :** Si obtienes `ValueError: Invalid isoformat string`, una fecha límite en tus datos no es una cadena `YYYY-MM-DD` limpia, el estricto `fromisoformat` es exactamente la razón por la que el Paso 1 guarda las fechas en ese único formato. Si cada línea muestra `0 days left`, puedes estar comparando un `date` con un `datetime` o analizando en una medianoche distinta, inspecciona con `print(type(today), type(deadline))`. Si el orden parece aleatorio, el sort por `key=` no se está aplicando a la lista que imprimes.

### 3.2 Renderea el panel

**👟 Pista inicial :** Formatea la lista ya calculada como un reporte legible, un banner, un bloque por subvención y un marcador `!!!` grueso en cualquier cosa vencida.

```python
# grant_tracker.py (continued)
def print_dashboard(grants: list[dict]) -> None:
    """Display a formatted deadline dashboard."""
    upcoming = upcoming_deadlines(grants)
    print("\n" + "=" * 60)
    print("GRANT DEADLINE DASHBOARD")
    print("=" * 60)
    for item in upcoming:
        marker = "!!!" if item["days_left"] < 0 else "   "
        print(f"{marker} {item['title']}")
        print(f"     Funder: {item['funder']}")
        print(f"     Deadline: {item['deadline']} -- {item['status']}")
        budget = item["budget_status"]
        print(f"     Budget: ${budget['spent']:.2f} / ${budget['total']:.2f} ({budget['percent_used']}% used)")
        print()

print_dashboard(grants)
```

`print_dashboard` tiene exactamente un trabajo, convertir datos ya calculados en salida legible, y deliberadamente no hace *ningún* cálculo propio. Separar "calcular" y "mostrar" significa que puedes intercambiar después este renderizador de texto por una página HTML o un gráfico sin tocar `upcoming_deadlines` en absoluto.

**🎯 Resultado esperado :** Un banner `GRANT DEADLINE DASHBOARD`, luego un bloque por subvención ordenado por urgencia, con `!!!` prefijado a cualquier subvención vencida y líneas de presupuesto como `Budget: $4,500.00 / $500,000.00 (0.9% used)`.

**🩹 Si sale mal :** Si el panel imprime en orden de creación, `print_dashboard` está iterando sobre la lista cruda `grants` en lugar de llamar a `upcoming_deadlines`. Si `!!!` nunca aparece, ninguna fecha límite está antes de hoy, añade una fecha deliberadamente pasada para probar el marcador. Si los presupuestos muestran dólares enteros, faltan los especificadores `:.2f` en los f-strings del presupuesto.

### 3.3 Verifica el panel

**✅ Lista de verificación**

- ✅ `upcoming_deadlines(grants)` devuelve elementos ordenados de lo más vencido a la fecha límite más lejana.
- ✅ Una subvención vencida muestra `OVERDUE` en su `status` y un marcador `!!!` en `print_dashboard`.
- ✅ Cada elemento del panel lleva una fotografía `budget_status` anidada del Paso 2.

**🤔 Pregunta(s) socrática(s)**

- El panel ordena *lo más pronto primero*, así que la subvención más vencida encabeza la lista. Para una oficina de investigación real, ¿"lo más vencido primero" es siempre el orden correcto, o puedes imaginar un criterio (presupuesto en riesgo, prioridad del financiador) que debería superarlo? ¿Cómo ordenarías por `days_left` y luego por una segunda clave?
- `(deadline - today).days` elimina la hora del día por completo. Si una fecha límite fuera `2026-10-15 23:59`, ¿en qué momento `days_left` cambia de `0` a `-1`? ¿Es esa una advertencia temprana o tardía?

## Paso 4: Persiste en JSON y exporta a CSV

Ahora mismo tus subvenciones desaparecen cuando el proceso termina. Este paso las escribe en disco con JSON, el formato natural para diccionarios anidados, y exporta un CSV aplanado para que cualquiera con una hoja de cálculo pueda trabajar con los mismos datos.

### 4.1 Guarda y carga subvenciones

**👟 Pista inicial :** Dos funciones pequeñas, un archivo, sin dependencias: `json.dump` para escribir, `json.load` para leer de vuelta, y una comprobación de existencia para que un archivo faltante se cargue como una lista vacía en lugar de fallar.

```python
# grant_tracker.py (continued)
import json
import os

DATA_FILE = "grants.json"

def save_grants(grants: list[dict]) -> None:
    """Save all grants to a JSON file."""
    with open(DATA_FILE, "w") as f:
        json.dump(grants, f, indent=2)
    print(f"Saved {len(grants)} grants to {DATA_FILE}")

def load_grants() -> list[dict]:
    """Load grants from disk, returning an empty list if the file is missing."""
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE) as f:
        return json.load(f)

save_grants(grants)
print(load_grants() == grants)
```

`json.dump(grants, f, indent=2)` escribe la estructura anidada, gastos, equipos, presupuestos, como texto legible que preserva exactamente las formas que `create_grant` produjo, porque los dicts, las listas, las cadenas y los flotantes tienen representaciones JSON. El viaje de ida y vuelta es la prueba real aquí: `print(load_grants() == grants)` debería ser `True`, lo que prueba que no se perdió nada al reescribir datos a texto y de vuelta.

**🎯 Resultado esperado :** Imprime `Saved 3 grants to grants.json` y luego `True` (las subvenciones cargadas igualan las originales, dict por dict).

**🩹 Si sale mal :** Si la comparación imprime `False`, aísla la deriva, `load_grants()[0] == grants[0]` te dice si es toda la lista o una subvención. Si obtienes `TypeError: Object of type datetime is not JSON serializable`, un objeto `datetime` se coló en una subvención; JSON no puede representar uno, que es exactamente por qué el Paso 1 guarda `created` como cadena. Si el archivo se abre como una línea larga, se eliminó `indent=2`.

### 4.2 Exporta un CSV amigable para hojas de cálculo

**👟 Pista inicial :** Aplana cada subvención anidada en las seis columnas que una oficina de financiamiento realmente quiere, y escríbelas con el módulo `csv` para que las comas dentro de los valores se citen por ti.

```python
# grant_tracker.py (continued)
import csv

def export_grants_csv(grants: list[dict], filepath: str = "grants.csv") -> None:
    """Write grant data to CSV with one row per grant."""
    fieldnames = ["title", "funder", "deadline", "total_budget", "spent", "status"]
    with open(filepath, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for grant in grants:
            writer.writerow({name: grant.get(name, "") for name in fieldnames})
    print(f"Exported {len(grants)} grants to CSV: {filepath}")

export_grants_csv(grants)
```

CSV es un formato *plano*, no puede contener una lista `team` anidada ni un libro `expenses` en una sola celda, así que exportar es una simplificación deliberada: eliges las seis columnas escalares que sobreviven al aplanado. `csv.DictWriter` toma un dict por fila y maneja el citado por sí mismo (un título que contenga una coma sigue siendo un campo), que es exactamente la clase de bug que invita a construir CSV uniendo cadenas a mano.

**🎯 Resultado esperado :** Un archivo `grants.csv` con una fila de encabezado más tres filas de datos, y la impresión `Exported 3 grants to CSV: grants.csv`.

**🩹 Si sale mal :** Si el CSV se abre como una línea corrida, al `open` le falta `newline=""`, un artefacto de fin de línea que el módulo `csv` no arregla por ti. Si las columnas llegan en el orden equivocado, `fieldnames` es la autoridad de orden, reórdénalo a él, no al dict. Si `writerow` se queja de una clave faltante, el dict de una subvención carece de uno de los campos listados; `.get(name, "")` cubre exactamente eso.

### 4.3 Verifica la persistencia y la exportación

**✅ Lista de verificación**

- ✅ `grants.json` existe y su contenido sobrevive a una re-ejecución, `load_grants()` devuelve las mismas subvenciones que guardaste.
- ✅ `grants.csv` se abre en una hoja de cálculo con las seis columnas esperadas y una fila por subvención.
- ✅ `load_grants()` devuelve `[]` sin fallar cuando el archivo está ausente.

**🤔 Pregunta(s) socrática(s)**

- El viaje de ida y vuelta de JSON probó `load_grants() == grants`, y sin embargo la exportación a CSV descarta deliberadamente el equipo y los gastos. ¿Qué está haciendo útilmente el archivo CSV que JSON no puede, y qué perderías si CSV fuera el único formato que conservaras?
- Experimento mental de versionado: seis meses después, añades una clave `cost_share` a `create_grant`. ¿Qué pasa cuando `load_grants()` lee el archivo antiguo en el que esa clave no existe en absoluto, y qué implica eso sobre dónde deberían vivir las migraciones de datos a medida que evoluciona un esquema guardado?

## Paso 5: Guíalo todo desde una CLI controlada por menús

Las funciones que construiste son una biblioteca; una CLI las hace utilizables por una persona. Este paso las envuelve en un bucle que muestra un menú, lee una elección, la valida y la enruta a la acción correcta, el mismo esqueleto detrás de docenas de herramientas administrativas reales.

### 5.1 Escribe el bucle principal del menú

**👟 Pista inicial :** Inicia un bucle `while True`, imprime opciones numeradas, lee la entrada y despacha. Valida siempre antes de tocar cualquier dato, y compara las elecciones como cadenas para que una `"q"` suelta no pueda romper nada.

```python
# grant_tracker.py (continued)
grants = load_grants() or grants  # pick up any saves from earlier runs

def menu() -> None:
    while True:
        print("\n--- GRANT TRACKER MENU ---")
        print("1. Show deadline dashboard")
        print("2. Add an expense")
        print("3. Export to CSV")
        print("4. Save")
        print("5. Quit")
        choice = input("> ").strip()

        if choice == "1":
            print_dashboard(grants)
        elif choice == "2":
            title = input("Grant title: ").strip()
            grant = next((g for g in grants if g["title"] == title), None)
            if grant is None:
                print(f"No grant titled '{title}'.")
                continue
            desc = input("Description: ").strip()
            amount = input("Amount: ").strip()
            try:
                add_expense(grant, desc, float(amount), input("Phase: ").strip())
                print("Expense recorded.")
            except ValueError as exc:
                print(f"Invalid: {exc}")
        elif choice == "3":
            export_grants_csv(grants)
        elif choice == "4":
            save_grants(grants)
        elif choice == "5":
            save_grants(grants)
            print("Bye!")
            break
        else:
            print(f"Unknown choice: {choice}")

menu()
```

Tres decisiones hacen que este bucle sea tolerante a errores. La entrada se lee como una **cadena** y se compara con literales de cadena, así que los caracteres sueltos no pueden romper el sistema de tipos. `float(amount)` está envuelto en `try/except ValueError`, atrapando el fallo *esperado* ("abc" no es un número) y mostrando al usuario un mensaje en lugar de un traceback. Y `next((g for g in grants if g["title"] == title), None)` busca en la lista por un campo único, `title` aquí, aunque una herramienta en producción usaría el `id` de la subvención del Paso 1 para sobrevivir a nombres duplicados.

**🎯 Resultado esperado :** El menú se imprime; la opción `1` muestra el panel del Paso 3, la opción `2` con un título y un monto reales registra un gasto (lanzando `ValueError` en sobre-gasto), la opción `3` escribe `grants.csv`, y `5` guarda antes de salir.

**🩹 Si sale mal :** Si un monto no numérico produce un traceback, `try/except ValueError` no está envuelto alrededor de `float(amount)`. Si escribir `1` no hace nada, compara la rama cruda, un `.rstrip()` suelto puede haberse comido el dígito, o el código del menú nunca se guardó. Si el menú nunca muestra los datos de hoy, la línea `grants = load_grants() or grants` no está encima del bucle.

### 5.2 Verifica la aplicación interactiva

**✅ Lista de verificación**

- ✅ Cada opción del menú ejecuta su acción: panel, gasto, exportación a CSV, guardar.
- ✅ Una mala elección del menú imprime un mensaje amigable en lugar de fallar.
- ✅ Un monto malo (`"abc"`, negativo, sobre presupuesto) se atrapa y se reporta sin salir del bucle ni corromper `spent`.
- ✅ Salir guarda las subvenciones actuales en `grants.json`.

**🤔 Pregunta(s) socrática(s)**

- La opción 5 guarda y sale. ¿Qué pasa si el usuario cierra la terminal en lugar de elegirla, y qué te daría un `try/finally` alrededor del bucle que el guardado del camino feliz no te da?
- El menú valida el *monto* pero te pide que escribas el título de la subvención a mano. Si dos subvenciones compartieran un título, ¿qué ambigüedad crearía eso, y por qué indexar las subvenciones por el `id` de `create_grant` sería el diseño más robusto?

## ⚠️ Errores comunes

- **Sobre-gastar corrompe silenciosamente el libro de gastos.** Si la validación no vive *dentro* de `add_expense`, una entrada mala simplemente hace que `remaining` sea negativo, y el panel reporta alegremente `-12.3% used`. Solución: mantén ambas guardas `ValueError` antes de cualquier mutación (Paso 2), y trata un restante negativo como un bug, no como un reporte.
- **Cadenas de fecha límite inconsistentes rompen `fromisoformat`.** Una subvención guardada como `"Oct 15, 2026"` y otra como `"2026-10-15"` hace que `datetime.fromisoformat` lance en la primera. Solución: impón el formato ISO en el origen, valida la cadena dentro de `create_grant` con `datetime.fromisoformat(deadline)`, y solo escribe fechas límite a través de esa única función.
- **Dinero como flotantes crudos.** `round(0.1 + 0.2, 2)` está bien para el despliegue, pero los flotantes sin redondear se desvían a lo largo de cientos de gastos. Solución: redondea en cada mutación (como hace `add_expense`), mantén el formato de despliegue (`:.2f`) separado de los valores guardados, y recurre a `decimal.Decimal` cuando los centavos realmente importen.
- **Olvidar guardar.** Cada acción del menú muta la lista en memoria; un accidente a mitad de sesión pierde todo desde el último `save_grants`. Solución: guarda después de cada acción mutante (la opción 5 del menú hace esto), y considera guardar antes de aceptar un gasto.
- **Guardar datetimes en JSON.** Un `datetime` no es serializable a JSON (obtienes un `TypeError` al volcar) y se vuelve una cadena de forma pobre al recargar. Solución: guarda cadenas ISO desde el principio (Paso 1) y analiza a `datetime` solo dentro de las funciones que necesitan matemática de fechas real.

## Lo que acabas de construir

Un rastreador de solicitudes de subvención funcional: los diccionarios anidados modelan cada propuesta, `add_expense` hace cumplir los límites del presupuesto en el momento de escribir, `datetime` convierte las fechas límite en un panel ordenado por urgencia, y JSON más CSV dejan que los datos persistan e interoperen. La habilidad transferible es la *disciplina de modelado de datos más persistencia*: representar una entidad del mundo real como datos anidados, proteger sus invariantes y moverla entre memoria y disco, la misma forma detrás de libretas de contactos, sistemas de pedidos y herramientas de inventario.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/grant-tracker/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/grant-tracker) en el repositorio del curso incluye el script completo con un flujo de trabajo de estado y un reporte de carga de trabajo por equipo ya incluidos. Clónalo, o abre todo el repositorio en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde ahí.
:::

## A dónde ir desde aquí

- Añade un **flujo de trabajo de estado** para que las subvenciones se muevan en un orden legal, `draft` → `submitted` → `review` → `funded`/`rejected`. Un dict `VALID_TRANSITIONS` (una clave por estado, valores = pasos siguientes permitidos) es toda la especificación; el rastreador entonces rechaza saltos ilegales como un oficial de programas escéptico.
- Construye un **reporte de carga de trabajo por equipo** que cuente las subvenciones y el presupuesto total gestionado por miembro del equipo, una adición de un solo `Counter` a la función de resumen del Paso 2, y genuinamente así es como una oficina detecta a un colaborador sobre-asignado.
- Envía **recordatorios por email** para fechas límite próximas con `smtplib`, ya tienes `upcoming_deadlines()` produciendo exactamente la lista que un trabajo de recordatorios necesita. La pequeña pista: `smtplib` necesita credenciales y un servidor real o de prueba, así que dispáralo primero contra un servidor SMTP local.
- Sustituye el almacenamiento JSON por `sqlite3` cuando las consultas se vuelvan complejas (filtrar por financiador más estado). `load_grants` se convierte en un `SELECT`, y todo lo posterior, cada función encima de él, se mantiene exactamente igual.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a gestionar los datos como una oficina de investigación. 🎓