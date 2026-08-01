---
id: study-buddy-agent
title: "بناء وكيل اختبارات رفيق المذاكرة"
sidebar_label: "وكيل اختبارات رفيق المذاكرة"
slug: /projects/study-buddy-agent
description: "انتقل من ساحة اللعب داخل المتصفح إلى Python فعلي: ابنِ تطبيق طرفية يحوّل ملاحظات دراستك الخاصة إلى اختبار، باستخدام نموذج لغوي بمستوى مجاني لكتابة الأسئلة والحكم على إجاباتك."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 بناء وكيل اختبارات رفيق المذاكرة

<ProjectPublishedDate projectId="study-buddy-agent" />

<ProjectGreeting />

كل شيء في الدورة حتى الآن عمل في ساحة لعب معزولة داخل المتصفح — لذا استطعت البدء بكتابة Python من اليوم الأول دون أي إعداد. هذا المشروع هو خطوة التخرّج: ثبّت Python فعليًا على جهازك الخاص، ثم استخدمه لبناء أداة قد تستمر فعلًا في استخدامها لمادة مختلفة تمامًا — تطبيق اختبار يقرأ ملاحظات دراستك الخاصة، ويكتب أسئلة مبنية على ما هو موجود فعلًا فيها (لا تافهات عامة)، ويختبرك سؤالًا بسؤال في الطرفية، ويجعل نموذجًا لغويًا يحكم فيما إذا كانت إجابتك المكتوبة قريبة بما يكفي، مع تغذية راجعة موجزة في الحالتين.

هذا اختياري وغير مُقيَّم — مناسب جيدًا بمجرد أن تنهي Python 101؛ لا شيء من تحليل البيانات مطلوب. راجع [مشاريع من العالم الحقيقي](/docs/projects) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. ثبّت `uv` واحصل على مفتاح API لنموذج لغوي بمستوى مجاني.
2. حمّل أحد ملفات ملاحظاتك الخاصة وقرر كم منها تسلّمه للنموذج كسياق.
3. اكتب prompt يولّد أسئلة اختبار مبنية على ذلك النص تحديدًا، مع إجابة متوقعة يحتفظ بها البرنامج لنفسه.
4. ابنِ الحلقة التفاعلية: اطرح سؤالًا، خذ إجابتك المكتوبة، اجعل النموذج يحكم عليها ويقدّم تغذية راجعة.
5. تتبّع نتيجة متجمعة وأبلِغ عنها في النهاية.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الذي تتبعه خطوات هذا الدرس، والموصى به — إنه Python فعلي يعمل على جهازك الخاص، نفس خطوة "التخرّج إلى Python فعلي" كأي مشروع آخر في هذا القسم.

**GitHub Codespaces** بديل بلا إعداد إذا كنت تفضّل عدم تثبيت أي شيء محليًا بعد: افتح [مستودع الدورة كاملًا في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython و`uv` مثبّتة بالفعل، وفق `.devcontainer/devcontainer.json` الخاص بالمستودع) وشغّل نفس أوامر `uv` تمامًا من طرفية في تبويب متصفحك.

**Google Colab وKaggle Notebooks أو Binder** تعمل جيدًا أيضًا — هذا المشروع مجرد سكربت طرفية يستدعي واجهة برمجية مستضافة، لا GPU ولا حزمة محلية ثقيلة مشتركة. نسخة دفتر ملاحظات جاهزة للتشغيل موجودة في [`examples/study-buddy-agent/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/study-buddy-agent/notebook.ipynb) — تعكس نفس منطق `generate_questions()` / `judge_answer()` / `run_quiz()`، وتستخدم `input()` في خلية بنفس الطريقة التي ستستخدمها في طرفية، وتضمّن أحد ملفات الملاحظات النموذجية مباشرةً لذا تعمل دون حاجة إلى رفع ملف. أطلقها بأحد الشارات أدناه:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/study-buddy-agent/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/study-buddy-agent/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fstudy-buddy-agent%2Fnotebook.ipynb)

إنها طريقة أقل دقة لتجربة الأمر من مشروع محلي فعلي (لا بنية ملفات حقيقية، لا ملفات `.py` منفصلة)، لكنها طريقة معقولة لتجربة الفكرة بسرعة.

## الإعداد

كل ما تحتاجه قبل الخطوة 1 — تثبيت `uv`، وإنشاء المشروع، والحصول على مفتاح API — موجود هنا، كله مقدمًا، حتى تركز الخطوات أدناه على منطق الاختبار فقط.

### ثبّت uv

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

### أنشئ المشروع

```bash
uv init study-buddy-agent
cd study-buddy-agent
uv add openai python-dotenv
```

`uv init` ينشئ مشروعًا صغيرًا (`pyproject.toml` يتتبع تبعياتك) و`uv add` يثبّت الحزم في بيئة معزولة لذلك المشروع — دون إعداد بيئة افتراضية يدويًا. `openai` هي مكتبة العميل التي يستخدمها هذا الدرس (نماذج GitHub، المزوّد الافتراضي المقترح أدناه، تكشف عن واجهة برمجية متوافقة مع OpenAI)؛ `python-dotenv` تتيح لك إبقاء مفتاح API في ملف `.env` محلي بدلًا من تصديره عبر `export` في كل جلسة.

### احصل على مفتاح API مجاني لنموذج لغوي

**اختر أي مزوّد تفضّله** — لا يتطلب أي منها بطاقة ائتمان وقت كتابة هذا، ولا تفضّل هذه الدورة واحدًا على آخر. السكربت المثال في مستودع الدورة ([`examples/study-buddy-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/study-buddy-agent)) يستخدم نماذج GitHub افتراضيًا؛ التحويل إلى مزوّد آخر تغيير صغير وموثّق جيدًا.

| المزوّد | أين تحصل على المفتاح | لماذا قد تختاره |
|---|---|---|
| **نماذج GitHub** *(الافتراضي المقترح)* | [github.com/settings/tokens](https://github.com/settings/tokens) — رمز وصول شخصي بنطاق `models: read` | لا تسجيل منفصل — لديك بالفعل حساب GitHub. حدود مستوى مجاني أكثر سخاءً من حدود Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | الخيار الأكثر تداولًا. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | استدلال سريع، مستوى مجاني سخي، بلا بطاقة. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | واحدة من أكثر الحصص المجانية الدائمة سخاءً. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | حجم رموز يومي مرتفع، بلا بطاقة. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | واجهة برمجية واحدة، نماذج مجانية كثيرة — جيد لمقارنة المزوّدين. |

أيًا كان ما تختاره، العملية هي نفسها:

1. سجّل الدخول وأنشئ مفتاح API على موقع ذلك المزوّد.
2. **لا تلصق هذا المفتاح أبدًا مباشرةً في الكود أو تثبّته في مستودع.** ضعه في ملف `.env` بدلًا من ذلك:

```bash
# .env
GITHUB_TOKEN=your-key-here
```

يقرأ `python-dotenv` هذا الملف إلى `os.environ` تلقائيًا، نفس النمط المستخدم طوال مشروعي [وكيل الذكاء الاصطناعي](/docs/projects/ai-agent) و[تطبيق RAG](/docs/projects/rag-notes) لو نفّذت أيًّا منهما. مفتاح API سرّ، تمامًا مثل كلمة المرور — أي شخص يملكه يمكنه استخدام حصة حسابك.

:::tip[ملف `.env` غالبًا أكثر ملاءمة من export]
بدلًا من تصدير مفتاح عبر `export` في كل جلسة طرفية جديدة، ضعه في ملف `.env` داخل مجلد مشروعك (انظر `.env.example` في مثال المستودع) وحمّله بـ`load_dotenv()`، مُستدعاةً مرة واحدة قرب أعلى السكربت.
:::

مع `uv` و`openai` و`python-dotenv` ومفتاح في `.env`، اكتمل الإعداد — كل شيء من هنا منطق اختبار.

## الخطوة 1: حمّل ملاحظاتك واختر استراتيجية السياق

ضع ملف `.txt` أو `.md` من ملاحظات دراستك الخاصة في مكان ما داخل مشروعك — مجلد `notes/`، نفس اصطلاح [مشروع تطبيق RAG](/docs/projects/rag-notes)، مكان معقول. قراءته ليست جديدة عليك:

```python
from pathlib import Path

notes_text = Path("notes/cell-biology.txt").read_text(encoding="utf-8")
```

هنا قرار التصميم الذي يطلب منك هذا المشروع اتخاذه صراحةً، بدلًا من تخطّيه: **كم من ملاحظاتك يجب أن يرى النموذج فعلًا؟**

- **الخيار A — أطعم الملف كاملًا كسياق.** أبسط نهج ممكن: اقرأ ملفًا واحدًا، سلّم نصه بالكامل للنموذج في الـprompt، انتهى الأمر. يعمل هذا جيدًا ما دام ملف واحد يتسع براحة في نافذة سياق النموذج — بضعة آلاف من الكلمات ليست مشكلة إطلاقًا لأي نموذج مجاني حديث.
- **الخيار B — جزّئ، وضمّن، واسترجع**، تمامًا كما يفعل [مشروع تطبيق RAG](/docs/projects/rag-notes): اقسّم ملاحظاتك إلى قطع صغيرة، وضمّنها محليًا، واسترجع فقط الأكثر صلة لكل سؤال. يتوسع هذا ليشمل مجلد ملاحظات بعشرات الملفات الطويلة التي لن تتسع أبدًا في prompt واحد.

**يختار هذا الدرس الخيار A** وهو صريح بشأن المقايضة: إنه أقل قابلية للتوسع، لكنه أبسط درسًا كاملًا في الكتابة والقراءة وتصحيح الأخطاء — لا نموذج تضمين، لا بحث متجهي، لا خطوة بناء فهارس منفصلة، مجرد سلسلة نصية. تلك المقايضة تستحق أن تُسمّى بصوت عالٍ، نفس مبدأ التأسيس كمشروع تطبيق RAG في الحالتين: يجب أن يأتي سؤال الاختبار الجيد من نص أُعطي للنموذج فعلًا، لا من نص يخمّن أنه قد يكون ذا صلة من بيانات التدريب. لو تجاوزت ملاحظاتك ملفًا واحدًا، لا تخترع استرجاعًا من جديد — أعد استخدام `retrieve.py` من مثال مشروع تطبيق RAG وبدّل prompt الخطوة 2 لاستخدام قطع مُسترجَعة بدلًا من ملف كامل.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>لديك مجلد `notes/` فيه ملف `.txt`/`.md` حقيقي واحد على الأقل من ملاحظات دراستك الخاصة.</StepChecklistItem>
<StepChecklistItem>قراءة الملف وطباعة طوله تُظهر عدد أحرف حقيقيًا، لا `0` أو خطأ.</StepChecklistItem>
<StepChecklistItem>تستطيع أن تشرح، في جملة واحدة، لماذا يغذّي هذا الدرس الملف كاملًا للنموذج بدلًا من استرجاع قطع.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لو كان ملف ملاحظاتك بطول 50 صفحة بدلًا من صفحة واحدة، ما الذي سيفشل تحديدًا في الخيار A أولًا — خطأ، أو prompt مقتطع، أو شيء أكثر دهاءً مثل النموذج الذي يستخدم بداية الملف فقط فعلًا؟
- خطوة تقسيم مشروع تطبيق RAG موجودة لجعل كل قطعة مضمّنة *محددة*. هل فقدان التقسيم هنا يفقد تلك الخصوصية، أم أن تسليم النموذج الملف كاملًا يمنحه فعلًا *أكثر* ليعمل به؟ تحت أي ظروف يكون كل إجابة صحيحة؟

## الخطوة 2: ولّد أسئلة اختبار مبنية على ملاحظاتك

اطلب من النموذج عددًا ثابتًا من الأسئلة، كل واحد مقترنًا بإجابة متوقعة — وكن صريحًا في الـprompt أن كلاهما يجب أن يأتي من النص المحدد الذي تسلّمه، لا من المعرفة العامة بالموضوع:

```python
import json

GENERATE_PROMPT_TEMPLATE = """You are a study-buddy quiz generator. Read the
study notes below and write exactly {num_questions} quiz questions that can
ONLY be answered correctly by someone who has read THESE SPECIFIC notes --
not generic questions about the general subject. Base every question and
every expected answer strictly on facts stated in the text.

Reply with ONLY a JSON array, no other text, in this exact shape:
[
  {{"question": "...", "expected_answer": "..."}},
  ...
]

Study notes:
{notes_text}
"""

def generate_questions(notes_text: str, num_questions: int = 5) -> list[dict]:
    prompt = GENERATE_PROMPT_TEMPLATE.format(num_questions=num_questions, notes_text=notes_text)
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = response.choices[0].message.content.strip()
    raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return json.loads(raw)
```

تفصيلان يستحقان الملاحظة:

- **يُولَّد `expected_answer` الآن، لكنه لا يُعرض أبدًا على الطالب قبل إجابته.** يحتفظ البرنامج به في الذاكرة (في القاموس الذي تُرجعه `generate_questions`) فقط لكي يكون لدى الخطوة 3 شيء تحكم عليه لاحقًا — هذه نفس فكرة "مؤسَّس، لا مُخمَّن" كسياق مشروع تطبيق RAG المُسترجَع، لكن مستخدمةً للتحقق من إجابة بدلًا من كتابة واحدة.
- **طلب الرد بـJSON فقط ثم تحليله نمط هش لكنه شائع.** يلف النماذج أحيانًا إجابتهم في سياج كود ` ```json ` حتى عند إخبارهم بعدم ذلك — استدعاءات `removeprefix`/`removesuffix` أعلاه تجرّد ذلك قبل تشغيل `json.loads`. لو فشل التحليل مع ذلك، طباعة الاستجابة الخام قبل التحليل أسرع طريقة لرؤية ما عاد فعلًا.

:::tip[اطلب أسئلة أكثر مما تحتاج، لو كانت الجودة غير ثابتة]
النماذج المجانية الصغيرة تنتج أحيانًا سؤالًا غامضًا أو غريب الصياغة. لو لاحظت هذا على ملاحظاتك الخاصة، إصلاح بسيط دون أي كود جديد هو طلب بضعة أسئلة إضافية في الـprompt والاحتفاظ بأول `N` فقط — أو مجرد إعادة تشغيل التوليد، لأنه استدعاء API واحد.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>تُرجع `generate_questions(notes_text)` قائمة Python من قواميس، كل واحد بمفتاحي `"question"` و`"expected_answer"`.</StepChecklistItem>
<StepChecklistItem>قراءة اثنين من الأسئلة المولّدة، تشير بوضوح إلى تفاصيل من ملف ملاحظاتك، لا حقائق عامة عن الموضوع كان محرك بحث قادرًا على كتابتها.</StepChecklistItem>
<StepChecklistItem>تفهم لماذا يُولَّد `expected_answer` لكن لا يُطبع على الشاشة بعد.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لو سلّمت النموذج ملف ملاحظات عن موضوع يعرفه جيدًا أصلًا من التدريب (لنقل، البناء الضوئي الأساسي)، كيف ستُخبر هل سؤال مولَّد مؤسَّس فعلًا على *ملاحظاتك* مقابل معرفة النموذج السابقة؟ هل توجد طريقة لاختبار هذا؟
- ماذا سيحدث لجودة الأسئلة لو كان `notes_text` فارغًا أو مجرد جملة قصيرة واحدة؟ جرّبها — هل ينتج النموذج استجابة أنيقة أم شيئًا مكسورًا بوضوح؟

## الخطوة 3: ابنِ حلقة الاختبار التفاعلية

الآن الجزء الذي يجعل من هذا اختبارًا لا مجرد مولّد أسئلة: اطرح كل سؤال، اقرأ إجابة الطالب المكتوبة، واجعل النموذج يحكم عليها — لن تطابق الإجابات النص الحر الإجابة المتوقعة كلمة بكلمة، لذا مقارنة سلسلة دقيقة (`==`) ستصحّف كل شيء تقريبًا.

```python
JUDGE_PROMPT_TEMPLATE = """You are grading a student's quiz answer. Judge
whether the student's answer is correct, partially correct, or incorrect,
compared to the expected answer below -- the student won't phrase it
identically, so judge on meaning, not exact wording.

Question: {question}
Expected answer: {expected_answer}
Student's answer: {student_answer}

Reply with ONLY JSON, no other text, in this exact shape:
{{"verdict": "correct" | "close" | "incorrect", "feedback": "one brief, encouraging sentence"}}
"""

def judge_answer(question: str, expected_answer: str, student_answer: str) -> dict:
    prompt = JUDGE_PROMPT_TEMPLATE.format(
        question=question, expected_answer=expected_answer, student_answer=student_answer
    )
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = response.choices[0].message.content.strip()
    raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return json.loads(raw)


def run_quiz(questions: list[dict]) -> None:
    score = 0
    for i, item in enumerate(questions, start=1):
        print(f"\nQuestion {i}/{len(questions)}: {item['question']}")
        student_answer = input("Your answer: ").strip()

        result = judge_answer(item["question"], item["expected_answer"], student_answer)
        verdict = result.get("verdict", "incorrect")
        feedback = result.get("feedback", "")

        if verdict == "correct":
            score += 1
            print(f"✅ Correct! {feedback}")
        elif verdict == "close":
            score += 0.5
            print(f"🟡 Close. {feedback}")
        else:
            print(f"❌ Not quite. {feedback}")
            print(f"   Expected answer: {item['expected_answer']}")

    print(f"\nFinal score: {score}/{len(questions)}")
```

الحكم ثلاثي الاتجاه (`correct` / `close` / `incorrect`) أكثر تسامحًا عمدًا من صواب/خطأ ثنائي — طالب لديه الفكرة الصحيحة لكنه أخطأ تفصيلًا يحصل على درجة جزئية وتغذية راجعة مفيدة، بدلًا من "خطأ" مسطّحة لا تقول لماذا.

:::tip[input() تحجب التنفيذ حتى يضغط الطالب Enter]
`input("Your answer: ")` يوقف السكربت كله عند ذلك السطر حتى تكتب شيئًا وتضغط Enter — تمامًا مثل `input()` في Python 101، لكن الآن جالس داخل حلقة تحدث أيضًا استدعاءات شبكية قبل وبعد. لو بدا أن الطرفية معلقة بعد طباعة سؤال، فهذا طبيعي: إنها تنتظرك، لا تنتظر الـAPI.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>`run_quiz(questions)` تطبع سؤالًا واحدًا في كل مرة وتنتظر فعلًا إدخالًا مكتوبًا قبل المتابعة.</StepChecklistItem>
<StepChecklistItem>إجابة صحيحة عمدًا تُعلَّم صحيحة، وإجابة خاطئة عمدًا تُعلَّم خاطئة، مع عرض الإجابة المتوقعة.</StepChecklistItem>
<StepChecklistItem>إجابة صحيحة تقريبًا لكن ليست بنفس الصياغة (مثل إعادة صياغة) تحصل على حكم معقول، لا "incorrect" ظالمة.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لماذا تحكم باستدعاء LLM *ثانٍ* لكل سؤال بدلًا من طلب أن يولّد النموذج السؤال والإجابة المتوقعة *و*الحكم كلها في استدعاء واحد وقت توليد الاختبار؟ ما الذي سيُخطئه ذلك النهج، بما أن الطالب لم يجب بعد وقت التوليد؟
- حكم `"close"` يمنح نصف درجة. ما حالة يجب أن تكون إجابة الطالب فيها بوضوح "close" بدلًا من صحيحة تمامًا أو خاطئة تمامًا — وهل ستقع إجابتك الخاصة على سؤال حقيقي من ملاحظاتك هناك؟

## الخطوة 4: تتبّع النتيجة وشغّلها من البداية إلى النهاية

`run_quiz` أعلاه يتتبع `score` بالفعل أثناء تقدمه ويطبع سطر `score/total` نهائيًا بمجرد انتهاء الحلقة. اربط كل شيء معًا في `main()`:

```python
def main() -> None:
    notes_text = Path("notes/cell-biology.txt").read_text(encoding="utf-8")

    print("Generating questions...")
    questions = generate_questions(notes_text)
    print(f"Got {len(questions)} questions. Let's go!")

    run_quiz(questions)


if __name__ == "__main__":
    main()
```

شغّله:

```bash
uv run python study_buddy.py
```

يجب أن ترى توقفًا قصيرًا "Generating questions..." (استدعاء API واحد)، ثم خمسة أسئلة واحدًا تلو الآخر، كل واحد ينتظر إجابتك المكتوبة قبل المضي، وينتهي بسطر نتيجة نهائي مثل `Final score: 3.5/5`.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>`uv run python study_buddy.py` يعمل من البداية إلى النهاية: التوليد، ثم كل الأسئلة، ثم سطر نتيجة نهائي.</StepChecklistItem>
<StepChecklistItem>رقم النتيجة النهائية يطابق ما تتوقعه من إجاباتك الخاصة (صحيح = +1، قريب = +0.5، خطأ = +0).</StepChecklistItem>
<StepChecklistItem>تشغيله مجددًا على نفس ملف الملاحظات ينتج مجموعة *مختلفة* من الأسئلة — مؤكدًا أن التوليد ليس مُرمَّزًا كودًا ثابتًا أو مخزّنًا في ذاكرة تخزين مؤقت.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لو شغّلت السكربت كله مرتين متتاليتين على نفس ملف الملاحظات، هل تتوقع نفس الأسئلة الخمسة بالضبط في المرتين؟ لماذا أو لماذا لا، بالنظر إلى كيفية استدعاء `generate_questions` للنموذج؟
- الآن، استدعاء `judge_answer` سيئ (فشل تحليل، خطأ شبكي) سيعطّل الاختبار كله في منتصفه، مُضيّعًا تقدم الطالب في الأسئلة المتبقية. ما التغيير الأدنى في `run_quiz` الذي سيسمح للاختبار بالمتابعة بعد حكم سيئ واحد بدلًا من التوقف تمامًا؟

## ⚠️ مآزق شائعة

- **الملاحظات الرقيقة تنتج أسئلة رقيقة.** لو كان ملف ملاحظاتك مجرد بضع نقاط قصيرة، لدى النموذج القليل جدًا ليُرسي عليه خمسة أسئلة مميزة، وستحصل على أسئلة متكررة أو سهلة جدًا ("ما اسم...؟"). الملاحظات الأكثر تفصيلًا بنمط نصي تنتج أسئلة أفضل بشكل ملحوظ — هذا يعكس درس تقسيم مشروع تطبيق RAG: نص إدخال أفضل يعني نتيجة أفضل، لا prompt أذكى.
- **الحكم يمكن أن يكون صارمًا جدًا أو متساهلًا جدًا.** نموذج مجاني صغير يحكم على إجابات نص حر ليس أداة دقيقة — قد يعلّم إجابة صحيحة لكنها غريبة الصياغة كخطأ، أو يمرر إجابة تفتقد فعلًا تفصيلًا مفتاحيًا. لو لاحظت انحيازًا ثابتًا، شدّد صياغة `JUDGE_PROMPT_TEMPLATE` (مثل "الدرجة الجزئية تُحتسب فقط إذا كانت حقيقة محددة واحدة على الأقل صحيحة") بدلًا من محاولة الالتفاف حوله في Python.
- **حدود المعدل من استدعاءين لكل سؤال.** على عكس إجابة RAG بطلقة واحدة، يصنع هذا السكربت استدعاءين للنموذج *لكل سؤال* بحلول وقت إنهاء اختبار — واحد للتوليد (مرة واحدة، لكل اختبار) وواحد للحكم (مرة واحدة، لكل سؤال). اختبار من 5 أسئلة هو 6 استدعاءات إجمالًا؛ شغّل عدة اختبارات متتالية على مستوى مجاني وقد تصادف خطأ حد معدل 429. هذا ليس خطأً — انظر [مشروع وكيل الذكاء الاصطناعي](/docs/projects/ai-agent#التعامل-مع-حدود-المعدل) لنفس النمط ونهج إعادة محاولة يمكنك نسخه.
- **JSON مشوّه من النموذج يكسر `json.loads`.** حتى مع تعليمات صريحة "رد بـJSON فقط"، يضيف نموذج أحيانًا جملة شاردة قبل أو بعد الـJSON، أو يترك فاصلة زائدة. لو صادفت `JSONDecodeError`، اطبع الاستجابة الخام قبل تحليلها — يكفي ذلك دائمًا تقريبًا لترى بالضبط ما الخطأ وتعدّل الـprompt.

## ما بنيته للتو

خط أنابيب صغير لكنه كامل من "ولّد، ثم تفاعل، ثم صحّح": استدعاء LLM واحد يحوّل ملاحظاتك الخاصة إلى أسئلة مؤسَّسة بإجابات لا يراها إلا البرنامج، حلقة تجمع إجاباتك المكتوبة، واستدعاء LLM ثانٍ يحكم على كل واحدة بالمعنى لا بالصياغة الدقيقة، مع نتيجة متجمعة تُحتسب عبر الجلسة كلها. لم يُزوَّر أي شيء هنا في لعبة لا تعمّم — وجّهه إلى ملف ملاحظات مفيد فعلًا لمادة أخرى تأخذها، وسيصبح أداة دراسة حقيقية، لا مجرد تمرين دورة.

## إلى أين تذهب من هنا

- بمجرد أن يتوقف ملف ملاحظات واحد عن الكفاية — ملاحظات فصل دراسي كامل عبر ملفات كثيرة — أعد استخدام خط أنابيب [مشروع تطبيق RAG](/docs/projects/rag-notes) `prepare_notes.py`/`build_index.py`/`retrieve.py`: استرجع القطع الأكثر صلة لـ*موضوع* تريد أن تُختبر عليه، وأطعمها إلى `generate_questions` بدلًا من ملف واحد كامل.
- تتبّع الأسئلة الخاطئة عبر التشغيلات (اكتبها في ملف JSON صغير) وابنِ وضع "راجع نقاط ضعفي" الذي يعيد اختبارك تحديدًا على المواضيع التي أخطأت فيها سابقًا.
- أضف إعداد صعوبة إلى `GENERATE_PROMPT_TEMPLATE` ("أسئلة استرجاع سهلة" مقابل "أسئلة تتطلب ربط فكرتين من الملاحظات") وقارن كم يشعر الوضع الأصعب صعوبةً فعلًا.
- أعد النظر في محتوى `try`/`except` الإضافي من Python 101 — لف `judge_answer` بحيث لا ينهي استجابة مشوّهة واحدة الاختبار كله (انظر السؤال السقراطي في الخطوة 4) هو بالضبط ذلك النمط.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع قدّمها طلاب آخرون — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـPR، خطوة بخطوة. لا يُفترض أي خبرة سابقة بـgit.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓

<ProjectProgressCheckbox projectId="study-buddy-agent" />
