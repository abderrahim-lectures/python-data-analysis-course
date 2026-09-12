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

## الأبوابُ الأربعة

كانت القراءةُ بابًا ذا اتجاهٍ واحدٍ: تُدخل `"r"` البياناتَ. أما الكتابةُ فتحتاج مفرداتَ النيّة، إذ يعدّ كلُّ وضعٍ شيئًا مختلفًا عن مصيرِ الملف:

```python
open("file.txt", "r")   # قراءة (افتراضي)
open("file.txt", "w")   # كتابة (تسطيح!)
open("file.txt", "a")   # إضافة (يُلحق في النهاية)
open("file.txt", "x")   # إنشاء (خطأ إن وُجد الملف)
```

يُلقي `"w"` القديمَ لحظةَ فتحه؛ ويُبقيه `"a"` ويرقع في نهايته؛ ويرفض `"x"` لمسَ ملفٍ قائمٍ. اخترِ الوضعَ الذي يصرّح بما تعنيه فعلًا — فبالاختيارِ يُهلك الملفُ أو يُحفظ.

## كتابةُ الملفاتِ النصية

```python
# وضع "w" يُنشئ أو يُسطح
with open("output.txt", "w") as f:
    f.write("Hello, World!\n")
    f.write("Second line\n")

# writelines لعدة سلاسل
lines = ["line 1\n", "line 2\n", "line 3\n"]
with open("output.txt", "w") as f:
    f.writelines(lines)
```

يُسلّم `write` سلسلةً واحدةً كلَّ مرةٍ؛ ويُسلّم `writelines` قائمةً كاملةً في نداءٍ واحدٍ. ويحترم الاثنانِ عقدَ `with` نفسَه الذي تثق به: حين تنتهي الكتلةُ، يُصفّى الملفُ ويُغلق. ولاحظِ `\n` يتسلّل إلى كلِّ سلسلةٍ مكتوبةٍ — السطرُ الجديدُ لا يُضاف لك، بل يُخزَّن فقط.

## الإضافةُ

تنمو السجلاتُ ولا تعيد كتابةَ التاريخِ أبدًا. يُركن `"a"` المؤشرَ في النهاية:

```python
with open("log.txt", "a") as f:
    f.write("New entry\n")  # يضيف في النهاية ولا يُسطح
```

يحوّل وضعُ الإضافةِ الملفَّ إلى مُراكمٍ: كلُّ تشغيلٍ يضيف سطرًا، وكلُّ ما كُتب قبلُ ينجو سالِمًا.

## العملُ مع CSV

الـ CSV جدولٌ على سلكٍ: أسطرٌ تفصلها أسطرٌ جديدةٌ، وخلايا تفصلها فواصلُ. وتملك وحدةُ `csv` الأجزاءَ الرقيقةَ — الاقتباسَ، وإفلاتَ الفواصل، ونهاياتِ الأسطر:

```python
import csv

# كتابة CSV
with open("data.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["Name", "Score"])
    writer.writerow(["Alice", 85])
    writer.writerow(["Bob", 92])

# قراءة CSV
with open("data.csv") as f:
    reader = csv.reader(f)
    header = next(reader)  # ['Name', 'Score']
    for row in reader:
        print(f"{row[0]}: {row[1]}")
```

يقبل الكاتبُ قائمةً لكلِّ صفٍّ ويدرجُ الفواصلَ؛ ويعيد القارئُ كلَّ صفٍّ قائمةً. وتُزيح `next(reader)` سطرَ الترويسةِ، ثم يواصل التكرارُ مع البيانات — المَمشى نفسُه الذي تعرفه، على ملفٍ صفوفُه بُنى.

## DictReader و DictWriter

القوائمُ جيدةٌ، لكن الحقولَ المسمّاةَ تعفيك من سؤالِ ماذا عنى `row[0]`. تسمّي القواميسُ الأعمدةَ مرةً واحدةً، عند الترويسة:

```python
import csv

# DictReader — صفوفٌ تصير قواميسَ بمفاتيحِ الترويسة
with open("data.csv") as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(f"{row['Name']}: {row['Score']}")

# DictWriter — كتابةٌ من قواميس
with open("output.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["Name", "Score"])
    writer.writeheader()
    writer.writerow({"Name": "Charlie", "Score": 88})
```

يقرأ `DictReader` الترويسةَ ويحوّل كلَّ صفٍّ لاحقٍ قاموسًا بمفاتيحِها؛ ويصنع `DictWriter` العكسَ — صرّح بمفاتيحِ الحقولِ، واكتبِ الترويسةَ، ثم أطعمْهُ قواميسَ تقع قيمُها تحت أعمدةِ أسمائِها.

## Pathlib للكتابة

يعمل المسارُ الكائنيُّ الآن في الاتجاهين:

```python
from pathlib import Path

Path("output.txt").write_text("Hello!\n")
content = Path("output.txt").read_text()

# إنشاءُ مجلداتٍ
Path("data/logs").mkdir(parents=True, exist_ok=True)
```

يضغط `write_text` فتحًا-كتابةً-إغلاقًا في نداءٍ واحدٍ، ويجعل `mkdir` مع `parents=True` أشجارَ مجلداتٍ كاملةً في أمرٍ واحدٍ لا مستوىً في كلِّ مرةٍ.

## مثالٌ محلول: دفترُ الدرجاتِ مُفرَّغًا في CSV

يذهبُ التطابقُ إلى القرصِ جدولًا — رأسٌ أولًا، ثم سطرٌ لكلِّ مدخلٍ:

```python
import csv

scores = {"Alice": 85, "Bob": 92, "Charlie": 78}

with open("grades.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["Name", "Score"])
    for name, score in scores.items():
        writer.writerow([name, score])
```

تصيرُ `items()` السطورَ؛ ويُسمّي الرأسُ الأعمدةَ. يثبّتُ `newline=""` نهاياتِ السطورِ، ويفرّغُ كتلةُ `with` الملفَّ ويغلقُه عندَ الانتهاءِ.

## أخطاءٌ شائعة

- **`"w"` يُسطح في صمتٍ.** يذهب الملفُ القديمُ لحظةَ فتحِ الوضع. وإن كانت الماضي تَهُمّ، فاخترْ `"a"`.
- **نسيانُ `newline=""` في CSV.** تُضاعفُ الكاتبةُ نهاياتِ الأسطرِ على ويندوزَ إلا أن تُثبتَ `newline=""`؛ فتظهر أسطرٌ فارغةٌ بين البيانات.
- **تخطّي `writeheader()`.** لا يكتب `DictWriter` المطعمُ قواميسَ أيَّ سطرِ ترويسةٍ إلا أن تناديها — فيخسر القراءُ مفاتيحَهم.
- **يأخذُ `writerow` متتابعةً — والسلسلةُ متتابعةُ أحرفٍ.** يبعثرُ `writer.writerow("Alice")` الحروفَ `A,l,i,c,e` في خمسِ خلايا. لفَّ القيمةَ في قائمةٍ حين يكونُ الحقلُ سلسلةً واحدةً.

## 🧩 تحديات

<details class="challenge">
<summary>🧩 تحدٍّ — فكّر أولًا ثم أظهر</summary>
<div class="challenge__body">

اكتب دالةً تأخذ قائمةَ أعدادٍ وتكتبها في ملفٍ، عددًا في كلِّ سطرٍ.

<p class="challenge__answer">💡 <strong>الجواب:</strong> <code>with open("nums.txt", "w") as f: for n in nums: f.write(f"{n}\n")</code> — سلسلةٌ لكلِّ عددٍ، كلُّ واحدةٍ بسطرِها الجديدِ.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 تحدٍّ — فكّر أولًا ثم أظهر</summary>
<div class="challenge__body">

اقرأ CSV لدرجاتِ طلابٍ واطبع المتوسطَ.

<p class="challenge__answer">💡 <strong>الجواب:</strong> <code>import csv; with open("grades.csv") as f: rows = list(csv.DictReader(f)); avg = sum(int(r["Score"]) for r in rows) / len(rows); print(f"Average: {avg:.1f}")</code></p>

</div>
</details>

## 🤔 أسئلة سقراطية

- لماذا تحتاج كتابةُ CSV إلى `newline=""` على ويندوزَ دون لينكس؟ ما الذي يحدث تحت غطاءِ المحرك؟
- أين الفرقُ بين `csv.writer` و`csv.DictWriter` — ومتى تمدُّ يدك لكلٍّ؟
- وإذا فُتح الـ CSV في إكسلَ، فأيُّ احتياطاتٍ إضافيةٍ ينبغي أن تتخذَ؟

## ✅ فحص سريع

<div class="quiz" data-quiz="python-101-file-writing">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">١. أيُّ وضعٍ يُنشئ ملفًا أو يُسطّحه؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">"r"</button>
      <button class="quiz-q__opt" data-idx="1">"w"</button>
      <button class="quiz-q__opt" data-idx="2">"a"</button>
      <button class="quiz-q__opt" data-idx="3">"x"</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">٢. ماذا يستخدم <code>csv.DictReader</code> مفاتيحَ للقاموس؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">الصفَّ الأول (الترويسات)</button>
      <button class="quiz-q__opt" data-idx="1">أرقامَ الأعمدة (0, 1, 2...)</button>
      <button class="quiz-q__opt" data-idx="2">أسماءً مُولَّدةً تلقائيًا</button>
      <button class="quiz-q__opt" data-idx="3">الصفَّ الأخير</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>