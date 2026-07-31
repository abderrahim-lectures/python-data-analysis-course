---
id: email-triage-agent
title: "بناء وكيل شخصي لفرز البريد الإلكتروني"
sidebar_label: "بناء وكيل شخصي لفرز البريد الإلكتروني"
slug: /projects/email-triage-agent
description: "تخرّج من بيئة البرمجة في المتصفح إلى Python فعلي: ابنِ وكيلًا يصنّف، ويرتّب أولوية، ويصوغ (لكن لا يرسل أبدًا) ردودًا لبريدك الإلكتروني، باستخدام نموذج لغوي من مستوى مجاني."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 بناء وكيل شخصي لفرز البريد الإلكتروني

<ProjectPublishedDate projectId="email-triage-agent" />

<ProjectGreeting />

كل شيء في الدورة حتى الآن عمل في بيئة تجريبية معزولة داخل المتصفح — حتى تتمكن من البدء بكتابة Python من اليوم الأول بلا أي إعداد. هذا المشروع هو خطوة التخرّج: ثبّت Python فعليًا على جهازك الخاص، ثم استخدمه لبناء شيء مفيد فعليًا — وكيل يقرأ دفعة من رسائل البريد الإلكتروني، ويخبرك بأيها يهم فعليًا، ويصوغ ردًّا مقترحًا للتي تحتاج واحدًا. هذا يفترض Python 101؛ لا يُشترط أي شيء من تحليل البيانات.

هذا اختياري وغير مُقيَّم. راجع [مشاريع من العالم الحقيقي](/docs/projects) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. تحميل مجلد مُرفَق من رسائل بريد إلكتروني نموذجية — لا يُشترط صندوق بريد حقيقي، ولا كلمة مرور، ولا إعداد IMAP لإكمال هذا المشروع.
2. الحصول على مفتاح API للذكاء الاصطناعي من مستوى مجاني وكتابة prompt يصنّف كل رسالة (عاجلة / تحتاج ردًّا / نشرة إخبارية / للعلم فقط / يبدو كرسالة مزعجة) ويعطيها أولوية.
3. كتابة prompt ثانٍ يصوغ ردًّا مقترحًا لأي شيء يحتاج واحدًا — وبناء قاعدة صارمة لا يخرقها هذا الوكيل أبدًا: **لا يُرسِل شيئًا أبدًا، إطلاقًا**. تُطبَع كل مسودة وتُحفَظ محليًا فقط لكي تقرأها وترسلها بنفسك.
4. تشغيل خط الأنابيب بأكمله من البداية للنهاية وقراءة ما أنتجه.
5. *(اختياري، "اذهب أبعد")* وجّه نفس السكربت إلى صندوق بريدك الحقيقي عبر IMAP بدلًا من الرسائل النموذجية، باستخدام "كلمة مرور تطبيق" من Gmail — لا كلمة مرورك الحقيقية.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي والموصى به — إنه Python فعلي يعمل على جهازك الخاص، نفس خطوة "التخرّج إلى Python فعلي" كأي مشروع آخر في هذه السلسلة. الدرس الأساسي (الخطوات 1–4) لا يحتاج شيئًا سوى رسائل البريد النموذجية المُرفَقة، لذا لا مقايضة خصوصية للقلق بشأنها حتى عند التشغيل محليًا. يشرح قسم الإعداد أدناه كيفية تثبيت `uv`.

**GitHub Codespaces** يعمل جيدًا للدرس الأساسي: افتح [مستودع الدورة كاملًا في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython وuv مثبّتة بالفعل، وفق `.devcontainer/devcontainer.json` الخاص بالمستودع) وشغّل نفس أوامر `uv` تمامًا من طرفية في تبويب متصفحك. رسائل البريد النموذجية المُرفَقة تجعل هذه طريقة كاملة فعليًا لعمل المشروع بأكمله بلا إعداد محلي على الإطلاق.

**Google Colab وKaggle Notebooks أو Binder** تعمل أيضًا للدرس الأساسي — بلا تثبيت، مباشرة في متصفحك. يشحن المستودع دفتر ملاحظات جاهزًا للتشغيل يعكس تمامًا خطوات هذا الدرس:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/email-triage-agent/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/email-triage-agent/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Femail-triage-agent%2Fnotebook.ipynb)

انقر على شارة، شغّل الخلايا من الأعلى للأسفل، والصق مفتاح API من مستوى مجاني عند الطلب. هذه طريقة أقل دقة لتجربة المشروع من مشروع `uv` محلي فعلي (بلا ملفات منفصلة، بلا بنية مشروع حقيقية)، لذا عاملها كطريقة سريعة للتجربة بدلًا من المسار الأساسي.

**ملاحظة حول امتداد IMAP الاختياري**: ليس أي من الخيارات الثلاثة أعلاه مكانًا جيدًا لكتابة كلمة مرور بريد إلكتروني حقيقية، كلمة مرور تطبيق أم لا. إذا جرّبت خطوة "اذهب أبعد" الاختيارية، افعل ذلك محليًا، في ملف `.env` لا يغادر جهازك أبدًا — لا في خلية دفتر ملاحظات أو بيئة تطوير سحابية لا تتحكم بها بالكامل.

## الإعداد

### ثبّت `uv`

`uv` أداة واحدة تحل محل السلسلة المعتادة "ثبّت Python، ثم ثبّت pip، ثم ثبّت أداة بيئة افتراضية، ثم ثبّت الحزم" — يمكنها تثبيت وإدارة إصدارات Python بنفسها، إلى جانب تبعيات مشروعك.

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
uv init email-triage-agent
cd email-triage-agent
uv add openai python-dotenv
```

`openai` هي مكتبة العميل التي يستخدمها هذا المشروع لاستدعاء النموذج اللغوي — يصادف أن كل مزوّد في الجدول أدناه يعرض نقطة نهاية Chat Completions متوافقة مع OpenAI، لذا تغطي فئة عميل صغيرة واحدة الستة جميعًا، فقط موجَّهة إلى `base_url` مختلفة. تتيح لك `python-dotenv` الاحتفاظ بمفتاح API في ملف `.env` محلي بدلًا من تنفيذ `export` في كل جلسة.

### احصل على مفتاح API مجاني للذكاء الاصطناعي

**اختر المزوّد الذي تفضّله** — لا يتطلب أي منها بطاقة ائتمان وقت كتابة هذا، ولا تفضّل هذه الدورة أحدهم على الآخر.

| المزوّد | أين تحصل على مفتاح | لماذا قد تختاره |
|---|---|---|
| **GitHub Models** *(الافتراضي المقترح)* | [github.com/settings/tokens](https://github.com/settings/tokens) — رمز وصول شخصي بنطاق `models: read` | لا تسجيل منفصل — لديك حساب GitHub بالفعل. حدود مستوى مجاني أكثر سخاءً من Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | الخيار الأكثر ذكرًا شيوعًا؛ استُخدِم في مسودات سابقة من هذه الصفحة. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | استدلال سريع، مستوى مجاني سخي، بلا بطاقة. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | واحدة من أكثر الحصص المجانية الدائمة سخاءً. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | حجم رموز يومي مرتفع، بلا بطاقة. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | واجهة برمجة واحدة، نماذج مجانية عديدة — جيدة لمقارنة المزوّدين. |

أيًّا كان الذي تختاره، العملية واحدة:

1. سجّل الدخول وأنشئ مفتاح API على موقع ذلك المزوّد.
2. **لا تلصق هذا المفتاح أبدًا مباشرة في الكود ولا ترفعه إلى مستودع.** أنشئ بدلًا من ذلك ملف `.env` في مجلد مشروعك:

```bash
# .env
LLM_PROVIDER=github
GITHUB_TOKEN=مفتاحك-هنا
```

يخبر `LLM_PROVIDER` السكربت أي مزوّد اخترته (`github`، أو `gemini`، أو `groq`، أو `mistral`، أو `cerebras`، أو `openrouter`)؛ يكون `github` افتراضيًا إن تركته. املأ فقط المفتاح الواحد الذي تحتاجه فعليًا — القائمة الكاملة لأسماء المتغيرات موجودة في `.env.example` الخاص بمثال المستودع.

:::tip[ملف .env غالبًا أكثر ملاءمة من export]
بدلًا من تنفيذ `export` لمفتاح في كل جلسة طرفية جديدة، تقرأ `python-dotenv` ملف `.env` تلقائيًا في اللحظة التي يستدعي فيها سكربتك `load_dotenv()` — بلا إعداد لكل جلسة، وهو مُستثنى بالفعل من git عبر `.gitignore` لذا لا يمكنك رفع مفتاح حقيقي عن طريق الخطأ.
:::

مفتاح API سرّ، تمامًا مثل كلمة المرور — أي شخص يملكه يمكنه استخدام حصة حسابك. معاملته كمتغيّر بيئة بدلًا من نص ثابت مُضمَّن في الكود هي الممارسة القياسية لهذا السبب بالتحديد، وهو نفس عادة الأمان الواقعية المُعلَّمة في [مشروع وكيل الذكاء الاصطناعي](/docs/projects/ai-agent).

مع تثبيت `uv`، وإعداد المشروع، وملء `.env`، أنت جاهز للبناء — كل خطوة من هنا فصاعدًا تفترض أن كل ذلك تم بالفعل.

## الخطوة 1: حمّل وافحص رسائل البريد النموذجية

يشحن مثال المستودع ستة رسائل بريد إلكتروني نموذجية قصيرة وواقعية في `sample_emails/` — طلب عاجل من عميل، نشرة إخبارية، رسالتان تحتاجان فعليًا ردًّا، ترويج مزعج، وإشعار آلي للعلم. إنها ملفات نصية بسيطة على شكل `.eml` مُبسَّط: بضعة أسطر `Header: value`، سطر فارغ، ثم النص.

أنشئ `triage.py` وابدأ بمحلِّل صغير:

```python
# triage.py
"""Loads sample emails and will, by the end of this lesson, categorize,
prioritize, and draft replies for them using a free-tier LLM.

Run with: uv run python triage.py
"""

from dataclasses import dataclass
from pathlib import Path

SAMPLE_EMAILS_DIR = Path("sample_emails")


@dataclass
class Email:
    filename: str
    sender: str
    subject: str
    date: str
    body: str


def parse_email(path: Path) -> Email:
    """Parses one plain-text sample email: a few `Header: value` lines, a
    blank line, then the body -- the same shape as a real .eml file's
    headers, simplified so no email-parsing library is needed."""
    text = path.read_text(encoding="utf-8")
    header_text, _, body = text.partition("\n\n")
    headers = {}
    for line in header_text.splitlines():
        if ":" in line:
            key, _, value = line.partition(":")
            headers[key.strip().lower()] = value.strip()
    return Email(
        filename=path.name,
        sender=headers.get("from", "unknown"),
        subject=headers.get("subject", "(no subject)"),
        date=headers.get("date", "unknown"),
        body=body.strip(),
    )


def load_emails(directory: Path) -> list[Email]:
    """Loads every .txt file in `directory`, sorted by filename."""
    return [parse_email(p) for p in sorted(directory.glob("*.txt"))]


if __name__ == "__main__":
    emails = load_emails(SAMPLE_EMAILS_DIR)
    print(f"Loaded {len(emails)} email(s) from {SAMPLE_EMAILS_DIR}/\n")
    for email in emails:
        print(f"[{email.filename}] {email.subject!r} from {email.sender}")
```

انسخ الملفات النموذجية الستة من مجلد [`sample_emails/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/email-triage-agent/sample_emails) الخاص بمثال المستودع إلى مجلد `sample_emails/` الخاص بمشروعك، ثم شغّل:

```bash
uv run python triage.py
```

`text.partition("\n\n")` تقوم بالعمل الفعلي هنا: تقسّم الملف إلى قطعتين بالضبط عند السطر الفارغ *الأول* — كل شيء قبله (الرؤوس) وكل شيء بعده (النص) — وهذا بنية كافية للعمل بها دون استيراد مكتبة تحليل بريد إلكتروني كاملة لنص بهذه البساطة.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يعمل `uv run python triage.py` دون أخطاء ويطبع ست رسائل مُحمَّلة.</StepChecklistItem>
<StepChecklistItem>يُظهر كل سطر مطبوع موضوعًا ومرسِلًا حقيقيين، لا `"unknown"` أو `"(no subject)"`.</StepChecklistItem>
<StepChecklistItem>`sample_emails/` موجود في مجلد مشروعك ويحتوي الملفات الستة `.txt`.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تبحث `parse_email` عن السطر الفارغ *الأول* لفصل الرؤوس عن النص. ماذا سيسوء لو كانت إحدى الرسائل النموذجية تحتوي سطرًا فارغًا في مكان ما داخل نص جسمها؟
- يمكن لملفات `.eml` الحقيقية أن تحتوي عشرات الرؤوس (`Message-ID`، و`Content-Type`، و`X-Mailer`، وأكثر) يتجاهلها هذا المحلِّل بصمت بقراءته فقط `from` و`subject` و`date`. لماذا يعتبر تجاهل الباقي القرار الصحيح لهذا المشروع؟

## الخطوة 2: صنّف ورتّب أولوية كل رسالة بنموذج لغوي

الآن سلّم كل رسالة مُحلَّلة إلى نموذج لغوي واطلب منه فرزها إلى فئة وأولوية — خطوة الفرز الفعلية. أضف هذا إلى `triage.py`:

```python
import json
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

# Every provider below exposes an OpenAI-compatible Chat Completions
# endpoint, so one client class covers all six -- only the base_url, model
# name, and which environment variable holds the key change.
PROVIDERS = {
    "github": {
        "base_url": "https://models.github.ai/inference",
        "api_key_env": "GITHUB_TOKEN",
        "model": "gpt-4o-mini",
    },
    "gemini": {
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
        "api_key_env": "GOOGLE_API_KEY",
        "model": "gemini-3.5-flash",
    },
    "groq": {
        "base_url": "https://api.groq.com/openai/v1",
        "api_key_env": "GROQ_API_KEY",
        "model": "llama-3.3-70b-versatile",
    },
    "mistral": {
        "base_url": "https://api.mistral.ai/v1",
        "api_key_env": "MISTRAL_API_KEY",
        "model": "mistral-small-latest",
    },
    "cerebras": {
        "base_url": "https://api.cerebras.ai/v1",
        "api_key_env": "CEREBRAS_API_KEY",
        "model": "llama-3.3-70b",
    },
    "openrouter": {
        "base_url": "https://openrouter.ai/api/v1",
        "api_key_env": "OPENROUTER_API_KEY",
        "model": "meta-llama/llama-3.3-70b-instruct:free",
    },
}


def build_client() -> tuple[OpenAI, str]:
    """Builds an OpenAI-compatible client for LLM_PROVIDER (default "github").
    Returns (client, model_name)."""
    provider = os.environ.get("LLM_PROVIDER", "github")
    config = PROVIDERS[provider]
    client = OpenAI(api_key=os.environ[config["api_key_env"]], base_url=config["base_url"])
    return client, config["model"]


TRIAGE_PROMPT = """You are an email triage assistant. Read the email below and respond with ONLY a JSON object (no other text, no markdown fence), with these exact keys:

- "category": one of "urgent", "needs-reply", "newsletter", "fyi", "spam-ish"
- "priority": one of "high", "medium", "low"
- "reasoning": one short sentence explaining the category and priority
- "needs_reply": true or false

Email:
From: {sender}
Subject: {subject}
Date: {date}

{body}
"""


def triage_email(client: OpenAI, model: str, email: Email) -> dict:
    """Asks the LLM to categorize and prioritize one email. Read-only:
    never modifies or sends anything -- just returns the model's verdict."""
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": TRIAGE_PROMPT.format(
            sender=email.sender, subject=email.subject, date=email.date, body=email.body,
        )}],
    )
    content = response.choices[0].message.content.strip()
    if content.startswith("```"):
        content = content.strip("`").removeprefix("json").strip()
    return json.loads(content)
```

حدِّث كتلة `if __name__ == "__main__":` لاستدعائها فعليًا:

```python
if __name__ == "__main__":
    client, model = build_client()
    emails = load_emails(SAMPLE_EMAILS_DIR)
    print(f"Triaging {len(emails)} email(s) with model '{model}'...\n")
    for email in emails:
        verdict = triage_email(client, model, email)
        print(f"[{email.filename}] {email.subject!r}")
        print(f"  category: {verdict['category']}   priority: {verdict['priority']}")
        print(f"  reasoning: {verdict['reasoning']}\n")
```

```bash
uv run python triage.py
```

الـprompt الذي يطلب "فقط كائن JSON" ثم تحليله بـ`json.loads` هو ما يحوّل استجابة نص حر من النموذج إلى شيء يستطيع كودك فعليًا التفرّع بناءً عليه (`verdict["category"]`، و`verdict["needs_reply"]`) — نفس فكرة `int(input(...))` تحوّل نص لوحة مفاتيح مكتوبًا بحرية إلى شيء يستطيع كودك عمل حساب حسابي عليه، فقط بنموذج لغوي يحل محل لوحة المفاتيح. تلفّ النماذج أحيانًا JSON في سياج ` ```json ` رغم إخبارها بعدم فعل ذلك؛ سطر `content.strip("`")` موجود تحديدًا للنجاة من ذلك دون التعطل.

:::tip[اطلب مجموعة ثابتة من الفئات، لا نصًّا حرًّا]
يوضّح `TRIAGE_PROMPT` سلاسل الفئات الخمس الدقيقة المسموحة بدلًا من أن يطلب من النموذج "ابتكار فئة." نموذج مُعطى قائمة ثابتة وصريحة أكثر اتساقًا بكثير من رسالة إلى أخرى من نموذج يُطلَب منه ابتكار تصنيفات بحرية — وهذا يهم هنا، إذ يعتمد الكود اللاحق (`if verdict["needs_reply"]` من الخطوة 3) على أن تكون القيم متوقَّعة.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يطبع `uv run python triage.py` سطر فئة، وأولوية، وسبب لكل رسائل البريد النموذجية الست.</StepChecklistItem>
<StepChecklistItem>يحصل بريد العميل العاجل والنشرة الإخبارية على فئتين وأولويتين مختلفتين بوضوح.</StepChecklistItem>
<StepChecklistItem>لا `JSONDecodeError` — إن رأيت واحدًا، اطبع سلسلة `content` الخام قبل تحليلها لترى ما أعاده النموذج فعليًا.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تستخدم رسالة الترويج المزعجة (`04_spammy_promo.txt`) لغة استعجال ("تصرّف الآن،" "تنتهي خلال 24 ساعة") تشبه كثيرًا رسالة العميل العاجلة الحقيقية. ماذا في *محتوى* كل رسالة (بخلاف النبرة فقط) قد يتيح لقارئ متأنٍّ — أو prompt متأنٍّ — التمييز بينهما؟
- ماذا تتوقع أن يحدث لو أزلت تعليمة "أجب بفقط كائن JSON" وطلبت من النموذج ببساطة "صنّف هذه الرسالة"؟ جرّب ذلك، وانظر ماذا ينكسر في كودك بايثون نتيجة لذلك.

## الخطوة 3: صُغ (لكن لا ترسل أبدًا) ردًّا

هذه هي الخطوة حيث يبدأ "الوكيل" بأن يعني أكثر من "مُصنِّف" — لأي شيء وسمه النموذج بـ`needs_reply: true`، اطلب منه صياغة رد فعلي. لكن هذا أيضًا حيث يرسم هذا المشروع خطًّا صارمًا: **يصوغ الوكيل النص فقط دائمًا. لا يُرسِل أبدًا شيئًا، لأحد، تحت أي ظرف.** لا يوجد كود SMTP في هذا المشروع على الإطلاق — لا مُعلَّق، لا خلف علامة، ببساطة غير موجود، لأن سكربتًا *يستطيع* إرسال بريد إلكتروني على بُعد خطأ واحد أو prompt سيء واحد من فعل ذلك فعليًا.

أضف هذا إلى `triage.py`:

```python
DRAFT_REPLY_PROMPT = """Draft a short, professional reply to the email below. Write ONLY the reply body text -- no subject line, no commentary about what you're doing, just the reply itself, as if the recipient is about to review and send it.

Original email:
From: {sender}
Subject: {subject}

{body}
"""


def draft_reply(client: OpenAI, model: str, email: Email) -> str:
    """Asks the LLM to draft a reply. The result is ALWAYS just printed and
    saved to a local file for a human to review -- this function has no
    way to actually send anything, on purpose."""
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": DRAFT_REPLY_PROMPT.format(
            sender=email.sender, subject=email.subject, body=email.body,
        )}],
    )
    return response.choices[0].message.content.strip()
```

:::tip[لا تدع وكيلًا يرسل أي شيء أبدًا دون وجودك في الحلقة]
هذا هو الدرس الأهم في هذا المشروع، أهم من أي سطر كود محدد: وكيل يستطيع *صياغة* ردٍّ مفيد؛ وكيل يستطيع *إرسال* واحد بشكل مستقل شيء مختلف جدًّا وأكثر خطورة بكثير — تصنيف خاطئ واحد، أو تعليمة مُحقَنة عبر prompt مخفية في نص رسالة، أو نموذج مرّ بيوم سيء، وقد أرسل شيئًا لم توافق عليه أبدًا، لشخص حقيقي، لا تستطيع سحبه. تُعيد دالة `draft_reply` الخاصة بهذا المشروع سلسلة نصية ولا تفعل شيئًا آخر — بلا `smtplib`، بلا "إرسال تلقائي إذا كانت الثقة عالية،" بلا أي شيء تلقائي. هذه ليست ميزة ناقصة. إنها التصميم. حافظ على ذلك الحد لو وسّعت هذا المشروع بنفسك.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>`draft_reply` مُعرَّفة، تأخذ `Email`، وتُعيد سلسلة نصية بسيطة — لا شيء فيها يلمس الشبكة عدا استدعاء API واحد للنموذج اللغوي.</StepChecklistItem>
<StepChecklistItem>يمكنك الإشارة إلى المكان الدقيق في كودك حيث سيلزم إرسال رد منه، وتأكيد أن ذلك الكود غير موجود.</StepChecklistItem>
<StepChecklistItem>تفهم *لماذا* يهم هذا، لا فقط أنها قاعدة — راجع الأسئلة السقراطية أدناه.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تخيَّل نسخة من هذا المشروع تُرسِل ردًّا تلقائيًا كلما أبلغ النموذج عن ثقة عالية. ما طريقة واقعية يمكن أن يسوء بها ذلك — لبريد العميل العاجل تحديدًا، أو للترويج المزعج؟
- تحتوي إحدى الرسائل النموذجية (`04_spammy_promo.txt`) لغة تلاعبية مصممة لجعل القارئ يتصرف بسرعة دون تفكير. لو صمّم مهاجم حقيقي رسالة خصيصًا للتلاعب بـ*وكيل ذكاء اصطناعي* يقرؤها (بدلًا من إنسان)، كيف قد يبدو ذلك، وكيف كان سيحمي عدم-الإرسال-التلقائي-أبدًا ضد ذلك حتى لو خُدِعت خطوة التصنيف؟

## الخطوة 4: شغّله من البداية للنهاية وراجع المخرجات

اربط كل شيء معًا — صنّف كل رسالة، صُغ ردًّا للتي تحتاج واحدًا، واحفظ كل مسودة في مجلد محلي `drafts/` بدلًا من طباعة جدران من النص في الطرفية:

```python
DRAFTS_DIR = Path("drafts")

if __name__ == "__main__":
    client, model = build_client()
    emails = load_emails(SAMPLE_EMAILS_DIR)
    DRAFTS_DIR.mkdir(exist_ok=True)
    print(f"Triaging {len(emails)} email(s) with model '{model}'...\n")

    for email in emails:
        verdict = triage_email(client, model, email)
        print(f"[{email.filename}] {email.subject!r}")
        print(f"  category: {verdict['category']}   priority: {verdict['priority']}")
        print(f"  reasoning: {verdict['reasoning']}")

        if verdict.get("needs_reply"):
            reply = draft_reply(client, model, email)
            draft_path = DRAFTS_DIR / f"{Path(email.filename).stem}_draft_reply.txt"
            draft_path.write_text(reply, encoding="utf-8")
            print(f"  -> draft reply saved to {draft_path}  (NOT sent -- review and send yourself)")
        print()

    print(f"Done. Review anything in {DRAFTS_DIR}/ yourself before sending.")
```

```bash
uv run python triage.py
```

افتح الملفات في `drafts/` واقرأها فعليًا — هذه هي غاية المشروع بأكمله. هل كنت لترسل ما صاغه النموذج، كما هو؟ هل كنت لتعدّله أولًا؟ لمسودة واحدة على الأقل، أعد كتابتها بكلماتك الخاصة قبل أن تعتبرها "منتهية" — تلك المراجعة التحريرية هي بالضبط خطوة الإنسان-في-الحلقة التي بُني هذا المشروع حولها، لا فكرة متأخرة أُلصِقت فوقه.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يعمل `uv run python triage.py` حتى الاكتمال ويطبع سطر فرز لكل رسائل البريد النموذجية الست.</StepChecklistItem>
<StepChecklistItem>يحتوي `drafts/` ردًّا محفوظًا لكل رسالة وسمها النموذج بـ`needs_reply: true`، ولا ملف للتي لم يفعل.</StepChecklistItem>
<StepChecklistItem>فتحت وقرأت فعليًا مسودة رد واحدة على الأقل، ويمكنك القول ما إذا كنت لترسلها كما هي أو تعدّلها أولًا.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- اقرأ مسودة الرد لـ`03_needs_reply_coworker.txt` (تباين أرقام الربع الثالث). هل يحلّ فعليًا التباين، أم يقرّ فقط بالسؤال؟ ماذا يخبرك ذلك عمّا يستطيع وما لا يستطيع نموذج الصياغة فعله بمفرده؟
- لو شغّلت هذا السكربت مرتين على نفس الرسالة، هل تتوقع أن تكون مسودتا الرد متطابقتين؟ جرّب ذلك. ماذا تخبرك الإجابة عن الاعتماد على مخرجات نموذج لغوي واحد كما لو كانت دالة ثابتة وحتمية؟

## اختياري، "اذهب أبعد": اربط هذا بصندوق بريد حقيقي

كل ما سبق يعمل بالكامل على رسائل البريد النموذجية المُرفَقة — لا صندوق بريد حقيقي، لا كلمة مرور حقيقية، لا شيء يغادر جهازك. هذا القسم ليس عمدًا المسار الأساسي: إنه امتداد اختياري لمرة تصبح فيها مرتاحًا مع كيفية تصرّف السكربت، لا شيء تلجأ إليه في اليوم الأول.

يدعم Gmail (ومعظم المزوّدين) **كلمات مرور التطبيقات** — كلمة مرور منفصلة، قابلة للإلغاء، محدودة الغرض تولّدها خصيصًا لتطبيق واحد، بدلًا من إعطاء ذلك التطبيق كلمة مرور حسابك الحقيقية. لو احتاجت كلمة مرورك الحقيقية للتغيير يومًا ما، يمكن إلغاء كلمة مرور تطبيق بشكل مستقل؛ لو احتاجت هي للتغيير يومًا ما، لا تلمس بيانات اعتماد تسجيل دخولك الحقيقية على الإطلاق. لإنشاء واحدة لـGmail: فعّل التحقق بخطوتين على حساب Google الخاص بك، ثم زر [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) وولِّد كلمة مرور تطبيق جديدة لـ"البريد." استخدم *تلك* كلمة المرور المُولَّدة، لا كلمة مرور Gmail الحقيقية أبدًا، في أي مكان في هذا المشروع.

ثبّت حزمة `imap-tools` الاختيارية (ليست جزءًا من تبعيات الدرس الأساسي) وأضف بيانات اعتماد IMAP إلى `.env`:

```bash
uv add imap-tools
```

```bash
# .env — add these three lines
IMAP_HOST=imap.gmail.com
IMAP_USER=you@gmail.com
IMAP_APP_PASSWORD=كلمة-مرور-التطبيق-الخاصة-بك-هنا
```

يجلب [`fetch_from_imap.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/email-triage-agent/fetch_from_imap.py) الخاص بمثال المستودع أحدث رسائلك غير المقروءة **للقراءة فقط** — `mark_seen=False` تعني أن تنزيل رسالة هنا لا يعلّمها كمقروءة في صندوق بريدك الحقيقي — ويحفظ كل واحدة كملف `.txt` محلي بنفس شكل رسائل البريد النموذجية الخاصة بـ`triage.py` تمامًا:

```bash
uv run python fetch_from_imap.py
uv run python triage.py real_emails
```

إذا كنت لا تستخدم Gmail، يدعم معظم المزوّدين IMAP بكلمة مرور تطبيق أو ما يعادلها — تحقق من إعدادات أمان حساب مزوّدك للخيار المكافئ، واضبط `IMAP_HOST` وفقًا لذلك.

:::tip[أقل امتياز، مُطبَّق على صندوق بريدك الخاص]
كلمة مرور تطبيق محصورة بـ"البريد" فقط، يمكنك إلغاؤها في أي وقت دون لمس تسجيل دخولك الحقيقي، هي نفس فكرة *أقل امتياز* خلف مفاتيح API، وأذونات الملفات، ورموز الوصول المحدودة في أماكن أخرى من هذه الدورة — امنح أقل قدر من الوصول ينجز المهمة، لا حسابك بالكامل. لا تستخدم أبدًا كلمة مرور Gmail الحقيقية هنا، ولا تتخطَّ أبدًا التحقق بخطوتين لجعل الإعداد أسرع.
:::

## ⚠️ مآزق شائعة

- **لا يُعيد النموذج JSON صالحًا.** رغم تعليمة الـprompt "فقط كائن JSON،" قد يضيف نموذج أحيانًا جملة شاردة أو يلفّ المخرجات في سياج كود. إذا رفع `json.loads` استثناءً، اطبع سلسلة `content` الخام أولًا لترى بالضبط ما عاد قبل افتراض أن كودك هو المخطئ.
- **الخلط بين "المُصاغ" و"المُرسَل".** ملف محفوظ في `drafts/` ليس بريدًا إلكترونيًا مُرسَلًا — لم يذهب شيء إلى أي مكان بعد. إن أردت الرد فعليًا، افتح عميل بريدك الإلكتروني الحقيقي وانسخ المسودة بنفسك؛ هذا هو التصميم، لا خطوة ناقصة.
- **حدود المعدل في مستوى النموذج اللغوي المجاني.** ست رسائل تعني استدعاءين للنموذج اللغوي لكل واحدة (فرز، بالإضافة إلى مسودة لأي شيء يحتاج ردًّا) — كافٍ لتصادف خطأ 429 أحيانًا في مستوى مجاني. هذا ليس خطأً برمجيًا؛ راجع قسم "التعامل مع حدود المعدل" في [مشروع وكيل الذكاء الاصطناعي](/docs/projects/ai-agent) لنفس النمط ونهج إعادة محاولة يمكنك نسخه.
- **معاملة تصنيفات الفئة/الأولوية كحقيقة مطلقة.** حكم النموذج بـ`"urgent"` أو `"spam-ish"` اقتراح، لا حقيقة — قد يسيء تقدير رسالة موجزة لكن عاجلة فعليًا كمنخفضة الأولوية، أو قائمة بريدية مشروعة كرسائل مزعجة. راجع التصنيف بنفسك قبل الثقة به عمياء، خاصة في البداية.

## ما بنيته للتو

خط أنابيب فرز صغير لكنه كامل: حلّل، صنّف بنموذج لغوي، صُغ باستدعاء ثانٍ لنموذج لغوي، و — بشكل حاسم — توقف هناك. لا شيء هنا تبسيط تجريبي لحدود الأمان؛ يجب أن يرسم مساعد بريد إلكتروني إنتاجي يتعامل مع صندوق بريدك الحقيقي بالضبط نفس الخط بين "الوكيل يقرر ماذا يقول" و"إنسان يقرر ما إذا كان سيقوله فعليًا،" فقط بمزيد من الرسائل وربما مزيد من الفئات. حجم صندوق البريد يتغير؛ الحد لا ينبغي أن يتغير.

## إلى أين تذهب من هنا

- أضف مزيدًا من الفئات أو مقياس أولوية أدق، وانظر كيف يحتاج الـprompt للتغيير لإبقاء النموذج متسقًا مع نمو مجموعة التصنيفات.
- وسِّع `parse_email` للتعامل مع ملفات `.eml` حقيقية (وحدة `email` المدمجة في Python تحلّل هذه بشكل صحيح، بما في ذلك المرفقات والأجسام متعددة الأجزاء) بدلًا من تنسيق النص البسيط المُبسَّط المُستخدَم هنا.
- جرّب استدعاءً ثانيًا للنموذج اللغوي يراجع مسودة النموذج *الأول* قبل حفظها — نمط بسيط من مرورين "صُغ، ثم انتقد،" وتذوّق أول لطيف لخطوط أنابيب وكيل متعددة الخطوات مثل تلك في [مشروع وكيل الذكاء الاصطناعي](/docs/projects/ai-agent).

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓

<ProjectProgressCheckbox projectId="email-triage-agent" />
