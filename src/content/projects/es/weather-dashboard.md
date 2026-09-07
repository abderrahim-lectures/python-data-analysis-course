---
title: 'Dashboard del Clima'
description: 'Construye un dashboard del clima que muestre pronósticos, alertas y visualizaciones históricas usando APIs meteorológicas.'
difficulty: intermediate
estimatedMinutes: 120
learningObjectives:
  - Conectar con APIs meteorológicas para obtener datos en tiempo real
  - Procesar y almacenar datos de clima
  - Crear visualizaciones interactivas de pronósticos
  - Implementar un sistema de alertas meteorológicas
  - Construir un dashboard web responsive
prerequisites:
  - Python a nivel intermedio
  - Conocimientos básicos de APIs REST
  - familiaridad con pandas y visualización
  - Terminal y编辑or de código
---

## 🎯 Lo que harás

Vas a construir un dashboard del clima completo que muestre pronósticos, alertas y visualizaciones históricas. El sistema conectará con APIs meteorológicas y presentará la información de forma visual e intuitiva.

**Objetivo principal:** Crear un dashboard que muestre datos climáticos en tiempo real con pronósticos y alertas.

**Tu dashboard podrá:**

- **Obtener datos** de APIs meteorológicas en tiempo real
- **Mostrar pronósticos** de hasta 7 días
- **Crear visualizaciones** interactivas del clima
- **Implementar alertas** para condiciones extremas
- **Almacenar datos** históricos para análisis

Pasos:

- Paso 1: Configura el entorno del proyecto
- Paso 2: Implementa el cliente de API meteorológica
- Paso 3: Procesa y almacena los datos del clima
- Paso 4: Crea las visualizaciones del dashboard
- Paso 5: Implementa el sistema de alertas
- Paso 6: Construye la interfaz del dashboard
- Paso 7: Despliega y monitorea

Dónde ejecutar esto:

Trabaja desde la carpeta `projects/` de tu repo `pyda-course`. Necesitas una API key de OpenWeatherMap (gratuita).

## Configuración

1. Crea un entorno virtual:

```bash
cd projects/weather-dashboard
uv venv
source .venv/bin/activate
```

2. Instala las dependencias:

```bash
uv pip install requests pandas plotly streamlit python-dateutil
```

3. Configura tu API key:

```bash
export OPENWEATHER_API_KEY="tu-api-key"
```

4. Verifica la instalación:

```bash
python -c "import requests, pandas, plotly; print('Dependencias listas')"
```

---

## Paso 1: Configura el entorno del proyecto

Establece la estructura base y los parámetros de configuración.

### 1.1 Crea la estructura de directorios

```bash
mkdir -p data/historical data/cache config
```

### 1.2 Crea el archivo de configuración

Crea `config/settings.py`:

```python
from pathlib import Path
import os

BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
HISTORICAL_DIR = DATA_DIR / "historical"
CACHE_DIR = DATA_DIR / "cache"

# Configuración de API
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
BASE_URL = "https://api.openweathermap.org/data/2.5"

# Configuración de actualización
UPDATE_INTERVAL = 1800  # 30 minutos
CACHE_EXPIRY = 600  # 10 minutos

# Configuración de alertas
ALERT_THRESHOLDS = {
    "temperature_high": 35,
    "temperature_low": 0,
    "wind_speed": 50,
    "visibility": 1000,
    "uv_index": 8,
}

# Ciudades por defecto
DEFAULT_CITIES = [
    "Madrid,ES",
    "Barcelona,ES",
    "Ciudad de México,MX",
    "Bogotá,CO",
    "Buenos Aires,AR",
]
```

### Verifica

- La estructura del proyecto está configurada
- La API key se carga desde variables de entorno
- Los umbrales de alerta están definidos

### Checklist

- [ ] Estructura de directorios creada
- [ ] Configuración de API definida
- [ ] Umbrales de alerta configurados
- [ ] Ciudades por defecto establecidas

---

## Paso 2: Implementa el cliente de API meteorológica

El cliente conecta con OpenWeatherMap para obtener datos de clima.

### 2.1 Crea el cliente base

Crea `src/api/client.py`:

```python
import requests
import time
from datetime import datetime, timedelta
from config.settings import OPENWEATHER_API_KEY, BASE_URL, CACHE_DIR
import json

class WeatherAPIClient:
    def __init__(self):
        self.api_key = OPENWEATHER_API_KEY
        self.base_url = BASE_URL
        self.session = requests.Session()

    def _make_request(self, endpoint: str, params: dict = None) -> dict | None:
        """Realiza una petición a la API."""
        if not self.api_key:
            raise ValueError("API key no configurada. Establece OPENWEATHER_API_KEY")

        url = f"{self.base_url}/{endpoint}"
        params = params or {}
        params["appid"] = self.api_key
        params["units"] = "metric"
        params["lang"] = "es"

        try:
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"Error en petición API: {e}")
            return None

    def get_current_weather(self, city: str) -> dict | None:
        """Obtiene el clima actual de una ciudad."""
        cache_key = f"current_{city.replace(',', '_')}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached

        data = self._make_request("weather", {"q": city})
        if data:
            self._set_cache(cache_key, data)
        return data

    def get_forecast(self, city: str, days: int = 5) -> dict | None:
        """Obtiene el pronóstico de varios días."""
        cache_key = f"forecast_{city.replace(',', '_')}_{days}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached

        data = self._make_request("forecast", {"q": city, "cnt": days * 8})
        if data:
            self._set_cache(cache_key, data)
        return data

    def get_air_pollution(self, lat: float, lon: float) -> dict | None:
        """Obtiene datos de contaminación del aire."""
        data = self._make_request("air_pollution", {"lat": lat, "lon": lon})
        return data

    def _get_cached(self, key: str) -> dict | None:
        """Obtiene datos del caché si no han expirado."""
        cache_file = CACHE_DIR / f"{key}.json"
        if cache_file.exists():
            try:
                data = json.loads(cache_file.read_text())
                if time.time() - data.get("timestamp", 0) < 600:
                    return data.get("value")
            except (json.JSONDecodeError, KeyError):
                pass
        return None

    def _set_cache(self, key: str, value: dict):
        """Guarda datos en caché."""
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        cache_file = CACHE_DIR / f"{key}.json"
        cache_file.write_text(json.dumps({
            "timestamp": time.time(),
            "value": value,
        }))
```

### 2.2 Implementa el procesador de datos

```python
import pandas as pd
from datetime import datetime

class WeatherDataProcessor:
    def __init__(self, client: WeatherAPIClient):
        self.client = client

    def process_current(self, data: dict) -> dict:
        """Procesa datos del clima actual."""
        if not data:
            return {}

        return {
            "city": data.get("name", ""),
            "country": data.get("sys", {}).get("country", ""),
            "temperature": data.get("main", {}).get("temp", 0),
            "feels_like": data.get("main", {}).get("feels_like", 0),
            "humidity": data.get("main", {}).get("humidity", 0),
            "pressure": data.get("main", {}).get("pressure", 0),
            "wind_speed": data.get("wind", {}).get("speed", 0),
            "wind_deg": data.get("wind", {}).get("deg", 0),
            "description": data.get("weather", [{}])[0].get("description", ""),
            "icon": data.get("weather", [{}])[0].get("icon", ""),
            "visibility": data.get("visibility", 0),
            "clouds": data.get("clouds", {}).get("all", 0),
            "sunrise": datetime.fromtimestamp(data.get("sys", {}).get("sunrise", 0)),
            "sunset": datetime.fromtimestamp(data.get("sys", {}).get("sunset", 0)),
            "timestamp": datetime.now(),
        }

    def process_forecast(self, data: dict) -> pd.DataFrame:
        """Procesa datos de pronóstico en DataFrame."""
        if not data or "list" not in data:
            return pd.DataFrame()

        records = []
        for item in data["list"]:
            records.append({
                "datetime": datetime.fromtimestamp(item["dt"]),
                "temperature": item["main"]["temp"],
                "temp_min": item["main"]["temp_min"],
                "temp_max": item["main"]["temp_max"],
                "humidity": item["main"]["humidity"],
                "description": item["weather"][0]["description"],
                "wind_speed": item["wind"]["speed"],
                "clouds": item["clouds"]["all"],
                "precipitation": item.get("rain", {}).get("3h", 0),
            })

        return pd.DataFrame(records)

    def get_daily_summary(self, forecast_df: pd.DataFrame) -> pd.DataFrame:
        """Crea un resumen diario del pronóstico."""
        if forecast_df.empty:
            return pd.DataFrame()

        forecast_df["date"] = forecast_df["datetime"].dt.date

        daily = forecast_df.groupby("date").agg({
            "temperature": ["mean", "min", "max"],
            "humidity": "mean",
            "wind_speed": "max",
            "precipitation": "sum",
        }).round(1)

        daily.columns = ["temp_mean", "temp_min", "temp_max",
                         "humidity_mean", "wind_max", "precipitation_total"]
        daily = daily.reset_index()

        return daily
```

### Verifica

- La API se conecta correctamente
- Los datos se procesan en el formato correcto
- El caché funciona correctamente

### Checklist

- [ ] `WeatherAPIClient` conecta con OpenWeatherMap
- [ ] El caché evita peticiones innecesarias
- [ ] `process_current` extrae datos relevantes
- [ ] `process_forecast` crea DataFrame con pronóstico
- [ ] `get_daily_summary` resume por día

---

## Paso 3: Procesa y almacena los datos del clima

Los datos necesitan ser almacenados para análisis histórico.

### 3.1 Implementa el almacén de datos

Crea `src/storage/repository.py`:

```python
import sqlite3
import pandas as pd
from datetime import datetime
from pathlib import Path
from config.settings import DATA_DIR

class WeatherRepository:
    def __init__(self):
        self.db_path = DATA_DIR / "weather.db"
        self._init_db()

    def _init_db(self):
        """Inicializa la base de datos."""
        DATA_DIR.mkdir(parents=True, exist_ok=True)

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS weather_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                city TEXT NOT NULL,
                temperature REAL,
                humidity REAL,
                wind_speed REAL,
                description TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS weather_alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                city TEXT NOT NULL,
                alert_type TEXT NOT NULL,
                message TEXT NOT NULL,
                severity TEXT DEFAULT 'medium',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                acknowledged BOOLEAN DEFAULT FALSE
            )
        """)

        conn.commit()
        conn.close()

    def save_current(self, weather_data: dict):
        """Guarda datos del clima actual."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO weather_history (city, temperature, humidity, wind_speed, description)
            VALUES (?, ?, ?, ?, ?)
        """, (
            weather_data.get("city"),
            weather_data.get("temperature"),
            weather_data.get("humidity"),
            weather_data.get("wind_speed"),
            weather_data.get("description"),
        ))

        conn.commit()
        conn.close()

    def get_history(self, city: str, days: int = 7) -> pd.DataFrame:
        """Obtiene historial de clima."""
        conn = sqlite3.connect(self.db_path)

        query = """
            SELECT * FROM weather_history
            WHERE city = ? AND timestamp >= datetime('now', ?)
            ORDER BY timestamp DESC
        """

        df = pd.read_sql_query(query, conn, params=(city, f"-{days} days"))
        conn.close()

        return df

    def save_alert(self, city: str, alert_type: str, message: str, severity: str = "medium"):
        """Guarda una alerta meteorológica."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO weather_alerts (city, alert_type, message, severity)
            VALUES (?, ?, ?, ?)
        """, (city, alert_type, message, severity))

        conn.commit()
        conn.close()

    def get_active_alerts(self, city: str = None) -> pd.DataFrame:
        """Obtiene alertas activas."""
        conn = sqlite3.connect(self.db_path)

        query = "SELECT * FROM weather_alerts WHERE acknowledged = FALSE"
        params = []

        if city:
            query += " AND city = ?"
            params.append(city)

        query += " ORDER BY created_at DESC"

        df = pd.read_sql_query(query, conn, params=params)
        conn.close()

        return df
```

### Verifica

- La base de datos se inicializa correctamente
- Los datos se guardan y recuperan
- Las alertas se almacenan

### Checklist

- [ ] `WeatherRepository` guarda datos históricos
- [ ] `get_history` recupera datos por ciudad y período
- [ ] Las alertas se guardan con severidad
- [ ] La base de datos se crea automáticamente

---

## Paso 4: Crea las visualizaciones del dashboard

Ahora crearemos gráficos interactivos para el dashboard.

### 4.1 Implementa el creador de gráficos

Crea `src/visualizations/charts.py`:

```python
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd

class WeatherCharts:
    def __init__(self):
        self.color_scheme = {
            "temperature": "#e74c3c",
            "humidity": "#3498db",
            "wind": "#2ecc71",
            "precipitation": "#9b59b6",
        }

    def create_current_weather_card(self, weather: dict) -> go.Figure:
        """Crea una tarjeta del clima actual."""
        fig = go.Figure()

        fig.add_trace(go.Indicator(
            mode="number+delta",
            value=weather.get("temperature", 0),
            title={"text": f"Temperatura en {weather.get('city', '')}"},
            delta={"reference": weather.get("feels_like", 0), "suffix": "°C"},
            domain={"x": [0, 1], "y": [0, 1]},
        ))

        fig.update_layout(
            height=200,
            margin=dict(l=20, r=20, t=50, b=20),
        )

        return fig

    def create_temperature_forecast(self, forecast_df: pd.DataFrame) -> go.Figure:
        """Crea gráfico de pronóstico de temperatura."""
        fig = go.Figure()

        fig.add_trace(go.Scatter(
            x=forecast_df["datetime"],
            y=forecast_df["temperature"],
            mode="lines+markers",
            name="Temperatura",
            line=dict(color=self.color_scheme["temperature"], width=2),
        ))

        fig.add_trace(go.Scatter(
            x=forecast_df["datetime"],
            y=forecast_df["temp_max"],
            mode="lines",
            name="Máxima",
            line=dict(color="red", dash="dash", width=1),
        ))

        fig.add_trace(go.Scatter(
            x=forecast_df["datetime"],
            y=forecast_df["temp_min"],
            mode="lines",
            name="Mínima",
            line=dict(color="blue", dash="dash", width=1),
        ))

        fig.update_layout(
            title="Pronóstico de Temperatura",
            xaxis_title="Fecha",
            yaxis_title="Temperatura (°C)",
            hovermode="x unified",
            height=400,
        )

        return fig

    def create_humidity_chart(self, forecast_df: pd.DataFrame) -> go.Figure:
        """Crea gráfico de humedad."""
        fig = go.Figure()

        fig.add_trace(go.Bar(
            x=forecast_df["datetime"],
            y=forecast_df["humidity"],
            name="Humedad",
            marker_color=self.color_scheme["humidity"],
        ))

        fig.update_layout(
            title="Humedad Relativa",
            xaxis_title="Fecha",
            yaxis_title="Humedad (%)",
            yaxis=dict(range=[0, 100]),
            height=300,
        )

        return fig

    def create_wind_chart(self, forecast_df: pd.DataFrame) -> go.Figure:
        """Crea gráfico de viento."""
        fig = go.Figure()

        fig.add_trace(go.Scatter(
            x=forecast_df["datetime"],
            y=forecast_df["wind_speed"],
            mode="lines+markers",
            name="Velocidad del viento",
            fill="tozeroy",
            line=dict(color=self.color_scheme["wind"]),
        ))

        fig.update_layout(
            title="Velocidad del Viento",
            xaxis_title="Fecha",
            yaxis_title="Velocidad (m/s)",
            height=300,
        )

        return fig

    def create_precipitation_chart(self, forecast_df: pd.DataFrame) -> go.Figure:
        """Crea gráfico de precipitaciones."""
        fig = go.Figure()

        fig.add_trace(go.Bar(
            x=forecast_df["datetime"],
            y=forecast_df["precipitation"],
            name="Precipitación",
            marker_color=self.color_scheme["precipitation"],
        ))

        fig.update_layout(
            title="Precipitaciones",
            xaxis_title="Fecha",
            yaxis_title="Cantidad (mm)",
            height=300,
        )

        return fig

    def create_daily_comparison(self, daily_df: pd.DataFrame) -> go.Figure:
        """Crea gráfico de comparación diaria."""
        fig = make_subplots(
            rows=2, cols=1,
            subplot_titles=("Temperatura", "Condiciones"),
            vertical_spacing=0.15,
        )

        # Temperatura
        fig.add_trace(
            go.Bar(
                x=daily_df["date"],
                y=daily_df["temp_mean"],
                name="Temperatura Promedio",
                error_y=dict(
                    type="data",
                    symmetric=False,
                    array=daily_df["temp_max"] - daily_df["temp_mean"],
                    arrayminus=daily_df["temp_mean"] - daily_df["temp_min"],
                ),
            ),
            row=1, col=1,
        )

        # Precipitación
        fig.add_trace(
            go.Bar(
                x=daily_df["date"],
                y=daily_df["precipitation_total"],
                name="Precipitación Total",
                marker_color=self.color_scheme["precipitation"],
            ),
            row=2, col=1,
        )

        fig.update_layout(height=600, showlegend=True)
        return fig

    def create_weather_map(self, cities_data: list[dict]) -> go.Figure:
        """Crea mapa con múltiples ciudades."""
        fig = go.Figure()

        for city_data in cities_data:
            fig.add_trace(go.Scattergeo(
                lon=[city_data.get("lon", 0)],
                lat=[city_data.get("lat", 0)],
                text=f"{city_data['city']}: {city_data['temperature']}°C",
                marker=dict(
                    size=20,
                    color=city_data.get("temperature", 0),
                    colorscale="RdYlBu_r",
                    showscale=True,
                    colorbar=dict(title="°C"),
                ),
            ))

        fig.update_layout(
            title="Mapa del Clima",
            geo=dict(
                showland=True,
                landcolor="rgb(243, 243, 243)",
                countrycolor="rgb(204, 204, 204)",
            ),
            height=500,
        )

        return fig
```

### Verifica

- Los gráficos se generan correctamente
- Las visualizaciones son informativas
- Los gráficos son interactivos

### Checklist

- [ ] `create_current_weather_card` muestra el clima actual
- [ ] `create_temperature_forecast` muestra pronóstico
- [ ] `create_daily_comparison` compara días
- [ ] `create_weather_map` muestra múltiples ciudades

---

## Paso 5: Implementa el sistema de alertas

El sistema de alertas notifica cuando las condiciones son extremas.

### 5.1 Crea el motor de alertas

Crea `src/alerts/engine.py`:

```python
from datetime import datetime
from config.settings import ALERT_THRESHOLDS

class WeatherAlertEngine:
    def __init__(self):
        self.thresholds = ALERT_THRESHOLDS
        self.alert_rules = [
            self._check_high_temperature,
            self._check_low_temperature,
            self._check_wind_speed,
            self._check_visibility,
            self._check_uv_index,
        ]

    def check_alerts(self, weather_data: dict) -> list[dict]:
        """Verifica todas las reglas de alerta."""
        alerts = []

        for rule in self.alert_rules:
            alert = rule(weather_data)
            if alert:
                alerts.append(alert)

        return alerts

    def _check_high_temperature(self, data: dict) -> dict | None:
        """Alerta por temperatura alta."""
        temp = data.get("temperature", 0)
        if temp >= self.thresholds["temperature_high"]:
            return {
                "type": "high_temperature",
                "severity": "high",
                "message": f"Temperatura alta: {temp}°C",
                "city": data.get("city", ""),
            }
        return None

    def _check_low_temperature(self, data: dict) -> dict | None:
        """Alerta por temperatura baja."""
        temp = data.get("temperature", 0)
        if temp <= self.thresholds["temperature_low"]:
            return {
                "type": "low_temperature",
                "severity": "medium",
                "message": f"Temperatura baja: {temp}°C",
                "city": data.get("city", ""),
            }
        return None

    def _check_wind_speed(self, data: dict) -> dict | None:
        """Alerta por viento fuerte."""
        wind = data.get("wind_speed", 0)
        if wind >= self.thresholds["wind_speed"]:
            return {
                "type": "high_wind",
                "severity": "high",
                "message": f"Viento fuerte: {wind} m/s",
                "city": data.get("city", ""),
            }
        return None

    def _check_visibility(self, data: dict) -> dict | None:
        """Alerta por baja visibilidad."""
        visibility = data.get("visibility", 10000)
        if visibility <= self.thresholds["visibility"]:
            return {
                "type": "low_visibility",
                "severity": "medium",
                "message": f"Baja visibilidad: {visibility}m",
                "city": data.get("city", ""),
            }
        return None

    def _check_uv_index(self, data: dict) -> dict | None:
        """Alerta por índice UV alto."""
        uv = data.get("uv_index", 0)
        if uv >= self.thresholds["uv_index"]:
            return {
                "type": "high_uv",
                "severity": "medium",
                "message": f"Índice UV alto: {uv}",
                "city": data.get("city", ""),
            }
        return None

    def format_alert(self, alert: dict) -> str:
        """Formatea una alerta para mostrar."""
        severity_emoji = {
            "low": "ℹ️",
            "medium": "⚠️",
            "high": "🔴",
        }

        emoji = severity_emoji.get(alert.get("severity", "medium"), "⚠️")
        return f"{emoji} {alert['message']} en {alert['city']}"
```

### Verifica

- Las alertas se detectan correctamente
- Los umbrales funcionan
- Los mensajes son claros

### Checklist

- [ ] `WeatherAlertEngine` verifica todas las reglas
- [ ] Las alertas se clasifican por severidad
- [ ] Los mensajes son descriptivos
- [ ] El formato de alerta es legible

---

## Paso 6: Construye la interfaz del dashboard

Ahora crearemos la interfaz web completa con Streamlit.

### 6.1 Implementa el dashboard principal

Crea `app.py`:

```python
import streamlit as st
import plotly.graph_objects as go
from datetime import datetime

from src.api.client import WeatherAPIClient, WeatherDataProcessor
from src.storage.repository import WeatherRepository
from src.visualizations.charts import WeatherCharts
from src.alerts.engine import WeatherAlertEngine
from config.settings import DEFAULT_CITIES

# Configurar página
st.set_page_config(
    page_title="🌤️ Dashboard del Clima",
    page_icon="🌤️",
    layout="wide",
)

# Inicializar componentes
client = WeatherAPIClient()
processor = WeatherDataProcessor(client)
repository = WeatherRepository()
charts = WeatherCharts()
alert_engine = WeatherAlertEngine()

st.title("🌤️ Dashboard del Clima")

# Sidebar con selector de ciudad
st.sidebar.header("Configuración")
city = st.sidebar.selectbox(
    "Selecciona una ciudad",
    DEFAULT_CITIES,
)

# Botón de actualización
if st.sidebar.button("🔄 Actualizar datos"):
    st.cache_data.clear()

# Obtener datos
try:
    # Clima actual
    current_raw = client.get_current_weather(city)
    current = processor.process_current(current_raw)

    # Pronóstico
    forecast_raw = client.get_forecast(city)
    forecast_df = processor.process_forecast(forecast_raw)
    daily_df = processor.get_daily_summary(forecast_df)

    # Guardar en historial
    repository.save_current(current)

    # Verificar alertas
    alerts = alert_engine.check_alerts(current)

    # Mostrar alertas
    if alerts:
        st.warning("⚠️ Alertas activas:")
        for alert in alerts:
            st.write(f"- {alert_engine.format_alert(alert)}")

    # Métricas principales
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric(
            "Temperatura",
            f"{current.get('temperature', 0):.1f}°C",
            f"Sensación: {current.get('feels_like', 0):.1f}°C",
        )

    with col2:
        st.metric(
            "Humedad",
            f"{current.get('humidity', 0)}%",
        )

    with col3:
        st.metric(
            "Viento",
            f"{current.get('wind_speed', 0):.1f} m/s",
        )

    with col4:
        st.metric(
            "Nubosidad",
            f"{current.get('clouds', 0)}%",
        )

    st.markdown("---")

    # Descripción del clima
    st.subheader(f"Clima actual en {current.get('city', city)}")
    st.write(f"**Condición:** {current.get('description', 'N/A').title()}")
    st.write(f"**Amanecer:** {current.get('sunrise', '').strftime('%H:%M') if current.get('sunrise') else 'N/A'}")
    st.write(f"**Atardecer:** {current.get('sunset', '').strftime('%H:%M') if current.get('sunset') else 'N/A'}")

    st.markdown("---")

    # Gráficos
    st.subheader("Pronóstico")

    tab1, tab2, tab3 = st.tabs(["Temperatura", "Humedad y Viento", "Resumen Diario"])

    with tab1:
        st.plotly_chart(
            charts.create_temperature_forecast(forecast_df),
            use_container_width=True,
        )

    with tab2:
        col_left, col_right = st.columns(2)
        with col_left:
            st.plotly_chart(
                charts.create_humidity_chart(forecast_df),
                use_container_width=True,
            )
        with col_right:
            st.plotly_chart(
                charts.create_wind_chart(forecast_df),
                use_container_width=True,
            )

    with tab3:
        st.plotly_chart(
            charts.create_daily_comparison(daily_df),
            use_container_width=True,
        )

    # Alertas activas
    st.markdown("---")
    st.subheader("Alertas Activas")

    active_alerts = repository.get_active_alerts(city)
    if not active_alerts.empty:
        for _, alert in active_alerts.iterrows():
            st.info(f"**{alert['alert_type']}**: {alert['message']}")
    else:
        st.success("No hay alertas activas")

except Exception as e:
    st.error(f"Error al obtener datos: {e}")
    st.info("Verifica tu API key y conexión a internet")
```

### Verifica

- El dashboard se carga correctamente
- Los datos se muestran en tiempo real
- Las alertas se detectan y muestran

### Checklist

- [ ] El dashboard muestra el clima actual
- [ ] Los pronósticos se visualizan correctamente
- [ ] Las alertas se detectan y muestran
- [ ] La interfaz es responsive

---

## Paso 7: Despliega y monitorea

El último paso es configurar la ejecución automática y el monitoreo.

### 7.1 Crea el script de actualización

```python
# update.py
import schedule
import time
from datetime import datetime
from src.api.client import WeatherAPIClient, WeatherDataProcessor
from src.storage.repository import WeatherRepository
from src.alerts.engine import WeatherAlertEngine
from config.settings import DEFAULT_CITIES, UPDATE_INTERVAL

def update_weather():
    """Actualiza el clima para todas las ciudades configuradas."""
    print(f"[{datetime.now()}] Actualizando clima...")

    client = WeatherAPIClient()
    processor = WeatherDataProcessor(client)
    repository = WeatherRepository()
    alert_engine = WeatherAlertEngine()

    for city in DEFAULT_CITIES:
        try:
            # Obtener datos
            current_raw = client.get_current_weather(city)
            current = processor.process_current(current_raw)

            # Guardar
            repository.save_current(current)

            # Verificar alertas
            alerts = alert_engine.check_alerts(current)
            for alert in alerts:
                repository.save_alert(
                    city=city,
                    alert_type=alert["type"],
                    message=alert["message"],
                    severity=alert["severity"],
                )

            print(f"  ✓ {city}: {current.get('temperature', 0)}°C")

        except Exception as e:
            print(f"  ✗ {city}: Error - {e}")

    print(f"[{datetime.now()}] Actualización completada")

if __name__ == "__main__":
    # Ejecutar inmediatamente
    update_weather()

    # Programar actualizaciones
    schedule.every(UPDATE_INTERVAL).seconds.do(update_weather)

    print(f"Actualizaciones programadas cada {UPDATE_INTERVAL} segundos")
    while True:
        schedule.run_pending()
        time.sleep(1)
```

### 7.2 Crea el Dockerfile (opcional)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8501

CMD ["streamlit", "run", "app.py", "--server.port=8501", "--server.address=0.0.0.0"]
```

### Verifica

- Las actualizaciones programadas funcionan
- El monitoreo registra errores
- El despliegue está configurado

### Checklist

- [ ] `update.py` ejecuta actualizaciones periódicas
- [ ] El monitoreo registra actividad
- [ ] El Dockerfile está configurado
- [ ] El sistema funciona de forma autónoma

---

## 🩹 Si sale mal

**Error de API key:**
Verifica que `OPENWEATHER_API_KEY` esté configurada. Obtén una key gratuita en openweathermap.org.

**Los datos no se actualizan:**
Verifica la conexión a internet. Revisa los logs de errores. Aumenta el intervalo de caché si es necesario.

**Las alertas no se detectan:**
Verifica que los umbrales en `config/settings.py` sean apropiados para tu región.

---

## 🧠 Preguntas socráticas

- ¿Cómo manejarías la falta de conexión a internet?
- ¿Qué métricas usarías para evaluar la precisión del pronóstico?
- ¿Cómo implementarías alertas push para usuarios móviles?
- ¿Qué fuentes de datos adicionales agregarías?

---

## 🎓 ¿Qué sigue?

Tu dashboard del clima está funcionando. Ahora puedes:

- **Agregar más ciudades**: Expandir la cobertura geográfica
- **Implementar notificaciones**: Email, SMS, push notifications
- **Crear reportes históricos**: Análisis de tendencias climáticas
- **Integrar con IoT**: Conectar sensores locales

Si quieres crear dashboards más complejos, revisa la skill de **Sentiment Dashboard** para aprender a construir visualizaciones interactivas avanzadas.
