---

title: "تحديد الأعمدة"
description: "استخراج عمود واحد أو أعمدة متعددة من إطار البيانات باستخدام أقواس الفهرسة ووصول النقطة و loc."
module: "selection-filtering"
order: 3
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "تحديد عمود واحد بالاسم باستخدام أقواس الفهرسة ووصول النقطة"
  - "تحديد أعمدة متعددة بتمرير قائمة من الأسماء"
  - "استخدام loc لتحديد الأعمدة حسب التسمية"
  - "فهم متى تفضّل طريقة على أخرى"
prerequisites: ["series-dataframe"]
tags: ["pandas", "selection", "columns", "loc"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "كيف تحدد عمودًا واحدًا من إطار البيانات؟"
    options:
      - text: "df[0]"
      - text: "df.column_name"
        correct: true
      - text: "df.get(0)"
      - text: "df.select(0)"
  - question: "ما نوع df['column']؟"
    options:
      - text: "DataFrame"
      - text: "Series"
        correct: true
      - text: "List"
      - text: "Dictionary"
  - question: "كيف تحدد أعمدة متعددة؟"
    options:
      - text: "df[0, 1]"
      - text: "df[['col1', 'col2']]"
        correct: true
      - text: "df.select('col1', 'col2')"
      - text: "df.get(['col1', 'col2'])"
---

## لماذا يهم تحديد الأعمدة

غالبًا ما تحتوي مجموعات البيانات على عشرات الأعمدة. يركّز معظم التحليل على جزء منها. تحديد الأعمدة الصحيحة يقلل استهلاك الذاكرة، ويسرّع الحساب، ويجعل شفرتك أوضح.

سنستخدم مجموعة بيانات تيتانيك طوال هذا الدرس:

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")
```

## تحديد عمود واحد

**أقواس الفهرسة** — الأسلوب الأكثر شيوعًا:

```python
ages = df["Age"]
print(type(ages))   # <class 'pandas.core.series.Series'>
```

**وصول النقطة** — أقصر لكنه يعمل فقط عندما لا يحتوي اسم العمود على مسافات أو رموز خاصة:

```python
print(df.Age.head())   # first 5 ages
```

كلاهما يُرجع **Series** (أحادي البعد). يصبح اسم العمود اسم الكائن Series، ويُحافظ على فهرس إطار البيانات.

## تحديد أعمدة متعددة

مرّر **قائمة من أسماء الأعمدة** داخل الأقواس. يُرجع ذلك **DataFrame** وليس Series:

```python
subset = df[["Name", "Age", "Fare"]]
print(type(subset))   # <class 'pandas.core.frame.DataFrame'>
print(subset.head())
```

المخرجات:

```
                                                Name   Age     Fare
0                            Braund, Mr. Owen Harris  22.0   7.2500
1  Cumings, Mrs. John Bradley (Florence Briggs Th...  38.0  71.2833
2                             Heikkinen, Miss. Laina  26.0   7.9250
3       Futrelle, Mrs. Jacques Heath (Lily May Peel)  35.0  53.1000
0                           Allen, Mr. William Henry  35.0   8.0500
```

ترتيب الأعمدة في القائمة هو الذي يحدد الترتيب في المخرجات.

## استخدام loc لتحديد الأعمدة

يحدد `loc` حسب التسمية ويمكنه التعامل مع الصفوف والأعمدة معًا:

```python
# select all rows, specific columns
subset = df.loc[:, ["Name", "Survived"]]
```

الرمز `:` يعني "كل الصفوف". قائمة أسماء الأعمدة تحدد أعمدة معينة. هذا مكافئ لـ `df[["Name", "Survived"]]` لكنه يصبح ضروريًا عند دمج تحديد الصفوف والأعمدة في خطوة واحدة.

## أنماط عملية

**إعادة التسمية بعد التحديد** — احتفظ بما تحتاجه فقط بأسماء أوضح:

```python
demographics = df[["Name", "Age", "Sex"]].copy()
demographics.columns = ["passenger", "age", "gender"]
```

**تحديد الأعمدة حسب نوع البيانات** — مفيد عندما يكون لديك أعمدة كثيرة:

```python
numeric_cols = df.select_dtypes(include=["number"])
print(numeric_cols.columns.tolist())
# ['PassengerId', 'Survived', 'Pclass', 'Age', 'SibSp', 'Parch', 'Fare']

categorical_cols = df.select_dtypes(include=["object"])
print(categorical_cols.columns.tolist())
# ['Name', 'Ticket', 'Cabin', 'Embarked']
```

**تحديد الأعمدة التي تحتوي نصًا فرعيًا**:

```python
# useful for wide datasets with naming conventions
age_cols = [col for col in df.columns if "age" in col.lower()]
```

## متى تستخدم ماذا

| الطريقة | تُرجع | الأنسب لـ |
|---|---|---|
| `df["col"]` | Series | الوصول إلى عمود واحد |
| `df[["col1", "col2"]]` | DataFrame | أعمدة متعددة |
| `df.loc[:, cols]` | DataFrame | دمج تحديد الصفوف والأعمدة |
| `df.col` | Series | وصول سريع، بدون رموز خاصة |
| `df.select_dtypes()` | DataFrame | التحديد حسب النوع |

## جرّب بنفسك

من مجموعة بيانات تيتانيك، حدد الأعمدة `Name` و `Pclass` و `Fare` فقط. اطبع أول 5 صفوف. ثم حدد الأعمدة الرقمية فقط واطبع أسماءها.

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")

subset = df[["Name", "Pclass", "Fare"]]
print(subset.head())

numeric = df.select_dtypes(include=["number"])
print(numeric.columns.tolist())
```

## خلاصات رئيسية

- أقواس الفهرسة `df["col"]` هي الطريقة القياسية لتحديد عمود واحد
- `df[["col1", "col2"]]` يُرجع DataFrame بأعمدة متعددة
- يصبح `loc` ضروريًا عند دمج تحديد الصفوف والأعمدة
- `select_dtypes()` أداة قوية لتحديد الأعمدة حسب نوع البيانات

## تحدي التطبيق

من مجموعة بيانات تيتانيك، أنشئ إطار بيانات جديدًا اسمه `passenger_info` يحتوي الأعمدة `Name` و `Age` و `Sex` و `Survived` فقط. كم عدد الصفوف التي تحتوي على قيم Age مفقودة في هذه المجموعة الفرعية؟ (تلميح: استخدم `.isna().sum()`)
