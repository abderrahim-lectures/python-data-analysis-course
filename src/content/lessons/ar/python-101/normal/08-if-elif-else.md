---
title: "If / Elif / Else"
description: "فرّع كودك بناءً على الشروط — أساس اتخاذ القرار في بايثون."
module: "control-flow"
order: 8
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "كتابة كتل if/elif/else لتفريع المنطق"
  - "استخدام عوامل المقارنة والعوامل المنطقية في الشروط"
  - "فهم القيم الصادقة والكاذبة في بايثون"
  - "كتابة شروط متداخلة عند الحاجة"
prerequisites: ["07-boolean-operators"]
tags: ["if", "elif", "else", "conditionals", "truthiness"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## من الشرط إلى القرار

الحسابُ يُقيّم، والمقارنةُ تقرّر، لكن البرنامجَ الذي يقيّم فقط يجري خطًّا مستقيمًا من أعلى إلى أسفل. والحياة ليست خطًّا مستقيمًا. الدرجةُ بالأحرف *دالةٌ متعددة التعريف*: تتغير صيغتُها عند عتباتٍ معينة. في الرياضيات تكتب

$$
\mathrm{grade}(s) =
\begin{cases}
A & s \geq 90,\\
B & s \geq 80,\\
C & s \geq 70,\\
F & \text{وإلّا}.
\end{cases}
$$

و`if`/`elif`/`else` في بايثون هي نسخُ الدالةِ متعددةِ التعريف. كل قطعةٍ تحرس مداها، وتنطلق قطعةٌ واحدةٌ حصرًا.

## الشوكة المفردة

أنحف فرعٍ ينفّذ جسمه فقط حين تكون الشرط `True`:

```python
score = 85
if score >= 60:
    print("Passing!")
```

تبدأ الجملة بـ `if` ثم الشرط ثم علامةَ النقطتين — النقطتان هما ما يخبر بايثون أن كتلةً قادمة. كل ما تحته مسافةٌ بادئة ينتمي إلى ذلك الفرع ويُشغَّل فقط إن تحقق الشرط.

## الشوكة الثنائية

يلتقط `else` كلَّ ما لم يصيبه `if`:

```python
score = 45
if score >= 60:
    print("Passing!")
else:
    print("Needs more work")
```

الفرع الثنائي قسمةٌ للنتائج: الشرط يقسّم فضاء القيم إلى نصفين، وكل حالةٍ تهبط في واحدٍ بالضبط.

## الشوكة المتعددة: elif

الدوال متعددة التعريف الحقيقية لها أكثر من قطعتين. يضيف `elif` — وهو اختصارٌ لـ «else if» — شروطًا لاحقةً تُفحص بالترتيب وتتوقف عند أولِ صادقٍ منها:

```python
score = 78
if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
else:
    grade = "F"
print(grade)  # B
```

لاحظ الاقتصاد: كل شرطٍ من `elif` يحتاج حدًّا أدنى فقط، لأن الحالات التي فوقه حُسمت مسبقًا. مع $s = 85$ تفشل القطعة الأولى وتنجح الثانية — ولا تُشغَّل الفروع التالية أبدًا. وحده فرعٌ واحدٌ يستطيع الانطلاق، وهذا ما يجعله دالةً حقيقية.

## الصدقية: قيمٌ في موقع الشروط

الشرطُ بعد `if` لا يلزم أن يكون مقارنة. تسأل بايثون: *«هل هذه القيمة صادقة أم زائفة؟»* — والجواب موحّد:

```python
# كل هذه زائفة (falsy) — تتصرف كـ False في الشرط:
bool(0)       # False
bool(0.0)     # False
bool("")      # False
bool([])      # False
bool(None)    # False

# كلُّ ما سواها صادق (truthy) — يتصرف كـ True:
bool(1)       # True
bool("hello") # True
bool([1, 2])  # True
```

مجموعة القيم الزائفة صغيرةٌ عمدًا: الصفر، والنص الفارغ، والحاويات الفارغة، و`None`. وكلُّ ما سوى ذلك يُعدّ. يشتري ذلك شروطًا مقتضبة تُقرأ كفحصٍ بلغةٍ طبيعية:

```python
name = ""
if not name:
    print("Name is empty")

items = [1, 2, 3]
if items:
    print("We have items")
```

السلسلة الفارغة زائفة، فإذاً `not name` يساوي `True`؛ والقائمة غير الفارغة صادقة، فينطلق `if items`. توفّر على نفسك `== ""` و`!= []` الصريحين — الفحص هو الفراغ نفسه.

## التداخل: حين يعتمد سؤالٌ على سؤال

بعض القرارات متتابعة: *أولًا*، هل بلغتَ سن الرشد؟ *ثم*، هل تحمل بطاقةَ هوية؟ هذا تداخل:

```python
age = 25
has_id = True

if age >= 21:
    if has_id:
        print("Entry allowed")
    else:
        print("Need ID")
else:
    print("Too young")
```

التداخلُ يعمل، لكن كل مستوى يضاعف المسارات التي يجب على القارئ أن يمسكها في رأسه. سلاسل `elif` المسطحة تُقرأ كالدالة متعددة التعريف نفسها؛ ابدأ بها واحتفظ بالتداخل للأسئلة المتعلقة فعلًا.

## مثالٌ محلول: المنظِّمُ الحراري

المنظِّمُ الحراريُّ دالةٌ متعددةُ القطعِ بثلاثِ قطعٍ. تنسخُها السلسلةُ مباشرةً:

```python
temperature = 22

if temperature <= 10:
    state = "heating"
elif temperature >= 30:
    state = "cooling"
else:
    state = "steady"
print(state)  # steady
```

يُقرأ كالصيغةِ التي هو. وترتيبُ القطعِ مهمٌّ: يفترضُ كلُّ `elif` أن ما فوقهُ فشل، فلا يُطلق إلا فرعٌ واحدٌ، ولا يُطبع إلا حالةٌ واحدةٌ.

## أخطاء شائعة

- **نسيان النقطتين** بعد `if` أو `elif` أو `else` — فبدونها لا يبدأ الفرع أبدًا.
- **`=` بدل `==`.** جملة `if score = 60` خطأ قواعدي، عن قصد.
- **الإفراط في التداخل** حين تكون سلسلة `elif` (أو عودةٌ مبكرة) هي ما يوضح شكلَ الدالة من نظرةٍ واحدة.
- **يفوز أولُ `True` لا الأكثرُ تخصيصًا.** في `if x > 5: ... elif x > 3: ...`، يلجُّ `x = 4` الفرعَ الثانيَ فقط إذا كان الأولُ قد فشل فعلًا — ويقعُ ما دون 3 في `else`. فترتيبُ القطعِ من الأضيقِ إلى الأوسعِ ما يُبقي الصيغةَ صحيحةً.

## 🧩 تحديات

<details class="challenge">
<summary>🧩 تحدٍّ — فكّر أولًا ثم أظهر</summary>
<div class="challenge__body">

اكتب `classify_temp(temp)` ترجع `"freezing"` تحت $0$، و`"cold"` في $[0,15)$، و`"warm"` في $[15,30)$، و`"hot"` من 30 فصاعدًا.

<p class="challenge__answer">💡 <strong>الجواب:</strong> سلسلة <code>elif</code>، مستغلًّا أن كل فحصٍ لاحقٍ يفترض أن ما قبله فشل: <code>if temp &lt; 0: return "freezing" elif temp &lt; 15: return "cold" elif temp &lt; 30: return "warm" else: return "hot"</code>.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 تحدٍّ — فكّر أولًا ثم أظهر</summary>
<div class="challenge__body">

مع `text = "Hello, World!"`، اطبع `"uppercase"` إذا كان النص كله حروفًا كبيرة، و`"lowercase"` إذا كان كله صغيرة، و`"mixed"` وإلّا.

<p class="challenge__answer">💡 <strong>الجواب:</strong> <code>if text.isupper(): print("uppercase") elif text.islower(): print("lowercase") else: print("mixed")</code> — مجموعة الشروط كلُّها تشكّل قسمةً كاملة.</p>

</div>
</details>

## 🤔 أسئلة سقراطية

- لماذا `elif` دون `else if`؟ وماذا تصنع بايثون بالكلمتين إذا ظهرتا متجاورتين؟
- مع $s = 85$، كم شرطًا تقيّم سلسلة الدرجات قبل الدخول إلى فرع؟ (تلميح: أيُّ قطعةٍ تفشل وأيُّها تنطلق؟)
- ما الفرق بين `if x:` و`if x is not None:`؟ ومتى يهمّ كلٌّ منهما؟

## ✅ فحص سريع

<div class="quiz" data-quiz="python-101-control-flow">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">١. ماذا يطبع هذا؟ <code>x = 0; if x: print("yes") else: print("no")</code></p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">yes</button>
      <button class="quiz-q__opt" data-idx="1">Error</button>
      <button class="quiz-q__opt" data-idx="2">no</button>
      <button class="quiz-q__opt" data-idx="3">None</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">٢. أيُّ شرطٍ يُفحص أولًا؟ <code>if x > 5: ... elif x > 10: ... elif x > 3: ...</code></p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">x > 10</button>
      <button class="quiz-q__opt" data-idx="1">x > 5</button>
      <button class="quiz-q__opt" data-idx="2">x > 3</button>
      <button class="quiz-q__opt" data-idx="3">تجرى بالتوازي</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>