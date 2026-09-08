---
title: "منشئ النشرات الإخبارية"
description: "أنشئ وأرسل النشرات الإخبارية مع قوالب Markdown وإدارة المشتركين والتحليلات."
difficulty: "intermediate"
estimatedMinutes: 60
tags: ["markdown", "email", "templates", "data-management", "pandas"]
learningObjectives:
  - ترجمة قوالب Markdown باستبدال {{variable}}
  - إدارة قائمة مشتركين CSV بالوسوم والتقسيم
  - تتبع الفتح والنقر وحساب معدلات فتح/نقر صادقة
  - تشغيل اختبارات A/B على أسطر الموضوع وقراءة الفائز
  - ترجمة نسخة شخصية واحدة لكل مشترك في قطاع
prerequisites:
  - "أساسيات Python (الدوال والحلقات والقواميس)"
  - "أساسيات CSV وتثبيت الحزم باستخدام uv"
---


# 🛠️ 📰 ابنِ منشئ النشرات الإخبارية

تواجه كل قائمة بريد الخط الأنابيب نفسه: خذ قالبًا، واملأه لكل مشترك، وتتبع من فتح ومن نقر، واكتشف سطر الموضوع الذي يعمل فعلًا. يبني هذا المشروع ذلك الخط في Python — محرك قوالب regex، وقائمة مشتركين CSV بالوسوم، ومتعقب فتح/نقر يحسب معدلات صادقة، واختبار A/B لأسطر الموضوع، وخطوة أخيرة تصيغ نسخة شخصية لكل مشترك في قطاع.

يفترض هذا إنهاء Python 101 وارتياحـًا مع الدوال والقواميس والقوائم — ستقابل pandas في خطوة واحدة، لكن لا شيء أبعد من ذلك مطلوب. هذا اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة المتنامية.

## 🎯 ما ستفعله

1. بناء محرك قوالب يستبدل `{{placeholders}}` في نشرة Markdown بقيم من قواميس.
2. إدارة قائمة مشتركين CSV بالوسوم بحيث تخاطب قراء Python فقط، لا الجميع.
3. تسجيل الفتحات والنقرات وحساب معدلات الفتح/النقر مقابل حجم الجمهور الحقيقي.
4. تشغيل اختبار A/B على سطري الموضوع واختيار الفائز من البيانات.
5. ترجمة نسخة شخصية واحدة لكل مشترك في ملف خاص بها.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي. الاعتماد الخارجي الوحيد هو `pandas`، الذي ستستخدمه مرة، لخطوة التحليلات — كل شيء آخر مكتبة قياسية (`re` و`csv` و`os` و`datetime`)، وملفات CSV التي تولدها مواطنون من الدرجة الأولى في مجلدك الخاص.

**Google Colab وBinder وKaggle Notebooks** تشغّل الكل بالطريقة نفسها: `!pip install pandas` مرة، ثم كل خطوة أدناه، مع إعادة الدفتر للنسخ والجداول التحليلية المترجمة نفسها. **JupyterLite** يمكنه تشغيل خطوتي القالب والمشتركين في المتصفح، وpandas متوفرة هناك أيضًا — التحفظ الصادق هو نفسه كما في كل مكان في هذه السلسلة: الملفات التي تُنشأ في المتصفح تعيش على نظام ملفات افتراضي مؤقت، فعاملها كمسار تجربة واستخدم `uv` محليًا عندما تريد لـ `subscribers.csv` و`issues/` البقاء فعلًا.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/newsletter-builder/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/newsletter-builder/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fnewsletter-builder%2Fnotebook.ipynb)

## الإعداد

أنشئ المشروع وثبّت الاعتماد الوحيد الذي ستستخدمه للتحليلات.

```bash
uv init newsletter-builder
cd newsletter-builder
uv add pandas
```

وحدة `re` و`csv` تأتيان مع Python، لذا `pandas` هي الحزمة الوحيدة في هذا المشروع — وتصل مرة واحدة بالضبط، في تحليلات الخطوة 3. تثبيت كل شيء مقدمًا يُبقي الخطوات اللاحقة عن *الأفكار* (القوالب والتتبع والاختبار) بدلًا من صراع الاعتماديات.

**✅ قائمة التحقق**

- ✅ انتهى `uv add pandas` وخروج `uv run python -c "import pandas"` بصمت.
- ✅ أنشئ مشروع `newsletter-builder/` فارغًا يشغّل سكربت سطر واحد.

## الخطوة 1: ترجم قالب Markdown

نشرة تتغير لكل قارئ تبدأ من قالب به ثقوب. الثقوب مساحات `{{curly}}`، وتبني هذه الخطوة المحرك الصغير الذي يستبدلها بقيم حقيقية — نواة نظام خالٍ من الاعتماديات كان ليتطلب مكتبة قوالب كاملة.

### 1.1 اكتب دالة الترجمة

**👟 تلميح البداية :**

استخدم استدعاء `re.sub` واحدًا مع رد نداء يبحث عن كل مساحة في قاموس، وقرر صراحة ما يحدث عندما تكون مساحة مفقودة.

```python
# newsletter.py
import re

def render_template(template: str, variables: dict) -> str:
    """Replace {{variable}} placeholders with values from the variables dict."""
    def replacer(match):
        key = match.group(1).strip()
        return str(variables.get(key, f"[MISSING: {key}]"))

    return re.sub(r"\{\{(.+?)\}\}", replacer, template)

print(render_template(
    "Hello {{name}}, this is issue {{issue}}.",
    {"name": "Alice", "issue": "42"},
))
print(render_template("Hi {{name}}!", {}))
```

السطر الوحيد الذي يؤدي كل العمل هو `re.sub(r"\{\{(.+?)\}\}", replacer, template)`. النمط `\{\{(.+?)\}\}` يطابق فتح `{{`، ويلتقط أي شيء داخله، ثم يغلق عند أول `}}` — `.+?` *غير جشع*، بحيث يتوقف مبكرًا بدلًا من الابتلاع عبر عدة مساحات. لكل مطابقة، يبحث رد النداء `replacer` عن المفتاح الملتقط في `variables`، و`str(...)` يقسر القيم غير النصية (مثل العدد الصحيح `42`) بحيث لا تنهار القوالب أبدًا على رقم. البديل الصريح `variables.get(key, "[MISSING: {key}]")` قرار تصميم: المتغير المفقود يصبح علامة *مرئية* بدلًا من `None` صامت.

**🎯 الناتج المتوقع :**

الطباعة الأولى: `Hello Alice, this is issue 42.` الطباعة الثانية: `Hi [MISSING: name]!`

**🩹 إذا لم يعمل :**

إذا أظهر المخرج `None` مكان القيم، فغلاف `str()` مفقود على البحث. إذا نجت المساحات حرفيًا في المخرجات، فأقواس النمط المعبَّرة خاطئة — `\{\{` لا `{{`. إذا أظهر *كل* متغير مفقودًا، فمفاتيح `variables` والأسماء في القالب مختلفة (تحقق من مسافة شاردة بعد `{{` — ولهذا يوجد `.strip()`).

### 1.2 ترجم نسخة حقيقية من قالب

**👟 تلميح البداية :**

اكتب النشرة كسلسلة Markdown واحدة بثلاث علامات اقتباس، وأعطها كل مساحة في القاموس، واطبع النسخة المترجمة بالكامل.

```python
# newsletter.py (continued)
from datetime import datetime

NEWSLETTER_TEMPLATE = """# {{title}}

**Issue #{{issue_number}}** | {{date}}

---

## Hello {{subscriber_name}}!

{{intro}}

### This Week's Highlights

{{highlights}}

### Featured Article

**{{article_title}}**

{{article_summary}}

---

*You received this because you subscribed to {{newsletter_name}}.*
*Unsubscribe: {{unsubscribe_url}}*
"""

variables = {
    "title": "Weekly Python Tips",
    "issue_number": "42",
    "date": datetime.now().strftime("%B %d, %Y"),
    "subscriber_name": "Reader",
    "intro": "Welcome to this week's edition of Python Tips. Here is what we covered.",
    "highlights": "- List comprehensions\n- Decorator patterns\n- Type hints deep dive",
    "article_title": "Understanding Decorators",
    "article_summary": "Decorators let you modify function behavior without changing the function itself.",
    "newsletter_name": "Python Tips Weekly",
    "unsubscribe_url": "https://example.com/unsubscribe",
}

rendered = render_template(NEWSLETTER_TEMPLATE, variables)
print(rendered)
```

القالب بيانات، لا كود — بل يشمل بنود Markdown نقطية داخل `{{highlights}}`، لأن القيمة تُدرج *حرفيًا* وMarkdown المحيط هو ما يمنحها بنية. الترجمة والمحتوى منفصلان كليًا: عدّل القالب، أو عدّل dict، أو كلاهما، دون لمس دالة الترجمة. قيمة `{{date}}` تُحسب مرة، وقت الترجمة، بحيث يرى قارئا النسخة نفسها التاريخ نفسه.

**🎯 الناتج المتوقع :**

نسخة Markdown مكتملة مطبوعة تحت عنوان `# Weekly Python Tips`، بالتاريخ معبأ، وثلاث نقاط إبراز، وتذييل الاشتراك/إلغاء الاشتراك.

**🩹 إذا لم يعمل :**

إذا احتوى المخرج `{{...}}` خامًا، فتلك المساحة مفقودة من `variables` وللقاموس خطأ إملائي — كان بديل `[MISSING: ...]` من 1.1 سيخبرك، إلا إذا اختلف المفتاح فعلًا في التهجئة. إذا غابت النقاط، فلا تحوي قيمة `highlights` الأسطر الموصولة بـ `\n`.

### 1.3 تحقّق من محرك القوالب

**✅ قائمة التحقق**

- ✅ المساحات المجهولة تُعرض كـ `[MISSING: key]`، أبدًا كـ `None`.
- ✅ القيم غير النصية (الأرقام والتواريخ) تُعرض دون خطأ.
- ✅ قالب النشرة الكامل يُترجم من البداية إلى النهاية مع كل مساحة معبأة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يستخدم النمط `.+?` غير الجشع. ما الذي سيتغير في المخرج المترجم إذا كتبت `\{\{(.+)\}\}` (جشع) بدلًا منه، في قالب يحوي *مساحتين* في سطر واحد؟
- بديل المتغير المفقود سلسلة `[MISSING: ...]` مرئية. متى يكون الإدراج الصامت لسلسلة فارغة هو السلوك *الأفضل* — وأي نوع من أخطاء القوالب سيخبئه ذلك الاختيار؟

## الخطوة 2: أدرِ المشتركين بـ CSV

قائمة الأشخاص جدول مسطح: صف لكل مشترك، وبضعة أعمدة لكل صف. CSV هو أبسط تخزين صادق لذلك — مقروء بشريًا، ويُفتح في أي جدول بيانات، وتتولى وحدة `csv` الاقتباس لك. تبني هذه الخطوة دوال إضافة/تحميل/تقسيم حول ملف مشتركين واحد.

### 2.1 أنشئ المشتركين وأضفهم

**👟 تلميح البداية :**

عرّف مجموعة أسماء أعمدة ثابتة مرة، وأعد استخدامها لكل من الرأس وكل صف، ودع `datetime` يختم تاريخ الاشتراك.

```python
# newsletter.py (continued)
import csv
import os
from datetime import datetime

SUBSCRIBER_FIELDS = ["email", "name", "tags", "subscribed_at", "status"]

def create_subscriber_file(filepath: str = "subscribers.csv"):
    """Create a new subscriber CSV file with headers."""
    with open(filepath, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=SUBSCRIBER_FIELDS)
        writer.writeheader()
    print(f"Created subscriber file: {filepath}")

def add_subscriber(email: str, name: str, tags: list[str], filepath: str = "subscribers.csv"):
    """Add a subscriber to the CSV file."""
    row = {
        "email": email,
        "name": name,
        "tags": ";".join(tags),
        "subscribed_at": datetime.now().isoformat(),
        "status": "active",
    }

    file_exists = os.path.exists(filepath)
    with open(filepath, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=SUBSCRIBER_FIELDS)
        if not file_exists:
            writer.writeheader()
        writer.writerow(row)
    print(f"Added subscriber: {email}")

create_subscriber_file()
add_subscriber("alice@example.com", "Alice", ["python", "data-science"])
add_subscriber("bob@example.com", "Bob", ["python", "web-dev"])
add_subscriber("carol@example.com", "Carol", ["data-science"])
```

يخزن عمود `tags` القائمة كسلسلة موصولة بفاصلات منقوطة، `";".join(tags)` — خلايا CSV مسطحة، لذا يجب أن يُحزم الحقل متعدد القيم بطريقة ما، واختير `;` لأن الفواصل هي فاصل الأعمدة بالفعل. فحص `file_exists` هو تفصيل الصحة الدقيق: الإلحاق بـ `"a"` إلى ملف *موجود* يجب ألا يكتب صف رأس ثانيًا، بينما الملف *الجديد* المنشأ دون رأس لن يملك أسماء أعمدة إطلاقًا. يكتب `csv.DictWriter` الصفوف بأسماء الأعمدة، ما يضمن أن كل صف يطابق شكل كل صف آخر.

**🎯 الناتج المتوقع :**

`Created subscriber file: subscribers.csv` يتبعها ثلاثة أسطر `Added subscriber: ...`، وCSV رأسها `email,name,tags,subscribed_at,status` بثلاثة صفوف بيانات.

**🩹 إذا لم يعمل :**

إذا كان للـ CSV رأس بعد كل صف، فكل استدعاء يكتب رؤوسًا لأن `file_exists` يُقيَّم مقابل مسار قديم أو يحذف الملف بين الاستدعاءات. إذا احتوى وسم فاصلة، لم يسبب `.join` كسرًا *لأن وحدة csv تقتبس ذلك الحقل* — لكن إذا رأيت الصف منقسمًا، فأنت بنيت الصف كسلسلة خام باليد بدلًا من استخدام `DictWriter`. إذا غاب ختم زمني، فإسناد `datetime.now().isoformat()` غائب عن dict الصف.

### 2.2 حمّل القائمة وقسّمها

**👟 تلميح البداية :**

اقرأ الملف بالعكس بـ `csv.DictReader` وصفَّ بفك حزم الوسوم المعبأة — أو بمقارنة عمود حالة واحد.

```python
# newsletter.py (continued)
def load_subscribers(filepath: str = "subscribers.csv") -> list[dict]:
    """Load all subscribers from the CSV file."""
    if not os.path.exists(filepath):
        return []
    with open(filepath, "r") as f:
        reader = csv.DictReader(f)
        return list(reader)

def filter_by_tag(subscribers: list[dict], tag: str) -> list[dict]:
    """Filter subscribers who have a specific tag."""
    return [s for s in subscribers if tag in s.get("tags", "").split(";")]

def filter_by_status(subscribers: list[dict], status: str) -> list[dict]:
    """Filter subscribers by status (active, unsubscribed, bounced)."""
    return [s for s in subscribers if s.get("status") == status]

subscribers = load_subscribers()
print(f"All subscribers: {len(subscribers)}")
print(f"Python subscribers: {len(filter_by_tag(subscribers, 'python'))}")
print(f"Data science subscribers: {len(filter_by_tag(subscribers, 'data-science'))}")
```

يحوّل `csv.DictReader` كل صف CSV إلى dict مفتاحه أسماء الرؤوس — العكس الدقيق لـ `DictWriter` من 2.1، بحيث يكون التحميل والحفظ متماثلين بالبناء. المرشحان فهما قائمة صغيران، لكنهما مبنيان على خيار الحزم السابق: `s.get("tags", "").split(";")` يفك السلسلة المخزنة إلى قائمة بحيث يكون اختبار العضوية `in` لكل وسم، لا مطابقة نص فرعي قذرة (تطابق «python» ضد «python3🐍» كذبًا). إبقاء المرشحين كدوال مسماة منفصلة يعني أنه يمكنك تأليفهما — خطوة لاحقة تدمج `filter_by_tag` و`filter_by_status` في تعبير واحد.

**🎯 الناتج المتوقع :**

`All subscribers: 3`، و`Python subscribers: 2`، و`Data science subscribers: 2` — تحمل Alice وBob وسم `python`، وتحمل Alice وCarol وسم `data-science`.

**🩹 إذا لم يعمل :**

إذا أظهر المشتركون في Python `0`، فخطوة `.split(";")` مفقودة ويُختبر العضوية ضد سلسلة الأسلاك الخام. إذا انهار التحميل على ملف برأس غير متوقع، فأنشأ الملف شيء غير دوال هذا المشروع. إذا أعاد التحميل قائمة فارغة، فدليل العمل يختلف عن مكان سكن `subscribers.csv` — المسارات المطلقة أو مسار نسبي ثابت يصلح ذلك.

### 2.3 تحقّق من قائمة المشتركين

**✅ قائمة التحقق**

- ✅ للـ CSV صف رأس واحد بالضبط وثلاثة صفوف بيانات.
- ✅ يُرجع `load_subscribers()` ثلاثة dict، كلٌّ بالحقول الخمسة.
- ✅ تصفية الوسوم تُرجع 2 أو 1 أو 0 مطابقةً تمامًا لكيفية وسم الناس.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تُحزم الوسوم بـ `;`، وتفك المرشحات بـ `.split(";")`. ما الذي سيخطئ إذا احتوى اسم وسم *نفسه* فاصلة منقوطة — وأين في الخط الأنابيب سيبرز ذلك الغموض أولًا؟
- يكتب `add_subscriber` رأسًا فقط عندما يكون الملف جديدًا. لماذا هذا الفرع أفضل من استدعاء `create_subscriber_file()` دائمًا أولًا — وماذا يحدث لمخرجات الدالتين إذا فعل المتصل الاثنين معًا رغم ذلك؟

## الخطوة 3: تتبع الفتحات والنقرات

يبلّغ مزودو البريد عن الفتحات والنقرات لأنهم يخبرونك إن كان سطر الموضوع يستحق القراءة. لا يرسل هذا المشروع بريدًا حقيقيًا، لذا ستسجل نفس مجرى الأحداث الذي ينتجه بريد فعلي — المشترك والنسخة ونوع الحدث والختم الزمني والعنوان — ثم تقرؤه بالعكس بـ pandas لحساب معدلات تعني شيئًا.

### 3.1 سجّل الأحداث في CSV تتبع

**👟 تلميح البداية :**

دالة `log_event` واحدة تلحق صفًا واحدًا بملف تتبع ينمو — الشكل نفسه الذي سيصدره مزود بريد حقيقي، مكتوبًا بواسطتك فقط.

```python
# newsletter.py (continued)
TRACK_FIELDS = ["subscriber_email", "newsletter_issue", "event_type", "timestamp", "url"]

def log_event(email: str, issue: str, event_type: str, url: str = "", filepath: str = "tracking.csv"):
    """Log an email event (open, click, bounce)."""
    row = {
        "subscriber_email": email,
        "newsletter_issue": issue,
        "event_type": event_type,
        "timestamp": datetime.now().isoformat(),
        "url": url,
    }

    file_exists = os.path.exists(filepath)
    with open(filepath, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=TRACK_FIELDS)
        if not file_exists:
            writer.writeheader()
        writer.writerow(row)

def simulate_tracking(subscribers: list[dict], issue: str):
    """Simulate opens and clicks for demonstration purposes."""
    import random
    random.seed(42)

    for sub in subscribers:
        if random.random() < 0.7:  # 70% open rate
            log_event(sub["email"], issue, "open")
            if random.random() < 0.3:  # 30% of openers click the link
                log_event(sub["email"], issue, "click", "https://pyda.example/article")

simulate_tracking(subscribers, "Issue #42")
```

المتعقب إلحاقي فقط: كل حدث صف واحد، والصفوف لا تُحرر أبدًا — ذلك شكل السجل، وهو ما يجعل تحليلات 3.2 ذات معنى لاحقًا. يحل `simulate_tracking` محل بريد فعلي، واستدعاءات `log_event` التي يطلقها هي بالضبط ما سينتجه خطاف الويب لخدمة إنتاجية. يجعل `random.seed(42)` المحاكاة قابلة لإعادة الإنتاج، بحيث تكون الأرقام التي تراها هي الأرقام التي يراها كل متعلم — ما يجعل الناتج المتوقع أدناه قابلًا للتحقق بدلًا من مجرد انطباعات.

**🎯 الناتج المتوقع :**

ملف `tracking.csv` أُنشئ بالرؤوس الخمسة وعدة صفوف أحداث: بعض المشتركين فتحوا (وزوجان نقرا أيضًا) نسخة #42.

**🩹 إذا لم يعمل :**

إذا لم يظهر `tracking.csv` أبدًا، فـ `simulate_tracking` لم يُستدعَ، أو أعيد إنشاء دليل العمل بعد الإعداد. إذا كانت الأحداث بلا ختم زمني، فاستيراد `datetime` من الخطوة 1 مفقود في نطاق هذه القطعة. إذا راكم الملف رؤوسًا مكررة، ففرع `file_exists` يسجل إلى ملف موجود لكنه يكتب الرأس رغم ذلك.

### 3.2 احسب معدلات فتح ونقر صادقة

**👟 تلميح البداية :**

حمّل سجل التتبع بـ `pandas.read_csv`، واجمع حسب النسخة، واقسم على *حجم الجمهور الفعلي* — مرّر عدد المشتركين الحقيقي، بحيث لا تُضخَّم المعدلات بعدّ الناس الذين حضروا فقط.

```python
# newsletter.py (continued)
import pandas as pd

def generate_analytics(filepath: str = "tracking.csv", total_subscribers: int = 0) -> pd.DataFrame:
    """Compute per-issue open and click rates from the tracking log."""
    if not os.path.exists(filepath):
        print("No tracking data found.")
        return pd.DataFrame()

    df = pd.read_csv(filepath)

    print("\n  Newsletter Analytics")
    print("  " + "=" * 50)

    for issue in df["newsletter_issue"].unique():
        issue_data = df[df["newsletter_issue"] == issue]
        opens = len(issue_data[issue_data["event_type"] == "open"])
        clicks = len(issue_data[issue_data["event_type"] == "click"])
        total = total_subscribers or len(df["subscriber_email"].unique())
        open_rate = (opens / total * 100) if total > 0 else 0
        click_rate = (clicks / total * 100) if total > 0 else 0

        print(f"\n  Issue: {issue}")
        print(f"    Opens:       {opens}/{total} ({open_rate:.1f}%)")
        print(f"    Clicks:      {clicks}/{total} ({click_rate:.1f}%)")

    return df

simulate_tracking(subscribers, "Issue #42")
analytics = generate_analytics(total_subscribers=len(subscribers))
```

السطر الذي يحمل الخطوة كلها هو `total = total_subscribers or len(...)`. مقام المعدل يقرر صدقه: قسمة الفتحات على **كل من أُرسلت النسخة إليه** تعطي معدل الفتح الحقيقي؛ القسمة على الشخصين اللذين صادف أن فتحا تنتفخ إلى ~100٪ ولا تعلم شيئًا. التصفية بـ pandas — `df["newsletter_issue"] == issue` و`df["event_type"] == "open"` — تنتج أقنعة منطقية، و`len` للإطار المقنع يعدّ الصفوف المطابقة، وهي طريقة pandas الاصطلاحية للعد دون حلقة. بديل `or` يُبقي الدالة قابلة للاستخدام على ملف بلا حجم جمهور معروف.

**🎯 الناتج المتوقع :**

كتلة تحليلات لـ`Issue #42` — مع 3 مشتركين، شيء مثل `Opens: 2/3 (66.7%)` و`Clicks: 1/3 (33.3%)`، كل معدل أحداث هذه النسخة مقسومة على 3.

**🩹 إذا لم يعمل :**

إذا قرأت معدلات الفتح `100.0%`، فـ `total_subscribers` لا يُمرَّر (أو عمل بديل `or` لأنك مرّرت `0`). إذا ظهرت نسخ متعددة عندما توقعت واحدة، فترك التشغيلات السابقة أحداثًا في `tracking.csv` — السجل إلحاقي عن قصد؛ احذف الملف لسجل نظيف. إذا حصلت على `FileNotFoundError`, فـ `simulate_tracking` عمل على المسار الخاطئ أو لم يعمل أبدًا — شغّل 3.1 أولًا.

### 3.3 تحقّق من خطوة التتبع

**✅ قائمة التحقق**

- ✅ `tracking.csv` يحوي صفًا واحدًا لكل حدث (بلا رؤوس مكررة ولا صفوف معدلة يدويًا).
- ✅ `generate_analytics(total_subscribers=len(subscribers))` يطبع معدلات فتح ونقر لكل نسخة.
- ✅ يُحسب معدل الفتح مقابل جمهور الإرسال، لا versus الفاتحين فقط.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يفضّل الكود عن قصد `total_subscribers or len(df['subscriber_email'].unique())` على عدّ البريديات الفريدة فقط. متى *يختلف* هذان الرقمان — وأيُّهما ينتج معدل فتح مرتفعًا مضللًا؟
- سجل التتبع إلحاقي فقط: الصفوف لا تُحدَّث ولا تُحذف أبدًا. ما نوع الإجابة الذي يصبح *مستحيلًا* إعطاؤه صحيحًا بسجل إلحاقي إذا ألغى مشترك اشتراكه وأعاد الاشتراك بالبريد نفسه؟

## الخطوة 4: اختبر أسطر الموضوع A/B

لا يمكنك إقناع شخص بفتح بريدك بالحجة، لكن يمكنك قياسها. يقسم اختبار A/B الجمهور إلى نصفين، يرسل سطر الموضوع A إلى نصف وB إلى الآخر، يدع معدلات الفتح تقرر. تشغّل هذه الخطوة تلك التجربة بآلية التتبع التي بنيتها للتو.

### 4.1 قسّم القائمة وحاكِ الاختبار

**👟 تلميح البداية :**

اقلب نسخة من قائمة المشتركين، وقسمها عند منتصف الطريق إلى مجموعتين، ثم سجّل فتحات كل مجموعة تحت تسميات *نسخ* متميزة بحيث يميزها التحليل.

```python
# newsletter.py (continued)
import random

def ab_test_subject_lines(
    subscribers: list[dict],
    subject_a: str,
    subject_b: str,
    issue: str = "A/B Test",
) -> dict:
    """Run an A/B test by splitting subscribers and measuring open rates."""
    shuffled = subscribers.copy()
    random.shuffle(shuffled)
    mid = len(shuffled) // 2
    group_a = shuffled[:mid]
    group_b = shuffled[mid:]

    print(f"\n  A/B Test: Subject Line Comparison")
    print(f"  Version A: {subject_a}")
    print(f"  Version B: {subject_b}")
    print(f"  Group A: {len(group_a)} subscribers")
    print(f"  Group B: {len(group_b)} subscribers")

    for sub in group_a:
        if random.random() < 0.45:  # 45% open rate for A
            log_event(sub["email"], f"{issue}-A", "open")

    for sub in group_b:
        if random.random() < 0.62:  # 62% open rate for B
            log_event(sub["email"], f"{issue}-B", "open")

    df = pd.read_csv("tracking.csv")
    opens_a = len(df[(df["newsletter_issue"] == f"{issue}-A") & (df["event_type"] == "open")])
    opens_b = len(df[(df["newsletter_issue"] == f"{issue}-B") & (df["event_type"] == "open")])

    rate_a = (opens_a / len(group_a) * 100) if group_a else 0
    rate_b = (opens_b / len(group_b) * 100) if group_b else 0

    results = {
        "subject_a": subject_a,
        "subject_b": subject_b,
        "open_rate_a": round(rate_a, 1),
        "open_rate_b": round(rate_b, 1),
        "winner": "B" if rate_b > rate_a else "A",
    }

    print(f"  Version A open rate: {rate_a:.1f}%")
    print(f"  Version B open rate: {rate_b:.1f}%")
    print(f"  Winner: Version {results['winner']}")
    return results

results = ab_test_subject_lines(
    subscribers,
    subject_a="This Week in Python",
    subject_b="5 Python Tricks You Missed Last Week",
)
```

القرار الحاسم وسم أحداث كل مجموعة بتسمية *نسخة* مختلفة (`A/B Test-A` مقابل `A/B Test-B`) بدلًا من كتابة صفَي `open` لا يمكنك تمييزهما لاحقًا. الذئب في هذه الخطوة هو `&` في `df[(df["newsletter_issue"] == f"{issue}-A") & (df["event_type"] == "open")]`: تتطلب pandas الـ `&` العنصرية (لا `and` الخاصة بـ Python) لأن كل مقارنة تنتج مصفوفة قيم منطقية، ولا يستطيع `and` تقييم مصفوفات. يمنع `shuffled = subscribers.copy()` الخلط من إعادة ترتيب قائمة ما تزال دوال أخرى تعتمد عليها.

**🎯 الناتج المتوقع :**

لافتة اختبار، وأحجام مجموعات مجموعها الجمهور، ومعدلا فتح (B قرب 62٪ وA قرب 45٪)، و`winner: "B"`، وdict `results` بالمعدلين المقرّبين.

**🩹 إذا لم يعمل :**

إذا حصلت على `ValueError: The truth value of a DataFrame is ambiguous`، فتسرب `and` عارٍ إلى تعبير القناع — يجب أن يلتحم الفلتران بـ `&` وكلٌّ بين قوسين. إذا كان الحجمان هما حجم القائمة كلها، فالقائمة لم تُشقّق (`[:mid]`/`[mid:]`) من النسخة المُقلوبة. إذا كانت المعدلات 0 بالضبط، فسُجلت الأحداث تحت تسميات لا تطابق تسميات القراءة المعكوسة — قارن `f"{issue}-A"` في الموضعين حرفًا بحرف.

### 4.2 فكّر في النتيجة

**👟 تلميح البداية :**

قبل إعادة التشغيل، اسأل ما الذي يُسمَح للأرقام *بقوله* نظرًا لصغر العينة — الفائز جدير بالثقة بقدر مقامه.

**🎯 الناتج المتوقع :**

dict `results` بـ `winner` يطابق أياً كان معدله أعلى، وشرح جملة واحدة لما إذا كنت ستراهن على إرسالك التالي على ذلك الفائز.

**🩹 إذا لم يعمل :**

إذا قلب تشغيل ثانٍ الفائز، فذلك ليس خللًا — إنه السلوك الصادق لعينة صغيرة غير مذرية. إذا فاجأك ذلك، فهذه هي النقطة: مع مجموعات من ثلاثة، 45٪ مقابل 62٪ ضجيج، والإصلاح (جماهير أكبر، أو تشغيلات متكررة) جزء من التعلم، لا مشكلة كود.

### 4.3 تحقّق من اختبار A/B

**✅ قائمة التحقق**

- ✅ حجما المجموعتين A وB مجموعاهما عدّ المشتركين الكامل.
- ✅ أحداث النسختين قابلة للتمييز في `tracking.csv` بتسميات نسخهما.
- ✅ dict `results` المحسوب يحوي المعدلين وفائزًا، و`tracking.csv` لم يُكتب مرتين برؤوس مكررة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يعمل `random.shuffle` على القائمة في مكانها، ولهذا ينسخها 4.1 أولًا. ماذا كان سيحرس `subscribers.copy()` فعلًا، بما أن القائمة تحمل *قواميس* — هل تنسخ القواميس أيضًا؟ (تلميح: جرّب تحوير مشترك بعد النسخة.)
- الفائز `"B" if rate_b > rate_a else "A"` — لاحظ أن A يفوز بالتعادلات. مع هذا الجمهور المن ثلاثة، هل ستثق في ذلك الفاصل؟ وماذا ستحتاج تجربة حقيقية (قيمة p، أو `n` أكبر، أو فاصل ثقة) قبل أن تغيّر سطر موضوعك الافتراضي عليها؟

## الخطوة 5: أرسل نسخة إلى قطاع

الآن يغلق الخط أنابيبه: اختر قطاعًا (قل، قراء Python النشطين)، وصُغ القالب مرة *لكل مشترك* باسمه الخاص، واكتب كل نسخة شخصية في ملف خاص بها. يجتمع كل شيء من الخطوتين 1 و2 في دالة واحدة قابلة لإعادة الاستخدام.

### 5.1 ترجم واكتب النسخ الشخصية

**👟 تلميح البداية :**

ألّف مرشحاتك الموجودة في قطاع واحد، ثم ترجم القالب مرارًا بمتغيرات لكل شخص عبر دمج dict — ودع عنوان البريد يولّد أسماء ملفات آمنة.

```python
# newsletter.py (continued)
from pathlib import Path

def render_issue_to_files(subscribers: list[dict], template: str, variables: dict, out_dir: str = "issues") -> list[str]:
    """Render one personalized issue per subscriber and write it to disk."""
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    paths = []
    for sub in subscribers:
vars_for_sub = {**variables, "subscriber_name": sub.get("name", ""), "email": sub["email"]}
        rendered = render_template(template, vars_for_sub)
        safe_name = sub["email"].split("@")[0]
        path = out / f"{safe_name}.md"
        path.write_text(rendered)
        paths.append(str(path))
    return paths

targets = filter_by_status(filter_by_tag(load_subscribers(), "python"), "active")
written = render_issue_to_files(targets, NEWSLETTER_TEMPLATE, variables)
print(f"Rendered {len(written)} personalized issues into issues/")
print(open(written[0]).read())
```

السطر `vars_for_sub = {**variables, "subscriber_name": sub["name"], "email": sub["email"]}` هو دمج dict: ينسخ المتغيرات المشتركة ثم *يستبدل* مفاتيح كل شخص، بحيث يصبح الأساس نفسه للجميع شخصيًا لكل فرد — تحية «Hello {{subscriber_name}}!» في القالب تسمي القارئ الفعلي. تأليف المرشحات (`filter_by_status(filter_by_tag(...))`) هو مردود 2.2 من الدوال المسماة القابلة للتأليف: التقسيم مجرد تكديسها. اسم الملف يأتي من `sub["email"].split("@")[0]`، الذي يحوّل بريدًا إلى جذع آمن لنظام الملفات، و`Path.write_text` يجعل إدخال/إخراج الملف سطرًا واحدًا.

**🎯 الناتج المتوقع :**

`Rendered 2 personalized issues into issues/` والملف الأول يُطبع كنسخة مكتملة تحيي `Hello Alice!` — بالجسم نفسه من كل نسخة أخرى لكن ذلك السطر الواحد شخصي.

**🩹 إذا لم يعمل :**

إذا قال كل ملف `Hello Reader!`، فبديل كل شخص يخسر أمام `variables` — تحقق من ترتيب الدمج في `vars_for_sub` (المبادلات تأتي *بعد* dict المشترك). إذا كان للمشترك `name` فارغ، فتُقرأ التحية `Hello !` — يعيد `sub.get("name", "")` سلسلة فارغة لخلية CSV بيضاء، ويظهر `[MISSING: subscriber_name]` فقط لمفتاح غائب حقًا. إذا كان `written[0]` بجمهور خاطئ، فمرشحات القطاع المؤلَّفة تسحب الوسم الخاطئ.

### 5.2 تحقّق من الإرسال الشخصي

**✅ قائمة التحقق**

- ✅ فقط المشتركون المطابقون للقطاع (مثلًا نشط + وسم `python`) يحصلون على ملفات في `issues/`.
- ✅ كل ملف يحيّي مشتركه باسمه ويشارك نفس جسم النسخة.
- ✅ `issues/` لا يحوي ملفات شاردة من تشغيلات سابقة لم تلمسها الحلقة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يعيش دمج كل شخص *داخل* الحلقة، لكن dict `variables` المشترك يجلس خارجها. ما الذي سيتغير عن التاريخ المترجم إذا عمل استدعاء `datetime.now()` مرة داخل الحلقة لكل مشترك بدلًا من مرة واحدة — ولماذا «يُحسب مرة، لا لكل هوية» هو النداء الصحيح عمومًا؟
- الدمج `{**variables, "subscriber_name": <name>, "email": <email>}` — الترتيب مهم. إذا احتوى `variables` نفسه بالفعل مفتاح `subscriber_name`, فهل يستبدله الدمج، وكيف ستحتفظ *عن قصد* بافتراضي القالب للمشتركين بلا اسم؟

## ⚠️ مآزق شائعة

- **regex الجشع يبتلع عدة مساحات.** `\{\{(.+?)\}\}` يحتاج `?` غير الجشع — مع `.+` خام تنهار حصة مساحتين في مطابقة زائفة واحدة. الإصلاح: أبقِ `+?`، واختبر بمساحتين في سطر واحد كما تفعل 1.1.
- **مطابقة الوسوم غير القابلة للفك.** إذا اختبرت `tag in s["tags"]` دون `split(";")`، فسيتطابق «python» كنص فرعي مع «python3🐍» وتتسرب إيجابيات كاذبة إلى الأقسام. الإصلاح: فكّ الحقل المعبأ دائمًا بـ `.split(";")` قبل العضوية.
- **رؤوس مكررة في ملفات السجل.** الإلحاق بـ `"a"` وكتابة رأس في كل مرة يفسد `tracking.csv` و`subscribers.csv`. الإصلاح: بالّ بوابة `writeheader()` خلف فحص `os.path.exists` تمامًا كما في 2.1/3.1.
- **`and` بدلًا من `&` في مرشحات pandas.** يرفع `df["event_type"] == "open" and ...` خطأ `ValueError: The truth value of a DataFrame is ambiguous`. الإصلاح: ضع كل مقارنة بين قوسين والحمها بـ `&`.
- **معدلات تحسب بمقام خاطئ.** قسمة الفتحات على *الفاتحين* (بريديات فريدة في السجل) تنتفخ معدلات الفتح نحو 100٪. الإصلاح: مرّر عدّ الجمهور الحقيقي (`total_subscribers=len(subscribers)`)، كما تفعل 3.2.

## ما بنيته للتو

خط نشرة كامل، من البداية إلى النهاية: محرك قوالب regex يملأ نسخ Markdown، ومدير مشتركين CSV بتقسيم قائم على الوسوم، وخطوة تحليلات فتح/نقر صادقة، واختبار A/B لسطر الموضوع، وممر أخير يكتب نسخة شخصية لكل قارئ. المهارة القابلة للنقل هي *خط محتوى*: القالب + البيانات + القطاع + القياس هي الكتل الأربع نفسها خلف تكاملات ESP حقيقية (Mailchimp وSendGrid) وأتمتة التسويق وكل سكربت «أرسل تقريرًا للأشخاص المناسبين أسبوعيًا» ستكتبه في وظيفة.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/newsletter-builder/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/newsletter-builder) في مستودع الدورة يشحن الخط الكامل مع معالج إلغاء اشتراك وفئة قطاع مسماة. استنسخه، أو افتح المستودع كله في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وشغّله من هناك.
:::

## إلى أين تذهب من هنا

- أضف **معالجة إلغاء الاشتراك**: امسح `tracking.csv` لأحداث «إلغاء اشتراك» واقلب حالة ذلك المشترك إلى `unsubscribed` في `subscribers.csv` — لديك بالفعل `filter_by_status` تنتظر تلك القيمة بالضبط.
- ابنِ **أرشيف نسخ**: غيّر `render_issue_to_files` ليكتب كل نسخة تحت اسم ملف مؤرخ (`newsletter-2026-09-06.md`) ويصدر `index.md` يسرد كل نسخة سابقة — `datetime.now().strftime("%Y-%m-%d")` هو الحيلة كلها.
- اصنع **كتالوج قطاعات مسماة**: خزّن قواعد القطاع مثل `tag=python AND status=active` كملفات JSON صغيرة وقيّمها بالمرشحين — نمط «القواعد كبيانات» الذي يحوّل السكربتات اللامسة إلى نظام.
- ارسم **مخطط نمو**: اقرأ `subscribers.csv` وارسم عدّادات `subscribed_at` عبر الزمن بـ matplotlib — خطوة `value_counts` واحدة زائد `plot()` تحوّل قائمة المشتركين إلى خط اتجاه.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحوي شرحًا كاملًا مبتدئًا لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python يبني جمهوره الخاص. 🎓