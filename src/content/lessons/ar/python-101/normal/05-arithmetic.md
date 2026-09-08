---
title: "عوامل الحساب"
description: "اجمع واطرح واضرب واقسم وقسم بأرضية واحسب الباقي والأس — جميع عوامل الحساب الثمانية."
module: "operators"
order: 5
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "استخدام عوامل الحساب الثمانية جميعها: +, -, *, /, //, %, **"
  - "فهم القسمة الصحيحة (الأرضية) مقابل القسمة الحقيقية"
  - "تطبيق أولوية العمليات (PEMDAS)"
  - "استخدام الأقواس لتجاوز الأولوية"
prerequisites: ["04-type-conversion"]
tags: ["arithmetic", "division", "modulo", "exponent", "precedence"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## عوامل الحساب الثمانية

تمتلك بايثون العوامل الأربعة القياسية بالإضافة إلى أربعة أخرى:

```python
7 + 2    # 9   — addition
7 - 2    # 5   — subtraction
7 * 2    # 14  — multiplication
7 / 2    # 3.5 — true division (always returns float)
7 // 2   # 3   — floor division (rounds toward -∞)
7 % 2    # 1   — modulo (remainder)
7 ** 2   # 49  — exponentiation (7²)
```

## القسمة الصحيحة مقابل القسمة الحقيقية

يعطي `/` دائمًا `float`، حتى عندما يكون المعاملان ints والنتيجة عددًا صحيحًا:

```python
4 / 2    # 2.0  — float, not int
```

يعطي `//` **ناتج القسمة المَقْطُوع نحو الأقل (floor)** — يقرب دائمًا نحو سالب اللانهاية:

```python
7 // 2    # 3   — floor(3.5)
-7 // 2   # -4  — floor(-3.5) = -4, not -3
```

السطر الأخير مفاجأة شائعة. تتبع القسمة الصحيحة دالة الأرضية الرياضية $\lfloor x \rfloor$، التي تقرب للأسفل (نحو $-\infty$)، وليس نحو الصفر.

## المعامل (الباقي)

يعطي `%` الباقي بعد القسمة الصحيحة. المطابقة الأساسية:

```
a == (a // b) * b + (a % b)
```

```python
15 % 4    # 3   — since 15 = 4×3 + 3
15 // 4   # 3
4 * 3 + 3 # 15  ✓
```

## أولوية العمليات

تتبع بايثون PEMDAS — نفس الترتيب الذي تعرفه من الرياضيات:

1. `**` أولًا (الأس)
2. `*`, `/`, `//`, `%` (من اليسار إلى اليمين)
3. `+`, `-` (من اليسار إلى اليمين)

```python
2 + 3 * 4      # 14, not 20
(2 + 3) * 4    # 20 — parentheses override
2 ** 3 ** 2     # 512, not 64 — ** is right-associative: 2 ** (3 ** 2) = 2 ** 9
```

## المزالق الشائعة

- **`/` مقابل `//`.** `7 / 2` تساوي `3.5` (float)، بينما `7 // 2` تساوي `3` (int). استخدم `//` عندما تريد نتيجة صحيحة.
- **القسمة الصحيحة مع الأعداد السالبة.** `-7 // 2` تساوي `-4` وليست `-3`. هذا يتبع دالة الأرضية الرياضية، وليس البتر.
- **`%` مع الأعداد العشرية.** `7.5 % 2` تساوي `1.5` — يعمل المعامل مع الأعداد العشرية أيضًا، وليس فقط مع الأعداد الصحيحة.

## 🧩 التحديات

<details class="challenge">
<summary>🧩 التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

بدون تنفيذها، احسب `15 // 4` و`15 % 4` يدويًا. ثم تحقق: هل `4 * (15 // 4) + (15 % 4)` تساوي `15`؟

<p class="challenge__answer">💡 <strong>الإجابة:</strong> 15 // 4 تساوي 3 (أرضية 3.75)، و15 % 4 تساوي 3 (بما أن 15 = 4·3 + 3). معًا: 4 × 3 + 3 = 15. هذه هي مطابقة خوارزمية القسمة.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

كيف تستخرج رقم المئات من عدد؟ على سبيل المثال، بالنظر إلى `n = 4567`، استخرج `5` باستخدام الحساب فقط (بدون سلاسل).

<p class="challenge__answer">💡 <strong>الإجابة:</strong> <code>(n // 100) % 10</code> — اقسم أولًا على 100 لتحريك الرقم لليمين (4567 ← 45)، ثم خذ المعامل 10 للحصول على آخر رقم (45 ← 5).</p>

</div>
</details>

<details class="challenge">
<summary>🧩 التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

لماذا تستخدم بايثون `**` للأس بدلًا من `^`؟ وماذا يفعل `^` فعلًا في بايثون؟ (تلميح: إنه ليس الأس.)

<p class="challenge__answer">💡 <strong>الإجابة:</strong> <code>^</code> هو عامل XOR على مستوى البت (bitwise) في بايثون، وليس الأس. تستخدم بايثون <code>**</code> لتجنب الالتباس مع اللغات ذات النمط C حيث يعني <code>^</code> عملية XOR.</p>

</div>
</details>

## 🤔 أسئلة سقراطية

- لماذا تقرّب القسمة الصحيحة في بايثون نحو سالب اللانهاية بدلًا من نحو الصفر؟ وما الفائدة العملية التي يمنحك إياها ذلك (تلميح: فكّر كيف تعمل `divmod()`)؟
- `2 ** 3 ** 2` تساوي `512` وليست `64`. لماذا يكون عامل `**` ترابطيًا من اليمين بينما `+` و`*` ترابطيان من اليسار؟
- هل يمكنك التفكير في سيناريو من العالم الحقيقي يكون فيه حساب المعامل أساسيًا؟ (فكّر في الساعات، أو أيام التقويم، أو فهرسة المصفوفات.)

## ✅ مراجعة سريعة

<div class="quiz" data-quiz="python-101-arithmetic">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. ما قيمة -7 // 2؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">-3</button>
      <button class="quiz-q__opt" data-idx="1">3</button>
      <button class="quiz-q__opt" data-idx="2">-4</button>
      <button class="quiz-q__opt" data-idx="3">-3.5</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">2. ما نتيجة 2 ** 3 ** 2؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">512</button>
      <button class="quiz-q__opt" data-idx="1">64</button>
      <button class="quiz-q__opt" data-idx="2">36</button>
      <button class="quiz-q__opt" data-idx="2">8</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">3. ما قيمة 7 % 3؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">2</button>
      <button class="quiz-q__opt" data-idx="1">1</button>
      <button class="quiz-q__opt" data-idx="2">3</button>
      <button class="quiz-q__opt" data-idx="3">0</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>