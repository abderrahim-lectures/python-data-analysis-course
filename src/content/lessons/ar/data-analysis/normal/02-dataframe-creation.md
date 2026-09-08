---

title: "إنشاء إطارات البيانات"
description: "بناء بيانات جدولية ثنائية الأبعاد من القواميس وقوائم السجلات وملفات CSV باستخدام إطارات البيانات pandas DataFrame."
module: "series-dataframe"
order: 2
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "إنشاء إطار بيانات من قاموس من القوائم"
  - "إنشاء إطار بيانات من قائمة من القواميس"
  - "قراءة ملف CSV إلى إطار بيانات باستخدام pd.read_csv()"
  - "فحص إطار البيانات باستخدام head() و info() و describe() و shape"
prerequisites: ["series-dataframe"]
tags: ["pandas", "dataframe", "csv", "inspection"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "ما هو إطار بيانات DataFrame في pandas؟"
    options:
      - text: "مصفوفة أحادية البعد"
      - text: "بنية بيانات ثنائية الأبعاد معلّمة بأعمدة"
        correct: true
      - text: "قاموس بايثون"
      - text: "استعلام SQL"
  - question: "كيف تنشئ إطار بيانات من قاموس؟"
    options:
      - text: "pd.DataFrame({'col': [1, 2]})"
        correct: true
      - text: "pd.Table({'col': [1, 2]})"
      - text: "pd.Array({'col': [1, 2]})"
      - text: "pd.Series({'col': [1, 2]})"
  - question: "ماذا يُرجع df.shape؟"
    options:
      - text: "أسماء الأعمدة"
      - text: "(الصفوف، الأعمدة) كصف مزدوج"
        correct: true
      - text: "أنواع البيانات"
      - text: "أول 5 صفوف"
---

## ما هو إطار البيانات DataFrame؟

**DataFrame** في pandas هو بنية بيانات ثنائية الأبعاد معلّمة — فكّر فيه كجدول بيانات أو جدول SQL أو قاموس من كائنات Series. كل عمود هو Series، وكل الأعمدة تتشارك نفس الفهرس.

```python
import pandas as pd

df = pd.DataFrame({
    "Name": ["Alice", "Bob", "Carol"],
    "Age": [24, 30, 28],
    "Score": [88, 92, 79]
})
print(df)
```

المخرجات:

```
    Name  Age  Score
0  Alice   24     88
1    Bob   30     92
2  Carol   28     79
```

## إنشاء إطارات البيانات من مصادر مختلفة

**من قاموس من القوائم** — يصبح كل مفتاح اسم عمود:

```python
df = pd.DataFrame({
    "City": ["Lagos", "Nairobi", "Cairo"],
    "Population": [15_400_000, 4_400_000, 20_900_000],
    "Country": ["Nigeria", "Kenya", "Egypt"]
})
```

**من قائمة من القواميس** — كل قاموس هو صف:

```python
records = [
    {"Name": "Alice", "Score": 88},
    {"Name": "Bob", "Score": 92},
    {"Name": "Carol", "Score": 79},
]
df = pd.DataFrame(records)
```

**من كائن Series** — تتحد كائنات Series المتعددة في أعمدة:

```python
names = pd.Series(["Alice", "Bob", "Carol"])
scores = pd.Series([88, 92, 79])
df = pd.DataFrame({"Name": names, "Score": scores})
```

## قراءة ملفات CSV

الطريقة الأكثر شيوعًا لتحميل البيانات الحقيقية هي من ملف CSV:

```python
df = pd.read_csv("titanic.csv")
```

الوسائط المفيدة للدالة `read_csv()`:

```python
df = pd.read_csv(
    "data.csv",
    index_col="id",        # use 'id' column as the index
    usecols=["name", "age", "fare"],  # load only these columns
    na_values=["?", ""],   # treat '?' and empty strings as NaN
    dtype={"age": "float"} # force column type
)
```

في هذه الدورة سنستخدم مجموعة بيانات تيتانيك، المتاحة على العنوان:

```python
url = "https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv"
df = pd.read_csv(url)
```

## فحص بياناتك

بعد تحميل البيانات، افحصها دائمًا أولًا:

```python
df.head()        # first 5 rows
df.tail(3)       # last 3 rows
df.shape          # (rows, columns) — e.g. (891, 12)
df.info()         # column names, non-null counts, dtypes
df.describe()     # statistical summary of numeric columns
```

طريقة `info()` مهمة بشكل خاص — فهي تكشف القيم المفقودة وأنواع البيانات:

```
<class 'pandas.core.frame.DataFrame'>
RangeIndex: 891 entries, 0 to 890
Data columns (total 12 columns):
 #   Column    Non-Null Count  Dtype  
---  ------    --------------  -----  
 0   PassengerId  891 non-null   int64  
 1   Survived     891 non-null   int64  
 2   Pclass       891 non-null   int64  
 3   Name         891 non-null   object 
 4   Age          714 non-null   float64
 5   SibSp        891 non-null   int64  
 ...
```

لاحظ أن العمود `Age` يحتوي 714 قيمة غير فارغة من أصل 891 — أي أن هناك 177 قيمة مفقودة. تنظيف هذه البيانات مهارة أساسية ستتعلمها لاحقًا.

## الوصول إلى الأعمدة

بمجرد امتلاكك إطار بيانات، يمكنك الوصول إلى الأعمدة ككائنات Series:

```python
print(df["Age"])       # returns a Series
print(df.Age)          # dot notation also works (if column name has no spaces)
```

حدّد أعمدة متعددة بتمرير قائمة:

```python
df[["Name", "Age"]]
```

## جرّب بنفسك

أنشئ إطار بيانات يمثل ثلاثة موظفين بأعمدة للاسم (Name) والقسم (Department) والراتب (Salary). اطبع إطار البيانات، ثم اعرض عمودي الاسم والراتب فقط.

```python
import pandas as pd

employees = pd.DataFrame({
    "Name": ["Amina", "Kofi", "Zara"],
    "Department": ["Engineering", "Marketing", "Engineering"],
    "Salary": [95000, 72000, 88000]
})
print(employees)
print(employees[["Name", "Salary"]])
```

## خلاصات رئيسية

- إطار البيانات DataFrame جدول بصفوف معلّمة (الفهرس) وأعمدة معلّمة
- القواميس من القوائم وقوائم القواميس هي أكثر طرق الإنشاء شيوعًا
- `pd.read_csv()` يحمّل البيانات الخارجية — استخدم `index_col` و `usecols` و `na_values` للتحكم
- افحص دائمًا البيانات الجديدة بـ `head()` و `info()` و `describe()` قبل التحليل

## تحدي التطبيق

حمّل مجموعة بيانات تيتانيك من العنوان أعلاه. كم عدد الصفوف والأعمدة؟ ما أسماء الأعمدة؟ كم عدد الأعمدة التي تحتوي قيمًا مفقودة؟ استخدم `info()` لمعرفة ذلك.