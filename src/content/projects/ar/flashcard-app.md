---
title: "تطبيق البطاقات التعليمية"
description: "نظام بطاقات تعليمية مع تكرار متباعد يُحسّن توقيت المراجعة لأقصى احتفاظ بالمعلومات."
difficulty: "beginner"
estimatedMinutes: 40
xpReward: 50
tags: ["cli", "json", "spaced-repetition", "file-io"]
prerequisites: ["أساسيات Python (المتغيرات، الحلقات، الدوال، القواميس)", "أساسيات الإدخال/الإخراج مع الملفات"]
---

# تطبيق البطاقات التعليمية

ابنِ تطبيق بطاقات تعليمية طرفيًا يستخدم خوارزمية التكرار المتباعد SM-2 لجدولة المراجعات على فترات مثالية علميًا. ستتعلم تمثيل البيانات بالقواميس، وتنفيذ حلقة دراسة مع تفاعل المستخدم، وتطبيق خوارزمية تتكيف مع أدائك، وحفظ كل شيء إلى JSON بحيث ينجو تقدمك عبر الجلسات.

## ما الذي ستتعلمه

1. تمثيل البيانات بالقواميس والقوائم
2. تنفيذ جلسة دراسة مع تفاعل المستخدم
3. تطبيق خوارزمية التكرار المتباعد SM-2
4. تتبع تقدم التعلم بالإحصائيات
5. حفظ البيانات إلى ملفات JSON

## ما الذي ستبنيه

تطبيق بطاقات تعليمية طرفيًا يقوم بما يلي:
- يخزّن بطاقات ذات محتوى أمامي/خلفي ووسوم
- يشغّل جلسات دراسة مع تقليب لإظهار الإجابة
- يستخدم التكرار المتباعد لجدولة المراجعات
- يتتبع الإتقان والدقة عبر الزمن
- يحفظ التقدم بين الجلسات

## أين تُشغّل هذا

- **محليًا باستخدام `uv` (موصى به).** يستخدم هذا المشروع المكتبة القياسية فقط، فيعمل في أي مكان يعمل فيه Python. قسم الإعداد أدناه يشرح ذلك.
- **Google Colab أو Kaggle Notebooks.** الصق خلايا الكود مباشرة في دفتر. تعمل استدعاءات `input()` لمطالبات الدراسة، لكن الإدخال/الإخراج مع الملفات (الخطوة 6) يعمل بشكل مختلف في المتصفح.
- **ملعب JupyterLite.** الصق خلايا الكود مباشرة في دفتر — لاحظ أن حفظ الملفات (الخطوة 6) يعمل محليًا فقط.

- **شغّله في المتصفح.** هناك دفتر ملاحظات تفاعلي جاهز — افتحه على Colab أو Kaggle أو Binder وتابع خطوة بخطوة.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/flashcard-app/notebook.ar.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/flashcard-app/notebook.ar.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fflashcard-app%2Fnotebook.ar.ipynb)

## الإعداد

```bash
uv init flashcard-app
cd flashcard-app
```

## الخطوة 1: عرّف نموذج البيانات

قبل بناء أي ميزات، قرر كيف تعيش بطاقة تعليمية في الذاكرة. كل بطاقة قاموس بحقول لمحتواها وبياناتها الوصفية وحالة التكرار المتباعد. وقائمة تحمل كل البطاقات في مجموعة. هذا الهيكل المسطّح يُبقي الأمور بسيطة — لا حاجة لصفوف بعد.

### 1.1 أنشئ بنية البطاقة

**👟 تلميح البداية :** كل بطاقة تحتاج `front` و`back` و`tags` وحقول SM-2: `interval` (أيام حتى المراجعة التالية) و`ease_factor` (مدى سرعة نمو الفترات) و`repetitions` (مراجعات صحيحة متتالية) و`next_review` (متى تعرضها مرة أخرى). استخدم `datetime.now().isoformat()` للطوابع الزمنية.

```python
from datetime import datetime, timedelta

def create_card(front: str, back: str, tags: list[str] | None = None) -> dict:
    return {
        "front": front,
        "back": back,
        "tags": tags or [],
        "interval": 1,
        "ease_factor": 2.5,
        "repetitions": 0,
        "next_review": datetime.now().isoformat(),
        "created_at": datetime.now().isoformat(),
    }
```

**🎯 الناتج المتوقع :** ترجع `create_card("What is Python?", "A programming language")` قاموسًا بكل الحقول:

```python
>>> card = create_card("What is Python?", "A programming language")
>>> card["front"]
'What is Python?'
>>> card["back"]
'A programming language'
>>> card["interval"]
1
>>> card["ease_factor"]
2.5
>>> card["tags"]
[]
```

**🩹 إذا لم يعمل :** إذا حصلت على `TypeError`، فتأكد أن `datetime.now().isoformat()` تُستدعى مع الأقواس — `datetime.now().isoformat()` صحيحة، و`datetime.now.isoformat` (بدون أقواس) تشير إلى الدالة دون استدعائها. إذا أصبحت الوسوم افتراضية لقائمة قابلة للتشارك قابلة للتغيير، فأنت استخدمت `tags or []` بشكل خاطئ — تأكد أن `or` داخل جسم الدالة، لا في الوسيطة الافتراضية.

### 1.2 أنشئ بنية المجموعة

**👟 تلميح البداية :** المجموعة قاموس له `name` وقائمة `cards`. ابدأ بقائمة فارغة.

```python
def create_deck(name: str) -> dict:
    return {
        "name": name,
        "cards": [],
        "created_at": datetime.now().isoformat(),
    }
```

**🎯 الناتج المتوقع :**

```python
>>> deck = create_deck("Python Basics")
>>> deck["name"]
'Python Basics'
>>> len(deck["cards"])
0
```

**🩹 إذا لم يعمل :** إذا كان `deck["cards"]` قيمته `None` بدلًا من `[]`، فنسيت تضمين المفتاح `"cards"` في قاموس الإرجاع.

### 1.3 أضف بطاقات إلى مجموعة

**👟 تلميح البداية :** ألحق بطاقة بقائمة `cards` الخاصة بالمجموعة. اطبع رسالة تأكيد.

```python
def add_card(deck: dict, front: str, back: str, tags: list[str] | None = None) -> None:
    card = create_card(front, back, tags)
    deck["cards"].append(card)
    print(f"Added: {front}")
```

**🎯 الناتج المتوقع :**

```python
>>> deck = create_deck("Python Basics")
>>> add_card(deck, "What is Python?", "A programming language")
Added: What is Python?
>>> add_card(deck, "What is a list?", "An ordered mutable collection", tags=["data structures"])
Added: What is a list?
>>> len(deck["cards"])
2
```

**🩹 إذا لم يعمل :** إذا لم تظهر البطاقة في المجموعة، فتحقق أنك تلحق بـ `deck["cards"]`، لا بمتغير محلي. إذا شاركت بطاقتان البيانات نفسها، فأنت تعيد استخدام مرجع نفس القاموس — تأكد أن `create_card` ترجع قاموسًا جديدًا في كل مرة.

### 1.4 تحقّق من نموذج البيانات

**✅ قائمة التحقق**

- ✅ ترجع `create_card` قاموسًا بـ `front` و`back` و`tags` و`interval` و`ease_factor` و`repetitions` و`next_review` و`created_at`.
- ✅ الوسوم الافتراضية قائمة فارغة `[]` إذا لم تُقدَّم.
- ✅ `next_review` مضبوط على الوقت الحالي كسلسلة ISO.
- ✅ ترجع `create_deck` قاموسًا بـ `name` وقائمة `cards` فارغة.
- ✅ تنشئ `add_card` بطاقة وتلحقها بالمجموعة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

لماذا تخزين `next_review` كسلسلة ISO بدلًا من كائن datetime؟ ما المفاضلة التي تفرضها عملية تسلسل JSON — وما الذي ستخسره لو خزنت طابعًا زمنيًا unix بدلًا منها؟

---

## الخطوة 2: أنشئ البطاقات واعرضها

مع اكتمال نموذج البيانات، لنبنِ دوالًا لملء مجموعة وعرض محتوياتها. هذا هو الأساس لكل ما يلي.

### 2.1 ابنِ مجموعة نموذجية

**👟 تلميح البداية :** أنشئ مجموعة بـ5–6 بطاقات تغطي موضوعات مختلفة. استخدم وسومًا متنوعة بحيث يعمل التصفية لاحقًا.

```python
def build_sample_deck() -> dict:
    deck = create_deck("Python Basics")
    cards = [
        ("What is Python?", "A high-level interpreted programming language", ["fundamentals"]),
        ("What is a list?", "An ordered mutable collection", ["data structures"]),
        ("What does `len()` return?", "The number of items in a collection", ["functions"]),
        ("What is a dictionary?", "A collection of key-value pairs", ["data structures"]),
        ("What is a string?", "An immutable sequence of characters", ["data structures"]),
        ("What is a function?", "A reusable block of code that performs a task", ["fundamentals"]),
    ]
    for front, back, tags in cards:
        add_card(deck, front, back, tags)
    return deck
```

**🎯 الناتج المتوقع :**

```python
>>> deck = build_sample_deck()
Added: What is Python?
Added: What is a list?
Added: What does `len()` return?
Added: What is a dictionary?
Added: What is a string?
Added: What is a function?
>>> len(deck["cards"])
6
```

### 2.2 اعرض كل البطاقات

**👟 تلميح البداية :** مرّر فوق `deck["cards"]` واطبع وجه كل بطاقة وظهرها ووسومها. رقّم البطاقات لسهولة الرجوع إليها.

```python
def list_cards(deck: dict) -> None:
    if not deck["cards"]:
        print("No cards in this deck.")
        return
    print(f"\n{'='*50}")
    print(f"  {deck['name']} ({len(deck['cards'])} cards)")
    print(f"{'='*50}")
    for i, card in enumerate(deck["cards"], 1):
        tags = ", ".join(card["tags"]) if card["tags"] else "no tags"
        print(f"  {i}. {card['front']}")
        print(f"     -> {card['back']}  [{tags}]")
    print(f"{'='*50}")
```

**🎯 الناتج المتوقع :**

```
==================================================
  Python Basics (6 cards)
==================================================
  1. What is Python?
     -> A high-level interpreted programming language  [fundamentals]
  2. What is a list?
     -> An ordered mutable collection  [data structures]
  3. What does `len()` return?
     -> The number of items in a collection  [functions]
  4. What is a dictionary?
     -> A collection of key-value pairs  [data structures]
  5. What is a string?
     -> An immutable sequence of characters  [data structures]
  6. What is a function?
     -> A reusable block of code that performs a task  [fundamentals]
==================================================
```

**🩹 إذا لم يعمل :** إذا ظهرت الوسوم كـ `['data structures']` بدلًا من `data structures`، فنسيت ضمها بـ `", ".join(...)`. إذا كان العدد خاطئًا، فتحقق أن `enumerate` يبدأ من 1، لا من 0.

### 2.3 تحقّق من العرض

**✅ قائمة التحقق**

- ✅ تنشئ `build_sample_deck` مجموعة بـ6 بطاقات بالضبط.
- ✅ تطبع `list_cards` وجه كل بطاقة وظهرها ووسومها.
- ✅ المجموعات الفارغة تطبع "No cards in this deck." دون انهيار.
- ✅ تُعرض الوسوم كسلاسل مفصولة بفواصل، لا قوائم خام.

**🤔 سؤال (أسئلة) سقراطي(ة)**

لماذا تخزين المجموعة كقاموس عادي بدلًا من صف له دوال؟ ماذا تكسب بإبقاء بنية البيانات بسيطة في هذه المرحلة؟

---

## الخطوة 3: وضع الدراسة

الآن الجزء الممتع: جلسة دراسة تقلب فيها البطاقات، وتكشف الإجابة، وتقيّم مدى معرفتك بها. يدخل تقييم الجودة الذي تعطيه مباشرةً إلى خوارزمية SM-2 في الخطوة التالية.

### 3.1 اكتب حلقة جلسة الدراسة

**👟 تلميح البداية :** صفِّ البطاقات إلى المستحقة للمراجعة (`next_review <= now`). لكل بطاقة، اعرض الوجه، وانتظر ضغط المستخدم على Enter، ثم اعرض الظهر. بعد الكشف، اطلب تقييم جودة (0–5). اجمع التقييمات وأعدها.

```python
from datetime import datetime

def get_due_cards(deck: dict) -> list[dict]:
    now = datetime.now()
    due = []
    for card in deck["cards"]:
        next_review = datetime.fromisoformat(card["next_review"])
        if next_review <= now:
            due.append(card)
    return due

def study_session(deck: dict) -> list[dict]:
    due = get_due_cards(deck)
    if not due:
        print("\nNo cards due for review! Great job.")
        return []

    print(f"\n{'='*50}")
    print(f"  STUDY SESSION — {len(due)} card(s) due")
    print(f"{'='*50}")

    results = []
    for i, card in enumerate(due, 1):
        print(f"\n  Card {i}/{len(due)}")
        print(f"  Front: {card['front']}")
        input("  Press Enter to reveal the answer...")
        print(f"  Back:  {card['back']}")

        quality = get_quality_rating()
        results.append({"card": card, "quality": quality})
        print(f"  Rated: {quality}/5")

    print(f"\n  Session complete! Reviewed {len(results)} card(s).")
    return results
```

**🎯 الناتج المتوقع :** عند تشغيل `study_session(deck)` مع بطاقات مستحقة، سترى وجه كل بطاقة، فتضغط Enter، ترى الظهر، ثم تكتب تقييمًا. تُتخطَّى البطاقات غير المستحقة بعد.

### 3.2 احصل على تقييم الجودة من المستخدم

**👟 تلميح البداية :** اطلب من المستخدم تقييمًا من 0 إلى 5. تحقق من الإدخال — ارفض أي شيء ليس رقمًا داخل النطاق. وأعد المطالبة على إدخال سيئ.

```python
def get_quality_rating() -> int:
    print("  How well did you know it?")
    print("  0 - Complete blank")
    print("  1 - Wrong, but recognized when shown")
    print("  2 - Wrong, but it was close")
    print("  3 - Correct with serious difficulty")
    print("  4 - Correct with hesitation")
    print("  5 - Perfect, instant recall")
    while True:
        try:
            rating = int(input("  Rating (0-5): ").strip())
            if 0 <= rating <= 5:
                return rating
            print("  Please enter a number between 0 and 5.")
        except ValueError:
            print("  Please enter a valid number.")
```

**🎯 الناتج المتوقع :**

```
  How well did you know it?
  0 - Complete blank
  1 - Wrong, but recognized when shown
  2 - Wrong, but it was close
  3 - Correct with serious difficulty
  4 - Correct with hesitation
  5 - Perfect, instant recall
  Rating (0-5): 4
```

**🩹 إذا لم يعمل :** إذا لم تخرج الحلقة أبدًا، فأنت لا ترجع من داخل `while True` — تأكد أن `return rating` داخل كتلة `if 0 <= rating <= 5`. إذا انهار برنامجك عند إدخال "abc"، فنسيت `try/except ValueError`.

### 3.3 تحقّق من وضع الدراسة

**✅ قائمة التحقق**

- ✅ ترجع `get_due_cards` البطاقات التي يكون فيها `next_review` في الماضي فقط.
- ✅ تعرض `study_session` الوجه وتنتظر Enter ثم تكشف الظهر.
- ✅ ترفض `get_quality_rating` الإدخال خارج 0–5 وتعيد المطالبة.
- ✅ تطبع الجلسة ملخصًا عند الاكتمال.
- ✅ قائمة المستحقة الفارغة تطبع "No cards due for review!" دون انهيار.

**🤔 سؤال (أسئلة) سقراطي(ة)**

لماذا يضغط المستخدم Enter لكشف الإجابة بدلًا من ظهورها فورًا؟ كيف يحسّن الفعل البدني للاسترجاع قبل رؤية الإجابة الاحتفاظ؟

---

## الخطوة 4: التكرار المتباعد (SM-2)

خوارزمية SM-2 هي المحرك الذي يجعل هذا أكثر من مجرد تطبيق بطاقات بسيط. تضبط الفترة وعامل السهولة بعد كل مراجعة بناءً على مدى معرفتك بالإجابة. البطاقات التي تعاني معها تعود أسرع؛ والبطاقات التي تعرفها جيدًا تُدفع أبعد إلى المستقبل.

### 4.1 نفّذ تحديث SM-2

**👟 تلميح البداية :** تعدّل الخوارزمية ثلاثة حقول على البطاقة: `repetitions` و`interval` و`ease_factor`. إذا كانت الجودة >= 3 (صحيحة)، فزد التكرارات وانمِ الفترة. إذا كانت الجودة < 3 (نسيت)، فأعد التكرارات إلى 0 وأعد الفترة إلى 1. يتعدل عامل السهولة بناءً على الجودة — يرتفع للإجابات السهلة وينخفض للصعبة.

```python
def update_card_sm2(card: dict, quality: int) -> dict:
    if quality >= 3:
        if card["repetitions"] == 0:
            card["interval"] = 1
        elif card["repetitions"] == 1:
            card["interval"] = 6
        else:
            card["interval"] = round(card["interval"] * card["ease_factor"])
        card["repetitions"] += 1
    else:
        card["repetitions"] = 0
        card["interval"] = 1

    card["ease_factor"] = max(
        1.3,
        card["ease_factor"] + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02),
    )

    card["next_review"] = (
        datetime.now() + timedelta(days=card["interval"])
    ).isoformat()

    return card
```

**🎯 الناتج المتوقع :** اختبار الخوارزمية على بطاقة عبر عدة مراجعات:

```python
>>> card = create_card("Test", "Answer")
>>> # First review — correct (quality 4)
>>> update_card_sm2(card, 4)
>>> card["repetitions"]
1
>>> card["interval"]
1
>>> # Second review — correct (quality 4)
>>> update_card_sm2(card, 4)
>>> card["repetitions"]
2
>>> card["interval"]
6
>>> # Third review — correct (quality 4)
>>> update_card_sm2(card, 4)
>>> card["repetitions"]
3
>>> card["interval"]
15
>>> # Forgot — resets everything
>>> update_card_sm2(card, 1)
>>> card["repetitions"]
0
>>> card["interval"]
1
```

**🩹 إذا لم يعمل :** إذا لم تنمُ الفترة بعد المراجعة الثالثة، فتحقق من وجود فرع `elif card["repetitions"] == 1` الذي يرجع 6 — بدونه تعطي الصيغة `round(interval * ease_factor)` قيمة `round(1 * 2.5) = 2` بدلًا من 6 للإجابة الصحيحة الثانية. إذا انخفض `ease_factor` عن 1.3، فمثبّت `max(1.3, ...)` غير موجود.

### 4.2 طبّق SM-2 بعد كل مراجعة

**👟 تلميح البداية :** في حلقة جلسة الدراسة، بعد الحصول على تقييم الجودة، استدعِ `update_card_sm2` على البطاقة. اطبع تاريخ المراجعة التالية ليعرف المستخدم متى سيرى البطاقة مرة أخرى.

```python
def study_session(deck: dict) -> list[dict]:
    due = get_due_cards(deck)
    if not due:
        print("\nNo cards due for review! Great job.")
        return []

    print(f"\n{'='*50}")
    print(f"  STUDY SESSION — {len(due)} card(s) due")
    print(f"{'='*50}")

    results = []
    for i, card in enumerate(due, 1):
        print(f"\n  Card {i}/{len(due)}")
        print(f"  Front: {card['front']}")
        input("  Press Enter to reveal the answer...")
        print(f"  Back:  {card['back']}")

        quality = get_quality_rating()
        update_card_sm2(card, quality)
        next_review = card["next_review"][:10]
        print(f"  -> Next review: {next_review}")
        results.append({"card": card, "quality": quality})

    print(f"\n  Session complete! Reviewed {len(results)} card(s).")
    return results
```

**🎯 الناتج المتوقع :** بعد تقييم كل بطاقة، سترى متى ستُجدول بعد ذلك:

```
  Card 1/3
  Front: What is Python?
  Press Enter to reveal the answer...
  Back:  A high-level interpreted programming language
  How well did you know it?
  Rating (0-5): 4
  -> Next review: 2026-09-07
```

تظهر البطاقات المقيمة 0–2 مجددًا غدًا؛ والبطاقات المقيمة 3–5 تُدفع خارجًا وفق جدول SM-2.

**🩹 إذا لم يعمل :** إذا كان تاريخ المراجعة التالية دائمًا غدًا بغض النظر عن التقييم، فـ `update_card_sm2` لا يعدّل `interval` الخاص بالبطاقة — تأكد أنك تعدّل `card["interval"]` في مكانه، لا تنشئ متغيرًا محليًا. إذا كان التاريخ في الماضي، فنسيت إضافة `timedelta(days=card["interval"])` إلى `datetime.now()`.

### 4.3 تحقّق من SM-2

**✅ قائمة التحقق**

- ✅ الجودة >= 3 تزيد `repetitions` وتنمّي الفترة.
- ✅ الجودة < 3 تعيد `repetitions` إلى 0 والفترة إلى 1.
- ✅ لا ينخفض عامل السهولة عن 1.3 أبدًا.
- ✅ `next_review` مضبوط على `now + interval` يومًا.
- ✅ بعد جلسة الدراسة، تعكس حقول البطاقة الجدول الجديد.

**🤔 سؤال (أسئلة) سقراطي(ة)**

لماذا تستخدم خوارزمية SM-2 عامل سهولة ضربيًا بدلًا من زيادة ثابتة؟ ماذا يحدث لتكرار المراجعة إذا قيّمت بطاقة دائمًا بـ 3 (صحيحة مع صعوبة) مقابل دائمًا 5 (مثالية)؟

---

## الخطوة 5: تتبع التقدم

جلسة الدراسة مفيدة فقط إذا استطعت رؤية تقدمك عبر الزمن. لنبنِ إحصائيات تُظهر عدد البطاقات التي أتقنتها، ودقتك الإجمالية، وعدد البطاقات المستحقة.

### 5.1 احسب إحصائيات المجموعة

**👟 تلميح البداية :** مرّر عبر كل البطاقات وعدّ: الإجمالي، والمتقن (تكرارات >= 3)، والمتعلَّم (تكرارات 1–2)، والجديد (تكرارات == 0). واحسب أيضًا متوسط عامل السهولة.

```python
def deck_stats(deck: dict) -> dict:
    cards = deck["cards"]
    if not cards:
        return {
            "total": 0, "mastered": 0, "learning": 0, "new": 0,
            "due": 0, "avg_ease": 0.0,
        }

    now = datetime.now()
    mastered = sum(1 for c in cards if c["repetitions"] >= 3)
    learning = sum(1 for c in cards if 1 <= c["repetitions"] < 3)
    new_cards = sum(1 for c in cards if c["repetitions"] == 0)
    due = sum(
        1 for c in cards
        if datetime.fromisoformat(c["next_review"]) <= now
    )
    avg_ease = sum(c["ease_factor"] for c in cards) / len(cards)

    return {
        "total": len(cards),
        "mastered": mastered,
        "learning": learning,
        "new": new_cards,
        "due": due,
        "avg_ease": round(avg_ease, 2),
    }
```

**🎯 الناتج المتوقع :**

```python
>>> deck = build_sample_deck()
>>> stats = deck_stats(deck)
>>> stats
{'total': 6, 'mastered': 0, 'learning': 0, 'new': 6, 'due': 6, 'avg_ease': 2.5}
```

بعد جلسة دراسة، تتغير الأرقام — المتقن والمتعلَّم يرتفعان، والجديد ينخفض، والمستحقة تهبط.

**🩹 إذا لم يعمل :** إذا كانت `due` دائمًا 0 بعد الدراسة، فـ `get_due_cards` تقارن سلاسل بدلًا من كائنات datetime — تأكد من استدعاء `datetime.fromisoformat()` على سلسلة `next_review`. إذا كانت `avg_ease` خاطئة، فأنت تقسم على العدد الخاطئ — استخدم `len(cards)`، لا `sum(...)`.

### 5.2 اعرض الإحصائيات كشريط تقدم

**👟 تلميح البداية :** استخدم حرف كتلة Unicode لرسم شريط تقدم. اعرض تعدادات المتقن والمتعلَّم والجديد بجانبه.

```python
def show_stats(deck: dict) -> None:
    stats = deck_stats(deck)
    total = stats["total"]

    print(f"\n{'='*50}")
    print(f"  {deck['name']} — Progress")
    print(f"{'='*50}")
    print(f"  Total cards:   {stats['total']}")
    print(f"  Due now:       {stats['due']}")
    print(f"  Mastered:      {stats['mastered']}")
    print(f"  Learning:      {stats['learning']}")
    print(f"  New:           {stats['new']}")
    print(f"  Avg ease:      {stats['avg_ease']}")

    if total > 0:
        mastered_pct = stats["mastered"] / total * 100
        bar_len = 30
        filled = int(bar_len * stats["mastered"] / total)
        bar = "█" * filled + "░" * (bar_len - filled)
        print(f"\n  Progress: [{bar}] {mastered_pct:.0f}%")

    print(f"{'='*50}")
```

**🎯 الناتج المتوقع :**

```
==================================================
  Python Basics — Progress
==================================================
  Total cards:   6
  Due now:       6
  Mastered:      0
  Learning:      0
  New:           6
  Avg ease:      2.5

  Progress: [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 0%
==================================================
```

بعد دراسة كل البطاقات وتقييمها 4–5، يمتلئ شريط التقدم.

**🩹 إذا لم يعمل :** إذا تجاوز شريط التقدم 30 حرفًا، فـ `filled` يتجاوز `bar_len` — أضف `min(filled, bar_len)` كمشبك أمان. إذا لم تجتمع النسب، فتحقق أن `mastered + learning + new == total`.

### 5.3 تحقّق من تتبع التقدم

**✅ قائمة التحقق**

- ✅ ترجع `deck_stats` الإجمالي والمتقن والمتعلَّم والجديد والمستحق ومتوسط السهولة.
- ✅ تطبع `show_stats` ملخصًا منسقًا مع شريط تقدم.
- ✅ المجموعات الفارغة لا تنهار — تُظهر أصفارًا كلها.
- ✅ بعد جلسة دراسة، تعكس الإحصائيات حالات البطاقات المحدثة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

لماذا يعرّف SM-2 «المتقن» على أنه `repetitions >= 3` بدلًا من رقم أعلى؟ ماذا سيحدث لجدول مراجعتك إذا رفعت العتبة إلى 5؟

---

## الخطوة 6: الحفظ والتحميل

يختفي تقدمك عند إغلاق البرنامج. أصلح ذلك بكتابة المجموعة إلى ملف JSON على القرص وتحميلها مجددًا عند الإقلاع.

### 6.1 احفظ المجموعة إلى JSON

**👟 تلميح البداية :** استخدم `json.dump` لكتابة قاموس المجموعة إلى ملف. استخدم `indent=2` لمخرجات قابلة للقراءة. كائنات `datetime` مخزنة بالفعل كسلاسل ISO، فتتسلسل دون مشاكل.

```python
import json
from pathlib import Path

def save_deck(deck: dict, filename: str = "deck.json") -> None:
    with open(filename, "w") as f:
        json.dump(deck, f, indent=2)
    print(f"Saved {len(deck['cards'])} cards to {filename}")
```

**🎯 الناتج المتوقع :**

```python
>>> deck = build_sample_deck()
>>> save_deck(deck)
Saved 6 cards to deck.json
```

يحتوي الملف `deck.json` الآن على المجموعة كاملة كـ JSON قابل للقراءة.

**🩹 إذا لم يعمل :** إذا حصلت على `TypeError: Object of type datetime is not JSON serializable`، فخزنت كائن `datetime` مباشرة بدلًا من استدعاء `.isoformat()` — عد إلى `create_card` وتأكد أن الطابع الزمني سلسلة. إذا كان الملف فارغًا، ففتحته بوضع `"w"` (الذي يقصّ) قبل استدعاء `json.dump`.

### 6.2 حمّل المجموعة من JSON

**👟 تلميح البداية :** استخدم `json.load` لقراءة الملف مرة أخرى. تعامل مع حالة عدم وجود الملف — ابدأ بمجموعة فارغة في تلك الحالة.

```python
def load_deck(filename: str = "deck.json") -> dict:
    path = Path(filename)
    if not path.exists():
        print(f"No saved deck found — starting fresh.")
        return create_deck("My Deck")
    with path.open() as f:
        deck = json.load(f)
    print(f"Loaded {len(deck['cards'])} cards from {filename}")
    return deck
```

**🎯 الناتج المتوقع :** في أول تشغيل (بلا ملف): `No saved deck found — starting fresh.` وفي التشغيلات اللاحقة: `Loaded 6 cards from deck.json`.

**🩹 إذا لم يعمل :** إذا حصلت على `FileNotFoundError`، فأنت لا تفحص `path.exists()` قبل الفتح. إذا كانت للمجموعة المحمّلة قيمة `None` لـ `cards`، فملف JSON تالف — افتحه في محرر نصوص للفحص.

### 6.3 تحقّق من الاستمرارية

**✅ قائمة التحقق**

- ✅ بعد الحفظ، يوجد `deck.json` ويحتوي JSON صالحًا بكل حقول البطاقة.
- ✅ بعد التحميل، للمجموعة نفس البطاقات والوسوم وحالة SM-2.
- ✅ غياب ملف JSON لا ينهار — يبدأ بمجموعة فارغة.
- ✅ الملف المحفوظ قابل للقراءة البشرية مع `indent=2`.

**🤔 سؤال (أسئلة) سقراطي(ة)**

ماذا يحدث إذا عدّلت `deck.json` يدويًا وأدخلت خطأ إملائيًا في حقل `ease_factor`؟ كيف ستضيف تحققًا عند التحميل لاصطياد البيانات التالفة؟

---

## الخطوة 7: صقل واجهة سطر الأوامر

اجمع كل شيء في قائمة تفاعلية. يختار المستخدم أفعالًا من قائمة مرقمة، ويُتحقق من المدخلات، وتبدو التجربة مكتملة.

### 7.1 ابنِ القائمة الرئيسية

**👟 تلميح البداية :** اكتب دالة `main()` تحمّل المجموعة عند الإقلاع، وتحلّق بقائمة، وتحفظ بعد كل تغيير. استخدم حلقة `while True` تنكسر عند خيار «إنهاء».

```python
def show_menu() -> None:
    print("\n=== Flashcard App ===")
    print("1. Study (due cards)")
    print("2. View all cards")
    print("3. Add a card")
    print("4. Show progress")
    print("5. Save deck")
    print("6. Quit")

def add_card_interactive(deck: dict) -> None:
    front = input("Front of card: ").strip()
    if not front:
        print("  Front cannot be empty.")
        return
    back = input("Back of card: ").strip()
    if not back:
        print("  Back cannot be empty.")
        return
    tags_input = input("Tags (comma-separated, or blank): ").strip()
    tags = [t.strip() for t in tags_input.split(",") if t.strip()] if tags_input else []
    add_card(deck, front, back, tags)

def main() -> None:
    deck = load_deck()

    while True:
        show_menu()
        choice = input("Choose (1-6): ").strip()

        if choice == "1":
            study_session(deck)
            save_deck(deck)
        elif choice == "2":
            list_cards(deck)
        elif choice == "3":
            add_card_interactive(deck)
            save_deck(deck)
        elif choice == "4":
            show_stats(deck)
        elif choice == "5":
            save_deck(deck)
        elif choice == "6":
            save_deck(deck)
            print("Goodbye!")
            break
        else:
            print("Invalid choice — pick 1 through 6.")

if __name__ == "__main__":
    main()
```

**🎯 الناتج المتوقع :** تشغيل `main()` يعرض قائمة مرقمة، وينفذ الإجراء المختار، ويعود إلى القائمة. تُحفظ المجموعة تلقائيًا بعد الدراسة أو إضافة البطاقات.

```
=== Flashcard App ===
1. Study (due cards)
2. View all cards
3. Add a card
4. Show progress
5. Save deck
6. Quit
Choose (1-6): 1

No cards due for review! Great job.

=== Flashcard App ===
1. Study (due cards)
...
```

**🩹 إذا لم يعمل :** إذا حصلت على `UnboundLocalError`، فمتغير `deck` غير معرّف قبل حلقة `while True` — تأكد من تشغيل `deck = load_deck()` أولًا. إذا لم تُحفظ البطاقات بعد الدراسة، فنسيت `save_deck(deck)` داخل فرع `"1"`.

### 7.2 أضف تعليقات ملونة

**👟 تلميح البداية :** استخدم رموز هروب ANSI لألوان الطرفية. لفّ تعليقات الصحيح/الخاطئ في الأخضر/الأحمر. لا حاجة لمكتبات خارجية.

```python
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BOLD = "\033[1m"
RESET = "\033[0m"

def coloured(text: str, color: str) -> str:
    return f"{color}{text}{RESET}"
```

**🎯 الناتج المتوقع :** بعد تقييم بطاقة، يظهر التعليق بالألوان — أخضر للتقييمات العالية (4–5)، أصفر للمتوسطة (3)، أحمر للمنخفضة (0–2).

**🩹 إذا لم يعمل :** إذا رأيت رموز هروب خام مثل `[92m` بدلًا من الألوان، فمعظم الطرفيات الحديثة تدعم رموز ANSI، لكن موجه الأوامر في Windows قد يحتاج `os.system("")` تُستدعى مرة عند الإقلاع لتمكينها.

### 7.3 تحقّق من التطبيق الكامل

**✅ قائمة التحقق**

- ✅ تعرض القائمة ستة خيارات وتقبل الإدخال دون انهيار.
- ✅ «الدراسة» تشغّل جلسة دراسة مع تحديثات SM-2 وتحفظ المجموعة.
- ✅ «عرض كل البطاقات» يسرد كل بطاقة بالوجه والظهر والوسوم.
- ✅ «إضافة بطاقة» تتحقق من وجه/ظهر غير فارغَين وتحفظ فورًا.
- ✅ «عرض التقدم» يعرض الإحصائيات وشريط تقدم.
- ✅ «حفظ المجموعة» يكتب إلى `deck.json` ويؤكد.
- ✅ «إنهاء» يحفظ ويخرج بأناقة.
- ✅ الإدخال غير الصالح يطبع خطأ ويعود إلى القائمة.

---

## ⚠️ المآزق الشائعة

- **نسيان الحفظ بعد التغييرات.** إذا درست البطاقات لكنك لم تستدعِ `save_deck`، فكل تحديثات SM-2 تضيع عند الخروج. احفظ دائمًا مباشرة بعد عملية غيّرت البيانات.
- **مقارنة السلاسل للتواريخ.** مقارنة سلاسل تواريخ ISO معجميًا تعمل لصيغة `YYYY-MM-DD`، لكن `datetime.fromisoformat()` أأمن للحسابات مثل «هل هذه البطاقة مستحقة؟».
- **تعديل القائمة الافتراضية.** إذا عدّلت `get_due_cards` قائمة `cards` الخاصة بالمجموعة بدلًا من التصفية إلى قائمة جديدة، ستزيل بطاقات من المجموعة. أنشئ دائمًا نسخة مفلترة.
- **عامل سهولة دون 1.3.** تستطيع خوارزمية SM-2 دفع `ease_factor` دون 1.3 بتقييمات منخفضة جدًا. يمنع مشبك `max(1.3, ...)` الفترات من الانكماش إلى الأبد.
- **الكتابة فوق JSON عند التحميل.** يجب أن *يقرأ* `load_deck` الملف، لا أن يكتب إليه. زلّة شائعة استيراد الدالة الخطأ أو استدعاء `save` داخل `load`.

## 🧩 تحديات

مستعد للمضي أبعد؟ جرّب هذه:

1. **تصفية الوسوم** — أضف أمرًا لدراسة بطاقات بوسم محدد فقط. صفِّ `get_due_cards` بفحص هل الوسم في `card["tags"]`.

2. **استيراد/تصدير المجموعة** — اسمح للمستخدمين بتصدير مجموعة كملف نصي عادي (بطاقة لكل سطر، بصيغة front|back) واستيرادها مجددًا. هذا يجعل المجموعات قابلة للمشاركة دون JSON.

3. **سجل الجلسات** — تتبّع عدد البطاقات التي راجعتها كل يوم، ومتوسط تقييمك، ودقتك. خزّن السجل في ملف JSON منفصل واعرض ملخصًا أسبوعيًا.

## ما تعلمته

- **نمذجة البيانات بالقواميس** — مثّلت البطاقات والمجموعات كقواميس Python عادية بأسماء حقول وقيم افتراضية واضحة.
- **التكرار المتباعد SM-2** — نفّذت الخوارزمية التي تضبط فترات المراجعة بناءً على مدى معرفتك بكل بطاقة.
- **تفاعل المستخدم** — بنيت جلسة دراسة مع تقليب لكشف الإجابة، والتحقق من الإدخال، وتقييمات الجودة.
- **تتبع التقدم** — حسبت إحصائيات الإتقان وصوّرت التقدم بشريط تقدم طرفي.
- **استمرارية JSON** — حفظت وحمّلت بيانات المجموعة عبر الجلسات باستخدام `json.dump` و`json.load`.
- **تصميم واجهة سطر الأوامر** — بنيت واجهة مدفوعة بقوائم مع التحقق من الإدخال، وتعليقات ملونة، وحفظ تلقائي.

لديك الآن تطبيق بطاقات تعليمية يعمل بكامل وظائفه. تجعل البنية القائمة على القواميس من السهل توسيعه — أضف الصور بتخزين عناوين URL في حقل `"image"`، أو نفّذ صناديق لايتنر بإضافة حقل `"box"`، أو ابنِ نظام مجموعات مشتركة بقراءة JSON من عنوان URL.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓