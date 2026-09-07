---
title: "دفتر المختبر الرقمي"
description: "سجّل التجارب مع بيانات منظمة وحسابات وخطوط تحليل قابلة للتكرار."
---


# 📓 ابنِ دفتر مختبر رقمي

يتتبع العلماء التجارب والفرضيات والنتائج بنسخ. يفعل دفتر المختبر الرقمي الشيء نفسه لكن ببنية: كل تجربة تحصل على قالب، وتتغذى القياسات في الحسابات، وتُصدَّر النتائج كتقارير قابلة للتكرار. يبني هذا المشروع ذلك تحديدًا.

يفترض هذا إنهاء Python 101 وارتياحًا مع pandas من تحليل البيانات. هذا اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/docs/projects) للاطلاع على القائمة الكاملة.

## 🎯 ما ستفعله

1. إعداد مشروع باستخدام `uv` وتثبيت تبعيات الدفتر والتصدير.
2. تعريف قوالب تجارب منظمة بحقول مُنمّطة.
3. إضافة محرك حساب مضمّن لتشغيل التحليل على القياسات.
4. تنفيذ سجل نسخ يتتبع كل تغيير.
5. تصدير التجارب إلى تقرير PDF جاهز للنشر.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي — هذه أداة CLI تكتب ملفات تجارب وملفات PDF.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/lab-notebook/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/lab-notebook/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Flab-notebook%2Fnotebook.ipynb)

## الإعداد

كل ما تحتاجه قبل البناء: بيئة Python، وpandas، وReportLab.

### ثبّت `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

أغلق طرفيتك وأعد فتحها، ثم أكِّد:

```bash
uv --version
```

### هيّئ المشروع

```bash
uv init lab-notebook
cd lab-notebook
uv add pandas reportlab click
```

تغذي `pandas` محرك الحساب. يولّد `reportlab` ملفات PDF المُصدَّرة. يوفّر `click` واجهة CLI.

### أنشئ بنية المشروع

```bash
mkdir -p notebook
touch notebook/__init__.py notebook/model.py notebook/calculations.py notebook/store.py notebook/export.py notebook/cli.py
```

**✅ قائمة التحقق**

- ✅ `uv --version` يطبع رقم إصدار.
- ✅ يوجد `lab-notebook/` مع `pyproject.toml` وكل التبعيات مثبَّتة.
- ✅ يحتوي مجلد `notebook/` على جميع ملفات الوحدات المطلوبة.

## الخطوة 1: حدّد قوالب تجارب منظمة

للتجربة فرضية وشروط وقياسات ونتيجة. ترميز هذه كفئة بيانات مُنمّطة يعطي كل تجربة شكلًا متسقًا.

### 1.1 أنشئ نموذج التجربة

**👟 تلميح البداية :**

أنشئ `notebook/model.py`.

```python
# notebook/model.py
from dataclasses import dataclass, field
from datetime import datetime

@dataclass
class Measurement:
    label: str
    value: float
    unit: str = ""

@dataclass
class Experiment:
    title: str
    hypothesis: str
    measurements: list[Measurement] = field(default_factory=list)
    created: str = field(default_factory=lambda: datetime.now().isoformat())
    versions: list[dict] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "title": self.title,
            "hypothesis": self.hypothesis,
            "measurements": [m.__dict__ for m in self.measurements],
            "created": self.created,
            "versions": self.versions,
        }
```

**🎯 الناتج المتوقع :**

ينشئ `Experiment("Grow rate", "Light increases growth")` تجربة منظمة قابلة للتسلسل.

**🩹 إذا لم يعمل :**

إذا فشل `to_dict`، تحقّق من ترتيب حقول فئة البيانات.

### 1.2 تحقّق من النموذج

**✅ قائمة التحقق**

- ✅ تقبل `Experiment` العنوان والفرضية وقياسات اختيارية.
- ✅ يُرجع `to_dict()` قاموسًا مسطّحًا قابلًا للتسلسل.
- ✅ يتحول `created` افتراضيًا إلى الطابع الزمني الحالي.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- كيف تضيف تحققًا بحيث لا تكون القياسات سالبة عندما يكسر ذلك المعنى الفيزيائي للتجربة؟

## الخطوة 2: ابنِ محرك الحساب

يشغّل المحرك تحليلًا على القياسات: المتوسط والانحراف المعياري وصيغة خط الاتجاه.

### 2.1 أنشئ الحسابات

**👟 تلميح البداية :**

أنشئ `notebook/calculations.py`.

```python
# notebook/calculations.py
import statistics
from notebook.model import Experiment


def analyze(exp: Experiment) -> dict:
    values = [m.value for m in exp.measurements]
    if not values:
        return {"error": "no measurements"}
    result = {
        "count": len(values),
        "min": min(values),
        "max": max(values),
        "mean": statistics.mean(values),
        "stdev": statistics.stdev(values) if len(values) > 1 else 0.0,
    }
    result["cv"] = result["stdev"] / result["mean"] if result["mean"] else 0
    return result


def trend_formula(values: list[float]) -> str:
    """Least-squares slope/intercept as a readable y = mx + b string."""
    n = len(values)
    if n < 2:
        return "y = N/A (need >= 2 points)"
    xs = list(range(n))
    x_mean = sum(xs) / n
    y_mean = sum(values) / n
    slope = sum((x - x_mean) * (y - y_mean) for x, y in zip(xs, values)) / \
            sum((x - x_mean) ** 2 for x in xs)
    intercept = y_mean - slope * x_mean
    return f"y = {slope:.3f}x + {intercept:.3f}"
```

**🎯 الناتج المتوقع :**

يُرجع `analyze(exp)` العدد والحد الأدنى والحد الأقصى والمتوسط والانحراف المعياري؛ ويُرجع `trend_formula` معادلة مقروءة.

**🩹 إذا لم يعمل :**

إذا أخطأ `stdev` عند نقطة واحدة، يتعامل معه حارس `len(values) > 1`.

### 2.2 تحقّق من الحسابات

**✅ قائمة التحقق**

- ✅ يُرجع `analyze` إحصاءات لتجربة مليئة بالبيانات.
- ✅ تُرجع التجارب الفارغة قاموس خطأ ودودًا.
- ✅ ينتج `trend_formula` سلسلة `y = mx + b` لنقطتين أو أكثر.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- ما الإحصائية الإضافية التي يتوقعها عالم البنش بعد المتوسط والانحراف المعياري؟

## الخطوة 3: تتبّع النسخ

كلما تغيرت تجربة، التقط لقطة لها. هذا يجعل كل حالة سابقة قابلة للاسترجاع.

### 3.1 أضف إدارة النسخ

**👟 تلميح البداية :**

أنشئ `notebook/store.py`.

```python
# notebook/store.py
import json, copy
from datetime import datetime
from notebook.model import Experiment


class NotebookStore:
    def __init__(self, path="notebook.json"):
        self.path = path
        self.experiments: dict[str, Experiment] = {}

    def add(self, exp: Experiment):
        exp.versions.append({"snapshot": exp.to_dict(), "time": datetime.now().isoformat()})
        self.experiments[exp.title] = exp

    def update(self, exp: Experiment, **changes):
        exp.versions.append({"snapshot": exp.to_dict(), "time": datetime.now().isoformat()})
        for key, value in changes.items():
            setattr(exp, key, value)

    def history(self, title) -> list[dict]:
        exp = self.experiments.get(title)
        return exp.versions if exp else []

    def rollback(self, title, version_index):
        exp = self.experiments[title]
        version = exp.versions[version_index]["snapshot"]
        exp.versions.append({"snapshot": exp.to_dict(), "time": datetime.now().isoformat()})
        exp.measurements = [type(exp.measurements[0])(**m) for m in version["measurements"]]
        exp.hypothesis = version["hypothesis"]

    def save(self):
        with open(self.path, "w") as f:
            json.dump({k: v.to_dict() for k, v in self.experiments.items()}, f, indent=2)
```

**🎯 الناتج المتوقع :**

يسجّل `store.update(exp, hypothesis="New idea")` الحالة السابقة، ويستعيدها `rollback`.

**🩹 إذا لم يعمل :**

إذا تعطل التراجع، فقد لا تعيد قياسات اللقطة بناءَ كائنات نظيفة — تحقّق من مفاتيح القاموس.

### 3.2 تحقّق من إدارة النسخ

**✅ قائمة التحقق**

- ✅ كل `add`/`update` يلحق لقطة نسخة.
- ✅ يُرجع `history` أثر النسخ.
- ✅ يستعيد `rollback` الحالة السابقة ويسجّل الانتقال.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تحتفظ الإدارة الحالية بالنسخ بلقطات كاملة. متى تكون المقاربة القائمة على الفرق أفضل، ولماذا التعقيد الإضافي؟

## الخطوة 4: صدِّر إلى PDF

دفتر المختبر مفيد فقط إذا استطاع الآخرون قراءته. أنشئ تقريرًا نظيفًا من بيانات التجربة.

### 4.1 أنشئ مُصدِّر PDF

**👟 تلميح البداية :**

أنشئ `notebook/export.py`.

```python
# notebook/export.py
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table
from notebook.calculations import analyze
from notebook.model import Experiment


def export_pdf(exp: Experiment, out_path: str):
    styles = getSampleStyleSheet()
    doc = SimpleDocTemplate(out_path, pagesize=A4)
    story = [
        Paragraph(exp.title, styles["Title"]),
        Spacer(1, 12),
        Paragraph(f"<b>Hypothesis:</b> {exp.hypothesis}", styles["Normal"]),
        Spacer(1, 12),
    ]
    stats = analyze(exp)
    if "error" not in stats:
        story.append(Paragraph(f"Mean: {stats['mean']:.3f}  |  Stdev: {stats['stdev']:.3f}", styles["Normal"]))
    rows = [["Label", "Value", "Unit"]]
    rows += [[m.label, str(m.value), m.unit] for m in exp.measurements]
    story.append(Table(rows))
    doc.build(story)
```

**🎯 الناتج المتوقع :**

يكتب `export_pdf(exp, "report.pdf")` ملف PDF بعنوان وفرضية وإحصاءات وجدول قياسات.

**🩹 إذا لم يعمل :**

إذا كان الجدول مشوهًا، تحقّق من عرض الصفوف وأن كل صف يملك العدد الصحيح من الأعمدة.

### 4.2 تحقّق من التصدير

**✅ قائمة التحقق**

- ✅ يُكتب ملف PDF إلى `out_path`.
- ✅ يظهر العنوان والفرضية والإحصاءات فيه.
- ✅ تُرسَم القياسات كجدول.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- ما الذي ستضيفه إلى تقرير «جاهز للنشر»: قسم منهجية؟ رسمًا؟ بيان قابلية تكرار؟

## ⚠️ مآزق شائعة

- **قياسات افتراضية قابلة للتغيير.** القائمة كقيمة افتراضية لفئة بيانات تتشارك عبر المثيلات. استخدم `field(default_factory=list)` كما هو معروض.
- **نسيان اللقطة قبل التغيير.** `update` يقصّ البيانات أو يفقدها ما لم تسجّل الحالة القديمة أولًا. التقط لقطة دائمًا قبل التغيير.
- **القسمة على صفر في معامل التباين.** عندما يكون المتوسط 0، يقسم `cv` على صفر. يحل حارس `if result["mean"] else 0` ذلك.
- **أخطاء فواصل الأسطر في ReportLab.** السلاسل الطويلة غير المتقطعة تكسر `Paragraph`. لفّ النص أو اسمح بلف الكلمات في أنماط الخلايا.
- **بيانات فارغة إحصائيًا.** يُرجع `analyze` «error» لصفر قياسات؛ تحقّق منه قبل افتراض وجود الإحصاءات.

## ما بنيته للتو

دفتر مختبر منظم: قوالب تجارب مُنمّطة، ومحرك إحصاءات يحسب المتوسط والانحراف المعياري وخطوط الاتجاه، وإدارة نسخ بلقطات مع التراجع، ومُصدِّر PDF. النتيجة سير عمل تحليل قابل للتكرار — سجّل، واحسب، وعنون بالإصدارات، وشارك — يعكس كيف يعمل فرق البحث الحديثة فعلًا.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/lab-notebook/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/lab-notebook) في مستودع الدورة نسخة أغنى بإنشاء الرسوم البيانية وفهرس سجلات قابل للبحث وواجهة CLI موصولة من البداية للنهاية. استنسخه، أو افتح المستودع كاملًا في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وشغّله من هناك.
:::

## إلى أين تذهب من هنا

- أضف رسوم matplotlib إلى تصدير PDF بحيث تكون النتائج بصرية، وليست جدولية فقط.
- نفّذ بحثًا نصيًا كاملًا عبر كل التجارب بفهرس معكوس بسيط.
- احفظ الدفتر في SQLite بدلًا من ملف JSON مسطّح لكتابة متزامنة أكثر أمانًا.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓