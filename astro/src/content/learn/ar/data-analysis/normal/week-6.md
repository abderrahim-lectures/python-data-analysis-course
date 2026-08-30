---
title: "الأسبوع 6: أساسيات Series وDataFrame"
section: data-analysis
track: normal
week: 6
description: "الأسبوع 6: أساسيات Series وDataFrame — data-analysis (normal track)."
---


# الأسبوع 6: أساسيات Series وDataFrame

<span class="gamified-flourish">📐 الجدول ليس فكرة جديدة عليك — إنه مصفوفة بعلامات. توفر pandas فقط دعمًا أصيلًا لهذا في بايثون.</span>

## 🎯 أهداف التعلّم

بنهاية هذا الأسبوع ستكون قادرًا على:
- شرح ما هما `Series` و`DataFrame`، وكيف يرتبطان بمتجه ومصفوفة.
- بناء `DataFrame` من بنى بيانات بايثون، وتحميل واحد من CSV بـ `pd.read_csv`.
- فحص شكل `DataFrame` وأعمدته وأنواع بياناته وفهرسه وإحصاءاته الملخّصة.
- اختيار عمود واحد كـ `Series`، ومعرفة الفرق بين الطريقتين الرئيسيتين لفعل ذلك.

## الدرس

### من قاموس-من-قوائم إلى DataFrame

حسب مشروع الأسبوع 5 المصغّر من بايثون 101 معدلات كل طالب باستخدام `dict`. `DataFrame` هي بنية pandas المُصمَّمة خصيصًا لهذا النوع من البيانات الجدولية — صفوف وأعمدة، بعلامات على كلا المحورين:

```python
import pandas as pd

df = pd.DataFrame({
    "name": ["Amina", "Youssef", "Sara"],
    "score": [88, 74, 95],
})
df
```

يمكنك أيضًا بناء واحدة من قائمة قواميس — نفس شكل "قائمة السجلات" من مثال تضمين المجموعات في الأسبوع 3 من المسار العادي لبايثون 101:

```python
records = [
    {"name": "Amina", "score": 88},
    {"name": "Youssef", "score": 74},
]
pd.DataFrame(records)
```

كلا الشكلين يُنتجان نفس نوع الكائن؛ أيهما أكثر ملاءمة يعتمد فقط على الشكل الذي تكون بياناتك عليه بالفعل — قاموس-من-قوائم عندما تفكر "عمود تلو الآخر"، وقائمة-من-قواميس عندما تفكر "سجل تلو الآخر".

**`Series`** هو عمود واحد بعلامة — فكّر فيه كمتجه $\mathbf{v} \in \mathbb{R}^n$، إلا أن كل مُدخل يحمل أيضًا علامة (فهرسه)، لا موضعًا فقط:

```python
df["score"]        # Series
type(df["score"])   # pandas.core.series.Series
```

**`DataFrame`** هو جدول ثنائي الأبعاد من هذه الأعمدة يشترك في فهرس صفوف واحد — النظير الجدولي لمصفوفة $A \in \mathbb{R}^{m \times n}$، إلا أن الأعمدة يمكن أن تحمل أنواع بيانات مختلفة وكلا المحورين يحملان علامات، لا مواضع رقمية فقط.

### الفهرس (Index)

يمتلك كل `DataFrame` (و`Series`) **فهرس** صفوف — العلامات على الحافة اليسرى — مرئي كلما طبعت واحدًا. افتراضيًا هو فقط `0, 1, 2, ...`، لكن لا يجب أن يكون كذلك:

```python
df.index                       # RangeIndex(start=0, stop=3, step=1) افتراضيًا
df_named = df.set_index("name")   # استخدم عمود "name" كفهرس بدلًا من ذلك
df_named.loc["Amina"]              # يمكنك الآن البحث عن صف بالاسم مباشرة
```

لا تُعدّل `set_index` الـ`df` في مكانه افتراضيًا — تُعيد `DataFrame` *جديدًا* بالتغيير، نفس نمط "يُعيد قيمة جديدة، لا يُعدّل" الذي رأيته بالفعل مع `sorted()` في بايثون 101.

### قراءة CSV

يُحمَّل نفس `students-normal.csv` من بايثون 101 في استدعاء واحد — بلا حلقة `csv.DictReader` يدوية، بلا تحويلات `int(...)` يدوية:

```python
df = pd.read_csv("students-normal.csv")
df.head()      # أول 5 صفوف
df.tail(3)      # آخر 3 صفوف
```

تستنتج `pd.read_csv` نوع بيانات كل عمود تلقائيًا (الأرقام تصبح `int64`/`float64`، النصوص تبقى `object`)، وهو معظم ما فعله الأسبوع 5 من المسار العادي لبايثون 101 يدويًا، مُنجَز لك في سطر واحد.

### فحص DataFrame

مجموعة صغيرة من الدوال تُجيب عن "كيف تبدو مجموعة البيانات هذه فعليًا؟" قبل أن تفعل أي شيء آخر بها:

```python
df.shape        # (صفوف، أعمدة) — مثلًا (10, 4)
df.columns      # أسماء الأعمدة
df.dtypes       # نوع بيانات كل عمود
df.info()       # الشكل + أنواع البيانات + عدّات القيم غير الفارغة، كلها دفعة واحدة
df.describe()   # العدّ، المتوسط، الانحراف المعياري، الأدنى، الأرباع، الأعلى — للأعمدة الرقمية
```

يستحق `df.describe()` التمعّن فيه: المتوسط والانحراف المعياري هما بالضبط الإحصاءات التي تعرفها بالفعل من مقرر إحصاء، محسوبة فوريًا عبر عمود كامل بدلًا من يدويًا. يمكنك إعادة تسمية الأعمدة لاحقًا إن لم تكن أسماء الملف المصدر مريحة للعمل بها:

```python
df = df.rename(columns={"quiz1": "quiz_1"})
```

## ⚠️ أخطاء شائعة

- **نسيان أن معظم عمليات DataFrame تُعيد كائنًا جديدًا.** `df.rename(...)`، `df.set_index(...)`، وكثيرات غيرها لا تُغيّر `df` نفسه إلا إن أعدت الإسناد (`df = df.rename(...)`) أو مرّرت `inplace=True`.
- **الخلط بين `df.shape` (بلا أقواس) واستدعاء دالة.** `.shape` خاصية، وليست دالة — `df.shape()` تُطلق `TypeError`.
- **افتراض أن `.describe()` تغطي كل عمود.** افتراضيًا تُلخّص فقط الأعمدة الرقمية؛ الأعمدة النصية تحتاج نظرة مختلفة (يغطي الأسبوع 8 تنظيفها وفحصها).

## 🧩 تحديات

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

حمّل `students-normal.csv` (من الأسبوع 5 لبايثون 101 — أعد استخدام نفس الملف) إلى DataFrame واطبع كم صفًا وعمودًا يحتوي.

<p class="challenge__answer">💡 <strong>Answer:</strong> استخدم <code>pd.read_csv("students-normal.csv")</code> ثم <code>df.shape</code> — العنصر الأول من الصف هو عدد الصفوف، والثاني عدد الأعمدة.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

اختر فقط عمود `quiz1` كـSeries. ما الصياغتان المختلفتان لفعل هذا؟

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>df["quiz1"]</code> أو <code>df.quiz1</code> كلاهما يختار العمود كـSeries؛ الثاني يعمل فقط لأن <code>quiz1</code> مُعرِّف بايثون صالح بلا مسافات.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

احسب متوسط عمود `quiz1` باستخدام دالة Series (وليس `sum()`/`len()` يدويًا).

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>df["quiz1"].mean()</code> — كل Series تمتلك دوالًا إحصائية مدمجة مثل <code>.mean()</code>، <code>.median()</code>، <code>.std()</code>، بلا حاجة لـsum()/len() يدويًا.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

شغّل `df.describe()` على DataFrame الطلاب. هل يتضمن عمود `name`؟ لماذا أو لماذا لا؟

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>df.describe()</code> تُلخّص فقط الأعمدة الرقمية افتراضيًا (العدّ/المتوسط/الانحراف/الأدنى/الأرباع/الأعلى) وتتخطى بصمت عمود <code>name</code>، بما أن أيًا من تلك الإحصاءات ليس ذا معنى للنصوص — تستنتج pandas هذا من نوع بيانات كل عمود.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

اجعل `name` فهرس DataFrame الطلاب، ثم ابحث عن صف Amina مباشرة باسمها بدلًا من رقم الصف.

<p class="challenge__answer">💡 <strong>Answer:</strong> استدعِ df.set_index("name") وخزّن النتيجة (مثلًا df_by_name = df.set_index("name"))، ثم استخدم df_by_name.loc["Amina"] لاسترجاع ذلك الصف مباشرة بالعلامة بدلًا من البحث عن رقم الصف المطابق.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

ابنِ DataFrame صغيرًا يدويًا (وليس من CSV) بعمودين، `city` و`population`، لـ 3 مدن من اختيارك — باستخدام إما أسلوب قاموس-من-قوائم أو قائمة-من-قواميس.

<p class="challenge__answer">💡 <strong>Answer:</strong> ابنِه إما كقاموس من قوائم (مفتاح واحد لكل عمود) أو قائمة من قواميس (قاموس واحد لكل مدينة) مُمرَّرة إلى <code>pd.DataFrame(...)</code> — كلاهما صحيح، مطابقًا لأي شكل بدأت به البيانات.</p>

</div>
</details>

## 🤔 أسئلة سقراطية

- تُقارَن `Series` غالبًا بقائمة بايثون بعلامات. ماذا يمكنك فعله بـ`.mean()`/`.std()` الخاصتين بـSeries في استدعاء واحد لم تكن لتستطيع فعله بقائمة عادية دون كتابة دالتك الخاصة؟
- تُظهر `df.dtypes` النوع المستنتَج لكل عمود. ماذا قد يحدث خطأً لو احتوى عمود يبدو رقميًا (مثل `quiz1`) فعليًا على صف واحد بنص فيه، مثل `"absent"`؟ أي نوع بيانات ستستنتجه pandas على الأرجح للعمود كاملًا؟
- قضيت 5 أسابيع من بايثون 101 تبني منطق قراءة CSV وحساب المتوسطات يدويًا. أي أسطر بالتحديد من ذلك المنطق يستبدلها `pd.read_csv(...).describe()`؟ هل يُفقَد أي شيء فعليًا باستخدام الاختصار، أم وقت فقط يُوفَّر؟
- تستبدل `df.set_index("name")` الفهرس الرقمي الافتراضي بواحد ذي معنى. ماذا سيحدث خطأً لو كان عمود `name` يحتوي قيمة مكررة — هل يمكن لا يزال تمييز طالبين مختلفين بعد ذلك؟

## ✅ اختبار الأسبوع

<div class="quiz" data-quiz="data-analysis-normal-week-6">
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">1. أفضل وصف لـpandas Series هو:</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">جدول ثنائي الأبعاد من صفوف وأعمدة</button>
        <button class="quiz-q__opt" data-idx="1">عمود واحد بعلامة من البيانات</button>
        <button class="quiz-q__opt" data-idx="2">ملف CSV على القرص</button>
        <button class="quiz-q__opt" data-idx="3">قاموس بايثون بلا علامات</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">2. أي دالة تُحمّل ملف CSV إلى DataFrame؟</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">pd.load_csv()</button>
        <button class="quiz-q__opt" data-idx="1">pd.read_csv()</button>
        <button class="quiz-q__opt" data-idx="2">pd.DataFrame.open()</button>
        <button class="quiz-q__opt" data-idx="3">pd.csv()</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">3. تُلخّص df.describe() افتراضيًا:</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">كل عمود، شاملًا النصوص</button>
        <button class="quiz-q__opt" data-idx="1">فقط الأعمدة الرقمية</button>
        <button class="quiz-q__opt" data-idx="2">فقط الصف الأول</button>
        <button class="quiz-q__opt" data-idx="3">فقط أسماء الأعمدة</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">4. تُعيد df.shape:</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">أسماء الأعمدة</button>
        <button class="quiz-q__opt" data-idx="1">صفًا من (صفوف، أعمدة)</button>
        <button class="quiz-q__opt" data-idx="2">أنواع بيانات كل عمود</button>
        <button class="quiz-q__opt" data-idx="3">أول 5 صفوف</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">5. df.set_index(&quot;name&quot;) افتراضيًا:</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">تُعدّل df في مكانه وتُعيد None</button>
        <button class="quiz-q__opt" data-idx="1">تُعيد DataFrame جديدًا، تاركة df الأصلي دون تغيير</button>
        <button class="quiz-q__opt" data-idx="2">تحذف عمود name تمامًا</button>
        <button class="quiz-q__opt" data-idx="3">تعمل فقط على الأعمدة الرقمية</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <p class="quiz__summary" data-quiz-summary hidden></p>
    </div>

