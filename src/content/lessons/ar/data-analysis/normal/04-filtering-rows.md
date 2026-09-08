---

title: "تصفية الصفوف"
description: "استخدم الشروط المنطقية للاحتفاظ بالصفوف المطابقة لمعاييرك فقط في إطار بيانات pandas."
module: "selection-filtering"
order: 4
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "تصفية الصفوف باستخدام شرط منطقي واحد"
  - "دمج شروط متعددة باستخدام عاملَي & و |"
  - "استخدام .isin() و .between() لأنماط تصفية شائعة"
  - "التصفية بأساليب النصوص باستخدام أداة .str"
prerequisites: ["series-dataframe", "selecting-columns"]
tags: ["pandas", "filtering", "boolean", "conditions"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "كيف تصفِّي الصفوف التي يكون فيها العمر أكبر من 30؟"
    options:
      - text: "df.filter(age > 30)"
      - text: "df[df.age > 30]"
        correct: true
      - text: "df.where('age > 30')"
      - text: "df.select(age > 30)"
  - question: "ماذا يُرجع df[df.age > 30]؟"
    options:
      - text: "كائن Series"
      - text: "إطار بيانات يحتوي فقط على الصفوف التي عمرها أكبر من 30"
        correct: true
      - text: "قيمة واحدة"
      - text: "قائمة من الفهارس"
  - question: "كيف تصفِّي بأكثر من شرط؟"
    options:
      - text: "df[df.age > 30 and df.salary > 50000]"
      - text: "df[(df.age > 30) & (df.salary > 50000)]"
        correct: true
      - text: "df.filter(age > 30, salary > 50000)"
      - text: "df.where(age > 30 and salary > 50000)"
---

## التصفية بالشروط المنطقية

التصفية هي طريقة تركيزك على الجزء المهم من البيانات. تنشئ **قناعًا منطقيًا** (boolean mask) — كائن Series من قيم True/False — وتستخدمه لتحديد الصفوف.

```python
import pandas as pd

url = "https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv"
df = pd.read_csv(url)

# Filter passengers older than 30
older = df[df["Age"] > 30]
print(older.shape)   # fewer rows than original 891
```

التعبير `df["Age"] > 30` يُنتج كائن Series منطقيًا:

```
0       True
1       True
2      False
3       True
...
```

تمريره داخل `df[...]` يحتفظ فقط بالصفوف التي تكون قيمتها `True`.

## دمج الشروط

استخدم `&` (و) و `|` (أو) لدمج الشروط. **يجب وضع كل شرط بين قوسين:**

```python
# Female passengers in first class
first_class_female = df[(df["Sex"] == "female") & (df["Pclass"] == 1)]
print(first_class_female.head())
```

```python
# Passengers younger than 25 OR older than 60
young_or_old = df[(df["Age"] < 25) | (df["Age"] > 60)]
print(young_or_old.shape)
```

خطأ شائع: استخدام `and`/`or` بدلًا من `&`/`|`. عاملَا بايثون `and`/`or` لا يعملان على مستوى العناصر على كائنات Series في pandas وسيسببان خطأ.

## استخدام .isin() لقيم متعددة

عندما تحتاج إلى المطابقة مع قائمة قيم، استخدم `.isin()`:

```python
# Passengers who embarked from Cherbourg or Southampton
embarked_filter = df[df["Embarked"].isin(["C", "S"])]
```

```python
# Passengers in class 1 or 2
upper_classes = df[df["Pclass"].isin([1, 2])]
```

## استخدام .between() للنطاقات

طريقة `.between()` أنظف من ربط مقارنتين:

```python
# Passengers aged 20 to 30 (inclusive by default)
twenties = df[df["Age"].between(20, 30)]
print(twenties.shape)
```

هذا مكافئ لـ `df[(df["Age"] >= 20) & (df["Age"] <= 30)]` لكنه أكثر قابلية للقراءة.

## التصفية بأساليب النصوص

تتيح لك أداة `.str` تطبيق عمليات النصوص على عمود كامل:

```python
# Passengers whose name contains "Master" (a title)
masters = df[df["Name"].str.contains("Master", na=False)]
print(masters.shape)
```

```python
# Passengers whose ticket starts with "A"
a_tickets = df[df["Ticket"].str.startswith("A", na=False)]
```

الوسيط `na=False` يعالج القيم المفقودة بلطف — بدونها، ستسبب قيم NaN أخطاء.

## التصفية باستخدام .query()

بالنسبة للفلاتر المعقدة، يوفر `.query()` بديلًا مقروءًا:

```python
# Equivalent to df[(df["Age"] > 25) & (df["Survived"] == 1)]
survivors_over_25 = df.query("Age > 25 and Survived == 1")
```

قراءة هذا سطرية تقريبًا مثل نص إنجليزي وتتجنب تكرار صياغة `df["column"]`.

## تخزين الفلاتر في متغيرات

بالنسبة للشروط المعقدة، خزّن القناع المنطقي في متغير أولًا:

```python
is_female = df["Sex"] == "female"
is_first_class = df["Pclass"] == 1
is_survived = df["Survived"] == 1

# Combine them
result = df[is_female & is_first_class & is_survived]
print(f"Female first-class survivors: {len(result)}")
```

هذا الأسلوب يجعل شفرتك أسهل بكثير في القراءة وتصحيح الأخطاء.

## جرّب بنفسك

من مجموعة بيانات تيتانيك، صفِّ للعثور على:
1. جميع الركاب الذين دفعوا ثمن تذكرة أكثر من 100
2. جميع الركابات في الدرجة الثالثة
3. جميع الركاب الذين يحوي اسمهم لقب "Mrs"

```python
import pandas as pd

url = "https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv"
df = pd.read_csv(url)

high_fare = df[df["Fare"] > 100]
print(f"High fare passengers: {len(high_fare)}")

third_class_female = df[(df["Sex"] == "female") & (df["Pclass"] == 3)]
print(f"Third-class females: {len(third_class_female)}")

mrs = df[df["Name"].str.contains("Mrs", na=False)]
print(f"Passengers with title Mrs: {len(mrs)}")
```

## خلاصات رئيسية

- الفهرسة المنطقية `df[mask]` هي آلية التصفية الأساسية في pandas
- استخدم `&` للـAND و `|` للـOR — لفّ كل شرط على حدة بين قوسين دائمًا
- `.isin()` يطابق قائمة؛ `.between()` يتعامل مع النطاقات بنظافة
- `.str.contains()` يصفّي بمطابقة نص فرعي — استخدم `na=False` للأمان

## تحدي التطبيق

من مجموعة بيانات تيتانيك، ابحث عن جميع الركاب الذين: (1) كانوا ذكورًا، (2) في الدرجة الثانية أو الثالثة، (3) تتراوح أعمارهم بين 18 و 35 عامًا، و(4) نجوا. كم عدد الركاب المطابقين للشروط الأربعة جميعها؟