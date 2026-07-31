---
id: 2027-mcp-notes-server
title: "بناء خادم MCP لملاحظاتك"
sidebar_label: "بناء خادم MCP لملاحظاتك"
slug: /projects/mcp-notes-server
description: "فهرس مجلد Markdown حقيقي لملاحظات واعرضه لـClaude Desktop كأدوات قابلة للبحث بـModel Context Protocol -- خادم MCP لقاعدة معرفة شخصية مفيد فعليًا، لا مجرد لعبة."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 بناء خادم MCP لملاحظاتك

<ProjectPublishedDate projectId="2027-mcp-notes-server" />

<ProjectGreeting />

هذا يفترض Python 101 وارتياحًا في كتابة دوال بسيطة -- ويساعد كثيرًا أن تكون قد بنيت مشروع [بناء خادم MCP](/docs/projects/mcp-server) أولًا، إذ يعيد هذا استخدام نفس نمط زخرفة `FastMCP` ويضيف فقط محتوى حقيقيًا للبحث فيه بدلًا من أداتين تجريبيتين. إنه اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/docs/projects) للاطلاع على القائمة الكاملة والنامية.

إن كنت تحتفظ بملاحظات في Obsidian، أو Notion، أو مجرد مجلد بسيط من ملفات Markdown، يحوّل هذا المشروع ذلك المجلد إلى شيء يستطيع مساعد ذكاء اصطناعي البحث فيه والقراءة منه مباشرة فعليًا -- لا بلصق محتوى الملاحظات في نافذة دردشة، بل بمنح Claude Desktop أدوات حقيقية: البحث في ملاحظاتك بكلمة مفتاحية، أو سحب ملاحظة كاملة بعنوانها، أو سرد ما لمسته مؤخرًا. إنها نفس فكرة Model Context Protocol من مشروع MCP السابق، موجَّهة نحو شيء ستستمر على الأرجح في استخدامه بعد ذلك.

## 🎯 ما ستفعله

1. تثبيت `uv` وإعداد مشروع صغير بـSDK بايثون الرسمي لـMCP.
2. فهرسة مجلد حقيقي من ملاحظات Markdown نموذجية -- تحميلها من القرص، واستخراج العناوين وأوقات التعديل.
3. كتابة دوال بحث واستعلام كبايثون بسيط، واختبارها قبل أن يُشارَك أي كود MCP.
4. ربط تلك الدوال كأدوات MCP بـ`FastMCP`، وتوصيل الخادم بـClaude Desktop.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي والموصى به هنا، أكثر من معظم مشاريع هذه السلسلة -- الغاية بأكملها هي توصيل خادمك بـClaude Desktop، وClaude Desktop تطبيق مثبَّت على جهازك الخاص يحتاج إطلاق عملية محلية يستطيع التحدث معها مباشرة. لا مفر من عمل الخطوة الأخيرة على الأقل محليًا.

**GitHub Codespaces** مكان معقول لكتابة واختبار منطق الفهرسة والبحث نفسه: افتح [مستودع الدورة كاملًا في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython وuv مثبّتة بالفعل، وفق `.devcontainer/devcontainer.json` الخاص بالمستودع)، واكتب `server.py` ومجلد ملاحظات نموذجية، واستدعِ دوالك مباشرة في shell بايثون، أو شغّل `mcp dev server.py` واستخدم Inspector عبر منفذ Codespace المُوجَّه. ما لا يستطيع Codespace أن يكونه هو نقطة اتصال Claude Desktop النهائية الخاصة بك -- الوصول إلى Codespace من تطبيق سطح مكتب سيحتاج نفقًا إضافيًا خارج نطاق هذا المشروع. عامِل Codespaces كجيد للخطوات 1–3، وافعل الخطوة 4 محليًا.

**Google Colab وKaggle غير مناسبين للخادم الفعلي**، تمامًا كمشروع MCP السابق -- تخطَّهما للشيء الحقيقي. لا يمنحك أي منهما عملية محلية مستمرة يستطيع عميل ذكاء اصطناعي لسطح المكتب الاتصال بها؛ خلية دفتر ملاحظات "تُشغِّل خادمًا" في Colab غير قابلة للوصول من Claude Desktop على جهازك الخاص على الإطلاق.

مع ذلك، إن أردت فقط استكشاف دوال البحث والاستعلام كبايثون بسيط -- بلا بروتوكول MCP، بلا عملية خادم، بلا Claude Desktop -- يوجد دفتر ملاحظات أضيق لذلك بالضبط. يعرض دوال البحث/الاستعلام الأساسية بمعزل، لا خادم MCP الحي:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/mcp-notes-server/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/mcp-notes-server/notebook.ipynb)

يستدعي نفس منطق الأدوات مباشرة كدوال عادية، بلا زخرفة، بلا خادم، وبلا اتصال عميل -- مفيد للتجريب مع الكود، لا بديل عن المشروع الفعلي أدناه.

## الإعداد

`uv` أداة واحدة تحل محل السلسلة المعتادة "ثبّت Python، ثم ثبّت pip، ثم ثبّت أداة بيئة افتراضية، ثم ثبّت الحزم" -- يمكنها تثبيت وإدارة إصدارات Python بنفسها، إلى جانب تبعيات مشروعك.

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

ثم أعِدَّ مشروعًا وثبّت SDK بايثون الرسمي لـMCP، بإضافته الاختيارية `cli` (هذا ما يمنحك أمر `mcp dev` المُستخدَم لاحقًا):

```bash
uv init mcp-notes-server
cd mcp-notes-server
uv add "mcp[cli]"
```

لا يُحتاج أي مفتاح API في أي مكان في هذا المشروع -- إنه بحث محلي خالص على ملفات موجودة بالفعل على قرصك، بلا أي استدعاء نموذج لغوي متضمَّن في منطق الفهرسة أو البحث نفسه.

## الخطوة 1: فهرس مجلد ملاحظات نموذجية

أنشئ مجلد `notes/` بجانب حيث سيعيش `server.py`، وضع حفنة من ملفات `.md` حقيقية فيه -- وصفة، بضع ملاحظات كتب، قائمة أفكار مشاريع، أيًّا كان ما لديك فعليًا. كل ملاحظة تحتاج فقط عنوان `# Title` قرب البداية؛ لا شيء آخر بخصوص بنيتها يهم. إن لم يكن لديك ملاحظات حقيقية في متناول اليد بعد، اكتب 4–5 قصيرة الآن -- مواضيع مختلفة فعليًا، لا أربع تنويعات على نفس الشيء، لكي تعني نتائج البحث لاحقًا شيئًا فعليًا.

ثم اكتب كود التحميل في `server.py`:

```python
# server.py
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

NOTES_DIR = Path.home() / "path" / "to" / "notes"  # adjust this to your real notes folder


@dataclass
class Note:
    path: Path
    title: str
    body: str
    modified: float


def _load_note(path: Path) -> Note:
    """Read one .md file off disk and pull its title from the first '# ' heading."""
    text = path.read_text(encoding="utf-8", errors="ignore")
    title = path.stem
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("# "):
            title = stripped[2:].strip()
            break
    return Note(path=path, title=title, body=text, modified=path.stat().st_mtime)


def _all_notes() -> list[Note]:
    """Load every .md file in NOTES_DIR fresh each call -- cheap at personal-notes
    scale, and it means edits on disk show up immediately, with no cache to invalidate."""
    if not NOTES_DIR.exists():
        return []
    return [_load_note(p) for p in sorted(NOTES_DIR.glob("*.md"))]
```

لا شيء هنا خاص بـMCP بعد -- إنه إدخال/إخراج ملفات عادي. هذا متعمَّد: اجعل الفهرسة تعمل بشكل صحيح بمفردها، بـshell بايثون بسيط، قبل أن يدخل أي كود بروتوكول في الصورة.

```bash
uv run python -c "from server import _all_notes; print([n.title for n in _all_notes()])"
```

يجب أن ترى عنوان كل ملاحظة مطبوعًا. إن كانت القائمة فارغة، فـ`NOTES_DIR` خاطئ قبل أي شيء آخر.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يحتوي `notes/` على 4 ملاحظات `.md` حقيقية ومختلفة فعليًا على الأقل، كل واحدة بعنوان `# Title`.</StepChecklistItem>
<StepChecklistItem>تُعيد `_all_notes()` `Note` واحدة لكل ملف، بالعنوان الصحيح مُستخرَجًا من كل عنوان.</StepChecklistItem>
<StepChecklistItem>يشير `NOTES_DIR` إلى مجلد حقيقي موجود فعليًا على جهازك.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تُعيد `_all_notes()` تحميل كل ملف من القرص في كل استدعاء، بلا تخزين مؤقت. في أي نقطة -- مئات الملاحظات؟ آلاف؟ -- سيتوقف ذلك عن كونه "رخيصًا بما يكفي"، وماذا كنت لتغيّر أولًا؟
- ماذا يحدث الآن لو كانت ملاحظة بلا عنوان `# ` على الإطلاق؟ هل هذا السلوك الذي تريده، أم تفضّل أن تفشل بصوت عالٍ؟

## الخطوة 2: ابنِ دوال البحث والاستعلام

مع تحميل الملاحظات بشكل صحيح، اكتب الدوال التي تجيب فعليًا عن أسئلة حولها -- لا تزال بايثون بسيطة، لا تزال قابلة للاختبار بلا أي عميل ذكاء اصطناعي في الحلقة:

```python
import time


def search_notes(query: str) -> str:
    """Search every note for a keyword and report which notes mention it."""
    query_lower = query.lower()
    matches = []
    for note in _all_notes():
        for line in note.body.splitlines():
            if query_lower in line.lower():
                matches.append(f'"{note.title}": {line.strip()[:160]}')
                break  # one hit per note is enough context
    if not matches:
        return f"No notes mention '{query}'."
    return "Found in:\n" + "\n".join(matches)


def get_note_by_title(title: str) -> str:
    """Return the full text of one note, matched by exact or partial title."""
    title_lower = title.lower()
    notes = _all_notes()

    exact = [n for n in notes if n.title.lower() == title_lower]
    if len(exact) == 1:
        return exact[0].body

    partial = [n for n in notes if title_lower in n.title.lower()]
    if len(partial) == 1:
        return partial[0].body
    if len(partial) > 1:
        titles = ", ".join(f'"{n.title}"' for n in partial)
        return f"Multiple notes match '{title}': {titles}. Be more specific."

    return f"No note titled '{title}' found."


def list_recent_notes(limit: int = 5) -> str:
    """List the most recently modified notes, newest first."""
    notes = sorted(_all_notes(), key=lambda n: n.modified, reverse=True)[:limit]
    if not notes:
        return "No notes found."

    now = time.time()
    lines = []
    for note in notes:
        age_days = (now - note.modified) / 86400
        age = "today" if age_days < 1 else f"{int(age_days)} days ago"
        lines.append(f'"{note.title}" ({age})')
    return "\n".join(lines)
```

ترفض `get_note_by_title` عمدًا التخمين عندما يطابق عنوان جزئي أكثر من ملاحظة واحدة، بدلًا من إعادة أول تطابق بصمت -- إعادة المحتوى الكامل للملاحظة الخاطئة إلى مساعد ذكاء اصطناعي (ولاحقًا، إليك) أسوأ من طلب عنوان أكثر تحديدًا.

اختبر الثلاثة يدويًا قبل المتابعة، بنفس طريقة اختبار `_all_notes()`:

```bash
uv run python -c "from server import search_notes; print(search_notes('your-keyword'))"
```

:::tip[اختبر الدوال البسيطة قبل أن يلمسها أي كود بروتوكول]
كل خطأ أسهل إيجادًا هنا من بعد أن يختلط `@mcp.tool()` وInspector وClaude Desktop كلها معًا في آنٍ واحد. إذا أعادت `search_notes` شيئًا خاطئًا الآن، تعرف بيقين أن الخطأ في هذه الدالة -- لا في اتصال، أو ملف إعداد، أو اختيار أدوات النموذج نفسه.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>تجد `search_notes` كلمة مفتاحية تعرف أنها في إحدى ملاحظاتك، وتُعيد مقتطفًا حقيقيًا وصحيحًا.</StepChecklistItem>
<StepChecklistItem>تُعيد `get_note_by_title` نص الملاحظة الكامل لعنوان دقيق، ورسالة حقيقية "كن أكثر تحديدًا" لعنوان جزئي غامض.</StepChecklistItem>
<StepChecklistItem>تُعيد `list_recent_notes` الملاحظات بالترتيب الصحيح -- الأحدث تعديلًا أولًا.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تُعيد `search_notes` مقتطفًا واحدًا كحد أقصى لكل ملاحظة، حتى لو ظهرت كلمة مفتاحية عدة مرات في نفس الملف. ماذا ستخسر، أو تكسب، بإعادة كل سطر مطابق بدلًا من ذلك؟
- لو كان لديك ملاحظتان بعناوين متطابقة (في مجلدين مختلفين، لنقل)، أي من الدوال الثلاث اليوم ستسيء التصرف أولًا، وكيف؟

## الخطوة 3: اربطها كأدوات MCP بـFastMCP

كل شيء حتى الآن كان بايثون بسيطة. تحويله إلى خادم MCP هو زخرفة واحدة لكل دالة -- بلا كود على مستوى البروتوكول يُكتَب يدويًا:

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("notes")  # the name your AI client will show for this server


@mcp.tool()
def search_notes(query: str) -> str:
    """Search every note for a keyword and report which notes mention it.

    Looks through each .md file in the notes folder (case-insensitive) and
    returns each matching note's title plus one line of surrounding context.
    Call this when someone asks whether, or where, a topic comes up in their
    notes -- e.g. "do I have any notes about sourdough?".
    """
    ...  # same body as Step 2


@mcp.tool()
def get_note_by_title(title: str) -> str:
    """Return the full text of one note, matched by title.

    Matching is case-insensitive and allows a partial match as long as
    exactly one note matches; ambiguous partial matches are reported
    instead of guessed. Call this once search_notes (or the user) has
    identified which note they want in full, not as a first-pass search tool.
    """
    ...  # same body as Step 2


@mcp.tool()
def list_recent_notes(limit: int = 5) -> str:
    """List the most recently modified notes, newest first.

    Reports each note's title and how long ago it was last edited. Call
    this when someone asks what they've been working on lately, or wants
    a quick overview of the notes folder without searching for anything
    specific.
    """
    ...  # same body as Step 2


if __name__ == "__main__":
    mcp.run()
```

تفحص `@mcp.tool()` اسم كل دالة، ومعاملاتها المُلمَّح بأنواعها، وتوثيقها، وتبني تعريف أداة MCP تلقائيًا -- يقرأ النموذج توثيقك، لا كودك، ليقرر متى تطابق أداة طلبًا. مع ثلاث أدوات الآن بدلًا من واحدة، تهم التوثيقات التي تميّز بوضوح *متى* تستدعي كل واحدة أكثر مما كانت تهم مع أداة واحدة: لاحظ أن توثيق `get_note_by_title` يقول صراحة إنه لما بعد البحث، لا بدلًا منه.

قبل لمس أي عميل ذكاء اصطناعي حقيقي، شغّل أمر dev/inspector الخاص بـSDK واختبر الأدوات الثلاث يدويًا:

```bash
uv run mcp dev server.py
```

يفتح هذا **MCP Inspector** -- أداة مجانية قائمة على المتصفح تتيح لك استدعاء كل أداة بوسائط حقيقية ورؤية قيم إعادة حقيقية، بلا أي نموذج ذكاء اصطناعي متضمَّن. تأكد أن الأدوات الثلاث تعمل هنا أولًا.

:::tip[ثلاث أدوات أكثر من كافية لرؤية أن التوثيقات تهم]
بأداة واحدة، ليس لدى النموذج شيء ليختار بينه. بثلاث، جرّب سؤال prompts Inspector الأساسية (أو، بمجرد الاتصال، Claude Desktop نفسه) شيئًا غامضًا، مثل "أخبرني عن ملاحظة المعكرونة الخاصة بي" -- وراقب ما إذا لجأ إلى `search_notes` أو `get_note_by_title` أولًا. إن اختار "الخاطئة"، فهذا دائمًا تقريبًا مشكلة توثيق، لا خطأ في دالتك.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يُعرِّف `server.py` الأدوات الثلاث بـ`@mcp.tool()` وتوثيقات حقيقية ومحددة.</StepChecklistItem>
<StepChecklistItem>يبدأ `uv run mcp dev server.py` دون أخطاء ويسرد Inspector الأدوات الثلاث.</StepChecklistItem>
<StepChecklistItem>استدعاء كل أداة يدويًا في Inspector يُعيد نفس النتائج الصحيحة التي رأيتها بالفعل في الخطوة 2.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- الآن بوجود ثلاث أدوات بدلًا من واحدة، كيف كنت لتقرر ما إذا كانت أداة جديدة تنتمي لهذا الخادم، أم يجب أن تبقى دالة مساعدة خاصة لا يراها أي عميل أبدًا؟
- لو لم يذكر توثيق `list_recent_notes` "على ماذا كنت أعمل مؤخرًا"، هل تتوقع أن يستدعيها النموذج مع ذلك لتلك الصياغة؟ ماذا يقترح ذلك عن مدى الحرفية في كتابة هذه؟

## الخطوة 4: وصّله بـClaude Desktop وجرّبه

يدعم المستوى المجاني لـ[Claude Desktop](https://claude.ai/download) الاتصال بخوادم MCP محلية. يقرأ ملف إعداد JSON يخبره بأي خوادم يُطلِق وكيف:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

إن لم يكن الملف موجودًا بعد، أنشئه. أضف خادمك، مستخدمًا مسارًا **مطلقًا** لمجلد مشروعك:

```json
{
  "mcpServers": {
    "notes": {
      "command": "uv",
      "args": ["run", "--directory", "/absolute/path/to/mcp-notes-server", "python", "server.py"]
    }
  }
}
```

يصف `command` و`args` بالضبط العملية التي سيُطلقها Claude Desktop للتحدث مع خادمك -- نفس استدعاء `uv run` الذي اختبرته بالفعل في الخطوة 3، فقط بدأه Claude Desktop بدلًا منك. استخدام `uv run` (بدلًا من `python` عادي) يهم هنا: يُطلِق Claude Desktop هذا الأمر في بيئته الخاصة، بلا ضمان أن بيئتك الافتراضية الخاصة بمشروعك نشطة بالفعل، ويجد `uv run` الصحيحة ويستخدمها بنفسه.

**أغلق Claude Desktop تمامًا وأعد تشغيله** -- لا تُعيد نسخة قيد التشغيل قراءة هذا الملف بنفسها. بمجرد إعادة تشغيله، يجب أن يظهر خادمك في قائمة أدواته/موصِّلاته. جرّب أسئلة مثل:

> Do I have any notes about sourdough? Use the notes tools if you have them.
>
> What have I been working on most recently, based on my notes?
>
> Pull up my full "side project ideas" note.

يجب أن يُظهر Claude Desktop أنه يستدعي `search_notes`، أو `list_recent_notes`، أو `get_note_by_title` (غالبًا ككتلة صغيرة قابلة للطي "استخدم أداة"، بالوسائط والنتيجة مرئية إن وسّعتها)، ثم يجيب مستخدمًا النتيجة الحقيقية التي أعادتها دالتك -- لا تخمينًا.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يظهر `notes` (أو اسم الخادم الذي اخترته) في قائمة أدوات/موصِّلات Claude Desktop بعد إعادة تشغيل كاملة.</StepChecklistItem>
<StepChecklistItem>السؤال عن موضوع تعرف أنه في إحدى ملاحظاتك يُظهر فعليًا Claude يستدعي أداة، لا يجيب فقط من الذاكرة أو يخمّن.</StepChecklistItem>
<StepChecklistItem>سؤال Claude سحب ملاحظة محددة بالاسم يُعيد محتواها الحقيقي الكامل.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لو سألت Claude Desktop شيئًا لا تقول ملاحظاتك عنه شيئًا، هل تتوقع أن يستدعي أداة على أي حال ويُبلِّغ "لم يُعثر على شيء"، أم يجيب من المعرفة العامة بدلًا من ذلك؟ ماذا حدث، ولماذا تعتقد ذلك؟
- الآن بوصول هذا فعليًا، ما أول شيء بخصوص مجلد ملاحظاتك الحقيقي سيكسر هذه الدوال لو وجّهت `NOTES_DIR` إليه اليوم؟

## ⚠️ مآزق شائعة

- **مسار نسبي أو خاطئ في ملف الإعداد.** يحتاج `claude_desktop_config.json` مسارًا مطلقًا لمجلد مشروعك -- المسار النسبي لا يملك "دليلًا حاليًا" ثابتًا للحل ضده عندما يُطلِق Claude Desktop خادمك، وسيفشل ببساطة في بدئه.
- **نسيان إعادة تشغيل Claude Desktop بالكامل بعد تعديل الإعداد.** حفظ ملف JSON وحده لا يفعل شيئًا -- يقرأه التطبيق فقط عند البدء، لذا إغلاق وإعادة فتح نافذة ليس كافيًا أيضًا؛ أغلق التطبيق تمامًا أولًا.
- **`get_note_by_title` تُعيد الملاحظة الخاطئة بصمت.** لو تخطيت التحقق من "أكثر من تطابق جزئي واحد" وأعدت فقط أول تطابق، سيطابق عنوان مثل "notes" الملف الخاطئ بصمت في اللحظة التي يكون لديك فيها ملاحظتان بأسماء متشابهة -- يستحق الاختبار بعناوين غامضة عمدًا قبل الثقة بها.
- **توثيق غامض جدًا لكي يختار النموذج الأداة الصحيحة من ثلاث.** لا يعطي `"""Gets a note."""` النموذج شيئًا ليميّز `get_note_by_title` عن `search_notes`. قل بوضوح ماذا تفعل كل أداة ومتى تستدعيها، بالطريقة التي تفعلها التوثيقات أعلاه.
- **تشغيل الخادم بـ`python server.py` عادي بدلًا من `uv run python server.py`.** بدون `uv run`، قد لا يكون المُفسِّر الذي يبدأ هو الذي ثبَّت `uv add` فيه `mcp`، وستحصل على `ModuleNotFoundError` لـ`mcp` رغم أن `uv add` قال بوضوح إنه ثُبِّت بنجاح.

## ما بنيته للتو

خادم MCP مستقل يحوّل مجلدًا حقيقيًا من ملاحظاتك الخاصة إلى شيء يستطيع مساعد ذكاء اصطناعي البحث فيه والقراءة منه مباشرة، باستخدام ثلاث أدوات بمهام مختلفة فعليًا -- بحث بكلمة مفتاحية، واستعلام دقيق، وسرد بالحداثة -- بدلًا من دالة واحدة تشمل كل شيء. يعمل نفس الخادم دون تعديل مع أي عميل متوافق مع MCP، لا Claude Desktop فقط، ومنطق الفهرسة تحته ليس فيه شيء خاص بـMCP على الإطلاق: إنه فقط ملفات على القرص، تُقرَأ طازجة في كل استدعاء.

## إلى أين تذهب من هنا

- وجّه `NOTES_DIR` إلى خزنة Obsidian حقيقية، أو تصدير Notion، أو مجلد ملاحظات بسيط بدلًا من الملاحظات النموذجية التي بدأت بها، وانظر ماذا ينكسر -- أنماط عناوين غير متسقة، ملفات ضخمة، مرفقات غير Markdown مختلطة.
- أضف أداة تصفّي حسب وسم، إن كانت ملاحظاتك الحقيقية تستخدم اتفاقية `tags:` كما تفعل الملاحظات النموذجية هنا -- نفس شكل `search_notes`، لكن تطابق حقلًا مُهيكَلًا بدلًا من نص حر.
- اقرأ عن **الموارد** و**الـprompts** في MCP -- يغطي هذا الدرس *الأدوات* فقط، لكن البروتوكول يُعرِّف أيضًا طرقًا لعرض بيانات قابلة للقراءة (موارد) وقوالب prompt قابلة لإعادة الاستخدام (prompts) لعميل. تغطي [وثائق SDK نفسها](https://github.com/modelcontextprotocol/python-sdk) كليهما، بنفس أسلوب زخرفة `FastMCP`.
- بما أن المواصفة تتطور بنشاط، أعد التحقق دوريًا من [وثائق MCP الرسمية](https://modelcontextprotocol.io) لأي شيء تغيّر منذ أن بنيت هذا.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي -- لمنطق الأدوات، على الأقل]
[`examples/mcp-notes-server/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/mcp-notes-server) في مستودع الدورة نسخة أكمل قليلًا من الكود أعلاه، بـ7 ملاحظات نموذجية حقيقية مكتوبة بالفعل والأدوات الثلاث مُطبَّقة. استنسخه، أو افتح المستودع كاملًا في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، لتجربة الأدوات الثلاث بـ`uv run mcp dev server.py` -- متذكرًا أن اتصال Claude Desktop الفعلي لا يزال يحتاج أن يحدث محليًا، وفق "أين تُشغّل هذا" أعلاه.
:::

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها -- وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓

<ProjectProgressCheckbox projectId="2027-mcp-notes-server" />
