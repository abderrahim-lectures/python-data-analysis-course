---
title: "مراقب جودة المياه"
description: "اختبر وتتبع معايير جودة المياه مع تحليل الاتجاهات وتنبيهات التلوث."
difficulty: "intermediate"
estimatedMinutes: 60
tags: ["csv", "matplotlib", "automation"]
learningObjectives:
  - "خزّن قراءات العينات بطوابع زمنية في CSV"
  - تحقق من القراءات مقابل مواصفات النطاق الآمن
  - "احسب المتوسطات المتحركة والانحراف من سلسلة البيانات"
  - "أصدر تنبيهات مرتّبة حسب الخطورة للعينات خارج النطاق أو المنحرفة"
  - "ارسم الاتجاهات بخطوط إرشادية حمراء للنطاق الآمن"
prerequisites:
  - "Python basics (functions, loops, dictionaries)"
  - "Basic matplotlib pyplot (subplots, axhline)"
  - "Comfortable writing and reading CSV files"
---

# 🛠️ 💧 ابنِ مراقب جودة المياه

مراقبة المياه العذبة خط أنابيب بيانات في صندوق بارد: مُستشعر (سجل عيناتك) يُنتج قراءات بطابع زمني، ومواصفة (نطاقات آمنة لكل معامل) تقرر نجاح/فشل، والاتجاهات تقرر "يزداد سوءًا"، وقائمة تنبيه تقرر الانتباه. يبني هذا المشروع الحلقة كلها بملف CSV عادي كمستشعر: حدّد المعاملات ونطاقاتها الآمنة، وسجّل قراءات، وتحقق من كل عينة، واحسب المتوسطات المتدحرجة والانجراف، وأصدر تنبيهات مُرتَّبة بدرجة الخطورة، واختم برسم matplotlib خطوطه الحمراء المتقطعة هي حدود النطاقات الآمنة.

هذا يفترض Python 101 مع لمسة من matplotlib ، لا شيء آخر مطلوب. هذا اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للقائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. تعريف المعاملات الخمسة المُراقَبة ونطاقاتها الآمنة.
2. تسجيل قراءات بطابع زمني إلى CSV ببيانات تحتفظ بتسمياتها.
3. التحقق من كل قراءة ضد النطاقات وطباعة جدول نجاح/فشل.
4. حساب المتوسطات المتدحرجة والانجراف لاصطياد اتجاهات "تسوء ببطء".
5. التنبيه على الإخفاقات والقيم الحدّية والانجراف ، مُرتَّبة بدرجة الخطورة.
6. رسم كل معامل ضد خطوط إرشاد نطاقه الآمن الحمراء.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** موطن أساسي ، يعيش CSV وينمو على قرصك، ويُحفظ الرسم كملف `.png` حقيقي. المشروع كله utf-8 بسيط، وكل سطر يعمل دون تعديل في دفاتر السحابة أيضًا، حيث الفرق الوحيد أن الرسم يُعرض *داخليًا* بدلًا من حفظه في ملف.

**Google Colab وKaggle Notebooks وBinder** تشغّل الخطوات الست كلها بشكل متطابق (لا بيانات خارجية ، CSV تُزرَع بسكربتك نفسه)، مع الرسم الداخلي في النهاية. التحفظ الصادق: الرسوم الداخلية رائعة للاستكشاف، لكن أداة المراقبة تريد الملف على القرص ليمكن لمشغّل النظر إليه لاحقًا. استخدم الشارات للاستكشاف؛ واستخدم التشغيل المحلي للإحساس "بالجهاز الحقيقي".

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/water-quality/notebook.ar.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/water-quality/notebook.ar.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fwater-quality%2Fnotebook.ar.ipynb)

## الإعداد

أنشئ المشروع. يستخدم التسجيل والتحليل المكتبة القياسية فقط؛ matplotlib هي التبعية الحقيقية الوحيدة.

```bash
uv init water-quality
cd water-quality
```

```bash
uv add matplotlib
```

```bash
uv run python -c "import matplotlib; print('plt', matplotlib.__version__)"
```

يحوّل `csv` كل عينة إلى صف مُسمّى (`timestamp`،`ph`،...) فتبقى البيانات قابلةً للفك بعد سنوات، ويُبقي `pathlib` مسارات الملفات نظيفة. ستصمّم *المخطط* بنفسك في الخطوة 1 ، ذلك المخطط هو ما يجعل كل خطوة لاحقة (التحقق، والمتوسطات المتدحرجة، والرسوم) بحثًا بالاسم بدلًا من كومة سلاسل if-else.

**✅ قائمة التحقق**

- ✅ أنشأ `uv init water-quality` مشروعًا مع `pyproject.toml`.
- ✅ نجح `uv add matplotlib`؛ طبع فحص الاستيراد إصدار matplotlib.

## الخطوة 1: حدّد المعاملات والنطاقات ومخزن CSV

يبدأ كل مواصفة مراقبة بالسؤال نفسه: *ما الذي نراقبه، وما القيمة الآمنة؟* ترمّز هذه الخطوة الإجابة كبيانات ، قاموس معاملات، لكلٍّ نطاق منخفض/مرتفع ووحدة ، وتكتب قراءاتك الأولى إلى `readings.csv`.

### 1.1 اكتب `PARAMETERS` و`make_reading` و`write_reading`

**👟 تلميح البداية :** ضع مواصفة كل معامل (`low`،`high`،`unit`) في قاموس `PARAMETERS` واحد، ثم ابنِ القراءات كقواميس عادية وألحقها بـ CSV ، يحفظ `DictWriter` ترتيب الأعمدة لك.

```python
# monitor.py
import csv
import json
from pathlib import Path

PARAMETERS = {
    "ph":          {"low": 6.5, "high": 8.5,    "unit": "pH"},
    "turbidity":   {"low": 0.0, "high": 5.0,    "unit": "NTU"},
    "tds":         {"low": 0.0, "high": 500.0,  "unit": "ppm"},
    "temperature": {"low": 5.0, "high": 25.0,   "unit": "C"},
    "chlorine":    {"low": 0.2, "high": 2.0,    "unit": "mg/L"},
}

def make_reading(t: str, ph: float, turb: float, tds: float,
                 temp: float, chlorine: float) -> dict:
    return {"timestamp": t, "ph": ph, "turbidity": turb, "tds": tds,
            "temperature": temp, "chlorine": chlorine}

FIELDNAMES = ["timestamp", "ph", "turbidity", "tds", "temperature", "chlorine"]

def write_reading(path: str, reading: dict) -> None:
    is_new = not Path(path).exists()
    with open(path, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        if is_new:
            writer.writeheader()
        writer.writerow(reading)
```

كون `PARAMETERS` *بيانات لا حرفية متناثرة* هو التصميم كله: "النطاق الآمن" أصبح الآن بحثًا (`PARAMETERS["ph"]["high"]`)، فيقرأ التحقق (الخطوة 2) والتنبيهات (الخطوة 4) وخطوط الرسم الإرشادية (الخطوة 6) المصدر الواحد نفسه للحقيقة. تقبل `make_reading` قيمة واحدة لكل حقل في توقيع ثابت، فلا يمكن لقراءة أن تكتسب عمودًا لا يعرفه مخطط CSV بصمت. `DictWriter` مع `writeheader()` يكتب التسميات مرة واحدة، وهو ما يُبقي CSV مقروءًا بشريًا لاحقًا.

### 1.2 ازرع ست قراءات عينة

**👟 تلميح البداية :** نصف ساعة من العينات على فترات 15 دقيقة، مع *انجراف الماء للأسوأ* في النهاية ، pH يصعد، والكلور ينهار ، حتى يكون للخطوات اللاحقة شيء حقيقي تصطاده.

```python
# Seed the log (a sensor as data)
samples = [
    make_reading("08:00", 7.0, 1.1, 220,  17.5, 0.9),
    make_reading("08:15", 7.3, 1.4, 235,  18.0, 0.7),
    make_reading("08:30", 7.7, 4.8, 260,  18.2, 0.4),
    make_reading("08:45", 8.1, 2.1, 300,  18.5, 0.2),
    make_reading("09:00", 8.7, 1.8, 340,  18.6, 0.1),
    make_reading("09:15", 9.4, 1.9, 520,  18.7, 0.02),
]
for reading in samples:
    write_reading("readings.csv", reading)

print(Path("readings.csv").read_text())
```

بيانات الزرع *متعمّدًا* ليست نظيفة كلها: بحلول 09:00 يعبر pH قيمة 8.5، وtds يندفع بعد 500، والكلور ينزلق نحو الصفر. هذا ما يجعل الخطوات التالية تُبلِّغ عن شيء ذي معنى ، مراقب لا يقول أبدًا سوى "كل شيء بخير" ليس مراقبًا تثق به.

**🎯 الناتج المتوقع :** صف رأس زائد ستة صفوف في الملف `/` الذاكرة، ينتهي بـ `09:15,9.4,1.9,520,18.7,0.02`.

**🩹 إذا لم يعمل :** إذا تكرر الرأس عند كل إلحاق، فحُسب `is_new` كـ `False` ، تمرير ملف فارغ موجود يجعل `DictWriter` يضيف عناوين إلى الأبد. إذا اختلطت الأعمدة، فتختلف مفاتيح قاموس `reading` عن `FIELDNAMES` ، يكتب `DictWriter` بالمفتاح، فيقع مفتاح مكتوب خطأ في خلية فارغة. إذا كان `newline=""` مفقودًا من `open`، فقد يكتسب الملف أسطرًا فارغة بين الصفوف على Windows.

### 1.3 تحقق من المخزن

**✅ قائمة التحقق**

- ✅ يوجد `readings.csv` مع صف رأس واحد وستة صفوف بيانات بالضبط.
- ✅ تشغيل الزرع مرتين يُلحق، لا يستبدل ، السجل إلحاقي فقط.
- ✅ يحمل `PARAMETERS` كل معامل مع `low` و`high` و`unit`.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يخزّن CSV القيم الخام فقط ، لا عمود "alert!". لو *أضفت* عمود حالة عند الكتابة، ما الذي قد يقدم عليه لاحقًا، وما الذي يعنيه ذلك عن تخزين *البيانات* مقابل تخزين *قرارات مشتقة من البيانات*؟
- سجلات المستشعرات تنمو إلى الأبد. متى يكون مخطط CSV هذا جيدًا، وعند أي حجم ستحتاج قاعدة بيانات حقيقية ، وأي قرارات (المخطط، والفهرسة، والاحتفاظ) يتخذها CSV *لصالحك* دون أن تلحظ ذلك؟

## الخطوة 2: تحقق من القراءات ضد النطاقات الآمنة

الآن تعمل المواصفة. التحقق دالة واحدة فوق `PARAMETERS`: لكل معامل، هل قيمة العينة بين منخفض ومرتفع؟ تطبع هذه الخطوة جدول نجاح/فشل مقروءًا لكل عينة.

### 2.1 اكتب `validate` و`print_validation`

**👟 تلميح البداية :** حلّق أسماء المعاملات، واسحب `value = reading[name]` والمواصفة، وسجّل `ok` ، علم ، لكل معامل؛ يُنسّق الطابع الجدول.

```python
# monitor.py (continued)
def validate(reading: dict) -> dict:
    results = {}
    for name, spec in PARAMETERS.items():
        value = reading[name]
        results[name] = {
            "value": value,
            "ok": spec["low"] <= value <= spec["high"],
            "spec": spec,
        }
    return results

def print_validation(reading: dict) -> None:
    print(f"--- {reading['timestamp']} ---")
    for name, result in validate(reading).items():
        status = "PASS" if result["ok"] else "FAIL"
        width = result["spec"]["high"] - result["spec"]["low"]
        position = (result["value"] - result["spec"]["low"]) / width
        bar = "#" * max(1, int(position * 10)) + "." * max(0, 10 - int(position * 10))
        print(f"{name:>12}: {result['value']:6.2f} {result['spec']['unit']:>4}"
              f"  [{bar}]  {status}")

print_validation(samples[-1])
```

علم `ok` داخل كل نتيجة *مركّب* عن قصد: `low <= value <= high` في تعبير واحد يقرأ مثل المواصفة ولا يمكنه الانقلاب عندما يوسّع شخص نطاقًا وينسى موقعًا ثانيًا. مخطط الشريط المصغّر (`#`/`.`) تصوير رخيص لـ*أين* داخل النطاق تقع العينة ، "PASS" على حافة النطاق تمامًا يستحق النظر حتى قبل منطق الحدود في الخطوة 4.

**🎯 الناتج المتوقع :** `--- 09:15 ---` ثم جدول: `ph` FAIL (9.40 عند أقصى حافة شريطه)، `turbidity` PASS بالحافة العالية، `tds` FAIL بعد 500، `temperature` PASS منتصف النطاق، `chlorine` FAIL تحت 0.2.

**🩹 إذا لم يعمل :** إذا قرأت كل الصفوف `PASS` إلى الأبد، فقارن `validate` بقيم العينة نفسها (خطأ `spec` مثل `reading[name] <= reading[name]`). إذا أظهرت كلها `FAIL`، فـ`value` سلسلة من CSV (`float("9.4")` مطلوبة) ، تشغيل `validate` على صفوف مُحمَّلة، لا قواميس حرفية، يُوقع فيه عادة. إذا أظهر الشريط أطرافًا سالبة، فقيمة أعلى من `high`: `position > 1` لأن حساب النطاق افترض القيمة داخله.

### 2.2 تحقق من التحقق

**✅ قائمة التحقق**

- ✅ عينة 08:00 تجتاز المعاملات الخمسة كلها.
- ✅ عينة 09:15 تفشل في `ph` و`tds` و`chlorine`.
- ✅ قيمة *مساوية تمامًا* لحافة نطاق (مثل `ph = 8.5`) تُحسب `PASS` ، الحدود شاملة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- الحدود الشاملة تعني أن `8.5` يجتاز لكن `8.51` يفشل ، خط "آمن" بعرض سنتيمتر واحد. أين تجعل أخطاء القراءة (مستشعر ضوضائي) الحدود الشاملة الصارمة خطرة، وما الذي ستضيفه؟
- أيهما أكثر صدقًا في سجل مراقبة: `ok` كمنطق بولي، أم تسجيل *مقدار* الخروج عن النطاق أيضًا؟ أين يبدأ ذلك البعد في اتخاذ قرارات درجة الخطورة (الخطوة 4) عنك؟

## الخطوة 3: المتوسطات المتدحرجة والانجراف

عينة واحدة قد تكون ضجيجًا؛ *الاتجاه* قصة. تحسب هذه الخطوة المتوسطات المتدحرجة (متوسط آخر العينات) ودرجة انجراف (متوسط حديث ناقص خط أساس مبكر) لكل معامل، مصطادة تغييرات بطيئة كان ليفوّتها فحص نقطة-زمنية.

### 3.1 اكتب `load_readings` و`rolling_mean` و`drift`

**👟 تلميح البداية :** يُعيد `csv.DictReader` صفوفًا قيمها *سلاسل* ، حوّل الأعداد العائمة مرة واحدة. ثم المتوسط المتدحرج هو `sum/length` بنافذة، والانجراف هو `recent_mean - baseline_mean`.

```python
# monitor.py (continued)
def load_readings(path: str = "readings.csv") -> list[dict]:
    with open(path) as f:
        return list(csv.DictReader(f))

def values(readings: list[dict], name: str) -> list[float]:
    return [float(r[name]) for r in readings]

def rolling_mean(readings: list[dict], name: str, window: int = 3) -> list[float]:
    vals = values(readings, name)
    means = []
    for i in range(len(vals)):
        chunk = vals[max(0, i - window + 1) : i + 1]
        means.append(sum(chunk) / len(chunk))
    return means

def drift(readings: list[dict], name: str,
          baseline_window: int = 3, recent_window: int = 3) -> float:
    vals = values(readings, name)
    baseline = sum(vals[:baseline_window]) / baseline_window
    recent = sum(vals[-recent_window:]) / recent_window
    return recent - baseline

for name in PARAMETERS:
    print(f"{name:>12}: drift {drift(samples, name):+6.2f} "
          f"| rolling {rolling_mean(samples, name)[-1]:6.2f}")
```

تحويل السلاسل إلى أعداد عائمة مرة واحدة، في `values()`، هو إصلاح فخ CSV الكلاسيكي: تشتغل كل دالة لاحقة على أرقام دون رشّ `float(...)` في كل مكان. ينمو `rolling_mean` نافذته `window` فقط عندما توجد عينات أقل (`max(0, i - window + 1)`)، فأول نقطة نافذتها 1 بدلًا من الانهيار. `drift` مقارنة مبكرة-مقابل-حديثة، بعلامة فيهم *الاتجاه*: `+` يعني صعودًا، `-` هبوطًا.

**🎯 الناتج المتوقع :** `ph: +1.40` و`tds: +148.3` و`chlorine: -0.56` ، المعاملات الثلاثة التي ستنبّه لاحقًا ، مع `turbidity: -0.50` و`temperature: +0.70` متأخرتين في الحجم.

**🩹 إذا لم يعمل :** إذا كان `drift` `0.0` لكل شيء، فحصل `values()` على سلاسل وجرت مقارنات `float(r[name])` على ترتيب نصّي (`'220' > '500'` فارغة). إذا طُبعت أول قيمة متدحرجة كمتوسط العينة كاملة، فخدعة شريحة `max(0, ...)` مفقودة. إذا اشتعل `KeyError: 'turbidity'`، فعمود CSV الفعلي يختلف عن `FIELDNAMES` (خطأ إملائي في الرأس) ، افحص `DictReader.fieldnames`.

### 3.2 تحقق من كشف الانجراف

**✅ قائمة التحقق**

- ✅ `rolling_mean(samples, "ph")[-1]` حول 8.7، مسحوبًا بعينات 09:15 العالية.
- ✅ `drift(samples, "chlorine")` سالب واضح، يشير إلى فقدان الكلور.
- ✅ استبدال آخر قراءة بنسخة من `samples[0]` يُسقط انجراف `ph` من `+1.40` إلى نحو `+0.60` ، الحساب يتفاعل فعلًا مع البيانات.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يقارن `drift` هنا *المتوسطات*، فينفخ فيه ارتفاع واحد هائل. ما الإحصائية الواحدة التي تعزل الانجراف عن قيمة متطرفة بينما تكتشف مع ذلك اتجاهًا حقيقيًا ، وبأي تكلفة على الحساسية؟
- نافذة 3 عينات على سجل من 6 عينات بلا تاريخ تقريبًا. لو قارنت بدلًا من ذلك متوسط *اليوم* بمتوسط *الأسبوع كله*، أي نمط فشل جديد يظهر؟ (فكّر في معنى "الخط الأساس" عندما يكون الماء سيئًا بالفعل.)

## الخطوة 4: نبّه على الإخفاقات والقيم الحدّية والانجراف

تكسب المراقبة قوتها بإخبارك *ما الذي تنظر إليه*. تحوّل هذه الخطوة التحقق والانجراف إلى تنبيهات مُرتَّبة: الإخفاقات الصلبة أولًا (خارج النطاق)، ثم القيم الحدّية الملاصقة لحد، ثم تحذيرات الانجراف البطيء، وملخص نهائي "هذا يحتاج إنسانًا".

### 4.1 اكتب `issue_alerts`

**👟 تلميح البداية :** مرّر أحدث *قراءة* زائد نتائج الانجراف لكل معامل؛ لكلٍّ، اختر أعلى درجة خطورة تنطبق (FAIL يسبق BORDERLINE يسبق DRIFT يسبق OK).

```python
# monitor.py (continued)
BORDERLINE_FRACTION = 0.05

def issue_alerts(readings: list[dict]) -> list[dict]:
    latest = readings[-1]
    drift_by_name = {name: drift(readings, name) for name in PARAMETERS}
    alerts = []
    for name, result in validate(latest).items():
        spec = result["spec"]
        value = result["value"]
        if not result["ok"]:
            alerts.append({"severity": "ALERT", "name": name,
                           "message": f"{value:.2f} {spec['unit']} outside "
                                      f"{spec['low']}-{spec['high']}"})
            continue
        low_gap = (value - spec["low"]) / (spec["high"] - spec["low"])
        if low_gap < BORDERLINE_FRACTION or low_gap > 1 - BORDERLINE_FRACTION:
            alerts.append({"severity": "BORDERLINE", "name": name,
                           "message": f"{value:.2f} {spec['unit']} hugging a boundary"})
            continue
        d = drift_by_name[name]
        if abs(d) > 1.0:
            alerts.append({"severity": "DRIFT", "name": name,
                           "message": f"drift {d:+.2f} {spec['unit']} over last samples"})
    return alerts

for alert in issue_alerts(samples):
    print(f"[{alert['severity']:9}] {alert['name']:>12}: {alert['message']}")
```

سلم `continue` مُرمِّز أولوية: يُطلق كل معامل *أسوأ* تنبيهه ويتقدم، لأن تكديس "DRIFT" فوق pH يُنذِر أصلًا يدفن العنوان. يطبّع `low_gap` الموضع داخل النطاق إلى `0..1`، فـ"ضمن 5% من حد" فحص واحد يعمل لأي معامل بغضّ النظر عن وحداته. تنطبق عتبات `drift` على كل معامل، وهو أمر تقريبي ، سؤال سقراطي بعد الجدول يسأل أين يستحق ذلك صقلًا.

**🎯 الناتج المتوقع :** `[ALERT] ph: 9.40 pH outside 6.5-8.5` و`[ALERT] tds: 520.00 ppm outside 0.0-500.0` و`[ALERT] chlorine: 0.02 mg/L outside 0.2-2.0` ، ثلاثة إخفاقات صلبة، ولا وصيفات على نفس العينات.

**🩹 إذا لم يعمل :** إذا لم يُطلق شيء `ALERT` على `ph`، فاستخدم `validate` العينة *الأولى* بدلًا من `readings[-1]`. إذا لم يظهر `BORDERLINE` أبدًا، فأكل `continue` السابق عليه كل صف داخل النطاق ، تحقق من ترتيب سلم التنبيه. إذا استشهدت رسائل `drift` بالوحدة الخاطئة، فكان `drift_by_name` مفاتَجه بالاسم لكنه قرأ من قاموس مختلف.

### 4.2 تحقق من التنبيهات

**✅ قائمة التحقق**

- ✅ تُنتج عينة 09:15 ثلاثة `ALERT` ، `ph` و`tds` و`chlorine`.
- ✅ لا يُنتج `temperature` أي تنبيه ، هو في منتصف النطاق ومستقر.
- ✅ عينة *عند* `ph = 8.5` تمامًا تُطلق `BORDERLINE` (تجتاز فحص النطاق لكنها ضمن 5% من الحد الأعلى).
- ✅ عينة 08:00 وحدها (إعادة زرع) تُنتج صفر تنبيهات.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يستخدم `BORDERLINE` نسبة 5% ثابتة من *عرض النطاق* ، لـ pH ذلك 0.1 وحدات pH، ولـ tds 25 ppm. أين يجمع التناسب-إلى-النطاق حقائق فيزيائية مختلفة تمامًا معًا، وما العتبة النسبية للوحدة التي ستكون أعدل؟
- يُسقط سلم التنبيه `DRIFT` عندما أُطلق `ALERT` أصلًا. متى يكون تحذير الانجراف *أكثر* قابلية للتنفيذ من الفشل الحالي ، وما الذي كان محركك سيصدره ليقول "ستفشل خلال الساعة"؟

## الخطوة 5: ارسم الاتجاهات مع خطوط إرشاد النطاق الآمن

تحوّل الرسوم جداول المعاملات الخمسة إلى لمحة واحدة. ترسم هذه الخطوة كل معامل كرسم فرعي خاص به بنقاط علامات، وخطوط `axhline` حمراء متقطعة عند حدود النطاقات الآمنة، وملف PNG محفوظ ، منظر مشغّل الصباح.

### 5.1 اكتب `plot_readings`

**👟 تلميح البداية :** رسم فرعي واحد لكل معامل، `plot(timestamps, values, marker="o")`، ثم `axhline` لكل حد؛ و`tight_layout()` قبل الحفظ.

```python
# monitor.py (continued)
import matplotlib.pyplot as plt

def plot_readings(readings: list[dict], path: str = "water_quality.png") -> None:
    timestamps = [r["timestamp"] for r in readings]
    names = list(PARAMETERS)
    fig, axes = plt.subplots(len(names), 1, figsize=(8, 2.0 * len(names)), sharex=True)
    for ax, name in zip(axes, names):
        series = [float(r[name]) for r in readings]
        ax.plot(timestamps, series, marker="o", label=name)
        ax.axhline(PARAMETERS[name]["high"], color="red", ls="--", lw=1)
        ax.axhline(PARAMETERS[name]["low"], color="red", ls="--", lw=1)
        ax.set_ylabel(f"{name} ({PARAMETERS[name]['unit']})")
        ax.legend(loc="best", fontsize=8)
    fig.suptitle("Water quality over the morning")
    fig.tight_layout()
    fig.savefig(path)
    print(f"saved {path}")

plot_readings(samples)
```

تأتي خطوط الإرشاد الحدّية من قاموس `PARAMETERS` *نفسه* الذي يستخدمه المحقق ، فتغيير مواصفة يعيد رسم الرسم بشكل صحيح مع صفر صيانة، وهو مردود تصميم "المصدر الواحد للحقيقة" في الخطوة 1. تُجبر `sharex=True` كل معامل على محور الزمن نفسه، فتقارن العين *متى* تتكدس الإخفاقات. يميّز `marker="o"` العينات المنفصلة، وحفظ PNG هو ما يجعل الرسم قطعة أثرية دائمة لا نافذة زائلة.

**🎯 الناتج المتوقع :** `saved water_quality.png` ، شكل بخمسة رسوم فرعية مكدسة تتشارك محور `08:00`..`09:15`، حدود حمراء متقطعة مرئية على كل رسم، وpH/tds/chlorine يعبرون خطوطهم الحمراء بحلول نهاية الصباح.

**🩹 إذا لم يعمل :** إذا كانت الصورة فارغة، فجرى `savefig` دون استدعاء `plot` سابق أو كُتبت المحاور فوقها بـ `subplots` ثانية. إذا لم تتشارك الرسوم الفرعية المحور، فأسقطت `sharex=True`. إذا تشابكت الترقيمات بشكل غريب (`01` خطوات رأسية)، فـ`tight_layout()` مفقودة وتتصادم التسميات ، استدعِها قبل الحفظ.

### 5.2 تحقق من الرسم

**✅ قائمة التحقق**

- ✅ رسم فرعي واحد لكل معامل، بطوابع زمنية على محور x المشترك.
- ✅ `axhline` حمراء متقطعة تُظهر الحدّين على *كل* رسم فرعي.
- ✅ ملف الصورة موجود على القرص ويعبر pH خطه العلوي مرئيًا بحلول 09:15.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يعيد الرسم تشغيل التاريخ. إذا استطاعت أداة مراقبة أن *تخزّن* القراءات الخام فقط و*تعيد حساب* كل شيء عند العرض، فماذا يعني ذلك عن مكان عيش التحقق والانجراف والتنبيهات ، في مسار الكتابة أم مسار القراءة؟
- خمسة رسوم فرعية صغيرة تجعل القيم المتطرفة واضحة لكن المقادير صعبة المقارنة. لو تقاسما turbidity (0-5 NTU) وtds (0-500 ppm) محورًا واحدًا، ماذا كانت العين *لتستنتج خطأً* ، وهل يجادل ذلك مع أو ضد قياس كل معامل بمعيار خاص؟

## ⚠️ المآزق الشائعة

- **انتفاخ السلاسل من CSV.** يُعيد `DictReader` كل خلية كنص، فـ `float(r["ph"]) > 9.0` يفرز *سلاسل* بصمت ("9.40" > "9.4"؟ غير موثوق). الإصلاح: حوّل الأعداد العائمة مرة واحدة عند التحميل، ويفضَّل في `values()`.
- **حدود تستبعد بصمت.** `low < value < high` (صارم) يقرأ مثل المواصفة لكنه يرفض عينة *على الحافة تمامًا*. الإصلاح: استخدم `<=`/`>=`، ثم قرر صراحةً هل الحافة آمنة.
- **"مستشعر" يزوّر التاريخ.** زرع CSV يدويًا في وضع Share يستبدل بيانات جلسة الإلحاق ، يبقى الملف لكن التسلسل يكذب. الإصلاح: `write_reading` إلحاقية فقط وفصل بين "الزرع" و"المباشر".
- **نوافذ متدحرجة تنظر للخلف إلى لا شيء.** `vals[i-window:i]` عند الفهرس 0 ينتج شريحة فارغة → `sum/0`. الإصلاح: ثبّت النافذة بـ `max(0, i - window + 1)`.
- **رسوم تنزاح خطوطها الحمراء عن المواصفة.** نسخ-ولصق أرقام الحدود في `axhline` يعني أن تغيير مواصفة يرسم الرسم خطأً بصمت. الإصلاح: اقرأ الحدود دائمًا من `PARAMETERS`.

## ما بنيته للتو

خط أنابيب مراقبة في ملف واحد: سجل CSV دائم، وتحقق مدفوع بالمواصفة، ومتوسطات متدحرجة وانجراف، ومحرك تنبيهات مُرتَّب بدرجة الخطورة، ورسم بخطوط إرشاد مشتقة من المواصفة. الفكرة القابلة للنقل أن *"راقب هذا الشيء" شكل بيانات*: مصدر (عينات)، ونموذج (قاموس مواصفة)، وإشارات مشتقة (تحقق، انجراف)، وقارئ (تنبيهات، رسم). نفس ذلك الشكل يقود لوحات المراقبة وأنظمة الشذوذ وكل لوحة حالة CI رأيتها ، لقد بنيت واحدًا من البداية للنهاية.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/water-quality/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/water-quality) في مستودع الدورة نسخة أكمل من الكود أعلاه، مع حلقة عينات حية ومساعدات تصدير. استنسخه، أو افتح المستودع كاملًا في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وشغّله من هناك.
:::

## إلى أين تذهب من هنا

- أضف حقل *مصدر* لكل قراءة (حنفية، بئر، نهر) وابنِ عامل تصفية لكل مصدر حتى تقول التنبيهات *أي* مصدر يفشل.
- حوّل محرك التنبيه إلى جدول قواعد، ثم إلى حلقة `live()` تستعلم CSV كل N ثانية وتعيد رسم الرسم ، مراقب دفق حقيقي.
- صدّر التنبيهات إلى CSV ثانٍ (`alerts.csv`) واحسب معدله المتدحرج نفسه ، إرهاق التنبيه نفسه مقياس يستحق المشاهدة.
- احسب "درجة مخاطر" إجمالية لكل مصدر بجمع أوزان درجة الخطورة على كل المعاملات، وارسم *ذلك* كخط العنوان.

## شارك مشروعك مع الصف

بَنيت شيئًا تفتخر به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع قدّمها طلاب آخرون ، وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل: عمل fork للمستودع، وإنشاء فرع، والالتزام بملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓