---
title: "محرك مدونة Markdown"
description: "بيئة توليد مواقع ثابتة تحول مجلدًا من منشورات Markdown إلى مدونة HTML حقيقية — بما في ذلك تحليل البيانات الوصفية وترجمة العلامات إلى صفحات فهرس مصفاة حسب الوسوم."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["cli", "frontend", "data-pipeline", "file-io"]
learningObjectives:
  - "تحليل بيانات وصفية YAML من ملفات Markdown يدويًا"
  - "تحويل مصدر Markdown إلى HTML باستخدام مكتبة markdown"
  - "ترجمة القوالب بـ f-strings الخاصة بـ Python وstring.Template"
  - "تجميع المنشورات وفهرس وسوم في موقع ثابت كامل"
prerequisites: ["python-101/file-io", "python-101/strings", "python-101/data-structures", "python-101/functions"]
---


# 📝 ابنِ محرك مدونة Markdown

الويب مبني على المواقع الثابتة — مجلد من منشورات نص عادي، وخطوة ترجمة واحدة، وكومة ملفات HTML لا تحتاج خادمًا ولا قاعدة بيانات ولا إطار عمل JavaScript لخدمتها. يبني هذا المشروع مولد مواقع ثابتة مصغرًا: يقرأ مجلد `posts/` من ملفات Markdown، ويحلل البيانات الوصفية YAML في كل منها للعنوان/التاريخ/الوسوم، ويحوّل الجسم إلى HTML، ويخرّج `site/` مكتملًا مع صفحة فهرس وقوائم منشورات مصفّاة بالوسوم — الشكل نفسه لمحركات خلف ألف مدونة حقيقية.

يفترض هذا إنهاء Python 101 — إدخال/إخراج الملفات، والسلاسل، والقواميس، والدوال. لا شيء أبعد من ذلك: لا أطر عمل، ولا قاعدة بيانات، ولا خدمات خارجية. هذا اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة.

## 🎯 ما ستفعله

1. تصميم صيغة ملف واحدة تجمع Markdown والبيانات الوصفية، وتقسيمها بنظافة إلى بيانات وصفية وجسم.
2. تحليل البيانات الوصفية YAML إلى dict من Python — محلل صغير يعالج علامات الاقتباس والقوائم.
3. ترجمة جسم Markdown إلى HTML بمكتبة، وتهريب أي شيء خطير.
4. بناء صفحة فهرس تسرد كل المنشورات، زائد صفحات مصفّاة لكل وسم.
5. تشغيل المولّد على مجلد منشورات حقيقي وفحص الموقع المكتمل في متصفح.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي هنا. مكافأة هذا المشروع فتح `site/index.html` في متصفح حقيقي، وحلقة «اكتب مجلد منشورات، وشغّل أمرًا واحدًا، موقع منشور» أصدق عندما تعيش المنشورات والمخرجات على نظام ملفات فعلي يمكنك نبشه.

**GitHub Codespaces** مسار جيد بنفس القدر — افتح [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وكل شيء أدناه، بما فيه معاينة المتصفح، يعمل بالطريقة نفسها من نافذة يُخدَم فيها عبر Cloudflare أو `python -m http.server`. لا يوجد ادعاء GitHub Page محلي هنا — إنه مجرد صندوق تطوير تبقى فيه الأوامر متطابقة.

**Google Colab وKaggle Notebooks وBinder طريقة مناسبة *لرؤية الآلية تعمل*، لكنها ضعيفة في المردود.** يولّد الدفتر أدناه مجلد `posts/` افتراضيًا في الذاكرة ويصيغ الموقع كاملًا إلى دليل يمكنك فحصه خلية بخلية — بحيث يعمل التحليل والقولبة والتجميع كلها بأمانة. ما لا يستطيع فعله جيدًا هو الحلقة الحقيقية المتمثلة في *كتابتك post.md الخاص بك وتحديث الصفحة*؛ تلك تمرين نظام ملفات زائد متصفح، وهو ما يمنحك إياه المسار المحلي أو مسار Codespace. استخدم الدفتر لتعلم الخطوات؛ وانتقل إلى `uv` عندما تريد النشر.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/markdown-blog-engine/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/markdown-blog-engine/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fmarkdown-blog-engine%2Fnotebook.ipynb)

## الإعداد

كل ما تحتاجه قبل كتابة المولّد: `uv` لـ Python حديثة، ومكتبة Markdown واحدة، ومجلد `posts/` بمنشورين واقعيين للمضغ.

### ثبّت `uv` والاعتماد الوحيد

**macOS / Linux** (الطرفية):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

أغلق طرفيتك وأعد فتحها، ثم:

```bash
uv --version
mkdir markdown-blog-engine && cd markdown-blog-engine
uv init --bare
uv add markdown
```

### اكتب منشورين افتتاحيين

الصق هذين في `posts/hello.md` و`posts/python-tips.md`:

```markdown
---
title: "Hello, world from Markdown"
date: "2026-08-03"
tags: "intro, meta"
---

A blog in **Markdown**? Sure. Here is the first post, rendered by *our own* tool.

## Why this exists

We are about to write a static site generator. This paragraph is **bold** on purpose, so the render step has something to do.
```

```markdown
---
title: "Three Python tips"
date: "2026-08-04"
tags: "python, tips"
---

1. Use `enumerate` instead of `range(len(...))`.
2. Prefer dicts to parallel lists.
3. **Test** your parser on bad input.
```

```bash
mkdir posts
# save the two blocks above as posts/hello.md and posts/python-tips.md
ls -la posts
```

**✅ قائمة التحقق**

- ✅ `uv --version` يطبع رقم إصدار.
- ✅ `markdown` مثبّتة عبر `uv add markdown`.
- ✅ يوجد `posts/hello.md` و`posts/python-tips.md`، كلّ منهما يبدأ كتلة بيانات وصفية يحدّها سطر `---`.

## الخطوة 1: قسّم ملفًا إلى بيانات وصفية وجسم

منشور موقع ثابت هو حقًا جزءان في ملف واحد: كتلة YAML صغيرة من البيانات الوصفية بين سطري `---`، ثم جسم Markdown. أول وظيفة للمولّد تقسيم نظيف ومملّ: حتى سطر `---` الثاني بيانات وصفية، وكل ما بعده الجسم. جعل هذا التقسيم *متينًا* قبل أي ترجمة أنيقة هو الفرق بين أداة تثق بها وأخرى تُسقط المنشورات بصمت.

### 1.1 اكتب المُقسِّم

```python
# engine.py
from pathlib import Path

def read_post(path: str) -> dict:
    text = Path(path).read_text(encoding="utf-8")
    if not text.startswith("---"):
        raise ValueError(f"{path}: no frontmatter block")
    lines = text.splitlines()
    end = next(i for i, l in enumerate(lines[1:], start=1) if l.strip() == "---")
    frontmatter = "\n".join(lines[1:end])
    body = "\n".join(lines[end + 1:])
    return {"path": path, "frontmatter": frontmatter, "body": body}

if __name__ == "__main__":
    for p in sorted(Path("posts").glob("*.md")):
        post = read_post(str(p))
        print(f"--- {p} ---")
        print("frontmatter:", post["frontmatter"].splitlines()[0])
        print("body starts:", repr(post["body"].splitlines()[0]))
```

`next((i for i, l in enumerate(...) if ...))` يجد سطر `---` *الثاني* في مسار واحد — الأول يستهلكه `startswith`، وكل ما بعد الثاني جسم. يعرض التعبير المولّد `StopIteration` على ملف مشوه، وهو فشل صاخب صادق بدلًا من نصف بيانات محللة تتسرب بصمت إلى الأسفل.

**👟 تلميح البداية :**

شغّل `engine.py` على المنشورين الافتتاحيين وتأكد أن التقسيم يضع أول الأسطر الصحيحة في كل نصف — أول سطر بيانات وصفية عنوان، وأول سطر جسم نثر.

**🎯 الناتج المتوقع :**

لكل منشور، سطر واحد يعرض أول سطر `frontmatter` مثل `title: "Hello, world from Markdown"` وسطرًا يعرض أول سطر `body` مثل `'A blog in **Markdown**? Sure. ...'`.

**🩹 إذا لم يعمل :**

إذا صعد `StopIteration` كتعقّب، فمنشور ما ينقصه سطر `---` الختامي — أضفه (يجب أن يرى التقسيم فاصلًا ثانيًا). إذا شمل الجسم سطر `---` الختامي، ففهرس `end` لديك منزاح بواحد — تحقق أن `lines[end + 1:]` يبدأ *بعد* ذلك السطر، لا عليه.

### 1.2 تحقّق من التقسيم

**✅ قائمة التحقق**

- ✅ ينقسم المنشوران الافتتاحيان إلى سلسلة بيانات وصفية وسلسلة جسم دون تسرّب أي سطر `---` إلى أي منهما.
- ✅ إزالة `---` الافتتاحية من ملف منشور تجعل `read_post` يرفع `ValueError` واضحًا باسم الملف.
- ✅ يمكنك التنبؤ بما يُرجعه `read_post` لملف به *ثلاثة* أسطر `---` (يستخدم التقسيم الثاني؛ ويصبح الثالث جسمًا).

**🤔 سؤال (أسئلة) سقراطي(ة)**

- نجد سطر `---` الختامي بفحص سطر يساوي `---` تمامًا. ماذا سيحدث مع سطر جسم يكون هو نفسه `---`؟ هل وضع الفشل تقسيم خاطئ صامت أم صاخب — وأيهما تفضل؟
- يُرجع المُقسِّم سلسلة البيانات الوصفية *الخام*. ماذا يعني ذلك لحالة الحافة السلسلة الفارغة حيث يملك منشوران معًا أسطرًا فارغة شاردة — وأين في خط الأنابيب تعتقد أن التحليل يجب أن يحدث؟

## الخطوة 2: حلّل البيانات الوصفية YAML

الآن تصبح سلسلة البيانات الوصفية dict حقيقيًا — `title` و`date` و`tags` — بحيث يستطيع باقي المحرك تنفيذ `post["title"]` بدلًا من إعادة تحليل النص. YAML جحر أرنب؛ والمولّد لا يحتاج إلا نحو 4 قواعد تغطي ملفاتنا الخاصة: `key: value`، وقيم مقتبسة بنقطتي رأس، وقوائم مفصولة بفواصل.

### 2.1 اكتب محلل YAML صغيرًا

```python
# engine.py (continued)

def parse_frontmatter(raw: str) -> dict:
    data = {}
    for line in raw.splitlines():
        if not line.strip():
            continue
        key, value = line.split(":", 1)
        value = value.strip()
        if value.startswith('"') and value.endswith('"'):
            value = value[1:-1]
        elif "," in value:
            value = [v.strip() for v in value.split(",")]
        elif not value:
            value = []
        data[key.strip()] = value
    return data

if __name__ == "__main__":
    for p in sorted(Path("posts").glob("*.md")):
        meta = parse_frontmatter(read_post(str(p))["frontmatter"])
        print(p, "->", meta)
```

`line.split(":", 1)` هو السطر الذي يجعل هذا آمنًا: التقسيم مرة واحدة يُبقي أي نقطتين *داخل القيمة* (مثل `08:30` أو `https://...`) دون مساس، لأن الجزء الثاني لا يُقسَّم مجددًا. ثم تأخذ القيمة أحد الأشكال الثلاثة — سلسلة غير مقتبسة، أو سلسلة مقتبسة تُجرّد اقتباساتها، أو قائمة فاصلة — وهي كامل مجموعة YAML الفرعية التي وعدنا بها.

**👟 تلميح البداية :**

اطبع dict المحلل للمنشورين قبل كتابة سطر واحد من أداة الترجمة — تريد أن ترى `tags` تصبح قائمة، لا سلسلة.

**🎯 الناتج المتوقع :**

سطران مثل `posts/hello.md -> {'title': 'Hello, world from Markdown', 'date': '2026-08-03', 'tags': ['intro', 'meta']}` — لاحظ أن `tags` قائمة حقيقية.

**🩹 إذا لم يعمل :**

إذا احتفظ `title` باقتباساته، ففرع تجريد الاقتباس `startswith/endswith` لا يطابق — تحقق من وجود مسافة زائدة *بعد* الاقتباس الختامي في الملف (نُجرّد الاقتباس بـ `strip()` لكن القيمة كانت قد جُرّدت بالفعل). إذا خرج `tags` كسلسلة واحدة `'intro, meta'`، ففحص `"," in value` جرى قبل التجريد — الترتيب مهم: جرّد أولًا، ثم تفرّع.

### 2.2 تحقّق من تحليل YAML

**✅ قائمة التحقق**

- ✅ يُرجع `parse_frontmatter` dict حيث `tags` قائمة و`title` سلسلة عارية بلا اقتباسات.
- ✅ قيمة مثل `date: "2026-08-04"` تُحلل إلى `'2026-08-04'` مع إزالة الاقتباسات.
- ✅ سطر بيانات وصفية *ينقصه* القيمة (`author:`) ينتج قائمة فارغة — ويمكنك شرح لماذا اختير `[]` على `None`.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لا يستطيع محللنا معالجة قائمة متداخلة أو كتلة `oneline: | ...`. اكتب أصغر بيانات وصفية قد تُحلَّل تحليلًا خاطئًا *بصمت* — وقرر إن كان ذلك مقبولًا لمحرك مدونة شخصية (تلميح: سمِّ الفشل صاخبًا مقابل هادئًا).
- محلل YAML حقيقي (مثل `PyYAML`، المكتبة التي تستخدمها الأدوات الحقيقية) يدعم المراسي والسلاسل متعددة الأسطر ومئة ميزة أخرى. ما كلفة جرّ ذلك إلى مشروع تتحكم في ملفاته؟ متى يصبح «فقط ثبّت PyYAML» الخيار الصحيح؟

## الخطوة 3: حوّل Markdown إلى HTML

التحليل ينتج نصًا؛ الترجمة تنتج صفحة. تحوّل مكتبة `markdown` الوسوم `**bold**` و`# heading` و`code` المسوّرة إلى `# heading` و`<h1>` و`<pre>`. هناك مثنية أمان في HTML الذي يخرج — قد يحتوي الجسم HTML خامًا، ويمكن للعدائي أن يحمل JavaScript. قد يكون الإصلاح المجرَّب، `bleach`، موجودًا بالفعل على إطارك. لذلك تعمل أداة الترجمة وظيفتين: تحويل، ثم تطهير.

### 3.1 حوّل وطهّر

```python
# render.py
from pathlib import Path

try:
    from bleach import clean
except ImportError:
    def clean(text: str, **kwargs) -> str:
        return text

import markdown as md

def to_html(body: str) -> str:
    raw = md.markdown(body, extensions=["fenced_code", "tables"])
    return clean(raw, tags={"p", "h1", "h2", "h3", "em", "strong", "code",
                            "pre", "ul", "ol", "li", "blockquote", "img",
                            "a", "table", "thead", "tbody", "tr", "td", "th"},
                  attributes={"a": {"href", "title"}, "img": {"src", "alt"}})

if __name__ == "__main__":
    body = "**Bold here** with <script>alert('x')</script> and `code`."
    print(to_html(body))
```

`bleach` هو عقلية *القائمة البيضاء* قيد التطبيق: بدلًا من محاولة الإمساك بكل شيء خبيث (لعبة خاسرة)، تعلن بالضبط عن الوسوم والخصائص التي قد تنجو، وكل شيء آخر — `<script>` — يُسقَط. استيراد `try/except` متعمد: الكود يعمل حتى على تثبيت عارٍ، متحللًا إلى لا تطهير، ويطبع بديلًا خاليًا من التحذيرات بحيث يتشارك الدفتر والتثبيت الكامل ملفًا واحدًا.

**👟 تلميح البداية :**

ثبّت bleach بـ`uv add bleach`، ثم شغّل `render.py` وتأكد أن وسم `<script>` اختفى من المخرجات بينما أصبح `**Bold**` وسم `<strong>`.

**🎯 الناتج المتوقع :**

HTML حيث يوجد `<strong>Bold here</strong>` ويغيب `<script>`/`alert(...)` كليًا — وسوم السكربت أزيلت بواسطة القائمة البيضاء.

**🩹 إذا لم يعمل :**

إذا ما زال `<script>` يظهر في المخرجات، فأنت تصطدم بالبديل `clean` المتحلل — تحقق أن `uv add bleach` نجح وأن مسار الاستيراد (`from bleach import clean`) صحيح. إذا لم تُترجم العلة، فـ `md.markdown` مع `extensions=["fenced_code", "tables"]` يُستدعى على *سلسلة الجسم التي ما زالت تحمل البيانات الوصفية* — تأكد أن `read_post` فصلها أولًا.

### 3.2 تحقّق من الترجمة

**✅ قائمة التحقق**

- ✅ يُرجع `to_html("**x**")` HTML يحتوي `<strong>x</strong>`.
- ✅ يُرجع `to_html("<script>...")` HTML بلا `<script>` ولا `<iframe>` ولا خصائص `onclick=`.
- ✅ تنجو كتل الكود المسوّرة (```` ```python ````) من الترجمة كـ `<pre>`/`<code>`.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- نجردّ HTML الخام *بعد* تحويل Markdown. تمرر معظم محركات Markdown الحقيقية HTML الخام دون مساس، وهذا سبب كون `md` + مطهّر ترتيب «حوّل، ثم قائمة بيضاء» المزدوج. ما الهجوم الذي سينجو إذا طهّرت *قبل* التحويل بدلًا من ذلك (تلميح: كل `<` في كتلة كود معنوية للمحوِّل)؟
- تبقي القائمة البيضاء `img` لكن خصائص `src`/`alt` فقط. ما المخاطرة الفعلية إذا أضفت `onerror` إلى الخصائص المسموحة — اكتب سطر HTML الواحد الذي يطلقها.

## الخطوة 4: اجمعه الصفحات

الآن يكسب المولّد كلمة «موقع»: يصبح كل منشور ملف `.html` خاصًا به، وتُشتَق صفحات الفهرس/الوسوم *من* المنشورات. الاشتقاق هو حيلة بناء الثابت الأساسية — لا تكتب الفهرس يدويًا أبدًا؛ تحسبه في كل تشغيل، بحيث تكون «أضف منشورًا، أعد التشغيل، يُحدَّث الفهرس» صحيحة دائمًا.

### 4.1 ابنِ قالب الصفحة والكاتب

```python
# sitegen.py
from pathlib import Path
from engine import read_post, parse_frontmatter
from render import to_html

PAGE = """<!doctype html>
<html><head><meta charset="utf-8">
<title>{title}</title></head>
<body>
<header><a href="index.html">All posts</a></header>
<h1>{title}</h1>
<p class="meta">{date} &middot; {tags}</p>
<article>{body_html}</article>
<footer><p><a href="index.html">&larr; back to index</a></p></footer>
</body></html>"""

def build_post(post_path: str, out_dir: Path) -> dict:
    raw = read_post(post_path)
    meta = parse_frontmatter(raw["frontmatter"])
    meta.setdefault("title", "Untitled")
    meta.setdefault("date", "unknown")
    tags = ", ".join(meta.get("tags", []))
    html = PAGE.format(title=meta["title"], date=meta["date"],
                       tags=tags, body_html=to_html(raw["body"]))
    out = out_dir / f"{Path(post_path).stem}.html"
    out.write_text(html, encoding="utf-8")
    return {"slug": Path(post_path).stem, "title": meta["title"],
            "date": meta["date"], "tags": meta.get("tags", [])}

if __name__ == "__main__":
    out = Path("site")
    out.mkdir(exist_ok=True)
    posts = sorted((build_post(str(p), out) for p in Path("posts").glob("*.md")),
                   key=lambda d: d["date"], reverse=True)
    print("built:", [p["slug"] for p in posts])
```

`PAGE` قالب صغير بفتحات `{name}` يملؤها `.format()` — النموذج والعرض والتحكم مزدحمون في سلسلة واحدة، وهو ما *يكفي* لمولّد بهذا الحجم. الفرز بالتاريخ (الأحدث أولًا) أول *عرض* يعتمد على البيانات الوصفية، وقيمة عودة `build_post` — لا الملف الذي كتبه — هي ما ستستهلكه صفحة الفهرس، بحيث لا يعيد الفهرس تحليل الملفات مرتين أبدًا.

**👟 تلميح البداية :**

شغّل `sitegen.py`، ثم `open site/hello.html` (أو `start`/`xdg-open` على نظام تشغيلك) وانظر منشورًا مُترجمًا فعليًا قبل بناء الفهرس.

**🎯 الناتج المتوقع :**

`built: ['python-tips', 'hello']` (الأحدث أولًا — تاريخ `python-tips` 2026-08-04) وملفا `.html` صغيران تحت `site/` يُترجمان في متصفح بعنوان وسطر بيانات وصفية وجسم مقالة.

**🩹 إذا لم يعمل :**

إذا انطلق `KeyError: 'title'`، فبيانات وصفية منشور ما تنقصها `title` — استدعاءات `setdefault` في `build_post` موجودة لامتصاص ذلك؛ إذا رأيت الخطأ، فـ setdefaults وُضعت *بعد* `.format` جرى فعلًا. إذا تراكمت `site/` صفحات قديمة من منشورات محذوفة، فهذا متوقع الآن: نظّف `site/` قبل كل بناء، أو سُمِّها ميزة واحذفها يدويًا.

### 4.2 ابنِ الفهرس بروابط لكل وسم

```python
# sitegen.py (continued)

def build_index(posts: list[dict], out_dir: Path) -> None:
    items = "\n".join(
        f'<li><a href="{p["slug"]}.html">{p["title"]}</a> '
        f'<small>({p["date"]})</small></li>' for p in posts)
    (out_dir / "index.html").write_text(
        f"""<!doctype html><html><head><meta charset="utf-8"><title>My blog</title></head>
<body><h1>My blog</h1><ul>{items}</ul>
<p>Tags: {tags_block(posts)}</p></body></html>""", encoding="utf-8")

def tags_block(posts: list[dict]) -> str:
    by_tag = {}
    for p in posts:
        for t in p["tags"]:
            by_tag.setdefault(t, []).append(p["slug"])
    return " ".join(f'<a href="tag-{t}.html">{t}</a>' for t in sorted(by_tag))

if __name__ == "__main__":
    # ...build_post loop as above, then:
    build_index(posts, out)  # referenced 'posts' from the previous block
    print("index written")
```

`by_tag.setdefault(t, []).append(...)` هو اصطلاح «ابنِ dict من قوائم» في سطر واحد — البديل `if t not in by_tag: by_tag[t] = []` هو الشيء نفسه مسطورًا بتفصيل. الفهرس *مشتق* كليًا: يحتوي صفر HTML مكتوب يدويًا، بحيث لا يمكن أن يختلف مع مجلد المنشورات أبدًا. هذه الثباتية هي السبب كله في أن البناء الثابت يتغلب على صيانة فهرس باليد.

**👟 تلميح البداية :**

أضف `build_index` و`tags_block`، أعد التشغيل، ثم افتح `index.html` وانقر رابط وسم — *اقرأ* الـ 404 قبل إصلاحه؛ سترى بالضبط ما يجب أن تخلقه الخطوة الدقيقة التالية.

**🎯 الناتج المتوقع :**

يسرد `site/index.html` المنشورين الأحدث أولًا، ويظهر سطر «Tags:» بـ `intro` و`meta` و`python` و`tips` رابطًا إلى `tag-intro.html` وما إليه، وتعيد كل صفحة منشور رابطها إلى الفهرس.

**🩹 إذا لم يعمل :**

إذا أعاد رابط وسم 404، فهذا *سلوك صحيح* — صفحات الهدف لا وجود لها بعد، والخطوة 5 هي تحديدًا توليد `tag-*.html`. إذا أظهر الفهرس المنشورات بترتيب خاطئ، يجب أن يعمل `sorted(..., key=lambda d: d["date"], reverse=True)` على القائمة المجمّعة *قبل* `build_index`، لا بعدها.

### 4.3 تحقّق من التجميع

**✅ قائمة التحقق**

- ✅ يُفتح `site/hello.html` و`site/python-tips.html` في متصفح بعنوان حقيقي وسطر بيانات وصفية وجسم مُترجم.
- ✅ يسرد `index.html` المنشورين الأحدث أولًا ويشير إلى ملفات `.html` موجودة (قد تُرجع روابط الوسوم 404 حتى الخطوة 5).
- ✅ إعادة تشغيل البناء بعد تعديل منشور تنتج HTML محدثًا — الفهرس والصفحات لا يختلفان مع `posts/` أبدًا.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يتلقى `build_index` *قائمة dict* بدلًا من إعادة قراءة نظام الملفات. ما الذي ينكسر — concretely — إذا أعاد محللة `posts/*.md` بدلًا من ذلك؟ (تلميح: مصدرا حقيقة وتناقض فرز.)
- صفحة الفهرس وصفحة الوسم كلتاهما تعتمدان على `posts`. إذا كان لمنشور وسوم `["a", "b"]`، فالفهرس يجمعها بفاصلة بينما صفحة الوسم *تجمّع* بها. سمِّ موضعًا واحدًا قد تتباعد فيه هاتان الاشتقاقتان، وما القاعدة التي ستبقيهما متطابقتين.

## الخطوة 5: ولّد الصفحات لكل وسم

الفهرس عرض مشتق واحد؛ صفحة «تعرض فقط المنشورات ذات الوسم X» عرض مشتق *مصفّى*. حلقة كتابة صفحة لكل وسم هي الشكل نفسه لكل أداة «ولّد مصنوعًا لكل عنصر في مجموعة» — قالب لكل عنصر مع استبدال العنصر فيه.

### 5.1 اكتب صفحات الوسوم

```python
# sitegen.py (continued)

def build_tag_pages(posts: list[dict], out_dir: Path) -> None:
    by_tag = {}
    for p in posts:
        for t in p["tags"]:
            by_tag.setdefault(t, []).append(p)
    for tag, tagged in sorted(by_tag.items()):
        items = "\n".join(
            f'<li><a href="{p["slug"]}.html">{p["title"]}</a></li>'
            for p in tagged)
        (out_dir / f"tag-{tag}.html").write_text(
            f"""<!doctype html><html><head><meta charset="utf-8"><title>tag: {tag}</title></head>
<body><h1>Posts tagged "{tag}"</h1><ul>{items}</ul>
<p><a href="index.html">&larr; index</a></p></body></html>""",
            encoding="utf-8")

if __name__ == "__main__":
    build_tag_pages(posts, out)
    print("tag pages written:", sorted(t for t in Path("site").glob("tag-*.html")))
```

التجميع هنا `setdefault` مجددًا — الاصطلاح نفسه من الخطوة 4، محفوظًا الآن لكل وسم في `tagged` وهي قائمة *dict منشورات*، لا slugs، بحيث يكون العنوان والـ slug في متناول القالب. كل صفحة وسم `.html` واحدة بكل منشور، تمامًا مثل الفهرس ناقص التاريخ وناقص كل منشور غير مطابق.

**👟 تلميح البداية :**

أعد تشغيل البناء وانقر كل رابط وسم في الفهرس — تحوّل هذه الخطوة كل 404 سابق إلى صفحة حقيقية.

**🎯 الناتج المتوقع :**

يوجد `tag-intro.html` و`tag-meta.html` و`tag-python.html` و`tag-tips.html` تحت `site/`، كلٌّ يسرد المنشورات المطابقة، وكل رابط وسم في الفهرس يُحَل الآن.

**🩹 إذا لم يعمل :**

إذا احتوت صفحة وسم على منشورات خاطئة، فقد ألحق التجميع `p` — الـ dict كله — بينما يبني `items` من `p["slug"]`؛ التجميع الخاطئ يعني أنك جمّعت بنسخة قديمة من `posts`. إذا أظهر وسم بلا منشورات `<ul>` فارغًا، فبنيت `by_tag` من قائمة منشورات فارغة — أعد التحقق من أن `build_tag_pages` يعمل *بعد* جمع `posts`.

### 5.2 تحقّق من الموقع المكتمل

**✅ قائمة التحقق**

- ✅ كل رابط في `index.html` — منشورات *ووسومًا* — يُحَل إلى ملف موجود.
- ✅ يسرد `tag-python.html` `Three Python tips` وليس `Hello, world`.
- ✅ يحتوي `site/` بالضبط: `hello.html` و`python-tips.html` و`tag-*.html` لكل وسم متميز، و`index.html`.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يكرر قالب صفحة الوسم قالب الفهرس مع اختلافين. يعمل — لكن متى ستعيد هيكلة الاثنين في واحد مشترك `post_list_page(title, posts)`؟ سمِّ الرائحة الملموسة التي تطلق إعادة الهيكلة.
- نكتب `tag-{tag}.html` بسلسلة وسم خام من بيانات وصفية غير موثوقة. إذا كان وسم منشور `../evil`، فماذا يصبح مسار الملف — وما التطهير الأدنى الذي ستضيفه قبل استخدام أي وسم في اسم ملف؟ (تلميح: فكر في `slugify`.)

## ⚠️ مآزق شائعة

- **بحث سطر `---` الثاني منزاحًا بواحد.** يجب أن يتفق `next(...)` والشريحة `lines[end + 1:]` على السطر الذي هو «الفاصل»؛ انزلاق سطر واحد يُلحق سطر `---` الختامي بالجسم بصمت، ثم يترجمه مُترجم Markdown بسعادة كـ `<hr>`. الإصلاح: أكّد أن `body` لا يبدأ أبدًا بـ `---` في اختبار صغير.
- **بيانات وصفية بلا نهاية.** منشور كنت تعدله في المنتصف يُحفظ دون سطر `---` الختامي؛ ثم لا يستطيع المولّد إيجاد التقسيم ويموت بتعقّب غامض. التحقق من وجود التقسيم *مقدمًا*، ورفع `ValueError` باسم الملف، يحوّل لغزًا من 30 دقيقة إلى إصلاح ثانيتين.
- **تطهير *أو* ترجمة، لا كلاهما.** الترجمة إلى HTML دون المرور بـ `bleach` تدع `post.md` يحمل `<script>` إلى متصفحات زوارك؛ التطهير دون ترجمة يترك Markdown ظاهرًا كنص خام. ترتيب الحزام مع العلّاقة (حوّل، ثم قائمة بيضاء) هو نقطة الخطوة 3 كلها — والمحركات الحقيقية تخطئ هنا أيضًا.
- **مصدرا حقيقة.** تعديل `index.html` يدويًا «ولا إصلاح شيء واحد» بينما ما زال المولّد يشتقه من `posts/` يضمن أن بناءك التالي يستبدل التعديل بصمت. القاعدة: الموقع مولد، لا يُصان باليد أبدًا — يجب أن يكون كل مصنوع قابلاً لإعادة الإنتاج من مجلد المنشورات وحده.
- **تغطية اختبار ناقصة على «خط الأنابيب الكامل».** الخطوات كلّها تنجح وحدها، لكن منشورًا تقول بياناته الوصفية `date: "2026-08-04"` بمسافة *بعد* المفتاح، أو وسم بحرف كبير، هو حيث تكسر خطوة التجميع البناء كله. اختبار دخاني من سطرين (`build`، ثم أكّد أن كل ملف مولد موجود وكل `<a href>` يُحَل) يلتقط هذه الفئة من الفشل قبل النشر.

## ما بنيته للتو

مولد موقع ثابت يعمل: منشوران داخله، وأمر واحد، ومجلد `site/` من HTML سهل القراءة — صفحات وفهرس وقوائم لكل وسم كلها مشتقة من المنشورات بحيث لا يمكن للبناء أن يختلف مع المصدر أبدًا. المهارة القابلة للنقل هي *النموذج الذهني الكامل للبناء الثابت*: خط أنابيب صغير نقي (تحليل ← ترجمة ← تجميع) يحوّل ملفات نص عادي إلى مصنوع قابل للنشر تستضيفه في أي مكان، من مجلد فائض إلى CDN، دون ما يعمل وقت الطلب. ذلك النموذج هو ما يشغّل Jekyll وHugo وGatsby وألف مدونة شخصية — وهو الآن لك.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/markdown-blog-engine/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/markdown-blog-engine) في مستودع الدورة يحزم المحرك ومنشورَي العينة ودفترًا يشغّل كل خطوة بالترتيب. استنسخه، أو افتح المستودع كله في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وافحص `site/` المولد في الشجرة نفسها.
:::

## إلى أين تذهب من هنا

- أضف موجز RSS — ملف XML واحد يسرد عنوان كل منشور ورابطه وتاريخه، يُعاد توليده في كل بناء؛ عادة الاشتقاق من المنشورات تجعل ذلك إضافة من 15 سطرًا.
- أضف تقديرات زمن القراءة — عدّ كلمات الجسم، واقسم على ~200، وقرب لأعلى، واعرض «4 دقائق قراءة» في الفهرس؛ العداد سطر واحد، والقولبة الجزء الممتع.
- اكتب أرشيفًا واعيًا بالتاريخ (`archive-2026.html`) مجمّعًا بالسنة — تجميع `setdefault` نفسه من الخطوة 5، بمفتاح إضافي واحد.
- انشر: ادفع `site/` إلى مستودع GitHub Pages (أو فرع واحد) ودع مضيف ويب مجاني يخدمه — نقطة النموذج الثابت كلها أن المخرجات قابلة للشحن بلا أجزاء متحركة.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به — محرك مدونة ترجم منشوراتك الخاصة؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها، وملف README الخاص به يرشدك من البداية إلى النهاية لإضافة مشروعك عبر **pull request**: عمل fork والتفريع والتثبيت وفتح الـ PR. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓