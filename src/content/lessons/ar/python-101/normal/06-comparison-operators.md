---
title: "عوامل المقارنة"
description: "اختبر التساوي وعدم التساوي والترتيب — بالإضافة إلى سلسلة المقارنات في تعبير واحد."
module: "operators"
order: 6
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "استخدام == و != و < و <= و > و >= لمقارنة القيم"
  - "سلاسل المقارنات مثل 0 <= x < 10"
  - "فهم كيف يختلف == عن is"
  - "مقارنة قيم من أنواع مختلفة"
prerequisites: ["05-arithmetic"]
tags: ["comparison", "equality", "chaining", "bool"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## عوامل المقارنة الستة

تُنتج عوامل المقارنة قيمة منطقية `bool` — `True` أو `False`:

```python
5 == 5      # True   — equal
5 != 3      # True   — not equal
5 < 10      # True   — less than
5 <= 5      # True   — less than or equal
5 > 10      # False  — greater than
5 >= 5      # True   — greater than or equal
```

## المقارنات المتسلسلة

تتيح لك بايثون سلسلة المقارنات بالطريقة التي تفعلها في الرياضيات:

```python
x = 5
0 <= x < 10    # True — both conditions hold
0 <= x < 3     # False — x < 3 fails
```

يُقيَّم هذا كتعبير واحد، وليس كتعبيرين منفصلين مربوطين بـ `and`. إنه مكافئ لـ `0 <= x and x < 10`، لكنه يُقرأ بشكل أكثر طبيعية.

## `==` مقابل `is`

يختبر `==` **تساوي القيمة** — هل هذان الشيئان لهما نفس المحتوى؟
يختبر `is` **الهوية** — هل هذان هما نفس الكائن تمامًا في الذاكرة؟

```python
a = [1, 2, 3]
b = [1, 2, 3]
a == b    # True  — same content
a is b    # False — different objects

c = a
a is c    # True  — same object
```

**قاعدة أساسية:** استخدم دائمًا `==` لمقارنة القيم. لا تستخدم `is` إلا عند التحقق من `None`:

```python
if x is None:    # correct
if x == None:    # works but non-idiomatic
```

## مقارنة الأنواع المختلفة

تسمح بايثون بمقارنة قيم من أنواع مختلفة، لكن النتيجة قد تكون مفاجئة:

```python
5 == 5.0      # True  — int and float compared numerically
"5" == 5      # False — string and int are never equal
"5" < 6       # TypeError: '<' not supported between str and int
```

في بايثون 3، تثير مقارنات الترتيب (`<`, `>`) بين أنواع غير متوافقة خطأ `TypeError`. فقط `==` و`!=` يعملان عبر الأنواع.

## المزالق الشائعة

- **`=` مقابل `==`.** `if score = 60:` خطأ نحوي — لن تسمح لك بايثون بالإسناد داخل شرط عن طريق المصادفة. استخدم `==`.
- **مقارنة الأعداد العشرية.** `0.1 + 0.2 == 0.3` تساوي `False` بسبب عدم دقة الفاصلة العائمة. استخدم `abs((0.1 + 0.2) - 0.3) < 1e-10` بدلًا من ذلك.
- **`==` مع `None`.** `x == None` تعمل لكن `x is None` هي الطريقة البايثونية.

## 🧩 التحديات

<details class="challenge">
<summary>🧩 التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body>

توقّع نتيجة كلٍّ منها دون تنفيذ: `5 == 5.0`، و`"5" == 5`، و`5 < "6"`.

<p class="challenge__answer">💡 <strong>الإجابة:</strong> <code>5 == 5.0</code> → True (تساوٍ عددي)، <code>"5" == 5</code> → False (أنواع مختلفة)، <code>5 < "6"</code> → TypeError (الترتيب بين int وstr غير مسموح في بايثون 3).</p>

</div>
</details>

<details class="challenge">
<summary>🧩 التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

اكتب مقارنة متسلسلة تتحقق مما إذا كان العدد `n` بين 1 و100 شاملًا، باستخدام تعبير واحد (بدون `and`).

<p class="challenge__answer">💡 <strong>الإجابة:</strong> <code>1 <= n <= 100</code> — تجعل مقارنة بايثون المتسلسلة هذا يُقرأ مثل الترميز الرياضي.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

لماذا تُقيَّم `0.1 + 0.2 == 0.3` إلى `False`؟ كيف تكتب اختبار تساوٍ صحيحًا للأعداد العشرية؟

<p class="challenge__answer">💡 <strong>الإجابة:</strong> لا تمتلك 0.1 و0.2 تمثيلًا ثنائيًا دقيقًا، لذا يكون مجموعهما 0.30000000000000004 وليس 0.3 بالضبط. الاختبار الصحيح: <code>abs((0.1 + 0.2) - 0.3) < 1e-10</code> — تحقّق مما إذا كان الفرق ضمن تفاوتٍ ضئيل.</p>

</div>
</details>

## 🤔 أسئلة سقراطية

- إذا كانت `a == b` تساوي `True`، فهل يعني ذلك أن `a is b` يجب أن تكون `True` أيضًا؟ تحت أي ظروف يمكن أن يكون كائنان متساويين لكن غير متطابقين؟
- لماذا تمنع بايثون `5 < "6"` لكنها تسمح بأن تكون `5 == "5.0"` قيمة `False`؟ ما مبدأ التصميم المعمول به هنا؟
- في أي السيناريوهات قد يكون `is` أكثر فائدة من `==` للتحقق من التساوي؟ (فكّر في الفردات مثل `None`.)

## ✅ مراجعة سريعة

<div class="quiz" data-quiz="python-101-comparison">
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">1. ما قيمة 5 == 5.0؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">True</button>
      <button class="quiz-q__opt" data-idx="1">False</button>
      <button class="quiz-q__opt" data-idx="2">TypeError</button>
      <button class="quiz-q__opt" data-idx="3">None</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. ماذا تُقيَّم 0 <= 5 < 10 إليه؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">False</button>
      <button class="quiz-q__opt" data-idx="1">0</button>
      <button class="quiz-q__opt" data-idx="2">True</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">3. أيٌّ مما يلي هو الطريقة البايثونية للتحقق من أن x تساوي None؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">x == None</button>
      <button class="quiz-q__opt" data-idx="1">x is None</button>
      <button class="quiz-q__opt" data-idx="2">x = None</button>
      <button class="quiz-q__opt" data-idx="3">None is x</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>