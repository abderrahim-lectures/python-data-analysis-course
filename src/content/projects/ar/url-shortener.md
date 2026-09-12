---
title: "API اختصار الروابط"
description: "بناء خدمة اختصار روابط مع تحليلات ، تتبع النقرات والمراجع والبيانات الجغرافية."
difficulty: "intermediate"
estimatedMinutes: 70
tags: ["api", "database", "sqlite"]
learningObjectives:
  - نموذج الروابط والنقرات في مخطط SQLite
  - "ولّد رموزًا قصيرة بلا تعارض باستخدام base62"
  - فكّ الرموز إلى عناوين وسجّل أحداث النقر
  - "استعلم عن تحليلات النقر: الإجماليات والمصادر والسلاسل اليومية"
  - وفّر طبقة FastAPI بمسارات للاختصار وإعادة التوجيه والتحليلات
prerequisites:
  - "Python basics (functions, dictionaries, exceptions)"
  - "REST API basics: routes, status codes, JSON"
  - "Installing packages with uv"
---

# 🛠️ 🔗 اعِد واجهة برمجة تطبيقات لاختصار الروابط

كل رابط تشاركه في محادثة سلسلة قصيرة تخفي سلسلة أطول ، وإعادة توجيه تخبر مالكه بالضبط كم مرة، ومن أين، وفي أي يوم نُقر. يبني هذا المشروع الخدمة من النهاية إلى النهاية: أكواد قصيرة base62 مخزنة في SQLite، ونقرة تُسجَّل عند كل إعادة توجيه، وتحليلات يمكنك الاستعلام عنها، وأخيرًا طبقة FastAPI حقيقية لتتمكن من `curl` مختصرك. إنها خدمة صغيرة لكنها مكتملة مدعومة بقاعدة بيانات ، الشكل الكامن خلف خدمات إنتاج كثيرة.

يُفترض أساسيات بايثون ولمسة خفيفة من REST APIs و`curl` ، لا شيء من مادة تحليل البيانات مطلوب. هذا اختياري وغير مُقيَّم؛ راجع [المشاريع الواقعية](/ar/مشاريع) للقائمة الكاملة المتنامية.

## 🎯 ما ستفعله

1. صمّم مخطط SQLite للروابط وأحداث النقرات.
2. ولّد أكوادًا قصيرة خالية من التصادم بـ base62.
3. حلّ كودًا إلى رابطه مع تسجيل نقرة.
4. استعلم تحليلات لكل رابط ، الإجماليات، والمرجعيات، وسلسلة يومًا بيوم.
5. لفّها كلها في خدمة FastAPI يمكنك استدعاؤها بـ `curl`.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي. المختصر *خادم*: يحتاج ربط منفذ والإجابة عن طلبات HTTP، وهو ما يفعله `uvicorn` على جهازك جيدًا. خطوات المحرك (1–4) تعمل بشكل ممتاز في أي مكان، لكن حلقة `curl` في الخطوة 5 تريد خادمًا حقيقيًا يعمل.

**Google Colab و Kaggle Notebooks و Binder** تشغّل المحرك كله (يعيش SQLite بسعادة في دفتر، والدفتر المثالي حتى يمرّن الـ API عبر `TestClient` الخاص بـ FastAPI دون ربط منفذ). التنبيه الصادق: الدفتر مسار تجربة لـ*الخدمة* ، لن تترك خادمًا يعمل طويلًا هناك، وملف SQLite مؤقت. استخدم الشارات لتجربة المحرك + test-client، وشغّل `uvicorn` محليًا عندما تريد الشيء الحقيقي.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/url-shortener/notebook.ar.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/url-shortener/notebook.ar.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Furl-shortener%2Fnotebook.ar.ipynb)

## الإعداد

أنشئ المشروع وثبّت طبقة الويب. يستخدم المحرك `sqlite3` المرفق مع بايثون.

```bash
uv init url-shortener
cd url-shortener
uv add fastapi uvicorn
```

```bash
uv run python -c "import fastapi, sqlite3; print('ok')"
```

`sqlite3` قاعدة بيانات المحرك ، قاعدة SQL كاملة في ملف واحد، بلا خادم لتثبيته. يبني `fastapi` مسارات HTTP بتحقق يقوده النوع، و`uvicorn` الخادم ASGI الذي يربط المنفذ فعليًا ويجيب `curl`.

**✅ قائمة التحقق**

- ✅ `uv add fastapi uvicorn` انتهى وطبع فحص الاستيراد `ok`.
- ✅ مشروع `url-shortener/` جديد موجود بملف `pyproject.toml`.

## الخطوة 1: صمّم مخطط SQLite

المختصر يخزّن شيئين: خريطة الكود → الرابط، وكل نقرة *على* ذلك الكود. جدول `links` واحد، وجدول `clicks` واحد، ومفتاح خارجي بينهما.

### 1.1 أنشئ المخطط ودالة مساعدة للاتصال

**👟 تلميح البداية :** اتصل عبر دالة مساعدة صغيرة `get_conn()` مع `row_factory = sqlite3.Row`، وأنشئ الجدولين بـ `init_db()` باستخدام `CREATE TABLE IF NOT EXISTS` فيكون الاستدعاء المتكرر آمنًا.

```python
# shortener.py
import sqlite3
from contextlib import closing
from datetime import datetime

DB = "shortener.db"

def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn

def init_db() -> None:
    with closing(get_conn()) as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS links (
                code       TEXT PRIMARY KEY,
                url        TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS clicks (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                code       TEXT NOT NULL,
                clicked_at TEXT NOT NULL,
                referrer   TEXT
            );
            """
        )

init_db()
print("tables ready")
```

`row_factory = sqlite3.Row` سطر جودة الحياة: تعود نتائج الاستعلام كصفوف شبه قاموسية (`row["url"]`) بدلاً من توبلات مجهولة، فتقرأ تحليلات الخطوة 4 مثل بايثون، لا كخليط من المواضع. `code TEXT PRIMARY KEY` يجعل الكود المفتاح الطبيعي ، تريد أن تكون تصادمات الإدراج ظاهرة. التزايد الذاتي `clicks.id` منفصل، لأن رابطًا واحدًا ينال نقرة بعد نقرة والنقرة ليست رابطًا. لفّ كل شيء في `closing(get_conn())` يضمن إغلاق الاتصال حتى إذا رفع استعلام استثناء.

**🎯 الناتج المتوقع :** يطبع `tables ready`، ويظهر ملف `shortener.db` في مجلد المشروع. تشغيله مجددًا يطبع السطر نفسه دون خطأ.

**🩹 إذا لم يعمل :** إذا رفع التشغيل الثاني `OperationalError: table already exists`، فجمل `IF NOT EXISTS` مفقودة. إذا أساء `row["url"]` التصرف لاحقًا، فـ `row_factory` مضبوط لكل اتصال ، تحقق أنه داخل `get_conn()`، لا في دالة استدعاء واحدة فقط. إذا ظهر الملف في مكان آخر، فالاتصال يستخدم مسارًا نسبيًا ودليل عمل الحالي مختلف ، اطبع `DB` للتأكيد.

### 1.2 تحقق من المخطط

**✅ قائمة التحقق**

- ✅ تشغيل `init_db()` مرتين غير ضار.
- ✅ `shortener.db` موجود، و`sqlite3 shortener.db '.tables'` يسرد `clicks` و`links`.
- ✅ يمكنك تسمية أعمدة `links` الثلاثة وأعمدة `clicks` الأربعة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- جدول النقرات يخزّن `code` لكن لا الرابط نفسه. ماذا تشتري لك هذه الفكرة التصميمية، وما الذي يجب أن يظل صحيحًا حول قيم `code` ليكون الربط موثوقًا؟
- `clicks.id` بـ `AUTOINCREMENT` بينما `links.code` مفتاح أساسي نصي. متى يكون المعرّف الصحيح أساسيًا، ومتى يكون مفتاح سلسلة طبيعية (مثل `code`) الخيار الأكثر صدقًا؟

## الخطوة 2: ولّد أكوادًا قصيرة وأنشئها

الأكواد القصيرة تأتي من العدّ: كل رابط جديد يحصل على الرقم التالي، ويشفّره base62 إلى سلسلة قصيرة آمنة للـ URLs (`1`، `2`، …، `a`، `b`، …). تضيف هذه الخطوة المشفّر ودالة `create_link`.

### 2.1 اكتب ترميز base62 و`create_link`

**👟 تلميح البداية :** استخدم أبجدية من 62 رمزًا، و`divmod` لاختزال أي عدد صحيح إلى أرقام base62، واشتق الكود التالي من عدد صفوف الجدول الحالي حتى لا يتصادم أبدًا.

```python
# shortener.py (continued)
ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

def encode_base62(n: int) -> str:
    if n == 0:
        return ALPHABET[0]
    chars = []
    while n > 0:
        n, remainder = divmod(n, 62)
        chars.append(ALPHABET[remainder])
    return "".join(reversed(chars))

def create_link(url: str, custom: str | None = None) -> str:
    with closing(get_conn()) as conn:
        if custom is None:
            row = conn.execute("SELECT COUNT(*) FROM links").fetchone()
            code = encode_base62(row[0] + 1)
        else:
            code = custom
        conn.execute(
            "INSERT INTO links (code, url, created_at) VALUES (?, ?, ?)",
            (code, url, datetime.now().isoformat(timespec="seconds")),
        )
    return code

print(create_link("https://example.com/very/long/path"))
print(create_link("https://python.org", custom="py"))
for i in range(1, 140):
    assert len(encode_base62(i)) <= 2
print("first 138 codes fit in 2 chars")
```

`divmod(n, 62)` هو الخوارزمية كلها: يستخرج رقم base62 واحدًا لكل دورة (`remainder`) ويصغّر `n` بمعامل 62، حتى يصير صفرًا ، نفس رياضيات "الترحيل" خلف العدّ في أي أساس. عكس الأرقام المجمّعة يضع الأكثر أهمية أولًا، فيطابق ترتيب الأكواد الترتيب العددي. `SELECT COUNT(*) from links` مصدر معرف بسيط عن قصد: متزايد رتيبًا مع إضافة روابط، وبالتالي لا يتصادم مع الكود `A`. العائد الحقيقي لـ base62 الكثافة ، 138 رابطًا تتسع في حرفين، وحلقة `assert` تثبتها تجريبيًا.

**🎯 الناتج المتوقع :** `A`، ثم `py`، ثم تمر حلقة `assert` بصمت (138 كودًا ≤ حرفان) ، بلا انهيارات.

**🩹 إذا لم يعمل :** إذا عادت الأكواد بترتيب خاطئ (`B` قبل `A`)، فـ `reversed(chars)` مفقود. إذا ظهر `A` نفسه مرتين، فـ `COUNT(*)` يقرأ من الجدول الخاطئ أو الرقم لا يُزاد بـ 1. إذا تصادم كود مخصص، يهرب `sqlite3.IntegrityError` دون معالجة ، سيحتاج مسار الخطوة 5 إلى التقاطه، لكن على مستوى المحرك، ذلك الخطأ *هو* إشارة "مأخوذ" الصادقة.

### 2.2 تحقق من توليد الأكواد

**✅ قائمة التحقق**

- ✅ الأكواد base62: حروف أولًا، أرقام لاحقًا، وآمنة للـ URLs.
- ✅ أول 138 كودًا في حرفين أو أقل، وأكواد 62²+ لا تزال تعمل إذا أدرجت هذا العدد.
- ✅ الأكواد المخصصة تُدرج كما هي دون مسّ العدّاد.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- الأكواد مشتقة من *عدد الروابط الموجودة*، فحذف رابط لا يستعيد كوده. هل هذا خطأ أم خاصية متعمدة، وماذا سيكسر `encode_base62(COUNT(*)+1)` إذا حُذفت أكواد يومًا ما؟
- الأبجدية تبدأ بحروف كبيرة. كيف يتغير ترتيب الأكواد إذا أعدت ترتيب الأبجدية (حروف صغيرة أولًا)، وهل يعتمد أي شيء من الأسفل على ذلك الترتيب؟

## الخطوة 3: حلّ الأكواد إلى روابط وتتبّع النقرات

مختصر لا يعدّ النقرات نصف خدمة. تحل هذه الخطوة كودًا إلى رابطه ، العملية التي تؤديها إعادة التوجيه ، وتسجّل صف نقرة واحدًا لكل حلّ، فلتحليلات الخطوة 4 بيانات حقيقية.

### 3.1 اكتب `resolve_url`

**👟 تلميح البداية :** اقرأ الرابط للكود؛ إذا وجد، أدرج صف نقرة بطابع زمني وإحالة يقدمها المتصل، وأعِد الرابط. إذا لم يوجد، أعد `None` ليتمكن المتصل من رفع 404.

```python
# shortener.py (continued)
def resolve_url(code: str, referrer: str | None = None) -> str | None:
    with closing(get_conn()) as conn:
        row = conn.execute(
            "SELECT url FROM links WHERE code = ?", (code,)
        ).fetchone()
        if row is None:
            return None
        conn.execute(
            "INSERT INTO clicks (code, clicked_at, referrer) VALUES (?, ?, ?)",
            (code, datetime.now().isoformat(timespec="seconds"), referrer),
        )
    return row["url"]

# simulate a redirect being hit three times
resolve_url("A")
resolve_url("A", referrer="x.com")
resolve_url("A")
print("clicks:", resolve_url("missing-code"))
```

الترتيب هو التصميم: *ابحث، سجّل، أعد*. البحث أولًا يسمح لكود سيئ بإعادة `None` مبكرًا دون تلويث جدول النقرات؛ التسجيل *داخل* الاتصال نفسه يضمن أن ترى النقرة والقراءة البيانات نفسها؛ وإعادة الرابط هو ما سيسلّمه معالج إعادة التوجيه إلى `RedirectResponse`. معامل الإحالة تمرّره طبقة HTTP، لا يُخمَّن هنا، فيحمل كل صف نقرة من أرسل الزائر.

**🎯 الناتج المتوقع :** `clicks: None` ، استدعاءات `resolve_url("A")` الثلاثة سجّلت ثلاثة صفوف نقرات، وأعاد `resolve_url("missing-code")` `None` بدلاً من الانهيار.

**🩹 إذا لم يعمل :** إذا انهار كود سيئ بخطأ KeyError أو مشابه، فالدالة تُفهرس `row["url"]` قبل فحص `row is None`. إذا لم تتراكم النقرات في الجدول، فـ `INSERT` يفتقد مسار الالتزام (إدراج `conn.execute` بسيط داخل `closing` يلتزم عند الإغلاق ، أسقط سياق الاتصال فتُرجع بصمت). إذا غيّر `resolve_url` قاعدة البيانات المشتركة أثناء استدعاء *البحث*، فعندك `UPDATE` بدلاً من `INSERT` في مسار النقرات.

### 3.2 تحقق من الحلّ وتتبّع النقرات

**✅ قائمة التحقق**

- ✅ الأكواد السيئة تعيد `None`؛ والأكواد الجيدة تعيد الرابط المخزّن.
- ✅ كل حلّ جيد يضيف صفًا واحدًا بالضبط إلى `clicks`.
- ✅ إحالة مخزنة تصل إلى عمود `referrer` عند توفيرها.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- عدّ النقرات *داخل* حلّ إعادة التوجيه يعني أن كل إعادة توجيه تحتاج كتابة قاعدة بيانات. ماذا يتغير بشأن زمن الاستجابة تحت حركة مرور كثيفة ، وما استراتيجية التجميع أو التخزين المؤقت التي ستضيفها خدمة بمليون نقرة يوميًا أولًا؟
- الإحالة تأتي من المتصل. يمكن لمتصل خبيث تزوير `referrer="victim.example"`. ماذا تفعل خدمة اختصار روابط حقيقية حيال ذلك، وماذا ستطبع في التحليلات إذا اهتممت؟

## الخطوة 4: استعلم تحليلات النقرات

الآن العائد الحقيقي: اجمع النقرات المسجّلة في الأرقام الثلاثة التي يسألها مسوّق فعلاً ، الإجمالي، والمرجعيات، وسلسلة يومًا بيوم ، مباشرة من SQL دون حلقة بايثون فوق البيانات.

### 4.1 اكتب استعلام التحليلات

**👟 تلميح البداية :** شغّل ثلاثة تجميعات SQL مفاتيحها `code`: `COUNT(*)`، و`GROUP BY referrer ORDER BY count`، واقتطاع نصي `substr(clicked_at,1,10)` لسلسلة الأيام.

```python
# shortener.py (continued)
def click_stats(code: str) -> dict:
    with closing(get_conn()) as conn:
        total = conn.execute(
            "SELECT COUNT(*) FROM clicks WHERE code = ?", (code,)
        ).fetchone()[0]
        referrers = conn.execute(
            "SELECT referrer, COUNT(*) AS n FROM clicks "
            "WHERE code = ? GROUP BY referrer ORDER BY n DESC LIMIT 10",
            (code,),
        ).fetchall()
        per_day = conn.execute(
            "SELECT substr(clicked_at, 1, 10) AS day, COUNT(*) AS n "
            "FROM clicks WHERE code = ? GROUP BY day ORDER BY day",
            (code,),
        ).fetchall()
    return {
        "code": code,
        "total_clicks": total,
        "top_referrers": [dict(r) for r in referrers],
        "clicks_per_day": [dict(r) for r in per_day],
    }

print(click_stats("A"))
```

ثلاثة تجميعات بشكل واحد. `total` هو الرقم الرئيسي؛ و`GROUP BY referrer … ORDER BY n DESC` يرتّب من أين تأتي الحركة؛ و`substr(clicked_at, 1, 10)` يقتطع طابع ISO إلى تاريخه (`2026-09-06`) ، الطريقة الأرخص للحصول على سلسلة أيام دون دالة تاريخ، ويسعد SQLite بـ `GROUP BY` على النص. كل صف نتيجة هو `dict(r)` فيكون الناتج قواميس قابلة للتسلسل JSON مباشرة، جاهزة لـ API الخطوة 5.

**🎯 الناتج المتوقع :** قاموس بـ `total_clicks` = 3 للكود `A`، وإدخالي مرجعية (`x.com` ثم دلو-`None`)، وقائمة `clicks_per_day` بصف يومي واحد يعدّ الثلاثة كلها.

**🩹 إذا لم يعمل :** إذا بقي `total_clicks` صفرًا، فإدراج الخطوة 3 لا يلتزم (انظر مأزق الخطوة 3). إذا أظهر `referrer` صف `None` يرفض التجمع مع الآخرين، فـ `GROUP BY referrer` يعامل `NULL` في SQL تمييزًا عن السلسلة الفارغة ، ادمج بـ `IFNULL` إذا أردت دمجهما. إذا وضعت سلسلة الأيام كل شيء في يوم واحد، فـ `substr(clicked_at,1,10)` يقطع صيغة خاطئة.

### 4.2 تحقق من التحليلات

**✅ قائمة التحقق**

- ✅ `click_stats("A")` تعيد الإجمالي والمرجعيات العلوية وسلسلة أيام للنقرات الثلاث المسجّلة.
- ✅ كل عدّ مرجعية يطابق عدد استدعاءات `resolve_url` بتلك الإحالة.
- ✅ القاموس المعاد يتحول إلى JSON دون مسلسل مخصص.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- شرائح `referrer` ، بما فيها `NULL` ، تتسرب إلى التحليلات. ماذا يعني صف `GROUP BY referrer` بقيمة `null: 0`، وهل ستُخفي *ذلك* الصف أم تسميه للمستخدم؟
- هذه التجميعات الثلاثة تعمل كثلاث استعلامات منفصلة. أي `GROUP BY` + `UNION` واحد يمكن أن ينتج الثلاثة، ومتى يستحق التعقيد الإضافي في SQL الجولة الواحدة؟

## الخطوة 5: اعرضها كخدمة FastAPI

المحرك مكتمل ، الآن يصبح شيئًا يمكنك `curl` له. تغلّف هذه الخطوة العمليات الثلاث في مسارات HTTP: `POST /shorten`، و`GET /u/{code}` (الذي يعيد التوجيه ، ويسجّل النقرة)، و`GET /analytics/{code}`.

### 5.1 اكتب تطبيق FastAPI

**👟 تلميح البداية :** ابنِ المسارات فوق دوال المحرك المكتوبة، واربط "الكود السيئ" بـ HTTP `404`، والتقط `IntegrityError` للكود المخصص كـ `409`، وأبقِ حارس `__main__` ليعمل `uvicorn` التطبيق.

```python
# shortener.py (continued)
from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse
import uvicorn

app = FastAPI(title="URL Shortener")

@app.post("/shorten")
def shorten(url: str, custom: str | None = None) -> dict:
    code = create_link(url, custom=custom)
    return {"short_url": f"/u/{code}", "code": code}

@app.get("/u/{code}")
def go(code: str):
    url = resolve_url(code, referrer=None)
    if url is None:
        raise HTTPException(status_code=404, detail="Unknown short code.")
    return RedirectResponse(url)

@app.get("/analytics/{code}")
def analytics(code: str) -> dict:
    return click_stats(code)

if __name__ == "__main__":
    init_db()
    uvicorn.run(app, host="127.0.0.1", port=8000)
```

كل مسار سطر واحد لأن المحرك يملك المنطق بالفعل. `@app.post("/shorten")` يترك FastAPI يأخذ الرابط كمعامل استعلام اليوم ونص JSON غدًا؛ و`@app.get("/u/{code}")` هو إعادة التوجيه التي تعمل عليها تتبّع نقرات الخطوة 3 ، كل ضربة على هذا المسار نقرة؛ و`HTTPException(404)` هو كيف يظهر كود مفقود كخطأ *ويب* لا كـ `None` بايثون. تشغيل `uvicorn.run(app, ...)` خلف `if __name__ == "__main__":` يبقي `shortener.py` قابلًا للاستيراد من الاختبارات والدفاتر بينما يظل خادمًا قابلًا للتشغيل.

**🎯 الناتج المتوقع :** تشغيل `uv run python shortener.py` يبدأ خادمًا على `127.0.0.1:8000`. في طرفية أخرى، `curl -s "http://127.0.0.1:8000/shorten?url=https://example.com/x"` يعيد `{"short_url":"/u/B","code":"B"}` (أو مشابهًا)، و`curl -L` على `/u/B` يتبع إعادة التوجيه، و`/analytics/B` يبلّغ أعداد نقرات حقيقية.

**🩹 إذا لم يعمل :** إذا نال `curl` `Connection refused`، فالخادم لا يعمل أو ربط منفذًا مختلفًا ، تحقق من `port` في `uvicorn.run`. إذا أعاد `POST /shorten` `422 Unprocessable Entity`، فمعامل `url` غير مقدم أو تعليق النوع خاطئ ، `url: str` مطلوب، فمفتاح استعلام مكتوب خطأ يعطي 422. إذا رفع `/u/{code}` بكود مخصص 500 بدلاً من 409 على التكرارات، فـ `IntegrityError` لا يُلتقط في `create_link` ، لفّ الإدراج.

### 5.2 تحقق من الخدمة كاملة

**✅ قائمة التحقق**

- ✅ `uv run python shortener.py` يبدأ الخادم على المنفذ 8000.
- ✅ `curl` على `/shorten` و`/u/{code}` و`/analytics/{code}` يعيد JSON/إعادة توجيه معقولة.
- ✅ اتباع `/u/{code}` يزيد `total_clicks` لذلك الكود.
- ✅ كود غير معروف يعيد HTTP 404 ببيان JSON.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- كل ضربة على `/u/{code}` تسجّل نقرة ، بما فيها البشر الذين ينقرون الرابط المختصر بالصدفة. ماذا تضيف لتمييز النقرات "الحقيقية" (فلاتر البوتات، إسناد أول نقرة، الجغرافيا) وأين تذهب تلك البيانات، إذا أُعيد فتح المخطط؟
- `shorten` اليوم يأخذ الرابط كمعامل استعلام، وهو ما يسرّب الروابط إلى سجلات الخادم. ماذا يغيّر التحول إلى نص JSON `POST` بشأن التخزين المؤقت والتسجيل وكيف ترسل المتصفحات الطلب؟

## ⚠️ المآزق الشائعة

- **نسيان `row_factory` لكل اتصال.** تُضبط داخل `get_conn()`، فأي دالة تنشئ `sqlite3.connect` خاصًا بها تحصل على توبلات وينهار `row["url"]`. الإصلاح: كل الوصول عبر `get_conn()`.
- **عدم التزام النقرة.** يمكن لإدراج `INSERT` بسيط على اتصال لا يُغلق نظيفًا أن يتراجع بصمت، فيبقى `resolve_url` يعيد روابط وتحليلاتك صفرًا. الإصلاح: استخدم سياق `closing(get_conn())` فيعمل التزام وقت الإغلاق دائمًا.
- **تصادم الأكواد المخصصة.** `INSERT` بكود موجود يرفع `sqlite3.IntegrityError` ، الإشارة صادقة لكنها خام. الإصلاح: التقطها في `create_link` واربطها بـ `409 Conflict` في الخطوة 5.
- **أكواد لا تتوقف عن النمو.** `COUNT(*) + 1` ينتج أكوادًا لصفوف *الموجودة* فقط؛ إذا حذفت روابط، تُعاد استخدام الأكواد وتكسر إعادة توجيه قديمة. الإصلاح: احجز الكود بالتفرد، أو أبقِ عدّادًا رتيبًا في جدول خاص.
- **الثقة في ترويسات الإحالة.** المرجعيات تأتي من المتصل وقابلة للتزوير. الإصلاح: عاملها كخيط تسويقي هي هي، ولا تدع إحالة مُدّعاة تقود قرارات أمنية.

## ما بنيته للتو

مختصر روابط مدعوم بقاعدة بيانات فعلية: أكواد base62، ومثابرة SQLite، وتتبّع نقرات عند كل إعادة توجيه، وتحليلات تعمل بالـ SQL، وخدمة FastAPI قدتها بنفسك بـ `curl`. المهارة القابلة للنقل هي *حلقة واجهة برمجة مدعومة بقاعدة بيانات* ، مخطط أولًا، ودوال محرك ثانيًا، وغلاف HTTP أخيرًا ، وهو نفس الشكل ثلاثي الطبقات خلف تطبيقات المهام ولوحات المعلومات ومعظم إعدادات "اجمع البيانات، خزّنها، اعرضها".

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/url-shortener/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/url-shortener) في دورة الكود نسخة أكمل من الكود أعلاه، بمعالجة جسم `POST`، ودعم انتهاء الصلاحية، وعرض تجريبي يقوده `TestClient` يمكنك تشغيله بالكامل داخل دفتر. استنسخها، أو افتح الدورة الكاملة في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وشغّلها من هناك.
:::

## إلى أين تذهب من هنا

- أضف مسار `GET /latest` يسرد أحدث الروابط مع إجمالي نقراتها ، استعلام `ORDER BY created_at DESC LIMIT 10` واحد.
- نفّذ انتهاء الصلاحية: عمود يخزّن `expires_at`، ويعيد `resolve_url` `404` عندما يتجاوزه `datetime.now()`.
- قيّد المعدل على `/shorten` لكل IP حتى لا يسكّ مفتاح مسروب ألف رابط في الثانية.
- ولّد أكواد QR لكل رابط قصير (مكتبة `qrcode` تثبيت واحد) واخدمها من `/u/{code}.png`.

## شارك مشروعك مع الفصل

بنيت شيئًا تفتخر به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع قدمها طلاب آخرون ، و README الخاص به يحتوي على دليل كامل ومناسب للمبتدئين لإضافة مشروعك عبر **طلب سحب**، حتى لو لم تستخدم git من قبل: تفرّع المستودع، وإنشاء فرع، وعمل commit لملفاتك، وفتح طلب السحب، خطوة بخطوة. لا يُفترض خبرة git مسبقة.

أهلاً بكتابة بايثون خارج المتصفح. 🎓