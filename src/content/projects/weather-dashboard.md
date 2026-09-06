---
title: "Weather Dashboard"
description: "A terminal dashboard that shows real-time weather, forecasts, and historical charts for any city."
difficulty: "beginner"
estimatedMinutes: 45
tags: ["api", "cli", "data-visualization", "httpx", "matplotlib", "pandas"]
learningObjectives:
  - Fetch and parse JSON data from a public REST API
  - Build reusable data fetching patterns with error handling
  - Create visualizations with matplotlib from API responses
  - Cache API responses to avoid redundant network calls
prerequisites:
  - Basic Python functions and loops
  - Understanding of dictionaries and lists
  - Familiarity with pip/uv for installing packages
---

# Weather Dashboard

Build a beautiful terminal dashboard for weather data. You'll learn to work with real APIs, handle network errors gracefully, and turn raw JSON into clear visualizations.

## What You'll Learn

- How to fetch and parse data from a public REST API
- How to handle network errors and edge cases cleanly
- How to turn API JSON responses into matplotlib charts
- How to cache results locally so you only hit the API once
- How to format terminal output for readability

## What You'll Build

A Python script that:

- Fetches current weather from the Open-Meteo API for any city
- Shows a 7-day temperature forecast with daily high and low
- Generates a line chart of hourly temperatures over 48 hours
- Compares weather across multiple cities side by side
- Caches results to disk so repeated runs work offline

## Where to Run It

This project runs anywhere Python is available. You can use:

- **JupyterLite playground** — paste code blocks into cells and run them in the browser (no install needed)
- **Local with uv** — install dependencies with `uv add` and run from your terminal
- **Google Colab** — click the Colab badge on the project page to run in a cloud notebook

## Setup

Create a new project and install the dependencies:

```bash
uv init weather-dashboard
cd weather-dashboard
uv add httpx matplotlib pandas
```

You will need an internet connection for the first run so the API can return data. After that, cached results let you work offline.

## Step 1 — Fetch Current Weather

The Open-Meteo API is free and requires no API key. You pass in latitude and longitude and get back a JSON object with current conditions.

```python
import httpx
import json

def fetch_weather(lat: float, lon: float) -> dict:
    """Fetch current weather and 7-day forecast from Open-Meteo."""
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current_weather": True,
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum",
        "hourly": "temperature_2m",
        "timezone": "auto",
    }

    try:
        response = httpx.get(url, params=params, timeout=10)
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        print(f"API error: {e.response.status_code}")
        return {}
    except httpx.ConnectError:
        print("Network error. Check your internet connection.")
        return {}

# Coordinates for New York City
data = fetch_weather(40.7128, -74.0060)

if data:
    current = data["current_weather"]
    print(f"Temperature: {current['temperature']}°C")
    print(f"Wind speed: {current['windspeed']} km/h")
    print(f"Weather code: {current['weathercode']}")
```

The `timeout` parameter prevents your program from hanging if the server is slow. The `try/except` block catches both HTTP errors and connection failures.

## Step 2 — Display a 7-Day Forecast

Extract the daily data from the response and format it into a readable table.

```python
import pandas as pd

def show_forecast(data: dict) -> pd.DataFrame:
    """Parse daily forecast into a clean DataFrame."""
    if not data or "daily" not in data:
        print("No forecast data available.")
        return pd.DataFrame()

    daily = data["daily"]
    df = pd.DataFrame({
        "Date": daily["time"],
        "High (°C)": daily["temperature_2m_max"],
        "Low (°C)": daily["temperature_2m_min"],
        "Precip (mm)": daily["precipitation_sum"],
    })

    print("\n  7-Day Forecast")
    print("  " + "=" * 45)
    for _, row in df.iterrows():
        bar_len = int((row["High (°C)"] - row["Low (°C)"]) / 2)
        bar = "█" * max(bar_len, 1)
        print(f"  {row['Date']}  {row['Low (°C)']:5.1f}° {bar} {row['High (°C)']:5.1f}°")

    return df

forecast_df = show_forecast(data)
```

This gives you a text-based visualization right in the terminal, with a bar showing the spread between the daily low and high.

## Step 3 — Chart Hourly Temperatures with Matplotlib

Turn the hourly temperature array into a line chart. This is where matplotlib shines.

```python
import matplotlib.pyplot as plt

def plot_hourly(data: dict, city_name: str = "Location"):
    """Plot 48 hours of hourly temperature data."""
    if not data or "hourly" not in data:
        print("No hourly data available.")
        return

    hourly = data["hourly"]
    times = pd.to_datetime(hourly["time"])
    temps = hourly["temperature_2m"]

    # Limit to 48 hours for a clean chart
    times = times[:48]
    temps = temps[:48]

    plt.figure(figsize=(10, 4))
    plt.plot(times, temps, marker="o", markersize=3, linewidth=1.5)
    plt.title(f"Hourly Temperature — {city_name}")
    plt.xlabel("Time")
    plt.ylabel("Temperature (°C)")
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()
    plt.savefig("hourly_chart.png", dpi=150)
    plt.show()
    print("Chart saved to hourly_chart.png")

plot_hourly(data, "New York City")
```

Calling `plt.show()` displays the chart inline if you are in a notebook, and `plt.savefig()` saves a copy to disk.

## Step 4 — Compare Multiple Cities

Fetch weather for several cities and compare them in one chart.

```python
CITIES = {
    "New York": (40.7128, -74.0060),
    "London": (51.5074, -0.1278),
    "Tokyo": (35.6762, 139.6503),
    "Sydney": (-33.8688, 151.2093),
}

def compare_cities(cities: dict):
    """Fetch and plot hourly temps for multiple cities."""
    plt.figure(figsize=(10, 5))

    for name, (lat, lon) in cities.items():
        data = fetch_weather(lat, lon)
        if data and "hourly" in data:
            times = pd.to_datetime(data["hourly"]["time"])[:48]
            temps = data["hourly"]["temperature_2m"][:48]
            plt.plot(times, temps, label=name, linewidth=1.5)

    plt.title("Temperature Comparison — 48 Hours")
    plt.xlabel("Time")
    plt.ylabel("Temperature (°C)")
    plt.legend()
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()
    plt.savefig("comparison_chart.png", dpi=150)
    plt.show()

compare_cities(CITIES)
```

This fetches data for each city in sequence and plots all four lines on the same axes so you can compare climates at a glance.

## 🧩 Challenges

### Challenge 1 — Add Caching

Right now every run hits the API. Write a function that saves the JSON response to a file named `weather_{lat}_{lon}.json` and loads from disk if the file exists and is less than 30 minutes old. Use `os.path.getmtime()` to check the file age.

### Challenge 2 — Add a Weather Code Lookup

Open-Meteo returns numeric weather codes (0 = clear sky, 61 = slight rain, etc.). Create a dictionary that maps these codes to human-readable descriptions and emoji icons, then display them next to each day in the forecast.

### Challenge 3 — Unit Switching

Add a `--units imperial` flag that converts temperatures from Celsius to Fahrenheit and wind speed from km/h to mph. Use `argparse` to parse the flag.

## Stretch Goals

- [ ] Add weather alerts and severe weather notifications
- [ ] Build a historical weather analyzer that pulls past data from the archive API
- [ ] Create a location bookmark system that saves favorite cities to a JSON file
- [ ] Add a TUI mode with interactive navigation using the `rich` library

## What You Learned

You fetched data from a REST API, handled network errors, parsed JSON into DataFrames, built matplotlib charts, compared multiple datasets visually, and cached results for offline use. These are core skills for any data-driven Python project.
