---
title: "نظام إدارة علاقات العملاء"
description: "إدارة علاقات العملاء مع جهات الاتصال والصفقات وتتبع خطوط البيع والتكامل مع البريد الإلكتروني."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["classes", "sqlite3", "rich", "cli"]
learningObjectives:
  - "نمذجة جهات الاتصال والصفقات والأنشطة كفئات dataclass مكتوبة"
  - "تصميم والاستعلام عن قاعدة بيانات SQLite بمفاتيح أجنبية وSQL مُعامَلة"
  - "إدراج وبحث وفلترة السجلات عبر الجداول المرتبطة"
  - "تتبع مراحل الصفقات مع التحقق وإعادة قراءة ملخص خط أنابيب لكل مرحلة"
  - "تسجيل الأنشطة وإعادة بناء خط زمني كرونولوجي لجهة اتصال"
  - "عرض كل رؤية كجدول غني منسّق"
prerequisites: ["أساسيات Python (فئات، دوال، قواميس)", "pip install rich"]
---

# 🛠️ 🤝 ابنِ نظام إدارة علاقات العملاء

نظام إدارة علاقات العملاء (CRM) هو مصدر الحقيقة المشترك لفريق مبيعات: كل جهة اتصال، كل صفقة، كل مكالمة وبريد إلكتروني تعيش في مكان واحد بحيث لا يتسلل شيء. يبني هذا المشروع CRM خفيفًا من الصفر ، ستُنشئ جهات اتصال وصفقات وأنشطة كفئات Python dataclass مكتوبة، وتصمم مخطط SQLite بمفاتيح أجنبية حقيقية، وتكتب استعلامات مُعامَلة للبحث والفلترة، وتدفع الصفقات عبر خط أنابيب مُتحقَّق، وتعيد بناء خط زمني لجهة اتصال، وتعرض كل ذلك في مخرجات جداول `rich` نظيفة.

هذا يفترض Python 101 وارتياحًا كافيًا مع SQL لقراءة SELECT ، لا يُشترط شيء من تحليل البيانات. إنه اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. نمذج جهات الاتصال والصفقات والأنشطة كأنواع `@dataclass` نظيفة مع تعبئة التاريخ تلقائيًا.
2. صمم مخطط SQLite بثلاثة جداول مرتبطة ومفاتيح أجنبية بينها.
3. أدرج السجلات باستعلامات مُعامَلة وبحثًا بالاسم أو البريد أو الشركة.
4. ادفع الصفقات عبر خط أنابيب مُتحقَّق وأعد قراءة ملخص قيمة لكل مرحلة.
5. سجّل الأنشطة وأعد بناء الخط الزمني الكرونولوجي الكامل لجهة اتصال.
6. اعرض كل رؤية كجداول `rich` منسّقة في الطرفية.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي الموصى به ، يكتب SQLite إلى القرص عندما تختار مسار ملف، ويعرض `rich` جداول كاملة الألوان فقط في طرفية حقيقية (خلايا دفاتر الملاحظات بتقطّعها).

**GitHub Codespaces** يعمل أيضًا بشكل ممتاز: افتح [مستودع الدورة في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) وشغّل من هناك. طرفية حقيقية بدعم ألوان حقيقي.

**Google Colab وKaggle Notebooks** طريقة حقيقية لتشغيل هذا ، يعمل SQLite في الذاكرة (`:memory:`)، وكود Python متوافق تمامًا. التحفظ الصادق هو `rich`: خلايا دفاتر الملاحظات تعرض الجداول بنص عادي (تختفي الألوان)، ولا توجد بيانات دائمة بين الجلسات. يستخدم دفتر الملاحظات أدناه قاعدة بيانات في الذاكرة مزروعة بجهتي اتصال عيّنتين وصفقاتهما، لذا كل استعلام يرجع نتائج تبدو حقيقية حتى لو لم يبقَ شيء بعد إعادة تشغيل النواة. استخدمه لرؤية المخطط والاستعلامات تعمل من البداية للنهاية؛ انتقل إلى `uv` محلي أو Codespace متى أردت بياناتك الخاصة أن تبقى.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/crm-system/notebook.ar.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/crm-system/notebook.ar.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcrm-system%2Fnotebook.ar.ipynb)

## الإعداد

كل ما تحتاجه يعيش في حزمتين: مكتبة PyPI واحدة لواجهة الطرفية، ووحدة مكتبة قياسية واحدة للتخزين.

### ثبّت `uv`

`uv` أداة واحدة تحل محل السلسلة المعتادة "ثبّت Python، ثم ثبّت pip، ثم ثبّت أداة بيئة افتراضية، ثم ثبّت الحزم" ، يمكنها تثبيت وإدارة نسخ Python بنفسها، إلى جانب تبعيات مشروعك.

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

### جهّز المشروع

```bash
uv init crm-system
cd crm-system
uv add rich
```

يجعل `rich` جداول الطرفية واللوحات تبدو كتطبيق حقيقي ، ألوان وحدود وأعمدة مصطفة. `sqlite3` مدمج في Python؛ لا تثبيت إضافي مطلوب. تعيش بيانات CRM الخاصة بك في ملف `.db` توجه إليه السكربت، أو في الذاكرة إذا لم تحدد مسارًا.

**✅ قائمة التحقق**

- ✅ يطبع `uv --version` رقم إصدار.
- ✅ يوجد `crm-system/` مع `pyproject.toml`، و`rich` مثبّت.

## الخطوة 1: نمذج البيانات باستخدام dataclasses

كل سجل في CRM له شكل صلب ، جهة الاتصال دائمًا باسم وبريد؛ الصفقة دائمًا بقيمة ومرحلة. يفرض `@dataclass` ذلك الشكل وقت التعريف، ويمنع انجراف السمات العرضي، ويمنحك `repr` مقروءًا وتسلسل قاموس مجانًا. يبقى حقل `Optional[int]` id مساويًا `None` حتى يُدرج السجل ويُسند قاعدة البيانات رقمًا.

### 1.1 عرّف Contact وDeal وActivity

**👟 تلميح البداية :** امنح كل فئة بالضبط مجموعة الأعمدة التي ترسم إليها، واجعل `id` حقلًا قابلاً للخواء `Optional[int]` بافتراض `None`، وضَع افتراضات سلسلة فارغة منطقية لحقول النصوص الاختيارية.

```python
# crm_system.py
from dataclasses import dataclass
from datetime import date
from typing import Optional

@dataclass
class Contact:
    name: str
    email: str
    company: str = ""
    phone: str = ""
    id: Optional[int] = None

@dataclass
class Deal:
    contact_id: int
    title: str
    value: float
    stage: str = "lead"
    id: Optional[int] = None
    STAGES = ["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"]

@dataclass
class Activity:
    contact_id: int
    deal_id: Optional[int]
    kind: str      # call, email, meeting
    summary: str
    activity_date: str = ""
    id: Optional[int] = None

    def __post_init__(self):
        if not self.activity_date:
            self.activity_date = date.today().isoformat()

c = Contact(name="Alice Chen", email="alice@acme.com", company="Acme Corp")
d = Deal(contact_id=1, title="Enterprise License", value=12_000, stage="proposal")
a = Activity(contact_id=1, deal_id=1, kind="meeting", summary="Discussed pricing")
print(f"Contact: {c.name} | Deal: {d.title} (${d.value:,.0f})")
```

`__post_init__` على `Activity` هو الجزء الوحيد غير البديهي: يملأ التاريخ تلقائيًا بسلسلة اليوم ISO عندما تنسى، لذا كل نشاط يحصل على طابع زمني صالح حتى في تشغيل اختبار سريع. `Deal.STAGES` ثابت على مستوى الفئة ، لا سمة مثيل ، مما يعني أن `Deal.STAGES` تُقرأ نظيفة دون إنشاء `Deal`، وكل مثيل يعرف ضمنيًا التقدم المسموح.

**🎯 الناتج المتوقع :** يطبع `Contact: Alice Chen | Deal: Enterprise License ($12,000)`.

**🩹 إذا لم يعمل :** إذا لم يُتعرَّف `Optional` من `typing`، فنسخة Python لديك <3.10 ، استخدم `from __future__ import annotations` في الأعلى، أو يبقى `Optional[int]` صالحًا في الحالتين. إذا كان `__post_init__` لا يعمل، تحقق أنه بمسافة بادئة تحت `Activity`، لا كدالة مستقلة ، إنها دالة سحرية dataclass، لا دالة عادية.

### 1.2 تحقّق من النماذج

**✅ قائمة التحقق**

- ✅ بناء `Contact` و`Deal` و`Activity` بوسائط مسماة يُنتج `repr` نظيفًا وبدون `TypeError`.
- ✅ إنشاء `Activity` دون تاريخ يملأ `activity_date` تلقائيًا بتاريخ اليوم ISO.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- قاموس عادي مثل `{"name": "Alice", "email": "alice@acme.com"}` سيخزن نفس البيانات دون استيراد أي شيء. ما *الضمان* المحدد الذي يضيفه `@dataclass` ولا يقدمه القاموس، ومتى يهم ذلك الضمان؟
- `Deal.STAGES` معرّف مباشرة على جسم الفئة. لماذا ذلك أفضل من قائمة `STAGES` على المستوى الأعلى، وماذا يحدث لـ `move_deal` في الخطوة 4 إذا لم يطابق سلسلة مرحلة أيًا من تلك القيم؟

## الخطوة 2: صمم مخطط SQLite وأدرج جهات الاتصال

`sqlite3` أصغر قاعدة بيانات موثوقة في الوجود ، لا تثبيت، لا خدمة خلفية، لا ملف إعداد ، وهي في مكتبة Python القياسية. يعكس المخطط فئات dataclass لديك بالضبط: ثلاثة جداول بمفتاح أجنبي من `deals` و`activities` إلى `contacts`، بحيث تفرض قاعدة البيانات نفسها العلاقة التي يعتمد عليها كودك.

### 2.1 أنشئ قاعدة البيانات والمخطط

**👟 تلميح البداية :** استخدم `conn.row_factory = sqlite3.Row` حتى يتصرف كل ناتج `SELECT` كقاموس مقروء، و`executescript` لتشغيل عدة جمل `CREATE TABLE` في استدعاء واحد.

```python
# crm_system.py (continued)
import sqlite3

def init_db(db_path: str = ":memory:") -> sqlite3.Connection:
    """Create the three tables and return a ready-to-use connection."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.executescript("""
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            company TEXT DEFAULT '',
            phone TEXT DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS deals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contact_id INTEGER REFERENCES contacts(id),
            title TEXT NOT NULL,
            value REAL DEFAULT 0,
            stage TEXT DEFAULT 'lead'
        );
        CREATE TABLE IF NOT EXISTS activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contact_id INTEGER REFERENCES contacts(id),
            deal_id INTEGER,
            kind TEXT NOT NULL,
            summary TEXT NOT NULL,
            activity_date TEXT NOT NULL
        );
    """)
    conn.commit()
    return conn

conn = init_db()
```

`"refereences contacts(id)"` إعلان مفتاح أجنبي، لكن SQLite يفرضه فقط إذا شغّلت `PRAGMA foreign_keys = ON` ، وبشكل متعمد، لا نفعل ذلك هنا. فرض المفتاح الأجنبي الكامل هو المعيار الصحيح للإنتاج، لكن في CRM تعليمي قد تُدرج فيه صفقة مؤقتًا قبل وجود جهة الاتصال، فالخيار العملي أن يملك كود Python القيد. `conn.row_factory = sqlite3.Row` تعني أن كل صف جلبته يتصرف كقاموس وككائن معًا ، يمكنك استخدام `row["name"]` و`row.name` بالتبادل، وهي الميزة الأكثر فائدة في `sqlite3` على الإطلاق.

**🎯 الناتج المتوقع :** تُرجع `init_db()` اتصال `sqlite3.Connection` حيًا دون أخطاء؛ ويطبع استدعاء `conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()` أسماء الجداول الثلاثة.

**🩹 إذا لم يعمل :** إذا رفع `executescript` `ProgrammingError`، نسيت `conn.commit()` ، كتابات المخطط معاملات، ودون الالتزام تكون غير مرئية للاستعلامات اللاحقة. إذا كان جدول موجودًا بالفعل من تشغيل سابق ضد ملف (لا `:memory:`)، يفعل `CREATE TABLE IF NOT EXISTS` شيئًا بصمت ، احذف الملف أو الجدول إن أردت مخططًا جديدًا.

### 2.2 أدرج جهات الاتصال وابحث فيها

**👟 تلميح البداية :** اكتب `add_contact` و`search_contacts` كدالتين خالصتين للاتصال ، لا لمتغير عام أبدًا ، بحيث تكونان اختياريتين بصورة تافهة وقابلتين للتركيب.

```python
# crm_system.py (continued)
def add_contact(conn: sqlite3.Connection, contact: Contact) -> int:
    cur = conn.execute(
        "INSERT INTO contacts (name, email, company, phone) VALUES (?, ?, ?, ?)",
        (contact.name, contact.email, contact.company, contact.phone),
    )
    conn.commit()
    return cur.lastrowid

def search_contacts(conn: sqlite3.Connection, query: str) -> list[dict]:
    """Search by name, email, or company using parameterized LIKE."""
    pattern = f"%{query}%"
    rows = conn.execute(
        "SELECT * FROM contacts WHERE name LIKE ? OR email LIKE ? OR company LIKE ?",
        (pattern, pattern, pattern),
    ).fetchall()
    return [dict(r) for r in rows]

alice_id = add_contact(conn, Contact(name="Alice Chen", email="alice@acme.com", company="Acme Corp"))
bob_id   = add_contact(conn, Contact(name="Bob Smith", email="bob@globex.com", company="Globex Inc"))
print(f"Added contacts: IDs {alice_id}, {bob_id}")
print(search_contacts(conn, "acme"))
```

أماكن `?` في سلسلة SQL هي المعنى كله للاستعلامات المُعامَلة: لا تفسر قاعدة البيانات قيم سلاسلك أبدًا كشظايا SQL، وهي قاعدة أمنية (لا حقن) وقاعدة صحة (لا أخطاء تهرّب) معًا. `cur.lastrowid` هو المفتاح الأساسي الصحيح الذي أسندته قاعدة البيانات للتو ، إنها قيمة المفتاح الأجنبي التي تحتاجها صفقاتك وأنشطتك في الخطوات التالية، لذا إرجاع `add_contact` لها خيار تصميمي متعمد.

**🎯 الناتج المتوقع :** يطبع `Added contacts: IDs 1, 2` متبوعًا بقائمة تحوي قاموسًا واحدًا لأليس تشن.

**🩹 إذا لم يعمل :** إذا أرجع `search_contacts(conn, "acme")` قائمة فارغة رغم إدراج أليس، تحقق أن استدعائي `add_contact` عملًا قبل الاستعلام ، إذا كان `conn.commit()` مفقودًا داخل `add_contact`، فالإدراجات غير مرئية للقراءات اللاحقة. إذا حصلت على `ProgrammingError: wrong number of arguments`، فسلسلة الاستعلام فيها عدد أماكن `?` مختلف عن القيم في الصفّي ، عدّها.

### 2.3 تحقّق من المخطط والإدراج

**✅ قائمة التحقق**

- ✅ جهتا اتصال موجودتان بمعرفات مُسندة تلقائيًا (`1` و`2`)، و`search_contacts(conn, "Globex")` يرجع بوب بالضبط.
- ✅ يمكنك شرح لماذا أماكن `?` ليست مجرد ممارسة أفضل بل حدًا أمنيًا.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تُرجع `search_contacts` `[dict(r) for r in rows]`، محوّلة كل `sqlite3.Row` إلى قاموس عادي. ما الذي كان سيتغير لو أرجعت كائنات `Row` مباشرة ، هل هناك حالة يكون ذلك أفضل فيها، وحالة يكسر فيها شيئًا؟
- يقترح زميل مبتدئ تخزين الشركة كمفتاح أجنبي صحيح لجدول `companies` "من أجل التطبيع". ما المقايضات في CRM صغير حيث اسم الشركة مجرد تسمية فعلًا؟

## الخطوة 3: ابحث وفلتر باستخدام الانضمامات

لا يصبح CRM مفيدًا حتى تستطيع طرح أسئلة علائقية: "أي الصفقات في مرحلة الاقتراح؟" "أي جهات الاتصال مرتبطة بصفقة قيمتها أكثر من 5 آلاف؟" هذه انضمامات (JOIN) ، سحب صفوف من جدولين باستخدام المفتاح الأجنبي الذي يربطهما ، وهي نمط الاستعلام الذي يجعل قاعدة البيانات أقوى فعلًا من ملف مسطّح.

### 3.1 اكتب استعلامات الصفقات المفلترة

**👟 تلميح البداية :** اكتب دالة تعد جهات الاتصال لكل شركة (GROUP BY بسيط)، ودالة تسرد الصفقات مفلترة حسب المرحلة ، كلتاهما بقيم مُعامَلة.

```python
# crm_system.py (continued)
def contacts_by_company(conn: sqlite3.Connection, company: str) -> list[dict]:
    """Return all contacts whose company matches the query."""
    rows = conn.execute(
        "SELECT * FROM contacts WHERE company LIKE ?", (f"%{company}%",)
    ).fetchall()
    return [dict(r) for r in rows]

def deals_by_stage(conn: sqlite3.Connection, stage: str) -> list[dict]:
    """List deals at a given stage, joined with contact name."""
    rows = conn.execute(
        "SELECT d.id, d.title, d.value, d.stage, c.name AS contact_name "
        "FROM deals d JOIN contacts c ON d.contact_id = c.id "
        "WHERE d.stage = ? ORDER BY d.value DESC",
        (stage,),
    ).fetchall()
    return [dict(r) for r in rows]

# Demo: search contacts and list deals by stage
print("Acme contacts:", contacts_by_company(conn, "Acme"))
# (deals_by_stage will return [] until Step 4 inserts deals)
```

`JOIN contacts c ON d.contact_id = c.id` هو السطر المفتاحي: يطابق كل صفقة مع جهة الاتصال المالكة لها بالمفتاح الأجنبي الصحيح، و`c.name AS contact_name` يجلب الاسم إلى النتيجة بحيث لا يحتاج منطق العرض لديك استعلامًا ثانيًا. الفرز بـ `value DESC` انحياز متعمد نحو المعلومات التي تريدها أولًا عند مسح خط أنابيب ، الأرقام الأكبر في الأعلى.

**🎯 الناتج المتوقع :** `Acme contacts: [{'id': 1, 'name': 'Alice Chen', ...}]`؛ و`deals_by_stage(conn, "proposal")` يرجع قائمة فارغة (الصفقات غير موجودة بعد ، تأتي في الخطوة 4).

**🩹 إذا لم يعمل :** إذا أرجع `contacts_by_company` عدم تطابق حساسية حالة (مثلًا بالبحث "ACME" عن "Acme")، فـ `LIKE` في SQLite حساس الحالة فقط لشخصيات ASCII؛ استخدم `LOWER()` في الاستعلام إذا كنت تعمل بمدخل ذي حالات مختلطة. إذا رفع `deals_by_stage` `OperationalError: no such column`، فاسم العمود المستعار في الانضمام لا يطابق قائمة SELECT.

### 3.2 تحقّق من الاستعلامات المفلترة

**✅ قائمة التحقق**

- ✅ `contacts_by_company(conn, "Globex")` يرجع بوب بالضبط، و`contacts_by_company(conn, "Nonexistent")` يرجع `[]`.
- ✅ `deals_by_stage` يرجع قائمة فارغة قبل إدراج أي صفقة ، مؤكدًا أنه لا يعيد استخدام بيانات قديمة بصمت.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يفلتر كل من `search_contacts` و`contacts_by_company` بنمط `LIKE ?`. لماذا لا تكتب ببساطة دالة واحدة بجملة `WHERE` تفحص كل عمود بـ `OR` ، هل ثمة سبب لإبقائهما منفصلتين، أم مجرد أسلوب كود؟
- `deals_by_stage` تنضم لكن `contacts_by_company` لا تفعل. متى يعمل استعلام جدول واحد، ومتى يعطيك تركُ الانضمام إجابة خاطئة بصمت؟

## الخطوة 4: تتبع الصفقات عبر خط الأنابيب

*مرحلة* الصفقة هي موضعها في خط أنابيب المبيعات، ودفعها قدمًا دون تحقق هو كيف تتحول أنظمة CRM إلى قمامة. تبني هذه الخطوة منطق خط الأنابيب: أضف صفقات، وتحقق من انتقالات المراحل، وحرّك صفقة قدمًا، وأعد قراءة ملخص لكل مرحلة لكم الصفقات وكم القيمة الجالسة عند كل نقطة.

### 4.1 أدرج الصفقات وحرّكها عبر خط الأنابيب

**👟 تلميح البداية :** يجب أن يعيش `add_deal` و`move_deal` على ثوابت فئة `Deal` ، `deal_id` و`new_stage` وسيطان، لا سميتان ، ويجب أن يرفض `move_deal` المراحل غير الصالحة *قبل* تشغيل UPDATE.

```python
# crm_system.py (continued)
def add_deal(conn: sqlite3.Connection, deal: Deal) -> int:
    cur = conn.execute(
        "INSERT INTO deals (contact_id, title, value, stage) VALUES (?, ?, ?, ?)",
        (deal.contact_id, deal.title, deal.value, deal.stage),
    )
    conn.commit()
    return cur.lastrowid

def move_deal(conn: sqlite3.Connection, deal_id: int, new_stage: str) -> None:
    if new_stage not in Deal.STAGES:
        raise ValueError(f"Invalid stage: {new_stage}. Choose from {Deal.STAGES}")
    conn.execute("UPDATE deals SET stage = ? WHERE id = ?", (new_stage, deal_id))
    conn.commit()

deal1_id = add_deal(conn, Deal(contact_id=alice_id, title="Enterprise License", value=12_000, stage="proposal"))
deal2_id = add_deal(conn, Deal(contact_id=bob_id, title="Consulting Package", value=5_000, stage="lead"))
move_deal(conn, deal1_id, "negotiation")
```

فحص التحقق ، `if new_stage not in Deal.STAGES` ، يعمل كحارس على مستوى Python، لا كقيد قاعدة بيانات، لأن SQLite لا يملك قيود `CHECK` في `DEFAULT`. هذا هو المساومة المتعمدة: تحصل على `ValueError` واضح مع الخيارات الصالحة المطبوعة، بدل `UPDATE` صامت يكتب سلسلة بلا معنى ويكسر رؤية خط الأنابيب لاحقًا.

**🎯 الناتج المتوقع :** صفقتان موجودتان؛ الصفقة 1 الآن عند `"negotiation"` بعد التحرك؛ الصفقة 2 تبقى عند `"lead"`.

**🩹 إذا لم يعمل :** إذا رفع `move_deal` `ValueError` لمرحلة صالحة، فالسلسلة فيها خطأ إملائي ، الحالة حساسة تمامًا كما هو مدرج في `Deal.STAGES`. إذا عمل UPDATE لكن `deals_by_stage` ما زال يعرض الصفقة بمرحلتها القديمة، نسيت `conn.commit()` ، حدثت الكتابة في الذاكرة لكن لم تُثبَّت.

### 4.2 أعد قراءة ملخص خط الأنابيب

**👟 تلميح البداية :** جمّع بـ `GROUP BY stage` ورتّب بـ `ORDER BY stage` للحصول على صف واحد لكل مرحلة بترتيب خط الأنابيب، مع عدد صفقات وإجمالي قيمة.

```python
# crm_system.py (continued)
def pipeline_summary(conn: sqlite3.Connection) -> dict:
    """Return {stage: {count, total_value}} for every stage in the pipeline."""
    rows = conn.execute(
        "SELECT stage, COUNT(*) AS deals, SUM(value) AS total "
        "FROM deals GROUP BY stage ORDER BY stage"
    ).fetchall()
    return {r["stage"]: {"count": r["deals"], "value": r["total"] or 0.0} for r in rows}

for stage, info in pipeline_summary(conn).items():
    print(f"  {stage:<15} {info['count']} deals  ${info['value']:>10,.0f}")
```

يعالج `r["total"] or 0.0` الحالة التي لا صفقات فيها لمرحلة أصلًا ، يُرجع `SUM` قيمة `NULL` على مجموعة فارغة، ويلتقطها `or` في Python. ترتيب `stage` أبجديًا تبسيط لخط الأنابيب التعليمي؛ ستعرّف CRM إنتاجي ترتيبًا صريحًا عبر `CASE WHEN stage = 'lead' THEN 1 ...`.

**🎯 الناتج المتوقع :** يطبع كل مرحلة بعدد صفقاتها وإجمالي قيمتها ، `negotiation` تعرض صفقة واحدة (12,000$)، `lead` تعرض صفقة واحدة (5,000$)، وكل المراحل الأخرى تعرض صفر صفقات وصفر$ .

**🩹 إذا لم يعمل :** إذا عرضت كل مرحلة صفر صفقات رغم الإدراجات، فـ `GROUP BY` لديك يعمل ضد اتصال أو ملف قاعدة بيانات مختلف ، أكد أنك تمرر كائن `conn` نفسه، لا تعيد التهيئة من الصفر. إذا كانت أسماء المراحل لا تطابق ثابت `STAGES`، فـ `SUM` على مجموعة غير موجودة لا يُرجع شيئًا ، تحقق من مسافات ضائعة في سلاسل المراحل.

### 4.3 تحقّق من خط الأنابيب

**✅ قائمة التحقق**

- ✅ مرحلة `deal1_id` هي `"negotiation"` بعد `move_deal`، و`deal2_id` ما زالت `"lead"`.
- ✅ `pipeline_summary(conn)` تُرجع قاموسًا بمرحلتين غير صفريتين بالضبط وعدديهما الصحيحين.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يريد مستخدم تحريك صفقة *للخلف* من `"negotiation"` إلى `"qualified"`. هل دالة `move_deal` الحالية صحيحة لحالة الاستخدام تلك، وما المنطق الإضافي الذي كان سيمنع سوء الاستخدام إذا كنت تنشر هذا كأداة مبيعات حقيقية؟
- ملخص خط الأنابيب مرتّب أبجديًا بالاسم. ما الخطأ في ذلك الترتيب لخط أنابيب مبيعات حقيقي، وكيف تصلحه دون مغادرة SQL؟

## الخطوة 5: سجّل الأنشطة وأعد قراءة خط زمني

صفقة بلا سياق رقم؛ صفقة بخط زمني من مكالمات ورسائل واجتماعات *قصة*. تكتب هذه الخطوة الأنشطة إلى قاعدة البيانات وتعيد بناء تلك القصة لأي جهة اتصال ، مرتبة بالتاريخ، حتى يقرأ مدير تاريخ العلاقة دون تمرير.

### 5.1 أدرج الأنشطة وجلب الخط الزمني

**👟 تلميح البداية :** `add_activity` مطابقة شبه تامة الشكل لـ `add_deal` ، النمط دائمًا "إدراج بأماكن `?`، ثم الالتزام، ثم إرجاع lastrowid". اكتب `timeline_for_contact` تنضم الأنشطة إلى جهات الاتصال وترتب بـ `activity_date, id`.

```python
# crm_system.py (continued)
def add_activity(conn: sqlite3.Connection, activity: Activity) -> int:
    cur = conn.execute(
        "INSERT INTO activities (contact_id, deal_id, kind, summary, activity_date) "
        "VALUES (?, ?, ?, ?, ?)",
        (activity.contact_id, activity.deal_id, activity.kind, activity.summary, activity.activity_date),
    )
    conn.commit()
    return cur.lastrowid

def timeline_for_contact(conn: sqlite3.Connection, contact_id: int) -> list[dict]:
    """Return all activities for a contact, ordered by date then insertion order."""
    rows = conn.execute(
        "SELECT kind, summary, activity_date FROM activities "
        "WHERE contact_id = ? ORDER BY activity_date, id",
        (contact_id,),
    ).fetchall()
    return [dict(r) for r in rows]

add_activity(conn, Activity(contact_id=alice_id, deal_id=deal1_id, kind="meeting", summary="Reviewed contract"))
add_activity(conn, Activity(contact_id=bob_id,   deal_id=deal2_id, kind="call",    summary="Initial outreach call"))
add_activity(conn, Activity(contact_id=alice_id, deal_id=deal1_id, kind="email",   summary="Sent revised terms"))

print("Alice's timeline:")
for a in timeline_for_contact(conn, alice_id):
    print(f"  {a['activity_date']}  [{a['kind']}]  {a['summary']}")
```

`ORDER BY activity_date, id` فرز من جزأين: تواريخ أولًا، ثم ترتيب إدراج للأنشطة في نفس اليوم. دون كاسر التعادل `, id`، تظهر أنشطة نفس اليوم بترتيب تعسفي، وهو أمر مقبول لعبة لكن محيّر في أي خط زمني حقيقي. كون `deal_id` من `Optional[int]` يهم هنا ، النشاط يمكن أن يكون عن جهة اتصال عمومًا، غير مربوط بصفقة محددة.

**🎯 الناتج المتوقع :** يطبع خط أليس الزمني: الاجتماع في تاريخ اليوم، ثم البريد، كلاهما مسجل بوسم النوع والملخص.

**🩹 إذا لم يعمل :** إذا أظهرت أنشطة أليس مدخلات بوب (أو العكس)، فقيمة `contact_id` الممررة إلى `timeline_for_contact` لا تطابق ، تتبع معرفات `add_contact` عائدًا في الخطوة 2. إذا كان الخط الزمني فارغًا رغم الإدراجات، فأنت تستعلم اتصالًا مختلفًا لم يلتزم ، استخدم دائمًا نفس كائن `conn`.

### 5.2 تحقّق من سجل الأنشطة

**✅ قائمة التحقق**

- ✅ لأليس نشاطان بالضبط ولبوب نشاط واحد، كلٌّ يعرض النوع والملخص وتاريخ اليوم الصحيحين.
- ✅ الأنشطة في نفس اليوم مرتبة بترتيب إدراجها (الاجتماع قبل البريد)، لا أبجديًا بالملخص.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- `deal_id` من `Optional[int]` في `Activity`، لكن جدول `activities` يخزنه كـ `INTEGER` عارٍ دون جملة `REFERENCES`. ما الذي قد يخطئ في الإنتاج إذا أدرج أحد نشاطًا بـ `deal_id` غير موجود في جدول `deals`؟
- كيف كانت ستوسع `timeline_for_contact` لتضمين عنوان الصفقة بجانب كل نشاط (للأنشطة التي لها `deal_id`)، ولماذا يتطلب ذلك `LEFT JOIN` لا `JOIN` عاديًا؟

## الخطوة 6: اعرض كل شيء بجداول rich

CRM عملي ، جهات الاتصال مخزّنة، الصفقات تتدفق عبر خط أنابيب، الأنشطة مُسجَّلة. لكن كل المخرجات حتى الآن جمل `print()` عارية. يحوّل `rich` ذلك إلى تطبيق طرفية حقيقي: جداول ملونة بأعمدة مصطفة وحدود مرئية ورؤوس تجعل المسح سريعًا.

### 6.1 اعرض جهات الاتصال وخط الأنابيب كجداول rich

**👟 تلميح البداية :** استورد `Console` و`Table` من `rich`، وأنشئ جدولًا واحدًا لكل رؤية، وأضف أعمدة بـ `style` للترميز اللوني، واطبع كل جدول بـ `console.print(table)`.

```python
# crm_system.py (continued)
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

console = Console()

def show_contacts(conn: sqlite3.Connection) -> None:
    table = Table(title="Contacts")
    table.add_column("ID", style="cyan")
    table.add_column("Name", style="green")
    table.add_column("Email")
    table.add_column("Company", style="yellow")
    for row in conn.execute("SELECT * FROM contacts"):
        table.add_row(str(row["id"]), row["name"], row["email"], row["company"])
    console.print(table)

def show_pipeline(conn: sqlite3.Connection) -> None:
    table = Table(title="Deal Pipeline")
    table.add_column("Deal", style="cyan")
    table.add_column("Contact", style="green")
    table.add_column("Value", justify="right")
    table.add_column("Stage", style="yellow")
    for row in conn.execute(
        "SELECT d.title, d.value, d.stage, c.name AS contact_name "
        "FROM deals d JOIN contacts c ON d.contact_id = c.id "
        "ORDER BY d.stage, d.value DESC"
    ):
        table.add_row(row["title"], row["contact_name"], f"${row['value']:,.0f}", row["stage"])
    console.print(table)

show_contacts(conn)
show_pipeline(conn)
```

`style="cyan"` و`style="green"` توجيهات ألوان `rich` ، تضيف معنى دون إثقال المخرج: المعرفات بلون دائمًا، الأسماء بلون آخر، المراحل بثالث. `justify="right"` على القيمة يجعل مبالغ الدولار تصطف بالعشرية، لا بالرقم الأول، وهو ما تتوقعه عينك من جدول بيانات. مثيل `Console()` واحد تتقاسمه كل الدوال يبقي إعدادات اللون والعرض متسقة.

**🎯 الناتج المتوقع :** جدولا `rich` في الطرفية ، الأول يسرد جهتي الاتصال بعمودي المعرف/الاسم/الشركة ملوّنين، والثاني يعرض الصفقتين مع اسم جهة الاتصال المنضم، وقيم الدولار مصطفة يمينًا، والمراحل ملوّنة.

**🩹 إذا لم يعمل :** إذا كان المخرج نصًا عاديًا بعدائي، فأنت تشغّل في خلية دفتر ملاحظات لا طرفية حقيقية ، يكتشف `rich` المخرج غير-TTY ويجرّد الألوان. استخدم طرفية أو Codespace. إذا كان عمود القيمة بصريات عشرية غير مصطفة، فـ `justify="right"` مفقود أو القيم تُنسَّق كسلاسل قبل الإدراج.

### 6.2 تحقّق من العرض الغني

**✅ قائمة التحقق**

- ✅ جدولان منسّقان يُعرضان بالألوان ، الأول لجهات الاتصال، والثاني لخط أنابيب الصفقات.
- ✅ قيم الدولار في جدول خط الأنابيب مصطفة يمينًا، بفواصل في الآلاف.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يكتشف `rich.Console()` عرض الطرفية تلقائيًا ويقطّع الأعمدة الطويلة جدًا. ماذا يحدث إذا كان بريد جهة اتصال 80 حرفًا، وكيف كانت ستصلح ذلك دون فقدان البيانات؟
- جدول خط الأنابيب يرتب بـ `stage, value DESC`. لماذا لا تفرز بالمرحلة فقط، وما المشكلة البصرية التي كان ذلك سيخلقها عند مسح خط أنابيب بصفقات متعددة في نفس المرحلة؟

## ⚠️ المآزق الشائعة

- **حقن SQL عبر f-strings.** `"SELECT * FROM contacts WHERE name LIKE f'%{query}%'"` ناقل حقن نصي نموذجي ، استخدم دائمًا أماكن `?` مع صفّي معاملات منفصل. دالة `search_contacts` أعلاه توضح الشكل الصحيح؛ أي استعلام يدرج مدخل مستخدم مباشرة خاطئ، مهما كان النموذج الأولي سريعًا.
- **نِسيان `conn.commit()`.** كل `INSERT` و`UPDATE` معاملة؛ دون التزام تكون الكتابة غير مرئية لـ `SELECT` التالي وتختفي بصمت. العَرَض هو "أدرجت صفًا لكن الاستعلام لا يُرجع شيئًا" ، دائمًا تقريبًا التزام مفقود.
- **أخطاء إملائية في سلسلة المراحل تنشئ مراحل جديدة بصمت.** يرفض `move_deal` المراحل غير الصالحة في حارس Python، لكن إذا تجاوزته بـ `UPDATE` خام، يخزن SQLite أي سلسلة كمرحلة عن طيب خاطر ، ولن تجد `deals_by_stage` تلك الصفوف أبدًا تحت اسم المرحلة المتوقع. أبقِ الحارس.
- **الترتيب الأبجدي لمراحل خط الأنابيب.** يفرز `ORDER BY stage` "lead" قبل "negotiation" ، وهو ما *يحدث* أن يطابق ترتيب خط الأنابيب في هذا المثال الصغير، لكنه هش. يحتاج CRM إنتاجي ترتيب مراحل صريحًا، إما عبر تعبير `CASE` أو جدول مراجعة.
- **`dict(row)` على sqlite3.Row لا يتداخل.** تظهر علاقات المفاتيح الأجنبية (`contact_name` من الانضمام) كمفاتيح مسطحة، لا بنية `{"contact": {"name": ...}}` متداخلة. أي كود يتوقع التداخل سيحصل بصمت على `KeyError`؛ عالج الشكل المسطّح أو ابنِ التداخل صراحة.

## ما بنيته للتو

CRM طرفية عامل: يخزن جهات اتصال، ويتتبع صفقات عبر خط أنابيب مُتحقَّق من ست مراحل، ويسجل أنشطة بتواريخ، ويعيد بناء خطوط زمنية لجهات الاتصال، ويعرض كل شيء عبر جداول `rich` منسّقة ، كل ذلك تدعمه قاعدة بيانات SQLite حقيقية باستعلامات مُعامَلة ومفاتيح أجنبية. وجّهه إلى ملف `.db` خاص بك وتبقى البيانات بين التشغيلات؛ لا محاكاة، لا بيانات مزيفة.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
لدى [`examples/crm-system/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/crm-system) في مستودع الدورة نسخة دفتر ملاحظات قابلة للتشغيل: قاعدة بيانات SQLite في الذاكرة مزروعة بجهات اتصال وصفقات عيّنة، وكل استعلام وجدول من الخطوات 1–6 يعمل من البداية للنهاية، والمخرج الغني مُعرض سطريًا. انسخه، أو افتح المستودع كاملًا في [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وشغّله من هناك.
:::

## إلى أين تذهب من هنا

- ابنِ **لوحة تقرير قيمة خط الأنابيب**: استخدم `rich.panel.Panel` لطباعة إجمالي قيمة خط الأنابيب وعدد الصفقات المفتوحة ومتوسط حجم الصفقة ، كلها من `pipeline_summary` ، داخل لوحة ملونة واحدة تتناسب مع أعلى كل استدعاء `show_pipeline`.
- أضف **إعادة إسناد الصفقات**: اكتب `reassign_deal(conn, deal_id, new_contact_id)` يغيّر جهة الاتصال، ثم سجّل إعادة الإسناد كنشاط حتى يُظهر الخط الزمني لمن تنتمي الصفقة قبلًا وبعدًا.
- نفّذ **استيراد/تصدير CSV**: أضف `import_csv(conn, path)` باستخدام `csv.DictReader` في Python لتحميل جهات الاتصال بالجملة، و`export_deals(conn, path)` لتفريغ خط الأنابيب إلى جدول بيانات ، أبسط مسار من CRM إلى أداة تقارير.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها ، وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python يتتبع العلاقات الحقيقية. 🎓