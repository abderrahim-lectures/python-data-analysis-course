---
title: "مستكشف التصور البصري للبيانات"
description: "أنشئ رسومًا بيانية ولوحات تحكم تفاعلية بـmatplotlib وseaborn وplotly."
difficulty: "beginner"
estimatedMinutes: 50
xpReward: 50
tags: ["matplotlib", "seaborn", "plotly", "data-visualization", "pandas"]
prerequisites:
  - "أساسيات بايثون (متغيرات، حلقات، دوال)"
  - "أساسيات pandas (DataFrames، groupby)"
  - "أساسيات matplotlib"
learningObjectives:
  - "إنشاء رسوم بيانية شريطية وخطية ونقاط مبعثرة بـmatplotlib"
  - "بناء تصورات إحصائية بـseaborn"
  - "إنشاء رسوم تفاعلية بـplotly"
  - "تخصيص أنماط الرسوم والموضوعات اللونية"
  - "دمج عدة رسوم في لوحات تحكم"
---

# 📊 مستكشف التصور البصري للبيانات

الأرقام المدفونة في الجداول يصعب العمل عليها. الرسوم البيانية تجعل الأنماط والقيم الشاذة والاتجاهات تقفز أمامك فورًا. يأخذك هذا المشروع من الرسوم الأساسية بـmatplotlib مرورًا بالتصورات الإحصائية بـseaborn وصولًا إلى لوحات التحكم التفاعلية بـplotly ، فتبني مجموعة أدوات يمكنك إعادة استخدامها على أي مجموعة بيانات تقابلها.

هذا المشروع اختياري وغير مُقيَّم. راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة.

## ما الذي ستفعله

1. إنشاء رسوم بيانية شريطية وخطية ونقاط مبعثرة بـmatplotlib
2. بناء تصورات إحصائية بـseaborn (مخططات الصندوق، خرائط الحرارة، مخططات الأزواج)
3. إنشاء رسوم HTML تفاعلية بـplotly
4. تخصيص نمط الرسوم والموضوعات اللونية والطباعة
5. دمج عدة رسوم في لوحات تحكم متعددة الأجزاء
6. تصدير الرسوم كملفات PNG وHTML تفاعلية

## أين تُشغّل هذا

- **محليًا عبر `uv` (موصى به).** يستخدم هذا المشروع `matplotlib` و`seaborn` و`plotly`، لذا فإن التثبيت المحلي هو المسار الأسهل. يشرح قسم الإعداد أدناه ذلك خطوة بخطوة.
- **مكتبة JupyterLite التفاعلية.** الصق خلايا الكود مباشرة في دفتر ملاحظات ، تعمل جيدًا لاستكشاف خطوات التحليل (1–5)، وإن كانت لوحة التحكم (الخطوة 5) تستفيد من طرفية حقيقية لحفظ الملفات.
- **Google Colab.** افتح دفترًا جديدًا والصق الخلايا. نفس التحفظ كما في JupyterLite: حفظ الملفات يعمل أفضل في طرفية حقيقية.

- **شغّله في المتصفح.** هناك دفتر ملاحظات تفاعلي جاهز ، افتحه على Colab أو Kaggle أو Binder وتابع خطوة بخطوة.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-visualization/notebook.ar.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-visualization/notebook.ar.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdata-visualization%2Fnotebook.ar.ipynb)

## الإعداد

`uv` أداة واحدة تحل محل سلسلة "ثبّت بايثون، ثم pip، ثم بيئة افتراضية" المعتادة ، إذ يمكنها تثبيت Python وإدارة إصداراته إلى جانب تبعيات مشروعك.

**macOS / Linux** (الطرفية):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

أغلق طرفيتك وأعد فتحها، ثم تأكد من نجاح التثبيت:

```bash
uv --version
```

ثم جهّز المشروع:

```bash
uv init data-viz
cd data-viz
uv add matplotlib seaborn plotly pandas
```

`pandas` تحمّل بياناتك وتحوّلها. `matplotlib` هي الأساس الذي يبني عليه seaborn وغيره. `seaborn` يضيف رسومًا إحصائية فوق matplotlib. `plotly` ينشئ رسوم HTML تفاعلية يمكنك فتحها في متصفح.

## الخطوة 1: أنشئ بيانات نموذجية وحمّلها

ابنِ ملف CSV ببيانات مبيعات متعددة الفئات، ثم حمّله في DataFrame. تستخدم كل خطوة لاحقة مجموعة البيانات نفسها ، متنوعة بما يكفي لإظهار أنواع رسوم مختلفة، وصغيرة بما يكفي لقراءتها يدويًا.

### 1.1 اكتب ملف CSV وحمّله

**👟 تلميح للمبتدئين:** عرّف سلسلة نصية متعددة الأسطر بأعمدة `month` و`category` و`region` و`units` و`revenue` و`cost`. اكتبها على القرص، ثم أعد قراءتها عبر `pd.read_csv`. اطبع الشكل وأول بضعة صفوف للتأكد من نجاح التحميل.

```python
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px

csv_data = """month,category,region,units,revenue,cost
2026-01,Electronics,North,120,54000,32000
2026-01,Clothing,South,95,14250,8500
2026-01,Electronics,South,80,36000,21000
2026-02,Electronics,North,135,60750,36000
2026-02,Clothing,North,110,16500,9900
2026-02,Home,South,70,21000,13000
2026-03,Electronics,North,150,67500,40000
2026-03,Clothing,South,125,18750,11250
2026-03,Home,North,95,28500,17000
2026-04,Electronics,South,140,63000,37000
2026-04,Clothing,North,160,24000,14400
2026-04,Home,South,100,30000,18000
2026-05,Electronics,North,170,76500,45000
2026-05,Clothing,South,130,19500,11700
2026-05,Home,North,115,34500,20000
2026-06,Electronics,South,155,69750,41000
2026-06,Clothing,North,145,21750,13050
2026-06,Home,South,120,36000,21600"""

with open("sales.csv", "w") as f:
    f.write(csv_data.strip())

df = pd.read_csv("sales.csv")
print(f"Shape: {df.shape}")
print(f"\nColumn types:\n{df.dtypes}")
print(f"\nFirst 5 rows:\n{df.head()}")
print(f"\nBasic stats:\n{df.describe()}")
```

**🎯 الناتج المتوقع:**

```
Shape: (18, 6)

Column types:
month      object
category   object
region     object
units       int64
revenue     int64
cost        int64

First 5 rows:
    month     category region  units  revenue   cost
0  2026-01  Electronics  North    120    54000  32000
1  2026-01    Clothing   South     95    14250   8500
2  2026-01  Electronics  South     80    36000  21000
3  2026-02  Electronics  North    135    60750  36000
4  2026-02    Clothing   North    110    16500   9900

Basic stats:
            units        revenue          cost
count   18.000000      18.000000     18.000000
mean   123.888889   41083.333333  24227.777778
...
```

**🩹 إذا كان هناك خلل:** إذا حصلت على `FileNotFoundError` فدليل العمل لديك خاطئ ، شغّل `pwd` للتحقق. إذا أظهر الشكل `(0, 6)` فسلسلة CSV لديها مشكلة في علامات الاقتباس ، تأكد من عدم وجود اقتباسات عائمة داخل صفوف البيانات. إذا أظهر `units` نوع `float64` بدل `int64` فربما تحتوي إحدى قيمك على فاصلة عشرية.

### 1.2 تحقق من أن البيانات حمُّلت صحيحة

**✅ قائمة فحص**

- ✅ `df.shape` هو `(18, 6)` ، 18 صفًا و6 أعمدة.
- ✅ تظهر أسماء الأعمدة الستة جميعًا: `month`، `category`، `region`، `units`، `revenue`، `cost`.
- ✅ يُظهر `df.dtypes` ثلاثة أعمدة نصية (object) وثلاثة أعمدة رقمية (int64).
- ✅ يُنتج `df.describe()` إحصاءات للأعمدة الرقمية دون أخطاء.

**🤔 أسئلة سقراطية**

لماذا تخزَّن `month` كنص (`"2026-01"`) بدلًا من كائن datetime؟ ما الميزة التي يمنحها الشكل النصي لعمليات groupby، وما العيب الذي يسببه للتخطيط الزمني للسلاسل الزمنية؟

---

## الخطوة 2: رسوم أساسية بـmatplotlib

matplotlib هو الأساس ، كل مكتبة تصور بصرية أخرى بلغة بايثون تلفّه أو تحاكي واجهته. أتقن أنواع الرسوم الأربعة الأساسية هنا: الشريطي، والخطي، والمبعثر، والدائري.

### 2.1 الرسم الشريطي: الإيراد حسب الفئة

**👟 تلميح للمبتدئين:** جمّع حسب `category` واجمع `revenue`، ثم ارسم بـ`ax.bar()`. أضف تسميات قيم فوق كل شريط باستخدام `ax.text()`. أزل المحاور العلوية واليمنى لمظهر أنظف.

```python
category_revenue = df.groupby("category")["revenue"].sum()

fig, ax = plt.subplots(figsize=(8, 5))
colors = ["#2196F3", "#FF9800", "#4CAF50"]
bars = ax.bar(category_revenue.index, category_revenue.values, color=colors, edgecolor="white")

for bar in bars:
    height = bar.get_height()
    ax.text(bar.get_x() + bar.get_width() / 2.0, height, f"${height:,.0f}",
            ha="center", va="bottom", fontweight="bold")

ax.set_title("Total Revenue by Category", fontsize=14, fontweight="bold")
ax.set_ylabel("Revenue ($)")
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f"${x:,.0f}"))
ax.spines[["top", "right"]].set_visible(False)
plt.tight_layout()
plt.savefig("revenue_by_category.png", dpi=150)
plt.show()
print("Saved: revenue_by_category.png")
```

**🎯 الناتج المتوقع:** رسم شريطي بثلاثة أشرطة (Clothing, Electronics, Home). Electronics أطولها بحوالي 367,500$. تظهر المبالغ بالدولار فوق كل شريط. يُحفظ ملف `revenue_by_category.png` على القرص.

**🩹 إذا كان هناك خلل:** إذا بدت الأشرطة مضغوطة فكبّر `figsize` إلى `(10, 6)`. إذا تداخلت تسميات الدولار مع الأشرطة فتأكد من ضبط `va="bottom"` ، فهذا يدفع النص إلى أعلى الشريط. إذا أطلق `tight_layout()` تحذيرًا فهذا يعني أن رسومك الفرعية لها أحجام ثابتة لا يمكن تعديلها ، أمر طبيعي، والتحذير آمن تجاهله.

### 2.2 الرسم الخطي: اتجاه الإيراد الشهري

**👟 تلميح للمبتدئين:** جمّع حسب `month` واجمع `revenue`. استخدم `ax.plot()` مع `marker="o"` لإظهار نقاط البيانات. أضف منطقة مظللة بـ`ax.fill_between()` لإبراز الفجوة بين الإيراد والتكلفة.

```python
monthly = df.groupby("month")[["revenue", "cost"]].sum().sort_index()

fig, ax = plt.subplots(figsize=(10, 5))
ax.plot(monthly.index, monthly["revenue"], marker="o", linewidth=2, label="Revenue", color="#4CAF50")
ax.plot(monthly.index, monthly["cost"], marker="s", linewidth=2, label="Cost", color="#F44336")
ax.fill_between(monthly.index, monthly["revenue"], monthly["cost"], alpha=0.1, color="#4CAF50")

ax.set_title("Monthly Revenue vs. Cost", fontsize=14, fontweight="bold")
ax.set_ylabel("Amount ($)")
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f"${x:,.0f}"))
ax.legend()
ax.grid(axis="y", alpha=0.3)
ax.spines[["top", "right"]].set_visible(False)
plt.tight_layout()
plt.savefig("monthly_trend.png", dpi=150)
plt.show()
print("Saved: monthly_trend.png")
```

**🎯 الناتج المتوقع:** خطّان ، أخضر للإيراد وأحمر للتكلفة ، مع فجوة مظللة بينهما تمثل الربح. يبقى الإيراد فوق التكلفة في كل شهر. يُحفظ ملف `monthly_trend.png`.

**🩹 إذا كان هناك خلل:** إذا بدت الخطوط متعرجة أو خارجة عن الترتيب فعمود `month` لديك غير مرتب ، أضف `.sort_index()` بعد groupby. إذا امتلأت المنطقة المظللة في المكان الخاطئ فتأكد أن `fill_between` يستخدم `monthly["revenue"]` أولًا و`monthly["cost"]` ثانيًا ، فالترتيب يحدد أي الخطين هو الحد العلوي.

### 2.3 الرسم المبعثر: الإيراد مقابل التكلفة

**👟 تلميح للمبتدئين:** ارسم كل فئة كسلسلة منفصلة عبر `ax.scatter()` بألوان مختلفة. أضف خط التعادل القطري بـ`ax.plot()` حيث يتساوى الإيراد مع التكلفة.

```python
cat_colors = {"Electronics": "#2196F3", "Clothing": "#FF9800", "Home": "#4CAF50"}

fig, ax = plt.subplots(figsize=(8, 6))
for category in df["category"].unique():
    subset = df[df["category"] == category]
    ax.scatter(subset["cost"], subset["revenue"], s=100, alpha=0.8,
               label=category, color=cat_colors[category], edgecolors="white")

max_val = max(df["revenue"].max(), df["cost"].max())
ax.plot([0, max_val], [0, max_val], linestyle="--", color="gray", alpha=0.5, label="Break-even")

ax.set_title("Revenue vs. Cost by Category", fontsize=14, fontweight="bold")
ax.set_xlabel("Cost ($)")
ax.set_ylabel("Revenue ($)")
ax.legend()
ax.spines[["top", "right"]].set_visible(False)
plt.tight_layout()
plt.savefig("revenue_vs_cost.png", dpi=150)
plt.show()
```

**🎯 الناتج المتوقع:** نقاط ملونة تتجمع فوق خط التعادل المتقطع ، أي أن كل سجل مربح. تبتعد نقاط Electronics عن الخط أبعد مسافة (أعلى هوامش). يُحفظ ملف `revenue_vs_cost.png`.

**🩹 إذا كان هناك خلل:** إذا تداخلت النقاط بشدة فزد `alpha` إلى `0.6` لمزيد من الشفافية أو زد `s` إلى `150` لنقاط أكبر. إذا لم يظهر خط التعادل قطريًا فللمحورين x وy مقياسان مختلفان ، استدعِ `ax.set_aspect("equal")` لإصلاح ذلك، وإن كان قد يضغط أحد المحورين.

### 2.4 الرسم الدائري: حصة الفئة

**👟 تلميح للمبتدئين:** جمّع حسب `category` واجمع `revenue`، ثم استخدم `ax.pie()` مع `autopct` لتسميات النسب المئوية و`startangle` لدوران نظيف.

```python
cat_share = df.groupby("category")["revenue"].sum()

fig, ax = plt.subplots(figsize=(7, 7))
wedges, texts, autotexts = ax.pie(
    cat_share, labels=cat_share.index, autopct="%1.1f%%",
    startangle=90, colors=["#2196F3", "#FF9800", "#4CAF50"],
    textprops={"fontsize": 12}
)
for autotext in autotexts:
    autotext.set_fontweight("bold")

ax.set_title("Revenue Share by Category", fontsize=14, fontweight="bold")
plt.tight_layout()
plt.savefig("category_share.png", dpi=150)
plt.show()
```

**🎯 الناتج المتوقع:** رسم دائري مقسوم إلى ثلاث شرائح مع تسميات نسب مئوية. تهيمن Electronics بحوالي 56% وClothing حوالي 19% وHome حوالي 25%.

**🩹 إذا كان هناك خلل:** إذا تداخلت التسميات الدائرية فكبّر `figsize` إلى `(9, 9)`. إذا تجاوز مجموع النسب 100% فلم تجمع `groupby` بشكل صحيح ، تأكد أنك استدعيت `.sum()` وليس `.count()`.

**✅ قائمة فحص**

- ✅ تولَّد أربعة أنواع رسوم: الشريطي والخطي والمبعثر والدائري.
- ✅ لكل رسم عنوان واضح وتسميات محاور (حيثما ينطبق) ومفتاح (Legend) (حيثما ينطبق).
- ✅ حُفظت ملفات PNG الأربعة على القرص وغير فارغة.
- ✅ لا نصوص متداخلة ولا تسميات مقصوصة ولا نقاط بيانات مفقودة.

**🤔 أسئلة سقراطية**

متى يكون الرسم الشريطي أكثر إفادة من الدائري لنفس البيانات؟ ماذا يحدث للرسم الدائري إذا كان لديك عشر فئات بدلًا من ثلاث ، هل ما زلت تستطيع قراءة الشرائح الأصغر؟

---

## الخطوة 3: رسوم إحصائية بـseaborn

يبني seaborn على matplotlib ليمنحك تصورات إحصائية بنداءات سطر واحد. تُظهر مخططات الصندوق التوزيعات. تكشف خرائط الحرارة الارتباطات. تُظهر مخططات الأزواج العلاقات عبر كل متغير دفعة واحدة.

### 3.1 مخطط الصندوق: توزيع الإيراد حسب الفئة

**👟 تلميح للمبتدئين:** استخدم `sns.boxplot()` مع `x="category"` و`y="revenue"`. عيّن سمة seaborn أولًا عبر `sns.set_theme()` لتناسق التنسيق.

```python
sns.set_theme(style="whitegrid")

fig, ax = plt.subplots(figsize=(8, 5))
sns.boxplot(data=df, x="category", y="revenue", palette="Set2", ax=ax)
ax.set_title("Revenue Distribution by Category", fontsize=14, fontweight="bold")
ax.set_xlabel("Category")
ax.set_ylabel("Revenue ($)")
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f"${x:,.0f}"))
plt.tight_layout()
plt.savefig("revenue_boxplot.png", dpi=150)
plt.show()
print("Saved: revenue_boxplot.png")
```

**🎯 الناتج المتوقع:** ثلاثة مخططات صندوق-وشارب جنبًا إلى جنب. Electronics لديها أوسع انتشار (أعلى تباين). يوضح الخط الوسيط داخل كل صندوق الإيراد النموذجي لكل سجل. يُحفظ ملف `revenue_boxplot.png`.

**🩹 إذا كان هناك خلل:** إذا بدت الصناديق الثلاثة متطابقة فقد تحتوي بياناتك على صفوف مكررة ، عُد إلى الخطوة 1 وتحقق. إذا انزاحت الصناديق عن المركز فربما لم يُشغَّل `sns.set_theme(style="whitegrid")` قبل الرسم ، استدعه مرة أخرى قبل الشكل مباشرة.

### 3.2 خريطة الحرارة: مصفوفة الارتباط

**👟 تلميح للمبتدئين:** اختر الأعمدة الرقمية فقط، واحسب `.corr()`، ثم مرّر النتيجة إلى `sns.heatmap()`. استخدم `annot=True` لإظهار قيم الارتباط داخل كل خلية و`cmap="RdYlGn"` لمقياس أحمر-أصفر-أخضر.

```python
numeric_cols = df[["units", "revenue", "cost"]]
corr = numeric_cols.corr()

fig, ax = plt.subplots(figsize=(6, 5))
sns.heatmap(corr, annot=True, cmap="RdYlGn", vmin=-1, vmax=1,
            center=0, fmt=".2f", linewidths=0.5, ax=ax)
ax.set_title("Correlation Matrix", fontsize=14, fontweight="bold")
plt.tight_layout()
plt.savefig("correlation_heatmap.png", dpi=150)
plt.show()
print("Saved: correlation_heatmap.png")
```

**🎯 الناتج المتوقع:** شبكة ملونة حيث يُظهر `revenue` و`cost` ارتباطًا إيجابيًا قويًا (قريبًا من 1.0 ، التكلفة الأعلى تعني إيرادًا أعلى). يرتبط `units` بكليهما لكن بشكل أقل قوة. يُحفظ ملف `correlation_heatmap.png`.

**🩹 إذا كان هناك خلل:** إذا كانت خريطة الحرارة بلون واحد فمدى `vmin`/`vmax` أوسع مما يناسب قيم الارتباط الفعلية ، جرب `vmin=corr.values.min() - 0.1` و`vmax=corr.values.max() + 0.1`. إذا حصلت على `ValueError: correlation matrix is not symmetric` فقد مررت DataFrame الخام بدل نتيجة `.corr()`.

### 3.3 مخطط الأزواج: كل العلاقات الرقمية

**👟 تلميح للمبتدئين:** استخدم `sns.pairplot()` مع `hue="category"` لتلوين النقاط حسب الفئة. ينتج هذا مصفوفة من الرسوم المبعثرة لكل زوج من الأعمدة الرقمية، مع رسوم بيانية على القطر.

```python
pair = sns.pairplot(df, hue="category", palette="Set2", diag_kind="kde",
                    plot_kws={"alpha": 0.7, "s": 80})
pair.figure.suptitle("Pair Plot — All Numeric Relationships", y=1.02, fontsize=14, fontweight="bold")
pair.savefig("pair_plot.png", dpi=150, bbox_inches="tight")
plt.show()
print("Saved: pair_plot.png")
```

**🎯 الناتج المتوقع:** شبكة 3×3 من الرسوم. الخلايا خارج القطر رسوم مبعثرة تُظهر كيف ترتبط `units` و`revenue` و`cost` معًا. الخلايا القطرية منحنيات كثافة (KDE) تُظهر توزيع كل متغير، ملوّنة حسب الفئة. يُحفظ ملف `pair_plot.png`.

**🩹 إذا كان هناك خلل:** إذا كان مخطط الأزواج ضخمًا ويصعب قراءته فبياناتك تحتوي أعمدة رقمية كثيرة جدًا ، اقتصره على 3–4 أعمدة بـ`df[["units", "revenue", "cost"]]` قبل تمريره إلى `pairplot`. إذا لم تتطابق الألوان عبر الرسوم الفرعية فتأكد من ضبط `hue="category"` ، بدونه تكون كل النقاط بلون واحد.

**✅ قائمة فحص**

- ✅ يُظهر مخطط الصندوق ثلاثة توزيعات مميزة بوسيطات وانتشارات مختلفة.
- ✅ تحتوي خريطة الحرارة خلايا مشروحة بقيم ارتباط بين -1 و1.
- ✅ يُظهر مخطط الأزواج رسومًا مبعثرة خارج القطر ومنحنيات كثافة على القطر.
- ✅ حُفظت ملفات seaborn الثلاثة على القرص.

**🤔 أسئلة سقراطية**

تظهر مصفوفة الارتباط أن `revenue` و`cost` مرتبطان بشدة. هل يعني الارتباط السببية هنا ، هل الإنفاق الأعلى *يسبب* إيرادًا أعلى، أم يوجد تفسير أبسط؟

---

## الخطوة 4: رسوم تفاعلية بـplotly

ملفات PNG الثابتة ممتازة للتقارير، لكن plotly يولّد رسوم HTML تفاعلية يمكنك تكبيرها وتحريك المؤشر فوقها والتنقل داخلها في متصفح. هنا تبدأ تصوراتك بالشعور كأنها لوحات تحكم حقيقية.

### 4.1 الرسم الشريطي التفاعلي

**👟 تلميح للمبتدئين:** استخدم `px.bar()` مع وسائط `x` و`y` و`color`. اضبط `barmode="group"` لوضع الأشرطة جنبًا إلى جنب بدل تكديسها. صدّر إلى HTML عبر `fig.write_html()`.

```python
monthly_cat = df.groupby(["month", "category"])["revenue"].sum().reset_index()

fig = px.bar(monthly_cat, x="month", y="revenue", color="category",
             barmode="group", title="Monthly Revenue by Category",
             labels={"revenue": "Revenue ($)", "month": "Month"},
             color_discrete_map={"Electronics": "#2196F3", "Clothing": "#FF9800", "Home": "#4CAF50"})
fig.update_layout(yaxis_tickformat="$,.0f", xaxis_title="Month", yaxis_title="Revenue ($)")
fig.show()
fig.write_html("interactive_bar.html")
print("Saved: interactive_bar.html")
```

**🎯 الناتج المتوقع:** تنفتح نافذة متصفح (أو خلية دفتر) برسم شريطي مجمّع. حرّك المؤشر فوق أي شريط لترى الشهر والفئة ومبلغ الإيراد بدقة. كبّر بالسحب والنقر. يُحفظ ملف `interactive_bar.html` ، افتحه في أي متصفح.

**🩹 إذا كان هناك خلل:** إذا تكدست الأشرطة بدل التجمع فنسيت `barmode="group"` ، الافتراضي هو `"relative"` الذي يكدس. إذا فُتح ملف HTML ولم يُعرض شيئًا فقد يحجب متصفحك JavaScript للملفات المحلية ، جرب فتحه من خادم محلي أو استخدام `fig.show()` في دفتر بدل ذلك.

### 4.2 الرسم المبعثر التفاعلي

**👟 تلميح للمبتدئين:** استخدم `px.scatter()` مع `x` و`y` و`color` و`size` لتشفير أربعة أبعاد دفعة واحدة ، التكلفة على x والإيراد على y والفئة كلون و`units` حجمًا للنقطة.

```python
fig = px.scatter(df, x="cost", y="revenue", color="category", size="units",
                 hover_data=["month", "region"],
                 title="Revenue vs. Cost (dot size = units sold)",
                 labels={"cost": "Cost ($)", "revenue": "Revenue ($)", "units": "Units Sold"},
                 color_discrete_map={"Electronics": "#2196F3", "Clothing": "#FF9800", "Home": "#4CAF50"})
fig.update_layout(xaxis_tickformat="$,.0f", yaxis_tickformat="$,.0f")
fig.show()
fig.write_html("interactive_scatter.html")
print("Saved: interactive_scatter.html")
```

**🎯 الناتج المتوقع:** نقاط ملونة بأحجام متفاوتة. النقط الأكبر تعني عدد وحدات أكثر. حرّك المؤشر فوق أي نقطة لترى الشهر والمنطقة والتكلفة والإيراد والوحدات. يُحفظ ملف `interactive_scatter.html`.

**🩹 إذا كان هناك خلل:** إذا كانت كل النقاط بنفس الحجم فلن يُطبَّق `size="units"` ، تأكد أن `units` رقمي وليس نصًا. إذا أظهرت بيانات التمرير `NaN` فاسم العمود به خطأ إملائي أو أن العمود غير موجود.

### 4.3 الرسم الخطي التفاعلي مع منزلق المدى

**👟 تلميح للمبتدئين:** استخدم `px.line()` للرسم الأساسي، ثم أضف `fig.update_xaxes(rangeslider_visible=True)` لمنزلق مدى زمني قابل للسحب أسفل الرسم.

```python
monthly_total = df.groupby("month")[["revenue", "cost"]].sum().reset_index()

fig = px.line(monthly_total, x="month", y=["revenue", "cost"],
              title="Revenue vs. Cost Over Time (drag to zoom)",
              labels={"value": "Amount ($)", "month": "Month", "variable": "Metric"})
fig.update_layout(yaxis_tickformat="$,.0f", legend_title_text="")
fig.update_xaxes(rangeslider_visible=True)
fig.show()
fig.write_html("interactive_line.html")
print("Saved: interactive_line.html")
```

**🎯 الناتج المتوقع:** خطّان (إيراد وتكلفة) مع منزلق مدى قابل للسحب أسفلهما. أمسك بمقابض المنزلق لتكبير نطاق محدد من الشهور. يُحفظ ملف `interactive_line.html`.

**🩹 إذا كان هناك خلل:** إذا لم يظهر منزلق المدى فقد تستخدم إصدار plotly قديمًا ، شغّل `uv add --upgrade plotly`. إذا أظهر المفتاح `variable` كعنوان بدل مساحة فارغة فتأكد من ضبط `legend_title_text=""`.

**✅ قائمة فحص**

- ✅ تُعرض رسوم plotly الثلاثة في المتصفح مع تلميحات الظهور (hover tooltips).
- ✅ يجمع الرسم الشريطي الأشرطة جنبًا إلى جنب لا تكديسًا.
- ✅ يشفّر الرسم المبعثر أربعة أبعاد (x، y، اللون، الحجم).
- ✅ يحتوي الرسم الخطي على منزلق مدى يعمل.
- ✅ حُفظت ملفات HTML الثلاثة وتُفتح في متصفح.

**🤔 أسئلة سقراطية**

متى تختار رسم plotly تفاعليًا على PNG ثابت بـmatplotlib؟ ومتى تختار PNG الثابت بدلًا منه؟ فكّر في جمهورك ، من يرى الرسم، وكيف يستهلكه؟

---

## الخطوة 5: تخصيص الأنماط والموضوعات

تبدو الرسوم هاوية الأسلوب بألوان وخطوط افتراضية. ابنِ موضوعًا متناسقًا وطبّقه على كل رسم في المشروع.

### 5.1 عرّف لوحة ألوان مخصصة وإعدادات خط

**👟 تلميح للمبتدئين:** أنشئ قاموس أكواد ألوان سداسية ودالة تطبّق أسلوبًا متناسقًا على أي محور matplotlib. استخدم `plt.rcParams` لضبط أحجام خطوط عامة.

```python
THEME = {
    "primary": "#2563EB",
    "secondary": "#F59E0B",
    "accent": "#10B981",
    "danger": "#EF4444",
    "bg": "#F8FAFC",
    "text": "#1E293B",
    "grid": "#E2E8F0",
}

plt.rcParams.update({
    "figure.facecolor": THEME["bg"],
    "axes.facecolor": THEME["bg"],
    "axes.edgecolor": THEME["grid"],
    "axes.labelcolor": THEME["text"],
    "text.color": THEME["text"],
    "xtick.color": THEME["text"],
    "ytick.color": THEME["text"],
    "font.size": 11,
    "axes.titlesize": 14,
    "axes.titleweight": "bold",
    "axes.grid": True,
    "grid.alpha": 0.3,
    "grid.color": THEME["grid"],
})

CATEGORY_COLORS = {
    "Electronics": THEME["primary"],
    "Clothing": THEME["secondary"],
    "Home": THEME["accent"],
}

def style_ax(ax, title: str, xlabel: str = "", ylabel: str = "") -> None:
    ax.set_title(title)
    if xlabel:
        ax.set_xlabel(xlabel)
    if ylabel:
        ax.set_ylabel(ylabel)
    ax.spines[["top", "right"]].set_visible(False)
```

### 5.2 طبّق الموضوع على رسم

**👟 تلميح للمبتدئين:** استخدم `style_ax()` على أي كائن محاور لتطبيق تنسيق نظيف فورًا. تسري تغييرات `plt.rcParams` عالميًا من هذه النقطة فصاعدًا.

```python
category_revenue = df.groupby("category")["revenue"].sum()

fig, ax = plt.subplots(figsize=(8, 5))
colors = [CATEGORY_COLORS[cat] for cat in category_revenue.index]
bars = ax.bar(category_revenue.index, category_revenue.values, color=colors, edgecolor="white", linewidth=0.5)

for bar in bars:
    height = bar.get_height()
    ax.text(bar.get_x() + bar.get_width() / 2.0, height, f"${height:,.0f}",
            ha="center", va="bottom", fontweight="bold", fontsize=10)

style_ax(ax, "Revenue by Category", ylabel="Revenue ($)")
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f"${x:,.0f}"))
plt.tight_layout()
plt.savefig("themed_bar.png", dpi=150)
plt.show()
print("Saved: themed_bar.png")
```

**🎯 الناتج المتوقع:** نفس الرسم الشريطي من الخطوة 2، لكن الآن بخلفية رمادية فاتحة، دون محاور علوية/يمنى، وأحجام خطوط متناسقة، ولوحة الألوان المخصصة. يُحفظ ملف `themed_bar.png`.

**🩹 إذا كان هناك خلل:** إذا بقيت الخلفية بيضاء فلم يُستدعَ `plt.rcParams.update()` في هذه الجلسة ، أعد تشغيل كتلة الخطوة 5.1 بالكامل. إذا لم تتطابق الألوان مع الموضوع فأنت تستخدم قيمًا سداسية مكتوبة يدويًا بدل قاموس `CATEGORY_COLORS` ، استبدلها.

### 5.3 ابنِ سمة seaborn للرسوم الإحصائية

**👟 تلميح للمبتدئين:** استخدم `sns.set_theme()` مع `context="talk"` لخطوط أكبر و`style="whitegrid"` لشبكة نظيفة. ادمجه مع `palette` لخريطة ألوان متناسقة.

```python
sns.set_theme(style="whitegrid", context="talk", palette="Set2")

fig, axes = plt.subplots(1, 2, figsize=(14, 5))

sns.boxplot(data=df, x="category", y="revenue", ax=axes[0])
style_ax(axes[0], "Revenue Distribution", ylabel="Revenue ($)")

sns.violinplot(data=df, x="category", y="units", ax=axes[1])
style_ax(axes[1], "Units Sold Distribution", ylabel="Units")

plt.tight_layout()
plt.savefig("seaborn_styled.png", dpi=150)
plt.show()
print("Saved: seaborn_styled.png")
```

**🎯 الناتج المتوقع:** رسم صندوق وكمان جنبًا إلى جنب بسمة seaborn whitegrid. يُظهر رسم الكمان شكل كثافة التوزيع ، أوسع حيث تتجمع نقاط البيانات أكثر. يُحفظ ملف `seaborn_styled.png`.

**🩹 إذا كان هناك خلل:** إذا بدا رسم الكمان فارغًا أو منهارًا فقد يكون لدى بياناتك نقاط قليلة جدًا لتقدير كثافة النواة ، جرب `inner="quartile"` لإظهار خطوط الأرباع داخل الكمان، ما يجعل مجموعات البيانات الصغيرة أكثر قابلية للقراءة.

**✅ قائمة فحص**

- ✅ عُرّف قاموس `THEME` بستة مفاتيح ألوان.
- ✅ تنتج إعدادات `plt.rcParams` العامة تنسيقًا متناسقًا عبر كل الرسوم اللاحقة.
- ✅ تعمل `style_ax()` كأداة مساعدة قابلة لإعادة الاستخدام لأي محاور matplotlib.
- ✅ تتطابق رسوم seaborn الإحصائية مع الموضوع البصري العام.

**🤔 أسئلة سقراطية**

لماذا يجعل إزالة المحاور العلوية واليمنى (`spines[["top", "right"]].set_visible(False)`) الرسوم أكثر قراءة؟ ما المعلومات التي كانت هذه المحاور تنقلها فعلًا ، وهل استحقت الفوضى البصرية؟

---

## الخطوة 6: لوحات تحكم متعددة الأجزاء

تجمع لوحات التحكم في العالم الحقيقي أنواع رسوم متعددة في شكل واحد. استخدم `plt.subplots()` لترتيب الرسوم في شبكة.

### 6.1 ابنِ لوحة تحكم 2×2

**👟 تلميح للمبتدئين:** أنشئ شبكة رسوم فرعية 2×2 عبر `plt.subplots(2, 2, figsize=(14, 10))`. خصّص نوع رسم واحد لكل ربع: شريطي (أعلى-يسار)، خطي (أعلى-يمين)، مبعثر (أسفل-يسار)، دائري (أسفل-يمين).

```python
category_revenue = df.groupby("category")["revenue"].sum()
monthly = df.groupby("month")[["revenue", "cost"]].sum().sort_index()

fig, axes = plt.subplots(2, 2, figsize=(14, 10))
fig.suptitle("Sales Dashboard — H1 2026", fontsize=16, fontweight="bold", y=1.01)

# Top-left: Bar chart
colors = [CATEGORY_COLORS[cat] for cat in category_revenue.index]
axes[0, 0].bar(category_revenue.index, category_revenue.values, color=colors, edgecolor="white")
style_ax(axes[0, 0], "Revenue by Category", ylabel="Revenue ($)")
axes[0, 0].yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f"${x:,.0f}"))

# Top-right: Line chart
axes[0, 1].plot(monthly.index, monthly["revenue"], marker="o", linewidth=2, label="Revenue", color=THEME["primary"])
axes[0, 1].plot(monthly.index, monthly["cost"], marker="s", linewidth=2, label="Cost", color=THEME["danger"])
axes[0, 1].fill_between(monthly.index, monthly["revenue"], monthly["cost"], alpha=0.1, color=THEME["primary"])
style_ax(axes[0, 1], "Monthly Trend", ylabel="Amount ($)")
axes[0, 1].yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f"${x:,.0f}"))
axes[0, 1].legend()

# Bottom-left: Scatter plot
for category in df["category"].unique():
    subset = df[df["category"] == category]
    axes[1, 0].scatter(subset["cost"], subset["revenue"], s=80, alpha=0.8,
                        label=category, color=CATEGORY_COLORS[category], edgecolors="white")
max_val = max(df["revenue"].max(), df["cost"].max())
axes[1, 0].plot([0, max_val], [0, max_val], linestyle="--", color="gray", alpha=0.5)
style_ax(axes[1, 0], "Revenue vs. Cost", xlabel="Cost ($)", ylabel="Revenue ($)")
axes[1, 0].legend(fontsize=9)

# Bottom-right: Pie chart
wedges, texts, autotexts = axes[1, 1].pie(
    category_revenue, labels=category_revenue.index, autopct="%1.1f%%",
    startangle=90, colors=[CATEGORY_COLORS[cat] for cat in category_revenue.index]
)
for autotext in autotexts:
    autotext.set_fontweight("bold")
axes[1, 1].set_title("Revenue Share", fontsize=14, fontweight="bold")

plt.tight_layout()
plt.savefig("dashboard.png", dpi=150, bbox_inches="tight")
plt.show()
print("Saved: dashboard.png")
```

**🎯 الناتج المتوقع:** شكل واحد كبير بأربعة رسوم مرتبة في شبكة 2×2. الصف العلوي فيه رسم شريطي ورسم خطي. الصف السفلي فيه رسم مبعثر ورسم دائري. يُحفظ ملف `dashboard.png`.

**🩹 إذا كان هناك خلل:** إذا تداخلت الرسوم فاستُدعي `tight_layout()` قبل اكتمال إعداد كل المحاور ، انقله إلى النهاية تمامًا. إذا تداخل `suptitle` مع الرسوم العلوية فعدّل `y=1.02` لدفعه أعلى أو استخدم `plt.subplots_adjust(top=0.93)` بدل ذلك. إذا انضغط الرسم الدائري إلى شكل بيضاوي فأضف `axes[1, 1].set_aspect("equal")`.

### 6.2 ابنِ لوحة تحكم بأسلوب seaborn عبر FacetGrid

**👟 تلميح للمبتدئين:** استخدم `sns.FacetGrid()` لإنشاء شبكة مضاعفات صغيرة ، رسم مبعثر لكل منطقة، تتشارك المحاور نفسها للمقارنة المباشرة.

```python
g = sns.FacetGrid(df, col="region", hue="category", palette="Set2", height=4, aspect=1.2)
g.map(sns.scatterplot, "cost", "units", alpha=0.8, s=100, edgecolor="white")
g.add_legend(title="Category")
g.set_axis_labels("Cost ($)", "Units Sold")
g.figure.suptitle("Units vs. Cost by Region", fontsize=14, fontweight="bold", y=1.02)
g.savefig("facet_dashboard.png", dpi=150, bbox_inches="tight")
plt.show()
print("Saved: facet_dashboard.png")
```

**🎯 الناتج المتوقع:** رسمات مبعثرة جنبًا إلى جنب ، واحد لـ North وواحد لـ South ، بمقياس x/y نفسه لتسهيل المقارنة. تُلوَّن كل نقطة حسب الفئة. يُحفظ ملف `facet_dashboard.png`.

**🩹 إذا كان هناك خلل:** إذا كانت لأعمدة الوجه نطاقات محاور x مختلفة فغالبًا `sharex=True` و`sharey=True` غير مضبوطين ، وهما الافتراضيان لـ `FacetGrid`، لكن إذا تخطيت قيمتيهما فأزِل التخطي. إذا تداخل المفتاح مع لوحة من الأوجه فاستخدم `g.add_legend(loc="upper right", bbox_to_anchor=(1, 0))`.

**✅ قائمة فحص**

- ✅ تحتوي لوحة تحكم matplotlib 2×2 أربعة أنواع رسوم مميزة في شكل واحد.
- ✅ العنوان الفرعي الرئيسي قابل للقراءة ولا يتداخل مع محتوى الرسوم.
- ✅ ينشئ FacetGrid لوحات منفصلة لكل منطقة بمحاور مشتركة.
- ✅ حُفظ ملفا لوحة التحكم على القرص وغير فارغين.

**🤔 أسئلة سقراطية**

متى تكون لوحة التحكم متعددة الأجزاء أكثر فائدة من عرض كل رسم على حدة؟ ما المقايضة بين حشر رسوم كثيرة في شكل واحد مقابل منح كل رسم مساحته الخاصة؟

---

## الخطوة 7: التصدير والمشاركة

يجب أن تخرج رسومك من الطرفية. احفظها كملفات PNG عالية الجودة للتقارير وكملفات HTML تفاعلية للمشاركة مع أي شخص يملك متصفحًا.

### 7.1 احفظ كل الرسوم كملفات PNG عالية الدقة

**👟 تلميح للمبتدئين:** استخدم `dpi=300` لجودة الطباعة و`bbox_inches="tight"` لمنع القصّ. أنشئ دليلًا مخصصًا `exports/` لتنظيم الملفات.

```python
from pathlib import Path

exports = Path("exports")
exports.mkdir(exist_ok=True)

# Regenerate key charts and save to exports/
category_revenue = df.groupby("category")["revenue"].sum()

fig, ax = plt.subplots(figsize=(8, 5))
colors = [CATEGORY_COLORS[cat] for cat in category_revenue.index]
ax.bar(category_revenue.index, category_revenue.values, color=colors, edgecolor="white")
style_ax(ax, "Revenue by Category", ylabel="Revenue ($)")
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f"${x:,.0f}"))
plt.tight_layout()
plt.savefig(exports / "revenue_bar.png", dpi=300, bbox_inches="tight")
plt.close()

print(f"Exported to {exports}/")
for f in exports.iterdir():
    print(f"  {f.name} ({f.stat().st_size:,} bytes)")
```

**🎯 الناتج المتوقع:**

```
Exported to exports/
  revenue_bar.png (45,231 bytes)
```

كل ملف لا يقل عن 30 كيلوبايت ، فملفات PNG الصغيرة جدًا تعني أن شيئًا ما أخطأ في العرض.

**🩹 إذا كان هناك خلل:** إذا كان PNG أقل من 5 كيلوبايت فكان الشكل فارغًا عند تشغيل `savefig` ، تأكد أنك تستدعي `savefig` قبل `plt.close()`. إذا قُصَّ النص عند الحواف فأضف `bbox_inches="tight"` إلى نداء `savefig`.

### 7.2 أنشئ تقرير HTML تفاعليًا

**👟 تلميح للمبتدئين:** ادمج كل رسوم plotly في ملف HTML واحد عبر توليدها بالتسلسل واستخدام `plotly.io.to_html()` لتضمين كل منها.

```python
import plotly.io as pio

monthly_cat = df.groupby(["month", "category"])["revenue"].sum().reset_index()

fig1 = px.bar(monthly_cat, x="month", y="revenue", color="category",
              barmode="group", title="Monthly Revenue by Category")
fig1.update_layout(yaxis_tickformat="$,.0f")

fig2 = px.scatter(df, x="cost", y="revenue", color="category", size="units",
                  hover_data=["month", "region"],
                  title="Revenue vs. Cost")
fig2.update_layout(xaxis_tickformat="$,.0f", yaxis_tickformat="$,.0f")

html_parts = [
    "<html><head><title>Sales Dashboard Report</title>",
    "<style>body{font-family:sans-serif;max-width:900px;margin:0 auto;padding:20px;}"
    "h1{color:#1E293B;} h2{color:#475569;margin-top:40px;}</style></head><body>",
    "<h1>Sales Dashboard — H1 2026</h1>",
    "<h2>Monthly Revenue by Category</h2>",
    pio.to_html(fig1, full_html=False),
    "<h2>Revenue vs. Cost</h2>",
    pio.to_html(fig2, full_html=False),
    "</body></html>",
]

with open("dashboard_report.html", "w") as f:
    f.write("".join(html_parts))

print("Saved: dashboard_report.html")
```

**🎯 الناتج المتوقع:** يفتح ملف `dashboard_report.html` في متصفحك بصفحة منسقة تضم الرسمين التفاعليين ، مرّر للأسفل لرؤيتها، وحرّك المؤشر لفحص القيم، وكبّر بالسحب والنقر.

**🩹 إذا كان هناك خلل:** إذا أظهر ملف HTML كودًا خامًا بدل الرسوم فقد يُرجع `pio.to_html()` صفحة HTML كاملة بدل مقطع ، تأكد من ضبط `full_html=False`. إذا بدت الصفحة بلا تنسيق فكتلة `<style>` بها خطأ في الصياغة ، تحقق من الأقواس أو الوسوم غير المغلقة.

**✅ قائمة فحص**

- ✅ يحتوي دليل `exports/` على ملف PNG واحد على الأقل يتجاوز 30 كيلوبايت.
- ✅ يُفتح `dashboard_report.html` في متصفح برسوم تفاعلية تعمل.
- ✅ تُعرض الرسوم بدقة 300 DPI ، مناسبة للطباعة دون تشويش.
- ✅ لا نص مقصوص ولا تسميات مفقودة ولا مناطق رسوم فارغة في الصادرات.

**🤔 أسئلة سقراطية**

لديك الآن صيغتا تصدير: PNG (ثابت، عالي الدقة) وHTML (تفاعلي، أقل دقة). لو كنت ستعرض على مجلس إدارة يطبعون نشرات ورقية، أي صيغة ستستخدم؟ وماذا لو أرسلتها إلى زميل يريد استكشاف البيانات بنفسه؟

---

## 🧩 تحديات

<details>
<summary><strong>التحدي 1: سباق الرسوم الشريطية المتحركة</strong></summary>

استخدم وسيط `animation_frame` في plotly لإنشاء رسم شريطي متحرك يُظهر الإيراد وهو يتغير شهرًا بعد شهر. يجب أن تكبر الأشرطة وتصغر أثناء تشغيلك على طول الخط الزمني.

```python
fig = px.bar(monthly_cat, x="category", y="revenue", color="category",
             animation_frame="month", range_y=[0, monthly_cat["revenue"].max() * 1.1],
             title="Revenue by Category — Month by Month",
             color_discrete_map=CATEGORY_COLORS)
fig.show()
```

</details>

<details>
<summary><strong>التحدي 2: خريطة حرارية لهامش الربح</strong></summary>

احسب هامش الربح كـ `(revenue - cost) / revenue * 100`. حوّل البيانات إلى مصفوفة بالفئات كصفوف والشهور كأعمدة. استخدم `sns.heatmap()` لتصور أي تركيبات فئة-شهر حققت أعلى الهوامش.

```python
df["margin"] = ((df["revenue"] - df["cost"]) / df["revenue"] * 100).round(1)
pivot = df.pivot_table(index="category", columns="month", values="margin")

fig, ax = plt.subplots(figsize=(10, 3))
sns.heatmap(pivot, annot=True, fmt=".1f", cmap="RdYlGn", center=50, ax=ax)
ax.set_title("Profit Margin (%) by Category and Month")
plt.tight_layout()
plt.savefig("margin_heatmap.png", dpi=150)
plt.show()
```

</details>

<details>
<summary><strong>التحدي 3: لوحة تحكم تفاعلية بقائمة منسدلة</strong></summary>

استخدم `updatemenus` في plotly لإضافة قائمة منسدلة تتيح للمستخدم التبديل بين عرض الإيراد والتكلفة والوحدات على المحور y لرسم واحد ، ثلاث رؤى في شكل تفاعلي واحد.

```python
import plotly.graph_objects as go

monthly_all = df.groupby("month")[["revenue", "cost", "units"]].sum().sort_index().reset_index()

fig = go.Figure()
for col, color in [("revenue", "#4CAF50"), ("cost", "#F44336"), ("units", "#2196F3")]:
    fig.add_trace(go.Scatter(x=monthly_all["month"], y=monthly_all[col],
                             name=col.title(), visible=True if col == "revenue" else False,
                             line=dict(color=color, width=3), mode="lines+markers"))

fig.update_layout(
    updatemenus=[dict(
        buttons=[
            dict(label="Revenue", method="update", args=[{"visible": [True, False, False]}, {"yaxis.title": "Revenue ($)"}]),
            dict(label="Cost", method="update", args=[{"visible": [False, True, False]}, {"yaxis.title": "Cost ($)"}]),
            dict(label="Units", method="update", args=[{"visible": [False, False, True]}, {"yaxis.title": "Units Sold"}]),
        ],
        direction="down", showactive=True,
    )],
    title="Monthly Metrics (select one)",
    yaxis_title="Revenue ($)",
)
fig.show()
```

</details>

## ما الذي تعلّمته

- أنشأت رسومًا شريطية وخطية ومبعثرة ودائرية بـmatplotlib
- بنيت مخططات صندوق وخرائط حرارة ومخططات أزواج وكمان بـseaborn
- ولّدت رسوم HTML تفاعلية بـplotly (شريطي ومبعثر وخطي مع منزلق مدى)
- عرّفت موضوعًا لونيًا مخصصًا وطبّقته بشكل متناسق على كل أنواع الرسوم
- جمّعت لوحات تحكم متعددة الأجزاء عبر `plt.subplots()` و`sns.FacetGrid()`
- صدّرت الرسوم كملفات PNG عالية الدقة (300 DPI) وتقارير HTML تفاعلية
- تعلّمت متى يكون كل من مكتبات التصور والصيغ الخيار الصحيح

## أين المضي قدمًا

- **لوحة تحكم Streamlit.** لفّ الرسوم نفسها في تطبيق Streamlit بـ`st.pyplot()` و`st.plotly_chart()` للوحة ويب حية تتحدث مع تغيّر البيانات.
- **الرسوم المتحركة بـmatplotlib.** استخدم `matplotlib.animation.FuncAnimation` لإنشاء رسوم متحركة تُظهر البيانات وهي تتغير عبر الزمن ، رائعة للعروض التقديمية.
- **Altair أو Vega-Lite.** استكشف التصوير التصريحي حيث تصف *ماذا* سترسم بدل *كيف* ترسمه ، نموذج مختلف عن المقاربة الأمرية لـmatplotlib.
- **البيانات المكانية.** استخدم `plotly.express.choropleth()` أو `folium` لرسم البيانات على مناطق جغرافية ، مبيعات حسب الدولة، طقس حسب المدينة، إلخ.
- **بيانات حقيقية.** استبدل CSV النموذجي ببيانات حقيقية من [Kaggle](https://www.kaggle.com/datasets) أو [data.gov](https://data.gov) أو جداولك الخاصة. يعمل كود الرسم نفسه على أي بيانات جدولية.

## شارك مشروعك مع الفصل

بنيت شيئًا يجعلك فخورًا؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض للمشاريع التي سلّمها طلاب آخرون ، ويحوي ملفه README دليلًا كاملًا ومناسبًا للمبتدئين لإضافة مشروعك عبر **طلب سحب (pull request)**، حتى لو لم تستخدم git من قبل: نسخ المستودع، وإنشاء فرع، والتزام ملفاتك، وفتح الطلب، خطوة بخطوة. لا تتطلب أي خبرة سابقة بـgit.

مرحبًا بك في كتابة بايثون خارج المتصفح. 🎓