---
title: "الأسبوع 9: التجميع، التلخيص، والدمج"
section: data-analysis
track: normal
week: 9
description: "الأسبوع 9: التجميع، التلخيص، والدمج — data-analysis (normal track)."
---


# الأسبوع 9: التجميع (Groupby)، التلخيص، والدمج

<span class="gamified-flourish">🗂️ "قسّم مجموعة البيانات إلى مجموعات، ثم لخّص كل مجموعة" هي جملة واحدة في pandas وحوالي عشرة أسطر في بايثون الخالصة.</span>

## 🎯 أهداف التعلّم

بنهاية هذا الأسبوع ستكون قادرًا على:
- تقسيم DataFrame إلى مجموعات بـ `.groupby()`، وشرح الصلة بتقسيم مجموعة رياضية.
- حساب تلخيصات لكل مجموعة (`.mean()`، `.sum()`، `.count()`، وعدة تلخيصات دفعة واحدة بـ `.agg()`).
- التجميع حسب أكثر من عمود دفعة واحدة، وتحويل نتيجة مُجمَّعة مرة أخرى إلى DataFrame عادي.
- دمج DataFrame بآخر بـ `.merge()`، بمطابقة الصفوف بمفتاح مشترك.

## الدرس

### `.groupby()`: تقسيم مجموعة

تذكّر أن **تقسيم (partition)** مجموعة $S$ يُجزّئها إلى مجموعات فرعية منفصلة اتحادها هو $S$. تفعل `.groupby("column")` هذا بالضبط: تُقسّم صفوف DataFrame إلى مجموعات، واحدة لكل قيمة مختلفة في ذلك العمود:

```python
df.groupby("lunch")               # كائن GroupBy — المجموعات تكوّنت، لا شيء حُسب بعد
df.groupby("lunch")["math_score"].mean()   # متوسط math_score داخل كل مجموعة lunch
```

لا يُحسَب شيء حتى تُلحق تلخيصًا — `.groupby()` وحدها تصف فقط *كيفية* تقسيم الصفوف.

### التلخيص

تُخطّط التلخيصات القياسية مباشرة على إحصاءات تعرفها بالفعل:

```python
df.groupby("lunch")["math_score"].mean()     # متوسط math_score لكل نوع lunch
df.groupby("lunch")["math_score"].count()     # كم صفًا (طالبًا) لكل مجموعة
df.groupby("lunch").agg({                      # عدة أعمدة/إحصاءات دفعة واحدة
    "math_score": "mean",
    "reading_score": "mean",
})
```

تُقرأ `.groupby(...)[...]` من اليسار لليمين كـ"قسّم بهذا العمود، ثم انظر لهذا العمود الآخر داخل كل جزء" — صياغة pandas لـ"لكل مجموعة، احسب إحصاءً على متغيّر مختلف".

### التجميع حسب أكثر من عمود

تمرير *قائمة* من أسماء الأعمدة يُجمّع حسب كل مجموعة فريدة من قيمها دفعة واحدة — نفس فكرة التقسيم بزوج $(a, b)$ بدلًا من قيمة واحدة:

```python
df.groupby(["lunch", "gender"])["math_score"].mean()
```

يُجيب هذا عن سؤال أكثر تحديدًا من أي عمود بمفرده: هل يبقى أثر `lunch` على `math_score` بنفس الطريقة داخل كل `gender`، أم يبدو مختلفًا بمجرد فصلهما؟

### استرجاع DataFrame عادي

تستخدم نتيجة groupby-aggregate العمود (الأعمدة) المُجمَّعة كفهرسها بدلًا من فهرس صفوف عادي `0, 1, 2, ...` — مريح لعمليات بحث إضافية، لكن أحيانًا تريد DataFrame عاديًا مرة أخرى (مثلًا، لترتيبه، أو دمجه بشيء آخر). تفعل `.reset_index()` ذلك:

```python
summary = df.groupby("lunch")["math_score"].mean().reset_index()
# lunch          math_score
# free/reduced   58.2
# standard       66.9

summary.sort_values("math_score", ascending=False)   # الآن عمود عادي يمكنك الترتيب به
```

### الدمج: جمع اثنين من DataFrame

تدمج `.merge()` اثنين من DataFrame على عمود مفتاح مشترك، نفس فكرة الربط في قاعدة بيانات أو مطابقة مُدخلات بين جدولي بحث بمعرِّف مشترك:

```python
students = pd.DataFrame({"student_id": [1, 2, 3], "name": ["Amina", "Youssef", "Sara"]})
grades = pd.DataFrame({"student_id": [1, 2, 3], "grade": ["A", "B", "A"]})

merged = students.merge(grades, on="student_id")
# student_id | name    | grade
#     1      | Amina   |   A
#     2      | Youssef |   B
#     3      | Sara    |   A
```

`how="inner"` (الافتراضي) تُبقي فقط الصفوف حيث يوجد المفتاح في *كلا* DataFrame؛ تتحكم `how="left"`/`"right"`/`"outer"` بما يحدث للصفوف التي يفتقد مفتاحها من الجانب الآخر — يستحق الفحص صراحة كلما احتمل ألا يتطابق عدد الصفوف بعد دمج. إن كانت أعمدة المفتاح بأسماء مختلفة في كل DataFrame، استخدم `left_on`/`right_on` بدلًا من `on`:

```python
students.merge(scores, left_on="student_id", right_on="id")
```

## ⚠️ أخطاء شائعة

- **نسيان أن `.groupby()` وحدها لا تحسب شيئًا.** `df.groupby("lunch")` بمفردها مجرد وصف للتقسيم — تحتاج دائمًا تلخيصًا (`.mean()`، `.agg(...)`، إلخ) مُلحَقًا لرؤية أرقام فعليًا.
- **افتراض أن الدمج يحافظ على عدد الصفوف الأصلي.** `merge` بمفتاح مكرر في أي جانب يمكن أن يُنتج *صفوفًا أكثر* مما كان لدى أي مدخل — تحقق دائمًا من `.shape` بعد دمج لست متأكدًا منه 100%.
- **عدم فحص `how=` صراحة.** الافتراضي `"inner"` يُسقط بصمت أي صف لا يوجد مفتاحه بالجانب الآخر — جيد عندما يكون هذا فعليًا ما تريده، لكن يستحق أن يكون خيارًا مقصودًا، لا حادثًا.
- **نسيان `.reset_index()` عندما تحتاج عمودًا عاديًا مرة أخرى.** محاولة `.sort_values()` أو `.merge()` باستخدام فهرس نتيجة groupby (بدلًا من عمود عادي) وكأنه عمود عادي ستفشل أو تتصرف بشكل غير متوقع حتى تستدعي `.reset_index()`.

## 🧩 تحديات

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

باستخدام DataFrame على نمط بيانات أداء الطلاب (تشمل الأعمدة `gender` و`math_score`)، احسب متوسط `math_score` لكل `gender`.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>df.groupby("gender")["math_score"].mean()</code> — يُجمّع الطلاب حسب الجنس، ثم يحسب متوسط math_score داخل كل مجموعة.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

جمّع حسب `test_preparation_course` واحسب *كلًا* من متوسط وعدّ `math_score` لكل مجموعة، في استدعاء `.agg(...)` واحد.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>df.groupby("test_preparation_course")["math_score"].agg(["mean", "count"])</code> — تحسب <code>.agg</code> مع قائمة عدة إحصاءات لنفس العمود دفعة واحدة، كأعمدة نتيجة منفصلة.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

أي فئة `lunch` لديها متوسط `reading_score` أعلى؟ أجب باستخدام `.groupby()`، وليس تصفية يدوية.

<p class="challenge__answer">💡 <strong>Answer:</strong> قارن <code>df.groupby("lunch")["reading_score"].mean()</code> عبر فئتي lunch مباشرة — أيهما متوسطها أعلى يُجيب السؤال.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

أنشئ اثنين من DataFrame يدويًا (مثلًا واحد بأسماء طلاب، وآخر بدرجة منفصلة لكل منهم)، مشتركَين بعمود مفتاح، وادمجهما. ثم جرّب عدم مطابقة مفتاح واحد عمدًا ولاحظ ما تفعله `how="inner"` به مقابل `how="outer"`.

<p class="challenge__answer">💡 <strong>Answer:</strong> أنشئ اثنين من DataFrame صغيرين مشتركين بعمود مفتاح (مثل <code>student_id</code>) واستدعِ <code>left.merge(right, on="student_id")</code>؛ جرّب مفاتيح غير متطابقة في كل جانب لترى كيف تُسقط <code>how="inner"</code> بصمت الصفوف غير المتطابقة مقارنة بـ<code>how="outer"</code>.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

جمّع حسب `lunch` و`test_preparation_course` معًا، واحسب متوسط `math_score` لكل مجموعة. هل يبقى نمط التحدي 3 داخل *كلا* مجموعتي التحضير للاختبار، أم يبدو مختلفًا؟

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>df.groupby(["lunch", "test_preparation_course"])["math_score"].mean()</code> — يُجمّع حسب كل مجموعة من العمودين، مُظهرًا ما إذا كانت الآثار تتراكب، تتلاشى، أو تبقى مستقلة.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

خذ نتيجة التحدي 1 لديك (متوسط `math_score` حسب `gender`)، حوّلها إلى DataFrame عادي بـ`.reset_index()`، ورتّبها من الأعلى للأدنى متوسطًا.

<p class="challenge__answer">💡 <strong>Answer:</strong> سلسل .reset_index() بعد groupby-aggregate، ثم .sort_values("math_score", ascending=False) على العمود العادي الناتج، مثل df.groupby("lunch")["math_score"].mean().reset_index().sort_values("math_score", ascending=False).</p>

</div>
</details>

## 🤔 أسئلة سقراطية

- `.groupby("lunch")` وحدها (بلا تلخيص مُلحَق) لا تطبع جدول أرقام — بماذا تعتقد أنها تُعيد فعليًا، ولماذا تنتظر pandas لحساب أي شيء حتى تحدد تلخيصًا؟
- إن كان اثنان من DataFrame يُدمَجان يشتركان بعمود مفتاح لكن أحدهما به مفتاح *مكرر* (صفان بنفس `student_id`)، ماذا تتوقع أن يحدث لعدد الصفوف بعد الدمج؟ اختبره.
- تتيح لك `.groupby(...).agg({...})` تطبيق تلخيص *مختلف* لكل عمود (مثلًا متوسط لواحد، أعلى قيمة لآخر) في استدعاء واحد. لماذا قد لا يكون حساب متوسط كل عمود بنفس الإحصاء منطقيًا دائمًا لمجموعة بيانات حقيقية؟
- التجميع حسب عمودين دفعة واحدة (`["lunch", "test_preparation_course"]`) يمكن أن يكشف نمطًا يُخفيه التجميع بأي عمود بمفرده، أو يجعل نمطًا بدا قويًا يبدو أضعف فعليًا بمجرد مراعاة العامل الثاني. لماذا يُغيّر التقسيم لمجموعات أدق القصة أحيانًا بهذا القدر؟
- تستخدم نتيجة groupby-aggregate العمود المُجمَّع كفهرسها بدلًا من فهرس أعداد صحيحة عادي. ما الفرق العملي الذي يُحدثه ذلك أول مرة تحاول فيها استخدام `.iloc[0]` عليها، مقابل على DataFrame عادي؟

## ✅ اختبار الأسبوع

<div class="quiz" data-quiz="data-analysis-normal-week-9">
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">1. ماذا تفعل df.groupby(&quot;lunch&quot;) بمفردها (بلا تلخيص مُلحَق)؟</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">تطبع فورًا متوسطات المجموعات</button>
        <button class="quiz-q__opt" data-idx="1">تصف كيفية تقسيم الصفوف لمجموعات، دون حساب أي شيء بعد</button>
        <button class="quiz-q__opt" data-idx="2">ترفع خطأً</button>
        <button class="quiz-q__opt" data-idx="3">تحذف الصفوف بقيم lunch مفقودة</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="2">
        <p class="quiz-q__prompt">2. أي نوع دمج يُبقي فقط الصفوف التي يوجد مفتاحها في كلا DataFrame؟</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">outer</button>
        <button class="quiz-q__opt" data-idx="1">left</button>
        <button class="quiz-q__opt" data-idx="2">inner</button>
        <button class="quiz-q__opt" data-idx="3">cross</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">3. ماذا تحسب df.groupby(&quot;lunch&quot;).agg({&quot;math_score&quot;: &quot;mean&quot;, &quot;reading_score&quot;: &quot;mean&quot;})؟</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">متوسطًا واحدًا مدموجًا عبر كلا العمودين</button>
        <button class="quiz-q__opt" data-idx="1">متوسط كل عمود مُدرَج، منفصلًا، داخل كل مجموعة</button>
        <button class="quiz-q__opt" data-idx="2">دمجًا بين math_score وreading_score</button>
        <button class="quiz-q__opt" data-idx="3">المتوسط الإجمالي، متجاهلًا المجموعات</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="2">
        <p class="quiz-q__prompt">4. دالة .merge() لـDataFrame أشبه مفاهيميًا بـ:</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">مُصفّي قناع منطقي</button>
        <button class="quiz-q__opt" data-idx="1">الترتيب حسب عمود</button>
        <button class="quiz-q__opt" data-idx="2">ربط بأسلوب قاعدة بيانات على مفتاح مشترك</button>
        <button class="quiz-q__opt" data-idx="3">حذف القيم المفقودة</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">5. ماذا تفعل .reset_index() بعد groupby-aggregate؟</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">تحذف القيم المُلخَّصة</button>
        <button class="quiz-q__opt" data-idx="1">تُحوّل العمود المُجمَّع مرة أخرى لعمود عادي، بفهرس أعداد صحيحة عادي</button>
        <button class="quiz-q__opt" data-idx="2">تُجمّع البيانات مجددًا</button>
        <button class="quiz-q__opt" data-idx="3">تدمج مع DataFrame آخر</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <p class="quiz__summary" data-quiz-summary hidden></p>
    </div>

