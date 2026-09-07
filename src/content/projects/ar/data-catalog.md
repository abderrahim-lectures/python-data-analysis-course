---
title: "كتالوج البيانات"
description: "كتالوج بيانات وصفية قابل للبحث يفهرس مجموعات البيانات والمخططات وخطوط أنساب البيانات في مؤسستك."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["cli", "csv", "json", "metadata"]
prerequisites:
  - "أساسيات Python (متغيّرات، حلقات، دوال، قواميس)"
  - "قراءة ملفات CSV بوحدة csv"
learningObjectives:
  - "استخراج بيانات وصفية للمخطط (أعمدة، أنواع مستنتجة، عدد صفوف) من مجموعات بيانات CSV"
  - "إبقاء فهرس كتالوج قابل للبحث كـ JSON"
  - "تسجيل نتائج بحث مجموعات البيانات وترتيبها بتطابقات المصطلحات"
  - "تسجيل حواف أنساب البيانات واجتياز سلاسل التبعية لأعلى ولأسفل"
  - "كشف إضافة وبحث وأنساب كأوامر CLI فرعية"
---

# 🗂️ ابنِ كتالوج بيانات

قبل أن يملك أي شخص استخدام البيانات، يجب على أحد *أن يجدها*، ويثق بما هي، ويعرف من أين جاءت. هذا عمل كتالوج البيانات — فهرس المؤسسة لمجموعات بياناتها الخاصة. يبني هذا المشروع واحدًا حقيقيًا صغيرًا: يفحص ملفات CSV ويسجّل مخططها (أعمدة، أنواع مستنتجة، عدد صفوف) في فهرس JSON دائم، ويجيب عن عمليات بحث نص حر عبر أسماء مجموعات البيانات والأعمدة، ويتتبع *الأنساب* — أي مجموعة بيانات تغذي أي تحويل، بحيث تستطيع الإجابة عن "ما الذي ينكسر إذا تغير هذا CSV؟" باجتياز لا بتخمين.

هذا يفترض Python 101 مع قراءة `csv` مريحة — مجموعات، قواميس، ودوال. لا يُشترط شيء من وحدة تحليل البيانات. إنه اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/docs/projects) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. اكتب مستخرج بيانات وصفية يحوّل ملف CSV إلى إدخال كتالوج — أسماء الأعمدة والأنواع المستنتجة وعدد الصفوف.
2. ابنِ `CatalogIndex` دائمًا يحفظ ويعيد تحميل نفسه كـ JSON.
3. نفّذ بحث نص كامل مُسجَّل عبر أسماء مجموعات البيانات وأسماء الأعمدة.
4. سجّل حواف الأنساب واجتز سلاسل التبعية إلى الأمام والخلف معًا.
5. لفّ الكل في CLI `catalog.py` بأوامر فرعية `add` و`search` و`lineage`.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الموصى به — الكتالوج يدور حول *مجلداتك* من ملفات CSV على القرص، وكل معنى الـ CLI توجيهه إلى ملفات حقيقية. الإعداد بقصر فقط على المكتبة القياسية (بدون `tomllib`، لذا يكفي Python حديث عادي).

**GitHub Codespaces** بديل بلا إعداد: افتح [مستودع الدورة كاملًا في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython و`uv` مثبّتة بالفعل) وشغّل نفس الأوامر — هناك الكثير من ملفات CSV داخل `examples/` لتوجيهها إليها.

**Google Colab أو Kaggle Notebooks أو Binder** تعمل جيدًا لنصف *منطق البحث* من هذا المشروع — دفتر الملاحظات في [`examples/data-catalog/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-catalog/notebook.ipynb) يشغّل كل خطوة على مجموعات بيانات عينات مرفقة. الملاحظة الصادقة: ملفات CSV العينات في دفتر الملاحظات ثابتة، لذا سحر "افحص *مجلدي*" تجربة `uv` محلية.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-catalog/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-catalog/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdata-catalog%2Fnotebook.ipynb)

## الإعداد

`uv` أداة واحدة تحل محل سلسلة "ثبّت Python، ثم pip، ثم أداة بيئة افتراضية" — ولا شيء في هذا المشروع يحتاج حزمة خارجية.

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
uv init data-catalog
cd data-catalog
```

**✅ قائمة التحقق**

- ✅ يطبع `uv --version` رقم إصدار.
- ✅ يوجد `data-catalog/` مع `pyproject.toml`.
- ✅ ينجح `python -c "import csv, json"` — لا حزم خارجية.

## الخطوة 1: استخرج بيانات وصفية للمخطط من CSV

إدخال الكتالوج هو *وصف* مجموعة البيانات، لا البيانات نفسها: أي الأعمدة موجودة، وما نوع القيم التي يحملها كلٌّ منها، وكم عدد الصفوف. استخراج ذلك هو اللحظة التي يصبح فيها الملف الخام أصلًا قابلًا للعثور — وأصعب جزء *استنتاج نوع* من قيم عمود دون أن تكذب عليك قيمة شاردة وحيدة.

### 1.1 اكتب المستخرج ومساعد استنتاج

**👟 تلميح البداية :** أنشئ ملفي CSV عيّنتين، ثم `extract_metadata`، التي تستخدم `csv.DictReader` لالتقاط الرؤوس والصفوف، و`_infer_type`، التي تسأل "هل يمكن لكل قيمة غير فارغة أن تصبح عددًا عائمًا؟" قبل أن تجرؤ على تسمية عمود عدديًا:

```python
# metadata.py
import csv
from dataclasses import dataclass, field
from pathlib import Path

@dataclass
class CatalogEntry:
    name: str
    source: str
    columns: list[str] = field(default_factory=list)
    dtypes: list[str] = field(default_factory=list)
    row_count: int = 0

def _infer_type(values: list[str]) -> str:
    if not values:
        return "empty"
    if all(v.lower() in {"true", "false"} for v in values):
        return "boolean"
    try:
        for v in values:
            float(v)
        return "numeric"
    except ValueError:
        return "text"

def extract_metadata(path: str) -> CatalogEntry:
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        columns = reader.fieldnames or []
        rows = list(reader)
    dtypes = [
        _infer_type([row[col] for row in rows if row.get(col, "").strip()])
        for col in columns
    ]
    return CatalogEntry(
        name=Path(path).stem,
        source=path,
        columns=columns,
        dtypes=dtypes,
        row_count=len(rows),
    )

if __name__ == "__main__":
    products = """id,name,price,stock,active\n1,Keyboard,49.99,120,true\n2,Mouse,24.50,300,false\n"""
    customers = """id,full_name,region\n7,Ada Wong,north\n8,Grace Hopper,south\n"""
    with open("products.csv", "w") as f:
        f.write(products)
    with open("customers.csv", "w") as f:
        f.write(customers)

    for csv_file in ["products.csv", "customers.csv"]:
        entry = extract_metadata(csv_file)
        print(f"{entry.name}: {entry.row_count} rows")
        for col, dtype in zip(entry.columns, entry.dtypes):
            print(f"  {col}: {dtype}")
```

ترتيب الفحوص في `_infer_type` شجرة قرار صغيرة: القيم المنطقية *مجموعة فرعية* مما قد تسميه عدديًا (`"true"` ليست عددًا عائمًا فعلًا — يحرس `try float` ذلك)، لذا فقيمة المنطقية تُفحص أولًا، وتُرجع حالة `"empty"` مبكرًا حتى لا تسجَّل قيمة عمود كلّه فارغ غريبًا كعددي. `reader.fieldnames or []` دفاع هادئ: ملف فارغ له `None` fieldnames، وكل حلقة لاحقة تفترض قائمة.

**🎯 الناتج المتوقع :**

```
products: 2 rows
  id: numeric
  name: text
  price: numeric
  stock: numeric
  active: boolean
customers: 2 rows
  id: numeric
  full_name: text
  region: text
```

**🩹 إذا لم يعمل :** إذا استُنتج `price` كـ `text`، فخلية في مكان ما تحمل قيمة مثل `"49,99"` أو `"$49.99"` ترفضها `float()` — نظف البيانات أو اقبل "text" كالجواب الصادق. إذا استُنتج `active` كـ `text`، فإحدى القيم ليست `true`/`false` — تحقق من `"1"` حرفية مختلطة مع القيم المنطقية.

### 1.2 تحقّق من الاستخراج

**✅ قائمة التحقق**

- ✅ تنتج عينتا CSV الإدخالين بقوائمي العمود والنوع الصحيحتين أعلاه.
- ✅ `row_count` يساوي عدد صفوف البيانات، دون احتساب صف الرأس.
- ✅ تُرجع `_infer_type([])` القيمة `"empty"` دون انهيار.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يأتي حكم "عددي بالكامل" من *نجاح* واحد لـ `float(...)` لكل قيمة. كيف يُصنَّف عمود `id` من `["001", "002"]` — ولماذا ذلك *خطأ* على الأرجح لكتالوج حيث تعني المعرّفات استعبارات غير شفافة، لا حسابات؟
- يحمّل المستخرج كل صف في الذاكرة (`rows = list(reader)`). ما جزء الكود الذي كان يجب أن يتغير لكتالوج CSV بحجم 50 جيجابايت، وأي الأجزاء (الرؤوس، الأنواع) تنجو دون تغيير؟

## الخطوة 2: أبقِ فهرسًا قابلاً للبحث

قاموس إدخالات في الذاكرة يتبخر عندما تنتهي العملية، مما يجعله بلا فائدة ككتالوج *مؤسسة*. الإصلاح `CatalogIndex` يسلسل نفسه إلى JSON عند كل تغيير ويعيد التحميل عند البدء — نفس حيلة المتانة التي تحصل عليها الكتالوجات الحقيقية من قواعد البيانات، مصغّرة إلى ملف.

### 2.1 اكتب الفهرس المدعوم بـ JSON

**👟 تلميح البداية :** فئة يحاول منشئها تحميل `catalog.json` ويتدهور إلى قاموس فارغ عندما يفقد الملف؛ `add`/`remove` يغيّران ثم يحفظان فورًا عبر `_save`:

```python
# index.py
import json
from pathlib import Path

from metadata import CatalogEntry, extract_metadata

class CatalogIndex:
    def __init__(self, path: str = "catalog.json"):
        self.path = path
        self.entries: dict[str, CatalogEntry] = self._load()

    def _load(self) -> dict[str, CatalogEntry]:
        p = Path(self.path)
        if not p.exists():
            return {}
        data = json.loads(p.read_text())
        return {name: CatalogEntry(**payload) for name, payload in data.items()}

    def add(self, entry: CatalogEntry) -> None:
        self.entries[entry.name] = entry
        self._save()

    def remove(self, name: str) -> bool:
        removed = self.entries.pop(name, None) is not None
        if removed:
            self._save()
        return removed

    def _save(self) -> None:
        payload = {name: entry.__dict__ for name, entry in self.entries.items()}
        Path(self.path).write_text(json.dumps(payload, indent=2))

if __name__ == "__main__":
    index = CatalogIndex()
    index.remove("products")
    index.add(extract_metadata("products.csv"))
    index.add(extract_metadata("customers.csv"))
    index.remove("customers")
    for name, entry in index.entries.items():
        print(f"{name}: {entry.columns}")
```

`entry.__dict__` هو حيلة التسلسل منخفضة الجهد: مثيلات dataclass تخزن حقولها في `__dict__` عادي، لذا `json.dumps` لقاموس من `__dict__` لا يحتاج مشفّرًا مخصصًا، و`CatalogEntry(**payload)` في طريق العودة يعيد إحياءه بالمفاتيح الدقيقة. يصبح ملف JSON *مصدر الثقة* عبر التشغيلات — أغلق الطرفية وأعد فتحها، و`CatalogIndex()` يعيد بناء نفس القاموس.

**🎯 الناتج المتوقع :**

```
products: ['id', 'name', 'price', 'stock', 'active']
```

**🩹 إذا لم يعمل :** إذا ظهر `TypeError: __init__() got an unexpected keyword argument` عند إعادة التحميل، يحمل `catalog.json` مفتاحًا لا تعرّفه فئة dataclass — احذف الملف القديم أو أعد تسمية الحقل ليطابق. إذا لم يظهر `catalog.json` أبدًا على القرص، فـ `_save()` لا تُستدعى من `add` — كل مسار تغيير يجب أن يثبّت، أو "المحفوظ" كذبة.

### 2.2 تحقّق من الاستدامة

**✅ قائمة التحقق**

- ✅ إضافة إدخالين ثم إعادة فتح `CatalogIndex()` (في *عملية* جديدة) يعرض كليهما دون إعادة استخراج.
- ✅ يُرجع `remove` `True` لإدخال موجود، و`False` لاسم لم يُضف قط، ويحفظ في الحالتين.
- ✅ `catalog.json` JSON صالح يقرؤه `json.load` عائدًا إلى نفس البنية.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تستدعي الإضافة والإزالة معًا `_save`. لماذا الإبقاء على الحفظ عند كل تغيير هو الافتراضي الصادق لأداة صغيرة، وعند أي مقياس يصبح مضيعة بما يكفي ليبرر اختيار "حفظ عند الخروج" بدلًا — وما الذي *يخسره* ذلك عند انهيار؟
- يرسم الفهرس `name ← CatalogEntry`، لذا CSV ثانٍ يتصادم اسم ملفه يكتب فوق الأول بصمت. هل يجب أن يرفض `add` عند التصادم، أم الكتابة فوق هي السلوك الصحيح — ومن يجب أن يقرر؟

## الخطوة 3: البحث بالتسجيل

الكتالوج الذي لا يمكن البحث فيه متحف. النسخة الصادقة الخالية من التبعيات للبحث: قسّم الاستعلام إلى مصطلحات، وعدّ كم مرة يظهر كل مصطلح في "كومة قش" لكل مجموعة بيانات من اسمها زائد أسماء أعمدة، ورتّب بذلك العد. إنها نفس شكل عدّ tf بلواحته المصغرة تمامًا.

### 3.1 اكتب المُسجِّل

**👟 تلميح البداية :** اربط هوية كل إدخال في سلسلة واحدة صغيرة الأحرف، واجمع *حدوثات* المصطلحات داخلها، وأعد فقط الإدخالات المسجلة فوق الصفر، الأفضل أولًا:

```python
# search.py
from index import CatalogIndex

def search(index: CatalogIndex, query: str, top_k: int = 5) -> list[tuple[str, int]]:
    terms = [term.lower() for term in query.split()]
    scored = []
    for name, entry in index.entries.items():
        haystack = " ".join([name, *entry.columns]).lower()
        score = sum(haystack.count(term) for term in terms)
        scored.append((name, score))
    scored.sort(key=lambda pair: pair[1], reverse=True)
    return [(name, score) for name, score in scored if score > 0][:top_k]

if __name__ == "__main__":
    index = CatalogIndex()
    for query in ["price", "region", "id price"]:
        results = search(index, query)
        print(f"{query!r}: {results if results else 'no matches'}")
```

`haystack = " ".join([name, *entry.columns])` الصغيرة الأحرف هو المحرك كله: يسجّل البحث مقابل *اسم* مجموعة البيانات *ومخططها* معًا، وهو ما يسمح لـ `"region"` بإيجاد `customers` دون ظهور الكلمة في اسم الملف أصلًا — سطح الأعمدة بيانات وصفية قابلة للفهرسة. `haystack.count(term)` متسامح عمدًا (يعد التطابقات المتداخلة) لا واعيًا بالرموز، لأن لكتالوج بضع مئات من الإدخالات لا تستحق الدقة الإضافية محلل الرموز.

**🎯 الناتج المتوقع :**

```
'price': [('products', 1)]
'region': [('customers', 1)]
'id price': [('products', 2)]
```

**🩹 إذا لم يعمل :** إذا سجّلت استعلامات متعددة الكلمات بشكل غريب، تذكر أن الجمع يعد كل مصطلح *بشكل منفصل* — `'id price'` يجد 1 + 1 في `products`. إذا لم يطابق استعلام شيئًا كان يجب أن يطابقه، تحقق هل يحتوي مصطلح على أحرف كبيرة أو علامات ترقيم (مثل `"Price"` بصيغتين صغرى الحرفين مُعالج — لكن `"price,"` بفاصلة ليست كذلك).

### 3.2 تحقّق من البحث

**✅ قائمة التحقق**

- ✅ ترجع الاستعلامات الثلاثة أعلاه صفّيات الأفضل-أولًا المتوقعة.
- ✅ استعلام مثل `"zzz"` يرجع `[]` لا خطأً.
- ✅ البحث باسم *عمود* (`region`) يجد مجموعة البيانات التي مخططها يحمل هذا العمود، حتى لو لم يحملها اسم الملف.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يكافئ عدّ *الحدوثات* الأعمدة التي تكرر مصطلحًا. ما تعريف "الملاءمة" الذي يفوت ذلك — وما الذي كان يغيّره `count` يعاقب كومات القش الأطول (قسمة على حجم المجموعة، tf-idf مصغر) عن الترتيب؟
- البحث محدود بالاسم + الأعمدة. ما البيانات الوصفية *التي حسبتها مسبقًا* في الخطوة 1 (dtypes، row_count) التي كنت ستريدها قابلة للبحث، وما الاستعلام الذي كانت ستجيب عنه هذه النسخة لا تستطيع؟

## الخطوة 4: تتبّع أنساب البيانات

معرفة *ما هي مجموعة البيانات* نصف العمل؛ معرفة *من أين جاءت وما تغذي* هو الجزء الذي ينقذ عمليات الترحيل. الأنساب رسم مصوّر موجه — `source ← transform ← derived` — والعمليات التي يحتاجها هما اجتيازا الرسم: لأسفل ("ما الذي ينكسر إذا تغير `products.csv`؟") ولأعلى ("على ماذا يعتمد جدول لوحة القيادة هذه؟").

### 4.1 اكتب مخزن الأنساب والاجتيازين

**👟 تلميح البداية :** قائمة من ثلاثيات `(source, transform, derived)`، واجتيازان بأسلوب البحث العرضي يتفرعان من عقدة عبر الحواف الصادرة أو الواردة، كلاهما يحرس ضد الحلقات بمجموعة `seen`:

```python
# lineage.py
import json
from pathlib import Path

class Lineage:
    def __init__(self, path: str = "lineage.json"):
        self.path = path
        self.edges: list[tuple[str, str, str]] = []  # (source, transform, derived)
        if Path(path).exists():
            raw = json.loads(Path(path).read_text())
            self.edges = [(e["source"], e["transform"], e["derived"]) for e in raw]

    def record(self, source: str, transform: str, derived: str) -> None:
        self.edges.append((source, transform, derived))
        Path(self.path).write_text(json.dumps(
            [{"source": s, "transform": t, "derived": d} for s, t, d in self.edges],
            indent=2))

    def downstream(self, node: str) -> set[str]:
        seen, frontier = set(), {node}
        while frontier:
            current = frontier.pop()
            for src, _transform, derived in self.edges:
                if src == current and derived not in seen:
                    seen.add(derived)
                    frontier.add(derived)
        return seen

    def upstream(self, node: str) -> set[str]:
        seen, frontier = set(), {node}
        while frontier:
            current = frontier.pop()
            for src, _transform, derived in self.edges:
                if derived == current and src not in seen:
                    seen.add(src)
                    frontier.add(src)
        return seen

if __name__ == "__main__":
    lineage = Lineage("lineage.json")
    lineage.edges = []  # reset for a clean demo
    lineage.record("products.csv", "clean", "products_clean")
    lineage.record("products_clean", "aggregate", "revenue_by_category")
    lineage.record("customers.csv", "join", "rich_customers")
    lineage.record("products_clean", "join", "rich_customers")
    print("downstream of products.csv:", sorted(lineage.downstream("products.csv")))
    print("upstream of revenue_by_category:", sorted(lineage.upstream("revenue_by_category")))
```

حلقة `while frontier:` اجتياز رسم صحيح (بأسلوب BFS) مختبئ في Python عادي: كل عقدة مجلوبة تضيف جيرانها غير المرئيين إلى `seen` (ليُبلَّغوا) و`frontier` (ليُستكشفوا)، وهو بالضبط كيف يكتشف "ما يعتمد على `products.csv`" الجواب *المتعدي* — `revenue_by_category` أسفل التيار مع أن شيئًا لا يشير إليها مباشرة. مجموعة `seen` التي تتضاعف كحارس دورات تعني أن حلقة مُعلنة خطأً في بيانات الأنساب تنتهي بدل معلّق لتقريرك.

**🎯 الناتج المتوقع :**

```
downstream of products.csv: ['products_clean', 'revenue_by_category']
upstream of revenue_by_category: ['products.csv', 'products_clean']
```

**🩹 إذا لم يعمل :** إذا أرجع التيار السفلي *`products_clean` فقط*، فحلقة الجبهة لا تعيد زيارة العقد المضافة حديثًا — أكد أن `frontier.add(derived)` موجود داخل الحلقة، لا `seen.add` فقط. إذا أضاف العرض التوضيحي حوافًا عند كل تشغيل، فسطر إعادة الضبط `lineage.edges = []` يعمل عملًا حقيقيًا — مخزن دائم لا يُعاد ضبطه أبدًا ينمو بلا حدود.

### 4.2 تحقّق من الأنساب

**✅ قائمة التحقق**

- ✅ يرجع الاجتيازان بالضبط المجموعتين المرتبتين أعلاه (متعديان في الاتجاهين).
- ✅ عقدة بلا حواف (مثل `"ghost.db"`) ترجع مجموعة فارغة، لا خطأً.
- ✅ يُعاد تحميل `lineage.json` في قائمة الحواف نفسها في عملية جديدة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- الاجتياز *عرضي عبر مجموعة*. ما الذي كان سيتغير لو أردت *أقصر مسار تبعية* من `products.csv` إلى `revenue_by_category` — ما المعلومات التي تتخلص منها المجموعة عمدًا، وما البنية التي كانت ستحافظ عليها؟
- يعيش الاجتيازان في فئة واحدة فوق الحواف نفسها. أين يستخدم `upstream` الشرط `derived == current` بينما يستخدم `downstream` `src == current` — وكيف كانت ستشرح لزميل مبتدئ "اقلب المقارنة، وأعد استخدام كل السباكة"؟

## الخطوة 5: CLI الكتالوج

المكتبة منتهية؛ يحتاج *الأداة* أن تكون أمرًا يكتبه أحدهم. أوامر `argparse` الفرعية تحوّل المشروع كله إلى ثلاثة أفعال — `add` و`search` و`lineage` — كلٌّ يعيد استخدام دالة واحدة بالضبط من الخطوات أعلاه.

### 5.1 اربط الأوامر الفرعية

**👟 تلميح البداية :** أنشئ المحلل بـ `add_subparsers(required=True)`، وسجّل محللًا فرعيًا لكل فعل، ووزّع في `main()` يبني `CatalogIndex`/`Lineage` لكل أمر:

```python
# catalog.py
import argparse

from index import CatalogIndex
from lineage import Lineage
from metadata import extract_metadata
from search import search

def main() -> None:
    parser = argparse.ArgumentParser(description="Catalog datasets; answer search and lineage queries.")
    sub = parser.add_subparsers(dest="command", required=True)

    add_cmd = sub.add_parser("add", help="Add a CSV dataset to the catalog")
    add_cmd.add_argument("csv_path")

    search_cmd = sub.add_parser("search", help="Search datasets by name or column")
    search_cmd.add_argument("query")

    lineage_cmd = sub.add_parser("lineage", help="Show what depends on, or feeds, a dataset")
    lineage_cmd.add_argument("dataset")
    lineage_cmd.add_argument("--direction", choices=["downstream", "upstream"], default="downstream")

    args = parser.parse_args()
    index = CatalogIndex()

    if args.command == "add":
        entry = extract_metadata(args.csv_path)
        index.add(entry)
        print(f"added {entry.name}: {len(entry.columns)} cols, {entry.row_count} rows")
    elif args.command == "search":
        for name, score in search(index, args.query):
            print(f"{name}  (score {score})")
        if not index.entries:
            print("catalog is empty -- run 'add' first")
    elif args.command == "lineage":
        lineage = Lineage()
        result = lineage.downstream(args.dataset) if args.direction == "downstream" \
            else lineage.upstream(args.dataset)
        print(f"{args.direction} of {args.dataset}:", sorted(result) or "nothing")

if __name__ == "__main__":
    main()
```

```bash
uv run python catalog.py add products.csv
uv run python catalog.py search price
uv run python catalog.py lineage products.csv --direction downstream
```

النمط الذي يستحق أن يُستوعب: كل أمر فرعي *يؤلف* الدوال المكتبية السابقة لا يعيد تنفيذها — `add` هو `extract_metadata` + `index.add`، و`search` استدعاء دالة واحد، و`lineage` استدعاء فئة واحد. `required=True` على `add_subparsers` هو الفرق بين `catalog.py` بلا فعل يطبع قائمة استخدام مفيدة وبين لا يفعل شيئًا بصمت.

**🎯 الناتج المتوقع :** `added products: 5 cols, 2 rows`، ثم `products  (score 1)`، ثم `downstream of products.csv: ['products_clean', 'revenue_by_category']`.

**🩹 إذا لم يعمل :** إذا طبعت تشغيل `add` مرتين على نفس الملف نفس السطر مرتين، فذلك *صحيح* — `add` يكتب فوق نفس مفتاح الكتالوج. إذا لم يرجع `--direction upstream` شيئًا، فالحواف تحت `lineage.json` سُجّلت بأدوار `derived`/`source` تتوقعها بالعكس — يتبع الاجتياز الاتجاه المسجل، لذا أعد فحص استدعاءات `record`.

### 5.2 تحقّق من الـ CLI

**✅ قائمة التحقق**

- ✅ `add` على ملفي العينة جميعًا، ثم `search price`، يعيد إنتاج نتيجة الخطوة 3 من الطرفية.
- ✅ يسرد `catalog.py --help` و`catalog.py search --help` الأفعال والعلمان المتوقعين.
- ✅ `lineage --direction upstream` على `rich_customers` يبلغ عن `customers.csv` و`products_clean` معًا.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يطبع `search` على كتالوج فارغ تلميحًا، بينما يبلّغ `lineage` على ملف فارغ بهدوء "nothing". لماذا حالة الفارغ *مختلفة* حقًا للأمرين — ما عدم التماثل بين "لا بيانات للبحث" و"لا أنساب مسجلة"؟
- يبني كل أمر `CatalogIndex()`/`Lineage()` خاصته. متى كان سيؤثر مشاركة مثيل واحد — ولـ CLI حيث كل تشغيل أمر واحد، لماذا حالة لكل أمر هي الافتراضي *الصحيح* هنا؟

## ⚠️ المآزق الشائعة

- **تسمية أعمدة رقمية لأن *بعض* القيم أرقام.** `"42"` واحدة لا تجعل العمود عدديًا؛ يجب أن تتحلل كل قيمة غير فارغة. عمود `id` من `["001", "002"]` غالبًا معرّف *نصي* مقنّع — استنتج بحذر أو دع الكتالوج يقول "text" بصدق.
- **استدعاء `_save` في أي مكان إلا عند التغيير.** بحث "ينسى" الإبقاء أو تحميل لا يكتب أبدًا يخلقان معًا كتالوجًا تتعارض حالته على القرص مع حالته في الذاكرة. احفظ عند كل تغيير، وحمّل عند كل بدء.
- **البحث الحساس لحالة الأحرف.** `Price` مقابل `price` على بعد `.lower()` منسية من "نتائج فارغة". صغّر كومة القش والاستعلام معًا.
- **اجتيازات رسم بلا مجموعة `seen`.** كل BFS/DFS فوق رسم بأي دورة — الأنساب الحقيقية تلتف أحيانًا — يعلّق للأبد دون إزالة التكرار. انقسام `seen`/`frontier` ليس اختياريًا.
- **تسجيل الأنساب دون إعادة تشغيله أبدًا.** واجهة `record` بلا مستهلكي `downstream`/`upstream` تنتج ملف JSON لا يقرؤه أحد. ابنِ الاجتياز في نفس خطوة المخزن، كما فعلنا هنا.

## ما بنيته للتو

كتالوج بيانات حقيقي: ملفات CSV مفحوصة إلى إدخالات بيانات وصفية منمّطة مكتوبة؛ وفهرس JSON دائم ينجو من إعادة التشغيل؛ وبحث مسجَّل عبر الأسماء *والخططات*؛ ورسم أنساب مُجتاز في الاتجاهين بحيث تجيب عن "ما الذي ينكسر إذا غيّرت هذا؟" بأدلة — كل ذلك مكتبة قياسية، وكل شيء مكشوف كثلاثة أفعال CLI. المهارة القابلة للنقل هي بنية الكتالوج نفسها: وصفات (بيانات وصفية) منفصلة عن البيانات، وفهارس مُبقاة بطبقة استعلام، و*حواف أصل صريحة* تحوّل "أعتقد أن هذا متصل" إلى اجتياز رسم يمكن لأي شخص تدقيقُه.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
لدى [`examples/data-catalog/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/data-catalog) في مستودع الدورة هذه السكربتات الكاملة مع ملفات CSV عينات وفهرس مزروع مسبقًا. أو افتح المستودع كاملًا في [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## إلى أين تذهب من هنا

- أضف أمرًا فرعيًا `refresh` يعيد فحص كل مسار `source` مخزَّن في الفهرس ويحدّث عدد الصفوف/الأنواع — اكتشاف انحراف عبر كتالوجك باجتياز واحد فوق `entry.source`.
- رقِّ `_infer_type` بحكم `date` (حلل بـ `datetime.fromisoformat`) بحيث تميّز الكتالوجات التواريخ الحقيقية من النص — تغيير ثلاثة أسطر في شجرة القرار.
- اعكس مُسجِّل البحث نحو **tf-idf** (اقسم عدود المصطلحات على كم مجموعات بيانات تحوي المصطلح) حتى تتوقف أسماء الأعمدة العامة مثل `id` عن الهيمنة على النتائج.
- اعرض الأنساب ككتلة **Mermaid `graph TD`** (سطر لكل حافة) بحيث ينتج `catalog.py lineage --format mermaid` رسمًا تخطيطيًا يمكن لأي قضية GitHub تضمينه.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓