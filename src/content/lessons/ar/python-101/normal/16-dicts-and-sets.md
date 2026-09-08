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

## القواميس

تُربط القواميس المفاتيح بالقيم — مثل تعبير قاموس حقيقي يربط الكلمات بالتعريفات:

```python
scores = {"Alice": 85, "Bob": 92, "Charlie": 78}
print(scores["Alice"])       # 85
print(scores.get("Dave", 0)) # 0 (default if key missing)
```

## طرق القاموس

```python
scores = {"Alice": 85, "Bob": 92}

scores.keys()         # dict_keys(['Alice', 'Bob'])
scores.values()       # dict_values([85, 92])
scores.items()        # dict_items([('Alice', 85), ('Bob', 92)])

scores["Dave"] = 78   # add new pair
del scores["Bob"]     # remove by key
scores.pop("Alice")   # remove and return value

scores.update({"Eve": 95, "Frank": 88})  # merge
scores.setdefault("Grace", 0)  # set only if key missing
```

## التكرار عبر القواميس

```python
for name in scores:           # keys
    print(name)

for name, score in scores.items():  # key-value pairs
    print(f"{name}: {score}")
```

## المجموعات

تُخزن المجموعات عناصر **فريدة** غير مرتبة:

```python
colors = {"red", "blue", "green", "red"}
print(colors)  # {'red', 'blue', 'green'}  (duplicates removed)
```

## عمليات المجموعة

```python
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

a | b    # {1, 2, 3, 4, 5, 6}  (union)
a & b    # {3, 4}              (intersection)
a - b    # {1, 2}              (difference)
a ^ b    # {1, 2, 5, 6}       (symmetric difference)
```

المجموعات سريعة لاختبار العضوية: `x in my_set` هي O(1) مقابل O(n) للقوائم.

## متطلب قابلية الهاش

يجب أن تكون مفاتيح القاموس وعناصر المجموعات **قابلة للهاش** (غير قابلة للتعديل): السلاسل والأرقام والجداول تعمل. القوائم والقواميس الأخرى لا تعمل:

```python
{[1, 2]: "bad"}   # TypeError: unhashable type: 'list'
{(1, 2): "good"}  # Works — tuple is hashable
```

## المزالق الشائعة

- **استخدام قائمة كمال هو خطأ جوهري**: تحوّل إلى المجموعة فقط عند الضرورة
- **نسيان أن القواميس تُحافظ على ترتيب الإدراج** (3.7+) — تُخوان الترتيب الموثوق به
- **خلط مفاتيح بلا نوع محدد**: القواميس تُطبع بترتيب الإدراج، فتفكّر في بنية البيانات قبل فعل أي شيء

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 التحديات</h2>

<details class="challenge">
<summary>التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

بُنِيّتَ النص التالي: `text = "the quick brown fox and the quick blue hare"`. احسب تكرار الكلمات باستخدام قاموس.

<p class="challenge__answer">💡 <strong>الإجابة:</strong> <code>counts = {}; for w in text.split(): counts[w] = counts.get(w, 0) + 1</code> — الاستخدام الكلاسيكي لـ <code>get</code> مع قيمة افتراضية.</p>

</div>
</details>

<details class="challenge">
<summary>التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

ينصبّ جزأين من نص على قيم متداخلة. اكتب كودًا يقرأ قائمة أسماء وينتج مجموعة من الأحرف الأولى الفريدة.

<p class="challenge__answer">💡 <strong>الإجابة:</strong> <code>names = ["Alice", "Bob", "Carol", "Ava"]; initials = {n[0] for n in names}</code> → <code>{'A', 'B', 'C'}</code>.</p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 أسئلة سقراطية</h2>

- لماذا تطلب المفاتيح قيمًا ثابتة غير قابلة للتعديل (hashable)؟ وكيف تفسر فشل استخدام قائمة كمفتاح؟
- متى تستخدم مجموعةً بدلًا من قائمة للاحتفاظ بعناصر فريدة؟ وما فوائد الأداء؟
- كيف تستخدم `defaultdict` لجعل عدّاد الكلمات أنظف؟

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ مراجعة سريعة</h2>

<div class="quiz" data-quiz="python-101-dicts-sets">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ماذا تُرجع <code>{1, 2, 3} & {3, 4}</code>؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">{1, 2, 3, 4}</button>
      <button class="quiz-q__opt" data-idx="1">{3}</button>
      <button class="quiz-q__opt" data-idx="2">{1, 2}</button>
      <button class="quiz-q__opt" data-idx="3">True</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. أيٌّ من هذه القيم مفتاح قاموس صالح؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">"a"</button>
      <button class="quiz-q__opt" data-idx="1">(1, 2)</button>
      <button class="quiz-q__opt" data-idx="2">جميعها صالحة</button>
      <button class="quiz-q__opt" data-idx="3">[1, 2]</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>