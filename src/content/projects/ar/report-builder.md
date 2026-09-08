---
title: "منشئ التقارير"
description: "أنشئ تقارير أعمال من البيانات مع الرسوم البيانية والجداول والجدولة التلقائية."
difficulty: "beginner"
estimatedMinutes: 50
tags: ["data-visualization", "matplotlib", "pandas", "reporting"]
learningObjectives:
  - "حمل البيانات وتجهيزها بـpandas لإعداد التقارير"
  - "بناء أربعة أنواع رسم: شريطي وخطي ودائري وانتشار"
  - "تنسيق البيانات في جداول نصية جاهزة للنشر"
  - "تجميع الرسوم البيانية مع الملخصات في تقرير واحد"
prerequisites: ["أساسيات Python (الدوال، الحلقات، القواميس)", "فهم القوائم والحسابات الأساسية", "تثبيت الحزم بـuv"]
---

# 🛠️ 📊 منشئ التقارير

التقارير التجارية حلقة لا تتغير شكلها أبدًا: خذ البيانات الخام، ويلخّصها، واعرضها، وشاركها. يبني هذا المشروع تلك الحلقة بـpandas وmatplotlib — حمّل CSV مبيعات، واحسب الإجماليات التي يسأل عنها أي مدير فعلًا، وارسم رسمًا شريطيًّا وخطيًّا ودائريًّا وانتشار، ونسّق كل شيء في جدول نظيف، وجمّعه كله في ملف تقرير واحد.

يفترض هذا Python 101 والراحة مع الدوال والقوائم الأساسية — لا شيء وراء ذلك مطلوب. إنه اختياري وغير مصنّف؛ راجع [المشاريع الواقعية](/ar/مشاريع) للقائمة الكاملة والمتنامية.

## 🎯 ما ستفعله

1. ولّد CSV مبيعات واقعيًا وحمّله في DataFrame من pandas.
2. جمّع الإيرادات حسب الفئة بـ`groupby` للإجماليات البارزة.
3. ارسم أربعة أنواع رسم واحفظ كلًّا منها بصيغة PNG عالية الدقة.
4. نسّق جدول ملخص يصطف في أي طرفية.
5. جمّع الرسوم + الملخص + البيانات الوصفية في مجلد تقرير واحد.

## أين تُشغّل هذا

**محليًا مع `uv`** هو المسار الأساسي. تثبت `pandas` و`matplotlib` بنظافة، والمحتوى غير التفاعلي `Agg` لـmatplotlib (المستخدم في الخطوة 2) يعني أن الرسوم تُصيَّر حتى على آلة بلا شاشة، وملفات التقرير تصل فعلًا إلى مجلد مشروعك.

**تشغيلات Google Colab وBinder notebook** تعمل بنفس الطريقة — ثبّت الزوج مع سطر `!pip install pandas matplotlib` واحد، والدفتر يعكس كل خطوة مع رسوم محفوظة في بيئة الدفتر. **JupyterLite** يمكنه تشغيل أجزاء pandas في المتصفح، لكنه الأضعف بين الثلاثة لهذا المشروع: يعمل فيه matplotlib، مع أن حفظ ملفات رسوم PNG *على قرص حقيقي* أمر محرج، لذا تعامل معه كمسار للتجربة واستخدم شارات الدفتر أو `uv` المحلي عندما تريد بقاء أصول التقرير.

[![فُتح في Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/report-builder/notebook.ipynb)
[![فُتح في Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/report-builder/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Freport-builder%2Fnotebook.ipynb)

## الإعداد

أنشئ المشروع وثبّت المكتبتين اللتين بُني عليهما المشروع كله.

```bash
uv init report-builder
cd report-builder
uv add pandas matplotlib
```

```bash
uv run python -c "import pandas, matplotlib; print('ok')"
```

`pandas` هي طبقة البيانات — الحمل، والتجميع، والتصفية — و`matplotlib` طبقة الرسم التي تحول التجميعات إلى رسوم. البدء بهما مثبتين يعني أن كل خطوة أدناه حول أفكار *إعداد التقارير* لا شجّاع الاعتماديات.

**✅ قائمة التحقق**

- ✅ انتهى `uv add pandas matplotlib` وطبع `uv run python -c "import pandas, matplotlib"` الرمز `ok`.
- ✅ مشروع `report-builder/` جديد موجود مع `pyproject.toml`.

## الخطوة 1: حمّل البيانات وجهّزها

يبدأ كل تقرير ببيانات قد تكون موجودة وقد لا تكون. تبني هذه الخطوة محمّلًا يولّد CSV مبيعات واقعيًا حين لا يكون موجودًا — فيعمل المشروع فورًا — وتحلل التواريخ فيعمل التقرير المبني على الوقت لاحقًا.

### 1.1 اكتب مولّد البيانات والمحمّل

**👟 تلميح البداية :** أنشئ مجموعة بيانات عينة حتمية (عشوائية مزرعة)، واحفظها CSV، ثم حمّلها مجددًا مع `parse_dates=["date"]` ليصبح عمود التاريخ datetime حقيقيًا.

```python
# report.py
import os
import random
import pandas as pd

def create_sample_data(filepath: str = "sales_data.csv"):
    """Generate sample sales data for the report."""
    data = {
        "date": pd.date_range("2024-01-01", periods=100, freq="D"),
        "category": ["Electronics", "Clothing", "Food", "Books"] * 25,
        "revenue": [120.50, 89.99, 45.00, 23.50] * 25,
        "units_sold": [3, 5, 12, 8] * 25,
    }
    random.seed(42)
    data["revenue"] = [r * random.uniform(0.7, 1.3) for r in data["revenue"]]
    data["units_sold"] = [max(1, int(u * random.uniform(0.5, 1.5))) for u in data["units_sold"]]

    df = pd.DataFrame(data)
    df.to_csv(filepath, index=False)
    print(f"Sample data saved to {filepath} ({len(df)} rows)")
    return df

def load_data(filepath: str = "sales_data.csv") -> pd.DataFrame:
    """Load sales data from CSV, creating sample data if the file is missing."""
    if not os.path.exists(filepath):
        print("No data file found. Generating sample data...")
        return create_sample_data(filepath)

    df = pd.read_csv(filepath, parse_dates=["date"])
    print(f"Loaded {len(df)} rows from {filepath}")
    return df

df = load_data()
print(df.head(10).to_string(index=False))
```

`random.seed(42)` هو ما يجعل بيانات العينة *قابلة لإعادة الإنتاج*: نفس البذرة تعطي نفس تباين"العشوائية" في كل تشغيل، فتصبح الرسوم والإجماليات التي تنتجها هي الرسوم والإجماليات في النواتج المتوقعة، لا تقريرًا مختلفًا كل مرة. يخبر `parse_dates=["date"]` pandas أن يفك ترميز عمود التاريخ إلى كائنات `datetime` حقيقية عند الحمل — ذلك هو ما يجعل "متوسط الإيراد اليومي" ونطاق تاريخ التقرير في الخطوة 5 قابلين للحساب لا لترتيب السلاسل. يبقي `index=False` على `to_csv` عمود فهرس ضالًا خارج الملف، فينتج إعادة الحمل DataFrame نظيفًا مجددًا.

**🎯 الناتج المتوقع :** `Sample data saved to sales_data.csv (100 rows)` — أو، في تشغيل ثانٍ مع وجود الملف، `Loaded 100 rows from sales_data.csv`. ثم معاينة 10 صفوف بأعمدة `date` و`category` و`revenue` و`units_sold`.

**🩹 إذا لم يعمل :** إذا جُدّد الملف كل تشغيل، فـ`os.path.exists` يفحص مسارًا مختلفًا عن الذي يستخدمه المولّد — مرّر نفس إعداد `filepath` الافتراضي لكليهما. إذا طُبع `df["date"]` كسلاسل مثل `2024-01-01` دون `T`، فلم يُحلل فعلًا — تأكد بـ`df.dtypes` (يجب أن يكون `date` من نوع `datetime64[ns]`). إذا كانت كل قيمة إيراد متطابقة، فلم يُطبَّق الضرب `random.seed(42)` على القائمة.

### 1.2 افحص ما تعمل معه

**👟 تلميح البداية :** اسأل pandas عن الشكل وعدد الصفوف لكل فئة، فيعرف حجم مجموعة البيانات وتوازنها قبل رسم أي شيء.

```python
# report.py (continued)
print(f"Rows: {len(df)}, Columns: {list(df.columns)}")
print(df.groupby("category")["revenue"].count())
```

`df.groupby("category")["revenue"].count()` هو أول تجميع حقيقي لديك: تقسّم `groupby("category")` الإطار إلى مجموعة واحدة لكل فئة، وتختار `["revenue"]` عمودًا للقياس، و`count()` تعدّ المدخلات غير الفارغة لكل مجموعة. هذا شكل التعبير نفسه الذي ستستخدمه في الخطوة 2 لـ*جمع* الإيرادات حسب الفئة — الفرق الوحيد هو الطريقة النهائية.

**🎯 الناتج المتوقع :** `Rows: 100, Columns: ['date', 'category', 'revenue', 'units_sold']`، ثم عدّ لكل فئة بقيمة `25` لكلٍّ من الفئات الأربع.

**🩹 إذا لم يعمل :** إذا لم يكن عدّ ما 25، فلم ينتج نمط البلاط `* 25` في المولّد مجموعة بيانات متوازنة — تحقق من طول القائمة الأصلية. إذا أخطأ `groupby`، فاسم عمود `category` مكتوب خطأً أو مفقود من CSV.

### 1.3 تحقّق من طبقة البيانات

**✅ قائمة التحقق**

- ✅ التشغيل مرة ينشئ `sales_data.csv`؛ والتشغيل مجددًا يحمّله بدل تجديده.
- ✅ يعرض `df.dtypes` أن `date` نوع datetime.
- ✅ يعيد `groupby("category")["revenue"].count()` الرقم 25 لكل فئة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تستخدم بيانات العينة قيمة `random.seed(42)` ثابتة. ما الذي ستتخلى عنه إذا أزلت البذرة — وفي أي سير عمل حقيقي (عرض توضيحي، مسار تدقيق، لوحة معلومات مباشرة) قد ترغب فعلًا في تباين غير مزرع؟
- تُحلل التواريخ مع `parse_dates=["date"]`. أي نوع من الأخطاء قد يصيب تقريرًا إذا بقي عمود التاريخ سلاسل — اختر عملية واحدة ملموسة (الفرز، أو إيجاد أدنى تاريخ، أو رسم سلسلة زمنية) وقل كيف تنكسر.

## الخطوة 2: ارسم أول رسم بياني

الرسم البياني ملخص يمكنك رؤيته. ترسم هذه الخطوة أول الأشكال الأربعة — رسم شريطي أفقي لإيرادات الفئات — وتؤسس النمط الذي يتبعه كل رسم لاحق: ابنِ `figure` و`axes`، وارسم، وعلّم، واحفظ، وأغلق.

### 2.1 احفظ رسمًا شريطيًّا لإيرادات الفئات

**👟 تلميح البداية :** حوّل matplotlib إلى المحتوى `Agg` (آمن بلا رأس)، وجمّع واجمع الإيرادات حسب الفئة، وارسم بزوج شكل + محور لتتحكم في الحجم.

```python
# report.py (continued)
import matplotlib
matplotlib.use("Agg")  # non-interactive backend: render to files, not windows
import matplotlib.pyplot as plt

def chart_revenue_by_category(df: pd.DataFrame, output: str = "chart_bar.png"):
    """Bar chart of total revenue by category."""
    summary = df.groupby("category")["revenue"].sum().sort_values(ascending=True)

    fig, ax = plt.subplots(figsize=(8, 4))
    colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"]
    summary.plot(kind="barh", ax=ax, color=colors[:len(summary)])
    ax.set_title("Revenue by Category", fontsize=14, fontweight="bold")
    ax.set_xlabel("Total Revenue ($)")
    ax.set_ylabel("")
    plt.tight_layout()
    plt.savefig(output, dpi=150)
    plt.close()
    print(f"Bar chart saved to {output}")

chart_revenue_by_category(df)
```

استدعاء `matplotlib.use("Agg")` ، الموضوع **قبل** استيراد `pyplot`، هو ما يجعل هذا المشروع يعمل على خادم أو في CI دون شاشة: `Agg` هو المحتوى النقطي الخالص الذي يصيَّر مباشرة إلى ملفات. يجمع `groupby("category")["revenue"].sum().sort_values()` بين التجميع والترتيب، فيُصيَّر الرسم الشريطي *مرتبًا* — الأصغر في الأسفل مع `barh`، ما يُقرأ طبيعيًّا. يكتب `plt.savefig(output, dpi=150)` ملفًا لا نافذة منبثقة، و`plt.close()` المنضبط يحرر ذاكرة الشكل فلا تتسرّب حلقة رسوم طويلة التشغيل.

**🎯 الناتج المتوقع :** ملف `chart_bar.png`، زائد الطباعة `Bar chart saved to chart_bar.png`. افتح الصورة: أربعة أشرطة أفقية، واحد لكل فئة، مرتبة تصاعديًّا.

**🩹 إذا لم يعمل :** إذا حصلت على `UserWarning: Starting a Matplotlib GUI outside of the main thread` أو `TclError` عن عدم وجود شاشة، فإن `matplotlib.use("Agg")` يعمل *بعد* أن يكون `pyplot` مُستوردًا بالفعل — يجب أن يسبق `use` كل استيراد pyplot. إذا كان الملف فارغًا، فاستُدعيت `savefig` قبل أن يحدث أي رسم. إذا لم تتطابق الألوان مع الفئات، فشريحة `colors[:len(summary)]` والسلسلة المرتبة يجب أن يكون لهما الطول والترتيب نفسيهما.

### 2.2 تحقّق من نمط الرسم القابل للتكرار

**👟 تلميح البداية :** أعد تشغيل الدالة وتأكد أن الملف يُعاد بناؤه بشكل متطابق — المخرج الخامل (نفس المدخل → نفس PNG) هو ما يجعل إعداد التقارير الدفعي جديرًا بالثقة.

**🎯 الناتج المتوقع :** إعادة تشغيل الكتلة تستبدل `chart_bar.png` بنفس الرسم وتطبع `Bar chart saved to chart_bar.png` مجددًا — لا خطأ، لا نافذة منبثقة.

**🩹 إذا لم يعمل :** إذا أطلقت نافذة في التشغيل الثاني أو أخطأت بخصوص شاشة، فسطر المحتوى `Agg` انزلق تحت استيراد pyplot عند لصق مجدد. إذا ظهر `FileNotFoundError` عند الحفظ، فمجلد المخرج غير موجود — لا تنشئ `savefig` مجلدات، لذلك يجب `os.makedirs` (أو خطوة التقرير).

**✅ قائمة التحقق**

- ✅ `chart_bar.png` موجود ويفتح كرسم أفقي بأربعة أشرطة مرتبة تصاعديًّا.
- ✅ المحتوى `Agg` نشط قبل استيراد `pyplot`.
- ✅ تشغيل الدالة مرتين يعيد بناء الملف نفسه دون أخطاء.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يرتب الرسم تصاعديًّا ويستخدم `barh`. ما الذي يتغير في قراءة مُشاهد لنفس البيانات إذا رسمت السلسلة *غير المرتبة* كأشرطة رأسية بدلًا — هل توجد حالة تكون فيها"الترتيب الخطأ" هو الصادق؟
- `plt.close()` ينهي هذه الدالة، لكن الأسطر التأسيسية `fig, ax = plt.subplots(...)` تربط زوج كائنات. ماذا يحدث إذا نسيت الإغلاق في حلقة تبني 200 رسم — ولماذا يظهر ذلك الفشل عادةً متأخرًا لا فورًا؟

## الخطوة 3: أضف أنواع الرسوم الثلاثة الأخرى

رسم واحد يعرض ترتيبًا؛ والتقرير عادةً يحتاج الاتجاه والحصة والعلاقة أيضًا. تضيف هذه الخطوة الرسوم الخطية (الإيرادات بمرور الوقت)، والدائرية (الحصة حسب الفئة)، والانتشار (الإيرادات مقابل الوحدات)، كلٌّ يتبع نمط شكل/رسم/حفظ/إغلاق في الخطوة 2.

### 3.1 ارسم اتجاه الإيرادات كرسم خطي

**👟 تلميح البداية :** أعد تشكيل الإيرادات اليومية بالجمع لكل تاريخ، ثم ارسم مع تعبئة تحت المنحنى.

```python
# report.py (continued)
def chart_revenue_trend(df: pd.DataFrame, output: str = "chart_line.png"):
    """Line chart of daily revenue trend."""
    daily = df.groupby("date")["revenue"].sum()

    fig, ax = plt.subplots(figsize=(10, 4))
    ax.plot(daily.index, daily.values, color="#3b82f6", linewidth=1.5)
    ax.fill_between(daily.index, daily.values, alpha=0.1, color="#3b82f6")
    ax.set_title("Daily Revenue Trend", fontsize=14, fontweight="bold")
    ax.set_xlabel("Date")
    ax.set_ylabel("Revenue ($)")
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()
    plt.savefig(output, dpi=150)
    plt.close()
    print(f"Line chart saved to {output}")

chart_revenue_trend(df)
```

`daily = df.groupby("date")["revenue"].sum()` ينهار الإطار إلى نقطة واحدة لكل تاريخ — لأن `groupby` يجمع *القيم التاريخية الفريدة*، وكل تاريخ يظهر في البيانات مرة واحدة بالضبط، فهذه عمليًّا سلسلة زمنية كاملة الدقة. `ax.plot(daily.index, daily.values, ...)` هو الطريقة غير الأصلية لـpandas في الرسم (أخرجنا الملخص من DataFrame)، ما يسمح لك بتمرير فهرس التاريخ مباشرة إلى matplotlib. `fill_between` مع `alpha=0.1` منخفضة يلوّن المنطقة تحت الخط — مكسب قراءة رخيص يحول خطًّا إلى شكل.

**🎯 الناتج المتوقع :** `chart_line.png` يعرض خط إيرادات يوميًّا عبر نطاق المئة يوم، بتعبئة زرقاء فاتحة تحته وتسميات تواريخ مدرّجة على المحور السيني.

**🩹 إذا لم يعمل :** إذا تداخلت تسميات المحور السيني في لطخة، فسُحبت `rotation=45, ha="right"`. إذا رسم matplotlib فهرس أعداد صحيحة خام بدل التواريخ، فلم يُطبَّق `parse_dates` من الخطوة 1. إذا كان الخط مسطحًا تمامًا، فقد لا يجمع `groupby("date")` — تحقق من `daily.describe()` للتباين.

### 3.2 أضف الرسم الدائري والانتشار

**👟 تلميح البداية :** للدائري، اجمع الوحدات لكل فئة ودع matplotlib يعرض النسب المئوية؛ للانتشار، ارسم سلسلة ملوّنة واحدة لكل فئة واعتمد على ملف الشكل المحفوظ للفحص.

```python
# report.py (continued)
def chart_category_distribution(df: pd.DataFrame, output: str = "chart_pie.png"):
    """Pie chart of units sold by category."""
    units = df.groupby("category")["units_sold"].sum()

    fig, ax = plt.subplots(figsize=(6, 6))
    colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"]
    ax.pie(units, labels=units.index, autopct="%1.1f%%", colors=colors, startangle=90)
    ax.set_title("Units Sold by Category", fontsize=14, fontweight="bold")
    plt.tight_layout()
    plt.savefig(output, dpi=150)
    plt.close()
    print(f"Pie chart saved to {output}")

def chart_price_vs_units(df: pd.DataFrame, output: str = "chart_scatter.png"):
    """Scatter chart of price vs units sold."""
    fig, ax = plt.subplots(figsize=(8, 5))
    categories = df["category"].unique()
    colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"]

    for cat, color in zip(categories, colors):
        subset = df[df["category"] == cat]
        ax.scatter(subset["revenue"], subset["units_sold"], label=cat, alpha=0.6, color=color, s=50)

    ax.set_title("Revenue vs Units Sold", fontsize=14, fontweight="bold")
    ax.set_xlabel("Revenue ($)")
    ax.set_ylabel("Units Sold")
    ax.legend()
    plt.tight_layout()
    plt.savefig(output, dpi=150)
    plt.close()
    print(f"Scatter chart saved to {output}")

chart_category_distribution(df)
chart_price_vs_units(df)
```

`autopct="%1.1f%%"` في الدائري مواصفة تنسيق مصغرة — يستدعي matplotlib تلك السلسلة بنسبة كل شريحة فيصيّر منزلة عشرية واحدة زائد `%` حرفيًا، فتصبح شريحة من `0.27` `27.0%` (يخفف `%%` المضاعف علامة `%` المفردة). حلقة `for cat, color in zip(...)` في الانتشار تقسّم الإطار حسب الفئة وتدع كلًّا منها كسلسلة ملوّنة مستقلة، فيستطيع مفتاح الرموز تمييز أربع مجموعات — و`alpha=0.6` يجعل النقاط المتداخلة مرئية لا كتلًا صلبة. تحافظ الدالتان على انضباط الخطوة 2: مدخل خامل، PNG واحد مخرجًا.

**🎯 الناتج المتوقع :** `chart_pie.png` يعرض حصص وحدات الفئات الأربع مع تسميات نسب مئوية، و`chart_scatter.png` بأربع سلاسل ملوّنة وتسميات محاور ومفتاح رموز.

**🩹 إذا لم يعمل :** إذا تداخلت تسميات الدائري أو اختفت، فهناك شرائح كثيرة أو متشابهة جدًا لتسمية نظيفة — لا يزيل `autopct` الشرائح الصغيرة، بل يسمّيها فقط. إذا أظهر الانتشار لونًا واحدًا أو مفتاح رموز فارغًا، فاقتران `zip(categories, colors)` غير متطابق — يجب أن يكون للتسلسلين الترتيب نفسه. إذا طبع `%1.1f%%` `1.1f` حرفيًا، فسلسلة التنسيق تفتقر إلى هروب معامل `%`.

### 3.3 تحقّق من الرسوم الأربعة

**✅ قائمة التحقق**

- ✅ أربعة ملفات PNG موجودة: `chart_bar.png` و`chart_line.png` و`chart_pie.png` و`chart_scatter.png`.
- ✅ يفتح كلٌّ منها ليكشف نوع الرسم الذي يعد به اسمه.
- ✅ المحتوى `Agg` وانضباط `plt.close()` استمرّا عبر الدوال الأربع.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يعرض الرسمان الدائري والشريطي ملخصين لكل فئة، من نفس البيانات. متى يكون الرسم الدائري الخيار الخطأ فعلًا لمقارنة فئات، رغم عرضه بسلاسة — وما الذي يخسره *القارئ* مما ينقله الشريطي؟
- كل دالة رسم تثبّت عنوانها الخاص. إذا احتاج تقرير لعرض كل رسم بموضوع واحد (نفس الخط، نفس تنسيق الترويسة)، فما الذي يتغير هيكليًّا — ولماذا يجعل نمط `fig, ax = plt.subplots(...)` ذلك أسهل من الرسم على شكل عام ضمني؟

## الخطوة 4: نسّق جدول ملخص

تجيب الرسوم عن "ماذا تقول الأرقام في لمحة"؛ ويجيب الجدول عن "ما هي بالضبط". تبني هذه الخطوة جدولًا نصيًّا بأعمدة محاذاة وإجماليات وتنسيق عملة — مخرج جاهز لإسقاطه في تقرير أو بريد أو طرفية.

### 4.1 جمّع وحاذِ الجدول

**👟 تلميح البداية :** استخدم `groupby().agg()` واحدة لحساب أعمدة الملخص الأربعة كلها مرة واحدة، ثم رتّبها بعروض حقول f-string لتتسق الأعمدة حتى الحرف.

```python
# report.py (continued)
def format_summary_table(df: pd.DataFrame) -> str:
    """Create a formatted summary table of sales by category."""
    summary = df.groupby("category").agg(
        total_revenue=("revenue", "sum"),
        avg_revenue=("revenue", "mean"),
        total_units=("units_sold", "sum"),
        num_transactions=("revenue", "count"),
    ).round(2)

    lines = []
    header = f"{'Category':<15} {'Revenue':>12} {'Avg Sale':>10} {'Units':>8} {'Sales':>8}"
    lines.append(header)
    lines.append("-" * len(header))

    for cat, row in summary.iterrows():
        line = f"{cat:<15} ${row['total_revenue']:>10,.2f} ${row['avg_revenue']:>8,.2f} {int(row['total_units']):>8} {int(row['num_transactions']):>8}"
        lines.append(line)

    lines.append("-" * len(header))
    total_rev = summary["total_revenue"].sum()
    total_units = int(summary["total_units"].sum())
    total_sales = int(summary["num_transactions"].sum())
    lines.append(f"{'TOTAL':<15} ${total_rev:>10,.2f} {'':>10} {total_units:>8} {total_sales:>8}")

    return "\n".join(lines)

table = format_summary_table(df)
print(table)
```

`df.groupby("category").agg(...)` يشغّل *أربع* عمليات تجميع في مرور واحد — كل إدخال يسمّي عمود مخرجًا وزوج `(عمود المصدر، العملية)` لإنتاجه، وهو أبعد ما يكون عن أربعة استدعاءات `groupby` منفصلة. عروض f-string تعمل تصميمًا حقيقيًّا: `:>12` يحاذي الإيرادات يمينًا في 12 حرفًا و`,` في `:>10,.2f` يضيف فواصل الآلاف، فيصبح `2984.5` `  $2,984.50` وكل صف يصطف عند العمود نفسه. يعيد صف `TOTAL` النهائي استخدام نفس مواصفات العرض بسلسلة حشو فارغة فيتسق التذييل مع صفوف البيانات فوقه.

**🎯 الناتج المتوقع :** ترويسة من خمسة أسطر، ثم أربعة صفوف بيانات (واحد لكل فئة) تنتهي بصف `TOTAL` — كل عمود محاذٍ رأسيًّا وقيم العملة منسّقة بفواصل.

**🩹 إذا لم يعمل :** إذا اختلت الأعمدة مرئيًّا، فثمة اختلاف بين أرقام العرض في الترويسة وصفوف الجسم — يجب أن يستخدم كلاهما نفس المواصفات. إذا انزاح `TOTAL` يمينًا، فحقل حشوه الفارغ بعرض مختلف عن عمود `Avg Sale`. إذا ظهرت القيم كـ`2984.5` دون فواصل، فعلم `,` مفقود من تنسيق `.2f`.

### 4.2 تحقّق من الجدول

**✅ قائمة التحقق**

- ✅ للجدول صف واحد لكل فئة زائد صف `TOTAL` بارز.
- ✅ أعمدة الإيرادات محاذاة يمينًا ومجمّعة بفواصل وبمنزلتين عشريتين.
- ✅ إعادة تشغيل الدالة تنتج سلسلة مطابقة لنفس البيانات.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يُبنى الجدول بسلاسل f ذات عروض ثابتة، وهو يعمل لأن *أسماء* الأعمدة تناسب تلك العروض. ما الذي يكسّر المحاذاة إذا كان اسم فئة بطول 30 حرفًا — وما الخياران أو الثلاثة (اقتطاع، عرض ديناميكي، مكتبة) عندما تتجاوز البيانات الحقيقية أعمدةك؟
- `int(row['total_units'])` يحذف عمدًا عدد الوحدات الكسري. `round(2)` أعلاه يقرّب المتوسطات أولًا. لماذا يعد تقريب قيم *العرض* المستقلة، لا التجميع الأساسي، خيار إعداد تقارير أسلم عادةً؟

## الخطوة 5: جمّع التقرير

الخطوة الأخيرة هي المكافأة: شغّل الرسوم الأربعة كلها والجدول في ملف تقرير واحد — مكتملًا بختم زمن مولّد ونطاق التواريخ المغطى — فيستطيع مدير فتح مجلد واحد ورؤية القصة كلها.

### 5.1 ولّد مجلد التقرير

**👟 تلميح البداية :** دع المجمّع ينشئ مجلد مخرجه الخاص، ويعيد توليد كل قطعة أركان فيه، ويكتب تقريرًا نصيًّا يذكر كل رسم باسمه.

```python
# report.py (continued)
from datetime import datetime

def generate_report(df: pd.DataFrame, output_dir: str = "report"):
    """Generate a complete report with charts and tables."""
    os.makedirs(output_dir, exist_ok=True)

    chart_revenue_by_category(df, f"{output_dir}/chart_bar.png")
    chart_revenue_trend(df, f"{output_dir}/chart_line.png")
    chart_category_distribution(df, f"{output_dir}/chart_pie.png")
    chart_price_vs_units(df, f"{output_dir}/chart_scatter.png")

    table = format_summary_table(df)

    report_lines = [
        "=" * 65,
        "  SALES REPORT",
        f"  Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        f"  Period: {df['date'].min().strftime('%Y-%m-%d')} to {df['date'].max().strftime('%Y-%m-%d')}",
        "=" * 65,
        "",
        "  SUMMARY",
        "  " + "-" * 40,
        f"  Total Revenue:     ${df['revenue'].sum():>12,.2f}",
        f"  Average Sale:      ${df['revenue'].mean():>12,.2f}",
        f"  Total Units Sold:  {df['units_sold'].sum():>12,}",
        f"  Transactions:      {len(df):>12,}",
        "",
        "  REVENUE BY CATEGORY",
        "  " + "-" * 40,
        table,
        "",
        "  CHARTS",
        "  " + "-" * 40,
        "  chart_bar.png     - Revenue by category (bar chart)",
        "  chart_line.png    - Daily revenue trend (line chart)",
        "  chart_pie.png     - Units distribution (pie chart)",
        "  chart_scatter.png - Revenue vs units (scatter chart)",
        "",
        "=" * 65,
    ]

    report_text = "\n".join(report_lines)
    report_path = f"{output_dir}/report.txt"
    with open(report_path, "w") as f:
        f.write(report_text)

    print(f"\nReport generated in {output_dir}/")
    print(report_text)

generate_report(df)
```

خيارا تصميم جعلا هذا أداة تقارير حقيقية لا عرضًا توضيحيًّا. إنه *قابل لإعادة التوليد*: يعيد المجمّع بناء كل قطة في مجلدها الخاص، فينتج نفس الأمر على بيانات محدّثة تقريرًا محدّثًا، ويحتوي المجلد دائمًا على المجموعة الحالية بالضبط. يحمل *بيانات وصفية*: يختم `datetime.now()` متى ركض، ويسجل `df['date'].min() ... max()` الفترة المغطاة، فيستطيع قارئ (أو مستلم بريد) أن يتبين هل التقرير حالي أم قديم بلمحة. كل دالة بناها هذا المشروع مجمَّعة الآن في مكان واحد — خط أنابيب الخطوة 1→4 كاملًا، يُستدعى باستدعاء واحد.

**🎯 الناتج المتوقع :** مجلد `report/` يحتوي `report.txt` وملفات PNG الأربعة. يفتتح التقرير النصي بترويسة مختومة زمنيًّا، وإحصائيات ملخص، والجدول المحاذي للفئات، وقائمة أصول الرسوم.

**🩹 إذا لم يعمل :** إذا طبعت الترويسة `Period: NaT to NaT`، فالتواريخ لم تُحلل عند الحمل (`parse_dates` من الخطوة 1 مفقود). إذا غابت رسوم من المجلد، ففشلت إحدى دالات الرسوم الأربع قبل الحفظ — شغّل "إذا لم يعمل" الخاصة بكل دالة مستقلة. إذا رفض نظام بريد `report.txt` بحروف غريبة، فتحقق هل أدخلت f-string حقلًا ضالًّا؛ يجب أن تكون إعادة التشغيل ذرّية.

### 5.2 تحقّق من التقرير المجمَّع

**✅ قائمة التحقق**

- ✅ يحتوي `report/` على `report.txt` وملفات PNG الأربعة كلها.
- ✅ سطر `Period:` في التقرير يطابق نطاق التواريخ الحقيقي في `df`.
- ✅ إعادة تشغيل `generate_report(df)` تستبدل المجلد بنظافة بالأصول الحالية.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يكتب التقرير الرسوم والنص *معًا* في كل تشغيل. ماذا يترك تشغيل مكسور — لنقل استثناء في منتصف قسم الرسوم — على القرص، وما التغييران الصغيران (مجلد مؤقت + إعادة تسمية، أو try/finally) اللذان يجعلان إعادة التوليد ذرّية؟
- الختم الزمني هو إشارة نضارة التقرير. إذا ركض التقرير على جدول كل اثنين، فهل يخبر `Generated:` وحده قارئًا بما إذا كانت *البيانات* حالية؟ ما الحقل الثاني الذي تضيفه لتفصل بين "متى صُنع التقرير" و"كم عمر البيانات"؟

## ⚠️ مآزق شائعة

- **ترتيب استيراد `Agg`.** يجب أن يُنفَّذ `matplotlib.use("Agg")` *قبل* `import matplotlib.pyplot as plt`، أو يفوز محتوى GUI وتتحطم تشغيلات بلا رأس بخطأ "لا شاشة". الإصلاح: أبقِ سطر `use` فعلًا فوق استيراد pyplot — كتلة الاستيراد في الملف تفعل ذلك عمدًا.
- **تواريخ غير محللة.** دون `parse_dates=["date"]`، يبقى عمود التاريخ سلاسل، لذا يفرز `df['date'].min()` نصيًّا وتضع الرسوم الخطية علّامات غريبة على المحور. الإصلاح: حلل عند الحمل (الخطوة 1) وتأكد بـ`df.dtypes`.
- **تشغيل الرسوم دون شاشة.** المحتوى `Agg` يصيّر إلى ملفات — هذا سبب تشغيله كله هنا. الإصلاح: لا تزل سطر `use` أبدًا لهذا المشروع؛ الرسوم تُحفظ لا تُعرض.
- **جداول مختلة المحاذاة.** خلط عروض الترويسة وعروض الجسم يكسر محاذاة الأعمدة بصمت. الإصلاح: أبقِ سلاسل التنسيق متطابقة للترويسة وصفوف البيانات، ودع صف `TOTAL` يعيد استخدامها.
- **أعمدة زائدة من فهرس.** كتابة `df.to_csv(...)` دون `index=False` تكتب عمود فهرس غير مسمّى يُحمَل مجددًا كضجيج. الإصلاح: مرّر دائمًا `index=False`، كما يفعل المولّد.

## ما بنيته للتو

مولّد تقارير يأخذ CSV مبيعات خامًا وينتج حزمة كاملة: DataFrame مُنظَّف، وأربعة أنواع رسوم مقصودة، وجدول ملخص جاهز للنشر، وملف تقرير مختوم زمنيًّا يسمّي كل أصل. المهارة القابلة للنقل هي *حلقة البيانات-إلى-مخرج* — الحمل، والتجميع، والتصوير، والتجميع — وهي الهيكل المتطابق خلف لوحات المعلومات والملخصات التنفيذية وأي أتمتة "أرسل لي أرقام هذا الأسبوع" ستصادفها في وظيفة.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/report-builder/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/report-builder) في مستودع المساق يشحن المجمّع الكامل مضموًما إليه تصدير PDF قائم على `reportlab` وتصفية نطاق تواريخ. استنسخه، أو افتح المستودع كله في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وشغّله من هناك.
:::

## إلى أين تذهب من هنا

- أضف **تصدير PDF** بـ`reportlab` — الملخص في الصفحة الأولى ورسم واحد لكل صفحة. التلميح الصغير: `uv add reportlab` و`from reportlab.platypus import SimpleDocTemplate, Paragraph, Image` يغطيان ~90% مما تحتاج.
- امنح `generate_report` **تصفية تواريخ** — اقبل `start_date`/`end_date` واقطع `df` قبل الرسم، فتنتج دالة واحدة تقارير أسبوعية أو شهرية أو ربع سنوية من نفس المصدر.
- أضف قسم **ربع-مقابل-ربع**: جمّع الإيرادات في ربعين واطبع نسبة النمو زائد سهم أعلى/أسفل — إضافة من ستة أسطر لأخ `format_summary_table`.
- جدوله بحزمة `schedule` ليقوم `generate_report(df)` يوم الاثنين بتشغيل نفسه — ثم انقل مسار التقرير النصي إلى بريد عبر `smtplib` وستكون قد بنيت خط"الإبلاغ التلقائي لأصحاب المصلحة" الكلاسيكي.

## شارك مشروعك مع الصف

بنيت شيئًا تفتخر به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع قدّمها طلاب آخرون — وREADME الخاص به يحتوي إرشادًا كاملًا صديقًا للمبتدئين لإضافة مشروعك عبر **طلب سحب**، حتى لو لم تستخدم git من قبل: انتبه لشوكة المستودع، وأنشئ فرعًا، والتزم ملفاتك، وافتح الـPR، خطوة خطوة. لا خبرة git مسبقة مفترضة.

مرحبًا بك في تحويل الجداول إلى قصص. 🎓