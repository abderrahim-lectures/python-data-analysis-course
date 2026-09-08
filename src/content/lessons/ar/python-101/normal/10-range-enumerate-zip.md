---
title: "Range و Enumerate و Zip"
description: "ولّد متتاليات الأرقام، وتتبّع المؤشرات، واجمع بين الكائنات القابلة للتكرار."
module: "control-flow"
order: 10
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "استخدام range() لتوليد متتاليات الأرقام"
  - "استخدام enumerate() للحصول على المؤشر + القيمة أثناء التكرار"
  - "استخدام zip() للتكرار عبر متتاليات متعددة بالتوازي"
  - "كتابة حلقات بايثونية تتجنب تتبّع المؤشر يدويًا"
prerequisites: ["09-for-while-loops"]
tags: ["range", "enumerate", "zip", "iteration"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## Range

يولّد `range()` متتالية من الأعداد الصحيحة — مفيد لتكرار الكود عددًا محددًا من المرات:

```python
for i in range(5):
    print(i)  # 0 1 2 3 4
```

ثلاث صيغ:

```python
range(5)       # 0, 1, 2, 3, 4
range(2, 8)    # 2, 3, 4, 5, 6, 7
range(0, 20, 3) # 0, 3, 6, 9, 12, 15, 18
```

`range` كسول — لا ينشئ كل الأعداد دفعة واحدة. هذا يجعله فعّالًا من حيث الذاكرة للمتتاليات الكبيرة.

## Enumerate

يضيف `enumerate()` عدادًا إلى أي كائن قابل للتكرار، فلا تحتاج إلى متغيرات مؤشر يدوية:

```python
fruits = ["apple", "banana", "cherry"]

# Clunky:
i = 0
for fruit in fruits:
    print(f"{i}: {fruit}")
    i += 1

# Pythonic:
for i, fruit in enumerate(fruits):
    print(f"{i}: {fruit}")

# Start counting from 1:
for i, fruit in enumerate(fruits, start=1):
    print(f"{i}: {fruit}")
```

## Zip

يجمع `zip()` بين كائنات متعددة قابلة للتكرار، مزاوجًا العناصر حسب الموضع:

```python
names = ["Alice", "Bob", "Charlie"]
scores = [85, 92, 78]

for name, score in zip(names, scores):
    print(f"{name}: {score}")
# Alice: 85
# Bob: 92
# Charlie: 78
```

يتوقف عند أقصر كائن قابل للتكرار افتراضيًا، أو استخدم `itertools.zip_longest` للاستمرار إلى الأطول.

## المزالق الشائعة

- **نسيان أن `range` حصري** عند الطرف الأعلى: `range(5)` يعطي 0–4 وليس 0–5
- **استخدام `enumerate` على `dict`** — التكرار على dict يعطي المفاتيح افتراضيًا؛ استخدم `.items()` لأزواج المفتاح-القيمة
- **مزاوجة أطوال غير متساوية** — تفقد عناصر بصمت؛ فكّر في `zip_longest` بقيمة تعبئة

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 التحديات</h2>

<details class="challenge">
<summary>التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

استخدم `enumerate` لطباعة كل عنصر في `colors = ["red", "green", "blue"]` مع موضعه بدءًا من 1.

<p class="challenge__answer">💡 <strong>الإجابة:</strong> <code>for i, color in enumerate(colors, 1): print(f"{i}. {color}")</code></p>

</div>
</details>

<details class="challenge">
<summary>التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

بالنظر إلى `keys = ["a", "b"]` و`values = [1, 2]`، استخدم `zip` لإنشاء قاموس.

<p class="challenge__answer">💡 <strong>الإجابة:</strong> <code>dict(zip(keys, values))</code> → <code>{"a": 1, "b": 2}</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 أسئلة سقراطية</h2>

- لماذا يُفضَّل `range` على إنشاء قائمة `[0, 1, 2, 3, 4]`؟ وماذا يحدث عندما تحتاج إلى مليون رقم؟
- إذا كان `zip` يتوقف عند أقصر كائن قابل للتكرار، فكيف تكشف أي مدخلات كانت أقصر؟ ومتى يهمّ ذلك؟
- هل يمكنك استخدام `enumerate` على `dict`؟ وماذا تمثّل المؤشرات؟

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ مراجعة سريعة</h2>

<div class="quiz" data-quiz="python-101-range-enumerate-zip">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ما هي <code>list(range(1, 10, 2))</code>؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">[1, 2, 3, 4, 5, 6, 7, 8, 9]</button>
      <button class="quiz-q__opt" data-idx="1">[1, 3, 5, 7, 9]</button>
      <button class="quiz-q__opt" data-idx="2">[2, 4, 6, 8]</button>
      <button class="quiz-q__opt" data-idx="3">[1, 2, 4, 8]</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. ماذا تُرجع <code>list(zip([1, 2], [3, 4, 5]))</code>؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">[(1, 3), (2, 4), (5,)]</button>
      <button class="quiz-q__opt" data-idx="1">[(1, 3, 5), (2, 4)]</button>
      <button class="quiz-q__opt" data-idx="2">[(1, 3), (2, 4)]</button>
      <button class="quiz-q__opt" data-idx="3">[(1, 2), (3, 4, 5)]</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>