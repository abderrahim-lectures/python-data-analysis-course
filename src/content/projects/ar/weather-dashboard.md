---
title: "لوحة بيانات الطقس"
description: "ابني أداة Python CLI تجلب بيانات طقس حقيقية وتحللها باستخدام pandas وتصورها باستخدام matplotlib وتعرض لوحة طرفية أنيقة."
difficulty: "beginner"
estimatedMinutes: 45
xpReward: 50
tags: ["APIs", "matplotlib", "pandas", "data-visualization"]
learningObjectives:
  - جلب بيانات JSON وتحليلها من واجهة REST API عامة
  - تحويل استجابات API إلى DataFrames من pandas للتحليل
  - التحويل بين وحدات درجة الحرارة (سيليزيوس وفهرنهايت وكلفن)
  - حساب إحصاءات وصفية من بيانات من العالم الحقيقي
  - بناء رسوم خطية ومخططات أعمدة باستخدام matplotlib
  - تنسيق مخرجات الطرفية باستخدام الألوان والمحاذاة
prerequisites:
  - "أساسيات بايثون (المتغيرات، الحلقات، الدوال، القواميس)"
  - "أساسيات pandas و matplotlib"
---

# لوحة بيانات الطقس

ابنِ لوحة طرفية تجلب بيانات الطقس الحية من واجهة برمجة Open-Meteo، وتحسب الأرقام باستخدام pandas، وترسم الرسوم البيانية باستخدام matplotlib، وتطبع ملخصًا أسبوعيًا ملونًا. كل خطوة تمنحك كودًا عمليًا يمكنك تشغيله فورًا.

## ما ستبنيه

نص Python يقوم بما يلي:

- يجلب تنبؤًا لسبعة أيام من واجهة طقس مجانية بدون مفتاح
- يحلل JSON إلى DataFrame من pandas
- يحول درجات الحرارة بين سيليزيوس وفهرنهايت وكلفن
- يحسب إحصاءات الحد الأدنى والحد الأقصى والمتوسط والرطوبة اليومية
- يرسم مخططًا خطيًا لدرجات الحرارة بالساعة ومخطط أعمدة للظروف اليومية
- يطبع ملخصًا أسبوعيًا منسقًا بمؤشرات حرارة ملونة

## الإعداد

```bash
uv init weather-dashboard
cd weather-dashboard
uv add requests pandas matplotlib
```

تحتاج إلى اتصال بالإنترنت في أول تشغيل. بعد ذلك، يمكنك إعادة استخدام البيانات المحفوظة.

---

## الخطوة 1 — جلب بيانات الطقس من Open-Meteo

**الهدف:** تعلّم استدعاء REST API عام، والتعامل مع الاستجابة، والتعامل مع الأخطاء بأسلوب سلس.

**المفهوم:** واجهة Open-Meteo مجانية ولا تتطلب مفتاح API. ترسل خط العرض وخط الطول كمعامِلات استعلام وتحصل على كائن JSON متضمنًا الظروف الحالية والتنبؤات. نستخدم مكتبة `requests` لإجراء استدعاء HTTP ونستدعي `.json()` لتحليل الاستجابة.

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

**الناتج المتوقع:**

```
Current temperature: 18.3°C
Wind speed: 12.5 km/h
```

**إذا لم يعمل:**

- `ConnectionError` — أنت غير متصل بالإنترنت. اتصل بالإنترنت أو شغّل هذا لاحقًا.
- `Timeout` — كان الخادم بطيئًا. زد قيمة المهلة أو أعد المحاولة.
- بيانات `None` — أعادت الواجهة شكلًا غير متوقع. اطبع `data` لفحص JSON الخام.
- مدينة خاطئة — تحقق جيدًا من خط العرض وخط الطول. استخدم [latlong.net](https://www.latlong.net/) للعثور على الإحداثيات.

---

## الخطوة 2 — تحليل JSON إلى DataFrame

**الهدف:** تحويل استجابة JSON المتداخلة إلى DataFrame مسطح من pandas يمكنك تحليله.

**المفهوم:** تأتي استجابات API كقواميس متداخلة. تتوقع DataFrames من pandas بيانات جدولية (صفوف وأعمدة). نستخرج مفاتيح `daily` ونبني DataFrame بصف واحد لكل يوم.

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

**الناتج المتوقع:**

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

**إذا لم يعمل:**

- `KeyError` — غيّرت الواجهة أسماء حقولها. اطبع `data["daily"].keys()` لترى ما المتاح.
- تواريخ تبدو خاطئة — تُرجع الواجهة سلاسل نصية؛ يحولها `pd.to_datetime()` إلى تواريخ. إذا فشل التحليل، تحقق من الشكل بـ `data["daily"]["time"][:1]`.
- DataFrame فارغ — لم تُرجع الواجهة مفتاح `daily`. تحقق من تضمين `"daily"` في معامِلات طلبك.

---

## الخطوة 3 — إضافة تحويلات درجة الحرارة

**الهدف:** أضف عمودي فهرنهايت وكلفن بحيث تعمل اللوحة لأي جمهور.

**المفهوم:** صيغ التحويل رياضيات بسيطة. من سيليزيوس إلى فهرنهايت: `(C × 9/5) + 32`. من سيليزيوس إلى كلفن: `C + 273.15`. نطبقها بعمليات pandas المتجهية، وهي أسرع من الحلقات.

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

**الناتج المتوقع:**

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

**إذا لم يعمل:**

- تبدو القيم مقلوبة — تحقق من العمود الذي تحوله. يجب أن يقابل `temp_max` العمود `temp_max_f`، وليس `temp_min_f`.
- أرقام عشرية خاطئة — تقريب النقطة العائمة أمر طبيعي. استخدم `.round(1)` إذا أردت أرقامًا عشرية أقل.
- `SettingWithCopyWarning` — استخدم دائمًا `.copy()` قبل تعديل شريحة من DataFrame.

---

## الخطوة 4 — حساب الإحصاءات اليومية

**الهدف:** احسب الإحصاءات الملخصة بحيث يمكنك وصف التنبؤ في جملة واحدة.

**المفهوم:** لدى pandas طرق تجميع مدمجة: `.min()` و`.max()` و`.mean()`. نجمعها في صف إحصاءات واحد. كما نربط رموز الطقس بأوصاف مقروءة للإنسان.

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

**الناتج المتوقع:**

```
Period high:  25.2°C (77.4°F)
Period low:   11.6°C (52.9°F)
Avg high:     22.4°C
Avg low:      13.7°C
Total precip: 7.4 mm over 2 rainy day(s)
Most common:  Mainly clear
```

**إذا لم يعمل:**

- `NaN` في النتائج — قد تكون بعض الحقول `None` في JSON. استخدم `.fillna(0)` قبل حساب الإحصاءات.
- يعيد النمط (mode) رمزًا خاطئًا — إذا كان هناك تعادل، يعيد `mode()` القيمة الأولى. هذا مقبول للملخص.
- الهطول دائمًا 0 — لا تملك كل المناطق بيانات هطول. تحقق من `data["daily"].keys()` للتأكد من وجود `precipitation_sum`.

---

## الخطوة 5 — بناء الرسوم البيانية

**الهدف:** أنشئ مخططًا خطيًا لدرجات الحرارة بالساعة ومخطط أعمدة للظروف اليومية.

**المفهوم:** يبني Matplotlib الرسوم في طبقات: شكل (figure) ومحاور (axes) واستدعاءات رسم وتسميات وتخطيط. نرسم بيانات الساعة لأول 48 ساعة كمخطط خطي، والحد الأدنى/الأقصى اليومي كمخطط أعمدة مجمّع.

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

**الناتج المتوقع:**

يُحفظ ملفا رسم بياني على القرص ويعرضان إذا كنت تشغّل في دفتر. يظهر المخطط الخطي منحنى درجة الحرارة على مدار 48 ساعة. يظهر مخطط الأعمدة أعمدة مرتفعات ومنخفضات جانبية لكل يوم.

**إذا لم يعمل:**

- رسم بياني فارغ — استدعِ `plt.show()` بعد أوامر الرسم. في النصوص، قد تحتاج إلى `plt.ion()` أولًا.
- `UserWarning` بشأن التواريخ — تأكد من استدعاء `pd.to_datetime()` على سلاسل الوقت قبل الرسم.
- تتداخل الأعمدة — يجب أن تتموضع حسابات العرض والإزاحة الأعمدة في المنتصف. تحقق من فهم القائمة في `ax.bar()`.
- خط صغير جدًا — زد `figsize` أو استخدم `plt.rcParams["font.size"] = 12` قبل الرسم.

---

## الخطوة 6 — إنشاء ملخص تنبؤ أسبوعي

**الهدف:** اجمع كل شيء في ملخص نصي منسق يمكنك قراءته بتلخيص النظرة.

**المفهوم:** نمر على كل يوم، ونربط رمز الطقس بوصف، وننسق درجات الحرارة بالمحاذاة. يحول هذا البيانات الخام إلى شيء قد يقرؤه الإنسان فعلًا.

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

**الناتج المتوقع:**

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

**إذا لم يعمل:**

- يبدو الشريط خاطئًا — اضبط صيغة القياس في `format_daily_bar`. تربط الصيغة درجة الحرارة بعرض الشريط.
- أحرف الصندوق غير محاذاة — استخدم طرفية أو خطًا أحادي المسافة. تكسر الخطوط النسبية رسم الصندوق.
- يفيض وصف الطقس — قصّر الأوصاف أو وسّع الصندوق بمزيد من الشرطات.

---

## الخطوة 7 — صقل CLI بالألوان وأسطورة

**الهدف:** أضف مؤشرات حرارة ملونة وأسطورة رموز طقس بحيث تكون اللوحة واضحة بصريًا.

**المفهوم:** تستخدم ألوان الطرفية تسلسلات الهروب ANSI. نعرّف دوال مساعدة تغلّف النص بأكواد الألوان. الأخضر يعني دافئًا، والأزرق باردًا، والأحمر حارًا.

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

**الناتج المتوقع:**

لوحة مؤطرّة بدرجات حرارة وأيقونات طقس ملونة، مشابهة لملخص الخطوة 6 لكن بألوان ANSI للقطرات الطرفية التي تدعمها.

**إذا لم يعمل:**

- تظهر الألوان كرموز هروب — طرفيتك لا تدعم ألوان ANSI. استخدم طرفية حديثة (iTerm2 أو Windows Terminal أو GNOME Terminal).
- عدم محاذاة الصندوق — التزم بالخطوط أحادية المسافة. يجب أن يكون لكل سطر داخل الصندوق نفس العرض البصري.
- ألوان ساطعة جدًا — اضبط أرقام أكواد ANSI. `\033[91m` أحمر ساطع؛ `\033[31m` أحمر أغمق.

---

## قائمة التحقق النهائية

مرّ عبر هذه القائمة لتأكيد أن كل شيء يعمل:

- [ ] يعيد `fetch_weather()` قاموس JSON صالحًا
- [ ] يعيد `parse_daily_forecast()` DataFrame بسبعة صفوف وأسماء أعمدة صحيحة
- [ ] تنتج تحويلات درجة الحرارة قيم فهرنهايت وكلفن تطابق الحسابات اليدوية
- [ ] يعيد `calc_statistics()` الحد الأدنى والحد الأقصى والمتوسط وإجماليات الهطول
- [ ] يحفظ `plot_hourly_temperature()` الملف `hourly_temperature.png`
- [ ] يحفظ `plot_daily_comparison()` الملف `daily_comparison.png`
- [ ] يطبع `print_weekly_summary()` جدولًا مؤطرًا بأوصاف الطقس
- [ ] يعرض `print_colored_dashboard()` درجات حرارة وأيقونات ملونة
- [ ] لا توجد قيم `KeyError` أو `TypeError` أو `NaN` في المخرجات
- [ ] تظهر الرسوم البيانية بشكل صحيح في بيئتك

## ما تعلمته

جلبت بيانات حية من REST API عام، وحولت JSON المتداخل إلى DataFrames مسطحة، وحسبت الإحصاءات، وحولت الوحدات، وبنيت نوعين من رسوم matplotlib، ونسقت مخرجات الطرفية بالألوان ورسم الصناديق. تنتقل هذه المهارات مباشرة إلى أي مشروع Python مدفوع بالبيانات يتضمن واجهات برمجة وتحليلًا وتصورًا.
