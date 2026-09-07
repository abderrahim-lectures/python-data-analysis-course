---
title: "متتبع الوقت"
description: "تتبع الوقت المُنفق على المهام مع التقارير والفواتير وتحليلات الإنتاجية."
difficulty: "beginner"
estimatedMinutes: 45
tags: ["cli", "csv", "productivity"]
learningObjectives:
  - Model a time entry and persist entries to CSV
  - "Track a session with start and stop timestamps"
  - Compute durations from two timestamps
  - "Report daily and weekly totals"
  - Summarize time spent by task
prerequisites:
  - "Python basics (functions, lists, dictionaries)"
  - "Comfort with date and datetime basics"
  - "Optional: a little experience running scripts from the terminal"
---

# 🛠️ ⏱️ اعِد متتبع وقت

لا أحد يعرف أين يذهب يوم العمل حتى يُسجّله. يبني هذا المشروع متتبع وقت صغير: ابدأ جلسة، وعمل، وأوقفها، وتصل الدقائق إلى CSV؛ أضف إدخالًا يدويًا، ثم اسحب تقارير يومية وأسبوعية وملخص "أعلى 3 مهام". مكتبة معيارية نقية فقط — فئات البيانات، `csv`، و `datetime` — فستتعلم إيقاع load/append/save وحساب الطوابع الزمنية الحقيقية، وستنتهي بأداة تُجيب على "أين يذهب وقتي فعلًا؟"

يُفترض أساسيات بايثون ومعرفة `datetime` الأساسية — لا شيء beyond ذلك. هذا اختياري وغير مُقيَّم؛ راجع [المشاريع الواقعية](/docs/projects) للقائمة الكاملة المتنامية.

## 🎯 ما ستفعله

1. نمذجة إدخال وقت وتخزين قائمة الإدخالات بـ CSV.
2. بدء وإيقاف جلسة، وحساب مدتها تلقائيًا.
3. إضافة إدخال يدوي وسرد العمل الأخير.
4. الإبلاغ عن الإجماليات اليومية والأسبوعية.
5. ملخص أين ذهب الوقت، حسب المهمة.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي — والصادق. غاية متتبع الوقت هي *التدوين مع ساعتك الحقيقية*، وكلاهما يحتاج قرصًا و `datetime.now()` الذي يعني شيئًا. شغّله على جهازك.

**Google Colab و Kaggle Notebooks و Binder** تشغّل كل خلايا الكود جيدًا (مكتبة معيارية نقية)، والدفتر يُكرّر كل خطوة بمثال مُخمّل. التنبيه الصادق: نظام ملفات الدفتر المؤقت وساعة الحُجر يُagnانه مسار جرّب — ملف `*sessions*` لن ي survives، و `datetime.now()` في الدفتر لا يزال ساعة حقيقية إذا أردت. استخدم الشارات لرؤية المنطق، وانتقل إلى `uv` المحلي للأداة التي تثق بها لأسبوعك.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/time-tracker/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/time-tracker/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Ftime-tracker%2Fnotebook.ipynb)

## الإعداد

أنشئ المشروع. يستخدم المتتبع المكتبة المعيارية فقط، فلا شيء لتثبيته.

```bash
uv init time-tracker
cd time-tracker
```

```bash
uv run python -c "import csv, json; from datetime import datetime; print('ok')"
```

`csv` هو طبقة التخزين — ملف `entries.csv` مقروء يمكن لـ Excel أو أي محرر نصوص فتحه. `json` غير مطلوب هنا بالضبط، لكنه يظهر في أمثلة الدفتر لبيانات كإعدادات، و `datetime` هو الوحدة التي تحوّل لحظتي حائط إلى "دقائق عمل".

**✅ قائمة التحقق**

- ✅ `uv init time-tracker` أنشئ مجلدًا بملف `pyproject.toml`.
- ✅ فحص الاستيراد طبع `ok` — صفر حزم مُضافة.

## الخطوة 1: نمذجة إدخال وقت وتخزينه بـ CSV

كل أمر في هذه الأداة يقرأ ويكتب إلى التخزين نفسه. تحتاج أولًا شكلًا لإدخال — مهمة، لحظة بدء، لحظة نهاية اختيارية، ومدة محسوبة — مع زوج load/save حول ملف CSV.

### 1.1 أنشئ فئة `Entry` وتخزين CSV

**👟 تلميح البداية :** حدد فئة `Entry` بـ `id`، `task`، `start`، `end`، `minutes`؛ ثم احمّل عبر `csv.DictReader` واحفظ عبر `csv.DictWriter` مع `asdict`.

```python
# tracker.py
import csv
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path

FILE = "entries.csv"
FIELDS = ["id", "task", "start", "end", "minutes"]

@dataclass
class Entry:
    id: int
    task: str
    start: str        # ISO-like: "2026-09-06 09:15" or "manual"
    end: str = ""
    minutes: int = 0

def load_entries() -> list[Entry]:
    """Load all entries from entries.csv, or [] if the file doesn't exist."""
    if not Path(FILE).exists():
        return []
    with open(FILE, newline="") as f:
        return [Entry(**row) for row in csv.DictReader(f)]

def save_entries(entries: list[Entry]) -> None:
    """Write all entries to entries.csv."""
    with open(FILE, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(asdict(e) for e in entries)

print(load_entries())
```

`csv.DictWriter` مع `fieldnames=FIELDS` يكتب صف رأس جدير بـ `csv.DictReader` يربطه لكل صف لاحق — فيوثّق الملف المخطط نفسه، و `Entry(**row)` يُعيد بناء الكائنات بدون تحليل نص يدوي. `asdict(e)` يُحوّل كل فئة بيانات إلى قاموس عادي، وهو ما يريده `writerows` بالضبط. تخزين الطوابع كنصوص شبيهة بالـ ISO (`"2026-09-06 09:15"`) يُبقي الملف قابلاً للبحث ويرتب أبجديًا — الترتيب الزمني مجاني حتى تحتاج الخطوة 4 تحليلًا حقيقيًا.

**🎯 الناتج المتوقع :** `[]` على مشروع جديد — قائمة إدخالات فارغة، بدون انهيار.

**🩹 إذا لم يعمل :** إذا أعاد `csv.DictReader` صفوفًا فارغة، فصف الرأس من `writeheader()` مفقود في المفاتيح غير موجودة. إذا ألقى `Entry(**row)` خطأ `TypeError`، فصف محفوظ يفتقد أحد خمسة `FIELDS`. إذا وصلت الأرقام كنصوص (`id: "1"`)، فهذا عادي لـ CSV — يمكن تحويل `int` عند الاستخدام أو عبر خطوة `Entry(**{...cast...})`.

### 1.2 تحقق من التخزين

**✅ قائمة التحقق**

- ✅ `uv run python tracker.py` طبع `[]` في تشغيل جديد.
- ✅ حفظ `Entry` واحد، ثم `load_entries()`، يُعيد الحقول الخمسة سليمة.
- ✅ يمكنك تسمية ما يفعله `asdict(e)` ولماذا يهم `fieldnames`.

**🤔 سؤال (أسئلة) socrates)**

- يُحفظ CSV الـ `end` كنص فارغ للجلسة الجارية. لماذا هذا تمثيل *أفضل* من تخزين علامة كـ `-1` لـ "لا يزال يعمل"، وماذا ي免除 في الخطوة 4 إذا تسلّلت علامة؟
- `writerows(asdict(e) for e in entries)` يكتب كل إدخال، في كل مرة. ما السيناريو الدقيق الذي يخسر فيه هذا النهج الكامل البيانات، وماذا ستغيّر للإضافة بدلاً من ذلك؟

## الخطوة 2: بدء وإيقاف جلسة

قلب متتبع الوقت: `start` يضع طابعًا لحظيًا على الإدخال؛ `stop` يجد الجلسة الجارية، يضع طابع النهاية، ويحسب المدة.

### 2.1 اكتب `start_task`، `stop_active`، و `compute_minutes`

**👟 تلميح البداية :** تتبع الوقت الحالي بـ `datetime.now()` واحدة لكل طابع، ابحث عن الإدخال الجاري بمسح `end` الفارغ، واحسب الدقائق كـ `(end - start) // 60s`.

```python
# tracker.py (continued)
def now_str() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M")

def next_id(entries: list[Entry]) -> int:
    return max((e.id for e in entries), default=0) + 1

def start_task(entries: list[Entry], task: str) -> None:
    entries.append(Entry(id=next_id(entries), task=task, start=now_str()))
    save_entries(entries)
    print(f"started #{entries[-1].id}: {task} at {entries[-1].start}")

def compute_minutes(start: str, end: str) -> int:
    start_t = datetime.strptime(start, "%Y-%m-%d %H:%M")
    end_t = datetime.strptime(end, "%Y-%m-%d %H:%M")
    return max(0, int((end_t - start_t).total_seconds() // 60))

def stop_active(entries: list[Entry]) -> None:
    for e in reversed(entries):
        if e.end == "":
            e.end = now_str()
            e.minutes = compute_minutes(e.start, e.end)
            save_entries(entries)
            print(f"stopped #{e.id}: {e.task} ({e.minutes} min)")
            return
    print("nothing is running.")

stop_active(load_entries())
```

`now_str()` يُوحّد ساعة الحائط بنفس صيغة `"%Y-%m-%d %H:%M"` التي اختارتها الخطوة 1، فيتمكن فك الطوابع دائمًا. `stop_active` يمسح القائمة *معكوسة* فيأخذ أحدث جلسة جارية أولًا. السطر الفعال هو `compute_minutes`: `strptime` يُحلّ الطابعين إلى كائنات `datetime` حقيقية، وطرحهما يُعطي `timedelta`، و `.total_seconds() // 60` يحوّل إلى دقائق صحيحة — مع `max(0, ...`) كحرس حتى لا تُنتج الساعة التي يُزيّفها يدويًا وقتًا سالبًا.

**🎯 الناتج المتوقع :** في تشغيل جديد `nothing is running.` بعد `start_task(load_entries(), "Learn dataclasses")` ثم `stop_active(...)`، سطر `stopped #1: Learn dataclasses (N min)` حيث N هو الدقائق الحقيقية المنقضية.

**🩹 إذا لم يعمل :** إذا ألقى `strptime` خطأ `ValueError`، فطابع محفوظ ليس بصيغة `%Y-%m-%d %H:%M` (الأشهر مقابل أسماء الأشهر هو التطابق الكلاسيكي). إذا أبلغ الإيقاف `0 min` رغم مرور وقت حقيقي، فقد جاء الطابعان من استدعاء `now_str()` نفسه — كل طابع يجب أن يستدعيها منفصلًا. إذا توقف `reverse` scan عن الجلسة الخطأ، ف `end` في الإدخال المكتمل ليس بالضبط `""`؛ الجلسات الأقدم تحتاج تصفية أو الحلقة يجب أن تفحص الإدخال *الأحدث* أولًا.

### 2.2 تحقق من بدء/إيقاف

**✅ قائمة التحقق**

- ✅ بدء ثم إيقاف يُدوّر `start` و `end` و `minutes` موجبة في CSV.
- ✅ بدء جلستين وإيقاف مرة واحدة يترك بالضبط إدخالًا جاريًا واحدًا.
- ✅ `stop_active` على قائمة مُوقفة بالكامل تطبع `nothing is running.`

**🤔 سؤال (أسئلة) socrates)**

- `start_task` يرفض شيئًا — يمكنك بدء جلسة ثانية أثناء جلسة جارية. ماذا يحدث لمسح `stop_active` إذا بدأ مستخدم جلستين وأوقف مرة واحدة، وما القاعدة التي ستُضيفها عند بدء الجلسة لمنعه؟
- تستخدم المدة دقائق كاملة، وتقطع الثواني (`// 60`). عندما تكون الجلسة 2 دقيقة 59 ثانية، ماذا يدّعي التقرير — هل هذا خلل تقريب أم تصميم معقول لمتتبع بشري؟

## الخطوة 3: أضف إدخالات يدويًا واعرضها

الجلسات تُنسى. تضيف هذه الخطوة مسار الإدخال اليدوي — `add` تتيح لك تسجيل مهمة ودقائق مباشرة، مع `start="manual"` — وعرض `list` يُظهر إدخالاتك الأخيرة.

### 3.1 اكتب `add_manual` و `list_entries`

**�� تلميح البداية :** ابنِ `Entry` بـ `minutes` مُقدّمة و `start="manual"` (علامة مقصودة)، واعرض الإدخالات مرتبة من الأحدث بتنسيق مقروء سطر واحد.

```python
# tracker.py (continued)
from datetime import timedelta

def add_manual(entries: list[Entry], task: str, minutes: int) -> None:
    entries.append(Entry(id=next_id(entries), task=task,
                         start="manual", minutes=int(minutes)))
    save_entries(entries)
    print(f"added #{entries[-1].id}: {task} ({minutes} min)")

def list_entries(entries: list[Entry], n: int = 8) -> None:
    recent = sorted(entries, key=lambda e: e.id, reverse=True)[:n]
    for e in recent:
        when = e.start[:10] if e.start != "manual" else "manual"
        marker = f"{e.minutes:>4} min" if e.minutes else "running"
        print(f"#{e.id:>3}  {marker:>7}  {e.task:<24} {when}")

add_manual(load_entries(), "Write tracker docs", 25)
list_entries(load_entries())
```

`start="manual"` علامة مقصودة — تُعلّم إدخالًا *بدون* ساعة جلسة حقيقية، والخطوة 4 ستعمل فرعًا عليها. تخزين `minutes` بسيط للإدخالات اليدوية هو المساواة الصادقة: سجّلت الرقم مباشرة، فلا حساب تواريخ لإعادته. ترتيب `e.id` تنازليًا يُعطيك ترتيب من الأحدث مجانًا (ids تصاعدية)، وعمود التنسيق `{e.minutes:>4}` يُحاذي الأرقام ليمكن قراءة قائمة مختلطة `running`/`25 min` بوضوح.

**🎯 الناتج المتوقع :** `added #1: Write tracker docs (25 min)`، ثم إخراج `list` بـ `25 min` ظاهرًا وعلامة `manual` في عمود التاريخ.

**🩹 إذا لم يعمل :** إذا ألقى `int(minutes)` خطأ على `"25"` مقابل `25`، فقد مرّر الكود المستدعي نصًا — حوّل مرة واحدة عند الحد. إذا أظهرت الإدخالات اليدوية `0 min`، فقد نُفذ `int` cast قبل تعيين فئة البيانات. إذا لم يكن السرد من الأحدث، فقد عُكس مفتاح `reverse=True`.

### 3.2 تحقق من الإدخال اليدوي والسرد

**✅ قائمة التحقق**

- ✅ `add_manual(...)` يُحوّل إدخالًا بـ `start="manual"` والدقائق الصحيحة.
- ✅ `list_entries` يعرض الإدخالات اليدوية والتوقيتية في عرض مقروء واحد.
- ✅ القص إلى `n=3` لا يُلقى خطأ على ملف بـ إدخال واحد.

**🤔 سؤال (أسئلة) socrates)**

- الإدخال اليدوي ليس له بداية/نهاية، لكنه يُشارك نوع `Entry`. ما منطق التقارير الذي يصبح *أسهل* بسبب إعلان الإدخالات اليدوية نفسها بـ `"manual"`، وما الذي يمكن أن ي仍旧 خطأ إذا لم تتحقق من تلك العلامة أبدًا؟
- `list_entries` يعرض `running` عندما يكون minutes==0. هل هذه العلامة موثوقة — ومتى سيكون لإدخال مشروع بالضبط 0 دقائق أيضًا؟

## الخطوة 4: أبلغ عن الإجماليات اليومية والأسبوعية

حوّل التقارير الإدخالات الخام إلى الملخص الذي يقرأه تدقيق الوقت فعلًا: كم دقيقة اليوم، وهذا الأسبوع. الانضباط الجوهري — تخطّ `"manual"` عند التقسيم بالتواريخ — يُعلّم مباشرة لأن البيانات الحقيقية لن تكون دائمًا نظيفة.

### 4.1 اكتب التقارير اليومية والأسبوعية

**�� تلميح ال Başkanlığı :** للتقارير المبنية على التاريخ، ا حلّ كل `start` حقيقي، واجمع الدقائق حسب التاريخ (يومي) أو حسب ISO `(year, week)` (أسبوعي)؛ أبقِ الإدخالات اليدوية خارج两者.

```python
# tracker.py (continued)
from collections import defaultdict

def daily_total(entries: list[Entry]) -> dict:
    total = defaultdict(int)
    for e in entries:
        if e.start == "manual":
            continue
        day = datetime.strptime(e.start, "%Y-%m-%d %H:%M").date()
        total[day] += e.minutes
    return dict(total)

def weekly_total(entries: list[Entry]) -> dict:
    total = defaultdict(int)
    for e in entries:
        if e.start == "manual":
            continue
        day = datetime.strptime(e.start, "%Y-%m-%d %H:%M").date()
        y, w, _ = day.isocalendar()
        total[(y, w)] += e.minutes
    return dict(total)

for day, minutes in sorted(daily_total(load_entries()).items()):
    print(day.isoformat(), minutes, "min")
print("---")
for (y, w), minutes in sorted(weekly_total(load_entries()).items()):
    print(f"{y}-W{w:02d}", minutes, "min")
```

`if e.start == "manual": continue` في أعلى كل دالة هو التصميم: `start` في الإدخال اليدوي هو العلامة، لا التاريخ، فيُلقي التحليل — تخطّيه يجعل التقرير متينًا وصادقًا (الدقائق لا تزال محسوبة في مكان آخر، في ملخص المهام الخطوة 5). `defaultdict(int)` يجعل "أضف دقائق إلى تاريخ قد لا يكون ظاهرًا" سطرًا واحدًا بدلاً من رقصة `get`. `day.isocalendar()` يُعيد `(ISO-year, ISO-week, weekday)` — التجميع على الأولين هو الطريقة القياسية لقول "هذا الأسبوع" عبر حدود السنة.

**🎯 الناتج المتوقع :** صف واحد لكل تاريخ جلسة حقيقية وواحد لكل أسبوع ISO، دقائق مُجمّعة — مع غياب الإدخالات اليدوية من الجدولين، وبدون `ValueError`.

**🩹 إذا لم يعمل :** إذا حطّ إدخال `Manual` التقرير، فحرس `continue` مفقود أو يفحص `e.keyword` مختلف الإملاء عن `"manual"`. إذا اختفى إجمالي أسبوع في ليلة رأس السنة، فحدود `day.isocalendar()` `(y, w)` لا تتوافق مع السنة التقويمية — هذه غرابة ISO القياسية، لا خلل. إذا اجتمعت كل شيء في يوم ضخم واحد، ف `day.isocalendar()` لم يُستدعِ وانهار التجميع على كامل المötuple `(y, w)`.

### 4.2 تحقق من التقارير

**✅ قائمة التحقق**

- ✅ الجداول اليومية والأسبوعية تطبع بدون انهيار، الإدخالات اليدوية مستبعدة.
- ✅ مجموع جلسات يوم معين يطابق ما كتبته.
- ✅ يمكنك تفسير三位ية `isocalendar()` `(year, week)` ولماذا "أسبوع" غامض.

**🤔 سؤال (أسئلة) socrates)**

- تحذف هذه التقارير الإدخالات اليدوية تمامًا. لماذا هذا خيار *أسوأ* لتدقيق وقت حقيقي من عرضها تحت دلو صريح `(manual)` — وماذا ستطبع لجعل الحذف مرئيًا؟
- جلسة تبدأ الإثنين 23:50 وتنتهي الثلاثاء 00:40 تُقسم بـ **وقت البداية إلى الإثنين**. أي تقارير تستحق القسمة بالدقيقة عبر الأيام، ولماذا هذا يهم فقط في دقة يومية؟

## الخطوة 5: ابنِ ملخص المهام الأعلى ومُوجّه CLI

تُجيب الميزة الأخيرة عن السؤال الذي بدأ به المشروع: *أين ذهب وقتي؟* — مع مُوجّه أوامر صغير حتى تصل كل دالة من الطرفية بكلمة واحدة.

### 5.1 اكتب `summarize` ومُوجّه `main`

**�� تلميح ال Başkanlığı :** اجمع الدقائق حسب المهمة عبر كل الإدخالات (بما فيها اليدوية — عمل حقيقي)، ووجّه `start` / `stop` / `add` / `list` / `daily` / `weekly` / `summary` من `sys.argv`.

```python
# tracker.py (continued)
import sys

def summarize(entries: list[Entry], n: int = 3) -> None:
    by_task = defaultdict(int)
    for e in entries:
        by_task[e.task] += e.minutes
    print("top", n, "tasks by time:")
    for task, minutes in sorted(by_task.items(), key=lambda x: x[1], reverse=True)[:n]:
        print(f"  {minutes:>5} min  {task}")
    print(f"  TOTAL {sum(by_task.values())} min across {len(by_task)} tasks")

def main() -> None:
    args = sys.argv[1:]
    entries = load_entries()
    cmd = args[0] if args else "list"
    if cmd == "start":
        start_task(entries, args[1])
    elif cmd == "stop":
        stop_active(load_entries())
    elif cmd == "add":
        add_manual(entries, args[1], int(args[2]))
    elif cmd == "list":
        list_entries(entries)
    elif cmd == "daily":
        for day, m in sorted(daily_total(entries).items()):
            print(day.isoformat(), m, "min")
    elif cmd == "weekly":
        for (y, w), m in sorted(weekly_total(entries).items()):
            print(f"{y}-W{w:02d}", m, "min")
    elif cmd == "summary":
        summarize(entries)
    else:
        print("commands: start <task> | stop | add <task> <min> | list | daily | weekly | summary")

if __name__ == "__main__":
    main()
```

`summarize` يُ counted الإدخالات اليدوية قصدًا إلى جانب التوقيتية — على خلاف تقارير التاريخ — لأن "المهمة استغرقت 125 دقيقة إجمالاً" صحيح سواء جاءت من ساعة إيقاف أو ملاحظة. المُوجّه رفيع عميقًا: كل أمر سطر واحد، كل منها يُعيد استخدام `entries` المحملة. لاحظ أن `stop_active(load_entries())` يُعيد التحميل بدلاً من تغيير نسخة المستدعي — تناظر مقصود حتى يرى "إيقاف" أحدث حالة على القرص دائمًا، ومثال جيد لماذا يُعيد المُوجّه التحميل عند كل حد أمر.

**🎯 الناتج المتوقع :** `uv run python tracker.py summary` يطبع المهام الأعلى مع الدقائق والإجمالي؛ كل أمر آخر أعلاه يعمل بشكل مماثل من shell.

**🩹 إذا لم يعمل :** إذا أظهر `summary` `TOTAL 0` فارغًا، فالملف المحمل ليس له إدخالات أو `e.minutes` يُقرأ كنص — نصوص CSV تحتاج `int()` cast في حلقة الملخص. إذا استهلك `start` بكلمتين مثل `"Learn dataclasses"` `args[1]` فقط، تحتاج `" ".join(args[1:])` للمهام متعددة الكلمات. إذا لم يؤثر `stop` من CLI على الجلسة التفاعلية، فقد تحملان قائمتين مختلفتين — أعد التحميل بعد أي كتابة.

### 5.2 تحقق من المتتبع النهائي

**✅ قائمة التحقق**

- ✅ `uv run python tracker.py summary` يطبع المهام الأعلى والإجمالي.
- ✅ `start` / `stop` / `add` / `list` / `daily` / `weekly` كلها تستجيب من الطرفية.
- ✅ الإدخالات اليدوية تُحتسب في `summary` لكنها مستبعدة من `daily`/`weekly`.
- ✅ سجّلت جلسة حقيقية واحدة وإدخالًا يدويًا واحدًا على الأقل بنفسك.

**🤔 سؤال (أسئلة) socrates)**

- يُعيد المُوجّه التحميل لكل أمر؛ `stop` يُعيده مرتين. ما **خلل البيانات القديمة** الذي سيظهر إذا شارك المُوجّه قائمة واحدة عبر أمرين (مثلاً `add` ثم `list` فورًا)، ولماذا إعادة التحميل لكل أمر هو الحماية الرخيصة ضده؟
- `summarize` يرتّب المهام حسب مجموع الدقائق، فيتفوق جلسة 5 ساعات على ثماني جلسات 30 دقيقة. ماذا سترسم بدلاً من ذلك لعرض *الاستمرارية* بدلاً من الكتلة الخام — وماذا سيتغير لمستخدم يريد两者 معاً؟

## ⚠️ المآزق الشائعة

- **طوابع بصيغ غير متوافقة.** `now_str()` يكتب `%Y-%m-%d %H:%M`؛ إذا استخدم CSV يدوي `%m/%d/%Y`، يُلقي `strptime` خطأ. الإصلاح: ثابت صيغة واحد، يُستخدم من الكاتب وحلّال.
- **طابع مزدوج على جلسة.** استدعاء `now_str()` واحدة واستخدامها لـ `start` و `end` يُنتج جلسة 0 دقيقة بعد وقت منقضي حقيقي. الإصلاح: ضع طابعًا لكل لحظة في لحظتها.
- **إدخالات يدوية بـ `start` يبدو حقيقيًا.** إذا أعادت الإدخالات اليدوية الوقت الحالي بدلاً من `"manual"`، تزعم إجماليات يومية بصمت أن 25 دقيقة وقعت اليوم. الإصلاح: احتفظ بعلامة `"manual"`، لا تاريخ اليوم.
- **عدّ النصوص كأرقام.** CSV يُخرج كل شيء كنصوص؛ `sum(by_task.values())` فوق دقائق نصية يُركّب (`"25" + "10"` = `"2510"`). الإصلاح: حوّل `int()` مرة واحدة عند التحميل أو في `summarize`.
- **قائمة واحدة مشتركة عبر أوامر.** تغيير نفس القائمة في `add` ثم قراءتها في `list` بدون إعادة حفظ/تحميل يُنتج عروض قديمة. الإصلاح: أعد التحميل عند كل حد أمر كما يفعل `main`.

## ما بنيته للتو

متتبع وقت يعمل ويعتمد على CSV: تتبع جلسة بدء/إيقاف بحساب تواريخ حقيقي، وإدخال يدوي، وتقارير يومية وأسبوعية ISO، وملخص مهام أعلى مُوجّه بالكامل عبر CLI بكلمة واحدة. المهارة القابلة للنقل هي *توثيق الواقع بدلاً من تخمينه*: النمط ذاته "ضع طابعًا، احفظ صفًا، اجمع مجموعات" يُغذّي سجلات العادات، وسجلات عمل jira، وتاريخ توصيل الطرود — أي سؤال بشكل "كم، ومتى، ولأي غرض؟"

:::tip[شغّل نسخة أكمل بدون إعداد محلي]
[`examples/time-tracker/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/time-tracker) في دورة الكود نسخة أكمل من الكود أعلاه، بدفتر قابل للتعديل وخيار ملخص يوم بيوم. استنسخها، أو افتح الدورة في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) وشغّلها من هناك.
:::

## إلى أين تذهب من هنا

- أضف `edit <id> <minutes>` حتى تُصحّح جلسة مُنسية في الموضع، مع إعادة استخدام نمط load-modify-save من الخطوة 1.
- اعرض التقرير اليومي كرسم أعمدة نصية (`10 min ██`) حتى تظهر الاتجاهات بلمحة بدون مكتب رسم.
- اقسم الجلسات عبر منتصف الليل حتى يُساهم كتلة 23:50–00:40 في كل يومين — الإصلاح الصادق لسؤال الخطوة 4 السقراطي.
- اكتب الإجماليات الأسبوعية في `report.csv` يمكن لمستند الفاتورة استيراده، واغلق الدورة التي وعدها العرض أصلاً.

## شارك مشروعك مع الفصل

بنيت شيئًا تفتخر به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع قدمها طلاب آخرون — و README يحتوي دليلًا كاملًا ومناسبًا للمبتدئين لإضافة مشروعك عبر **طلب سحب**، حتى لو لم تستخدم git من قبل: تفرّع المستودع، وإنشاء فرع، وعمل commit لملفاتك، وفتح الطلب، خطوة بخطوة. لا يُفترض خبرة git مسبقة.

أهلاً بكتابة بايثون خارج المتصفح. 🎓
