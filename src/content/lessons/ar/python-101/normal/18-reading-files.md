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

## الجسرُ نحو القرص

البرامجُ التي لا تحسب إلا بما يكتبه المستخدمُ محبوسةٌ في الذاكرة. والملفاتُ تفتح الباب: الملفُ تسلسلُ أسطرٍ، وقراءتُه تَمشٍّ على ذلك التسلسل. أولُ خطوةٍ هي `open()`، التي ترجع كائنَ ملفٍ ملصوقًا بالباب:

```python
f = open("data.txt", "r")  # وضعُ القراءة
content = f.read()
f.close()  # أغلق دائمًا عند الانتهاء!
```

تعني `"r"` القراءةَ فقط. والانضباطُ ثقيل: يجب أن تجري `close()` حين تنتهي، وإلا تسرّب المعالجُ ، يبقى الملفُ محتجزًا زمنًا طويلًا بعد أن كففتَ عن حاجته. ونسيانُه هو جيلُ الأخطاءِ الأولُ في عالم الملفات.

## جملة with: الإغلاقُ وعدًا

تجعل `with` الإغلاقَ تلقائيًّا، حتى إذا اقتحم خطأٌ المتبانةَ من وسطها:

```python
with open("data.txt") as f:
    content = f.read()
# يُغلق الملف هنا
```

تُعلن كتلةُ `with` عقدًا: افتحْه هنا، وسيُغلق عندما تنتهي هذه الكتلة ، بصورةٍ عاديةٍ أو استثناءٍ. حياةُ المعالجِ مؤطَّرةٌ في الكتلة، فلا يبقى ما يُنسى.

## استراتيجياتُ القراءة

الملفُ الواحدُ بثلاثِ شهواتٍ:

```python
# قراءة الملف بكامله كسلسلةٍ واحدة
with open("data.txt") as f:
    text = f.read()

# قراءة سطرٍ بسطرٍ (موفّرةٍ للذاكرة مع الملفات الكبيرة)
with open("data.txt") as f:
    for line in f:
        print(line.rstrip())  # يُزيل السطر الجديد في النهاية

# قراءة كل الأسطر في قائمة
with open("data.txt") as f:
    lines = f.readlines()  # تتضمن \n في كل سلسلة
```

يأخذ `f.read()` كلَّ شيءٍ دفعةً واحدةً؛ ويفرّق `readlines()` إلى قائمةٍ؛ والتكرارُ بـ `for line in f` يتمشّى في الملفِ سطرًا سطرًا، محتفظًا فقط بالسطرِ الحالي في الذاكرة. وآخرُها وصفةُ ملفٍ أضخمَ من أن يتّسع: عالجْ كلَّ سطرٍ ثم تقدم، دون أن تجمع الكلَّ أبدًا.

## Pathlib: مساراتٌ بمفرداتٍ

قراءةُ دمجِ المساراتِ بـ `+` قراءةٌ أثريّة. يُسلّمك `pathlib` كائنَ `Path` وطرقُه *تقول* ما تفعل:

```python
from pathlib import Path

p = Path("data") / "scores.txt"    # Path('data/scores.txt')
text = p.read_text()               # يقرأ الملف كله
lines = p.read_text().splitlines() # الأسطر بلا \n

p.exists()   # True/False
p.is_file()  # True/False
p.suffix     # '.txt'
p.stem       # 'scores'
```

تربط `الـ /` الأجزاءَ في مسارٍ كما يربط نظامُ الملفاتِ المجلداتِ؛ وتستجوب `exists` و`is_file` و`suffix` و`stem` ما *هو* المسار. تصير المساراتُ بياناتٍ بأجوبةٍ لا سلاسلَ تُشَرَّح.

## الترميز: عقدُ الحروف

النصُّ بايتاتٌ حتى تُفسّرها اصطلاحٌ. ثبّت ذلك الاصطلاحَ لضمانِ قابليةِ الحمل بين الآلات:

```python
with open("data.txt", encoding="utf-8") as f:
    text = f.read()
```

وبلا `encoding`، تسقط بايثون إلى افتراضِ النظامِ، الذي يختلف حسب المنصة ، الملفُ نفسُه مشوَّشٌ على آلةٍ ويندوزَ ونقيٌّ على لينكس. وذكرُ `utf-8` يجعل البايتاتِ تعني الحروفَ نفسها في كل مكانٍ.

## مثالٌ محلول: ملفُّ الدرجاتِ سطرًا سطرًا

المشيُ الآمنُ في الذاكرةِ ، تجميعٌ دونَ أن تحملَ الملفَّ كلَّهُ:

```python
with open("scores.txt", encoding="utf-8") as f:
    total = 0
    count = 0
    for line in f:
        total += int(line.strip())
        count += 1

print(f"Avg: {total / count}")
```

تُقرأ كلُّ سطرٍ ويُقشَرُ سطرُه الجديدُ ويُحوَّلُ ويُفلَتُ قبلَ وصولِ التالي ، يتدفقُ الملفُّ دونَ أن يتجمعَ كلَّهُ. ويعدُ `with` بإغلاقِ الملفِّ حين تنتهي الكتلةُ، عاديًّا أو باستثناءٍ.

## أخطاء شائعة

- **نسيان `with`.** تتسرّب المعالجاتُ حين لا يغلقها شيءٌ؛ دع الكتلةَ تملك حياةَ الملف.
- **ابتلاعُ ملفاتٍ هائلة.** قد يُنهك `f.read()` ذاكرةً أمام ملفٍ عملاقٍ ، كرّرْ بـ `for line in f` بدلًا منه.
- **تجاهلُ الترميز.** تتحوّل الحروفُ غير اللاتينيةِ إلى رموزٍ مبهمةٍ حين يترك الاصطلاحُ للصدفة.
- **المساراتُ المقحَمة.** يجعل `pathlib.Path` الكودَ نفسَه يتمشّى على كل نظامِ تشغيلٍ.
- **ملفٌّ مُستهلكٌ يُقرأ فارغًا.** بعد `f.read()` تستقرُّ الموضعُ في النهاية؛ تُعيدُ قراءةٌ ثانيةٌ `''` ويُعيدُ `readlines()` القائمةَ الفارغةَ. اقرأ مرةً، أو أعدِ الفتحَ.

## 🧩 تحديات

<details class="challenge">
<summary>🧩 تحدٍّ ، فكّر أولًا ثم أظهر</summary>
<div class="challenge__body">

عُدّ أسطرَ ملفٍ دون تحميله في الذاكرة.

<p class="challenge__answer">💡 <strong>الجواب:</strong> <code>count = 0; with open("file.txt") as f: for line in f: count += 1</code> أو المقتضبُ <code>sum(1 for _ in open("file.txt"))</code> ، سطرٌ واحدٌ كلَّ مرةٍ، لا الكلُّ أبدًا.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 تحدٍّ ، فكّر أولًا ثم أظهر</summary>
<div class="challenge__body">

اسرد كلَّ ملفٍ ذي لاحقةِ `.txt` في مجلدٍ باستخدامِ `pathlib`.

<p class="challenge__answer">💡 <strong>الجواب:</strong> <code>list(Path(".").glob("*.txt"))</code> ، مستقبلُ باسمٍ عامٍّ يجوب لك الأسماءَ المطابقةَ.</p>

</div>
</details>

## 🤔 أسئلة سقراطية

- هل يتضمّن `for line in f` الـ `\n` الختاميَّ؟ ولماذا تبدو الحلقةُ بهذه الهيئة ، وكيف تُزيل السطرَ الجديدَ؟
- ماذا يحدثُ عند قراءةِ ملفٍ غيرِ موجودٍ؟ كيف يُصاول `with` الاستثناءَ؟
- متى يسبق `f.read()` التكرارَ سطرًا بسطرٍ؟

## ✅ فحص سريع

<div class="quiz" data-quiz="python-101-file-reading">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">١. ماذا يفعل <code>line.rstrip()</code> في حلقةِ ملفٍ؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">يزيل كل مسافاتٍ</button>
      <button class="quiz-q__opt" data-idx="1">يزيل السطرَ الجديدَ في النهاية (والمسافات)</button>
      <button class="quiz-q__opt" data-idx="2">يزيل السطرَ الجديدَ في البداية</button>
      <button class="quiz-q__opt" data-idx="3">يرجع طولَ السطرِ</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">٢. ما الطريقةُ الصحيحةُ لقراءةِ ملفٍ؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">f = open("x.txt"); f.read()</button>
      <button class="quiz-q__opt" data-idx="1">read("x.txt")</button>
      <button class="quiz-q__opt" data-idx="2">with open("x.txt") as f: content = f.read()</button>
      <button class="quiz-q__opt" data-idx="3">File.read("x.txt")</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>