---
title: "Weather Dashboard"
description: "Build a Python CLI that fetches real weather data, analyzes it with pandas, visualizes it with matplotlib, and displays a polished terminal dashboard."
difficulty: "beginner"
estimatedMinutes: 45
xpReward: 50
tags: ["APIs", "matplotlib", "pandas", "data-visualization"]
learningObjectives:
  - Fetch and parse JSON data from a public REST API
  - Transform API responses into pandas DataFrames for analysis
  - Convert between temperature units (Celsius, Fahrenheit, Kelvin)
  - Calculate descriptive statistics from real-world data
  - Build line charts and bar charts with matplotlib
  - Format terminal output with color and alignment
prerequisites:
  - "Python basics (variables, loops, functions, dictionaries)"
  - "Basic pandas and matplotlib"
---

# Weather Dashboard

Build a terminal dashboard that pulls live weather data from the Open-Meteo API, crunches the numbers with pandas, draws charts with matplotlib, and prints a colorful weekly summary. Every step gives you working code you can run immediately.

## What You'll Build

A Python script that:

- Fetches a 7-day forecast from a free, keyless weather API
- Parses the JSON into a pandas DataFrame
- Converts temperatures between Celsius, Fahrenheit, and Kelvin
- Computes daily min, max, average, and humidity statistics
- Plots a line chart of hourly temperatures and a bar chart of daily conditions
- Prints a formatted weekly summary with colored temperature indicators

## Setup

```bash
uv init weather-dashboard
cd weather-dashboard
uv add requests pandas matplotlib
```

You need an internet connection for the first run. After that, you can reuse saved data.

---

## Step 1 — Fetch Weather Data from Open-Meteo

**Objective:** Learn to call a public REST API, handle the response, and deal with errors gracefully.

**Concept:** The Open-Meteo API is free and requires no API key. You send latitude and longitude as query parameters and get back a JSON object with current conditions and forecasts. We use the `requests` library to make the HTTP call and call `.json()` to parse the response.

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

**Expected output:**

```
Current temperature: 18.3°C
Wind speed: 12.5 km/h
```

**If it's off:**

- `ConnectionError` — You are offline. Connect to the internet or run this later.
- `Timeout` — The server was slow. Increase the timeout value or retry.
- `None` data — The API returned an unexpected shape. Print `data` to inspect the raw JSON.
- Wrong city — Double-check the latitude and longitude. Use [latlong.net](https://www.latlong.net/) to find coordinates.

---

## Step 2 — Parse JSON into a DataFrame

**Objective:** Convert the nested JSON response into a flat pandas DataFrame you can analyze.

**Concept:** API responses come as nested dictionaries. Pandas DataFrames expect tabular (rows and columns) data. We extract the `daily` keys and build a DataFrame with one row per day.

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

**Expected output:**

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

**If it's off:**

- `KeyError` — The API changed its field names. Print `data["daily"].keys()` to see what is available.
- Dates look wrong — The API returns strings; `pd.to_datetime()` converts them. If parsing fails, check the format with `data["daily"]["time"][:1]`.
- Empty DataFrame — The API returned no `daily` key. Check that `"daily"` is included in your request params.

---

## Step 3 — Add Temperature Conversions

**Objective:** Add Fahrenheit and Kelvin columns so the dashboard works for any audience.

**Concept:** Conversion formulas are simple math. Celsius to Fahrenheit: `(C × 9/5) + 32`. Celsius to Kelvin: `C + 273.15`. We apply these with pandas vectorized operations, which are faster than looping.

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

**Expected output:**

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

**If it's off:**

- Values look swapped — Check which column you are converting. `temp_max` should map to `temp_max_f`, not `temp_min_f`.
- Decimals off — Floating point rounding is normal. Use `.round(1)` if you want fewer decimals.
- `SettingWithCopyWarning` — Always use `.copy()` before modifying a slice of a DataFrame.

---

## Step 4 — Calculate Daily Statistics

**Objective:** Compute summary statistics so you can describe a forecast in one sentence.

**Concept:** Pandas has built-in aggregation methods: `.min()`, `.max()`, `.mean()`. We combine these into a single statistics row. We also map weather codes to human-readable descriptions.

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

**Expected output:**

```
Period high:  25.2°C (77.4°F)
Period low:   11.6°C (52.9°F)
Avg high:     22.4°C
Avg low:      13.7°C
Total precip: 7.4 mm over 2 rainy day(s)
Most common:  Mainly clear
```

**If it's off:**

- `NaN` in results — Some fields may be `None` in the JSON. Use `.fillna(0)` before computing statistics.
- Mode returns wrong code — If there is a tie, `mode()` returns the first value. That is fine for a summary.
- Precipitation is always 0 — Not all regions have precipitation data. Check `data["daily"].keys()` to confirm `precipitation_sum` exists.

---

## Step 5 — Build Visualizations

**Objective:** Create a line chart of hourly temperatures and a bar chart of daily conditions.

**Concept:** Matplotlib builds charts in layers: figure, axes, plot calls, labels, and layout. We plot hourly data for the first 48 hours as a line chart, and daily high/low as a grouped bar chart.

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

**Expected output:**

Two chart files saved to disk and displayed if running in a notebook. The line chart shows the temperature curve over 48 hours. The bar chart shows side-by-side high and low bars for each day.

**If it's off:**

- Chart is blank — Call `plt.show()` after the plot commands. In scripts, you may need `plt.ion()` first.
- `UserWarning` about dates — Ensure you called `pd.to_datetime()` on the time strings before plotting.
- Bars overlap — The width and offset calculation must center the bars. Check the list comprehension in `ax.bar()`.
- Font looks tiny — Increase `figsize` or use `plt.rcParams["font.size"] = 12` before plotting.

---

## Step 6 — Create a Weekly Forecast Summary

**Objective:** Combine everything into a formatted text summary you can read at a glance.

**Concept:** We iterate over each day, map the weather code to a description, and format the temperatures with alignment. This turns raw data into something a human would actually read.

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

**Expected output:**

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

**If it's off:**

- Bar looks wrong — Adjust the scaling formula in `format_daily_bar`. The formula maps temperature to bar width.
- Box characters misaligned — Use a monospace terminal or font. Proportional fonts break the box drawing.
- Weather description overflows — Shorten descriptions or widen the box with more dashes.

---

## Step 7 — Polish the CLI with Colors and a Legend

**Objective:** Add colored temperature indicators and a weather code legend so the dashboard is visually clear.

**Concept:** Terminal colors use ANSI escape codes. We define helper functions that wrap text in color codes. Green means warm, blue means cold, and red means hot.

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

**Expected output:**

A boxed dashboard with colored temperatures and weather icons, similar to the summary from Step 6 but with ANSI colors for terminals that support them.

**If it's off:**

- Colors show as escape codes — Your terminal does not support ANSI colors. Use a modern terminal (iTerm2, Windows Terminal, GNOME Terminal).
- Box misalignment — Stick to monospace fonts. Each line inside the box must have the same visual width.
- Colors too bright — Adjust the ANSI code numbers. `\033[91m` is bright red; `\033[31m` is darker red.

---

## Final Checklist

Run through this list to confirm everything works:

- [ ] `fetch_weather()` returns a valid JSON dictionary
- [ ] `parse_daily_forecast()` returns a DataFrame with 7 rows and correct column names
- [ ] Temperature conversions produce Fahrenheit and Kelvin values that match hand calculations
- [ ] `calc_statistics()` returns min, max, mean, and precipitation totals
- [ ] `plot_hourly_temperature()` saves `hourly_temperature.png`
- [ ] `plot_daily_comparison()` saves `daily_comparison.png`
- [ ] `print_weekly_summary()` prints a boxed table with weather descriptions
- [ ] `print_colored_dashboard()` displays colored temperatures and icons
- [ ] No `KeyError`, `TypeError`, or `NaN` values in the output
- [ ] Charts display correctly in your environment

## What You Learned

You fetched live data from a public REST API, transformed nested JSON into flat DataFrames, computed statistics, converted units, built two types of matplotlib charts, and formatted terminal output with colors and box drawing. These skills transfer directly to any data-driven Python project that involves APIs, analysis, and visualization.
