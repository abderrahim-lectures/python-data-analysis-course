---
title: "قراءة الملفات"
description: "اقرأ الملفات النصية سطرًا بسطر باستخدام السياقات الآمنة."
module: "file-io"
order: 18
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "فتح الملفات وقراءتها باستخدام open() و with"
  - "قراءة الملف بكامله أو سطرًا بسطر"
  - "معالجة أخطاء الملفات الشائعة والعمل مع الترميز"
  - "التكرار فوق الخطوط بكفاءة عبر الملفات الكبيرة"
prerequisites: ["17-comprehensions"]
tags: ["files", "open", "read", "with", "utf-8"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## فتح الملفات

استخدم `open()` للحصول على كائن ملف:

```python
f = open("data.txt", "r")  # read mode
content = f.read()
f.close()  # always close when done!
```

## جملة with

يغلق `with` الملف تلقائيًا حتى لو حدث خطأ:

```python
with open("data.txt") as f:
    content = f.read()
# file is closed here
```

**استخدم `with` دائمًا** — إنه أأمن وأنظف.

## استراتيجيات القراءة

```python
# Read entire file as one string
with open("data.txt") as f:
    text = f.read()

# Read line by line (memory-efficient for large files)
with open("data.txt") as f:
    for line in f:
        print(line.rstrip())  # strip trailing newline

# Read all lines into a list
with open("data.txt") as f:
    lines = f.readlines()  # includes \n in each string
```

## Pathlib (النهج الحديث)

يوفر `pathlib` مسارات كائنية التوجه — أكثر وضوحًا من ربط السلاسل:

```python
from pathlib import Path

p = Path("data") / "scores.txt"    # Path('data/scores.txt')
text = p.read_text()               # read the whole file
lines = p.read_text().splitlines() # lines without \n

p.exists()   # True/False
p.is_file()  # True/False
p.suffix     # '.txt'
p.stem       # 'scores'
```

## الترميز

حدد الترميز دائمًا لضمان قابلية النقل:

```python
with open("data.txt", encoding="utf-8") as f:
    text = f.read()
```

بدون `encoding`، يستخدم بايثون الافتراضي للنظام، والذي يختلف بين المنصات.

## المزالق الشائعة

- **النسيان أن القراءة سطرًا تتضمن `\n`** — استخدم `line.strip()` أو ضرورة التجزئة
- **فتح ملف للكتابة دون قصد** يمحو ما فيه — تحقق من الوضع قبل الكتابة
- **الأنسب**: `with open(...)` لضمان الإغلاق التلقائي. تجنّب `open()` بدونه.

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 التحديات</h2>

<details class="challenge">
<summary>التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

افتح ملفًا يحتوي على رقم واحد في كل سطر، واحسب المجموع. تعامل مع ملف يمكن أن يكون غير موجود.

<p class="challenge__answer">💡 <strong>الإجابة:</strong> <code>try: with open("nums.txt") as f: total = sum(int(line) for line in f) except FileNotFoundError: total = 0</code>.</p>

</div>
</details>

<details class="challenge">
<summary>التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

قرأ ملف سجلات بأرقام معقّدة بأنماط مختلطة. صمّم كودًا يقرأ سطرًا بسطر ويطبع عدد الأسطر فقط — دون تحميل الملف في الذاكرة كاملة.

<p class="challenge__answer">💡 <strong>الإجابة:</strong> <code>count = sum(1 for _ in open("log.txt"))</code> — يكبح حجم الذاكرة بثبات لعدد الأسطر.</p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 أسئلة سقراطية</h2>

- لماذا تحتاج `with open(...)`؟ وماذا يحدث إذا نسيته وأخفق الاستثناء؟
- متى تختار `read()` بكامل الفهم بينما تجيد `for line in f` قراءة الملف شريطًا؟ أين حدود الذاكرة؟
- ما الفرق بين الترميز الافتراضي والتفصيلي عندما تتعامل مع ملفات أنشأها Windows؟

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ مراجعة سريعة</h2>

<div class="quiz" data-quiz="python-101-reading-files">
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">1. أي وضع يمسح ملفًا مكتوبًا فيه؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">"r"</button>
      <button class="quiz-q__opt" data-idx="1">"a"</button>
      <button class="quiz-q__opt" data-idx="2">"w"</button>
      <button class="quiz-q__opt" data-idx="3">"r+"</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">2. ماذا تفعل المعلمة <code>encoding="utf-8"</code> في <code>open(...)</code>؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">تسريع القراءة</button>
      <button class="quiz-q__opt" data-idx="1">تضبط فك ترميز البايت إلى نص</button>
      <button class="quiz-q__opt" data-idx="2">تضيف رأس BOM</button>
      <button class="quiz-q__opt" data-idx="3">لا تفعل شيئًا</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>