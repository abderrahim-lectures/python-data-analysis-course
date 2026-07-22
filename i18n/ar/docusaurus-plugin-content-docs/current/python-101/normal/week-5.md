---
title: "الأسبوع 5: العمل مع ملفات CSV"
sidebar_position: 5
section: python-101
track: normal
week: 5
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';
import BonusContent from '@site/src/components/BonusContent';

# الأسبوع 5: قراءة وكتابة ملفات CSV

<span className="gamified-flourish">📊 كل ما تعلمته هذا الشهر كان يبني نحو شيء واحد: البيانات الحقيقية تعيش في ملفات، لا في كود كتبته يدويًا.</span>

## 🎯 أهداف التعلّم

بنهاية هذا الأسبوع ستكون قادرًا على:
- فتح وإغلاق ملف بأمان باستخدام `with`، وشرح أهمية ذلك.
- قراءة صفوف ملف CSV إلى بايثون باستخدام وحدة `csv` المدمجة، كقوائم وكقواميس.
- كتابة صفوف عادية وصفوف بشكل قواميس مرة أخرى إلى ملف CSV جديد.
- دمج القوائم، القواميس، الحلقات، والدوال لتلخيص مجموعة بيانات حقيقية.
- كتابة مشروع صغير كامل، دون مساعدة، باستخدام فقط ما تعلمته في الأسابيع 1-4.

## الدرس

### فتح الملفات بأمان باستخدام `with`

قبل التطرق لملفات CSV تحديدًا، صياغة جديدة واحدة: `with open(...) as f:` تفتح ملفًا، تمنحك مقبضًا (handle) له باسم `f`، وتُغلقه تلقائيًا مجددًا بمجرد انتهاء الكتلة المُزاحة — حتى لو حدث خطأ في منتصف الطريق. هذا مهم لأن ملفًا غير مُغلق يمكن أن يفقد كتابات مُخزّنة مؤقتًا أو يُقفل الملف أمام برامج أخرى. البديل، `f = open(...)` متبوعًا بـ `f.close()` يدويًا في النهاية، من السهل نسيانه (خصوصًا إن تسبب خطأ في خروج مبكر)؛ يجعل `with` "إغلاقه دائمًا" هو الافتراضي الذي لا تحتاج لتذكّره.

### CSV: صفوف من قيم مفصولة بفواصل

ملف CSV (قيم مفصولة بفواصل) هو جدول نصي بسيط — سطر واحد لكل صف، والقيم مفصولة بفواصل. مجموعة بيانات هذا الأسبوع، [`students-normal.csv`](pathname:///datasets/students-normal.csv)، تحتوي على صف رأس (`name,quiz1,quiz2,quiz3`) متبوعًا بصف لكل طالب.

:::tip[هذا الملف متوفر بالفعل في بيئة البرمجة]
بيئة البرمجة الخاصة بالزر العائم تحتوي بالفعل على `students-normal.csv` محمّلاً مسبقًا — لا حاجة لنسخ أو لصق أي شيء. استدعاء `open("students-normal.csv")` في كودك أدناه سيجد الملف مباشرة.
:::

```python
import csv

with open("students-normal.csv", newline="") as f:
    reader = csv.reader(f)
    header = next(reader)          # الصف الأول: أسماء الأعمدة
    for row in reader:
        print(row)                  # كل صف هو قائمة من النصوص
```

كل قيمة تُقرأ بهذه الطريقة هي `str` — رقم مثل `"87"` في الملف يصل كنص `"87"`، وليس كـ int `87`. عليك تحويلها بنفسك، تمامًا مثل `input()` في الأسبوع 1. تسحب `next(reader)` فقط الصف الأول (صف الرأس) من القارئ قبل بدء حلقة `for`، بحيث لا ترى الحلقة نفسها إلا صفوف البيانات الفعلية. تمنع وسيطة `newline=""` معالجة وحدة `csv` الخاصة لنهايات الأسطر من التعارض مع معالجة بايثون — إنها كود قياسي يجب أن تُضمّنه دائمًا عند فتح ملف لـ `csv.reader`/`csv.writer`، رغم أن شرح السبب بالتفصيل يتجاوز نطاق هذا الأسبوع.

### `csv.DictReader`: الصفوف كقواميس

بدلًا من تتبّع مواضع الأعمدة بالفهرس، يمنحك `csv.DictReader` كل صف كـ `dict` مفتاحه أسماء الرأس — هذا عادة الخيار الأوضح للقراءة، ويقرأ صف الرأس تلقائيًا نيابة عنك (لا حاجة لـ `next(reader)` يدويًا):

```python
with open("students-normal.csv", newline="") as f:
    reader = csv.DictReader(f)
    for row in reader:
        name = row["name"]
        score = int(row["quiz1"])   # لا تزال str حتى تحوّلها
        print(name, score)
```

قارن هذا بـ `csv.reader`: مع `csv.reader`، تعني `row[1]` "أيًا كان الموجود في العمود 1" — هشّة إن تغيّر ترتيب الأعمدة يومًا. مع `csv.DictReader`، تقول `row["quiz1"]` بالضبط ما تقصده بغض النظر عن ترتيب الأعمدة، بتكلفة بسيطة هي بحث في قاموس بدلًا من فهرس قائمة.

### كتابة ملفات CSV

`csv.writer` و`csv.DictWriter` هما الصورة المعاكسة لـ `csv.reader`/`csv.DictReader` — مفيدتان لحفظ ملخص حسبته مرة أخرى في ملف:

```python
with open("summary.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["name", "average"])
    writer.writerow(["Amina", 91.5])
```

وضع `"w"` (وضع الكتابة) مهم — `open("summary.csv", "w")` تُنشئ الملف إن لم يكن موجودًا، و**تستبدل محتواه بالكامل** إن كان موجودًا. يعكس `csv.DictWriter` عمل `DictReader`: تكتب قواميس بدلًا من قوائم عادية، ويحتاج معرفة أسماء الأعمدة (`fieldnames`) مسبقًا ليعرف الترتيب الذي يكتبها به وينتج صف رأس مطابقًا:

```python
with open("summary.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["name", "average"])
    writer.writeheader()                              # يكتب صف الرأس
    writer.writerow({"name": "Amina", "average": 91.5})
    writer.writerow({"name": "Youssef", "average": 74.3})
```

`DictWriter` هو النظير الطبيعي إن بنيت ملخصك كقائمة من قواميس (شكل "تضمين المجموعات" من الأسبوع 3) بدلًا من قاموس بسيط من اسم ← معدّل.

### جمع كل شيء معًا: مشروع صغير

يجمع مشروع هذا الأسبوع كل شيء من الأسابيع 1-4: قراءة CSV لدرجات الطلاب، حساب معدلات كل طالب بدالة، تخزينها في `dict`، وطباعة ملخص مرتب من الأعلى للأدنى — باستخدام `sorted()` مع دالة `key`، والتي تأخذ هي نفسها دالة كوسيط، تمامًا مثل `compose` من سؤال الأسبوع الماضي السقراطي:

```python
def average(scores):
    return sum(scores) / len(scores)

averages = {}   # name -> average
with open("students-normal.csv", newline="") as f:
    reader = csv.DictReader(f)
    for row in reader:
        name = row["name"]
        scores = [int(row["quiz1"]), int(row["quiz2"]), int(row["quiz3"])]
        averages[name] = average(scores)

for name in sorted(averages, key=lambda n: averages[n], reverse=True):
    print(name, round(averages[name], 1))
```

`lambda n: averages[n]` هي دالة صغيرة بلا اسم — اقرأها كـ"القاعدة التي تربط اسمًا بمعدله"، تُستخدم فقط لإخبار `sorted()` بماذا يرتب. الـ`lambda` تكافئ تمامًا `def` صغيرة (`lambda n: averages[n]` تتصرف مثل دالة سطر واحد `def key_fn(n): return averages[n]`)؛ توجد فقط لكي لا تحتاج لتسمية وتعريف دالة منفصلة فقط لتمرير قاعدة بسيطة مُستخدمة لمرة واحدة إلى `sorted()`.

## ⚠️ أخطاء شائعة

- **نسيان `newline=""`.** بدونها، يمكن لـ `csv.writer` إدراج أسطر فارغة إضافية بين الصفوف على بعض الأنظمة (خصوصًا Windows) — أدرجها دائمًا عند قراءة أو كتابة ملفات CSV.
- **الفتح بوضع `"w"` عن طريق الخطأ عندما كنت تقصد إضافة بيانات.** `open("summary.csv", "w")` تمحو محتوى الملف الموجود أولًا. إن أردت إضافة صفوف لملف موجود بدلًا من ذلك، استخدم وضع `"a"` (إلحاق).
- **افتراض ترتيب الأعمدة في `csv.reader`.** `row[0]` هو "الاسم" فقط إن كان عمود الاسم فعليًا أولًا *ويظل* أولًا — يتجنب `DictReader` هذه الفئة كاملة من الأخطاء.
- **عدم تحويل الأعمدة الرقمية قبل إجراء عمليات حسابية عليها.** `row["quiz1"] + row["quiz2"]` مع `DictReader` تدمج نصين (`"88" + "92"` ← `"8892"`)، ولا تجمع رقمين — صدى مباشر لفخ `input()` في الأسبوع 1.

## 🧩 تحديات

<Challenge id="python101-normal-w5-c1" answer={<>افتح الملف بـ <code>csv.DictReader</code>، كرّر على الصفوف، حوّل عمود الدرجة بـ <code>int(...)</code>، واحتفظ بـ <code>total</code> و<code>count</code> جاريين (أو استخدم قائمة وsum()/len()) لحساب معدل الصف.</>}>

بمعطى CSV بعمودي `name,score`، اكتب برنامجًا يحسب ويطبع متوسط الدرجات عبر *كل* الطلاب في الملف.

</Challenge>

<Challenge id="python101-normal-w5-c2" answer={<>كرّر على صفوف DictReader، احتفظ بزوج <code>best_name</code>/<code>best_score</code> جارٍ، وحدّثهما كلما رأيت درجة أعلى — نفس نمط "تتبّع الحد الأقصى الجاري" لإيجاد أكبر عنصر في قائمة.</>}>

وسّع البرنامج السابق ليطبع أيضًا اسم الطالب صاحب *أعلى* درجة مفردة.

</Challenge>

<Challenge id="python101-normal-w5-c3" answer={<>استخدم <code>csv.writer</code>، اكتب صف رأس، ثم كرّر على قاموس المعدلات كاتبًا صفًا لكل طالب — يعكس جانب القراءة لكن بـ<code>writerow</code> بدلًا من التكرار على قارئ.</>}>

اكتب معدلات الطلاب التي حسبتها أعلاه إلى ملف جديد `summary.csv` بعمودي `name,average`.

</Challenge>

<Challenge id="python101-normal-w5-c4" answer={<>غلّف تحويل int(...) بحيث تُتخطى القيمة المفقودة/الفارغة أو تُعطى قيمة افتراضية (مثلًا تُعامل كـ 0، أو يُستبعد ذلك الاختبار من المعدل) بدلًا من تعطيل البرنامج بالكامل — هذا بالضبط نوع الموقف الذي صُمم من أجله try/except (إضافي هذا الأسبوع).</>}>

ماذا سيحدث لو كان صف واحد في CSV يحتوي درجة مفقودة (نص فارغ بدلًا من رقم)؟ عدّل برنامجك بحيث لا يتعطل على ذلك الصف.

</Challenge>

<Challenge id="python101-normal-w5-c5" answer={<>أعد كتابة خطوة الكتابة باستخدام <code>csv.DictWriter</code> بـ <code>fieldnames=["name", "average"]</code>، استدع <code>writer.writeheader()</code> مرة، ثم <code>writer.writerow(...)</code> بقاموس لكل طالب داخل الحلقة، بدلًا من صفوف <code>csv.writer</code> العادية.</>}>

أعد التحدي 3 باستخدام `csv.DictWriter` بدلًا من `csv.writer`. أي نسخة تجدها أسهل للقراءة، ولماذا؟

</Challenge>

<Challenge id="python101-normal-w5-c6" answer={<>استخدم وضع "a" (إلحاق) بدلًا من "w": with open("summary.csv", "a", newline="") as f — يضيف هذا صفوفًا جديدة بعد أي محتوى موجود بالفعل بالملف، بدلًا من محوه أولًا. لاحظ أنك ستستدعي writer.writeheader() فقط في المرة الأولى التي يُنشأ فيها الملف، وليس مع كل إلحاق.</>}>

إن أردت إضافة صف طالب آخر إلى `summary.csv` *دون* محو ما هو موجود بالفعل، أي وضع ملف ستستخدم بدلًا من `"w"`؟ جرّبه.

</Challenge>

## 🤔 أسئلة سقراطية

- لماذا يصل كل ما يُقرأ من CSV كـ `str`، حتى الأعمدة التي تبدو رقمية؟ أين رأيت هذا النمط "نص يدخل، تحويل مطلوب" من قبل في هذه الدورة؟
- `sorted(averages, key=lambda n: averages[n], reverse=True)` — ماذا سيتغير لو أزلت `reverse=True`؟ ماذا سيتغير لو أزلت `key=...` تمامًا وكتبت فقط `sorted(averages)`؟
- بنيت الآن خط أنابيب صغيرًا: قراءة ← تحويل ← تلخيص ← كتابة. أي مفاهيم الأسابيع 1-4 اعتمدت عليها كل مرحلة فعليًا؟ بدون مادة أي أسبوع كان هذا المشروع سيكون مستحيلًا؟
- تُغلق `with open(...) as f:` الملف تلقائيًا حتى لو حدث خطأ داخل الكتلة. هل يمكنك التفكير في سبب قد يجعل برنامجًا يفتح ملفات كثيرة طوال عمره، دون إغلاقها بشكل صحيح أبدًا، يبدأ في النهاية بالفشل بطرق غريبة؟
- يحتاج `csv.DictWriter` تحديد `fieldnames` مسبقًا، قبل أن يكتب أي شيء. لماذا تعتقد أنه يتطلب هذا، بدلًا من استنتاج الأعمدة فقط من أول قاموس تُمرره له عبر `writerow`؟

## ✅ اختبار الأسبوع

<WeeklyQuiz
  weekId="python-101-normal-week-5"
  questions={[
    {
      id: 'q1',
      prompt: 'ما نوع كل قيمة تُقرأ من ملف CSV بوحدة csv، قبل تحويلها؟',
      options: ['int', 'float', 'str', 'يعتمد على العمود'],
      correctOptionIndex: 2,
    },
    {
      id: 'q2',
      prompt: 'ماذا يمنحك csv.DictReader لكل صف، مقارنة بـ csv.reader؟',
      options: [
        'قائمة نصوص، مثل csv.reader تمامًا',
        'dict مفتاحه أسماء أعمدة الرأس',
        'صف (tuple) من أعداد صحيحة',
        'نص واحد للصف كاملًا',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q3',
      prompt: 'في sorted(names, key=lambda n: averages[n])، ما دور وسيطة key؟',
      options: [
        'تُصفّي بعض الأسماء',
        'تخبر sorted() بأي قيمة يرتب كل عنصر',
        'تحوّل الأسماء إلى أرقام بشكل دائم',
        'تعكس الترتيب',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: "أي وحدة من مكتبة بايثون القياسية استُخدمت لقراءة/كتابة ملفات CSV هذا الأسبوع؟",
      options: ['json', 'os', 'csv', 'io'],
      correctOptionIndex: 2,
    },
    {
      id: 'q5',
      prompt: 'فتح ملف بـ open("data.csv", "w") عندما يكون الملف موجودًا بالفعل سوف:',
      options: [
        'يرفض الفتح، ويرفع خطأ',
        'يُلحق محتوى جديدًا في النهاية',
        'يستبدل المحتوى الموجود بالكامل',
        'يفتحه للقراءة فقط',
      ],
      correctOptionIndex: 2,
    },
  ]}
/>

## 🎁 إضافي: تذوّق أول للـ classes

<BonusContent weekId="python-101-normal-week-5">

كان كل طالب هذا الأسبوع مجموعة فضفاضة من القيم المنفصلة — اسم في قاموس، قائمة درجات في آخر. يتيح لك `class` تجميع البيانات والسلوك المترابطين في كائن واحد:

```python
class Student:
    def __init__(self, name, scores):
        self.name = name
        self.scores = scores

    def average(self):
        return sum(self.scores) / len(self.scores)

amina = Student("Amina", [88, 92, 79])
print(amina.average())   # 86.33...
```

يعمل `__init__` عندما تُنشئ `Student(...)`؛ يشير `self` إلى *كائن الطالب هذا تحديدًا*. هذا ليس جزءًا من المنهج الأساسي — كل شيء في الأسابيع 1-5 كان قابلًا للحل عمدًا باستخدام الدوال والقوائم والقواميس فقط — لكن الـ classes تصبح مفيدة فعليًا بمجرد أن يمتلك برنامج قطعًا كثيرة مترابطة من الحالة والسلوك تسافر معًا، وهو ما ستبدأ بالشعور به في مشاريع قسم **تحليل البيانات** الأكبر. جرّب إعادة كتابة مشروع هذا الأسبوع الصغير بحيث يكون كل طالب كائن `Student` بدلًا من قاموس مفتاحه الاسم.

</BonusContent>

<ProgressCheckbox weekId="python-101-normal-week-5" />
