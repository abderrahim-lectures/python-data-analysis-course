---

title: "أنواع المخططات المتقدمة"
description: "ابنِ شبكات التقسيم وشبكات الأزواج والأشكال متعددة اللوحات وأنواع المخططات المدمجة للعروض متعددة المتغيرات المعقدة."
module: "storytelling-viz"
order: 7
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "إنشاء FacetGrid و catplot للمقارنات الفئوية متعددة اللوحات"
  - "بناء مخططات الأزواج وشبكات الأزواج بدوال قطرية وخارج القطر مخصصة"
  - "دمج أنواع مخططات متعددة في شكل واحد باستخدام gridspec و subplots"
  - "استخدام المحاور الداخلية والمحاور المزدوجة لعرض معلومات متعددة الطبقات"
prerequisites: ["06-correlation-analysis"]
tags: ["advanced-plots", "facetgrid", "pairgrid", "matplotlib", "seaborn"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "hard"
quiz:
  - question: "متى يجب استخدام المخطط الكماني بدلًا من المخطط الصندوقي؟"
    options:
      - text: "عندما تريد رؤية الشكل الكامل للتوزيع بما فيه الكثافة"
        correct: true
      - text: "عندما تملك بيانات فئوية فقط"
      - text: "عندما تريد إخفاء القيم الشاذة"
      - text: "عندما تملك أكثر من 10 مجموعات"
  - question: "ما ميزة المخططات المقسمة (faceted)؟"
    options:
      - text: "تستخدم ذاكرة أقل"
      - text: "تعرض المجموعات الفرعية جنبًا إلى جنب للمقارنة"
        correct: true
      - text: "تصلح مشاكل جودة البيانات تلقائيًا"
      - text: "تعمل مع البيانات الرقمية فقط"
  - question: "ما الذي ينشئه plt.subplot(2, 2, 1)؟"
    options:
      - text: "مخططًا واحدًا كبيرًا"
      - text: "شبكة مخططات 2x2 مع تفعيل الأول"
        correct: true
      - text: "شكلين منفصلين"
      - text: "مخططًا بمحورين وسلسلتين بيانات"
---
تكشف المخططات البسيطة علاقات فردية. تكشف الأشكال المتقدمة متعددة اللوحات هيكل مجموعة بياناتك بالكامل. يغطي هذا الدرس FacetGrid و PairGrid الخاصين بـ seaborn، و gridspec الخاص بـ matplotlib للتخطيطات المخصصة، وتقنيات دمج أنواع مخططات متعددة في شكل واحد.

## المفاهيم الأساسية

### FacetGrid للتقسيم الفئوي

يقسم FacetGrid البيانات بمتغير فئوي واحد أو أكثر وينشئ لوحة لكل توليفة:

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

# Single faceting variable
g = sns.FacetGrid(df, col="gender", row="lunch", height=4, aspect=1.2)
g.map(sns.histplot, "math score", kde=True, bins=15)
g.set_axis_labels("Math Score", "Count")
g.fig.suptitle("Math Score Distributions by Gender and Lunch Type", y=1.03)
plt.show()
```

### catplot (بديل أسهل لـ FacetGrid)

`catplot` واجهة أعلى مستوى تتعامل مع التقسيم تلقائيًا:

```python
# Count plot faceted by gender and test prep
sns.catplot(
    data=df,
    x="race/ethnicity",
    col="gender",
    hue="test preparation course",
    kind="count",
    height=5,
    aspect=1.2,
    palette="Set2"
)
plt.show()

# Box plot faceted by lunch type
sns.catplot(
    data=df,
    x="gender",
    y="math score",
    col="lunch",
    kind="box",
    height=5,
    aspect=0.8,
    palette="Set2"
)
plt.show()
```

### PairGrid للمخططات الزوجية المخصصة

يمنحك PairGrid تحكمًا كاملًا فيما يوضع على القطر والمثلث العلوي والمثلث السفلي:

```python
g = sns.PairGrid(
    df,
    vars=["math score", "reading score", "writing score"],
    hue="gender",
    height=3
)

# Diagonal: KDE
g.map_diag(sns.kdeplot, fill=True, alpha=0.5)

# Upper triangle: scatter
g.map_upper(sns.scatterplot, alpha=0.4)

# Lower triangle: regression
g.map_lower(sns.regplot, scatter_kws={"alpha": 0.3})

g.add_legend()
g.fig.suptitle("Custom Pair Grid: Scores by Gender", y=1.02)
plt.show()
```

### الأشكال متعددة اللوحات باستخدام gridspec

للتخطيطات التي تحتاج فيها المخططات الفرعية أحجامًا مختلفة، استخدم GridSpec:

```python
import matplotlib.gridspec as gridspec

fig = plt.figure(figsize=(14, 10))
gs = gridspec.GridSpec(2, 3, height_ratios=[1, 1.5], width_ratios=[1, 1, 1])

# Top row: three histograms
for i, subject in enumerate(["math score", "reading score", "writing score"]):
    ax = fig.add_subplot(gs[0, i])
    sns.histplot(df[subject], kde=True, ax=ax, bins=15, color="steelblue")
    ax.set_title(subject.replace(" score", " Scores"))

# Bottom row: wide scatter plot spanning two columns
ax_scatter = fig.add_subplot(gs[1, :2])
ax_scatter.scatter(df["math score"], df["reading score"], alpha=0.4, c="steelblue")
ax_scatter.set_title("Math vs Reading")
ax_scatter.set_xlabel("Math Score")
ax_scatter.set_ylabel("Reading Score")

# Bottom right: box plot
ax_box = fig.add_subplot(gs[1, 2])
sns.boxplot(data=df, x="gender", y="writing score", ax=ax_box, palette="Set2")
ax_box.set_title("Writing by Gender")

plt.tight_layout()
plt.show()
```

### دمج أنواع المخططات على محور واحد

اطوِ أنواع المخططات المختلفة طبقات لإضافة طبقات معلومات:

```python
fig, ax = plt.subplots(figsize=(10, 6))

# Layer 1: scatter
ax.scatter(df["math score"], df["reading score"], alpha=0.3, label="Students", c="steelblue")

# Layer 2: regression line
z = np.polyfit(df["math score"], df["reading score"], 1)
p = np.poly1d(z)
x_line = np.linspace(df["math score"].min(), df["math score"].max(), 100)
ax.plot(x_line, p(x_line), "r--", linewidth=2, label=f"Trend (slope={z[0]:.2f})")

# Layer 3: means
mean_math = df["math score"].mean()
mean_reading = df["reading score"].mean()
ax.axvline(mean_math, color="green", linestyle=":", alpha=0.7, label=f"Mean Math: {mean_math:.1f}")
ax.axhline(mean_reading, color="orange", linestyle=":", alpha=0.7, label=f"Mean Reading: {mean_reading:.1f}")

ax.set_title("Math vs Reading Scores with Trend and Means")
ax.set_xlabel("Math Score")
ax.set_ylabel("Reading Score")
ax.legend()
plt.show()
```

### المحاور الداخلية للعروض المكبّرة

اعرض عرضًا مكبّرًا لمنطقة داخل مخطط أكبر:

```python
from mpl_toolkits.axes_grid1.inset_locator import inset_axes

fig, ax = plt.subplots(figsize=(10, 6))
ax.scatter(df["math score"], df["reading score"], alpha=0.3, s=20)
ax.set_title("Math vs Reading (with inset zoom)")
ax.set_xlabel("Math Score")
ax.set_ylabel("Reading Score")

# Inset: zoom into the dense center region
axins = inset_axes(ax, width="40%", height="40%", loc="upper left")
axins.scatter(df["math score"], df["reading score"], alpha=0.3, s=10)
axins.set_xlim(50, 70)
axins.set_ylim(50, 70)
axins.set_title("Zoomed Region", fontsize=8)

plt.show()
```

### المحاور المزدوجة لمقاييس y المزدوجة

عندما يكون لمتغيرين مقاييس مختلفة لكنهما يتشاركان محور x:

```python
fig, ax1 = plt.subplots(figsize=(10, 6))

# Left y-axis
color1 = "steelblue"
ax1.hist(df["math score"], bins=20, alpha=0.6, color=color1, label="Math Score")
ax1.set_xlabel("Score")
ax1.set_ylabel("Math Score Count", color=color1)
ax1.tick_params(axis="y", labelcolor=color1)

# Right y-axis
ax2 = ax1.twinx()
color2 = "coral"
ax2.hist(df["reading score"], bins=20, alpha=0.6, color=color2, label="Reading Score")
ax2.set_ylabel("Reading Score Count", color=color2)
ax2.tick_params(axis="y", labelcolor=color2)

ax1.set_title("Math vs Reading Score Distributions (Dual Axis)")
fig.legend(loc="upper right", bbox_to_anchor=(0.9, 0.9))
plt.show()
```

## جرّب بنفسك

ابنِ شكلًا شاملاً متعدد اللوحات لمجموعة بيانات أداء الطلاب.

```python
import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

fig = plt.figure(figsize=(16, 12))
gs = gridspec.GridSpec(2, 3, hspace=0.35, wspace=0.3)

# Panel 1: Math score distribution by gender
ax1 = fig.add_subplot(gs[0, 0])
sns.histplot(data=df, x="math score", hue="gender", kde=True, ax=ax1, alpha=0.5, bins=15)
ax1.set_title("Math by Gender")

# Panel 2: Reading score distribution by lunch
ax2 = fig.add_subplot(gs[0, 1])
sns.violinplot(data=df, x="lunch", y="reading score", ax=ax2, palette="Set2")
ax2.set_title("Reading by Lunch Type")

# Panel 3: Ethnicity counts
ax3 = fig.add_subplot(gs[0, 2])
sns.countplot(data=df, x="race/ethnicity", ax=ax3, palette="Set3")
ax3.set_title("Ethnicity Distribution")
ax3.tick_params(axis="x", rotation=45)

# Panel 4: Math vs Writing scatter
ax4 = fig.add_subplot(gs[1, 0])
ax4.scatter(df["math score"], df["writing score"], alpha=0.3, c="steelblue")
ax4.set_title("Math vs Writing")
ax4.set_xlabel("Math Score")
ax4.set_ylabel("Writing Score")

# Panel 5: Correlation heatmap
ax5 = fig.add_subplot(gs[1, 1])
corr = df[["math score", "reading score", "writing score"]].corr()
sns.heatmap(corr, annot=True, fmt=".2f", cmap="RdBu_r", center=0,
            vmin=-1, vmax=1, square=True, ax=ax5, cbar_kws={"shrink": 0.8})
ax5.set_title("Correlation Matrix")

# Panel 6: Test prep comparison
ax6 = fig.add_subplot(gs[1, 2])
sns.boxplot(data=df, x="test preparation course", y="math score",
            hue="gender", ax=ax6, palette="Set1")
ax6.set_title("Test Prep Effect")

fig.suptitle("Students Performance — Multi-Panel Overview", fontsize=16, fontweight="bold", y=1.01)
plt.show()
```

## خلاصات رئيسية

- ينشئ FacetGrid و catplot عروضًا متعددة اللوحات مقسمة بمتغيرات فئوية — ضرورية لمقارنة التوزيعات عبر المجموعات
- يمنحك PairGrid تحكمًا كاملًا في أنواع المخططات على القطر والمثلثين العلوي والسفلي
- ينشئ GridSpec تخطيطات مخصصة تكون فيها المخططات الفرعية بأحجام مختلفة
- دمج أنواع المخططات على محور واحد (مبعثر + انحدار + متوسطات) يطوّي المعلومات بكفاءة
- تضيف المحاور الداخلية والمحاور المزدوجة عروضًا مكبّرة أو بمقياس مزدوج دون إنشاء أشكال جديدة

## تحدي التطبيق

أنشئ شكلًا 2×2: (1) FacetGrid لمدرجات توزيع درجات الرياضيات مقسمًا بالجنس، (2) PairGrid لجميع الدرجات الثلاث مع KDE على القطر ومبعثر أسفله، (3) مخططًا مدمجًا بعرض مبعثر + انحدار + متوسطات، و(4) خريطة حرارية للارتباط. عيّن عنوان شكل واحدًا شاملاً لجميع الألواح الأربعة.

<details class="challenge">
<summary>🧩 التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

```python
import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

fig = plt.figure(figsize=(16, 14))
gs = gridspec.GridSpec(2, 2, hspace=0.35, wspace=0.3)

# Panel 1: FacetGrid-like — math by gender (two histograms)
ax1 = fig.add_subplot(gs[0, 0])
for gender in df["gender"].unique():
    ax1.hist(df[df["gender"] == gender]["math score"], alpha=0.5, bins=15, label=gender)
ax1.set_title("Math Score by Gender")
ax1.set_xlabel("Math Score")
ax1.set_ylabel("Count")
ax1.legend()

# Panel 2: PairGrid-like — scatter below diagonal, KDE on diagonal
ax2 = fig.add_subplot(gs[0, 1])
ax2.scatter(df["math score"], df["reading score"], alpha=0.3, c="steelblue")
mean_m, mean_r = df["math score"].mean(), df["reading score"].mean()
ax2.axvline(mean_m, color="green", linestyle="--", alpha=0.7, label=f"Mean Math: {mean_m:.1f}")
ax2.axhline(mean_r, color="orange", linestyle="--", alpha=0.7, label=f"Mean Reading: {mean_r:.1f}")
ax2.set_title("Math vs Reading with Means")
ax2.set_xlabel("Math Score")
ax2.set_ylabel("Reading Score")
ax2.legend(fontsize=8)

# Panel 3: Scatter + regression + means
ax3 = fig.add_subplot(gs[1, 0])
sns.regplot(data=df, x="math score", y="writing score", ax=ax3,
            scatter_kws={"alpha": 0.3}, line_kws={"color": "red"})
ax3.set_title("Math vs Writing (Regression)")
ax3.set_xlabel("Math Score")
ax3.set_ylabel("Writing Score")

# Panel 4: Correlation heatmap
ax4 = fig.add_subplot(gs[1, 1])
corr = df[["math score", "reading score", "writing score"]].corr()
sns.heatmap(corr, annot=True, fmt=".2f", cmap="RdBu_r", center=0,
            vmin=-1, vmax=1, square=True, ax=ax4, linewidths=0.5)
ax4.set_title("Correlation Matrix")

fig.suptitle("Students Performance — Comprehensive Overview", fontsize=16, fontweight="bold", y=1.01)
plt.show()
```

</div>
</details>
