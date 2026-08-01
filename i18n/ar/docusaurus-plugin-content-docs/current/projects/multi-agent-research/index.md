---
id: multi-agent-research
title: "بناء مساعد بحث متعدد الوكلاء"
sidebar_label: "بناء مساعد بحث متعدد الوكلاء"
slug: /projects/multi-agent-research
description: "تخرّج من بيئة اللعب داخل المتصفح إلى Python حقيقية: ابنِ نظامًا صغيرًا متعدد الوكلاء — مُخطِّطًا وباحثًا وكاتبًا — يقسّم سؤال بحث ويركّب تقريرًا حقيقيًا، باستخدام وكلاء deepagents الفرعيين من LangChain ونموذجًا لغويًا من المستوى المجاني."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 بناء مساعد بحث متعدد الوكلاء

<ProjectPublishedDate projectId="multi-agent-research" />

<ProjectGreeting />

وكيل واحد بمجموعة أدوات وتعليمات نظام واحدة طويلة يعمل جيدًا للمهام الصغيرة، لكنه يبدأ بالضغط بمجرد أن تكتسب مهمة *مراحل* مختلفة فعلًا تستدعي تعليمات مختلفة — تخطيط ما ستبحث عنه، ثم البحث الفعلي في كل جزء، ثم كتابة كل ذلك. يقسّم هذا المشروع ذلك العمل عبر ثلاثة وكلاء صغار ضيّقي التعليمات بدلًا من وكيل كبير واحد: **مُخطِّط** يحوّل سؤال بحث إلى حفنة من الأسئلة الفرعية، و**باحث** يجيب عن كل سؤال فرعي بمفرده، و**كاتب** يركّب كل شيء في تقرير نهائي واحد — منسّقين عبر خاصية الوكلاء الفرعيين `deepagents` من LangChain.

يفترض هذا Python بمستوى 101، ويبني مباشرةً على [مشروع وكيل الذكاء الاصطناعي](/docs/projects/ai-agent) — نفس مكتبة `deepagents`، نفس إعداد API من المستوى المجاني، نفس فكرة نموذج يقرر ماذا يستدعي ومتى، فقط مطبّقة على تفويض مهام فرعية كاملة بدلًا من استدعاء أدوات فردية. إنجاز ذلك المشروع أولًا ليس شرطًا صارمًا، لكنه مسار دخول أكثر سلاسة بكثير من البدء هنا بلا مقدمات.

هذا اختياري وغير مُقيَّم. راجع [مشاريع من العالم الحقيقي](/docs/projects) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. تثبيت `uv`، أداة حديثة وسريعة لإدارة Python نفسها واعتماديات مشروعك.
2. الحصول على مفتاح API مجاني لنموذج ذكاء اصطناعي — نفس خيار المزوّدين الستة من مشروع وكيل الذكاء الاصطناعي.
3. إعداد مشروع صغير وتثبيت `deepagents`.
4. تعريف ثلاثة وكلاء فرعيين — مُخطِّط وباحث وكاتب — لكل واحد تعليمات نظام ضيّقة خاصة به.
5. ربطهم معًا في وكيل واحد من المستوى الأعلى وتشغيله على سؤال بحث حقيقي، من البداية إلى النهاية.

## أين تشغّل هذا

**محليًا باستخدام `uv`** هو المسار الذي تتبعه خطوات هذا الدرس، والموصى به — إنه Python حقيقي يعمل على جهازك الخاص، نفس حركة "التخرّج إلى Python حقيقية" كما في كل مشروع آخر في هذا القسم. يشرح قسم الإعداد أدناه كيفية تثبيته.

**GitHub Codespaces** بديل بلا أي إعداد إن كنت تفضّل عدم تثبيت أي شيء محليًا الآن: افتح [مستودع الدورة كاملاً في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython وuv مثبّتة مسبقًا، حسب ملف `.devcontainer/devcontainer.json` الخاص بالمستودع) وشغّل نفس أوامر `uv` تمامًا من طرفية في تبويب متصفحك.

**Google Colab أو Kaggle Notebooks أو Binder** تعمل أيضًا، لأن لا شيء هنا يحتاج GPU — كل خطوة مجرد استدعاء API لنموذج لغوي من المستوى المجاني. نسخة دفتر ملاحظات حقيقية وقابلة للتشغيل من هذا المشروع موجودة في المستودع في [`examples/multi-agent-research/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/multi-agent-research/notebook.ipynb) — انقر على شارة أدناه لتشغيلها بلا أي إعداد محلي، وبلا حاجة لملف `.env` (يطلب مفتاح API الخاص بك تفاعليًا بـ`getpass` بدلًا من ذلك):


[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/multi-agent-research/notebook.ipynb)
[![Open in Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/multi-agent-research/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fmulti-agent-research%2Fnotebook.ipynb)

إنها طريقة أقل دقة لتجربة المشروع مقارنة بمشروع `uv` محلي حقيقي، لكنها قابلة للتشغيل تمامًا لتجربة الفكرة بسرعة.

## الإعداد

كل ما يلي يجهّز بيئتك بالكامل قبل أن يبدأ أي بناء: تثبيت `uv`، والحصول على مفتاح API مجاني، وإعداد المشروع، وتهيئة ملف `.env` الخاص بك.

### تثبيت `uv`

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

### الحصول على مفتاح API مجاني

**اختر أي مزوّد تفضله** — لا يتطلب أيٌّ منها بطاقة ائتمان وقت كتابة هذا النص، وهذه الدورة لا تفضّل واحدًا على آخر. الوكيل المثال في مستودع الدورة ([`examples/multi-agent-research/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/multi-agent-research)) يدعم الستة جميعًا جاهزين للاستخدام، يُختار عبر إعداد واحد، بنفس نمط مشروع وكيل الذكاء الاصطناعي.

| المزوّد | أين تحصل على مفتاح | لماذا قد تختاره |
|---|---|---|
| **GitHub Models** *(الافتراضي المقترح)* | [github.com/settings/tokens](https://github.com/settings/tokens) — رمز وصول شخصي بصلاحية `models: read` | لا تسجيل منفصل — لديك بالفعل حساب GitHub. حدود مستوى مجاني أكثر سخاءً من Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | الخيار الأكثر شيوعًا في المراجع. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | استدلال سريع، مستوى مجاني سخي، بلا بطاقة. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | من أكثر الحصص المجانية الدائمة سخاءً. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | حجم رموز يومي مرتفع، بلا بطاقة. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | واجهة برمجة واحدة، نماذج مجانية عديدة — جيدة لمقارنة المزوّدين. |

أيًّا كان اختيارك، العملية نفسها:

1. سجّل الدخول وولّد مفتاح API على موقع ذلك المزوّد.
2. **لا تلصق هذا المفتاح مطلقًا مباشرة في الكود أو تُودعه في مستودع.** اضبطه كمتغيّر بيئة بدلاً من ذلك:

```bash
# macOS / Linux (add to ~/.bashrc or ~/.zshrc to persist it)
export GITHUB_TOKEN="your-key-here"   # or GOOGLE_API_KEY, GROQ_API_KEY, etc. -- match your provider

# Windows (PowerShell)
$env:GITHUB_TOKEN = "your-key-here"
```

:::tip[ملف .env غالبًا أكثر ملاءمة من export]
بدلاً من استخدام `export` لمفتاح في كل جلسة طرفية جديدة، يمكنك وضعه في ملف `.env` داخل مجلد مشروعك (انظر `.env.example` في مثال المستودع) وتحميله تلقائيًا بحزمة `python-dotenv` — مشروحة أدناه.
:::

### إعداد المشروع بـ `uv`

```bash
uv init multi-agent-research
cd multi-agent-research
uv add deepagents langchain-openai python-dotenv
```

`deepagents` هو نفس إطار عمل LangChain المستخدم في مشروع وكيل الذكاء الاصطناعي، وهو ما يجعل هذا المشروع بأكمله صغيرًا: إلى جانب استخدام الأدوات، فيه خاصية **وكلاء فرعيين** مدمجة — طريقة لتسليم جزء من مهمة إلى وكيل مُعطى تعليمات منفصلة، بدلاً من صنع حلقتك الخاصة يدويًا التي تستدعي النموذج ثلاث مرات بثلاثة تعليمات مختلفة وتخيط النتائج معًا بنفسك. `langchain-openai` يتحدث إلى GitHub Models (واجهته البرمجية متوافقة مع OpenAI)؛ استبدله بـ `langchain-google-genai`، أو `langchain-groq`، أو `langchain-mistralai` إن اخترت مزوّدًا مختلفًا أعلاه — Cerebras وOpenRouter متوافقان أيضًا مع OpenAI، لذا يغطيهما `langchain-openai` أيضًا، فقط بـ `base_url` مختلف، تمامًا كما في مشروع وكيل الذكاء الاصطناعي.

أنشئ ملف `.env` (لا تُودعه أبدًا) بمفتاح المزوّد الذي اخترته:

```bash
# .env
GITHUB_TOKEN=your-key-here
```

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>اكتمل `uv add deepagents langchain-openai python-dotenv` دون أخطاء.</StepChecklistItem>
<StepChecklistItem>يوجد ملف `.env` في مجلد المشروع بمفتاح حقيقي، ولا يتتبعه git (`uv init` يمنحك `.gitignore` — تأكد أن `.env` فيه).</StepChecklistItem>
</StepChecklist>

## الخطوة 1: عرّف الوكلاء الفرعيين: المُخطِّط والباحث والكاتب

كل وكيل فرعي في `deepagents` مجرد قاموس بسيط: `name`، و`description` (يستخدمه الوكيل من المستوى الأعلى ليقرر متى يفوض إليه)، و`system_prompt` (تعليماته الضيّقة الخاصة)، وبشكل اختياري `tools` الخاص به. أنشئ `agent.py`:

```python
import os

from deepagents import create_deep_agent
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv()

model = ChatOpenAI(
    model="gpt-4o-mini",  # confirm this still has a free tier before running
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)

planner_subagent = {
    "name": "planner",
    "description": "Breaks a research question down into 3-5 focused, independently-answerable sub-questions.",
    "system_prompt": (
        "You are a research planner. Given a broad research question, break it "
        "into 3 to 5 specific, independently-answerable sub-questions that together "
        "cover the topic well. Output ONLY a numbered list of sub-questions -- no "
        "preamble, no answers, just the questions themselves."
    ),
}

researcher_subagent = {
    "name": "researcher",
    "description": "Answers one specific sub-question at a time, concisely and factually.",
    "system_prompt": (
        "You are a researcher. Answer the single sub-question you are given as "
        "accurately and concisely as you can, using your own knowledge. You have "
        "no web search tool in this version -- if you are not confident about a "
        "fact, say so explicitly rather than guessing. Answer in 2-4 sentences."
    ),
}

writer_subagent = {
    "name": "writer",
    "description": "Synthesizes a set of sub-question answers into one coherent final report.",
    "system_prompt": (
        "You are a writer. Given a research question and a set of sub-question/answer "
        "pairs, synthesize them into one coherent, well-organized report of a few "
        "paragraphs. Do not just concatenate the answers -- connect them into prose "
        "that reads as a single piece of writing, and note plainly if the underlying "
        "research flagged low confidence anywhere."
    ),
}
```

:::tip[كن صادقًا بشأن ما تعنيه "البحث" هنا]
يجيب الوكيل الفرعي الباحث أعلاه من معرفة النموذج التدريبية الخاصة به — لا توجد أداة بحث ويب حقيقية موصولة. هذا تبسيط مقصود، لا اختصار خفي: يبقي هذا المشروع صغيرًا وصديقًا للمستوى المجاني، لكنه يعني أن الإجابات قد تكون قديمة أو خاطئة في أي شيء لم يُدرَّب النموذج عليه جيدًا، بلا طريقة للتحقق من مصدر حي. انظر "إلى أين من هنا" لمعرفة كيفية ربط أداة بحث حقيقية بمجرد ارتياحك لهذه النسخة.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يعرّف `agent.py` كلاً من `planner_subagent` و`researcher_subagent` و`writer_subagent`، كل واحد بـ `system_prompt` مميز.</StepChecklistItem>
<StepChecklistItem>يقول كل `system_prompt` بوضوح ما يفعله ذلك الدور وما *لا* يفعله — مثل أن تعليمات المُخطِّط تذكر عدم الإجابة عن الأسئلة الفرعية التي يولدها.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تحظر تعليمات نظام المُخطِّط صراحةً إجابته عن أسئلته الفرعية الخاصة. ما رأيك بما سيحدث لبقية خط الأنابيب لو تجاهل تلك التعليمات وأجاب عنها على أي حال؟
- لماذا قد يهم أن يكون `description` لكل وكيل فرعي مكتوبًا لكي يقرأه *الوكيل من المستوى الأعلى*، لا إنسان؟ ما الذي قد يكلّفك إياه وصف غامض (مثل "يعمل أشياء بحثية") هنا؟

## الخطوة 2: اربط الوكلاء الفرعيين معًا وشغّل الأمر

لا يجري الوكيل من المستوى الأعلى أي بحث بنفسه — وظيفته كلها تفويض، بالترتيب: خطّط، ثم ابحث في كل سؤال فرعي، ثم اكتب. أضف هذا إلى أسفل `agent.py`:

```python
agent = create_deep_agent(
    model=model,
    subagents=[planner_subagent, researcher_subagent, writer_subagent],
    system_prompt=(
        "You coordinate a research task using your sub-agents, strictly in this order: "
        "1) delegate to the 'planner' sub-agent to get a numbered list of sub-questions. "
        "2) delegate each sub-question, one at a time, to the 'researcher' sub-agent. "
        "3) delegate to the 'writer' sub-agent, giving it the original question plus every "
        "sub-question/answer pair, and have it produce the final report. "
        "Return ONLY the writer's final report as your answer -- no intermediate steps."
    ),
)

if __name__ == "__main__":
    question = "What makes a programming language good for beginners to learn first?"
    result = agent.invoke({"messages": [{"role": "user", "content": question}]})
    print(result["messages"][-1].content)
```

شغّله:

```bash
uv run python agent.py
```

`subagents=[...]` هو الآلية بأكملها: يرى الوكيل من المستوى الأعلى `name` و`description` لكل وكيل فرعي بنفس الطريقة التي يرى بها اسم الأداة وdocstring الخاصة بها، ويقرر متى يسلم إلى أي واحد، استنادًا إلى تعليمات `system_prompt` من المستوى الأعلى وحالة المحادثة حتى الآن. هذه هي الفكرة نفسها المُدرَّسة في قسم "إلى أين من هنا" في مشروع وكيل الذكاء الاصطناعي، مستخدمة فقط لكامل خط الأنابيب هنا بدلاً من متخصص إضافي واحد بجانب وكيل عام الغرض.

### ما يجب أن تراه

كتلة نص واحدة مطبوعة — تقرير الكاتب النهائي المركَّب، بضعة فقرات تغطي الأسئلة الفرعية التي ابتكرها المُخطِّط. إن طبعت قائمة `result["messages"]` كاملة بدلاً من ذلك (بنفس نمط مشروع وكيل الذكاء الاصطناعي)، سترى التتبع بالكامل: القائمة المرقّمة للمُخطِّط، وكل استدعاء للباحث وإجابته، ثم الجولة الأخيرة للكاتب — كلها كرسائل حقيقية تتناقل بين الوكيل من المستوى الأعلى وكل وكيل فرعي.

إن رأيت بدلاً من ذلك تتبعًا لخطأ (traceback)، تحقق من نوعه — نفس الفئات الثلاث من مشروع وكيل الذكاء الاصطناعي: متغيّر بيئة مفقود/خاطئ (`KeyError`)، مفتاح خاطئ (401/403)، أو حد معدل (429، انظر المأزق أدناه).

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يطبع `uv run python agent.py` تقريرًا نهائيًا، لا traceback.</StepChecklistItem>
<StepChecklistItem>يُقرأ التقرير فعلًا كتوليف لعدة أسئلة فرعية، لا فقرة واحدة سطحية.</StepChecklistItem>
<StepChecklistItem>إظهار قائمة `result["messages"]` كاملة يُظهر أن الأدوار الثلاثة استُدعيت فعلًا — المُخطِّط، ثم الباحث (عدة مرات)، ثم الكاتب.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- جرّب سؤال بحث أضيق بكثير (شيئًا لديه سؤال فرعي واحد واضح أساسًا) وسؤالًا أوسع بكثير (شيئًا قد ينقسم إلى عشرة أسئلة فرعية). كيف يتغير سلوك المُخطِّط، وهل تتبع جودة التقرير النهائي مدى جودة تحلل السؤال فعلًا؟
- يقول `system_prompt` من المستوى الأعلى "أعِد تقرير الكاتب النهائي فقط." ماذا تتوقع أن تراه في المخرجات لو أزلت تلك التعليمات؟

:::tip[تحقق من الوثائق الحالية قبل الاعتماد على هذا]
واجهة الوكلاء الفرعيين في `deepagents` أحدث وأقل اختبارًا من واجهة استدعاء الأدوات العادية، وقد غيّر كلاهما شكله مرة منذ مسودات سابقة لمشروع وكيل الذكاء الاصطناعي. قبل البناء على هذا أبعد من الدرس، تصفّح ملف README الخاص بـ `deepagents` نفسه لشكل `subagents=[...]` الحالي، بنفس النصيحة الواردة في مشروع وكيل الذكاء الاصطناعي لوسائط `create_deep_agent` الأخرى.
:::

## ⚠️ مآزق شائعة

- **تداخل الأدوار.** إن لم تكن تعليمات نظام وكيل فرعي ضيّقة بما يكفي، يبدأ بأداء عمل دور آخر — مُخطِّط يجيب أيضًا عن أسئلته الخاصة، أو كاتب يخترع أسئلة فرعية جديدة بدلاً من توليف المعطاة له. إن بدت المخرجات غريبة، فالحل دائمًا تقريبًا هو تضييق تعليمات الوكيل الفرعي المخالف، لا إضافة تعليمات أكثر إلى الوكيل من المستوى الأعلى.
- **حدود المعدل تتضاعف بسرعة.** يكلّف سؤال بحث واحد هنا استدعاءً واحدًا للمُخطِّط على الأقل، واستدعاءً للباحث *لكل سؤال فرعي* (عادةً 3-5)، واستدعاءً واحدًا للكاتب — ست إلى ثماني رحلات ذهاب وإياب كحد أدنى، مقابل الاستدعاءات ذات الرقم الواحد التي يجريها وكيل بسيط لاستدعاء الأدوات. توقّع الاصطدام بـ 429 أبكر مما في مشروع وكيل الذكاء الاصطناعي؛ نفس نمط إعادة المحاولة مع التأخير من دالة `ask()` في ذلك المشروع ينطبق هنا دون تغيير.
- **الهلوسة الواثقة عند الباحث.** بدون أداة بحث حقيقية، يمكن للوكيل الفرعي الباحث أن ينتج إجابة سلسة تبدو صحيحة لكنها خاطئة عن أي شيء غامض أو حديث. يطلب منه `system_prompt` الإشارة إلى انخفاض الثقة صراحةً، لكن ليس مضمونًا أن يتبع نموذج لغوي تلك التعليمات بإتقان في كل مرة — تحقق من الإجابات على أسئلة تعرف إجابتها مسبقًا.
- **الكاتب يفقد إجابات الأسئلة الفرعية بدلاً من الاستشهاد بها.** إن لم يخبر `system_prompt` من المستوى الأعلى الوكيل من المستوى الأعلى بوضوح بتمرير *كل* زوج سؤال فرعي/إجابة إلى الكاتب، فقد يلخّص بعضها فقط، أو يخترع روابط بين إجابات لم يرها فعلًا. اطبع التتبع الكامل (الخطوة 2) لتأكيد أن الكاتب استلم فعلًا كل ما أنتجه الباحث.

## ما بنيته للتو

خط أنابيب صغير حيث ينتج ثلاثة وكلاء ضيّقي التعليمات، لكل واحد تعليمات نظام محصورة في وظيفة واحدة بالضبط، نتيجةً لا يستطيع أيٌّ منهم إنتاجها جيدًا بمفرده — مُخطِّط جيد في التحليل، لا الإجابة؛ باحث جيد في الإجابة عن سؤال مركّز واحد، لا إدارة تقرير كامل؛ كاتب جيد في التوليف، لا البحث. هذه هي الفكرة نفسها وراء أنظمة متعددة الوكلاء أكبر في الإنتاج: لا تعليمات ضخمة واحدة تحاول فعل كل شيء، بل عدة تعليمات صغيرة، كل واحد سهل التفكير فيه وتصحيح أخطائه بمفرده، تُنسَّق بواسطة وكيل من المستوى الأعلى لا يقرر سوى *من* يليه.

## إلى أين من هنا

- **امنح الباحث أداة بحث حقيقية.** أكبر فجوة صدق في هذه النسخة هي أن "البحث" هنا يعني "معرفة النموذج التدريبية الخاصة به"، لا بحث ويب فعلي. عدة مزوّدين لديهم واجهات بحث من المستوى المجاني (Tavily وواجهة DuckDuckGo غير الرسمية من نقط البداية الشائعة) — اربط واحدة كأداة على `researcher_subagent["tools"]`، بنفس نمط `tools=[...]` من مشروع وكيل الذكاء الاصطناعي، وسيستطيع الباحث حينها الاستشهاد بمصادر حقيقية وحديثة بدلاً من الاسترجاع من بيانات التدريب.
- **أضف دورًا رابعًا**، مثل وكيل فرعي ناقد يراجع تقرير الكاتب مقابل الأسئلة الفرعية الأصلية ويعلّم الفجوات قبل المخرجات النهائية — نمط شائع بمجرد أن يمتلك خط الأنابيب أكثر من مرحلتين.
- **بثّ المخرجات الوسيطة** بدلاً من طباعة التقرير النهائي فقط، لكي تستطيع مشاهدة أسئلة المُخطِّط الفرعية وكل إجابة باحث وهي تصل في الوقت الفعلي بدلاً من انتظار انتهاء خط الأنابيب كله بصمت.
- أعد زيارة قسم مشروع وكيل الذكاء الاصطناعي عن التتبع الداخلي الكامل (`result["messages"]`) — التقنية نفسها لتحويل نتيجة خام مزعجة إلى حساب مقروء خطوة بخطوة تنطبق هنا، فقط مع رسائل ثلاثة أدوار متشابكة بدلاً من واحد.

## شارك مشروعك مع الصف

بنيت شيئًا تفتخر به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **طلب سحب (pull request)**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح طلب السحب، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓

<ProjectProgressCheckbox projectId="multi-agent-research" />
