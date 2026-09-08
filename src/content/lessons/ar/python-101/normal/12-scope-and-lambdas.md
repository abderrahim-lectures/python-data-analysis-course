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

## النطاق المحلي

المتغيرات المنشأة داخل دالة محلية — لا توجد خارجها:

```python
def my_func():
    x = 10
    print(x)  # works

my_func()
# print(x)  # NameError: x is not defined
```

## النطاق العام

المتغيرات المعرّفة على مستوى الوحدة يمكن الوصول إليها في كل مكان:

```python
counter = 0

def increment():
    global counter
    counter += 1

increment()
print(counter)  # 1
```

**فضّل إرجاع القيم على استخدام `global`** — يجعل الكود أسهل في الاختبار والتفكير.

## النطاق المتداخل و nonlocal

يمكن للدوال الداخلية قراءة متغيرات الدالة الخارجية، لكنها لا تستطيع إعادة إسنادها دون `nonlocal`:

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

## دوال lambda

تنشئ `lambda` دالة صغيرة مجهولة في سطر واحد:

```python
add = lambda a, b: a + b
print(add(3, 5))  # 8
```

مكافئة لـ:

```python
def add(a, b):
    return a + b
```

## Lambdas مع الدوال ذات الرتبة الأعلى

تتألق lambdas عند تمريرها كمعاملات إلى دوال أخرى:

```python
students = [("Alice", 85), ("Bob", 92), ("Charlie", 78)]

# Sort by score (second element)
by_score = sorted(students, key=lambda s: s[1])
print(by_score)  # [('Charlie', 78), ('Alice', 85), ('Bob', 92)]

# Map: apply a function to every item
nums = [1, 2, 3, 4]
doubled = list(map(lambda x: x * 2, nums))
# [2, 4, 6, 8]

# Filter: keep items that pass a test
evens = list(filter(lambda x: x % 2 == 0, nums))
# [2, 4]
```

## المزالق الشائعة

- **استخدام `global` عندما يجب عليك إرجاع قيمة** — يخفي الآثار الجانبية
- **الإفراط في استخدام lambdas** — إذا احتجت أكثر من تعبير واحد، استخدم `def`
- **الخلط في النطاق داخل الدوال المتداخلة** — تحقق دائمًا من مكان تعريف المتغير

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 التحديات</h2>

<details class="challenge">
<summary>التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

رتب قائمة الكلمات هذه حسب طولها: `words = ["banana", "pie", "Washington", "a"]`

<p class="challenge__answer">💡 <strong>الإجابة:</strong> <code>sorted(words, key=lambda w: len(w))</code> → <code>['a', 'pie', 'banana', 'Washington']</code></p>

</div>
</details>

<details class="challenge">
<summary>التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

استخدم `filter` مع lambda لاستخراج كل الكلمات الأطول من 3 أحرف من `["hi", "hello", "hey", "howdy", "yo"]`.

<p class="challenge__answer">💡 <strong>الإجابة:</strong> <code>list(filter(lambda w: len(w) > 3, words))</code> → <code>['hello', 'howdy']</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 أسئلة سقراطية</h2>

- لماذا تستخدم بايثون `nonlocal` بدلًا من السماح للدوال الداخلية بإعادة إسناد متغيرات الدوال الخارجية؟ وما المشكلة التي يحلها هذا؟
- متى تستخدم `map`/`filter` مع lambdas مقابل فهم القائمة؟ هل أحدهما أفضل؟
- هل يمكن أن تحتوي lambda على عبارات متعددة؟ ولماذا أو لماذا لا؟

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ مراجعة سريعة</h2>

<div class="quiz" data-quiz="python-101-scope-lambdas">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. ماذا تُرجع <code>sorted(["banana", "pie", "a"], key=len)</code>؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">['a', 'pie', 'banana']</button>
      <button class="quiz-q__opt" data-idx="1">['banana', 'pie', 'a']</button>
      <button class="quiz-q__opt" data-idx="2">['a', 'pie', 'banana']</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">2. أي كلمة مفتاحية تسمح لدالة داخلية بتعديل متغير خارجي؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">nonlocal</button>
      <button class="quiz-q__opt" data-idx="1">global</button>
      <button class="quiz-q__opt" data-idx="2">outer</button>
      <button class="quiz-q__opt" data-idx="3">closure</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>