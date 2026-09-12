---

title: "إنشاء السلاسل"
description: "بناء مصفوفات أحادية البعد معلّمة من القوائم والقواميس والقيم العددية باستخدام كائن Series في pandas."
module: "series-dataframe"
order: 1
difficulty: "intermediate"
estimatedMinutes: 25
learningObjectives:
  - "إنشاء كائن Series من قائمة أو قاموس أو قيمة عددية"
  - "فهم دور الفهرس (index) في كائن Series"
  - "الوصول إلى القيم والفهارس في كائن Series"
  - "تنفيذ عمليات متجهة على بيانات Series"
prerequisites: ["python-basics"]
tags: ["pandas", "series", "data-structures"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "ما هو كائن Series في pandas؟"
    options:
      - text: "جدول بيانات ثنائي الأبعاد"
      - text: "مصفوفة أحادية البعد معلّمة"
        correct: true
      - text: "قائمة بايثون"
      - text: "جدول SQL"
  - question: "كيف تنشئ كائن Series من قائمة؟"
    options:
      - text: "pd.Series([1, 2, 3])"
        correct: true
      - text: "pd.array([1, 2, 3])"
      - text: "pd.List([1, 2, 3])"
      - text: "pd.DataFrame([1, 2, 3])"
  - question: "ماذا يخبرك s.dtype؟"
    options:
      - text: "طول الكائن Series"
      - text: "نوع بيانات كل عنصر"
        correct: true
      - text: "مجموع جميع القيم"
      - text: "تسميات الفهرس"
---

## ما هو كائن Series؟

كائن **Series** في pandas هو مصفوفة أحادية البعد معلّمة. فكّر فيه كعمود واحد من جدول بيانات ، لكل قيمة تسمية (الفهرس) ويمكن أن تكون البيانات من أي نوع: أعداد صحيحة، أعداد عشرية، نصوص، أو حتى كائنات بايثون.

```python
import pandas as pd

scores = pd.Series([88, 92, 75, 81])
print(scores)
```

المخرجات:

```
0    88
1    92
2    75
3    81
dtype: int64
```

العمود الأيسر هو **الفهرس** (0, 1, 2, 3 افتراضيًا). العمود الأيمن هو البيانات. معًا يشكلان كائن Series.

## إنشاء Series من مصادر مختلفة

**من قائمة** ، يكون الفهرس افتراضيًا نطاقًا من الأعداد الصحيحة:

```python
temperatures = pd.Series([22.5, 24.1, 19.8, 26.3])
print(temperatures)
```

**من قاموس** ، تصبح المفاتيح هي الفهرس:

```python
population = pd.Series({
    "Lagos": 15_400_000,
    "Cairo": 20_900_000,
    "Johannesburg": 5_600_000,
})
print(population)
```

المخرجات:

```
Lagos           15400000
Cairo           20900000
Johannesburg     5600000
dtype: int64
```

**من قيمة عددية** ، تُكرَّر القيمة الواحدة لتملأ الفهرس:

```python
zeros = pd.Series(0, index=["a", "b", "c", "d"])
print(zeros)
```

## الوصول إلى القيم

استخدم الفهرس لاسترجاع القيم. مع الفهرس المعلَّم، يمكنك استخدام أقواس الفهرسة أو الوصول بالنقطة:

```python
print(population["Cairo"])           # 20900000
print(population[["Lagos", "Johannesburg"]])  # subset with multiple labels
```

مع الفهرس الصحيح، يمكنك التقطيع (slice) تمامًا كما تقطّع القوائم:

```python
print(scores[1:3])   # select index 1 and 2
```

## العمليات المتجهة

تدعم كائنات Series العمليات على مستوى العناصر دون استخدام حلقات:

```python
celsius = pd.Series([22, 25, 18, 30])
fahrenheit = celsius * 9 / 5 + 32
print(fahrenheit)
```

المخرجات:

```
0    71.6
1    77.0
2    64.4
3    86.0
dtype: float64
```

تعيد عوامل المقارنة كائن Series منطقيًا:

```python
print(celsius > 24)
```

المخرجات:

```
0    False
1     True
2    False
3     True
dtype: bool
```

## الخصائص والأساليب المفيدة لكائن Series

| الخصية/الطريقة | الوصف |
|---|---|
| `.values` | يُرجع المصفوفة الأساسية من NumPy |
| `.index` | يُرجع كائن الفهرس |
| `.dtype` | يُرجع نوع البيانات |
| `.shape` | يُرجع صفًا مزدوجًا `(n,)` |
| `.mean()`, `.sum()`, `.max()` | أساليب تجميع |
| `.value_counts()` | يحسب القيم الفريدة |

```python
print(scores.mean())       # 84.0
print(scores.max())        # 92
print(scores.shape)        # (4,)
```

## جرّب بنفسك

أنشئ كائن Series اسمه `grades` يحوي درجات الطلاب التالية: Alice: 87, Bob: 92, Carol: 78, David: 95. اطبع الكائن، ثم احسب واطبع متوسط الدرجات. أخيرًا، أنشئ كائن Series منطقيًا يوضح أي الطلاب حصلوا على أكثر من 85.

```python
import pandas as pd

grades = pd.Series({"Alice": 87, "Bob": 92, "Carol": 78, "David": 95})
print(grades)
print(f"Mean: {grades.mean()}")
print(grades > 85)
```

## خلاصات رئيسية

- كائن Series هو مصفوفة أحادية البعد معلّمة ، وهي الأساس في pandas
- يوفر الفهرس تسميات للوصول إلى البيانات وتقطيعها
- تسمح العمليات المتجهة بتحويل أعمدة كاملة دون حلقات
- تُعد القواميس مصدرًا طبيعيًا لكائنات Series ذات تسميات ذات معنى

## تحدي التطبيق

لديك قاموس يمثل هطول الأمطار الشهري بالمليمترات: `{"Jan": 45, "Feb": 38, "Mar": 52, "Apr": 61, "May": 48, "Jun": 35}`. أنشئ كائن Series منه، ثم احسب إجمالي الهطول ومتوسط الهطول الشهري. أي شهر شهد أعلى هطول؟ وأيها شهد الأقل؟