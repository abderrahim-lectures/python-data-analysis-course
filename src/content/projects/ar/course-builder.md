---
title: "منشئ الدورات"
description: "أنشئ دورات عبر الإنترنت مع وحدات، اختبارات، تتبع التقدم، وإصدار شهادات."
difficulty: "beginner"
estimatedMinutes: 60
tags: ["cli", "dataclasses", "json", "stdlib"]
prerequisites:
  - "أساسيات Python (متغيّرات، حلقات، دوال، قواميس)"
learningObjectives:
  - "نمذجة دورة كطبقات dataclass متداخلة وتحميلها من JSON"
  - "تتبع إنجاز الدروس لكل طالب وحساب النسب المئوية"
  - "تصحيح الاختبارات مقابل ورقة إجابات مع عتبة تجاوز"
  - "عرض لوحة نصية للتقدم ودرجات الاختبارات"
  - "توليد شهادة إتمام فقط عند انتهاء الدورة فعلًا"
---

# 🎓 ابنِ منشئ دورات

الدورة، تحت السطح، مجرد بيانات منظمة: وحدات مكوَّنة من دروس، ودروس بمحتوى، وطلاب بمجموعة نقاط تفتيش مكتملة. يبني هذا المشروع المحرك خلف منصة دورات عبر الإنترنت ، مجموعة فئات ودوال Python تُحمّل دورة من JSON، وتتتبع تقدم طالب حقيقي خلالها، وتصحّح اختباراته مقابل ورقة إجابات، وتطبع لوحة تقدم، وتصدر أخيرًا شهادة إتمام عندما ، و*فقط* عندما ، تكون الدورة منتهية فعلًا. لا متصفح، لا قاعدة بيانات: فقط نموذج البيانات والقواعد التي تعيش فوقه.

هذا يفترض Python 101 ، دوال، قواميس، و`import json` مريح. لا يُشترط شيء من تحليل البيانات. إنه اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. نمذج دورة كفئات `Lesson` و`Module` و`Course` dataclass وحمّل واحدة من ملف JSON.
2. تتبع دروس الطالب المكتملة واحسب نسب إنجاز الوحدات والدورة.
3. صحّح اختبارًا مقابل ورقة إجابات واحكم بالنجاح/الفشل مقابل عتبة.
4. اطبع لوحة تعرض تقدم الوحدات ودرجات الاختبارات لطالب واحد.
5. ولّد شهادة نصية، رافضًا بأدب عندما لا تكون الدورة مكتملة.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الموصى به ، هذا المشروع مكتبة قياسية خالصة (dataclasses، JSON، `datetime`)، لذا فالإعداد أمر واحد، والـ CLI المحلي هو حيث ستوجهه إلى ملف *دورتك*.

**GitHub Codespaces** بديل بلا إعداد: افتح [مستودع الدورة كاملًا في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython مثبّتة بالفعل) وشغّل نفس الأوامر من طرفية متصفح.

**Google Colab أو Kaggle Notebooks أو Binder** تعمل جيدًا لنصف نمذجة البيانات من هذا المشروع ، دفتر الملاحظات في [`examples/course-builder/notebook.ar.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/course-builder/notebook.ar.ipynb) يشغّل كل خطوة على دورة عينات مرفقة. الملاحظة الصادقة: ملفات الشهادات (`certificate.txt`) تُحفظ نظيفة في دفتر الملاحظات، لكن الكود متطابق في الحالتين.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/course-builder/notebook.ar.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/course-builder/notebook.ar.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcourse-builder%2Fnotebook.ar.ipynb)

## الإعداد

`uv` أداة واحدة تحل محل سلسلة "ثبّت Python، ثم pip، ثم أداة بيئة افتراضية" ، وهذا المشروع لا يحتاج حزمًا خارجية، لذا فالإعداد قصير فعلًا.

**macOS / Linux** (الطرفية):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

أغلق طرفيتك وأعد فتحها، ثم تأكد أنها ثُبِّتت:

```bash
uv --version
```

ثم جهّز المشروع:

```bash
uv init course-builder
cd course-builder
```

كل ما يُستخدَم من هنا فصاعدًا ، `dataclasses`، `json`، `datetime` ، مدمج في Python، لذا لا خطوة `uv add`.

**✅ قائمة التحقق**

- ✅ يطبع `uv --version` رقم إصدار.
- ✅ يوجد `course-builder/` مع `pyproject.toml`.
- ✅ ينجح `python -c "from dataclasses import dataclass"`.

## الخطوة 1: نمذج دورة باستخدام dataclasses

للدرس تسلسل هرمي نظيف ، الدورة *تحوي* وحدات، وكل وحدة *تحوي* دروسًا ، و`dataclasses` في Python موجودة لتحويل ذلك بالضبط إلى كائنات مكتوبة وموثقة ذاتيًا. وفي هذه الأثناء، JSON هو صيغة التبادل الفعلية التي تسافر بها الدورات. تجعل هذه الخطوة الاثنين يلتقيان: `Course` يمكنك بناؤه في Python وتحميله عائدًا من ملف.

### 1.1 اكتب فئات dataclass الثلاث ومحمّل JSON

**👟 تلميح البداية :** عرّف فئات `Lesson` و`Module` و`Course` dataclass صغيرة ، متداخلة مع `default_factory` ، ثم `load_course`، التي تقرأ JSON وتعيد إحياء الفئات بفهم قائمة:

```python
# models.py
from dataclasses import dataclass, field
import json

@dataclass
class Lesson:
    title: str
    minutes: int

@dataclass
class Module:
    title: str
    lessons: list[Lesson] = field(default_factory=list)

@dataclass
class Course:
    title: str
    modules: list[Module] = field(default_factory=list)

def load_course(path: str) -> Course:
    with open(path) as f:
        data = json.load(f)
    modules = [
        Module(title=m["title"], lessons=[Lesson(**l) for l in m["lessons"]])
        for m in data["modules"]
    ]
    return Course(title=data["title"], modules=modules)

if __name__ == "__main__":
    sample = {
        "title": "Python 101",
        "modules": [
            {"title": "Basics", "lessons": [
                {"title": "Variables", "minutes": 12},
                {"title": "Loops", "minutes": 15},
            ]},
            {"title": "Functions", "lessons": [
                {"title": "def and return", "minutes": 10},
            ]},
        ],
    }
    with open("course.json", "w") as f:
        json.dump(sample, f, indent=2)
    course = load_course("course.json")
    print(course.title)
    for module in course.modules:
        print(f"- {module.title}: " + ", ".join(l.title for l in module.lessons))
```

`Lesson(**l)` هي الحيلة المتعمدة: كل قاموس JSON تحت `lessons` له بالضبط نفس مفاتيح حقول فئة `Lesson` dataclass، لذا يفكك تفريغ `**` مواضعها بالاسم مجانًا. أهمية `field(default_factory=list)` على *الحاويات* سببها فخ dataclass كلاسيكي ، الافتراضي العاري `= []` كان سيتقاسمه كل كائن `Module` و`Course` يُنشأ على الإطلاق.

**🎯 الناتج المتوقع :**

```
Python 101
- Basics: Variables, Loops
- Functions: def and return
```

**🩹 إذا لم يعمل :** `TypeError: __init__() got an unexpected keyword argument` من `Lesson(**l)` تعني أن قاموس JSON له مفتاح لا يطابق حقلاً (خطأ إملائي مثل `minuts`) ، طابق مفاتيح JSON مع أسماء الحقول. إذا بدت كل وحدة تتقاسم قائمة دروس واحدة، استخدمت `= []` بدل `field(default_factory=list)` ، هذا هو خطأ الافتراضي المتغير المشترك متجسدًا.

### 1.2 تحقّق من النموذج

**✅ قائمة التحقق**

- ✅ ينتج `load_course("course.json")` ثلاثة كائنات تُطبع سمات `title` لها كما أعلاه.
- ✅ `course.modules[0].lessons` هي `list[Lesson]` طولها 2، لا قائمة قواميس.
- ✅ إضافة `Module()` ثانٍ دون وسائط *لا* تتقاسم قائمة دروس الوحدة الأولى.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لماذا قاموس JSON مثل `{"title": "Variables", "minutes": 12}` "نفس الشكل" لفئة `Lesson` dataclass، وماذا يحدث اليوم الذي يشحن فيه ملف دورة *حقلًا* جديدًا لا تعرفه الفئة ، أين يفشل ذلك وبأي جهارة؟
- تخزن الفئة `minutes` لكل درس. من يجب أن يحسب "إجمالي الدقائق"، الفئة أم الكود الذي يطبع تقريرًا، وما حجة إبقاء `Course` حامل بيانات نقيًا؟

## الخطوة 2: تتبع تقدم الطالب

يحتاج الطلاب حالةً لكل طالب ، *أي* الدروس أتمّوها ، منفصلة عن تعريف الدورة. الأنحف والأصح هنا يعني: كائن الدورة لا يتغير أبدًا لكل طالب؛ بدلًا من ذلك يملك `ProgressTracker` مجموعة `set` من أزواج `(module_index, lesson_index)` ويجيب عن سؤال "ما نسبة ما تم؟" بعدّ قليل.

### 2.1 اكتب المتتبع

**👟 تلميح البداية :** فئة واحدة بثلاث طرق ، `complete_lesson` (تخزن مفتاح صفّي)، و`module_percent`، و`course_percent` ، ثم قُدها بدورة الخطوة 1:

```python
# progress.py
from models import Course

class ProgressTracker:
    def __init__(self, course: Course, student: str):
        self.course = course
        self.student = student
        self.completed: set[tuple[int, int]] = set()

    def complete_lesson(self, module_index: int, lesson_index: int) -> None:
        self.completed.add((module_index, lesson_index))

    def module_percent(self, module_index: int) -> float:
        lessons = self.course.modules[module_index].lessons
        done = sum(1 for (mi, _) in self.completed if mi == module_index)
        return 100.0 * done / len(lessons)

    def course_percent(self) -> float:
        total = sum(len(m.lessons) for m in self.course.modules)
        return 100.0 * len(self.completed) / total

if __name__ == "__main__":
    from models import load_course
    tracker = ProgressTracker(load_course("course.json"), "Ada")
    tracker.complete_lesson(0, 0)
    tracker.complete_lesson(0, 1)
    print(f"{tracker.student}: {tracker.course_percent():.0f}% complete")
    print(f"Module 0: {tracker.module_percent(0):.0f}% | Module 1: {tracker.module_percent(1):.0f}%")
```

`set` بنية البيانات الصحيحة مرتين: إعادة تعليم نفس الدرس *عملية بلا أثر* (idempotent ، استدعاء `complete_lesson(0, 0)` مرتين لا يزال يعد مرة واحدة)، و`len(self.completed)` هي الإجمالي على مستوى الدورة مجانًا، لأن الصفّي لا يمكن أن يظهر مرتين. المجموع داخل `module_percent` عبر `self.completed` يحسب "كم زوجًا مكتملًا ينتمي لهذه الوحدة" دون أي أمانة سجل منفصلة لكل وحدة.

**🎯 الناتج المتوقع :**

```
Ada: 67% complete
Module 0: 100% | Module 1: 0%
```

**🩹 إذا لم يعمل :** إذا خرجت النسب المئوية كأعداد عشرية مثل `66.66666666666666`، فذلك تشخيصي، لا معطوب ، يعني أنك طبعت العلامة العشرية دون تنسيق `:.0f`؛ نَسّقها. إذا رفعت تعليم نفس الدرس مرتين النسبة المئوية بخطوة، فالتخزين ليس `set` ، قائمة صفّيات يعيد عد المكررات.

### 2.2 تحقّق من التتبع

**✅ قائمة التحقق**

- ✅ إتمام درسي Basics يجعل `course_percent()` يطبع `67%` و`module_percent(0)` يطبع `100%`.
- ✅ استدعاء `complete_lesson(0, 0)` مرتين لا يرفع استثناءً ولا يضخّم العد.
- ✅ متتبع جديد على نفس الدورة يبلّغ `0%`، مثبتًا أن التقدم حالة لكل طالب.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لماذا يُخزَّن التقدم كـ *إحداثيات* (`(module 0, lesson 1)`) بدل عناوين الدروس؟ ماذا يحدث للنظام القائم على الإحداثيات إذا أُعيد تسمية درس ، وهل كان التتبع القائم على العنوان سينجو من ذلك؟
- لا يعرف المتتبع عن الوحدات شيئًا إلا فهرسها. ما الذي كان سيتغير لو أدرجت دورة *وحدة* جديدة في المقدمة ، بعد أسبوعين من بدء الطلاب، مع امتلاء مجموعات `completed` لديهم بالفعل؟ هل المفتاح الإحداثي صلب لذلك؟

## الخطوة 3: صحّح الاختبارات

يجيب التقدم عن "هل قرأوها؟"، وتجيب الاختبارات عن "هل علقت؟". الاختبار مجموعة أسئلة ، سؤال، خيارات، فهرس الإجابة الصحيحة ، والتصحيح `zip` عبر إجابات الطالب يقارن كلًا منها بالمفتاح. ثم يطبّق قرار النجاح/الفشل عتبة على النسبة.

### 3.1 اكتب نموذج السؤال والمصحّح

**👟 تلميح البداية :** فئة `Question` dataclass، و`score_quiz` تضمّ إجابات معطاة مقابل المفتاح إلى قائمة قيم صحيحية، ومساعد `passed` يقارن المكتسب-إلى-الإجمالي مقابل علامة:

```python
# quizzes.py
from dataclasses import dataclass

@dataclass
class Question:
    prompt: str
    choices: list[str]
    answer_index: int
    points: int = 1

def score_quiz(questions: list[Question], answers: list[int]) -> tuple[int, int, list[bool]]:
    """Returns (earned, total, per-question correctness)."""
    correct = [given == q.answer_index for q, given in zip(questions, answers)]
    earned = sum(q.points for q, ok in zip(questions, correct) if ok)
    total = sum(q.points for q in questions)
    return earned, total, correct

def passed(results: tuple[int, int, list[bool]], pass_mark_pct: int = 70) -> bool:
    earned, total, _ = results
    return 100 * earned / total >= pass_mark_pct

if __name__ == "__main__":
    quiz = [
        Question("What is 2+2?", ["3", "4", "5"], 1),
        Question("Which type is a boolean?", ["int", "bool", "str"], 1),
    ]
    results = score_quiz(quiz, [1, 1])
    print(f"score: {results[0]}/{results[1]}")          # 2/2
    print("passed at 70%:", passed(results))             # True
    print("passed at 100%:", passed(results, 100))       # False
```

`zip` يقوم بالعمل الصادق: يقرن كل سؤال بإجابة الطالب المقابلة *موضعيًا*، وفهم القائمة بسطر واحد يحوّل ذلك الاقتران إلى أعلام صحة. الجدير بالانتباه أن `score_quiz` تُرجع *ثلاثة* أشياء ، المكتسب والإجمالي وأعلام كل سؤال ، لأن مصححًا يبلّغ رقمًا فقط عديم الفائدة لإخبار الطالب *أين* أخطأ؛ تشغّل الأعلام حكم "الاستعادة" لاحقًا.

**🎯 الناتج المتوقع :**

```
score: 2/2
passed at 70%: True
passed at 100%: False
```

**🩹 إذا لم يعمل :** `score: 0/2` خاطئ مع إجابات تبدو صحيحة يعني عادة أن فهارس قائمة `answers` مزيحة بمقدار واحد ، تُعطى الإجابات كـ *فهارس خيارات* (`1` = "4")، لا كنص الخيار. إذا طبع `passed at 100%` القيمة `True` لنتيجة 2/2... فذلك صحيح؛ اصنع حالة خطأ حقيقية، أو تحقق من عامل المقارنة ، `>=` مقابل `>` يغيّران هل يجتاز بالضبط-70%.

### 3.2 تحقّق من المصحّح

**✅ قائمة التحقق**

- ✅ اختبار مثالي يطبع `score: 2/2` واستدعاؤك `passed()` يرجع `True` عند كل عتبة معقولة.
- ✅ قائمة صحة كل سؤال يمكنها إخبارك بالضبط أي سؤال أخطأه الطالب.
- ✅ `passed()` بإجابة خاطئة واحدة في اختبار من سؤالين يرجع `False` عند 70%.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تُرجع `score_quiz` أعلام صحة *و*درجةً. إذا بنى واجهة شاشة "راجع إجاباتك" من `correct`، ما الذي كان سينكسر لو بسّطت الإرجاع إلى `(earned, total)` فقط ، وهل ذلك تراجع تصميمي أم تبسيط مقبول لمشروع صغير؟
- يقارن `passed` نسبة مئوية بعتبة. لماذا قد يتصرف اختبار من 10 أسئلة عتبته 70% بشكل مفاجئ مع هذا الحساب الصحيح الدقيق (تلميح: حاول هندسة نتيجة *تُقرَّب* إلى 70% بالضبط)؟

## الخطوة 4: ابنِ اللوحة

القطع المنفصلة ، الدورة، التقدم، الاختبارات ، تحتاج سطح قراءة واحدًا: اللوحة. إنها "عرض المنتج" لكل ما بُني حتى الآن، تعرض حالة الوحدات والنسب المئوية ونتائج الاختبارات في لوحة طرفية واحدة، وتقدم الفكرة الصغيرة لتحويل رقم إلى *كلمة حالة* ("done"/"active"/"todo").

### 4.1 اعرض اللوحة

**👟 تلميح البداية :** دالة `render_dashboard` واحدة تنسّق الرؤوس بـ `"=" * 40`، وتنسّف نسبة كل وحدة إلى تسمية حالة، وتصحّح كل نتيجة اختبار مخزّنة عبر مساعد `passed`:

```python
# dashboard.py
from progress import ProgressTracker
from quizzes import passed

def _status(pct: float) -> str:
    if pct == 100.0:
        return "done"
    if pct > 0:
        return "active"
    return "todo"

def render_dashboard(tracker: ProgressTracker, quiz_results: dict[str, tuple[int, int, list[bool]]]) -> None:
    print(f"Dashboard for {tracker.student}")
    print("=" * 40)
    for i, module in enumerate(tracker.course.modules):
        pct = tracker.module_percent(i)
        print(f"[{_status(pct):>6}] {module.title}: {pct:.0f}%")
    print("-" * 40)
    for name, (earned, total, _) in quiz_results.items():
        grade = "pass" if passed((earned, total, [])) else "retake"
        print(f"Quiz '{name}': {earned}/{total}  {grade}")
    print("=" * 40)
    print(f"Course complete: {tracker.course_percent():.0f}%")

if __name__ == "__main__":
    from models import load_course
    tracker = ProgressTracker(load_course("course.json"), "Ada")
    tracker.complete_lesson(0, 0)
    tracker.complete_lesson(0, 1)
    render_dashboard(tracker, {"Basics quiz": (1, 2, [])})
```

مساعد الحالة قطعة صغيرة من "منطق العرض" ، يحول رقمًا إلى كلمة حتى تقرأ الشاشة كمنتج لا كجدول بيانات. يأتي `quiz_results` كـ *قاموس* مفتاحه اسم الاختبار لأن اللوحة للقراءة فقط: تعرض المكتسب/الإجمالي المخزَّن لكل اختبار وتعيد الحكم على قرار التجاوز عند العرض، بدل تغيير أي حالة اختبار.

**🎯 الناتج المتوقع :**

```
Dashboard for Ada
========================================
[  done] Basics: 100%
[  todo] Functions: 0%
----------------------------------------
Quiz 'Basics quiz': 1/2  retake
========================================
Course complete: 67%
```

**🩹 إذا لم يعمل :** إذا طُبعت وحدة نسبتها 0% كـ `[  done]`، فمقارنة `== 100.0` في `_status` تعمل على رقم عشري غير منسّق يفوته بالكاد ، النسب المئوية تُحسب كأعداد عشرية، لذا قارن مقابل `100.0` تمامًا كما كتبت. إذا أظهر سطر `Quiz 'Basics quiz'` نجاحًا يناقض مصحّحك، فالصفّي المُمرر إلى `passed()` فيه `average` مبادل بـ `earned` ، أبقِ ترتيب `(earned, total, flags)` متسقًا في كل مكان.

### 4.2 تحقّق من اللوحة

**✅ قائمة التحقق**

- ✅ يسمي رأس اللوحة الطالب ويظهر صفا الوحدات كلمتي الحالة المتوقعتين.
- ✅ تُعرض نتائج الاختبارات كـ `X/Y` مع حكم `pass` أو `retake` يطابق مصحّح الخطوة 3 على نفس الأرقام.
- ✅ يطبع `render_dashboard` دون خطأ لقاموس `quiz_results` فارغ.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يضيف `render_dashboard` لمعان الرأس/الحالة/الحكم، لكنه لا يغيّر أي حالة متتبع. لماذا يستحق فصل *العرض* عن *التغيير* دفاعًا تصميميًا مع نمو الدورة بعلم مخرج `--json`؟
- يتكرر النوع `tuple[int, int, list[bool]]` في كل مكان يتحرك فيه نتيجة اختبار. ما الذي كان سيتغير لو أصبحت نتيجة الاختبار `@dataclass` ، أين تتوقف الصفّية العارية عن كفاية التعبير؟

## الخطوة 5: الشهادات ، مكتسبة، لا مفترضة

شهادة تَطبع متى طُلب منها لا قيمة لها؛ التي تَطبع *فقط عند اكتمال الدورة* ذات معنى. تفرض الخطوة الأخيرة الثابت عند الحدود: ابنِ نص الشهادة، لكن ارفض لسبب واضح إذا لم يبلغ `course_percent()` المئة.

### 5.1 اكتب `build_certificate`

**👟 تلميح البداية :** احرس مع `raise ValueError` مبكر باستخدام رسالة دقيقة، ثم ابنِ الشهادة ببيانات المتتبع الحقيقية وتاريخ اليوم:

```python
# certificate.py
from datetime import date

from progress import ProgressTracker

def build_certificate(tracker: ProgressTracker) -> str:
    pct = tracker.course_percent()
    if pct < 100.0:
        raise ValueError(
            f"{tracker.student} is only {pct:.0f}% complete -- finish the course first."
        )
    module_line = ", ".join(m.title for m in tracker.course.modules)
    return f"""
================================================
            COURSE COMPLETION CERTIFICATE
================================================

  This certifies that

        {tracker.student}

  has completed the course

        {tracker.course.title}

  covering: {module_line}

  Date: {date.today().isoformat()}
  Signature: Course Instructor
================================================
"""

if __name__ == "__main__":
    from models import load_course
    tracker = ProgressTracker(load_course("course.json"), "Ada")
    for mi, module in enumerate(tracker.course.modules):
        for li in range(len(module.lessons)):
            tracker.complete_lesson(mi, li)
    with open("certificate.txt", "w") as f:
        f.write(build_certificate(tracker))
    print("Wrote certificate.txt")
```

تتقارب كل قاعدة في هذا المشروع على هذا الحارس. `if pct < 100.0: raise` *ثابت أعمال مُفرَض في الكود* ، لا مسار يطبع شهادة لدورة اكتملت 89%، لأن الحارس يجلس قبل تجميع أي نص شهادة أصلًا. يمنحك `date.today().isoformat()` سلسلة تاريخ حقيقية قابلة للفرز دون أي تنسيق سلاسل إطلاقًا، وكتلة `__main__` تمشي في الوحدات بالفهرس لتعليم كل شيء مكتملًا ، نفس المفتاح الإحداثي الذي فهمه المتتبع منذ الخطوة 2.

**🎯 الناتج المتوقع :** `Wrote certificate.txt` ، وفتح `certificate.txt` يعرض شهادة ASCII مع `Ada` و`Python 101` وقائمة الوحدات وتاريخ اليوم وسطر توقيع.

**🩹 إذا لم يعمل :** `ValueError` تقول `finish the course first` هي *سلوك صحيح* لدورة ناقصة ، أتمم الحلقة في `__main__` كاملة (الوحدتين) إن أردت شهادة. إذا طبعت الشهادة عناوين الوحدات بالترتيب الخاطئ، فالاجتياز عبر `tracker.course.modules` يتم على قائمة غيّرتها بين التحميل والطباعة ، أعد تحميل الدورة جديدًا في العرض التوضيحي.

### 5.2 تحقّق من قاعدة الشهادة

**✅ قائمة التحقق**

- ✅ إتمام كل درس في الدورة يكتب `certificate.txt` ويطبع `Wrote certificate.txt`.
- ✅ إزالة استدعاء `complete_lesson` واحد يدفع نفس السكربت لرفع `ValueError` قبل كتابة أي ملف.
- ✅ تحوي الشهادة الاسم الحقيقي للطالب وعنوان الدورة الحقيقي وتاريخ اليوم ، لا شيء مُرمَّزًا ثابتًا.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يرفع الحارس `ValueError`. ما الذي كان سيتغير لو *التقط* متصل ذلك الخطأ بصمت ليطبَع "قيد التقدم" بدلًا منها ، هل الرفع الخيار الصادق، أم قيمة إرجاع مثل `None` أكثر تسامحًا لكود واجهة؟
- يحسب `build_certificate` النسبة المئوية *بنفسه* بدل الثقة في منطقي `fully_complete` ممرر إليه. لماذا التحقق من الحقيقة المشتقة أكثر صلابة من الثقة في علم يمكن أن يُضبط بتفاؤل؟

## ⚠️ المآزق الشائعة

- **الافتراضيات المتغيرة المشتركة.** `lessons=[]` على حقل dataclass يُقيَّم *مرة واحدة* ، كل `Module()` يشارك قائمة واحدة، لذا إضافة درس لوحدة "تظهر" في الكل. استخدم دائمًا `field(default_factory=list)`.
- **تخزين التقدم كعناوين، لا إحداثيات.** إعادة تسمية "Loops" تعيد كل طالب أتمّه إلى الصفر. صفّيات الفهارس تنجو من إعادة التسمية والتسلسل بشكل متطابق.
- **مفاتيح إجابات كسلاسل مقابل فهارس.** تصحيح `answers = ["4", "bool"]` مقابل مفتاح أعداد صحيحة لا يطابق أبدًا. قرر مرة أن الخيارات تُعرَّف بـ *الفهرس*، وأبق مقارنات المصحّح فهرسًا-لفهرس.
- **مقارنة الأعداد العشرية بالضبط.** `pct == 100` حيث `pct` قيمته `99.9999999` من حساب عشري يرجع `False`. قارن بـ `< 100.0` للحارس و`>=` لعلامات التجاوز، كما يفعل الكود أعلاه.
- **ترك أي كود يطبع الأسرار أو الشهادات مبكرًا.** كحارس الشهادة، كل أثر "ذي معنى فقط عند استحقاقه" يستحق فحص حدود قبل بناء النص ، نفس الغريزة التي تبقي `config-manager` (مشروع الدورة المصاحب هذا) من طباعة الأسرار.

## ما بنيته للتو

محرك دورات عامل: طبقات dataclass تُروَّى من JSON، وتتبع تقدم لكل طالب بإتمام بلا أثر، ومصحّح اختبارات بعتبة تجاوز، ولوحة مقروءة، وشهادة مكتسبة لا مفترضة ، كل ذلك مكتبة قياسية، وكل شيء قابل للتشغيل من طرفية. المهارة القابلة للنقل هي *نمذجة مجال من العالم الحقيقي في بنى بيانات وثوابت*: تحويل "أنهى طالب دورته" من إحساس إلى `course_percent() == 100.0` قابل للتحقق، يُفرَض بالكود لا بحسن النية.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
لدى [`examples/course-builder/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/course-builder) في مستودع الدورة هذه السكربتات الكاملة مع ملف `course.json` عينات. أو افتح المستودع كاملًا في [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## إلى أين تذهب من هنا

- اكتب التقدم إلى القرص كـ JSON (`tracker.completed` بالفعل مجموعة صفّيات قابلة للتسلسل) حتى يتمكن الطالب من إغلاق الطرفية والاستئناف ، طبقة استدامة فوق نموذج نظيف بالفعل.
- أضف مصنع `Course` *يتحقق من* JSON عند التحميل (عناوين دروس فريدة، دقائق غير سالبة) بدل الثقة بالملف ، تأمين رخيص يعيد استخدام أشكال الخطوة 1.
- اطبع الشهادة كـ **PDF** بإخراج ملف PDF صالح بمينيّ يدويًا، أو سر المسار العملي واعرض Markdown تقدمه منصة دورات.
- أضف طالبًا ثانيًا ودع اللوحة تقبل `--student ada|grace` ، ستكتشف أن التقدم مفكك تمامًا من الدورة (فعلت الخطوة 2 ذلك عمدًا).

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها ، وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓