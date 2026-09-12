---
title: "العوامل المنطقية"
description: "ادمج الشروط بـ and و or و not ، الروابط المنطقية في بايثون."
module: "operators"
order: 7
difficulty: "beginner"
estimatedMinutes: 12
learningObjectives:
  - "استخدام and و or و not لدمج التعبيرات المنطقية"
  - "فهم التقييم بقصر الدائرة (short-circuit)"
  - "تطبيق قوانين دي مورغان في بايثون"
  - "كتابة شروط معقدة بوضوح"
prerequisites: ["06-comparison-operators"]
tags: ["boolean", "and", "or", "not", "short-circuit", "logic"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 10
section: "python-101"
track: "normal"
---

## بناء شروطٍ من شروط

تُسلّمك عوامل المقارنة قيمةَ صدقٍ واحدة: `True` أو `False`. تسأل بوابة النادي سؤالين معًا ، *«هل تجاوزت سن الرشد، وهل تحمل تذكرة؟»* ، وهذا الاقتران بحد ذاته شرط. تقدم بايثون، مثل المنطق الذي عرفت في الرياضيات، الروابط الثلاثة التي تدمج القضايا:

- $A \land B$ تُكتب `and`
- $A \lor B$ تُكتب `or`
- $\lnot A$ يُكتب `not`

## الروابط الثلاثة

سلوكُها هو جدول الصدق الذي تعرفه. اكتبه في بايثون فيُقرأ مطابقًا:

```python
True and True      # True
True and False     # False
False or True      # True
not True           # False
```

حيث تُجديك حقًّا هو لصق المقارنات في بوابةٍ واحدة. مكانٌ ليلي، تنبيهُ طقسٍ، يوم عمل:

```python
age = 20
has_ticket = True

if age >= 18 and has_ticket:
    print("Welcome in")

temperature = 30
if temperature < 0 or temperature > 40:
    print("Extreme weather!")

is_weekend = False
if not is_weekend:
    print("Time to work")
```

كلُّ واحدٍ منها سؤالٌ واحدٌ مؤلفٌ من أسئلةٍ أصغر ، مثلما ألفَ $0 \leq x < 10$ الفتراتَ في الدرس السابق.

## التقييم بقصر الدائرة

يسرد جدول الصدق الكامل أربعة صفوف، لكن بايثون لا تحتاجها دائمًا. قيّم $A$ `and` $B$ حين تكون $A = \mathrm{False}$: الجواب `False` مهما كانت $B$، فلا تُحسب $B$ أبدًا. وينطبق الجدار نفسه على `or`: بمجرد أن تصبح $A$ مساويةً `True`، يكون الناتج محسومًا. تقرأ بايثون من اليسار إلى اليمين و**تتوقف عند أول جوابٍ حاسم**.

ليست هذه نعمةً أدائية؛ إنه جهازُ أمان:

```python
x = 0
# لا تحدث قسمة أصلًا — الصفر زائف، فيُتخطى النصف الثاني
result = x != 0 and 10 / x > 2
```

لو قيّمت بايثون الطرفين، لانكسر $10/x$ بقسمةٍ على صفر. كلمة `and` بوابةُ تفتيشٍ قبل الإقلاع: ترفض أن تطير بالشرط الثاني ما لم يُخلي السبيلَ الشرطُ الأول. لذلك تكتب بايثون `and`/`or` حيث تكتب لغات عائلة C `&&`/`||` ، تحمل الكلمات نفس قصر الدائرة دون رموز مبهمة.

## مقايضتا دي مورغان

أكثر المتطابقات المنطقية إعادةً للاستخدام تُمرّر النفي عبر رابط:

- $\neg(A \land B) \equiv (\neg A) \lor (\neg B)$ ، `not (A and B)` ≡ `not A or not B`
- $\neg(A \lor B) \equiv (\neg A) \land (\neg B)$ ، `not (A or B)` ≡ `not A and not B`

في بايثون، نفيُ شرطٍ موصولٍ يصير شرطًا موصولًا من النفيين:

```python
# هاتان متكافئتان:
not (age >= 18 and has_ticket)
age < 18 or not has_ticket
```

الصيغة المعاد كتابتها تُقرأ بسلاسة: البوابة لا تفتح لقاصرٍ ولا لغيرِ حاملِ تذكرة. قوانين دي مورغان هي الأداة لتحويل `not (…)` الكثيف الذي تحتاج فكّكه إلى قراءةٍ واضحة.

## جداول الصدق في لمحة

| $A$ | $B$ | $A \land B$ | $A \lor B$ |
|-----|-----|-------------|------------|
| True | True | True | True |
| True | False | False | True |
| False | True | False | True |
| False | False | False | False |

أمّا $\lnot$ فيقلب قيمة الصدق الواحدة: `not True` ← `False`، و`not False` ← `True`.

## مثالٌ محلول: بابُ النادي، حكايةً مزدوجة

بابٌ واحدٌ وحكمٌ واحدٌ وصياغتانِ. ترفضُ قاعدةُ الدخولِ من ليس بالغًا أو لا يحملُ تذكرةً:

```python
age = 20
has_ticket = True

denied = not (age >= 18 and has_ticket)      # False
denied_again = age < 18 or not has_ticket    # False — دي مورغان، مكافئ
```

يقولُ السطرُ الأولُ «ليس صحيحًا أن (بالغٌ ومعهُ تذكرةٌ)»؛ ويقولُ الثاني «قاصرٌ أو بلا تذكرةٍ» ، وجهَا قانونِ دي مورغان، ويجيبانِ معًا جوابًا واحدًا. ويُقرأ الشكلُ المنقوضُ كالجملةِ التي يصفها.

## أخطاء شائعة

- **`and`/`or` يعيدان معاملًا لا قيمةً منطقية.** `0 and 5` يساوي `0`؛ `0 or 5` يساوي `5`. تعيد بايثون القيمة التي حسمت الأمر. الصفرُ الزائفُ هو الذي حسم، فعاد الصفر.
- **`not` يشدّ أقوى من `==`.** تُحلَّل `not a == b` هكذا `not (a == b)` لا `(not a) == b`. ضع أقواسًا عند الشك.
- **كلماتٌ لا رموزَ بتّية.** `True and False` يساوي `False`؛ أمّا `True & False` فهي عملية بتّية على القيمتين بسلوكٍ مختلف. أبقِ `&`/`|` للعمل على مستوى البتات.
- **`and`/`or` كسولانِ كسلًا يخفي الأخطاء.** إذا كان الجانبُ الحاسمُ صادقًا أو كاذبًا فعلًا، لم يُنفَّذ الجانبُ الآخرُ قطّ ، `1 or missing_function()` لا يستدعي الدالةَ أبدًا. نصفٌ ميتٌ لم يرتطمْ قد يخفي اسمًا نسيته.

## 🧩 تحديات

<details class="challenge">
<summary>🧩 تحدٍّ ، فكّر أولًا ثم أظهر</summary>
<div class="challenge__body">

دون تشغيله، تنبّأ بـ `0 and 5` و`0 or 5` و`3 and 5` و`3 or 5`. ما النمط الذي تراه؟

<p class="challenge__answer">💡 <strong>الجواب:</strong> <code>0 and 5</code> ← 0، و<code>0 or 5</code> ← 5، و<code>3 and 5</code> ← 5، و<code>3 or 5</code> ← 3. النمط: <code>and</code> يعيد أول معاملٍ زائف (أو الأخير إن كانت كلها صادقة)؛ و<code>or</code> يعيد أولَ صادق (أو الأخير إن كانت كلها زائفة).</p>

</div>
</details>

<details class="challenge">
<summary>🧩 تحدٍّ ، فكّر أولًا ثم أظهر</summary>
<div class="challenge__body">

أعد كتابة `not (x > 5 and y < 10)` بقانون دي مورغان. هل الصيغة المعاد كتابتها أسهل قراءة؟

<p class="challenge__answer">💡 <strong>الجواب:</strong> <code>not (x &gt; 5 and y &lt; 10)</code> ≡ <code>x &lt;= 5 or y &gt;= 10</code> ، قراءة مباشرة بلا نفيٍ مركبٍ تُفكّ عقده.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 تحدٍّ ، فكّر أولًا ثم أظهر</summary>
<div class="challenge__body">

اكتب شرط السنة الكبيسة: تقبل القسمة على 4، ما عدا القُرون (ما يقبل القسمة على 100) ما لم تكن أيضًا تقبل القسمة على 400. استخدم `and` و`or` و`not`.

<p class="challenge__answer">💡 <strong>الجواب:</strong> <code>(year % 4 == 0 and year % 100 != 0) or (year % 400 == 0)</code> ، تقبل القسمة على 4 لا على 100، أو تقبل القسمة على 400.</p>

</div>
</details>

## 🤔 أسئلة سقراطية

- يعطي `0 and 5` ناتج `0` لا `False`. لماذا تعيد بايثون القيمةَ الحاسمة بدلًا من قيمةٍ منطقية؟ ومتى يصير ذلك نافعًا؟
- إذا كان `or` يعيد أول معاملٍ صادق، فما `"hello" or "world"`؟ وما `"" or "world"`؟
- لماذا تفضل بايثون الكلمات `and` و`or` و`not` على الرموز `&&` و`||` و`!`؟ وماذا يشتري الوضوحُ الإنجليزيُّ للقارئ؟

## ✅ فحص سريع

<div class="quiz" data-quiz="python-101-boolean">
  <div class="quiz-q" data-answer="1">
    <p class="quiz-q__prompt">١. ما ناتج True and False؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">True</button>
      <button class="quiz-q__opt" data-idx="1">False</button>
      <button class="quiz-q__opt" data-idx="2">None</button>
      <button class="quiz-q__opt" data-idx="3">Error</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="0">
    <p class="quiz-q__prompt">٢. إلى ماذا يرجع 0 or 5؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">5</button>
      <button class="quiz-q__opt" data-idx="1">0</button>
      <button class="quiz-q__opt" data-idx="2">True</button>
      <button class="quiz-q__opt" data-idx="3">False</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <div class="quiz-q" data-answer="2">
    <p class="quiz-q__prompt">٣. أيٌّ من الآتي يكافئ not (a and b)؟</p>
    <div class="quiz-q__options">
      <button class="quiz-q__opt" data-idx="0">not a and not b</button>
      <button class="quiz-q__opt" data-idx="1">a or b</button>
      <button class="quiz-q__opt" data-idx="2">not a or not b</button>
      <button class="quiz-q__opt" data-idx="3">a and not b</button>
    </div>
    <p class="quiz-q__feedback" hidden></p>
  </div>
  <p class="quiz__summary" data-quiz-summary hidden></p>
</div>