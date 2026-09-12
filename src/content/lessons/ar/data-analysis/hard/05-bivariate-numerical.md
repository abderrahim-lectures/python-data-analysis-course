---

title: "التحليل الثنائي العددي"
description: "استكشف العلاقات بين متغيرين رقميين باستخدام المخططات المبعثرة وخطوط الانحدار والمقارنات المجمعة."
module: "bivariate-analysis"
order: 5
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "إنشاء المخططات المبعثرة ومخططات الانحدار والمخططات المشتركة لتصوير العلاقات الرقمية-الرقمية"
  - "تفسير خطوط الانحدار وقيم مربع R وأنماط البواقي"
  - "بناء المخططات الصندوقية والكمانية المجمعة للمقارنات الرقمية-الفئوية"
  - "تحديد العلاقات غير الخطية وعدم تجانس التباين والنقاط المؤثرة من المخططات"
prerequisites: ["04-univariate-categorical"]
tags: ["bivariate", "scatter-plots", "regression", "joint-plots", "seaborn"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "hard"
quiz:
  - question: "ماذا يكشف المخطط المبعثر عن متغيرين رقميين؟"
    options:
      - text: "توزيعهما الفردي"
      - text: "علاقتهما ونمط الارتباط بينهما"
        correct: true
      - text: "متوسط كل متغير فقط"
      - text: "عدد القيم المفقودة"
  - question: "ماذا يشير معامل ارتباط قدره −0.8؟"
    options:
      - text: "علاقة موجبة قوية"
      - text: "علاقة سالبة قوية"
        correct: true
      - text: "لا توجد علاقة"
      - text: "علاقة موجبة ضعيفة"
  - question: "متى يجب استخدام الخريطة الحرارية بدلًا من المخططات المبعثرة الفردية؟"
    options:
      - text: "عند امتلاك متغيرين فقط"
      - text: "عند رغبتك في رؤية الارتباطات عبر متغيرات كثيرة في وقت واحد"
        correct: true
      - text: "عند امتلاك بيانات فئوية فقط"
      - text: "عند وجود قيم مفقودة"
---
عندما تفحص كيف يرتبط متغيران رقميان ببعضهما، تدخل مجال التحليل الثنائي. يغطي هذا الدرس المخططات المبعثرة (محور العمل في التحليل الثنائي)، وخطوط الانحدار التي تكشف العلاقة كميًا، والمخططات المشتركة التي تجمع التوزيعات الحدية والمشتركة، والمخططات المجمعة التي تضيف بُعدًا فئويًا.

## المفاهيم الأساسية

### المخططات المبعثرة

المخطط المبعثر هو أكثر الرسومات ثنائية المتغير أساسية. تمثل كل نقطة ملاحظة واحدة، مرسومة على محورين رقميين:

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

fig, ax = plt.subplots(figsize=(8, 6))
ax.scatter(df["math score"], df["reading score"], alpha=0.5, edgecolors="black", linewidth=0.5)
ax.set_title("Math vs Reading Scores")
ax.set_xlabel("Math Score")
ax.set_ylabel("Reading Score")
plt.show()
```

الشفافية (alpha=0.5) أمر بالغ الأهمية ، فهي تكشف كثافة النقاط حيث تتداخل النقاط.

### مخططات الانحدار

يضيف `regplot` الخاص بـ seaborn خط انحدار يكشف العلاقة الخطية كميًا:

```python
fig, axes = plt.subplots(1, 3, figsize=(15, 5))

pairs = [
    ("math score", "reading score"),
    ("math score", "writing score"),
    ("reading score", "writing score"),
]

for i, (x, y) in enumerate(pairs):
    sns.regplot(data=df, x=x, y=y, ax=axes[i], scatter_kws={"alpha": 0.4})
    axes[i].set_title(f"{x.split()[0].title()} vs {y.split()[0].title()}")

plt.tight_layout()
plt.show()
```

قراءة مخطط الانحدار:
- **الميل**: الميل الموجب يعني ارتباطًا موجبًا؛ والأشد انحدارًا يعني الأقوى
- **فترة الثقة** (المنطقة المظللة): الأوسع تعني مزيدًا من عدم اليقين
- **البواقي**: النقاط البعيدة عن الخط تنبؤات سيئة

### المخططات المشتركة

تجمع المخططات المشتركة بين المخطط المبعثر والتوزيعات الحدية على كل محور:

```python
sns.jointplot(
    data=df,
    x="math score",
    y="reading score",
    kind="scatter",      # or "reg", "kde", "hist"
    height=7,
    alpha=0.4
)
plt.suptitle("Math vs Reading (Joint Plot)", y=1.02)
plt.show()
```

يغيّر الوسيط `kind` نوع المخطط المشترك:
- `"scatter"`: مبعثر خام مع مدرجات هامشية
- `"reg"`: مبعثر مع خط انحدار ومدرجات هامشية
- `"kde"`: كثافة نواة ثنائية الأبعاد مع KDE هامشي
- `"hist"`: مدرج تكراري ثنائي الأبعاد مع مدرجات هامشية

### مخططات Hexbin للكثافة

عندما تكون مجموعات البيانات كبيرة، تصبح المخططات المبعثرة مفرطة الترسم. مخططات hexbin تحل هذا:

```python
fig, ax = plt.subplots(figsize=(8, 6))
hb = ax.hexbin(df["math score"], df["reading score"], gridsize=20, cmap="YlOrRd")
ax.set_title("Math vs Reading (Hexbin Density)")
ax.set_xlabel("Math Score")
ax.set_ylabel("Reading Score")
plt.colorbar(hb, label="Count")
plt.show()
```

### المقارنات الرقمية-الفئوية

عندما يكون أحد المتغيرين فئويًا، قارن التوزيعات عبر المجموعات:

```python
fig, axes = plt.subplots(1, 3, figsize=(15, 5))

# Grouped box plots
sns.boxplot(data=df, x="gender", y="math score", ax=axes[0], palette="Set2")
axes[0].set_title("Math Scores by Gender")

# Grouped violin plots
sns.violinplot(data=df, x="lunch", y="reading score", ax=axes[1], palette="Set3")
axes[1].set_title("Reading Scores by Lunch Type")

# Grouped with multiple categories
sns.boxplot(
    data=df,
    x="test preparation course",
    y="writing score",
    hue="gender",
    ax=axes[2],
    palette="Set1"
)
axes[2].set_title("Writing Scores by Test Prep & Gender")

plt.tight_layout()
plt.show()
```

### مخططات السرب والمخططات الشريطية النقطية

لمجموعات البيانات الأصغر، اعرض النقاط الفردية باضطراب (jitter):

```python
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# Strip plot (jittered points)
sns.stripplot(data=df, x="gender", y="math score", ax=axes[0],
              alpha=0.3, jitter=True, palette="Set2")
axes[0].set_title("Math Scores — Strip Plot")

# Swarm plot (non-overlapping points — slower for large datasets)
sns.swarmplot(data=df, x="gender", y="math score", ax=axes[1],
              size=3, palette="Set2")
axes[1].set_title("Math Scores — Swarm Plot")

plt.tight_layout()
plt.show()
```

### تحديد العلاقات من المخططات

| النمط | ماذا يعني | المخطط الذي يجب استخدامه |
|---------|---------------|-------------|
| اتجاه خطي | تزداد المتغيرات معًا | مبعثر + مخطط انحدار |
| اتجاه غير خطي | تتغير العلاقة عبر النطاق | مبعثر مع LOWESS |
| عدم تجانس التباين | يتغير الانتشار عبر النطاق | مخطط البواقي |
| عناقيد | توجد مجموعات فرعية مميزة | مبعثر مع hue |
| قيم شاذة | نقاط بعيدة عن النمط | مبعثر مع تعليقات |

```python
# Highlighting clusters with hue
fig, ax = plt.subplots(figsize=(8, 6))
sns.scatterplot(
    data=df,
    x="math score",
    y="reading score",
    hue="gender",
    style="test preparation course",
    alpha=0.6,
    ax=ax
)
ax.set_title("Math vs Reading: Gender and Test Prep")
plt.show()
```

## جرّب بنفسك

استكشف العلاقة بين درجات الرياضيات والقراءة، مجمعة حسب الجنس والتحضير للاختبار.

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

# Scatter with regression
fig, axes = plt.subplots(1, 2, figsize=(14, 6))

sns.regplot(data=df, x="math score", y="reading score", ax=axes[0],
            scatter_kws={"alpha": 0.3}, line_kws={"color": "red"})
axes[0].set_title("Math vs Reading (Regression)")

sns.jointplot(data=df, x="math score", y="reading score",
              kind="kde", height=7)
plt.suptitle("Math vs Reading (Density)", y=1.02)
plt.show()

# Grouped comparison
fig, axes = plt.subplots(1, 2, figsize=(12, 5))
sns.boxplot(data=df, x="gender", y="math score", ax=axes[0], palette="Set2")
axes[0].set_title("Math by Gender")
sns.violinplot(data=df, x="lunch", y="math score", ax=axes[1], palette="Set3")
axes[1].set_title("Math by Lunch Type")
plt.tight_layout()
plt.show()
```

## خلاصات رئيسية

- المخططات المبعثرة هي أساس التحليل الثنائي؛ استخدم دائمًا الشفافية alpha للنقاط المتداخلة
- تكشف خطوط الانحدار العلاقات الخطية كميًا؛ وتعرض المنطقة المظللة عدم اليقين
- تجمع المخططات المشتركة المخططات المبعثرة مع التوزيعات الحدية لصورة كاملة
- تحل مخططات hexbin مشكلة الترسم الزائد لمجموعات البيانات الكبيرة بعرض الكثافة
- تقارن المخططات الصندوقية والكمانية المجمعة التوزيعات الرقمية عبر المجموعات الفئوية
- استخدم hue و style لإضافة أبعاد ثالثة ورابعة للمخططات المبعثرة

## تحدي التطبيق

أنشئ شكلًا بأربع لوحات تعرض: (1) مخططًا مبعثرًا لدرجات الرياضيات مقابل الكتابة، (2) مبعثرًا مع خط انحدار، (3) مخطط كثافة hexbin، و(4) مبعثرًا ملونًا حسب نوع الغداء. أضف عناوين وتسميات محاور مناسبة.

<details class="challenge">
<summary>🧩 التحدي ، فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

fig, axes = plt.subplots(2, 2, figsize=(14, 12))
fig.suptitle("Math vs Writing Scores — Four Views", fontsize=14, fontweight="bold")

# Panel 1: Basic scatter
axes[0, 0].scatter(df["math score"], df["writing score"], alpha=0.4, edgecolors="black", linewidth=0.5)
axes[0, 0].set_title("Basic Scatter")
axes[0, 0].set_xlabel("Math Score")
axes[0, 0].set_ylabel("Writing Score")

# Panel 2: Regression
sns.regplot(data=df, x="math score", y="writing score", ax=axes[0, 1],
            scatter_kws={"alpha": 0.3}, line_kws={"color": "red"})
axes[0, 1].set_title("With Regression Line")

# Panel 3: Hexbin
hb = axes[1, 0].hexbin(df["math score"], df["writing score"], gridsize=20, cmap="YlOrRd")
axes[1, 0].set_title("Hexbin Density")
axes[1, 0].set_xlabel("Math Score")
axes[1, 0].set_ylabel("Writing Score")
plt.colorbar(hb, ax=axes[1, 0], label="Count")

# Panel 4: Colored by lunch
sns.scatterplot(data=df, x="math score", y="writing score", hue="lunch",
                alpha=0.5, ax=axes[1, 1], palette="Set1")
axes[1, 1].set_title("Colored by Lunch Type")

plt.tight_layout()
plt.show()
```

</div>
</details>
