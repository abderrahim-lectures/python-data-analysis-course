---
title: "Range و Enumerate و Zip"
description: "ولّد متتاليات الأرقام، وتتبّع المؤشرات، واجمع بين الكائنات القابلة للتكرار."
module: "control-flow"
order: 10
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "استخدام range() لتوليد متتاليات الأرقام"
  - "استخدام enumerate() للحصول على المؤشر + القيمة أثناء التكرار"
  - "استخدام zip() للتكرار عبر متتاليات متعددة بالتوازي"
  - "كتابة حلقات بايثونية تتجنب تتبّع المؤشر يدويًا"
prerequisites: ["09-for-while-loops"]
tags: ["range", "enumerate", "zip", "iteration"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## أدواتٌ ثلاثٌ تُغني عن العدّ اليدوي

منحتك الحلقاتُ التكرارَ؛ وهذه الدرسُ يسلمك الأدواتَ الثلاث التي تُخرج العدّ من يديك. كل أداةٍ تستبدل عادةً عُلّمت كتابتَها يدويًّا، وكلٌّ منها جوابٌ لانزعاجٍ متكرر: توليد الأعداد، والحاجة إلى موضع عنصرٍ، وزدوج قائمتين. وهي معًا الفرق بين حلقةٍ تطبع وحلقةٍ تُقرأ.

## Range: المتتالية الحسابية، كسَلًا

جمعت في الدرس السابق بـ `range(5)`. هي تستحق نظرةً عن قرب ، إنها الأداة الكلاسيكية لـ «افعل هذا عددًا معلومًا من المرات»:

```python
for i in range(5):
    print(i)  # 0 1 2 3 4
```

لـ `range` ثلاث صيغٍ، تطابقُ المتتاليةَ الحسابية $a, a+d, a+2d, \ldots$:

```python
range(5)        # 0, 1, 2, 3, 4
range(2, 8)     # 2, 3, 4, 5, 6, 7
range(0, 20, 3) # 0, 3, 6, 9, 12, 15, 18
```

وسيطٌ واحد يعطي $0, 1, \ldots, n-1$؛ ووسيطان يعطيان الفترة شبه المفتوحة $[\text{start}, \text{stop})$؛ وثلاثةٌ تضيفان الفرقَ المشترك $d$. والأهم أن `range` **كسولة**: تسجّل المعاملات وتحسب كل قيمةٍ فقط حين تطلبها الحلقة. سؤالُ مليون خطوةٍ لا يكلف ذاكرةً أكثر من سؤال خمسٍ ، فالمتتالية لا تُجسَّد أبدًا.

## Enumerate: الموضع دون العدّاد

تريد موضع كل عنصر؟ غريزة المبتدئ عدّادٌ يدوي:

```python
fruits = ["apple", "banana", "cherry"]

i = 0
for fruit in fruits:
    print(f"{i}: {fruit}")
    i += 1
```

إنّ `i += 1` إغراءٌ بالخلل: انسَ واحدًا وتختلط تسميات المواضع. تنتج `enumerate` النصفين في خطوةٍ واحدة ، المؤشر والعنصر ، فلا يبقى شيءٌ تُبقي على اطراده:

```python
for i, fruit in enumerate(fruits):
    print(f"{i}: {fruit}")

# مُحصو الكلام الذين يُرقمون الناس من 1:
for i, fruit in enumerate(fruits, start=1):
    print(f"{i}: {fruit}")
```

حيث يكتب الرياضي $b_i = a_i + i$ ليلصق الموضع بالقيمة، تُسلّم `enumerate` الزوجَ $(i, a_i)$ لجسم الحلقة مباشرة.

## Zip: اصطفافٌ بالموقع

قائمتان متوازيتان ، أسماء ودرجات ، تصرخان أن تُقرآ معًا. تصطفّ `zip` بينهما عنصرًا بعنصر:

```python
names = ["Alice", "Bob", "Charlie"]
scores = [85, 92, 78]

for name, score in zip(names, scores):
    print(f"{name}: {score}")
# Alice: 85
# Bob: 92
# Charlie: 78
```

الاقتران هو الحيلةَ الديكارتية: تركض عبر القائمتين بمشبكٍ واحد مكوّنةً الأزواج $(n_0, s_0), (n_1, s_1), \ldots$. وإذا اختلفت القائمتان طولًا، يتوقف الاقتران عند الأقصر، فلا يُزدوج شيءٌ منقوصًا أبدًا. وإن احتجت الذيل المائل أيضًا، فيملؤه `itertools.zip_longest`:

```python
import itertools
for pair in itertools.zip_longest([1, 2], [3, 4, 5], fillvalue=0):
    print(pair)  # (1, 3), (2, 4), (0, 5) — لا تضيع قيمة
```

## مثالٌ محلول: سجلُّ الصفِّ

شاهدِ الأدواتِ الثلاثَ تعملُ معًا. تحفظُ معلمةٌ قائمةَ أسماءٍ وقائمةً موازيةً من الدرجاتِ، وتريدُ تقريرًا مرقّمًا:

```python
names = ["Dina", "Omar", "Sara"]
scores = [78, 91, 85]

for i, (name, score) in enumerate(zip(names, scores), start=1):
    print(f"#{i} {name}: {score}")
# #1 Dina: 78
# #2 Omar: 91
# #3 Sara: 85

print(f"Top score: {max(scores)}")   # Top score: 91
```

اقرأ رأسَ الحلقةِ من الداخلِ إلى الخارج: يزاوجُ `zip` كلَّ اسمٍ بدرجتِه؛ وتفكّكُ الأقواسُ `(name, score)` ذلك الزوجَ؛ ويُرقّم `enumerate` الأزواجَ بدءًا من واحدٍ. أربعةُ إيماءاتٍ كانت ستكلّفك عَدَّادًا مكتوبًا باليدِ تُقرأ الآن كالجملةِ التي تصفها ، يلتصقُ الموضعُ بالقيمةِ زوجًا زوجًا، تمامًا كما يُلصق $b_i = a_i + i$ مؤشرًا بكلِّ حدٍّ.

## أخطاء شائعة

- **`range` مستبعِدةٌ في الأعلى.** تنتج `range(5)` الأعدادَ $0, 1, 2, 3, 4$ ، خمسة أعدادٍ لا يساوي أحدُها $5$. فكّر كفترةٍ شبه مفتوحة، $[0, 5)$.
- **`enumerate` فوق قاموس.** تكرارُ القاموس يعطي مفاتيحه؛ وسترقم `enumerate` المفاتيح لا الأزواج. استخدم `dict.items()` حين تريد المفتاح والقيمة.
- **`zip` بأطوالٍ غير متساوية.** العناصرُ بعد المدخل الأقصر تتلاشى بصمت. انتبه للفقدان، أو عبّئ بـ `zip_longest`.
- **`zip` مكرِّرٌ ذو استخدامٍ واحد.** يسلّمك `p = zip(a, b)` في بايثونِ 3 مكرِّرًا لا قائمةً: يستهلكه `list(p)`، فيكونَ `list(p)` الثاني فارغًا. حوّله مبكرًا بـ `list(zip(a, b))` متى ستعودُ لزيارةِ الأزواجِ.

## 🧩 تحديات

<details class="challenge">
<summary>🧩 تحدٍّ ، فكّر أولًا ثم أظهر</summary>
<div class="challenge__body">

استخدم `enumerate` لتطبع كل لونٍ في `colors = ["red", "green", "blue"]` مع موضعه بدءًا من 1.

<p class="challenge__answer">💡 <strong>الجواب:</strong> <code>for i, color in enumerate(colors, 1): print(f"{i}. {color}")</code> ، يعيد وسيطُ <code>start</code> ترقيمَ الأزواج من واحدٍ.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 تحدٍّ ، فكّر أولًا ثم أظهر</summary>
<div class="challenge__body">

مع `keys = ["a", "b"]` و`values = [1, 2]`، استخدم `zip` لبناء قاموسٍ.

<p class="challenge__answer">💡 <strong>الجواب:</strong> <code>dict(zip(keys, values))</code> ← <code>{"a": 1, "b": 2}</code> ، تصير الأزواجُ المصطفّةُ مداخلَ الخريطة.</p>

</div>
</details>

## 🤔 أسئلة سقراطية

- لماذا تفضّل `range` على كتابة القائمة `[0, 1, 2, 3, 4]`؟ وماذا يتغير لو حملت القائمة مليونَ عددٍ؟
- ما دام `zip` يتوقف عند المدخل الأقصر، فكيف تكشف أيَّ الجانبين كان أقصر؟ ومتى تهمّ تلك التفرقة؟
- هل يستطيع `enumerate` أن يتمشى فوق قاموس؟ وما الذي ترقّمه المؤشرات بالضبط؟

## ✅ فحص سريع

<div class="quiz" data-quiz="python-101-range-enumerate-zip">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">١. ما ناتج <code>list(range(1, 10, 2))</code>؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">[1, 2, 3, 4, 5, 6, 7, 8, 9]</button>
      <button class="quiz-q__opt" data-idx="1">[1, 3, 5, 7, 9]</button>
      <button class="quiz-q__opt" data-idx="2">[2, 4, 6, 8]</button>
      <button class="quiz-q__opt" data-idx="3">[1, 2, 4, 8]</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">٢. ماذا ترجع <code>list(zip([1, 2], [3, 4, 5]))</code>؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">[(1, 3), (2, 4), (5,)]</button>
      <button class="quiz-q__opt" data-idx="1">[(1, 3, 5), (2, 4)]</button>
      <button class="quiz-q__opt" data-idx="2">[(1, 3), (2, 4)]</button>
      <button class="quiz-q__opt" data-idx="3">[(1, 2), (3, 4, 5)]</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>