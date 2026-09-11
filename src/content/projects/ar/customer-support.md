---
title: "لوحة إدارة الدعم الفني"
description: "أدر تذاكر الدعم مع التوجيه وتتبع SLA والاستجابات الجاهزة ومقاييس الرضا."
difficulty: "beginner"
estimatedMinutes: 55
tags: ["cli", "csv", "dataclasses", "stdlib"]
prerequisites:
  - "أساسيات Python (متغيّرات، حلقات، دوال، قواميس)"
learningObjectives:
  - "نمذجة التذاكر كفئات dataclass وترتيب طابور بأولوية"
  - "توجيه التذاكر إلى عملاء الدعم حسب تطابق المهارة وحجم العمل"
  - "تتبع زمني الاستجابة والحل مقابل حدود SLA من سجلات CSV"
  - "حساب درجات رضا لكل عميل دعم من بيانات الاستطلاع"
  - "طباعة تقرير ملخص دعم مجمّع"
---

# 🎧 ابنِ لوحة دعم العملاء

حقيقة فريق الدعم تصل كتيار من أحداث *غير مرتبة* — شكوى فواتير ملتهبة، "كيف أعيد تعيين كلمة المرور" الخاملة، أمنية ميزة — وكل حِرفة أدوات الدعم هي فرض النظام على ذلك التيار: أي تذكرة تحصل على عميل دعم أولًا، وأي عميل دعم قادر أصلًا *على* معالجتها، وما إذا كان الفريق يجيب ضمن وعد زمن استجابته، وما إذا كان العملاء راضين فعلًا. يبني هذا المشروع المحرك خلف لوحة دعم — طابور أولويات للتذاكر، وتوجيهًا قائمًا على المهارة والحمل، وكشف مخالفات SLA مقيسًا بالساعات من ملف سجل حقيقي، وملخص رضا — كل ذلك مُخرَجًا في تقرير طرفية واحد.

هذا يفترض Python 101 — دوال وقواميس وقوائم واستيراد وحدة `csv` القياسية. لا يُشترط شيء من تحليل البيانات. إنه اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. نمذج التذاكر كفئات dataclass مع تعداد أولوية واسحب الأعلى أولوية من طابور.
2. وجّه كل تذكرة إلى عميل الدعم الحر الذي تطابق مهاراته موضوعها، وتراجع إلى الأقل انشغالًا.
3. قِس زمني الاستجابة والحل من سجل CSV وعلّم كل مخالفة SLA.
4. احسب متوسطات الرضا لكل عميل دعم من CSV استطلاع.
5. اطبع تقريرًا واحدًا مجمّعًا: المخالفات + رضا العملاء الدعم في قراءة واحدة.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الموصى به — يقرأ هذا المشروع ملفات CSV حقيقية من القرص، والكله مكتبة قياسية، لذا فالإعداد أمر واحد.

**GitHub Codespaces** بديل بلا إعداد: افتح [مستودع الدورة كاملًا في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython مثبّتة بالفعل) وشغّل نفس الأوامر من طرفية متصفح.

**Google Colab أو Kaggle Notebooks أو Binder** تعمل جيدًا لمنطق الطابور والتوجيه — دفتر الملاحظات في [`examples/customer-support/notebook.ar.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/customer-support/notebook.ar.ipynb) يشغّل كل دالة على ملفات CSV عينات مرفقة. القيد الصادق: ملفات CSV في دفتر الملاحظات عينات ثابتة، بينما النسخة المحلية تتيح لك تغذيتها *بسجلات دعمك*.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/customer-support/notebook.ar.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/customer-support/notebook.ar.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcustomer-support%2Fnotebook.ar.ipynb)

## الإعداد

`uv` أداة واحدة تحل محل سلسلة "ثبّت Python، ثم pip، ثم أداة بيئة افتراضية" — وهذا المشروع بلا استيرادات خارجية، لذا فالإعداد خطوة واحدة فعلًا.

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
uv init customer-support
cd customer-support
```

**✅ قائمة التحقق**

- ✅ يطبع `uv --version` رقم إصدار.
- ✅ يوجد `customer-support/` مع `pyproject.toml`.
- ✅ ينجح `python -c "import csv"` — لا حزم خارجية مطلوبة.

## الخطوة 1: نمذج التذاكر وابنِ طابور أولويات

الطابور الذي يخدم التذاكر بترتيب *الوصول* طابور جيد لكن طابور دعم سيئ: مشكلة فواتير عاجلة كانت ستجلس خلف ثلاث طلبات ميزات. الإصلاح ترتيب أولوية — العاجل فوق العالي فوق المتوسط فوق المنخفض، مع *ترتيب وصول داخل نفس الأولوية* — وهو بالضبط ما يمنحك إياه الفرز بقيمة `Priority` معكوسة.

### 1.1 اكتب نموذج التذكرة والطابور

**👟 تلميح البداية :** عرّف تعداد `Priority` (`IntEnum`، لذا يفرز عدديًا)، وفئة `Ticket` dataclass، و`SupportQueue` تُلحق عند `add` وتسحب أعلى `priority` عند `next`:

```python
# tickets.py
from dataclasses import dataclass
from enum import IntEnum

class Priority(IntEnum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    URGENT = 4

@dataclass
class Ticket:
    ticket_id: int
    customer: str
    subject: str
    priority: Priority
    assigned_to: str | None = None

class SupportQueue:
    def __init__(self) -> None:
        self._items: list[Ticket] = []

    def add(self, ticket: Ticket) -> None:
        self._items.append(ticket)

    def next(self) -> Ticket | None:
        if not self._items:
            return None
        self._items.sort(key=lambda t: t.priority, reverse=True)
        return self._items.pop(0)

    def __len__(self) -> int:
        return len(self._items)

if __name__ == "__main__":
    queue = SupportQueue()
    queue.add(Ticket(1, "Ana", "Can't log in", Priority.MEDIUM))
    queue.add(Ticket(2, "Bo", "Billing charge", Priority.URGENT))
    queue.add(Ticket(3, "Cam", "Feature idea", Priority.LOW))
    while (ticket := queue.next()) is not None:
        print(f"#{ticket.ticket_id} {ticket.priority.name}: {ticket.subject}")
```

يكسب `IntEnum` الموضع هنا: `Priority.URGENT > Priority.LOW` يعمل *لأنه* عدد صحيح تحت الغطاء، لذا يرتّب `sort(key=lambda t: t.priority, reverse=True)` القائمة كلها بتعبير واحد — بلا مقارن مخصص. يزيل `pop(0)` داخل `next` عمدًا التذكرة المخدومة، لذا حلقة اللوحة "تستمر في الخدمة" حتى تصبح فارغة: نمط `while (ticket := queue.next()) is not None` هو الحارس الذي يوقف الحلقة عندما يُرجع الطابور `None` أخيرًا.

**🎯 الناتج المتوقع :**

```
#2 URGENT: Billing charge
#1 MEDIUM: Can't log in
#3 LOW: Feature idea
```

**🩹 إذا لم يعمل :** إذا خرجت LOW أولًا، فـ `reverse=True` مفقود — بدونه يفرز الرقم الأصغر أولًا. إذا اختفت التذاكر بين التشغيلات، تذكر أن `next()` *إتلافية*: تزيل التذكرة، لذا طابور فارغ لا يطبع شيئًا عند تكرار الحلقة.

### 1.2 تحقّق من الطابور

**✅ قائمة التحقق**

- ✅ خدمة طابور العينات تعطي `#2` ثم `#1` ثم `#3`، بهذا الترتيب.
- ✅ ينقص `len(queue)` بمقدار واحد بالضبط بعد كل استدعاء `next()`.
- ✅ يُرجع `next()` لطابور فارغ `None` بدل رفع `IndexError`.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تتشارك تذكرتان `Priority.URGENT`. هل يرتب الكود الحالي بالأولوية ويسحب `index 0` — هل يضمن ذلك *ترتيب الوصول* بينهما، أم شيء آخر يعيد كتابة المواضع؟ اقرأ زوج الفرز+السحب وقرر.
- يخزن الطابور التذاكر في قائمة عادية ويفرز عند *كل* سحب. لمكتب دعم صغير ذلك مقبول — لكن ما العملية التي تصبح عنق الزجاجة عند 10,000 تذكرة مكدسة، وما بنية البيانات الموجودة بالضبط "لإزالة الأقصى" دون إعادة فرز؟

## الخطوة 2: وجّه التذاكر إلى عميل الدعم الصحيح

يجيب الفرز عن "أي تذكرة أولًا؟"؛ يجيب التوجيه عن "أي *عميل دعم*؟" قيد المجموعة الحقيقي: يجب أن يكون عميل الدعم حرًا (تحت أقصى حمولة) ويفضل *ماهرًا* لهذه التذكرة. البديهية العملية مطابقة نصوص — عد كم مهارة من مهارات عميل الدعم تظهر في موضوع التذكرة ووجّه إلى أفضل عميل دعم حر تطابقًا.

### 2.1 اكتب `Agent` ودالة `assign`

**👟 تلميح البداية :** فئة `Agent` dataclass بقائمة مهارات وعداد تحميل حي، ثم `assign` تُفلتر إلى عملاء الدعم الأحرار، وتُسجّلها بتطابق المهارة مع الموضوع، وتُرجع أفضل تطابق:

```python
# routing.py
from dataclasses import dataclass, field

from tickets import Ticket

@dataclass
class Agent:
    name: str
    skills: list[str] = field(default_factory=list)
    active_tickets: int = 0
    max_work: int = 3

    def is_free(self) -> bool:
        return self.active_tickets < self.max_work

def assign(ticket: Ticket, agents: list[Agent]) -> Agent | None:
    """Route to the best free skill match; returns None only if every
    agent is at max_work."""
    needle = ticket.subject.lower()

    def skill_score(agent: Agent) -> int:
        return sum(1 for skill in agent.skills if skill.lower() in needle)

    free = [a for a in agents if a.is_free()]
    if not free:
        return None
    best = max(free, key=skill_score)
    best.active_tickets += 1
    return best

if __name__ == "__main__":
    agents = [
        Agent("Priya", skills=["billing", "refund"]),
        Agent("Tom", skills=["login", "password"]),
        Agent("Una", skills=["feature"]),
    ]
    subjects = ["Billing charge gone wrong", "Can't log in",
                "New feature idea", "Refund request"]
    for subject in subjects:
        ticket = Ticket(hash(subject) % 1000, "customer", subject, 2)
        agent = assign(ticket, agents)
        print(f"-> {subject!r}: {agent.name if agent else 'no free agent'}")
```

قراران مختبئان في اثني عشر سطرًا. يعد `skill_score` *التداخلات* بدل اشتراط تطابق وسم دقيق، لذا موضوع مثل "Billing charge gone wrong" يسجّل 1 لمهارة `billing` حتى لو اختلفت الكلمات — مطابق متسامح عمدًا لعرض توضيحي، يستحق المراجعة لحظة يهم التطابق الخاطئ. يزداد `active_tickets` عند إسناد تذكرة، لذا يعكس قرار الانشغال/الحرية *الحمل المقبول*، ويلتقط `max(free, key=skill_score)` أفضل تطابق صراحةً تصريحيًا، مع سقوط الروابط لأول عميل دعم حر في القائمة.

**🎯 الناتج المتوقع :**

```
-> 'Billing charge gone wrong': Priya
-> 'Can't log in': Tom
-> 'New feature idea': Una
-> 'Refund request': Priya
```

**🩹 إذا لم يعمل :** إذا وجّهت *كل* تذكرة إلى Priya، فـ `max(free, key=skill_score)` تلتقط أعلى مجموع — تحقق أن `score` يستخدم `in needle`، لا `== needle`. إذا وجّهت تذكرة إلى عميل دعم بلغ `max_work`، فمرشّح `is_free()` ليس في فهم القائمة — عميل الدعم المشغول ليس حتى مرشحًا.

### 2.2 تحقّق من التوجيه

**✅ قائمة التحقق**

- ✅ كل المواضيع العينات الأربعة تُوجَّه إلى عميل الدعم المطابق بالمهارة.
- ✅ جعل `active_tickets` لكل عميل دعم مساويًا `max_work` يجعل `assign` ترجع `None` — حالة "الكل مشغول" تتدهور إلى طابور، لا إلى انهيار.
- ✅ بعد إسناد تذكرة، زاد `active_tickets` لذلك العميل الدعم بمقدار واحد بالضبط.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يعد مطابق المهارات ضربات السلسلة الفرعية. ما الموضوع الحقيقي الذي كان يسجّل إيجابية *كاذبة* لمهارة (تلميح: "password reset" يحتوي "pass") — وما الذي كانت تكلفه إياك استراتيجية مطابقة أدق من الجهد؟
- يزداد `active_tickets` عند الإسناد ولا ينقص في هذا المشروع أبدًا. ما السلوك الذي ينكسر إذا لم تحرر عملاء الدعم أبدًا — وأين في نظام دعم حقيقي كان سيحدث ذلك التنقص؟

## الخطوة 3: تتبع امتثال SLA عبر الزمن

اتفاقيات SLA وعود بحساب ساعات: استجب خلال 4 ساعات، وحُلّ خلال 24. المادة الخام *سجل* — لكل تذكرة، متى فُتحت، متى رد شخص أولًا، متى حُلّت. تحوّل هذه الخطوة نص CSV إلى فروق ساعات وتقارن كلًا مع الوعد.

### 3.1 حمّل السجل وقِس المخالفات

**👟 تلميح البداية :** اكتب ملف عيّنة `support_log.csv` بصف لكل تذكرة، وحمّله بـ `csv.DictReader`، وحوّل الطوابع الزمنية الشبيهة بـ ISO إلى أعداد ساعات عشرية بمساعد صغير، وقارن ساعات `response`/`resolution` مع العتبات:

```python
# sla.py
import csv
from datetime import datetime

LOG = """ticket_id,opened_at,responded_at,resolved_at
1,2026-09-01 09:00,2026-09-01 09:30,2026-09-01 10:00
2,2026-09-01 09:00,,2026-09-01 09:15
3,2026-09-01 09:00,2026-09-01 20:00,
4,2026-09-01 09:00,2026-09-01 09:05,2026-09-02 11:00
"""

def load_activity(path: str = "support_log.csv") -> list[dict]:
    with open(path, newline="") as f:
        return list(csv.DictReader(f))

def hours(ts: str, fmt: str = "%Y-%m-%d %H:%M") -> float | None:
    """Parse a timestamp to hours-since-epoch; None for an empty cell."""
    if not ts.strip():
        return None
    return datetime.strptime(ts, fmt).timestamp() / 3600

def sla_report(log: list[dict], response_sla: int = 4, resolution_sla: int = 24) -> list[str]:
    breaches = []
    for row in log:
        opened = hours(row["opened_at"])
        responded = hours(row["responded_at"])
        resolved = hours(row["resolved_at"])
        if opened is not None and responded is not None and (responded - opened) > response_sla:
            breaches.append(
                f"ticket {row['ticket_id']}: response {(responded - opened):.1f}h > {response_sla}h SLA"
            )
        if opened is not None and resolved is not None and (resolved - opened) > resolution_sla:
            breaches.append(
                f"ticket {row['ticket_id']}: resolution {(resolved - opened):.1f}h > {resolution_sla}h SLA"
            )
    return breaches

if __name__ == "__main__":
    with open("support_log.csv", "w") as f:
        f.write(LOG)
    for breach in sla_report(load_activity()):
        print(breach)
```

سياسة الخلية الفارغة هي استدعاء الصحة الدقيق: `hours("")` يُرجع `None`، وكل مقارنة تحرس بـ `is not None` — التذكرة غير المحلولة `None`، *لا* صفر، مما يعني أنك لا تبلغ أبدًا عن مخالفة "فورية" مزيفة لتذكرة لم يلمسها أحد. تنسيق `.1f` تجميلي لكن ذو معنى: من يقرأ "11.0h" يرى فورًا "أكثر من 4h"، بينما عدد عشري خام مثل `11.000000000000002` يدعو لشحذ ثانٍ بلا داعٍ.

**🎯 الناتج المتوقع :**

```
ticket 3: response 11.0h > 4h SLA
ticket 4: resolution 26.0h > 24h SLA
```

**🩹 إذا لم يعمل :** إذا أبلغت *كل* تذكرة عن مخالفة بقيم ساعات سخيفة، فغالبًا حُلل `hours` الصيغة خطأً و`strptime` بصمت... ليس كذلك — عدم تطابق الصيغة يرفع `ValueError`. إذا لم يخالف شيء حتى للتذكرة 3، تحقق هل يحتوي `LOG` فعلًا `responded_at` للتذكرة 3 بقيمة `2026-09-01 20:00`، وأن الملف أُعيدت كتابته قبل قراءة `load_activity` له.

### 3.2 تحقّق من حساب SLA

**✅ قائمة التحقق**

- ✅ تخالفا مخالفتان بالضبط: استجابة التذكرة 3، وحل التذكرة 4.
- ✅ خلية `responded_at` *الفارغة* للتذكرة 2 لا تنتج مخالفة استجابة — التذكرة غير المُجابة بعد ليست انتهاكًا فوريًا.
- ✅ التحويل: `hours("2026-09-02 11:00") - hours("2026-09-01 09:00")` يساوي `26.0`.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- التذكرة غير المُجابة لها `responded_at=""`، لذا زمن الاستجابة `None` — لكن انتظر، هل التذكرة غير المُجابة *تخالف الآن* أم *غير قابلة للقياس الآن* فقط؟ أي خيار أكثر صدقًا، وما الذي كان سيَدّعي بصمت تنفيذ يعامل الفارغ كـ `0`؟
- يرمّز `sla_report` الوعود كوسيطات افتراضية. ما الذي يتغير في إفادة الدالة إذا حلّق SLA *لكل تذكرة* (الأولوية URGENT تحصل على ساعة، LOW على 24) محل العتبة المفردة — وأي طبقة يجب أن تملك ذلك التخطيط؟

## الخطوة 4: احسب الرضا من الاستطلاعات

لا يقول الإنتاجية شيئًا عن *المشاعر*؛ يقولها رضا العملاء (CSAT) — عادة استطلاع ما بعد التذكرة حيث يقيّم العميل من 1 إلى 5. التجميع الصادق يوسّط لكل عميل دعم بحيث يجيب التقرير عن "حالنا عمومًا" وعن "من يحمل الدرجة" معًا.

### 4.1 حمّل الاستطلاعات ولخّص لكل عميل دعم

**👟 تلميح البداية :** ملف `csat.csv` من صفوف `agent,rating`، محمَّل بـ `csv.DictReader`، ومجمَّع بـ `defaultdict(list)`، ثم موسَّط لكل عميل دعم:

```python
# csat.py
import csv
from collections import defaultdict

SURVEYS = """agent,rating
Priya,5
Tom,4
Priya,4
Una,3
Tom,5
Priya,5
"""

def load_surveys(path: str = "csat.csv") -> list[dict]:
    with open(path, newline="") as f:
        return list(csv.DictReader(f))

def summarize(surveys: list[dict]) -> dict[str, float]:
    per_agent: dict[str, list[int]] = defaultdict(list)
    for row in surveys:
        per_agent[row["agent"]].append(int(row["rating"]))
    return {name: sum(vals) / len(vals) for name, vals in per_agent.items()}

if __name__ == "__main__":
    with open("csat.csv", "w") as f:
        f.write(SURVEYS)
    for agent, avg in summarize(load_surveys()).items():
        print(f"{agent}: {avg:.1f}/5")
```

يزيل `defaultdict(list)` مراسم `if agent not in per_agent: per_agent[agent] = []` كلها: الإلحاق بمفتاح غير موجود ينشئ قائمة تلقائيًا. يحوّل فَهم السطر الواحد في الخروج كل قائمة إلى متوسطها. تحويل `int(row["rating"])` هو مقامرة "ثق بالملف" كلها — يمنحك CSV *سلاسل*، وقسمة سلسلة كانت ستعطّل `sum` عاديًا؛ يحرّك التحويل ذلك الفشل إلى نقطة التحميل حيث يكون مقروءًا.

**🎯 الناتج المتوقع :**

```
Priya: 4.7/5
Tom: 4.5/5
Una: 3.0/5
```

**🩹 إذا لم يعمل :** إذا ظهر `TypeError: unsupported operand type(s) for/: 'int' and 'str'`، فخلية تقييم تفقد تحويل `int(...)`. إذا بدا متوسط Priya خاطئًا، تحقق أن *الأسطر الثلاثة* كلها لاستطلاعها (5، 4، 5) دخلت إلى CSV — سطر مفقود يغيّر المتوسط بصمت.

### 4.2 تحقّق من الرضا

**✅ قائمة التحقق**

- ✅ يُرجع `summarize(load_surveys())` القيمة `{'Priya': 4.666..., 'Tom': 4.5, 'Una': 3.0}`.
- ✅ ملف استطلاع بصف واحد ما زال يعمل (لا قسمة على صفر لمدخل غير فارغ).
- ✅ كل تقييم يُحوَّل إلى `int` *قبل* الحساب — كانت السلسلة `"5"` + `"4"` ستلتحم، لا تجمع.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يجمّع CSAT لكل *عميل دعم*. ما التجميع الآخر الذي قد يريده مدير دعم (لكل طابور، لكل وردية، لكل مجال منتج) — وكم من `summarize` يجب أن يتغير لكل تجميع، أم أنها تعني فعلًا "جمّع بأي عمود واحد"؟
- يكافئ المتوسط الاتساق ويعاقب كل شيء بالتساوي. ماذا يخفي متوسط 3.5 عن فريق من 30 عميل دعم يسجّل نصفهم 5 ونصفهم الآخر 2 — وما التجميع الذي كان سيري ذلك؟

## الخطوة 5: التقرير المجمّع

يعيش كل مقياس حتى الآن في سكربت خاص به. تؤلف الخطوة الأخيرة بينها في القطعة الأثرية التي يقرؤها صاحب المصلحة فعلًا: ملف `report.py` واحد يُبرز مخالفات SLA ورضا عملاء الدعم معًا، لأن فريق دعم يجيب سريعًا لكن يغضب العملاء يحتاج رؤية *الرقمين* في آنٍ واحد.

### 5.1 ألف التقرير

**👟 تلميح البداية :** أعد استخدام كل مُحمّل ومُجمّع بنيتهما — `load_activity` ← `sla_report`، `load_surveys` ← `summarize` — واطبع القسمين برؤوس `===` بسيطة، مرتّبًا عملاء الدعم بالرضا بحيث تُقرأ القائمة من الأعلى إلى الأسفل:

```python
# report.py
from csat import load_surveys, summarize
from sla import load_activity, sla_report

def build_report(log_csv: str = "support_log.csv", csat_csv: str = "csat.csv") -> None:
    print("=== SLA breaches ===")
    breaches = sla_report(load_activity(log_csv))
    print("\n".join(breaches) if breaches else "no breaches - all within SLA")

    print("\n=== CSAT by agent (best first) ===")
    for agent, avg in sorted(
        summarize(load_surveys(csat_csv)).items(),
        key=lambda pair: pair[1],
        reverse=True,
    ):
        print(f"  {agent}: {avg:.1f}/5")

if __name__ == "__main__":
    build_report()
```

كل سطر هنا إعادة استخدام — لا يحتوي التقرير على *منطق أعمال جديد*، عرض فقط. هذا هو التصميم الذي يستحق النسخ: تبقى طبقة التركيب آمنة هشاشةً بامتلاكها فقط "استدعِ الدوال الموجودة، رتّب المخرج". يرتّب `sorted(..., key=lambda pair: pair[1], reverse=True)` بـ *المتوسط*، فهرس `[1]` من كل زوج `(agent, avg)`، مما يبقي العرض "الأفضل أولًا" دون لمس دالة الرضا.

**🎯 الناتج المتوقع :**

```
=== SLA breaches ===
ticket 3: response 11.0h > 4h SLA
ticket 4: resolution 26.0h > 24h SLA

=== CSAT by agent (best first) ===
  Priya: 4.7/5
  Tom: 4.5/5
  Una: 3.0/5
```

**🩹 إذا لم يعمل :** `FileNotFoundError` تعني أن التقرير لا يجد ملفات CSV — شغّله من المجلد حيث كتبتهما الخطوتان 3–4، أو مرّر المسارات (`build_report("logs/support_log.csv", ...)`). إذا كان ترتيب العملاء الدعم أبجديًا لا أفضل-أولًا، فـ `reverse=True` مفقود من `sorted`.

### 5.2 تحقّق من التقرير

**✅ قائمة التحقق**

- ✅ يطبع `uv run python report.py` القسمين بالترتيب أعلاه بالضبط.
- ✅ إزالة وسيط ملف استدعاء `sla_report` وتمرير مسار سجل فارغ يعرض `no breaches`.
- ✅ لا يحتوي `report.py` على أي كود قراءة CSV أو تجميع مكرر — يستورده.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يرتّب التقرير عملاء الدعم الأفضل-أولًا، لكن مديرًا يفرز بهذه الطريقة قد يكافئ الاسم الأعلى دون سؤال *لماذا* تسجّل Una 3.0 — ما حجة أن التقرير يجب أن يطبع أيضًا الحجم (عدد الاستطلاعات) بجوار المتوسط، وماذا يظهر عندما تفعل؟
- يربط `build_report` تحليلين مستقلين بـ `print`. أين ضغط التطور نحو إنتاج *ملف* (JSON/HTML) بدل نص طرفية — وما الذي يبقى نفسه إذا حدث ذلك؟

## ⚠️ المآزق الشائعة

- **إخراج الطرف الخاطئ من الطابور.** `pop(0)` بعد فرز تنازلي صحيح؛ `pop()` (آخر عنصر) بعد فرز *تصاعدي* يخدم الطرف المقابل. كلمة واحدة معكوسة تقلب الفرز رأسًا على عقب بصمت.
- **ترك عملاء الدعم المشغولين في بركة المرشحين.** مرشّح التوجيه `is_free()` ليس اقتراحًا — إزالته يعني توجيه تذاكر إلى عملاء دعم محمّلين فوق طاقتهم ويكذب نظام العبء كله. أبقِ المرشّح داخل `assign`.
- **معاملة الخلايا الفارغة كصفر.** `hours("")` يجب أن تعني "غير مقاس"، لا `0` أبدًا. جمع تذكرة غير مُجابة كحُلّت فورًا يلفّق بيانات SLA مزيفة. حراس `is not None` هم العقد.
- **نِسيان أن CSV يعطي سلاسل.** `row["rating"]` هي `"5"`، لا `5`. تنكسر القسمة والمقارنة حتى تحوّل؛ حوّل وقت التحميل حتى يكون الفشل الواحد مقروءًا.
- **خلط *صيغ* التواريخ.** `%Y-%m-%d %H:%M` و`%Y/%m/%d` كلاهما طابع زمني صالح ومتبادلان غير قابلين للتحليل. وحّد صيغة واحدة في السجل قبل أي `strptime`.

## ما بنيته للتو

محرك لوحة دعم حقيقي: تذاكر منمذجة كبيانات، وطابور أولويات يفرز *ويخدم*، وتوجيه واعٍ بالمهارة والحمولة، وحساب SLA مقيس بالساعات من سجل CSV فعلي، ورضا لكل عميل دعم، وتقرير مركّب واحد — كل ذلك مكتبة قياسية، وكل شيء قابل للتشغيل من طرفية. المهارة القابلة للنقل هي قياس خدمة ضد وعود: أي عملية بجداول زمنية (تسليمات، نشرات، استجابات) يمكن نمذجتها كـ "سجّل طوابع زمنية، واحسب الفروقات، وقارن بعتبة، وأبرز المخالفات".

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
لدى [`examples/customer-support/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/customer-support) في مستودع الدورة هذه السكربتات الكاملة مع ملفات CSV عينات. أو افتح المستودع كاملًا في [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## إلى أين تذهب من هنا

- أضف **توازن العبء إلى التوجيه**: بين النتائج المتعادلة، فضّل عميل الدعم صاحب أقل `active_tickets` — سطر إضافي واحد في دالة المفتاح لـ `max(...)`.
- أبقِ الطابور بين التشغيلات بفرّغ `SupportQueue` إلى JSON عند الخروج وإعادة تحميله عند البدء — التذاكر بالفعل فئات dataclass قابلة للتسلسل.
- أصدر التقرير كـ **ملف HTML ثابت** يستطيع فريق فتحه في متصفح، باستخدام قالب f-string يلتف حول نفس بيانات `SLA breaches`/`CSAT`.
- أضف SLA لكل أولوية (URGENT ساعة، HIGH 4 ساعات، MEDIUM 8، LOW 24) بتمرير `Priority` للتذكرة عبر `sla_report` — الجواب الصادق لسؤال الخطوة 3 السقراطي.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓