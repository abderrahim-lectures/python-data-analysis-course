---
id: github-issue-triage-agent
title: "بناء وكيل فرز issues في GitHub"
sidebar_label: "بناء وكيل فرز issues في GitHub"
slug: /projects/github-issue-triage-agent
description: "تخرّج من بيئة البرمجة في المتصفح إلى Python فعلي: اجلب issues مفتوحة من مستودع GitHub عام حقيقي واستخدم نموذجًا لغويًا من مستوى مجاني لصياغة اقتراحات وسوم فرز يراجعها صائن بشري."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 بناء وكيل فرز issues في GitHub

<ProjectPublishedDate projectId="github-issue-triage-agent" />

<ProjectGreeting />

كل مستودع مفتوح المصدر بأي حركة مرور يتراكم عليه رصيد من issues غير مفروزة — تقارير أخطاء، طلبات ميزات، أسئلة، وتكرارات، كلها جالسة هناك بلا وسم حتى يجد صائن وقتًا لفرزها يدويًا. يبني هذا المشروع سكربتًا صغيرًا يقوم بالمرور الأول عنهم: يجلب issues **المفتوحة** لمستودع عام حقيقي مباشرة من واجهة GitHub البرمجية نفسها، ويرسل كل واحدة إلى نموذج لغوي من مستوى مجاني، ويطبع تقريرًا يقترح وسم فرز وتبريرًا بجملة واحدة لكل issue — النوع من الأشياء التي يمكن لصائن تصفحها في دقيقة بدلًا من قراءة كل issue من الصفر.

هذا يفترض Python 101 — لا يُشترط أي شيء من تحليل البيانات. هذا اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/docs/projects) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. تثبيت `uv`، والحصول على مفتاح API لنموذج لغوي من مستوى مجاني، وإعداد مشروع صغير.
2. جلب issues مفتوحة من مستودع GitHub عام حقيقي باستخدام واجهة REST المجانية الخاصة بـGitHub — لا مصادقة مطلوبة للقراءات العامة.
3. كتابة prompt يحوّل عنوان ونص issue إلى طلب لوسم فرز مقترح وتبرير بجملة واحدة.
4. استدعاء النموذج اللغوي لكل issue وتحليل رده.
5. طباعة تقرير فرز قابل للقراءة، وتشغيل كل شيء من البداية للنهاية مقابل مستودع حقيقي.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي والموصى به — نفس خطوة "التخرّج إلى Python فعلي" كأي مشروع آخر في هذا القسم.

**GitHub Codespaces** يعمل بنفس الجودة، ومريح بشكل ملحوظ لهذا المشروع بالتحديد: افتح [مستودع الدورة كاملًا في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython وuv مثبّتة بالفعل، وفق `.devcontainer/devcontainer.json` الخاص بالمستودع) وأنت بالفعل جالس داخل بيئة واعية بـ`git`/`gh` بهوية GitHub حقيقية مرفَقة — ملاءمة طبيعية لمشروع يدور بأكمله حول مستودعات وissues GitHub.

**Google Colab أو Kaggle Notebooks** جيدان أيضًا هنا — هذا سكربت خفيف يستدعي واجهة برمجية بلا خادم ملفات محلي أو عملية طويلة التشغيل لإدارتها، لذا `!pip install requests python-dotenv openai` في خلية متبوعة بلصق الكود كخلايا دفتر ملاحظات يعمل دون تكييف كبير. نسخة دفتر ملاحظات جاهزة موجودة في [`examples/github-issue-triage-agent/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/github-issue-triage-agent/notebook.ipynb) إن كنت تفضّل عدم لصق الكود بنفسك:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/github-issue-triage-agent/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/github-issue-triage-agent/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fgithub-issue-triage-agent%2Fnotebook.ipynb)

## الإعداد

### 1. ثبّت `uv`

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

### 2. أعِدَّ المشروع

```bash
uv init github-issue-triage-agent
cd github-issue-triage-agent
uv add requests python-dotenv openai
```

تجلب `requests` issues من واجهة REST الخاصة بـGitHub؛ تحمّل `python-dotenv` مفتاح API الخاص بك من ملف `.env` محلي؛ `openai` هي العميل المُستخدَم لاستدعاء GitHub Models افتراضيًا (واجهته البرمجية متوافقة مع OpenAI) — انظر التلميح أدناه إن اخترت مزوّد نموذج لغوي مختلفًا.

### 3. احصل على مفتاح API مجاني لنموذج لغوي

**اختر المزوّد الذي تفضّله** — لا يتطلب أي منها بطاقة ائتمان وقت كتابة هذا، ولا تفضّل هذه الدورة أحدهم على الآخر. المثال الأوسع في مستودع الدورة ([`examples/github-issue-triage-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/github-issue-triage-agent)) يدعم الستة جاهزين للاستخدام، ويُختار بينهم بإعداد واحد.

| المزوّد | أين تحصل على مفتاح | لماذا قد تختاره |
|---|---|---|
| **GitHub Models** *(الافتراضي المقترح)* | [github.com/settings/tokens](https://github.com/settings/tokens) — رمز وصول شخصي بنطاق `models: read` | لا تسجيل منفصل — لديك حساب GitHub بالفعل، ويحتاج هذا المشروع واحدًا بالفعل لواجهة issues البرمجية. حدود مستوى مجاني أكثر سخاءً من Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | الخيار الأكثر ذكرًا شيوعًا؛ استُخدِم في مسودات سابقة من هذه الصفحة. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | استدلال سريع، مستوى مجاني سخي، بلا بطاقة. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | واحدة من أكثر الحصص المجانية الدائمة سخاءً. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | حجم رموز يومي مرتفع، بلا بطاقة. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | واجهة برمجة واحدة، نماذج مجانية عديدة — جيدة لمقارنة المزوّدين. |

أيًّا كان الذي تختاره، العملية واحدة: سجّل الدخول وأنشئ مفتاح API على موقع ذلك المزوّد، ثم **لا تلصقه أبدًا مباشرة في الكود ولا ترفعه إلى مستودع** — ضعه بدلًا من ذلك في ملف `.env` (القسم التالي).

:::tip[تستخدم مزوّدًا مختلفًا عن GitHub Models؟]
يستخدم كود هذا الدرس حزمة `openai` لاستدعاء GitHub Models، بما أن GitHub Models وCerebras وOpenRouter كلها متوافقة مع OpenAI (نفس العميل، `base_url` مختلفة). يحتاج Gemini وGroq وMistral SDK خاصًا بهما — `uv add google-generativeai`، أو `uv add groq`، أو `uv add mistralai` على التوالي — وتبديلًا صغيرًا في `call_llm` أدناه. المثال الأوسع في المستودع ([`examples/github-issue-triage-agent/triage.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/github-issue-triage-agent)) يحتوي بالفعل الستة موصَّلة جنبًا إلى جنب.
:::

### 4. أنشئ ملف `.env` الخاص بك

```bash
# .env
LLM_PROVIDER=github
GITHUB_TOKEN=مفتاح-مزوّد-النموذج-اللغوي-الخاص-بك-هنا

# Optional -- see Step 1 below. Raises GitHub's API rate limit; not required.
GITHUB_API_TOKEN=
```

`GITHUB_TOKEN` هنا هو مفتاح **مزوّد النموذج اللغوي** الخاص بك (GitHub Models تحديدًا) — لا يلزم أن يكون نفس الرمز مثل `GITHUB_API_TOKEN`، وهو رمز منفصل تمامًا واختياري يُستخدَم فقط لخطوة جلب issues أدناه. لا بأس أن يكونا نفس رمز الوصول الشخصي إن ولّدت واحدًا واضعًا كلا الاستخدامين في اعتبارك، لكن لا هذا المشروع ولا GitHub يشترط ذلك.

## الخطوة 1: اجلب issues مفتوحة من مستودع حقيقي

تعرض GitHub واجهة REST مجانية لقراءة بيانات مستودعات عامة — لا مصادقة مطلوبة لقراءة issues من مستودع عام. أنشئ `triage.py`:

```python
# triage.py
import requests

GITHUB_API_URL = "https://api.github.com"


def fetch_open_issues(owner: str, repo: str, limit: int = 10) -> list[dict]:
    """Fetch up to `limit` OPEN issues from a public GitHub repo."""
    response = requests.get(
        f"{GITHUB_API_URL}/repos/{owner}/{repo}/issues",
        params={"state": "open", "per_page": min(limit, 100), "sort": "updated"},
        headers={"Accept": "application/vnd.github+json"},
        timeout=10,
    )
    response.raise_for_status()
    # GitHub's /issues endpoint also returns pull requests -- a PR *is* an
    # issue internally. Real issues lack a "pull_request" key, so filter it.
    issues = [item for item in response.json() if "pull_request" not in item]
    return issues[:limit]


if __name__ == "__main__":
    issues = fetch_open_issues("psf", "requests", limit=10)
    for issue in issues:
        print(f"#{issue['number']}: {issue['title']}")
```

```bash
uv run python triage.py
```

يجب أن ترى حتى 10 أسطر، كل واحد رقم وعنوان issue حقيقي ومفتوح حاليًا من [`psf/requests`](https://github.com/psf/requests). `params={"state": "open", ...}` تقوم بالتصفية المهمة هنا — الافتراضي في GitHub سيتضمن أيضًا issues مغلقة، ويهتم هذا المشروع فقط بتلك التي لا تزال تحتاج فرزًا.

:::tip[حد معدل GitHub غير المصادَق عليه منخفض]
الطلبات غير المصادَق عليها إلى واجهة REST الخاصة بـGitHub محدودة بـ**60 طلبًا/ساعة، لكل عنوان IP** — سهل الوصول إليه إن كنت تعيد تشغيل هذا السكربت كثيرًا أثناء التطوير، أو تشارك عنوان IP مع زملاء على نفس الشبكة. هذا الدرس يُجري طلب API واحد فقط لكل تشغيل (استدعاء واحد يجلب حتى 100 issue دفعة واحدة)، لذا على الأرجح لن تصله فقط باتباع الدرس — لكن إن رأيت `403` مع رسالة عن حد المعدل، فهذا ما حدث. ضبط `GITHUB_API_TOKEN` (أي رمز وصول شخصي، لا تُشترط نطاقات للقراءات العامة) في `.env` الخاص بك يرفع الحد إلى 5,000 طلب/ساعة — انظر الخطوة الاختيارية في الإعداد أعلاه.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يعمل `uv run python triage.py` دون أخطاء ويطبع أرقام وعناوين issues حقيقية.</StepChecklistItem>
<StepChecklistItem>لا يوجد سطر مطبوع هو pull request — تحقق من عدد قليل من الأرقام المطبوعة مقابل تبويب Issues الفعلي للمستودع على GitHub.</StepChecklistItem>
<StepChecklistItem>تغيير `owner`/`repo` إلى مستودع عام حقيقي مختلف لا يزال يعمل.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يعمل مُرشِّح `"pull_request" not in item` *بعد* عودة الطلب، على بيانات أرسلتها GitHub بالفعل. هل يمكنك بدلًا من ذلك أن تطلب من GitHub استبعاد pull requests في الطلب نفسه؟ ماذا ستحتاج للتحقق منه في وثائق واجهة GitHub البرمجية لمعرفة ذلك؟
- `sort="updated"` تعني أن الـ10 issues التي تحصل عليها هي الـ10 *المُحدَّثة الأحدث*، لا الأقدم أو الأحدث إنشاءً. لماذا قد يكون "المُحدَّث الأحدث" افتراضيًا أكثر فائدة لأداة فرز من "المُنشَأ الأحدث"؟

## الخطوة 2: اكتب prompt اقتراح فرز لكل issue

يحتاج كل issue أن يتحول إلى prompt يطلب من النموذج بالضبط شيئين: وسم من قائمة ثابتة، وتبرير بجملة واحدة. أضف هذا إلى `triage.py`:

```python
MAX_BODY_CHARS = 2000  # keep each issue's body well inside any model's context window
LABEL_CHOICES = ["bug", "feature", "question", "docs", "duplicate-looking", "other"]


def build_triage_prompt(issue: dict) -> str:
    title = issue.get("title") or "(no title)"
    body = (issue.get("body") or "(no description provided)")[:MAX_BODY_CHARS]

    return (
        "You are drafting a SUGGESTION for a human maintainer triaging a GitHub "
        "issue. You are not applying anything -- your output will be reviewed by "
        "a person before any label is added.\n\n"
        f"Choose exactly one label from this list: {', '.join(LABEL_CHOICES)}.\n\n"
        f"Issue title: {title}\n"
        f"Issue body:\n{body}\n\n"
        "Reply in exactly this two-line format, nothing else:\n"
        "Label: <one label from the list>\n"
        "Rationale: <one sentence explaining the suggested label and its priority>"
    )
```

قراران متعمَّدان هنا. أولًا، تقتطع `MAX_BODY_CHARS` نص issue — بعض issues تصل إلى آلاف الكلمات (stack traces ملصقة، سجلات طويلة)، ولا فائدة من إنفاق رموز على أكثر مما يحتاجه النموذج لفهم الفكرة العامة؛ انظر قسم المآزق أدناه لمعرفة ما يحدث إن تخطيت هذا. ثانيًا، يطلب الـprompt تنسيق رد ثابتًا وبسيطًا من سطرين (`Label: ...` / `Rationale: ...`) بدلًا من JSON — أسهل للاتباع بموثوقية لنموذج صغير من مستوى مجاني، وسهل بما يكفي للتحليل بأساليب سلاسل نصية بسيطة في الخطوة التالية.

:::tip["اقترح، لا تُطبِّق" تعليمة بنيوية، لا لطف زائد]
لاحظ أن الـprompt يخبر النموذج صراحة بأنه يصوغ اقتراحًا لمراجعة بشرية، لا يُطبِّق أي شيء. يدعم هذا السكربت ذلك بسلوك حقيقي، لا كلمات فقط: لا شيء في `triage.py` يستدعي أبدًا نقطة نهاية GitHub التي ستضيف وسمًا أو تعليقًا إلى issue حقيقي — يقرأ فقط issues ويطبع نصًا في طرفيتك. هذا حد أمان متعمَّد، نفس المبدأ خلف أي أداة ذكاء اصطناعي تلمس أشياء أشخاص آخرين: صُغ بثقة، تصرّف فقط بإنسان في الحلقة، خصوصًا لشيء سهل إساءة فهمه بدقة كقراءة بجملة واحدة لتقرير خطأ شخص آخر.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يتضمن `build_triage_prompt` عنوان الـissue الحقيقي و(المقتطَع) النص الحقيقي، لا نص عنصر نائب.</StepChecklistItem>
<StepChecklistItem>يسرد الـprompt كل `LABEL_CHOICES` صراحة، لا تعليمة غامضة بـ"اختر وسمًا".</StepChecklistItem>
<StepChecklistItem>طباعة `build_triage_prompt(issues[0])` لـissue حقيقي مجلوب ينتج prompt جيد التشكيل وقابل للقراءة.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لماذا تقييد النموذج بقائمة `LABEL_CHOICES` ثابتة بدلًا من تركه يبتكر أي وسم يريده؟ ماذا ستخسر لو أزلت ذلك القيد؟
- لو كان نص issue فارغًا (بعض issues بالفعل بلا نص)، ماذا يرسل `build_triage_prompt` حاليًا للنموذج؟ هل هذا prompt معقول، أم كنت لتحسّنه؟

## الخطوة 3: استدعِ النموذج اللغوي وحلّل رده

الآن اربط استدعاء نموذج لغوي حقيقي، وحوّل رده ذا السطرين مرة أخرى إلى `dict` بايثون قابل للاستخدام:

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)


def call_llm(prompt: str) -> str:
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # confirm this still has a free tier before relying on it
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,  # a triage suggestion should be consistent, not creative
    )
    return response.choices[0].message.content or ""


def parse_triage_reply(reply: str) -> dict:
    label, rationale = "other", reply.strip()
    for line in reply.splitlines():
        if line.lower().startswith("label:"):
            candidate = line.split(":", 1)[1].strip().lower()
            label = candidate if candidate in LABEL_CHOICES else candidate or "other"
        elif line.lower().startswith("rationale:"):
            rationale = line.split(":", 1)[1].strip()
    return {"label": label, "rationale": rationale}


def suggest_triage(issue: dict) -> dict:
    reply = call_llm(build_triage_prompt(issue))
    return parse_triage_reply(reply)
```

لا تنسَ `from dotenv import load_dotenv` بالإضافة إلى `load_dotenv()` قرب أعلى الملف، لكي يجد `os.environ["GITHUB_TOKEN"]` فعليًا المفتاح من ملف `.env` الخاص بك — نفس نمط [مشروع وكيل الذكاء الاصطناعي](/docs/projects/ai-agent).

تلجأ `parse_triage_reply` عمدًا إلى `label="other"` والرد الخام كتبرير إن لم يتبع النموذج تنسيق السطرين المطلوب بالضبط — تُضيف النماذج من مستوى مجاني أحيانًا نصًّا شاردًا أو تتخطى سطرًا، ومسودة فرز مشوَّهة قليلًا لا تزال أكثر فائدة مطبوعة لكي يتصفحها إنسان من إسقاطها بصمت بخطأ تحليل.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>استدعاء `suggest_triage` على issue حقيقي مجلوب يُعيد `dict` بـ`label` حقيقية و`rationale` حقيقية بطول جملة — لا خطأً ولا سلاسل فارغة.</StepChecklistItem>
<StepChecklistItem>الـ`label` المُعادة دائمًا واحدة من `LABEL_CHOICES` (أو الملاذ `"other"`)، لا نصًّا اعتباطيًا يتسرب دون تحليل.</StepChecklistItem>
<StepChecklistItem>تغذية `parse_triage_reply` عمدًا برد مشوَّه (مثل `"I think this is a bug"` فقط، بلا أسطر `Label:`/`Rationale:`) لا يتعطل — يلجأ إلى ملاذ بأناقة.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- `temperature=0.2` تحيّز النموذج نحو استجابته الأكثر احتمالًا والأقل "إبداعًا". لماذا قد تهم درجة الحرارة المنخفضة أكثر لأداة فرز مما تهم، لنقل، لمساعد كتابة إبداعية؟
- لو شغّلت `suggest_triage` على نفس الـissue مرتين، هل تتوقع نفس التبرير بالضبط كلتا المرتين؟ ماذا تقترح إجابتك عن مدى ثقة صائن بمقترح واحد مقابل معاملته كنقطة بيانات واحدة؟

## الخطوة 4: اطبع التقرير وشغّله من البداية للنهاية

اجمع خط الأنابيب بأكمله معًا — جلب، اقتراح، تقرير:

```python
import time


def print_triage_report(owner: str, repo: str, issues: list[dict], suggestions: list[dict]) -> None:
    print("=" * 72)
    print(f"Triage suggestions for {owner}/{repo} -- {len(issues)} open issue(s)")
    print("These are DRAFT suggestions. Review each one before applying any label.")
    print("=" * 72)
    for issue, suggestion in zip(issues, suggestions):
        print(f"\n#{issue['number']}: {issue['title']}")
        print(f"  {issue['html_url']}")
        print(f"  Suggested label: {suggestion['label']}")
        print(f"  Rationale:       {suggestion['rationale']}")


if __name__ == "__main__":
    owner, repo = "psf", "requests"
    issues = fetch_open_issues(owner, repo, limit=10)

    suggestions = []
    for issue in issues:
        suggestions.append(suggest_triage(issue))
        time.sleep(0.5)  # a small, deliberate gap between LLM calls

    print_triage_report(owner, repo, issues, suggestions)
```

```bash
uv run python triage.py
```

يجب أن ترى تقريرًا كاملًا: ترويسة تسمي المستودع وعدد الـissues، ثم كتلة واحدة لكل issue برقمه، وعنوانه، ورابط GitHub الحقيقي، والوسم المقترح، وتبرير بجملة واحدة — بالإضافة إلى سطر التذكير أعلاه بأن هذه مسودات، لا تغييرات مُطبَّقة. جرّب توجيه `owner`/`repo` إلى مستودع عام حقيقي ونشط مختلف (أي واحد بـissues مفتوحة يعمل) وتأكد أن التقرير يتكيف مع محتوى issue مختلف فعليًا، لا مجرد تكرار نفس المخرجات.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>تشغيل `triage.py` من البداية للنهاية يطبع تقريرًا كاملًا دون تتبعات غير مُعالَجة.</StepChecklistItem>
<StepChecklistItem>كل issue في التقرير له رابط GitHub حقيقي، ووسم مقترح، وتبرير غير فارغ.</StepChecklistItem>
<StepChecklistItem>تشغيله مقابل مستودع عام حقيقي ثانٍ مختلف ينتج اقتراحات مختلفة فعليًا، لا تقريرًا يبدو منسوخًا ولصيقًا.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لو كان issueان في نفس المستودع شبه متطابقين، هل سيلاحظ هذا السكربت ذلك؟ ماذا سيتطلب إضافة اقتراح "تكرار محتمل لـ#N" — أي معلومة إضافية سيحتاجها الـprompt؟
- الآن يحصل كل issue على استدعاء نموذج لغوي منفصل خاص به. ماذا سيتغير، للأفضل أو الأسوأ، لو أرسلت بدلًا من ذلك كل الـ10 issues إلى النموذج في prompt واحد وطلبت 10 اقتراحات موسومة دفعة واحدة؟

## ⚠️ مآزق شائعة

- **الوصول لحد معدل GitHub غير المصادَق عليه على مستودع مزدحم أو حلقة تطوير سريعة.** 60 طلبًا/ساعة يبدو كثيرًا حتى تعيد تشغيل السكربت كل دقيقة أثناء التصحيح. `403` يذكر حد المعدل يعني هذا، لا خطأً في كودك — اضبط `GITHUB_API_TOKEN` في `.env` لرفعه إلى 5,000/ساعة.
- **issues بأجسام طويلة جدًا تتجاوز سياق النموذج، أو ببساطة تهدر رموزًا/حصة.** بعض issues تتضمن stack traces كاملة، سجلات ملصقة، أو لقطات شاشة مضمَّنة كنص تصل لآلاف الكلمات. تقتطع `MAX_BODY_CHARS` هذا — أزل ذلك الاقتطاع وتخاطر بطلب بطيء، مكلف ضد حصة مستواك المجاني، أو في حالات نادرة كبير جدًا للنموذج بالكامل.
- **معاملة اقتراح النموذج اللغوي كحقيقة مطلقة بدلًا من مسودة.** نموذج من مستوى مجاني يقرأ عنوانًا ونصًّا مقتطَعًا ليس له وصول إلى اتفاقيات المستودع الفعلية، أو تصنيف وسومه، أو سياق من issues ذات صلة — قد يسم خطأً حقيقيًا كـ"سؤال" خطأً، أو يفوّت أن issueين مكرران. أطّر هذا دائمًا كتسريع مرور أول لإنسان، لا كبديل عن واحد.
- **نسيان أن نقطة نهاية `/issues` في GitHub تُعيد أيضًا pull requests.** تخطَّ مُرشِّح `"pull_request" not in item` من الخطوة 1 وستنتهي بطلب من نموذج لغوي فرز PRs كما لو كانت تقارير أخطاء — نتيجة مُربِكة وخاطئة لشيء ليس issue على الإطلاق.

## ما بنيته للتو

خط أنابيب حقيقي من جلب ← prompt ← اقتراح ← تقرير مقابل مستودع GitHub عام وحي — لا مجموعة بيانات تجريبية. الشكل هنا يعمم جيدًا إلى ما وراء الفرز: أي سير عمل تريد فيه أن يصوغ نموذج لغوي حكمًا لمرور أول على دفعة من عناصر العالم الحقيقي (تذاكر دعم، أوصاف pull request، رسائل عملاء) ليراجعها إنسان يتبع نفس حلقة جلب-عنصر-واحد، بناء-prompt-مركّز، استدعاء-النموذج، تقرير-النتيجة التي كتبتها للتو.

## إلى أين تذهب من هنا

- **طبّق الوسوم فعليًا — بحذر، بمجرد أن تثق بالاقتراحات.** يمكن لـ[CLI الخاص بـ`gh`](https://cli.github.com/) (`gh issue edit 123 --add-label bug`) أو نقطة نهاية تعديل issues الخاصة بواجهة GitHub البرمجية نفسها إضافة وسم فعليًا. لو بنيت هذا، احتفظ بإنسان في الحلقة صراحة — مثل طباعة الاقتراحات أولًا، طلب تأكيد لكل issue (أو لكل دفعة) قبل استدعاء الواجهة البرمجية، ولا تُطبِّق أبدًا وسمًا تلقائيًا مباشرة من المرور الأول لنموذج. عامِل وصول الكتابة إلى issues مستودع شخص آخر بحذر حقيقي، خصوصًا واحدًا لا تصونه بنفسك.
- **اجمع عدة issues في استدعاء واحد للنموذج اللغوي** بدلًا من استدعاء واحد لكل issue — رحلات ذهاب وإياب أقل، لكن prompt أكثر تعقيدًا ومشكلة تحليل أصعب (وضع المخرجات المُهيكَلة/JSON يستحق الاستكشاف هنا).
- **أضف تحققًا من "تكرار محتمل"** بتضمين عناوين issues (انظر [مشروع RAG](/docs/projects/rag-notes) لنمط التضمينات) ووسم الأزواج المتشابهة بشكل مثير للريبة، بدلًا من الاعتماد على تذكّر النموذج اللغوي لكل issue مفتوح آخر بنفسه.
- **خزّن النتائج مؤقتًا** لكي لا يعيد تشغيل السكربت فرز issues راجعتها بالفعل — ملف JSON بسيط مفهرَس برقم issue، يُتحقَّق منه قبل كل استدعاء للنموذج اللغوي، يكفي لنسخة أولى.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/github-issue-triage-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/github-issue-triage-agent) في مستودع الدورة نسخة أكمل من الكود أعلاه، مع المزوّدين الستة من الجدول موصَّلين جنبًا إلى جنب، يُختارون بإعداد واحد، بالإضافة إلى `GITHUB_API_TOKEN` اختياري لحد معدل GitHub الأعلى. استنسخه، أو افتح المستودع كاملًا في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython وuv مثبّتة بالفعل) وشغّله من هناك.
:::

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓

<ProjectProgressCheckbox projectId="github-issue-triage-agent" />
