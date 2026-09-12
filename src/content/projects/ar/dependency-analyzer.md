---
title: "محلل التبعيات"
description: "تصور وتدقيق تبعيات مشروعك ، اكتشاف الثغرات والحزم القديمة ومخاطر الترخيص."
difficulty: "intermediate"
estimatedMinutes: 75
tags: ["cli", "re", "dependency-management", "file-scanning"]
prerequisites:
  - "أساسيات Python (مجموعات، مسارات، regex)"
  - "راحة في تشغيل ملفات Python من طرفية"
learningObjectives:
  - "تحليل requirements.txt إلى سجلات تبعيات منظمة بأنواع مواصفات"
  - "فحص شجرة المصدر عن استيرادات وتصنيف مكتبة قياسية مقابل طرف ثالث مقابل محلي"
  - "ترابط المُعلَن مقابل المُستورَد لإيجاد التبعيات غير المستخدمة"
  - "فحص النسخ المعلنة مقابل خط أساس استشارات محلي"
  - "تغليف الخط الأنابيب بـ CLI رمز خروجه يبوّب بناءً"
---

# 🧩 ابنِ محلل تبعيات

يقول `requirements.txt` إن الفريق *ينوي* استخدام خمس حزم. والملفات المكتوبة فعلًا تقول أي الحزم *مستوردة فعلًا*. الفرق بين الاثنين هو حيث يسكن الهدر والخطر: تثبيتات خاملة تثقل الترصيبات حتى اليوم، و`numpy==1.26.0` مثبّت يمكن أن يبقى إصدارين ثانويين خلف الحد الأدنى الأمني بلا من يلحظ حتى يفحص بوت البيان. يبني هذا المشروع المحلل الصغير الذي يغلق الفجوة ، حلّل البيان، وافحص الاستيرادات، وبلّغ عما يختلفان فيه، كل ذلك بالمكتبة القياسية.

هذا يفترض Python 101 مع `pathlib` و`re` مريحين. لا يُشترط شيء من وحدة تحليل البيانات. إنه اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. حلّل `requirements.txt` إلى سجلات `(name, spec)` وصفّف كل تثبيت كآمث أو مدى أو غير مثبّت.
2. افحص شجرة مصدر `myapp/` وصفّف كل استيراد كـمكتبة قياسية أو طرف ثالث أو محلي.
3. ترابط الاثنين: تبعيات مُعلَنة لكنها لم تُستورد أبدًا.
4. قارن النسخ المُعلَنة بخط أساس استشارات محلي من الحدود الدنيا للنسخ.
5. اعملها CLI برموز خروج (`0` = سليم، `1` = تبعيات غير مستخدمة، `2` = خرق سياسة) بحيث يتصرف البناء دون تحليل نص.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الموصى به ، وظيفة الأداة كلها تجول *مجلدك*، وماسح مجلدات يعمل أفضل كـ CLI محلي.

**GitHub Codespaces** بديل بلا إعداد: افتح [مستودع الدورة كاملًا في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython مثبّتان بالفعل) وشغّل نفس الأوامر من طرفية المتصفح.

**Google Colab أو Kaggle Notebooks أو Binder** تعمل لكل خطوة ، دفتر الملاحظات في [`examples/dependency-analyzer/notebook.ar.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/dependency-analyzer/notebook.ar.ipynb) يشغّل المحلل نفسه فوق مشروع عينات مرفق. المقايضة الصادقة: الدفاتر لا تستطيع المشي في مستودع عشوائي كما يفعل الـ CLI المحلي.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/dependency-analyzer/notebook.ar.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/dependency-analyzer/notebook.ar.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdependency-analyzer%2Fnotebook.ar.ipynb)

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
uv init dependency-analyzer
cd dependency-analyzer
```

**✅ قائمة التحقق**

- ✅ يطبع `uv --version` رقم إصدار.
- ✅ يوجد `dependency-analyzer/` مع `pyproject.toml`.
- ✅ ينجح `python -c "import re, sys, pathlib"` ، لا حزم خارجية.

## الخطوة 1: حلّل `requirements.txt`

كل شيء يبدأ من البيان: تبعية واحدة لكل سطر، أحيانًا مثبّتة (`==2.31.0`)، أحيانًا مدى (`>=2.0`، `~=3.0`)، وأحيانًا رخوة (بلا مواصفة أصلًا). التحليل يعني استخراج `(name, spec)` وتصنيف المواصفة، لأن "هل هذا التثبيت قديم؟" يعني أشياء مختلفة لنسخة مقفلة وللمدى المفتوح.

### 1.1 اكتب المحلل

**👟 تلميح البداية :** افصل التعليقات المضمنة وخطوط الخيارات، وخذ اسم الحزمة قبل أول مسافة، وصفّف المواصفة بتعبيرين نمطيين صغيرين:

```python
# parse_req.py
import re

def parse_requirements(path: str) -> list[dict]:
    deps: list[dict] = []
    with open(path) as f:
        for line in f:
            line = line.split("#", 1)[0].strip()
            if not line or line.startswith(("-", ".", "[")):
                continue
            m = re.match(r"^([A-Za-z0-9_.\-]+)\s*(.*)$", line)
            if not m:
                continue
            deps.append({"name": m.group(1).lower(), "spec": m.group(2).strip()})
    return deps

def classify_spec(spec: str) -> str:
    if re.fullmatch(r"==[\d.]+", spec):
        return "pinned"
    return "ranged" if spec else "unpinned"

if __name__ == "__main__":
    for d in parse_requirements("myapp/requirements.txt"):
        print(f"{d['name']:<12} {d['spec'] or '<any>':<16} {classify_spec(d['spec'])}")
```

`line.split("#", 1)[0]` يجرد التعليقات المضمنة (`requests==2.31.0  # prod`) قبل أي شيء آخر؛ وحارس `line.startswith(...)` يتخطى خطوط الآليات مثل `--index-url` و`.` (تبعية مسار محلي). تعبير `classify_spec` صارم عمدًا فيما يعد تثبيتًا: `==2.31.0` مقفلة، بينما `>=2.0` و`~=3.0` مديَان ينحرفان.

**🎯 الناتج المتوقع :**

```
requests     ==2.31.0         pinned
pandas       >=2.0            ranged
numpy        ==1.26.0         pinned
flask        ~=3.0            ranged
click        >=8.0            ranged
```

**🩹 إذا لم يعمل :** إذا خرجت الأسماء بحروف كبيرة، فـ`.lower()` على `m.group(1)` مفقودة ، أسماء الحزم غير حساسة للحالة على PyPI لكن مسارات الملفات ليست كذلك، لذا طبيع إلى الأحرف الصغرى من البداية. إذا انتهى `--index-url https://...` كـ"تبعية"، فحارس `-` يعمل فقط قبل أن تقطعه `.strip()` ، تحقق من ترتيب الحراس: قسّم ← جرّد ← تخطَّ الفارغات ← تخطَّ الخطوط الشبيهة بالخيارات.

### 1.2 تحقّق من المحلل

**✅ قائمة التحقق**

- ✅ تعليق `#` في سطر وحده ومضمّن بعد تثبيت يُتجاهلان معًا.
- ✅ `package==1.2.3` بنمط `pip freeze` و`package>=1.2,<2` بنمط PEP 440 ينتجان معًا زوجي `(name, spec)`.
- ✅ خطوط لا تُرى أبدًا في `requirements.txt` ، فارغة، أو خيار، أو `-r other.txt` ، تُتخطى دون انكسار.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- المثبّت مقابل المدى مقابل غير المثبّت تصنيف *بتّ واحد*. `~=3.0` (توافق الإصدار) و`>=20,<21` (حد علوي محدد) يثبّتان بشكل مختلف لكن كلاهما يقول "مدى". ما الذي كان محلل مواصفات أغنى بحاجة لإضافته ليفرّق "انحراف محدود" عن "انحراف مفتوح" ، وأي الاثنين يجب أن يعامله فحص أمني كأكثر خطرًا؟
- `-e .` (ترصيبات محلية قابلة للتحرير) و`-r base.txt` (يتضمن ملفًا آخر) كلاهما يبدأ بـ `-` ويُتخطى. ما الخطأ في حشرها تحت "خيارات" ، ماذا تعني الاثنتان *فعلًا* مجموعة التبعيات؟

## الخطوة 2: افحص الاستيرادات

البيان جانب واحد من الحقيقة؛ الكود الجانب الآخر. الفحص يعني المشي في كل `.py` تحت جذر مشروعك، وسحب اسم الوحدة من كل `import x` / `from x import y`، وتصنيف كل اسم كـ*مكتبة قياسية* (فحص مقابل `sys.stdlib_module_names`)، أو *خاصتك* (بادئة مشروع)، أو *طرف ثالث*. المجموعة الثالثة هي التي تُقارن بالبيان.

### 2.1 اكتب الماسح

**👟 تلميح البداية :** تعبير نمطي واحد مثبّت على سطر لتعليمات الاستيراد، و`Path.rglob("*.py")` للمشي، و`sys.stdlib_module_names` للتصنيف ، كلها مكتبة قياسية:

```python
# scan.py
import re
import sys
from pathlib import Path

IMPORT_RE = re.compile(r"^\s*(?:import|from)\s+([\w.]+)", re.M)
STDLIB = set(sys.stdlib_module_names)

def scan_directory(root: str) -> set[str]:
    imports: set[str] = set()
    for path in Path(root).rglob("*.py"):
        imports |= {m for m in IMPORT_RE.findall(path.read_text())}
    return {name.split(".")[0] for name in imports}

def classify(imports: set[str], project: str) -> tuple[set[str], set[str], set[str]]:
    stdl, third, local = set(), set(), set()
    for name in imports:
        if name in STDLIB:
            stdl.add(name)
        elif name == project or name.startswith(project + "."):
            local.add(name)
        else:
            third.add(name)
    return stdl, third, local

if __name__ == "__main__":
    Path("myapp").mkdir(exist_ok=True)
    Path("myapp/app.py").write_text(
        "import os\nimport sys\nimport requests\nimport pandas as pd\n"
        "from myapp.utils import normalize\n")
    Path("myapp/utils.py").write_text(
        "import datetime\nimport numpy as np\n"
        "def normalize(value):\n    return value\n")

    imports = scan_directory("myapp")
    stdl, third, local = classify(imports, project="myapp")
    print("stdlib:", sorted(stdl))
    print("third-party:", sorted(third))
    print("local:", sorted(local))
```

يطبيع الفحص `from pandas import DataFrame` و`import pandas as pd` إلى نفس الاسم العلوي `pandas` ، `name.split(".")[0]` يقطع `myapp.utils` أيضًا إلى `myapp`، لذا ينهار كل استيراد إلى الكلمة الواحدة التي كان البيان سيعلنها. `sys.stdlib_module_names` هو بيت القصيد لهذا الجيل من Python: مجموعة منسقة من أسماء المكتبة القياسية، بلا قائمة محفوظة يدويًا تُصان. ملفَا العرض القصصي موجودان ليُ*مسحا*، لا ليُشغّلا ، `app.py` يستخدم `pandas` غير المثبّتة هنا، ولهذا بالضبط لا تنفّذ الكود الذي تحلله.

**🎯 الناتج المتوقع :**

```
stdlib: ['datetime', 'os', 'sys']
third-party: ['numpy', 'pandas', 'requests']
local: ['myapp']
```

**🩹 إذا لم يعمل :** إذا ظهر `myapp` في مجموعة المكتبة القياسية، فـ`sys.stdlib_module_names` غير موجود (Python < 3.10) ، مجموعة `STDLIB` كلها فارغة حينئذ، فيتساقط كل شيء إلى طرف ثالث؛ شغّل على 3.10+. إذا فُقدت استيرادات في منتصف ملف، فتستخدم `IMPORT_RE` علامة `^` *مع* علم `re.M` ، أسقط `re.M` ولن يطابق سوى الاستيرادات في *بداية* الأسطر، متخطيًا بصمت استيرادات ذات مسافة بادئة داخل الدوال (Python صالح، والتعبير لا يستطيع تمييزها).

### 2.2 تحقّق من الفحص

**✅ قائمة التحقق**

- ✅ أسماء المكتبة القياسية (`os`، `sys`، `datetime`) تهبط في المكتبة القياسية، لا طرف ثالث ، يستخدم التصنيف `sys.stdlib_module_names`، لا تخمين آلة كاتبة.
- ✅ `import pandas as pd` و`from myapp.utils import normalize` و`import requests` كلها تنهار إلى `pandas`/`myapp`/`requests`.
- ✅ مجلد بلا ملفات `.py` ينتج مجموعة استيراد فارغة، لا انكسارًا.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- الماسح نصي: يقرأ *رموز* الاستيراد، لا كودًا. `import numpy as np  # in a comment` كان سيُلتقط، وكذلك `if False: import numpy`. ماذا يضيف ماسح قائم على AST (وحدة `ast`) فوق التعبير النمطي ، وما الذي ما زال *لا* يعرفه أن ملف تعريف تشغيل (`import foo` ثم `foo()` عند التشغيل) كان سيعرفه؟
- استيرادات نسبية (`from . import x`، `from ..y import z`) تختفي بصمت من هذا الماسح. لماذا يفشل `.` تعبير `\w` المدعوم ، وهل فقدان استيراد نسبي فشل *آمن* لتقرير "تبعية غير مستخدمة" أم *خطير*؟

## الخطوة 3: ابحث عن التبعيات غير المستخدمة

هنا مكافأة وجود الجانبين: **المُعلَن** (من `requirements.txt`) ناقص **المُستورَد** (ما يسحبه الكود فعلًا). أي شيء مُعلَن-ولكن-غير-مستورد إما وزن ميت يُقص أو إشارة أن الفحص يفقد شيئًا ، كلاهما يستحق عين إنسان. الفحص فرق مجموعة؛ الصدق في الاعتراف أن فرق المجموعة جيد بقدر الماسح فقط.

### 3.1 اكتب `find_unused`

**👟 تلميح البداية :** دالة واحدة، طرح مجموعة واحد، قائمة مرتبة في الخرج ، القيمة ليست الحساب، بل أن لديك *مجموعتين جديرتين بالثقة* لتطرحهما:

```python
# unused.py
def find_unused(declared: set[str], imported: set[str]) -> list[str]:
    return sorted(declared - imported)
```

### 3.2 شغّله على المشروع

```python
# step3.py
from parse_req import parse_requirements
from scan import scan_directory
from unused import find_unused

declared = {d["name"] for d in parse_requirements("myapp/requirements.txt")}
imported = scan_directory("myapp")
for name in find_unused(declared, imported):
    print(f"unused: {name}")
```

ثلاث حزم مستوردة (`requests` و`pandas` و`numpy`) تطابق ثلاثًا معلنة؛ و`flask` و`click` معلنتان لكن لم تُستوردا أبدًا. الاتجاه العكسي ، *مستورد لكن غير معلن* ، مثير بنفس الدرجة وتغيير سطر واحد (`imported - declared`)، لكنه خطأ مختلف: كودك لن يترصّب في بيئة نظيفة أصلًا. قرار النطاق هنا "معلن لكن غير مستخدم"، لأنه الفرع الذي يمكنك التصرف فيه فورًا (احذف الأسطر) ولأن مهمة البيئة النظيفة غالبًا عمل أداة أخرى.

**🎯 الناتج المتوقع :**

```
unused: click
unused: flask
```

**🩹 إذا لم يعمل :** إذا أظهر pandas كغير مستخدمة، فأرسلها المصنف إلى مجموعة *المحلي* (هل طابق بادئة المشروع `pandas.`؟) ، فلا تصل أبدًا إلى `imported` للطرح. تحقق من ترتيب `elif` في `classify`. إذا كان *كل شيء* غير مستخدم، فمشى `scan_directory` في الجذر الخاطئ ، يفحص العرض القصصي `myapp/`، لذا أكد أن مسار `requirements.txt` و`--dir` نفس الشجرة.

### 3.3 تحقّق من قائمة غير المستخدم

**✅ قائمة التحقق**

- ✅ المجموعة المعلنة `{requests, pandas, numpy, flask, click}`؛ والمجموعة المستوردة `{os, sys, datetime, requests, pandas, numpy, myapp}`؛ والفرق بالضبط `{click, flask}`.
- ✅ ناتج غير المستخدم مُرتَّب أبجديًا (sorted)، فتعتمد الاختبارات على الترتيب.
- ✅ إزالة `flask~=3.0` و`click>=8.0` من `requirements.txt` تفرّغ قائمة غير المستخدم ، الأداة تجد التثبيتات الميتة، لا تتخيلها.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تصادم أسماء إقليمي: تعلن `requests` (حزمة PyPI) لكن لديك *أيضًا* وحدة `requests/` محلية ، يرى طرح المجموعة تبعية مستخدمة ويبقى صامتًا. ما الذي على أداة إضافته (سيناريو: فحص *كيف* يُستورد اسم، مثل `from requests import Session` مقابل `import requests.utils` الملتقط لملف محلي) قبل أن تستطيع تسمية هذا العمود "مستخدم ومتحقق"؟
- `click` و`flask` "غير مستخدمتين" وفق الفحص، لكن `flask` كثيرًا ما تُحمّل برنامجًا آخر معلنًا عبر *نقطة دخول*، لا عبر استيراد. ماذا يقول ذلك عن محلل يرى سطور `import` فقط ، هل "غير مستخدم" حكم أم تنبيه؟

## الخطوة 4: فحص النسخ مقابل خط الأساس الاستشاري

غير المستخدم هدر؛ *خارج السياسة* خطر. تقارن هذه الخطوة كل مواصفة معلنة بسجل استشارات محلي ، قاموس من الحدود الدنيا المقبولة للنسخ. يقف نيابة عن السباكة الواقعية (`pip-audit` وOSV وبيانات PyPI الوصفية)، التي تحتاج استدعاءات شبكة؛ نفس الشكل، صادقٌ حول الاستبدال. تثبيت `==1.26.0` دون أرضية `>=1.30` يحصل على الخط الأحمر.

### 4.1 اكتب فاحص النسخ

**👟 تلميح البداية :** استخرج رقم نسخة من كل جانب مواصفة بتعبير نمطي رخو واحد، وقارنه كصفوف أعداد صحيحة، ووصف النتيجة لكل تبعية:

```python
# health.py
import re

ADVISORY = {
    "requests": ">=2.28",
    "numpy": ">=1.30",
    "flask": ">=2.2",
    "pandas": ">=1.5",
}

def version_tuple(spec_part: str) -> tuple[int, ...]:
    m = re.search(r"\d+(?:\.\d+)*", spec_part)
    return tuple(int(p) for p in m.group(0).split(".")) if m else (0,)

def check_advisories(name: str, spec: str) -> str:
    rule = ADVISORY.get(name)
    if not rule:
        return "not in advisory registry"
    mine = version_tuple(spec) if spec else (0,)
    minimum = version_tuple(rule)
    state = "ok" if mine >= minimum else "BELOW ADVISORY MINIMUM"
    have = ".".join(map(str, mine))
    return f"{state} (have {have}, min {'.'.join(map(str, minimum))})"
```

```python
# step4.py
from parse_req import parse_requirements
from health import check_advisories

for d in sorted(parse_requirements("myapp/requirements.txt"), key=lambda d: d["name"]):
    print(f"{d['name']:<12} {d['spec'] or '<any>':<16} {check_advisories(d['name'], d['spec'])}")
```

`version_tuple` هي المقارنة كلها في ثمانية أسطر: تلتقط أول مرّ `major.minor(.patch)` من أي سلسلة مواصفة، لذا `==2.31.0` و`~=3.0` و`>=2.28` كلها تصبح صفوفًا صحيحة تستحق المقارنة. مقارنة صفوف الأعداد هو ترتيب النسخ المدمج في Python: `(2, 31, 0) >= (2, 28)` يساوي `True`، و`(1, 26, 0) >= (1, 30)` يساوي `False` ، لا فخاخ فرز سلاسل. تبعية معلنة *غير مثبّتة* (`click` بلا مواصفة) تحصل على `(0, ...)` ، تُعامل كـ"قد تكون أي شيء"، فيقررها سجلّ الاستشارات.

**🎯 الناتج المتوقع :**

```
click        >=8.0            not in advisory registry
flask        ~=3.0            ok (have 3.0, min 2.2)
numpy        ==1.26.0         BELOW ADVISORY MINIMUM (have 1.26.0, min 1.30)
pandas       >=2.0            ok (have 2.0, min 1.5)
requests     ==2.31.0         ok (have 2.31.0, min 2.28)
```

**🩹 إذا لم يعمل :** إذا أرجع `version_tuple("~=3.0")` القيمة `(0,)`، فالتعبير يبحث عن أرقام *مرسية* (`^\d+`) بدل بحث ، `~` يسبق الرقم `3`. إذا أظهر `click` `ok` بدل `not in advisory registry`، فـ`ADVISORY.get(name)` يرقّع افتراضيًا، أي مفتاح بنمط `numpy` ليس `click` ، مفاتيح السلسلة دقيقة؛ فوات السجل هي النتيجة *المصممة*، لا احتياطي.

### 4.2 تحقّق من الفحص الاستشاري

**✅ قائمة التحقق**

- ✅ حزمة دون حدها الأدنى (`numpy`) تُعلَّم؛ وهي عند الحد (`requests` و`flask` و`pandas`) "ok".
- ✅ حزمة بلا إدخال سجلي (`click`) يُبلَّغ عنها كغير مراجَعة، لا غائبة بصمت.
- ✅ لا حيل نصوص: `~=3.1` و`>=3.1` يقارنان متساويين كصفّين، و`2.28` ≠ `2.28.1` ، طول الصف جزء من الترتيب.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يُرجع `version_tuple("~=3.0")` القيمة `(3, 0)` ويقارنها كـ*على الأقل* 3.0. في PEP 440، تعني `~=3.0` فعلًا `>=3.0, <4` ، "إصدار متوافق". ما الذي يجعل محللك يدّعيه بتجاهل الحد العلوي بينما لا يستطيع فعليًا وعدَه؟
- السجل قاموس محلي. في مشروع حقيقي سيأتي من خلاصة قابلة للاستعلام (JSON لـ PyPI، OSV). ماذا يغيّر *شكل* المقارنة عندما يكون مصدر الحقيقة API حيًا ، وما الذي يبدأ في الفشل عندما لا توجد شبكة في CI؟

## الخطوة 5: الـ CLI ورمز الخروج

تنتهي وظيفة المحلل حين يستطيع سكربت بناء معاملة الجواب كـ*حكم*، لا تدفق نص. يأخذ الـ CLI `--dir`، ويؤلّف حلل ← افحص ← غير المستخدم ← استشاري، ويطبع ثلاثة أسطر ملخص، ويرجع `0` (سليم) أو `1` (تبعيات غير مستخدمة) أو `2` (خرق استشاري) ، بحيث يفشل CI على `$?` دون قراءة تقريرك أصلًا.

### 5.1 اكتب `analyze.py`

**👟 تلميح البداية :** `argparse` لـ`--dir`، أعد استخدام كل دالة من الخطوات السابقة، واضبط `sys.exit` من دلوي الفشل:

```python
# analyze.py
import argparse
import sys
from pathlib import Path

from health import check_advisories
from parse_req import parse_requirements
from scan import scan_directory
from unused import find_unused

def main() -> None:
    parser = argparse.ArgumentParser(description="Analyze a project's Python dependencies.")
    parser.add_argument("--dir", default=".")
    args = parser.parse_args()

    root = Path(args.dir)
    req = parse_requirements(root / "requirements.txt")
    imported = scan_directory(str(root))
    declared = {d["name"] for d in req}

    unused = find_unused(declared, imported)
    policy_budget = 0
    warnings = []
    for d in sorted(req, key=lambda d: d["name"]):
        report = check_advisories(d["name"], d["spec"])
        if "BELOW" in report:
            policy_budget = 2
            warnings.append(f"{d['name']} {d['spec']}: {report}")

    print(f"declared: {len(req)}  used: {len(declared & imported)}  unused: {len(unused)}")
    for name in unused:
        print(f"unused: {name}")
    for w in warnings:
        print(f"advisory: {w}")
    print("result:", "FAIL" if (unused or policy_budget) else "OK")
    sys.exit(1 if unused else policy_budget)

if __name__ == "__main__":
    main()
```

```bash
uv run python analyze.py --dir myapp
```

سياسة رمز الخروج *اختيار*، مكتوب حيث يراها مراجع: غير المستخدم يربح (`1`) على الاستشاري (`2`)؛ النظيف يربح (`0`). تأليف خط الأنابيب كله من دوال تملكها يعني ضبطًا مستقبليًا "احجب على غير المستخدم" تغيير `.py` من سطر واحد، لا إعادة كتابة.

**🎯 الناتج المتوقع :**

```
declared: 5  used: 3  unused: 2
unused: click
unused: flask
advisory: numpy ==1.26.0: BELOW ADVISORY MINIMUM (have 1.26.0, min 1.30)
result: FAIL
```

أعد تشغيل أمر الطرفية و`echo $?` يطبع `1`.

**🩹 إذا لم يعمل :** إذا اشتعل `FileNotFoundError` لـ`requirements.txt`، فـ`--dir` يشير إلى مجلد لا يحوي واحدًا ، يتوقع الـ CLI أن يكون بيانك *داخل* الجذر المفحوص، مطابقًا لما يفحصه المحلل. إذا طُبع `exit code: 0` رغم حزم غير مستخدمة، فـ`sys.exit(1 if unused else policy_budget)` مفقودة ، سطر `print("result: ...")` صدقاني، ورمز الخروج هو العقد.

### 5.2 تحقّق من الـ CLI

**✅ قائمة التحقق**

- ✅ `uv run python --dir myapp` يطبع الملخص أعلاه و`echo $?` يساوي `1`.
- ✅ حذف `click`/`flask` من `requirements.txt` يحوّل التشغيل إلى `result: OK`، خروج `0`.
- ✅ رفع تثبيت `numpy` إلى `==1.30.0` يمسح الاستشاري *ويبقي* `unused` عند الصفر ، رمز الخروج يشتق من البيانات ويقرأ نفس الملفات التي تصفحها.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- ينهار رمزا الخروج 1 و2 عندما يتحقق الشرطان معًا (يمضي `1` المقطوع). إذا أراد بناء تمييز "كود ميت، احجب" عن "إصدار أمني معلّق، حذّر"، فترميزا الكودين بحاجة إلى تأليف (مثل 1 = غير مستخدم، 2 = استشاري، 3 = الاثنان). ما الذي يتغير في `sys.exit(...)` ليصبح 3 = كلاهما من سطر واحد ، وهل CI يهتم؟
- يعد `declared & imported` حزمة مستخدمة *مرة* كمستخدمة؛ لا توجد إشارة كثافة "مستوردة إحدى عشرة مرة في تسعة ملفات". ماذا كانت ستضيف أبعاد *تردد* لفرز التقرير ، ومن قارئ التقرير الذي سيستخدمه فعلًا؟

## ⚠️ المآزق الشائعة

- **مطابقة استيراد جزئية.** مطابقة `import os` مقابل `os.path` أو `osx-tools` تحتاج حدود كلمات ، التعبير الرمزي `([\w.]+)` مباشرة بعد `import|from` يعطيك الاسم العلوي فعلًا، فلا تختبر أسماء الوحدات بـ `in`.
- **الثقة بجانب واحد.** معلن-بدون-مستورد = غير مستخدم؛ مستورد-بدون-معلن = ترصيبات نظيفة مكسورة. محلل يجيب عن اتجاه واحد يكتب نص تقرير. (اعكس الطرح والخطأ الثاني مجاني.)
- **ضوضاء البيان.** سطور `--index-url` و`-r` و`.` و`#comment` ليست تبعيات. محلل يسك "تبعية" اسمها `--index-url` يفسد كل رقم بعده فيها.
- **صفوف النسخ ليست سلاسل.** `"9.0" < "10.0"` يساوي `False` معجميًا لكن `(9,0) < (10,0)` يساوي `True` عدديًا ، قارن دائمًا عبر صفوف أعداد صحيحة في هذا المشروع.
- **ابتلاع بادئة المواصفة.** التقاط `29` من `>=29,<30` في `version_tuple` يفوّت حدّ `<30`، وفجوة رسم الاسم (`python-dateutil` يستورد كـ`dateutil`) تعني أن محللًا "بريئًا" يبارك بصمت حزمة مستخدمة فعلًا كغير مستخدمة. التقرير يقرأ كفحص، ويحكم كإنسان.

## ما بنيته للتو

محلل تبعيات بلا تبعيات خاصة به: محلل بيان، ماسح استيراد، مُفرِّق بطرح مجموعات، فاحص نسخ استشاري، وبوابة رمز خروج ، خمسة ملفات، فعل CLI واحد، وتقرير تختصره ثلاثة أسطر. الدرس القابل للنقل هو *التثليث*: كلٌّ من البيان وفحص الكود يحكي قصة جزئية، وقيمة الأداة بالضبط في الأماكن التي يختلف فيها الاثنان ، تثبيتات غير مستخدمة تُقلم، نسخ خارج السياسة تُرفع، و(مع قلب الطرح) تبعيات نسيت إعلانها أصلًا.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
لدى [`examples/dependency-analyzer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/dependency-analyzer) في مستودع الدورة السكربتات الكاملة ومشروع عينات `myapp/` وسجل استشارات عينة. أو افتح المستودع كاملًا في [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## إلى أين تذهب من هنا

- افحص **الاتجاه العكسي** (`imported - declared`) كعمود تقرير ثانٍ: "مُعلنة في لا مكان لكن مستوردة في كل مكان = ترصيبات نظيفة تنهار" ، مكتشف خطأ مجاني الآن بعد أن وُجدت الآلية.
- انشر **الملخص كـ JSON** (`--json`)، بحيث يعرض لوحة أو بوت PR الأحكام دون إعادة تحليل تقريرك البشري.
- أضف ماسحًا **قائمًا على `ast`** كمصدر استيراد ثانٍ، وعلّم الحزم حيث يختلف ماسحا التعبير وAST ، فرز حيث تعيش الاستيرادات المشبوهة.
- اطابق **فجوة رسم الاسم** بقاموس بدائل (`python-dateutil` ← `dateutil`، `beautifulsoup4` ← `bs4`) حتى يتوقف طرح المجموعة عن الخطأ في نصف تسميات PyPI.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها ، وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓