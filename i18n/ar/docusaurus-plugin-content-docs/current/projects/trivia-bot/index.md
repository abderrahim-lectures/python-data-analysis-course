---
id: trivia-bot
title: "بناء بوت Trivia على Discord"
sidebar_label: "بناء بوت Trivia على Discord"
slug: /projects/trivia-bot
description: "ابنِ بوتًا بـ`discord.py` يشغّل جولات Trivia في خادم، ويتتبّع النقاط على لوحة متصدّرين دائمة، ويمكنه توليد أسئلة جديدة حول أي موضوع باستخدام LLM مجاني."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 بناء بوت Trivia على Discord

<ProjectPublishedDate projectId="trivia-bot" />

<ProjectGreeting />

بوت `discord.py` حيّ يشغّل جولات Trivia في خادم: انشر سؤالًا، واجمع الإجابات ضمن مهلة زمنية، واكشف من أجاب إجابة صحيحة، واحتفظ بلوحة متصدّرين دائمة عبر الجولات. تتوقف معظم بوتات Trivia عند بنك أسئلة ثابت — يضيف هذا البوت لمسة تناسب دورة Python: يمكنه أيضًا توليد سؤال جديد حول أي موضوع في الحال باستخدام LLM مجاني، بدلًا من الاكتفاء دائمًا بالسؤال من قائمة جاهزة.

يفترض هذا Python بمستوى 101. لا يتطلب أي مشروع واقعي آخر قبله، رغم أنه إذا كنت قد بنيت بالفعل [ابنِ تطبيق RAG](/docs/projects/rag-notes)، فسيبدو إعداد LLM المجاني أدناه مألوفًا.

هذا اختياري وغير مُقيَّم. راجع [مشاريع من العالم الحقيقي](/docs/projects) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. أنشئ تطبيق بوت Discord واحصل على رمزه المميز من بوابة المطوّرين المجانية في Discord.
2. ثبّت `uv`، وأعِدَّ مشروعًا، وأضف `discord.py` إلى جانب عميل LLM مجاني.
3. ابنِ بنك أسئلة Trivia ثابتًا وأمرًا أساسيًا بشرطة مائلة في Discord ينشر واحدًا.
4. أضف لوحة متصدّرين دائمة لكل لاعب، محفوظة عبر عمليات إعادة التشغيل.
5. أضف وضع توليد الأسئلة بالـLLM: أعطِ البوت موضوعًا، واحصل على سؤال جديد.
6. اربط كل ذلك في حلقة جولة كاملة — انشر سؤالًا، واجمع الإجابات ضمن مهلة زمنية، واكشف الإجابة، وحدّث لوحة المتصدّرين.
7. ادعُ البوت إلى خادم اختبار وشغّل جولات حقيقية، من البداية إلى النهاية.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو الخيار العملي الوحيد فعليًا هنا، أكثر من معظم المشاريع الأخرى في هذه السلسلة. بوت Discord ليس سكربتًا يعمل مرة واحدة وينتهي — إنه يمسك اتصالًا مفتوحًا بـDiscord ويحتاج إلى الاستمرار في العمل طالما أردته أن يستجيب لـ`/trivia` ويجمع الإجابات، ما يعني عملية حقيقية محلية (أو مستضافة) طويلة التشغيل، لا أمرًا لمرة واحدة.

**GitHub Codespaces** يعمل أيضًا، وهو بديل معقول إذا فضّلت عدم تثبيت أي شيء محليًا: افتح [مستودع الدورة كاملًا في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython و`uv` مثبّتة بالفعل، وفق `.devcontainer/devcontainer.json` الخاص بالمستودع) وشغّل `uv run python bot.py` في طرفية هناك — يبقى يعمل ما دامت تلك الطرفية (والـCodespace) مفتوحة، نفس شرط "العملية طويلة التشغيل" كما في تشغيله محليًا.

**Google Colab وKaggle Notebooks ملاءمة ضعيفة للبوت الفعلي** — كن صادقًا مع نفسك بشأن ذلك بدلًا من مقاومته. بُنيت دفاتر الملاحظات حول تشغيل خلية، والحصول على مخرجات، والانتقال إلى الخلية التالية؛ إنها ليست مقصودة لعملية خلفية تجلس وتنتظر الأحداث إلى أجل غير مسمّى. يمكنك *أن* تبدأ حلقة أحداث البوت في خلية دفتر ملاحظات، لكن اللحظة التي يعيد فيها وقت تشغيل الدفتر تدوير نفسه، أو ينقطع اتصاله، أو تُغلق التبويب، يسقط البوت معه — تجاوز Colab/Kaggle للبوت الحيّ واستخدم عملية محلية حقيقية أو Codespaces بدلًا من ذلك.

مع ذلك، فإن توليد الأسئلة والتسجيل *أسفل* البوت هما مجرد دوال عادية تشغّل خلية واحدة في كل مرة، وهو بالضبط ما تجيده دفاتر الملاحظات. تفتح الشارات أدناه دفتر ملاحظات يولّد أسئلة LLM حقيقية حول بضعة مواضيع نموذجية ويشغّل بضعة "لاعبين" وهميين عبر منطق التسجيل، لترى كليهما يعمل دون تثبيت أي شيء محليًا. إنه يتوقف عمدًا قبل طبقة Discord — من أجل ذلك، عُد إلى هنا وشغّل `bot.py` محليًا أو في Codespaces كما هو موصوف أعلاه.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/trivia-bot/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/trivia-bot/notebook.ipynb)

## الإعداد

كل شيء في هذا القسم يحتاج فقط إلى الحدوث مرة واحدة، قبل أن تكتب أي سطر من البوت نفسه: تثبيت `uv`، وإنشاء تطبيق بوت Discord والحصول على رمزه المميز، والحصول على مفتاح LLM مجاني، وإعداد المشروع. تفترض كل خطوة بعد هذه أن كل ذلك قد أُنجز بالفعل.

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

أغلق طرفيتك وأعد فتحها، ثم تأكد من أنه ثُبِّت:

```bash
uv --version
```

### أنشئ تطبيق بوت Discord واحصل على رمز مميز

[بوابة المطوّرين](https://discord.com/developers/applications) في Discord مجانية ولا تتطلب بطاقة:

1. سجّل الدخول وانقر على **New Application**، أعطِه اسمًا (مثل "trivia-bot")، وأنشئه.
2. افتح تبويب **Bot** على اليسار. يضيف Discord مستخدم بوت إلى تطبيقك تلقائيًا.
3. انقر على **Reset Token** (أو **View Token** إذا كانت هذه أول مرة) وانسخه. هذا الرمز تمامًا مثل كلمة مرور — أي شخص يملكه يستطيع التحكم في بوتك — فعامله بنفس الطريقة التي تعامل بها مفتاح API للـLLM: لا تلصقه أبدًا في الكود، ولا تثبّته أبدًا.
4. في نفس تبويب **Bot**، مرّر إلى **Privileged Gateway Intents** وشغّل **Message Content**. هذا مطلوب لكي يقرأ البوت فعلًا الحرف الذي يرد به اللاعب — بدونه، يستقبل `discord.py` سلسلة فارغة لمحتوى كل رسالة مهما كان الكود الذي تكتبه.
5. افتح **OAuth2 → URL Generator**. تحت **Scopes**، حدّد كلاً من `bot` و`applications.commands` (أوامر الشرطة المائلة تحتاج الثاني تحديدًا)؛ تحت **Bot Permissions**، حدّد على الأقل **Send Messages** و**Read Message History**. أبقِ الرابط المُولَّد في متناول يدك — ستستخدمه في الخطوة الأخيرة لتدعو البوت فعلًا إلى خادم.

:::tip[رمز البوت سرّ، تمامًا مثل مفتاح API]
لا ترمّز رمز البوت في الكود مطلقًا، ولا تثبّته مطلقًا، واحتفظ به في ملف `.env` محلي (أدناه) بدلًا من ذلك — الرمز المسرَّب للبوت يتيح لأي شخص انتحال شخصية بوتك في كل خادم يوجد فيه، تمامًا كما يتيح مفتاح LLM المسرَّب لأي شخص إنفاق حصتك.
:::

### احصل على مفتاح LLM مجاني

يحتاج وضع توليد الأسئلة إلى مفتاح LLM مجاني — **اختر أي مزوّد يعجبك**، لا يتطلب أي منها بطاقة ائتمان وقت كتابة هذا:

| المزوّد | أين تحصل على مفتاح | لماذا قد تختاره |
|---|---|---|
| **GitHub Models** *(الافتراضي المُقترَح)* | [github.com/settings/tokens](https://github.com/settings/tokens) — رمز وصول شخصي مع نطاق `models: read` | لا تسجيل منفصل — لديك بالفعل حساب GitHub. حدود مجانية أكثر سخاءً من حدود Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | الخيار الأكثر شيوعًا. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | استدلال سريع، مستوى مجاني سخي، بلا بطاقة. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | أحد الحصص المجانية الدائمة الأكثر سخاءً. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | حجم رموز يومي مرتفع، بلا بطاقة. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | واجهة API واحدة، نماذج مجانية كثيرة — جيد لمقارنة المزوّدين. |

بنك الأسئلة الثابت (الخطوة 1) لا يحتاج إلى مفتاح LLM إطلاقًا — تحتاج واحدًا فقط عند وصولك إلى توليد الأسئلة حسب الموضوع في الخطوة 3.

### أعِدَّ المشروع

```bash
uv init trivia-bot
cd trivia-bot
uv add discord.py openai python-dotenv
```

`discord.py` هي المكتبة التي تتحدث إلى Discord — الاتصال ببوابته، وتسجيل أوامر الشرطة المائلة، واستقبال/إرسال الرسائل. يتحدث `openai` إلى نقطة نهاية GitHub Models المتوافقة مع OpenAI للمزوّد الافتراضي أعلاه؛ استبدله بحزمة مزوّدك الخاصة إذا اخترت مزوّدًا مختلفًا. تحمّل `python-dotenv` الأسرار من ملف `.env` محلي.

أنشئ ملف `.env` في مجلد المشروع (لا تثبّته أبدًا) مع **كلا** السرّين من هذا القسم:

```bash
# .env
DISCORD_BOT_TOKEN=your-bot-token-here
GITHUB_TOKEN=your-llm-key-here
```

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يوجد تطبيق Discord وبوت في بوابة المطوّرين، ونسخت رمزه المميز.</StepChecklistItem>
<StepChecklistItem>"Message Content" مفعّل تحت Privileged Gateway Intents.</StepChecklistItem>
<StepChecklistItem>لديك مفتاح LLM مجاني من مزوّد من اختيارك.</StepChecklistItem>
<StepChecklistItem>اكتمل `uv init`/`uv add` دون أخطاء، ويحتوي `.env` على كل من `DISCORD_BOT_TOKEN` ومفتاح LLM الخاص بك مضبوطين.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لماذا يتطلب Discord منك تفعيل "Message Content" صراحةً كنية *مميزة*، بدلًا من منح كل بوت وصولًا إلى نص الرسائل افتراضيًا؟
- رمز البوت ومفتاح API للـLLM كلاهما سرّان، لكنهما يُصادِقان على خدمتين مختلفتين تمامًا. ما الذي قد يسوء لو بدّلت بالخطأ أي متغيّر بيئة يحمل أي قيمة؟

## الخطوة 1: بنك أسئلة ثابت وأمر أساسي بشرطة مائلة

ابدأ بأبسط مصدر أسئلة ممكن — قائمة Python عادية من القواميس — وتوصيل Discord كافٍ لنشر واحد:

```python
# questions.py
"""A small fixed bank of trivia questions. Every question, from this bank
or later generated by an LLM, is the same shape:
{"question": str, "options": list[str], "answer_index": int}."""

import random

QUESTION_BANK = [
    {
        "question": "What year was Python first released?",
        "options": ["1989", "1991", "1995", "2000"],
        "answer_index": 1,
    },
    {
        "question": "Which planet is known as the Red Planet?",
        "options": ["Venus", "Jupiter", "Mars", "Saturn"],
        "answer_index": 2,
    },
    # ... a handful more, see examples/trivia-bot/questions.py for the full bank
]


def random_question() -> dict:
    return random.choice(QUESTION_BANK)
```

واجهة `discord.py` الحديثة لهذا هي **أمر بشرطة مائلة**: بدلًا من مشاهدة كل رسالة بحثًا عن شيء يبدو كأمر، تسجّل `/trivia` لدى Discord نفسه، ويعرضه Discord في الواجهة مع إكمال تلقائي. يتطلب ذلك `Client` إضافةً إلى `app_commands.CommandTree` مربوط به:

```python
# bot.py (Step 1 version — grows through the rest of this project)
import os

import discord
from discord import app_commands
from dotenv import load_dotenv

from questions import random_question

load_dotenv()

intents = discord.Intents.default()
intents.message_content = True  # requires the portal toggle from Setup, too

client = discord.Client(intents=intents)
tree = app_commands.CommandTree(client)


@tree.command(name="trivia", description="Start a trivia round")
async def trivia_command(interaction: discord.Interaction) -> None:
    question = random_question()
    lines = [f"**{question['question']}**"]
    for letter, option in zip("ABCD", question["options"]):
        lines.append(f"{letter}) {option}")
    await interaction.response.send_message("\n".join(lines))


@client.event
async def on_ready() -> None:
    await tree.sync()  # registers /trivia with Discord -- can take a minute the first time
    print(f"Logged in as {client.user} -- ready in {len(client.guilds)} server(s).")


if __name__ == "__main__":
    client.run(os.environ["DISCORD_BOT_TOKEN"])
```

`tree.sync()` هو ما ينشر `/trivia` فعلًا إلى Discord ليظهر عندما يكتب أحدهم `/` في خادمك — تجاهله فيوجد الأمر في كودك لكن لا في أي مكان تستطيع واجهة Discord الوصول إليه.

:::tip[أوامر الشرطة المائلة تحتاج نطاق OAuth2 ثانيًا]
دعوة بوت عادية تحتاج فقط إلى نطاق `bot`. تحتاج أوامر الشرطة المائلة تحديدًا إلى `applications.commands` أيضًا — إذا ولّدت رابط دعوتك قبل إضافة `/trivia`، فأعد توليده مع تحديد كلا النطاقين (انظر الإعداد أعلاه) أو لن يظهر الأمر أبدًا في خادمك بصمت.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يعرّف `questions.py` كلاً من `QUESTION_BANK` و`random_question()`.</StepChecklistItem>
<StepChecklistItem>يسجّل `bot.py` أمر شرطة مائلة `/trivia` عبر `app_commands.CommandTree`.</StepChecklistItem>
<StepChecklistItem>يستدعي `on_ready` `await tree.sync()` قبل طباعة رسالة الجاهزية.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يعيد `tree.sync()` تسجيل كل أمر شرطة مائلة لدى خوادم Discord، وهو مُقيَّد بالمعدل. ما الذي قد يسوء لو استدعيته داخل `trivia_command` بدلًا من مرة واحدة في `on_ready`؟
- يشير `answer_index` في قاموس السؤال إلى `options` حسب الموضع بدلًا من تخزين نص الإجابة الصحيحة مباشرة. ما ميزة واحدة لتخزينه بهذه الطريقة؟

## الخطوة 2: تتبّع النقاط، محفوظ عبر الجولات

لوحة المتصدّرين لا تعني شيئًا إلا إذا نجت من إعادة تشغيل البوت، لذا تذهب النقاط إلى ملف JSON صغير بدلًا من العيش في الذاكرة فقط:

```python
# scores.py
"""Per-player score persistence in scores.json. Keyed by Discord user id
(not username), so a player's score survives a nickname change."""

import json
from pathlib import Path

SCORES_PATH = Path("scores.json")


def load_scores() -> dict:
    if not SCORES_PATH.exists():
        return {}
    return json.loads(SCORES_PATH.read_text(encoding="utf-8"))


def save_scores(scores: dict) -> None:
    SCORES_PATH.write_text(json.dumps(scores, indent=2), encoding="utf-8")


def award_point(scores: dict, user_id: int, display_name: str) -> dict:
    key = str(user_id)
    entry = scores.get(key, {"name": display_name, "score": 0})
    entry["name"] = display_name
    entry["score"] += 1
    scores[key] = entry
    save_scores(scores)
    return scores


def leaderboard_text(scores: dict, top_n: int = 10) -> str:
    if not scores:
        return "No scores yet -- play a round with `/trivia`!"
    ranked = sorted(scores.values(), key=lambda entry: entry["score"], reverse=True)
    lines = [f"{i}. {entry['name']} — {entry['score']}" for i, entry in enumerate(ranked[:top_n], start=1)]
    return "\n".join(lines)
```

اختبرها بمفردها قبل توصيلها بـ`bot.py` إطلاقًا — نفس نمط "أثبت أن القطعة تعمل بمفردها أولًا" كما في أي مشروع متعدد الأجزاء:

```bash
uv run python -c "
from scores import award_point, leaderboard_text
s = {}
s = award_point(s, 111, 'Alice')
s = award_point(s, 222, 'Bob')
s = award_point(s, 111, 'Alice')
print(leaderboard_text(s))
"
```

ثم أضف أمر شرطة مائلة ثانيًا يقرأ الملف فقط:

```python
@tree.command(name="leaderboard", description="Show the trivia leaderboard")
async def leaderboard_command(interaction: discord.Interaction) -> None:
    scores = load_scores()
    await interaction.response.send_message(f"**Leaderboard:**\n{leaderboard_text(scores)}")
```

لا شيء يمنح نقطة بعد — لا يفحص `trivia_command` من الخطوة 1 الإجابات إطلاقًا — هذا ما تضيفه حلقة جولة الخطوة 4. هذه الخطوة هي عمدًا نصف التخزين فقط، مًختبرة وتعمل بمفردها أولًا.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يعرّف `scores.py` كلاً من `load_scores()` و`award_point()` و`leaderboard_text()`.</StepChecklistItem>
<StepChecklistItem>تشغيل الاختبار المستقل لـ`scores.py` يطبع لوحة متصدّرين بترتيب Alice أعلى من Bob.</StepChecklistItem>
<StepChecklistItem>`/leaderboard` مسجّل في `bot.py` ويردّ بلوحة المتصدّرين (الفارغة بعد).</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تُحفظ النقاط بمفتاح `str(user_id)` بدلًا من اسم العرض للاعب. ما السيناريو الحقيقي الذي سيكسر لوحة متصدّرين مفتاحية بالأسماء ويصمد أمامه واحد مفتاحي بمعرّفات المستخدمين؟
- تعيد `save_scores()` كتابة الملف بأكمله عند كل نقطة واحدة. لبوت صغير بخادم واحد هذا جيد — عند أي نقطة يتوقف هذا عن كونه جيدًا، وإلى ماذا ستلجأ بدلًا من ذلك؟

## الخطوة 3: ولّد سؤالًا جديدًا حول أي موضوع باستخدام LLM

البنك الثابت في الخطوة 1 يسأل دائمًا من نفس الحفنة من الأسئلة. تضيف هذه الخطوة مصدر أسئلة ثانيًا: أعطِ البوت موضوعًا، فيسأل LLM عن سؤال اختيار من متعدد جديد كليًا عنه، في الحال.

```python
# generate.py
"""Generates a fresh trivia question on a topic via a free-tier LLM.
Returns the exact same shape as questions.py's bank entries, so the rest
of the bot doesn't need to know or care where a question came from."""

import json
import os

from openai import OpenAI

llm_client = OpenAI(
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)

PROMPT_TEMPLATE = """Write one multiple-choice trivia question about: {topic}

Respond with ONLY a JSON object, no other text, in exactly this shape:
{{"question": "...", "options": ["...", "...", "...", "..."], "answer_index": 0}}

Requirements:
- Exactly 4 options.
- Exactly one is correct; put its index (0-3) in answer_index.
- The wrong options must be plausible, not obviously silly.
- Keep the question and every option short enough to fit in a Discord message."""


def generate_question(topic: str) -> dict:
    response = llm_client.chat.completions.create(
        model="gpt-4o-mini",  # confirm this still has a free tier before running
        messages=[{"role": "user", "content": PROMPT_TEMPLATE.format(topic=topic)}],
        response_format={"type": "json_object"},
    )
    question = json.loads(response.choices[0].message.content)

    options = question.get("options")
    answer_index = question.get("answer_index")
    if not question.get("question") or not isinstance(options, list) or len(options) != 4:
        raise ValueError(f"LLM returned a malformed question: {question!r}")
    if not isinstance(answer_index, int) or not (0 <= answer_index < 4):
        raise ValueError(f"LLM returned an invalid answer_index: {question!r}")
    return question
```

فحص الشكل الصريح بعد التحليل مهم: يضمن `response_format={"type": "json_object"}` أن مخرجات الـLLM *JSON صالح*، لا أنها *JSON الصحيح* — قد يُعيد ثلاثة خيارات بدلًا من أربعة، أو يحذف `answer_index` تمامًا. التقاط ذلك هنا، بخطأ واضح، أفضل من اكتشافه لاحقًا كرسالة Discord مربكة بفقدان الخيار D.

اربط معامل `topic` في `/trivia` ليتمكن من السحب من أي من المصدرين:

```python
from round import pick_question  # combines random_question() and generate_question()
```

```python
# round.py
"""Non-Discord round logic shared by bot.py and the notebook."""

from generate import generate_question
from questions import random_question


def pick_question(topic: str | None = None) -> dict:
    if topic:
        return generate_question(topic)
    return random_question()
```

```python
@tree.command(name="trivia", description="Start a trivia round, optionally on a topic")
@app_commands.describe(topic="Optional topic for a freshly generated question")
async def trivia_command(interaction: discord.Interaction, topic: str | None = None) -> None:
    question = pick_question(topic)
    ...
```

جرّب كلا المسارين من طرفية قبل الوثوق بهما داخل Discord:

```bash
uv run python -c "from round import pick_question; print(pick_question())"
uv run python -c "from round import pick_question; print(pick_question('classic video games'))"
```

:::tip[تحقق من المحتوى المُولَّد بالـLLM قبل وصوله إلى قناة حيّة]
LLM طُلبت منه سؤال Trivia قد لا يزال يخطئ في الحقائق، خاصة حول المواضيع الغامضة — لا يوجد `try`/`except` يلتقط "الخطأ الواثق". فحص الشكل في `generate_question()` يحمي فقط من *بنية* معطوبة؛ لخادم عام، تصفّح حفنة من الأسئلة المُولَّدة حول مواضيع تعرفها فعلًا قبل الوثوق بالوضع في مواضيع لا تعرفها.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>`generate_question(topic)` في `generate.py` تُعيد قاموسًا بأربعة خيارات و`answer_index` صالح، أو ترفع خطأً واضحًا.</StepChecklistItem>
<StepChecklistItem>`pick_question()` في `round.py` تُعيد سؤال بنك عندما يكون `topic` فارغًا، وسؤالًا مُولَّدًا بخلاف ذلك.</StepChecklistItem>
<StepChecklistItem>يقبل `/trivia` وسيط `topic` اختياريًا ويستخدمه بشكل مرئي.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تتحقق `generate_question()` من أن `answer_index` عدد صحيح في `0..3` وأن الخيارات أربعة بالضبط، لكنها لا تتحقق من أن *المحتوى* هو فعلًا معلومات Trivia صحيحة. أين الخط بين ما يمكن للكود فحصه بشكل معقول وما لا يمكن إلا لإنسان يراجع المخرجات فحصه؟
- إذا اختار لاعب موضوعًا مسيئًا أو بلا معنى عن قصد، فما أسوأ شيء محتمل يمكن أن تُعيده `generate_question()`، وماذا ستضيف للحماية منه؟

## الخطوة 4: حلقة جولة Trivia كاملة

كل شيء حتى الآن كان قطعًا مًختبرة في عزلة: مصدر أسئلة، وتخزين نقاط، وتوليد. تربط هذه الخطوة بينها فيما تبدو عليه الجولة فعلًا بشكل حيّ — انشر سؤالًا، وانتظر أول إجابة صحيحة ضمن مهلة زمنية، واكشفها، وحدّث لوحة المتصدّرين:

```python
# bot.py (relevant part -- see examples/trivia-bot/bot.py for the full file)
import asyncio

from round import OPTION_LETTERS, check_answer, format_question, pick_question
from scores import award_point, leaderboard_text, load_scores

ROUND_TIME_LIMIT = 30  # seconds


async def run_round(channel: discord.abc.Messageable, topic: str | None = None) -> None:
    question = pick_question(topic)
    valid_letters = OPTION_LETTERS[: len(question["options"])]
    await channel.send(
        f"{format_question(question)}\n\nYou have {ROUND_TIME_LIMIT}s -- "
        f"reply with just the letter ({'/'.join(valid_letters)})."
    )

    def is_candidate_answer(message: discord.Message) -> bool:
        return (
            message.channel == channel
            and not message.author.bot
            and message.content.strip().upper() in valid_letters
        )

    loop = asyncio.get_event_loop()
    deadline = loop.time() + ROUND_TIME_LIMIT
    winner = None

    while True:
        remaining = deadline - loop.time()
        if remaining <= 0:
            break
        try:
            message = await client.wait_for("message", check=is_candidate_answer, timeout=remaining)
        except asyncio.TimeoutError:
            break
        if check_answer(question, message.content):
            winner = message.author
            break
        await message.add_reaction("❌")

    correct_letter = OPTION_LETTERS[question["answer_index"]]
    correct_text = question["options"][question["answer_index"]]

    if winner is not None:
        scores = award_point(load_scores(), winner.id, str(winner.display_name))
        await channel.send(
            f"✅ {winner.mention} got it! The answer was **{correct_letter}) {correct_text}**.\n\n"
            f"**Leaderboard:**\n{leaderboard_text(scores)}"
        )
    else:
        await channel.send(f"⏰ Time's up! Nobody got it. The answer was **{correct_letter}) {correct_text}**.")
```

`client.wait_for("message", check=..., timeout=...)` هي طريقة `discord.py` في إيقاف دالة `async` مؤقتًا حتى يحدث نوع محدد من الأحداث — هنا، أي رسالة في نفس القناة محتواها حرف واحد بالضبط من أحرف الإجابة الصالحة. تستدعيها حلقة `while` مجددًا بمهلة `remaining` متناقصة، بحيث تكون الميزانية الزمنية *الإجمالية* للجولة هي `ROUND_TIME_LIMIT`، لا `ROUND_TIME_LIMIT` لكل تخمين خاطئ — دون إعادة حساب `remaining`، قد تُبقي قناة مليئة بالتخمينات الخاطئة المتحمّسة الجولة مفتوحة إلى أجل غير مسمّى.

فقط الإجابة الصحيحة *الأولى* تسجّل؛ اكسر (`break`) بمجرد ضبط `winner`. تحصل التخمينات الخاطئة على تفاعل ❌ بدلًا من رسالة خطأ — تغذية راجعة مجانية دون إغراق القناة بالردود.

أخيرًا، يصبح `trivia_command` من الخطوة 1 غلافًا رفيعًا حول `run_round`:

```python
@tree.command(name="trivia", description="Start a trivia round, optionally on a topic")
@app_commands.describe(topic="Optional topic for a freshly generated question")
async def trivia_command(interaction: discord.Interaction, topic: str | None = None) -> None:
    starting_text = f"🎲 Starting a round about **{topic}**..." if topic else "🎲 Starting a round..."
    await interaction.response.send_message(starting_text)
    try:
        await run_round(interaction.channel, topic)
    except Exception as error:  # keep the bot alive even if one round fails
        print(f"Error running trivia round: {error!r}")
        await interaction.channel.send("Something went wrong running that round -- see the bot's console log.")
```

:::tip[اختبر توقيت الجولة بـROUND_TIME_LIMIT قصير أولًا]
اضبط `ROUND_TIME_LIMIT = 5` أثناء ضبطك للحلقة، حتى لا تنتظر 30 ثانية لكل دورة اختبار لتكتشف أن `check_answer` فيها خلل. أعد رفعه إلى شيء معقول للعب الحقيقي بمجرد أن تعمل الحلقة نفسها.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>`/trivia` ينشر سؤالًا، ثم ينتظر فعلًا إجابة بدلًا من الحل فورًا.</StepChecklistItem>
<StepChecklistItem>تُعلَن أول إجابة صحيحة ضمن المهلة الزمنية فائزًا وتحصل على نقطة عبر `award_point()`.</StepChecklistItem>
<StepChecklistItem>ترك المؤقّت ينفد دون إجابة صحيحة يكشف الإجابة دون انهيار أو تعليق.</StepChecklistItem>
<StepChecklistItem>تشغيل `/trivia` مرتين متتاليتين يبدأ جولة جديدة في كل مرة، باستخدام لوحة المتصدّرين المحدّثة.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يفحص `is_candidate_answer` `message.channel == channel` حتى لا تُحتسب الإجابات من القنوات الأخرى في الخادم. ماذا سيحدث لجولة في خادم مزدحم لو غاب هذا الفحص؟
- `try`/`except Exception` حول `run_round(...)` يلتقط *أي* استثناء وينشر خطأً عامًا بدلًا من الانهيار. ما المقايضة بين الالتقاط الواسع في بوت طويل التشغيل وبين ترك خلل حقيقي يُنهي العملية بصخب؟

## ادعُ البوت والعب جولة حقيقية

باستخدام رابط OAuth2 الذي ولّدته في الإعداد (مع كلا النطاقين `bot` و`applications.commands`)، افتحه في متصفح واختر خادمًا تتحكم فيه — أنشئ خادم اختبار مجانيًا إذا لم يكن لديك واحد بالفعل.

```bash
uv run python bot.py
```

يجب أن ترى `Logged in as trivia-bot#1234 -- ready in 1 server(s).` مطبوعة. في خادم الاختبار، اكتب `/trivia` واختره من قائمة الإكمال التلقائي في Discord — مع `topic` أو بدونه. خلال بضع ثوانٍ يجب أن ترى السؤال منشورًا، وبعد الإجابة الصحيحة (أو ترك المؤقّت ينفد) الإجابة مكشوفة ولوحة المتصدّرين محدّثة. شغّل `/leaderboard` في أي وقت لفحص النقاط دون بدء جولة جديدة.

## ⚠️ مآزق شائعة

- **نسيان نية "Message Content" المميزة.** يجب تفعيلها في *مكانين* — `intents.message_content = True` في الكود، **و** المفتاح تحت Bot → Privileged Gateway Intents في بوابة المطوّرين. أُغفل مفتاح البوابة ويكون `message.content` بصمت سلسلة فارغة لكل رسالة، لذا لا يطابق `is_candidate_answer` أي ردّ مهما كُتب.
- **الخلط بين رمز البوت وسرّ عميل OAuth2.** تعرض بوابة المطوّرين كليهما في تبويبين مختلفين. رمز البوت (تبويب Bot) هو ما يحتاجه `client.run(...)`؛ سرّ العميل (تبويب OAuth2) لتدفق مصادقة مختلف تمامًا لا يستخدمه هذا المشروع أبدًا. لصق سرّ العميل في `DISCORD_BOT_TOKEN` يفشل في تسجيل الدخول بخطأ مربك.
- **عدم ظهور `/trivia` أبدًا في واجهة Discord.** عادةً أحد سببين: `tree.sync()` لم يُستدعَ أبدًا (أو لم يُنتظَر) في `on_ready`، أو وُلِّد رابط دعوة البوت قبل إضافة نطاق `applications.commands`. أعد توليد رابط الدعوة مع كلا النطاقين وأعد دعوة البوت إذا كان الثاني هو المشكلة.
- **حدود المعدل على المستوى المجاني للـLLM، أسوأ مع عدة جولات متتالية.** كل استدعاء `/trivia <topic>` طلب LLM منفصل ضد حصة مزوّدك المجانية، ويمكن لخادم مزدحم يشغّل عدة جولات متتالية أن يصطدم بها أسرع مما تتوقعه من الاختبار وحده. خطأ 429 ليس خللًا — أضف إعادة محاولة قصيرة مع تراجع حول `generate_question()`، أو ارجع إلى البنك الثابت عند فشل التوليد.
- **جولة لا تنتهي أبدًا لأن `remaining` لا يُعاد حسابه.** إذا نسخت حلقة الجولة لكنك استدعيت `client.wait_for(..., timeout=ROUND_TIME_LIMIT)` (الثابت) بدلًا من قيمة `remaining` المتناقصة، فإن كل تخمين خاطئ يعيد تشغيل الساعة فعليًا — يمكن أن تمتد الجولة أطول بكثير مما يعد به `ROUND_TIME_LIMIT` فعلًا.

## ما بنيته للتو

بوت Trivia حيّ على Discord بمصدرين للأسئلة — بنك ثابت وتوليد LLM مجاني حول أي موضوع — حلقة جولة كاملة بتوقيت حقيقي، ولوحة متصدّرين دائمة لكل لاعب تنجو من إعادة التشغيل. مصدر الأسئلة، والتسجيل، ومنطق الجولة (`questions.py`، و`generate.py`، و`scores.py`، و`round.py`) كلها Python عادي خالٍ من `discord`، مًختبرة بشكل مستقل قبل لمس أي قناة حيّة إطلاقًا؛ فقط `bot.py` يعرف بوجود Discord. هذا التقسيم يستحق وضعه في الاعتبار عمومًا: يمكن للوحدات الأربع نفسها أن تقف خلف بوت Slack، أو نموذج ويب، أو لعبة سطر أوامر بدلًا من ذلك، دون أي تغيير في أي منها.

## إلى أين تذهب من هنا

- أضف **وضع لعب متعدد الجولات** — `/trivia rounds:5` يشغّل عدة أسئلة متتالية ويعلن فائزًا إجماليًا في النهاية، بدلًا من سؤال واحد لكل أمر.
- تتبّع **وسوم الصعوبة أو الفئة** على الأسئلة المُولَّدة (اطلب من الـLLM تضمين وسم في استجابته JSON) ودع اللاعبين يختارون فئة عبر `/trivia topic:... difficulty:hard`.
- أضف **لوحة متصدّرين لكل خادم** بدلًا من `scores.json` عام واحد — مفتاح `scores.json` بـ`(guild_id, user_id)` بدلًا من `user_id` فقط، حتى لا يتشارك خادما Discord مختلفان يشغّلان هذا البوت لوحة متصدّرين.
- انشر البوت في مكان يبقى قيد التشغيل دون أن يعمل حاسوبك المحمول — آلة افتراضية صغيرة دائمة التشغيل، أو مستوى مجاني على منصة مثل Railway أو Fly.io — ليستمر في استضافة أمسيات Trivia حتى عندما لا تكون أمام جهازك.

## شارك مشروعك مع الصف

هل بنيت شيئًا تفتخر به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدّموها — وملف README الخاص به يحتوي شرحًا كاملًا صديقًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـPR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـgit.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓

<ProjectProgressCheckbox projectId="trivia-bot" />
