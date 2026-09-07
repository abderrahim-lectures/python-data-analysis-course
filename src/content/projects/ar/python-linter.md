---
title: "محلل أكواد بايثون"
description: "محرك قواعد محلل مخصص لـ Python مع إصلاح تلقائي وتكامل مع IDE."
difficulty: "advanced"
estimatedMinutes: 90
tags: ["cli", "ast", "static-analysis", "tooling"]
learningObjectives:
  - "حلّل مصدر Python إلى شجرة نحوية مجردة بوحدة ast"
  - "اعبر الشجرة بـ ast.NodeVisitor واجمع العُقد حسب نوعها"
  - "اربط الأسماء المستوردة باستخداماتها لكشف الواردات غير المستخدمة"
  - "رتّب النتائج بالشدة وأصدر تقرير رمز خروج للـ CI"
prerequisites: ["python-101/functions", "python-101/data-structures", "python-101/file-io", "python-101/scope-and-lambdas"]
---

# محلل أكواد بايثون

كل مشروع Python جاد يشغّل محلل أكواد قبل الدمج، وأول وظيفة للمحلل ليست علم صواريخ — بل *قراءة شكل الكود*. تشحن Python وحدة مكتبة قياسية اسمها `ast` تحلل ملف `.py` إلى شجرة عُقد — واردات، وتعريفات دوال، واستدعاءات، واستثناءات — يمكنك اجتيازها وفحصها. يبني هذا المشروع محلل أكواد يعمل فوقها: حلّل ملفًا، واعبر الشجرة، وأبلغ عن ثلاث مشاكل حقيقية — واردات غير مستخدمة، وجمل `except:` عارية، ودوال أطول من حد عدد السطور — مع درجة شدة لكل نتيجة ورمز خروج يتيح لسكربت CI الفشل عليها. أنت تبني المحرك، وهو صغير بما يكفي لفهم كل سطر.

يفترض هذا Python 101 — الدوال، والقواميس، وإدخال/إخراج الملفات، وإحساس بِنطاق المتغيرات. لا شيء بعد ذلك: لا حزم، ولا إطار عمل، ولا خدمات خارجية. هذا اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/docs/projects) للاطلاع على القائمة الكاملة.

## 🎯 ما ستفعله

1. حلّل ملف Python إلى AST وافحص كيف تبدو الشجرة فعلًا.
2. اعبر الشجرة بـ`ast.NodeVisitor` لإيجاد الواردات وتعريفات الدوال.
3. وسّع ذلك إلى نمط المحلل: اجمع كل اسم يعرّفه الملف وكل اسم *يستخدمه*، ثم طابق الفرق.
4. حوّل النتائج المجمّعة إلى تقرير مُجرَّد بأرقام أسطر.
5. لفّ التقرير في CLI يُرجع رمز خروج غير صفري عند شدة النتائج — عادة تكامل الـ CI.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي — سبب وجود محلل الكود كاملًا هو توجيهه إلى ملف `.py` حقيقي في مستودع حقيقي، ولا شيء في `ast` يهتم بأين يعيش الملف. تكتب الخطوات أدناه المحلل في مجلد صغير مع `uv`؛ وتوجيهه إلى مشاريع دورتك الأخرى هو الاختبار الذاتي الواضح.

**GitHub Codespaces** يعمل بشكل مطابق: افتح [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) وتُشغَّل الأوامر نفسها في نافذة متصفح — بل يمكنك حتى فحص سكربتات جذر مستودع الدورة نفسه.

**Google Colab وKaggle Notebooks وBinder يشغّلون كل خطوة من المحرك بأمانة** — `ast` مكتبة قياسية خالصة، بلا GPU ولا مفاتيح — لكن *المنتج* هنا CLI فوق ملفات، والدفاتر الركيزة الخطأ لـ"شغّل هذا على مجلد مشروعي كله". يفحص الدفتر ملفه الخام المرافق فترى المحرك يعمل من البداية للنهاية؛ وبدّل إلى المحلي لحالة الاستخدام الفعلية بنمط `python -m pylint`.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/python-linter/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/python-linter/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fpython-linter%2Fnotebook.ipynb)

## الإعداد

كل ما تحتاجه قبل أول تحليل: `uv`، وملف اختبار هزيل عمدًا يبيّن القواعد الثلاث معًا دفعة واحدة.

### ثبّت `uv` وجهّز المشروع

**macOS / Linux** (الطرفية):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

أغلق طرفيتك وأعد فتحها، ثم:

```bash
uv --version
mkdir python-linter && cd python-linter
uv init --bare
```

صفر حزم إضافية — `ast` في المكتبة القياسية.

### اكتب ملف اختبار هزيل

الصق في `sloppy.py`:

```python
import os
from math import sqrt, floor

def compute(x):
    unused = 42
    result = sqrt(x) + floor(x)
    return result

def process(data):
    try:
        return data["key"]
    except:
        return None

# 11+ line function, to blow past any sane limit
def long_function_start(a, b, c, d):
    one = a
    two = b
    three = c
    four = d
    five = one + two
    six = three + four
    seven = five + six
    eight = seven
    nine = eight
    ten = nine + a
    eleven = ten
    return eleven
```

```bash
uv run python -c "import ast; print('ast ready')"
```

**✅ قائمة التحقق**

- ✅ `uv --version` يطبع رقم إصدار.
- ✅ `sloppy.py` موجود فيه `import os` غير مستخدم، ومتغير `unused` غير مستخدم، و`except:` عارية، و`long_function_start` مفرط الطول.
- ✅ `uv run python -c "import ast"` ينجح — مشروعك كله مكتبة ذلك السطر الواحد.

## الخطوة 1: حلّل ملفًا إلى AST

يرى محلل الكود الكود كما يراه المترجم: شجرة عُقد، لا أسطر نص. يحوّل `ast.parse` المصدر إلى تلك الشجرة، ويعرض `ast.dump` الشكل — أسرع طريقة للاقتناع بالمنهج كله `print(ast.dump(tree))`.

### 1.1 حلّل وافحص

```python
# parse_ast.py
import ast
from pathlib import Path

def parse_source(path: str) -> ast.Module:
    source = Path(path).read_text(encoding="utf-8")
    return ast.parse(source)

if __name__ == "__main__":
    tree = parse_source("sloppy.py")
    print("module body has", len(tree.body), "statements")
    for node in tree.body:
        print(f"  {type(node).__name__}: {node.__dict__.get('name', '')!r} at line {node.lineno}")
```

يُرجع `ast.parse` `ast.Module` جسده `.body` قائمة من عُقد الجمل من المستوى الأعلى — `Import`، `ImportFrom`، `FunctionDef`. تحمل كل عقدة صفة `.lineno`، وهي ما يتيح لك الإبلاغ عن *أرقام أسطر* دون تعقّبها بنفسك؛ لمحة `node.__dict__.get('name', '')` توضح أن أنواع العُقد المختلفة حقول مختلفة، ولهذا تتفرع المحللات على نوع العقدة بدلًا من الرجاء بشكل موحّد.

**👟 تلميح البداية :** شغّله واقرأ أسطر المخرجات الخمسة فحسب — الواردات، والدالتان و`long_function_start` عادوا جميعًا عُقدًا مطبوع النوع بأرقام أسطر، قبل أن يُفكر في أي فحص أصلًا.

**🎯 الناتج المتوقع :** `module body has 3 statements`، ثم أسطر تسمّي `Import` / `ImportFrom` / `FunctionDef` / `FunctionDef` / `FunctionDef` بأرقام الأسطر الصحيحة (1، 2، 4، 9، 14).

**🩹 إذا لم يعمل :** إذا اشتعل `SyntaxError`، فملف الاختبار فيه مشكلة نحو؛ `ast.parse` محلل صارم بالتصميم — أصلح المصدر (وهذا أيضًا أول وظيفة للمحلل: ملف لا يُحلَّل أعلى نتيجة شدة). إذا كان `AttributeError: 'Import' object has no attribute 'name'`، فحارس `.get('name', '')` لديك غير مستخدم في كل مكان — كل فرع يطبع عقدة يجب أن يستخدم `.get` لا `.name`، لأن عُقد `Import` تحمل `names` لا `name`.

### 1.2 تحقّق من التحليل

**✅ قائمة التحقق**

- ✅ ينجح `ast.parse` على `sloppy.py` ويُرجع وحدة جسدها `.body` فيه 3 جمل من المستوى الأعلى بالضبط.
- ✅ كل عقدة مطبوعة تعرض `type.__name__` و`lineno` رقميًّا.
- ✅ يعرض `node.__dict__` لـ`ImportFrom` قيمة `module='math'` و`names` محتويًا `sqrt` و`floor`.
- ✅ يمكنك شرح لمَ الشجرة مفضلة على regex فوق النص المصدر (تلميح: الإزاحة والسلاسل).

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لماذا يفشل محلل مبني على regex حيث ينجح `ast` — أشر إلى شيء واحد ملموس في `sloppy.py` (تلميح: `import os` داخل *سلسلة* يطابقه regex لكنه ليس واردًا). ما الذي يجعل الشجرة محصّنة؟
- يقرأ المحلل الشجرة، فيرى محللك ما يراه المحلل اللغوي فقط. ما خاصية كود من العالم الحقيقي خفية عن `ast` بالتصميم (تلميح: تخص أسماء غير موجودة بعد)؟ هل يجعل ذلك *مرتاحًا* في تقييد القواعد التي تكتبها أولًا؟

## الخطوة 2: اعبر الشجرة بـ NodeVisitor

يعمل التكرار اليدوي على `tree.body` لمستوى واحد ويتفتت في العمق: وارد داخل دالة، أو دالة داخل صف، متداخل مستوىين. `ast.NodeVisitor` هو الجواب من المكتبة القياسية — تقول "استدعِ هذه الطريقة كلما رأيت عقدة X"، ويقوم هو بالتكرار عنك.

### 2.1 زُر الواردات وتعريفات الدوال

```python
# walk.py
import ast
from parse_ast import parse_source

class ImportVisitor(ast.NodeVisitor):
    def __init__(self):
        self.imports = []
        self.functions = []

    def visit_Import(self, node):
        self.imports.append((node.lineno, node.names[0].name))

    def visit_ImportFrom(self, node):
        self.imports.append((node.lineno, f"{node.module}.{node.names[0].name}"))

    def visit_FunctionDef(self, node):
        self.functions.append((node.lineno, node.name, len(node.body)))

if __name__ == "__main__":
    v = ImportVisitor()
    v.visit(parse_source("sloppy.py"))
    print("imports:", v.imports)
    print("functions:", v.functions)
```

النمط طرق `visit_X` + استدعاء `.visit(tree)` واحد: يوزّع إطار الزائر كل نوع عقدة إلى طريقته وينزل في الشجرة تلقائيًا — بما فيها الواردات المتداخلة داخل الدوال، التي لا يراها `tree.body` وحده يومًا. كل طريقة حرة في *الجمع* في قائمة عادية؛ انقسام "الاستدعاءات كطرق، واجتياز الشجرة كاتفاقية" هو التصميم كله، وهو أقوى من المشي اليدوي لأن العمق لا يكلف شيئًا.

**👟 تلميح البداية :** شغّله وتمعّن في أن `long_function_start` سُجّلت بـ`len(node.body)` الكاملة — نزل الزائر إلى جسدها، وهو تحديدًا ما لا يستطيعه التكرار اليدوي على المستوى الأعلى.

**🎯 الناتج المتوقع :** `imports: [(1, 'os'), (2, 'math.sqrt')]`، `functions: [(4, 'compute', 4), (9, 'process', 4), (14, 'long_function_start', 11)]` — لاحظ الـ`11` للدالة الطويلة.

**🩹 إذا لم يعمل :** إذا كانت `functions` فارغة، فـ`.visit()` لم يُستدعَ قط — الزائر *يعرّف* الطرق فقط؛ التوزيع يحدث عند تمرير الشجرة إليه. إذا ظهرت دوال المستوى الأعلى فقط، فتكرر زائرك يدويًا بدلًا من وراثة `ast.NodeVisitor` — اجتياز `super()` (الذي يفعله NodeVisitor مجانًا) هو ما ينزل إلى الأجسام المتداخلة.

### 2.2 تحقّق من الاجتياز

**✅ قائمة التحقق**

- ✅ يجمع `ImportVisitor` كلاً من `Import` و`ImportFrom` من المستوى الأعلى *ومن* أي موضع متداخل.
- ✅ يعكس `len(node.body)` لكل دالة عدد جملها الحقيقي (11 لـ`long_function_start`).
- ✅ يتراجع الزائر — إضافة دالة داخل دالة داخل دالة ما يزال يُظهرها.
- ✅ يمكنك شرح لماذا يجمع `visit_FunctionDef` لكنه *لا* يتكرر بنفسه (NodeVisitor يفعل التكرار).

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يوزّع `NodeVisitor` على اسم نوع العقدة. إذا أضاف إصدارا Python مختلفان نوع جملة *جديدًا* بلا طريقة `visit_` لمحللك، فماذا يفعل الزائر به — وهل تجاهل الصيغة الجديدة بصمت ميزة أم جرفًا لأداة فحص؟
- يسجّل زائرنا `(lineno, name, body_len)`. ما الذي يجب أن تخزنه بدلًا منه إذا أردت لاحقًا فحص دوال *متداخلة* داخل `ClassDef` — وهل يمنحك `.visit()` ذلك مجانًا؟ ومهما خزنت، فما الذي *لا* يلتقط؟

## الخطوة 3: اكشف الواردات غير المستخدمة

الفحص اللذيذ. `import os` في الأعلى لا يعني شيئًا إذا لم يستخدمه أحد؛ الكاشف فرق أسماء: اجمع كل اسم *يعرّفه* الملف بالاستيراد، واجمع كل اسم *يستخدمه* الملف كاسم (`ast.Name`)، والواردات التي لا يظهر صيغها المرتبطة في مجموعة الاستخدام غير مستخدمة. إنها عملية حساب مجموعات فوق الأشجار.

### 3.1 ابنِ فرق الأسماء

```python
# unused.py
import ast
from parse_ast import parse_source

class NameCollector(ast.NodeVisitor):
    def __init__(self):
        self.imported = {}
        self.used = set()

    def visit_Import(self, node):
        for alias in node.names:
            self.imported[alias.asname or alias.name.split(".")[0]] = node.lineno

    def visit_ImportFrom(self, node):
        for alias in node.names:
            self.imported[alias.asname or alias.name] = node.lineno

    def visit_Name(self, node):
        self.used.add(node.id)

def find_unused_imports(src_path: str) -> list[tuple]:
    v = NameCollector()
    v.visit(parse_source(src_path))
    return [(name, lineno) for name, lineno in v.imported.items()
            if name not in v.used]

if __name__ == "__main__":
    for name, line in find_unused_imports("sloppy.py"):
        print(f"line {line}: unused import {name!r}")
```

نما الجمعان بشكل متماثل: `imported` قاموس صيغة ← سطر (الصيغ ما تشير إليه الشيفرة الأخرى — يربط `import os` الاسم `os`، ويربط `import math.sqrt` الاسم `sqrt` عبر `asname or name.split(".")[0]`، ويربط `from math import sqrt` الاسم `sqrt` مباشرة)، و`used` مجموعة كل معرّف `ast.Name` يذكره الملف. وارد "غير مستخدم" بالضبط عندما تغيب صيغته المرتبطة عن مجموعة الاستخدام — والاسم *المُعاد تصديره* عمدًا (`__all__`) هو الإيجابي الكاذب الكلاسيكي الذي تدعوه هذه النسخة البسيطة (انظر المآزق).

**👟 تلميح البداية :** قبل التشغيل، تنبّأ بما يجب تعليمه: استُورد `os` (سطر 1) ولم يُستخدم — نتيجة واحدة. `sqrt` و`floor` مستخدمان في `compute`. أكّد أن الأداة تتفق، ثم أضف `print(floor(2.7))` في مكان ما وارقب `math.floor` يصبح "مستخدمًا" — رؤية المجموعة تتحدّث هو النموذج كله.

**🎯 الناتج المتوقع :** سطر واحد بالضبط: `line 1: unused import 'os'`. لا يظهر `sqrt` ولا `floor`.

**🩹 إذا لم يعمل :** إذا عُلّم `sqrt` غير مستخدم خطأً، فجمع `visit_Name` لديك *فقط* أسماء المستوى الأعلى عمدًا أو لم تزر أجسام `FunctionDef` قط — يجب أن يجمع الزائر استخدام `Name` من *كل* نطاق؛ التكرار عبر `NodeVisitor` يتولى ذلك. إذا لم يُعلَّم `os`، فأنت تطابق الفرق على الجمع الخطأ — `os` في `imported`، لكن `used` يجب أن *لا* تحتويه؛ اطبع المجموعتين ويصفي الفرق نفسه.

### 3.2 تحقّق من قاعدة الواردات غير المستخدمة

**✅ قائمة التحقق**

- ✅ ينتج `sloppy.py` نتيجة `os` الوحيدة بالضبط.
- ✅ استخدام `floor` في أي مكان داخل جسم دالة يزيل `floor` من النتائج — النطاق لا يهم.
- ✅ `from x import y as z` يربط `z` لا `y` — الاحتياط `asname or ...` يؤدي عمله.
- ✅ يمكنك قراءة القاعدة في جملة واحدة: وارد غير مستخدم إذا لم تظهر صيغته المرتبطة أبدًا كاسم مستخدم.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- الاسم المستخدم في *سلسلة* (`"os.path.join..."`) أو كـ*حرف* ليس `ast.Name` — لكن الملف الذي يفعل `__all__ = ["os"]` *استخدام*. في أي اتجاه الإيجابي الكاذب، وما الذي يجب أن يضيفه الكود ليعامل `__all__` بشكل صحيح؟ ما أصغر تغيير يبقي نسختك البسيطة؟
- يجمع `visit_Name` *كل* اسم، بما فيها القراءات عديمة الأثر الجانبي كالمتغير العاري `unused = 42`، الذي *تعريفه* اسم `Name` أيضًا. هل "الاسم يظهر في مكان ما" كافٍ لـ"الوارد مستخدم" — أم تحتاج قاعدتك إلى تمييز *القراءات* عن *الكتابات* (تلميح: لـ`ast.Name` حقل `ctx` — `Store` مقابل `Load`)؟

## الخطوة 4: رتّب النتائج وأبلغ عنها

تجني المحللات قوتها من *التقييم*: `except:` عارية أسوأ من دالة طويلة، ومرشّح الصيانة أسوأ من عيب أسلوب. توسّع هذه الخطوة الجامع من قاعدة واحدة إلى ثلاث، وتسنّد لكلٍّ شدةً، وتنتج التقرير المطبوع الذي سيسلّمه CLI لاحقًا.

### 4.1 اجمع ثلاث عائلات قواعد

```python
# rules.py
from unused import NameCollector, find_unused_imports
from walk import ImportVisitor
from parse_ast import parse_source
import ast

SEVERITY = {"error": 2, "warning": 1, "suggestion": 0}
LIMIT_FUNCTION_LINES = 10

def bare_excepts(src_path: str) -> list[tuple]:
    findings = []
    for node in ast.walk(parse_source(src_path)):
        if isinstance(node, ast.ExceptHandler) and node.type is None:
            findings.append((node.lineno, "bare except: catches everything"))
    return findings

def long_functions(src_path: str, limit: int = LIMIT_FUNCTION_LINES) -> list[tuple]:
    v = ImportVisitor()
    v.visit(parse_source(src_path))
    return [(ln, f"{name} is {bl} lines (>{limit})")
            for ln, name, bl in v.functions if bl > limit]

def lint(src_path: str) -> list[tuple[str, int, str]]:
    report = []
    for name, line in find_unused_imports(src_path):
        report.append(("suggestion", line, f"unused import {name!r}"))
    for line, msg in bare_excepts(src_path):
        report.append(("error", line, msg))
    for line, msg in long_functions(src_path):
        report.append(("warning", line, msg))
    return sorted(report, key=lambda r: (-SEVERITY[r[0]], r[1]))

if __name__ == "__main__":
    for sev, line, msg in lint("sloppy.py"):
        print(f"{sev:>10}  line {line:>3}  {msg}")
```

`ast.walk` التوأم غير المزار لـ`NodeVisitor` — مولّد لمرة واحدة يصيّر *كل* عقدة في الشجرة، مثالي لقاعدة تهتم بنوع عقدة واحد فقط في أي مكان من الملف (`ExceptHandler` بلا `type`). التقرير قائمة مرتبة من ثلاثيات `(severity, line, message)` — مرتبة بوزن الشدة أولًا ثم السطر — فتطفو `error` قبل `suggestion` داخل مرحلة واحدة متناسقة. تبقى دوال القواعد مستقلة ولا تشارك شيئًا سوى قائمة التقرير، وهي ما يبقي محرك القواعد *جمعيًّا*: قواعد جديدة اختبارات مستقلة جديدة، لا تحرير دالة سباغيتي واحدة.

**👟 تلميح البداية :** شغّل التقرير وأكّد أن *عائلات* القواعد الثلاث كلها تشتعل على `sloppy.py` — الوارد غير المستخدم، والـexcept العارية (error، أعلاها)، والدالة الطويلة (warning). ثم أضف `os.getcwd()` إلى `compute` وارقب اقتراح الوارد غير المستخدم يختفي بينما يبقى الاثنان الآخران — كل قاعدة مستقلة.

**🎯 الناتج المتوقع :** ثلاثة أسطر — `error  line 11: bare except: catches everything`، و`warning  line 14: long_function_start is 11 lines (>10)`، و`suggestion  line 1: unused import 'os'` — بهذا الترتيب من الشدة تمامًا.

**🩹 إذا لم يعمل :** إذا خرج ترتيب الشدّة خطأً، فقدّر مفتاح الفرز `(-SEVERITY[r[0]], r[1])` أن `error=2` ← `-2`، وأن القيم الأعلى يجب أن تُفرز أولًا — تحقق أن أرقام قاموس `SEVERITY` تطابق المعنى. إذا أبلغت الدالة الطويلة `11 (>10)` بينما ضبطت `LIMIT_FUNCTION_LINES = 10`، فعدّاد `body = 11` صحيح — الحد *عتبة*، فـ`> limit` صحيحة؛ غيّر `>` إلى `>=` فقط إذا أردت أن تحسب الـ10 تمامًا طويلة جدًّا.

### 4.2 تحقّق من التقرير المُجرَّد

**✅ قائمة التحقق**

- ✅ عائلات القواعد الثلاث كلها تشتعل على `sloppy.py`، لا قاعدة تُكبت أخرى.
- ✅ تُفرز أسطر التقرير بالشدة (error ← warning ← suggestion)، كلٌّ برقم سطر حقيقي.
- ✅ حذف سطر الـexcept العارية يزيل الخطأ ولا شيء غيره — القواعد دوال مستقلة.
- ✅ خيار `ast.walk` مقابل `NodeVisitor` مقصود: `walk` لمسح الشجرة كاملة لمرة واحدة، وزائرًا عندما تحتاج القاعدة حالة متراكمة (كفرق الأسماء).

**🤔 سؤال (أسئلة) سقراطي(ة)**

- رفع `LIMIT_FUNCTION_LINES` مقبض إعداد داخل توقيع الدالة. إذا أراد مشروع حدودًا *لكل ملف*، فما أصغر تغيير (تلميح: قاموس `config` يُمرر إلى `lint`) يبقي كل قاعدة نقية؟ متى يبدأ "الإعداد" في استحقاقه — 3 قواعد أم 30؟
- مسح `ast.walk` لدينا للـexcepts العارية الشجرة كلها بحثًا عن نوع عقدة واحد. قاعدة الواردات غير المستخدمة *تحتاج* الجمع ثنائي المرحلة من الخطوة 3. ما تكلفة جلسة فحص كان عليها إعادة تحليل الملف *لكل* قاعدة عند 50 قاعدة — وما إعادة البناء (حلّل مرة، ومرر الشجرة لكل قاعدة) التي تتجنبها؟

## الخطوة 5: اشحن الـ CLI

مكتبة محلل لا يستطيع أحد تشغيلها من طرفية ورقة تمرين، لا أداة. تلفّ الخطوة 5 `lint` في أمر حقيقي: `argparse` للمسار، وطباعة بشرية، وعدّاد، و— تحفة الـ CI — رمز خروج غير صفري عند وجود أي نتيجة بمستوى `error` أو أعلى، فيمكن لسكربت بناء أن *يفشل* على التقرير.

### 5.1 اكتب نقطة الدخول برمز الخروج

```python
# linter.py
import argparse
import sys
from rules import lint, SEVERITY

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="lint a Python file with ast-based rules")
    parser.add_argument("path", help="path to the .py file to lint")
    parser.add_argument("--fail-on", choices=["error", "warning", "suggestion"],
                        default="error", help="minimum severity that sets a non-zero exit")
    args = parser.parse_args(argv)
    report = lint(args.path)
    for sev, line, msg in report:
        print(f"{args.path}:{line}: {sev}: {msg}")
    failures = [r for r in report if SEVERITY[r[0]] >= SEVERITY[args.fail_on]]
    print(f"{len(report)} finding(s), {len(failures)} at/above '{args.fail_on}'")
    return 1 if failures else 0

if __name__ == "__main__":
    sys.exit(main())
```

تعاقد رمز الخروج هو الخطوة كلها: `main` *يُرجع* عددًا صحيحًا (0 نظيف، 1 وسخ) ويحوّل حارس `sys.exit(main())` قيمة الإرجاع إلى حالة العملية. يجعل `--fail-on` العتبة قرارًا يملكه المستدعِي — `linter.py sloppy.py` يخرج 1 افتراضيًا (يوجد خطأ) بينما يخرج `--fail-on suggestion` 1 لوارد غير مستخدم وحده، معطيًا CI بالضبط المبدّل الذي يحتاجه مشروعٌ معياريٌّ معاييرُه تتطور.

**👟 تلميح البداية :** شغّل `uv run python linter.py sloppy.py` وتحقق فورًا من `$?` (أو اطبع قيمة الإرجاع) — الملف فيه *خطأ*، فرمز الخروج يجب أن يكون 1. ثم أصلح الـexcept العارية في `sloppy.py` وأعد التشغيل لترى الخروج يهبط إلى 0.

**🎯 الناتج المتوقع :** خمسة أسطر إجمالًا — ثلاث نتائج، ثم `3 finding(s), 1 at/above 'error'` — و`$?` في الغلاف (أيضًا إرجاع `main()`) هو `1`. بعد إصلاح except: يصبح الخروج `0`.

**🩹 إذا لم يعمل :** إذا كان رمز الخروج دائمًا 0 رغم النتائج، فـ`sys.exit(main())` ليس السطر الأخير — يجب أن تهبط قيمة الإرجاع في `sys.exit` لا في طباعة. إذا لم يقلب `--fail-on suggestion` الخروج، فمقارنة `>=` ضد أوزان الشدّة مقلوبة أو أرقام `SEVERITY` معكوسة — تحقق بطباعة `SEVERITY[args.fail_on]`.

### 5.2 تحقّق من الـ CLI

**✅ قائمة التحقق**

- ✅ يطبع `uv run python linter.py sloppy.py` النتائج بصيغة `path:line: severity: message` ويخرج `1`.
- ✅ كل من `--fail-on warning` و`--fail-on suggestion` يوسّعان مجموعة الفشل؛ و`--fail-on error` يُبقيها ضيقة.
- ✅ ملف نظيف (أو `sloppy.py` مصلَّحة) يخرج `0` مع `0 finding(s)`.
- ✅ ملف به *خطأ نحو* — إذا لم يُحلَّل، يتسرب `SyntaxError` من الخطوة 1 فعليًا كتحطم صاخب لا كتقرير فارغ صامت؛ تقرر لاحقًا هل تلتقطه وتطبع رسالة أجمل.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يميز رمز الخروج "0 نتيجة" عن "نتائج تحت عتبتي" — كلاهما قد يُرجع 0. لسكربت CI، هل هذا هو التعاقد الذي تريده، أم تفضّل رموز خروج 0/1/2 لتمييز النظيف-من-تحذيراتِ-والنظيف-من-النظيف؟ ما الذي ينكسر في الغلاف في الحالتين؟
- يبدل `--fail-on` *الصرامة* في وقت التشغيل. ما حجة إبقاء العتبات في مصدر المحلل (إعداد لكل مشروع) بدلًا من ذلك — وما الجانب السلبي الملموس للعلم عند تشغيل المحلل في خط أنابيب من 30 وظيفة، لكلٍّ منها عتبته؟

## ⚠️ مآزق شائعة

- **تخطّي حالة فشل التحليل.** أول نتيجة في الفحص الحقيقي "الملف لن يُحلَّل" — `SyntaxError` من `ast.parse` تحطم، ومحلل يتحطم على نحو سيئ أسوأ من محلل يبلغ عنه. قرّر مبكرًا: التقط `SyntaxError` واطبعه كأعلى نتيجة شدة (الاختيار الصادق)، أو دعْه يتحطم صاخبًا (محتمل طالما تملك كل ملف مدخل).
- **قواعد الأسماء تتعثر على `__all__` وإعادة التصدير.** وحدة تفعل `from .utils import retry` *لإعادة تصديره* لها اسم يشبه المستخدم داخل `__all__` فقط — البسيط يعلّمه غير مستخدم وتفيض قاعدة كود حقيقية بالإيجابيات الكاذبة. الإصلاح الإباحة الصريحة للأسماء المدرجة في `__all__`، أو توثيق أن محللك يستبدل تلك الدقة بالبساطة.
- **الخلط بين `Store` و`Load`.** `unused = 42` *يعرّف* اسمًا في سياق `Store`؛ و`print(the_name)` *يقرؤه* في سياق `Load`. قاعدة تعدّ أي `ast.Name` "استخدامًا" لا تفرّق بين "مستورد ومقروء" و"مستورد ثم مُستبدل" — تحقق من `node.ctx` وقرّر لكل قاعدة هل يحسب الطرفان معًا.
- **إعادة التحليل لكل قاعدة.** `ast.parse` واحد لكل قاعدة جيد عند 3 قواعد ونحسها تربيعيًّا عند 50. بما أن *كل* قاعدة تريد الشجرة نفسها، حلّل مرة واحدة ومرر الشجرة (أو خزّنها مؤقتًا لكل مسار) إلى كل قاعدة مستقلة — نفس انضباط تأليف التقرير في الخطوة 4.
- **فقدان ذاكرة رمز الخروج.** محلل *يطبع* النتائج لكنه يخرج 0 مسرح في الـ CI — يرى خط الأنابيب أخضر ويدمج الـexcept العارية. رمز الخروج هو المنتج؛ إرجاعه من `main()` و`sys.exit` عليه هو الـ1% الأخير الذي لا ينفصل عن تلك الـ99% الباقية التي تجعله ذا بال.

## ما بنيته للتو

محلل Python يعمل: `ast.parse` واردًا، وتقرير مُجرَّد بأرقام أسطر صادرًا، بثلاث قواعد مستقلة — واردات غير مستخدمة عبر فرق أسماء، وexcepts عارية عبر مسح شجرة كاملة، ودوال مفرطة الحجم عبر عدّادات زائر — وCLI يمكن لرمز خروجه أن يبوّب بناءً فعلًا. كل نتيجة قابلة للتتبع مباشرة إلى عقدة في الشجرة، فلا سحر هنا؛ يمكنك توجيه المحرك نفسه إلى قاعدة جديدة كليًّا في عشر دقائق. المهارة القابلة للنقل برمجة الـAST ذاتها — اجتياز شجرة جمل هو الواجهة الخلفية للمحللات والمنسّقات والمحوّلات ومغطيات الاختبارات ومولّدي الكود، ونمط "حلّل مرة، وامشِ عمدًا، وطابق فرق الأسماء" صار في يديك لكلٍّ منها الآن.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/python-linter/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/python-linter) في مستودع الدورة يضمّ وحدات الزائر وفرق الأسماء والقواعد والـCLI مع `sloppy.py` ودفترًا يشغّل المحرك خطوة بخطوة. استنسخه، أو افتح المستودع كاملًا في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وافحص الملف المرافق في نافذة متصفح.
:::

## إلى أين تذهب من هنا

- **أضف قاعدة رابعة:** اكشف الكود غير القابل للوصول بتحليل بنمط `ast.After` — امشِ بحثًا عن `return` تتبعه جمل أخرى في الجسم نفسه، القاعدة التي تصطاد تنظيف `print` الميت قبل شحنه.
- **أصلح السهل تلقائيًّا:** `--fix` يعيد كتابة الملف مع إزالة أسطر الواردات غير المستخدمة — أنت تعرف أرقام أسطرها أصلًا، والإزالة مع *فحص* في الوقت نفسه الخطوتان الصادقتان.
- **متعدد الملفات بـ`--recursive`:** امشِ مجلدًا عبر `pathlib.Path.rglob("*.py")` وادمج تقرير كل ملف في تيار واحد، مرتّبًا عالميًّا بالشدة — الخطوة التي تجعله محلل مشروع حقيقيًّا لا لعبة ملف واحد.
- **افحص كودك:** وجّه `linter.py` إلى `examples/` في مستودع الدورة وشاهد ما تقوله القواعد عن قاعدة كود ناضجة — ثم اختر النتيجة التي تصلحها أولًا وافتح PR في فرعك بها.

## شارك مشروعك مع الصف

هل بنيت شيئًا تفخر به — قاعدة التقطت خطأً حقيقيًّا في كودك، محللاً تبنّاه زملاؤك؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع قدّمها طلاب آخرون، ويشرح README إضافة مشروعك عبر **طلب سحب (pull request)** من البداية للنهاية: التفرع، وفرع العمل، والالتزام، وفتح PR. لا يُفترض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓