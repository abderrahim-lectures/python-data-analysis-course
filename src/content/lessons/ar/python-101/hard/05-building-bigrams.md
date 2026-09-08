---
title: "بناء جداول أزواج الكلمات (Bigrams)"
description: "احلسب أزواج الكلمات المتتالية في قاموس متداخل يربط كل كلمة بتوزيع الكلمات التالية لها."
module: "bigram-tables"
order: 5
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "فهم ما يلتقطه زوج كلمات (bigram) من التحولات من كلمة إلى أخرى"
  - "بناء قاموس متداخل bigrams = {'the': {'cat': 3, 'dog': 1}, ...} من قائمة رموز"
  - "معالجة حدود الجُمل وكلمات البداية غير المعروفة"
  - "فحص جدول أزواج الكلمات للتحقق من صحته"
prerequisites: ["04-word-frequency"]
tags: ["بايثون", "أزواج-كلمات", "قاموس-متداخل", "تحولات", "معالجة-لغة-طبيعية"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "ما هو زوج الكلمات (bigram)؟"
    options:
      - text: "كلمة من مقطعين"
      - text: "زوج من كلمتين متتاليتين"
        correct: true
      - text: "كلمة من حرفين"
      - text: "كلمة تظهر مرتين"
  - question: "كيف تنشئ أزواج كلمات من قائمة رموز؟"
    options:
      - text: "tokens[0:2]"
      - text: "zip(tokens, tokens[1:])"
        correct: true
      - text: "tokens * 2"
      - text: "tokens.split()"
  - question: "إذا كانت tokens = the, cat, sat، فما أزواج الكلمات التي تحصل عليها؟"
    options:
      - text: "the, cat, sat"
      - text: "(the, cat), (cat, sat)"
        correct: true
      - text: "(the, the), (cat, cat), (sat, sat)"
      - text: "(the, cat, sat)"
---

من أعداد الكلمات إلى تحولاتها

يخبرك تكرار الكلمات *بأي كلمات* تظهر. تخبرك أزواج الكلمات *بماذا يتبع ماذا*. "The cat" أكثر شيوعًا بكثير من "the refrigerator" — يلتقط جدول أزواج الكلمات هذه العلاقة. وهو أبسط شكل لنموذج لغوي: بالنظر إلى كلمة، ما الكلمات التي تميل إلى المجيء بعدها؟

## المفاهيم الأساسية

### ما هو زوج الكلمات؟

زوج الكلمات هو زوج من كلمتين متتاليتين. في جملة "the cat sat on the mat"، تكون أزواج الكلمات:

```
(the, cat), (cat, sat), (sat, on), (on, the), (the, mat)
```

يمثل كل زوج تحولًا من كلمة إلى الكلمة التالية. بعدّ كل التحولات في المتن، تبني نموذجًا إحصائيًا للمتتاليات الكلامية.

### بناء القاموس المتداخل

جدول أزواج الكلمات قاموس من قواميس. المفتاح الخارجي هو الكلمة الحالية؛ والقاموس الداخلي يربط الكلمات التالية بأعدادها:

```python
def build_bigrams(tokens):
    bigrams = {}
    for i in range(len(tokens) - 1):
        current = tokens[i]
        next_word = tokens[i + 1]
        if current not in bigrams:
            bigrams[current] = {}
        bigrams[current][next_word] = bigrams[current].get(next_word, 0) + 1
    return bigrams
```

مرر عبر قائمة الرموز بنافذة منزلقة حجمها 2. لكل زوج `(tokens[i], tokens[i+1])`، زد العدد في `bigrams[tokens[i]][tokens[i+1]]`.

### مثال للسير خطوة بخطوة

بالنسبة للرموز `["the", "cat", "sat", "the", "dog"]`:

```
i=0: current="the", next="cat" → bigrams["the"]["cat"] = 1
i=1: current="cat", next="sat" → bigrams["cat"]["sat"] = 1
i=2: current="sat", next="the" → bigrams["sat"]["the"] = 1
i=3: current="the", next="dog" → bigrams["the"]["dog"] = 1
```

النتيجة:
```python
{
    "the": {"cat": 1, "dog": 1},
    "cat": {"sat": 1},
    "sat": {"the": 1},
}
```

### استخدام defaultdict لكود أنظف

```python
from collections import defaultdict

def build_bigrams(tokens):
    bigrams = defaultdict(lambda: defaultdict(int))
    for i in range(len(tokens) - 1):
        bigrams[tokens[i]][tokens[i + 1]] += 1
    return dict(bigrams)
```

ينشئ `lambda: defaultdict(int)` قاموسًا داخليًا جديدًا تلقائيًا لكل كلمة جديدة، فلا تحتاج أبدًا إلى التحقق من وجود مفتاح.

### فحص جدول أزواج الكلمات

تحقق من أن جدولك يبدو منطقيًا:

```python
bigrams = build_bigrams(tokens)

# How many words have followers?
print(f"Words with followers: {len(bigrams)}")

# Show the top word's followers
top_word = max(bigrams, key=lambda w: sum(bigrams[w].values()))
print(f"Most connected word: '{top_word}'")
print(f"  Followers: {bigrams[top_word]}")
```

### حدود الجُمل

عند بناء أزواج كلمات من جمل متعددة، تصبح آخر كلمة من جملة وأول كلمة من التالية زوجًا. وهذا عادةً مقبول لنموذج صغير — فلا يعرف النموذج بنية الجمل على أي حال. لكن إذا أردت نتائج أنظف، يمكنك إضافة علامات حد الجملة:

```python
def build_bigrams(tokens, add_boundaries=True):
    bigrams = defaultdict(lambda: defaultdict(int))
    for i in range(len(tokens) - 1):
        bigrams[tokens[i]][tokens[i + 1]] += 1
    if add_boundaries:
        bigrams["<END>"] = defaultdict(int)
        bigrams[tokens[-1]]["<END>"] = bigrams[tokens[-1]].get("<END>", 0) + 1
    return dict(bigrams)
```

يسمح لك هذا بتتبع الكلمات التي تنهي الجُمل غالبًا.

## جرّب بنفسك

ابنِ جدول أزواج كلمات من المتن وأجب:
1. كم عدد أزواج الكلمات الفريدة الموجودة؟
2. ما أشهر 3 أزواج (كلمة، تالية)؟
3. هل لـ "the" توابع أكثر من أي كلمة أخرى؟

```python
from collections import defaultdict

texts = load_corpus("slm-corpus.csv")
tokens = tokenize(" ".join(texts))
bigrams = build_bigrams(tokens)

total_pairs = sum(sum(f.values()) for f in bigrams.values())
print(f"Unique bigram pairs: {total_pairs}")
```

## الخلاصات الرئيسية

- زوج الكلمات زوج من كلمتين متتاليتين — أبسط نموذج متتالية
- جدول أزواج الكلمات قاموس متداخل: `bigrams[word] = {follower: count}`
- `defaultdict(lambda: defaultdict(int))` يبسّط العدّ المتداخل
- يمكن تتبع حدود الجُمل برموز خاصة مثل `<END>`

## تحدي الممارسة

اكتب دالة `most_common_bigram(bigrams)` تُرجع الزوج `(word, follower)` الأكثر تكرارًا كمجموعة. ثم استخدمها لإيجاد أكثر زوج كلمات شيوعًا في المتن.

```python
def most_common_bigram(bigrams):
    best = (None, None)
    best_count = 0
    for word, followers in bigrams.items():
        for follower, count in followers.items():
            if count > best_count:
                best = (word, follower)
                best_count = count
    return best, best_count
```