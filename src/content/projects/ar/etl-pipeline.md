---
title: "منشئ خط أنابيب ETL"
description: "استخراج وتحويل وتحميل البيانات من مصادر متعددة مع الجدولة واسترداد الأخطاء."
difficulty: "intermediate"
estimatedMinutes: 85
tags: ["cli", "csv", "json", "sqlite", "pipeline"]
prerequisites:
  - "أساسيات Python (القوائم والقواميس والحلقات والدوال)"
  - "راحة مع ملفات csv/json والطرفية"
learningObjectives:
  - "استخراج بيانات من مصادر CSV وJSON إلى سجلات عادية"
  - "تنظيف المصدرين وضمّهما، مع الإشارة إلى كل صف متجاوز"
  - "تجميع إجماليات البنود حسب المدينة في تقرير إيرادات"
  - "تحميل السجلات إلى SQLite بشيء يمكن إعادة تشغيله بأمان باستخدام مفاتيح أساسية"
  - "حماية خط الأنابيب من مصدر ناقص وإعادة تشغيله بأمان"
---

# 🔄 ابنِ خط أنابيب ETL

كل مهمة بيانات حقيقية تبدو هكذا: خذ الطلبات من CSV والعملاء من JSON، وضمّها، وأسقط الصفوف التي لا تنتمي، واجمع الأشياء، واكتب النتيجة إلى مكان يمكن لأداة أن تستعلم منه. ذلك النمط — **استخراج، تحويل، تحميل** — هو ما يبنيه هذا المشروع بدون سوى المكتبة القياسية: مستخرج CSV، ومستخرج JSON، وتحويل ينظّف ويضم مع الإبلاغ عن كل تجاوُز، وتجميع يجيب عن "الإيرادات حسب المدينة"، وتحميل SQLite *قابل لإعادة التشغيل بأمان (idempotent)*: شغّله خمس مرات، ما زالت الصفوف أربعة بالضبط. الخطوة الأخيرة تُصلّب المشروع كله ضد أكثر إخفاقاته شيوعًا في الإنتاج — ملف مصدر ناقص — دون ترك المستودع في حالة نصف كتابة. لا pandas. لا إطار عمل. فقط `csv` و`json` و`sqlite3` يقومون بعمل حقيقي.

هذا يفترض إنهاء Python 101 — قوائم، قواميس، حلقات، دوال — مع راحة في قراءة الملفات والطرفية. لا شيء هنا يحتاج numpy أو pandas. هذا اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. تستخرج `orders.csv` و`customers.json` إلى سجلات Python عادية.
2. تحوّل: تنظف الصفوف، وتضم أسماء العملاء والمدن، وتحسب `line_total` — وتُبلِّغ عن طلبَي التجاوز.
3. تجمّع الإيرادات حسب المدينة، مرتَّبة من الأعلى أولًا.
4. تحمّل السجلات المنظفة إلى SQLite بعملية upsert قابلة لإعادة التشغيل — شغّلها مرتين، ما زالت 4 صفوف.
5. تحصّن الاستخراج ضد ملف ناقص وتعيد تشغيل خط الأنابيب كاملًا بأمان.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الموصى به — مهمة ETL خط أنابيب ملفُّ مُخرِج (CSV/JSON داخلة، SQLite خارجة) وملفات SQLite تنتمي إلى طرفيتك.

**GitHub Codespaces** بديل بلا إعداد: افتح [مستودع الدورة كاملًا في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython مثبّتان بالفعل) وشغّل الأوامر نفسها من طرفية في المتصفح.

**Google Colab أو Kaggle Notebooks أو Binder** تعمل — الدفتر في [`examples/etl-pipeline/notebook.ar.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/etl-pipeline/notebook.ar.ipynb) يشغّل نفس ETL على مصادر العينة المرفقة في الذاكرة.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/etl-pipeline/notebook.ar.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/etl-pipeline/notebook.ar.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fetl-pipeline%2Fnotebook.ar.ipynb)

## الإعداد

`uv` أداة واحدة تحل محل سلسلة "ثبّت Python، ثم pip، ثم أداة بيئة افتراضية" — وهذا المشروع بالمكتبة القياسية النقية.

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

ثم أعدّ المشروع:

```bash
uv init etl-pipeline
cd etl-pipeline
```

**✅ قائمة التحقق**

- ✅ يطبع `uv --version` رقم إصدار.
- ✅ يوجد `etl-pipeline/` مع `pyproject.toml`.
- ✅ ينجح `python -c "import csv, json, sqlite3"` — الكومة كلها، مكتبة قياسية فقط.

## الخطوة 1: استخرج المصدرين

الفعل الأول في ETL *مجرد القراءة*: تصل طلبات CSV كقواميس عبر `csv.DictReader`، والعملاء JSON كقائمة عبر `json.load`. لا شيء يُنظَّف بعد — الاستخراج متعمَّد الغباء، فيملك التحويل كل حكم ولا يختلط الأمران أبدًا. خطوط الأنابيب الحقيقية تستخرج أولًا و*تفشل بشدة إذا كان مصدر ناقصًا* لاحقًا (الخطوة 5)؛ هنا، الخطوة 1 تثبت كلا القارئين.

### 1.1 اكتب ملفات المصدر والمستخرج

**👟 تلميح البداية :** دالة واحدة تقرأ CSV، و`json.load` واحد يقرأ JSON، ويُرجِعان سجلات عادية:

```bash
cat > orders.csv <<'EOF'
order_id,customer_id,product,qty,price,status
o1,c1,laptop,1,1200.00,delivered
o2,c2,mouse,2,25.00,delivered
o3,c1,monitor,1,300.00,delivered
o4,c3,keyboard,1,60.00,cancelled
o5,c2,laptop,1,1200.00,pending
o6,c4,usb_cable,3,10.00,delivered
EOF
```

```bash
cat > customers.json <<'EOF'
[
  {"customer_id": "c1", "name": "Ada Lovelace", "city": "London"},
  {"customer_id": "c2", "name": "Grace Hopper", "city": "New York"},
  {"customer_id": "c3", "name": "Alan Turing", "city": "Manchester"}
]
EOF
```

```python
# extract.py
import csv
import json

def extract() -> tuple[list[dict], list[dict]]:
    with open("orders.csv", newline="") as f:
        orders = list(csv.DictReader(f))
    with open("customers.json") as f:
        customers = json.load(f)
    return orders, customers

if __name__ == "__main__":
    orders, customers = extract()
    print(f"extracted {len(orders)} orders, {len(customers)} customers")
    print("first order:", orders[0])
    print("first customer:", customers[0])
```

`csv.DictReader` يستهلك صف عنوان واحدًا لمفاتيحه، لذا يخرج كل صف مسمّى الحقول أصلًا — `{"order_id": "o1", ...}` — و`list(...)` يلتقط الصفوف الستة كلها دفعة واحدة. `json.load` يوزّع المصفوفة إلى قائمة قواميس. تلميحات نوع الإرجاع (زوج قائمتين) هي عقد النزول: التحويل يستلم بالضبط ما يتوقعه، وأي شيء آخر ينكسر في موضع الاستدعاء، بصوت عالٍ. لاحظ أن قيمتي `order_id: o1` و`customer_id: c1` ما زالتا *سلسلتين نصيتين* — الاستخراج لا يعمل أي رياضيات، ولا تحويل float، ولا حكمًا.

**🎯 الناتج المتوقع :**

```
extracted 6 orders, 3 customers
first order: {'order_id': 'o1', 'customer_id': 'c1', 'product': 'laptop', 'qty': '1', 'price': '1200.00', 'status': 'delivered'}
first customer: {'customer_id': 'c1', 'name': 'Ada Lovelace', 'city': 'London'}
```

**🩹 إذا لم يعمل :** إذا طُبع `customers` كسلسلة أو قاموس بدلًا من قائمة، فـ `customers.json` ليس مصفوفة على المستوى الأعلى (سطر `[` الافتتاحي) — `json.load` يُرجع ما هو الملف فعلًا. إذا كانت `orders` هي `[]`، فملف CSV بلا صفوف فيها قيم أو صف العناوين ينقصه سطر جديد زائد — اطبع `open("orders.csv").read()` لترى ماذا رأى `DictReader` بالضبط.

### 1.2 تحقّق من المستخرج

**✅ قائمة التحقق**

- ✅ تُستخرج 6 طلبات و3 عملاء؛ وتحمل o1/o2/o3/o5 نفس مفاتيح صف العناوين.
- ✅ `price` ما زالت السلسلة `"1200.00"` — لا رياضيات وقت الاستخراج.
- ✅ يُحمَّل `customers.json` كقائمة قواميس، واحد لكل عميل.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- الاستخراج "غبي" عمدًا، لكنه مع ذلك اختار شكلًا: صفوف قواميس بقيم سلاسل. ما الذي سيغيّره مستخرج *مُنمَّط المخطط (schema-typed)* (أرقام محللة، تعدادات مفروضة) بشأن ثقة النزول — وبأي تكلفة عندما يعيد بائع CSV تسمية عمود؟
- `csv.DictReader` الافتراضي فاصلة. سمِّ القيمتين التي يرمّزها هذا الشرح ضمنيًا بالفعل (الفاصل، والاقتباس) وكيف تجعل مهمة حقيقية منهما *مدخلات خط أنابيب* صريحة بدلًا من حوادث تنسيق ملف.

## الخطوة 2: تحويل — نظّف وضمّ

التحويل يملك الحكم: طلبات `cancelled` لا تُحتسب إيرادًا، والطلب الذي لا يوجد عميله لا يمكن ضمّه، و`qty ≤ 0` أو `price < 0` هراء، وكل تجاوُز يُبلَّغ *عنه* — لا يُبتلع بصمت أبدًا. الصفوف الناجية تصبح سجلات مُثراة بأسماء العملاء والمدن و`line_total` محسوبة. اثنان من الطلبات الستة مرفوضان بالضبط كما صُمم، وخط الأنابيب يقول ذلك.

### 2.1 اكتب المنظّف/الضمّام

**👟 تلميح البداية :** ابنِ بحث `customer_by_id` أولًا (قاموس)، ثم حلّق وقرر *تجاوز أو إبقاء*، وبلّغ عن كل تجاوُز:

```python
# transform.py
import csv
import json

CLEAN_STATUSES = {"delivered", "pending"}

def transform(orders: list[dict], customers: list[dict]) -> tuple[list[dict], list[tuple]]:
    customer_by_id = {c["customer_id"]: c for c in customers}

    cleaned = []
    skipped = []
    for o in orders:
        customer = customer_by_id.get(o["customer_id"])
        if o["status"] not in CLEAN_STATUSES:
            skipped.append((o["order_id"], "cancelled"))
            continue
        if customer is None:
            skipped.append((o["order_id"], "no customer"))
            continue
        qty = float(o["qty"])
        price = float(o["price"])
        if qty <= 0 or price < 0:
            skipped.append((o["order_id"], "invalid qty/price"))
            continue
        cleaned.append({
            "order_id": o["order_id"],
            "customer_id": o["customer_id"],
            "customer_name": customer["name"],
            "city": customer["city"],
            "product": o["product"],
            "qty": qty,
            "price": price,
            "line_total": round(qty * price, 2),
            "status": o["status"],
        })
    return cleaned, skipped

if __name__ == "__main__":
    orders = list(csv.DictReader(open("orders.csv", newline="")))
    customers = json.load(open("customers.json"))
    cleaned, skipped = transform(orders, customers)

    print(f"cleaned: {len(cleaned)}  skipped: {len(skipped)}")
    for r in cleaned:
        print(f"  {r['order_id']} {r['customer_name']:<14} {r['product']:<10} "
              f"{r['qty']:.0f} x ${r['price']:.2f} = ${r['line_total']:.2f} ({r['status']})")
    print("skipped:", skipped)
```

قاموس `customer_by_id` هو الضمّ: `customer_by_id.get(o["customer_id"])` يحوّل بحث CSV عميل من O(n) لكل طلب إلى O(1)، و`None` يعمل أيضًا إشارة "المعلّق" لـ o6. قائمة التجاوزات هي سجل التدقيق — `("o4", "cancelled")`، `("o6", "no customer")` — وتُرجَع جنبًا إلى جنب مع الصفوف النظيفة، فيمكن إجراء التحليل *أيضًا* على ما أُلقي. تحويلات `float()` تحدث هنا، عند الحدود: من "سلاسل موثوقة إلى حد ما" إلى "أرقام تحت سيطرتنا"، قبل الحساب مباشرة.

**🎯 الناتج المتوقع :**

```
cleaned: 4  skipped: 2
  o1 Ada Lovelace   laptop     1 x $1200.00 = $1200.00 (delivered)
  o2 Grace Hopper   mouse      2 x $25.00 = $50.00 (delivered)
  o3 Ada Lovelace   monitor    1 x $300.00 = $300.00 (delivered)
  o5 Grace Hopper   laptop     1 x $1200.00 = $1200.00 (pending)
skipped: [('o4', 'cancelled'), ('o6', 'no customer')]
```

**🩹 إذا لم يعمل :** إذا ظهر o6 في `cleaned` باسم فارغ، فـ `continue` بعد `customer is None` ناقصة و`customer["name"]` تصطدم بـ `None` — يجب أن يتجاوز التجاوز بـ `continue`، لا أن يمرّ. إذا لم يُتجاوز شيء إطلاقًا، فـ `CLEAN_STATUSES` تنقصها `"pending"` — انتظر، ذاك يتجاوز o5 لا o4 — لذا أعد فحص سلسلة `"cancelled"` مقابل قيمة `status` الفعلية في CSV.

### 2.2 تحقّق من التحويل

**✅ قائمة التحقق**

- ✅ 4 نظيف / 2 متجاوز؛ o1/o2/o3/o5 تحصل على أسماء ومدن حقيقية.
- ✅ يظهر o4 (ملغي) وo6 (عميل مجهول) في `skipped` مع الأسباب.
- ✅ `line_total` = `qty × price`، مدوَّرة إلى منزلتين: o2 = `2 × 25 = $50.00`.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- o6 له معرّف عميل *غير معرَّف أبدًا* — انتهاك مفتاح خارجي لا يمكن لجهة CSV إصلاحه. أين يجب أن يعيش السجل المرجعي لـ"من هو c4"، وأي جانب من خط الأنابيب (استخراج، تحويل، أو مصدر العملاء) *يجب* أن يكون قد اكتشفه؟
- سبب التجاوز سلسلة نصية (`"cancelled"`). إذا غيّر البائع معجم الحالات الشهر المقبل (`"refunded"`، `"reversed"`)، فكل قيمة جديدة *تمر* بصمت عبر فحص `not in CLEAN_STATUSES` كإيراد. ما الافتراضي المتحفظ لحالة مجهولة — وما الذي يمنحك إياه سجل تدقيق التجاوزات ولن يمنحك إياه عدّ صامت أبدًا؟

## الخطوة 3: جمّع الإيرادات حسب المدينة

مع سجلات نظيفة بين يديك، يجيب التجميع عن سؤال العمل: *من يقود الإيرادات؟* `defaultdict(float)` يراكم `line_total` لكل مدينة، والفرز بالإيرادات تنازليًا يضع لندن أولًا. هذا هو الفعل الثاني للتحويل — نفس القائمة المنظفة، شكل جديد، دون إعادة تنظيف.

### 3.1 اكتب تجميع المدن

**👟 تلميح البداية :** `by_city[record["city"]] += record["line_total"]` فوق الصفوف المنظفة، ثم `sorted(..., reverse=True)`:

```python
# aggregate.py
import csv
import json
from collections import defaultdict

CLEAN_STATUSES = {"delivered", "pending"}

def transform(orders: list[dict], customers: list[dict]) -> list[dict]:
    customer_by_id = {c["customer_id"]: c for c in customers}
    cleaned = []
    for o in orders:
        customer = customer_by_id.get(o["customer_id"])
        if o["status"] not in CLEAN_STATUSES or customer is None:
            continue
        qty, price = float(o["qty"]), float(o["price"])
        if qty <= 0 or price < 0:
            continue
        cleaned.append({"order_id": o["order_id"], "customer_id": o["customer_id"],
                        "customer_name": customer["name"], "city": customer["city"],
                        "product": o["product"], "qty": qty, "price": price,
                        "line_total": round(qty * price, 2), "status": o["status"]})
    return cleaned

def revenue_by_city(records: list[dict]) -> dict:
    by_city = defaultdict(float)
    for r in records:
        by_city[r["city"]] += r["line_total"]
    return dict(by_city)

if __name__ == "__main__":
    orders = list(csv.DictReader(open("orders.csv", newline="")))
    customers = json.load(open("customers.json"))
    cleaned = transform(orders, customers)
    by_city = revenue_by_city(cleaned)

    print("== revenue by city ==")
    for city, revenue in sorted(by_city.items(), key=lambda kv: kv[1], reverse=True):
        print(f"  {city:<10} ${revenue:>9,.2f}")
    print(f"\ntotal revenue: ${sum(by_city.values()):,.2f}")
```

`defaultdict(float)` هو المراكِم الكلاسيكي: مفتاح مدينة مجهول يُولد كـ `0.0` ويُزاد منه. `sum(by_city.values())` يعيد اشتقاق الإجمالي من التجميع نفسه، فلا يمكن للإجمالي الكبير أن يخالف صفوف المدن — مصدر حقيقة واحد لكليهما. و`sorted(..., key=lambda kv: kv[1], reverse=True)` ينظر إلى أزواج `(مدينة، إيراد)` ويفرز على العنصر الثاني تنازليًا — ترتيبًا، لا أبجديًا.

**🎯 الناتج المتوقع :**

```
== revenue by city ==
  London     $ 1,500.00
  New York   $ 1,250.00

total revenue: $2,750.00
```

**🩹 إذا لم يعمل :** إذا تبادلت لندن ونيويورك الترتيب، فـ `reverse=True` ناقصة (ترتيب تصاعدي). إذا ظهرت مانشستر بـ `$ 0.00`، فبيع o4 الملغي تسرّب كصفر — أو الاثنتان لا تظهران أصلًا لأن *كامل* القائمة النظيفة فارغة (خلل تحويل من الخطوة 2 سيطفو هنا كـ `total revenue: $0.00`).

### 3.2 تحقّق من التجميع

**✅ قائمة التحقق**

- ✅ `London 1500.00` (o1 + o3)، `New York 1250.00` (o2 + o5)، مرتَّبة بالإيرادات تنازليًا.
- ✅ `total revenue: $2,750.00` يطابق `sum` الصفّين يدويًا.
- ✅ طلب مانشستر الملغي لا يساهم بشيء — الإلغاء والعضوية في مدينة حكمان غير مرتبطين.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- مدن الصفر-إيراد *غائبة عن الخريطة*، لا مسجَّلة كصفر. إذا كان السؤال "كل مدينة، بما فيها لا شيء" (مانشستر بطلبات ملغاة فقط)، فما هيكل البيانات الثاني الذي ستحتاجه — وما الذي يقوله فرق الإبلاغ عن تعبئة المجاميع للأصفار؟
- `revenue_by_city` تجمع `line_total`، الذي يجمع `qty × price`. سمِّ المكانين اللذين كان يمكن لخطوة سابقة أن تفسد فيهما هذا الرقم *بصمت* (تقريب float، سعر-كسلسلة) — وأيّهما يحرسه `round(..., 2)` في التحويل فعلًا.

## الخطوة 4: حمّل إلى SQLite، عاملًا تقبل إعادة التشغيل

التحميل هو حيث تتعطل خطوط الأنابيب: شغّل مهمة مرتين وصار كل طلب صفَّين. الإصلاح هو **مفتاح أساسي** — `order_id` معلَن `TEXT PRIMARY KEY` — مع `INSERT OR REPLACE`، عملية upsert في SQLite. إعادة تشغيل نفس التحميل بالضبط تنتج نفس الجدول بالضبط: 4 طلبات بالضبط، 0 تكرارات، في المرتين. هذه هي إمكانية إعادة التشغيل الآمن، وهي الخاصية التي تجعل ETL المجدول جديرًا بالثقة.

### 4.1 اكتب المخطط والتحميل

**👟 تلميح البداية :** `CREATE TABLE IF NOT EXISTS` مع المفتاح الأساسي، و`conn.executemany` مع إدراج `:key` مسمّى:

```python
# load.py
import csv
import json
import sqlite3

CLEAN_STATUSES = {"delivered", "pending"}

def build_cleaned() -> list[dict]:
    customer_by_id = {}
    for c in json.load(open("customers.json")):
        customer_by_id[c["customer_id"]] = c
    cleaned = []
    for o in csv.DictReader(open("orders.csv", newline="")):
        customer = customer_by_id.get(o["customer_id"])
        if o["status"] not in CLEAN_STATUSES or customer is None:
            continue
        qty, price = float(o["qty"]), float(o["price"])
        if qty <= 0 or price < 0:
            continue
        cleaned.append({"order_id": o["order_id"], "customer_id": o["customer_id"],
                        "customer_name": customer["name"], "city": customer["city"],
                        "product": o["product"], "qty": qty, "price": price,
                        "line_total": round(qty * price, 2), "status": o["status"]})
    return cleaned

def create_schema(conn: sqlite3.Connection) -> None:
    conn.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            order_id      TEXT PRIMARY KEY,
            customer_id   TEXT,
            customer_name TEXT,
            city          TEXT,
            product       TEXT,
            qty           REAL,
            price         REAL,
            line_total    REAL,
            status        TEXT
        )
    """)

def load(conn: sqlite3.Connection, records: list[dict]) -> int:
    conn.executemany("""
        INSERT OR REPLACE INTO orders
        (order_id, customer_id, customer_name, city, product, qty, price, line_total, status)
        VALUES (:order_id, :customer_id, :customer_name, :city, :product, :qty, :price, :line_total, :status)
    """, records)
    conn.commit()
    return len(records)

if __name__ == "__main__":
    conn = sqlite3.connect("warehouse.db")
    create_schema(conn)
    n = load(conn, build_cleaned())
    rows = conn.execute("SELECT COUNT(*) FROM orders").fetchone()[0]
    print(f"rows after load #1: {rows}")
    conn.close()
```

تفصيلان يحملان قابلية إعادة التشغيل. أولًا، `order_id TEXT PRIMARY KEY` — SQLite يفرض التفرد، وأي تكرار حقيقي *يستبدل* صف المفتاح الأساسي القديم هو كامل فائدة المخطط. ثانيًا، `:order_id` وما إليه معاملات مسمّاة تُربَط بالقاموس — إدراج معرَّب يحدد الحقول بالاسم، فلا تُزاح عمومًا خلط الأعمدة في القاموس أعمدةً جانبيًا في الجدول. `CREATE TABLE IF NOT EXISTS` يترك نفس السكربت يعمل ضد قاعدة بيانات جديدة وغير موجودة مسبقًا دون خطأ. `conn.commit()` هو ما يجعل الدفعة كلها متينة.

**🎯 الناتج المتوقع :**

```
rows after load #1: 4
```

**🩹 إذا لم يعمل :** إذا أظهر العد `0`، فأرجعت `build_cleaned()` `[]` — الاتصال/‏SQLite سليم، وتحويلك من الخطوة 2 أفرغ بصمت (تحقق من مسارات `continue`). إذا ارتفع العد كل تشغيل (4 → 8 → 12)، فإدراجك بلا `OR REPLACE` والمفتاح الأساسي ناقص من المخطط — أعد فحص `CREATE TABLE`: بدون `order_id TEXT PRIMARY KEY`، لا شيء يزيل التكرار.

### 4.2 تحقّق من قابلية إعادة التشغيل بإعادة التشغيل

**👟 تلميح البداية :** شغّل نفس التحميل مجددًا ضد نفس قاعدة البيانات وافحص — يجب أن تبقى التكرارات 0 وألا يتضاعف الإيراد:

```python
# rerun_check.py
import csv, json, sqlite3

CLEAN_STATUSES = {"delivered", "pending"}

def transform(orders, customers):
    customer_by_id = {c["customer_id"]: c for c in customers}
    cleaned = []
    for o in orders:
        customer = customer_by_id.get(o["customer_id"])
        if o["status"] not in CLEAN_STATUSES or customer is None:
            continue
        qty, price = float(o["qty"]), float(o["price"])
        if qty <= 0 or price < 0:
            continue
        cleaned.append({"order_id": o["order_id"], "customer_id": o["customer_id"],
                        "customer_name": customer["name"], "city": customer["city"],
                        "product": o["product"], "qty": qty, "price": price,
                        "line_total": round(qty * price, 2), "status": o["status"]})
    return cleaned

def load(conn, records):
    conn.executemany("""INSERT OR REPLACE INTO orders
        (order_id, customer_id, customer_name, city, product, qty, price, line_total, status)
        VALUES (:order_id, :customer_id, :customer_name, :city, :product, :qty, :price, :line_total, :status)""", records)
    conn.commit()

orders = list(csv.DictReader(open("orders.csv", newline="")))
customers = json.load(open("customers.json"))
cleaned = transform(orders, customers)

conn = sqlite3.connect("warehouse.db")
conn.execute("""CREATE TABLE IF NOT EXISTS orders (
    order_id TEXT PRIMARY KEY, customer_id TEXT, customer_name TEXT, city TEXT,
    product TEXT, qty REAL, price REAL, line_total REAL, status TEXT)""")
load(conn, cleaned)  # load #2 on the same database

n = conn.execute("SELECT COUNT(*) FROM orders").fetchone()[0]
dups = conn.execute("""SELECT COUNT(*) FROM (
    SELECT order_id FROM orders GROUP BY order_id HAVING COUNT(*) > 1)""").fetchone()[0]
total = conn.execute("SELECT ROUND(SUM(line_total),2) FROM orders").fetchone()[0]
print("rows after load #2 (all records):", n)
print("duplicate check:", dups)
print("total revenue in db:", total)
conn.close()
```

**🎯 الناتج المتوقع :**

```
rows after load #2 (all records): 4
duplicate check: 0
total revenue in db: 2750.0
```

**🩹 إذا لم يعمل :** إذا أظهر `duplicate check` أي شيء غير `0`، فمسار التحميل الذي تعيد تشغيله يختلف عن مسار 4.1 (مثلًا أحد السكربتين فيه `OR REPLACE` والآخر إدراج عادي). إذا كان `total revenue` هو `5500.0`، فالـ upsert لا يستبدل — أسقط الجدول بـ `conn.execute("DROP TABLE IF EXISTS orders")` وأعد تشغيل 4.1 ليعود المفتاح الأساسي إلى المخطط.

### 4.3 تحقّق من دلالات التحميل

**✅ قائمة التحقق**

- ✅ التحميل الأول → 4 صفوف؛ التحميل الثاني → ما زالت 4 صفوف؛ عدد التكرارات 0.
- ✅ `SUM(line_total) = 2750.0` — دون تغيير من إعادة التشغيل، بالضبط إجمالي المدن من الخطوة 3.
- ✅ الطلب الذي *تغيّر* (مثلًا كمية o1) يُستبدَل لا يُضاعَف، لأن `order_id` هو المفتاح الأساسي.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- `INSERT OR REPLACE` يحذف ويعيد إدراج صف المفتاح الأساسي القديم. إذا نظّف مجرى المنبع سعر o1 من `1200.00` إلى `1100.00`، فما الذي *يعالجه بالفعل* إعادة تشغيل خط الأنابيب — وما الذي *لا يعالجه* (لا يوجد تدقيق لـ"تغيّر o1 الثلاثاء الماضي")؟
- تحميل يوم طلبات في `warehouse.db` كل منتصف ليل أمر صحيح. ما الذي ينكسر إذا شُغّل خطّا أنابيب ضد نفس قاعدة البيانات في آنٍ واحد (قفل الكتابة)، وما إصلاح مستوى المعاملات (`BEGIN`/`COMMIT` حول executemany)؟

## الخطوة 5: احمِ نفسك من مصدر ناقص

الفشل الذي يحدثه كل عمل مجدول في النهاية: `orders.csv` غير موجود. دون معالجة، ينهار `FileNotFoundError` في منتصف خط الأنابيب ويُترك المستودع حاملًا ما كتبه التشغيل الجزئي السابق. خط الأنابيب المُصلَّب **يستخرج دفاعيًا** — `try/except` يُرجع `None` للملف الناقص، ويعامل المشغّل `None` كـ"ألغِ، المستودع دون تغيير". ثم يعاد تشغيل نفس خط الأنابيب بسلاسة بمجرد عودة الملف: قابلية إعادة التشغيل تعني أن الاسترداد *مجرد إعادة تشغيل*.

### 5.1 اكتب المستخرج المحمي والتشغيل الملغى

**👟 تلميح البداية :** `extract_or_none(path)` يُرجع `None` عند `FileNotFoundError`؛ والسكربت A يوضح الإلغاء:

```python
# guarded.py
import csv
import json

def extract_or_none(path: str) -> list[dict] | None:
    try:
        with open(path, newline="") as f:
            return list(csv.DictReader(f))
    except FileNotFoundError:
        return None

if __name__ == "__main__":
    orders = extract_or_none("orders.csv")
    print("extract result:", orders)
    print("pipeline short-circuits:", orders is None)
```

محاكِ الفشل بنقل المصدر بعيدًا، ثم شغّل:

```bash
mv orders.csv orders.csv.bak
python3 - <<'PY'
from guarded import extract_or_none
orders = extract_or_none("orders.csv")
customers = json.load(open("customers.json"))
print("extract result:", orders)
print("pipeline short-circuits:", orders is None)
PY
mv orders.csv.bak orders.csv
```

`extract_or_none` يضيّق الفشل إلى عَرَض واحد (`FileNotFoundError`) ويعبّر عنه كـ*قيمة* (`None`) بدلًا من استثناء — فيستطيع المُستدعي أن *يقرر*، ويتفرّع عليها، ويسجّلها، دون انهيار صارم. نوع الإرجاع `| None` يعلن العقد: "قد لا يوجد هذا بشكل مشروع." محاكاة الملف الناقص بـ `mv` هي الطريقة الأمينة لاختباره — لا إطار اختبار، فقط نظام الملفات الحقيقي يقوم بتشويه إغلاق حقيقي ويبقى خط الأنابيب سليمًا.

**🎯 الناتج المتوقع** (بينما يكون `orders.csv` منقولًا بعيدًا):

```
extract result: None
pipeline short-circuits: True
```

**🩹 إذا لم يعمل :** إذا رفع السكربت `FileNotFoundError` بدلًا من طباعة `None`، فـ `except FileNotFoundError` ناقصة أو تلتقط *فئة* مختلفة (`IOError` لن يطابق). إذا فشل إرجاع `mv` (`No such file`)، فأنت في الدليل الخطأ — يجب أن يجاور `orders.csv.bak` ملف `orders.csv` داخل `etl-pipeline/`.

### 5.2 اربط خط الأنابيب كاملًا مع الحارس

**👟 تلميح البداية :** `run_pipeline()` يؤلف استخراج → حارس → تحويل → تحميل، ويطبع `ABORTED` عند مصدر ناقص، وإعادة تشغيل زائدة تثبت الاستقرار:

```python
# run_pipeline.py
import csv, json, sqlite3

CLEAN_STATUSES = {"delivered", "pending"}

def extract_or_none(path: str) -> list[dict] | None:
    try:
        with open(path, newline="") as f:
            return list(csv.DictReader(f))
    except FileNotFoundError:
        return None

def transform(orders, customers):
    customer_by_id = {c["customer_id"]: c for c in customers}
    cleaned = []
    for o in orders:
        customer = customer_by_id.get(o["customer_id"])
        if o["status"] not in CLEAN_STATUSES or customer is None:
            continue
        qty, price = float(o["qty"]), float(o["price"])
        if qty <= 0 or price < 0:
            continue
        cleaned.append({"order_id": o["order_id"], "customer_id": o["customer_id"],
                        "customer_name": customer["name"], "city": customer["city"],
                        "product": o["product"], "qty": qty, "price": price,
                        "line_total": round(qty * price, 2), "status": o["status"]})
    return cleaned

def load(conn, records):
    conn.executemany("""INSERT OR REPLACE INTO orders
        (order_id, customer_id, customer_name, city, product, qty, price, line_total, status)
        VALUES (:order_id, :customer_id, :customer_name, :city, :product, :qty, :price, :line_total, :status)""", records)
    conn.commit()

def run_pipeline(db_path: str = "warehouse.db") -> None:
    orders = extract_or_none("orders.csv")
    if orders is None:
        print("ABORTED: orders.csv missing - warehouse unchanged")
        return
    customers = json.load(open("customers.json"))
    cleaned = transform(orders, customers)
    conn = sqlite3.connect(db_path)
    conn.execute("""CREATE TABLE IF NOT EXISTS orders (
        order_id TEXT PRIMARY KEY, customer_id TEXT, customer_name TEXT, city TEXT,
        product TEXT, qty REAL, price REAL, line_total REAL, status TEXT)""")
    load(conn, cleaned)
    n = conn.execute("SELECT COUNT(*) FROM orders").fetchone()[0]
    print(f"OK: loaded {len(cleaned)} rows; warehouse now has {n} (no duplicates)")
    conn.close()

if __name__ == "__main__":
    run_pipeline()
    run_pipeline()
```

شغّله (مرتين، في سكربت واحد — التشغيل الثاني هو إثبات قابلية إعادة التشغيل):

```bash
uv run run_pipeline.py
```

الحارس يجعل الفرق مرئيًا: مع حذف `orders.csv`، يطبع `run_pipeline` `ABORTED` ويرجع *قبل أن يفتح أي اتصال قاعدة بيانات* — يبقى عدّ صفوف المستودع عند 4، دون مساس. مع عودة الملف، يشغّل نفس الدالة ETL كاملًا ويبلّغ 4 صفوف مجددًا — **لا تكرارات**، لأن `order_id TEXT PRIMARY KEY` مع `INSERT OR REPLACE` يجعلان "نفس المدخل مرتين" يساوي "نفس المخرج مرة واحدة". إمكانية إعادة التشغيل تطوي الاسترداد في إعادة تشغيل.

**🎯 الناتج المتوقع :**

```
OK: loaded 4 rows; warehouse now has 4 (no duplicates)
OK: loaded 4 rows; warehouse now has 4 (no duplicates)
```

**🩹 إذا لم يعمل :** إذا أظهر السطر الأول `ABORTED`، فـ `orders.csv` ما زال مُعاد تسميته من 5.1 — أعد ما كان عليه بـ `mv orders.csv.bak orders.csv`. إذا أظهر السطر الثاني عدًّا مختلفًا، فالتشغيلان لا يتصلان بنفس `warehouse.db` (تحقق من المسار، أو خلط مسار مطلق مقابل نسبي في `db_path`).

### 5.3 تحقّق من خط الأنابيب المُصلَّب

**✅ قائمة التحقق**

- ✅ `mv orders.csv ...` بعيدًا → `ABORTED: orders.csv missing`، عدّ صفوف المستودع دون تغيير.
- ✅ `mv ... back` → `OK: loaded 4 rows`، ويبقى التشغيل الثاني عند 4.
- ✅ لا يفلت استثناء من المستخرج؛ المصدر الناقص حدث قابل للإبلاغ، لا انهيار.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- `run_pipeline` يلغي *قبل* فتح اتصال قاعدة البيانات. سمِّ الفشل البديل الذي يجب أن يحرسه خط أنابيب إنتاجي رغمًا عن ذلك: المصدر موجود لكن *التحويل* يرفع خطأً (فشل `float`). أين ينتمي تسجيل-وتجاوز، وما خطر الالتقاط الواسع (`except Exception`) مقابل الضيّق على `FileNotFoundError`؟
- طبعت إعادة التشغيل `OK` مرتين — لكن *إفسادًا متعمَّدًا* (ارفع سعر o1 إلى $9999) يُعالَج أيضًا "بصمت" عبر `REPLACE`. ما أول قطعة أثرية تحوّل سكربتًا إلى خط أنابيب بيانات *قابل للتدقيق* (عدّ صفوف لكل تشغيل، ملخصات المصدر، طوابع زمنية)؟

## ⚠️ مآزق شائعة

- **استخراج يقوم بالتحويل.** تحويل `float()` أو التصفية عند وقت الاستخراج يمزج المرحلتين — التحويلات تملك الحكم، والاستخراجات تملك *القراءة*. أبقِ الاستخراج غبيًّا وإلا توقف تدقيق التجاوزات عن كونه المكان الوحيد الذي تنظر إليه.
- **تجاوزات صامتة.** التنظيف دون قائمة `skipped` يخفي فقدان البيانات داخل تشغيل أخضر. بلّغ عن كل صف مُسقط بسبب: "4 أُبقي، 2 تجاوزا: [('o4','cancelled')...]" خط أنابيب يمكنك الوثوق به.
- **تحميلات غير قابلة لإعادة التشغيل.** `INSERT` عادي (بلا `OR REPLACE`، بلا مفتاح أساسي) يحوّل كل إعادة تشغيل إلى تكرار كامل. المفتاح الأساسي هو اللعبة كلها؛ بدونها "التشغيل مرتين" تعني "الصفوف مرتين".
- **تحليل الفرار.** التقاط `FileNotFoundError` لكن *عدم* التفريع عليه — طباعة `ABORTED` في العرض التجريبي موجودة لأن خط الأنابيب *يفحص* `orders is None` ويرجع. الحارس الذي لا يقرر انهيار في معطف أجمل.
- **تسرب أعمدة بصيغة `18:00`.** `line_total` تُحسب في التحويل، ثم *تُعاد حسابها* في مكان آخر بتقريب مختلف، وتنتج SUM يخالف نفسه. احسب مرة واحدة، وأعد الاستخدام في كل مكان.

## ما بنيته للتو

خط أنابيب استخراج-تحويل-تحميل كامل على المكتبة القياسية: استخراج CSV/JSON غبي، وتحويل ينظف ويضم ويحسب و*يبلّغ* كل صف متجاوز، وتجميع إيرادات على مستوى المدينة يوافق إجماليه، وتحميل SQLite قابل لإعادة التشغيل ينجو من إعادة التشغيل، ومشغّل محمي ينجو من مصدر ناقص. المهارة القابلة للنقل هي *شكل* خط الأنابيب لا الأدوات: كل مرحلة تملك مهمة واحدة، كل تجاوُز مسموع، وإمكانية إعادة التشغيل تجعل الاسترداد مملًّا — وهذا أرفع مدح يمكن أن تحصل عليه مهمة بيانات.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/etl-pipeline/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/etl-pipeline) في مستودع الدورة يحتوي السكربتات الكاملة (استخراج، تحويل، تجميع، تحميل، مشغّل محمي) بالإضافة إلى مصادر العينة. أو افتح المستودع كاملًا في [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## إلى أين تذهب من هنا

- أضف **مشغّل دفعة يومية**: حلقة تعيد تشغيل `run_pipeline()` على تواريخ متزايدة (`orders_2026_09_01.csv` → نفس الجدول)، وبلّغ `loaded N rows for 2026-09-01` لكل تاريخ — بذرة تقرير مجدول.
- اجعل خط الأنابيب **قابلًا للتدقيق**: بعد كل `load`، اكتب `loads.log` بصيغة JSONL بطابع زمني وعدّ صفوف وSHA-256 لملف المصدر. تصبح إعادة التشغيل تاريخًا، لا لغزًا.
- بدّل مرحلة التحميل إلى **جدولين**: `orders` (تفصيل) زائد `city_revenue` (تجميع)، ودع التجميع يُشتق من الجدول (لا من التحويل) — المستودع يملك تقاريره.
- أضف **فحص مخطط** في الاستخراج: أكّد أن عناوين `orders.csv` تساوي المجموعة المتوقعة قبل إرجاع الصفوف — الفشل السريع عند إعادة تسمية عمود من بائع أفضل من الفشل عند `float(float(o['qty']))` في أعماق التحويل.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓