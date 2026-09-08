---
title: "الطباعة والمخرجات"
description: "اعرض النتائج بواسطة print()، ونسّق النص باستخدام f-strings، وتحكم فيما يظهر على الشاشة."
module: "python-basics"
order: 1
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "استخدام print() لعرض القيم والرسائل"
  - "تنسيق المخرجات باستخدام f-strings ومحددات التنسيق"
  - "دمج قيم متعددة في استدعاء واحد داخل print()"
prerequisites: []
tags: ["output", "print", "f-strings", "formatting"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## طباعة القيم

ترسل `print()` المخرجات إلى الشاشة. مرِّر إليها أي قيمة وسيحوّلها بايثون إلى نص:

```python
print(42)         # 42
print(3.14)       # 3.14
print("hello")    # hello
```

تُضمَّن الوسائط المتعددة بفاصلة الفصل بينها بمسافة:

```python
print("Score:", 87)    # Score: 87
```

## F-strings: المخرجات المنسّقة

أضف البادئة `f` إلى النص وضع التعبيرات داخل `{ }`:

```python
name = "Amina"
score = 87.5
print(f"{name} scored {score}%")    # Amina scored 87.5%
```

تتحكم محددات التنسيق في الدقة والمحاذاة:

```python
price = 19.999
print(f"Total: ${price:.2f}")       # Total: $20.00 — rounds to 2 decimal places
print(f"Double: {price * 2}")       # any expression works inside { }
```

حتى العبارات الشرطية تعمل داخل النص:

```python
passing = "yes" if score >= 60 else "no"
print(f"Passing? {passing}")
```

## المزالق الشائعة

- **نسيان أن `print()` بلا قيمة إرجاع.** يعرض `print("hi")` نصًا لكنه يُقيَّم إلى `None` — لا يمكنك التقاط نتيجته.
- **خلط الأنواع في الاقتران بالسلسلة.** يرفع `print("Score: " + 87)` خطأ `TypeError`. استخدم f-strings بدلًا من ذلك: `print(f"Score: {87}")`.

## 🧩 التحديات

<details class="challenge">
<summary>🧩 التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

اطبع اسمك وعمرك ورقمك المفضّل، كلٌّ منها في سطر مستقل، باستخدام ثلاث استدعاءات منفصلة لـ `print()`. ثم كرّر ذلك باستخدام f-string واحد يتضمن فواصل أسطر (`\n`).

<p class="challenge__answer">💡 <strong>الإجابة:</strong> <code>print(f"Name: {name}\nAge: {age}\nFavorite: {num}")</code> — تُنتج <code>\n</code> داخل الـ f-string سطرًا جديدًا.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

بالنظر إلى `temperature = 23.7891`، اطبعه بصيغة `"Today: 23.8°C"` (بعد منزلة عشرية واحدة).

<p class="challenge__answer">💡 <strong>الإجابة:</strong> <code>print(f"Today: {temperature:.1f}°C")</code> — يحوّل محدد التنسيق <code>:.1f</code> القيمة إلى منزلة عشرية واحدة.</p>

</div>
</details>

## 🤔 أسئلة سقراطية

- لماذا تستخدم بايثون `print()` كدالة (بأقواس) بدلًا من أن تكون عبارة؟ وما الميزة التي يمنحك إياها ذلك؟
- يطبع `print("A", "B", "C")` الجملة `A B C` بمسافات. كيف يمكنك طباعتها بدون مسافات؟ وبفاصلات بينها؟
- إذا كانت `x = 3.14`، فماذا تُنتج `f"{x}"`؟ وماذا عن `f"{x:.0f}"`؟ اشرح الفرق.

## ✅ مراجعة سريعة

<div class="quiz" data-quiz="python-101-printing">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ما الذي يعرضه print(f"{'yes' if 5 > 3 else 'no'}")؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">5 > 3</button>
      <button class="quiz-q__opt" data-idx="1">yes</button>
      <button class="quiz-q__opt" data-idx="2">no</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. كيف تطبع 3.14159 بصيغة 3.14 (بعد منزلتين عشريتين)؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">f"{x:2f}"</button>
      <button class="quiz-q__opt" data-idx="1">f"{x:.2f}"</button>
      <button class="quiz-q__opt" data-idx="2">f"{x:.2f}"</button>
      <button class="quiz-q__opt" data-idx="3">f"{x:2.0f}"</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>
