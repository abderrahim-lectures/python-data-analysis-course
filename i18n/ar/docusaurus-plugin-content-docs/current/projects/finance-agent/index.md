---
id: 2027-finance-agent
title: "بناء وكيل مالي شخصي"
sidebar_label: "بناء وكيل مالي شخصي"
slug: /projects/finance-agent
description: "صنّف ملف CSV مصرفي مُصدَّر وحدد شذوذ الإنفاق، بدمج معالجة بيانات pandas مع وكيل نموذج لغوي يستدعي أدوات للتصنيف الذكي."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 بناء وكيل مالي شخصي

<ProjectPublishedDate projectId="2027-finance-agent" />

<ProjectGreeting />

يفترض هذا المشروع أنك مرتاح مع Python 101، ويعتمد على أفكار من مشروعين آخرين من مشاريع العالم الحقيقي دون اشتراط أي منهما بصرامة: تنظيف بيانات pandas بمستوى مقارب لـ[درّب أول نموذج تعلّم آلي لك](/docs/projects/ml-classifier) (تحميل CSV، التعامل مع أعمدة فوضوية)، ونمط وكيل استدعاء الأدوات من [بناء وكيل ذكاء اصطناعي](/docs/projects/ai-agent) (نموذج لغوي يقرر استدعاء دوال بايثون الخاصة بك بدلًا من مجرد الرد بنص). رؤية أي منهما يساعد، لكن الخطوات أدناه تعيد شرح ما تحتاجه أثناء المضي.

هذا اختياري وغير مُقيَّم — مناسب بمجرد إنهائك Python 101. راجع [مشاريع من العالم الحقيقي](/docs/projects) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. تحميل وتنظيف ملف CSV مصرفي نموذجي مُصدَّر بـpandas.
2. بناء مُصنِّف أساسي سريع قائم على القواعد — ورؤية بالضبط أين تنفد قواعد الكلمات المفتاحية.
3. بناء أداة وكيل نموذج لغوي تصنّف المعاملات التي لم تستطع القواعد وسمها بثقة، وتشرح منطقها.
4. تحديد المعاملات غير الاعتيادية إحصائيًا (شراء كبير بشكل غير معتاد مقارنة بالإنفاق النموذجي لتلك الفئة) وجعل الوكيل يلخّص ما وجده بلغة إنجليزية بسيطة.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الذي تتبعه خطوات هذا الدرس، والموصى به — Python فعلي على جهازك الخاص، تمامًا كأي مشروع آخر في هذا القسم. يشرح قسم الإعداد أدناه كيفية تثبيته.

**GitHub Codespaces** بديل بلا إعداد: افتح [مستودع الدورة كاملًا في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython وuv مثبّتة بالفعل، وفق `.devcontainer/devcontainer.json` الخاص بالمستودع) وشغّل نفس أوامر `uv` تمامًا من طرفية في تبويب متصفحك.

**Google Colab وKaggle Notebooks أو Binder** تعمل أيضًا — لا يحتاج هذا المشروع GPU، فقط pandas واستدعاء واحد لواجهة برمجية للنموذج اللغوي لكل معاملة غامضة. نسخة دفتر ملاحظات حقيقية وقابلة للتشغيل (نفس خط الأنابيب من الخطوات أدناه، تعمل على نفس ملف CSV النموذجي الاصطناعي) موجودة في [`examples/finance-agent/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/finance-agent/notebook.ipynb). انقر على شارة لتشغيله مباشرة، دون أي تثبيت محلي على الإطلاق:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/finance-agent/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/finance-agent/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Ffinance-agent%2Fnotebook.ipynb)

كن صادقًا مع نفسك بشأن المقايضة، مع ذلك: هذه طريقة أقل دقة لتجربة المشروع من مشروع `uv` محلي فعلي — بلا ملفات منفصلة، بلا بنية مشروع حقيقية، مجرد خلايا في دفتر ملاحظات. عامِلها كطريقة سريعة للتجربة، لا المسار الأساسي.

## الإعداد

### ثبّت `uv`

`uv` أداة واحدة تحل محل السلسلة المعتادة "ثبّت Python، ثم ثبّت pip، ثم ثبّت أداة بيئة افتراضية، ثم ثبّت الحزم".

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

### أعِدَّ المشروع

```bash
uv init finance-agent
cd finance-agent
uv add pandas deepagents langchain-openai python-dotenv
```

تتعامل `pandas` مع تحميل وتنظيف ملف CSV؛ `deepagents` هي إطار عمل LangChain لبناء وكلاء يستدعون أدوات؛ تتحدث `langchain-openai` مع GitHub Models (واجهته البرمجية متوافقة مع OpenAI — انظر التلميح أدناه إن اخترت مزوّدًا مختلفًا)؛ تقرأ `python-dotenv` مفتاح API الخاص بك من ملف `.env` محلي.

### احصل على مفتاح API مجاني للذكاء الاصطناعي

**اختر المزوّد الذي تفضّله** — لا يتطلب أي منها بطاقة ائتمان وقت كتابة هذا. المثال الكامل في مستودع الدورة ([`examples/finance-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/finance-agent)) يدعم الستة جاهزين للاستخدام، ويُختار بينهم بإعداد واحد.

| المزوّد | أين تحصل على مفتاح | لماذا قد تختاره |
|---|---|---|
| **GitHub Models** *(الافتراضي المقترح)* | [github.com/settings/tokens](https://github.com/settings/tokens) — رمز وصول شخصي بنطاق `models: read` | لا تسجيل منفصل — لديك حساب GitHub بالفعل. حدود مستوى مجاني أكثر سخاءً من Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | الخيار الأكثر ذكرًا شيوعًا. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | استدلال سريع، مستوى مجاني سخي، بلا بطاقة. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | واحدة من أكثر الحصص المجانية الدائمة سخاءً. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | حجم رموز يومي مرتفع، بلا بطاقة. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | واجهة برمجة واحدة، نماذج مجانية عديدة — جيدة لمقارنة المزوّدين. |

أنشئ ملف `.env` (لا ترفعه أبدًا) بمفتاح المزوّد الذي اخترته:

```bash
# .env
GITHUB_TOKEN=مفتاحك-هنا
```

:::tip[ملف .env غالبًا أكثر ملاءمة من export]
بدلًا من تنفيذ `export` لمفتاح في كل جلسة طرفية جديدة، ضعه في ملف `.env` (انظر `.env.example` الخاص بمثال المستودع) وحمّله تلقائيًا بـ`python-dotenv`، كما تفعل الخطوات أدناه.
:::

## الخطوة 1: حمّل ونظّف ملف CSV مصرفي نموذجي مُصدَّر

:::tip[لا ترسل بيانات مصرفية حقيقية وغير محجوبة إلى واجهة برمجية تابعة لجهة خارجية أبدًا]
يعمل هذا المشروع على ملف CSV نموذجي **اصطناعي** — تواريخ وهمية، أسماء تجار وهمية، مبالغ وهمية، مُرفَق في [`examples/finance-agent/transactions.csv`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/finance-agent/transactions.csv). ترسل الخطوتان 3 و4 أوصاف ومبالغ المعاملات إلى واجهة برمجية لنموذج لغوي تابعة لجهة خارجية. فعل ذلك بتصديرك المصرفي *الحقيقي* يعني أن نسخة من تاريخك المالي الفعلي — أسماء التجار، مبالغ الإنفاق، ربما أكثر إن صدّرت أعمدة إضافية — تجلس الآن على خوادم ذلك المزوّد، خاضعة لأي سياسات احتفاظ وتدريب لديه حاليًا، خارج سيطرتك تمامًا. إن كيّفت هذا يومًا لإنفاقك الحقيقي، احجب أو صنّع بيانات صناعيًا أولًا: احذف أرقام الحسابات، عمّم أسماء التجار التي تكشف شيئًا حساسًا، قرّب أو شوّش المبالغ. هذه عادة مهمة فعليًا، لا شكلية دورة — عامِل أي سكربت يستدعي واجهة برمجية خارجية كشيء سيرى كل ما تسلمه إياه.
:::

نزّل ملف CSV النموذجي، أو انسخه من [`examples/finance-agent/transactions.csv`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/finance-agent/transactions.csv) إلى مجلد مشروعك. يبدو مثل تصدير حقيقي: صف واحد لكل معاملة، تاريخ، وصف تاجر خام تمامًا كما سيطبعه بنك (مختصر، أحيانًا غامض)، ومبلغ موقَّع — سالب للمال الخارج، موجب للإيداعات.

```python
import pandas as pd

df = pd.read_csv("transactions.csv", parse_dates=["date"])
df["description"] = df["description"].str.strip()
df = df.dropna(subset=["date", "description", "amount"]).sort_values("date").reset_index(drop=True)
df.head()
```

يمنحك `parse_dates=["date"]` كائنات `Timestamp` حقيقية بدلًا من سلاسل نصية بسيطة، لذا يمكن للخطوات اللاحقة التجميع حسب الشهر أو الترتيب زمنيًا دون إعادة تحليل أي شيء. تنظّف `.str.strip()` المسافات البيضاء الشاردة التي تمتلئ بها التصديرات المصرفية الحقيقية. حذف الصفوف التي ينقصها أي من الأعمدة الثلاثة الأساسية طريقة رخيصة وصادقة للتعامل مع صف مشوَّه فعليًا دون تخمين ماذا كان يعني.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يُظهر `df["date"].dtype` نوع datetime، لا `object`.</StepChecklistItem>
<StepChecklistItem>يحتوي `df["amount"]` قيمًا سالبة (مصاريف) وموجبة (دخل) كلاهما.</StepChecklistItem>
<StepChecklistItem>لا يُظهر `df.isna().sum()` أي قيم مفقودة في `date` أو `description` أو `amount`.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

قد يتضمن تصدير مصرفي حقيقي أيضًا عمود `balance` جارٍ. لا شيء في هذا المشروع يستخدمه — لكن هل يمكنك التفكير بتحقق منطقي كنت لتجريه باستخدام `balance` لا يستطيع `date` و`description` و`amount` وحدهم إعطاءه لك؟

## الخطوة 2: ابنِ مُصنِّفًا أساسيًا قائمًا على القواعد — وشاهد حدوده

أرخص طريقة لتصنيف معاملة هي بحث عن كلمة مفتاحية: إن ظهرت `"STARBUCKS"` في الوصف، سمّها `"Dining"`. هذا سريع، مجاني، ولا يحتاج أي مفتاح API على الإطلاق — حدس جيد للجوء إليه قبل إضافة أي ذكاء اصطناعي لخط أنابيب.

```python
RULES = {
    "starbucks": "Dining",
    "trader joes": "Groceries",
    "netflix.com": "Subscriptions",
    "shell oil": "Transport",
    "pacific gas electric": "Utilities",
    # ... see examples/finance-agent/rules.py for the full list
}


def categorize_rule_based(description: str) -> str | None:
    text = description.lower()
    for keyword, category in RULES.items():
        if keyword in text:
            return category
    return None


df["category"] = df["description"].apply(categorize_rule_based)
resolved = df["category"].notna().sum()
print(f"Rule-based pass: {resolved}/{len(df)} categorized. {len(df) - resolved} left ambiguous.")
```

شغّل هذا مقابل بيانات العينة وتُصنَّف أغلبية صلبة من الصفوف فورًا. لكن انظر إلى ما تبقّى في `df[df["category"].isna()]`: أوصاف مثل `SQ *JOES COFFEE CART`، و`TST* CORNER BISTRO`، و`PAYPAL *MERCHXYZ123`، و`AMZN MKTP US*1H8KX2LP2`، و`VENMO PAYMENT JSMITH`. يتعرّف إنسان يلقي نظرة على `SQ *JOES COFFEE CART` على "coffee cart" فورًا — لكن لا يمكن لأي قائمة كلمات مفتاحية ثابتة توقّع كل بادئة معالج دفع (`SQ *`، و`TST*`، و`PAYPAL *`) أو تحويل نظير-لنظير سيحتويه تصدير مصرفي على الإطلاق. هذا قيد حقيقي وشائع للأساليب القائمة على القواعد لنص فوضوي من العالم الحقيقي، لا قيد مصطنع — إنه بالضبط الفجوة التي توجد الخطوة التالية لسدّها.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يمكنك طباعة الصفوف الدقيقة التي تركها `categorize_rule_based` كـ`None`، ورؤية لماذا كل واحد منها غامض فعليًا (بادئة معالج دفع أو تحويل P2P، لا مجرد خطأ إملائي في قاموس قواعدك).</StepChecklistItem>
<StepChecklistItem>قاومت رغبة إضافة المزيد من الكلمات المفتاحية لكل حالة فقط — حفنة من الصفوف المتبقية غير المحلولة متوقَّعة، لا خطأ لترقيعه بالقواعد.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

لو استمررت بإضافة كلمات مفتاحية إلى الأبد، هل ستستطيع في النهاية تغطية كل وصف مصرفي ممكن قد تراه شخص على الإطلاق؟ ماذا تعني إجابتك عن متى يتوقف نهج قائم على القواعد بحتة عن استحقاق الصيانة؟

## الخطوة 3: ابنِ أداة وكيل نموذج لغوي تصنّف المعاملات الغامضة

هذا هو نفس شكل استدعاء الأدوات من [بناء وكيل ذكاء اصطناعي](/docs/projects/ai-agent): دالة بايثون بتوثيق سلسلة، مُسلَّمة إلى `create_deep_agent`، يقرر النموذج استدعاءها بنفسه.

```python
import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from deepagents import create_deep_agent

load_dotenv()

CATEGORIES = [
    "Income", "Housing", "Groceries", "Dining", "Transport", "Utilities",
    "Subscriptions", "Entertainment", "Shopping", "Healthcare", "Travel", "Fees", "Other",
]


def categorize_transaction(description: str, amount: float) -> str:
    """Categorize one bank transaction the rule-based pass couldn't confidently label.

    `description` is the raw bank description string; `amount` is signed
    (negative = money out). Must return exactly one of: Income, Housing,
    Groceries, Dining, Transport, Utilities, Subscriptions, Entertainment,
    Shopping, Healthcare, Travel, Fees, Other.
    """
    # A real version of this tool could just let the model itself reason
    # about the description text and return a category directly, with no
    # body here at all -- see the tip below. This version keeps a small,
    # deterministic heuristic so the example stays fully repeatable offline.
    text = description.lower()
    if text.startswith("sq *") or text.startswith("tst*") or "coffee" in text or "bistro" in text:
        return "Dining"
    if text.startswith("venmo") or text.startswith("paypal"):
        return "Other"
    if text.startswith("amzn mktp"):
        return "Shopping"
    return "Other"


model = ChatOpenAI(
    model="gpt-4o-mini",
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)

agent = create_deep_agent(
    model=model,
    tools=[categorize_transaction],
    system_prompt=(
        "You are a personal finance assistant. When asked to categorize a "
        "transaction, call the categorize_transaction tool rather than "
        "guessing -- it exists precisely for the ambiguous cases a simple "
        "keyword list can't handle."
    ),
)

unresolved = df[df["category"].isna()]
for idx, row in unresolved.iterrows():
    result = agent.invoke({
        "messages": [{
            "role": "user",
            "content": f"Categorize this transaction: description={row['description']!r}, amount={row['amount']}",
        }]
    })
    text = str(result["messages"][-1].content)
    match = next((c for c in CATEGORIES if c.lower() in text.lower()), "Other")
    df.at[idx, "category"] = match

df["category"].value_counts()
```

لاحظ أن الحلقة تستدعي `agent.invoke(...)` مرة واحدة لكل صف غير محلول، كل واحد رحلة ذهاب وإياب منفصلة إلى النموذج — نفس اعتبار حد المعدل من مشروع وكيل الذكاء الاصطناعي ينطبق هنا: شغّل هذا مقابل ملف CSV كبير ويمكنك الوصول لسقف المستوى المجاني لكل دقيقة. راجع قسم "التعامل مع حدود المعدل" الخاص بذلك المشروع، و`ask()` في [`examples/ai-agent/agent.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-agent/agent.py)، لنمط إعادة محاولة يمكنك إعادة استخدامه هنا.

:::tip[دع النموذج يفكّر، لا تُخفِ القواعد في الأداة مجددًا فقط]
جسم `categorize_transaction` أعلاه لا يزال عمدًا استدلالًا صغيرًا، لا بحثًا ثابتًا — لكن يمكنك الذهاب أبعد: أعطِ `system_prompt` الخاص بالوكيل قائمة الفئات الكاملة واطلب منه التفكير مباشرة في وصف غير مألوف (`"SQ *"` هي بادئة نقطة بيع Square؛ `"TST*"` هي بادئة Toast — يستطيع نموذج رأى بيانات دفع حقيقية كافية غالبًا استنتاج "هذا على الأرجح مطعم صغير أو عربة" فقط من شكل السلسلة، بنفس الطريقة التي يفعل بها إنسان). المثال الأوسع في المستودع في [`examples/finance-agent/finance_agent.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/finance-agent) مكتوب لجعل هذا التبديل سهلًا — انظر تعليقاته.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>كل صف كان `None` بعد الخطوة 2 لديه الآن `category` غير فارغة بعد تشغيل هذه الخطوة.</StepChecklistItem>
<StepChecklistItem>طبعت استجابة وكيل واحدة على الأقل ويمكنك الإشارة إلى أي استدعاء أداة أنتج أي فئة.</StepChecklistItem>
<StepChecklistItem>يُظهر `df["category"].value_counts()` فئات منطقية لما تعرفه عن كل تاجر.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

يسرد توثيق الأداة الفئات الـ13 الصالحة، والكود الذي يقرأ إجابة النموذج (`match = next((c for c in CATEGORIES if c.lower() in text.lower()), "Other")`) لا يزال يلجأ إلى `"Other"` إن لم يظهر أي منها. لماذا الاحتفاظ بذلك الملاذ رغم أن الأداة *يُفترَض* أن تُعيد دائمًا واحدة من الـ13؟ ماذا يمكن أن يسوء بدونه؟

## الخطوة 4: حدد الشذوذ الإحصائي ولخّصه بلغة إنجليزية بسيطة

"الشذوذ" هنا يعني: كبير بشكل غير معتاد *لتلك الفئة*. رسم فندق بقيمة 400 دولار عادي لـTravel لكنه قيمة متطرفة واضحة لـDining — لذا بدلًا من عتبة دولار عامة واحدة، احسب **z-score** لكل فئة: كم عدد الانحرافات المعيارية التي تقع فيها معاملة فوق متوسط إنفاق فئتها الخاصة.

```python
spend = df["amount"].where(df["amount"] < 0)
df["spend_abs"] = spend.abs()

stats = df.groupby("category")["spend_abs"].agg(["mean", "std"]).rename(
    columns={"mean": "category_mean", "std": "category_std"}
)
df = df.join(stats, on="category")

safe_std = df["category_std"].replace(0, pd.NA)  # avoid dividing by 0/undefined std for tiny categories
df["z_score"] = (df["spend_abs"] - df["category_mean"]) / safe_std
df["is_anomaly"] = (df["z_score"] >= 2.0).fillna(False)

flagged = df[df["is_anomaly"]].sort_values("z_score", ascending=False)
flagged[["date", "description", "spend_abs", "category", "category_mean", "z_score"]]
```

z-score يبلغ 2.0 يعني "أكثر من انحرافين معياريين فوق متوسط هذه الفئة" — قاعدة تقريبية إحصائية شائعة، وإن كانت اعتباطية إلى حد ما، لـ"غير اعتيادي". شغّل هذا على بيانات العينة ويجب أن ترى معاملتين تبرزان بوضوح: شراء إلكترونيات مبالغ فيه نسبة لإنفاق Shopping النموذجي، ورسم مطعم أعلى بكثير من إنفاق Dining النموذجي (عشاء جماعي كبير، ربما — لا تستطيع البيانات القول لماذا، فقط أنه غير اعتيادي).

الآن سلّم القائمة الخام المحدَّدة إلى نفس الوكيل واطلب منه شرح ما وجده، بلغة بسيطة:

```python
summary_lines = [
    f"- {row['date'].date()} | {row['description']} | ${row['spend_abs']:.2f} in {row['category']} "
    f"(category average: ${row['category_mean']:.2f}, z-score: {row['z_score']:.1f})"
    for _, row in flagged.iterrows()
]
anomaly_summary = "\n".join(summary_lines) if summary_lines else "No anomalies found."

result = agent.invoke({
    "messages": [{
        "role": "user",
        "content": (
            "Here are transactions flagged as statistically unusual for their category "
            "(z-score = how many standard deviations above that category's average spend):\n\n"
            f"{anomaly_summary}\n\n"
            "Summarize this for someone reviewing their bank statement, in 2-4 plain-English "
            "sentences. No new numbers, no advice beyond what the data supports."
        ),
    }]
})
print(result["messages"][-1].content)
```

يقول الـprompt عمدًا "بلا أرقام جديدة، بلا نصيحة تتجاوز ما تدعمه البيانات" — حماية حقيقية ضد نمط فشل شائع لملخصات النماذج اللغوية: اختلاق تفسير يبدو معقولًا لكن غير مدعوم ("هذا على الأرجح كان عشاء عيد ميلاد") بدلًا من التقيّد بما تُظهره الإحصائيات فعليًا.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>تحتوي `flagged` المعاملة (المعاملات) التي تتوقع أن تبرز بالعين، وتستثني العادية.</StepChecklistItem>
<StepChecklistItem>تفهم لماذا يُحسَب z-score *لكل فئة*، لا عالميًا عبر كل الإنفاق.</StepChecklistItem>
<StepChecklistItem>يذكر ملخص الوكيل باللغة الإنجليزية البسيطة فقط الفئات/المبالغ التي تظهر فعليًا في `anomaly_summary` — لا شيء مُختلَق.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

فئة بمعاملة أو معاملتين فقط لها انحراف معياري غير مُعرَّف أو قريب من الصفر — يحمي الكود أعلاه من القسمة على ذلك بـ`.replace(0, pd.NA)`. ماذا سيحدث لدرجات z الخاصة بفئة لو لم تكن تلك الحماية موجودة، ولماذا قد تكون فئة بمعاملات قليلة جدًا مرشحًا سيئًا لهذا النوع من كشف الشذوذ من الأساس؟

## ⚠️ مآزق شائعة

- **إرسال بيانات مالية حقيقية إلى واجهة برمجية تابعة لجهة خارجية.** مُغطًّى أعلاه، يستحق التكرار: بُني هذا المشروع حول ملف CSV اصطناعي تحديدًا كي تبني عادة معاملة أي سكربت يستدعي واجهة برمجية خارجية كشيء سيرى كل ما تسلمه إياه.
- **إعادة تشغيل حلقة التصنيف دون داعٍ.** استدعاء `agent.invoke(...)` مرة واحدة لكل صف غير محلول يستهلك حصة API حقيقية في كل مرة تعيد فيها تشغيل سكربتك — خزّن النتائج مؤقتًا (مثل في CSV محلي أو قاموس مفهرَس بالوصف) بدلًا من إعادة تصنيف نفس الصفوف في كل تشغيل بينما تكرر على الخطوة 4.
- **عتبة شذوذ عامة بدلًا من واحدة لكل فئة.** وسم "أي معاملة فوق 200 دولار" سيفوّت قيمة متطرفة بقيمة 150 دولار في فئة تنفق عادة 20 دولارًا، وسيسم رسوم إيجار أو سفر عادية باستمرار. قارن كل معاملة بالإنفاق النموذجي لفئتها الخاصة، كما تفعل الخطوة 4.
- **ترك وكيل الملخص يختلق تفسيرات.** نموذج لغوي يُطلَب منه "شرح" شذوذ سيختلق بسعادة سببًا يبدو معقولًا إن سمحت له. قيّد الـprompt بالأرقام الفعلية، كما في الخطوة 4، وعامِل أي شيء يتجاوز ذلك كتخمين من النموذج، لا تقريرًا.
- **الثقة بـ`is_anomaly` من فئة بمعاملة أو معاملتين.** فئة جاءت كل قيمة تقريبًا فيها من عينة صغيرة جدًا لا تخبرك كثيرًا عمّا هو "طبيعي" لها بعد — راجع السؤال السقراطي أعلاه.

## ما بنيته للتو

خط أنابيب صغير لكنه مفيد فعليًا: مرور قائم على القواعد يتعامل مع الـ80% السهلة من المعاملات مجانًا، ووكيل نموذج لغوي يلتقط الباقي الغامض الذي لا تستطيع قائمة كلمات مفتاحية ثابتة تغطيته هيكليًا، وفحص إحصائي للشذوذ يحوّل "هل يبدو أي شيء هنا خاطئًا؟" إلى إجابة فعلية ويمكن الدفاع عنها — ثم ملخص بلغة إنجليزية بسيطة يمكن لقارئ غير تقني التصرف بناءً عليه. هذا الشكل من "مرور حتمي رخيص أولًا، ذكاء اصطناعي للباقي الغامض فعليًا" يعمم جيدًا إلى ما وراء المالية — إنه نفس الحدس خلف الكثير من خطوط أنابيب البيانات في العالم الحقيقي التي تستخدم نماذج لغوية.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/finance-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/finance-agent) في مستودع الدورة يحتوي خط الأنابيب الكامل كملفات منفصلة وقابلة لإعادة الاستخدام (`rules.py`، و`anomalies.py`، و`finance_agent.py`) بالإضافة إلى ملف CSV نموذجي اصطناعي، ويدعم المزوّدين الستة من الجدول أعلاه، ويُختار بينهم بإعداد واحد. استنسخه، أو افتح المستودع كاملًا في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) وشغّله من هناك.
:::

## إلى أين تذهب من هنا

- **ملخص خالٍ من الالتباس عبر الأشهر.** جمّع حسب `date.dt.to_period("M")` وقارن إجماليات فئة كل شهر — هل يتجه الإنفاق للأعلى في مكان محدد، بخلاف أي معاملة محدَّدة فردية؟
- **فحص شذوذ أذكى.** يفترض z-score أن الإنفاق ضمن فئة له شكل جرسي تقريبًا، وهذا ليس صحيحًا دائمًا (الإيجار شبه ثابت؛ الطعام يتفاوت كثيرًا). ابحث في مقاييس أكثر متانة مثل الوسيط والمدى الرباعي (IQR) للفئات حيث تحرّف بعض القيم الكبيرة المتوسط.
- **ميزانية تصنيف حقيقية.** بدلًا من إعادة تصنيف كل صف غير محلول في كل تشغيل، ثبّت النتائج المُصنَّفة (ملف SQLite محلي أو ذاكرة مؤقتة CSV مفهرَسة بالوصف) لكي تستدعي إعادة تشغيل السكربت الوكيل فقط على معاملات جديدة فعليًا.
- **أشهر متعددة، حسابات متعددة.** تمتد الأموال الحقيقية عبر أكثر من حساب. جرّب توسيع خط الأنابيب لتحميل عدة ملفات CSV وتوفيق الفئات باتساق عبرها.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓

<ProjectProgressCheckbox projectId="2027-finance-agent" />
