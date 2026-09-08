---
title: "لوحة مراقبة IoT"
description: "لوحة مراقبة فورية لأجهزة IoT مع مقاييس ورسوم بيانية وعرض خرائط."
difficulty: "intermediate"
estimatedMinutes: 55
tags: ["iot", "data-viz", "async"]
learningObjectives:
  - "محاكاة تدفقات بيانات حساسات IoT بأنماط واقعية"
  - "بناء عدادات ومقاييس تحدث فوريًا باستخدام Dash"
  - "إنشاء رسوم بيانية تاريخية بأسلاسل زمنية لاتجاهات الحساسات"
  - "تنفيذ تجميع الأجهزة وتصفيتها حسب النوع أو الموقع"
prerequisites: ["Python 101", "Data Analysis"]
---


# 📊 ابنِ لوحة مراقبة IoT

نظام IoT دون لوحة مراقبة مثل سيارة دون عداد سرعة — البيانات موجودة، لكن لا أحد يراها. يبني هذا المشروع لوحة مراقبة فورية باستخدام Dash وPlotly: تحاكي تدفقات بيانات الحساسات، وترسم عدادات حية تتحدث كل ثانية، وتخطط الاتجاهات التاريخية كرسوم بيانية بأسلاسل زمنية، وتجمّع الأجهزة حسب النوع أو الموقع. تعمل اللوحة في متصفحك وتتحدث تلقائيًا.

يفترض هذا إنهاء Python 101 وارتياحًا مع pandas من تحليل البيانات — لا شيء أبعد من ذلك. هذا اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة.

## 🎯 ما ستفعله

1. إعداد مشروع باستخدام `uv` وتثبيت تبعيات اللوحة.
2. محاكاة بيانات حساسات IoT بأنماط واقعية لدرجة الحرارة والرطوبة والبطارية.
3. بناء تخطيط Dash بعدادات ومقاييس تحدث فوريًا.
4. إنشاء رسوم بيانية تاريخية بأسلاسل زمنية تتتبع قراءات الحساسات عبر الزمن.
5. تنفيذ تجميع الأجهزة وتصفيتها حسب النوع أو الموقع.
6. ربط كل شيء في تطبيق لوحة مراقبة قابل للتشغيل.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي — هذا خادم ويب يعمل على `localhost` ويُفتح في متصفحك.

**Google Colab وKaggle Notebooks وBinder** يمكنها تشغيل الخادم للاختبار، لكن رابط اللوحة لن يكون متاحًا من خارج الدفتر.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/iot-dashboard/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/iot-dashboard/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fiot-dashboard%2Fnotebook.ipynb)

## الإعداد

كل ما تحتاجه قبل البناء: بيئة Python، وDash، وPlotly.

### ثبّت `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

أغلق طرفيتك وأعد فتحها، ثم أكِّد:

```bash
uv --version
```

### هيّئ المشروع

```bash
uv init iot-dashboard
cd iot-dashboard
uv add dash plotly pandas
```

`dash` هو إطار Plotly للوحات التحكم التفاعلية. يوفّر `plotly` مكونات الرسوم البيانية. تتعامل `pandas` مع بيانات السلاسل الزمنية.

### أنشئ بنية المشروع

```bash
mkdir -p dashboard
touch dashboard/__init__.py dashboard/simulator.py dashboard/layout.py dashboard/callbacks.py dashboard/app.py
```

**✅ قائمة التحقق**

- ✅ `uv --version` يطبع رقم إصدار.
- ✅ يوجد `iot-dashboard/` مع `pyproject.toml`، وحزم `dash` و`plotly` و`pandas` مثبَّتة.
- ✅ يحتوي مجلد `dashboard/` على جميع ملفات الوحدات المطلوبة.

## الخطوة 1: حاكِ بيانات حساسات IoT

لبيانات IoT الحقيقية أنماط: ترتفع درجة الحرارة نهارًا وتنخفض ليلًا، وتتناقض الرطوبة معها عكسيًا، وتنخفض مستويات البطارية ببطء. محاكاة هذه الأنماط تجعل اللوحة تبدو واقعية.

### 1.1 أنشئ مُحاكي البيانات

**👟 تلميح البداية :**

أنشئ `dashboard/simulator.py` مع فئة تولّد قراءات حساسات واقعية.

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

ينتج المنحنى الجيبي نمط درجة حرارة يوميًا. تضيف الضوضاء تباينًا على مستوى الحساس. تنخفض البطارية ببطء كل نبضة.

**🎯 الناتج المتوقع :**

يُرجع `SensorSimulator(SAMPLE_DEVICES).tick()` 4 قراءات بقيم واقعية.

**🩹 إذا لم يعمل :**

إذا كانت درجة الحرارة دائمًا نفسها، فـ`tick_count` لا يتقدم. إذا كانت البطارية دائمًا 100، فـ`dev.get("battery")` لا يحدث.

### 1.2 تحقّق من المُحاكي

**✅ قائمة التحقق**

- ✅ يُرجع `tick()` قراءة `SensorReading` واحدة لكل جهاز.
- ✅ تتغير قيم درجة الحرارة بين النبضات.
- ✅ تنخفض قيم البطارية ببطء.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- إذا أردت محاكاة زمن انتقال الشبكة حيث تبلغ بعض الحساسات متأخرة، كيف تضيف معامل تأخير لأجهزة معينة؟
- كيف تجعل سرعة المحاكاة قابلة للضبط بحيث يمر «يوم» كامل في 10 ثوانٍ أو 10 دقائق؟

## الخطوة 2: ابنِ تخطيط Dash

تخطيطات Dash أشجار مكونات. تنشئ هذه الخطوة التخطيط الرئيسي بعنوان ومحدد أجهزة وصف عدادات ومنطقة رسوم بيانية.

### 2.1 أنشئ التخطيط

**👟 تلميح البداية :**

أنشئ `dashboard/layout.py`.

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

يفعل `dcc.Interval` النبض كل ثانية، محفزًا تحديثات العدادات والرسوم البيانية. يحصل كل عداد على ثلث العرض عبر أعمدة Bootstrap.

**🎯 الناتج المتوقع :**

تُرجع `create_layout()` شجرة مكونات تُرسَم كعنوان وقائمة منسدلة وثلاثة عدادات ورسم بياني.

**🩹 إذا لم يعمل :**

إذا لم تظهر العدادات، فإنها تحتاج خاصية `figure` من المعاودات. إذا انكسر التخطيط، تحقّق أن `dbc` مستورَد.

### 2.2 تحقّق من التخطيط

**✅ قائمة التحقق**

- ✅ يملك التخطيط عنوانًا وقائمة منسدلة وثلاث حاويات عدادات وحاوية رسم بياني.
- ✅ `dcc.Interval` مضبوط لتحديث كل ثانية.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- إذا كان لديك 20 حساسًا، فلن تتسع شفرة العدادات. كيف تجعل التخطيط متجاوبًا؟
- كيف تملأ القائمة المنسدلة ديناميكيًا من قائمة الأجهزة؟

## الخطوة 3: أنشئ العدادات الحية والرسوم البيانية التاريخية

### 3.1 ابنِ أشكال العدادات

**👟 تلميح البداية :**

أنشئ دوال العدادات في `dashboard/callbacks.py`.

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

**🎯 الناتج المتوقع :**

يُرجع `make_gauge(22.5, "Temperature", -10, 50, "°C")` شكل عداد Plotly.

**🩹 إذا لم يعمل :**

إذا لم يرسَم العداد، تحقّق أن `mode` يتضمن `"gauge"`.

### 3.2 ابنِ الرسم البياني التاريخي

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

**🎯 الناتج المتوقع :**

يُرجع `make_history_chart(buffer.to_dataframe())` شكلًا بمسارات درجة الحرارة والرطوبة.

**🩹 إذا لم يعمل :**

إذا كان الرسم البياني فارغًا، فالمخزن المؤقت لا يحتوي بيانات بعد.

### 3.3 تحقّق من العدادات والرسوم البيانية

**✅ قائمة التحقق**

- ✅ يُرجع `make_gauge` شكل عداد Plotly.
- ✅ يجمّع `DataBuffer` القراءات ويقصّها إلى `max_points`.
- ✅ يُرجع `make_history_chart` شكلًا بمسارين.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- ماذا لو أردت متوسطًا متحركًا لخمس دقائق بدلًا من أحدث قراءة؟ كيف تعدّل `DataBuffer`؟
- لأي بيانات يعمل محور ص واحد أفضل من المحورين؟

## الخطوة 4: اربط المعاودات وشغّل التطبيق

### 4.1 اكتب المعاودات

**👟 تلميح البداية :**

أنشئ المعاود الذي يربط نبضة الفاصل بتحديثات العدادات.

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

**🎯 الناتج المتوقع :**

تتحدث العدادات كل ثانية؛ يراكم الرسم البياني بيانات على مر الزمن.

**🩹 إذا لم يعمل :**

إذا لم تُطلَق المعاودات، تحقّق أن معرفات المكونات تطابق بين التخطيط والمعاود.

### 4.2 أنشئ نقطة دخول التطبيق

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

**🎯 الناتج المتوقع :**

يبدأ تشغيل `uv run python -m dashboard.app` خادمًا على `http://localhost:8050` مع عدادات تحدث فوريًا.

**🩹 إذا لم يعمل :**

إذا كان المنفذ 8050 مشغولًا، غيّره.

### 4.3 تحقّق من اللوحة

**✅ قائمة التحقق**

- ✅ `uv run python -m dashboard.app` يبدأ على `http://localhost:8050`.
- ✅ تتحدث العدادات كل ثانية بقيم متغيرة.
- ✅ يراكم الرسم البياني نقاط البيانات على مر الزمن.
- ✅ تعمل القائمة المنسدلة للموقع على تصفية العدادات.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تعمل اللوحة في الذاكرة. كيف تحفظ القراءات في SQLite لتبقى البيانات بعد إعادة التشغيل؟
- عند أي عدد حساسات ستحتاج إلى نقل المحاكاة إلى عملية منفصلة؟

## ⚠️ مآزق شائعة

- **عدم تطابق معرفات المعاودات.** يجب أن يطابق كل معرف `Input`/`Output` خاصية `id` لمكون تمامًا. خطأ إملائي يعطّل المعاود بصمت.
- **استيراد وحدات قديمة.** `dash_core_components` و`dash_html_components` الآن داخل `dash` — استورد منها مباشرةً.
- **نمو ذاكرة غير محدود.** يقصّ `DataBuffer` البيانات القديمة إلى `max_points`. بدون القص، تنمو ذاكرة اللوحة للأبد.
- **حجب الخيط الرئيسي.** تعمل معاودات Dash بشكل متزامن. المعاود البطيء (مثل استعلام قاعدة بيانات) يجمّد اللوحة بأكملها. استخدم `dcc.Interval` بحكمة وأبقِ المعاودات سريعة.
- **نسيان `debug=True` أثناء التطوير.** بدونه، أخطاء المعاودات صامتة — اللوحة تتوقف فقط عن التحديث. طوّر دائمًا مع تفعيل وضع التصحيح.

## ما بنيته للتو

لوحة مراقبة IoT فورية: مُحاكي حساسات ينتج أنماط بيانات واقعية، وعدادات Plotly تحدث فوريًا، ورسم بياني تاريخي بسلسلة زمنية بمحورين، وتصفية حسب الموقع. بنية معاودات Dash — حيث يطلق كل تفاعل مستخدم دالة تُرجع أشكالًا محدثة — هي النمط نفسه المستخدم في لوحات المراقبة الإنتاجية للرصد والتحليلات وأنظمة التحكم.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/iot-dashboard/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/iot-dashboard) في مستودع الدورة نسخة أغنى بمزيد من أنواع الحساسات ومؤشرات التنبيه وواجهة CLI موصولة من البداية للنهاية. استنسخه، أو افتح المستودع كاملًا في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وشغّله من هناك.
:::

## إلى أين تذهب من هنا

- أضف تكامل MQTT بحيث تقرأ اللوحة بيانات حساسات حقيقية من وسيط MQTT بدلًا من المُحاكي.
- نفّذ عتبات تنبيه: وميض تحذير عندما تتجاوز درجة الحرارة حدًا قابلًا للضبط.
- ابنِ زر تصدير CSV ينزّل البيانات التاريخية للتحليل دون اتصال.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓