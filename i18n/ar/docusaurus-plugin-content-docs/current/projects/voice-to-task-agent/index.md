---
id: voice-to-task-agent
title: "بناء وكيل صوت-إلى-مهام"
sidebar_label: "وكيل صوت-إلى-مهام"
slug: /projects/voice-to-task-agent
description: "تخرّج من ملعب المتصفح إلى Python فعلي: انسخ مذكرة صوتية محليًا ومجانًا باستخدام نموذج Whisper مفتوح المصدر من OpenAI، ثم استخدم LLM بمستوى مجاني لتحويلها إلى قائمة مهام مُهيكَلة."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 بناء وكيل صوت-إلى-مهام

<ProjectPublishedDate projectId="voice-to-task-agent" />

<ProjectGreeting />

كل شيء في الدورة حتى الآن عمل في ملعب مُعزول داخل المتصفح — لذا استطعت البدء في كتابة Python من اليوم الأول بلا أي إعداد. هذا المشروع هو خطوة التخرّج: ثبّت Python فعليًا على جهازك الخاص، ثم استخدمه لبناء شيء مفيد حقًا — خط أنابيب صغير يأخذ مذكرة صوتية مشوّشة ويحوّلها إلى قائمة مهام قصيرة ومُهيكَلة، دون أن تكتب أو تنظّم أيًا منها بنفسك. يفترض هذا Python بمستوى 101؛ لا شيء من تحليل البيانات مطلوب.

هذا اختياري وغير مُقيَّم. راجع [مشاريع من العالم الحقيقي](/docs/projects) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. نسخ مذكرة صوتية قصيرة إلى نص، بالكامل محليًا ومجانًا، باستخدام نموذج Whisper *مفتوح المصدر* من OpenAI (`openai-whisper`، يعمل على وحدة المعالجة المركزية الخاصة بك) — لا API Whisper المدفوعة.
2. كتابة prompt يطلب من LLM بمستوى مجاني قراءة تلك النسخة واستخراج بنود عمل مُهيكَلة: مهمة، وتاريخ استحقاق اختياري، وأولوية اختيارية.
3. تشغيل خط الأنابيب بأكمله من البداية إلى النهاية على تسجيل نموذجي مُقدَّم (أو تسجيلك الخاص)، وحفظ النتيجة كقائمة مهام بسيطة.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي والموصى به — النسخ عمل لوحدة المعالجة المركزية (لا حاجة لـGPU لمقطع قصير بنموذج Whisper صغير)، لذا يعمل براحة على كمبيوتر محمول عادي. يشرح الإعداد أدناه كيفية تثبيت `uv`.

**GitHub Codespaces** يعمل أيضًا: افتح [مستودع الدورة كاملًا في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython وuv مثبّتة بالفعل) وشغّل نفس أوامر `uv` تمامًا من طرفية في تبويب متصفحك. إنه أبطأ قليلًا من كمبيوتر محمول حديث في خطوة النسخ، لأن أجهزة Codespaces وحدة معالجة مركزية فقط، لكنه عملي تمامًا للمقاطع النموذجية القصيرة هنا.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/voice-to-task-agent/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/voice-to-task-agent/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fvoice-to-task-agent%2Fnotebook.ipynb)

**Google Colab ملاءمة جيدة بشكل ملحوظ لهذا المشروع** — أفضل من معظم المشاريع الأخرى في هذه السلسلة. سرعة نسخ Whisper تتوسع كثيرًا مع العتاد، ويمنحك Colab GPU مجانيًا لا يملكه كمبيوتر محمول محلي بوحدة معالجة مركزية فقط: `!pip install openai-whisper` في خلية، ثم بيئة تشغيل بـGPU، وحتى أحجام نموذج Whisper الأكبر (أكثر دقة، وعادةً بطيئة جدًا لاعتبارها على وحدة معالجة مركزية) تصبح عملية. إذا أردت التجربة بحجم النموذج مقابل الدقة (انظر النصيحة في الخطوة 1)، فـColab هو مكان ذلك. الشارات أعلاه تفتح [`notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/voice-to-task-agent/notebook.ipynb) جاهزًا يشغّل خط الأنابيب بأكمله بلا إعداد محلي — نفس خط الأنابيب ذي الخطوتين، ونفس الصوت النموذجي، فقط في دفتر ملاحظات مستضاف بدلًا من طرفية.

## الإعداد

كل ما هو مطلوب قبل أن تكتب أي كود خط أنابيب — تثبيت `uv`، وإنشاء المشروع، والحصول على مفتاح LLM — يوجد هنا، مرة واحدة، مقدمًا. يبدأ البناء الفعلي في الخطوة 1، بافتراض أن كل هذا في مكانه بالفعل.

### تثبيت `uv`

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

### إعداد المشروع

```bash
uv init voice-to-task-agent
cd voice-to-task-agent
uv add openai-whisper openai python-dotenv
```

`openai-whisper` هو نموذج الكلام-إلى-نص مفتوح المصدر نفسه — رغم اسم الحزمة، يُثبَّت ويُشغَّل هذا *محليًا*، بلا مفتاح API وبلا تكلفة لكل دقيقة؛ فقط يحدث أنه منشور من OpenAI ويشارك اسمه مع واجهة API المستضافة والمدفوعة المنفصلة الخاصة بهم. `openai` هو عميل API البسيط المستخدم في الخطوة 2 لاستدعاء مزود LLM بمستوى مجاني الذي تختاره — عدة منهم يعرضون نقطة نهاية متوافقة مع OpenAI، لذا مكتبة عميل واحدة تغطي الستة جميعًا. يتيح لك `python-dotenv` الاحتفاظ بمفتاح LLM في ملف `.env` محلي بدلًا من `export` في كل جلسة.

:::tip[أول تشغيل ينزّل النموذج]
لا يحزم `openai-whisper` أوزان نموذجه — أول مرة يستدعي فيها كودك `whisper.load_model(...)` (الخطوة 1)، ينزّل الأوزان إلى `~/.cache/whisper` (نحو 140 ميجابايت لحجم `"base"` المستخدم في هذا المشروع) ويعيد استخدامها في كل تشغيل بعده. ستبدو النسخة الأولى بطيئة؛ ذلك هو التنزيل، لا النسخ نفسه.
:::

### الحصول على مفتاح LLM مجاني

**اختر أي مزود تريده** — لا يتطلب أي منهم بطاقة ائتمان وقت كتابة هذا، ولا يفضّل هذا الدورة أحدًا على آخر. المثال في مستودع الدورة ([`examples/voice-to-task-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/voice-to-task-agent)) يدعم الستة جميعًا جاهزين، مُحددين بإعداد واحد.

| المزود | أين تحصل على مفتاح | لماذا قد تختاره |
|---|---|---|
| **GitHub Models** *(افتراضي مُقترَح)* | [github.com/settings/tokens](https://github.com/settings/tokens) — رمز وصول شخصي بصلاحية `models: read` | لا تسجيل منفصل — لديك بالفعل حساب GitHub. حدود مستوى مجاني أكثر سخاءً من حدود Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | الخيار الأكثر ذكرًا؛ مستخدم في مسودات سابقة لهذه الصفحة. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | استدلال سريع، مستوى مجاني سخي، بلا بطاقة. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | أحد حصص التردد المجانية الدائمة الأكثر سخاءً. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | حجم رموز يومي مرتفع، بلا بطاقة. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | API واحدة، نماذج مجانية كثيرة — جيد لمقارنة المزودين. |

أيًا كان ما تختاره، العملية هي نفسها:

1. سجّل الدخول وأنشئ مفتاح API في موقع ذلك المزود.
2. **لا تلصق هذا المفتاح أبدًا مباشرة في الكود أو تلتزمه في مستودع.** أنشئ ملف `.env` في مجلد مشروعك بدلًا من ذلك (لا تلتزمه أبدًا):

```bash
# .env
GITHUB_TOKEN=your-key-here
```

مفتاح API سرّ، تمامًا مثل كلمة مرور — أي شخص يملكه يستطيع استخدام حصة حسابك. معاملته كمتغير بيئة بدلًا من سلسلة مكتوبة بصيغة ثابتة هو الممارسة المعيارية لهذا السبب بالضبط، وهو نفس العادة المبنية في [مشروع AI Agent](/docs/projects/ai-agent) إذا أنجزت ذلك.

:::tip[ملف .env غالبًا أكثر ملاءمة من export]
بدلًا من `export` لمفتاح في كل جلسة طرفية جديدة، ملف `.env` في مجلد مشروعك، مُحمَّل تلقائيًا بـ`python-dotenv`، يبقى عبر الجلسات دون أن تضطر إلى تذكره. انظر `.env.example` الخاص بمثال المستودع للقائمة الكاملة لأسماء المتغيرات، واحد لكل مزود.
:::

مع اكتمال الإعداد، يفترض كل ما يلي: `uv` مثبّت، ومشروعك يحتوي `openai-whisper` و`openai` و`python-dotenv`، و`.env` يحتوي مفتاحًا حقيقيًا للمزود الذي اخترته.

## الخطوة 1: انسخ مذكرة صوتية نموذجية محليًا

لا تحتاج ميكروفونًا أو تسجيلًا حقيقيًا لتبدأ — يشحن مستودع الدورة ثلاثة مقاطع صوتية نموذجية قصيرة في [`examples/voice-to-task-agent/sample_audio/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/voice-to-task-agent/sample_audio). خذ واحدًا (أو سجّل واحدًا خاصًا بك بأي تطبيق مذكرات صوتية في هاتف/كمبيوتر محمول وانسخه إلى مشروعك — يعمل كل من `.wav` و`.mp3`).

أنشئ `voice_to_tasks.py`:

```python
# voice_to_tasks.py
import sys

import whisper

WHISPER_MODEL_SIZE = "base"  # tiny / base / small / medium / large -- see the tip below

_whisper_model = None  # loaded lazily so importing this module doesn't load it


def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        print(f"Loading Whisper '{WHISPER_MODEL_SIZE}' model...")
        _whisper_model = whisper.load_model(WHISPER_MODEL_SIZE)
    return _whisper_model


def transcribe(audio_path: str) -> str:
    """Transcribes an audio file to plain text, entirely locally."""
    model = get_whisper_model()
    result = model.transcribe(audio_path)
    return result["text"].strip()


if __name__ == "__main__":
    audio_path = sys.argv[1] if len(sys.argv) > 1 else "sample_audio/memo_1_work_followups.wav"
    print(transcribe(audio_path))
```

```bash
uv run python voice_to_tasks.py sample_audio/memo_1_work_followups.wav
```

يحمّل `whisper.load_model("base")` شبكة عصبية مدرَّبة على كمية ضخمة من بيانات الكلام متعدد اللغات؛ يشغّلها `model.transcribe(audio_path)` على ملف الصوت الخاص بك ويعيد قاموسًا مفتاحه `"text"` هو النسخ الكامل — يتولى Whisper فك ترميز الصوت بنفسه (عبر `ffmpeg` تحت الغطاء) ويعمل على `.wav` و`.mp3` ومعظم الصيغ الشائعة الأخرى دون أن تحوّل أي شيء يدويًا أولًا.

:::tip[حجم النموذج مقايضة بين السرعة والدقة]
يأتي Whisper بخمسة أحجام — `tiny`، و`base`، و`small`، و`medium`، و`large` — كل واحد أكثر دقة وأبطأ من الذي قبله. `"base"` افتراضي معقول على وحدة معالجة مركزية في كمبيوتر محمول للكلام الإنجليزي القصير الواضح مثل المقاطع النموذجية؛ الصوت المزعج، واللهجات التي يعالجها النموذج بشكل أقل جودة، أو الكلام غير الإنجليزي تستفيد غالبًا من `"small"` أو `"medium"`، بتكلفة زمن نسخ أطول بشكل ملحوظ. هذا بالضبط نوع المقايضة الذي يستحق تجربة GPU من أجله — انظر "أين تُشغّل هذا" أعلاه لمعرفة لماذا Colab ملاءمة جيدة هنا تحديدًا.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يطبع `uv run python voice_to_tasks.py sample_audio/memo_1_work_followups.wav` نسخًا حقيقيًا، لا أثر استدعاء.</StepChecklistItem>
<StepChecklistItem>النص المطبوع يطابق تقريبًا ما تقوله المذكرة النموذجية فعلًا — لن يكون Whisper مثاليًا، لكن يجب أن يكون واضحًا قابلًا للتمييز.</StepChecklistItem>
<StepChecklistItem>تشغيله مجددًا أسرع بشكل ملحوظ من التشغيل الأول (أوزان النموذج الآن مخزنة مؤقتًا محليًا، لا تُعاد تنزيلها).</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لا يرسل `transcribe()` صوتك أبدًا إلى أي مكان عبر الشبكة. ماذا يعني ذلك لاستخدام هذا على مذكرة صوتية خاصة حقًا، مقارنة بـAPI نسخ مستضاف في السحابة؟
- لو شغّلت هذا على مذكرة مع موسيقى خلفية تعزف، أو شخصين يتحدثان فوق بعضهما، ماذا تتوقع أن يحدث لجودة النسخ؟ جرّبه على تسجيلك الخاص إذا كان لديك واحد يناسب ذلك.

## الخطوة 2: استخرج بنود العمل المُهيكَلة بـLLM مجاني

النسخ مجرد جدار من نص — مفيد، لكنه ليس قائمة مهام بعد. هذه الخطوة تسلّم النسخ إلى LLM بمستوى مجاني مع prompt يطلب منه قراءته وإعادة بيانات مُهيكَلة فعلية: إدخال واحد لكل بند عمل، كل منها بوصف مهمة وحيث تضمره النسخة، تاريخ استحقاق وأولوية.

أضف استدعاء LLM إلى `voice_to_tasks.py`:

```python
# voice_to_tasks.py (additions)
import json
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

# All six free-tier providers from the table above happen to expose an
# OpenAI-compatible chat completions endpoint, so one client class covers
# all of them -- only base_url and model change.
PROVIDERS = {
    "github": {"env": "GITHUB_TOKEN", "base_url": "https://models.github.ai/inference", "model": "gpt-4o-mini"},
    "gemini": {"env": "GOOGLE_API_KEY", "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/", "model": "gemini-3.5-flash"},
    "groq": {"env": "GROQ_API_KEY", "base_url": "https://api.groq.com/openai/v1", "model": "llama-3.3-70b-versatile"},
    "mistral": {"env": "MISTRAL_API_KEY", "base_url": "https://api.mistral.ai/v1", "model": "mistral-small-latest"},
    "cerebras": {"env": "CEREBRAS_API_KEY", "base_url": "https://api.cerebras.ai/v1", "model": "llama-3.3-70b"},
    "openrouter": {"env": "OPENROUTER_API_KEY", "base_url": "https://openrouter.ai/api/v1", "model": "meta-llama/llama-3.3-70b-instruct:free"},
}

EXTRACTION_PROMPT = """You extract action items from a voice memo transcript.

Return a JSON object shaped exactly like this, with no other text before or
after it, and no markdown code fences:

{{"tasks": [{{"task": "...", "due_date": "...", "priority": "..."}}]}}

Rules:
- "task" is a short, clear action (e.g. "Email the client the revised
  proposal"), not a raw quote from the transcript.
- "due_date" is null if the transcript doesn't mention one -- do not invent
  a specific date that was never said.
- "priority" is "high", "medium", or "low" only if the transcript implies
  one; otherwise null.
- If there are no action items at all, return {{"tasks": []}}.

Transcript:
\"\"\"
{transcript}
\"\"\"
"""


def extract_action_items(transcript: str, provider: str | None = None) -> list[dict]:
    provider = provider or os.environ.get("LLM_PROVIDER", "github")
    config = PROVIDERS[provider]
    client = OpenAI(api_key=os.environ[config["env"]], base_url=config["base_url"])

    response = client.chat.completions.create(
        model=config["model"],
        messages=[{"role": "user", "content": EXTRACTION_PROMPT.format(transcript=transcript)}],
    )
    return json.loads(response.choices[0].message.content)["tasks"]
```

```bash
uv run python -c "
from voice_to_tasks import transcribe, extract_action_items
transcript = transcribe('sample_audio/memo_1_work_followups.wav')
print(extract_action_items(transcript))
"
```

هذا هو prompt الذي يقوم بالعمل الفعلي هنا: يخبر النموذج بالضبط بأي شكل يعيد (كائن JSON بقائمة `"tasks"`، لا نثرًا حرًا)، ويعطي قواعد صريحة للأجزاء الصعبة — لا تخترع تاريخ استحقاق لم يُقل أبدًا، ولا تخمّن أولوية غير مُضمَنة فعلًا. هذه نفس فكرة prompt [مشروع RAG](/docs/projects/rag-notes) التي تخبر النموذج بالإجابة *فقط* من السياق المسترجَع: تعليمات واضحة ومحددة تضيّق ما يفعله النموذج، بدلًا من الأمل بأنه يستنتج الشكل الصحيح بنفسه.

يفترض `json.loads(...)["tasks"]` أن النموذج اتبع التعليمات فعلًا وأعاد JSON نظيفًا — النماذج بمستوى مجاني لا تفعل ذلك أحيانًا (جملة شاردة قبل JSON، أو سياج markdown حوله رغم إخباره ألا يفعل). النسخة الأكمل في [`examples/voice-to-task-agent/voice_to_tasks.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/voice-to-task-agent) تزيل سياج كود إذا ظهر وترفع خطأً واضحًا بدلًا من أثر استدعاء مربك إذا ما زال JSON لا يُحلَّل — يستحق النسخ إذا كنت تخطط لتشغيله على أكثر من بضعة مذكرات.

:::tip[تستخدم مزودًا مختلفًا؟]
كل ما سبق يعمل بالفعل لجميع المزودين الستة في الجدول — فقط اضبط `LLM_PROVIDER` في `.env` الخاص بك (أو مرّر اسم مزود مباشرة إلى `extract_action_items`). هذا يعمل لأن GitHub Models وGemini وGroq وMistral وCerebras وOpenRouter جميعهم يعرضون نقطة نهاية متوافقة مع OpenAI؛ على عكس [مشروع AI Agent](/docs/projects/ai-agent)، لا تحتاج مكتبة عميل مختلفة لكل مزود هنا، لأن هذا السكربت لا يستخدم LangChain.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يعيد `extract_action_items(transcript)` قائمة Python من القواميس، لا خطأً.</StepChecklistItem>
<StepChecklistItem>يحمل كل قاموس مفاتيح `"task"` و`"due_date"` و`"priority"` — حتى عندما تكون قيمة `None`.</StepChecklistItem>
<StepChecklistItem>تشغيله على `memo_1_work_followups.wav` يجد نحو ثلاث مهام منفصلة، مطابقة لمتابعات الثلاثة المذكورة فعلًا في تلك المذكرة.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يقول prompt صراحة "لا تخترع تاريخًا محددًا لم يُقل أبدًا". ماذا تتوقع أن يحدث لو أزلت تلك التعليمات وقالت النسخة "في وقت ما الأسبوع المقبل"؟ جرّبه — هل يضيف النموذج تاريخًا حقيقيًا من التقويم على أي حال؟
- لو ذكرت النسخة نفس المهمة مرتين، مُصاغة بشكل مختلف قليلًا في كل مرة (يفعل الناس هذا عندما يفكرون بصوت عالٍ)، هل تتوقع مهمة واحدة في المخرجات أم اثنتين؟ ماذا يقترح جوابك عن قيد على طلب نموذج للقيام بهذا في مرور واحد، دون خطوة إزالة تكرار خاصة به؟

## الخطوة 3: شغّله من البداية إلى النهاية واحفظ قائمة مهام

اجمع القطعتين معًا في سكربت واحد ينسخ، ويستخرج، ويطبع قائمة قابلة للقراءة، ويحفظها كـJSON:

```python
# voice_to_tasks.py (additions)
def print_tasks(tasks: list[dict]) -> None:
    if not tasks:
        print("No action items found in this memo.")
        return
    markers = {"high": "\U0001f534", "medium": "\U0001f7e1", "low": "\U0001f7e2"}
    for item in tasks:
        marker = markers.get((item.get("priority") or "").lower(), "⚪")
        due = f" (due: {item['due_date']})" if item.get("due_date") else ""
        print(f"{marker} {item['task']}{due}")


def main() -> None:
    audio_path = sys.argv[1] if len(sys.argv) > 1 else "sample_audio/memo_1_work_followups.wav"

    print(f"Transcribing {audio_path} ...")
    transcript = transcribe(audio_path)
    print("\n--- Transcript ---")
    print(transcript)

    print("\nExtracting action items...")
    tasks = extract_action_items(transcript)

    print("\n--- Action items ---")
    print_tasks(tasks)

    with open("tasks.json", "w", encoding="utf-8") as f:
        json.dump(tasks, f, indent=2, ensure_ascii=False)
    print(f"\nSaved {len(tasks)} task(s) to tasks.json")


if __name__ == "__main__":
    main()
```

```bash
uv run python voice_to_tasks.py sample_audio/memo_3_project_planning.mp3
```

جرّب المقاطع النموذجية الثلاثة جميعًا، و— إذا كانت لديك طريقة لتسجيل واحد — مذكرتك الصوتية الخاصة أيضًا. قائمة مشتريات قصيرة، أو مجموعة متابعات اجتماع، أو قائمة أعمال منزلية كلها اختبارات جيدة: أي شيء بحفنة من بنود عمل متميزة بطول جملة، منطوقة بالطريقة التي ستحدث بها نفسك فعليًا، لا قائمة مُهيكَلة رسميًا.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يطبع `uv run python voice_to_tasks.py` (بأي من المقاطع النموذجية الثلاثة) نسخًا، ثم قائمة مهام موسومة، ثم سطر "Saved N task(s)".</StepChecklistItem>
<StepChecklistItem>يوجد ملف `tasks.json` الآن في مجلد مشروعك، ومحتواه يطابق ما طُبع.</StepChecklistItem>
<StepChecklistItem>تشغيله على مذكرة بلا بنود عمل حقيقية فيها (جرّب فقط وصف يومك) يطبع "No action items found" بدلًا من اختلاق وهمية.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يستبدل `tasks.json` نفسه في كل تشغيل، دون دمج قائمة قديمة مع جديدة. ماذا ستحتاج لإضافته لجعل هذا قائمة مهام جارية مفيدة حقًا عبر مذكرات متعددة، مسجلة في أيام مختلفة؟
- هذا الخط الأنابيب له نقطتا فشل تتصرفان بشكل مختلف جدًا: Whisper يسمع كلمة خطأً، والـLLM يقرأ جملة مكتوبة بشكل صحيح خطأً. إذا خرجت مهمة خاطئة، كيف ستعرف أي من المرحلتين سبّبها فعلًا؟

## ⚠️ مآزق شائعة

- **الخلط بين Whisper مفتوح المصدر وAPI Whisper المدفوعة.** يعمل `openai-whisper` (هذا المشروع) بالكامل على جهازك الخاص، مجانًا، بلا مفتاح API — إنه ليس نفس شيء `client.audio.transcriptions.create(...)`، نقطة نهاية النسخ *المستضافة* والمدفوعة من OpenAI. كلاهما يُسمى "Whisper" وكلاهما من OpenAI، وهو بالضبط السبب في أنه يستحق التوضيح أي منهما يستخدم أي كود معين.
- **أول تشغيل طويل جدًا، مخطئ في أنه تعلّق.** أول استدعاء لـ`whisper.load_model(...)` ينزّل أوزان النموذج (انظر نصيحة الإعداد) — على اتصال بطيء قد يستغرق هذا وقتًا دون شريط تقدم في الإصدارات الأقدم. اتركه يُكمل مرة؛ كل تشغيل بعده سريع.
- **رد JSON من LLM ليس JSON صالحًا تمامًا.** تلتف النماذج بمستوى مجاني أحيانًا حول إجابتها في سياج كود markdown، أو تضيف جملة شاردة، رغم تعليمات صريحة ألا تفعل. عامِل فشل `json.loads(...)` هنا كحدوث متوقع ومتقطع — لا علامة على أن prompt معطوب جوهريًا — وانظر `_parse_tasks_response` في المثال الأكمل لإصلاح إزالة السياج.
- **حدود المعدل على مستوى LLM المجاني.** النسخ (الخطوة 1) محلي وغير محدود؛ فقط استدعاء الاستخراج في الخطوة 2 يُحتسب ضد حصة مستوى المزود المجاني. خطأ 429 هناك هو المزود يخبرك أن تتباطأ، لا خطأ برمجي — انظر [مشروع AI Agent](/docs/projects/ai-agent#التعامل-مع-حدود-المعدل) لنفس النمط ونهج إعادة محاولة يمكنك نسخه.

## ما بنيته للتو

خط أنابيب صغير لكنه كامل يربط نوعين مختلفين حقًا من نماذج الذكاء الاصطناعي: نموذج كلام-إلى-نص محلي مجاني مفتوح الأوزان يقوم بالاستماع، ونموذج لغة مستضاف بمستوى مجاني يقوم بالقراءة-والمُهيكَلة. لا شيء هنا مُزيَّف — بدّل في تسجيل حقيقي أطول وأكثر فوضى، ونفس الخطوتين (انسخ، ثم استخرج) ما زالتا خط الأنابيب بأكمله. هذا أيضًا مثال صغير ملموس على نمط أوسع يستحق الملاحظة: ليست كل مهمة ذكاء اصطناعي تحتاج نموذجًا مستضافًا ضخمًا. Whisper صغير بما يكفي ليعمل محليًا مجانًا؛ فقط الجزء من العمل الذي يستفيد فعلًا من استدلال نموذج لغة كبير — تحويل كلام منطوق فضفاض إلى بيانات مُهيكَلة نظيفة — يمد يده إليه.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي للكود]
[`examples/voice-to-task-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/voice-to-task-agent) في مستودع الدورة نسخة أكمل قليلًا من الكود أعلاه — نفس خط الأنابيب ذي الخطوتين، بالإضافة إلى إصلاح إزالة السياج المذكور أعلاه ورسائل خطأ أوضح. انسخه، أو افتح المستودع كاملًا في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وشغّله ضد أي من المقاطع النموذجية الثلاثة في `sample_audio/`.
:::

## إلى أين تذهب من هنا

- جرّب حجم نموذج Whisper أكبر (`"small"` أو `"medium"`) على تسجيل أطول وأكثر فوضى — ضجيج خلفية، أو متحدثين متعددين، أو مذكرة غير إنجليزية — وانظر أين يبدأ `"base"` في التقصير. هذا عذر رائع لتجربة مسار GPU في Colab من "أين تُشغّل هذا" أعلاه.
- جمّع المهام المستخرجة بالأولوية، أو رتّبها بحسب كيف يبلغ النموذج عن تواريخ الاستحقاق، بدلًا من طباعتها بترتيب النسخ.
- اجعل `tasks.json` تراكميًا: حمّل الملف الموجود (إن وُجد)، وأضف المهام المستخرجة حديثًا بدلًا من الكتابة فوقها، وأزل تكرار أي شيء يبدو كأنه نفس المهمة المذكورة مرتين.
- اربط هذا بشيء يستهلك قائمة المهام فعلًا — إلحاقًا بـAPI تطبيق مهام حقيقي، أو تقويم، أو حتى ملف Markdown لقائمة تحقق جارية — بدلًا من ملف JSON لا يقرؤه أي شيء آخر بعد.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓

<ProjectProgressCheckbox projectId="voice-to-task-agent" />
