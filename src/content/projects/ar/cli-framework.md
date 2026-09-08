---
title: "بناء إطار عمل CLI"
description: "بناء إطار عمل CLI قابل للتركيب مع أوامر فرعية ومساعدة تلقائية ودعم الإضافات."
difficulty: "intermediate"
estimatedMinutes: 50
xpReward: 50
tags: ["cli", "argparse", "classes", "json"]
prerequisites: ["أساسيات Python (متغيّرات، حلقات، دوال، فئات)", "المُلمّ بأوامر الطرفية"]
---

# إطار عمل CLI

كل أداة Python جادّة تعيش على سطر الأوامر. في هذا المشروع ستبني إطار عمل CLI قابلًا لإعادة الاستخدام من الصفر — مدير مهام بأوامر فرعية للإضافة والعرض والإزالة والبحث. في الطريق ستتعلم كيف يحلّل `argparse` الوسائط، وكيف تُوجَّه الأوامر الفرعية، وكيف تُلوَّن مخرجات الطرفية، وكيف يُتحقق من المدخلات، وكيف تُحمَّل الإعدادات من ملف JSON، وكيف تُعرض أشرطة التقدّم للعمليات البطيئة. لا أطر عمل خارجية مثل Click أو Typer — فقط مكتبة Python القياسية وبضعة أسطر من التصميم الدقيق.

هذا المشروع يفترض أنك تعرف أساسيات Python: المتغيّرات، الحلقات، الدوال، الفئات، والقواميس. كما يجب أن تكون مرتاحًا في فتح طرفية وتشغيل سكربتات Python من سطر الأوامر. هذا المشروع اختياري وغير مُقيَّم. راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة.

## 🎯 ما ستفعله

1. تحليل الوسائط الموضعية والاختيارية باستخدام `argparse`.
2. بناء بنية أوامر فرعية توجّه أوامر مثل `task add` و`task list` و`task remove` و`task search`.
3. إضافة مخرجات طرفية ملوّنة باستخدام رموز ANSI الخام.
4. تنفيذ التحقق من المدخلات مع رسائل خطأ واضحة وسهلة الاستخدام.
5. تحميل وحفظ الإعدادات من ملف إعدادات JSON.
6. إضافة مؤشرات تقدّم للعمليات الطويلة.

## ما ستبنيه

إطار عمل CLI يقوم بما يلي:

- يحلل الوسائط الموضعية والاختيارية
- يدعم الأوامر الفرعية (add, list, remove, search)
- يعرض نصًا ملوّنًا ومخرجات منسقة
- يتحقق من المدخلات برسائل خطأ واضحة
- يحمّل الإعدادات من ملف إعدادات
- يعرض أشرطة تقدّم للعمليات الطويلة

## أين تُشغّل هذا

- **محليًا باستخدام `uv` (موصى به).** أدوات CLI تحتاج طرفية حقيقية — هذا المشروع لا يعمل في دفاتر الملاحظات.
- **Google Colab.** محدود — يمكنك اختبار دوال فردية، لكن تجربة CLI الكاملة تتطلب طرفية محلية.
- **JupyterLite.** غير مناسب لتنفيذ CLI.

## الإعداد

`uv` أداة واحدة تحل محل السلسلة المعتادة "ثبّت Python، ثم pip، ثم بيئة افتراضية" — فهي تدير إصدارات Python والتبعيات معًا.

**macOS / Linux** (الطرفية):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

أغلق طرفيتك وأعد فتحها، ثم تأكد من أنها ثُبِّتت:

```bash
uv --version
```

ثم جهّز المشروع:

```bash
uv init cli-framework
cd cli-framework
```

لا حاجة لحزم خارجية — كل شيء في هذا المشروع يستخدم مكتبة Python القياسية.

## الخطوة 1: حلّل الوسائط باستخدام argparse

### الهدف

تعلّم كيف يقرأ `argparse` سطر الأوامر ويحوّل السلاسل النصية الخام إلى مساحة أسماء (namespace) منظمة يمكن لكودك استخدامها.

### الشرح

عندما تكتب `python task.py add "Buy milk" --priority high`، يرى Python `sys.argv` كقائمة `["task.py", "add", "Buy milk", "--priority", "high"]`. يحوّل `argparse` تلك القائمة إلى كائن مُسمّى يمكنك عبره الوصول إلى `args.command == "add"` و`args.title == "Buy milk"` و`args.priority == "high"` — دون تقسيم يدوي للسلاسل، ودون أخطاء فهارس.

المفهومان الأساسيان هما **الوسائط الموضعية** (إلزامية، تُعرَّف بموضعها) و**الوسائط الاختيارية** (أعلام مثل `--priority` لها قيم افتراضية).

### تلميح البداية

استورد `argparse` و`sys`. أنشئ دالة `build_parser()` تُرجع `argparse.ArgumentParser`. استخدم `add_argument` لتحديد ما يقبله الأداة. استدعِ `parser.parse_args()` للحصول على كائن مساحة الاسم.

### الكود العامل

أنشئ ملفًا باسم `task.py`:

```python
import argparse
import sys


def build_parser() -> argparse.ArgumentParser:
    """Build the argument parser for the task manager."""
    parser = argparse.ArgumentParser(
        prog="task",
        description="A simple task manager from the command line.",
    )
    parser.add_argument(
        "title",
        nargs="?",
        help="Task title (interactive prompt if omitted)",
    )
    parser.add_argument(
        "-p", "--priority",
        choices=["low", "medium", "high"],
        default="medium",
        help="Task priority (default: medium)",
    )
    parser.add_argument(
        "-c", "--category",
        default="general",
        help="Task category (default: general)",
    )
    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()

    if args.title:
        print(f"Task:      {args.title}")
        print(f"Priority:  {args.priority}")
        print(f"Category:  {args.category}")
    else:
        title = input("Enter task title: ").strip()
        if not title:
            print("Error: title cannot be empty.")
            sys.exit(1)
        print(f"Task:      {title}")
        print(f"Priority:  {args.priority}")
        print(f"Category:  {args.category}")


if __name__ == "__main__":
    main()
```

### الناتج المتوقع

شغّله من الطرفية:

```bash
python task.py "Buy milk" --priority high --category shopping
```

```
Task:      Buy milk
Priority:  high
Category:  shopping
```

احذف العنوان لتشغيل المطالبة التفاعلية:

```bash
python task.py -p low
```

```
Enter task title: Clean the garage
Task:      Clean the garage
Priority:  low
Category:  general
```

مرّر `--help` لرؤية نص المساعدة المُنشأ تلقائيًا:

```bash
python task.py --help
```

```
usage: task [-h] [-p {low,medium,high}] [-c CATEGORY] [title]

A simple task manager from the command line.

positional arguments:
  title                 Task title (interactive prompt if omitted)

options:
  -h, --help            show this help message and exit
  -p {low,medium,high}, --priority {low,medium,high}
                        Task priority (default: medium)
  -c CATEGORY, --category CATEGORY
                        Task category (default: general)
```

### استكشاف الأخطاء وإصلاحها

**خطأ "unrecognized arguments".** مرّرت علمًا قبل وسيط موضعي في الترتيب الخاطئ، أو أخطأت في تهجئة اسم علم. شغّل `python task.py --help` لرؤية الخيارات الصحيحة.

**`title` دائمًا `None`.** `nargs="?"` يجعل الوسيط الموضعي اختياريًا. إذا أردته إلزاميًا، أزل `nargs="?"` وفحص `if args.title`.

**علم الأولوية يقبل قيمًا غير صالحة.** قيد `choices=["low", "medium", "high"]` يرفض أي شيء آخر. إذا احتجت أولويات مخصصة، استخدم `type=str` بدلًا من `choices`.

### قائمة التحقق

- `python task.py "Write report" --priority high` يطبع العنوان والأولوية والتصنيف.
- `python task.py --help` يعرض رسالة مساعدة منسقة بكل الأعلام.
- `python task.py -p low` بدون عنوان يطلب إدخالًا من المستخدم.
- قيم الأولوية غير الصالحة مثل `--priority urgent` تُنتج خطأً واضحًا.
- `python task.py` بدون وسائط وبدون stdin يشغّل المطالبة.

### سؤال سقراطي

لماذا يتعامل `argparse` مع علم `--help` تلقائيًا؟ وما الذي كان يجب أن تكتبه يدويًا لو كان عليك تحليل `sys.argv` بنفسك واكتشاف `-h` أو `--help`؟

## الخطوة 2: ابنِ الأوامر الفرعية

### الهدف

وسّع المحلّل ليدعم أوامر متعددة — `add` و`list` و`remove` و`search` — لكل منها وسائطه الخاصة، كلها تُوجَّه عبر نقطة دخول واحدة.

### الشرح

أدوات CLI الحقيقية لا ترمي كل شيء في محلّل واحد. تستخدم أوامر فرعية: `git commit` و`docker run` و`pip install`. يدعم `argparse` هذا عبر `add_subparsers()`. كل محلّل فرعي هو محلّل مصغّر بوسائطه الخاصة، لكنها كلها تعيش تحت محلّل أب واحد. يخزّن معامل `dest="command"` أي أمر فرعي تم اختياره.

### تلميح البداية

داخل `build_parser()`، استدعِ `parser.add_subparsers(dest="command")`. ثم أضف كل أمر فرعي بـ `sub.add_parser("add", ...)`. أعطِ كل محلّل فرعي وسائطه الخاصة. في `main()`، حوّل على `args.command` لتوجيه الإجراء إلى المعالج الصحيح.

### الكود العامل

استبدل محتويات `task.py` بـ:

```python
import argparse
import sys
import json
from datetime import datetime


TASKS_FILE = "tasks.json"


def load_tasks() -> list[dict]:
    """Load tasks from the JSON file."""
    try:
        with open(TASKS_FILE) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def save_tasks(tasks: list[dict]) -> None:
    """Save tasks to the JSON file."""
    with open(TASKS_FILE, "w") as f:
        json.dump(tasks, f, indent=2)


def build_parser() -> argparse.ArgumentParser:
    """Build the argument parser with subcommands."""
    parser = argparse.ArgumentParser(
        prog="task",
        description="A simple task manager from the command line.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # add
    add_p = sub.add_parser("add", help="Add a new task")
    add_p.add_argument("title", help="Task title")
    add_p.add_argument(
        "-p", "--priority",
        choices=["low", "medium", "high"],
        default="medium",
        help="Task priority (default: medium)",
    )
    add_p.add_argument(
        "-c", "--category",
        default="general",
        help="Task category (default: general)",
    )

    # list
    list_p = sub.add_parser("list", help="List all tasks")
    list_p.add_argument(
        "--category",
        help="Filter by category",
    )
    list_p.add_argument(
        "--priority",
        choices=["low", "medium", "high"],
        help="Filter by priority",
    )
    list_p.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Maximum number of tasks to show (0 = all)",
    )

    # remove
    remove_p = sub.add_parser("remove", help="Remove a task by index")
    remove_p.add_argument("index", type=int, help="Task index (from list)")

    # search
    search_p = sub.add_parser("search", help="Search tasks by keyword")
    search_p.add_argument("keyword", help="Search term")

    return parser


def cmd_add(args):
    """Add a new task."""
    tasks = load_tasks()
    task = {
        "title": args.title,
        "priority": args.priority,
        "category": args.category,
        "created_at": datetime.now().isoformat(),
        "done": False,
    }
    tasks.append(task)
    save_tasks(tasks)
    print(f"Added: {task['title']} [{task['priority']}]")


def cmd_list(args):
    """List tasks with optional filters."""
    tasks = load_tasks()
    if not tasks:
        print("No tasks found.")
        return

    if args.category:
        tasks = [t for t in tasks if t["category"] == args.category]
    if args.priority:
        tasks = [t for t in tasks if t["priority"] == args.priority]
    if args.limit > 0:
        tasks = tasks[: args.limit]

    if not tasks:
        print("No tasks match the filters.")
        return

    print(f"\n  {'#':<4} {'Title':<30} {'Priority':<10} {'Category':<12} {'Status'}")
    print(f"  {'─'*4} {'─'*30} {'─'*10} {'─'*12} {'─'*10}")
    for i, t in enumerate(tasks, 1):
        status = "done" if t["done"] else "open"
        print(f"  {i:<4} {t['title']:<30} {t['priority']:<10} {t['category']:<12} {status}")
    print()


def cmd_remove(args):
    """Remove a task by its index."""
    tasks = load_tasks()
    if not tasks:
        print("No tasks to remove.")
        return

    idx = args.index - 1
    if idx < 0 or idx >= len(tasks):
        print(f"Error: index {args.index} is out of range (1-{len(tasks)}).")
        sys.exit(1)

    removed = tasks.pop(idx)
    save_tasks(tasks)
    print(f"Removed: {removed['title']}")


def cmd_search(args):
    """Search tasks by keyword in the title."""
    tasks = load_tasks()
    keyword = args.keyword.lower()
    matches = [t for t in tasks if keyword in t["title"].lower()]

    if not matches:
        print(f"No tasks contain '{args.keyword}'.")
        return

    print(f"\n  Found {len(matches)} task(s) matching '{args.keyword}':")
    for i, t in enumerate(matches, 1):
        print(f"  {i}. {t['title']} [{t['priority']}]")
    print()


def main():
    parser = build_parser()
    args = parser.parse_args()

    commands = {
        "add": cmd_add,
        "list": cmd_list,
        "remove": cmd_remove,
        "search": cmd_search,
    }
    commands[args.command](args)


if __name__ == "__main__":
    main()
```

### الناتج المتوقع

```bash
python task.py add "Buy milk" --priority high --category shopping
python task.py add "Write report" --category work
python task.py add "Clean garage" --priority low --category home
```

```
Added: Buy milk [high]
Added: Write report [medium]
Added: Clean garage [low]
```

```bash
python task.py list
```

```
  #    Title                          Priority   Category     Status
  ──── ────────────────────────────── ────────── ──────────── ──────────
  1    Buy milk                       high       shopping     open
  2    Write report                   medium     work         open
  3    Clean garage                   low        home         open
```

```bash
python task.py list --category work --priority medium
```

```
  Found 1 task(s):
  1. Write report [medium]
```

```bash
python task.py search milk
```

```
  Found 1 task(s) matching 'milk':
  1. Buy milk [high]
```

```bash
python task.py remove 2
```

```
Removed: Write report
```

```bash
python task.py list
```

```
  #    Title                          Priority   Category     Status
  ──── ────────────────────────────── ────────── ──────────── ──────────
  1    Buy milk                       high       shopping     open
  2    Clean garage                   low        home         open
```

### استكشاف الأخطاء وإصلاحها

**خطأ "the following arguments are required: command".** نسيت اسم الأمر الفرعي. يجب أن يبدأ كل استدعاء بأمر فرعي: `python task.py add ...`، وليس `python task.py ...`.

**فهرس خارج النطاق عند الإزالة.** يستخدم أمر `remove` فهرسة تبدأ من 1 (مطابقة لما يراه المستخدم في `list`). إذا مرّرت `0` أو رقمًا أكبر من عدد المهام، تحصل على خطأ واضح. تحقق من مخرجات `list` لتأكيد الفهرس الصحيح.

**خطأ فك JSON عند البدء.** إذا احتوى `tasks.json` على JSON غير صالح (ربما عدّلته يدويًا)، تُرجع دالة `load_tasks` قائمة فارغة وتبدأ من جديد. للاسترداد، احذف الملف وأعد إضافة المهام.

**الفلاتر تُرجع لا شيء.** `--category work` حساس لحالة الأحرف. مهمة تصنيفها "Work" لن تطابق "work". فكّر في إضافة تطبيع `.lower()` في الفلتر إذا أردت مطابقة غير حساسة لحالة الأحرف.

### قائمة التحقق

- `python task.py add "Test" --priority high` ينشئ مهمة ويؤكدها بمخرجات.
- `python task.py list` يعرض كل المهام في جدول منسق.
- `python task.py list --category work` يعرض فقط المهام في تصنيف "work".
- `python task.py remove 1` يزيل المهمة الأولى ويؤكد العنوان.
- `python task.py remove 99` يطبع خطأ واضحًا عن خارج النطاق.
- `python task.py search keyword` يجد المهام ذات العناوين المطابقة.
- المهام تستمر عبر الأوامر — أضف ثلاثًا، واعرض، وستظهر الثلاث جميعًا.

### سؤال سقراطي

لماذا تُرجع دالة `load_tasks` قائمة فارغة عند `FileNotFoundError` بدلًا من الانهيار؟ ما نمط التصميم الذي يمثله هذا — وكيف يغيّر تجربة المستخدم عندما يشغّل الأداة لأول مرة؟

## الخطوة 3: أضِف مخرجات ملوّنة

### الهدف

اجعل مخرجات الطرفية متميزة بصريًا بلفّ النص في رموز ألوان ANSI — بحيث تُصبح الأولويات والحالات والأخطاء قابلة للتعرف فورًا.

### الشرح

تفسّر الطرفيات تسلسلات هروب خاصة كأوامر ألوان. التسلسل `\033[91m` يخبر الطرفية بالتحول إلى نص أحمر، و`\033[0m` يعيد التعيين إلى الافتراضي. بلفّ المخرجات في هذه الرموز، تجعل المهام عالية الأولوية حمراء، ومنخفضة الأولوية باهتة، ورسائل النجاح خضراء — دون أي مكتبات خارجية.

### تلميح البداية

عرّف فئة `Color` بثوابت سلاسل نصية على مستوى الفئة لكل لون. اكتب دالة مساعدة `colored(text, color)` تلفّ النص في رموز الهروب. استخدمها في دالتيك `cmd_list` و`cmd_add` لإبراز أجزاء مختلفة من المخرجات.

### الكود العامل

أضف فئة `Color` ودالة `colored` التاليتين في أعلى `task.py`، بعد الاستيرادات:

```python
class Color:
    """ANSI color codes for terminal output."""
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    RESET = "\033[0m"


def colored(text: str, color: str) -> str:
    """Wrap text in an ANSI color code."""
    return f"{color}{text}{Color.RESET}"
```

الآن حدّث `cmd_add` لاستخدام الألوان:

```python
def cmd_add(args):
    """Add a new task with colored confirmation."""
    tasks = load_tasks()
    task = {
        "title": args.title,
        "priority": args.priority,
        "category": args.category,
        "created_at": datetime.now().isoformat(),
        "done": False,
    }
    tasks.append(task)
    save_tasks(tasks)

    priority_colors = {
        "low": Color.DIM,
        "medium": Color.YELLOW,
        "high": Color.RED,
    }
    p_color = priority_colors.get(args.priority, "")
    print(f"  {colored('+', Color.GREEN)} {task['title']} [{colored(args.priority, p_color)}]")
```

حدّث `cmd_list` لترميز الأولويات والحالة بالألوان:

```python
def cmd_list(args):
    """List tasks with colored output."""
    tasks = load_tasks()
    if not tasks:
        print(colored("  No tasks found.", Color.DIM))
        return

    if args.category:
        tasks = [t for t in tasks if t["category"] == args.category]
    if args.priority:
        tasks = [t for t in tasks if t["priority"] == args.priority]
    if args.limit > 0:
        tasks = tasks[: args.limit]

    if not tasks:
        print(colored("  No tasks match the filters.", Color.DIM))
        return

    priority_colors = {
        "low": Color.DIM,
        "medium": Color.YELLOW,
        "high": Color.RED,
    }

    print()
    header = f"  {'#':<4} {'Title':<30} {'Priority':<10} {'Category':<12} {'Status'}"
    print(colored(header, Color.BOLD))
    print(f"  {'─'*4} {'─'*30} {'─'*10} {'─'*12} {'─'*10}")

    for i, t in enumerate(tasks, 1):
        status = colored("done", Color.GREEN) if t["done"] else colored("open", Color.CYAN)
        p_color = priority_colors.get(t["priority"], "")
        p_display = colored(t["priority"], p_color)
        print(f"  {i:<4} {t['title']:<30} {p_display:<19} {t['category']:<12} {status}")
    print()
```

حدّث `cmd_remove` لتلوين التأكيد:

```python
def cmd_remove(args):
    """Remove a task with colored confirmation."""
    tasks = load_tasks()
    if not tasks:
        print(colored("  No tasks to remove.", Color.DIM))
        return

    idx = args.index - 1
    if idx < 0 or idx >= len(tasks):
        print(colored(f"  Error: index {args.index} is out of range (1-{len(tasks)}).", Color.RED))
        sys.exit(1)

    removed = tasks.pop(idx)
    save_tasks(tasks)
    print(f"  {colored('-', Color.RED)} {removed['title']}")
```

حدّث `cmd_search` لإبراز المطابقات:

```python
def cmd_search(args):
    """Search tasks and highlight matches."""
    tasks = load_tasks()
    keyword = args.keyword.lower()
    matches = [t for t in tasks if keyword in t["title"].lower()]

    if not matches:
        print(colored(f"  No tasks contain '{args.keyword}'.", Color.DIM))
        return

    print(f"\n  {colored('Found', Color.GREEN)} {len(matches)} task(s) matching '{args.keyword}':")
    for i, t in enumerate(matches, 1):
        print(f"  {i}. {colored(t['title'], Color.CYAN)} [{t['priority']}]")
    print()
```

### الناتج المتوقع

```bash
python task.py add "Deploy to production" --priority high --category work
python task.py add "Read a book" --priority low --category personal
python task.py list
```

```
  + Deploy to production [high]
  #    Title                          Priority   Category     Status
  ──── ────────────────────────────── ────────── ──────────── ──────────
  1    Deploy to production           high       work         open
  2    Read a book                    low        personal     open
```

في طرفية تدعم ألوان ANSI، تظهر "high" باللون الأحمر، و"low" باهتة، و"open" سماوي، وصف الرأس بخط عريض. علامة `+` خضراء وعلامة `-` عند الإزالة حمراء.

### استكشاف الأخطاء وإصلاحها

**تظهر الألوان كرموز هروب خام مثل `[91m`.** طرفيتك لا تفسّر رموز ANSI. جرّب `export TERM=xterm-256color` قبل التشغيل. على Windows، استخدم Windows Terminal أو PowerShell 7+ — `cmd.exe` القديم لا يدعم ANSI افتراضيًا.

**تظهر الألوان في الملفات لكن ليس في الطرفية.** ربما تنقل المخرجات إلى ملف (`python task.py list > output.txt`). رموز ANSI للطرفيات التفاعلية فقط. إذا احتجت الكتابة إلى ملفات، أزل الرموز أو استخدم علمًا مثل `--no-color`.

**دالة `colored` تُرجع سلسلة فارغة.** تأكد من أنك تمرّر ثابت `Color`، لا سمة `Color` غير موجودة. مثلًا، `Color.RED` يعمل، لكن `Color.rED` لا يعمل.

**النص العريض لا يبدو عريضًا.** بعض ثيمات الطرفية تستبدل الخط العريض ANSI بدرجة أفتح بدلًا من العريض الفعلي. جرّب ثيم طرفية مختلفًا أو استخدم `\033[1m` مع رمز لون للتأكيد.

### قائمة التحقق

- المهام عالية الأولوية تظهر باللون الأحمر في مخرجات القائمة.
- المهام منخفضة الأولوية باهتة.
- تأكيد الإضافة `+` أخضر.
- تأكيد الإزالة `-` أحمر.
- صف رأس الجدول عريض.
- تسمية الحالة "open" سماوية.
- تشغيل `python task.py list > out.txt` يُنتج ملفًا بدون تسلسلات هروب إذا مُرِّر عبر أداة تُزيلها، أو مع تسلسلات الهروب إذا حفظها الأنبوب — في الحالتين، الأداة لا تنهار.

### سؤال سقراطي

لماذا يجب تطبيق رموز الألوان على مخرجات الطرفية فقط وعدم كتابتها أبدًا في ملفات السجلات أو ملفات البيانات؟ ماذا يحدث إذا مرّر مستخدم مخرجاتك الملوّنة إلى `less` أو `grep` أو محلّل سجلات في CI/CD؟

## الخطوة 4: التحقق من المدخلات

### الهدف

ارفض المدخلات السيئة مبكرًا برسائل خطأ واضحة وقابلة للتنفيذ بدلًا من ترك بيانات غير صالحة تفسد قائمة مهامك.

### الشرح

التحقق من المدخلات هو الحد الفاصل بين خطأ المستخدم وفشل البرنامج. مهمة بعنوان فارغ، أو أولوية خارج المجموعة المسموحة، أو تصنيف بحروف خاصة يجب التقاطها *قبل* حفظها. الهدف هو إنتاج رسائل خطأ تخبر المستخدم بما هو خاطئ بالضبط وكيف يصلحه — لا تتبعات أثرية (tracebacks)، ولا فساد صامت.

### تلميح البداية

اكتب دالة `validate_task_input(title, priority, category)` تفحص كل حقل. ارفع `ValueError` برسالة وصفية لأي مدخل غير صالح. استدعِها في بداية `cmd_add` قبل الحفظ.

### الكود العامل

أضف دالة تحقق وحدّث `cmd_add`:

```python
def validate_task_input(title: str, priority: str, category: str) -> None:
    """Validate task fields before saving. Raises ValueError on failure."""
    if not title or not title.strip():
        raise ValueError("Title cannot be empty or whitespace.")
    if len(title) > 200:
        raise ValueError(f"Title is too long ({len(title)} chars, max 200).")
    if priority not in ("low", "medium", "high"):
        raise ValueError(f"Invalid priority '{priority}'. Use: low, medium, high.")
    if not category or not category.strip():
        raise ValueError("Category cannot be empty.")
    if len(category) > 50:
        raise ValueError(f"Category is too long ({len(category)} chars, max 50).")
    # Check for characters that break JSON storage or display
    forbidden = set('/\\:"*?<>|')
    bad_chars = set(category) & forbidden
    if bad_chars:
        raise ValueError(
            f"Category contains invalid characters: {''.join(bad_chars)}"
        )


def cmd_add(args):
    """Add a new task with input validation."""
    try:
        validate_task_input(args.title, args.priority, args.category)
    except ValueError as e:
        print(colored(f"  Error: {e}", Color.RED))
        sys.exit(1)

    tasks = load_tasks()
    task = {
        "title": args.title.strip(),
        "priority": args.priority,
        "category": args.category.strip(),
        "created_at": datetime.now().isoformat(),
        "done": False,
    }
    tasks.append(task)
    save_tasks(tasks)

    priority_colors = {
        "low": Color.DIM,
        "medium": Color.YELLOW,
        "high": Color.RED,
    }
    p_color = priority_colors.get(args.priority, "")
    print(f"  {colored('+', Color.GREEN)} {task['title']} [{colored(args.priority, p_color)}]")
```

وتحقق أيضًا من فهرس `remove` في `cmd_remove`:

```python
def cmd_remove(args):
    """Remove a task with input validation."""
    tasks = load_tasks()
    if not tasks:
        print(colored("  No tasks to remove.", Color.DIM))
        return

    if args.index < 1:
        print(colored("  Error: index must be 1 or greater.", Color.RED))
        sys.exit(1)

    idx = args.index - 1
    if idx >= len(tasks):
        print(colored(
            f"  Error: index {args.index} is out of range (1-{len(tasks)}).",
            Color.RED,
        ))
        sys.exit(1)

    removed = tasks.pop(idx)
    save_tasks(tasks)
    print(f"  {colored('-', Color.RED)} {removed['title']}")
```

### الناتج المتوقع

```bash
python task.py add "" --priority high
```

```
  Error: Title cannot be empty or whitespace.
```

```bash
python task.py add "A" * 50 --priority extreme
```

```
  Error: Invalid priority 'extreme'. Use: low, medium, high.
```

```bash
python task.py add "Valid task" --category "work/special"
```

```
  Error: Category contains invalid characters: /
```

```bash
python task.py remove 0
```

```
  Error: index must be 1 or greater.
```

```bash
python task.py remove 999
```

```
  Error: index 999 is out of range (1-3).
```

المدخل الصالح يمر نظيفًا:

```bash
python task.py add "Write documentation" --priority medium --category work
```

```
  + Write documentation [medium]
```

### استكشاف الأخطاء وإصلاحها

**التحقق ينجح لكن البيانات تالفة.** تأكد من استدعاء `validate_task_input` *قبل* إلحاق المهمة بالقائمة. إذا تحققت بعد الإلحاق، تكون البيانات السيئة قد حُفظت بالفعل.

**رسالة الخطأ مبتورة.** إذا كان العنوان طويلًا جدًا، تتضمن رسالة الخطأ عدد الحروف. هذا متعمد — يخبر المستخدم بالمقدار الدقيق الذي يحتاج إلى تقصيره.

**`strip()` يزيل مسافات مفيدة.** إذا أدخل المستخدم عن قصد عنوانًا بمسافات بادئة، يزيلها `strip()`. هذا عادة السلوك الصحيح لعنوان مهمة، لكن إذا احتجت للحفاظ على المسافات، أزل استدعاءات `.strip()` ووثّق السياسة.

**التحقق من التصنيف صارم جدًا.** قائمة الحروف الممنوعة متحفظة. إذا احتجت تصنيفات بشرطات مائلة (مثل "work/urgent")، عدّل التحقق ليسمح بـ `/` ويمنع `\` و`"` والحروف الأخرى التي تكسر JSON.

### قائمة التحقق

- عنوان فارغ يُنتج خطأً واضحًا، لا تتبّعًا أثريًا.
- عنوان أطول من 200 حرف يُرفض مع ذكر عدد الحروف.
- قيم الأولوية غير الصالحة تُرفض مع قائمة الخيارات الصحيحة.
- تصنيف فارغ يُنتج خطأً.
- تصنيف بحروف ممنوعة (`/`، `\`، `"`، إلخ) يُرفض.
- إزالة الفهرس 0 تُنتج رسالة خطأ مفيدة.
- إزالة فهرس أكبر من عدد المهام يعرض النطاق الصالح.
- المدخل الصالح يُحفظ بشكل صحيح ويُؤكد بمخرجات.

### سؤال سقراطي

لماذا يُفضَّل التحقق من المدخلات عند الحدود (حين يقدّمها المستخدم) بدلًا من عمقًا داخل دالة الحفظ؟ ماذا يحدث لصعوبة التصحيح إذا تشابك التحقق والتخزين معًا؟

## الخطوة 5: دعم ملف الإعدادات

### الهدف

دع المستخدمين يخصّصون السلوك الافتراضي — الأولوية الافتراضية، التصنيف الافتراضي، تفضيلات الألوان — بتحميل الإعدادات من ملف JSON.

### الشرح

الافتراضيات المرمّزة ثابتًا في الكود تناسب عرضًا تجريبيًا، لكن الأدوات الحقيقية تحتاج إعدادات. ملف إعدادات JSON يتيح للمستخدمين ضبط تفضيلاتهم مرة واحدة ونسيانها. النمط هو: ابحث عن ملف إعدادات في مسار معروف، وحمّله إذا وُجد، واستخدمه لضبط الافتراضيات، وارجع إلى القيم المدمجة إذا كان الملف مفقودًا أو ناقصًا.

### تلميح البداية

اكتب فئة `Config` تحمّل `~/.taskconfig.json` (أو مسارًا تحدده أنت). تُرجع طريقة `get(key, default)` قيمة الإعداد أو الافتراضي. استدعِها في `build_parser` لتجاوز القيم الافتراضية لـ `--priority` و`--category`.

### الكود العامل

أضف فئة `Config` واربطها بالـ CLI:

```python
import os
from pathlib import Path


DEFAULT_CONFIG_PATH = Path.home() / ".taskconfig.json"

DEFAULT_SETTINGS = {
    "default_priority": "medium",
    "default_category": "general",
    "colors_enabled": True,
    "date_format": "%Y-%m-%d",
}


class Config:
    """Load and access settings from a JSON config file."""

    def __init__(self, path: str | Path | None = None):
        self.path = Path(path) if path else DEFAULT_CONFIG_PATH
        self.settings: dict = {}
        self.load()

    def load(self) -> None:
        """Load settings from disk, falling back to defaults."""
        self.settings = dict(DEFAULT_SETTINGS)
        if self.path.exists():
            try:
                with open(self.path) as f:
                    user_settings = json.load(f)
                self.settings.update(user_settings)
            except (json.JSONDecodeError, KeyError) as e:
                print(colored(f"  Warning: config file error ({e}), using defaults.", Color.YELLOW))

    def save(self) -> None:
        """Save current settings to disk."""
        with open(self.path, "w") as f:
            json.dump(self.settings, f, indent=2)

    def get(self, key: str, default=None):
        """Get a setting value with a fallback default."""
        return self.settings.get(key, default)


def build_parser(config: Config | None = None) -> argparse.ArgumentParser:
    """Build the argument parser, optionally using config for defaults."""
    default_priority = config.get("default_priority", "medium") if config else "medium"
    default_category = config.get("default_category", "general") if config else "general"

    parser = argparse.ArgumentParser(
        prog="task",
        description="A simple task manager from the command line.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # add
    add_p = sub.add_parser("add", help="Add a new task")
    add_p.add_argument("title", help="Task title")
    add_p.add_argument(
        "-p", "--priority",
        choices=["low", "medium", "high"],
        default=default_priority,
        help=f"Task priority (default: {default_priority})",
    )
    add_p.add_argument(
        "-c", "--category",
        default=default_category,
        help=f"Task category (default: {default_category})",
    )

    # list
    list_p = sub.add_parser("list", help="List all tasks")
    list_p.add_argument("--category", help="Filter by category")
    list_p.add_argument(
        "--priority",
        choices=["low", "medium", "high"],
        help="Filter by priority",
    )
    list_p.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Maximum number of tasks to show (0 = all)",
    )

    # remove
    remove_p = sub.add_parser("remove", help="Remove a task by index")
    remove_p.add_argument("index", type=int, help="Task index (from list)")

    # search
    search_p = sub.add_parser("search", help="Search tasks by keyword")
    search_p.add_argument("keyword", help="Search term")

    # config (new subcommand)
    cfg_p = sub.add_parser("config", help="Show or update configuration")
    cfg_p.add_argument(
        "--show",
        action="store_true",
        help="Show current configuration",
    )
    cfg_p.add_argument(
        "--set",
        nargs=2,
        metavar=("KEY", "VALUE"),
        help="Set a configuration value",
    )
    cfg_p.add_argument(
        "--init",
        action="store_true",
        help="Create a default config file",
    )

    return parser
```

أضف معالج الأمر الفرعي `config`:

```python
def cmd_config(args, config: Config):
    """Handle the config subcommand."""
    if args.init:
        if config.path.exists():
            print(colored(f"  Config already exists at {config.path}", Color.YELLOW))
        else:
            config.save()
            print(f"  Created config at {config.path}")
    elif args.show:
        print(f"\n  {colored('Configuration', Color.BOLD)} ({config.path})")
        print(f"  {'─' * 40}")
        for key, value in sorted(config.settings.items()):
            print(f"  {key:<25} {value}")
        print()
    elif args.set:
        key, value = args.set
        if key not in config.settings:
            print(colored(f"  Unknown setting: {key}", Color.RED))
            print(f"  Valid settings: {', '.join(sorted(config.settings.keys()))}")
            sys.exit(1)
        # Type-coerce value to match the default's type
        default = config.settings[key]
        if isinstance(default, bool):
            value = value.lower() in ("true", "1", "yes")
        elif isinstance(default, int):
            value = int(value)
        config.settings[key] = value
        config.save()
        print(f"  Set {key} = {value}")
    else:
        print(colored("  Use --show, --set KEY VALUE, or --init.", Color.DIM))
```

حدّث `main()` لإنشاء الإعدادات وتمريرها:

```python
def main():
    config = Config()
    parser = build_parser(config)
    args = parser.parse_args()

    commands = {
        "add": cmd_add,
        "list": cmd_list,
        "remove": cmd_remove,
        "search": cmd_search,
    }

    if args.command == "config":
        cmd_config(args, config)
    else:
        commands[args.command](args)
```

### الناتج المتوقع

أعد ملف إعدادات:

```bash
python task.py config --init
```

```
  Created config at /home/you/.taskconfig.json
```

اعرض الإعدادات:

```bash
python task.py config --show
```

```
  Configuration (/home/you/.taskconfig.json)
  ────────────────────────────────────────
  colors_enabled            True
  date_format               %Y-%m-%d
  default_category          general
  default_priority          medium
```

غيّر الأولوية الافتراضية:

```bash
python task.py config --set default_priority high
```

```
  Set default_priority = high
```

الآن تستخدم المهام الجديدة الافتراضي المُهيّأ:

```bash
python task.py add "Urgent task"
```

```
  + Urgent task [high]
```

إذا احتوى ملف الإعدادات على JSON غير صالح، تحذّر الأداة وتكمل بالافتراضيات:

```bash
echo "not json" > ~/.taskconfig.json
python task.py config --show
```

```
  Warning: config file error (...), using defaults.

  Configuration (/home/you/.taskconfig.json)
  ────────────────────────────────────────
  colors_enabled            True
  date_format               %Y-%m-%d
  default_category          general
  default_priority          medium
```

### استكشاف الأخطاء وإصلاحها

**ملف الإعدادات غير موجود على Windows.** `Path.home()` يُرجع `C:\Users\YourName` على Windows. المسار `~/.taskconfig.json` يُترجم بشكل صحيح، لكن إذا كنت تعمل في حاوية أو WSL، فقد يختلف دليل المنزل. اطبع `config.path` لرؤية المسار الفعلي.

**فرض تحويل النوع يفشل.** إذا عيّنت `default_priority` إلى `3` (سلسلة نصية)، تبقى سلسلة نصية بدلًا من أن تصبح عددًا صحيحًا. منطق التحويل يفحص نوع القيمة *الافتراضية* — إذا كان الافتراضي سلسلة نصية، تبقى القيمة الجديدة سلسلة نصية. هذا متعمد: لا يمكنك تغيير إعداد نصي إلى int عبر `--set`.

**ملف الإعدادات يُكتب فوق كل حفظ.** طريقة `save` تكتب قاموس الإعدادات كاملًا. إذا أضفت مفاتيح مخصصة يدويًا، ستُفقد عند الحفظ التالي. تُحفظ فقط المفاتيح الموجودة في `DEFAULT_SETTINGS`.

**خطأ صلاحيات عند الكتابة في دليل المنزل.** في بعض الأنظمة، دليل المنزل له صلاحيات صارمة. تحقق بـ `ls -la ~` وتأكد أن مستخدمك يمكنه كتابة ملفات هناك.

### قائمة التحقق

- `python task.py config --init` ينشئ `~/.taskconfig.json` بالقيم الافتراضية.
- `python task.py config --show` يطبع كل الإعدادات بقيمها الحالية.
- `python task.py config --set default_priority low` يحدّث الملف.
- بعد تغيير `default_priority`، يستخدم `python task.py add "Task"` الافتراضي الجديد.
- ملف إعدادات تالف يُنتج تحذيرًا، لا انهيارًا.
- أسماء إعدادات غير معروفة تُنتج خطأً مع قائمة المفاتيح الصحيحة.
- `python task.py add "Task"` بدون ملف إعدادات يعمل بالافتراضيات المدمجة.

### سؤال سقراطي

لماذا يتراجع محمّل الإعدادات إلى الافتراضيات بدلًا من مطالبة المستخدم بإصلاح الملف؟ ما المقايضة التي يجريها هذا بين المتانة وصحة البيانات؟

## الخطوة 6: مؤشرات التقدّم

### الهدف

اعرض شريط تقدّم للعمليات التي تأخذ وقتًا — التحميل، الفلترة، أو محاكاة العمل — حتى يعرف المستخدم أن الأداة تفعل شيئًا، لا أنها علقت.

### الشرح

شريط التقدّم هو تغذية راجعة بصرية. يخبر المستخدم بمقدار العمل المنجز والمتبقي. لمدير المهام، حالة الاستخدام الأكثر واقعية هي العمليات المجمّعة: استيراد المهام من ملف، تشغيل بحث عبر مجموعة بيانات كبيرة، أو محاكاة عملية بطيئة لأغراض تعليمية. التقنية بسيطة: اطبع سطرًا بـ `\r` (إرجاع العربة) ليكتب فوق نفسه كلما تحدّث التقدّم.

### تلميح البداية

اكتب فئة `ProgressBar` تتبّع `current` و`total`. تحسب طريقة `update()` النسبة المئوية، وترسم شريطًا من حرفي `#` و`-`، وتطبعه على نفس السطر باستخدام `\r`. أضف طريقة `finish()` تطبع سطرًا جديدًا عند الانتهاء.

### الكود العامل

أضف فئة `ProgressBar` واستخدمها في محاكاة استيراد مجمّع:

```python
import time


class ProgressBar:
    """A simple terminal progress bar."""

    def __init__(self, total: int, label: str = "Progress"):
        self.total = total
        self.current = 0
        self.label = label
        self.bar_width = 30

    def update(self, increment: int = 1) -> None:
        """Advance the progress bar by the given amount."""
        self.current = min(self.current + increment, self.total)
        percent = self.current / self.total if self.total > 0 else 1
        filled = int(self.bar_width * percent)
        bar = "#" * filled + "-" * (self.bar_width - filled)
        sys.stdout.write(f"\r  {self.label}: [{bar}] {self.current}/{self.total}")
        sys.stdout.flush()

    def finish(self) -> None:
        """Complete the progress bar and print a newline."""
        self.current = self.total
        self.update(0)
        sys.stdout.write("\n")
        sys.stdout.flush()
```

أضف أمرًا فرعيًا `cmd_import` ومولّد ملف بيانات نموذجية:

```python
def generate_sample_data(filename: str, count: int = 50) -> None:
    """Generate a sample tasks file for import."""
    import random

    titles = [
        "Review pull request", "Write documentation", "Fix login bug",
        "Deploy to staging", "Update dependencies", "Run test suite",
        "Clean up unused imports", "Refactor database queries",
        "Add error handling", "Write unit tests",
    ]
    priorities = ["low", "medium", "high"]
    categories = ["work", "personal", "urgent", "learning"]

    tasks = []
    for _ in range(count):
        tasks.append({
            "title": random.choice(titles),
            "priority": random.choice(priorities),
            "category": random.choice(categories),
        })

    with open(filename, "w") as f:
        json.dump(tasks, f, indent=2)
```

أضف الأمر الفرعي `import` إلى `build_parser`:

```python
    # import (new subcommand)
    import_p = sub.add_parser("import", help="Import tasks from a JSON file")
    import_p.add_argument("file", help="JSON file with tasks to import")
    import_p.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be imported without saving",
    )
```

أضف معالج الاستيراد:

```python
def cmd_import(args):
    """Import tasks from a JSON file with a progress bar."""
    try:
        with open(args.file) as f:
            new_tasks = json.load(f)
    except FileNotFoundError:
        print(colored(f"  Error: file '{args.file}' not found.", Color.RED))
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(colored(f"  Error: invalid JSON in '{args.file}': {e}", Color.RED))
        sys.exit(1)

    if not isinstance(new_tasks, list):
        print(colored("  Error: expected a JSON array of tasks.", Color.RED))
        sys.exit(1)

    print(f"  Importing {len(new_tasks)} tasks from {args.file}...")
    progress = ProgressBar(len(new_tasks), label="Importing")

    existing = load_tasks() if not args.dry_run else []
    imported = 0

    for task in new_tasks:
        # Validate each task before importing
        try:
            validate_task_input(
                task.get("title", ""),
                task.get("priority", "medium"),
                task.get("category", "general"),
            )
            cleaned = {
                "title": task["title"].strip(),
                "priority": task.get("priority", "medium"),
                "category": task.get("category", "general"),
                "created_at": task.get("created_at", datetime.now().isoformat()),
                "done": task.get("done", False),
            }
            if not args.dry_run:
                existing.append(cleaned)
            imported += 1
        except ValueError as e:
            print(f"\n  {colored('Skipped', Color.YELLOW)}: {task.get('title', '?')} — {e}")
        progress.update()

    progress.finish()

    if not args.dry_run:
        save_tasks(existing)

    status = "would import" if args.dry_run else "imported"
    print(f"  {colored('Done!', Color.GREEN)} {status} {imported}/{len(new_tasks)} tasks.")
```

أضف `import` إلى قاموس الأوامر في `main()`:

```python
def main():
    config = Config()
    parser = build_parser(config)
    args = parser.parse_args()

    commands = {
        "add": cmd_add,
        "list": cmd_list,
        "remove": cmd_remove,
        "search": cmd_search,
        "import": cmd_import,
    }

    if args.command == "config":
        cmd_config(args, config)
    else:
        commands[args.command](args)
```

### الناتج المتوقع

ولّد ملف بيانات نموذجية:

```bash
python -c "
import json, random
titles = ['Review PR', 'Write docs', 'Fix bug', 'Deploy', 'Refactor']
priorities = ['low', 'medium', 'high']
categories = ['work', 'personal']
tasks = [{'title': random.choice(titles), 'priority': random.choice(priorities), 'category': random.choice(categories)} for _ in range(40)]
with open('sample_tasks.json', 'w') as f:
    json.dump(tasks, f, indent=2)
print('Created sample_tasks.json with 40 tasks')
"
```

استورد بشريط تقدّم:

```bash
python task.py import sample_tasks.json
```

```
  Importing 40 tasks from sample_tasks.json...
  Importing: [##########################------] 34/40
```

(الشريط يتحرك أثناء امتلائه.)

```
  Importing: [##############################] 40/40
  Done! imported 40/40 tasks.
```

التشغيل التجريبي (dry run) يعرض ما سيحدث دون حفظ:

```bash
python task.py import sample_tasks.json --dry-run
```

```
  Importing 40 tasks from sample_tasks.json...
  Importing: [##############################] 40/40
  Done! would import 40/40 tasks.
```

تُتخطّى المهام ذات البيانات غير الصالحة مع تحذير:

```bash
python -c "
import json
bad = [{'title': '', 'priority': 'high'}, {'title': 'Good task', 'priority': 'low'}]
with open('bad_tasks.json', 'w') as f:
    json.dump(bad, f)
"
python task.py import bad_tasks.json
```

```
  Importing 2 tasks from bad_tasks.json...
  Skipped: ? — Title cannot be empty or whitespace.
  Importing: [##########################------] 2/2
  Done! imported 1/2 tasks.
```

### استكشاف الأخطاء وإصلاحها

**شريط التقدّم لا يتحرك.** `sys.stdout.write("\r...")` يعمل فقط إذا كان stdout طرفية. إذا كنت تعمل في لوحة مخرجات IDE أو تنقل إلى ملف، يُعامل حرف `\r` كحرف حرفي ويظهر الشريط في أسطر منفصلة. شغّل من طرفية حقيقية.

**نص شريط التقدّم يتداخل مع المخرجات السابقة.** إذا طبعت شيئًا بعد استدعاء `update()` وقبل `finish()`، يختلط سطر شريط التقدّم بالمخرجات الجديدة. استدعِ دائمًا `finish()` قبل طباعة أي شيء آخر.

**الاستيراد أسرع من أن تَرى شريط التقدّم.** للملفات الصغيرة، ينتهي الاستيراد فورًا. لرؤية الشريط يتحرك في الاختبار، أضف `time.sleep(0.02)` داخل حلقة الاستيراد. لا تترك النوم في كود الإنتاج.

**عدّادات شريط التقدّم غير صحيحة.** `min()` في `update()` يمنع الشريط من تجاوز 100%. إذا كان العدد خاطئًا، تحقق من أن `len(new_tasks)` يطابق عدد العناصر في الحلقة.

### قائمة التحقق

- `python task.py import sample_tasks.json` يعرض شريط تقدّم متحركًا يمتلئ من اليسار إلى اليمين.
- يصل الشريط إلى `[##############################]` عند الإكمال.
- `--dry-run` يستورد دون حفظ في `tasks.json`.
- المهام غير الصالحة في ملف الاستيراد تُتخطّى مع تحذير، ويعكس العدّاد الاستيرادات الصالحة فقط.
- شريط التقدّم لا يترك حروف `\r` ضائعة أو أسطرًا جديدة زائدة.
- `python task.py import nonexistent.json` يُنتج خطأ واضحًا عن ملف غير موجود.

### سؤال سقراطي

لماذا يستخدم شريط التقدّم `\r` (إرجاع العربة) بدلًا من طباعة سطر جديد لكل تحديث؟ كيف ستبدو المخرجات لو طبعت 40 سطرًا منفصلًا بدلًا من الكتابة فوق سطر واحد؟

## التحديات

<details>
<summary><strong>التحدي 1: علّم المهام كمكتملة</strong></summary>

أضف أمرًا فرعيًا `done` يأخذ فهرس مهمة ويعلّمها كمكتملة. حدّث `cmd_list` لعرض علامة صح أو خط يتوسط النص للمهام المكتملة. تعامل مع الحالات الحدّية: المهام المكتملة بالفعل، والفهارس غير الصالحة.

</details>

<details>
<summary><strong>التحدي 2: مواعيد الاستحقاق واكتشاف التأخير</strong></summary>

أضف علمًا `--due` إلى الأمر الفرعي `add` يقبل سلسلة تاريخ (YYYY-MM-DD). عند عرض المهام، أبرز المهام المتأخرة باللون الأحمر والمهام المستحقة اليوم باللون الأصفر. استخدم `datetime.strptime` لتحليل التواريخ ومقارنتها باليوم الحالي.

</details>

<details>
<summary><strong>التحدي 3: مخرجات المساعدة الملوّنة</strong></summary>

تجاوز منسّق المساعدة الافتراضي لـ `argparse` لإنتاج نص مساعدة ملوّن. يجب أن تظهر الأوامر الفرعية بالسماوي، والأعلام الاختيارية بالأصفر، والأوصاف باللون الافتراضي. يتطلب هذا كتابة فئة فرعية مخصصة من `argparse.HelpFormatter`.

</details>

## أهداف إضافية

- [ ] أضف أمرًا فرعيًا `stats` يعرض عدّادات المهام حسب الأولوية والتصنيف.
- [ ] نفّذ تحرير المهام: `task edit 3 --title "New title" --priority low`.
- [ ] ابنِ أمرًا `task export --format csv` يكتب المهام إلى ملف CSV.
- [ ] أضف توليد إكمال الـ shell لـ bash وzsh.
- [ ] نفّذ أمرًا `task log` يعرض سجلًا لعمليات الإضافة/الإزالة.

## ما بنيته للتو

إطار عمل CLI قابل لإعادة الاستخدام في Python خالص: توجيه أوامر فرعية بـ `argparse`، ومخرجات طرفية ملوّنة باستخدام رموز ANSI، وتحقق من المدخلات برسائل خطأ واضحة، ودعم ملف إعدادات JSON، وشريط تقدّم للعمليات المجمّعة. كل قطعة تستخدم المكتبة القياسية فقط — لا Click، لا Typer، لا تبعيات خارجية.

الأنماط هنا تتوسع مباشرة إلى أدوات الإنتاج. أوامر `argparse` الفرعية هي كيف تنظّم `pip` و`git` و`docker` واجهات CLI الخاصة بها. التحقق من المدخلات عند الحدود يمنع البيانات السيئة من الوصول إلى طبقة التخزين. ملفات الإعدادات تفصل تفضيلات المستخدم عن الكود. مؤشرات التقدّم تحوّل العمليات المعتمة إلى شفافة. بفهمك هذه اللبنات، يمكنك بناء أي أداة CLI — ومعرفة *لماذا* يوجد كل جزء.

## إلى أين تذهب من هنا

- **انتقل إلى Click أو Typer.** الآن بعد أن فهمت الآليات الخام، استكشف كيف تؤتمت الأطر الأعلى مستوى تحليل الوسائط والتحقق وتوليد المساعدة. ستقدّر ما تفعله لأنك بنيته يدويًا.
- **أضف خلفية قاعدة بيانات.** استبدل ملف JSON بـ SQLite للوصول المتزامن والاستعلامات وأداء أفضل في قوائم المهام الكبيرة.
- **ابنِ نظام إضافات.** حمّل أوامر فرعية إضافية من ملفات Python في دليل `plugins/`، على غرار النسخة الأصلية من هذا المشروع.
- **أضف وضعًا تفاعليًا.** أمر `task interactive` يقرأ الأوامر في حلقة — مثل REPL — دون إعادة تشغيل العملية في كل مرة.
- **اكتب اختبارات.** استخدم `unittest` أو `pytest` لاختبار كل أمر فرعي باستدعاء دوال المعالجة مباشرة مع مساحات أسماء `argparse` مزيفة.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح.