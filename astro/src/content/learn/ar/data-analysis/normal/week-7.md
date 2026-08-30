---
title: "الأسبوع 7: الاختيار، التصفية، والفهرسة"
section: data-analysis
track: normal
week: 7
description: "الأسبوع 7: الاختيار، التصفية، والفهرسة — data-analysis (normal track)."
---


# الأسبوع 7: الاختيار، التصفية، والفهرسة

<span class="gamified-flourish">🔍 نظرت الأسبوع الماضي إلى الجدول كاملًا. هذا الأسبوع تتعلم طرح أسئلة عليه.</span>

## 🎯 أهداف التعلّم

بنهاية هذا الأسبوع ستكون قادرًا على:
- اختيار صفوف وأعمدة بـ `.loc` و`.iloc`.
- تصفية الصفوف باستخدام **قناع منطقي (boolean mask)**، النظير في pandas لترميز بناء المجموعات.
- دمج شروط متعددة بـ `&`، `|`، و`~`.
- استخدام `.isin()` و`.between()` لاختصارات تصفية شائعة.

## الدرس

### `.loc` مقابل `.iloc`

كلاهما يختار صفوفًا/أعمدة، لكن بنوعين مختلفين من العنونة:

```python
df.loc[0, "name"]      # بالعلامة: الصف المُعنون 0، العمود المُعنون "name"
df.iloc[0, 0]           # بالموضع: أول صف، أول عمود، بغض النظر عن العلامات
df.loc[0:2]             # الصفوف المُعنونة من 0 حتى 2، شاملة
df.iloc[0:2]             # الصفوف عند المواضع 0، 1 — نهاية غير شاملة، مثل تقطيع بايثون
```

`.loc` شاملة على كلا الطرفين لأنها تعنون بـ*العلامة*، لا بالموضع — فرق مهم يسهل تفويته عن تقطيع بايثون المعتاد نصف المفتوح (الذي تتبعه `.iloc`). كلاهما يقبل *دمجًا* لمُحدِّدات صفوف وأعمدة، مُصفّيًا كلا المحورين في استدعاء واحد:

```python
df.loc[0:2, "name"]              # الصفوف 0-2، فقط عمود name، كـSeries
df.loc[0:2, ["name", "quiz1"]]    # الصفوف 0-2، عمودان، كـDataFrame
```

### الأقنعة المنطقية: ترميز بناء المجموعات في pandas

تذكّر ترميز بناء المجموعات: $\{x \in S : P(x)\}$. في pandas، شرط مثل `df["score"] >= 60` يُنتج `Series` من قيم `True`/`False` — **قناع منطقي** — وفهرسة DataFrame بذلك القناع تُبقي فقط الصفوف حيث هو `True`:

```python
mask = df["quiz1"] >= 60
mask                   # Series من True/False، واحدة لكل صف
df[mask]                # فقط الصفوف حيث quiz1 >= 60

# تُكتب أكثر شيوعًا في سطر واحد:
df[df["quiz1"] >= 60]
```

هذه مباشرة الصيغة البرمجية لـ $\{ \text{row} \in df : \text{row.quiz1} \ge 60 \}$ — نفس فكرة تصفية list comprehension في بايثون 101، لكن تعمل على عمود كامل دفعة واحدة بدلًا من التكرار عنصرًا بعنصر. يمكن أيضًا دمج قناع مع `.loc` لتصفية الصفوف *واختيار* الأعمدة في استدعاء واحد:

```python
df.loc[df["quiz1"] >= 60, ["name", "quiz1"]]   # فقط الطلاب الناجحون، هذان العمودان فقط
```

### دمج الشروط

استخدم `&` (و)، `|` (أو)، `~` (ليس) — **وليس** `and`/`or`/`not` بايثون، التي لا تعمل عنصرًا-بعنصر على Series. يحتاج كل شرط أقواسه الخاصة بسبب أسبقية العوامل:

```python
df[(df["quiz1"] >= 60) & (df["quiz2"] >= 60)]    # نجح في كلا الاختبارين
df[(df["quiz1"] < 60) | (df["quiz2"] < 60)]       # رسب في واحد على الأقل
df[~(df["quiz1"] >= 60)]                            # لم ينجح في quiz1 — نفس df["quiz1"] < 60
```

### اختصارات التصفية: `.isin()` و`.between()`

نمطا تصفية شائعان لهما دوال مخصصة أوضح للقراءة بدلًا من سلاسل `|`/مقارنات:

```python
df[df["name"].isin(["Amina", "Sara"])]        # الصفوف حيث الاسم إحدى قيم قائمة
df[df["quiz1"].between(60, 80)]                 # الصفوف حيث 60 <= quiz1 <= 80، شاملة
```

`df["name"].isin([...])` هو المكافئ المُوجَّه لاختبار الانتماء `value in some_list` في بايثون 101، مُطبَّقًا على `name` كل صف دفعة واحدة — ويُغنيك عن كتابة `(df["name"] == "Amina") | (df["name"] == "Sara")` يدويًا.

### اختيار الأعمدة

```python
df["name"]                    # عمود واحد، كـSeries
df[["name", "quiz1"]]          # عدة أعمدة، كـDataFrame (لاحظ الأقواس المزدوجة)
```

## ⚠️ أخطاء شائعة

- **استخدام `and`/`or` من بايثون بدلًا من `&`/`|`.** `df["quiz1"] >= 60 and df["quiz2"] >= 60` تُطلق `ValueError: The truth value of a Series is ambiguous` — تتوقع `and`/`or` في بايثون قيمة واحدة `True`/`False`، وليس Series كاملة منها.
- **نسيان الأقواس حول كل شرط.** `df[df["quiz1"] >= 60 & df["quiz2"] >= 60]` (بلا أقواس) فخ أسبقية — `&` ترتبط *أقوى* من `>=`، لذا تُحلَّل هذه بشكل مختلف جدًا عمّا قصدت. ضع دائمًا أقواسًا حول كل شرط عند الدمج بـ`&`/`|`.
- **الخلط بين `.loc[0:2]` (شاملة) و`.iloc[0:2]` (غير شاملة).** هذا هو أشيع خطأ منفرد لـ`.loc`/`.iloc` — تحقق دائمًا مرتين أيهما تستخدم كلما بدا عدد صفوف التقطيع خاطئًا بواحد.
- **أقواس مفردة عندما تقصد DataFrame.** `df["name", "quiz1"]` (أقواس مفردة، فاصلة بالداخل) غير صالحة — تحتاج صيغة الأقواس المزدوجة `df[["name", "quiz1"]]`.

## 🧩 تحديات

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

باستخدام `students-normal.csv`، اختر كل الصفوف حيث `quiz1` يساوي 90 أو أكثر.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>df[df["quiz1"] &gt;= 90]</code> — قناع منطقي يُبقي فقط الصفوف حيث quiz1 لا يقل عن 90.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

اختر الطلاب الذين نجحوا (≥60) في *الاختبارات الثلاثة* دفعة واحدة، بدمج ثلاثة شروط.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>df[(df["quiz1"] &gt;= 60) &amp; (df["quiz2"] &gt;= 60) &amp; (df["quiz3"] &gt;= 60)]</code> — ثلاثة شروط متسلسلة مدموجة بـ<code>&amp;</code>، كل منها بأقواسه.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

اختر أول 3 صفوف من DataFrame باستخدام `.iloc`. ثم جرّب `.loc[0:3]` — كم صفًا تُعيد، ولماذا يختلف ذلك عن `.iloc[0:3]`؟

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>df.iloc[0:3]</code> تختار أول ثلاثة صفوف بالموضع؛ <code>df.loc[0:3]</code> ستختار الصفوف المُعنونة 0، 1، 2، و3 — أربعة صفوف — بما أن نهاية تقطيع <code>.loc</code> شاملة.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

اختر عمودي `name` و`quiz1` معًا، كـDataFrame (وليس Series واحدة).

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>df[["name", "quiz1"]]</code> — أقواس مزدوجة: الأقواس الخارجية تفهرس DataFrame، والداخلية قائمة بايثون بأسماء الأعمدة.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

باستخدام `.isin()`، اختر صفوف ثلاثة طلاب محددين بالاسم (اختر أي ثلاثة أسماء من مجموعة البيانات).

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>df[df["name"].isin(["Amina", "Karim", "Sara"])]</code> — يُصفّي إلى فقط الصفوف التي يطابق اسمها إحدى القيم الثلاث المُعطاة.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

باستخدام `.loc` مع قناع منطقي *وقائمة* أعمدة في نفس الاستدعاء، اختر فقط عمودي `name` و`quiz1` للطلاب الذين رسبوا في `quiz1` (تحت 60).

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>df.loc[df["quiz1"] &lt; 60, ["name", "quiz1"]]</code> — يدمج قناعًا منطقيًا (صفوف) مع قائمة أعمدة، في استدعاء .loc واحد.</p>

</div>
</details>

## 🤔 أسئلة سقراطية

- لماذا تُطلق `df[df["quiz1"] >= 60 and df["quiz2"] >= 60]` (باستخدام `and` بايثون) خطأً، بينما تعمل `df[(df["quiz1"] >= 60) & (df["quiz2"] >= 60)]` (باستخدام `&`)؟ ما الذي تحاول `and` فعله بـSeries كاملتين ولا يُعطي معنى؟
- القناع المنطقي هو نفسه فقط `Series` من قيم `True`/`False`، بنفس شكل فهرس صفوف DataFrame. ماذا سيحسب `mask.sum()`، ولماذا قد يكون ذلك الرقم ذا معنى؟
- كون `.loc[0:2]` شاملة بينما `.iloc[0:2]` غير شاملة مصدر شائع لأخطاء الحدود. هل يمكنك التفكير في حالة لا تكون فيها *علامات* الصفوف أعدادًا صحيحة حتى (مثلًا بعد تصفية ما) — ماذا سيعني `.loc[0:2]` حينها؟
- تُنتج `df["name"].isin([...])` وسلسلة مقارنات `|` نفس الصفوف. بخلاف كونها أقصر للكتابة، هل يمكنك التفكير في سبب قد يجعل `.isin()` أيضًا *أقل* عرضة للخطأ لقائمة بها قيم كثيرة؟
- تنفي `~` قناعًا منطقيًا. هل `~(df["quiz1"] >= 60)` دائمًا مطابقة تمامًا لـ`df["quiz1"] < 60`؟ ما الذي قد يجعلهما مختلفتين لو احتوى العمود قيمًا مفقودة (`NaN`) — موضوع يغطيه الأسبوع القادم بعمق؟

## ✅ اختبار الأسبوع

<div class="quiz" data-quiz="data-analysis-normal-week-7">
      <div class="quiz-q" data-answer="2">
        <p class="quiz-q__prompt">1. أي عامل يدمج قناعين منطقيين في pandas (وليس and/or بايثون)؟</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">and / or</button>
        <button class="quiz-q__opt" data-idx="1">&amp;&amp; / ||</button>
        <button class="quiz-q__opt" data-idx="2">&amp; / |</button>
        <button class="quiz-q__opt" data-idx="3">يعملان بنفس الطريقة تمامًا</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">2. تختار .loc بـ:</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">الموضع فقط</button>
        <button class="quiz-q__opt" data-idx="1">العلامة</button>
        <button class="quiz-q__opt" data-idx="2">وصول عشوائي</button>
        <button class="quiz-q__opt" data-idx="3">نوع بيانات العمود</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">3. تعمل df[df[&quot;score&quot;] &gt;= 60] لأن df[&quot;score&quot;] &gt;= 60 تُنتج:</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">قيمة True/False واحدة</button>
        <button class="quiz-q__opt" data-idx="1">Series منطقية، تُستخدم لتصفية الصفوف</button>
        <button class="quiz-q__opt" data-idx="2">DataFrame جديد بعمود واحد</button>
        <button class="quiz-q__opt" data-idx="3">خطأ SyntaxError</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">4. تُعيد df[[&quot;name&quot;, &quot;quiz1&quot;]] (أقواس مزدوجة):</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">Series</button>
        <button class="quiz-q__opt" data-idx="1">DataFrame بهذين العمودين</button>
        <button class="quiz-q__opt" data-idx="2">قيمة واحدة</button>
        <button class="quiz-q__opt" data-idx="3">قائمة بأسماء الأعمدة</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">5. تختار df[&quot;quiz1&quot;].between(60, 80) الصفوف حيث quiz1:</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">تساوي 60 بالضبط أو 80 بالضبط</button>
        <button class="quiz-q__opt" data-idx="1">بين 60 و80، شاملة</button>
        <button class="quiz-q__opt" data-idx="2">أكبر من 80 فقط</button>
        <button class="quiz-q__opt" data-idx="3">لا تساوي 60 ولا 80</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <p class="quiz__summary" data-quiz-summary hidden></p>
    </div>

