---
title: "طُرُق السلاسل النصية"
description: "عالِج النصوص باستخدام مكتبة بايثون الغنية بطرق التعامل مع السلاسل."
module: "strings"
order: 13
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "استخدام طرق السلاسل الشائعة مثل upper و lower و strip"
  - "تقسيم السلاسل وضمّها باستخدام split و join"
  - "البحث داخل السلاسل واستبدالها"
  - "بنيان الاستبدال القابل للتطويع باستخدام replace و strip"
prerequisites: ["12-scope-and-lambdas"]
tags: ["strings", "methods", "split", "join", "strip", "replace"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## السلاسل غير قابلة للتعديل

لا تغيّر طرق السلاسل السلسلة الأصلية — فهي تُرجع نسخة جديدة:

```python
name = "alice"
upper = name.upper()
print(name)    # alice  (unchanged)
print(upper)   # ALICE
```

## التقسيم والضمّ

حوّل بين السلاسل والقوائم:

```python
sentence = "hello world python"
words = sentence.split()       # ['hello', 'world', 'python']
back = " ".join(words)         # 'hello world python'

csv_line = "apple,banana,cherry"
fruits = csv_line.split(",")   # ['apple', 'banana', 'cherry']
```

## البحث والفحص

```python
text = "Hello, World!"

text.startswith("Hello")   # True
text.endswith("!")         # True
text.find("World")         # 7  (index of first match, -1 if not found)
text.count("l")            # 3
text.replace("World", "Python")  # 'Hello, Python!'
```

## حالة الأحرف والفراغات

يزيل `strip()` الفراغات (أو أحرفًا معينة) من الأطراف:

```python
"hello".upper()        # 'HELLO'
"HELLO".lower()        # 'hello'
"  hi  ".strip()       # 'hi'  (removes leading/trailing whitespace)
"  hi  ".lstrip()      # 'hi ' (left only)
"  hi  ".rstrip()      # '  hi' (right only)
"hello world".title()  # 'Hello World'
```

## التنسيق المتقدم بـ f-string

```python
price = 19.999
name = "Widget"

# Width and alignment
print(f"|{name:<15}|")   # |Widget          |  (left-align, width 15)
print(f"|{name:>15}|")   # |          Widget|  (right-align)
print(f"|{name:^15}|")   # |     Widget     |  (center)

# Number formatting
print(f"{price:.2f}")     # 20.00
print(f"{42:05d}")        # 00042  (zero-padded)
print(f"{0.857:.1%}")     # 85.7%  (percentage)
```

## المزالق الشائعة

- **نسيان أن الطرق تُرجع قيمًا** — `text.upper()` وحدها لا تعدّل `text`
- **خلط `find` مع `index`** — يفشل `index` بالرفع، عندما تُفضّل تفادي رفع خطأ
- **الاستدعاء على متغيّر متوسط** — يمكن استدعاء الطرق مباشرة على القيم الحرفية: `"  x  ".strip()`

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 التحديات</h2>

<details class="challenge">
<summary>التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

اكتب تعبيرًا واحدًا يحوّل `"  Hello  World  "` إلى `"hello-world"` (أزل الفراغات، وخُفِّض الحالة، وحوّل المسافات إلى شرطات).

<p class="challenge__answer">💡 <strong>الإجابة:</strong> <code>"  Hello  World  ".strip().lower().replace(" ", "-")</code> — التقطيع ثم التخفيض ثم قابلية الاستبدال القابلة للتطويع.</p>

</div>
</details>

<details class="challenge">
<summary>التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

بالنظر إلى `data = "feat: add dark mode"`، استخرج الجزء بعد `": "` وتحقق أنه يبدأ بحرف `a`.

<p class="challenge__answer">💡 <strong>الإجابة:</strong> <code>description = data.split(": ", 1)[1]</code> ثم <code>description.startswith("a")</code> → True.</p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 أسئلة سقراطية</h2>

- لماذا تجعل بايثون السلاسل غير قابلة للتعديل عندما يراها المبتدئون أسهل كتعديلية؟ وما الأخطاء التي تمنعها؟
- متى تختار `replace` متسلسلة بدلًا من `split` ثم `join`؟
- لماذا تستخدم بايثون `find` منذ البداية؟ ومتى تختار `index` بدلًا منها، ولماذا؟

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ مراجعة سريعة</h2>

<div class="quiz" data-quiz="python-101-string-methods">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. ماذا تُرجع <code>"Hello  World".replace(" ", "-")</code>؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">"Hello-World"</button>
      <button class="quiz-q__opt" data-idx="1">"Hello--World"</button>
      <button class="quiz-q__opt" data-idx="2">"Hello-World"</button>
      <button class="quiz-q__opt" data-idx="3">"hello-world"</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">2. أي تعبير يفحص كل أحرف فراغ أسفل السطر؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">"  ".isalpha()</button>
      <button class="quiz-q__opt" data-idx="1">"  ".isspace()</button>
      <button class="quiz-q__opt" data-idx="2">"  ".isspace()</button>
      <button class="quiz-q__opt" data-idx="3">"  ".isalnum()</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>