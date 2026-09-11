---
title: "معالج الجداول الإلكترونية"
description: "أداة سطر أوامر تقرأ ملفات CSV و Excel وتستكشف البيانات وتحولها وتصدّر النتائج."
tags: ["pandas", "csv", "data-analysis", "cli"]
difficulty: beginner
estimatedMinutes: 45
xpReward: 50
prerequisites: ["أساسيات بايثون (المتغيرات، الحلقات، الدوال، القواميس)", "أساسيات pandas"]
---

# معالج الجداول الإلكترونية

- **شغّله في المتصفح.** هناك دفتر ملاحظات تفاعلي جاهز — افتحه على Colab أو Kaggle أو Binder وتابع خطوة بخطوة.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/spreadsheet-tool/notebook.ar.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/spreadsheet-tool/notebook.ar.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fspreadsheet-tool%2Fnotebook.ar.ipynb)

## ما ستبنيه

أداة سطر أوامر تقرأ ملفات CSV و Excel وتستكشف البيانات وتحولها وتصدّر النتائج. على طول الطريق، ستتعلّم سير عمل pandas الأساسي الذي يدعم تقريبًا كل مهمة تحليل بيانات.

### لماذا هذا المشروع؟

يقضي كل محلل بيانات وعالم ومهندس وقتًا في التعامل مع الجداول الإلكترونية. يعلّمك هذا المشروع أساسيات pandas التي تستبدل ساعات من العمل اليدوي على الجداول بأسطر قليلة من الكود القابل لإعادة الإنتاج. ستبني أداة CLI قابلة لإعادة الاستخدام يمكنك توجيهها إلى أي CSV والبدء بالعمل فورًا.

### ما ستتعلمه

- قراءة ملفات CSV و Excel مع اكتشاف تلقائي للترميز
- استكشاف البيانات الجدولية وتلخيصها بسرعة
- تصفية البيانات وفرزها وتجميعها وتمييزها (pivot)
- تنظيف البيانات الفوضوية (القيم المفقودة والأنواع الخاطئة والمسافات البيضاء الزائدة)
- تصدير النتائج إلى CSV و Excel و JSON
- تغليف كل ذلك في قائمة تفاعلية

---

## الخطوة 1: قراءة ملفات CSV

### الهدف

حمّل ملف CSV إلى DataFrame في pandas، مع التعامل مع ترميزات ومحددات مختلفة، ثم معاينة الصفوف الأولى.

### المفهوم

تبدو ملفات CSV بسيطة، لكنها تأتي بنكهات عديدة. بعضها يستخدم الفواصل، وبعضها الفواصل المنقوطة. بعض الملفات UTF-8، وبعضها Latin-1. قبل أن تتمكن من تحليل أي شيء، تحتاج إلى معرفة ما تتعامل معه. يمنحنا pandas الأدوات، لكن يجب أن نكتب غلافًا صغيرًا لتجربة خيارات مختلفة حتى يعمل أحدها.

### الكود العملي

أنشئ ملفًا باسم `spreadsheet_processor.py`:

```python
import pandas as pd
import sys
import json
from pathlib import Path


def detect_encoding(filepath):
    """Try common encodings and return the first one that works."""
    encodings = ["utf-8", "latin-1", "cp1252", "iso-8859-1"]
    for enc in encodings:
        try:
            with open(filepath, "r", encoding=enc) as f:
                f.read(1024)  # Read a chunk to test
            return enc
        except (UnicodeDecodeError, UnicodeError):
            continue
    return "utf-8"  # Fallback


def detect_delimiter(filepath, encoding):
    """Peek at the first line to guess the delimiter."""
    delimiters = [",", ";", "\t", "|"]
    with open(filepath, "r", encoding=encoding) as f:
        first_line = f.readline()

    counts = {d: first_line.count(d) for d in delimiters}
    best = max(counts, key=counts.get)
    return best if counts[best] > 0 else ","


def read_csv_file(filepath):
    """Read a CSV with auto-detected encoding and delimiter."""
    path = Path(filepath)
    if not path.exists():
        print(f"Error: File '{filepath}' not found.")
        sys.exit(1)

    encoding = detect_encoding(path)
    delimiter = detect_delimiter(path, encoding)

    print(f"  Encoding:  {encoding}")
    print(f"  Delimiter: {repr(delimiter)}")

    df = pd.read_csv(path, encoding=encoding, sep=delimiter)
    return df


# --- Demo ---
if __name__ == "__main__":
    # Create a sample CSV for testing
    sample_data = """Name,Age,City,Score
Alice,30,New York,85.5
Bob,25,San Francisco,92.3
Charlie,35,Chicago,78.1
Diana,28,Boston,95.0
Eve,32,New York,88.7"""

    sample_path = "sample_data.csv"
    with open(sample_path, "w") as f:
        f.write(sample_data)

    print(f"Reading: {sample_path}")
    df = read_csv_file(sample_path)
    print(f"\nShape: {df.shape[0]} rows x {df.shape[1]} columns\n")
    print(df.to_string(index=False))
```

### الناتج المتوقع

```
Reading: sample_data.csv
  Encoding:  utf-8
  Delimiter: ','

Shape: 5 rows x 4 columns

    Name  Age         City  Score
  Alice   30     New York   85.5
    Bob   25  San Francisco   92.3
Charlie   35      Chicago   78.1
  Diana   28       Boston   95.0
    Eve   32     New York   88.7
```

### إذا لم يعمل

- **`FileNotFoundError`** — مسار الملف خاطئ. استخدم `Path(filepath).resolve()` للحصول على المسار المطلق وتحقق منه مرة أخرى.
- **`ParserError: Error tokenizing`** — اختار اكتشاف المحدد حرفًا خاطئًا. جرّب تمرير `sep=None` و`engine="python"` إلى `pd.read_csv`، أو حدد المحدد يدويًا.
- **أحرف مشوّهة** — اختار اكتشاف الترميز ترميزًا خاطئًا. افتح الملف في محرر نصوص وتحقق من ترميزه ومرره مباشرة إلى `pd.read_csv(encoding=...)`.

---

## الخطوة 2: استكشاف البيانات

### الهدف

استخدم طرق التلخيص في pandas لفهم شكل بياناتك وأنواعها وإحصاءاتها قبل فعل أي شيء آخر.

### المفهوم

أول شيء تفعله بعد تحميل البيانات هو النظر إليها. كم عدد الصفوف والأعمدة؟ ما أنواع البيانات؟ هل توجد أعمدة رقمية للحساب عليها؟ أي قيم مفقودة؟ لدى pandas طرق مدمجة تجيب عن هذه الأسئلة في ثوانٍ.

### الكود العملي

أضف هذه الدالة إلى `spreadsheet_processor.py`:

```python
def explore_data(df):
    """Print a quick summary of the DataFrame."""
    print(f"\n{'='*50}")
    print("DATA EXPLORATION")
    print(f"{'='*50}")

    print(f"\nShape: {df.shape[0]} rows, {df.shape[1]} columns")

    print(f"\nColumn types:")
    for col in df.columns:
        print(f"  {col:<20} {str(df[col].dtype):<10} "
              f"({df[col].nunique()} unique)")

    print(f"\nMissing values:")
    missing = df.isnull().sum()
    if missing.any():
        for col, count in missing[missing > 0].items():
            print(f"  {col}: {count} ({count/len(df)*100:.1f}%)")
    else:
        print("  None")

    print(f"\nNumeric summary:")
    numeric_cols = df.select_dtypes(include="number")
    if not numeric_cols.empty:
        print(numeric_cols.describe().round(2).to_string())
    else:
        print("  No numeric columns found.")
```

### الناتج المتوقع

```
==================================================
DATA EXPLORATION
==================================================

Shape: 5 rows, 4 columns

Column types:
  Name                 object     (5 unique)
  Age                  int64      (5 unique)
  City                 object     (4 unique)
  Score                float64    (5 unique)

Missing values:
  None

Numeric summary:
         Age  Score
count   5.0    5.0
mean   30.0   87.92
std     3.5    6.26
min    25.0   78.10
25%    28.0   85.50
50%    30.0   88.70
75%    32.0   92.30
max    35.0   95.00
```

### إذا لم يعمل

- **كل الأعمدة من نوع `object`** — خُزّنت الأرقام كسلاسل نصية (ربما بفواصل أو علامات دولار). ستصلح هذا في الخطوة 5 بـ `pd.to_numeric`.
- **`describe()` لا يعرض شيئًا** — لا توجد أعمدة رقمية. تحقق مما إذا كانت البيانات تحمّلت بشكل صحيح وما إذا كان تحويل النوع مطلوبًا.
- **تظهر القيم المفقودة بشكل غير متوقع** — يعامل pandas `""` و`"NA"` و`"N/A"` و`"null"` على أنها NaN افتراضيًا. مرر `na_values=["your_marker"]` إلى `read_csv` إذا كانت بياناتك تستخدم علامة مختلفة.

---

## الخطوة 3: التصفية والفرز

### الهدف

استخرج مجموعات فرعية من البيانات بترشيح قائم على الشروط ورتّبها بعمود واحد أو أكثر.

### المفهوم

تسمح لك التصفية بسحب صفوف العناية فقط. يدعم pandas مناهج متعددة: الفهرسة المنطقية (الأكثر شيوعًا)، وطريقة `.query()` للتعبيرات المقروءة، و`loc`/`iloc` للوصول القائم على التسميات والمواضع. يعيد الفرز ترتيب البيانات بحيث تصبح الأنماط مرئية.

### الكود العملي

أضف هذه الدوال إلى `spreadsheet_processor.py`:

```python
def filter_data(df, column, operator, value):
    """Filter rows based on a condition.

    Args:
        df: pandas DataFrame
        column: column name to filter on
        operator: one of '==', '!=', '>', '<', '>=', '<=', 'contains'
        value: the value to compare against
    """
    if column not in df.columns:
        print(f"Error: Column '{column}' not found.")
        print(f"Available columns: {', '.join(df.columns)}")
        return df

    # Try to cast value to the column's dtype for proper comparison
    col_dtype = df[column].dtype
    try:
        if col_dtype in ("int64", "int32"):
            value = int(value)
        elif col_dtype in ("float64", "float32"):
            value = float(value)
    except (ValueError, TypeError):
        pass  # Keep as string

    ops = {
        "==": df[column] == value,
        "!=": df[column] != value,
        ">":  df[column] > value,
        "<":  df[column] < value,
        ">=": df[column] >= value,
        "<=": df[column] <= value,
        "contains": df[column].astype(str).str.contains(value, case=False, na=False),
    }

    if operator not in ops:
        print(f"Error: Unknown operator '{operator}'. Use: {', '.join(ops.keys())}")
        return df

    mask = ops[operator]
    result = df[mask]
    print(f"\nFiltered: {len(result)} rows match '{column} {operator} {value}'")
    return result


def sort_data(df, columns, ascending=True):
    """Sort by one or more columns.

    Args:
        columns: list of column names
        ascending: True for ascending, False for descending
                   Can also be a list matching the columns list
    """
    invalid = [c for c in columns if c not in df.columns]
    if invalid:
        print(f"Error: Columns not found: {', '.join(invalid)}")
        return df

    result = df.sort_values(by=columns, ascending=ascending)
    direction = "ascending" if ascending else "descending"
    print(f"\nSorted by {', '.join(columns)} ({direction})")
    return result
```

### الناتج المتوقع

```python
# Filter: People older than 28
filtered = filter_data(df, "Age", ">", 28)
print(filtered.to_string(index=False))

# Output:
# Filtered: 3 rows match 'Age > 28'
#     Name  Age         City  Score
#   Alice   30     New York   85.5
# Charlie   35      Chicago   78.1
#     Eve   32     New York   88.7

# Sort by Score descending
sorted_df = sort_data(filtered, ["Score"], ascending=False)
print(sorted_df.to_string(index=False))

# Output:
# Sorted by Score (descending)
#     Name  Age         City  Score
#     Eve   32     New York   88.7
#   Alice   30     New York   85.5
# Charlie   35      Chicago   78.1
```

### إذا لم يعمل

- **TypeError عند المقارنة** — العمود رقمي لكنك مررت سلسلة نصية (أو العكس). يعالج التحويل التلقائي في `filter_data` الحالات الشائعة، لكن الصيغ غير المعتادة قد تحتاج تحويلًا يدويًا أولًا.
- **يعود التصفية فارغًا** — تحقق من `df[column].unique()` لرؤية القيم الفعلية. المسافات البيضاء واختلافات حالة الأحرف أو الأنواع غير المتوقعة أسباب شائعة.
- **يرفع `sort_values` KeyError** — أخطأت في كتابة اسم عمود. استخدم `df.columns.tolist()` للتحقق.

---

## الخطوة 4: تجميع البيانات

### الهدف

لخّص البيانات بـ groupby والجداول المحورية (pivot) والجداول المتقاطعة (crosstab) للعثور على أنماط عبر الفئات.

### المفهوم

يقرّب التجميع صفوفًا كثيرة إلى إحصاءات تلخيصية. يقسم Groupby البيانات بفئة، ويطبق دالة (مجموع أو متوسط أو عدّ)، ويعيد دمج النتائج. تعيد الجداول المحورية تشكيل البيانات بحيث تصبح الفئات أعمدة. تعدّ الجداول المتقاطعة حدوثات مشتركة بين متغيرين قاطعين.

### الكود العملي

أضف هذه الدوال إلى `spreadsheet_processor.py`:

```python
def aggregate_groupby(df, group_col, agg_col, func="mean"):
    """Group by one column and aggregate another.

    Args:
        group_col: column to group by
        agg_col: column to aggregate
        func: aggregation function ('mean', 'sum', 'count', 'min', 'max', 'median')
    """
    if group_col not in df.columns:
        print(f"Error: Column '{group_col}' not found.")
        return None
    if agg_col not in df.columns:
        print(f"Error: Column '{agg_col}' not found.")
        return None

    agg_map = {
        "mean": "mean", "sum": "sum", "count": "count",
        "min": "min", "max": "max", "median": "median",
    }
    if func not in agg_map:
        print(f"Error: Unknown function '{func}'. Use: {', '.join(agg_map.keys())}")
        return None

    result = df.groupby(group_col)[agg_col].agg(agg_map[func]).reset_index()
    result.columns = [group_col, f"{agg_col}_{func}"]
    print(f"\nGrouped by '{group_col}', {func} of '{agg_col}':")
    return result


def make_pivot(df, index_col, columns_col, values_col, aggfunc="mean"):
    """Create a pivot table.

    Args:
        index_col: column for rows
        columns_col: column for columns
        values_col: column for values
        aggfunc: aggregation function
    """
    for col in [index_col, columns_col, values_col]:
        if col not in df.columns:
            print(f"Error: Column '{col}' not found.")
            return None

    result = pd.pivot_table(
        df, index=index_col, columns=columns_col,
        values=values_col, aggfunc=aggfunc, fill_value=0,
    )
    print(f"\nPivot table: rows={index_col}, cols={columns_col}, values={values_col}")
    return result


def make_crosstab(df, col1, col2):
    """Create a frequency crosstab between two categorical columns."""
    for col in [col1, col2]:
        if col not in df.columns:
            print(f"Error: Column '{col}' not found.")
            return None

    result = pd.crosstab(df[col1], df[col2], margins=True, margins_name="Total")
    print(f"\nCrosstab: {col1} vs {col2}")
    return result
```

### الناتج المتوقع

```python
# Extend sample data for better aggregation examples
extra_data = """Name,Age,City,Score,Department
Frank,40,Chicago,72.0,Engineering
Grace,29,Boston,91.5,Engineering
Heidi,33,New York,85.0,Marketing
Ivan,27,San Francisco,88.0,Marketing
Judy,31,Chicago,79.5,Marketing"""

extra_path = "sample_data_extra.csv"
with open(extra_path, "w") as f:
    f.write(extra_data)

df = read_csv_file(extra_path)

# Groupby
result = aggregate_groupby(df, "City", "Score", "mean")
print(result.to_string(index=False))

# Output:
# Grouped by 'City', mean of 'Score':
#          City  Score_mean
#       Boston       91.50
#      Chicago       75.75
#     New York       85.00
# San Francisco       88.00

# Crosstab
crosstab = make_crosstab(df, "City", "Department")
print(crosstab.to_string())
```

### إذا لم يعمل

- **يعيد `groupby` شكلًا غير متوقع** — قد تجمّع بعمود يملك عددًا كبيرًا جدًا من القيم الفريدة. تحقق بـ `df[group_col].nunique()`.
- **يُظهر الجدول المحوري أصفارًا فقط** — يستبدل `fill_value=0` قيمة NaN. إذا لم تكن لمجموعات كثيرة قيم لهذه الفئة، فهذا صحيح. أزل `fill_value` لرؤية NaN بدلًا من ذلك.
- **لجدول المتقاطع صفوف كثيرة جدًا** — عدد كبير جدًا من القيم الفريدة في عمود واحد. فكّر في تقسيم البيانات الرقمية بـ `pd.cut()` أولًا.

---

## الخطوة 5: تنظيف البيانات

### الهدف

تعامل مع القيم المفقودة، وأزل المسافات البيضاء، وحوّل الأنواع، وأزل التكرارات.

### المفهوم

البيانات الحقيقية فوضوية. للأسماء مسافات لاحقة، والأرقام مخزّنة كسلاسل نصية، وبعض الخلايا فارغة، وتتسلل الصفوف المكررة. غالبًا ما يكون تنظيف البيانات 80% من العمل. الخبر السار: يجعل pandas هذه العمليات مباشرة بمجرد معرفة الأنماط.

### الكود العملي

أضف هذه الدوال إلى `spreadsheet_processor.py`:

```python
def clean_data(df, options=None):
    """Apply common data cleaning operations.

    Args:
        options: dict with keys:
            - drop_duplicates: bool (default True)
            - strip_whitespace: bool (default True)
            - fill_na_strategy: str ('drop', 'mean', 'median', 'mode', 'ffill', or a literal value)
            - fix_numeric: list of columns to force numeric
    """
    if options is None:
        options = {}

    original_shape = df.shape
    log = []

    # Strip whitespace from string columns
    if options.get("strip_whitespace", True):
        str_cols = df.select_dtypes(include="object").columns
        for col in str_cols:
            df[col] = df[col].astype(str).str.strip()
        log.append(f"Stripped whitespace from {len(str_cols)} string columns")

    # Fix numeric columns
    for col in options.get("fix_numeric", []):
        if col in df.columns:
            before = df[col].dtype
            df[col] = pd.to_numeric(df[col], errors="coerce")
            coerced = df[col].isnull().sum() - df[col].isna().sum()
            log.append(f"Converted '{col}': {before} -> {df[col].dtype}")

    # Handle missing values
    fill_strategy = options.get("fill_na_strategy", "drop")
    missing_before = df.isnull().sum().sum()

    if fill_strategy == "drop":
        df = df.dropna()
        log.append(f"Dropped rows with missing values")
    elif fill_strategy == "mean":
        numeric_cols = df.select_dtypes(include="number").columns
        df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())
        log.append(f"Filled numeric NaN with column means")
    elif fill_strategy == "median":
        numeric_cols = df.select_dtypes(include="number").columns
        df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())
        log.append(f"Filled numeric NaN with column medians")
    elif fill_strategy == "mode":
        for col in df.columns:
            if df[col].isnull().any():
                mode_val = df[col].mode()
                if not mode_val.empty:
                    df[col] = df[col].fillna(mode_val.iloc[0])
        log.append(f"Filled NaN with column modes")
    elif fill_strategy == "ffill":
        df = df.ffill()
        log.append(f"Forward-filled missing values")
    else:
        df = df.fillna(fill_strategy)
        log.append(f"Filled NaN with literal: '{fill_strategy}'")

    missing_after = df.isnull().sum().sum()

    # Drop duplicates
    if options.get("drop_duplicates", True):
        before = len(df)
        df = df.drop_duplicates()
        removed = before - len(df)
        if removed:
            log.append(f"Removed {removed} duplicate rows")

    print(f"\n{'='*50}")
    print("CLEANING SUMMARY")
    print(f"{'='*50}")
    print(f"  Original shape: {original_shape}")
    print(f"  Final shape:    {df.shape}")
    print(f"  Missing before: {missing_before}")
    print(f"  Missing after:  {missing_after}")
    for entry in log:
        print(f"  - {entry}")

    return df.reset_index(drop=True)
```

### الناتج المتوقع

```python
# Create messy data
messy_data = """Name,Age,City,Score
  Alice ,30, New York ,85.5
Bob,25,San Francisco,92.3
Charlie,,Chicago,78.1
Diana,28,  Boston,95.0
Alice ,30, New York ,85.5
Eve,thirty-two,New York,88.7"""

messy_path = "messy_data.csv"
with open(messy_path, "w") as f:
    f.write(messy_data)

df = read_csv_file(messy_path)
df = clean_data(df, {
    "strip_whitespace": True,
    "fix_numeric": ["Age"],
    "fill_na_strategy": "mean",
    "drop_duplicates": True,
})

# Output:
# ==================================================
# CLEANING SUMMARY
# ==================================================
#   Original shape: (6, 4)
#   Final shape:    (4, 4)
#   Missing before: 1
#   Missing after:  0
#   - Stripped whitespace from 3 string columns
#   - Converted 'Age': object -> float64
#   - Filled numeric NaN with column means
#   - Removed 1 duplicate rows
```

### إذا لم يعمل

- **يحوّل `to_numeric` كثيرًا إلى NaN** — يحتوي العمود على نص غير رقمي (مثل "thirty-two"). تحقق من `df[col].unique()` قبل التحويل، وقرر ما إذا كنت ستسقط القيم السيئة أو تستبدلها.
- **لا تُزال المسافات البيضاء بالكامل** — قد تكون هناك مسافات غير منقطعة (`\xa0`) أو علامات تبويب. استخدم `df[col].str.replace(r'\s+', ' ', regex=True)` للتنظيف العدواني.
- **لا تُزال التكرارات** — تختلف الصفوف في عمود واحد على الأقل. استخدم `df.duplicated(subset=["col1", "col2"])` للتحقق من التشابه في أعمدة محددة.

---

## الخطوة 6: تصدير النتائج

### الهدف

احفظ DataFrames المعالجة إلى صيغ CSV و Excel (مع openpyxl) و JSON.

### المفهوم

بعد تحويل البيانات، تحتاج إلى إخراجها. CSV عالمي لكنه يفقد التنسيق. يحافظ Excel على البنية ويمكن أن يتضمن عدة أوراق. JSON مثالي لتطبيقات الويب وواجهات البرمجة. لكل صيغة مقايضات، ويدعم pandas الثلاث جميعها.

### الكود العملي

أضف هذه الدوال إلى `spreadsheet_processor.py`:

```python
def export_csv(df, filepath):
    """Export DataFrame to CSV."""
    df.to_csv(filepath, index=False)
    size = Path(filepath).stat().st_size
    print(f"  CSV saved: {filepath} ({size} bytes, {len(df)} rows)")


def export_excel(df, filepath, sheet_name="Sheet1"):
    """Export DataFrame to Excel with openpyxl.

    Requires: pip install openpyxl
    """
    try:
        import openpyxl  # noqa: F401
    except ImportError:
        print("Error: openpyxl not installed. Run: pip install openpyxl")
        return

    df.to_excel(filepath, index=False, sheet_name=sheet_name, engine="openpyxl")
    size = Path(filepath).stat().st_size
    print(f"  Excel saved: {filepath} ({size} bytes, sheet='{sheet_name}')")


def export_json(df, filepath, orient="records"):
    """Export DataFrame to JSON.

    Orient options:
        'records' -> [{"col": val}, ...]  (most common for APIs)
        'index'   -> {0: {"col": val}, ...}
        'columns' -> {"col": {0: val}, ...}
        'split'   -> {"columns": [...], "index": [...], "data": [...]}
    """
    df.to_json(filepath, orient=orient, indent=2, force_ascii=False)
    size = Path(filepath).stat().st_size
    print(f"  JSON saved: {filepath} ({size} bytes, orient='{orient}')")


def export_all(df, base_name="output"):
    """Export to all three formats at once."""
    print(f"\nExporting '{base_name}'...")
    export_csv(df, f"{base_name}.csv")
    export_excel(df, f"{base_name}.xlsx")
    export_json(df, f"{base_name}.json")
```

### الناتج المتوقع

```
Exporting 'output'...
  CSV saved: output.csv (198 bytes, 4 rows)
  Excel saved: output.xlsx (5120 bytes, sheet='Sheet1')
  JSON saved: output.json (423 bytes, orient='records')
```

### إذا لم يعمل

- **`ModuleNotFoundError: No openpyxl`** — ثبّته: `pip install openpyxl`. إنه غير مدمج مع pandas.
- **ملف Excel تالف** — ربما تستبدل ملفًا مفتوحًا في Excel. أغلقه أولًا، أو استخدم اسم ملف مختلفًا.
- **JSON يحتوي سلاسل `NaN`** — يسلسل pandas NaN كـ `null` افتراضيًا، لكن بعض الإعدادات تختلف. مرر `default_handler=str` أو نظف NaN قبل التصدير.
- **CSV به شرط مائلة أو اقتباسات إضافية** — تحقق من معاملي `quoting` و`escapechar`. تعالج الافتراضيات معظم الحالات، لكن الأسطر الجديدة المدمجة في الخلايا قد تسبب مشاكل.

---

## الخطوة 7: بناء قائمة CLI

### الهدف

غلّف كل العمليات في قائمة تفاعلية بحيث يمكن للمستخدم تحميل البيانات واستكشافها وتصفيتها وفرزها وتجميعها وتنظيفها وتصديرها دون تعديل الكود.

### المفهوم

تربط قائمة CLI كل شيء معًا. يختار المستخدم رقمًا، ويقدم الوسائط، ويستدعي البرنامج الدالة الصحيحة. هذا النمط شائع لأدوات البيانات لأنه يجعل الأداة في متناول من لا يريدون كتابة Python.

### الكود العملي

أضف القائمة الرئيسية إلى `spreadsheet_processor.py`:

```python
def print_menu():
    """Print the main menu."""
    print(f"\n{'='*50}")
    print("  SPREADSHEET PROCESSOR")
    print(f"{'='*50}")
    print("  1. Load CSV file")
    print("  2. Explore data")
    print("  3. Filter rows")
    print("  4. Sort data")
    print("  5. Aggregate (groupby)")
    print("  6. Clean data")
    print("  7. Export results")
    print("  8. Show current data")
    print("  0. Quit")
    print(f"{'='*50}")


def get_input(prompt, cast=str, default=None):
    """Get input with optional type casting and default value."""
    suffix = f" [{default}]" if default is not None else ""
    raw = input(f"{prompt}{suffix}: ").strip()
    if not raw and default is not None:
        return cast(default) if cast else default
    return cast(raw) if cast else raw


def run_menu():
    """Run the interactive CLI menu."""
    df = None

    while True:
        print_menu()
        choice = get_input("Choice", str, "0")

        if choice == "0":
            print("Goodbye!")
            break

        elif choice == "1":
            path = get_input("File path")
            df = read_csv_file(path)
            print(f"\nLoaded {df.shape[0]} rows x {df.shape[1]} columns")

        elif choice == "2":
            if df is None:
                print("Load a file first (option 1).")
                continue
            explore_data(df)

        elif choice == "3":
            if df is None:
                print("Load a file first.")
                continue
            col = get_input("Column to filter on")
            op = get_input("Operator (==, !=, >, <, >=, <=, contains)", str, "==")
            val = get_input("Value")
            df = filter_data(df, col, op, val)
            print(df.to_string(index=False))

        elif choice == "4":
            if df is None:
                print("Load a file first.")
                continue
            cols = get_input("Columns (comma-separated)")
            col_list = [c.strip() for c in cols.split(",")]
            asc = get_input("Ascending? (y/n)", str, "y").lower() == "y"
            df = sort_data(df, col_list, asc)
            print(df.to_string(index=False))

        elif choice == "5":
            if df is None:
                print("Load a file first.")
                continue
            group = get_input("Group by column")
            agg = get_input("Aggregate column")
            func = get_input("Function (mean, sum, count, min, max)", str, "mean")
            result = aggregate_groupby(df, group, agg, func)
            if result is not None:
                print(result.to_string(index=False))

        elif choice == "6":
            if df is None:
                print("Load a file first.")
                continue
            strategy = get_input(
                "Missing value strategy (drop, mean, median, mode, ffill)", str, "drop"
            )
            df = clean_data(df, {
                "strip_whitespace": True,
                "fill_na_strategy": strategy,
                "drop_duplicates": True,
            })
            print(df.to_string(index=False))

        elif choice == "7":
            if df is None:
                print("Load a file first.")
                continue
            base = get_input("Output base name", str, "output")
            export_all(df, base)

        elif choice == "8":
            if df is None:
                print("Load a file first.")
                continue
            print(df.to_string(index=False))

        else:
            print("Invalid choice. Try again.")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Non-interactive mode: load a file and explore
        df = read_csv_file(sys.argv[1])
        explore_data(df)
    else:
        # Interactive mode
        run_menu()
```

### الناتج المتوقع

```
==================================================
  SPREADSHEET PROCESSOR
==================================================
  1. Load CSV file
  2. Explore data
  3. Filter rows
  4. Sort data
  5. Aggregate (groupby)
  6. Clean data
  7. Export results
  8. Show current data
  0. Quit
==================================================
Choice [0]: 1
File path: sample_data.csv
  Encoding:  utf-8
  Delimiter: ','

Loaded 5 rows x 4 columns
Choice [0]: 2

==================================================
DATA EXPLORATION
==================================================
...
```

### إذا لم يعمل

- **تدور القائمة إلى ما لا نهاية** — تحقق من وجود `break` في فرع الإنهاء. تحتاج حلقة `while True` إلى مخرج صريح.
- **تحجب `input()` في البيئات غير التفاعلية** — استخدم `sys.stdin.isatty()` لاكتشاف ما إذا كنت في طرفية، وارجع إلى إدخال قائم على الملفات أو الوسائط.
- **تُفقد الحالة بين التشغيلات** — هذا متوقع. القائمة عديمة الحالة؛ كل تشغيل يبدأ من جديد. للاستمرارية، يمكنك إضافة وظيفة حفظ/تحميل باستخدام JSON.

---

## قائمة التحقق

بعد إكمال كل الخطوات، تحقق مما يلي:

- [ ] يكتشف `read_csv_file` الترميز والمحدد تلقائيًا
- [ ] يُظهر `explore_data` الشكل والأنواع والقيم المفقودة والإحصاءات
- [ ] يدعم `filter_data` عوامل المقارنة الستة كلها بالإضافة إلى `contains`
- [ ] يعالج `sort_data` الفرز بعمود واحد ومتعدد الأعمدة
- [ ] يعمل `aggregate_groupby` مع average والمجموع والعدّ والحد الأدنى والحد الأقصى والوسيط
- [ ] ينتج `make_pivot` و`make_crosstab` تلخيصات صحيحة
- [ ] يعالج `clean_data` المسافات البيضاء والقيم المفقودة وتحويل الأنواع والتكرارات
- [ ] يكتب `export_all` ملفات CSV و Excel و JSON صالحة
- [ ] تشغّل قائمة CLI كل العمليات بشكل تفاعلي
- [ ] رسائل الأخطاء مفيدة وتشير إلى السبب

---

## أهداف إضافية

- [ ] أضف عمليات إعادة تسمية الأعمدة وإسقاطها
- [ ] ادعم قراءة ملفات Excel مباشرة بـ `pd.read_excel`
- [ ] أضف علامة `--batch` تقرأ الأوامر من ملف نصي
- [ ] ولّد مخطط أعمدة نصيًا بسيطًا للأعمدة الرقمية
- [ ] أضف أمر `profile` يكتب تقرير جودة بيانات كاملًا إلى ملف
- [ ] ادعم سلسلة العمليات من ملف إعداد JSON (مثل `process --config steps.json`)
