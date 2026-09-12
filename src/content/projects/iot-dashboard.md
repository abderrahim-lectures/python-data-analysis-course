---
title: "Build an IoT Dashboard"
description: "Build a real-time dashboard for monitoring IoT sensor data with live gauges, historical charts, and device grouping."
difficulty: "intermediate"
estimatedMinutes: 55
tags: ["iot", "data-viz", "async"]
learningObjectives:
  - "Simulate IoT sensor data streams with realistic patterns"
  - "Build live-updating gauges and meters using Dash"
  - "Create historical time-series charts for sensor trends"
  - "Implement device grouping and filtering by type or location"
prerequisites: ["Python 101", "Data Analysis"]
---

# 📊 Build an IoT Dashboard

An IoT system without a dashboard is like a car without a speedometer, the data exists, but nobody can see it. This project builds a real-time monitoring dashboard using Dash and Plotly: you simulate sensor data streams, render live gauges that update every second, plot historical trends as time-series charts, and group devices by type or location. The dashboard runs in your browser and refreshes automatically.

This assumes Python 101 and comfort with pandas from Data Analysis, nothing beyond. Optional and ungraded; see [Real-World Projects](/projects) for the full list.

## 🎯 What you'll do

1. Set up a project with `uv` and install the dashboard dependencies.
2. Simulate IoT sensor data with realistic temperature, humidity, and battery patterns.
3. Build a Dash layout with live-updating gauges and meters.
4. Create historical time-series charts that track sensor readings over time.
5. Implement device grouping and filtering by type or location.
6. Wire everything into a runnable dashboard application.

## Where to run this

**Locally with `uv`** is the primary path, this is a web server that runs on `localhost` and opens in your browser.

**Google Colab, Kaggle Notebooks, and Binder** can run the server for testing, but the dashboard URL won't be accessible from outside the notebook.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/iot-dashboard/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/iot-dashboard/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fiot-dashboard%2Fnotebook.ipynb)

## Setup

Everything you need before building: a Python environment, Dash, and Plotly.

### Install `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Close and reopen your terminal, then confirm:

```bash
uv --version
```

### Scaffold the project

```bash
uv init iot-dashboard
cd iot-dashboard
uv add dash plotly pandas
```

`dash` is Plotly's framework for interactive dashboards. `plotly` provides the chart components. `pandas` handles the time-series data.

### Create the project structure

```bash
mkdir -p dashboard
touch dashboard/__init__.py dashboard/simulator.py dashboard/layout.py dashboard/callbacks.py dashboard/app.py
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `iot-dashboard/` exists with a `pyproject.toml`, and `dash`, `plotly`, and `pandas` are installed.
- ✅ The `dashboard/` directory has all required module files.

## Step 1: Simulate IoT sensor data

Real IoT data has patterns: temperature rises during the day and falls at night, humidity inversely correlates with temperature, and battery levels slowly decline. Simulating these patterns makes the dashboard look realistic.

### 1.1 Create the data simulator

**👟 Starter hint:** Create `dashboard/simulator.py` with a class that generates realistic sensor readings.

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

The sine wave produces a diurnal temperature pattern. Noise adds sensor-level variability. Battery slowly declines each tick.

**🎯 Expected output:** `SensorSimulator(SAMPLE_DEVICES).tick()` returns 4 readings with realistic values.

**🩹 If it's off:** If temperature is always the same, `tick_count` isn't advancing. If battery is always 100, the `dev.get("battery")` isn't updating.

### 1.2 Verify the simulator

**✅ Checklist**

- ✅ `tick()` returns one `SensorReading` per device.
- ✅ Temperature values change between ticks.
- ✅ Battery values slowly decrease.

**🤔 Socratic Question(s)**

- If you wanted to simulate network latency where some sensors report late, how would you add a delay parameter to certain devices?
- How would you make the simulation speed configurable so a full "day" passes in 10 seconds or 10 minutes?

## Step 2: Build the Dash layout

Dash layouts are component trees. This step creates the main layout with a title, device selector, gauge row, and chart area.

### 2.1 Create the layout

**👟 Starter hint:** Create `dashboard/layout.py`.

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

The `dcc.Interval` fires every 1 second, triggering gauge and chart updates. Each gauge gets one-third width via Bootstrap columns.

**🎯 Expected output:** `create_layout()` returns a component tree rendering as a title, dropdown, three gauges, and a chart.

**🩹 If it's off:** If gauges don't appear, they need a `figure` prop from callbacks. If the layout breaks, check `dbc` is imported.

### 2.2 Verify the layout

**✅ Checklist**

- ✅ Layout has title, dropdown, three gauge containers, and a chart container.
- ✅ `dcc.Interval` is set for 1-second refresh.

**🤔 Socratic Question(s)**

- If you had 20 sensors, the gauge row wouldn't fit. How would you make the layout responsive?
- How would you dynamically populate the dropdown from the device list?

## Step 3: Create live gauges and historical charts

### 3.1 Build the gauge figures

**👟 Starter hint:** Create gauge functions in `dashboard/callbacks.py`.

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

**🎯 Expected output:** `make_gauge(22.5, "Temperature", -10, 50, "°C")` returns a Plotly gauge figure.

**🩹 If it's off:** If the gauge doesn't render, check the `mode` includes `"gauge"`.

### 3.2 Build the historical chart

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

**🎯 Expected output:** `make_history_chart(buffer.to_dataframe())` returns a figure with temperature and humidity traces.

**🩹 If it's off:** If the chart is empty, the buffer has no data yet.

### 3.3 Verify gauges and charts

**✅ Checklist**

- ✅ `make_gauge` returns a Plotly gauge figure.
- ✅ `DataBuffer` accumulates readings and trims to `max_points`.
- ✅ `make_history_chart` returns a figure with two traces.

**🤔 Socratic Question(s)**

- What if you wanted a 5-minute rolling average instead of the latest reading? How would you modify `DataBuffer`?
- For what data would a single y-axis work better than dual axes?

## Step 4: Wire callbacks and run the app

### 4.1 Write the callbacks

**👟 Starter hint:** Create the callback that connects the interval tick to gauge updates.

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

**🎯 Expected output:** Gauges update every second; the chart accumulates data over time.

**🩹 If it's off:** If callbacks don't fire, check that component IDs match between layout and callback.

### 4.2 Create the app entry point

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

**🎯 Expected output:** Running `uv run python -m dashboard.app` starts a server at `http://localhost:8050` with live-updating gauges.

**🩹 If it's off:** If port 8050 is in use, change it.

### 4.3 Verify the dashboard

**✅ Checklist**

- ✅ `uv run python -m dashboard.app` starts at `http://localhost:8050`.
- ✅ Gauges update every second with changing values.
- ✅ The chart accumulates data points over time.
- ✅ The location dropdown filters the gauges.

**🤔 Socratic Question(s)**

- The dashboard runs in memory. How would you persist readings to SQLite so data survives restarts?
- At what sensor count would you need to move the simulation to a separate process?

## ⚠️ Common pitfalls

- **Callback ID mismatches.** Every `Input`/`Output` ID must exactly match a component's `id` prop. A typo silently disables the callback.
- **Importing deprecated modules.** `dash_core_components` and `dash_html_components` are now inside `dash`, import from `dash` directly.
- **Unbounded memory growth.** The `DataBuffer` trims old data to `max_points`. Without trimming, the dashboard's memory grows forever.
- **Blocking the main thread.** Dash callbacks run synchronously. A slow callback (like a database query) freezes the entire dashboard. Use `dcc.Interval` wisely and keep callbacks fast.
- **Forgetting `debug=True` during development.** Without it, callback errors are silent, the dashboard just stops updating. Always develop with debug mode on.

## What you just built

A real-time IoT monitoring dashboard: a sensor simulator that produces realistic data patterns, live-updating Plotly gauges, a historical time-series chart with dual axes, and location-based filtering. The Dash callback architecture, where every user interaction triggers a function that returns updated figures, is the same pattern used in production dashboards for monitoring, analytics, and control systems.

:::tip[Run a fuller version without any local setup]
[`examples/iot-dashboard/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/iot-dashboard) in the course repo has a richer version with more sensor types, alert indicators, and the CLI wired up end to end. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Add MQTT integration so the dashboard reads real sensor data from an MQTT broker instead of the simulator.
- Implement alert thresholds: flash a warning when temperature exceeds a configurable limit.
- Build a CSV export button that downloads the historical data for offline analysis.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓
