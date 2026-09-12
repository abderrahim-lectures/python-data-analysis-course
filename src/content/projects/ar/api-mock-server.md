---
title: "خادم تجريبي API"
description: "إنشاء APIs تجريبية واقعية من مواصفات OpenAPI لتطوير و اختبار الواجهة الأمامية."
difficulty: "intermediate"
estimatedMinutes: 90
xpReward: 100
tags: ["APIs", "Developer Tools", "Testing"]
prerequisites:
  - "دوال Python وصفوفها وlambdas"
  - "تسلسل JSON والوصول إلى القواميس"
  - "regex خفيف جدًا: ما هي المجموعة المسماة"
learningObjectives:
  - "ترجمة قوالب المسارات إلى تعبيرات منتظمة تستخرج معاملات المسار"
  - "توزيع الطلبات على معاملات الاستجابة مع المعاملات واستعلامات السلسلة والأجسام"
  - "محاكاة الأعطال بطريق متقلقل مبني على عدّاد والإبلاغ عن 404 نظيف"
  - "قراءة وعكس والتحقق من جسم JSON POST من طرف إلى طرف"
  - "تسجيل كل استدعاء في سجل وإعادة تشغيله للتحقق من استقرار الاستجابة"
---

# 🛠️ 🎛️ خادم تجريبي API

يُحجَب كل تطبيق حقيقي في النهاية على الواجهة الخلفية الجاهزة ، خدمة دفع بلا بيئة رمل, أو موجز طقس معطل, أو API لزميل ما زال في التصميم. *الخادم التجريبي* هو البديل الأمين: يعمل على جهازك, وينطق HTTP على localhost, ويجيب على نفس المسارات التي سيجيب بها خادمك الخلفي الحقيقي, فلا تنتظر واجهتك واختباراتك وعروضك نشرَ أي شخص آخر. يبني هذا المشروع ذلك الخادم من الصفر: قوالب مسارات كـ`/users/<id>` تصبح موزِّعات تستخرج المعاملات, وتنعكس سلاسل الاستعلام وأجسام JSON للفحص, وطريق متقلقل يفشل وفق جدول, ومسجِّل مدمج يعيد تشغيل كل استدعاء ليلتقط الانحدارات قبل أن يوجد الإنتاج. يعمل على المكتبة القياسية. كل مثال في هذا الدليل حتمي ، نفس التوزيع يعيد نفس JSON كل مرة ، فتستطيع التحقق من كل ادعاء أثناء البناء.

هذا يفترض دوالاً وصفوفًا ومعالجة JSON. مشروع اختياري وغير مُقيَّم ، راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. ترجمة قوالب المسارات إلى تعبيرات منتظمة تلتقط معاملات المسار.
2. بناء موزِّع يوجّه الطريقة + المسار إلى معمل استجابة.
3. عكس سلاسل الاستعلام والأعطال المحاكاة, بما فيها 500 مجدولة و404 نظيفة.
4. إضافة نقطة نهاية صدى JSON تقرأ جسم POST وتعيده.
5. تسجيل كل استدعاء في سجل وإعادة تشغيله كفحص انحدار.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الموصى به ، الخادم التجريبي مكتبة قياسية نقیة (`http.server`, `http.client`, `urllib.parse`, `json`), فـ`uv init` كل ما تحتاجه.

**Google Colab وKaggle Notebooks وBinder** تشغّل كل خطوة دون تعديل. شبكة الدفاتر متساهلة بما يكفي لأجزاء الموزِّع داخل العملية; كتلة السلك الحي الاختيارية النهائية تعمل أيضًا على Binder ومحليًا ، أبقِها عابرة (منفذ `0`) كي لا تتصادم مع عملية أخرى أبدًا.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/api-mock-server/notebook.ar.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/api-mock-server/notebook.ar.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fapi-mock-server%2Fnotebook.ar.ipynb)

## الإعداد

كل ما يلزم قبل الطلب الأول.

### أعِدَّ المشروع

```bash
uv init api-mock-server
cd api-mock-server
```

لا تبعيات. القطع: جدول مسارات (طريقة + قالب + معمل استجابة), وموزِّع `MockAPI`, ولاحقًا مسجِّل.

**✅ قائمة التحقق**

- ✅ يُنشئ `uv init api-mock-server` المشروع وملف `main.py`.
- ✅ ينجح `uv run python3 -c "import json, re, http.server"` ، كلها مكتبة قياسية.

**🤔 سؤال (أسئلة) سقراطي(ة) :**

- يعيد الخادم التجريبي *بيانات مزيفة* بحكم التعريف. ما الذي ما زال يمنحه نزاهة ، شكل الاستجابة, أو رموز الحالة, أو الكمون, أو *الوعد بأنه حتمي*؟ أيٌّ من تلك يمكن أن يُنامك إلى شحنِ شيء ينكسر ضد الواجهة الخلفية الحقيقية؟
- يعلن التجريبي `{"status": "ok"}` على طريق لم تبنِ الواجهة الحقيقية له بعد. إذا اجتازت واجهتك الاختبارات ضد التجريبي, فأي خاصية واحدة من الواجهة *الحقيقية* قد تكسرها مع ذلك ، وأين يساعد حقل `version`؟

## الخطوة 1: المسارات كقوالب

الطريق ثلاثة أشياء: طريقة HTTP, ومسار (ربما بمعاملات `<params>`), ودالة تبني الاستجابة. تعرّف الخطوة 1 جدول المسارات ومجمِّع القوالب.

### 1.1 مجمِّع القوالب

**👟 تلميح البداية :** اكتب `route_regex(template)` تحوّل `/users/<uid>` إلى regex بمجموعة التقاط مسماة `<uid>`.

```python
# main.py
import re
from urllib.parse import urlparse, parse_qs

def route_regex(template):
    pattern = re.sub(r"<(\w+)>", r"(?P<\1>[^/]+)", template)
    return re.compile("^" + pattern + "$")

m = route_regex("/users/<uid>").match("/users/42")
print(m.groupdict())
```

يعيد كتابة `re.sub(r"<(\w+)>", r"(?P<\1>[^/]+)", template)` كل `<name>` إلى مجموعة regex مسماة: `/users/<uid>` تصبح `/users/(?P<uid>[^/]+)`. يطابق `[^/]+` أي تسلسل غير شرطة, فـ`42` و`grace` و`x-7` كلها تترسّخ في `uid`. التثبيت بـ`^…$` يجعل المطابقة دقيقة, فلن يطابق `/users/42/extra` مناصفة.

**🎯 الناتج المتوقع :** `{'uid': '42'}`.

**🩹 إذا لم يعمل :** إن كان الناتج فارغًا أو `{}`, فثُبّت `.match` في موضع غير متوافق ، تحقق من `^` الرائدة. إن ظهر `re.error`, فأقواس القالب غير متوازنة أو اسم التقاط يحوي حرفًا غير كلمة.

### 1.2 سجّل طريق الصحة

**👟 تلميح البداية :** عرّف `add(method, template, response)` تخزِّن مطابقًا مُجمَّعًا زائد معمل الاستجابة, ثم سجّل نقطة نهاية `/health`.

```python
# main.py (continued)
class MockAPI:
    def __init__(self, base="/api/v1"):
        self.base = base
        self.routes = []

    def add(self, method, template, response):
        self.routes.append({
            "method": method,
            "match": route_regex(self.base + template),
            "response": response,
        })
        return self

api = MockAPI()
api.add("GET", "/health", lambda **kwargs: {"healthy": True, "version": "1.0.0"})
print(len(api.routes), "route registered")
```

جدول المسارات مجرد قائمة قواميس ، إعداد كبيانات. يقرن كل إدخال فعل HTTP بالمطابق المُجمَّع للمسار *مسبوقًا* (`/api/v1` + `/health`), وبدالة ستبني الحمولة لاحقًا. lambdas تُبقي تعريفات المسارات سطرًا واحدًا; دالة مسماة تعمل بالمثل تمامًا.

**🎯 الناتج المتوقع :** `1 route registered`.

**🩹 إذا لم يعمل :** إن كان `len(api.routes)` يساوي 0, فنسيت `add` سطر `self.routes.append(...)` أو أعادت قبل الإلحاق. إن طبع `2 routes`, فتسرّبت نسخة من القائمة ، تحقق من اسم `routes = self.routes` على نحو عرضي.

### 1.3 تحقّق من طبقة القوالب

**✅ قائمة التحقق**

- ✅ يطابق `route_regex("/users/<uid>")` `/users/42` مع `groupdict() == {"uid": "42"}`.
- ✅ *لا* يطابق `route_regex("/users/<uid>")` المسار `/users/42/orders`.
- ✅ تخزِّن `add` الطريقة والمطابق والمعمل; ويُطبَّق الجذر المسبق عند التسجيل.

**🤔 سؤال (أسئلة) سقراطي(ة) :**

- لماذا regex *بدل* `path.split("/")`؟ حوّل `/users/<uid>/orders/<oid>` إلى بحث مبني على التقسيم في رأسك ، ما الذي ينكسر على المقاطع متغيرة الطول وعلى سلاسل الاستعلام؟ regex هو الجواب المدمج عن «أي عدد لمقاطع, بأسماء».
- يبدأ كل من قالبي `/users/<uid>` و`/users/search` بـ`/users/`. إذا سجلت `<uid>` أولًا, فأيًّا منهما يضرب طلب إلى `/users/search` ، وأي قاعدة تقرر ذلك؟

## الخطوة 2: الموزِّع

تجلس القوالب خاملة حتى يبحث شيء عن طلب. تحوّل الخطوة 2 جدول المسارات إلى موزِّع: طريقة + مسار دخولًا, `(status, payload)` خروجًا.

### 2.1 تعامل مع طريق ثابت

**👟 تلميح البداية :** نفّذ `dispatch(method, path)` يمسح المسارات, ويطابق الطريقة ثم المسار, ويستدعي المعمل المختار.

```python
# main.py (continued)
    def dispatch(self, method, path, body=None):
        for route in self.routes:
            if route["method"] != method:
                continue
            m = route["match"].match(path)
            if not m:
                continue
            kwargs = dict(m.groupdict())
            return 200, route["response"](**kwargs)
        return 404, {"error": "not found"}

print(api.dispatch("GET", "/api/v1/health"))
print(api.dispatch("GET", "/api/v1/health"))
print(api.dispatch("GET", "/api/v1/missing"))
print(api.dispatch("POST", "/api/v1/health"))
```

`dispatch` مسح خطي: مرشحان رخيصان (`method ==`, مطابقة المطابق) قبل الاستدعاء المكلف. يفوز أول طريق مطابق, فترتيب التسجيل هو حاكم التعادلات (انظر سقراط الخطوة 1). طلب أخطأ الكل يعيد **حمولة** `404` ، لا استثناء ، فإذن لكل استدعاء إجابة `(status, payload)` محددة.

**🎯 الناتج المتوقع :**

```
(200, {'healthy': True, 'version': '1.0.0'})
(200, {'healthy': True, 'version': '1.0.0'})
(404, {'error': 'not found'})
(404, {'error': 'not found'})
```

**🩹 إذا لم يعمل :** إن أجاب الطريق الخاطئ, فترتيب المطابقة-الأولى التقط الإدخال الخاطئ ، أعد ترتيب التسجيل. إن رفع `/missing` بدل إعادة `(404, …)`, فسقطت الحلقة إلى `routes[0]` غير محمية.

### 2.2 معاملات المسار وسلاسل الاستعلام

**👟 تلميح البداية :** مدّد `dispatch` لتمرير معاملات المسار *ومعاملات الاستعلام المحلَّلة* إلى المعمل عبر `kwargs`.

```python
# main.py (continued)
    def dispatch(self, method, path, body=None):
        parsed = urlparse(path)
        query = {k: v[0] for k, v in parse_qs(parsed.query).items()}
        for route in self.routes:
            if route["method"] != method:
                continue
            m = route["match"].match(parsed.path)
            if not m:
                continue
            kwargs = dict(m.groupdict())
            return 200, route["response"](**kwargs, params=query)
        return 404, {"error": "not found"}

api.add("GET", "/users/<uid>",
        lambda **kw: {"user": {"id": kw["uid"], "name": "Ada", "role": "admin"}})
api.add("GET", "/search",
        lambda **kw: {"query": kw["params"].get("q", ""),
                      "results": [f"result-{i+1}"
                                  for i in range(int(kw["params"].get("limit", "1")))]})

print(api.dispatch("GET", "/api/v1/users/42"))
print(api.dispatch("GET", "/api/v1/search?q=cats&limit=3"))
print(api.dispatch("GET", "/api/v1/search"))
```

يفصل `urlparse` المسار عن الاستعلام; يحوّل `parse_qs` `?q=cats&limit=3` إلى `{"q": ["cats"], "limit": ["3"]}`, مفكوّكة إلى سلاسل أول-قيمة. تصل معاملات المسار عبر `**kwargs` (من مجموعات regex); وتصل معاملات الاستعلام عبر قاموس `params`. يسمّي معمل الاستجابة المعاملات التي يريدها ويعامل البقية افتراضيًا.

**🎯 الناتج المتوقع :**

```
(200, {'user': {'id': '42', 'name': 'Ada', 'role': 'admin'}})
(200, {'query': 'cats', 'results': ['result-1', 'result-2', 'result-3']})
(200, {'query': '', 'results': ['result-1']})
```

**🩹 إذا لم يعمل :** إن غاب `uid` عن الاستجابة, فلم يضمّنه `**kwargs` ، تحقق أن المطابق التقط `uid` (الخطوة 1.1). إن أعاد `limit=3` نتيجة واحدة, فأعطى `parse_qs` قوائم وفهرس المعمل قائمة بدل سلسلة ، أكّد فك `v[0]`.

### 2.3 تحقّق من الموزِّع

**✅ قائمة التحقق**

- ✅ يعيد `dispatch` `(200, payload)` للـGET المسجلة و`(404, {"error": "not found"})` لكل ما سواها, مطابقًا على الطريقة أيضًا.
- ✅ يحلّ كل من `/users/<uid>` و`/search` على نحو صحيح, بمعاملات المسار في `kwargs` ومعاملات الاستعلام في `params`.
- ✅ يجيب نفس الموزِّع مرارًا ، لا تستهلك الاستدعاء حالة.

**🤔 سؤال (أسئلة) سقراطي(ة) :**

- تقع المحارف المرمّزة بعنوان URL من نمط `%7B` في *المسار*; والمسافات في *الاستعلام*. أين يرسم `urlparse` الخط ، وما الذي ينكسر لو حللت معاملات الاستعلام من `parsed.path` بدل `parsed.query`؟
- يعيد معمل `/users/<uid>` نفس «Ada» لكل معرّف. للتجريبي, هل ذلك خطأ أم ميزة؟ أطِّر المقايضة بين «تنوع واقعي» و«اختبارات حتمية».

## الخطوة 3: حاكِ أنماط الفشل

تفشل الواجهات الحقيقية. تجريبي جيد يفشل *عن قصد*, وفق جدول, كي لا يستطيع كودك المراوغة عن مسارات الفشل. تضيف الخطوة 3 أخطاء مجدولة وصدى مدركًا للجسم.

### 3.1 الطريق المتقلقل

**👟 تلميح البداية :** مدّد `add` بعلم اختياري `flaky={"every": n, "message": ...}`; وعدّ الضربات لكل مسار وأعد 500 في كل ضربة n.

```python
# main.py (continued)
    def __init__(self, base="/api/v1"):
        self.base = base
        self.routes = []
        self._counter = {}

    def add(self, method, template, response, *, flaky=None):
        self.routes.append({"method": method,
                            "match": route_regex(self.base + template),
                            "response": response,
                            "flaky": flaky})

    def dispatch(self, method, path, body=None):
        parsed = urlparse(path)
        query = {k: v[0] for k, v in parse_qs(parsed.query).items()}
        for route in self.routes:
            if route["method"] != method:
                continue
            m = route["match"].match(parsed.path)
            if not m:
                continue
            kwargs = dict(m.groupdict())
            if route["flaky"] is not None:
                n = self._counter.setdefault(path, 0) + 1
                self._counter[path] = n
                if n % route["flaky"]["every"] == 0:
                    return 500, {"error": route["flaky"]["message"]}
            return 200, route["response"](**kwargs, params=query)
        return 404, {"error": "not found"}

api.add("GET", "/flaky", lambda **kw: {"ok": True},
        flaky={"every": 3, "message": "Simulated outage"})
print(api.dispatch("GET", "/api/v1/flaky"))
print(api.dispatch("GET", "/api/v1/flaky"))
print(api.dispatch("GET", "/api/v1/flaky"))
```

يعدّ `_counter` الضربات *لكل مسار* (`setdefault(path, 0)`), فيفشل طريق متقلقل عند الضربات 3 و6 و9 ، جدول حتمي تستطيع اختباراتك التأكيد عليه. النجاح في الاستدعاءين الصحيين ثم فشل الثالث بحمولة خطأ حادة. هكذا تختبر حلقة إعادة المحاولة: أعطها إيقاع «ينجح مرتين, يفشل مرة».

**🎯 الناتج المتوقع :**

```
(200, {'ok': True})
(200, {'ok': True})
(500, {'error': 'Simulated outage'})
```

**🩹 إذا لم يعمل :** إن فشلت الثلاثة, فـ`every` يساوي `1` (أو المودولو معكوس ، يشتغل `n % every == 0` على المضاعفات الدقيقة فقط). إن لم يفشل أيٌّ, ففرع `flaky` لا يجري أبدًا لأن `add` لم تُستدعَ بـ`flaky=` ككلمة مفتاحية.

### 3.2 الإدخال السيئ 4xx, لا تحطم

**👟 تلميح البداية :** لفّ استدعاء المعمل في try/except كي يصبح *الاستثناء في التجريبي* حمولة 422, لا تتبع مكدس أبدًا.

```python
# main.py (continued)
    def dispatch(self, method, path, body=None):
        parsed = urlparse(path)
        query = {k: v[0] for k, v in parse_qs(parsed.query).items()}
        for route in self.routes:
            if route["method"] != method:
                continue
            m = route["match"].match(parsed.path)
            if not m:
                continue
            kwargs = dict(m.groupdict())
            if route["flaky"] is not None:
                n = self._counter.setdefault(path, 0) + 1
                self._counter[path] = n
                if n % route["flaky"]["every"] == 0:
                    return 500, {"error": route["flaky"]["message"]}
            try:
                payload = route["response"](**kwargs, params=query, body=body)
            except Exception as e:
                return 422, {"error": str(e)}
            return 200, payload
        return 404, {"error": "not found"}

api.add("GET", "/divide", lambda **kw: {"n": 1 / int(kw["params"]["by"])})
print(api.dispatch("GET", "/api/v1/divide?by=2"))
print(api.dispatch("GET", "/api/v1/divide?by=0"))
```

يرسم try/except خطًا فاصلًا حادًا: *التجريبي* فيه خطأ أو أرسل المتصل هراءً, وبأي حال الاستجابة JSON منظم بالحالة `422` ، يمكن لعميل التفرع عليها. دون الحارس, كان `by=0` السيئ سينشر `ZeroDivisionError` ويحطم خيط الخادم كله.

**🎯 الناتج المتوقع :**

```
(200, {'n': 0.5})
(422, {'error': 'division by zero'})
```

**🩹 إذا لم يعمل :** إن تحطم `by=0`, فـtry/except خارج الحلقة أو المعمل يُستدعى في مكان آخر. إن أعاد `500` بدل `422`, فـ`except` أعاد الرفع أو أوضعَ الحالة الخاطئة.

### 3.3 تحقّق من أنماط الفشل

**✅ قائمة التحقق**

- ✅ يفشل الطريق المتقلقل بالضبط حين `n % every == 0` ، الضربة 3 من جدول 3 تفشل.
- ✅ تعيد معاملات فاشلة `(422, {"error": ...})`; والمسارات غير المتطابقة تعيد `(404, ...)`.
- ✅ كل الأعطال المحاكاة بيانات, لا استثناءات مرفوعة أبدًا.

**🤔 سؤال (أسئلة) سقراطي(ة) :**

- عدّاد التقلقل *لكل مسار*, لا لكل قاعدة. يتشارك مستدعيان ضربة `/api/v1/flaky` العدّ. هل تريد بدل ذلك عدّادًا واحدًا لكل *مستدعٍ* عند محاكاة نظام موزَّع ، وعلى ماذا ستفاتح لتمييز أي مستدعٍ هو؟
- 422 مقابل 500: يقول أحدهما «الطلب خاطئ», والآخر «فشل الخادم». حين **تجرب**، فأنت تتحكم بالجانبين معًا ، فلِمَ ما زال فرق التمييز بينهما يستحق العناء؟

## الخطوة 4: اقرأ جسم JSON وصدّاه

تحمل GETs معاملاتها في URL. تحمل POSTs جسم JSON. تجعل الخطوة 4 التجريبي مدركًا للجسم: اقرأه, واعكسه, وأعد الكائن ، الرحلة الكاملة التي تحتاجها واجهة أمامية للتطوير ضدها.

### 4.1 صدّ جسم POST

**👟 تلميح البداية :** سجّل `/echo`; يفك معمل جسم `body` (سلسلة خام) بـ`json.loads` ويعيد `{"echo": <decoded>}`.

```python
# main.py (continued)
api.add("POST", "/echo",
        lambda **kw: {"echo": json.loads(kw["body"]) if kw["body"] else {}})

print(api.dispatch("POST", "/api/v1/echo", body='{"name": "Grace"}'))
print(api.dispatch("POST", "/api/v1/echo", body=""))
```

يدخل `body` إلى `dispatch` كسلسلة خام (يقرؤها طبقة HTTP من الطلب في الخطوة 5); يحوّلها `json.loads` إلى كائن Python لاستجابة الصدى. جسم مفقود يصبح `{}` ، ما زال صدى صالحًا, لا استثناء.

**🎯 الناتج المتوقع :**

```
(200, {'echo': {'name': 'Grace'}})
(200, {'echo': {}})
```

**🩹 إذا لم يعمل :** إن أخطأ `json.loads` على سلسلة JSON صالحة, فجسم وَصل مرمَّزًا مرتين (اقتبس الـ JSON مرتين) أو ببايت ضال. إن صدى جسم فارغ كـ`None`, فانقلبت الصيغة الشرطية الكاذبة.

### 4.2 معاملات متسلسلة: جسم + مسار + استعلام

**👟 تلميح البداية :** سجّل نقطة نهاية تخزين تدمج استجابتها معامل المسار ومعامل استعلام والجسم المفكوك.

```python
# main.py (continued)
api.add("POST", "/users/<uid>/notes",
        lambda **kw: {"user": kw["uid"],
                      "tag": kw["params"].get("tag", "general"),
                      "note": json.loads(kw["body"]) or {"text": ""}})

print(api.dispatch("POST", "/api/v1/users/7/notes?tag=idea",
                   body='{"text": "ship by Friday"}'))
```

يمارس طريق واحد الآن كل قناة إدخال دفعة واحدة ، اسم المسار, ووسم استعلام, وجسم JSON ، وهو بالضبط شكل نقطة نهاية `notes/users/<id>/` الحقيقية. قراءة الثلاثة إلى استجابة واحدة تثبت أن الموزِّع يحمل كل قناة باستقلال.

**🎯 الناتج المتوقع :**

```
(200, {'user': '7', 'tag': 'idea', 'note': {'text': 'ship by Friday'}})
```

**🩹 إذا لم يعمل :** إن غاب `tag`, فلن يُخيط `query` داخل المعمل. إن كان `user` هو `None`, فلن يُلتَقط `kw["uid"]` (اسم المجموعة في القالب لم يطابق المفتاح المستخدم هنا).

### 4.3 تحقّق من خط أنابيب الجسم

**✅ قائمة التحقق**

- ✅ يعيد `/echo` كائن جسم JSON المفكوك; وجسم فارغ يصدى `{}`.
- ✅ يمكن دمج المسار والاستعلام والجسم في استجابة طريق واحد.
- ✅ JSON ناقص التكوين في جسم يُترك إلى 422 عبر حارس الخطوة 3, لا تحطم.

**🤔 سؤال (أسئلة) سقراطي(ة) :**

- تثق طريقلة الصدى في `json.loads`. إذا أرسل عميل `{"text": "ship by Friday"}` لكن الواجهة الحقيقية تتوقع `{"content": ...}`, يمر صدى تجريبي بالشكل الخاطئ الاختبارات بصمت. أين تضع *فحص المخطط* ، في معمل الطريق أم في الموزِّع ، ولماذا؟
- يعيد `json.loads(kw["body"])` أي نوع JSON: قائمة, رقم, null. لو أردت أن يقبل `/echo` *كائنات* فقط, فأي تغيير من سطر واحد يرفض البقية؟

## الخطوة 5: سجّل وأعد التشغيل

تجريبي يجيب لكنه ينسى لا يستطيع التحقق. تسجّل الخطوة 5 كل استدعاء في سجل, ثم تعيد تشغيله ، إعادة تشغيل الطلبات الدقيقة والتأكيد أن الاستجابات لم تنحرف. ذلك اختبار انحدار يولد من تجريبي.

### 5.1 سجّل السجل

**👟 تلميح البداية :** أضف قائمة `recorded`; وسجّل الطريقة والمسار والجسم والحالة والحمولة في `dispatch`, مبتدئة بالاستدعاءات التي أدليت بها فعلًا.

```python
# main.py (continued)
    def __init__(self, base="/api/v1"):
        self.base = base
        self.routes = []
        self._counter = {}
        self.recorded = []

    def _finish(self, method, path, body, status, payload):
        self.recorded.append({"method": method, "path": path, "body": body,
                              "status": status, "payload": payload})
        return status, payload

    def transcript(self):
        return json.loads(json.dumps(self.recorded))

    # Now route dispatch returns self._finish(...) on every path — the
    # matching routes and the fallback 404 alike (add that in this section).

print("calls recorded so far:", len(api.transcript()))
print(api.transcript()[0])
```

تسجيل *الطلب* (الطريقة, المسار, الجسم) جنب *الاستجابة* (الحالة, الحمولة) يجعل السجل أثرًا أمينًا ، تستطيع إعادة تشغيل أي إدخال لاحقًا دون تخمين ما أرسله. نسخة عميقة عبر `json.dumps(json.loads(...))` تُبقي السجل المُعاد معزولًا عن أي تحوير لاحق. (لتطابق الأعداد أدناه, اجعل `dispatch` ينهي كل مسار ، مطابقًا أو 404 ، بـ`return self._finish(method, path, body, status, payload)`, معيدًا `(status, payload)` مباشرة.)

**🎯 الناتج المتوقع :**

```
calls recorded so far: 9
{'method': 'GET', 'path': '/api/v1/health', 'body': None, 'status': 200, 'payload': {'healthy': True, 'version': '1.0.0'}}
```

(العدّ 9 لأن كل استدعاء `dispatch` سابق في هذا الدليل سُجِّل.)

**🩹 إذا لم يعمل :** إن كان السجل فارغًا, فليست `_finish` (أو الإلحاق داخلها) على مسار الإرجاع لـ`dispatch`. إن تحوّرت الإدخالات لاحقًا, فالنسخة العميقة في `transcript()` مفقودة.

### 5.2 أعد التشغيل كفحص انحدار

**👟 تلميح البداية :** نفّذ `replay()` يعيد توزيع كل طلب مسجَّل ويجمع المسارات التي انحرفت استجاباتها.

```python
# main.py (continued)
    def replay(self):
        mismatches = []
        for call in self.transcript():
            st, payload = self.dispatch(call["method"], call["path"],
                                        body=call["body"])
            if (st, payload) != (call["status"], call["payload"]):
                mismatches.append(call["path"])
        return mismatches

fresh = MockAPI()
fresh.add("GET", "/health", lambda **kw: {"healthy": True, "version": "1.0.0"})
fresh.add("GET", "/users/<uid>",
          lambda **kw: {"user": {"id": kw["uid"], "name": "Ada", "role": "admin"}})
fresh.add("GET", "/search", lambda **kw: {"query": kw["params"].get("q", ""),
                                          "results": [f"result-{i+1}"
                                                      for i in range(int(kw["params"].get("limit", "1")))]})
fresh.dispatch("GET", "/api/v1/health")
fresh.dispatch("GET", "/api/v1/search?q=cats&limit=3")
fresh.dispatch("GET", "/api/v1/users/7")

print("replay:", fresh.replay())
```

يعيد `replay` إرسال كل *طلب* مسجَّل (بجسمه الدقيق) ويقارن الاستجابة الطازجة بالمسجَّلة. صفر عدم تطابق يعني «الخادم ما زال يتصرف بالضبط كما كان أثناء الجولة» ، اختبار الانحدار الرخيص الحتمي الخاص بك. (طريق متقلقل ينقلب على عدّاد, فلتعيد تشغيله على مثيل طازج أو أعد تشغيل العدّاد ، تلك اللاحتمية هي نقطة اختباره بشكل منفصل.)

**🎯 الناتج المتوقع :** `replay: []`.

**🩹 إذا لم يعمل :** إن لم يطابق استدعاء `search`, فسلاسل `limit` الاستعلام لا تتنقل ذهابًا وإيابًا (int مقابل str). إن لم تطابق `users/7`, فالاستجابة تعتمد على زمن حي أو على عمومي ، جمّدها.

### 5.3 وصّله حيًا (اختياري)

**👟 تلميح البداية :** اربط الموزِّع في `http.server`: يقرأ `BaseHTTPRequestHandler` الجسم, ويستدعي `dispatch`, ويكتب الحالة + JSON ، مخدمًا على منفذ عابر كي لا يتصادم أبدًا.

```python
# main.py (continued)
import json as _json, threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

class Handler(BaseHTTPRequestHandler):
    api = None
    def dispatch_here(self):
        length = int(self.headers.get("Content-Length", 0) or 0)
        body = self.rfile.read(length).decode() if length else None
        status, payload = self.api.dispatch(self.command, self.path, body=body)
        data = _json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)
    do_GET = dispatch_here
    do_POST = dispatch_here
    def log_message(self, *args): pass

Handler.api = fresh
server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
port = server.server_address[1]
threading.Thread(target=server.serve_forever, daemon=True).start()

import http.client
conn = http.client.HTTPConnection("127.0.0.1", port)
conn.request("GET", "/api/v1/health")
r = conn.getresponse()
print("GET /health ->", r.status, _json.loads(r.read()))
conn.request("POST", "/api/v1/echo", body=_json.dumps({"name": "Grace"}),
             headers={"Content-Type": "application/json"})
r = conn.getresponse()
print("POST /echo  ->", r.status, _json.loads(r.read()))
server.shutdown()
```

يطلب المنفذ `0` من نظام التشغيل منفذًا حرًا, فـ`serve_forever` لا يتعارض مع عملية قائمة أبدًا. يعكس المعالج عقد `dispatch` ، اقرأ الجسم, ووزِّع, ورمِّز الحمولة JSON ، فالخادم الحي والموزِّع داخل العملية يجيبان بالمطابقة. صُوّت `log_message` كي يبقى الطرفية نظيفة.

**🎯 الناتج المتوقع :**

```
GET /health -> 200 {'healthy': True, 'version': '1.0.0'}
POST /echo  -> 200 {'echo': {'name': 'Grace'}}
```

**🩹 إذا لم يعمل :** إن ظهر `ConnectionRefusedError`, فمات خيط الخادم (استثناء داخل `serve_forever`) أو جرى `shutdown()` مبكرًا. إن كان جسم POST فارغًا, فترأس `Content-Length` لم يبلغ المعالج ، معظم العملاء يرسله, وبعض الأدوات المرتجلة لا ترسله.

### 5.4 تحقّق من المسجِّل

**✅ قائمة التحقق**

- ✅ يُعيد `transcript()` نسخة عميقة معزولة عن كل استدعاء مسجَّل.
- ✅ يُعيد `replay()` قائمة `[]` على مجموعة طرق ثابتة بلا انحراف.
- ✅ يعيد المعالج الحي نفس JSON الذي يعيده الموزِّع داخل العملية تمامًا.

**🤔 سؤال (أسئلة) سقراطي(ة) :**

- تجيب إعادة التشغيل على «هل تغيّرت الاستجابة؟» لا على «هل الاستجابة *صحيحة*؟». ما الذي يسمح به سجل يُشحن كبيانات ذهبية لاختبار مستقبلي, لا يسمح به تجريبي حي وحده قط ، وما خطر أن تصبح البيانات الذهبية قديمة؟
- يعيد المعالج الحي قراءة `self.rfile` لكل طلب. يخدم `ThreadingHTTPServer` كل اتصال على خيطه الخاص ، ما الذي ينكسر إذا تسابق استدعاها إعادة تشغيل على `self._counter`, وهل ينجو تنظيم `BaseHTTPRequestHandler` الثابت-لكل-مثيل من ذلك نظيفًا؟

## ⚠️ مآزق شائعة

- **تعبيرات مسار غير مثبّتة.** `/users/<uid>` المتطابق دون `^…$` يطابق أيضًا `/api/v1/users/42/orders` وينتج طلبًا نصف-مقبوض. ثبّت النمط المُجمَّع دائمًا.
- **نسيان الطريقة.** مطابقة المسار فقط تجعل `POST /health` تضرب طريق `GET /health`. افحص `route["method"] == method` *قبل* مطابقة regex.
- **`parse_qs` يعيد قوائم.** `parse_qs("?limit=3")["limit"]` هي `["3"]`, لا `"3"`. افتح بـ`{k: v[0] …}` أو ينكسر فهرسة كل تحليل متعدد القيم.
- **أعطال مزيفة تتحطم.** `ZeroDivisionError` غير محمية داخل طريق تحطم خيط المعالج. دع try/except يوضَّع الاستثناءات إلى حمولة `422` ، تلك وظيفة التجريبي.
- **حالة مشتركة في إعادة التشغيل.** عدّاد التقلقل لكل مسار ورتيب; `replay()` يعيد إرسال الاستدعاء المتقلقل الثالث فيحصل على 500 طازجة. اختبر الطرق المتقلقلة على مثيل طازج.
- **حمولات غير قابلة للتسلسل.** `json.dumps` في `transcript()` والمعالج الحي كلاهما يختنقان على `datetime` أو int من numpy. أبقِ الحمولات على أنواع Python عادية.

## ما بنيته للتو

خادم API محلّي حتمي على المكتبة القياسية: قوالب مسارات مجمَّعة إلى موزِّعات regex, ومعاملات مسار واستعلام تتدفق إلى معاملات استجابة, وأعطال محاكاة وفق جدول, وأجسام JSON مُصدّاة, وسجل طلبات كامل يعيد التشغيل كفحص انحدار. الفكرة الجوهرية هي أن *التجريبي يستبدل نظامًا خارجيًا بوعد تتحكم فيه* ، كل `(status, payload)` بيانات, لا استثناء مفاجئ أبدًا, فيمكن تطوير كودك وعرضه واختبار انحداره قبل أن يوجد الواجهة الخلفية الحقيقية بوقت طويل. استبدل جدول المسارات بعنوان الواجهة الحقيقية لاحقًا ويظل العميل نفسه يعمل, وهي بالضبط الدرزة التي صُمم التجريبي ليمسكها.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/api-mock-server/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/api-mock-server) في مستودع الدورة هو الخادم كاملًا كدفتر ، قوالبة المسارات, والأعطال المتقلقلة, ونقطة نهاية الصدى, وإعادة تشغيل السجل, والمعالج الحي الاختياري, قابلة للتشغيل في Colab/Kaggle/Binder. استنسخ المستودع أو [افتحه في Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## إلى أين تذهب من هنا

- أضف `latency_ms` إلى المسارات واجعل الموزِّع ينام قبل الرد, كي تختبر اختبارات إعادة المحاولة مهلات فعلية ، ثم سجّل الكمونات المقيسة في السجل جنب الحالة والحمولة.
- نفّذ فحص `Content-Type` في `dispatch` يرفض الأجسام غير JSON بـ415 بدل ترك `json.loads` يرمي.
- ثبّت السجل إلى ملف JSON بـ`json.dump` عند الإغلاق وحمّله عند البدء, فيصبح المسجِّل بيانات انحدار تنجو من إعادة التشغيل.
- أضف نمط `record = True/False` كي يلتقط جولة تسجيل استدعاءات API حقيقية (عبر `http.client`) ويعيد تشغيلها كتجريبي لاحقًا ، وكيل التسجيل-وإعادة-التشغيل الكلاسيكي.

## شارك مشروعك مع الصف

بنيت شيئًا تفخر به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع قدّمها طلاب آخرون ، وREADME الخاص به يحوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**, حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع, وإنشاء فرع, وتثبيت ملفاتك, وفتح الـ PR, خطوة بخطوة. لا يُفترض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓