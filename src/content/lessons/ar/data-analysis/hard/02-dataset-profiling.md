---

title: "تنميط مجموعة البيانات"
description: "تقييم البنية والأنواع والفقدان والتباين الفئوي ومشاكل جودة البيانات بشكل منهجي قبل أي تحليل."
module: "eda-framework"
order: 2
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "تنميط بنية مجموعة البيانات وأبعادها وأنواع أعمدةها في أقل من دقيقتين"
  - "كشف القيم المفقودة والتكرارات والأعمدة الثابتة والميزات عالية التباين الفئوي"
  - "استخدام pandas-profiling أو التنميط اليدوي لتوليد تقرير جودة بيانات كامل"
  - "توثيق نتائج التنميط كأساس للتحليل اللاحق"
prerequisites: ["01-framing-questions"]
tags: ["eda", "profiling", "data-quality", "pandas"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "hard"
quiz:
  - question: "تكتشف أن 40% من قيم عمود مفقودة. ما أول شيء يجب فعله؟"
    options:
      - text: "حذف جميع الصفوف ذات القيم المفقودة"
      - text: "ملؤها بالمتوسط"
      - text: "التحقق مما إذا كان الفقدان عشوائيًا أم منتظمًا"
        correct: true
      - text: "حذف العمود بالكامل"
  - question: "عمود فيه 10000 صف وقيمة فريدة واحدة فقط. ماذا يعني هذا؟"
    options:
      - text: "إنه عمود عالي التباين الفئوي"
      - text: "إنه عمود ثابت بلا قيمة تحليلية"
        correct: true
      - text: "يحتاج إلى تخصيص"
      - text: "إنه أهم عمود"
  - question: "ما الخطوة الأولى في تنميط مجموعة البيانات؟"
    options:
      - text: "بدء بناء النماذج"
      - text: "فحص shape و dtypes و head لإطار البيانات"
        correct: true
      - text: "حذف جميع القيم المفقودة"
      - text: "تطبيع جميع الأعمدة الرقمية"
---
التنميط هو التقييم المنهجي لمجموعة البيانات قبل بدء أي تحليل. يجيب عن الأسئلة الأساسية: كم عدد الصفوف؟ ما الأعمدة؟ أيها يفتقد البيانات؟ أيها زائد عن الحاجة؟ يعلمك هذا الدرس سير عمل تنميط قابلًا للتكرار يلتقط مشاكل جودة البيانات قبل أن تفسد نتائجك.

## المفاهيم الأساسية

### التنميط في 60 ثانية

عند أول تحميل لمجموعة بيانات، نفّذ هذا التسلسل للحصول على اتجاه:

```python
import pandas as pd

df = pd.read_csv("students-performance.csv")

# 1. Shape — how much data do we have?
print(f"Rows: {df.shape[0]}, Columns: {df.shape[1]}")

# 2. Column names and types
print(df.dtypes)

# 3. First and last rows
df.head(3)
df.tail(3)

# 4. Basic statistics for numerical columns
df.describe()

# 5. Categorical value counts
for col in df.select_dtypes(include="object").columns:
    print(f"\n{col}:")
    print(df[col].value_counts())
```

يمنحك هذا البنية وأنواع البيانات والتوزيعات الرقمية والتكرارات الفئوية ، كل ما تحتاجه لتقرر ما تفعله بعد ذلك.

### تقييم البيانات المفقودة

البيانات المفقودة هي مشكلة جودة البيانات الأكثر شيوعًا. اكشف عنها بشكل منهجي:

```python
# Count and percentage of missing values per column
missing = df.isnull().sum()
missing_pct = (missing / len(df) * 100).round(2)
missing_report = pd.DataFrame({
    "missing_count": missing,
    "missing_pct": missing_pct
})
print(missing_report[missing_report["missing_count"] > 0])
```

فسّر أنماط الفقدان:
- **MCAR (مفقود تمامًا بشكل عشوائي)**: لا علاقة للفقدان بأي متغير ، آمن لحذف الصفوف
- **MAR (مفقود عشوائيًا)**: يرتبط الفقدان بمتغيرات ملحوظة ، يمكن تخصيصه
- **MNAR (مفقود غير عشوائي)**: يرتبط الفقدان بالقيمة المفقودة نفسها ، يتطلب معرفة بالمجال

```python
# Visualize missing data with a heatmap
import seaborn as sns
import matplotlib.pyplot as plt

plt.figure(figsize=(10, 6))
sns.heatmap(df.isnull(), cbar=True, yticklabels=False, cmap="viridis")
plt.title("Missing Data Pattern")
plt.tight_layout()
plt.show()
```

### كشف التكرارات

تضخم التكرارات العدادية بصمت وتحرّف الإحصاءات:

```python
# Exact duplicates
n_dupes = df.duplicated().sum()
print(f"Exact duplicate rows: {n_dupes}")

# Near-duplicates on key columns
key_cols = ["gender", "race/ethnicity", "parental level of education"]
n_near = df.duplicated(subset=key_cols).sum()
print(f"Near-duplicates on demographic columns: {n_near}")
```

### الأعمدة الثابتة ومنخفضة التباين

الأعمدة ذات القيمة الفريدة الواحدة لا تحمل أي معلومات:

```python
# Find constant columns
constant_cols = [col for col in df.columns if df[col].nunique() == 1]
print(f"Constant columns: {constant_cols}")

# Find near-constant columns (>95% same value)
for col in df.columns:
    top_pct = df[col].value_counts(normalize=True).iloc[0]
    if top_pct > 0.95:
        print(f"  Near-constant: {col} — {top_pct:.1%} same value")
```

### تقييم التباين الفئوي

يمكن أن يسبب التباين الفئوي العالي (قيم فريدة كثيرة) في الأعمدة الفئوية فرط تخصيص في النماذج وتصويرًا فوضويًا:

```python
# Cardinality for each categorical column
cat_cols = df.select_dtypes(include="object").columns
for col in cat_cols:
    n_unique = df[col].nunique()
    print(f"{col}: {n_unique} unique values")
    if n_unique > 10:
        print(f"  WARNING: High cardinality — consider grouping")
```

### تقرير التنميط الكامل

اجمع كل شيء في دالة قابلة لإعادة الاستخدام:

```python
def profile_dataset(df, name="Dataset"):
    """Generate a complete profiling report for a DataFrame."""
    print(f"{'='*60}")
    print(f"  PROFILING REPORT: {name}")
    print(f"{'='*60}")

    # Structure
    print(f"\nSTRUCTURE")
    print(f"  Rows: {df.shape[0]:,}")
    print(f"  Columns: {df.shape[1]}")
    print(f"  Memory usage: {df.memory_usage(deep=True).sum() / 1e6:.2f} MB")

    # Types
    print(f"\nCOLUMN TYPES")
    print(df.dtypes.value_counts().to_string())

    # Missing
    missing = df.isnull().sum()
    if missing.any():
        print(f"\nMISSING VALUES")
        for col in missing[missing > 0].index:
            pct = missing[col] / len(df) * 100
            print(f"  {col}: {missing[col]:,} ({pct:.1f}%)")
    else:
        print(f"\nMISSING VALUES: None detected")

    # Duplicates
    n_dupes = df.duplicated().sum()
    print(f"\nDUPLICATES: {n_dupes} rows ({n_dupes/len(df)*100:.1f}%)")

    # Numerical summary
    num_df = df.select_dtypes(include="number")
    if not num_df.empty:
        print(f"\nNUMERICAL SUMMARY")
        print(num_df.describe().round(2).to_string())

    # Categorical summary
    cat_df = df.select_dtypes(include="object")
    if not cat_df.empty:
        print(f"\nCATEGORICAL SUMMARY")
        for col in cat_df.columns:
            n_unique = df[col].nunique()
            print(f"  {col}: {n_unique} unique values")

    print(f"\n{'='*60}")

# Usage:
# profile_dataset(df, "Students Performance")
```

## جرّب بنفسك

نمط مجموعة بيانات أداء الطلاب باستخدام سير العمل أعلاه. أجب عن هذه الأسئلة من مخرجات التنميط وحدها ، لا ترسم أي شيء بعد.

```python
import pandas as pd

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")

# Quick profile
print("Shape:", df.shape)
print("\nDtypes:\n", df.dtypes)
print("\nMissing:\n", df.isnull().sum())
print("\nNumerical stats:\n", df.describe())
print("\nCategorical values:")
for col in df.select_dtypes(include="object").columns:
    print(f"\n{col}:")
    print(df[col].value_counts())
```

أسئلة للإجابة:
1. كم عدد الصفوف والأعمدة؟
2. أي الأعمدة بها قيم مفقودة؟
3. كم عدد القيم الفريدة لكل عمود فئوي؟
4. ما أدنى وأعلى درجات الرياضيات؟
5. هل توجد أعمدة ثابتة أو شبه ثابتة؟

## خلاصات رئيسية

- نمّط قبل أن ترسم ، تمريرة تنميط مدتها 60 ثانية تلتقط مشاكل كانت ستضيع ساعات لاحقًا
- للبيانات المفقودة ثلاث آليات (MCAR, MAR, MNAR)؛ حدد أيها ينطبق قبل اختيار استراتيجية
- التكرارات والأعمدة الثابتة تقلل جودة التحليل بصمت
- التباين الفئوي مهم ، الفئات عالية التباين تحتاج إلى تجميع قبل التصوير
- ابنِ دالة تنميط قابلة لإعادة الاستخدام حتى تُعامل كل مجموعة بيانات جديدة بنفس المعالجة المنهجية

## تحدي التطبيق

اكتب دالة `quick_profile(df)` تُرجع قاموسًا بمفاتيح: `shape` و `dtypes` و `missing_cols` و `duplicate_count` و `constant_cols` و `cardinality`. اختبرها على مجموعة بيانات أداء الطلاب.

<details class="challenge">
<summary>🧩 التحدي ، فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

```python
import pandas as pd

def quick_profile(df):
    """Return a profiling summary dictionary."""
    missing = df.isnull().sum()
    return {
        "shape": df.shape,
        "dtypes": df.dtypes.value_counts().to_dict(),
        "missing_cols": {
            col: {"count": int(missing[col]), "pct": round(missing[col] / len(df) * 100, 2)}
            for col in missing[missing > 0].index
        },
        "duplicate_count": int(df.duplicated().sum()),
        "constant_cols": [col for col in df.columns if df[col].nunique() == 1],
        "cardinality": {
            col: df[col].nunique()
            for col in df.select_dtypes(include="object").columns
        },
    }

# students-performance.csv ships with the course — load it from the browser file system.
df = pd.read_csv("students-performance.csv")
report = quick_profile(df)

for key, value in report.items():
    print(f"\n{key}:")
    if isinstance(value, dict):
        for k, v in value.items():
            print(f"  {k}: {v}")
    elif isinstance(value, list):
        print(f"  {value if value else 'None'}")
    else:
        print(f"  {value}")
```

</div>
</details>
