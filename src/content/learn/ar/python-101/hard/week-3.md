---
title: "الأسبوع 3: جداول احتمالات ثنائية الغرام"
section: python-101
track: hard
week: 3
description: "الأسبوع 3: جداول احتمالات ثنائية الغرام — python-101 (hard track)."
---


# الأسبوع 3: جداول احتمالات ثنائية الغرام

<span class="gamified-flourish">🔗 الأسبوع الماضي: "ما الكلمة المرجّحة إطلاقًا؟" هذا الأسبوع: "ما الكلمة المرجّحة *مباشرة بعد هذه*؟"</span>

## 🎯 أهداف التعلّم

بنهاية هذا الأسبوع ستكون قادرًا على:
- استخراج **ثنائيات الغرام (bigrams)** (أزواج كلمات متتالية) من جمل مُجزَّأة.
- بناء قاموس متداخل `dict[str, dict[str, float]]` يربط كل كلمة بتوزيع احتمالي على الكلمات التي تليها.
- شرح، بمثال، لماذا تلتقط ثنائيات الغرام سياقًا لم يستطع النموذج أحادي الغرام التقاطه.
- التعامل مع مشكلة "السياق غير المرئي": ماذا تفعل عندما لا يكون لكلمة أي متابِعات معروفة إطلاقًا.

## الدرس

### ثنائيات الغرام: أزواج كلمات متتالية

**ثنائي الغرام (bigram)** هو زوج من كلمتين متتاليتين. للجملة المُجزَّأة `["the", "cat", "sat"]`، ثنائيات الغرام هي `("the", "cat")` و`("cat", "sat")` — زوج واحد لكل موضع متجاور:

```python
def bigrams(tokens):
    return [(tokens[i], tokens[i + 1]) for i in range(len(tokens) - 1)]

bigrams(["the", "cat", "sat"])
# [('the', 'cat'), ('cat', 'sat')]
```

هذا نفس نمط `range(len(...) - 1)` الذي يظهر كلما احتجت النظر إلى أزواج من الجيران في متتالية — `-1` موجودة لأن الكلمة *الأخيرة* ليس لها كلمة بعدها لتُزاوَج معها. لجملة بها $k$ رمزًا، يوجد دائمًا بالضبط $k - 1$ ثنائي غرام.

### جدول احتمال شرطي

نُقدّر الآن $P(w_n \mid w_{n-1})$ — احتمال الكلمة التالية، *بمعطى فقط الكلمة السابقة مباشرة*. هذا **نموذج ثنائي الغرام**: لا يزال بسياق محدود (ذاكرة كلمة واحدة بالضبط)، لكن أكثر بشكل صارم من ذاكرة النموذج أحادي الغرام المعدومة.

بنية البيانات الطبيعية هي قاموس من قواميس: لكل كلمة $w_{n-1}$، قاموس متداخل يربط كل كلمة تالية ممكنة $w_n$ باحتمالها، مشروطًا بأن تُسبَق بـ $w_{n-1}$:

```python
def bigram_counts(tokenized_sentences):
    table = {}   # word -> {next_word: count}
    for tokens in tokenized_sentences:
        for first, second in bigrams(tokens):
            if first not in table:
                table[first] = {}
            table[first][second] = table[first].get(second, 0) + 1
    return table

def bigram_probabilities(counts_table):
    probs_table = {}
    for word, next_counts in counts_table.items():
        total = sum(next_counts.values())
        probs_table[word] = {w: c / total for w, c in next_counts.items()}
    return probs_table
```

تُعيد `bigram_probabilities` استخدام نفس فكرة "العدّات ← القسمة على الإجمالي" من `to_probabilities` الأسبوع الماضي — الفرق الوحيد أنها تُطبَّق بشكل منفصل على صف كل كلمة الخاص بها في الجدول، بما أن لكل كلمة توزيعها الخاص على ما يتبعها. كل قاموس داخلي `probs_table[word]` يجمع إلى 1 بمفرده، نفس خاصية "المجموع يساوي 1" من الأسبوع الماضي، لكن توزيع واحد لكل كلمة بدلًا من توزيع واحد للمفردات كاملة.

```python
probs_table["the"]
# {'cat': 0.35, 'dog': 0.3, 'mouse': 0.1, 'mat': 0.15, ...}
```

اقرأ `probs_table["the"]["cat"]` كـ $P(\text{"cat"} \mid \text{"the"})$: بمعطى أن الكلمة السابقة كانت "the"، ما احتمال أن تكون "cat" التالية؟

### مشكلة السياق غير المرئي

الكلمة التي تظهر فقط في *نهاية* جملة لا تبدأ أبدًا ثنائي غرام، لذا هي غائبة ببساطة كمفتاح رئيسي في `probs_table` — لا يوجد صف لها إطلاقًا، بما أن `bigram_counts` تضيف مفتاحًا فقط للكلمات التي تظهر كالعنصر *الأول* في أي ثنائي غرام. هذا مهم جدًا للأسبوع 4، حيث ستحتاج فحص `word in probs_table` قبل البحث عن أي شيء، بالضبط نفس النمط الدفاعي لفحص وجود مفتاح قبل الفهرسة في قاموس عادي.

```python
def next_word_distribution(word, probs_table):
    if word not in probs_table:
        return None   # هذه الكلمة لا تبدأ أبدًا ثنائي غرام في مجموعة نصوصنا
    return probs_table[word]
```

حالة "النموذج لم يرَ هذا الموقف حرفيًا أبدًا" هي قيد حقيقي لا مفر منه لأي منهج قائم على العدّ — لا يمكنه أبدًا قول شيء إلا عن أنماط لاحظها فعليًا في بيانات التدريب، موضوع سيعود صراحة في الأسبوع 4.

## ⚠️ أخطاء شائعة

- **افتراض أن كل كلمة هي مفتاح رئيسي في `probs_table`.** فقط الكلمات التي تظهر كالعنصر *الأول* في ثنائي غرام واحد على الأقل تحصل على صف — انظر "مشكلة السياق غير المرئي" أعلاه.
- **الخلط بين `probs_table[word]` و`probs_table[word][other_word]`.** الأولى توزيع كامل (قاموس)؛ الثانية احتمال واحد (عدد عشري). نسيان أيهما لديك يؤدي إلى أخطاء `TypeError` محيّرة لاحقًا.
- **بناء جدول العدّات وجدول الاحتمالات في نفس المرور.** إبقاء `bigram_counts` و`bigram_probabilities` كدالتين منفصلتين (بدلًا من دمجهما) يعني أن لديك العدّات الخام متاحة لاحقًا — مفيد للتحقق المنطقي، ولتجربة توقيت الأسبوع 5، التي تهتم بخطوة *العدّ* تحديدًا.

## 🧩 تحديات

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

باستخدام مجموعة نصوص الأسبوع 1، احسب جدول احتمالات ثنائية الغرام. أيهما أرجح ليتبع "the" مباشرة: "cat" أم "dog"؟

<p class="challenge__answer">💡 <strong>Answer:</strong> ابنِ جدول ثنائي الغرام الكامل بـ <code>bigram_counts</code> ثم <code>bigram_probabilities</code>، وابحث عن <code>probs_table["the"]["cat"]</code> و<code>probs_table["the"]["dog"]</code> مباشرة. أيهما لديه الاحتمال الأكبر هو الأرجح لمتابعة "the" في مجموعة النصوص هذه.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

أي كلمة في مجموعة النصوص تتبعها *أكثر* الكلمات الأخرى المختلفة (أي لديها أكبر قاموس داخلي في `probs_table`)؟

<p class="challenge__answer">💡 <strong>Answer:</strong> كرّر على <code>probs_table</code> واطبع <code>len(probs_table[word])</code> لكل واحدة، أو استخدم <code>max(probs_table, key=lambda w: len(probs_table[w]))</code> لإيجاد الكلمة صاحبة أكثر المتابِعات المختلفة مباشرة.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

اختر كلمة تظهر فقط كآخر كلمة في جملة بمجموعة النصوص. هل هي مفتاح رئيسي في `probs_table`؟ لماذا أو لماذا لا، بمعطى كيفية تعريف `bigrams()`؟

<p class="challenge__answer">💡 <strong>Answer:</strong> الكلمة الأخيرة من جملة لا تظهر أبدًا كالعنصر <code>الأول</code> في ثنائي غرام (فقط كـ<code>الثاني</code>)، لذا هي غائبة كمفتاح رئيسي في <code>probs_table</code> إلا إن ظهرت أيضًا في منتصف جملة أخرى في مكان ما بمجموعة النصوص. البحث عنها مباشرة، مثل <code>probs_table["mat"]</code>، سيرفع <code>KeyError</code> إن لم تبدأ "mat" أبدًا ثنائي غرام في أي مكان بمجموعة النصوص.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

عمّم `bigrams(tokens)` إلى دالة `trigrams(tokens)` تُعيد كل الثلاثيات المتتالية من الكلمات. كيف ستعمّمها أكثر إلى دالة `ngrams(tokens, n)`؟

<p class="challenge__answer">💡 <strong>Answer:</strong> وسّع <code>bigrams</code> إلى <code>ngrams(tokens, n)</code> عامة تُعيد صفوفًا من <code>n</code> رمزًا متتاليًا باستخدام <code>range(len(tokens) - n + 1)</code> والتقطيع، مثل <code>tuple(tokens[i:i+n])</code>. ثنائيات الغرام هي فقط الحالة الخاصة n=2.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

استخدم `next_word_distribution` للبحث بأمان عن كلمة حددتها بالفعل في التحدي 3 كأنها لا تبدأ ثنائي غرام أبدًا. تأكد أنها تُعيد `None` بدلًا من التعطّل.

<p class="challenge__answer">💡 <strong>Answer:</strong> استخدم دالة next_word_distribution المساعدة: استدعها بكلمة تعرف أنها ليست مفتاحًا رئيسيًا أبدًا (مثل كلمة تنهي الجمل فقط)، وتأكد أنها تُعيد None بدلًا من رفع KeyError، ثم تعامل مع حالة None تلك صراحة أينما استدعيتها.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

لكلمة تظهر في *كل من* `counts` أحادي الغرام في الأسبوع 2 و`bigram_counts` هذا الأسبوع، قارن عدّها أحادي الغرام بمجموع قيم صف ثنائي الغرام الخاص بها (`sum(bigram_counts[word].values())`). هل يجب أن يتطابقا؟ افحص بضع كلمات واشرح أي تباينات صغيرة تجدها.

<p class="challenge__answer">💡 <strong>Answer:</strong> لكل مفتاح في جدول عدّات ثنائي الغرام، اجمع قيم قاموسه الداخلي للحصول على إجمالي ظهورات ثنائي غرام لتلك الكلمة، وقارنه بعدّ نفس الكلمة من قاموس عدّات أحادي الغرام في الأسبوع 2 -- يجب أن يتطابقا بالضبط، بما أن كل ظهور لكلمة (باستثناء ربما آخر كلمة في جملة) يبدأ ثنائي غرام واحدًا بالضبط.</p>

</div>
</details>

## 🤔 أسئلة سقراطية

- ابحث عن `probs_table["the"]` وقارنها بـ `probs` الإجمالية من الأسبوع الماضي. هل هما نفس التوزيع؟ بماذا يخبرك هذا عمّا إذا كانت "the" تغيّر ما هو مرجّح أن يأتي بعدها؟
- نموذج ثلاثي الغرام (يشترط الكلمتين *السابقتين*) يلتقط سياقًا أكثر من نموذج ثنائي الغرام. بمعطى صغر مجموعة نصوصنا (20 جملة)، ما المشكلة العملية التي تتوقع أن تواجهها عدّات ثلاثي الغرام والتي تتجنبها عدّات ثنائي الغرام غالبًا؟
- تبني `bigram_probabilities` توزيعًا احتماليًا كاملًا *لكل كلمة* في المفردات. إن كانت المفردات تحتوي $V$ كلمة فريدة، تقريبًا كم رقمًا يمكن أن يحتويه جدول ثنائي الغرام الكامل في أسوأ الحالات (كل كلمة تتبع كل كلمة أخرى مرة واحدة على الأقل)؟ بماذا يوحي هذا عن كيفية تضخم حجم الجدول مع حجم المفردات؟
- تعني مشكلة السياق غير المرئي أن نموذج ثنائي الغرام يمكن أن يكون صامتًا تمامًا عن كلمات لم يرَ أبدًا أنها تبدأ ثنائي غرام. هل يمكنك التفكير في طريقة تجعل النموذج *دائمًا* لديه شيء يقوله، حتى لكلمة غير مرئية — ربما بالرجوع لشيء من الأسبوع الماضي؟
- يطلب منك التحدي 6 مقارنة عدّات أحادي الغرام بعدّات ثنائي الغرام المجمّعة. لمعظم الكلمات تتطابق هذه، لكن *آخر* كلمة في جملة يُنقَص عدّها بشكل منهجي بواحد في نسخة ثنائي الغرام. لماذا واحد بالضبط، ولماذا الكلمة الأخيرة فقط؟

## ✅ اختبار الأسبوع

<div class="quiz" data-quiz="python-101-hard-week-3">
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">1. ثنائي الغرام (bigram) هو:</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">كلمة واحدة</button>
        <button class="quiz-q__opt" data-idx="1">زوج من كلمتين متتاليتين</button>
        <button class="quiz-q__opt" data-idx="2">مفردات مجموعة النصوص كاملة</button>
        <button class="quiz-q__opt" data-idx="3">عتبة احتمال</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="2">
        <p class="quiz-q__prompt">2. ماذا تُمثّل probs_table[&quot;the&quot;][&quot;cat&quot;]؟</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">P(the)</button>
        <button class="quiz-q__opt" data-idx="1">P(cat)</button>
        <button class="quiz-q__opt" data-idx="2">P(cat | the) — احتمال &quot;cat&quot; بمعطى أن الكلمة السابقة كانت &quot;the&quot;</button>
        <button class="quiz-q__opt" data-idx="3">إجمالي عدّ &quot;the&quot; في مجموعة النصوص</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">3. بماذا يجمع كل قاموس داخلي probs_table[word] (تقريبًا)؟</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">0</button>
        <button class="quiz-q__opt" data-idx="1">1</button>
        <button class="quiz-q__opt" data-idx="2">حجم المفردات</button>
        <button class="quiz-q__opt" data-idx="3">يختلف لكل كلمة بلا إجمالي ثابت</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">4. مقارنة بنموذج أحادي الغرام، نموذج ثنائي الغرام:</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">يستخدم سياقًا أقل (لا ذاكرة إطلاقًا)</button>
        <button class="quiz-q__opt" data-idx="1">يستخدم كلمة واحدة من السياق السابق</button>
        <button class="quiz-q__opt" data-idx="2">يستخدم الجملة كاملة كسياق</button>
        <button class="quiz-q__opt" data-idx="3">لا يمكن تمثيله كقاموس</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">5. الكلمة التي لا تظهر أبدًا كالعنصر الأول في أي ثنائي غرام بمجموعة النصوص:</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">يُسند لها احتمال 0 تلقائيًا لكل كلمة تالية ممكنة</button>
        <button class="quiz-q__opt" data-idx="1">غائبة تمامًا كمفتاح رئيسي في probs_table</button>
        <button class="quiz-q__opt" data-idx="2">لا تزال مُضمَّنة، بتوزيع فارغ {}</button>
        <button class="quiz-q__opt" data-idx="3">مستحيلة -- كل كلمة تبدأ ثنائي غرام واحدًا على الأقل</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <p class="quiz__summary" data-quiz-summary hidden></p>
    </div>

