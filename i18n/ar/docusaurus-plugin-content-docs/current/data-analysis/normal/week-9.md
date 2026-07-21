---
title: "الأسبوع 9: التجميع، التلخيص، والدمج"
sidebar_position: 4
section: data-analysis
track: normal
week: 9
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# الأسبوع 9: التجميع (Groupby)، التلخيص، والدمج

<span className="gamified-flourish">🗂️ "قسّم مجموعة البيانات إلى مجموعات، ثم لخّص كل مجموعة" هي جملة واحدة في pandas وحوالي عشرة أسطر في بايثون الخالصة.</span>

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

<Challenge id="dataanalysis-normal-w9-c1" answer={<><code>df.groupby("gender")["math_score"].mean()</code> — يُجمّع الطلاب حسب الجنس، ثم يحسب متوسط math_score داخل كل مجموعة.</>}>

باستخدام DataFrame على نمط بيانات أداء الطلاب (تشمل الأعمدة `gender` و`math_score`)، احسب متوسط `math_score` لكل `gender`.

</Challenge>

<Challenge id="dataanalysis-normal-w9-c2" answer={<><code>df.groupby("test_preparation_course")["math_score"].agg(["mean", "count"])</code> — تحسب <code>.agg</code> مع قائمة عدة إحصاءات لنفس العمود دفعة واحدة، كأعمدة نتيجة منفصلة.</>}>

جمّع حسب `test_preparation_course` واحسب *كلًا* من متوسط وعدّ `math_score` لكل مجموعة، في استدعاء `.agg(...)` واحد.

</Challenge>

<Challenge id="dataanalysis-normal-w9-c3" answer={<>قارن <code>df.groupby("lunch")["reading_score"].mean()</code> عبر فئتي lunch مباشرة — أيهما متوسطها أعلى يُجيب السؤال.</>}>

أي فئة `lunch` لديها متوسط `reading_score` أعلى؟ أجب باستخدام `.groupby()`، وليس تصفية يدوية.

</Challenge>

<Challenge id="dataanalysis-normal-w9-c4" answer={<>أنشئ اثنين من DataFrame صغيرين مشتركين بعمود مفتاح (مثل <code>student_id</code>) واستدعِ <code>left.merge(right, on="student_id")</code>؛ جرّب مفاتيح غير متطابقة في كل جانب لترى كيف تُسقط <code>how="inner"</code> بصمت الصفوف غير المتطابقة مقارنة بـ<code>how="outer"</code>.</>}>

أنشئ اثنين من DataFrame يدويًا (مثلًا واحد بأسماء طلاب، وآخر بدرجة منفصلة لكل منهم)، مشتركَين بعمود مفتاح، وادمجهما. ثم جرّب عدم مطابقة مفتاح واحد عمدًا ولاحظ ما تفعله `how="inner"` به مقابل `how="outer"`.

</Challenge>

<Challenge id="dataanalysis-normal-w9-c5" answer={<><code>df.groupby(["lunch", "test_preparation_course"])["math_score"].mean()</code> — يُجمّع حسب كل مجموعة من العمودين، مُظهرًا ما إذا كانت الآثار تتراكب، تتلاشى، أو تبقى مستقلة.</>}>

جمّع حسب `lunch` و`test_preparation_course` معًا، واحسب متوسط `math_score` لكل مجموعة. هل يبقى نمط التحدي 3 داخل *كلا* مجموعتي التحضير للاختبار، أم يبدو مختلفًا؟

</Challenge>

<Challenge id="dataanalysis-normal-w9-c6" answer={<>سلسل .reset_index() بعد groupby-aggregate، ثم .sort_values("math_score", ascending=False) على العمود العادي الناتج، مثل df.groupby("lunch")["math_score"].mean().reset_index().sort_values("math_score", ascending=False).</>}>

خذ نتيجة التحدي 1 لديك (متوسط `math_score` حسب `gender`)، حوّلها إلى DataFrame عادي بـ`.reset_index()`، ورتّبها من الأعلى للأدنى متوسطًا.

</Challenge>

## 🤔 أسئلة سقراطية

- `.groupby("lunch")` وحدها (بلا تلخيص مُلحَق) لا تطبع جدول أرقام — بماذا تعتقد أنها تُعيد فعليًا، ولماذا تنتظر pandas لحساب أي شيء حتى تحدد تلخيصًا؟
- إن كان اثنان من DataFrame يُدمَجان يشتركان بعمود مفتاح لكن أحدهما به مفتاح *مكرر* (صفان بنفس `student_id`)، ماذا تتوقع أن يحدث لعدد الصفوف بعد الدمج؟ اختبره.
- تتيح لك `.groupby(...).agg({...})` تطبيق تلخيص *مختلف* لكل عمود (مثلًا متوسط لواحد، أعلى قيمة لآخر) في استدعاء واحد. لماذا قد لا يكون حساب متوسط كل عمود بنفس الإحصاء منطقيًا دائمًا لمجموعة بيانات حقيقية؟
- التجميع حسب عمودين دفعة واحدة (`["lunch", "test_preparation_course"]`) يمكن أن يكشف نمطًا يُخفيه التجميع بأي عمود بمفرده، أو يجعل نمطًا بدا قويًا يبدو أضعف فعليًا بمجرد مراعاة العامل الثاني. لماذا يُغيّر التقسيم لمجموعات أدق القصة أحيانًا بهذا القدر؟
- تستخدم نتيجة groupby-aggregate العمود المُجمَّع كفهرسها بدلًا من فهرس أعداد صحيحة عادي. ما الفرق العملي الذي يُحدثه ذلك أول مرة تحاول فيها استخدام `.iloc[0]` عليها، مقابل على DataFrame عادي؟

## ✅ اختبار الأسبوع

<WeeklyQuiz
  weekId="data-analysis-normal-week-9"
  questions={[
    {
      id: 'q1',
      prompt: 'ماذا تفعل df.groupby("lunch") بمفردها (بلا تلخيص مُلحَق)؟',
      options: [
        'تطبع فورًا متوسطات المجموعات',
        'تصف كيفية تقسيم الصفوف لمجموعات، دون حساب أي شيء بعد',
        'ترفع خطأً',
        'تحذف الصفوف بقيم lunch مفقودة',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: 'أي نوع دمج يُبقي فقط الصفوف التي يوجد مفتاحها في كلا DataFrame؟',
      options: ['outer', 'left', 'inner', 'cross'],
      correctOptionIndex: 2,
    },
    {
      id: 'q3',
      prompt: 'ماذا تحسب df.groupby("lunch").agg({"math_score": "mean", "reading_score": "mean"})؟',
      options: [
        'متوسطًا واحدًا مدموجًا عبر كلا العمودين',
        'متوسط كل عمود مُدرَج، منفصلًا، داخل كل مجموعة',
        'دمجًا بين math_score وreading_score',
        'المتوسط الإجمالي، متجاهلًا المجموعات',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'دالة .merge() لـDataFrame أشبه مفاهيميًا بـ:',
      options: [
        'مُصفّي قناع منطقي',
        'الترتيب حسب عمود',
        'ربط بأسلوب قاعدة بيانات على مفتاح مشترك',
        'حذف القيم المفقودة',
      ],
      correctOptionIndex: 2,
    },
    {
      id: 'q5',
      prompt: 'ماذا تفعل .reset_index() بعد groupby-aggregate؟',
      options: [
        'تحذف القيم المُلخَّصة',
        'تُحوّل العمود المُجمَّع مرة أخرى لعمود عادي، بفهرس أعداد صحيحة عادي',
        'تُجمّع البيانات مجددًا',
        'تدمج مع DataFrame آخر',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="data-analysis-normal-week-9" />
