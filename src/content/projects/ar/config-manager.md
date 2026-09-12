---
title: "مدير الإعدادات"
description: "إدارة إعدادات التطبيقات عبر بيئات مختلفة مع التحقق والتشفير واكتشاف الانحراف."
difficulty: "beginner"
estimatedMinutes: 45
tags: ["cli", "config", "toml", "stdlib"]
prerequisites:
  - "أساسيات Python (متغيّرات، حلقات، دوال، قواميس)"
learningObjectives:
  - "دمج الإعدادات من الافتراضيات والملفات ومتغيّرات البيئة في قاموس واحد"
  - "قراءة ملفات إعداد TOML عبر tomllib من المكتبة القياسية"
  - "التحقق من المفاتيح والأنواع المطلوبة مقابل مخطط"
  - "حجب قيم الأسرار تلقائيًا في أي تفريغ قابل للقراءة البشرية"
  - "لفّ التحميل والتحقق والفحص في CLI واحد"
---

# ⚙️ ابنِ مدير إعدادات

كل تطبيق حقيقي لديه إعدادات لا يجب أن تكون مُرمَّزة ثابتًا أبدًا: أي منفذ يُربط، أي مستوى تسجيل يُستخدَم، أي مفاتيح API تُؤتمَن. الطريقة القياسية لتنظيمها *متعددة الطبقات* ، افتراضيات منطقية، يتجاوزها ملف إعداد لكل بيئة، يتجاوزه متغيّراT البيئة ، بحيث يختلف "شغّله محليًا" عن "شغّله في الإنتاج" دون أن يعدّل أحد كودًا. يبني هذا المشروع ذلك المُحمِّل بالضبط: مكتبة صغيرة تدمج الافتراضيات وJSON وTOML مع تجاوزات متغيّرات البيئة، وتتحقق من النتيجة مقابل مخطط، و، بشكل حاسم، لا تطبع سرًا أبدًا.

هذا يفترض Python 101 (قواميس، دوال، و`json` على مستوى `import`) ، لا يُشترط شيء من تحليل البيانات. إنه اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. اكتب دمجًا تكراريًا يجمع ثلاث طبقات إعدادات بالترتيب الصحيح.
2. حمّل ملف إعداد TOML بوحدة `tomllib` المدمجة في Python.
3. تحقّق من الإعدادات المدمجة مقابل مخطط مفاتيح وأنواع مطلوبة.
4. اكشف المفاتيح التي تشبه الأسرار واحجبها من أي مخرج.
5. شغّل ذلك كله كـ CLI يطبع ملخص إعدادات آمنًا ومُتحقَّقًا.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الموصى به ، النسخة "الحقيقية" من هذا المشروع تقرأ ملفات فعلية من القرص ومتغيّرات بيئة حقيقية، وهو بالضبط ما لا يملكه دفتر الملاحظات، لذا فالـ CLI المحلي هو الموطن الصادق له. الإعداد قصير لأن المشروع كله يستخدم مكتبة Python القياسية (إضافة إلى `tomllib`، المضمنة منذ Python 3.11).

**GitHub Codespaces** بديل بلا إعداد: افتح [مستودع الدورة كاملًا في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython و`uv` مثبّتة بالفعل) وشغّل نفس الأوامر من طرفية متصفح.

**Google Colab أو Kaggle Notebooks أو Binder** طريقة جيدة *لتعلم المفاهيم* ، نسخة دفتر الملاحظات في [`examples/config-manager/notebook.ar.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/config-manager/notebook.ar.ipynb) تشغّل كل دالة مع ملفات عينات مرفقة. القيد الصادق: لا يمكن لدفتر الملاحظات رؤية متغيّرات بيئة جهازك، لذا تُوضَّح طبقة متغيّرات البيئة بتجاوز محاكى بدلًا من ذلك.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/config-manager/notebook.ar.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/config-manager/notebook.ar.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fconfig-manager%2Fnotebook.ar.ipynb)

## الإعداد

`uv` أداة واحدة تحل محل سلسلة "ثبّت Python، ثم pip، ثم أداة بيئة افتراضية" ، وهذا المشروع بلا حزم خارجية إطلاقًا، لذا فبمجرد حصولك على Python أنت جاهز فعلًا.

**macOS / Linux** (الطرفية):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

أغلق طرفيتك وأعد فتحها، ثم تأكد أنها ثُبِّتت:

```bash
uv --version
```

ثم جهّز المشروع:

```bash
uv init config-manager
cd config-manager
uv python pin 3.12
```

`uv python pin 3.12` (أو أي 3.11+) مهم هنا: قارئ TOML `tomllib` موجود فقط منذ Python 3.11 فصاعدًا، لذا يضمن التثبيت أن الميزة التي ستستخدمها في الخطوة 2 حاضرة.

**✅ قائمة التحقق**

- ✅ يطبع `uv --version` رقم إصدار.
- ✅ يوجد `config-manager/` مع `pyproject.toml`.
- ✅ ينجح `python -c "import tomllib"` على النسخة التي ثبّتت `uv` عليها.

## الخطوة 1: ادمج الإعدادات متعددة الطبقات

أنظمة الإعدادات دائمًا تقريبًا *خط أنابيب من التجاوزات*: ابدأ بـ `DEFAULTS`، وطبق ملفًا خاصًا بالبيئة فوقه، ثم دع متغيّرات البيئة تكسب. الدمج هو القلب ، والموضوع الدقيق أن الإعدادات *متداخلة*، لذا يجب أن يحدّث `{"app": {"port": 9000}}` قيمة `{"app": {"name": "demo", "port": 8000}}` دون محو `name`.

### 1.1 اكتب دمجًا عميقًا والطبقتين الأوليين

**👟 تلميح البداية :** اكتب `deep_merge` ، يُكرر فقط عندما يكون *الطرفان* قاموسين، وإلا يستبدل، وهو ما يحافظ على المفاتيح غير الملموسة ، ثم ادمجه مع ملف JSON ومتغيّرات بيئة مُقوَّاة:

```python
# layers.py
import json
import os

DEFAULTS = {"app": {"name": "demo", "port": 8000}, "logging": {"level": "INFO"}}

def deep_merge(base: dict, override: dict) -> dict:
    """Merge override into a copy of base. Nested dicts merge recursively;
    anything on the right replaces the left for that key."""
    out = dict(base)
    for key, value in override.items():
        if isinstance(value, dict) and isinstance(out.get(key), dict):
            out[key] = deep_merge(out[key], value)
        else:
            out[key] = value
    return out

def load_layer(path: str = "config.json") -> dict:
    with open(path) as f:
        return json.load(f)

def _coerce(raw: str):
    if raw.lower() in {"true", "false"}:
        return raw.lower() == "true"
    try:
        return int(raw)
    except ValueError:
        return raw

def apply_env(config: dict, prefix: str = "APP_") -> dict:
    """Overlay environment variables named APP_<KEY>, e.g. APP_PORT=9000.
    Double underscores mark nesting: APP_LOGGING__LEVEL=DEBUG."""
    for key, raw in os.environ.items():
        if not key.startswith(prefix):
            continue
        parts = key[len(prefix):].lower().split("__")
        target = config
        for part in parts[:-1]:
            target = target.setdefault(part, {})
        target[parts[-1]] = _coerce(raw)
    return config

if __name__ == "__main__":
    sample = json.dumps({"app": {"name": "api"}, "logging": {"level": "DEBUG"}})
    with open("config.json", "w") as f:
        f.write(sample)
    config = deep_merge(dict(DEFAULTS), load_layer("config.json"))
    config = apply_env(config)
    print(config)
```

سطر `dict(base)` في أعلى `deep_merge` هو ما يجعل هذه الدالة *نقية*: يحتفظ المتصلون بافتراضياتهم سليمة ويحصلون على قاموس جديد عائدًا، لذا فـ "شغّل مرة بملف سيئ، أعد التحميل، اكتب فوقه مجددًا" آمن دائمًا. تُظهر طبقة متغيّرات البيئة الحصان الأسود في تصميم الإعدادات ، *كل شيء سلسلة في البيئة* ، ومن هنا يحوّل `_coerce` قيمة `"9000"` إلى `9000` و`"true"` إلى `True` قبل أن تستقر في القاموس.

**🎯 الناتج المتوقع :**

```
{'app': {'name': 'api', 'port': 8000}, 'logging': {'level': 'DEBUG'}}
```

**🩹 إذا لم يعمل :** إذا كان `app` يفتقد `port`، فـ `deep_merge` الخاصة بك سوّت بدل أن تكرر ، تحقق من فرع `isinstance(value, dict)`. إذا كان المخرج *يستبدل* `logging` بالكامل، فقد عكست ترتيب الدمج؛ `deep_merge(base, override)` يحافظ على كل ما في `base` مما لا يلمسه `override`.

### 1.2 جرّب تجاوز البيئة

```bash
APP_PORT=9000 APP_LOGGING__LEVEL=WARN uv run python layers.py
```

**👟 تلميح البداية :** أعد التشغيل مع ضبط متغيّري بيئة على سطر الأوامر وشاهد تغيّر المنفذ ومستوى التسجيل، مع بقاء `app.name` دون إزعاج.

**🎯 الناتج المتوقع :** `{'app': {'name': 'api', 'port': 9000}, 'logging': {'level': 'WARN'}}` ، يتجاوز متغيّرا البيئة مفتاحيهما بالضبط، لا شيء غيرهما.

**🩹 إذا لم يعمل :** إذا لم يتغير شيء، فمرشّح البادئة `APP_` لا يطابق ، تأكد أن المتغيّرات مضبوطة *في نفس الأمر* (`APP_PORT=9000 uv run ...`، لا `export` منفصل في نافذة أخرى). إذا هبط `APP_LOGGING__LEVEL` كمفتاح *أعلى مستوى* جديد بدل أن يتداخل تحت `logging`، فحلقة `__` ← مسار النقطة لا تنقسم.

### 1.3 تحقّق من الطبقات

**✅ قائمة التحقق**

- ✅ دون متغيّرات بيئة يكون المخرج المدمج `{'app': {'name': 'api', 'port': 8000}, 'logging': {'level': 'DEBUG'}}`.
- ✅ مع `APP_PORT=9000` يتغير المنفذ ويبقى `app.name` كما هو `'api'`.
- ✅ يُقوّي `apply_env` قيمة `"9000"` إلى العدد الصحيح `9000`، لا السلسلة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لماذا الاستبدال-عند-الدمج (بدل التكرار الدائم) هو السلوك *الصحيح* لمفتاح مثل `port`؟ ما البيانات الحقيقية التي ستنكسر بصمت لو كررت داخل قائمة أو غير قاموس؟
- كل متغيّرات البيئة سلاسل. ما فئة الخطأ التي يمنعها `_coerce`، وما الخطر *الجديد* الذي يقدمه التقيّر الصامت عندما تتحول قيمة مثل `"0012"` (مقصودة كمعرّف سلسلة) إلى `12`؟

## الخطوة 2: اقرأ ملفات إعداد TOML

يعاني JSON مشكلة عملية واحدة كصيغة إعدادات: لا تعليقات، مما يجعل ملفات الإعدادات تُقرأ كتفريغات بيانات لا كتعليمات. يضيف TOML ، المستخدم في `pyproject.toml` وCargo والعديد من الأدوات الحديثة ، تعليقات وأنواعًا ودية ونفس البنية المتداخلة. يقرؤه Python 3.11+ عبر `tomllib`، بالطريقة نفسها التي يقرأ بها `json` JSON.

### 2.1 اكتب طبقة TOML

**👟 تلميح البداية :** اكتب `config.toml` مع تعليقات وتداخل، ثم دالة `load_toml_layer` تقرؤه في الوضع الثنائي (`tomllib` يتطلب بايتات) وتدمجه فوق الافتراضيات:

```python
# toml_layer.py
from pathlib import Path
import tomllib

from layers import DEFAULTS, apply_env, deep_merge

def load_toml_layer(path: str = "config.toml") -> dict:
    with Path(path).open("rb") as f:
        return tomllib.load(f)

if __name__ == "__main__":
    toml_text = '''
# Production-like overrides
[app]
name = "prod-api"
port = 8080

[logging]
level = "PROD"
'''
    Path("config.toml").write_text(toml_text)
    config = deep_merge(dict(DEFAULTS), load_toml_layer())
    config = apply_env(config)
    print(config)
```

نمط `deep_merge(dict(DEFAULTS), layer)` مطابق عمدًا لدمج JSON في الخطوة 1 ، بمجرد وجود دالة الدمج، يصبح كل مصدر جديد نفس السطرين. شيئان صغيران سهل فواتهما: يطلب `tomllib.load` وضعًا *ثنائيًا* (`Path.open("rb")`)، وهي خصوصية لا تشاركه فيها أي صيغة شعبية أخرى، ورؤوس `[logging]` في TOML تنتج نفس القواميس المتداخلة التي تعالجها `deep_merge` لديك بالفعل.

**🎯 الناتج المتوقع :**

```
{'app': {'name': 'prod-api', 'port': 8080}, 'logging': {'level': 'PROD'}}
```

**🩹 إذا لم يعمل :** `TypeError: File must be opened in binary mode` تعني أنك فتحت بـ `"r"` لا بـ `"rb"`. عادة ما يشير `TOMLDecodeError` إلى السطر بالضبط ، الفواصل الزائدة *مسموحة* في TOML، لكن قسم `[app]` ثانٍ أو `=` خارجة عن المكان خطأ صلب وقت التحليل.

### 2.2 تحقّق من طبقة TOML

**✅ قائمة التحقق**

- ✅ تُرجع `load_toml_layer()` القيمة `{'app': {'name': 'prod-api', 'port': 8080}, 'logging': {'level': 'PROD'}}`.
- ✅ تتجاوز إعدادات `config.toml` الافتراضيات `DEFAULTS`، والحقول التي لا يذكرها TOML (`app.port` غير الملموس بالملف سيظل `8000`) تنجو سليمة.
- ✅ يمكنك بيان لماذا يجب أن يفتح الملف في الوضع الثنائي.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يسمح لك TOML بكتابة `port = 8080` (عدد صحيح، بلا اقتباسات). كيف سيتغير *نوع* `port` لو قال الملف `port = "8080"`، وأين سيبرز ذلك الاختلاف ، كاسرًا بصمت ماذا لاحقًا؟ (تلميح: استرجع مسار الخطوة 1 الخالي من التحقق.)
- يعامل الدمج طبقة TOML وطبقة JSON كمتقابلتين. ما الذي كان عليك تغييره لو أردت أن "تفوز TOML دائمًا على JSON مهما كان ترتيب التحميل" ، وهل ترسّخ ذلك فكرة جيدة أم فخ صيانة؟

## الخطوة 3: تحقّق من الإعدادات المدمجة

بمجرد أن تغذي ثلاثة مصادر قاموسًا واحدًا، يمكن للدمج أن ينتج بصمت إعداد بمفتاح *مفقود* أو قيمة *خاطئة النوع* ، وتلك تفشل لاحقًا، بعيدًا عن الإعداد، بطرق محيّرة. ينقل التحقق الفشل إلى المقدمة: تحقق من الإعدادات المدمجة مقابل مخطط وارفع قائمة أخطاء قابلة للقراءة البشرية قبل أن يعمل أي شيء.

### 3.1 اكتب التسوية والمدقق

**👟 تلميح البداية :** تحوّل `flatten` القواميس المتداخلة إلى مسارات نقطية (`app.port`) حتى يتمكن مخطط مسطّح من تسمية مكان الخطأ بالضبط؛ وتقارن `validate` مقابل قاموس `REQUIRED` من مسار ← نوع وتُرجع قائمة مشاكل قابلة للقراءة البشرية:

```python
# validate.py
REQUIRED = {
    "app.name": str,
    "app.port": int,
    "logging.level": str,
}

def flatten(config: dict, prefix: str = "") -> dict[str, object]:
    out = {}
    for key, value in config.items():
        path = f"{prefix}.{key}" if prefix else key
        if isinstance(value, dict):
            out.update(flatten(value, path))
        else:
            out[path] = value
    return out

def validate(config: dict) -> list[str]:
    errors = []
    flat = flatten(config)
    for path, wanted in REQUIRED.items():
        if path not in flat:
            errors.append(f"missing required key: {path}")
        elif not isinstance(flat[path], wanted):
            errors.append(
                f"{path} should be {wanted.__name__}, got {type(flat[path]).__name__}"
            )
    return errors

if __name__ == "__main__":
    broken = {"app": {"name": "api", "port": "8000"}}
    for error in validate(broken):
        print(error)
```

`flatten` هو الحصان العامل الهادئ: يحوّل "أين المشكلة؟" من متاهة عمليات بحث متداخلة إلى قائمة مسطحة واحدة، ويعيد استخدام نفس الاجتياز في `secrets.py` (الخطوة 4) ، اجتياز واحد، مستهلكان. يلتقط `isinstance(flat[path], wanted)`, أفخاخ *الأنواع* التي تشتهر بها الإعدادات، مثل منفذ سلسلة سينفجر في ربط المقبس: `ValueError` لاحقًا بدلًا من جملة واضحة الآن.

**🎯 الناتج المتوقع :**

```
app.port should be int, got str
```

**🩹 إذا لم يعمل :** إذا لم يُبلَّغ شيء عن القاموس المعطوب، فمخطط `REQUIRED` لديك يتهجّى المسار بشكل مختلف عما ينتجه `flatten` ، تحقق من تسرب عدم تطابق `logging.level` مقابل `logging__level` (أسلوب متغيّر البيئة) إلى المخطط. إذا حصلت على `should be type, got str`، تحقق هل يطبع `got {type(...).__name__}` في f-string الاسم الموروث من قيمة فرعية.

### 3.2 تحقّق من المدقق

**✅ قائمة التحقق**

- ✅ يبلّغ `validate({"app": {"name": "x", "port": "8000"}, "logging": {"level": 5}})` عن كل من `app.port` الخاطئ النوع و`logging.level` الخاطئ النوع، سطر لكل منهما.
- ✅ إعداد يفتقد `app.name` كليًا يبلّغ عن `missing required key: app.name`.
- ✅ إعداد صحيح تمامًا يُرجع قائمة فارغة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تتقاسم `flatten` بين التحقق و(في الخطوة التالية) حجب الأسرار. ما حجة المسؤولية الواحدة لاجتياز واحد ، وما الذي كان يجب تكراره لو أضمرت الاجتياز مرتين؟
- يفحص المخطط *الأنواع*، لا *النطاقات*. ما الفشل الذي ما زال يمر به `port` بقيمة `-1` أو `65536` ، وهل يستحق إضافة فحص نطاق إلى المخطط أم تلك الطبقة الخاطئة له؟

## الخطوة 4: احجب الأسرار قبل الطباعة

إعداد *يحوي* سرًا أمر طبيعي؛ إعداد *يطبع* سرًا حادث. القاعدة الإبهاميّة في الأدوات الحقيقية: عامل أي مفتاح يبدو حساسًا (`password`، `token`، `api_key`، …) كغير قابل للطباعة افتراضيًا، ولا تكشفه إلا عند الطلب الصريح. تجعل هذه الخطوة ذلك تلقائيًا.

### 4.1 اكتب الكاشف والحاجب

**👟 تلميح البداية :** استخدم تعبيرًا منتظمًا مُجمَّعًا غير حساس لحالة الأحرف فوق أسماء *المفاتيح* (لا القيم ، مطابقة القيم ستكون لعبة تخمين)، ثم `flatten` + إعادة بناء كمسارات نقطية مقنّعة:

```python
# secrets.py
import re

from validate import flatten

SENSITIVE = re.compile(r"(password|passwd|token|secret|api[_-]?key|apikey)", re.I)

def is_sensitive(path: str) -> bool:
    return bool(SENSITIVE.search(path))

def redact(config: dict) -> dict[str, object]:
    return {path: "***" if is_sensitive(path) else value
            for path, value in flatten(config).items()}

if __name__ == "__main__":
    sample = {
        "app": {"name": "api", "port": 8000, "api_key": "sk-live-abc123"},
        "database": {"password": "hunter2", "host": "db.internal"},
    }
    for path, value in redact(sample).items():
        print(f"{path} = {value}")
```

التعبير المنتظم مثبّت عمدًا بالطريقة الصعبة-لكن-الآمنة: يطابق *سلاسل فرعية* من المسار (`database.password` يحوي `password`)، مما يلتقط `db_password` و`github_token` و`api_key` دون الحاجة لتصنيف كل اسم ممكن. ولأن القناع يحدث على *المفتاح*، لا القيمة، فلا يحتاج أبدًا لتخمين شكل السر ، قيمة مثل `"sk-…"` أو `"hunter2"` تُحجب بشكل متطابق اعتمادًا خالصًا على مكانها.

**🎯 الناتج المتوقع :**

```
app.name = api
app.port = 8000
app.api_key = ***
database.host = db.internal
database.password = ***
```

**🩹 إذا لم يعمل :** إذا طُبعت `api_key` مكشوفة، استخدم تعبيرك المنتظم تثبيت `$` أو حد كلمة لا يرضيه البديل `api[_-]?key` ، `api_key` تحتوي شرطة سفلية، لذا يجب أن يسمح النمط بها (`[_-]?`). إذا حُجب `host`، فالنمط فضفاض جدًا ، بديل `key` عارٍ يطابق ذيل `monkey`؛ شدّده إلى الصور بأسلوب `api[_-]?key` فقط.

### 4.2 تحقّق من الحجب

**✅ قائمة التحقق**

- ✅ يطبع `database.password` و`app.api_key` كـ `***`.
- ✅ تطبع `app.name` و`app.port` و`database.host` قيمها الحقيقية.
- ✅ قيمة تتشكل كسر مخزَّنة تحت مفتاح *غير سري* (مثل `app.notes = "contains sk-abc"`) لا تُحجب، الحجب قائم على المفتاح.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لماذا مطابقة أسماء *المفاتيح* أكثر موثوقية جوهريًا من مطابقة قيم *المفاتيح*؟ ما القيمة الحقيقية التي تحتفظ بها مرئية وتصادف أنها تحوي السلسلة الفرعية `token`؟
- يعيد الحجب `***` بدل حذف المفتاح. ما الذي كان سينكسر في CLI الخطوة 5 (أو أي مدقق مخطط) لو *أزال* الحجب المسارات السرية كليًا بدل إقناعها؟

## الخطوة 5: الـ CLI النهائي

كل دالة حتى الآن مكتبة؛ تحوّل هذه الخطوة إلى أداة: `config.py --check` يتحقق، و`config.py --show` يطبع عرضًا مسطّحًا محجوبًا. الـ CLI هو حيث يصبح وعد "لا تطبع سرًا أبدًا" سلوكًا يلمسه الإنسان فعلًا.

### 5.1 ابنِ `load_config` واختبار معالجة الوسائط

**👟 تلميح البداية :** ألف خط الأنابيب في دالة واحدة ، افتراضيات ← JSON ← TOML ← متغيّرات بيئة ، ثم اربط `--check` و`--show` عبر `argparse`:

```python
# config.py
import argparse

from layers import DEFAULTS, apply_env, deep_merge, load_layer
from secrets import redact
from toml_layer import load_toml_layer
from validate import validate

def load_config(json_path: str = "config.json", toml_path: str = "config.toml") -> dict:
    config = deep_merge(dict(DEFAULTS), load_layer(json_path))
    config = deep_merge(config, load_toml_layer(toml_path))
    return apply_env(config)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Load, validate, and inspect layered config.")
    parser.add_argument("--check", action="store_true", help="Validate against the schema")
    parser.add_argument("--show", action="store_true", help="Print the merged config with secrets masked")
    args = parser.parse_args()

    if args.check:
        errors = validate(load_config())
        print("\n".join(errors) if errors else "config OK")
    if args.show:
        for path, value in redact(load_config()).items():
            print(f"{path} = {value}")
```

```bash
uv run python config.py --show
```

يعيد كل علم تشغيل `load_config()` بشكل مستقل ، رخيص هنا، ويعني أن `--show` لا يطبع حالة عالقة من تشغيل `--check`. ترتيب التركيب هو سلوك النظام كاملًا في سلسلة استدعاء واحدة: `DEFAULTS < JSON < TOML < env`، لذا فالمصدر الأعلى أولوية هو دائمًا آخر دمج.

**🎯 الناتج المتوقع :** `app.name = prod-api`، `app.port = 8080`، `logging.level = PROD` (إضافة إلى أي مفتاح تضيفه يطابق اسمه نمطًا حساسًا فيُطبع كـ `***`).

**🩹 إذا لم يعمل :** `FileNotFoundError` لـ `config.json` أو `config.toml` تعني أنك تشغّل من المجلد الخاطئ ، الملفات في المجلد حيث كتبتهما الخطوتان 1–2، لذا شغّل الـ CLI من هناك، أو مرّر المسار. إذا طبع `--show` و`--check` معًا الإعدادات المُتحقَّق منها *والحجب* معًا، تذكر أن علمَي `action="store_true"` مستقلان ، اجمع بينهما بـ `&&`، أو أضف `--show` ضمنيًا عندما يجتاز `--check`.

### 5.2 تحقّق من الـ CLI

**✅ قائمة التحقق**

- ✅ يطبع `uv run python config.py --show` قيمًا محجوبة ومدمجة فقط، مع إقناع أي مفتاح حساس.
- ✅ يطبع `uv run python config.py --check` `config OK` لإعداد صالح ، أو سطر `path should be…` واحد لكل حقل معطوب.
- ✅ يسرد `uv run python config.py --help` العلمين ووصف الأداة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يعيد `--show` تشغيل `load_config()` بدل مشاركة كائن إعداد واحد مع `--check`. متى سيؤتي هذا الخيار أكله ، ما الذي قد يختلف بين التشغيلين في نشر *حقيقي* (تلميح: فكر في متغيّرات بيئة تتغير في منتصف العملية)؟
- يطبع الـ CLI الأسرار **فقط** كـ `***`. إذا أضفت علمًا `--reveal` لعرض القيم الحقيقية، ما الحارس الذي تريده حوله حتى لا يقذف أحد وثائق إنتاج طي السرية في سجلات CI؟

## ⚠️ المآزق الشائعة

- **الدمج الضحل وفقدان المفاتيح الشقيقة.** يستبدل `dict(base) | override` (أو `base.update(override)`) قواميس متداخلة كاملة، ماسحًا `app.name` لحظة تجاوز `app.port`. ادمج دائمًا بشكل تكراري ، فرع `isinstance(value, dict)` في الخطوة 1 ليس اختياريًا.
- **نِسيان أن `tomllib` يريد الوضع الثنائي.** يفشل `tomllib.load(open("config.toml"))` بـ `TypeError`؛ يجب أن يفتح مؤشر الملف كـ `"rb"`. إنه محمّل الصيغ الوحيد في المكتبة القياسية بأصح هذه الخصوصية.
- **ترميز الأسرار في الكود "للوقت الحالي فقط".** `API_KEY` داخل `DEFAULTS` هو بالضبط القيمة التي ستحجبها الخطوة 4 ، وهي الأداة تخبرك أنه لا يجب أن يكون في الكود. انقله إلى متغيّر بيئة قبل أن يخفيه القناع عن تصحيح أخطائك أنت أيضًا.
- **التحقق بعد أول استخدام.** إذا نفّذت `socket.bind((host, port))` قبل التحقق من `isinstance(port, int)`، يفشل منفذ سلسلة في عمق برنامجك بثلاثة ملفات. التحقق ينتمي إلى *حدود* الإعداد، لا بعد تشغيل أول مئة سطر.
- **كشف الأسرار بشكل القيمة.** مطابقة القيم (تعابير منتظمة عن `sk-…`) تبدو ذكية وتضلل: القيم الحقيقية تفاجئك باستمرار، وأسماء المفاتيح هي الشيء الثابت الوحيد. طابق الأسماء.

## ما بنيته للتو

نظام إعدادات متعدد الطبقات حقيقي ، افتراضيات وJSON وTOML ومتغيّرات بيئة مدمجة بترتيب الأولوية الصحيح، مُتحقَّق منها مقابل مخطط، ومُعرَضة مع إقناع الأسرار بأمان ، كل ذلك Python جزيرة مكتبتها القياسية مع `tomllib`. المهارة القابلة للنقل هي البنية نفسها: *خط أنابيب تجاوزات ينتهي عند البيئة*، وهو الشكل الكامن وراء أنظمة الإعدادات من إعدادات Django إلى أدوات النشر، وقاعدة دفاعية تستحق السرقة كاملة: الطباعة للأسرار فقط عندما يكون عمل الأداة الأساسي هو كشفها.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
لدى [`examples/config-manager/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/config-manager) في مستودع الدورة هذه السكربتات الكاملة مع ملفات `config.json`/`config.toml` عينات، قابلة للتشغيل من البداية للنهاية. أو افتح المستودع كاملًا في [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## إلى أين تذهب من هنا

- أضف علمًا `--env prod` يُحمّل `config.prod.toml` بدل الملف الافتراضي ، تجاوزات خاصة بالبيئة كاختيار، لا كاختراق ، وشاهد خط أنابيب الدمج يبقى دون تغيير.
- ادعم مفتاح `include = ["shared.toml"]` حتى يتمكن ملف إعداد واحد من استيراد غيره ، تُؤلف `deep_merge` لديك الإدراجات مجانًا.
- صدِر الإعدادات المدمجة كـ **ملف `key=value` مسطّح واحد** لأداة بأسلوب 12-factor تستهلك النقاط، لا التداخل ، `flatten` من الخطوة 3 هو نقطة بدايتك.
- اكتب حكم الحجب كاختبار `pytest` يؤكد أن `redact` لا يُرجع أبدًا قيمة تحوي `sk-` ، نفس الضمان الذي تشغّله أنظمة CI الآن على فحص الأسرار الحقيقي.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها ، وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓