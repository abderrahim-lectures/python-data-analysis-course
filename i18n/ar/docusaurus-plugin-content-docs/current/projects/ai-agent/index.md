---
id: 2026-ai-agent
title: "بناء وكيل ذكاء اصطناعي"
sidebar_label: "بناء وكيل ذكاء اصطناعي"
slug: /projects/ai-agent
---

import CapstoneProgressCheckbox from '@site/src/components/CapstoneProgressCheckbox';

# 🌍 بناء وكيل ذكاء اصطناعي

كل شيء حتى الآن عمل في بيئة تجريبية معزولة داخل المتصفح — حتى تتمكن من البدء بكتابة Python من اليوم الأول بلا أي إعداد. هذا المشروع هو خطوة التخرّج: ثبّت Python فعليًا على جهازك الخاص، ثم استخدمها لبناء شيء لم تستطع بيئة البرمجة تشغيله أبدًا — وكيل ذكاء اصطناعي بمفتاح API خاص به، يستدعي نموذج لغوي حقيقي.

هذا اختياري وغير مُقيَّم — خيار جيد بمجرد إنهاء Python 101 (أساسيات معالجة البيانات من تحليل البيانات ميزة إضافية، وليست شرطًا). راجع [مشاريع من العالم الحقيقي](/docs/projects) للاطلاع على القائمة الكاملة، والتي تنمو باستمرار.

## 🎯 ما ستفعله

1. تثبيت `uv`، أداة حديثة وسريعة لإدارة Python نفسها واعتماديات مشروعك — دون الحاجة إلى مثبّت Python منفصل.
2. الحصول على مفتاح API مجاني لنموذج ذكاء اصطناعي. **أنت حرّ في استخدام أي مزوّد تفضله** — GitHub Models هو الخيار الافتراضي المقترح أدناه لأنه لا يحتاج تسجيلاً منفصلاً (لديك بالفعل حساب GitHub)، لكن Gemini وGroq وMistral وCerebras وOpenRouter لديها جميعًا مستويات مجانية قابلة للاستخدام أيضًا.
3. إعداد مشروع صغير وتثبيت `deepagents` من LangChain.
4. كتابة وتشغيل وكيل صغير واحد، محليًا، من طرفيتك الخاصة.

## الخطوة 1: تثبيت `uv`

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

### تثبيت مفسّر Python حقيقي

على خلاف البيئات التجريبية داخل المتصفح، تستطيع `uv` جلب وإدارة مفسّر Python حقيقي على جهازك مباشرة — لا تحتاج لزيارة python.org بشكل منفصل:

```bash
uv python install 3.12
```

هذه لحظة تخرّجك: Python حقيقية، مثبّتة ومُدارة على جهاز حاسوبك الخاص، لا داخل بيئة معزولة في متصفح.

## الخطوة 2: الحصول على مفتاح API مجاني

**اختر أي مزوّد تفضله** — لا يتطلب أيٌّ منها بطاقة ائتمان وقت كتابة هذا النص، وهذه الدورة لا تفضّل واحدًا على آخر. الوكيل المثال في مستودع الدورة ([`examples/ai-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-agent)) يدعم الستة جميعًا جاهزين للاستخدام، ويُختار عبر إعداد واحد.

| المزوّد | أين تحصل على مفتاح | لماذا قد تختاره |
|---|---|---|
| **GitHub Models** *(الافتراضي المقترح)* | [github.com/settings/tokens](https://github.com/settings/tokens) — رمز وصول شخصي بصلاحية `models: read` | لا تسجيل منفصل — لديك بالفعل حساب GitHub. حدود مستوى مجاني أكثر سخاءً من Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | الخيار الأكثر شيوعًا في المراجع؛ استُخدم في مسودات سابقة من هذه الصفحة. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | استدلال سريع، مستوى مجاني سخي، بلا بطاقة. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | من أكثر الحصص المجانية الدائمة سخاءً. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | حجم رموز يومي مرتفع، بلا بطاقة. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | واجهة برمجة واحدة، نماذج مجانية عديدة — جيدة لمقارنة المزوّدين. |

أيًّا كان اختيارك، العملية نفسها:

1. سجّل الدخول وولّد مفتاح API على موقع ذلك المزوّد.
2. **لا تلصق هذا المفتاح مطلقًا مباشرة في الكود أو تُودعه في مستودع.** اضبطه كمتغيّر بيئة بدلاً من ذلك:

```bash
# macOS / Linux (أضفه إلى ~/.bashrc أو ~/.zshrc ليبقى دائمًا)
export GITHUB_TOKEN="your-key-here"   # أو GOOGLE_API_KEY، GROQ_API_KEY، إلخ -- حسب مزوّدك

# Windows (PowerShell)
$env:GITHUB_TOKEN = "your-key-here"
```

مفتاح API سرّ، تمامًا مثل كلمة مرور — أي شخص يملكه يستطيع استخدام حصة حسابك. معاملته كمتغيّر بيئة بدلاً من نص ثابت مكتوب في الكود هي الممارسة المعيارية لهذا السبب بالتحديد، وهي أول عادة أمان واقعية تطلبها منك هذه الدورة.

:::tip[ملف .env غالبًا أكثر ملاءمة من export]
بدلاً من استخدام `export` لمفتاح في كل جلسة طرفية جديدة، يمكنك وضعه في ملف `.env` داخل مجلد مشروعك (انظر `.env.example` في مثال المستودع) وتحميله تلقائيًا بحزمة `python-dotenv` — مشروحة في الخطوة 4.
:::

## الخطوة 3: إعداد المشروع بـ `uv`

```bash
uv init ai-agent
cd ai-agent
uv add deepagents langchain-openai python-dotenv
```

ينشئ `uv init` مشروعًا صغيرًا (ملف `pyproject.toml` يتتبع اعتمادياتك)، ويثبّت `uv add` الحزم في بيئة معزولة لذلك المشروع — تلقائيًا، دون إعداد بيئة افتراضية يدويًا. `deepagents` هو إطار عمل LangChain لبناء وكلاء مزوّدين بتخطيط واستخدام أدوات وتفويض إلى وكلاء فرعيين مدمج فيهم؛ `langchain-openai` هي حزمة التكامل التي يستخدمها هذا المثال للتحدث مع GitHub Models (واجهته البرمجية متوافقة مع OpenAI، لذا تعمل حزمة تكامل OpenAI معه — انظر التلميح أدناه إن اخترت مزوّدًا مختلفًا)؛ `python-dotenv` تتيح لك إبقاء مفتاح API في ملف `.env` محلي بدلاً من استخدام `export` في كل جلسة.

إن اخترت مزوّدًا مختلفًا في الخطوة 2، استبدل `langchain-openai` بحزمة ذلك المزوّد الخاصة — `langchain-google-genai` (لـ Gemini)، `langchain-groq` (لـ Groq)، أو `langchain-mistralai` (لـ Mistral). Cerebras وOpenRouter متوافقان أيضًا مع OpenAI، لذا يستخدمان `langchain-openai` أيضًا، فقط بـ `base_url` مختلف.

:::tip[تحقق من الوثائق الحالية — واسم النموذج]
أطر عمل الوكلاء تتطور بسرعة، وكذلك أسماء النماذج: تُعاد تسميتها ويُوقَف دعمها على مقياس أشهر لا سنوات. وسائط `create_deep_agent` نفسها تغيّرت بالفعل مرة منذ مسودات سابقة لهذه الصفحة (إنها `system_prompt`، لا `instructions`) — تذكير بأن هذا المقتطف يمكن أن يصبح قديمًا حتى بعد التحقق منه مرة واحدة. استخدم معرّف نموذج صريحًا ومُرقّمًا بدلاً من لاحقة `-latest`: عدة مزوّدين، بما فيهم Google، أوقفوا دعم تلك اللواحق لأنها تستبدل النموذج بصمت بنسخة جديدة، مما قد يكسر كودًا يعمل دون أي تحذير. قبل تشغيل هذا، تحقق من صفحة التسعير/النماذج الحالية لمزوّدك، وتصفّح ملف README الخاص بـ `deepagents` نفسه لواجهته البرمجية الحالية.
:::

## الخطوة 4: اكتب وكيلك الأول

أنشئ ملف `.env` (لا تُودعه في المستودع أبدًا) بمفتاح المزوّد الذي اخترته:

```bash
# .env
GITHUB_TOKEN=your-key-here
```

ثم أنشئ `agent.py`:

```python
import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from deepagents import create_deep_agent

load_dotenv()  # reads .env into the environment, if present

def search_course_topics(query: str) -> str:
    """A toy tool: pretends to look up whether a topic was covered in this course."""
    topics = ["variables", "loops", "functions", "csv files", "pandas", "dataframes", "groupby"]
    matches = [t for t in topics if query.lower() in t]
    return f"Matching topics: {matches}" if matches else "No matching topics found."

def count_weeks_remaining(current_week: int) -> str:
    """A second toy tool: how many weeks are left in the 10-week course."""
    remaining = max(0, 10 - current_week)
    return f"{remaining} week(s) remaining out of 10."

model = ChatOpenAI(
    model="gpt-4o-mini",  # confirm this still has a free tier before running — see the tip above
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)

agent = create_deep_agent(
    model=model,
    tools=[search_course_topics, count_weeks_remaining],
    system_prompt="You help students figure out whether a topic was covered in their course.",
)

if __name__ == "__main__":
    result = agent.invoke({"messages": [{"role": "user", "content": "Did we cover groupby?"}]})
    print(result["messages"][-1].content)  # just the final answer, not the full internal trace
```

شغّله — مع `uv`، لا حاجة لتفعيل بيئة يدويًا:

```bash
uv run python agent.py
```

يقرأ `load_dotenv()` ملف `.env` الخاص بك إلى `os.environ` قبل تشغيل أي شيء آخر، لذا يجد `os.environ["GITHUB_TOKEN"]` المفتاح الذي ضبطته في الخطوة 2 — نفس مفهوم وحدة `os` كما في قراءة `input()` من لوحة المفاتيح، إلا أنه يقرأ من ملف بدلاً من ذلك. يربط `create_deep_agent` النموذج بقائمة من دوال Python يستطيع الوكيل استدعاءها كـ **أدوات** — هذه هي الفكرة الجوهرية وراء الوكلاء: نموذج لغوي لا يكتفي بالرد بنص، بل يقرر استدعاء كودك، وقراءة النتيجة، واستخدامها لإثراء إجابته.

لاحظ `tools=[search_course_topics, count_weeks_remaining]` — أداتان، لا واحدة. يختار النموذج *أي* أداة (إن وُجدت) تناسب السؤال، بمفرده تمامًا: اسأل "هل تناولنا groupby؟" فيستدعي `search_course_topics`؛ اسأل "كم أسبوعًا تبقى إن كنت في الأسبوع 4؟" فيستدعي `count_weeks_remaining` بدلاً من ذلك. لن تكتب أبدًا سلسلة `if`/`elif` توجّه الأسئلة إلى الأدوات بنفسك — سلسلة التوثيق (docstring) على كل دالة (النص المُحاط بثلاث علامات اقتباس مباشرة بعد `def`) هي ما يقرأه النموذج ليقرر أي أداة تناسب أي طلب، تمامًا مثل سلاسل التوثيق في الأسبوع 4 من Python 101، إلا أن نموذجًا لغويًا هو من يقرأها هنا، لا إنسان يتصفح كودك.

### كيف يقرر الوكيل فعليًا ما يفعله

لا شيء هنا سحري — يبني `create_deep_agent` حلقة، وكل تكرار من تلك الحلقة هو استدعاء واحد عادي لواجهة برمجة النموذج الذي أعددته:

1. يُرسَل سؤالك إلى النموذج، مع *قائمة* الأدوات المتاحة (أسماؤها، معاملاتها، وسلاسل توثيقها — لا كودها).
2. يرد النموذج إما بإجابة نصية نهائية، **أو** بطلب استدعاء أداة محددة واحدة بمعاملات محددة.
3. إن طلب استدعاء أداة، فإن كودك الخاص بـ Python (لا النموذج) هو من يشغّل تلك الدالة فعليًا ويحصل على نتيجة حقيقية.
4. تعود تلك النتيجة إلى النموذج كسياق جديد، وتتكرر الحلقة من الخطوة 2 — قد يستدعي النموذج أداة أخرى، أو تصبح لديه الآن معلومات كافية للإجابة.
5. بمجرد أن يرد النموذج بنص دون طلب أداة آخر، تتوقف الحلقة وتلك هي إجابتك النهائية.

هذا بالضبط سبب إمكانية حدوث خطأ حد المعدل (انظر أدناه) حتى فيما يبدو "سؤالاً واحدًا" — سؤال يحتاج استدعاءين لأداتين يكلّف ثلاث رحلات ذهاب وإياب على الأقل إلى النموذج (قرار استدعاء الأداة أ، قرار استدعاء الأداة ب، إنتاج الإجابة النهائية)، لا رحلة واحدة.

### ما يجب أن تراه

سطر واحد مطبوع — إجابة الوكيل النهائية، شيء يشبه:

```
Yes, "groupby" was covered in the course.
```

إن رأيت بدلاً من ذلك تتبعًا لخطأ Python (traceback)، تحقق من نوعه:

- **`KeyError: 'GITHUB_TOKEN'`** — متغيّر البيئة/قيمة `.env` لا يُعثر عليها. تأكد أن `.env` في نفس مجلد `agent.py` ولا يحتوي خطأ إملائيًا في اسم المتغيّر، أو أنك فعلاً نفّذت `export` في نفس جلسة الطرفية التي تشغّل منها السكربت.
- **خطأ مصادقة (401/403)** — المفتاح نفسه خاطئ، منتهي الصلاحية، أو (لـ GitHub Models) يفتقد صلاحية `models: read`. أعد توليده.
- **خطأ حد المعدل (429)** — انظر القسم التالي. هذا شائع ومتوقع، وليس علامة على أن شيئًا معطّل.

### فهم التتبع الداخلي الكامل

يعرض `result["messages"][-1].content` أعلاه عمدًا الإجابة النهائية فقط. إن طبعت `result` *كاملة* بدلاً من ذلك، سترى شيئًا أكثر ضجيجًا بكثير — كل رسالة تتبعها LangGraph داخليًا، وكل واحدة تحمل حقول دفترية إلى جانب المحتوى الفعلي:

```python
result = agent.invoke({"messages": [{"role": "user", "content": "Did we cover groupby?"}]})
for message in result["messages"]:
    print(type(message).__name__, "->", message)
```

مُبسّطًا إلى ما يهم فعلاً، يبدو التتبع وراء ذلك السؤال الواحد كالتالي:

| # | نوع الرسالة | ما تحمله |
|---|---|---|
| 1 | `HumanMessage` | سؤالك: `"Did we cover groupby?"` |
| 2 | `AIMessage` (بلا نص) | قرر النموذج استدعاء `search_course_topics(query="groupby")` — لا إجابة بعد، مجرد طلب أداة |
| 3 | `ToolMessage` | القيمة *الحقيقية* المُعادة من دالة Python الخاصة بك: `"Matching topics: ['groupby']"` |
| 4 | `AIMessage` (نهائية) | إجابة النموذج الفعلية، الآن وقد حصل على نتيجة الأداة: `"Yes, groupby was covered."` |

الأجزاء المزعجة التي يمكنك تجاهلها بأمان عند قراءة تتبع خام: حقول `id`/`tool_call_id` (دفترية لمطابقة استدعاء أداة بنتيجته)، آثار التفكير الداخلي الخاصة بالمزوّد (غير مخصصة ليقرأها إنسان)، و`usage_metadata` (عدّ الرموز، مفيد لتتبع التكلفة، غير ذي صلة بالمحادثة نفسها). هذا الشكل ذو الصفوف الأربعة — سؤال، استدعاء أداة، نتيجة أداة، إجابة — هو حلقة الوكيل بأكملها من القسم السابق، مكتوبة فقط كبيانات بدلاً من قائمة مرقّمة.

### التعامل مع حدود المعدل

كل مستوى مجاني هنا يحدّ عدد الطلبات التي يمكنك إجراؤها في الدقيقة أو في اليوم، وكل دورة من الوكيل — قرار استدعاء أداة، ثم قراءة النتيجة — تستهلك طلبًا واحدًا على الأقل. شغّل بضعة أسئلة متتالية وقد ترى شيئًا كهذا:

```
Error calling model ... (RESOURCE_EXHAUSTED): 429 RESOURCE_EXHAUSTED.
...Please retry in 41.7s.
```

هذا ليس خطأً في كودك — إنه المزوّد يخبرك بالتمهل. طريقتان للتعامل معه:

1. **الأبسط**: انتظر ببساطة عدد الثواني المقترح وشغّل السكربت مرة أخرى.
2. **الأكثر متانة**: لُف استدعاء `agent.invoke(...)` بـ `try`/`except` يلتقط الخطأ، وينتظر، ويعيد المحاولة تلقائيًا — تمامًا النمط المُدرَّس كمحتوى مكافأة سابقًا في الأسبوع 4 من Python 101. المثال الأوفى في المستودع يفعل هذا فعليًا: انظر `ask()` في [`examples/ai-agent/agent.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-agent/agent.py) لنسخة عاملة يمكنك نسخها، بما في ذلك تحليل مهلة إعادة المحاولة المقترحة من المزوّد من رسالة الخطأ.

:::tip[تستخدم مزوّدًا مختلفًا؟]
استبدل كتلة `ChatOpenAI(...)` بعميل مزوّدك الخاص — مثل `ChatGoogleGenerativeAI(model="gemini-3.5-flash", google_api_key=os.environ["GOOGLE_API_KEY"])` لـ Gemini، أو `ChatGroq(model="llama-3.3-70b-versatile", api_key=os.environ["GROQ_API_KEY"])` لـ Groq. كل شيء آخر في هذا الملف يبقى كما هو — `deepagents` لا يهتم بأي مزوّد يقف خلف النموذج. انظر [`examples/ai-agent/agent.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-agent) في مستودع الدورة لرؤية الستة جميعًا موصولين جنبًا إلى جنب، قابلين للاختيار بمتغيّر بيئة واحد.
:::

## ما بنيته للتو

`search_course_topics` بسيطة عمدًا — أدوات وكيل حقيقي قد تبحث في الويب، أو تستعلم قاعدة بيانات، أو تشغّل كودًا. لكن الشكل هو نفسه الذي يشغّل أنظمة أقدر بكثير: نموذج يفكّر في مهمة، يقرر أي أداة يستدعي وبأي معاملات، يقرأ ناتج الأداة، ويواصل — أحيانًا يستدعي عدة أدوات بالتتابع قبل أن يرد. لقد بنيت للتو أصغر نسخة ممكنة من تلك الحلقة، محليًا، بمفتاحك الخاص.

:::tip[شغّل نسخة أوفى دون أي إعداد محلي]
[`examples/ai-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-agent) في مستودع الدورة **ليست نسخة من الكود أعلاه** — إنها نسخة أوفى عمدًا، بأدوات حقيقية (تبحث في ملفات دروس هذه الدورة الفعلية وتحلل بياناتها الفعلية بـ pandas، بدلاً من قائمة مواضيع ثابتة مكتوبة) ودعم لكل المزوّدين الستة من الجدول أعلاه، يُختار بإعداد واحد. استنسخها، أو افتح المستودع كاملاً في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython وuv مثبّتون مسبقًا) وشغّلها من هناك.
:::

## إلى أين من هنا

- امنح وكيلك أداة *مفيدة* حقًا، لا مجرد أداة تجريبية — أداة تقرأ ملفًا محليًا حقيقيًا، أو تستدعي واجهة برمجة عامة حقيقية. نسخة [`examples/ai-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-agent) في المستودع تفعل هذا بالفعل: تبحث في ملفات دروس هذه الدورة الحقيقية وتحلل بياناتها الحقيقية بـ pandas، بدلاً من التخمين.
- انظر إلى دعم `deepagents` لـ **الوكلاء الفرعيين** — تفويض جزء من مهمة إلى وكيل معطى تعليمات منفصلة، مشابه لكيفية تفويض مدير مهمة فرعية إلى متخصص:

```python
from deepagents import create_deep_agent

research_subagent = {
    "name": "topic-researcher",
    "description": "Looks up whether a topic was covered in the course, in detail.",
    "system_prompt": "You research course topics thoroughly using the available tools.",
    "tools": [search_course_topics],
}

agent = create_deep_agent(
    model=model,
    tools=[search_course_topics, count_weeks_remaining],
    subagents=[research_subagent],
    system_prompt="Delegate topic-research questions to the topic-researcher sub-agent.",
)
```

يستطيع الوكيل الرئيسي الآن تسليم مهمة فرعية إلى `topic-researcher` بدلاً من فعل كل شيء بنفسه — مفيد بمجرد أن تبدأ تعليمات وقائمة أدوات وكيل واحد بالتضخم أكثر من اللازم للتفكير فيها في مكان واحد.
- راجع محتوى `try`/`except` والـ `class` المكافئ من Python 101 — كود الوكلاء الحقيقي يعتمد على كليهما باستمرار (التقاط استدعاء أداة فاشل، تغليف حالة مترابطة في كلاس) بطرق تجنّبها منهج هذه الدورة الأساسي عمدًا.

## شارك وكيلك مع الصف

بنيت شيئًا تفتخر به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لوكلاء أرسلها طلاب آخرون — وملف README الخاص به يحتوي شرحًا كاملاً وودودًا للمبتدئين لإضافة وكيلك عبر **طلب سحب (pull request)**، حتى لو لم تستخدم git من قبل: عمل fork للمستودع، إنشاء فرع، تثبيت ملفاتك، وفتح طلب السحب، خطوة بخطوة. لا يُفترض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓

<CapstoneProgressCheckbox capstoneId="2026-ai-agent" />
