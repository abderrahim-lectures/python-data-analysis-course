---
id: meeting-notes-summarizer
title: "ابنِ مُلخِّص ملاحظات الاجتماعات"
sidebar_label: "مُلخِّص ملاحظات الاجتماعات"
slug: /projects/meeting-notes-summarizer
description: "تخرَّج من بيئة اللعب داخل المتصفح إلى Python حقيقية: اكتب سكربتًا يحوّل نص اجتماع خام إلى ملخص مُهيكَل — قرارات وعناصر عمل وأسئلة مفتوحة — باستخدام نموذج لغوي من مستوى مجاني وتصميم prompt دقيق."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 ابنِ مُلخِّص ملاحظات الاجتماعات

<ProjectPublishedDate projectId="meeting-notes-summarizer" />

<ProjectGreeting />

كل شيء في الدورة حتى الآن عمل في بيئة لعب معزولة داخل المتصفح — حتى تتمكن من البدء بكتابة Python من اليوم الأول بلا أي إعداد. هذا المشروع هو خطوة التخرّج: ثبّت Python فعليًا على جهازك الخاص، ثم استخدمها لبناء أداة تحل مشكلة حقيقية مزعجة فعلاً من العالم الواقعي — تحويل جدار من نص اجتماع خام إلى ملخص قصير مُهيكَل: ما الذي أُقرَّ، ومن المكلّف بماذا، وما الذي لا يزال عالقًا بلا حل. يفترض هذا Python بمستوى 101؛ لا شيء من تحليل البيانات مطلوب.

هذا اختياري وغير مُقيَّم. راجع [مشاريع من العالم الحقيقي](/docs/projects) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. ثبّت `uv`، أداة سريعة وحديثة لإدارة Python نفسها واعتماديات مشروعك.
2. احصل على مفتاح API مجاني لنموذج لغوي — أيٌّ من ستة مزوّدين يعمل.
3. حمّل نص اجتماع حقيقي (يُشحن هذا المشروع بثلاث عيّنات واقعية، فيعمل بلا أي إعداد).
4. صمّم prompt يطلب من النموذج إعادة **JSON مُهيكَل**، لا نثرًا منسابًا بحرية — المهارة الجوهرية القابلة للنقل في هذا المشروع.
5. استدعِ النموذج، ثم حلّل وتحقّق من استجابة JSON الخاصة به — متعاملًا مع الحالة التي تعود فيها مشوّهة قليلًا، وهو ما يحدث أكثر مما تود.
6. صُغ النتيجة المُهيكَلة كـMarkdown قابل للقراءة وملف `.json` معًا، وشغّل الأمر كله من البداية إلى النهاية على نص اجتماع حقيقي.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الذي تتبعه خطوات هذا الدرس، والموصى به — إنه Python فعلي يعمل على جهازك الخاص، نفس حركة "التخرّج إلى Python حقيقية" كما في كل مشروع آخر في هذا القسم. يشرح قسم الإعداد أدناه كيفية تثبيته.

**GitHub Codespaces** بديل بلا أي إعداد إن كنت تفضّل عدم تثبيت أي شيء محليًا بعد: افتح [مستودع الدورة كاملًا في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython و`uv` مثبّتة مسبقًا، حسب ملف `.devcontainer/devcontainer.json` الخاص بالمستودع) وشغّل نفس أوامر `uv` تمامًا من طرفية في تبويب متصفحك.

**Google Colab وKaggle Notebooks أو Binder** تعمل جيدًا أيضًا، وهي خيارات جيدة فعلًا هنا — هذا المشروع سكربت خفيف يُطلق حفنة من استدعاءات واجهة برمجية، لا شيء يحتاج GPU أو بنية مشروع حقيقية ليكون مفيدًا. نسخة دفتر ملاحظات جاهزة للتشغيل تُشحن مع هذا المشروع — انقر على شارة أدناه لفتحها، بلا أي إعداد محلي — أو أنشئ دفتر ملاحظاتك الخاص، وشغّل `!pip install openai python-dotenv` في خلية، والصق السكربتات أدناه كخلايا، واضبط مفتاح API الخاص بك بسر دفتر ملاحظات (Colab) أو متغيّر بيئة بدلًا من ملف `.env`.

{/* TODO: update these badge links to point at main once this PR merges */}
[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/meeting-notes-summarizer/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/meeting-notes-summarizer/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fmeeting-notes-summarizer%2Fnotebook.ipynb)

## الإعداد

كل ما تحتاجه قبل كتابة أي كود تلخيص — تثبيت `uv`، وإنشاء المشروع، والحصول على مفتاح API مجاني، وضبطه كمتغيّر بيئة — يعيش في هذا القسم الواحد، لذا عليك فعله مرة واحدة فقط.

### 1. ثبّت `uv`

`uv` أداة واحدة تحل محل سلسلة "ثبّت Python، ثم ثبّت pip، ثم ثبّت أداة بيئة افتراضية، ثم ثبّت الحزم" المعتادة — تستطيع تثبيت وإدارة إصدارات Python بنفسها، إلى جانب اعتماديات مشروعك.

**macOS / Linux** (الطرفية):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

أغلق طرفيتك وأعد فتحها، ثم تأكد من التثبيت:

```bash
uv --version
```

يمكن لـ`uv` أيضًا جلب وإدارة مفسّر Python حقيقي مباشرة:

```bash
uv python install 3.12
```

### 2. أنشئ المشروع

```bash
uv init meeting-notes-summarizer
cd meeting-notes-summarizer
uv add openai python-dotenv
```

ينشئ `uv init` مشروعًا صغيرًا (ملف `pyproject.toml` يتتبع اعتمادياتك) ويُثبّت `uv add` الحزم في بيئة معزولة تلقائيًا — بلا إعداد بيئة افتراضية يدوي. `openai` يُستخدم هنا لأن عدة مزوّدين من مستوى مجاني، بمن فيهم الافتراضي المقترح، يعرضون واجهة برمجية متوافقة مع OpenAI، لذا تعمل مكتبة العميل الواحدة عبرهم جميعًا، فقط موجَّهة إلى `base_url` مختلف. يتيح لك `python-dotenv` الاحتفاظ بمفتاح API الخاص بك في ملف `.env` محلي بدلًا من تصديره (`export`) في كل جلسة.

### 3. احصل على مفتاح API مجاني لنموذج لغوي

**اختر أي مزوّد تفضله** — لا يتطلب أيٌّ منها بطاقة ائتمان وقت كتابة هذا النص، وهذه الدورة لا تفضّل واحدًا على آخر.

| المزوّد | أين تحصل على مفتاح | لماذا قد تختاره |
|---|---|---|
| **GitHub Models** *(الافتراضي المقترح)* | [github.com/settings/tokens](https://github.com/settings/tokens) — رمز وصول شخصي بصلاحية `models: read` | لا تسجيل منفصل — لديك بالفعل حساب GitHub. حدود مستوى مجاني أكثر سخاءً من Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | الخيار الأكثر شيوعًا في المراجع. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | استدلال سريع، مستوى مجاني سخي، بلا بطاقة. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | من أكثر الحصص المجانية الدائمة سخاءً. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | حجم رموز يومي مرتفع، بلا بطاقة. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | واجهة برمجية واحدة، نماذج مجانية عديدة — جيدة لمقارنة المزوّدين. |

أيًّا كان اختيارك، العملية نفسها: سجّل الدخول وولّد مفتاح API على موقع ذلك المزوّد.

### 4. أنشئ ملف `.env` الخاص بك

**لا تلصق مفتاح API أبدًا مباشرة في الكود أو تُودعه في مستودع.** أنشئ ملف `.env` في مجلد مشروعك بدلًا من ذلك (وتأكد من إدراج `.env` في `.gitignore`، إلى جانب `.venv` مباشرة):

```bash
# .env
GITHUB_TOKEN=your-key-here
```

:::tip[ملف `.env` أجدى من تصدير (`export`) المفتاح في كل جلسة]
يقرأ `load_dotenv()` من `python-dotenv` ملف `.env` إلى `os.environ` تلقائيًا لحظة بدء سكربتك، لذا لا يتعين عليك أبدًا تذكر تصدير (`export`) مفتاح في كل نافذة طرفية جديدة. راجع [`examples/meeting-notes-summarizer/.env.example`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/meeting-notes-summarizer) من هذه الدورة للاطلاع على قالب يغطي المزوّدين الستة جميعًا.
:::

مع اكتمال الإعداد، كل ما يلي يتعلق بالمُلخِّص الفعلي.

## الخطوة 1: حمّل نص اجتماع نموذجي

أنشئ مجلد `transcripts/` وضع فيه نص اجتماع نصيًا عاديًا — أو انسخ واحدة من العيّنات الثلاث الواقعية التي تُشحن مع مثال مستودع هذا المشروع: اجتماع وقوف يومي، واجتماع تخطيط منتج، ومراجعة حادثة (انظر [`examples/meeting-notes-summarizer/sample_transcripts/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/meeting-notes-summarizer/sample_transcripts)). نص الاجتماع مجرد نص عادي مُوسوم باسم المتحدث، لا شيء أبسط من ذلك:

```text
Maria: Let's start with the API migration. Where are we?
James: About 70% done. I should finish the auth endpoints by Friday.
Maria: Good. Can you also write the migration guide for the team?
James: Yeah, I'll own that too.
Priya: Quick question -- are we still deprecating the v1 endpoints next month?
Maria: Let's hold off on that decision until James finishes the migration. I don't want to commit to a date yet.
```

تحميله هو أصغر خطوة ممكنة، عمدًا:

```python
# load_transcript.py
"""Loads a plain-text meeting transcript from disk.

Run with: uv run python load_transcript.py transcripts/standup.txt
"""

import sys
from pathlib import Path


def load_transcript(path: str) -> str:
    """Reads a transcript file and returns its raw text."""
    text = Path(path).read_text(encoding="utf-8")
    if not text.strip():
        raise ValueError(f"{path} is empty -- nothing to summarize.")
    return text


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "transcripts/standup.txt"
    transcript = load_transcript(path)
    print(f"Loaded {len(transcript)} characters from {path}")
    print(transcript[:200] + ("..." if len(transcript) > 200 else ""))
```

```bash
uv run python load_transcript.py transcripts/standup.txt
```

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يطبع `uv run python load_transcript.py <path>` عدد أحرف غير صفري ومعاينة تبدو كنص اجتماع حقيقي.</StepChecklistItem>
<StepChecklistItem>تشغيله على مسار غير موجود يثير خطأ Python واضحًا بدلًا من عدم فعل أي شيء بصمت.</StepChecklistItem>
<StepChecklistItem>تشغيله على ملف فارغ يُثير `ValueError` الذي كتبته، لا خطأًا مربكًا في مرحلة لاحقة.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لماذا التحقق من نص الاجتماع الفارغ هنا، في الخطوة 1، بدلًا من مجرد ترك prompt فارغ يصل إلى النموذج اللغوي في خطوة لاحقة ورؤية ما يحدث؟
- تفترض هذه الدالة أن نص الاجتماع بأكمله يسع في prompt واحد براحة. ما نص الاجتماع الحقيقي الذي سيكسر هذا الافتراض، وكيف ستعرف تقريبًا قبل تشغيله؟

## الخطوة 2: صمّم prompt لاستخراج مُهيكَل

هذه هي المهارة الفعلية التي يعلّمها هذا المشروع: بدلًا من أن تطلب من نموذج ملخصًا حرّ الشكل في فقرة ("لخّص هذا الاجتماع من فضلك")، تطلب منه أن يُعيد **JSON بشكل محدد** — مخططًا تُعرّفه أنت — ليكون الناتج شيئًا يستطيع كودك الخاص تحليله وتخزينه والتصرف بناءً عليه بموثوقية. هذه نفس فكرة عقد واجهة برمجية، لكنها تُطبَّق عبر صياغة prompt بدلًا من نظام أنواع.

مخطط هذا المشروع: ثلاث قوائم — `decisions`، و`action_items` (لكل عنصر `task` و`owner` اختياري، حينما يسمّي نص الاجتماع شخصًا فعليًا)، و`open_questions`.

```python
# extract_prompt.py
"""Builds the structured-extraction prompt sent to the LLM.

Imported by summarize.py (Step 3) -- not meant to be run directly.
"""

SYSTEM_PROMPT = """You are an assistant that extracts structured information \
from meeting transcripts. You always respond with a single JSON object and \
nothing else -- no markdown code fences, no commentary before or after it."""

# The exact shape we require back. Spelling this out in the prompt itself,
# field by field, is what makes a small/free-tier model actually follow it --
# vague instructions like "return the decisions and action items as JSON"
# produce far less consistent shapes across runs.
JSON_SCHEMA_DESCRIPTION = """Respond with a JSON object with EXACTLY these keys:

{
  "decisions": ["short string describing one decision that was made", ...],
  "action_items": [
    {"task": "short string describing the task", "owner": "person's name, or null if not stated"},
    ...
  ],
  "open_questions": ["short string describing one unresolved question", ...]
}

Rules:
- Only include a decision if the transcript shows the group actually agreeing on something -- not just discussing an option.
- Only include an action item if someone (or the group) commits to doing it.
- "owner" must be null (not the string "null", not "TBD") when no specific person is named for that task.
- If a category has nothing to report, use an empty list -- never omit the key.
- Do not invent information that isn't in the transcript."""


def build_prompt(transcript: str) -> list[dict]:
    """Returns the chat messages list ready to send to the LLM."""
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": f"{JSON_SCHEMA_DESCRIPTION}\n\nTranscript:\n{transcript}",
        },
    ]
```

ثلاثة أشياء تجعل تصميم هذا prompt متعمّدًا، لا مصادفة:

1. **يُذكَر المخطط حرفيًا**، مفتاحًا بمفتاح، بشكل مثال — لا يُوصف بنثر. النماذج أكثر اتساقًا بكثير في مطابقة مثال من في استنتاج مخطط من وصف.
2. **يُسمَح صراحةً لـ`owner` بأن يكون `null`**، مع قاعدة صريحة لمتى يُستخدم. دون تلك القاعدة، تميل النماذج إلى اختلاق اسم يبدو معقولًا، أو كتابة السلسلة `"TBD"` — قيمة سيضطر كود Python الخاص بك بعدها لمعالجتها بشكل خاص إلى الأبد.
3. **يذكر prompt النظامي تنسيق المخرجات كقيد صارم** ("لا شيء آخر — لا أسوار كود markdown، لا تعليقات")، لأن الطريقة الأشيع التي يسوء بها هذا الأمر (انظر الخطوة 3) هي أن يلفّ النموذج JSON الخاص به في سور كود ```` ```json ```` بحكم العادة، حتى عندما يُقال له ألا يفعل.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>تُعيد `build_prompt(transcript)` قائمة من قاموسي رسالتين (`system`، `user`)، مع نص الاجتماع مضمّنًا فعلًا في رسالة المستخدم.</StepChecklistItem>
<StepChecklistItem>يمكنك الإشارة إلى الجملة الدقيقة في `JSON_SCHEMA_DESCRIPTION` التي تخبر النموذج ماذا يفعل عندما لا يُسمّى أي owner.</StepChecklistItem>
<StepChecklistItem>تستطيع أن تشرح، في جملة واحدة، لماذا يُكتب المخطط كمثال JSON حرفي بدلًا من وصف فقرة.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لو أزلت قاعدة "أدرج قرارًا فقط إذا أظهر نص الاجتماع أن المجموعة اتفقت فعلًا على شيء — لا مجرد مناقشة خيار"، فما نوع العناصر التي تعتقد أنها ستبدأ بالتسرّب إلى `decisions` في نص اجتماع مليء بالجدال ذهابًا وإيابًا؟
- يطلب الـ prompt `owner: null` بدلًا من حذف الحقل تمامًا. لماذا قد يكون ذلك أسهل لكود Python الخاص بك في التعامل معه من مخطط يكون فيه الحقل حاضرًا أحيانًا ومفقودًا أحيانًا أخرى؟

## الخطوة 3: استدعِ النموذج اللغوي وحلّل استجابة JSON

الآن أرسل الـ prompt وحوّل أي نص يعود إلى بيانات Python حقيقية — `dict` تستطيع التكرار عليه، لا سلسلة تحتاج لفحصها بالعين. هذا هو المكان الذي تنكسر فيه مشاريع الاستخراج المُهيكَل غالبًا في الممارسة: حتى الـ prompt المصمم جيدًا يحصل أحيانًا على استجابة ملفوفة في سور كود، أو بتعليق زائد، أو بفاصلة شاردة — ويُنهار استدعاء `json.loads()` ساذج على الأنواع الثلاثة جميعًا.

```python
# summarize.py (part 1 -- LLM call + parsing)
"""Calls a free-tier LLM to extract a structured summary from a transcript,
then parses and validates the JSON it returns.

Run with: uv run python summarize.py transcripts/standup.txt
"""

import json
import os
import re
import sys

from dotenv import load_dotenv
from openai import OpenAI

from extract_prompt import build_prompt
from load_transcript import load_transcript

load_dotenv()

REQUIRED_KEYS = {"decisions", "action_items", "open_questions"}


def call_llm(transcript: str) -> str:
    """Sends the structured-extraction prompt and returns the model's raw text reply."""
    client = OpenAI(
        api_key=os.environ["GITHUB_TOKEN"],
        base_url="https://models.github.ai/inference",
    )
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # confirm this still has a free tier before running
        messages=build_prompt(transcript),
        temperature=0,  # deterministic-as-possible extraction, not creative writing
    )
    return response.choices[0].message.content


def extract_json(raw_text: str) -> str:
    """Strips common wrapping the model adds around JSON despite being told not to.

    Handles the two most frequent offenders: a ```json ... ``` markdown fence,
    and leading/trailing prose sentences around an otherwise-valid object.
    """
    text = raw_text.strip()
    fenced = re.search(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL)
    if fenced:
        return fenced.group(1).strip()
    # No fence -- fall back to grabbing everything between the first "{" and
    # the last "}", in case the model added a sentence before or after the object.
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start : end + 1]
    return text


def parse_summary(raw_text: str) -> dict:
    """Parses and validates the model's response, raising a clear error if it
    doesn't match the schema after the best-effort cleanup in extract_json()."""
    cleaned = extract_json(raw_text)
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as error:
        raise ValueError(
            f"Model response wasn't valid JSON even after cleanup: {error}\n"
            f"Raw response was:\n{raw_text}"
        ) from error

    if not isinstance(data, dict) or not REQUIRED_KEYS.issubset(data.keys()):
        raise ValueError(f"Response is missing required keys {REQUIRED_KEYS}. Got: {data!r}")

    # Normalize: make sure each list field really is a list, even if the
    # model returned a single object instead of a one-item list somewhere.
    for key in ("decisions", "action_items", "open_questions"):
        if not isinstance(data[key], list):
            data[key] = [data[key]]

    return data


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "transcripts/standup.txt"
    transcript = load_transcript(path)
    raw = call_llm(transcript)
    summary = parse_summary(raw)
    print(json.dumps(summary, indent=2))
```

```bash
uv run python summarize.py transcripts/standup.txt
```

:::tip[لا تصدّق أبدًا شكل مخرجات نموذج لغوي بشكل أعمى]
عامِل استجابة نموذج لغوي كما تعامل بيانات من واجهة برمجية غير موثوقة أو CSV مرفوع من مستخدم: تحقق منها قبل استخدامها، لا تفترضها. يتعامل `extract_json` مع مشاكل اللفّ الشائعة، وما زال `parse_summary` يُثير خطأ واضحًا ومحددًا — مع النص الخام مرفقًا — إذا لم يطابق الناتج المخطط فعلًا، بدلًا من ترك `KeyError` بعد ثلاث دوال يجعلك تتخمّن ما الذي ساء. إعادة ملخص فارغ بصمت عند فشل التحليل أسوأ من الانهيار: لن تلاحظ أبدًا أن الاستخراج توقف عن العمل بهدوء.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يطبع `uv run python summarize.py transcripts/standup.txt` JSON صالحًا وقابلًا للقراءة بكل المفاتيح الثلاثة المطلوبة.</StepChecklistItem>
<StepChecklistItem>تستطيع أن تشرح ماذا يفعل `extract_json` باستجابة ملفوفة في ```` ```json ... ``` ````، مقابل استجابة بلا أي سور كود.</StepChecklistItem>
<StepChecklistItem>تغيير `REQUIRED_KEYS` مؤقتًا ليشمل مفتاحًا تعرف أنه ليس في المخطط وإعادة التشغيل يُنتج `ValueError` واضحًا خاصًا بك، لا انهيارًا في مكان آخر.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- الحل الاحتياطي لـ`extract_json` — التقاط كل شيء بين أول `{` وآخر `}` — سينكسر على نص اجتماع يحتوي حرفيًا أقواسًا متعرجة في كلام أحدهم (مثل اقتباس مقتطف كود). هل يمكنك التفكير في نهج أكثر متانة، حتى لو كان أكثر عملًا للتنفيذ؟
- لماذا يُثير `parse_summary` استثناءً مع الاستجابة الخام مرفقة، بدلًا من مجرد إعادة `None` عند فشل التحليل؟

## الخطوة 4: صُغ النتيجة كـMarkdown قابل للقراءة

الـ `dict` المحلَّل هو بالضبط ما تريده للحفظ في قاعدة بيانات أو للتغذية إلى سكربت آخر، لكنه ليس شيئًا يريد زميل فريق قراءته في رسالة Slack. حوّله أيضًا إلى ملخص Markdown قصير قابل للتصفّح — نفس البيانات، مُنسَّقة لإنسان بدلًا من برنامج.

```python
# format_summary.py
"""Formats a parsed summary dict as readable Markdown.

Imported by summarize.py (Step 5) -- not meant to be run directly.
"""


def format_markdown(summary: dict, source: str) -> str:
    lines = [f"# Meeting Summary — {source}", ""]

    lines.append("## Decisions")
    if summary["decisions"]:
        lines += [f"- {d}" for d in summary["decisions"]]
    else:
        lines.append("_No decisions recorded._")
    lines.append("")

    lines.append("## Action Items")
    if summary["action_items"]:
        for item in summary["action_items"]:
            owner = item.get("owner") or "unassigned"
            lines.append(f"- [ ] {item['task']} — **{owner}**")
    else:
        lines.append("_No action items recorded._")
    lines.append("")

    lines.append("## Open Questions")
    if summary["open_questions"]:
        lines += [f"- {q}" for q in summary["open_questions"]]
    else:
        lines.append("_No open questions recorded._")

    return "\n".join(lines)
```

`item.get("owner") or "unassigned"` يقوم بعمل مزدوج: يتعامل مع `None` الحرفي (ما يطلب الـ prompt من النموذج استخدامه عندما لا يُسمّى owner) ودفاعيًا مع سلسلة فارغة أو الكلمة `"null"` التي قد تنتجها بعض النماذج الأصغر رغم التعليمات — في كلتا الحالتين، يرى القارئ "unassigned" بدلًا من فراغ أو `null` حرفي مربك.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>تُعيد `format_markdown(summary, "standup.txt")` سلسلة تبدأ بعنوان `# Meeting Summary`.</StepChecklistItem>
<StepChecklistItem>عنصر عمل بلا owner مُسمّى يظهر كـ"unassigned"، لا فراغ أو الكلمة "None".</StepChecklistItem>
<StepChecklistItem>تمرير ملخص تكون فيه كل قائمة فارغة ما زال يُنتج Markdown صالحًا وقابلًا للقراءة (أسطر `_No ... recorded._`)، لا قسمًا فارغًا أو مكسورًا.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تُعرض عناصر العمل كـ`- [ ] task` — صيغة مربع اختيار Markdown بتنسيق GitHub. أين قد يكون ذلك مفيدًا فعلًا مقابل زخرفيًا بحتًا، اعتمادًا على أين ينتهي هذا الملف (مشكلة GitHub، رسالة Slack، ملف نصي عادي)؟
- لماذا بناء Markdown من الـ `dict` *المحلَّل بالفعل*، بدلًا من طلب أن يولّد النموذج اللغوي Markdown مباشرة في الخطوة 3 وتخطي هذه الخطوة؟

## الخطوة 5: شغّله من البداية إلى النهاية

اربط القطع معًا: حمّل نص اجتماع، واستدعِ النموذج، وحلّل JSON وتحقّق منه، ثم اكتب ملفي `.md` و`.json` بجانب المدخل.

```python
# summarize.py (part 2 -- appended to part 1 above)

from pathlib import Path

from format_summary import format_markdown


def summarize(path: str) -> dict:
    """Runs the full pipeline for one transcript and writes both output files."""
    transcript = load_transcript(path)
    raw = call_llm(transcript)
    summary = parse_summary(raw)

    stem = Path(path).stem
    Path(f"{stem}_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    Path(f"{stem}_summary.md").write_text(format_markdown(summary, source=path), encoding="utf-8")

    return summary


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "transcripts/standup.txt"
    summary = summarize(path)
    print(format_markdown(summary, source=path))
    print(f"\n(also wrote {Path(path).stem}_summary.json and {Path(path).stem}_summary.md)")
```

```bash
uv run python summarize.py transcripts/standup.txt
uv run python summarize.py transcripts/product_planning.txt
uv run python summarize.py transcripts/incident_review.txt
```

شغّله على العيّنات الثلاث جميعًا (أو نسخة [`examples/meeting-notes-summarizer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/meeting-notes-summarizer) الأشمل من المستودع، التي تُشحن بالثلاث جاهزة) وقارن المخرجات: اجتماع الوقوف، واجتماع تخطيط، ومراجعة حادثة، كل واحد يضغط على المخطط بشكل مختلف — مراجعة الحادثة، مثلًا، تميل لإنتاج أسئلة مفتوحة أكثر بكثير من عناصر العمل.

:::tip[حدود المعدل متوقعة، لا خلل]
يحدّ كل مستوى مجاني الطلبات في الدقيقة أو في اليوم، وكل استدعاء لـ`summarize()` هو بالضبط طلب واجهة برمجية واحد — لذا تشغيل هذا عبر عدة نصوص اجتماع متتالية قد يصادف أحيانًا خطأ `429`. ذلك هو المزوّد يطلب منك الإبطاء، لا علامة على أن شيئًا مكسور؛ انتظر العدد المقترح من الثواني وأعد التشغيل. راجع مشروع [وكيل الذكاء الاصطناعي](/docs/projects/ai-agent#التعامل-مع-حدود-المعدل) لنمط `try`/`except`-مع-إعادة-محاولة يمكنك نسخه مباشرة إن أردت لهذا التعافي تلقائيًا.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يطبع `uv run python summarize.py transcripts/standup.txt` ملخص Markdown قابلًا للقراءة ويُبلِّغ عن كتابة ملفي مخرجات.</StepChecklistItem>
<StepChecklistItem>يوجد كل من `standup_summary.json` و`standup_summary.md` بعد ذلك، وملف JSON صالح (افتحه، أو أعد تحليله بـ`json.load`).</StepChecklistItem>
<StepChecklistItem>تشغيله على نص اجتماع ثانٍ مختلف يُنتج ملخصًا يعكس فعلًا محتوى *ذلك* النص — لا نسخة من مخرجات الأول.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لو سلّمك زميل فريق نص اجتماع بلا قرارات واضحة على الإطلاق — مجرد عصف ذهني مفتوح — ماذا تتوقع أن تبدو عليه `decisions`، وهل تضمن صياغة الـ prompt الخاص بك ذلك فعلًا؟
- ماذا سينكسر لو شغّلت هذا على نص اجتماع من ساعتين و15,000 كلمة بدلًا من هذه العيّنات القصيرة؟ عند أي نقطة ستحتاج إلى استراتيجية مثل نهج التقطيع من مشروع [RAG](/docs/projects/rag-notes) بدلًا من إرسال كل شيء في prompt واحد؟

## ⚠️ مآزق شائعة

- **يلفّ النموذج JSON الخاص به في سور كود markdown رغم ذلك**، حتى عندما يُقال له صراحةً ألا يفعل — خاصة في النماذج الأصغر/من مستوى مجاني. `extract_json` في الخطوة 3 يزيل هذا تلقائيًا؛ لا تتخطّه واستدعِ `json.loads()` مباشرة على الاستجابة الخام.
- **يعود `owner` كالسلسلة `"null"` أو `"TBD"` أو `"N/A"`** بدلًا من `null`/`None` حقيقي. `item.get("owner") or "unassigned"` في `format_markdown` يلتقط الحالات الكاذبة، لكن سلسلة حرفية مثل `"TBD"` ستنزلق كما هي — جدير بالترقيع صراحةً (مثل `if owner in ("null", "TBD", "N/A", ""): owner = None`) إذا رأيت حدوثه كثيرًا مع مزوّدك المختار.
- **نسيان `temperature=0`.** مهام الاستخراج تريد من نفس نص الاجتماع أن ينتج ملخصًا ثابتًا وقابلًا للتكرار — لا تنوعًا إبداعيًا بين التشغيلات. ترك الافتراضي (غالبًا `~1.0`) يجعل النتائج أقل استقرارًا بشكل ملحوظ من تشغيل لآخر، مما يجعل تصحيح الـ prompt أصعب لأنك لا تستطيع أن تعرف إن كان تغيّر المخرجات جاء من تعديلك في الـ prompt أم مجرد عشوائية.
- **حدود المعدل على مستوى LLM المجاني.** كل استدعاء لـ`summarize()` يكلّف طلبًا واحدًا من حصة مزوّدك؛ تشغيله عبر نصوص اجتماعات كثيرة بسرعة قد يطلق 429. انظر النصيحة أعلاه.

## ما بنيته للتو

خط أنابيب استخراج مُهيكَل صغير ومكتمل: حمّل نصًا خامًا، وصمّم prompt يثبّت مخطط مخرجات دقيقًا، واستدعِ نموذجًا لغويًا من مستوى مجاني، وحلّل وتحقّق دفاعيًا مما يعود، واعرض النتيجة لكل من الآلات (JSON) والبشر (Markdown). هذا ليس تبسيطًا لعبة — نفس الشكل تمامًا (prompt مُقيَّد بمخطط ← تحليل ← تحقق ← تراجع رشيق) هو كيف تستخرج الأنظمة الإنتاجية بيانات مُهيكَلة من السير الذاتية والفواتير وتذاكر الدعم والعقود. بدّل المخطط والـ prompt، وما زال هذا الخط يعمل.

## إلى أين تذهب من هنا

- وسّع المخطط بحقل `sentiment` أو `meeting_type`، أو `priority` على كل عنصر عمل — النمط (صِف الحقل في الـ prompt، تحقق منه بعد التحليل) مطابق لما بنيته بالفعل.
- جرّب إطعام النموذج نص اجتماع بصيغة مختلفة تمامًا (تصدير دردشة، ملف ترجمة مُغلقة خام `.vtt`) وانظر كم من التنظيف يحتاجه `load_transcript` قبل أن تبقى النتائج جيدة.
- اطّلع على مكتبة تحقق مخطط مثل `pydantic` لنسخة أكثر صرامة من `parse_summary` — بدلًا من فحص المفاتيح يدويًا، عرّف نموذج `Summary` مرة واحدة ودعه يتحقق (بل وحتى يفرض) الأنواع عنك، رافعًا خطأ مُهيكَلًا على أي شيء لا يناسب.
- ادمج هذا مع مشروع [وكيل الذكاء الاصطناعي](/docs/projects/ai-agent): أعطِ الوكيل أداة تستدعي `summarize()` على ملف نص اجتماع، ليقدر هو أن يقرر *متى* يلخّص كجزء من مهمة أكبر بدلًا من أن تشغّل السكربت دائمًا يدويًا.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓

<ProjectProgressCheckbox projectId="meeting-notes-summarizer" />
