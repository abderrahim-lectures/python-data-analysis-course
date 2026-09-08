---
title: "Constructor de Newsletters"
description: "Convierte una plantilla Markdown en números personalizados para suscriptores reales: renderiza con regex, gestiona una lista CSV con etiquetas, rastrea aperturas y clics, prueba líneas de asunto A/B, y envía un número personalizado a un segmento."
difficulty: "intermediate"
estimatedMinutes: 60
tags: ["markdown", "email", "templates", "data-management", "pandas"]
learningObjectives:
  - "Renderizar plantillas Markdown con sustitución de {{variable}}"
  - "Gestionar una lista CSV de suscriptores con etiquetas y segmentación"
  - "Rastrear aperturas y clics y calcular tasas de apertura/clics honestas"
  - "Ejecutar pruebas A/B en líneas de asunto y leer al ganador"
  - "Renderizar un número personalizado por suscriptor en un segmento"
prerequisites:
  - "Conceptos básicos de Python (funciones, bucles, diccionarios)"
  - "Conceptos básicos de CSV e instalación de paquetes con uv"
---

# 🛠️ 📰 Construye un Constructor de Newsletters

Cada lista de correo enfrenta la misma canalización: toma una plantilla, complétala para cada suscriptor, rastrea quién abrió y quién hizo clic, y descubre qué línea de asunto funciona de verdad. Este proyecto construye esa canalización en Python — un motor de plantillas con regex, una lista CSV de suscriptores con etiquetas, un rastreador de aperturas/clics que calcula tasas honestas, una prueba A/B para líneas de asunto, y un paso final que renderiza un número personalizado para cada suscriptor en un segmento.

Esto asume Python 101 y comodidad con funciones, diccionarios y listas — conocerás pandas en un paso, pero no se requiere nada más allá de eso. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa y creciente.

## 🎯 Lo que harás

1. Construir un motor de plantillas que reemplace `{{placeholders}}` en un boletín Markdown con valores de un diccionario.
2. Gestionar una lista CSV de suscriptores con etiquetas para poder dirigirte solo a los lectores de Python, no a todos.
3. Registrar aperturas y clics y calcular tasas de apertura/clics contra el tamaño real de la audiencia.
4. Ejecutar una prueba A/B en dos líneas de asunto y elegir un ganador a partir de los datos.
5. Renderizar un número personalizado por suscriptor en su propio archivo.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal. La única dependencia externa es `pandas`, que usarás una vez, para el paso de analíticas — todo lo demás es la biblioteca estándar (`re`, `csv`, `os`, `datetime`), y los archivos CSV que generes son ciudadanos de primera clase de tu propia carpeta.

**Google Colab, Binder y Kaggle Notebooks** ejecutan todo el asunto de forma idéntica: `!pip install pandas` una vez, luego cada paso de abajo, con el notebook devolviendo los mismos números renderizados y tablas de analíticas. **JupyterLite** puede ejecutar los pasos de plantilla y suscriptores en el navegador, y pandas también está disponible allí — la salvedad honesta es la misma que en toda esta serie: los archivos creados en el navegador viven en un sistema de archivos virtual efímero, así que trátalo como un camino de pruébalo-y-ve y usa `uv` local cuando quieras que `subscribers.csv` e `issues/` persistan de verdad.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/newsletter-builder/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/newsletter-builder/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fnewsletter-builder%2Fnotebook.ipynb)

## Configuración

Crea el proyecto e instala la única dependencia que usarás para las analíticas.

```bash
uv init newsletter-builder
cd newsletter-builder
uv add pandas
```

Los módulos `re` y `csv` vienen con Python, así que `pandas` es el único paquete de este proyecto — y llega exactamente una vez, en las analíticas del Paso 3. Instalar todo por adelantado mantiene los pasos posteriores enfocados en las *ideas* (plantillas, seguimiento, pruebas) en lugar de en pelearse con dependencias.

**✅ Lista de verificación**

- ✅ `uv add pandas` terminó y `uv run python -c "import pandas"` sale en silencio.
- ✅ Crea un proyecto vacío `newsletter-builder/` que ejecuta un script de una línea.

## Paso 1: Renderiza una plantilla Markdown

Un boletín que cambia para cada lector comienza con una plantilla que tiene huecos. Los huecos son marcadores de posición `{{curly}}`, y este paso construye el pequeño motor que los intercambia por valores reales — el núcleo sin dependencias de un sistema que de otro modo tiraría de una biblioteca de plantillas completa.

### 1.1 Escribe la función de renderizado

**👟 Pista inicial :** Usa una sola llamada a `re.sub` con un callback que busque cada marcador de posición en un diccionario, y decide explícitamente qué pasa cuando un marcador falta.

```python
# newsletter.py
import re

def render_template(template: str, variables: dict) -> str:
    """Replace {{variable}} placeholders with values from the variables dict."""
    def replacer(match):
        key = match.group(1).strip()
        return str(variables.get(key, f"[MISSING: {key}]"))

    return re.sub(r"\{\{(.+?)\}\}", replacer, template)

print(render_template(
    "Hello {{name}}, this is issue {{issue}}.",
    {"name": "Alice", "issue": "42"},
))
print(render_template("Hi {{name}}!", {}))
```

La única línea que hace todo el trabajo es `re.sub(r"\{\{(.+?)\}\}", replacer, template)`. El patrón `\{\{(.+?)\}\}` coincide con un `{{` de apertura, captura cualquier cosa adentro, y luego cierra en la primera `}}` — el `.+?` es *no codicioso*, así que se detiene temprano en lugar de tragarse varios marcadores de posición. Para cada coincidencia, el callback `replacer` busca la llave capturada en `variables`, y `str(...)` coacciona valores que no son cadenas (como el entero `42`) para que las plantillas nunca se estrellen con un número. El respaldo explícito `variables.get(key, "[MISSING: {key}]")` es una decisión de diseño: una variable faltante se convierte en un marcador *visible* en lugar de un `None` silencioso.

**🎯 Resultado esperado :** Primera impresión: `Hello Alice, this is issue 42.` Segunda impresión: `Hi [MISSING: name]!`

**🩹 Si sale mal :** Si la salida muestra `None` en lugar de valores, falta el envoltorio `str()` en la búsqueda. Si los marcadores de posición sobreviven literalmente en la salida, los corchetes escapados del regex están mal — `\{\{` no `{{`. Si *todo* variable muestra faltante, las llaves de `variables` y los nombres de la plantilla difieren (revisa un espacio suelto después de `{{` — que es para lo que está el `.strip()`).

### 1.2 Renderiza un número real desde una plantilla

**👟 Pista inicial :** Escribe el boletín como una sola cadena Markdown entre comillas triples, dale cada marcador de posición del dict, e imprime el número completamente renderizado.

```python
# newsletter.py (continued)
from datetime import datetime

NEWSLETTER_TEMPLATE = """# {{title}}

**Issue #{{issue_number}}** | {{date}}

---

## Hello {{subscriber_name}}!

{{intro}}

### This Week's Highlights

{{highlights}}

### Featured Article

**{{article_title}}**

{{article_summary}}

---

*You received this because you subscribed to {{newsletter_name}}.*
*Unsubscribe: {{unsubscribe_url}}*
"""

variables = {
    "title": "Weekly Python Tips",
    "issue_number": "42",
    "date": datetime.now().strftime("%B %d, %Y"),
    "subscriber_name": "Reader",
    "intro": "Welcome to this week's edition of Python Tips. Here is what we covered.",
    "highlights": "- List comprehensions\n- Decorator patterns\n- Type hints deep dive",
    "article_title": "Understanding Decorators",
    "article_summary": "Decorators let you modify function behavior without changing the function itself.",
    "newsletter_name": "Python Tips Weekly",
    "unsubscribe_url": "https://example.com/unsubscribe",
}

rendered = render_template(NEWSLETTER_TEMPLATE, variables)
print(rendered)
```

La plantilla es datos, no código — incluso incluye viñetas Markdown dentro de `{{highlights}}`, porque el valor se inserta *verbatim* y el Markdown circundante es lo que le da estructura. El renderizado y el contenido están totalmente separados: edita la plantilla, ajusta el dict, o ambos, sin tocar la función de renderizado. El valor `{{date}}` se computa una vez, en el momento del renderizado, así que dos lectores del mismo número ven la misma fecha.

**🎯 Resultado esperado :** Un número Markdown completo impreso bajo un H1 `# Weekly Python Tips`, con la fecha completada, tres viñetas de destacados, y el pie de página de suscripción/baja.

**🩹 Si sale mal :** Si la salida contiene un `{{...}}` crudo, ese marcador de posición falta en `variables` y el diccionario tiene un error tipográfico — el respaldo `[MISSING: ...]` de 1.1 te lo habría dicho, a menos que la llave difiera genuinamente en ortografía. Si faltan las viñetas, el valor `highlights` no contiene las líneas unidas por `\n`.

### 1.3 Verifica el motor de plantillas

**✅ Lista de verificación**

- ✅ Los marcadores de posición desconocidos se renderizan como `[MISSING: key]`, nunca como `None`.
- ✅ Los valores no-cadena (números, fechas) se renderizan sin error.
- ✅ La plantilla completa del boletín se renderiza de extremo a extremo con cada marcador de posición completado.

**🤔 Pregunta(s) socrática(s)**

- El patrón usa `.+?` no codicioso. ¿Qué cambiaría en la salida renderizada si escribieras `\{\{(.+)\}\}` (codicioso) en su lugar, en una plantilla que contenga *dos* marcadores de posición en una línea?
- El respaldo para una variable faltante es una cadena `[MISSING: ...]` visible. ¿Cuándo es insertar silenciosamente una cadena vacía el comportamiento *mejor* — y qué tipo de bug de plantilla ocultaría esa elección?

## Paso 2: Gestiona suscriptores con CSV

Una lista de personas es una tabla plana: una fila por suscriptor, unas pocas columnas por fila. CSV es el almacenamiento liso más honesto para eso — es legible por humanos, se abre en cualquier hoja de cálculo, y el módulo `csv` maneja el quoting por ti. Este paso construye funciones de agregar/cargar/segmentar alrededor de un solo archivo de suscriptores.

### 2.1 Crea y agrega suscriptores

**👟 Pista inicial :** Define un conjunto fijo de nombres de columnas una vez, reúsalo tanto para el encabezado como para cada fila, y deja que `datetime` ponga el sello de fecha de suscripción.

```python
# newsletter.py (continued)
import csv
import os
from datetime import datetime

SUBSCRIBER_FIELDS = ["email", "name", "tags", "subscribed_at", "status"]

def create_subscriber_file(filepath: str = "subscribers.csv"):
    """Create a new subscriber CSV file with headers."""
    with open(filepath, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=SUBSCRIBER_FIELDS)
        writer.writeheader()
    print(f"Created subscriber file: {filepath}")

def add_subscriber(email: str, name: str, tags: list[str], filepath: str = "subscribers.csv"):
    """Add a subscriber to the CSV file."""
    row = {
        "email": email,
        "name": name,
        "tags": ";".join(tags),
        "subscribed_at": datetime.now().isoformat(),
        "status": "active",
    }

    file_exists = os.path.exists(filepath)
    with open(filepath, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=SUBSCRIBER_FIELDS)
        if not file_exists:
            writer.writeheader()
        writer.writerow(row)
    print(f"Added subscriber: {email}")

create_subscriber_file()
add_subscriber("alice@example.com", "Alice", ["python", "data-science"])
add_subscriber("bob@example.com", "Bob", ["python", "web-dev"])
add_subscriber("carol@example.com", "Carol", ["data-science"])
```

La columna `tags` almacena una lista como cadena unida por punto y coma, `";".join(tags)` — las celdas CSV son planas, así que un campo multivalor tiene que empaquetarse de alguna manera, y se elige `;` porque las comas ya son el separador de columnas. El chequeo `file_exists` es el detalle sutil de corrección: agregar con `"a"` a un archivo *existente* no debe escribir una segunda fila de encabezado, mientras que un archivo *fresco* creado sin encabezado no tendría nombres de columnas en absoluto. `csv.DictWriter` escribe las filas por nombre de columna, lo que garantiza que cada fila coincida con la forma de todas las demás.

**🎯 Resultado esperado :** `Created subscriber file: subscribers.csv` seguido de tres líneas `Added subscriber: ...`, y un CSV cuyo encabezado es `email,name,tags,subscribed_at,status` con tres filas de datos.

**🩹 Si sale mal :** Si el CSV tiene un encabezado después de cada fila, cada llamada está escribiendo encabezados porque `file_exists` se evalúa contra una ruta obsoleta o el archivo se elimina entre llamadas. Si una etiqueta contiene una coma, `.join` no causó ruptura *porque el módulo csv pone entre comillas ese campo* — pero si ves la fila dividida, construiste la fila a mano como cadena cruda en lugar de usar `DictWriter`. Si falta un timestamp, la asignación `datetime.now().isoformat()` está ausente del dict de la fila.

### 2.2 Carga y segmenta la lista

**👟 Pista inicial :** Lee el archivo de vuelta con `csv.DictReader` y filtra desempacando las etiquetas empaquetadas — o comparando una sola columna de estado.

```python
# newsletter.py (continued)
def load_subscribers(filepath: str = "subscribers.csv") -> list[dict]:
    """Load all subscribers from the CSV file."""
    if not os.path.exists(filepath):
        return []
    with open(filepath, "r") as f:
        reader = csv.DictReader(f)
        return list(reader)

def filter_by_tag(subscribers: list[dict], tag: str) -> list[dict]:
    """Filter subscribers who have a specific tag."""
    return [s for s in subscribers if tag in s.get("tags", "").split(";")]

def filter_by_status(subscribers: list[dict], status: str) -> list[dict]:
    """Filter subscribers by status (active, unsubscribed, bounced)."""
    return [s for s in subscribers if s.get("status") == status]

subscribers = load_subscribers()
print(f"All subscribers: {len(subscribers)}")
print(f"Python subscribers: {len(filter_by_tag(subscribers, 'python'))}")
print(f"Data science subscribers: {len(filter_by_tag(subscribers, 'data-science'))}")
```

`csv.DictReader` convierte cada fila CSV en un dict con las llaves de los nombres de encabezado — el inverso exacto del `DictWriter` de 2.1, así que cargar y guardar son simétricos por construcción. Los dos filtros son compresiones de lista diminutas, pero se construyen sobre la elección de empaquetado anterior: `s.get("tags", "").split(";")` desempaca la cadena almacenada de vuelta a una lista para que la prueba de pertenencia `in` sea por etiqueta, no un emparejamiento de subcadena descuidado (que haría coincidir falsamente "python" contra "python3🐍"). Mantener los filtros como funciones nombradas separadas significa que puedes componerlos — un paso posterior combina `filter_by_tag` y `filter_by_status` en una sola expresión.

**🎯 Resultado esperado :** `All subscribers: 3`, `Python subscribers: 2`, `Data science subscribers: 2` — Alice y Bob llevan la etiqueta `python`, Alice y Carol la `data-science`.

**🩹 Si sale mal :** Si los suscriptores de Python muestran `0`, falta el paso `.split(";")` y la pertenencia se está probando contra la cadena cruda del cable. Si cargar se estrella con un archivo de encabezado inesperado, el archivo fue creado por algo distinto a las funciones de este proyecto. Si las cargas devuelven una lista vacía, el directorio de trabajo difiere de donde vive `subscribers.csv` — las rutas absolutas o una ruta relativa fija lo arreglan.

### 2.3 Verifica la lista de suscriptores

**✅ Lista de verificación**

- ✅ El CSV tiene exactamente una fila de encabezado y tres filas de datos.
- ✅ `load_subscribers()` devuelve tres dicts, cada uno con los cinco campos.
- ✅ El filtrado por etiqueta devuelve 2, 1 o 0 coincidiendo exactamente con cómo etiquetaste a la gente.

**🤔 Pregunta(s) socrática(s)**

- Las etiquetas se empaquetan con `;`, y los filtros desempacan con `.split(";")`. ¿Qué saldría mal si un nombre de etiqueta *en sí mismo* contuviera un punto y coma — y dónde en la canalización surgiría primero esa ambigüedad?
- `add_subscriber` escribe un encabezado solo cuando el archivo es nuevo. ¿Por qué esa rama es mejor que llamar siempre a `create_subscriber_file()` primero — y qué les pasa a las salidas de las dos funciones si un llamador hace ambas de todos modos?

## Paso 3: Registra aperturas y clics

Los proveedores de correo reportan aperturas y clics porque te dicen si valió la pena leer una línea de asunto. Este proyecto no envía correo real, así que registrarás el mismo flujo de eventos que produce un mailer real — suscriptor, número, tipo de evento, timestamp, URL — y luego lo leerás con pandas para computar tasas que significan algo.

### 3.1 Registra eventos en un CSV de seguimiento

**👟 Pista inicial :** Una función `log_event` agrega una sola fila a un archivo de seguimiento creciente — la misma forma que emitiría un servicio de correo real, solo que escrito por ti.

```python
# newsletter.py (continued)
TRACK_FIELDS = ["subscriber_email", "newsletter_issue", "event_type", "timestamp", "url"]

def log_event(email: str, issue: str, event_type: str, url: str = "", filepath: str = "tracking.csv"):
    """Log an email event (open, click, bounce)."""
    row = {
        "subscriber_email": email,
        "newsletter_issue": issue,
        "event_type": event_type,
        "timestamp": datetime.now().isoformat(),
        "url": url,
    }

    file_exists = os.path.exists(filepath)
    with open(filepath, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=TRACK_FIELDS)
        if not file_exists:
            writer.writeheader()
        writer.writerow(row)

def simulate_tracking(subscribers: list[dict], issue: str):
    """Simulate opens and clicks for demonstration purposes."""
    import random
    random.seed(42)

    for sub in subscribers:
        if random.random() < 0.7:  # 70% open rate
            log_event(sub["email"], issue, "open")
            if random.random() < 0.3:  # 30% of openers click the link
                log_event(sub["email"], issue, "click", "https://pyda.example/article")

simulate_tracking(subscribers, "Issue #42")
```

El rastreador es solo-agregar: cada evento es una fila, y las filas nunca se editan — esa es la forma de un log, y es lo que hace significativas las analíticas de 3.2 más adelante. `simulate_tracking` hace las veces de un mailer real, y las llamadas a `log_event` que hace son exactamente lo que produciría el webhook de un servicio de producción. `random.seed(42)` hace la simulación reproducible, así que los números que ves son los números que todo estudiante ve — lo que hace verificable el resultado esperado de abajo en lugar de vibraciones.

**🎯 Resultado esperado :** Un archivo `tracking.csv` creado con los cinco encabezados y varias filas de eventos: algunos suscriptores abrieron (y un par también hicieron clic) el Issue #42.

**🩹 Si sale mal :** Si `tracking.csv` nunca aparece, no se llamó a `simulate_tracking`, o el directorio de trabajo se recreó después del setup. Si los eventos no tienen timestamp, el import `datetime` del Paso 1 falta en el alcance de este bloque. Si el archivo acumula encabezados duplicados, la rama `file_exists` está registrando en un archivo existente pero escribiendo el encabezado de todos modos.

### 3.2 Calcula tasas de apertura y clics honestas

**👟 Pista inicial :** Carga el log de seguimiento con `pandas.read_csv`, agrupa por número, y divide por el *tamaño real de la audiencia* — pasa el conteo real de suscriptores, para que las tasas no se inflen contando solo a la gente que apareció.

```python
# newsletter.py (continued)
import pandas as pd

def generate_analytics(filepath: str = "tracking.csv", total_subscribers: int = 0) -> pd.DataFrame:
    """Compute per-issue open and click rates from the tracking log."""
    if not os.path.exists(filepath):
        print("No tracking data found.")
        return pd.DataFrame()

    df = pd.read_csv(filepath)

    print("\n  Newsletter Analytics")
    print("  " + "=" * 50)

    for issue in df["newsletter_issue"].unique():
        issue_data = df[df["newsletter_issue"] == issue]
        opens = len(issue_data[issue_data["event_type"] == "open"])
        clicks = len(issue_data[issue_data["event_type"] == "click"])
        total = total_subscribers or len(df["subscriber_email"].unique())
        open_rate = (opens / total * 100) if total > 0 else 0
        click_rate = (clicks / total * 100) if total > 0 else 0

        print(f"\n  Issue: {issue}")
        print(f"    Opens:       {opens}/{total} ({open_rate:.1f}%)")
        print(f"    Clicks:      {clicks}/{total} ({click_rate:.1f}%)")

    return df

simulate_tracking(subscribers, "Issue #42")
analytics = generate_analytics(total_subscribers=len(subscribers))
```

La línea que carga con todo el paso es `total = total_subscribers or len(...)`. El denominador de una tasa decide si es honesta: dividir las aperturas por **todos a quienes se les envió el número** da la tasa de apertura real; dividir por las 2 personas que casualmente abrieron la infla hacia ~100% y no enseña nada. Filtrar con pandas — `df["newsletter_issue"] == issue` y `df["event_type"] == "open"` — produce máscaras booleanas, y `len` del frame enmascarado cuenta las filas coincidentes, que es la manera idiomática de pandas de contar sin bucles. El respaldo `or` mantiene la función utilizable en un archivo sin tamaño de audiencia conocido.

**🎯 Resultado esperado :** Un bloque de analíticas para `Issue #42` — con 3 suscriptores, algo como `Opens: 2/3 (66.7%)` y `Clicks: 1/3 (33.3%)`, cada tasa siendo los eventos de este número divididos por 3.

**🩹 Si sale mal :** Si las tasas de apertura leen `100.0%`, `total_subscribers` no se está pasando (o el respaldo `or` se activó porque pasaste `0`). Si aparecen múltiples números cuando esperabas uno, ejecuciones anteriores dejaron eventos en `tracking.csv` — el log es solo-agregar a propósito; borra el archivo para una pizarra limpia. Si obtienes `FileNotFoundError`, `simulate_tracking` corrió en la ruta equivocada o nunca corrió — ejecuta el 3.1 primero.

### 3.3 Verifica el paso de seguimiento

**✅ Lista de verificación**

- ✅ `tracking.csv` contiene una fila por evento (sin encabezados duplicados, sin filas editadas a mano).
- ✅ `generate_analytics(total_subscribers=len(subscribers))` imprime tasas de apertura y clics por número.
- ✅ La tasa de apertura se computa contra la audiencia del envío, no solo contra los que abrieron.

**🤔 Pregunta(s) socrática(s)**

- El código prefiere deliberadamente `total_subscribers or len(df['subscriber_email'].unique())` en lugar de solo el conteo de correos únicos. ¿Cuándo *discreparían* esos dos números — y cuál de ellos produce una tasa de apertura engañosamente alta?
- Un log de seguimiento es solo-agregar: las filas nunca se actualizan ni se eliminan. ¿Qué tipo de respuesta se vuelve *imposible* de dar correctamente con un log solo-agregar si un suscriptor se da de baja y se vuelve a suscribir bajo el mismo correo?

## Paso 4: Prueba A/B de líneas de asunto

No puedes discutirle a alguien que abra tu correo, pero puedes medirlo. Una prueba A/B divide la audiencia en dos, envía la línea de asunto A a la mitad y la B a la otra, y deja que las tasas de apertura decidan. Este paso ejecuta ese experimento con la maquinaria de seguimiento que acabas de construir.

### 4.1 Divide la lista y simula la prueba

**👟 Pista inicial :** Baraja una copia de la lista de suscriptores, divídela en el punto medio en dos grupos, y luego registra aperturas para cada grupo bajo etiquetas de número *distintas* para que las analíticas puedan diferenciarlas.

```python
# newsletter.py (continued)
import random

def ab_test_subject_lines(
    subscribers: list[dict],
    subject_a: str,
    subject_b: str,
    issue: str = "A/B Test",
) -> dict:
    """Run an A/B test by splitting subscribers and measuring open rates."""
    shuffled = subscribers.copy()
    random.shuffle(shuffled)
    mid = len(shuffled) // 2
    group_a = shuffled[:mid]
    group_b = shuffled[mid:]

    print(f"\n  A/B Test: Subject Line Comparison")
    print(f"  Version A: {subject_a}")
    print(f"  Version B: {subject_b}")
    print(f"  Group A: {len(group_a)} subscribers")
    print(f"  Group B: {len(group_b)} subscribers")

    for sub in group_a:
        if random.random() < 0.45:  # 45% open rate for A
            log_event(sub["email"], f"{issue}-A", "open")

    for sub in group_b:
        if random.random() < 0.62:  # 62% open rate for B
            log_event(sub["email"], f"{issue}-B", "open")

    df = pd.read_csv("tracking.csv")
    opens_a = len(df[(df["newsletter_issue"] == f"{issue}-A") & (df["event_type"] == "open")])
    opens_b = len(df[(df["newsletter_issue"] == f"{issue}-B") & (df["event_type"] == "open")])

    rate_a = (opens_a / len(group_a) * 100) if group_a else 0
    rate_b = (opens_b / len(group_b) * 100) if group_b else 0

    results = {
        "subject_a": subject_a,
        "subject_b": subject_b,
        "open_rate_a": round(rate_a, 1),
        "open_rate_b": round(rate_b, 1),
        "winner": "B" if rate_b > rate_a else "A",
    }

    print(f"  Version A open rate: {rate_a:.1f}%")
    print(f"  Version B open rate: {rate_b:.1f}%")
    print(f"  Winner: Version {results['winner']}")
    return results

results = ab_test_subject_lines(
    subscribers,
    subject_a="This Week in Python",
    subject_b="5 Python Tricks You Missed Last Week",
)
```

La decisión crucial es etiquetar los eventos de cada grupo con una etiqueta de número *diferente* (`A/B Test-A` vs `A/B Test-B`) en lugar de que ambos escriban filas `open` que no puedas diferenciar después. El lobo de este paso es el `&` en `df[(df["newsletter_issue"] == f"{issue}-A") & (df["event_type"] == "open")]`: pandas requiere el `&` elemento a elemento (no el `and` de Python) porque cada comparación produce un arreglo de booleanos, y `and` no puede evaluar arreglos. El `shuffled = subscribers.copy()` evita que la baraja reordene la lista de la que otras funciones todavía dependen.

**🎯 Resultado esperado :** Un banner de prueba, tamaños de grupo que suman a la audiencia, dos tasas de apertura (la B cerca de 62%, la A cerca de 45%), un `winner: "B"`, y un dict `results` con ambas tasas redondeadas.

**🩹 Si sale mal :** Si obtienes `ValueError: The truth value of a DataFrame is ambiguous`, un `and` desnudo se coló en la expresión de máscara — ambos filtros deben unirse con `&` y cada uno estar entre paréntesis. Si ambos grupos tienen el mismo tamaño que la lista completa, la lista no se dividió (`[:mid]`/`[mid:]`) de la copia barajada. Si las tasas son exactamente 0, los eventos se registraron bajo etiquetas que no coinciden con las etiquetas de relectura — compara `f"{issue}-A"` en ambos lugares carácter por carácter.

### 4.2 Razona sobre el resultado

**👟 Pista inicial :** Antes de volver a ejecutar, pregúntate qué se les *permite decir* a los números dado lo pequeño que es la muestra — el ganador solo es tan confiable como el denominador.

**🎯 Resultado esperado :** Un dict `results` con `winner` coincidiendo con cualquiera que sea la tasa más alta, y una explicación de una oración sobre si apostarías tu próximo envío en ese ganador.

**🩹 Si sale mal :** Si una segunda ejecución voltea al ganador, eso no es un bug — es el comportamiento honesto de una muestra pequeña sin semilla. Si eso te sorprende, este es el punto: con grupos de tres personas, 45% vs 62% es ruido, y el arreglo (audiencias más grandes, o ejecuciones repetidas) es parte del aprendizaje, no un problema de código.

### 4.3 Verifica la prueba A/B

**✅ Lista de verificación**

- ✅ Los tamaños del grupo A y del grupo B suman el conteo total de suscriptores.
- ✅ Los eventos de las dos versiones son distinguibles en `tracking.csv` por sus etiquetas de número.
- ✅ El dict `results` computado contiene ambas tasas y un ganador, y `tracking.csv` no se escribió dos veces con encabezados duplicados.

**🤔 Pregunta(s) socrática(s)**

- `random.shuffle` opera sobre la lista en su lugar, que es por qué 4.1 la copia primero. ¿Qué protegería en realidad `subscribers.copy()`, dado que la lista contiene *diccionarios* — copia también los dicts? (Pista: prueba mutar un suscriptor después de la copia.)
- El ganador es `"B" if rate_b > rate_a else "A"` — observa que A gana los empates. Con esta audiencia de tres, ¿confiarías en ese desempate? ¿Qué necesitaría un experimento real (un p-value, un `n` más grande, un intervalo de confianza) antes de que cambiaras tu línea de asunto por defecto por él?

## Paso 5: Envía un número a un segmento

Ahora la canalización cierra su bucle: elige un segmento (digamos, lectores de Python activos), renderiza la plantilla una vez *por suscriptor* con su propio nombre, y escribe cada número personalizado en su propio archivo. Todo de los Pasos 1 y 2 se une en una sola función reutilizable.

### 5.1 Renderiza y escribe números personalizados

**👟 Pista inicial :** Compón tus filtros existentes en un solo segmento, luego renderiza la plantilla repetidamente con variables por persona vía una fusión de dicts — y deja que la dirección de correo genere nombres de archivo seguros.

```python
# newsletter.py (continued)
from pathlib import Path

def render_issue_to_files(subscribers: list[dict], template: str, variables: dict, out_dir: str = "issues") -> list[str]:
    """Render one personalized issue per subscriber and write it to disk."""
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    paths = []
    for sub in subscribers:
vars_for_sub = {**variables, "subscriber_name": sub.get("name", ""), "email": sub["email"]}
        rendered = render_template(template, vars_for_sub)
        safe_name = sub["email"].split("@")[0]
        path = out / f"{safe_name}.md"
        path.write_text(rendered)
        paths.append(str(path))
    return paths

targets = filter_by_status(filter_by_tag(load_subscribers(), "python"), "active")
written = render_issue_to_files(targets, NEWSLETTER_TEMPLATE, variables)
print(f"Rendered {len(written)} personalized issues into issues/")
print(open(written[0]).read())
```

La línea `vars_for_sub = {**variables, "subscriber_name": sub["name"], "email": sub["email"]}` es fusión de dicts: copia las variables compartidas y luego *sobrescribe* las llaves por persona, así que la misma base para todos se vuelve personal para cada persona — el `Hello {{subscriber_name}}!` de la plantilla saluda al lector real. Componer filtros (`filter_by_status(filter_by_tag(...))`) es el pago de las funciones nombradas y componibles de 2.2: segmentar es solo anidarlas. El nombre de archivo viene de `sub["email"].split("@")[0]`, que convierte un correo en un tallo seguro para el sistema de archivos, y `Path.write_text` convierte el I/O de archivos en una sola línea.

**🎯 Resultado esperado :** `Rendered 2 personalized issues into issues/` y el primer archivo imprime como un número completo saludando `Hello Alice!` — con el mismo cuerpo que cada otro número pero esa única línea personalizada.

**🩹 Si sale mal :** Si cada archivo dice `Hello Reader!`, la sobrescritura por persona está perdiendo contra `variables` — revisa el orden de fusión en `vars_for_sub` (las sobrescrituras van *después* del dict compartido). Si un suscriptor tiene un `name` vacío, el saludo lee `Hello !` — `sub.get("name", "")` devuelve una cadena vacía para una celda CSV en blanco, y `[MISSING: subscriber_name]` solo aparece para una llave genuinamente ausente. Si `written[0]` tiene la audiencia equivocada, los filtros segmentados compuestos están jalando la etiqueta equivocada.

### 5.2 Verifica el envío personalizado

**✅ Lista de verificación**

- ✅ Solo los suscriptores que coinciden con el segmento (p. ej. activos + etiqueta `python`) obtienen archivos en `issues/`.
- ✅ Cada archivo saluda a su propio suscriptor por nombre y comparte el mismo cuerpo de número.
- ✅ `issues/` no contiene archivos sueltos de ejecuciones anteriores que el bucle no tocó.

**🤔 Pregunta(s) socrática(s)**

- La fusión por persona vive *dentro* del bucle, pero el dict `variables` compartido está fuera de él. ¿Qué cambiaría en la fecha renderizada si la llamada a `datetime.now()` corriera una vez dentro del bucle para cada suscriptor en su lugar — y por qué es "computado una vez, no por identidad" generalmente la decisión correcta?
- La fusión es `{**variables, "subscriber_name": <name>, "email": <email>}` — el orden importa. Si `variables` *en sí mismo* ya contuviera una llave `subscriber_name`, ¿la sobrescribe la fusión, y cómo mantendrías *intencionalmente* el valor por defecto de la plantilla para suscriptores a los que les falta un nombre?

## ⚠️ Errores comunes

- **El regex codicioso se traga varios marcadores de posición.** `\{\{(.+?)\}\}` necesita el `?` no codicioso — con `.+` plano una línea de dos marcadores colapsa en una coincidencia falsa. Arreglo: mantén `+?`, y prueba con dos marcadores de posición en una línea como hace 1.1.
- **Coincidencia de etiquetas sin dividir.** Si pruebas `tag in s["tags"]` sin `split(";")`, "python" coincide por subcadena con "python3🐍" y los falsos positivos se filtran en los segmentos. Arreglo: siempre desempaca el campo empaquetado con `.split(";")` antes de la pertenencia.
- **Encabezados duplicados en los archivos de log.** Agregar con `"a"` y escribir un encabezado cada vez corrompe `tracking.csv` y `subscribers.csv`. Arreglo: condiciona `writeheader()` detrás del chequeo `os.path.exists` exactamente como está escrito en 2.1/3.1.
- **`and` en lugar de `&` en los filtros de pandas.** `df["event_type"] == "open" and ...` lanza `ValueError: The truth value of a DataFrame is ambiguous`. Arreglo: pon entre paréntesis cada comparación y únelas con `&`.
- **Tasas computadas contra el denominador equivocado.** Dividir las aperturas por *los abridores* (correos únicos en el log) infla las tasas de apertura hacia 100%. Arreglo: pasa el conteo real de la audiencia (`total_subscribers=len(subscribers)`), como hace 3.2.

## Lo que acabas de construir

Una canalización completa de newsletters, de extremo a extremo: un motor de plantillas regex que completa números Markdown, un gestor de suscriptores CSV con segmentación por etiquetas, un paso de analíticas honestas de aperturas/clics, una prueba A/B de línea de asunto, y una pasada final que escribe un número personalizado por lector. La habilidad transferible es *la canalización de contenido*: plantilla + datos + segmento + medida son los mismos cuatro bloques detrás de las integraciones reales de ESP (Mailchimp, SendGrid), la automatización de marketing, y cada script de "envía un informe a las personas correctas semanalmente" que escribirás en un empleo.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/newsletter-builder/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/newsletter-builder) en el repo del curso trae la canalización completa con un manejador de baja y una clase de segmento nombrada. Clónalo, o abre el repo completo en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde allí.
:::

## A dónde ir desde aquí

- Agrega el **manejo de bajas**: escanea `tracking.csv` en busca de eventos `"unsubscribe"` y voltea el estado de ese suscriptor a `unsubscribed` en `subscribers.csv` — ya tienes `filter_by_status` esperando exactamente ese valor.
- Construye un **archivo de números**: cambia `render_issue_to_files` para escribir cada número bajo un nombre de archivo con fecha (`newsletter-2026-09-06.md`) y emite un `index.md` listando cada número pasado — `datetime.now().strftime("%Y-%m-%d")` es todo el truco.
- Haz un **catálogo de segmentos nombrados**: almacena reglas de segmento como `tag=python AND status=active` como pequeños archivos JSON y evalúalas con los dos filtros — el patrón de "reglas como datos" que convierte scripts one-off en un sistema.
- Dibuja un **gráfico de crecimiento**: lee `subscribers.csv` y grafica los conteos de `subscribed_at` a lo largo del tiempo con matplotlib — un paso `value_counts` más `plot()` que convierte la lista de suscriptores en una línea de tendencia.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estés orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene una guía completa, amigable para principiantes, para añadir el tuyo vía un **pull request**, incluso si nunca usaste git antes: hacer fork del repo, crear una rama, commitear tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python que construye su propia audiencia. 🎓