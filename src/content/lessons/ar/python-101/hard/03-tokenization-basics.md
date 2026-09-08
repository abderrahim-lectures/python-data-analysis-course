---
title: "أساسيات الترميز (Tokenization)"
description: "ابنِ دالة tokenize() تقسّم النص الخام إلى رموز كلمات نظيفة باستخدام طرق السلاسل فقط."
module: "tokenization-frequency"
order: 3
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "كتابة دالة tokenize(text) باستخدام str.lower() و str.split() و str.strip()"
  - "إزالة علامات الترقيم من النص قبل التقسيم"
  - "فهم كيف تؤثر قرارات الترميز على مخرجات النموذج"
  - "مقارنة استراتيجيات الترميز المختلفة ومفاضلاتها"
prerequisites: ["02-exploring-corpus"]
tags: ["بايثون", "ترميز", "طرق-سلاسل", "معالجة-لغة-طبيعية"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "ماذا تفعل text.lower().split()؟"
    options:
      - text: "تقسّم على علامات الترقيم ثم تحوّل الأحرف إلى صغيرة"
      - text: "تحوّل الأحرف إلى صغيرة ثم تقسّم على فراغات"
        correct: true
      - text: "تقسّم على فراغات ثم تزيل علامات الترقيم"
      - text: "تحوّل الأحرف إلى صغيرة وتزيل كل المحارف غير الأبجدية"
  - question: "لماذا نستبدل علامات الترقيم بمسافات بدلًا من حذفها فقط؟"
    options:
      - text: "لأن ذلك أسرع"
      - text: "لأن الحذف قد يلصق الكلمات المتجاورة ببعضها"
        correct: true
      - text: "لأن المسافات ضرورية ليعمل split()"
      - text: "لأن ذلك يحافظ على طول النص الأصلي"
  - question: "ما الرمز الذي تنتجه السلسلة cant عند استخدام دالتنا tokenize()؟"
    options:
      - text: "cant"
      - text: "cant"
      - text: "can, t"
        correct: true
      - text: "can, t"
---

من النص الخام إلى الرموز

النص الخام مجرد سلسلة محارف. لبناء نموذج لغوي، تحتاج إلى تقسيمه إلى وحدات منفصلة — **رموز (tokens)** — يمكن للنموذج عدّها والتنبؤ بها. وللتبسيط، سنستخدم الكلمات كرموز. تستخدم النماذج الأكثر تقدمًا رموزًا دون كلمة كاملة (BPE، وSentencePiece)، لكن الترميز على مستوى الكلمة كافٍ لتوضيح الأفكار الأساسية.

## المفاهيم الأساسية

### أبسط مُرمّز

النهج الأساسي هو `str.split()`:

```python
text = "The cat sat on the mat"
tokens = text.split()
print(tokens)  # ['The', 'cat', 'sat', 'on', 'the', 'mat']
```

هذا يعمل، لكن لاحظ: تُعامل "The" و"the" كرمزين مختلفين بسبب الحالات الكبيرة. وبالنسبة لنموذج مبنٍ على التكرارات، نريد احتسابهما ككلمة واحدة.

### تحويل الأحرف إلى صغيرة

دمج كل شيء إلى أحرف صغيرة يوحّد متغيرات الحالة:

```python
text = "The cat sat on the Mat"
tokens = text.lower().split()
print(tokens)  # ['the', 'cat', 'sat', 'on', 'the', 'mat']
```

الآن تحاكي "The" و"mat" الرموز نفسها التي تحاكيها "the" و"Mat" في مواضع أخرى من المتن.

### إزالة علامات الترقيم

علامات الترقيم الملتصقة بالكلمات تخلق رموزًا زائفة — فتصبح "hello," و"hello" كلمتين مختلفتين. أزِل علامات الترقيم قبل التقسيم:

```python
import string

def strip_punctuation(text):
    for char in string.punctuation:
        text = text.replace(char, " ")
    return text

text = "Hello, world! How's it going?"
clean = strip_punctuation(text)
print(clean.lower().split())
# ['hello', 'world', 'how', 's', 'it', 'going']
```

يُستبدل كل محرف ترقيم بمسافة، ثم يعطي التقسيم رموزًا نظيفة. لاحظ أن "How's" تصبح رمزين: "how" و"s". هذه مفاضلة معروفة للترميز البسيط — الأدوات الأكثر تقدمًا تتعامل مع الاختصارات بشكل مختلف.

### الدمج في دالة tokenize()

اجمع كل شيء معًا:

```python
import string

def tokenize(text):
    text = text.lower()
    for char in string.punctuation:
        text = text.replace(char, " ")
    return text.split()

# Test it
sample = "The quick brown fox jumps over the lazy dog."
print(tokenize(sample))
# ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'the', 'lazy', 'dog']
```

تعمل هذه الدالة ثلاثة أشياء بالتتابع: تحويل إلى أحرف صغيرة، وإزالة علامات الترقيم، ثم التقسيم على فراغات. إنها بسيطة وسريعة وكافية لنموذج لغوي صغير.

### لماذا يهم الترميز

تنتج استراتيجيات الترميز المختلفة مفردات مختلفة وسلوكيات نموذج مختلفة:

| المدخل | نتيجة التقسيم | نتيجة الأحرف الصغيرة |
|-------|-------------|-----------------|
| "New York" | ["New", "York"] | ["new", "york"] |
| "can't" | ["can't"] | ["can't"] |
| "hello,world" | ["hello,world"] | ["hello,world"] |

يُظهر المثال الأخير مشكلة: دون إزالة علامات الترقيم أولًا، تبقى "hello,world" رمزًا واحدًا. خطوة `strip_punctuation` لدينا تعالج هذا. لا يوجد ترميز "صحيح" واحد — يعتمد على ما يحتاج نموذجك إلى تعلّمه.

## جرّب بنفسك

رمّز النص التالي واحسب الرموز الناتجة:

```python
text = "To be, or not to be, that is the question. To be is to exist."
tokens = tokenize(text)
print(f"Tokens: {tokens}")
print(f"Count: {len(tokens)}")
```

كم رمزًا فريدًا تحصل عليه؟ أي كلمة تظهر أكثر؟

## الخلاصات الرئيسية

- `str.split()` تقسّم على فراغات — أبسط مُرمّز
- تحويل الأحرف إلى صغيرة يدمج متغيرات الحالة بحيث تُحسب "The" و"the" رمزًا واحدًا
- إزالة علامات الترقيم تمنع رموزًا مثل "hello," و"hello" من الاختلاف
- الترميز خيار تصميمي — لا توجد إجابة صحيحة واحدة لجميع النماذج

## تحدي الممارسة

وسّع `tokenize()` لتحذف أيضًا الرموز الرقمية (الكلمات المكوّنة من أرقام فقط). واكتب اختبارًا:

```python
import string

def tokenize(text):
    text = text.lower()
    for char in string.punctuation:
        text = text.replace(char, " ")
    tokens = text.split()
    return [t for t in tokens if not t.isdigit()]

sample = "I have 3 cats and 2 dogs in year 2024"
print(tokenize(sample))
# ['i', 'have', 'cats', 'and', 'dogs', 'in', 'year']
```