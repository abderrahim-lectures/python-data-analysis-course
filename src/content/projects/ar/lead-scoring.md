---
title: "محرك تقييم العملاء المحتملين"
description: "قيّم وأولّف العملاء المحتملين للبيع بناءً على التفاعل والديموغرافيات وإشارات السلوك."
---


# 🎯 ابنِ محرك تقييم العملاء المحتملين

تغرق فرق المبيعات في العملاء المحتملين. يرتّبها محرك تقييم العملاء المحتملين حسب احتمالية تحويل كل منهم، فيتصل الفريق بالأهم أولًا. يبني هذا المشروع نموذج تقييم يجمع إشارات التفاعل والديموغرافيات والسلوك، ثم يرتّب خط الأنابيب ويختبر مخططات التقييم المختلفة باختبار A/B.

يفترض هذا إنهاء Python 101 وارتياحًا مع pandas من تحليل البيانات. هذا اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة.

## 🎯 ما ستفعله

1. إعداد مشروع باستخدام `uv` وتثبيت تبعيات التحليل.
2. بناء نموذج تقييم عملاء محتملين متعدد العوامل من بيانات التفاعل والديموغرافيات.
3. ترتيب خط مبيعات بطبقات التقييم.
4. اختبار A/B لنموذجي تقييم ومقارنة نتائج التحويل.
5. تلخيص صحة خط الأنابيب بتحليلات pandas.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/lead-scoring/notebook.ar.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/lead-scoring/notebook.ar.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Flead-scoring%2Fnotebook.ar.ipynb)

## الإعداد

كل ما تحتاجه قبل البناء: بيئة Python وpandas.

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
uv init lead-scoring
cd lead-scoring
uv add pandas numpy click
```

تقود `pandas` التحليل. يوفّر `numpy` الرياضيات. يوفر `click` واجهة CLI.

### أنشئ بنية المشروع

```bash
mkdir -p scoring
touch scoring/__init__.py scoring/leads.py scoring/model.py scoring/abtest.py scoring/analytics.py scoring/cli.py
```

**✅ قائمة التحقق**

- ✅ `uv --version` يطبع رقم إصدار.
- ✅ يوجد `lead-scoring/` مع `pyproject.toml` وكل التبعيات مثبَّتة.
- ✅ يحتوي مجلد `scoring/` على جميع ملفات الوحدات المطلوبة.

## الخطوة 1: أنشئ بيانات عينات للعملاء المحتملين

تحتاج مجموعة بيانات عملاء محتملين واقعية لتقييمها. ابنِ دالة تولّد عملاء محتملين بحقول التفاعل والديموغرافيات والسلوك.

### 1.1 ولّد مجموعة البيانات

**👟 تلميح البداية :**

أنشئ `scoring/leads.py`.

```python
# scoring/leads.py
import random, pandas as pd

random.seed(42)

def generate_leads(n=1000) -> pd.DataFrame:
    rows = []
    for i in range(n):
        visited = random.randint(0, 40)
        opened = random.randint(0, 15)
        downloaded = random.randint(0, 5)
        company_size = random.choice(["small", "mid", "enterprise"])
        source = random.choice(["organic", "ads", "referral"])
        rows.append({
            "lead_id": i,
            "visits": visited,
            "emails_opened": opened,
            "assets_downloaded": downloaded,
            "company_size": company_size,
            "source": source,
            "converted": random.random() < 0.3,
        })
    return pd.DataFrame(rows)
```

**🎯 الناتج المتوقع :**

يُرجع `generate_leads()` إطار بيانات من 1000 صف بأعمدة التفاعل والديموغرافيات.

**🩹 إذا لم يعمل :**

إذا لم تطابق أسماء الأعمدة الكود اللاحق، أصلحها هنا أولًا.

### 1.2 تحقّق من بيانات العملاء المحتملين

**✅ قائمة التحقق**

- ✅ يُرجع `generate_leads()` إطار بيانات بكل الأعمدة المتوقعة.
- ✅ القيم ضمن النطاقات المقصودة.
- ✅ يوجد عمود منطقي `converted`.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- ما الإشارة الواقعية المفقودة من هذه المجموعة التي يملكها نظام CRM فعلًا (مثلًا: وقت الوصول، الميزانية)؟

## الخطوة 2: ابنِ نموذج التقييم

يجمع التقييم إشارات موزونة. التفاعل (الزيارات والقراءات والتنزيلات) يتنبأ بالتحويل أفضل عادةً، فيحصل على أعلى وزن.

### 2.1 حدّد النموذج

**👟 تلميح البداية :**

أنشئ `scoring/model.py`.

```python
# scoring/model.py
import pandas as pd


def score_lead(row) -> float:
    engagement = row["visits"] * 1.0 + row["emails_opened"] * 2.0 + row["assets_downloaded"] * 5.0
    if row["company_size"] == "enterprise":
        engagement += 20
    elif row["company_size"] == "mid":
        engagement += 10
    if row["source"] == "referral":
        engagement += 15
    elif row["source"] == "organic":
        engagement += 5
    return engagement


def apply_score(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["score"] = df.apply(score_lead, axis=1)
    df["tier"] = pd.cut(df["score"],
                        bins=[-1, 20, 45, float("inf")],
                        labels=["cold", "warm", "hot"])
    return df
```

**🎯 الناتج المتوقع :**

يضيف `apply_score(df)` عمودي `score` و`tier`، حيث ترفع التنزيلات والمصدر الإحالي التقييم أكثر.

**🩹 إذا لم يعمل :**

إذا لم يكن أي عميل محتمل «حارًا» (hot)، فقد تكون العتبة في `pd.cut` مرتفعة جدًا للبيانات.

### 2.2 تحقّق من النموذج

**✅ قائمة التحقق**

- ✅ يُضاف عمود `score`.
- ✅ يصنّف عمود `tier` العملاء المحتملين إلى `cold` أو `warm` أو `hot`.
- ✅ يحصل كل عميل محتمل على تقييم رقمي.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- الأوزان مختارة يدويًا. ماذا قد يسوء إذا كان وزن خاطئًا، وكيف تكتشف ذلك؟

## الخطوة 3: رتّب خط الأنابيب

يجب أن يهاجم البيع العملاء الحارين أولًا. رتّب خط الأنابيب حسب الطبقة والتقييم، وقِس معدل التحويل لكل طبقة.

### 3.1 رتّب وقِس التحويل

**👟 تلميح البداية :**

أضف دالة مساعدة للترتيب الأولوية.

```python
# scoring/model.py (continued)
def prioritize(df: pd.DataFrame) -> pd.DataFrame:
    tier_order = {"hot": 0, "warm": 1, "cold": 2}
    return (df.assign(tier_rank=df["tier"].map(tier_order))
              .sort_values(["tier_rank", "score"], ascending=[True, False])
              .drop(columns="tier_rank"))


def conversion_by_tier(df: pd.DataFrame) -> pd.DataFrame:
    return (df.groupby("tier", observed=True)["converted"]
              .agg(["count", "mean"])
              .rename(columns={"count": "leads", "mean": "conversion_rate"})
              .round(3))
```

**🎯 الناتج المتوقع :**

يرتّب `prioritize(df)` العملاء الحارين أولًا؛ ويظهر `conversion_by_tier` أن الحارين يتحولون بمعدل أعلى.

**🩹 إذا لم يعمل :**

إذا كانت معدلات التحويل متساوية عبر الطبقات، فأوزان التقييم لا تميّز — شددها.

### 3.2 تحقّق من ترتيب الأولوية

**✅ قائمة التحقق**

- ✅ يفرز `prioritize` حسب الطبقة ثم التقييم تنازليًا.
- ✅ يبلّغ `conversion_by_tier` عن أعداد العملاء المحتملين ومعدلات التحويل.
- ✅ للطبقة الحارة معدل تحويل أعلى من الباردة (للبيانات المنفصلة جيدًا).

**🤔 سؤال (أسئلة) سقراطي(ة)**

- كيف تستخدم معدل التحويل لكل طبقة لتقرر كم عميلًا محتملًا تسلّم لفرق المبيعات كل يوم؟

## الخطوة 4: اختبر نموذجي تقييم باختبار A/B

بدلًا من الثقة بأوزان مختارة يدويًا، قارن نموذجين على البيانات نفسها وانظر أيهما يفصل المحوِّلين عن غير المحوِّلين أفضل.

### 4.1 نفّذ اختبار A/B

**👟 تلميح البداية :**

أنشئ `scoring/abtest.py`.

```python
# scoring/abtest.py
import pandas as pd
from numpy import mean


def model_a(row):
    return row["visits"] + 2 * row["emails_opened"] + 5 * row["assets_downloaded"]


def model_b(row):
    return row["visits"] ** 1.5 + row["emails_opened"] * 3 + row["assets_downloaded"] * 8


def compare_models(df: pd.DataFrame) -> pd.DataFrame:
    results = {}
    for name, fn in [("model_a", model_a), ("model_b", model_b)]:
        df2 = df.copy()
        df2["score"] = df2.apply(fn, axis=1)
        df2["tier"] = pd.cut(df2["score"], bins=[-1, 20, 45, float("inf")], labels=["cold", "warm", "hot"])
        top = df2.sort_values("score", ascending=False).head(300)
        results[name] = {
            "top300_conversion": mean(top["converted"]),
            "hot_count": (df2["tier"] == "hot").sum(),
        }
    return pd.DataFrame(results).T
```

**🎯 الناتج المتوقع :**

يبلّغ `compare_models(df)` عن النموذج الذي يحقق تحويلًا أعلى على أفضل 300 عميل محتمل لديه.

**🩹 إذا لم يعمل :**

إذا تعادلا، فالتمايز بينهما ضعيف جدًا بحيث لا يهم.

### 4.2 تحقّق من اختبار A/B

**✅ قائمة التحقق**

- ✅ يُقيَّم النموذجان وتُقارن أفضل 300 عميل محتمل لكل منهما.
- ✅ يتضمن المخرج معدل التحويل وعدد الحارين.
- ✅ يمكن تحديد النموذج الأفضل على التحويل.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لماذا نقارن على *أفضل 300 عميل محتمل* بدلًا من مجموعة البيانات كاملة؟ ما الذي نقرره ضمنيًا عن طريقة عمل المبيعات؟

## الخطوة 5: لخّص صحة خط الأنابيب

بطاقة سجل بمقاييس إجمالية تخبر الفريق ما إذا كان خط الأنابيب صحيًا إجمالًا.

### 5.1 ابنِ ملخص التحليلات

**👟 تلميح البداية :**

أنشئ `scoring/analytics.py`.

```python
# scoring/analytics.py
import pandas as pd


def summarize(df: pd.DataFrame) -> pd.DataFrame:
    summary = {
        "leads": len(df),
        "hot_leads": (df["tier"] == "hot").sum(),
        "warm_leads": (df["tier"] == "warm").sum(),
        "cold_leads": (df["tier"] == "cold").sum(),
        "avg_score": round(df["score"].mean(), 2),
        "overall_conversion": round(df["converted"].mean(), 3),
    }
    return pd.DataFrame([summary])


def by_source(df: pd.DataFrame) -> pd.DataFrame:
    return (df.groupby("source")["converted"]
              .agg(["count", "mean"])
              .rename(columns={"count": "leads", "mean": "conversion_rate"})
              .round(3))
```

**🎯 الناتج المتوقع :**

يُرجع `summarize(df)` صفًا واحدًا من صحة خط الأنابيب؛ ويظهر `by_source` أي مصدر اكتساب يحوّل أفضل.

**🩹 إذا لم يعمل :**

إذا كان التحويل الإجمالي أعلى أو أقل بكثير من المتوقع، فقد يحتاج الإسناد العشوائي لـ `converted` إلى عتبة مختلفة.

### 5.2 تحقّق من الملخص

**✅ قائمة التحقق**

- ✅ يُرجع `summarize` أعداد العملاء المحتملين حسب الطبقة والمتوسط والتحويل الإجمالي.
- ✅ يبلّغ `by_source` عن التحويل حسب قناة الاكتساب.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- إذا كانت «الإحالات» تحوّل بنسبة 40٪ و«الإعلانات» بنسبة 15٪، فما التغيير الذي ستجريه على ميزانية التسويق؟

## ⚠️ مآزق شائعة

- **الإفراط في ملاءمة الأوزان المختارة يدويًا.** الأوزان التي تبدو صحيحة على مجموعة بيانات قد تكون خاطئة على التالية. اختبار A/B للأوزان مقابل بيانات تحويل حقيقية يحرس ضد هذا.
- **NaN من `pd.cut`.** إذا تجاوز تقييم أعلى حافة صندوق، يصبح طبقة `NaN`. استخدم `float("inf")` كحافة أخيرة.
- **النسخ قبل إضافة الأعمدة.** قد يطلق `df.apply` داخل دالة التقييم `SettingWithCopyWarning`. استدعِ `.copy()` أولًا، كما هو معروض في `apply_score`.
- **تجاهل تكلفة مطاردة التحويلات.** طبقة «حارة» تحوّل 30٪ ما زالت تضيع 70٪ من المكالمات. اقرن التقييم بالقيمة المتوقعة، وليس الاحتمال فقط.
- **البيانات التجريبية ≠ الإنتاج.** العملاء المحتملون المولّدون عشوائيًا لن يعكسوا سلوك تحويل حقيقي. تحقّق من نموذجك على عملاء محتملين حقيقيين تاريخيين قبل الثقة به.

## ما بنيته للتو

محرك تقييم عملاء محتملين: مجموعة بيانات عملاء محتملين مولّدة، ونموذج تقييم موزون متعدد العوامل يرتّب العملاء المحتملين إلى طبقات باردة/دافئة/حارة، وفرز خط أنابيب بالأولوية، ومقارنة A/B لمخططي تقييم، وملخص صحة خط أنابيب مبني على pandas. هذا جوهر التحليلات لفريق عمليات المبيعات — تحديد من نستدعيه وبأي ترتيب، وهل النموذج الحالي يعمل.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/lead-scoring/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/lead-scoring) في مستودع الدورة نسخة أغنى بتقييم مبني على التعلم الآلي وتوجيه عملاء محتملين آليًا وواجهة CLI موصولة من البداية للنهاية. استنسخه، أو افتح المستودع كاملًا في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وشغّله من هناك.
:::

## إلى أين تذهب من هنا

- درّب مصنّفًا حقيقيًا (انحدار لوجستي) على العملاء المحتملين المحوِّلين مقابل غير المحوِّلين وقارن ترتيبه بنموذجك اليدوي.
- أضف إثراء العملاء المحتملين من مصدر بيانات خارجي لتغذية إشارات جديدة في التقييم.
- ابنِ قاعدة توجيه تعيّن العملاء الحارين تلقائيًا لأفضل مندوب أداءً.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓