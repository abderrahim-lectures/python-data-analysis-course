---
title: "متتبع طلبات المنح"
description: "أدر طلبات المنح مع المواعيد النهائية والميزانيات وتدفقات العمل التعاونية."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["data-management", "csv", "datetime", "json", "cli"]
learningObjectives:
  - "نمذجة كيانات العالم الحقيقي بالقواميس والقوائم المتداخلة"
  - "تحليل التواريخ ومقارنتها وتنسيقها لتتبع المواعيد النهائية"
  - "حفظ البيانات المنظمة وإعادة تحميلها بـJSON وCSV"
  - "بناء تطبيق CLI قائم على القوائم مع التحقق من المدخلات"
prerequisites:
  - "أساسيات Python (المتغيرات، الحلقات، الدوال)"
  - "القواميس والقوائم"
---

# 🛠️ 💰 ابنِ متتبع طلبات المنح

مكاتب الأبحاث تدير عشرات المقترحات دفعة واحدة، كل منها بجهة ممولة، وموعد نهائي صارم، وميزانية، وفريق، ومسار نفقات. يبني هذا المشروع متتبعًا للمنح عبر سطر الأوامر يُنمذج كل طلب كقاموس متداخل، ويراقب الإنفاق مقابل ميزانيته، ويرتب المواعيد النهائية القادمة، ويحفظ كل شيء على القرص حتى يعيش عملك بين الجلسات.

يفترض هذا معرفة Python للمبتدئين والراحة في التعامل مع القواميس والقوائم — لا يلزم شيء من تحليل البيانات. إنه اختياري وغير مقيم؛ انظر [مشاريع واقعية](/ar/مشاريع) للقائمة الكاملة المتزايدة.

## 🎯 ما ستفعله

1. نموذج طلب منحة كقاموس متداخل يحمل فريقًا وميزانية ودفتر حسابات نفقات.
2. إضافة نفقات مع تحقق فلا يتجاوز أي مقترح ميزانيته بصمت أبدًا.
3. بناء لوحة مواعيد نهائية تعلّم على الطلبات المتجاوزة والقريبة، مرتبةً بالإلحاح.
4. حفظ كل شيء إلى JSON وتصدير CSV يفتحه أحدهم في جدول بيانات.
5. تشغيل كل ذلك من CLI تفاعلي قائم على القوائم ينجو من المدخلات الخاطئة.

## أين تُشغّل هذا

**محليًا عبر `uv`** هو المسار الأساسي — لكن على عكس معظم مشاريع هذه السلسلة، هذا المشروع بلا أي تبعيات خارجية: كل شيء يستخدم المكتبة القياسية (`datetime`، `json`، `csv`، `os`). هذا يجعله من ألطف المشاريع لتجربة سير العمل المحلي للدورة فعلًا: مجلد مشروع حقيقي، ونص برمجي حقيقي، وملفات حقيقية تُكتب على القرص في كل تشغيل.

**Google Colab وBinder وKaggle Notebooks** تشغّله بارتياح أيضًا — يعكس الدفتر كل خطوة أدناه، ولأنه لا حاجة لتثبيت حزم، فمسار المتصفح بإخلاص كامل لا بمحاكاة مخفضة. **JupyterLite**، الملعب داخل المتصفح، سيشغّل خطوتي نموذج البيانات واللوحة أيضًا، إذ لا شيء هنا يحتاج مكتبات أصلية. تحفظ صريح واحد: ملف JSON الذي تحفظه يعيش على نظام الملفات المؤقت للدفتر في المتصفح، فعامله كمسار تجربة واستخدم مجلدًا محليًا حين تريد أن تدوم البيانات فعلًا عبر الجلسات الحقيقية.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/grant-tracker/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/grant-tracker/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fgrant-tracker%2Fnotebook.ipynb)

## الإعداد

أنشئ مجلد المشروع. لا توجد تبعية لتثبيتها — كل وحدة يستخدمها هذا المشروع تأتي مع Python.

```bash
uv init grant-tracker
cd grant-tracker
```

```bash
uv run python --version
```

كل وحدة يستخدمها هذا المشروع — `datetime`، `json`، `csv`، `os` — جزء من المكتبة القياسية، فلا خطوة `uv add` ولا `requirements.txt` قد تُخطئ. ذلك ميزة مقصودة: نفس ملف `grant_tracker.py` بالضبط يعمل في طرفيتك، وفي دفتر الدورة، وفي المتصفح، لأن لا شيء منه يحتاج حزمة أصلية.

**✅ قائمة التحقق**

- ✅ يطبع `uv run python --version` Python 3.9 أو أحدث (يستخدم الكود تلميحات أنواع `list[str]`).
- ✅ يوجد `grant-tracker/` وأنهى `uv init grant-tracker` دون أخطاء.
- ✅ يخرج `uv run python -c "import json, csv, datetime, os"` بصمت — سلسلة الأدوات كاملة موجودة.

## الخطوة 1: نمذجة منحة كقاموس متداخل

طلب المنحة أكثر من صف مسطح من الحقول: له ميزانية، وفريق أشخاص، وقائمة نفقات متنامية. الشكل البايثوني الطبيعي لذلك **قاموس متداخل** — `dict` وقيمه نفسها قوائم وسلاسل — لأنه يسمح لك بحمل طلب كامل ككائن واحد، وتمريره للدوال، وحفظه مباشرةً إلى JSON لاحقًا.

### 1.1 اكتب مصنع المنح

**👟 تلميح البداية :** اكتب دالة واحدة ترجع قاموس منحة مكتمل التكوين، ليحمل كل منحة تنشئها أبدًا المفاتيح نفسها منذ البداية — الثبات يتفوق على الراحة حين ستتنقل لاحقًا عبر مئات منها.

```python
# grant_tracker.py
from datetime import datetime

def create_grant(
    title: str,
    funder: str,
    deadline: str,
    total_budget: float,
    team: list[str] | None = None,
) -> dict:
    """Create a new grant application record."""
    return {
        "id": datetime.now().strftime("%Y%m%d%H%M%S"),
        "title": title,
        "funder": funder,
        "deadline": deadline,
        "total_budget": total_budget,
        "spent": 0.0,
        "team": team or [],
        "status": "draft",
        "created": datetime.now().isoformat(),
        "expenses": [],
    }

grant = create_grant(
    "NSF Career Development",
    "National Science Foundation",
    "2026-10-15",
    500000.00,
    ["Alice", "Bob"],
)
print(grant)
```

السطران اللذان يحملان التصميم هما `"team": team or []` و`"expenses": []`. يجمع `team or []` كلًا من `None` والقائمة الفارغة في حالة بداية آمنة واحدة، فيستطيع المتصل ألا يمرر شيئًا ويحصل مع ذلك على قائمة — لا `None` لتتعثر فيه لاحقًا. و`"expenses": []` يبدأ دفتر حسابات فارغًا ستلحق به الخطوة 2؛ إبقاؤه داخل قاموس المنحة، لا في قائمة عامة موازية، هو ما يجعل كل منحة مكتفية بذاتها.

**🎯 الناتج المتوقع :** قاموس واحد يطابق `id` و`created` فيه الوقت الحالي، مع `spent: 0.0` و`status: "draft"` و`team: ["Alice", "Bob"]` و`expenses: []`.

**🩹 إذا لم يعمل :** إذا أظهر `team` القائمة `[]` بينما مرّرت `["Alice", "Bob"]`، فأنت على الأرجح تطبع المتغير الخاطئ — `create_grant` *ترجع* قاموسًا جديدًا، فأعد تعيين النتيجة (`grant = create_grant(...)`) بدلًا من طباعة قاموس حفظته تحت اسم آخر. إذا ظهر `NameError: name 'datetime' is not defined`، فسطر `from datetime import datetime` مفقود أو يقع أسفل الدالة. إذا أخطأ تلميح `list[str]` نفسه، فأنت على Python أقدم من 3.9 — انتقل إلى نقطة فحص الإصدار في الإعداد.

### 1.2 أنشئ المحفظة التي ستتتبعها

**👟 تلميح البداية :** أنشئ ثلاث منح بجهات ممولة وميزانيات ومواعيد نهائية مختلفة — بما فيها موعد داخل الثلاثين يومًا القادمة، حتى تحظى لوحة الخطوة 3 بتنوع حقيقي.

```python
# grant_tracker.py (متابعة)
grants = [
    create_grant("NSF Career Development", "National Science Foundation", "2026-10-15", 500000.00, ["Alice", "Bob"]),
    create_grant("NIH R01 Proposal", "National Institutes of Health", "2026-11-01", 350000.00, ["Carol"]),
    create_grant("Local Community Grant", "City Foundation", "2026-09-30", 25000.00, ["Bob", "Carol"]),
]

for g in grants:
    print(f"{g['title']:28} {g['funder']:28} {g['deadline']}  ${g['total_budget']:>12,.2f}")
```

قائمة القواميس هي الوحدة الأساسية التي ستستقبلها كل دالة لاحقة: فرزها، تصفيتها، حفظها. محددات العرض في f-string (`:28`، `:>12`) تحشو كل قيمة لتستقف الأعمدة — خدعة تنسيق صغيرة تحوّل القواميس الخام إلى شيء يُقرأ بنظرة واحدة، دون أي مكتبة تقارير.

**🎯 الناتج المتوقع :** ثلاثة أسطر متساوية المحاذاة، واحد لكل منحة، تعرض العنوان والجهة الممولة والموعد النهائي وميزانية منسقة — مثلًا `Local Community Grant      City Foundation          2026-09-30  $    25,000.00`.

**🩹 إذا لم يعمل :** إذا التصقت الأعمدة ببعضها، فأرقام العرض أصغر من أطول قيمة — ارفع `:28`. إذا رأيت ميزانيات صحيحة عدديًا لكن بمسافات غريبة، فذاك فاصل الآلاف `,` وعرض الحقل ينجزان عملهما؛ اضبط العرض، لا مُحدد التنسيق.

### 1.3 تحقق من نموذج البيانات

**✅ قائمة التحقق**

- ✅ ترجع `create_grant(...)` قاموسًا بكل مفتاح متوقع: `id`، `title`، `funder`، `deadline`، `total_budget`، `spent`، `team`، `status`، `created`، `expenses`.
- ✅ استدعاؤها دون وسيط `team` يُنتج `team: []`، لا `None` أبدًا.
- ✅ `grants` قائمة من ثلاثة قواميس وتطبع الحلقة ثلاثة صفوف متساوية المحاذاة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يعامل `team or []` كلًا من `None` و`[]` بالتساوي — لكن ماذا سيفعل لو مرّر أحدهم *السلسلة* `"Bob"` كفريق بدلًا من قائمة؟ ولماذا يصح ذلك وصفةً لخلل مربك لاحقًا، وأي فحص واحد داخل `create_grant` سيكشفه؟
- يُخزَّن الموعد النهائي كسلسلة `"2026-10-15"`، لا ككائن `datetime`. ما الذي ينكسر لحظة محاولة تخزين `datetime` فعلي في ملف JSON — ولماذا إذن تكون سلسلة ISO البسيطة التمثيلَ الأشجع هنا؟

## الخطوة 2: احمِ الميزانية أثناء تتبع النفقات

ميزانية المنحة قيد صارم: الإنفاق مشروعٌ فحسب ما دام داخل `total_budget`. تبني هذه الخطوة دفتر نفقات يفرض القاعدة لحظة الإدراج، فيصبح التجاوز خطأً صاخبًا فوريًا لا رقمًا سالبًا هادئًا في تقرير بعد شهور.

### 2.1 سجّل نفقة مع تحقق

**👟 تلميح البداية :** دالة واحدة، ثلاث وظائف: افحص أن المبلغ موجب، وافحص أنه يليق بالميزانية المتبقية، وعندها فقط ألحقه بدفتر المنحة وحدّث `spent`.

```python
# grant_tracker.py (متابعة)
def add_expense(grant: dict, description: str, amount: float, phase: str) -> dict:
    """Record an expense against a grant."""
    if amount <= 0:
        raise ValueError("Expense amount must be positive")
    if amount > grant["total_budget"] - grant["spent"]:
        raise ValueError("Expense exceeds remaining budget")

    expense = {
        "date": datetime.now().isoformat(),
        "description": description,
        "amount": amount,
        "phase": phase,
    }
    grant["expenses"].append(expense)
    grant["spent"] = round(grant["spent"] + amount, 2)
    return expense

expense = add_expense(grant, "Statistician consultation", 4500.00, "writing")
print(grant["spent"])
print(grant["expenses"][-1]["description"])
```

يحدث التحقق **قبل** أي تعديل: كلا فحصي `if` يرفعان استثناءً قبل تغير أي حقل، فلا تستطيع نفقة مرفوضة إفساد مجموع `spent` للمنحة. هذا الترتيب — تحقق من كل شيء ثم عدّل — هو الانضباط نفسه الذي ستراه في شيفرة دفاتر البنوك ومعاملات قواعد البيانات. يُبقي `round(..., 2)` الحساب العائم (الذي يركم أخطاءً صغيرة مثل `0.1 + 0.2`) بعيدًا عن الانجراف إلى السنتات عبر المئات من الإدخالات.

**🎯 الناتج المتوقع :** يطبع `4500.0`، ثم `Statistician consultation`. استدعاء `add_expense(grant, "Over", 999999, "writing")` يرفع `ValueError: Expense exceeds remaining budget` ويترك `spent` دون مساس.

**🩹 إذا لم يعمل :** إذا أضافت نفقة مفرطة *إلى* `spent` بدل أن ترفع استثناءً، ففحص `if` الثاني مفقود أو يقع الرفع بعد التعديل. إذا رأيت `4500.0` حيث توقعت `4500.00`، فذاك عرضُ عدد عائم لا خلل — اطبع `f"{grant['spent']:.2f}"`. إذا حصلت على `KeyError: 'spent'`، فالقاموس الذي تمرره لم يُبنَ بـ`create_grant` (الخطوة 1)، فمفاتيحه غير متطابقة.

### 2.2 لخّص حالة الميزانية

**👟 تلميح البداية :** اكتب دالة *نقية* تقرأ منحة وترجع لقطة ميزانيتها — الإجمالي، المصروف، المتبقي، النسبة المستهلكة — حتى تعرض كل شاشة لاحقة الأرقام نفسها.

```python
# grant_tracker.py (متابعة)
def budget_summary(grant: dict) -> dict:
    """Return a budget summary for a single grant."""
    remaining = round(grant["total_budget"] - grant["spent"], 2)
    pct_used = 0.0
    if grant["total_budget"] > 0:
        pct_used = round((grant["spent"] / grant["total_budget"]) * 100, 1)
    return {
        "title": grant["title"],
        "total": grant["total_budget"],
        "spent": grant["spent"],
        "remaining": remaining,
        "percent_used": pct_used,
    }

print(budget_summary(grant))
```

الدوال النقية — مدخل يدخل، أرقام مشتقة تخرج، لا تُلمس أي حالة — هي قلب نص بيانات قابل للصيانة. `budget_summary` لا تغيّر الميزانية؛ إنها تبلغ عنها، ولهذا تستطيع الخطوة 3 استدعاءها داخل حلقة دون آثار جانبية. الحارس الصريح `if grant["total_budget"] > 0`، بدلًا من القسمة العمياء، يتعامل مع المقترح الذي ما زال قيد الكتابة بميزانية صفر فتحصل على `0.0` لا `ZeroDivisionError`.

**🎯 الناتج المتوقع :** قاموس مثل `{'title': 'NSF Career Development', 'total': 500000.0, 'spent': 4500.0, 'remaining': 495500.0, 'percent_used': 0.9}`.

**🩹 إذا لم يعمل :** إذا وقعت في `ZeroDivisionError`، فحارس الميزانية الكلية مفقود. إذا كان `percent_used` عددًا عائمًا طويلًا مثل `0.8999999...`، فالـ`round` مفقود من سطر القسمة — طبّق `round(x, 1)` على النسبة النهائية.

### 2.3 تحقق من حامي الميزانية

**✅ قائمة التحقق**

- ✅ نفقة صالحة تلحق بـ`grant["expenses"]` وترفع `grant["spent"]`.
- ✅ مبلغ `0` أو سالب أو أكبر من الميزانية المتبقية يرفع `ValueError`، ويبقى `spent` دون تغيير عقب ذلك.
- ✅ ترجع `budget_summary(grant)` قيم `total` و`spent` و`remaining` و`percent_used`، ولا تقسم على صفر أبدًا.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يستخدم فحص التجاوز `amount > grant["total_budget"] - grant["spent"]`. ماذا سيحدث لو نقلت `round(...)` إلى هذا الطرح بدلًا من التحديث — هل تستطيع سلسلة من النفقات الصغيرة الصالحة أن *تبدو* متجاوزةً قط؟ (جرّب `0.1 + 0.2` في REPL لترى لماذا هذا سؤال حقيقي.)
- الاسترداد اقتصاديًا نفقة سالبة. هل ينبغي أن تقبل `add_expense` المبالغ السالبة، أم أن السماح بها يُضعف الحارس؟ وما الذي سيحتاجه موقع الاستدعاء ليميز بين استرداد مشروع وخطأ كتابي؟

## الخطوة 3: ابنِ لوحة المواعيد النهائية

المواعيد النهائية هي ما يقرر فعليًا من يحصل على التمويل. تحوّل هذه الخطوة سلاسل التواريخ ISO الخام إلى قرارات مبنية على الزمن: كم يومًا حتى كل موعد، وأي المنح تجاوزت بالفعل، وبأي ترتيب ينبغي أن تعمل.

### 3.1 احسب الأيام حتى كل موعد نهائي

**👟 تلميح البداية :** حلّل كل موعد بـ`datetime.fromisoformat`، واطرح *اليوم*، وارفق وسم `status` جاهزًا للإنسان، ثم رتّب القائمة كلها بالإلحاح.

```python
# grant_tracker.py (متابعة)
from datetime import timedelta

def upcoming_deadlines(grants: list[dict], days_ahead: int = 30) -> list[dict]:
    """Return grants with deadlines within the next N days, sorted soonest first."""
    today = datetime.now()
    cutoff = today + timedelta(days=days_ahead)

    results = []
    for grant in grants:
        deadline = datetime.fromisoformat(grant["deadline"])
        days_left = (deadline - today).days
        results.append({
            "title": grant["title"],
            "funder": grant["funder"],
            "deadline": grant["deadline"],
            "days_left": days_left,
            "status": "OVERDUE" if days_left < 0 else f"{days_left} days left",
            "budget_status": budget_summary(grant),
        })

    results.sort(key=lambda g: g["days_left"])
    return results

for item in upcoming_deadlines(grants):
    print(f"{item['status']:>16}  {item['title']}  ({item['budget_status']['percent_used']}% used)")
```

يحلل `datetime.fromisoformat` سلسلة ISO عائدةً إلى `datetime` حقيقي فيصبح الطرح ذا معنى: `(deadline - today).days` ينتج عددًا صحيحًا عاديًا، سالبًا عند التجاوز وموجبًا عند القرب. الفرز على `days_left` يرتب القائمة من الأكثر تجاوزًا إلى الأبعد في سطر واحد، لأن مفتاح الفرز يشفّر الإلحاح أصلًا. تداخل `budget_status` داخل كل عنصر هو ثمرة الدالة النقية في الخطوة 2: استدعاء واحد، وتكتسب اللوحة سياقًا ميزانيًا مجانًا.

**🎯 الناتج المتوقع :** ثلاثة أسطر، واحد لكل منحة، تعرض `OVERDUE` أو `N days left` إضافةً إلى النسبة المئوية المستهلكة من الميزانية — مع المنحة المتجاوزة أو الأكثر إلحاحًا أولًا.

**🩹 إذا لم يعمل :** إذا حصلت على `ValueError: Invalid isoformat string`، فموعد نهائي في بياناتك ليس سلسلة `YYYY-MM-DD` نظيفة — صرامة `fromisoformat` هي بالضبط سبب تخزين الخطوة 1 التواريخ بهذا التنسيق الواحد. إذا أظهر كل سطر `0 days left`، فقد تقارن `date` بـ`datetime` أو تحلل في منتصف ليل مختلف — افحص بـ`print(type(today), type(deadline))`. إذا بدا الترتيب عشوائيًا، ففرز `key=` عمومًا ليس مطبقًا على القائمة التي تطبعها.

### 3.2 اعرض اللوحة

**👟 تلميح البداية :** نسّق القائمة المحسوبة أصلًا كتقرير مقروء — لافتة، وكتلة لكل منحة، وواصمة `!!!` ثقيلة على أي شيء متجاوز.

```python
# grant_tracker.py (متابعة)
def print_dashboard(grants: list[dict]) -> None:
    """Display a formatted deadline dashboard."""
    upcoming = upcoming_deadlines(grants)
    print("\n" + "=" * 60)
    print("GRANT DEADLINE DASHBOARD")
    print("=" * 60)
    for item in upcoming:
        marker = "!!!" if item["days_left"] < 0 else "   "
        print(f"{marker} {item['title']}")
        print(f"     Funder: {item['funder']}")
        print(f"     Deadline: {item['deadline']} -- {item['status']}")
        budget = item["budget_status"]
        print(f"     Budget: ${budget['spent']:.2f} / ${budget['total']:.2f} ({budget['percent_used']}% used)")
        print()

print_dashboard(grants)
```

لدى `print_dashboard` وظيفة واحدة بالضبط — تحويل البيانات المحسوبة أصلًا إلى مخرجات مقروءة — وهي لا تجري متعمدًا أي *حساب* خاص بها. تقسيم "احسب" و"اعرض" يعني أنه يمكنك لاحقًا استبدال هذا العارض النصي بصفحة HTML أو بمخطط دون لمس `upcoming_deadlines` البتة.

**🎯 الناتج المتوقع :** لافتة `GRANT DEADLINE DASHBOARD`، ثم كتلة لكل منحة مرتبة بالإلحاح، مع `!!!` قبل أي منحة متجاوزة وسطور ميزانية مثل `Budget: $4,500.00 / $500,000.00 (0.9% used)`.

**🩹 إذا لم يعمل :** إذا طبعت اللوحة بترتيب الإنشاء، فـ`print_dashboard` تتنقل في قائمة `grants` الخام بدل استدعاء `upcoming_deadlines`. إذا لم تظهر `!!!` أبدًا، فما من موعد قبل اليوم — أضف تاريخًا منقضيًا عمدًا لاختبار الواصمة. إذا أظهرت الميزانيات دولارات كاملة، فمُحدِّدات `:.2f` مفقودة من f-strings الميزانية.

### 3.3 تحقق من اللوحة

**✅ قائمة التحقق**

- ✅ ترجع `upcoming_deadlines(grants)` عناصر مرتبة من الأكثر تجاوزًا إلى أبعد موعد.
- ✅ منحة متجاوزة تعرض `OVERDUE` في `status` وواصمة `!!!` في `print_dashboard`.
- ✅ يحمل كل عنصر لوحة لقطة `budget_status` متداخلة من الخطوة 2.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- ترتب اللوحة *بالأقرب أولًا*، فأكثر منحة تجاوزًا تتصدر القائمة. بالنسبة لمكتب أبحاث حقيقي، هل "الأكثر تجاوزًا أولًا" هو الترتيب الصحيح دائمًا — أم تستطيع تخيل معيارًا (ميزانية معرضة للخطر، أولوية الجهة الممولة) ينبغي أن يتفوق عليه؟ كيف ترتب بـ`days_left` ثم بمفتاح ثانٍ؟
- يُسقط `(deadline - today).days` وقت اليوم كليًا. إذا كان موعد نهائي `2026-10-15 23:59`، في أي لحظة ينقلب `days_left` من `0` إلى `1-`؟ أإنذار مبكر أم متأخر؟

## الخطوة 4: احفظ في JSON وصَدِّر إلى CSV

الآن تختفي منحك حين ينتهي التشغيل. تكتبها هذه الخطوة إلى القرص بـJSON — الصيغة الطبيعية للقواميس المتداخلة — وتصدّر CSV مسطحًا ليتمكن أي شخص لديه جدول بيانات من العمل على البيانات نفسها.

### 4.1 احفظ المنح وحمّلها

**👟 تلميح البداية :** دالتان صغيرتان، ملف واحد، بلا تبعيات: `json.dump` للكتابة، و`json.load` للقراءة العائدة، وفحص وجودٍ ليُحمَّل ملف مفقود كقائمة فارغة بدل أن تتحطم.

```python
# grant_tracker.py (متابعة)
import json
import os

DATA_FILE = "grants.json"

def save_grants(grants: list[dict]) -> None:
    """Save all grants to a JSON file."""
    with open(DATA_FILE, "w") as f:
        json.dump(grants, f, indent=2)
    print(f"Saved {len(grants)} grants to {DATA_FILE}")

def load_grants() -> list[dict]:
    """Load grants from disk, returning an empty list if the file is missing."""
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE) as f:
        return json.load(f)

save_grants(grants)
print(load_grants() == grants)
```

يكتب `json.dump(grants, f, indent=2)` البنية المتداخلة — النفقات، الفرق، الميزانيات — نصًا مقروءًا يحفظ بالضبط الأشكال التي أنتجها `create_grant`، لأن القواميس والقوائم والسلاسل والأعداد العائمة كلها لها تمثيل JSON. رحلة الذهاب والإياب هي الاختبار الحقيقي هنا: `print(load_grants() == grants)` ينبغي أن يكون `True`، ما يثبت أن شيئًا لم يُفقد عند إعادة كتابة البيانات نصًا وعودةً.

**🎯 الناتج المتوقع :** يطبع `Saved 3 grants to grants.json`، ثم `True` (المنح المحمّلة تساوي الأصلية، قاموسًا بقاموس).

**🩹 إذا لم يعمل :** إذا طبعت المقارنة `False`، فاعزل الانجراف — `load_grants()[0] == grants[0]` يخبرك هل الخلل في القائمة كلها أم في منحة واحدة. إذا حصلت على `TypeError: Object of type datetime is not JSON serializable`، فكائن `datetime` انزلق داخل منحة؛ لا يستطيع JSON تمثيله، وهذا بالضبط سبب تخزين الخطوة 1 `created` كسلسلة. إذا فُتح الملف سطرًا واحدًا طويلًا، فـ`indent=2` سقط.

### 4.2 صدّر CSV مناسبًا لجداول البيانات

**👟 تلميح البداية :** مسّح كل منحة متداخلة إلى الأعمدة الستة التي يريدها مكتب التمويل فعلًا، واكتبها بوحدة `csv` لتُقتبس الفواصل داخل القيم لك.

```python
# grant_tracker.py (متابعة)
import csv

def export_grants_csv(grants: list[dict], filepath: str = "grants.csv") -> None:
    """Write grant data to CSV with one row per grant."""
    fieldnames = ["title", "funder", "deadline", "total_budget", "spent", "status"]
    with open(filepath, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for grant in grants:
            writer.writerow({name: grant.get(name, "") for name in fieldnames})
    print(f"Exported {len(grants)} grants to CSV: {filepath}")

export_grants_csv(grants)
```

CSV تنسيق *مسطح* — لا يستطيع حمل قائمة `team` متداخلة أو دفتر حسابات `expenses` في خلية واحدة — فالتصدير تبسيط مقصود: تختار الأعمدة العددية الست التي تنجو من التسطيح. يأخذ `csv.DictWriter` قاموسًا لكل صف ويتولى الاقتباس بنفسه (عنوان يحوي فاصلة يبقى حقلًا واحدًا)، وهو تحديدًا صنف الخلل الذي تدعو إليه بناء سلاسل CSV يدويًا.

**🎯 الناتج المتوقع :** ملف `grants.csv` بصف رأس إضافةً إلى ثلاثة صفوف بيانات، والمطبوعة `Exported 3 grants to CSV: grants.csv`.

**🩹 إذا لم يعمل :** إذا فُتح CSV سطرًا واحدًا جاريًا، فـ`open` تنقصه `newline=""` — أثر نهاية سطر لا تصلحه وحدة `csv` عنك. إذا وصلت الأعمدة بترتيب خاطئ، فـ`fieldnames` هو سلطة الترتيب — أعد ترتيبه، لا القاموس. إذا اشتكى `writerow` من مفتاح مفقود، فقاموس المنحة ينقصه أحد الحقول المدرجة؛ `.get(name, "")` يغطي ذلك تحديدًا.

### 4.3 تحقق من الحفظ والتصدير

**✅ قائمة التحقق**

- ✅ يوجد `grants.json` ويبقى محتواه عبر إعادة تشغيل — يسترجع `load_grants()` المنح نفسها التي حفظت.
- ✅ يفتح `grants.csv` في جدول بيانات بالأعمدة الستة المتوقعة وصف لكل منحة.
- ✅ يسترجع `load_grants()` القيمة `[]` دون تحطم عندما يغيب الملف.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- أثبتت رحلة JSON أن `load_grants() == grants`، ومع ذلك يتخلص تصدير CSV عمدًا من الفريق والنفقات. ما الذي يفعله الملف CSV مفيدًا ولا يستطيعه JSON، وما الذي ستخسره لو كان CSV التنسيق الوحيد الذي تحتفظ به؟
- تجربة ذهنية عن الإصدارات: بعد ستة أشهر، تضيف مفتاح `cost_share` إلى `create_grant`. ماذا يحدث حين يقرأ `load_grants()` الملف القديم الذي لا يحوي المفتاح أصلًا — وماذا يعني ذلك بشأن المكان الذي يجب أن تعيش فيه ترحيلات البيانات مع تطور مخطط مخزن؟

## الخطوة 5: شغّلها كلها من CLI قائم على القوائم

الدوال التي بنيتها مكتبة؛ CLI تجعلها قابلة للاستخدام من شخص. تغلّفها هذه الخطوة في حلقة تعرض قائمة، وتقرأ خيارًا، وتتحقق منه، وتوجه إلى الإجراء الصحيح — نفس الهيكل العظمي وراء عشرات أدوات الإدارة الحقيقية.

### 5.1 اكتب حلقة القائمة الرئيسية

**👟 تلميح البداية :** ابدأ حلقة `while True`، واطبع الخيارات المرقمة، واقرأ الإدخال، وصرف. تحقق دائمًا قبل لمس أي بيانات، وقارن الخيارات كسلاسل فلا يتمكن حرف `"q"` شار ذ من تحطيم أي شيء.

```python
# grant_tracker.py (متابعة)
grants = load_grants() or grants  # pick up any saves from earlier runs

def menu() -> None:
    while True:
        print("\n--- GRANT TRACKER MENU ---")
        print("1. Show deadline dashboard")
        print("2. Add an expense")
        print("3. Export to CSV")
        print("4. Save")
        print("5. Quit")
        choice = input("> ").strip()

        if choice == "1":
            print_dashboard(grants)
        elif choice == "2":
            title = input("Grant title: ").strip()
            grant = next((g for g in grants if g["title"] == title), None)
            if grant is None:
                print(f"No grant titled '{title}'.")
                continue
            desc = input("Description: ").strip()
            amount = input("Amount: ").strip()
            try:
                add_expense(grant, desc, float(amount), input("Phase: ").strip())
                print("Expense recorded.")
            except ValueError as exc:
                print(f"Invalid: {exc}")
        elif choice == "3":
            export_grants_csv(grants)
        elif choice == "4":
            save_grants(grants)
        elif choice == "5":
            save_grants(grants)
            print("Bye!")
            break
        else:
            print(f"Unknown choice: {choice}")

menu()
```

قرارات ثلاثة تجعل هذه الحلقة متسامحة مع الأخطاء. يُقرأ الإدخال **سلسلةً** ويُقارن بمعلومات حرفية، فالحروف الشاردة لا تكسر نظام الأنواع. يُغلّف `float(amount)` بـ`try/except ValueError`، ملتقطًا الفشل *المتوقَّع* ("abc" ليس عددًا) وعارضًا على المستخدم رسالة بدل مكدس الاستدعاء. و`next((g for g in grants if g["title"] == title), None)` يبحث في القائمة بحقل فريد — `title` هنا، وإن كانت أداة إنتاجية ستستخدم `id` المنحة من الخطوة 1 لتنجو من الأسماء المكررة.

**🎯 الناتج المتوقع :** تُطبع القائمة؛ الخيار `1` يعرض لوحة الخطوة 3، والخيار `2` بعنوان ومبلغ حقيقيين يسجل نفقة (رافعًا `ValueError` عند التجاوز)، والخيار `3` يكتب `grants.csv`، و`5` يحفظ قبل الخروج.

**🩹 إذا لم يعمل :** إذا أنتج مبلغ غير عددي مكدس استدعاء، فـ`try/except ValueError` ليس ملتفًّا حول `float(amount)`. إذا لم تفعل كتابة `1` شيئًا، قارن الفرع الخام — `.rstrip()` شارٌّ قد يكون أكل الرقم، أو لم يُحفظ كود القائمة أبدًا. إذا لم تعرض القائمة بيانات اليوم أبدًا، فسطر `grants = load_grants() or grants` ليس فوق الحلقة.

### 5.2 تحقق من التطبيق التفاعلي

**✅ قائمة التحقق**

- ✅ ينفذ كل خيار قائمة إجراءه: اللوحة، إضافة النفقة، تصدير CSV، الحفظ.
- ✅ اختيار قائمة سيئ يطبع رسالة ودودة بدل أن يتحطم.
- ✅ مبلغ سيئ (`"abc"`، سالب، فوق الميزانية) يُلتقط ويُجرى عليه تقرير دون الخروج من الحلقة أو إفساد `spent`.
- ✅ الخروج يحفظ المنح الحالية إلى `grants.json`.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- الخيار 5 يحفظ ويكسر كلًا معًا. ماذا يحدث إذا أغلق المستخدم الطرفية بدل اختياره — وما الذي ستمنحك إياه `try/finally` حول الحلقة مما لا يفعل حفظ المسار السعيد؟
- تتحقق القائمة من *المبلغ* لكنها تطلب منك كتابة عنوان المنحة يدويًا. إذا شاركت منحتان التركيز والعنوان نفسه، فما الالتباس الذي يخلقه ذلك، ولماذا يكون فهرسة المنح بـ`id` من `create_grant` التصميمَ الأكثر متانة؟

## ⚠️ المآزق الشائعة

- **التجاوز الصامت يفسد دفتر الحسابات.** إذا لم يكن التحقق يقطن *داخل* `add_expense`، فالإدخال السيئ يجعل `remaining` سالبًا فحسب — واللوحة تبلغ بسعادة عن `12.3%-` مستهلكة. الإصلاح: أبقِ حارسي `ValueError` قبل أي تعديل (الخطوة 2)، وعامل المتبقي السالب كخلل لا كتقرير.
- **سلاسل المواعيد غير المتسقة تكسر `fromisoformat`.** منحة مخزنة `"Oct 15, 2026"` وأخرى `"2026-10-15"` تجعل `datetime.fromisoformat` يرفع عند الأولى. الإصلاح: فرض تنسيق ISO عند المصدر — تحقق من السلسلة داخل `create_grant` بـ`datetime.fromisoformat(deadline)`، واكتب المواعيد النهائية عبر تلك الدالة الواحدة فقط.
- **المال كأعداد عائمة خام.** `round(0.1 + 0.2, 2)` جيد للعرض، لكن الأعداد العائمة غير المدورة تنحرف عبر مئات النفقات. الإصلاح: قرّب عند كل تعديل (كما تفعل `add_expense`)، وأبقِ تنسيق العرض (`:.2f`) منفصلًا عن القيم المخزنة، واتجه إلى `decimal.Decimal` حين تهم السنتات فعلًا.
- **نسيان الحفظ.** كل إجراء قائمة يُعدل القائمة في الذاكرة؛ تحطم في منتصف الجلسة يفقد كل شيء منذ آخر `save_grants`. الإصلاح: احفظ بعد كل إجراء مُعدِّل (خيار 5 في القائمة يفعل هذا)، وفكّر في الحفظ قبل قبول نفقة.
- **تخزين datetimes في JSON.** `datetime` غير قابل للتسلسل إلى JSON (تحصل على `TypeError` عند الحفظ) ويتحول إلى سلسلة سيئة عند إعادة التحميل. الإصلاح: خزّن سلاسل ISO من البداية (الخطوة 1) وحلل إلى `datetime` داخل الدوال التي تحتاج حساب تواريخ حقيقيًا فقط.

## ما بنيته للتو

متتبع طلبات منح عامل: القواميس المتداخلة تنمذج كل مقترح، و`add_expense` تفرض حدود الميزانية وقت الكتابة، و`datetime` تحوّل المواعيد إلى لوحة مرتبة بالإلحاح، وJSON مع CSV يجعلان البيانات دائمة وقابلة للترابط. المهارة القابلة للنقل هي *انضباط نمذجة البيانات والاستمرارية*: تمثيل كيان عالمي حقيقي كبيانات متداخلة، وحراسة حثالاته، ونقله بين الذاكرة والقرص — نهاية التشكيل نفسه وراء دفاتر الاتصال وأنظمة الطلبات وأدوات المخزون.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/grant-tracker/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/grant-tracker) في مستودع الدورة يحوي السكريبت الكامل بسير عمل حالة وتقرير عبء عمل الفريق مضمّنين. استنسخه، أو افتح المستودع كله في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وشغّله من هناك.
:::

## إلى أين تذهب من هنا

- أضف **سير عمل حالة** فتمضي المنح في ترتيب قانوني — `draft` ← `submitted` ← `review` ← `funded`/`rejected`. قاموس `VALID_TRANSITIONS` (مفتاح لكل حالة، القيم = الخطوات المسموحة التالية) هو المواصفة كلها؛ ويرفض المتتبع بعدها القفزات غير القانونية كموظف برامج متشكك.
- ابنِ **تقرير عبء عمل الفريق** يعدّ المنح وإجمالي الميزانية المُدارة لكل عضو — إضافة `Counter` واحدة إلى دالة ملخص الخطوة 2، وهي فعلًا كيف يرصد المكتب زميلًا محمَّلًا فوق طاقته.
- أرسل **تذكيرات بريد إلكتروني** للمواعيد المقتربة بـ`smtplib` — لديك أصلًا `upcoming_deadlines()` تنتج بالضبط القائمة التي يحتاجها عمل تذكير. التلميح الصغير: `smtplib` يحتاج بيانات اعتماد وخادمًا حقيقيًا أو تجريبيًا، فأطلقه على خادم SMTP محلي أولًا.
- استبدل مخزن JSON بـ`sqlite3` متى تعقدت الاستعلامات (تصفية بالجهة الممولة إضافةً إلى الحالة). يصير `load_grants` جملة `SELECT`، وكل ما يليه — كل دالة فوقه — يبقى كما هو بالضبط.

## شارك مشروعك مع الصف

بنيت شيئًا تفتخر به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع قدّمها طلاب آخرون — وملف README فيه جولة كاملة صديقة للمبتدئين لإضافة مشروعك عبر **طلب سحب**، حتى لو لم تستخدم git من قبل: استنساخ المستودع، وإنشاء فرع، والالتزام بملفاتك، وفتح الـPR، خطوة بخطوة. لا تُفترض أي خبرة git سابقة.

مرحبًا بك في إدارة البيانات كمكتب أبحاث. 🎓