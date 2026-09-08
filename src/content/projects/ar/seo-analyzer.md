---
title: "محلل SEO"
description: "حلل المواقع لمشاكل SEO — العلامات الوصفية والعنوان والأداء وتحسين الكلمات المفتاحية."
difficulty: "intermediate"
estimatedMinutes: 55
tags: ["requests", "beautifulsoup4", "seo", "web-scraping", "pandas"]
learningObjectives:
  - "جلب صفحات الويب وتحليلها لاستخراج العناصر ذات الصلة بـSEO"
  - "تدقيق العلامات الوصفية وبيانات Open Graph وتسلسل العناوين"
  - "حساب كثافة الكلمات المفتاحية ودرجات المحتوى"
  - "توليد تقارير مقارنة منظمة بـpandas"
prerequisites:
  - "أساسيات Python (دوال وقواميس وقوائم)"
  - "أساسيات HTML (وسوم وسمات وتعشيش)"
  - "ارتياح مع `requests` أو استعداد لتعلمه في الإعداد"
---

# 🔍 محلل SEO

لكل موقع إشارات SEO خفية — أوصاف وصفية، وتسلسل عناوين، ووسوم Open Graph — تحدد ما إذا كانت محركات البحث ترتّبه جيدًا أو تدفنه. يبني هذا المشروع عدة أدوات تجلب أي URL وتستخرج تلك الإشارات وتسجّلها مقابل أفضل الممارسات وتولّد تقريرًا منظمًا يمكنك مقارنته عبر عدة صفحات، كل ذلك بمكتبات بايثون خالصة تعمل في أي مكان.

يفترض هذا أساسيات Python وأساسيات HTML ومكتبة `requests` (المغطاة في الإعداد) — لا شيء من تحليل البيانات مطلوب. إنه اختياري وغير مصنّف؛ راجع [المشاريع الواقعية](/ar/مشاريع) للقائمة الكاملة والمتنامية.

## 🎯 ما ستفعله

1. اجلب أي URL وحلل HTML الخاص به بـ`requests` وBeautifulSoup.
2. استخرج وتحقق من العلامات الوصفية والعناوين وبيانات Open Graph.
3. دقّق بنية العناوين لتسلسل H1–H6 السليم.
4. احسب كثافة الكلمات المفتاحية ودرجات صلة المحتوى.
5. ولّد تقرير مقارنة جنبًا إلى جنب عبر عدة صفحات بـpandas.

## أين تُشغّل هذا

يعمل هذا المشروع في أي مكان تقريبًا — `requests` و`BeautifulSoup` و`pandas` كلها بايثون خالص بلا اعتماديات على مستوى النظام.

**يعمل ملعب JupyterLite** جيدًا: الصق خلايا الكود مباشرة في دفتر ملاحظات. ستحتاج إلى `!pip install requests beautifulsoup4 pandas lxml` في خلية أولًا.

**يعمل Google Colab** مجهزًا — المكتبات الثلاث كلها مثبتة مسبقًا على بيئة Colab.

**محليًا مع `uv`** هو المسار الموصى به لبناء مشروع حقيقي بملفات، لا خلايا فقط — اتبع قسم الإعداد أدناه.

**تعمل Binder وKaggle Notebooks** أيضًا، إذ لا حاجة إلى GPU أو اعتماديات أصلية.

## الإعداد

كل ما تحتاجه قبل كتابة سطر من التحليل.

### ثبّت `uv`

`uv` أداة واحدة تحل محل سلسلة «ثبّت Python، ثم ثبّت pip، ثم ثبّت أداة بيئة افتراضية، ثم ثبّت الحزم» المعتادة — يمكنها تثبيت نسخ Python وإدارتها بنفسها، جنبًا إلى جنب مع اعتماديات مشروعك.

**macOS / Linux** (الطرفية):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

أغلق وأعد فتح طرفيتك، ثم تأكد من التثبيت:

```bash
uv --version
```

### هيّئ المشروع

```bash
uv init seo-analyzer
cd seo-analyzer
uv add requests beautifulsoup4 pandas lxml
```

يجلب `requests` صفحات الويب؛ و`beautifulsoup4` يحلل HTML إلى شجرة قابلة للتنقل؛ و`lxml` خلفية محلل سريعة لـBeautifulSoup؛ و`pandas` تبني تقارير المقارنة. الأربع كلها بايثون خالص — لا مترجم ولا مكتبات نظام مطلوبة.

**✅ قائمة التحقق**

- ✅ يطبع `uv --version` رقم نسخة.
- ✅ `seo-analyzer/` موجود مع `pyproject.toml`، وكل الحزم الأربع مثبتة.
- ✅ `uv run python -c "import requests, bs4, pandas; print('all good')"` يطبع `all good`.

## الخطوة 1: اجلب صفحة واستخرج العلامات الوصفية

لبنة البناء الأولى: بمعلومية URL، اجلب HTML الخاص به واسحب البيانات الوصفية الحرجة للـSEO — العنوان والوصف ووسوم Open Graph — التي تقرؤها محركات البحث ومنصات التواصل.

### 1.1 اكتب الجالب ومستخرج البيانات الوصفية

```python
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse

def fetch_page(url: str) -> BeautifulSoup:
    """Fetch a URL and return a parsed BeautifulSoup tree."""
    try:
        headers = {"User-Agent": "SEOAnalyzer/1.0 (Educational Project)"}
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return BeautifulSoup(response.text, "lxml")
    except requests.exceptions.Timeout:
        print(f"Timeout fetching {url}")
        raise
    except requests.exceptions.HTTPError as e:
        print(f"HTTP error: {e}")
        raise
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        raise

def extract_meta(soup: BeautifulSoup, url: str) -> dict:
    """Extract SEO-relevant metadata from a parsed page."""
    title_tag = soup.find("title")
    title = title_tag.get_text(strip=True) if title_tag else ""

    desc_tag = soup.find("meta", attrs={"name": "description"})
    description = desc_tag["content"] if desc_tag and desc_tag.get("content") else ""

    og_title = soup.find("meta", property="og:title")
    og_desc = soup.find("meta", property="og:description")
    og_image = soup.find("meta", property="og:image")

    return {
        "url": url,
        "domain": urlparse(url).netloc,
        "title": title,
        "title_length": len(title),
        "description": description,
        "desc_length": len(description),
        "og_title": og_title["content"] if og_title and og_title.get("content") else "",
        "og_description": og_desc["content"] if og_desc and og_desc.get("content") else "",
        "og_image": og_image["content"] if og_image and og_image.get("content") else "",
    }

soup = fetch_page("https://example.com")
meta = extract_meta(soup, "https://example.com")
print(f"Title: {meta['title']!r} ({meta['title_length']} chars)")
print(f"Description: {meta['description'][:80]!r} ({meta['desc_length']} chars)")
```

**👟 تلميح البداية :** يرسل `fetch_page` طلبًا بترويسة `User-Agent` مخصصة (ممارسة جيدة — تعرّف زاحفك) ويعيد كائن BeautifulSoup. يستخدم `extract_meta` ثم `soup.find()` لسحب وسوم محددة: `<title>` و`<meta name="description">` والوسوم الثلاثة `og:`. كل استخراج يعالج حالة «الوسم مفقود» بلطف بإعادة سلسلة فارغة.

**🎯 الناتج المتوقع :**
```
Title: 'Example Domain' (14 chars)
Description: '' (0 chars)
```

**🩹 إذا لم يعمل :** يعني `requests.exceptions.ConnectionError` أن URL خاطئ أو لا يمكن الوصول إليه — جرّب `https://example.com` أولًا (يعمل دائمًا). يعني `Timeout` أن الخادم أخذ أكثر من 10 ثوانٍ — زِد المهلة أو جرّب موقعًا أسرع. إذا كانت `title` فارغة حيث توقعت محتوى، فالصفحة ربما تُرندر بـJavaScript (لا تستطيع BeautifulSoup رؤيته) — جرّب صفحة مرندرة خدميًّا بدل ذلك.

### 1.2 تحقق من استخراج البيانات الوصفية

**✅ قائمة التحقق**

- ✅ يعيد `fetch_page("https://example.com")` كائن BeautifulSoup دون أخطاء.
- ✅ يعيد `extract_meta` قاموسًا بمفاتيح `title` و`title_length` و`description` و`desc_length` وحقول `og_*` الثلاثة.
- ✅ يثير URL غير موجود خطأً واضحًا، لا تتبّعًا مربكًا من داخل `requests`.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- ترويسة `User-Agent` تقول `SEOAnalyzer/1.0`. ماذا يحدث لو أزلتها نهائيًّا — هل ترفض معظم الخوادم الطلب؟ ولماذا تعرّف الزواحف حسنة السلوك عن نفسها؟
- تستطيع BeautifulSoup مع `lxml` تحليل HTML معتل. ماذا سيحدث مع `"html.parser"` (المدمج) بدلًا منها — هل تلاحظ فرقًا على صفحة سليمة؟ وعلى صفحة مكسورة؟

## الخطوة 2: دقّق تسلسل العناوين

وسوم العناوين (`<h1>` حتى `<h6>`) تخبر محركات البحث ببنية المستند — صفحة بلا `<h1>` أو بها `<h3>` مباشرة بعد `<h1>` (متخطيًا `<h2>`) تشير إلى بنية رديئة. تبني هذه الخطوة فاحصًا يعد كل مستوى عنوان ويعلّم المشاكل البنيوية.

### 2.1 ابنِ محلل العناوين

```python
def analyze_headings(soup: BeautifulSoup) -> dict:
    """Audit heading hierarchy for SEO best practices."""
    headings = {}
    for level in range(1, 7):
        headings[f"h{level}"] = [
            tag.get_text(strip=True)[:80] for tag in soup.find_all(f"h{level}")
        ]

    h1_count = len(headings["h1"])
    issues = []
    if h1_count == 0:
        issues.append("Missing H1 tag — every page should have exactly one H1")
    elif h1_count > 1:
        issues.append(f"Multiple H1 tags ({h1_count}) — use only one per page")

    used_levels = [int(k[1]) for k, v in headings.items() if v]
    if used_levels:
        full_range = set(range(min(used_levels), max(used_levels) + 1))
        if not full_range.issubset(set(used_levels)):
            issues.append(f"Skipped heading levels: h{sorted(full_range - set(used_levels))}")

    return {
        "headings": headings,
        "h1_count": h1_count,
        "total_headings": sum(len(v) for v in headings.values()),
        "issues": issues,
    }

heading_data = analyze_headings(soup)
print(f"H1 count: {heading_data['h1_count']}, Total: {heading_data['total_headings']}")
for issue in heading_data["issues"]:
    print(f"  ⚠ {issue}")
```

**👟 تلميح البداية :** تلوّح الدالة عبر `h1` حتى `h6` وتجمع كل الوسوم في كل مستوى، ثم تطبق قاعدتين: `<h1>` واحد بالضبط لكل صفحة، ولا مستويات عنوان متخطاة. يتتبع `used_levels` المستويات التي تظهر فعلًا — إذا ظهر `h1` و`h3` لكن لم يظهر `h2`، فذلك مستوى متخطًى. شريحة `[:80]` تبقى التقرير مقروءًا عندما تكون العناوين طويلة.

**🎯 الناتج المتوقع :** بالنسبة لـ`https://example.com` (التي لا عناوين فيها):
```
H1 count: 0, Total: 0
  ⚠ Missing H1 tag — every page should have exactly one H1
```

**🩹 إذا لم يعمل :** إذا كان `total_headings` يساوي 0 لصفحة تعرف أنها ذات عناوين، فالصفحة ربما مرندرة بـJavaScript — ترى BeautifulSoup HTML الأولي فقط، لا المحتوى المحمّل بعد تحميل الصفحة. إذا أطلق فحص المستوى المتخطى بغير توقع، فتأكد أن `used_levels` يسحب من المفاتيح الصحيحة — خطأ مطبعي مثل `"h7"` في المدى سيزيح min/max بصمت.

### 2.2 تحقق من تدقيق العناوين

**✅ قائمة التحقق**

- ✅ يعيد `analyze_headings(soup)` قاموسًا بـ`headings` و`h1_count` و`total_headings` و`issues`.
- ✅ صفحة بلا عناوين تعيد `h1_count=0` وتضم مشكلة «Missing H1».
- ✅ يمكنك شرح لماذا `<h1>` واحد بالضبط هو معيار الـSEO (لا صفر ولا متعدد).

**🤔 سؤال (أسئلة) سقراطي(ة)**

- صفحة فيها `<h1>Title</h1>` ثم `<h3>Section</h3>` بلا `<h2>` بينهما. يحلّل أداتك هذا مستوى متخطًى. لماذا تهتم محركات البحث بتسلسل العناوين المتتالي، رغم أن HTML لا يفرضه؟
- ماذا يحدث لو بحثت عن عناوين داخل وسوم `<script>` أو `<style>`؟ هل يغيّر ذلك العد؟ كيف يساعد `get_text(strip=True)` هنا أو لا يساعد؟

## الخطوة 3: احسب كثافة الكلمات المفتاحية ومقاييس المحتوى

تخبرك كثافة الكلمات المفتاحية كم تظهر كلمة معينة نسبةً إلى العد الكلي للكلمات — منخفضة جدًّا والصفحة ليست عن ذلك الموضوع؛ عالية جدًّا وتبدو حشوًا للكلمات المفتاحية. تجرد هذه الخطوة أيضًا المحتوى غير المرئي (سكربتات وأشرطة تنقل وذيلات) قبل العد، فتعكس الأرقام ما يراه القارئ البشري فعلًا.

### 3.1 ابنِ محلل المحتوى وفاحص الكلمات المفتاحية

```python
import re

def keyword_density(text: str, keyword: str) -> dict:
    """Calculate keyword density in visible page text."""
    words = re.findall(r"\b\w+\b", text.lower())
    total_words = len(words)
    if total_words == 0:
        return {"keyword": keyword, "count": 0, "density": 0.0, "total_words": 0}
    count = sum(1 for w in words if w == keyword.lower())
    return {
        "keyword": keyword,
        "count": count,
        "density": round(count / total_words * 100, 2),
        "total_words": total_words,
    }

def analyze_content(soup: BeautifulSoup) -> dict:
    """Extract visible text and compute basic content metrics."""
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    text = soup.get_text(separator=" ", strip=True)
    words = re.findall(r"\b\w+\b", text)
    return {"text": text, "word_count": len(words), "char_count": len(text)}

content = analyze_content(soup)
print(f"Word count: {content['word_count']}")

for kw in ["example", "domain", "web"]:
    d = keyword_density(content["text"], kw)
    print(f"  '{kw}': {d['count']} occurrences ({d['density']}%)")
```

**👟 تلميح البداية :** يستخدم `analyze_content` `soup.decompose()` لإزالة الوسوم غير المرئية (`script` و`style` و`nav` و`footer` و`header`) قبل استخراج النص — يمنع هذا روابط التنقل والنصوص المتكررة من تضخيم عدد كلماتك. يحسب `keyword_density` بعدها تطابقًا بحدود كلمات حساس الحالة بشكل غير حساس (`\b\w+\b`) للكلمة الدقيقة، ويقسم على إجمالي الكلمات. كثافة 1–3% صحية عادةً؛ وفوق 5% تبدو حشوًا.

**🎯 الناتج المتوقع :** بالنسبة لـ`https://example.com`:
```
Word count: <some number around 20-40>
  'example': <count> occurrences (<density>%)
  'domain': <count> occurrences (<density>%)
  'web': <count> occurrences (<density>%)
```

**🩹 إذا لم يعمل :** إذا كان `word_count` مرتفعًا مريبًا (آلاف)، فلن يزيل `decompose()` ما يكفي — قد تستخدم الصفحة أغماد `<div>` حول التنقل بدل `<nav>`. إذا أعاد `keyword_density` `0.0` لكلمة تراها على الصفحة، فقد تكون الكلمة منقسمة عبر وسوم أو مغلّفة في `<span>` — يربط `get_text()` النص من وسوم متداخلة، لكن `\b\w+\b` لن يطابق عبر حدود الوسوم.

### 3.2 تحقق من تحليل المحتوى

**✅ قائمة التحقق**

- ✅ يعيد `analyze_content(soup)` `text` و`word_count` و`char_count` — كلها غير صفرية لصفحة بمحتوى مرئي.
- ✅ يعيد `keyword_density` `count=0` و`density=0.0` لكلمة لا تظهر على الصفحة.
- ✅ استدعاء `decompose()` يزيل وسوم `<script>` و`<style>` و`<nav>` و`<footer>` و`<header>` قبل استخراج النص.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تعد تواتر الكلمات بتطابق دقيق (`w == keyword.lower()`). ما الذي يتغير لو أردت مطابقة «web» داخل «website» — هل ذلك أفضل أم أسوأ لتحليل الـSEO، ولماذا؟
- صفحة فيها 500 كلمة نص مرئي و5000 كلمة داخل وسوم `<script>`. لماذا تجريد السكربتات مهم لكثافة الكلمات المفتاحية، وما المحتوى غير المرئي الآخر الذي ستضيفه إلى قائمة الإزالة؟

## الخطوة 4: ولّد تقريرًا موزونًا

المردود: ادمج استخراج البيانات الوصفية وتدقيق العناوين وتحليل المحتوى في دالة موزونة واحدة تنتج رقمًا واحدًا (0–100) لأي URL، ثم قارن عدة صفحات جنبًا إلى جنب في DataFrame من pandas.

### 4.1 ابنِ دالة الدرجات

```python
def analyze_url(url: str) -> dict:
    """Run a complete SEO audit on a single URL."""
    soup = fetch_page(url)
    meta = extract_meta(soup, url)
    headings = analyze_headings(soup)
    content = analyze_content(soup)

    scores = {}
    scores["title"] = 10 if 30 <= meta["title_length"] <= 60 else 5 if meta["title_length"] > 0 else 0
    scores["description"] = 10 if 120 <= meta["desc_length"] <= 160 else 5 if meta["desc_length"] > 0 else 0
    scores["h1"] = 10 if headings["h1_count"] == 1 else 0
    scores["headings"] = min(10, headings["total_headings"])
    scores["og_tags"] = sum(10 for k in ["og_title", "og_description", "og_image"] if meta[k])

    overall = sum(scores.values()) / (len(scores) * 10) * 100
    return {
        "url": url,
        "meta": meta,
        "headings": headings,
        "content": content,
        "scores": scores,
        "overall_score": round(overall, 1),
    }

report = analyze_url("https://example.com")
print(f"\n{'='*50}\nSEO Report: {report['url']}\n{'='*50}")
print(f"Overall Score: {report['overall_score']}/100")
for cat, score in report["scores"].items():
    print(f"  {cat}: {score}/10")
```

**👟 تلميح البداية :** معيار الدرجات متعمد: طول العنوان يحصل على 10 نقاط إذا كان في الموضع الجميل 30–60 (5 إذا وُجد لكن بطول خاطئ، 0 إذا فُقد)، والوصف يحصل على 10 إذا كان 120–160 حرفًا (مدى عرض Google)، وH1 يحصل على 10 فقط إذا كان واحدًا بالضبط، ووسوم OG تحصل على 10 لكل من الثلاثة التي تفحصها. يقسم `overall_score` المجموع على النهاية القصوى (50) ويضرب في 100.

**🎯 الناتج المتوقع :**
```
==================================================
SEO Report: https://example.com
==================================================
Overall Score: <number>/100
  title: <score>/10
  description: <score>/10
  h1: <score>/10
  headings: <score>/10
  og_tags: <score>/10
```

**🩹 إذا لم يعمل :** إذا كان `overall_score` يساوي 0.0 لصفحة تعرف أن فيها بعض عناصر الـSEO، فإحدى الدرجات الفرعية تصفّرة — تحقق من `meta["title_length"]` و`headings["h1_count"]` كلٌّ على حدة. إذا كان `scores["og_tags"]` يساوي 0 لصفحة فيها وسوم Open Graph، فتأكد أن سمة `property="og:*"` تطابق بالضبط — بعض المواقع تستخدم `name=` بدل `property=`.

### 4.2 ابنِ DataFrame المقارنة

```python
import pandas as pd

def compare_urls(urls: list[str]) -> pd.DataFrame:
    """Audit multiple URLs and return a comparison table."""
    results = []
    for url in urls:
        try:
            r = analyze_url(url)
            results.append({
                "URL": url,
                "Score": r["overall_score"],
                "Title": r["meta"]["title"][:40],
                "Title Len": r["meta"]["title_length"],
                "Desc Len": r["meta"]["desc_length"],
                "H1 Count": r["headings"]["h1_count"],
                "Words": r["content"]["word_count"],
            })
        except Exception as e:
            results.append({"URL": url, "Score": 0, "Error": str(e)})
    return pd.DataFrame(results)

df = compare_urls(["https://example.com", "https://python.org"])
print(df.to_string(index=False))
```

**👟 تلميح البداية :** يلفّ `compare_urls` `analyze_url` في try/except حتى لا يقتل URL فاشلًا المقارنة كلها — يسجّل الخطأ في DataFrame بدلًا من ذلك. أعمدة DataFrame مسطحة عمدًا (سلاسل وأرقام، لا قواميس متداخلة) فحتى تستطيع pandas فرزها وتصفيتها وتصديرها دون معالجة إضافية.

**🎯 الناتج المتوقع :** DataFrame من pandas بصفين (واحد لكل URL)، بأعمدة `Score` و`Title` و`Title Len` و`Desc Len` و`H1 Count` و`Words`.

**🩹 إذا لم يعمل :** إذا أظهر DataFrame `Error` في عمود `Score` لـURL واحد، فذلك الموقع حجب أو انتهى وقته — جرّب URL مختلفًا. إذا أخذ `compare_urls` وقتًا طويلًا، فهو يعمل تسلسليًّا — راجع قسم المآزق الشائعة لملاحظة حول الجلب المتوازي.

### 4.3 تحقق من تقرير الدرجات

**✅ قائمة التحقق**

- ✅ يعيد `analyze_url("https://example.com")` قاموسًا بـ`url` و`meta` و`headings` و`content` و`scores` و`overall_score`.
- ✅ `overall_score` بين 0 و100، وكل درجة فرعية بين 0 و10.
- ✅ يعيد `compare_urls` DataFrame حيث كل صف هو URL واحد وكل عمود مقياس واحد.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- صفحة بعنوان مثالي (30–60 حرفًا) وبلا وصف تسجّل 50/100. صفحة بالاثنين المثاليين تسجّل 70/100. ماذا يخبرك هذا عن الوزن النسبي للوصف مقابل العنوان في هذا المعيار، وهل تغيّر تلك الأوزان لأداة تدقيق حقيقية؟
- لو شغّلت `compare_urls` على 50 URL وانتهى وقت واحد، يظهر `Score=0` بعمود `Error`. هل `Score=0` هو الافتراضي الصحيح لجلب فاشل، أم تستخدم `NaN` — وما الذي يتغير في DataFrame لو استخدمت `NaN`؟

## ⚠️ مآزق شائعة

- **صفحات مرندرة بـJavaScript تعيد محتوى فارغًا أو خاطئًا.** يرى `requests` + BeautifulSoup HTML الأولي فقط — أي محتوى يحمّله JavaScript (تطبيقات صفحة واحدة، صور محمّلة كسولًا) لن يظهر في الشجرة المحللة. إذا بدت صفحة فارغة لكنها تعمل في متصفحك، فهي مرندرة بـJS؛ استخدم متصفحًا بلا رأس (Playwright أو Selenium) بدلًا من ذلك، أو اختر صفحة مرندرة خدميًّا للاختبار.
- **الحجب أو تحديد المعدل على الطلبات المتكررة.** بعض المواقع تحجب الزحف العدواني. المهلة 10 ثوانٍ و`User-Agent` المخصص تساعدان، لكن إذا كنت تدقق صفحات كثيرة، أضف `time.sleep(1)` بين الطلبات أو استخدم `concurrent.futures.ThreadPoolExecutor` بمسبح محدود لتبقى مهذبًا.
- **مطابقة `og:` هشة.** يستخدم الكود `property="og:title"` — بعض المواقع تستخدم `name="og:title"` بدلًا (عامًا خاطئ وفق مواصفات Open Graph، لكنه شائع). إذا كانت وسوم OG مفقودة في موقع تعرف أنها فيها، فجرّب البحث عن صيغ `name=` أيضًا.
- **عدد الكلمات يشمل النص المتكرر.** قائمة `decompose()` تزيل `script` و`style` و`nav` و`footer` و`header` — لكن ليس كل النص المتكرر يعيش في تلك الوسوم. صفحة بها `<aside>` كبير أو `<div class="sidebar">` مليء بروابط سينفّخ عدد الكلمات. لعدّ أكثر دقة، ستحتاج محددات خاصة بالموقع.

## ما بنيته للتو

عدة تدقيق SEO تجلب أي URL وتستخرج علاماته الوصفية وبنية عناوينه وتسجّلها مقابل أفضل الممارسات الراسخة وتنتج جدول مقارنة عبر عدة صفحات — كل ذلك بأربع مكتبات بايثون خالصة وبلا أتمتة متصفح. معيار الدرجات بسيط بما يكفي لفهمه وتمديده، ودالة `compare_urls` تعطيك DataFrame من pandas جاهزًا للفرز أو التصفية أو التصدير إلى CSV.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/seo-analyzer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/seo-analyzer) في مستودع المساق نسخة أكمل مع تدقيق نص بديل للصور وتصنيف روابط داخلية/خارجية وزاحف خريطة موقع يدقق كل صفحة مدرجة في XML لخريطة موقع. استنسخه، أو افتح المستودع كله في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) وشغّله من هناك.
:::

## إلى أين تذهب من هنا

- أضف تدقيق نص بديل للصور: اعثر على كل وسم `<img>`، وبلّغ عن المفقود منها `alt`، واحسب النسبة المئوية للصور ذات نص بديل — فوز مباشر في إمكانية الوصول والـSEO.
- أضف تصنيف الروابط الداخلية مقابل الخارجية: استخرج كل روابط `<a href>`، وعدّ كل فئة، وعلّم الصفحات ذات قلة الروابط الداخلية (دون 3) مشكلة SEO محتملة.
- ابنِ زاحف خريطة موقع: بمعلومية URL خريطة موقع، اجلب كل صفحة مدرجة فيها، وشغّل التدقيق الكامل على كل منها، وصدّر CSV ملخصًا بـ`concurrent.futures.ThreadPoolExecutor` للجلب المتوازي.

## شارك مشروعك مع الصف

بنيت شيئًا تفتخر به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع قدّمها طلاب آخرون — وREADME الخاص به يحتوي إرشادًا كاملًا صديقًا للمبتدئين لإضافة مشروعك عبر **طلب سحب**، حتى لو لم تستخدم git من قبل: الشوكة، والفرع، والالتزام، وفتح الـPR، خطوة خطوة. لا خبرة git مسبقة مفترضة.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓