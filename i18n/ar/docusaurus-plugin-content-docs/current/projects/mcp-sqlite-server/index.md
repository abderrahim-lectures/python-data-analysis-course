---
id: mcp-sqlite-server
title: "استعلام قاعدة بيانات بلغة طبيعية عبر MCP"
sidebar_label: "استعلام قاعدة بيانات بلغة طبيعية عبر MCP"
slug: /projects/mcp-sqlite-server
description: "ابنِ خادم MCP يعرض قاعدة بيانات SQLite محلية، ثم شاهد عميل نموذج لغوي يكتب وينفّذ استعلامات SQL الخاصة به للإجابة عن أسئلة بلغة طبيعية حولها."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 استعلام قاعدة بيانات بلغة طبيعية عبر MCP

<ProjectPublishedDate projectId="2027-mcp-sqlite-server" />

<ProjectGreeting />

عادةً ما تكون قواعد البيانات خلف جدار من SQL لا يستطيع الاستعلام عنه بارتياح إلا من كتبه. يغيّر MCP هذا الشكل: بدلاً من تعليم الجميع SQL، تعرض قاعدة بيانات عبر مجموعة صغيرة من الأدوات الموصوفة جيدًا، وتترك عميل نموذج لغوي يكتب وينفّذ SQL بنفسه، نيابةً عنك، سؤالًا واحدًا في كل مرة. يبني هذا المشروع بالضبط ذلك — قاعدة بيانات SQLite صغيرة محلية (مكتبة حي: كتب، مؤلفون، أعضاء، إعارات) وخادم MCP يتيح لمساعد ذكاء اصطناعي سرد جداولها، وفحص مخطط جدول ما، وتنفيذ استعلامات **للقراءة فقط** عليها، بحيث يمكنك أن تسأل شيئًا مثل "ما الكتب التي لم تستعدها المكتبة بعد؟" بلغة طبيعية وتشاهد إجابة صحيحة عليه.

يفترض هذا المشروع إتمام بايثون 101، ويُفضَّل أيضًا تحليل البيانات (الارتياح للجداول والأعمدة والاستعلام عن البيانات المهيكلة سيجعل جانب SQL يترسخ أسرع)، وأن تكون قد بنيت بالفعل مشروع [بناء خادم MCP](/docs/projects/mcp-server) — يعيد هذا المشروع استخدام إعداد `FastMCP` من ذلك المشروع ولا يشرحه من جديد من الصفر. إنه اختياري وغير مُقيَّم؛ راجع [مشاريع من الواقع](/docs/projects) للاطلاع على القائمة الكاملة والمتنامية.

## 🎯 ما ستفعله

1. بناء قاعدة بيانات SQLite صغيرة وواقعية تضم بضعة جداول مترابطة، باستخدام وحدة `sqlite3` من المكتبة القياسية فقط.
2. كتابة دوال بايثون بسيطة لسرد الجداول، ووصف مخطط جدول ما، وتنفيذ استعلام — مع فحص أمان حقيقي وليس شكليًا، يرفض أي شيء ليس استعلام `SELECT` للقراءة فقط.
3. ربط تلك الدوال كأدوات MCP باستخدام `FastMCP`، نفس الواجهة البرمجية القائمة على المزخرفات (decorators) من مشروع بناء خادم MCP.
4. توصيل خادمك بتطبيق Claude Desktop وطرح سؤال حقيقي بلغة طبيعية عليه، ومشاهدته يكتب وينفّذ SQL الخاص به عبر أدواتك.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي الموصى به، لنفس السبب في مشروع بناء خادم MCP: المكسب هنا هو ربط خادمك بتطبيق Claude Desktop، وClaude Desktop تطبيق مثبَّت على جهازك الخاص — لا مفرّ من تنفيذ الخطوة الأخيرة محليًا على الأقل. هذه عملية محلية طويلة الأمد يُفترض أن تنتظر اتصال عميل MCP حقيقي بها، وليست شيئًا يمكن لدفتر ملاحظات مُستضاف أن يكونه.

**GitHub Codespaces** يعمل لبناء قاعدة البيانات وكتابة دوال الأدوات والخادم نفسه: افتح [مستودع الدورة بالكامل في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython وuv مثبتة مسبقًا)، واكتب `seed.py` و`db_tools.py` و`server.py`، واختبر باستخدام MCP Inspector عبر المنفذ المُحوَّل الخاص بـ Codespace. ما لا يمكن أن يكونه هو نقطة الاتصال النهائية مع Claude Desktop، لنفس السبب في مشروع MCP السابق.

**Google Colab وKaggle أيضًا لا يمكنهما تشغيل الخادم الحقيقي** — نفس المنطق كما في بناء خادم MCP، فخلية دفتر الملاحظات لا يمكن أن تكون عملية محلية دائمة يتصل بها عميل سطح مكتب. ما يمكن لدفتر الملاحظات فعله هنا هو عرض دوال الاستعلام وفحص المخطط الأساسية بمعزل، عبر استدعاءات دوال بسيطة ودون أي بروتوكول MCP على الإطلاق — لهذا وُجد [`examples/mcp-sqlite-server/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/mcp-sqlite-server/notebook.ipynb). انقر على شارة لتشغيله مباشرةً، دون أي تثبيت محلي على الإطلاق:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/mcp-sqlite-server/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/mcp-sqlite-server/notebook.ipynb)

## الإعداد

إن كان لديك بالفعل `uv` من مشروع بناء خادم MCP، تخطَّ هذا. وإلا:

**macOS / Linux** (الطرفية):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

أغلق الطرفية وأعد فتحها، ثم تأكد من التثبيت:

```bash
uv --version
```

بعد ذلك أنشئ مشروعًا وثبّت SDK بايثون الرسمي لـ MCP، مع الإضافة الاختيارية `cli`:

```bash
uv init mcp-sqlite-server
cd mcp-sqlite-server
uv add "mcp[cli]"
```

`sqlite3`، مكتبة قاعدة البيانات التي يستعلم عنها هذا المشروع فعليًا، جزء من المكتبة القياسية لبايثون — لا شيء لتثبيته من أجلها. كما لا حاجة إلى أي مفتاح API خارجي لتشغيل الخادم نفسه: إنه أداة محلية بحتة، وعميل النموذج اللغوي الذي يتصل به (Claude Desktop، في الخطوة 4) يوفّر نموذجه الخاص، وإن احتاج إلى مفتاح، مفتاحه الخاص.

## الخطوة 1: بناء قاعدة بيانات نموذجية صغيرة

أنشئ `seed.py` — سكربت يبني قاعدة بيانات مكتبة صغيرة بأربعة جداول مترابطة:

```python
# seed.py
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "library.db"

SCHEMA = """
CREATE TABLE authors (
    id      INTEGER PRIMARY KEY,
    name    TEXT NOT NULL,
    country TEXT
);

CREATE TABLE books (
    id         INTEGER PRIMARY KEY,
    title      TEXT NOT NULL,
    author_id  INTEGER NOT NULL REFERENCES authors(id),
    year       INTEGER,
    genre      TEXT
);

CREATE TABLE members (
    id         INTEGER PRIMARY KEY,
    name       TEXT NOT NULL,
    joined_on  TEXT NOT NULL
);

CREATE TABLE loans (
    id          INTEGER PRIMARY KEY,
    book_id     INTEGER NOT NULL REFERENCES books(id),
    member_id   INTEGER NOT NULL REFERENCES members(id),
    borrowed_on TEXT NOT NULL,
    returned_on TEXT
);
"""

def build_database(db_path: Path = DB_PATH) -> None:
    if db_path.exists():
        db_path.unlink()
    conn = sqlite3.connect(db_path)
    try:
        conn.executescript(SCHEMA)
        # ... insert a handful of authors, books, members, and loans here —
        # see examples/mcp-sqlite-server/seed.py for a full sample dataset.
        conn.commit()
    finally:
        conn.close()

if __name__ == "__main__":
    build_database()
    print(f"Built sample database at {DB_PATH}")
```

شغّله مرة واحدة:

```bash
uv run python seed.py
```

كون `returned_on` قيمته `NULL` في صف ما هو أمر مقصود — فهو ما يجعل "ما الكتب التي لا تزال مُعارة؟" سؤالًا حقيقيًا وقابلًا للإجابة لاحقًا، بدلاً من أن تبدو كل إعارة متطابقة.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يعمل `uv run python seed.py` دون أخطاء وينشئ `library.db`.</StepChecklistItem>
<StepChecklistItem>تحتوي قاعدة البيانات على ثلاثة جداول مترابطة على الأقل، متصلة بمفاتيح خارجية (وليست جدولًا مسطحًا واحدًا).</StepChecklistItem>
<StepChecklistItem>يحتوي صف واحد على الأقل على قيمة `NULL` في عمود قابل لذلك (مثل إعارة لم تُعَد) — البيانات الحقيقية تحتوي فجوات.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لماذا يستخدم هذا المشروع عدة جداول صغيرة مترابطة بدلاً من جدول واحد عريض يضم كل الأعمدة؟ كيف سيبدو استعلام "أي عضو استعار أي كتاب" في كل شكل؟
- ماذا سينكسر لاحقًا إذا لم يُشِر `book_id` في `loans` فعليًا إلى صف حقيقي في `books`؟

## الخطوة 2: كتابة دوال الاستعلام والمخطط، بأمان

أنشئ `db_tools.py` — دوال بايثون بسيطة، دون أي استيراد لـ `mcp` على الإطلاق، سيغلّفها الخادم في الخطوة 3:

```python
# db_tools.py
import re
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "library.db"

_FORBIDDEN_KEYWORDS = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|REPLACE|ATTACH|DETACH|PRAGMA|VACUUM)\b",
    re.IGNORECASE,
)


class UnsafeQueryError(ValueError):
    """Raised when a query isn't a single, read-only SELECT."""


def list_tables(db_path: Path = DB_PATH) -> list[str]:
    conn = sqlite3.connect(db_path)
    try:
        rows = conn.execute(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        ).fetchall()
        return [row[0] for row in rows]
    finally:
        conn.close()


def run_read_only_query(sql: str, db_path: Path = DB_PATH) -> list[dict]:
    stripped = sql.strip().rstrip(";")
    if not stripped:
        raise UnsafeQueryError("Empty query.")
    if ";" in stripped:
        raise UnsafeQueryError("Only a single statement is allowed -- no ';' inside the query.")
    if not stripped.upper().startswith("SELECT"):
        raise UnsafeQueryError("Only SELECT queries are allowed.")
    if _FORBIDDEN_KEYWORDS.search(stripped):
        raise UnsafeQueryError("Query contains a write/DDL keyword, which isn't allowed.")

    # A second, independent layer of defense: open the file itself read-only
    # at the OS/SQLite level, so even a query that slipped past the text
    # checks above still can't write anything.
    uri = f"file:{Path(db_path).resolve()}?mode=ro"
    conn = sqlite3.connect(uri, uri=True)
    conn.row_factory = sqlite3.Row
    try:
        rows = conn.execute(stripped).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()
```

هناك أمران يستحقان الملاحظة. أولًا، لا يحاول `run_read_only_query` أن يكون محلّل SQL كاملًا — لا يمكنه ذلك، ليس في بضعة أسطر — لكنه لا يحتاج إلى ذلك أيضًا: رفض أي شيء يحتوي عبارة ثانية مسلسلة بفاصلة منقوطة، وأي شيء ليس `SELECT`، وأي شيء يحتوي كلمة مفتاحية للكتابة أو للمخطط، يغلق الطرق الواقعية التي يمكن أن يُحدث بها استعلام صاغه نموذج ضررًا، دون أن يدّعي التقاط كل حيلة SQL يمكن تخيّلها. ثانيًا، فتح الاتصال نفسه بمعامل URI الخاص بـ SQLite وهو `mode=ro` هو طبقة دفاع ثانية حقيقية ومستقلة عن الفحص النصي — إذا فاتت التعبيرُ النمطي شيئًا يومًا ما، فإن كون ملف قاعدة البيانات للقراءة فقط فعليًا على مستوى نظام التشغيل لا يزال يمنع حدوث كتابة. (`describe_table`، الدالة الثالثة التي يحتاجها هذا المشروع، إضافة قصيرة — راجع `examples/mcp-sqlite-server/db_tools.py` للنسخة الكاملة التي تتضمنها.)

:::tip[لا تتخطَّ فرض القراءة فقط، حتى لقاعدة بيانات تجريبية]
من المغري التفكير "إنها مجرد عرض توضيحي، لن يكتب أحد `DROP TABLE`". الأمر لا يتعلق بـ *مستخدم* خبيث — بل بأن نص الاستعلام هنا يكتبه نموذج لغوي، لا أنت، وتنتج النماذج اللغوية أحيانًا بالضبط الاستعلام الذي بدا معقولًا بالنظر إلى طلب غامض لكنه يفعل شيئًا لم تقصده. عامل أي أداة تُنفّذ SQL صاغه نموذج ضد قاعدة بيانات حقيقية باعتبارها بحاجة إلى هذا الفحص فعلًا، وليس كفكرة لاحقة — هذا هو نفس الانضباط الذي يهم (بمخاطر أعلى بكثير) أول مرة توجّه فيها أداة كهذه نحو قاعدة بيانات ليست مجرد عيّنة بنيتها لدرس.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>لا يحتوي `db_tools.py` على أي `import` لـ `mcp` في أي مكان — إنه `sqlite3` والمكتبة القياسية فقط.</StepChecklistItem>
<StepChecklistItem>يطلق `run_read_only_query("DROP TABLE books")` استثناء `UnsafeQueryError` بدلاً من التنفيذ.</StepChecklistItem>
<StepChecklistItem>يطلق `run_read_only_query("SELECT * FROM books; DROP TABLE books")` أيضًا استثناء `UnsafeQueryError` — يكتشف فحص الفاصلة المنقوطة العبارات المسلسلة.</StepChecklistItem>
<StepChecklistItem>يُعيد استعلام `SELECT` حقيقي على قاعدة بياناتك الصفوف الصحيحة كقائمة من القواميس.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يرفض كلٌّ من فحص URI بصيغة `mode=ro` والفحص النصي للكلمات المفتاحية الاستعلامات غير الآمنة. لو اضطُررت للاحتفاظ بواحد فقط، فأيّهما ستُبقي، وماذا ستخسر بإسقاط الآخر؟
- تبني `describe_table` استعلامًا باستخدام f-string (`f"PRAGMA table_info({table_name})"`) بدلاً من عنصر نائب معلمي `?`. لماذا لا يمكن لأسماء الجداول والأعمدة استخدام نفس نهج العنصر النائب `?` الذي تستخدمه القيم، وما الذي يجب أن يحدث بدلًا من ذلك للحفاظ على الأمان؟

## الخطوة 3: ربط الدوال كأدوات MCP

أنشئ `server.py`، مستوردًا الدوال من الخطوة 2 ومغلّفًا كل واحدة بـ `@mcp.tool()`، تمامًا مثل نمط `FastMCP` في مشروع بناء خادم MCP:

```python
# server.py
from mcp.server.fastmcp import FastMCP

from db_tools import DB_PATH, UnsafeQueryError, describe_table, list_tables, run_read_only_query

mcp = FastMCP("library-db")


@mcp.tool()
def list_db_tables() -> list[str]:
    """List every table in the library database.

    Call this first when you don't yet know what data is available.
    """
    return list_tables(DB_PATH)


@mcp.tool()
def describe_db_table(table_name: str) -> list[dict]:
    """Describe a table's columns: name, type, nullability, and primary key.

    Call this after list_db_tables() to learn a table's shape before
    writing a SELECT query against it.
    """
    return describe_table(table_name, DB_PATH)


@mcp.tool()
def query_db(sql: str) -> list[dict]:
    """Run a read-only SELECT query against the library database.

    Only a single SELECT statement is allowed -- no chained statements and
    no write/DDL keywords. Call list_db_tables() and describe_db_table()
    first if you're unsure what tables or columns exist.
    """
    try:
        return run_read_only_query(sql, DB_PATH)
    except UnsafeQueryError as exc:
        return [{"error": str(exc)}]


if __name__ == "__main__":
    mcp.run()
```

اختبره تمامًا كما في مشروع MCP السابق، باستخدام Inspector، قبل لمس أي عميل حقيقي:

```bash
uv run mcp dev server.py
```

استدعِ `list_db_tables`، ثم `describe_db_table` بالقيمة `"books"`، ثم `query_db` باستعلام `SELECT` حقيقي — وبشكل مقصود، مرة واحدة بشيء مثل `DROP TABLE books`، لتراه يعود برفض واضح بدلاً من خطأ على مستوى Inspector.

لاحظ أن `query_db` يلتقط `UnsafeQueryError` بنفسه ويُعيد نتيجة `{"error": ...}` بسيطة، بدلاً من ترك الاستثناء ينتشر عبر MCP. هذا خيار تصميمي صغير لكنه حقيقي: استثناء غير معالَج من استدعاء أداة يظهر عادةً للعميل كفشل غامض على مستوى البروتوكول، بينما رسالة خطأ مُعادة هي شيء يمكن للنموذج قراءته وفهمه والتفاعل معه — على سبيل المثال، بإعادة صياغة استعلامه الخاص.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يبدأ `uv run mcp dev server.py` بسلاسة ويسرد Inspector الأدوات الثلاث جميعها.</StepChecklistItem>
<StepChecklistItem>تُعيد كل من `list_db_tables` و`describe_db_table` بيانات حقيقية وصحيحة في Inspector.</StepChecklistItem>
<StepChecklistItem>يُعيد `query_db` مع استعلام `SELECT` حقيقي صفوفًا؛ ويُعيد `query_db` مع استعلام كتابة/DDL نتيجة `{"error": ...}` واضحة بدلاً من الانهيار.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يخبر التوثيق النصي (docstring) لكل أداة النموذج بما تفعله، وفي حالة `list_db_tables`، تقريبًا متى يستدعيها أولًا. ماذا سيحدث لاختيارات النموذج للأدوات لو كانت التوثيقات النصية الثلاثة تقول ببساطة `"""Database tool."""`؟
- لماذا نُغلّف `UnsafeQueryError` في قيمة مُعادة `{"error": ...}` بدلاً من تركها تنتشر حتى الأعلى؟

## الخطوة 4: الاتصال بتطبيق Claude Desktop وطرح سؤال حقيقي

أضف خادمك إلى `claude_desktop_config.json` (نفس الملف الذي استخدمه مشروع بناء خادم MCP؛ macOS: ‏`~/Library/Application Support/Claude/claude_desktop_config.json`؛ Windows: ‏`%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "library-db": {
      "command": "uv",
      "args": ["run", "--directory", "/absolute/path/to/mcp-sqlite-server", "python", "server.py"]
    }
  }
}
```

**أغلق Claude Desktop تمامًا وأعد فتحه.** بمجرد عودته، اطرح سؤالًا حقيقيًا بلغة طبيعية يحتاج أكثر من جدول واحد للإجابة عليه، على سبيل المثال:

> باستخدام أدوات library-db، ما الكتب المُعارة حاليًا ولم تُعَد بعد؟ أعطني العناوين ومن لديه كل كتاب.

راقب ما يحدث: يجب أن يستدعي Claude `list_db_tables`، ثم `describe_db_table` على `books` و`loans` و`members` لمعرفة أسماء الأعمدة، ثم يُركّب وينفّذ عبارة `SELECT ... JOIN ...` خاصة به عبر `query_db` — ويجيب باستخدام النتيجة الحقيقية، لا تخمينًا. هذا هو المكسب الحقيقي للمشروع بأكمله: لم تكتب ذلك الربط (join) بنفسك أبدًا.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يظهر `library-db` في قائمة أدوات Claude Desktop بعد إعادة تشغيل كاملة.</StepChecklistItem>
<StepChecklistItem>يُظهر طرح السؤال النموذجي أعلاه Claude يستدعي فعليًا `list_db_tables` و`describe_db_table` و`query_db` بالتسلسل، لا مجرد الإجابة من الذاكرة.</StepChecklistItem>
<StepChecklistItem>SQL الذي كتبه Claude (الظاهر في تفاصيل استدعاء الأداة الموسّعة) هو ربط (join) حقيقي متعدد الجداول، والإجابة تطابق ما ستحصل عليه من تشغيل ذلك الاستعلام بنفسك.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- كتب Claude SQL الخاص به هنا، دون أن تُريه أبدًا استعلامًا ليقلّده. ماذا في التوثيقات النصية للأدوات والمخطط الذي تُعيده `describe_db_table` أعطاه ما يكفي ليعمل عليه؟
- لو طرحت سؤالًا غامضًا — "أرني الكتب الشائعة"، لنقل، دون أي تعريف لـ"الشائعة" في مخططك — ماذا كنت ستتوقع أن يفعله Claude: تخمين تعريف، أو أن يطلب منك التوضيح، أو شيء آخر؟ جرّب ذلك.

## ⚠️ مزالق شائعة

- **الثقة بـ `table_name` مباشرةً في f-string دون التحقق منها أولًا مقابل `list_tables()`.** لا يمكن لـ `PRAGMA table_info(...)` أن يأخذ عنصرًا نائبًا `?` لاسم جدول، لذا من المغري إدراجه مباشرةً — لكن فقط بعد التأكد أنه اسم جدول حقيقي يعرفه كودك بالفعل، وليس أبدًا نصًا خامًا مُقدَّمًا من النموذج دون تحقق.
- **نسيان فحص الفاصلة المنقوطة.** مرشّح الكلمات المفتاحية وحده (حظر `DROP` و`DELETE` وغيرهما) لا يوقف `SELECT * FROM books; DROP TABLE books` إذا كنت تبحث عن الكلمات المفتاحية في العبارة *الأولى* فقط — ارفض عند أي فاصلة منقوطة في الاستعلام، لا عند الكلمات المفتاحية الممنوعة فقط.
- **مسار نسبي، أو نسيان إعادة تشغيل Claude Desktop بالكامل، في الخطوة 4.** نفس المزلقين في مشروع بناء خادم MCP — يحتاج Claude Desktop إلى مسار مطلق في الإعداد ولا يقرأه إلا بعد إعادة تشغيل كاملة، وليس مجرد إغلاق النافذة وإعادة فتحها.
- **تشغيل الخادم بـ `python server.py` العادي بدلاً من `uv run python server.py`.** بدون `uv run`، قد لا تكون داخل البيئة الافتراضية التي ثبّت فيها `uv add` حزمة `mcp`، فتحصل على `ModuleNotFoundError`.

## ما بنيته للتو

نموذج حقيقي، وإن كان صغيرًا، لنمط مفيد فعلًا خارج حدود درس: عميل نموذج لغوي يجيب عن أسئلة بلغة طبيعية حول بيانات مهيكلة لم يرها من قبل، عبر اكتشاف المخطط وكتابة SQL خاص به من خلال أدوات عرضتَها — مع حد أمان حقيقي بين "القراءة" و"الكتابة" مفروض في كودك أنت، لا مُفترَض تلقائيًا. قاعدة البيانات هنا مكتبة تجريبية، لكن لا شيء في `list_db_tables` أو `describe_db_table` أو فرض القراءة فقط في `query_db` مخصص لتلك التجربة — وجّه نفس الخادم إلى ملف SQLite مختلف وسيعمل دون تعديل.

## إلى أين تذهب من هنا

- وجّه هذا الخادم إلى قاعدة بيانات SQLite حقيقية تستخدمها فعلًا — تصدير مالي شخصي، بيانات مشروع صغير، أي شيء لديك بالفعل كملف `.db` — وشاهد كيف تصمد نفس الأدوات الثلاث أمام مخطط حقيقي وأسئلة حقيقية.
- أضف حدًا لعدد الصفوف أو حجم النتيجة إلى `run_read_only_query`، حتى لا يُعيد `SELECT *` واسع على جدول أكبر بكثير نتيجة ضخمة بشكل غير معقول إلى النموذج.
- اقرأ عن **موارد** MCP — يغطي هذا المشروع *الأدوات* فقط، لكن معلومات المخطط التي تُعيدها `describe_db_table` قد تكون في الواقع أنسب لمورد (بيانات قابلة للقراءة) منها لأداة (إجراء). تغطي [توثيقات SDK نفسه](https://github.com/modelcontextprotocol/python-sdk) هذا الفرق.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي — لمنطق الأدوات على الأقل]
يحتوي [`examples/mcp-sqlite-server/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/mcp-sqlite-server) في مستودع الدورة على ملفات `seed.py` و`db_tools.py` و`server.py` الكاملة من هذا الدرس، بالإضافة إلى دفتر ملاحظات يعرض دوال الاستعلام/المخطط بمعزل. استنسخه، أو افتح المستودع بأكمله في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، لتجربة الأدوات الثلاث جميعها باستخدام `uv run mcp dev server.py` — مع تذكّر أن اتصال Claude Desktop الحقيقي لا يزال يجب أن يحدث محليًا، وفق "أين تُشغّل هذا" أعلاه.
:::

## شارك مشروعك مع الصف

هل بنيت شيئًا تفخر به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع أرسلها طلاب آخرون — وملف README الخاص به يحتوي شرحًا كاملًا وسهلًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل: عمل fork للمستودع، وإنشاء فرع، وعمل commit لملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترض أي خبرة سابقة بـ git.

مرحبًا بك في ترك الذكاء الاصطناعي يكتب SQL الخاص به — بحذر. 🎓

<ProjectProgressCheckbox projectId="2027-mcp-sqlite-server" />
