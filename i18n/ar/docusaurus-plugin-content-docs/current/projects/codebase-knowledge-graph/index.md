---
id: codebase-knowledge-graph
title: "حوّل قاعدة كود إلى رسم بياني معرفي"
sidebar_label: "حوّل قاعدة كود إلى رسم بياني معرفي"
slug: /projects/codebase-knowledge-graph
description: "تخرّج من بيئة البرمجة في المتصفح إلى Python فعلي: حلّل ملفات Python لقاعدة كود حقيقية بوحدة ast، وابنِ رسمًا بيانيًا لبنيتها بـnetworkx، وتصوّره واستعلمه — بلا مفتاح API، بلا وصول للشبكة."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 حوّل قاعدة كود إلى رسم بياني معرفي

<ProjectPublishedDate projectId="codebase-knowledge-graph" />

<ProjectGreeting />

كل مشروع آخر في هذا القسم يلجأ في النهاية إلى مفتاح API، أو تسجيل مستوى مجاني، أو موقع ويب حي. هذا المشروع لا يحتاج أيًّا من ذلك. ستكتب أداة تقرأ كود Python المصدري بنفس الطريقة التي يقرأها بها المُفسِّر نفسه — بتحليله إلى **AST** (شجرة بنية مجردة) باستخدام وحدة `ast` المدمجة في المكتبة القياسية — ثم تحوّل ما تجده إلى **رسم بياني (graph)**: الملفات والدوال والفئات كعُقَد، وعلاقات "يستورد"/"يستدعي"/"مُعرَّف في" كأضلاع. هذا مثال حقيقي وعملي على بنية بيانات من وقت مبكر جدًا في الدورة تظهر في أداة مفيدة فعلًا، لا تمرين صفي: الرسم البياني هو فقط عُقَد وأضلاع، وتبيّن أن بنية قاعدة الكود نفسها هي بالفعل واحد منها.

هذا يفترض Python 101 وارتياحًا مع الدوال والاستيرادات — لا يُشترط أي شيء من تحليل البيانات، ولا شيء هنا يستدعي أي نموذج ذكاء اصطناعي أو خدمة ويب. هذا اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/docs/projects) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. تثبيت `uv` وإعداد مشروع صغير بـ`networkx` و`pyvis` — بلا مفتاح API، بلا تسجيل، لا شيء لإعداده.
2. تحليل AST لملف Python واحد لإيجاد تعريفات دوال، وتعريفات فئات، واستيرادات.
3. اجتياز مستودع كامل وبناء رسم بياني من كل ما تجده، باستخدام `networkx`.
4. إضافة أضلاع لعلاقات **الاستيراد** و**الاستدعاء**، لكي يلتقط الرسم البياني كيف تتصل الأجزاء فعليًا، لا فقط ما هو موجود.
5. تصور الرسم البياني كصفحة HTML تفاعلية بـ`pyvis` (واختياريًا، صورة ثابتة بـ`matplotlib`).
6. كتابة دالة استعلام صغيرة — "ماذا تستدعي هذه الدالة؟"، "ما الذي يستورد هذه الوحدة؟" — وتشغيل كل شيء مقابل مستودع حقيقي.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي والموصى به — Python فعلي، على جهازك الخاص، يقرأ ملفات حقيقية من مجلد حقيقي على القرص.

**GitHub Codespaces** يعمل رائعًا هنا أيضًا: افتح [مستودع الدورة كاملًا في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython وuv مثبّتة بالفعل، وفق `.devcontainer/devcontainer.json` الخاص بالمستودع) وشغّل نفس أوامر `uv` تمامًا من طرفية في تبويب متصفحك — ولديك بالفعل مستودع حقيقي هناك مباشرة لتوجيه الأداة إليه.

**Google Colab أو Kaggle Notebooks** خيار سهل فعلًا أيضًا، لا مجرد بديل احتياطي — هذا المشروع لا يحتاج GPU، ولا عملية خادم طويلة التشغيل، ولا مفتاح API، فقط `pip install` وحساب بحت. نفّذ `!pip install networkx pyvis` في خلية، ثم إما `!git clone` لمستودع عام لتحليله أو ارفع مجلدًا صغيرًا من ملفات `.py`، وبقية الكود أدناه يعمل دون تغيير أساسًا (يمكن حتى عرض مخرجات HTML الخاصة بـpyvis مضمَّنة في خلية دفتر ملاحظات).

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/codebase-knowledge-graph/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/codebase-knowledge-graph/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcodebase-knowledge-graph%2Fnotebook.ipynb)

دفتر ملاحظات جاهز بكل الكود أدناه — بما في ذلك ملفات `sample_repo/` التجريبية مكتوبة مضمَّنة، لذا لا شيء لرفعه أو استنساخه — موجود في [`examples/codebase-knowledge-graph/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/codebase-knowledge-graph/notebook.ipynb). انقر على شارة أعلاه لتشغيله مباشرة.

## الإعداد

بما أنه لا يوجد مفتاح API ولا ملف `.env` في أي مكان في هذا المشروع، الإعداد قصير بشكل غير معتاد.

**ثبّت `uv`**، أداة واحدة تحل محل السلسلة المعتادة "ثبّت Python، ثم ثبّت pip، ثم ثبّت أداة بيئة افتراضية، ثم ثبّت الحزم":

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

**أعِدَّ مشروعًا وثبّت التبعيات:**

```bash
uv init codebase-graph
cd codebase-graph
uv add networkx pyvis matplotlib
```

`networkx` مكتبة رسوم بيانية مجانية وبايثون خالص — تتعامل مع بنية بيانات الرسم البياني الفعلية (العُقَد، الأضلاع، الاجتياز) لكي لا تحتاج لكتابة واحدة من الصفر. `pyvis` تحوّل رسمًا بيانيًا من `networkx` إلى صفحة HTML تفاعلية يمكنك سحبها والتكبير فيها في متصفح. `matplotlib` اختيارية، تُستخدَم لبديل صورة ثابتة في الخطوة 5.

هذا هو الإعداد بأكمله. **بلا مفتاح API، بلا ملف `.env`، بلا تسجيل مستوى مجاني، بلا متغيّر بيئة لإعداده** — كل خطوة من هنا فصاعدًا تقرأ ملفات محلية وتشغّل حسابًا محليًا.

:::tip[لا حاجة لوصول إنترنت بعد التثبيت]
بمجرد أن ينتهي `uv add` من تنزيل هذه الحزم الثلاث، يمكن لبقية هذا المشروع بأكملها أن تعمل مع شبكتك مقطوعة. يستحق هذا الملاحظة: كل شيء آخر في هذا القسم من الدورة يدور حول استدعاء نموذج بعيد أو موقع ويب بعيد، ومن السهل البدء بافتراض أن كل مشروع Python "حقيقي" يحتاج استدعاء شبكة في مكان ما. هذا مثال مضاد مفيد — التحليل الساكن ونظرية الرسوم البيانية بلا اتصال بالكامل.
:::

## الخطوة 1: حلّل AST لملف واحد

قبل تحليل مستودع كامل، اجعل ملفًا واحدًا يعمل. وحدة `ast` المدمجة في Python تحوّل الكود المصدري إلى شجرة من الكائنات تصف بنيته — نفس التمثيل الذي يبنيه المُفسِّر نفسه قبل تشغيل كودك. `ast.parse` يعطيك جذر تلك الشجرة؛ `ast.walk` يتيح لك زيارة كل عقدة فيها.

أنشئ ملف اختبار صغيرًا، `sample.py`:

```python
# sample.py
import os

def greet(name):
    print(f"Hello, {name}")

class Greeter:
    def greet_twice(self, name):
        greet(name)
        greet(name)
```

ثم اكتب `explore_ast.py` لاستكشافه:

```python
# explore_ast.py
import ast
from pathlib import Path

source = Path("sample.py").read_text(encoding="utf-8")
tree = ast.parse(source, filename="sample.py")

for node in ast.walk(tree):
    if isinstance(node, ast.FunctionDef):
        print("function:", node.name)
    elif isinstance(node, ast.ClassDef):
        print("class:", node.name)
    elif isinstance(node, ast.Import):
        for alias in node.names:
            print("import:", alias.name)
    elif isinstance(node, ast.ImportFrom):
        print("import from:", node.module)
```

```bash
uv run python explore_ast.py
```

يجب أن ترى `function: greet` و`class: Greeter` و`import: os` مطبوعة — بالإضافة إلى `function: greet_twice`، لأن `ast.walk` يزور *كل* عقدة في الشجرة، بما فيها تعريف دالة متداخل داخل فئة. هذا التداخل مهم للخطوة 2: دالة وُجدت بهذه الطريقة قد تكون دالة حقيقية من المستوى الأعلى، أو قد تكون مِيثُدًا لا معنى له إلا مرفقًا بفئته، ويحتاج الرسم البياني للاحتفاظ بذلك التمييز بدلًا من تسطيح كل شيء في كومة واحدة غير مميَّزة من "الدوال."

:::tip[ast.parse قد تفشل — وهذا متوقع، لا خطأ في كودك]
لا يتحلل كل ملف `.py` في مستودع حقيقي بنظافة: قد يكون ملف كود Python 2 متبقٍّ في مستودع قديم، أو ملف قالب بامتداد `.py` ليس Python صالحًا على الإطلاق، أو يحتوي فعليًا خطأ صيغة نسيه أحدهم. يرفع `ast.parse` استثناء `SyntaxError` في هذه الحالة بالضبط. تغليفه بـ`try`/`except SyntaxError` وتخطي الملف بتحذير — بدلًا من ترك الأداة بأكملها تتعطل عند الملف رقم واحد من ألفين — ممارسة قياسية لأي أداة تجتاز قاعدة كود حقيقية، وهو مُدمَج في نسخة الخطوة 2.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يعمل `uv run python explore_ast.py` دون أخطاء ويطبع `function: greet` و`class: Greeter` و`import: os`.</StepChecklistItem>
<StepChecklistItem>تُطبَع أيضًا `function: greet_twice`، رغم أنها متداخلة داخل `Greeter` — مؤكدًا أن `ast.walk` يزور كل عقدة، لا عُقَد المستوى الأعلى فقط.</StepChecklistItem>
<StepChecklistItem>يمكنك أن تشرح، في جملة واحدة، الفرق بين `ast.Import` (`import os`) و`ast.ImportFrom` (`from x import y`).</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يزور `ast.walk` العُقَد دون ترتيب معين مضمون نسبة لعمق التداخل. لو احتجت لمعرفة أي فئة تحديدًا ينتمي إليها مِيثُد، هل سيعطيك تكرار `ast.walk` المسطّح وحده ذلك، أم ستحتاج لاجتياز `tree.body` (المستوى الأعلى فقط) ثم `.body` الخاص بكل فئة بشكل منفصل؟ لماذا تنتهي الخطوة 2 بفعل الخيار الثاني؟
- ماذا سيفعل `ast.parse` لو أطعمته ملف `.txt` مليء بالنثر الإنجليزي بدلًا من كود Python؟ جرّب وانظر ما إذا كانت رسالة الخطأ الناتجة ستساعد فعليًا شخصًا يصحح مشكلة حقيقية من نوع "لماذا تخطى مسحي هذا الملف."

## الخطوة 2: اجتز مستودعًا كاملًا وابنِ الرسم البياني

بنية ملف واحد بداية؛ قيمة مستودع كامل من الملفات، والدوال، والفئات، وعلاقاتها هي ما يجعل هذا **رسمًا بيانيًا معرفيًا** حقيقيًا بدلًا من قائمة. `networkx.DiGraph` (رسم بياني موجَّه — للأضلاع اتجاه، لأن "الملف A يستورد الوحدة B" ليست نفس الادعاء "الوحدة B تستورد الملف A") هي بنية البيانات التي تحمل كل ذلك.

```python
# build_graph.py (excerpt -- Step 2)
import ast
from pathlib import Path

import networkx as nx


def parse_file(path):
    """Parses one file's AST; returns None and warns instead of crashing on a syntax error."""
    try:
        tree = ast.parse(path.read_text(encoding="utf-8", errors="ignore"), filename=str(path))
    except SyntaxError as exc:
        print(f"Skipping {path}: syntax error ({exc.msg} at line {exc.lineno})")
        return None
    return tree


def build_graph(repo_path):
    graph = nx.DiGraph()

    for path in sorted(repo_path.rglob("*.py")):
        tree = parse_file(path)
        if tree is None:
            continue

        rel = str(path.relative_to(repo_path))
        graph.add_node(rel, kind="file")

        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    module = alias.name.split(".")[0]
                    graph.add_node(module, kind="module")
                    graph.add_edge(rel, module, kind="imports")
            elif isinstance(node, ast.ImportFrom) and node.module:
                module = node.module.split(".")[0]
                graph.add_node(module, kind="module")
                graph.add_edge(rel, module, kind="imports")

        # Only tree.body -- top-level statements -- so a method nested in a
        # class isn't mistaken for a module-level function (see Step 1).
        for node in tree.body:
            if isinstance(node, ast.FunctionDef):
                qualified = f"{rel}::{node.name}"
                graph.add_node(qualified, kind="function", short_name=node.name)
                graph.add_edge(rel, qualified, kind="defines")
            elif isinstance(node, ast.ClassDef):
                class_qualified = f"{rel}::{node.name}"
                graph.add_node(class_qualified, kind="class", short_name=node.name)
                graph.add_edge(rel, class_qualified, kind="defines")

    return graph


if __name__ == "__main__":
    graph = build_graph(Path("sample_repo"))
    print(f"{graph.number_of_nodes()} nodes, {graph.number_of_edges()} edges")
```

كل عقدة في رسم بياني من `networkx` هي فقط قيمة قابلة للتجزئة (hashable) — هنا، سلسلة نصية بسيطة مثل `"models.py"` أو `"models.py::Order"` — مع قاموس اختياري من السمات (`kind`، `short_name`) مُرفَق بها. استخدام `"file.py::name"` كمُعرِّف عقدة، بدلًا من `"name"` فقط، يهم بمجرد أن يملك مستودع ملفين يُعرِّفان كلاهما دالة اسمها `helper` — بدون بادئة الملف، سيعامل `networkx` بصمت كلتيهما كنفس العقدة.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>تشغيل `build_graph.py` مقابل مجلد صغير من ملفات `.py` يطبع عدد عُقَد وأضلاع غير صفري.</StepChecklistItem>
<StepChecklistItem>ملف يُعرِّف دالتين ويستورد وحدة واحدة ينتج على الأقل 4 عُقَد لهذا الملف وحده (الملف نفسه، والوحدة، والدالتان).</StepChecklistItem>
<StepChecklistItem>اكسر عمدًا صيغة ملف واحد (قوس غير مُغلَق) وتأكد أن الأداة تتخطاه بتحذير بدلًا من التعطل.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لماذا استخدام `"file.py::function_name"` كمُعرِّف عقدة بدلًا من `"function_name"` فقط؟ ما الذي سيسوء تحديدًا في مستودع فيه ملفا `utils.py` في مجلدين فرعيين مختلفين، كل منهما يُعرِّف دالة اسمها `run`؟
- `graph.add_node(module, kind="module")` يعمل في كل مرة يُعثَر فيها على استيراد، حتى لو كانت تلك الوحدة قد أُضيفت بالفعل من ملف سابق. هل يُنشئ `networkx` عقدة مكرَّرة، أم يترك الموجودة فقط؟ راجع وثائق `networkx` (أو اختبر ذلك ببساطة) — لماذا يجعل ذلك السلوك هذا الكود آمنًا للاستدعاء بشكل متكرر دون التحقق بنفسك "هل رأيت هذه الوحدة من قبل"؟

## الخطوة 3: أضف أضلاع الاستدعاء

الملفات والدوال والفئات والاستيرادات تصف ما *موجود*. لالتقاط كيفية *استخدام* الأجزاء لبعضها فعليًا، تحتاج علاقة واحدة أخرى: أي دالة تستدعي أيًّا. هذا هو الجزء الأقل دقة في الأداة — لا يمكن للتحليل الساكن أن يكون متأكدًا دائمًا مما يستهدفه استدعاء (المزيد عن ذلك في المآزق أدناه) — لكن نسخة "أفضل جهد، مُطابَقة بالاسم" لا تزال مفيدة فعليًا.

```python
# build_graph.py (excerpt -- Step 3, extends parse_file's per-function work)
def called_names(func_node):
    """Best-effort list of names a function/method's body calls."""
    names = []
    for node in ast.walk(func_node):
        if isinstance(node, ast.Call):
            target = node.func
            if isinstance(target, ast.Name):          # add(...)
                names.append(target.id)
            elif isinstance(target, ast.Attribute):    # utils.add(...) or self.total()
                names.append(target.attr)
    return names
```

`node.func` في `ast.Call` إما `ast.Name` (استدعاء بسيط مثل `add(...)`) أو `ast.Attribute` (استدعاء بنقطة مثل `utils.add(...)` أو `self.total()`) — أخذ `.id` أو `.attr` على التوالي يعطيك الاسم القصير في كلتا الحالتين، لكن لاحظ أن `utils.add(...)` و`some_other_object.add(...)` كلاهما ينهار إلى نفس السلسلة، `"add"`. هذا قيد حقيقي، لا سهو، وهو بالضبط سبب أن مطابقة الخطوة التالية بـ*الاسم*، لا باليقين.

بمجرد إضافة كل دالة/فئة/مِيثُد في المستودع كعقدة (الخطوة 2)، يحل مرور ثانٍ كل استدعاء مُسجَّل مقابل أي عقدة تشارك ذلك الاسم القصير، ويضيف ضلعًا `"calls"`:

```python
# build_graph.py (excerpt -- Step 3, second pass over the whole graph)
def add_call_edges(graph, calls_by_function):
    by_short_name = {}
    for node, data in graph.nodes(data=True):
        if data.get("kind") in {"function", "method"}:
            by_short_name.setdefault(data["short_name"], []).append(node)

    for caller, called_names_list in calls_by_function.items():
        for name in called_names_list:
            for target in by_short_name.get(name, []):
                if target != caller:
                    graph.add_edge(caller, target, kind="calls")
```

بنية المرورين هذه — أولًا جمع كل تعريف، *ثم* حل الاستدعاءات مقابل المجموعة الكاملة — ضرورية لأن دالة مُعرَّفة قرب أعلى ملف قد تستدعي دالة مُعرَّفة قرب الأسفل؛ مرور واحد من الأعلى للأسفل سيفوّت المراجع الأمامية تمامًا.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>بعد تشغيل الأداة الكاملة على `sample_repo/` (من المثال المصاحب، أو ملفات اختبارك الخاصة)، يوجد ضلع `"calls"` واحد على الأقل بين دالتين في ملفين مختلفين.</StepChecklistItem>
<StepChecklistItem>يمكنك الإشارة إلى استدعاء محدد في كود اختبارك وإيجاد الضلع المطابق في الرسم البياني.</StepChecklistItem>
<StepChecklistItem>يمكنك أن تشرح لماذا يجب أن تعمل خطوة حل الاستدعاءات *بعد* مسح كل ملف، لا ملفًا بملف أثناء التقدم.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- فئتان غير مرتبطتين في مستودع اختبارك تُعرِّفان كلتاهما مِيثُدًا اسمه `run`. لو استدعت دالة ثالثة `some_object.run()`، هل ستضيف مطابقة الاسم في هذه الأداة ضلع `"calls"` إلى *كلا* مِيثُدي `run`، أم إلى الصحيح فقط؟ ماذا سيتطلب إصلاح ذلك — وهل يستحق التعقيد المُضاف لأداة تعليمية كهذه؟
- تتجنب `add_call_edges` إنشاء حلقة ذاتية (self-loop) (`if target != caller`). أي نمط Python حقيقي سيُنشئ حلقة ذاتية هنا لو أُزيل ذلك التحقق، وهل ستكون الحلقة الذاتية *خاطئة* فعليًا، أم فقط مُشوِّشة بصريًا في تصيير الخطوة 4؟

## الخطوة 4: تصوّر الرسم البياني

رسم بياني بضع مئات من العُقَد غير قابل للقراءة كقائمة أضلاع — تصوره هو ما يتيح لك فعليًا *رؤية* شكل قاعدة كود. تُغلِّف `pyvis` مخرجات `networkx` في صفحة HTML مستقلة وتفاعلية: اسحب العُقَد، كبِّر، مرِّر للتفاصيل، بلا خادم مطلوب بخلاف فتح الملف في متصفح.

```python
# build_graph.py (excerpt -- Step 4)
from pyvis.network import Network

COLORS = {"file": "#3b82f6", "module": "#9ca3af", "class": "#f59e0b", "function": "#10b981", "method": "#10b981"}


def visualize_pyvis(graph, output_path="graph.html"):
    net = Network(height="800px", width="100%", directed=True, notebook=False)
    net.barnes_hut()  # a physics layout that spaces nodes apart instead of overlapping

    for node, data in graph.nodes(data=True):
        kind = data.get("kind", "module")
        label = data.get("short_name", node)
        net.add_node(node, label=label, title=f"{kind}: {node}", color=COLORS.get(kind, "#9ca3af"))

    for source, target, data in graph.edges(data=True):
        net.add_edge(source, target, title=data.get("kind", ""))

    net.write_html(output_path)
```

```bash
uv run python build_graph.py
```

افتح `graph.html` الناتج في متصفح. العُقَد مُلوَّنة حسب النوع (ملفات زرقاء، فئات كهرمانية، دوال/مِيثُدات خضراء، وحدات خارجية رمادية)؛ تمرير الفأرة فوق أي عقدة أو ضلع يُظهر مُعرِّفها الكامل ونوع علاقتها في تلميح.

إذا فضّلت صورة ثابتة (للتضمين في مستند، أو لمستودع كبير جدًا بحيث لا تبقى التخطيطة التفاعلية مقروءة)، تغطي `matplotlib` ودوال الرسم الخاصة بـ`networkx` تلك الحالة أيضًا:

```python
# build_graph.py (excerpt -- Step 4, matplotlib alternative)
import matplotlib.pyplot as plt

def visualize_matplotlib(graph, output_path="graph.png"):
    fig, ax = plt.subplots(figsize=(12, 9))
    layout = nx.spring_layout(graph, seed=42, k=0.6)  # seed -> reproducible layout between runs
    node_colors = [COLORS.get(graph.nodes[n].get("kind", "module"), "#9ca3af") for n in graph.nodes]
    labels = {n: graph.nodes[n].get("short_name", n) for n in graph.nodes}
    nx.draw_networkx_nodes(graph, layout, node_color=node_colors, node_size=500, ax=ax)
    nx.draw_networkx_labels(graph, layout, labels=labels, font_size=7, ax=ax)
    nx.draw_networkx_edges(graph, layout, ax=ax, arrows=True)
    ax.axis("off")
    fig.tight_layout()
    fig.savefig(output_path, dpi=150)
```

:::tip[pyvis للاستكشاف، matplotlib لمشاركة عرض ثابت واحد]
تفاعلية `pyvis` (السحب، التكبير، التمرير) أفضل فعليًا *لاستكشاف* رسم بياني غير مألوف — يمكنك سحب مجموعة كثيفة لتفريقها لرؤية ما هو متصل فعليًا بماذا. صورة `matplotlib` الثابتة أفضل بمجرد أن تعرف بالفعل ما تريد إظهاره وتحتاج فقط صورة ثابتة وقابلة للتضمين — لقطة شاشة لصفحة `pyvis` لا تعكس تخطيطًا اخترته عمدًا. لا شيء منهما أفضل بشكل مطلق؛ كلاهما يحل لحظات مختلفة من نفس سير العمل.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يفتح `graph.html` في متصفح ويُظهر رسمًا بيانيًا حقيقيًا وغير فارغ — لا صفحة فارغة.</StepChecklistItem>
<StepChecklistItem>سحب عقدة يحرّكها، وتتبعها الأضلاع المتصلة.</StepChecklistItem>
<StepChecklistItem>تمرير الفأرة فوق عقدة يُظهر نوعها ومُعرِّفها الكامل في تلميح.</StepChecklistItem>
<StepChecklistItem>(إذا جربت نسخة matplotlib) يوجد `graph.png` ويُفتح كصورة حقيقية، بألوان عُقَد مميَّزة.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تُشغّل `net.barnes_hut()` محاكاة فيزيائية لترتيب العُقَد. ماذا تتوقع أن يحدث لفائدة تلك التخطيطة مع نمو الرسم البياني من 20 عقدة إلى 2000 — وهل ذلك قيد خاص بـ`pyvis` تحديدًا، أم قيد لـ*أي* خوارزمية تخطيط رسم بياني عامة على رسم بياني كبير ومتصل بكثافة؟
- تُمرِّر نسخة matplotlib `seed=42` إلى `spring_layout`. ماذا سيتغير في الصورة الناتجة، من تشغيل لآخر، لو أزلت البذرة (seed)؟ لماذا قد يهم تخطيط قابل للتكرار لو كنت تقارن نسختين من نفس الرسم البياني عبر الزمن (مثل "كيف تغيّرت بنية هذا المستودع بعد إعادة هيكلة")؟

## الخطوة 5: استعلم عن الرسم البياني

رسم بياني يمكنك فقط النظر إليه مفيد بالفعل، لكن رسمًا بيانيًا يمكنك *سؤاله* أكثر فائدة — وبما أن `networkx` يمنحك اجتيازًا حقيقيًا للرسم البياني، هذا حفنة من الأسطر، لا نظام جديد.

```python
# build_graph.py (excerpt -- Step 5)
def what_does_it_call(graph, short_name):
    """Every node matching short_name, and everything it calls."""
    results = []
    for node, data in graph.nodes(data=True):
        if data.get("short_name") == short_name or node == short_name:
            callees = [t for _, t, d in graph.out_edges(node, data=True) if d.get("kind") == "calls"]
            results.append((node, callees))
    return results


def who_imports(graph, module_name):
    """Every file with an 'imports' edge pointing at module_name."""
    if module_name not in graph:
        return []
    return [src for src, _, d in graph.in_edges(module_name, data=True) if d.get("kind") == "imports"]
```

```python
>>> what_does_it_call(graph, "total_with_tax")
[('models.py::Order.total_with_tax', ['utils.py::multiply', 'utils.py::add', 'models.py::Order.total'])]
>>> who_imports(graph, "utils")
['main.py', 'models.py']
```

`graph.out_edges(node, data=True)` و`graph.in_edges(node, data=True)` هما اتجاها "تتبع ضلع من هذه العقدة" — صادر لـ"ماذا يستدعي/يستورد هذا"، وارد لـ"ماذا يستدعي/يستورد هذا." هذه الاتجاهية هي بالضبط سبب بناء الخطوة 2 لـ`DiGraph` (موجَّه) بدلًا من `Graph` غير موجَّه: "A يستورد B" و"B يستورد A" ادعاءان مختلفان وقابلان للتحقق، وكان الرسم البياني غير الموجَّه سيتخلى عن ذلك التمييز.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>`what_does_it_call(graph, ...)` على دالة تعرف أنها تستدعي دالتين أخريين يُعيد كلتيهما، بالاسم.</StepChecklistItem>
<StepChecklistItem>`who_imports(graph, ...)` على وحدة تعرف أن ملفين يستورداها يُعيد اسمي الملفين.</StepChecklistItem>
<StepChecklistItem>الاستعلام عن اسم غير موجود في الرسم البياني يُعيد نتيجة فارغة، لا تعطلًا.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تُطابِق `what_does_it_call` على `short_name`، الذي — كما أثار سؤال الخطوة 3 السقراطي — يمكن أن يتصادم عبر فئات غير مرتبطة بمِيثُد له نفس الاسم. اكتب استعلامًا يأخذ بدلًا من ذلك مُعرِّف عقدة *مؤهَّلًا بالكامل* (مثل `"models.py::Order.total_with_tax"`) مباشرة. ما المقايضة بين أسلوبي الاستعلام — أحدهما أسهل للكتابة، والآخر لا لبس فيه؟
- هل يمكنك كتابة `what_calls_it(graph, short_name)` — عكس `what_does_it_call` — باستخدام `in_edges` بدلًا من `out_edges`؟ ماذا سيخبرك ذلك بما لا يستطيع `what_does_it_call` إخبارك به؟

## الخطوة 6: شغّله من البداية للنهاية مقابل مستودع حقيقي

كل شيء حتى الآن كان يبني نحو شيء واحد: توجيه الأداة المكتملة إلى قاعدة كود لم يبنها أحد خصيصًا لهذا الدرس، ورؤية ما ينتج. سكربت المثال المصاحب في [`examples/codebase-knowledge-graph/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/codebase-knowledge-graph) يربط كل شيء من الخطوات 1–5 في `build_graph.py` قابل للتشغيل، بالإضافة إلى `sample_repo/` صغير من ملفات تجريبية بعلاقات استيراد/استدعاء متعمَّدة لتجربتها أولًا:

```bash
uv run python build_graph.py sample_repo --html graph.html --calls total_with_tax --imports utils
```

بمجرد أن يعمل ذلك، وجّهه إلى شيء حقيقي — **مستودع هذه الدورة نفسه قاعدة كود Python حقيقية وغير تافهة جالسة بالفعل على قرصك لو استنسخته**، أو استخدم أي مستودع محلي آخر لديك:

```bash
uv run python build_graph.py /path/to/python-data-analysis-course/examples --html course_graph.html
```

افتح HTML الناتج وانظر إليه فعليًا: أي الملفات تستورد أكثر الوحدات الأخرى؟ أي دالة لديها أكثر أضلاع "calls" واردة (مؤشر جيد على "كود أساسي، مُستخدَم على نطاق واسع")؟ هل يطابق الشكل ما كنت تعرفه بالفعل عن كيفية ترابط قاعدة الكود، أم يكشف اتصالًا لم تكن تعرف وجوده؟

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>تعمل الأداة مقابل مستودع حقيقي متعدد الملفات (لا `sample_repo/` التجريبي فقط) دون تعطل.</StepChecklistItem>
<StepChecklistItem>الرسم البياني الناتج لديه عُقَد وأضلاع أكثر بوضوح من المثال التجريبي، والتصور لا يزال يُصيَّر.</StepChecklistItem>
<StepChecklistItem>يمكنك تسمية شيء واحد أظهره لك الرسم البياني عن بنية تلك قاعدة الكود لم تكن تعرفه مسبقًا.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- اختر العقدة ذات أكثر أضلاع "calls" واردة في رسم مستودعك الحقيقي البياني. هل تشعر تلك العقدة فعليًا كأنها كود "أساسي" عندما تفتح الملف الحقيقي وتقرأه؟ ما الذي قد يجعل عقدة تملك أضلاعًا واردة كثيرة *دون* أن تكون مهمة بشكل خاص فعليًا؟
- لو شغّلت هذه الأداة مقابل نفس المستودع مجددًا بعد شهر من الآن، بعد تطوير حقيقي حدث في الأثناء، ماذا سيخبرك فرق بين الرسمين البيانيين فعليًا لا يخبرك به `git diff` بسيط؟

## ⚠️ مآزق شائعة

- **فشل `ast.parse` على ملف واحد يجب ألا يقتل المسح بأكمله.** ملف واحد بخطأ صيغة، أو ملف غير Python بامتداد `.py`، أو كود Python 2 قديم متبقٍّ في مستودع سيرفع `SyntaxError`. التقطه، تخطَّ ذلك الملف بتحذير، واستمر — `try`/`except` من الخطوة 1 موجود تحديدًا كي لا ينهي ملف سيء واحد من ألفين التشغيل.
- **لا يستطيع التحليل الساكن رؤية الاستيرادات أو الاستدعاءات الديناميكية.** `importlib.import_module("some_module")`، أو `__import__(name)`، أو استدعاء مبني من متغيّر (`getattr(obj, method_name)()`) لا تظهر كعقدة `ast.Import`/`ast.Call` باسم حرفي بالطريقة التي تظهر بها `import os` أو `add(1, 2)` — هذه الأداة، كأي محلِّل ساكن بحت، ببساطة لن ترى تلك الأضلاع. هذا قيد حقيقي ودائم، لا خطأ لإصلاحه؛ سيحتاج تحليل ديناميكي كامل *تشغيل* الكود فعليًا وتتبّع ما يحدث، وهو نوع مختلف (وأثقل بكثير) من الأدوات.
- **حل الاستدعاءات القائم على الاسم يُنتج إيجابيات كاذبة.** تُطابِق `add_call_edges` من الخطوة 3 الاستدعاءات بالاسم القصير فقط، لذا فئتان غير مرتبطتين تُعرِّف كل منهما مِيثُدًا `run` ستحصلان كلتاهما على ضلع من أي استدعاء يبدو كـ`something.run()`، حتى لو كانت واحدة فقط منهما المقصودة فعليًا. هذه مقايضة مشروعة لمشروع تعليمي — يحتاج حل الاستدعاءات الكامل استدلال أنواع حقيقيًا، وهو ما يفعله خادم لغة أو أداة مثل `pyright` داخليًا.
- **الرسوم البيانية على مستودع كبير تصبح كثيفة جدًا للقراءة بصريًا.** بضع مئات من الملفات باستيرادات متقاطعة ثقيلة تحوّل تخطيط `pyvis` الموجَّه بالقوى إلى تشابك غير قابل للقراءة — التخطيطات المبنية على الفيزياء تفصل العُقَد، لكنها لا تقلل عدد الأضلاع. صفِّ قبل التصور: اختر مجلدًا فرعيًا واحدًا، أو جوار ملف واحد (استيراداته/مستدعوه المباشرون فقط)، أو استخدم دوال الاستعلام من الخطوة 5 للإجابة عن سؤال محدد بدلًا من محاولة تصيير الرسم البياني بأكمله دفعة واحدة.

## ما بنيته للتو

أداة تقرأ كود Python المصدري الحقيقي بنفس الطريقة التي يحلله بها المُفسِّر نفسه، وتحوّل علاقات الملف/الدالة/الفئة/الاستيراد/الاستدعاء إلى بنية بيانات رسم بياني صادقة، وتتيح لك كلًّا من *رؤية* تلك البنية (تفاعليًا، بـ`pyvis`) و*استعلامها* (برمجيًا، باجتياز `networkx`) — كل ذلك دون استدعاء شبكة واحد. نفس الشكل ثلاثي الخطوات — التحليل بـ`ast`، بناء رسم بياني بـ`networkx`، استعلامه أو تصوره — يتوسع من `sample_repo/` التجريبي إلى قاعدة كود حقيقية متعددة آلاف الملفات؛ لم يُبسَّط أي شيء في النهج إلى شيء يتوقف عن العمل على نطاق أوسع، فقط *قابلية قراءة* تصور كامل هي التي تتوقف.

## إلى أين تذهب من هنا

- أضف نوع ضلع جديدًا: "يرث من،" بقراءة قائمة `bases` الخاصة بتعريف فئة (`ast.ClassDef.bases`) — إضافة مفيدة فعليًا لفهم بنية قاعدة كود موجَّهة للكائنات لم يغطها هذا الدرس.
- احسب مقاييس رسم بياني حقيقية بخوارزميات `networkx` المدمجة بدلًا من تقدير التصور بالعين — `nx.pagerank` أو مركزية درجة الدخول لإيجاد أكثر دوال قاعدة الكود "مركزية"، أو `nx.weakly_connected_components` لإيجاد مجموعات كود معزولة لا يمسها شيء آخر.
- جرّب `nx.readwrite.json_graph.node_link_data` لتصدير الرسم البياني كـJSON، لكي تستطيع أداة منفصلة (أو واجهة أمامية على الويب، إذا كنت مرتاحًا مع واحدة) استهلاكه دون الحاجة لتثبيت `networkx` على الإطلاق.
- قارن رسمين بيانيين من نقطتين مختلفتين في تاريخ git لمستودع (`git worktree` أو نسختان عند التزامين مختلفين) لترى، بنيويًا، كيف غيّرت إعادة هيكلة فعليًا شكل قاعدة الكود — لا فقط أي الأسطر تغيّرت، بل أي العلاقات ظهرت أو اختفت.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓

<ProjectProgressCheckbox projectId="codebase-knowledge-graph" />
