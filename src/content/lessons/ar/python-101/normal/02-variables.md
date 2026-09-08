---
title: "المتغيرات والتسمية"
description: "خزِّن القيم تحت أسماء، وافهم الإسناد، واتبع اصطلاحات تسمية بايثون."
module: "python-basics"
order: 2
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "إسناد القيم إلى المتغيرات وإعادة إسنادها"
  - "شرح سبب كون المتغيرات تسميات وليست صناديق"
  - "استخدام عوامل الإسناد المتزايد (+=, -=, *=, /=)"
  - "اتباع اصطلاحات تسمية snake_case"
prerequisites: ["01-printing"]
tags: ["variables", "assignment", "naming", "snake_case"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## المتغيرات كأسماء للقيم

في الرياضيات، "لنفترض أن $x = 5$" يربط اسمًا بقيمة. تفعل بايثون ذلك تمامًا:

```python
x = 5
```

يُقيَّم الطرف الأيمن أولًا (`5`)، ثم يُوجَّه الاسم `x` إليه. بخلاف الرياضيات، يمكن **إعادة إسناد** `x`:

```python
x = 5
x = x + 1  # x now names 6
```

اقرأ `x = x + 1` على أنها "القيمة الجديدة لـ $x$ هي القيمة القديمة لـ $x$ زائد واحد" — تمامًا كما تقرأ علاقة تكرارية $x_{n+1} = x_n + 1$.

## الإسناد المتزايد

نمط "اقرأ-احسب-أعدّ التخزين" شائع جدًا لدرجة أن بايثون توفّر صيغة مختصرة:

```python
x = 5
x += 1     # same as x = x + 1  -> 6
x -= 2     # same as x = x - 2  -> 4
x *= 3     # same as x = x * 3  -> 12
x /= 4     # same as x = x / 4  -> 3.0
```

## اصطلاحات التسمية

يجب أن يبدأ الاسم (**المعرّف**) بحرف أو شرطة سفلية، ولا يمكنه أن يحتوي بعد ذلك إلا على الحروف والأرقام والشرطات السفلية — `2nd_score` غير صالح، بينما `second_score` صالح.

اصطلاح بايثون هو `snake_case`: كلمات صغيرة مفصولة بشرطات سفلية (`student_name`, `total_score`)، وليس `studentName` أو `TotalScore`. هناك حفنة من الكلمات **محجوزة** في اللغة (`if`, `for`, `class`, `True`, إلخ) ولا يمكن استخدامها كأسماء متغيرات.

يجب أن تصف الأسماء *ما تعنيه القيمة*. لا يخبرك `x = 87.5` بأي شيء؛ بينما يخبرك `quiz_score = 87.5` بكل شيء. وهذا أهم مما يبدو — ستعيد قراءة كودك أكثر بكثير مما تكتبه.

## المزالق الشائعة

- **استخدام كلمة محجوزة كاسم.** يرفع `class = "Math"` خطأ `SyntaxError` — لأن `class` محجوزة.
- **البدء برقم.** `2nd_place = "B"` غير صالح؛ بينما `second_place = "B"` صالح.
- **الخلط بين `=` و`==`.** `=` تُسنِد؛ و`==` تختبر التساوي. هذا يربك الجميع مرة واحدة على الأقل.

## 🧩 التحديات

<details class="challenge">
<summary>🧩 التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

إذا كان `x = 5` ثم `y = x`، ثم `x = 10`، فما قيمة `y`؟ اشرح السبب بعبارة "الأسماء تشير إلى القيم" بدلًا من "الصناديق تحتوي القيم".

<p class="challenge__answer">💡 <strong>الإجابة:</strong> ما زالت <code>y</code> تساوي <code>5</code>. عندما نُفِّذ <code>y = x</code>، كان الاثنان يشيران إلى القيمة <code>5</code>. إعادة إسناد <code>x</code> إلى <code>10</code> تنقل مؤشر <code>x</code>؛ بينما ما تزال <code>y</code> تشير إلى <code>5</code>. الأسماء تسميات، وليست صناديق.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

اكتب برنامجًا قصيرًا يقايض متغيرين: `a = 7`، `b = 3`. بعد المقايضة، يجب أن تكون `a` مساوية لـ `3` و`b` مساوية لـ `7`. افعل ذلك بدون متغير مؤقت (بين بايثون حيلة أنيقة لهذا).

<p class="challenge__answer">💡 <strong>الإجابة:</strong> <code>a, b = b, a</code> — تُقيّم بايثون الطرف الأيمن أولًا، ثم تفكّك القيم إلى الطرف الأيسر. لا حاجة لمتغير مؤقت.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

أيٌّ من هذه أسماء متغيرات صالحة؟ اشرح لماذا تفشل الأسماء غير الصالحة: `_count`, `2nd`, `my-name`, `total`, `class`.

<p class="challenge__answer">💡 <strong>الإجابة:</strong> <code>_count</code> ✓ (البدء بشرطة سفلية صالح)، <code>2nd</code> ✗ (يبدأ برقم)، <code>my-name</code> ✗ (الواصلة غير مسموحة — فهي عامل الطرح)، <code>total</code> ✓، <code>class</code> ✗ (كلمة محجوزة).</p>

</div>
</details>

## 🤔 أسئلة سقراطية

- لماذا تستخدم بايثون `snake_case` بدلًا من `camelCase`؟ ماذا يوحي الاستعارة البصرية للشرطة السفلية حول طريقة قراءة أسماء المتغيرات؟
- ينتج `x += 1` و`x = x + 1` النتيجة نفسها للأرقام. هل يمكنك التفكير في سبب لتوفير لغة للصيغتين معًا؟
- إذا كانت المتغيرات "تسميات، وليست صناديق"، فماذا يحدث عند كتابة `a = [1, 2, 3]` ثم `b = a` ثم `b.append(4)`؟ هل يرى `a` القيمة `4`؟ (جرّب ذلك — هذا يمهّد للأشياء القابلة للتعديل، المغطاة لاحقًا.)

## ✅ مراجعة سريعة

<div class="quiz" data-quiz="python-101-variables">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. ما قيمة y بعد: x = 10; y = x; x = 20؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">20</button>
      <button class="quiz-q__opt" data-idx="1">10 and 20</button>
      <button class="quiz-q__opt" data-idx="2">10</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">2. أيٌّ مما يلي اسم متغير بايثون صالح؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">_total</button>
      <button class="quiz-q__opt" data-idx="1">2nd</button>
      <button class="quiz-q__opt" data-idx="2">my-var</button>
      <button class="quiz-q__opt" data-idx="3">class</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">3. ماذا تُقيَّم x إليه بعد: x = 5; x += 3; x -= 1؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">5</button>
      <button class="quiz-q__opt" data-idx="1">7</button>
      <button class="quiz-q__opt" data-idx="2">8</button>
      <button class="quiz-q__opt" data-idx="3">3</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
