---

title: "التحليل الفئوي أحادي المتغير"
description: "حلّل توزيعات التكرار والنسب والأنماط في المتغيرات الفئوية باستخدام مخططات العد والمخططات الشريطية."
module: "univariate-analysis"
order: 4
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "حساب جداول التكرار والنسب والتكرارات التراكمية للمتغيرات الفئوية"
  - "إنشاء مخططات العد والمخططات الشريطية والمخططات الشريطية الأفقية باستخدام matplotlib و seaborn"
  - "التمييز بين المتغيرات الفئوية الاسمية والترتبية والثنائية"
  - "معالجة الفئات عالية التباين الفئوي بالتجميع وفلترة أفضل-N"
prerequisites: ["03-univariate-numerical"]
tags: ["univariate", "categorical", "count-plots", "bar-charts", "frequency"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "hard"
quiz:
  - question: "عمود فئوي فيه 50 قيمة فريدة. ما الذي يجب فعله قبل الرسم؟"
    options:
      - text: "رسم كل الفئات الخمسين في مخطط شريطي"
      - text: "تجميع الفئات النادرة في فئة أخرى وعرض أفضل N"
        correct: true
      - text: "تحويل العمود إلى قيمة رقمية"
      - text: "حذف العمود بالكامل"
  - question: "لماذا يجب فرز الفئات الترتبية صراحةً بدلًا من ترك pandas يفرزها أبجديًا؟"
    options:
      - text: "الترتيب الأبجدي دائمًا خاطئ"
      - text: "يحافظ على ترتيب الرتبة المنطقي الذي يكشف الأنماط ذات المعنى"
        correct: true
      - text: "يجعل ألوان المخطط أجمل"
      - text: "يمنع القيم المفقودة"
  - question: "ما الفرق بين البيانات الفئوية الاسمية والترتبية؟"
    options:
      - text: "الاسمية أرقام والترتبية نصوص"
      - text: "الترتبية ترتيب طبيعي للرتب، والاسمية لا تملكها"
        correct: true
      - text: "الاسمية دائمًا ثنائية"
      - text: "الترتبية لا يمكن أن تكون إلا 3 فئات"
---
تصف المتغيرات الفئوية المجموعات أو الفئات أو التسميات — الجنس، والعرق/الأصل، ونوع الغداء، ومستوى التعليم. على عكس البيانات الرقمية، لا يمكنك حساب المتوسطات والانحرافات المعيارية. بدلًا من ذلك، تحلل التكرارات والنسب والمنوال. يغطي هذا الدرس الأدوات والتقنيات لفهم البيانات الفئوية.

## المفاهيم الأساسية

### جداول التكرار

أساس التحليل الفئوي هو جدول التكرار:

```python
import pandas as pd

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

# Absolute frequencies
print("Gender counts:")
print(df["gender"].value_counts())

# Relative frequencies (proportions)
print("\nGender proportions:")
print(df["gender"].value_counts(normalize=True).round(3))

# Parental education — ordinal, so sort logically
edu_order = [
    "some high school",
    "high school",
    "some college",
    "associate's degree",
    "master's degree",
    "bachelor's degree",
]
print("\nParental education:")
print(df["parental level of education"].value_counts().reindex(edu_order))
```

### الاسمي مقابل الترتبي مقابل الثنائي

تحديد نوع المتغير الفئوي يحدد كيف تحلله وتصوّره:

| النوع | الوصف | المثال | التحليل |
|------|-------------|---------|----------|
| **ثنائي** | فئتان | الجنس | النسبة، نسبة الأرجحية |
| **اسمي** | لا يوجد ترتيب طبيعي | العرق/الأصل | التكرار، المنوال |
| **ترتبي** | يوجد ترتيب طبيعي | مستوى التعليم | الفئة الوسيطة، ارتباط الرتب |

تحتاج المتغيرات الترتبية إلى ترتيب صريح — لا تدع pandas يفرزها أبجديًا:

```python
import seaborn as sns
import matplotlib.pyplot as plt

# Without ordering — misleading
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

sns.countplot(data=df, x="parental level of education", ax=axes[0])
axes[0].set_title("Without explicit order")
axes[0].tick_params(axis="x", rotation=45)

# With ordering — correct
sns.countplot(
    data=df,
    x="parental level of education",
    order=edu_order,
    ax=axes[1],
    palette="viridis"
)
axes[1].set_title("With explicit order")
axes[1].tick_params(axis="x", rotation=45)

plt.tight_layout()
plt.show()
```

### مخططات العد باستخدام seaborn

مخططات العد هي المعادل الفئوي للمدرجات التكرارية — تعرض التكرارات:

```python
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

# Binary variable
sns.countplot(data=df, x="gender", ax=axes[0, 0], palette="Set2")
axes[0, 0].set_title("Gender Distribution")

# Nominal variable
sns.countplot(data=df, x="race/ethnicity", ax=axes[0, 1], palette="Set3")
axes[0, 1].set_title("Ethnicity Distribution")

# Ordinal variable
sns.countplot(
    data=df,
    x="parental level of education",
    order=edu_order,
    ax=axes[1, 0],
    palette="viridis"
)
axes[1, 0].set_title("Parental Education Level")
axes[1, 0].tick_params(axis="x", rotation=45)

# Binary with hue
sns.countplot(data=df, x="test preparation course", hue="gender", ax=axes[1, 1], palette="Set1")
axes[1, 1].set_title("Test Prep by Gender")

plt.tight_layout()
plt.show()
```

### المخططات الشريطية الأفقية

عندما تكون تسميات الفئات طويلة، تحسّن الأشرطة الأفقية سهولة القراءة:

```python
# Ethnicity with horizontal bars
ethnicity_counts = df["race/ethnicity"].value_counts()

fig, ax = plt.subplots(figsize=(8, 5))
ethnicity_counts.plot(kind="barh", ax=ax, color="steelblue", edgecolor="black")
ax.set_title("Ethnicity Distribution")
ax.set_xlabel("Count")
ax.set_ylabel("Ethnicity Group")
plt.show()
```

### مخططات النسب

عندما تختلف أحجام العينات، تكون النسب أكثر إفادة من الأعداد:

```python
# Proportion by gender
gender_prop = df["gender"].value_counts(normalize=True)

fig, axes = plt.subplots(1, 2, figsize=(12, 5))

# Bar chart of proportions
gender_prop.plot(kind="bar", ax=axes[0], color=["#4ECDC4", "#FF6B6B"], edgecolor="black")
axes[0].set_title("Gender Proportions")
axes[0].set_ylabel("Proportion")
axes[0].set_ylim(0, 1)

# Pie chart (use sparingly — bar charts are almost always better)
axes[1].pie(gender_prop, labels=gender_prop.index, autopct="%1.1f%%", colors=["#4ECDC4", "#FF6B6B"])
axes[1].set_title("Gender Split")

plt.tight_layout()
plt.show()
```

### معالجة الفئات عالية التباين الفئوي

عندما يحتوي عمود فئوي على قيم فريدة كثيرة، جمّع الفئات النادرة في فئة "أخرى":

```python
def top_n_with_other(series, n=5):
    """Keep top n categories, merge the rest into 'Other'."""
    top = series.value_counts().head(n).index
    return series.where(series.isin(top), other="Other")

# Example with education level
df["education_grouped"] = top_n_with_other(df["parental level of education"], n=4)

print(df["education_grouped"].value_counts())

fig, ax = plt.subplots(figsize=(8, 5))
sns.countplot(data=df, x="education_grouped", palette="pastel", ax=ax)
ax.set_title("Parental Education (Top 4 + Other)")
plt.show()
```

### إضافة العدادات على الأشرطة

إضافة الأعداد على الأشرطة يجعل المخططات واضحة ذاتيًا:

```python
fig, ax = plt.subplots(figsize=(8, 5))
counts = df["race/ethnicity"].value_counts()
bars = ax.bar(counts.index, counts.values, color=sns.color_palette("Set3", len(counts)), edgecolor="black")

for bar in bars:
    height = bar.get_height()
    ax.text(
        bar.get_x() + bar.get_width() / 2.,
        height + 0.5,
        f"{int(height)}",
        ha="center",
        va="bottom",
        fontweight="bold"
    )

ax.set_title("Ethnicity Distribution with Counts")
ax.set_ylabel("Count")
plt.show()
```

## جرّب بنفسك

حلّل المتغيرات الفئوية في مجموعة بيانات أداء الطلاب.

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

cat_cols = ["gender", "race/ethnicity", "parental level of education",
            "lunch", "test preparation course"]

# Frequency tables
for col in cat_cols:
    print(f"\n{col}:")
    print(df[col].value_counts())

# Visualize all categorical variables
fig, axes = plt.subplots(2, 3, figsize=(15, 10))
axes = axes.flatten()

for i, col in enumerate(cat_cols):
    sns.countplot(data=df, x=col, ax=axes[i], palette="Set2")
    axes[i].set_title(col.title())
    axes[i].tick_params(axis="x", rotation=45)

# Hide unused subplot
axes[5].set_visible(False)

plt.tight_layout()
plt.show()
```

## خلاصات رئيسية

- جداول التكرار هي أساس التحليل الفئوي — احسبها دائمًا أولًا
- ميّز بين المتغيرات الاسمية والترتبية والثنائية؛ تحتاج المتغيرات الترتبية إلى ترتيب صريح
- المخططات الشريطية الأفقية أفضل من الرأسية عندما تكون تسميات الفئات طويلة
- استخدم النسب بدلًا من الأعداد عند مقارنة مجموعات مختلفة الأحجام
- جمّع الفئات النادرة في فئة "أخرى" عندما يكون التباين الفئوي مرتفعًا
- أضف الأعداد على الأشرطة لتجعل المخططات واضحة ذاتيًا

## تحدي التطبيق

أنشئ شكلًا يعرض توزيع أنواع `lunch` مع أشرطة ملونة حسب إتمام `test preparation course`. أضف تعليقات الأعداد إلى كل قطاع شريطي. ثم احسب نسبة الطلاب الذين أتموا التحضير للاختبار لكل نوع غداء.

<details class="challenge">
<summary>🧩 التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

fig, ax = plt.subplots(figsize=(8, 6))
sns.countplot(data=df, x="lunch", hue="test preparation course", ax=ax, palette="Set1")
ax.set_title("Lunch Type by Test Preparation Completion")
ax.set_xlabel("Lunch Type")
ax.set_ylabel("Count")
ax.legend(title="Test Prep")

# Add count annotations
for container in ax.containers:
    ax.bar_label(container, fontweight="bold")

plt.tight_layout()
plt.show()

# Proportions
print("\nTest prep completion by lunch type:")
print(df.groupby("lunch")["test preparation course"].value_counts(normalize=True).round(3))
```

</div>
</details>
