---
title: "فهم القوائم (List Comprehensions)"
description: "أنشئ القوائم بإيجاز باستخدام فهم القوائم — الطريقة الأكثر تعبيرًا في بايثون."
module: "data-structures"
order: 17
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "كتابة فهم القوائم للتحويل والتصفية"
  - "استخدام فهم الشرط لضمان خلط المنطق"
  - "بناء القواميس والمجموعات عبر الفهم"
  - "فهم متى يكون الفهم أكثر وضوحًا من الحلقات"
prerequisites: ["16-dicts-and-sets"]
tags: ["comprehension", "list", "dict", "set", "generator"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## فهم القوائم

طريقة موجزة لإنشاء قوائم من أدوات التكرار:

```python
# Regular loop
squares = []
for x in range(6):
    squares.append(x ** 2)

# Comprehension
squares = [x ** 2 for x in range(6)]
# [0, 1, 4, 9, 16, 25]
```

## التصفية بالشروط

أضف شرط `if` لتصفية العناصر:

```python
evens = [x for x in range(10) if x % 2 == 0]
# [0, 2, 4, 6, 8]

long_words = [w.upper() for w in ["hi", "hello", "hey"] if len(w) > 2]
# ['HELLO', 'HEY']
```

## if/else في الفهم

استخدم `if...else` **قبل** `for` (إنه تعبير وليس مرشحًا):

```python
labels = ["even" if x % 2 == 0 else "odd" for x in range(5)]
# ['even', 'odd', 'even', 'odd', 'even']
```

## فهم القواميس

```python
squares_dict = {x: x**2 for x in range(6)}
# {0: 0, 1: 1, 2: 4, 3: 9, 4: 16, 5: 25}

# Invert a dict
original = {"a": 1, "b": 2}
inverted = {v: k for k, v in original.items()}
# {1: 'a', 2: 'b'}
```

## فهم المجموعات

```python
lengths = {len(word) for word in ["hello", "hi", "hey"]}
# {2, 3, 5}  (unique lengths)
```

## الفهم المتداخل

```python
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
flat = [num for row in matrix for num in row]
# [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

## متى لا تستخدم الفهم

- **الإفراط في التعقيد**: بعدة شروط وحلقات، تعود إلى الوضوح مع حلقة for تقليدية
- **نسيان نطاق المتغير**: المتغيرات داخل فكرة القائمة تُسرب إلى النطاق المحيط (في بعض نسخ بايثون)
- **خلط الفهم مع المولّدات**: الأقواس المستديرة تعطي مولّدًا — تحقق من نوعك

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 التحديات</h2>

<details class="challenge">
<summary>التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

اكتب فهم قائمة يحسب الجذر التربيعي لكل عدد فردي من 1 إلى 9 (الجذور الكاملة فقط).

<p class="challenge__answer">💡 <strong>الإجابة:</strong> <code>[int(x ** 0.5) for x in range(1, 10) if x % 2 == 1]</code> → <code>[1, 1, 2, 2, 3]</code> — الفهم يعمل على الأعداد الفردية.</p>

</div>
</details>

<details class="challenge">
<summary>التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

بالنظر إلى قائمة كلمات، أنشئ فهم قائمة يبني سلاسل "الكلمة:الطول" لكن فقط للكلمات الأطول من 3 أحرف.

<p class="challenge__answer">💡 <strong>الإجابة:</strong> الصيغة: <code>[f"{w}:{len(w)}" for w in words if len(w) > 3]</code> — مع مدخلات مثل <code>["a", "banana", "cherry", "pie"]</code> تُعطي <code>["banana:6", "cherry:6"]</code>.</p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 أسئلة سقراطية</h2>

- متى يكون الفهم أكثر وضوحًا من الحلقة؟ بأي معيار تُقرّر — ومتى يعكسه ذلك؟
- ماذا يحدث عندما تتداخل فكرتان — متى تعيد كتابة المنطق في حلقة for؟
- ما الفرق بين `f(x) for x in xs` و`(f(x) for x in xs)`؟ وأيهما يستهلك الذاكرة أكثر؟

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ مراجعة سريعة</h2>

<div class="quiz" data-quiz="python-101-comprehensions">
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">1. ما هو <code>[x * 2 for x in range(3)]</code>؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">[0, 2, 4]</button>
      <button class="quiz-q__opt" data-idx="1">[2, 4, 6]</button>
      <button class="quiz-q__opt" data-idx="2">[0, 1, 2]</button>
      <button class="quiz-q__opt" data-idx="3">[0, 3, 6]</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. ما قيم <code>[x for x in range(10) if x % 3 == 0]</code>؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">[0, 3, 6, 9, 12]</button>
      <button class="quiz-q__opt" data-idx="1">[1, 3, 6, 9]</button>
      <button class="quiz-q__opt" data-idx="2">[0, 3, 6, 9]</button>
      <button class="quiz-q__opt" data-idx="3">[3, 6, 9]</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>