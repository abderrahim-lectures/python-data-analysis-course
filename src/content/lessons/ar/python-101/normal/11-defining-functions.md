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

## من الصيغة إلى الآلة المسماة

تنفر الرياضياتُ من التكرار. تعلمت $f(x) = x^2 - 5x + 6$ كـ *قاعدة* — تعريفٌ واحدٌ يوظَّف ألفَ مرةٍ على ألفِ مدخلٍ مختلف:

$$
f(x) = x^2 - 5x + 6, \qquad f(2) = 0.
$$

إنّ `def` في بايثون هي الحركة نفسها: ربطُ اسمٍ بحسابٍ، ليستطيع أيُّ مستدعٍ تطبيقه. الدالة آلةٌ بشقوقِ مدخلٍ موسومةٍ وبابِ مخرجٍ واحد:

```python
def add(a, b):
    return a + b

result = add(3, 5)  # 8
```

الاسم، والقوسان اللذان يحملان الوسيطين $a, b$، والنقطتان اللتان تبدأان الوصفة — هذا هو التعريف. والاستدعاء `add(3, 5)` تطبيقُ القاعدة عند $a=3$ و$b=5$، تمامًا كما يطبّق $f(2)$ قاعدةً عند $x=2$.

## التعريف والاستدعاء

أول دالةٍ تكتبها تغيّر العالمَ تحيةً تحية:

```python
def greet(name):
    """Print a greeting for the given name."""
    print(f"Hello, {name}!")

greet("Alice")  # Hello, Alice!
```

ثلاثةُ أجزاءٍ تستحق أسماء. **الوسائط (parameters)** هي المتغيرات في التعريف — شقوقُ المدخل $x$. **الوسيطات (arguments)** هي القيمُ الملموسةُ المقدَّمةُ عند موضع الاستدعاء — المدخل $2$. والسطرُ المحاط بعلامات اقتباس ثلاثيةٍ من الداخل هو **سلسلة التوثيق**: توثيقٌ يسكن جوار الكود، ليستطيع `help(greet)` الإجابةَ عمّا تفعله الدالة.

## Return: باب المخرج

يرسل `print` نصًّا إلى الشاشة؛ ويسلّم `return` قيمةً إلى المستدعِي. التفرقةُ خفيةٌ وحاسمة:

```python
def add(a, b):
    return a + b

result = add(3, 5)          # result == 8
printed = print("8")        # printed هو None — print لا يعيد شيئًا
```

كل دالةٍ بلا `return` تعيد `None` بصمت — الآلة لا تنتج مخرجًا. وحين تريد أن يستمرّ الناتجُ الحسابيُّ لدورتك في التدفق، تذكر: `return` لا `print`.

## وسائط افتراضية

بعض الوسائط لها ضبطٌ طبيعيٌّ تحتفظ به أكثرُ الاستدعاءات. أعطها قيمةً افتراضية، وليتمكّن المستدعون من تجاوزها:

```python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

print(greet("Alice"))              # Hello, Alice!
print(greet("Bob", "Hey"))         # Hey, Bob!
```

قاعدة الترتيب صارمة: **الوسائط الافتراضية تأتي بعد غير الافتراضية.** `def f(x, y=5)` مشروعة؛ أمّا `def f(x=1, y)` فخطأ قواعدي، لأن بايثون تحلّ الوسيطات موضعيًّا من اليسار، والثغرةُ ستكون ملتبسة.

## الوسيطات المفتاحية

يمكن أن تصل الوسيطات مسماةً أيضًا، فيشتري ذلك وضوحًا حين تكبر مجموعة الوسائط:

```python
def create_user(name, age, role="student"):
    return {"name": name, "age": age, "role": role}

user = create_user(age=25, name="Alice", role="admin")
```

للوسيطات المسمّاة أيُّ ترتيبٍ — اسمُ الوسيط هو ملصقُ كل طرد. والاستدعاء الذي يسمّي مدخلاته يُقرأ جملةً لا شيفرةً تحتاج فكًّا.

## *args و **kwargs

وماذا إذا كان عددُ المدخلات مجهولًا مقدمًا؟ لا تعرف المجموعةُ عددَ المضافات التي ستستقبل. يجمع `*args` أيَّ عددٍ من الوسيطات الموضعية في مصفوفة؛ ويجمع `**kwargs` الوسيطات المسماة في قاموس:

```python
def total(*args):
    return sum(args)

print(total(1, 2, 3, 4))  # 10

def print_info(**kwargs):
    for key, value in kwargs.items():
        print(f"{key}: {value}")

print_info(name="Alice", age=25)
```

النجمةُ هي الإيماءة: تفتح `*` قائمةَ الوسيطات في حزمةٍ واحدة. ذلك هو الفرق بين مجموعٍ بتوقيعٍ ثابتٍ ومجموعٍ يقبل $\sum_{i=1}^{n} a_i$ لأيِّ $n$.

## العودة المبكرة بصفتها حارسًا

بعض الأكواد تبدأ بفحص الحالة الوحيدة التي يجب ألا تمضي. استدلالاتُ صيغة «إلا إذا كان $b=0$» تُعلن حارسًا في الأعلى، فتُرجِع فورًا:

```python
def divide(a, b):
    if b == 0:
        return None
    return a / b
```

جملةُ الحارس تطوي زوجَ `if/else` إلى خطٍّ مستقيم: حالةُ الفشل تخرج مبكرًا، والمسار الصادق يجري دون تداخل.

## مثالٌ محلول: الآلةُ f

تصيرُ الدالةُ التربيعيةُ التي فتحتِ الدرسَ ثلاثَ عباراتِ `return`:

```python
def quad(x):
    """يردّ x² − 5x + 6."""
    return x * x - 5 * x + 6

quad(2)    # 0
quad(3)    # 0
quad(1)    # 2
```

القاعدةُ نفسُها بثلاثِ مدخلاتٍ. تصيرُ الصيغةُ $f(x) = x^2 - 5x + 6$ آلةً قابلةً لإعادةِ الاستخدام: تُعرَّف مرةً وتُطبَّق ألفَ مرةٍ، ويتركُ سطرُ التوثيقِ مكتوبًا أيَّ قاعدةٍ تحويها.

## أخطاء شائعة

- **وسائط افتراضية قابلة للتغيير.** تنشئ `def f(items=[])` قائمةً واحدةً مشتركةً بين كل الاستدعاءات — تتكدس العناصر بين الاستدعاءين. اجعل الافتراضي `None` وابنِ القائمة في الداخل.
- **نسيان `return`.** كل دالةٍ بلا عودةٍ تعيد `None`؛ طلبت قيمةً فتنل ظلًّا.
- **وسائط كثيرة جدًّا.** بعد الثالثة أو الرابعة تصير الشقوقُ أُحجيةً. اجمع الوسائط المتقاربة في قاموسٍ أو dataclass.
- **استدعاءُ دالةٍ مُعرَّفةٍ في الأسفل.** ينفّذُ بايثون من الأعلى إلى الأسفل؛ فاستدعاءُ `f()` قبل أن يبلغَ سطرُ `def f` المفسِّرَ يرفعُ `NameError`. عرّفْ ثم استدعِ.

## 🧩 تحديات

<details class="challenge">
<summary>🧩 تحدٍّ — فكّر أولًا ثم أظهر</summary>
<div class="challenge__body">

اكتب `is_palindrome(text)` ترجع `True` إذا كانت السلسلة تُقرأ نفسها من الوجهين؛ تجاهل حالةَ الحروف.

<p class="challenge__answer">💡 <strong>الجواب:</strong> <code>def is_palindrome(text): return text.lower() == text.lower()[::-1]</code> — تحويلُ الحروف الصغيرة يُتماثل المقارنة، والشريحة المعكوسة <code>[::-1]</code> هي الصورةُ المرآتية.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 تحدٍّ — فكّر أولًا ثم أظهر</summary>
<div class="challenge__body">

اكتب `fizzbuzz(n)` ترجع قائمةً من 1 إلى $n$، مستبدلةً مضاعفاتِ الثلاثة بـ `"Fizz"` ومضاعفاتِ الخمسة بـ `"Buzz"` ومضاعفاتِ الاثنين معًا بـ `"FizzBuzz"`.

<p class="challenge__answer">💡 <strong>الجواب:</strong> مضاعفاتُ الاثنين معًا هي مضاعفاتُ $\mathrm{lcm}(3,5) = 15$، فاختبر تلك الحالة أولًا: <code>["FizzBuzz" if i % 15 == 0 else "Fizz" if i % 3 == 0 else "Buzz" if i % 5 == 0 else i for i in range(1, n+1)]</code>.</p>

</div>
</details>

## 🤔 أسئلة سقراطية

- لماذا يجب أن تأتي الوسائط الافتراضية بعد غير الافتراضية؟ وماذا ينهار لو انقلبت القاعدة؟
- ماذا يمنحك `*args` مما لا يمنحه وسيطُ قائمةٍ واحد؟ ومتى تلجأ إلى أحدهما دون الآخر؟
- كيف تقرّر بايثون أيَّ تعريفٍ تطبّق حين يوجدا معًا `def f(x)` و`def f(x, y=5)`؟

## ✅ فحص سريع

<div class="quiz" data-quiz="python-101-functions">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">١. ماذا يرجع هذا؟ <code>def f(x, y=3): return x + y; f(5)</code></p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">5</button>
      <button class="quiz-q__opt" data-idx="1">8</button>
      <button class="quiz-q__opt" data-idx="2">Error</button>
      <button class="quiz-q__opt" data-idx="3">None</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">٢. ما المخرج؟ <code>def f(a, b=[]): b.append(a); return b; print(f(1)); print(f(2))</code></p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">[1] ثم [2]</button>
      <button class="quiz-q__opt" data-idx="1">[1] ثم [1, 2]</button>
      <button class="quiz-q__opt" data-idx="2">[1, 2] ثم [1, 2]</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>