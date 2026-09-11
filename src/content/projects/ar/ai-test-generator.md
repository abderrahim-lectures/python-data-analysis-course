---
title: "مولد الاختبارات بالذكاء الاصطناعي"
description: "توليد اختبارات وحدات وحالات حدود واختبارات مبنية على الخصائص تلقائياً من الكود المصدري."
difficulty: "intermediate"
estimatedMinutes: 90
xpReward: 100
tags: ["Developer Tools", "Testing", "LLMs"]
prerequisites:
  - "الدوال، القيم الافتراضية/الوسائط، وفهم القوائم"
  - "نموذج ذهني أساسي لماهية اختبار الوحدة (assert + ناتج متوقع)"
  - "لا حاجة لخبرة pytest — المولّد يكتب الاختبارات لك"
learningObjectives:
  - "قراءة توقيع دالة وبيانات معاملاتها بـ inspect.signature"
  - "اشتقاق مدخلات اختبار قيم-حدّية من القيم الافتراضية للمعاملات بدل التخمين اليدوي"
  - "تركيب وحدة pytest برمجيًا من تلك المدخلات زائد فحوصات الخصائص"
  - "تأليف مطالبة LLM لـ«اختبار القصد» والتقهقر بأدب عندما لا يوجد مفتاح API"
  - "تشغيل المجموعة المولّدة كعملية فرعية وتحويل كود خروجها إلى حكم"
---

# 🛠️ 🧪 مولد الاختبارات بالذكاء الاصطناعي

كتابة الاختبارات يدويًا تبدو كإعادة كتابة الدالة التي كتبتها للتو, لكن أبطأ. يبني هذا المشروع العكس: مولّدًا *يقرأ* دالة هدف — توقيعها, وقيمها الافتراضية, وسلوكها — وينتج مجموعة pytest تختبر حدودًا حقيقية, وخصائص حقيقية (كخاصية idempotence), وشبكة أمان لتبديل الوسائط. طبقة LLM اختيارية تصوغ «اختبارات القصد» التي تلتقط ما يفترض أن تفعله الدالة *أصلًا*, وتُشغَّل المجموعة كلها كعملية فرعية فيُبلّغ أداتك الحكم في سطر واحد. الدالة الهدف `clamp` مصغّرة, فتُفحَص كل اختبار مولّد بالعين بسهولة — الآلية لا الرياضيات هي المقصودة.

هذا يفترض إتقان القيم الافتراضية للدوال وفهمًا سليمًا لفهم القائمة; لا شيء هنا مُقيَّم؛ هذا المشروع اختياري وغير مُقيَّم — راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. فحص توقيع دالة واكتشاف أي المعاملات لها قيم افتراضية وأيها لا.
2. توليد مدخلات مرشحة حدّية من تلك القيم الافتراضية — لا من التخمين.
3. تحويل تلك المرشحات إلى وحدة pytest حقيقية, بما فيها اختبارات الخصائص والحراس.
4. صياغة مطالبة LLM لـ«اختبار القصد» وتخطي استدعاء الواجهة البرمجية بأدب حين لا يوجد مفتاح مضبوط.
5. تشغيل المجموعة المولّدة عبر subprocess وترجمة الناتج إلى حكم.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الموصى به — جوهر الأمر توليد ملفات اختبار `.py` حقيقية على قرصك وتشغيلها, و`uv add pytest` يجعل ذلك فوريًا.

**Google Colab وKaggle Notebooks وBinder** ستشغّل كل خطوة: `!pip install pytest` ثم `import pytest` — يكتب المولّد ملف `test_*.py` في مجلد عمل الدفتر, وتشغّله عملية `subprocess` في البيئة نفسها. الدفاتر مكان مناسب; الشيء الوحيد الذي لا تستطيع منحك إياه هو `test_clamp_simple.py` دائمًا بعد انتهاء الجلسة.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-test-generator/notebook.ar.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-test-generator/notebook.ar.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fai-test-generator%2Fnotebook.ar.ipynb)

## الإعداد

كل ما يلزم قبل التوليد: مشروع بـ pytest, ودالة هدف بسيطة ساحرة لتوجيه المولّد إليها.

### أعِدَّ المشروع

```bash
uv init ai-test-generator
cd ai-test-generator
uv add pytest
```

`pytest` تشغّل المجموعة المولّدة *و* مشغّل قوائم الحالات الساذج في الخطوة 5. تفترض الخطوات اللاحقة أنك تكتب كل الكود في ملف واحد, `testgen.py`.

**✅ قائمة التحقق**

- ✅ يكتمل `uv add pytest`, ويطبع `uv run python -m pytest --version` رقم إصدار.
- ✅ لديك ملف `testgen.py` منشأ وجاهز للخطوة 1.

**🤔 سؤال (أسئلة) سقراطي(ة) :**

- يستهدف المولّد `clamp`, دالة بمعاملات افتراضية. أي جزء من `inspect.signature` يخبرك أن معاملًا *يتطلب* وسيطة, ولماذا سيحتاج المولّد لمعاملة هذين النوعين من المعاملات بشكل مختلف؟
- كل اختبار يكتبه المولّد *يُنفَّذ* في النهاية, لكن عبر مقارنة السلوك بقيمة متوقعة ولّدها هو. أين تصبح «الآلة تختبر الآلة» دائرية, وأي نوع من الاختبارات لا يمكن تزييفه هكذا؟

## الخطوة 1: اقرأ توقيع الهدف

### 1.1 عرّف الهدف وأفرغ توقيعه

**👟 تلميح البداية :**

اكتب `clamp(value, low=0.0, high=1.0)` — الحارس العددي الكلاسيكي — ثم اسأل `inspect.signature` عما يعرفه.

```python
# testgen.py
import inspect

def clamp(value, low=0.0, high=1.0):
    """Clamp a number into [low, high]."""
    return max(low, min(value, high))

sig = inspect.signature(clamp)
for name, param in sig.parameters.items():
    print(name, "kind=", param.kind, "default=", param.default)
```

تعيد `clamp` `max(low, min(value, high))` — سطر واحد لكنه كثيف: يثبّت `value` من الأسفل عند `low` ومن الأعلى عند `high`. يُعيد `inspect.signature` كائن `Signature` يطابق فيه `.parameters` كل اسم وسيطة بكائن `Parameter` يحمل `.kind` (كيفية تمريرها) و`.default`.

**🎯 الناتج المتوقع :**

```
value kind= POSITIONAL_OR_KEYWORD default= <class 'inspect._empty'>
low kind= POSITIONAL_OR_KEYWORD default= 0.0
high kind= POSITIONAL_OR_KEYWORD default= 1.0
```

**🩹 إذا لم يعمل :**

إن كانت `sig.parameters` فارغة, فحلقة `for` تقرأ كائنًا قابلاً للاستدعاء خاطئًا — اطبع `sig` وتحقق أنه يقول `(value, low=0.0, high=1.0)`. إن طبع `default=` لا شيء لـ`low`, فعرّفت `clamp` بلا قيم افتراضية.

### 1.2 رصد أي القيم الافتراضية حقيقية

**👟 تلميح البداية :**

اكتب مسندًا صغيرًا `has_default(param)` — `inspect.Parameter.empty` *علامة* (marker), فاختبار `is` هو التهجئة الصحيحة.

```python
# testgen.py (continued)
def has_default(param: inspect.Parameter) -> bool:
    return param.default is not inspect.Parameter.empty

for name, param in sig.parameters.items():
    print(name, "requires argument:", not has_default(param))
```

استخدام `is`/`is not` مع المفردات (singletons) في Python هو المقارنة الأصيلة — `Parameter.empty` كائن حارس (sentinel), و`==` قد تخدعها أي شيء صادفته تسميته مطابقًا. يحتاج المولّد لهذا التمييز كي يعرف أن لـ`low`/`high` قيم بذرية قابلة للاستخدام بينما `value` يحتاج تخمينات بأسلوب بشري.

**🎯 الناتج المتوقع :**

`value requires argument: True`, ثم `False` لكل من `low` و`high`.

**🩹 إذا لم يعمل :**

إن أبلغ `low` عن `requires argument: True`, فقارنت بـ`==` أو بـ`is` إلى كائن `inspect.Parameter.empty` *جديد* — استخدم `param.default is not inspect.Parameter.empty` حرفيًا.

### 1.3 تحقّق من الفحص

**✅ قائمة التحقق**

- ✅ الأسماء الثلاثة وأنواعها (kinds) وقيمها الافتراضية تُطبع تمامًا كما في 1.1.
- ✅ يميّز `has_default` بين `value` و`low`/`high` بشكل صحيح.
- ✅ `sig.parameters["low"].default` هي `0.0` (عائم, لا سلسلة).

**🤔 سؤال (أسئلة) سقراطي(ة) :**

- تُحسب `sig` مرة واحدة ويُعاد استخدامها في كل مكان. ما الذي ينكسر إن كُتبت الاختبارات المولّدة ضد نسخة *لاحقة* معدّلة من `clamp` — ولماذا إعادة التوليد من التوقيع الحي أأمن من تخزينه مؤقتًا؟
- القيم الافتراضية للمعاملات كائنات Python, لذا `clamp(value, low=0, high=1)` (أعداد صحيحة) تعطي `0`/`1`, لا `0.0`/`1.0`. أي سطر اختبار مولّد سيختلف بصمت, وهل هو اختلاف اختبار أم اختلاف نوع؟

## الخطوة 2: ولّد مدخلات حواف من القيم الافتراضية

كتابة مدخلات الاختبار يدويًا تعني اختبار ما *تخيلت* أنه خطر. بدلًا من ذلك يشتق هذا المولّد المرشحات من التوقيع نفسه: كل قيمة افتراضية, مدفوعة فوق وتحتها, زائد الحافتين العدديتين المتعارف عليهما.

### 2.1 ابنِ مساعد قيم الحواف

**👟 تلميح البداية :**

لمعامل بافتراضي, أنتج `[default-1, default-0.1, default, default+0.1, default+1]` زائد `0.0` و`1.0`, دون تكرار; ولمعامل بلا افتراضي, ناوله مجموعة المسابر الكلاسيكية `[-1.0, 0.0, 0.5, 1.0]`.

```python
# testgen.py (continued)
def edge_values(param: inspect.Parameter) -> list[float]:
    if not has_default(param):
        return [-1.0, 0.0, 0.5, 1.0]
    d = param.default
    probes = {d - 1.0, d - 0.1, d, d + 0.1, d + 1.0, 0.0, 1.0}
    return sorted(round(x, 2) for x in probes)

for name, param in sig.parameters.items():
    print(name, "->", edge_values(param))
```

المسابر هي *مفردات الحدود* للدوال العددية: خطوة فوق الحد وتحته, الحد نفسه, والمرساتان `0.0`/`1.0`. `round(x, 2)` هو فحص الواقع — النقطة العائمة الثنائية تجعل `0.1` قبيحًا فعليًا (مثل `0.10000000000000003`), ويجب أن تقارن الاختبارات المولّدة ثوابت عشرية نظيفة.

**🎯 الناتج المتوقع :**

```
value -> [-1.0, 0.0, 0.5, 1.0]
low -> [-1.0, -0.1, 0.0, 0.1, 1.0]
high -> [0.0, 0.9, 1.0, 1.1, 2.0]
```

**🩹 إذا لم يعمل :**

إن أظهر صف `0.10000000000000003` بدلًا من `0.1`, فـ`round` أُسقط. إن أظهر `value` عوامات مبنية من `d` (ولا `d` له), فـ`has_default` أعادت `True` لمعامل بلا افتراضي — انعكست مقارنة الحارس.

### 2.2 اشرح الخيارات قبل التشغيل

**👟 تلميح البداية :**

اطبع *سبب* اختيار كل مرشح — اختبار مولّد بلا قصة مجرد ضجيج.

```python
# testgen.py (continued)
for name, param in sig.parameters.items():
    values = edge_values(param)
    note = "handpicked probe set" if not has_default(param) else "nudged around the default"
    print(f"{name}: {values} ({note})")
```

تعليق سبب صريح على كل مرشح يجعل المولّد قابلًا للتدقيق: حين يسأل مراجع مستقبلي «لماذا تختبر `1.1`؟», يجيب الملاحظ «خطوة فوق افتراضي `high`». هذه القابلية للتدقيق هي الفرق بين اختبارات مولّدة و*عرّاف اختبار* (test oracle).

**🎯 الناتج المتوقع :**

سطران لـ`low`/`high` يقولان `nudged around the default`, وسطر واحد لـ`value` يقول `handpicked probe set`.

**🩹 إذا لم يعمل :**

إن قال كل سطر «handpicked», ففرع `has_default` خاطئ. إن قال سطر لـ`value` «nudged around the default», فافتراضي `value` فارغ بصمت مجددًا.

### 2.3 تحقّق من المدخلات

**✅ قائمة التحقق**

- ✅ `edge_values` حتمية — نفس الاستدعاء, نفس القائمة, بأي ترتيب استدعاء.
- ✅ لا عوامات مكررة في قائمة المرشحات, وكل قيمة `round` إلى منزلتين عشريتين.
- ✅ كل مرشح يُرجَع إلى سبب (مجموعة مسابر أو دفع حواف من الافتراضي).

**🤔 سؤال (أسئلة) سقراطي(ة) :**

- يفترض `edge_values` معاملات عددية. ماذا تعيد الدالة نفسها لمعامل افتراضيُّه `"hello"` — وكيف تمد المساعد كي يستطيع استدعاء لاحق تمرير مجموعة مسابر *نصية*؟
- اثنان من المرشحين المولّدين (كـ`-1.0` و`1.0`) سيختبران سلوكًا مطابقًا *لبعض* الدوال. ماذا يحتاج مُفكّك الانتظام الذكي أن يعرفه أكثر مما يرى `edge_values` حاليًا؟

## الخطوة 3: صيّر وحدة pytest

الآن يصبح المرشحون Python: ملف `test_clamp_simple.py` حقيقي, كل اختبار فيه دالة `test_*` تستورد `clamp` وتؤكد توقعًا مولّدًا.

### 3.1 ألّف كود المصدر كسلاسل

**👟 تلميح البداية :**

حوّل كل مرشح `value` إلى `def test_<name>():` يؤكد `clamp(v) == max(low, min(v, high))`, مستخدمًا القيم الافتراضية العائمة الحقيقية للتوقيع كقالب للقيمة المتوقعة.

```python
# testgen.py (continued)
def render_case(value: float) -> str:
    name = str(value).replace(".", "p").replace("-", "neg")
    low, high = sig.parameters["low"].default, sig.parameters["high"].default
    return (f"def test_value_at_{name}():\n"
            f"    assert clamp({value}) == max({low}, min({value}, {high}))\n")

parts = ["from testgen import clamp", ""]
for v in edge_values(sig.parameters["value"]):
    parts.append(render_case(v))
print(render_case(0.5))
```

التعبير عن القيمة المتوقعة *مبني من نفس القيم الافتراضية التي يحملها التوقيع* — أفضل من `== clamp(v)`, الذي يختبر دالة ضد نفسها ولا يثبت شيئًا. التحويل الاسمي `0.5 → value_at_0p5` يطابق العوامات إلى معرفات صالحة مقروءة; `-1.0 → value_at_neg1p0`.

**🎯 الناتج المتوقع :**

```
def test_value_at_0p5():
    assert clamp(0.5) == max(0.0, min(0.5, 1.0))
```

**🩹 إذا لم يعمل :**

إن كانت الإزاحة (indentation) خاطئة, ففواصل الأسطر `\n` في f-string تفتقد المسافات الأربع. إن احتوى الاسم `.` خامًا, فـ`.replace(".", "p")` أُسقط, وسيرفض pytest المعرف.

### 3.2 أضف اختبارات الخاصية والحارس

**👟 تلميح البداية :**

ألحق اختبارين مكتوبين يدويًا *يعبران عن القصد*, لا عن الحساب — الاستقرارية (idempotence: تطبيق `clamp` مرتين لا يغير شيئًا) وحارس الحدود المبدلة.

```python
# testgen.py (continued)
parts.append("def test_idempotent():")
parts.append("    for v in " + str(edge_values(sig.parameters["value"])) + ":")
parts.append("        assert clamp(clamp(v)) == clamp(v)")
parts.append("")
parts.append("def test_swapped_bounds_guard():")
parts.append("    assert clamp(0.25, 0.5, 0.0) == 0.5")
open("test_clamp_simple.py", "w").write("\n".join(parts) + "\n")
print("wrote test_clamp_simple.py with", sum(1 for line in parts if line.startswith("def test_")), "tests")
```

الاستقرارية *خاصية* — تصمد لكل مدخل دون الحاجة لقيمة متوقعة محسوبة يدويًا, وهي فئة الاختبارات التي تكشف حدًا مكسورًا دون أن تكون قد توقعت النتيجة مسبقًا. `clamp(0.25, 0.5, 0.0)` يوثّق ما يحدث حين يمرر المتصل `low > high`: يفوز `max`, والنتيجة `low` حرفًا بحرف — قرار تتخذه الدالة بصمت, فيعلنه الاختبار بصخب.

**🎯 الناتج المتوقع :**

`wrote test_clamp_simple.py with 6 tests` — أربعة تحويلات حد-قيمة زائد اختباري الخاصية والحارس.

**🩹 إذا لم يعمل :**

إن كان العدد 4, فخطّا `def test_...` الملحقان كُتبا بلا بادئة `def test_` أو لم يُلحقا قط. إن احتوى الملف اختبارًا واحدًا فقط, فدمج `"\n".join(parts)` قائمة عنصر واحد — انسَ `.append` داخل الحلقة فتحصل على آخر حالة فقط.

### 3.3 تحقّق من التحويل

**✅ قائمة التحقق**

- ✅ يُفتح `test_clamp_simple.py` ويُفسَّر كـPython (بلا أخطاء صياغة في الأسماء المولّدة).
- ✅ يحوي بالضبط 6 دوال `test_*`, تستورد `clamp` من `testgen`.
- ✅ التعبيرات المتوقعة تشير إلى `max(0.0, min(v, 1.0))`, لا إلى نسخة من جسم `clamp`.

**🤔 سؤال (أسئلة) سقراطي(ة) :**

- اختبار مُصيَّر كـ`assert clamp(v) == max(0.0, min(v, 1.0))` يعيد ترميز صيغة `clamp` — يفشل فقط إن اختلف *الهجاءان*. ماذا يتحقق اختبار الاستقرارية مما سيمرره الحشو الدائري هذا بسعادة؟
- يلصق المولّد `.replace` على كل عائم, لكن `-0.0` تتنسق كـ`"-0.0"` → `neg0p0`. لماذا هذا غير ضار *الآن* ودليل على أن توليد المعرفات يستحق عدّاد `CASE_INDEX` بدلًا من ذلك؟

## الخطوة 4: اطلب من LLM اختبارات القصد (اختياري)

اختبارات الحدود تفحص الرياضيات; اختبارات القصد تفحص *المعنى*. تؤلف هذه الخطوة مطالبة حتمية تسأل LLM عما يفترض أن تفعله الدالة — والجزء الصادق: تتقهقر إلى ملف محفوظ حين لا يوجد مفتاح API مضبوط.

### 4.1 ألّف المطالبة من التوقيع الحي

**👟 تلميح البداية :**

ابنِ مطالبة بفقرة واحدة تدمج سلسلة التوقيع الحقيقية, واطلب دوال pytest قابلة للتشغيل — لا شيء بعد ذلك.

```python
# testgen.py (continued)
def build_prompt(target: str, signature: inspect.Signature) -> str:
    return (
        f"You are reviewing a pure Python function `{target}{signature}`. "
        "List the three most important test cases that would catch a real regression. "
        "Answer as runnable pytest functions named test_* inside a fenced code block, nothing else."
    )

prompt = build_prompt("clamp", sig)
print(prompt[:90], "...")
```

إرسال *التوقيع نفسه* (`clamp(value, low=0.0, high=1.0)`) هو الحيلة كلها — يحصل النموذج على العقد في سطر واحد, فيُرسى «القصد» الذي يكتبه على أسماء معاملات حقيقية تستطيع الاختبارات المولّدة استيرادها. اللاحقة الحتمية («three most important...nothing else») تُبقي المطالبة قابلة لإعادة الإنتاج والجواب محدود الصيغة.

**🎯 الناتج المتوقع :**

سطر واحد يبدأ `You are reviewing a pure Python function \`clamp(value, low=0.0, high=1.0)\`. List the three most important...` — بنقطة وسلاسل `...` من شريحة الطباعة.

**🩹 إذا لم يعمل :**

إن دمجت المطالبة توقيعًا قديمًا, فاستُدعيت `build_prompt` بـ`sig` مؤقت من قبل تحرير — مرّر `inspect.signature(clamp)` طازجًا دائمًا. إن فُقدت جملة صيغة الإجابة, أعد إضافة كسر `...nothing else.` في f-string.

### 4.2 تقهقر بأدب دون مفتاح API

**👟 تلميح البداية :**

افحص `OPENAI_API_KEY` (متغير بيئة) ثم `getpass` (تفاعلي), وعندما لا يوفّر أيٌّ منهما مفتاحًا, احفظ المطالبة للاستخدام اليدوي بدلًا من الفشل.

```python
# testgen.py (continued)
def maybe_ask_llm(prompt_text: str) -> None:
    import getpass, os
    key = os.environ.get("OPENAI_API_KEY") or getpass.getpass("OpenAI key (blank to skip): ")
    if not key:
        with open("llm_prompt.txt", "w") as f:
            f.write(prompt_text)
        print("no key: prompt saved to llm_prompt.txt")
        return
    print("key present — an API call would go here, replacing this line")

maybe_ask_llm(prompt)
```

سلسلة `or` تربط المصدرين كي يستطيع عمل بلا رأس ضبط `OPENAI_API_KEY` ويستطيع مستخدم طرفية كتابته — وفحص السلسلة الفارغة هو ما يجعل الأمر كله *اختياريًا افتراضيًا*. حفظ `llm_prompt.txt` يعني أن خطوة LLM ليست عائقًا أبدًا: الصقها في أي نموذج لاحقًا.

**🎯 الناتج المتوقع :**

`no key: prompt saved to llm_prompt.txt` (التشغيل الأول, بلا مفتاح مضبوط).

**🩹 إذا لم يعمل :**

إن ثارت `GetPassWarning`, فالطرفية لا تستطيع المطالبة تفاعليًا (CI/دفتر) — هذا مهمة *مسار متغير البيئة*; اضبط `OPENAI_API_KEY` وأعد التشغيل. إن طبع `key present`, فتسرّب مفتاح إلى البيئة — ملف المسار يُحفظ مع ذلك, لكن سطر استدعاء API كعب مقصود هنا.

### 4.3 تحقّق من طبقة المطالبة

**✅ قائمة التحقق**

- ✅ تدمج `build_prompt` *التوقيع الحي* وتقيّد صيغة الإجابة.
- ✅ بلا مفتاح, يوجد `llm_prompt.txt` ويطابق سطره الأول المطالبة المطبوعة.
- ✅ المسار الاختياري لا يلقي استثناءً قط حين لا يوجد مفتاح مضبوط.

**🤔 سؤال (أسئلة) سقراطي(ة) :**

- تطلب المطالبة من LLM ثلاث حالات *لكنها لا تنفّذ قط ما تعيده*. ما أخطر شيء في التنفيذ التلقائي لاختبارات كتبها نموذج, يتفاداه مسار «احفظ ملفًا ثم الصقه يدويًا» مجانًا؟
- يُخفي `getpass` ضربات المفاتيح لكن المفتاح ما زال يعيش في العملية. لماذا تمرير المفتاح عبر متغير بيئة *أفضل* من كتابته — ولأي فئة من الدوال تُصرّ على ألّا يرى النموذج المصدر إطلاقًا؟

## الخطوة 5: شغّل المجموعة واعرض الحكم

الاختبارات توجد لتُنفَّذ. تشغّل هذه الخطوة ملف `test_clamp_simple.py` المولّد بـpytest كعملية فرعية, وتقرأ كود الخروج, وتطبع الحكم الذي يدور حوله المشروع كله.

### 5.1 شغّل pytest من عمليتك

**👟 تلميح البداية :**

استخدم `sys.executable -m pytest` — لا سلسلة `pytest` العارية — كي يستخدم subprocess *نفس* المفسّر الذي يستدعي منه مشروعك المولّد.

```python
# testgen.py (continued)
import subprocess, sys

def run_suite(path: str = "test_clamp_simple.py") -> int:
    result = subprocess.run(
        [sys.executable, "-m", "pytest", path, "-q"],
        capture_output=True, text=True, timeout=60,
    )
    print(result.stdout.strip().splitlines()[-1])
    return result.returncode

code = run_suite()
print("all green!" if code == 0 else "something failed — inspect and regenerate")
```

`sys.executable` عنوان Python الذي يشغّل *سكربتك*, فيلقي الولد العملية نفس البيئة ونفس مواقع الحزم; استدعاء `pytest` صدفي عارٍ قد يشغّل صامتًا مفسرًا مختلفًا و`clamp` مختلفة. `returncode` بوابة خروج pytest: `0` تعني أن كل اختبار نجح, وأي قيمة أخرى فشل أو خطأ تجميع.

**🎯 الناتج المتوقع :**

```
6 passed in 0.01s
all green!
```

**🩹 إذا لم يعمل :**

إن كان السطر الأخير `ERROR ... no tests ran`, فعجز pytest عن استيراد `testgen` — شغّل من المجلد الحامل للملفين (أو أضف `PYTHONPATH=.`). إن قال `1 failed`, فلا يطابق التعبير المتوقع لاختبار مُصيَّر سلوك `clamp` — اقرأ التأكيد الفاشل وصحّح القالب, لا الدالة.

### 5.2 أدخل انحدارًا حقيقيًا وراقب انقلاب الحكم

**👟 تلميح البداية :**

استبدل مؤقتًا `testgen.py` بـ`clamp` معطوبة *عن قصد* (تنسى تثبيت الحد الأدنى), وأعد تشغيل المجموعة نفسها, ثم استعد الملف الأصلي.

```python
# testgen.py (continued)
save = open("testgen.py").read()
open("testgen.py", "w").write(
    "def clamp(value, low=0.0, high=1.0):\n"
    "    return min(value, high)  # deliberately forgot the low clamp\n"
)
code = run_suite()
open("testgen.py", "w").write(save)   # restore the real function
print("caught the regression!" if code != 0 else "suite passed?!")
```

عملية pytest الوليدة تستورد `clamp` *من القرص*, فكسر الملف هو الطريق الوحيد للوصول إليها — والاستعادة من السلسلة المحفوظة بعدها تُبقي مولدك سليمًا. لأن الاختبارات الستة اشتقت من حدود حقيقية, نسيان التثبيت السفلي يكشف بالضبط المسابر التي تهتم بالجانب السفلي: حالة الحافة `-1.0` وحارس الحدود المبدلة كلاهما يؤكد ضد `max(0.0, ...)`, وكلاهما يحمّر بصفر تعديل في ملف الاختبار.

**🎯 الناتج المتوقع :**

`2 failed, 4 passed in 0.02s` مع الاسمين الفاشلين `test_value_range_neg1p0` و`test_swapped_bounds_guard`, ثم `caught the regression!`.

**🩹 إذا لم يعمل :**

إن بقيت المجموعة خضراء, فالسلسلة «المعطوبة» ليست معطوبة فعلًا — يجب أن يكون `min(value, high)` الجسم كله (بلا `max`, بلا استخدام `low`). إن ظل pytest ناجحًا بعد الكتابة, فـ`open(..., "w")` ركض في مجلد مختلف عن `test_clamp_simple.py` — اكتب إلى نفس المجلد المطلق.

### 5.3 تحقّق من الحكم

**✅ قائمة التحقق**

- ✅ تشغيل نظيف: `6 passed` و`all green!/code == 0`.
- ✅ تشغيل انحدار: فشل واحد على الأقل وكود خروج غير صفري, بصفر تعديلات في ملف الاختبار.
- ✅ يشغّل الاثنان `sys.executable -m pytest` كي يرى الاختبار `clamp` الحقيقية.

**🤔 سؤال (أسئلة) سقراطي(ة) :**

- «نسيت» `clamp` المعطوبة التثبيت الأدنى, ومع ذلك يمر كلٌّ من اختبار الاستقرارية ومسابر المدى `0.0`/`0.5`/`1.0` — فقط مسبار `-1.0` وحارس الحدود المبدلة التقطاه. أي *نوعين* من الاختبارات كانا إلزاميين هنا, وماذا يخبرك ذلك عن قيمة مسبار يجلس *تحت* المدى الافتراضي مثل `-1.0`؟
- تطبع `run_suite` سطر pytest الأخير فقط. حين تحوي مجموعة 200 اختبار مولّد ويفشل واحد, ماذا يجب أن تطبع أداة إنتاج *بدلًا من* الذيل — وماذا يضمن كود الخروج وحده فعلًا؟

## ⚠️ مآزق شائعة

- **اختبار دالة ضد نفسها.** `assert clamp(v) == clamp(v)` ينجح مهما بلغت معطوبية `clamp`. يجب أن يُهجّأ التعبير المتوقع من *تعبير آخر* (صيغة `max/low/min`) أو يثبت الاختبار لا شيء.
- **`==` بدل `is` على `Parameter.empty`.** قد يُخدع `param.default == inspect.Parameter.empty`; يجب مقارنة الحارس بـ`is`, أو يبدو كل معامل «بلا افتراضي» كأنه مفترض.
- **`pytest` العارية في عملية فرعية.** على آلة بعدة إصدارات Python, قد يشغّل `subprocess.run(["pytest", ...])` مفسرًا مختلفًا بلا `clamp`. استثمر دائمًا `[sys.executable, "-m", "pytest", ...]`.
- **تسرّب العوامات إلى أسماء الدوال.** `0.1` و`-1.0` عوامات صالحة لكنها معرفات غير صالحة; خريطة `.replace` موجودة بالضبط لأن المعرّفات المولّدة يجب أن تتنقل ذهابًا وإيابًا (round-trip).
- **انحراف الأسماء/التجميع المولّد.** ملف اختبار يفقد بادئة `test_` الرائدة (أو `def test_` على الملاحق) *يُجمَّع كلا شيء* — يُبلّغ pytest «no tests ran» بكود خروج 5, فيقول مجريك أحمر لسبب خاطئ.
- **تخزين التوقيع مؤقتًا.** التحويل إلى قالب ضد `sig` قديم يبني اختبارات لكود تغيّر; أعد التوليد دائمًا من استدعاء `inspect.signature(...)` طازج.

## ما بنيته للتو

مولد اختبار بثلاثة مصادر حقيقة صادقة: التوقيع (ما الوسائط الموجودة), والقيم الافتراضية (ما هي الأقصى), والقصد المكتوب بشريًا (الخصائص التي يجب أن تصمد دائمًا). يصيَّر ملف pytest حقيقيًا, يشغّله كعملية فرعية, ويمكنه حتى استدعاء LLM لاختبارات القصد حين يوجد مفتاح — وقد اثبت نفسه باصطياد `clamp` المعطوبة عن قصد. الفكرة القابلة للنقل أكبر من الاختبار: «اشتق العِدّة من الواجهة, صيّرها نصًا, نفّذها, واقرأ كود الخروج» هو نفس الهيكل العظمي لمولّدات الكود ومُصيِّرات الإعداد ومساعدي CI.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/ai-test-generator/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-test-generator) في مستودع الدورة هو المولّد كاملًا كدفتر ملاحظات — تفريغ التوقيع, ومسابر الحواف, والاختبارات المولّدة, ومطالبة LLM الاختيارية, وحكم الأحمر/الأخضر, كلها في مكان واحد. استنسخه أو [افتحه في Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## إلى أين تذهب من هنا

- عمّم `render_case` على أي *نوع* معامل: السلاسل تحصل على مسابر `["", "a", "a"*N]`, والقوائم على فارغة/مفردة/مرتبة, والقيمة المتوقعة من خاصية لكل نوع لا من قالب صيغة.
- أضف علم CLI `--limit` كي تُصيَّر مجموعات المسابر الضخمة بعيّنة عشوائية مقيدة — يبقى التوليد سريعًا فيما يواصل تحريّ فضاء الحدود.
- صِل الحكم بربط git (hook): عند الالتزام, أعد توليد المجموعة للوحدات المتغيرة واحجب الالتزام إذا كان `returncode != 0`.
- حوّل `llm_prompt.txt` إلى استدعاء حقيقي بمفتاح و*اجمع* اختبارات النموذج المعادة, ملحقًا إياها بالمجموعة — مع إبقاء الاحتياط اليدوي سليمًا.

## شارك مشروعك مع الصف

بنيت شيئًا تفخر به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع قدّمها طلاب آخرون — وREADME الخاص به يحوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**, حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع, وإنشاء فرع, وتثبيت ملفاتك, وفتح الـ PR, خطوة بخطوة. لا يُفترض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓