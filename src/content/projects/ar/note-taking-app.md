---
title: "تطبيق أخذ الملاحظات بتنسيق Markdown"
description: "تطبيق أخذ ملاحظات قائم على الطرفية مع بحث كامل النص وعلامات وتصدير Markdown."
difficulty: "beginner"
estimatedMinutes: 45
xpReward: 50
tags: ["cli", "file-io", "json", "search"]
prerequisites: ["أساسيات بايثون (المتغيرات، الحلقات، الدوال، القواميس)", "قراءة/كتابة الملفات الأساسية"]
---

# تطبيق أخذ الملاحظات بتنسيق Markdown

ابنِ تطبيق أخذ ملاحظات قائمًا على الطرفية يخزّن الملاحظات بصيغة JSON، ويدعم البحث كامل النص، والتنظيم بالعلامات، والتصدير إلى ملفات Markdown نظيفة. يعزّز هذا المشروع التلاعب بالقواميس وقراءة/كتابة الملفات ومعالجة النصوص وبناء واجهة CLI موجّهة للمستخدم من الصفر.

- **شغّله في المتصفح.** هناك دفتر ملاحظات تفاعلي جاهز ، افتحه على Colab أو Kaggle أو Binder وتابع خطوة بخطوة.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/note-taking-app/notebook.ar.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/note-taking-app/notebook.ar.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fnote-taking-app%2Fnotebook.ar.ipynb)

## ما ستتعلمه

1. تصميم نموذج بيانات للملاحظات باستخدام القواميس وتسلسل JSON
2. تنفيذ بحث كامل النص عبر حقول متعددة
3. بناء نظام علامات للتنظيم والتصفية المرنين
4. إنشاء واجهة CLI قائمة على قائمة بمخرجات ملونة والتحقق من المدخلات
5. تصدير البيانات المنظمة إلى ملفات Markdown للمشاركة

## ما ستبنيه

مدير ملاحظات سطر أوامر يتيح لك:

- **إنشاء ملاحظات** بعنوان ونص وعلامات، مخزّنة بصيغة JSON على القرص
- **سرد الملاحظات والبحث فيها** بمطابقة كاملة النص عبر العناوين والمحتوى
- **وضع العلامات والتصفية** لتنظيم الملاحظات حسب الموضوع
- **تحرير الملاحظات وحذفها** الموجودة بشكل تفاعلي
- **تصدير الملاحظات** إلى ملفات `.md` فردية أو إلى مستند واحد مجمّع
- **استخدام واجهة CLI مصقولة** بقائمة مرقمة ومخرجات ملونة ومعالجة أخطاء أنيقة

## الإعداد

```bash
uv init note-taking-app
cd note-taking-app
```

لا حاجة إلى حزم خارجية ، يستخدم التطبيق مكتبة Python القياسية فقط (`json` و`os` و`datetime` و`pathlib`).

## الخطوة 1 ، إعداد بنية المشروع

تحتاج كل ملاحظة إلى شكل ثابت بحيث يمكن لبقية التطبيق الاعتماد على نفس الحقول. سنخزّن الملاحظات كقائمة قواميس في ملف JSON. ستحتوي كل ملاحظة على الحقول `id` و`title` و`content` و`tags` و`created_at` و`updated_at`.

أنشئ ملفًا باسم `notes.py` وعرّف نموذج البيانات وطبقة التخزين:

```python
import json
import os
from datetime import datetime, timezone
from pathlib import Path

DATA_DIR = Path("data")
NOTES_FILE = DATA_DIR / "notes.json"

def ensure_data_dir():
    """Create the data directory if it doesn't exist."""
    DATA_DIR.mkdir(exist_ok=True)

def load_notes() -> list[dict]:
    """Load all notes from the JSON file."""
    ensure_data_dir()
    if not NOTES_FILE.exists():
        return []
    with open(NOTES_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_notes(notes: list[dict]) -> None:
    """Save all notes to the JSON file."""
    ensure_data_dir()
    with open(NOTES_FILE, "w", encoding="utf-8") as f:
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
print(f"Notes file: {NOTES_FILE}")
```

**🎯 الناتج المتوقع :**

```
Data directory: /home/user/note-taking-app/data
Notes loaded: 0
Notes file: data/notes.json
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

## الخطوة 2 ، إنشاء الملاحظات

الآن بعد أن أصبحنا قادرين على التحميل والحفظ، لنبنِ الدالة التي تنشئ ملاحظة جديدة. تأخذ عنوانًا ومحتوى وعلامات اختيارية، وتعيّن معرفًا وطوابع زمنية، وتضيفها إلى القائمة.

أضف هذا إلى `notes.py`:

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
```

**🎯 الناتج المتوقع :**

```
Created note 1: Python List Comprehensions
Created note 2: Git Rebase vs Merge
Created note 3: Python Virtual Environments

Total notes: 3
```

بعد التشغيل، افحص `data/notes.json` ، سترى الملاحظات الثلاث جميعها مخزّنة بالمعرفات والعلامات والطوابع الزمنية.

**🩹 إذا لم يعمل :**

- إذا لم تكن المعرفات متسلسلة، فتحقق من أن `load_notes()` تقرأ القائمة الحالية قبل توليد المعرف التالي.
- يجب أن تكون العلامات بأحرف صغيرة ، إذا رأيت أحرفًا مختلطة الحالة، فقائمة الفهم في `create_note` لا تعمل.

**✅ قائمة التحقق**

- ✅ تحصل كل ملاحظة على معرف فريد متزايد
- ✅ تُطبَّع العلامات إلى أحرف صغيرة وتُزال المسافات البيضاء
- ✅ يُضبط `created_at` و`updated_at` على طوابع ISO زمنية بتوقيت UTC
- ✅ تبقى الملاحظات في `data/notes.json` بعد انتهاء السكربت

**🤔 سؤال (أسئلة) سقراطي(ة)**

- ماذا يحدث إذا أنشأ مستخدمان ملاحظات في نفس الوقت؟ كيف يمكنك جعل المعرفات أكثر متانة؟

---

## الخطوة 3 ، سرد الملاحظات والبحث فيها

تطبيق أخذ الملاحظات بلا فائدة إذا كنت لا تستطيع العثور على أي شيء. سننفّذ شيئين: سرد كل الملاحظات بتنسيق مقروء، وبحث كامل النص يطابق العنوان والمحتوى معًا.

أضف هذه الدوال إلى `notes.py`:

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
  2    Git Rebase vs Merge                 git, workflow        2026-09-06
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

  [2] Git Rebase vs Merge
      Tags: git, workflow
      Rebase rewrites commit history to create a linear timeline. Merge pre...

--- Search: 'docker' ---
  No notes matching "docker"
```

**🩹 إذا لم يعمل :**

- إذا لم يُرجع البحث شيئًا لكلمة "python"، فتحقق من مقارنة `query_lower` بـ `note["title"].lower()` ، حساسية حالة الأحرف هي السبب المعتاد.
- إذا كانت أعمدة الجدول غير محاذاة، فتأكد من تطابق محددات العرض في f-string (`:<4` و`:<35` وما إلى ذلك) مع عروض الرأس.

**✅ قائمة التحقق**

- ✅ `list_notes()` يعرض كل الملاحظات مرتبة حسب الأكثر تحديثًا مؤخرًا
- ✅ `search_notes()` يعيد الملاحظات المطابقة للاستعلام في العنوان أو المحتوى
- ✅ يعمل البحث غير الحساس لحالة الأحرف للمطابقات الجزئية
- ✅ تعرض نتائج البحث معاينة محتوى مقصوصة إلى 80 حرفًا

**🤔 سؤال (أسئلة) سقراطي(ة)**

- كيف تمدّد البحث ليطابق العلامات أيضًا؟ وماذا عن البحث عن الملاحظات المنشأة هذا الأسبوع؟

---

## الخطوة 4 ، التنظيم بالعلامات

تسمح لك العلامات بتجميع الملاحظات دون فئات جامدة. سنضيف دوالًا لإضافة العلامات وإزالتها من الملاحظات الموجودة، وتصفية قائمة الملاحظات بعلامة محددة.

أضف هذه الدوال إلى `notes.py`:

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
note = [n for n in load_notes() if n["id"] == 1][0]
print(f"  {note['title']}: {note['tags']}")
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
```

**🩹 إذا لم يعمل :**

- إذا ظهرت علامات مكررة، فتحقق من وجود حارس `if tag_clean not in note["tags"]` قبل الإضافة.
- إذا أظهر `get_all_tags()` عدّادات غير متوقعة، فتأكد من أن `filter_by_tag` يستخدم نفس تسوية `.lower()` مثل `add_tag_to_note`.

**✅ قائمة التحقق**

- ✅ إضافة علامة مكررة تطبع تحذيرًا بدلًا من تكرارها
- ✅ إزالة علامة تحذّث `updated_at` وتديم التغيير
- ✅ `get_all_tags()` يعيد قاموسًا مرتبًا بعدّادات استخدام العلامات
- ✅ `filter_by_tag()` يعيد فقط الملاحظات المحتوية على العلامة بالضبط

**🤔 سؤال (أسئلة) سقراطي(ة)**

- كيف تنفّذ علامات متداخلة (مثل `python/django` و`python/flask` تحت أب `python`)؟

---

## الخطوة 5 ، تحرير الملاحظات وحذفها

يحتاج المستخدمون إلى تصحيح الأخطاء وإزالة الملاحظات القديمة. سنضيف دوالًا لتحديث حقول محددة من ملاحظة موجودة وحذف الملاحظات بالمعرف.

أضف هذه الدوال إلى `notes.py`:

```python
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

# Test edit
print("Before edit:")
note = get_note_by_id(2)
print(f"  [{note['id']}] {note['title']}")
print(f"  {note['content'][:60]}...")

edit_note(2, title="Git: Rebase vs Merge", content="Rebase rewrites commit history for a linear timeline.\nMerge preserves full branch history with a merge commit.\n\nWhen to rebase: local cleanup before sharing.\nWhen to merge: shared branches where history matters.")

print("\nAfter edit:")
note = get_note_by_id(2)
print(f"  [{note['id']}] {note['title']}")
print(f"  {note['content'][:80]}...")

# Test delete
print("\nDeleting note 3...")
delete_note(3)
list_notes()
```

**🎯 الناتج المتوقع :**

```
Before edit:
  [2] Git Rebase vs Merge
  Rebase rewrites commit history to create a linear timeline. Merge pre...

  Updated note 2: Git: Rebase vs Merge

After edit:
  [2] Git: Rebase vs Merge
  Rebase rewrites commit history for a linear timeline. Merge preserves full branch hist...

  Deleted note 3

  ID   Title                               Tags                 Updated
  ---- ----------------------------------- -------------------- ------------
  2    Git: Rebase vs Merge                git, workflow        2026-09-06
  1    Python List Comprehensions          python, reference    2026-09-06

  2 note(s) total
```

**🩹 إذا لم يعمل :**

- إذا بدا أن `edit_note` لا يحفظ، فتحقق من أنك تمرر `title=` و`content=` كوسائط كلمات مفتاحية ، تستخدم الدالة `None` كإشارة لتخطي الحقول غير المتغيرة.
- إذا قال `delete_note` "not found" لكن الملاحظة موجودة، فتأكد من أن المعرّف عدد صحيح وليس سلسلة نصية.

**✅ قائمة التحقق**

- ✅ `edit_note()` يحذّث فقط الحقول التي تمررها، تاركًا الأخرى دون تغيير
- ✅ `edit_note()` يحذّث الطابع الزمني `updated_at`
- ✅ `delete_note()` يزيل الملاحظة من ملف JSON ويؤكد الحذف
- ✅ `get_note_by_id()` يعيد `None` للمعرفات غير الموجودة

**🤔 سؤال (أسئلة) سقراطي(ة)**

- كيف يمكنك تنفيذ "تراجع" عن الحذف؟ ما البيانات التي ستحتاجها للاحتفاظ بها؟

---

## الخطوة 6 ، التصدير إلى Markdown

ملفات Markdown سهلة المشاركة والمعاينة على GitHub أو الاستيراد في أدوات أخرى. سنحوّل الملاحظات إلى ملفات `.md` نظيفة ، ملف واحد لكل ملاحظة، أو مستند واحد مجمّع.

أضف هذه الدوال إلى `notes.py`:

```python
EXPORT_DIR = Path("exports")

def export_note_to_markdown(note: dict, output_dir: Path | None = None) -> Path:
    """Export a single note to a Markdown file."""
    output_dir = output_dir or EXPORT_DIR
    output_dir.mkdir(exist_ok=True)

    safe_title = note["title"].replace(" ", "-").replace("/", "-").lower()
    filename = f"{note['id']:03d}-{safe_title}.md"
    filepath = output_dir / filename

    tags_line = ", ".join(f"`{tag}`" for tag in note["tags"]) if note["tags"] else "None"
    created = note["created_at"][:10]
    updated = note["updated_at"][:10]

    md_content = f"""# {note['title']}

> **Tags:** {tags_line}
> **Created:** {created} | **Updated:** {updated}

---

{note['content']}
"""
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(md_content)
    return filepath

def export_all_notes(combined: bool = False) -> list[Path]:
    """Export all notes to Markdown. If combined, write a single file."""
    notes = load_notes()
    if not notes:
        print("  No notes to export")
        return []

    EXPORT_DIR.mkdir(exist_ok=True)
    paths = []

    if combined:
        filepath = EXPORT_DIR / "all-notes.md"
        with open(filepath, "w", encoding="utf-8") as f:
            f.write("# All Notes\n\n")
            f.write(f"*Exported on {datetime.now(timezone.utc).strftime('%Y-%m-%d')}*\n\n")
            f.write("---\n\n")
            for note in notes:
                tags_line = ", ".join(f"`{tag}`" for tag in note["tags"]) if note["tags"] else "None"
                f.write(f"## {note['title']}\n\n")
                f.write(f"**Tags:** {tags_line} | **Created:** {note['created_at'][:10]}\n\n")
                f.write(f"{note['content']}\n\n---\n\n")
        paths.append(filepath)
        print(f"  Exported combined file: {filepath}")
    else:
        for note in notes:
            path = export_note_to_markdown(note)
            paths.append(path)
            print(f"  Exported: {path}")

    print(f"\n  {len(paths)} file(s) exported to {EXPORT_DIR}/")
    return paths

# Test individual export
note = get_note_by_id(1)
path = export_note_to_markdown(note)
print(f"Exported to: {path}")

# Print the generated Markdown
with open(path, "r") as f:
    print(f"\n--- Content of {path.name} ---")
    print(f.read())

# Test combined export
print("--- Exporting all notes as one file ---")
export_all_notes(combined=True)
```

**🎯 الناتج المتوقع :**

```
Exported to: exports/001-python-list-comprehensions.md

--- Content of 001-python-list-comprehensions.md ---
# Python List Comprehensions

> **Tags:** `python`, `reference`
> **Created:** 2026-09-06 | **Updated:** 2026-09-06

---

List comprehensions provide a concise way to create lists.
Example: [x**2 for x in range(10)]

--- Exporting all notes as one file ---
  Exported combined file: exports/all-notes.md

  1 file(s) exported to exports/
```

**🩹 إذا لم يعمل :**

- إذا كان الملف المُصدَّر فارغًا، فتحقق من أن `note["content"]` سلسلة نصية ، قيمة `None` ستنتج بلا مخرجات بصمت.
- إذا احتوى `safe_title` على أحرف غريبة، أضف المزيد من الاستبدالات: `note["title"].replace(":", "").replace("'", "")`.

**✅ قائمة التحقق**

- ✅ لكل ملف `.md` مُصدَّر عنوان وكتلة بيانات وصفية ومحتوى الملاحظة
- ✅ أسماء الملفات آمنة لجميع أنظمة التشغيل (لا أحرف خاصة)
- ✅ ينتج التصدير المجمّع `all-notes.md` واحدًا بكل الملاحظات مفصولة بخطوط أفقية
- ✅ يُعرض Markdown المُصدَّر بشكل صحيح في أي عارض Markdown

**🤔 سؤال (أسئلة) سقراطي(ة)**

- كيف تضيف جدول محتويات إلى التصدير المجمّع يربط بعنوان كل ملاحظة؟

---

## الخطوة 7 ، صقل واجهة CLI

الخطوة الأخيرة تجمع كل شيء معًا بواجهة قائمة. سنضيف مخرجات ملونة باستخدام أكواد ANSI والتحقق من المدخلات ومعالجة أخطاء نظيفة بحيث يبدو التطبيق مصقولًا.

استبدل أسفل `notes.py` (أو أضف إلى `main.py` جديد واستورد من `notes.py`) بما يلي:

```python
# ── Colors (ANSI escape codes) ──────────────────────────────────
BOLD = "\033[1m"
GREEN = "\033[32m"
CYAN = "\033[36m"
YELLOW = "\033[33m"
RED = "\033[31m"
RESET = "\033[0m"

def colored(text: str, color: str) -> str:
    return f"{color}{text}{RESET}"

def print_header():
    print(f"\n{colored('=' * 50, CYAN)}")
    print(colored("  📝  Markdown Note-Taking App", BOLD))
    print(colored('=' * 50, CYAN))

def print_menu():
    print(f"""
  {colored('1.', GREEN)} Create a new note
  {colored('2.', GREEN)} List all notes
  {colored('3.', GREEN)} Search notes
  {colored('4.', GREEN)} Add tag to a note
  {colored('5.', GREEN)} Remove tag from a note
  {colored('6.', GREEN)} Filter notes by tag
  {colored('7.', GREEN)} Edit a note
  {colored('8.', GREEN)} Delete a note
  {colored('9.', GREEN)} Export all notes to Markdown
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

def handle_search():
    query = get_input("Search query")
    if query:
        display_search_results(query)

def handle_list():
    list_notes()

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
    export_all_notes(combined=True)

HANDLERS = {
    1: handle_create,
    2: handle_list,
    3: handle_search,
    4: handle_add_tag,
    5: handle_remove_tag,
    6: handle_filter_tag,
    7: handle_edit,
    8: handle_delete,
    9: handle_export,
}

def main():
    """Run the note-taking app."""
    ensure_data_dir()
    print_header()

    while True:
        print_menu()
        choice = get_int("Choose an option")
        if choice == 0:
            print(colored("\n  Goodbye! 👋\n", YELLOW))
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
  📝  Markdown Note-Taking App
==================================================

  1. Create a new note
  2. List all notes
  3. Search notes
  4. Add tag to a note
  5. Remove tag from a note
  6. Filter notes by tag
  7. Edit a note
  8. Delete a note
  9. Export all notes to Markdown
  0. Exit

  Choose an option: 2

  ID   Title                               Tags                 Updated
  ---- ----------------------------------- -------------------- ------------
  2    Git: Rebase vs Merge                git, workflow        2026-09-06
  1    Python List Comprehensions          python, reference    2026-09-06

  2 note(s) total

  Choose an option: 0

  Goodbye! 👋
```

**🩹 إذا لم يعمل :**

- إذا لم تظهر الألوان، فقد لا تدعم طرفيتك أكواد ANSI ، جرّب طرفية مختلفة أو تحقق من ضبط `$TERM` على `xterm-256color` أو ما شابه.
- إذا علّقت حلقة الإدخال، فتحقق من أن `handle_create` يخرج بشكل صحيح من حلقة إدخال المحتوى عند سطرين فارغين متتاليين.
- إذا لم يخرج `Ctrl+C` بشكل نظيف، فيجب أن يلتقط كتلة `except KeyboardInterrupt` ذلك.

**✅ قائمة التحقق**

- ✅ تعرض القائمة الخيارات المرقمة والنص الملون
- ✅ يطبع المدخل غير الصالح خطأً ويعيد عرض القائمة
- ✅ يستدعي كل خيار من خيارات القائمة دالة المعالج الصحيحة
- ✅ يخرج `Ctrl+C` من التطبيق بأمان دون تتبع أثر (traceback)
- ✅ يستمر التطبيق في الحلقة حتى يختار المستخدم الخيار 0

**🤔 سؤال (أسئلة) سقراطي(ة)**

- كيف تضيف وسائط سطر أوامر بحيث يمكن للمستخدمين تشغيل `python notes.py search "python"` دون الدخول إلى القائمة التفاعلية؟

---

## 🧩 التحديات

**التحدي 1 ، تثبيت الملاحظات**
أضف حقلًا منطقيًا `pinned` إلى كل ملاحظة. عند السرد، تظهر الملاحظات المثبتة دائمًا في الأعلى بغض النظر عن ترتيب الفرز.

**التحدي 2 ، تصدير كامل مع جدول محتويات**
وسّع التصدير المجمّع إلى Markdown ليشمل جدول محتويات في الأعلى، مع روابط لعنوان كل ملاحظة باستخدام بناء جملة المرساة في Markdown (مثل `[Python Basics](#python-basics)`).

**التحدي 3 ، البحث حسب نطاق التاريخ**
أضف مرشحَي `--from` و`--to` إلى دالة البحث بحيث يمكن للمستخدمين العثور على الملاحظات المنشأة أو المحدّثة ضمن نطاق تاريخ محدد. حلّل التواريخ بـ `datetime.fromisoformat()`.

## أهداف إضافية

- [ ] أضف فئات ملاحظات (مجلدات) إلى جانب العلامات
- [ ] نفّذ البحث الضبابي باستخدام `difflib.SequenceMatcher`
- [ ] ابنِ واجهة ويب بسيطة بـ `flask` لعرض الملاحظات وتحريرها في متصفح
- [ ] أضف معاينة عرض Markdown في الطرفية باستخدام `rich`

## ما تعلمته

- تصميم نموذج بيانات بالقواميس وJSON للتخزين الدائم
- تنفيذ بحث كامل النص عبر حقول متعددة بمطابقة غير حساسة لحالة الأحرف
- بناء نظام علامات مرن بعمليات الإضافة والإزالة والتصفية والعد
- إنشاء السجلات المنظمة وتحريرها وحذفها مع التحقق السليم
- تصدير البيانات إلى ملفات Markdown مع توليد أسماء ملفات آمنة
- بناء واجهة CLI مصقولة بحلقة قائمة ومخرجات ملونة والتحقق من المدخلات ومعالجة الأخطاء
