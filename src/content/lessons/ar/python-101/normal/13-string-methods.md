---
title: "طُرُق السلاسل النصية"
description: "عالِج النصوص باستخدام مكتبة بايثون الغنية بطرق التعامل مع السلاسل."
module: "strings"
order: 13
difficulty: "beginner"
estimatedMinutes: 15
learningObjectives:
  - "استخدام طرق السلاسل الشائعة مثل upper و lower و strip"
  - "تقسيم السلاسل وضمّها باستخدام split و join"
  - "البحث داخل السلاسل واستبدالها"
  - "بنيان الاستبدال القابل للتطويع باستخدام replace و strip"
prerequisites: ["12-scope-and-lambdas"]
tags: ["strings", "methods", "split", "join", "strip", "replace"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## السلسلة غير القابلة للتغيير

تكتمل السلسلةُ في لحظةِ إنشائها. وكل طريقةٍ تبدو أنها تعدّلها إنما ترجع في الحقيقة سلسلةً **جديدة**، تاركةً الأصلَ دون مساس:

```python
name = "alice"
upper = name.upper()
print(name)    # alice  (لم تتغير)
print(upper)   # ALICE
```

جديرٌ بأن يُتشرّب كقانون: طرقُ السلاسل لا تُحدث تغييرًا قط؛ إنما تسلّم نسخًا مبنيةً من جديد. وحين تتوقع سلاسلَ جديدة، يصبح العتاد المحمول قابلاً للتنبؤ ، ويتقفّع حلقةُ `while` العرضيةُ التي تبدو لا تفعل شيئًا في إعادة تعيينٍ.

## التقسيم والضم

أكثرُ العمليتين قابليةً للنقل هما معكوسانِ تمامًا. يقسّم التقسيم سلسلةً عند فاصلٍ؛ ويُعيد الضمُّ تسلسلًا متماسكًا بفاصل:

```python
sentence = "hello world python"
words = sentence.split()       # ['hello', 'world', 'python']
back = " ".join(words)         # 'hello world python'

csv_line = "apple,banana,cherry"
fruits = csv_line.split(",")   # ['apple', 'banana', 'cherry']
```

مكتوبتين كمعادلتين، تلغيان بعضَهما:

$$
\text{split}(s, \text{sep}) = [w_1, w_2, \ldots, w_n] \qquad \text{join}(\text{sep}, [w_1, \ldots, w_n]) = w_1 + \text{sep} + w_2 + \cdots + w_n.
$$

لاحظ التفاوت: `split()` بلا وسيطٍ يقسم على جرى مسافات البياض ، فتنطبق مسافاتٌ متعددةٌ ،، بينما المسافةُ الصغيرةُ هي فاصلك في `" ".join(words)`. فاصلُ الضم هو ما تريده *بين* القطع؛ لذلك `","` لا `""`.

## البحث والاختبار

```python
text = "Hello, World!"

text.startswith("Hello")   # True
text.endswith("!")         # True
text.find("World")         # 7  (مؤشر أول تطابق، -1 إذا لم يوجد)
text.count("l")            # 3
text.replace("World", "Python")  # 'Hello, Python!'
```

سؤاال `startswith` و`endswith` سؤالا نعم/لا عن حافّتَي السلسلة ، حرّاسٌ رخيصةٌ تغني عن الشرائح. يجيب `find` عن *الأين*، راجعًا المؤشرَ حيث تبدأ السلسلةُ الفرعية، أو $-1$ حين تفشل الحملة. يعدّ `count` ظهوراتٍ لا تتداخل؛ ويستبدل `replace` كل مطابقةٍ ببديلٍ.

## الأحرف والمسافات

```python
"hello".upper()        # 'HELLO'
"HELLO".lower()        # 'hello'
"  hi  ".strip()       # 'hi'  (يزيل مسافات الطرفين)
"  hi  ".lstrip()      # 'hi ' (اليسرى فقط)
"  hi  ".rstrip()      # '  hi' (اليمنى فقط)
"hello world".title()  # 'Hello World'
```

يقتصّ `strip` الحشوَ الذي تضيفه الملوثات ، المسافاتِ الشائعةَ حول نصٍّ ملصوق. ويحوّل `title` الحرفَ الأولَ من كل كلمةٍ إلى حرفٍ كبير، وهو التنكرُ الضاحي لإهمالَ الإدخال. كلٌّ منها تحويلٌ لهدفٍ واحد، يُبلغ إليه باسمه لا باستظهاره.

## التنسيق المتقدم بـ f-string

إنّ f-string دالةُ تخطيط: أعمدةٌ تصريحيةٌ ودقةٌ. اصطفافٌ بعرضٍ، وتنسيقُ أعدادٍ بمواصفٍ:

```python
price = 19.999
name = "Widget"

# العرض والاصطفاف
print(f"|{name:<15}|")   # |Widget          |  (يسار، عرض 15)
print(f"|{name:>15}|")   # |          Widget|  (يمين)
print(f"|{name:^15}|")   # |     Widget     |  (وسط)

# تنسيق الأعداد
print(f"{price:.2f}")     # 20.00
print(f"{42:05d}")        # 00042  (حشو بالأصفار)
print(f"{0.857:.1%}")     # 85.7%  (نسبة مئوية)
```

مواصفُ `%` ضربٌ صغيرٌ في $100$ مع علامة: $\{0.857 \mapsto 85.7\%\}$. ويقرّب `.2f` إلى منزلتين عشريتين في العرضِ بينما يبقى العددُ الكامنُ سليمًا. والاصطفافُ يحوّل عمودَ قيمٍ متعرّجًا إلى جدولٍ موسوم ، عرضٌ بلا حسابٍ في الجسم.

## مثالٌ محلول: تنظيفُ السطرِ الملصوق

تتجمّعُ الأدواتُ في دائرةٍ لأقذرِ مدخلٍ في العالمِ الحقيقي ، سطرٌ لُصِقَ من جدولٍ:

```python
raw = "  apple, banana, cherry  "
cleaned = raw.strip()
fruits = cleaned.split(", ")
print(fruits)          # ['apple', 'banana', 'cherry']
back = ", ".join(fruits)
print(back)            # 'apple, banana, cherry'
```

ثلاثُ إيماءاتٍ ودائرةٌ واحدةٌ: يقشّرُ `strip` الحشوَ الذي يأتي به اللصقُ، ويقطعُ `split` إلى قطعٍ، ويعيدُ `join` اللصقَ بالفاصلِ المختار. والزوجُ المعكوسُ `split`/`join` هو الجسرُ بين النصِّ والقائمةِ ، العلاقةُ نفسُها التي في معادلةِ الافتتاح.

## أخطاء شائعة

- **نسيان ما هو `split()` بلا وسيط.** يقسم على جرى مسافاتٍ؛ وسؤاله القسمةَ على السلسلةِ الفارغةِ ليس خيارًا يعرضه.
- **توقع أن يرمي `find()` خطأً عند غياب سلاسلَ فرعية.** يرجع $-1$. تأكّد قبل أن تشتري على أساسه.
- **محاولة تعديل سلسلةٍ في موضعها.** لا يوجد تعديلٌ في الموضع؛ أعدِ تعيينَ النتيجة.
- **يجلسُ `join` على الفاصلِ، و`split` على النصِّ.** `" ".join(words)` لا `words.join(" ")` ، الفاصلُ هو مالكُ الطريقةِ، ونسيانُ أيُّهما يُطلقُ `AttributeError`.

## 🧩 تحديات

<details class="challenge">
<summary>🧩 تحدٍّ ، فكّر أولًا ثم أظهر</summary>
<div class="challenge__body">

اكتب `title_case(s)` التي تكبّر الحرفَ الأولَ من كل كلمة: `title_case("hello world")` ← `"Hello World"`.

<p class="challenge__answer">💡 <strong>الجواب:</strong> <code>return s.title()</code> ، الطريقةُ المضمّنةُ في بايثون تفعل هذا بالضبط؛ وأحيانًا يكون السطرُ الواحدُ الحلَّ كلَّه.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 تحدٍّ ، فكّر أولًا ثم أظهر</summary>
<div class="challenge__body">

بمعطى `"one,two,,three"`، قسّم على الفواصلِ وأسقط السلاسلَ الفارغةَ.

<p class="challenge__answer">💡 <strong>الجواب:</strong> <code>[x for x in s.split(",") if x]</code> أو <code>list(filter(None, s.split(",")))</code> ، السلسلةُ الفارغةُ زائفةُ الحقيقة، فيُسقطها فلترُ الصدقِ دون أن يفحص الطول.</p>

</div>
</details>

## 🤔 أسئلة سقراطية

- لماذا يرجع `find()` $-1$ بدلًا من رمي خطأٍ؟ وماذا يكلف كل اختيارٍ؟
- كيف تعكس سلسلةً؟ هل توجد طريقةٌ لذلك أم يقطن الجواب في مكانٍ آخر؟
- متى يكون `str.replace()` الأداةَ الخطأ ، وماذا يلائم استبدالًا أدق؟

## ✅ فحص سريع

<div class="quiz" data-quiz="python-101-string-methods">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">١. ماذا ترجع <code>"a,b,c".split(",")</code>؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">['abc']</button>
      <button class="quiz-q__opt" data-idx="1">['a', 'b', 'c']</button>
      <button class="quiz-q__opt" data-idx="2">'abc'</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>

  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">٢. ماذا ترجع <code>"hello".find("xyz")</code>؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">0</button>
      <button class="quiz-q__opt" data-idx="1">None</button>
      <button class="quiz-q__opt" data-idx="2">-1</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
</div>