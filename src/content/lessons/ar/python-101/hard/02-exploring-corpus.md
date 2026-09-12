---
title: "استكشاف المتن النصي"
description: "احسب عدد الصفوف وأسماء الأعمدة ومعاينة النص لتفهم مجموعة بياناتك قبل المعالجة."
module: "loading-corpus"
order: 2
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "حساب إحصائيات أساسية: عدد الصفوف وعدد الأعمدة وطول المحارف"
  - "معاينة صفوف عيّنة وفحص محتوى النص"
  - "فهم ما الذي يجعل متنًا مناسبًا لنموذج لغوي"
  - "تحديد مشكلات جودة البيانات: الصفوف الفارغة وأخطاء الترميز والتكرار"
prerequisites: ["01-csv-loading"]
tags: ["بايثون", "متن", "استكشاف-بيانات", "تحليل-نص"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "ما الخطوة الأولى عند استكشاف متن CSV جديد؟"
    options:
      - text: "ابدأ الترميز على الفور"
      - text: "افحص أسماء الأعمدة وعدد الصفوف وعيّنة من البيانات"
        correct: true
      - text: "حمّله في إطار pandas DataFrame"
      - text: "احذف الصفوف ذات القيم المفقودة"
  - question: "كيف تستخرج عمود النص من csv.DictReader؟"
    options:
      - text: "reader[0]"
      - text: "reader.text"
      - text: "row text for each row in reader"
        correct: true
      - text: "reader.get_text()"
  - question: "ما الذي يخبرك به len(list(reader))؟"
    options:
      - text: "عدد الأعمدة"
      - text: "عدد صفوف البيانات (باستثناء الترويسة)"
        correct: true
      - text: "الحجم الكلي للملف"
      - text: "عدد المحارف"
---

استكشف قبل أن تعالج

تحميل البيانات هو الخطوة الأولى. الخطوة الثانية هي فهم ما حمّلته. قد يحتوي المتن على قيم مفقودة، أو صفوف مكررة، أو محارف مشفّرة تبدو كالبيانات التالفة، أو نصوصًا قصيرة جدًا لتكون مفيدة. خمس دقائق من الاستكشاف الآن توفر ساعات من التصحيح لاحقًا.

## المفاهيم الأساسية

### عدّ الصفوف والأعمدة

أبسط الإحصائيات تخبرك كثيرًا. متن من 5 صفوف لن يُنتج نموذجًا مفيدًا؛ متن من 50,000 صف قد يحتاج إلى تحميل مجزّأ:

```python
import csv

with open("slm-corpus.csv", newline="") as f:
    reader = csv.DictReader(f)
    rows = list(reader)

print(f"Rows:    {len(rows)}")
print(f"Columns: {list(rows[0].keys())}")
```

### قياس طول النص

تحتاج النماذج اللغوية إلى نص كافٍ لتعلم الأنماط. افحص إجمالي عدد المحارف ومتوسط طول الصف:

```python
total_chars = sum(len(row["text"]) for row in rows)
avg_len = total_chars / len(rows) if rows else 0

print(f"Total characters: {total_chars:,}")
print(f"Average row length: {avg_len:.0f} characters")
```

متن بمتوسط 10 محارف في الصف قصير جدًا ، لن يكون لدى النموذج سياق كافٍ لتعلم متتاليات الكلمات.

### معاينة نص عيّنة

اقرأ بضعة صفوف لتكوّن فكرة عن المحتوى. ما اللغة التي يكتب بها؟ ما الموضوعات التي يغطيها؟ هل النص نظيف أم مشوّش؟

```python
for i, row in enumerate(rows[:5]):
    preview = row["text"][:150].replace("\n", " ")
    print(f"[{i}] {preview}...")
```

### اكتشاف التكرارات

تضخّم الصفوف المكررة أعداد الكلمات دون إضافة معلومات جديدة. اكتشفها بتحويل الصفوف إلى مجموعة:

```python
unique_texts = set(row["text"] for row in rows)
print(f"Unique rows: {len(unique_texts)} / {len(rows)}")

if len(unique_texts) < len(rows):
    print(f"Warning: {len(rows) - len(unique_texts)} duplicate rows found")
```

### فحص الصفوف الفارغة أو القصيرة

لن تُسهم الصفوف الفارغة أو القصيرة جدًا في أزواج كلمات (bigrams) مفيدة. صفِّها خارجًا:

```python
short_rows = [row for row in rows if len(row["text"].split()) < 3]
print(f"Rows with fewer than 3 words: {len(short_rows)}")
```

تجمع دالة ملخص المتن كل هذه الفحوصات:

```python
def corpus_summary(path):
    import csv
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    texts = [row["text"] for row in rows]
    total_chars = sum(len(t) for t in texts)
    unique = len(set(texts))

    print(f"Rows: {len(rows)}")
    print(f"Unique: {unique}")
    print(f"Total chars: {total_chars:,}")
    print(f"Avg length: {total_chars / len(rows):.0f}")
    print(f"Columns: {list(rows[0].keys())}")
```

## جرّب بنفسك

نفّذ `corpus_summary("slm-corpus.csv")` ولاحظ:
1. كم عدد الصفوف في المتن؟
2. هل توجد أي تكرارات؟
3. هل متوسط طول النص كافٍ لبناء أزواج كلمات ذات معنى (20+ كلمة في الصف على الأقل)؟

## الخلاصات الرئيسية

- استكشف بياناتك دائمًا قبل المعالجة ، افحص الأعداد والأطوال والتكرارات
- الصفوف القصيرة أو الفارغة تضيف ضجيجًا؛ صفِّها بناءً على حد أدنى لعدد الكلمات
- التكرارات تضخّم أعداد التكرارات دون إضافة أنماط جديدة
- دالة ملخص سريعة توفّر وقتًا عبر المشاريع

## تحدي الممارسة

اكتب دالة `corpus_quality(path)` تحمّل CSV وتُرجع قاموسًا بهذه المفاتيح: `"rows"`، و`"unique"`، و`"total_chars"`، و`"avg_length"`، و`"min_length"`، و`"max_length"`. استخدمها لتقييم ما إذا كان `slm-corpus.csv` مناسبًا لنمذجة أزواج الكلمات.

```python
def corpus_quality(path):
    import csv
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    texts = [row["text"] for row in rows]
    lengths = [len(t.split()) for t in texts]

    return {
        "rows": len(rows),
        "unique": len(set(texts)),
        "total_chars": sum(len(t) for t in texts),
        "avg_length": sum(lengths) / len(lengths) if lengths else 0,
        "min_length": min(lengths) if lengths else 0,
        "max_length": max(lengths) if lengths else 0,
    }
```