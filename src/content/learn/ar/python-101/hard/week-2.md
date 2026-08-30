---
title: "الأسبوع 2: ترددات الكلمات"
section: python-101
track: hard
week: 2
description: "الأسبوع 2: ترددات الكلمات — python-101 (hard track)."
---


# الأسبوع 2: ترددات الكلمات كتوزيع احتمالي منفصل

<span class="gamified-flourish">🎲 يبدو جدول عدّ الكلمات كسجل محاسبي. إنه في الحقيقة توزيع احتمالي متنكّر.</span>

## 🎯 أهداف التعلّم

بنهاية هذا الأسبوع ستكون قادرًا على:
- بناء جدول تردد كلمات (`dict[str, int]`) من مجموعة نصوص مُجزَّأة.
- تحويل العدّات الخام إلى احتمالات، وشرح لماذا تُشكّل توزيعًا احتماليًا منفصلًا صحيحًا.
- التفكير فيما يمكن وما لا يمكن لنموذج "أحادي الغرام" (unigram) هذا التنبؤ به.
- التعرّف على شكل توزيع تردد الكلمات وفق قانون زيبف (Zipf، توزيع أُسّي).

## الدرس

### عدّ الكلمات

بمعطى قائمة جمل مُجزَّأة (من الأسبوع الماضي)، عدّ عدد مرات ظهور كل كلمة هو بالضبط نمط جدول التردد من الأسبوع 3 من المسار العادي لبايثون 101:

```python
def count_words(tokenized_sentences):
    counts = {}
    for tokens in tokenized_sentences:
        for word in tokens:
            counts[word] = counts.get(word, 0) + 1
    return counts

counts = count_words(tokenized)
counts["the"]   # عدد مرات ظهور "the" عبر مجموعة النصوص كاملة
```

تمتلك المكتبة القياسية فعليًا أداة مبنية خصيصًا لهذا النمط بالتحديد، `collections.Counter` — تستحق المعرفة رغم أننا سنستمر بكتابتها يدويًا في هذا المسار للبقاء بلا اعتماديات:

```python
from collections import Counter

counts = Counter(word for tokens in tokenized for word in tokens)
counts.most_common(5)   # أكثر 5 أزواج (كلمة، عدّ) تكرارًا، مرتبة بالفعل
```

`Counter` هي فئة فرعية من `dict`، لذا كل ما تعرفه بالفعل عن القواميس (`.get()`، `.items()`، الانتماء بـ `in`) لا يزال ينطبق عليها — تضيف فقط بضع تسهيلات خاصة بالعدّ مثل `.most_common()`.

### من العدّات إلى الاحتمالات

يصبح جدول التردد **توزيعًا احتماليًا** بمجرد أن تقسم كل عدّ على إجمالي عدد ظهورات الكلمات. إن كانت $c(w)$ هي عدّ الكلمة $w$ و $N = \sum_w c(w)$ هو إجمالي عدد الكلمات، فإن:

$$
P(w) = \frac{c(w)}{N}
$$

```python
def to_probabilities(counts):
    total = sum(counts.values())
    return {word: count / total for word, count in counts.items()}

probs = to_probabilities(counts)
probs["the"]   # مثلًا 0.18 — احتمال 18% أن تكون أي فتحة كلمة عشوائية هي "the"
```

خاصيتان تجعلان هذا توزيعًا احتماليًا حقيقيًا، لا مجرد "بعض الأرقام":
1. كل $P(w) \ge 0$ — لا يمكن أن يكون العدّ سالبًا أبدًا.
2. $\sum_w P(w) = 1$ — كل ظهور كلمة يُحتسب لكلمة واحدة بالضبط، بحيث تجمع احتمالات كل النتائج الممكنة إلى 1، نفس المتطلب لأي توزيع درسته في مقرر إحصاء.

يمكنك التحقق من الخاصية 2 مباشرة: `sum(probs.values())` يجب أن تكون (قريبة جدًا من) `1.0` — "قريبة جدًا" بسبب عدم دقة الفاصلة العائمة من الأسبوع 1 من المسار العادي.

### هذا نموذج *أحادي الغرام* (unigram)

تقدير $P(w)$ بهذه الطريقة يتجاهل كل السياق — نفس الاحتمال لـ"the" سواء تبعت "sat on" أو بدأت جملة جديدة تمامًا. يُسمى هذا نموذج **أحادي الغرام**: ينظر إلى كلمة واحدة في كل مرة، بلا ذاكرة لما سبق. إنه نموذج لغوي حقيقي وصالح — لكنه ضعيف للغاية، بما أن اللغة الحقيقية معتمدة على السياق بشدة (تعني "bank" بعد "river" شيئًا مختلفًا عن بعد "money"). يُصلح الأسبوع القادم هذا، خطوة بخطوة، بالاشتراط على كلمة سابقة **واحدة** — نموذج **ثنائي الغرام** (bigram).

### نمط سترى في كل مكان: قانون زيبف (Zipf's law)

رتّب عدّات كلماتك من الأكثر إلى الأقل تكرارًا وانظر إلى الشكل: حفنة من الكلمات (مثل "the"، "a"، "on") تستحوذ على حصة ضخمة من كل ظهورات الكلمات، بينما تظهر معظم كلمات المفردات مرة أو مرتين فقط. هذا ليس خاصًا بمجموعة نصوصنا الصغيرة — إنه نمط تجريبي قوي للغاية في النصوص الحقيقية يُسمى **قانون زيبف**: تردد الكلمة يتناسب تقريبًا عكسيًا مع رتبتها، $c(w) \propto \frac{1}{\text{rank}(w)}$. تظهر الكلمة الأكثر شيوعًا تقريبًا ضعف تكرار الكلمة الثانية الأكثر شيوعًا، وثلاثة أضعاف الثالثة، وهكذا. يمكنك رؤية نسخة تقريبية من هذا الشكل حتى في مجموعة نصوص من 20 جملة:

```python
ranked = sorted(counts.items(), key=lambda pair: pair[1], reverse=True)
for rank, (word, count) in enumerate(ranked[:10], start=1):
    print(rank, word, count)
```

تُرقّم `enumerate(ranked[:10], start=1)` أفضل 10 مُدخلات بدءًا من 1 بدلًا من 0 المعتادة في بايثون — مفيد كلما كانت "الرتبة" أو "الموضع" مقصودة بالمعنى اليومي الذي يبدأ بواحد.

## ⚠️ أخطاء شائعة

- **البحث عن كلمة مباشرة بدلًا من استخدام `.get()`.** `counts[word] + 1` عند أول ظهور لكلمة يرفع `KeyError`، لأن الكلمة ليست مفتاحًا بعد — تتعامل `.get(word, 0) + 1` بأناقة مع حالة "لم نرَ هذا بعد".
- **نسيان أن المقام يتغير حسب مجموعة النصوص.** `probs["the"]` من مجموعة نصوص و`probs["the"]` من مجموعة نصوص أخرى أكبر ليستا قابلتين للمقارنة المباشرة عمومًا — كل منهما نسبية إلى إجمالي عدد كلمات مجموعتها $N$.
- **الخلط بين "حجم المفردات" و"إجمالي عدد الكلمات".** $N = \sum_w c(w)$ يعدّ كل ظهور (بالتكرارات)؛ حجم المفردات (الأسبوع 1) يعدّ فقط الكلمات *الفريدة*. تقسم `to_probabilities` على $N$، وليس على حجم المفردات — الخلط بينهما يكسر خاصية "المجموع يساوي 1".

## 🧩 تحديات

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

بمعطى `counts` من `count_words`، جِد أكثر 5 كلمات تكرارًا في مجموعة النصوص.

<p class="challenge__answer">💡 <strong>Answer:</strong> استخدم <code>sorted(counts, key=lambda w: counts[w], reverse=True)[:5]</code>، أو بشكل مكافئ رتّب أزواج <code>counts.items()</code> حسب العدّ — نفس نمط الترتيب-بمفتاح من برنامج الملخص في الأسبوع 5 من المسار العادي لبايثون 101.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

تحقق من الخاصية 2 من الدرس: احسب `sum(probs.values())` لمجموعة نصوصك وتأكد أنها (تقريبًا تمامًا) `1.0`.

<p class="challenge__answer">💡 <strong>Answer:</strong> كرّر على <code>probs.values()</code> واجمعها، أو ببساطة <code>sum(probs.values())</code>؛ يجب أن تطبع شيئًا قريبًا جدًا من 1.0 (مثل 0.9999999999999999) بسبب تقريب الفاصلة العائمة، وليس 1.0 بالضبط.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

تُسمى الكلمات التي تظهر مرة واحدة فقط في مجموعة النصوص **hapax legomena**. جِدها كلها، واشرح الاحتمال الذي تُسنده `to_probabilities` لكل منها.

<p class="challenge__answer">💡 <strong>Answer:</strong> الكلمات التي تظهر مرة واحدة فقط سيكون لكل منها نفس الاحتمال الأصغر غير الصفري — يُحسب كـ <code>1 / total</code>. يمكنك إيجادها بتصفية <code>counts</code> للمُدخلات التي عدّها يساوي 1.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

أي احتمال يُسنده هذا النموذج لكلمة لم تظهر أبدًا في مجموعة النصوص، مثل `"giraffe"`؟ ماذا يحدث فعليًا إن كتبت `probs["giraffe"]` مباشرة؟

<p class="challenge__answer">💡 <strong>Answer:</strong> الكلمة التي لم تُرَ أبدًا في مجموعة النصوص عدّها 0، لذا هي غائبة ببساطة عن قاموس <code>counts</code>/<code>probs</code> — البحث عنها مباشرة بـ <code>probs["giraffe"]</code> يرفع <code>KeyError</code> بدلًا من إعادة 0، وهذا سبب أهمية <code>.get(word, 0)</code> هنا أيضًا.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

أعد كتابة التحدي 1 (أكثر 5 كلمات تكرارًا) باستخدام `collections.Counter` و`.most_common()` بدلًا من `sorted()`. هل تحصل على نفس الإجابة؟

<p class="challenge__answer">💡 <strong>Answer:</strong> استخدم collections.Counter مباشرة: Counter(word for tokens in tokenized for word in tokens).most_common(5). قارن ناتجها بإجابة التحدي 1 -- يجب أن تُدرج نفس الكلمات الخمس بنفس الترتيب، فقط محسوبة بأداة مدمجة بدلًا من sorted() يدويًا.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

باستخدام قائمة `ranked` من مثال قانون زيبف، احسب `count * rank` لكل من أفضل 10 كلمات. يتوقع قانون زيبف أن يكون هذا الناتج ثابتًا تقريبًا. هل هذا صحيح لمجموعة نصوصنا الصغيرة؟

<p class="challenge__answer">💡 <strong>Answer:</strong> اطبع الرتبة والعدّ جنبًا إلى جنب لأفضل 10 كلمات مرتبة، ثم احسب count / rank لكل منها -- لمجموعة نصوص تتبع قانون زيبف بشكل معقول، يجب أن تبقى هذه النسبة متشابهة تقريبًا (قريبة من عدّ الكلمة الأولى نفسها) عبر الرتب، بما أن c(w) مضروبة في rank تقريبًا ثابتة تحت c(w) ∝ 1/rank.</p>

</div>
</details>

## 🤔 أسئلة سقراطية

- يمنح النموذج أحادي الغرام "the" احتمالًا عاليًا وثابتًا في كل مكان في الجملة، حتى في البداية تمامًا. هل يتوافق هذا مع حدسك حول أي الكلمات تميل *لبدء* جملة إنجليزية مقابل الظهور في المنتصف؟ ما الناقص من هذا النموذج الذي قد يُصلح ذلك؟
- جملتان مختلفتان، "the cat sat on the mat" و"mat the on sat cat the" (الكلمات مُبعثرة)، تُنتجان جدول تردد كلمات *متطابقًا تمامًا*. بماذا يخبرك هذا عن المعلومات التي يلتقطها النموذج أحادي الغرام وتلك التي لا يلتقطها؟
- لماذا القسمة على إجمالي عدد الكلمات $N$ (كل ظهورات الكلمات) بدلًا من حجم المفردات (الكلمات الفريدة) عند حساب $P(w)$؟ ماذا سيحدث خطأً لخاصية "المجموع يساوي 1" لو قسمت على حجم المفردات بدلًا من ذلك؟
- يظهر قانون زيبف في أكثر بكثير من مجرد ترددات الكلمات — أحجام سكان المدن، توزيع الثروة، وحركة مرور المواقع كلها تُظهر شكلًا مشابهًا "قلة ضخمة، كثرة صغيرة". لماذا قد تميل الظواهر القائمة على العدّ عمومًا لإنتاج هذا النمط، بدلًا من أن يكون كل شيء متساويًا تقريبًا؟
- تحتوي مجموعة نصوصنا فقط على 20 جملة، لذا معظم الكلمات هي hapax legomena (تظهر مرة واحدة بالضبط). ماذا تعتقد يحدث لـ*نسبة* hapax legomena بينما تنمو مجموعة النصوص لتصبح أكبر بكثير — هل تتقلص نحو الصفر، أم يوحي قانون زيبف بأنها تبقى مرتفعة بشكل مفاجئ حتى لمجموعات نصوص ضخمة؟

## ✅ اختبار الأسبوع

<div class="quiz" data-quiz="python-101-hard-week-2">
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">1. لتوزيع احتمالي صحيح على الكلمات، ما الذي يجب أن يساويه sum(probs.values()) (تقريبًا)؟</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">0</button>
        <button class="quiz-q__opt" data-idx="1">1</button>
        <button class="quiz-q__opt" data-idx="2">حجم المفردات</button>
        <button class="quiz-q__opt" data-idx="3">إجمالي عدد الكلمات</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="2">
        <p class="quiz-q__prompt">2. يُقدّر النموذج &quot;أحادي الغرام&quot; احتمال الكلمة بناءً على:</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">الكلمتين السابقتين</button>
        <button class="quiz-q__opt" data-idx="1">الجملة كاملة حتى الآن</button>
        <button class="quiz-q__opt" data-idx="2">لا سياق إطلاقًا — فقط التردد الإجمالي</button>
        <button class="quiz-q__opt" data-idx="3">الكلمة التالية فقط</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="2">
        <p class="quiz-q__prompt">3. أي احتمال يُسنده النموذج أحادي الغرام لكلمة لم تُرَ أبدًا في مجموعة النصوص؟</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">1.0</button>
        <button class="quiz-q__opt" data-idx="1">رقم موجب صغير جدًا</button>
        <button class="quiz-q__opt" data-idx="2">0 (غائبة ببساطة عن الجدول)</button>
        <button class="quiz-q__opt" data-idx="3">يرفع خطأً وقت بناء النموذج</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">4. تُستخدم counts.get(word, 0) + 1 بدلًا من counts[word] + 1 لأن:</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">تعمل أسرع</button>
        <button class="quiz-q__opt" data-idx="1">تتجنب KeyError عند أول ظهور لكلمة</button>
        <button class="quiz-q__opt" data-idx="2">تعمل فقط مع الأرقام</button>
        <button class="quiz-q__opt" data-idx="3">تتصرفان بشكل متطابق، إنه مجرد أسلوب</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="2">
        <p class="quiz-q__prompt">5. أي علاقة يصف قانون زيبف بين رتبة الكلمة وتردّدها؟</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">يزداد التردد مع الرتبة</button>
        <button class="quiz-q__opt" data-idx="1">التردد ثابت تقريبًا بغض النظر عن الرتبة</button>
        <button class="quiz-q__opt" data-idx="2">التردد يتناسب عكسيًا تقريبًا مع الرتبة</button>
        <button class="quiz-q__opt" data-idx="3">لا توجد علاقة عامة</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <p class="quiz__summary" data-quiz-summary hidden></p>
    </div>

