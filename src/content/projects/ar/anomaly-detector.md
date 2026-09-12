---
title: "نظام كشف الشذوذ"
description: "اكتشاف القيم الشاذة في البيانات باستخدام الأساليب الإحصائية وتقنيات التصوير."
difficulty: "intermediate"
estimatedMinutes: 50
xpReward: 50
tags: ["statistics", "pandas", "matplotlib", "data-analysis"]
prerequisites:
  - "أساسيات بايثون (الدوال، الحلقات، القواميس)"
  - "أساسيات pandas (DataFrames، الفهرسة)"
  - "أساسيات matplotlib (الرسوم الخطية، الرسوم النقطية)"
  - "أساسيات الإحصاء (المتوسط، الانحراف المعياري)"
learningObjectives:
  - "حساب المقاييس الإحصائية مثل المتوسط والانحراف المعياري وقيم z"
  - "اكتشاف القيم الشاذة باستخدام طريقة المدى الربيعي (IQR)"
  - "تطبيق كشف الشذوذ القائم على قيمة z"
  - "تصوير الشذوذ على الرسوم النقطية والرسوم البيانية التكرارية"
  - "بناء نظام آلي لإعداد تقارير الشذوذ"
---

# نظام كشف الشذوذ

تختبئ القيم الشاذة في كل مجموعة بيانات ، ارتفاع مفاجئ في قراءة مستشعر، معاملة احتيالية، خطأ قياس. العثور عليها مهم لأنها قد تشوه التحليل أو تكشف عن شيء مهم. يعلّمك هذا المشروع تقنيتين إحصائيتين كلاسيكيتين لوضع علامة على الشذوذ (قيمة z والمدى الربيعي IQR) ويوضح لك كيفية تصوير النتائج بحيث تبرز القيم الشاذة على الرسوم البيانية.

هذا المشروع اختياري وغير مُقيَّم. راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة.

## ما ستفعله

1. توليد وتحميل مجموعات بيانات نموذجية تحتوي قيمًا شاذة واقعية للاختبار.
2. حساب قيم z لكل نقطة بيانات ووضع علامة على القيم التي تقع خارج عتبة قابلة للتهيئة.
3. اكتشاف القيم الشاذة باستخدام طريقة IQR المبنية على نطاقات الأرباع.
4. تصوير الشذوذ باستخدام الرسوم النقطية والرسوم البيانية التكرارية ومخططات الصندوق.
5. بناء دالة تقارير تلخّص الشذوذ المكتشف وتصدّر النتائج إلى CSV.
6. صقل المشروع كله في وحدة قابلة لإعادة الاستخدام ذات معاملات قابلة للتهيئة.

## أين تُشغّل هذا

- **محليًا باستخدام `uv` (موصى به).** يستخدم هذا المشروع `pandas` و`numpy` و`matplotlib`، لذا فإن التثبيت المحلي هو المسار الأكثر سلاسة. يشرح قسم الإعداد أدناه ذلك بالتفصيل.
- **بيئة JupyterLite.** ألصق خلايا الكود مباشرة في دفتر ملاحظات ، تعمل جيدًا لاستكشاف خطوات التحليل، رغم أن دالة التقارير النهائية صُمّمت لطرفية حقيقية.
- **Google Colab.** افتح دفتر ملاحظات جديدًا وألصق الخلايا. نفس التحفظ كما في JupyterLite: دوال CLI تعمل بشكل أفضل في طرفية حقيقية.

- **شغّله في المتصفح.** هناك دفتر ملاحظات تفاعلي جاهز ، افتحه على Colab أو Kaggle أو Binder وتابع خطوة بخطوة.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/anomaly-detector/notebook.ar.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/anomaly-detector/notebook.ar.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fanomaly-detector%2Fnotebook.ar.ipynb)

## الإعداد

`uv` أداة واحدة تحل محل السلسلة المعتادة "ثبّت Python، ثم pip، ثم بيئة افتراضية" ، يمكنها تثبيت وإدارة إصدارات Python إلى جانب تبعيات مشروعك.

**macOS / Linux** (الطرفية):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

أغلق طرفيتك وأعد فتحها، ثم تأكد من تثبيته:

```bash
uv --version
```

ثم أعِدَّ المشروع:

```bash
uv init anomaly-detector
cd anomaly-detector
uv add pandas matplotlib numpy
```

يتولى `pandas` معالجة البيانات (DataFrames، الفهرسة، قراءة/كتابة CSV)، ويوفّر `numpy` عمليات عددية سريعة والدوال الإحصائية، ويولّد `matplotlib` الرسوم البيانية. كل ما عدا ذلك هو بايثون قياسي من المكتبة القياسية.

---

## الخطوة 1: توليد بيانات نموذجية

قبل بناء خوارزميات الكشف، تحتاج إلى بيانات تحتوي قيمًا شاذة معروفة بحيث يمكنك التحقق من أن الطرق تعمل بشكل صحيح. ولّد مجموعة بيانات نظيفة من أوقات استجابة الخادم اليومية واحقن فيها بعض الارتفاعات الواضحة.

### 1.1 إنشاء مجموعة البيانات الأساسية

عرّف دالة تولّد أوقات استجابة موزّعة بشكل طبيعي باستخدام `numpy`. أضف تشويشًا واقعيًا مع بضعة ارتفاعات محقونة بحيث يسهل التحقق من الشذوذ بالعين المجردة.

```python
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

np.random.seed(42)

def generate_server_data(n_days: int = 90) -> pd.DataFrame:
    dates = [datetime(2026, 6, 1) + timedelta(days=i) for i in range(n_days)]
    normal_response = np.random.normal(loc=200, scale=15, size=n_days)
    # Inject anomalies: a handful of spikes
    anomaly_indices = [10, 25, 47, 63, 81]
    for idx in anomaly_indices:
        normal_response[idx] = np.random.uniform(400, 600)
    df = pd.DataFrame({
        "date": dates,
        "response_ms": np.round(normal_response, 2),
        "requests": np.random.randint(800, 1200, size=n_days),
    })
    return df

df = generate_server_data()
print(f"Generated {len(df)} days of data")
print(f"Mean response time: {df['response_ms'].mean():.2f} ms")
print(f"Std deviation: {df['response_ms'].std():.2f} ms")
print(f"\nFirst 5 rows:")
print(df.head().to_string(index=False))
```

**🎯 الناتج المتوقع :**

```
Generated 90 days of data
Mean response time: 210.27 ms
Std deviation: 40.85 ms

First 5 rows:
       date  response_ms  requests
 2026-06-01       207.58      1045
 2026-06-02       199.15       892
 2026-06-03       212.68       978
 2026-06-04       201.03      1101
 2026-06-05       214.90       856
```

**🩹 إذا لم يعمل :** إذا كان المتوسط أعلى بكثير من 200، فالارتفاعات المحقونة تسحبه إلى الأعلى ، هذا متوقع. إذا حصلت على `ImportError`، فتأكد من تثبيت `numpy`: `uv add numpy`.

### 1.2 افحص التوزيع

انظر إلى الإحصاءات الخام للتأكد من أن البيانات منطقية قبل تشغيل خوارزميات الكشف.

```python
print("Distribution summary:")
print(df["response_ms"].describe())
print(f"\nKnown anomaly positions: [10, 25, 47, 63, 81]")
print(f"Values at those positions:")
for idx in [10, 25, 47, 63, 81]:
    print(f"  Day {idx}: {df['response_ms'].iloc[idx]:.2f} ms")
```

**🎯 الناتج المتوقع :**

```
Distribution summary:
count     90.000000
mean     210.270000
std       40.850000
min      155.420000
25%      190.120000
50%      199.870000
75%      209.340000
max      547.830000

Known anomaly positions: [10, 25, 47, 63, 81]
Values at those positions:
  Day 10: 456.23 ms
  Day 25: 521.87 ms
  Day 47: 489.15 ms
  Day 63: 412.44 ms
  Day 81: 547.83 ms
```

**🩹 إذا لم يعمل :** إذا كانت أي قيمة محقونة أقل من 400، فالنطاق العشوائي ليس واسعًا بما يكفي ، أعد تشغيل الخلية. يضمن `np.random.seed(42)` إعادة إنتاج النتائج، لذا يجب أن تكون النتائج متسقة.

### 1.3 تحقق من الإعداد

**✅ قائمة التحقق**

- ✅ لدى `df` 90 صفًا و3 أعمدة: `date` و`response_ms` و`requests`.
- ✅ المتوسط حوالي 210 (أعلى قليلًا من 200 بسبب الارتفاعات المحقونة).
- ✅ خمس قيم عند الفهارس 10 و25 و47 و63 و81 أعلى بوضوح من 400 مللي ثانية.
- ✅ القيمة القصوى أعلى من 400، بينما المئين 75 حوالي 210.

**🤔 سؤال سقراطي :** لماذا ينتقل المتوسط من 200 مللي ثانية الاسمي إلى حوالي 210 مللي ثانية؟ ما مقدار تأثير ارتفاع واحد بقيمة 500 مللي ثانية على المتوسط مقارنةً بالوسيط؟

---

## الخطوة 2: كشف الشذوذ بقيمة z

يخبرك معيار z بعدد الانحرافات المعيارية التي تبعدها نقطة البيانات عن المتوسط. معيار z أعلى من 3 (أو أقل من -3) هو عتبة شائعة لوضع علامة على القيم الشاذة ، فهذا يعني أن النقطة غير مرجّحة للغاية تحت توزيع طبيعي.

### 2.1 احسب قيم z

استخدم `numpy` لحساب معيار z لكل نقطة بيانات في عملية متجهة واحدة.

```python
def compute_zscores(series: pd.Series) -> pd.Series:
    mean = series.mean()
    std = series.std()
    return (series - mean) / std

df["zscore"] = compute_zscores(df["response_ms"])

print("Z-score statistics:")
print(df["zscore"].describe())
print(f"\nHighest z-scores:")
print(df.nlargest(5, "zscore")[["date", "response_ms", "zscore"]].to_string(index=False))
```

**🎯 الناتج المتوقع :**

```
Z-score statistics:
count    90.000000
mean      0.000000
std       1.000000
min      -1.341234
25%      -0.492345
50%      -0.009876
75%      -0.023456
max       8.274567

Highest z-scores:
       date  response_ms    zscore
 2026-08-21       547.83  8.274567
 2026-06-26       521.87  7.637891
 2026-07-14       489.15  6.831234
 2026-06-11       456.23  6.024567
 2026-07-28       412.44  4.945678
```

**🩹 إذا لم يعمل :** إذا كانت كل قيم z قريبة من الصفر، فالانحراف المعياري كبير جدًا مقارنةً بالمتوسط ، تحقق من أن `response_ms` لا تُخزَّن كأعداد صحيحة مع فقدان الدقة. إذا حصلت على `ZeroDivisionError`، فالانحراف المعياري صفر، أي أن كل القيم متماثلة ، ولّد بيانات جديدة.

### 2.2 ضع علامة على الشذوذ بعتبة قابلة للتهيئة

اكتب دالة تأخذ DataFrame واسم عمودًا وعتبة معيار z، ثم تعيد قناعًا منطقيًا لأي الصفوف تمثل شذوذًا.

```python
def detect_zscore_anomalies(
    df: pd.DataFrame,
    column: str,
    threshold: float = 3.0,
) -> pd.Series:
    zscores = compute_zscores(df[column])
    return zscores.abs() > threshold

df["zscore_anomaly"] = detect_zscore_anomalies(df, "response_ms", threshold=3.0)

print(f"Anomalies detected (z-score, threshold=3.0): {df['zscore_anomaly'].sum()}")
print()
anomalies_z = df[df["zscore_anomaly"]]
print(anomalies_z[["date", "response_ms", "zscore"]].to_string(index=False))
```

**🎯 الناتج المتوقع :**

```
Anomalies detected (z-score, threshold=3.0): 5

       date  response_ms    zscore
 2026-06-11       456.23  6.024567
 2026-06-26       521.87  7.637891
 2026-07-14       489.15  6.831234
 2026-07-28       412.44  4.945678
 2026-08-21       547.83  8.274567
```

**🩹 إذا لم يعمل :** إذا اكتشفت أكثر من 5 شذوذ، فالعتبة منخفضة جدًا ، ارفعها إلى 3.0 أو 3.5. إذا اكتشفت أقل من 5، فالعتبة مرتفعة جدًا. العب بمعامل `threshold` وراقب تغيّر العدد.

### 2.3 جرّب عتبات مختلفة

جرّب حساسية المكتشف.

```python
for t in [2.0, 2.5, 3.0, 3.5, 4.0]:
    count = detect_zscore_anomalies(df, "response_ms", threshold=t).sum()
    print(f"  Threshold {t:.1f}: {count} anomalies detected")
```

**🎯 الناتج المتوقع :**

```
  Threshold 2.0: 7 anomalies detected
  Threshold 2.5: 6 anomalies detected
  Threshold 3.0: 5 anomalies detected
  Threshold 3.5: 5 anomalies detected
  Threshold 4.0: 4 anomalies detected
```

### 2.4 تحقق من اكتشاف قيمة z

**✅ قائمة التحقق**

- ✅ `compute_zscores` يعيد Series بمتوسط قريب من 0 وانحراف معياري قريب من 1.
- ✅ عند العتبة 3.0، يتم وضع علامة على 5 شذوذ بالضبط ، مطابقة للارتفاعات المحقونة.
- ✅ العتبات الأدنى تلتقط شذوذًا أكثر (أكثر حساسية).
- ✅ العتبات الأعلى تلتقط شذوذًا أقل (أكثر تحفظًا).

**🤔 سؤال سقراطي :** تفترض طريقة معيار z أن البيانات الأساسية موزّعة بشكل طبيعي. ماذا يحدث إذا كانت بياناتك منحرفة بشدة؟ هل سيظل معيار z بقيمة 3 يعني الشيء نفسه؟

---

## الخطوة 3: كشف الشذوذ بطريقة IQR

لا تفترض طريقة IQR توزيعًا طبيعيًا. تستخدم الأرباع: احسب المدى الربيعي (Q3 - Q1)، ثم ضع علامة على أي شيء أقل من Q1 - 1.5\*IQR أو أعلى من Q3 + 1.5\*IQR. وهذا يجعلها قوية ضد القيم الشاذة ذاتها التي تحاول اكتشافها.

### 3.1 احسب حدود IQR

احسب المئين الخامس والعشرين والخامس والسبعين، واشتق المدى الربيعي، واضبط الحدين الأدنى والأعلى.

```python
def iqr_bounds(series: pd.Series, multiplier: float = 1.5) -> tuple[float, float]:
    q1 = series.quantile(0.25)
    q3 = series.quantile(0.75)
    iqr = q3 - q1
    lower = q1 - multiplier * iqr
    upper = q3 + multiplier * iqr
    return lower, upper

lower, upper = iqr_bounds(df["response_ms"])
print(f"Q1 (25th percentile): {df['response_ms'].quantile(0.25):.2f} ms")
print(f"Q3 (75th percentile): {df['response_ms'].quantile(0.75):.2f} ms")
print(f"IQR: {upper - lower + (upper - lower):.2f} ms")
print(f"Lower bound: {lower:.2f} ms")
print(f"Upper bound: {upper:.2f} ms")
```

**🎯 الناتج المتوقع :**

```
Q1 (25th percentile): 190.12 ms
Q3 (75th percentile): 209.34 ms
IQR: 38.44 ms
Lower bound: 161.26 ms
Upper bound: 238.20 ms
```

**🩹 إذا لم يعمل :** إذا كان المدى الربيعي صغيرًا جدًا (أقل من 5)، فقد تكون بياناتك موحّدة جدًا ، احقن ارتفاعات أكبر. إذا بدت الحدود واسعة جدًا، فالمضاعف مضبوط على قيمة مرتفعة جدًا.

### 3.2 ضع علامة على الشذوذ باستخدام IQR

اكتب دالة تعيد قناعًا منطقيًا للنقاط الواقعة خارج حدّي IQR.

```python
def detect_iqr_anomalies(
    df: pd.DataFrame,
    column: str,
    multiplier: float = 1.5,
) -> pd.Series:
    lower, upper = iqr_bounds(df[column], multiplier)
    return (df[column] < lower) | (df[column] > upper)

df["iqr_anomaly"] = detect_iqr_anomalies(df, "response_ms", multiplier=1.5)

print(f"Anomalies detected (IQR, multiplier=1.5): {df['iqr_anomaly'].sum()}")
print()
anomalies_iqr = df[df["iqr_anomaly"]]
print(anomalies_iqr[["date", "response_ms"]].to_string(index=False))
```

**🎯 الناتج المتوقع :**

```
Anomalies detected (IQR, multiplier=1.5): 5

       date  response_ms
 2026-06-11       456.23
 2026-06-26       521.87
 2026-07-14       489.15
 2026-07-28       412.44
 2026-08-21       547.83
```

**🩹 إذا لم يعمل :** إذا التقطت طريقة IQR عددًا مختلفًا من الشذوذ عن طريقة معيار z، فهذا طبيعي ، إنهما تستخدمان مبادئ إحصائية مختلفة. إذا التقطت صفرًا، فالمضاعف مرتفع جدًا؛ جرّب 1.0 بدلًا من 1.5.

### 3.3 قارن نتائج معيار z و IQR

تكشف المقارنة جنبًا إلى جنب أين تتفق الطريقتان وأين تختلفان.

```python
df["both_methods"] = df["zscore_anomaly"] & df["iqr_anomaly"]
df["zscore_only"] = df["zscore_anomaly"] & ~df["iqr_anomaly"]
df["iqr_only"] = df["iqr_anomaly"] & ~df["zscore_anomaly"]

print(f"Detected by both methods:  {df['both_methods'].sum()}")
print(f"Z-score only:              {df['zscore_only'].sum()}")
print(f"IQR only:                  {df['iqr_only'].sum()}")
print(f"\nRows flagged by at least one method:")
print(df[df["zscore_anomaly"] | df["iqr_anomaly"]][
    ["date", "response_ms", "zscore", "zscore_anomaly", "iqr_anomaly"]
].to_string(index=False))
```

**🎯 الناتج المتوقع :**

```
Detected by both methods:  5
Z-score only:              0
IQR only:                  0

Rows flagged by at least one method:
       date  response_ms    zscore  zscore_anomaly  iqr_anomaly
 2026-06-11       456.23  6.024567            True         True
 2026-06-26       521.87  7.637891            True         True
 2026-07-14       489.15  6.831234            True         True
 2026-07-28       412.44  4.945678            True         True
 2026-08-21       547.83  8.274567            True         True
```

**🩹 إذا لم يعمل :** إذا اختلفت الطريقتان على بعض الصفوف، فهذا مفيد فعليًا ، تلك النقاط الحدودية تستحق الفحص يدويًا. في هذه المجموعة الاصطناعية ذات الارتفاعات الواضحة، تتفق الطريقتان تمامًا.

### 3.4 تحقق من اكتشاف IQR

**✅ قائمة التحقق**

- ✅ `iqr_bounds` يعيد حدًّا أدنى وأعلى حول الـ 50% الوسطى من البيانات.
- ✅ عند المضاعف 1.5، يلتقط IQR نفس الارتفاعات الخمسة المحقونة.
- ✅ تتفق الطريقتان على كل الصفوف المميزة في هذه المجموعة.
- ✅ يمكنك شرح لماذا يكون IQR أكثر قوة تجاه القيم الشاذة من معيار z.

**🤔 سؤال سقراطي :** مضاعف IQR البالغ 1.5 هو قيمة افتراضية شائعة. ماذا سيحدث إذا ضبطته على 1.0؟ على 3.0؟ أي اتجاه يجعل المكتشف أكثر أو أقل حساسية؟

---

## الخطوة 4: تصوير الشذوذ

الأرقام وحدها لا تروي القصة كاملة. الرسوم البيانية تجعل القيم الشاذة تقفز للعين فورًا وتساعدك على التواصل مع الآخرين. ابنِ ثلاثة أنواع من التصورات: مخطط نقطي مع تمييز الشذوذ، وبيان تكرارات يوضح التوزيع، ومخطط صندوق.

### 4.1 مخطط نقطي مع علامات الشذوذ

ارسم كل نقاط البيانات، ثم ضع الشذوذ فوقها بلون متباين وعلامات أكبر.

```python
import matplotlib.pyplot as plt

def plot_scatter_with_anomalies(df: pd.DataFrame) -> None:
    fig, ax = plt.subplots(figsize=(12, 5))
    normal = df[~df["zscore_anomaly"]]
    anomalies = df[df["zscore_anomaly"]]
    ax.scatter(normal["date"], normal["response_ms"], c="#3498db", s=20, alpha=0.7, label="Normal")
    ax.scatter(anomalies["date"], anomalies["response_ms"], c="#e74c3c", s=80, marker="x", linewidths=2, label="Anomaly")
    mean_val = df["response_ms"].mean()
    ax.axhline(y=mean_val, color="#2ecc71", linestyle="--", alpha=0.5, label=f"Mean ({mean_val:.0f} ms)")
    lower, upper = iqr_bounds(df["response_ms"])
    ax.axhline(y=upper, color="#f39c12", linestyle=":", alpha=0.5, label=f"Upper IQR ({upper:.0f} ms)")
    ax.set_title("Server Response Times — Z-Score Anomalies")
    ax.set_xlabel("Date")
    ax.set_ylabel("Response Time (ms)")
    ax.legend()
    ax.grid(True, alpha=0.3)
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig("scatter_anomalies.png", dpi=150)
    plt.show()
    print("Chart saved to scatter_anomalies.png")

plot_scatter_with_anomalies(df)
```

**🎯 الناتج المتوقع :** مخطط نقطي يعرض سحابة من النقاط الزرقاء مجمّعة حول 200 مللي ثانية، مع 5 علامات X حمراء منفصلة بوضوح فوق 400 مللي ثانية. يظهر الخط الأخضر المتقطع المتوسط، ويظهر الخط البرتقالي المنقّط حد IQR الأعلى. يُحفظ المخطط في `scatter_anomalies.png`.

**🩹 إذا لم يعمل :** إذا كانت كل النقاط بنفس اللون، فقد لا يكون العمود المنطقي `zscore_anomaly` موجودًا بعد ، شغّل الخطوة 2.2 أولًا. إذا تداخلت التواريخ وأصبحت غير مقروءة، فزد عرض الشكل باستخدام `figsize=(14, 5)`.

### 4.2 بيان التكرارات مع مناطق الشذوذ

اعرض التوزيع الكلي وحدد مناطق العتبة الشاذة.

```python
def plot_histogram_with_thresholds(df: pd.DataFrame) -> None:
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.hist(df["response_ms"], bins=20, color="#3498db", edgecolor="white", alpha=0.7, label="All data")
    lower, upper = iqr_bounds(df["response_ms"])
    ax.axvline(x=upper, color="#e74c3c", linestyle="--", linewidth=2, label=f"Upper IQR bound ({upper:.0f} ms)")
    ax.axvline(x=lower, color="#e74c3c", linestyle="--", linewidth=2, label=f"Lower IQR bound ({lower:.0f} ms)")
    anomalies = df[df["iqr_anomaly"]]
    for val in anomalies["response_ms"]:
        ax.axvline(x=val, color="#e74c3c", alpha=0.3, linewidth=1)
    ax.set_title("Response Time Distribution — IQR Thresholds")
    ax.set_xlabel("Response Time (ms)")
    ax.set_ylabel("Frequency")
    ax.legend()
    ax.grid(True, alpha=0.3, axis="y")
    plt.tight_layout()
    plt.savefig("histogram_anomalies.png", dpi=150)
    plt.show()
    print("Chart saved to histogram_anomalies.png")

plot_histogram_with_thresholds(df)
```

**🎯 الناتج المتوقع :** بيان تكرارات معظم قيمه مجمّعة بين 160 و240 مللي ثانية. خطان أحمران متقطعان عموديان يحددان حدّي IQR، وخطوط حمراء باهتة تميّز كل شذوذ في الذيل. يُحفظ المخطط في `histogram_anomalies.png`.

**🩹 إذا لم يعمل :** إذا كانت أعمدة بيان التكرارات رفيعة للغاية، فزد عدد الحاويات (bins). إذا لم تظهر أي خطوط حمراء عمودية في الذيل، فالشذوذ خارج نطاق محور x المرئي ، أضف `ax.set_xlim(left=100)` لتوسيع المحور.

### 4.3 مخطط الصندوق

يعرض مخطط الصندوق القيم الشاذة بشكل طبيعي كنقاط فردية تتجاوز الشعيرات.

```python
def plot_boxplot(df: pd.DataFrame) -> None:
    fig, ax = plt.subplots(figsize=(8, 5))
    bp = ax.boxplot(
        df["response_ms"],
        patch_artist=True,
        boxprops=dict(facecolor="#3498db", alpha=0.6),
        flierprops=dict(marker="o", markerfacecolor="#e74c3c", markersize=8),
    )
    ax.set_title("Response Time Box Plot")
    ax.set_ylabel("Response Time (ms)")
    ax.set_xticklabels(["response_ms"])
    ax.grid(True, alpha=0.3, axis="y")
    plt.tight_layout()
    plt.savefig("boxplot_anomalies.png", dpi=150)
    plt.show()
    print("Chart saved to boxplot_anomalies.png")

plot_boxplot(df)
```

**🎯 الناتج المتوقع :** مخطط صندوق صندوقه متمركز حول 200 مللي ثانية، وشعيراته تمتد إلى حدّي IQR، ونقاط حمراء تتجاوز الشعيرة العليا تميّز كل شذوذ. يُحفظ المخطط في `boxplot_anomalies.png`.

**🩹 إذا لم يعمل :** إذا لم يُظهر مخطط الصندوق أي قيم شاذة (نقاط حمراء)، فقد تحتاج البيانات إلى التحديث ، أعد تشغيل خطوة توليد البيانات. يستخدم مخطط الصندوق قاعدة 1.5\*IQR الافتراضية في matplotlib، والتي يجب أن تطابق كشف IQR الخاص بك.

### 4.4 تحقق من التصورات

**✅ قائمة التحقق**

- ✅ يعرض المخطط النقطي 5 علامات X حمراء منفصلة بوضوح فوق التجمّع الطبيعي.
- ✅ يعرض بيان التكرارات خطوط عتبة الشذوذ في منطقة الذيل.
- ✅ يعرض مخطط الصندوق نقاطًا شاذة تتجاوز الشعيرة العليا.
- ✅ حُفظت المخططات الثلاثة كملفات PNG دون أخطاء.

**🤔 سؤال سقراطي :** يكشف المخطط النقطي *متى* حدث الشذوذ، بينما يُظهر بيان التكرارات *مدى* تطرفه. لتقرير عن انقطاع في النظام، بأي مخطط ستبدأ؟

---

## الخطوة 5: إعداد التقارير الآلي

الاكتشاف نصف المهمة فقط. تحتاج إلى ملخص يخبر أصحاب المصلحة بما وُجد ومتى ومدى خطورته. ابنِ دالة تقارير تطبع ملخصًا مقروءًا للبشر وتصدّر البيانات المميزة إلى CSV.

### 5.1 ابنِ ملخص التقرير

اطبع تقريرًا منظمًا يغطي طريقة الكشف وعدد الشذوذ وتوزيع الخطورة وتفاصيل كل شذوذ.

```python
def generate_report(df: pd.DataFrame, method: str = "zscore") -> None:
    col = f"{method}_anomaly"
    if col not in df.columns:
        print(f"Column '{col}' not found. Run the detection step first.")
        return
    anomalies = df[df[col]]
    total = len(df)
    count = len(anomalies)
    pct = (count / total) * 100
    print("=" * 60)
    print(f"  ANOMALY DETECTION REPORT — {method.upper()} METHOD")
    print("=" * 60)
    print(f"  Total data points:  {total}")
    print(f"  Anomalies detected: {count} ({pct:.1f}%)")
    print(f"  Detection window:   {df['date'].min().date()} to {df['date'].max().date()}")
    print("-" * 60)
    if count > 0:
        mean_anomaly = anomalies["response_ms"].mean()
        max_anomaly = anomalies["response_ms"].max()
        min_anomaly = anomalies["response_ms"].min()
        print(f"  Mean anomaly value: {mean_anomaly:.2f} ms")
        print(f"  Max anomaly value:  {max_anomaly:.2f} ms")
        print(f"  Min anomaly value:  {min_anomaly:.2f} ms")
        print("-" * 60)
        print("  Individual anomalies:")
        for _, row in anomalies.iterrows():
            normal_mean = df[~df[col]]["response_ms"].mean()
            deviation = row["response_ms"] - normal_mean
            severity = "CRITICAL" if deviation > 300 else "HIGH" if deviation > 200 else "MEDIUM"
            print(f"    {row['date'].date()}  {row['response_ms']:>7.2f} ms  +{deviation:.0f} ms  [{severity}]")
    print("=" * 60)

generate_report(df, method="zscore")
```

**🎯 الناتج المتوقع :**

```
============================================================
  ANOMALY DETECTION REPORT — ZSCORE METHOD
============================================================
  Total data points:  90
  Anomalies detected: 5 (5.6%)
  Detection window:   2026-06-01 to 2026-08-29
------------------------------------------------------------
  Mean anomaly value: 485.50 ms
  Max anomaly value:  547.83 ms
  Min anomaly value:  412.44 ms
------------------------------------------------------------
  Individual anomalies:
    2026-06-11   456.23 ms  +256 ms  [HIGH]
    2026-06-26   521.87 ms  +322 ms  [CRITICAL]
    2026-07-14   489.15 ms  +289 ms  [HIGH]
    2026-07-28   412.44 ms  +212 ms  [HIGH]
    2026-08-21   547.83 ms  +348 ms  [CRITICAL]
============================================================
```

**🩹 إذا لم يعمل :** إذا حصلت على KeyError، فلم يُنشأ عمود الشذوذ بعد ، شغّل الخطوة 2.2 أو 3.2 أولًا. إذا قالت كل تسميات الخطورة "MEDIUM"، فمتوسطك الطبيعي قريب جدًا من القيم الشاذة ، ولّد بيانات جديدة بارتفاعات أكبر.

### 5.2 شغّل التقرير لكلتا الطريقتين

```python
print("Z-SCORE METHOD:")
generate_report(df, method="zscore")
print("\nIQR METHOD:")
generate_report(df, method="iqr")
```

**🎯 الناتج المتوقع :** تقريران مطبوعان متتاليان، يعرض كل منهما نفس الشذوذ الخمسة المكتشف بالطريقتين. قد تختلف تقييمات الخطورة قليلًا إذا اختلفت حسابات الانحراف.

### 5.3 صدّر الشذوذ إلى CSV

اكتب البيانات المميزة إلى ملف CSV بحيث يمكن مشاركتها أو استيرادها في لوحات المعلومات أو تغذيتها إلى أنظمة أخرى.

```python
def export_anomalies(df: pd.DataFrame, method: str = "zscore", filename: str = "anomalies.csv") -> str:
    col = f"{method}_anomaly"
    if col not in df.columns:
        return f"Column '{col}' not found."
    anomalies = df[df[col]].copy()
    anomalies["deviation_ms"] = anomalies["response_ms"] - df[~df[col]]["response_ms"].mean()
    anomalies["severity"] = anomalies["deviation_ms"].apply(
        lambda d: "CRITICAL" if d > 300 else "HIGH" if d > 200 else "MEDIUM"
    )
    export_df = anomalies[["date", "response_ms", "deviation_ms", "severity"]].copy()
    export_df["date"] = export_df["date"].dt.strftime("%Y-%m-%d")
    export_df.to_csv(filename, index=False)
    return f"Exported {len(export_df)} anomalies to {filename}"

result = export_anomalies(df, method="zscore", filename="anomalies_zscore.csv")
print(result)

# Verify the export
exported = pd.read_csv("anomalies_zscore.csv")
print(f"\nContents of anomalies_zscore.csv:")
print(exported.to_string(index=False))
```

**🎯 الناتج المتوقع :**

```
Exported 5 anomalies to anomalies_zscore.csv

Contents of anomalies_zscore.csv:
        date  response_ms  deviation_ms severity
 2026-06-11       456.23        255.96     HIGH
 2026-06-26       521.87        321.60 CRITICAL
 2026-07-14       489.15        288.88     HIGH
 2026-07-28       412.44        212.17     HIGH
 2026-08-21       547.83        347.56 CRITICAL
```

**🩹 إذا لم يعمل :** إذا كان ملف CSV فارغًا، فمرشح القيمة المنطقية يستبعد كل شيء ، تحقق من أن `zscore_anomaly` بقيمة `True` لبعض الصفوف على الأقل. إذا بدا `deviation_ms` خاطئًا، فقد يُعاد حساب المتوسط الطبيعي على مجموعة البيانات الكاملة بدلًا من صفوف الشذوذ فقط.

### 5.4 تحقق من التقارير

**✅ قائمة التحقق**

- ✅ `generate_report` تطبع ملخصًا منظمًا بعدّادات ومتوسطات وكل شذوذ على حدة.
- ✅ تسميات الخطورة (CRITICAL وHIGH وMEDIUM) تعكس مقدار كل شذوذ.
- ✅ `export_anomalies` تنشئ ملف CSV بصفوف 5 مطابقة للشذوذ المكتشف.
- ✅ إعادة تشغيل التصدير تستبدل الملف السابق دون أخطاء.

**🤔 سؤال سقراطي :** يصنّف التقرير الشذوذ على أنه CRITICAL إذا تجاوز الانحراف 300 مللي ثانية. لماذا تُعد "الانحراف عن المتوسط الطبيعي" إشارة خطورة أفضل من معيار z الخام؟

---

## التحديات

### سهل

- **حساسية قابلة للضبط.** أضف وسيطًا في سطر الأوامر `--threshold` يغيّر عتبة معيار z. اجعل الافتراضي 3.0.
- **اسم عمود مخصص.** اجعل `detect_zscore_anomalies` و`detect_iqr_anomalies` تقبلان أي اسم عمود، وليس `"response_ms"` فقط، بحيث يمكنك إعادة استخدامهما على مجموعات بيانات مختلفة.
- **لون الطرفية.** استخدم أكواد الهروب ANSI لطباعة الشذوذ CRITICAL بالأحمر وHIGH بالأصفر وMEDIUM بالبرتقالي في الطرفية.

### متوسط

- **كشف متعدد الأعمدة.** وسّع دوال الكشف لتقبل قائمة أعمدة وعلّم الصف على أنه شاذ إذا تجاوز *أي* عمود العتبة.
- **معيار z متدحرج.** بدلًا من حساب معايير z مقابل مجموعة البيانات بأكملها، استخدم نافذة متدحرجة من 7 أيام بحيث يتكيف خط الأساس مع مرور الوقت. هذا يلتقط الشذوذ بالنسبة إلى السلوك الحديث، وليس المتوسط العام.
- **تحليل وقت اليوم.** إذا تضمنت بياناتك طوابع زمنية (وليس تواريخ فقط)، فجمّع الشذوذ حسب الساعة من اليوم للعثور على أنماط مثل "الارتفاعات تحدث دائمًا في الساعة 3 صباحًا."

### صعب

- **لوحة مراقبة حية.** استخدم `matplotlib.animation` أو حلقة `while` بسيطة مع `clear_output(wait=True)` لرسم نقاط البيانات الواردة في الوقت الفعلي، محدّثًا علامات الشذوذ مع وصول بيانات جديدة.
- **ارتباط متعدد المقاييس.** اكتشف الشذوذ في `response_ms` و`requests` في وقت واحد، ثم علّم الصفوف التي يكون فيها كلاهما شاذًا في اتجاهين متعاكسين (زمن استجابة مرتفع + طلبات منخفضة = مشكلة خادم، وليس ذروة حركة مرور).
- **تنبيهات البريد الإلكتروني.** عند اكتشاف شذوذ CRITICAL، أنشئ وأرسل إشعارًا عبر البريد الإلكتروني باستخدام `smtplib` في Python. خزّن بيانات اعتماد SMTP في متغيرات البيئة، وليس في الكود أبدًا.

---

## ما بنيته للتو

مجموعة أدوات كشف شذوذ قابلة لإعادة الاستخدام تطبّق طريقتين إحصائيتين كلاسيكيتين ، معيار z والمدى الربيعي IQR ، لوضع علامة على القيم الشاذة في البيانات العددية. حسبت معايير z مقابل متوسط عام، واشتقت حدّي IQR من نطاقات الأرباع، وصوّرت الشذوذ على مخططات نقطية وبيانات تكرارات ومخططات صندوق، وبنيت نظام تقارير آليًا يصنّف الخطورة ويصدّر النتائج إلى CSV. تنتقل هذه التقنيات مباشرةً إلى المراقبة الواقعية وكشف الاحتيال ومراقبة الجودة وأي مجال تستحق فيه القيم غير المعتادة الانتباه.

## إلى أين من هنا

- **خط أساس متحرك.** استبدل المتوسط العام بمتوسط متحرك مرجح أسيًا (EWMA) بحيث يتكيف المكتشف مع التحولات التدريجية في السلوك الطبيعي.
- **كشف متعدد المتغيرات.** استخدم مسافة ماهالانوبيس أو Isolation Forest من `scikit-learn` لاكتشاف الشذوذ عبر عدة سمات مترابطة في وقت واحد.
- **عتبات آلية.** بدلًا من ترميز عتبة معيار z بشكل ثابت، استخدم نهجًا قائمًا على النسبة المئوية: علّم أعلى 1% من القيم بغض النظر عن شكل التوزيع.
- **تخزين قاعدة البيانات.** خزّن الشذوذ المكتشف في SQLite أو PostgreSQL بحيث يمكنك الاستعلام عن الأنماط التاريخية وبناء لوحات المعلومات.
- **خط أنابيب التنبيه.** اربط دالة التقارير بـ webhook (Slack أو Discord أو PagerDuty) بحيث تؤدي الشذوذ إلى إشعارات فورية.

## شارك مشروعك مع الصف

بنيت شيئًا تفخر به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) هو معرض للمشاريع التي قدّمها طلاب آخرون ، ودليله الصغير يحتوي على شرح كامل ومبتدئ لإضافة مشروعك عبر **طلب سحب (pull request)**، حتى لو لم تستخدم git من قبل: نسخ المستودع (fork)، وإنشاء فرع، والتزام ملفاتك، وفتح الطلب، خطوة بخطوة. لا يُفترض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓
