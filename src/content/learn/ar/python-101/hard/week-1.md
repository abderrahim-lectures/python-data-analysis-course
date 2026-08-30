---
title: "الأسبوع 1: تحميل مجموعة نصوص من CSV"
section: python-101
track: hard
week: 1
description: "الأسبوع 1: تحميل مجموعة نصوص من CSV — python-101 (hard track)."
---


# الأسبوع 1: بناء نموذج لغوي مصغّر — تحميل مجموعة النصوص

<span class="gamified-flourish">🧠 خلال الأسابيع الخمسة القادمة ستبني نموذجًا لغويًا مصغّرًا — نفس الفكرة الأساسية وراء أدوات مثل ChatGPT — باستخدام بايثون الخالصة فقط. بلا مكتبات، بلا اختصارات. بحلول الأسبوع 5 ستشعر بالضبط لماذا لا تُبنى النماذج اللغوية الحقيقية بهذه الطريقة، وهذا الشعور بعدم الراحة هو الهدف بالضبط: إنه دافعك نحو القسم الثاني.</span>

## 🎯 أهداف التعلّم

بنهاية هذا الأسبوع ستكون قادرًا على:
- شرح، على مستوى عام، ما هو النموذج اللغوي: نظام يتنبأ بالكلمة التالية بمعطى الكلمات السابقة.
- تحميل مجموعة نصوص صغيرة من ملف CSV إلى قائمة جمل في بايثون باستخدام المكتبة القياسية فقط.
- تقسيم الجمل إلى قوائم كلمات (مُجزِّئ أولي وساذج)، وشرح حدوده.
- حساب إحصاءات وصفية أساسية عن مجموعة نصوص: عدد الجمل، حجم المفردات، متوسط الطول.

## الدرس

### ما هو النموذج اللغوي؟

يُسند النموذج اللغوي احتمالًا لمتتاليات الكلمات — بشكل غير رسمي، يُجيب عن "بمعطى الكلمات حتى الآن، ما الكلمة المرجّح أن تأتي بعدها؟" إن رأيت العبارة "the cat sat on the ___"، فقد توقعت بالفعل "mat" قبل أن تُنهي هذه الجملة. هذه هي المهمة، بصيغة رسمية: بمعطى كلمات $w_1, \dots, w_{n-1}$، قدّر

$$
P(w_n \mid w_1, \dots, w_{n-1})
$$

تُقدّر النماذج الحقيقية (حتى الكبيرة منها) هذا الاحتمال باستخدام شبكات عصبية ضخمة مدرَّبة على مجموعات بيانات ضخمة. يبدأ هذا الأسبوع نسخة أصغر بكثير: سنقدّره باستخدام **العدّ** فقط، بمجموعة نصوص صغيرة مكتوبة يدويًا، وبايثون خالصة. سيعمل، وبحلول الأسبوع 5 سيكون بطيئًا أيضًا — عمدًا، بحيث يتوقف *سبب* وجود أدوات مثل pandas وnumpy عن كونه ادعاءً مجردًا ويصبح شيئًا شعرت به شخصيًا.

لماذا يتيح لك *العدّ* تقدير احتمال إطلاقًا؟ لأن الاحتمال نفسه، بأبسط معانيه ("التكراري")، هو فقط "كم مرة حدث هذا، من بين كل ما كان يمكن أن يحدث" — $P(\text{event}) \approx \frac{\text{count of that event}}{\text{count of all events}}$. كل ما يبنيه هذا المسار بأكمله، من ترددات الكلمات في الأسبوع 2 حتى توليد النصوص في الأسبوع 4، هو بالضبط تلك النسبة، مُطبَّقة على أسئلة مختلفة حول أي كلمة تتبع أيًا.

### مجموعة النصوص

يعمل هذا المسار مع [`slm-corpus.csv`](/datasets/slm-corpus.csv)، مجموعة صغيرة مكتوبة يدويًا من جمل بسيطة، جملة واحدة في كل صف تحت عمود `sentence`. "مجموعة النصوص" (corpus) هي فقط مجموعة النصوص التي يتعلم منها النموذج اللغوي — مجموعتنا صغيرة عمدًا (20 جملة) بحيث تبقى كل خطوة سريعة بما يكفي للتشغيل والفحص يدويًا في هذه المرحلة المبكرة من الدورة.

:::tip[هذا الملف متوفر بالفعل في بيئة البرمجة]
بيئة البرمجة الخاصة بالزر العائم تحتوي بالفعل على `slm-corpus.csv` محمّلاً مسبقًا — لا حاجة لنسخ أو لصق أي شيء، سيجد `load_corpus("slm-corpus.csv")` أدناه الملف مباشرة.
:::

### تحميلها

أنت تعرف بالفعل `csv.DictReader` من... في الحقيقة، لا تعرفها بعد — تلك مادة الأسبوع 5 من المسار العادي، أسبوع متقدم عن موضع المسار الصعب الآن. بما أن هذا المسار يقفز مباشرة إلى مشروع حقيقي، إليك نفس الفكرة، قائمة بذاتها:

```python
import csv

def load_corpus(path):
    sentences = []
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            sentences.append(row["sentence"])
    return sentences

corpus = load_corpus("slm-corpus.csv")
print(len(corpus), "sentences loaded")
print(corpus[0])
```

تُعيد `load_corpus` قائمة بسيطة `list[str]` — نص واحد لكل جملة. كل قيمة من `csv.DictReader` هي `str`، تمامًا مثل `input()`. لاحظ أن الدالة تقوم بمهمة واحدة بالضبط (تحويل مسار ملف إلى قائمة نصوص جمل) ولا شيء آخر — لا تُجزّئ، لا تعدّ، لا تطبع أي شيء يتجاوز ما يطلبه المستدعي. الحفاظ على كل دالة بنطاق ضيق كهذا هو ما يتيح لك بناء بقية خط أنابيب هذا المسار كقطع صغيرة قابلة للاختبار بشكل منفصل، بدلًا من نص برمجي واحد طويل ومتشابك.

### أول مُجزِّئ (Tokenizer)

قبل أن نتمكن من عدّ الكلمات، نحتاج تقسيم نص الجملة إلى قائمة كلمات منفردة — تُسمى هذه الخطوة **التجزئة (tokenization)**. أبسط مُجزِّئ ممكن يُقسّم فقط عند المسافات البيضاء:

```python
def tokenize(sentence):
    return sentence.lower().split()

tokenize("The cat sat on the mat")
# ['the', 'cat', 'sat', 'on', 'the', 'mat']
```

`.lower()` مهمة: بدونها، ستُعَدّ `"The"` و`"the"` ككلمتين مختلفتين لاحقًا، مما يجعل عدّاتنا للكلمات (الأسبوع القادم) أقل دلالة. `.split()` بلا وسائط تُقسّم عند أي سلسلة من المسافات البيضاء، وهو كافٍ لجمل مجموعتنا النصية البسيطة الخالية من علامات الترقيم.

نسخة أكثر متانة قليلًا تزيل علامات الترقيم الأساسية قبل التقسيم، وهو أمر مهم بمجرد أن تتوقف مجموعتك النصية عن كونها نظيفة عمدًا:

```python
import string

def tokenize_robust(sentence):
    no_punct = sentence.translate(str.maketrans("", "", string.punctuation))
    return no_punct.lower().split()

tokenize_robust("The cat sat on the mat.")
# ['the', 'cat', 'sat', 'on', 'the', 'mat']  -- النقطة النهائية اختفت
```

`string.punctuation` هو نص جاهز مسبقًا من علامات الترقيم الشائعة؛ يبني `str.maketrans("", "", string.punctuation)` جدول تحويل يربط كل من تلك الأحرف بلا شيء، وتُطبّقه `.translate(...)`، فتحذفها فعليًا. يلتزم هذا المسار بـ `tokenize` الأبسط لبقية الأسابيع (مجموعة النصوص خالية من علامات الترقيم عمدًا)، لكن يستحق رؤية شكل خطوة معالجة مسبقة "حقيقية" — هذه الفجوة بالتحديد هي أحد الأسباب العديدة التي تجعل أدوات معالجة اللغة الطبيعية الإنتاجية تستخدم مكتبات تجزئة مخصصة بدلًا من استدعاء `.split()` واحد.

### إحصاءات أساسية لمجموعة النصوص

قبل بناء أي شيء احتمالي، يستحق الأمر مجرد النظر إلى البيانات — نفس الغريزة التي سيُرسّخها مسار التحليل الاستكشافي في القسم الثاني في منهجية كاملة:

```python
tokenized = [tokenize(s) for s in corpus]
lengths = [len(tokens) for tokens in tokenized]

print("Sentences:", len(corpus))
print("Shortest sentence:", min(lengths), "words")
print("Longest sentence:", max(lengths), "words")
print("Average sentence length:", sum(lengths) / len(lengths))
```

حتى هذا القدر الصغير من التنميط يخبرك بشيء مفيد: لو كانت كل جملة في مجموعة النصوص بنفس الطول تمامًا، فسيوحي ذلك بمجموعة بيانات مصطنعة جدًا (أو متكررة جدًا) — يستحق معرفته قبل أن تثق بأي إحصاءات تُحسب منها لاحقًا.

## ⚠️ أخطاء شائعة

- **نسيان `.lower()`.** بدونها، تُعتبر `"The"` و`"the"` رمزين مختلفين تمامًا من منظور بايثون، مما يقسّم بصمت عدّ كلمة واحدة إلى عدّين.
- **افتراض أن `.split()` تتعامل مع علامات الترقيم.** `"mat.".split()` على جملة كاملة تُعطيك رمزًا `"mat."` (بالنقطة ملتصقة) كقطعة واحدة، وليس `"mat"` و`"."` منفصلتين — فجوة حقيقية تطلب منك تحديات هذا الأسبوع ملاحظتها مباشرة.
- **إعادة قراءة الملف كل مرة تحتاج فيها مجموعة النصوص.** تقوم `load_corpus` بعملية إدخال/إخراج ملف، وهي بطيئة نسبيًا — استدعها مرة واحدة، خزّن النتيجة في متغيّر، وأعد استخدام ذلك المتغيّر، بدلًا من استدعاء `load_corpus(...)` مجددًا داخل حلقة.

## 🧩 تحديات

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

باستخدام `load_corpus` و`tokenize` معًا، أنتج قائمة حيث كل عنصر هو النسخة المُجزَّأة (قائمة-كلمات) لجملة واحدة من مجموعة النصوص.

<p class="challenge__answer">💡 <strong>Answer:</strong> استدعِ <code>load_corpus</code>، ثم استخدم list comprehension: <code>[tokenize(s) for s in corpus]</code>. هذا يُنتج قائمة من قوائم — كل قائمة داخلية هي رموز جملة واحدة.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

احسب متوسط عدد الكلمات لكل جملة في مجموعة النصوص.

<p class="challenge__answer">💡 <strong>Answer:</strong> كرّر على الجمل المُجزَّأة وخذ <code>len(tokens)</code> لكل واحدة، ثم استخدم <code>sum(...) / len(...)</code> عبرها كلها — نفس نمط المتوسط من الأسبوعين 4/5 من المسار العادي لبايثون 101، لكن مُطبَّقًا على عدد الرموز بدلًا من الدرجات.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

احسب حجم **مفردات** مجموعة النصوص — عدد الكلمات *الفريدة* التي تظهر في أي مكان في مجموعة النصوص (دون عدّ التكرارات).

<p class="challenge__answer">💡 <strong>Answer:</strong> ابنِ <code>set()</code> وأضف كل رمز من كل جملة مُجزَّأة إليه (أو استخدم set comprehension على قائمة مُسطَّحة)؛ <code>len(...)</code> لتلك المجموعة هو حجم المفردات — عدد الكلمات *الفريدة*، بخلاف إجمالي عدد الكلمات الذي يعدّ التكرارات.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

جمل مجموعة النصوص لا تحتوي عمدًا على أي علامات ترقيم. ما الذي سيحدث خطأً مع أسلوب `tokenize` البسيط `.split()` لو *احتوت* جملة على علامة ترقيم، مثل `"The cat sat on the mat."`؟ جرّبها على ذلك النص وافحص النتيجة.

<p class="challenge__answer">💡 <strong>Answer:</strong> مُجزِّئ .split() الساذج سيتعامل مع <code>"mat."</code> و<code>"mat"</code> كرمزين مختلفين، وستبقى <code>"Amina's"</code> ملتصقة بفاصلتها العليا — علامة الترقيم الملتصقة بكلمة لا تُزال. تتجنب المُجزِّئات الحقيقية (ومجموعة نصوص هذه الدورة) هذا حاليًا بإبقاء الجمل خالية من علامات الترقيم.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

مرّر نفس الجملة المُرقَّمة من التحدي 4 عبر `tokenize_robust` بدلًا من ذلك. هل تُنتج قائمة الرموز التي تتوقعها؟

<p class="challenge__answer">💡 <strong>Answer:</strong> استدعِ <code>tokenize_robust("The cat sat on the mat.")</code> وقارنها بـ <code>tokenize("The cat sat on the mat.")</code> — النسخة المتينة تزيل النقطة النهائية قبل التقسيم، منتجة <code>"mat"</code> بدلًا من <code>"mat."</code> كآخر رمز.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

جِد *أكثر* طول جملة شيوعًا في مجموعة النصوص (بالكلمات) — وليس المتوسط، بل الطول الذي يتكرر أكثر من غيره.

<p class="challenge__answer">💡 <strong>Answer:</strong> كرّر على الجمل المُجزَّأة، ابنِ عدّاد تكرار لأطوال الجمل (مثلًا dict يربط كل طول بعدد الجمل التي تملكه)، وجِد الطول صاحب أعلى عدّاد — نفس نمط "تتبّع حد أقصى جارٍ عبر dict" من الأسبوع 3 من المسار العادي لبايثون 101.</p>

</div>
</details>

## 🤔 أسئلة سقراطية

- تشترط $P(w_n \mid w_1, \dots, w_{n-1})$ *كل* كلمة سابقة. مجموعة نصوصنا الصغيرة تحتوي فقط 20 جملة — هل تعتقد أن لدينا بيانات كافية لتقدير احتمال مشروط بتاريخ طويل؟ ماذا قد نحتاج لتبسيطه؟
- لماذا تُحوّل `tokenize` الجملة إلى أحرف صغيرة قبل التقسيم؟ أي سؤال حول تردد الكلمات من الأسبوع القادم سيُعطي إجابة مضلِّلة لو تخطينا تلك الخطوة؟
- كل من `load_corpus` و`tokenize` دالتان صغيرتان أحاديتا الغرض بدلًا من دالة كبيرة واحدة تفعل كل شيء. ماذا تعلمت في الأسبوع 4 من المسار العادي لبايثون 101 يفسّر سبب فائدة هذا هنا، بخلاف "إنه أنظم فقط"؟
- تزيل `tokenize_robust` *كل* علامات الترقيم، بما فيها الفواصل العليا داخل الاختصارات مثل `"don't"`، محوّلة إياها إلى `"dont"`. هل هذا فعليًا سلوك صحيح لمُجزِّئ حقيقي؟ ماذا ستحتاج لتغييره لمعالجة الاختصارات بشكل خاص؟
- بمعطى الفكرة التكرارية أن "الاحتمال ≈ العدد / الإجمالي"، ماذا تعتقد يحدث لتقديرات احتمالك بينما تنمو مجموعة النصوص من 20 جملة إلى 20,000؟ هل تتوقع أن تصبح التقديرات أكثر أو أقل جدارة بالثقة، ولماذا؟

## ✅ اختبار الأسبوع

<div class="quiz" data-quiz="python-101-hard-week-1">
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">1. ماذا يُقدّر النموذج اللغوي من بين التالي؟</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">الكلمة التالية بالضبط بيقين 100%</button>
        <button class="quiz-q__opt" data-idx="1">احتمال الكلمة التالية بمعطى الكلمات السابقة</button>
        <button class="quiz-q__opt" data-idx="2">ما إذا كانت جملة صحيحة نحويًا</button>
        <button class="quiz-q__opt" data-idx="3">إجمالي عدد الكلمات في مستند</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="2">
        <p class="quiz-q__prompt">2. لماذا تستدعي tokenize() الدالة .lower() قبل .split()؟</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">يجعل الكود يعمل أسرع</button>
        <button class="quiz-q__opt" data-idx="1">يضمن عمل csv.DictReader بشكل صحيح</button>
        <button class="quiz-q__opt" data-idx="2">حتى تُعَدّ &quot;The&quot; و&quot;the&quot; كنفس الكلمة لاحقًا</button>
        <button class="quiz-q__opt" data-idx="3">مطلوب بحكم صياغة بايثون</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">3. ماذا تُعيد load_corpus()؟</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">نصًا طويلًا واحدًا</button>
        <button class="quiz-q__opt" data-idx="1">قائمة نصوص، واحد لكل جملة</button>
        <button class="quiz-q__opt" data-idx="2">dict يربط الكلمات بعدّاتها</button>
        <button class="quiz-q__opt" data-idx="3">كائن ملف CSV</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="2">
        <p class="quiz-q__prompt">4. ماذا يعني &quot;حجم المفردات&quot; لمجموعة نصوص؟</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">إجمالي عدد الكلمات شاملًا التكرارات</button>
        <button class="quiz-q__opt" data-idx="1">عدد الجمل</button>
        <button class="quiz-q__opt" data-idx="2">عدد الكلمات الفريدة</button>
        <button class="quiz-q__opt" data-idx="3">متوسط طول الجملة</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">5. ماذا يحقق دمج string.punctuation مع str.translate في tokenize_robust؟</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">يحوّل النص إلى أحرف كبيرة</button>
        <button class="quiz-q__opt" data-idx="1">يزيل أحرف علامات الترقيم قبل التقسيم</button>
        <button class="quiz-q__opt" data-idx="2">يعدّ عدد علامات الترقيم الموجودة</button>
        <button class="quiz-q__opt" data-idx="3">يترجم الجملة إلى لغة أخرى</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <p class="quiz__summary" data-quiz-summary hidden></p>
    </div>

