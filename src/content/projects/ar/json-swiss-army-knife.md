---
title: "سكين الجيش السويسرية للـ JSON"
description: "أداة سطر أوامر تقوم بتنسيق والتحقق والاستعلام وتحويل ملفات JSON بقوة تشبه JQ."
tags: ["cli", "data-pipeline", "developer-tools"]
---


# 🔧 ابنِ سكين الجيش السويسرية للـ JSON

أي مطوّر يعمل مع JSON لديه دزينة عمليات صغيرة: نسّق هذا الملف، تحقّق من ذاك، استخرج هذا الحقل، حوّل إلى YAML. يبني هذا المشروع واجهة Click واحدة تتعامل معها كلها. إنها نوع الأدوات التي توفر دقائق كل يوم وتدفع ثمن نفسها خلال أسبوع.

يفترض هذا إنهاء Python 101 وارتياحًا مع سير عمل CLI من [أدوات المطوّرين](/ar/مشاريع). هذا اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة.

## 🎯 ما ستفعله

1. إعداد مشروع باستخدام `uv` وتثبيت تبعيات CLI وتحويل الصيغ.
2. تنفيذ تنسيق JSON بمسافة بادئة قابلة للضبط.
3. إضافة تحقق مع إبلاغ موقع الخطأ.
4. بناء محرك استعلامات بترميز النقاط على نمط JQ.
5. تنفيذ تحويل الصيغ بين JSON وYAML وTOML.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي — هذه أداة CLI تقرأ الملفات وتكتبها.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/json-swiss-army-knife/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/json-swiss-army-knife/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fjson-swiss-army-knife%2Fnotebook.ipynb)

## الإعداد

كل ما تحتاجه قبل البناء: بيئة Python، وClick، ومكتبات الصيغ.

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
uv init json-swiss-army-knife
cd json-swiss-army-knife
uv add click pyyaml tomli rich
```

يتولّى `click` توجيه الواجهة. يتولّى `pyyaml` و`tomli` تحويل الصيغ. يوفّر `rich` مخرجات ملونة.

### أنشئ بنية المشروع

```bash
touch json_knife/__init__.py json_knife/formatter.py json_knife/validator.py json_knife/query.py json_knife/converter.py json_knife/cli.py
```

**✅ قائمة التحقق**

- ✅ `uv --version` يطبع رقم إصدار.
- ✅ يوجد `json-swiss-army-knife/` مع `pyproject.toml`، وكل التبعيات مثبَّتة.
- ✅ يحتوي مجلد `json_knife/` على جميع ملفات الوحدات المطلوبة.

## الخطوة 1: نسّق JSON بمسافة بادئة قابلة للضبط

التنسيق يجعل JSON المضغوط قابلاً للقراءة الإنسان. هذه أبسط ميزة لكنها الأكثر استخدامًا.

### 1.1 نفّذ المُنسّق

**👟 تلميح البداية :**

أنشئ `json_knife/formatter.py` مع دالة تطبع JSON بشكل جميل.

```python
# json_knife/formatter.py
import json

def format_json(data: str, indent: int = 2) -> str:
    parsed = json.loads(data)
    return json.dumps(parsed, indent=indent, ensure_ascii=False, sort_keys=False)
```

يحمل هذا سلسلة JSON ثم يعيد إخراجها بالمسافة البادئة المحددة. يحافظ `ensure_ascii=False` على أحرف Unicode.

**🎯 الناتج المتوقع :**

يُرجع `format_json('{"b":1,"a":2}', indent=2)`:
```json
{
  "b": 1,
  "a": 2
}
```

**🩹 إذا لم يعمل :**

إذا حصلتَ على `json.JSONDecodeError`، فإن المدخل ليس JSON صالحًا.

### 1.2 تحقّق من المُنسّق

**✅ قائمة التحقق**

- ✅ يُرجع `format_json('{"a":1}')` مخرجًا مطبوعًا بشكل جميل.
- ✅ تُحترم المسافة البادئة المخصصة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- ما الفرق بين `sort_keys=True` وتركه خطأً؟ متى قد تريد مفاتيح مرتّبة؟

## الخطوة 2: تحقّق من JSON مع مواقع الأخطاء

يمسك التحقق بأخطاء الصياغة قبل انتشارها. القيمة الرئيسية هي إبلاغ *مكان* حدوث الخطأ.

### 2.1 نفّذ المُتحقِّق

**👟 تلميح البداية :**

أنشئ `json_knife/validator.py`.

```python
# json_knife/validator.py
import json

def validate_json(data: str) -> tuple[bool, str]:
    try:
        json.loads(data)
        return True, "Valid JSON"
    except json.JSONDecodeError as e:
        return False, f"Line {e.lineno}, Column {e.colno}: {e.msg}"
```

يتضمن `json.JSONDecodeError` خاصيتي `lineno` و`colno` تحدّدان موقع الخطأ بدقة.

**🎯 الناتج المتوقع :**

يُرجع `validate_json('{"a": 1,}')` القيمة `(False, "Line 1, Column 10: ...")`.

**🩹 إذا لم يعمل :**

إذا لم تحصل على معلومات السطر/العمود، فأنت لا تمسك `JSONDecodeError`.

### 2.2 تحقّق من المُتحقِّق

**✅ قائمة التحقق**

- ✅ يون JSON صالحًا `(True, "Valid JSON")`.
- ✅ يُرجع JSON غير الصالح `(False, ...)` مع السطر والعمود.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- كيف توسّع هذا للتحقق مقابل JSON Schema؟ وما المكتبة التي ستستخدمها؟

## الخطوة 3: ابنِ محرك استعلامات بترميز النقاط

هذه هي الميزة القاتلة لسكين الجيش السويسرية: `$.users[*].name` لاستخراج القيم المتداخلة.

### 3.1 نفّذ مُحلِّل الاستعلامات

**👟 تلميح البداية :**

أنشئ `json_knife/query.py`.

```python
# json_knife/query.py
import json, re

def query_json(data: str, path: str) -> list:
    parsed = json.loads(data)
    tokens = re.findall(r'[\w\[\]*$]+', path)
    tokens = [t for t in tokens if t not in ("$", "")]
    results = _traverse(parsed, tokens)
    return results if isinstance(results, list) else [results]

def _traverse(obj, tokens):
    if not tokens:
        return obj
    key, *rest = tokens
    if key == "*":
        if isinstance(obj, list):
            return [_traverse(item, rest) for item in obj]
        elif isinstance(obj, dict):
            return [_traverse(v, rest) for v in obj.values()]
        return []
    elif key.endswith("]"):
        idx = int(key.rstrip("]"))
        return _traverse(obj[idx], rest) if isinstance(obj, list) and idx < len(obj) else []
    elif isinstance(obj, dict) and key in obj:
        return _traverse(obj[key], rest)
    return []
```

يستخرج التعبير النمطي رموز المسار مثل `"users"` و`"[*]"` و`"name"`. تسير `_traverse` عبر البنية بشكل متكرر. يتوسع `[*]` إلى كل عناصر القائمة.

**🎯 الناتج المتوقع :**

يُرجع `query_json('[{"name":"Alice"},{"name":"Bob"}]', '$[*].name')` القيمة `["Alice", "Bob"]`.

**🩹 إذا لم يعمل :**

إذا حصلت على نتائج فارغة، تحقّق أن التعبير النمطي يقسم الرموز بشكل صحيح.

### 3.2 تحقّق من محرك الاستعلامات

**✅ قائمة التحقق**

- ✅ يستخرج `$.users[*].name` الأسماء من قائمة كائنات مستخدمين.
- ✅ تعمل المسارات المتداخلة مثل `$.config.database.host`.
- ✅ يوسّع الرمز البديل `[*]` عناصر القائمة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- كيف تضيف دعمًا للمرشحات مثل `$.users[?(@.age > 30)]`؟
- ماذا يحدث إذا كان المسار يحتوي نقاطًا في أسماء المفاتيح؟

## الخطوة 4: نفّذ تحويل الصيغ

التحويل بين JSON وYAML وTOML يوفّر التنقل اليدوي بين الأدوات.

### 4.1 أنشئ المُحوِّل

**👟 تلميح البداية :**

أنشئ `json_knife/converter.py`.

```python
# json_knife/converter.py
import json, yaml, tomli

def convert_to_json(data: str, from_format: str) -> dict:
    if from_format == "yaml":
        return yaml.safe_load(data)
    elif from_format == "toml":
        return tomli.loads(data)
    elif from_format == "json":
        return json.loads(data)
    raise ValueError(f"Unknown format: {from_format}")

def convert_from_json(data: dict, to_format: str) -> str:
    if to_format == "yaml":
        return yaml.dump(data, default_flow_style=False, allow_unicode=True)
    elif to_format == "toml":
        import tomli_w
        return tomli_w.dumps(data)
    elif to_format == "json":
        return json.dumps(data, indent=2, ensure_ascii=False)
    raise ValueError(f"Unknown format: {to_format}")
```

**🎯 الناتج المتوقع :**

ينتج تحويل JSON إلى YAML والعودة إلى الوراء بيانات مكافئة.

**🩹 إذا لم يعمل :**

إذا فشل تحويل TOML، تأكد من تثبيت `tomli-w` للكتابة.

### 4.2 تحقّق من المُحوِّل

**✅ قائمة التحقق**

- ✅ يحافظ JSON ← YAML على أنواع البيانات.
- ✅ تمر YAML ← JSON ذهابًا وإيابًا بشكل صحيح.
- ✅ يعمل TOML ↔ JSON للبنى البسيطة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- ما أنواع البيانات التي يستطيع TOML تمثيلها ولا يستطيع JSON (والعكس بالعكس)؟

## ⚠️ مآزق شائعة

- **حقن المسار في الاستعلامات.** حلّل المسارات دائمًا بتعبير نمطي أو مُجزِّئ، ولا تمرر أبدًا سلاسل خام إلى `eval()` أو وصول سمات ديناميكي.
- **إكراه الأنواع الافتراضي في YAML.** يحوّل YAML صامتًا `yes` إلى `True` و`1.0` إلى عدد عائم. استخدم `yaml.safe_load()` وأبدًا `yaml.load()` مع مدخل غير موثوق.
- **TOML يدعم القواميس فقط.** المصفوفات على المستوى الأعلى ليست TOML صالحًا. تحويل مصفوفة JSON إلى TOML يتطلب لفّها في قاموس.
- **البث للملفات الكبيرة.** تحمّل الميزات الأربع الملف بأكمله إلى الذاكرة. لملفات JSON الأكبر من 100 ميجابايت، استخدم `ijson` للاستعلامات المتدفقة.
- **وسيطات Click مقابل خياراتها.** استخدم الوسيطات لملف المدخل (موضعي، مطلوب) والخيارات للأعلام مثل `--indent` و`--output-format`. هذا يطابق توقعات المستخدمين.

## ما بنيته للتو

أداة CLI واحدة تتعامل مع العمليات الأربع الأكثر شيوعًا على JSON: التنسيق والتحقق والاستعلام وتحويل الصيغ. يمشي محرك الاستعلامات بترميز النقاط عبر البنى المتداخلة بشكل متكرر ويوسّع الرموز البديلة. يسدّ تحويل الصيغ الفجوة بين JSON وYAML وTOML لسير عمل خطوط البيانات. هذه الأداة تحل ألمًا حقيقيًا عند المطوّرين — كل فريق لديه شخص يظل يشغّل `python -m json.tool` ويتمنى لو كان يفعل أكثر.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/json-swiss-army-knife/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/json-swiss-army-knife) في مستودع الدورة نسخة أغنى باستعلامات متدفقة ومقارنة JSON والتحقق من المخطط وواجهة CLI موصولة من البداية للنهاية. استنسخه، أو افتح المستودع كاملًا في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وشغّله من هناك.
:::

## إلى أين تذهب من هنا

- أضف تحليل JSON متدفقًا بـ `ijson` لتستطيع الاستعلام عن ملفات متعددة الجيجابايت دون تحميلها في الذاكرة.
- نفّذ مقارنة JSON بين ملفين، تعرض المفاتيح المضافة والمحذوفة والمتغيرة.
- أضف علم `--jq` يقبل تعبيرات JQ حقيقية، وليس فقط ترميز النقاط.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓