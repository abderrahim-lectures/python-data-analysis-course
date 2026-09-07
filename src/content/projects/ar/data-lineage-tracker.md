---
title: "متتبع أنساب البيانات"
description: "تصور تدفق البيانات عبر أنظمتك — من المصدر إلى لوحة المعلومات مع تحليل التأثير."
difficulty: "intermediate"
estimatedMinutes: 75
tags: ["cli", "graph", "csv", "json"]
prerequisites:
  - "أساسيات Python (متغيّرات، حلقات، دوال، مجموعات)"
  - "قراءة ملفات CSV بوحدة csv"
learningObjectives:
  - "نمذجة تدفقات البيانات كرسم موجه من عقد المصدر والتحويل والمشتق"
  - "تحميل حواف الأنساب من سجل CSV وإبقاؤها كـ JSON"
  - "اجتياز الرسم لأسفل ولأعلى مع حواجز دورات"
  - "تشغيل تحليل تأثير يبلغ عن مسار التبعية إلى كل أصل متأثر"
  - "عرض الأنساب كرسم Mermaid أو كشجرة طرفية بمسافات بادئة"
---

# 🌊 ابنِ متتبع أنساب البيانات

كل مجموعة بيانات تصل من مكان ما وتتدفق إلى مكان آخر — CSV يُنظَّف، والجدول النظيف يغذي تجميعًا، والتجميع يغذي لوحة معلومات، ولوحة المعلومات تغذي قرارًا. عندما يغيّر أحدهم مخطط المصدر، يصبح سؤال "ما المتأثر؟" عاجلًا ومريعًا دون أدوات. يجيب متتبع الأنساب عنه بجعل خط الأنابيب رسمًا يمكنك *اجتيازه*: العقد مجموعات بيانات، والحواف تحويلات، وتحليل التأثير تفرّع عرضي من أي عقدة في الرسم. يبني هذا المشروع ذلك المتتبع من المبادئ الأولى — رسم، محمّلات، اجتيازات، مسارات تأثير، وعارضان — بلا تبعيات صفرية.

هذا يفترض Python 101 مع استيراد `csv` و`json` مريح — مجموعات وحلقات في مكانها. لا يُشترط شيء من وحدة تحليل البيانات. إنه اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/docs/projects) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. نمذج الأنساب كرسم موجه من حواف `(source, transform, derived)`.
2. حمّل الحواف من سجل CSV إلى الرسم وأبقِها كـ JSON.
3. اكتب اجتازي التيار السفلي والتيار العلوي الآمنين أمام الدورات فوق ذلك الرسم.
4. احسب خريطة تأثير تبلغ عن *مسار التبعية الكامل* إلى كل أصل في التيار السفلي.
5. اعرض الرسم كرسم Mermaid أو كشجرة طرفية بمسافات بادئة، واكشفه كـ CLI.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الموصى به — أدوات الأنساب تكسب مكانتها فقط بتوجيهها إلى *خط أنابيب التحويلات* الخاص بك، لذا مجلد حقيقي على القرص هو الموطن الصادق لها.

**GitHub Codespaces** بديل بلا إعداد: افتح [مستودع الدورة كاملًا في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython و`uv` مثبّتة بالفعل) وشغّل نفس الأوامر من طرفية المتصفح.

**Google Colab أو Kaggle Notebooks أو Binder** تعمل جيدًا لنصف اجتياز الرسم — دفتر الملاحظات في [`examples/data-lineage-tracker/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-lineage-tracker/notebook.ipynb) يشغّل كل خطوة على خط أنابيب عينات مرفق ويطبع الأشجار نفسها. الملاحظة الصادقة: لا يستطيع مشاهدة ملفات *خطك* الحقيقية كما يفعل الـ CLI المحلي.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-lineage-tracker/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-lineage-tracker/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdata-lineage-tracker%2Fnotebook.ipynb)

## الإعداد

`uv` أداة واحدة تحل محل سلسلة "ثبّت Python، ثم pip، ثم أداة بيئة افتراضية" — وهذا المشروع مكتبة قياسية خالصة.

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
uv init data-lineage-tracker
cd data-lineage-tracker
```

**✅ قائمة التحقق**

- ✅ يطبع `uv --version` رقم إصدار.
- ✅ يوجد `data-lineage-tracker/` مع `pyproject.toml`.
- ✅ ينجح `python -c "import csv, json"` — لا حزم خارجية.

## الخطوة 1: نمذج الأنساب كرسم موجه

أبسط رسم صحيح للأنساب قائمة من *حواف موجهة*: كل حافة تقول `source --transform--> derived`. التوجيه مهم — البيانات تتدفق في اتجاه واحد، لذا "A تغذي B" لا تعني *البته* "B تغذي A". كل شيء آخر في هذا المشروع (اجتيازات، تأثير، عرض) كود فوق هذه القائمة الواحدة.

### 1.1 اكتب فئة الرسم

**👟 تلميح البداية :** `LineageGraph` يملك قائمة `edges` زائد `add` و`nodes` و`save` (JSON) وطريقة فئة `load` تتدهور إلى رسم فارغ عندما يفقد الملف:

```python
# graph.py
import json
from pathlib import Path

class LineageGraph:
    def __init__(self, edges: list[tuple[str, str, str]] | None = None):
        self.edges: list[tuple[str, str, str]] = edges or []

    def add(self, source: str, transform: str, derived: str) -> None:
        self.edges.append((source, transform, derived))

    def nodes(self) -> set[str]:
        nodes: set[str] = set()
        for src, _transform, derived in self.edges:
            nodes.add(src)
            nodes.add(derived)
        return nodes

    def save(self, path: str = "lineage.json") -> None:
        payload = [{"source": s, "transform": t, "derived": d}
                   for s, t, d in self.edges]
        Path(path).write_text(json.dumps(payload, indent=2))

    @classmethod
    def load(cls, path: str = "lineage.json") -> "LineageGraph":
        if not Path(path).exists():
            return cls()
        raw = json.loads(Path(path).read_text())
        return cls([(e["source"], e["transform"], e["derived"]) for e in raw])

if __name__ == "__main__":
    graph = LineageGraph()
    graph.add("products.csv", "clean", "products_clean")
    graph.add("products_clean", "aggregate", "revenue_by_category")
    graph.add("customers.csv", "join", "rich_customers")
    graph.add("products_clean", "join", "rich_customers")
    graph.save()
    print(sorted(graph.nodes()))
    print(graph.edges)
```

الاختيار البلا-لامرأة (`edges or []`) مقصود لرسم ينمو بضمّات: لا قيم افتراضية للحقول للجدال، و`edges or []` يحرس فخ الافتراضي القابل للتغيير بالتقصير في *المنشئ*. `nodes()` ترجع `set` (لا قائمة) وعدٌ هادئ — هوية العقدة عن التفرد، وكل شيء لاحق (الاجتيازات) يريد دلالات المجموعة.

**🎯 الناتج المتوقع :**

```
['customers.csv', 'products.csv', 'products_clean', 'revenue_by_category', 'rich_customers']
[('products.csv', 'clean', 'products_clean'), ('products_clean', 'aggregate', 'revenue_by_category'), ('customers.csv', 'join', 'rich_customers'), ('products_clean', 'join', 'rich_customers')]
```

**🩹 إذا لم يعمل :** إذا احتوت `nodes()` على تكرارات، فبنيت قائمة لا `set` — `nodes.add` لا يزيل تكرارًا. إذا كتب `save` ملفًا لكن أعاد `load` رسمًا فارغًا، فمفاتيح `lineage.json` لا تطابق `source`/`transform`/`derived` — افتح الملف وقارن.

### 1.2 تحقّق من النموذج

**✅ قائمة التحقق**

- ✅ ترجع `graph.nodes()` بالضبط العقد الخمس المميزة أعلاه، خالية من التكرار.
- ✅ `save()` ثم `LineageGraph.load()` في عملية جديدة ينتجان قائمة الحواف المتطابقة.
- ✅ `LineageGraph.load()` على ملف مفقود يرجع رسمًا فارغًا، لا استثناءً.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تُجمع العقد من نقاط نهاية الحواف. ما الكيان الحقيقي في نظام أنساب يلمس العقد لكن *بلا حواف* — وهل يسمح لك هذا النموذج بتمثيله أصلًا؟ أهذا خطأ أم قرار نطاق؟
- يحمل الحافة وسم `transform` ("clean"، "aggregate"). ما الذي كان الرسم *يخسره* لو أسقطت الوسم لتوفير مساحة — وأي ميزة مستقبلية (تفكير أثر، لا عدّ قوائم فقط) كانت ستفقد مفرداتها بصمت؟

## الخطوة 2: حمّل خط أنابيب من CSV

كتابة الرسوم يدويًا في Python جيدة للعروض؛ خطوط الأنابيب الحقيقية تعلن الأنساب ملفًا. تضيف هذه الخطوة الجانب الآخر من الدفتر: `transformations.csv`، بحافة واحدة لكل صف — `source,transform,derived` — يقرؤها `csv.DictReader` بحيث يسمي الرأس الحقول بدل فهارس سحرية.

### 2.1 اكتب المُحمِّل من CSV

**👟 تلميح البداية :** اكتب عينة `transformations.csv` بخمس حواف (بما فيها *تفريع*: `products_clean` يغذي شيئين)، ثم `load_csv_edges` يبني رسمًا صفًا بصف:

```python
# load_edges.py
import csv

from graph import LineageGraph

def load_csv_edges(path: str = "transformations.csv") -> LineageGraph:
    graph = LineageGraph()
    with open(path, newline="") as f:
        for row in csv.DictReader(f):
            graph.add(row["source"], row["transform"], row["derived"])
    return graph

if __name__ == "__main__":
    csv_text = """source,transform,derived
products.csv,clean,products_clean
products_clean,aggregate,revenue_by_category
customers.csv,join,rich_customers
products_clean,join,rich_customers
raw_events,dedupe,events_daily
"""
    with open("transformations.csv", "w") as f:
        f.write(csv_text)
    graph = load_csv_edges()
    print(f"{len(graph.edges)} edges, {len(graph.nodes())} nodes")
```

تحويل `DictReader` كل صف إلى `{header: value}` هو قرار التصميم الذي يبقي هذا المُحمِّل طوله سطرين — ترتيب الأعمدة في CSV أصبح الآن غير ذي صلة، لأن `row["source"]` يخاطب العمود بالاسم. إفسادًا متعمدًا للخطوات اللاحقة: العينة تضم عمدًا `products_clean ← rich_customers` *و*`products_clean ← revenue_by_category`، بحيث يكون لديك تفريع حقيقي لتجتازه في الخطوة 4 بدل خط مستقيم.

**🎯 الناتج المتوقع :**

```
5 edges, 7 nodes
```

**🩹 إذا لم يعمل :** `KeyError: 'source'` تعني أن صف رأس الـ CSV لا يضم تلك الكلمة الدقيقة — تحقق من BOM أو مسافات بادئة زائدة في سطر الرأس. إذا كان عدد الحواف 4 بدل 5، فصار صف CSV ينقصه سطر جديد زائف — آخر صف بيانات سقط من القارئ.

### 2.2 تحقّق من التحميل

**✅ قائمة التحقق**

- ✅ يبلّغ `load_csv_edges()` عن `5 edges, 7 nodes`.
- ✅ JSON الأصلي من الخطوة 1 *غير* مطلوب — `transformations.csv` وحده يعيد بناء الرسم كله.
- ✅ تحرير الـ CSV وإعادة التحميل تعطي أعداد عقد مختلفة دون لمس Python.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- مُحمِّل الـ CSV ومنشئ الخطوة 1 ينتجان معًا `LineageGraph`ين. لماذا جعل "مصدر الحقيقة الوحيد" ملفًا لا كودًا هو التصميم طويل الأمد الأفضل للأنساب — وما الذي يكلفه ذلك في المدى القصير؟
- يظهر `products_clean` كـ `derived` (صف 1) وكـ `source` (صفا 3-4) معًا. ما الثابت عن خط الأنابيب *صحيح بملاءمة* في العينة لكنه *غير مفروض* بالمُحمِّل — أين يمكن لاسم عقدة مخطوط أن يكسر الاجتياز بصمت لاحقًا؟

## الخطوة 3: اجتز الرسم في الاتجاهين

تحليل التأثير اجتياز. التيار السفلي يتفرع على طول الحواف *المغادرة* عقدة ("ما الذي ينكسر إذا تغير `products.csv`؟")؛ والتيار العلوي يتفرع على طول الحواف *الداخلة* عقدة ("من أين يحصل هذا الجدول على بياناته؟"). كلاهما نفس الحلقة بمقارنة واحدة مقلوبة، وكلاهما *يجب* أن يزيل التكرار بمجموعة `seen` — الرسوم الحقيقية تحتوي دورات، والدورة حلقة لا نهائية إن لم تنتبه.

### 3.1 اكتب الاجتيازين

**👟 تلميح البداية :** مساعد `_walk` واحد معلمي: اسحب من مجموعة `frontier`، واتبع الاتجاه المناسب لكل حافة، وأضف الجيران غير المرئيين إلى `seen` (البلاغ) و`frontier` (الاستكشاف) معًا — ثم غلافان عامان رفيعان:

```python
# walks.py
from graph import LineageGraph

def _walk(graph: LineageGraph, start: str, reverse: bool = False) -> set[str]:
    """BFS-style traversal. reverse=False follows source -> derived."""
    seen: set[str] = set()
    frontier: set[str] = {start}
    while frontier:
        current = frontier.pop()
        for src, _transform, derived in graph.edges:
            if reverse:
                src, derived = derived, src  # follow edges backwards
            if src == current and derived not in seen:
                seen.add(derived)
                frontier.add(derived)
    return seen

def downstream(graph: LineageGraph, node: str) -> set[str]:
    return _walk(graph, node, reverse=False)

def upstream(graph: LineageGraph, node: str) -> set[str]:
    return _walk(graph, node, reverse=True)

if __name__ == "__main__":
    from load_edges import load_csv_edges
    graph = load_csv_edges()
    print("downstream of products.csv:", sorted(downstream(graph, "products.csv")))
    print("upstream of rich_customers:", sorted(upstream(graph, "rich_customers")))
```

حلقة `while frontier` هي التوسع العرضي الكلاسيكي مرتديًا Python عاديًا: كل تكرار يستنزف الجبهة الحالية ويبذر التالية، و`seen` يؤدي واجبين — إنه *الجواب* (المجموعة القابلة للوصول) و*ضمانة الإنهاء* (تصبح الدورات بلا مفعول). قارن الغلافين: يتشارك `downstream` و`upstream` كل سطر؛ والمقارنة المقلوبة الوحيدة `derived, src = src, derived` هي الاختلاف كله، وهو بالضبط لماذا مفيد مساعد معلمي متفوق على دالتين منسوختين-ملصوقتين.

**🎯 الناتج المتوقع :**

```
downstream of products.csv: ['products_clean', 'revenue_by_category', 'rich_customers']
upstream of rich_customers: ['customers.csv', 'products.csv', 'products_clean']
```

**🩹 إذا لم يعمل :** إذا فات `rich_customers` التيار السفلي لـ`products.csv`، فالاجتياز ليس متعديًا — أكد وجود `frontier.add(derived)` بجانب `seen.add(derived)`؛ دون إعادة بذر تحصل على الجيران المباشرين فقط. إذا علّق العرض التوضيحي، فلديك دورة لم تضفها — حارس `seen` في `_walk` هو ما يجعل الحلقة اللانهائية مستحيلة، لذا أكد أنه داخل الحلقة عند *كل* إضافة.

### 3.2 تحقّق من الاجتيازات

**✅ قائمة التحقق**

- ✅ يرجع الاجتيازان المجموعتين المرتبتين الدقيقتين أعلاه (كلٌّ نتيجة وصول *متعدية*).
- ✅ `downstream(graph, "raw_events")` يرجع `{'events_daily'}`، و`upstream(graph, "raw_events")` يرجع مجموعة فارغة — تيار المصدر العلوي لا شيء.
- ✅ إضافة دورة (`events_daily ← raw_events`) إلى الـ CSV وإعادة الاجتياز تنتهي بمخرجات منتهية.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يزور الاجتياز *نفس* العقدة مرة واحدة مهما بلغ عدد المسارات الواصلة إليها. ما المعلومات عن "ثمة مساران مستقلان من `products.csv` إلى `rich_customers`" التي ترميها مجموعة بصمت — ولماذا يحتاج `impact` في الخطوة التالية بالضبط إلى تلك البنية الأغنى؟
- `reverse=True` يبدّل نقطتي النهاية، لا المقارنة فقط. هل كان قلب `src == current` إلى `derived == current` *دون* تبادل نقطتي النهاية ينتج نفس الجواب؟ فكّر عبر حافة واحدة لتقرر.

## الخطوة 4: تحليل تأثير بمسارات حقيقية

"العملاء الأثرياء متأثرون" *ادعاء*؛ "rich_customers متأثرة، وإليك `products.csv ← products_clean ← rich_customers`" *دليل*. يرقّع تحليل التأثير مجموعة الوصول من الخطوة 3 إلى خريطة `أصل متأثر ← مسار تبعية`، بحيث يمكن لتقرير إظهار *كيف* يبلغ نصف قطر الانفجار كل جدول.

### 4.1 اكتب خريطة التأثير

**👟 تلميح البداية :** حمّل أزواج `(node, path)` في الجبهة، وسجّل أول مسار يُعثر عليه لكل أصل، وأعد استخدام قاموس-كما-مسارات `seen` لإيقاف إعادة الزيارة:

```python
# impact.py
from graph import LineageGraph

def impact(graph: LineageGraph, start: str) -> dict[str, list[str]]:
    """Map every downstream asset to the first path reaching it."""
    paths: dict[str, list[str]] = {}
    frontier: list[tuple[str, list[str]]] = [(start, [start])]
    while frontier:
        current, path = frontier.pop()
        for src, _transform, derived in graph.edges:
            if src == current and derived not in paths:
                paths[derived] = [*path, derived]
                frontier.append((derived, paths[derived]))
    return paths

if __name__ == "__main__":
    from load_edges import load_csv_edges
    graph = load_csv_edges()
    for asset, path in sorted(impact(graph, "products.csv").items()):
        print(f"{asset}:  {' -> '.join(path)}")
```

المسار هو الابتكار فوق الخطوة 3: تحمل الجبهة الآن التاريخ (`[start, ..., current]`)، ويحفظ `paths[derived] = [*path, derived]` *نسخة* إلى خريطة الجواب عند بلوغ عقدة أول مرة. فحص `derived not in paths` هو مجموعة `seen` باسم آخر — مفاتيح القاموس *هي* مجموعة الزيارة، لذا يُحفظ أول مسار وجد لأصل وتنتهي الدورات.

**🎯 الناتج المتوقع :**

```
revenue_by_category:  products.csv -> products_clean -> revenue_by_category
rich_customers:  products.csv -> products_clean -> rich_customers
```

**🩹 إذا لم يعمل :** إذا اقتُطعت المسارات (نقص `products.csv`)، فـ `[*path, derived]` يبني من `path` قديم — يجب أن تفكّ *المسار المحمول*، لا `paths[current]`، لأن القيمة المحمولة تسجل الطريق إلى `current` نفسها. إذا رُسمت إصلاحان لكن *الترتيب* خلط بين التشغيلات، فالجبهة `list` مستخدمة كرصة (LIFO) — الترتيب غير مضمون؛ رتّب المخرجات كما يفعل العرض التوضيحي.

### 4.2 تحقّق من التأثير

**✅ قائمة التحقق**

- ✅ يظهر الإصلاحان القابلان للوصول من `products.csv` بمساريهما الثلاثيي العقد الكاملين.
- ✅ تحتوي الخريطة المتأثرة نفس مجموعة عقد خطوة 3 `downstream("products.csv")`.
- ✅ إضافة `events_daily` إلى الرسم تظهر في `impact(graph, "raw_events")` — كمسار خطوتين، لا حافة خطوة واحدة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تخزن الخريطة *أول* مسار يُعثر عليه فقط. في رسم بمسارين إلى نفس الجدول، يُسقط الثاني — الأقصر مثلًا أو الأكثر حرجًا — بصمت. هل "الأول-المسجل" مقبول لأداة نصف قطر انفجار ترحيل — وما الذي كان "كل المسارات" يقتضيه وراء هذا القاموس؟
- يتضمن المسار *العقد* لا *التحويلات* ("clean"، "aggregate"). أين كان كشف التحويل عند كل قفزة يبقيك صادقًا حول *ما نوع الكسر* المتوقع — مخطط أم دلالي؟

## الخطوة 5: اعرضها واكشفها كـ CLI

الرسم يُحلَّل؛ *الرسم التخطيطي* يُبلَّغ. عارضان يغطيان انقسام الجمهور الحقيقي: Mermaid (`graph TD`، قابل للصق مباشرة في قضايا GitHub وNotion) للمشاركة، وشجرة طرفية بمسافات بادئة للقراءة المحلية الفورية. يربط الـ CLI تحميل البيانات والتأثير والعرض في ثلاثة أفعال قابلة للضرب.

### 5.1 اكتب العارضين

**👟 تلميح البداية :** `to_mermaid` عبارة عن f-string واحدة لكل حافة؛ `render_tree` DFS تكراري يصدر أسطر عقد بمسافات بادئة بينما تمنع مجموعة بادئة المسار التكرار اللانهائي على الدورات:

```python
# render.py
from graph import LineageGraph
from impact import impact

def to_mermaid(graph: LineageGraph) -> str:
    lines = ["graph TD"]
    for src, transform, derived in graph.edges:
        lines.append(f'    "{src}" -->|"{transform}"| "{derived}"')
    return "\n".join(lines)

def render_tree(graph: LineageGraph, root: str) -> str:
    paths = impact(graph, root)

    def emit(node: str, depth: int, ancestors: set[str]) -> None:
        yield "    " * depth + node
        for src, _transform, derived in graph.edges:
            if src == node and derived not in ancestors:
                yield from emit(derived, depth + 1, ancestors | {node})

    return "\n".join(emit(root, 0, set()))

if __name__ == "__main__":
    from load_edges import load_csv_edges
    graph = load_csv_edges()
    print(to_mermaid(graph))
    print()
    print(render_tree(graph, "products.csv"))
```

`render_tree` *مولّد* (لاحظ `yield`/`yield from`) — الشجرة ذات المسافات البادئة تتدفق أسطرها بدل بناء سلسلة عملاقة واحدة، مما يبقي الذاكرة مسطحة حتى لخطوط الأنابيب العميقة. مجموعة `ancestors` هي حارس الدورات المعاد بيانه *للمسار* لا للمجموعة المزارة: `products_clean ← rich_customers` صالحة فقط إذا لم تكن `rich_customers` أصلًا سلفًا للعقدة الحالية — لذا تُظهر الشجرة التسلسل الحقيقي، لا صدى لنفسها.

**🎯 الناتج المتوقع :**

كتلة Mermaid بخمسة أسهم `-->` (أسماء عقد مقتبسة، وسوم تحويل)، ثم الشجرة ذات المسافات البادئة:

```
products.csv
    products_clean
        revenue_by_category
        rich_customers
```

**🩹 إذا لم يعمل :** إذا بادّت الشجرة كل عقدة إلى *نفس* المستوى، فـ `emit` يعود من الحلقة قبل التكرار — تحقق من `yield from emit(...)`، لا `emit(...)` عارية (والتي تنشئ المولّد وترميه). إذا عرضت Mermaid هراءً غير مقتبس، لفّ كل اسم عقدة بعلامات اقتباس مزدوجة داخل f-string — الأسماء بنقاط أو مسافات هي التي تنكسر غير ذلك.

### 5.2 ابنِ الـ CLI

**👟 تلميح البداية :** أمران فرعيان يتشاركان `load_csv_edges()` واحدة — `impact <node>` يطبع أسطر الأصول والمسارات، و`dump <node> --format mermaid|tree` يطبع العرض:

```python
# lineage.py
import argparse

from impact import impact
from load_edges import load_csv_edges
from render import render_tree, to_mermaid

def main() -> None:
    parser = argparse.ArgumentParser(description="Query and render data lineage.")
    sub = parser.add_subparsers(dest="command", required=True)

    impact_cmd = sub.add_parser("impact", help="List every downstream asset with its path")
    impact_cmd.add_argument("node")

    dump_cmd = sub.add_parser("dump", help="Render lineage as Mermaid or an indented tree")
    dump_cmd.add_argument("node")
    dump_cmd.add_argument("--format", choices=["mermaid", "tree"], default="mermaid")

    args = parser.parse_args()
    graph = load_csv_edges()

    if args.command == "impact":
        results = impact(graph, args.node)
        if not results:
            print(f"no downstream assets for {args.node}")
        for asset, path in sorted(results.items()):
            print(f"{asset}:  {' -> '.join(path)}")
    elif args.command == "dump":
        print(to_mermaid(graph) if args.format == "mermaid" else render_tree(graph, args.node))

if __name__ == "__main__":
    main()
```

```bash
uv run python lineage.py impact products.csv
uv run python lineage.py dump products.csv --format tree
```

الـ CLI طبقة رقيقة صادقة: صفر منطق نطاق جديد، رسم `load_csv_edges()` مشترك واحد لكل تشغيل، وكل فرع يفوّض إلى دالة واحدة بالضبط من الخطوات أعلاه. `choices=["mermaid", "tree"]` يجعل `--format mermaide` المخطوط *خطأ استخدام مفيدًا* من `argparse` لا عرضًا خاطئًا صامتًا.

**🎯 الناتج المتوقع :** يطبع `impact products.csv` سطري الأصول والمسارات من الخطوة 4؛ و`dump ... --format tree` يطبع الشجرة ذات المسافات البادئة.

**🩹 إذا لم يعمل :** إذا طبع كل فرع "no downstream assets"، فمجلد عمل الطرفية يفتقد `transformations.csv` — شغّل من المجلد حيث كتبته الخطوة 2، وإلا فلن يرى الـ CLI الحواف أصلًا. إذا طبع `--format tree` لا شيء لعقدة صالحة، فتمرر اسم عقدة بخطأ إملائي — `products.csv` يطابق حافة `source` بالضبط.

### 5.3 تحقّق من الـ CLI

**✅ قائمة التحقق**

- ✅ يطابق `impact products.csv` ناتج الخطوة 4 بالضبط.
- ✅ يطبع `dump raw_events --format mermaid` كتلة `graph TD` من أربعة أسطر يمكنك لصقها في قضية GitHub.
- ✅ يسرد `lineage.py --help` الأمرين الفرعيين وخيارات `--format`.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يستدعي `impact` و`dump` كلٌّ `load_csv_edges()` مرة — لكن لو احتاج أمر مستقبلي تشغيل *كلٍّ* من التأثير والعرض، فمشاركة رسم واحد تصبح هيكلة الـ CLI حول كائن سياق. أين الخط حيث يكف "الإنشاء لكل فرع" عن كونه جيدًا؟
- ناتج Mermaid نص يلصقه إنسان؛ والشجرة نص يقرؤه إنسان. لـ *كاشف تغيير CI* آلي، أي العارضين (إن وُجد) هو تنسيق الناتج الخاطئ — وما الذي كان سيبدو عليه الصحيح؟

## ⚠️ المآزق الشائعة

- **نسيان أن الحواف موجهة.** `A ← B` لا تعني أبدًا `B ← A`. إذا أرجع التياران العلوي والسفلي نفس المجموعة، فبنيت اجتيازًا *غير موجه* — تحقق من نقطة النهاية التي تتبعها كل مقارنة.
- **الاجتياز دون حارس زيارة.** أي دورة في البيانات (والأنساب الحقيقية تجمعها) تحوّل تكرارًا ساذجًا إلى حلقة لا نهائية أو `RecursionError`. `seen` (الاجتيازات) و`ancestors` (الشجرة) ليسا اختياريين.
- **تسجيل الجيران المباشرين فقط.** تحليل تأثير لا يعيد بذر الجبهة يجيب عن "ما الذي *يعتمد مباشرة* على هذا؟" — سؤال مفيد لكنه مختلف. المتعدي يعني `frontier.add(...)` بعد كل اكتشاف.
- **تخزين هوية عقدة بشكل غير متناسق.** `Products.csv` في صف و`products.csv` في آخر يخلقان عقدتين بفارق حرف واحد. طبيع الاسمَين عند التحميل أو كل مسار يتفرع بصمت.
- **ترك العارض يملك التحليل.** إذا أعاد `render_tree` حساب وصوله الخاص بدل إعادة استخدام `impact`، فيمكن للرسم التخطيطي وتقرير التأثير أن يختلفا على نفس الرسم. رسم واحد، اجتياز واحد، عارضون كثيرون.

## ما بنيته للتو

متتبع أنساب حقيقي: رسم موجه من مجموعات البيانات والتحويلات، محمّل من CSV ومُبقى كـ JSON، مُجتاز لأسفل ولأعلى باجتيازات آمنة أمام الدورات، مُحلَّل إلى خرائط تأثير *حاملة للمسار*، ومُعرَض كـ Mermaid قابلة للمشاركة وأشجار قابلة للقراءة — كل ذلك مكتبة قياسية، وكل شيء خلف CLI ثنائي الأفعال. المهارة القابلة للنقل هي التفكير في خط الأنابيب كرسم بدل ترتيب سكربت: بمجرد أن يصبح تدفق البيانات حوافًا قابلة للمشي، يتوقف "ما الذي ينكسر إذا غيّرت هذا؟" عن كونه اجتماعًا ويصبح استدعاء دالة.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
لدى [`examples/data-lineage-tracker/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/data-lineage-tracker) في مستودع الدورة هذه السكربتات الكاملة مع خط أنابيب عينات أكبر وMermaid مولد مسبقًا. أو افتح المستودع كاملًا في [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## إلى أين تذهب من هنا

- وسّع الـ CSV بعمود `schema_change` ("rename"، "drop"، "add") واجعل `impact` يعلّق على كل أصل *ما نوع* الكسر المتوقع — الجواب على سؤال الخطوة 4 السقراطي، والآن من الدرجة الأولى.
- أضف عارض `.dot` (Graphviz) بحيث يستطيع الـ CLI إصدار `lineage.dot` ودع Graphviz يوزّع الرسم كله عبر `dot -Tpng`.
- نفّذ تحليل تأثير **لكل المسارات** (DFS محدود يسجل كل طريق، لا الأول)، ثم قارن أطول سلاسل التبعية وأقصرها لنفس الأصل.
- اكتشف الحواف تلقائيًا: افحص مجلد ملفات SQL/نص عن `INSERT INTO x SELECT ... FROM y` وغذّ التطابقات إلى مُحمِّل الـ CSV — استخراج أنساب، لا عرض فقط.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓