---
title: "مولّد النصوص عبر سطر الأوامر"
description: "اربط جميع مراحل المسار في سكربت سطر أوامر واحد باستخدام argparse لتوليد نصوص سهل الاستخدام."
module: "cli-text-generator"
order: 10
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "دمج التحميل ← الترميز ← العدّ ← أزواج الكلمات ← التطبيع ← التوليد في سكربت واحد"
  - "استخدام argparse لقبول وسائط سطر الأوامر لعدد الكلمات وكلمة البداية ودرجة الحرارة"
  - "بناء مسار كامل من طرف إلى طرف يعمل من الطرفية"
  - "اختبار النظام بأكمله وإنتاج نص إنجليزي مقبول"
prerequisites: ["09-temperature-tuning"]
tags: ["بايثون", "سطر-أوامر", "argparse", "مسار", "مشروع-نهائي"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "ما وحدة بايثون المستخدمة لتحليل وسائط سطر الأوامر؟"
    options:
      - text: "os"
      - text: "argparse"
        correct: true
      - text: "sys"
      - text: "cli"
  - question: "ماذا يُنشئ argparse.ArgumentParser()؟"
    options:
      - text: "مقبض ملف"
      - text: "محللًا يستطيع قراءة وسائط سطر الأوامر"
        correct: true
      - text: "اتصال شبكة"
      - text: "اتصال قاعدة بيانات"
  - question: "كيف تصل إلى وسيطة محلَّلة باسم --words؟"
    options:
      - text: "args['words']"
      - text: "args.words"
        correct: true
      - text: "args.getWords()"
      - text: "argparse.words"
---

التجميع النهائي

كل قطعة مبنية ومختبرة على حدة. الآن تربطها في سكربت واحد يمكن للمستخدم تشغيله من سطر الأوامر. هذه ذروة المشروع بأكمله — نموذج لغوي صغير يقرأ متنًا CSV ويولّد نصًا جديدًا.

## المفاهيم الأساسية

### المسار الكامل

إليك التكامل الكامل في دالة واحدة:

```python
import csv
import string
import random
import json
from collections import defaultdict

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
    import math
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
```

### إضافة argparse

يحلل `argparse` وسائط سطر الأوامر حتى يتمكن المستخدمون من التحكم في المخرج:

```python
import argparse

def main():
    parser = argparse.ArgumentParser(description="Tiny Language Model Text Generator")
    parser.add_argument("--corpus", default="slm-corpus.csv", help="Path to CSV corpus")
    parser.add_argument("--start", default="the", help="Starting word")
    parser.add_argument("--words", type=int, default=20, help="Number of words to generate")
    parser.add_argument("--temperature", type=float, default=1.0, help="Temperature (0.1-2.0)")
    parser.add_argument("--seed", type=int, default=None, help="Random seed for reproducibility")
    parser.add_argument("--model", default=None, help="Path to save/load JSON model")

    args = parser.parse_args()

    if args.seed is not None:
        random.seed(args.seed)

    # Load or build model
    if args.model:
        try:
            with open(args.model) as f:
                model = json.load(f)
            print(f"Loaded model from {args.model}")
        except FileNotFoundError:
            print(f"Model not found, building from {args.corpus}...")
            texts = load_corpus(args.corpus)
            tokens = tokenize(" ".join(texts))
            bigrams = build_bigrams(tokens)
            model = normalize_bigrams(bigrams)
            with open(args.model, "w") as f:
                json.dump(model, f)
            print(f"Model saved to {args.model}")
    else:
        texts = load_corpus(args.corpus)
        tokens = tokenize(" ".join(texts))
        bigrams = build_bigrams(tokens)
        model = normalize_bigrams(bigrams)

    # Generate
    output = generate_text(model, args.start, args.words, args.temperature)
    print(f"\n{output}")

if __name__ == "__main__":
    main()
```

### التشغيل من الطرفية

```bash
# Default settings
python generate.py

# Custom options
python generate.py --start "the" --words 30 --temperature 0.7 --seed 42

# Save and reuse model
python generate.py --model bigram_model.json --start "he" --words 15
```

### اختبار المسار

نفّذ اختبارات من طرف إلى طرف للتحقق من أن كل شيء يعمل:

```python
def test_pipeline():
    texts = load_corpus("slm-corpus.csv")
    assert len(texts) > 0, "No data loaded"

    tokens = tokenize(" ".join(texts))
    assert len(tokens) > 0, "No tokens produced"

    bigrams = build_bigrams(tokens)
    assert len(bigrams) > 0, "No bigrams built"

    model = normalize_bigrams(bigrams)
    assert len(model) > 0, "Model is empty"

    text = generate_text(model, "the", length=10)
    assert len(text.split()) > 0, "No text generated"

    print("All tests passed!")
    print(f"Generated: {text}")

test_pipeline()
```

### ما الذي بنيته

في خمسة أسابيع، بنيت مسار معالجة لغة طبيعية كاملاً من الصفر:

1. **الأسبوع 1**: حمّلت متنًا CSV في بايثون
2. **الأسبوع 2**: رمّزت النص وعدّدت تكرارات الكلمات
3. **الأسبوع 3**: بنيت جداول احتمالات أزواج الكلمات وطبَّعتها
4. **الأسبوع 4**: نفّذت أخذ العينات العشوائية الموزون لتوليد النص
5. **الأسبوع 5**: جمعت كل شيء في أداة سطر أوامر بتحكم في درجة الحرارة

هذا هو المسار الأساسي نفسه المستخدم في نماذج اللغة الإنتاجية — مع فروق في حجم البيانات وعدد الوسائط والشبكات العصبية بدلًا من جداول أزواج الكلمات. الأفكار الأساسية (الترميز ← العدّ ← الاحتمال ← أخذ العينات) متطابقة.

## جرّب بنفسك

شغّل المولّد الكامل بإعدادات مختلفة ولاحظ المخرج:

```bash
python generate.py --start "the" --words 20 --temperature 0.5 --seed 1
python generate.py --start "the" --words 20 --temperature 1.0 --seed 1
python generate.py --start "the" --words 20 --temperature 1.5 --seed 1
```

قارن المخرجات. أي درجة حرارة تنتج النص الأكثر قابلية للقراءة؟

## الخلاصات الرئيسية

- المسار الكامل: تحميل ← ترميز ← عدّ ← أزواج كلمات ← تطبيع ← توليد
- يقدّم `argparse` واجهة سطر أوامر نظيفة بوسائط `--flag value`
- تخزين النموذج مؤقتًا عبر JSON يتجنب إعادة البناء من الصفر في كل تشغيل
- يعكس هذا المسار معمارية نماذج اللغة الحقيقية، بمقياس مصغّر فقط

## تحدي الممارسة

وسّع سطر الأوامر بعلم `--interactive` يدخل في حلقة REPL:

```python
parser.add_argument("--interactive", action="store_true", help="Interactive mode")

# In main():
if args.interactive:
    print("Interactive mode. Type 'quit' to exit.")
    while True:
        word = input("Start word: ").strip()
        if word == "quit":
            break
        temp = float(input("Temperature (0.1-2.0): ") or "1.0")
        text = generate_text(model, word, args.words, temp)
        print(f"\n{text}\n")
```