---
title: "أداة إخفاء البيانات"
description: "إخفاء البيانات الحساسة للتطوير والاختبار مع الحفاظ على الخصائص الإحصائية."
difficulty: "intermediate"
estimatedMinutes: 80
tags: ["cli", "csv", "pii", "hashing"]
prerequisites:
  - "أساسيات Python (متغيّرات، حلقات، دوال، قواميس)"
  - "قراءة ملفات CSV بوحدة csv"
learningObjectives:
  - "كشف الأعمدة الحساسة بتلميحات الاسم وأنماط القيم"
  - "تطبيق استراتيجيات الإخفاء بالحذف والتجزئة والحفاظ على الصيغة"
  - "بناء خطة إخفاء لكل عمود تلقائيًا من الكشف"
  - "إخفاء المعرّفات الرقمية مع الحفاظ على توزيع العمود"
  - "كتابة سجل تدقيق لكل عملية إخفاء"
---

# 🕶️ ابنِ أداة إخفاء البيانات

نسخ بيانات عملاء حقيقية إلى قاعدة بيانات تطوير أو تقرير خطأ أو عرض تجريبي هو كيف تتسرب المعلومات الحساسة ، والإصلاح هو انضباط *الإخفاء*: استبدال القيم الحقيقية بقيم زائفة لكنها معقولة قبل أن تذهب البيانات إلى أي مكان لا يجب. الحِرفة في التفاصيل: البريد الإلكتروني يجب أن يحتفظ بنطاقه (حتى يستمر كود الاختبار في التوجيه)، ورقم الهاتف يجب أن يبقى على شكل الهاتف، وحقل رقمي مثل الراتب يجب أن يحتفظ *بتوزيعه* (حتى لا تنهار تحليلات الاختبار). يبني هذا المشروع أداة إخفاء تكشف الأعمدة الحساسة، وتطبق الاستراتيجية الصحيحة لكل عمود، وتحافظ على ما يجب الحفاظ عليه، وتكتب سجل تدقيق لكل عملية.

هذا يفترض Python 101 مع `csv` و`re` مريحين ، دوال، قوائم، مجموعات. لا يُشترط شيء من وحدة تحليل البيانات. إنه اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. اكشف الأعمدة الحساسة بتلميحات الاسم (`email`، `phone`، `name`، …) وتعبيرات نمط القيم.
2. نفّذ حديقة استراتيجيات: حذف، تجزئة حتمية، قناع نص محافظ على الطول، بريد إلكتروني وهاتف محافظان على الصيغة.
3. ابنِ خطة إخفاء لكل عمود تلقائيًا من الكشف + تلميحات أسماء الأعمدة.
4. أخفِ المعرّفات الرقمية بتبديل داخل الأعمدة، مثبتًا أن التوزيع ينجو بينما يُقطع حديث الصف *عن* المعرّف.
5. أضف CLI `masker.py` يخفي CSV، ويكتب `masked.csv`، ويضيف إلى `audit.jsonl`.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الموصى به ، الإخفاء بطبيعته عملية *ملف* ("أخفِ هذا CSV، واحتفظ بذاك")، لذا الـ CLI المحلي مقابل ملفاتك الخاصة هو الموطن الصادق له.

**GitHub Codespaces** بديل بلا إعداد: افتح [مستودع الدورة كاملًا في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython مثبّتان بالفعل) وشغّل نفس الأوامر من طرفية المتصفح.

**Google Colab أو Kaggle Notebooks أو Binder** تعمل جيدًا لنصف الاستراتيجيات والمخطط ، دفتر الملاحظات في [`examples/data-masker/notebook.ar.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-masker/notebook.ar.ipynb) يشغّل كل خطوة على صفوف عينات مرفقة. الملاحظة الصادقة: يعالج دفتر الملاحظات بيانات عيّنة ثابتة، بينما يمكن توجيه الـ CLI المحلي إلى CSV حقيقي تملكه فعلًا.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-masker/notebook.ar.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-masker/notebook.ar.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdata-masker%2Fnotebook.ar.ipynb)

## الإعداد

`uv` أداة واحدة تحل محل سلسلة "ثبّت Python، ثم pip، ثم أداة بيئة افتراضية" ، وهذا المشروع مكتبة قياسية خالصة.

**macOS / Linux** (الطرفية):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

أغلق طرفيتك وأعد فتحها، ثم تأكد أنها ثُبِّتت:

```bash
uv --version
```

ثم جهّز المشروع:

```bash
uv init data-masker
cd data-masker
```

**✅ قائمة التحقق**

- ✅ يطبع `uv --version` رقم إصدار.
- ✅ يوجد `data-masker/` مع `pyproject.toml`.
- ✅ ينجح `python -c "import csv, hashlib, re"` ، لا حزم خارجية.

## الخطوة 1: اكشف الأعمدة الحساسة

يبدأ الإخفاء *بإيجاد* الأسرار. ثمة إشارتان مستقلتان: *اسم* العمود (كل شيء حساس تقريبًا صادق كونه `email` أو `phone` في الرأس) و*القيم* (علامة `@` تحوي نقطة تلميح بريد قوي أياً كان اسم العمود). يثق الكشف بالاثنين، لأن كلًّا قد يكون الوحيد الذي يعمل.

### 1.1 اكتب الكاشف

**👟 تلميح البداية :** ثلاث مجموعات تلميحات أسماء زائد نمط `re` للبريد والهاتف، كلها تغذي مجموعة واحدة من الأعمدة الحساسة؛ شغّله على CSV عينة بعمودين حساسين ، أحدهما مُسمّى بوضوح والآخر متلصّص:

```python
# detect.py
import re

EMAIL_RE = re.compile(r"[^@\s]+@[^@\s]+\.[^@\s]+")
PHONE_RE = re.compile(r"\+?\d[\d\s().-]{6,}\d")
NAME_HINTS = ("name", "person", "student", "customer", "user")
PII_HINTS = ("email", "phone", "ssn", "sin", "address", "iban", "credit")

def detect_columns(headers: list[str], rows: list[dict]) -> list[str]:
    sensitive: set[str] = set()
    for col in headers:
        lowered = col.lower()
        if any(hint in lowered for hint in NAME_HINTS):
            sensitive.add(col)
        if any(hint in lowered for hint in PII_HINTS):
            sensitive.add(col)
        values = [row[col] for row in rows]
        joined = " ".join(values)
        if EMAIL_RE.search(joined) or PHONE_RE.search(joined):
            sensitive.add(col)
    return [col for col in headers if col in sensitive]

if __name__ == "__main__":
    csv_text = """id,full_name,email,phone,contact,city
1,Ada Lovelace,ada@example.com,+1 555 0101,ada@example.com,London
2,Grace Hopper,grace@navy.mil,+1 555 0102,grace@navy.mil,Arlington
3,Alan Turing,alan@bletchley.uk,+44 20 7946 0000,alan@bletchley.uk,Bletchley
"""
    lines = [line for line in csv_text.strip().splitlines()]
    import csv
    reader = csv.DictReader(lines)
    headers = reader.fieldnames or []
    rows = list(reader)
    print(detect_columns(headers, rows))
```

`contact` هو الاختبار الذي يبقي الكاشف صادقًا: رأسه لا يقول شيئًا حساسًا، لكن قيمه بريد إلكتروني، لذا فإن `EMAIL_RE.search(joined)` هو ما يلتقطه. لاحظ أن الكشف يعمل على *نص العمود المدموج*، لا خلية-بخلية ، بحث نمط واحد فوق العمود كله أبسط وكافٍ لإشارات النمط، على حساب عدم إخبارك أي *الصفوف* حساسة (خطوة الخطة لا تحتاج ذلك بعد).

**🎯 الناتج المتوقع :**

```
['full_name', 'email', 'phone', 'contact']
```

**🩹 إذا لم يعمل :** إذا فُقد `contact`، فبحث `EMAIL_RE` المدموج لا يعمل لكل عمود ، أكد أن كتلة النمط داخل حلقة `for col`. إذا وُسم `city`، فشظية `NAME_HINTS` مثل `user` تطابق جزءًا من رأس بريء (`city`؟ لا ، تحقق من رأس مثل `username_last_change`)؛ قائمة التلميحات مبنية على المطابقة الجزئية عمدًا، والمطابقة الجزئية رخوة تمامًا كما تبدو.

### 1.2 تحقّق من الكشف

**✅ قائمة التحقق**

- ✅ تكتشف العينة `full_name` و`email` و`phone` و`contact`، بهذه النمطية في الترتيب.
- ✅ إزالة *قيم* البريد لعمود `contact` (مع إبقاء رأسه) تعني أنه لم يُعلَّم ، أنماط القيم قائمة على القيم فعلًا.
- ✅ عمود `address` وعمود `iban` يُعلَّمان بالاسم وحده، حتى بقيم فارغة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- الكشف لكل *عمود*، لا لكل *خلية*: بريد واحد في عمود "ملاحظات" من 10000 صف يعلّم العمود كله. ما الذي كان على الأداة *أن تكسبه* (وأن تخسره) بالتحول إلى كشف على مستوى الخلية لأعمدة النص الحر مثل `notes`؟
- تلميحات الأسماء تطابق جُزًأ (`user` يطابق `user_name` *و*`userscript_repo`). لماذا المطابقة الجزئية هي الافتراضي العملي هنا بدل مطابقة `==` الدقيقة ، وأي إيجابية زائفة واحدة كانت ستغير رأيك؟

## الخطوة 2: ابنِ حديقة الاستراتيجيات

يقرر الكشف *أي* الأعمدة؛ وتقرر الاستراتيجيات *كيف* يُخفي كلٌّ منها. المجموعة المفيدة: حذف (المنجل)، تجزئة (اسم مستعار حتمي ، نفس المدخل يرسم دائمًا إلى نفس المخرجات، فلا تزال الوصلات تعمل)، نص محافظ على الطول (قوالب الاختبار تبقى معقولة)، بريد/هاتف محافظان على الصيغة (النطاق والبنية ينجوان للتوجيه/المطابقة). كلٌّ دالة فكرة واحدة.

### 2.1 اكتب استراتيجية واحدة لكل دالة

**👟 تلميح البداية :** خمس دوال صغيرة، ثم مساعد `apply` يمكن لأي مخطط إعادة استخدامه ، `mask_email` يحتفظ بالنطاق بعد `@`، و`mask_phone` يحتفظ بآخر أربعة أرقام فقط، كلاهما تحت جدول توزيع استراتيجيات مشترك:

```python
# mask.py
import hashlib
import re

STRATEGY = {}

def mask_redact(value: str) -> str:
    return "****"

def mask_hash(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()[:12]

def mask_text(value: str) -> str:
    if not value.strip():
        return value
    return "".join("*" if ch.isalpha() else ch for ch in value)

def mask_email(value: str) -> str:
    local, sep, domain = value.partition("@")
    if not sep:
        return mask_hash(value)
    return f"{hashlib.sha256(local.encode()).hexdigest()[:8]}@{domain}"

def mask_phone(value: str) -> str:
    digits = re.sub(r"\D", "", value)
    if len(digits) < 5:
        return "****"
    return f"+X{'-' * (len(digits) - 4)}-{digits[-4:]}"

STRATEGY.update({
    "redact": mask_redact, "hash": mask_hash, "text": mask_text,
    "email": mask_email, "phone": mask_phone,
})

def apply(rows: list[dict], plan: dict[str, str]) -> list[dict]:
    masked_rows = []
    for row in rows:
        out = dict(row)
        for col, strategy in plan.items():
            out[col] = STRATEGY[strategy](out[col])
        masked_rows.append(out)
    return masked_rows

if __name__ == "__main__":
    rows = [
        {"full_name": "Ada Lovelace", "email": "ada@example.com", "phone": "+1 555 0101", "city": "London"},
        {"full_name": "Grace Hopper", "email": "grace@navy.mil", "phone": "+1 555 0102", "city": "Arlington"},
    ]
    plan = {"full_name": "text", "email": "email", "phone": "phone"}
    for row in apply(rows, plan):
        print(row)
```

قاموس `STRATEGY` الذي يرسم الأسماء إلى دوال هو *جدول التوزيع* ، ينتج المخطط (الخطوة التالية) أسماء استراتيجيات نصية، ويحوّلها `apply` إلى سلوك، لذا إضافة استراتيجية #6 تعني دالة واحدة زائد إدخال جدول واحد، لا إعادة كتابة المخطط. صيغتان تستحقان الإعجاب: يحتفظ `mask_email` بكل شيء بعد `@` (بريد موصول ما زال يوجّه إلى نفس النطاق) ويجزّئ الجزء المحلي؛ ويعدّ `mask_phone` الأرقام ليحافظ على *شكل* الاتصال (`+X-----0101`) بينما يدمر هوية الرقم.

**🎯 الناتج المتوقع :**

```
{'full_name': '*** ********', 'email': 'fdee430d@example.com', 'phone': '+X-----0101', 'city': 'London'}
{'full_name': '***** ******', 'email': 'e010fd1c@navy.mil', 'phone': '+X-----0102', 'city': 'Arlington'}
```

**🩹 إذا لم يعمل :** إذا اختلفت تجزئات `mask_email` في كل تشغيل، استخدمت `random` في مكان ما بدل `hashlib` ، الحتمية هي بيت القصيد. إذا كان طول قناع `mask_phone` خاطئًا، فـ `len(digits)` يعد رمز دولة لا ينبغي أن يظهر ، ذلك سلوك صحيح (الشكل محفوظ، البادئة الحقيقية مدمرة)؛ تحقق من عدّ `-` مقابل `len(digits) - 4` لا التخمين.

### 2.2 تحقّق من الاستراتيجيات

**✅ قائمة التحقق**

- ✅ `mask_hash("Ada")` يساوي `mask_hash("Ada")` عبر التشغيلات، لكنه يختلف عن `mask_hash("ada")` (الحالة مهمة ، فخ حقيقي، انظر أدناه).
- ✅ `mask_email("grace@navy.mil")` ما زال ينتهي بـ `@navy.mil`؛ `mask_phone("+1 555 0102")` ما زال ينتهي بـ `0102`.
- ✅ `mask_text("Ada")` هو `***` ، نفس الطول، بلا أحرف.
- ✅ يخفي `apply` الأعمدة التي يسميها الخطة فقط ويترك كل خلية أخرى دون مساس.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- `mask_hash` حتمي، وهو ما يجعله قابلًا للكشف بالتخمين: `mask_hash("secret")` معرفة عامة بمجرد رؤيتك للتجزئة. متى يكون إخفاء التجزئة مقبولًا (ما خاصية البيانات التي تجعله آمنًا)، ومتى يكون قابلًا للكشف ببساطة؟
- يجزّئ `mask_email` الجزء *المحلي* لكنه يحتفظ بالنطاق. ما السلوك اللاحق الحقيقي الذي كان ليُدمره بريد محذوف بالكامل ، وما خطر الخصوصية المتبقي من إبقاء النطاق مرئيًا؟

## الخطوة 3: ابنِ خطة الإخفاء تلقائيًا

لا أحد يريد كتابة `{"email": "email", "full_name": "text", ...}` يدويًا لكل مجموعة بيانات. يغلق المخطط الحلقة مع الكشف: الأعمدة الحساسة تحصل على استراتيجية يختارها *تلميح اسمها* ، `email` ← محافظ بريد، phone ← محافظ هاتف، متغيرات `name` ← نص محافظ على الطول، كل شيء حساس آخر ← تجزئة. الكشف + بحث واحد = خطة كاملة.

### 3.1 اكتب المخطط

**👟 تلميح البداية :** أعد استخدام `detect_columns`، ثم تجول في القائمة المكتشفة مختارًا استراتيجية لكل تلميح بآلية `if/elif` صغيرة ، الخطة قاموس عادي يعرف `mask.apply` بالفعل كيف ينفذها:

```python
# planner.py
from detect import detect_columns
from mask import apply

def build_plan(headers: list[str], rows: list[dict]) -> dict[str, str]:
    sensitive = detect_columns(headers, rows)
    plan: dict[str, str] = {}
    for col in sensitive:
        lowered = col.lower()
        if "email" in lowered:
            plan[col] = "email"
        elif "phone" in lowered:
            plan[col] = "phone"
        elif any(hint in lowered for hint in ("name", "person", "student")):
            plan[col] = "text"
        else:
            plan[col] = "hash"
    return plan

def mask_with_plan(rows: list[dict], plan: dict[str, str]) -> list[dict]:
    return apply(rows, plan)

if __name__ == "__main__":
    import csv
    csv_text = """id,full_name,email,phone,ssn,city
1,Ada Lovelace,ada@example.com,+1 555 0101,111-22-3333,London
2,Grace Hopper,grace@navy.mil,+1 555 0102,444-55-6666,Arlington
"""
    reader = csv.DictReader(csv_text.strip().splitlines())
    rows = list(reader)
    plan = build_plan(reader.fieldnames or [], rows)
    print("plan:", plan)
    for row in mask_with_plan(rows, plan):
        print(row)
```

الشلال `email ← phone ← name ← hash` مرتب عمدًا حسب *كم الصيغة التي يجب أن تنجو*: يحافظ البريد على أكبر قدر من البنية، وكل ما يتساقط ينتهي تجزئة ، الافتراضي الحريص على الخصوصية. لأن `build_plan` يرجع قاموسًا عاديًا و`apply` يستهلك قاموسًا عاديًا، يمكن استبدال النصفين وجهًا لوجه (مخطط مدفوع بـ YAML، سجل استراتيجيات) دون أن يلمس أحدهما الآخر.

**🎯 الناتج المتوقع :**

```
plan: {'full_name': 'text', 'email': 'email', 'phone': 'phone', 'ssn': 'hash'}
{'id': '1', 'full_name': '*** ********', 'email': 'fdee430d@example.com', 'phone': '+X-----0101', 'ssn': '2e54cc08456e', 'city': 'London'}
{'id': '2', 'full_name': '***** ******', 'email': 'e010fd1c@navy.mil', 'phone': '+X-----0102', 'ssn': '74e4145b168a', 'city': 'Arlington'}
```

**🩹 إذا لم يعمل :** إذا لم يكن `ssn` في الخطة، فوجد `detect_columns` أنه حساس لكن فرع "آخر ← تجزئة" في الخطة لا يُبلغ ، تحقق أن ترتيب `if/elif` لم يبتلع `ssn` مصادفة تحت تلميح `name` (لا ينبغي). إذا أسقط الناتج المقنَّع `city`، فـ `apply` يعيد بناء الصفوف بدل نسخها ، يجب أن يفعل `dict(row)` ثم يكتب فوق في مكانه.

### 3.2 تحقّق من المخطط

**✅ قائمة التحقق**

- ✅ يرسم `build_plan` الأعمدة الحساسة الأربعة كافة إلى `text`/`email`/`phone`/`hash` على التوالي.
- ✅ `id` و`city` غائبان عن الخطة ودون تغيير في كل صف مقنَّع.
- ✅ استدعاء `mask_with_plan` مرتين على نفس الصفوف ينتج ناتجًا متطابقًا ، حتمية من النهاية للنهاية.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- الاحتياطي `hash` "بالافتراضي". لو كانت لمجموعة بيانات عمود `date_of_birth`، فما يحصل عليه هو `hash` ، لكن تجزئة عيد ميلاد هي بالضبط حالة *القابلة للتخمين بلا عناء* المعلَّمة في سؤال الخطوة 2. ما الذي كان يستند إليه احتياطي أذكى (شكل *القيمة*، لا الاسم فقط) ، وهل الافتراضي الحالي خطأ أم قرار نطاق؟
- يرجع `build_plan` قاموسًا لكنه لا يعرف كيف سيُطبَّق. أين تصبح تلك الفصلية ثمينة ، ما مثال تطبيق *نفس* الخطة على خط أنابيب مختلف (قاعدة بيانات، استجابة API) دون لمس المخطط؟

## الخطوة 4: حافظ على التوزيعات للمعرّفات الرقمية

لقناع النص معيار "حفظ" سهل (نفس الطول). للأرقام ، راتب، عمر، مكافأة ، المعيار *توزيع*، والتقنية الصادقة لحفظه بالضبط هي **التبديل داخل العمود**: خلط كل عمود رقمي حساس على حدة. كل قيمة تنجو، لذا الوسط والوسيط سليمان بالتركيب؛ ما يُدمَّر هو *الارتباط* بين هوية الصف ورقمه.

### 4.1 اكتب مقلب التبديل ومدققات الإحصاءات

**👟 تلميح البداية :** خلط مُبذَّر لكل عمود زائد `column_stats` (وسط، وسيط) وفحص مساواة متعدد-مجموعات *يثبت* حفظ التوزيع دون تخمين:

```python
# preserve.py
import random

def shuffle_column(values: list[str], seed: int = 42) -> list[str]:
    rng = random.Random(seed)
    shuffled = list(values)
    rng.shuffle(shuffled)
    return shuffled

def column_stats(values: list[float]) -> dict[str, float]:
    mean = sum(values) / len(values)
    ordered = sorted(values)
    n = len(ordered)
    if n % 2:
        median = ordered[n // 2]
    else:
        median = (ordered[n // 2 - 1] + ordered[n // 2]) / 2
    return {"mean": mean, "median": median}

if __name__ == "__main__":
    original = [52000.0, 61000.0, 47000.0, 75000.0, 66000.0, 58000.0]
    masked = [float(v) for v in shuffle_column([str(v) for v in original])]

    print("same multiset of values:", sorted(masked) == sorted(original))
    before = column_stats(original)
    after = column_stats(masked)
    print(f"mean  before {before['mean']:>9,.2f}  after {after['mean']:>9,.2f}")
    print(f"median before {before['median']:>9,.2f}  after {after['median']:>9,.2f}")
```

الخلط *محافظ حرفيًا* على التوزيع لأن النتيجة هي نفس متعدد مجموعات القيم ، `sorted(masked) == sorted(original)` ليست استدلالًا، إنها إثبات. ما يشتريه التبديل خصوصيةً أدق وأثمن: يقطع رسم *الشخص ↔ الراتب*، بينما ينجو *الشكل* الذي يصممه المحللون ("ستة رواتب بمتوسط ~59.8 ألف، ووسيط ~59.5 ألف") سليمًا دون مساس. الوسيط `seed` هو ما يجعل التشغيلات قابلة لإعادة الإنتاج ، بدونه، كان كل تشغيل إخفاء ليفرق لقمات الاختبار تلك بشكل مختلف.

**🎯 الناتج المتوقع :**

```
same multiset of values: True
mean  before 59,833.33  after 59,833.33
median before 59,500.00  after 59,500.00
```

**🩹 إذا لم يعمل :** إذا اختلف المتوسط، فغيّرت القيم بدل التبديل فيما بينها ، تحويل مثل `value * factor` يغير التوزيع؛ *الخلط* لا يستطيغ. إذا أنتج نفس `seed` خلطات مختلفة عبر التشغيلات، فـ `random.Random(seed)` يُعاد إنشاؤه داخل حلقة بدل مرة واحدة.

### 4.2 تحقّق من الحفظ

**✅ قائمة التحقق**

- ✅ `sorted(masked) == sorted(original)` يعطي `True`.
- ✅ الوسط والوسيط معًا متطابقان قبل وبعد، حتى الفلس.
- ✅ إعادة التشغيل بنفس البذرة تعيد إنتاج نفس ترتيب القناع بالضبط.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يحافظ التبديل على توزيع كل عمود لكنه *لا يكسر شيئًا عن توزيعات الأعمدة الأخرى أيضًا*. إذن ما الذي يُفقد فعلًا لمحلل في التيار اللاحق ، هل لا يزال بإمكانه الإجابة عن "هل يربح المهندسون أكثر من المصممين هنا"، وهل ما زال يستطيع الإجابة عن "أي *شخص* يربح أكثر من الجميع"? أي خسارة هي المكسب الخصوصي؟
- يبلّغ `column_stats` المتوسط والوسيط. أي خصائص *أخرى* للتوزيع كان عمودان بنفس المتوسط/الوسيط لا يزالان يختلفان فيها، وهل يحافظ التبديل على تلك الخاصية أيضًا ، أم فقط الارتباط هو ما انكسر؟

## الخطوة 5: سجل التدقيق والـ CLI

إن إخفاءً بلا سجلات ثغرة امتثال ، يجب أن تكون قادرًا على إثبات *أي* ملف أُخفي، و*أي* الأعمدة، *كم* صفًا، و*متى*. يوفر سجل تدقيق JSONL قابل للإلحاق فقط ذلك، ويؤلّف CLI `masker.py` الكشف ← الخطة ← التطبيق ← الحفظ ← التدقيق في أمر واحد.

### 5.1 اكتب `AuditLog` والـ CLI

**👟 تلميح البداية :** كاتب `audit.jsonl` قابل للإلحاق فقط (كائن JSON واحد لكل سطر)، ثم CLI يقرأ CSV، ويبني الخطة، ويكتب `masked.csv` عبر `csv.DictWriter`، ويسجل العملية:

```python
# masker.py
import argparse
import csv
import json
from datetime import datetime, timezone

from planner import build_plan, mask_with_plan

class AuditLog:
    def __init__(self, path: str = "audit.jsonl"):
        self.path = path

    def record(self, source: str, masked_columns: list[str], rows_masked: int) -> None:
        entry = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "source": source,
            "masked_columns": masked_columns,
            "rows_masked": rows_masked,
        }
        with open(self.path, "a") as f:
            f.write(json.dumps(entry) + "\n")

    def count(self) -> int:
        try:
            with open(self.path) as f:
                return sum(1 for _ in f)
        except FileNotFoundError:
            return 0

def main() -> None:
    parser = argparse.ArgumentParser(description="Mask sensitive columns of a CSV, preserving the rest.")
    parser.add_argument("csv_path")
    parser.add_argument("--output", default="masked.csv")
    args = parser.parse_args()

    with open(args.csv_path, newline="") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []
        rows = list(reader)

    plan = build_plan(headers, rows)
    masked = mask_with_plan(rows, plan)

    with open(args.output, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(masked)

    audit = AuditLog()
    audit.record(args.csv_path, list(plan), len(rows))
    print(f"masked {len(plan)} columns across {len(rows)} rows -> {args.output}")
    print(f"audit entries: {audit.count()}")
```

```bash
cat > users.csv <<'EOF'
id,full_name,email,phone,ssn,city
1,Ada Lovelace,ada@example.com,+1 555 0101,111-22-3333,London
2,Grace Hopper,grace@navy.mil,+1 555 0102,444-55-6666,Arlington
EOF
uv run python masker.py users.csv --output masked.csv
```

شكل سجل التدقيق القابل للإلحاق فقط هو الانضباط: *لا تعِد كتابة قط* ، كل `record` يلحق سطر JSON مفصولًا بأسطر، لذا السجل هو التاريخ الكامل، مستحيلًا تصغيره مصادفة. يؤلّف الـ CLI خط الأنابيب كله في أحد عشر سطرًا لأن كل مرحلة دالة كتبتها مسبقًا: `build_plan(headers, rows)` ← `mask_with_plan(rows, plan)` ← `DictWriter`.

**🎯 الناتج المتوقع :** `masked 4 columns across 2 rows -> masked.csv` ثم `audit entries: 1` ، و`masked.csv` يتشارك رؤوس المدخل مع خلايا حساسة مقنّعة، و`audit.jsonl` يحوي سطر JSON واحد بختم الطابع الزمني UTC.

**🩹 إذا لم يعمل :** إذا كان `masked.csv` فارغًا، فاستهلك `DictReader` الملف لكن لم تُقرأ صفوف ، تحقق أن الـ CSV ليس رأسًا واحدًا بلا بيانات وأنك لم تفتح `args.output` قبل إغلاق القارئ. إذا تسلق عدّ التدقيق بأكثر من واحد لكل تشغيل، فاستدعيت `record` داخل حلقة بدل مرة واحدة.

### 5.2 تحقّق من الـ CLI

**✅ قائمة التحقق**

- ✅ بعد تشغيل واحد، يحوي `masked.csv` رؤوسًا مطابقة للمصدر وقيمًا مطابقة في كل الأعمدة غير الحساسة.
- ✅ يحوي `audit.jsonl` سطرًا واحدًا بالضبط لكل تشغيل، بزمن UTC، والمصدر، والأعمدة المقنّعة، وعدّ الصفوف.
- ✅ إعادة إخفاء نفس الملف تعمل (إخفاء بيانات مقنّعة جيد ، الخطة تستهدف نفس الأعمدة).

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يسجل التدقيق *ما أُخفي* لا *أسرار* الإخفاء (بذور التجزئة أو التحويل المحدد). هل كان تسجيل البذرة سيجعل السجل أكثر قابلية للتدقيق أم أكثر خطورة ، وما الذي يخبرك به ذلك عن سجلات تدقيق تحمل *القدر الكافي فقط* لإعادة إنتاج النتائج دون كشف البيانات؟
- يكتب `masker.py` ملفًا جديدًا ولا يلمس المصدر قط. ما الذي كان على علم `--in-place` إضافته (تلميح: التدقيق ، وماذا عن `output == csv_path`) قبل أن يكون آمنًا بما يكفي للشحن؟

## ⚠️ المآزق الشائعة

- **استخدام عشوائية غير مبذّرة.** `random.shuffle` بلا بذرة ينتج مجموعة بيانات مقنّعة مختلفة في كل تشغيل، مما يكسر الاختبارات ويجعل "أعد إنتاج هذه المهمة الإخفائية" مستحيلًا. ابنِ دائمًا `random.Random(seed)` صراحة.
- **تجزئة دون الحتمية في الحسبان.** `hash()` مملّح لكل عملية في Python وبلا فائدة هنا؛ `hashlib.sha256(...)` ثابت. كما أن سمات الأحرف الصغرى/المسافات تغيّر التجزئات بصمت ، طبيع المدخل أو وثّق أن الحالة مهمة.
- **إخفاء باستبدال القيم بدل التبديل.** `salary * 1.1` يغير التوزيع الذي تعتمد عليه تحليلاتك الاختبارية. إذا كان الشكل يجب أن ينجو، بدّل؛ وحوّل فقط حين تريد الشكل أن ينحرف.
- **الحفاظ على الصيغة أبعد من نقطة الخصوصية.** إبقاء 8 من 10 أرقام هاتف "للأريحية" يسرّب معظم الرقم. حفظ *شكل*، لا أرقام ، آخر 4 هي الأكثر كثافة معلوماتية على أي حال، حتى ذاك حكم يجدر مراجعته.
- **لا أثر تدقيق.** أداة إخفاء لا تستطيع الإجابة عن "ماذا أُخفي، ومتى، وأين" تفشل في الغرض الامتثالي الذي توجد له. JSONL القابل للإلحاق فقط عشرة أسطر؛ غيابه علم أحمر في أي مراجعة حقيقية.

## ما بنيته للتو

أداة إخفاء بيانات تعمل: كشف أعمدة بالأسماء وأنماط القيم، حديقة استراتيجيات من الحذف إلى الحفاظ على الصيغة، خطة تنبني تلقائيًا، تبديل محافظ على التوزيع للأرقام، وأثر تدقيق قابل للإلحاق فقط ، كل ذلك مكتبة قياسية، وكل شيء خلف فعل CLI واحد. المهارة القابلة للنقل هي *إخفاء مريَّ للغرض*: اختيار التدمير (حذف)، أو الاسم المستعار (تجزئة)، أو الحفاظ على البنية (صيغة)، أو الحفاظ على التوزيع (تبديل) بطرح ما يحتاجه التيار اللاحق فعلًا، ثم إثبات كل اختيار بفحص لا بأمل.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
لدى [`examples/data-masker/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/data-masker) في مستودع الدورة هذه السكربتات الكاملة مع ملفات CSV عينات وسجل تدقيق مكتوب مسبقًا. أو افتح المستودع كاملًا في [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## إلى أين تذهب من هنا

- أضف وضعًا **على مستوى الخلية** لأعمدة النص الحر (أخفِ فقط الخلايا التي تطابق نمط البريد/الهاتف)، مبقيا قيم العمود غير الحساسة سليمة ، الجواب الصادق على سؤال الخطوة 1 السقراطي.
- اجعل الاحتياطي بنمط `ssn` أذكى بـ**سجل أشكال القيم** (مجموعات `\d{3}-\d{2}-\d{4}` ← قناع SSN مخصص) بدل التجزئة الجامعة الشاملة.
- أخرج إحصاءات لكل استراتيجية في إدخال التدقيق (أعمدة محفوظة الصيغة، أعمدة مبدلة، أعمدة مجزأة) حتى تقرأ مراجعات الامتثال سطرًا واحدًا لكل مهمة.
- أضف `--seed` كعلم CLI بحيث يستطيع فريق شريك إعادة إنتاج *لقطة المقنّعة الدقيقة* الخاصة بك لاختباراتهم ، قابلية إعادة الإنتاج كواجهة عامة.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها ، وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓