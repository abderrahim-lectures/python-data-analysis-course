---
title: "Constructor de Encuestas"
description: "Crea encuestas con lógica de ramificación, recolecta respuestas y analiza los resultados con pandas y gráficos."
difficulty: "intermediate"
estimatedMinutes: 75
tags: ["classes", "pandas", "statistics", "data-analysis"]
learningObjectives:
  - Modelar preguntas de encuesta y lógica de ramificación con clases
  - Recolectar y almacenar datos de respuesta estructurados
  - Calcular distribuciones de frecuencia y tabulaciones cruzadas
  - Visualizar resultados de encuestas con gráficos de barras y mapas de calor
prerequisites:
  - "Fundamentos de Python (clases, listas, dicts)"
  - "Comodidad con `input()` para entrada de terminal"
  - "pandas y matplotlib instalados (cubierto en Configuración)"
---

# 📋 Constructor de Encuestas

Las encuestas están en todas partes, formularios de retroalimentación, investigación de mercado, evaluaciones de curso, y detrás de cada una hay un motor estructurado: tipos de pregunta, validación, ramificación condicional y análisis. Este proyecto construye ese motor desde cero: un conjunto de clases de Python que modelan diferentes tipos de pregunta (opción múltiple, escalas de calificación, texto abierto), un ejecutor que secuencia las preguntas con lógica de ramificación y un pipeline de pandas que convierte las respuestas crudas en gráficos de frecuencia y tabulaciones cruzadas.

Esto asume fundamentos de Python incluyendo clases, listas y dicts, y comodidad con `input()`, nada más allá. Es opcional y no se califica; consulta [Proyectos del Mundo Real](/es/proyectos) para ver la lista completa y en crecimiento.

## 🎯 Lo que harás

1. Modelar diferentes tipos de pregunta (opción múltiple, escala de calificación, texto abierto) como clases de Python con validación y comportamiento de ramificación compartidos.
2. Construir un ejecutor `Survey` que secuencia las preguntas, aplica reglas de rama y recolecta las respuestas.
3. Simular datos de respuesta realistas cuando `input()` no sea práctico para ejecuciones automatizadas.
4. Convertir las respuestas a un DataFrame de pandas y calcular conteos de frecuencia, promedios y tabulaciones cruzadas.
5. Generar gráficos de barras y mapas de calor que hagan fácil interpretar los resultados de la encuesta de un vistazo.

## Dónde ejecutar esto

Este proyecto corre casi en cualquier lugar, pandas y matplotlib son Python puro, y la única pieza interactiva es `input()`, que funciona en cualquier terminal.

**El playground de JupyterLite** funciona bien, pega las celdas directamente en un notebook. Necesitarás `!pip install pandas matplotlib` en una celda primero. Ten en cuenta que `input()` funciona de forma diferente en un notebook que en una terminal, la función `simulate_responses()` del Paso 3 existe en parte por esto.

**Google Colab** funciona de fábrica, ambas bibliotecas están preinstaladas, y `input()` funciona de forma nativa en los notebooks.

**Localmente con `uv`** es la ruta recomendada para ejecutar el bucle de encuesta interactivo real (Paso 2) donde `input()` te pregunta pregunta por pregunta, sigue la sección de Configuración de abajo.

- **Ejecútalo en el navegador.** Hay un cuaderno interactivo listo, ábrelo en Colab, Kaggle o Binder y sigue los pasos en orden.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/survey-builder/notebook.es.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/survey-builder/notebook.es.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fsurvey-builder%2Fnotebook.es.ipynb)

## Configuración

Todo lo que necesitas antes de escribir una pregunta de encuesta.

### Instalar `uv`

`uv` es una única herramienta que reemplaza la cadena habitual de "instala Python, luego instala pip, luego instala una herramienta de entorno virtual, luego instala paquetes", puede instalar y gestionar versiones de Python por sí mismo, junto con las dependencias de tu proyecto.

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Cierra y reabre tu terminal, luego confirma que se instaló:

```bash
uv --version
```

### Configurar el proyecto

```bash
uv init survey-builder
cd survey-builder
uv add pandas matplotlib
```

`pandas` convierte las respuestas crudas en un DataFrame estructurado para estadísticas y tabulaciones cruzadas; `matplotlib` produce los gráficos. Ambos son Python puro (con NumPy por debajo), así que se instalan limpiamente con `uv`.

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `survey-builder/` existe con un `pyproject.toml`, y `pandas` y `matplotlib` están instalados.
- ✅ `uv run python -c "import pandas, matplotlib; print('all good')"` imprime `all good`.

## Paso 1: Define los tipos de pregunta

Una encuesta no es un solo formulario, es una serie de preguntas diferentes, cada una con su propio formato de entrada, reglas de validación y comportamiento de ramificación. Modelar cada tipo como una clase te permite compartir las partes comunes (visualización, validación, ramificación) en una clase base mientras personalizas los detalles por tipo.

### 1.1 Crea la clase base `Question` y dos subclases

```python
from dataclasses import dataclass, field
from typing import Any, Optional

@dataclass
class Question:
    text: str
    required: bool = True
    branch_rules: dict[str, str] = field(default_factory=dict)

    def display(self) -> None:
        print(f"\n  {self.text}")

    def validate(self, answer: Any) -> bool:
        return True

    def next_question_id(self, answer: Any) -> Optional[str]:
        return self.branch_rules.get(str(answer))

@dataclass
class MultipleChoice(Question):
    options: list[str] = field(default_factory=list)

    def display(self) -> None:
        print(f"\n  {self.text}")
        for i, opt in enumerate(self.options, 1):
            print(f"    {i}. {opt}")

    def validate(self, answer: str) -> bool:
        return answer in [str(i) for i in range(1, len(self.options) + 1)]

@dataclass
class RatingScale(Question):
    low_label: str = "Poor"
    high_label: str = "Excellent"
    scale_min: int = 1
    scale_max: int = 5

    def display(self) -> None:
        print(f"\n  {self.text}")
        print(f"    {self.scale_min} ({self.low_label}) — {self.scale_max} ({self.high_label})")

    def validate(self, answer: str) -> bool:
        try:
            return self.scale_min <= int(answer) <= self.scale_max
        except ValueError:
            return False

mc = MultipleChoice("How often do you exercise?", options=["Daily", "Weekly", "Monthly", "Rarely"])
rating = RatingScale("How satisfied are you?", low_label="Not at all", high_label="Very")
mc.display()
rating.display()
print(f"MC valid '2': {mc.validate('2')} | Rating valid '6': {rating.validate('6')}")
```

**👟 Pista inicial :** La clase base `Question` hace solo lo que es común a todas las preguntas: almacenar el texto, validar (trivialmente, `True`) y buscar una regla de rama. `MultipleChoice` y `RatingScale` la subclasifican y sobrescriben `display()` y `validate()`, exactamente el patrón de herencia que le permite a un ejecutor `Survey` tratar todas las preguntas de la misma manera. Observa que `branch_rules` es un dict que mapea una respuesta al id de la siguiente pregunta.

**🎯 Resultado esperado :**
```
  How often do you exercise?
    1. Daily
    2. Weekly
    3. Monthly
    4. Rarely

  How satisfied are you?
    1 (Not at all) — 5 (Very)
MC valid '2': True | Rating valid '6': False
```

**🩹 Si sale mal :** Si `MultipleChoice.validate('2')` devuelve `False`, comprueba que `options` tenga al menos 2 entradas, la validación construye `range(1, len(options)+1)`. Si `RatingScale.validate('6')` devuelve `True`, el `scale_max` no se está aplicando, confirma la conversión `int(answer)` y el orden de la comparación `<=`.

### 1.2 Verifica las clases de pregunta

**✅ Lista de verificación**

- ✅ `MultipleChoice.validate("2")` es `True`, `validate("5")` es `False` para una pregunta de 4 opciones.
- ✅ `RatingScale.validate("3")` es `True`, `validate("0")` y `validate("6")` son ambos `False`.
- ✅ Puedes explicar por qué `MultipleChoice` almacena las opciones como una lista de cadenas en lugar de ints.

**🤔 Pregunta(s) socrática(s)**

- La clase `RatingScale` almacena `scale_min` y `scale_max` como atributos de clase con valores predeterminados. Si quisieras una escala de 1–10, ¿qué sobrescribirías en la instanciación, y `validate` necesitaría cambiar?
- `MultipleChoice.validate` construye la lista de respuestas válidas desde `len(self.options)`. ¿Qué pasaría si tuvieras 10 opciones, el código de validación necesitaría cambiar, o escala automáticamente? ¿Por qué?

## Paso 2: Construye el ejecutor de encuestas

Una `Question` aislada es inerte. La clase `Survey` las secuencia, aplica las reglas de ramificación para decidir qué pregunta viene después y recolecta las respuestas en un único objeto `SurveyResponse` que puedes analizar más tarde.

### 2.1 Crea las clases `Survey` y `SurveyResponse`

```python
from dataclasses import dataclass
from typing import Any, Optional

@dataclass
class SurveyResponse:
    survey_title: str
    answers: dict[str, Any]
    timestamp: str = ""

    def __post_init__(self):
        if not self.timestamp:
            from datetime import datetime
            self.timestamp = datetime.now().isoformat()

class Survey:
    def __init__(self, title: str):
        self.title = title
        self.questions: dict[str, Question] = {}
        self.order: list[str] = []

    def add_question(self, q_id: str, question: Question) -> None:
        self.questions[q_id] = question
        self.order.append(q_id)

    def run(self) -> SurveyResponse:
        print(f"\n  Survey: {self.title}")
        answers: dict[str, Any] = {}
        idx = 0
        while idx < len(self.order):
            q_id = self.order[idx]
            question = self.questions[q_id]
            question.display()
            while True:
                answer = input("  Your answer: ").strip()
                if not question.required and answer == "":
                    break
                if question.validate(answer):
                    answers[q_id] = answer
                    break
                print("  Invalid answer, please try again.")
            branch = question.next_question_id(answer)
            idx = self.order.index(branch) if branch and branch in self.questions else idx + 1
        print("  Thank you for completing the survey!")
        return SurveyResponse(survey_title=self.title, answers=answers)
```

**👟 Pista inicial :** El bucle `while idx < len(self.order)` recorre las preguntas en orden. Después de cada respuesta, busca `next_question_id(answer)`, si las reglas de rama dicen "la respuesta 2 salta a la pregunta 'followup'", el índice salta allí; de lo contrario avanza en uno. `SurveyResponse.__post_init__` estampa una marca de tiempo cuando no se proporciona una, los dataclasses ejecutan `__post_init__` justo después de `__init__`, que es el lugar idiomático para la lógica que depende de valores predeterminados.

**🎯 Resultado esperado :** Ejecutar `Survey("Health Survey").run()` pregunta pregunta por pregunta y devuelve un `SurveyResponse` con las respuestas recolectadas y una marca de tiempo.

**🩹 Si sale mal :** Si el ejecutor se queda atrapado en un bucle infinito, `branch` probablemente apunta a un id de pregunta que no está en `self.questions`, el fallback `else idx + 1` solo se ejecuta cuando la rama es None o no se encuentra, así que un id mal escrito en `branch_rules` hace que el bucle repita la misma pregunta. Si `input()` falla de inmediato en un notebook, estás en una celda no interactiva, usa el enfoque de simulación del Paso 3 en su lugar.

### 2.2 Verifica el ejecutor de encuestas

**✅ Lista de verificación**

- ✅ `Survey.run()` se completa y devuelve un `SurveyResponse` con claves que coinciden con tus ids de pregunta.
- ✅ Una pregunta obligatoria que recibe una respuesta inválida vuelve a preguntar, nunca aceptando la entrada mala.
- ✅ Una pregunta opcional (`required=False`) acepta una respuesta vacía.

**🤔 Pregunta(s) socrática(s)**

- El ejecutor usa un bucle `while idx < len(self.order)`, no un bucle `for` sobre `self.order`. ¿Por qué es necesario un bucle `while` cuando una instrucción de rama puede saltar el índice hacia adelante o atrás?
- Si dos preguntas tuvieran el mismo texto de visualización pero ids diferentes, ¿cómo distinguiría la encuesta entre ellas? ¿Qué sugiere esto sobre por qué los ids de pregunta deben ser únicos?

## Paso 3: Recolecta respuestas, en vivo y simuladas

Las encuestas reales necesitan muchas respuestas, pero ejecutar `input()` 30 veces en una terminal no es práctico. Este paso construye ambos caminos: un bucle que llama a `survey.run()` para la recolección en vivo y una función `simulate_responses()` que genera respuestas aleatorias realistas para que el análisis no dependa de alguien sentado frente al teclado.

### 3.1 Recolecta respuestas en vivo

```python
def collect_responses(survey: Survey, count: int) -> list[SurveyResponse]:
    responses = []
    for i in range(count):
        print(f"\n--- Participant {i + 1} of {count} ---")
        responses.append(survey.run())
    return responses
```

### 3.2 Simula respuestas para el análisis automatizado

```python
def simulate_responses() -> list[dict]:
    import random
    return [{
        "exercise_freq": str(random.choice([1, 2, 3, 4])),
        "satisfaction": str(random.randint(1, 5)),
        "recommend": str(random.choice([1, 2, 3, 4, 5])),
        "feedback": random.choice(["Great service", "Needs improvement", "Excellent", "Could be better"]),
    } for _ in range(30)]

responses = simulate_responses()
print(f"Collected {len(responses)} simulated responses")
```

**👟 Pista inicial :** `collect_responses` es el camino en vivo, llámala con una `Survey` y un conteo y ejecuta la encuesta ese número de veces, cada una produciendo un `SurveyResponse`. `simulate_responses` es el camino automatizado, usa `random` para generar 30 respuestas plausibles con las mismas claves que producirían las preguntas de tu encuesta. Las claves deben coincidir exactamente con tus ids de pregunta, o el paso de pandas de abajo no encontrará las columnas correctas.

**🎯 Resultado esperado :**
```
Collected 30 simulated responses
```

**🩹 Si sale mal :** Si `random.choice([1, 2, 3, 4])` devuelve un int de numpy que rompe el código aguas abajo, los valores se almacenan como cadenas (`str(...)`), eso es deliberado. Si ves un `KeyError` al construir el DataFrame más tarde, a una respuesta simulada le falta una clave que producen las preguntas de tu encuesta, comprueba que las claves del dict `simulate_responses` coincidan con tus ids de pregunta.

### 3.3 Verifica la recolección de respuestas

**✅ Lista de verificación**

- ✅ `simulate_responses()` devuelve una lista de 30 dicts, cada uno con las mismas cuatro claves.
- ✅ Los valores de cada respuesta son cadenas (no ints), coincidiendo con lo que `Survey.run()` produciría desde `input()`.
- ✅ `collect_responses` produce una lista de objetos `SurveyResponse` cuando se le da una `Survey` real.

**🤔 Pregunta(s) socrática(s)**

- Las respuestas se almacenan como cadenas (`"2"`, `"4"`) aunque representan números. ¿Por qué eso coincide con la realidad, qué devuelve `input()`, y cómo almacenarlo crudo preserva información?
- `simulate_responses` usa `random.choice` para todo. ¿Cómo sería la distribución si usaras `random.randint(1, 4)` en lugar de `random.choice([1, 2, 3, 4])`? ¿Cómo cambiaría eso el análisis?

## Paso 4: Analiza los resultados con pandas

Los datos están recolectados, ahora necesitan convertirse en percepción. Este paso convierte la lista de respuestas a un DataFrame, mapea las respuestas numéricas crudas a etiquetas legibles y calcula conteos de frecuencia y promedios que responden preguntas como "¿con qué frecuencia hace ejercicio la gente?" y "¿qué tan satisfecha está, en promedio?"

### 4.1 Convierte a un DataFrame y calcula estadísticas

```python
import pandas as pd

df = pd.DataFrame(responses)

freq_map = {"1": "Daily", "2": "Weekly", "3": "Monthly", "4": "Rarely"}
df["exercise_label"] = df["exercise_freq"].map(freq_map)
exercise_counts = df["exercise_label"].value_counts()
satisfaction_counts = df["satisfaction"].value_counts().sort_index()

print("Exercise Frequency:")
print(exercise_counts)
print(f"\nAverage Satisfaction: {df['satisfaction'].astype(int).mean():.2f}")
```

**👟 Pista inicial :** `pd.DataFrame(responses)` convierte una lista de dicts en filas y columnas automáticamente. `.map(freq_map)` convierte el `"1"` crudo a la cadena legible `"Daily"`, este es el paso clásico de búsqueda/recodificación en el análisis de encuestas. `value_counts()` cuenta con qué frecuencia aparece cada valor, y `df[...].astype(int).mean()` calcula el promedio numérico convirtiendo la columna de cadenas a enteros primero.

**🎯 Resultado esperado :**
```
Exercise Frequency:
Daily         <count>
Weekly        <count>
Monthly        <count>
Rarely        <count>
Name: exercise_label, dtype: int64

Average Satisfaction: <number between 1.0 and 5.0>
```

**🩹 Si sale mal :** Un `KeyError: 'exercise_freq'` significa que `responses` no tiene esa columna, comprueba que las claves de `simulate_responses` coincidan con `exercise_freq`, `satisfaction`, etc. exactamente. Si `exercise_counts` está vacío, `value_counts()` solo encontró valores NaN, comprueba si `df["exercise_freq"]` es None o NaN en algunas filas. Si `.astype(int)` falla, un valor de respuesta no es una cadena de entero limpia, comprueba si hay espacios en blanco o caracteres extra.

### 4.2 Construye una tabulación cruzada

```python
cross_tab = pd.crosstab(df["exercise_label"], df["satisfaction"])
print("\nExercise Frequency vs Satisfaction:")
print(cross_tab)
```

**🎯 Resultado esperado :** Una tabla de 4 filas por 5 columnas donde cada celda es el conteo de encuestados con esa frecuencia de ejercicio y esa puntuación de satisfacción.

**🩹 Si sale mal :** Si `pd.crosstab` devuelve un error sobre índices duplicados, puedes tener etiquetas de ejercicio duplicadas, poco probable con un `map` limpio, pero comprueba si hay errores tipográficos en `freq_map`. Si la tabla tiene celdas NaN, `pd.crosstab` maneja las combinaciones vacías como 0 por defecto, verifica que no estás mirando datos faltantes en lugar de un conteo de cero real.

### 4.3 Verifica el análisis

**✅ Lista de verificación**

- ✅ `pd.DataFrame(responses)` crea un DataFrame con las mismas claves como columnas.
- ✅ `exercise_counts` muestra una distribución de frecuencia en las cuatro etiquetas, ninguna etiqueta falta nunca cuando está representada en los datos.
- ✅ `pd.crosstab(df["exercise_label"], df["satisfaction"])` produce una tabla no trivial (filas > 1).

**🤔 Pregunta(s) socrática(s)**

- `value_counts()` descarta los valores faltantes por defecto, mientras que `crosstab` trata una combinación que no aparece como 0. ¿Cuándo importa esa distinción, puedes pensar en un caso donde *querrías* que una fila faltante permaneciera faltante en lugar de convertirse en 0?
- Si cambiaras la escala de satisfacción de 1–5 a 1–10, ¿qué código se rompería? El `crosstab` mostrará automáticamente 10 columnas, ¿algún otro paso necesitaría cambios?

## Paso 5: Visualiza los resultados

Los números en un DataFrame son precisos pero lentos de asimilar. Dos gráficos de barras, uno para la frecuencia de ejercicio, uno para la distribución de satisfacción, convierten los conteos en una imagen de un vistazo.

### 5.1 Construye los gráficos

```python
import matplotlib.pyplot as plt

fig, axes = plt.subplots(1, 2, figsize=(12, 5))

colors_ex = ["#2ecc71", "#3498db", "#f39c12", "#e74c3c"]
exercise_counts.plot(kind="bar", ax=axes[0], color=colors_ex)
axes[0].set_title("Exercise Frequency")
axes[0].set_ylabel("Responses")
axes[0].tick_params(axis="x", rotation=45)

colors_sat = ["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#27ae60"]
satisfaction_counts.plot(kind="bar", ax=axes[1], color=colors_sat[:len(satisfaction_counts)])
axes[1].set_title("Satisfaction Ratings")
axes[1].set_ylabel("Responses")

plt.tight_layout()
plt.savefig("survey_results.png", dpi=150)
plt.show()
```

**👟 Pista inicial :** `plt.subplots(1, 2, figsize=(12, 5))` crea una sola figura con dos ejes lado a lado. Cada `Series.plot(kind="bar", ax=axes[n])` dibuja en un subplot específico; los arreglos de color están ordenados para que la satisfacción baja sea roja y la alta sea verde, una elección visual intencional que coincide con las asociaciones intuitivas de "rojo = malo, verde = bueno". `color=colors_sat[:len(satisfaction_counts)]` reban reban la paleta hasta el número real de valores de calificación presentes, así que una encuesta donde nadie eligió 5 no muestra una barra vacía.

**🎯 Resultado esperado :** Dos gráficos de barras en una figura: frecuencia de ejercicio a la izquierda (4 barras de colores), calificaciones de satisfacción a la derecha (hasta 5 barras de colores). La figura se guarda en `survey_results.png` en tu carpeta de proyecto y se muestra en pantalla.

**🩹 Si sale mal :** Una figura en blanco (sin barras) significa que la Serie que estás trazando está vacía, comprueba que `exercise_counts` y `satisfaction_counts` tengan datos. Si el gráfico de satisfacción muestra solo 3 colores pero 5 calificaciones, `satisfaction_counts` tiene menos de 5 valores únicos, eso son datos, no un error, y la rebanada es lo que mantiene la paleta alineada. Si `plt.show()` no muestra nada en un entorno sin cabeza de pantalla, el `savefig` igual escribió el archivo, comprueba ese.

### 5.2 Verifica la visualización

**✅ Lista de verificación**

- ✅ `survey_results.png` existe en tu carpeta de proyecto (o el notebook genera la figura).
- ✅ Ambos subplots tienen títulos (`Exercise Frequency`, `Satisfaction Ratings`) y etiquetas del eje y.
- ✅ Las barras de satisfacción usan un orden de colores que comunica visualmente la satisfacción de baja a alta.

**🤔 Pregunta(s) socrática(s)**

- Los arreglos de color están codificados con cinco códigos hex. ¿Qué pasaría si ejecutaras la encuesta con una escala de 10 puntos, los colores seguirían mapeando de forma sensible, o necesitarías generarlos programáticamente?
- `plt.savefig("survey_results.png")` escribe en el directorio actual. ¿Qué se rompería si ejecutaras este script desde un directorio de trabajo diferente, y qué te da `Path(__file__).parent` en su lugar?

## ⚠️ Errores comunes

- **Los ids de pregunta no coinciden con las claves de respuesta.** `Survey.run()` almacena las respuestas bajo los ids de pregunta que pasas a `add_question`, y `simulate_responses()` devuelve dicts con claves codificadas. Si el id en `add_question` es `"exercise_freq_x"` pero la simulación usa `"exercise_freq"`, tu DataFrame tendrá una columna faltante. Mantén los dos sincronizados, o mejor, impulsa las claves de simulación desde la propia encuesta.
- **Confusión entre cadena e int.** `input()` devuelve cadenas, así que comentarios como "`6` no está en el rango" son comparaciones de cadenas. `df["satisfaction"].astype(int).mean()` convierte antes de promediar; una cadena no numérica descarriada (como un espacio en blanco de una pregunta opcional) hace que `.astype(int)` se lance. Filtra o rellena NaN antes de convertir.
- **El bucle de rama puede girar para siempre.** Si `branch_rules` mapea una respuesta a un id de pregunta que no está `in self.questions`, el `else idx + 1` no se dispara y el ejecutor vuelve a preguntar la misma pregunta. Los ids mal escritos son la causa clásica, mantén una única fuente de verdad para los ids de pregunta.
- **La diferencia de `value_counts` que descarta faltantes vs `crosstab` que cuenta 0.** Un encuestado que salta una pregunta opcional desaparece de `value_counts()` pero aparece como un conteo de 0 en `crosstab` solo si la categoría existe en otro lugar. Sabe qué comportamiento necesita tu análisis antes de interpretar el gráfico.

## Lo que acabas de construir

Una plataforma de encuestas completa: clases de pregunta con seguridad de tipos y validación, un ejecutor de encuestas con ramificación, recolección de respuestas en vivo y simuladas, y un pipeline de análisis impulsado por pandas que convierte las respuestas crudas en conteos de frecuencia, promedios, tabulaciones cruzadas y gráficos lado a lado. También aprendiste el patrón central de cualquier flujo de trabajo de análisis de datos: crudo → estructurado → estadísticas → visualización.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/survey-builder/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/survey-builder) en el repo del curso es una versión más completa con una tabulación cruzada de mapa de calor, funciones de filtrado de respuestas (muestra todos los que hacen ejercicio a diario y calcula su satisfacción promedio) y ramificación de múltiples niveles. Clónalo, o abre todo el repo en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) y ejecútalo desde ahí.
:::

## Hacia dónde ir desde aquí

- Añade un mapa de calor de tabulación cruzada: usa `pd.crosstab` + `matplotlib.imshow` (o el `heatmap` de Seaborn) para visualizar la frecuencia de ejercicio vs. la satisfacción como una cuadrícula de colores en lugar de una tabla de números.
- Añade filtrado de respuestas: escribe una función que devuelva solo los encuestados que eligieron una respuesta específica (p. ej., todos los que hacen ejercicio a diario) y calcula su satisfacción promedio, el filtro revela la percepción de subgrupo que el agregado pierde.
- Extiende la ramificación a múltiples niveles: cuando la respuesta A en la pregunta 1 salta a la pregunta X, y la respuesta B en la pregunta X salta a la pregunta Y, tu lógica de `next_question_id` y `order.index(branch)` necesita manejar cadenas de ramas, no solo saltos únicos.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientas orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README tiene un recorrido completo, apto para principiantes, para añadir el tuyo mediante un **pull request**, incluso si nunca has usado git antes: hacer fork del repo, crear una rama, hacer commit de tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓
