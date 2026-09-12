---
title: "القواميس والمجموعات"
description: "خزّن التعيينات الرئيسية بالقواميس، والعناصر الفريدة بالمجموعات."
module: "data-structures"
order: 16
difficulty: "beginner"
estimatedMinutes: 18
learningObjectives:
  - "إنشاء القواميس والوصول إلى القيم وتعديلها"
  - "فهم متطلبات صلاحية مفاتيح القاموس"
  - "استخدام المجموعات للفردية واختبار العضوية"
  - "التكرار عبر القواميس والمجموعات"
prerequisites: ["15-lists-and-tuples"]
tags: ["dict", "set", "key-value", "hashable", "membership"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## الاقتران

يسمّي الرياضيونُ جدولًا يقترن فيه كلُّ مدخلٍ بمخرجٍ واحدٍ *دالةً*؛ وتسمّيه بايثون **قاموسًا**. المفاتيحُ تشيرُ إلى قيمٍ، تمامًا كما يشير قاموسُ الكلماتِ إلى تعريفاتها:

```python
scores = {"Alice": 85, "Bob": 92, "Charlie": 78}
print(scores["Alice"])       # 85
print(scores.get("Dave", 0)) # 0 (القيمة الافتراضية عند غياب المفتاح)
```

الفهرسةُ بـ `[]` هي البحثُ النفور: تشترط وجودَ المفتاح. و`.get(key, default)` هي الصيغةُ المهذّبة: إن غاب المفتاحُ فترجع البديلَ بدلًا من رمي `KeyError`. والتفرقةُ هي الفرقُ بين دعوى وسؤالٍ.

## عدةُ القاموس

```python
scores = {"Alice": 85, "Bob": 92}

scores.keys()         # dict_keys(['Alice', 'Bob'])
scores.values()       # dict_values([85, 92])
scores.items()        # dict_items([('Alice', 85), ('Bob', 92)])

scores["Dave"] = 78   # يضيف زوجًا جديدًا
del scores["Bob"]     # يحذف بمفتاحه
scores.pop("Alice")   # يحذف ويرجع القيمة

scores.update({"Eve": 95, "Frank": 88})  # يدمج
scores.setdefault("Grace", 0)  # يخصص فقط إن غاب المفتاح
```

إنّ `keys` و`values` و`items` ثلاثُ مناظرَ للعلاقة نفسها ، المجالُ، والمدى، والرسمُ البياني. يدمج `update` قاموسًا ثانيًا؛ ويكتب `setdefault` فقط حين يغيب المفتاحُ، الإسنادَ المشروطَ الذي لا يحتاج `if`.

## التجوّل على الاقتران

إنّ التكرارَ على قاموسٍ يجوب المجالَ افتراضيًّا؛ ولترى النصفين معًا فاطلب `items`:

```python
for name in scores:           # المفاتيح
    print(name)

for name, score in scores.items():  # أزواج المفتاح-القيمة
    print(f"{name}: {score}")
```

يُسلّمك `items` الزوجَ مباشرةً ، بلا فهرسةٍ يدوية ، إذ إن تفكيكَ مدخلٍ إلى `name, score` هو القراءةُ الطبيعيَّةُ لصفٍّ.

## المجموعات: مجموعةُ الرياضيات

**المجموعةُ** مجموعةٌ بالمعنى الرياضي: تجميعٌ بلا ترتيبٍ وبلا تكرارٍ. يذوب التكرارُ عند الباب:

```python
colors = {"red", "blue", "green", "red"}
print(colors)  # {'red', 'blue', 'green'}  (حُذفت التكرارات)
```

الفرديةُ مفروضةٌ بنيويًّا ، لا نسخةٌ ثانيةٌ تنتظر تلويثَ فحصِ العضوية. والعضويةُ في مجموعةٍ هي $x \in S$ تمامًا: العنصرُ داخلٌ أو خارجٌ، بلا مرتبةِ وسطى.

## عمليات المجموعات

جبرُ المجموعات منسوجٌ مباشرةً. مع $A = \{1, 2, 3, 4\}$ و$B = \{3, 4, 5, 6\}$:

```python
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

a | b    # {1, 2, 3, 4, 5, 6}  (الاجتماع)
a & b    # {3, 4}              (التقاطع)
a - b    # {1, 2}              (الفرق)
a ^ b    # {1, 2, 5, 6}       (الفرق المتناظر)
```

$$
A \cup B = \{1, 2, 3, 4, 5, 6\}, \quad A \cap B = \{3, 4\}, \quad A \setminus B = \{1, 2\}, \quad A \mathbin{\triangle} B = \{1, 2, 5, 6\}.
$$

العواملُ هي العلاماتُ التي تعرفها مسبقًا. وحيث يعدُّ النظريةُ بالسرعة، يوفّي التنفيذُ بوعدِه: فحصُ العضويةِ في مجموعةٍ يجري في $O(1)$ مقابلَ $O(n)$ للقائمة، لأن المجموعةَ تخزّن العناصرَ ببصمةٍ محسوبةٍ لا بموقعٍ.

## شرطُ البصمة

البصماتُ تشترطُ الاستقرارَ. يجب أن تكون مفاتيحُ القاموسِ وعناصرُ المجموعاتِ **قابلةً للبصم (hashable)** ، عمليًّا، غيرَ قابلةٍ للتغيير ، لتظلَّ حساباتُها قابلةَ الإعادة. السلاسلُ والأعدادُ والجداولُ تفي؛ والقوائمُ وسائرُ القواميسِ لا تفي:

```python
{[1, 2]: "bad"}   # TypeError: unhashable type: 'list'
{(1, 2): "good"}  # يعمل — الجَدْوِلُ قابلٌ للبصم
```

ما كانت قائمةٌ لتصلح مفتاحًا موثوقًا ولو أُذن بها: بصمتُها تتغيّرُ في اللحظةِ التي يتغير فيها محتواها، محوِّلةً الاقترانَ إلى حقلِ ألغامِ بحثٍ بائد.

## مثالٌ محلول: دفترُ الدرجات

العلاقةُ والمجالُ والمدى ، جدولٌ واحدٌ يُقاسُ بثلاثِ وقفاتٍ:

```python
scores = {"Alice": 85, "Bob": 92, "Charlie": 78}

for name, score in scores.items():
    print(f"{name}: {score}")

print(scores.get("Dave", "absent"))   # absent — بلا KeyError

roles = {"student", "teacher", "admin"}
print("student" in roles)             # True — انتماءٌ O(1)
```

يمشي `items` الرسمَ كلَّهُ، ويستعلمُ `.get` بلطفٍ حين تجهلُ وجودَ المفتاحِ، و`in` على مجموعةٍ هو الانتماءُ $x \in S$ ، ثلاثةُ أسئلةٍ تجيبُ عنها هياكلُ الدرسِ مباشرةً.

## أخطاء شائعة

- **الوصولُ إلى مفاتيحَ غائبة.** `.get()` أو فحصٌ بـ `in` يوفران عليك `KeyError`.
- **الاتكاءُ على ترتيبِ القاموس.** تحفظ بايثون 3.7+ ترتيبَ الإدراج، لكن أعامله تسهيلًا لا عقدًا.
- **الثقةُ بترتيبِ مجموعةٍ.** لا تحفظ المجموعةُ أيَّ ترتيبٍ؛ لا تجعلْ ترتيبَ التكرارِ قطُّ اعتمادًا.
- **`{}` قاموسٌ فارغٌ؛ و`set()` هو المجموعةُ الفارغة.** `{}` ليست مجموعةً. اكتبْ `set()` للفارغةِ وللحرفيةِ `{"a", "b"}` ، رمزٌ واحدٌ بمعنيينِ.

## 🧩 تحديات

<details class="challenge">
<summary>🧩 تحدٍّ ، فكّر أولًا ثم أظهر</summary>
<div class="challenge__body">

عُدّ تكرارَ كلِّ حرفٍ في `"hello world"` بقاموسٍ.

<p class="challenge__answer">💡 <strong>الجواب:</strong> <code>freq = {}; for c in "hello world": freq[c] = freq.get(c, 0) + 1</code> ، بديلُ <code>.get</code> بـ $0$ يحوّل الظهورَ الأولَ إلى زيادةٍ من الصفر.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 تحدٍّ ، فكّر أولًا ثم أظهر</summary>
<div class="challenge__body">

بقائمتين، ابحث عن العناصرِ الظاهرةِ فيهما معًا باستخدامِ المجموعات.

<p class="challenge__answer">💡 <strong>الجواب:</strong> <code>set(a) & set(b)</code> أو <code>set(a).intersection(b)</code> ، التقاطعُ هو $A \cap B$، وآلةُ المجموعاتِ تنجز العملَ.</p>

</div>
</details>

## 🤔 أسئلة سقراطية

- لماذا لا تصلح قائمةٌ مفتاحًا لقاموسٍ؟ وما الصفةُ التي يجب أن يحملها المفتاح؟
- متى تتفوق مجموعةٌ على قائمةٍ ، ماذا تخسر وماذا تربح؟
- كيف يختلف `dict.get(key, default)` عن `dict[key]`، ومتى تفضّل المرء؟

## ✅ فحص سريع

<div class="quiz" data-quiz="python-101-dicts-sets">
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">١. ماذا ترجع <code>{"a": 1, "b": 2}.get("c", 0)</code>؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">0</button>
      <button class="quiz-q__opt" data-idx="1">None</button>
      <button class="quiz-q__opt" data-idx="2">KeyError</button>
      <button class="quiz-q__opt" data-idx="3">'c'</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">٢. ما قيمة <code>{1, 2, 3} ^ {2, 3, 4}</code>؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">{2, 3}</button>
      <button class="quiz-q__opt" data-idx="1">{1, 4}</button>
      <button class="quiz-q__opt" data-idx="2">{1, 2, 3, 4}</button>
      <button class="quiz-q__opt" data-idx="3">{1, 2, 3}</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>