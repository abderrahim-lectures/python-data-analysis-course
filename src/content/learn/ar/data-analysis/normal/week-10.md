---
title: "الأسبوع 10: تحليل استكشافي موجَّه — مجموعة بيانات تايتانيك"
section: data-analysis
track: normal
week: 10
description: "الأسبوع 10: تحليل استكشافي موجَّه — مجموعة بيانات تايتانيك — data-analysis (normal track)."
---


# الأسبوع 10: تحليل استكشافي موجَّه — مجموعة بيانات تايتانيك

<span class="gamified-flourish">🚢 تجتمع كل أداة من الأسابيع 6-9 هذا الأسبوع على واحدة من أشهر مجموعات بيانات المبتدئين في علم البيانات.</span>

## 🎯 أهداف التعلّم

بنهاية هذا الأسبوع ستكون قادرًا على:
- تحميل وتنظيف مجموعة بيانات بشكل حقيقي ([`titanic.csv`](pathname:///datasets/titanic.csv)) من البداية للنهاية.
- الإجابة عن أسئلة تحليلية محددة باستخدام الاختيار، التصفية، و`.groupby()` معًا.
- تقسيم عمود مستمر إلى نطاقات بـ `pd.cut` للتحليل المُجمَّع.
- إعادة إنتاج بنية دفتر ملاحظات تحليل استكشافي كلاسيكي على طراز Kaggle، خلية تلو الأخرى، وتلخيص النتائج بلغة إنجليزية بسيطة.

## الدرس

هذا الأسبوع أقل عمدًا في "مفهوم جديد، صياغة جديدة" وأكثر في "طبّق كل شيء، بالتسلسل، على مجموعة بيانات واحدة." أصبحت مجموعة بيانات تايتانيك ([المصادر هنا](/credits)) معيارًا قياسيًا للمبتدئين لهذا السبب بالتحديد: إنها صغيرة، لديها عمود نتيجة واضح (`Survived`)، ولديها نسيج فوضوي واقعي كافٍ (أعمار مفقودة، أنواع مختلطة) يحتاج كل أداة من هذا القسم.

### الخطوة 1: التحميل والفحص

```python
import pandas as pd

df = pd.read_csv("titanic.csv")
df.shape
df.head()
df.info()
df.describe()
```

قبل تحليل أي شيء، اسأل دائمًا: كم صفًا، أي أعمدة، أي أنواع بيانات، ما المفقود؟ هذه مادة الأسبوعين 6 و8، مُطبَّقة كأول خطوة بالضبط في أي تحليل حقيقي — ليست شكلية، بل الأساس الذي يعتمد عليه كل شيء بعدها.

### الخطوة 2: معالجة البيانات المفقودة

```python
df.isna().sum()
```

عادة ما يحتوي `Age` قيمًا مفقودة في مجموعة البيانات هذه. بدلًا من حذف تلك الصفوف تمامًا (فقدان معلومات أخرى عن أولئك الركاب)، خيار شائع هو الملء بمتوسط العمر الوسيط (median) — الوسيط، وليس المتوسط الحسابي، لأن توزيعات الأعمار غالبًا ما تكون منحرفة ببضعة ركاب صغار جدًا أو كبار جدًا في السن:

```python
df["Age"] = df["Age"].fillna(df["Age"].median())
```

### الخطوة 3: طرح أسئلة، الإجابة بالتصفية + التجميع

**سؤال: هل اختلف معدل النجاة حسب فئة الراكب؟**

```python
df.groupby("Pclass")["Survived"].mean()
```

متوسط كل مجموعة لعمود 0/1 هو بالضبط *معدل* النجاة لتلك المجموعة — نفس حيلة "متوسط عمود شبيه منطقي = نسبة" التي ستستخدمها باستمرار في تحليل البيانات.

**سؤال: هل اختلف معدل النجاة حسب الجنس؟**

```python
df.groupby("Sex")["Survived"].mean()
```

**سؤال: بين الركاب الذين دفعوا أعلى 25% من الأجرة، ما كان معدل النجاة؟**

```python
fare_threshold = df["Fare"].quantile(0.75)
top_fare_passengers = df[df["Fare"] >= fare_threshold]
top_fare_passengers["Survived"].mean()
```

يدمج هذا تصفية (الأسبوع 7) مع تلخيص (`.mean()`، الأسبوع 6) — نفس النمط ذي الخطوتين لكل سؤال تقريبًا ستطرحه على مجموعة بيانات حقيقية: ضيّق للصفوف التي تهمك، ثم لخّصها.

### الخطوة 4: دمج أبعاد التجميع

تقبل `.groupby()` *قائمة* من الأعمدة، مُقسِّمة حسب كل مجموعة من قيمها دفعة واحدة:

```python
df.groupby(["Pclass", "Sex"])["Survived"].mean()
```

يُجيب هذا عن سؤال أكثر تحديدًا من أي تجميع بمفرده: هل يبقى أثر الفئة على النجاة *داخل* كل جنس، أم يختفي بمجرد التحكم بالجنس؟

### الخطوة 5: تقسيم عمود مستمر بـ `pd.cut`

`Age` مستمر، لكن "معدل النجاة حسب العمر بالضبط" دقيق جدًا لقراءته بسهولة — التجميع حسب *نطاقات* العمر (تقطيع منفصل، نفس فكرة صناديق (bins) المدرج التكراري) عادة أكثر فائدة. تفعل `pd.cut` هذا بالضبط:

```python
df["age_group"] = pd.cut(df["Age"], bins=[0, 12, 18, 35, 60, 100],
                          labels=["Child", "Teen", "Adult", "Middle-aged", "Senior"])
df.groupby("age_group")["Survived"].mean()
```

تُعطي `bins` حواف كل نطاق؛ تُسمّيها `labels`. الآن `age_group` مجرد عمود فئوي آخر، قابل للاستخدام مع `.groupby()` تمامًا مثل `Pclass` أو `Sex`.

### الخطوة 6: تلخيص النتائج بلغة بسيطة

لا يكتمل التحليل الاستكشافي الحقيقي حتى تصبح أرقامه جملة يمكن لشخص آخر قراءتها دون إعادة تشغيل كودك — نفس الانضباط الذي يُعامله إطار عمل المسار الصعب للتحليل الاستكشافي كمحوري:

```python
class_survival = df.groupby("Pclass")["Survived"].mean()
sex_survival = df.groupby("Sex")["Survived"].mean()

print(f"Overall survival rate: {df['Survived'].mean():.1%}")
print(f"1st class survival rate: {class_survival[1]:.1%}, "
      f"3rd class survival rate: {class_survival[3]:.1%}")
print(f"Female survival rate: {sex_survival['female']:.1%}, "
      f"male survival rate: {sex_survival['male']:.1%}")
```

`{value:.1%}` هي مواصفة تنسيق f-string — قدّم الأسبوع 1 من بايثون 101 `:.2f`؛ تعني `.1%` بالمثل "كنسبة مئوية، منزلة عشرية واحدة"، مُحوّلة `0.629` إلى `"62.9%"` تلقائيًا.

## ⚠️ أخطاء شائعة

- **الإجابة عن سؤال بشريحة بيانات خاطئة.** تحقق دائمًا مرتين أن شرط تصفية منطقي يقول فعليًا ما تقصده — `df["Age"] < 18` و`df["Age"] <= 18` تُعطيان إجابتين مختلفتين (وإن كانتا متشابهتين)، والفرق يهم لحالات الحدود.
- **نسيان أن صناديق `pd.cut` نصف مفتوحة باتجاه محدد.** افتراضيًا، صناديق `pd.cut` هي `(يسار، يمين]` — الحافة اليسرى مستبعدة، اليمنى مُضمَّنة — يستحق التحقق إن كانت قيمة قد تقع بالضبط على حد.
- **الإبلاغ عن متوسط مجموعة دون الإبلاغ عن حجمها أيضًا.** معدل نجاة يبدو دراميًا لمجموعة من 3 ركاب يستحق ثقة أقل بكثير من نفس المعدل لمجموعة من 300 — انظر دائمًا لـ`.count()` جنبًا إلى جنب مع `.mean()` عند مقارنة المجموعات، نفس الحذر الذي يُشدّد عليه الأسبوع 6 من المسار الصعب.

## 🧩 تحديات

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

احسب معدل النجاة حسب ميناء `Embarked`. أي ميناء كان له أعلى معدل نجاة في مجموعة البيانات هذه؟

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>df.groupby("Embarked")["Survived"].mean()</code> — نفس نمط السطر الواحد لـclass/sex، فقط مُجمَّع حسب عمود ميناء الركوب بدلًا من ذلك.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

قارن معدل نجاة الركاب تحت 18 عامًا بالركاب 18 عامًا فأكثر.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>df[df["Age"] &lt; 18]["Survived"].mean()</code> مقارنة بـ<code>df[df["Age"] &gt;= 18]["Survived"].mean()</code> — مجموعتان فرعيتان مُصفّاتان، كل منهما مُلخَّصة بنفس التلخيص.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

باستخدام التجميع المدمج `["Pclass", "Sex"]`، هل لا تزال فئة الراكب مهمة للنجاة *داخل* الراكبات تحديدًا؟ اقرأ الصفوف ذات الصلة من النتيجة.

<p class="challenge__answer">💡 <strong>Answer:</strong> <code>df.groupby(["Pclass", "Sex"])["Survived"].mean()</code>، ثم اقرأ كلا المُدخلين حيث Sex هو "female" عبر قيم Pclass الثلاث.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

أنشئ عمودًا جديدًا `family_size` كـ`SibSp + Parch + 1` (الإخوة/الأزواج + الآباء/الأبناء + الراكب نفسه)، ثم احسب معدل النجاة مُجمَّعًا حسب `family_size`.

<p class="challenge__answer">💡 <strong>Answer:</strong> أضف عمودًا جديدًا: <code>df["family_size"] = df["SibSp"] + df["Parch"] + 1</code> (الـ+1 تعدّ الراكب نفسه)، ثم جمّع به: <code>df.groupby("family_size")["Survived"].mean()</code>.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

باستخدام عمود `age_group` من الخطوة 5، ما معدل النجاة لصندوق `"Child"`؟ كيف يقارن بإجابة التحدي 2 لديك للركاب تحت 18؟

<p class="challenge__answer">💡 <strong>Answer:</strong> استخدم عمود age_group من الخطوة 5 واقرأ معدل نجاته؛ قارنه بتصفية Age &lt; 18 الخام من التحدي 2 -- يجب أن يتّسقا عمومًا، رغم أن الحد بالضبط (12 مقابل 18) يختلف، لذا لن تتطابق الأرقام تمامًا.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

أعد تجميع معدل نجاة Pclass، لكن هذه المرة أدرج كلًا من متوسط *وعدد* الركاب في كل فئة، في استدعاء `.agg(...)` واحد — بحيث يمكنك الحكم على مدى ثقتك برقم كل فئة.

<p class="challenge__answer">💡 <strong>Answer:</strong> جمّع حسب Pclass واستخدم .agg(["mean", "count"]) على Survived، بحيث يظهر كل من معدل النجاة وحجم المجموعة معًا -- يمكن حينها الحكم على معدل مجموعة صغيرة بالحذر المناسب.</p>

</div>
</details>

## 🤔 أسئلة سقراطية

- عادة ما تُظهر نتيجة `.groupby(["Pclass", "Sex"])` المدمجة فجوة *أكبر بكثير* حسب الجنس منها حسب الفئة بمفردها. بماذا يوحي هذا عن أي متغيّر كان يقوم بمعظم "العمل" في نتائج التجميع أحادية المتغيّر السابقة؟
- ملء قيم `Age` المفقودة بالوسيط يفترض أن الأعمار المفقودة ليست مختلفة بشكل منهجي عن المعروفة. هل يمكنك التفكير في سبب قد يجعل ذلك الافتراض خاطئًا لمجموعة البيانات هذه تحديدًا (أي سبب يجعل *أنواعًا* معينة من الركاب أكثر احتمالًا لعمر مفقود)؟
- أجبت للتو عن عدة أسئلة تحليلية حقيقية باستخدام فقط أدوات من الأسابيع 6-9. أي دالة واحدة (`.groupby()`، القناع المنطقي، `.fillna()`، `.merge()`) انتهى بك الأمر لاستخدامها أكثر؟ هل يتطابق هذا مع توقعك لأي مهارة pandas هي الأهم عمليًا؟
- حواف صناديق `pd.cut` (`[0, 12, 18, 35, 60, 100]`) اختِيرت بشكل عشوائي إلى حد ما في هذا الدرس. كم تعتقد أن معدل نجاة "Child" قد يتغير لو نقلت حد الطفل/المراهق من 12 إلى، لنقل، 15؟ بماذا يوحي هذا عن الشفافية بخصوص خيارات التقسيم إلى صناديق في تقرير حقيقي؟
- تُبلغ الخطوة 6 بلغة بسيطة فقط عن متغيّرين (الفئة، الجنس) رغم أنك استكشفت عدة أخرى في التحديات. لو كنت تكتب هذا لشخص لم يرَ الأرقام الخام قط، أي نتيجة *إضافية واحدة* من التحديات تعتبرها الأكثر استحقاقًا للتضمين، ولماذا تلك بالذات؟

## ✅ اختبار الأسبوع

<div class="quiz" data-quiz="data-analysis-normal-week-10">
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">1. لعمود 0/1 (نجا/لم ينجُ)، بماذا تُمثّل .mean() داخل مجموعة؟</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">إجمالي عدد الناجين</button>
        <button class="quiz-q__opt" data-idx="1">معدل النجاة (النسبة) داخل تلك المجموعة</button>
        <button class="quiz-q__opt" data-idx="2">القيمة الأكثر شيوعًا</button>
        <button class="quiz-q__opt" data-idx="3">لا شيء ذو معنى — المتوسط يعمل فقط مع بيانات مستمرة</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">2. لماذا نملأ Age المفقود بالوسيط بدلًا من المتوسط في هذا الدرس؟</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">لا يمكن حساب المتوسط على عمود به قيم مفقودة</button>
        <button class="quiz-q__opt" data-idx="1">الوسيط أقل حساسية لتوزيع منحرف بقيم متطرفة</button>
        <button class="quiz-q__opt" data-idx="2">يُعطيان دائمًا نفس النتائج</button>
        <button class="quiz-q__opt" data-idx="3">لا تدعم pandas .mean() مع وجود NaN</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">3. تُجمّع df.groupby([&quot;Pclass&quot;, &quot;Sex&quot;]) الصفوف حسب:</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">Pclass فقط، متجاهلة Sex</button>
        <button class="quiz-q__opt" data-idx="1">كل مجموعة فريدة من Pclass وSex</button>
        <button class="quiz-q__opt" data-idx="2">Sex فقط، متجاهلة Pclass</button>
        <button class="quiz-q__opt" data-idx="3">لا شيء -- هذا يرفع خطأً</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">4. نمط التحليل الاستكشافي العام الذي استُخدم مرارًا هذا الأسبوع كان:</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">الدمج، ثم الترتيب</button>
        <button class="quiz-q__opt" data-idx="1">التصفية/التجميع، ثم التلخيص</button>
        <button class="quiz-q__opt" data-idx="2">حذف كل البيانات المفقودة، ثم الرسم</button>
        <button class="quiz-q__opt" data-idx="3">تحويل كل عمود إلى نص</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">5. ماذا تفعل pd.cut؟</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">تُزيل الصفوف بقيم مفقودة</button>
        <button class="quiz-q__opt" data-idx="1">تُقسّم عمودًا مستمرًا إلى نطاقات مُسمّاة (صناديق)</button>
        <button class="quiz-q__opt" data-idx="2">تدمج اثنين من DataFrame</button>
        <button class="quiz-q__opt" data-idx="3">ترتب عمودًا تصاعديًا</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <p class="quiz__summary" data-quiz-summary hidden></p>
    </div>

---

**🎉 أنهيت مسار Pandas وتحليل البيانات العادي — والدورة كاملة، إن أخذت المسار العادي في كلا القسمين.** توجّه إلى [تقدّمي](/progress) لرؤية أوسمتك، واطّلع على [مشاريع من العالم الحقيقي](/docs/projects): ثبّت بايثون فعليًا وابنِ شيئًا لم تستطع بيئة البرمجة تشغيله أبدًا.
