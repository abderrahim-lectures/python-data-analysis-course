---
title: "Motor de Puntuación de Leads"
description: "Puntúa y prioriza leads de ventas según participación, demografía y señales de comportamiento."
---

# 🎯 Construye un Motor de Puntuación de Leads

Los equipos de ventas se ahogan en leads. Un motor de puntuación de leads los clasifica según la probabilidad de que cada uno convierta, para que el equipo llame primero a los calientes. Este proyecto construye un modelo de puntuación que combina señales de participación, demográficas y de comportamiento, luego prioriza el pipeline y hace pruebas A/B de diferentes esquemas de puntuación.

Esto asume Python 101 y comodidad con pandas de Análisis de Datos. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa.

## 🎯 Lo que harás

1. Configurar un proyecto con `uv` e instalar las dependencias de análisis.
2. Construir un modelo de puntuación de leads multifactor a partir de datos de participación y demografía.
3. Priorizar el pipeline de ventas por nivel de puntuación.
4. Hacer una prueba A/B de dos modelos de puntuación y comparar los resultados de conversión.
5. Resumir la salud del pipeline con analíticas de pandas.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/lead-scoring/notebook.es.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/lead-scoring/notebook.es.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Flead-scoring%2Fnotebook.es.ipynb)

## Configuración

Todo lo que necesitas antes de construir: un entorno de Python y pandas.

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
uv init lead-scoring
cd lead-scoring
uv add pandas numpy click
```

`pandas` impulsa el análisis. `numpy` proporciona las matemáticas. `click` construye el CLI.

### Crea la estructura del proyecto

```bash
mkdir -p scoring
touch scoring/__init__.py scoring/leads.py scoring/model.py scoring/abtest.py scoring/analytics.py scoring/cli.py
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `lead-scoring/` existe con un `pyproject.toml` y todas las dependencias instaladas.
- ✅ El directorio `scoring/` tiene todos los archivos de módulo requeridos.

## Paso 1: Crea los datos de muestra de leads

Necesitas un conjunto de datos de leads realista para puntuar. Construye una función que genere leads con campos de participación, demografía y comportamiento.

### 1.1 Genera el conjunto de datos

**👟 Pista inicial :** Crea `scoring/leads.py`.

```python
# scoring/leads.py
import random, pandas as pd

random.seed(42)

def generate_leads(n=1000) -> pd.DataFrame:
    rows = []
    for i in range(n):
        visited = random.randint(0, 40)
        opened = random.randint(0, 15)
        downloaded = random.randint(0, 5)
        company_size = random.choice(["small", "mid", "enterprise"])
        source = random.choice(["organic", "ads", "referral"])
        rows.append({
            "lead_id": i,
            "visits": visited,
            "emails_opened": opened,
            "assets_downloaded": downloaded,
            "company_size": company_size,
            "source": source,
            "converted": random.random() < 0.3,
        })
    return pd.DataFrame(rows)
```

**🎯 Resultado esperado :** `generate_leads()` devuelve un DataFrame de 1000 filas con columnas de participación y demografía.

**🩹 Si sale mal :** Si los nombres de las columnas no coinciden con el código posterior, corrígelos aquí primero.

### 1.2 Verifica los datos de leads

**✅ Lista de verificación**

- ✅ `generate_leads()` devuelve un DataFrame con todas las columnas esperadas.
- ✅ Los valores están dentro de los rangos previstos.
- ✅ Existe una columna booleana `converted`.

**🤔 Pregunta(s) socrática(s)**

- ¿Qué señal del mundo real falta en este conjunto de datos que un CRM sí tendría (por ejemplo, tiempo hasta el contacto, presupuesto)?

## Paso 2: Construye el modelo de puntuación

La puntuación combina señales ponderadas. La participación (visitas, aperturas, descargas) normalmente predice la conversión mejor, así que recibe el mayor peso.

### 2.1 Define el modelo

**👟 Pista inicial :** Crea `scoring/model.py`.

```python
# scoring/model.py
import pandas as pd


def score_lead(row) -> float:
    engagement = row["visits"] * 1.0 + row["emails_opened"] * 2.0 + row["assets_downloaded"] * 5.0
    if row["company_size"] == "enterprise":
        engagement += 20
    elif row["company_size"] == "mid":
        engagement += 10
    if row["source"] == "referral":
        engagement += 15
    elif row["source"] == "organic":
        engagement += 5
    return engagement


def apply_score(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["score"] = df.apply(score_lead, axis=1)
    df["tier"] = pd.cut(df["score"],
                        bins=[-1, 20, 45, float("inf")],
                        labels=["cold", "warm", "hot"])
    return df
```

**🎯 Resultado esperado :** `apply_score(df)` añade las columnas `score` y `tier`, donde las descargas y la fuente de referencia (referral) aumentan más la puntuación.

**🩹 Si sale mal :** Si ningún lead es "hot", el umbral en `pd.cut` puede estar demasiado alto para los datos.

### 2.2 Verifica el modelo

**✅ Lista de verificación**

- ✅ Se añade una columna `score`.
- ✅ Una columna `tier` clasifica cada lead en `cold`, `warm` o `hot`.
- ✅ Cada lead recibe una puntuación numérica.

**🤔 Pregunta(s) socrática(s)**

- Los pesos están elegidos a mano. ¿Qué podría salir mal si un peso es incorrecto, y cómo lo descubrirías?

## Paso 3: Prioriza el pipeline

Ventas debería atacar primero los leads calientes. Ordena el pipeline por nivel y puntuación, y mide la tasa de conversión por nivel.

### 3.1 Ordena y mide la conversión

**👟 Pista inicial :** Añade un auxiliar de priorización.

```python
# scoring/model.py (continued)
def prioritize(df: pd.DataFrame) -> pd.DataFrame:
    tier_order = {"hot": 0, "warm": 1, "cold": 2}
    return (df.assign(tier_rank=df["tier"].map(tier_order))
              .sort_values(["tier_rank", "score"], ascending=[True, False])
              .drop(columns="tier_rank"))


def conversion_by_tier(df: pd.DataFrame) -> pd.DataFrame:
    return (df.groupby("tier", observed=True)["converted"]
              .agg(["count", "mean"])
              .rename(columns={"count": "leads", "mean": "conversion_rate"})
              .round(3))
```

**🎯 Resultado esperado :** `prioritize(df)` ordena primero los leads calientes; `conversion_by_tier` muestra que los leads calientes convierten a una tasa más alta.

**🩹 Si sale mal :** Si las tasas de conversión son planas entre los niveles, los pesos de la puntuación no discriminan, apriétalos.

### 3.2 Verifica la priorización

**✅ Lista de verificación**

- ✅ `prioritize` ordena por nivel y luego por puntuación descendente.
- ✅ `conversion_by_tier` reporta los recuentos de leads y las tasas de conversión.
- ✅ El nivel caliente tiene una tasa de conversión más alta que el frío (para datos bien separados).

**🤔 Pregunta(s) socrática(s)**

- ¿Cómo usarías la tasa de conversión por nivel para decidir cuántos leads entregar al equipo de ventas cada día?

## Paso 4: Prueba A/B de dos modelos de puntuación

En lugar de confiar en pesos elegidos a mano, compara dos modelos sobre los mismos datos y mira cuál separa mejor a los que convierten de los que no convierten.

### 4.1 Implementa la prueba A/B

**👟 Pista inicial :** Crea `scoring/abtest.py`.

```python
# scoring/abtest.py
import pandas as pd
from numpy import mean


def model_a(row):
    return row["visits"] + 2 * row["emails_opened"] + 5 * row["assets_downloaded"]


def model_b(row):
    return row["visits"] ** 1.5 + row["emails_opened"] * 3 + row["assets_downloaded"] * 8


def compare_models(df: pd.DataFrame) -> pd.DataFrame:
    results = {}
    for name, fn in [("model_a", model_a), ("model_b", model_b)]:
        df2 = df.copy()
        df2["score"] = df2.apply(fn, axis=1)
        df2["tier"] = pd.cut(df2["score"], bins=[-1, 20, 45, float("inf")], labels=["cold", "warm", "hot"])
        top = df2.sort_values("score", ascending=False).head(300)
        results[name] = {
            "top300_conversion": mean(top["converted"]),
            "hot_count": (df2["tier"] == "hot").sum(),
        }
    return pd.DataFrame(results).T
```

**🎯 Resultado esperado :** `compare_models(df)` reporta qué modelo produce una conversión más alta en sus 300 mejores leads.

**🩹 Si sale mal :** Si los dos modelos empatan, la diferenciación entre ellos es demasiado débil para importar.

### 4.2 Verifica la prueba A/B

**✅ Lista de verificación**

- ✅ Ambos modelos se puntúan y se comparan sus 300 mejores leads.
- ✅ La salida incluye la tasa de conversión y el recuento de calientes.
- ✅ El mejor modelo en conversión es identificable.

**🤔 Pregunta(s) socrática(s)**

- ¿Por qué comparar sobre los *300 mejores leads* en lugar del conjunto completo? ¿Qué estamos decidiendo implícitamente sobre cómo funciona la venta?

## Paso 5: Resume la salud del pipeline

Un cuadro de mando de métricas agregadas le dice al equipo si el pipeline está sano en general.

### 5.1 Construye el resumen de analíticas

**👟 Pista inicial :** Crea `scoring/analytics.py`.

```python
# scoring/analytics.py
import pandas as pd


def summarize(df: pd.DataFrame) -> pd.DataFrame:
    summary = {
        "leads": len(df),
        "hot_leads": (df["tier"] == "hot").sum(),
        "warm_leads": (df["tier"] == "warm").sum(),
        "cold_leads": (df["tier"] == "cold").sum(),
        "avg_score": round(df["score"].mean(), 2),
        "overall_conversion": round(df["converted"].mean(), 3),
    }
    return pd.DataFrame([summary])


def by_source(df: pd.DataFrame) -> pd.DataFrame:
    return (df.groupby("source")["converted"]
              .agg(["count", "mean"])
              .rename(columns={"count": "leads", "mean": "conversion_rate"})
              .round(3))
```

**🎯 Resultado esperado :** `summarize(df)` devuelve una fila de salud del pipeline; `by_source` muestra qué fuente de adquisición convierte mejor.

**🩹 Si sale mal :** Si la conversión general está muy por encima o por debajo de lo esperado, la asignación aleatoria de `converted` puede necesitar un umbral diferente.

### 5.2 Verifica el resumen

**✅ Lista de verificación**

- ✅ `summarize` devuelve los recuentos de leads por nivel, la puntuación promedio y la conversión general.
- ✅ `by_source` reporta la conversión por canal de adquisición.

**🤔 Pregunta(s) socrática(s)**

- Si "referral" convierte al 40% pero "ads" al 15%, ¿qué cambio harías en el presupuesto de marketing?

## ⚠️ Errores comunes

- **Pesos elegidos a mano sobreajustados.** Los pesos que se ven correctos en un conjunto de datos pueden ser incorrectos en el siguiente. Hacer pruebas A/B de los pesos contra datos reales de conversión te protege de esto.
- **NaN de `pd.cut`.** Si una puntuación excede el borde del contenedor más alto, el nivel se convierte en `NaN`. Usa `float("inf")` como borde final.
- **Copiar antes de añadir columnas.** `df.apply` dentro de la función de puntuación puede disparar `SettingWithCopyWarning`. Llama a `.copy()` primero, como se muestra en `apply_score`.
- **Ignorar el coste de perseguir conversiones.** Un nivel "hot" que convierte al 30% aún desperdicia el 70% de las llamadas. Combina la puntuación con el valor esperado, no solo con la probabilidad.
- **Los datos de demostración no son producción.** Los leads generados aleatoriamente no reflejarán el comportamiento real de conversión. Valida tu modelo con leads históricos reales antes de confiar en él.

## Lo que acabas de construir

Un motor de puntuación de leads: un conjunto de datos de leads generado, un modelo de puntuación ponderado multifactor que clasifica los leads en niveles cold/warm/hot, ordenación priorizada del pipeline, una comparación A/B de dos esquemas de puntuación y un resumen de salud del pipeline basado en pandas. Este es el núcleo analítico de un equipo de operaciones de ventas, decidir a quién llamar, en qué orden y si el modelo actual está funcionando.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/lead-scoring/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/lead-scoring) en el repositorio del curso tiene una versión más rica con puntuación basada en ML, enrutamiento automático de leads y el CLI conectado de principio a fin. Clónalo, o abre el repositorio completo en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde allí.
:::

## A dónde ir desde aquí

- Entrena un clasificador real (regresión logística) sobre leads convertidos vs no convertidos y compara su ranking con tu modelo construido a mano.
- Añade enriquecimiento de leads desde una fuente de datos externa para alimentar nuevas señales a la puntuación.
- Construye una regla de enrutamiento que autoasigne los leads calientes al representante de mayor rendimiento.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientas orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado, y su README tiene una guía completa y apta para principiantes sobre cómo añadir el tuyo mediante una **pull request**, incluso si nunca has usado git: hacer un fork del repositorio, crear una rama, hacer commit de tus archivos y abrir la PR, paso a paso. No se asume ninguna experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓