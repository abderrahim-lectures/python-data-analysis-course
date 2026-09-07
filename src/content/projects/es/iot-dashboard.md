---
title: "Panel de IoT"
description: "Panel en tiempo real para monitorear dispositivos IoT con medidores, gráficos y vistas de mapa."
difficulty: "intermediate"
estimatedMinutes: 55
tags: ["iot", "data-viz", "async"]
learningObjectives:
  - "Simular flujos de datos de sensores IoT con patrones realistas"
  - "Construir medidores e indicadores con actualización en vivo usando Dash"
  - "Crear gráficos de series temporales históricos para las tendencias de los sensores"
  - "Implementar agrupación de dispositivos y filtrado por tipo o ubicación"
prerequisites: ["Python 101", "Data Analysis"]
---

# 📊 Construye un Panel de IoT

Un sistema IoT sin panel es como un coche sin velocímetro — los datos existen, pero nadie puede verlos. Este proyecto construye un panel de monitoreo en tiempo real con Dash y Plotly: simulas flujos de datos de sensores, renderizas medidores en vivo que se actualizan cada segundo, graficas las tendencias históricas como gráficos de series temporales y agrupas los dispositivos por tipo o ubicación. El panel se ejecuta en tu navegador y se actualiza automáticamente.

Esto asume Python 101 y comodidad con pandas de Análisis de Datos — nada más. Es opcional y no calificado; consulta [Proyectos del mundo real](/docs/projects) para la lista completa.

## 🎯 Lo que harás

1. Configurar un proyecto con `uv` e instalar las dependencias del panel.
2. Simular datos de sensores IoT con patrones realistas de temperatura, humedad y batería.
3. Construir un diseño de Dash con medidores e indicadores de actualización en vivo.
4. Crear gráficos de series temporales históricos que rastreen las lecturas de los sensores a lo largo del tiempo.
5. Implementar la agrupación y el filtrado de dispositivos por tipo o ubicación.
6. Conectar todo en una aplicación de panel ejecutable.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal — este es un servidor web que se ejecuta en `localhost` y se abre en tu navegador.

**Google Colab, Kaggle Notebooks y Binder** pueden ejecutar el servidor para probarlo, pero la URL del panel no será accesible desde fuera del notebook.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/iot-dashboard/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/iot-dashboard/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fiot-dashboard%2Fnotebook.ipynb)

## Configuración

Todo lo que necesitas antes de construir: un entorno de Python, Dash y Plotly.

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
uv init iot-dashboard
cd iot-dashboard
uv add dash plotly pandas
```

`dash` es el framework de Plotly para paneles interactivos. `plotly` proporciona los componentes de gráficos. `pandas` maneja los datos de series temporales.

### Crea la estructura del proyecto

```bash
mkdir -p dashboard
touch dashboard/__init__.py dashboard/simulator.py dashboard/layout.py dashboard/callbacks.py dashboard/app.py
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `iot-dashboard/` existe con un `pyproject.toml`, y `dash`, `plotly` y `pandas` están instalados.
- ✅ El directorio `dashboard/` tiene todos los archivos de módulo requeridos.

## Paso 1: Simula los datos de sensores IoT

Los datos IoT reales tienen patrones: la temperatura sube durante el día y baja por la noche, la humedad se correlaciona inversamente con la temperatura y los niveles de batería declinan lentamente. Simular estos patrones hace que el panel se vea realista.

### 1.1 Crea el simulador de datos

**👟 Pista inicial :** Crea `dashboard/simulator.py` con una clase que genere lecturas de sensores realistas.

```python
# dashboard/simulator.py
import math, time, random
from dataclasses import dataclass, field

@dataclass
class SensorReading:
    device_id: str
    device_type: str
    location: str
    temperature: float = 0.0
    humidity: float = 0.0
    battery: float = 100.0
    timestamp: float = field(default_factory=time.time)

class SensorSimulator:
    def __init__(self, devices: list[dict]):
        self.devices = devices
        self.tick_count = 0

    def tick(self) -> list[SensorReading]:
        self.tick_count += 1
        readings = []
        hour = self.tick_count % 24
        for dev in self.devices:
            base_temp = 20 + 10 * math.sin((hour - 6) * math.pi / 12)
            temp = base_temp + random.gauss(0, 0.5)
            humidity = 70 - temp * 0.8 + random.gauss(0, 2)
            battery = max(0, dev.get("battery", 100) - random.uniform(0, 0.01))
            dev["battery"] = battery
            readings.append(SensorReading(
                device_id=dev["id"], device_type=dev["type"],
                location=dev["location"], temperature=round(temp, 1),
                humidity=round(humidity, 1), battery=round(battery, 2),
            ))
        return readings

SAMPLE_DEVICES = [
    {"id": "temp-001", "type": "temperature", "location": "Warehouse A", "battery": 98},
    {"id": "temp-002", "type": "temperature", "location": "Warehouse B", "battery": 75},
    {"id": "hum-001", "type": "humidity", "location": "Warehouse A", "battery": 90},
    {"id": "bat-001", "type": "battery", "location": "Field Unit", "battery": 45},
]
```

La onda sinusoidal produce un patrón de temperatura diurno. El ruido añade variabilidad a nivel de sensor. La batería declina lentamente en cada tick.

**🎯 Resultado esperado :** `SensorSimulator(SAMPLE_DEVICES).tick()` devuelve 4 lecturas con valores realistas.

**🩹 Si sale mal :** Si la temperatura siempre es la misma, `tick_count` no está avanzando. Si la batería siempre es 100, `dev.get("battery")` no se está actualizando.

### 1.2 Verifica el simulador

**✅ Lista de verificación**

- ✅ `tick()` devuelve una `SensorReading` por dispositivo.
- ✅ Los valores de temperatura cambian entre ticks.
- ✅ Los valores de batería disminuyen lentamente.

**🤔 Pregunta(s) socrática(s)**

- Si quisieras simular latencia de red donde algunos sensores reportan tarde, ¿cómo añadirías un parámetro de retraso a ciertos dispositivos?
- ¿Cómo harías configurable la velocidad de la simulación para que un "día" completo pasara en 10 segundos o 10 minutos?

## Paso 2: Construye el diseño de Dash

Los diseños de Dash son árboles de componentes. Este paso crea el diseño principal con un título, un selector de dispositivos, una fila de medidores y un área de gráficos.

### 2.1 Crea el diseño

**👟 Pista inicial :** Crea `dashboard/layout.py`.

```python
# dashboard/layout.py
from dash import dcc, html
import dash_bootstrap_components as dbc

def create_layout():
    return html.Div([
        html.H1("IoT Sensor Dashboard", style={"textAlign": "center", "padding": "20px"}),
        dbc.Row([dbc.Col([
            html.Label("Filter by Location:"),
            dcc.Dropdown(id="location-filter", options=[
                {"label": "All", "value": "all"},
                {"label": "Warehouse A", "value": "Warehouse A"},
                {"label": "Warehouse B", "value": "Warehouse B"},
                {"label": "Field Unit", "value": "Field Unit"},
            ], value="all"),
        ], width=4)], style={"padding": "10px 20px"}),
        dbc.Row([
            dbc.Col(dcc.Graph(id="temp-gauge"), width=4),
            dbc.Col(dcc.Graph(id="humidity-gauge"), width=4),
            dbc.Col(dcc.Graph(id="battery-gauge"), width=4),
        ], style={"padding": "10px 20px"}),
        dbc.Row([dbc.Col(dcc.Graph(id="history-chart"), width=12)],
                style={"padding": "10px 20px"}),
        dcc.Interval(id="interval", interval=1000, n_intervals=0),
    ])
```

El `dcc.Interval` se dispara cada 1 segundo, disparando las actualizaciones de los medidores y del gráfico. Cada medidor obtiene un tercio del ancho mediante las columnas de Bootstrap.

**🎯 Resultado esperado :** `create_layout()` devuelve un árbol de componentes que se renderiza como un título, un menú desplegable, tres medidores y un gráfico.

**🩹 Si sale mal :** Si los medidores no aparecen, necesitan una propiedad `figure` de los callbacks. Si el diseño se rompe, revisa que `dbc` esté importado.

### 2.2 Verifica el diseño

**✅ Lista de verificación**

- ✅ El diseño tiene título, menú desplegable, tres contenedores de medidores y un contenedor de gráfico.
- ✅ `dcc.Interval` está configurado para actualizarse cada 1 segundo.

**🤔 Pregunta(s) socrática(s)**

- Si tuvieras 20 sensores, la fila de medidores no cabría. ¿Cómo harías el diseño responsivo?
- ¿Cómo poblarías dinámicamente el menú desplegable a partir de la lista de dispositivos?

## Paso 3: Crea los medidores en vivo y los gráficos históricos

### 3.1 Construye las figuras de los medidores

**👟 Pista inicial :** Crea las funciones de medidor en `dashboard/callbacks.py`.

```python
# dashboard/callbacks.py
import plotly.graph_objects as go
import pandas as pd

def make_gauge(value, title, min_val, max_val, suffix="", color="#2ecc71"):
    fig = go.Figure(go.Indicator(
        mode="gauge+number", value=value,
        title={"text": title, "font": {"size": 16}},
        number={"suffix": suffix, "font": {"size": 24}},
        gauge={"axis": {"range": [min_val, max_val]}, "bar": {"color": color}},
    ))
    fig.update_layout(height=250, margin=dict(l=20, r=20, t=50, b=20))
    return fig
```

**🎯 Resultado esperado :** `make_gauge(22.5, "Temperature", -10, 50, "°C")` devuelve una figura de medidor de Plotly.

**🩹 Si sale mal :** Si el medidor no se renderiza, revisa que el `mode` incluya `"gauge"`.

### 3.2 Construye el gráfico histórico

```python
# dashboard/callbacks.py (continued)
class DataBuffer:
    def __init__(self, max_points=200):
        self.max_points = max_points
        self.data = {"timestamp": [], "temperature": [], "humidity": []}

    def add(self, readings):
        for r in readings:
            self.data["timestamp"].append(r.timestamp)
            self.data["temperature"].append(r.temperature)
            self.data["humidity"].append(r.humidity)
        for key in self.data:
            self.data[key] = self.data[key][-self.max_points:]

    def to_dataframe(self):
        return pd.DataFrame(self.data)

def make_history_chart(df):
    fig = go.Figure()
    if not df.empty:
        fig.add_trace(go.Scatter(x=df["timestamp"], y=df["temperature"],
                                 name="Temperature", line=dict(color="#e74c3c")))
        fig.add_trace(go.Scatter(x=df["timestamp"], y=df["humidity"],
                                 name="Humidity", line=dict(color="#3498db"), yaxis="y2"))
    fig.update_layout(title="Sensor History", height=400,
                      yaxis2=dict(title="Humidity (%)", overlaying="y", side="right"))
    return fig
```

**🎯 Resultado esperado :** `make_history_chart(buffer.to_dataframe())` devuelve una figura con trazas de temperatura y humedad.

**🩹 Si sale mal :** Si el gráfico está vacío, el buffer aún no tiene datos.

### 3.3 Verifica los medidores y los gráficos

**✅ Lista de verificación**

- ✅ `make_gauge` devuelve una figura de medidor de Plotly.
- ✅ `DataBuffer` acumula lecturas y las recorta a `max_points`.
- ✅ `make_history_chart` devuelve una figura con dos trazas.

**🤔 Pregunta(s) socrática(s)**

- ¿Y si quisieras un promedio móvil de 5 minutos en lugar de la última lectura? ¿Cómo modificarías `DataBuffer`?
- ¿Para qué datos funcionaría mejor un solo eje Y que ejes duales?

## Paso 4: Conecta los callbacks y ejecuta la app

### 4.1 Escribe los callbacks

**👟 Pista inicial :** Crea el callback que conecta el tick del intervalo con las actualizaciones de los medidores.

```python
# dashboard/callbacks.py (continued)
from dash import Input, Output
from dashboard.simulator import SensorSimulator, SAMPLE_DEVICES

simulator = SensorSimulator([dict(d) for d in SAMPLE_DEVICES])
buffer = DataBuffer()

def register_callbacks(app):
    @app.callback(
        [Output("temp-gauge", "figure"), Output("humidity-gauge", "figure"),
         Output("battery-gauge", "figure"), Output("history-chart", "figure")],
        [Input("interval", "n_intervals"), Input("location-filter", "value")],
    )
    def update_dashboard(n, location_filter):
        readings = simulator.tick()
        buffer.add(readings)
        if location_filter and location_filter != "all":
            readings = [r for r in readings if r.location == location_filter]
        avg_t = sum(r.temperature for r in readings) / len(readings) if readings else 0
        avg_h = sum(r.humidity for r in readings) / len(readings) if readings else 0
        avg_b = sum(r.battery for r in readings) / len(readings) if readings else 0
        return (make_gauge(avg_t, "Temp", -10, 50, "°C"),
                make_gauge(avg_h, "Humidity", 0, 100, "%"),
                make_gauge(avg_b, "Battery", 0, 100, "%"),
                make_history_chart(buffer.to_dataframe()))
```

**🎯 Resultado esperado :** Los medidores se actualizan cada segundo; el gráfico acumula datos con el tiempo.

**🩹 Si sale mal :** Si los callbacks no se disparan, revisa que los IDs de los componentes coincidan entre el diseño y el callback.

### 4.2 Crea el punto de entrada de la app

```python
# dashboard/app.py
import dash
import dash_bootstrap_components as dbc
from dashboard.layout import create_layout
from dashboard.callbacks import register_callbacks

app = dash.Dash(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP])
app.layout = create_layout()
register_callbacks(app)

if __name__ == "__main__":
    app.run(debug=True, port=8050)
```

**🎯 Resultado esperado :** Ejecutar `uv run python -m dashboard.app` inicia un servidor en `http://localhost:8050` con medidores de actualización en vivo.

**🩹 Si sale mal :** Si el puerto 8050 está en uso, cámbialo.

### 4.3 Verifica el panel

**✅ Lista de verificación**

- ✅ `uv run python -m dashboard.app` inicia en `http://localhost:8050`.
- ✅ Los medidores se actualizan cada segundo con valores cambiantes.
- ✅ El gráfico acumula puntos de datos con el tiempo.
- ✅ El menú desplegable de ubicación filtra los medidores.

**🤔 Pregunta(s) socrática(s)**

- El panel se ejecuta en memoria. ¿Cómo persistirías las lecturas en SQLite para que los datos sobrevivan a los reinicios?
- ¿Con cuántos sensores necesitarías mover la simulación a un proceso separado?

## ⚠️ Errores comunes

- **IDs de callback que no coinciden.** Cada ID de `Input`/`Output` debe coincidir exactamente con la propiedad `id` de un componente. Un error tipográfico desactiva el callback en silencio.
- **Importar módulos obsoletos.** `dash_core_components` y `dash_html_components` ahora están dentro de `dash` — importa desde `dash` directamente.
- **Crecimiento de memoria sin límite.** El `DataBuffer` recorta los datos antiguos a `max_points`. Sin el recorte, la memoria del panel crecería para siempre.
- **Bloquear el hilo principal.** Los callbacks de Dash se ejecutan de forma síncrona. Un callback lento (como una consulta de base de datos) congela todo el panel. Usa `dcc.Interval` con criterio y mantén los callbacks rápidos.
- **Olvidar `debug=True` durante el desarrollo.** Sin él, los errores de los callbacks son silenciosos — el panel simplemente deja de actualizarse. Desarrolla siempre con el modo de depuración activado.

## Lo que acabas de construir

Un panel de monitoreo IoT en tiempo real: un simulador de sensores que produce patrones de datos realistas, medidores de Plotly con actualización en vivo, un gráfico de series temporales histórico con ejes duales y filtrado por ubicación. La arquitectura de callbacks de Dash — donde cada interacción del usuario dispara una función que devuelve figuras actualizadas — es el mismo patrón que se usa en los paneles de producción para monitoreo, análisis y sistemas de control.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/iot-dashboard/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/iot-dashboard) en el repositorio del curso tiene una versión más rica con más tipos de sensores, indicadores de alerta y el CLI conectado de principio a fin. Clónalo, o abre el repositorio completo en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde allí.
:::

## A dónde ir desde aquí

- Añade integración MQTT para que el panel lea datos reales de sensores de un broker MQTT en lugar del simulador.
- Implementa umbrales de alerta: muestra una advertencia cuando la temperatura supere un límite configurable.
- Construye un botón de exportación CSV que descargue los datos históricos para análisis fuera de línea.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que te sientas orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene una guía completa y apta para principiantes sobre cómo añadir el tuyo mediante una **pull request**, incluso si nunca has usado git: hacer un fork del repositorio, crear una rama, hacer commit de tus archivos y abrir la PR, paso a paso. No se asume ninguna experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓