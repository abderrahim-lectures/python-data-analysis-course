---
title: "If / Elif / Else"
description: "فرّع كودك بناءً على الشروط — أساس اتخاذ القرار في بايثون."
module: "control-flow"
order: 8
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "كتابة كتل if/elif/else لتفريع المنطق"
  - "استخدام عوامل المقارنة والعوامل المنطقية في الشروط"
  - "فهم القيم الصادقة والكاذبة في بايثون"
  - "كتابة شروط متداخلة عند الحاجة"
prerequisites: ["07-boolean-operators"]
tags: ["if", "elif", "else", "conditionals", "truthiness"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## عبارات If

تنفّذ كتلة `if` جسمها فقط عندما يكون الشرط `True`:

```python
score = 85
if score >= 60:
    print("Passing!")
```

## إضافة else

يلتقط `else` كل ما لم يطابقه `if`:

```python
score = 45
if score >= 60:
    print("Passing!")
else:
    print("Needs more work")
```

## Elif للفروع المتعددة

يفحص `elif` (اختصارًا لـ "else if") الشروط بالترتيب، ويتوقف عند أول تطابق:

```python
score = 78
if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
else:
    grade = "F"
print(grade)  # B
```

يُنفَّذ فرع واحد فقط — أول شرط يكون `True`.

## القيم الصادقة والكاذبة

تعامل بايثون بعض القيم كأنها `True` وغيرها كأنها `False` في السياق المنطقي:

```python
# These are all "falsy":
bool(0)       # False
bool(0.0)     # False
bool("")      # False
bool([])      # False
bool(None)    # False

# Everything else is "truthy":
bool(1)       # True
bool("hello") # True
bool([1, 2])  # True
```

هذا يعني أنه يمكنك كتابة شروط نظيفة دون مقارنات صريحة:

```python
name = ""
if not name:
    print("Name is empty")

items = [1, 2, 3]
if items:
    print("We have items")
```

## التداخل

يمكنك وضع كتل `if` داخل كتل `if` أخرى، لكن أبقِ التداخل ضحلًا من أجل قابلية القراءة:

```python
age = 25
has_id = True

if age >= 21:
    if has_id:
        print("Entry allowed")
    else:
        print("Need ID")
else:
    print("Too young")
```

## المزالق الشائعة

- **نسيان النقطتين** بعد `if` أو `elif` أو `else`
- **استخدام `=` بدلًا من `==`** في الشروط (`=` تُسنِد، و`==` تقارن)
- **الإفراط في التداخل** عندما يكون `elif` أو `return` مبكرًا أنظف

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 التحديات</h2>

<details class="challenge">
<summary>التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

اكتب دالة `classify_temp(temp)` تُرجع:
- `"freezing"` إذا كانت temp < 0
- `"cold"` إذا كانت 0 <= temp < 15
- `"warm"` إذا كانت 15 <= temp < 30
- `"hot"` إذا كانت temp >= 30

<p class="challenge__answer">💡 <strong>الإجابة:</strong> استخدم سلسلة <code>elif</code>: <code>if temp &lt; 0: return "freezing" elif temp &lt; 15: return "cold" elif temp &lt; 30: return "warm" else: return "hot"</code></p>

</div>
</details>

<details class="challenge">
<summary>التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

بالنظر إلى `text = "Hello, World!"`، اكتب فحصًا يطبع `"uppercase"` إذا كان النص كله كبيرًا، أو `"lowercase"` إذا كان كله صغيرًا، أو `"mixed"` بخلاف ذلك.

<p class="challenge__answer">💡 <strong>الإجابة:</strong> <code>if text.isupper(): print("uppercase") elif text.islower(): print("lowercase") else: print("mixed")</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 أسئلة سقراطية</h2>

- لماذا تستخدم بايثون `elif` بدلًا من `else if`؟ وماذا سيحدث لو كتبت `else if`؟
- إذا كانت `score = 85`، فكم شرطًا تُقيّم `if score >= 90: ... elif score >= 80: ... elif score >= 70: ...` قبل الدخول إلى فرع؟
- ما الفرق بين `if x:` و`if x is not None:`؟ ومتى يهمّ كلٌّ منهما؟

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ مراجعة سريعة</h2>

<div class="quiz" data-quiz="python-101-control-flow">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. ماذا يطبع هذا؟ <code>x = 0; if x: print("yes") else: print("no")</code></p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">yes</button>
      <button class="quiz-q__opt" data-idx="1">Error</button>
      <button class="quiz-q__opt" data-idx="2">no</button>
      <button class="quiz-q__opt" data-idx="3">None</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. أي شرط يُفحص أولًا؟ <code>if x > 5: ... elif x > 10: ... elif x > 3: ...</code></p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">x > 10</button>
      <button class="quiz-q__opt" data-idx="1">x > 5</button>
      <button class="quiz-q__opt" data-idx="2">x > 3</button>
      <button class="quiz-q__opt" data-idx="3">They run in parallel</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>