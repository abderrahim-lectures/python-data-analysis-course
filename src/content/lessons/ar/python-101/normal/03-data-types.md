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

## المجموعة التي ينتمي إليها العدد

أجب عن سؤالين: معك $7$ تفاحات وقصصت واحدةً منها نصفين. هل تحمل الآن $7 + \frac{1}{2}$ تفاحة *بنفس معنى* ما كنت تحمل $7$؟ نصف التفاحة ليس عددًا صحيحًا من التفاحات — يعيش $7$ في $\mathbb{Z}$، ويعيش $7\frac{1}{2}$ في $\mathbb{Q}$.

يجيب العالم الرياضي بسؤال: إلى أي **مجموعة** ينتمي قيمةٌ ما؟ نفس التمييز يطارد كل برنامج: تخزّن الآلة $42$ بطريقةٍ تختلف عن $42.5$، وبطريقة تختلف عن `"42"`. الكلمة التي تستعملها بايثون لسؤال «في أي مجموعة تعيش هذه القيمة» هي **النوع**.

إذن: كم مجموعةً تستحق التمييز؟ أربعٌ في البداية.

| النوع | ما هو، رياضيًّا | أمثلة |
|---|---|---|
| `int` | $\mathbb{Z}$ — الأعداد الصحيحة، مخزّنة بدقة تامة | `42`, `-7` |
| `float` | $\mathbb{R}$، مقرَّب بعددٍ ثابت من الأرقام الثنائية | `3.14`, `-0.5` |
| `str` | متتالية منتهية من المحارف | `"hello"` |
| `bool` | $\{\text{True}, \text{False}\}$ | `True`, `False` |

سطر `float` يحمل تحفظًا مقصودًا — *مقرَّب*. العدد الصحيح يُخزَّن بدقة في كل مرة. أما العدد الحقيقي فلا يكاد يُخزَّن بدقة أبدًا: كيف تخزّن $1/3 = 0.333\ldots$ بعددٍ منتهٍ من الأرقام؟ لا يمكنك، فتحتفظ بايثون بتقريبٍ منتهٍ وتتباعد الحسابات في الأرقام الأخيرة. هذه الحقيقة الواحدة تفسّر مفاجأةً شهيرة ستراها عن قريب.

## سؤال المجموعة المنتمى إليها

أمام قيمةٍ ما، يمكنك أن تسأل عن نوعها مباشرة:

```python
type(42)      # <class 'int'>
type(3.14)    # <class 'float'>
type("hi")    # <class 'str'>
type(True)    # <class 'bool'>
```

ملاحظتان على الكتابة. أولًا، `type(...)` *هي* دالة — تسلّمها قيمة فترجع لك *كائن النوع* الذي تنتمي إليه تلك القيمة. ثانيًا، يطبع الجواب `<class 'int'>`؛ وكلمة `class` هي مصطلح بايثون عن النوع، والكلمة بين علامتي الاقتباس هي اسم المجموعة. اقرأ `<class 'float'>` بمعنى *«تنتمي إلى مجموعة float»*.

## لا يلتزم الاسمُ بمجموعةٍ معيّنة

هنا تبدأ العوائد. في لغةٍ ذات كتابة ثابتة كنت ستصرّح مسبقًا: *x عدد صحيح*. أمّا بايثون فتدع الاسم يشير إلى حيث يشاء:

```python
x = 5
print(type(x))    # <class 'int'>
x = "hello"
print(type(x))    # <class 'str'>
```

إعادة توجيه اسمٍ نحو مجموعة أخرى أمرٌ جائز، فلا يُقرأ نوع `x` من أيّ تصريح — بل بسؤاله إلى ماذا يشير حاليًا. هذا هو **الكتابة الديناميكية**. إنها مريحة، وهي أيضًا السبب في أن برنامجك قد يسلّم بصمتٍ نصًّا إلى دالةٍ تنتظر أرقامًا: لا شيء يمنع ذلك حتى تفشل العملية نفسها.

## أيّ القيم تتصرف مثل True؟

كل قيمة **صادقة** أو **كاذبة** — إمّا أن تتصرف مثل `True` في شرطٍ وإمّا مثل `False`. القاعدة مقتضبة جديرة بالتحقق:

- **كاذبة**: الصفر $0$, والـ $0.0$, والسلسلة الفارغة `""`, و`None`
- **صادقة**: كل ما عدا ذلك

```python
bool(0)         # False
bool(1)         # True
bool(-1)        # True   — أي عدد غير صفري صادق
bool("")        # False
bool("hello")   # True   — أي سلسلة غير فارغة صادقة
```

لاحظ ما هو مدرجٌ في القائمة وما استُبعد. `-1` صادق؛ والصفر ليس كذلك. والسلسلة `"0"` صادقة — إنها غير فارغة، ومعيار السلاسل هو خلوّها من المحارف لا قيمة محتواها. تدفع هذه القاعدة ثمنها في اللحظة التي تكتب فيها أوّل `if`: فالعبارة `if score:` تعني *إذا لم تكن score صفرًا*.

## مثالٌ محلول: تدقيقُ تعبيرٍ

تدفعُ المجموعاتُ حين تمزجُها تعبيرًا. اقرأ الإيصالَ سطرًا سطرًا واسألْ مجموعةَ كلِّ نتيجةٍ:

```python
unit_price = 4.75
quantity = 4
bill = unit_price * quantity     # float: يبتلعُ العائمُ الصحيحَ
type(bill)                       # <class 'float'>
bool(bill)                       # True — كلُّ ما خالف الصفرَ صادقٌ

type(10 / 2)                     # <class 'float'> — لا تعودُ القسمةُ الحقيقيةُ صحيحًا
```

اقرأ `bill` حاصلَ مجموعتينِ مختلفتينِ. فالمجموعاتُ لا «تمتزج» — يغلبُ `float`، لأن النسبةَ ليست عددًا صحيحًا لأيّ مقياسٍ، والمجموعةُ الأوسعُ يجب أن تحملَها. وعادةُ التدقيقِ سؤالُ المجموعةِ مباشرةً: يؤكد `type(...)` ما كنتَ تشكُّ فيه بدل الرهانِ على الحظِّ.

## أخطاء شائعة

- **`4 / 2` يساوي `2.0` لا `2`.** القسمة الحقيقية (`/`) ترجع دائمًا قيمة `float` في بايثون 3 — حتى حين تكون القسمة مضبوطة. للحصول على عدد صحيح اطلب القسمة الصحيحة: `4 // 2` ← `2`.
- **`True + True` يساوي `2`.** `bool` فئة فرعية من `int` في بايثون: يتصرف `True` مثل $1$ و`False` مثل $0$ في الحساب. تتداخل المجموعتان، لكن `type(True)` يجيب دائمًا بـ `bool`.
- **`type()` تخبرك بالنوع الفعلي.** `type(True)` هو `bool` لا `int`، مهما كانت راحة `True` في الجمع.
- **يصف `type()` الناتجَ لا المعاملاتِ.** `type(2 * 3.0)` هو `float` — صحيحٌ مضروبٌ في عائمٍ يسكنُ مجموعةَ العائمِ. لا تتوقعْ من الأجزاءِ؛ اسألِ الجوابَ.

## 🧩 تحديات

<details class="challenge">
<summary>🧩 تحدٍّ — فكّر أولًا ثم أظهر</summary>
<div class="challenge__body">

تنبّأ بـ `type(7 / 2)` ثم تحقّق.

<p class="challenge__answer">💡 <strong>الجواب:</strong> <code>type(7 / 2)</code> هو <code>float</code> — القسمة الحقيقية (<code>/</code>) تُنتج float دائمًا في بايثون 3، حتى لو كان المعاملان عددين صحيحين والناتج عددًا صحيحًا.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 تحدٍّ — فكّر أولًا ثم أظهر</summary>
<div class="challenge__body">

تنبّأ بقيم `bool(0)` و`bool(0.0)` و`bool("")` و`bool("0")`. أيُّها صادقةٌ وأيُّها كاذبة؟

<p class="challenge__answer">💡 <strong>الجواب:</strong> <code>bool(0)</code> ← False، <code>bool(0.0)</code> ← False، <code>bool("")</code> ← False (سلسلة فارغة)، <code>bool("0")</code> ← True (سلسلة غير فارغة، ولو كان محتواها المحرف «0»).</p>

</div>
</details>

<details class="challenge">
<summary>🧩 تحدٍّ — فكّر أولًا ثم أظهر</summary>
<div class="challenge__body">

في بايثون، `0.1 + 0.2` **ليس** مساويًا لـ `0.3`. ها هي المسألة نفسها على الورق: ماذا يحدث عند تمثيل $1/3 = 0.333\ldots$ برقمَين عشريَّين؟ ثم اشرح لماذا لا يستطيع `float` — الذي يقرّب $\mathbb{R}$ بعددٍ منتهٍ من الأرقام الثنائية — تمثيل $0.1$ بدقة.

<p class="challenge__answer">💡 <strong>الجواب:</strong> برقمَين، يجب أن يصير $1/3$ هو $0.33$ — خسارةٌ وقعت قبل أيّ عملية. كذلك لا يوجد لـ $0.1$ صورة ثنائية مضبوطة؛ يخزّن float قيمةً قريبة، وجمع قيمتين كهاتين يحمل أخطاءً يسيرة: يعطي <code>0.1 + 0.2</code> النتيجةَ <code>0.30000000000000004</code> لا <code>0.3</code>. دقةٌ منتهية، لا خطأ بايثون.</p>

</div>
</details>

## 🤔 أسئلة سقراطية

- إذا كان `bool(-1)` هو `True`، فما القاعدة الواحدة التي تفسّر أن $-1$ صادقٌ بينما $0$ كاذب؟ هل تعمّم القاعدة من الأعداد إلى السلاسل؟
- لدى بايثون `isinstance(42, int)` التي ترجع `True`. هل تكون `isinstance` أوثق من `type(x) == int` في فحص الأنواع؟ ولماذا؟
- لماذا تكتب بايثون `True` و`False` بحروفٍ كبيرة بدلًا من `true` و`false`؟ وما الكلمات الكبيرة الأخرى التي تحجزها بايثون؟

## ✅ فحص سريع

<div class="quiz" data-quiz="python-101-types">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">١. ما نوع القيمة 3.14؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">int</button>
      <button class="quiz-q__opt" data-idx="1">float</button>
      <button class="quiz-q__opt" data-idx="2">str</button>
      <button class="quiz-q__opt" data-idx="3">bool</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">٢. ما نتيجة True + True؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">True</button>
      <button class="quiz-q__opt" data-idx="1">False</button>
      <button class="quiz-q__opt" data-idx="2">2</button>
      <button class="quiz-q__opt" data-idx="3">خطأ</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">٣. أيُّ من هذه القيم كاذبة؟</p>
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