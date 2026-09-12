---
title: "تطبيع أعداد أزواج الكلمات"
description: "حوِّل أعداد أزواج الكلمات الخام إلى توزيعات احتمالية تجمع إلى 1.0 لكل كلمة."
module: "bigram-tables"
order: 6
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "تطبيع أعداد أزواج الكلمات الخام إلى احتمالات بقسمة إجمالي التوابع"
  - "فهم سبب الحاجة إلى التوزيعات الاحتمالية للعينة الموزونة"
  - "معالجة الحالات القصوى: الأعداد الصفرية وكلمات التابع المفرد والمفاتيح المفقودة"
  - "التحقق من أن الاحتمالات تجمع إلى 1.0 لكل كلمة"
prerequisites: ["05-building-bigrams"]
tags: ["بايثون", "احتمال", "تطبيع", "أزواج-كلمات", "معالجة-لغة-طبيعية"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "لماذا نطبع أعداد أزواج الكلمات؟"
    options:
      - text: "لجعلها تبدو كنسب مئوية"
      - text: "لمقارنة الاحتمالات عبر سياقات مختلفة"
        correct: true
      - text: "لتقليل استخدام الذاكرة"
      - text: "لترتيبها أبجديًا"
  - question: "ما هي P(word2 | word1) لزوج كلمات؟"
    options:
      - text: "count(word1, word2) / count(word1)"
        correct: true
      - text: "count(word1) / count(word2)"
      - text: "count(word1, word2) / total_words"
      - text: "count(word1) * count(word2)"
  - question: "إذا ظهرت the 1000 مرة وظهر (the, cat) 50 مرة، فما قيمة P(cat | the)؟"
    options:
      - text: "0.05"
        correct: true
      - text: "0.5"
      - text: "50"
      - text: "0.005"
---

من الأعداد إلى الاحتمالات

تخبرك الأعداد الخام أن "the" → "cat" ظهرت 15 مرة و"the" → "dog" ظهرت 5 مرات. لكن لأخذ **عيّنة** من الكلمة التالية، تحتاج إلى احتمالات: يجب اختيار "cat" في 75% من الوقت و"dog" في 25%. يحوّل التطبيع الأعداد إلى توزيع تجمع فيه كل التوابع إلى 1.0.

تستخدم الخلايا أدناه الدوال `load_corpus` و`tokenize` و`build_bigrams` من الدروس 01 إلى 05. كل صفحة درس تبدأ جلسة بايثون جديدة، لذا شغّل خلية الإعداد هذه أولًا:

```python
import csv
import string
from collections import defaultdict

with open("slm-corpus.csv", newline="") as f:
    reader = csv.DictReader(f)
    texts = [row["text"] for row in reader]

def load_corpus(path):
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        return [row["text"] for row in reader]

def tokenize(text):
    text = text.lower()
    for char in string.punctuation:
        text = text.replace(char, " ")
    return text.split()

def build_bigrams(tokens):
    bigrams = defaultdict(lambda: defaultdict(int))
    for i in range(len(tokens) - 1):
        bigrams[tokens[i]][tokens[i + 1]] += 1
    return dict(bigrams)
```

## المفاهيم الأساسية

### التطبيع بحلقة

لكل كلمة، اجمع أعداد توابعها، ثم اقسم كل عدد على ذلك الإجمالي:

```python
def normalize_bigrams(bigrams):
    normalized = {}
    for word, followers in bigrams.items():
        total = sum(followers.values())
        normalized[word] = {w: c / total for w, c in followers.items()}
    return normalized
```

الآن يُرجع `normalized["the"]["cat"]` عددًا عشريًا بين 0 و1 ، احتمال أن تتبع "cat" كلمةَ "the".

### مثال

```python
raw_bigrams = {"the": {"cat": 15, "dog": 5, "bird": 10}}
norm = normalize_bigrams(raw_bigrams)

print(norm["the"])
# {'cat': 0.5, 'dog': 0.1667, 'bird': 0.3333}
```

تجمع الاحتمالات إلى 1.0:
```python
print(sum(norm["the"].values()))  # 1.0
```

### لماذا يهم التطبيع في أخذ العينات

يحتاج `random.choices()` إلى أوزان تمثل الاحتمال النسبي. إذا مررت الأعداد الخام (15، 5، 10)، فسيعمل ، لكن امتلاك احتمالات صحيحة (0.5، 0.167، 0.333) يجعل النموذج قابلاً للنقل وقابلاً للمقارنة عبر أحجام متن مختلفة.

```python
import random

followers = list(norm["the"].keys())
weights = list(norm["the"].values())
next_word = random.choices(followers, weights=weights, k=1)[0]
print(f"Next word: {next_word}")
```

### معالجة الحالات القصوى

بعض الكلمات ليس لها توابع (آخر كلمة في المتن، أو كلمات تظهر فقط في نهاية جمل). لن يحتوي جدول أزواج الكلمات على إدخالات لها:

```python
def normalize_bigrams(bigrams):
    normalized = {}
    for word, followers in bigrams.items():
        if not followers:
            continue  # skip words with no followers
        total = sum(followers.values())
        normalized[word] = {w: c / total for w, c in followers.items()}
    return normalized
```

يمنع تخطي الإدخالات الفارغة أخطاء القسمة على صفر.

### مسار كامل

إليك كيف يتناسب التطبيع مع المسار الكامل:

```python
texts = load_corpus("slm-corpus.csv")
tokens = tokenize(" ".join(texts))
bigrams = build_bigrams(tokens)
model = normalize_bigrams(bigrams)

# Check a sample
print(f"Words in model: {len(model)}")
print(f"Followers of 'the': {list(model.get('the', {}).keys())[:5]}")
```

### حفظ النموذج

قد ترغب في حفظ جدول أزواج الكلمات المطبَّع لإعادة الاستخدام. وبما أنه قاموس متداخل من الأعداد العشرية، يعمل `json` بشكل جيد:

```python
import json

with open("bigram_model.json", "w") as f:
    json.dump(model, f)

# Reload later
with open("bigram_model.json") as f:
    model = json.load(f)
```

## جرّب بنفسك

ابنِ جدول أزواج الكلمات وطبّعه، ثم تحقق:
1. هل تجمع احتمالات "the" إلى 1.0؟
2. كم عدد الكلمات التي ليس لها توابع (عدّتها صفر)؟
3. ما الكلمة الأرجح أن تتبع "the"؟

```python
model = normalize_bigrams(bigrams)
the_followers = model.get("the", {})
top_follower = max(the_followers, key=the_followers.get)
print(f"Most likely after 'the': '{top_follower}' ({the_followers[top_follower]:.3f})")
```

## الخلاصات الرئيسية

- التطبيع يحوّل الأعداد الخام إلى احتمالات تجمع إلى 1.0 لكل كلمة
- يستخدم `random.choices()` هذه الاحتمالات كأوزان لأخذ العينات الموزون
- تخطَّ الكلمات التي ليس لها توابع لتجنب القسمة على صفر
- احفظ النماذج المطبَّعة باستخدام `json.dump()` لإعادة استخدامها عبر النصوص البرمجية

## تحدي الممارسة

اكتب دالة `bigram_stats(model)` تطبع لكل كلمة: الكلمة وعدد التوابع والكلمة التالية الأرجح. حدّد المخرج بأعلى 10 كلمات بإجمالي عدد التوابع.

```python
def bigram_stats(model, top_n=10):
    words = sorted(model, key=lambda w: sum(model[w].values()), reverse=True)
    for word in words[:top_n]:
        followers = model[word]
        total = sum(followers.values())
        best = max(followers, key=followers.get)
        print(f"'{word}': {len(followers)} followers, best=''{best}'' ({followers[best]:.3f})")
```