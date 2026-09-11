---
title: "مراقب جودة البيانات"
description: "فحوصات جودة بيانات مستمرة مع التقييم والتنبيهات واكتشاف التحور عبر الأنابيب."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["cli", "csv", "dataclasses", "reporting"]
prerequisites:
  - "أساسيات Python (متغيّرات، حلقات، دوال، قواميس)"
  - "dataclasses وقراءة CSV بوحدة csv"
learningObjectives:
  - "نمذجة قواعد الجودة كبيانات عبر فئة Rule data وملف قواعد JSON"
  - "تنفيذ محرك فحص يبلّغ عن مخالفات كل قاعدة مع فهارس الصفوف"
  - "حساب درجة جودة شاملة من معدلات نجاح كل قاعدة"
  - "اكتشاف التراجعات بمقارنة معدلات النجاح بين اللقطات"
  - "شحن CLI يرجع رمز خروج غير صفري عند فشل الجودة"
---

# 🩺 ابنِ مراقب جودة البيانات

"لا تشحن بيانات لم تفحصها" يعمل فقط إذا كان الفحص رخيصًا وقابلًا للتكرار. يبني هذا المشروع الأداة التي تجعله رخيصًا: ملف قواعد مكتوب بـ JSON، ومحرك يحوّل كل قاعدة إلى قائمة صفوف مخالفة، ودرجة تلخص الملف كله، ومقارنة انحراف تقرع جرسًا حين يتدهور عمود بهدوء بين اللقطات، وCLI يمكن لسكربت البناء التصرف فعلًا على رمز خروجه. الكل `csv` و`dataclasses` و`json` — لا إطار، لا قاعدة بيانات، فقط قواعدك تعمل مقابل بياناتك.

هذا يفترض Python 101 زائد `dataclasses` و`csv`. لا يُشترط شيء من وحدة تحليل البيانات. إنه اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. نمذج قواعد الجودة كبيانات: فئة `Rule` dataclass يمكن لملف JSON عادي وصفها.
2. اكتب محرك الفحص: خمسة أنواع فحص (`not_null` و`unique` و`within_range` و`in_set` زائد حارس للمجهولة) ترجع صفوف `Violation` صريحة.
3. جمّع النتائج في تقرير بمعدلات نجاح لكل قاعدة ودرجة جودة شاملة.
4. قارن ثلاث لقطات ربع سنوية وعلّم الأعمدة التي تراجعت معدلات نجاحها.
5. اعملها CLI: أمر واحد مقابل CSV واحد + ملف قواعد واحد، رمز الخروج = حكم الجودة.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الموصى به — بيت القصيد هو الـ CLI الصغير الذي يستطيع سكربت بناء أو cron استدعاؤه، وهذا يحتاج نظام ملفات حقيقيًا.

**GitHub Codespaces** بديل بلا إعداد: افتح [مستودع الدورة كاملًا في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython مثبّتان بالفعل) وشغّل نفس الأوامر من طرفية المتصفح.

**Google Colab أو Kaggle Notebooks أو Binder** تعمل لكل خطوة — دفتر الملاحظات في [`examples/data-quality-monitor/notebook.ar.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-quality-monitor/notebook.ar.ipynb) يشغّل محرك القواعد نفسه فوق اللقطات الربعية المرفقة في الذاكرة.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-quality-monitor/notebook.ar.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/data-quality-monitor/notebook.ar.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdata-quality-monitor%2Fnotebook.ar.ipynb)

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
uv init data-quality-monitor
cd data-quality-monitor
```

**✅ قائمة التحقق**

- ✅ يطبع `uv --version` رقم إصدار.
- ✅ يوجد `data-quality-monitor/` مع `pyproject.toml`.
- ✅ ينجح `python -c "import csv, json, dataclasses"` — لا حزم خارجية.

## الخطوة 1: نمذج قاعدة كبيانات

فحص الجودة شيء صغير: *أي عمود*، *أي فحص*، *تحت أي معاملات*. اللحظة التي تكتب فيها تلك الفحوص كعبارات `if` مبعثرة عبر الدوال، تكون قد ربطت "ماذا أفحص" بـ"كيف أشغّله". تفكك فئة `Rule` dataclass بينهما — تصبح القواعد *بيانات*، قابلة للتحميل من JSON، بحيث تضيف مديرك قاعدةً بتحرير ملف، لا كودك.

### 1.1 اكتب فئة `Rule` dataclass

**👟 تلميح البداية :** فئة dataclass واحدة بـ`name` و`column` و`check` وقاموس `params`؛ وطريقة فئة `from_dict` تجمع أيا كانت المفاتيح الإضافية التي يحملها قاعدة JSON:

```python
# rules.py
from dataclasses import dataclass
from typing import Any

@dataclass
class Rule:
    name: str
    column: str
    check: str
    params: dict[str, Any] = None

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Rule":
        return cls(
            name=data["name"],
            column=data["column"],
            check=data["check"],
            params={k: v for k, v in data.items()
                    if k not in {"name", "column", "check"}},
        )

if __name__ == "__main__":
    import json

    raw = json.loads(
        '[{"name": "age in range", "column": "age", "check": "within_range", "min": 0, "max": 100}]'
    )
    rule = Rule.from_dict(raw[0])
    print(rule.name, "->", rule.check, rule.params)
```

`from_dict` هي الحيلة الهادئة: قواعد JSON مكتوبة كـ `{"name": ..., "column": ..., "check": ..., "min": ..., "max": ...}` والطريقة تدخل في *قائمة بيضاء* المفاتيح الهيكلية الثلاثة، جارفة كل شيء آخر إلى `params` — لذا مفتاح مستقبلي مثل `"description": "..."` يهبط بلا ضرر إلى المعاملات بدل إسقاط المُحمِّل. تغطي تلميحات الأنواع على params (`dict[str, Any]`) حقيقة أن `allowed` قائمة بينما `min` عدد عائم.

**🎯 الناتج المتوقع :**

```
age in range -> within_range {'min': 0, 'max': 100}
```

**🩹 إذا لم يعمل :** إذا كانت params فارغة، فمفاتيح `data["name"]` إلخ ليست الوحيدة — تحقق أنك لم تضع `"params": {...}` *داخل* قاعدة JSON أيضًا (from_dict لا يفتح قاموسًا متداخلًا؛ يسطّح مفاتيح الإخوة). إذا أثار `Rule` خطأ `TypeError`، فحقل params الافتراضي يستخدم `None` لا `field(default_factory=dict)` — صالح هنا، لكنك ستمرر params صراحة في كل مكان، لذا فضّل ذلك.

### 1.2 تحقّق من نموذج القاعدة

**✅ قائمة التحقق**

- ✅ `Rule.from_dict({"name": "x", "column": "age", "check": "unique"})` يبني بـ params فارغة.
- ✅ تمرير قاعدة JSON مع `"allowed": [... ]` يُنزل تلك القائمة إلى `rule.params["allowed"]`.
- ✅ `Rule` فئة dataclass: مقارنة `Rule(name="a", column="age", check="unique")` بمثيل مساوٍ تساوي `True`.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لماذا بقاء قاعدة كـ *قاموس/dataclass* (بيانات) بدل دالة أفضل لفريقٍ يعرّف فيه المحللون الفحوص لا المهندسون؟
- يتجاهل `from_dict` المفاتيح الإضافية المجهولة بجرفها إلى `params`. متى تكون تلك التساهلية خطأً (`"minn": 0` مخطوط يجعل قاعدة لا تفحص شيئًا عدة مرات بصمت)؟

## الخطوة 2: اكتب محرك الفحص

المحرك هو: *بإعطاء قاعدة واحدة وكل الصفوف، أرجع الصفوف المخالفة*. كل نوع فحص مسند ضيق واحد (`_fails`)، و`rule_failures` يجول الصفوف جامعًا سجلات `Violation` التي تقول *أي قاعدة، أي عمود، أي فهرس صف، أي قيمة*. الانتهاكات مواطن من الدرجة الأولى هنا — لا `print`ات، لا `assert`ات — لأن خطوات التقرير والانحراف والـ CLI كلها تستهلكها.

### 2.1 نفّذ `_fails` و`rule_failures`

**👟 تلميح البداية :** مسند `_fails(rule, value, rows) -> bool` واحد لكل اسم فحص، ثم مجمّع يرسم الفشل إلى `Violation`ات بفهارس الصفوف:

```python
# checks.py
from collections import Counter
from dataclasses import dataclass
from typing import Any

from rules import Rule

@dataclass
class Violation:
    rule: str
    column: str
    row_index: int
    value: Any

def _fails(rule: Rule, value: Any, rows: list[dict]) -> bool:
    if rule.check == "not_null":
        return value is None or str(value).strip() == ""
    if rule.check == "within_range":
        try:
            num = float(value)
        except (TypeError, ValueError):
            return True
        return not (rule.params["min"] <= num <= rule.params["max"])
    if rule.check == "in_set":
        return value not in rule.params["allowed"]
    if rule.check == "unique":
        non_null = [str(r.get(rule.column)) for r in rows if r.get(rule.column) is not None]
        return Counter(non_null)[str(value)] > 1
    raise ValueError(f"unknown check: {rule.check}")

def rule_failures(rows: list[dict], rule: Rule) -> list[Violation]:
    failures: list[Violation] = []
    for i, row in enumerate(rows):
        value = row.get(rule.column)
        if _fails(rule, value, rows):
            failures.append(Violation(rule.name, rule.column, i, value))
    return failures

if __name__ == "__main__":
    rows = [{"id": "1", "age": "36"}, {"id": "2", "age": "101"}, {"id": "3", "age": ""}]
    rule = Rule(name="age in range", column="age", check="within_range",
                params={"min": 0, "max": 100})
    for v in rule_failures(rows, rule):
        print(v.rule, "row", v.row_index, "->", repr(v.value))
```

`unique` هو الحالة الشاذة ويستحق القراءة مرتين: لا يمكن تقريرها خلية-بخلية، لذا تعد كل قيمة عمود عبر *كل* الصفوف، ثم ترجع "فشل" لأي قيمة تحدث أكثر من مرة. الشكل `{..., ...} > 1` اختبار عضوية، لا مقارنة — `Counter` يرجع العد و2 > 1 هو إشارة التكرار. `raise ValueError` للفحوص المجهولة مقصود: اسم فحص مخطوط في ملف القواعد يجب أن يفشل بصوت عالٍ في زمن الفحص، لا أن يمرر كل صف بصمت.

**🎯 الناتج المتوقع :**

```
age in range row 1 -> '101'
age in range row 2 -> ''
```

**🩹 إذا لم يعمل :** إذا لم يُلتقط الصف 2، فأثار `float("")` لكن `except` لا يلتقط `ValueError` — كل من `ValueError` و`TypeError` يجب أن يكونا في الصفّ. إذا بلّغت كل قيمة كتكرار، فـ `Counter` في `unique` يُعاد بناؤه لكل صف بدل مرة لكل قاعدة — أخرجه من `_fails` أو اعتمد على `rule_failures` بتمرير قائمة الصفوف كاملة.

### 2.2 تحقّق من المحرك

**✅ قائمة التحقق**

- ✅ يفشل `not_null` على `""` و`"   "` ومفتاح مفقود (لا ينكسر أي من الثلاثة).
- ✅ يفشل `within_range` على `"101"` مع max 100 وعلى `"abc"` (غير القابل للتحليل ← يفشل).
- ✅ يعامل `in_set` القيمة `"platinum"` كفشل مقابل `["free", "pro", "business"]`، سؤال عضوية مجموعة، لا سؤال نص فرعي.
- ✅ فحص `check` مجهول يثير `ValueError` بدل المرور بصمت.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يُرجع `within_range` `True` (فشل) للأرقام غير القابلة للتحليل مثل `"abc"`. هل قيمة القمامة *مخالفة نطاق* أم *مخالفة صيغة* — وماذا يحدث لدرجة عمود إذا اختلف الاثنان؟
- يعد `unique` القيمة `str(value)` بينما يقارن `in_set` القيم الخام. ماذا يفعل `"1"` مقابل `1` (سلسلة مقابل عدد صحيح) بكل فحص — ومتى سيدعو `unique` قيمتين مختلفتين ظاهريًا تكرارًا؟

## الخطوة 3: جمّع في تقرير ودرجة

المخالفات الأدلة؛ والدرجة الحكم. يحوّل التقرير 5 صفوف × 4 قواعد إلى سطر واحد لكل قاعدة — معدل النجاح وعدّ الصفوف المخالفة — وتتوسط الدرجة معدلات النجاح. `0.80 / 1.00` واحدة هو ما يمكن لإنسان أو سجل بناء تحليله في لمحة ومقارنته بالربع الماضي.

### 3.1 اكتب `QualityReport` و`render`

**👟 تلميح البداية :** فئة dataclass تحمل النتائج، وطريقة `pass_rate`، ودرجة `score` تتوسطها، و`render` تطبع النسخة البشرية:

```python
# report.py
from dataclasses import dataclass

from checks import Violation, rule_failures
from rules import Rule

@dataclass
class QualityReport:
    rules: list[Rule]
    failures: dict[str, list[Violation]]
    n_rows: int

    def pass_rate(self, rule_name: str) -> float:
        n = len(self.failures[rule_name])
        return 1 - n / max(self.n_rows, 1)

    def score(self) -> float:
        if not self.rules:
            return 0.0
        return sum(self.pass_rate(r.name) for r in self.rules) / len(self.rules)

def build_report(rows: list[dict], rules: list[Rule]) -> QualityReport:
    failures = {r.name: rule_failures(rows, r) for r in rules}
    return QualityReport(rules=rules, failures=failures, n_rows=len(rows))

def render(report: QualityReport) -> str:
    lines = [f"checked {report.n_rows} rows against {len(report.rules)} rules"]
    for rule in report.rules:
        rate = report.pass_rate(rule.name)
        fails = len(report.failures[rule.name])
        mark = "PASS" if rate == 1.0 else "FAIL"
        lines.append(f"[{mark}] {rule.name:<16} {rate:.1%} ({fails} violating rows)")
    lines.append(f"overall quality score: {report.score():.2f} / 1.00")
    return "\n".join(lines)

if __name__ == "__main__":
    import csv
    import json

    csv_text = """id,name,email,age,plan
1,Ada,ada@example.com,36,free
2,Grace,,44,pro
3,Alan,alan@bletchley.uk,,free
4,Katherine,kj@nasa.gov,101,platinum
5,Margaret,mh@mit.edu,66,free
"""
    rules = [Rule.from_dict(r) for r in json.loads(
        '[{"name": "id unique", "column": "id", "check": "unique"},'
        '{"name": "email present", "column": "email", "check": "not_null"},'
        '{"name": "age in range", "column": "age", "check": "within_range", "min": 0, "max": 100},'
        '{"name": "plan valid", "column": "plan", "check": "in_set", "allowed": ["free", "pro", "business"]}]'
    )]

    rows = list(csv.DictReader(csv_text.strip().splitlines()))
    print(render(build_report(rows, rules)))
```

المتوسط *غير مرجّح عمدًا بالتصميم*: أربع قواعد، أربعة معدلات نجاح، صوت متساوٍ. يستخدم `pass_rate` الدالة `max(self.n_rows, 1)` لذا ملف *فارغ* يصنّف كل قاعدة 0٪ (كل الصفوف الصفرية تفشل هي القراءة الصادقة) بدل الانكسار على قسمة صفر. بادئتا `:[FAIL]`/`:PASS` وتنسيق `:.1%` هما كل تجربة واجهة التقرير — عمود يسجل 80٪ أو انحراف −13.3٪ يجب أن يظهر في فحص واحد، لا بعد عدّ نجوم.

**🎯 الناتج المتوقع :**

```
checked 5 rows against 4 rules
[PASS] id unique        100.0% (0 violating rows)
[FAIL] email present    80.0% (1 violating rows)
[FAIL] age in range     60.0% (2 violating rows)
[FAIL] plan valid       80.0% (1 violating rows)
overall quality score: 0.80 / 1.00
```

**🩹 إذا لم يعمل :** إذا أظهر `age in range` 80٪ بدل 60٪، فالفارغ `''` في الصف 3 لا يُعد — إثارة `float('')` تُدار، لكن تحقق أن نتيجة `except (TypeError, ValueError)` تُرجع `True` (فشل)؛ إذا مرّرت بصمت، تسقط الخلية الفارغة إلى مقارنة النطاق وتمرر بصمت. إذا كان سطر الدرجة 1.00، فطريقة `score` تتوسط شيئًا غير قواعدك — أكد أن `len(self.rules)` يقسم *أربعة* معدلات نجاح.

### 3.2 تحقّق من التقرير

**✅ قائمة التحقق**

- ✅ الصفوف 2 (Grace، بريد فارغ)، و3 (Alan، عمر فارغ)، و4 (Katherine، عمر 101، خطة `platinum`) هي بالضبط الصفوف المخالفة المعدودة.
- ✅ تطبع `render()` سطرًا واحدًا لكل قاعدة زائد الدرجة؛ عمود العد يطابق `len(rule_failures(...))`.
- ✅ CSV فارغ يسجل 0.00 دون انكسار في `pass_rate`.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- الدرجة وسط حسابي عادي. عمود يفشل 40٪ من الوقت وعمود يفشل 10٪ من الوقت يسحبان المتوسط بوزنهما الخاص. أي تسجيل *مرجّح* كان يريده لوحة مستشفى أو نظام رواتب — وهل ما زال `render` منطقيًا، أم كنت ستقسم التقرير إلى مستويات؟
- يطلب `PASS` 100٪ بالضبط. يختلف فريقا جودة بيانات على ما إذا كان تغطية بريد 99.5٪ ينبغي أن تكون خضراء. أين ينتمي عتبة النجاح — في `render` أم في الدرجة؟

## الخطوة 4: اكشف الانحراف بين اللقطات

ملف نظيف واحد حلو؛ *عمود يتسخ أكثر* هو الطوارئ. يقارن الانحراف معدل نجاح كل قاعدة بين ملفات لقطات متتالية ويعلّم أي عمود هبط معدله بأكثر من عتبة (5 نقاط) بعلامة `  <-- regression` — بحيث يستطيع بناء استدعاء الشخص الذي يملك `email present`.

### 4.1 اكتب المقارن

**👟 تلميح البداية :** أعد استخدام `build_report` لكل ملف للحصول على معدلات النجاح، ثم تجول ملفًا-بملف مطبوعًا المعدلات والدلتات، معلمةً الهبوطات المتجاوزة للعتبة:

```python
# drift.py
from report import build_report

def pass_rates_for_file(path: str, rules: list) -> dict[str, float]:
    import csv
    with open(path, newline="") as f:
        rows = list(csv.DictReader(f))
    report = build_report(rows, rules)
    return {r.name: report.pass_rate(r.name) for r in rules}

def compare(files: list[str], rules: list, threshold: float = 0.05) -> list[str]:
    lines: list[str] = []
    prev = None
    for path in files:
        rates = pass_rates_for_file(path, rules)
        if prev is None:
            lines.append(f"== {path} (baseline)")
            for name, rate in rates.items():
                lines.append(f"   {name:<16} {rate:.1%}")
        else:
            lines.append(f"== {path}")
            for name, rate in rates.items():
                delta = rate - prev[name]
                flag = "   <-- regression" if delta < -threshold else ""
                lines.append(f"   {name:<16} {rate:.1%} ({delta:+.1%}){flag}")
        prev = rates
    return lines

if __name__ == "__main__":
    import csv
    import json

    from rules import Rule

    snapshots = {
        "customers_q1.csv": [
            ["id", "name", "email", "age", "plan"],
            ["1", "Ada", "ada@example.com", "36", "free"],
            ["2", "Grace", "", "44", "pro"],
            ["3", "Alan", "alan@bletchley.uk", "", "free"],
            ["4", "Katherine", "kj@nasa.gov", "101", "platinum"],
            ["5", "Margaret", "mh@mit.edu", "66", "free"],
        ],
        "customers_q2.csv": [
            ["id", "name", "email", "age", "plan"],
            ["6", "Tim", "td@example.com", "44", "free"],
            ["7", "Barbara", "", "29", "free"],
            ["8", "Don", "don@example.com", "118", "pro"],
        ],
        "customers_q3.csv": [
            ["id", "name", "email", "age", "plan"],
            ["9", "Carol", "carol@example.com", "51", "pro"],
            ["10", "David", "david@example.com", "52", "business"],
            ["11", "Ellen", "ellen@example.com", "", "free"],
        ],
    }
    for path, rows in snapshots.items():
        with open(path, "w", newline="") as f:
            csv.writer(f).writerows(rows)

    rules = [Rule.from_dict(r) for r in json.loads(
        '[{"name": "id unique", "column": "id", "check": "unique"},'
        '{"name": "email present", "column": "email", "check": "not_null"},'
        '{"name": "age in range", "column": "age", "check": "within_range", "min": 0, "max": 100},'
        '{"name": "plan valid", "column": "plan", "check": "in_set", "allowed": ["free", "pro", "business"]}]'
    )]

    for line in compare(["customers_q1.csv", "customers_q2.csv", "customers_q3.csv"], rules):
        print(line)
```

الأساس هو *أول* ملف بموقعه في القائمة — مقارنة معدلات النجاح باللقطة السابقة مباشرة (ق2 مقابل ق1، ق3 مقابل ق2)، لا دائمًا بالق1. هذا سؤال "هل كان رفع هذا الفريق الأخير أسوأ من نظيره السابق" الصادق؛ مقارنة كل شيء بالق1 كانت ستجيب عن "هل أسوأ من ثلاثة أشهر مضت"، وهو مخطط مختلف (وصالح أيضًا). تنسيق دلتا `%(+...%)` يجعل غموض إشارة +/− مستحيل القراءة خطأً.

**🎯 الناتج المتوقع :**

```
== customers_q1.csv (baseline)
   id unique        100.0%
   email present    80.0%
   age in range     60.0%
   plan valid       80.0%
== customers_q2.csv
   id unique        100.0% (+0.0%)
   email present    66.7% (-13.3%)   <-- regression
   age in range     66.7% (+6.7%)
   plan valid       100.0% (+20.0%)
== customers_q3.csv
   id unique        100.0% (+0.0%)
   email present    100.0% (+33.3%)
   age in range     66.7% (+0.0%)
   plan valid       100.0% (+0.0%)
```

**🩹 إذا لم يعمل :** إذا لم تظهر علامة `regression` أبدًا، فـ`threshold` (الافتراضي `0.05`) يُقارن بالإشارة الخاطئة — *الهبوط* هو `delta < -threshold`، لذا تحقق من الناقص. إذا ظهر هبوط ق2 للبريد كـ `+13.3%`، فالدلتا تُحسب `prev - rate` بدل `rate - prev` — الإشارة، مقلوبة.

### 4.2 تحقّق من الانحراف

**✅ قائمة التحقق**

- ✅ يعلّم `customers_q2.csv` تراجعًا واحدًا بالضبط: `email present`.
- ✅ *يحسّن* `age in range` فيما بين ق1←ق2 (+6.7٪) ويبقى ثابتًا ق2←ق3، ولا يُعلَّم خطأً أبدًا.
- ✅ تكتب العرض الصوري الملفات (فيعمل المقارن على ملفات حقيقية)، وتطابق معدلات النجاح على القرص صف الأساس أعلاه.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- العتبة (5 نقاط) نفسها لكل القواعد. هبوط `email present` بـ13.3 نقطة يثير العلم؛ وصعود `age in range` بـ6.7 نقطة نجاح. أي نوع قواعد يستحق عتبة *لكل قاعدة* — وأين في توقيع `compare` كانت ستعيش دون تغيير الـ API؟
- يقارن الانحراف معدلًا-بمعدل، متجاهلًا *الحجم* (ق2 يفحص 3 صفوف، وق1 فحص 5). إشارة تراجع صف واحد من ملف 3 صفوف ضعيفة إحصائيًا. كيف كان سيبدو مقارنة مرجّحة بالثقة — ومتى "علّم كل شيء، وتحقق يدويًا" خيار عملي على أي حال؟

## الخطوة 5: الـ CLI ورمز الخروج

المحرك منتهٍ؛ الجزء الذي يغيّر كيف *يتعاقد* فريق مع الأداة هو رمز الخروج. يقرأ `monitor.py` CSV وملف قواعد، ويطبع التقرير، ويخرج `0` إذا اجتاز كل شيء أو `2` إذا فشل أي شيء — يمكن لخطوة CI أو سكربت cron معاملة غير الصفري كـ"احجب النشر / استدعِ المالك" دون تحليل سطر مخرجات واحد.

### 5.1 اكتب `monitor.py`

**👟 تلميح البداية :** `argparse` لـ`csv_path` + `--rules` اختياري، أعد استخدام `build_report`/`render`، واضبط `sys.exit` من الدرجة:

```python
# monitor.py
import argparse
import csv
import json
import sys

from report import build_report, render
from rules import Rule

def main() -> None:
    parser = argparse.ArgumentParser(description="Check CSV data quality against a rules file.")
    parser.add_argument("csv_path")
    parser.add_argument("--rules", default="rules.json")
    args = parser.parse_args()

    with open(args.rules) as f:
        rules = [Rule.from_dict(r) for r in json.load(f)]

    with open(args.csv_path, newline="") as f:
        rows = list(csv.DictReader(f))

    report = build_report(rows, rules)
    print(render(report))
    sys.exit(0 if report.score() == 1.0 else 2)

if __name__ == "__main__":
    main()
```

**✅ قائمة التحقق**

- ✅ يعمل الـ CLI بـ `uv run python monitor.py customers_q1.csv` ويطبع التقرير.
- ✅ يُظهر `echo $?` القيمة `2` لـ customers_q1.csv (درجة 0.80)؛ وملف نظيف يخرج `0`.
- ✅ يكرم `--rules` مسارًا مخصصًا (مثل `uv run python monitor.py data.csv --rules my-rules.json`).

الدرجة هي الشيء الوحيد الذي يعرفه رمز الخروج، وهذا قرار تصميم حقيقي. "بوابة الجودة" تعني *الدرجة يجب أن تكون 1.00 بالضبط* — الأشدّ الإمكان. إذا فضّلت البوابّة على "أسوأ من 0.95"، تغيّر ثابتًا واحدًا؛ التقرير والمحرك وعقد الـ CLI يبقون في مكانهم.

### 5.2 تحقّق من الـ CLI من النهاية للنهاية

**🩹 إذا لم يعمل :** إذا بدا `sys.exit(2)` بلا مفعول، تذكر أن مساعدة/إصدارات `argparse` تخرج برموزها الخاصة قبل أن يبلغ `main()` البوابّة حتى — وتشغيل `--help` يبلّغ عن 0 صحيح. إذا كان رمز الخروج `1` بدل `2`، فاستثناء هرب من `main()` قبل تشغيل البوابّة — اقرأ التتبع؛ إنها مشكلة مسار ملف، لا مشكلة بوابة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يعرف رمز الخروج نجاحًا/فشلًا فقط؛ ويعرف التقرير أي القواعد انحرفت. لماذا تلك الفصلية *صحيحة* لبوابة CI — وما الذي كان سيخسره خط الأنابيب لو طبعت الـ CLI "درجة 0.80" لكنها *خرجت دائمًا* 0؟
- يقع افتراضي `--rules rules.json` على اسم ملف ثابت. ما الذي *لا* يسمح به `--rules` مما قد يريده فريق (قواعد لكل مجلد، تجاوزات متغيرات بيئة) — وهل كانت إضافتها تغيّر عقد رمز الخروج؟

## ⚠️ المآزق الشائعة

- **تحويل الفارغ إلى نجاح.** `float("")` تثير؛ إذا أعاد شرط `except` `False` (نجاح) أو أعاد الإثارة بصمت، فتمر الخلايا الفارغة عبر `within_range`. الفارغ فشل؛ غير القابل للتحليل فشل؛ الاستثناء غير المُدار *ليس* نتيجة.
- **`unique` يعيد العدّ لكل صف.** بناء `Counter` داخل المسند لكل صف يحوّل ملفًا من 100 ألف صف إلى عمل O(n²). عدّ مرة لكل قاعدة (أو اقبل ذلك لبيانات العرض) — وتذكر أن `"1"` و`1` سلسلتان مختلفتان.
- **قلب الإشارات في دلتات الانحراف.** `delta = rate - prev` يعلّم الهبوطات بشكل صحيح؛ `prev - rate` يعلّم الصعودات. إنها تصفّي ثقة تقرير بحرف واحد.
- **درجة `0/0`.** يجب أن يسجل CSV فارغ 0.00 عبر حارس `max(self.n_rows, 1)`، لا أن ينكسر في قسمة صفر. سؤال الملف الفارغ الذي تستحق طرحه "هل ينبغي أن يكون 0 صف فشلًا أم تخطيًا؟".
- **انحراف رمز الخروج.** أداة تطبع PASS/FAIL لكنها تخرج 0 دائمًا زينة. إذا ثبّتّ البوابّة في سكربت، فـ`cmd /c` (Windows) وسلاسل `&&` يكرمون معًا رمز الخروج الحقيقي — اختر رمز الخروج عمدًا واختبره.

## ما بنيته للتو

مجموعة جودة بيانات مكتفية ذاتيًا: قواعد كبيانات JSON، ومحرك فحص بمخالفات لكل صف، وتقرير مُسجَّل بشاشة واحدة، ومقارنة انحراف من لقطة-إلى-لقطة بأعلام تراجع، وCLI رمز خروجه بوابة نشر. المهارة القابلة لإعادة الاستخدام هي *فصل الحكم عن التنفيذ*: بيانات `Rule` في ملف، ومحرك في `checks.py`، وعرض في `render`، وقرار في رمز خروج — أيٌّ منها يمكن أن يتغير (نوع فحص جديد، صيغة تقرير جديدة، قاعدة بوابة جديدة) دون لمس الثلاثة الأخرى.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
لدى [`examples/data-quality-monitor/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/data-quality-monitor) في مستودع الدورة السكربتات الكاملة وملفات لقطات ربع سنوية وعيّنة `rules.json`. أو افتح المستودع كاملًا في [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## إلى أين تذهب من هنا

- أضف علم CLI **`--threshold`** يلغي الافتراضي `compare`، مجيبًا عن سؤال الخطوة 4 السقراطي عن الحساسية لكل قاعدة دون تغيير المحرك.
- أخرج **تقرير JSON** (`--json report.json`) بجانب البشري: نفس الدرجة، نفس المخالفات، قابل للقراءة آليًا — شقيق رمز الخروج الثرثار.
- أضف **عدود حجم لكل عمود** إلى جدول الانحراف (3 صفوف هذا الربع مقابل 5 الربع الماضي) بحيث يرى القراء البشريون *الثقة* كما يقرؤون المعدل.
- ادعم **كشف اللقطة القديمة**: علّم اللقطات التي عمود طابع زمني `as_of` فيها أقدم من N يومًا — الانحراف يُقاس بالزمن، لا بترتيب الملفات فقط.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓