---
title: "عدّ تكرار الكلمات"
description: "جمّع الرموز في قاموس تكرارات، واستخرج إحصائيات المفردات، وحدّد الكلمات الأكثر شيوعًا والأقل شيوعًا."
module: "tokenization-frequency"
order: 4
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "بناء دالة word_frequency(tokens) تحتسب تكرارات الرموز في قاموس"
  - "استخدام dict.get() أو collections.defaultdict للعدّ الآمن"
  - "استخراج إحصائيات المفردات: إجمالي الرموز والكلمات الفريدة وأعلى N تكرارًا"
  - "فهم قانون زيف ولماذا تهيمن كلمات قليلة على أعداد التكرارات"
prerequisites: ["03-tokenization-basics"]
tags: ["بايثون", "تكرار", "قاموس", "مفردات", "معالجة-لغة-طبيعية"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "بحسب قانون زيف، تظهر الكلمة الأكثر تكرارًا في النص الإنجليزي عادةً:"
    options:
      - text: "10% من الوقت"
      - text: "حوالي 7% من الوقت"
        correct: true
      - text: "50% من الوقت"
      - text: "1% من الوقت"
  - question: "ما الغرض من ترتيب أعداد الكلمات تنازليًا؟"
    options:
      - text: "إزالة التكرارات"
      - text: "رؤية الكلمات الأكثر تكرارًا أولًا"
        correct: true
      - text: "عدّ الكلمات الإجمالية"
      - text: "حساب متوسط طول الكلمة"
  - question: "إذا ظهرت الكلمة A ألف مرة والكلمة B خمسمئة مرة، فما نسبة تكراريهما؟"
    options:
      - text: "1:2"
      - text: "2:1"
        correct: true
      - text: "1:1"
      - text: "1000:500"
---

عدّ الكلمات

بمجرد حصولك على الرموز، تكون الخطوة التالية هي عدّ عدد مرات ظهور كل كلمة. تخبر أعداد التكرارات هذه النموذج اللغوي بالكلمات الشائعة (المرجّحة بالظهور في أي مكان) والكلمات النادرة (التنبؤية عند ظهورها فعلًا).

## المفاهيم الأساسية

### بناء قاموس التكرارات

يستخدم نمط العدّ قاموسًا يكون فيه كل مفتاح كلمة وقيمتها عدد تكراراتها. يعالج أسلوب `get()` حالة "أول مرة نرى هذه الكلمة":

```python
def word_frequency(tokens):
    freq = {}
    for token in tokens:
        freq[token] = freq.get(token, 0) + 1
    return freq

tokens = ["the", "cat", "sat", "the", "dog", "sat", "the"]
freq = word_frequency(tokens)
print(freq)
# {'the': 3, 'cat': 1, 'sat': 2, 'dog': 1}
```

يُرجع `freq.get(token, 0)` العدد الحالي إذا كانت الكلمة موجودة، أو `0` إذا كانت أول مرة نراها. وإضافة 1 تزيد العدد.

### نهج defaultdict

بديل يستخدم `collections.defaultdict`، الذي ينشئ المفاتيح المفقودة تلقائيًا:

```python
from collections import defaultdict

def word_frequency(tokens):
    freq = defaultdict(int)
    for token in tokens:
        freq[token] += 1
    return dict(freq)
```

يُنتج النهجان النتيجة نفسها. نسخة `defaultdict` أنظف قليلًا لكنها تتطلب استيرادًا.

### إحصائيات المفردات

بوجود قاموس تكرارات، يمكنك حساب إحصائيات مفيدة:

```python
freq = word_frequency(tokenize(full_text))

total_tokens = sum(freq.values())
unique_words = len(freq)

print(f"Total tokens: {total_tokens:,}")
print(f"Unique words: {unique_words:,}")
print(f"Vocabulary richness: {unique_words / total_tokens:.4f}")
```

**ثراء المفردات** (الفريد / الإجمالي) يقيس مدى تنوع النص. القيمة القريبة من 1.0 تعني أن كل كلمة تقريبًا فريدة؛ والقيمة القريبة من 0.0 تعني تكرارًا كثيفًا.

### الكلمات الأكثر والأقل تكرارًا

رتّب قاموس التكرارات لإيجاد الطرفين:

```python
sorted_words = sorted(freq.items(), key=lambda item: item[1], reverse=True)

print("Top 10 words:")
for word, count in sorted_words[:10]:
    print(f"  {word}: {count}")

print("\nBottom 10 words:")
for word, count in sorted_words[-10:]:
    print(f"  {word}: {count}")
```

في معظم النصوص الإنجليزية، تهيمن "the" و"of" و"and" و"to" و"a" على أعلى القائمة. وهذا يتبع **قانون زيف** — تظهر الكلمة الأكثر تكرارًا ضعف الكلمة الثانية تقريبًا، وثلاث مرات الكلمة الثالثة، وهكذا.

### لماذا يهم التكرار في التوليد

يستخدم النموذج اللغوي التكرارات لوزن تنبؤاته. إذا ظهرت "the" 500 مرة و"platypus" مرتين، يجب اختيار "the" أكثر — لكن ليس دائمًا. يحسّن نموذج أزواج الكلمات هذا باشتراطه على الكلمة السابقة، وهذا ما يجعل النص المولّد مقروءًا بدلًا من مجرد تدفق من "the the the".

## جرّب بنفسك

حمّل المتن ورمّزه وابنِ قاموس تكرارات. ثم أجب:
1. كم عدد الرموز الإجمالية؟
2. ما الكلمات الخمس الأكثر تكرارًا؟
3. ما نسبة المفردات التي تشكّلها الكلمات التي تظهر مرة واحدة فقط؟

```python
texts = load_corpus("slm-corpus.csv")
full_text = " ".join(texts)
tokens = tokenize(full_text)
freq = word_frequency(tokens)

total = sum(freq.values())
hapax = sum(1 for w, c in freq.items() if c == 1)
print(f"Total tokens: {total}")
print(f"Words appearing once: {hapax} ({hapax/len(freq)*100:.1f}%)")
```

## الخلاصات الرئيسية

- `dict.get(key, default)` هو أساس عدّ التكرارات
- ثراء المفردات (الفريد / الإجمالي) يقيس تنوع النص
- قانون زيف: عدد قليل من الكلمات يهيمن على توزيع التكرارات
- أعداد التكرارات هي المادة الخام لجداول احتمالات أزواج الكلمات

## تحدي الممارسة

اكتب دالة `top_n(freq, n)` تُرجع الكلمات N الأكثر تكرارًا كقائمة من مجموعات `(word, count)`. ثم استخدمها لإيجاد أفضل 20 كلمة في المتن.

```python
def top_n(freq, n):
    return sorted(freq.items(), key=lambda item: item[1], reverse=True)[:n]
```