---
title: "تقسيم السلاسل النصية (Slicing)"
description: "استخرج الأجزاء الفرعية بإحكام من السلاسل باستخدام بناء جملة الشريحة."
module: "strings"
order: 14
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "استخراج الأجزاء الفرعية باستخدام s[start:end]"
  - "استخدام الخطوات السالبة والمؤشرات السالبة للوصول العكسي"
  - "فهم أنّ التقسيم حصري من الأعلى ولكنه شامل من الأسفل"
  - "استخدام s[::-1] لعكس السلسلة"
prerequisites: ["13-string-methods"]
tags: ["slicing", "indexing", "negative-index", "reverse"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## التقسيم الأساسي

النحو هو `string[start:stop:step]` — `start` شامل، و`stop` حصري:

```python
text = "Python"
text[0:3]    # 'Pyt'
text[2:5]    # 'tho'
text[:4]     # 'Pyth'  (start defaults to 0)
text[3:]     # 'hon'   (stop defaults to end)
text[:]      # 'Python' (full copy)
```

## المؤشرات السالبة

تُعدّ المؤشرات السالبة من النهاية:

```python
text = "Python"
text[-1]     # 'n'  (last character)
text[-3:]    # 'hon' (last 3 characters)
text[:-2]    # 'Pyth' (all except last 2)
text[-4:-1]  # 'tho'
```

## الخطوة

تتحكم المعلمة الثالثة في حجم الخطوة:

```python
text = "abcdefghij"
text[::2]    # 'acegi'   (every 2nd character)
text[1::2]   # 'bdfhj'   (every 2nd, starting at index 1)
text[::-1]   # 'jihgfedcba'  (reversed!)
text[::-2]   # 'jhfdb'   (every 2nd, reversed)
```

## التقسيم لا يرفع أخطاء أبدًا

على عكس الفهرسة، لا يرفع التقسيم `IndexError` أبدًا — بل يُرجع ما في وسعه:

```python
text = "hi"
text[0:100]   # 'hi'  (no error, just stops at end)
text[100:200] # ''    (empty string)
```

## التقسيم يعمل على القوائم أيضًا

يعمل النحو نفسه على أي متتالية:

```python
nums = [0, 1, 2, 3, 4, 5]
nums[1:4]     # [1, 2, 3]
nums[::-1]    # [5, 4, 3, 2, 1, 0]
```

## المزالق الشائعة

- **الحصر من الأعلى**: `s[0:3]` يعطي 3 أحرف (0, 1, 2)، وليست 4
- **التقفّي بالأطراف**: البداية والنهاية الافتراضية دائمًا آمنة — لم تعد خارج النطاق
- **خلط الحصر من الأعلى مع الخطوة السالبة**: المؤشرات تغير معناه عند التقسيم بعكس الاتجاه

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 التحديات</h2>

<details class="challenge">
<summary>التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

بدون تنفيذها، توقّع ناتج `"Python"[::-1]` و`"Python"[-2:]` و`"Python"[1:3]`.

<p class="challenge__answer">💡 <strong>الإجابة:</strong> <code>"nohtyP"</code> — عكس كامل، و<code>"on"</code> — آخر حرفين، و<code>"yt"</code> — الحرفان الأول والثاني (المؤشران 1 و2).</p>

</div>
</details>

<details class="challenge">
<summary>التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

اكتب تعبيرًا يستخرج كل حرف ثالث بدءًا من الحرف الثاني: من `"abcdefghij"`.

<p class="challenge__answer">💡 <strong>الإجابة:</strong> <code>"abcdefghij"[1::3]</code> → <code>"beh"</code> — يبدأ من المؤشر 1 ويصعد خطوة 3.</p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 أسئلة سقراطية</h2>

- لماذا تُستخدم نهايات حصرية في بايثون بدلًا من الشاملة؟ (فكّر في كيف يُقسَّم `range` والسلاسل بشكل متسق.)
- متى تُحدّد خطوة سالبة مع إغفال البداية والنهاية؟ وما القواعد التي تسيطر على الاتجاه؟
- كيف تستخدم المؤشرات السالبة والخطوات السالبة معًا دون الالتباس؟

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ مراجعة سريعة</h2>

<div class="quiz" data-quiz="python-101-string-slicing">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ماذا تُرجع <code>"goodbye"[-3:]</code>؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">"bye"</button>
      <button class="quiz-q__opt" data-idx="1">"bye"</button>
      <button class="quiz-q__opt" data-idx="2">"oodbye"</button>
      <button class="quiz-q__opt" data-idx="3">"good"</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">2. ماذا تُرجع <code>"abcdef"[::2]</code>؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">"ace"</button>
      <button class="quiz-q__opt" data-idx="1">"bdf"</button>
      <button class="quiz-q__opt" data-idx="2">"abcdef"</button>
      <button class="quiz-q__opt" data-idx="3">"fedcba"</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>