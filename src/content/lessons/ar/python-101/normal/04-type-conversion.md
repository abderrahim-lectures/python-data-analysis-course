---
title: "تحويل الأنواع"
description: "حوّل بين int و float و str و bool بشكل صريح — وافهم متى تفشل عمليات التحويل."
module: "python-basics"
order: 4
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "تحويل القيم باستخدام int() و float() و str() و bool()"
  - "فهم البتر (الاقتطاع) مقابل التقريب"
  - "التعرّف على متى تثير عمليات التحويل ValueError"
  - "معالجة نوع قيمة input() بشكل صحيح"
prerequisites: ["03-data-types"]
tags: ["conversion", "casting", "int", "float", "str", "input"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## دوال التحويل الصريح

توفّر بايثون `int(...)` و`float(...)` و`str(...)` و`bool(...)` للتحويل بين الأنواع:

```python
int("42")       # 42        — str -> int
int(3.9)        # 3         — float -> int, truncates (does NOT round!)
float("3.14")   # 3.14      — str -> float
str(42)         # "42"      — int -> str
bool(0)         # False     — 0 (and 0.0, and "") are "falsy"
bool(1)         # True      — any nonzero number (and non-empty string) is "truthy"
```

## البتر مقابل التقريب

يعطي `int(3.9)` القيمة `3` وليس `4` — التحويل إلى `int` دائمًا **يبتر نحو الصفر** (يقتطع الجزء العشري). ولا يقرب أبدًا:

```python
int(3.9)        # 3  — truncates
int(-3.9)       # -3 — truncates toward zero, not toward negative infinity
round(3.9)      # 4  — this is rounding
```

التمييز مهم للأعداد السالبة: `int(-3.9)` تساوي `-3` (نحو الصفر)، بينما `math.floor(-3.9)` تساوي `-4` (نحو سالب اللانهاية).

## متى تفشل عمليات التحويل

ليس كل تحويل ممكنًا:

```python
int("hello")    # ValueError: invalid literal for int()
int("3.14")     # ValueError: invalid literal for int() — use float() first
float("hello")  # ValueError: could not convert string to float
```

تفشل بايثون هنا بصوت عالٍ بدلًا من التخمين بصمت — وهو قرار تصميمي ستقدّره عندما تبدأ في تصحيح بيانات حقيقية.

## مطبّ input()

تُرجع `input()` **دائمًا `str`**، حتى وإن كتب المستخدم رقمًا:

```python
age_text = input("How old are you? ")   # always a string
age = int(age_text)                      # convert explicitly
print(f"In 10 years you'll be {age + 10}")
```

نسيان هذا التحويل هو أحد أكثر الأخطاء المبكرة شيوعًا:

```python
age = input("Age? ")
print(age + 1)    # TypeError: can only concatenate str (not "int") to str
```

## المزالق الشائعة

- **`int("3.14")` يثير خطأ.** لا يمكنك تحليل سلسلة عشرية مباشرة باستخدام `int()`. استخدم `int(float("3.14"))` أو `round(float("3.14"))`.
- **`int()` يبتر، لا يقرب.** `int(4.7)` تساوي `4` وليست `5`. استخدم `round()` عندما تريد التقريب.
- **`float("inf")` صالحة.** تمثّل بايثون اللانهاية بـ `float('inf')` — مفيدة في بعض الخوارزميات، لكنها قد تفاجئك.

## 🧩 التحديات

<details class="challenge">
<summary>🧩 التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body>

توقّع `int(-7.9)` و`-7.9 // 1`. هل هما متساويان؟ اشرح أي اختلاف.

<p class="challenge__answer">💡 <strong>الإجابة:</strong> <code>int(-7.9)</code> تساوي <code>-7</code> (يبتر نحو الصفر — يقتطع الجزء العشري)، بينما <code>-7.9 // 1</code> تساوي <code>-8.0</code> (يستخدم الأرضية نحو سالب اللانهاية). يتفقان مع الأعداد الموجبة لكن يختلفان مع الأعداد السالبة.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

اكتب برنامجًا يطلب اسمًا وسنة ميلاد (مطالبتان منفصلتان لـ `input()`)، ويحسب عمرًا تقريبيًا، ويطبع جملة مثل `"Amina, you are about 21 years old."`

<p class="challenge__answer">💡 <strong>الإجابة:</strong> اقرأ الاسم وسنة الميلاد باستدعاءين لـ <code>input()</code>، وحوّل السنة إلى <code>int</code>، واطرحها من السنة الحالية (مثلًا <code>2026</code>)، واطبع باستخدام f-string: <code>print(f"{name}, you are about {2026 - year} years old.")</code>.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body>

بدون تنفيذها، احسب `15 // 4` و`15 % 4` يدويًا. ثم تحقق: هل `4 * (15 // 4) + (15 % 4)` تساوي `15`؟

<p class="challenge__answer">💡 <strong>الإجابة:</strong> 15 // 4 تساوي 3 (أرضية 3.75)، و15 % 4 تساوي 3 (بما أن 15 = 4·3 + 3). معًا: 4 × 3 + 3 = 15. هذه هي مطابقة خوارزمية القسمة.</p>

</div>
</details>

## 🤔 أسئلة سقراطية

- تُرجع `input()` دائمًا `str`. ما الذي سيحدث لو جرّبت `age + 10` دون تحويل `age` أولًا عبر `age = int(input(...))`؟ وماذا تخبرك رسالة الخطأ فعلًا؟
- إذا أردت تحويل `"3.14"` إلى عدد صحيح، فلماذا تفشل `int("3.14")` بينما تنجح `int(float("3.14"))`؟ ما الذي تقوم به الخطوة الوسيطة؟
- تمتلك بايثون `math.floor()` و`math.ceil()`. كيف تختلفان عن `int()` بالنسبة للأعداد السالبة؟ ومتى تختار إحداهما على الأخرى؟

## ✅ مراجعة سريعة

<div class="quiz" data-quiz="python-101-conversion">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ما قيمة int(4.7)؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">5</button>
      <button class="quiz-q__opt" data-idx="1">4</button>
      <button class="quiz-q__opt" data-idx="2">4.7</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. ماذا تُرجع input("Name: ") دائمًا؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">int</button>
      <button class="quiz-q__opt" data-idx="1">float</button>
      <button class="quiz-q__opt" data-idx="2">str</button>
      <button class="quiz-q__opt" data-idx="3">bool</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">3. ماذا يحدث مع int("3.14")؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">ValueError</button>
      <button class="quiz-q__opt" data-idx="1">3</button>
      <button class="quiz-q__opt" data-idx="2">4</button>
      <button class="quiz-q__opt" data-idx="3">3.14</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
