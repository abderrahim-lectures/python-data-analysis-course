---

title: "معالجة القيم المفقودة"
description: "اكتشاف القيم المفقودة وحذفها وملؤها باستخدام isna() و dropna() و fillna() لتجهيز البيانات للتحليل."
module: "data-cleaning"
order: 6
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "كشف القيم المفقودة باستخدام isna() و notna()"
  - "حذف الصفوف أو الأعمدة ذات القيم المفقودة باستخدام dropna()"
  - "ملء القيم المفقودة بأرقام محددة أو إحصاءات أو استراتيجيات باستخدام fillna()"
  - "اختيار الاستراتيجية الصحيحة لمعالجة البيانات المفقودة"
prerequisites: ["selection-filtering"]
tags: ["pandas", "missing-values", "cleaning", "fillna"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "كيف تتحقق من وجود قيم مفقودة في إطار البيانات؟"
    options:
      - text: "df.isnull()"
        correct: true
      - text: "df.missing()"
      - text: "df.hasna()"
      - text: "df.nodata()"
  - question: "ماذا يفعل df.dropna()؟"
    options:
      - text: "يملأ القيم المفقودة بـ 0"
      - text: "يزيل الصفوف التي تحتوي على أي قيم مفقودة"
        correct: true
      - text: "يزيل الأعمدة التي تحتوي على قيم مفقودة"
      - text: "يحسب القيم المفقودة"
  - question: "كيف تملأ القيم المفقودة بمتوسط العمود؟"
    options:
      - text: "df.fillna(0)"
      - text: "df.fillna(df.mean())"
        correct: true
      - text: "df.replace(nan, mean)"
      - text: "df.mean().fill()"
---

## لماذا تهم القيم المفقودة

تحتوي كل مجموعة بيانات حقيقية تقريبًا على قيم مفقودة. إذا تجاهلتها، تعيد عمليات التجميع NaN، وتتعطل الرسوم البيانية، وتفشل نماذج التعلم الآلي. الخطوة الأولى في أي تحليل هي فهم ومعالجة البيانات المفقودة.

```python
import pandas as pd

url = "https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv"
df = pd.read_csv(url)
```

## كشف القيم المفقودة

**فحص عمود واحد:**

```python
print(df["Age"].isna().sum())   # 177 missing Age values
```

**فحص جميع الأعمدة دفعة واحدة:**

```python
print(df.isna().sum())
```

المخرجات:

```
PassengerId      0
Survived         0
Pclass           0
Name             0
Sex              0
Age            177
SibSp            0
Parch            0
Ticket           0
Fare             0
Cabin          687
Embarked         2
dtype: int64
```

**رؤية النسبة المئوية المفقودة:**

```python
print((df.isna().sum() / len(df) * 100).round(1))
```

المخرجات:

```
Cabin          77.1%
Age            19.9%
Embarked        0.2%
...
```

عمود الأماكن Cabin مفقود بنسبة 77% — أكثر من اللازم لملئه بشكل ذي معنى. العمر Age مفقود بنسبة 20% — يستحق محاولة ملئه. أما Embarked ففيه قيمةان مفقودتان فقط — سهل المعالجة.

## حذف القيم المفقودة

**حذف الصفوف التي تحتوي على أي قيم مفقودة:**

```python
df_clean = df.dropna()
print(df_clean.shape)   # (183, 12) — lost most rows
```

هذا عدواني جدًا لمعظم مجموعات البيانات. تفقد 708 من أصل 891 صفًا.

**حذف الصفوف التي تكون جميع قيمها مفقودة:**

```python
df_clean = df.dropna(how="all")
```

**حذف الصفوف ذات القيم المفقودة في أعمدة محددة:**

```python
df_clean = df.dropna(subset=["Age", "Embarked"])
print(df_clean.shape)   # (712, 12) — much better
```

**حذف الأعمدة التي تحتوي على عدد كبير جدًا من القيم المفقودة:**

```python
# Drop columns where more than 50% is missing
threshold = len(df) * 0.5
df_clean = df.dropna(thresh=threshold, axis=1)
```

## ملء القيم المفقودة

**الملء بثابت:**

```python
df["Embarked"] = df["Embarked"].fillna("S")   # most common port
```

**الملء بإحصائية:**

```python
df["Age"] = df["Age"].fillna(df["Age"].median())
```

**الملء الأمامي أو الخلفي** — مفيد للسلاسل الزمنية:

```python
# Use the previous valid value to fill gaps
df["Price"] = df["Price"].ffill()

# Use the next valid value
df["Price"] = df["Price"].bfill()
```

**الملء بقيم مختلفة لكل عمود:**

```python
fill_values = {"Age": df["Age"].median(), "Embarked": "S", "Cabin": "Unknown"}
df = df.fillna(fill_values)
```

## اختيار استراتيجية

| السيناريو | الاستراتيجية |
|---|---|
| القيم المفقودة عشوائية وقليلة (< 5%) | الحذف باستخدام `dropna(subset=[...])` |
| قيم مفقودة في عمود رقمي | الملء بالوسيط (منيع ضد القيم الشاذة) |
| قيم مفقودة في عمود فئوي | الملء بالمنوال أو "قيمة غير معروفة" |
| العمود مفقود فيه أكثر من 50% | حذف العمود كاملًا |
| بيانات سلاسل زمنية | استخدام `ffill()` أو `bfill()` |

## مزالق شائعة

**الملء قبل تقسيم بيانات التدريب/الاختبار** — هذا يُسرّب معلومات. احسب قيم الملء على بيانات التدريب فقط، ثم طبقها على الاثنين.

**الحذف العدواني جدًا** — تحقق دائمًا من عدد الصفوف التي تخسرها. `dropna()` بدون وسائط يزيل غالبًا أكثر بكثير مما تتوقع.

**نسيان التحقق** — شغّل دائمًا `df.isna().sum()` بعد الملء للتأكد من عدم بقاء أي قيم NaN.

## جرّب بنفسك

من مجموعة بيانات تيتانيك:
1. احسب النسبة المئوية للقيم المفقودة لكل عمود
2. احذف عمود الـ Cabin (عدد كبير جدًا من القيم المفقودة)
3. املأ Age بمتوسط العمر
4. املأ Embarked بالقيمة الأكثر شيوعًا
5. تحقق من عدم بقاء قيم مفقودة

```python
import pandas as pd

url = "https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv"
df = pd.read_csv(url)

print((df.isna().sum() / len(df) * 100).round(1))

df = df.drop(columns=["Cabin"])
df["Age"] = df["Age"].fillna(df["Age"].median())
df["Embarked"] = df["Embarked"].fillna(df["Embarked"].mode()[0])

print(df.isna().sum())
```

## خلاصات رئيسية

- افحص دائمًا القيم المفقودة أولًا باستخدام `isna().sum()` قبل اتخاذ قرار بشأن الاستراتيجية
- `dropna()` قوي لكنه غالبًا عدواني جدًا بدون `subset` أو `thresh`
- الملء بالوسيط أو المنوال عبر `fillna()` هو أكثر استراتيجيات الملء شيوعًا
- الأعمدة التي بها أكثر من 50% قيم مفقودة أفضل حالًا بحذفها من ملئها

## تحدي التطبيق

حمّل مجموعة بيانات تيتانيك وأنشئ نسخة نظيفة: احذف Cabin، واملأ Age بالوسيط، واملأ Embarked بالمنوال. ثم قارن معدل النجاة قبل التنظيف وبعده. هل غيّر التنظيف معدل النجاة الإجمالي؟ لماذا أو لماذا لا؟