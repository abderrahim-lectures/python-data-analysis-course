---
title: "Rastreador de Fitness"
description: "Rastrea entrenamientos, nutrición y métricas de salud con visualización de progreso y establecimiento de metas."
difficulty: "beginner"
estimatedMinutes: 60
tags: ["classes", "pandas", "matplotlib", "data-analysis"]
learningObjectives:
  - "Modelar ejercicios y comidas como dataclasses con propiedades derivadas"
  - "Registrar sesiones de entrenamiento completas y calcular el volumen total de entrenamiento"
  - "Rastrear la nutrición diaria con totales de macros y desgloses de calorías"
  - "Convertir un historial en pandas y calcular un promedio móvil"
  - "Graficar tendencias de peso corporal y volumen de entrenamiento lado a lado"
prerequisites:
  - "Fundamentos de Python (clases, diccionarios, listas)"
  - "pip install pandas matplotlib"
---

# 🛠️ 💪 Rastreador de Fitness

Un registro de entrenamientos es el proyecto de análisis de datos más simple que existe: recolectas números todos los días, y la parte interesante es verlos cambiar con el tiempo. Este proyecto construye ese ciclo desde cero — modelarás ejercicios y comidas como dataclasses tipadas, registrarás sesiones y calcularás volumen de entrenamiento, rastrearás macros y porcentajes de calorías, convertirás todo en un DataFrame de pandas, y graficarás tendencias de peso y fuerza lado a lado con matplotlib. Sin claves de API, sin credenciales, sin servicios externos: solo tus propios datos estructurados y una secuencia de preguntas progresivamente más inteligentes sobre ellos.

Esto asume Python 101 y familiaridad básica con listas y dicts — no se requiere nada de Análisis de Datos. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa y creciente.

## 🎯 Lo que harás

1. Modelar ejercicios y comidas individuales como tipos `@dataclass` con una propiedad `volume` que calcule el peso total levantado.
2. Registrar una sesión de entrenamiento completa — una lista de ejercicios — y calcular el volumen y la duración total.
3. Rastrear las comidas de un día, sumar totales de macros y calcular qué porcentaje de calorías aporta cada macro.
4. Convertir tu historial diario en un `DataFrame` de pandas y calcular un promedio móvil.
5. Graficar tendencias de peso corporal y volumen de entrenamiento lado a lado en una figura de matplotlib de dos paneles.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal y recomendado — `pandas` y `matplotlib` son ambos instalaciones puras de Python, y cualquier terminal real renderizará los gráficos y guardará los PNG.

**GitHub Codespaces también funciona perfectamente:** abre [el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) y ejecuta desde ahí. Todo se comporta de forma idéntica.

**Google Colab, Kaggle Notebooks y Binder están genuinamente bien adaptados para este proyecto** — nada aquí depende de fuentes del sistema, binarios externos ni un sistema de archivos local. El notebook de abajo usa la misma semana sintética de datos hacia la que construyen los pasos, así que los DataFrames de `pandas` y los gráficos de matplotlib se renderizan en línea con configuración cero. Este es uno de los proyectos que de verdad encajan limpiamente en el modelo de notebook, de principio a fin.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/fitness-tracker/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/fitness-tracker/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Ffitness-tracker%2Fnotebook.ipynb)

## Configuración

Todo lo que necesitas son dos bibliotecas de PyPI — sin binarios externos, sin claves de API.

### Instala `uv`

`uv` es una sola herramienta que reemplaza la cadena habitual de "instala Python, luego instala pip, luego instala una herramienta de entorno virtual, luego instala paquetes" — puede instalar y gestionar versiones de Python por sí misma, junto con las dependencias de tu proyecto.

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Cierra y vuelve a abrir tu terminal, luego confirma que se instaló:

```bash
uv --version
```

### Configura el proyecto

```bash
uv init fitness-tracker
cd fitness-tracker
uv add pandas matplotlib
```

`pandas` te da el `DataFrame` — la estructura correcta para datos tabulares de series de tiempo — y `matplotlib` dibuja los gráficos. Todo después de esto es Python puro más esas dos bibliotecas.

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `fitness-tracker/` existe con un `pyproject.toml`, y `pandas` y `matplotlib` están instalados.

## Paso 1: Modela ejercicios y comidas como dataclasses

Todo ejercicio tiene la misma forma: un nombre, un número de series, repeticiones, peso y duración opcional. Un `@dataclass` impone esa forma y te da una propiedad `volume` calculada — el peso total levantado en una serie — para que nunca lo recalculques a mano.

### 1.1 Define Exercise y Meal

**👟 Pista inicial :** Usa `@dataclass` con un `@property` para `volume` (series × repeticiones × peso), y escribe un método `summary()` legible para humanos en cada clase para mostrar.

```python
# fitness_tracker.py
from datetime import date
from dataclasses import dataclass

@dataclass
class Exercise:
    name: str
    sets: int
    reps: int
    weight_kg: float
    duration_min: int = 0

    @property
    def volume(self) -> float:
        """Total weight lifted: sets × reps × weight."""
        return self.sets * self.reps * self.weight_kg

    def summary(self) -> str:
        return f"{self.name}: {self.sets}x{self.reps} @ {self.weight_kg}kg (vol: {self.volume:.0f})"

@dataclass
class Meal:
    name: str
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float

    def summary(self) -> str:
        return f"{self.name}: {self.calories} kcal (P:{self.protein_g}g C:{self.carbs_g}g F:{self.fat_g}g)"

bench = Exercise("Bench Press", sets=4, reps=8, weight_kg=60)
print(bench.summary())
print(f"Volume: {bench.volume:.0f} kg")

chicken = Meal("Grilled Chicken", calories=350, protein_g=40, carbs_g=5, fat_g=10)
print(chicken.summary())
```

`volume` como un `@property` en lugar de un método regular significa que escribes `bench.volume`, no `bench.volume()` — la diferencia de llamada con paréntesis es cosmética, pero el patrón `@property` señala "esto es un hecho derivado sobre el estado actual, no un comando que hace algo". Los dos métodos `summary()` son métodos regulares porque producen una *cadena de visualización*, que es un servicio, no una propiedad — la distinción de nombres mantiene predecible la API.

**🎯 Resultado esperado :** Imprime `Bench Press: 4x8 @ 60kg (vol: 1920)` seguido de `Volume: 1920 kg`, luego `Grilled Chicken: 350 kcal (P:40g C:5g F:10g)`.

**🩹 Si sale mal :** Si `volume` imprime `0.0` a pesar de entradas distintas de cero, lo estás llamando sin `()` — es una propiedad, así que los paréntesis llamarían al getter de la propiedad y *devolverían* el valor, pero imprimir el resultado está bien. El error es `volume = sets * reps * weight` en el cuerpo de la clase sin el decorador `@property` — verifica que la línea `@property` está directamente sobre `def volume`.

### 1.2 Verifica los modelos

**✅ Lista de verificación**

- ✅ Las instancias de `Exercise` y `Meal` se construyen limpiamente y `volume` calcula el producto correcto.
- ✅ Puedes explicar por qué `@property` es la elección correcta para `volume` y un método regular para `summary()`.

**🤔 Pregunta(s) socrática(s)**

- Si almacenaras `volume` como un atributo regular (calculado en `__post_init__`) en lugar de un `@property`, ¿qué pasa cuando cambias `sets` o `weight_kg` después de la construcción — y eso importa para este proyecto?
- `Exercise` tiene `duration_min: int = 0` con un valor por defecto, mientras que `name` no tiene valor por defecto. ¿Por qué `duration_min` debe ir después de `name` en la lista de campos, y qué regla de Python lo impone?

## Paso 2: Registra sesiones de entrenamiento

Un ejercicio es un movimiento único; una sesión de entrenamiento es una colección de ejercicios hechos en un solo día. La clase `WorkoutSession` envuelve esa colección y calcula el volumen y la duración total del día — los primeros dos números que vale la pena rastrear con el tiempo.

### 2.1 Define WorkoutSession

**👟 Pista inicial :** Almacena los ejercicios en una lista simple, y calcula `total_volume()` como una suma de la propiedad `volume` de cada ejercicio — no se necesitan bucles si usas una expresión generadora.

```python
# fitness_tracker.py (continued)
class WorkoutSession:
    def __init__(self, session_date: str | None = None):
        self.date = session_date or date.today().isoformat()
        self.exercises: list[Exercise] = []

    def add_exercise(self, exercise: Exercise) -> None:
        self.exercises.append(exercise)
        print(f"  + {exercise.summary()}")

    def total_volume(self) -> float:
        return sum(ex.volume for ex in self.exercises)

    def duration(self) -> int:
        return sum(ex.duration_min for ex in self.exercises)

    def display(self) -> str:
        lines = [f"Workout — {self.date}", "-" * 40]
        for ex in self.exercises:
            lines.append(f"  {ex.summary()}")
        lines.append(f"  Total volume: {self.total_volume():.0f} kg")
        lines.append(f"  Total duration: {self.duration()} min")
        return "\n".join(lines)

session = WorkoutSession("2025-01-13")
session.add_exercise(Exercise("Bench Press", 4, 8, 60, 15))
session.add_exercise(Exercise("Overhead Press", 3, 10, 30, 10))
session.add_exercise(Exercise("Lateral Raise", 3, 15, 10, 8))
print(session.display())
```

`session_date or date.today().isoformat()` es un valor por defecto práctico: cada sesión queda con marca de tiempo, pero puedes sobrescribirlo para rellenar un registro desde un día específico. `sum(ex.volume for ex in self.exercises)` es una expresión generadora que evita construir una lista intermedia — para tres ejercicios no importa, pero es la forma correcta cuando tienes docenas y quieres que el costo de memoria sea cero.

**🎯 Resultado esperado :** Imprime cada ejercicio mientras se agrega, luego un resumen mostrando el volumen total (`1920 + 900 + 450 = 3270 kg`) y la duración total (`15 + 10 + 8 = 33 min`).

**🩹 Si sale mal :** Si `total_volume()` es `0.0` a pesar de ejercicios reales, los ejercicios se anexaron a una lista distinta (verifica que estás usando `self.exercises`, no una local). Si `display()` se ejecuta pero no muestra ejercicios, `add_exercise` nunca se llamó entre construir `session` y llamar a `display()` — los ejercicios se agregan manualmente, no mágicamente.

### 2.2 Verifica la sesión

**✅ Lista de verificación**

- ✅ `session.total_volume()` devuelve 3270.0, y `session.duration()` devuelve 33.
- ✅ La salida de `display()` incluye los tres ejercicios, sus volúmenes individuales y los totales.

**🤔 Pregunta(s) socrática(s)**

- Si registraras el *mismo* ejercicio dos veces (append duplicado), `total_volume()` lo contaría dos veces en silencio. ¿Qué protección simple podrías agregar dentro de `add_exercise` para prevenir duplicados exactos, y cuándo sería esa protección *incorrecta* (es decir, genuinamente quieres registrar el mismo ejercicio dos veces)?
- `duration_min` tiene por defecto `0` para ejercicios donde solo rastreas series y repeticiones. ¿Debería `total_volume()` seguir contando la duración como parte del "esfuerzo" de un entrenamiento — y si es así, cómo cambiarías el cálculo?

## Paso 3: Rastrea la nutrición diaria

Un entrenamiento te dice cuánto levantaste; la nutrición te dice con qué estás construyendo. Un `DailyLog` recolecta todas las comidas del día y calcula las calorías totales más el desglose de proteína/carbohidratos/grasa — el porcentaje de macro de cada fuente de calorías, teniendo en cuenta que la proteína y los carbohidratos tienen 4 kcal/g mientras que la grasa tiene 9.

### 3.1 Define DailyLog

**👟 Pista inicial :** `totals()` suma cantidades brutas en gramos entre todas las comidas; un método nuevo `macro_split()` convierte gramos a calorías usando los factores 4/4/9, luego divide por el total para obtener porcentajes.

```python
# fitness_tracker.py (continued)
class DailyLog:
    def __init__(self, log_date: str | None = None):
        self.date = log_date or date.today().isoformat()
        self.meals: list[Meal] = []

    def add_meal(self, meal: Meal) -> None:
        self.meals.append(meal)
        print(f"  + {meal.summary()}")

    def totals(self) -> dict:
        return {
            "calories": sum(m.calories for m in self.meals),
            "protein": sum(m.protein_g for m in self.meals),
            "carbs": sum(m.carbs_g for m in self.meals),
            "fat": sum(m.fat_g for m in self.meals),
        }

    def macro_split(self) -> dict:
        """Percentage of total calories coming from protein, carbs, and fat."""
        grams = self.totals()
        by_macro_cal = {
            "protein": grams["protein"] * 4,
            "carbs":   grams["carbs"]   * 4,
            "fat":     grams["fat"]     * 9,
        }
        total_cal = sum(by_macro_cal.values()) or 1
        return {k: round(v / total_cal * 100, 1) for k, v in by_macro_cal.items()}

    def display(self) -> str:
        t = self.totals()
        s = self.macro_split()
        lines = [f"Daily Log — {self.date}", "-" * 40]
        for m in self.meals:
            lines.append(f"  {m.summary()}")
        lines.append(f"  TOTAL: {t['calories']} kcal  |  P:{t['protein']}g  C:{t['carbs']}g  F:{t['fat']}g")
        lines.append(f"  SPLIT: P:{s['protein']}%  C:{s['carbs']}%  F:{s['fat']}%")
        return "\n".join(lines)

log = DailyLog("2025-01-13")
log.add_meal(Meal("Breakfast Oats", 300, 10, 50, 8))
log.add_meal(Meal("Grilled Chicken", 350, 40, 5, 10))
log.add_meal(Meal("Protein Shake", 120, 25, 5, 1))
print(log.display())
```

El `or 1` en `macro_split` previene la división por cero en un registro vacío — Python te deja agregar comidas después, así que la primera llamada podría no tener datos. Los factores 4/4/9 son los factores Atwater estándar: la proteína y los carbohidratos aportan cada uno 4 kilocalorías por gramo, la grasa aporta 9. Equivocarse con esos números (digamos, 4/4/4) desplaza los porcentajes en silencio, así que los factores están escritos explícitamente en lugar de enterrados en una constante — para tres números, la legibilidad gana sobre la abstracción.

**🎯 Resultado esperado :** Imprime tres comidas mientras se agregan, luego un total (`770 kcal | P:75g C:60g F:19g`) y un desglose de macros (`P:39.0% C:31.2% F:29.8%`).

**🩹 Si sale mal :** Si los porcentajes de macros no suman 100%, el redondeo está ligeramente apagado — `round(..., 1)` puede producir 99.9 o 100.1 según los valores, lo cual es aceptable. Si `totals()` devuelve todo ceros a pesar de las comidas, `add_meal` nunca se llamó — retrocede a las llamadas `log.add_meal(...)`.

### 3.2 Verifica el registro diario

**✅ Lista de verificación**

- ✅ `log.totals()` devuelve `calories: 770, protein: 75, carbs: 60, fat: 19`.
- ✅ Los porcentajes de `log.macro_split()` suman ~100% y la proteína es la mayor proporción.

**🤔 Pregunta(s) socrática(s)**

- Si comieras solo grasa (0g de proteína, 0g de carbohidratos, 100g de grasa), ¿qué devolvería `macro_split`, y por qué vale la pena pensar en ese caso degenerado antes de que ocurra en datos reales?
- `totals()` recalcula cada vez que se llama. Para un `DailyLog` que recibe 20 comidas a lo largo del día, ¿valdría la pena cachear el resultado — y qué característica de `dataclass` o de Python haría que ese cacheo ocurriera automáticamente?

## Paso 4: Convierte tu historial en pandas

Los días individuales son datos; una *semana* de días es una tendencia. Este paso construye un `DataFrame` de pandas desde una lista de resúmenes diarios — volumen, calorías, peso corporal — y agrega un promedio móvil para suavizar el ruido día a día. Ese promedio móvil es el primer movimiento real de análisis de datos en el proyecto, y convierte una lista ruidosa de números en algo que de verdad puedes leer.

### 4.1 Construye un DataFrame de historial

**👟 Pista inicial :** Construye un `DataFrame` desde una lista de dicts, convierte la columna `date` a objetos datetime, establécela como índice, y calcula una media móvil con `df["volume"].rolling(3, min_periods=1).mean()`.

```python
# fitness_tracker.py (continued)
import pandas as pd

def build_history(rows: list[dict]) -> pd.DataFrame:
    """Turn daily {date, volume, calories, weight_kg} dicts into a sorted DataFrame."""
    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"])
    df = df.set_index("date").sort_index()
    df["volume_roll3"] = df["volume"].rolling(3, min_periods=1).mean()
    return df

history = build_history([
    {"date": "2025-01-06", "volume": 3270.0, "calories": 2550, "weight_kg": 82.0},
    {"date": "2025-01-08", "volume": 3420.0, "calories": 2600, "weight_kg": 81.5},
    {"date": "2025-01-10", "volume": 3560.0, "calories": 2500, "weight_kg": 81.0},
    {"date": "2025-01-12", "volume": 3640.0, "calories": 2480, "weight_kg": 80.8},
    {"date": "2025-01-14", "volume": 3780.0, "calories": 2520, "weight_kg": 80.5},
])
print(history[["volume", "volume_roll3", "weight_kg"]])
```

`rolling(3, min_periods=1)` es la línea importante: toma una ventana deslizante de 3 filas y calcula la media, pero `min_periods=1` deja que la primera y la segunda fila tengan un promedio parcial (tamaño de ventana 1 y 2) en lugar de `NaN` — así que no pierdes el inicio de tu tendencia por datos faltantes. `sort_index()` asegura que las fechas estén en orden cronológico antes de que la ventana deslizante se mueva sobre ellas; sin eso, el promedio móvil refleja el orden arbitrario de entrada, no el tiempo.

**🎯 Resultado esperado :** Imprime un DataFrame de 5 filas con las columnas `volume`, `volume_roll3` (la media móvil de 3 días) y `weight_kg`, ordenado por fecha — `volume_roll3` está cerca de `volume` para la mayoría de las filas pero es más suave.

**🩹 Si sale mal :** Si `volume_roll3` contiene `NaN` en la parte superior, `min_periods` es demasiado alto (el valor por defecto es el tamaño de la ventana, lo que significa que las primeras dos filas reciben `NaN`); confirma que `min_periods=1` está en la llamada. Si el índice no está ordenado por fecha, falta `sort_index()` o se eliminó — la ventana deslizante necesita orden cronológico para ser significativa.

### 4.2 Verifica el historial

**✅ Lista de verificación**

- ✅ `history` tiene exactamente 5 filas, indexadas por fecha, con `volume_roll3` mostrando una tendencia suavizada.
- ✅ `volume_roll3` para la primera fila es igual a `volume` para esa fila (una ventana de 1 no tiene suavizado).

**🤔 Pregunta(s) socrática(s)**

- Si cambiaras `rolling(3)` a `rolling(5)`, ¿qué pasa con el promedio móvil de las primeras cuatro filas, y cuándo sería una ventana más grande mejor vs. peor para un dataset corto como este?
- `set_index("date")` convierte la fecha en el identificador de fila. ¿Qué consulta escribirías en pandas para seleccionar solo los entrenamientos de la segunda mitad de enero — y cómo se compara eso con una cláusula SQL `WHERE` sobre una columna de fecha?

## Paso 5: Grafica el progreso con el tiempo

Un DataFrame es una tabla; un gráfico es una imagen de los mismos datos que hace visibles las tendencias de un vistazo — el peso bajando, el volumen subiendo, y dónde están los puntos de inflexión. Este paso construye una figura de matplotlib de dos paneles: una tendencia de peso a la izquierda y una tendencia de volumen de entrenamiento a la derecha.

### 5.1 Construye el gráfico de dos paneles

**👟 Pista inicial :** Usa `plt.subplots(1, 2, ...)` para crear ejes lado a lado, grafica cada métrica en su propio eje con `marker="o"` para puntos de datos distintos, y guarda la figura como PNG.

```python
# fitness_tracker.py (continued)
import matplotlib.pyplot as plt

def plot_progress(history: pd.DataFrame, filepath: str = "fitness_progress.png") -> None:
    """Plot body weight and training volume trends side by side."""
    fig, axes = plt.subplots(1, 2, figsize=(12, 5))

    axes[0].plot(history.index, history["weight_kg"], marker="o", color="#2ecc71")
    axes[0].set_title("Body Weight Trend")
    axes[0].set_ylabel("kg")
    axes[0].tick_params(axis="x", rotation=45)

    axes[1].plot(history.index, history["volume"], marker="o", color="#3498db", label="Daily")
    axes[1].plot(history.index, history["volume_roll3"], marker="s", color="#e74c3c", linestyle="--", label="3-day avg")
    axes[1].set_title("Training Volume")
    axes[1].set_ylabel("Volume (kg)")
    axes[1].legend()
    axes[1].tick_params(axis="x", rotation=45)

    plt.tight_layout()
    plt.savefig(filepath, dpi=150)
    print(f"Chart saved to {filepath}")
    plt.show()

plot_progress(history)
```

Dos paneles comparten un `figsize=(12, 5)` para que la figura sea lo bastante ancha para dos gráficos sin apretarse. `plt.tight_layout()` evita que las dos etiquetas del eje y se superpongan — sin él, el `ylabel` del gráfico derecho a menudo choca con los ticks del gráfico izquierdo. `marker="o"` y `marker="s"` (cuadrado) con `linestyle="--"` para el promedio móvil te permiten distinguir el valor diario de su versión suavizada incluso en escala de grises, lo que importa cuando alguien imprime el gráfico.

**🎯 Resultado esperado :** Un gráfico guardado en `fitness_progress.png` — el panel izquierdo muestra el peso corporal bajando de forma constante de 82 a 80.5 kg; el panel derecho muestra el volumen de entrenamiento aumentando, con el promedio de 3 días rojo y punteado suavizando la tendencia ascendente.

**🩹 Si sale mal :** Si el gráfico muestra un marco vacío sin líneas de datos, el DataFrame de `history` está vacío o los nombres de columna no coinciden — confirma que `weight_kg` y `volume` existen como nombres de columna. Si las etiquetas del eje x se superponen mal, falta `rotation=45` en `tick_params`. Si la ventana del gráfico se abre pero se cierra de inmediato en un script, agrega `plt.show()` al final (bloquea hasta que cierras la ventana) o guarda sin mostrar.

### 5.2 Verifica la visualización

**✅ Lista de verificación**

- ✅ `fitness_progress.png` existe y muestra dos paneles lado a lado: peso bajando, volumen subiendo.
- ✅ La línea roja punteada (promedio de 3 días) es más suave que la línea azul sólida (volumen diario) — puedes ver el efecto de suavizado directamente.

**🤔 Pregunta(s) socrática(s)**

- El panel de peso tiene una sola línea. Si agregaras un segundo eje (vía `ax.twinx()`) para mostrar calorías en el eje y derecho, ¿cómo interpretarías un día donde el peso sube pero las calorías son bajas — y ese gráfico sería engañoso o útil?
- El gráfico de volumen muestra valores diarios y un promedio de 3 días. Si un coach te pidiera agregar un promedio de *7* días en el mismo gráfico, ¿cómo lo calcularías, y cuál es el costo de superponer demasiadas líneas en un solo gráfico?

## ⚠️ Errores comunes

- **La grasa tiene 9 kcal/g, no 4.** Usar 4 para los tres macros es el bug de nutrición fitness más común: subestima las calorías de la grasa por más de la mitad, lo que en silencio hace que el desglose de macros se vea equilibrado cuando está sesgado. La función `macro_split` usa los factores correctos (4, 4, 9) — nunca los redondees a una constante.
- **Promedio móvil sobre datos desordenados.** `df.rolling(3).mean()` opera sobre el orden de filas, no el orden de tiempo. Si tu DataFrame no está ordenado por fecha, el promedio móvil mezcla valores futuros y pasados, produciendo una línea que se ve plausible pero está mal. Haz siempre `sort_index()` antes de rodar.
- **Orden de campos en el dataclass.** En un `@dataclass`, los campos con valores por defecto deben ir después de los campos sin ellos — `name: str = ""` antes de `sets: int` es un `SyntaxError`. Python impone esto porque la construcción posicional sería ambigua de otro modo.
- **División por cero en `macro_split`.** Un `DailyLog` vacío sin comidas devuelve cero para cada total de macro. `sum(...) or 1` atrapa esto con elegancia; sin él, la división lanza `ZeroDivisionError`, que es técnicamente correcto pero no amigable para el usuario.
- **`plt.show()` bloqueando en scripts.** En un archivo `.py` ejecutado desde una terminal, `plt.show()` abre una ventana y bloquea hasta que la cierras — bien para exploración interactiva, pero detiene el resto de tu script. Guarda la figura con `plt.savefig()` primero para que el archivo exista aunque nunca cierres la ventana.

## Lo que acabas de construir

Una aplicación funcional de registro de fitness: modelas ejercicios y comidas individuales con propiedades derivadas, los agregas en sesiones y registros diarios, calculas volumen de entrenamiento y porcentajes de macros, conviertes un historial de varias semanas en un DataFrame de pandas, y visualizas tendencias de peso y fuerza en un gráfico de dos paneles guardado como PNG. Nada aquí es una simulación — los dataclasses son reutilizables, las operaciones de pandas son las mismas que usarías en una exportación real de cualquier app de seguimiento, y el gráfico es el comienzo de un dashboard de progreso real.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/fitness-tracker/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/fitness-tracker) en el repositorio del curso es una versión ejecutable de notebook: una semana completa de datos sintéticos de entrenamiento y nutrición, cada clase y función de los Pasos 1–5, y el gráfico de dos paneles renderizado en línea. Clónalo, o abre todo el repositorio en un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde ahí.
:::

## A dónde ir desde aquí

- Escribe un **calculador de rachas de entrenamiento**: dada una lista de fechas de sesiones, calcula la racha actual de días consecutivos y la racha más larga de todos los tiempos — un bucle simple que pone a prueba tus instintos de manejo de fechas.
- Agrega una clase **WeeklyGoal** que defina un objetivo de entrenamientos por semana y un presupuesto de calorías, compare los datos reales registrados contra el objetivo, e imprima un resumen aprobado/reprobado — el primer paso de "rastrear" a "rendir cuentas".
- Calcula y grafica un **1RM (máximo de una repetición)** usando la fórmula de Epley — `weight × (1 + reps / 30)` — para cada ejercicio a lo largo del tiempo para seguir el progreso de fuerza independientemente del volumen.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a hacer que los datos trabajen para tus propios objetivos. 🎓