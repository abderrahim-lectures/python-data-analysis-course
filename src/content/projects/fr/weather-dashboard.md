---
title: "Tableau de Bord Météo"
description: "Construis un CLI Python qui récupère de vraies données météo, les analyse avec pandas, les visualise avec matplotlib et affiche un tableau de bord terminal soigné."
difficulty: beginner
estimatedMinutes: 45
xpReward: 50
tags: ["APIs", "matplotlib", "pandas", "data-visualization"]
learningObjectives:
  - "Récupérer et parser des données JSON depuis une API REST publique"
  - "Transformer les réponses d'API en DataFrames pandas pour l'analyse"
  - "Convertir entre les unités de température (Celsius, Fahrenheit, Kelvin)"
  - "Calculer des statistiques descriptives à partir de données réelles"
  - "Construire des graphiques en courbes et en barres avec matplotlib"
  - "Formater la sortie terminal avec couleurs et alignement"
prerequisites:
  - "Bases de Python (variables, boucles, fonctions, dictionnaires)"
  - "Pandas et matplotlib de base"
---

# Tableau de Bord Météo

Construis un tableau de bord terminal qui récupère des données météo en temps réel depuis l'API Open-Meteo, les traite avec pandas, dessine des graphiques avec matplotlib et affiche un résumé hebdomadaire coloré. Chaque étape te fournit du code fonctionnel que tu peux exécuter immédiatement.

- **Exécutez-le dans le navigateur.** Un compagnon notebook interactif est prêt — ouvrez-le dans Colab, Kaggle ou Binder et suivez les étapes dans l'ordre.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/weather-dashboard/notebook.fr.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/weather-dashboard/notebook.fr.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fweather-dashboard%2Fnotebook.fr.ipynb)

## 🎯 Ce que tu vas faire

Un script Python qui :

- Récupère une prévision sur 7 jours depuis une API météo gratuite et sans clé API
- Parse le JSON en un DataFrame pandas
- Convertit les températures entre Celsius, Fahrenheit et Kelvin
- Calcule les statistiques quotidiennes min, max, moyenne et humidité
- Trace un graphique en courbes des températures horaires et un graphique en barres des conditions quotidiennes
- Affiche un résumé hebdomadaire formaté avec des indicateurs de température colorés

## Configuration

```bash
uv init weather-dashboard
cd weather-dashboard
uv add requests pandas matplotlib
```

Tu as besoin d'une connexion internet pour la première exécution. Après cela, tu peux réutiliser les données sauvegardées.

---

## Étape 1 — Récupérer les données météo depuis Open-Meteo

**Objectif :** Appeler une API REST publique, gérer la réponse et traiter les erreurs avec grâce.

**Concept :** L'API Open-Meteo est gratuite et ne nécessite aucune clé API. Tu envoies la latitude et la longitude comme paramètres de requête et tu reçois un objet JSON avec les conditions actuelles et les prévisions. Nous utilisons la bibliothèque `requests` pour faire l'appel HTTP et appelons `.json()` pour parser la réponse.

```python
import requests

def fetch_weather(lat, lon):
    """Fetch 7-day weather forecast from Open-Meteo."""
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current_weather": True,
        "daily": (
            "temperature_2m_max,temperature_2m_min,"
            "apparent_temperature_max,apparent_temperature_min,"
            "precipitation_sum,weathercode"
        ),
        "hourly": "temperature_2m,relativehumidity_2m",
        "timezone": "auto",
    }

    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.Timeout:
        print("Error: The request timed out. Try again later.")
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect. Check your internet.")
    except requests.exceptions.HTTPError as e:
        print(f"Error: API returned {e.response.status_code}")

    return None

# Fetch weather for Berlin
data = fetch_weather(52.52, 13.41)

if data:
    current = data["current_weather"]
    print(f"Current temperature: {current['temperature']}°C")
    print(f"Wind speed: {current['windspeed']} km/h")
```

**Résultat attendu :**

```
Current temperature: 18.3°C
Wind speed: 12.5 km/h
```

**Si ça ne marche pas :**

- `ConnectionError` — Tu es hors ligne. Connecte-toi à internet ou exécute ceci plus tard.
- `Timeout` — Le serveur était lent. Augmente la valeur du timeout ou réessaie.
- Données `None` — L'API a retourné une forme inattendue. Affiche `data` pour inspecter le JSON brut.
- Mauvaise ville — Vérifie la latitude et la longitude. Utilise [latlong.net](https://www.latlong.net/) pour trouver les coordonnées.

---

## Étape 2 — Parser le JSON en un DataFrame

**Objectif :** Convertir la réponse JSON imbriquée en un DataFrame pandas plat que tu peux analyser.

**Concept :** Les réponses d'API arrivent sous forme de dictionnaires imbriqués. Les DataFrames pandas attendent des données tabulaires (lignes et colonnes). Nous extrayons les clés `daily` et construisons un DataFrame avec une ligne par jour.

```python
import pandas as pd

def parse_daily_forecast(data):
    """Parse daily forecast JSON into a DataFrame."""
    if not data or "daily" not in data:
        print("No daily forecast data found.")
        return pd.DataFrame()

    daily = data["daily"]
    df = pd.DataFrame({
        "date": pd.to_datetime(daily["time"]),
        "temp_max": daily["temperature_2m_max"],
        "temp_min": daily["temperature_2m_min"],
        "feels_max": daily["apparent_temperature_max"],
        "feels_min": daily["apparent_temperature_min"],
        "precip_mm": daily["precipitation_sum"],
        "weathercode": daily["weathercode"],
    })

    return df

forecast = parse_daily_forecast(data)
print(forecast.to_string(index=False))
```

**Résultat attendu :**

```
       date  temp_max  temp_min  feels_max  feels_min  precip_mm  weathercode
 2026-09-06      22.1      14.3       21.5       13.8        0.0            1
 2026-09-07      24.8      15.1       24.2       14.5        0.0            2
 2026-09-08      19.6      13.7       18.9       12.9        2.3           61
 2026-09-09      21.3      12.4       20.7       11.8        0.0            3
 2026-09-10      23.7      13.9       23.1       13.3        0.0            1
 2026-09-11      25.2      14.8       24.6       14.1        0.0            0
 2026-09-12      20.4      11.6       19.8       11.0        5.1           63
```

**Si ça ne marche pas :**

- `KeyError` — L'API a changé ses noms de champs. Affiche `data["daily"].keys()` pour voir ce qui est disponible.
- Les dates semblent fausses — L'API retourne des chaînes ; `pd.to_datetime()` les convertit. Si le parsing échoue, vérifie le format avec `data["daily"]["time"][:1]`.
- DataFrame vide — L'API n'a pas retourné de clé `daily`. Vérifie que `"daily"` est inclus dans les paramètres de ta requête.

---

## Étape 3 — Ajouter les conversions de température

**Objectif :** Ajouter des colonnes Fahrenheit et Kelvin pour que le tableau de bord fonctionne pour tout public.

**Concept :** Les formules de conversion sont de simples mathématiques. Celsius en Fahrenheit : `(C × 9/5) + 32`. Celsius en Kelvin : `C + 273.15`. Nous appliquons cela avec les opérations vectorisées de pandas, qui sont plus rapides que les boucles.

```python
def add_temp_conversions(df):
    """Add Fahrenheit and Kelvin columns for max and min temperatures."""
    df = df.copy()

    df["temp_max_f"] = df["temp_max"] * 9 / 5 + 32
    df["temp_min_f"] = df["temp_min"] * 9 / 5 + 32

    df["temp_max_k"] = df["temp_max"] + 273.15
    df["temp_min_k"] = df["temp_min"] + 273.15

    return df

forecast = add_temp_conversions(forecast)
print(forecast[["date", "temp_max", "temp_max_f", "temp_max_k"]].to_string(index=False))
```

**Résultat attendu :**

```
       date  temp_max  temp_max_f  temp_max_k
 2026-09-06      22.1       71.78      295.25
 2026-09-07      24.8       76.64      297.95
 2026-09-08      19.6       67.28      292.75
 2026-09-09      21.3       70.34      294.45
 2026-09-10      23.7       74.66      296.85
 2026-09-11      25.2       77.36      298.35
 2026-09-12      20.4       68.72      293.55
```

**Si ça ne marche pas :**

- Les valeurs semblent interverties — Vérifie quelle colonne tu convertis. `temp_max` devrait correspondre à `temp_max_f`, pas `temp_min_f`.
- Les décimales sont fausses — L'arrondi en virgule flottante est normal. Utilise `.round(1)` si tu veux moins de décimales.
- `SettingWithCopyWarning` — Utilise toujours `.copy()` avant de modifier une tranche d'un DataFrame.

---

## Étape 4 — Calculer les statistiques quotidiennes

**Objectif :** Calculer des statistiques de résumé pour pouvoir décrire une prévision en une phrase.

**Concept :** Pandas a des méthodes d'agrégation intégrées : `.min()`, `.max()`, `.mean()`. Nous combinons celles-ci en une seule ligne de statistiques. Nous mappons aussi les codes météo en descriptions lisibles par un humain.

```python
WEATHER_CODES = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Depositing rime fog",
    51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
    61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
    80: "Slight showers", 81: "Moderate showers", 82: "Violent showers",
    95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Severe thunderstorm",
}

def calc_statistics(df):
    """Calculate summary statistics for the forecast period."""
    stats = {
        "period_high_c": df["temp_max"].max(),
        "period_low_c": df["temp_min"].min(),
        "avg_high_c": df["temp_max"].mean(),
        "avg_low_c": df["temp_min"].mean(),
        "total_precip_mm": df["precip_mm"].sum(),
        "rainy_days": (df["precip_mm"] > 0).sum(),
    }

    stats["period_high_f"] = stats["period_high_c"] * 9 / 5 + 32
    stats["period_low_f"] = stats["period_low_c"] * 9 / 5 + 32

    most_common_code = df["weathercode"].mode()[0]
    stats["most_common_weather"] = WEATHER_CODES.get(most_common_code, "Unknown")

    return stats

stats = calc_statistics(forecast)

print(f"Period high:  {stats['period_high_c']}°C ({stats['period_high_f']:.1f}°F)")
print(f"Period low:   {stats['period_low_c']}°C ({stats['period_low_f']:.1f}°F)")
print(f"Avg high:     {stats['avg_high_c']:.1f}°C")
print(f"Avg low:      {stats['avg_low_c']:.1f}°C")
print(f"Total precip: {stats['total_precip_mm']} mm over {stats['rainy_days']} rainy day(s)")
print(f"Most common:  {stats['most_common_weather']}")
```

**Résultat attendu :**

```
Period high:  25.2°C (77.4°F)
Period low:   11.6°C (52.9°F)
Avg high:     22.4°C
Avg low:      13.7°C
Total precip: 7.4 mm over 2 rainy day(s)
Most common:  Mainly clear
```

**Si ça ne marche pas :**

- `NaN` dans les résultats — Certains champs peuvent être `None` dans le JSON. Utilise `.fillna(0)` avant de calculer les statistiques.
- Le mode retourne le mauvais code — S'il y a une égalité, `mode()` retourne la première valeur. C'est acceptable pour un résumé.
- Les précipitations sont toujours à 0 — Pas toutes les régions ont des données de précipitations. Vérifie `data["daily"].keys()` pour confirmer que `precipitation_sum` existe.

---

## Étape 5 — Construire les visualisations

**Objectif :** Créer un graphique en courbes des températures horaires et un graphique en barres des conditions quotidiennes.

**Concept :** Matplotlib construit les graphiques en couches : figure, axes, appels de tracé, étiquettes et disposition. Nous traçons les données horaires pour les 48 premières heures en graphique en courbes, et les hauteurs/basses quotidiennes en graphique en barres groupé.

```python
import matplotlib.pyplot as plt
import matplotlib.dates as mdates

def plot_hourly_temperature(data):
    """Plot 48 hours of hourly temperature as a line chart."""
    hourly = data["hourly"]
    times = pd.to_datetime(hourly["time"])[:48]
    temps = hourly["temperature_2m"][:48]

    fig, ax = plt.subplots(figsize=(10, 4))
    ax.plot(times, temps, marker="o", markersize=3, linewidth=1.5, color="#2196F3")
    ax.fill_between(times, temps, alpha=0.15, color="#2196F3")

    ax.set_title("Hourly Temperature — 48 Hour Forecast", fontsize=13, fontweight="bold")
    ax.set_ylabel("Temperature (°C)")
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%b %d\n%H:%M"))
    ax.grid(axis="y", alpha=0.3)
    fig.tight_layout()
    plt.savefig("hourly_temperature.png", dpi=150)
    plt.show()
    print("Saved: hourly_temperature.png")

plot_hourly_temperature(data)
```

```python
def plot_daily_comparison(df):
    """Plot daily high and low temperatures as a grouped bar chart."""
    fig, ax = plt.subplots(figsize=(10, 4))

    x = range(len(df))
    width = 0.35

    ax.bar([i - width / 2 for i in x], df["temp_max"], width, label="High", color="#FF7043")
    ax.bar([i + width / 2 for i in x], df["temp_min"], width, label="Low", color="#42A5F5")

    ax.set_title("Daily High vs Low — 7 Day Forecast", fontsize=13, fontweight="bold")
    ax.set_ylabel("Temperature (°C)")
    ax.set_xticks(list(x))
    ax.set_xticklabels(df["date"].dt.strftime("%b %d"), rotation=45, ha="right")
    ax.legend()
    ax.grid(axis="y", alpha=0.3)
    fig.tight_layout()
    plt.savefig("daily_comparison.png", dpi=150)
    plt.show()
    print("Saved: daily_comparison.png")

plot_daily_comparison(forecast)
```

**Résultat attendu :**

Deux fichiers de graphiques sauvegardés sur le disque et affichés si exécutés dans un notebook. Le graphique en courbes montre la courbe de température sur 48 heures. Le graphique en barres montre les barres côte à côte des hauteurs et basses pour chaque jour.

**Si ça ne marche pas :**

- Le graphique est vide — Appelle `plt.show()` après les commandes de tracé. Dans les scripts, tu peux avoir besoin de `plt.ion()` d'abord.
- `UserWarning` à propos des dates — Assure-toi d'avoir appelé `pd.to_datetime()` sur les chaînes de temps avant de tracer.
- Les barres se chevauchent — La largeur et le calcul du décalage doivent centrer les barres. Vérifie la compréhension de liste dans `ax.bar()`.
- La police paraît minuscule — Augmente `figsize` ou utilise `plt.rcParams["font.size"] = 12` avant de tracer.

---

## Étape 6 — Créer un résumé de prévision hebdomadaire

**Objectif :** Combiner le tout en un résumé texte formaté que tu peux lire en un coup d'œil.

**Concept :** Nous itérons sur chaque jour, en mappant le code météo à une description, et formatons les températures avec alignement. Cela transforme des données brutes en quelque chose qu'un humain lirait réellement.

```python
def format_daily_bar(temp_min, temp_max, bar_width=30):
    """Create a visual temperature bar for one day."""
    range_size = max(temp_max - temp_min, 1)
    filled = int(((temp_max + temp_min) / 2 - 5) / 35 * bar_width)
    filled = max(0, min(filled, bar_width))
    return "█" * filled + "░" * (bar_width - filled)

def print_weekly_summary(df):
    """Print a formatted weekly forecast summary."""
    print()
    print("  ┌──────────────────────────────────────────────────────────────────┐")
    print("  │                    WEEKLY FORECAST SUMMARY                      │")
    print("  ├──────────────────────────────────────────────────────────────────┤")

    for _, row in df.iterrows():
        day_name = row["date"].strftime("%a %b %d")
        code = row["weathercode"]
        weather_desc = WEATHER_CODES.get(code, "Unknown")
        bar = format_daily_bar(row["temp_min"], row["temp_max"])

        print(f"  │ {day_name}  {row['temp_min']:5.1f}°  {bar}  {row['temp_max']:5.1f}°  {weather_desc:<16}│")

    print("  └──────────────────────────────────────────────────────────────────┘")
    print()

print_weekly_summary(forecast)
```

**Résultat attendu :**

```
  ┌──────────────────────────────────────────────────────────────────┐
  │                    WEEKLY FORECAST SUMMARY                      │
  ├──────────────────────────────────────────────────────────────────┤
  │ Mon Sep 06   14.3°  ███████████████░░░░░░░░░░░░░░░   22.1°  Mainly clear    │
  │ Tue Sep 07   15.1°  █████████████████░░░░░░░░░░░░░   24.8°  Partly cloudy   │
  │ Wed Sep 08   13.7°  █████████████░░░░░░░░░░░░░░░░░   19.6°  Slight rain     │
  │ Thu Sep 09   12.4°  ████████████░░░░░░░░░░░░░░░░░░   21.3°  Overcast        │
  │ Fri Sep 10   13.9°  ██████████████░░░░░░░░░░░░░░░░   23.7°  Mainly clear    │
  │ Sat Sep 11   14.8°  █████████████████░░░░░░░░░░░░░   25.2°  Clear sky       │
  │ Sun Sep 12   11.6°  ██████████░░░░░░░░░░░░░░░░░░░░   20.4°  Moderate rain   │
  └──────────────────────────────────────────────────────────────────┘
```

**Si ça ne marche pas :**

- La barre semble fausse — Ajuste la formule de mise à l'échelle dans `format_daily_bar`. La formule mappe la température à la largeur de la barre.
- Les caractères de boîte sont désalignés — Utilise un terminal ou une police à chasse fixe. Les polices proportionnelles cassent le dessin de boîte.
- La description météo déborde — Raccourcis les descriptions ou élargis la boîte avec plus de tirets.

---

## Étape 7 — Ennoblir le CLI avec couleurs et légende

**Objectif :** Ajouter des indicateurs de température colorés et une légende des codes météo pour que le tableau de bord soit visuellement clair.

**Concept :** Les couleurs du terminal utilisent les codes d'échappement ANSI. Nous définissons des fonctions d'aide qui enveloppent le texte dans des codes couleur. Le vert signifie chaud, le bleu signifie froid, et le rouge signifie brûlant.

```python
def color_temp(temp_c):
    """Return colored string based on temperature."""
    if temp_c >= 30:
        return f"\033[91m{temp_c:5.1f}°C\033[0m"  # Red — hot
    elif temp_c >= 20:
        return f"\033[93m{temp_c:5.1f}°C\033[0m"  # Yellow — warm
    elif temp_c >= 10:
        return f"\033[92m{temp_c:5.1f}°C\033[0m"  # Green — mild
    else:
        return f"\033[94m{temp_c:5.1f}°C\033[0m"  # Blue — cold

def color_weather(code):
    """Return colored weather description."""
    if code in (95, 96, 99):
        return f"\033[91m⚠  {WEATHER_CODES.get(code, 'Unknown')}\033[0m"
    elif code in (61, 63, 65, 80, 81, 82):
        return f"\033[94m🌧  {WEATHER_CODES.get(code, 'Unknown')}\033[0m"
    elif code in (71, 73, 75):
        return f"\033[97m❄   {WEATHER_CODES.get(code, 'Unknown')}\033[0m"
    elif code in (0, 1):
        return f"\033[93m☀   {WEATHER_CODES.get(code, 'Unknown')}\033[0m"
    else:
        return f"\033[90m☁   {WEATHER_CODES.get(code, 'Unknown')}\033[0m"

def print_colored_dashboard(df, stats):
    """Print the final colored dashboard."""
    print()
    print("\033[1m  ╔═══════════════════════════════════════════════════════════════╗\033[0m")
    print("\033[1m  ║                    WEATHER DASHBOARD                        ║\033[0m")
    print("\033[1m  ╠═══════════════════════════════════════════════════════════════╣\033[0m")
    print(f"\033[1m  ║  High: {color_temp(stats['period_high_c'])}   Low: {color_temp(stats['period_low_c']):>20}  ║\033[0m")
    print(f"\033[1m  ║  Avg high: {color_temp(stats['avg_high_c'])}   Avg low: {color_temp(stats['avg_low_c']):>16}  ║\033[0m")
    print(f"\033[1m  ║  Precipitation: {stats['total_precip_mm']} mm   Rainy days: {stats['rainy_days']:<14}  ║\033[0m")
    print("\033[1m  ╠═══════════════════════════════════════════════════════════════╣\033[0m")

    for _, row in df.iterrows():
        day = row["date"].strftime("%a %b %d")
        hi = color_temp(row["temp_max"])
        lo = color_temp(row["temp_min"])
        wx = color_weather(row["weathercode"])
        print(f"\033[1m  ║\033[0m {day}  Low {lo}  High {hi}  {wx:<20} \033[1m║\033[0m")

    print("\033[1m  ╚═══════════════════════════════════════════════════════════════╝\033[0m")
    print()
    print("  Legend: \033[91mRed = Hot (30+)\033[0m  \033[93mYellow = Warm (20-29)\033[0m  \033[92mGreen = Mild (10-19)\033[0m  \033[94mBlue = Cold (<10)\033[0m")
    print()

print_colored_dashboard(forecast, stats)
```

**Résultat attendu :**

Un tableau de bord encadré avec des températures colorées et des icônes météo, similaire au résumé de l'Étape 6 mais avec des couleurs ANSI pour les terminals qui les supportent.

**Si ça ne marche pas :**

- Les couleurs s'affichent comme des codes d'échappement — Ton terminal ne supporte pas les couleurs ANSI. Utilise un terminal moderne (iTerm2, Windows Terminal, GNOME Terminal).
- Désalignement de la boîte — Reste avec des polices à chasse fixe. Chaque ligne à l'intérieur de la boîte doit avoir la même largeur visuelle.
- Couleurs trop vives — Ajuste les numéros de codes ANSI. `\033[91m` est le rouge vif ; `\033[31m` est le rouge plus sombre.

---

## ✅ Liste de vérification

Parcoure cette liste pour confirmer que tout fonctionne :

- [ ] `fetch_weather()` retourne un dictionnaire JSON valide
- [ ] `parse_daily_forecast()` retourne un DataFrame avec 7 lignes et des noms de colonnes corrects
- [ ] Les conversions de température produisent des valeurs Fahrenheit et Kelvin qui correspondent aux calculs manuels
- [ ] `calc_statistics()` retourne min, max, moyenne et totaux de précipitations
- [ ] `plot_hourly_temperature()` sauvegarde `hourly_temperature.png`
- [ ] `plot_daily_comparison()` sauvegarde `daily_comparison.png`
- [ ] `print_weekly_summary()` affiche un tableau encadré avec des descriptions météo
- [ ] `print_colored_dashboard()` affiche des températures et icônes colorés
- [ ] Aucun `KeyError`, `TypeError` ou valeurs `NaN` dans la sortie
- [ ] Les graphiques s'affichent correctement dans ton environnement

## Ce que tu as appris

Tu as récupéré des données en direct depuis une API REST publique, transformé du JSON imbriqué en DataFrames plats, calculé des statistiques, converti des unités, construit deux types de graphiques matplotlib et formaté la sortie terminal avec des couleurs et du dessin de boîte. Ces compétences se transfèrent directement à tout projet Python axé sur les données impliquant des API, de l'analyse et de la visualisation.
