---
title: "فهم القوائم (List Comprehensions)"
description: "أنشئ القوائم بإيجاز باستخدام فهم القوائم ، الطريقة الأكثر تعبيرًا في بايثون."
module: "data-structures"
order: 17
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "كتابة فهم القوائم للتحويل والتصفية"
  - "استخدام فهم الشرط لضمان خلط المنطق"
  - "بناء القواميس والمجموعات عبر الفهم"
  - "فهم متى يكون الفهم أكثر وضوحًا من الحلقات"
prerequisites: ["16-dicts-and-sets"]
tags: ["comprehension", "list", "dict", "set", "generator"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## تدوينُ بناءِ المجموعاتِ شيفرةً

لِلرياضياتِ طريقٌ مقتضَبٌ لوصفِ مجموعةٍ مبنيةٍ من أخرى: باني المجموعات. والفهمُ هو ذلك التدوينُ مكتوبًا مباشرةً:

$$
\{x^2 \mid x \in \{0, 1, \ldots, 5\}\} = \{0, 1, 4, 9, 16, 25\}.
$$

اقرأ «مجموعةَ $x^2$، لكلِّ $x$ في هذا المصدر» ، وبايثونُ هي الجملةُ نفسها مقلوبةً شيفرةً:

```python
# حلقة عادية
squares = []
for x in range(6):
    squares.append(x ** 2)

# فهم
squares = [x ** 2 for x in range(6)]
# [0, 1, 4, 9, 16, 25]
```

تهجّي الحلقةُ ثلاثَ حركاتٍ ، البدءَ فارغًا، والإضافةَ، والإعادةَ؛ بينما يعلن الفهمُ المجموعةَ كلَّها في سطرٍ واحدٍ يحاكي تشريحَ الباني: التعبيرُ في المقدمة، والمتغيرُ المَجالتُ خلفه.

## التصفيةُ بالشروط

يحمل تدوينُ البناءِ أيضًا اختباراتِ إدماجٍ. فـ $\{w \in words \mid |w| > 2\}$ يصيرُ `if` في الذيل:

```python
evens = [x for x in range(10) if x % 2 == 0]
# [0, 2, 4, 6, 8]

long_words = [w.upper() for w in ["hi", "hello", "hey"] if len(w) > 2]
# ['HELLO', 'HEY']
```

`if` في النهاية *مصفاةٌ*: لا يبلغُ التعبيرَ إلا ما اجتازها. يقطع العنصرُ الطريقَ تعبيرٌ ← مصفاةٌ ← قائمةٌ، بالترتيبِ الذي تُقرأ به الجملة.

## If/else بصفته تعبيرًا

إنّ `if...else` الذي تعرفه تعبيرٌ ، ينتج قيمةً. ولصقُ واحدٍ *قبل* `for` يزرعه في خطّ البناء، مختارًا بحسب العنصرِ لا مصفِّيًا بحسبِه:

```python
labels = ["even" if x % 2 == 0 else "odd" for x in range(5)]
# ['even', 'odd', 'even', 'odd', 'even']
```

الموضعانِ شوكةٌ بمهمتينِ مختلفتين: بعدَ `for` تصوّت الجملةُ على العناصر؛ وقبلَ `for` تسمّيها. أولاهما تطرح، وأخراهما تحوّل.

## فهمُ القواميس

يبني الشكلُ نفسه أزواجَ الاقتران ، التعبيرُ يسارَ النقطتين يصيرُ المفتاحَ، والذي عن يمينهما القيمةَ:

```python
squares_dict = {x: x**2 for x in range(6)}
# {0: 0, 1: 1, 2: 4, 3: 9, 4: 16, 5: 25}

# عكس قاموس
original = {"a": 1, "b": 2}
inverted = {v: k for k, v in original.items()}
# {1: 'a', 2: 'b'}
```

العكسُ هو الشاهدُ الأنيق: تجوّل على `items()` وبادل أيُّ نصفٍ من كل زوجٍ يصيرُ المفتاحَ.

## فهمُ المجموعات

الأقواسُ المعقوفةُ مع فهمٍ تنتج مجموعةً ، فُرضتِ الفرديةُ تلقائيًّا:

```python
lengths = {len(word) for word in ["hello", "hi", "hey"]}
# {2, 3, 5}  (أطوال فريدة)
```

تنطوي ثلاثةُ أطوالٍ إلى مجموعةِ قيمٍ، مسقطةً ما تكرر كما يجبُ على مجموعةٍ.

## الفهمُ المتداخلُ: المُسطِّح

المصفوفةُ قائمةُ صفوفٍ، وتسطيحُها حلقتانِ في تعبيرٍ واحدٍ ، اقرأ جُملتَي `for` من اليسار يمينًا، الخارجيةَ أولًا:

```python
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
flat = [num for row in matrix for num in row]
# [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

تفتح كلُّ `for` مستوىً: تجوب `row` القائمةَ الخارجيةَ، وتجوب `num` كلَّ صفٍّ، ويتبع ترتيبُ المجموعةِ الحلقتينِ حذوًا.

## مثالٌ محلول: ثلاثُ سطورٍ من مُنشئِ المجموعات

حركاتُ الدرسِ الثلاثُ ، بناءٌ وتصفيةٌ وتسميةٌ ، سطرٌ لكلٍّ منها:

```python
squares = [x ** 2 for x in range(2, 9)]
# [4, 9, 16, 25, 36, 49, 64]

numbers = [x for x in range(1, 11) if x % 3 == 0]
# [3, 6, 9]

labels = ["even" if x % 2 == 0 else "odd" for x in numbers]
# ['odd', 'even', 'odd']
```

أولُها هو $\{x^2 \mid x \in [2, 9)\}$ مكتوبٌ كما هو؛ وثانيها يصفّي قواسمَ $3$؛ وثالثها يسمّي كلَّ ناجٍ. ما يقوله مُنشئُ المجموعاتِ بنَفَسٍ واحدٍ، يتهجّاه الفهمُ في سطرٍ.

## متى لا نستخدمُ الفهمَ

- حين تعقُد المنطقُ ، الحلقةُ العاديةُ تجني لها وضوحَها.
- حين يحتاج الجسمُ `try/except` ، لا متسعَ للفهمِ له.
- حين تُهمّ الآثارُ الجانبيةُ ، الطباعةُ والكتابةُ في ملفاتٍ ينبغي أن تكون جملًا متعمَّدةً لا تعبيراتٍ صامتةً.
- **وضعُ `if` قبلَ `for` يسمّي ولا يصفّي.** `[x if x % 2 == 0 else 'odd' for x in ...]` يُبقي كلَّ عنصرٍ، مسمًّى فحسب؛ ولا يُسقِطُ إلا `if` بعدَ `for`. في الموضعِ الخاطئِ يبقى المرفوضونَ صامتينَ.

## 🧩 تحديات

<details class="challenge">
<summary>🧩 تحدٍّ ، فكّر أولًا ثم أظهر</summary>
<div class="challenge__body">

سطّح `[[1, 2], [3, 4], [5, 6]]` إلى `[1, 2, 3, 4, 5, 6]` بفهمٍ.

<p class="challenge__answer">💡 <strong>الجواب:</strong> <code>[num for row in matrix for num in row]</code> ، الحلقةُ الخارجيةُ تفتح كلَّ صفٍّ، والداخليةُ تفرشه.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 تحدٍّ ، فكّر أولًا ثم أظهر</summary>
<div class="challenge__body">

اربط الكلماتَ بأطوالها بفهمِ قاموسٍ: `["hi", "hello", "hey"]` ← `{"hi": 2, "hello": 5, "hey": 3}`.

<p class="challenge__answer">💡 <strong>الجواب:</strong> <code>{w: len(w) for w in words}</code> ، الكلمةُ هي المفتاحُ وطولُها هي القيمةُ، زوجٌ لكل مدخلٍ.</p>

</div>
</details>

## 🤔 أسئلة سقراطية

- لماذا يقف `if...else` قبلَ `for` في فهمٍ بينما يتأخر `if` المصفاةُ بعده؟
- أين يعبر فهمٌّ الخطَّ نحو قراءةٍ أصعبَ من حلقةٍ؟ وأين ترسمه أنت؟
- هل يستطيع `await` الظهورَ داخلَ فهمٍّ ، وأيُّ صيغةٍ تُتيح نسخةً لامتزامنةً كاملةً؟

## ✅ فحص سريع

<div class="quiz" data-quiz="python-101-comprehensions">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">١. ماذا ينتج <code>[x * 2 for x in range(4) if x > 1]</code>؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">[0, 2, 4, 6]</button>
      <button class="quiz-q__opt" data-idx="1">[2, 4]</button>
      <button class="quiz-q__opt" data-idx="2">[4, 6]</button>
      <button class="quiz-q__opt" data-idx="3">[0, 2]</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">٢. أيُّ فهمِ قاموسٍ صحيح؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">{k: v for k, v in items}</button>
      <button class="quiz-q__opt" data-idx="1">{k, v for k, v in items}</button>
      <button class="quiz-q__opt" data-idx="2">{k: v in items}</button>
      <button class="quiz-q__opt" data-idx="3">dict(k: v for k, v in items)</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>