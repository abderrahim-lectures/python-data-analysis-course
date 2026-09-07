---
title: "Cuaderno de Laboratorio Digital"
description: "Registra experimentos con datos estructurados, cálculos y pipelines de análisis reproducibles."
---

# 📓 Construye un Cuaderno de Laboratorio Digital

Los científicos registran experimentos, hipótesis y resultados con versiones. Un cuaderno de laboratorio digital hace lo mismo pero de forma estructural: cada experimento obtiene una plantilla, las mediciones alimentan los cálculos y los resultados se exportan como informes reproducibles. Este proyecto construye exactamente eso.

Esto asume Python 101 y comodidad con pandas de Análisis de Datos. Es opcional y no calificado; consulta [Proyectos del mundo real](/docs/projects) para la lista completa.

## 🎯 Lo que harás

1. Configurar un proyecto con `uv` e instalar las dependencias del cuaderno y de la exportación.
2. Definir plantillas de experimento estructuradas con campos tipados.
3. Añadir un motor de cálculo integrado para ejecutar análisis sobre las mediciones.
4. Implementar un historial de versiones que rastree cada cambio.
5. Exportar los experimentos a un informe PDF listo para publicación.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal — es una herramienta CLI que escribe archivos de experimentos y PDFs.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/lab-notebook/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/lab-notebook/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Flab-notebook%2Fnotebook.ipynb)

## Configuración

Todo lo que necesitas antes de construir: un entorno de Python, pandas y ReportLab.

### Instala `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Cierra y vuelve a abrir tu terminal, luego confirma:

```bash
uv --version
```

### Configura el proyecto

```bash
uv init lab-notebook
cd lab-notebook
uv add pandas reportlab click
```

`pandas` impulsa el motor de cálculo. `reportlab` genera las exportaciones PDF. `click` construye el CLI.

### Crea la estructura del proyecto

```bash
mkdir -p notebook
touch notebook/__init__.py notebook/model.py notebook/calculations.py notebook/store.py notebook/export.py notebook/cli.py
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `lab-notebook/` existe con un `pyproject.toml` y todas las dependencias instaladas.
- ✅ El directorio `notebook/` tiene todos los archivos de módulo requeridos.

## Paso 1: Define las plantillas de experimento estructuradas

Un experimento tiene una hipótesis, condiciones, mediciones y un resultado. Codificarlos como una dataclass tipada le da a cada experimento una forma consistente.

### 1.1 Crea el modelo de experimento

**👟 Pista inicial :** Crea `notebook/model.py`.

```python
# notebook/model.py
from dataclasses import dataclass, field
from datetime import datetime

@dataclass
class Measurement:
    label: str
    value: float
    unit: str = ""

@dataclass
class Experiment:
    title: str
    hypothesis: str
    measurements: list[Measurement] = field(default_factory=list)
    created: str = field(default_factory=lambda: datetime.now().isoformat())
    versions: list[dict] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "title": self.title,
            "hypothesis": self.hypothesis,
            "measurements": [m.__dict__ for m in self.measurements],
            "created": self.created,
            "versions": self.versions,
        }
```

**🎯 Resultado esperado :** `Experiment("Grow rate", "Light increases growth")` crea un experimento estructurado y serializable.

**🩹 Si sale mal :** Si `to_dict` falla, revisa el orden de los campos de la dataclass.

### 1.2 Verifica el modelo

**✅ Lista de verificación**

- ✅ `Experiment` acepta título, hipótesis y mediciones opcionales.
- ✅ `to_dict()` devuelve un dict serializable simple.
- ✅ `created` por defecto usa la marca de tiempo actual.

**🤔 Pregunta(s) socrática(s)**

- ¿Cómo añadirías validación para que las mediciones no puedan ser negativas cuando eso rompe el significado físico del experimento?

## Paso 2: Construye el motor de cálculo

El motor ejecuta el análisis sobre las mediciones: media, desviación estándar y una fórmula de línea de tendencia.

### 2.1 Crea los cálculos

**👟 Pista inicial :** Crea `notebook/calculations.py`.

```python
# notebook/calculations.py
import statistics
from notebook.model import Experiment


def analyze(exp: Experiment) -> dict:
    values = [m.value for m in exp.measurements]
    if not values:
        return {"error": "no measurements"}
    result = {
        "count": len(values),
        "min": min(values),
        "max": max(values),
        "mean": statistics.mean(values),
        "stdev": statistics.stdev(values) if len(values) > 1 else 0.0,
    }
    result["cv"] = result["stdev"] / result["mean"] if result["mean"] else 0
    return result


def trend_formula(values: list[float]) -> str:
    """Least-squares slope/intercept as a readable y = mx + b string."""
    n = len(values)
    if n < 2:
        return "y = N/A (need >= 2 points)"
    xs = list(range(n))
    x_mean = sum(xs) / n
    y_mean = sum(values) / n
    slope = sum((x - x_mean) * (y - y_mean) for x, y in zip(xs, values)) / \
            sum((x - x_mean) ** 2 for x in xs)
    intercept = y_mean - slope * x_mean
    return f"y = {slope:.3f}x + {intercept:.3f}"
```

**🎯 Resultado esperado :** `analyze(exp)` devuelve recuento, mínimo, máximo, media y desviación estándar; `trend_formula` devuelve una ecuación legible.

**🩹 Si sale mal :** Si `stdev` falla con un solo punto, la guarda `len(values) > 1` lo maneja.

### 2.2 Verifica los cálculos

**✅ Lista de verificación**

- ✅ `analyze` devuelve las estadísticas de un experimento poblado.
- ✅ Los experimentos vacíos devuelven un dict de error amigable.
- ✅ `trend_formula` produce una cadena `y = mx + b` para ≥2 puntos.

**🤔 Pregunta(s) socrática(s)**

- ¿Qué estadística adicional esperaría un científico de laboratorio más allá de la media y la desviación estándar?

## Paso 3: Rastrea las versiones

Cada vez que un experimento cambia, haz una instantánea. Eso hace que cada estado anterior sea recuperable.

### 3.1 Añade el versionado

**👟 Pista inicial :** Crea `notebook/store.py`.

```python
# notebook/store.py
import json, copy
from datetime import datetime
from notebook.model import Experiment


class NotebookStore:
    def __init__(self, path="notebook.json"):
        self.path = path
        self.experiments: dict[str, Experiment] = {}

    def add(self, exp: Experiment):
        exp.versions.append({"snapshot": exp.to_dict(), "time": datetime.now().isoformat()})
        self.experiments[exp.title] = exp

    def update(self, exp: Experiment, **changes):
        exp.versions.append({"snapshot": exp.to_dict(), "time": datetime.now().isoformat()})
        for key, value in changes.items():
            setattr(exp, key, value)

    def history(self, title) -> list[dict]:
        exp = self.experiments.get(title)
        return exp.versions if exp else []

    def rollback(self, title, version_index):
        exp = self.experiments[title]
        version = exp.versions[version_index]["snapshot"]
        exp.versions.append({"snapshot": exp.to_dict(), "time": datetime.now().isoformat()})
        exp.measurements = [type(exp.measurements[0])(**m) for m in version["measurements"]]
        exp.hypothesis = version["hypothesis"]

    def save(self):
        with open(self.path, "w") as f:
            json.dump({k: v.to_dict() for k, v in self.experiments.items()}, f, indent=2)
```

**🎯 Resultado esperado :** `store.update(exp, hypothesis="New idea")` registra el estado anterior, y `rollback` lo restaura.

**🩹 Si sale mal :** Si `rollback` se bloquea, las mediciones de la instantánea pueden no reconstruirse limpiamente — revisa las llaves del dict.

### 3.2 Verifica el versionado

**✅ Lista de verificación**

- ✅ Cada `add`/`update` añade una instantánea de versión.
- ✅ `history` devuelve el rastro de versiones.
- ✅ `rollback` restaura un estado anterior y registra la transición.

**🤔 Pregunta(s) socrática(s)**

- El versionado actual guarda instantáneas completas. ¿Cuándo sería mejor un enfoque basado en diferencias, y por qué esa complejidad extra?

## Paso 4: Exporta a PDF

Un cuaderno de laboratorio solo es útil si otros pueden leerlo. Genera un informe limpio a partir de los datos del experimento.

### 4.1 Crea el exportador de PDF

**👟 Pista inicial :** Crea `notebook/export.py`.

```python
# notebook/export.py
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table
from notebook.calculations import analyze
from notebook.model import Experiment


def export_pdf(exp: Experiment, out_path: str):
    styles = getSampleStyleSheet()
    doc = SimpleDocTemplate(out_path, pagesize=A4)
    story = [
        Paragraph(exp.title, styles["Title"]),
        Spacer(1, 12),
        Paragraph(f"<b>Hypothesis:</b> {exp.hypothesis}", styles["Normal"]),
        Spacer(1, 12),
    ]
    stats = analyze(exp)
    if "error" not in stats:
        story.append(Paragraph(f"Mean: {stats['mean']:.3f}  |  Stdev: {stats['stdev']:.3f}", styles["Normal"]))
    rows = [["Label", "Value", "Unit"]]
    rows += [[m.label, str(m.value), m.unit] for m in exp.measurements]
    story.append(Table(rows))
    doc.build(story)
```

**🎯 Resultado esperado :** `export_pdf(exp, "report.pdf")` escribe un PDF con título, hipótesis, estadísticas y una tabla de mediciones.

**🩹 Si sale mal :** Si la tabla está malformada, revisa los anchos de las filas y que cada fila tenga el número correcto de columnas.

### 4.2 Verifica la exportación

**✅ Lista de verificación**

- ✅ Se escribe un archivo PDF en `out_path`.
- ✅ El título, la hipótesis y las estadísticas aparecen en él.
- ✅ Las mediciones se renderizan como una tabla.

**🤔 Pregunta(s) socrática(s)**

- ¿Qué añadirías a un informe "listo para publicación": una sección de métodos? ¿Una figura? ¿Una declaración de reproducibilidad?

## ⚠️ Errores comunes

- **Mediciones mutables por defecto.** Una `list` como valor por defecto de una dataclass se comparte entre instancias. Usa `field(default_factory=list)` como se muestra.
- **Olvidar la instantánea antes de la mutación.** `update` trunca o pierde datos a menos que registres el estado antiguo primero. Haz siempre la instantánea antes de cambiar.
- **División por cero en el CV.** Cuando la media es 0, `cv` divide entre cero. La guarda `if result["mean"] else 0` lo maneja.
- **Errores de salto de línea de ReportLab.** Las cadenas largas sin espacios bloquean `Paragraph`. Envuelve el texto o permite el ajuste de palabras en los estilos de celda.
- **Datos estadísticamente vacíos.** `analyze` devuelve `"error"` para cero mediciones; revísalo antes de asumir que las estadísticas existen.

## Lo que acabas de construir

Un cuaderno de laboratorio estructurado: plantillas de experimento tipadas, un motor de estadísticas que calcula media, desviación estándar y líneas de tendencia, versionado basado en instantáneas con reversión y un exportador de PDF. El resultado es un flujo de trabajo de análisis reproducible — registrar, calcular, versionar y compartir — que refleja cómo trabajan realmente los equipos de investigación modernos.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/lab-notebook/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/lab-notebook) en el repositorio del curso tiene una versión más rica con generación de gráficos, un índice de registros buscable y el CLI conectado de principio a fin. Clónalo, o abre el repositorio completo en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde allí.
:::

## A dónde ir desde aquí

- Añade gráficos de matplotlib a la exportación PDF para que los resultados sean visuales, no solo tabulares.
- Implementa búsqueda de texto completo en todos los experimentos con un índice invertido simple.
- Persiste el cuaderno en SQLite en lugar de un archivo JSON plano para escrituras concurrentes más seguras.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientas orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene una guía completa y apta para principiantes sobre cómo añadir el tuyo mediante una **pull request**, incluso si nunca has usado git: hacer un fork del repositorio, crear una rama, hacer commit de tus archivos y abrir la PR, paso a paso. No se asume ninguna experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓