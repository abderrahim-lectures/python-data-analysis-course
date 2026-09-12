---
title: "تحويل الأنواع"
description: "حوّل بين int و float و str و bool بشكل صريح — وافهم متى تفشل عمليات التحويل."
module: "python-basics"
order: 4
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "تحويل القيم باستخدام int() و float() و str() و bool()"
  - "فهم البتر (الاقتطاع) مقابل التقريب"
  - "التعرّف على متى تثير عمليات التحويل ValueError"
  - "معالجة نوع قيمة input() بشكل صحيح"
prerequisites: ["03-data-types"]
tags: ["conversion", "casting", "int", "float", "str", "input"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## لماذا تغيّر القيمةُ مجموعتها؟

تكتب سنة ميلادك في استمارة. دالة `input()` في بايثون تسلّمك **سلسلة** — `"2004"`. لكن `"2004"` ليست عددًا بأيّ معنى حسابي: جرّب `"2004" + 26` فتجيب بايثون `"200426"`، لأن `+` بالنسبة إلى سلسلة تعني *الوصل* لا *الجمع*.

أنت تحمل أرقام عددٍ دون أن تحمل العدد. المجموعة التي تنتمي إليها خاطئة. إنّ قيمةً عبرت من لوحة المفاتيح إلى برنامجٍ تصل نصًّا، والنصّ لا يعرف الحساب.

لذلك يحتاج البرنامج باستمرار إلى **تحويل** قيمةٍ من مجموعةٍ إلى أخرى: من `str` إلى `int` قبل حساب سنة، ومن `int` إلى `str` قبل طباعتها بجانب تسمية. تمنحك بايثون أربع دوالٍ لذلك، دالةٌ لكل مجموعةٍ مقصودة.

## أربع دوالّ تحويل

كل دالةٍ تسمى باسم المجموعة التي تُنتجها:

```python
int("42")       # 42     — str -> int   كانت "42" أرقامًا؛ أصبحت الآن عددًا
float("3.14")   # 3.14   — str -> float
str(42)         # "42"   — int -> str    يتحول العدد إلى نصّ
bool(0)         # False  — عدد -> قيمة حقيقة
```

قولُها بصوتٍ عالٍ يكشف معناها: `str(42)` تعني «أعطني نسخة النصّ من $42$». اسم الدالة هو اسم المجموعة المقصودة، والأقواس هي آلة التحويل نفسها.

## التحويل لا يقرّب — بل يبتر

هاك دقّةٌ تكلف المبتدئين أخطاءً حقيقية. تريد الجزء الصحيح من $3.9$. فما الجواب الصحيح؟

$$
3.9 = 3 + 0.9
$$

الغريزة الطبيعية هي التقريب: $4$. لكن `int(3.9)` في بايثون يرجع **$3$**:

```python
int(3.9)        # 3   — يُقطع الجزء العشري، لا يُقرَّب
round(3.9)      # 4   — هذا هو التقريب
```

إنّ `int()` **يبتر**: يتجاهل الجزء الكسري ويبقي ما تبقّى، متّجهًا **نحو الصفر**. يظهر الفرق بمجرد أن تصير الأعداد سالبة:

```python
int(-3.9)       # -3  — نحو الصفر
import math
math.floor(-3.9)  # -4 — نحو سالب اللانهاية
```

خطّ الأعداد يحسم الأمر: البتر يسير نحو $0$، و`math.floor` يسير للأسفل (نحو $-\infty$)، بينما `round` يسير نحو أقرب عددٍ صحيح. اختر ما يطابق ما كنت تقصده بكلمة «الجزء الصحيح».

## بعض التحويلات لا بدّ أن تفشل

عبور القيمة من مجموعةٍ إلى أخرى ليس ممكنًا دائمًا. أيّ من هذه تتخيّل أن ينجح؟

```python
int("hello")    # ValueError: invalid literal for int()
int("3.14")     # ValueError: invalid literal for int()  ("3.14" أرقام فيها نقطة)
float("hello")  # ValueError: could not convert string to float
```

لا يحوي `"hello"` أيّ رقمٍ — لا شيء يُحوَّل، فترفض بايثون. أمّا `int("3.14")` فأخبث: فيه أرقام فعلًا، لكن دالة التحويل `int` لا تقبل إلا كلمة عددٍ صحيح، وليست $3.14$ صحيحة. يجب أن تمرّ عبر `float` إن أردت تصغيرها:

```python
int(float("3.14"))   # 3  — يحلّل 3.14 ثم يبتره إلى 3
```

لاحظ الفلسفة: تفشل بايثون بصوتٍ عالٍ بدلًا من أن تخمّن بصمتٍ ما تقصده. تخمينٌ صامتٌ كان سيفسد بياناتك؛ وخطأٌ جللٌ يوقف البرنامج لتقرر *أنت*.

## الفخّ اليومي: `input()` ترجع سلسلةً دائمًا

في كل مرةٍ بلا استثناء ترجع `input()` قيمة `str` — حتى حين يكتب المستخدم `2004`. العدد الذي تريده لا يزال في الطرف الآخر من تحويلٍ:

```python
year_text = input("Birth year? ")   # str، دائمًا
year = int(year_text)                # الآن صار قادرًا على الحساب
print(f"About {2026 - year} years old")
```

نسيان التحويل أحدُ أكثر الأخطاء المبكرة شيوعًا، وها هي صورة النسيان بالضبط:

```python
age = input("Age? ")
print(age + 1)    # TypeError: can only concatenate str (not "int") to str
```

الخطأ هو الآلة وهي صادقة: `age` تعيش في $\mathbb{S}$ (السلاسل)، والجمع بالسلسلة لا يعني جمعًا. الدرس عادةٌ: *إذا جاءت القيمة من الخارج فحوّلها قبل الحساب بها.*

## مثالٌ محلول: القياسُ المقتطع

يبلّغُ حساسٌ عن `"3.9"` كنصٍّ، وتُظهرُ شاشةٌ وحداتٍ كاملةً فقط. تحويلانِ، ولكلٍّ نيةٌ:

```python
raw = "3.9"
numeric = float(raw)     # 3.9 — يحلل العددَ الحقيقي
whole = int(numeric)     # 3   — يقتطع نحو الصفر
print(f"{whole} units")  # 3 units — تُقطع الـ .9 لا تُقرَّب
```

يفيدُ القمعُ لأن كلَّ خطوةٍ وعدٌ مختلف: يحوّل `float(...)` النصَّ إلى قيمةٍ حقيقيةٍ، ثم يجزّئها `int(...)` نحو الصفر، ولا تطلب قطُّ من دالةٍ أن تفعلَ الأمرينِ معًا. قلْ أيَّ وعدٍ تقصدُ، وتتوقفُ التحويلاتُ عن المفاجأةِ.

## أخطاء شائعة

- **`int("3.14")` يرفع خطأ.** لا يمكنك تحليل سلسلةٍ عشرية إلى `int()` مباشرة. صغّرها بيدك: `int(float("3.14"))` أو `round(float("3.14"))`.
- **`int()` يبتر و`round()` يقرّب.** إنّ `int(4.7)` يساوي `4` لا `5`. اسأل نفسك أيّ عمليةٍ تصفها حقًّا حين تقول «حوّل هذا إلى عدد صحيح».
- **`float("inf")` قيمةٌ صالحة.** تعرف بايثون اللانهاية: `float('inf')`. مفيدة في خوارزميات التحسين؛ مقلقة حين تتسلل إلى نتيجةٍ كنت تتوقعها منتهية.
- **يجزّئ `int()` ويعيدُ تفسير `bool()` في صمت.** يجزّئ `int(3.9)` الكسرَ بصمتٍ؛ ويعيدُ `bool("")` صامتًا `False`. يفشل تحليلُ النصِّ ضجيجًا (`ValueError`)، أما التحويلاتُ من عددٍ إلى عددٍ فهادئةٌ — وإنّ أولئكِ من تُراجع مرتين.

## 🧩 تحديات

<details class="challenge">
<summary>🧩 تحدٍّ — فكّر أولًا ثم أظهر</summary>
<div class="challenge__body">

تنبّأ بقيمة `int(-7.9)` و`-7.9 // 1`. هل هما متساويان؟ اشرح أيّ اختلاف.

<p class="challenge__answer">💡 <strong>الجواب:</strong> <code>int(-7.9)</code> يساوي <code>-7</code> (بترٌ نحو الصفر — يقطع الجزء العشري)، بينما <code>-7.9 // 1</code> يساوي <code>-8.0</code> (أرضية نحو سالب اللانهاية). يتساويان مع الأعداد الموجبة ويختلفان مع السالبة.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 تحدٍّ — فكّر أولًا ثم أظهر</summary>
<div class="challenge__body">

اكتب برنامجًا يطلب اسمًا وسنةَ ميلاد (سؤالان منفصلان عبر `input()`)، ويحسب عمرًا تقريبيًّا، ويطبع جملةً مثل `"Amina, you are about 21 years old."`

<p class="challenge__answer">💡 <strong>الجواب:</strong> اقرأ الاسم والسنة باستدعاءين لـ <code>input()</code>، وحوّل السنة بـ <code>int()</code>، واطرحها من السنة الحالية (مثلًا <code>2026</code>)، ثم اطبع بـ f-string: <code>print(f"{name}, you are about {2026 - year} years old.")</code>.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 تحدٍّ — فكّر أولًا ثم أظهر</summary>
<div class="challenge__body">

دون تشغيله، احسب `15 // 4` و`15 % 4` بيدك ثم تحقق: هل تُعيد $4 \cdot (15 // 4) + (15 \% 4)$ إنتاجَ $15$؟

<p class="challenge__answer">💡 <strong>الجواب:</strong> <code>15 // 4</code> يساوي <code>3</code> (أرضية $3.75$)، و<code>15 % 4</code> يساوي <code>3</code>، لأن $15 = 4 \cdot 3 + 3$. ومعًا: <code>4 * 3 + 3 = 15</code> — هوية القسمة $\text{المقسوم} = \text{المقسوم عليه} \cdot \text{حاصل القسمة} + \text{الباقي}$.</p>

</div>
</details>

## 🤔 أسئلة سقراطية

- ترجع `input()` سلسلةً دائمًا. ما الذي يتعطل في `age + 10` إذا لم تحوّل؟ وما الذي يخبرك به الخطأ فعلًا؟
- لتحويل `"3.14"` إلى عددٍ صحيح، لماذا يفشل `int("3.14")` بينما ينجح `int(float("3.14"))`؟ وما الذي تفعله الخطوة الوسيطة؟
- تملك بايثون `math.floor()` و`math.ceil()`. كيف تختلفان عن `int()` مع الأعداد السالبة؟ ومتى تختار أيًّا منهما؟

## ✅ فحص سريع

<div class="quiz" data-quiz="python-101-conversion">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">١. ما قيمة int(4.7)؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">5</button>
      <button class="quiz-q__opt" data-idx="1">4</button>
      <button class="quiz-q__opt" data-idx="2">4.7</button>
      <button class="quiz-q__opt" data-idx="3">خطأ</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">٢. ماذا ترجع input("Name: ") دائمًا؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">int</button>
      <button class="quiz-q__opt" data-idx="1">float</button>
      <button class="quiz-q__opt" data-idx="2">str</button>
      <button class="quiz-q__opt" data-idx="3">bool</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">٣. ماذا يحدث مع int("3.14")؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">ValueError</button>
      <button class="quiz-q__opt" data-idx="1">3</button>
      <button class="quiz-q__opt" data-idx="2">4</button>
      <button class="quiz-q__opt" data-idx="3">3.14</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>