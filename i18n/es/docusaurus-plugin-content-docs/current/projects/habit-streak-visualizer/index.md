---
id: habit-streak-visualizer
title: "Construye un Visualizador de Rachas de Hábitos"
sidebar_label: "Visualizador de Rachas de Hábitos"
slug: /projects/habit-streak-visualizer
description: "Rastrea check-ins diarios de hábitos localmente y renderiza un mapa de calor de calendario estilo grafo de contribuciones de GitHub, con pandas y matplotlib — sin ML, sin clave de API."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Construye un Visualizador de Rachas de Hábitos

<ProjectPublishedDate projectId="2027-habit-streak-visualizer" />

<ProjectGreeting />

Este proyecto asume que te sientes cómodo con Python 101 — variables, funciones, leer y escribir archivos, bucles básicos. Algo de pandas y matplotlib de Análisis de Datos (`DataFrame`s, `.groupby()`, graficar un gráfico simple) hará que algunos pasos se sientan familiares, pero nada aquí necesita más que eso: no hay machine learning, ninguna API externa, y ningún dataset que descargar. Traes tus propios datos, un día a la vez.

Esto es opcional y no calificado. Consulta [Proyectos del mundo real](/docs/projects) para la lista completa y creciente.

## 🎯 Lo que harás

1. Diseñar un formato simple de registro de check-ins (un CSV: fecha, hábito, hecho) y escribir un CLI para añadir a él.
2. Calcular la racha actual y la racha más larga de un hábito a partir de ese registro.
3. Distribuir un rango de días en una cuadrícula estilo grafo de contribuciones de GitHub: siete filas de día de la semana por las columnas de semana que el rango necesite.
4. Renderizar esa cuadrícula como un mapa de calor de matplotlib, coloreado por cuánto tiempo se estaba construyendo una racha en cada día, usando varios meses de datos de muestra con apariencia real para que la imagen realmente se vea interesante.

## Dónde ejecutar esto

Tres formas razonables de hacer este proyecto — elige la que se ajuste a tu configuración:

- **Localmente con `uv` (recomendado).** Este proyecto tiene cero dependencias externas más allá de `pandas` y `matplotlib`, sin clave de API, sin GPU — tan libre de fricción como puede llegar a ser "un proyecto Python real en tu propia máquina". Los Pasos 1–4 de abajo asumen este camino, y tu registro de check-ins vive como un archivo CSV simple al que sigues añadiendo con el tiempo.
- **GitHub Codespaces.** Abre [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) para obtener un entorno de desarrollo en la nube con Node, Python, y `uv` ya instalados (mira [`.devcontainer/devcontainer.json`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/.devcontainer/devcontainer.json)) — exactamente los mismos comandos de abajo funcionan desde una pestaña del navegador, sin instalación local en absoluto.
- **Google Colab, Kaggle Notebooks, o Binder.** Un ajuste genuinamente bueno: nada aquí necesita GPU ni clave de API, y todo el pipeline (cargar un registro, calcular rachas, construir una cuadrícula, renderizar un mapa de calor) cabe cómodamente en unas pocas celdas de notebook contra los datos de muestra incluidos del curso.

  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/habit-streak-visualizer/notebook.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/habit-streak-visualizer/notebook.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fhabit-streak-visualizer%2Fnotebook.ipynb)

  Sé honesto contigo mismo sobre la compensación, sin embargo: un notebook es una forma de menor fidelidad de experimentar este proyecto que un proyecto `uv` local real con su propio `checkins.csv` al que añades día tras día — trátalo como una forma rápida de explorar el código, no el camino principal.

## Configuración

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

Luego configura el proyecto:

```bash
uv init habit-streak-visualizer
cd habit-streak-visualizer
uv add pandas matplotlib
```

No se necesita ninguna clave de API en ningún lugar de este proyecto — todo corre sobre datos que viven completamente en tu propia máquina.

## Paso 1: Diseña el registro de check-ins y un CLI para escribirlo

El registro es un CSV simple con tres columnas: `date`, `habit`, `done`. Una fila por check-in. Un archivo plano como este — en lugar de, digamos, un archivo separado por hábito — significa que varios hábitos pueden compartir un registro y aún así filtrarse independientemente con indexado booleano ordinario de pandas más adelante.

```python
# log.py
import csv
from pathlib import Path

COLUMNS = ["date", "habit", "done"]

def ensure_log(path: Path) -> None:
    if not path.exists():
        with path.open("w", newline="") as f:
            csv.writer(f).writerow(COLUMNS)

def append_checkin(path: Path, date: str, habit: str, done: bool) -> None:
    ensure_log(path)
    with path.open("a", newline="") as f:
        csv.writer(f).writerow([date, habit, "y" if done else "n"])
```

Un pequeño CLI envuelve esto con la interacción "¿lo hiciste hoy? y/n":

```python
# checkin.py
import argparse
import datetime as dt
from pathlib import Path
from log import append_checkin

LOG_PATH = Path(__file__).parent / "checkins.csv"

parser = argparse.ArgumentParser()
parser.add_argument("habit")
parser.add_argument("--date", default=None)
parser.add_argument("--done", choices=["y", "n"], default=None)
args = parser.parse_args()

date = args.date or dt.date.today().isoformat()
answer = args.done or input(f"Did you do '{args.habit}' on {date}? (y/n): ").strip().lower()
append_checkin(LOG_PATH, date, args.habit, answer.startswith("y"))
print(f"Logged: {date} — {args.habit} — {'done' if answer.startswith('y') else 'missed'}")
```

```bash
uv run python checkin.py "Exercise"
```

Ejecuta eso un puñado de veces con `--date`/`--done` para diferentes días para acumular un poco de historial con el cual probar, antes de continuar.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>Ejecutar `checkin.py` dos veces para el mismo hábito y fecha, una vez "y" y una vez "n", deja el registro con ambas filas — necesitarás decidir (siguiente paso) cuál gana.</StepChecklistItem>
<StepChecklistItem>Abrir `checkins.csv` en un editor de texto muestra exactamente tres columnas, una fila por check-in, legible por humanos.</StepChecklistItem>
<StepChecklistItem>Puedes registrar un check-in para una fecha pasada con `--date` y `--done`, sin el prompt interactivo.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

Si registras el mismo hábito dos veces para la misma fecha (una vez por error, una vez para corregirlo), ¿debería el registro mantener ambas filas, sobrescribir la primera, o algo más? ¿Qué le haría cada elección a un `.groupby("date")` posterior en este archivo?

## Paso 2: Calcula rachas

Una racha es una serie de *días calendario consecutivos* registrados como hechos, sin brecha. La decisión de diseño importante: un día que nunca se registró en absoluto se trata exactamente igual que un día explícitamente registrado como "n" — ambos rompen la racha. Eso es más simple que añadir un tercer estado "desconocido", al costo de castigar el olvido de registrar de la misma forma que realmente saltarse el hábito.

Leer un registro disperso (solo los días que alguien se molestó en registrar) tiene que convertirse en una serie *densa* día a día antes de que las rachas tengan sentido — de lo contrario, una brecha en el registro se ve idéntica a una ruptura genuina, pero no puedes saber en qué día ocurrió sin un calendario completo contra el cual comparar:

```python
import pandas as pd

df = pd.read_csv("checkins.csv", parse_dates=["date"])
df["done"] = df["done"].astype(str).str.lower().isin(["y", "yes", "true", "1"])
df = df.drop_duplicates(subset=["date", "habit"], keep="last")  # last logged answer wins

habit_df = df[df["habit"] == "Exercise"].set_index("date")["done"]
daily = habit_df.reindex(pd.date_range(df["date"].min(), df["date"].max(), freq="D"), fill_value=False)
```

`reindex` está haciendo el trabajo real aquí: toma una `Series` con solo las fechas realmente presentes y la expande sobre *cada* fecha en el rango, rellenando cualquier cosa faltante con `False`. Ahora las rachas son un simple escaneo secuencial:

```python
def compute_streaks(daily: pd.Series) -> dict:
    longest = 0
    current_run = 0
    for i, done in enumerate(daily):
        current_run = current_run + 1 if done else 0
        longest = max(longest, current_run)
        if i == len(daily) - 1:
            streak_ending_at_last_day = current_run
    return {
        "current_streak": streak_ending_at_last_day,
        "longest_streak": longest,
        "total_done": int(daily.sum()),
        "total_days": len(daily),
    }
```

`current_streak` es la serie que termina en el *último* día de la serie (hoy, si tu registro está actualizado) — se resetea a 0 en el momento en que revisas el día después de una falla. `longest_streak` es la mejor serie en cualquier parte de todo el historial, que obviamente puede ser mucho más grande, y nunca se encoge.

:::tip[`current_streak` necesita un registro actualizado para significar algo]
Si aún no has registrado hoy, el último día de `daily` es `False` por defecto (del relleno de `reindex`), así que `current_streak` reporta 0 incluso si ayer extendió una racha real. O registra cada día antes de revisar tu racha, o calcula `current_streak` contra ayer en lugar de "la última fila en la serie" si quieres que tolere que hoy aún no esté registrado.
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`daily.index` contiene cada día calendario entre tu primera y última entrada de registro, sin brechas — `len(daily)` coincide exactamente con ese conteo de días.</StepChecklistItem>
<StepChecklistItem>Contar manualmente una serie conocida de días "y" consecutivos en tu registro de prueba coincide con lo que `compute_streaks` reporta para `longest_streak`.</StepChecklistItem>
<StepChecklistItem>Registrar un "n" (o saltarse un día) resetea `current_streak` a 0 la próxima vez que lo calculas.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

¿Por qué necesita `daily = habit_df.reindex(...)` suceder *antes* del bucle de conteo de rachas, en lugar de simplemente iterar sobre las filas de `df` directamente? ¿Qué específicamente saldría mal con `longest_streak` si te lo saltaras?

## Paso 3: Distribuye los días en una cuadrícula estilo GitHub

Este es el verdadero momento educativo del proyecto. Un grafo de contribuciones de GitHub es una cuadrícula: siete filas (una por día de la semana) por las columnas que un año necesite (aproximadamente 52-53), leídas de arriba a abajo y luego de izquierda a derecha. Convertir una lista simple de fechas en ese diseño 2D toma dos piezas de aritmética de fechas:

**La fila** es solo el día de la semana: `date.weekday()` devuelve 0 para lunes hasta 6 para domingo, directamente usable como índice de fila.

**La columna** es la parte complicada. El atajo tentador es `date.isocalendar()[1]`, el número de semana ISO — pero los números de semana ISO se resetean a 1 cada enero. Un registro de hábito que abarca un límite de año (digamos, diciembre a enero) tendría fechas de finales de diciembre y principios de enero cayendo en los *mismos números de semana bajos*, revolviendo la cuadrícula en columnas superpuestas en lugar de una línea de tiempo limpia de izquierda a derecha. La solución: elige una fecha de anclaje fija — el lunes en o antes del primer día registrado — y calcula cada columna como un desplazamiento de días simple desde ese ancla:

```python
import numpy as np

def build_grid(daily: pd.Series):
    dates = daily.index
    anchor = dates[0] - pd.Timedelta(days=dates[0].weekday())  # Monday on/before the first day
    weeks = (dates - anchor).days // 7
    rows = dates.weekday

    num_weeks = int(weeks.max()) + 1
    grid = np.full((7, num_weeks), np.nan)
    for row, week, done in zip(rows, weeks, daily):
        grid[row, week] = 1.0 if done else 0.0

    return grid, dates
```

`(dates - anchor).days // 7` solo aumenta — no le importa si el registro abarca uno o cinco años. Las celdas que caen fuera del rango de registro real (porque el primer día registrado no es necesariamente un lunes, o el último no es necesariamente un domingo) se dejan como `NaN`, para que puedan dibujarse de forma diferente a un día genuinamente "perdido" en el siguiente paso.

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>`grid.shape[0]` es exactamente 7 (una fila por día de la semana), sin importar cuán largo sea el rango de fechas.</StepChecklistItem>
<StepChecklistItem>Alimentar a `build_grid` un rango de fechas que cruza un 1 de enero *no* produce dos grupos de columnas con números de semana bajos — las columnas aumentan de forma constante a través del límite.</StepChecklistItem>
<StepChecklistItem>Las primeras y últimas pocas celdas en la cuadrícula (antes del primer día registrado, después del último) son `NaN`, no `0`.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

El propio grafo de contribuciones de GitHub comienza las semanas en domingo, no lunes. ¿Qué necesitarías cambiar en `build_grid` para coincidir con esa convención — y cambiaría en qué *columna* cae una fecha dada, en qué *fila*, o ambas?

## Paso 4: Renderízalo como un mapa de calor

La intensidad del color no debería ser solo binaria (hecho/no hecho) — un día que es el número 15 en una fila de una racha debería leerse como visualmente diferente del primer día de una nueva racha, aunque ambos sean "hecho." Calcula la intensidad como una función de la longitud de la racha *actual* en cada día, limitada para que no siga oscureciéndose para siempre:

```python
def streak_intensity(daily: pd.Series, cap: int = 10) -> list[float]:
    values, run = [], 0
    for done in daily:
        run = run + 1 if done else 0
        values.append(min(run, cap) / cap if done else 0.0)
    return values
```

Alimenta eso a `build_grid` en lugar del relleno simple de 0/1, luego renderiza con matplotlib — una rampa secuencial de un solo matiz (azul claro a oscuro), no un arcoíris, ya que esto es una magnitud continua, no varias categorías:

```python
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap, ListedColormap

sequential_blue = LinearSegmentedColormap.from_list(
    "habit_blue", ["#eaf2fc", "#9ec5f4", "#3987e5", "#0d366b"]
)

fig, ax = plt.subplots(figsize=(max(6, grid.shape[1] * 0.32), 2.4))
display = np.where(np.isnan(grid), 0.0, grid)
ax.imshow(display, cmap=sequential_blue, vmin=0, vmax=1, aspect="equal")

no_data = np.ma.masked_where(~np.isnan(grid), np.ones_like(grid))
ax.imshow(no_data, cmap=ListedColormap(["#e8e8ea"]), aspect="equal")

ax.set_yticks(range(7))
ax.set_yticklabels(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])
fig.savefig("habit_heatmap.png", bbox_inches="tight")
```

La versión completa — con etiquetas de mes a lo largo del eje x y líneas de cuadrícula entre celdas — vive en [`examples/habit-streak-visualizer/heatmap.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/habit-streak-visualizer/heatmap.py). Ejecútala contra los datos de muestra incluidos (varios meses, dos hábitos, rachas reales y una caída real) para ver la imagen completa inmediatamente, sin registrar nada a mano primero:

```bash
uv run python visualize.py --habit "Exercise"
```

:::tip[El gris de "sin datos" no es lo mismo que el azul de "0 intensidad"]
Dibujar celdas no registradas en el paso más pálido de la misma rampa azul que una falla genuina reclamaría visualmente "este hábito existía y te lo saltaste" para días antes de que siquiera hubieras empezado a rastrearlo. Pintarlas de un gris neutro plano, en capas encima con una llamada `imshow` separada y un array enmascarado, mantiene "sin datos" honestamente distinto de "datos, y la respuesta fue no."
:::

**✅ Lista de verificación**

<StepChecklist>
<StepChecklistItem>El mapa de calor renderizado se oscurece visiblemente a través de una racha real de varios días en tus datos, en lugar de que cada celda "hecha" se vea idéntica.</StepChecklistItem>
<StepChecklistItem>Las celdas fuera de tu rango de fechas registrado se renderizan como gris plano, distinguibles a simple vista de un día "perdido" azul pálido.</StepChecklistItem>
<StepChecklistItem>Ejecutar el visualizador contra los datos de muestra incluidos produce una cuadrícula reconociblemente con forma de contribuciones de GitHub: siete filas, muchas columnas, un eje de tiempo claro de izquierda a derecha.</StepChecklistItem>
</StepChecklist>

**🤔 Pregunta(s) socrática(s)**

Si rastrearas dos hábitos y quisieras compararlos uno al lado del otro, ¿preferirías ver dos mapas de calor separados apilados verticalmente, o un mapa de calor donde cada celda codifica *ambos* hábitos de alguna forma? ¿Qué perderías de cualquier forma?

## ⚠️ Errores comunes

- **Errores de desfase por uno en día de la semana/fecha.** `date.weekday()` está indexado desde 0 empezando el lunes; `date.isoweekday()` está indexado desde 1 empezando el lunes; `date.strftime("%w")` está indexado desde 0 empezando el *domingo*. Confundir estos es la forma más fácil de terminar con una cuadrícula sutilmente desplazada por una fila.
- **Problemas de zona horaria de `datetime.now()`.** Si tu CLI calcula "hoy" con `datetime.now()` en lugar de `date.today()`, un check-in registrado tarde en la noche puede caer en el día calendario equivocado dependiendo de la zona horaria de la máquina, especialmente si alguna vez ejecutas el script desde una zona horaria diferente (o un notebook en la nube, que muy probablemente es UTC). Quédate con objetos `date` simples para cualquier cosa que se supone que represente un día calendario en lugar de un momento en el tiempo.
- **Errores de límite de año en el diseño de la cuadrícula**, cubiertos en el Paso 3 — usar el número de semana de `isocalendar()` directamente como una columna de cuadrícula en lugar de un desplazamiento de día de anclaje fijo. Prueba esto explícitamente con un rango de fechas que cruce un 1 de enero, ya que es fácil escribir código que se vea correcto contra un solo año de datos de muestra y solo se rompe una vez que el rango abarca dos.
- **Olvidar `drop_duplicates(..., keep="last")`** al cargar el registro — si un hábito/fecha se registra dos veces (una corrección genuina, o una ejecución doble accidental del CLI), dejar ambas filas significa que un `.groupby()` o reindex posterior puede elegir silenciosamente cualquiera que haya llegado primero, no la respuesta final pretendida.

## Lo que acabas de construir

Una pequeña herramienta local con dos piezas reales y separables: una capa de persistencia de datos (CSV de solo añadir, deduplicado al cargar) y una visualización de cuadrícula de calendario desde cero, del tipo que normalmente está oculto detrás de una llamada a librería. Construir el diseño de la cuadrícula tú mismo — en lugar de importar un paquete de "mapa de calor de GitHub" ya hecho — es lo que hace que la aritmética de fechas del Paso 3 realmente se quede: la diferencia entre un número de semana ISO y un desplazamiento de día de anclaje fijo es un bug real con el que te encontrarías en cualquier proyecto que distribuya datos de series temporales en un calendario, no solo este.

:::tip[Este mismo formato de registro escala a más que un mapa de calor]
Nada sobre `checkins.csv` es específico de mapa de calor — es solo un registro de eventos con fecha. El mismo archivo podría alimentar un gráfico de barras de tasa de finalización semanal, un resumen mensual con `.groupby(df["date"].dt.month)`, o una cuenta regresiva simple de "cuántos días hasta que supere mi racha más larga". El mapa de calor es una vista sobre datos que son útiles en bastantes otras formas también.
:::

## A dónde ir desde aquí

- **Múltiples hábitos lado a lado.** Extiende `visualize.py` para renderizar un mapa de calor por hábito, apilados en una sola figura con `plt.subplots(nrows=...)`, para que puedas comparar la consistencia entre hábitos de un vistazo.
- **Una versión ASCII solo de terminal.** Salta matplotlib por completo e imprime la cuadrícula como bloques Unicode coloreados (`░▒▓█` o colores de fondo ANSI) directamente a la terminal — exactamente la misma lógica de diseño de cuadrícula del Paso 3, solo un renderizador diferente, y una buena forma de revisar tu racha sin abrir una imagen.
- **Exportar como una imagen compartible.** `fig.savefig(..., dpi=300)` para un PNG nítido, o conecta un pequeño script que regenere el mapa de calor automáticamente después de cada ejecución de `checkin.py`, para que siempre haya una imagen actualizada lista para compartir.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos, y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓

<ProjectProgressCheckbox projectId="2027-habit-streak-visualizer" />
