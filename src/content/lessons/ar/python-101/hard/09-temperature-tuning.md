---
title: "ضبط درجة الحرارة (Temperature)"
description: "عدِّل احتمالات أخذ العينات بمعامل درجة حرارة للتحكم في مدى إبداعية أو تحفُّظ مخرجات النموذج."
module: "cli-text-generator"
order: 9
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "تنفيذ معامل درجة حرارة يضاعف احتمالات اللوغاريتم قبل أخذ العينات"
  - "فهم كيف تجعل درجة الحرارة المنخفضة المخرج أكثر حتمية"
  - "فهم كيف تجعل درجة الحرارة المرتفعة المخرج أكثر عشوائية"
  - "تطبيق ضبط درجة الحرارة على توزيعات احتمالات نموذج أزواج الكلمات"
prerequisites: ["08-generate-text-impl"]
tags: ["بايثون", "درجة-حرارة", "عينة", "softmax", "توليد-نص"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "ماذا تفعل درجة الحرارة باحتمالات أخذ العينات؟"
    options:
      - text: "تجعل كل الكلمات متساوية الاحتمال"
      - text: "تحدّد التوزيع الاحتمالي أو تفردّه"
        correct: true
      - text: "تؤثر فقط في الكلمة الأكثر تكرارًا"
      - text: "لا تأثير لها على المخرج"
  - question: "ماذا يحدث عند درجة حرارة 0.1؟"
    options:
      - text: "مخرج عشوائي جدًا"
      - text: "مخرج متوقّع ومتكرر جدًا"
        correct: true
      - text: "مخرج متوازن"
      - text: "لا مخرج على الإطلاق"
  - question: "ماذا يحدث عند درجة حرارة 2.0؟"
    options:
      - text: "مخرج متوقّع جدًا"
      - text: "مخرج عشوائي وإبداعي جدًا"
        correct: true
      - text: "مثل درجة حرارة 1.0 تمامًا"
      - text: "يحدث خطأ"
---

التحكم في الإبداع

نموذج لغوي باحتمالات ثابتة يُنشئ دائمًا النوع نفسه من المخرج ، يتبع المتن حرفيًا. لكن أحيانًا تريد نصًا أكثر إبداعًا ومفاجأةً، وأحيانًا تريد المخرج الأكثر قابلية للتنبؤ وأمانًا. **درجة الحرارة** هي المقبض الذي يتحكم في هذه المفاضلة.

تستخدم الخلايا أدناه الدوال `load_corpus` و`tokenize` و`build_bigrams` و`normalize_bigrams` من الدروس 01 إلى 06، ودالة `sample_next` من الدرس 07، ودالة `generate_text` الحساسة لدرجة الحرارة (نفس التنفيذ الذي ستراه مجمّعًا في الدرس 10). كل صفحة درس تبدأ جلسة بايثون جديدة، لذا شغّل خلية الإعداد هذه أولًا:

```python
import csv
import string
import random
import math
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

def normalize_bigrams(bigrams):
    normalized = {}
    for word, followers in bigrams.items():
        if not followers:
            continue
        total = sum(followers.values())
        normalized[word] = {w: c / total for w, c in followers.items()}
    return normalized

def apply_temperature(probs, temperature):
    log_probs = [math.log(p + 1e-10) for p in probs]
    scaled = [lp / temperature for lp in log_probs]
    max_s = max(scaled)
    exp_s = [math.exp(s - max_s) for s in scaled]
    total = sum(exp_s)
    return [e / total for e in exp_s]

def sample_next(model, current_word, temperature=1.0):
    if current_word not in model:
        return None
    followers = model[current_word]
    words = list(followers.keys())
    probs = list(followers.values())
    if temperature != 1.0:
        probs = apply_temperature(probs, temperature)
    return random.choices(words, weights=probs, k=1)[0]

def generate_text(model, start_word, length=20, temperature=1.0):
    word = start_word
    result = [word]
    for _ in range(length - 1):
        next_word = sample_next(model, word, temperature)
        if next_word is None:
            next_word = random.choice(["the", "and", "to", "of", "a"])
        result.append(next_word)
        word = next_word
    return " ".join(result)

model = normalize_bigrams(build_bigrams(tokenize(" ".join(texts))))
```

## المفاهيم الأساسية

### ما هي درجة الحرارة؟

درجة الحرارة رقم (عادةً بين 0.1 و2.0) يضاعف توزيع احتمالات النموذج قبل أخذ العينات:

- **درجة حرارة منخفضة** (مثلًا 0.2): تحدّد التوزيع ، تصبح الكلمة الأرجح أكثر احتمالًا، وتصبح الكلمات النادرة شبه مستحيلة. المخرج متكرر ومتوقّع.
- **درجة حرارة 1.0**: لا تغيير ، تُستخدم الاحتمالات الأصلية كما هي.
- **درجة حرارة مرتفعة** (مثلًا 1.5): تفردّ التوزيع ، تصبح كل الكلمات أكثر تساويًا في الاحتمال. المخرج أكثر عشوائية وإبداعًا وربما غير ذي معنى.

### الرياضيات: تضخيم احتمالات اللوغاريتم

تعمل درجة الحرارة بقسمة احتمالات اللوغاريتم على قيمة درجة الحرارة ثم التحويل للخلف:

```python
import math

def apply_temperature(probabilities, temperature):
    """Apply temperature scaling to a probability distribution."""
    # Convert to log-probabilities
    log_probs = [math.log(p + 1e-10) for p in probabilities]  # add small epsilon to avoid log(0)

    # Scale by temperature
    scaled = [lp / temperature for lp in log_probs]

    # Convert back to probabilities (softmax-like)
    max_scaled = max(scaled)
    exp_scaled = [math.exp(s - max_scaled) for s in scaled]  # subtract max for numerical stability
    total = sum(exp_scaled)

    return [e / total for e in exp_scaled]
```

تدريج `math.exp(s - max_scaled)` يمنع الفائض ، دون طرح القيمة القصوى، قد تكون الأسّيات كبيرة بشكل فلكي.

### مثال: توزيع ثلاث كلمات

```python
words = ["cat", "dog", "bird"]
probs = [0.7, 0.2, 0.1]

# Low temperature: cat becomes even more dominant
cold = apply_temperature(probs, temperature=0.5)
print("Cold (0.5):", dict(zip(words, [f"{p:.3f}" for p in cold])))
# cat ≈ 0.876, dog ≈ 0.088, bird ≈ 0.036

# High temperature: more uniform distribution
hot = apply_temperature(probs, temperature=2.0)
print("Hot (2.0):", dict(zip(words, [f"{p:.3f}" for p in hot])))
# cat ≈ 0.524, dog ≈ 0.281, bird ≈ 0.195
```

### الدمج مع sample_next()

عدِّل دالة أخذ العينات لتقبل معامل درجة حرارة:

```python
import random

def sample_next(model, current_word, temperature=1.0):
    if current_word not in model:
        return None

    followers = model[current_word]
    words = list(followers.keys())
    probs = list(followers.values())

    if temperature != 1.0:
        probs = apply_temperature(probs, temperature)

    return random.choices(words, weights=probs, k=1)[0]
```

عند `temperature=1.0`، تُستخدم الاحتمالات الأصلية دون تغيير. والقيم الأدنى تحدّد؛ والقيم الأعلى تفردّ.

### تأثيرات درجة الحرارة على التوليد

```python
# Cold: repetitive, predictable
random.seed(42)
for _ in range(3):
    print(generate_text(model, "the", length=10, temperature=0.3))

# Hot: creative, surprising
random.seed(42)
for _ in range(3):
    print(generate_text(model, "the", length=10, temperature=1.5))
```

سترى مع درجة الحرارة المنخفضة العبارات الشائعة نفسها متكررة. ومع درجة الحرارة المرتفعة ستحصل على تركيبات كلمات غير معتادة قد لا تكون منطقية نحويًا.

### إرشادات عملية لدرجة الحرارة

| درجة الحرارة | التأثير | حالة الاستخدام |
|-------------|--------|----------|
| 0.1–0.3 | حتمية جدًا | إعادة إنتاج نص معروف |
| 0.5–0.7 | تحفُّظية | مخرج واقعي وآمن |
| 0.8–1.0 | متوازنة | توليد للأغراض العامة |
| 1.0–1.5 | إبداعية | عصف ذهني وكتابة إبداعية |
| 1.5–2.0 | عشوائية جدًا | مخرج تجريبي ومفاجئ |

بالنسبة لنموذج أزواج كلمات صغير، غالبًا ما تُنتج درجات الحرارة فوق 1.2 كلامًا غير مرتبط لأن النموذج لا يملك سياقًا كافيًا للحفاظ على التماسك عندما تكون العشوائية عالية.

## جرّب بنفسك

ولّد النص نفسه عند ثلاث درجات حرارة مختلفة وقارن:

```python
random.seed(42)
for temp in [0.3, 1.0, 1.5]:
    print(f"\n[temperature={temp}]")
    for _ in range(3):
        print(f"  {generate_text(model, 'the', length=12, temperature=temp)}")
```

أي درجة حرارة تنتج المخرج الأكثر قابلية للقراءة؟ وأيها تنتج الأكثر مفاجأة؟

## الخلاصات الرئيسية

- درجة الحرارة تضاعف توزيعات الاحتمالات: المنخفضة تحدّد، والمرتفعة تفردّ
- درجة الحرارة 1.0 تعني عدم تغيير الاحتمالات الأصلية
- النف ّيذ بتضخيم احتمالات اللوغاريتم: `log_prob / temperature`
- درجة حرارة منخفضة (0.3–0.7) لمخرج متوقّع؛ ومرتفعة (1.0+) لمخرج إبداعي

## تحدي الممارسة

اكتب دالة `compare_temperatures(model, word, temps)` تولّد نصًا عند كل درجة حرارة وتطبع جدول مقارنة:

```python
def compare_temperatures(model, word, temps=[0.3, 0.7, 1.0, 1.5], length=15):
    for temp in temps:
        random.seed(42)
        text = generate_text(model, word, length=length, temperature=temp)
        print(f"  T={temp:.1f}: {text}")
```