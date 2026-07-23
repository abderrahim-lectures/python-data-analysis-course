---
id: scrape-analyze
title: "استخلاص وتحليل موقع ويب حي"
sidebar_label: "استخلاص وتحليل موقع ويب"
slug: /projects/scrape-analyze
description: "تخرّج من بيئة البرمجة في المتصفح إلى Python فعلي: استخلص موقع ويب حقيقيًا، نظّف البيانات بـ pandas، وأنتج رسومك البيانية الخاصة — دون الحاجة لأي مفتاح API."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 استخلاص وتحليل موقع ويب حي

<ProjectPublishedDate projectId="scrape-analyze" />

<ProjectGreeting />

كل مجموعة بيانات في قسم تحليل البيانات حتى الآن وصلت كملف CSV جاهز، موجود بالفعل في `static/datasets/`، ينتظر تحميله بـ `pd.read_csv`. التحليل الحقيقي نادرًا ما يبدأ من هناك — عادةً عليك الذهاب لجلب البيانات بنفسك. هذا المشروع هو تلك الخطوة: اجلب صفحة ويب حقيقية وحية عبر HTTP، حلّل HTML إلى صفوف مُهيكلة، نظّف النتيجة بـ pandas، وأنتج تحليلك الصغير الخاص برسوم بيانية. يفترض هذا ارتياحًا بـ pandas على مستوى المسار العادي من تحليل البيانات — التحديد، التصفية، `groupby`، التنظيف الأساسي — نفس المهارات التي استخدمتها بالفعل لإعادة إنتاج دفتر ملاحظات تحليل استكشافي موجَّه. يطلب منك هذا المشروع توجيه تلك المهارات نفسها نحو بيانات لم يسلّمها لك أحد.

هذا اختياري وغير مُقيَّم. راجع [مشاريع من العالم الحقيقي](/docs/projects) للاطلاع على القائمة الكاملة، والتي تنمو باستمرار.

## 🎯 ما ستفعله

1. تثبيت `uv` وإعداد مشروع محلي.
2. جلب صفحة ويب حقيقية بـ `requests` وتحليل HTML الخاص بها بـ `beautifulsoup4`.
3. متابعة روابط ترقيم الصفحات (pagination) لجمع بيانات موقع كامل في ملف CSV.
4. تحميل ذلك الملف إلى pandas وتنظيفه — تقسيم عمود نصي مُعبَّأ، فحص الفراغات وأنواع البيانات.
5. تحليل البيانات المنظَّفة وإنتاج بضعة رسوم بيانية صادقة ومُصنَّفة بشكل صحيح بـ `matplotlib`.

## أين تشغّل هذا

**محليًا بـ `uv`** هو المسار الذي تتبعه خطوات هذا الدرس، والمسار الموصى به — إنه Python حقيقية تعمل على جهازك الخاص، نفس حركة "التخرّج إلى Python حقيقية" كما في كل مشروع آخر في هذا القسم. الخطوة 1 أدناه تشرح كيفية تثبيتها.

**GitHub Codespaces** بديل بلا إعداد إن كنت تفضّل عدم تثبيت أي شيء محليًا الآن: افتح [مستودع الدورة كاملاً في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython وuv مثبّتون مسبقًا، وفق ملف `.devcontainer/devcontainer.json` الخاص بالمستودع) وشغّل نفس أوامر `uv` تمامًا من طرفية داخل تبويب المتصفح.

**Google Colab أو Kaggle Notebooks** خيار جيد فعلاً لهذا المشروع بالذات، لا مجرد بديل احتياطي — لا يوجد خادم ملفات محلي، ولا وحدة معالجة رسومية، ولا عملية طويلة الأمد تحتاج إدارتها، وناتج الرسوم البيانية المضمَّن هو بالضبط ما يبرع فيه دفتر الملاحظات. شغّل `!pip install requests beautifulsoup4 pandas matplotlib` في خلية، ثم الصق السكربتات أدناه كخلايا دفتر، مع تعديل مسارات الملفات (مثلًا حفظ `quotes.csv` في دليل عمل الدفتر بدلاً من جهازك الخاص) حسب الحاجة. هذه طريقة مريحة ومشروعة لإنجاز هذا المشروع من البداية للنهاية دون مغادرة المتصفح.

## الخطوة 1: تثبيت `uv`

`uv` أداة واحدة تحل محل سلسلة "ثبّت Python، ثم ثبّت pip، ثم ثبّت أداة بيئة افتراضية، ثم ثبّت الحزم" المعتادة — تستطيع تثبيت وإدارة إصدارات Python بنفسها، إلى جانب اعتماديات مشروعك.

**macOS / Linux** (الطرفية):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

أغلق طرفيتك وأعد فتحها، ثم تأكد من التثبيت:

```bash
uv --version
```

ثم أعدّ مشروعًا محليًا:

```bash
uv init scrape-analyze
cd scrape-analyze
uv add requests beautifulsoup4 pandas matplotlib
```

لاحظ ما هو مفقود من تلك القائمة: لا مفتاح API، لا تسجيل لمستوى مجاني، لا شيء تُعِدّه قبل أن تستطيع تشغيل سطر واحد من الكود — فقط سكربتك الخاص وموقع ويب حقيقي. هذا تباين متعمد مع مشاريع هذا القسم ذات النكهة المتعلقة بالذكاء الاصطناعي، وأحد أسباب كون الاستخلاص خطوة تالية جيدة للتجربة.

## الخطوة 2: اجلب الصفحة وحلّلها

يستهدف هذا المشروع [quotes.toscrape.com](https://quotes.toscrape.com) — موقع عام بُني ويُصان خصيصًا لممارسة الاستخلاص. لا يحتوي حاجز تسجيل دخول، ولا حد معدل تكافحه، وتخطيط HTML مستقر ومُهيكل جيدًا، وترقيم صفحات ووسوم وصفحات مؤلفين للعمل معها. هذا مهم: استخلاص موقع تجاري حقيقي يثير أسئلة حقيقية بشأن شروط خدمته وملف `robots.txt` الخاص به، وهو ما يتجاوزه هذا الدرس عمدًا باستخدام موقع بُني لهذا الغرض بالضبط.

:::tip[تحقق دائمًا من robots.txt قبل استخلاص أي مكان آخر]
قبل توجيه هذا الكود إلى أي موقع غير quotes.toscrape.com، تحقق من ملف `robots.txt` الخاص بذلك الموقع (مثلًا `https://example.com/robots.txt`) وشروط خدمته. يحدد `robots.txt` أي أجزاء من الموقع يُسمح، ولا يُسمح، للأدوات الآلية بجلبها — احترامه هو الحد الأدنى المتوقَّع لأي أداة استخلاص، وبعض المواقع تمنع الاستخلاص صراحة في شروطها حتى حين يصمت `robots.txt` عن ذلك.
:::

طلب `GET` عبر HTTP هو نفس ما يفعله متصفحك في كل مرة تزور فيها صفحة — يطلب من خادم عنوان URL ويسترجع HTML الخام كنص. تفعل `requests` هذا في سطر واحد:

```python
import requests

response = requests.get("https://quotes.toscrape.com/")
response.raise_for_status()  # turns a 404/500 into a loud exception instead of a silent bad parse
html = response.text
```

تلك السلسلة النصية `html` هي شجرة من وسوم متداخلة — `<div>`، `<span>`، `<a>` — كل واحدة تحمل اختياريًا سمات مثل `class` أو `href`. تحلّل BeautifulSoup ذلك النص إلى شجرة قابلة للتصفح وتمنحك أداتين رئيسيتين للبحث فيها: `find` (أول تطابق) و`find_all` (كل تطابق)، وكلتاهما قابلة للتصفية حسب اسم الوسم وحسب سمات مثل `class_`. افتح HTML الخاص بالصفحة عبر "عرض مصدر الصفحة" (View Page Source) في متصفحك وسترى أن كل اقتباس يقع داخل `<div class="quote">`، مع نص الاقتباس في `<span class="text">`، والمؤلف في `<small class="author">`، وكل وسم في `<a class="tag">`.

```python
# scrape.py
import time

import requests
from bs4 import BeautifulSoup

response = requests.get("https://quotes.toscrape.com/")
response.raise_for_status()
soup = BeautifulSoup(response.text, "html.parser")

for quote_div in soup.find_all("div", class_="quote"):
    text = quote_div.find("span", class_="text").get_text(strip=True)
    author = quote_div.find("small", class_="author").get_text(strip=True)
    tags = [tag.get_text(strip=True) for tag in quote_div.find_all("a", class_="tag")]
    print(f"{author}: {text} {tags}")

time.sleep(1)  # see the tip below
```

```bash
uv run python scrape.py
```

يجب أن ترى عشرة أسطر مطبوعة، سطرًا واحدًا لكل اقتباس في الصفحة الرئيسية.

:::tip[قيّد نفسك بمعدل، حتى على موقع تدريبي]
`time.sleep(1)` بين الطلبات ليس مطلوبًا بصرامة من quotes.toscrape.com، لكنه عادة تستحق البناء الآن بدلاً من بعد أن تُغرق خادمًا حقيقيًا بغير قصد بعشرات الطلبات في الثانية. تأخير قصير ومتعمد بين الطلبات هو آداب استخلاص معيارية — يمنع سكربتك من أن يبدو (أو يتصرف) كمحاولة حجب خدمة، وهو تأمين رخيص ضد حجب عنوان IP الخاص بك مؤقتًا على المواقع التي تفرض حدودًا فعلاً.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يعمل `uv run python scrape.py` دون أخطاء.</StepChecklistItem>
<StepChecklistItem>يطبع 10 أسطر بالضبط، سطرًا واحدًا لكل اقتباس في الصفحة الرئيسية.</StepChecklistItem>
<StepChecklistItem>كل سطر مطبوع يحتوي نصًا حقيقيًا، واسم مؤلف حقيقيًا، وقائمة وسوم غير فارغة — لا `None` أو سلاسل فارغة.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي**

- تُعيد كل من `.get_text(strip=True)` و`.text` محتوى نص الوسم، لكن واحدة منهما فقط تُزيل الفراغات البادئة/الزائدة. ماذا سينكسر لاحقًا في هذا المشروع — تحديدًا في خطوة التنظيف بالخطوة 4 — لو استخدمت `.text` في كل مكان بدلاً من ذلك؟
- نص الاقتباس في الصفحة محاط بعلامات اقتباس مقوَّسة (`"…"`)، لا مستقيمة. إن كنت تقارن نص الاقتباس بسلسلة نصية مُثبَّتة لاحقًا، ماذا قد يخطئ، وكيف قد تلاحظ ذلك؟

## الخطوة 3: تعامل مع ترقيم الصفحات واجمع كل البيانات

يوزّع quotes.toscrape.com اقتباساته عبر عدة صفحات، مع رابط "التالي" في أسفل كل صفحة عدا الأخيرة. بدلاً من تثبيت "كرر 10 مرات"، اتبع الرابط نفسه — بذلك يستمر السكربت بالعمل حتى لو تغيّر عدد الصفحات:

```python
# scrape.py (continued)
import csv

BASE_URL = "https://quotes.toscrape.com"


def parse_quotes(soup):
    """Extracts {"text", "author", "tags"} for every quote on one parsed page."""
    quotes = []
    for quote_div in soup.find_all("div", class_="quote"):
        text = quote_div.find("span", class_="text").get_text(strip=True)
        author = quote_div.find("small", class_="author").get_text(strip=True)
        tags = [t.get_text(strip=True) for t in quote_div.find_all("a", class_="tag")]
        quotes.append({"text": text, "author": author, "tags": ", ".join(tags)})
    return quotes


def scrape_all_quotes():
    all_quotes = []
    url = f"{BASE_URL}/"

    while url is not None:
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
        except requests.RequestException as exc:
            # One failed request shouldn't kill a scrape that already collected
            # data from several pages -- log it and stop cleanly instead of crashing.
            print(f"Failed to fetch {url}: {exc}. Stopping here.")
            break

        soup = BeautifulSoup(response.text, "html.parser")
        all_quotes.extend(parse_quotes(soup))

        next_li = soup.find("li", class_="next")
        url = requests.compat.urljoin(url, next_li.find("a")["href"]) if next_li else None
        if url is not None:
            time.sleep(1)

    return all_quotes


if __name__ == "__main__":
    quotes = scrape_all_quotes()
    with open("quotes.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["text", "author", "tags"])
        writer.writeheader()
        writer.writerows(quotes)
    print(f"Saved {len(quotes)} quotes to quotes.csv")
```

```bash
uv run python scrape.py
```

`try`/`except` حول الطلب هو الإضافة المهمة هنا، لا شكليات: بدونها، طلب واحد غير مستقر في الصفحة 7 من 10 كان سيرمي استثناءً غير مُعالَج ويفقد الصفحات الست المجلوبة بالفعل، بدلاً من حفظ ما لديك والتوقف بسلاسة. تحوّل `requests.compat.urljoin` رابط "التالي" النسبي (`href` مثل `/page/2/`) إلى عنوان URL كامل بدمجه مع عنوان الصفحة الحالية — نفس ما يفعله متصفحك تلقائيًا عندما تنقر رابطًا نسبيًا.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>ينتهي `uv run python scrape.py` ويطبع سطر "Saved N quotes".</StepChecklistItem>
<StepChecklistItem>موجود ملف `quotes.csv` ويحتوي أكثر من 10 صفوف (أي أنه تابع ترقيم الصفحات فعلاً، لا الصفحة الرئيسية فقط).</StepChecklistItem>
<StepChecklistItem>فتح `quotes.csv` في محرر نصوص يُظهر ثلاثة أعمدة — `text` و`author` و`tags` — دون صفوف مكسورة/فارغة واضحة.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي**

- ماذا سيحدث لأداة الاستخلاص لديك لو أضاف الموقع حقلًا عاشرًا لكل اقتباس — لنقل، سنة نشر؟ كيف قد تلاحظ ذلك، وكيف قد تكيّف `parse_quotes` لالتقاطه؟
- تتوقف الحلقة عندما تُعيد `find("li", class_="next")` القيمة `None`. ماذا سيحدث لو ظلت الصفحة الأخيرة للموقع تحتوي رابط "التالي" (بمظهر معطَّل) في HTML الخاص بها، لكن غير قابل للنقر فقط؟ كيف قد تتحقق من ذلك قبل الوثوق بشرط التوقف هذا على موقع مختلف؟

## الخطوة 4: نظّف البيانات وحمّلها إلى pandas

قدّم قسم تحليل البيانات pandas كحل لبطء حلقات Python العادية مع نمو البيانات — عمليات مُتَّجهة (vectorized) بلغة C بدلاً من حلقة `for` بلغة Python فوق كل صف. تضيف البيانات المُستخلَصة سببًا ثانيًا، حقيقيًا بنفس القدر، للجوء إليها: نادرًا ما تصل نظيفة، وتجعل أدوات pandas للتعامل مع النصوص وفحص الأنواع تنظيفها سريع الكتابة وسهل التحقق.

```python
# analyze.py
import pandas as pd

df = pd.read_csv("quotes.csv")

# tags was saved as a single "tag1, tag2, tag3" string -- split it into a real
# list column so each tag can be counted separately.
df["tags"] = df["tags"].fillna("").apply(
    lambda raw: [tag.strip() for tag in raw.split(",") if tag.strip()]
)

# Whitespace and dtype sanity checks -- cheap to do, easy to skip, and the kind
# of thing that silently breaks a groupby later if left unchecked.
df["text"] = df["text"].str.strip()
df["author"] = df["author"].str.strip()
assert df["text"].notna().all(), "some quotes have no text -- check the scrape"

df["quote_length"] = df["text"].str.len()
print(df.head())
print(df.dtypes)
```

شيئان يستحقان الملاحظة هنا. أولًا، `tags` مُخزَّن في CSV كسلسلة نصية واحدة مفصولة بفواصل لأن خلايا CSV لا يمكنها الاحتفاظ بقائمة Python حقيقية — إعادة بناء القائمة عند التحميل، بـ `.apply`، هو النمط المعياري لأي عمود "مُعبَّأ" كهذا. ثانيًا، حساب `df["text"].str.len()` لطول كل اقتباس في استدعاء مُتَّجه واحد، بدلاً من حلقة Python تستدعي `len()` صفًا بصف، هو بالضبط حجة السرعة من قسم تحليل البيانات — فقط مُطبَّقة على بيانات جلبتها بنفسك بدلاً من ملف CSV جاهز.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يحتوي `df["tags"]` قوائم Python حقيقية بعد استدعاء `.apply`، لا سلاسل نصية — تحقق بـ `type(df["tags"].iloc[0])`.</StepChecklistItem>
<StepChecklistItem>`df["quote_length"]` عمود رقمي دون قيم مفقودة.</StepChecklistItem>
<StepChecklistItem>يُظهر `df.head()` نصًا نظيفًا دون فراغات بادئة/زائدة شاردة.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي**

- لو كانت خلية `tags` لصف واحد فارغة (اقتباس بلا وسوم)، ماذا سيُعيد `raw.split(",")`، وهل يتعامل مُرشِّح `if tag.strip()` في تعبير القائمة مع هذه الحالة بشكل صحيح؟ اختبر ذلك.
- لماذا تُحسَب `quote_length` من `text` بعد إزالة الفراغات لا قبلها؟ أي رقم سيكون خاطئًا لو حسبتها قبل ذلك؟

## الخطوة 5: حلّل وصوِّر

بأعمدة نظيفة ومُنمَّطة، التحليل الفعلي هو بضعة أسطر من `groupby`/`value_counts`، تمامًا كدفاتر الملاحظات الموجَّهة في قسم تحليل البيانات — الفرق أن هذه البيانات جاءت من أداة استخلاصك الخاصة، لا ملف جاهز.

**الوسوم الأكثر شيوعًا** — يحوّل `explode` عمود قائمة الوسوم إلى صف واحد لكل وسم، حتى يستطيع `value_counts` عدّها فرديًا:

```python
import matplotlib.pyplot as plt

exploded = df.explode("tags")
exploded = exploded[exploded["tags"] != ""]
tag_counts = exploded["tags"].value_counts().head(10)

fig, ax = plt.subplots(figsize=(8, 5))
tag_counts.sort_values().plot(kind="barh", ax=ax, color="#3b82f6")
ax.set_xlabel("Number of quotes")
ax.set_ylabel("Tag")
ax.set_title("Top 10 tags on quotes.toscrape.com")
ax.set_xlim(left=0)  # bar charts should start at 0 -- Data Analysis Hard Week 9's chart-honesty rule
fig.tight_layout()
fig.savefig("top_tags.png")
```

**المؤلفون الأكثر اقتباسًا:**

```python
most_quoted = df["author"].value_counts().head(5)
print(most_quoted)
```

**توزيع طول الاقتباسات** — رسم بياني تكراري (histogram)، لرؤية شكل البيانات لا مجرد متوسط واحد:

```python
fig, ax = plt.subplots(figsize=(8, 5))
ax.hist(df["quote_length"], bins=20, color="#3b82f6", edgecolor="white")
ax.set_xlabel("Quote length (characters)")
ax.set_ylabel("Number of quotes")
ax.set_title("Distribution of quote lengths")
fig.tight_layout()
fig.savefig("quote_length_dist.png")
```

يتبع كلا الرسمين نفس قواعد الصدق من الأسبوع 9 من مسار تحليل البيانات الصعب: المحاور مُصنَّفة، ومحور x للرسم الشريطي يبدأ من 0 بدلاً من أن يُقطَع لتضخيم فروقات صغيرة، والعناوين تقول بالضبط ما يُحسَب بدلاً من تركه للتخمين.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>موجود كل من `top_tags.png` و`quote_length_dist.png` ويُفتحان كصورتين حقيقيتين.</StepChecklistItem>
<StepChecklistItem>محور x للرسم الشريطي يبدأ من 0.</StepChecklistItem>
<StepChecklistItem>لكلا الرسمين عنوان ومحاور مُصنَّفة — لا أرقام مجردة دون وحدات.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي**

- لو ضبطت `ax.set_xlim(left=5)` بدلاً من `0` للرسم الشريطي، كيف سيتغيّر الفرق *البصري* بين أعلى وسم والوسم العاشر، رغم أن الأعداد الفعلية لم تتغيّر إطلاقًا؟
- يستخدم الرسم التكراري `bins=20`. جرّب `bins=5` و`bins=50` على نفس البيانات. هل يبدو شكل التوزيع مختلفًا بشكل ملموس حسب عدد الصناديق (bins) — وإن كان كذلك، ماذا يخبرك ذلك عن مدى تأثير *معاملات* الرسم التكراري، لا بياناته فقط، في القصة التي يرويها؟

## ⚠️ أخطاء شائعة

- **الاستخلاص بسرعة زائدة والتعرض لتقييد المعدل أو الحظر.** حتى موقع صديق للتدريب قد يبطئ أو يرفض طلبات تُطلَق دون تأخير بينها. استدعاءات `time.sleep()` في الخطوتين 2-3 ليست زخرفية — أزلها وستصبح أكثر عرضة لرؤية أخطاء اتصال أو صفحات مفقودة، خصوصًا على موقع حقيقي (غير تدريبي).
- **تغيّر بنية HTML وكسر مُحدِّداتك.** يعمل `find("div", class_="quote")` فقط لأن هذا هو اسم الفئة *الحالي* على quotes.toscrape.com. تغيّر المواقع تنسيقها (markup) بمرور الوقت (إعادة تصميم، اختبار A/B، إطار عمل CSS جديد)؛ أداة استخلاص كانت تعمل بالأمس قد تتوقف بصمت عن إيجاد أي شيء اليوم. إن أعاد استخلاص ما نتائج صفرية، تحقق من HTML الصفحة الحية قبل افتراض أن المشكلة في كودك.
- **نسيان `try`/`except` حول استدعاءات الشبكة.** طلب واحد غير مستقر أو مهلة زمنية منتهية، في الصفحة 7 من 10، دون `try`/`except`، يرمي استثناءً غير مُعالَج ويفقد كل ما جُمِع بالفعل. نسخة الخطوة 3 تلتقط `requests.RequestException` وتحفظ ما لديها بدلاً من ذلك.
- **الخلط بين `.text` و`.get_text(strip=True)`.** تُعيد خاصية `.text` في BeautifulSoup محتوى نص الوسم كما هو، متضمنًا أي فراغات محيطة من مسافات بادئة HTML الخاصة؛ بينما تُزيلها `.get_text(strip=True)`. تخطي `strip=True` مصدر شائع لمقارنات نصية وتجميعات معطوبة بصمت لاحقًا — اسمَا مؤلف "متطابقان" لا يتطابقان لأن أحدهما يحمل فراغًا زائدًا.

## ما بنيته للتو

أنبوب (pipeline) كامل وصادق من جلب ← تحليل ← تنظيف ← تحليل ← تصوير، يعمل ضد موقع ويب حي وحقيقي بدلاً من ملف أعدّه لك شخص آخر. لم يُبسَّط شيء هنا إلى لعبة لا تعمم: استبدل بموقع مختلف صديق للاستخلاص، وتبقى نفس الخطوات الخمس — اطلب الصفحة، حلّل HTML، تابع ترقيم الصفحات، نظّف النتيجة بـ pandas، ارسمها بيانيًا — هي الأنبوب بأكمله.

## إلى أين من هنا

- جرّب استخلاص موقع مختلف، بعد قراءة `robots.txt` وشروط خدمته فعليًا أولًا — بنية الوسوم/المؤلف هنا قالب معقول، لكن HTML كل موقع مختلف، لذا ستحتاج فحص تنسيقه بنفسك بدلاً من إعادة استخدام هذه المُحدِّدات بالضبط.
- استبدل CSV بقاعدة بيانات **SQLite** صغيرة (لا تحتاج وحدة `sqlite3` المدمجة في Python أي تثبيت منفصل) — خيار أفضل بمجرد أن تكبر مجموعة بيانات عما يسع بارتياح في ملف CSV واحد، أو إن أردت الاستعلام عنها بـ SQL بدلاً من pandas.
- جدوِل أداة الاستخلاص لتعمل دوريًا (مهمة cron، أو حلقة بسيطة بـ `time.sleep()` طويل) وأضف نتائج كل تشغيل بعمود طابع زمني، حتى تستطيع تتبع كيفية تغيّر البيانات بمرور الوقت — نادرًا ما تبقى مجموعة بيانات حقيقية كهذه ثابتة للأبد.

## شارك مشروعك مع الصف

بنيت شيئًا تفتخر به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع أرسلها طلاب آخرون — وملف README الخاص به يحتوي شرحًا كاملاً وودودًا للمبتدئين لإضافة مشروعك عبر **طلب سحب (pull request)**، حتى لو لم تستخدم git من قبل: عمل fork للمستودع، إنشاء فرع، تثبيت ملفاتك، وفتح طلب السحب، خطوة بخطوة. لا يُفترض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓

<ProjectProgressCheckbox projectId="scrape-analyze" />
