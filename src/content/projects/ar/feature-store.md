---
title: "مستودع الميزات"
description: "مستودع ميزات مركزي للتعلم الآلي مع الإصدار والمشاركة والخدمة عبر الإنترنت وال.offline."
difficulty: "intermediate"
estimatedMinutes: 60
tags: ["ml", "data-pipeline", "database"]
learningObjectives:
  - "تصميم سجل ميزات مع بيانات تعريف مرقّمة بالإصدار"
  - "حساب الميزات من البيانات الخام وتخزينها في مستودع محلي"
  - "توفير الميزات عبر بحث بالمفتاح عند نقطة زمنية للتدريب والاستنتاج"
  - "كشف واجهة سطر أوامر بسيطة لتسجيل الميزات وحسابها وجلبها"
prerequisites: ["Python 101", "تحليل البيانات"]
---

# 🗄️ ابنِ مستودع ميزات

تنهار نماذج التعلم الآلي عندما ينحرف الكود الذي يحسب الميزات أثناء التدريب عن الكود الذي يحسبها في الإنتاج. يصلح مستودع الميزات هذا بحساب الميزات مرة واحدة، وترقيمها بالإصدار، وتقديم القيم نفسها سواء كنت تلائم نموذجًا أو تخضع طلبًا للتقييم. يبني هذا المشروع مستودع ميزات خفيفًا مدعومًا بملفات مع واجهة سطر أوامر: تسجّل تعريفات الميزات، وتحسبها من البيانات الخام، وتجلبها بمفتاح الكيان مع صحة عند نقطة زمنية.

هذا يفترض أساسيات Python وارتياحًا مع pandas من تحليل البيانات ، لا شيء أبعد من ذلك. المشروع اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة.

## 🎯 ما ستفعله

1. تعدّ مشروعًا صغيرًا بـ `uv` وتثبّت التبعيات التي ستحتاجها.
2. تعرّف سجل ميزات يخزّن أسماء الميزات وإصداراتها وأوصاف مصادرها بصيغة JSON.
3. تكتب دالة حسابات ميزات تحوّل البيانات الخام إلى إطار بيانات قابل لإعادة الاستخدام.
4. تخزّن الميزات المحسوبة في مستودع Parquet محلي مع لقطات مرقّمة بالإصدار.
5. تجلب الميزات بمفتاح الكيان مع صحة عند نقطة زمنية بحيث لا يرى التدريب بيانات مستقبلية أبدًا.
6. تربط كل شيء بواجهة سطر أوامر تسجّل وتحسب وتجلب من سطر الأوامر.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي هنا ، يقرأ هذا المشروع ويكتب ملفات على القرص (لقطات Parquet، سجل JSON)، وهو ما يعمل بشكل طبيعي أكثر خارج أي دفتر.

**Google Colab وKaggle Notebooks وBinder** تعمل جميعًا لتجربة الأداة. يثبّت الدفتر التبعيات نفسها ويستخدم الكود نفسه؛ ويعمل التخزين المدعوم بالملفات في نظام ملفات الدفتر المؤقت لمدة الجلسة.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/feature-store/notebook.ar.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/feature-store/notebook.ar.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Ffeature-store%2Fnotebook.ar.ipynb)

## الإعداد

كل ما تحتاجه قبل البناء: بيئة Python، وحزمتان، ودليل مشروع صغير.

### ثبّت `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

أغلق طرفيتك وأعد فتحها، ثم تأكد:

```bash
uv --version
```

### أعدّ هيكل المشروع

```bash
uv init feature-store
cd feature-store
uv add pandas pyarrow click
```

يتولى `pandas` حسابات الميزات، ويسمح لنا `pyarrow` بكتابة ملفات Parquet وقراءتها بكفاءة، ويبني `click` واجهة سطر الأوامر. `python-dotenv` ليس ضروريًا هنا إذ لا توجد مفاتيح API معنية.

### أنشئ بنية المشروع

```bash
mkdir -p store
touch store/__init__.py store/registry.py store/compute.py store/io.py store/cli.py
```

**✅ قائمة التحقق**

- ✅ يطبع `uv --version` رقم إصدار.
- ✅ يوجد `feature-store/` مع `pyproject.toml`، ومثبَّتة `pandas` و`pyarrow` و`click`.
- ✅ يحتوي دليل `store/` على `__init__.py` و`registry.py` و`compute.py` و`io.py` و`cli.py`.

## الخطوة 1: عرّف سجل الميزات

سجل الميزات هو كتالوج كل ما يعرف مخزنك كيف يحسبه. يسجّل كل مدخل اسم الميزة وإصدارها ووصفًا قابلًا للقراءة البشرية والمفتاح الذي ترتبط به. إبقاء هذا كملف JSON بسيط يعني أنه يمكنك فحصه يدويًا، ومقارنة إصداراته، وتحميله بسرعة.

### 1.1 اكتب مخطط السجل

**👟 تلميح البداية :** أنشئ صف بيانات `Feature` وصفًا `Registry` يحمّل ملف JSON ويحفظه.

```python
# store/registry.py
import json
from dataclasses import dataclass, asdict
from pathlib import Path

REGISTRY_PATH = Path("feature_registry.json")

@dataclass
class Feature:
    name: str
    version: int
    description: str
    entity_key: str  # the column used to look up this feature

class Registry:
    def __init__(self, path: Path = REGISTRY_PATH):
        self.path = path
        self.features: dict[str, Feature] = {}
        if path.exists():
            self._load()

    def _load(self):
        raw = json.loads(self.path.read_text())
        for entry in raw:
            feat = Feature(**entry)
            self.features[feat.name] = feat

    def register(self, name: str, version: int, description: str, entity_key: str):
        feat = Feature(name, version, description, entity_key)
        self.features[name] = feat
        self._save()

    def _save(self):
        data = [asdict(f) for f in self.features.values()]
        self.path.write_text(json.dumps(data, indent=2))
```

السجل قاموس يرشِد إليه اسم الميزة، مدعوم بملف JSON مستوٍ. يحمل كل `Feature` عددًا صحيحًا `version` حتى يمكنك التقدم دون إتلاف التعريفات القديمة. يسجّل حقل `entity_key` العمود الذي يعمل كامفتاح بحث ، وهذا مهم لاحقًا عند جلب الميزات لكيان محدد.

**🎯 الناتج المتوقع :** `Registry().register("avg_order_value", 1, "Mean order value", "user_id")` ينشئ ملف `feature_registry.json` يحتوي مدخلًا واحدًا بكل الحقول الأربعة.

**🩹 إذا لم يعمل :** إذا لم يظهر ملف JSON، فقد لا يُستدعى `self._save()` بعد `register()`. إذا أثار تحميل ملف تالف خطأً مربكًا، أضف `try/except json.JSONDecodeError` حول `_load()` واطبع رسالة واضحة.

### 1.2 تحقّق من جولة السجل

```python
# Quick smoke test
from store.registry import Registry

reg = Registry()
reg.register("avg_order_value", 1, "Mean order value per user", "user_id")
reg2 = Registry()  # re-load from disk
assert reg2.features["avg_order_value"].version == 1
```

إعادة تحميل السجل من القرص يجب أن تنتج نفس `Feature` التي سجّلتها للتو ، هذا يؤكد أن جولة JSON تعمل من طرف إلى طرف.

**🎯 الناتج المتوقع :** يمر التأكيد بصمت؛ ويحتوي `feature_registry.json` على المدخل المسجَّل.

**🩹 إذا لم يعمل :** إذا كان `reg2` فارغًا، فمسار `_load()` لا يعمل ، تحقق أن `self.path.exists()` يرجع `True` عند التحميل.

### 1.3 تحقّق من السجل

**✅ قائمة التحقق**

- ✅ ينشئ `Registry().register(...)` ملف `feature_registry.json` بالحقول الصحيحة.
- ✅ إعادة تحميل `Registry()` من المسار نفسه تعيد بيانات الميزة نفسها.
- ✅ ميزتان باسمين مختلفين يمكن أن تتعايشا في ملف السجل نفسه.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لماذا استخدام عدد صحيح للإصدار بدلًا من مجرد الكتابة فوق تعريف الميزة في مكانه؟ ماذا ينكسر إذا عدّلت دائمًا أحدث إصدار؟
- يخزّن السجل بيانات تعريف الميزة لكنه لا يخزّن القيم المحسوبة. ما الميزة التي يمنحك إياها فصل بيانات التعريف عن البيانات عند إضافة تخزين خلفي ثانٍ لاحقًا؟

## الخطوة 2: احسب الميزات من البيانات الخام

الآن وقد عرف السجل *أي* الميزات موجودة، تحتاج كودًا *يحسبها* من البيانات الخام. تأخذ دالة حساب ميزة إطار بيانات خامًا وترجع إطار بيانات جديدًا بالميزة المحسوبة كعمود، مضمومًا على مفتاح الكيان.

### 2.1 اكتب أول دالة حساب

**👟 تلميح البداية :** اكتب دالة تجمّع بيانات المعاملات الخام حسب `user_id` وتحسب متوسط قيمة الطلب.

```python
# store/compute.py
import pandas as pd

def compute_avg_order_value(transactions: pd.DataFrame) -> pd.DataFrame:
    """Compute the average order value per user from a transactions DataFrame."""
    return (
        transactions
        .groupby("user_id")["amount"]
        .mean()
        .reset_index(name="avg_order_value")
    )
```

الحساب `groupby` + `mean` واحد من pandas ، النمط نفسه الذي تستخدمه في أي تحليل بيانات. ترجع الدالة إطار بيانات بعمودين بالضبط: مفتاح الكيان (`user_id`) وقيمة الميزة (`avg_order_value`). هذا الشكل ثنائي الأعمدة هو تنسيق المخرجات القياسي الذي يجب أن تتبعه كل دالة حساب.

**🎯 الناتج المتوقع :** بمعلومية إطار بيانات بعمودي `user_id` و`amount`، ترجع الدالة إطار بيانات بعمودي `user_id` و`avg_order_value` حيث كل صف هو متوسط أحد المستخدمين.

**🩹 إذا لم يعمل :** إذا كان للمخرجات أعمدة إضافية، فسيختار `groupby` الكثير. إذا بدا المؤشر خاطئًا، تأكد من ربط `.reset_index(name="avg_order_value")` بالسلسلة.

### 2.2 أضف دالة حساب ثانية

```python
# store/compute.py (continued)
def compute_purchase_count(transactions: pd.DataFrame) -> pd.DataFrame:
    """Compute the total number of purchases per user."""
    return (
        transactions
        .groupby("user_id")
        .size()
        .reset_index(name="purchase_count")
    )
```

إضافة دالة ثانية تؤكد النمط: كل حساب دالة مستقلة تأخذ بيانات خامًا وترجع إطار بيانات بعمودين يرشِد إليه الكيان.

**🎯 الناتج المتوقع :** ترجع `compute_purchase_count(df)` إطار بيانات بعمودي `user_id` و`purchase_count`.

**🩹 إذا لم يعمل :** إذا أرجع `.size()` سلسلة بدلًا من إطار بيانات، فقد نسيت `.reset_index(name="purchase_count")`.

### 2.3 تحقّق من الحسابات

**✅ قائمة التحقق**

- ✅ ترجع `compute_avg_order_value(df)` إطار بيانات بعمودين هما `user_id` و`avg_order_value`.
- ✅ ترجع `compute_purchase_count(df)` إطار بيانات بعمودين هما `user_id` و`purchase_count`.
- ✅ تعمل الدالتان على إطار البيانات نفسه دون تعديله.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لماذا فرض مخرجات بعمودين (مفتاح الكيان + قيمة الميزة) بدلًا من إرجاع سلسلة أو قاموس؟ كيف يبسّط هذا الشكل خطوتي التخزين والاسترجاع؟
- ماذا يحدث إذا شاركت جدولان خامان مختلفان مفتاح الكيان نفسه لكن بنوعي كيان مختلفين ، لنقل `user_id` في الطلبات و`product_id` في المخزون؟

## الخطوة 3: خزّن الميزات في Parquet مع لقطات مرقّمة بالإصدار

تحتاج الميزات المحسوبة إلى أن تستقر على القرص ليمكن جلبها لاحقًا. Parquet هو التنسيق الصحيح هنا: عمودي، سريع القراءة، وتكتبه pandas باستدعاء دالة واحدة. لكل إصدار من ميزة ملفه الخاص، فجلب «الإصدار 1» يعني قراءة ملف محدد.

### 3.1 اكتب طبقة التخزين

**👟 تلميح البداية :** أنشئ `store/io.py` بدوال تكتب إطار بيانات إلى ملف Parquet مرقَّم بالإصدار وتقرأه مرة أخرى.

```python
# store/io.py
import pandas as pd
from pathlib import Path

STORE_DIR = Path("feature_store_data")

def save_features(feature_name: str, version: int, df: pd.DataFrame):
    """Write a feature DataFrame to a versioned Parquet file."""
    STORE_DIR.mkdir(exist_ok=True)
    path = STORE_DIR / f"{feature_name}_v{version}.parquet"
    df.to_parquet(path, index=False)

def load_features(feature_name: str, version: int) -> pd.DataFrame:
    """Read a feature DataFrame from a versioned Parquet file."""
    path = STORE_DIR / f"{feature_name}_v{version}.parquet"
    return pd.read_parquet(path)
```

اصطلاح تسمية الملف `{name}_v{version}.parquet` بسيط وقابل للقراءة البشرية. تعني `mkdir(exist_ok=True)` أن الدالة تعمل عند أول تشغيل دون خطوة إعداد منفصلة. الكتابة بـ `index=False` تُبقي ملف Parquet نظيفًا ، مفتاح الكيان عمود اعتيادي لا مؤشر، وهو ما يجعل عمليات الضم اللاحقة أبسط.

**🎯 الناتج المتوقع :** تنشئ `save_features("avg_order_value", 1, df)` الملف `feature_store_data/avg_order_value_v1.parquet`، وترجع `load_features("avg_order_value", 1)` إطار بيانات مطابقًا.

**🩹 إذا لم يعمل :** إذا أثار `load_features` خطأ `FileNotFoundError`، فمسار الملف لا يطابق ، تحقق أن `STORE_DIR` ونمط التسمية متسقان بين الحفظ والتحميل. إذا كان لإطار البيانات المحمَّل عمود `__index_level_0__` إضافي، فأنت حفظت بـ `index=True` بدلًا من `False`.

### 3.2 تحقّق من جولة الذهاب والعودة

```python
# Quick round-trip test
import pandas as pd
from store.io import save_features, load_features

df = pd.DataFrame({"user_id": [1, 2], "avg_order_value": [45.0, 82.5]})
save_features("avg_order_value", 1, df)
loaded = pd.read_parquet("feature_store_data/avg_order_value_v1.parquet")
assert loaded.equals(df)
```

يجب أن يُقرأ الملف المحفوظ مرة أخرى كإطار بيانات مطابق. يصطاد هذا الاختبار تباينات التنسيق ومشاكل المؤشر والتناقضات في المسارات مبكرًا.

**🎯 الناتج المتوقع :** يمر التأكيد؛ ويوجد ملف Parquet على القرص بالحجم الصحيح.

**🩹 إذا لم يعمل :** إذا فشل التأكيد، تحقق من تباين إصدار pandas أو من عمود مؤشر غير مرغوب.

### 3.3 تحقّق من التخزين

**✅ قائمة التحقق**

- ✅ يخلق `save_features` ملف `.parquet` في `feature_store_data/`.
- ✅ يقرأ `load_features` إطار بيانات مطابقًا من ذلك الملف.
- ✅ يوجد إصداران مختلفان من الميزة نفسها كملفين منفصلين على القرص.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لماذا ملفات منفصلة لكل إصدار بدلًا من ملف واحد بعمود `version`؟ ما المفاضلة التي يخلقها ذلك بين التخزين وسرعة القراءة؟
- يضغط Parquet البيانات عموديًا. لمستودع ميزات بمسات عديدة لكل كيان، لماذا قد يكون التخزين العمودي أسرع من التخزين الصفّي مثل CSV؟

## الخطوة 4: أجلب الميزات بمفتاح الكيان مع صحة عند نقطة زمنية

الميزة الحاسمة لمستودع الميزات هي الصحة عند نقطة زمنية: عند تدريب نموذج على بيانات تاريخية، يجب ألا تسرّب قيم الميزات المستقبلية إلى الماضي. تبني هذه الخطوة دالة جلب تقرأ ملف ميزة مرقَّمًا بالإصدار وتفلتر إلى مفاتيح الكيان التي طلبتها بالضبط.

### 4.1 اكتب دالة الجلب

**👟 تلميح البداية :** أنشئ `fetch_features` في `store/io.py` تحمّل ميزة مرقَّمة وتفلتر إلى مفاتيح الكيان المطلوبة.

```python
# store/io.py (continued)
def fetch_features(
    feature_name: str,
    version: int,
    entity_keys: list,
    key_column: str = "user_id",
) -> pd.DataFrame:
    """Fetch feature values for specific entity keys from a versioned snapshot."""
    df = load_features(feature_name, version)
    return df[df[key_column].isin(entity_keys)].reset_index(drop=True)
```

فلتر `isin` هو أبسط صورة من الصحة عند نقطة زمنية: تحمّل لقطة كُتبت عند زمن محدد، وتجلب الكيانات التي تهمك فقط. يسمح المعامل `key_column` لهذه الدالة بالعمل لأي نوع كيان، وليس لـ `user_id` فقط.

**🎯 الناتج المتوقع :** ترجع `fetch_features("avg_order_value", 1, [1, 3])` إطار بيانات بصفوف `user_id` فيه 1 أو 3 فقط.

**🩹 إذا لم يعمل :** إذا تضمّنت النتيجة مفاتيح لم تطلبها، فاسم عمود الفلترة خاطئ. إذا كانت النتيجة فارغة، فربما لا توجد المفاتيح في اللقطة المخزنة ، تحقق من رقم الإصدار.

### 4.2 ابنِ واجهة `FeatureStore`

```python
# store/io.py (continued)
class FeatureStore:
    """Convenience wrapper tying registry, computation, and storage together."""

    def __init__(self, registry: "Registry"):
        self.registry = registry

    def compute_and_store(self, name: str, raw_df: pd.DataFrame, compute_fn):
        """Register a feature, compute it, and persist the result."""
        feat = self.registry.features[name]
        df = compute_fn(raw_df)
        save_features(name, feat.version, df)
        return df

    def get(self, name: str, entity_keys: list, key_column: str = "user_id") -> pd.DataFrame:
        """Fetch feature values for specific entity keys."""
        feat = self.registry.features[name]
        return fetch_features(name, feat.version, entity_keys, key_column)
```

تربط الواجهة الطبقات الثلاث معًا: يستدعي `compute_and_store` دالة الحساب ويخزّن النتيجة تحت الإصدار القادم من السجل. ويقرأ `get` الميزة المخزنة للكيانات المحددة. هذا الفصل بين الحساب والتخزين والجلب هو البنية نفسها المستخدمة في مستودعات الميزات الإنتاجية ، إنه أصغر هنا فقط.

**🎯 الناتج المتوقع :** ترجع `store.get("avg_order_value", [1, 2])` إطار بيانات بعمودين بقيمتي المستخدمين.

**🩹 إذا لم يعمل :** إذا أثار `get` خطأ `KeyError`، فالميزة ليست في السجل ، سجّلها قبل الجلب. إذا كان لإطار البيانات المرجَع كل الصفوف بدلًا من المفاتيح المطلوبة فقط، فتحقق أن `fetch_features` تفلتر، لا أن ترجع إطار البيانات كاملًا.

### 4.3 تحقّق من الجلب عند نقطة زمنية

**✅ قائمة التحقق**

- ✅ ترجع `fetch_features` مفاتيح الكيان المطلوبة فقط، لا إطار البيانات المخزَّن كاملًا.
- ✅ يقرأ `FeatureStore.get` الإصدار الصحيح من السجل.
- ✅ حساب الميزة نفسها وجلبها يرجعان قيمًا متسقة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- في خط أنابيب ML حقيقي، قد تدرّب على بيانات يناير لكنك تخدم التنبؤات في مارس. كيف يساعدك مخطط أرقام الإصدارات على خدمة النموذج المُدرَّب في يناير بقيم يناير للميزات، رغم وجود قيم مارس الآن؟
- ماذا ينكسر إذا شاركت ميزتان عمود مفتاح الكيان نفسه لكن حساب إحداهما تجمّع على عمود مختلف؟

## الخطوة 5: اربط كل شيء بواجهة سطر أوامر

تتيح لك واجهة سطر الأوامر تسجيل الميزات وحسابها وجلب النتائج دون كتابة سكربتات Python. تستخدم هذه الخطوة `click` لبناء ثلاثة أوامر فرعية.

### 5.1 ابنِ واجهة سطر الأوامر

**👟 تلميح البداية :** أنشئ `store/cli.py` بأوامر فرعية `register` و`compute` و`fetch`.

```python
# store/cli.py
import click
import pandas as pd
from store.registry import Registry
from store.compute import compute_avg_order_value, compute_purchase_count
from store.io import FeatureStore

COMPUTE_MAP = {
    "avg_order_value": compute_avg_order_value,
    "purchase_count": compute_purchase_count,
}

@click.group()
def cli():
    """Feature Store CLI — register, compute, and fetch ML features."""
    pass

@cli.command()
@click.option("--name", required=True, help="Feature name")
@click.option("--version", default=1, help="Feature version")
@click.option("--description", default="", help="Human-readable description")
@click.option("--entity-key", default="user_id", help="Column to key on")
def register(name, version, description, entity_key):
    reg = Registry()
    reg.register(name, version, description, entity_key)
    click.echo(f"Registered '{name}' v{version}")

@cli.command()
@click.option("--name", required=True, help="Feature name to compute")
@click.option("--input", "input_file", required=True, help="Path to CSV input")
def compute(name, input_file):
    reg = Registry()
    store = FeatureStore(reg)
    fn = COMPUTE_MAP.get(name)
    if fn is None:
        click.echo(f"Unknown feature: {name}. Available: {list(COMPUTE_MAP)}")
        return
    df = pd.read_csv(input_file)
    result = store.compute_and_store(name, df, fn)
    click.echo(f"Computed {len(result)} rows for '{name}'")

@cli.command()
@click.option("--name", required=True, help="Feature name to fetch")
@click.option("--keys", required=True, help="Comma-separated entity keys")
@click.option("--key-column", default="user_id", help="Column to filter on")
def fetch(name, keys, key_column):
    reg = Registry()
    store = FeatureStore(reg)
    key_list = [int(k.strip()) for k in keys.split(",")]
    result = store.get(name, key_list, key_column)
    click.echo(result.to_string(index=False))

if __name__ == "__main__":
    cli()
```

قاموس `COMPUTE_MAP` هو جدول الإرسال: يربط أسماء الميزات بدوال حسابها. إضافة ميزة جديدة تعني كتابة دالة حساب وإضافة سطر واحد إلى هذا الخريطة. الواجهة رقيقة ، تحلل الوسائط وتفوّض إلى كود المكتبة وتطبع النتائج ، وهو ما يجعل اختبار كل أمر فرعي مستقلًا سهلًا.

**🎯 الناتج المتوقع :** يطبع `uv run python -m store.cli register --name avg_order_value --version 1 --description "Mean order value" --entity-key user_id` العبارة "Registered 'avg_order_value' v1" وينشئ ملف السجل.

**🩹 إذا لم يعمل :** إذا لم يستطع `click` العثور على الأمر، فقد تحتاج `if __name__ == "__main__": cli()` في الأسفل. إذا فشل أمر الحساب بسبب ميزة مفقودة، فسجّلها أولًا.

### 5.2 اختبار دخان من طرف إلى طرف

```python
# Quick end-to-end test
import pandas as pd
from store.registry import Registry
from store.compute import compute_avg_order_value, compute_purchase_count
from store.io import FeatureStore

raw = pd.DataFrame({
    "user_id": [1, 1, 2, 2, 3],
    "amount": [10, 20, 30, 40, 50],
})
reg = Registry()
reg.register("avg_order_value", 1, "Mean order value per user", "user_id")
reg.register("purchase_count", 1, "Total purchases per user", "user_id")

store = FeatureStore(reg)
store.compute_and_store("avg_order_value", raw, compute_avg_order_value)
store.compute_and_store("purchase_count", raw, compute_purchase_count)

avg = store.get("avg_order_value", [1, 3])
cnt = store.get("purchase_count", [2])
print(avg)
print(cnt)
```

يشغّل هذا خط الأنابيب كاملًا: التسجيل، والحساب، والتخزين، والجلب. اختُبرت كل قطعة بشكل مستقل في الخطوات السابقة؛ وهذا يؤكد أنها تعمل معًا.

**🎯 الناتج المتوقع :** يُظهر جدول متوسط قيمة الطلب `user_id 1` عند `15.0` و`user_id 3` عند `50.0`. وعدد مشتريات `user_id 2` هو `2`.

**🩹 إذا لم يعمل :** إذا كانت القيم خاطئة، فقد لا تجمّع دالة الحساب على العمود الصحيح. إذا أرجع الجلب كل الصفوف، فـ `fetch_features` لا تفلتر بالمفتاح.

### 5.3 تحقّق من خط أنابيب واجهة سطر الأوامر

**✅ قائمة التحقق**

- ✅ ينشئ `register` مدخل سجل؛ ويقرأ `compute` ملف CSV ويخزّن ملفات Parquet؛ ويطبع `fetch` قيم الميزات المفلترة.
- ✅ إجراء الأوامر الفرعية الثلاثة بالتتابع ينتج نتائج متسقة.
- ✅ تطبع واجهة سطر الأوامر رسائل خطأ مفيدة للميزات المجهولة أو الملفات المفقودة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- ترسل واجهة سطر الأوامر حساب الميزات عبر `COMPUTE_MAP` مشفّرًا في الكود. في مستودع ميزات حقيقي بعشرات الميزات، كيف ستحتز تجنب تحرير هذه الخريطة كلما أضفت واحدة؟
- إذا أردت إضافة علامة `--version` إلى أمر `fetch`، فماذا سيتغير في طريقة استشارة السجل؟

## ⚠️ المآزق الشائعة

- **حساب الميزات على مجموعة البيانات الكاملة بما فيها الصفوف المستقبلية.** عند التدريب على بيانات تاريخية، يجب تصفية إطار البيانات الخام إلى فترة التدريب *قبل* تمريره إلى دالة الحساب. الصحة عند نقطة الزمنية تعيش في بيانات الإدخال، لا في منطق الجلب بمستودع الميزات.
- **الكتابة فوق ملفات الميزات دون إصدار.** إذا كتب `save_features` إلى المسار نفسه كل مرة، تخسر قدرتك على خدمة الإصدارات القديمة. أدرج رقم الإصدار دائمًا في اسم الملف وارفع الرقم عندما يتغير منطق الحساب.
- **تسرّب المؤشر في جولات Parquet.** تكتب pandas مؤشر إطار البيانات إلى Parquet افتراضيًا. استخدم `index=False` عند الحفظ و`reset_index(drop=True)` عند الجلب لتبقي مفتاح الكيان عمودًا عاديًا لا مؤشرًا مخفيًا.
- **تشفير اسم عمود مفتاح الكيان.** قد تُربط ميزات مختلفة بأعمدة مختلفة (`user_id` و`product_id` و`session_id`). المعامل `key_column` موجود لهذا السبب ، لا تفترض أن كل ميزة تستخدم `user_id`.
- **نسيان التسجيل قبل الحساب.** يقرأ `FeatureStore.compute_and_store` الإصدار من السجل. إذا لم تكن الميزة مسجَّلة، تحصل على `KeyError` ، سجّل دائمًا أولًا.

## ما بنيته للتو

مستودع ميزات خفيف لكنه حقيقي: سجل يكتلوج تعريفات الميزات مع الترقيم بالإصدار، ودوال حساب تحوّل البيانات الخام إلى ميزات قابلة لإعادة الاستخدام، وتخزينًا مدعومًا بـ Parquet للقطات المرقَّمة بالإصدار، وواجهة سطر أوامر تربط التسجيل-والحساب-والجلب في خط أنابيب واحد. البنية ، فصل بيانات التعريف والحساب والتخزين والخدمة ، تعكس عمل مستودعات الميزات الإنتاجية مثل Feast وTecton، بملفات بدلًا من قاعدة بيانات موزعة.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/feature-store/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/feature-store) في مستودع الدورة يحتوي نسخة أغنى بدوال حساب أكثر لميزات، ومجموعة بيانات CSV نموذجية، وواجهة سطر أوامر مربوطة من طرف إلى طرف. استنسخه، أو افتح المستودع كاملًا في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وشغّله من هناك.
:::

## إلى أين تذهب من هنا

- أضف فحص نضارة يختم كل لقطة ميزة بوقت ويُنبه عندما تكون البيانات أقدم من عتبة قابلة للتهيئة.
- ابنِ أمرًا فرعيًا `compare` يقارن إصدارين من الميزة نفسها لاكتشاف انحراف التدريب-الخدمة.
- تكامل مع سكربت تدريب نموذج حقيقي: اجب الميزات لمجموعة مفاتيح كيان، ومررها إلى نموذج scikit-learn، وقوّم ما إذا كان انزياح الإصدار يغير الدقة.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها ، وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓