---
title: "مدير حملات البريد الإلكتروني"
description: "بناء وإرسال حملات بريد إلكتروني مع القوالب والتتبع واختبار A/B."
difficulty: "beginner"
estimatedMinutes: 55
tags: ["cli", "json", "csv", "templates"]
prerequisites:
  - "أساسيات Python (القوائم والقواميس والحلقات والدوال)"
  - "قراءة ملفات CSV وJSON"
learningObjectives:
  - "عرض قوالب {{placeholder}} باستبدال تعبير منتظم"
  - "استيراد قائمة مشتركين وإزالة التكرارات مع التحقق من صحة البريد الإلكتروني"
  - "عرض حملة كاملة في صندوق صادر للإلحاق فقط (JSONL)"
  - "حساب معدلات الفتح والنقر من سجل التفاعل"
  - "تقسيم قائمة بين سطرَي موضوع والإبلاغ عن الفائز"
---

# ✉️ ابنِ مدير حملات بريد إلكتروني

إرسال نشرة حقيقية يعني إدارة مجموعة فوضوية من سير العمل الصغيرة: قالب فيه `{{first_name}}` يُملأ فعلًا، وقائمة مشتركين فيها صف تالف يجب ألا يُسقط الإرسال، وسجل صندوق صادر لما صدر *بالضبط*، ومعدلات فتح ونقر محسوبة من سجل تتبع، و، الجزء الذي يسأل عنه كل مسوّق أولًا، أيّ سطرَي الموضوع فتحه الناس فعلًا. يبني هذا المشروع خط الأنابيب كاملًا بلغة Python نقية. لا إرسال، ولا خادم، ولا SMTP: "التسليم" هو كتابة سجل صندوق صادر، والأرقام حقيقية بقدر ما هي عند أي أداة مستضافة.

هذا يفترض إنهاء Python 101 ، القوائم، القواميس، الحلقات، الدوال ، مع إلمام مريح بـ `csv`/`json`. لا يُشترط أي شيء من تحليل البيانات. هذا اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. تعرض قوالب `{{placeholder}}` لمشترك واحد وترى المتغير الناقص يتحول إلى ثغرة مرئية.
2. تستورد `subscribers.csv`، متجاهلًا بصمت صف بريد إلكتروني غير صالح.
3. تعرض الحملة كاملة إلى سجل `outbox.jsonl` لما أُرسل إلى مَن.
4. تحسب معدلات الفتح والنقر من سجل تفاعل.
5. تقسّم القائمة بين سطرَي موضوع وتتوّج الفائز بمعدل الفتح.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الموصى به ، مدير الحملات أداة حفظ ملفات (قائمة مشتركين CSV داخلة، صندوق صادر JSONL خارج)، والملفات تنتمي إلى CLI محلي.

**GitHub Codespaces** بديل بلا إعداد: افتح [مستودع الدورة كاملًا في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython مثبّتان بالفعل) وشغّل الأوامر نفسها من طرفية في المتصفح.

**Google Colab أو Kaggle Notebooks أو Binder** تعمل مع كل خطوة ، الدفتر في [`examples/email-campaign/notebook.ar.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/email-campaign/notebook.ar.ipynb) يشغّل خط الأنابيب نفسه على القائمة النموذجية المرفقة في الذاكرة.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/email-campaign/notebook.ar.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/email-campaign/notebook.ar.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Femail-campaign%2Fnotebook.ar.ipynb)

## الإعداد

`uv` أداة واحدة تحل محل سلسلة "ثبّت Python، ثم pip، ثم أداة بيئة افتراضية" ، وهذا المشروع بمكتبة Python القياسية النقية.

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
uv init email-campaign
cd email-campaign
```

**✅ قائمة التحقق**

- ✅ يطبع `uv --version` رقم إصدار.
- ✅ يوجد `email-campaign/` مع `pyproject.toml`.
- ✅ ينجح `python -c "import csv, json, re"` ، لا حزم طرف ثالث.

## الخطوة 1: اعرض قالبًا

قلب أداة الحملات فكرة من دالة واحدة: استبدل كل `{{name}}` في قالب بقيمة من قاموس سياق. `re.sub` مع *دالة* يمنحك التعبئة مجانًا، وإرجاع متغير ناقص سلسلة فارغة سلوك متعمّد ومواجه لك ، تريد أن *ترى* ثغرة في البريد، لا أن يخمّن المُعرِّض ويخترع شيئًا.

### 1.1 اكتب المُعرِّض ومُحمِّل الحملة

**👟 تلميح البداية :** تعبير منتظم للعناصر النائبة، `VAR_RE.sub(...)` مع دالة `replace(match)`، وملف `campaign.json` يبقي قالبَي الموضوع والنص معًا:

```bash
cat > campaign.json <<'EOF'
{
  "subject_template": "Your {{product}} is ready",
  "body_template": "Hello {{first_name}}, your {{product}} is waiting for you.",
  "product": "dashboard"
}
EOF
```

```python
# templates.py
import json
import re

VAR_RE = re.compile(r"\{\{\s*(\w+)\s*\}\}")

def render(text: str, context: dict) -> str:
    def replace(match):
        return str(context.get(match.group(1), ""))
    return VAR_RE.sub(replace, text)

def load_campaign(path: str = "campaign.json") -> dict:
    with open(path) as f:
        return json.load(f)

if __name__ == "__main__":
    print(render("Hello {{ first_name }}, your {{product}} is waiting for you.",
                 {"first_name": "Ada", "product": "dashboard"}))
    print(render("Hello {{ first_name }}, your {{product}} is waiting for you.",
                 {"first_name": "Ada"}))
```

التعبير المنتظم `\{\{\s*(\w+)\s*\}\}` يطابق `{{ name }}` *بغض النظر عن المسافات*، وهذا هو التسامح الذي يحتاجه قالب منسوخ ومُلصق. `render` تضع الاستبدال كاملًا في تعبير واحد، وقاموس السياق هو *المصدر الوحيد للحقيقة* للأسماء ، `{{product}}` دون مفتاح `product` لا يعرض شيئًا. هذا هو رهان التصميم: افشل بشكل مرئي، ولا تختلق أبدًا.

**🎯 الناتج المتوقع :**

```
Hello Ada, your dashboard is waiting for you.
Hello Ada, your  is waiting for you.
```

**🩹 إذا لم يعمل :** إذا عُرض `{{ first_name }}` حرفيًا، فـ `\s*` حول الاسم ناقصة من التعبير المنتظم (طابق `{{first_name}}` في ذهنك لكنه لم يطابق ذا المسافات). إذا أبقى `product` الناقص نص `{{product}}` القديم، فإن `context.get(match.group(1), "")` أعاد العنصر النائب ، يجب أن تكون القيمة الافتراضية `""`.

### 1.2 تحقّق من المُعرِّض

**✅ قائمة التحقق**

- ✅ `render("Hi {{name}}", {"name": "Ada"}) == "Hi Ada"`، ومع المسافات `"Hi {{ name }}"` أيضًا ، متسامح مع المسافات البيضاء.
- ✅ يترك المتغير الناقص فجوة مرئية بدلًا من رفع خطأ أو التخمين.
- ✅ لا ينهار الاحتياطي على قيم غريبة أبدًا: `context.get(..., "")` يحوّل الأرقام والقيم المنطقية إلى سلاسل بسلاسة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- القيمة الناقصة تُعرض سلسلة فارغة ، ثغرة صامتة في البريد. ما البديل (رفع استثناء / إبقاء العنصر النائب / تركه فارغًا) ومتى يصبح كلٌّ منها الإعداد الافتراضي الصحيح لمرسِل إنتاجي؟
- القالب فيه متغير واحد، وملف الحملة فيه ثلاثة مفاتيح. ماذا يحدث عندما يشير قالب إلى `{{ plan }}` بينما السياق الوحيد في ملف الحملة هو `product` ، من أين يجب أن تأتي قيمة *خاصة بالمشترك* مثل `plan` في الخطوة التالية؟

## الخطوة 2: استورد قائمة المشتركين

قائمة عملاء حقيقيين فيها ضمانة واحدة بالضبط: إنها فوضوية. في مكان ما بين نموذج الاشتراك وحملتك يوجد صف ليس بريدًا إلكترونيًا. وظيفة الاستيراد هي تحميل ما هو صالح، وتخطّي ما ليس كذلك، و*الإبلاغ عمّا تخطّته* ، تلتهم الصفوف التالفة بصمت ما يخفي فجوات البيانات، والثقة بالصفوف التالفة تسمّم الإرسال كله.

### 2.1 اكتب مُحمِّل المشتركين

**👟 تلميح البداية :** `EMAIL_RE` عملي، وحلقة تُبقي الصفوف المطابقة فقط، وعرض تجريبي يحسب ما تخطّي:

```bash
cat > subscribers.csv <<'EOF'
email,first_name,last_name,plan
ada@example.com,Ada,Lovelace,free
grace@example.com,Grace,Hopper,pro
not-an-email,Bad,Row,free
alan@example.com,Alan,Turing,free
EOF
```

```python
# subscribers.py
import csv
import re

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

def load_subscribers(path: str = "subscribers.csv") -> list[dict]:
    subscribers = []
    with open(path, newline="") as f:
        for row in csv.DictReader(f):
            if EMAIL_RE.match(row["email"]):
                subscribers.append(row)
    return subscribers

if __name__ == "__main__":
    subs = load_subscribers()
    print(f"valid: {len(subs)} (1 invalid row skipped)")
    for s in subs:
        print(f"{s['email']:<26} {s['first_name']} {s['last_name']} ({s['plan']})")
```

`EMAIL_RE` فحص *شكل* لا سلطة: `^[^@\s]+@[^@\s]+\.[^@\s]+$` يتطلب علامة `@` واحدة بالضبط، وجزءًا محليًا قابلًا للطباعة، ونقطة في النطاق، وعدم وجود مسافات ، جيد بما يكفي لكشف `not-an-email` للوهلة الأولى. التخطّي هو البطاقة التعريفية هنا: صف CSV ليس مشتركًا هو مشكلة *بيانات* تُكشف عند الباب، وتُبلَّغ مرة واحدة في سطر العد، ولا يُسمح لها أبدًا بالتسرب إلى حسابات `outbox` في الأسفل.

**🎯 الناتج المتوقع :**

```
valid: 3 (1 invalid row skipped)
ada@example.com            Ada Lovelace (free)
grace@example.com          Grace Hopper (pro)
alan@example.com           Alan Turing (free)
```

**🩹 إذا لم يعمل :** إذا ظهر الصف التالف في المخرجات، فحارس `if EMAIL_RE.match(row["email"])` ناقص أو يطابق `not-an-email` (هل يملك التعبير المنتظم جزء نطاق `\.[^@\s]+` إلزاميًا؟). إذا عدّت كل خطوة لاحقة 4 مشتركين، فقد استوردت من `subscribers.csv` دون الفلتر ، أعد قراءة ما تُرجعه `load_subscribers` فعلًا.

### 2.2 تحقّق من الاستيراد

**✅ قائمة التحقق**

- ✅ تُستورد 3 صفوف من 4 بالضبط؛ ويُبلَّغ عن `not-an-email` كتالف وتخطِّيه.
- ✅ حقول `email` الفارغة أو المسافات البيضاء فقط ستتخطاها أيضًا نفس التعبير المنتظم.
- ✅ تحفظ الصفوف المستوردة كل الأعمدة (`email`, `first_name`, `last_name`, `plan`) ، كل خطوة لاحقة تقرأ من السجل الكامل.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- عدد التخطّيات *يُطبَع* لكنه ليس *مخزَّنًا*. ماذا سيفعل مستورد إنتاجي بـ `not-an-email` ، يصفّه لإعادة التحقق، أو يسجّله في ملف أخطاء، أو يوقف الحملة كلها ، وأي اختيار هو "افشل بصوت عالٍ" الصادق هنا؟
- التعبير المنتظم يقبل `grace@example.com` لكنه يقبل أيضًا `a@b.c`. أين يقع خط "هذا عنوان محتمل"، وكم يكلف دفعه أبعد (فحص DNS، قابلية التسليم) ، لحملة صغيرة فعلية؟

## الخطوة 3: اعرض صندوق الصادر كاملًا

بريد واحد معروض اختبار وحدة؛ وصندوق صادر كامل هو المنتَج. لكل مشترك، ادمج الإعدادات الافتراضية للحملة مع حقول المشترك نفسه، واعرض الموضوع والنص، واكتب كائن JSON واحدًا لكل بريد إلى `outbox.jsonl` ، سجل للإلحاق فقط يسجّل *ما أُرسل بالضبط إلى مَن*. لا حاجة إلى SMTP لفهم شكل المهمة.

### 3.1 اكتب `outbox.py`

**👟 تلميح البداية :** `context.update({k: sub[k] ...})` يطبق حقول المشترك-بمشترك فوق ملف الحملة، ثم تمريرة معاينة واحدة تطبع رسائل البريد الثلاث المعروضة كما ستخرج فعلًا:

```python
# outbox.py
import csv
import json

from subscribers import load_subscribers
from templates import load_campaign, render

def render_campaign(campaign: dict, subscribers: list[dict]) -> list[dict]:
    outbox = []
    for sub in subscribers:
        context = dict(campaign)
        context.update({k: sub[k] for k in ("email", "first_name", "last_name", "plan")})
        outbox.append({
            "to": sub["email"],
            "subject": render(campaign["subject_template"], context),
            "body": render(campaign["body_template"], context),
        })
    return outbox

if __name__ == "__main__":
    campaign = load_campaign()
    outbox = render_campaign(campaign, load_subscribers())
    with open("outbox.jsonl", "w") as f:
        for email in outbox:
            f.write(json.dumps(email) + "\n")
    print(f"wrote {len(outbox)} emails")
    for email in outbox:
        print(f"  to {email['to']:<26} {email['subject']} | {email['body']}")
```

`context = dict(campaign)` *تنسخ* قاموس الحملة، لذا لا تتحور عمليات الدمج الخاصة بالحلقة المصدر المشترك ، تحديث `first_name` لأدا لا يمكن أن يتسرّب إلى عرض غرايس (خلل القاموس المشترك الكلاسيكي الذي تمنعه هذه النسخة). المُعرِّض موجود من الخطوة 1؛ `render_campaign` تركيب نقي ، حلقة، دمج، عرض، تسجيل. JSONL (كائن JSON واحد في كل سطر) هو تنسيق *التدقيق* في هذا المشروع: صديق للإلحاق، وصديق للـ grep، وكل خطوة لاحقة تعيد قراءته سطرًا سطرًا.

**🎯 الناتج المتوقع :**

```
wrote 3 emails
  to ada@example.com            Your dashboard is ready | Hello Ada, your dashboard is waiting for you.
  to grace@example.com          Your dashboard is ready | Hello Grace, your dashboard is waiting for you.
  to alan@example.com           Your dashboard is ready | Hello Alan, your dashboard is waiting for you.
```

**🩹 إذا لم يعمل :** إذا قال أحد البريدين "Hello Grace" لأدا أيضًا، فـ `render_campaign` *تُحوِّر* `campaign` في مكانها ، يجب أن تأتي `context = dict(campaign)` أولًا؛ ويذهب `.update` إلى النسخة. إذا كان `outbox.jsonl` فارغًا بعد تشغيل، ففتحته قبل إغلاق *الكتابة* ، تحقق من أن `with open("outbox.jsonl", "w")` لا يُقتطع بفتح ثانٍ للمسار نفسه أثناء التشغيل.

### 3.2 تحقّق من صندوق الصادر

**✅ قائمة التحقق**

- ✅ يحتوي `outbox.jsonl` على 3 أسطر بالضبط، كائن JSON واحد لكل سطر (`to`, `subject`, `body`).
- ✅ لا تختلف أجسام أدا وآلان المعروضة *عن أي شيء* هنا ، نفس المنتج، نفس القالب ، لكن حقلَي `first_name`/`last_name` متاحان لكل مشترك على حدة.
- ✅ يطابق السجل المطبوع `outbox.jsonl` سطرًا مقابل سطر (نفس السياق، نفس المُعرِّض).

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يسجّل صندوق الصادر `to/subject/body` لكنه *لا* يسجّل خيارات الدمج (أي `product` كان في السياق). ما الفرق بين صندوق صادر و*سجل تدقيق*، وأيًّا منهما تريد عندما يشتكي مشترك أنه تلقى بريدًا خاطئًا؟
- يأتي كلا القالبين `subject_template` و`body_template` من `campaign.json`، ومع ذلك يحمل `context` هذين المفتاحين أيضًا. لماذا تضيف هذه الزيادة +1 مفتاحًا إلى كل دمج ، وهل التكلفة في الخطوة 4 (معدلات التفاعل) أكثر من شكلية؟

## الخطوة 4: قِس الفتحات والنقرات

كل شركة تهتم برقم واحد خلف حملة: هل *قرأها* الناس؟ سجل التفاعل ملف JSONL ثانٍ ، حدث واحد `{"type": "open"|"click", "email": ...}` لكل مشترك ، والمعدلات هي `الفتح لفُتحت برامج فريدة/أُرسِلت` و`نقرات فريدة/أُرسِلت`. إزالة التكرار بالمجموعات هي الصحة هنا: مشترك يفتح مرتين يُحسب مرة واحدة، ونقرة دون فتح تبقى نقرة.

### 4.1 اكتب حاسبة المعدلات

**👟 تلميح البداية :** حمّل سجل الأحداث، وابنِ *مجموعتي* `opened` و`clicked` من البرامج الفريدة، ثم اقسم على عدد المُرسَل:

```bash
cat > events.jsonl <<'EOF'
{"type": "open", "email": "ada@example.com"}
{"type": "open", "email": "grace@example.com"}
{"type": "click", "email": "grace@example.com"}
EOF
```

```python
# tracking.py
import json

from subscribers import load_subscribers

def load_events(path: str = "events.jsonl") -> list[dict]:
    return [json.loads(line) for line in open(path) if line.strip()]

def engagement_rates(sent_count: int, events: list[dict]) -> dict:
    opened = {e["email"] for e in events if e["type"] == "open"}
    clicked = {e["email"] for e in events if e["type"] == "click"}
    return {"sent": sent_count,
            "opened": len(opened) / sent_count,
            "clicked": len(clicked) / sent_count}

if __name__ == "__main__":
    sent = load_subscribers()
    events = load_events()
    rates = engagement_rates(len(sent), events)
    print(f"sent:     {rates['sent']}")
    print(f"opened:   {rates['opened']*rates['sent']:.0f}/{rates['sent']}  ({rates['opened']:.1%})")
    print(f"clicked:  {rates['clicked']*rates['sent']:.0f}/{rates['sent']}  ({rates['clicked']:.1%})")
```

الحيلة كلها في `{e["email"] for e in events ...}` ، استخدام مجموعات يحوّل *الأحداث* إلى *رسائل بريد فريدة* في تعبير واحد. فتحُ `ada@example.com` مرتين ما زال عنصر مجموعة واحدًا، لذا لا يمكن أن يتجاوز `opened` قيمة `sent` بسبب العد المزدوج. تأتي المعدلات من *مقام تملكه أنت أصلًا* (`sent_count` من قائمة المشتركين)، لا من افتراض أن "الأحداث == من أُرسل إليه" ، السجل هو البسط، والاستيراد هو المقام.

**🎯 الناتج المتوقع :**

```
sent:     3
opened:   2/3  (66.7%)
clicked:  1/3  (33.3%)
```

**🩹 إذا لم يعمل :** إذا تُلي `opened: 2/3` كـ `3/3`، فقد عددت *الأحداث* لا *الرسائل* ، الاستخدام ناقص: `{e["email"] for e in events}` يطوي التكرارات؛ `len(events)` لا يفعل. إذا كان المقام خاطئًا، فقد جاء `sent_count` من `len(events)` بدلًا من `load_subscribers()` ، لا يمكن للسجل أن يخبرك بكم رسالة *خرجت*.

### 4.2 تحقّق من المعدلات

**✅ قائمة التحقق**

- ✅ `opened` = مرسلان فريدان من 3 أُرسلوا (66.7%)؛ `clicked` = 1 من 3 (33.3%).
- ✅ لا يغيّر حدث `open` مكرر لنفس البريد شيئًا ، إزالة التكرار بالمجموعات، لا عد الأحداث.
- ✅ تأخذ `engagement_rates()` عددَ المُرسَل كوسيطة، وتبقى صادقة أن "المُرسَل" يعرّفه المستورد لا السجل.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تتبع الفتح مشهور بالتقريب (أجزاء المعاينة، حظر الصور، أدوات الخصوصية). أين يبالغ "opened = 66.7%" في بيع الواقع، وما الكلمة ("قرأ"، "فُتح"، "حُمّل") التي ستستخدمها لوحة معلومات دقيقة لذلك الرقم بالضبط؟
- تقسم المعدلات على *المُرسَل* لا على *الذي استُلم*. الارتدادات (البريد لم يصل) تضخّم المعدلين. أين في هذا الخط الأنابيب ستطرح عدد `bounced` بحيث تصف المعدلات ما استلمه الناس فعلًا؟

## الخطوة 5: شغّل اختبار A/B واختر الفائز

تحرّك أسطر الموضوع معدلات الفتح، ويتجادل المسوّقون فيها إلى الأبد ، وهو سبب *قياسك* بدلًا من ذلك. "تقسيم A/B" هنا يعني: قسّم قائمة المشتركين إلى نصفين بفهرس متناوب، وأعطِ كل نصف سطر موضوع مختلفًا (نفس النص)، واترك سجل التفاعل يقرر. شرط الفوز هو معدل الفتح لكل نسخة، والقرر كله ثلاث أسطر حساب.

### 5.1 اكتب القسّام والمُبلِّغ

**👟 تلميح البداية :** `i % 2 == 0` يناوب المشتركين بين النسختين؛ وقاموس إحصاءات لكل نسخة يجمع المُرسَل والفتح من ملف النتائج:

```bash
cat > effectiveness.jsonl <<'EOF'
{"variant": "A", "email": "ada@example.com", "opened": true}
{"variant": "B", "email": "grace@example.com", "opened": true}
{"variant": "A", "email": "alan@example.com", "opened": false}
EOF
```

```python
# abtest.py
import csv
import json
from collections import defaultdict

def ab_split(subscribers: list[dict], variant_a: str, variant_b: str) -> list[dict]:
    plan = []
    for i, sub in enumerate(subscribers):
        record = dict(sub)
        record["variant"] = "A" if i % 2 == 0 else "B"
        record["subject"] = variant_a if record["variant"] == "A" else variant_b
        plan.append(record)
    return plan

def load_outcomes(path: str = "effectiveness.jsonl") -> dict:
    outcomes = {}
    for line in open(path):
        if line.strip():
            record = json.loads(line)
            outcomes[record["email"]] = record
    return outcomes

if __name__ == "__main__":
    subscribers = [s for s in csv.DictReader(open("subscribers.csv", newline=""))
                   if "@" in s["email"]]
    outcomes = load_outcomes()

    plan = ab_split(subscribers,
                    "Your dashboard is ready",
                    "Start tracking with your dashboard")

    stats = defaultdict(lambda: {"sent": 0, "opened": 0})
    for row in plan:
        stats[row["variant"]]["sent"] += 1
        if outcomes[row["email"]]["opened"]:
            stats[row["variant"]]["opened"] += 1

    for variant in sorted(stats):
        s = stats[variant]
        print(f"variant {variant}: opened {s['opened']}/{s['sent']} = {s['opened']/s['sent']:.0%}")

    winner = max(stats, key=lambda v: stats[v]["opened"] / stats[v]["sent"])
    print(f"winner: variant {winner}")
```

`i % 2 == 0` تخصيص متناوب ، أدا وآلان → A؛ وغرايس → B ، بساطة متعمَّدة تُبقي *من يحصل على أي موضوع* واضحًا للوهلة. `defaultdict` مع مصنع `lambda` يجعل `stats["A"]["sent"] += 1` يعمل من أول مرة (`0` → `1`) دون تهيئة مسبقة ، تتحول الأصفار إلى أولى الزيادات مجانًا. الحكم `max(...)` صادق على معدلات الفتح: فوز نسخة B بنتيجة 1/1 يتفوق على A بنتيجة 1/2 *بغض النظر عن كون التقسيم غير متساوٍ*، وهذا بالضبط "القائمة الصغيرة، التنبيه الكبير" الذي ستشير إليه لأي مسوّق حقيقي.

**🎯 الناتج المتوقع :**

```
variant A: opened 1/2 = 50%
variant B: opened 1/1 = 100%
winner: variant B
```

**🩹 إذا لم يعمل :** إذا وقع كل سجل في A، فيستخدم التناوب `i % 2 == 1` بشكل غير متسق بين `ab_split` والعرض التجريبي ، شريحة واحدة. إذا طُبع `winner: variant A`، فمفتاح `max` يقارن في الاتجاه الخاطئ (على نمط `min`) ، تحقق من أنه يفهرس إلى `opened / sent`، لا إلى `opened`.

### 5.2 تحقّق من فائز A/B

**✅ قائمة التحقق**

- ✅ ترتيب المشتركين (أدا، غرايس، آلان) ينتج A:{أدا، آلان}، B:{غرايس}؛ وتُسند النتائج أدا→فُتحت، وآلان→لم تُفتح، وغرايس→فُتحت.
- ✅ المعدلات: A = 1/2 (50%)، B = 1/1 (100%)؛ الفائز = B بمعدل الفتح.
- ✅ إعادة تشغيل نفس `effectiveness.jsonl` تعطي الفائز نفسه ، النتائج بيانات، لا رمي عملة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- التقسيم يناوب بـ `i % 2 == 0`، وهو *جراحي* لكنه ليس *عشوائيًا*. إذا صادف أن القائمة مرتبة حسب، مثلًا، دفعة التسجيل، فقد تكون نسخة B كلها عملاء يدفعون بمعدلات فتح أساسية أعلى. ما الذي يغيّره *خلط بزرع (seed shuffle)* ، وماذا لا يغيّر ، بشأن نزاهة الفائز؟
- بحجمَي نسختين 2 و1، فإن 100% يعني شخصًا واحدًا. ما الفرق بين "حاسم إحصائيًا" و"يبدو حاسمًا على ثلاثة بريدات" ، وما أول رقم عتبة (مشتركين لكل نسخة) يجعل عبارة "فائز" قابلة للدفاع عنها؟

## ⚠️ مآزق شائعة

- **ثقوب حيث يجب أن تكون الأسماء.** `{{product}}` الناقص يُعرض سلسلة فارغة ، حسب التصميم ، لكن الناس يرسلونه. قرر سياسة المتغير الناقص (فارغ / إبقاء خام / رفع) واجعلها صريحة، لأن الافتراضي ثغرة-مرئية يرسل بصمت "Hello Ada, your  is waiting."
- **تحوير قاموس الحملة المشترك.** `context = campaign` ثم `context.update(حقول_المشترك)` يجعل `first_name` لأدا يستبدل المصدر المشترك لغرايس. `dict(campaign)` أولًا، دائمًا.
- **عد الأحداث كأناس.** `len(events)` يقول "حدثت ثلاث فتحات" ، لا "فتحها ثلاثة أناس". أزل التكرار في مجموعات قبل القسمة، وإلا بالغت المعدلات بعدد التداخل نفسه بالضبط.
- **التخطّي دون قول ذلك.** استيراد يُسقط صف CSV غير صالح دون أن يبلغ عنه يخفي فجوات البيانات. اطبع عدد التخطّي، وإلا كنت تعلّم الصف التالف نفسه بصمت كل تشغيل مستقبلي.
- **الثقة بالأعداد فوق التعريفات.** يجب أن يأتي `sent` من الاستيراد، و`opened`/`clicked` من السجل ، خلط المقامين هو كيف يتجاوز المعدل 100% دون أي خلل واضح للوهلة الأولى.

## ما بنيته للتو

حلقة حملة البريد الإلكتروني كاملة في المكتبة القياسية: مُعرِّض قوالب، واستيراد مشتركين مُتحقق منه، وسجل صندوق صادر يسجّل ما خرج بالضبط، ومعدلات تفاعل بريد فريد، وتجربة A/B فائزها يأتي مباشرة من البيانات. المهارة التي تستحق الاحتفاظ هي *فصل طبقات خط الأنابيب* ، القالب، والقائمة، وصندوق الصادر، والسجل، والقرار؛ كلٌّ منها يملك ملفًا واحدًا ومهمة واحدة، لذا استبدال أي منها (A/B جديد لسطر الموضوع، خصم عدد الارتدادات) لا يتموّج أبدًا عبر البقية.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/email-campaign/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/email-campaign) في مستودع الدورة يحتوي السكربتات الكاملة بالإضافة إلى `subscribers.csv` النموذجية والقوالب. أو افتح المستودع كاملًا في [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## إلى أين تذهب من هنا

- أضف **الارتدادات**: `bounced_set` يُطرح من `sent` قبل قسمة المعدل ، مقام "التسليم" بدلًا من "المُرسَل"، تحسين سطر واحد بعائد نزاهة كبير.
- أضف **أمر معاينة** يعرض بريدًا واحدًا في الطرفية (`send.py ada@example.com`) بالموضوع والنص الدقيقين اللذين سيخرجان ، معاينة الإرسال تعيش فوق `render_campaign`.
- ثبّت **تاريخ الإرسال** كعمود ثانٍ في صندوق الصادر (طوابع زمنية `bounced_at`، `opened_at` لكل مشترك) بحيث يكتسب سجل التدقيق "الضمانة" المذكورة في سؤال الخطوة 3.
- اجعل تقسيم A/B **عشوائيًا بزرع** (`random.Random(seed).shuffle`) مع طباعة الزرع في التقرير ، تصبح التجربة قابلة لإعادة الإنتاج، ويمكن للمسوّق الإشارة إلى التقسيم الدقيق الذي جرى.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها ، وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓