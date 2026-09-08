---
title: "أنواع البيانات"
description: "تعرّف على الأنواع الأساسية في بايثون — int، float، str، bool — وافهم ماذا يمثّل كلٌّ منها."
module: "python-basics"
order: 3
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "التمييز بين قيم int و float و str و bool"
  - "استخدام type() للتحقق من نوع القيمة"
  - "فهم الكتابة الديناميكية في بايثون"
  - "التعرّف على القيم الصادقة والكاذبة"
prerequisites: ["02-variables"]
tags: ["types", "int", "float", "str", "bool", "dynamic-typing"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## كل قيمة لها نوع

النوع هو المجموعة التي تنتمي إليها القيمة — تمامًا كما في الرياضيات حيث تميّز الأعداد الصحيحة عن الأعداد الحقيقية:

| Type | Math analogy | Example |
|---|---|---|
| `int` | $\mathbb{Z}$ (integers) | `42`, `-7` |
| `float` | $\mathbb{R}$ (reals, approximated) | `3.14`, `-0.5` |
| `str` | a finite sequence of characters | `"hello"` |
| `bool` | $\{\text{True}, \text{False}\}$ | `True`, `False` |

تحقّق من نوع القيمة باستخدام `type(...)`:

```python
type(42)      # <class 'int'>
type(3.14)    # <class 'float'>
type("hi")    # <class 'str'>
type(True)    # <class 'bool'>
```

## الكتابة الديناميكية

بايثون **مكتوبة ديناميكيًا**: الاسم غير مربوط بنوع معيّن بشكل دائم. `x = 5` ثم `x = "five"` أمر قانوني — يشير `x` ببساطة إلى مكان جديد:

```python
x = 5
print(type(x))    # <class 'int'>
x = "hello"
print(type(x))    # <class 'str'>
```

هذا مريح، لكنه يعني أيضًا أن *نوع* الاسم لا يمكن معرفته إلا بالنظر إلى ما يشير إليه حاليًا، وليس بتصريحه مسبقًا.

## القيم الصادقة والكاذبة

يحوّل `bool()` أي قيمة إلى `True` أو `False`. القاعدة بسيطة:

- **كاذبة (Falsy)**: `0`, `0.0`, `""` (سلسلة فارغة), `None`
- **صادقة (Truthy)**: كل شيء آخر

```python
bool(0)         # False
bool(1)         # True
bool(-1)        # True  — any nonzero number is truthy
bool("")        # False
bool("hello")   # True  — any non-empty string is truthy
```

هذا مهم عندما تكتب الشروط لاحقًا: `if score:` تعني "إذا كانت score غير صفرية".

## المزالق الشائعة

- **`4 / 2` تساوي `2.0` وليس `2`.** القسمة الحقيقية (`/`) تُرجع دائمًا `float` في بايثون 3. استخدم `4 // 2` للقسمة الصحيحة.
- **`True + True` تساوي `2`.** القيم المنطقية فئات فرعية من `int` في بايثون — تتصرف `True` مثل `1` و`False` مثل `0` في العمليات الحسابية.
- **`type()` يعطي النوع المحدد.** `type(True)` هو `bool` وليس `int`، حتى وإن تصرفت `True` مثل `1` في الرياضيات.

## 🧩 التحديات

<details class="challenge">
<summary>🧩 التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

ما هو `type(7 / 2)`؟ توقّعه قبل تنفيذه، ثم اتحقق.

<p class="challenge__answer">💡 <strong>الإجابة:</strong> <code>type(7 / 2)</code> هو <code>float</code> — القسمة الحقيقية (<code>/</code>) تُنتج دائمًا float في بايثون 3، حتى عندما يكون المعاملان ints والنتيجة عددًا صحيحًا.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

توقّع `bool(0)`، و`bool(0.0)`، و`bool("")`، و`bool("0")`. أيٌّ منها صادق وأيٌّ منها كاذب؟

<p class="challenge__answer">💡 <strong>الإجابة:</strong> <code>bool(0)</code> → False، و<code>bool(0.0)</code> → False، و<code>bool("")</code> → False (سلسلة فارغة)، و<code>bool("0")</code> → True (سلسلة غير فارغة، حتى وإن كانت تحتوي على الحرف "0").</p>

</div>
</details>

<details class="challenge">
<summary>🧩 التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

`0.1 + 0.2` في بايثون **لا** تساوي بالضبط `0.3`. جرّبها. لماذا قد لا يمثّل `float` — الذي يقرّب $\mathbb{R}$ باستخدام أرقام ثنائية منتهية — القيمة $0.1$ بدقة؟

<p class="challenge__answer">💡 <strong>الإجابة:</strong> ليس لـ 0.1 تمثيل دقيق في النظام الثنائي (تمامًا كما لا توجد لـ 1/3 دقة عشرية تامة). تستخدم الأعداد العشرية كسورًا ثنائية منتهية، لذا يتراكم لـ 0.1 + 0.2 خطأ تقريبٍ صغير: 0.30000000000000004 وليس 0.3. هذا قيد أساسي في الحساب ذي الفاصلة العائمة، وليس خللًا في بايثون.</p>

</div>
</details>

## 🤔 أسئلة سقراطية

- إذا كانت `bool(-1)` تساوي `True`، فما القاعدة الواحدة التي تفسّر لماذا تكون `-1` صادقة بينما `0` كاذبة؟
- تمتلك بايثون `isinstance(42, int)` التي تُرجع `True`. هل سيكون `isinstance` أكثر موثوقية من `type(x) == int` لفحص الأنواع؟ ولماذا أو لماذا لا؟
- لماذا تستخدم بايثون `True` و`False` (بأحرف كبيرة) بدلًا من `true` و`false`؟ ما الكلمات الأخرى المكتوبة بأحرف كبيرة التي تحجزها بايثون؟

## ✅ مراجعة سريعة

<div class="quiz" data-quiz="python-101-types">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ما نوع 3.14؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">int</button>
      <button class="quiz-q__opt" data-idx="1">float</button>
      <button class="quiz-q__opt" data-idx="2">str</button>
      <button class="quiz-q__opt" data-idx="3">bool</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. ما نتيجة True + True؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">True</button>
      <button class="quiz-q__opt" data-idx="1">False</button>
      <button class="quiz-q__opt" data-idx="2">2</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">3. أيٌّ مما يلي كاذب (falsy)؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">""</button>
      <button class="quiz-q__opt" data-idx="1">"0"</button>
      <button class="quiz-q__opt" data-idx="2">-1</button>
      <button class="quiz-q__opt" data-idx="3">1</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
