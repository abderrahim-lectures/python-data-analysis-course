---

title: "التحليل العددي أحادي المتغير"
description: "حلّل التوزيعات والنزعة المركزية والانتشار وشكل المتغيرات الرقمية باستخدام المدرجات التكرارية ومخططات KDE والمخططات الصندوقية."
module: "univariate-analysis"
order: 3
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "حساب وتفسير المتوسط والوسيط والمنوال والانحراف المعياري والالتواء والتفرطح للأعمدة الرقمية"
  - "إنشاء المدرجات التكرارية ومخططات KDE والمخططات الصندوقية والكمانية باستخدام matplotlib و seaborn"
  - "قراءة أشكال التوزيع لتحديد الالتواء والتعددية والقيم الشاذة"
  - "اختيار نوع المخطط الصحيح بناءً على خصائص البيانات وأهداف التحليل"
prerequisites: ["02-dataset-profiling"]
tags: ["univariate", "matplotlib", "seaborn", "distributions", "histograms"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "hard"
quiz:
  - question: "ماذا يخبرك describe() عن عمود رقمي؟"
    options:
      - text: "المتوسط فقط"
      - text: "العدد والمتوسط والانحراف المعياري والأدنى والربيعيات والأقصى"
        correct: true
      - text: "الوسيط فقط"
      - text: "الانحراف المعياري فقط"
  - question: "متى يجب استخدام المدرج التكراري بدلًا من المخطط الصندوقي؟"
    options:
      - text: "إنهما قابلان للتبادل دائمًا"
      - text: "يعرض المدرج التكراري شكل التوزيع بينما يعرض المخطط الصندوقي القيم الشاذة والربيعيات"
        correct: true
      - text: "المخطط الصندوقي أفضل للبيانات الفئوية"
      - text: "المدرج التكراري أفضل لمجموعات البيانات الصغيرة"
  - question: "ماذا يشير التوزيع الملتوٍ؟"
    options:
      - text: "البيانات موزعة توزيعًا طبيعيًا"
      - text: "تتجمع معظم القيم في جهة واحدة مع ذيل في الجهة الأخرى"
        correct: true
      - text: "جميع القيم متساوية"
      - text: "لا توجد قيم شاذة"
---
يحلل التحليل العددي أحادي المتغير متغيرًا رقميًا واحدًا في كل مرة. الهدف هو فهم توزيعه: أين تتجمع القيم، ومدى انتشارها، وما إذا كان التوزيع متماثلًا أم ملتوًى، وما إذا كانت القيم الشاذة موجودة. يغطي هذا الدرس أنواع المخططات الأساسية والإحصاءات الملخصة للبيانات الرقمية.

## المفاهيم الأساسية

### الإحصاءات الملخصة

قبل الرسم، احسب الأرقام التي تصف التوزيع:

```python
import pandas as pd
import numpy as np

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

scores = df["math score"]

# Central tendency
print(f"Mean:   {scores.mean():.2f}")
print(f"Median: {scores.median():.2f}")

# Spread
print(f"Std:    {scores.std():.2f}")
print(f"IQR:    {scores.quantile(0.75) - scores.quantile(0.25):.2f}")
print(f"Range:  {scores.max() - scores.min()}")

# Shape
print(f"Skewness:  {scores.skew():.2f}")
print(f"Kurtosis:  {scores.kurtosis():.2f}")
```

التفسير:
- **الالتواء > 0**: ذيل ملتوٍ نحو اليمين (مثلًا: معظم الدرجات منخفضة وبعضها مرتفع جدًا)
- **الالتواء < 0**: ذيل ملتوٍ نحو اليسار (مثلًا: معظم الدرجات مرتفعة وبعضها منخفض جدًا)
- **التفرطح > 0**: ذيول ثقيلة (قيم شاذة أكثر من الطبيعي)
- **التفرطح < 0**: ذيول خفيفة (قيم شاذة أقل من الطبيعي)

### المدرجات التكرارية

المدرج التكراري هو أساس التحليل العددي أحادي المتغير. يعرض توزيع التكرارات:

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, axes = plt.subplots(1, 2, figsize=(12, 5))

# Basic histogram
axes[0].hist(scores, bins=20, edgecolor="black", alpha=0.7)
axes[0].set_title("Math Score Distribution (histogram)")
axes[0].set_xlabel("Math Score")
axes[0].set_ylabel("Frequency")

# Histogram with KDE overlay
sns.histplot(scores, kde=True, bins=20, ax=axes[1], color="steelblue")
axes[1].set_title("Math Score Distribution (histogram + KDE)")

plt.tight_layout()
plt.show()
```

قرارات رئيسية:
- **عدد السلات**: القليل جدًا يخفي التفاصيل، والكثير جدًا يولد ضجيجًا. `bins=20` إعداد افتراضي معقول لمجموعات بيانات تقل عن 10000 صف. استخدم `bins="auto"` للاختيار التلقائي.
- **لون الحواف**: `edgecolor="black"` يجعل حدود السلات مرئية.

### مخططات KDE (تقدير الكثافة بالنواة)

تنعّم مخططات KDE المدرج التكراري إلى منحنى متصل، مما يسهل مقارنة التوزيعات وتحديد التعددية:

```python
fig, ax = plt.subplots(figsize=(8, 5))

# Single KDE
sns.kdeplot(scores, fill=True, alpha=0.5, ax=ax)
ax.set_title("Math Score KDE")
ax.set_xlabel("Math Score")
plt.show()

# Compare distributions
fig, ax = plt.subplots(figsize=(8, 5))
for subject in ["math score", "reading score", "writing score"]:
    sns.kdeplot(df[subject], fill=True, alpha=0.3, label=subject, ax=ax)
ax.set_title("Score Distributions by Subject")
ax.legend()
plt.show()
```

### المخططات الصندوقية

تعرض المخططات الصندوقية الملخص الخماسي الأرقام (الأدنى، والربيع الأدنى، والوسيط، والربيع الأعلى، والأقصى) وتبرز القيم الشاذة:

```python
fig, ax = plt.subplots(figsize=(8, 5))

sns.boxplot(x=scores, ax=ax, color="lightblue", flierprops=dict(marker="o", markersize=5))
ax.set_title("Math Score Box Plot")
ax.set_xlabel("Math Score")
plt.show()
```

قراءة المخطط الصندوقي:
- **الصندوق**: المدى الربيعي (IQR) — الجزء الذي يضم 50% الأوسط من البيانات
- **الخط داخل الصندوق**: الوسيط
- **الشاربان**: 1.5 × IQR من الربيعين الأدنى والأعلى
- **النقاط خلف الشاربين**: قيم شاذة (عادةً > 1.5 × IQR)

### المخططات الكمانية

تجمع المخططات الكمانية بين المخطط الصندوقي ومخطط KDE، فتعرض إحصاءات الملخص والشكل الكامل للتوزيع معًا:

```python
fig, ax = plt.subplots(figsize=(8, 5))

sns.violinplot(x=scores, ax=ax, inner="quartile", color="lightgreen")
ax.set_title("Math Score Violin Plot")
ax.set_xlabel("Math Score")
plt.show()
```

يتحكم الوسيط `inner` في ما يُرسم داخل الكمان:
- `"quartile"`: يعرض خطوط الربيع الأدنى والوسيط والربيع الأعلى
- `"box"`: يعرض مخططًا صندوقيًا مصغرًا
- `"stick"`: يعرض جميع نقاط البيانات كعلامات قصيرة

### اختيار المخطط الصحيح

| المخطط | الأفضل لـ | يعرض |
|------|----------|-------|
| المدرج التكراري | توزيع التكرارات، الشكل | السلات والعدادات |
| KDE | التوزيع المنعم، مقارنة المجموعات | منحنى كثافة متصل |
| المخطط الصندوقي | إحصاءات الملخص، القيم الشاذة | الملخص الخماسي الأرقام |
| المخطط الكماني | التوزيع الكامل + الملخص | KDE + مخطط صندوقي مجتمعين |

### مقارنة التوزيعات عبر المجموعات

```python
fig, axes = plt.subplots(1, 3, figsize=(15, 5), sharey=True)

for i, subject in enumerate(["math score", "reading score", "writing score"]):
    sns.boxplot(data=df, x="gender", y=subject, ax=axes[i])
    axes[i].set_title(subject.replace(" score", " Scores").title())

plt.tight_layout()
plt.show()
```

## جرّب بنفسك

حلّل توزيع درجات القراءة من مجموعة بيانات أداء الطلاب.

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

reading = df["reading score"]

# Summary statistics
print("Summary Statistics:")
print(f"  Mean:   {reading.mean():.2f}")
print(f"  Median: {reading.median():.2f}")
print(f"  Std:    {reading.std():.2f}")
print(f"  Skew:   {reading.skew():.2f}")

# Distribution plots
fig, axes = plt.subplots(1, 3, figsize=(15, 5))

sns.histplot(reading, kde=True, bins=20, ax=axes[0], color="steelblue")
axes[0].set_title("Histogram + KDE")

sns.kdeplot(reading, fill=True, ax=axes[1], color="coral")
axes[1].set_title("KDE Only")

sns.boxplot(x=reading, ax=axes[2], color="lightgreen")
axes[2].set_title("Box Plot")

plt.tight_layout()
plt.show()
```

## خلاصات رئيسية

- احسب دائمًا الإحصاءات الملخصة قبل الرسم — فهي تخبرك بما تبحث عنه في المرئي
- تعرض المدرجات التكرارية التكرار؛ ومخططات KDE الكثافة؛ والمخططات الصندوقية إحصاءات الملخص؛ والمخططات الكمانية تجمع الاثنين
- يكشف الالتواء والتفرطح شكل التوزيع بالأرقام
- تجعل المخططات الصندوقية القيم الشاذة واضحة؛ وتكشف المدرجات التكرارية التعددية (أحادية الذروة مقابل ثنائية الذروة)
- قارن التوزيعات عبر المجموعات برسمها جنبًا إلى جنب بمحاور مشتركة

## تحدي التطبيق

أنشئ شكلًا واحدًا بأربعة مخططات فرعية يعرض توزيع `math score` باستخدام: (1) مدرج تكراري، (2) مخطط KDE، (3) مخطط صندوقي، و(4) مخطط كماني. أضف خطًا عموديًا عند المتوسط في كل مخطط. عيّن عنوان الشكل إلى "Math Score Distribution Analysis".

<details class="challenge">
<summary>🧩 التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

math = df["math score"]
mean_val = math.mean()

fig, axes = plt.subplots(2, 2, figsize=(12, 10))
fig.suptitle("Math Score Distribution Analysis", fontsize=14, fontweight="bold")

# Histogram
sns.histplot(math, kde=False, bins=20, ax=axes[0, 0], color="steelblue", edgecolor="black")
axes[0, 0].axvline(mean_val, color="red", linestyle="--", label=f"Mean: {mean_val:.1f}")
axes[0, 0].set_title("Histogram")
axes[0, 0].legend()

# KDE
sns.kdeplot(math, fill=True, ax=axes[0, 1], color="coral")
axes[0, 1].axvline(mean_val, color="red", linestyle="--", label=f"Mean: {mean_val:.1f}")
axes[0, 1].set_title("KDE Plot")
axes[0, 1].legend()

# Box plot
sns.boxplot(x=math, ax=axes[1, 0], color="lightgreen", flierprops=dict(marker="o", markersize=5))
axes[1, 0].axvline(mean_val, color="red", linestyle="--", label=f"Mean: {mean_val:.1f}")
axes[1, 0].set_title("Box Plot")
axes[1, 0].legend()

# Violin
sns.violinplot(x=math, ax=axes[1, 1], inner="quartile", color="lightyellow")
axes[1, 1].axvline(mean_val, color="red", linestyle="--", label=f"Mean: {mean_val:.1f}")
axes[1, 1].set_title("Violin Plot")
axes[1, 1].legend()

plt.tight_layout()
plt.show()
```

</div>
</details>
