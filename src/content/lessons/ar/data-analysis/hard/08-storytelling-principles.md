---

title: "مبادئ سرد القصص بالبيانات"
description: "نظّم الروايات المرئية وعلّق على المخططات للوضوح وصمّم عروضًا تقديمية تقود إلى الفعل."
module: "storytelling-viz"
order: 8
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "تطبيق القوس السردي (الوضع → التعقيد → الحل) على عروض البيانات"
  - "استخدام التصميم المعتمد على التعليقات لجعل المخططات واضحة ذاتيًا"
  - "اختيار لوحات الألوان والعناوين والطباعة بعناية لتأثير جمهور مقصود"
  - "هيكلة لوحة تحكم متعددة المخططات ترشد المشاهد عبر قصة"
prerequisites: ["07-advanced-plots"]
tags: ["storytelling", "annotations", "color-palettes", "presentation", "dashboard"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "hard"
quiz:
  - question: "ما الهدف الرئيسي من سرد القصص بالبيانات؟"
    options:
      - text: "عرض جميع المخططات التي أنشأتها"
      - text: "توجيه الجمهور من البيانات إلى الرؤية إلى الفعل"
        correct: true
      - text: "استخدام أكثر التصويرات تعقيدًا ممكنة"
      - text: "عرض الأرقام الخام دون سياق"
  - question: "ما مبدأ «إذن ماذا؟» في عرض البيانات؟"
    options:
      - text: "اعرض البيانات ودع الجمهور يستنتج"
      - text: "لكل مخطط، اشرح ماذا يعني ولماذا يهم"
        correct: true
      - text: "استخدم المخططات الدائرية دائمًا"
      - text: "اجعل العروض قصيرة"
  - question: "لماذا يجب التصدير بالنتيجة الرئيسية بدلًا من المنهجية؟"
    options:
      - text: "المنهجية ليست مهمة"
      - text: "يحتاج صناع القرار إلى الاستنتاج أولًا والتفاصيل ثانيًا"
        correct: true
      - text: "يوفر الوقت في تصميم المخططات"
      - text: "يجعل التحليل أجمل"
---
المخطط الذي لا يقرؤه أحد أسوأ من عدم وجود مخطط. سرد القصص بالبيانات هو مهارة تحويل التحليل إلى رؤية تغير القرارات. يغطي هذا الدرس البنية السردية وتقنيات التعليقات وخيارات الألوان ومبادئ تصميم لوحات التحكم التي تجعل تصوراتك مقنعة.

## المفاهيم الأساسية

### القوس السردي

كل قصة بيانات تتبع بنية من ثلاثة أجزاء:

1. **الوضع**: ما السياق؟ ماذا يعرف الجمهور بالفعل؟
2. **التعقيد**: ما المشكلة أو المفاجأة أو التوتر الذي تكشفه البيانات؟
3. **الحل**: ماذا تقترح البيانات أن نفعل حيال ذلك؟

```python
# Example narrative for Students Performance analysis
narrative = {
    "situation": "We analyzed exam scores for 1000 students across math, reading, and writing.",
    "complication": "Students who didn't complete test preparation scored 7-10 points lower on average.",
    "resolution": "Expanding test preparation access could close the performance gap."
}
```

### التصميم المعتمد على التعليقات

أفضل المخططات تشرح نفسها دون تعليق توضيحي. أضف التعليقات مباشرة على المخطط:

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

fig, ax = plt.subplots(figsize=(10, 6))

# Box plot
sns.boxplot(data=df, x="test preparation course", y="math score", ax=ax, palette="Set2")

# Annotation: mean difference
mean_completed = df[df["test preparation course"] == "completed"]["math score"].mean()
mean_none = df[df["test preparation course"] == "none"]["math score"].mean()
diff = mean_completed - mean_none

ax.annotate(
    f"Average difference: +{diff:.1f} points",
    xy=(1, mean_completed),
    xytext=(0.5, mean_completed + 5),
    fontsize=12,
    fontweight="bold",
    color="darkgreen",
    arrowprops=dict(arrowstyle="->", color="darkgreen", lw=2),
    bbox=dict(boxstyle="round,pad=0.3", facecolor="lightyellow", edgecolor="darkgreen")
)

ax.set_title("Test Preparation Impact on Math Scores", fontsize=14, fontweight="bold")
ax.set_xlabel("Test Preparation Course")
ax.set_ylabel("Math Score")
plt.tight_layout()
plt.show()
```

### اختيار لوحات الألوان

اللون ليس زخرفة — إنه تواصل. اختر اللوحات حسب نوع بياناتك:

```python
# Sequential: for ordered data (low to high)
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

# Sequential
sns.color_palette("Blues_r", n_colors=5)
axes[0, 0].bar(range(5), range(5), color=sns.color_palette("Blues_r", 5))
axes[0, 0].set_title("Sequential (ordered)")

# Diverging: for data with a meaningful midpoint
sns.color_palette("RdBu_r", n_colors=5)
axes[0, 1].bar(range(5), [3, 1, 4, 2, 5], color=sns.color_palette("RdBu_r", 5))
axes[0, 1].set_title("Diverging (midpoint)")

# Qualitative: for categorical data
sns.color_palette("Set2", n_colors=5)
axes[1, 0].bar(range(5), [4, 2, 5, 3, 1], color=sns.color_palette("Set2", 5))
axes[1, 0].set_title("Qualitative (categorical)")

# Custom palette
custom = ["#2E86AB", "#A23B72", "#F18F01", "#C73E1D", "#3B1F2B"]
axes[1, 1].bar(range(5), [3, 5, 2, 4, 1], color=custom)
axes[1, 1].set_title("Custom Brand Palette")

plt.tight_layout()
plt.show()
```

قواعد الألوان:
- **التتابعية** للقيم الرقمية (الأغمق = الأعلى)
- **المتباعدة** عند المقارنة بنقطة منتصف (الأحمر = سيئ، الأزرق = جيد)
- **النوعية** للفئات (ألوان مميزة، بدون ترتيب متأصل)
- **لا تستخدم اللون أبدًا كترميز وحيد** — أضف دائمًا تسميات أو أنماطًا لسهولة الوصول للمصابين بعمى الألوان

### تصميم العنوان والعنوان الفرعي

العناوين الجيدة تذكر الرؤية، لا نوع المخطط:

```python
# Bad title
ax.set_title("Math Score Distribution by Gender")

# Good title
ax.set_title("Female Students Score 6 Points Higher on Reading Tests")

# Even better: subtitle with context
fig, ax = plt.subplots(figsize=(10, 6))
fig.suptitle("Gender Gap Varies by Subject", fontsize=16, fontweight="bold", y=1.02)
ax.set_title("Female students outperform in reading (+6.2) and writing (+5.6),\n"
             "while male students lead in math (+3.2)", fontsize=11, style="italic")
```

### هيكلة لوحة التحكم

لوحة التحكم مجموعة مخططات تحكي قصة متماسكة. نظمها كسرد:

```python
import matplotlib.gridspec as gridspec

fig = plt.figure(figsize=(16, 12))
gs = gridspec.GridSpec(3, 3, hspace=0.4, wspace=0.3, height_ratios=[0.5, 1.5, 1.5])

# Title banner
ax_title = fig.add_subplot(gs[0, :])
ax_title.axis("off")
ax_title.text(0.5, 0.5,
              "Students Performance in Exams — Key Findings",
              fontsize=18, fontweight="bold", ha="center", va="center",
              transform=ax_title.transAxes)
ax_title.text(0.5, 0.1,
              "Analysis of 1000 students across demographics and exam scores",
              fontsize=12, ha="center", va="center", style="italic",
              transform=ax_title.transAxes)

# Finding 1: Test prep impact
ax1 = fig.add_subplot(gs[1, 0])
sns.boxplot(data=df, x="test preparation course", y="math score",
            ax=ax1, palette="Set2")
ax1.set_title("Finding 1: Test Prep Boosts Scores", fontsize=10, fontweight="bold")

# Finding 2: Gender differences
ax2 = fig.add_subplot(gs[1, 1])
scores_by_gender = df.groupby("gender")[["math score", "reading score", "writing score"]].mean()
scores_by_gender.plot(kind="bar", ax=ax2, rot=0)
ax2.set_title("Finding 2: Gender Patterns by Subject", fontsize=10, fontweight="bold")
ax2.legend(fontsize=8)

# Finding 3: Lunch type matters
ax3 = fig.add_subplot(gs[1, 2])
sns.boxplot(data=df, x="lunch", y="math score", ax=ax3, palette="Set3")
ax3.set_title("Finding 3: Lunch Type Correlates with Scores", fontsize=10, fontweight="bold")

# Insight banner
ax_insight = fig.add_subplot(gs[2, :])
ax_insight.axis("off")
ax_insight.text(0.5, 0.5,
                "KEY INSIGHT: Test preparation and lunch type are the strongest predictors.\n"
                "Targeted interventions in these areas could improve outcomes for underserved students.",
                fontsize=14, ha="center", va="center",
                bbox=dict(boxstyle="round,pad=1", facecolor="lightyellow", edgecolor="orange"),
                transform=ax_insight.transAxes)

plt.tight_layout()
plt.show()
```

### التصميم المراعي للجمهور

صمّم لجمهورك:

| الجمهور | ما يهمهم | نهج التصميم |
|----------|---------------------|-----------------|
| التنفيذيون | المحصلة والإجراءات | رؤى جريئة، حد أدنى من التفاصيل |
| المحللون | المنهج والاستنساخ | الكود والإحصاءات والمنهجية |
| الجمهور العام | قصص واضحة بسيطة | مخططات أقل، لغة بسيطة |

```python
# Executive-friendly: big numbers with context
fig, axes = plt.subplots(1, 3, figsize=(14, 4))

metrics = {
    "Avg Math Score": df["math score"].mean(),
    "Avg Reading Score": df["reading score"].mean(),
    "Test Prep Effect": diff,
}

for i, (label, value) in enumerate(metrics.items()):
    axes[i].text(0.5, 0.6, f"{value:.1f}", fontsize=48, fontweight="bold",
                 ha="center", va="center", transform=axes[i].transAxes)
    axes[i].text(0.5, 0.2, label, fontsize=14,
                 ha="center", va="center", transform=axes[i].transAxes, style="italic")
    axes[i].axis("off")

plt.suptitle("Students Performance Dashboard — Executive Summary", fontsize=16, fontweight="bold")
plt.tight_layout()
plt.show()
```

## جرّب بنفسك

أنشئ مخططًا معلّقًا يحكي قصة بيانات عن مجموعة بيانات أداء الطلاب.

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

# Story: Test preparation closes the gap
fig, axes = plt.subplots(1, 2, figsize=(14, 6))
fig.suptitle("Test Preparation Impact Across Subjects", fontsize=16, fontweight="bold")

for i, subject in enumerate(["math score", "reading score", "writing score"]):
    means = df.groupby("test preparation course")[subject].mean()
    diff = means["completed"] - means["none"]

    sns.boxplot(data=df, x="test preparation course", y=subject,
                ax=axes[i], palette="Set2")
    axes[i].set_title(subject.replace(" score", "").title())

    axes[i].annotate(
        f"+{diff:.1f} points",
        xy=(1, means["completed"]),
        xytext=(1.3, means["completed"] + 2),
        fontsize=11, fontweight="bold", color="darkgreen",
        arrowprops=dict(arrowstyle="->", color="darkgreen"),
        bbox=dict(boxstyle="round,pad=0.3", facecolor="lightyellow", edgecolor="darkgreen")
    )

plt.tight_layout()
plt.show()
```

## خلاصات رئيسية

- اتبع القوس السردي: الوضع → التعقيد → الحل
- علّق على المخططات مباشرة — يجب أن يشرح المخطط نفسه دون تعليق توضيحي
- اختر لوحات الألوان حسب نوع البيانات: التتابعية للأوام المرتبة، والمتباعدة لمقارنات نقطة المنتصف، والنوعية للفئات
- يجب أن تذكر العناوين الرؤية، لا نوع المخطط
- نظم لوحات التحكم كقصص: عنوان رئيسي → أدلة → استنتاج
- صمّم لجمهورك — التنفيذيون يريدون رؤى، والمحللون يريدون منهجية

## تحدي التطبيق

أنشئ لوحة تحكم من ثلاث لوحات تحكي قصة عن الفجوة بين الجنسين في درجات الاختبارات: (1) مخطط شريطي مجمع لمتوسط الدرجات حسب الجنس والمادة، (2) مخطط صندوقي لفجوة الدرجات (الرياضيات ناقص الكتابة) حسب الجنس، و(3) لافتة رؤية تلخص الاستنتاج. استخدم التعليقات على كل مخطط.

<details class="challenge">
<summary>🧩 التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

fig = plt.figure(figsize=(16, 10))
gs = gridspec.GridSpec(2, 2, hspace=0.35, wspace=0.3, height_ratios=[1.5, 1])

# Panel 1: Grouped bar chart
ax1 = fig.add_subplot(gs[0, 0])
means = df.groupby("gender")[["math score", "reading score", "writing score"]].mean()
means.plot(kind="bar", ax=ax1, rot=0, colormap="Set2")
ax1.set_title("Average Scores by Gender and Subject", fontweight="bold")
ax1.set_ylabel("Mean Score")
ax1.legend(title="Subject")

# Panel 2: Score gap box plot
ax2 = fig.add_subplot(gs[0, 1])
df["math_writing_gap"] = df["math score"] - df["writing score"]
sns.boxplot(data=df, x="gender", y="math_writing_gap", ax=ax2, palette="Set1")
ax2.axhline(0, color="gray", linestyle="--", alpha=0.5)
ax2.set_title("Math-Writing Score Gap by Gender", fontweight="bold")
gap_means = df.groupby("gender")["math_writing_gap"].mean()
for i, gender in enumerate(["female", "male"]):
    ax2.annotate(
        f"Mean: {gap_means[gender]:+.1f}",
        xy=(i, gap_means[gender]),
        xytext=(i + 0.3, gap_means[gender] + 0.5),
        fontsize=10, fontweight="bold",
        arrowprops=dict(arrowstyle="->", color="black"),
    )

# Insight banner
ax_insight = fig.add_subplot(gs[1, :])
ax_insight.axis("off")
ax_insight.text(0.5, 0.5,
    "INSIGHT: Female students outperform in reading (+6.2) and writing (+5.6),\n"
    "while male students lead in math (+3.2). The math-writing gap is +8.8 for males\n"
    "and -5.0 for females — a 13.8 point swing. Interventions should target subject-specific gaps.",
    fontsize=13, ha="center", va="center",
    bbox=dict(boxstyle="round,pad=1", facecolor="lightyellow", edgecolor="orange"),
    transform=ax_insight.transAxes)

fig.suptitle("Gender Performance Gap — Data Story", fontsize=16, fontweight="bold", y=1.02)
plt.show()
```

</div>
</details>
