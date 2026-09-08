---
title: "Gestor de Redes Sociales"
description: "Programa publicaciones en plataformas con analíticas, sugerencias de hashtags y calendario de contenido."
difficulty: "intermediate"
estimatedMinutes: 60
tags: ["pandas", "data-viz", "productivity"]
learningObjectives:
  - "Carga y explora datos de engagement con pandas"
  - "Clasifica el mejor momento de publicación por plataforma a partir de distribuciones reales"
  - "Construye un motor de sugerencias de hashtags puntuables"
  - "Genera un calendario de contenido semanal a partir de los momentos ganadores"
  - "Produce un informe de analíticas compartible con matplotlib"
prerequisites:
  - "Conceptos básicos de Python (funciones, bucles, diccionarios)"
  - "Agrupar y agregar con pandas"
  - "Instalar paquetes con uv"
---

# 🛠️ 📱 Construye un Gestor de Redes Sociales

Publicar cuando tu audiencia está realmente despierta, con hashtags que la gente genuinamente busca, es la mayor parte del marketing social. Este proyecto construye un pequeño gestor que estudia datos de engagement pasados con pandas, aprende el mejor momento de publicación para cada plataforma, sugiere hashtags por tema a través de un pequeño motor de puntuación, planifica una semana de publicaciones en un calendario de contenido y cierra con un informe de analíticas de matplotlib que podrías rotar directamente en la rutina de una marca real.

Esto asume Python 101 y comodidad con el `groupby` de pandas — nada de Análisis de Datos más allá de eso se requiere. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa y creciente.

## 🎯 Lo que harás

1. Generar un dataset de engagement realista y cargarlo con pandas.
2. Agregar engagements por plataforma y hora para encontrar la mejor ventana de publicación de cada plataforma.
3. Construir un motor de sugerencias de hashtags que puntúa hashtags contra un tema.
4. Generar un calendario de contenido de 7 días a partir de la clasificación de mejor momento.
5. Dibujar un gráfico de informe de analíticas semanal del rendimiento de las plataformas.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal. `pandas` y `matplotlib` se instalan limpiamente, el backend no interactivo `Agg` de matplotlib (usado en el Paso 5) renderiza gráficos incluso en una máquina sin pantalla, y los archivos CSV y el PNG del informe genuinamente aterrizan en tu carpeta de proyecto.

**Google Colab, Kaggle Notebooks y Binder** son formas razonables de *probar* la construcción completa — pandas y matplotlib ambos corren ahí de fábrica. La advertencia honesta es que el sistema de archivos efímero de un notebook no conserva tu `posts.csv` ni tu informe guardado entre sesiones, así que trátalos como caminos de prueba y cambia a `uv` local cuando quieras que el calendario y los artefactos del informe persistan.

[![Abrir en Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/social-media-manager/notebook.ipynb)
[![Abrir en Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/social-media-manager/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fsocial-media-manager%2Fnotebook.ipynb)

## Configuración

Crea el proyecto e instala las dos librerías sobre las que está construido todo el gestor.

```bash
uv init social-media-manager
cd social-media-manager
uv add pandas matplotlib
```

```bash
uv run python -c "import pandas, matplotlib; print('ok')"
```

`pandas` es la capa de datos — cargar, agrupar y clasificar engagements — y `matplotlib` es la capa de dibujo para el informe final. Instalar ambas de antemano significa que cada paso de abajo trata sobre las ideas de *marketing* en lugar de la pelea de dependencias.

**✅ Lista de verificación**

- ✅ `uv add pandas matplotlib` terminó y `uv run python -c "import pandas, matplotlib"` imprime `ok`.
- ✅ Un proyecto fresco `social-media-manager/` existe con un `pyproject.toml`.

## Paso 1: Construye el dataset de engagement

Cada decisión de contenido en este proyecto — mejor momento, mejores hashtags, mejor plataforma — es un cálculo sobre engagements pasados. Este paso construye una tabla de engagement realista y reproducible para que los pasos posteriores tengan algo real que clasificar.

### 1.1 Genera un dataset reproducible

**👟 Pista inicial:** Usa `random.seed` para que cada ejecución produzca el *mismo* dataset, luego construye un DataFrame de pandas con una fila por publicación pasada y guárdalo a CSV.

```python
# smm.py
import random
import pandas as pd

PLATFORMS = ["Instagram", "X", "LinkedIn", "TikTok"]
DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
TOPICS = ["python", "data", "career", "product"]

def build_dataset(rows: int = 120, seed: int = 7) -> pd.DataFrame:
    random.seed(seed)
    df = pd.DataFrame({
        "platform": [random.choice(PLATFORMS) for _ in range(rows)],
        "topic": [random.choice(TOPICS) for _ in range(rows)],
        "day": [random.choice(DAYS) for _ in range(rows)],
        "hour": [random.randint(7, 23) for _ in range(rows)],
        "engagements": [random.randint(4, 240) for _ in range(rows)],
    })
    return df

df = build_dataset()
df.to_csv("posts.csv", index=False)

print(df.head(3).to_string(index=False))
print(df.groupby("platform")["engagements"].mean().round(1))
```

`random.seed(seed)` es lo que hace este dataset *reproducible*: la misma semilla produce la misma hora y engagement "aleatorios" para cada ejecución, así que la clasificación de mejor momento que obtienes en el Paso 2 es la clasificación de la salida esperada en lugar de una respuesta nueva cada vez. Fijar el `seed` dentro de la función — no en la parte superior del módulo — mantiene la tabla estable incluso si llamas a `build_dataset` más de una vez. `index=False` en `to_csv` mantiene una columna de índice descarriada fuera del archivo para que recargar produzca un DataFrame limpio.

**🎯 Resultado esperado:** Columnas `platform`, `topic`, `day`, `hour`, `engagements` en la vista previa, luego una fila de engagements medios por plataforma — p. ej. `Instagram` en algún punto entre 100 y 140.

**🩹 Si sale mal:** Si las columnas difieren, comprueba que las claves del diccionario en el constructor del DataFrame deletrean cada columna. Si una segunda ejecución produce números diferentes, `random.seed` falta o se está llamando con una semilla *diferente* a la de la firma. Si `to_csv` escribe una columna `Unnamed: 0` al recargar, `index=False` falta.

### 1.2 Verifica el dataset

**✅ Lista de verificación**

- ✅ `smm.py` corre e imprime una vista previa de 3 filas más una tabla de media por plataforma.
- ✅ Un archivo `posts.csv` existe con 120 filas y las cinco columnas.
- ✅ Ejecutar el script dos veces imprime números idénticos (datos reproducibles).

**🤔 Pregunta(s) socrática(s)**

- Si cambiaras `random.seed(7)` a `random.seed(8)`, el *archivo* cambia — ¿por qué importa eso para una clasificación del Paso 2 que quieres comparar con tus amigos, y qué te dice sobre cuándo una semilla es una característica en lugar de un accidente?
- El dataset no tiene columna `date`, solo `day` y `hour`. ¿Qué pregunta a nivel de día de semana puedes responder, y qué pregunta a nivel de día de semana se vuelve imposible?

## Paso 2: Encuentra el mejor momento de publicación por plataforma

Un calendario de contenido solo es tan bueno como los momentos que programa. Este paso convierte la tabla de engagement en el único número que los marketers realmente quieren: el engagement promedio por publicar en cada hora en cada plataforma.

### 2.1 Agrupa, promedia y clasifica

**👟 Pista inicial:** Haz `groupby(["platform", "hour"])` de los engagements, toma la media e inspecciona las horas top — esa es toda la clasificación, sin bucle requerido.

```python
# smm.py (continuación)
def best_times(df: pd.DataFrame, top_n: int = 3) -> pd.DataFrame:
    hourly = (
        df.groupby(["platform", "hour"])["engagements"]
        .mean()
        .round(1)
    )
    ranking = (
        hourly.reset_index()
        .sort_values(["platform", "engagements"], ascending=[True, False])
        .groupby("platform", sort=False)
        .head(top_n)
        .reset_index(drop=True)
    )
    return ranking

ranking = best_times(df)
print(ranking.to_string(index=False))
```

Lee la cadena de abajo hacia arriba: `groupby(["platform", "hour"])` crea un grupo por par plataforma-hora, `["engagements"].mean()` colapsa cada grupo a su promedio, `.round(1)` mantiene el informe ordenado, y `sort_values(["platform", "engagements"], ascending=[True, False])` ordena primero por plataforma y luego por engagement *descendente* para que la mejor hora de cada plataforma flote al tope de su bloque. El `.groupby("platform", sort=False).head(top_n)` final conserva solo las top `top_n` filas *dentro* de cada plataforma — ese es el "top 3 de horas por plataforma" que le entregarás al calendario.

**🎯 Resultado esperado:** Una tabla con `platform`, `hour`, `engagements`, donde cada plataforma aparece exactamente 3 veces y sus propias 3 filas están ordenadas de alta a baja.

**🩹 Si sale mal:** Si obtienes un solo bloque de 3 filas en lugar de cuatro, el paso `sort_values` interno falta así que `head(3)` agarró los primeros grupos en lugar de los mejores. Si los promedios por hora se ven idénticos entre plataformas, agrupaste solo en una columna. Si el orden de las filas se ve desordenado, la lista de `sort_values` de dos columnas está en el orden equivocado.

### 2.2 Verifica la clasificación

**✅ Lista de verificación**

- ✅ `ranking` tiene exactamente `top_n` filas por plataforma, ordenadas de alta a baja dentro de cada una.
- ✅ La hora top de al menos una plataforma es una hora de noche avanzada (18–23), una ventana clásica de alto engagement en los datos sembrados.
- ✅ Puedes apuntar a las dos líneas que hacen la agrupación y la clasificación.

**🤔 Pregunta(s) socrática(s)**

- La clasificación promedia engagements crudos por hora, así que una plataforma con tres publicaciones afortunadas en una hora se ve "mejor" ahí. ¿Qué cambiaría de la recomendación si usaras la *mediana* en lugar de la *media*?
- Una tabla de día-hora tiene 7 × 17 celdas. ¿Qué nueva estadística añadirías si una marca solo publicara por la mañana — y cómo distinguirías entre "la mañana es su mejor momento" y "nunca publicaron por la tarde"?

## Paso 3: Construye el motor de sugerencias de hashtags

Los hashtags son el índice de búsqueda de la mayoría de las plataformas: los correctos hacen aparecer una publicación ante personas que ya estaban buscando. Este paso construye un motor de puntuación diminuto que mapea un tema a hashtags clasificados, la misma forma que devuelve una API real de sugerencias.

### 3.1 Puntúa y clasifica hashtags

**👟 Pista inicial:** Almacena cada hashtag con un puntaje de relevancia en un diccionario de temas, ordena por puntaje y trunca a `n` — el "motor" es solo datos más `sorted`.

```python
# smm.py (continuación)
HASHTAG_POOL = {
    "python": [("#Python", 95), ("#100DaysOfCode", 88), ("#CodeNewbie", 81),
               ("#DataScience", 79), ("#PythonTips", 70)],
    "data":   [("#DataScience", 97), ("#Analytics", 90), ("#DataViz", 84),
               ("#BigData", 80), ("#DataStorytelling", 72)],
    "career": [("#CareerGrowth", 91), ("#TechCareers", 85), ("#JobSearchTips", 78)],
    "product":[("#ProductManagement", 92), ("#BuildInPublic", 84), ("#PM", 77)],
}

def suggest_hashtags(topic: str, n: int = 4) -> list[str]:
    pool = HASHTAG_POOL.get(topic.lower(), [("#ContentTips", 60)])
    pool = sorted(pool, key=lambda item: item[1], reverse=True)
    return [tag for tag, _score in pool[:n]]

print(suggest_hashtags("python"))
print(suggest_hashtags("analytics"))
```

Todo el "motor" es un `sorted` sobre tuplas puntuadas y un corte. Modelar cada hashtag como `("#Tag", 95)` en lugar de solo un string convierte la clasificación en una pregunta de datos en lugar de una elección codificada a mano — `reverse=True` pone el puntaje más alto primero, y `pool[:n]` trunca al tamaño de lote solicitado. El valor por defecto `.get(topic.lower(), ...)` significa que un tema desconocido se degrada a un respaldo genérico en lugar de crashear el calendario que construirás en el Paso 4.

**🎯 Resultado esperado:** `['#Python', '#100DaysOfCode', '#CodeNewbie', '#DataScience']` para `"python"`, y los hashtags del pool `data` para `"analytics"` gracias a `.lower()`.

**🩹 Si sale mal:** Si el orden se ve arbitrario, falta la clave de puntuación `key=lambda item: item[1]` así que `sorted` compara tuplas completas. Si `"analytics"` devuelve el respaldo genérico, las claves del diccionario — `data`, no `analytics` — no coinciden; el valor por defecto `.get` lo esconde silenciosamente. Si vuelve la longitud equivocada, el corte `[:n]` usa un `n` diferente del que pediste.

### 3.2 Verifica el motor de hashtags

**✅ Lista de verificación**

- ✅ `suggest_hashtags("python")` devuelve 4 hashtags, de mayor puntaje primero.
- ✅ Un tema desconocido devuelve el respaldo `#ContentTips` en lugar de lanzar `KeyError`.
- ✅ Puedes explicar por qué los hashtags, y su orden, son *datos* en lugar de lógica.

**🤔 Pregunta(s) socrática(s)**

- Los puntajes (95, 88, …) están escritos a mano. ¿De qué calcularía un gestor real *para* que la clasificación se actualice automáticamente a medida que un hashtag se vuelve obsoleto?
- `sorted` aquí es estable para puntajes iguales. ¿Cuándo necesitarían dos hashtags con el mismo puntaje un desempate, y cuál sería?

## Paso 4: Genera un calendario de contenido real

Un calendario es donde las decisiones se convierten en un horario. Este paso fusiona la clasificación de mejor momento del Paso 2 con el motor de hashtags del Paso 3 para planificar siete publicaciones concretas — día, plataforma, hora, tema y hashtags — listas para pegar en cualquier programador.

### 4.1 Planifica la semana a partir de la clasificación

**👟 Pista inicial:** Recorre los siete días, elige la plataforma del día a partir del único mejor resultado y un tema rotatorio, y reutiliza las dos funciones que ya escribiste en lugar de duplicar su lógica.

```python
# smm.py (continuación)
def build_calendar(ranking: pd.DataFrame, topics: list[str], days: int = 7) -> list[dict]:
    best_time = (
        ranking.groupby("platform", sort=False)
        .head(1)
        .set_index("platform")["hour"]
        .to_dict()
    )
    calendar = []
    for day_offset in range(days):
        day = DAYS[day_offset % 7]
        platform = list(best_time.keys())[day_offset % len(best_time)]
        topic = topics[day_offset % len(topics)]
        calendar.append({
            "day": day,
            "platform": platform,
            "hour": best_time[platform],
            "topic": topic,
            "hashtags": ", ".join(suggest_hashtags(topic)),
        })
    return calendar

for post in build_calendar(ranking, TOPICS):
    print(f"{post['day']:>3} {post['platform']:<10} {post['hour']:>2}:00  "
          f"{post['topic']:<10} {post['hashtags']}")
```

`best_time` colapsa la clasificación al único momento ganador por plataforma vía `.groupby(...).head(1)` y lo convierte en un dict `{platform: hour}` con `set_index` + `to_dict` — ese dict es la pequeña tabla de consulta que consulta el bucle. Rotar a través de las plataformas con el módulo (`% len(best_time)`) y a través de los temas de la misma manera significa que un plan de 7 días se extiende por las cuatro plataformas y los cuatro temas sin que se apilen repeticiones. Reutilizar `suggest_hashtags` aquí es el pago del Paso 3: los hashtags del calendario *vienen de* el motor de puntuación, así que mejorar los puntajes mejora cada publicación programada.

**🎯 Resultado esperado:** Siete filas imprimibles, una por día, cada una con un nombre de día, plataforma, hora ganadora, tema y cuatro hashtags unidos por comas, sin dos filas consecutivas que compartan una plataforma.

**🩹 Si sale mal:** Si aparece un `KeyError` en `best_time[platform]`, una plataforma en el bucle no está en el dict — comprueba que `ranking` realmente contiene las cuatro plataformas del Paso 2. Si cada fila tiene la misma plataforma, la rotación de módulo está usando `len(best_time)` pero indexando con el valor equivocado. Si los hashtags se imprimen como una lista Python, `", ".join(...)` falta.

### 4.2 Verifica el calendario

**✅ Lista de verificación**

- ✅ El calendario tiene exactamente 7 filas con día, plataforma, hora, tema, hashtags.
- ✅ Cada hora programada coincide con la mejor hora de una plataforma de la clasificación del Paso 2.
- ✅ Ninguna plataforma aparece dos veces en días consecutivos.

**🤔 Pregunta(s) socrática(s)**

- El calendario rota las plataformas uniformemente, ignorando que algunas plataformas superaron a otras. ¿Cómo sesgarías la rotación hacia las plataformas de alto rendimiento sin abandonar por completo a las débiles?
- Programar exactamente una publicación por día es arbitrario. ¿Qué datos — de la clasificación del Paso 2 — justificarían publicar *dos veces* en algunas plataformas y *cero* en otras?

## Paso 5: Construye el informe de analíticas semanal

El último artefacto es el que realmente compartirías: un informe visual de qué plataforma entregó, generado como un PNG que puedes adjuntar a una invitación de reunión. Este paso dibuja el gráfico titular e imprime una tabla de resumen junto a él.

### 5.1 Dibuja el gráfico de rendimiento de plataformas

**👟 Pista inicial:** Configura matplotlib al backend sin pantalla `Agg`, calcula los totales de engagement por plataforma y guarda el gráfico de barras a un archivo — luego imprime los mismos números como texto para que el informe funcione incluso cuando nadie pueda ver el PNG.

```python
# smm.py (continuación)
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

def weekly_report(df: pd.DataFrame, out: str = "weekly_report.png") -> None:
    totals = df.groupby("platform")["engagements"].sum().sort_values(ascending=False)

    fig, ax = plt.subplots(figsize=(8, 5))
    ax.bar(totals.index, totals.values, color="#4C86C6")
    ax.set_title("Engagements per platform (last week)")
    ax.set_ylabel("Total engagements")
    ax.tick_params(axis="x", rotation=20)
    fig.tight_layout()
    fig.savefig(out, dpi=100)
    plt.close(fig)

    print("Total engagements per platform:")
    print(totals.to_string())

weekly_report(df)
```

`matplotlib.use("Agg")` debe correr *antes* de que `pyplot` se importe — intercambia la ventana interactiva por un backend sin pantalla, que es lo que permite que este gráfico se renderice en un servidor, dentro de un notebook, o en una máquina sin pantalla en absoluto. `fig.savefig(out, dpi=100)` es la línea de dinero: escribe un PNG real, y el `plt.close(fig)` después libera la figura para que un bucle que llame a `weekly_report` repetidamente no acumule memoria. Imprimir los mismos totales como tabla mantiene el informe útil para cualquiera que lea la salida de terminal en lugar de la imagen.

**🎯 Resultado esperado:** Un archivo `weekly_report.png` aparece en la carpeta del proyecto (visible en tu explorador de archivos), y la terminal imprime los cuatro totales de plataformas en orden descendente.

**🩹 Si sale mal:** Si un traceback de error de backend menciona `Agg`, `matplotlib.use("Agg")` viene *después* de la línea `import matplotlib.pyplot` — muévelo arriba. Si no aparece un PNG, comprueba la ruta de `savefig`: guarda relativo al directorio de trabajo actual. Si el gráfico está por lo demás en blanco, `plt.close(fig)` corrió antes de que `savefig` terminara — intercambia el orden.

### 5.2 Verifica de punta a punta

**✅ Lista de verificación**

- ✅ `weekly_report.py` corre limpiamente y escribe `weekly_report.png` a disco.
- ✅ Los totales impresos coinciden con las alturas visuales de las barras.
- ✅ Todo el pipeline — dataset → clasificación → hashtags → calendario → informe — corre desde un solo `smm.py` sin ediciones de copiar-y-pegar entre pasos.

**🤔 Pregunta(s) socrática(s)**

- El informe suma engagements crudos, así que una plataforma con una publicación viral se ve dominante. ¿Qué métrica graficarías en su lugar para mostrar el rendimiento *sostenido* en lugar de un solo día afortunado?
- `savefig` escribió en el directorio desde el que ejecutaste el script. ¿Cómo harías la ruta del informe explícita y portable si tu carpeta de proyecto viviera bajo `content/`?

## ⚠️ Errores comunes

- **Olvidar la semilla, así que cada ejecución re-clasifica de forma diferente.** Los números de engagement son aleatorios; sin `random.seed(seed)` al tope de `build_dataset`, la "mejor hora" del Paso 2 cambia entre ejecuciones y los amigos no pueden comparar resultados. Arreglo: mantén la semilla como un parámetro con un valor por defecto fijo.
- **Confirmar victorias con sumas crudas en lugar de promedios.** Sumar engagements recompensa a las plataformas que simplemente publicaron más. El informe solo es honesto cuando usa el engagement *medio* (el Paso 2 y la tabla del Paso 5) junto a los totales.
- **No manejar temas desconocidos.** Un tema mal escrito en el calendario crasea el motor con `KeyError`. El respaldo `.get(topic, [("#ContentTips", 60)])` convierte ese crash en un valor por defecto sensato.
- **Un calendario codificado a mano en lugar de uno generado.** Escribir lunes–domingo a mano ignora tanto la clasificación del Paso 2 como los puntajes de hashtags del Paso 3. Arreglo: mantén el calendario como una función de los datos para que mejorar los datos mejore el horario.
- **Graficar mientras estás conectado a una pantalla.** Los backends interactivos de matplotlib se rompen en máquinas sin pantalla (CI, algunos notebooks). Configura `matplotlib.use("Agg")` *antes* de `import pyplot`, como en el Paso 5.

## Lo que acabas de construir

Un gestor de redes sociales funcional: aprende la mejor ventana de publicación de cada plataforma a partir de distribuciones de engagement reales, sugiere hashtags puntuados por tema, planifica una semana completa de publicaciones y renderiza un gráfico de analíticas compartible — una versión completa del bucle de investigar-luego-publicar que un equipo social ejecuta manualmente. La habilidad transferible es *dejar que los datos tomen las decisiones de programación*: cualquier pregunta de "cuándo deberíamos hacer esto" en tu futuro, desde envíos de email hasta sesiones de estudio, es el mismo patrón de groupby-y-clasifica que usaste aquí.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/social-media-manager/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/social-media-manager) en el repositorio del curso es una versión más completa del código de arriba, con el motor de hashtags y el calendario ya conectados en un solo CLI. Clónalo, o abre todo el repositorio en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde ahí.
:::

## A dónde ir desde aquí

- Aliméntalo con datos reales: exporta el historial de publicaciones de tu propia plataforma, déjalo caer en `posts.csv` y observa cómo la clasificación de mejor momento se recalcula a partir de engagements reales en lugar de sembrados.
- Añade un factor de día-de-la-semana agrupando en `(day, hour)` juntos, para que una ventana de lunes 9:00 que funciona para un slot de martes 20:00 ya no se haga pasar por la misma.
- Persiste el calendario con una columna `datetime` adecuada (día de la semana + hora + fecha) y escríbelo a CSV para que se importe directamente en Buffer, Hootsuite o el programador de Meta.
- Puntúa hashtags a partir del rendimiento real — cruzando los hashtags de cada publicación contra su engagement — en lugar de los puntajes escritos a mano del Paso 3.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo, amigable para principiantes, para agregar el tuyo vía un **pull request**, incluso si nunca usaste git antes: hacer fork del repo, crear una rama, commitear tus archivos y abrir el PR, paso a paso. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓