---
title: "محرك Wiki"
description: "Wiki خفيفة الوزن مع صفحات Markdown وسجل إصدارات وتحرير تعاوني."
difficulty: "intermediate"
estimatedMinutes: 60
tags: ["markdown", "cli", "automation"]
learningObjectives:
  - "خزّن صفحات الويكي كملفات Markdown بمخطط تسمية slug"
  - اقرأ الصفحات واعرضها كـ HTML بمحرك Markdown خفيف
  - "احتفظ بسجل إصدارات تراكمي وقارن أي إصدارين"
  - "افحص [[الروابط]] لحساب فهرس الارتباطات العكسية"
  - "قسّم النص إلى رموز ورتّب البحث النصي الكامل حسب تكرار المصطلح"
prerequisites:
  - "Python basics (functions, dictionaries, file I/O)"
  - "Comfortable with basic regex (findall, sub)"
  - "Usage of pathlib paths for reading and listing files"
---

# 🛠️ 📚 ابنِ محرك Wiki

الويكي *صفحات على القرص زائد ثلاثة فهارس*. الصفحات ملفات Markdown؛ والفهارس هي الروابط الخلفية (أي الصفحات تشير إلى هنا؟)، والسجل (ماذا كانت تقول هذه الصفحة سابقًا؟)، والبحث (أي الصفحات تذكر هذه الكلمات؟). يبني هذا المشروع الثلاثة كلها من الصفر بالمكتبة القياسية: مخطط تسمية slugs، ومُصيِّر Markdown مصغّر، وسجل إصدارات إلحاقي فقط مع فروقات، وخريطة `[[Page]]` رابط خلفي، وبحث ترميزي يرتّب بتردد المصطلح. عند الانتهاء يمكنك تحويل ملاحظاتك الخاصة إلى wiki.

هذا يفترض Python 101 مع القليل من regex ، لا شيء من تحليل البيانات مطلوب. هذا اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للقائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. تمثيل صفحة كـ `slug + title + body` مخزّنة في ملف Markdown.
2. قراءة وكتابة وتصيير الصفحات إلى HTML بمُصيِّر Markdown مصغّر.
3. إنشاء wiki صغير وتوجيه العناوين عبر مُنمِّط slugs مضادّ للتصادم.
4. الاحتفاظ بسجل إصدارات إلحاقي فقط وفرق أي نسختين محفوظتين.
5. فحص روابط `[[Page]]` وحساب فهرس الروابط الخلفية العكسي.
6. ترميز وترتيب بحث كامل النص بتردد المصطلح.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو الموطن الأساسي ، الويكي ملفات على القرص، وهدف هذا المحرك كله الدوران ذهابًا وإيابًا عبر مجلد `wiki/` يمكنك فتحه في أي محرر. المحرك مكتبة قياسية خالصة، فتعمل كل خلية بشكل متطابق في السحابة أيضًا.

**Google Colab وKaggle Notebooks وBinder** تشغّل الخطوات الست كلها دون تعديل ، تنشئ الخلايا مجلد `wiki/` وتفحصه أثناء سيرها، فيُظهِر الدفتر *المحرك* وهو يعمل على صفحاته الخاصة. التحفظ الصادق: أنظمة ملفات السحابة سريعة الزوال، فويكي تحتفظ به فعلًا يسكن محليًا. استخدم الشارات لترى المحرك يعمل؛ واستخدم `uv` حيث تعيش ملاحظاتك.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/wiki-engine/notebook.ar.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/wiki-engine/notebook.ar.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fwiki-engine%2Fnotebook.ar.ipynb)

## الإعداد

أنشئ المشروع. يستخدم المحرك المكتبة القياسية فقط ، `re` للتمنيط والتحليل، و`json` للسجل، و`difflib` للفروقات، و`pathlib` لشجرة الملفات. لا حزم يتعين تثبيتها.

```bash
uv init wiki-engine
cd wiki-engine
```

```bash
uv run python -c "import re, json, difflib; from pathlib import Path; print('stdlib ok')"
```

بجدية، هذه قائمة التبعيات كلها. يمنحك `difflib` بروتوكول `unified_diff` مجانًا ، نفس المخرج الذي يعرضه `git diff` ، وينحت `re` الـ slugs و`[[links]]` من النص، ويجعل `pathlib` من "أدرج كل ملف `.md`" سطرًا واحدًا. مجلد `wiki/` الذي ستنشئه في الخطوة 1 هو قاعدة البيانات.

**✅ قائمة التحقق**

- ✅ أنشأ `uv init wiki-engine` مشروعًا مع `pyproject.toml`.
- ✅ طبع فحص الاستيراد `stdlib ok` ، لم تُضَف أي حزم.

## الخطوة 1: نمذجة صفحة وتمنيط اسمها

أبسط حقيقة في الويكي هي ملف واحد لكل صفحة. تعرّف هذه الخطوة فئة-البيانات `Page` (`slug` و`title` و`body`)، وتقرر أين تسكن الملفات (`wiki/<slug>.md`)، وتكتب المُنمِّط ، الدالة التي تحوّل "Data Analysis" إلى `data-analysis` آمن-لعناوين وفريد.

### 1.1 اكتب `Page` و`slugify` و`page_path`

**👟 تلميح البداية :** حوّل الحروف إلى صغيرة واضغط أي تسلسل غير أحرف-أرقامية في واصلة واحدة؛ وأبقِ `Page` قيمة خالصة ليظل تخطيط الملف ومعنى الصفحة منفصلين.

```python
# wiki.py
import re
from dataclasses import dataclass
from pathlib import Path

WIKI_DIR = Path("wiki")

@dataclass
class Page:
    slug: str
    title: str
    body: str

def slugify(title: str) -> str:
    slug = title.lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return slug.strip("-")

def page_path(slug: str) -> Path:
    return WIKI_DIR / f"{slug}.md"

for title in ["Data Analysis", "Sci-kit & Tools!", "  Pandas  "]:
    print(f"{title!r:26} -> {slugify(title)}")
```

الـ slug هو *هوية* الويكي: أسماء الملفات و`[[links]]` ونتائج البحث كلها تقفل عليه، فجعله حتميًا ("Data Analysis" و"data analysis" يهبطان على الملف نفسه) يمنع الصفحات المكررة للفكرة نفسها. تكبس `re.sub(r"[^a-z0-9]+", "-", ...)` المسافات وعلامات الترقيم وحتى الفواصل المتعددة في واصلة واحدة، ويُبقي `.strip("-")` النهائي الحواف نظيفة. يشكّل تداخل `WIKI_DIR / f"{slug}.md"` داخل `page_path` قمع كل كتابة ملف عبر اصطلاح واحد ، لا يمكن لصفحة الهروب من مجلد الويكي.

**🎯 الناتج المتوقع :** `'Data Analysis'            -> data-analysis` و`'Sci-kit & Tools!'         -> sci-kit-tools` و`'  Pandas  '               -> pandas`.

**🩹 إذا لم يعمل :** إذا بقيت فجوات الـ slug كمسافات، فتشغّل قصّ الحواف `strip("-")` لكن regex الكبس لم يعمل ، تحقق من كمية `+`. إذا أسفر `Sci-kit & Tools!` عن `sci-kit--tools`، فلم تُدمج الواصلة المزدوجة ، مرة أخرى إنها `+`. إذا كان slug فارغًا، فكان العنوان كله غير ASCII/رموز تعبيرية؛ قرر بديلًا (`"page"`) قبل أن تبدأ الصفحات في التصادم.

### 1.2 تحقق من التمنيط

**✅ قائمة التحقق**

- ✅ عناوين تختلف في الحالة وعلامات الترقيم فقط تُنتج *slug* واحدًا.
- ✅ `slugify("Data Analysis") == slugify("Data Analysis!") == "data-analysis"`.
- ✅ يتحلل `page_path("data-analysis")` داخل `wiki/` (`wiki/data-analysis.md`).

**🤔 سؤال (أسئلة) سقراطي(ة)**

- صفحتان حقيقيتان "Plotting" و"Plotting & Plots" تُمَنَّطان إلى الملف نفسه ، الواحدة تمسح الأخرى بصمت. كيف كان شكل *فحص تصادم* عند وقت الحفظ، وهل الفشل بصوت عالٍ أفضل من الكتابة فوقها؟
- slugs مشتقة من العناوين هنا. إذا أعاد مستخدم تسمية "Data Analysis" إلى "Analysis"، فماذا يحدث لكل ملف ولكل رابط `[[Data Analysis]]`؟ أين يجادل ذلك لصالح slug *غير قابل للتغيير* يعيش أطول من تعديلات العنوان؟

## الخطوة 2: قراءة الصفحات وكتابتها وتصييرها

يجب أن تنجو الصفحات من الرحلة ذهابًا وإيابًا: `Page` ← ملف على القرص ← `Page` مجددًا، ثم تصيير إلى HTML. تكتب هذه الخطوة `save_page`/`load_page` (مع سطر أول `# Title` كاصطلاح) ومُصيِّر Markdown مصغّر يحوّل `**bold**` و`[[links]]` إلى HTML.

### 2.1 اكتب `save_page` و`load_page` و`render_html`

**👟 تلميح البداية :** خزّن العنوان كأول سطر `# ` في الملف والنص ككل ما بعده؛ وصيّر-عن-الاستبدال الـ bold و`[[link]]` سطرًا-بسطر، ملفوفًا الباقي في `<p>`.

```python
# wiki.py (continued)
def save_page(page: Page) -> Path:
    WIKI_DIR.mkdir(exist_ok=True)
    target = page_path(page.slug)
    target.write_text(f"# {page.title}\n\n{page.body}")
    return target

def load_page(slug: str) -> Page:
    lines = page_path(slug).read_text().splitlines()
    title = lines[0].lstrip("# ").strip()
    body = "\n".join(lines[2:]).strip()
    return Page(slug=slug, title=title, body=body)

def render_html(page: Page) -> str:
    html = [f"<h1>{page.title}</h1>"]
    for line in page.body.splitlines():
        line = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", line)
        line = re.sub(r"\[\[([^\]]+)\]\]", r'<a href="/\1">\1</a>', line)
        if line.strip():
            html.append(f"<p>{line}</p>")
    return "\n".join(html)

demo = Page("welcome", "Welcome", "This wiki covers **Python**. See [[Data Analysis]].")
save_page(demo)
print(render_html(load_page("welcome")))
```

اصطلاح السطر-الأول `# Title` يعني أن الملف مواصفة وصفحة في آن: أي محرر يفتح `wiki/welcome.md` ويغيّر نصًا تحت العنوان، فيلتقطه الويكي ، بلا مخطط قاعدة بيانات خفي. يحوّل `render_html` عن قصد *بالضبط* `**bold**` و`[[wiki-links]]` ويلفّ كل ما عداهما في `<p>`؛ مجموعة-فرعية واعية بالمعلم تفوق محلل Markdown كاملًا نصف-مخبوز، والـ regexان هما "المُصيِّر" كله. يبعث `load_page` النص كما هو في الرحلة ذهابًا وإيابًا، فتنجو التعديلات التي تُجريها في محرر نصوص دون تخمين.

**🎯 الناتج المتوقع :** `<h1>Welcome</h1>\n<p>This wiki covers <strong>Python</strong>. See <a href="/Data Analysis">Data Analysis</a>.</p>` ، لاحظ أن الرابط يستهدف العنوان الخام؛ تسوية الرابط إلى *slugs* تأتي في الخطوة 5.

**🩹 إذا لم يعمل :** إذا تسرب العنوان إلى النص، فشريحة `lines[2:]` افترضت سطرًا فارغًا بعد `# Title` حين لا يوجد. إذا لم يُصيّر شيء-bold، فregex `\*\*(.+?)\*\*` ينقصه `?` (طماع) فيمتد على فقرات كاملة. إذا رفع `save_page` خطأ `FileNotFoundError`، فلم يعمل `WIKI_DIR.mkdir` أبدًا ، أنشئ المجلد مرة واحدة مقدمًا.

### 2.2 تحقق من الرحلة ذهابًا وإيابًا

**✅ قائمة التحقق**

- ✅ يطابق `render_html(load_page("welcome"))` المخرج أعلاه حرفًا بحرف.
- ✅ تعديل `wiki/welcome.md` في أي محرر نصوص ثم إعادة التحميل يُظهر التعديل ، الملفات مصدر الحقيقة، لا Python.
- ✅ صفحة بلا روابط تُصيّر كفقرات `<p>` عادية ، لا ينهار regex الروابط عند الغياب.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تعرض مرساة الرابط *العنوان*، لكن الويكي يقفل على *slugs*. أين يتباعد الاثنان (صفحة مربوطة أُعيدت تسميتها)، وما الذي يحتاج المُصيِّر الصحيح للبحث عنه قبل كتابة `<a href>`؟
- يستبدل `render_html` بـ regex على كل سطر، فعلامة `**bold**` ممتدة عبر سطرين لن تُصيَّر. متى يكون هذا *ميزة* (مجموعة فرعية متوقعة) ومتى يكون فخًّا لمستخدمين يتوقعون Markdown كاملًا؟

## الخطوة 3: سجل الإصدارات والفروقات

ويكي ينسى ما كانت تقوله الصفحات لا يُثق به. تضيف هذه الخطوة سجلًا إلحاقيًا فقط: كل حفظ يُلحق `{before, after}` بـ `wiki/history.json`، ويُظهر `diff_versions` التغيير بين أي نسختين بأسلوب `git` الموحّد.

### 3.1 اكتب `log_version` و`history_for` و`diff_versions`

**👟 تلميح البداية :** احتفظ بالسجل كـ JSON dict واحد من `slug -> [{"before", "after"}]`؛ ألحق-ثم-اكتب على الملف كله، ودع `difflib.unified_diff` ينتج المقطع المقروء بشريًا.

```python
# wiki.py (continued)
import json
import difflib

HISTORY_FILE = WIKI_DIR / "history.json"

def log_version(slug: str, before: str, after: str) -> None:
    history = json.loads(HISTORY_FILE.read_text()) if HISTORY_FILE.exists() else {}
    history.setdefault(slug, []).append({"before": before, "after": after})
    HISTORY_FILE.write_text(json.dumps(history, indent=2))

def history_for(slug: str) -> list[dict]:
    if not HISTORY_FILE.exists():
        return []
    return json.loads(HISTORY_FILE.read_text()).get(slug, [])

def diff_versions(slug: str, index: int = -1) -> str:
    entry = history_for(slug)[index]
    return "\n".join(difflib.unified_diff(
        entry["before"].splitlines(), entry["after"].splitlines(), lineterm=""))
```

*الإلحاق* في `history.setdefault(...).append(...)` هو الانضباط الذي يجعل السجل موثوقًا: النسخ الأقدم لا تُحرَّر أبدًا، بل يُضاف إليها فقط، فالسجل أثر تدقيق لا ذاكرة تخزين مؤقت. `difflib.unified_diff` هو بالضبط الخوارزمية التي يستخدمها `git diff`؛ وإعادته كسلسلة تُبقي التنسيق خارج طبقة البيانات. كتابة JSON كله عند كل حفظ جيدة بمقياس الويكي وتجعل الملف قابلًا للفحص يدويًا ، مقايضة أجراها كل مخزن إصدارات كبير بشكل مختلف، وهو ما يلامسه السؤال أدناه.

**🎯 الناتج المتوقع :** بعد تعديلين، يحتوي `history_for("welcome")` على إدخالين، ويُظهر `print(diff_versions("welcome", -1))` سطري `-` و`+` يعلّمان بالضبط ما تغيّر.

**🩹 إذا لم يعمل :** إذا لم ينمُ السجل أبعد من إدخال واحد، فاستُدعي `log_version` بنفس `before` عند كل حفظ (التُقط النص القديم متأخرًا جدًا). إذا أظهر `diff_versions(-1)` إعادة كتابة-ملف كاملة، فحُفظ `after` كنص فارغ (التقط حالة غير الفارغ). إذا كُتب JSON متضررًا، فلم يُهرب نص يحتوي `\n` خام عبر `json.dumps` ، وهو يُهرب دائمًا بواسطة `write_text(json.dumps(...))`، فاشتبه في تعديلات يدوية على `history.json`.

### 3.2 تحقق من السجل

**✅ قائمة التحقق**

- ✅ تعديل صفحة مرتين يُنتج إدخالين؛ `before` الأول يساوي نص الصفحة *الأصلي*.
- ✅ يبدأ مخرج `diff_versions` بعلامات `-`/`+` (ترويسة `---`/`+++` اختيارية) ويُظهر الأسطر المتغيرة فقط.
- ✅ تحويل `index` رجوعًا إلى `0` يعيد تشغيل كامل سجل التغييرات إلى الأمام، بالترتيب.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يخزن السجل لقطات كاملة `before`/`after`. لويكي كبير، هذا مساحة O(ملف × تعديلات). ماذا يوفّر تخزين *الدلتا* (المناطق المتغيرة فقط لكل إصدار)، وما تكلفة إعادة البناء عند القراءة؟
- يسجل هذا السجل نص الصفحة لكن ليس *مَن* حرّر أو *متى*. أيّ القيمتين الكامنتين ، المؤلف أم الطابع الزمني ، تضيف أولًا، وأين يتوقف سجل الويكي عن كونه شبكة أمان ويصبح سجلًا حُكميًا؟

## الخطوة 4: الروابط الخلفية ، خريطة الصفحة العكسية

الروابط نصف تعريف الويكي فقط؛ *الرابط الخلفي* (من يشير إليّ؟) هو النصف الآخر، وهو ما يحوّل الصفحات إلى شبكة قابلة للتنقل. تفحص هذه الخطوة كل نص صفحة بحثًا عن `[[Target]]` وتبني الخريطة العكسية `target -> [الصفحات التي تربط إليه]`.

### 4.1 اكتب `outbound_links` و`backlink_index`

**👟 تلميح البداية :** `findall` كل رمز `[[..]]`، ثم تجوّل كل ملفات `.md` رابطًا-خارجيًا-لواحد وسجّل المصدر *تحت* slug الهدف.

```python
# wiki.py (continued)
LINK_PATTERN = re.compile(r"\[\[([^\]]+)\]\]")

def outbound_links(page: Page) -> list[str]:
    return LINK_PATTERN.findall(page.body)

def backlink_index() -> dict[str, list[str]]:
    backlinks = {}
    for file in WIKI_DIR.glob("*.md"):
        page = load_page(file.stem)
        for target in outbound_links(page):
            backlinks.setdefault(slugify(target), []).append(page.slug)
    return backlinks

for slug, source in sorted(backlink_index().items()):
    print(f"{slug:16} <- {', '.join(source)}")
```

يجيب `outbound_links` عن "أين تشير هذه الصفحة؟" و`backlink_index` يعكسه إلى "ما الذي يشير إلى هنا؟" ، انعكاس الفهرس القياسي، glob ملف واحد و`setdefault` واحد في كل مرة. القفل بـ `slugify(target)` هو مردود slugs الخطوة 1 الحتمية: نص يقول `[[Data Analysis]]` ونص يقول `[[data-analysis]]` كلاهما يُسجَّل تحت `data-analysis`، فينجو الفهرس من اختلاف التسمية. تجوّل `WIKI_DIR.glob("*.md")` يعني أن شجرة الملفات *هي* قائمة الصفحات ، لا سجل منفصل يُبقي متزامنًا.

**🎯 الناتج المتوقع :** مع صفحة `welcome` ("See [[Data Analysis]]") وصفحة `data-analysis` مطابقة، يعرض المخرج `data-analysis     <- welcome`.

**🩹 إذا لم يعمل :** إذا انعكس هدف إلى قائمة فارغة، فالروابط الخلفية موجودة لكن فحص-الهدف لم يجد مصدرًا ، تحقق أن الأهداف بالـ regex جاءت من نص النص الأساسي. إذا أدرجت الروابط الخلفية الصفحة نفسها، فـ `findall` يقرأ سطر *العنوان* (الروابط تعيش في النصوص الأساسية فقط؛ و`[[self]]` صادق ذاتي المرجع ، قرر هل يُعدّ أم لا). إذا ظهرت قائمة slugs متعثرة الترتيب، فمصادر متعددة تربط هدفًا واحدًا وهذا صحيح ، الترتيب مجرد ترتيب glob.

### 4.2 تحقق من الروابط الخلفية

**✅ قائمة التحقق**

- ✅ صفحتان كلٌّ يربط بـ `[[...]]` الأخرى تُنتج إدخالًا واحدًا لكل هدف مع المصدر المدرج.
- ✅ إعادة تسمية هدف رابط في النص تحدّث الفهرس عبر `slugify` دون تغييرات كود.
- ✅ لا يحتوي `backlink_index()` على مفتاح ليس صفحة هبوط حقيقية (راجع السؤال عن الروابط المكسورة).

**🤔 سؤال (أسئلة) سقراطي(ة)**

- رابط إلى `[[Missing Page]]` يسجّل إدخال رابط خلفي لصفحة غير موجودة. ما الذي كان محركك ليتقرّر عنه لهدف "يتيم"، ولماذا تهمّ تقارير الروابط الميتة في الويكي أكثر من الكتاب؟
- الروابط الخلفية هنا تُحسب عند كل استدعاء. إذا نما الويكي إلى آلاف الصفحات، ماذا كنت *ستخزّن مؤقتًا* ، وأي حدث سيبطل ذلك التخزين حتى لا يقدّم روابط قديمة أبدًا؟

## الخطوة 5: البحث كامل النص

الفهرس الأخير: بالنظر إلى استعلام، أي الصفحات تذكر هذه المصطلحات، مرتّبة بالتردد. ترمّز هذه الخطوة النص إلى كلمات حرف-صغير، وتُسقط قائمة كلمات توقف صغيرة، وتُقيّم كل صفحة بعدد مصطلحات الاستعلام التي تحويها، وتُعيد قائمة مرتّبة.

### 5.1 اكتب `tokenize` و`search`

**👟 تلميح البداية :** رمّز بـ `re.findall` على `[a-z0-9]+`، واصفِ كلمات التوقف، ثم قيّم كل صفحة كـ `sum(tokens.count(term) for term in query_terms)`.

```python
# wiki.py (continued)
STOPWORDS = {"the", "a", "an", "and", "of", "to", "in", "for", "on",
             "with", "this", "that", "is", "it", "see", "use"}

def tokenize(text: str) -> list[str]:
    words = re.findall(r"[a-z0-9]+", text.lower())
    return [word for word in words if word not in STOPWORDS and len(word) > 1]

def search(query: str) -> list[tuple[str, int]]:
    terms = tokenize(query)
    results = []
    for file in WIKI_DIR.glob("*.md"):
        page = load_page(file.stem)
        tokens = tokenize(page.title + "\n" + page.body)
        score = sum(tokens.count(term) for term in terms)
        if score:
            results.append((page.slug, score))
    return sorted(results, key=lambda item: -item[1])

save_page(Page("data-analysis", "Data Analysis",
               "Use pandas for grouping. Keep the visual step [[welcome]]."))
for slug, score in search("pandas grouping"):
    print(f"{score:3}  {slug}")
```

ترميز العنوان *والنص* يعني أن صفحة يقول عنوانها "Pandas" تُرتَّب لاستعلام "pandas" حتى لو لم يكتب النص الأساسي الكلمة قط ، الصفحات تُعلن عن نفسها. إسقاط كلمات التوقف ("this"، "see") هو أرخص زيادة دقة يصنعها محرك بحث: `[[see]]` ليس شيئًا يبحث عنه أحد. التقييم بعدد مرات-خام للمصطلح متعمّد-السذاجة ، يشير السؤال أدناه إلى لماذا "Pandas" الظاهرة مرتين في *العنوان* تبالغ في ثقة صفحة بعشر كلمات ، لكنه ترتيب كامل وصادق حيث تتغلب التكرارات الأكثر على الأقل.

**🎯 الناتج المتوقع :** يُقيّم `search("pandas")` صفحة يذكر عنوانها/نصّها `pandas` (درجة 1+) فوق أي صفحة لا تستخدم الكلمة؛ ويُقيّم `search("pandas grouping")` صفحة `data-analysis` بالدرجة 2 (ضربة واحدة لكل مصطلح استعلام) بينما تحصل صفحة `welcome` على درجة 0.

**🩹 إذا لم يعمل :** إذا اختفت كلمة من حرف واحد مثل `R` (اللغة! )، فـ `len(word) > 1` طردها ، تسربٌ لسياسة كلمات-التوقف؛ أزل بوابة-الطول للاستخدام الحقيقي. إذا لم يطابق شيء أبدًا، فحصل `tokenize` على غير سلسلة (عنوان `None`) أو كان صنف regex `.`، مطابقًا علامات الترقيم. إذا عادت النتائج بترتيب glob بصرف النظر عن الدرجة، ففرز `key=lambda item: -item[1]` مفقود.

### 5.2 تحقق من البحث

**✅ قائمة التحقق**

- ✅ يُعيد `search("pandas")` صفحة `pandas` أولًا بدرجة ≥ 1.
- ✅ يُعيد استعلام ثنائي-المصطلح صفحة متعددة-المصطلحات فوق صفحة وحيدة-المصطلح.
- ✅ عدم حساسية الحالة صامد: `search("PANDAS")` يساوي `search("pandas")`.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يكافئ التقييم بعدد-المرات-الخام الصفحات *الطويلة* ويعاقب *الموجزة*. أي مسوّيات (قسمة على طول الصفحة، وسقف لأوزان العنوان) كانت ستجعل "قصيرة ودقيقة على الصميم" تتغلب على "طويلة وتائهة"؟
- يقرأ البحث كل صفحة عند كل استدعاء. عند أي حجم ويك يغلب فهرس معكوس مسبق البناء `term -> [slugs]` (مبني مرة واحدة بروح الخطوة 4) على إعادة تقييم كل الملفات، وما الذي يجب تحديثه عند تحرير صفحة؟

## ⚠️ المآزق الشائعة

- **تصادمات slugs تمسح الصفحات.** "Plotting" و"Plotting & Plots" تُمَنَّطان في الملف نفسه، وتكتب كلٌّ فوق الأخرى بصمت. الإصلاح: تحقق من وجود `page_path(slug)` قبل الحفظ، وافشل بصوت عالٍ بدلًا من الكتابة فوقه.
- **روابط تشير للعناوين لا الـ slugs.** يجب أن يحل `[[Data Analysis]]` إلى `data-analysis` أو يُرجع الرابط 404 في أي مُصيِّر حقيقي. الإصلاح: مَرِّر `[[...]]` عبر `slugify` في المُصيِّر وفهرس الروابط الخلفية (ترقية مُصيِّر الخطوة 5).
- **نصوص أساسية فقدت عنوانها.** يفترض تحليل `lines[2:]` سطرًا فارغًا بعد `# Title`. الإصلاح: يقرأ `load_page` أول سطر `# ` كعنوان و*كل ما عداه* كنص، متسامحًا مع السطور الفارغة المفقودة.
- **سجل يسجل "before" خاطئ.** التقاط `before` *بعد* حفظ النص الجديد يجعل كل فرق عديم الأثر. الإصلاح: اقرأ النص القديم أولًا، ثم `log_version` قبل أن تُستبدل الصفحة.
- **بحث يعامل كل كلمة بالتساوي.** "،" و"the" تهيمنان على الترتيبات. الإصلاح: مجموعة كلمات توقف (وأرضية طول)، ثم ترقَّ إلى توزين-بالتردد-المصطلحي من سؤال الخطوة 5.

## ما بنيته للتو

محرك wiki كامل بلا تبعيات: صفحات مُنمَّطة على القرص، ومُصيِّر Markdown مصغّر، وسجل إصدارات إلحاقي فقط بفروقات بأسلوب git، وفهرس `[[link]]` عكسي، وبحث كامل النص مُرتَّب. الدرس القابل للنقل أن *الويكي ثلاثة فهارس فوق شجرة ملفات* ، فحص-نفس-الملف للروابط الخلفية، وسجل للسجل، وعداد رموز للبحث ، وأن الفهرسة ببساطة "احسب مقدمًا الإجابات التي لا يريد أحد إعادة حسابها". كل مولّد مواقع ثابتة استخدمته يومًا هو نفس هذه الحلقة بوجه أمامي.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/wiki-engine/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/wiki-engine) في مستودع الدورة نسخة أكمل من الكود أعلاه، مع مُصيِّر Markdown-lite يحل الروابط إلى slugs ولوحة عدّ الصفحات. استنسخه، أو افتح المستودع كاملًا في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وشغّله من هناك.
:::

## إلى أين تذهب من هنا

- حلّ `[[links]]` إلى *slugs* في المُصيِّر (سؤال الخطوة 2)، فلا تُصيَّر الضربات أبدًا كـ `href="/Data Analysis"` بل كـ `href="/data-analysis"`.
- أضِف تقرير `broken_links()` يعلّم `[[Target]]` حيث لا يوجد `page_path(slugify(Target))` ، ماسح الروابط الميتة للويكي نفسه.
- خزّن الدلتات بدلًا من اللقطات الكاملة في السجل، مُعيدًا بناء النص عند الطلب ، تحقق ترقية سؤال الخطوة 3 فعلًا.
- ابنِ فهرسًا معكوسًا مُسبق الحساب للبحث (المصطلح ← الـ slugs)، وأعده البناء عند الحفظ، ودع العناوين تتفوق على نص الأجسام.

## شارك مشروعك مع الصف

بَنيت شيئًا تفتخر به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع قدّمها طلاب آخرون ، وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل: عمل fork للمستودع، وإنشاء فرع، والالتزام بملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓