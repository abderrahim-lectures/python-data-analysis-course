---
title: "محرك الاختبارات"
description: "ابنِ منصة اختبارات مع بنوك أسئلة، اختبارات محددة الوقت، نظام نقاط، وتحليلات الأداء."
difficulty: "beginner"
estimatedMinutes: 50
tags: ["classes", "random", "pandas", "matplotlib"]
xpReward: 50
learningObjectives:
  - "نمذجة الأسئلة بصفوف تدعم أنواع أسئلة متعددة"
  - "تنفيذ جلسات اختبار محدّدة الوقت بمنطق عدّ تنازلي"
  - "بناء محرك تسجيل بتصحيح موزون وائتمان جزئي"
  - "تحليل الأداء بـ pandas وتصوير النتائج"
  - "حفظ سجل الاختبارات إلى JSON عبر الجلسات"
  - "بناء قائمة CLI لجلسات اختبار تفاعلية"
prerequisites: ["أساسيات Python (الصفوف، القواميس، القوائم)", "أساسيات pandas وmatplotlib"]
---

# محرك الاختبارات

ابنِ منصة اختبارات بأسئلة عشوائية، وجلسات محددة الوقت، وتصحيح تلقائي، وتقارير أداء مفصلة.

## ما ستفعله

1. نموذج أنواع الأسئلة الثلاثة ، الاختيار من متعدد، وصح أو خطأ، وملء الفراغ ، باستخدام الصفوف المجردة وdataclasses.
2. ابنِ محرك اختبارات يدير بنك أسئلة، ويختار أسئلة عشوائية، ويشغّل جلسات محددة الوقت.
3. صحّح الإجابات تلقائيًّا مع تفصيلات لكل فئة ونِسَب دقة.
4. صورت المنطلقة بمخططات شريطية ودائرية باستخدام matplotlib.
5. احفظ سجل الاختبارات في ملف JSON لتنجو النتائج عبر الجلسات.
6. ابنِ قائمة CLI لإنشاء الاختبارات وعرض السجل ومراجعة النتائج السابقة.
7. صَقِل المخرج بتغذية راجعة ملوّنة وتقارير درجات منسّقة.

## أين تُشغّل هذا

- **محليًا باستخدام `uv` (موصى به).** يحتاج هذا المشروع pandas وmatplotlib ، مرشح جيد للتشغيل على جهازك الخاص. يوضح قسم الإعداد أدناه الخطوات.
- **Google Colab أو Kaggle Notebooks.** الصق خلايا الكود مباشرة في دفتر. تُعرض المخططات inline، ويعمل `input()` لموجّهات الاختبار.
- **ملعب JupyterLite.** الصق خلايا الكود مباشرة في دفتر ، لاحظ أن إدخال/إخراج الملفات (الخطوة 5) يعمل بشكل مختلف في المتصفح؛ أستبقاء JSON يعمل محليًّا فقط.

- **شغّله في المتصفح.** هناك دفتر ملاحظات تفاعلي جاهز ، افتحه على Colab أو Kaggle أو Binder وتابع خطوة بخطوة.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/quiz-engine/notebook.ar.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/quiz-engine/notebook.ar.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fquiz-engine%2Fnotebook.ar.ipynb)

## الإعداد

```bash
uv init quiz-engine
cd quiz-engine
uv add pandas matplotlib
```

## الخطوة 1: حدّد أنواع الأسئلة

أساس أي محرك اختبارات: كل سؤال يعرف نصه وفئته وقيمة نقاطه وكيف يعرض نفسه وكيف يفحص إجابةً. سنستخدم صفًا أساسيًّا مجردًا حتى يتبع كل نوع أسئلة الواجهة نفسها، ثم نبني ثلاثة أنواع ملموسة فوقه.

### 1.1 اكتب الصف الأساسي المجرد

**👟 تلميح البداية :** استخدم `dataclasses` لقيم افتراضية نظيفة للسمات و`abc.ABC` لفرض الواجهة. يخزّن كل سؤال `text` و`category` و`points`، ويجب أن ينفّذ `check(answer) -> (bool, int)` و`display()`.

```python
from dataclasses import dataclass, field
from abc import ABC, abstractmethod

@dataclass
class Question(ABC):
    text: str
    category: str
    points: int = 10

    @abstractmethod
    def check(self, answer: str) -> tuple[bool, int]:
        """Return (is_correct, points_awarded)."""
        ...

    @abstractmethod
    def display(self) -> None:
        """Print the question to the terminal."""
        ...
```

**🎯 الناتج المتوقع :** تعريف هذا الصف لا ينبغي أن ينتج مخرجًا مرئيًّا ، إنه مخطط. يمكنك التحقق من عمله بتعريف صف فرعي ملموس أدنى واستنساخه (الخطوة الفرعية التالية).

**🩹 إذا لم يعمل :** إذا حصلت على `TypeError: Can't instantiate abstract class`، فنسيت تنفيذ `check` أو `display` في صفك الفرعي الملموس. إذا رأيت `TypeError: __init__() missing required arguments`، فتحقق مرتين أن حقول dataclass لديك لها افتراضات حيثما لزم.

### 1.2 نفّذ MultipleChoice

**👟 تلميح البداية :** خزّن قائمة `options` و`correct_index` (يبدأ من 1 للعرض، ومن 0 داخليًّا). يحوّل أسلوب `check` الإدخال الرقمي للمستخدم إلى فهرس.

```python
@dataclass
class MultipleChoice(Question):
    options: list[str] = field(default_factory=list)
    correct_index: int = 0

    def display(self) -> None:
        print(f"\n  {self.text} [{self.points} pts]")
        for i, opt in enumerate(self.options, 1):
            print(f"    {i}. {opt}")

    def check(self, answer: str) -> tuple[bool, int]:
        try:
            is_correct = int(answer) == self.correct_index + 1
        except ValueError:
            is_correct = False
        return is_correct, self.points if is_correct else 0
```

**🎯 الناتج المتوقع :** تشغيل ما يلي:

```python
mc = MultipleChoice("What is 2 + 2?", category="math",
                     options=["3", "4", "5", "6"], correct_index=1)
mc.display()
correct, pts = mc.check("2")
print(f"Correct: {correct}, Points: {pts}")
```

يجب أن يطبع:

```
  What is 2 + 2? [10 pts]
    1. 3
    2. 4
    3. 5
    4. 6
Correct: True, Points: 10
```

**🩹 إذا لم يعمل :** إذا عاد `check("4")` بـ`False`، فأنت تقارن السلسلة الخام ، تأكد من `int(answer)` قبل المقارنة مع `correct_index + 1` (الـ+1 يحسب ترقيم العرض الذي يبدأ من 1).

### 1.3 نفّذ TrueFalse وFillInBlank

**👟 تلميح البداية :** يخزّن TrueFalse قيمة منطقية `correct_answer` ويفحص إن كتب المستخدم "true"/"t" أو "false"/"f". يخزّن FillInBlank قائمة `accepted_answers` ويطبّع كلاً من إدخال المستخدم وكل إجابة مقبولة إلى أحرف صغيرة للمقارنة.

```python
@dataclass
class TrueFalse(Question):
    correct_answer: bool = True

    def display(self) -> None:
        print(f"\n  {self.text} [{self.points} pts] (True / False)")

    def check(self, answer: str) -> tuple[bool, int]:
        normalised = answer.strip().lower()
        user_says_true = normalised in ("true", "t")
        user_says_false = normalised in ("false", "f")
        is_correct = (user_says_true == self.correct_answer)
        return is_correct, self.points if is_correct else 0


@dataclass
class FillInBlank(Question):
    accepted_answers: list[str] = field(default_factory=list)

    def display(self) -> None:
        print(f"\n  {self.text} [{self.points} pts]")

    def check(self, answer: str) -> tuple[bool, int]:
        normalised = answer.strip().lower()
        is_correct = any(normalised == a.lower() for a in self.accepted_answers)
        return is_correct, self.points if is_correct else 0
```

**🎯 الناتج المتوقع :** تشغيل ما يلي:

```python
tf = TrueFalse("Python is statically typed.", category="python", correct_answer=False)
fib = FillInBlank("The keyword to define a function is ___", category="python",
                   accepted_answers=["def"])

for q in [tf, fib]:
    q.display()
    correct, pts = q.check("false" if isinstance(q, TrueFalse) else "def")
    print(f"  Correct: {correct}, Points: {pts}")
```

يجب أن يطبع:

```
  Python is statically typed. [10 pts] (True / False)
  Correct: True, Points: 10

  The keyword to define a function is ___ [10 pts]
  Correct: True, Points: 10
```

**🩹 إذا لم يعمل :** إذا قبل `TrueFalse` إدخال "yes"/"no"، فنسيت تقييده بالمجموعة `("true", "t", "false", "f")` ، سيتجاوز "yes" فحصك ويُعلَّم خطأً بصمت. إذا كان `FillInBlank` حساسًا لحالة الأحرف، فتأكد من استدعاء `.lower()` على جانبي المقارنة.

### 1.4 تحقّق من الأنواع الثلاثة

**✅ قائمة التحقق**

- ✅ يعرض `MultipleChoice` خيارات مرقّمة ويقبل سلسلة رقمية إدخالًا.
- ✅ يقبل `TrueFalse` "true"/"t"/"false"/"f" (بلا حساسية لحالة الأحرف) ويرفض غيره.
- ✅ يقبل `FillInBlank` أيًّا من قائمة `accepted_answers`، بلا حساسية لحالة الأحرف.
- ✅ يعيد الثلاثة `(bool, int)` من `check()` ، `True` بالدرجات كاملة للصحيح، و`False` بـ0 للخطأ.
- ✅ يعرض كلٌّ منها نص السؤال وقيمة النقاط قبل طلب إجابة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

لماذا يخزّن `MultipleChoice` `correct_index` بدءًا من 0 لكنه يضيف 1 عند مقارنة إدخال المستخدم؟ وما الذي سينكسر إذا طلبت من المستخدم "0، 1، 2، أو 3" بدل "1، 2، 3، أو 4"؟

## الخطوة 2: ابنِ محرك الاختبارات

الآن وقد عرفت الأسئلة كيف تفحص نفسها، نحتاج شيئًا يجمعها ويختار مجموعة فرعية عشوائية ويشغّل جلسة محددة الوقت. يربط صف `QuizEngine` كل شيء معًا.

### 2.1 أنشئ المحرك واملأ بنك أسئلة

**👟 تلميح البداية :** يبدأ المحرك بقائمة فارغة. `add_question` تُلحق بها. `build_quiz` يفلتر حسب الفئة (إن أُعطيت) ثم يستخدم `random.sample` لاختيار دون استبدال.

```python
import random

class QuizEngine:
    def __init__(self):
        self.questions: list[Question] = []

    def add_question(self, question: Question) -> None:
        self.questions.append(question)

    def build_quiz(self, num_questions: int = 5,
                   categories: list[str] | None = None) -> list[Question]:
        pool = self.questions if not categories else [
            q for q in self.questions if q.category in categories
        ]
        if len(pool) < num_questions:
            raise ValueError(
                f"Only {len(pool)} questions available in pool, need {num_questions}"
            )
        return random.sample(pool, num_questions)
```

**🎯 الناتج المتوقع :** ملء المحرك وبناء اختبار يجب أن يعيد مجموعة فرعية عشوائية:

```python
engine = QuizEngine()
engine.add_question(MultipleChoice("What is 2 + 2?", "math", options=["3", "4", "5", "6"], correct_index=1))
engine.add_question(TrueFalse("Python is statically typed.", "python", correct_answer=False))
engine.add_question(FillInBlank("The keyword to define a function is ___", "python", accepted_answers=["def"]))
engine.add_question(MultipleChoice("Capital of France?", "geography", options=["London", "Paris", "Berlin"], correct_index=1))

quiz = engine.build_quiz(num_questions=2)
print(f"Quiz has {len(quiz)} questions")
for q in quiz:
    q.display()
```

**🩹 إذا لم يعمل :** إذا حصلت على `ValueError: Only N questions available in pool, need M`، فأنت تطلب أسئلة أكثر مما في المجموعة المفلترة ، إما أضف أسئلة أكثر أو قلّل `num_questions`. إذا ظهر السؤال نفسه مرتين، فأنت تستخدم `random.choices` (مع استبدال) بدل `random.sample` (دون استبدال).

### 2.2 شغّل جلسة اختبار محددة الوقت

**👟 تلميح البداية :** تعقّب زمن بداية بـ`time.time()`. قبل كل سؤال، احسب الوقت المتبقي. إذا بلغ صفرًا، انهِ مبكرًا. اجمع النتائج قائمة قواميس بنص السؤال والفئة والصحة والنقاط.

```python
import time

def run_quiz(engine: QuizEngine, questions: list[Question],
             time_limit: int = 300) -> list[dict]:
    print(f"\n{'='*50}")
    print(f"  QUIZ — {len(questions)} questions | {time_limit}s time limit")
    print(f"{'='*50}")
    results = []
    start = time.time()

    for i, q in enumerate(questions, 1):
        remaining = time_limit - (time.time() - start)
        if remaining <= 0:
            print("\n  TIME'S UP!")
            break
        print(f"\n  Question {i}/{len(questions)} (time left: {remaining:.0f}s)")
        q.display()
        answer = input("  Your answer: ").strip()
        is_correct, pts = q.check(answer)
        results.append({
            "question": q.text,
            "category": q.category,
            "correct": is_correct,
            "points": pts,
            "max_points": q.points,
        })
        print(f"  {'Correct!' if is_correct else 'Wrong.'} (+{pts} pts)")

    elapsed = time.time() - start
    print(f"\n  Quiz finished in {elapsed:.1f}s")
    return results
```

**🎯 الناتج المتوقع :** تشغيل اختبار يطبع كل سؤال ويقبل إدخالًا ويطبع صواب/خطأ بعد كل إجابة. عندما تنتهي المهلة، يطبع `TIME'S UP!` ويتوقف. القائمة المُرجعة من القواميس لها مُدخل واحد لكل سؤال مُجاب.

**🩹 إذا لم يعمل :** إذا لم يوقف المؤقّت الاختبار، فتحقق أن `remaining <= 0` يستخدم `time.time() - start` (المنقضي) لا `start - time.time()`. إذا توقف الاختبار دائمًا عند السؤال الأول، فحساب `remaining` لديك خاطئ ، تأكد أنك تحسب `time_limit - (time.time() - start)`، لا `time.time() - start` فقط.

### 2.3 تحقّق من المحرك

**✅ قائمة التحقق**

- ✅ يعيد `build_quiz(3)` 3 أسئلة عشوائية بالضبط من البنك.
- ✅ يشمل `build_quiz(3, categories=["python"])` أسئلة من الفئة المحددة فقط.
- ✅ يطبع `run_quiz` مؤقّتًا تنازليًّا ويتوقف مبكرًا عند نفاد الوقت.
- ✅ تسجَّل كل إجابة بنص السؤال والفئة والصحة والنقاط.
- ✅ طلب أسئلة أكثر من المتاح يثير `ValueError` واضحًا.

**🤔 سؤال (أسئلة) سقراطي(ة)**

إذا ناجيت `build_quiz(5)` على محرك فيه 3 أسئلة فقط، فماذا يجب أن يحدث؟ هل إثارة خطأ هي الاختيار الصحيح، أم تفضل إعادة الـ3 كلها بصمت؟ وما مقايضات كل نهج؟

## الخطوة 3 ، سجّل النتائج وحللها

النتائج الخام مجرد قائمة قواميس. لتحويلها إلى شيء مفيد، نحتاج تجميع الدرجات وحساب تفصيلات لكل فئة وتحديد النواحي الضعيفة. هنا أيضًا يبدأ pandas بكسب مكانته.

### 3.1 ابنِ ملخصًا دون pandas

**👟 تلميح البداية :** أمشِ في النتائج مرة، مجمّعًا إجمالي النقاط وأقصى النقاط وإحصائيات كل فئة. أرجِع قاموس ملخص بدقة كلية وتفصيلات كل فئة.

```python
def analyse_results(results: list[dict]) -> dict:
    total_points = sum(r["points"] for r in results)
    max_points = sum(r["max_points"] for r in results)
    accuracy = total_points / max_points * 100 if max_points else 0

    categories = {}
    for r in results:
        cat = r["category"]
        if cat not in categories:
            categories[cat] = {"correct": 0, "total": 0, "points": 0, "max": 0}
        categories[cat]["total"] += 1
        categories[cat]["max"] += r["max_points"]
        categories[cat]["points"] += r["points"]
        if r["correct"]:
            categories[cat]["correct"] += 1

    summary = {
        "total_score": total_points,
        "max_score": max_points,
        "accuracy": round(accuracy, 1),
        "questions_answered": len(results),
        "categories": categories,
    }

    print(f"\n{'='*50}")
    print(f"  SCORE: {total_points}/{max_points} ({accuracy:.1f}%)")
    print(f"{'='*50}")
    for cat, data in categories.items():
        cat_pct = data["points"] / data["max"] * 100 if data["max"] else 0
        label = "Strong" if cat_pct >= 70 else "Needs Review"
        print(f"  {cat}: {data['correct']}/{data['total']} correct "
              f"({cat_pct:.0f}%) — {label}")

    return summary
```

**🎯 الناتج المتوقع :** تشغيل هذا على بيانات عينة:

```python
sample = [
    {"question": "What is 2+2?", "category": "math", "correct": True, "points": 10, "max_points": 10},
    {"question": "Capital of France?", "category": "geo", "correct": False, "points": 0, "max_points": 10},
    {"question": "def defines functions?", "category": "python", "correct": True, "points": 10, "max_points": 10},
]
analyse_results(sample)
```

يجب أن يطبع:

```
==================================================
  SCORE: 20/30 (66.7%)
==================================================
  math: 1/1 correct (100%) — Strong
  geo: 0/1 correct (0%) — Needs Review
  python: 1/1 correct (100%) — Strong
```

**🩹 إذا لم يعمل :** إذا كانت الدقة 0 رغم وجود إجابات صحيحة، فتحقق أن `"points"` و`"max_points"` مفتاحا القواميس في نتائجك ، خطأ مطبعي مثل `"max_point"` يعطي 0 بصمت عبر `sum`. إذا كانت الفئات ناقصة، فحلقة `for r in results` لديك لا تباشر مُدخلات فئة جديدة عند أول لقاء.

### 3.2 حوّل إلى pandas DataFrame لتحليل أعمق

**👟 تلميح البداية :** بمجرد وجود ملخص، يتيح لك pandas عمليات groupby بسهولة. حوّل قائمة النتائج إلى DataFrame واستخدم `groupby` لإحصائيات كل فئة.

```python
import pandas as pd

def results_to_dataframe(results: list[dict]) -> pd.DataFrame:
    return pd.DataFrame(results)

def category_breakdown(df: pd.DataFrame) -> pd.DataFrame:
    breakdown = df.groupby("category").agg(
        total_questions=("correct", "count"),
        correct_answers=("correct", "sum"),
        total_points=("points", "sum"),
        max_points=("max_points", "sum"),
    ).reset_index()
    breakdown["accuracy_pct"] = (
        breakdown["total_points"] / breakdown["max_points"] * 100
    ).round(1)
    breakdown["status"] = breakdown["accuracy_pct"].apply(
        lambda x: "Strong" if x >= 70 else "Needs Review"
    )
    return breakdown
```

**🎯 الناتج المتوقع :**

```python
df = results_to_dataframe(sample)
print(category_breakdown(df))
```

```
  category  total_questions  correct_answers  total_points  max_points  accuracy_pct       status
0      geo                1                0             0          10           0.0  Needs Review
1     math                1                1            10          10         100.0        Strong
2   python                1                1            10          10         100.0        Strong
```

**🩹 إذا لم يعمل :** إذا أظهر `correct_answers` أعدادًا عشرية (مثل `1.0` بدل `1`)، فهذا إكراه أعداد صحيحة عادي في pandas مع NaN ، لن يؤثر في الحسابات. إذا حصلت على `KeyError`، فإن اسم العمود في DataFrame لديك لا يطابق ما يتوقعه `groupby` ، تحقق من المفاتيح الدقيقة في قواميس نتائجك.

## الخطوة 4 ، صوّر الأداء

تجعل المخططات الأنماط واضحة في لمحة. سنبني اثنين: مخططًا شريطيًّا أفقيًّا يعرض دقة كل فئة (أخضر للقوية، أحمر للضعيفة)، ومخططًا دائريًّا يعرض انقسام الصحيح-مقابل-الخطأ الكلي.

### 4.1 ابنِ المخطط الشريطي

**👟 تلميح البداية :** استخدم `matplotlib.pyplot`. استخرج تسميات الفئات ونِسَب دقتها. لوّن الأشرطة خضراء إن كانت ≥70%، وحمراء وإلا. أضف خطًا رأسيًّا متقطعًا عند عتبة النجاح 70% للرجوع.

```python
import matplotlib.pyplot as plt

def plot_category_bars(summary: dict) -> None:
    cats = summary["categories"]
    labels = list(cats.keys())
    scores = [cats[c]["points"] / cats[c]["max"] * 100 for c in labels]
    colors = ["#2ecc71" if s >= 70 else "#e74c3c" for s in scores]

    fig, ax = plt.subplots(figsize=(8, 4))
    bars = ax.barh(labels, scores, color=colors)
    ax.set_xlim(0, 100)
    ax.set_xlabel("Accuracy (%)")
    ax.set_title("Score by Category")
    ax.axvline(x=70, color="gray", linestyle="--", alpha=0.5, label="Pass threshold (70%)")
    ax.legend()

    for bar, score in zip(bars, scores):
        ax.text(bar.get_width() + 1, bar.get_y() + bar.get_height() / 2,
                f"{score:.0f}%", va="center", fontsize=10)

    plt.tight_layout()
    plt.savefig("category_bars.png", dpi=150)
    plt.show()
```

**🎯 الناتج المتوقع :** مخطط شريطي أفقي بأسماء الفئات على المحور الصادي، ونِسَب الدقة على المحور السيني، وأشرطة خضراء للفئات ≥70%، وحمراء دون ذلك، وخط رمادي متقطع عند 70%.

**🩹 إذا لم يعمل :** إذا كان المخطط فارغًا، فأنت على الأرجح تستدعي `plt.show()` قبل إضافة أي بيانات ، تأكد من إنشاء الشكل والمحاور أولًا. إذا كانت الأشرطة رأسية بدل أفقية، استخدمت `bar` بدل `barh`. إذا تجاوز المحور السيني 100، أضف `ax.set_xlim(0, 100)`.

### 4.2 ابنِ المخطط الدائري

**👟 تلميح البداية :** عدّ الصحيح الكلي والخطأ الكلي عبر كل الفئات. استخدم `plt.pie` بشرائح خضراء وحمراء وتسمية نسبة مئوية.

```python
def plot_overall_pie(summary: dict) -> None:
    total_correct = sum(d["correct"] for d in summary["categories"].values())
    total_wrong = summary["questions_answered"] - total_correct

    fig, ax = plt.subplots(figsize=(6, 6))
    ax.pie(
        [total_correct, total_wrong],
        labels=["Correct", "Wrong"],
        colors=["#2ecc71", "#e74c3c"],
        autopct="%1.1f%%",
        startangle=90,
        textprops={"fontsize": 12},
    )
    ax.set_title(f"Overall Accuracy — {summary['accuracy']}%")
    plt.tight_layout()
    plt.savefig("overall_pie.png", dpi=150)
    plt.show()
```

**🎯 الناتج المتوقع :** مخطط دائري بشرائح اثنتين ، خضراء للصحيح، حمراء للخطأ ، بتسميات نسب مئوية والدقة الكلية في العنوان.

**🩹 إذا لم يعمل :** إذا كان `total_wrong` سالبًا، فعدّاد `questions_answered` لديك معطوب ، تأكد أنك تعدّ `len(results)`، لا الصحيحة فقط. إذا لم يكن للمخطط الدائري تسميات، فتحقق أنك مررت بارامتر `labels` إلى `plt.pie`.

### 4.3 ادمج المخططين

**👟 تلميح البداية :** استخدم `plt.subplots(1, 2)` لوضع المخططين جنبًا إلى جنب في شكل واحد.

```python
def plot_results(summary: dict) -> None:
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    cats = summary["categories"]
    labels = list(cats.keys())
    scores = [cats[c]["points"] / cats[c]["max"] * 100 for c in labels]
    colors = ["#2ecc71" if s >= 70 else "#e74c3c" for s in scores]

    axes[0].barh(labels, scores, color=colors)
    axes[0].set_xlim(0, 100)
    axes[0].set_title("Score by Category (%)")
    axes[0].axvline(x=70, color="gray", linestyle="--", alpha=0.5, label="Pass threshold")
    axes[0].legend()

    total_correct = sum(d["correct"] for d in cats.values())
    total_wrong = summary["questions_answered"] - total_correct
    axes[1].pie(
        [total_correct, total_wrong],
        labels=["Correct", "Wrong"],
        colors=["#2ecc71", "#e74c3c"],
        autopct="%1.1f%%",
        startangle=90,
    )
    axes[1].set_title("Overall Accuracy")

    plt.tight_layout()
    plt.savefig("quiz_results.png", dpi=150)
    plt.show()
```

**🎯 الناتج المتوقع :** شكل واحد بمخطط شريطي أفقي يسارًا ودائري يمينًا، محفوظ كـ`quiz_results.png`.

**🩹 إذا لم يعمل :** إذا ظهر مخطط واحد فقط، فقد يكون الآخر مخفيًّا ، تحقق أنك تفهرس `axes[0]` و`axes[1]`، لا تستخدم `axes` مباشرة. إذا كان الشكل معصورًا، زد عرض `figsize` (مثلًا `(14, 5)`).

## الخطوة 5 ، احفظ النتائج إلى JSON

الاختبار مفيد فقط إذا استطعت تذكر ما حدث. حفظ النتائج إلى ملف JSON يعني أن الطالب يمكنه تعقب تقدمه على أيام أو أسابيع.

### 5.1 اكتب مساعدَي التحميل والحفظ

**👟 تلميح البداية :** استخدم `json` مع `pathlib.Path`. أنشئ صف `HistoryFile` يحمّل السجل الموجود (أو يبدأ من الصفر) ويحفظ بعد كل اختبار. خزّن قائمة جلسات اختبار، كلٌّ بختم زمن ونتائجه.

```python
import json
from pathlib import Path
from datetime import datetime

HISTORY_FILE = Path("quiz_history.json")

class HistoryFile:
    def __init__(self, path: Path = HISTORY_FILE):
        self.path = path
        self.sessions: list[dict] = self._load()

    def _load(self) -> list[dict]:
        if not self.path.exists():
            return []
        with self.path.open() as f:
            return json.load(f)

    def save(self) -> None:
        with self.path.open("w") as f:
            json.dump(self.sessions, f, indent=2)

    def add_session(self, results: list[dict], summary: dict) -> None:
        session = {
            "timestamp": datetime.now().isoformat(),
            "num_questions": summary["questions_answered"],
            "accuracy": summary["accuracy"],
            "total_score": summary["total_score"],
            "max_score": summary["max_score"],
            "results": results,
        }
        self.sessions.append(session)
        self.save()
```

**🎯 الناتج المتوقع :** تشغيل هذا ينشئ `quiz_history.json` على القرص:

```python
history = HistoryFile()
history.add_session(sample, analyse_results(sample))
print(f"Saved {len(history.sessions)} session(s)")
print(f"File exists: {HISTORY_FILE.exists()}")
```

**🩹 إذا لم يعمل :** إذا حصلت على `TypeError: Object of type datetime is not JSON serializable`، فأنت تخزّن كائن datetime مباشرة ، حوّله إلى سلسلة بـ`.isoformat()` أولًا. إذا كان الملف فارغًا بعد الحفظ، فأنت تستدعي `save()` قبل `add_session()`، أو `self.sessions` يعاد إسنادها بدل الإلحاق بها.

### 5.2 حمّل واعرض الجلسات السابقة

**👟 تلميح البداية :** أضف أسلوبًا يطبع جدول ملخص لكل الجلسات السابقة ، ختم زمني ودقة ودرجة ، فيرى الطالب تقدمه في لمحة.

```python
def show_history(history: HistoryFile) -> None:
    if not history.sessions:
        print("\n  No quiz history yet. Take a quiz first!")
        return

    print(f"\n{'='*60}")
    print(f"  QUIZ HISTORY ({len(history.sessions)} sessions)")
    print(f"{'='*60}")
    for i, session in enumerate(history.sessions, 1):
        ts = session["timestamp"][:10]  # just the date part
        acc = session["accuracy"]
        score = f"{session['total_score']}/{session['max_score']}"
        print(f"  {i}. {ts}  |  {score}  |  {acc}%")
    print(f"{'='*60}")
```

**🎯 الناتج المتوقع :**

```
============================================================
  QUIZ HISTORY (3 sessions)
============================================================
  1. 2026-09-06  |  35/50  |  70.0%
  2. 2026-09-06  |  40/50  |  80.0%
  3. 2026-09-06  |  45/50  |  90.0%
============================================================
```

**🩹 إذا لم يعمل :** إذا كان `timestamp[:10]` يعطيك سلسلة فرعية خاطئة، فتحقق أنك خزنتها كسلسلة بصيغة ISO، لا ككائن `datetime`. إذا أظهر السجل 0 جلسات بعد إضافة واحدة، فطريقة `add_session` لديك تنشئ قائمة جديدة بدل الإلحاق بـ`self.sessions`.

### 5.3 تحقّق من الأستبقاء

**✅ قائمة التحقق**

- ✅ بعد تشغيل اختبار واستدعاء `add_session`، يوجد `quiz_history.json` على القرص بـJSON صالح.
- ✅ إعادة تشغيل البرنامج وإنشاء `HistoryFile` جديد يحمّل الجلسات السابقة.
- ✅ يعرض `show_history` كل الجلسات السابقة بالتاريخ والدرجة والدقة.
- ✅ حذف `quiz_history.json` وإعادة التشغيل لا يتحطم ، يبدأ بقائمة فارغة.

## الخطوة 6 ، واجهة CLI

القطعة الأخيرة: قائمة تربط كل شيء معًا فيستطيع الطالب التفاعل مع محرك الاختبارات دون تحرير كود.

### 6.1 ابنِ القائمة الرئيسية

**👟 تلميح البداية :** استخدم حلقة `while True` بخيارات مرقّمة. حمّل المحرك والسجل مرة عند الإقلاع، ثم وجّه إلى الدالة الصحيحة حسب إدخال المستخدم.

```python
def build_default_engine() -> QuizEngine:
    engine = QuizEngine()
    engine.add_question(MultipleChoice("What is 2 + 2?", "math",
                         options=["3", "4", "5", "6"], correct_index=1))
    engine.add_question(MultipleChoice("Capital of France?", "geography",
                         options=["London", "Paris", "Berlin"], correct_index=1))
    engine.add_question(MultipleChoice("Largest planet?", "science",
                         options=["Earth", "Mars", "Jupiter"], correct_index=2))
    engine.add_question(TrueFalse("Python is statically typed.", "python",
                         correct_answer=False))
    engine.add_question(TrueFalse("The Earth orbits the Sun.", "science",
                         correct_answer=True))
    engine.add_question(FillInBlank("The keyword to define a function is ___",
                         "python", accepted_answers=["def"]))
    engine.add_question(FillInBlank("The keyword to import a module is ___",
                         "python", accepted_answers=["import"]))
    engine.add_question(MultipleChoice("Which data structure is FIFO?", "cs",
                         options=["Stack", "Queue", "Tree", "Graph"], correct_index=1))
    return engine

def main():
    engine = build_default_engine()
    history = HistoryFile()

    while True:
        print(f"\n{'='*40}")
        print("  QUIZ ENGINE")
        print(f"{'='*40}")
        print("  1. Take a quiz")
        print("  2. View history")
        print("  3. Quit")
        print(f"{'='*40}")

        choice = input("  Choose (1-3): ").strip()

        if choice == "1":
            num = input("  How many questions? (default 5): ").strip()
            num = int(num) if num.isdigit() else 5
            try:
                questions = engine.build_quiz(num_questions=num)
            except ValueError as e:
                print(f"  Error: {e}")
                continue
            results = run_quiz(engine, questions)
            summary = analyse_results(results)
            plot_results(summary)
            history.add_session(results, summary)
        elif choice == "2":
            show_history(history)
        elif choice == "3":
            print("  Goodbye!")
            break
        else:
            print("  Invalid choice. Enter 1, 2, or 3.")
```

**🎯 الناتج المتوقع :** تشغيل `main()` يعرض قائمة، ويتيح لك إجراء اختبار (بأسئلة محدّدة الوقت والتسجيل والمخططات)، وعرض السجل السابق، أو الخروج. يُحفظ كل اختبار تلقائيًّا.

**🩹 إذا لم يعمل :** إذا دارت القائمة إلى الأبد دون قبول إدخال، فأنت تستخدم `input` داخل `try/except` يبتلع `EOFError` ، أزل الاستثناء الواسع. إذا تحطم "أجرِ اختبارًا" بـ`IndexError`، فـ`build_quiz` يحاول عيّنة أسئلة أكثر مما يحمله البنك ، يجب أن يلتقط `try/except ValueError` المحيط ذلك.

### 6.2 أضف تغذية راجعة ملوّنة

**👟 تلميح البداية :** استخدم رموز هروب ANSI لألوان الطرفية. لفّ رسائل صواب/خطأ بالأخضر/الأحمر، وأضف لونًا لملخص الدرجة. لا حاجة لمكتبات خارجية.

```python
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BOLD = "\033[1m"
RESET = "\033[0m"

def coloured(text: str, color: str) -> str:
    return f"{color}{text}{RESET}"

def print_feedback(is_correct: bool, points: int) -> None:
    if is_correct:
        print(coloured(f"  Correct! (+{pts} pts)", GREEN))
    else:
        print(coloured(f"  Wrong. (+{pts} pts)", RED))

def print_score_bar(summary: dict) -> None:
    acc = summary["accuracy"]
    bar_length = 30
    filled = int(bar_length * acc / 100)
    bar = "█" * filled + "░" * (bar_length - filled)
    color = GREEN if acc >= 70 else RED
    print(f"\n  {coloured(bar, color)} {acc}%")
    print(f"  Score: {summary['total_score']}/{summary['max_score']}")
```

**🎯 الناتج المتوقع :** تشغيل `print_score_bar({"accuracy": 75.0, "total_score": 30, "max_score": 40})` يطبع شريط تقدم ملوّنًا في الطرفية ، أخضر إذا ≥70%، وأحمر إذا دون ذلك.

**🩹 إذا لم يعمل :** إذا رأيت رموز هروب خام مثل `[92m` بدل الألوان، فطرفيتك لا تدعم رموز ANSI ، معظم الطرفيات الحديثة تدعم، لكن موجه أوامر Windows قد يحتاج `os.system("")` مرة عند الإقلاع لتفعيلها. إذا كان الشريط غير متناسق، فتحقق أن `filled` لا يتجاوز `bar_length`.

### 6.3 تحقّق من التطبيق الكامل

**✅ قائمة التحقق**

- ✅ تعرض القائمة ثلاثة خيارات وتقبل الإدخال دون تحطم.
- ✅ "أجرِ اختبارًا" يشغّل اختبارًا محدّد الوقت، ويسجّله، ويعرض المخططات، ويحفظ النتائج.
- ✅ "عرض السجل" يعرض كل الجلسات السابقة بالتواريخ والدرجات.
- ✅ "الخروج" يخرج بنظافة.
- ✅ تظهر التغذية الراجعة الملوّنة في الطرفية لإجابات الصواب/الخطأ وأشرطة الدرجات.
- ✅ تستقر النتائج في `quiz_history.json` عبر إعادة تشغيل البرنامج.

## ⚠️ مآزق شائعة

- **نسيان تطبيع الإدخال.** `"True"` و`"true"` سلسلتان مختلفتان في Python. يجب أن تستدعي كل طريقة `check()` `.strip().lower()` على إدخال المستخدم قبل المقارنة. ينطبق الأمر نفسه على إجابات ملء الفراغ ، يجب قبول `"def"` و`"Def"` معًا.
- **انزياح المؤقّت.** إذا حسبت `time.time() - start` في بداية كل سؤال فقط (لا قبل كل إجابة)، فلن يحسب المؤقّت المدة التي يستغرقها المستخدم في الكتابة. استدعِ `remaining = time_limit - (time.time() - start)` قبل كل موجّه.
- **تغيير القائمة الافتراضية.** إذا عدّل `build_quiz` `self.questions` بدل التصفية في قائمة `pool` جديدة، ستزيل أسئلة من البنك للأبد. استخدم دائمًا فهم قائمة لإنشاء نسخة مفلترة.
- **الحفظ عند الخروج فقط.** إذا كتبت `quiz_history.json` فقط عندما يخرج المستخدم، ففقدان أو `Ctrl+C` يضيع الجلسة كلها. استدعِ `history.save()` داخل `add_session`، فور الإلحاق ، نفس مبدأ نمط إحصائيات Wordle.
- **`random.sample` مقابل `random.choices`.** `sample` يختار دون استبدال (يظهر كل سؤال مرة واحدة على الأكثر). `choices` يختار مع استبدال (قد يظهر السؤال نفسه مرتين في اختبار واحد). استخدم `sample` إلا إذا أردت تكرارات صراحة.

## ما بنيته للتو

منصة اختبارات كاملة: ثلاثة أنواع أسئلة مدعومة بصفوف مجردة، ومحرك اختبارات باختيار عشوائي وجلسات محددة الوقت، وتسجيل تلقائي بتفصيلات لكل فئة، وتصوير بـmatplotlib، وأستبقاء JSONعبر الجلسات، وقائمة CLI ملوّنة تربط كل ذلك معًا. كل قطعة تبني على Python الأساسية ، الصفوف، والقواميس، والقوائم، و`random`، و`time`، و`json` ، زائد pandas وmatplotlib لطبقة التحليل والتصوير.

## إلى أين تذهب من هنا

- **مستويات الصعوبة.** أضف صفة `difficulty` للأسئلة (سهل/متوسط/صعب) وفلتر بالملء والفئة معًا عند بناء اختبار.
- **التكرار المتباعد.** تتبّع الأسئلة التي أُجيب خطأً وزد احتمال ظهورها في الاختبارات المستقبلية بعيّنة الاحتمال الموزونة.
- **استيراد/تصدير الأسئلة.** دع المستخدمين يكتبون بنوك أسئلة كملفات CSV أو JSON ويحملونها عند الإقلاع، فيمكن مشاركة الاختبارات بين الطلاب.
- **اختبارات تكيّفية.** ابدأ بأسئلة سهلة، ولا تقدّم إلى الأصعب إلا بعد تثبيت الطالب الإتقان ، شكل بسيط من الاختبار التكيفي بالحاسوب.
- **واجهة رسومية بـStreamlit.** استبدل CLI بواجهة ويب بـStreamlit ، نفس منطق الواجهة الخلفية يعمل، فقط بدّل `input()` بأدوات Streamlit.