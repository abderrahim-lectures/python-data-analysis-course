---
title: "Tableau de Bord IoT"
description: "Tableau de bord en temps réel pour surveiller les appareils IoT avec jauges, graphiques et vues cartographiques."
difficulty: "intermediate"
estimatedMinutes: 55
tags: ["iot", "data-viz", "async"]
learningObjectives:
  - "Simuler des flux de données de capteurs IoT avec des schémas réalistes"
  - "Construire des jauges et compteurs à mise à jour en direct avec Dash"
  - "Créer des graphiques de séries temporelles historiques pour les tendances des capteurs"
  - "Implémenter le regroupement et le filtrage des appareils par type ou emplacement"
prerequisites: ["Python 101", "Analyse de Données"]
---

# 📊 Construire un Tableau de Bord IoT

Un système IoT sans tableau de bord, c'est comme une voiture sans compteur de vitesse, les données existent, mais personne ne peut les voir. Ce projet construit un tableau de bord de surveillance en temps réel avec Dash et Plotly : tu simules des flux de données de capteurs, tu rends des jauges en direct qui se mettent à jour chaque seconde, tu traces les tendances historiques comme graphiques de séries temporelles et tu groupes les appareils par type ou emplacement. Le tableau de bord s'exécute dans ton navigateur et se rafraîchit automatiquement.

Cela suppose Python 101 et l'aisance avec pandas issu de Analyse de Données, rien de plus. C'est optionnel et non noté ; voir [Projets du monde réel](/fr/projets) pour la liste complète.

## 🎯 Ce que tu vas faire

1. Mettre en place un projet avec `uv` et installer les dépendances du tableau de bord.
2. Simuler des données de capteurs IoT avec des schémas réalistes de température, d'humidité et de batterie.
3. Construire une mise en page Dash avec des jauges et compteurs à mise à jour en direct.
4. Créer des graphiques de séries temporelles historiques qui suivent les lectures de capteurs au fil du temps.
5. Implémenter le regroupement et le filtrage des appareils par type ou emplacement.
6. Câbler le tout dans une application de tableau de bord exécutable.

## Où exécuter ceci

**En local avec `uv`** est le chemin principal, c'est un serveur web qui tourne sur `localhost` et s'ouvre dans ton navigateur.

**Google Colab, Kaggle Notebooks et Binder** peuvent exécuter le serveur pour des tests, mais l'URL du tableau de bord ne sera pas accessible depuis l'extérieur du notebook.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/iot-dashboard/notebook.fr.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/iot-dashboard/notebook.fr.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fiot-dashboard%2Fnotebook.fr.ipynb)

## Configuration

Tout ce dont tu as besoin avant de construire : un environnement Python, Dash et Plotly.

### Installe `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Ferme et rouvre ton terminal, puis confirme :

```bash
uv --version
```

### Met en place le projet

```bash
uv init iot-dashboard
cd iot-dashboard
uv add dash plotly pandas
```

`dash` est le framework de Plotly pour les tableaux de bord interactifs. `plotly` fournit les composants de graphiques. `pandas` gère les données de séries temporelles.

### Crée la structure du projet

```bash
mkdir -p dashboard
touch dashboard/__init__.py dashboard/simulator.py dashboard/layout.py dashboard/callbacks.py dashboard/app.py
```

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `iot-dashboard/` existe avec un `pyproject.toml`, et `dash`, `plotly` et `pandas` sont installés.
- ✅ Le répertoire `dashboard/` a tous les fichiers de modules requis.

## Étape 1 : Simule les données de capteurs IoT

Les vraies données IoT ont des schémas : la température monte le jour et descend la nuit, l'humidité est inversement corrélée à la température, et les niveaux de batterie déclinent lentement. Simuler ces schémas rend le tableau de bord réaliste.

### 1.1 Crée le simulateur de données

**👟 Indice de départ :** Crée `dashboard/simulator.py` avec une classe qui génère des lectures de capteurs réalistes.

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

L'onde sinusoïdale produit un schéma de température diurne. Le bruit ajoute une variabilité au niveau du capteur. La batterie décline lentement à chaque tick.

**🎯 Résultat attendu :** `SensorSimulator(SAMPLE_DEVICES).tick()` retourne 4 lectures avec des valeurs réalistes.

**🩹 Si ça ne marche pas :** Si la température est toujours la même, `tick_count` n'avance pas. Si la batterie est toujours à 100, le `dev.get("battery")` ne se met pas à jour.

### 1.2 Vérifie le simulateur

**✅ Liste de vérification**

- ✅ `tick()` retourne une `SensorReading` par appareil.
- ✅ Les valeurs de température changent entre les ticks.
- ✅ Les valeurs de batterie diminuent lentement.

**🤔 Question(s) socratique(s)**

- Si tu voulais simuler une latence réseau où certains capteurs rapportent en retard, comment ajouterais-tu un paramètre de délai à certains appareils ?
- Comment rendrais-tu la vitesse de la simulation configurable pour qu'une « journée » complète passe en 10 secondes ou en 10 minutes ?

## Étape 2 : Construis la mise en page Dash

Les mises en page Dash sont des arbres de composants. Cette étape crée la mise en page principale avec un titre, un sélecteur d'appareils, une rangée de jauges et une zone de graphique.

### 2.1 Crée la mise en page

**👟 Indice de départ :** Crée `dashboard/layout.py`.

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

Le `dcc.Interval` se déclenche chaque seconde, provoquant les mises à jour des jauges et du graphique. Chaque jauge occupe un tiers de la largeur grâce aux colonnes Bootstrap.

**🎯 Résultat attendu :** `create_layout()` retourne un arbre de composants qui se rend comme un titre, un menu déroulant, trois jauges et un graphique.

**🩹 Si ça ne marche pas :** Si les jauges n'apparaissent pas, elles ont besoin d'une propriété `figure` issue des callbacks. Si la mise en page casse, vérifie que `dbc` est importé.

### 2.2 Vérifie la mise en page

**✅ Liste de vérification**

- ✅ La mise en page a un titre, un menu déroulant, trois conteneurs de jauges et un conteneur de graphique.
- ✅ `dcc.Interval` est réglé pour un rafraîchissement chaque seconde.

**🤔 Question(s) socratique(s)**

- Si tu avais 20 capteurs, la rangée de jauges ne tiendrait pas. Comment rendrais-tu la mise en page responsive ?
- Comment remplirais-tu dynamiquement le menu déroulant depuis la liste d'appareils ?

## Étape 3 : Crée les jauges en direct et les graphiques historiques

### 3.1 Construis les figures de jauges

**👟 Indice de départ :** Crée les fonctions de jauges dans `dashboard/callbacks.py`.

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

**🎯 Résultat attendu :** `make_gauge(22.5, "Temperature", -10, 50, "°C")` retourne une figure de jauge Plotly.

**🩹 Si ça ne marche pas :** Si la jauge ne se rend pas, vérifie que `mode` inclut `"gauge"`.

### 3.2 Construis le graphique historique

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

**🎯 Résultat attendu :** `make_history_chart(buffer.to_dataframe())` retourne une figure avec des traces de température et d'humidité.

**🩹 Si ça ne marche pas :** Si le graphique est vide, le buffer n'a pas encore de données.

### 3.3 Vérifie les jauges et graphiques

**✅ Liste de vérification**

- ✅ `make_gauge` retourne une figure de jauge Plotly.
- ✅ `DataBuffer` accumule les lectures et les rogne à `max_points`.
- ✅ `make_history_chart` retourne une figure avec deux traces.

**🤔 Question(s) socratique(s)**

- Et si tu voulais une moyenne glissante de 5 minutes au lieu de la dernière lecture ? Comment modifierais-tu `DataBuffer` ?
- Pour quelles données un seul axe y fonctionnerait-il mieux que des axes doubles ?

## Étape 4 : Câble les callbacks et exécute l'application

### 4.1 Écris les callbacks

**👟 Indice de départ :** Crée le callback qui relie le tick de l'intervalle aux mises à jour des jauges.

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

**🎯 Résultat attendu :** Les jauges se mettent à jour chaque seconde ; le graphique accumule des données au fil du temps.

**🩹 Si ça ne marche pas :** Si les callbacks ne se déclenchent pas, vérifie que les IDs des composants correspondent entre la mise en page et le callback.

### 4.2 Crée le point d'entrée de l'application

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

**🎯 Résultat attendu :** Exécuter `uv run python -m dashboard.app` démarre un serveur à `http://localhost:8050` avec des jauges à mise à jour en direct.

**🩹 Si ça ne marche pas :** Si le port 8050 est occupé, change-le.

### 4.3 Vérifie le tableau de bord

**✅ Liste de vérification**

- ✅ `uv run python -m dashboard.app` démarre à `http://localhost:8050`.
- ✅ Les jauges se mettent à jour chaque seconde avec des valeurs changeantes.
- ✅ Le graphique accumule des points de données au fil du temps.
- ✅ Le menu déroulant d'emplacement filtre les jauges.

**🤔 Question(s) socratique(s)**

- Le tableau de bord s'exécute en mémoire. Comment persisterais-tu les lectures dans SQLite pour que les données survivent aux redémarrages ?
- À partir de quel nombre de capteurs aurais-tu besoin de déplacer la simulation vers un processus séparé ?

## ⚠️ Pièges courants

- **Inadéquation des IDs de callbacks.** Chaque ID `Input`/`Output` doit correspondre exactement à la propriété `id` d'un composant. Une faute de frappe désactive silencieusement le callback.
- **Importer des modules obsolètes.** `dash_core_components` et `dash_html_components` sont maintenant dans `dash`, importe depuis `dash` directement.
- **Croissance mémoire illimitée.** Le `DataBuffer` rogne les anciennes données à `max_points`. Sans rognage, la mémoire du tableau de bord ne cesse de croître.
- **Bloquer le thread principal.** Les callbacks Dash s'exécutent de façon synchrone. Un callback lent (comme une requête de base de données) fige tout le tableau de bord. Utilise `dcc.Interval` judicieusement et garde les callbacks rapides.
- **Oublier `debug=True` pendant le développement.** Sans lui, les erreurs de callbacks sont silencieuses, le tableau de bord cesse simplement de se mettre à jour. Développe toujours avec le mode debug activé.

## Ce que tu viens de construire

Un tableau de bord de surveillance IoT en temps réel : un simulateur de capteurs qui produit des schémas de données réalistes, des jauges Plotly à mise à jour en direct, un graphique de séries temporelles historiques à axes doubles et un filtrage par emplacement. L'architecture de callbacks Dash, où chaque interaction utilisateur déclenche une fonction qui retourne des figures mises à jour, est le même schéma utilisé dans les tableaux de bord de production pour la surveillance, l'analytique et les systèmes de contrôle.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/iot-dashboard/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/iot-dashboard) dans le dépôt du cours a une version plus riche avec plus de types de capteurs, des indicateurs d'alerte et le CLI câblé de bout en bout. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le depuis là.
:::

## Où aller à partir d'ici

- Ajoute l'intégration MQTT pour que le tableau de bord lise de vraies données de capteurs depuis un courtier MQTT au lieu du simulateur.
- Implémente des seuils d'alerte : fais clignoter un avertissement quand la température dépasse une limite configurable.
- Construis un bouton d'export CSV qui télécharge les données historiques pour une analyse hors ligne.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves, et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓