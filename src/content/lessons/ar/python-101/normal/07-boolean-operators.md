---
title: "العوامل المنطقية"
description: "اجمع الشروط باستخدام and و or و not — روابط المنطق في بايثون."
module: "operators"
order: 7
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "استخدام and و or و not لدمج التعابير المنطقية"
  - "فهم التقييم بالتقصير (short-circuit)"
  - "تطبيق قوانين ديمورجان في بايثون"
  - "كتابة شروط معقدة بوضوح"
prerequisites: ["06-comparison-operators"]
tags: ["boolean", "and", "or", "not", "short-circuit", "logic"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## ثلاثة عوامل منطقية

تمتلك بايثون `and` و`or` و`not` — الروابط المنطقية من منطق القضايا:

```python
True and True      # True
True and False     # False
False or True      # True
not True           # False
```

## دمج الشروط

هذه العوامل أكثر فائدة عند استخدامها مع عوامل المقارنة:

```python
age = 20
has_ticket = True

if age >= 18 and has_ticket:
    print("Welcome in")

temperature = 30
if temperature < 0 or temperature > 40:
    print("Extreme weather!")

is_weekend = False
if not is_weekend:
    print("Time to work")
```

## التقييم بالتقصير (Short-circuit)

تُقيّم بايثون `and` و`or` من اليسار إلى اليمين و**تتوقف بمجرد تحديد النتيجة**:

- `A and B` — إذا كانت `A` تساوي `False`، لا تُقيَّم `B` أبدًا (النتيجة بالفعل `False`)
- `A or B` — إذا كانت `A` تساوي `True`، لا تُقيَّم `B` أبدًا (النتيجة بالفعل `True`)

```python
x = 0
# This is safe — division never happens because 0 is falsy
result = x != 0 and 10 / x > 2
```

لهذا تستخدم بايثون الكلمات (`and`, `or`) بدلًا من الرموز (`&&`, `||`): يسمح لك سلوك التقصير بحماية نفسك من الأخطاء دون عبارات `if` إضافية.

## قوانين ديمورجان

تنطبق المتطابقات المنطقية مباشرة في بايثون:

- `not (A and B)` ≡ `(not A) or (not B)`
- `not (A or B)` ≡ `(not A) and (not B)`

```python
# These are equivalent:
not (age >= 18 and has_ticket)
age < 18 or not has_ticket
```

هذا مفيد لتبسيط الشروط المنفية المعقدة.

## جداول الحقيقة

| `A` | `B` | `A and B` | `A or B` |
|-----|-----|-----------|----------|
| True | True | True | True |
| True | False | False | True |
| False | True | False | True |
| False | False | False | False |

يقوم `not` ببساطة بالقلب: `not True` ← `False`، و`not False` ← `True`.

## المزالق الشائعة

- **`and`/`or` لا يُرجعان `True`/`False` — بل يُرجعان أحد المعاملين.** `0 and 5` يُرجع `0` وليس `False`. `0 or 5` يُرجع `5` وليس `True`. تستخدم بايثون القيمة "الصادقة/الكاذبة"، وليس قيمة منطقية.
- **نسيان أولوية `not`.** يُحلَّل `not a == b` إلى `not (a == b)` وليس إلى `(not a) == b`. استخدم الأقواس عند الشك.
- **استخدام `and`/`or` بدلًا من `&`/`|` على مستوى البت.** `True and False` تساوي `False`، لكن `True & False` تثير خطأ. استخدم `and`/`or` للقيم المنطقية، و`&`/`|` للبتات.

## 🧩 التحديات

<details class="challenge">
<summary>🧩 التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

بدون تنفيذها، توقّع: `0 and 5`، و`0 or 5`، و`3 and 5`، و`3 or 5`. ما النمط الذي تراه؟

<p class="challenge__answer">💡 <strong>الإجابة:</strong> <code>0 and 5</code> → 0، و<code>0 or 5</code> → 5، و<code>3 and 5</code> → 5، و<code>3 or 5</code> → 3. النمط: يُرجع <code>and</code> أول قيمة كاذبة (أو آخر قيمة إذا كانت جميعها صادقة)؛ بينما يُرجع <code>or</code> أول قيمة صادقة (أو آخر قيمة إذا كانت جميعها كاذبة).</p>

</div>
</details>

<details class="challenge">
<summary>🧩 التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

أعد كتابة `not (x > 5 and y < 10)` باستخدام قانون ديمورجان. هل النسخة المعاد كتابتها أسهل قراءة؟

<p class="challenge__answer">💡 <strong>الإجابة:</strong> <code>not (x > 5 and y < 10)</code> ≡ <code>x <= 5 or y >= 10</code> — مقروءة مباشرة دون نفي تعبير مركّب.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

اكتب شرطًا يتحقق مما إذا كانت السنة سنة كبيسة: تقبل القسمة على 4، باستثناء القرون (القابلة للقسمة على 100) ما لم تكن أيضًا قابلة للقسمة على 400. استخدم `and` و`or` و`not` للتعبير عن ذلك بوضوح.

<p class="challenge__answer">💡 <strong>الإجابة:</strong> <code>(year % 4 == 0 and year % 100 != 0) or (year % 400 == 0)</code> — تقبل القسمة على 4 لكن ليس على 100، أو على 400.</p>

</div>
</details>

## 🤔 أسئلة سقراطية

- تُرجع `0 and 5` القيمة `0` وليس `False`. لماذا تُرجع بايثون القيمة الفعلية بدلًا من تحويلها إلى قيمة منطقية؟ ومتى يكون هذا السلوك مفيدًا؟
- إذا كان `or` يُرجع أول قيمة صادقة، فماذا تُرجع `"hello" or "world"`؟ وماذا عن `"" or "world"`؟
- لماذا تستخدم بايثون الكلمات (`and`, `or`, `not`) بدلًا من الرموز (`&&`, `||`, `!`)؟ وما الفائدة التي يمنحها ذلك للقراءة؟

## ✅ مراجعة سريعة

<div class="quiz" data-quiz="python-101-boolean">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ما قيمة True and False؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">True</button>
      <button class="quiz-q__opt" data-idx="1">False</button>
      <button class="quiz-q__opt" data-idx="2">None</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">2. ماذا تُقيَّم 0 or 5 إليه؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">5</button>
      <button class="quiz-q__opt" data-idx="1">0</button>
      <button class="quiz-q__opt" data-idx="2">True</button>
      <button class="quiz-q__opt" data-idx="3">False</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">3. أيٌّ مما يلي مكافئ لـ not (a and b)؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">not a and not b</button>
      <button class="quiz-q__opt" data-idx="1">a or b</button>
      <button class="quiz-q__opt" data-idx="2">not a or not b</button>
      <button class="quiz-q__opt" data-idx="3">a and not b</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>