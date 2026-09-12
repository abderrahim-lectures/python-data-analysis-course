---
title: 'Dashboard de Sentimientos'
description: 'Construye un dashboard interactivo que analice sentimientos en tiempo real y visualice tendencias emocionales en textos.'
difficulty: intermediate
estimatedMinutes: 120
learningObjectives:
  - Entender los fundamentos del análisis de sentimientos
  - Implementar un pipeline de procesamiento de texto
  - Crear visualizaciones interactivas con Plotly
  - Construir un dashboard web con Streamlit o Flask
  - Integrar modelos de análisis de sentimientos
prerequisites:
  - Python a nivel intermedio
  - Conocimientos básicos de NLP
  - familiaridad con pandas y visualización
  - Terminal yeditor de código
---

- **Ejecútalo en el navegador.** Hay un cuaderno interactivo listo, ábrelo en Colab, Kaggle o Binder y sigue los pasos en orden.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/sentiment-dashboard/notebook.es.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/sentiment-dashboard/notebook.es.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fsentiment-dashboard%2Fnotebook.es.ipynb)

## 🎯 Lo que harás

Vas a construir un dashboard interactivo que analice sentimientos en textos y visualice tendencias emocionales en tiempo real. El sistema procesará texto, clasificará sentimientos y mostrará estadísticas en un dashboard web.

**Objetivo principal:** Crear un dashboard completo que tome texto, analice sentimientos y muestre visualizaciones interactivas.

**Tu dashboard podrá:**

- **Analizar sentimientos** en textos individuales
- **Procesar lotes** de textos y calcular estadísticas
- **Visualizar tendencias** con gráficos interactivos
- **Filtrar datos** por categoría, fecha o sentimiento
- **Exportar resultados** en múltiples formatos

Pasos:

- Paso 1: Configura el entorno del proyecto
- Paso 2: Implementa el analizador de sentimientos
- Paso 3: Crea el pipeline de procesamiento
- Paso 4: Construye el dashboard interactivo
- Paso 5: Agrega filtrado y exportación

Dónde ejecutar esto:

Trabaja desde la carpeta `projects/` de tu repo `pyda-course`.

## Configuración

1. Crea un entorno virtual:

```bash
cd projects/sentiment-dashboard
uv venv
source .venv/bin/activate
```

2. Instala las dependencias:

```bash
uv pip install streamlit plotly pandas textblob wordcloud
```

3. Verifica la instalación:

```bash
python -c "import streamlit, plotly, textblob; print('Dependencias listas')"
```

---

## Paso 1: Configura el entorno del proyecto

Establece la estructura base del proyecto y los parámetros de configuración.

### 1.1 Crea la estructura de directorios

```bash
mkdir -p data static templates
```

### 1.2 Crea el archivo de configuración

Crea `config.py`:

```python
from pathlib import Path

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
STATIC_DIR = BASE_DIR / "static"
TEMPLATES_DIR = BASE_DIR / "templates"

# Configuración del análisis de sentimientos
SENTIMENT_THRESHOLDS = {
    "positive": 0.1,
    "negative": -0.1,
}

# Categorías de sentimiento
SENTIMENT_CATEGORIES = {
    "positive": {"color": "#2ecc71", "emoji": "😊"},
    "neutral": {"color": "#f39c12", "emoji": "😐"},
    "negative": {"color": "#e74c3c", "emoji": "😞"},
}

# Configuración del dashboard
DASHBOARD_TITLE = "📊 Análisis de Sentimientos"
MAX_TEXT_LENGTH = 5000
DEFAULT_SAMPLE_SIZE = 100

# Configuración de visualización
COLORS = {
    "primary": "#3498db",
    "secondary": "#2ecc71",
    "accent": "#e74c3c",
    "background": "#ecf0f1",
}
```

### 1.3 Crea datos de ejemplo

```python
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_sample_data(n_samples: int = 100) -> pd.DataFrame:
    """Genera datos de ejemplo para el dashboard."""
    np.random.seed(42)

    texts = [
        "Excelente producto, muy recomendado. La calidad es increíble.",
        "El servicio al cliente fue terrible. Nunca más compraré aquí.",
        "El producto está bien, pero el precio es un poco alto.",
        "¡Me encanta este producto! Superó mis expectativas.",
        "No estoy satisfecho con la compra. El producto llegó dañado.",
        "Buena relación calidad-precio. Funciona como esperaba.",
        "El envío fue muy lento. Tardó casi dos semanas.",
        "Producto promedio, nada especial pero cumple su función.",
        "¡Fantástico! El mejor que he comprado en años.",
        "Mala experiencia. El producto no coincide con la descripción.",
    ]

    categories = ["Producto", "Servicio", "Envío", "Calidad", "Precio"]
    sources = ["Twitter", "Facebook", "Email", "Review", "Chat"]

    data = []
    for i in range(n_samples):
        text = np.random.choice(texts)
        sentiment_score = np.random.uniform(-1, 1)

        if sentiment_score > 0.1:
            sentiment = "positive"
        elif sentiment_score < -0.1:
            sentiment = "negative"
        else:
            sentiment = "neutral"

        data.append({
            "id": i + 1,
            "text": text,
            "sentiment_score": sentiment_score,
            "sentiment": sentiment,
            "category": np.random.choice(categories),
            "source": np.random.choice(sources),
            "timestamp": datetime.now() - timedelta(days=np.random.randint(0, 30)),
        })

    return pd.DataFrame(data)

if __name__ == "__main__":
    df = generate_sample_data()
    df.to_csv(DATA_DIR / "sample_sentiments.csv", index=False)
    print(f"Generados {len(df)} registros de ejemplo")
```

### Verifica

- La estructura del proyecto está configurada
- Los datos de ejemplo se generan correctamente
- Los parámetros son consistentes

### Checklist

- [ ] Estructura de directorios creada
- [ ] Configuración del dashboard definida
- [ ] Datos de ejemplo generados
- [ ] Parámetros de sentimiento configurados

---

## Paso 2: Implementa el analizador de sentimientos

El analizador es el corazón del sistema. Necesita procesar texto y retornar puntuaciones de sentimiento.

### 2.1 Crea el analizador base

Crea `analysis/sentiment.py`:

```python
from textblob import TextBlob
from config import SENTIMENT_THRESHOLDS

class SentimentAnalyzer:
    def __init__(self):
        self.thresholds = SENTIMENT_THRESHOLDS

    def analyze(self, text: str) -> dict:
        """Analiza el sentimiento de un texto."""
        blob = TextBlob(text)

        # Obtener polaridad (-1 a 1) y subjetividad (0 a 1)
        polarity = blob.sentiment.polarity
        subjectivity = blob.sentiment.subjectivity

        # Clasificar sentimiento
        if polarity > self.thresholds["positive"]:
            category = "positive"
        elif polarity < self.thresholds["negative"]:
            category = "negative"
        else:
            category = "neutral"

        return {
            "text": text,
            "polarity": polarity,
            "subjectivity": subjectivity,
            "sentiment": category,
        }

    def analyze_batch(self, texts: list[str]) -> list[dict]:
        """Analiza un lote de textos."""
        return [self.analyze(text) for text in texts]

    def get_statistics(self, results: list[dict]) -> dict:
        """Calcula estadísticas de los resultados."""
        if not results:
            return {}

        polarities = [r["polarity"] for r in results]
        sentiments = [r["sentiment"] for r in results]

        return {
            "total": len(results),
            "average_polarity": sum(polarities) / len(polarities),
            "sentiment_distribution": {
                "positive": sentiments.count("positive"),
                "neutral": sentiments.count("neutral"),
                "negative": sentiments.count("negative"),
            },
            "polarity_range": {
                "min": min(polarities),
                "max": max(polarities),
            },
        }
```

### 2.2 Agrega análisis avanzado

```python
from collections import Counter
import re

class AdvancedSentimentAnalyzer(SentimentAnalyzer):
    def __init__(self):
        super().__init__()
        self.word_frequencies = Counter()

    def extract_keywords(self, text: str) -> list[str]:
        """Extrae palabras clave del texto."""
        # Limpiar texto
        text_clean = re.sub(r"[^\w\s]", "", text.lower())
        words = text_clean.split()

        # Eliminar stopwords básicas
        stopwords = {"el", "la", "los", "las", "un", "una", "de", "del", "en", "y", "a", "que"}
        keywords = [w for w in words if w not in stopwords and len(w) > 3]

        return keywords

    def analyze_with_keywords(self, text: str) -> dict:
        """Analiza sentimiento y extrae palabras clave."""
        result = self.analyze(text)
        keywords = self.extract_keywords(text)

        # Actualizar frecuencias
        self.word_frequencies.update(keywords)

        result["keywords"] = keywords
        return result

    def get_top_keywords(self, n: int = 10) -> list[tuple[str, int]]:
        """Retorna las palabras clave más frecuentes."""
        return self.word_frequencies.most_common(n)

    def analyze_by_category(self, data: list[dict]) -> dict:
        """Analiza sentimiento agrupado por categoría."""
        category_sentiments = {}

        for item in data:
            category = item.get("category", "unknown")
            sentiment = item.get("sentiment", "neutral")

            if category not in category_sentiments:
                category_sentiments[category] = []

            category_sentiments[category].append(sentiment)

        # Calcular distribución por categoría
        result = {}
        for category, sentiments in category_sentiments.items():
            result[category] = {
                "total": len(sentiments),
                "distribution": {
                    "positive": sentiments.count("positive"),
                    "neutral": sentiments.count("neutral"),
                    "negative": sentiments.count("negative"),
                },
            }

        return result

    def get_trend(self, data: list[dict], date_field: str = "timestamp") -> list[dict]:
        """Analiza tendencia de sentimiento en el tiempo."""
        df = pd.DataFrame(data)
        df[date_field] = pd.to_datetime(df[date_field])

        # Agrupar por día
        daily = df.groupby(df[date_field].dt.date).agg({
            "sentiment_score": "mean",
            "id": "count"
        }).reset_index()

        return daily.to_dict("records")
```

### Verifica

- El analizador retorna polaridad y categorías correctas
- Las estadísticas se calculan correctamente
- El análisis por categoría funciona

### Checklist

- [ ] `SentimentAnalyzer` analiza textos individuales
- [ ] `analyze_batch` procesa múltiples textos
- [ ] `get_statistics` calcula métricas agregadas
- [ ] `AdvancedSentimentAnalyzer` agrega keywords y tendencias

---

## Paso 3: Crea el pipeline de procesamiento

El pipeline conecta la entrada de datos con el análisis y visualización.

### 3.1 Implementa el pipeline

Crea `pipeline/processor.py`:

```python
import pandas as pd
from datetime import datetime
from analysis.sentiment import AdvancedSentimentAnalyzer
from config import DATA_DIR

class SentimentPipeline:
    def __init__(self):
        self.analyzer = AdvancedSentimentAnalyzer()
        self.results = []

    def process_text(self, text: str, metadata: dict = None) -> dict:
        """Procesa un solo texto."""
        result = self.analyzer.analyze_with_keywords(text)

        if metadata:
            result.update(metadata)

        result["processed_at"] = datetime.now().isoformat()
        self.results.append(result)

        return result

    def process_dataframe(self, df: pd.DataFrame, text_column: str = "text") -> pd.DataFrame:
        """Procesa un DataFrame completo."""
        results = []

        for _, row in df.iterrows():
            text = row[text_column]
            metadata = {k: v for k, v in row.items() if k != text_column}
            result = self.process_text(text, metadata)
            results.append(result)

        return pd.DataFrame(results)

    def get_summary(self) -> dict:
        """Retorna un resumen del procesamiento."""
        if not self.results:
            return {}

        return self.analyzer.get_statistics(self.results)

    def get_category_analysis(self) -> dict:
        """Retorna análisis por categoría."""
        return self.analyzer.analyze_by_category(self.results)

    def get_trend_analysis(self) -> list[dict]:
        """Retorna análisis de tendencia temporal."""
        return self.analyzer.get_trend(self.results)

    def export_results(self, format: str = "csv") -> str:
        """Exporta los resultados."""
        df = pd.DataFrame(self.results)

        if format == "csv":
            path = DATA_DIR / f"sentiment_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            df.to_csv(path, index=False)
        elif format == "json":
            path = DATA_DIR / f"sentiment_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            df.to_json(path, orient="records", force_ascii=False)
        else:
            raise ValueError(f"Formato no soportado: {format}")

        return str(path)
```

### 3.2 Prueba el pipeline

```python
if __name__ == "__main__":
    from data.generator import generate_sample_data

    # Generar datos
    df = generate_sample_data(50)

    # Procesar
    pipeline = SentimentPipeline()
    results = pipeline.process_dataframe(df)

    # Resumen
    summary = pipeline.get_summary()
    print("Resumen del procesamiento:")
    print(f"  Total: {summary['total']}")
    print(f"  Polaridad promedio: {summary['average_polarity']:.3f}")
    print(f"  Distribución: {summary['sentiment_distribution']}")

    # Análisis por categoría
    category_analysis = pipeline.get_category_analysis()
    print("\nAnálisis por categoría:")
    for category, stats in category_analysis.items():
        print(f"  {category}: {stats['total']} textos")
```

### Verifica

- El pipeline procesa textos individuales y DataFrames
- El resumen muestra estadísticas correctas
- Los resultados se exportan correctamente

### Checklist

- [ ] `SentimentPipeline` procesa textos y DataFrames
- [ ] `get_summary` retorna estadísticas completas
- [ ] `get_category_analysis` agrupa por categoría
- [ ] `export_results` guarda en CSV y JSON

---

## Paso 4: Construye el dashboard interactivo

Ahora crearemos la interfaz web del dashboard con Streamlit.

### 4.1 Implementa el dashboard principal

Crea `app.py`:

```python
import streamlit as st
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
from pipeline.processor import SentimentPipeline
from data.generator import generate_sample_data
from config import DASHBOARD_TITLE, SENTIMENT_CATEGORIES

# Configurar página
st.set_page_config(
    page_title=DASHBOARD_TITLE,
    page_icon="📊",
    layout="wide",
)

st.title(DASHBOARD_TITLE)
st.markdown("---")

# Inicializar pipeline
@st.cache_data
def load_data():
    """Carga datos de ejemplo."""
    return generate_sample_data(200)

df = load_data()
pipeline = SentimentPipeline()
results = pipeline.process_dataframe(df)

# Sidebar con filtros
st.sidebar.header("Filtros")

# Filtro de categoría
categories = ["Todas"] + list(df["category"].unique())
selected_category = st.sidebar.selectbox("Categoría", categories)

# Filtro de sentimiento
sentiments = ["Todos", "positive", "neutral", "negative"]
selected_sentiment = st.sidebar.selectbox("Sentimiento", sentiments)

# Filtro de fuente
sources = ["Todas"] + list(df["source"].unique())
selected_source = st.sidebar.selectbox("Fuente", sources)

# Aplicar filtros
filtered_df = results.copy()
if selected_category != "Todas":
    filtered_df = filtered_df[filtered_df["category"] == selected_category]
if selected_sentiment != "Todos":
    filtered_df = filtered_df[filtered_df["sentiment"] == selected_sentiment]
if selected_source != "Todas":
    filtered_df = filtered_df[filtered_df["source"] == selected_source]

# Métricas principales
col1, col2, col3, col4 = st.columns(4)

with col1:
    st.metric(
        "Total de Textos",
        len(filtered_df),
        delta=f"{len(filtered_df) - len(results)} vs total",
    )

with col2:
    avg_polarity = filtered_df["polarity"].mean()
    st.metric(
        "Polaridad Promedio",
        f"{avg_polarity:.3f}",
        delta="positivo" if avg_polarity > 0 else "negativo",
    )

with col3:
    positive_pct = (filtered_df["sentiment"] == "positive").mean() * 100
    st.metric(
        "Sentimiento Positivo",
        f"{positive_pct:.1f}%",
    )

with col4:
    negative_pct = (filtered_df["sentiment"] == "negative").mean() * 100
    st.metric(
        "Sentimiento Negativo",
        f"{negative_pct:.1f}%",
    )

st.markdown("---")

# Gráficos
col_left, col_right = st.columns(2)

with col_left:
    # Distribución de sentimientos
    sentiment_counts = filtered_df["sentiment"].value_counts()
    colors = [SENTIMENT_CATEGORIES[s]["color"] for s in sentiment_counts.index]

    fig_pie = px.pie(
        values=sentiment_counts.values,
        names=sentiment_counts.index,
        title="Distribución de Sentimientos",
        color_discrete_sequence=colors,
    )
    st.plotly_chart(fig_pie, use_container_width=True)

with col_right:
    # Histograma de polaridad
    fig_hist = px.histogram(
        filtered_df,
        x="polarity",
        nbins=30,
        title="Distribución de Polaridad",
        color="sentiment",
        color_discrete_map=SENTIMENT_CATEGORIES,
    )
    st.plotly_chart(fig_hist, use_container_width=True)

# Gráfico de tendencia temporal
st.subheader("Tendencia Temporal")
if "timestamp" in filtered_df.columns:
    filtered_df["date"] = pd.to_datetime(filtered_df["timestamp"]).dt.date
    daily_sentiment = filtered_df.groupby("date")["polarity"].mean().reset_index()

    fig_trend = px.line(
        daily_sentiment,
        x="date",
        y="polarity",
        title="Tendencia de Sentimiento en el Tiempo",
        markers=True,
    )
    fig_trend.add_hline(y=0, line_dash="dash", line_color="gray")
    st.plotly_chart(fig_trend, use_container_width=True)

# Análisis por categoría
st.subheader("Análisis por Categoría")
category_analysis = pipeline.get_category_analysis()

fig_category = go.Figure()
for category, stats in category_analysis.items():
    fig_category.add_trace(go.Bar(
        name=category,
        x=list(stats["distribution"].keys()),
        y=list(stats["distribution"].values()),
    ))

fig_category.update_layout(
    title="Distribución de Sentimientos por Categoría",
    barmode="group",
)
st.plotly_chart(fig_category, use_container_width=True)

# Tabla de datos
st.subheader("Datos Detallados")
st.dataframe(
    filtered_df[["text", "sentiment", "polarity", "category", "source"]].head(20),
    use_container_width=True,
)

# Palabras clave
st.subheader("Palabras Clave Más Frecuentes")
top_keywords = pipeline.analyzer.get_top_keywords(15)
if top_keywords:
    keywords_df = pd.DataFrame(top_keywords, columns=["Palabra", "Frecuencia"])
    fig_keywords = px.bar(
        keywords_df,
        x="Frecuencia",
        y="Palabra",
        orientation="h",
        title="Top 15 Palabras Clave",
    )
    st.plotly_chart(fig_keywords, use_container_width=True)

# Exportar resultados
st.sidebar.markdown("---")
st.sidebar.subheader("Exportar")
if st.sidebar.button("Exportar CSV"):
    path = pipeline.export_results("csv")
    st.sidebar.success(f"Exportado: {path}")

if st.sidebar.button("Exportar JSON"):
    path = pipeline.export_results("json")
    st.sidebar.success(f"Exportado: {path}")
```

### 4.2 Ejecuta el dashboard

```bash
streamlit run app.py
```

### Verifica

- El dashboard se abre en el navegador
- Los filtros funcionan correctamente
- Las visualizaciones se actualizan con los filtros
- Los datos se muestran de forma clara

### Checklist

- [ ] El dashboard se ejecuta con `streamlit run`
- [ ] Los filtros de categoría, sentimiento y fuente funcionan
- [ ] Las métricas principales se muestran correctamente
- [ ] Los gráficos son interactivos

---

## Paso 5: Agrega filtrado y exportación

El último paso es mejorar la experiencia de usuario con más opciones de filtrado y exportación.

### 5.1 Implementa filtros avanzados

```python
# Agregar a app.py después de los filtros básicos

# Filtro por rango de fechas
st.sidebar.subheader("Rango de Fechas")
if "timestamp" in df.columns:
    min_date = pd.to_datetime(df["timestamp"]).min().date()
    max_date = pd.to_datetime(df["timestamp"]).max().date()

    date_range = st.sidebar.date_input(
        "Rango de fechas",
        value=(min_date, max_date),
        min_value=min_date,
        max_value=max_date,
    )

    if len(date_range) == 2:
        start_date, end_date = date_range
        filtered_df = filtered_df[
            (pd.to_datetime(filtered_df["timestamp"]).dt.date >= start_date) &
            (pd.to_datetime(filtered_df["timestamp"]).dt.date <= end_date)
        ]

# Filtro por puntuación de sentimiento
st.sidebar.subheader("Rango de Polaridad")
polarity_range = st.sidebar.slider(
    "Rango de polaridad",
    min_value=-1.0,
    max_value=1.0,
    value=(-1.0, 1.0),
)

filtered_df = filtered_df[
    (filtered_df["polarity"] >= polarity_range[0]) &
    (filtered_df["polarity"] <= polarity_range[1])
]

# Búsqueda de texto
st.sidebar.subheader("Buscar Texto")
search_query = st.sidebar.text_input("Buscar en textos")

if search_query:
    filtered_df = filtered_df[
        filtered_df["text"].str.contains(search_query, case=False, na=False)
    ]
```

### 5.2 Agrega exportación avanzada

```python
# Agregar sección de exportación

st.sidebar.markdown("---")
st.sidebar.subheader("Exportar Datos")

# Exportar datos filtrados
export_format = st.sidebar.selectbox("Formato", ["CSV", "JSON", "Excel"])

if st.sidebar.button("Exportar Datos Filtrados"):
    if export_format == "CSV":
        csv = filtered_df.to_csv(index=False)
        st.sidebar.download_button(
            label="Descargar CSV",
            data=csv,
            file_name="sentiment_analysis.csv",
            mime="text/csv",
        )
    elif export_format == "JSON":
        json_data = filtered_df.to_json(orient="records", force_ascii=False)
        st.sidebar.download_button(
            label="Descargar JSON",
            data=json_data,
            file_name="sentiment_analysis.json",
            mime="application/json",
        )
    elif export_format == "Excel":
        excel = filtered_df.to_excel(index=False)
        st.sidebar.download_button(
            label="Descargar Excel",
            data=excel,
            file_name="sentiment_analysis.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )

# Exportar reporte
if st.sidebar.button("Generar Reporte"):
    summary = pipeline.get_summary()
    report = f"""# Reporte de Análisis de Sentimientos

## Resumen General
- Total de textos: {summary['total']}
- Polaridad promedio: {summary['average_polarity']:.3f}

## Distribución de Sentimientos
- Positivos: {summary['sentiment_distribution']['positive']}
- Neutrales: {summary['sentiment_distribution']['neutral']}
- Negativos: {summary['sentiment_distribution']['negative']}
"""

    st.sidebar.download_button(
        label="Descargar Reporte",
        data=report,
        file_name="sentiment_report.md",
        mime="text/markdown",
    )
```

### Verifica

- Los filtros avanzados funcionan correctamente
- La exportación genera archivos válidos
- El reporte es completo y útil

### Checklist

- [ ] Los filtros de fecha y polaridad funcionan
- [ ] La búsqueda de texto filtra correctamente
- [ ] La exportación a CSV, JSON y Excel funciona
- [ ] El reporte se genera con estadísticas completas

---

## 🩹 Si sale mal

**El dashboard no carga:**
Verifica que Streamlit esté instalado correctamente. Ejecuta `streamlit --version` para verificar.

**Los gráficos no se muestran:**
Verifica que Plotly esté instalado. Asegúrate de que los datos tengan el formato correcto.

**El análisis de sentimientos es inexacto:**
TextBlob es un modelo básico. Para mejor precisión, considera usar modelos pre-entrenados como transformers o spaCy.

---

## 🧠 Preguntas socráticas

- ¿Cómo mejorarías la precisión del análisis de sentimientos?
- ¿Qué métricas usarías para evaluar la calidad del dashboard?
- ¿Cómo manejarías texto en múltiples idiomas?
- ¿Qué funcionalidades agregarías para hacer el dashboard más útil?

---

## 🎓 ¿Qué sigue?

Tu dashboard está funcionando. Ahora puedes:

- **Agregar más fuentes de datos**: Conectar con APIs de redes sociales
- **Mejorar el modelo de sentimiento**: Usar transformers o modelos personalizados
- **Implementar alertas**: Notificar cuando el sentimiento cambie drásticamente
- **Crear reportes programados**: Generar reportes automáticos periódicos

Si quieres crear una app web más completa, revisa la skill de **Note Taking App** para aprender a construir aplicaciones CLI robustas.
