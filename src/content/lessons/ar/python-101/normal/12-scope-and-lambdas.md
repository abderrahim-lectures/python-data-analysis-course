---
title: "النطاق والدوال المجهولة (Lambdas)"
description: "افهم نطاق المتغيرات واكتب دوالًا سطرية موجزة."
module: "functions"
order: 12
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "فهم النطاق المحلي مقابل النطاق العام"
  - "استخدام الكلمتين المفتاحيتين global و nonlocal"
  - "كتابة دوال lambda للعمليات القصيرة"
  - "تطبيق lambdas مع sorted() و map() و filter()"
prerequisites: ["11-defining-functions"]
tags: ["scope", "global", "lambda", "sorted", "map", "filter"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## أين يسكن الاسم؟

المتغيرُ اسمٌ مربوطٌ بقيمة ، لكن *أين* يسري ذلك الربط هو النطاق. وترسم الرياضيات هذا أيضًا: في $f(x) = x^2$، الحرفُ $x$ متغيّرٌ مؤقتٌ لا يعيش إلا داخل التعريف. وخارجه قد يعني $x$ شيئًا مختلفًا كلّيًّا. ترسم بايثون الجدرانَ نفسها حول أجسام الدوال: المتغيرُ المنشأُ داخل دالةٍ **محلي** ، يوجد داخل الجدران ولا يوجد في غيرها.

```python
def my_func():
    x = 10
    print(x)  # يعمل

my_func()
# print(x)  # NameError: x is not defined
```

أمّا المتغيراتُ المعرَّفةُ على مستوى الوحدة فمرئيةٌ في كل ما تحتها ، إنها **عامة**:

```python
counter = 0

def increment():
    global counter
    counter += 1

increment()
print(counter)  # 1
```

مشكلةُ `global` أنها تترك دالةً تعيد كتابةَ العالم من الداخل. يتغير الربطُ حيث لم يخبرك شيءٌ في الاستدعاء أنه سيتغير. **فضّل إرجاع القيم على التمدد نحو `global`** ، فالدالةُ التي ترجع دالةٌ تستطيع اختبارها والاستدلال عليها بمعزلٍ.

## النطاق المتداخل و nonlocal

قد تتكدس الدوال، ويمكن لدالةٍ داخليةٍ أن *تقرأ* متغيرًا خارجيًّا. أمّا إعادة تعيينه فتشترط كلمةَ `nonlocal` ، اعترافًا بأن الاسمَ يخصّ النطاقَ المحيط:

```python
def make_counter():
    count = 0
    def increment():
        nonlocal count
        count += 1
        return count
    return increment

counter = make_counter()
print(counter())  # 1
print(counter())  # 2
```

يحمل `increment` الداخليُّ ذاكرتَه الخاصة: كلُّ استدعاءٍ يدفع `count` الملتقَط. هذا هو إغلاقٌ ، دالةٌ بجيبِ حالةٍ تجرّه وراءها بعد أن تنتهي دورتُها المحيطية.

## Lambda: الدالة السطرية

للدالةِ التي تتسع في سطرٍ واحدٍ اختزالٌ. تنشئ `lambda` دالةً صغيرةً مجهولة ، صيغةً في هيئة تعبير:

```python
add = lambda a, b: a + b
print(add(3, 5))  # 8
```

إنها معادلةٌ لـ `def` التي تعرفها بالفعل:

```python
def add(a, b):
    return a + b
```

الفرقُ فرقُ ثقل: تكتب `def` المراسمَ كلَّها لأيِّ شيءٍ فيه خطوات؛ وتبقى `lambda` سطريةً لتعبيرٍ واحدٍ، بلا توثيقٍ لاحقٍ وبلا `return` ، فالتعبيرُ بعد النقطتين *هو* قيمةُ العودة.

## Lambdas مع دوال الرتبة الأعلى

تكسب الـ lambdas قوتَها حين تُسلَّم إلى دوالٍ تأخذ دالةً مدخلًا. الترتيبُ بالدرجة، وتعيينُ كل عنصرٍ، والاكتفاءُ بالعناصرِ التي تجتاز اختبارًا ، كلٌّ منها تدوينُ بناءِ المجموعاتِ في شيفرة:

```python
students = [("Alice", 85), ("Bob", 92), ("Charlie", 78)]

# الترتيب بالدرجة (العنصر الثاني)
by_score = sorted(students, key=lambda s: s[1])
print(by_score)  # [('Charlie', 78), ('Alice', 85), ('Bob', 92)]

# Map: تطبيق دالةٍ على كل عنصرٍ — $\{2x \mid x \in \text{nums}\}$
nums = [1, 2, 3, 4]
doubled = list(map(lambda x: x * 2, nums))
# [2, 4, 6, 8]

# Filter: الاحتفاظ بما يجتاز اختبارًا — $\{x \in \text{nums} \mid x \equiv 0 \pmod{2}\}$
evens = list(filter(lambda x: x % 2 == 0, nums))
# [2, 4]
```

يحوّل `map` كلَّ عنصرٍ؛ ويمسك `filter` بالعناصر التي يقرّها مسندٌ؛ ويرتّب `sorted` وفق مفتاحٍ مختار. ثلاثُ عملياتٍ شائعةٍ على البيانات، كلٌّ يقبل دالةً صغيرةً مقبضَ تخصيص.

## مثالٌ محلول: الدالةُ النظيفة

نصيحةُ الأنطاقِ ، تفضيلُ `return` على `global` ، لها هيئةٌ جاهزةٌ: سعرٌ والمعدلُ معاملٌ:

```python
def price_with_tax(price, rate=0.2):
    return round(price * (1 + rate), 2)

price_with_tax(10.0)        # 12.0
price_with_tax(10.0, 0.08)  # 10.8
```

الدالةُ النظيفةُ لا تحتاجُ `global`: يصلُ المعدلُ معاملًا، والعالمُ الخارجيُّ باقٍ كما هو، وتُقرأ الصيغةُ ، $\text{السعر} \cdot (1 + \text{المعدل})$. كلُّ ما يحدثُ يقعُ داخلَ الجدرانِ، ويعودُ الناتجُ عبر `return`.

## أخطاء شائعة

- **استخدام `global` حين يكفي `return`.** يخفي الأثرَ الجانبيَّ ويقرن الدالةَ بمحيطها.
- **الإفراط في الـ lambdas.** تعبيرٌ واحدٌ فقط؛ وما إن تحتاج lambda خطوتين حتى تحوّلها `def`.
- **الخلط بين الأنطاق في الدوال المتداخلة.** حين يُقرأ متغيرٌ، تتجه بايثون للخارج بحثًا عنه؛ وصيحتُا `nonlocal` أو `global` تغيّران من يحقّ له الكتابة. اقرأ هذا المنطق قبل أن تفترض الربط.
- **`sorted` دون `key` يرتبُ بالعنصرِ نفسه.** تُرتبُ الأزواجُ معجميًّا بعنصرِها الأولِ أولًا؛ وللترتيبِ بالثاني، تكونُ `key` إلزاميةً ، `sorted(students, key=lambda s: s[1])`.

## 🧩 تحديات

<details class="challenge">
<summary>🧩 تحدٍّ ، فكّر أولًا ثم أظهر</summary>
<div class="challenge__body">

رتّب الكلماتَ `words = ["banana", "pie", "Washington", "a"]` حسب الطول.

<p class="challenge__answer">💡 <strong>الجواب:</strong> <code>sorted(words, key=lambda w: len(w))</code> → <code>['a', 'pie', 'banana', 'Washington']</code> ، الدالةُ المفتاحيةُ ترفع كل كلمةٍ إلى العدد الذي يُقارَن.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 تحدٍّ ، فكّر أولًا ثم أظهر</summary>
<div class="challenge__body">

استخدم `filter` مع lambda للاحتفاظ بالكلماتِ الأطولِ من ثلاثة أحرفٍ من `["hi", "hello", "hey", "howdy", "yo"]`.

<p class="challenge__answer">💡 <strong>الجواب:</strong> <code>list(filter(lambda w: len(w) > 3, words))</code> → <code>['hello', 'howdy']</code> ، المسندُ هو شرطُ انتمائك، و<code>filter</code> هو باني المجموعة.</p>

</div>
</details>

## 🤔 أسئلة سقراطية

- لماذا تشترط بايثون `nonlocal` بدلًا من ترك الدوال الداخلية تعيد تعيينَ متغيرٍ خارجيٍّ بحرية؟ أيَّ أخطاءٍ يمنع ذلك الاشتراط؟
- `map`/`filter` مع lambda في مقابل فهمِ القائمة ، متى يكون كلٌّ أصدقَ إملاءً؟
- لا تقبل lambda إلا تعبيرًا واحدًا. أيُّ قيدٍ يختبئ خلف تلك القاعدة؟

## ✅ فحص سريع

<div class="quiz" data-quiz="python-101-scope-lambdas">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">١. ماذا ترجع <code>sorted(["banana", "pie", "a"], key=len)</code>؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">['a', 'pie', 'banana']</button>
      <button class="quiz-q__opt" data-idx="1">['banana', 'pie', 'a']</button>
      <button class="quiz-q__opt" data-idx="2">['a', 'pie', 'banana']</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">٢. أيُّ كلمةٍ مفتاحيةٍ تتيح لدالةٍ داخليةٍ تعديلَ متغيرٍ خارجيٍّ؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">nonlocal</button>
      <button class="quiz-q__opt" data-idx="1">global</button>
      <button class="quiz-q__opt" data-idx="2">outer</button>
      <button class="quiz-q__opt" data-idx="3">closure</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>