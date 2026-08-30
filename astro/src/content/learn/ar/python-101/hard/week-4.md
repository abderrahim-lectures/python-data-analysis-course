---
title: "الأسبوع 4: توليد النصوص"
section: python-101
track: hard
week: 4
description: "الأسبوع 4: توليد النصوص — python-101 (hard track)."
---


# الأسبوع 4: توليد النصوص بالمعاينة العشوائية (Sampling)

<span class="gamified-flourish">🎰 جدول الاحتمالات هو طاقة كامنة. هذا الأسبوع تُنفقها — تولّد فعليًا جملًا جديدة، كلمة بكلمة.</span>

## 🎯 أهداف التعلّم

بنهاية هذا الأسبوع ستكون قادرًا على:
- شرح الفرق بين *اختيار الكلمة التالية الأرجح دائمًا* و*المعاينة (sampling)* من التوزيع.
- استخدام `random.choices` لمعاينة كلمة تالية موزونة باحتمالات ثنائي الغرام.
- كتابة دالة `generate_text()` تُنتج جملة جديدة، كلمة تلو الأخرى، من جدول ثنائي الغرام.
- جعل التوليد العشوائي قابلًا لإعادة الإنتاج بـ `random.seed`، عندما يكون ذلك مفيدًا.

## الدرس

### طريقتان لاختيار الكلمة "التالية"

بمعطى `probs_table["the"] = {"cat": 0.35, "dog": 0.3, "mouse": 0.1, "mat": 0.15, ...}`، توجد استراتيجيتان مختلفتان لاختيار ما يأتي بعدها:

1. **جشعة (Greedy)**: خذ دائمًا الكلمة الوحيدة الأرجح (`"cat"`، بنسبة 35%). هذه حتمية — نفس المدخل يُنتج دائمًا نفس المخرج — وتصبح متكررة بسرعة، بما أن الكلمة الأعلى احتمالًا بعد "cat" على الأرجح نفسها دائمًا أيضًا.
2. **معاينة (Sampling)**: اختر كلمة *عشوائيًا*، لكن موزونة باحتمالها — بحيث تُختار "cat" حوالي 35% من الوقت، و"dog" حوالي 30%، وهكذا، مطابقة لرمي نرد موزون حيث لكل وجه مساحة مختلفة الحجم، تمامًا مثل المعاينة من أي توزيع منفصل $P(w)$.

يستخدم هذا الأسبوع المعاينة، لأنها ما يجعل النص المُولَّد يتنوّع من تشغيل لآخر — نفس السبب الذي يجعل نموذجًا لغويًا لا يعطيك نفس الرد بالضبط في كل مرة تسأله فيها نفس السؤال.

### المعاينة بـ `random.choices`

تُنفّذ `random.choices(population, weights)` في بايثون هذا بالضبط: بمعطى قائمة نتائج ممكنة وقائمة أوزان مطابقة، تُعيد نتيجة واحدة مُختارة باحتمال متناسب مع وزنها.

```python
import random

def sample_next(word, probs_table):
    if word not in probs_table:
        return None   # لا استمرارية معروفة — طريق مسدود
    next_words = list(probs_table[word].keys())
    weights = list(probs_table[word].values())
    return random.choices(next_words, weights=weights, k=1)[0]

sample_next("the", probs_table)   # مثلًا "cat" — لكن ليس في كل مرة
```

لا تحتاج `weights` أن تجمع بالضبط إلى 1 كي تعمل `random.choices` بشكل صحيح (تُطبّعها داخليًا) — لكن أوزاننا تفعل ذلك بالفعل، بما أنها جاءت مباشرة من `bigram_probabilities` الأسبوع الماضي.

### إمكانية إعادة الإنتاج بـ `random.seed`

العشوائية هي بالضبط ما نريده للتنوع، لكنها تجعل التصحيح ومشاركة النتائج غير عملي — "لقد ولّد جملة غريبة" من الصعب التحقيق فيها إن لم تستطع إعادة إنتاج نفس التشغيل بالضبط. تُثبّت `random.seed(n)` مولّد الأرقام العشوائية في بايثون عند نقطة بداية محددة، بحيث يصبح كل استدعاء لـ `random.choices(...)` بعدها حتميًا *لذلك التشغيل*:

```python
random.seed(42)
print(generate_text(probs_table, "the"))   # نفس المخرج دائمًا، كل مرة تشغّل فيها هذا

random.seed()   # يُعيد العشوائية، عودة للسلوك العادي غير المتوقع
```

هذه تقنية عامة، ليست خاصة بالنماذج اللغوية — أي وقت تحتاج فيه "عشوائي، لكن قابل لإعادة الإنتاج للاختبار"، فإن `random.seed` هي الأداة.

### توليد جملة كاملة

بدءًا من كلمة بذرة، عاين الكلمة التالية مرارًا وأدخلها مرة أخرى كـ"الكلمة السابقة" الجديدة — حلقة، تتوقف إما عند طول ثابت أو عندما تصل `sample_next` إلى طريق مسدود:

```python
def generate_text(probs_table, start_word, max_words=10):
    words = [start_word]
    current = start_word
    for _ in range(max_words - 1):
        next_word = sample_next(current, probs_table)
        if next_word is None:
            break
        words.append(next_word)
        current = next_word
    return " ".join(words)

generate_text(probs_table, "the")
# مثلًا "the cat sat on the rug" — ستختلف من تشغيل لآخر
```

هذا هو اللب التوليدي للنموذج اللغوي بأكمله: لا شيء سوى معاينة موزونة متكررة من جدول مبني من العدّ. إنه نموذج لغوي حقيقي وعامل (وإن كان ضعيفًا جدًا) — بنفس *الفكرة* حقًا لحلقة معاينة الرمز التالي داخل نماذج أكبر بكثير، فقط مُقدَّرة من عدّ 20 جملة بدلًا من مليارات المعاملات المدرَّبة على مجموعات بيانات ضخمة.

### توليد عدة مرشّحات دفعة واحدة

بما أن كل استدعاء لـ `generate_text` عشوائي، فإن توليد عدة جمل ومراجعتها طريقة طبيعية لاستكشاف ما يستطيع النموذج إنتاجه — نفس نمط "عاين قليلًا، اختر الأفضل" المُستخدم عند العمل مع أي نظام توليدي:

```python
def generate_many(probs_table, start_word, n=5, max_words=10):
    return [generate_text(probs_table, start_word, max_words) for _ in range(n)]

for sentence in generate_many(probs_table, "the", n=5):
    print(sentence)
```

## ⚠️ أخطاء شائعة

- **نسيان فحص `None` من `sample_next`.** لو لم تفحص `generate_text` بـ `if next_word is None: break`، لكانت ستتعطل في المرة القادمة التي تحاول فيها البحث عن `None` كمفتاح في `probs_table`.
- **افتراض أن `random.choices` تحتاج أوزانًا تجمع بالضبط إلى 1.** لا تحتاج ذلك — تُطبّع أي أوزان تُعطى لها. هذا مهم إن مررت عدّات خامًا بدلًا من احتمالات مُطبَّعة بالفعل.
- **نسيان أن `random.seed()` (بلا وسيط) تُعيد العشوائية.** بعد التصحيح ببذرة ثابتة، نسيان استدعاء `random.seed()` مجددًا يعني أن كل استدعاء "عشوائي" لاحق في تلك الجلسة يبقى حتميًا، مما قد يبدو كخطأ في كود غير مرتبط.
- **توقّع مخرجات صحيحة نحويًا تمامًا.** ليس لدى نموذج ثنائي الغرام مفهوم لتطابق الفاعل والفعل، أو معنى على مستوى الجملة، أو أي شيء يتجاوز "ما يتبع عادة هذه الكلمة الواحدة" — هذا قيد حقيقي، وليس خطأً يجب إصلاحه، وهذا بالضبط ما تطلب منك الأسئلة السقراطية أدناه ملاحظته مباشرة.

## 🧩 تحديات

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

استدعِ `generate_text` خمس مرات بنفس `start_word`. هل المخرجات متطابقة؟ لماذا أو لماذا لا؟

<p class="challenge__answer">💡 <strong>Answer:</strong> استدعِ <code>generate_text(probs_table, "the")</code> خمس مرات متتالية واطبع كل نتيجة — بما أن المعاينة عشوائية، يجب أن ترى جملًا مختلفة على الأقل حتى بنفس كلمة البداية بالضبط.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

استدعِ `generate_text` بـ`start_word` لا تظهر أبدًا كأول كلمة في ثنائي غرام في أي مكان بمجموعة النصوص (وجدت مرشحات لهذا في التحدي 3 الأسبوع الماضي). ماذا يحدث، ولماذا؟

<p class="challenge__answer">💡 <strong>Answer:</strong> اختر كلمة لا تبدأ أبدًا ثنائي غرام في مجموعة النصوص (مثل كلمة تظهر فقط كآخر كلمة في جملة) كـ<code>start_word</code>؛ ستُعيد <code>sample_next</code> فورًا <code>None</code> بما أن تلك الكلمة ليست مفتاحًا في <code>probs_table</code>، لذا تُعيد <code>generate_text</code> فقط كلمة البذرة تلك.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

عدّل `generate_text` بحيث تتوقف مبكرًا إن اختيرت نفس الكلمة 3 مرات متتالية (حماية بسيطة ضد الحلقات المتكررة). في أي ظروف لمجموعة النصوص تعتقد أن هذا قد يحدث فعليًا؟

<p class="challenge__answer">💡 <strong>Answer:</strong> أضف فحصًا: إن تكررت <code>next_word == current</code> (مثلًا تتبّع آخر بضع كلمات في قائمة صغيرة وتوقف إن تكررت نفس الكلمة أكثر من، لنقل، 3 مرات متتالية)، أوقف التوليد مبكرًا. لن يحدث هذا كثيرًا في مجموعة النصوص الصغيرة هذه، لكنه نمط فشل حقيقي لحلقات المعاينة الساذجة في مجموعات أكبر.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

اكتب `sample_next_greedy(word, probs_table)` تختار دائمًا الكلمة التالية الوحيدة *الأرجح* بدلًا من المعاينة العشوائية. شغّل `generate_text` (باستخدام هذه النسخة الجشعة) خمس مرات بنفس كلمة البداية — ماذا تلاحظ؟

<p class="challenge__answer">💡 <strong>Answer:</strong> غيّر <code>sample_next</code> لتختار <code>max(probs_table[word], key=lambda w: probs_table[word][w])</code> بدلًا من <code>random.choices</code> — هذه استراتيجية "الجشع" من الدرس. استدعاء <code>generate_text</code> مرارًا بنفس كلمة البداية سيُنتج الآن دائمًا نفس الجملة بالضبط.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

استدعِ `random.seed(1)` قبل توليد جملة، سجّل النتيجة، ثم استدعِ `random.seed(1)` مجددًا قبل توليد جملة أخرى بنفس الوسائط. هل النتيجتان متطابقتان؟ لماذا؟

<p class="challenge__answer">💡 <strong>Answer:</strong> استدعِ random.seed(1)، ثم generate_text(...)، ثم random.seed(1) مجددًا، ثم generate_text(...) بنفس الوسائط -- يجب أن يتطابق المخرجان، بما أن إعادة الضبط لنفس البذرة تُعيد تشغيل نفس تسلسل الاختيارات "العشوائية" بالضبط.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

باستخدام `generate_many`، ولّد 20 جملة مرشحة من نفس كلمة البداية، ثم اطبع أيًا كانت *الأطول* (لديها أكثر الكلمات).

<p class="challenge__answer">💡 <strong>Answer:</strong> استخدم generate_many لإنتاج، لنقل، 20 جملة، ثم اختر الجملة صاحبة أكثر الكلمات (باستخدام max(..., key=len) على الجمل المُقسَّمة، أو مقارنة len(sentence.split())) كمقياس تقريبي بسيط لـ"أكثر مخرج تطورًا".</p>

</div>
</details>

## 🤔 أسئلة سقراطية

- تُدخل المعاينة العشوائية عمدًا. هل يمكنك التفكير في حالة استخدام واقعية لنموذج لغوي تريد فيها فعليًا السلوك الجشع، دائمًا-نفس-الإجابة بدلًا من ذلك؟
- تُعيد `sample_next` قيمة `None` عندما لا يكون للكلمة الحالية استمرارية معروفة. أي تشبيه واقعي لهذا "الطريق المسدود" — هل هو أقرب لكون النموذج غير متأكد، أم لكون النموذج لم يرَ هذا الموقف حرفيًا من قبل؟
- يمكن لنموذج ثنائي الغرام هذا أن يولّد فقط متتاليات كلمات *معقولة إحصائيًا بمعطى انتقالات كلمة واحدة* — ليس لديه مفهوم لكون الجملة "منطقية" ككل. ولّد عدة جمل وابحث عن جمل غريبة أو بلا معنى نحويًا رغم أن كل زوج كلمات منفرد معقول محليًا. بماذا يوحي هذا عن حدود النظر إلى كلمة واحدة فقط للخلف؟
- تجعل `random.seed` عملية عشوائية قابلة لإعادة الإنتاج للتصحيح، لكن التطبيقات الحقيقية للنماذج اللغوية (مثل روبوت محادثة) عادة لا تُثبّت البذرة. لماذا قد يكون *عدم* تثبيتها الخيار الصحيح هناك، رغم أن ذلك يجعل الأخطاء أصعب لإعادة الإنتاج؟

## ✅ اختبار الأسبوع

<div class="quiz" data-quiz="python-101-hard-week-4">
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">1. ماذا تفعل random.choices(population, weights=weights)؟</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">تُعيد دائمًا العنصر الأعلى وزنًا</button>
        <button class="quiz-q__opt" data-idx="1">تُعيد عناصر باحتمال متناسب مع وزنها</button>
        <button class="quiz-q__opt" data-idx="2">تُعيد كل عنصر مرة واحدة بالضبط، بترتيب عشوائي</button>
        <button class="quiz-q__opt" data-idx="3">تتجاهل الأوزان وتختار عشوائيًا بتوزيع منتظم</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="2">
        <p class="quiz-q__prompt">2. لماذا يُعطي استدعاء generate_text() عدة مرات بنفس كلمة البداية نتائج مختلفة؟</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">إنه خطأ برمجي</button>
        <button class="quiz-q__opt" data-idx="1">يتغيّر probs_table بين الاستدعاءات</button>
        <button class="quiz-q__opt" data-idx="2">تستخدم sample_next معاينة عشوائية، وليس اختيارًا جشعًا ثابتًا</button>
        <button class="quiz-q__opt" data-idx="3">قواميس بايثون غير مرتبة</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">3. تُعيد sample_next القيمة None عندما:</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">لا تجمع الأوزان إلى 1</button>
        <button class="quiz-q__opt" data-idx="1">الكلمة المُعطاة ليست مفتاحًا في probs_table (لا استمرارية معروفة)</button>
        <button class="quiz-q__opt" data-idx="2">يُبلَغ max_words</button>
        <button class="quiz-q__opt" data-idx="3">تُعيد random.choices دائمًا None في النهاية</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">4. تختلف استراتيجية الكلمة التالية &quot;الجشعة&quot; عن المعاينة لأنها:</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">أسرع لكن مطابقة خلاف ذلك</button>
        <button class="quiz-q__opt" data-idx="1">تختار دائمًا الكلمة الوحيدة الأرجح، فهي حتمية</button>
        <button class="quiz-q__opt" data-idx="2">تختار عشوائيًا بتوزيع منتظم متجاهلة الاحتمالات</button>
        <button class="quiz-q__opt" data-idx="3">تعمل فقط مع نماذج أحادي الغرام، لا ثنائي الغرام</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">5. ماذا تفعل random.seed(42)؟</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">تُولّد بالضبط 42 رقمًا عشوائيًا</button>
        <button class="quiz-q__opt" data-idx="1">تُثبّت مولّد الأرقام العشوائية بحيث تصبح الاستدعاءات العشوائية اللاحقة قابلة لإعادة الإنتاج</button>
        <button class="quiz-q__opt" data-idx="2">تحدد القيمة القصوى التي يمكن أن تُعيدها random.choices</button>
        <button class="quiz-q__opt" data-idx="3">ليس لها أي تأثير على random.choices</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <p class="quiz__summary" data-quiz-summary hidden></p>
    </div>

## 🎁 إضافي: معالجة الأخطاء لكلمة بداية سيئة

<div class="bonus">

الآن، استدعاء `generate_text(probs_table, "zzz")` لكلمة ليست حتى في المفردات إطلاقًا يُعيد بصمت `"zzz"` — لا تعطّل، لكن أيضًا لا إشارة مفيدة أن شيئًا خاطئًا. نسخة أكثر احترازًا قد ترفع خطأ واضحًا بدلًا من ذلك:

```python
def generate_text_safe(probs_table, start_word, max_words=10):
    if start_word not in probs_table:
        raise ValueError(f"'{start_word}' never appears as a starting word in this corpus")
    try:
        return generate_text(probs_table, start_word, max_words)
    except Exception as e:
        print(f"Generation failed: {e}")
        return start_word
```

هذا ليس جزءًا من المنهج الأساسي، لكنه نفس فكرة `try`/`except` التي قدّمها الأسبوع 4 من المسار العادي لبايثون 101، مُطبَّقة هنا على خط أنابيب توليد بدلًا من حساب متوسط. جرّب إطلاق `ValueError` عمدًا، وفكّر أين في `generate_text` هذا الأسبوع قد يستحق إضافة حماية مشابهة.

</div>

