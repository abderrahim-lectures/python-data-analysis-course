---
title: "تنفيذ generate_text()"
description: "سلِّسِل حلقة أخذ العينات في دالة كاملة تبني متتالية كلمات من نموذج أزواج الكلمات."
module: "generate-text"
order: 8
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "كتابة دالة generate_text(bigrams, start_word, length)"
  - "سلَسة استدعاءات sample_next() في حلقة لبناء متتاليات كلمات"
  - "معالجة الطرق المسدودة (لا توابع معروفة) بأناقة"
  - "التحكم في طول المخرج وتصحيح التوليد باستخدام التسجيل"
prerequisites: ["07-sampling-next-word"]
tags: ["بايثون", "دالة", "توليد-نص", "حلقة", "معالجة-لغة-طبيعية"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "ما حلقة التوليد الأساسية للنص؟"
    options:
      - text: "قراءة الملف كله دفعة واحدة"
      - text: "ابحث عن أزواج كلمات الكلمة الحالية، وخذ عينة من الكلمة التالية، وكرر"
        correct: true
      - text: "اختر أي كلمة من المفردات عشوائيًا"
      - text: "رتّب كل الكلمات أبجديًا"
  - question: "كيف يعرف المولّد الكلمات التي يمكن أن تتبع الكلمة الحالية؟"
    options:
      - text: "يخمّن بناءً على طول الكلمة"
      - text: "يبحث في جدول أزواج الكلمات عن الكلمة الحالية"
        correct: true
      - text: "يختار دائمًا الكلمة الأكثر تكرارًا"
      - text: "يقرأ من الملف الأصلي في كل مرة"
  - question: "ما الذي يحدّ طول النص المولَّد؟"
    options:
      - text: "عدد ثابت من الكلمات (num_words)"
        correct: true
      - text: "حجم الملف"
      - text: "حد التكرار في بايثون"
      - text: "عدد الكلمات الفريدة"
---

نجمع كل شيء معًا

يمكنك تحميل البيانات وترميزها وعدّ الكلمات وبناء أزواج الكلمات وتطبيع الاحتمالات وأخذ عينة من الكلمة التالية. الآن تجمعها في دالة واحدة تولّد النص: اختر كلمة بداية، وخذ عينة من الكلمة التالية، وأعدها كمدخل، وكرر حتى تتنج عددًا كافيًا من الكلمات.

## المفاهيم الأساسية

### حلقة التوليد

المنطق الأساسي حلقة بسيطة:

```python
import random

def generate_text(model, start_word, length=20):
    word = start_word
    result = [word]

    for _ in range(length - 1):
        next_word = sample_next(model, word)
        if next_word is None:
            break  # dead end
        result.append(next_word)
        word = next_word

    return " ".join(result)
```

ابدأ بـ `start_word`، وخذ عينة من الكلمة التالية، وألحقها بالنتيجة، واجعلها الكلمة الحالية الجديدة. كرر `length - 1` مرة (الكلمة الأولى موجودة بالفعل في القائمة).

### معالجة الطرق المسدودة

عندما يُرجع `sample_next()` قيمة `None` (لا توابع معروفة للكلمة الحالية)، لديك ثلاثة خيارات. أبسطها هو التوقف:

```python
if next_word is None:
    break
```

يُنتج هذا مخرجًا أقصر لكنه مضمون الصحة. لمخرج أطول، أعد البدء من كلمة شائعة:

```python
if next_word is None:
    next_word = random.choice(["the", "and", "to", "of", "a"])
```

### اختيار كلمة البداية

تشكّل كلمة البداية المخرج بشكل كبير. البدء بـ "the" يُنتج الإنجليزية العامة؛ والبدء بكلمة نادرة قد يُنتج مخرجًا غير معتاد:

```python
def generate_from_random(model, length=20):
    start = random.choice(list(model.keys()))
    return generate_text(model, start, length)
```

لمزيد من التحكم، دع المستخدم يحدد كلمة البداية.

### الاختبار ببذرة ثابتة

يتطلب تصحيح التوليد مخرجًا قابلاً للتكرار. اضبط البذرة قبل الاستدعاء:

```python
random.seed(42)
print(generate_text(model, "the", length=10))
# Always produces the same output with seed 42
```

### نسخة أكثر متانة

أضف تسجيلًا لتتبع ما يحدث:

```python
def generate_text(model, start_word, length=20, verbose=False):
    word = start_word
    result = [word]

    for i in range(length - 1):
        next_word = sample_next(model, word)
        if verbose:
            print(f"  Step {i+1}: '{word}' → '{next_word}'")
        if next_word is None:
            if verbose:
                print(f"  Dead end at step {i+1}")
            break
        result.append(next_word)
        word = next_word

    return " ".join(result)
```

مع `verbose=True`، يمكنك مشاهدة التوليد خطوة بخطوة.

### كيف يبدو المخرج

عند التشغيل على المتن:

```python
random.seed(123)
text = generate_text(model, "the", length=15)
print(text)
```

قد يُنتج شيئًا مثل:

```
the old man had been a good teacher and he had a
```

لن يكون المخرج مثاليًا نحويًا — هذا نموذج صغير بسياق أزواج كلمات فقط. لكنه يلتقط متتاليات كلمات إنجليزية حقيقية لأن احتمالات أزواج الكلمات من نص فعلي.

## جرّب بنفسك

ولّد 5 نصوص مختلفة طول كل منها 20، يبدأ كل منها بكلمة مختلفة:

```python
random.seed(42)
starts = ["the", "a", "he", "she", "it"]
for word in starts:
    text = generate_text(model, word, length=20)
    print(f"\n[{word}] {text}")
```

## الخلاصات الرئيسية

- `generate_text()` يسلسل استدعاءات `sample_next()` في حلقة لبناء متتاليات كلمات
- تحدث الطرق المسدودة عندما لا يكون لكلمة توابع معروفة — عالجها بالتوقف أو إعادة البدء
- يؤثر اختيار كلمة البداية بشكل كبير على جودة المخرج
- استخدم `random.seed()` و`verbose=True` للتصحيح

## تحدي الممارسة

اكتب `generate_until(model, start_word, stop_words)` تولّد نصًا حتى تصل إلى كلمة في `stop_words` أو تبلغ 50 كلمة. استخدمها لتوليد نص يتوقف عند كلمات نهاية الجُمل:

```python
def generate_until(model, start_word, stop_words=None, max_length=50):
    if stop_words is None:
        stop_words = set()
    word = start_word
    result = [word]
    for _ in range(max_length - 1):
        next_word = sample_next(model, word)
        if next_word is None or next_word in stop_words:
            break
        result.append(next_word)
        word = next_word
    return " ".join(result)
```