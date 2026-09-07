---
title: "متتبع النفقات"
description: "تتبع النفقات مع الفئات والميزانيات ومسح الإيصالات والتقارير المالية."
difficulty: "beginner"
estimatedMinutes: 50
xpReward: 50
tags: ["pandas", "matplotlib", "data-analysis", "visualization"]
prerequisites:
  - "أساسيات Python (المتغيرات والحلقات والدوال والقواميس)"
  - "أساسيات pandas (DataFrames, groupby)"
  - "أساسيات matplotlib"
learningObjectives:
  - "نمذجة البيانات المالية بقواميس وقوائم Python"
  - "تحويل البيانات الخام إلى إطارات بيانات pandas للتحليل"
  - "تجميع النفقات وفرزها حسب الفئة والشهر"
  - "بناء نظام تنبيه ميزانية قائم على عتبات"
  - "إنشاء رسوم بيانية أعمدة ورسوم دائرية باستخدام matplotlib"
  - "حفظ البيانات إلى CSV وإعادة تحميلها عبر الجلسات"
---

# 💰 متتبع النفقات

تتبع إنفاقك، والتزم بالميزانيات، وتصوّر أين تذهب أموالك — كل ذلك من سطر الأوامر. يأخذك هذا المشروع من قواميس Python الخام عبر تحليل pandas إلى رسوم matplotlib البيانية، بانيًا أداة عملية يمكنك استخدامها فعلًا لإدارة أموالك.

هذا اختياري وغير مُقيَّم. راجع [مشاريع من العالم الحقيقي](/docs/projects) للاطلاع على القائمة الكاملة.

## 🎯 ما ستفعله

1. تعرّف نموذج بيانات للنفقات والميزانيات باستخدام قواميس وقوائم Python عادية.
2. تكتب دوالًا لتسجيل نفقات جديدة بتواريخ ومبالغ وفئات وأوصاف.
3. تحول بيانات النفقات إلى إطار بيانات pandas وتحسب ملخصات لكل فئة وشهرية.
4. تبني نظام تنبيه ميزانية يعلّم تجاوز الإنفاق بعتبات قابلة للتهيئة.
5. تولّد رسومًا بيانية أعمدة ودائرية تُظهر أين تذهب أموالك.
6. تحفظ النفقات إلى ملف CSV وتحملها مجددًا عبر الجلسات.
7. تصقل كل ذلك في CLI تفاعلي بقائمة ومخرجات ملوّنة والتحقق من المدخلات.

## أين تُشغّل هذا

- **محليًا باستخدام `uv` (موصى به).** يستخدم هذا المشروع `pandas` و`matplotlib`، لذا التثبيت المحلي هو المسار الأسهل. قسم الإعداد أدناه يوضح ذلك.
- **ملعب JupyterLite.** الصق خلايا الكود مباشرة في دفتر — يعمل جيدًا لاستكشاف خطوات التحليل (2–5)، رغم أن قائمة CLI (الخطوة 7) مصمَّمة لطرفية حقيقية.
- **Google Colab.** افتح دفترًا جديدًا والصق الخلايا. نفس التحفظ كما في JupyterLite: تعمل CLI التفاعلية أفضل في طرفية حقيقية.

## الإعداد

`uv` أداة واحدة تحل محل السلسلة المعتادة "ثبّت Python، ثم pip، ثم بيئة افتراضية" — يمكنها تثبيت وإدارة إصدارات Python إلى جانب تبعيات مشروعك.

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
uv init expense-tracker
cd expense-tracker
uv add pandas matplotlib
```

يتولى `pandas` تحليل البيانات (DataFrames، groupby، التجميعات) بينما يولد `matplotlib` الرسوم. وكل ما عداهما هو Python بالمكتبة القياسية.

## الخطوة 1: عرّف نموذج البيانات

قبل كتابة أي دوال، قرر كيف تعيش النفقات والميزانيات في الذاكرة. كل نفقة قاموس بأربعة حقول — التاريخ، المبلغ، الفئة، والوصف. وقائمة تحمل كل النفقات. وقاموس منفصل يربط كل فئة بحد ميزانيتها الشهري.

### 1.1 أنشئ الحاويتين الفارغتين

**👟 تلميح البداية :** استورد `pandas` و`date` من `datetime`. أنشئ قائمة فارغة اسمها `expenses` وقاموسًا اسمه `budgets` بأربع فئات: groceries وtransport وdining وentertainment. اختر مبالغ بالدولار معقولة لكل ميزانية.

```python
import pandas as pd
from datetime import date

expenses = []
budgets = {
    "groceries": 500,
    "transport": 200,
    "dining": 300,
    "entertainment": 150,
}
```

**🎯 الناتج المتوقع :** لا مخرجات مرئية بعد — أنشأت حاويتين فارغتين للتو. تشغيل `print(expenses)` يعطي `[]` و`print(budgets)` يُظهر الفئات الأربع بحدودها.

**🩹 إذا لم يعمل :** إذا حصلت على `NameError` على `pd`، فتأكد من أن `import pandas as pd` في أعلى الخلية أو السكربت. إذا أظهر `budgets` قاموسًا فارغًا، فتحقق من أنك أدرجت النقطتين الرأسيتين بين أسماء الفئات والمبالغ.

### 1.2 افهم بنية النفقة

كل نفقة تسجّلها ستكون قاموسًا يبدو هكذا:

```python
{
    "date": "2026-09-06",
    "amount": 42.50,
    "category": "groceries",
    "description": "Weekly farmer's market",
}
```

يُخزَّن `date` كسلسلة بصيغة ISO (`YYYY-MM-DD`) بحيث تُرتَّب بشكل صحيح. و`amount` رقم عشري مدوَّر إلى منزلتين. و`category` دائمًا بأحرف سفلية للاتساق. و`description` نص حر.

**✅ قائمة التحقق**

- ✅ `expenses` قائمة فارغة `[]`.
- ✅ `budgets` له أربعة مفاتيح: `"groceries"` و`"transport"` و`"dining"` و`"entertainment"`.
- ✅ يمكنك شرح ما يمثله كل حقل في قاموس نفقة.

---

## الخطوة 2: أضف النفقات

اكتب دالة تأخذ مبلغًا وفئة ووصفًا، وتبني قاموس نفقة، وتلحقه بالقائمة. تضمّن تطبيع التاريخ وتحققًا أساسيًا.

### 2.1 اكتب دالة `add_expense`

**👟 تلميح البداية :** عرّف `add_expense(amount, category, description)` يلحق قاموسًا بـ `expenses`. استخدم `date.today().isoformat()` للتاريخ. دوّر المبلغ إلى منزلتين عشريتين. اجعل الفئة بأحرف سفلية. اطبع رسالة تأكيد بعد كل إضافة.

```python
def add_expense(amount: float, category: str, description: str) -> None:
    expenses.append({
        "date": date.today().isoformat(),
        "amount": round(amount, 2),
        "category": category.lower(),
        "description": description,
    })
    print(f"Added: ${amount:.2f} in {category}")
```

### 2.2 اختبرها ببيانات نموذجية

**👟 تلميح البداية :** استدعِ `add_expense` أربع مرات بمبالغ وفئات وأوصاف مختلفة. ثم اطبع قائمة `expenses` لتأكيد وجود الأربع جميعها.

```python
add_expense(42.50, "groceries", "Weekly farmer's market")
add_expense(15.00, "transport", "Bus pass top-up")
add_expense(28.00, "dining", "Lunch with colleague")
add_expense(55.00, "groceries", "Pantry restock")
```

**🎯 الناتج المتوقع :**

```
Added: $42.50 in groceries
Added: $15.00 in transport
Added: $28.00 in dining
Added: $55.00 in groceries
```

طباعة `expenses` تُظهر قائمة من أربعة قواميس، ولكلٍّ مفاتيح `date` و`amount` و`category` و`description`.

**🩹 إذا لم يعمل :** إذا لم تظهر الفئة بأحرف سفلية في المخرجات، فتأكد من استدعاء `.lower()` على الإدخال — هذا يمنع `"Groceries"` و`"groceries"` من أن يصبحا فئتين منفصلتين. إذا أظهر التاريخ تاريخ اليوم رغم إدخالك تاريخًا مختلفًا، فهذا متوقع: الدالة تختم دائمًا التاريخ الحالي.

### 2.3 تحقّق من البيانات

**✅ قائمة التحقق**

- ✅ أربع نفقات في القائمة بعد استدعاء `add_expense` أربع مرات.
- ✅ لكل نفقة كل المفاتيح الأربعة: `date` و`amount` و`category` و`description`.
- ✅ الفئة بأحرف سفلية بغض النظر عن طريقة كتابتك لها.
- ✅ المبلغ مدوَّر إلى منزلتين عشريتين.

**🤔 سؤال (أسئلة) سقراطي(ة)**

لماذا تجعل الفئة بأحرف سفلية داخل الدالة بدلًا من مطالبة المُستدعي بكتابتها كذلك؟ ماذا سيحدث لتحليل `groupby` في الخطوة 3 إذا عُدَّت `"Groceries"` و`"groceries"` فئتين منفصلتين؟

---

## الخطوة 3: حوّل إلى إطار بيانات وحلّل

قوائم القواميس الخام جيدة للتسجيل، لكن التحليل الحقيقي يحتاج pandas. حوّل القائمة إلى إطار بيانات، ثم استخدم `groupby` لحساب الإجماليات لكل فئة والملخصات الشهرية.

### 3.1 ابنِ إطار البيانات

**👟 تلميح البداية :** مرّر قائمة `expenses` مباشرة إلى `pd.DataFrame()`. اطبع النتيجة بـ `to_string(index=False)` لمخرجات نظيفة — بلا أرقام صفوف تلوّث العرض.

```python
df = pd.DataFrame(expenses)
print("All expenses:")
print(df.to_string(index=False))
```

**🎯 الناتج المتوقع :**

```
All expenses:
       date  amount    category                description
 2026-09-06   42.50   groceries  Weekly farmer's market
 2026-09-06   15.00   transport          Bus pass top-up
 2026-09-06   28.00      dining      Lunch with colleague
 2026-09-06   55.00   groceries          Pantry restock
```

**🩹 إذا لم يعمل :** إذا رأيت إطار بيانات فارغًا مع `RangeIndex(start=0, stop=0, step=0)`، فقائمة `expenses` فارغة — لم تستدعِ `add_expense` بعد في هذه الجلسة. إذا بدت أسماء الأعمدة خاطئة، فتحقق من أن قواميس نفقاتك تستخدم بالضبط `"date"` و`"amount"` و`"category"` و`"description"` كمفاتيح.

### 3.2 احسب الإجماليات لكل فئة

**👟 تلميح البداية :** استخدم `df.groupby("category")["amount"].sum()` للحصول على سلسلة يكون فيها المؤشر اسم الفئة والقيم إجمالي الإنفاق. اطبعها.

```python
category_totals = df.groupby("category")["amount"].sum()
print("\nSpending by category:")
print(category_totals)
```

**🎯 الناتج المتوقع :**

```
Spending by category:
category
groceries     97.50
dining        28.00
transport     15.00
```

**🩹 إذا لم يعمل :** إذا حصلت على `KeyError`، فلا يطابق اسم العمود — تحقق من أخطاء الكتابة مثل `"cat"` بدلًا من `"category"`. إذا بدت الإجماليات خاطئة، فتأكد من مرور `["amount"]` قبل `.sum()` — بدونها تحاول جمع كل عمود عددي، الذي قد يتضمن بيانات غير متوقعة.

### 3.3 أضف الملخصات الشهرية

**👟 تلميح البداية :** حوّل عمود `date` إلى datetime بـ `pd.to_datetime()`، ثم استخرج فترة الشهر بـ `.dt.to_period("M")`. جمّع عليها واجمع.

```python
df["date"] = pd.to_datetime(df["date"])
monthly = df.groupby(df["date"].dt.to_period("M"))["amount"].sum()
print("\nMonthly totals:")
print(monthly)
```

**🎯 الناتج المتوقع :** إذا كانت كل النفقات من سبتمبر 2026، سترى صفًّا واحدًا:

```
Monthly totals:
date
2026-09    140.5
```

**🩹 إذا لم يعمل :** `TypeError` على `pd.to_datetime` تعني أن سلاسل التاريخ ليست بصيغة معروفة — عُد إلى `add_expense` واكد أنك تستخدم `date.today().isoformat()`. إذا لم تظهر تواريخ من أشهر مختلفة منفصلة، فبياناتك التجريبية كلها من نفس الشهر — أضف نفقة بتاريخ مختلف للاختبار.

### 3.4 تحقّق من التحليل

**✅ قائمة التحقق**

- ✅ لـ `df` أربعة أعمدة بالضبط: `date` و`amount` و`category` و`description`.
- ✅ مجموع `category_totals` يساوي نفس إجمالي جمع كل المبالغ يدويًا.
- ✅ الملخصات الشهرية تجمع النفقات بشكل صحيح بالشهر-السنة.
- ✅ لا تظهر الفئات الفارغة في مخرجات groupby.

**🤔 سؤال (أسئلة) سقراطي(ة)**

ماذا سيخبرك `df.groupby("category")["amount"].mean()` أن `.sum()` لا يخبرك به؟ ومتى يهم متوسط الإنفاق لكل نفقة أكثر من إجمالي الإنفاق؟

---

## الخطوة 4: تنبيهات الميزانية

تحليل الإنفاق مثير للاهتمام، لكن متتبع الميزانية يحتاج إلى *تحذيرك* عندما تكون على وشك تجاوز الإنفاق. افحص كل فئة مقابل حد ميزانيتها واطبع التنبيهات عند عتبة قابلة للتهيئة.

### 4.1 اكتب دالة `check_budgets`

**👟 تلميح البداية :** عرّف `check_budgets(spending, budgets, threshold=0.8)` تحلّق على كل فئة في `budgets`، وتبحث عمّا أُنفق، وتحسب النسبة، وتطبع سطر حالة: OK إذا كانت تحت العتبة، وWARNING إذا كانت بين العتبة و100%، وOVER BUDGET إذا تجاوزت.

```python
def check_budgets(spending: dict, budgets: dict, threshold: float = 0.8) -> None:
    for category, limit in budgets.items():
        spent = spending.get(category, 0)
        pct = spent / limit if limit else 0
        if pct >= 1.0:
            print(f"  OVER BUDGET: {category} — ${spent:.0f} / ${limit:.0f}")
        elif pct >= threshold:
            print(f"  WARNING: {category} — ${spent:.0f} / ${limit:.0f} ({pct:.0%})")
        else:
            print(f"  OK: {category} — ${spent:.0f} / ${limit:.0f}")
```

### 4.2 شغّلها على بياناتك

**👟 تلميح البداية :** حوّل `category_totals` إلى قاموس بـ `.to_dict()` ومرّره إلى `check_budgets` مع `budgets`.

```python
print("Budget status:")
check_budgets(category_totals.to_dict(), budgets)
```

**🎯 الناتج المتوقع** (مع البيانات النموذجية):

```
Budget status:
  OK: groceries — $97 / $500
  OK: transport — $15 / $200
  OK: dining — $28 / $300
  OK: entertainment — $0 / $150
```

أضف نفقة أكبر لترى التحذير:

```python
add_expense(450.00, "groceries", "Big grocery run")
check_budgets(
    pd.DataFrame(expenses).groupby("category")["amount"].sum().to_dict(),
    budgets,
)
```

الآن تُظهر groceries تحذيرًا WARNING عند 90% ($547 / $500). تجاوز الحد فيُطبع OVER BUDGET.

**🩹 إذا لم يعمل :** إذا أظهرت كل الفئات `OK` حتى مع إنفاق كثيف، فتحقق من أنك تمرر قاموس الإجماليات *المجمَّعة* لا قائمة النفقات الخام. إذا حصلت على `ZeroDivisionError`، فأحد حدود ميزانيتك صفر — كل فئة في `budgets` تحتاج حدًّا موجبًا.

### 4.3 اختبر العتبة

**✅ قائمة التحقق**

- ✅ فئة تحت 80% من ميزانيتها تُظهر "OK".
- ✅ فئة بين 80% و100% تُظهر "WARNING" مع النسبة.
- ✅ فئة فوق 100% تُظهر "OVER BUDGET".
- ✅ الفئات غير الموجودة في قاموس الإنفاق (مثل `entertainment` بصفر إنفاق) تُظهر "OK" عند 0%.

**🤔 سؤال (أسئلة) سقراطي(ة)**

لماذا يكون 80% افتراضيًا عتبة التحذير؟ أي أنواع النفقات قد تحتاج عتبة أدنى (مثل 50%) مقابل أعلى (90%)؟ وكيف تترك المستخدمين يضبطون عتبات لكل فئة بدلًا من عتبة عالمية واحدة؟

---

## الخطوة 5: صوّر الإنفاق

الأرقام في جدول مفيدة، لكن الرسوم تجعل أنماط الإنفاق واضحة فورًا. ابنِ رسم أعمدة لإجماليات الفئات ورسمًا دائريًا للنسب — جنبًا إلى جنب في شكل واحد.

### 5.1 أنشئ الرسوم جنبًا إلى جنب

**👟 تلميح البداية :** استورد `matplotlib.pyplot`. استخدم `plt.subplots(1, 2, figsize=(12, 5))` لإنشاء محورين. ارسم رسم أعمدة على اليسار ورسمًا دائريًا على اليمين. احفظ الشكل بـ `savefig`.

```python
import matplotlib.pyplot as plt

fig, axes = plt.subplots(1, 2, figsize=(12, 5))

# Bar chart
colors = ["#2ecc71", "#3498db", "#e74c3c", "#f39c12"]
category_totals.plot(kind="bar", ax=axes[0], color=colors[:len(category_totals)])
axes[0].set_title("Spending by Category")
axes[0].set_ylabel("Amount ($)")
axes[0].tick_params(axis="x", rotation=45)

# Pie chart
category_totals.plot(kind="pie", ax=axes[1], autopct="%1.1f%%", startangle=90)
axes[1].set_title("Spending Distribution")
axes[1].set_ylabel("")

plt.tight_layout()
plt.savefig("spending_report.png", dpi=150)
plt.show()
print("Chart saved to spending_report.png")
```

**🎯 الناتج المتوقع :** تفتح نافذة (أو صورة مضمنة في دفتر) تُظهر رسمين: رسم أعمدة على اليسار بعمود واحد لكل فئة، ورسمًا دائريًا على اليمين يُظهر التفكيكات بالنسب. يظهر ملف اسمه `spending_report.png` في دليل عملك.

**🩹 إذا لم يعمل :** إذا أظهر الرسم الدائري تسميات متداخلة، فزد `figsize` إلى `(14, 6)` أو قلّل حجم الخط بـ `plt.rcParams["font.size"] = 10` قبل الرسم. إذا حفظ `savefig` صورة فارغة، فتأكد من أن `plt.show()` يأتي *بعد* `savefig` — بعض الواجهات الخلفية تمسح الشكل عند `show()`. إذا حصلت على `IndexError` على `colors[:len(category_totals)]`، فبيانات إنفاقك فيها فئات أكثر من الألوان — أضف رموز hex أخرى للقائمة.

### 5.2 خصّص المظهر

**👟 تلميح البداية :** أضف عنوانًا للشكل بـ `fig.suptitle("September 2026 Spending Report", fontsize=14)`. استخدم `plt.tight_layout(rect=[0, 0, 1, 0.95])` لإفساح مجال للعنوان.

```python
fig.suptitle("September 2026 Spending Report", fontsize=14, fontweight="bold")
plt.tight_layout(rect=[0, 0, 1, 0.95])
plt.savefig("spending_report.png", dpi=150, bbox_inches="tight")
plt.show()
```

### 5.3 تحقّق من الرسوم

**✅ قائمة التحقق**

- ✅ رسم الأعمدة فيه عمود واحد لكل فئة مع تسميات على محور x.
- ✅ الرسم الدائري يُظهر تسميات النسب (مثل "69.4%") على كل شريحة.
- ✅ حُفظ ملف PNG على القرص وهو غير فارغ.
- ✅ الرسوم قابلة للقراءة — لا نص متداخل ولا تسميات مقتطعة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

متى يكون رسم الأعمدة أكثر فائدة من الرسم الدائري، والعكس؟ ماذا يحدث للرسم الدائري إذا هيمنت فئة واحدة على 95% من الإنفاق — هل ما زال بإمكانك قراءة الشرائح الأصغر؟

---

## الخطوة 6: احفظ البيانات وحمّلها

تختفي نفقاتك عند خروج البرنامج. أصلح ذلك بالكتابة إلى ملف CSV على القرص وتحميلها مجددًا عند الإقلاع.

### 6.1 احفظ النفقات إلى CSV

**👟 تلميح البداية :** اكتب `save_expenses(df, filename)` تستدعي `df.to_csv(filename, index=False)`. استخدام `index=False` يمنع pandas من كتابة أرقام صفوف تلوّث الملف.

```python
def save_expenses(df: pd.DataFrame, filename: str = "expenses.csv") -> None:
    df.to_csv(filename, index=False)
    print(f"Saved {len(df)} expenses to {filename}")
```

**🎯 الناتج المتوقع :** استدعاء `save_expenses(df)` يكتب `expenses.csv` ويطبع `Saved 4 expenses to expenses.csv`. ملف CSV فيه صف عنوان متبوعًا بصف واحد لكل نفقة.

### 6.2 حمّل النفقات من CSV

**👟 تلميح البداية :** اكتب `load_expenses(filename)` تفحص هل الملف موجود أولًا. إذا كان موجودًا، اقرأه بـ `pd.read_csv` وحلّل عمود التاريخ. وإلا، أرجع إطار بيانات فارغًا بالأعمدة الصحيحة.

```python
from pathlib import Path

def load_expenses(filename: str = "expenses.csv") -> pd.DataFrame:
    path = Path(filename)
    if not path.exists():
        print(f"No existing data found — starting fresh.")
        return pd.DataFrame(columns=["date", "amount", "category", "description"])
    df = pd.read_csv(filename, parse_dates=["date"])
    print(f"Loaded {len(df)} expenses from {filename}")
    return df
```

**🎯 الناتج المتوقع :** في أول تشغيل (بلا CSV بعد): `No existing data found — starting fresh.` وفي التشغيلات اللاحقة: `Loaded 4 expenses from expenses.csv`.

**🩹 إذا لم يعمل :** إذا حصلت على `ParserError` على `pd.read_csv`، فملف CSV فيه صفوف تالفة — افتحه في محرر نصوص لفحص الفواصل الشاردة أو الاقتباسات المكسورة. إذا ظهرت التواريخ كسلاسل بدلًا من كائنات datetime، فتأكد من تضمين `parse_dates=["date"]`. إذا كان الملف موجودًا لكن `load_expenses` أرجع إطار بيانات فارغًا، فمسار الملف خاطئ — شغّل سكربتك من نفس الدليل الذي حفظت فيه CSV.

### 6.3 تحقّق من الاستمرارية

**✅ قائمة التحقق**

- ✅ بعد الحفظ، يوجد `expenses.csv` ويحتوي صف العنوان زائد صفوف البيانات.
- ✅ بعد التحميل، لإطار البيانات نفس البيانات التي حفظتها.
- ✅ عدم وجود ملف CSV لا ينهار البرنامج — يبدأ من جديد بأمان.
- ✅ تُحلَّل التواريخ ككائنات datetime بعد التحميل، لا سلاسل نصية.

---

## الخطوة 7: اصقل CLI

اجمع كل شيء في نظام قائمة تفاعلي. يختار المستخدم أفعالًا من قائمة مرقّمة، ويُتحقق من المدخلات قبل المعالجة، وتبدو التجربة مصقولة.

### 7.1 ابنِ حلقة القائمة

**👟 تلميح البداية :** اكتب دالة `main()` تحمّل البيانات المحفوظة عند الإقلاع، ثم تحلّق: اطبع قائمة، واقرأ اختيار المستخدم، ووجّه إلى الدالة الصحيحة، واحفظ بعد كل تغيير. استخدم حلقة `while True` تنكسر عند خيار "الخروج".

```python
def show_menu() -> None:
    print("\n=== Expense Tracker ===")
    print("1. Add expense")
    print("2. View all expenses")
    print("3. Spending by category")
    print("4. Monthly summary")
    print("5. Budget status")
    print("6. Generate chart")
    print("7. Quit")

def view_expenses(df: pd.DataFrame) -> None:
    if df.empty:
        print("No expenses recorded yet.")
        return
    print(df.to_string(index=False))

def show_category_summary(df: pd.DataFrame) -> None:
    if df.empty:
        print("No expenses to summarize.")
        return
    totals = df.groupby("category")["amount"].sum().sort_values(ascending=False)
    print("\nSpending by category:")
    for cat, amt in totals.items():
        print(f"  {cat:15s} ${amt:>8.2f}")

def show_monthly_summary(df: pd.DataFrame) -> None:
    if df.empty:
        print("No expenses to summarize.")
        return
    monthly = df.groupby(df["date"].dt.to_period("M"))["amount"].sum()
    print("\nMonthly totals:")
    for period, amt in monthly.items():
        print(f"  {period}  ${amt:.2f}")
```

### 7.2 اربط التحقق من المدخلات

**👟 تلميح البداية :** عندما يضيف المستخدم نفقة، تحقق أن المبلغ رقم موجب والفئة ليست فارغة. أعد طلب الإدخال على المدخلات الخاطئة بدلًا من الانهيار.

```python
def get_valid_amount() -> float:
    while True:
        try:
            amt = float(input("Amount: $"))
            if amt <= 0:
                print("  Amount must be positive.")
                continue
            return round(amt, 2)
        except ValueError:
            print("  Please enter a valid number.")

def get_valid_category() -> str:
    while True:
        cat = input("Category: ").strip().lower()
        if cat:
            return cat
        print("  Category cannot be empty.")
```

### 7.3 جمّع دالة `main()` كاملة

**👟 تلميح البداية :** حمّل البيانات في `df` عام عند الإقلاع. بعد كل فعل يعدّل البيانات، أعد حساب `df` واحفظه. تستمر القائمة حتى يختار المستخدم الخروج.

```python
def main() -> None:
    global expenses, df
    df = load_expenses()
    expenses = df.to_dict("records")

    while True:
        show_menu()
        choice = input("Choose (1-7): ").strip()

        if choice == "1":
            amt = get_valid_amount()
            cat = get_valid_category()
            desc = input("Description: ").strip()
            add_expense(amt, cat, desc)
            expenses = df.to_dict("records")
            expenses.append({
                "date": date.today().isoformat(),
                "amount": amt,
                "category": cat,
                "description": desc,
            })
            df = pd.DataFrame(expenses)
            df["date"] = pd.to_datetime(df["date"])
            save_expenses(df)
        elif choice == "2":
            view_expenses(df)
        elif choice == "3":
            show_category_summary(df)
        elif choice == "4":
            show_monthly_summary(df)
        elif choice == "5":
            print("\nBudget status:")
            check_budgets(
                df.groupby("category")["amount"].sum().to_dict(),
                budgets,
            )
        elif choice == "6":
            if df.empty:
                print("No data to chart yet.")
            else:
                category_totals = df.groupby("category")["amount"].sum()
                fig, axes = plt.subplots(1, 2, figsize=(12, 5))
                colors = ["#2ecc71", "#3498db", "#e74c3c", "#f39c12", "#9b59b6"]
                category_totals.plot(kind="bar", ax=axes[0], color=colors[:len(category_totals)])
                axes[0].set_title("Spending by Category")
                axes[0].set_ylabel("Amount ($)")
                axes[0].tick_params(axis="x", rotation=45)
                category_totals.plot(kind="pie", ax=axes[1], autopct="%1.1f%%", startangle=90)
                axes[1].set_title("Spending Distribution")
                axes[1].set_ylabel("")
                plt.tight_layout()
                plt.savefig("spending_report.png", dpi=150)
                plt.show()
                print("Chart saved to spending_report.png")
        elif choice == "7":
            print("Goodbye!")
            break
        else:
            print("Invalid choice — pick 1 through 7.")

if __name__ == "__main__":
    main()
```

**🎯 الناتج المتوقع :** البرنامج يطبع قائمة مرقّمة، ويقبل اختيارك، وينفذ الفعل، ويعود إلى القائمة. إضافة نفقة تحدّث CSV فورًا. المدخلات غير الصالحة (أحرف حيث يُتوقع رقم، فئة فارغة) تطبع خطأً وتعيد طلب الإدخال.

**🩹 إذا لم يعمل :** إذا حصلت على `UnboundLocalError`، فإعلان `global df` ناقص أو `df` غير مهيَّأ قبل حلقة القائمة. إذا أنتج الحفظ CSV فارغًا، فتأكد من استدعاء `save_expenses(df)` *بعد* الإلحاق بالقائمة وإعادة بناء إطار البيانات، لا قبله.

### 7.4 شغّل البرنامج كاملًا

**✅ قائمة التحقق**

- ✅ القائمة تُطبع عند الإقلاع وتعود للظهور بعد كل فعل.
- ✅ إضافة نفقة تحدّث `expenses.csv` فورًا.
- ✅ المبالغ غير الرقمية والفئات الفارغة تُرفض برسالة واضحة.
- ✅ الخروج من البرنامج وإعادة تشغيله يحمّل نفقات الجلسة السابقة.
- ✅ كل خيارات القائمة السبعة تعمل دون أخطاء.

---

## ⚠️ مآزق شائعة

- **نسيان الحفظ بعد التغييرات.** إذا عدّلت `expenses` أو `df` لكن لم تستدعِ `save_expenses`، فلا يكون CSV محدَّثًا. احفظ دائمًا مباشرة بعد عملية تغيّر البيانات — لا فقط عند خروج البرنامج — بحيث لا يفقد انهيار أو Ctrl+C سوى الفعل الحالي.
- **خلط سلسلة التاريخ بـ datetime.** التحميل من CSV دون `parse_dates=["date"]` يعطيك سلاسل مثل `"2026-09-06"` بدلًا من كائنات datetime. استدعاء `.dt.to_period("M")` في الملخص الشهري سينهار بـ `TypeError` على السلاسل.
- **حالة أحرف الفئة غير المتسقة.** إذا ظهرت `"Groceries"` و`"groceries"` كلتاهما في البيانات، يعاملهما `groupby` كفئتين منفصلتين. اجعل الفئة بأحرف سفلية دائمًا داخل `add_expense`، لا في موضع الاستدعاء.
- **رسم دائري بعدد فئات كبير.** مع 10+ فئات، يصبح الرسم الدائري غير قابل للقراءة. فكّر في التصفية إلى أعلى 5 وتجميع البقية في "أخرى" للرسم الدائري، مع إبقاء رسم الأعمدة كاملًا.
- **استبدال CSV عند التحميل.** يجب أن *تقرأ* `load_expenses` الملف لا أن تكتبه. زلّة شائعة استيراد الدالة الخطأ أو استدعاء `save` داخل `load`.

## ما بنيته للتو

متتبع نفقات عامل من سطر الأوامر يسجل الإنفاق ويحلله بـ pandas ويراقب الميزانيات بتنبيهات عتبات ويولّد رسومًا بـ matplotlib ويحفظ كل شيء إلى ملف CSV. نمذجت بيانات مالية بقواميس Python عادية، وحوّلتها إلى إطارات بيانات للتحليل، وبنيت خطوط تجميع بـ `groupby`، ونفّذت منطق تنبيه قائمًا على عتبات، وأنشأت رسومًا بجودة النشر — كلها مهارات عملية تنتقل مباشرة إلى عمل تحليل مالي حقيقي.

## إلى أين تذهب من هنا

- **إسقاطات النفقات المتكررة.** أضف حقل `recurring` (أسبوعي، شهري، لا شيء) لكل نفقة واسقط إجمالي الإنفاق للأشهر الثلاثة القادمة بناءً على الإدخالات المتكررة.
- **توصيات الفئات.** عندما يكتب مستخدم وصفًا، افحص النفقات المسجلة سابقًا واقترح الفئة الأكثر شيوعًا للوصوفات المتشابهة باستخدام مطابقة سلاسل بسيطة.
- **متتبع أهداف الادخار.** أضف هدف ادخار شهري (مثلًا $1000). بعد كل نفقة تُسجَّل، اطبع كم المتبقي للإنفاق مع بقاء الهدف قائمًا.
- **استيراد كشف حساب بنكي.** اقرأ تصديرات CSV من بنكك وصفّف المعاملات تلقائيًا بناءً على أنماط الوصف.
- **واجهة GUI بـ tkinter.** لُفَّ نفس المنطق في واجهة سطح مكتب بحقول إدخال وأزرار وقماش رسم مضمّن.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓