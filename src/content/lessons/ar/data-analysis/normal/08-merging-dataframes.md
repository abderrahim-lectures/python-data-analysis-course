---

title: "دمج إطارات البيانات"
description: "اجمع مجموعات البيانات ذات الصلة باستخدام merge() و join() و concat() لبناء جداول تحليلية شاملة."
module: "groupby-aggregation"
order: 8
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "دمج إطاري بيانات على مفتاح مشترك باستخدام merge()"
  - "فهم عمليات الدمج الداخلية واليسرى واليمنى والخارجية"
  - "تكديس إطارات البيانات رأسيًا باستخدام concat()"
  - "معالجة تعارضات الدمج عندما تحمل الأعمدة أسماء متداخلة"
prerequisites: ["data-cleaning", "groupby-basics"]
tags: ["pandas", "merge", "join", "concat", "combining"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "ما هو دمج pandas؟"
    options:
      - text: "دمج إطاري بيانات حسب الأعمدة أو الفهارس المشتركة"
        correct: true
      - text: "إضافة صفوف إلى إطار بيانات"
      - text: "حذف الصفوف المكررة"
      - text: "ترتيب إطار بيانات"
  - question: "أي نوع من الدمج يحتفظ بالصفوف المطابقة فقط؟"
    options:
      - text: "outer"
      - text: "inner"
        correct: true
      - text: "left"
      - text: "right"
  - question: "ماذا يحدث في الدمج الأيسر إذا لم يجد إطار البيانات الأيمن تطابقًا؟"
    options:
      - text: "يُحذف الصف"
      - text: "تملأ قيم NaN أعمدة الجانب الأيمن"
        correct: true
      - text: "يحدث خطأ"
      - text: "يُكرر الصف"
---

## لماذا ندمج؟

تتطلب التحليلات الحقيقية غالبًا بيانات من مصادر متعددة. الدمج يجمع إطاري بيانات بناءً على مفتاح مشترك — تمامًا مثل JOIN في SQL أو VLOOKUP في Excel.

```python
import pandas as pd

# Create sample DataFrames
passengers = pd.DataFrame({
    "passenger_id": [1, 2, 3, 4, 5],
    "name": ["Alice", "Bob", "Carol", "David", "Eve"],
    "class": [1, 3, 2, 3, 1]
})

tickets = pd.DataFrame({
    "passenger_id": [1, 2, 3, 6],
    "fare": [100.0, 15.5, 26.0, 30.0],
    "embarked": ["S", "C", "S", "Q"]
})
```

## الدمج الأساسي

```python
merged = pd.merge(passengers, tickets, on="passenger_id")
print(merged)
```

المخرجات:

```
   passenger_id   name  class   fare embarked
0             1  Alice      1  100.0        S
1             2    Bob      3   15.5        C
2             3  Carol      2   26.0        S
```

يظهر الركاب 1 و 2 و 3 فقط — هذا **دمج داخلي** (الافتراضي). الراكبان 4 و 5 لا يملكان بيانات تذاكر؛ والراكب 6 لا يملك بيانات ركاب.

## أنواع الدمج

**الدمج الداخلي** (الافتراضي) — الصفوف المطابقة من الجانبين فقط:

```python
pd.merge(passengers, tickets, on="passenger_id")
```

**الدمج الأيسر** — احتفظ بجميع صفوف إطار البيانات الأيسر:

```python
pd.merge(passengers, tickets, on="passenger_id", how="left")
```

المخرجات:

```
   passenger_id   name  class   fare embarked
0             1  Alice      1  100.0        S
1             2    Bob      3   15.5        C
2             3  Carol      2   26.0        S
3             4  David      3    NaN      NaN
4             5    Eve      1    NaN      NaN
```

**الدمج الأيمن** — احتفظ بجميع صفوف إطار البيانات الأيمن:

```python
pd.merge(passengers, tickets, on="passenger_id", how="right")
```

**الدمج الخارجي** — احتفظ بجميع صفوف الجانبين:

```python
pd.merge(passengers, tickets, on="passenger_id", how="outer")
```

المخرجات:

```
   passenger_id   name  class   fare embarked
0             1  Alice    1.0  100.0        S
1             2    Bob    3.0   15.5        C
2             3  Carol    2.0   26.0        S
3             4  David    3.0    NaN      NaN
4             5    Eve    1.0    NaN      NaN
5             6    NaN    NaN   30.0        Q
```

## الدمج على أسماء أعمدة مختلفة

عندما تحمل أعمدة المفتاح أسماء مختلفة، استخدم `left_on` و `right_on`:

```python
df1 = pd.DataFrame({"id_a": [1, 2, 3], "val": ["x", "y", "z"]})
df2 = pd.DataFrame({"id_b": [1, 2, 3], "score": [10, 20, 30]})

merged = pd.merge(df1, df2, left_on="id_a", right_on="id_b")
print(merged)
```

## معالجة أسماء الأعمدة المتداخلة

عندما يحمل كلا إطاري البيانات أعمدة بنفس الاسم (غير المفتاح)، يضيف pandas لواحق:

```python
merged = pd.merge(passengers, tickets, on="passenger_id", suffixes=("_pass", "_tick"))
```

## الدمج على الفهرس

إذا كان المفتاح هو الفهرس، استخدم `left_index` و `right_index`:

```python
passengers_idx = passengers.set_index("passenger_id")
tickets_idx = tickets.set_index("passenger_id")

merged = pd.merge(passengers_idx, tickets_idx, left_index=True, right_index=True)
```

## التكديس (التسلسل)

يُكدس `concat()` إطارات البيانات رأسيًا أو أفقيًا:

**رأسيًا (تكديس الصفوف):**

```python
df_top = pd.DataFrame({"name": ["Alice", "Bob"], "score": [88, 92]})
df_bottom = pd.DataFrame({"name": ["Carol", "David"], "score": [79, 95]})

combined = pd.concat([df_top, df_bottom], ignore_index=True)
print(combined)
```

**أفقيًا (إضافة الأعمدة):**

```python
df_a = pd.DataFrame({"name": ["Alice", "Bob"]})
df_b = pd.DataFrame({"score": [88, 92]})

combined = pd.concat([df_a, df_b], axis=1)
```

## مثال عملي: بيانات تيتانيك

```python
# titanic.csv ships with the course — load it from the browser file system.
titanic = pd.read_csv("titanic.csv")

# Create a summary DataFrame
class_stats = titanic.groupby("Pclass").agg(
    avg_fare=("Fare", "mean"),
    avg_age=("Age", "median"),
    survival_rate=("Survived", "mean")
).reset_index()

print(class_stats)
```

تقوم `reset_index()` بتحويل الفهرس المجمَّع مرة أخرى إلى عمود عادي، وهو أمر ضروري قبل الدمج.

## جرّب بنفسك

أنشئ إطاري بيانات: `students` بأعمدة `id` و `name` و `grades` بأعمدة `id` و `math` و `english`. ادمجهما على `id` بدمج أيسر. ثم كدّس إطاري بيانات صغيرين رأسيًا.

```python
import pandas as pd

students = pd.DataFrame({"id": [1, 2, 3], "name": ["Alice", "Bob", "Carol"]})
grades = pd.DataFrame({"id": [1, 2, 4], "math": [88, 92, 75], "english": [90, 85, 80]})

merged = pd.merge(students, grades, on="id", how="left")
print(merged)

df1 = pd.DataFrame({"name": ["X", "Y"], "val": [1, 2]})
df2 = pd.DataFrame({"name": ["Z"], "val": [3]})
print(pd.concat([df1, df2], ignore_index=True))
```

## خلاصات رئيسية

- `merge()` يجمع إطارات البيانات على مفاتيح مشتركة؛ `concat()` يكّدسها رأسيًا أو أفقيًا
- يتحكم الوسيط `how` في نوع الدمج: داخلي (افتراضي)، يسار، يمين، خارجي
- استخدم `left_on`/`right_on` عندما تحمل أعمدة المفتاح أسماء مختلفة
- نفّذ دائمًا `reset_index()` بعد groupby قبل الدمج

## تحدي التطبيق

من مجموعة بيانات تيتانيك، أنشئ إطار بيانات ملخصًا مجمَّعًا حسب Pclass بأعمدة: Pclass و avg_fare و survival_rate و passenger_count. ثم أنشئ ملخصًا آخر مجمَّعًا حسب Embarked. ادمج هذين الملخصين على Pclass بدمج أيسر. ما المعلومات المفقودة أو المكتسبة؟
