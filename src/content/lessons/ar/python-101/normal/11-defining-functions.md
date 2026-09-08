---
title: "تعريف الدوال"
description: "أنشئ كتل كود قابلة لإعادة الاستخدام باستخدام def والوسائط وقيم الإرجاع."
module: "functions"
order: 11
difficulty: "beginner"
estimatedMinutes: 18
learningObjectives:
  - "تعريف الدوال واستدعاؤها باستخدام def"
  - "استخدام الوسائط الموضعية والمفتاحية والافتراضية"
  - "إرجاع القيم من الدوال"
  - "كتابة سلاسل توثيق (docstrings) لتوثيق الدوال"
prerequisites: ["10-range-enumerate-zip"]
tags: ["def", "parameters", "return", "docstrings"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## تعريف دالة

استخدم `def` متبوعًا باسم، وأقواس، ونقطتين:

```python
def greet(name):
    """Print a greeting for the given name."""
    print(f"Hello, {name}!")

greet("Alice")  # Hello, Alice!
```

## الوسائط (Parameters) والمعاملات (Arguments)

الوسائط هي متغيرات مدرجة في تعريف الدالة. المعاملات هي القيم التي تمررها عند استدعائها.

```python
def add(a, b):
    return a + b

result = add(3, 5)  # 8
```

## الوسائط الافتراضية

أعطِ الوسائط قيمة افتراضية — يمكن للمستدعين تجاوزها اختياريًا:

```python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

print(greet("Alice"))              # Hello, Alice!
print(greet("Bob", "Hey"))         # Hey, Bob!
```

**قاعدة**: يجب أن تأتي الوسائط الافتراضية بعد الوسائط غير الافتراضية.

## المعاملات المفتاحية (Keyword arguments)

استدعِ الدوال باسم الوسيطة للوضوح:

```python
def create_user(name, age, role="student"):
    return {"name": name, "age": age, "role": role}

user = create_user(age=25, name="Alice", role="admin")
```

## *args و **kwargs

اقبل أي عدد من المعاملات الموضعية أو المفتاحية:

```python
def total(*args):
    return sum(args)

print(total(1, 2, 3, 4))  # 10

def print_info(**kwargs):
    for key, value in kwargs.items():
        print(f"{key}: {value}")

print_info(name="Alice", age=25)
```

## الإرجاعات المبكرة

عُد مبكرًا لعبارات الحماية — يقلل التداخل:

```python
def divide(a, b):
    if b == 0:
        return None
    return a / b
```

## المزالق الشائعة

- **الوسائط الافتراضية القابلة للتعديل**: `def f(items=[])` تشارك القائمة نفسها عبر الاستدعاءات. استخدم `None` بدلًا من ذلك: `def f(items=None): items = items or []`
- **نسيان الإرجاع**: دالة بدون `return` تعطي `None`
- **كثرة الوسائط** (4+): فكّر في استخدام قاموس أو داتاكلاس

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 التحديات</h2>

<details class="challenge">
<summary>التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

اكتب دالة `is_palindrome(text)` تُرجع `True` إذا كانت السلسلة تُقرأ بنفس الطريقة في الأمام والخلف (تجاهل حالة الأحرف).

<p class="challenge__answer">💡 <strong>الإجابة:</strong> <code>def is_palindrome(text): return text.lower() == text.lower()[::-1]</code></p>

</div>
</details>

<details class="challenge">
<summary>التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

اكتب دالة `fizzbuzz(n)` تُرجع قائمة من 1 إلى n، لكنها تستبدل مضاعفات 3 بـ "Fizz"، ومضاعفات 5 بـ "Buzz"، ومضاعفات كليهما بـ "FizzBuzz".

<p class="challenge__answer">💡 <strong>الإجابة:</strong> <code>["FizzBuzz" if i % 15 == 0 else "Fizz" if i % 3 == 0 else "Buzz" if i % 5 == 0 else i for i in range(1, n+1)]</code></p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 أسئلة سقراطية</h2>

- لماذا تتطلب بايثون الوسائط الافتراضية بعد غير الافتراضية؟ وماذا سيحدث لو عُكسَت القاعدة؟
- ما المشكلة التي يحلها `*args` ولا يحلها معامل قائمة؟ ومتى تفضّل أحدهما على الآخر؟
- كيف تقرر بايثون أي دالة تستدعي عندما يكون لديك `def f(x)` و`def f(x, y=5)` معًا؟

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ مراجعة سريعة</h2>

<div class="quiz" data-quiz="python-101-functions">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ماذا تُرجع هذه؟ <code>def f(x, y=3): return x + y; f(5)</code></p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">5</button>
      <button class="quiz-q__opt" data-idx="1">8</button>
      <button class="quiz-q__opt" data-idx="2">Error</button>
      <button class="quiz-q__opt" data-idx="3">None</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. ما المخرج؟ <code>def f(a, b=[]): b.append(a); return b; print(f(1)); print(f(2))</code></p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">[1] then [2]</button>
      <button class="quiz-q__opt" data-idx="1">[1] then [1, 2]</button>
      <button class="quiz-q__opt" data-idx="2">[1, 2] then [1, 2]</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>