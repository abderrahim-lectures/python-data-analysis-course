---
title: "قاعدة معرفة شخصية"
description: "ابنِ قاعدة معرفة قابلة للبحث مع بحث كامل النص وعلامات وملاحظات Markdown."
difficulty: "beginner"
estimatedMinutes: 45
xpReward: 50
tags: ["cli", "json", "search", "file-io"]
prerequisites: ["أساسيات بايثون (المتغيرات، الحلقات، الدوال، القواميس)", "قراءة/كتابة الملفات الأساسية"]
---

# قاعدة معرفة شخصية

ابنِ قاعدة معرفة شخصية تخزّن الملاحظات مع بيانات وصفية غنية، وتسمح لك بالبحث في كل شيء فورًا، وتنظّم الأفكار بالعلامات، وتعرض المحتوى بصيغة Markdown، وتصدّر كل ذلك إلى موقع HTML ثابت. يجمع هذا المشروع بين القواميس وقراءة/كتابة الملفات ومعالجة النصوص وتوليد القوالب في أداة يمكنك استخدامها فعلًا.

- **شغّله في المتصفح.** هناك دفتر ملاحظات تفاعلي جاهز — افتحه على Colab أو Kaggle أو Binder وتابع خطوة بخطوة.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/knowledge-base/notebook.ar.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/knowledge-base/notebook.ar.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fknowledge-base%2Fnotebook.ar.ipynb)

## ما ستتعلمه

1. تصميم مخطط لتخزين المعرفة باستخدام القواميس وJSON
2. تنفيذ بحث كامل النص عبر كل محتوى الملاحظات
3. بناء نظام علامات للتنظيم المرن
4. دعم عرض Markdown في الطرفية
5. تصدير قاعدة المعرفة إلى موقع HTML ثابت

## ما ستبنيه

قاعدة معرفة شخصية تتيح لك:

- **تخزين الملاحظات** مع العنوان والمحتوى والعلامات والطوابع الزمنية كبيانات JSON على القرص
- **بحث كامل النص** عبر كل محتوى الملاحظات بمطابقة غير حساسة لحالة الأحرف
- **التصفية بالعلامات** ونطاقات التاريخ للعثور على ما تحتاجه بالضبط
- **عرض Markdown** مع تمييز بناء الجملة في الطرفية
- **التصدير إلى HTML** — موقع ثابت واحد يمكنك فتحه في أي متصفح

## الإعداد

```bash
uv init knowledge-base
cd knowledge-base
```

لا حاجة إلى حزم خارجية — يستخدم التطبيق مكتبة Python القياسية فقط (`json` و`os` و`datetime` و`pathlib` و`html`).

## الخطوة 1 — تصميم نموذج البيانات

تحتاج كل ملاحظة إلى شكل ثابت بحيث يمكن لبقية التطبيق الاعتماد على نفس الحقول. سنخزّن الملاحظات كقائمة قواميس في ملف JSON. ستحتوي كل ملاحظة على الحقول `id` و`title` و`content` و`tags` و`created_at` و`updated_at`.

أنشئ ملفًا باسم `knowledge.py` وعرّف نموذج البيانات وطبقة التخزين:

```python
import json
import os
from datetime import datetime, timezone
from pathlib import Path

DATA_DIR = Path("data")
KB_FILE = DATA_DIR / "knowledge.json"

def ensure_data_dir():
    """Create the data directory if it doesn't exist."""
    DATA_DIR.mkdir(exist_ok=True)

def load_notes() -> list[dict]:
    """Load all notes from the JSON file."""
    ensure_data_dir()
    if not KB_FILE.exists():
        return []
    with open(KB_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_notes(notes: list[dict]) -> None:
    """Save all notes to the JSON file."""
    ensure_data_dir()
    with open(KB_FILE, "w", encoding="utf-8") as f:
        json.dump(notes, f, indent=2, ensure_ascii=False)

def generate_id(notes: list[dict]) -> int:
    """Return the next available note ID."""
    if not notes:
        return 1
    return max(note["id"] for note in notes) + 1

# Quick test
ensure_data_dir()
notes = load_notes()
print(f"Data directory: {DATA_DIR.resolve()}")
print(f"Notes loaded: {len(notes)}")
print(f"Notes file: {KB_FILE}")
```

**🎯 الناتج المتوقع :**

```
Data directory: /home/user/knowledge-base/data
Notes loaded: 0
Notes file: data/knowledge.json
```

**🩹 إذا لم يعمل :**

- إذا رأيت `FileNotFoundError`، فتأكد من استدعاء `DATA_DIR.mkdir(exist_ok=True)` قبل الوصول إلى الملف.
- إذا بدا المسار خاطئًا، فتأكد من تشغيل السكربت من جذر المشروع.

**✅ قائمة التحقق**

- ✅ يُنشأ مجلد `data/` تلقائيًا عند تشغيل السكربت
- ✅ `load_notes()` يعيد قائمة فارغة عندما لا يوجد ملف بعد
- ✅ `save_notes()` يكتب ملف JSON صالحًا

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لماذا تخزّن الملاحظات بصيغة JSON بدلًا من نص عادي؟ ما الذي ستخسره إذا كانت كل ملاحظة ملف `.txt` منفصلًا؟

---

## الخطوة 2 — إضافة الملاحظات وتحريرها

الآن بعد أن أصبحنا قادرين على التحميل والحفظ، لنبنِ الدالة التي تنشئ ملاحظة جديدة. تأخذ عنوانًا ومحتوى وعلامات اختيارية، وتعيّن معرفًا وطوابع زمنية، وتضيفها إلى القائمة. سنضيف أيضًا دوالًا لتحرير الملاحظات وحذفها.

أضف هذه الدوال إلى `knowledge.py`:

```python
def create_note(title: str, content: str, tags: list[str] | None = None) -> dict:
    """Create a new note and save it."""
    notes = load_notes()
    now = datetime.now(timezone.utc).isoformat()
    note = {
        "id": generate_id(notes),
        "title": title.strip(),
        "content": content.strip(),
        "tags": [tag.strip().lower() for tag in (tags or [])],
        "created_at": now,
        "updated_at": now,
    }
    notes.append(note)
    save_notes(notes)
    return note

def get_note_by_id(note_id: int) -> dict | None:
    """Return a single note by its ID, or None if not found."""
    notes = load_notes()
    for note in notes:
        if note["id"] == note_id:
            return note
    return None

def edit_note(note_id: int, title: str | None = None, content: str | None = None) -> bool:
    """Update the title and/or content of an existing note."""
    notes = load_notes()
    for note in notes:
        if note["id"] == note_id:
            if title is not None:
                note["title"] = title.strip()
            if content is not None:
                note["content"] = content.strip()
            note["updated_at"] = datetime.now(timezone.utc).isoformat()
            save_notes(notes)
            print(f"  Updated note {note_id}: {note['title']}")
            return True
    print(f"  Note {note_id} not found")
    return False

def delete_note(note_id: int) -> bool:
    """Delete a note by ID. Returns True if deleted."""
    notes = load_notes()
    original_count = len(notes)
    notes = [note for note in notes if note["id"] != note_id]
    if len(notes) < original_count:
        save_notes(notes)
        print(f"  Deleted note {note_id}")
        return True
    print(f"  Note {note_id} not found")
    return False

# Test it out
note1 = create_note(
    "Python List Comprehensions",
    "List comprehensions provide a concise way to create lists.\nExample: [x**2 for x in range(10)]",
    tags=["python", "basics"]
)
note2 = create_note(
    "Git Rebase vs Merge",
    "Rebase rewrites commit history to create a linear timeline.\nMerge preserves the full branch history with a merge commit.",
    tags=["git", "workflow"]
)
note3 = create_note(
    "Python Virtual Environments",
    "Use venv to create isolated Python environments.\nCommands: python -m venv .venv && source .venv/bin/activate",
    tags=["python", "tools"]
)

print(f"Created note {note1['id']}: {note1['title']}")
print(f"Created note {note2['id']}: {note2['title']}")
print(f"Created note {note3['id']}: {note3['title']}")
print(f"\nTotal notes: {len(load_notes())}")

# Test edit
edit_note(2, title="Git: Rebase vs Merge")

# Verify the edit
note = get_note_by_id(2)
print(f"After edit: {note['title']}")
```

**🎯 الناتج المتوقع :**

```
Created note 1: Python List Comprehensions
Created note 2: Git Rebase vs Merge
Created note 3: Python Virtual Environments

Total notes: 3
  Updated note 2: Git: Rebase vs Merge
After edit: Git: Rebase vs Merge
```

**🩹 إذا لم يعمل :**

- إذا لم تكن المعرفات متسلسلة، فتحقق من أن `load_notes()` تقرأ القائمة الحالية قبل توليد المعرف التالي.
- يجب أن تكون العلامات بأحرف صغيرة — إذا رأيت أحرفًا مختلطة الحالة، فقائمة الفهم في `create_note` لا تعمل.
- إذا بدا أن `edit_note` لا يحفظ، فتحقق من أنك تمرر `title=` و`content=` كوسائط كلمات مفتاحية.

**✅ قائمة التحقق**

- ✅ تحصل كل ملاحظة على معرف فريد متزايد
- ✅ تُطبَّع العلامات إلى أحرف صغيرة وتُزال المسافات البيضاء
- ✅ يُضبط `created_at` و`updated_at` على طوابع ISO زمنية بتوقيت UTC
- ✅ `edit_note()` يحذّث فقط الحقول التي تمررها، تاركًا الأخرى دون تغيير
- ✅ `delete_note()` يزيل الملاحظة من ملف JSON ويؤكد الحذف

**🤔 سؤال (أسئلة) سقراطي(ة)**

- ماذا يحدث إذا أنشأ مستخدمان ملاحظات في نفس الوقت؟ كيف يمكنك جعل المعرفات أكثر متانة؟

---

## الخطوة 3 — البحث كامل النص

قاعدة المعرفة بلا فائدة إذا كنت لا تستطيع العثور على أي شيء. سننفّذ بحثًا كامل النص يطابق العنوان والمحتوى معًا، إضافةً إلى دالة تسرد كل الملاحظات بتنسيق مقروء.

أضف هذه الدوال إلى `knowledge.py`:

```python
def list_notes(sort_by: str = "updated_at") -> None:
    """Print all notes in a readable format."""
    notes = load_notes()
    if not notes:
        print("  No notes yet. Create one with option 1!")
        return

    notes.sort(key=lambda n: n[sort_by], reverse=True)
    print(f"\n  {'ID':<4} {'Title':<35} {'Tags':<20} {'Updated':<12}")
    print(f"  {'-'*4} {'-'*35} {'-'*20} {'-'*12}")
    for note in notes:
        tags_str = ", ".join(note["tags"]) if note["tags"] else "—"
        updated = note["updated_at"][:10]
        print(f"  {note['id']:<4} {note['title'][:34]:<35} {tags_str[:19]:<20} {updated:<12}")
    print(f"\n  {len(notes)} note(s) total")

def search_notes(query: str) -> list[dict]:
    """Search notes by matching query against title and content (case-insensitive)."""
    notes = load_notes()
    query_lower = query.lower()
    results = [
        note for note in notes
        if query_lower in note["title"].lower()
        or query_lower in note["content"].lower()
    ]
    return results

def display_search_results(query: str) -> None:
    """Search and display matching notes."""
    results = search_notes(query)
    if not results:
        print(f'  No notes matching "{query}"')
        return

    print(f'\n  Found {len(results)} note(s) matching "{query}":')
    for note in results:
        tags_str = ", ".join(note["tags"]) if note["tags"] else "—"
        print(f"\n  [{note['id']}] {note['title']}")
        print(f"      Tags: {tags_str}")
        preview = note["content"][:80].replace("\n", " ")
        if len(note["content"]) > 80:
            preview += "..."
        print(f"      {preview}")

# Test listing
list_notes()

# Test search
print("\n--- Search: 'python' ---")
display_search_results("python")

print("\n--- Search: 'git' ---")
display_search_results("git")

print("\n--- Search: 'docker' ---")
display_search_results("docker")
```

**🎯 الناتج المتوقع :**

```
  ID   Title                               Tags                 Updated
  ---- ----------------------------------- -------------------- ------------
  3    Python Virtual Environments         python, tools        2026-09-06
  2    Git: Rebase vs Merge                git, workflow        2026-09-06
  1    Python List Comprehensions          python, basics       2026-09-06

  3 note(s) total

--- Search: 'python' ---
  Found 2 note(s) matching "python":

  [1] Python List Comprehensions
      Tags: python, basics
      List comprehensions provide a concise way to create lists. Example: [x**2...

  [3] Python Virtual Environments
      Tags: python, tools
      Use venv to create isolated Python environments. Commands: python -m v...

--- Search: 'git' ---
  Found 1 note(s) matching "git":

  [2] Git: Rebase vs Merge
      Tags: git, workflow
      Rebase rewrites commit history for a linear timeline. Merge preserves full bran...

--- Search: 'docker' ---
  No notes matching "docker"
```

**🩹 إذا لم يعمل :**

- إذا لم يُرجع البحث شيئًا لكلمة "python"، فتحقق من مقارنة `query_lower` بـ `note["title"].lower()` — حساسية حالة الأحرف هي السبب المعتاد.
- إذا كانت أعمدة الجدول غير محاذاة، فتأكد من تطابق محددات العرض في f-string (`:<4` و`:<35` وما إلى ذلك) مع عروض الرأس.

**✅ قائمة التحقق**

- ✅ `list_notes()` يعرض كل الملاحظات مرتبة حسب الأكثر تحديثًا مؤخرًا
- ✅ `search_notes()` يعيد الملاحظات المطابقة للاستعلام في العنوان أو المحتوى
- ✅ يعمل البحث غير الحساس لحالة الأحرف للمطابقات الجزئية
- ✅ تعرض نتائج البحث معاينة محتوى مقصوصة إلى 80 حرفًا

**🤔 سؤال (أسئلة) سقراطي(ة)**

- كيف تمدّد البحث ليطابق العلامات أيضًا؟ وماذا عن البحث عن الملاحظات المنشأة هذا الأسبوع؟

---

## الخطوة 4 — نظام العلامات

تسمح لك العلامات بتجميع الملاحظات دون فئات جامدة. سنضيف دوالًا لإضافة العلامات وإزالتها من الملاحظات الموجودة، والتصفية بالعلامة، وحساب استخدام العلامات عبر قاعدة المعرفة بأكملها.

أضف هذه الدوال إلى `knowledge.py`:

```python
def add_tag_to_note(note_id: int, tag: str) -> bool:
    """Add a tag to a note. Returns True if successful."""
    notes = load_notes()
    for note in notes:
        if note["id"] == note_id:
            tag_clean = tag.strip().lower()
            if tag_clean not in note["tags"]:
                note["tags"].append(tag_clean)
                note["updated_at"] = datetime.now(timezone.utc).isoformat()
                save_notes(notes)
                print(f'  Added tag "{tag_clean}" to note {note_id}')
            else:
                print(f'  Note {note_id} already has tag "{tag_clean}"')
            return True
    print(f"  Note {note_id} not found")
    return False

def remove_tag_from_note(note_id: int, tag: str) -> bool:
    """Remove a tag from a note. Returns True if successful."""
    notes = load_notes()
    for note in notes:
        if note["id"] == note_id:
            tag_clean = tag.strip().lower()
            if tag_clean in note["tags"]:
                note["tags"].remove(tag_clean)
                note["updated_at"] = datetime.now(timezone.utc).isoformat()
                save_notes(notes)
                print(f'  Removed tag "{tag_clean}" from note {note_id}')
            else:
                print(f'  Note {note_id} does not have tag "{tag_clean}"')
            return True
    print(f"  Note {note_id} not found")
    return False

def get_all_tags() -> dict[str, int]:
    """Return a dictionary of all tags and how many notes use each."""
    notes = load_notes()
    tag_counts: dict[str, int] = {}
    for note in notes:
        for tag in note["tags"]:
            tag_counts[tag] = tag_counts.get(tag, 0) + 1
    return dict(sorted(tag_counts.items(), key=lambda x: x[1], reverse=True))

def filter_by_tag(tag: str) -> list[dict]:
    """Return all notes that have the given tag."""
    notes = load_notes()
    tag_clean = tag.strip().lower()
    return [note for note in notes if tag_clean in note["tags"]]

def filter_by_date_range(start: str, end: str) -> list[dict]:
    """Return notes created within the given date range (ISO format strings)."""
    notes = load_notes()
    return [
        note for note in notes
        if start <= note["created_at"][:10] <= end
    ]

# Test tag operations
add_tag_to_note(1, "reference")
add_tag_to_note(1, "reference")  # duplicate — should warn

print("\nAll tags:")
for tag, count in get_all_tags().items():
    print(f"  {tag}: {count} note(s)")

print("\nNotes tagged 'python':")
for note in filter_by_tag("python"):
    print(f"  [{note['id']}] {note['title']}")

remove_tag_from_note(1, "basics")
print("\nTags on note 1 after removal:")
note = get_note_by_id(1)
print(f"  {note['title']}: {note['tags']}")

# Test date filtering
print("\nNotes created today:")
today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
for note in filter_by_date_range(today, today):
    print(f"  [{note['id']}] {note['title']}")
```

**🎯 الناتج المتوقع :**

```
  Added tag "reference" to note 1
  Note 1 already has tag "reference"

All tags:
  python: 2 note(s)
  reference: 1 note(s)
  basics: 1 note(s)
  tools: 1 note(s)
  git: 1 note(s)
  workflow: 1 note(s)

Notes tagged 'python':
  [1] Python List Comprehensions
  [3] Python Virtual Environments

  Removed tag "basics" from note 1

Tags on note 1 after removal:
  Python List Comprehensions: ['python', 'reference']

Notes created today:
  [3] Python Virtual Environments
  [2] Git: Rebase vs Merge
  [1] Python List Comprehensions
```

**🩹 إذا لم يعمل :**

- إذا ظهرت علامات مكررة، فتحقق من وجود حارس `if tag_clean not in note["tags"]` قبل الإضافة.
- إذا أظهر `get_all_tags()` عدّادات غير متوقعة، فتأكد من أن `filter_by_tag` يستخدم نفس تسوية `.lower()` مثل `add_tag_to_note`.

**✅ قائمة التحقق**

- ✅ إضافة علامة مكررة تطبع تحذيرًا بدلًا من تكرارها
- ✅ إزالة علامة تحذّث `updated_at` وتديم التغيير
- ✅ `get_all_tags()` يعيد قاموسًا مرتبًا بعدّادات استخدام العلامات
- ✅ `filter_by_tag()` يعيد فقط الملاحظات المحتوية على العلامة بالضبط
- ✅ `filter_by_date_range()` يعيد الملاحظات ضمن نطاق تاريخ ISO المحدد

**🤔 سؤال (أسئلة) سقراطي(ة)**

- كيف تنفّذ علامات متداخلة (مثل `python/django` و`python/flask` تحت أب `python`)؟

---

## الخطوة 5 — عرض Markdown

مخرجات الطرفية جيدة للتصفح السريع، لكن الملاحظات غالبًا تحتوي تنسيق Markdown. سنبني عارضًا يحوّل Markdown إلى مخرجات صديقة للطرفية بعرض غامق ومائل وكود باستخدام أكواد الهروب ANSI.

أضف هذه الدوال إلى `knowledge.py`:

```python
import re

BOLD = "\033[1m"
ITALIC = "\033[3m"
CODE = "\033[7m"
HEADING = "\033[1;36m"
RESET = "\033[0m"

def render_markdown_terminal(text: str) -> str:
    """Render basic Markdown to terminal with ANSI formatting."""
    lines = text.split("\n")
    rendered = []
    for line in lines:
        # Headings
        if line.startswith("### "):
            line = f"{HEADING}{line[4:]}{RESET}"
        elif line.startswith("## "):
            line = f"{HEADING}{line[3:]}{RESET}"
        elif line.startswith("# "):
            line = f"{HEADING}{line[2:]}{RESET}"
        # Bold: **text**
        line = re.sub(r"\*\*(.+?)\*\*", rf"{BOLD}\1{RESET}", line)
        # Italic: *text*
        line = re.sub(r"\*(.+?)\*", rf"{ITALIC}\1{RESET}", line)
        # Inline code: `text`
        line = re.sub(r"`(.+?)`", rf"{CODE}\1{RESET}", line)
        rendered.append(line)
    return "\n".join(rendered)

def display_note_full(note_id: int) -> None:
    """Display a single note with rendered Markdown."""
    note = get_note_by_id(note_id)
    if not note:
        print(f"  Note {note_id} not found")
        return

    tags_str = ", ".join(f"`{t}`" for t in note["tags"]) if note["tags"] else "None"
    created = note["created_at"][:10]
    updated = note["updated_at"][:10]

    print(f"\n  {'='*50}")
    print(f"  {BOLD}{note['title']}{RESET}")
    print(f"  Tags: {tags_str} | Created: {created} | Updated: {updated}")
    print(f"  {'-'*50}")
    print(render_markdown_terminal(note["content"]))
    print(f"  {'='*50}")

# Create a note with Markdown to test rendering
create_note(
    "Markdown Formatting Guide",
    "# Headers\n\nUse `#` for headers.\n\n## Bold and Italic\n\n**Bold text** and *italic text*.\n\n### Code\n\nUse `backticks` for inline code.\n\n- Item 1\n- Item 2\n- Item 3",
    tags=["reference", "markdown"]
)

# Display it with rendering
display_note_full(4)
```

**🎯 الناتج المتوقع :**

```
  ==================================================
  Markdown Formatting Guide
  Tags: `reference`, `markdown` | Created: 2026-09-06 | Updated: 2026-09-06
  --------------------------------------------------
  Headers

  Use `#` for headers.

  Bold and Italic

  **Bold text** and *italic text*.

  Code

  Use `backticks` for inline code.

  - Item 1
  - Item 2
  - Item 3
  ==================================================
```

(ملاحظة: في طرفية حقيقية، تُعرض أكواد التنسيق كعرض غامق ومائل ونص معكوس. النص العادي أعلاه يُظهر البنية.)

**🩹 إذا لم يعمل :**

- إذا ظهرت أكواد ANSI كتسلسلات هروب خام، فقد لا تدعم طرفيتك هذه الأكواد — جرّب `echo $TERM` وتأكد من أنها مضبوطة على `xterm-256color` أو ما شابه.
- إذا لم تبرز العناوين، فتحقق من تطابق التعبير النمطي مع `# ` بمسافة بعد علامة `#`.
- تعالج استدعاءات `re.sub` الغامق قبل المائل — إذا بدّلت الترتيب، فسيستهلك نمط المائل `**bold**` جزئيًا.

**✅ قائمة التحقق**

- ✅ تُعرض العناوين بنص غامق باللون السماوي
- ✅ يُعرض الغامق (`**text**`) بكود ANSI للغامق
- ✅ يُعرض المائل (`*text*`) بكود ANSI للمائل
- ✅ يُعرض الكود السطري (`` `text` ``) بألوان معكوسة
- ✅ `display_note_full()` تظهر ملاحظة كاملة مع رأس بيانات وصفية

**🤔 سؤال (أسئلة) سقراطي(ة)**

- كيف تمدّد هذا لمعالجة كتل الكود (``` ... ```) بلون مختلف؟ وماذا عن الروابط؟

---

## الخطوة 6 — التصدير إلى HTML

يسمح لك موقع HTML ثابت بتصفح قاعدة معرفتك في أي متصفح ومشاركتها مع الآخرين أو استضافتها على GitHub Pages. سنحوّل كل الملاحظات إلى ملف HTML واحد مع بحث وتصفية بالعلامات وتنقّل.

أضف هذه الدوال إلى `knowledge.py`:

```python
import html as html_module

EXPORT_DIR = Path("exports")

def generate_html_site() -> Path:
    """Export the entire knowledge base to a static HTML site."""
    notes = load_notes()
    EXPORT_DIR.mkdir(exist_ok=True)
    filepath = EXPORT_DIR / "index.html"

    all_tags = get_all_tags()
    tags_json = json.dumps(list(all_tags.keys()))
    notes_json = json.dumps(notes, ensure_ascii=False)

    tag_buttons = "\n".join(
        f'<button class="tag-btn" onclick="filterByTag(\'{tag}\')">{tag} ({count})</button>'
        for tag, count in all_tags.items()
    )

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Knowledge Base</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
         background: #0d1117; color: #c9d1d9; line-height: 1.6; padding: 2rem; }}
  h1 {{ color: #58a6ff; margin-bottom: 0.5rem; }}
  .subtitle {{ color: #8b949e; margin-bottom: 2rem; }}
  .search-box {{ width: 100%; padding: 0.75rem 1rem; font-size: 1rem;
                 background: #161b22; border: 1px solid #30363d; border-radius: 6px;
                 color: #c9d1d9; margin-bottom: 1rem; }}
  .search-box:focus {{ outline: none; border-color: #58a6ff; }}
  .tags {{ display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem; }}
  .tag-btn {{ background: #21262d; color: #8b949e; border: 1px solid #30363d;
              padding: 0.35rem 0.75rem; border-radius: 20px; cursor: pointer;
              font-size: 0.85rem; transition: all 0.2s; }}
  .tag-btn:hover, .tag-btn.active {{ background: #1f6feb; color: #fff; border-color: #1f6feb; }}
  .note-card {{ background: #161b22; border: 1px solid #30363d; border-radius: 8px;
                padding: 1.25rem; margin-bottom: 1rem; cursor: pointer; transition: border-color 0.2s; }}
  .note-card:hover {{ border-color: #58a6ff; }}
  .note-title {{ color: #58a6ff; font-size: 1.1rem; font-weight: 600; margin-bottom: 0.25rem; }}
  .note-meta {{ color: #8b949e; font-size: 0.8rem; margin-bottom: 0.5rem; }}
  .note-preview {{ color: #8b949e; font-size: 0.9rem; }}
  .note-content {{ display: none; margin-top: 1rem; padding-top: 1rem;
                   border-top: 1px solid #30363d; white-space: pre-wrap; color: #c9d1d9; }}
  .note-content.open {{ display: block; }}
  .note-tags {{ display: flex; gap: 0.4rem; margin-top: 0.75rem; }}
  .note-tag {{ background: #1f6feb22; color: #58a6ff; padding: 0.15rem 0.5rem;
               border-radius: 12px; font-size: 0.75rem; }}
  .count {{ color: #8b949e; font-size: 0.85rem; margin-bottom: 1rem; }}
  .no-results {{ color: #8b949e; text-align: center; padding: 2rem; }}
</style>
</head>
<body>
<h1>Knowledge Base</h1>
<p class="subtitle">Personal knowledge base with {len(notes)} notes</p>
<input type="text" class="search-box" id="searchInput" placeholder="Search notes..."
       oninput="searchNotes()">
<div class="tags">
  <button class="tag-btn active" onclick="filterByTag('all')">All</button>
  {tag_buttons}
</div>
<div class="count" id="resultCount">{len(notes)} note(s)</div>
<div id="notesContainer"></div>

<script>
const NOTES = {notes_json};
const ALL_TAGS = {tags_json};
let activeTag = 'all';

function renderNotes(notes) {{
  const container = document.getElementById('notesContainer');
  const count = document.getElementById('resultCount');
  if (notes.length === 0) {{
    container.innerHTML = '<div class="no-results">No notes found.</div>';
    count.textContent = '0 note(s)';
    return;
  }}
  count.textContent = notes.length + ' note(s)';
  container.innerHTML = notes.map(note => `
    <div class="note-card" onclick="this.querySelector('.note-content').classList.toggle('open')">
      <div class="note-title">${{escapeHtml(note.title)}}</div>
      <div class="note-meta">Created: ${{note.created_at.slice(0,10)}} | Updated: ${{note.updated_at.slice(0,10)}}</div>
      <div class="note-preview">${{escapeHtml(note.content.slice(0, 120))}}${{note.content.length > 120 ? '...' : ''}}</div>
      <div class="note-content">${{escapeHtml(note.content)}}</div>
      <div class="note-tags">${{note.tags.map(t => `<span class="note-tag">${{t}}</span>`).join('')}}</div>
    </div>
  `).join('');
}}

function escapeHtml(text) {{
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}}

function searchNotes() {{
  const query = document.getElementById('searchInput').value.toLowerCase();
  let filtered = NOTES;
  if (activeTag !== 'all') {{
    filtered = filtered.filter(n => n.tags.includes(activeTag));
  }}
  if (query) {{
    filtered = filtered.filter(n =>
      n.title.toLowerCase().includes(query) ||
      n.content.toLowerCase().includes(query) ||
      n.tags.some(t => t.includes(query))
    );
  }}
  renderNotes(filtered);
}}

function filterByTag(tag) {{
  activeTag = tag;
  document.querySelectorAll('.tag-btn').forEach(btn => {{
    btn.classList.toggle('active', btn.textContent.includes(tag) || (tag === 'all' && btn.textContent.includes('All')));
  }});
  searchNotes();
}}

renderNotes(NOTES);
</script>
</body>
</html>"""

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(html_content)
    return filepath

# Test HTML export
path = generate_html_site()
print(f"Exported to: {path}")
print(f"File size: {path.stat().st_size:,} bytes")
```

**🎯 الناتج المتوقع :**

```
Exported to: exports/index.html
File size: 4,218 bytes
```

افتح `exports/index.html` في متصفحك لرؤية الموقع الكامل مع:
- شريط بحث يصفّي الملاحظات في الوقت الفعلي
- أزرار علامات تصفّي حسب الموضوع
- بطاقات ملاحظات قابلة للنقر تتوسع لعرض المحتوى الكامل
- سمة داكنة مع طباعة نظيفة

**🩹 إذا لم يعمل :**

- إذا كان ملف HTML فارغًا، فتحقق من إدراج `notes_json` بشكل صحيح — يجب أن تستخدم f-string الأقواس المزدوجة `{{` لهروب الأقواس الحرفية في JavaScript.
- إذا لم يعمل البحث في المتصفح، فافتح وحدة تحكم المتصفح (F12) وتحقق من أخطاء JavaScript — المشكلة الأكثر شيوعًا هي قوس إغلاق مفقود في دالة `renderNotes`.
- إذا كسرت الأحرف الخاصة HTML، فتأكد من استدعاء `escapeHtml()` على كل المحتوى الذي يولّده المستخدم قبل إدراجه في القالب.

**✅ قائمة التحقق**

- ✅ `generate_html_site()` ينتج ملف HTML صالحًا في `exports/index.html`
- ✅ يتضمن الملف حقل بحث يصفّي الملاحظات في الوقت الفعلي
- ✅ أزرار العلامات تصفّي الملاحظات حسب العلامة المحددة
- ✅ النقر على بطاقة ملاحظة يوسّعها لعرض المحتوى الكامل
- ✅ الأحرف الخاصة في عناوين الملاحظات ومحتواها مُهرّبة بشكل صحيح

**🤔 سؤال (أسئلة) سقراطي(ة)**

- كيف تضيف شريط جدول محتويات جانبيًا يربط بكل ملاحظة؟ وماذا عن إضافة زر "العودة إلى الأعلى"؟

---

## الخطوة 7 — واجهة CLI

تربط الخطوة الأخيرة كل شيء معًا بواجهة قائمة. سنضيف مخرجات ملونة والتحقق من المدخلات ومعالجة الأخطاء النظيفة.

استبدل أسفل `knowledge.py` (أو أضف إلى `main.py` جديد واستورد من `knowledge.py`) بما يلي:

```python
GREEN = "\033[32m"
CYAN = "\033[36m"
YELLOW = "\033[33m"
RED = "\033[31m"
BOLD = "\033[1m"

def colored(text: str, color: str) -> str:
    return f"{color}{text}{RESET}"

def print_header():
    print(f"\n{colored('=' * 50, CYAN)}")
    print(colored("  🧠  Personal Knowledge Base", BOLD))
    print(colored('=' * 50, CYAN))

def print_menu():
    print(f"""
  {colored('1.', GREEN)} Create a new note
  {colored('2.', GREEN)} List all notes
  {colored('3.', GREEN)} Search notes
  {colored('4.', GREEN)} View a note (with Markdown rendering)
  {colored('5.', GREEN)} Add tag to a note
  {colored('6.', GREEN)} Remove tag from a note
  {colored('7.', GREEN)} Filter notes by tag
  {colored('8.', GREEN)} Edit a note
  {colored('9.', GREEN)} Delete a note
  {colored('10.', GREEN)} Export to HTML site
  {colored('0.', RED)}  Exit
""")

def get_input(prompt: str) -> str:
    """Get input with colored prompt."""
    return input(colored(f"  {prompt}: ", CYAN)).strip()

def get_int(prompt: str) -> int | None:
    """Get an integer input, returning None on failure."""
    try:
        return int(get_input(prompt))
    except ValueError:
        print(colored("  Please enter a valid number.", RED))
        return None

def handle_create():
    title = get_input("Title")
    if not title:
        print(colored("  Title cannot be empty.", RED))
        return
    print("  Content (press Enter twice when done):")
    lines = []
    while True:
        line = input("  > ")
        if line == "" and lines and lines[-1] == "":
            break
        lines.append(line)
    content = "\n".join(lines).strip()
    tags_input = get_input("Tags (comma-separated, or leave empty)")
    tags = [t.strip() for t in tags_input.split(",") if t.strip()] if tags_input else []
    note = create_note(title, content, tags)
    print(colored(f"  ✓ Created note {note['id']}: {note['title']}", GREEN))

def handle_list():
    list_notes()

def handle_search():
    query = get_input("Search query")
    if query:
        display_search_results(query)

def handle_view():
    note_id = get_int("Note ID to view")
    if note_id is not None:
        display_note_full(note_id)

def handle_add_tag():
    note_id = get_int("Note ID")
    if note_id is None:
        return
    tag = get_input("Tag to add")
    if tag:
        add_tag_to_note(note_id, tag)

def handle_remove_tag():
    note_id = get_int("Note ID")
    if note_id is None:
        return
    tag = get_input("Tag to remove")
    if tag:
        remove_tag_from_note(note_id, tag)

def handle_filter_tag():
    tag = get_input("Tag to filter by")
    if tag:
        results = filter_by_tag(tag)
        if results:
            print(f"\n  Notes tagged '{tag}':")
            for note in results:
                print(f"    [{note['id']}] {note['title']}")
        else:
            print(f"  No notes with tag '{tag}'")

def handle_edit():
    note_id = get_int("Note ID to edit")
    if note_id is None:
        return
    note = get_note_by_id(note_id)
    if not note:
        print(colored(f"  Note {note_id} not found.", RED))
        return
    print(f"  Current title: {note['title']}")
    new_title = get_input("New title (leave blank to keep)")
    print(f"  Current content preview: {note['content'][:50]}...")
    new_content = get_input("New content (leave blank to keep)")
    edit_note(
        note_id,
        title=new_title if new_title else None,
        content=new_content if new_content else None,
    )

def handle_delete():
    note_id = get_int("Note ID to delete")
    if note_id is None:
        return
    note = get_note_by_id(note_id)
    if not note:
        print(colored(f"  Note {note_id} not found.", RED))
        return
    confirm = get_input(f'Delete "{note["title"]}"? (yes/no)')
    if confirm.lower() == "yes":
        delete_note(note_id)
        print(colored("  ✓ Deleted.", GREEN))
    else:
        print("  Cancelled.")

def handle_export():
    path = generate_html_site()
    print(colored(f"  ✓ Exported to {path}", GREEN))
    print(colored(f"    Open in browser: file://{path.resolve()}", YELLOW))

HANDLERS = {
    1: handle_create,
    2: handle_list,
    3: handle_search,
    4: handle_view,
    5: handle_add_tag,
    6: handle_remove_tag,
    7: handle_filter_tag,
    8: handle_edit,
    9: handle_delete,
    10: handle_export,
}

def main():
    """Run the knowledge base app."""
    ensure_data_dir()
    print_header()

    while True:
        print_menu()
        choice = get_int("Choose an option")
        if choice == 0:
            print(colored("\n  Goodbye! 🧠\n", YELLOW))
            break
        if choice is None or choice not in HANDLERS:
            print(colored("  Invalid option. Try again.", RED))
            continue
        try:
            HANDLERS[choice]()
        except KeyboardInterrupt:
            print(colored("\n\n  Interrupted. Goodbye!", YELLOW))
            break
        except Exception as e:
            print(colored(f"  Error: {e}", RED))

if __name__ == "__main__":
    main()
```

**🎯 الناتج المتوقع (جلسة تفاعلية):**

```
==================================================
  🧠  Personal Knowledge Base
==================================================

  1. Create a new note
  2. List all notes
  3. Search notes
  4. View a note (with Markdown rendering)
  5. Add tag to a note
  6. Remove tag from a note
  7. Filter notes by tag
  8. Edit a note
  9. Delete a note
  10. Export to HTML site
  0.  Exit

  Choose an option: 2

  ID   Title                               Tags                 Updated
  ---- ----------------------------------- -------------------- ------------
  4    Markdown Formatting Guide           reference, markdown  2026-09-06
  3    Python Virtual Environments         python, tools        2026-09-06
  2    Git: Rebase vs Merge                git, workflow        2026-09-06
  1    Python List Comprehensions          python, reference    2026-09-06

  4 note(s) total

  Choose an option: 0

  Goodbye! 🧠
```

**🩹 إذا لم يعمل :**

- إذا لم تظهر الألوان، فقد لا تدعم طرفيتك أكواد ANSI — جرّب طرفية مختلفة أو تحقق من ضبط `$TERM` على `xterm-256color` أو ما شابه.
- إذا علّقت حلقة الإدخال، فتحقق من أن `handle_create` يخرج بشكل صحيح من حلقة إدخال المحتوى عند سطرين فارغين متتاليين.
- إذا لم يخرج `Ctrl+C` بشكل نظيف، فيجب أن يلتقط كتلة `except KeyboardInterrupt` ذلك.

**✅ قائمة التحقق**

- ✅ تعرض القائمة الخيارات المرقمة والنص الملون
- ✅ يطبع المدخل غير الصالح خطأً ويعيد عرض القائمة
- ✅ يستدعي كل خيار من خيارات القائمة دالة المعالج الصحيحة
- ✅ يخرج `Ctrl+C` من التطبيق بأمان دون تتبع أثر (traceback)
- ✅ يستمر التطبيق في الحلقة حتى يختار المستخدم الخيار 0
- ✅ يطبع التصدير مسار file:// الكامل لسهولة الفتح في المتصفح

**🤔 سؤال (أسئلة) سقراطي(ة)**

- كيف تضيف وسائط سطر أوامر بحيث يمكن للمستخدمين تشغيل `python knowledge.py search "python"` دون الدخول إلى القائمة التفاعلية؟

---

## 🧩 التحديات

**التحدي 1 — تثبيت الملاحظات**
أضف حقلًا منطقيًا `pinned` إلى كل ملاحظة. عند السرد، تظهر الملاحظات المثبتة دائمًا في الأعلى بغض النظر عن ترتيب الفرز.

**التحدي 2 — بحث كامل النص مع تمييز**
وسّع دالة البحث لتمييز المصطلحات المطابقة في النتائج. غلّف المطابقات بعلامة ملونة (مثل `[MATCH]term[/MATCH]`) بحيث يمكن للمستخدمين رؤية موضع الاستعلام بالضبط.

**التحدي 3 — النسخ الاحتياطي والاستعادة**
أضف دالة تنشئ نسخة احتياطية بعلامة زمنية من `knowledge.json` (مثل `data/backup-20260906-143022.json`)، ودالة استعادة تحمّل ملف النسخة الاحتياطية مرة أخرى إلى قاعدة المعرفة.

## أهداف إضافية

- [ ] أضف ربط الملاحظات — اكشف بناء `[[Note Title]]` وأنشئ مراجع قابلة للنقر بين الملاحظات
- [ ] نفّذ البحث الضبابي باستخدام `difflib.SequenceMatcher` للمطابقة المتسامحة مع الأخطاء الإملائية
- [ ] أضف التصدير إلى Markdown (ملف `.md` واحد لكل ملاحظة) إلى جانب التصدير إلى HTML
- [ ] ابنِ واجهة ويب بسيطة بـ `flask` للوصول عبر المتصفح
- [ ] أضف قائمة الأخيرة التي تتعقب آخر 10 ملاحظات عرضتها

## ما تعلمته

- تصميم نموذج بيانات بالقواميس وJSON للتخزين الدائم
- تنفيذ بحث كامل النص عبر حقول متعددة بمطابقة غير حساسة لحالة الأحرف
- بناء نظام علامات مرن بعمليات الإضافة والإزالة والتصفية والعد
- عرض Markdown في الطرفية بأكواد الهروب ANSI
- توليد موقع HTML ثابت مع JavaScript مدمجة للبحث والتصفية
- بناء واجهة CLI مصقولة بحلقة قائمة ومخرجات ملونة والتحقق من المدخلات ومعالجة الأخطاء
