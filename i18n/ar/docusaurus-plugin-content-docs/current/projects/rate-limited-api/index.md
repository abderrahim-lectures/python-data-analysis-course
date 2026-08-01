---
id: rate-limited-api
title: "بناء خدمة API محدودة المعدل"
sidebar_label: "بناء خدمة API محدودة المعدل"
slug: /projects/rate-limited-api
description: "انتقل من بيئة البرمجة داخل المتصفح إلى بايثون حقيقية: ابنِ خدمة FastAPI تغلّف مجموعة بياناتك الخاصة، مع مصادقة حقيقية بمفتاح API ومحدِّد معدل تبنيّه من الصفر."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 بناء خدمة API محدودة المعدل

<ProjectPublishedDate projectId="2027-rate-limited-api" />

<ProjectGreeting />

كل مشروع آخر في هذا القسم يبني *عميلًا* من نوع ما — سكربتًا أو وكيلًا يستدعي API شخصٍ آخر. هذا المشروع يقلب الأمر رأسًا على عقب: أنت تبني الـAPI. يُقيم هذا المشروع خدمة [FastAPI](https://fastapi.tiangolo.com/) حقيقية تغلّف مجموعة بيانات من بضع مئات من الاقتباسات والنكات تأتي مع المشروع، مع الأمرين اللذين يحتاجهما كل API عام حقيقي وتتجاهلهما الأمثلة التافهة عادة — مصادقة مفتاح API وتحديد المعدل — مبنيّين يدويًا، لا مستوردَين من مكتبة. يفترض المشروع إلمامًا بمستوى Python 101؛ لا شيء من تحليل البيانات مطلوب.

هذا المشروع اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/docs/projects) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. تثبيت `uv` وإعداد مشروع FastAPI محلي — لا حاجة إلى مفتاح API خارجي، إذ يوفّر المشروع مجموعة بياناته الخاصة.
2. تضمين مجموعة بيانات وبناء نقطتي نهاية `list`/`get` مقسّمتين إلى صفحات فوقها.
3. إضافة تصفية حسب الفئة والمؤلف باستخدام معاملات استعلام.
4. بناء إصدار مفاتيح API حقيقي وتبعية تتحقق من المفتاح على نقاط النهاية المحمية.
5. تنفيذ محدد معدل بنافذة منزلقة من الصفر وإرجاع استجابات حقيقية `429 Too Many Requests` مع ترويسة `Retry-After` بمجرد أن يتجاوز المفتاح حصته.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي والموصى به — فمغزى هذا المشروع برمّته تشغيل عملية خادم حقيقية طويلة الأمد وضربها بطلبات HTTP حقيقية، تمامًا كما يعمل أي API إنتاجي.

**GitHub Codespaces** يعمل جيدًا أيضًا: افتح [مستودع الدورة كاملًا في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython وuv مثبّتة بالفعل، وفق `.devcontainer/devcontainer.json` الخاص بالمستودع)، وشغّل الخادم بالطريقة نفسها التي ستعمل بها محليًا، ووجّه المنفذ إلى الأمام — عادةً يطلب Codespaces فعل ذلك تلقائيًا في اللحظة التي يبدأ فيها `uvicorn` بالاستماع. وبعد التوجيه، يمكنك تنفيذ `curl` عليه من طرفية جهازك الخاص، أو فتح صفحة `/docs` الخاصة بالعنوان الموجَّه في متصفح، تمامًا كما لو كان يعمل محليًا.

**أما دفاتر الملاحظات فهي مناسبة فعلًا هنا، بخلاف معظم مشاريع الخادم الطويلة الأخرى في هذه السلسلة** — مع تحفّظ واحد. لا يمكن لخلية دفتر ملاحظات أن تمسك منفذ استماع حقيقي بالطريقة التي تحصر بها Colab وKaggle وBinder الشبكات، لذا فهي خيار رديء *لتشغيل* `uvicorn` فعلًا وضربه عبر HTTP حقيقي. لكن FastAPI يشحن `TestClient` يخاطب كائن `app` الخاص بك مباشرة، داخل العملية، دون أي مقبس أو منفذ على الإطلاق — نفس المسارات ورموز الحالة والترويسات تمامًا، لكن استدعاءً لها كدوال بايثون بدل طلبات شبكة. هذا عرض توضيحي جيد بحق لمنطق التقسيم إلى صفحات والتصفية والمصادقة وتحديد المعدل، و[`examples/rate-limited-api/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/rate-limited-api/notebook.ipynb) يفعل ذلك بالضبط:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/rate-limited-api/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/rate-limited-api/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Frate-limited-api%2Fnotebook.ipynb)

عاملِ الدفتر كطريقة *لرؤية* سلوك الـAPI بسرعة، لا كبديل عن تشغيل `uvicorn` محليًا فعلًا وإطلاق طلبات حقيقية نحوه — الخطوات أدناه تفعل الشيء الحقيقي.

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

أغلق الطرفية وأعد فتحها، ثم تأكد من تثبيتها:

```bash
uv --version
```

ثم أنشئ مشروعًا وثبّت FastAPI وخادمًا لتشغيله:

```bash
uv init rate-limited-api
cd rate-limited-api
uv add fastapi "uvicorn[standard]"
```

لاحظ ما *ليس* هنا: لا مفتاح API لطلبه، لا تسجيل في مستوى مجاني، لا شيء لتكوينه قبل طلبك الأول. هذا المشروع يوفّر مجموعة بياناته ويصدر مفاتيحه الخاصة — أنت تبني الشيء الذي تستهلكه بقية المشاريع في هذه السلسلة.

## الخطوة 1: تضمين مجموعة البيانات وبناء نقاط نهاية أساسية

الـAPIs الحقيقية تخدم بيانات حقيقية. أنشئ `quotes_data.py` بمجموعة بيانات صغيرة مكتوبة يدويًا — قائمة بايثون عادية من القواميس كافية؛ لا قاعدة بيانات مطلوبة بعد:

```python
# quotes_data.py
_RAW_QUOTES = [
    # (text, author, category)
    ("Programs must be written for people to read, and only incidentally for machines to execute.", "Harold Abelson", "programming"),
    ("The unexamined life is not worth living.", "Socrates", "wisdom"),
    ("Why do programmers prefer dark mode? Because light attracts bugs.", "Anonymous", "humor"),
    # ... a few hundred more, spanning several categories
]

QUOTES = [
    {"id": i, "text": text, "author": author, "category": category}
    for i, (text, author, category) in enumerate(_RAW_QUOTES, start=1)
]

CATEGORIES = sorted({q["category"] for q in QUOTES})
```

اكتب ما تريد — بضع عشرات تكفي للبدء، واهدف إلى بضع مئات بحلول الوقت الذي تنتهي فيه، موزعة على ثلاث أو أربع فئات على الأقل. ثم أنشئ `main.py` بالتطبيق ونقطتي قراءة:

```python
# main.py
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel

from quotes_data import QUOTES

app = FastAPI(title="Quotes API")


class QuoteOut(BaseModel):
    id: int
    text: str
    author: str
    category: str


class QuotesPage(BaseModel):
    items: list[QuoteOut]
    total: int
    limit: int
    offset: int


@app.get("/quotes", response_model=QuotesPage)
def list_quotes(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> QuotesPage:
    page = QUOTES[offset : offset + limit]
    return QuotesPage(items=[QuoteOut(**q) for q in page], total=len(QUOTES), limit=limit, offset=offset)


@app.get("/quotes/{quote_id}", response_model=QuoteOut)
def get_quote(quote_id: int) -> QuoteOut:
    for quote in QUOTES:
        if quote["id"] == quote_id:
            return QuoteOut(**quote)
    raise HTTPException(status_code=404, detail=f"No quote with id {quote_id}.")
```

شغّله:

```bash
uv run uvicorn main:app --reload
```

ثم في طرفية أخرى:

```bash
curl "http://127.0.0.1:8000/quotes?limit=3"
curl "http://127.0.0.1:8000/quotes/1"
curl -i "http://127.0.0.1:8000/quotes/99999"   # a real 404
```

تقسيم `limit`/`offset` إلى صفحات هو النمط نفسه الكامن خلف نقطة قائمة كل API REST عام تقريبًا — إنه يحدّ من حجم البيانات التي يمكن لاستجابة واحدة إرجاعها (`le=100` هنا)، ويسمح للعميل بالمرور عبر مجموعة البيانات كاملة صفحةً صفحة باستخدام `total` ليعرف متى يتوقف.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يبدأ `uv run uvicorn main:app --reload` دون أخطاء.</StepChecklistItem>
<StepChecklistItem>يُرجع `GET /quotes?limit=3` 3 عناصر بالضبط و`total` مطابقًا لحجم مجموعة بياناتك الكاملة.</StepChecklistItem>
<StepChecklistItem>يُرجع `GET /quotes/{a-real-id}` ذلك الاقتباس؛ بينما يُرجع `GET /quotes/99999` خطأ `404` حقيقيًا، لا `500` ولا `200` فارغًا.</StepChecklistItem>
</StepChecklist>

**🤔 أسئلة سقراطية**

- لماذا نحدّ `limit` بـ100 (`le=100`) بدل السماح للعميل بطلب كل اقتباساتك في استجابة واحدة؟ ماذا سيفعل عميل ببطء في اتصاله، أو عميل خبيث، بشكل مختلف لو لم يكن هناك حد؟
- `get_quote` يمرّ على القائمة كاملة لإيجاد معرف واحد. مع بضع مئات من الاقتباسات يكون هذا فوريًا؛ مع بضعة ملايين لن يكون كذلك. ما بنية البيانات التي ستصيّر البحث بالمعرف سريعًا مهما بلغ حجم مجموعة البيانات؟

## الخطوة 2: إضافة التصفية

وسّع `list_quotes` بمعاملات استعلام اختيارية للفئة والمؤلف:

```python
@app.get("/categories", response_model=list[str])
def list_categories() -> list[str]:
    from quotes_data import CATEGORIES
    return CATEGORIES


@app.get("/quotes", response_model=QuotesPage)
def list_quotes(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    category: str | None = Query(default=None, description="Filter by exact category."),
    author: str | None = Query(default=None, description="Case-insensitive substring match on author."),
) -> QuotesPage:
    filtered = QUOTES
    if category is not None:
        filtered = [q for q in filtered if q["category"] == category]
    if author is not None:
        needle = author.lower()
        filtered = [q for q in filtered if needle in q["author"].lower()]

    page = filtered[offset : offset + limit]
    return QuotesPage(items=[QuoteOut(**q) for q in page], total=len(filtered), limit=limit, offset=offset)
```

```bash
curl "http://127.0.0.1:8000/quotes?category=science&limit=5"
curl "http://127.0.0.1:8000/quotes?author=sagan"
curl "http://127.0.0.1:8000/categories"
```

`total` في الاستجابة يعكس العدد *المصفّى*، لا مجموعة البيانات كاملة — وهذا مهم لعميل يحاول المرور عبر صفحات اقتباسات العلم فقط، إذ كان سيظنّ خلاف ذلك أن هناك صفحات متبقية أكثر بكثير مما هو موجود فعلًا.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يُرجع `?category=<a-real-category>` اقتباسات من تلك الفئة فقط، ويعكس `total` العدد المصفّى.</StepChecklistItem>
<StepChecklistItem>يطابق `?author=<partial-name>` دون تمييز بين الأحرف الكبيرة والصغيرة (مثلًا `sagan` يطابق `Carl Sagan`).</StepChecklistItem>
<StepChecklistItem>دمج `category` و`author` معًا يضيّق النتائج أكثر، لا واحدًا منهما فقط.</StepChecklistItem>
</StepChecklist>

**🤔 أسئلة سقراطية**

- ماذا يجب أن يُرجع `GET /quotes?category=nonexistent` — قائمة فارغة مع `total: 0`، أم `404`؟ ماذا بنيت، ولماذا يعدّ هذا هو الخيار الأكثر اتساقًا مع REST لنقطة نهاية *مجموعة* مقابل `GET /quotes/{id}` لعنصر واحد؟
- لو أضفت عامل تصفية ثانٍ يحتاج أيضًا "أيًّا من عدة قيم" (مثلًا فئات متعددة دفعة واحدة)، كيف توسّع معامل الاستعلام ليقبل قائمة؟

## الخطوة 3: إصدار مفاتيح API والتحقق منها

API حقيقي يحتاج إلى معرفة من يستدعيه. أضف إصدار مفاتيح ذاتي الخدمة وتبعية تتحقق من المفتاح على المسارات المحمية:

```python
import secrets

from fastapi import Depends, Header

_VALID_KEYS: set[str] = set()


class ApiKeyResponse(BaseModel):
    api_key: str


@app.post("/keys", response_model=ApiKeyResponse)
def issue_api_key() -> ApiKeyResponse:
    new_key = secrets.token_urlsafe(24)
    _VALID_KEYS.add(new_key)
    return ApiKeyResponse(api_key=new_key)


def require_api_key(x_api_key: str | None = Header(default=None)) -> str:
    if x_api_key is None or x_api_key not in _VALID_KEYS:
        raise HTTPException(status_code=401, detail="Missing or invalid API key. Get one from POST /keys.")
    return x_api_key


@app.get("/me")
def whoami(api_key: str = Depends(require_api_key)) -> dict:
    return {"api_key": api_key}
```

`secrets.token_urlsafe` — لا `random`، الذي ليس آمنًا تشفيريًا — يولّد مفتاحًا لا يستطيع أحد تخمينه. `Depends(require_api_key)` هو نظام حقن التبعية في FastAPI: أي مسار يأخذ `api_key: str = Depends(require_api_key)` كمعامل يشغّل `require_api_key` أولًا، ولا يتابع إلا إذا عاد بنجاح بدل أن يرفع استثناء.

```bash
curl -i "http://127.0.0.1:8000/me"                                   # 401, no key
curl -X POST "http://127.0.0.1:8000/keys"                            # {"api_key": "..."}
curl -i -H "X-API-Key: <your-key>" "http://127.0.0.1:8000/me"        # 200
```

:::tip[مخزن المفاتيح في الذاكرة هذا ينسى كل شيء عند إعادة التشغيل، وهذا جيد هنا]
`_VALID_KEYS` يعيش في `set` بايثون عادي في ذاكرة هذه العملية — أعد تشغيل الخادم وسيتوقف كل مفتاح أصدرته سابقًا عن العمل. منتج حقيقي سيبقي المفاتيح في قاعدة بيانات (ويخزّن *تجزئة* كل مفتاح، لا القيمة الخام، بنفس الطريقة التي تُجزَّأ بها كلمات المرور — حتى لا يسرّب تسريب قاعدة البيانات مفاتيح قابلة للاستخدام مباشرة). لمشروع تعلّم محلي، النسخة الذاكرية صادقة وكافية؛ فقط لا تتفاجأ عندما يتوقف مفتاحك عن العمل بعدما يعيد `--reload` تشغيل العملية.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يُرجع `GET /me` دون ترويسة `X-API-Key` خطأ `401` حقيقيًا، بجسم يقول كيف تحصل على مفتاح.</StepChecklistItem>
<StepChecklistItem>يُرجع `POST /keys` مفتاحًا جديدًا في كل مرة تستدعيه.</StepChecklistItem>
<StepChecklistItem>يُرجع `GET /me` بمفتاح صالح في `X-API-Key` رمز `200`؛ وبمفتاح مختلق ما زال يُرجع `401`.</StepChecklistItem>
</StepChecklist>

**🤔 أسئلة سقراطية**

- يقرأ `require_api_key` المفتاح من ترويسة `X-API-Key` مخصصة بدل معامل استعلام (`?api_key=...`). معاملات الاستعلام تنتهي عادةً في سجلات وصول الخادم وسجل المتصفح. ماذا يقترح ذلك بشأن النهج الأكثر أمانًا لقيمة سرية؟
- الآن يستطيع أي شخص استدعاء `POST /keys` عدد ما يشاء من المرات دون أي حد إطلاقًا. هل هذه مشكلة في *هذا* المشروع؟ ماذا ستضيف لو كانت خدمة عامة حقيقية؟

## الخطوة 4: تحديد معدل حقيقي

هذه هي الغاية الفعلية من المشروع. ابنِ محدد معدل بنافذة منزلقة يتتبّع الطوابع الزمنية لطلبات كل مفتاح الأخيرة ويرفض الطلبات بمجرد أن يتجاوز المفتاح حصته داخل النافذة:

```python
# rate_limit.py
import time
from collections import defaultdict, deque


class SlidingWindowRateLimiter:
    def __init__(self, max_requests: int, window_seconds: float) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._history: dict[str, deque[float]] = defaultdict(deque)

    def check(self, key: str, now: float | None = None) -> tuple[bool, float]:
        now = time.monotonic() if now is None else now
        history = self._history[key]

        cutoff = now - self.window_seconds
        while history and history[0] <= cutoff:
            history.popleft()

        if len(history) < self.max_requests:
            history.append(now)
            return True, 0.0

        retry_after = history[0] + self.window_seconds - now
        return False, max(retry_after, 0.0)
```

لكل مفتاح `deque` خاص به من الطوابع الزمنية، الأقدم أولًا. عند كل فحص، تُسقَط الطوابع الأقدم من `window_seconds` من اليسار قبل عدّ ما تبقى — هذه نافذة منزلقة **دقيقة**، لا تقريب مقسّم يعيد الضبط عند حد ساعة ثابت. هذا التمييز مهم: محدد *النافذة الثابتة* (قل "أعد ضبط العداد كل 10 ثوانٍ على الساعة") يسمح للعميل بأن يطلق حصته الكاملة في نهاية نافذة وحصته الكاملة مجددًا في بداية التالية، ليصل إلى ضعف معدله المقصود في ثوانٍ حقيقية قليلة. تتبّع الطوابع الزمنية الفعلية يتجنّب ذلك.

اربطه في تبعية واستخدمه على `/me`:

```python
from fastapi import Response

RATE_LIMIT_MAX_REQUESTS = 5
RATE_LIMIT_WINDOW_SECONDS = 10.0
limiter = SlidingWindowRateLimiter(RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_SECONDS)


def enforce_rate_limit(response: Response, api_key: str = Depends(require_api_key)) -> str:
    allowed, retry_after = limiter.check(api_key, now=time.monotonic())
    if not allowed:
        retry_after_seconds = str(int(retry_after) + 1)
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded: max {RATE_LIMIT_MAX_REQUESTS} per {int(RATE_LIMIT_WINDOW_SECONDS)}s.",
            headers={"Retry-After": retry_after_seconds},
        )
    response.headers["X-RateLimit-Limit"] = str(RATE_LIMIT_MAX_REQUESTS)
    return api_key


@app.get("/me")
def whoami(api_key: str = Depends(enforce_rate_limit)) -> dict:
    return {"api_key": api_key}
```

لاحظ أن الترويسات تُضبط بطريقتين مختلفتين حسب النتيجة — ليس هذا خيارًا أسلوبيًا، بل ضرورة. أطلق ستة طلبات متتالية بنفس المفتاح:

```bash
KEY=$(curl -s -X POST "http://127.0.0.1:8000/keys" | python3 -c "import sys,json;print(json.load(sys.stdin)['api_key'])")
for i in 1 2 3 4 5 6; do curl -s -o /dev/null -w "%{http_code}\n" -H "X-API-Key: $KEY" "http://127.0.0.1:8000/me"; done
```

يجب أن تطبع الخمسة الأولى `200`؛ والسادسة `429`. افحص الترويسات على الأخيرة:

```bash
curl -i -H "X-API-Key: $KEY" "http://127.0.0.1:8000/me"
```

:::tip[ترويسات HTTPException، لا `response.headers`، في مسار الخطأ]
يغري ضبط `response.headers["Retry-After"] = ...` مباشرة قبل رفع `HTTPException`، بنفس الطريقة التي يضبط بها مسار النجاح `X-RateLimit-Limit`. لا تفعل — عندما يحوّل FastAPI `HTTPException` مرفوعة إلى استجابة HTTP فعلية، يبني كائن **استجابة جديدًا** من الاستثناء، متجاهلًا ما كُتب في معامل `response` المحقون على الطريق. أي ترويسة تريد ظهورها على استجابة خطأ يجب تمريرها إلى `HTTPException(..., headers={...})` مباشرة، وإلا فلن تصل إلى العميل بصمت. هذا عضّ النسخة الأولى من كود المثال الخاص بهذه الدرس — تحقق مع `curl -i` من أن `429` يحمل فعلًا `Retry-After`، ولا تثق بأن ضبط `response.headers` عمل.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>تنجح أول `RATE_LIMIT_MAX_REQUESTS` طلبات من مفتاح واحد داخل النافذة برمز `200`.</StepChecklistItem>
<StepChecklistItem>يُرجع الطلب التالي من نفس المفتاح، ما زال داخل النافذة، خطأ `429` حقيقيًا.</StepChecklistItem>
<StepChecklistItem>تحمل استجابة `429` ترويسة `Retry-After` فعلًا — تحقّق منها بـ`curl -i`، لا افتراضًا.</StepChecklistItem>
<StepChecklistItem>الانتظار حتى انتهاء النافذة ثم إعادة المحاولة ينجح مجددًا (الحدّ ليس دائمًا).</StepChecklistItem>
</StepChecklist>

**🤔 أسئلة سقراطية**

- لماذا نسند تاريخ محدد المعدل إلى مفتاح API بدل عنوان IP؟ ماذا سيتغير (للأفضل أو للأسوأ) لو أسندته إلى IP، خصوصًا للعملاء خلف NAT شركوي مشترك؟
- تأخذ دالة `check` في المحدد `now` كمعامل اختياري بدل استدعاء `time.monotonic()` داخليًا دائمًا. ماذا يشتري لك ذلك عند كتابة اختبار له — جرّب كتابة اختبار يزيف مرور الوقت دون `time.sleep()` فعلي.

:::tip[هذا محدد بمقياس لعبة عن قصد — للإنتاج إجابة حقيقية]
`SlidingWindowRateLimiter` صحيح فعلًا، لكنه أيضًا أحادي العملية فعلًا: الحالة تعيش في قاموس بايثون واحد، في عامل `uvicorn` واحد. شغّله خلف عاملين، أو خلف نسختين من الخادم خلف موازن تحميل، وسيتتبّع كلٌّ منهما عدده المستقل للمفتاح نفسه — يمكن للعميل أن يصل إلى معدل يفوق المقصود بعدد النسخ. تحديد المعدل الإنتاجي لخدمة متعددة النسخ ينقل هذه الحالة دائمًا تقريبًا إلى شيء مشترك، مثل Redis (`INCR` مع `TTL` لبنة بناء شائعة)، حتى ترى كل نسخة العدد نفسه. توجد مكتبات مثل [`slowapi`](https://github.com/laurentS/slowapi) تحديدًا لتغليف هذا النمط في ديكوراتور — جديرة بالمعرفة، حتى وإن بنى هذا الدرس الجزء المثير يدويًا عن قصد بدل استيراده.
:::

## ⚠️ مطبّات شائعة

- **ضبط ترويسات على `response` قبل رفع `HTTPException`.** كما ورد أعلاه — إنها تُتجاهل. مرّرها إلى `HTTPException(headers={...})` بدل ذلك.
- **الظن بأن فحوصات أسلوب `raise_for_status` لا تنطبق هنا إطلاقًا — هذا المشروع هو الخادم، لا العميل.** من السهل إضافة معالجة أخطاء لـ*استدعاء* API ردًا على ذلك بينما غاية هذا المشروع *أن يكون* API؛ الأخطاء المهمة هنا هي التي تُرجعها نقاط نهايتك أنت إلى المستدعين (`401`, `404`, `429`)، لا ما تستقبله أنت.
- **استخدام `random` بدل `secrets` لمفاتيح API.** `random` ليس آمنًا تشفيريًا ويمكن التنبؤ بناتجه من حيث المبدأ — `secrets.token_urlsafe()` مبني تحديدًا لرموز حسّاسة أمنيًا مثل هذا.
- **اختبار تحديد المعدل بطلبات متباعدة ثانية أو أكثر يدويًا.** كتابة أوامر `curl` واحدًا تلو الآخر، منتظرًا كل نتيجة، تأخذ وقتًا أطول بسهولة من نافذة معدل قصيرة — النافذة تظل منزلقة ولن ترى `429` أبدًا. أطلق عدة طلبات متتالية (حلقة shell، أو سكربت بايثون قصير) بدل ذلك.
- **حد معدل منخفض جدًا يمنع التصفّح العادي لـ`/quotes` أثناء الاختبار.** يضع هذا الدرس محدد المعدل على `/me` فقط عن قصد، لا على نقطتي `/quotes` المفتوحتين، حتى تتصفّح مجموعة البيانات بحرية أثناء اختبار المصادقة والتحديد منفصلَين. ضع في اعتبارك هذا الفصل إن وسّعت المشروع.

## ما بنيته للتو

API REST حقيقي: نقطتا قائمة وتفاصيل مقسّمتان إلى صفحات وقابلة للتصفية فوق مجموعة بيانات كتبتها بنفسك، وإصدار مفاتيح API ذاتي الخدمة، وتبعية تفرض المصادقة فعلًا، ومحدد معدل بنيته سطرًا سطرًا بدل استيراده — منطق نافذة منزلقة، واستجابات `429`، وترويسة `Retry-After` صحيحة ضمنًا. هذا هو نفس شكل تصميم مفتاح-API-زائد-حد-معدل الذي تستخدمه الـAPIs العامة الحقيقية في كل مكان، دون خدمة طرف ثالث تقف خلفه.

## إلى أين من هنا

- أبقِ مفاتيح API (مجرّدة، لا خام) وعدادات تحديد المعدل في مخزن بيانات حقيقي — SQLite للمفاتيح، وRedis لعدادات المعدل — حتى ينجو كلاهما من إعادة التشغيل ويعملان صحيحًا عبر أكثر من عملية خادم واحدة.
- أضف مستويات محدِّد معدل لكل مفتاح (مفتاح "مجاني" يحصل على 5 طلبات كل 10 ثوانٍ، ومفتاح "مُحترف" على 50) بتخزين مستوى إلى جانب كل مفتاح مُصدَر والبحث عنه داخل `enforce_rate_limit`.
- انشر هذا فعليًا في مكان يمكن الوصول إليه من خارج جهازك (استضافة صغيرة دائمة التشغيل، أو منصة serverless تدعم تطبيقات ASGI) وضُرب من هاتف أو جهاز صديق — مشروع مثل هذا لا يكتمل إلا حين يستطيع شيء غير `localhost` استدعاءه.

## شارك مشروعك مع الصف

بنيت شيئًا تفخر به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع قدّمها طلاب آخرون — ويرشدك ملف README الخاص به خطوة بخطوة، صديقٌ للمبتدئين تمامًا، لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل: نسخ المستودع، وإنشاء فرع، وتنفيذ الالتزام بملفاتك، وفتح الـPR، خطوةً خطوة. لا يفترض أي خبرة سابقة بـgit.

مرحبًا بك في كتابة بايثون خارج المتصفح. 🎓

<ProjectProgressCheckbox projectId="2027-rate-limited-api" />
