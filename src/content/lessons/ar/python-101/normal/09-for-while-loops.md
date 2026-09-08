---
title: "حلقات For و While"
description: "كرّر الإجراءات على المتتاليات وحتى تتغير الشروط."
module: "control-flow"
order: 9
difficulty: "beginner"
estimatedMinutes: 18
learningObjectives:
  - "التكرار عبر القوائم والسلاسل والمدى باستخدام حلقات for"
  - "استخدام حلقات while للتكرار المبني على الشروط"
  - "التحكم في تدفق الحلقة باستخدام break و continue و pass"
  - "تجنب الحلقات اللانهائية"
prerequisites: ["08-if-elif-else"]
tags: ["for", "while", "loops", "break", "continue"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## حلقات For

تتكرر حلقة `for` عبر كل عنصر في متتالية:

```python
for fruit in ["apple", "banana", "cherry"]:
    print(fruit)
# apple
# banana
# cherry
```

تعمل مع السلاسل أيضًا — تتكرر عبر الأحرف:

```python
for letter in "Python":
    print(letter)
```

## حلقات While

تعمل حلقة `while` طالما كان شرطها `True`:

```python
count = 0
while count < 5:
    print(count)
    count += 1
# 0 1 2 3 4
```

**تأكد دائمًا من أن الشرط يصبح `False` في النهاية**، وإلا ستنشئ حلقة لا نهائية.

## Break و continue

يُخرج `break` من الحلقة فورًا. وينتقل `continue` إلى التكرار التالي:

```python
# break — stop at the first even number
for n in [1, 3, 4, 7, 8]:
    if n % 2 == 0:
        print(f"Found even: {n}")
        break

# continue — skip odd numbers
for n in range(6):
    if n % 2 != 0:
        continue
    print(n)  # 0 2 4
```

## Pass

`pass` عنصر نائب لا يفعل شيئًا. استخدمه عندما تحتاج إلى كتلة صالحة نحويًا:

```python
for n in range(10):
    if n % 3 == 0:
        pass  # TODO: handle multiples of 3 later
    else:
        print(n)
```

## المزالق الشائعة

- **حلقات `while` لا نهائية**: نسيان تحديث متغير الشرط
- **تعديل قائمة أثناء تكرارها**: استخدم نسخة أو فهم القائمة بدلًا من ذلك
- **`for` مع `range(len(...))`**: الكود البايثوني يتكرر عادة مباشرة عبر المتتالية

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 التحديات</h2>

<details class="challenge">
<summary>التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

اكتب حلقة `for` تطبع أول 10 أعداد قابلة للقسمة على 3 (3، 6، 9، ...، 30).

<p class="challenge__answer">💡 <strong>الإجابة:</strong> <code>for i in range(3, 31, 3): print(i)</code> — <code>range(3, 31, 3)</code> يبدأ من 3، ويصعد حتى 30، بخطوة 3.</p>

</div>
</details>

<details class="challenge">
<summary>التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

اكتب حلقة `while` تطلب الإدخال مرارًا (حاكِ ذلك بقائمة) وتتوقف عندما ترى `"quit"`. اطبع كل إدخال.

<p class="challenge__answer">💡 <strong>الإجابة:</strong> <code>inputs = ["hello", "world", "quit"]; i = 0; while i < len(inputs) and inputs[i] != "quit": print(inputs[i]); i += 1</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 أسئلة سقراطية</h2>

- متى تختار `while` على `for`؟ أعط مثالًا من العالم الحقيقي لكلٍّ منهما.
- ماذا يحدث إذا عدّلت قائمة داخل حلقة `for` تتكرر عليها؟ وكيف يمكنك تجنّب المشكلة؟
- لماذا لا تمتلك بايثون حلقة `do...while` مثل C أو JavaScript؟ وكيف تحاكي واحدة؟

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ مراجعة سريعة</h2>

<div class="quiz" data-quiz="python-101-loops">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ماذا يطبع <code>for i in range(0, 10, 3): print(i, end=" ")</code>؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">0 1 2 3 4 5 6 7 8 9</button>
      <button class="quiz-q__opt" data-idx="1">0 3 6 9</button>
      <button class="quiz-q__opt" data-idx="2">3 6 9</button>
      <button class="quiz-q__opt" data-idx="3">0 3 6</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. أي كلمة مفتاحية تتخطى بقية تكرار الحلقة الحالي؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">break</button>
      <button class="quiz-q__opt" data-idx="1">pass</button>
      <button class="quiz-q__opt" data-idx="2">continue</button>
      <button class="quiz-q__opt" data-idx="3">skip</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>