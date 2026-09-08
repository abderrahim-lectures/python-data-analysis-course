---
title: "كتابة الملفات والبيانات بتنسيق CSV"
description: "اكتب النصوص والبيانات الجدولية إلى الملفات، بما في ذلك تنسيق CSV."
module: "file-io"
order: 19
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "كتابة النصوص إلى ملفات باستخدام open('w') و open('a')"
  - "الكتابة إلى ملفات CSV باستخدام وحدة csv"
  - "فهم الفرق بين 'w' و 'a'"
  - "معالجة الملفات النصية في العالم الحقيقي"
prerequisites: ["18-reading-files"]
tags: ["csv", "write", "append", "csv-writer", "file-output"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## أوضاع الملفات

```python
open("file.txt", "r")   # read (default)
open("file.txt", "w")   # write (overwrites!)
open("file.txt", "a")   # append (adds to end)
open("file.txt", "x")   # create (errors if file exists)
```

## كتابة الملفات النصية

```python
# "w" mode creates or overwrites
with open("output.txt", "w") as f:
    f.write("Hello, World!\n")
    f.write("Second line\n")

# writelines for multiple strings
lines = ["line 1\n", "line 2\n", "line 3\n"]
with open("output.txt", "w") as f:
    f.writelines(lines)
```

## الإلحاق

```python
with open("log.txt", "a") as f:
    f.write("New entry\n")  # adds to end, doesn't overwrite
```

## العمل مع CSV

تتعامل وحدة `csv` مع الجوانب الصعبة (الاقتباس، الفواصل):

```python
import csv

# Writing CSV
with open("data.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["Name", "Score"])
    writer.writerow(["Alice", 85])
    writer.writerow(["Bob", 92])

# Reading CSV
with open("data.csv") as f:
    reader = csv.reader(f)
    header = next(reader)  # ['Name', 'Score']
    for row in reader:
        print(f"{row[0]}: {row[1]}")
```

## DictReader و DictWriter

اربط صفوف CSV بالقواميس لكود أنظف:

```python
import csv

# DictReader — rows become dicts with header keys
with open("data.csv") as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(f"{row['Name']}: {row['Score']}")

# DictWriter — write from dicts
with open("output.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["Name", "Score"])
    writer.writeheader()
    writer.writerow({"Name": "Charlie", "Score": 88})
```

## Pathlib للكتابة

```python
from pathlib import Path

Path("output.txt").write_text("Hello!\n")
content = Path("output.txt").read_text()

# Create directories
Path("data/logs").mkdir(parents=True, exist_ok=True)
```

## المزالق الشائعة

- **نسيان `newline=""` عند كتابة CSV** — تظهر أسطر فارغة إضافية على Windows
- **خلط `"w"` و`"a"`**: كلاهما يكتب، لكن سلوكهما مختلف بشكل حاسم
- **عدم استخدام وحدة csv للبيانات الحقيقية** — التعامل اليدوي مع الفواصل والاقتباس مشحون بالأخطاء

<section class="lesson-section lesson-section--challenges">
<h2 id="-challenges">🧩 التحديات</h2>

<details class="challenge">
<summary>التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

اكتب برنامجًا ينشئ ملف CSV فيه رأسا "word" و "length"، ثم يكتب كل كلمة من `["hello", "world", "python"]` مع عدد أحرفها في صف منفصل.

<p class="challenge__answer">💡 <strong>الإجابة:</strong> استخدم <code>csv.writer</code> مع <code>writer.writerow(["word", "length"])</code> ثم دورة كتابة صف لكل كلمة، واحرص على فتح الملف بـ <code>newline=""</code> — الصيغة الكاملة: <code>with open("words.csv", "w", newline="") as f: ...</code></p>

</div>
</details>

<details class="challenge">
<summary>التحدي — فكّر أولًا، ثم اكشف</summary>
<div class="challenge__body">

أشرف على بروتوكول للملف المفتوح بمشاركة عدة كتاب. لماذا قد ينسخ الكاتب الثاني عمل الأول إذا فتح بـ `"w"` بدلًا من `"a"`؟ اشرح بكلمة مختصرة.

<p class="challenge__answer">💡 <strong>الإجابة:</strong> الوضع <code>"w"</code> يمسح محتوى الملف فور الفتح — فيضيع ما كتبه سابقًا قبل الأوان، بينما <code>"a"</code> يلحق ما يُكتب في النهاية فقط.</p>

</div>
</details>

</section>

<section class="lesson-section lesson-section--socratic">
<h2 id="-socratic-questions">🤔 أسئلة سقراطية</h2>

- متى تختار `"w"` (الكتابة) ومتى `"a"` (الإلحاق)؟ ماذا تفقد في كل منهما؟
- لماذا تستخدم `newline=""` في CSV عبر الأنظمة — وما الفرق الذي تصنعه في Next line الصادرة؟
- ما ميزة `csv.DictWriter` على `csv.writer` على المدى الطويل للبيانات؟ (فكّر بعد الأعمدة وإعادة القراءة).

</section>

<section class="lesson-section lesson-section--quiz">
<h2 id="-quick-check">✅ مراجعة سريعة</h2>

<div class="quiz" data-quiz="python-101-writing-files-csv">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">1. أي وضع يحافظ على محتوى الملف الحالي ويتيح الإضافة إليه؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">"w"</button>
      <button class="quiz-q__opt" data-idx="1">"a"</button>
      <button class="quiz-q__opt" data-idx="2">"r"</button>
      <button class="quiz-q__opt" data-idx="3">"x"</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">2. لماذا نوع <code>csv.writer</code> أفضل من اليدوي لبناء صفوف CSV؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">يقتبس الحقول التي تحتوي فواصل</button>
      <button class="quiz-q__opt" data-idx="1">أسرع تنفيذًا</button>
      <button class="quiz-q__opt" data-idx="2">يضغط الملف</button>
      <button class="quiz-q__opt" data-idx="3">لا يوجد فرق</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>
</section>