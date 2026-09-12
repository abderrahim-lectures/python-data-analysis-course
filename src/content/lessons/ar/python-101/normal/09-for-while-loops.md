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

## الآلتان اللتان تكرران

اكتب برنامجًا يجمع أول مئة عددٍ صحيح وستتشنج يداك. جرّد الرياضيون التكرارَ في رمزٍ قبل وجود الحواسيب بزمنٍ طويل:

$$
\sum_{i=1}^{100} i = 1 + 2 + \cdots + 100
$$

علامة $\sum$ تعليمةٌ بالتكرار. والحلقة هي $\sum$ الحاسوب — وتقسم بايثون الفكرة إلى آلتين لنوعين من التكرار. تكرّر `for` عبر *متتاليةٍ معلومة*. وتكرّر `while` *حتى يكفّ شرطٌ عن الصحة*.

## For: تكرارٌ عبر متتالية

تزور حلقة `for` كل عنصرٍ في المتتالية، عنصرٌ لكل جولة:

```python
for fruit in ["apple", "banana", "cherry"]:
    print(fruit)
# apple
# banana
# cherry
```

اقرأها كما تعمل: *«لكل فاكهةٍ **في** القائمة افعل هذا.»* تأخذ متغير الحلقة، `fruit`، قيمةً جديدةً كل جولة حتى تنفد القائمة.

السلاسل متتالياتٌ أيضًا — وعناصرُها حروف:

```python
for letter in "Python":
    print(letter)
```

ولأن الحرف عنصرٌ واحد، يتفق الرياضي والآلة: التكرار عبر سلسلةٍ طولِها $n$ يشغّل $n$ جولةً بالضبط.

## المتتالية العددية: range

معظم المجاميع تجري فوق الأعداد، لذا تقدّم بايثون`range` — متتاليةً يمكنك تجاوزُها قفزاتٍ:

```python
for n in range(5):
    print(n)   # 0 1 2 3 4
```

تُنتج `range(5)` المتتاليةَ الحسابية $0, 1, 2, 3, 4$، مثل مجموعة فهارس $\sum_{i=0}^{4} a_i$. وبوسيطين إضافيين تأخذ الشكلَ الذي تريد: تمشي `range(start, stop, step)` من `start` بخطواتِ `step`، وتتوقف قبل `stop`:

```python
for n in range(10, 0, -2):
    print(n)   # 10 8 6 4 2
```

يقول قاعدةُ التوقف بدقة: يسير $n$ ما دام $n < \text{stop}$ (أو $n > \text{stop}$ مع خطوةٍ سالبة)، كفترةٍ شبه مفتوحة $[\text{start}, \text{stop})$.

## While: تكرارٌ حتى شرطٍ

بعض المهام لا يمكن حصر جولاتها مسبقًا — تواصل حتى ينقلب شرطٌ ما. تقريب نيوتن هو النموذج: صَقّل حتى يهبط التغير تحت سماحةٍ معينة. تلك حلقة `while`:

```python
count = 0
while count < 5:
    print(count)
    count += 1
# 0 1 2 3 4
```

الشرط في الأعلى ويُعاد فحصه كل جولة. **تأكد أنه سينقلب إلى `False` في النهاية** — فإذا لم يغيّر شيءٌ داخل الجسم المتغيراتِ التي يقرؤها الشرط، لن تنتهي الحلقة أبدًا. المجموع الذي لا بد أن ينتهي يُكتب بـ `for`؛ والبحث الذي لا ينتهي إلا بإيجاد جوابه يُكتب بـ `while`.

## Break و continue

كلمتان تضبطان التدفق من الداخل.

تتخلى `break` عن الحلقة فورًا، مهما بقي من جولات:

```python
for n in [1, 3, 4, 7, 8]:
    if n % 2 == 0:
        print(f"Found even: {n}")
        break
```

تتخلى `continue` عن *هذه* الجولة فقط، قافزةً إلى التالية:

```python
for n in range(6):
    if n % 2 != 0:
        continue
    print(n)  # 0 2 4
```

بينهما تنطبق المفاهيم على خط الأعداد: تقطع `break` الذيلَ $\{n \in \mathbb{Z} : n \geq m\}$؛ وتنحت `continue` مجموعةً فرعيةً من الجولات، كغربلةِ متناقلةٍ بمنخل.

## Pass: مكانٌ شاغر

كل جسمٍ من `if` أو `for` أو `while` أو دالةٍ يحتاج جملةً واحدةً على الأقل، لكنك أحيانًا لم تكتبها بعد. `pass` هو اللافعلُ الذي يشغل المكان:

```python
for n in range(10):
    if n % 3 == 0:
        pass  # TODO: handle multiples of 3 later
    else:
        print(n)
```

لا يفعل شيئًا — وهذا هو عمله بالضبط: أن يُبقي الكتلة سليمةً نحو قواعد اللغة بينما تُصاغ الجملة الحقيقية.

## مثالٌ محلول: آلةُ Σ تعملُ

تتألفُ أدواتُ هذا الدرسِ في رمزِ الجمعِ الواردِ في الافتتاح:

```python
total = 0
for n in range(1, 11):
    if n % 2 != 0:
        continue          # الأزواجُ فقط
    total += n
print(total)              # 2 + 4 + 6 + 8 + 10 = 30
```

الحلقةُ هي $\sum$ مُيكنةً: كلُّ دورةٍ تجمع حدًّا، ويغربلُ `continue` الأدوارَ الفرديةَ، ويتراكمُ `total` كما تراكم المجموعُ المتصاعدُ في الدرسِ الثاني.

## أخطاء شائعة

- **حلقات `while` اللانهائية.** انسَ تحديث المتغير الذي يقرؤه الشرط فتدور الحلقة بلا نهاية. تحقق أن الجسم يحرّك الحالة نحو `False`.
- **تعديل قائمةٍ أثناء التكرار عليها.** القطعُ أو الحذف في منتصف الطريق يزاح الفهارس تحت قدميك. كرّر على نسخةٍ، أو ابنِ قائمةً جديدة.
- **`for i in range(len(items))`.** ما لم تكن تحتاج إلى الفهرس نفسه، كرّر فوق المتتالية مباشرة — «for fruit in fruits» يقول ما تقصد.
- **يتجاوز `continue` الدورةَ، ويهجرُها `break` جملةً.** يتجاوز `continue` التكرارَ الحاليَّ فقط؛ وينهي `break` الحلقةَ كلَّها. والخلطُ بينهما هو كيفَ يواصلُ دورانَهُ برجٌ كان عليه أن يقف.

## 🧩 تحديات

<details class="challenge">
<summary>🧩 تحدٍّ — فكّر أولًا ثم أظهر</summary>
<div class="challenge__body">

اكتب حلقة `for` تطبع أول عشرة مضاعفاتٍ للثلاثة: $3, 6, 9, \ldots, 30$.

<p class="challenge__answer">💡 <strong>الجواب:</strong> <code>for i in range(3, 31, 3): print(i)</code> — تبدأ `range(3, 31, 3)` عند 3 وتتقدم ثلاثًا ثلاثًا وتتوقف قبل 31، فتحطّ بالضبط على $3, 6, \ldots, 30$.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 تحدٍّ — فكّر أولًا ثم أظهر</summary>
<div class="challenge__body">

اكتب حلقة `while` تمشي عبر طابورٍ (حاكِها بقائمةٍ) وتتوقف عند العنصر `"quit"`، مطبعةً كل عنصرٍ تعبر عليه.

<p class="challenge__answer">💡 <strong>الجواب:</strong> <code>inputs = ["hello", "world", "quit"]; i = 0; while inputs[i] != "quit": print(inputs[i]); i += 1</code> — الشرط يحرس الحارسَ، والفهرس يحرّك الحالة نحوه.</p>

</div>
</details>

## 🤔 أسئلة سقراطية

- متى تلجأ إلى `while` عوضًا عن `for`؟ أعط مهمةً حقيقيةً لكلٍّ منهما — إحداهما تعدّها مسبقًا، والأخرى لا.
- ماذا يحدث لقائمةٍ تعدّلها بينما حلقة `for` تمشي عليها؟ وكيف تتجاوز الأمر؟
- لا تملك بايثون `do…while` كما في C. كيف تكتب جسمًا يجب أن يعمل مرةً واحدةً على الأقل قبل فحص أي شرط؟

## ✅ فحص سريع

<div class="quiz" data-quiz="python-101-loops">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">١. ماذا تطبع <code>for i in range(0, 10, 3): print(i, end=" ")</code>؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">0 1 2 3 4 5 6 7 8 9</button>
      <button class="quiz-q__opt" data-idx="1">0 3 6 9</button>
      <button class="quiz-q__opt" data-idx="2">3 6 9</button>
      <button class="quiz-q__opt" data-idx="3">0 3 6</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">٢. أيُّ كلمةٍ تتخطى بقيةَ الجولة الحالية من الحلقة؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">break</button>
      <button class="quiz-q__opt" data-idx="1">pass</button>
      <button class="quiz-q__opt" data-idx="2">continue</button>
      <button class="quiz-q__opt" data-idx="3">skip</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>