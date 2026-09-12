---
title: "استخلاص وتحليل موقع ويب حي"
description: "استخلص بيانات ويب حقيقية، نظّفها بـ pandas، وأنتج رسومًا بيانية ، دون الحاجة لأي مفتاح API."
difficulty: "intermediate"
estimatedMinutes: 60
xpReward: 50
tags: ["Web Scraping", "pandas", "matplotlib", "data-analysis"]
prerequisites: ["أساسيات Python", "أساسيات pandas", "أساسيات matplotlib"]
---

# استخلاص وتحليل موقع ويب حي

كل مجموعة بيانات حتى الآن وصلت كملف CSV جاهز. التحليل الحقيقي نادرًا ما يبدأ من هناك. يعلّمك هذا المشروع جلب صفحة ويب حية عبر HTTP، وتحليل HTML إلى صفوف مُهيكلة، وتنظيف النتيجة بـ pandas، وإنتاج رسوم بيانية ، لا مفتاح API، لا خدمة خارجية، فقط سكربتك وخادم.

- **شغّله في المتصفح.** هناك دفتر ملاحظات تفاعلي جاهز ، افتحه على Colab أو Kaggle أو Binder وتابع خطوة بخطوة.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/scrape-analyze/notebook.ar.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/scrape-analyze/notebook.ar.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fscrape-analyze%2Fnotebook.ar.ipynb)

## ما ستتعلمه

1. جلب صفحات الويب بـ `requests`
2. تحليل HTML بـ `BeautifulSoup`
3. التعامل مع ترقيم الصفحات عبر عدة صفحات
4. تنظيف البيانات المُستخلَصة بـ `pandas`
5. إنشاء تصورات من بيانات حقيقية
6. التعامل مع تحديات الاستخلاص الشائعة (الترميز، حدود المعدل، المُحدِّدات المكسورة)

## ما ستبنيه

أداة استخلاص (scraper) تقوم بـ:

- جلب صفحة ويب حقيقية عبر HTTP
- تحليل جداول وقوائم HTML إلى بيانات مُهيكلة
- متابعة روابط "التالي" لجمع كل الصفحات
- تنظيف البيانات وتحويلها بـ pandas
- توليد رسوم بيانية وإحصاءات موجزة
- تصدير النتائج إلى CSV

## الإعداد

### ثبّت `uv`

تُدير `uv` إصدارات Python واعتماديات المشروع في أداة واحدة.

**macOS / Linux:**

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows (PowerShell):**

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

أغلق طرفيتك وأعد فتحها، ثم تأكد:

```bash
uv --version
```

### أنشئ المشروع

```bash
uv init scrape-analyze
cd scrape-analyze
uv add requests beautifulsoup4 pandas matplotlib
```

لا مفتاح API. لا تسجيل لمستوى مجاني. فقط سكربتك وموقع ويب حقيقي.

---

## الخطوة 1: اجلب صفحة ويب

### الهدف

أرسل طلب HTTP إلى موقع ويب حي واستقبل محتوى HTML الخام الخاص به.

### المفهوم

طلب `GET` عبر HTTP هو نفس ما يفعله متصفحك في كل مرة تزور فيها صفحة ، يطلب من خادم عنوان URL ويسترجع HTML الخام كنص. تجعل مكتبة `requests` هذا مباشرًا في Python. نستهدف [quotes.toscrape.com](https://quotes.toscrape.com)، موقعًا بُني خصيصًا لممارسة الاستخلاص: لا حاجز تسجيل دخول، لا حد معدل، وبنية HTML مستقرة.

:::tip[تحقق دائمًا من robots.txt قبل الاستخلاص من أي مكان آخر]
قبل توجيه هذا الكود إلى أي موقع غير quotes.toscrape.com، تحقق من ملف `robots.txt` الخاص بذلك الموقع (مثلًا `https://example.com/robots.txt`) وشروط خدمته. احترام `robots.txt` هو الحد الأدنى المتوقَّع لأي أداة استخلاص.
:::

### تلميح البداية

ينفّذ `requests.get(url)` طلب HTTP. استدعِ `.raise_for_status()` فورًا بعده لتحويل رمز 404 أو 500 إلى استثناء صاخب بدلاً من السماح لمحتوى مكسور بالتدفق بصمت إلى المحلّل.

### الكود العملي

```python
# scrape.py
import requests

response = requests.get("https://quotes.toscrape.com/")
response.raise_for_status()  # turns a 404/500 into a loud exception
html = response.text

print(f"Fetched {len(html)} characters")
print(html[:100])
```

شغّله:

```bash
uv run python scrape.py
```

### الناتج المتوقع

```
Fetched 12345 characters
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
```

يختلف عدد الأحرف الدقيق، لكن يجب أن يكون `html` سلسلة نصية طويلة تبدأ بـ `<!DOCTYPE html>`.

### استكشاف الأخطاء وإصلاحها

| المشكلة | الحل |
|---|---|
| `ConnectionError` | أنت دون اتصال أو العنوان خاطئ. تحقق من إنترنتك ومن إملاء العنوان. |
| `HTTPError 404` | مسار العنوان خاطئ ، استخدم بالضبط `https://quotes.toscrape.com/` |
| `HTTPError 403` | بعض المواقع تحجب الطلبات التي لا تحمل ترويسة User-Agent لمتصفح. أضف واحدة: `requests.get(url, headers={"User-Agent": "Mozilla/5.0"})` |

### قائمة التحقق

- [ ] يعمل `uv run python scrape.py` دون أخطاء
- [ ] يُظهر الناتج عدد أحرف في الآلاف
- [ ] أول 100 حرف تبدأ بـ `<!DOCTYPE html>`

### سؤال سقراطي

ماذا يحدث لو تخطيت `raise_for_status()` وأعاد الخادم 404؟ كيف سيظهر الخطأ لاحقًا في أنبوبك، ولماذا يصعّب ذلك التصحيح؟

---

## الخطوة 2: حلّل محتوى HTML

### الهدف

حوّل نص HTML الخام إلى شجرة قابلة للتصفح واستخرج بيانات مُهيكلة منها.

### المفهوم

سلسلة `html` تلك شجرة من وسوم متداخلة ، `<div>`، `<span>`، `<a>` ، كل واحدة تحمل اختياريًا سمات مثل `class` أو `href`. يحلّل BeautifulSoup ذلك النص إلى شجرة ويمنحك `find` (أول تطابق) و`find_all` (كل تطابق)، وكلتاهما قابلة للتصفية حسب اسم الوسم والسمات.

افتح الصفحة في "عرض مصدر الصفحة" (View Page Source) بمتصفحك وسترى: كل اقتباس يقع داخل `<div class="quote">`، والنص في `<span class="text">`، والمؤلف في `<small class="author">`، والوسوم في `<a class="tag">`.

### تلميح البداية

يُعيد `find_all("div", class_="quote")` وسم BeautifulSoup واحدًا لكل اقتباس. داخله، تضيّق `find` و`find_all` النطاق إلى الحقول التي تحتاجها، ويستخرج `.get_text(strip=True)` نصًا نظيفًا.

### الكود العملي

```python
# scrape.py
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
```

```bash
uv run python scrape.py
```

### الناتج المتوقع

عشرة أسطر، سطرًا واحدًا لكل اقتباس في الصفحة الرئيسية:

```
Albert Einstein: "Life is like riding a bicycle..." ['change', 'deep-thoughts', 'thinking', 'world']
J.K. Rowling: "It is our choices..." ['abilities', 'choices', 'deep-thoughts', 'flying', 'harry-potter']
...
```

### استكشاف الأخطاء وإصلاحها

| المشكلة | الحل |
|---|---|
| `AttributeError: 'NoneType' has no attribute 'get_text'` | أُعيد `None` من `find(...)` ، اسم الفئة غير مطابق. أعد فحص "عرض مصدر الصفحة" لأسماء الفئات الدقيقة. |
| طُبع أقل من 10 أسطر | مُرشِّح فئة CSS ضيق جدًا أو مُهجّأ. تحقق من أن `class_="quote"` يطابق HTML الفعلي. |
| يُظهر الناتج أحرفًا مشوشة | مشكلة ترميز. جرّب `soup = BeautifulSoup(response.content, "html.parser")` بدلاً من `response.text`. |

### قائمة التحقق

- [ ] يعمل `uv run python scrape.py` دون أخطاء
- [ ] طُبع 10 أسطر بالضبط، سطرًا واحدًا لكل اقتباس
- [ ] كل سطر يحتوي نصًا حقيقيًا واسم مؤلف حقيقيًا وقائمة وسوم غير فارغة

### سؤال سقراطي

يُعيد كلٌّ من `.get_text(strip=True)` و`.text` محتوى نص الوسم، لكن واحدة فقط منهما تُزيل الفراغات. ماذا سينكسر لاحقًا لو استخدمت `.text` في كل مكان بدلاً من ذلك؟ فكّر في مقارنات السلاسل النصية وعمليات `groupby`.

---

## الخطوة 3: استخرج بيانات مُهيكلة

### الهدف

حوّل تحليل كل صفحة إلى دالة قابلة لإعادة الاستخدام، واتبع ترقيم الصفحات عبر كل الصفحات، واحفظ النتائج إلى CSV.

### المفهوم

يوزّع quotes.toscrape.com الاقتباسات عبر 10 صفحات، مع رابط "التالي" في أسفل كل صفحة عدا الأخيرة. بدلاً من تثبيت "كرر 10 مرات"، اتبع الرابط نفسه ، بهذا يعمل السكربت حتى لو تغيّر عدد الصفحات. خطوتان فرعيتان: ضع حلقة الخطوة 2 داخل دالة، ثم اتبع الروابط حتى لا يبقى أي رابط.

### تلميح البداية

بنية الحلقة: `while url is not None:` اجلب كل صفحة وحلّلها، ثم تحقق من وجود `<li class="next">`. وجوده أو غيابه هو إشارة المتابعة/التوقف الخاصة بك.

### الكود العملي

```python
# scrape.py
import csv
import time

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://quotes.toscrape.com"


def parse_quotes(soup):
    """Extract {"text", "author", "tags"} for every quote on one parsed page."""
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
            print(f"Failed to fetch {url}: {exc}. Stopping here.")
            break

        soup = BeautifulSoup(response.text, "html.parser")
        all_quotes.extend(parse_quotes(soup))

        next_li = soup.find("li", class_="next")
        url = (
            requests.compat.urljoin(url, next_li.find("a")["href"])
            if next_li
            else None
        )
        if url is not None:
            time.sleep(1)  # rate-limit yourself even on a practice site

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

### الناتج المتوقع

```
Saved 100 quotes to quotes.csv
```

يظهر ملف `quotes.csv` حقيقي يحمل صف الرأس إضافة إلى صف لكل اقتباس.

### استكشاف الأخطاء وإصلاحها

| المشكلة | الحل |
|---|---|
| حُفظ 10 اقتباسات فقط | لا تتم متابعة عنوان `next_li`. تحقق من أن `url = requests.compat.urljoin(...)` داخل الشرط، لا يعيد الضبط إلى الصفحة الرئيسية. |
| السكربت معلّق أو بطيء | متوقع ، `time.sleep(1)` بين حوالي 10 صفحات يعني نحو 10 ثوانٍ إجمالًا. |
| `Failed to fetch ... Stopping here` | عطل شبكة أو مهلة. يحفظ السكربت ما جمعه حتى الآن بدلاً من الانهيار. |
| `quotes.csv` به صفوف فارغة | تسلّل `None` أو سلسلة فارغة إلى قائمة الاقتباسات. تحقق من دالة `parse_quotes` بحثًا عن استدعاءات `.get_text(strip=True)` ناقصة. |

### قائمة التحقق

- [ ] ينتهي `uv run python scrape.py` ويطبع "Saved N quotes"
- [ ] يوجد `quotes.csv` بأكثر من 10 صفوف (دليل على أن ترقيم الصفحات عمل)
- [ ] يُظهر فتح `quotes.csv` ثلاثة أعمدة نظيفة: `text` و`author` و`tags`

### سؤال سقراطي

ماذا سيحدث لو كانت الصفحة الأخيرة من الموقع ما زالت تحمل رابط "التالي" في HTML الخاص بها لكنه غير قابل للنقر؟ كيف قد تتحقق من ذلك قبل الوثوق بشرط التوقف هذا على موقع مختلف؟

---

## الخطوة 4: نظّف باستخدام pandas

### الهدف

حمّل ملف CSV المُستخلَص إلى pandas ونظّفه للتحليل.

### المفهوم

نادرًا ما تصل البيانات المُستخلَصة نظيفة. عمود `tags` مُخزَّن كسلسلة نصية واحدة مفصولة بفواصل (لا تستطيع خلايا CSV الاحتفاظ بقوائم Python)، والتناسق في الفراغات شائع. تجعل أدوات pandas الخاصة بالسلاسل النصية وفحص الأنواع التنظيف سريع الكتابة وسهل التحقق.

### تلميح البداية

خطوتان فرعيتان: قسّم عمود `tags` المُعبَّأ إلى قائمة حقيقية، ثم نفّذ فحوصات الفراغات والأنواع لالتقاط المشاكل مبكرًا.

### الكود العملي

```python
# analyze.py
import pandas as pd

df = pd.read_csv("quotes.csv")

# Step 4a: Reconstruct the packed tags column
# tags was saved as "tag1, tag2, tag3" — split into a real list column
df["tags"] = df["tags"].fillna("").apply(
    lambda raw: [tag.strip() for tag in raw.split(",") if tag.strip()]
)

# Step 4b: Whitespace and dtype sanity checks
df["text"] = df["text"].str.strip()
df["author"] = df["author"].str.strip()
assert df["text"].notna().all(), "some quotes have no text — check the scrape"

df["quote_length"] = df["text"].str.len()

print(df.head())
print()
print(df.dtypes)
```

```bash
uv run python analyze.py
```

### الناتج المتوقع

```
                                                text           author  \
0  "Life is like riding a bicycle. To keep your ba...  Albert Einstein
1  "It is our choices, Harry, that show what we tr...     J.K. Rowling
2  "Only two things are infinite, the universe and...  Albert Einstein
3  "The person, as well as the artist, strives for...  Albert Einstein
4  "Imagination is more important than knowledge. ...  Albert Einstein

                               tags  quote_length
0  [change, deep-thoughts, thinking, world]           123
1  [abilities, choices, deep-thoughts, flying, ...           106
2  [humor, infinite, universe]            89
3  [fake, inspectors, life, real]           93
4  [creativity, humor, imagination, life]           107

         text   author    tags  quote_length
0     object   object  object         int64
```

### استكشاف الأخطاء وإصلاحها

| المشكلة | الحل |
|---|---|
| `AttributeError: 'float' has no attribute 'split'` | تسرّب `NaN`. تأكد من تشغيل `.fillna("")` قبل `.apply`. |
| ما زال `df["tags"]` يحمل سلاسل نصية | لم يُعَد إسناد نتيجة `.apply`. تحقق من عدم إسقاطك للبادئة `df["tags"] =`. |
| `AssertionError: some quotes have no text` | حفظ شيء سابق صفًا بنص مفقود. افحص `quotes.csv` مباشرة بحثًا عن خلايا `text` فارغة. |
| يُظهر `quote_length` نمط `object` | استُدعي `.str.len()` على العمود الخاطئ أو قبل إزالة الفراغات. تحقق من أنه يعمل على `df["text"]` المُنقّى. |

### قائمة التحقق

- [ ] يطبع `type(df["tags"].iloc[0])` `<class 'list'>`، لا `str`
- [ ] `df["quote_length"]` عمود رقمي دون قيم مفقودة
- [ ] يُظهر `df.head()` نصًا نظيفًا دون فراغات بادئة/زائدة شاردة

### سؤال سقراطي

لو كانت خلية `tags` لصف واحد فارغة (اقتباس بلا وسوم)، ماذا سيُعيد `raw.split(",")`؟ هل يتعامل مُرشِّح `if tag.strip()` مع هذه الحالة بشكل صحيح؟ اختبره.

---

## الخطوة 5: حلّل وصوّر

### الهدف

أنتج رسومًا بيانية وإحصاءات موجزة من البيانات المنظَّفة.

### المفهوم

بأعمدة نظيفة ومُنمَّطة، يصبح التحليل بضعة أسطر من `groupby` / `value_counts` ، نفس النمط من دفاتر pandas، فقط موجّه إلى بيانات جلبتها بنفسك. ثلاثة رسوم بيانية: أكثر الوسوم شيوعًا، والمؤلفون الأكثر اقتباسًا، وتوزيع طول الاقتباسات.

### تلميح البداية

ثلاث خطوات فرعية، واحدة لكل رسم بياني. استخدم `explode` لعمود الوسوم (صف لكل وسم)، و`value_counts` للعدّ الفئوي، و`hist` للتوزيع الرقمي.

### الكود العملي

```python
# analyze.py (continued)
import matplotlib.pyplot as plt
import pandas as pd

df = pd.read_csv("quotes.csv")

# Clean (same as Step 4)
df["tags"] = df["tags"].fillna("").apply(
    lambda raw: [tag.strip() for tag in raw.split(",") if tag.strip()]
)
df["text"] = df["text"].str.strip()
df["author"] = df["author"].str.strip()
df["quote_length"] = df["text"].str.len()

# Chart 1: Top 10 tags
exploded = df.explode("tags")
exploded = exploded[exploded["tags"] != ""]
tag_counts = exploded["tags"].value_counts().head(10)

fig, ax = plt.subplots(figsize=(8, 5))
tag_counts.sort_values().plot(kind="barh", ax=ax, color="#3b82f6")
ax.set_xlabel("Number of quotes")
ax.set_ylabel("Tag")
ax.set_title("Top 10 tags on quotes.toscrape.com")
ax.set_xlim(left=0)
fig.tight_layout()
fig.savefig("top_tags.png")
plt.close()

# Chart 2: Most-quoted authors
most_quoted = df["author"].value_counts().head(5)
print("Most-quoted authors:")
print(most_quoted)

# Chart 3: Quote-length distribution
fig, ax = plt.subplots(figsize=(8, 5))
ax.hist(df["quote_length"], bins=20, color="#3b82f6", edgecolor="white")
ax.set_xlabel("Quote length (characters)")
ax.set_ylabel("Number of quotes")
ax.set_title("Distribution of quote lengths")
fig.tight_layout()
fig.savefig("quote_length_dist.png")
plt.close()

print("\nSaved top_tags.png and quote_length_dist.png")
```

```bash
uv run python analyze.py
```

### الناتج المتوقع

```
Most-quoted authors:
author
Albert Einstein    10
André Gide          5
J.K. Rowling        3
...
dtype: int64

Saved top_tags.png and quote_length_dist.png
```

يظهر ملفا صور: `top_tags.png` (رسم شريطي أفقي، أطول شريط بالأعلى، محور x يبدأ من 0) و`quote_length_dist.png` (رسم بياني تكراري بشكل حقيقي، مع تجمّع معظم الاقتباسات في المئات المنخفضة من الأحرف).

### استكشاف الأخطاء وإصلاحها

| المشكلة | الحل |
|---|---|
| رسم شريطي فارغ أو كلّه أصفار | صفّى `exploded["tags"] != ""` كل شيء. تحقق من أن بناء القائمة في الخطوة 4 أسقط السلاسل الفارغة فعلاً. |
| محور x لا يبدأ من 0 | حُذف سطر `ax.set_xlim(left=0)`. |
| الرسم التكراري شريط واحد مصمت | لا تباين في `quote_length`. أعد فحص أنه حُسب من `text` المُنقّى. |
| لا يُحفظ `top_tags.png` | تأكد من استدعاء `fig.savefig(...)` على نفس كائن `fig` الذي أعادته `plt.subplots()`. |
| تبدو الأشرطة معقولة لكنها تخالف المتوقع | مجموعة البيانات حية ، تتغير الأعداد مع تحديث الموقع المصدر. |

### قائمة التحقق

- [ ] يوجد `top_tags.png` و`quote_length_dist.png` معًا ويُفتحان كصورتين حقيقيتين
- [ ] يبدأ محور x للرسم الشريطي من 0
- [ ] لكلا الرسمين عنوان ومحاور مُصنَّفة
- [ ] يُظهر الرسم التكراري توزيعًا حقيقيًا، لا شريطًا مسطحًا واحدًا

### سؤال سقراطي

لو ضبطت `ax.set_xlim(left=5)` بدلاً من `0` للرسم الشريطي، كيف سيتغيّر الفرق *البصري* بين أعلى وسم والوسم العاشر، رغم أن الأعداد الأساسية لم تتغيّر إطلاقًا؟

---

## الخطوة 6: صدّر النتائج

### الهدف

احفظ مجموعة البيانات المنظَّفة الجاهزة للتحليل لإعادة الاستخدام.

### المفهوم

CSV هو أبسط صيغة تبادل، لكن النسخة المنظَّفة (ذات أعمدة القوائم الحقيقية) لا تُسلسَل نظيفًا. نهجان: صدّر نسخة مسطّحة للاستخدام في الجداول، أو استخدم JSON للحفاظ على القوائم.

### الكود العملي

```python
# analyze.py (continued)

# Flat CSV: tags joined back to a string for spreadsheet compatibility
df["tags_flat"] = df["tags"].apply(lambda t: ", ".join(t))
df[["text", "author", "tags_flat", "quote_length"]].to_csv(
    "quotes_clean.csv", index=False
)
print(f"Saved quotes_clean.csv with {len(df)} rows")

# JSON: preserves list structure
df.to_json("quotes_clean.json", orient="records", indent=2)
print("Saved quotes_clean.json")
```

### الناتج المتوقع

```
Saved quotes_clean.csv with 100 rows
Saved quotes_clean.json
```

ملفان جديدان: `quotes_clean.csv` (مسطّح، صديق للجداول) و`quotes_clean.json` (يحافظ على قوائم الوسوم كمصفوفات).

### قائمة التحقق

- [ ] يوجد `quotes_clean.csv` ويُفتح في جدول أو محرر نصوص
- [ ] يحتوي `quotes_clean.json` على JSON صالح بمصفوفات لحقل `tags`

### سؤال سقراطي

لماذا يحتاج تصدير CSV إلى `tags_flat` (سلسلة نصية) بدلاً من كتابة القائمة مباشرة؟ وما الصيغة الأنسب بطبيعتها للبيانات المتداخلة مثل قوائم السلاسل النصية، وما المقايضات التي يحمل كل صيغة منها؟

---

## التحديات

بمجرد أن يعمل الأنبوب الأساسي، جرّب هذه الامتدادات:

### التحدي 1: استخرج صفحات المؤلفين

كل اسم مؤلف على quotes.toscrape.com يرتبط بصفحة سيرة بها تاريخ ميلاد ومكان ميلاد. وسّع `parse_quotes` ليتابع كل رابط مؤلف، ويجلب صفحة السيرة، ويضيف عمودي `birth_date` و`birthplace` إلى DataFrame. يُدخل هذا حلّ العناوين النسبية واجتياز الصفحات متعدد المستويات.

### التحدي 2: استخلص موقعًا قائمًا على الجداول

استهدف موقعًا يحوي عناصر `<table>` في HTML بدلاً من بطاقات `<div>` ، مثلًا جدول مقارنة على ويكيبيديا. استخدم BeautifulSoup لإيجاد وسوم `<tr>` و`<td>`، ثم مرّر الصفوف إلى DataFrame عبر `pd.DataFrame(rows, columns=headers)`. يتغير منطق التحليل، لكن يبقى أنبوب الجلب-التنظيف-التحليل كما هو.

### التحدي 3: أضف تحديد المعدل ومنطق إعادة المحاولة

استبدل `time.sleep(1)` الثابت بتراجع أسي (exponential backoff): عند طلب فاشل، انتظر ثانية، ثم 2، ثم 4، حتى حد أقصى. اجمع هذا مع `requests.adapters.HTTPAdapter` لإعادة محاولة تلقائية. هذا هو النمط الذي تستخدمه أدوات الاستخلاص الإنتاجية.

### التحدي 4: صوّر الاتجاهات عبر الزمن

إن شغّلت أداة الاستخلاص مرات عدة بطوابع زمنية، ارسم كيف تتغير شعبية الوسوم أو عدد المؤلفين عبر التشغيلات. استخدم `matplotlib` بخطوط متعددة أو رسم مساحي متراكم.

---

## ما تعلمته

1. **طلبات HTTP** ، `requests.get()` مع `raise_for_status()` ومهل زمنية لجلب قوي
2. **تحليل HTML** ، `BeautifulSoup` مع `find` / `find_all` ومُحدِّدات فئة CSS
3. **ترقيم الصفحات** ، متابعة روابط "التالي" عبر `urljoin` بدلاً من تثبيت أعداد الصفحات
4. **معالجة الأخطاء** ، `try`/`except` حول استدعاءات الشبكة للحفاظ على التقدم الجزئي
5. **تنظيف البيانات** ، تقسيم الأعمدة المُعبَّأة، إزالة الفراغات، تأكيد الثوابت
6. **التصور** ، رسوم شريطية ورسوم بيانية تكرايرة وقواعد الصدق (محاور مُصنَّفة، محور x عند 0، عناوين وصفية)
7. **آداب الاستخلاص** ، تحديد المعدل بـ `sleep`، واحترام `robots.txt`

يعمم الأنبوب: استبدل بموقع آخر صديق للاستخلاص، وتبقى نفس الخطوات الخمس ، اطلب، حلّل، اتبع ترقيم الصفحات، نظّف، ارسم ، هي الأنبوب بأكمله.

## إلى أين تذهب من هنا

- **مواقع مختلفة** ، اقرأ `robots.txt` وشروط خدمة كل موقع أولًا؛ HTML كل موقع مختلف، لذا ستحتاج فحص تنسيقه بنفسك
- **SQLite** ، استبدل CSV بوحدة `sqlite3` المدمجة في Python بمجرد أن تكبر البيانات عن ملف واحد
- **الجدولة** ، شغّل أداة الاستخلاص دوريًا عبر cron أو حلقة، مضافةً عمود طابع زمني لتتبع كيفية تغيّر البيانات عبر الزمن
- **Scrapy** ، إطار عمل كامل للاستخلاص واسع النطاق بجانب مدمج للتزامن والوسطاء وأنابيب التصدير

---

## شارك مشروعك مع الصف

بنيت شيئًا تفتخر به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع أرسلها طلاب آخرون. يشرح ملف README الخاص به بأسلوب صديق للمبتدئين كيفية إضافة مشروعك عبر طلب سحب (pull request) ، عمل fork للمستودع، وإنشاء فرع، وتثبيت، وفتح طلب السحب. لا يُفترض أي خبرة سابقة بـ git.
