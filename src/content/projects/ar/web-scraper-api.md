---
title: "API كاشط الويب"
description: "ابنِ API كاشط ويب قابل لإعادة الاستخدام مع تدوير البروكسي وتحديد المعدل واستخراج البيانات المنظمة."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["requests", "beautifulsoup", "web-scraping", "html-parsing", "api"]
learningObjectives:
  - اجلب الصفحات باستخدام requests وتعامل مع أخطاء HTTP بأناقة
  - افحص HTML باستخدام BeautifulSoup ومحددات CSS
  - حدّد معدل الطلبات وأعد المحاولة للزحف بمسؤولية
  - ازحف عبر المواقع متعددة الصفحات إلى مجموعة بيانات واحدة
  - غلّف خط الأنابيب في دالة واحدة قابلة لإعادة الاستخدام تُرجع JSON منظمًا
prerequisites:
  - "Python basics (functions, loops, dictionaries)"
  - "Understanding of HTTP and basic HTML structure"
  - "Familiarity with JSON format"
---

# 🛠️ 🕷️ ابنِ API كاشط الويب

الويب في الغالب HTML يُقدَّم للبشر، لكن كل "مجموعة بيانات" لا يمكنك تنزيلها بدأت كنظام كشّطها شخصٌ ما. يبني هذا المشروع API كشط صغيرًا ومسؤولًا ضد [books.toscrape.com](https://books.toscrape.com/) — موقع *مبني* للتدرب على هذا — بعميل HTTP محدود المعدل يعيد المحاولة بأدب، ومحلل BeautifulSoup يحوّل HTML إلى سجلات منظمة، وزاحف ترقيم صفحات، ودالة واحدة قابلة لإعادة الاستخدام تُعيد JSON نظيفًا. النتيجة واجهة قراءة صغيرة خاصة بك فوق موقع ويب عام.

هذا يفترض Python 101 وما يكفي من HTML لتمييز عنوان ورابط و`div` — لا شيء من تحليل البيانات مطلوب. هذا اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للقائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. بناء عميل HTTP محدود المعدل يعيد محاولة الإخفاقات العابرة ويحترم خادم الهدف.
2. تحليل HTML حقيقي إلى سجلات كتب منظمة بمحددات CSS.
3. الزحف في ترقيم صفحات الموقع ودمج الصفحات في مجموعة بيانات واحدة.
4. لفّ خط الأنابيب في دالة واحدة قابلة لإعادة الاستخدام تكتب وتُعيد JSON.
5. تحليل السجلات المجمعة إلى إحصائيات ملخّصة.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي — وهنا ليس مجرد ملاءمة، بل حامل وزن. فرضية هذا المشروع كلها إجراء طلبات HTTP حقيقية، ما يعني أن على البيئة أن تملك وصولًا صادرًا للشبكة. `uv` المحلي يملكه، و`requests` و`beautifulsoup4` و`lxml` تُثبَّت له بوضوح.

**تشغيلات Google Colab وBinder كأدوات دفاتر** تعمل أيضًا — كلاهما يملك وصولًا للشبكة، ويعكس الدفتر كل خطوة مع `!pip install` وطلبات حية إلى books.toscrape.com. **JupyterLite** غير مناسب فعلًا: يشغّل Python في صندوق متصفح بلا شبكة صادرة عامة، فلا شيء تبلغه `requests.get`. استخدم شارات الدفتر أو تشغيلًا محليًا لهذا، بصراحة.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/web-scraper-api/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/web-scraper-api/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fweb-scraper-api%2Fnotebook.ipynb)

## الإعداد

أنشئ المشروع وثبّت المكتبات الثلاث التي يُبنى عليها هذا الخط.

```bash
uv init web-scraper-api
cd web-scraper-api
uv add requests beautifulsoup4 lxml
```

**`requests`** تقوم بالـ HTTP، **`beautifulsoup4`** يحلل HTML ويستعلم بـ CSS-selector، و**`lxml`** محلل C السريع الذي يستخدمه BeautifulSoup تحته — وهو ما يجعل `soup.select` سريعًا على صفحة كاملة. ملاحظة أخلاقية واحدة لكشط مثالي قبل أن تبدأ: اكشط المواقع التي تسمح بذلك فقط. تستخدم هذه الدورة books.toscrape.com لأن اسمه عقده — هو موجود ليُكشَط. لأي شيء تكتبه بعد هذا المشروع، تحقق من `robots.txt` أولًا وأبقِ معدل طلباتك إنسانيًا؛ محدّد المعدل الذي أنت على وشك بنائه هو النسخة *المهذبة* من ذلك.

**✅ قائمة التحقق**

- ✅ انتهى `uv add requests beautifulsoup4 lxml` وخرج `uv run python -c "import requests, bs4, lxml"` بصمت.
- ✅ يمكنك الوصول إلى الهدف: يطبع `uv run python -c "import requests; print(requests.get('https://books.toscrape.com/').status_code)"` القيمة `200`.

## الخطوة 1: ابنِ عميل HTTP صامدًا

يفقد الإنترنت حزمًا، ويخنق العملاء، ويُعيد أحيانًا صفحة مكسورة. الكاشط الذي ينهار عند أول نوبة تفيد صفرًا، ومن يقرع الخادم بضراوة فظ — فتبني هذه الخطوة عميلًا بشخصيتين: ينتظر بأدب بين الطلبات (تحديد المعدل) ويعيد المحاولة بأدب عند فشل عابر (التراجع).

### 1.1 اكتب محدّد المعدل

**👟 تلميح البداية :** فرض أدنى فاصل زمني بين الطلبات في صنف صغير واحد — تتبّع وقت آخر طلب و`sleep` للفرق عند الحاجة.

```python
# scraper.py
import time
import json
import requests

class RateLimiter:
    def __init__(self, requests_per_second: float = 1.0):
        self.min_interval = 1.0 / requests_per_second
        self.last_request = 0.0

    def wait(self) -> None:
        elapsed = time.time() - self.last_request
        if elapsed < self.min_interval:
            time.sleep(self.min_interval - elapsed)
        self.last_request = time.time()

limiter = RateLimiter(requests_per_second=0.5)

limiter.wait()
print(f"Just waited; last_request={limiter.last_request:.2f}")
limiter.wait()
print(f"Immediate second call also waited; last_request={limiter.last_request:.2f}")
```

تحويل الوحدة في المُنشئ هو الفكرة كلها: `requests_per_second=0.5` يعني ثانيتين بين الطلبات، و`1.0 / 0.5` يحسب ذلك الفاصل. ثم تقوم `wait()` بعملين — تنام إذا كنا مبكرين جدًا، وتختم دائمًا `last_request = time.time()` — فاستدعاء ثانٍ متتابع لا خيار له سوى الانتظار. يبدأ `last_request` عند `0.0`، ما يعني أن أول `wait()` لا تنام أبدًا (وقت منقضٍ ضخم) ومع ذلك تُفعّل الساعة بشكل صحيح. هذا هو النمط القريب من دلو الرموز (token bucket) النصّي خلف كل زاحف محترم.

**🎯 الناتج المتوقع :** يعمل الانتظاران ويطبع كل سطر طابع `last_request` متزايدًا بثبات متباعدًا نحو ثانيتين.

**🩹 إذا لم يعمل :** إذا كان الانتظار الثاني فوريًا، فلا تُطلق شوكة `time.sleep` أبدًا لأن `last_request` لم يُحدَّث بعد أول انتظار. إذا كانت الانتظارات أطول بكثير من ثانيتين، فـ`requests_per_second` يُمرَّر كمعدل صحيح لكنه يُقسَّم في مكان آخر. إذا تسرّب التهجئة `rate_per_second` من مثال آخر، فتوقيع `__init__` هو المرجع الوحيد — الاستدعاء أعلاه `RateLimiter(requests_per_second=0.5)`.

### 1.2 اجلب صفحة مع إعادة محاولة

**👟 تلميح البداية :** لفّ `requests.get` في حلقة تعيد المحاولة على إخفاقات عابرة (مهلات، وأخطاء اتصال، و429/5xx) بتأخيرات متزايدة، وأعطِ الطلب User-Agent حقيقيًا.

```python
# scraper.py (continued)
def fetch_page(url: str, max_retries: int = 3, timeout: int = 10) -> requests.Response:
    """Fetch a URL with retry logic and rate limiting."""
    headers = {"User-Agent": "PythonScraper/1.0 (educational project)"}

    for attempt in range(1, max_retries + 1):
        limiter.wait()
        try:
            response = requests.get(url, headers=headers, timeout=timeout)
            response.raise_for_status()
            return response
        except requests.exceptions.HTTPError:
            if response.status_code == 429 or response.status_code >= 500:
                time.sleep(2 ** attempt)
            else:
                raise
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
            time.sleep(2 ** attempt)

    raise RuntimeError(f"Failed to fetch {url} after {max_retries} retries")

response = fetch_page("https://books.toscrape.com/")
print(f"Status: {response.status_code}, Length: {len(response.text)} chars")
```

ثلاثة قرارات تجعل هذا العميل على هيئة إنتاج. **User-Agent صريح** — `PythonScraper/1.0 (educational project)` يخبر الخادم *مَن* يدعو بدلًا من الاختباء خلف افتراضي المكتبة، وهو ما يفعله زاحف مهذب. **تعيد المحاولة الإخفاقات العابرة فقط**: أخطاء 4xx مثل 404 يقول الخادم فيها "هذا نهائي"، فتُرفع فورًا، بينما 429 (محدود المعدل) و5xx (نوبة خادم) وخطأ مهلة/اتصال كلها تحصل على `time.sleep(2 ** attempt)` — تراجع أسّي، ثانيتان ثم 4، فتصير المحاولات ألطف، لا أشد غضبًا. و`limiter.wait()` تخدم *قبل* كل محاولة، طاويةً انضباط 1.1 في الجلب فلا يمكن لأي مُستدعٍ تخطّيها.

**🎯 الناتج المتوقع :** `Status: 200, Length: ...` — HTTP 200 حقيقي وعدد أحرف الصفحة الرئيسية. توجيه `fetch_page` إلى صفحة غير موجودة عن قصد (مثل `https://books.toscrape.com/nope`) يرفع خطأ HTTP بدلًا من إعادة قمامة.

**🩹 إذا لم يعمل :** إذا حصلت على `NameError: response is not defined` في فرع `HTTPError`، فرُفع `requests.get` نفسه قبل إسناد `response` — تمرير `timeout` في الاستدعاء (موجود بالفعل) هو ما يمنع ذلك. إذا دار 404 حلقة لا نهائية، ففرع `else: raise` مفقود، فيعيد كل حالة HTTP المحاولة. إذا لم يُشاهد نوم إعادة المحاولة أبدًا، فتوقيت `2 ** attempt` يندفع على شبكة سريعة — هذا صحيح؛ اختبر بـ `timeout=1` على مضيف لا يمكن الوصول إليه لتشعر بالتراجع.

### 1.3 تحقق من عميل HTTP

**✅ قائمة التحقق**

- ✅ يفرض `RateLimiter(requests_per_second=0.5)` فجوات ~2 ثانية بين استدعاءات `wait()` المتتابعة.
- ✅ تُعيد `fetch_page` استجابة `200` للصفحة الرئيسية وترفع بوضوح لمسار غير موجود.
- ✅ فقط الحالات العابرة (429، 5xx، مهلات، أخطاء اتصال) تُطلق إعادة المحاولة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تنام `limiter.wait()` للفجوة *قبل* الطلب. ما الذي يتغير لو حدث النوم بدلًا من ذلك بعد وصول الاستجابة — وأي نمط ألطف بالخادم عندما تكون الاستجابات بطيئة؟
- تستخدم حلقة إعادة المحاولة `time.sleep(2 ** attempt)`. لماذا التراجع *الأسّي* بدلًا من انتظار ثانية ثابتة كل مرة — وما الذي كان سيشعر به خادم يمر بتحميل زائد من مُعيد ثابت الفاصل لن يشعر به من هذا؟

## الخطوة 2: حلّل HTML إلى سجلات منظمة

الصفحة المجلوبة جدار نص؛ مجموعة بيانات قابلة للاستخدام قائمة قواميس. تبني هذه الخطوة المحلل الذي يحوّل كل `article` على صفحة المكتبة إلى سجل نظيف واحد — باستخدام محدّدات CSS الخاصة بـ BeautifulSoup، التي تقرأ مثل CSS الذي كنت لتكتبه لورقة أنماط.

### 2.1 اكتب محلل الكتب

**👟 تلميح البداية :** اختر كل بطاقة منتج بـ `select` واحد، واسحب كل حقل بـ `select_one`، واحرس دائمًا العناصر المفقودة حتى لا يقتل حقل غائب سجلًا.

```python
# scraper.py (continued)
from bs4 import BeautifulSoup

def parse_books(html: str) -> list[dict]:
    """Extract book data from books.toscrape.com HTML."""
    soup = BeautifulSoup(html, "lxml")
    books = []

    for article in soup.select("article.product_pod"):
        title_tag = article.select_one("h3 a")
        price_tag = article.select_one(".price_color")
        availability_tag = article.select_one(".availability")
        rating_tag = article.select_one(".star-rating")

        rating_classes = rating_tag.get("class", []) if rating_tag else []
        rating_map = {"One": 1, "Two": 2, "Three": 3, "Four": 4, "Five": 5}
        rating = rating_map.get(rating_classes[1], 0) if len(rating_classes) > 1 else 0

        books.append({
            "title": title_tag["title"] if title_tag else "Unknown",
            "url": "https://books.toscrape.com/" + title_tag["href"] if title_tag else "",
            "price": price_tag.text.strip() if price_tag else "N/A",
            "availability": availability_tag.text.strip() if availability_tag else "Unknown",
            "rating": rating,
        })
    return books

html = fetch_page("https://books.toscrape.com/").text
books = parse_books(html)
print(f"Found {len(books)} books")
for book in books[:3]:
    print(f"  {book['title']} -- {book['price']} -- {'*' * book['rating']}")
```

المحدد `"article.product_pod"` هو المفردات كلها: يطلب من الحساء كل عنصر `<article>` يحمل الصنف `product_pod` — وهو بالضبط كيف يميّز الموقع بطاقة كتاب. ثم يلتقط كل `select_one` *مطابقة واحدة* داخل تلك البطاقة: `"h3 a"` رابط العنوان (الذي يحمل سمة `title` الاسم)، و`.price_color` السعر، و`.star-rating` وسمًا *صنفه الثاني* يسمّي التقييم بالكلمات. يقرأ المحلل `rating_classes[1]` ويرسم الكلمة إلى رقم — بيان نظيف أن HTML يرمّز أحيانًا بيانات في أصناف لا في نص. كل حقل محروس لغيابه (`if title_tag else ...`)، لأن موقعًا يغيّر شكل صنف واحد لا يجب أن يُسقط زحفك كله.

**🎯 الناتج المتوقع :** `Found 20 books` ومعاينة ثلاثة صفوف مثل `A Light in the Attic -- £51.77 -- *****`.

**🩹 إذا لم يعمل :** إذا كان `Found 0 books`, فالمحدد `"article.product_pod"` لا يطابق ترميز الموقع — افحص بـ `soup.select_one("article")` لترى ما هو موجود فعلًا (ربما تغيّر الموقع). إذا عادت الأسعار فارغة، فالصنف `.price_color` وسمة `text` تتطلب أن يكون الوسم معثورًا. إذا كان كل تقييم `0`، فـ`rating_classes[1]` فارغ أو تغيّر ترتيب قائمة الأصناف.

### 2.2 تحقق من المحلل على شكل معروف

**👟 تلميح البداية :** عدّ العناوين المميزة وأكّد أن الحقول الخمسة كلها مأهولة لكل سجل — فحص شكل سريع قبل أن تثق بالمحلل في زحف كامل.

```python
# scraper.py (continued)
print(f"Records: {len(books)}")
print("Fields per record:", sorted(books[0].keys()))
print("Non-empty titles:", sum(1 for b in books if b["title"]))
print("Ratings seen:", sorted({b["rating"] for b in books}))
```

تحقق-قبل-التوسيع هو الانضباط هنا: صفحة واحدة، و20 سجلًا، وتتحقق أن كل حقل موجود وكل تقييم يرسم إلى 1–5 *قبل* أن تثق صفحات الزحف العديدة بالمحلل. تُظهر ضبط المجموعة `{b["rating"] for b in books}` في لمحة واحدة هل أنتج رسم التقييمات قيمًا سليمة.

**🎯 الناتج المتوقع :** `Records: 20`، وأسماء الحقول الخمسة، و`Non-empty titles: 20`، و`Ratings seen: [1, 2, 3, 4, 5]` (أو المجموعة الفرعية الحاضرة على تلك الصفحة).

**🩹 إذا لم يعمل :** إذا أُخطئ إملاء اسم حقل، فقاموس `books.append` في المحلل والفحص هنا يختلفان — ابحث في كليهما. إذا تضمّن `Ratings seen` قيمة `0`، فبعض البطاقات تنقصها فئة star-rating والبديل التهمها؛ ذلك متوقع لقِلة من القوائم، والرسم ما زال يعمل.

### 2.3 تحقق من خطوة التحليل

**✅ قائمة التحقق**

- ✅ `parse_books` على الصفحة الرئيسية تُعيد 20 سجلًا بالحقول الخمسة تمامًا.
- ✅ `rating` كل سجل عدد صحيح 1–5، مشتق من كلمة صنف.
- ✅ سجل بعنصر مفقود ينحط إلى حشو بدلًا من إسقاط الحلقة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يستخرج المحلل الرابط بسلسلة-تسلسل `"https://books.toscrape.com/" + title_tag["href"]`. ماذا يتفطرّق إذا تحول الموقع إلى hrefs *مطلقة* مثل `/catalogue/foo.html` — وما الذي كان `urljoin` قويًا سيفعله لا يستطيع التسلسل؟
- تُقرأ التقييمات من اسم صنف، لا النص المرئي. متى غيّر مطوّرو الموقع أسماء الأصناف هذه، وما الذي يعنيه ذلك عن مدة بقاء محلل محدّدات CSS صحيحًا مقارنة بمحلل يقرأ النص المرئي؟

## الخطوة 3: ازحف عبر الصفحات

صفحة واحدة عينة؛ الكتالوج هو مجموعة البيانات. يتقسّم books.toscrape عند 20 كتابًا لكل صفحة برابط `next`، وتتبع هذه الخطوة ذلك الرابط — مقيدًا بحد أقصى `max_pages` — حتى يكتمل الزحف أو تنفد ترقيم الصفحات.

### 3.1 اتبع سلسلة ترقيم الصفحات

**👟 تلميح البداية :** حلّق صفحة بصفحة، وحلّل كل استجابة، ووسّع المتراكِم، واقرأ رابط `next` من HTML الصفحة، وصرفه إلى الرابط التالي.

```python
# scraper.py (continued)
def scrape_books(base_url: str, max_pages: int = 3) -> list[dict]:
    """Scrape books across multiple pages with progress reporting."""
    all_books = []
    url = base_url

    for page in range(1, max_pages + 1):
        print(f"Scraping page {page}...")
        try:
            response = fetch_page(url)
            books = parse_books(response.text)
            all_books.extend(books)
            print(f"  Found {len(books)} books (total: {len(all_books)})")

            soup = BeautifulSoup(response.text, "lxml")
            next_btn = soup.select_one("li.next a")
            if next_btn:
                url = base_url.rsplit("/", 1)[0] + "/" + next_btn["href"]
            else:
                break
        except Exception as e:
            print(f"  Error on page {page}: {e}")
            break
    return all_books

books = scrape_books("https://books.toscrape.com/catalogue/page-1.html", max_pages=3)
print(f"\nTotal books scraped: {len(books)}")
```

كل اختيار مثير للاهتمام في سطر مختلف. `all_books.extend(books)` هو البدائية التراكمية — حوّل قائمة كل صفحة إلى مجموعة بيانات موحدة، `extend` واحدة كل مرة. سطر الرابط التالي، `url = base_url.rsplit("/", 1)[0] + "/" + next_btn["href"]`، هو الزحف في جزأين: `rsplit("/", 1)` يقطّع آخر قطعة مسار (`page-1.html`)، ويُلحق `href` رابط `next` (وهو `catalogue/page-2.html`، نسبي) — حل يدوي لتحليل الروابط النسبية. و`max_pages` حدّ اللياقة *والأمان* معًا: تستكشف الصفحة 1→2→3 وتتوقف، فلا يفاجَأ الموقع ولا ميزانيتك بزحف مئة صفحة عرضي.

**🎯 الناتج المتوقع :** ثلاثة أسطر تقدم (`Scraping page 1...`، و`Found 20 books (total: 20)`، وما يليهما)، ثم `Total books scraped: 60`.

**🩹 إذا لم يعمل :** إذا توقف الزحف بعد صفحة واحدة، فـ`li.next a` لم يطابق (تغيّر ترميز زر next في الموقع) أو أُطلق `break` دون شرط. إذا *أعاد جلب* كل صفحة الصفحة 1 في حلقة، فيتحدث `url` إلى سلسلة متطابقة كل مرة — تحقق أن `rsplit` يستبدل المقطع فعلًا، أو اطبع `url` قبل الجلب. إذا قتل استثناء في المنتصف التشغيل كله، فـ`try/except` لكل صفحة الذي يطبع و`breaks` مفقود.

### 3.2 تحقق من الزحف

**✅ قائمة التحقق**

- ✅ `scrape_books(..., max_pages=3)` تُعيد 60 سجلًا بروابط فريدة.
- ✅ تتوقف الحلقة عند `max_pages` حتى عندما توجد صفحات أكثر.
- ✅ الإجمالي المطبوع يساوي مجموع تعداد الصفحات الفردية.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تكسر الحلقة عند غياب زر `next` *وعند* بلوغ `max_pages`. لو احتاج زحف حقيقي إلى الاستئناف حيث توقف (مثلًا بعد تحطم)، فماذا كان عليك أن تدوّم ليجعله قابلًا للاستئناف — وهل الكود الحالي قريب من ذلك بأي شكل؟
- تميل زحف ترقيم الصفحات إلى التتابُع: لا يمكنك معرفة الرابط الثالث حتى تقرأ رابط `next` للصفحة الثانية. تحت أي ظرف يمكن للزحف أن يُوازي الصفحات — وما المشكلة الجديدة التي يصنعها ذلك لمحدّد المعدل في الخطوة 1؟

## الخطوة 4: اجعلها دالة API قابلة لإعادة الاستخدام

حصاد الدوال التي بنيتها خط أنابيب؛ القابل *لإعادة الاستخدام* دالة واحدة تشغّل الخط كله وتسلم بيانات منظمة. تلفّف هذه الخطوة زحف → حلل → احفظ في استدعاء `scrape_books_to_json` واحد وتضيف إعادة التحميل، فيتصرف `books.json` مثل استجابة واجهة قراءة صغيرة.

### 4.1 لفّ الخط في دالة واحدة

**👟 تلميح البداية :** أرجِع من المغلف ما يحفظه، واكتب بـ `json.dump(indent=2)`، وأرجِع القائمة ليحصل المستدعون على البيانات حتى لو تجاهلوا الملف.

```python
# scraper.py (continued)
def scrape_books_to_json(base_url: str, max_pages: int = 3, outfile: str = "books.json") -> list[dict]:
    """Crawl pages and write the combined records to a JSON file."""
    records = scrape_books(base_url, max_pages=max_pages)
    with open(outfile, "w") as f:
        json.dump(records, f, indent=2)
    print(f"Wrote {len(records)} records to {outfile}")
    return records

books = scrape_books_to_json("https://books.toscrape.com/catalogue/page-1.html", max_pages=3)
print(f"Returned {len(records := books)} records ready to use in memory")
```

العقد هنا هو الجزء المثير: يُعيد `scrape_books_to_json` `list[dict]` عاديًا — بالضبط ما كان سيعيده استدعاء API — *ويكتب* الشيء نفسه إلى القرص. لفّ الخط يغيّر سطح الدالة من "ثلاث أدوات منفصلة" إلى "استدعاء واحد يعطيك مجموعة البيانات"، وهي الواجهة ذات شكل API خلف اسم المشروع. `json.dump(records, f, indent=2)` يجعل الملف مقروءًا بشريًا، ولأن التحميل `json.load` خالص، يتحول الملف المحفوظ إلى لقطة محمولة يمكنك إعادة تحليلها دون لمس الشبكة مرة أخرى.

**🎯 الناتج المتوقع :** أسطر تقدم الزحف، و`Wrote 60 records to books.json`، و`Returned 60 records ready to use in memory`.

**🩹 إذا لم يعمل :** إذا كتب الملف لكن الدالة أعادت `None`، فسطر `return records` مفقود. إذا كان الملف سطرًا مكدسًا واحدًا، فسقط `indent=2`. إذا استدعاء ثانٍ بـ `outfile="books2.json"` ما زال يستبدل `books.json`, فالافتراضي المختوم فاز بالحجة — يجب أن يختلفا في موقع الاستدعاء.

### 4.2 حمّل وعدّ من JSON المحفوظ

**👟 تلميح البداية :** اقرأ اللقطة بعودة عبر `json.load` لتعيد تشغيل التحليل دون إعادة ضرب الشبكة وإعادة الكشط.

```python
# scraper.py (continued)
with open("books.json") as f:
    saved_books = json.load(f)

print(f"Reloaded {len(saved_books)} records from books.json")
print("First title:", saved_books[0]["title"])
```

نقطة إبقاء لقطة أن يصبح التحليل عملية *قراءة*: لا شبكة، ولا إعادة محاولة، ولا محدّد معدل — ملف فقط. يعيد `json.load` بالضبط القائمة التي كتبها المغلف، لأن كل قيمة (سلاسل، أعداد صحيحة، قواميس) في السجلات قابلة لسلسلة JSON بالتركيب. هذا هو النصف غير المتصل بسير عمل اكشط-ثم-ماذا: اكشط مرة، وحلل مرات.

**🎯 الناتج المتوقع :** `Reloaded 60 records from books.json` وعنوان أول كتاب.

**🩹 إذا لم يعمل :** إذا كان الملف مفقودًا، فمغلف 4.1 لم يخدم أبدًا (شغّله أولًا). إذا رفع التحميل `json.decoder.JSONDecodeError`، فقد عدّل الملف يديويًا أو كُتب جزئيًا — أعد توليده بالمغلف. إذا فشل `saved_books[0]`، فالملف يحوي بنية أعلى مستوى ليست قائمة.

### 4.3 تحقق من API القابل لإعادة الاستخدام

**✅ قائمة التحقق**

- ✅ `scrape_books_to_json(".../page-1.html", max_pages=3)` تُعيد 60 سجلًا *وتكتب* `books.json`.
- ✅ يعيد `json.load` قراءة نفس السجلات الستين وهم غير متصلين بالشبكة.
- ✅ الملف المحفوظ مقروء بشريًا ويبدو كقائمة كائنات كتب.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- المغلف يكتب ملفًا *ويعيد* بيانات. ما الحجة *ضد* إعادة البيانات عندما يكون الغرض الأساسي ملفًا على القرص — وما الذي كان مستدعيًا يريد الملف فقط أن يتوقعه كقيمة عودة هذه الدالة؟
- يخزّن حقل `url` في كل سجل الرابط المكتمل بالتسلسل. في سؤال سقراطي 2.1، قلِقنا على hrefs المطلقة مقابل النسبية. أين يظهر قرار التصميم ذلك الآن بعد أن تعيد تحميل `books.json` لاحقًا — ولماذا *تُخفي* مجموعة بيانات مخزَّنة هذه الأخطاء إذا كانت مطبوخة في الروابط أصلًا وقت التحليل؟

## الخطوة 5: حلّل مجموعة البيانات المكتشفة

الكشط نصف القيمة فقط؛ النصف الآخر الإجابة عن "ماذا إذن؟" تقرأ هذه الخطوة السجلات وتُنتج إحصائيات ملخّصة — التقييمات، ونطاقات الأسعار، والوفرة — بحراسات حذرة لبيانات مفقودة أو غير رقمية.

### 5.1 احسب الإحصائيات الملخّصة

**👟 تلميح البداية :** حوّل سلاسل الأسعار إلى أعداد عائمة دفاعًا، ومتوسط التقييمات، واحسب نسبة المتوفر — كلٌّ محروس حتى لا يقتل سجل سيئ الملخص.

```python
# scraper.py (continued)
def analyze_books(records: list[dict]) -> dict:
    """Generate summary statistics from scraped book data."""
    if not records:
        return {"error": "No books to analyze"}

    ratings = [b["rating"] for b in records if b["rating"] > 0]
    prices = []
    for b in records:
        try:
            prices.append(float(b["price"].replace("\u00a3", "")))
        except (ValueError, AttributeError):
            continue

    in_stock = sum(1 for b in records if "in stock" in b["availability"].lower())
    return {
        "total_books": len(records),
        "average_rating": round(sum(ratings) / len(ratings), 2) if ratings else 0,
        "price_min": min(prices) if prices else None,
        "price_max": max(prices) if prices else None,
        "price_avg": round(sum(prices) / len(prices), 2) if prices else None,
        "in_stock_percent": round(in_stock / len(records) * 100, 1),
    }

print(json.dumps(analyze_books(books), indent=2))
```

سطر السعر هو ما يستحق الجلوس عنده: `float(b["price"].replace("\u00a3", ""))`. خزّن الكاشط الأسعار كسلاسل حية مثل `"£51.77"`، فيحتاج التحليل إلى تجريد رمز الجنيه — مكتوبًا بهربه Unicode `\u00a3` ليكون صريحًا بشأن الحرف بالضبط — ثم حلّ الرقم. يعزل `try/except` سجلًا سيئًا واحدًا: سعر نجا من التحليل كـ `"N/A"` (بديل "المجهول" من الخطوة 2) يفشل في `float()` بنظافة ويُتخطَّى، لا أن يصبح قاتلًا. تُوسَّط التقييمات على الكتب التي تملك تقييمًا فعلًا فقط (`if b["rating"] > 0`)، وكل إجمالي قد يقسم على صفر يحمل حراسة `if ... else` — نفس الشكل الدفاعي الذي تدربت عليه في ميزانيات أداة تتبع المنح.

**🎯 الناتج المتوقع :** كتلة JSON تُبلِّغ `total_books` و`average_rating` وحد أدنى/أقصى/متوسط السعر و`in_stock_percent` — بأرقام حقيقية مشتقة من السجلات الستين المكتشفة (مثلًا `"total_books": 60`، `"in_stock_percent": 100.0`).

**🩹 إذا لم يعمل :** إذا كانت كل الأسعار `None`، ف`.replace("\u00a3", "")` لم يطابق رمز العملة الفعلي (ربما تستخدم بياناتك رمزًا مختلفًا) — اطبع `b["price"]` خامًا واحدًا وافحص بايتاته. إذا كانت `in_stock_percent` مريبة بـ 0.0، فمقارنة الأحرف الصغيرة لنص الوفرة لا تجد `"in stock"` — اطبع سلسلة وفرة عينة واضبط المطابقة. إذا حوّس سجل سيئ واضح التشغيل كله، فـ`try/except` حول `float()` مفقود — إنها الحراسة التي تحوّل صفًا سيئًا إلى تخطٍّ.

### 5.2 تحقق من التحليل

**✅ قائمة التحقق**

- ✅ تُعيد `analyze_books` مفاتيح الملخص الستة كلها، ولا يرفع أي منها على بيانات وسخة.
- ✅ الأسعار رقمية (min ≤ avg ≤ max)، والتقييمات تُوسَّط إلى رقم 1–5.
- ✅ قائمة سجلات فارغة تُعيد `{"error": "No books to analyze"}` بدلًا من الانهيار.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يتخطى الملخص الأسعار غير القابلة للتحليل بصمت. متى يكون التخطي الخيار الصادق، ومتى ينتج متوسطًا مضللًا بهدوء — ما الذي ستضيفه (عددًا من الصفوف المتخطاة، تحذيرًا) لتخبر قارئًا أن الرقم ليس مجموعة البيانات كاملة؟
- يقسم `in_stock_percent` على `len(records)`. لو تغيّر نص وفرة الموقع من `"In stock"` إلى `"Available"`، فُعدّ كل سجل غير متوفر بصمت. ما الذي يقترحه ذلك بشأن مطابقة السلاسل المختومة في خطوط التحليل، وكيف تجعل تعريف "المتوفر" ثابتًا واحدًا قابلًا للفحص؟

## ⚠️ المآزق الشائعة

- **كشط مواقع لا تريده.** القاعدة الأخلاقية ملموسة: تحقق من `robots.txt`، ولاحظ شروط استخدام الموقع، وأبقِ معدلك إنسانيًا. الإصلاح: يستهدف هذا المشروع books.toscrape.com *لأنه* مبني للتدرب؛ للأهداف الحقيقية، احترم الملف الموجود عند `/robots.txt` قبل كتابة محدّد واحد.
- **بلا تحديد معدل، أو محدّد مُتجاوز.** الطلب في حلقة ضيقة يجلب لك تحديد المعدل (429) أو حظرًا كاملًا، وفي النهاية سجلات مالك الموقع مشكلتك أنت. الإصلاح: اجعل `limiter.wait()` جزءًا من `fetch_page` نفسها (كما تفعل الخطوة 1) فيدفع *كل* مسار طلب الضريبة، لا فقط تلك التي تذكرت حراستها.
- **إعادة المحاولة على أخطاء دائمة.** 404 أو 403 نهائي؛ إعادة محاولته تهدر حصتك وتزعج الخادم. الإصلاح: انسحب فقط على 429 و5xx والمهلات وأخطاء الاتصال — وأعد رفع أي شيء آخر، تمامًا كما تتفرع `fetch_page`.
- **هشاشة محدّدات CSS.** إعادة تسمية صنف واحدة أو عنصر مفقود تعطي صفر سجلات أو تحطمًا. الإصلاح: احرس كل نتيجة `select_one` (نمط `if tag else default` في الخطوة 2)، وأعد التحقق ضد صفحة حية عندما يغيّر الموقع شكله.
- **تشوّه ترميز في النص المكتشط.** نص يُفك شفرة كـ`"Â£51.77"` بدلًا من `"£51.77"` يأتي من قراءة بايتات تحت تشفير خاطئ. الإصلاح: اعتمد على `response.text` في requests (الذي يستخدم مجموعة الأحرف التي يعلنها الخادم)، وإذا ظهر التشوّه رغم ذلك، فكّ الشفرة صراحةً (`response.content.decode("utf-8")`) وضع تحليلك حول الحرف الحقيقي.

## ما بنيته للتو

API كشط ويب صغير مهذب: عميل محدود المعدل يعيد المحاولة فقط على الإخفاقات العابرة، ومحلل محدّدات CSS يحوّل HTML إلى سجلات نظيفة، وزاحف ترقيم صفحات، ودالة `scrape_books_to_json` واحدة تُعيد مجموعة البيانات وتحفظها، ومرور تحليل على النتيجة. المهارة القابلة للنقل هي *جمع البيانات المسؤول*: تحويل صفحة عامة غير منظمة إلى سجلات منظمة وقابلة للتخزين والتحليل — مع معاملة الخادم كما تحب أن تُعامَل — هي المهارة الدقيقة خلف أجهزة تتبع الأسعار ومجمّعي لوحات الوظائف ومجموعات بيانات البحث.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/web-scraper-api/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/web-scraper-api) في مستودع الدورة يشحن الخط كاملًا مع تصدير CSV وخيار وكيل جاهز للتفعيل. استنسخه، أو افتح المستودع كاملًا في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وشغّله من هناك.
:::

## إلى أين تذهب من هنا

- استخرج **فئة الكتاب** من فتات الخبز في كل صفحة (`Home > Books > Travel`) وأضفها كحقل — `select` واحد على قائمة الفتات وتقسيم على فاصل `>` هو الميزة كلها.
- أضف **تصدير CSV** بجوار JSON: `csv.DictWriter` بحقول السجل الخمسة يعطيك جدولًا بيانات يمكن لأي شخص فتحه، وتقتبس وحدة `csv` العناوين المليئة بالفواصل لك.
- ادعم **الوكلاء ورؤوس إعادة المحاولة**: أعطِ `fetch_page` قاموس `proxies={"http": ..., "https": ...}` اختياريًا لـ `requests.get`، ونومًا يدرك `Retry-After` عند 429 — المقبضان اللذان يحولان كاشطًا إلى زاحف.
- لفّ الكل في **نقطة endpoint FastAPI**: `@app.get("/books")` تُعيد `scrape_books_to_json(...)` تحوّل دالتك إلى API HTTP حرفي يمكن لبرامج أخرى استدعاءه.

## شارك مشروعك مع الصف

بَنيت شيئًا تفتخر به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع قدّمها طلاب آخرون — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل: عمل fork للمستودع، وإنشاء فرع، والالتزام بملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في قراءة الويب مع Python. 🎓