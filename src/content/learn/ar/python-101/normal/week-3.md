---
title: "الأسبوع 3: بنى البيانات"
section: python-101
track: normal
week: 3
description: "الأسبوع 3: بنى البيانات — python-101 (normal track)."
---


# الأسبوع 3: القوائم، القواميس، الصفوف والمجموعات

<span class="gamified-flourish">📦 متغيّر واحد يحمل قيمة واحدة. هذا الأسبوع، متغيّر واحد يحمل مجموعة كاملة.</span>

## 🎯 أهداف التعلّم

بنهاية هذا الأسبوع ستكون قادرًا على:
- تخزين مجموعات مرتبة وقابلة للتغيير في `list`، والوصول إليها بالفهرسة والتقطيع وتعديلها.
- تخزين ارتباطات مفتاح-قيمة في `dict`، وهو نظير بايثون لجدول بحث دالة رياضية.
- شرح متى يكون `tuple` (غير قابل للتغيير) أو `set` (غير مرتب، بلا تكرار) الخيار الأنسب مقارنة بـ `list`.
- كتابة list comprehensions وdict comprehensions لبناء مجموعات جديدة في سطر واحد.
- التعامل مع النصوص كمتتاليات، وتضمين المجموعات داخل بعضها البعض.

## الدرس

### القوائم (Lists): متتاليات مرتبة

`list` هي متتالية مرتبة وقابلة للتغيير — فكّر فيها كمتتالية محدودة $(a_0, a_1, \dots, a_{n-1})$:

```python
scores = [88, 92, 74, 95]
scores[0]        # 88 — الفهرسة تبدأ من 0
scores[-1]       # 95 — الفهارس السالبة تُعد من النهاية
scores[1:3]      # [92, 74] — التقطيع: [البداية، النهاية)
scores.append(100)   # يضيف عنصرًا في النهاية
len(scores)       # 5
```

يتبع التقطيع `scores[1:3]` نفس عُرف نصف المفتوح الذي تستخدمه `range` — نفس فكرة "البداية مضمّنة، النهاية غير مضمّنة" التي استخدمتها الأسبوع الماضي. يقبل التقطيع أيضًا خطوة، `scores[start:stop:step]`، وحذف أحد الحدّين يعني "من البداية" أو "إلى النهاية":

```python
scores[:2]     # [88, 92]         — كل ما قبل الفهرس 2
scores[2:]     # [74, 95, 100]    — كل ما من الفهرس 2 فصاعدًا
scores[::2]    # [88, 74, 100]    — كل عنصر ثانٍ
scores[::-1]   # [100, 95, 74, 92, 88]  — القائمة كاملة، معكوسة
```

القوائم **قابلة للتغيير** — يمكنك تعديلها في مكانها، لا بناء قوائم جديدة فقط:

```python
scores[0] = 90          # استبدال عنصر
scores.insert(1, 100)   # إدراج 100 عند الفهرس 1، مع إزاحة الباقي لليمين
scores.remove(74)        # إزالة أول 74 يُعثر عليه (بالقيمة، لا بالفهرس)
last = scores.pop()       # يزيل العنصر الأخير ويُعيده
scores.sort()              # يرتب في مكانه، تصاعديًا
scores.sort(reverse=True)  # تنازليًا
```

تغيّر `.sort()` القائمة نفسها وتُعيد `None`؛ بينما الدالة المدمجة `sorted(scores)` تُعيد قائمة *جديدة* مرتبة وتترك الأصلية دون تغيير — استخدم `sorted()` عندما تحتاج للاحتفاظ بالترتيب الأصلي أيضًا.

**List comprehensions** هي الصياغة البايثونية لترميز بناء المجموعات. قارن $\{x^2 : x \in \{1,\dots,5\}\}$ بـ:

```python
squares = [x**2 for x in range(1, 6)]   # [1, 4, 9, 16, 25]
```

إضافة شرط تعكس $\{x \in S : P(x)\}$:

```python
evens = [x for x in range(20) if x % 2 == 0]
```

يمكن لـ comprehension أن تُحوّل *وتُصفّي* في آنٍ واحد — التعبير قبل `for` لا يجب أن يكون متغيّر الحلقة دون تغيير:

```python
passing_doubled = [s * 2 for s in scores if s >= 60]
```

### النصوص كمتتاليات

يتصرف `str` كمتتالية أيضًا — الفهرسة، والتقطيع، و`len()` كلها تعمل بنفس طريقة عملها مع `list`، لأن النص هو في الحقيقة متتالية ثابتة من الأحرف:

```python
name = "Amina"
name[0]      # "A"
name[-1]     # "a"
name[1:3]    # "mi"
len(name)    # 5
```

الفرق الوحيد: النصوص **غير قابلة للتغيير** — `name[0] = "B"` تُطلق `TypeError`. لـ"تغيير" نص، تبني نصًا جديدًا، غالبًا بدالة: `name.upper()`، `name.lower()`، `name.strip()` (تزيل المسافات المحيطة)، `name.replace("A", "B")`، أو `name.split(",")` (تُقسّم إلى `list` من الأجزاء — الأداة التي سيستخدمها الأسبوع 5 من المسار العادي لتحليل صفوف ملف CSV يدويًا). لا تُغيّر أي من هذه الدوال `name` نفسه؛ كل منها يُعيد نصًا (أو قائمة) جديدة.

### القواميس (Dicts): ارتباطات مفتاح-قيمة

يربط `dict` مفاتيح بقيم، مثل دالة $f: K \to V$ معرّفة فقط على مجال محدود:

```python
ages = {"amina": 21, "youssef": 23}
ages["amina"]          # 21
ages["sara"] = 19       # يضيف مفتاحًا جديدًا
"sara" in ages          # True — اختبار الانتماء
for name, age in ages.items():
    print(name, "is", age)
```

البحث عن مفتاح غير موجود بـ `ages["missing"]` يُطلق `KeyError` — استخدم `.get("missing", default)` عندما يُحتمل ألا يكون المفتاح موجودًا. بعض عمليات القواميس الأخرى التي ستستخدمها باستمرار:

```python
ages.keys()      # عرض لكل المفاتيح: dict_keys(['amina', 'youssef', 'sara'])
ages.values()     # عرض لكل القيم: dict_values([21, 23, 19])
del ages["sara"]   # يزيل مفتاحًا تمامًا
ages.update({"karim": 25, "amina": 22})   # يضيف/يستبدل عدة مفاتيح دفعة واحدة
```

**Dict comprehensions** تعكس list comprehensions، لكنها تبني `dict` بدلًا من `list`:

```python
name_lengths = {name: len(name) for name in ages}
# {'amina': 5, 'youssef': 7, 'karim': 5}
```

### الصفوف (Tuples): متتاليات ثابتة الشكل وغير قابلة للتغيير

يبدو `tuple` مثل قائمة لكن لا يمكن تغييره بعد إنشائه — مفيد للقيم التي تكون طبيعيًا مجموعة ثابتة، مثل زوج إحداثيات:

```python
point = (3, 4)
x, y = point            # فك التغليف (unpacking)
```

بما أن الصفوف غير قابلة للتغيير، يمكن استخدامها كمفاتيح لقاموس؛ بينما لا يمكن ذلك مع القوائم. هذا يجعل `dict` بمفاتيح من نوع tuple طريقة طبيعية لتمثيل ارتباط *من أزواج من الأشياء*، مثل إحداثية شبكية إلى قيمة:

```python
grid = {(0, 0): "start", (2, 3): "treasure"}
grid[(0, 0)]   # "start"
```

يظهر فك تغليف الصفوف أيضًا باستمرار عند التكرار على `.items()` لقاموس، كما رأيت أعلاه: `for name, age in ages.items():` يفك تغليف كل صف `(name, age)` إلى متغيرين في سطر واحد.

### المجموعات (Sets): تجميعات فريدة وغير مرتبة

`set` هو المكافئ المباشر لمفهوم المجموعة الرياضية في بايثون — بلا ترتيب، بلا تكرار:

```python
a = {1, 2, 3}
b = {2, 3, 4}
a | b   # الاتحاد: {1, 2, 3, 4}
a & b   # التقاطع: {2, 3}
a - b   # الفرق: {1}
```

`{}` الفارغة هي في الحقيقة `dict`، وليست `set` (خصوصية تاريخية في الصياغة) — استخدم `set()` لإنشاء مجموعة فارغة. تحويل `list` إلى `set` والعودة هي الحيلة القياسية لإزالة التكرارات مع الحفاظ (غالبًا) على فكرة "القيم الفريدة فقط":

```python
names = ["amina", "youssef", "amina", "sara"]
unique_names = list(set(names))   # الترتيب غير مضمون مطابقته للأصل
```

### تضمين المجموعات داخل بعضها

يمكن للمجموعات أن تحمل مجموعات أخرى — قائمة من قواميس، قاموس من قوائم، وهكذا — وهذه هي طريقة تمثيل بيانات مُهيكلة فعليًا، مثل عدة طلاب لكل منهم عدة درجات:

```python
students = [
    {"name": "Amina", "scores": [88, 92, 79]},
    {"name": "Youssef", "scores": [74, 68, 81]},
]

for student in students:
    average = sum(student["scores"]) / len(student["scores"])
    print(student["name"], round(average, 1))
```

هذا الشكل بالتحديد — قائمة من قواميس، قاموس واحد لكل سجل — قريب جدًا مما ستحصل عليه عند قراءة ملف CSV في الأسبوع 5، وهو أساسًا نسخة مصغّرة ومبنية يدويًا مما يمثله `DataFrame` في pandas في القسم الثاني.

## ⚠️ أخطاء شائعة

- **الخلط بين `.sort()` و`sorted()`.** تُغيّر `scores.sort()` القائمة وتُعيد `None` — فتصبح `x = scores.sort()` بقيمة `None`، وهو مصدر شائع للحيرة. استخدم `sorted(scores)` إن احتجت النتيجة كقيمة.
- **تعديل قائمة أثناء التكرار عليها.** إزالة عناصر من قائمة داخل حلقة `for item in my_list:` تتخطى عناصر، لأن الفهارس تتغير تحتك أثناء التكرار. كرّر على نسخة (`for item in my_list[:]:`) أو ابنِ قائمة جديدة بدلًا من ذلك.
- **نسيان أن مفاتيح `dict` يجب أن تكون غير قابلة للتغيير.** `grid[[0, 0]] = "x"` تُطلق `TypeError: unhashable type: 'list'` — استخدم صفًا `(0, 0)` بدلًا من ذلك.
- **افتراض أن `set`/`dict` تحافظ على ترتيب الإدراج كما تتوقع من الرياضيات.** قواميس بايثون الحديثة *تحافظ فعليًا* على ترتيب الإدراج كتفصيل تنفيذي، لكن المجموعات لا تضمن أي ترتيب معين — لا تعتمد أبدًا على الترتيب الذي تحصل عليه من `set`.

## 🧩 تحديات

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

بمعطى `grades = [55, 72, 88, 40, 91, 60]`، اكتب list comprehension في سطر واحد تُنتج فقط الدرجات الناجحة (≥ 60).

<p class="challenge__answer">💡 <strong>Answer:</strong> [grade for grade in grades if grade &gt;= 60] — list comprehension تُصفّي بشرط، وهي الصيغة البرمجية لـ {'{'}g ∈ grades : g ≥ 60{'}'}.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

بمعطى قائمة كلمات، ابنِ `dict` يربط كل كلمة فريدة بعدد مرات ظهورها ("عدّاد تكرار الكلمات").

<p class="challenge__answer">💡 <strong>Answer:</strong> كرّر على الكلمات، ولكل واحدة نفّذ <code>counts[word] = counts.get(word, 0) + 1</code> — هذا جدول تكرار، نفس البنية التي يبني عليها المسار الصعب في الأسبوع 2.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

لديك قائمتان من أسماء الطلاب، `roster_a` و`roster_b`. جِد الطلاب الموجودين في `roster_a` لكن *ليس* في `roster_b`، دون كتابة حلقة يدوية.

<p class="challenge__answer">💡 <strong>Answer:</strong> حوّل كلتا القائمتين إلى مجموعات واستخدم فرق المجموعات: <code>set(roster_a) - set(roster_b)</code> يُعطي الطلاب الموجودين في A وليس B.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

هل ستخزّن إحداثية ثنائية الأبعاد `(x, y)` كـ `list` أم `tuple`؟ برّر اختيارك باستخدام ما يميّز كل نوع.

<p class="challenge__answer">💡 <strong>Answer:</strong> الصفوف (Tuples) هي الخيار الصحيح: زوج إحداثيات لا ينبغي تعديله في مكانه، وشكله الثابت ذو العنصرين يناسب طبيعة tuple الثابتة الشكل أفضل من list، التي تعني ضمنيًا "متتالية قابلة للنمو".</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

بمعطى قائمة أسماء، اكتب dict comprehension تربط كل اسم بطول ذلك الاسم.

<p class="challenge__answer">💡 <strong>Answer:</strong> {"{name: len(name) for name in ['Amina', 'Karim', 'Sara']}"} — dict comprehension تربط كل اسم بطوله، مثل {"{'Amina': 5, 'Karim': 5, 'Sara': 4}"}.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

باستخدام قائمة قواميس `students` من المثال التطبيقي، جِد اسم الطالب صاحب *أعلى* معدل درجات، دون كتابة اسمه مباشرة في الكود.

<p class="challenge__answer">💡 <strong>Answer:</strong> كرّر على قائمة قواميس الطلاب، ولكل واحد احسب <code>sum(student["scores"]) / len(student["scores"])</code>، ثم استخدم <code>max(...)</code> مع دالة <code>key</code> (أو تتبّع الأفضل يدويًا) لإيجاد الطالب صاحب أعلى معدل.</p>

</div>
</details>

## 🤔 أسئلة سقراطية

- `list1 = [1, 2, 3]; list2 = list1; list2.append(4)`. ما قيمة `list1` الآن؟ لماذا يختلف هذا عمّا قد تتوقعه من نقاش الأسبوع 1 حول "الأسماء تشير إلى قيم" مع الأرقام العادية؟
- لماذا لا يمكن استخدام `list` كمفتاح قاموس، بينما يمكن استخدام `tuple`؟ ما الخاصية التي يحتاجها `dict` فعليًا في المفتاح؟
- `{1, 2, 2, 3}` — بماذا تُقيَّم هذه، ولماذا يجعل ذلك `set` أداة طبيعية لـ"إزالة التكرارات من هذه القائمة"؟
- يمكن لـ`list` من `dict` (مثل `students` أعلاه) و`dict` من `list` (مثل `{"Amina": [88, 92, 79], "Youssef": [74, 68, 81]}`) أن يمثّلا معلومات متشابهة جدًا. ما سؤال واحد يمكنك الإجابة عليه بسهولة بشكل واحد لكن بصعوبة بالآخر؟
- النصوص غير قابلة للتغيير لكن القوائم قابلة للتغيير، رغم أن كليهما يدعم الفهرسة والتقطيع بنفس الطريقة. ما الفرق العملي الذي يُحدثه ذلك في أول مرة تحاول فيها "تعديل" نص في مكانه مقابل قائمة؟

## ✅ اختبار الأسبوع

<div class="quiz" data-quiz="python-101-normal-week-3">
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">1. ماذا تُعيد scores[1:3] عندما تكون scores = [10, 20, 30, 40, 50]؟</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">[10, 20]</button>
        <button class="quiz-q__opt" data-idx="1">[20, 30]</button>
        <button class="quiz-q__opt" data-idx="2">[20, 30, 40]</button>
        <button class="quiz-q__opt" data-idx="3">[10, 20, 30]</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="2">
        <p class="quiz-q__prompt">2. أي نوع مجموعة لا يمكن أن يحتوي على قيم مكررة؟</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">list</button>
        <button class="quiz-q__opt" data-idx="1">tuple</button>
        <button class="quiz-q__opt" data-idx="2">set</button>
        <button class="quiz-q__opt" data-idx="3">قيم dict</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">3. ما الطريقة الأكثر أمانًا للبحث عن مفتاح قد لا يكون موجودًا في dict؟</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">d[key]</button>
        <button class="quiz-q__opt" data-idx="1">d.get(key, default)</button>
        <button class="quiz-q__opt" data-idx="2">d.find(key)</button>
        <button class="quiz-q__opt" data-idx="3">key in d[...]</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="3">
        <p class="quiz-q__prompt">4. أي نوع غير قابل للتغيير (لا يمكن تعديله بعد الإنشاء)؟</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">list</button>
        <button class="quiz-q__opt" data-idx="1">dict</button>
        <button class="quiz-q__opt" data-idx="2">set</button>
        <button class="quiz-q__opt" data-idx="3">tuple</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">5. ماذا تُعيد scores.sort()؟</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">القائمة المرتبة</button>
        <button class="quiz-q__opt" data-idx="1">None (تُرتّب في مكانها)</button>
        <button class="quiz-q__opt" data-idx="2">قائمة جديدة مرتبة، والأصلية دون تغيير</button>
        <button class="quiz-q__opt" data-idx="3">عدد العناصر المرتبة</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <p class="quiz__summary" data-quiz-summary hidden></p>
    </div>

