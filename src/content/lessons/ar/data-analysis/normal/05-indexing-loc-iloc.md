---

title: "loc و iloc"
description: "الوصول إلى صفوف وأعمدة محددة باستخدام loc المبني على التسميات و iloc المبني على المواضع لتحديد دقيق للبيانات."
module: "data-cleaning"
order: 5
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "استخدام loc لتحديد الصفوف والأعمدة حسب التسمية"
  - "استخدام iloc لتحديد الصفوف والأعمدة حسب الموضع الصحيح"
  - "دمج تحديد الصفوف والأعمدة في عملية واحدة"
  - "استخدام loc للإسناد والتحرير الموجه"
prerequisites: ["selection-filtering"]
tags: ["pandas", "loc", "iloc", "indexing"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "ما الفرق بين loc و iloc؟"
    options:
      - text: "يستخدم loc التسميات، ويستخدم iloc المواضع الصحيحة"
        correct: true
      - text: "loc أسرع من iloc"
      - text: "يستخدم iloc التسميات، ويستخدم loc المواضع"
      - text: "لا يوجد فرق"
  - question: "كيف تحدد أول 3 صفوف باستخدام iloc؟"
    options:
      - text: "df.iloc[0:3]"
        correct: true
      - text: "df.iloc[0, 3]"
      - text: "df.loc[0:3]"
      - text: "df.head(3).iloc"
  - question: "كيف تحدد خلية محددة باستخدام loc؟"
    options:
      - text: "df.iloc[row, col]"
      - text: "df.loc[index, column]"
        correct: true
      - text: "df.get(row, col)"
      - text: "df.select(row, col)"
---

## مشكلة فهرسة الأقواس الأساسية

فهرسة الأقواس الأساسية `df[mask]` تعمل لتصفية الصفوف و `df["col"]` لتحديد الأعمدة. لكن عندما تحتاج إلى تحديد صفوف محددة **و** أعمدة محددة في خطوة واحدة، أو تحرير خلايا مفردة، ستحتاج إلى `loc` و `iloc`.

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")
```

## loc: التحديد حسب التسمية

يحدد `loc` حسب **التسمية** ، تسميات فهرس الصفوف وأسماء الأعمدة:

```python
# Select row at index label 0, columns "Name" and "Age"
print(df.loc[0, ["Name", "Age"]])
```

المخرجات:

```
Name    Braund, Mr. Owen Harris
Age                        22.0
Name: 0, dtype: object
```

**التقطيع حسب التسمية** ، نقطة النهاية مشمولة (على عكس تقطيع بايثون):

```python
# Rows 0 through 4, columns Name through Age
print(df.loc[0:4, "Name":"Age"])
```

**تحديد كل الصفوف لأعمدة محددة:**

```python
print(df.loc[:, ["Name", "Survived"]].head())
```

**تحديد كل الأعمدة لصفوف محددة:**

```python
print(df.loc[[0, 5, 10]])
```

## iloc: التحديد حسب الموضع

يحدد `iloc` حسب **الموضع الصحيح** ، رقم الصف/العمود بدءًا من 0:

```python
# First row, first three columns
print(df.iloc[0, :3])
```

المخرجات:

```
PassengerId                            1
Survived                               0
Pclass                                 3
Name: 0, dtype: object
```

**التقطيع حسب الموضع** ، نقطة النهاية غير مشمولة (سلوك بايثون القياسي):

```python
# Rows 0-4 (5 rows), columns 0-2 (3 columns)
print(df.iloc[0:5, 0:3])
```

**تحديد صفوف وأعمدة محددة:**

```python
# Rows 0, 1, 5; columns 3 (Name) and 4 (Age)
print(df.iloc[[0, 1, 5], [3, 4]])
```

## loc مقابل iloc: الفروق الرئيسية

| الميزة | loc | iloc |
|---|---|---|
| التحديد حسب | التسميات (الأسماء) | المواضع الصحيحة |
| نقطة نهاية التقطيع | مشمولة | غير مشمولة |
| تحديد الأعمدة | بالاسم | بالموضع |
| الأنسب لـ | الفهارس المسماة | الفهرس الصحيح الافتراضي |

```python
# These are different:
df.loc[0:5]       # rows with labels 0 through 5 (inclusive) — 6 rows
df.iloc[0:5]      # rows at positions 0 through 4 (exclusive) — 5 rows
```

## استخدام loc للإسناد

`loc` ليس للقراءة فقط ، يمكنك استخدامه **لتحرير** خلايا محددة:

```python
# Set Age to 0 for the first passenger
df.loc[0, "Age"] = 0

# Set Fare to -1 for rows where Fare is negative
df.loc[df["Fare"] < 0, "Fare"] = 0

# Create a new column based on conditions
df.loc[df["Age"] < 18, "Category"] = "Minor"
df.loc[df["Age"] >= 18, "Category"] = "Adult"
```

هذا التحرير الموجّه ضروري لتنظيف البيانات.

## أنماط عملية

**الحصول على قيمة خلية محددة:**

```python
# The name of the passenger at position 100
name = df.loc[100, "Name"]
print(name)
```

**تحديد نطاق من الأعمدة:**

```python
# All rows, columns from "Name" to "Fare"
print(df.loc[:, "Name":"Fare"].head())
```

**التحديد الشرطي مع المحورين معًا:**

```python
# Female passengers, only Name and Age columns
women = df.loc[df["Sex"] == "female", ["Name", "Age"]]
print(women.head())
```

## جرّب بنفسك

من مجموعة بيانات تيتانيك:
1. استخدم `iloc` لطباعة أول 3 صفوف وأول 4 أعمدة
2. استخدم `loc` لطباعة الاسم والأجرة للراكب عند الفهرس 50
3. استخدم `loc` لضبط عمر الراكب عند الفهرس 0 إلى 25

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")

# First 3 rows, first 4 columns
print(df.iloc[0:3, 0:4])

# Name and Fare at index 50
print(df.loc[50, ["Name", "Fare"]])

# Set Age to 25
df.loc[0, "Age"] = 25
print(df.loc[0, "Age"])
```

## خلاصات رئيسية

- `loc` يحدد حسب التسمية (الأسماء)؛ `iloc` يحدد حسب الموضع الصحيح
- تقطيعات `loc` شاملة الطرفين؛ تقطيعات `iloc` تتبع اصطلاح بايثون (نهاية غير مشمولة)
- يدعم `loc` الإسناد لتحرير الخلايا الموجه
- دمج تحديد الصفوف والأعمدة في استدعاء `loc` واحد أنظف من الفهرسة المتسلسلة

## تحدي التطبيق

من مجموعة بيانات تيتانيك، استخدم `iloc` لاستخراج الصفوف 100-109 والأعمدة 2-5 (من Pclass حتى Age). ثم استخدم `loc` للعثور على أسماء جميع الركاب ذوي تسميات الفهارس 0 و 50 و 100 و 500. أخيرًا، استخدم `loc` لتغيير أجرة الراكب عند الفهرس 7 إلى 999 وتحقق من التغيير.
