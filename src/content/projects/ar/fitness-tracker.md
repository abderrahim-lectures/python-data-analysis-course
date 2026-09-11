---
title: "متتبع اللياقة البدنية"
description: "تتبع التمارين والتغذية ومقاييس الصحة مع تصور التقدم وتحديد الأهداف."
difficulty: "beginner"
estimatedMinutes: 60
tags: ["classes", "pandas", "matplotlib", "data-analysis"]
learningObjectives:
  - "تمثيل التمارين والوجبات كصفوف بيانات ذات خصائص مشتقة"
  - "تسجيل جلسات التمرين الكاملة وحساب إجمالي حجم التدريب"
  - "تتبع التغذية اليومية مع إجماليات المغذيات الكبرى وتوزيع السعرات"
  - "تحويل التاريخ إلى pandas وحساب متوسط متحرك"
  - "رسم اتجاهي وزن الجسم وحجم التدريب جنبًا إلى جنب"
prerequisites: ["أساسيات Python (الصفوف، القواميس، القوائم)", "pip install pandas matplotlib"]
---

# 🛠️ 💪 ابنِ متتبع لياقة بدنية

سجل التمارين هو أبسط مشروع تحليل بيانات يوجد: تجمع أرقامًا كل يوم، والجزء المثير هو مشاهدة تغيرها بمرور الوقت. يبني هذا المشروع تلك الحلقة من الصفر — ستمثّل التمارين والوجبات كصفوف بيانات مصنَّفة، وتسجّل الجلسات وتحسب حجم التدريب، وتتتبع المغذيات الكبرى ونسب السعرات، وتحوّل كل شيء إلى إطار بيانات pandas، وترسم اتجاهي الوزن والقوة جنبًا إلى جنب بـ matplotlib. لا مفاتيح API ولا بيانات اعتماد ولا خدمات خارجية: فقط بياناتك المنظمة وأنفسك وسلسلة من الأسئلة الذكية بصورة متزايدة عنها.

هذا يفترض أساسيات Python وأنسًا أساسيًا بالقوائم والقواميس — لا شيء من تحليل البيانات مطلوب. المشروع اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة والمتنامية.

## 🎯 ما ستفعله

1. تمثّل التمارين والوجبات الفردية كأنواع `@dataclass` مع خاصية `volume` تحسب إجمالي الوزن المرفوع.
2. تسجّل جلسة تمرين كاملة — قائمة تمارين — وتحسب إجمالي الحجم والمدة.
3. تتتبع وجبات يوم، وتجمع إجماليات المغذيات الكبرى، وتحسب النسبة المئوية للسعرات التي يساهم بها كل مغذٍّ كبير.
4. تحوّل تاريخك اليومي إلى `DataFrame` عبر pandas وتحسب متوسطًا متحركًا.
5. ترسم اتجاهي وزن الجسم وحجم التدريب جنبًا إلى جنب في شكل matplotlib مكوَّن من لوحتين.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي الموصى به — `pandas` و`matplotlib` كلاهما تثبيتا Python نقيان، وأي طرفية حقيقية ستعرض الرسوم وتقوم بحفظ ملفات PNG.

**GitHub Codespaces** يعمل تمامًا أيضًا: افتح [مستودع الدورة في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) وشغّل من هناك. كل شيء يتصرف بنفس الطريقة.

**Google Colab وKaggle Notebooks وBinder مناسبة فعلًا لهذا المشروع** — لا شيء هنا يعتمد على خطوط نظام أو ملفات ثنائية خارجية أو نظام ملفات محلي. يستخدم الدفتر أدناه نفس أسبوع البيانات الاصطناعي الذي تبني نحوه الخطوات، فتُعرض إطارات pandas ورسوم matplotlib مضمنةً دون أي إعداد. هذا أحد المشاريع التي تتناسب فعلًا مع نموذج الدفتر بسلاسة، من البداية إلى النهاية.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/fitness-tracker/notebook.ar.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/fitness-tracker/notebook.ar.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Ffitness-tracker%2Fnotebook.ar.ipynb)

## الإعداد

كل ما تحتاجه مكتبتان من PyPI — لا ملفات ثنائية خارجية ولا مفاتيح API.

### ثبّت `uv`

`uv` أداة واحدة تحل محل السلسلة المعتادة «ثبّت Python، ثم ثبّت pip، ثم ثبّت أداة بيئة افتراضية، ثم ثبّت الحزم» — يمكنه تثبيت وإدارة إصدارات Python بنفسه، إلى جانب تبعيات مشروعك.

**macOS / Linux** (الطرفية):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

أغلق طرفيتك وأعد فتحها، ثم تأكد من تثبيته:

```bash
uv --version
```

### أعدّ المشروع

```bash
uv init fitness-tracker
cd fitness-tracker
uv add pandas matplotlib
```

يمنحك `pandas` كائن `DataFrame` — البنية الصحيحة للبيانات الجدولية والسلاسل الزمنية — ويرسم `matplotlib` الرسوم. كل ما بعد هذا Python نقي إضافة إلى هاتين المكتبتين.

**✅ قائمة التحقق**

- ✅ يطبع `uv --version` رقم إصدار.
- ✅ يوجد `fitness-tracker/` مع `pyproject.toml`، ومثبَّتة `pandas` و`matplotlib`.

## الخطوة 1: مثّل التمارين والوجبات كصفوف بيانات

كل تمرين له الشكل نفسه: اسم، وعدد مجموعات، وتكرارات، ووزن، ومدة اختيارية. يفرض `@dataclass` ذلك الشكل ويمنحك خاصية `volume` محسوبة — إجمالي الوزن المرفوع في مجموعة — فلا تعيد حسابها يدويًا قط.

### 1.1 عرّف Exercise وMeal

**👟 تلميح البداية :** استخدم `@dataclass` مع `@property` لـ `volume` (مجموعات × تكرارات × وزن)، واكتب دالة `summary()` قابلة للقراءة البشرية على كل صف للعرض.

```python
# fitness_tracker.py
from datetime import date
from dataclasses import dataclass

@dataclass
class Exercise:
    name: str
    sets: int
    reps: int
    weight_kg: float
    duration_min: int = 0

    @property
    def volume(self) -> float:
        """Total weight lifted: sets × reps × weight."""
        return self.sets * self.reps * self.weight_kg

    def summary(self) -> str:
        return f"{self.name}: {self.sets}x{self.reps} @ {self.weight_kg}kg (vol: {self.volume:.0f})"

@dataclass
class Meal:
    name: str
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float

    def summary(self) -> str:
        return f"{self.name}: {self.calories} kcal (P:{self.protein_g}g C:{self.carbs_g}g F:{self.fat_g}g)"

bench = Exercise("Bench Press", sets=4, reps=8, weight_kg=60)
print(bench.summary())
print(f"Volume: {bench.volume:.0f} kg")

chicken = Meal("Grilled Chicken", calories=350, protein_g=40, carbs_g=5, fat_g=10)
print(chicken.summary())
```

`volume` كخاصية `@property` بدلًا من دالة اعتيادية تعني أنك تكتب `bench.volume` لا `bench.volume()` — الفرق في استدعاء الأقواس تجميلي، لكن النمط `@property` يشير إلى «هذه حقيقة مشتقة عن الحالة الحالية، لا أمر يفعل شيئًا». دالتا `summary()` دالتان اعتياديتان لأنهما تنتجان *سلسلة عرض*، وهي خدمة لا خاصية — التمييز في التسمية يبقي API قابلًا للتنبؤ.

**🎯 الناتج المتوقع :** يطبع `Bench Press: 4x8 @ 60kg (vol: 1920)` متبوعًا بـ`Volume: 1920 kg`، ثم `Grilled Chicken: 350 kcal (P:40g C:5g F:10g)`.

**🩹 إذا لم يعمل :** إذا طبع `volume` القيمة `0.0` رغم مدخلات غير صفرية، فأنت تستدعيه بـ `()` — إنه خاصية، والأقواس تستدعي مُحصِل الخاصية و*ترجع* القيمة، لكن طباعة النتيجة جيدة. الخطأ الأرجح هو `volume = sets * reps * weight` في جسم الصف دون مصمِّم `@property` — تحقق أن سطر `@property` مباشرة فوق `def volume`.

### 1.2 تحقّق من النماذج

**✅ قائمة التحقق**

- ✅ نسخ `Exercise` و`Meal` تُنشأ بسلاسة و`volume` يحسب الناتج الصحيح.
- ✅ يمكنك شرح لماذا `@property` هو الخيار الصحيح لـ `volume` ودالة اعتيادية لـ `summary()`.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- إذا خزنت `volume` كخاصية اعتيادية (محسوبة في `__post_init__`) بدلًا من `@property`، فماذا يحدث عندما تغيّر `sets` أو `weight_kg` بعد الإنشاء — وهل يهم ذلك لهذا المشروع؟
- `Exercise` له `duration_min: int = 0` بقيمة افتراضية، بينما `name` بلا قيمة افتراضية. لماذا يجب أن يأتي `duration_min` بعد `name` في قائمة الحقول، وما قاعدة Python التي تفرض ذلك؟

## الخطوة 2: سجّل جلسات التمرين

التمرين حركة واحدة؛ وجلسة التمرين مجموعة تمارين أُديت في يوم واحد. يغلّف صف `WorkoutSession` تلك المجموعة ويحسب إجمالي حجم اليوم ومدته — أول رقمين يستحقان التتبع عبر الزمن.

### 2.1 عرّف WorkoutSession

**👟 تلميح البداية :** خزّن التمارين في قائمة عادية، واحسب `total_volume()` كمجموع خاصية `volume` لكل تمرين — لا حاجة للحلقات إذا استخدمت تعبير مولد.

```python
# fitness_tracker.py (continued)
class WorkoutSession:
    def __init__(self, session_date: str | None = None):
        self.date = session_date or date.today().isoformat()
        self.exercises: list[Exercise] = []

    def add_exercise(self, exercise: Exercise) -> None:
        self.exercises.append(exercise)
        print(f"  + {exercise.summary()}")

    def total_volume(self) -> float:
        return sum(ex.volume for ex in self.exercises)

    def duration(self) -> int:
        return sum(ex.duration_min for ex in self.exercises)

    def display(self) -> str:
        lines = [f"Workout — {self.date}", "-" * 40]
        for ex in self.exercises:
            lines.append(f"  {ex.summary()}")
        lines.append(f"  Total volume: {self.total_volume():.0f} kg")
        lines.append(f"  Total duration: {self.duration()} min")
        return "\n".join(lines)

session = WorkoutSession("2025-01-13")
session.add_exercise(Exercise("Bench Press", 4, 8, 60, 15))
session.add_exercise(Exercise("Overhead Press", 3, 10, 30, 10))
session.add_exercise(Exercise("Lateral Raise", 3, 15, 10, 8))
print(session.display())
```

`session_date or date.today().isoformat()` افتراضي عملي: كل جلسة لها طابع زمني، لكن يمكنك تجاوزه لتعبئة سجل رجعي من يوم محدد. `sum(ex.volume for ex in self.exercises)` تعبير مولد يتجنب بناء قائمة وسيطة — لثلاثة تمارين لا يهم، لكنه الشكل الصحيح عندما يكون لديك عشرات وتريد أن يكون الحمل على الذاكرة صفرًا.

**🎯 الناتج المتوقع :** يطبع كل تمرين عند إضافته، ثم ملخصًا يعرض إجمالي الحجم (`1920 + 900 + 450 = 3270 kg`) والمدة الإجمالية (`15 + 10 + 8 = 33 min`).

**🩹 إذا لم يعمل :** إذا كانت `total_volume()` تُرجع `0.0` رغم تمارين حقيقية، فالتمارين أُلحقت بقائمة مختلفة (تحقق أنك تستخدم `self.exercises`، لا متغيرًا محليًا). إذا شُغّلت `display()` لكنها لم تُظهر تمارين، فلن يُستدعى `add_exercise` قط بين بناء `session` واستدعاء `display()` — التمارين تُضاف يدويًا، لا سحريًا.

### 2.2 تحقّق من الجلسة

**✅ قائمة التحقق**

- ✅ ترجع `session.total_volume()` 3270.0، وترجع `session.duration()` 33.
- ✅ يتضمن مخرَج `display()` التمارين الثلاثة، وأحجامها الفردية، والإجماليات.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- إذا سجّلت *نفس* التمرين مرتين (إلحاق مكرر)، فإن `total_volume()` ستعده مرتين بصمت. ما الحارس البسيط الذي يمكنك إضافته داخل `add_exercise` لمنع التكرارات التامة، ومتى سيكون ذلك الحارس *خاطئًا* (أي تريد فعلًا تسجيل نفس التمرين مرتين)?
- يفترض `duration_min` القيمة `0` للتمارين التي تتتبع فيها المجموعات والتكرارات فقط. هل يجب أن يظل `total_volume()` يعدّ المدة جزءًا من «الجهد» في التمرين — وإذا كان الأمر كذلك، فكيف ستغيّر الحساب؟

## الخطوة 3: تتبع التغذية اليومية

التمرين يخبرك كم رفعت؛ والتغذية تخبرك بماذا تبني. يجمع `DailyLog` كل وجبات اليوم ويحسب إجمالي السعرات إضافة إلى توزيع البروتين/الكربوهيدرات/الدهون — النسبة المئوية للمغذيات الكبرى من كل مصدر سعرات، مراعيًا أن البروتين والكربوهيدرات لهما 4 كيلو سعرات لكل غرام بينما الدهون لها 9.

### 3.1 عرّف DailyLog

**👟 تلميح البداية :** تجمع `totals()` الكميات الخام بالغرامات عبر كل الوجبات؛ وتحوّل دالة جديدة `macro_split()` الغرامات إلى سعرات باستخدام عوامل 4/4/9، ثم تقسم على الإجمالي للحصول على النسب.

```python
# fitness_tracker.py (continued)
class DailyLog:
    def __init__(self, log_date: str | None = None):
        self.date = log_date or date.today().isoformat()
        self.meals: list[Meal] = []

    def add_meal(self, meal: Meal) -> None:
        self.meals.append(meal)
        print(f"  + {meal.summary()}")

    def totals(self) -> dict:
        return {
            "calories": sum(m.calories for m in self.meals),
            "protein": sum(m.protein_g for m in self.meals),
            "carbs": sum(m.carbs_g for m in self.meals),
            "fat": sum(m.fat_g for m in self.meals),
        }

    def macro_split(self) -> dict:
        """Percentage of total calories coming from protein, carbs, and fat."""
        grams = self.totals()
        by_macro_cal = {
            "protein": grams["protein"] * 4,
            "carbs":   grams["carbs"]   * 4,
            "fat":     grams["fat"]     * 9,
        }
        total_cal = sum(by_macro_cal.values()) or 1
        return {k: round(v / total_cal * 100, 1) for k, v in by_macro_cal.items()}

    def display(self) -> str:
        t = self.totals()
        s = self.macro_split()
        lines = [f"Daily Log — {self.date}", "-" * 40]
        for m in self.meals:
            lines.append(f"  {m.summary()}")
        lines.append(f"  TOTAL: {t['calories']} kcal  |  P:{t['protein']}g  C:{t['carbs']}g  F:{t['fat']}g")
        lines.append(f"  SPLIT: P:{s['protein']}%  C:{s['carbs']}%  F:{s['fat']}%")
        return "\n".join(lines)

log = DailyLog("2025-01-13")
log.add_meal(Meal("Breakfast Oats", 300, 10, 50, 8))
log.add_meal(Meal("Grilled Chicken", 350, 40, 5, 10))
log.add_meal(Meal("Protein Shake", 120, 25, 5, 1))
print(log.display())
```

ينشئ `or 1` في `macro_split` منع القسمة على صفر في سجل فارغ — تتيح لك Python إضافة الوجبات لاحقًا، فقد لا يكون لأول استدعاء أي بيانات. عوامل 4/4/9 هي عوامل أتووتر القياسية: يساهم البروتين والكربوهيدرات كلٌّ منهما بـ4 كيلو سعرات لكل غرام، وتساهم الدهون بـ9. الخطأ في هذه الأرقام (قل 4/4/4) يزيح النسب بصمت، لذا كُتبت العوامل صراحةً بدلًا من دفنها في ثابت — لثلاثة أرقام، تفوق قابلية القراءة التجريد.

**🎯 الناتج المتوقع :** يطبع ثلاث وجبات عند إضافتها، ثم إجماليًا (`770 kcal | P:75g C:60g F:19g`) وتوزيع مغذيات (`P:39.0% C:31.2% F:29.8%`).

**🩹 إذا لم يعمل :** إذا لم تصل نسب المغذيات الكبرى إلى 100%، فالتقريب منحرف قليلًا — يمكن لـ `round(..., 1)` إنتاج 99.9 أو 100.1 حسب القيم، وهذا مقبول. إذا أرجع `totals()` أصفارًا كلها رغم الوجبات، فلن يُستدعى `add_meal` قط — تتبّع إلى الوراء نحو استدعاءات `log.add_meal(...)`.

### 3.2 تحقّق من السجل اليومي

**✅ قائمة التحقق**

- ✅ ترجع `log.totals()` القيم `calories: 770, protein: 75, carbs: 60, fat: 19`.
- ✅ نسب `log.macro_split()` تجمع إلى ~100% والبروتين هو الحصة الأكبر.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- إذا أكلت دهونًا فقط (0غ بروتين، 0غ كربوهيدرات، 100غ دهون)، فماذا سيرجع `macro_split`، ولماذا تستحق هذه الحالة المنحلة التفكير قبل حدوثها في بيانات حقيقية؟
- يعيد `totals()` الحساب في كل استدعاء. لسجل `DailyLog` تُضاف إليه 20 وجبة على مدار اليوم، فهل يستحق تخزين النتيجة مؤقتًا — وما ميزة Python التي تجعل ذلك التخزين المؤقت تلقائيًا؟

## الخطوة 4: حوّل تاريخك إلى pandas

الأيام الفردية بيانات؛ وأسبوع الأيام اتجاه. تبني هذه الخطوة `DataFrame` عبر pandas من قائمة ملخصات يومية — الحجم والسعرات ووزن الجسم — وتضيف متوسطًا متحركًا لتنعيم الضوضاء اليومية. هذا المتوسط المتحرك أول حركة تحليل بيانات حقيقية في المشروع، وهو يحوّل قائمة أرقام مزعجة إلى شيء يمكنك قراءته فعلًا.

### 4.1 ابنِ DataFrame للتاريخ

**👟 تلميح البداية :** أنشئ `DataFrame` من قائمة قواميس، وحوّل عمود `date` إلى كائنات datetime، واجعله المؤشر، واحسب متوسطًا متحركًا بـ `df["volume"].rolling(3, min_periods=1).mean()`.

```python
# fitness_tracker.py (continued)
import pandas as pd

def build_history(rows: list[dict]) -> pd.DataFrame:
    """Turn daily {date, volume, calories, weight_kg} dicts into a sorted DataFrame."""
    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"])
    df = df.set_index("date").sort_index()
    df["volume_roll3"] = df["volume"].rolling(3, min_periods=1).mean()
    return df

history = build_history([
    {"date": "2025-01-06", "volume": 3270.0, "calories": 2550, "weight_kg": 82.0},
    {"date": "2025-01-08", "volume": 3420.0, "calories": 2600, "weight_kg": 81.5},
    {"date": "2025-01-10", "volume": 3560.0, "calories": 2500, "weight_kg": 81.0},
    {"date": "2025-01-12", "volume": 3640.0, "calories": 2480, "weight_kg": 80.8},
    {"date": "2025-01-14", "volume": 3780.0, "calories": 2520, "weight_kg": 80.5},
])
print(history[["volume", "volume_roll3", "weight_kg"]])
```

`rolling(3, min_periods=1)` هو السطر المهم: يأخذ نافذة منزلقة من 3 صفوف ويحسب المتوسط، لكن `min_periods=1` يسمح لصفّي الأول والثاني بأن يكون لهما متوسط جزئي (حجم نافذة 1 و2) بدلًا من `NaN` — فلا تخسر بداية اتجاهك بسبب بيانات مفقودة. يضمن `sort_index()` أن التواريخ بترتيب زمني قبل أن تتحرك النافذة المنزلقة عبرها؛ وبدونه يعكس المتوسط المتحرك ترتيب الإدخال الاعتباطي لا الزمن.

**🎯 الناتج المتوقع :** يطبع DataFrame من 5 صفوف بأعمدة `volume` و`volume_roll3` (المتوسط المتحرك لثلاثة أيام) و`weight_kg`، مرتَّبًا بالتاريخ — `volume_roll3` قريب من `volume` لمعظم الصفوف لكنه أنعم.

**🩹 إذا لم يعمل :** إذا احتوى `volume_roll3` على قيم `NaN` في الأعلى، فـ `min_periods` مرتفع جدًا (الافتراضي هو حجم النافذة، ما يعني أن أول صفين يحصلان على `NaN`)؛ أكد أن `min_periods=1` في الاستدعاء. إذا لم يكن المؤشر مرتَّبًا بالتاريخ، فـ `sort_index()` مفقودة أو أُزيلت — تحتاج النافذة المنزلقة إلى ترتيب زمني لتكون ذات معنى.

### 4.2 تحقّق من التاريخ

**✅ قائمة التحقق**

- ✅ لدى `history` 5 صفوف بالضبط، مؤشرة بالتاريخ، مع `volume_roll3` يعرض اتجاهًا ناعمًا.
- ✅ `volume_roll3` للصف الأول يساوي `volume` لذلك الصف (نافذة من 1 لا تنعم شيئًا).

**🤔 سؤال (أسئلة) سقراطي(ة)**

- إذا غيّرت `rolling(3)` إلى `rolling(5)`، فماذا يحدث للمتوسط المتحرك لأول أربعة صفوف، ومتى تكون النافذة الأكبر أفضل مقابل أسوأ لمجموعة بيانات قصيرة مثل هذه؟
- يجعل `set_index("date")` التاريخ محدد الصف. ما الاستعلام الذي ستكتبه في pandas لاختيار تمارين النصف الثاني من يناير فقط — وكيف يقارن ذلك بعبارة SQL `WHERE` على عمود تاريخ؟

## الخطوة 5: ارسم التقدم عبر الزمن

DataFrame جدول؛ والرسم البياني صورة للبيانات نفسها تجعل الاتجاهات مرئية في لمحة — الوزن ينزل، والحجم يرتفع، وحيث توجد نقاط الانعطاف. تبني هذه الخطوة شكل matplotlib من لوحتين: اتجاه وزن على اليسار واتجاه حجم تدريب على اليمين.

### 5.1 ابنِ الرسم ثنائي اللوحات

**👟 تلميح البداية :** استخدم `plt.subplots(1, 2, ...)` لإنشاء محاور جنبًا إلى جنب، وارسم كل مقياس على محوره بـ `marker="o"` لنقاط بيانات متميزة، واحفظ الشكل كـ PNG.

```python
# fitness_tracker.py (continued)
import matplotlib.pyplot as plt

def plot_progress(history: pd.DataFrame, filepath: str = "fitness_progress.png") -> None:
    """Plot body weight and training volume trends side by side."""
    fig, axes = plt.subplots(1, 2, figsize=(12, 5))

    axes[0].plot(history.index, history["weight_kg"], marker="o", color="#2ecc71")
    axes[0].set_title("Body Weight Trend")
    axes[0].set_ylabel("kg")
    axes[0].tick_params(axis="x", rotation=45)

    axes[1].plot(history.index, history["volume"], marker="o", color="#3498db", label="Daily")
    axes[1].plot(history.index, history["volume_roll3"], marker="s", color="#e74c3c", linestyle="--", label="3-day avg")
    axes[1].set_title("Training Volume")
    axes[1].set_ylabel("Volume (kg)")
    axes[1].legend()
    axes[1].tick_params(axis="x", rotation=45)

    plt.tight_layout()
    plt.savefig(filepath, dpi=150)
    print(f"Chart saved to {filepath}")
    plt.show()

plot_progress(history)
```

تتشارك اللوحتان `figsize=(12, 5)` واحدًا حتى يكون الشكل عريضًا بما يكفي لرسمين دون انضغاط. يمنع `plt.tight_layout()` تسميتي المحور الصادي من التداخل — بدونه يصطدم `ylabel` للرسم الأيمن غالبًا بعلامات الرسم الأيسر. `marker="o"` و`marker="s"` (مربع) مع `linestyle="--"` للمتوسط المتحرك تتيح لك تمييز القيمة اليومية عن نسختها المنعّمة حتى بالألوان الرمادية، وهو ما يهم عندما يطبع أحدهم الرسم.

**🎯 الناتج المتوقع :** رسم محفوظ في `fitness_progress.png` — تعرض اللوحة اليسرى وزن الجسم ينخفض بثبات من 82 إلى 80.5 كجم؛ وتعرض اللوحة اليمنى حجم التدريب يتزايد، مع انعّماء المتوسط الثلاثي الأحمر المتقطع للاتجاه الصاعد.

**🩹 إذا لم يعمل :** إذا أظهر الرسم إطارًا فارغًا بلا خطوط بيانات، فـ DataFrame فارغ أو أسماء الأعمدة لا تطابق — أكد أن `weight_kg` و`volume` موجودتان كأسماء أعمدة. إذا تداخلت تسميات المحور السيني بشدة، فـ `rotation=45` مفقودة من `tick_params`. إذا فُتحت نافذة الرسم لكنها أُغلقت فورًا في سكربت، أضف `plt.show()` في النهاية (تحجب حتى تغلق النافذة) أو احفظ دون عرض.

### 5.2 تحقّق من التصور

**✅ قائمة التحقق**

- ✅ يوجد `fitness_progress.png` ويعرض لوحتين جنبًا إلى جنب: الوزن متجه للأسفل والحجم متجه للأعلى.
- ✅ الخط الأحمر المتقطع (متوسط ثلاثة أيام) أنعم من الخط الأزرق المتصل (الحجم اليومي) — يمكنك رؤية تأثير التنعيم مباشرة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لوحة الوزن فيها خط واحد. إذا أضفت محورًا ثانيًا (عبر `ax.twinx()`) لعرض السعرات على المحور الصادي الأيمن، فكيف تفسر يومًا يرتفع فيه الوزن مع سعرات منخفضة — وهل سيكون ذلك الرسم مضلِّلًا أم مفيدًا؟
- يعرض رسم الحجم القيم اليومية ومتوسط 3 أيام. إذا طلب منك مدرّب إضافة متوسط *7 أيام* إلى الرسم نفسه، فكيف تحسبه، وما تكلفة تداخل عدد كبير من الخطوط على رسم واحد؟

## ⚠️ المآزق الشائعة

- **الدهون لها 9 كيلو سعرات لكل غرام لا 4.** استخدام 4 للمغذيات الكبرى الثلاثة هو أكثر خطأ تغذية رياضية شيوعًا: يقلل سعرات الدهون بأكثر من النصف، ما يجعل توزيع المغذيات يبدو متوازنًا عندما يكون منحرفًا بصمت. تستخدم دالة `macro_split` العوامل الصحيحة (4، 4، 9) — لا تقرّبها إلى ثابت واحد أبدًا.
- **متوسط متحرك على بيانات غير مرتّبة.** يعمل `df.rolling(3).mean()` على ترتيب الصفوف لا ترتيب الزمن. إذا لم يكن DataFrame مرتّبًا بالتاريخ، يخلط المتوسط المتحرك القيم المستقبلية والماضية منتجًا خطًّا يبدو معقولًا لكنه خاطئ. نفّذ `sort_index()` دائمًا قبل اللفّ.
- **ترتيب حقول صف البيانات.** في `@dataclass`، يجب أن تأتي الحقول ذات القيم الافتراضية بعد الحقول التي بلا قيم — `name: str = ""` قبل `sets: int` هو `SyntaxError`. تفرض Python ذلك لأن الإنشاء الموضعي سيكون غامضًا غير ذلك.
- **القسمة على صفر في `macro_split`.** سجل `DailyLog` فارغ بلا وجبات يرجع صفرًا لكل إجماليات المغذيات الكبرى. يلتقط `sum(...) or 1` ذلك بأناقة؛ وبدونه تثير القسمة `ZeroDivisionError`، وهو صحيح تقنيًا لكنه غير ودود.
- **حجب `plt.show()` في السكربتات.** في ملف `.py` يُشغَّل من طرفية، يفتح `plt.show()` نافذة ويحجب التنفيذ حتى تغلقها — جيد للاستكشاف التفاعلي، لكنه يوقف بقية سكربتك. احفظ الشكل بـ `plt.savefig()` أولًا ليوجد الملف حتى لو لم تغلق النافذة أبدًا.

## ما بنيته للتو

تطبيق تسجيل لياقة يعمل: تمثّل التمارين والوجبات الفردية بخصائص مشتقة، وتجمّعها في جلسات وسجلات يومية، وتحسب حجم التدريب ونسب المغذيات الكبرى، وتحوّل تاريخًا من أسابيع متعددة إلى DataFrame عبر pandas، وتصوّر اتجاهي الوزن والقوة في رسم من لوحتين محفوظٌ كـ PNG. لا شيء هنا محاكاة — صفوف البيانات قابلة لإعادة الاستخدام، وعمليات pandas هي نفسها التي ستستخدمها على تصدير حقيقي من أي تطبيق تتبع، والرسم بداية لوحة معلومات تقدم حقيقية.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/fitness-tracker/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/fitness-tracker) في مستودع الدورة نسخة دفتر قابلة للتشغيل: أسبوع كامل من بيانات التمارين والتغذية الاصطناعية، وكل صف ودالة من الخطوات 1–5، والرسم ثنائي اللوحات معروضًا مضمنًا. استنسخه، أو افتح المستودع كاملًا في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وشغّله من هناك.
:::

## إلى أين تذهب من هنا

- اكتب **حاسبة سلسلة التمارين**: بمعلومية قائمة تواريخ الجلسات، احسب السلسلة الحالية للأيام المتتالية وأطول سلسلة على الإطلاق — حلقة بسيطة تختبر حدسك في التعامل مع التواريخ.
- أضف صف **WeeklyGoal** يعرّف عددًا مستهدفًا من التمارين أسبوعيًا وميزانية سعرات، ويقارن بيانات التسجيل الفعلية مقابل الهدف، ويطبع ملخص نجاح/فشل — الخطوة الأولى من «التتبع» إلى «المحاسبة».
- احسب وارسم **حدًا أقصى لعدة عدّة واحدة (1RM)** باستخدام معادلة إبلي — `weight × (1 + reps / 30)` — لكل تمرين عبر الزمن لتتبع تقدم القوة بشكل مستقل عن الحجم.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في جعل البيانات تعمل لأهدافك الخاصة. 🎓