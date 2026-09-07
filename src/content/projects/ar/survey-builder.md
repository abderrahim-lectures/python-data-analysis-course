---
title: "منشئ الاستبيانات"
description: "أنشئ وحلل الاستبيانات مع المنطق التشعبي وجمع الاستجابات والتحليل الإحصائي."
difficulty: "intermediate"
estimatedMinutes: 75
tags: ["classes", "pandas", "statistics", "data-analysis"]
learningObjectives:
  - Model survey questions and branching logic with classes
  - Collect and store structured response data
  - Compute frequency distributions and cross-tabulations
  - Visualize survey results with bar charts and heatmaps
prerequisites:
  - "Python basics (classes, lists, dicts)"
  - "Comfort with `input()` for terminal input"
  - "pandas and matplotlib installed (covered in Setup)"
---

# 📋 اعِد منشئ استبيانات

الاستبيانات في كل مكان — نماذج التغذية الراجعة، أبحاث السوق، تقييمات الدورات — وخلف كل منها محرك مُنظَّم: أنواع الأسئلة، التحقق، الفروع الشرطية، والتحليل. يبني هذا المشروع ذلك المحرك من الصفر: مجموعة فئات بايثون تمثل أنواع الأسئلة المختلفة (اختيار متعدد، مقاييس تقييم، نص مفتوح)، ومحرك يُرتب الأسئلة بالمنطق التشعبي، وخط pandas يحوّل الاستجابات الخام إلى رسوم تكرارية وتقاطعات.

يُفترض أساسيات بايثون تشمل الفئات والقوائم والقواميس، ومعرفة `input()` — لا شيءeyond ذلك. هذا اختياري وغير مُقيَّم؛ راجع [المشاريع الواقعية](/docs/projects) للقائمة الكاملة المتنامية.

## 🎯 ما ستفعله

1. نمذجة أنواع أسئلة مختلفة (اختيار متعدد، مقياس تقييم، نص مفتوح) كفئات بايثون بتحقق مشترك وسلوك تشعبي.
2. بناء محرك `Survey` يُرتب الأسئلة ويُطبّق قواعد الفروع ويجمع الاستجابات.
3. محاكاة بيانات استجابة واقعية عندما لا يكون `input()` مفيدًا للتشغيل الآلي.
4. تحويل الاستجابات إلى DataFrame حسابات pandas وتوزيعات التكرار والمتوسطات والتقاطعات.
5. إنشاء رسوم أعمدة وخريطة حرارية تجعل نتائج الاستبيان سهلة التفسير بلمحة.

## أين تُشغّل هذا

يعمل هذا المشروع في أغلب الأماكن تقريبًا — pandas و matplotlib بايثون نقية، والجزء التفاعلي الوحيد هو `input()` الذي يعمل في أي طرفية.

**JupyterLite playground** يعمل جيدًا — الصق الخلايا مباشرة في دفتر. ستحتاج إلى `!pip install pandas matplotlib` في خلية أولًا. لاحظ أن `input()` يعمل بشكل مختلف في الدفتر عن الطرفية — وظيفة `simulate_responses()` في الخطوة 3 موجودة جزئًا لهذا السبب.

**Google Colab** يعمل مباشرة — المكتبتان مُثبّتتان مسبقًا، و `input()` يعمل أصليًا في الدفاتر.

**محليًا باستخدام `uv`** هو المسار المُوصى به لتشغيل حلقة التفاعل الحقيقية (الخطوة 2) حيث يسألك `input()` سؤالًا بسؤال — اتبع قسم الإعداد أدناه.

## الإعداد

كل ما تحتاجه قبل كتابة سؤال استبيان.

### ثبّت `uv`

`uv` أداة واحدة تحل محل سلسلة "تثبيت بايثون، ثم تثبيت pip، ثم تثبيت أداة البيئة الافتراضية، ثم تثبيت الحزم" — يمكنها تثبيت وإدارة إصدارات بايثون نفسها، بالإضافة إلى تبعيات مشروعك.

**macOS / Linux** (طرفية):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

أغلق وأعد فتح طرفتك، ثم تأكد من التثبيت:

```bash
uv --version
```

### أعد إعداد المشروع

```bash
uv init survey-builder
cd survey-builder
uv add pandas matplotlib
```

`pandas` يحوّل الاستجابات الخام إلى DataFrame منظّم للإحصائيات والتقاطعات؛ `matplotlib` يُنتج الرسوم البيانية. كلاهما بايثون نقية (مع NumPy تحتها)، فتثبّت بوضوح مع `uv`.

**✅ قائمة التحقق**

- ✅ `uv --version` طبع رقم إصدار.
- ✅ `survey-builder/` موجود بملف `pyproject.toml`، و `pandas` و `matplotlib` مُثبّتتان.
- ✅ `uv run python -c "import pandas, matplotlib; print('all good')"` طبع `all good`.

## الخطوة 1: حدد أنواع الأسئلة

استبيان ليس نموذجًا واحدًا — بل سلسلة من الأسئلة المختلفة، لكل منها صيغة إدخاله وقواعد التحقق وسلوكه التشعبي. نمذجة كل نوع كفئة تتيح لك مشاركة الأجزاء المشتركة (العرض، التحقق، الفروع) في فئة أساسية مع تخصيص التفاصيل لكل نوع.

### 1.1 أنشئ فئة `Question` الأساسية وفئتين فرعيتين

```python
from dataclasses import dataclass, field
from typing import Any, Optional

@dataclass
class Question:
    text: str
    required: bool = True
    branch_rules: dict[str, str] = field(default_factory=dict)

    def display(self) -> None:
        print(f"\n  {self.text}")

    def validate(self, answer: Any) -> bool:
        return True

    def next_question_id(self, answer: Any) -> Optional[str]:
        return self.branch_rules.get(str(answer))

@dataclass
class MultipleChoice(Question):
    options: list[str] = field(default_factory=list)

    def display(self) -> None:
        print(f"\n  {self.text}")
        for i, opt in enumerate(self.options, 1):
            print(f"    {i}. {opt}")

    def validate(self, answer: str) -> bool:
        return answer in [str(i) for i in range(1, len(self.options) + 1)]

@dataclass
class RatingScale(Question):
    low_label: str = "Poor"
    high_label: str = "Excellent"
    scale_min: int = 1
    scale_max: int = 5

    def display(self) -> None:
        print(f"\n  {self.text}")
        print(f"    {self.scale_min} ({self.low_label}) — {self.scale_max} ({self.high_label})")

    def validate(self, answer: str) -> bool:
        try:
            return self.scale_min <= int(answer) <= self.scale_max
        except ValueError:
            return False

mc = MultipleChoice("How often do you exercise?", options=["Daily", "Weekly", "Monthly", "Rarely"])
rating = RatingScale("How satisfied are you?", low_label="Not at all", high_label="Very")
mc.display()
rating.display()
print(f"MC valid '2': {mc.validate('2')} | Rating valid '6': {rating.validate('6')}")
```

**👟 تلميح البداية :** فئة `Question` الأساسية تفعل فقط ما هو مشترك بين كل سؤال: تخزين النص، التحقق (بساطة، `True`)، والبحث عن قاعدة فرعية. `MultipleChoice` و `RatingScale` تُوريثان منها وتُ著作ان `display()` و `validate()` — نمط الوراثة الذي يتيح لمحرك `Survey` التعامل مع كل سؤال بنفس الطريقة. لاحظ أن `branch_rules` قاموس يربط الإجابة بمعرف السؤال التالي.

**🎯 الناتج المتوقع :**
```
  How often do you exercise?
    1. Daily
    2. Weekly
    3. Monthly
    4. Rarely

  How satisfied are you?
    1 (Not at all) — 5 (Very)
MC valid '2': True | Rating valid '6': False
```

**🩹 إذا لم يعمل :** إذا أعاد `MultipleChoice.validate('2')` قيمة `False`، تحقق أن `options` يحتوي على عنصرين على الأقل — التحقق يبني `range(1, len(options)+1)`. إذا أعاد `RatingScale.validate('6')` قيمة `True`، ف `scale_max` لا يُطبّق — تأكد من تحويل `int(answer)` وترتيب مقارنة `<=`.

### 1.2 تحقق من فئات الأسئلة

**✅ قائمة التحقق**

- ✅ `MultipleChoice.validate("2")` تساوي `True`، و `validate("5")` تساوي `False` لسؤال بأربعة خيارات.
- ✅ `RatingScale.validate("3")` تساوي `True`، و `validate("0")` و `validate("6")` كلتاهما `False`.
- ✅ يمكنك تفسير لماذا تحفظ `MultipleChoice` الخيارات كقائمة نصوص بدلاً من أعداد صحيحة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- فئة `RatingScale` تحفظ `scale_min` و `scale_max` كسمات فئة بقيم افتراضية. إذا أردت مقياس 1–10، ماذا ستُ著作 عند التهيئه — وهل سيحتاج `validate` إلى التغيير؟
- `MultipleChoice.validate` يبني قائمة الإجابات الصحيحة من `len(self.options)`. ماذا يحدث إذا كان لديك 10 خيارات — هل سيحتاج كود التحقق إلى التغيير، أم أنه يت_scale تلقائيًا؟ لماذا؟

## الخطوة 2: أنشئ محرك الاستبيان

`Question` بمعزل عنها خاملة. فئة `Survey` تُرتبها، وتُطبّق قواعد الفروع لتحديد السؤال التالي، وتجمع الإجابات في كائن `SurveyResponse` واحد يمكنك تحليله لاحقًا.

### 2.1 أنشئ فئتي `Survey` و `SurveyResponse`

```python
from dataclasses import dataclass
from typing import Any, Optional

@dataclass
class SurveyResponse:
    survey_title: str
    answers: dict[str, Any]
    timestamp: str = ""

    def __post_init__(self):
        if not self.timestamp:
            from datetime import datetime
            self.timestamp = datetime.now().isoformat()

class Survey:
    def __init__(self, title: str):
        self.title = title
        self.questions: dict[str, Question] = {}
        self.order: list[str] = []

    def add_question(self, q_id: str, question: Question) -> None:
        self.questions[q_id] = question
        self.order.append(q_id)

    def run(self) -> SurveyResponse:
        print(f"\n  Survey: {self.title}")
        answers: dict[str, Any] = {}
        idx = 0
        while idx < len(self.order):
            q_id = self.order[idx]
            question = self.questions[q_id]
            question.display()
            while True:
                answer = input("  Your answer: ").strip()
                if not question.required and answer == "":
                    break
                if question.validate(answer):
                    answers[q_id] = answer
                    break
                print("  Invalid answer, please try again.")
            branch = question.next_question_id(answer)
            idx = self.order.index(branch) if branch and branch in self.questions else idx + 1
        print("  Thank you for completing the survey!")
        return SurveyResponse(survey_title=self.title, answers=answers)
```

**👟 تلميح البداية :** حلقة `while idx < len(self.order)` تسير عبر الأسئلة بالترتيب. بعد كل إجابة، تبحث عن `next_question_id(answer)` — إذا قالت قواعد الفروع "الإجابة 2 تقفز إلى السؤال 'followup'"، يقفز الفهرس إلى هناك؛ وإلا يتقدم واحدًا. `SurveyResponse.__post_init__` يضع طابعًا زمنيًا عندما لا يُقدم واحد — فئات البيانات تُنفّذ `__post_init__` مباشرة بعد `__init__`، وهو المكان المعتاد للمنطق المعتمد على القيم الافتراضية.

**🎯 الناتج المتوقع :** تشغيل `Survey("Health Survey").run()` يُسأل سؤالًا بسؤالًا ويعيد `SurveyResponse` بالإجابات المجمّعة وطابعًا زمنيًا.

**🩹 إذا لم يعمل :** إذا علق المحرك في حلقة لا نهائية، فالغالب أن `branch` يشير إلى معرف سؤال غير موجود في `self.questions` — احتياطي `else idx + 1` يعمل فقط عندما يكون الفرع None أو غير موجود، فمعرف مكتوب خطأ في `branch_rules` يتسبب في تكرار السؤال نفسه. إذا أخطأ `input()` فورًا في دفتر، فأنت في خلية غير تفاعلية — استخدم نهج المحاكاة من الخطوة 3 بدلاً من ذلك.

### 2.2 تحقق من محرك الاستبيان

**✅ قائمة التحقق**

- ✅ `Survey.run()` يكمل ويعيد `SurveyResponse` بمفاتيح تتطابق مع معرفات أسئلتك.
- ✅ سؤال مطلوب يتلقى إجابة غير صحيحة يُطلب منك إجابتك مجددًا، لا يقبل أبدًا المدخلات الخاطئة.
- ✅ سؤال اختياري (`required=False`) يقبل إجابة فارغة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يستخدم المحرك حلقة `while idx < len(self.order)` بدلاً من حلقة `for` عبر `self.order`. لماذا تحتاج `while` عندما يمكن لتعليمات الفرع تقفيّم الفهرس إلى الأمام أو الخلف؟
- إذا كان سؤالان بنفس النص المعروض لكن بمعرفين مختلفين، كيف سيميز سجل الاستبيان بينهما؟ ماذا يوحي هذا لماذا يجب أن تكون معرفات الأسئلة فريدة؟

## الخطوة 3: اجمع الاستجابات — مباشرة ومحاكاة

الاستبيانات الحقيقية تحتاج إلى استجابات كثيرة، لكن تشغيل `input()` 30 مرة في طرفية غير عملي. تبني هذه الخطوة المسارين: حلقة تستدعي `survey.run()` للجمع المباشر، ودالة `simulate_responses()` تولّد استجابات عشوائية واقعية حتى لا يعتمد التحليل على شخص يجلس أمام لوحة مفاتيح.

### 3.1 اجمع الاستجابات المباشرة

```python
def collect_responses(survey: Survey, count: int) -> list[SurveyResponse]:
    responses = []
    for i in range(count):
        print(f"\n--- Participant {i + 1} of {count} ---")
        responses.append(survey.run())
    return responses
```

### 3.2حاكي الاستجابات للتحليل الآلي

```python
def simulate_responses() -> list[dict]:
    import random
    return [{
        "exercise_freq": str(random.choice([1, 2, 3, 4])),
        "satisfaction": str(random.randint(1, 5)),
        "recommend": str(random.choice([1, 2, 3, 4, 5])),
        "feedback": random.choice(["Great service", "Needs improvement", "Excellent", "Could be better"]),
    } for _ in range(30)]

responses = simulate_responses()
print(f"Collected {len(responses)} simulated responses")
```

**👟 تلميح البداية :** `collect_responses` هو المسار المباشر — استدعِه بـ `Survey` وعدد وشغّل الاستبيان تلك المرات، كل منها يُنتج `SurveyResponse`. `simulate_responses` هو المسار الآلي — يستخدم `random` لتوليد 30 إجابة مرجحة بنفس المفاتيح التي تُنتجها أسئلة استبيانك. يجب أن تتطابق المفاتيح مع معرفات أسئلتك تمامًا، وإلا لن يجد خط pandas الأعمدة الصحيحة.

**🎯 الناتج المتوقع :**
```
Collected 30 simulated responses
```

**🩹 إذا لم يعمل :** إذا أعاد `random.choice([1, 2, 3, 4])` عددًا صحيحًا من numpy يكسر الكود التالي، فالقيم محفوظة كنصوص (`str(...)`) — هذا مقصود. إذا رأيت `KeyError` عند بناء DataFrame لاحقًا، فاستجابة محاكاة مفقودة منها مفتاح تُنتجه أسئلة استبيانك — تحقق من تطابق مفاتيح `simulate_responses` مع معرفات أسئلتك.

### 3.3 تحقق من جمع الاستجابات

**✅ قائمة التحقق**

- ✅ `simulate_responses()` تعيد قائمة من 30 قاموسًا، كل منها بنفس الأربعة مفاتيح.
- ✅ قيم كل استجابة نصوص ( ليست أعدادًا صحيحة)، تتطابق مع ما تُنتجه `Survey.run()` من `input()`.
- ✅ `collect_responses` تُنتج قائمة كائنات `SurveyResponse` عند تمرير `Survey` حقيقي.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تُحفظ الاستجابات كنصوص (`"2"`, `"4"`) رغم تمثيلها لأرقام. لماذا هذا يطابق الواقع — ماذا يُعيد `input()`، وكيف يحفظ التخزين الخام المعلومات؟
- `simulate_responses` تستخدم `random.choice` لكل شيء. كيف سيبدو التوزيع إذا استخدمت `random.randint(1, 4)` بدلاً من `random.choice([1, 2, 3, 4])`؟ كيف سيتغيّر التحليل؟

## الخطوة 4: حلل النتائج بـ pandas

البيانات مجمّعة — الآن تحتاج أن تصبح رؤية. تحول هذه الخطوة قائمة الاستجابات إلى DataFrame، وتربط الإجابات الرقمية الخام بتصنيفات مقروءة، وتحسب توزيعات التكرار والمتوسطات التي تُجيب على أسئلة مثل "كم مرة يمارس الناس الرياضة؟" و "كم راضون في المتوسط؟"

### 4.1 حوّل إلى DataFrame واحسب الإحصائيات

```python
import pandas as pd

df = pd.DataFrame(responses)

freq_map = {"1": "Daily", "2": "Weekly", "3": "Monthly", "4": "Rarely"}
df["exercise_label"] = df["exercise_freq"].map(freq_map)
exercise_counts = df["exercise_label"].value_counts()
satisfaction_counts = df["satisfaction"].value_counts().sort_index()

print("Exercise Frequency:")
print(exercise_counts)
print(f"\nAverage Satisfaction: {df['satisfaction'].astype(int).mean():.2f}")
```

**👟 تلميح البداية :** `pd.DataFrame(responses)` يحوّل قائمة قواميس إلى صفوف وأعمدة تلقائيًا. `.map(freq_map)` يحوّل `"1"` الخام إلى النص المقروء `"Daily"` — هذه خطوة البحث/إعادة الترميز الكلاسيكية في تحليل الاستبيانات. `value_counts()` يعدّ كم مرة تظهر كل قيمة، و `df[...].astype(int).mean()` يحسب المتوسط الرقمي بتحويل عمود النصوص إلى أعداد صحيحة أولًا.

**🎯 الناتج المتوقع :**
```
Exercise Frequency:
Daily         <count>
Weekly        <count>
Monthly        <count>
Rarely        <count>
Name: exercise_label, dtype: int64

Average Satisfaction: <number between 1.0 and 5.0>
```

**🩹 إذا لم يعمل :** `KeyError: 'exercise_freq'` يعني أن `responses` لا يحتوي على هذا العمود — تحقق من تطابق مفاتيح `simulate_responses` مع `exercise_freq`، `satisfaction` إلخ تمامًا. إذا كان `exercise_counts` فارغًا، ف `value_counts()` وجد فقط قيم NaN — تحقق مما إذا كان `df["exercise_freq"]` None أو NaN في بعض الصفوف. إذا فشل `.astype(int)`، فقيمة استجابة ليست نصًا صحيحًا — تحقق من وجود مسافات أو أحرف إضافية.

### 4.2 ابنِ جدول تقاطعي

```python
cross_tab = pd.crosstab(df["exercise_label"], df["satisfaction"])
print("\nExercise Frequency vs Satisfaction:")
print(cross_tab)
```

**🎯 الناتج المتوقع :** جدول بـ 4 صفوف و5 أعمدة، كل خلية فيه عدد المستجيبين بذلك التكرار الرياضي وتلك درجة الرضا.

**🩹 إذا لم يعمل :** إذا أعاد `pd.crosstab` خطأ حول فهارس مكررة، فقد يكون لديك تصنيفات رياضية مكررة — غير محتمل مع `map` نظيف، لكن تحقق من وجود أخطاء إملائية في `freq_map`. إذا كان الجدول يحتوي خلايا NaN، ف `pd.crosstab` يتعامل مع التجميعات الفارغة كـ 0 افتراضيًا — تأكد من أنك لا تنظر إلى بيانات مفقودة بدلاً من عدّ فعلي صفري.

### 4.3 تحقق من التحليل

**✅ قائمة التحقق**

- ✅ `pd.DataFrame(responses)` يُنشئ DataFrame بنفس المفاتيح كأعمدة.
- ✅ `exercise_counts` يُظهر توزيع تكراري عبر أربعة تصنيفات — لا ينقص أي تصنيف عندما يكون ممثلًا في البيانات.
- ✅ `pd.crosstab(df["exercise_label"], df["satisfaction"])` يُنتج جدولًا غير تافه (صفوف > 1).

**🤔 سؤال (أسئلة) socrates)**

- `value_counts()` يحذف القيم المفقودة افتراضيًا، بينما `crosstab` يتعامل مع التجميع غير الظاهر كـ 0. متى يكون هذا الفرق مهمًا — هل يمكنك التفكير في حالة تريد فيها بقاء صف مفقود بدلاً من أن يصبح 0؟
- إذا غيرت مقياس الرضا من 1–5 إلى 1–10، ما الكود الذي سي以免؟ سيُظهر `crosstab` تلقائيًا 10 أعمدة — هل سيحتاج أي خطوة أخرى إلى تغييرات؟

## الخطوة 5: اعرض النتائج

الأرقام في DataFrame دقيقة لكنها بطيئة الاستيعاب. رسومتان عموديتان — واحدة لتكرار الرياضة، وواحدة لتوزيع الرضا — تحوّلان العدّات إلى صورة مقروءة بلمحة.

### 5.1 ابنِ الرسوم البيانية

```python
import matplotlib.pyplot as plt

fig, axes = plt.subplots(1, 2, figsize=(12, 5))

colors_ex = ["#2ecc71", "#3498db", "#f39c12", "#e74c3c"]
exercise_counts.plot(kind="bar", ax=axes[0], color=colors_ex)
axes[0].set_title("Exercise Frequency")
axes[0].set_ylabel("Responses")
axes[0].tick_params(axis="x", rotation=45)

colors_sat = ["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#27ae60"]
satisfaction_counts.plot(kind="bar", ax=axes[1], color=colors_sat[:len(satisfaction_counts)])
axes[1].set_title("Satisfaction Ratings")
axes[1].set_ylabel("Responses")

plt.tight_layout()
plt.savefig("survey_results.png", dpi=150)
plt.show()
```

**👟 تلميح البداية :** `plt.subplots(1, 2, figsize=(12, 5))` يُنشئ شكلًا واحدًا بمحورين جنباً إلى جنب. كل `Series.plot(kind="bar", ax=axes[n])` يرسم على رسم فرعي محدد؛ مصفوفات الألوان مرتبة بحيث الرضا المنخفض أحمر والرضا المرتفع أخضر — خيار بصري مقصود يتطابق مع ارتباطات "الأحمر = سيئ، الأخضر = جيد" البديهية. `color=colors_sat[:len(satisfaction_counts)]` يقصّ القائمة إلى العدد الفعلي لقيم التقييم الموجودة، فيستبيان لم يختار فيه أحد 5 لا يُظهر عمودًا فارغًا.

**🎯 الناتج المتوقع :** رسومتان عموديتان في شكل واحد: تكرار الرياضة على اليسار (4 أعمدة ملونة)، وتقييمات الرضا على اليمين (حتى 5 أعمدة ملونة). يُحفظ الشكل في `survey_results.png` في مجلد مشروعك ويعرض على الشاشة.

**🩹 إذا لم يعمل :** شكل فارغ (بدون أعمدة) يعني أن Series الذي ترسمه فارغ — تحقق من وجود بيانات في `exercise_counts` و `satisfaction_counts`. إذا أظهرت رسمة الرضا 3 ألوان فقط لكن 5 تقييمات، ف `satisfaction_counts` يحتوي على أقل من 5 قيم فريدة — هذه بيانات لا خلل، والقص هو ما يحافظ على توافق القائمة. إذا أظهر `plt.show()` شيئًا في بيئة بدون شاشة، فقد كتب `savefig` الملف بالفعل — تحقق منه.

### 5.2 تحقق من العرض

**✅ قائمة التحقق**

- ✅ `survey_results.png` موجود في مجلد مشروعك (أو يُخرج الدفتر الشكل).
- ✅ كلا الرسمين الفرعيين لهما عنوانان (`Exercise Frequency`, `Satisfaction Ratings`) وتسمية محور y.
- ✅ أعمدة الرضا تستخدم ترتيب ألوان يُcommunicates بصريًا الرضا المنخفض إلى المرتفع.

**🤔 سؤال (أسئلة) socrates)**

- مصفوفات الألوان مُثبّتة بخمسة أكواد ستة عشريّة. ماذا يحدث إذا شغّلت الاستبيان بمقياس 10 نقاط — هل الألوان لا تزال تتناسب بشكل معقول، أم تحتاج إلى توليدها برمجيًا؟
- `plt.savefig("survey_results.png")` يكتب في الدليل الحالي. ماذا سي免除 إذا شغّلت هذا السكربت من دليل عمل مختلف، وماذا يعطيك `Path(__file__).parent` بدلاً من ذلك؟

## ⚠️ المآزق الشائعة

- **معرفات الأسئلة لا تتطابق مع مفاتيح الاستجابة.** `Survey.run()` يخزّن الإجابات تحت معرفات الأسئلة التي تمررها إلى `add_question`، و `simulate_responses()` تعيد قواميس بمفاتيح مُثبّتة. إذا كان المعرف في `add_question` هو `"exercise_freq_x"` لكن المحاكاة تستخدم `"exercise_freq"`، فسينقص DataFrame عمود. حافظ على تزامنهما — أو الأفضل، ا驱动 مفاتيح المحاكاة من الاستبيان نفسه.
- **التباس النصوص والأعداد.** `input()` يُعيد نصوصًا، فتعليقات مثل "`6` خارج النطاق" مقارنات نصية. `df["satisfaction"].astype(int).mean()` يُحوّل قبل التوسيط؛ نص رقمي خاطئ (مثل فراغ من سؤال اختياري) يجعل `.astype(int)` يُلقى خطأ. اصفِ أو املأ NaN قبل التحويل.
- **حلقة الفروع قد تدور إلى الأبد.** إذا ربطت `branch_rules` إجابة بمعرفة سؤال غير موجودة في `self.questions`، ف `else idx + 1` لا يعمل والمحرك يُعيد السؤال نفسه. أخطاء إملائية في المفاتيح هي السبب الكلاسيكي — احفظ مصدر حقيقة واحد لمعرفات الأسئلة.
- **`value_counts` يحذف المفقودات مقابل `crosstab` يعدّ 0.** مستجيب يتخطى سؤالاً اختياريًا يختفي من `value_counts()` لكن يظهر كعدّ 0 في `crosstab` فقط إذا كان التصنيف موجودًا في مكان آخر. اعرف أي سلوك يحتاجه تحليلك قبل تفسير الرسم.

## ما بنيته للتو

منصة استبيان كاملة: فئات أسئلة آمنة النوع مع التحقق، محرك استبيان تشعبي، جمع استجابات مباشر ومحاكي، وخط تحليل بت Cubs يحوّل الإجابات الخام إلى تكرارات ومتوسطات وتقاطعات ورسومًا متجاورة. تعلمت أيضًا النمط الأساسي لأي سير عمل تحليل بيانات: خام → منظم → إحصائيات → عرض.

:::tip[شغّل نسخة أكمل بدون إعداد محلي]
[`examples/survey-builder/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/survey-builder) في دورة الكود نسخة أكمل بخريطة حرارية للتقاطعات، ودوال تصفية الاستجابات (اعرض كل ممارسي الرياضة اليوميين واحسب متوسط رضاهم)، وفروع متعددة المستويات. استنسخها، أو افتح الدورة الكاملة في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) وشغّلها من هناك.
:::

## إلى أين تذهب من هنا

- أضف خريطة حرارية للتقاطعات: استخدم `pd.crosstab` + `matplotlib.imshow` (أو `heatmap` من Seaborn) لعرض تكرار الرياضة مقابل الرضا كشبكة ألوان بدلاً من جدول أرقام.
- أضف تصفية الاستجابات: اكتب دالة تعيد فقط المستجيبين الذين اختاروا إجابة محددة (مثلاً، كل ممارسي الرياضة اليوميين) واحسب متوسط رضاهم — الكشف يكشف رؤية المجموعات الفرعية التي يفوتها التلخيص.
- وسّع الفروع إلى متعددة المستويات: عندما تقفز الإجابة A في السؤال 1 إلى السؤال X، والإجابة B في السؤال X إلى السؤال Y، يحتاج منطق `next_question_id` و `order.index(branch)` إلى التعامل مع سلاسل الفروع، لا مجرد القفزات الفردية.

## شارك مشروعك مع الفصل

بنيت شيئًا تفتخر به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع قدمها طلاب آخرون — و README الخاص به يحتوي على دليل كامل ومناسب للمبتدئين لإضافة مشروعك عبر **طلب سحب**، حتى لو لم تستخدم git من قبل: تفرّع المستودع، وإنشاء فرع، وعمل commit لملفاتك، وفتح طلب السحب، خطوة بخطوة. لا يُفترض خبرة git مسبقة.

أهلاً بكتابة بايثون خارج المتصفح. 🎓
