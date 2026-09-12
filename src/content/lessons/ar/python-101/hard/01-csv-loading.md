---
title: "تحميل المتن النصي من CSV"
description: "افتح ملف slm-corpus.csv وحلِّله وتحقق من بنيته باستخدام وحدة csv في بايثون."
module: "loading-corpus"
order: 1
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "فتح ملف CSV وتحليله باستخدام csv.reader و csv.DictReader"
  - "فحص أسماء الأعمدة وعدد الصفوف وأنواع البيانات في مجموعة بيانات CSV"
  - "استخراج النص الخام من صفوف المتن في سلسلة واحدة"
  - "معالجة مزالق CSV الشائعة: الترميز ومحارف الأسطر الجديدة والقيم المفقودة"
prerequisites: []
tags: ["بايثون", "csv", "متن", "تحميل-بيانات"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "لماذا يجب تمرير newline عند فتح ملف CSV بهدف استخدام وحدة csv؟"
    options:
      - text: "لأنه يمنع قراءة الملف كملف ثنائي"
      - text: "لأنه يسمح لوحدة csv بالتعامل مع نهايات الأسطر بشكل صحيح"
        correct: true
      - text: "لأنه يسرّع القراءة بالتفادي على التخزين السطري"
      - text: "لأنه يحوّل كل النصوص إلى أحرف صغيرة"
  - question: "ما الذي تستخدمه csv.DictReader كمفاتيح للقاموس في كل صف؟"
    options:
      - text: "مؤشرات الأعمدة (0, 1, 2...)"
      - text: "أول صف بيانات"
      - text: "قيم صف الترويسة"
        correct: true
      - text: "أسماء مولّدة تلقائيًا مثل field_1, field_2"
  - question: "إذا كان reader = csv.DictReader(f)، فماذا تُرجع next(reader)؟"
    options:
      - text: "صف الترويسة"
      - text: "أول صف بيانات"
        correct: true
      - text: "آخر صف بيانات"
      - text: "مجموعة من كل الصفوف"
---

لماذا تبدأ بالبيانات؟

يبدأ كل مشروع تعلم آلي بالبيانات. وفي نموذج لغوي نصي، تكون تلك البيانات **متنًا (corpus)** ، مجموعة من النصوص سيتعلّم النموذج منها الأنماط. متننا موجود في `slm-corpus.csv`، وهو ملف CSV صغير يأتي مع الدورة في `static/datasets/`.

قبل أن تتمكن من الترميز أو العدّ أو التوليد من أي شيء، تحتاج إلى تحميل هذا الملف في بايثون. يغطي هذا الدرس طريقتين: `csv.reader` للوصول الخام و `csv.DictReader` للوصول المدرِك للترويسة.

## المفاهيم الأساسية

### فتح ملف CSV

تتولى وحدة `csv` في بايثون الأجزاء المعقدة من تحليل CSV (الحقول المقتبسة، والفواصل المدمجة، والمحارف المهرّبة). افتح دائمًا ملفات CSV في الوضع النصي ودع الوحدة تقوم بالعمل:

```python
import csv

with open("slm-corpus.csv", newline="") as f:
    reader = csv.reader(f)
    header = next(reader)  # first row = column names
    print(header)  # e.g. ['id', 'text']
```

وسيطة `newline=""` مطلوبة بحسب توثيق وحدة `csv` ، وبدونها قد تظهر صفوف فارغة على Windows أو مخرجات بأسطر مزدوجة.

### القراءة باستخدام DictReader

يربط `csv.DictReader` كل صف بقاموس باستخدام صف الترويسة كمفاتيح. وهذا يجعل كودك موثّقًا ذاتيًا:

```python
import csv

with open("slm-corpus.csv", newline="") as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(row["text"])  # access by column name, not index
```

الاستدعاء الأول لـ `next(reader)` تلقائي ، يستهلك `DictReader` صف الترويسة بنفسه.

### استخراج النص الكامل

لبناء نموذج لغوي، تحتاج إلى كل النصوص مجمّعة في سلسلة طويلة واحدة. إليك طريقة جمعها:

```python
import csv

texts = []
with open("slm-corpus.csv", newline="") as f:
    reader = csv.DictReader(f)
    for row in reader:
        texts.append(row["text"])

full_text = " ".join(texts)
print(f"Loaded {len(texts)} rows, {len(full_text)} characters")
```

يربط أسلوب `join()` نصوص كل الصفوف بفاصل مسافة، منتجًا كتلة نصية متصلة واحدة.

### التحقق من التحميل

افحص بياناتك دائمًا بعد التحميل. احسب عدد الصفوف، وألقِ نظرة على بضع عينات، وابحث عن مشكلات واضحة:

```python
import csv

with open("slm-corpus.csv", newline="") as f:
    reader = csv.DictReader(f)
    rows = list(reader)

print(f"Total rows: {len(rows)}")
print(f"Columns: {rows[0].keys()}")
print(f"First row: {rows[0]}")
print(f"Last row:  {rows[-1]}")
```

إذا كان الملف كبيرًا، تجنب `list(reader)` ، فهو يحمّل كل شيء في الذاكرة. كرّر بدلًا من ذلك وعالِج صفًا بصف.

## جرّب بنفسك

حمّل `slm-corpus.csv` واطبع:
1. عدد الصفوف في الملف
2. أسماء الأعمدة
3. نص أول صف

استخدم هذا الهيكل:

```python
import csv

with open("slm-corpus.csv", newline="") as f:
    reader = csv.DictReader(f)
    rows = list(reader)

print(f"Rows: {len(rows)}")
print(f"Columns: {list(rows[0].keys())}")
print(f"Sample: {rows[0]['text'][:200]}")
```

## الخلاصات الرئيسية

- افتح دائمًا ملفات CSV باستخدام `newline=""` عند استخدام وحدة `csv`
- يمنحك `csv.DictReader` وصولًا بمفاتيح الترويسة؛ بينما يمنحك `csv.reader` وصولًا بالمؤشرات
- تحقق من تحميلك: افحص عدد الصفوف وأسماء الأعمدة وألقِ نظرة على بيانات عيّنة
- في الملفات الكبيرة، كرّر صفًا بصف بدلًا من التحويل إلى قائمة

## تحدي الممارسة

اكتب دالة `load_corpus(path)` تأخذ مسار ملف CSV وتُرجع قائمة من السلاسل ، واحدة لكل عمود `text` في كل صف. تحقق من حالة عدم وجود الملف بطباعة رسالة خطأ وإرجاع قائمة فارغة.

```python
def load_corpus(path):
    import csv
    try:
        with open(path, newline="") as f:
            reader = csv.DictReader(f)
            return [row["text"] for row in reader]
    except FileNotFoundError:
        print(f"File not found: {path}")
        return []
```