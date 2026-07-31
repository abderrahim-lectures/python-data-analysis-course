---
id: job-aggregator
title: "بناء مُجمِّع إعلانات وظائف"
sidebar_label: "مُجمِّع إعلانات وظائف"
slug: /projects/job-aggregator
description: "استخرج بيانات من مصادر متعددة بأسلوب لوحة وظائف، وأزل التكرار بينها، ونبّه عن تطابقات جديدة مقابل مرشِّح كلمات مفتاحية — بـrequests/BeautifulSoup وpandas، بلا حاجة لمفتاح API."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 بناء مُجمِّع إعلانات وظائف

<ProjectPublishedDate projectId="2027-job-aggregator" />

<ProjectGreeting />

[استخرج وحلّل موقع ويب حي](/docs/projects/scrape-analyze) جلب موقعًا واحدًا وحوّل HTML الخاص به إلى CSV. البحث الحقيقي عن وظيفة يعني مراقبة *عدة* مصادر في آنٍ واحد، لا يتفق أي منها على ترميز، والاهتمام فقط بما هو جديد فعليًا منذ آخر مرة تحققت فيها. يبني هذا المشروع ذلك: حلّل إعلانات من حفنة من صفحات "لوحة وظائف" مُبنيَّة بشكل مختلف، اجمعها في جدول واحد، أزل تكرار المنشورات التي تظهر على أكثر من لوحة واحدة، صفِّ إلى الأدوار التي تطابق كلمة مفتاحية تهمك، ونبّه فقط عن التطابقات الجديدة — لا نفس العشرة إعلانات في كل تشغيل. يفترض هذا Python بمستوى 101، ولخطوة إزالة التكرار/التصفية، ارتياحًا مع pandas بمستوى تحليل البيانات — التصفية، و`drop_duplicates`، والأقنعة البولية.

هذا اختياري وغير مُقيَّم. راجع [مشاريع من العالم الحقيقي](/docs/projects) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. تحليل HTML لصفحة إعلان وظيفة واحدة إلى حقول مُهيكَلة بـBeautifulSoup.
2. كتابة محلِّل صغير واحد لكل مصدر ودمج عدة مصادر مُبنيَّة بشكل مختلف في جدول واحد.
3. إزالة تكرار الإعلانات المنشورة على أكثر من لوحة واحدة، باستخدام pandas.
4. التصفية بكلمة مفتاحية وطباعة/حفظ فقط التطابقات الجديدة منذ آخر تشغيل.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الذي تتبعه خطوات هذا الدرس، والموصى به — إنه Python فعلي يعمل على جهازك الخاص، نفس خطوة "التخرّج إلى Python فعلي" كأي مشروع آخر في هذا القسم. يشرح قسم الإعداد أدناه كيفية تثبيته.

**GitHub Codespaces** بديل بلا إعداد إذا كنت تفضّل عدم تثبيت أي شيء محليًا بعد: افتح [مستودع الدورة كاملًا في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython وuv مثبّتة بالفعل، وفق `.devcontainer/devcontainer.json` الخاص بالمستودع) وشغّل نفس أوامر `uv` تمامًا من طرفية في تبويب متصفحك.

**Google Colab وKaggle Notebooks أو Binder** ملاءمة جيدة فعليًا لهذا المشروع بالتحديد — بلا GPU، بلا مفتاح API، بلا عملية طويلة التشغيل لإدارتها، ويناسب خط الأنابيب بأكمله براحة حفنة من الخلايا. نسخة دفتر ملاحظات حقيقية وقابلة للتشغيل (نفس المحلِّلات، ومفتاح إزالة التكرار، ومرشِّح الكلمات المفتاحية كما في الخطوات أدناه) موجودة في [`examples/job-aggregator/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/job-aggregator/notebook.ipynb). انقر على شارة لتشغيله مباشرة، دون أي تثبيت محلي على الإطلاق:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/job-aggregator/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/job-aggregator/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fjob-aggregator%2Fnotebook.ipynb)

كن صادقًا مع نفسك بشأن المقايضة، مع ذلك: هذه طريقة أقل دقة لتجربة المشروع من مشروع `uv` محلي فعلي — بلا ملفات منفصلة، بلا بنية مشروع حقيقية، مجرد خلايا في دفتر ملاحظات. عامِلها كطريقة سريعة للتجربة، لا المسار الأساسي.

## الإعداد

`uv` أداة واحدة تحل محل السلسلة المعتادة "ثبّت Python، ثم ثبّت pip، ثم ثبّت أداة بيئة افتراضية، ثم ثبّت الحزم" — يمكنها تثبيت وإدارة إصدارات Python بنفسها، إلى جانب تبعيات مشروعك.

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

ثم أعِدَّ مشروعًا محليًا:

```bash
uv init job-aggregator
cd job-aggregator
uv add beautifulsoup4 pandas
```

بلا مفتاح API، بلا تسجيل مستوى مجاني، لا شيء لإعداده قبل أن تستطيع تشغيل سطر واحد من الكود.

## ملاحظة حول ما يستخرجه هذا المشروع

لوحات الوظائف الحقيقية — LinkedIn، وIndeed، ومواقع مشابهة — تحظر صراحة الاستخراج الآلي في شروط خدمتها، وتكتشف وتحظر أدوات الاستخراج بنشاط، وتغيّر ترميزها بتكرار يكفي لأن أي درس مبني ضدها سينكسر خلال أشهر. لا شيء من ذلك أساس جيد لمشروع دورة يُقصَد منه الاستمرار بالعمل لسنوات.

بدلًا من ذلك، يشحن هذا المشروع بمجموعة بيانات نموذجية **مُرفَقة** صغيرة خاصة به: ثلاثة ملفات HTML ثابتة تحت [`examples/job-aggregator/sample_data/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/job-aggregator/sample_data)، كل واحد بأسلوب "لوحة وظائف" تجريبية مختلفة (`board_alpha.html`، و`board_beta.html`، و`board_gamma.html`)، كل واحد يستخدم HTML مختلفًا فعليًا لإعلاناته — تخطيط بطاقة div-وspan، وقائمة نقطية، وجدول `<table>` بسيط. اثنان من الإعلانات العشرة بينها هما نفس الوظيفة المنشورة على أكثر من لوحة واحدة، عمدًا، لكي يكون هناك شيء حقيقي لإزالة تكراره. أنت تحلّل HTML حقيقيًا باستدعاءات BeautifulSoup حقيقية طوال الطريق — الفرق الوحيد عن استخراج موقع حي هو أن `requests.get()` يُستبدَل بقراءة ملف محلي، لذا لا يعتمد الدرس أبدًا على وقت تشغيل موقع خارجي، أو ترميزه، أو تسامحه مع الاستخراج.

:::tip[تحقق دائمًا من robots.txt وشروط الخدمة قبل استخراج أي موقع حقيقي]
لو وسّعت هذا المشروع للإشارة إلى لوحة وظائف حقيقية وحيّة أو أي موقع حقيقي آخر، تحقق أولًا من ملف `robots.txt` الخاص بذلك الموقع (مثل `https://example.com/robots.txt`) وشروط خدمته. يذكر `robots.txt` أي أجزاء من موقع يُسمح ولا يُسمح للأدوات الآلية بجلبها. تذهب لوحات وظائف كثيرة أبعد وتحظر صراحة الاستخراج في شروطها — اقرأ تلك، لا `robots.txt` فقط، لأن موقعًا يمكنه السماح برابط في `robots.txt` بينما لا يزال يحظر الوصول الآلي في شروط خدمته.
:::

## الخطوة 1: حلّل صفحة إعلان واحدة إلى حقول مُهيكَلة

افتح [`board_alpha.html`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/job-aggregator/sample_data/board_alpha.html) في محرر نصوص. يجلس كل إعلان داخل `<div class="job-card">`، بالعنوان في `<h2 class="job-title">`، والشركة في `<span class="company">`، والموقع في `<span class="location">`، ووصف في `<p class="description">`. هذا نفس نمط `find`/`find_all` من استخرج وحلّل موقع ويب حي، فقط مُطبَّق على ملف محلي بدلًا من استجابة حية:

```python
# aggregate.py
from pathlib import Path

from bs4 import BeautifulSoup

html = Path("sample_data/board_alpha.html").read_text(encoding="utf-8")
soup = BeautifulSoup(html, "html.parser")

for card in soup.find_all("div", class_="job-card"):
    title = card.find("h2", class_="job-title").get_text(strip=True)
    company = card.find("span", class_="company").get_text(strip=True)
    location = card.find("span", class_="location").get_text(strip=True)
    description = card.find("p", class_="description").get_text(strip=True)
    print(f"{title} @ {company} ({location})")
```

```bash
uv run python aggregate.py
```

يجب أن ترى أربعة أسطر مطبوعة، واحد لكل إعلان في لوحة Alpha.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يعمل `uv run python aggregate.py` دون أخطاء.</StepChecklistItem>
<StepChecklistItem>يطبع بالضبط 4 أسطر، واحد لكل إعلان في `board_alpha.html`.</StepChecklistItem>
<StepChecklistItem>كل سطر له عنوان حقيقي، وشركة، وموقع — لا `None` أو سلسلة فارغة.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تزيل `.get_text(strip=True)` المسافات البيضاء من بداية/نهاية نص وسم. ماذا يمكن أن يسوء بعد خطوتين من الآن، عندما تقارن العناوين بين اللوحات لإزالة التكرار، لو تركت `strip=True` جانبًا؟
- كل حقل هنا مطلوب من المحلِّل (`card.find(...)` يستدعي `.get_text(...)` فورًا على النتيجة). ماذا يحدث لو كان إعلان في لوحة بتنسيق مختلف يفتقد `<span>` الموقع الخاص به تمامًا؟ أين بالضبط سيفشل ذلك، وكيف ستساعدك رسالة الخطأ في إيجاده؟

## الخطوة 2: حلّل مصادر متعددة وادمجها

يحتوي `board_beta.html` و`board_gamma.html` نفس *نوع* البيانات — عنوان، شركة، موقع، وصف — لكن لا يستخدم أي منهما ترميز Alpha. تسرد Beta الوظائف كعناصر `<li class="listing">` بـ`<a class="position-title">`؛ تسردها Gamma كصفوف جدول `<tr class="job-row">` بخلايا `<td>` بسيطة. لا يوجد مستخرج واحد "مُحدِّد واحد يناسب كل اللوحات" — بدلًا من ذلك، اكتب دالة محلِّل صغيرة واحدة لكل مصدر، كل واحدة تُعيد نفس شكل القاموس بالضبط، لكي لا يحتاج بقية خط الأنابيب أبدًا لمعرفة من أي لوحة جاء إعلان:

```python
# aggregate.py (continued)
def parse_board_alpha(html):
    soup = BeautifulSoup(html, "html.parser")
    listings = []
    for card in soup.find_all("div", class_="job-card"):
        listings.append({
            "title": card.find("h2", class_="job-title").get_text(strip=True),
            "company": card.find("span", class_="company").get_text(strip=True),
            "location": card.find("span", class_="location").get_text(strip=True),
            "description": card.find("p", class_="description").get_text(strip=True),
            "source": "board_alpha",
        })
    return listings


def parse_board_beta(html):
    soup = BeautifulSoup(html, "html.parser")
    listings = []
    for item in soup.find_all("li", class_="listing"):
        listings.append({
            "title": item.find("a", class_="position-title").get_text(strip=True),
            "company": item.find("div", class_="employer").get_text(strip=True),
            "location": item.find("div", class_="loc").get_text(strip=True),
            "description": item.find("div", class_="summary").get_text(strip=True),
            "source": "board_beta",
        })
    return listings


def parse_board_gamma(html):
    soup = BeautifulSoup(html, "html.parser")
    listings = []
    for row in soup.find_all("tr", class_="job-row"):
        cells = row.find_all("td")
        listings.append({
            "title": cells[0].get_text(strip=True),
            "company": cells[1].get_text(strip=True),
            "location": cells[2].get_text(strip=True),
            "description": cells[3].get_text(strip=True),
            "source": "board_gamma",
        })
    return listings


PARSERS = {
    "board_alpha.html": parse_board_alpha,
    "board_beta.html": parse_board_beta,
    "board_gamma.html": parse_board_gamma,
}


def scrape_all_boards():
    all_listings = []
    for filename, parser in PARSERS.items():
        html = (Path("sample_data") / filename).read_text(encoding="utf-8")
        all_listings.extend(parser(html))
    return all_listings


if __name__ == "__main__":
    listings = scrape_all_boards()
    print(f"Parsed {len(listings)} raw listings from {len(PARSERS)} boards")
```

```bash
uv run python aggregate.py
```

يجب أن ترى 10 إعلانات خام في المجموع (4 + 3 + 3) — "خام" لأنه لم تُزَل أي تكرارات بعد.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>تُعيد `scrape_all_boards()` 10 إعلانات.</StepChecklistItem>
<StepChecklistItem>يحمل كل قاموس إعلان نفس المفاتيح الخمسة (`title`، و`company`، و`location`، و`description`، و`source`)، بغض النظر عن أي لوحة جاء منها.</StepChecklistItem>
<StepChecklistItem>يحدد حقل `source` بشكل صحيح أي لوحة جاء منها كل إعلان.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يربط `PARSERS` اسم ملف بدالة. ماذا ستحتاج لإضافته لدعم لوحة رابعة، دون تغيير `scrape_all_boards` على الإطلاق؟
- يصل `parse_board_gamma` إلى `cells[0]`، و`cells[1]`، إلخ بالموضع بدلًا من باسم الفئة، على عكس المحلِّلين الآخرين. ماذا سينكسر بصمت لو أضاف جدول Gamma عمودًا أول جديدًا (لنقل، تاريخ نشر) دون أن تلاحظ؟

## الخطوة 3: أزل تكرار الإعلانات بـpandas

اثنان من الإعلانات العشرة هما نفس الوظيفة بالضبط، منشورة على لوحتين مختلفتين: دور "Senior Python Developer" في Northwind Analytics يظهر على كل من Alpha وBeta، ودور "Data Analyst" في Contoso Retail يظهر على كل من Alpha وGamma. إن تُرِك كما هو، سيُبلِّغ تنبيه لاحق عن نفس الشاغر مرتين. الحل مفتاح إزالة تكرار — شيء مستقر بما يكفي للتعرف على "نفس الوظيفة" عبر المصادر رغم أن صياغة الوصف تختلف قليلًا من لوحة إلى أخرى:

```python
# aggregate.py (continued)
import hashlib
import re

import pandas as pd


def dedupe_key(listing):
    """A stable id for "the same job", independent of which board posted it."""
    normalized = f"{listing['title'].strip().lower()}|{listing['company'].strip().lower()}"
    normalized = re.sub(r"\s+", " ", normalized)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:16]


listings = scrape_all_boards()
for listing in listings:
    listing["dedupe_key"] = dedupe_key(listing)

df = pd.DataFrame(listings)
before = len(df)
df = df.drop_duplicates(subset="dedupe_key", keep="first").reset_index(drop=True)
print(f"Deduped {before} listings -> {len(df)} unique jobs ({before - len(df)} duplicate posting(s) removed)")

df.to_csv("listings.csv", index=False)
```

```bash
uv run python aggregate.py
```

يجب أن ترى "Deduped 10 listings -> 8 unique jobs (2 duplicate posting(s) removed)".

مفتاح إزالة التكرار هنا هو نص `title + company` المُطبَّع، لا تجزئة للصف بأكمله — عمدًا. تجزئة الصف بأكمله (بما في ذلك `description`) ستعامل أوصاف Alpha وBeta المُصاغة قليلًا بشكل مختلف لنفس الوظيفة كوظيفتين *مختلفتين*، مُبطِلة الغرض.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يطبع `aggregate.py` "2 duplicate posting(s) removed".</StepChecklistItem>
<StepChecklistItem>يحتوي `listings.csv` بالضبط 8 صفوف (بالإضافة إلى الترويسة).</StepChecklistItem>
<StepChecklistItem>يظهر صف "Senior Python Developer" الخاص بـNorthwind Analytics وصف "Data Analyst" الخاص بـContoso Retail كل واحد بالضبط مرة واحدة في `listings.csv`.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يحتفظ `drop_duplicates(..., keep="first")` بأي صف يصادف أن يأتي أولًا في DataFrame. لهاتين الوظيفتين المكررتين، نسخة أي لوحة تُحفَظ، وهل يهم أيهما يفوز هنا؟ متى *كان* سيهم؟
- لو صادف أن نشرت شركتان مختلفتان وظيفتين مختلفتين بنفس العنوان بالضبط (مثل شاغرين غير مرتبطين لـ"Data Analyst")، هل سيدمج مفتاح إزالة التكرار هذا بينهما خطأً؟ لماذا أو لماذا لا؟

## الخطوة 4: صفِّ بكلمة مفتاحية ونبّه عن التطابقات الجديدة

الخطوة الأخيرة هي نصف "التنبيه" من المشروع: صفِّ الإعلانات المُزالة التكرار إلى التي تطابق كلمة مفتاحية، ثم تذكّر ما نبّهت عنه بالفعل لكي لا يكرر تشغيل ثانٍ ضد نفس البيانات نفسه:

```python
# filter_alerts.py
import json
from pathlib import Path

import pandas as pd

SEEN_FILE = Path("seen.json")
KEYWORDS = ["python"]


def load_seen():
    if SEEN_FILE.exists():
        return set(json.loads(SEEN_FILE.read_text(encoding="utf-8")))
    return set()


def save_seen(dedupe_keys):
    SEEN_FILE.write_text(json.dumps(sorted(dedupe_keys)), encoding="utf-8")


def keyword_filter(df, keywords):
    pattern = "|".join(keywords)
    text = df["title"].str.cat(df["description"], sep=" ")
    return df[text.str.contains(pattern, case=False, regex=True, na=False)]


if __name__ == "__main__":
    df = pd.read_csv("listings.csv")
    matches = keyword_filter(df, KEYWORDS)
    print(f"{len(matches)} unique listing(s) match keywords {KEYWORDS}")

    seen = load_seen()
    new_matches = matches[~matches["dedupe_key"].isin(seen)]

    if new_matches.empty:
        print("No new matches since the last run.")
    else:
        print(f"\n{len(new_matches)} NEW match(es):\n")
        for _, row in new_matches.iterrows():
            print(f"- {row['title']} @ {row['company']} ({row['location']}) [{row['source']}]")
        new_matches.to_csv("new_matches.csv", index=False)

    save_seen(seen | set(matches["dedupe_key"]))
```

```bash
uv run python filter_alerts.py
```

يجب أن يُبلِّغ التشغيل الأول عن 6 تطابقات جديدة (كل إعلان يذكر عنوانه أو وصفه "python"). شغّله مجددًا دون تغيير أي شيء، ويجب أن يُبلِّغ عن صفر تطابقات جديدة — يتذكر `seen.json` ما نبّه عنه بالفعل، تمامًا كما سيحتاجه مُجمِّع مجدوَل حقيقي يتحقق كل صباح.

:::tip[مرشِّح كلمة مفتاحية هو فقط النسخة الأبسط من "طابق ما يهمني"]
`str.contains` بنمط مربوط بـ`|` هو عمدًا أبسط مرشِّح ممكن — جيد بما يكفي لإثبات أن منطق التنبيه يعمل. قد تطابق نسخة أكثر واقعية عدة *مجموعات* من الكلمات المفتاحية (مثل "python" أو "django" لأدوار الواجهة الخلفية، و"remote" كمرشِّح مطلوب منفصل على `location`)، أو تسجل تطابقًا بحسب عدد الكلمات المفتاحية التي أصابت بدلًا من معاملته كنجاح/فشل. اجعل النسخة البسيطة تعمل أولًا؛ منطق المطابقة هو الجزء الأسهل لاستبداله لاحقًا.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يُبلِّغ التشغيل الأول لـ`filter_alerts.py` عن 6 تطابقات جديدة وينشئ `new_matches.csv`.</StepChecklistItem>
<StepChecklistItem>يُبلِّغ تشغيل ثانٍ، بلا تغييرات على `listings.csv`، عن "No new matches since the last run."</StepChecklistItem>
<StepChecklistItem>حذف `seen.json` والتشغيل مجددًا يُعيد كل التطابقات الستة كـ"جديدة."</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لو كان `description` إعلان مفقودًا (`NaN` بعد `pd.read_csv`)، ماذا سيفعل `text.str.contains(..., na=False)` بذلك الصف، ولماذا يهم `na=False` هنا تحديدًا؟
- يُخزَّن `seen` كقائمة JSON من مفاتيح إزالة التكرار، مُحمَّلة طازجة من القرص في كل تشغيل. ماذا سيحدث لضمان "بلا تنبيهات مكررة" لو عملت نسختان من هذا السكربت في آنٍ واحد وقرأتا كلتاهما `seen.json` قبل أن تحصل أي منهما على فرصة لإعادة كتابته؟

## ⚠️ مآزق شائعة

- **كتابة محلِّل عام واحد بدلًا من واحد لكل مصدر.** من المُغري تجربة مجموعة واحدة من المُحدِّدات "تعمل غالبًا" عبر اللوحات. لن تعمل — لا تشترك Alpha وBeta وGamma في اسم فئة واحد. دالة صغيرة واحدة لكل مصدر، كلها تُعيد نفس شكل القاموس، أقل كودًا إجمالًا من محاربة مُحدِّد "مقاس واحد يناسب الجميع".
- **إزالة التكرار بالمفتاح الخاطئ.** تجزئة الإعلان بأكمله (بما في ذلك `description`) تعني أن منشورين لنفس الوظيفة بصياغة مختلفة قليلًا لا يتطابقان أبدًا، مُبطِلة الغرض من إزالة التكرار على الإطلاق. اختر مفتاحًا مستقرًا عبر *كيفية* وصف وظيفة، لا فقط *ما إذا* كانت متطابقة كلمة بكلمة.
- **فقدان حالة "جديد منذ آخر تشغيل" بين التشغيلات.** بدون شيء مثل `seen.json` محفوظ على القرص، يُعيد كل تشغيل الإبلاغ عن كل تطابق كجديد، وهو بالضبط السلوك المزعج الذي يجب أن يتجنبه تنبيه حقيقي. هذا أيضًا أول مكان تختلف فيه مهمة cron حقيقية أو عملية خلفية عن سكربت لمرة واحدة: يجب أن تنجو الحالة بين الاستدعاءات، لا أن تعيش في متغيّر فقط.
- **نسيان `na=False` في مرشِّح سلسلة pandas.** يرفع `Series.str.contains` على عمود بأي قيم مفقودة استثناءً أو ينتج نتائج `NaN` بدونه، والذي يمكن أن يُسقِط بصمت صفوفًا من قناع بولي بطرق يسهل تفويتها.

## ما بنيته للتو

خط أنابيب كامل من تحليل ← دمج ← إزالة تكرار ← تصفية ← تنبيه: تحليل HTML حقيقي عبر مصادر متعددة مُبنيَّة بشكل مختلف، واستراتيجية إزالة تكرار تنجو من صياغة شبه مكررة، وتنبيه كلمة مفتاحية يتذكر ما أخبرك به بالفعل. وجّه نفس الخطوات الأربع إلى مجموعة مختلفة من المصادر الصديقة للاستخراج (بعد التحقق من `robots.txt` الخاص بها وشروط الخدمة) ولن يتغير خط الأنابيب — فقط دوال المحلِّل الخاصة بكل مصدر تتغير.

## إلى أين تذهب من هنا

- اربط إشعارًا حقيقيًا بدلًا من الطباعة إلى الطرفية — `smtplib` لبريد إلكتروني، أو webhook `POST` إلى قناة Discord أو Slack، يُطلَق فقط لـ`new_matches`.
- جدوِل خط الأنابيب بأكمله ليعمل دوريًا (مهمة cron، أو GitHub Actions على جدول، أو حلقة بسيطة بـ`time.sleep()`) لكي يتحقق من إعلانات جديدة بنفسه بدلًا من يدويًا.
- سجّل التطابقات بدلًا من معاملة مرشِّح الكلمة المفتاحية كنجاح/فشل — مثل عدّ كم من عدة مجموعات كلمات مفتاحية يصيبها إعلان، وترتيب `new_matches` بذلك التقييم قبل التنبيه.
- استبدل ملفات CSV/JSON بقاعدة بيانات SQLite صغيرة (وحدة `sqlite3` المدمجة في Python) بمجرد أن تتتبع تاريخًا كافيًا لترغب في الاستعلام عنه — مثل "كم إعلان Python جديد ظهر كل أسبوع هذا الشهر؟"

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

<ProjectProgressCheckbox projectId="2027-job-aggregator" />
