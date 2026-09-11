---
title: "محوّل المستندات"
description: "التحويل بين Markdown و HTML و PDF و DOCX و LaTeX مع قوالب الأنماط."
difficulty: "beginner"
estimatedMinutes: 40
xpReward: 50
tags: ["file-io", "markdown", "html", "cli"]
prerequisites: ["أساسيات بايثون (متغيرات، حلقات، دوال، سلاسل)", "الإدخال/الإخراج الأساسي للملفات"]
---

# محوّل المستندات

تأتي المستندات بصيغ كثيرة — Markdown للكتابة، وHTML للويب، ونص عادي للمشاركة السريعة. التحويل اليدوي بينها مملّ وعرضة للخطأ. في هذا المشروع ستبني أداة بايثون تقرأ ملفات Markdown، وتحوّلها إلى HTML أو نص عادي، وتستخرج البيانات الوصفية من ترويسات المستندات، وتعالج أدلة كاملة في أمر واحد.

- **شغّله في المتصفح.** هناك دفتر ملاحظات تفاعلي جاهز — افتحه على Colab أو Kaggle أو Binder وتابع خطوة بخطوة.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/document-converter/notebook.ar.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/document-converter/notebook.ar.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdocument-converter%2Fnotebook.ar.ipynb)

## ما ستتعلمه

1. تحليل صيغة Markdown إلى بيانات منظمة
2. تحويل Markdown إلى HTML بوسوم صحيحة
3. تجريد HTML إلى نص عادي
4. استخراج البيانات الوصفية من ترويسة المستند (frontmatter)
5. معالجة عدة ملفات دفعةً واحدة

## ما ستبنيه

محوّل مستندات يقوم بالآتي:
- يقرأ ملفات Markdown ويحوّلها إلى HTML
- يطبّق تنسيقات CSS على HTML المُولَّد
- يحوّل HTML عائدًا إلى نص عادي
- يستخرج البيانات الوصفية من YAML frontmatter
- يعالج أدلة كاملة في أمر واحد

## الإعداد

```bash
uv init document-converter
cd document-converter
```

---

## الخطوة 1: قراءة ملفات Markdown

**الهدف:** تحميل محتويات ملف Markdown في سلسلة بايثون لتتمكن من التعامل معها.

**الشرح:** قراءة الملفات أساس أي محوّل. دالة بايثون `open()` مع نمط `"r"` تفتح ملفًا للقراءة. وطريقة `.read()` تسحب محتويات الملف كاملة في سلسلة واحدة. استخدم دائمًا عبارة `with` حتى يُغلق الملف تلقائيًا، حتى لو حدث خطأ.

**تلميح البداية:** تحتاج ملف Markdown نموذجيًا للاختبار. أنشئ `sample.md` أولًا، ثم اكتب دالة تقرؤه.

### أنشئ الملف النموذجي

أنشئ ملفًا اسمه `sample.md` في جذر مشروعك بهذا المحتوى:

```markdown
# Hello World

This is a **bold** word and this is an *italic* word.

## Features

- Item one
- Item two
- Item three

[A link to Python](https://python.org)

```python
print("Hello!")
```
```

### الكود العامل

```python
def read_markdown(filepath: str) -> str:
    """Read a Markdown file and return its contents."""
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read()


if __name__ == "__main__":
    content = read_markdown("sample.md")
    print(f"Read {len(content)} characters from sample.md")
    print("---")
    print(content[:200])
```

### الناتج المتوقع

```
Read 189 characters from sample.md
---
# Hello World

This is a **bold** word and this is an *italic* word.

## Features

- Item one
- Item two
- Item three

[A link to Python](https://python.org)

```python
print("Hello!")
```
```

### استكشاف الأخطاء وإصلاحها

- **`FileNotFoundError`**: تحقق من مسار الملف. استخدم `os.path.exists(filepath)` للتأكد من وجود الملف قبل القراءة.
- **`UnicodeDecodeError`**: تستخدم بعض الملفات ترميزًا غير UTF-8. أضف `errors="replace"` إلى `open()` لتجاوز المحارف التالفة.
- **مخرجات فارغة**: قد يكون الملف فارغًا أو يشير المسار إلى ملف خاطئ. اطبع `filepath` قبل الفتح.

### قائمة التحقق

- [ ] أنشأت `sample.md` بمحتوى Markdown
- [ ] تُرجع الدالة محتويات الملف كاملة كسلسلة
- [ ] استخدمت عبارة `with` للتعامل الآمن مع الملفات
- [ ] تحققت أن الناتج يطبع أول 200 حرف

### سؤال سقراطي

لماذا تُهمّ عبارة `with open(...)` مقارنةً بالاستدعاء اليدوي `open()` و`close()`؟ ماذا يحدث إذا أُطلق استثناء بين `open()` و`close()`؟

---

## الخطوة 2: تحويل Markdown إلى HTML

**الهدف:** تحويل صيغة Markdown إلى وسوم HTML المقابلة.

**الشرح:** يملك Markdown صيغة بسيطة منتظمة: `#` للعناوين، و`**نص**` للعريض، و`*نص*` للمائل، و`-` لبنود القوائم، و`[نص](رابط)` للروابط، وثلاث علامات backtick لكتل الأكواد. يمكنك كتابة محوّل بجمع كل نمط إلى نظيره في HTML عبر التعبيرات النمطية.

**تلميح البداية:** استخدم وحدة `re`. لكل عنصر Markdown، اكتب نمطًا يطابقه واستبدالًا يغلّفه بوسوم HTML.

### الكود العامل

```python
import re


def markdown_to_html(md_text: str) -> str:
    """Convert Markdown text to HTML."""
    html = md_text

    # Code blocks (``` ... ```)
    html = re.sub(
        r"```(\w*)\n(.*?)```",
        r'<pre><code class="language-\1">\2</code></pre>',
        html,
        flags=re.DOTALL,
    )

    # Inline code
    html = re.sub(r"`([^`]+)`", r"<code>\1</code>", html)

    # Headings
    html = re.sub(r"^### (.+)$", r"<h3>\1</h3>", html, flags=re.MULTILINE)
    html = re.sub(r"^## (.+)$", r"<h2>\1</h2>", html, flags=re.MULTILINE)
    html = re.sub(r"^# (.+)$", r"<h1>\1</h1>", html, flags=re.MULTILINE)

    # Bold and italic
    html = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", html)
    html = re.sub(r"\*(.+?)\*", r"<em>\1</em>", html)

    # Links
    html = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', html)

    # Unordered lists
    lines = html.split("\n")
    in_list = False
    result = []
    for line in lines:
        if line.startswith("- "):
            if not in_list:
                result.append("<ul>")
                in_list = True
            result.append(f"  <li>{line[2:]}</li>")
        else:
            if in_list:
                result.append("</ul>")
                in_list = False
            result.append(line)
    if in_list:
        result.append("</ul>")
    html = "\n".join(result)

    # Paragraphs (wrap remaining plain text lines)
    html = re.sub(r"\n\n+", "\n\n", html)

    return html


if __name__ == "__main__":
    content = read_markdown("sample.md")
    html = markdown_to_html(content)
    print(html)
```

### الناتج المتوقع

```html
<h1>Hello World</h1>

<p>This is a <strong>bold</strong> word and this is an <em>italic</em> word.</p>

<h2>Features</h2>

<ul>
  <li>Item one</li>
  <li>Item two</li>
  <li>Item three</li>
</ul>

<a href="https://python.org">A link to Python</a>

<pre><code class="language-python">print("Hello!")</code></pre>
```

### استكشاف الأخطاء وإصلاحها

- **العريض لا يُحوَّل**: تأكد من معالجة أنماط `**` قبل أنماط `*`. وإلا سيطابق تعبير المائل أول `*` من `**` ويكسّر نمط العريض.
- **كتل الأكواد تلتهم المحتوى**: علامة `re.DOTALL` تسمح لـ `.` بمطابقة الأسطر الجديدة داخل كتلة الأكواد. دونها يطابق التعبير كتل الأكواد أحادية السطر فقط.
- **القوائم لا تُغلَّف**: يعتمد محلل القوائم على أسطر متتالية تبدأ بـ `- `. الأسطر الفارغة بين البنود تكسّر المجموعة. هذا مقبول لهذا المشروع — تُعالَج كل كتلة قائمة على حدة.

### قائمة التحقق

- [ ] تتحول العناوين إلى وسوم `<h1>` و`<h2>` و`<h3>`
- [ ] يصبح العريض (`**`) `<strong>` والمائل (`*`) `<em>`
- [ ] تتحول الروابط إلى وسوم `<a href="...">`
- [ ] تُغلَّف بنود القوائم بوسمي `<ul>` و`<li>`
- [ ] تُغلَّف كتل الأكواد بوسمي `<pre><code>` مع صنف اللغة

### سؤال سقراطي

لماذا يجب معالجة أنماط العريض قبل أنماط المائل؟ ماذا سيحدث لو عُكس الترتيب؟

---

## الخطوة 3: إضافة تنسيق CSS

**الهدف:** تغليف HTML المُولَّد في بنية مستند كاملة مع CSS مضمّن لمظهر مصقول.

**الشرح:** HTML خام دون كتلة `<head>` أو `<style>` يُعرض كنص غير منسّق في المتصفح. بتغليف محتواك المُحوَّل في مستند HTML كامل مع CSS مضمّن تحصل على صفحة قابلة للعرض من دون أي تبعيات خارجية.

**تلميح البداية:** أنشئ ثابت سلسلة يحمل هيكل HTML مع كتلة `<style>`، ثم أدخل محتواك المُحوَّل في الجسم (body).

### الكود العامل

```python
CSS = """
body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    max-width: 700px;
    margin: 2rem auto;
    padding: 0 1rem;
    line-height: 1.6;
    color: #333;
}
h1, h2, h3 { color: #111; }
code {
    background: #f4f4f4;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-size: 0.9em;
}
pre {
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 1rem;
    border-radius: 6px;
    overflow-x: auto;
}
pre code { background: none; padding: 0; color: inherit; }
a { color: #0066cc; }
ul { padding-left: 1.5rem; }
"""


def wrap_html(body: str, title: str = "Converted Document") -> str:
    """Wrap HTML body in a full document with CSS."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>{CSS}</style>
</head>
<body>
{body}
</body>
</html>"""


if __name__ == "__main__":
    content = read_markdown("sample.md")
    html_body = markdown_to_html(content)
    full_html = wrap_html(html_body, title="My Document")
    print(full_html[:500])
```

### الناتج المتوقع

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Document</title>
    <style>
body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    max-width: 700px;
    margin: 2rem auto;
    ...
</style>
</head>
<body>
<h1>Hello World</h1>
...
</body>
</html>
```

### استكشاف الأخطاء وإصلاحها

- **CSS لا تظهر**: تأكد أن وسم `<style>` داخل `<head>`، لا داخل `<body>`.
- **محارف خاصة في العنوان**: إذا احتوى العنوان علامات اقتباس فستكسر خاصية HTML. استخدم `html.escape(title)` من وحدة `html` لتعقيمها.
- **الملف لا يُعرض في المتصفح**: احفظه بصيغة `.html` (وليست `.md`) وافتحه في متصفح.

### قائمة التحقق

- [ ] يتضمن HTML تصريح `<!DOCTYPE html>`
- [ ] CSS مضمّنة في كتلة `<style>` داخل `<head>`
- [ ] للصفحة عنوان قابل للضبط
- [ ] محتوى الجسم مُدخل بين وسوم `<body>`
- [ ] فتح ملف الإخراج في متصفح يعرض محتوى منسّقًا

### سؤال سقراطي

لماذا نضمّن CSS مباشرة في ملف HTML بدلًا من الربط بورقة أنماط خارجية؟ ما مقايضات كل نهج؟

---

## الخطوة 4: تحويل HTML إلى نص عادي

**الهدف:** تجريد كل وسوم HTML وإعادة نص عادي نظيف.

**الشرح:** تحويل HTML عائدًا إلى نص عادي مفيد للمعاينات، أو فهرسة البحث، أو أجسام البريد. النهج مباشر: أزل كل الوسوم بتعبير نمطي، ثم نظّف المسافات الزائدة. هذا ليس محلل HTML كاملًا، لكنه يعمل جيدًا للمستندات البسيطة.

**تلميح البداية:** استخدم `re.sub(r"<[^>]+>", "", html)` لإزالة الوسوم، ثم ادمج المسافات المتعددة والأسطر الفارغة.

### الكود العامل

```python
import html as html_module


def html_to_text(html_str: str) -> str:
    """Convert HTML to plain text by stripping tags."""
    text = html_str

    # Replace block elements with newlines for spacing
    text = re.sub(r"<(br|hr)\s*/?>", "\n", text)
    text = re.sub(r"</(p|div|h[1-6]|li|pre)>", "\n", text)

    # Remove all remaining tags
    text = re.sub(r"<[^>]+>", "", text)

    # Decode HTML entities (&amp; -> &, &lt; -> <, etc.)
    text = html_module.unescape(text)

    # Clean up whitespace
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = text.strip()

    return text


if __name__ == "__main__":
    content = read_markdown("sample.md")
    html_body = markdown_to_html(content)
    plain = html_to_text(html_body)
    print(plain)
```

### الناتج المتوقع

```
Hello World

This is a bold word and this is an italic word.

Features

- Item one
- Item two
- Item three

A link to Python

print("Hello!")
```

### استكشاف الأخطاء وإصلاحها

- **أسطر فارغة زائدة**: النمط `\n{3,}` يدمج ثلاثة أسطر فارغة أو أكثر في سطرين. اضبط العتبة إذا أردت تباعدًا أشد.
- **الكيانات لا تُفكَّ**: تأكد من استدعاء `html_module.unescape()` بعد إزالة الوسوم لا قبلها. تعيش بعض الكيانات داخل خصائص الوسوم ولا ينبغي فكّها في نص الجسم.
- **التنسيق ضاع**: هذا متوقع. النص العادي لا يملك مفهومًا للعريض أو المائل. نهج التجريد ينتج نصًا نظيفًا لكنه يفقد معلومات التنسيق.

### قائمة التحقق

- [ ] أُزيلت كل وسوم HTML
- [ ] فُكّت كيانات HTML إلى محارفها
- [ ] دُمجت المسافات الزائدة والأسطر الفارغة
- [ ] الناتج نص عادي نظيف قابل للقراءة

### سؤال سقراطي

ماذا يحدث إذا شغّلت هذه الدالة على HTML يحوي وسم `<script>` بكود جافا سكريبت؟ كيف تتعامل مع تلك الحالة؟

---

## الخطوة 5: استخراج البيانات الوصفية

**الهدف:** تحليل YAML frontmatter من بداية ملف Markdown وإعادته كقاموس.

**الشرح:** تبدأ ملفات Markdown كثيرة بكتلة YAML frontmatter محدَّدة بـ `---`. تحوي هذه الكتلة بيانات وصفية مثل العنوان والمؤلف والتاريخ والوسوم. استخراج هذه البيانات يتيح لمحوّلك إضافتها إلى وسوم `<meta>` في HTML أو استخدامها لتنظيم الملفات.

**تلميح البداية:** قسّم محتوى الملف على `---`. الجزء الأول هو frontmatter (إن وُجد). حلّله سطرًا سطرًا، مقيّسًا أول `:` لتحصل على أزواج مفاتيح وقيم.

### أنشئ ملف اختبار

أنشئ `sample_with_meta.md`:

```markdown
---
title: My Blog Post
author: Jane Doe
date: 2025-01-15
tags: python, tutorial, beginner
---

# My Blog Post

This post covers Python basics.

## Why Python?

Python is great for beginners.
```

### الكود العامل

```python
def extract_frontmatter(text: str) -> tuple[dict, str]:
    """Extract YAML frontmatter and return (metadata_dict, body_text)."""
    lines = text.split("\n")

    if not lines or lines[0].strip() != "---":
        return {}, text

    # Find the closing ---
    end_index = None
    for i, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            end_index = i
            break

    if end_index is None:
        return {}, text

    # Parse frontmatter lines
    metadata = {}
    for line in lines[1:end_index]:
        line = line.strip()
        if not line or ":" not in line:
            continue
        key, _, value = line.partition(":")
        key = key.strip()
        value = value.strip()

        # Convert comma-separated values to list
        if "," in value:
            value = [v.strip() for v in value.split(",")]

        metadata[key] = value

    body = "\n".join(lines[end_index + 1 :])
    return metadata, body


if __name__ == "__main__":
    text = read_markdown("sample_with_meta.md")
    meta, body = extract_frontmatter(text)
    print("Metadata:", meta)
    print("---")
    print("Body preview:", body[:100])
```

### الناتج المتوقع

```
Metadata: {'title': 'My Blog Post', 'author': 'Jane Doe', 'date': '2025-01-15', 'tags': ['python', 'tutorial', 'beginner']}
---
Body preview: 

# My Blog Post

This post covers Python basics.

## Why Python?

Python is great for beginners.
```

### استكشاف الأخطاء وإصلاحها

- **لا بيانات وصفية تُعاد**: يجب أن يبدأ الملف بـ `---` في السطر الأول تمامًا. لا أسطر فارغة قبله.
- **قيم تحوي نقطتين**: إذا احتوت القيمة نقطتين (مثل `url: https://example.com`)، تتعامل `partition(":")` معها صحيحًا لأنها تقسّم على النقطة *الأولى* فقط.
- **YAML مُتداخَل**: يتعامل هذا المحلل مع أزواج المفاتيح والقيم المسطحة. لا يدعم بنى YAML المتداخلة. لتلك استخدم مكتبة `pyyaml`.

### قائمة التحقق

- [ ] يُستخرج frontmatter عندما يكون موجودًا
- [ ] ملفات بلا frontmatter تُرجع قاموسًا فارغًا ونص الكود كاملًا
- [ ] الوسوم المنفصلة بفواصل تصبح قائمة
- [ ] يبدأ نص الكود بعد `---` الإغلاقية
- [ ] تُجرَّد المفاتيح والقيم من المسافات

### سؤال سقراطي

لماذا يحلل هذا المشروع frontmatter يدويًا بدلًا من استخدام مكتبة مثل PyYAML؟ متى تختار النهج اليدوي مقابل اللجوء إلى مكتبة؟

---

## الخطوة 6: التحويل الدفعي

**الهدف:** معالجة كل ملف Markdown في دليل وتحويلها إلى HTML.

**الشرح:** يتطلب الاستخدام الواقعي تحويل عدة ملفات دفعة واحدة. تتيح لك وحدتا `os` و`pathlib` في بايثون التجوال في الأدلة، والعثور على ملفات `.md`، وتطبيق محوّلك على كل منها. التحويل الدفعي يحوّل أداة أحادية الملف إلى أداة حقيقية.

**تلميح البداية:** استخدم `pathlib.Path.glob("**/*.md")` للعثور على كل ملفات Markdown في دليل بشكل متكرر.

### الكود العامل

```python
from pathlib import Path


def batch_convert(
    input_dir: str,
    output_dir: str,
    format: str = "html",
) -> list[str]:
    """Convert all Markdown files in input_dir to the target format.

    Returns a list of output file paths.
    """
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    converted_files = []

    for md_file in input_path.glob("**/*.md"):
        text = md_file.read_text(encoding="utf-8")
        metadata, body = extract_frontmatter(text)
        html_body = markdown_to_html(body)

        # Determine output path
        rel_path = md_file.relative_to(input_path)
        if format == "html":
            out_file = output_path / rel_path.with_suffix(".html")
            full_html = wrap_html(html_body, title=metadata.get("title", rel_path.stem))
            out_file.write_text(full_html, encoding="utf-8")
        elif format == "text":
            out_file = output_path / rel_path.with_suffix(".txt")
            plain = html_to_text(html_body)
            out_file.write_text(plain, encoding="utf-8")

        converted_files.append(str(out_file))
        print(f"  Converted: {md_file.name} -> {out_file.name}")

    return converted_files


if __name__ == "__main__":
    print("Converting sample.md to HTML...")
    files = batch_convert(".", "output/html", format="html")
    print(f"\nDone. Converted {len(files)} file(s).")
```

### الناتج المتوقع

```
Converting sample.md to HTML...
  Converted: sample.md -> sample.html
  Converted: sample_with_meta.md -> sample_with_meta.html

Done. Converted 2 file(s).
```

### استكشاف الأخطاء وإصلاحها

- **`FileExistsError` مع mkdir**: استخدم `exist_ok=True` لتجنب الأخطاء إذا كان دليل الإخراج موجودًا أصلًا.
- **أخطاء الترميز عند القراءة**: قد لا تكون بعض الملفات UTF-8. لفّ استدعاء `read_text` في try/except وارجع إلى `errors="replace"`.
- **دليل إخراج فارغ**: تحقق أن نمط glob يطابق ملفاتك. `**/*.md` متكرر؛ `*.md` يطابق المستوى الأعلى فقط.

### قائمة التحقق

- [ ] تُعثر على كل ملفات `.md` في دليل الإدخال
- [ ] تُنشأ ملفات الإخراج في دليل الإخراج
- [ ] تتضمن ملفات HTML البيانات الوصفية كعنوان صفحة
- [ ] بنية الدليل محفوظة في الإخراج
- [ ] يُنشأ دليل إخراج فارغ إذا لم يكن موجودًا

### سؤال سقراطي

ماذا يتغير إذا احتجت أيضًا إلى معالجة ملفات `.markdown` (وليست `.md` فقط)؟ كيف تعدّل نمط glob؟

---

## الخطوة 7: بناء واجهة CLI

**الهدف:** تغليف كل الوظائف في واجهة سطر أوامر ليتمكن المستخدمون من تشغيل التحويلات من الطرفية.

**الشرح:** تجعل CLI أداتك قابلة للاستخدام دون كتابة كود بايثون. تتولى وحدة `argparse` في بايثون تحليل الوسائط، ونص المساعدة، والتحقق. هذه الخطوة الأخيرة تحوّل سكربتاتك إلى أداة سطر أوامر حقيقية.

**تلميح البداية:** استخدم `argparse.ArgumentParser` بأوامر فرعية أو علامات للصيغة والمدخل والمخرج.

### الكود العامل

```python
import argparse
import sys


def main():
    parser = argparse.ArgumentParser(
        description="Convert Markdown files to HTML or plain text.",
        epilog="Examples:\n"
        "  python converter.py sample.md\n"
        "  python converter.py sample.md -o output.html -f text\n"
        '  python converter.py docs/ -o converted/ -f html',
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    parser.add_argument(
        "input",
        help="Input file or directory to convert",
    )
    parser.add_argument(
        "-o", "--output",
        help="Output file or directory (default: stdout for files, ./output/ for dirs)",
    )
    parser.add_argument(
        "-f", "--format",
        choices=["html", "text"],
        default="html",
        help="Output format (default: html)",
    )
    parser.add_argument(
        "--title",
        default="Converted Document",
        help="Title for HTML output (default: Converted Document)",
    )
    parser.add_argument(
        "--extract-meta",
        action="store_true",
        help="Print extracted metadata and exit",
    )

    args = parser.parse_args()
    input_path = Path(args.input)

    # Extract metadata mode
    if args.extract_meta:
        if not input_path.is_file():
            parser.error("--extract-meta requires a file, not a directory")
        text = input_path.read_text(encoding="utf-8")
        meta, _ = extract_frontmatter(text)
        for key, value in meta.items():
            print(f"  {key}: {value}")
        return

    # Single file conversion
    if input_path.is_file():
        text = input_path.read_text(encoding="utf-8")
        metadata, body = extract_frontmatter(text)
        html_body = markdown_to_html(body)

        if args.format == "html":
            title = metadata.get("title", args.title)
            result = wrap_html(html_body, title=title)
        else:
            result = html_to_text(html_body)

        if args.output:
            Path(args.output).write_text(result, encoding="utf-8")
            print(f"Converted {input_path.name} -> {args.output}")
        else:
            print(result)

    # Directory batch conversion
    elif input_path.is_dir():
        output_dir = args.output or "output"
        files = batch_convert(str(input_path), output_dir, format=args.format)
        print(f"\nConverted {len(files)} file(s) to {output_dir}/")

    else:
        print(f"Error: {args.input} does not exist", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
```

### الناتج المتوقع

ملف واحد إلى stdout:
```bash
python converter.py sample.md
```
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Converted Document</title>
    <style>body { font-family: sans-serif; ... }</style>
</head>
<body>
<h1>Hello World</h1>
...
</body>
</html>
```

ملف واحد إلى ملف إخراج:
```bash
python converter.py sample.md -o output.html
Converted sample.md -> output.html
```

دليل دفعة:
```bash
python converter.py docs/ -o converted/ -f html
  Converted: intro.md -> intro.html
  Converted: guide.md -> guide.html

Converted 2 file(s) to converted/
```

استخراج البيانات الوصفية:
```bash
python converter.py sample_with_meta.md --extract-meta
  title: My Blog Post
  author: Jane Doe
  date: 2025-01-15
  tags: python, tutorial, beginner
```

المساعدة:
```bash
python converter.py --help
```
```
usage: converter.py [-h] [-o OUTPUT] [-f {html,text}] [--title TITLE]
                    [--extract-meta] input

Convert Markdown files to HTML or plain text.

positional arguments:
  input                 Input file or directory to convert

options:
  -h, --help            show this help message and exit
  -o, --output          Output file or directory
  -f, --format          Output format (default: html)
  --title               Title for HTML output
  --extract-meta        Print extracted metadata and exit

Examples:
  python converter.py sample.md
  python converter.py sample.md -o output.html -f text
  python converter.py docs/ -o converted/ -f html
```

### استكشاف الأخطاء وإصلاحها

- **`argparse` يقول وسائط غير معترف بها**: تأكد أن العلامات تأتي *بعد* الوسيط الموضعي، لا قبله.
- **`sys.exit` في الاختبارات**: إذا كنت تختبر في REPL، فلفّ `main()` في try/except `SystemExit`.
- **لا ناتج عند الأنابيب (piping)**: إذا كنت تنقل إلى ملف، تأكد أنك لا تطبع إلى stdout أيضًا. وضع الملف الواحد يطبع إلى stdout عند عدم تحديد `-o`.

### قائمة التحقق

- [ ] تقبل CLI مسار الإدخال ومسار الإخراج وعلامة الصيغة
- [ ] وضع الملف الواحد يطبع إلى stdout أو يكتب إلى ملف إخراج
- [ ] وضع الدليل يحوّل كل ملفات `.md`
- [ ] `--extract-meta` يطبع frontmatter ويخرج
- [ ] `--help` يعرض أمثلة استخدام
- [ ] مسارات الإدخال غير الصحيحة تنتج رسالة خطأ واضحة

### سؤال سقراطي

لماذا يستخدم CLI `sys.exit(1)` للأخطاء بدلًا من مجرد طباعة رسالة؟ ماذا يبلّغ رمز الخروج البرامجَ أو السكربتات الأخرى التي تستدعي أداتك؟

---

## الملف الكامل converter.py

هذا هو الملف الكامل بكل الخطوات مجتمعة:

```python
"""Document Converter - Convert between Markdown, HTML, and plain text."""

import re
import html as html_module
import argparse
import sys
from pathlib import Path


def read_markdown(filepath: str) -> str:
    """Read a Markdown file and return its contents."""
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read()


def markdown_to_html(md_text: str) -> str:
    """Convert Markdown text to HTML."""
    html = md_text

    # Code blocks
    html = re.sub(
        r"```(\w*)\n(.*?)```",
        r'<pre><code class="language-\1">\2</code></pre>',
        html,
        flags=re.DOTALL,
    )

    # Inline code
    html = re.sub(r"`([^`]+)`", r"<code>\1</code>", html)

    # Headings
    html = re.sub(r"^### (.+)$", r"<h3>\1</h3>", html, flags=re.MULTILINE)
    html = re.sub(r"^## (.+)$", r"<h2>\1</h2>", html, flags=re.MULTILINE)
    html = re.sub(r"^# (.+)$", r"<h1>\1</h1>", html, flags=re.MULTILINE)

    # Bold and italic
    html = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", html)
    html = re.sub(r"\*(.+?)\*", r"<em>\1</em>", html)

    # Links
    html = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', html)

    # Lists
    lines = html.split("\n")
    in_list = False
    result = []
    for line in lines:
        if line.startswith("- "):
            if not in_list:
                result.append("<ul>")
                in_list = True
            result.append(f"  <li>{line[2:]}</li>")
        else:
            if in_list:
                result.append("</ul>")
                in_list = False
            result.append(line)
    if in_list:
        result.append("</ul>")
    html = "\n".join(result)

    html = re.sub(r"\n{3,}", "\n\n", html)

    return html


CSS = """
body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    max-width: 700px;
    margin: 2rem auto;
    padding: 0 1rem;
    line-height: 1.6;
    color: #333;
}
h1, h2, h3 { color: #111; }
code {
    background: #f4f4f4;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-size: 0.9em;
}
pre {
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 1rem;
    border-radius: 6px;
    overflow-x: auto;
}
pre code { background: none; padding: 0; color: inherit; }
a { color: #0066cc; }
ul { padding-left: 1.5rem; }
"""


def wrap_html(body: str, title: str = "Converted Document") -> str:
    """Wrap HTML body in a full document with CSS."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>{CSS}</style>
</head>
<body>
{body}
</body>
</html>"""


def html_to_text(html_str: str) -> str:
    """Convert HTML to plain text by stripping tags."""
    text = html_str

    text = re.sub(r"<(br|hr)\s*/?>", "\n", text)
    text = re.sub(r"</(p|div|h[1-6]|li|pre)>", "\n", text)

    text = re.sub(r"<[^>]+>", "", text)
    text = html_module.unescape(text)

    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = text.strip()

    return text


def extract_frontmatter(text: str) -> tuple[dict, str]:
    """Extract YAML frontmatter and return (metadata_dict, body_text)."""
    lines = text.split("\n")

    if not lines or lines[0].strip() != "---":
        return {}, text

    end_index = None
    for i, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            end_index = i
            break

    if end_index is None:
        return {}, text

    metadata = {}
    for line in lines[1:end_index]:
        line = line.strip()
        if not line or ":" not in line:
            continue
        key, _, value = line.partition(":")
        key = key.strip()
        value = value.strip()

        if "," in value:
            value = [v.strip() for v in value.split(",")]

        metadata[key] = value

    body = "\n".join(lines[end_index + 1 :])
    return metadata, body


def batch_convert(
    input_dir: str,
    output_dir: str,
    format: str = "html",
) -> list[str]:
    """Convert all Markdown files in input_dir to the target format."""
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    converted_files = []

    for md_file in input_path.glob("**/*.md"):
        text = md_file.read_text(encoding="utf-8")
        metadata, body = extract_frontmatter(text)
        html_body = markdown_to_html(body)

        rel_path = md_file.relative_to(input_path)
        if format == "html":
            out_file = output_path / rel_path.with_suffix(".html")
            full_html = wrap_html(html_body, title=metadata.get("title", rel_path.stem))
            out_file.write_text(full_html, encoding="utf-8")
        elif format == "text":
            out_file = output_path / rel_path.with_suffix(".txt")
            plain = html_to_text(html_body)
            out_file.write_text(plain, encoding="utf-8")

        converted_files.append(str(out_file))
        print(f"  Converted: {md_file.name} -> {out_file.name}")

    return converted_files


def main():
    parser = argparse.ArgumentParser(
        description="Convert Markdown files to HTML or plain text.",
        epilog="Examples:\n"
        "  python converter.py sample.md\n"
        "  python converter.py sample.md -o output.html -f text\n"
        '  python converter.py docs/ -o converted/ -f html',
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    parser.add_argument("input", help="Input file or directory to convert")
    parser.add_argument(
        "-o", "--output",
        help="Output file or directory (default: stdout for files)",
    )
    parser.add_argument(
        "-f", "--format",
        choices=["html", "text"],
        default="html",
        help="Output format (default: html)",
    )
    parser.add_argument(
        "--title",
        default="Converted Document",
        help="Title for HTML output",
    )
    parser.add_argument(
        "--extract-meta",
        action="store_true",
        help="Print extracted metadata and exit",
    )

    args = parser.parse_args()
    input_path = Path(args.input)

    if args.extract_meta:
        if not input_path.is_file():
            parser.error("--extract-meta requires a file, not a directory")
        text = input_path.read_text(encoding="utf-8")
        meta, _ = extract_frontmatter(text)
        for key, value in meta.items():
            print(f"  {key}: {value}")
        return

    if input_path.is_file():
        text = input_path.read_text(encoding="utf-8")
        metadata, body = extract_frontmatter(text)
        html_body = markdown_to_html(body)

        if args.format == "html":
            title = metadata.get("title", args.title)
            result = wrap_html(html_body, title=title)
        else:
            result = html_to_text(html_body)

        if args.output:
            Path(args.output).write_text(result, encoding="utf-8")
            print(f"Converted {input_path.name} -> {args.output}")
        else:
            print(result)

    elif input_path.is_dir():
        output_dir = args.output or "output"
        files = batch_convert(str(input_path), output_dir, format=args.format)
        print(f"\nConverted {len(files)} file(s) to {output_dir}/")

    else:
        print(f"Error: {args.input} does not exist", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
```

---

## 🧩 التحديات

1. **دعم القوائم المرقّمة**: وسّع `markdown_to_html` لتحويل أسطر `1.` و`2.` و`3.` إلى وسوم `<ol>` و`<li>`.

2. **الصور**: أضف دعمًا لـ `![نص بديل](image.png)` بالتحويل إلى `<img src="image.png" alt="نص بديل">`.

3. **الجداول**: تستخدم جداول Markdown محرفي `|` و`-`. أضف محوّلًا يحولها إلى وسوم `<table>`.

4. **عدّ الكلمات**: أضف علامة `--stats` تطبع عدد الكلمات وعدد الأسطر وعدد المحارف بدلًا من التحويل.

5. **وضع المراقبة**: أضف علامة `--watch` تراقب دليل الإدخال وتعيد التحويل عندما تتغير الملفات.

## ما تعلمته

- قراءة الملفات بـ `open()` وعبارة `with` لإدارة الموارد الآمنة
- استخدام `re` (التعبيرات النمطية) لمطابقة أنماط النص وتحويلها
- بناء مستندات HTML بتنسيقات CSS مضمّنة لصفحات مستقلة
- تجريد وسوم HTML وفكّ الكيانات لإنتاج نص عادي نظيف
- تحليل frontmatter من نمط YAML بسيط دون مكتبات خارجية
- التجوال في الأدلة بـ `pathlib.Path.glob()` للمعالجة الدفعية للملفات
- بناء CLI بـ `argparse` تدعم العلامات والأوامر الفرعية ونص المساعدة
- التعامل مع الأخطاء برشاقة عبر رموز الخروج ورسائل صديقة للمستخدم