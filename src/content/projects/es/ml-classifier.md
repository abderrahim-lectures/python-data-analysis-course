---
title: 'Clasificador ML'
description: 'Construye un clasificador de texto completo que use embeddings y modelos pre-entrenados para categorizar documentos automáticamente.'
difficulty: intermediate
estimatedMinutes: 120
learningObjectives:
  - Entender los fundamentos de clasificación de texto con ML
  - Preprocesar y limpiar texto para entrenamiento
  - Entrenar y evaluar un clasificador usando scikit-learn
  - Crear una API REST para servir predicciones
  - Implementar un pipeline de ML end-to-end
prerequisites:
  - Python a nivel intermedio
  - Conocimientos básicos de machine learning
  - familiaridad con pandas y scikit-learn
  - Terminal y编辑or de código
---

## 🎯 Lo que harás

Vas a construir un clasificador de texto que pueda categorizar documentos automáticamente en categorías predefinidas. Usarás embeddings de texto y modelos de ML para lograr una clasificación precisa.

**Objetivo principal:** Crear un pipeline completo de clasificación que tome texto raw, lo procese y retorne categorías con probabilidades.

**Tu clasificador podrá:**

- **Preprocesar texto** eliminando ruido y normalizando
- **Extraer features** usando TF-IDF y embeddings
- **Entrenar modelos** de clasificación supervisada
- **Evaluar el rendimiento** con métricas estándar
- **Servir predicciones** a través de una API REST

Pasos:

- Paso 1: Configura el entorno del proyecto
- Paso 2: Prepara y preprocesa los datos
- Paso 3: Extrae features del texto
- Paso 4: Entrena el modelo de clasificación
- Paso 5: Evalúa el rendimiento del modelo
- Paso 6: Crea la API de predicción

Dónde ejecutar esto:

Trabaja desde la carpeta `projects/` de tu repo `pyda-course`.

## Configuración

1. Crea un entorno virtual:

```bash
cd projects/ml-classifier
uv venv
source .venv/bin/activate
```

2. Instala las dependencias:

```bash
uv pip install scikit-learn pandas numpy fastapi uvicorn joblib
```

3. Verifica la instalación:

```bash
python -c "import sklearn, pandas, fastapi; print('Dependencias listas')"
```

---

## Paso 1: Configura el entorno del proyecto

Establece la estructura base del proyecto y los parámetros de configuración.

### 1.1 Crea la estructura de directorios

```bash
mkdir -p data models api tests
```

### 1.2 Crea el archivo de configuración

Crea `config.py`:

```python
from pathlib import Path

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"
API_DIR = BASE_DIR / "api"

# Configuración del modelo
TEST_SIZE = 0.2
RANDOM_STATE = 42
MAX_FEATURES = 10000

# Configuración de categorías
CATEGORIES = {
    "tech": ["programación", "software", "código", "algoritmo", "desarrollo"],
    "science": ["investigación", "experimento", "hipótesis", "datos", "análisis"],
    "business": ["empresa", "mercado", "ventas", "estrategia", "negocio"],
    "general": ["noticias", "actualidad", "sociedad", "cultura", "entretenimiento"],
}

# Configuración de la API
API_HOST = "0.0.0.0"
API_PORT = 8000
```

### Verifica

- Los directorios se crean correctamente
- La configuración carga sin errores
- Las categorías están bien definidas

### Checklist

- [ ] Estructura de directorios creada
- [ ] Configuración del modelo definida
- [ ] Categorías de clasificación establecidas
- [ ] Parámetros de la API configurados

---

## Paso 2: Prepara y preprocesa los datos

La calidad de los datos es fundamental para un buen clasificador. Este paso crea un pipeline de preprocesamiento robusto.

### 2.1 Crea el generador de datos de ejemplo

Crea `data/generator.py`:

```python
import pandas as pd
import numpy as np
from pathlib import Path

def generate_sample_data(n_samples: int = 1000) -> pd.DataFrame:
    """Genera datos de ejemplo para clasificación de texto."""
    np.random.seed(42)

    templates = {
        "tech": [
            "Nuevo lenguaje de programación {lang} promete revolucionar el desarrollo",
            "Framework {framework} lanza versión {version} con mejoras significativas",
            "Empresa de tecnología anuncia inversión en {area} de inteligencia artificial",
            "Desarrolladores adoptan {herramienta} para optimizar código en producción",
        ],
        "science": [
            "Investigadores descubren {descubrimiento} en campo de {campo}",
            "Nuevo estudio revela hallazgos sobre {tema} en {institución}",
            "Experimento demuestra que {hallazgo} en condiciones controladas",
            "Científicos publican hallazgos sobre {tema} en revista especializada",
        ],
        "business": [
            "Empresa {empresa} reporta ganancias trimestrales por encima de expectativas",
            "Fusión entre {empresa1} y {empresa2} crea nuevo líder en el mercado",
            "Startup de {sector} recauda $XX millones en ronda de inversión",
            "Mercado de {mercado} muestra tendencia positiva este trimestre",
        ],
        "general": [
            "Ciudad de {ciudad} implementa nuevas medidas de {medida}",
            "Eventos culturales destacados para este mes en {región}",
            "Tendencias de {tendencia} marcan el inicio de temporada",
            "Comunidad de {comunidad} celebra tradición anual de {evento}",
        ],
    }

    fills = {
        "lang": ["Rust", "Go", "Kotlin", "Swift"],
        "framework": ["React", "Django", "FastAPI", "Vue"],
        "version": ["3.0", "2.5", "4.1", "1.0"],
        "area": ["procesamiento", "visión por computadora", "NLP"],
        "herramienta": ["Docker", "Kubernetes", "Terraform", "Ansible"],
        "descubrimiento": ["una nueva especie", "un nuevo material", "un nuevo método"],
        "campo": ["biología molecular", "física cuántica", "química orgánica"],
        "tema": ["cambio climático", "inteligencia artificial", "energías renovables"],
        "institución": ["MIT", "Stanford", "Universidad de Barcelona"],
        "hallazgo": ["se incrementa la eficiencia", "los resultados son consistentes"],
        "empresa": ["TechCorp", "InnovateInc", "DataSystems", "CloudNet"],
        "empresa1": ["MegaSoft", "TechGiant", "DataFlow"],
        "empresa2": ["CloudBase", "NetWare", "SysCore"],
        "sector": ["fintech", "healthtech", "edtech", "cleantech"],
        "mercado": ["tecnología", "energía", "salud", "educación"],
        "ciudad": ["Barcelona", "Madrid", "Ciudad de México", "Bogotá"],
        "medida": ["movilidad urbana", "sostenibilidad", "educación"],
        "región": ["América Latina", "Europa", "Asia"],
        "tendencia": ["moda", "tecnología", "gastronomía"],
        "comunidad": ["desarrolladores", "investigadores", "empresarios"],
        "evento": ["feria del libro", "festival de cine", "exposición de arte"],
    }

    data = []
    for category, template_list in templates.items():
        for _ in range(n_samples // len(templates)):
            template = np.random.choice(template_list)
            filled = template.format(**{k: np.random.choice(v) for k, v in fills.items() if f"{{{k}}}" in template})
            data.append({"text": filled, "category": category})

    df = pd.DataFrame(data)
    return df.sample(frac=1, random_state=42).reset_index(drop=True)

if __name__ == "__main__":
    df = generate_sample_data()
    df.to_csv(DATA_DIR / "sample_data.csv", index=False)
    print(f"Generados {len(df)} ejemplos")
    print(df["category"].value_counts())
```

### 2.2 Crea el preprocesador de texto

Crea `preprocessor.py`:

```python
import re
import unicodedata

class TextPreprocessor:
    def __init__(self):
        self.stopwords = self._load_stopwords()

    def _load_stopwords(self) -> set[str]:
        """Carga stopwords en español (lista básica)."""
        return {
            "de", "la", "que", "el", "en", "y", "a", "los", "del", "se", "las",
            "por", "un", "para", "con", "no", "una", "su", "al", "lo", "como",
            "más", "pero", "sus", "le", "ya", "o", "este", "sí", "porque",
            "esta", "entre", "cuando", "muy", "sin", "sobre", "también", "me",
            "hasta", "hay", "donde", "quien", "desde", "todo", "nos", "durante",
            "todos", "uno", "les", "ni", "contra", "otros", "ese", "eso",
            "ante", "ellos", "e", "esto", "mí", "antes", "algunos", "qué",
            "unos", "yo", "otro", "otras", "otra", "él", "tanto", "esa",
            "estos", "mucho", "quienes", "nada", "muchos", "cual", "poco",
            "ella", "estar", "estas", "algunas", "algo", "nosotros", "mi",
            "mis", "tú", "te", "ti", "tu", "tus", "ellas", "nosotras",
            "vosotros", "vosotras", "os", "mío", "mía", "míos", "mías",
            "tuyo", "tuya", "tuyos", "tuyas", "suyo", "suya", "suyos",
            "suyas", "nuestro", "nuestra", "nuestros", "nuestras", "vuestro",
            "vuestra", "vuestros", "vuestras", "esos", "esas", "estoy",
            "estás", "está", "estamos", "estáis", "están", "esté", "estés",
            "estemos", "estéis", "estén", "estaré", "estarás", "estará",
            "estaremos", "estaréis", "estarán", "estaría", "estarías",
            "estaríamos", "estaríais", "estarían", "estaba", "estabas",
            "estábamos", "estabais", "estaban", "estuve", "estuviste",
            "estuvo", "estuvimos", "estuvisteis", "estuvieron",
        }

    def normalize(self, text: str) -> str:
        """Normaliza el texto: minúsculas, sin acentos, sin caracteres especiales."""
        text = text.lower()
        text = unicodedata.normalize("NFD", text)
        text = "".join(c for c in text if unicodedata.category(c) != "Mn")
        text = re.sub(r"[^\w\s]", " ", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text

    def remove_stopwords(self, text: str) -> str:
        """Elimina stopwords del texto."""
        words = text.split()
        filtered = [w for w in words if w not in self.stopwords and len(w) > 2]
        return " ".join(filtered)

    def preprocess(self, text: str) -> str:
        """Pipeline completo de preprocesamiento."""
        text = self.normalize(text)
        text = self.remove_stopwords(text)
        return text

if __name__ == "__main__":
    preprocessor = TextPreprocessor()
    sample = "Los desarrolladores de software están creando nuevas herramientas de programación en Python."
    print(f"Original: {sample}")
    print(f"Procesado: {preprocessor.preprocess(sample)}")
```

### Verifica

- El generador crea datos balanceados por categoría
- El preprocesador normaliza correctamente el texto
- Las stopwords se eliminan apropiadamente

### Checklist

- [ ] `generate_sample_data` crea datos balanceados
- [ ] `TextPreprocessor` normaliza texto correctamente
- [ ] Las stopwords se eliminan
- [ ] El pipeline de preprocesamiento funciona end-to-end

---

## Paso 3: Extrae features del texto

Los modelos de ML necesitan representaciones numéricas del texto. Este paso implementa extracción de features con TF-IDF.

### 3.1 Implementa el extractor de features

Crea `features.py`:

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from config import TEST_SIZE, RANDOM_STATE, MAX_FEATURES
import joblib
from pathlib import Path

class FeatureExtractor:
    def __init__(self, max_features: int = MAX_FEATURES):
        self.vectorizer = TfidfVectorizer(
            max_features=max_features,
            ngram_range=(1, 2),
            min_df=2,
            max_df=0.95,
            sublinear_tf=True,
        )
        self.is_fitted = False

    def fit_transform(self, texts: list[str], labels: list[str] = None):
        """Ajusta el vectorizador y transforma los textos."""
        X = self.vectorizer.fit_transform(texts)
        self.is_fitted = True
        return X

    def transform(self, texts: list[str]):
        """Transforma textos usando el vectorizador ajustado."""
        if not self.is_fitted:
            raise ValueError("El vectorizador no está ajustado. Llama a fit_transform primero.")
        return self.vectorizer.transform(texts)

    def get_feature_names(self) -> list[str]:
        """Retorna los nombres de las features."""
        return self.vectorizer.get_feature_names_out().tolist()

    def save(self, path: str):
        """Guarda el vectorizador."""
        joblib.dump(self.vectorizer, path)

    def load(self, path: str):
        """Carga el vectorizador."""
        self.vectorizer = joblib.load(path)
        self.is_fitted = True

def prepare_data(df, feature_extractor: FeatureExtractor):
    """Prepara datos para entrenamiento y prueba."""
    X = feature_extractor.fit_transform(df["text"].tolist())
    y = df["category"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )

    return X_train, X_test, y_train, y_test
```

### 3.2 Verifica la extracción de features

```python
if __name__ == "__main__":
    import pandas as pd
    from data.generator import generate_sample_data

    df = generate_sample_data(200)
    extractor = FeatureExtractor()

    X = extractor.fit_transform(df["text"].tolist())
    print(f"Shape de las features: {X.shape}")
    print(f"Primeras 10 features: {extractor.get_feature_names()[:10]}")
```

### Verifica

- TF-IDF genera una matriz dispersa de features
- Las features más informativas son bigramas relevantes
- La dimensionalidad es razonable (< 10,000)

### Checklist

- [ ] `FeatureExtractor` crea features TF-IDF
- [ ] Los n-gramas (1,2) capturan contexto
- [ ] `prepare_data` divide correctamente en train/test
- [ ] El vectorizador se guarda y carga correctamente

---

## Paso 4: Entrena el modelo de clasificación

Ahora entrenaremos un clasificador usando las features extraídas.

### 4.1 Implementa el entrenamiento

Crea `train.py`:

```python
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import LinearSVC
from sklearn.model_selection import cross_val_score
from config import MODELS_DIR, RANDOM_STATE
import joblib
from pathlib import Path

def get_models():
    """Retorna los modelos disponibles para entrenamiento."""
    return {
        "logistic_regression": LogisticRegression(
            random_state=RANDOM_STATE, max_iter=1000, C=1.0
        ),
        "random_forest": RandomForestClassifier(
            random_state=RANDOM_STATE, n_estimators=100, n_jobs=-1
        ),
        "gradient_boosting": GradientBoostingClassifier(
            random_state=RANDOM_STATE, n_estimators=100
        ),
        "linear_svc": LinearSVC(
            random_state=RANDOM_STATE, max_iter=1000
        ),
    }

def train_model(model_name: str, X_train, y_train, X_test, y_test):
    """Entrena un modelo específico y retorna métricas."""
    models = get_models()
    model = models[model_name]

    print(f"Entrenando {model_name}...")
    model.fit(X_train, y_train)

    # Evaluar
    train_score = model.score(X_train, y_train)
    test_score = model.score(X_test, y_test)

    # Cross-validation
    cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring="accuracy")

    metrics = {
        "model": model_name,
        "train_accuracy": train_score,
        "test_accuracy": test_score,
        "cv_mean": cv_scores.mean(),
        "cv_std": cv_scores.std(),
    }

    print(f"  Train: {train_score:.3f} | Test: {test_score:.3f} | CV: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")

    return model, metrics

def train_all_models(X_train, y_train, X_test, y_test):
    """Entrena todos los modelos y compara resultados."""
    results = {}
    models = {}

    for model_name in get_models().keys():
        model, metrics = train_model(model_name, X_train, y_train, X_test, y_test)
        results[model_name] = metrics
        models[model_name] = model

    # Encontrar el mejor modelo
    best_name = max(results, key=lambda k: results[k]["test_accuracy"])
    print(f"\nMejor modelo: {best_name} (test: {results[best_name]['test_accuracy']:.3f})")

    return models[best_name], results

def save_model(model, name: str = "classifier"):
    """Guarda el modelo entrenado."""
    model_path = MODELS_DIR / f"{name}.joblib"
    joblib.dump(model, model_path)
    print(f"Modelo guardado en {model_path}")

def load_model(name: str = "classifier"):
    """Carga un modelo guardado."""
    model_path = MODELS_DIR / f"{name}.joblib"
    return joblib.load(model_path)
```

### 4.2 Ejecuta el entrenamiento

```python
if __name__ == "__main__":
    import pandas as pd
    from data.generator import generate_sample_data
    from features import FeatureExtractor, prepare_data
    from preprocessor import TextPreprocessor

    # Generar datos
    df = generate_sample_data(1000)

    # Preprocesar
    preprocessor = TextPreprocessor()
    df["text_clean"] = df["text"].apply(preprocessor.preprocess)

    # Extraer features
    extractor = FeatureExtractor()
    X_train, X_test, y_train, y_test = prepare_data(df, extractor)

    # Entrenar
    best_model, results = train_all_models(X_train, y_train, X_test, y_test)

    # Guardar
    save_model(best_model)
    extractor.save(str(MODELS_DIR / "vectorizer.joblib"))
```

### Verifica

- Todos los modelos se entrenan sin errores
- Las métricas son razonables (> 0.7 accuracy)
- El mejor modelo se guarda correctamente

### Checklist

- [ ] Los 4 modelos se entrenan correctamente
- [ ] Las métricas se calculan para cada modelo
- [ ] Se selecciona el mejor modelo automáticamente
- [ ] El modelo y vectorizador se guardan

---

## Paso 5: Evalúa el rendimiento del modelo

Una métrica de accuracy no es suficiente. Necesitamos una evaluación completa.

### 5.1 Crea el evaluador completo

Crea `evaluate.py`:

```python
from sklearn.metrics import (
    classification_report, confusion_matrix, accuracy_score,
    precision_recall_fscore_support
)
import numpy as np

def evaluate_model(model, X_test, y_test, class_names=None):
    """Evaluación completa del modelo."""
    y_pred = model.predict(X_test)

    # Métricas por clase
    report = classification_report(y_test, y_pred, target_names=class_names)

    # Matriz de confusión
    cm = confusion_matrix(y_test, y_pred)

    # Métricas globales
    accuracy = accuracy_score(y_test, y_pred)
    precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average="weighted")

    metrics = {
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1_score": f1,
        "confusion_matrix": cm.tolist(),
        "classification_report": report,
    }

    print("=== Evaluación del Modelo ===")
    print(f"Accuracy: {accuracy:.3f}")
    print(f"Precision: {precision:.3f}")
    print(f"Recall: {recall:.3f}")
    print(f"F1-Score: {f1:.3f}")
    print(f"\n{report}")

    return metrics

def compare_models(models: dict, X_test, y_test):
    """Compara múltiples modelos."""
    results = {}
    for name, model in models.items():
        y_pred = model.predict(X_test)
        results[name] = {
            "accuracy": accuracy_score(y_test, y_pred),
            "f1": precision_recall_fscore_support(y_test, y_pred, average="weighted")[2],
        }

    # Mostrar comparación
    print("\n=== Comparación de Modelos ===")
    for name, metrics in sorted(results.items(), key=lambda x: x[1]["accuracy"], reverse=True):
        print(f"{name:25s} | Accuracy: {metrics['accuracy']:.3f} | F1: {metrics['f1']:.3f}")

    return results

def analyze_errors(model, X_test, y_test, texts_test, class_names=None):
    """Analiza los errores del modelo."""
    y_pred = model.predict(X_test)
    errors = y_test != y_pred

    error_analysis = []
    for i, (true, pred, text) in enumerate(zip(y_test[errors], y_pred[errors], texts_test[errors])):
        error_analysis.append({
            "true_label": true,
            "predicted_label": pred,
            "text": text[:100],
        })

    print(f"\n=== Análisis de Errores ({errors.sum()} errores) ===")
    for err in error_analysis[:5]:
        print(f"  Real: {err['true_label']} | Predicho: {err['predicted_label']}")
        print(f"  Texto: {err['text']}...")

    return error_analysis
```

### Verifica

- Las métricas son coherentes entre sí
- La matriz de confusión muestra patrones claros
- Los errores se analizan correctamente

### Checklist

- [ ] `evaluate_model` muestra métricas completas
- [ ] `compare_models` compara múltiples algoritmos
- [ ] `analyze_errors` identifica patrones de error
- [ ] Los reportes son legibles y útiles

---

## Paso 6: Crea la API de predicción

El último paso es crear una API REST para servir predicciones del modelo.

### 6.1 Implementa la API con FastAPI

Crea `api/main.py`:

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
from pathlib import Path
import sys

sys.path.append(str(Path(__file__).parent.parent))

from config import MODELS_DIR, API_HOST, API_PORT
from preprocessor import TextPreprocessor

app = FastAPI(title="ML Classifier API", version="1.0.0")
preprocessor = TextPreprocessor()

# Cargar modelo y vectorizador al iniciar
model = None
vectorizer = None

@app.on_event("startup")
async def load_models():
    global model, vectorizer
    try:
        model = joblib.load(MODELS_DIR / "classifier.joblib")
        vectorizer = joblib.load(MODELS_DIR / "vectorizer.joblib")
    except FileNotFoundError:
        print("Modelo no encontrado. Ejecuta train.py primero.")

class PredictionRequest(BaseModel):
    text: str

class PredictionResponse(BaseModel):
    text: str
    predicted_category: str
    probabilities: dict[str, float]

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """Predice la categoría de un texto."""
    if model is None:
        raise HTTPException(status_code=500, detail="Modelo no cargado")

    # Preprocesar
    text_clean = preprocessor.preprocess(request.text)

    # Vectorizar
    X = vectorizer.transform([text_clean])

    # Predecir
    prediction = model.predict(X)[0]

    # Probabilidades (si el modelo las soporta)
    probabilities = {}
    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(X)[0]
        for cls, prob in zip(model.classes_, proba):
            probabilities[cls] = float(prob)

    return PredictionResponse(
        text=request.text,
        predicted_category=prediction,
        probabilities=probabilities,
    )

@app.get("/health")
async def health_check():
    """Verifica que la API esté funcionando."""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "vectorizer_loaded": vectorizer is not None,
    }

@app.get("/categories")
async def get_categories():
    """Retorna las categorías disponibles."""
    if model is None:
        raise HTTPException(status_code=500, detail="Modelo no cargado")
    return {"categories": model.classes_.tolist()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=API_HOST, port=API_PORT)
```

### 6.2 Prueba la API

```bash
# Iniciar el servidor
python api/main.py

# En otro terminal, hacer predicciones
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{"text": "Nuevo framework de Python revolucionaria el desarrollo web"}'

# Verificar salud
curl "http://localhost:8000/health"

# Ver categorías
curl "http://localhost:8000/categories"
```

### Verifica

- La API se inicia correctamente
- Las predicciones son razonables
- Los endpoints responden correctamente

### Checklist

- [ ] La API carga el modelo al iniciar
- [ ] El endpoint `/predict` retorna predicciones
- [ ] Las probabilidades se incluyen en la respuesta
- [ ] Los endpoints de salud funcionan

---

## 🩹 Si sale mal

**El modelo tiene accuracy bajo:**
Aumenta el tamaño del dataset con `generate_sample_data(5000)`. Verifica que el preprocesamiento no esté eliminando información importante.

**La API no carga el modelo:**
Verifica que `models/classifier.joblib` exista. Ejecuta `train.py` primero para generar el modelo.

**Error de importación en la API:**
Asegúrate de que el `sys.path` incluya el directorio padre. Verifica que `config.py` y `preprocessor.py` estén en el directorio correcto.

---

## 🧠 Preguntas socráticas

- ¿Cómo decidirías entre Logistic Regression y Random Forest para tu caso de uso?
- ¿Qué métricas son más importantes cuando las clases están desbalanceadas?
- ¿Cómo manejarías texto en múltiples idiomas?
- ¿Qué mejoras harías para escalar a millones de documentos?

---

## 🎓 ¿Qué sigue?

Tu clasificador está funcionando. Ahora puedes:

- **Agregar más categorías**: Expandir el dataset con nuevas clases
- **Usar embeddings profundos**: Incorporar modelos como BERT para mejor rendimiento
- **Crear un pipeline de producción**: Docker, CI/CD, monitoreo
- **Integrar con otras skills**: Conectar con la skill de **Knowledge Base** para clasificar documentos automáticamente

Si quieres profundizar en modelos más avanzados, revisa la skill de **Fine-Tuning con Unsloth** para aprender a personalizar modelos de lenguaje.
