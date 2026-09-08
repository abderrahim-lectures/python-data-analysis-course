---
title: "مدير المهام CLI"
description: "إدارة مهام على طراز كانبان من الطرفية مع الأولويات والمواعيد النهائية وتنظيم المشاريع."
difficulty: "beginner"
estimatedMinutes: 50
tags: ["cli", "json", "productivity"]
learningObjectives:
  - نموذج مهمة بفئة بيانات (dataclass) وخزّنها في JSON
  - أضف المهام بحقول الأولوية والمشروع والموعد النهائي
  - "اعرض المهام وصفّها حسب المشروع"
  - علّم المهام كمكتملة واكتشف المواعيد المتأخرة
  - اعرض المهام كلوحة مجمّعة حسب الحالة
prerequisites:
  - "Python basics (functions, lists, dictionaries)"
  - "Comfort with sys.argv and running scripts from a terminal"
  - "Optional: a light touch of datetime and date"
---

# 🛠️ 🗂️ اعِد مدير مهام CLI

مهمة لا مكان لها لن تُنجز. يبني هذا المشروع أصغر مدير مهام مفيد حقًا: أداة سطر أوامر تخزّن المهام في ملف JSON، وتتيح لك إضافتها بأولوية ومشروع وموعد نهائي، وسردها وتصفيةها، وتعليمها كمكتملة، وعرض كل القائمة كلوحة كانبان في الطرفية. هو مكتبة معيارية نقية — ستتعلم فئات البيانات، والتخزين الدائم بـ JSON، والقليل من حساب التواريخ، وستنتهي بأداة ستفعلها يوميًا.

يُفترض أساسيات بايثون ومعرفة تشغيل السكربتات من الطرفية — لا شيء beyond ذلك. هذا اختياري وغير مُقيَّم؛ راجع [المشاريع الواقعية](/ar/مشاريع) للقائمة الكاملة المتنامية.

## 🎯 ما ستفعله

1. نمذجة مهمة كفئة بيانات وحفظها في ملف JSON.
2. إضافة مهام بأولوية ومشروع وموعد نهائي.
3. سرد المهام وتصفيتها حسب المشروع.
4. تعليم المهام كمكتملة وتحديد المواعيد النهائية المتأخرة.
5. عرض القائمة كلوحة كانبان حسب الحالة.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي — وبصدق، الوحيد *الحقيقي* — لهذا المشروع. غاية مدير المهام هي البقاء بين جلسات الطرفية، وهذا يعني كتابة `tasks.json` على القرص الذي تحتفظ به. شغّله هناك حتى تبقى مهامك محفوظة.

**Google Colab و Kaggle Notebooks و Binder** يمكنها تشغيل خلايا الكود بشكل جيد — كلها تملك بايثون والمكتبة المعيارية. التنبيه الصادق: نظام ملفات الدفتر مؤقت، ف `tasks.json` قد لا ي survives عبر الجلسات، فتعامل تلك المسارات كـ "شاهد المنطق يعمل مرة واحدة" بدلاً من "احتفظ بمهامي الحقيقية". استخدم الشارات لتجربة الكود، وانتقل إلى `uv` المحلي للأداة التي تعتمد عليها فعلًا.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/task-manager/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/task-manager/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Ftask-manager%2Fnotebook.ipynb)

## الإعداد

أنشئ المشروع. تستخدم هذه الأداة المكتبة المعيارية فقط، فلا شيء لتثبيته.

```bash
uv init task-manager
cd task-manager
```

```bash
uv run python -c "import json; from pathlib import Path; print('ok')"
```

`json` هو طبقة قاعدة البيانات الكاملة — ستكون مهامك في ملف `tasks.json` مقروء في مجلد المشروع. `pathlib.Path` يعطيك طريقة نظيفة عبر المنصات للتحقق من وجود الملف.

**✅ قائمة التحقق**

- ✅ `uv init task-manager` أنشئ مجلدًا بملف `pyproject.toml`.
- ✅ `uv run python -c "import json; from pathlib from Path"` طبع `ok` — صفر حزم مُضافة.

## الخطوة 1: نمذجة مهمة وتخزينها بـ JSON

كل أمر في هذه الأداة يقرأ من ويكتب إلى التخزين نفسه. تحتاج أولًا شكلًا للمهمة، ودالتين تحفظان وتحملان قائمة المهام.

### 1.1 أنشئ فئة `Task` وتخزين JSON

**👟 تلميح البداية :** حدد فئة `Task` بالحقول التي ستحتاجها (id، title، project، priority، deadline، done)، ثم اكتب `load_tasks`/`save_tasks` حول ملف `tasks.json`.

```python
# tasks.py
import json
from dataclasses import dataclass, asdict
from pathlib import Path

DB = "tasks.json"

@dataclass
class Task:
    id: int
    title: str
    project: str = "Inbox"
    priority: str = "medium"
    deadline: str = ""
    done: bool = False

def load_tasks() -> list[Task]:
    """Load all tasks from tasks.json, or [] if the file doesn't exist yet."""
    if not Path(DB).exists():
        return []
    with open(DB) as f:
        return [Task(**row) for row in json.load(f)]

def save_tasks(tasks: list[Task]) -> None:
    """Write the task list to tasks.json."""
    with open(DB, "w") as f:
        json.dump([asdict(t) for t in tasks], f, indent=2)

print(load_tasks())
```

`@dataclass` تكتب `__init__`، و `__repr__`، وطرق المساواة لك — تصف الحقول مرة واحدة وتحصل على كائن حقيقي. الزوج الحافظ هو طبقة التخزين بالكامل: `asdict(t)` يحوّل كل `Task` إلى قاموس عادي يفهمه JSON، و `json.dump(..., indent=2)` يكتب ملفًا مقروءًا، وعند العودة `Task(**row)` يفكّ تجميع كل قاموس محفوظ إلى `Task`. حرس `if not Path(DB).exists()` هو ما يجعل التشغيل الأول آمنًا: لا ملف بعد يعني لا مهام، لا خطأ.

**🎯 الناتج المتوقع :** `[]` على مشروع جديد — قائمة مهام فارغة، بدون انهيار.

**🩹 إذا لم يعمل :** إذا حصلت على `FileNotFoundError`، فحرس `exists()` مفقود. إذا كان الإخراج سطرًا ضخمًا غير مقروء، ف `indent=2` مفقود من `json.dump`. إذا ألقى `Task(**row)` خطأ `TypeError: unexpected keyword argument`، فالقاموس المحفوظ يحتوي مفتاحًا لا تملكه فئة البيانات — تحقق من تطابق الحقول.

### 1.2 تحقق من التخزين

**✅ قائمة التحقق**

- ✅ `uv run python tasks.py` طبع `[]` في تشغيل جديد.
- ✅ `save_tasks([Task(id=1, title="hi")])` ثم `load_tasks()` تحفظ المهمة وتعيدها سليمة.
- ✅ يمكنك تفسير ما يفعله `asdict(t)` بكلماتك.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- بعد `save_tasks`، توجد بيانات المهمة كنص حر يمكنك فتحه في أي محرر. ماذا يعطيك ذلك لا يملكه الحفظ المبني على `pickle` — وماذا يكلّفك في السرعة؟
- `Task(**row)` يفكّ تجميع قاموس إلى معاملات بالاسم. ماذا يحدث إذا كان `tasks.json` المحفوظ يفتقد حقل `done` في صف واحد، مع أن `done` له قيمة افتراضية لكن `id` و `title` ليس لهما؟

## الخطوة 2: أضف مهام بأولوية ومشروع وموعد نهائي

مع التخزين العامل، يمكنك البدء في ملئه. تضيف هذه الخطوة أمر `add`: تعطي كل مهمة جديدة id جديدًا، وتُدخلها في القائمة، وتحفظ، وتخبرك بما حدث.

### 2.1 اكتب أمر `add_task` ودوّيةوليد id مساعدة

**👟 تلميح البداية :** احسب الـ id التالي من أكبر id موجود (بقيمة افتراضية 0 للقائمة الفارغة)، ابنِ `Task`، أضفها، احفظ، واطبع تأكيدًا.

```python
# tasks.py (continued)
def next_id(tasks: list[Task]) -> int:
    return max((t.id for t in tasks), default=0) + 1

def add_task(tasks: list[Task], title: str,
             project: str = "Inbox", priority: str = "medium",
             deadline: str = "") -> None:
    task = Task(id=next_id(tasks), title=title,
                project=project, priority=priority, deadline=deadline)
    tasks.append(task)
    save_tasks(tasks)
    print(f"Added #{task.id}: {task.title} [{task.priority}] ({task.project})")

add_task(load_tasks(), "Review pull requests", project="Work", priority="high")
add_task(load_tasks(), "Buy groceries", project="Home", deadline="2026-09-10")
```

شيئان يجعلان هذا آمنًا. `max((t.id for t in tasks), default=0)` يُرضي حالتين في آن — القائمة الفارغة لا تملك ids، فيجعل `default=0` المهمة الأولى `#1` — وإعادة الحساب من القائمة المحفوظة تعني أن الـ id لا يتعارض أبدًا مع واحد محفوظ. الإضافة *قبل* الحفظ مقصود: إذا تغيّر أي شيء في تلك القائمة عبر الجلسة، فالحالة المكتوبة الأخيرة فقط مهمة.

**🎯 الناتج المتوقع :** في التشغيل الأول، `Added #1: Review pull requests [high] (Work)` و `Added #2: Buy groceries [medium] (Home)`.

**🩹 إذا لم يعمل :** إذا طبع كلا المهمتين `#1`، ف `next_id` لا يُعيد الحساب من القائمة *المحفوظة* — تحقق من أن كل استدعاء `add_task` يحمّل مهامًا جديدة بدلاً من إعادة استخدام نفس الكائن. إذا قفزت الـ ids إلى أرقام كبيرة، ف `default=0` للقائمة الفارغة مفقود. إذا لم تظهر الأولويات في التأكيد، فالـ f-string فيها `task.priority` مُبدّل بـ `priority`.

### 2.2 تحقق من `add`

**✅ قائمة التحقق**

- ✅ تشغيل استدعاءي `add_task` متتاليين يُنتج ids `1, 2` ثم `3, 4` — بدون تعارض.
- ✅ `tasks.json` يحتوي الآن كائني مهام مقروءين.
- ✅ المشروع والموعد الفارغان يعودان إلى `"Inbox"` و `""` بدون خطأ.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- معامل `priority` له قيمة افتراضية، فيحصل مستخدم ينسى تمريره على `"medium"` بصمت. هل هذا افتراض مفيد أم فخ جودة بيانات، وماذا تُضيف لمنع الأولويات الخاطئة من الدخول في الملف؟
- يُحفظ الموعد النهائي كنص عادي. متى تعتقد أن هذا النص سيصبح غير كافٍ (تلميح: فكّر في الخطوة 4)، وما النوع الذي ستستخدمه بدلاً منه؟

## الخطوة 3: اسرد وصفي المهام حسب المشروع

إضافة مهام بلا فائدة إذا لا تستطيع رؤيتها. تضيف هذه الخطوة السرد — مرتبة بالأولوية لتصعد المهمة — وفلتر `project` حتى يكون كل مشروع عرضًا واضحًا.

### 3.1 اكتب أمر السرد والتصفية

**👟 تلميح البداية :** رتّب المهام المحملة حسب ترتيب أولوية تُعرّفه، ثم ضيّق اختيارًا حسب مشروع واحد قبل طباعة كل صف.

```python
# tasks.py (continued)
PRIORITY_ORDER = {"high": 0, "medium": 1, "low": 2}

def list_tasks(tasks: list[Task], project: str | None = None) -> None:
    items = tasks if project is None else [t for t in tasks if t.project == project]
    items.sort(key=lambda t: (PRIORITY_ORDER[t.priority], t.id))
    if not items:
        print("Nothing here yet.")
        return
    for t in items:
        flag = "[x]" if t.done else "[ ]"
        print(f"{t.id:>3} {flag} {t.priority:<6} {t.project:<8} {t.title}")

print("-- all --")
list_tasks(load_tasks())
print("-- Home only --")
list_tasks(load_tasks(), project="Home")
```

مفتاح الترتيب `(PRIORITY_ORDER[t.priority], t.id)` يفعل وظيفتين: ترتيب رئيسي حسب خريطة الأولوية الرقمية (فيأتي `high` قبل `medium` — الترتيب الأبجدي سيعكس هذا)، وترتيب ثانوي ثابت بالـ id حتى تحافظ المهام بنفس الأولوية على ترتيب الإدراج. علامة `[x]`/`[ ]` هي علامة إنجاز على شكل لوحة ستبنيها في الخطوة 5. التصفية بقائمة مُركّبة تُبقي حلقة الطباعة بسيطة — مسار كود واحد، مدخلان.

**🎯 الناتج المتوقع :** "all" يعرض المهمتين مع `#1 Review pull requests [high]` فوق `#2 Buy groceries [medium]`؛ "Home only" يعرض مهمة البقالة فقط.

**🩹 إذا لم يعمل :** إذا ترتّبت `low` فوق `high`، فمفتاح الترتيب يستخدم النص بدل `PRIORITY_ORDER`. إذا طبع "Home only" مهمة Work أيضًا، فالقائمة المُركّبة تقارن `t.project == project` لكن قيم المشروع تحتوي مسافات. إذا بدا `t.priority:<6` غير منتظم،فعرض التنسيق مفقود.

### 3.2 تحقق من السرد والتصفية

**✅ قائمة التحقق**

- ✅ `list_tasks` يرتب المهام عالية الأولوية أولًا عبر كل المشاريع.
- ✅ تمرير `project="Home"` يعرض مهام Home فقط.
- ✅ نتيجة فارغة تطبع `Nothing here yet.` بدلاً من عنوان فارغ.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- الترتيب *ثابت* على الـ id عندما تساوي الأولوية. لماذا يهم الاعتماد على الترتيب الثابت لترتيب الإدراج، وأين سيُفاجئ الترتيب غير الثابت المستخدم؟
- التصفية تحدث قبل الترتيب. هل سيكون صحيحًا أبدًا الترتيب أولًا ثم التصفية بعد — وماذا يوحي ترتيب المخرج عن كيف "تقرأ" الأداة مشاريعك؟

## الخطوة 4: أكمل المهام وحدد المواعيد النهائية المتأخرة

مدير مهام يضيف ويُسرد فقط هو رف فحسب. تضيف هذه الخطوة `done` — إكمال المهمة فعلًا — مع حساب التواريخ الذي يحدد المواعيد التي تجاوزت.

### 4.1 اكتب `complete_task` وفحص التأخر

**👟 تلميح البداية :** ابحث عن المهمة بالـ id، اقلب علامة `done`، احفظ، وتأكد. ثم أضف `is_overdue` الذي يُعيد `False` للمهام المكتملة وبدون موعد نهائي ويقارن تاريخًا مُحلّلًا بإيقاف اليوم.

```python
# tasks.py (continued)
from datetime import date, datetime

def complete_task(tasks: list[Task], task_id: int) -> None:
    for t in tasks:
        if t.id == task_id:
            t.done = True
            save_tasks(tasks)
            print(f"Completed #{task_id}: {t.title}")
            return
    print(f"No task with id {task_id}.")

def is_overdue(t: Task) -> bool:
    if t.done or not t.deadline:
        return False
    deadline = datetime.strptime(t.deadline, "%Y-%m-%d").date()
    return deadline < date.today()

tasks = load_tasks()
complete_task(tasks, 2)
for t in tasks:
    status = "OVERDUE" if is_overdue(t) else ("done" if t.done else "open")
    print(f"#{t.id} {t.title}: {status}")
```

`complete_task` خطيّ مقصود — امسح عن الـ id، غيّر في الموضع، احفظ مرة واحدة، عُد. الإرجاع المبكر داخل الحلقة هو مسار النجاح الكامل: يمنع الحفظ المزدوج ويُبقي طباعة "غير موجود" كفرع احتياطي. `is_overdue` يتخذ قراري حرس أولًا: مهمة مكتملة لا يمكنها أن تكون متأخرة، ومهمة بدون موعد نهائي لا يمكنها أن تكون متأخرة — كلتاهما *غياب جدولة*، لا فشل جدولة. `strptime` الذي يُحوّل النص المحفوظ إلى `date` حقيقي هو ما يجعل مقارنة `<` ممكنة.

**🎯 الناتج المتوقع :** `Completed #2: Buy groceries`؛ الحلقة تطبع `#1 Review pull requests: open` و `#2 Buy groceries: done` — مع `OVERDUE` لأي مهمة مواعدها النهائي يسبق اليوم.

**🩹 إذا لم يعمل :** إذا ألقى `strptime` خطأ `ValueError`، فموعد محفوظ ليس بصيغة `%Y-%m-%d` (مثلاً `"2026/09/10"`) — هذا فخ النص-الموعد من الخطوة 2. إذا قرأت *كل* مهمة OVERDUE، ف `is_overdue` يقارن `datetime` بـ `date` أو يفتقد حرس `not t.deadline` فيفسر النصوص الفارغة وتُلقى خطأ. إذا أكمل مهمة واحدة عدة مهام، فالحلقة تُغيّر المقارنة الخاطئة — ids يجب أن تقارن بالضبط.

### 4.2 تحقق من الإكمال ومنطق التأخر

**✅ قائمة التحقق**

- ✅ إكمال id حقيقي يُقلب `done` إلى `true` في `tasks.json`.
- ✅ إكمال id غير موجود يطبع `No task with id …` ويكتب شيئًا.
- ✅ مهمة بموعد نهائي ماضٍ و `done=False` تُبلّغ `OVERDUE`؛ نفس المهمة بعد تعليمها كمكتملة لا تُبلّغ.

**🤔 سؤال (أسئلة) socrates)**

- `is_overdue` يتجاهل موعدًا *اليوم* — فقط `< اليوم` يُحتسب. مهمة مواعدها اليوم تبدو تمامًا كمهمة مواعدها الأسبوع القادم في هذا المخرج. ماذا ستطبع بدلاً من ذلك لجعل "موعد اليوم" حالة مميزة ومستعجلة؟
- يُقارن الموعد النهائي بـ `date.today()` في جهازك. في أي سيناريو حقيقي تكون ساعة جهازك خاطئة، وكيف ستتغيّر الفواصل الزمنية معنى "متأخر"؟

## الخطوة 5: اعرض لوح كانبان

اللوحة هي المكافأة — العرض اليومي الذي يراه مستخدم كانبان فعليًا. يُجمّع القائمة في أعمدة حالة، ويُعلّم الأجزاء المستعجلة، ويُضاعف كأمر رئيسي للأداة.

### 5.1 اكتب اللوحة ومُوجّه أوامر صغير

**👟 تلميح البداية :** اقسم المهام إلى أعمدة "To do" و "Done"، علّم العناصر المتأخرة في عمود To-do، وابنِ `main` يُوجّه `add` / `done` / `board` من `sys.argv`.

```python
# tasks.py (continued)
import sys

def show_board(tasks: list[Task]) -> None:
    todo = [t for t in tasks if not t.done]
    done = [t for t in tasks if t.done]

    print("┌─ TO DO ─────────────────────────────┐")
    for t in sorted(todo, key=lambda t: (is_overdue(t) is not True,
                                         PRIORITY_ORDER[t.priority], t.id)):
        flag = "OVERDUE!" if is_overdue(t) else "        "
        print(f"  {t.id:>2} {flag} {t.title}")
    if not todo:
        print("  (nothing to do)")

    print("┌─ DONE ──────────────────────────────┐")
    for t in done:
        print(f"  {t.id:>2}  [x] {t.title}")

def main() -> None:
    args = sys.argv[1:]
    if not args or args[0] == "board":
        show_board(load_tasks())
    elif args[0] == "add":
        title = " ".join(args[1:])
        add_task(load_tasks(), title)
    elif args[0] == "done":
        complete_task(load_tasks(), int(args[1]))
    else:
        print("Commands: board | add <title> | done <id>")

if __name__ == "__main__":
    main()
```

مفتاح الترتيب في `show_board` هو السطر المثير: `(is_overdue(t) is not True, PRIORITY_ORDER[t.priority], t.id)` يضع `False` قبل `True` في ترتيب منطقي — فيرتّب المهام *غير* المتأخرة أولًا و`tasks` المتأخرة `OVERDUE!` تطفو إلى أعلى العمود، حتى فوق عالية الأولوية. عرض اللوحة كنص مُرسوم هي بuraة عرض فحسب، لكن التقسيم (`todo`/`done`) يستخدم نفس علامة `done` التي غيّرتها الخطوة 4، فاللوحة *هي* البيانات. مُوجّه `main` يُبقي كل أمر سطرًا واحدًا فيقرأ الأداة كتطبيق صغير بدلاً من سكربت.

**🎯 الناتج المتوقع :** `uv run python tasks.py` يطبع لوحة بعمودين: المهام المتأخرة أولًا في TO DO بعلامة `OVERDUE!`، والمهام المكتملة تحت DONE. `board` و `add` و `done` كلها تعمل من الطرفية.

**🩹 إذا لم يعمل :** إذا ذكرت أخطاء الترتيب `bool` مقابل `int`، فالمفتاح مُجمّع خطأ — `is_overdue(t) is not True` يجب أن يبقى منطقياً. إذا لم يصل المُوجّه أبدًا إلى `done`، فقد استُهلك `sys.argv[1]` بمطابقة `args[0] == "add"` لعنوان فارغ. إذا بدت اللوحة مشوّهة في بعض الطرفيات، فالأحرف `┌─` لا تعمل — خطوط `==` العادية هي البديل المحمول.

### 5.2 تحقق من التطبيق من البداية إلى النهاية

**✅ قائمة التحقق**

- ✅ `uv run python tasks.py board` (أو بدون معامل) يعرض اللوحة بعمودين.
- ✅ `uv run python tasks.py add "Ship v1"` و `done 3` و `board` تُدوّر عبر `tasks.json`.
- ✅ المهام المتأخرة تظهر أعلى TO DO بالعلامة.
- ✅ استخدمت الأداة على مهامك الحقيقية مرة واحدة على الأقل.

**🤔 سؤال (أسئلة) socrates)**

- اللوحة لها بالضبط عمودان لأن `Task` تحفظ فقط `done` منطقيًا. ما الحقل الواحد الذي سيُضيف عمودًا ثالثًا "In progress"، وما تغيير سير العمل الذي يوحيه ذلك للمستخدمين؟
- `show_board` يستدعي `is_overdue` ثلاث مرات لكل مهمة. لبضعة عشرات لا يعني شيئًا — عند أي حجم تخزين ستحتاج caching، وكيف ستخزّنه *الصحيح* (فيُعاد الحساب عند إكمال مهمة)؟

## ⚠️ المآزق الشائعة

- **اقرأ مرة واحدة، واستخدم نفس القائمة لكل شيء.** استدعاء `add_task(load_tasks(), …)` مرتين في جلسة واحدة — أعد استخدام كائن القائمة المحملة للاستدعاءين، فيمحو الحفظ الثاني عمل الأول. الإعادة: أعد التحميل (أو أعد الحفظ) عند كل حد أمر، تمامًا كما يفعل `main`.
- **المواعيد كنصوص حرة.** `"9/10/2026"` و `"next week"` كلاهما يُحلّ إلى `ValueError` في `strptime` من الخطوة 4. الإصلاح: اقبل صيغة `%Y-%m-%d` واحدة ورفض أي شيء آخر عند الإضافة.
- **حذف الملف بين التشغيلات.** مدير مهام ينهار عند فقدان `tasks.json` معطوب في أول تشغيل. حرس `exists()` في `load_tasks` هو ما يجعل الملف الفارغ قائمة فارغة.
- **تخمين ids بدلاً من اشتقاقها.** تثبيت `id=1` يضمن تعارضًا في المرة الثانية. اشتقِ من `max(..., default=0) + 1` حتى يكون التخزين مصدر الحقيقة الوحيد.
- **ترتيب الأولوية أبجديًا.** `"high"` يرتّب *قبل* `"medium` كنص لكن `low` يرتّب بعد الاثنين — ترتيب خاطئ لقائمة مهام. دائمًا ارتب عبر خريطة `PRIORITY_ORDER` صريحة.

## ما بنيته للتو

مدير مهام حقيقي وفاعل يصمد أمام إعادة التشغيل: نمذجة بفئات البيانات، تخزين دائم بـ JSON، سرد مرتب بالأولوية، فلاتر مشاريع، إكمال، كشف تأخر، وعرض لوحة كانبان — التطبيق بالكامل في سكربت مكتبة معيارية واحدة ستفعلها فعلًا. المهارة القابلة للنقل هي *التدوين*: ثلاثية load/modify/save خلف `tasks.json` هي نفس الشكل الذي يعيش خلف ملفات الإعدادات وتطبيقات الملاحظات وأي ميزة "اجعل تغييراتي تعيش إعادة التشغيل".

:::tip[شغّل نسخة أكمل بدون إعداد محلي]
[`examples/task-manager/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/task-manager) في دورة الكود نسcha أكمل من الكود أعلاه، بأمرَي تعديل وحذف ولوحة أغنى. استنسخها، أو افتح الدورة في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) وشغّلها من هناك.
:::

## إلى أين تذهب من هنا

- أضف أمر `rm <id>` و `edit <id>` بنفس نمط load/save — الحذف هو فلترة قائمة وحفظ.
- اعرض "due today" بشكل منفصل عن OVERDUE بطباعة التاريخ الفعلي، لا مجرد العلامة.
- رتّب كل عمود حسب *الموعد النهائي* أيضًا، فيرتب مهمة عالية الأولوية متأخرة ومهمة متوسطة مواعدها الغد حسب ضغط الوقت.
- أضف عرض `--due` يطبع فقط المهام غير المكتملة بالمواعيد النهائية، الفلتر الصباحي بعد أن تصبح لديك مهام حقيقية في الملف.

## شارك مشروعك مع الفصل

بنيت شيئًا تفتخر به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع قدمها طلاب آخرون — و README يحتوي دليلًا كاملًا ومناسبًا للمبتدئين لإضافة مشروعك عبر **طلب سحب**، حتى لو لم تستخدم git من قبل: تفرّع المستودع، وإنشاء فرع، وعمل commit لملفاتك، وفتح الطلب، خطوة بخطوة. لا يُفترض خبرة git مسبقة.

أهلاً بكتابة بايثون خارج المتصفح. 🎓
