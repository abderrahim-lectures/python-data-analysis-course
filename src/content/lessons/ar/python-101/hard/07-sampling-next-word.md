---
title: "أخذ عينة من الكلمة التالية"
description: "استخدم random.choices() لاختيار الكلمة التالية من توزيع احتمالي موزون باحتمالات أزواج الكلمات."
module: "generate-text"
order: 7
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "استخدام random.choices(population, weights) لتنفيذ اختيار عشوائي موزون"
  - "فهم كيف تؤثر الأوزان في احتمال كل نتيجة"
  - "ضبط بذرة عشوائية (seed) لنتائج قابلة للتكرار"
  - "أخذ عينة من جدول أزواج الكلمات لاختيار الكلمة التالية بالنظر إلى كلمة حالية"
prerequisites: ["06-normalizing-bigrams"]
tags: ["بايثون", "عشوائية", "عينة", "موزون", "معالجة-لغة-طبيعية"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "ماذا تفعل random.choices() لأخذ عينة الكلمات؟"
    options:
      - text: "تختار كلمة واحدة عشوائيًا"
      - text: "تختار كلمة موزونة باحتمالها"
        correct: true
      - text: "ترتّب الكلمات حسب التكرار"
      - text: "تزيل الكلمات المكررة"
  - question: "لماذا نستخدم أوزانًا بدلًا من احتمالات متساوية عند أخذ العينات؟"
    options:
      - text: "لأنها تعمل أسرع"
      - text: "لأن الكلمات الأكثر تكرارًا يجب أن تكون الأكثر احتمالًا للاختيار"
        correct: true
      - text: "لأنها تستخدم ذاكرة أقل"
      - text: "لأنها تجعل المخرج أقصر"
  - question: "ماذا يحدث إذا أخذت عينة بأوزان weights=[0.5, 0.3, 0.2]؟"
    options:
      - text: "لكل كلمة فرصة متساوية"
      - text: "احتمال الكلمة الأولى 50% والثانية 30% والثالثة 20%"
        correct: true
      - text: "تُرتَّب الكلمات حسب الوزن"
      - text: "تُختار الكلمة الأولى فقط دائمًا"
---

محرّك توليد النص

هو توليد النص، في جوهره، مشكلة أخذ عينات. بالنظر إلى كلمة حالية، تحتاج إلى اختيار الكلمة التالية من توزيع من الاحتمالات — بعض الكلمات مرجّحة، وبعضها نادر، لكن جميعها ممكنة. يقوم `random.choices()` بهذا تمامًا.

## المفاهيم الأساسية

### أساسيات random.choices()

تختار `random.choices()` عنصرًا أو أكثر من قائمة، موزونة باحتمالاتها:

```python
import random

words = ["cat", "dog", "bird"]
weights = [0.5, 0.3, 0.2]  # probabilities must sum to 1

# Pick one word
result = random.choices(words, weights=weights, k=1)
print(result[0])  # e.g. 'cat'
```

تتحكم المعلمة `k` في عدد العناصر المراد اختيارها. ولتوليد النص، تختار كلمة واحدة في كل مرة.

### أخذ عينات متكرر

لرؤية التوزيع عمليًا، خذ عينات عدة مرات:

```python
import random

words = ["cat", "dog", "bird"]
weights = [0.5, 0.3, 0.2]

counts = {w: 0 for w in words}
for _ in range(1000):
    pick = random.choices(words, weights=weights, k=1)[0]
    counts[pick] += 1

print(counts)
# e.g. {'cat': 502, 'dog': 298, 'bird': 200}
```

مع 1000 عينة، يجب أن تظهر "cat" نحو 500 مرة (50%)، و"dog" نحو 300 مرة (30%)، و"bird" نحو 200 مرة (20%).

### أخذ عينة من نموذج أزواج الكلمات

بالنظر إلى كلمة حالية، ابحث في توابعها داخل النموذج المطبَّع وخذ عينة:

```python
def sample_next(model, current_word):
    if current_word not in model:
        return None  # no followers known
    followers = model[current_word]
    words = list(followers.keys())
    weights = list(followers.values())
    return random.choices(words, weights=weights, k=1)[0]

# Example
current = "the"
next_word = sample_next(model, current)
print(f"After '{current}' comes '{next_word}'")
```

إذا لم تكن الكلمة الحالية موجودة في النموذج (لا توابع معروفة لها)، فعُد `None`. وعلى المستدعي معالجة هذا — إما بإيقاف التوليد أو اختيار كلمة عشوائية للمتابعة.

### قابلية التكرار بالبذور

يستخدم `random.choices()` الحالة العشوائية العامة لبايثون. ضبط بذرة يجعل المخرج قابلاً للتكرار — مفيد للتصحيح والاختبار:

```python
random.seed(42)
print(sample_next(model, "the"))  # always the same word with seed 42

random.seed(99)
print(sample_next(model, "the"))  # might be different
```

### معالجة الحالة القصوى: عدم وجود توابع

بعض الكلمات تظهر فقط في نهاية المتن ولا توابع معروفة لها. عندما يُرجع `sample_next` قيمة `None`، لديك خيارات:

1. **إيقاف التوليد** — الخيار الأكثر تحفظًا
2. **إعادة البدء من كلمة عشوائية** — يُبقي المخرج مستمرًا
3. **إعادة البدء من كلمة شائعة** — اختر من أكثر الكلمات N تكرارًا

يُنتج الخيار 3 عادةً أفضل النتائج:

```python
import random

top_words = ["the", "and", "to", "of", "a"]

def sample_next_or_restart(model, current_word):
    result = sample_next(model, current_word)
    if result is None:
        return random.choice(top_words)  # restart
    return result
```

## جرّب بنفسك

حمّل نموذج أزواج الكلمات المطبَّع وخذ عينة من الكلمة التالية 10 مرات بعد "the":

```python
random.seed(42)
model = load_model("bigram_model.json")  # from previous lesson

for _ in range(10):
    next_word = sample_next(model, "the")
    print(f"the → {next_word}")
```

كم تتسق النتائج؟ جرّب تغيير البذرة — هل تحصل على كلمات مختلفة؟

## الخلاصات الرئيسية

- `random.choices(population, weights, k=1)` ينفذ اختيارًا عشوائيًا موزونًا
- يجب أن تجمع الأوزان إلى 1.0 لتفسير احتمالي صحيح
- `random.seed()` يجعل المخرج قابلاً للتكرار لأغراض التصحيح
- عالج التوابع المفقودة بإعادة البدء من كلمة شائعة

## تحدي الممارسة

اكتب دالة `sample_n(model, word, n)` تُرجع قائمة من n من الكلمات التالية المُختارة عيّنًا لكلمة حالية معطاة. استخدمها لرؤية توزيع توابع "the":

```python
def sample_n(model, word, n=100):
    results = []
    for _ in range(n):
        results.append(sample_next(model, word))
    from collections import Counter
    return Counter(results).most_common()
```