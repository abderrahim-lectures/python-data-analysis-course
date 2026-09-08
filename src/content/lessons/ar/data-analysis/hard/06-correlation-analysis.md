---

title: "تحليل الارتباط"
description: "احسب وتصوّر ارتباطات بيرسون وسبيرمان واكشف التعددية الخطية وفسّر مصفوفات الارتباط."
module: "bivariate-analysis"
order: 6
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "حساب معاملي ارتباط بيرسون وسبيرمان وتفسير قيمهما"
  - "بناء مصفوفات الارتباط والخرائط الحرارية لنظرة عامة على العلاقات متعددة المتغيرات"
  - "التمييز بين الارتباط والسببية وتحديد المتغيرات المربكة"
  - "كشف التعددية الخطية وتقرير متى يجب حذف الميزات المرتبطة أو دمجها"
prerequisites: ["05-bivariate-numerical"]
tags: ["correlation", "heatmap", "pearson", "spearman", "multicollinearity"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "hard"
quiz:
  - question: "ما الفرق بين ارتباط بيرسون وسبيرمان؟"
    options:
      - text: "يقيس بيرسون العلاقات الخطية بينما يقيس سبيرمان العلاقات الرتيبة"
        correct: true
      - text: "بيرسون أكثر دقة دائمًا"
      - text: "سبيرمان يعمل مع البيانات الثنائية فقط"
      - text: "لا يوجد فرق"
  - question: "ماذا يعني ارتباط قيمته 0؟"
    options:
      - text: "المتغيران متطابقان"
      - text: "لا توجد علاقة خطية بين المتغيرين"
        correct: true
      - text: "أحد المتغيرين صفر دائمًا"
      - text: "المتغيران مرتبطان تمامًا"
  - question: "لماذا يجب التحقق من التعددية الخطية؟"
    options:
      - text: "تجعل المخططات سيئة المظهر"
      - text: "يمكن للمتنبئات عالية الارتباط أن تزعزع استقرار النماذج الإحصائية"
        correct: true
      - text: "تقلل حجم العينة"
      - text: "تسبب قيمًا مفقودة"
---
يقيس الارتباط قوة العلاقة الخطية واتجاهها بين متغيرين رقميين. يغطي هذا الدرس ارتباطي بيرسون وسبيرمان، وكيفية بناء وقراءة الخرائط الحرارية للارتباط، وكيفية كشف التعددية الخطية — العدو الصامت لنماذج الانحدار.

## المفاهيم الأساسية

### ارتباط بيرسون

يقيس ارتباط بيرسون (r) الارتباط الخطي بين متغيرين مستمرين:

```python
import pandas as pd
import numpy as np

url = "https://raw.githubusercontent.com/rashida048/Datasets/master/StudentsPerformance.csv"
df = pd.read_csv(url)

# Compute Pearson correlation between two variables
r = df["math score"].corr(df["reading score"], method="pearson")
print(f"Pearson r (math vs reading): {r:.4f}")
```

تفسير r:
| النطاق | القوة | الاتجاه |
|-------|----------|-----------|
| 0.00 – 0.19 | ضعيف جدًا | — |
| 0.20 – 0.39 | ضعيف | — |
| 0.40 – 0.59 | متوسط | — |
| 0.60 – 0.79 | قوي | — |
| 0.80 – 1.00 | قوي جدًا | — |

تشير العلامة إلى الاتجاه: موجب (كلاهما يزداد معًا) أو سالب (يزداد أحدهما بينما ينقص الآخر).

### ارتباط سبيرمان

يقيس ارتباط سبيرمان (ρ) العلاقات الرتيبة — يعمل مع البيانات الترتبية ويتحمل القيم الشاذة:

```python
rho = df["math score"].corr(df["reading score"], method="spearman")
print(f"Spearman ρ (math vs reading): {rho:.4f}")

# Compare Pearson vs Spearman
pearson = df["math score"].corr(df["reading score"], method="pearson")
spearman = df["math score"].corr(df["reading score"], method="spearman")
print(f"Pearson: {pearson:.4f}  |  Spearman: {spearman:.4f}")
```

عندما يتباعد بيرسون وسبيرمان:
- **سبيرمان > بيرسون**: العلاقة رتيبة لكنها ليست خطية (منحنية)
- **بيرسون > سبيرمان**: القيم الشاذة تضخم الارتباط الخطي
- **متشابهان**: العلاقة خطية ورتيبة

### مصفوفة الارتباط

احسب الارتباطات لجميع الأعمدة الرقمية دفعة واحدة:

```python
# Full correlation matrix
num_cols = df.select_dtypes(include="number")
corr_matrix = num_cols.corr(method="pearson")
print(corr_matrix.round(3))
```

### التصوير بالخريطة الحرارية

تجعل الخريطة الحرارية مصفوفة الارتباط بصرية وقابلة للمسح:

```python
import seaborn as sns
import matplotlib.pyplot as plt

fig, ax = plt.subplots(figsize=(8, 6))
sns.heatmap(
    corr_matrix,
    annot=True,          # show correlation values
    fmt=".2f",           # two decimal places
    cmap="RdBu_r",       # red-blue diverging colormap
    center=0,            # center colormap at zero
    vmin=-1, vmax=1,     # full correlation range
    square=True,         # square cells
    linewidths=0.5,      # cell borders
    ax=ax
)
ax.set_title("Correlation Matrix — Students Performance")
plt.tight_layout()
plt.show()
```

### الخريطة الحرارية المثلثية (إزالة التكرار)

المصفوفة الكاملة متماثلة — المثلث العلوي يكرر المثلث السفلي. أزله:

```python
import numpy as np

mask = np.triu(np.ones_like(corr_matrix, dtype=bool))

fig, ax = plt.subplots(figsize=(8, 6))
sns.heatmap(
    corr_matrix,
    mask=mask,
    annot=True,
    fmt=".2f",
    cmap="RdBu_r",
    center=0,
    vmin=-1, vmax=1,
    square=True,
    linewidths=0.5,
    ax=ax
)
ax.set_title("Correlation Matrix (Lower Triangle)")
plt.tight_layout()
plt.show()
```

### مخطط الأزواج لنظرة متعددة المتغيرات

تعرض مخططات الأزواج كل علاقة ثنائية في شكل واحد:

```python
sns.pairplot(
    df,
    vars=["math score", "reading score", "writing score"],
    hue="gender",
    diag_kind="kde",
    plot_kws={"alpha": 0.4},
    height=3
)
plt.suptitle("Pair Plot: Scores by Gender", y=1.02)
plt.show()
```

### الارتباط لا يعني السببية

أهم تحذير في الإحصاء. ثلاثة أسباب تجعل الارتباط مضللًا:

1. **التشويش**: متغير ثالث يحرك كليهما. مثال: يرتبط تعليم الوالدين بدرجات الطلاب، لكن ربما يكون الدخل هو ما يحرك كليهما.
2. **السببية العكسية**: الاتجاه معكوس. مثال: هل يسبب التحضير للاختبار درجات أعلى، أم أن الطلاب أصحاب الدرجات العالية يختارون التحضير؟
3. **الارتباط الزائف**: متغيران غير مرتبطين يحدث بينهما ارتباط مصادفة. مثال: مبيعات الآيس كريم ومعدلات الغرق تزدادان معًا صيفًا (درجة الحرارة هي المربك).

```python
# Check for confounders
# Does the math-reading correlation change after controlling for gender?
for gender in df["gender"].unique():
    subset = df[df["gender"] == gender]
    r = subset["math score"].corr(subset["reading score"])
    print(f"{gender}: math-reading r = {r:.3f}")
```

### كشف التعددية الخطية

عندما تكون ميزتان أو أكثر في نموذج انحدار مرتبطتين ارتباطًا عاليًا، تضخم التعددية الخطية الأخطاء المعيارية وتجعل تقديرات المعاملات غير مستقرة.

قواعد سريعة:
- |r| > 0.7: حقّق — قد تحتاج إلى حذف متغير واحد
- |r| > 0.9: تعددية خطية خطيرة — احذف أو ادمج

```python
# Find highly correlated pairs
high_corr_pairs = []
for i in range(len(corr_matrix.columns)):
    for j in range(i+1, len(corr_matrix.columns)):
        if abs(corr_matrix.iloc[i, j]) > 0.7:
            high_corr_pairs.append((
                corr_matrix.columns[i],
                corr_matrix.columns[j],
                corr_matrix.iloc[i, j]
            ))

print("Highly correlated pairs (|r| > 0.7):")
for col1, col2, r in high_corr_pairs:
    print(f"  {col1} <-> {col2}: r = {r:.3f}")
```

## جرّب بنفسك

ابنِ تحليل ارتباط كاملًا لمجموعة بيانات أداء الطلاب.

```python
import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt

url = "https://raw.githubusercontent.com/rashida048/Datasets/master/StudentsPerformance.csv"
df = pd.read_csv(url)

num_cols = df.select_dtypes(include="number")
corr = num_cols.corr()

# Triangular heatmap
mask = np.triu(np.ones_like(corr, dtype=bool))
fig, ax = plt.subplots(figsize=(8, 6))
sns.heatmap(corr, mask=mask, annot=True, fmt=".2f", cmap="RdBu_r",
            center=0, vmin=-1, vmax=1, square=True, linewidths=0.5, ax=ax)
ax.set_title("Correlation Heatmap")
plt.tight_layout()
plt.show()

# Pair plot
sns.pairplot(df, vars=["math score", "reading score", "writing score"],
             hue="gender", diag_kind="kde", plot_kws={"alpha": 0.4}, height=3)
plt.suptitle("Pair Plot: Scores by Gender", y=1.02)
plt.show()

# Find high correlations
for i in range(len(corr.columns)):
    for j in range(i+1, len(corr.columns)):
        if abs(corr.iloc[i, j]) > 0.5:
            print(f"{corr.columns[i]} <-> {corr.columns[j]}: r = {corr.iloc[i, j]:.3f}")
```

## خلاصات رئيسية

- يقيس بيرسون الارتباط الخطي؛ ويقيس سبيرمان الارتباط الرتيب — استخدمهما معًا حين تكون العلاقة غير خطية
- تجعل الخرائط الحرارية مصفوفات الارتباط بصرية؛ والخرائط المثلثية تزيل المعلومات المكررة
- تقدم مخططات الأزواج نظرة متعددة المتغيرات كاملة مع التوزيعات الحدية
- الارتباط لا يعني السببية أبدًا — المتغيرات المربكة والسببية العكسية والارتباطات الزائفة ممكنة دائمًا
- التعددية الخطية (|r| > 0.7) تضخم الأخطاء المعيارية في نماذج الانحدار ويجب معالجتها

## تحدي التطبيق

احسب ارتباطي بيرسون وسبيرمان لجميع أزواج الدرجات. أنشئ شكلًا بخريطتين حراريتين جنبًا إلى جنب (واحدة لكل طريقة). علّق على الأزواج ذات أكبر تباين بين بيرسون وسبيرمان واشرح ماذا يعني ذلك التباين.

<details class="challenge">
<summary>🧩 التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

```python
import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt

url = "https://raw.githubusercontent.com/rashida048/Datasets/master/StudentsPerformance.csv"
df = pd.read_csv(url)

scores = df[["math score", "reading score", "writing score"]]

pearson_corr = scores.corr(method="pearson")
spearman_corr = scores.corr(method="spearman")

fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# Pearson
sns.heatmap(pearson_corr, annot=True, fmt=".3f", cmap="RdBu_r", center=0,
            vmin=-1, vmax=1, square=True, linewidths=0.5, ax=axes[0])
axes[0].set_title("Pearson Correlation")

# Spearman
sns.heatmap(spearman_corr, annot=True, fmt=".3f", cmap="RdBu_r", center=0,
            vmin=-1, vmax=1, square=True, linewidths=0.5, ax=axes[1])
axes[1].set_title("Spearman Correlation")

plt.tight_layout()
plt.show()

# Find discrepancies
mask = np.triu(np.ones_like(pearson_corr, dtype=bool))
diff = (pearson_corr - spearman_corr).abs()
for i in range(len(diff.columns)):
    for j in range(i+1, len(diff.columns)):
        d = diff.iloc[i, j]
        if d > 0.01:
            print(f"{diff.columns[i]} <-> {diff.columns[j]}: "
                  f"Pearson={pearson_corr.iloc[i,j]:.3f}, "
                  f"Spearman={spearman_corr.iloc[i,j]:.3f}, "
                  f"Diff={d:.3f}")
```

</div>
</details>