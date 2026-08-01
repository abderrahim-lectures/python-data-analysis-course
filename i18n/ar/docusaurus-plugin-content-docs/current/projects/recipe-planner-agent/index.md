---
id: recipe-planner-agent
title: "بناء وكيل مخطط للوصفات"
sidebar_label: "وكيل مخطط للوصفات"
slug: /projects/recipe-planner-agent
description: "انتقل من الملعب داخل المتصفح إلى Python فعلي: ابنِ وكيل ذكاء اصطناعي يستخدم الأدوات مع deepagents من LangChain، يقترح وجبات من المكونات المتوفرة لديك، مرتكزًا على قاعدة بيانات وصفات محلية حقيقية."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 بناء وكيل مخطط للوصفات

<ProjectPublishedDate projectId="recipe-planner-agent" />

<ProjectGreeting />

تكتب قائمة بمكونات لديك فعليًا — لنقل، بيضًا وطماطمًا وثومًا وخبزًا — فيقترح وكيل 2-3 وجبات حقيقية يمكنك إعدادها بها، ثم يبني قائمة تسوق لما ينقص لأفضل خيار. ما يجعل هذا وكيلًا مفيدًا فعليًا لا مجرد روبوت محادثة: إنه لا يخترع وصفة أبدًا. يستدعي أداة تبحث في قاعدة بيانات وصفات محلية حقيقية ولا يمكنه اقتراح سوى ما تعيده تلك الأداة فعلًا — نفس فكرة الارتكاز وراء أنظمة أكثر جدية بكثير من "لا تدع النموذج يختلق الأمور"، مصغَّرة إلى شيء يمكنك بناؤه في ظهيرة واحدة.

يفترض هذا Python بمستوى 101. إن إنجاز [مشروع وكيل الذكاء الاصطناعي](/docs/projects/ai-agent) أولًا مساعدة حقيقية، لا شرطًا صارمًا — يعيد هذا المشروع استخدام نفس إطار عمل `deepagents` ونفس نمط استدعاء الأدوات، فقط بأداة أكثر تنظيماً وأقرب لشكل العالم الحقيقي. هذا اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/docs/projects) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. تثبيت `uv`، والحصول على مفتاح API للذكاء الاصطناعي من الطبقة المجانية، وإعداد مشروع صغير بـ`deepagents` — كل ذلك مقدمًا، في قسم الإعداد أدناه.
2. تعريف "قاعدة بيانات وصفات" محلية صغيرة — قائمة Python بسيطة من القواميس، 10-15 وصفة، لكل واحدة قائمة مكوناتها الخاصة.
3. كتابة دالة أداة يستطيع الوكيل استدعاءها للبحث في تلك القاعدة بالمكونات المتوفرة لديك.
4. ربط تلك الأداة بوكيل `deepagents` مع برومبت نظام يبقيه مرتكزًا على وصفات حقيقية فقط.
5. طلب اقتراحات وجبات من الوكيل انطلاقًا من قائمة مكونات حقيقية، ثم جعله يبني قائمة تسوق للوصفة التي تختارها.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي والموصى به — Python فعلي مثبّت على جهازك الخاص، نفس خطوة "التخرّج إلى Python فعلي" ككل مشروع آخر في هذا القسم. تفترض الخطوات من 1 فصاعدًا هذا المسار.

**GitHub Codespaces** يعمل بنفس الجودة: افتح [مستودع الدورة كاملًا في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython وuv مثبّتة بالفعل، وفق `.devcontainer/devcontainer.json` الخاص بالمستودع) ونفّذ نفس أوامر `uv` تمامًا من طرفية في تبويب متصفحك.

**Google Colab وKaggle Notebooks أو Binder** جيدة أيضًا — هذا سكربت خفيف يستدعي API فقط، بلا GPU أو تثبيت ثقيل. نسخة دفتر ملاحظات جاهزة للتشغيل من هذا المشروع ([`examples/recipe-planner-agent/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/recipe-planner-agent/notebook.ipynb)) على بُعد نقرة واحدة:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/recipe-planner-agent/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/recipe-planner-agent/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Frecipe-planner-agent%2Fnotebook.ipynb)

إنها طريقة أقل دقة لتجربة المشروع من مشروع `uv` محلي فعلي — بلا ملفات منفصلة، بلا بنية مشروع حقيقية — لكنها قابلة للعمل تمامًا لتجربة الفكرة. اضبط مفتاح API خاصتك بـ`os.environ["GITHUB_TOKEN"] = "..."` في خلية getpass (أو استخدم لوحة Secrets في Colab).

## الإعداد

كل ما تحتاجه قبل أن تكتب سطرًا واحدًا من الوكيل نفسه موجود هنا — تثبيت `uv`، والحصول على مفتاح API، وإنشاء المشروع، وإعداد ملف `.env` الخاص بك. تفترض الخطوات من 1 فصاعدًا أن كل هذا قد أُنجز بالفعل.

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

إن لم يكن لديك بعد مُفسِّر Python فعلي مثبّت ومُدار بواسطة `uv` (من مشروع سابق في هذه السلسلة)، فاحصل على واحد الآن:

```bash
uv python install 3.12
```

### احصل على مفتاح API للذكاء الاصطناعي مجانًا

**اختر أي مزوّد تفضّله** — لا يتطلب أي منها بطاقة ائتمان وقت كتابة هذا، ولا تفضّل هذه الدورة مزوّدًا على آخر.

| المزوّد | أين تحصل على مفتاح | لماذا قد تختاره |
|---|---|---|
| **GitHub Models** *(مقترح افتراضيًا)* | [github.com/settings/tokens](https://github.com/settings/tokens) — رمز وصول شخصي بنطاق `models: read` | بلا تسجيل منفصل — لديك بالفعل حساب GitHub. حدود الطبقة المجانية أسخى من حدود Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | الخيار الأكثر شيوعًا في الإشارة إليه. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | استدلال سريع، طبقة مجانية سخية، بلا بطاقة. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | أحد الحصص المجانية الدائمة الأسخى. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | حجم رموز يومي مرتفع، بلا بطاقة. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | API واحد، نماذج مجانية كثيرة — جيد لمقارنة المزوّدين. |

أيًا كان ما تختاره، فالعملية نفسها: سجّل الدخول، وولّد مفتاحًا على موقع ذلك المزوّد، و**لا تلصقه أبدًا مباشرة في الكود ولا تثبّته في مستودع**. يبقي هذا المشروع المفتاح في ملف `.env` (أدناه) بدلًا من ذلك.

### أعدّ المشروع باستخدام `uv`

```bash
uv init recipe-planner-agent
cd recipe-planner-agent
uv add deepagents langchain-openai python-dotenv
```

ينشئ `uv init` مشروعًا صغيرًا (ملف `pyproject.toml` يتتبع اعتمادياتك)، ويثبّت `uv add` الحزم في بيئة معزولة لذلك المشروع تلقائيًا، دون إعداد بيئة افتراضية يدويًا. `deepagents` هو إطار عمل LangChain لبناء وكلاء مزوّدين باستخدام أدوات مدمج — نفس الإطار المستخدم في [مشروع وكيل الذكاء الاصطناعي](/docs/projects/ai-agent)؛ `langchain-openai` هي حزمة التكامل التي يستخدمها هذا المثال للتحدث مع GitHub Models (واجهته البرمجية متوافقة مع OpenAI، لذا تعمل حزمة تكامل OpenAI معه أيضًا — انظر التلميح أدناه إن اخترت مزوّدًا مختلفًا)؛ `python-dotenv` تتيح لك إبقاء مفتاح API في ملف `.env` محلي.

إن اخترت مزوّدًا مختلفًا أعلاه، فاستبدل `langchain-openai` بحزمة ذلك المزوّد — `langchain-google-genai` (Gemini)، أو `langchain-groq` (Groq)، أو `langchain-mistralai` (Mistral). كل من Cerebras وOpenRouter متوافقان أيضًا مع OpenAI، لذا يستخدمان `langchain-openai` كذلك، فقط مع `base_url` مختلف.

:::tip[تحقق من الوثائق الحالية — ومن اسم النموذج]
تتقدم أطر عمل الوكلاء بسرعة، وكذلك أسماء النماذج: تُعاد تسميتها وتُسحب على مقياس أشهر لا سنوات. استخدم معرّف نموذج صريحًا ومُحدَّد الإصدار بدلًا من اسم مستعار `-latest` — عدة مزوّدين، بما في ذلك Google، ألغوا هذه الأسماء المستعارة لأنها تبدّل بصمت إلى إصدار نموذج جديد، مما قد يكسر كودًا يعمل دون أي تحذير. قبل تشغيل هذا، تحقق من صفحة الأسعار/النموذج الحالية لمزوّدك، واطّلع على README الخاص بـ`deepagents` نفسه لواجهته البرمجية الحالية.
:::

### أنشئ ملف `.env` الخاص بك

في مجلد مشروعك، أنشئ ملفًا باسم `.env` (لا تثبّته أبدًا) يحوي مفتاح أي مزوّد اخترته:

```bash
# .env
GITHUB_TOKEN=your-key-here
```

يقرأ `python-dotenv` (المثبّت أعلاه) هذا الملف في `os.environ` في أعلى سكربتك، لذا لا يحوي كودك المفتاح مطبوعًا فيه مباشرة أبدًا.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يطبع `uv --version` رقم إصدار.</StepChecklistItem>
<StepChecklistItem>لديك مفتاح API حقيقي من مزوّد واحد، وهو محفوظ في ملف `.env` — لا ملصوق في أي ملف `.py`.</StepChecklistItem>
<StepChecklistItem>اكتمل `uv add deepagents langchain-openai python-dotenv` (أو حزمة مزوّدك) دون أخطاء.</StepChecklistItem>
</StepChecklist>

## الخطوة 1: ابنِ قاعدة بيانات الوصفات المحلية الخاصة بك

كل ما سيقترحه الوكيل يومًا ما يأتي من هذه البنية البياناتية الواحدة — قائمة Python بسيطة من القواميس، بلا خادم قاعدة بيانات، بلا API خارجي. أنشئ `recipes.py`:

```python
# recipes.py
RECIPES = [
    {
        "name": "Tomato Egg Stir-Fry",
        "ingredients": ["eggs", "tomatoes", "garlic", "salt", "oil"],
        "instructions": "Scramble the eggs, set aside. Saute garlic and chopped tomatoes "
        "until soft, stir the eggs back in, season with salt.",
    },
    {
        "name": "Garlic Butter Pasta",
        "ingredients": ["pasta", "butter", "garlic", "parmesan", "salt"],
        "instructions": "Boil the pasta. Melt butter with minced garlic, toss the pasta "
        "in it, top with grated parmesan and salt.",
    },
    {
        "name": "Classic Grilled Cheese",
        "ingredients": ["bread", "cheese", "butter"],
        "instructions": "Butter one side of each bread slice, add cheese between the "
        "unbuttered sides, grill in a pan until golden on both sides.",
    },
    {
        "name": "Simple Fried Rice",
        "ingredients": ["rice", "eggs", "soy sauce", "onion", "oil"],
        "instructions": "Scramble the eggs and set aside. Fry chopped onion in oil, add "
        "cooked rice, stir in soy sauce and the eggs.",
    },
    {
        "name": "Chickpea Salad",
        "ingredients": ["chickpeas", "cucumber", "tomatoes", "olive oil", "lemon", "salt"],
        "instructions": "Drain the chickpeas, dice the cucumber and tomatoes, toss "
        "everything with olive oil, lemon juice, and salt.",
    },
    # ... a real database keeps going. See examples/recipe-planner-agent/recipes.py
    # in the course repo for the full 13-recipe version this lesson uses.
]
```

كل وصفة مجرد قاموس يحوي `name`، وقائمة `ingredients` (بحروف صغيرة، بلا كميات — فقط ما يُحتاج إليه)، و`instructions` قصيرة. هذا نفس الشكل تمامًا لقائمة `topics` التجريبية من `search_course_topics` في مشروع وكيل الذكاء الاصطناعي، فقط أثرى: قائمة سجلات مُهيكَلة يمكن لدالة أداتك البحث فوقها.

:::tip[الأكبر أفضل فعلًا هنا]
قاعدة بيانات وصفات تحوي 3-4 مدخلات ستجعل وكيلك يبدو معطّلًا حتى عندما يكون الكود سليمًا — معظم قوائم المكونات التي يكتبها طالب لن تتقاطع ببساطة مع أي شيء. استهدف الوصفات العشر إلى الخمس عشرة كاملة (نسخة المستودع تحوي 13)، تغطي مزيجًا حقيقيًا من البروتينات والكربوهيدرات والخضروات، لكي تتاح لقائمة نموذجية من "ماذا يوجد في ثلاجتي" فرصة لائقة للتوافق مع شيء.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يعرّف `recipes.py` قائمة `RECIPES` كقائمة من 10 قواميس على الأقل.</StepChecklistItem>
<StepChecklistItem>لكل وصفة `name`، و`ingredients` (قائمة)، و`instructions`.</StepChecklistItem>
<StepChecklistItem>أسماء المكونات بحروف صغيرة ومتسقة عبر الوصفات (مثلًا دائمًا `"tomatoes"`، لا خليط من `"tomatoes"` و`"Tomato"` أبدًا).</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لماذا قائمة قواميس بدلًا من، لنقل، قاموس مفتاحه اسم الوصفة؟ ماذا ستكسب أو تخسر في كلتا الحالتين؟
- إن تشاركت وصفاتان كل مكوناتهما تقريبًا، كيف قد يؤثر ذلك على أيّهما يميل الوكيل لاقتراحها أولًا؟

## الخطوة 2: اكتب أداة يستطيع الوكيل البحث بها عن الوصفات

لا يحق للوكيل قراءة `recipes.py` مباشرة — لا يمكنه رؤية سوى ما تُرجعه دالة أداة، تمامًا مثل `search_course_topics` في مشروع وكيل الذكاء الاصطناعي. أضف هذا إلى `recipes.py`، أو إلى ملف جديد يستورد `RECIPES`:

```python
def search_recipes_by_ingredients(ingredients: list[str]) -> str:
    """Search the local recipe database for recipes that best match the given ingredients.

    `ingredients` should be a list of ingredient names the caller already
    has on hand (e.g. ["eggs", "tomatoes", "garlic"]). Returns the top
    matching recipes, ranked by how many of their ingredients are already
    covered, each with its full ingredient list and the ingredients still
    missing -- so a shopping list can be built from the result without
    guessing. Returns a plain "no matches" message if nothing overlaps at
    all, so the caller never has to invent a recipe out of thin air.
    """
    have = {i.strip().lower() for i in ingredients}
    scored = []
    for recipe in RECIPES:
        needed = {i.lower() for i in recipe["ingredients"]}
        overlap = have & needed
        if not overlap:
            continue
        missing = sorted(needed - have)
        scored.append((len(overlap), recipe, missing))

    if not scored:
        return "No matching recipes found in the database for those ingredients."

    scored.sort(key=lambda row: row[0], reverse=True)
    top = scored[:5]

    lines = []
    for _, recipe, missing in top:
        missing_text = ", ".join(missing) if missing else "nothing -- you have it all!"
        lines.append(
            f"- {recipe['name']} | full ingredient list: {', '.join(recipe['ingredients'])} "
            f"| missing: {missing_text}"
        )
    return "Matching recipes (best match first):\n" + "\n".join(lines)
```

الفكرة الجوهرية: `have & needed` (تقاطع المجموعات) يعدّ كم من مكونات وصفة لديك بالفعل، و`needed - have` (فرق المجموعات) هو بالضبط ما ينقص بعد. ترتيب بحجم التقاطع، الأكبر أولًا، يعني أن الوصفات الأقرب إلى "جاهزة للطهي الآن" تأتي أولًا — ولأن الأداة تُرجع المكونات الناقصة *لكل* مرشَّح، لا الأفضل فقط، فللوكيل كل ما يحتاجه لبناء قائمة تسوق لاحقًا دون بحث ثانٍ.

لاحظ أن نوع الإرجاع سلسلة بسيطة، مثل `search_course_topics` و`count_words` في المشاريع السابقة — يقرأ النموذج نصًا لا كائنات Python، لذا فإن سلسلة مُنسَّقة بوضوح هي ما يجب أن تُرجعه الأداة.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>`search_recipes_by_ingredients(["eggs", "tomatoes", "garlic"])` المُستدعاة مباشرة في Python (بلا وكيل بعد) تُرجع سلسلة حقيقية غير فارغة.</StepChecklistItem>
<StepChecklistItem>استدعاؤها بمكونات لا تتطابق مع أي شيء في `RECIPES` يُرجع رسالة "no matching recipes"، لا خطأ.</StepChecklistItem>
<StepChecklistItem>يشرح الـdocstring ما تفعله الدالة وما تُرجعه — لا حشوًا مؤقتًا.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لماذا تُرجع الأداة المكونات الناقصة لأفضل 5 تطابقات، لا لأفضل واحد فقط؟ ماذا سيخسر الوكيل لو حصل على أفضل تطابق فقط؟
- ماذا يحدث الآن إذا مرّر شخص `["Tomatoes"]` (بحرف كبير) — هل ما يزال يتطابق مع `"tomatoes"` في قاعدة البيانات؟ ولماذا؟

## الخطوة 3: اربط الأداة بوكيل `deepagents`

أنشئ `planner.py`:

```python
import os

from deepagents import create_deep_agent
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

from recipes import RECIPES, search_recipes_by_ingredients

load_dotenv()  # reads .env into the environment, if present

SYSTEM_PROMPT = """You are a helpful recipe-planning assistant.

You have exactly one source of truth for what recipes exist: the
search_recipes_by_ingredients tool. Never invent, guess, or recall a recipe
from your own training data -- only suggest recipes that tool actually
returned in its results for this conversation.

When a student lists what they have on hand:
1. Call search_recipes_by_ingredients with that ingredient list.
2. Suggest 2-3 recipes from the tool's results, explaining briefly why each
   is a good fit (how much they already have).
3. If the tool returns no matches, say so plainly and suggest the student
   try listing a few more ingredients -- do not make up a recipe to fill
   the gap.
4. If asked to build a shopping list for a specific recipe, use the
   "missing" ingredients the tool already reported for that recipe -- don't
   recompute or guess at what's missing.
"""

model = ChatOpenAI(
    model="gpt-4o-mini",  # confirm this still has a free tier before running -- see the tip above
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)

agent = create_deep_agent(
    model=model,
    tools=[search_recipes_by_ingredients],
    system_prompt=SYSTEM_PROMPT,
)
```

هذا نفس شكل `create_deep_agent(model=..., tools=[...], system_prompt=...)` من مشروع وكيل الذكاء الاصطناعي، بأداة واحدة بدلًا من اثنتين. ما يختلف، ويستحق التأمل، هو **برومبت النظام**: لا يصف الأداة فحسب، بل يحظر صراحةً نمط الفشل الذي صُمم هذا المشروع بأكمله لإظهاره — اقتراح وصفة لم تُرجعها الأداة أبدًا. كون الأداة *متاحة* لا يضمن أن النموذج يستخدمها دائمًا؛ برومبت النظام هو المكان الذي تخبره فيه أن استخدام الأداة، والأداة فقط، ليس اختياريًا هنا.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يستورد `planner.py` كلا `RECIPES` و`search_recipes_by_ingredients` من `recipes.py` دون أخطاء.</StepChecklistItem>
<StepChecklistItem>يعمل `agent = create_deep_agent(...)` دون رفع استثناء — هذا وحده لا يستدعي النموذج بعد، فقط يبني الوكيل.</StepChecklistItem>
<StepChecklistItem>يقول برومبت النظام صراحةً ألا يقترح وصفة لم تُرجعها الأداة.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يخبر برومبت النظام النموذج ماذا يفعل إن لم تُرجع الأداة أي تطابق. ماذا تعتقد أن يحدث لو حذفت تلك التعليمات تمامًا — من أين قد تأتي إجابة النموذج بدلًا من ذلك؟
- لماذا تمرير `tools=[search_recipes_by_ingredients]` (الدالة نفسها) بدلًا من، لنقل، `tools=[RECIPES]` (البيانات الخام)؟ ماذا يمكن للنموذج فعلًا أن يفعل بقائمة خام من القواميس كـ"أداة"؟

## الخطوة 4: اطلب اقتراحات الوجبات

أضف كتلة تشغيل في أسفل `planner.py`:

```python
if __name__ == "__main__":
    on_hand = "I have eggs, tomatoes, garlic, bread, and cheese. What can I make?"
    print("🧑 You:", on_hand)
    result = agent.invoke({"messages": [{"role": "user", "content": on_hand}]})
    print("🤖 Agent:", result["messages"][-1].content)
```

شغّلها:

```bash
uv run python planner.py
```

يجب أن ترى الإجابة النهائية للوكيل: 2-3 أسماء وصفات حقيقية مسحوبة مباشرة من `RECIPES`، كل واحد مع سبب قصير لملاءمته لمكوناتك. إذا كنت فضوليًا حول *كيف* وصل إلى هناك — أي استدعاء أداة حدث، وبأي وسائط، وماذا أعادت الأداة فعلًا قبل أن يكتب النموذج إجابته — اطبع قائمة `result["messages"]` كاملة بدلًا من الأخيرة فقط، وهي نفس التقنية المشروحة في قسم "فهم التتبع الداخلي الكامل" في مشروع وكيل الذكاء الاصطناعي: `HumanMessage` (سؤالك)، و`AIMessage` يطلب استدعاء الأداة، و`ToolMessage` يحوي السلسلة الحقيقية التي أعادتها `search_recipes_by_ingredients`، ثم `AIMessage` أخير بالإجابة.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>طباعة تشغيل `uv run python planner.py` تعرض إجابة حقيقية، لا traceback.</StepChecklistItem>
<StepChecklistItem>كل اسم وصفة في الإجابة يظهر فعلًا في `RECIPES` — تحقق بالعين، أو بالبحث في `recipes.py`.</StepChecklistItem>
<StepChecklistItem>جرّبت قائمة مكونات واحدة على الأقل تتطابق بشكل ضعيف، وعالجها الوكيل بشكل معقول (قال ذلك، أو اقترح خيارات قريبة) بدلًا من اختلاق شيء.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- إذا غيّرت `on_hand` إلى مكونات لا تتقاطع مع أي شيء في قاعدتك، ماذا يقول الوكيل؟ هل يتبع تعليمات برومبت النظام، أم يتراجع إلى التخمين؟
- تُرجع الأداة أفضل 5 تطابقات لديها، لكن برومبت النظام يطلب 2-3 اقتراحات. أين يحدث هذا التضييق — في كود Python الخاص بك، أم داخل استدلال النموذج؟

## الخطوة 5: ابنِ قائمة تسوق وشغّله من البداية إلى النهاية

لأن `search_recipes_by_ingredients` حسَبَت بالفعل المكونات الناقصة لكل وصفة مرشَّحة، فإن الحصول على قائمة تسوق هو مجرد سؤال متابعة في نفس المحادثة — بلا أداة جديدة مطلوبة. وسّع كتلة التشغيل لتواصل المحادثة بدلًا من بدء واحدة جديدة كل مرة:

```python
if __name__ == "__main__":
    conversation = []

    on_hand = "I have eggs, tomatoes, garlic, bread, and cheese. What can I make?"
    print("🧑 You:", on_hand)
    conversation.append({"role": "user", "content": on_hand})
    result = agent.invoke({"messages": conversation})
    conversation = result["messages"]  # carry the full history forward
    print("🤖 Agent:", conversation[-1].content)

    print()
    follow_up = "Great, let's go with the first one -- what's my shopping list?"
    print("🧑 You:", follow_up)
    conversation.append({"role": "user", "content": follow_up})
    result = agent.invoke({"messages": conversation})
    conversation = result["messages"]
    print("🤖 Agent:", conversation[-1].content)
```

`conversation = result["messages"]` هي السطر المهم: كل استدعاء `agent.invoke(...)` عديم الحالة بذاته، لذا فإن *الطريقة الوحيدة* لمعرفة السؤال الثاني بماذا يشير "الأول" هي أن تُعيد كامل سجل الرسائل — بما فيه إجابة النموذج السابقة نفسها وأي استدعاءات أدوات أجراها — كجزء من مدخلات الاستدعاء التالي. احذف هذا السطر وأعد التشغيل: سيعجز السؤال الثاني عن تحويل "الأول" إلى أي شيء، لأنه بالنسبة لذلك الاستدعاء، لم توجد رسالة أولى قط.

شغّله مجددًا بـ`uv run python planner.py` ويجب أن ترى تبادلًا كاملًا وحقيقيًا: اقتراحًا، ثم قائمة تسوق مبنية من مكونات "missing" الدقيقة التي أبلغت عنها الأداة لأي وصفة اخترتها — لا تخمينًا جديدًا.

:::tip[جرّب قائمة مكونات متناثرة عن عمد]
شغّله مجددًا بمكون أو مكونين فقط، شيئًا مثل `"I have onions and salt. What can I make?"` هذه أفضل طريقة لرؤية الحاجز الوقائي لبرومبت نظامك يعمل فعلًا: مع عدم وجود شيء تقريبًا لتطابقه، ستحصل إما على اقتراحات صادقة من "لا تطابق كبير، لكن إليك أقرب خيار"، أو (إن كان التقاطع رفيعًا جدًا) رسالة "no matches" من الأداة تمر مباشرة — في كلتا الحالتين، راقب هل ما يزال الوكيل يقاوم اختلاق ما ليس في `RECIPES`.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يشير السؤال الثاني في المحادثة بشكل صحيح إلى "الأول" من الإجابة السابقة.</StepChecklistItem>
<StepChecklistItem>قائمة التسوق التي ينتجها تطابق مكونات "missing" التي أبلغت عنها الأداة لتلك الوصفة — لا قائمة مختلفة أو مختلقة.</StepChecklistItem>
<StepChecklistItem>نفّذت اختبار المكونات المتناثرة أعلاه ولم يختلق الوكيل وصفة غير موجودة في `RECIPES`.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- ماذا سينكسر في سؤال المتابعة لو بدأت `conversation = []` جديدة كليًا له بدلًا من إعادة استخدام واحدة السؤال الأول؟
- لا تستدعي خطوة قائمة التسوق أي أداة جديدة — تعيد استخدام بيانات أعادها استدعاء الأداة الأول بالفعل. ماذا يقترح ذلك بشأن تصميم القيمة المُرجَعة لأداة مع التفكير بأكثر من السؤال المباشر فقط؟

## ⚠️ مآزق شائعة

- **قاعدة بيانات وصفات أصغر من اللازم.** مع حفنة وصفات فقط، لن تتقاطع معظم قوائم المكونات التي يكتبها طالب مع أي شيء، وسيبدو الوكيل معطلًا حتى عندما يكون الكود صحيحًا. استهدف الوصفات العشر إلى الخمس عشرة كاملة التي تغطي تنوعًا حقيقيًا.
- **أسماء مكونات لا تتطابق.** لن يتطابق `"tomato"` في قائمتك المكتوبة مع `"tomatoes"` في قاعدة البيانات بهذه الأداة البسيطة القائمة على المجموعات — لا توجد مطابقة ضبابية هنا. حافظ على اتساق أسماء المكونات (دائمًا بصيغة الجمع، ودائمًا بحروف صغيرة) في كل من قاعدة البيانات وما تطلبه من الوكيل، أو وسّع الأداة بتطبيع أساسي (مثل إزالة `"s"` أخيرة) إن أردت المضي أبعد.
- **اختلاق الوكيل وصفة عندما لا تُرجع الأداة شيئًا.** هذا بالضبط نمط الفشل الذي وُجد برومبت النظام في الخطوة 3 لمنعه. إذا تخطيت تلك التعليمات، أو صغتها بشكل غامض جدًا، فغالبًا ما "يساعد" نموذج قادر باقتراح شيء يبدو معقولًا بدلًا من الاعتراف بأنه لا يملك شيئًا — اختبر تحديدًا حالة المكونات المتناثرة من التلميح أعلاه للقبض على هذا.
- **فقدان سجل المحادثة بين الأسئلة.** إذا حصل سؤال متابعة مثل "ما قائمة التسوق للأول" على إجابة مشوشة أو عامة، تحقق من أنك تمرر قائمة `conversation` المتراكمة (الخطوة 5) إلى `agent.invoke(...)`، لا الرسالة الأحدث فقط وحدها.

## ما بنيته للتو

وكيل يجيب سؤالًا منفتحًا فعليًا — "ماذا يمكنني أن أصنع؟" — عبر إرساء كل جزء من إجابته في بيانات محلية حقيقية ومُهيكَلة بدلًا من معرفة تدريبه الخاصة، ويرفض سدّ الفجوات بتفاصيل مختلقة عندما لا تدعمها البيانات. نمط الإرساء هذا (أداة مدعومة ببيانات حقيقية، وبرومبت نظام يحظر الإجابة خارجها) هو الشكل نفسه وراء أنظمة أكثر جدية بكثير تحتاج أن يظل الذكاء الاصطناعي فيها واقعيًا: روبوت دعم مقصورًا على وثائق حقيقية، ومساعد برمجة مقصورًا على قاعدة كود حقيقية، وأداة بحث مقصورة على مصادر مسترجعة حقيقية. لقد بنيت للتو أصغر نسخة من تلك الفكرة، بالوصفات.

## إلى أين تذهب من هنا

- أنمِ `recipes.py` لما يتجاوز 13 مدخلًا بكثير، أو حمّله من ملف JSON أو CSV حقيقي بدلًا من قائمة Python مثبتة في الكود — بالكاد تحتاج دالة الأداة إلى تغيير.
- أضف أداة ثانية، مثل `get_recipe_instructions(name: str) -> str`، لكي يستطيع الوكيل إرشاد طالب خلال طهي الوصفة التي اقترحها للتو، لا تسميتها فقط.
- حسّن المطابقة في `search_recipes_by_ingredients` — تعامل مع صيغ الجمع البسيطة، وتجاهل أساسيات المخزن الشائعة مثل الملح والزيت عند تسجيل التقاطع (معظم المطابخ تملكها بالفعل)، أو دع الطالب يقول ما *لا* يريده صراحةً.
- أعد النظر في قسم **الوكلاء الفرعيين** من مشروع وكيل الذكاء الاصطناعي — يمكنك تقسيم هذا إلى وكيل فرعي "باحث عن الوصفات" ووكيل فرعي "قائمة تسوق"، لكل منهما مهمة أضيق.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓

<ProjectProgressCheckbox projectId="recipe-planner-agent" />
