---
title: "Motor de Cuestionarios"
description: "Construye una plataforma de cuestionarios con bancos de preguntas, pruebas cronometradas, puntuación y análisis de rendimiento."
difficulty: "beginner"
estimatedMinutes: 50
tags: ["classes", "random", "pandas", "matplotlib"]
xpReward: 50
learningObjectives:
  - "Modela preguntas con clases que soportan múltiples tipos de pregunta"
  - "Implementa sesiones de cuestionario cronometradas con lógica de cuenta regresiva"
  - "Construye un motor de puntuación con calificación ponderada y crédito parcial"
  - "Analiza el rendimiento con pandas y visualiza los resultados"
  - "Persiste el historial de cuestionarios en JSON entre sesiones"
  - "Construye un menú CLI para sesiones de cuestionario interactivas"
prerequisites: ["Conceptos básicos de Python (clases, diccionarios, listas)", "Pandas y matplotlib básicos"]
---

# Motor de Cuestionarios

Construye una plataforma de cuestionarios con preguntas aleatorizadas, sesiones cronometradas, puntuación automática e informes de rendimiento detallados.

## 🎯 Lo que harás

1. Modelar tres tipos de pregunta — opción múltiple, verdadero/falso y completar espacios — usando clases abstractas y dataclasses.
2. Construir un motor de cuestionarios que gestiona un banco de preguntas, selecciona preguntas aleatorias y ejecuta sesiones cronometradas.
3. Puntuar respuestas automáticamente con desgloses por categoría y porcentajes de precisión.
4. Visualizar el rendimiento con gráficos de barras y gráficos circulares usando matplotlib.
5. Persistir el historial de cuestionarios en un archivo JSON para que los resultados sobrevivan entre sesiones.
6. Construir un menú CLI para crear cuestionarios, ver historial y revisar resultados pasados.
7. Pulir la salida con retroalimentación codificada por colores e informes de puntuación formateados.

## Dónde ejecutar esto

- **Localmente con `uv` (recomendado).** Este proyecto necesita pandas y matplotlib — un buen candidato para ejecutarlo en tu propia máquina. La sección de Configuración de abajo lo recorre.
- **Google Colab o Kaggle Notebooks.** Pega las celdas de código directamente en un notebook. Los gráficos se renderizan en línea, y `input()` funciona para las indicaciones del cuestionario.
- **Parque de juegos JupyterLite.** Pega las celdas de código directamente en un notebook — ten en cuenta que la E/S de archivos (Paso 5) funciona de manera diferente en el navegador; la persistencia JSON solo funcionará localmente.

- **Ejecútalo en el navegador.** Hay un cuaderno interactivo listo — ábrelo en Colab, Kaggle o Binder y sigue los pasos en orden.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/quiz-engine/notebook.es.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/quiz-engine/notebook.es.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fquiz-engine%2Fnotebook.es.ipynb)

## Configuración

```bash
uv init quiz-engine
cd quiz-engine
uv add pandas matplotlib
```

## Paso 1 — Define los tipos de pregunta

La base de cualquier motor de cuestionario: cada pregunta conoce su texto, categoría, valor en puntos, cómo mostrarse a sí misma y cómo comprobar una respuesta. Usaremos una clase base abstracta para que cada tipo de pregunta siga la misma interfaz, y luego construiremos tres tipos concretos encima.

### 1.1 Escribe la clase base abstracta

**👟 Pista inicial:** Usa `dataclasses` para valores por defecto limpios en atributos y `abc.ABC` para imponer la interfaz. Cada pregunta almacena `text`, `category` y `points`, y debe implementar `check(answer) -> (bool, int)` y `display()`.

```python
from dataclasses import dataclass, field
from abc import ABC, abstractmethod

@dataclass
class Question(ABC):
    text: str
    category: str
    points: int = 10

    @abstractmethod
    def check(self, answer: str) -> tuple[bool, int]:
        """Return (is_correct, points_awarded)."""
        ...

    @abstractmethod
    def display(self) -> None:
        """Print the question to the terminal."""
        ...
```

**🎯 Resultado esperado:** Definir esta clase no debería producir salida visible — es un plano. Puedes verificar que funciona definiendo una subclase concreta mínima e instanciándola (siguiente sub-paso).

**🩹 Si sale mal:** Si obtienes `TypeError: Can't instantiate abstract class`, olvidaste implementar `check` o `display` en tu subclase concreta. Si ves `TypeError: __init__() missing required arguments`, vuelve a comprobar que los campos de tu dataclass tienen valores por defecto donde se necesitan.

### 1.2 Implementa MultipleChoice

**👟 Pista inicial:** Almacena una lista de `options` y el `correct_index` (basado en 1 para mostrar, pero basado en 0 internamente). El método `check` convierte la entrada numérica del usuario en un índice.

```python
@dataclass
class MultipleChoice(Question):
    options: list[str] = field(default_factory=list)
    correct_index: int = 0

    def display(self) -> None:
        print(f"\n  {self.text} [{self.points} pts]")
        for i, opt in enumerate(self.options, 1):
            print(f"    {i}. {opt}")

    def check(self, answer: str) -> tuple[bool, int]:
        try:
            is_correct = int(answer) == self.correct_index + 1
        except ValueError:
            is_correct = False
        return is_correct, self.points if is_correct else 0
```

**🎯 Resultado esperado:** Ejecutar esto:

```python
mc = MultipleChoice("What is 2 + 2?", category="math",
                     options=["3", "4", "5", "6"], correct_index=1)
mc.display()
correct, pts = mc.check("2")
print(f"Correct: {correct}, Points: {pts}")
```

Debe imprimir:

```
  What is 2 + 2? [10 pts]
    1. 3
    2. 4
    3. 5
    4. 6
Correct: True, Points: 10
```

**🩹 Si sale mal:** Si `check("4")` devuelve `False`, estás comparando el string crudo — asegúrate de hacer `int(answer)` antes de comparar con `correct_index + 1` (el +1 da cuenta de la numeración de visualización basada en 1).

### 1.3 Implementa TrueFalse y FillInBlank

**👟 Pista inicial:** TrueFalse almacena un `correct_answer` booleano y comprueba si el usuario tecleó "true"/"t" o "false"/"f". FillInBlank almacena una lista de `accepted_answers` y normaliza tanto la entrada del usuario como cada respuesta aceptada a minúsculas para la comparación.

```python
@dataclass
class TrueFalse(Question):
    correct_answer: bool = True

    def display(self) -> None:
        print(f"\n  {self.text} [{self.points} pts] (True / False)")

    def check(self, answer: str) -> tuple[bool, int]:
        normalised = answer.strip().lower()
        user_says_true = normalised in ("true", "t")
        user_says_false = normalised in ("false", "f")
        is_correct = (user_says_true == self.correct_answer)
        return is_correct, self.points if is_correct else 0


@dataclass
class FillInBlank(Question):
    accepted_answers: list[str] = field(default_factory=list)

    def display(self) -> None:
        print(f"\n  {self.text} [{self.points} pts]")

    def check(self, answer: str) -> tuple[bool, int]:
        normalised = answer.strip().lower()
        is_correct = any(normalised == a.lower() for a in self.accepted_answers)
        return is_correct, self.points if is_correct else 0
```

**🎯 Resultado esperado:** Ejecutar esto:

```python
tf = TrueFalse("Python is statically typed.", category="python", correct_answer=False)
fib = FillInBlank("The keyword to define a function is ___", category="python",
                   accepted_answers=["def"])

for q in [tf, fib]:
    q.display()
    correct, pts = q.check("false" if isinstance(q, TrueFalse) else "def")
    print(f"  Correct: {correct}, Points: {pts}")
```

Debe imprimir:

```
  Python is statically typed. [10 pts] (True / False)
  Correct: True, Points: 10

  The keyword to define a function is ___ [10 pts]
  Correct: True, Points: 10
```

**🩹 Si sale mal:** Si `TrueFalse` acepta entrada "yes"/"no", olvidaste restringir al conjunto `("true", "t", "false", "f")` — "yes" eludiría tu comprobación y se marcaría silenciosamente como incorrecto. Si `FillInBlank` distingue mayúsculas, asegúrate de llamar `.lower()` en ambos lados de la comparación.

### 1.4 Verifica los tres tipos

**✅ Lista de verificación**

- ✅ `MultipleChoice` muestra opciones numeradas y acepta un string numérico como entrada.
- ✅ `TrueFalse` acepta "true"/"t"/"false"/"f" (insensible a mayúsculas) y rechaza otra entrada.
- ✅ `FillInBlank` acepta cualquiera de la lista `accepted_answers`, insensible a mayúsculas.
- ✅ Los tres devuelven `(bool, int)` desde `check()` — `True` con puntos completos para correcto, `False` con 0 para incorrecto.
- ✅ Cada uno muestra el texto de la pregunta y el valor en puntos antes de pedir una respuesta.

**🤔 Pregunta(s) socrática(s)**

¿Por qué `MultipleChoice` almacena `correct_index` como basado en 0 pero suma 1 al comparar la entrada del usuario? ¿Qué se rompería si le pidieras al usuario "0, 1, 2 o 3" en lugar de "1, 2, 3 o 4"?

## Paso 2 — Construye el motor del cuestionario

Ahora que las preguntas saben comprobarse a sí mismas, necesitamos algo que las recoja, elija un subconjunto aleatorio y ejecute una sesión cronometrada. La clase `QuizEngine` une todo.

### 2.1 Crea el motor y puebla un banco de preguntas

**👟 Pista inicial:** El motor empieza con una lista vacía. `add_question` hace append a ella. `build_quiz` filtra por categoría (si se da) y luego usa `random.sample` para elegir sin reemplazo.

```python
import random

class QuizEngine:
    def __init__(self):
        self.questions: list[Question] = []

    def add_question(self, question: Question) -> None:
        self.questions.append(question)

    def build_quiz(self, num_questions: int = 5,
                   categories: list[str] | None = None) -> list[Question]:
        pool = self.questions if not categories else [
            q for q in self.questions if q.category in categories
        ]
        if len(pool) < num_questions:
            raise ValueError(
                f"Only {len(pool)} questions available in pool, need {num_questions}"
            )
        return random.sample(pool, num_questions)
```

**🎯 Resultado esperado:** Poblar el motor y construir un cuestionario debería devolver un subconjunto aleatorio:

```python
engine = QuizEngine()
engine.add_question(MultipleChoice("What is 2 + 2?", "math", options=["3", "4", "5", "6"], correct_index=1))
engine.add_question(TrueFalse("Python is statically typed.", "python", correct_answer=False))
engine.add_question(FillInBlank("The keyword to define a function is ___", "python", accepted_answers=["def"]))
engine.add_question(MultipleChoice("Capital of France?", "geography", options=["London", "Paris", "Berlin"], correct_index=1))

quiz = engine.build_quiz(num_questions=2)
print(f"Quiz has {len(quiz)} questions")
for q in quiz:
    q.display()
```

**🩹 Si sale mal:** Si obtienes `ValueError: Only N questions available in pool, need M`, estás pidiendo más preguntas de las que existen en el grupo filtrado — o añade más preguntas o reduce `num_questions`. Si la misma pregunta aparece dos veces, estás usando `random.choices` (con reemplazo) en lugar de `random.sample` (sin reemplazo).

### 2.2 Ejecuta una sesión de cuestionario cronometrada

**👟 Pista inicial:** Rastrea un tiempo de inicio con `time.time()`. Antes de cada pregunta, calcula el tiempo restante. Si llega a cero, termina temprano. Recoge los resultados como una lista de dicts con texto de pregunta, categoría, corrección y puntos.

```python
import time

def run_quiz(engine: QuizEngine, questions: list[Question],
             time_limit: int = 300) -> list[dict]:
    print(f"\n{'='*50}")
    print(f"  QUIZ — {len(questions)} questions | {time_limit}s time limit")
    print(f"{'='*50}")
    results = []
    start = time.time()

    for i, q in enumerate(questions, 1):
        remaining = time_limit - (time.time() - start)
        if remaining <= 0:
            print("\n  TIME'S UP!")
            break
        print(f"\n  Question {i}/{len(questions)} (time left: {remaining:.0f}s)")
        q.display()
        answer = input("  Your answer: ").strip()
        is_correct, pts = q.check(answer)
        results.append({
            "question": q.text,
            "category": q.category,
            "correct": is_correct,
            "points": pts,
            "max_points": q.points,
        })
        print(f"  {'Correct!' if is_correct else 'Wrong.'} (+{pts} pts)")

    elapsed = time.time() - start
    print(f"\n  Quiz finished in {elapsed:.1f}s")
    return results
```

**🎯 Resultado esperado:** Ejecutar un cuestionario imprime cada pregunta, acepta entrada e imprime correcto/incorrecto después de cada respuesta. Cuando el temporizador expira, imprime `TIME'S UP!` y se detiene. La lista devuelta de dicts tiene una entrada por pregunta respondida.

**🩹 Si sale mal:** Si el temporizador no detiene el cuestionario, comprueba que `remaining <= 0` usa `time.time() - start` (transcurrido), no `start - time.time()`. Si el cuestionario siempre se detiene en la primera pregunta, tu cálculo de `remaining` está mal — asegúrate de que estás calculando `time_limit - (time.time() - start)`, no solo `time.time() - start`.

### 2.3 Verifica el motor

**✅ Lista de verificación**

- ✅ `build_quiz(3)` devuelve exactamente 3 preguntas aleatorias del banco.
- ✅ `build_quiz(3, categories=["python"])` solo incluye preguntas de la categoría especificada.
- ✅ `run_quiz` imprime un temporizador de cuenta regresiva y se detiene temprano cuando el tiempo se acaba.
- ✅ Cada respuesta se registra con texto de pregunta, categoría, corrección y puntos.
- ✅ Pedir más preguntas de las disponibles lanza un `ValueError` claro.

**🤔 Pregunta(s) socrática(s)**

Si llamaras `build_quiz(5)` en un motor con solo 3 preguntas, ¿qué debería pasar? ¿Es lanzar un error la elección correcta, o preferirías devolver silenciosamente las 3? ¿Qué compromisos tiene cada enfoque?

## Paso 3 — Puntúa y analiza los resultados

Los resultados crudos son solo una lista de dicts. Para convertirlos en algo útil, necesitamos agregar puntuaciones, calcular desgloses por categoría e identificar áreas débiles. Aquí es también donde pandas empieza a ganar su sustento.

### 3.1 Construye un resumen sin pandas

**👟 Pista inicial:** Recorre los resultados una vez, totalizando puntos, puntos máximos y estadísticas por categoría. Devuelve un dict de resumen con precisión general y desgloses por categoría.

```python
def analyse_results(results: list[dict]) -> dict:
    total_points = sum(r["points"] for r in results)
    max_points = sum(r["max_points"] for r in results)
    accuracy = total_points / max_points * 100 if max_points else 0

    categories = {}
    for r in results:
        cat = r["category"]
        if cat not in categories:
            categories[cat] = {"correct": 0, "total": 0, "points": 0, "max": 0}
        categories[cat]["total"] += 1
        categories[cat]["max"] += r["max_points"]
        categories[cat]["points"] += r["points"]
        if r["correct"]:
            categories[cat]["correct"] += 1

    summary = {
        "total_score": total_points,
        "max_score": max_points,
        "accuracy": round(accuracy, 1),
        "questions_answered": len(results),
        "categories": categories,
    }

    print(f"\n{'='*50}")
    print(f"  SCORE: {total_points}/{max_points} ({accuracy:.1f}%)")
    print(f"{'='*50}")
    for cat, data in categories.items():
        cat_pct = data["points"] / data["max"] * 100 if data["max"] else 0
        label = "Strong" if cat_pct >= 70 else "Needs Review"
        print(f"  {cat}: {data['correct']}/{data['total']} correct "
              f"({cat_pct:.0f}%) — {label}")

    return summary
```

**🎯 Resultado esperado:** Ejecutar esto en datos de muestra:

```python
sample = [
    {"question": "What is 2+2?", "category": "math", "correct": True, "points": 10, "max_points": 10},
    {"question": "Capital of France?", "category": "geo", "correct": False, "points": 0, "max_points": 10},
    {"question": "def defines functions?", "category": "python", "correct": True, "points": 10, "max_points": 10},
]
analyse_results(sample)
```

Debe imprimir:

```
==================================================
  SCORE: 20/30 (66.7%)
==================================================
  math: 1/1 correct (100%) — Strong
  geo: 0/1 correct (0%) — Needs Review
  python: 1/1 correct (100%) — Strong
```

**🩹 Si sale mal:** Si la precisión es 0 cuando tuviste respuestas correctas, comprueba que `"points"` y `"max_points"` son las claves en tus dicts de resultado — un error tipográfico como `"max_point"` da silenciosamente 0 vía `sum`. Si faltan categorías, tu bucle `for r in results` no está inicializando nuevas entradas de categoría en el primer encuentro.

### 3.2 Convierte a un DataFrame de pandas para un análisis más profundo

**👟 Pista inicial:** Una vez que tienes un resumen, pandas te permite hacer operaciones groupby fácilmente. Convierte la lista de resultados en un DataFrame y usa `groupby` para estadísticas por categoría.

```python
import pandas as pd

def results_to_dataframe(results: list[dict]) -> pd.DataFrame:
    return pd.DataFrame(results)

def category_breakdown(df: pd.DataFrame) -> pd.DataFrame:
    breakdown = df.groupby("category").agg(
        total_questions=("correct", "count"),
        correct_answers=("correct", "sum"),
        total_points=("points", "sum"),
        max_points=("max_points", "sum"),
    ).reset_index()
    breakdown["accuracy_pct"] = (
        breakdown["total_points"] / breakdown["max_points"] * 100
    ).round(1)
    breakdown["status"] = breakdown["accuracy_pct"].apply(
        lambda x: "Strong" if x >= 70 else "Needs Review"
    )
    return breakdown
```

**🎯 Resultado esperado:**

```python
df = results_to_dataframe(sample)
print(category_breakdown(df))
```

```
  category  total_questions  correct_answers  total_points  max_points  accuracy_pct       status
0      geo                1                0             0          10           0.0  Needs Review
1     math                1                1            10          10         100.0        Strong
2   python                1                1            10          10         100.0        Strong
```

**🩹 Si sale mal:** Si `correct_answers` muestra flotantes (como `1.0` en lugar de `1`), eso es una coerción de enteros normal de pandas con NaN — no afecta los cálculos. Si obtienes un `KeyError`, el nombre de columna en tu DataFrame no coincide con lo que `groupby` espera — comprueba las claves exactas en tus dicts de resultado.

## Paso 4 — Visualiza el rendimiento

Los gráficos hacen evidentes los patrones de un vistazo. Construiremos dos: un gráfico de barras horizontal que muestra la precisión por categoría (coloreado de verde para fuerte, de rojo para débil), y un gráfico circular que muestra la división general correcto/incorrecto.

### 4.1 Construye el gráfico de barras

**👟 Pista inicial:** Usa `matplotlib.pyplot`. Extrae las etiquetas de categoría y sus porcentajes de precisión. Colorea las barras de verde si son ≥70%, de rojo si no. Añade una línea vertical discontinua en el umbral de aprobación del 70% como referencia.

```python
import matplotlib.pyplot as plt

def plot_category_bars(summary: dict) -> None:
    cats = summary["categories"]
    labels = list(cats.keys())
    scores = [cats[c]["points"] / cats[c]["max"] * 100 for c in labels]
    colors = ["#2ecc71" if s >= 70 else "#e74c3c" for s in scores]

    fig, ax = plt.subplots(figsize=(8, 4))
    bars = ax.barh(labels, scores, color=colors)
    ax.set_xlim(0, 100)
    ax.set_xlabel("Accuracy (%)")
    ax.set_title("Score by Category")
    ax.axvline(x=70, color="gray", linestyle="--", alpha=0.5, label="Pass threshold (70%)")
    ax.legend()

    for bar, score in zip(bars, scores):
        ax.text(bar.get_width() + 1, bar.get_y() + bar.get_height() / 2,
                f"{score:.0f}%", va="center", fontsize=10)

    plt.tight_layout()
    plt.savefig("category_bars.png", dpi=150)
    plt.show()
```

**🎯 Resultado esperado:** Un gráfico de barras horizontal con los nombres de categoría en el eje y, porcentajes de precisión en el eje x, barras verdes para categorías ≥70%, barras rojas por debajo, y una línea gris discontinua en el 70%.

**🩹 Si sale mal:** Si el gráfico está en blanco, probablemente estás llamando `plt.show()` antes de añadir cualquier dato — asegúrate de crear la figura y los ejes primero. Si las barras son verticales en lugar de horizontales, usaste `bar` en lugar de `barh`. Si el eje x pasa de 100, añade `ax.set_xlim(0, 100)`.

### 4.2 Construye el gráfico circular

**👟 Pista inicial:** Cuenta el total correcto y el total incorrecto en todas las categorías. Usa `plt.pie` con rebanadas verde y roja y una etiqueta de porcentaje.

```python
def plot_overall_pie(summary: dict) -> None:
    total_correct = sum(d["correct"] for d in summary["categories"].values())
    total_wrong = summary["questions_answered"] - total_correct

    fig, ax = plt.subplots(figsize=(6, 6))
    ax.pie(
        [total_correct, total_wrong],
        labels=["Correct", "Wrong"],
        colors=["#2ecc71", "#e74c3c"],
        autopct="%1.1f%%",
        startangle=90,
        textprops={"fontsize": 12},
    )
    ax.set_title(f"Overall Accuracy — {summary['accuracy']}%")
    plt.tight_layout()
    plt.savefig("overall_pie.png", dpi=150)
    plt.show()
```

**🎯 Resultado esperado:** Un gráfico circular con dos rebanadas — verde para correcto, roja para incorrecto — con etiquetas de porcentaje y la precisión general en el título.

**🩹 Si sale mal:** Si `total_wrong` es negativo, tu conteo de `questions_answered` está mal — asegúrate de contar `len(results)`, no solo los correctos. Si el gráfico circular no tiene etiquetas, comprueba que pasaste el parámetro `labels` a `plt.pie`.

### 4.3 Combina ambos gráficos

**👟 Pista inicial:** Usa `plt.subplots(1, 2)` para colocar ambos gráficos lado a lado en una sola figura.

```python
def plot_results(summary: dict) -> None:
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    cats = summary["categories"]
    labels = list(cats.keys())
    scores = [cats[c]["points"] / cats[c]["max"] * 100 for c in labels]
    colors = ["#2ecc71" if s >= 70 else "#e74c3c" for s in scores]

    axes[0].barh(labels, scores, color=colors)
    axes[0].set_xlim(0, 100)
    axes[0].set_title("Score by Category (%)")
    axes[0].axvline(x=70, color="gray", linestyle="--", alpha=0.5, label="Pass threshold")
    axes[0].legend()

    total_correct = sum(d["correct"] for d in cats.values())
    total_wrong = summary["questions_answered"] - total_correct
    axes[1].pie(
        [total_correct, total_wrong],
        labels=["Correct", "Wrong"],
        colors=["#2ecc71", "#e74c3c"],
        autopct="%1.1f%%",
        startangle=90,
    )
    axes[1].set_title("Overall Accuracy")

    plt.tight_layout()
    plt.savefig("quiz_results.png", dpi=150)
    plt.show()
```

**🎯 Resultado esperado:** Una sola figura con un gráfico de barras horizontal a la izquierda y un gráfico circular a la derecha, guardada como `quiz_results.png`.

**🩹 Si sale mal:** Si solo aparece un gráfico, los otros ejes podrían estar ocultos — comprueba que estás indexando `axes[0]` y `axes[1]`, no usando `axes` directamente. Si la figura está aplastada, aumenta el ancho de `figsize` (p. ej., `(14, 5)`).

## Paso 5 — Guarda los resultados en JSON

Un cuestionario solo es útil si puedes recordar lo que pasó. Guardar los resultados en un archivo JSON significa que un estudiante puede rastrear su progreso a lo largo de días o semanas.

### 5.1 Escribe los helpers de carga y guardado

**👟 Pista inicial:** Usa `json` más `pathlib.Path`. Crea una clase `HistoryFile` que carga el historial existente (o empieza fresco) y guarda después de cada cuestionario. Almacena una lista de sesiones de cuestionario, cada una con una marca de tiempo y sus resultados.

```python
import json
from pathlib import Path
from datetime import datetime

HISTORY_FILE = Path("quiz_history.json")

class HistoryFile:
    def __init__(self, path: Path = HISTORY_FILE):
        self.path = path
        self.sessions: list[dict] = self._load()

    def _load(self) -> list[dict]:
        if not self.path.exists():
            return []
        with self.path.open() as f:
            return json.load(f)

    def save(self) -> None:
        with self.path.open("w") as f:
            json.dump(self.sessions, f, indent=2)

    def add_session(self, results: list[dict], summary: dict) -> None:
        session = {
            "timestamp": datetime.now().isoformat(),
            "num_questions": summary["questions_answered"],
            "accuracy": summary["accuracy"],
            "total_score": summary["total_score"],
            "max_score": summary["max_score"],
            "results": results,
        }
        self.sessions.append(session)
        self.save()
```

**🎯 Resultado esperado:** Ejecutar esto crea `quiz_history.json` en disco:

```python
history = HistoryFile()
history.add_session(sample, analyse_results(sample))
print(f"Saved {len(history.sessions)} session(s)")
print(f"File exists: {HISTORY_FILE.exists()}")
```

**🩹 Si sale mal:** Si obtienes `TypeError: Object of type datetime is not JSON serializable`, estás almacenando el objeto datetime directamente — conviértelo a un string con `.isoformat()` primero. Si el archivo está vacío después de guardar, estás llamando `save()` antes de `add_session()`, o `self.sessions` se está reasignando en lugar de hacerle append.

### 5.2 Carga y muestra sesiones pasadas

**👟 Pista inicial:** Añade un método que imprima una tabla resumen de todas las sesiones pasadas — marca de tiempo, precisión, puntuación — para que el estudiante pueda ver su progreso de un vistazo.

```python
def show_history(history: HistoryFile) -> None:
    if not history.sessions:
        print("\n  No quiz history yet. Take a quiz first!")
        return

    print(f"\n{'='*60}")
    print(f"  QUIZ HISTORY ({len(history.sessions)} sessions)")
    print(f"{'='*60}")
    for i, session in enumerate(history.sessions, 1):
        ts = session["timestamp"][:10]  # just the date part
        acc = session["accuracy"]
        score = f"{session['total_score']}/{session['max_score']}"
        print(f"  {i}. {ts}  |  {score}  |  {acc}%")
    print(f"{'='*60}")
```

**🎯 Resultado esperado:**

```
============================================================
  QUIZ HISTORY (3 sessions)
============================================================
  1. 2026-09-06  |  35/50  |  70.0%
  2. 2026-09-06  |  40/50  |  80.0%
  3. 2026-09-06  |  45/50  |  90.0%
============================================================
```

**🩹 Si sale mal:** Si `timestamp[:10]` te da la subcadena equivocada, comprueba que lo almacenaste como un string de formato ISO, no un objeto `datetime`. Si el historial muestra 0 sesiones después de añadir una, tu método `add_session` está creando una lista nueva en lugar de hacer append a `self.sessions`.

### 5.3 Verifica la persistencia

**✅ Lista de verificación**

- ✅ Después de ejecutar un cuestionario y llamar `add_session`, `quiz_history.json` existe en disco con JSON válido.
- ✅ Reiniciar el programa y crear un nuevo `HistoryFile` carga las sesiones anteriores.
- ✅ `show_history` muestra todas las sesiones pasadas con fecha, puntuación y precisión.
- ✅ Eliminar `quiz_history.json` y volver a ejecutar no se bloquea — empieza con una lista vacía.

## Paso 6 — Interfaz CLI

La pieza final: un menú que lo une todo para que un estudiante pueda interactuar con el motor de cuestionarios sin editar código.

### 6.1 Construye el menú principal

**👟 Pista inicial:** Usa un bucle `while True` con opciones numeradas. Carga el motor y el historial una vez al inicio, luego despacha a la función correcta según la entrada del usuario.

```python
def build_default_engine() -> QuizEngine:
    engine = QuizEngine()
    engine.add_question(MultipleChoice("What is 2 + 2?", "math",
                         options=["3", "4", "5", "6"], correct_index=1))
    engine.add_question(MultipleChoice("Capital of France?", "geography",
                         options=["London", "Paris", "Berlin"], correct_index=1))
    engine.add_question(MultipleChoice("Largest planet?", "science",
                         options=["Earth", "Mars", "Jupiter"], correct_index=2))
    engine.add_question(TrueFalse("Python is statically typed.", "python",
                         correct_answer=False))
    engine.add_question(TrueFalse("The Earth orbits the Sun.", "science",
                         correct_answer=True))
    engine.add_question(FillInBlank("The keyword to define a function is ___",
                         "python", accepted_answers=["def"]))
    engine.add_question(FillInBlank("The keyword to import a module is ___",
                         "python", accepted_answers=["import"]))
    engine.add_question(MultipleChoice("Which data structure is FIFO?", "cs",
                         options=["Stack", "Queue", "Tree", "Graph"], correct_index=1))
    return engine

def main():
    engine = build_default_engine()
    history = HistoryFile()

    while True:
        print(f"\n{'='*40}")
        print("  QUIZ ENGINE")
        print(f"{'='*40}")
        print("  1. Take a quiz")
        print("  2. View history")
        print("  3. Quit")
        print(f"{'='*40}")

        choice = input("  Choose (1-3): ").strip()

        if choice == "1":
            num = input("  How many questions? (default 5): ").strip()
            num = int(num) if num.isdigit() else 5
            try:
                questions = engine.build_quiz(num_questions=num)
            except ValueError as e:
                print(f"  Error: {e}")
                continue
            results = run_quiz(engine, questions)
            summary = analyse_results(results)
            plot_results(summary)
            history.add_session(results, summary)
        elif choice == "2":
            show_history(history)
        elif choice == "3":
            print("  Goodbye!")
            break
        else:
            print("  Invalid choice. Enter 1, 2, or 3.")
```

**🎯 Resultado esperado:** Ejecutar `main()` muestra un menú, te deja tomar un cuestionario (con preguntas cronometradas, puntuación y gráficos), ver el historial pasado o salir. Cada cuestionario se guarda automáticamente.

**🩹 Si sale mal:** Si el menú hace bucle para siempre sin aceptar entrada, estás usando `input` dentro de un `try/except` que se traga `EOFError` — elimina la excepción amplia. Si "Take a quiz" se bloquea con `IndexError`, tu `build_quiz` está intentando muestrear más preguntas de las que contiene el banco — el `try/except ValueError` que lo rodea debería atraparlo.

### 6.2 Añade retroalimentación coloreada

**👟 Pista inicial:** Usa códigos de escape ANSI para los colores del terminal. Envuelve los mensajes de correcto/incorrecto en verde/rojo, y añade color al resumen de puntuación. No se necesitan librerías externas.

```python
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BOLD = "\033[1m"
RESET = "\033[0m"

def coloured(text: str, color: str) -> str:
    return f"{color}{text}{RESET}"

def print_feedback(is_correct: bool, points: int) -> None:
    if is_correct:
        print(coloured(f"  Correct! (+{pts} pts)", GREEN))
    else:
        print(coloured(f"  Wrong. (+{pts} pts)", RED))

def print_score_bar(summary: dict) -> None:
    acc = summary["accuracy"]
    bar_length = 30
    filled = int(bar_length * acc / 100)
    bar = "█" * filled + "░" * (bar_length - filled)
    color = GREEN if acc >= 70 else RED
    print(f"\n  {coloured(bar, color)} {acc}%")
    print(f"  Score: {summary['total_score']}/{summary['max_score']}")
```

**🎯 Resultado esperado:** Ejecutar `print_score_bar({"accuracy": 75.0, "total_score": 30, "max_score": 40})` imprime una barra de progreso coloreada en el terminal — verde si es ≥70%, roja si está por debajo.

**🩹 Si sale mal:** Si ves códigos de escape crudos como `[92m` en lugar de colores, tu terminal no soporta códigos ANSI — la mayoría de los terminales modernos lo hacen, pero el Símbolo del sistema de Windows puede necesitar `os.system("")` llamado una vez al inicio para habilitarlos. Si la barra está desalineada, comprueba que `filled` no excede `bar_length`.

### 6.3 Verifica la aplicación completa

**✅ Lista de verificación**

- ✅ El menú muestra tres opciones y acepta entrada sin bloquearse.
- ✅ "Take a quiz" ejecuta un cuestionario cronometrado, lo puntúa, muestra gráficos y guarda los resultados.
- ✅ "View history" muestra todas las sesiones pasadas con fechas y puntuaciones.
- ✅ "Quit" sale limpiamente.
- ✅ La retroalimentación coloreada aparece en el terminal para respuestas correctas/incorrectas y barras de puntuación.
- ✅ Los resultados persisten en `quiz_history.json` entre reinicios del programa.

## ⚠️ Errores comunes

- **Olvidar normalizar la entrada.** `"True"` y `"true"` son strings diferentes en Python. Cada método `check()` debería hacer `.strip().lower()` a la entrada del usuario antes de comparar. Lo mismo aplica a las respuestas de completar espacios — `"def"` y `"Def"` deberían aceptarse ambas.
- **Deriva del temporizador.** Si calculas `time.time() - start` solo al inicio de cada pregunta (no antes de cada respuesta), el temporizador no dará cuenta de cuánto tarda el usuario en teclear. Llama `remaining = time_limit - (time.time() - start)` justo antes de cada indicación.
- **Mutar la lista por defecto.** Si `build_quiz` modifica `self.questions` en lugar de filtrar a una nueva lista `pool`, eliminarás permanentemente preguntas del banco. Usa siempre una comprensión de lista para crear una copia filtrada.
- **Guardar solo a la salida.** Si solo escribes `quiz_history.json` cuando el usuario sale, un bloqueo o `Ctrl+C` pierde toda la sesión. Llama `history.save()` dentro de `add_session`, inmediatamente después del append — mismo principio que el patrón de estadísticas de Wordle.
- **`random.sample` vs `random.choices`.** `sample` elige sin reemplazo (cada pregunta aparece como máximo una vez). `choices` elige con reemplazo (la misma pregunta puede aparecer dos veces en un cuestionario). Usa `sample` a menos que quieras repetir explícitamente.

## Lo que acabas de construir

Una plataforma de cuestionarios completa: tres tipos de pregunta respaldados por clases abstractas, un motor de cuestionarios con selección aleatoria y sesiones cronometradas, puntuación automática con desgloses por categoría, visualizaciones matplotlib, persistencia JSON entre sesiones y un menú CLI coloreado que lo une todo. Cada pieza se apoya en Python central — clases, diccionarios, listas, `random`, `time`, `json` — además de pandas y matplotlib para la capa de análisis y visualización.

## A dónde ir desde aquí

- **Niveles de dificultad.** Añade un atributo `difficulty` a las preguntas (fácil/medio/difícil) y filtra por categoría y dificultad al construir un cuestionario.
- **Repetición espaciada.** Rastrea qué preguntas se respondieron mal y aumenta su probabilidad de aparecer en cuestionarios futuros usando muestreo aleatorio ponderado.
- **Importación/exportación de preguntas.** Deja que los usuarios escriban bancos de preguntas como archivos CSV o JSON y los carguen al inicio, para que los cuestionarios puedan compartirse entre estudiantes.
- **Cuestionarios adaptativos.** Empieza con preguntas fáciles, y solo avanza a preguntas más difíciles una vez que el estudiante demuestre dominio — una forma simple de pruebas adaptativas por computadora.
- **GUI con Streamlit.** Reemplaza el CLI con una interfaz web usando Streamlit — la misma lógica de backend funciona, solo intercambia `input()` por widgets de Streamlit.
