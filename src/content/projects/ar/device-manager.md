---
title: "مدير الأجهزة"
description: "أدر أجهزة IoT مع الإعداد عن بُعد، تحديثات البرنامج الثابت، ومراقبة الصحة."
difficulty: "beginner"
estimatedMinutes: 60
tags: ["cli", "json", "datetimes", "file-persistence"]
prerequisites:
  - "أساسيات بايثون (قوائم، قواميس، حلقات، دوال)"
  - "فتح الملفات وقراءتها"
learningObjectives:
  - "تحميل سجل أجهزة من JSON وإبقاؤه مرتبًا حسب معرف الجهاز"
  - "قياس عمر نبضة القلب بحسابات datetime وتصنيف صحة الجهاز"
  - "كشف انحراف البرنامج الثابت ضد خريطة أحدث إصدار"
  - "استنتاج الإعداد الفعلي لكل جهاز بطبقات تجاوزات الغرفة"
  - "طباعة تقرير أسطول وإتاحته كواجهة CLI"
---

# 📡 أنشئ مدير الأجهزة

أسطول من الأجهزة المتصلة كومة متزايدة من المشاكل الصغيرة ما لم يتتبّعها أحد: أجهزة الاستشعار ترسل نبضًا ثم تصمت، و`cam-01` صامت منذ ستة أيام، واثنان من أجهزة `temp-hum` الثلاثة متأخران بإصدار برنامج ثابت، ويجب أن ينبّه مستشعر المرآب عند −5 °C بينما ينبّه البقية عند 28. مدير الأجهزة يحول تلك الحقائق المبعثرة إلى سجل يمكنك فرزه، وحكم صحة لكل جهاز، وقائمة تحديث، وإعداد فعلي لكل جهاز، وتقرير أسطول في شاشة واحدة ، كل ذلك من JSON وقليل من حساب `datetime`، دون أي شبكة.

يفترض هذا ما يعادل بايثون 101 ، قوائم وقواميس وحلقات ودوال ، إضافةً إلى الراحة في فتح الملفات. لا شيء من وحدة تحليل البيانات مطلوب. هذا المشروع اختياري وغير مقيَّم؛ راجع [المشاريع الواقعية](/ar/مشاريع) للقائمة الكاملة المتزايدة.

## 🎯 ما ستفعله

1. تحميل سجل أجهزة من `devices.json`، مرتبًا حسب المعرف.
2. تصنيف صحة كل جهاز من المدّة المنقضية منذ آخر نبضة (متصل / تحذير / غير متصل).
3. مقارنة البرنامج الثابت لكل جهاز بأحدثه لنموذجه وبناء قائمة تحديث.
4. استنتاج الإعداد الفعلي لكل جهاز بطبقات التجاوزات على مستوى الغرفة فوق إعدادات النموذج الافتراضية.
5. طباعة تقرير أسطول مجمّعًا حسب الغرفة وإخراجه كواجهة CLI صغيرة.

## أين تُشغّل هذا

**محليًا مع `uv`** هو المسار الموصى به ، مدير الأجهزة أداة استمرار ملفات (ملف `devices.json` خاص بك)، وهي تعيش على نظام ملفات حقيقي.

**GitHub Codespaces** بديل بلا إعداد: افتح [مستودع المقرر كاملًا في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython مثبتان مسبقًا) وشغّل الأوامر نفسها من طرفية متصفح.

**Google Colab وKaggle Notebooks أو Binder** تعمل مع كل خطوة ، يشغّل الدفتر في [`examples/device-manager/notebook.ar.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/device-manager/notebook.ar.ipynb) منطق الأسطول نفسه على سجل الأجهزة الأربعة المرفق في الذاكرة. المفاضلة الصريحة: لا يستطيع الدفتر إبقاء ملف مُحدَّث كما تفعل CLI.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/device-manager/notebook.ar.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/device-manager/notebook.ar.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdevice-manager%2Fnotebook.ar.ipynb)

## الإعداد

`uv` أداة واحدة تحل محل سلسلة «ثبّت بايثون، ثم pip، ثم أداة بيئة افتراضية» ، وهذا المشروع مكتبة قياسية نقي.

**macOS / Linux** (الطرفية):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

أغلق الطرفية وأعد فتحها، ثم تأكّد من التثبيت:

```bash
uv --version
```

ثم أجهّز المشروع:

```bash
uv init device-manager
cd device-manager
```

**✅ قائمة التحقق**

- ✅ يطبع `uv --version` رقم إصدار.
- ✅ يوجد مجلد `device-manager/` بملف `pyproject.toml`.
- ✅ ينجح `python -c "import json, datetime"` ، لا حزم طرف ثالث.

## الخطوة 1: تحميل سجل الأجهزة

كل قرار لاحق يحتاج نقطة البداية نفسها: القائمة الكاملة المرتبة للأجهزة. السجل مجرد JSON ، سجل واحد لكل جهاز بحقول id وname وroom وmodel وfirmware وآخر نبضة ، وتحميله يعني فتح الملف، وقراءة وجهتين، واتخاذ قرار *ترتيب ثابت* ستعتمد عليه طوال المشروع.

### 1.1 أنشئ devices.json وregistry.py

**👟 تلميح البداية :** خزّن السجل، ثم اجعل `load_devices()` تُرجعه `sorted(...)` حسب معرف الجهاز ليكون كل تقرير قاطعًا (حتميًا):

```bash
cat > devices.json <<'EOF'
[
  {"id": "th-01", "name": "Living Room Sensor", "room": "living", "model": "temp-hum", "firmware": "1.2.0", "last_seen": "2026-09-06T08:15:00"},
  {"id": "th-02", "name": "Kitchen Sensor", "room": "kitchen", "model": "temp-hum", "firmware": "1.2.0", "last_seen": "2026-09-06T09:00:00"},
  {"id": "cam-01", "name": "Front Door Camera", "room": "entry", "model": "cam-1080", "firmware": "2.0.5", "last_seen": "2026-08-30T22:10:00"},
  {"id": "th-03", "name": "Garage Sensor", "room": "garage", "model": "temp-hum", "firmware": "1.1.9", "last_seen": "2026-09-06T06:40:00"}
]
EOF
```

```python
# registry.py
import json

def load_devices(path: str = "devices.json") -> list[dict]:
    with open(path) as f:
        devices = json.load(f)
    return sorted(devices, key=lambda d: d["id"])

if __name__ == "__main__":
    for d in load_devices():
        print(f"{d['id']:<8} {d['name']:<22} {d['model']:<10} firmware {d['firmware']}  ({d['room']})")
```

```bash
uv run python registry.py
```

`sorted(devices, key=lambda d: d["id"])` هو القرار الهادئ الذي يُبقي كل خطوة لاحقة مملة بالمعنى الجيد: سيعرض `fleet_report` جهاز `cam-01` قبل `th-01` *لأن المحمّل يرتّب*، فلا يعيد أي دالة أخرى تنفيذ قاعدة كهذه أبدًا. عروض التنسيق `:<8`/`:<22` هي بداية كل جدول منسّق في هذا المشروع ، عمود بمحاذاة يسارية بعرض ثابت.

**🎯 الناتج المتوقع :**

```
cam-01   Front Door Camera      cam-1080   firmware 2.0.5  (entry)
th-01    Living Room Sensor     temp-hum   firmware 1.2.0  (living)
th-02    Kitchen Sensor         temp-hum   firmware 1.2.0  (kitchen)
th-03    Garage Sensor          temp-hum   firmware 1.1.9  (garage)
```

**🩹 إذا لم يعمل :** إذا كان الترتيب th-01 قبل cam-01، فإن `sorted` إما مفقود داخل `load_devices` أو يفرز حقلًا مختلفًا (`key=lambda d: d["id"]`، وليس `d["name"]`). إذا انطلق `json.decoder.JSONDecodeError`، فقد كتب الـheredoc JSON تالفًا ، السجل الأخير في القائمة المغلقة `]` يجب ألا يحمل فاصلة؛ `json.load` عديم الرحمة مع فاصلة ناقصة.

### 1.2 تحقّق من السجل

**✅ قائمة التحقق**

- ✅ تُرجع `load_devices()` أربعة قواميس مرتبة حسب `id` تصاعديًا.
- ✅ كل جهاز يملك المفاتيح الستة (`id`، `name`، `room`، `model`، `firmware`، `last_seen`).
- ✅ إعادة تشغيل العرض تطبع ناتجًا متطابقًا ، JSON يحفظ التخطيط، والترتيب يجعله مستقرًا.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لا يحوي السجل أي حقل `status` ، ستُحسب الصحة *من* `last_seen` في الخطوة 2. لماذا تخزين «متصّل» في JSON فكرة أسوأ من إعادة حسابه دائمًا من النبضة؟
- المعرّفات مقروءة بشريًا (`th-01`) لا عشوائية. متى يكون المعرف المقروء بشريًا فخًّا (`th-10` يُرتَّب قبل `th-2` معجميًا ، انظر `sorted` بلا مفتاح)؟ أي خاصية في فرز السلاسل تجعل المعرّفات بحاجة إلى تكرارها؟

## الخطوة 2: الحكم على الصحة من نبضات القلب

أكثر معلومة مفيدة في استخبارات الأسطول هي «كم مرّ ومنذ تحدث كل جهاز آخر مرة». تحوّل حسابات `datetime` سلسلة `last_seen` إلى عُمر، ويصبح حكم الصحة قرار عتبات صغيرًا: لحظات → متصل، أقل من ساعتين → تحذير، أكثر من نصف يوم → غير متصل. نفس مجموعة القواعد، لكل جهاز، دون أي حقل يخرج عن التزامن.

### 2.1 اكتب health.py

**👟 تلميح البداية :** حوّل `last_seen` عبر `datetime.fromisoformat`، واطرحه من مرجع ثابت «الآن»، وصفّف الـ`timedelta` الناتج بسلسلة مقارنات:

```python
# health.py
from datetime import datetime, timedelta

from registry import load_devices

NOW = datetime.fromisoformat("2026-09-06T09:05:00")

def age_of(device: dict, now: datetime = NOW) -> timedelta:
    return now - datetime.fromisoformat(device["last_seen"])

def health_status(age: timedelta) -> str:
    if age > timedelta(hours=12):
        return "offline"
    if age > timedelta(minutes=30):
        return "warning"
    return "online"

if __name__ == "__main__":
    for d in load_devices():
        age = age_of(d)
        print(f"{d['id']:<8} {health_status(age):<8} age {age}")
```

`NOW` هو الحيلة الصادقة لنظام بلا بطاريات: كود نبضات القلب الحقيقي يقارن مع `datetime.now()`، الذي يكسر قابلية إعادة إنتاج الاختبارات ولقطات الشاشة. هنا `NOW` لحظة ثابتة، مُمرَّرة كقيمة افتراضية، فيكون ناتج العرض مستقرًا *و* يستطيع مستدعٍ تجاوزها بالجسم الحي. انظر ما تعنيه الحدود لإنسان: غير المتصل ليس «الجهاز مطفأ» ، حرفيًا «لم يُسمع عن هذا الشيء منذ اثنتي عشرة ساعة»، وهو الحكم الذي تُنبّه به شخصًا.

**🎯 الناتج المتوقع :**

```
cam-01   offline  age 6 days, 10:55:00
th-01    warning  age 0:50:00
th-02    online   age 0:05:00
th-03    warning  age 2:25:00
```

**🩹 إذا لم يعمل :** إذا قرأ كل عُمر `0:00:00`، فقد مرّرت `datetime.now()` في مكانٍ *بعد* بناء القيمة الافتراضية ، احذف الوسيط ودع `NOW` يُستخدم. وإذا أثارت الطوابع `ValueError`، فتحوي سلسلة ISO لاحقة `Z` (علامة UTC) لا يقبلها `fromisoformat` في إصدار بايثون هذا ، استبدل `Z` بـ `+00:00` قبل التحليل، واعتبر ذلك مصيدة شكل بيانات واقعية تخطيتَها لتوّك.

### 2.2 تحقّق من فحص الصحة

**✅ قائمة التحقق**

- ✅ `cam-01` (6 أيام و10 ساعات) → غير متصل؛ `th-03` (ساعتان و25 دقيقة) → تحذير؛ `th-02` (5 دقائق) → متصل.
- ✅ حد 30 دقيقة يعني «تحذير عند أكثر من 30 دقيقة»، لا «متصل حتى 31» ، *عمر 30:00 بالضبط* هو `online`.
- ✅ لا يحتاج `health_status` إلى قاموس الجهاز ، يستقبل `timedelta` فقط، فيحصل أي جهازين بعمرين متساويين على الحكم نفسه.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- العتبات الصحيحة (30 دقيقة، 12 ساعة) ترميز لسياسة فرز أولويات. ماذا يتغير في `health_status` إذا أردت «فريزرات طبية تُنبّه عند 10 دقائق صمت لكن الكاميرات عند يومين» ، وهل تقول توقيع الدالة شيئًا عن من يملك ذلك الاختيار؟
- `cam-01` «غير متصل» عند 6 أيام. إذا كان السجل بدلًا من ذلك يحوي حقلًا مخزّنًا `status: "offline"` (النمط المضاد من الخطوة 1)، فما أول ما يحدث لحظة ما يملأ جهازُ مراقبة نبضةً دون أن يعيد أحد ضبط الحقل المخزّن؟

## الخطوة 3: كشف انحراف البرنامج الثابت

«منتهي الصلاحية» مقارنة: سلسلة برنامج كل جهاز مقابل أحدث إصدار منشور *لنموذجه*. سلاسل الإصدارات ليست أرقامًا، لذا تقارنها صحيحًا بالتفكيك على النقاط ومقارنة الصُّرّاف الصحيحة ، `(1, 2, 0) < (1, 3, 0)` هي `True` في كل أنواع بايثون المهمة، و`"1.2.0" < "1.3.0"` تعمل بالصدفة أيضًا، لكن فقط حتى يجاور *2.0.0* قيمةَ *11.0.0*.

### 3.1 اكتب firmware.py

**👟 تلميح البداية :** خريطة `LATEST` لكل نموذج، ومقسّم `version_tuple`، ومسند `needs_update` يؤلف بينهما:

```python
# firmware.py
from registry import load_devices

LATEST = {"temp-hum": "1.3.0", "cam-1080": "2.0.5"}

def version_tuple(version: str) -> tuple[int, ...]:
    return tuple(int(part) for part in version.split("."))

def needs_update(device: dict) -> bool:
    target = LATEST[device["model"]]
    return version_tuple(device["firmware"]) < version_tuple(target)

if __name__ == "__main__":
    for d in load_devices():
        target = LATEST[d["model"]]
        flag = f"-> update to {target}" if needs_update(d) else "up to date"
        print(f"{d['id']:<8} {d['model']:<10} {d['firmware']:<8} {flag}")
```

ثلاثة من الأجهزة الأربعة على إصدار `temp-hum` القديم وواحد حالي ، عرض جيد، لأن الحالي يثبت أن المقارنة لا تعلّم كل شيء ببساطة. المسند `needs_update` بلا حالة: لا قائمة تحديث تُحمل، ولا «آخر تشغيل تحديث» يُخزَّن، فقط *جهاز ← منطقي* حسب خريطة `LATEST`. لاحظ ما لا يفعله هذا المستوى عمدًا: يكتشف ما *سيتحدّث* ، الدفع الفعلي للإصدارات عبر الشبكة من اختصاص OTA للبرامج الثابتة، وستزيّف الإقرار في التقرير.

**🎯 الناتج المتوقع :**

```
cam-01   cam-1080   2.0.5    up to date
th-01    temp-hum   1.2.0    -> update to 1.3.0
th-02    temp-hum   1.2.0    -> update to 1.3.0
th-03    temp-hum   1.1.9    -> update to 1.3.0
```

**🩹 إذا لم يعمل :** إذا أبلغ *كل* جهاز بـ `up to date`، فالأرجح أن `version_tuple` يفكّك على شيء آخر («`1.2.0rc1`» تنفك إلى أربع قطع، لكن العرض يستخدم إصدارات ثلاثية الأجزاء) ، تحقّق من أن تحويل int لا يختنق بعلامة نسخة معاينة. وإذا أثار نموذج مجهول `KeyError`، فذلك *رد الفعل الصحيح* (أسطول تفقد معلومات برنامجه مشكلة بيانات لا تُتساهل معها) ، لكن قد تفضل مع ذلك `LATEST.get(model)` التي تُرجع `None` للأجهزة التي لا تتبعها حقًا.

### 3.2 تحقّق من انحراف البرنامج الثابت

**✅ قائمة التحقق**

- ✅ `version_tuple("1.2.0") == (1, 2, 0)` و`(1, 2, 0) < (1, 3, 0)` ، صُّرّاف أعداد صحيحة، فيغلب `2.10` على `2.9` عدديًا.
- ✅ `cam-01` يبلغ أنه محدّث (إصداره 2.0.5 يساوي هدف الخريطة)؛ ثلاثة أجهزة `temp-hum` تجدول ترقية إلى 1.3.0.
- ✅ يعمل العرض على سجل `load_devices()` المرتب، فتُطبع الصفوف دائمًا بترتيب الخطوة 1.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- `LATEST` قاموس مكتوب يدويًا في المصدر. في الإنتاج سيأتي من واجهة البائع أو من مانيفست. أي *عقد* يرضيه `needs_update` (جهاز، قاموس فقط) يلتصق فيه خلاصة الإصدارات فحسب ، أي، ما الشكل الذي يجب أن تطابقه نقطة نهاية البائع حتى لا يتغير أي شيء آخر في الكود؟
- `th-03` على 1.1.9 بينما إخوته على 1.2.0 ، النموذج نفسه، إصدار أقدم. ما أسباب «انحراف برمجيات الأسطول» (غير الكسل) التي يساعد تقرير يعرض *النموذج+الإصدار* لكل صف صاحبَ مصلحة على رؤيتها فعلًا؟

## الخطوة 4: استنتاج الإعداد الفعلي

الإعداد *طبقي*: كل `temp-hum` ينبّه افتراضيًا عند 28 °C، لكن جهاز المرآب يجب أن ينبّه عند −5 °C. النمط هو الإعدادات الافتراضية ← إعدادات النموذج ← تجاوزات الغرفة ← تجاوزات لكل جهاز (الآخر يفوز)، والكلمة الصحيحة للناتج هي الإعداد *الفعلي* ، القاموس الوحيد الذي يشغّله الجهاز فعلًا بعد طي كل الطبقات.

### 4.1 اكتب المُستنتج (resolver)

**👟 تلميح البداية :** انسخ إعدادات النموذج الافتراضية، ثم `.update()` عليها تجاوزات مستوى الغرفة (واترك مجالًا لمرحلة مستوى جهاز لاحقًا):

```python
# config.py
from registry import load_devices

DEFAULTS = {
    "temp-hum": {"poll_rate_s": 60, "alert_threshold_c": 28, "units": "c"},
    "cam-1080": {"recording": False, "motion": True, "retention_days": 7},
}
ROOM_OVERRIDES = {"garage": {"alert_threshold_c": -5}, "entry": {"recording": True}}

def resolve_config(device: dict) -> dict:
    config = dict(DEFAULTS[device["model"]])
    config.update(ROOM_OVERRIDES.get(device["room"], {}))
    return config

if __name__ == "__main__":
    for d in load_devices():
        print(f"{d['id']:<8} {resolve_config(d)}")
```

`dict(DEFAULTS[...])` *تنسخ* إعدادات النموذج المشتركة قبل `.update()` ، تلك النسخة هي الفرق بين «المرآب يحصل على −5 بينما تظل غرفة المعيشة عند 28» وبين «كل `temp-hum` يرث −5 صامتًا لأنها تتشارك قاموسًا واحدًا في الذاكرة». إخراج هذا كخط أنابيب (افتراضيات ← تجاوزات) بدلًا من كتابة قاموس `winter` وقاموس `summer` يُبقي كل جهاز على حقيقة *مشتقة*: عندما تغيّر الوحدات إلى `f`، تحدّث طبقة أساس واحدة الأمر عبر الأسطول كله.

**🎯 الناتج المتوقع :**

```
cam-01   {'recording': True, 'motion': True, 'retention_days': 7}
th-01    {'poll_rate_s': 60, 'alert_threshold_c': 28, 'units': 'c'}
th-02    {'poll_rate_s': 60, 'alert_threshold_c': 28, 'units': 'c'}
th-03    {'poll_rate_s': 60, 'alert_threshold_c': -5, 'units': 'c'}
```

**🩹 إذا لم يعمل :** إذا أظهر th-01 أيضًا `-5`، فـ`resolve_config` يغيّر `DEFAULTS[model]` في مكانه (تجري `.update` على القاموس المشترك لا النسخة). وإذا فقدت كاميرا المدخل `recording`، ففرع `else` يستبدل الإعداد كله بدلًا من دمجه ، يجب أن يكون الحارس `ROOM_OVERRIDES.get(device["room"], {})` *دمجًا فارغًا*، لا استبدالًا أبدًا.

### 4.2 تحقّق من استنتاج الإعداد

**✅ قائمة التحقق**

- ✅ `th-03` لديه `alert_threshold_c: -5`؛ يبقي `th-01` و`th-02` القيمة الافتراضية 28 ، لمس تجاوز الغرفة جهازًا واحدًا.
- ✅ `cam-01` يحول `recording` من الافتراضي `False` إلى `True`؛ كل مفتاح `cam-1080` آخر دون تغيير.
- ✅ قاموس الافتراضيات نفسه دون مساس بعد التشغيل (كل استدعاء نال نسخة).

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تشبه تجاوزات الغرفة *سياسة*: «المرآب يتجمد». إذا استخدم المستأجران نفس نوع الجهاز باحتياجين مختلفين، فستحتاج طبقاتك خطوة لكل مستأجر. أين ينتمي كل مستأجر في هذا الخط (قبل طبقة الغرفة أم بعدها)، وكيف ترتّبه دالة دمج دون نفي تجاوز الغرفة؟
- يحوي القاموس المستنتَج `alert_threshold_c` قد لا يلتزم به الجهاز (برنامج قديم معطوب). ما الفرق بين الإعداد *المطلوب* والإعداد *المطبّق* ، وأيهما مسؤولية هذه الدالة فعلًا؟

## الخطوة 5: تقرير الأسطول وواجهة CLI

القدرات الأربع كلها دوال؛ الناتج هو الشاشة الواحدة التي تعرض كل شيء: مجمّعًا حسب الغرفة، سطر لكل جهاز بصحته، وسطر ملخص. ثم يحصل التقرير نفسه على CLI بعلامة واحدة ليصبح «ماذا يفعل الأسطول؟» أمرًا واحدًا بدلًا من خمس تشغيلات `__main__`.

### 5.1 اكتب report.py وmanage.py

**👟 تلميح البداية :** أعد استخدام `age_of`/`health_status` من الخطوة 2، وجمّع حسب الغرفة بمجموعة الغرف المرتبة، وعدّ الحالات بـ`collections.Counter`، وليطبع `manage.py --report` الأمر كله:

```python
# report.py
from collections import Counter

from health import NOW, age_of, health_status
from registry import load_devices

def fleet_report(devices: list[dict] | None = None, now=NOW) -> str:
    if devices is None:
        devices = load_devices()
    lines = [f"Fleet report — {len(devices)} devices"]
    statuses = Counter()
    for room in sorted({d["room"] for d in devices}):
        lines.append(f"== {room}")
        for d in devices:
            if d["room"] != room:
                continue
            status = health_status(age_of(d, now))
            statuses[status] += 1
            lines.append(f"  {d['id']:<8} {d['name']:<22} {status}")
    counts = ", ".join(f"{n} {s}" for s, n in sorted(statuses.items()))
    lines.append(f"summary: {counts}")
    return "\n".join(lines)
```

```python
# manage.py
import argparse

from report import fleet_report

def main() -> None:
    parser = argparse.ArgumentParser(description="Manage a fleet of devices.")
    parser.add_argument("--report", action="store_true")
    args = parser.parse_args()
    if args.report:
        print(fleet_report())
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
```

```bash
uv run python manage.py --report
```

التقرير *تركيب لا تشعب*: يوزّع فقط الدوال التي بنيتها من قبل (`health_status` و`age_of` و`load_devices`)، ولهذا هو نحو 12 سطرًا. `Counter()` بمفتاح نصي هي لحظة الحيلة الجديدة الوحيدة ، `statuses["offline"] += 1` تبدأ من 0 بسحر بدلًا من أن تطلق استثناءً، وهو ما لا يفعله `dict` الملائم. علامة `action="store_true"` تُبقي CLI على فعل واحد (`--report`)، وهو بالضبط ما يكفي لهذا المشروع وسقف مقصود جدًا ، مديرو الأجهزة الحقيقيون يتضخمون إلى `--update` و`--push-config` و`--add-device`، وبنيتك المعمارية تملك بالفعل الدوال التي سينادونها.

**🎯 الناتج المتوقع :**

```
Fleet report — 4 devices
== entry
  cam-01   Front Door Camera      offline
== garage
  th-03    Garage Sensor          warning
== kitchen
  th-02    Kitchen Sensor         online
== living
  th-01    Living Room Sensor     warning
summary: 1 offline, 1 online, 2 warning
```

**🩹 إذا لم يعمل :** إذا قال الملخص `0 offline`، فـ`Counter` يُزاد على *منطقي خام* (`statuses[is_offline]`) بدلًا من سلسلة الحالة. وإذا طبع `--report` مساعدة argparse بدلًا من الأسطول، ففرع `if args.report:` يفحص شيئًا آخر ، أكّد أنه يقرأ `args.report`، سمة `store_true`.

### 5.2 تحقّق من تقرير الأسطول

**✅ قائمة التحقق**

- ✅ تظهر الغرف أبجديًا؛ تحافظ الأجهزة داخل الغرفة على ترتيب `load_devices()` (فرز المعرّف).
- ✅ عدّاد الملخص يبلغ 4 ويطابق أسطر الأجهزة الفردية (واحد غير متصل / واحد متصل / تحذيران).
- ✅ يطبع `uv run python manage.py --report` التقرير؛ عدم تمرير علامة يطبع الاستخدام.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- الملخص `sorted(statuses.items())` ، فرز *أبجدي* لأسماء الحالات. إذا فضّلت التلخيص «1 غير متصل، 2 تحذير، 1 متصل» بترتيب الخطورة، فأي وسيط إلى `sorted` (مع مساعد صغير) يصلح ذلك، وهل يستحق ترتيب الخطورية سطرين إضافيين؟
- يملك `fleet_report` معاملَي `devices` و`now` بقيمتين افتراضيتين. من (إنسان، مهمة cron، اختبار) يناديها بـ`now` *مختلف*، وماذا يقول هذا المعامل عن الجزء من التقرير الذي هو لقطة لحظية لا حقيقة حية؟

## ⚠️ المآزق الشائعة

- **تخزين الحالة بدلًا من حسابها.** حقل `"online"` محفوظ يُصبح عتيقًا في اللحظة التي تصل فيها نبضة أو تموت. اشتقّ الصحة من `last_seen`؛ لا تثق أبدًا بحكم مستمر.
- **الفرز بسلسلة يختبئ خلفها رقم.** `cam-2` يُرتَّب بعد `cam-10` معجميًا. إذا تجاوزت المعرّفات يومًا ما الرقم 9، فكّررها (`cam-02`) أو رتّب بمفتاح int ، سيعيد فرز السجل `... sorted(... by id)` ترتيبها لك صامتًا في أكثر لحظات لا تناسبك.
- **مفاجآت شكل المنطقة الزمنية.** `2026-09-06T08:15:00Z` (لاحقة `Z`) يُسقط `fromisoformat` في معظم إصدارات بايثون. تعامل مع التسوية `Z → +00:00` مرة واحدة، في `age_of`، لا في كل موقع استدعاء.
- **تغيير قاموس الافتراضيات المشترك.** `DEFAULTS[model].update(...)` دون نسخة يجعل كل جهاز يرث التجاوز الأول. `dict(DEFAULTS[model])` أولًا، *ثم* التحديث.
- **مقارنات الإصدارات كسلاسل.** `"2.10.0" < "2.9.0"` هي `True` معجميًا وسخافة دلاليًا. حوّل الإصدارات إلى صُّرّاف قبل المقارنة ، مرة واحدة، في مكان واحد، في كل مكان.

## ما بنيته للتو

مدير أجهزة من أربع طبقات: سجل (JSON مرتب)، صحة (محسوبة من عمر النبضة)، كشف انحراف البرامج الثابتة، واستنتاج إعداد طبقي ، كلها مركّبة في `manage.py --report` واحدة. النمط الذي تحمله معك هو *اشتقّ، لا تخزّن*: الصحة وحاجة التحديث والإعداد الفعلي كلها دوال للسجل، فلا يكذب السجل أبدًا عن الحاضر، وكل تقرير أو أمر جديد تضيفه مستهلك واحد إضافي لنفس المصدر الصادق المرتّب المُصدَّر.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/device-manager/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/device-manager) في مستودع المقرر يحوي السكربتات الكاملة إضافةً إلى ملف `devices.json` مبدئي. أو افتح المستودع كاملًا في [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## إلى أين تذهب من هنا

- أضف طبقة تجاوز بمستوى الجهاز (`PER_DEVICE`) تغلب طبقة الغرفة ، قاعدة «رُبع غرفك تتجمد» دون لمس إعدادات الغرفة الافتراضية.
- أصدِر **لقطة JSON** لتقرير الأسطول (`manage.py --report --json`) ، عرض قابل للقراءة آليًا لنفس الحروف التي يقرؤها البشر.
- تتبّع **تاريخ تغييرات الإعداد**: يكتسب `resolve_config` `when` و`who`، ويكتسب التقرير علامة `--changes` تعرض آخر N إجراءات.
- حاكِ **إقرارات OTA**: تُرجع `needs_update` هدفًا لكن لا شيء يخزّن إقرارًا ، أضف `ack_at` إلى السجل، ويعلّم تقرير الأسطول أجهزة «تحديث معلّق».

## شارك مشروعك مع الصف

بنيت شيئًا تفتخر به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض مشاريع قدّمها طلاب آخرون ، ويحوي README الخاص به شرحًا كاملًا صديقًا للمبتدئين لإضافة مشروعك عبر **طلب سحب (pull request)**، حتى لو لم تستخدم git من قبل: نسخ المستودع، وإنشاء فرع، والالتزام بملفاتك، وفتح الطلب، خطوة بخطوة. لا يفترض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة بايثون خارج المتصفح. 🎓