---
title: "مركز أجهزة IoT"
description: "اجمع وركّز البيانات من أجهزة استشعار متعددة مع لوحات مراقبة فورية وتنبيهات."
difficulty: "intermediate"
estimatedMinutes: 120
tags: ["simulation", "matplotlib", "csv", "dictionaries", "scripting", "iot"]
learningObjectives:
  - "تمثيل أنواع متعددة من أجهزة الاستشعار ومحاكاة قراءاتها في حلقة نبضة"
  - "تجميع القراءات الخام في سجل سلسلة زمنية موحّد"
  - "إطلاق تنبيهات العتبة وحفظها مع التيار"
  - "تصوير بيانات المستشعرات التاريخية بـMatplotlib"
prerequisites: ["python-101/file-io", "python-101/dictionaries", "python-101/functions", "data-visualization/matplotlib"]
---

# 📡 مركز أجهزة IoT

ادخل غرفةً فيقرأ منظم الحرارة 21.4 درجة مئوية، ووميض كاشف الحركة كلما عبر أحدٌ ما، ورقاقة رطوبة تقيس زاوية رطبة. *مركز أجهزة IoT* هو الشيء الذي يجمع كل تلك القراءات من كل مستشعر، ويوحّدها في تيار واحد، ويعلّم على الخارجة عن النطاق الآمن، ويخزنها لتستطيع الرجوع إلى رسم بياني. أجهزة الاستشعار الفيزيائية اختيارية — يحاكيها هذا المشروع بصدق بحلقة نبضة قابلة للضبط، فيعمل المركز كله (التجميع والتنبيه والحفظ ولوحة تحكم Matplotlib) على بايثون خالص بلا عتاد ولا شبكة. كل ما تبنيه هو نفس الشكل الذي يتخذه مركز مدعوم بـMQTT حقيقي؛ فقط مصدر «المستشعر» مزيّف، وستعرف ذلك، لأن استبدال المحاكي بتيار حقيقي تبديل موثّق.

يفترض هذا أساسيات بايثون 101 بالإضافة إلى وحدة Matplotlib في المساق. اختياري وغير مصنّف؛ راجع [المشاريع الواقعية](/ar/مشاريع) للقائمة الكاملة.

## 🎯 ما ستفعله

1. ابنِ سجل مستشعرات يحاكي قراءات درجة الحرارة والرطوبة والحركة في نبضة.
2. اجمع كل نبضة في سجل سلسلة زمنية موحّد بأعمدة مشتركة.
3. نبّه عندما تعبر قراءة عتبةً خاصة بمستشعر وسجّل كل تنبيه.
4. احفظ التيار إلى CSV ومسار التنبيهات بجانبه.
5. ارسم التاريخ بـMatplotlib — تصوير «هل تسخن غرفتي؟».

## أين تُشغّل هذا

**محليًا مع `uv` هو المسار الأساسي** — المركز سكربت تشغّله وتراقب طباعته وتعيد تشغيله للإلحاق؛ ويهبط CSV وMatplotlib `PNG` ملفين حقيقيين يمكنك فتحهما، وشعور «شغّله حيًّا وراقب الأرقام تنبض» هو النقطة الهواة كلها. يغطي `uv add matplotlib` الاعتمادية الوحيدة خارج المكتبة القياسية.

**يشغّل GitHub Codespaces** السكربت نفسه: افتح [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) وشغّله في تبويب متصفح، مع `history.csv` و`dashboard.png` ظاهرين في شجرة الملفات.

**يشغّل Google Colab وKaggle Notebooks وBinder خط الأنابيب بأمانة** — المركز محاكاة خالصة وحساب بلا NumPy، ويرسم Matplotlib الرسم البياني *داخليًّا* في الدفتر، فيصبح `dashboard.png` مخرج خلية حيًّا لا ملفًا. الشيء الوحيد الذي لا يستطيع الدفتر فعله هو النبض في *وقت حائطي حقيقي* كما تفعل حلقة محلية — لكن المحاكاة تحت سيطرتك، فيعمل «ثانية واحدة لكل نبضة» و«تقديم سريع 100 نبضة» معًا، وهذا هو المكان الصادق الذي يتألق فيه الدفتر فعلًا (تحصل على التيار كله والرسوم البيانية في أثر واحد).

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/sensor-hub/notebook.ar.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/sensor-hub/notebook.ar.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fsensor-hub%2Fnotebook.ar.ipynb)

## الإعداد

بايثون مع Matplotlib، ولا عتاد.

### ثبّت `uv` وMatplotlib

**macOS / Linux** (الطرفية):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

أغلق وأعد فتح طرفيتك، ثم:

```bash
uv --version
mkdir sensor-hub && cd sensor-hub
uv init --bare
uv add matplotlib
```

### محاكي المستشعرات

أنشئ `sensors.py` — القطعة التي تمثل العتاد الفيزيائي:

```python
# sensors.py
import random

class Sensor:
    def __init__(self, name, base, noise, unit, low=None, high=None):
        self.name, self.base, self.noise = name, base, noise
        self.unit, self.low, self.high = unit, low, high

    def read(self):
        value = self.base + random.gauss(0, self.noise)
        return round(value, 1), self.unit, self.low, self.high

def make_registry():
    return [
        Sensor("thermostat", base=21.4, noise=0.5, unit="C", low=15, high=26),
        Sensor("humidity", base=43.0, noise=2.0, unit="%", low=20, high=70),
        Sensor("motion", base=0.0, noise=0.0, unit="bool", low=None, high=None),
    ]
```

يغلّف `Sensor.read()` الفيزياء في كائن: اسم، و*قيمة أساسية* ساكنة، وسيغما *ضجيج*، ووحدة، ونطاق *منخفض/مرتفع* آمن اختياري. `random.gauss(base, noise)` هو البديل الصادق لرجفة المستشعر — تتمايل درجة الحرارة حول 21.4، والرطوبة حول 43، والحركة حالة خاصة (كاشف ثنائي ستقلبه يدويًّا بعد قليل). يعبّر `low/high=None` عن «لا عتبة لهذا المستشعر» — الحركة إما متحركة أو لا.

**✅ قائمة التحقق**

- ✅ يطبع `uv --version` رقم نسخة؛ و`matplotlib` مثبتة عبر `uv add`.
- ✅ يُستورد `sensors.py` ويعيد `make_registry()` المستشعرات الثلاثة.
- ✅ يمكنك الشرح لماذا يمثل `random.gauss` مستشعرًا حقيقيًّا (رجفة حول قيمة حقيقية) أفضل من رقم ثابت.

## الخطوة 1: حاكِ حلقة نبضة

قلب أي مركز هو *حلقة أخذ العينات*: في كل نبضة، اسأل كل مستشعر عن قراءته الحالية، واجمع الدفعة كلها في صف واحد بعلامة وقت. تشغّل هذه الخطوة عددًا ثابتًا من النبضات وتطبعها بعلامات الوقت — التغذية الخام التي سيرسلها بوابة حقيقي.

**👟 تلميح البداية :** ابدأ بكتابة `sample()` التي تختم وقت UTC وتلوّح فوق `make_registry()` باستدعاء `.read()` لكل مستشعر، وتعيد صف قاموس واحدًا بـ`ts` و`source` وقيمة وعمود `_unit` لكل مستشعر — ثم اطبع خمس نبضات.

```python
# hub.py
from datetime import datetime, timezone
import os
from sensors import make_registry

SENSORS = make_registry()

def sample(force: dict = None) -> dict:
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    reading = {"ts": now, "source": "sim"}
    for s in SENSORS:
        value, unit, lo, hi = s.read()
        reading[s.name] = value
        reading[f"{s.name}_unit"] = unit
    if force:
        reading.update(force)
    return reading

for tick in range(5):
    print(sample())
```

يبني `sample` صف مركز واحدًا: علامة وقت UTC، و`source: "sim"` (لتعرف أي الصفوف أتت من محاكاة مقابل بيانات محقونة)، وعمودًا لكل مستشعر بالإضافة إلى وحدتها. قاموس `force` هو بوابة الحقن — يتيح لك *تجاوز* قراءة (قل `motion=1` أو ادفع `thermostat=28`) لاختبار العتبات دون انتظار مشية عشوائية تتجاوز واحدة. هذا الجزء الواحد هو سبب كون المركز قابلًا للاختبار: يمكنك إطلاق تنبيه بالإجبار عند الطلب بدل رجاء تعاون مولّد الأرقام العشوائية.

**🎯 الناتج المتوقع :** خمسة صفوف قاموس بعلامات وقت، كلٌّ بـ`ts` و`source` و`thermostat` (~21±0.5) و`humidity` (~43±2) و`motion` (0) وأعمدة `_unit`.

**🩹 إذا لم يعمل :** إذا كانت منظمات الحرارة الخمسة متطابقة، فـ`random.gauss` لا يُستدعى أو جُمّد `SENSORS` بنفس بذرة الضجيج — `Sensors` جديد جيد؛ `base` مخزنة تعني أنك أمسكت `base` بدل `read()`. إذا كانت علامات الوقت متساوية، فقد اقتطعها `timespec="seconds"` أسرع من تشغيل الحلقة — استخدم `timespec="milliseconds"` لرؤية الانتشار. إذا لم يغيّر `force` المخرج أبدًا، فمرّرت `force` قبل حلقة المستشعر فكُتبت تجاوزاته فوقها — طبّق `force` *بعد* الحلقة، كما هو مكتوب.

**✅ قائمة التحقق**

- ✅ خمسة صفوف متميزة، منظمات حرارة تتمايل حول 21.4 والرطوبة حول 43.
- ✅ `motion` 0 ووحدتها `bool`؛ وبوابة `force` تتجاوز عند الطلب.
- ✅ تختلف علامات الوقت لكل نبضة بدقة المللي ثانية.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- بوابة `force` منفصلة عمدًا عن حلقة القراءة. لو دمجت تجاوزًا *داخل* `Sensor.read()`، ما القدرة الاختبارية التي ستفقدها — وما المخاطرة بعد شرائها (اختبار ينجح لأنه حقن `thermostat=28` فيما لا يتجاوز تشغيل حقيقي 24 أبدًا)؟
- الوقت مسجَّل بـUTC لا محلي. لماذا *يصر* المركز على UTC حتى في عرض غرفة واحدة — وعند أي نقطة يصبح عمود وقت محلي ثغرة صحة (توقيت صيفي، أو غرفة في منطقة زمنية أخرى، أو رسم بياني محلَّل على CDN)؟

## الخطوة 2: اجمع في سجل موحّد

لا تتفق المستشعرات على تخطيط الأعمدة؛ وظيفة المركز صنع *سجل سلسلة زمنية موحّد* واحد من قراءات غير متجانسة. تحول هذه الخطوة القواميس الخام من الخطوة 1 إلى قائمة صفوف واحدة بشكل ثابت `(ts, sensor, value, unit)` — الصيغة التي يمكنك تحويلها لاحقًا والتنبيه عليها والرسم منها. إعادة التشكيل تافهة؛ الانضباط (إعادة التسمية إلى مخطط أساسي مقدمًا) هو ما يمنع كل خطوة لاحقة من إعادة التحليل.

**👟 تلميح البداية :** ابدأ بكتابة `normalize(row)` التي تحوّل صف مركز عريضًا واحدًا إلى قاموس ضيّق واحد لكل مستشعر بالشكل الثابت `ts, sensor, value, unit`، ثم اطبع بضع نبضات مطبَّعة.

```python
# hub.py (continued)

def normalize(row: dict) -> list[dict]:
    sensor_cols = [s.name for s in SENSORS]          # the numeric reading columns
    out = []
    for name in sensor_cols:
        out.append({
            "ts": row["ts"],
            "sensor": name,
            "value": row[name],
            "unit": row[f"{name}_unit"],
        })
    return out

for row in (sample(force={"thermostat": 21.4}) for _ in range(3)):
    for entry in normalize(row):
        print(f"{entry['ts'][11:]}  {entry['sensor']:<9} {entry['value']:>6} {entry['unit']}")
```

`normalize` تحويل *طويل-مقابل-عريض* كلاسيكي: صف المركز العريض (`thermostat` و`humidity` و`motion` أعمدة) يصبح صفًا *ضيّقًا* واحدًا لكل مستشعر (`sensor` و`value` و`unit`). هذا هو تنسيق «الطويل» الأساسي للسلاسل الزمنية — ملاحظة واحدة لكل صف — لأنه الشكل الذي تحوّله pandas وترسمه Matplotlib وتقيّمه العتبات دون أي تفرّع `if` لكل مستشعر. عمود اسم `sensor` هو المفتاح الأجنبي الذي يربط كل عملية لاحقة بعودة أي جهاز أنتج القراءة.

**🎯 الناتج المتوقع :** تسعة أسطر (3 نبضات × 3 مستشعرات)، كلٌّ `HH:MM:SS  sensor  value  unit`، مع صف واحد لكل مستشعر — منظمات حرارة بـ°C ورطوبة بنسبة % وحركة بـ`bool`.

**🩹 إذا لم يعمل :** إذا سمّى `KeyError` `thermostat_unit`، فبُني الصف العريض قبل وجود عمود `_unit` — طبّعت قاموسًا لم يُسكَن وحياته أبدًا (أنشئ الوحدات في `sample`، قبل `normalize`). إذا ظهرت الحركة بقيمة `float` 0.0 بدل `bool`، قال عمود الوحدة `bool` لكن القيمة لم تُقاس — شفّر الحركة كـ`int(motion)` في `sample`. إذا بدا ترتيب الصفوف خاطئًا، فرتّب بـ`(ts, sensor)` للاستنساخية.

**✅ قائمة التحقق**

- ✅ يصبح كل صف مركز بالضبط `len(SENSORS)` إدخالات مطبَّعة.
- ✅ مخطط الضيّق هو `ts, sensor, value, unit` — ملاحظة واحدة لكل صف.
- ✅ لا حاجة لـ`if` لكل مستشعر لمعرفة وحدة الصف؛ عمود `unit` يحملها.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- عريض-إلى-طويل هو خطوة «توحيد مرة واحدة». ما الذي يخطئ *لاحقًا* إذا تخطيتها وأبقيت أعمدة `thermostat` و`humidity` و`motion` وقسّيت `if name == "thermostat"` في منطق تنبيهك؟ سمِّ المستشعر المستقبلي الذي ينهي تلك السلسلة `if`.
- يقسّي `normalize` `sensor_cols` بتكرار `SENSORS`. إذا أُضيف نوع مستشعر جديد إلى السجل، فهل يستمر `normalize` بالعمل دون تعديل — ولماذا *تلك* الخصيصة (أعمدة مدفوعة بالبيانات، لا مقسّاة) هي اختبار «المركز» الحقيقي؟

## الخطوة 3: تنبيه العتبة

مركز يخزّن فحسب هو سجل؛ جزء *المركز* هو تقرير أن شيئًا حدث. يقارن تنبيه العتبة كل قراءة بـ`low/high` الآمن لمستشعرها ويسجّل صف تنبيه عندما تخرج عنه. بوابة `force` من الخطوة 1 تجعلها *قابلة للاختبار* — تطلق تنبيهًا حتميًّا بدل انتظار العشوائية.

**👟 تلميح البداية :** ابدأ بكتابة `ingest(row)` التي تطبّع الصف، وتبحث عن `low`/`high` لكل مستشعر من السجل، وتلحق تنبيه `out_of_range` عندما تقع قيمة خارجه — ثم اجبر ارتفاعًا بـ`sample(force={"thermostat": 29.0})`.

```python
# hub.py (continued)

ALERTS = []

def ingest(row: dict) -> None:
    for entry in normalize(row):
        lo, hi = None, None
        for s in SENSORS:
            if s.name == entry["sensor"]:
                lo, hi = s.low, s.high
                break
        value = entry["value"]
        if (hi is not None and value > hi) or (lo is not None and value < lo):
            ALERTS.append({**entry, "event": "out_of_range"})
            print(f"ALERT {entry['sensor']}: {value}{entry['unit']} outside {lo}-{hi}")

# force a thermometer spike and a normal tick
ingest(sample(force={"thermostat": 29.0}))
ingest(sample())
print("alerts:", len(ALERTS))
```

`ingest` هو خط أنابيب القراءة-والتفاعل: طبّع الصف، وابحث عن نطاق عتبة ذلك المستشعر، وألحق تنبيهًا (بعلامة الحدث `out_of_range`) عندما تعبر القيمة. لأن منظمات الحرارة آمنة عند `low=15, high=26`، فإن إجبار 29.0 يثير التنبيه؛ والنبضة الهادئة بعده لا تثير. انتشار `{**entry, "event": ...}` ينسخ القراءة *ويضيف* علامة التنبيه، فيحمل صف التنبيه كل نفس الأعمدة زائد سببًا — بالضبط ما تريده في سجل تدقّقه لاحقًا.

**🎯 الناتج المتوقع :** سطر واحدة `ALERT thermostat: 29.0C outside 15.0-26.0` للارتفاع المُجبَر، و`alerts: 1`، وصف صامت للنبضة الطبيعية.

**🩹 إذا لم يعمل :** إذا لم ينبّه الارتفاع المُجبَر، فاصطدم `force` بعمود خاطئ أو `high` في `SENSORS` هو `None` — اطبع `make_registry()` وتأكد `high=26`. إذا نبهت *كل* نبضة، فبحث العتبة يقارن بمستشعر خاطئ (تفويت `s.name == entry["sensor"]` يرجع إلى `None` بمعنى «لا عتبة»، فثغرة `None is not None` ستنبه كل شيء) — تحقق أن فرع المطابقة يحل. إذا ارتفعت النبضة الهادئة *أيضًا* بالصدفة، فذلك عشوائية أمينة — أعد التشغيل بضجيج أقل؛ اختبار المسار المُجبَر هو ما تؤكّده.

**✅ قائمة التحقق**

- ✅ تشغّل `thermostat=29.0` المُجبَر تنبيهًا واحدًا بالضبط بـ`event="out_of_range"`.
- ✅ تنتج النبضة الطبيعية صفر تنبيهات.
- ✅ كلاهما مغطّى بفحص النطاق: الفيض (value > high) والنقص (value < low).

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تعيش التنبيهات في قائمة بايثون (`ALERTS`) تموت عند خروج العملية. ما حجة *الاستمرارية* لكتابة كل تنبيه إلى القرص فورًا، وحجة *الكمون* المضادة (كتابة قرص لكل تنبيه مقابل الدفعات) عندما يجب ألا يحجب مركز مضمن صغير حلقة القراءة؟
- شرط التنبيه `value > high` يعامل قراءتي مستشعر لارتفاع *عابر* مثل ارتفاع *مستديم*. كيف ستبدو «إزالة الارتداد» (تتطلب N نبضات متتالية داخل النطاق قبل الصمت) ولماذا عتبة خام ضجيج لمستشعرات ثنائية بنمط الحركة؟

## الخطوة 4: احفظ التاريخ ومسار التنبيهات

مركز حي مفيد فقط ما دمت تراقبه؛ طبقة *تخزين* تجعله سجلًا تاريخيًّا يمكنك إعادة تحليله بعد الواقعة. تلحق هذه الخطوة صفوف كل نبضة المطبَّعة بـ`history.csv` وكل تنبيه بـ`alerts.csv`، مؤطِرة CSV كاختيار بلا قاعدة بيانات أمين لسلسلة زمنية صغيرة.

**👟 تلميح البداية :** ابدأ بكتابة `append_rows(path, rows)` التي تكتب الترويسة مرة واحدة (`if not path.exists()`) ثم تلحق بـ`csv.DictWriter` في وضع `"a"`، ثم مرّرها إلى `run_ticks(n)`.

```python
# hub.py (continued)
import csv
from pathlib import Path

HIST = Path("history.csv")
ALERT_LOG = Path("alerts.csv")

def append_rows(path: Path, rows: list[dict]) -> None:
    if not rows:
        return
    if not path.exists():
        path.write_text(",".join(rows[0].keys()) + "\n")   # header once
    with path.open("a", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writerows(rows)

def run_ticks(n: int) -> None:
    for _ in range(n):
        row = sample()
        ingest(row)                       # alerts land on ALERTS + stdout
        append_rows(HIST, normalize(row))
        append_rows(ALERT_LOG, ALERTS)
        ALERTS.clear()

run_ticks(50)
print("history rows:", sum(1 for _ in open(HIST)) - 1)
print("alert rows  :", sum(1 for _ in open(ALERT_LOG)) - 1 if ALERT_LOG.exists() else 0)
```

يكتب `append_rows` الترويسة *مرة واحدة* (`if not path.exists()`)، ثم يلحق بـ`csv.DictWriter` — نمط «اكتب مرة، ألحق للأبد» الذي يبقي سلسلة زمنية متنامية رخيصة. `run_ticks(50)` هو المركز كله تحت سقف واحد: عيّن → ابتلع (الذي يلحق التنبيهات داخل العملية) → احفظ التاريخ والدفعة الحالية من التنبيهات → امسح المخزن المؤقت لكل نبضة. على 50 نبضة × 3 مستشعرات تحصل على نحو 150 صف سجل و(ما لم ترتفع مشية عشوائية) 0 صف تنبيه؛ إجبار ارتفاع قبلها يضيف تنبيهات إلى `alerts.csv` حقيقي.

**🎯 الناتج المتوقع :** `history.csv` بترويسة + نحو 150 صفًا (~50 نبضة × 3 مستشعرات)، و`alerts.csv` بترويسة + مهما كانت التنبيهات المشغلة؛ وتطبع سطرا العد عدد الصفوف.

**🩹 إذا لم يعمل :** إذا كُتبت الترويسة عند *كل* إلحاق، ففُحص `path.exists()` بعد الكتابة أو فُتح الملف في وضع `w` (اقتطاع) — يجب أن تسبق كتابة `if not path.exists()` إلحاق وضع `a`. إذا رفع `writerows` `ValueError` على مفتاح مفقود، فالقواميس المطبَّعة تفتقر أحد `fieldnames` — انجرف مخطط `sensor`/`value`/`unit` عن `normalize`؛ قم بمحاذاتها. إذا كان `alerts.csv` فارغًا بعد ارتفاع مُجبَر، فقد ركض `append_rows(ALERT_LOG, ALERTS)` قبل ابتلاع الارتفاع — رتّب الاستدعاءات `ingest` ثم `append`.

**✅ قائمة التحقق**

- ✅ يحمل `history.csv` 1 + 3*n صف نِبضة بالضبط بترويسة واحدة.
- ✅ لـ`alerts.csv` سطر ترويسة وصف واحد لكل تنبيه عبر اختبار `force`.
- ✅ إعادة تشغيل `run_ticks(50)` *تلحق* بدل اقتطاع CSV.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- كتابة الترويسة مرة واحدة هي معادل CSV لترحيل مخطط. إذا تغيّرت قائمة أعمدة مستشعر *وسط الملف* (قل أُضيف مستشعر رابع)، ماذا يحدث لأعمدة الصفوف الموجودة — وأي سلوك `DictWriter` يقنّع ذلك الانجراف أو يفضحه؟
- CSV صديق للإلحاق لكن بلا معاملات — انهيار بين `writerows` للسجل والتنبيهات يترك الملفين خارج المزامنة. لمركز يجب أن يتحمّل فقدان الطاقة، ما البديل *الذرّي* (اكتب الاثنين إلى مؤقت، ثم أعد التسمية) الذي يوفره طبقة تخزين ملف واحد مجانًا؟

## الخطوة 5: ارسم التاريخ

الأرقام في CSV هي المادة الخام؛ *لوحة التحكم* هي المنتج الذي يقرؤه الشخص فعلًا. تحمّل هذه الخطوة `history.csv` في Matplotlib وترسم رسمين فرعيين لسلسلة زمنية — درجة الحرارة والرطوبة فوق عتباتها — محوِّلةً «هل تسخن الغرفة؟» إلى لمحة.

**👟 تلميح البداية :** ابدأ بضبط `matplotlib.use("Agg")` أولًا، ثم اكتب `chart()` لقراءة `history.csv` بـ`csv.DictReader`، واجمع الصفوف بالمستشعر، وارسم تياري منظم الحرارة والرطوبة بأسوار `axhline` للعتبة قبل `plt.savefig(out)`.

```python
# hub.py (continued)
import matplotlib
matplotlib.use("Agg")                       # headless: save PNG, no window
import matplotlib.pyplot as plt
import csv

def chart(path: Path = HIST, out: str = "dashboard.png") -> None:
    rows = list(csv.DictReader(open(path)))
    by = {}
    for r in rows:
        by.setdefault(r["sensor"], []).append((r["ts"], float(r["value"])))
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(8, 6), sharex=True)
    th = by.get("thermostat", [])
    hu = by.get("humidity", [])
    ax1.plot([t for t, _ in th], [v for _, v in th]  if th else [], marker="o", label="thermostat")
    ax2.plot([t for t, _ in hu], [v for _, v in hu]  if hu else [], marker="o", label="humidity")
    ax1.axhline(26, color="r", ls="--"); ax1.axhline(15, color="r", ls="--")
    ax2.axhline(70, color="r", ls="--"); ax2.axhline(20, color="r", ls="--")
    ax1.set_ylabel("°C"); ax2.set_ylabel("%")
    ax2.set_xlabel("time"); ax2.tick_params(axis="x", rotation=30)
    for ax in (ax1, ax2):
        ax.legend(); ax.grid(alpha=0.3)
    plt.tight_layout(); plt.savefig(out)
    print("wrote", out)

chart()
```

يفرض `matplotlib.use("Agg")` خلفية بلا رأس — لا نافذة عرض، بل `dashboard.png` محفوظ فقط — وهو ما يجعل هذا السكربت تقريرًا *قابلًا للـcron* لا أداة تفاعلية. الكود صريح عمدًا (`.setdefault` يجمع بالمستشعر؛ `axhline` يرسم أسوار النطاق الآمن؛ مرات ISO خام تجعل Matplotlib يعاملها كوسوم). الأسوار هي رسالة لوحة التحكم: القراءات المتأرجحة التي تعبر الخط المتقطع الأحمر هي ما يريد إنسان أن يلحظه، و50 نبضة محاكاة تحت `high` لن تعبرها غالبًا — لكن ارتفاعًا مُجبَرًا سيعبرها.

**🎯 الناتج المتوقع :** `dashboard.png` مكتوب (محفوظ، بلا نافذة منبثقة) — رسمان فرعيان: درجة حرارة منظم الحرارة °C عبر الزمن بأسوار حمراء عند 15/26، ورطوبة % عند 20/70، كلاهما يتمايل حول قواعدهما.

**🩹 إذا لم يعمل :** إذا رفع `plt.savefig` `RuntimeError` عن الخلفية، فلن ينجح `Agg` قبل إنشاء شكل — اضبطه بوصفه أول استدعاء matplotlib (قبل استخدام `pyplot`). إذا كان محور x فارغًا أو يدور بغرابة، فقد حُدّثت طوابع ISO وقت كسلاسل — صبّ `ts` إلى `datetime.strptime` أو دع وسوم السلسلة تقف؛ لرسم تأرجح من 50 نقطة، وسوم السلسلة أمينة. إذا كان أحد الرسوم الفرعية فارغًا، فعاد `by.get("sensor")` بـ`[]` لمستشعر مفقود — تأكد أن CSV يحمل عمود `humidity` فعلًا.

**✅ قائمة التحقق**

- ✅ `dashboard.png` موجود ويعرض الرسمين الفرعيين بعتبات حمراء واضحة.
- ✅ يُرسم الرسم بلا رأس (`Agg`) — لا نافذة تحجب تشغيل سكربت.
- ✅ قراءة الملف مرة أخرى تقود الرسم، فإعادة التشغيل بعد نبضات أكثر تظهر الاتجاه المحدَّث.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يفرض `sharex=True` نفس محور x عبر الرسمين الفرعيين. عندما تكون ديناميات تياري المستشعرين مختلفة جدًّا (درجة الحرارة تزحف، الحركة تنتفض)، ما الذي *يخفيه* إشراك المحور عن التيار الأضجع — ومتى تحكي المحاور المستقلة القصة الأمينة أفضل؟
- تُظهر لوحة تحكم يومًا من البيانات، والارتفاع المعبر للسياج واضح. ما الإشارة *المفاجئة* التي لا يستطيع رسم خط خام إظهارها لكن *متوسطًا متحركًا* (متوسط آخر N نبضة) يكشفها بموثوقية — وما كلفة الكمون للتنعيم الذي يخفي ارتفاعًا سريعًا؟

## ⚠️ مآزق شائعة

- **مستشعر عشوائي ≠ اختبار حتمي.** يجعل `random.gauss` إعادة التشغيل غير قابلة للاستنساخ. أكّد التنبيهات عبر بوابة `force` (`sample(force={"thermostat": 29.0})`)، لا عبر رجاء عبور مشية عشوائية عتبةً في أول 50 نبضة.
- **صفوف عريضة للأبد.** إبقاء `thermostat` و`humidity` و`motion` أعمدة و`if name == ...` لكل مستشعر يعني أن إضافة مستشعر تعني تعديل الحلقة. طبّع إلى `(ts, sensor, value, unit)` مرة واحدة ودع البيانات تقود المنطق.
- **إعادة كتابة الترويسة عند كل إلحاق.** الافتتاح في وضع `w` يقتطع السجل. استخدم إلحاق `a` واكتب الترويسة فقط عندما لا يوجد الملف بعد — ثبات الترويسة الواحدة هو ما يحافظ على اتساق تحليلات `csv.DictReader` اللاحقة.
- **تخطي الخلفية بلا رأس.** `savefig` يفتح نافذة تحجب الحلقة على واجهة رسومية قد لا تملكها. `matplotlib.use("Agg")` *أولًا* يحول الرسم إلى ملف بلا أثر جانبي يمكن للمركز إصداره بجدول.
- **نسيان ترتيب `force`.** تمرير `force` إلى `sample` *قبل* حلقة المستشعر يعني أن الحلقة تحذف تجاوزك. طبّق `force` *بعد* القراءات حتى يهبط الحقن فعلًا.

## ما بنيته للتو

مركز أجهزة IoT أمين: نمذجت ثلاثة أنواع مستشعرات، وحاكاتها في حلقة نبضة قابلة للضبط، وطبّعت قراءات غير متجانسة في سجل سلسلة زمنية موحّد، ومثّلت تنبيهات عتبة ببوابة حقن، وحفظت السجل والتنبيهات إلى CSV، ورسمت النتيجة بلوحة تحكم Matplotlib بلا رأس. الأفكار المنقولة تتضاعف وراء وهم: نمط حقن `force` هو كيف تجعل نظامًا حيًّا *قابلًا للاختبار*؛ تطبيع عريض-إلى-طويل هو انضباط المخطط الذي تتوقعه كل أداة مصب؛ وعادات «ترويسة واحدة، ألحق للأبد، واعرض بلا رأس» هي الفرق بين سكربت خربشة ولوحة تحكم يستطيع مراقب غرف أن يعتمد عليها فعلًا.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/sensor-hub/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/sensor-hub) في مستودع المساق يحزم وحدة المركز وسجل المستشعرات ودفترًا ينبض ويبتلع ويحفظ ويرسم داخليًّا (يُعرض الرسم كمخرج خلية). استنسخه، أو افتح المستودع كله في [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وراقب الغرفة تسخن على الشاشة.
:::

## إلى أين تذهب من هنا

- **MQTT حقيقي (اختياري):** ثبّت `paho-mqtt` واستبدل محاكاة `sample()` بمعالج `client.on_message` — منطق المركز يبقى كما هو؛ فقط «المصدر» يتغير من `sim` إلى `mqtt`، وهو التبديل الوحيد الذي توقّعه التصميم.
- **تقرير `dashboard` بجدول:** لفّ `run_ticks(60)` + `chart()` في حلقة `while True: sleep(60)` (أو سطر cron) حتى يصدر مراقب غرف PNG طازجًا كل دقيقة.
- **كشف الشذوذ (تمديد):** بدل عتبات قاسية، احسب متوسطًا/انحرافًا معياريًّا متحركًا ونبّه عندما تنجرف قراءة `> 3σ` عن النافذة الحديثة — الإشارة «المفاجئة» من خطاف سقراطي الخطوة 5.
- **سجل إضافات:** حوّل `make_registry` إلى واجهة `register(name, reader)` حتى تضيف أنواع مستشعرات جديدة نفسها دون تعديل `SENSORS` — درس الأعمدة المدفوعة بالبيانات، مرفوعًا إلى هندسة.

## شارك مشروعك مع الصف

راقبت غرفة (محاكاة)، أو أمسكت ارتفاعًا مُجبَرًا، أو وصّلت رسمًا يعجبك؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع قدّمها طلاب آخرون، وREADME يرشد إلى إضافة مشروعك عبر **طلب سحب** من البداية إلى النهاية: الشوكة والفرع والالتزام وفتح الـPR. لا خبرة git مسبقة مفترضة.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓