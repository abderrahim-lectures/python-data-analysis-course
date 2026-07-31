---
id: commit-message-agent
title: "بناء مولّد رسائل التزام Git"
sidebar_label: "بناء مولّد رسائل التزام Git"
slug: /projects/commit-message-agent
description: "ابنِ أداة CLI تقرأ فرق git diff staged حقيقيًا عبر subprocess، وتصيغ رسالة بأسلوب Conventional Commits بنموذج لغوي من مستوى مجاني، ولا تُثبِّت الالتزام إلا بعد موافقتك الصريحة."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 بناء مولّد رسائل التزام Git

<ProjectPublishedDate projectId="2027-commit-message-agent" />

<ProjectGreeting />

"wip"، "fix stuff"، "asdf" — كل مطوّر كتب رسالة التزام كسولة في السادسة مساء يوم جمعة. يبني هذا المشروع أداة CLI تزيل العذر: تلتقط `git diff` **staged** الفعلي الخاص بك عبر وحدة `subprocess` في Python، وتسلّمه إلى نموذج لغوي من مستوى مجاني مع system prompt مُصمَّم خصيصًا لكتابة رسائل بأسلوب Conventional Commits، وتُظهر لك مسودة يمكنك قبولها، أو تعديلها، أو تجاهلها — قبل أن يُثبَّت أي شيء. لا تلتزم الأداة أبدًا بنفسها؛ يؤكد إنسان دائمًا الرسالة النهائية أولًا.

هذا يفترض Python 101 وإلمامًا كافيًا بـgit لمعرفة ما يفعله `git add` و`git commit` — لا يُشترط أي شيء من تحليل البيانات. هذا اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/docs/projects) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. تثبيت `uv`، والحصول على مفتاح API لنموذج لغوي من مستوى مجاني، وإعداد مشروع صغير — كل ذلك في مكان واحد، قبل البدء بالبناء.
2. استخدام وحدة `subprocess` في Python لتشغيل `git diff --staged` فعليًا والتقاط مخرجاته كنص.
3. تصميم system prompt يحوّل نموذجًا لغويًا عامًا إلى صائغ مركّز لرسائل بأسلوب Conventional Commits.
4. بناء حلقة CLI تفاعلية: عرض المسودة، وتمكين المستخدم من قبولها، أو تعديلها، أو إعادة توليدها.
5. ربط الحلقة لكي تُشغِّل فعليًا `git commit -m "..."` — لكن فقط بعد موافقة صريحة من المستخدم.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي والموصى به هنا، أكثر من معظم المشاريع الأخرى في هذه السلسلة — فكرة هذه الأداة بأكملها تقوم على قراءة `git diff --staged` من مستودع git محلي حقيقي، وإن سمحت أنت، الالتزام فيه. هذا يعني أنها تحتاج إلى مجلد `.git` فعلي بتغييرات staged على القرص للعمل ضده (مشروعك الخاص، أو نسخة من مستودع هذه الدورة).

**GitHub Codespaces** يعمل جيدًا أيضًا: افتح [مستودع الدورة كاملًا في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython وuv وgit مثبّتة بالفعل) — إنه نسخة حقيقية بمكان حقيقي لوضع التغييرات في stage، لذا كل خطوة أدناه تعمل تمامًا كما تعمل محليًا.

**Google Colab وKaggle Notebooks طريقة معقولة *لتجربة* منطق الصياغة، لكن ليست لتشغيل الأداة فعليًا.** لا يوفر أي منهما افتراضيًا مستودع git محلي حقيقي بتغييرات staged، وفكرة هذه الأداة بأكملها هي صياغة رسالة لعملك الخاص *الجاري* — نظام الملفات المؤقت في دفتر الملاحظات لا يملك شيئًا من ذلك، ولا يوجد شيء منطقي لتثبيته فعليًا. يتجاوز دفتر الملاحظات أدناه هذا بصدق، بدلًا من التظاهر بأن الفجوة غير موجودة: فهو يستنسخ (`!git clone`) مستودع هذه الدورة نفسه داخل دفتر الملاحظات ويصيغ رسالة لالتزام تاريخي صغير وحقيقي منه باستخدام `git show`، لذا التقاط الفرق، وsystem prompt، واستدعاء النموذج اللغوي كلها تعمل مقابل مخرجات حقيقية وواقعية المظهر — الفرق فقط أنه يصيغ لالتزام مثالي ثابت، ويتوقف عند ذلك؛ **لا** يعرض الحلقة التفاعلية للقبول/التعديل/الالتزام، بما أن الالتزام له معنى فقط مقابل مستودع تعمل فيه فعليًا. استخدمه لرؤية منطق الصياغة يعمل من البداية للنهاية دون أي إعداد؛ وانتقل إلى `uv` محليًا أو إلى Codespace عندما تريد الأداة التفاعلية الكاملة موجَّهة إلى تغييراتك الفعلية الخاصة.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/commit-message-agent/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/commit-message-agent/notebook.ipynb)

## الإعداد

كل ما تحتاجه قبل كتابة أي سطر من الصائغ نفسه: Python فعلي، ومفتاح API مجاني، ومشروع صغير يحتوي كليهما.

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
uv init commit-message-agent
cd commit-message-agent
uv add openai python-dotenv
```

مكتبة عميل `openai` تعمل هنا مع كل مزوّد في الجدول أدناه، وليس OpenAI نفسها فقط — GitHub Models وGemini وGroq وMistral وCerebras وOpenRouter، كلها تعرض نقطة نهاية دردشة متوافقة مع OpenAI، لذا عميل واحد، موجَّه إلى `base_url` مختلفة، هو كل ما يحتاجه هذا المشروع. تتيح لك `python-dotenv` الاحتفاظ بمفتاح API في ملف `.env` محلي بدلًا من تنفيذ `export` في كل جلسة.

### احصل على مفتاح API مجاني لنموذج لغوي

**اختر المزوّد الذي تفضّله** — لا يتطلب أي منها بطاقة ائتمان وقت كتابة هذا، ولا تفضّل هذه الدورة أحدهم على الآخر. المثال الأوسع في مستودع الدورة ([`examples/commit-message-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/commit-message-agent)) يدعم الستة جاهزين للاستخدام، ويُختار بينهم بإعداد واحد.

| المزوّد | أين تحصل على مفتاح | لماذا قد تختاره |
|---|---|---|
| **GitHub Models** *(الافتراضي المقترح)* | [github.com/settings/tokens](https://github.com/settings/tokens) — رمز وصول شخصي بنطاق `models: read` | لا تسجيل منفصل — لديك حساب GitHub بالفعل. حدود مستوى مجاني أكثر سخاءً من Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | الخيار الأكثر ذكرًا شيوعًا؛ يعرض أيضًا نقطة نهاية متوافقة مع OpenAI، مُستخدَمة أدناه. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | استدلال سريع، مستوى مجاني سخي، بلا بطاقة. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | واحدة من أكثر الحصص المجانية الدائمة سخاءً. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | حجم رموز يومي مرتفع، بلا بطاقة. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | واجهة برمجة واحدة، نماذج مجانية عديدة — جيدة لمقارنة المزوّدين. |

أيًّا كان الذي تختاره، العملية واحدة:

1. سجّل الدخول وأنشئ مفتاح API على موقع ذلك المزوّد.
2. **لا تلصق هذا المفتاح أبدًا مباشرة في الكود ولا ترفعه إلى مستودع.** أنشئ بدلًا من ذلك ملف `.env` في مجلد مشروعك (لا ترفعه أبدًا):

```bash
# .env
LLM_PROVIDER=github
GITHUB_TOKEN=مفتاحك-هنا
```

مفتاح API سرّ، تمامًا مثل كلمة المرور — أي شخص يملكه يمكنه استخدام حصة حسابك. معاملته كمتغيّر بيئة بدلًا من نص ثابت مُضمَّن في الكود هي الممارسة القياسية لهذا السبب بالتحديد.

:::tip[ملف .env غالبًا أكثر ملاءمة من export]
بدلًا من تنفيذ `export` لمفتاح في كل جلسة طرفية جديدة، تقرأ `python-dotenv` ملف `.env` في مجلد مشروعك إلى `os.environ` تلقائيًا، في أول مرة يعمل فيها سكربتك — انظر `load_dotenv()` في الخطوة 1 أدناه.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>`uv --version` يطبع رقم إصدار.</StepChecklistItem>
<StepChecklistItem>`commit-message-agent/` موجود مع `pyproject.toml`، وحزمتا `openai` و`python-dotenv` مثبَّتتان.</StepChecklistItem>
<StepChecklistItem>لديك مفتاح API حقيقي من مزوّد واحد، محفوظ في ملف `.env` في مجلد مشروعك — غير مُلصَق في أي سكربت.</StepChecklistItem>
</StepChecklist>

## الخطوة 1: التقط فرق git في stage باستخدام `subprocess`

تُشغِّل وحدة `subprocess` في Python برنامجًا آخر وتلتقط مخرجاته كنص — هنا، ذلك البرنامج هو `git diff --staged`، لا `git diff` البسيط الذي قد تلجأ إليه أولًا. هذا خيار متعمَّد: يجب أن تصف رسالة الالتزام ما هو على وشك الالتزام به فعليًا، وهو ما وضعته في stage بـ`git add`، لا كل تغيير غير staged جالس في شجرة عملك.

أنشئ `commit_helper.py`:

```python
# commit_helper.py
import subprocess

from dotenv import load_dotenv

load_dotenv()  # reads .env into the environment, if present


def get_diff_staged() -> str:
    """The diff between the index (staged changes) and the last commit."""
    return _run_git(["diff", "--staged"])


def _run_git(args: list[str]) -> str:
    """Runs `git <args>` in the current directory and returns its stdout."""
    result = subprocess.run(
        ["git", *args],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)} failed:\n{result.stderr}")
    return result.stdout


if __name__ == "__main__":
    diff = get_diff_staged()
    print(diff if diff.strip() else "No staged changes. Stage something first with `git add`.")
```

`subprocess.run([...], capture_output=True, text=True)` هو السطر الأساسي: تمرير الأمر كـ**قائمة** من الوسائط (`["git", "diff", "--staged"]`) بدلًا من سلسلة نصية واحدة للشِل يتجنّب فئة كاملة من أخطاء اقتباس الشِل والحقن، و`capture_output=True` يلتقط stdout/stderr بدلًا من تركهما يُطبَعان مباشرة إلى طرفيتك، و`text=True` يفكّ ترميز تلك المخرجات كسلسلة نصية بدلًا من بايتات خام. `check=False` مع `if result.returncode != 0` يدويًا خيار متعمّد هنا بدلًا من `check=True`: يسمح لهذه الدالة برفع رسالة خطأ واضحة *خاصة بها* (تتضمن stderr الفعلي لـgit) بدلًا من `CalledProcessError` عام.

جرّبها ضد هذا المشروع نفسه — عدّل ملفًا، نفّذ عليه `git add`، ثم شغّل:

```bash
uv run python commit_helper.py
```

:::tip[هذا نفس نمط subprocess لأي مُغلِّف CLI آخر]
لا يهم `subprocess.run` أن يكون البرنامج المُشغَّل هو `git` — يعمل بشكل مطابق لأي أداة سطر أوامر: `ls`، سكربت شِل، برنامج Python آخر. بمجرد أن يترسّخ هذا النمط، يصبح "دَع Python يقود أداة CLI موجودة ويستخدم مخرجاتها" متاحًا لأكثر بكثير من git وحدها.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>تُعيد `get_diff_staged()` نص فرق حقيقي بعد تنفيذ `git add` على تغيير، وسلسلة فارغة عندما لا شيء في stage.</StepChecklistItem>
<StepChecklistItem>تشغيل `commit_helper.py` داخل مجلد ليس مستودع git على الإطلاق يرفع `RuntimeError` واضحًا، لا تتبّعًا مُربِكًا من أعماق `subprocess`.</StepChecklistItem>
<StepChecklistItem>يمكنك أن تشرح، بكلماتك الخاصة، لماذا تقرأ هذه الأداة `git diff --staged` بدلًا من `git diff` البسيط (التغييرات غير staged).</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لو نفّذت `git add` على ملف وتركت آخر مُعدَّلًا لكن غير staged، ماذا ستُظهر `get_diff_staged()`، وماذا سيُظهر `git diff` البسيط (بلا `--staged`) بدلًا من ذلك؟ لماذا تريد أداة رسائل الالتزام تحديدًا الأول؟
- ماذا سيُعيد `_run_git(["diff", "--staged"])` في مستودع بتغييرات غير مُثبَّتة كلها غير staged؟ لماذا يهم التعامل مع فرق فارغ، بدلًا من افتراض وجود شيء في stage دائمًا، لأداة يُفترَض تشغيلها كجزء من سير عمل التزام عادي؟

## الخطوة 2: صمِّم system prompt رسالة الالتزام

نموذج لغوي بلا تعليمات قد يكتب رسالة غامضة جدًا ("تحديث الكود")، أو مطوَّلة جدًا (فقرة كاملة لإصلاح خطأ إملائي بسطر واحد)، أو بلا أي تنسيق ثابت على الإطلاق. **system prompt** هو ما يحوّل نموذج دردشة عام إلى صائغ يتصرّف كصائن مشروع منضبط: أي تنسيق يستخدمه، وبأي نبرة يكتب، ومتى يكلّف نفسه عناء أكثر من سطر واحد.

```python
SYSTEM_PROMPT = """\
You are an experienced software engineer writing a git commit message for a
staged diff. You will be given a unified git diff. Base the message ONLY on
what the diff actually changes -- do not invent context you can't see, and
do not guess at a ticket number or issue reference that isn't in the diff.

Write the message in the Conventional Commits style:

    <type>(<optional scope>): <short summary, imperative mood, no period>

    <optional body: a few lines explaining WHY the change was made, not
    just restating what the diff shows -- wrap around 72 characters>

Valid types: feat, fix, docs, style, refactor, perf, test, build, ci, chore.
Pick the type that best matches the *dominant* change -- if a diff touches
both a fix and its test, "fix" usually still wins over "test".

Rules:
- The summary line must stay under 72 characters and use the imperative
  mood ("add", not "added" or "adds").
- Only include a body if it adds real information beyond the summary --
  for a small, self-explanatory diff, the summary line alone is enough.
- Never wrap the whole message in a fenced code block or add commentary
  before/after it -- output ONLY the commit message text itself, nothing
  else, so it can be used directly as a commit message.
"""
```

ثلاثة قرارات تصميمية متعمَّدة تستحق الملاحظة:

- **بنية ثابتة (`type(scope): summary`، جسم اختياري)** هي ما يجعل المخرجات قابلة للاستخدام كرسالة التزام فعلية، لا ردّ دردشة يصف الفرق بالصدفة — [Conventional Commits](https://www.conventionalcommits.org/) اتفاقية مستخدَمة على نطاق واسع تحديدًا لأن الأدوات (سجلات التغييرات، semantic-release، CI) يمكنها تحليلها بشكل موثوق.
- **"أدرج جسمًا فقط إذا أضاف معلومة حقيقية"** يمنع النموذج من حشو إصلاح خطأ إملائي بسطر واحد بثلاث جمل من محتوى فرق مُعاد ذكره — نفس الحدس الذي يملكه مراجع بشري عندما يرى رسالة التزام منتفخة لتغيير تافه.
- **"اِبنِ الرسالة فقط على ما يغيّره الفرق فعليًا... لا تخمّن رقم تذكرة"** موجودة لأن النماذج تختلق بسعادة `JIRA-1234` أو مرجع issue يبدو معقولًا إن لم تمنعه صراحة — مرجع مُختلَق في رسالة التزام أسوأ من عدم وجود مرجع على الإطلاق.

:::tip[كرِّر على الـ prompt كما تفعل مع الكود]
عامِل هذا الـ system prompt كمسودة أولى، لا مواصفة نهائية. شغّله ضد فرق تعرف مسبقًا أنه يستحق `type` محددًا (إضافة اختبارات خالصة، تغيير للتوثيق فقط، إصلاح خطأ حقيقي) — إذا اختار النموذج النوع الخاطئ أو أصبح الملخص طويلًا، شدِّد الصياغة وحاول مجددًا.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يمكنك أن تشرح، بكلماتك الخاصة، لماذا يحظر الـ prompt اختلاق رقم تذكرة أو مرجع issue غير موجود في الفرق.</StepChecklistItem>
<StepChecklistItem>يحدد الـ prompt تنسيق مخرجات ملموسًا (`type(scope): summary`، جسم اختياري)، لا مجرد "اكتب رسالة التزام."</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لو أزلت تعليمة "أدرج جسمًا فقط إذا أضاف معلومة حقيقية"، أي نوع من رسائل الالتزام تتوقع لفروق صغيرة جدًا وواضحة بذاتها؟
- يسرد الـ prompt عشرة أنواع صالحة من Conventional Commits. ما الذي سيسوء لأدوات سجل تغييرات مشروع حقيقي لو كان النموذج حرًّا في اختلاق أنواعه الخاصة بدلًا من الاختيار من قائمة ثابتة؟

## الخطوة 3: استدعِ النموذج اللغوي وابنِ الحلقة التفاعلية

اربط كود التقاط الفرق من الخطوة 1 وsystem prompt من الخطوة 2 معًا، ثم أضف الجزء الذي يجعل هذا أداة حقيقية بدلًا من سكربت لمرة واحدة: حلقة تعرض المسودة وتُمكِّن إنسانًا من قبولها، أو تعديلها، أو إعادة توليدها.

```python
# commit_helper.py (continued -- add these imports and functions)
import os

from openai import OpenAI

MAX_DIFF_CHARS = 12_000  # see the "huge diffs" pitfall below


def truncate_diff(diff: str, max_chars: int = MAX_DIFF_CHARS) -> str:
    """Cuts an oversized diff down to a size that fits a free-tier context window."""
    if len(diff) <= max_chars:
        return diff
    return diff[:max_chars] + f"\n\n... [diff truncated -- {len(diff) - max_chars} more characters not shown] ..."


def draft_commit_message(diff: str) -> str:
    """Sends a diff to the configured free-tier LLM and returns a drafted commit message.

    Returns a plain string. That's the whole job of this function -- it has
    no idea a terminal or a `git commit` call exists anywhere. See Step 4
    for the only place this tool actually commits.
    """
    if not diff.strip():
        return ""

    client = OpenAI(
        api_key=os.environ["GITHUB_TOKEN"],
        base_url="https://models.github.ai/inference",
    )
    diff = truncate_diff(diff)
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # confirm this still has a free tier before running
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Write a commit message for this staged diff:\n\n```diff\n{diff}\n```"},
        ],
    )
    return response.choices[0].message.content.strip()


def run_interactive_loop(diff: str) -> None:
    """Drafts a message and lets the user accept, edit, or regenerate it -- see Step 4
    for where (and only where) an accepted message actually gets committed."""
    if not diff.strip():
        print("No staged changes. Stage something first with `git add`.")
        return

    print(f"Drafting a commit message from {len(diff)} characters of staged diff...\n")
    message = draft_commit_message(diff)

    while True:
        print("-" * 60)
        print(message)
        print("-" * 60)
        choice = input("\nUse this message? [y]es / [e]dit / [r]egenerate / [n]o, cancel: ").strip().lower()

        if choice in ("n", "no"):
            print("Cancelled -- nothing was committed.")
            return
        if choice in ("r", "regenerate"):
            message = draft_commit_message(diff)
            continue
        if choice in ("e", "edit"):
            message = input("Type your edited message: ").strip() or message
            continue
        if choice in ("y", "yes"):
            print(f"\n(Would commit here with message:\n{message}\n)")
            return

        print("Please answer y, e, r, or n.")


if __name__ == "__main__":
    diff = get_diff_staged()
    run_interactive_loop(diff)
```

تُهم `truncate_diff` هنا أكثر مما قد يبدو للوهلة الأولى — انظر قسم المآزق أدناه لمعرفة لماذا فرق كبير ليس بطيئًا فقط، بل قد يفشل بصمت أو يُنتج رسالة سطحية وعامة. **لا** تستدعي الحلقة `git commit` عمدًا بعد — تضيف الخطوة 4 ذلك كدالة صغيرة خاصة بها وصريحة، لذا من الواضح تمامًا أين وكيف يحدث الالتزام.

شغّلها:

```bash
uv run python commit_helper.py
```

:::tip[تستخدم مزوّدًا مختلفًا؟]
استبدل كتلة `OpenAI(...)` بـ`base_url` ومفتاح مختلفين — مثل `base_url="https://api.groq.com/openai/v1"` مع `api_key=os.environ["GROQ_API_KEY"]` لـGroq، أو `base_url="https://generativelanguage.googleapis.com/v1beta/openai/"` مع `api_key=os.environ["GOOGLE_API_KEY"]` لنقطة نهاية Gemini المتوافقة مع OpenAI. كل شيء آخر في هذا الملف يبقى كما هو. انظر [`examples/commit-message-agent/commit_helper.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/commit-message-agent/commit_helper.py) في مستودع الدورة لرؤية الستة مُوصَّلين جنبًا إلى جنب، ويمكن اختيارهم بمتغيّر بيئة واحد.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يطبع `uv run python commit_helper.py` مسودة بأسلوب Conventional Commits لفرق staged حقيقي.</StepChecklistItem>
<StepChecklistItem>كتابة `r` عند المُوجِّه تسأل النموذج مجددًا وتطبع مسودة (ربما مختلفة)، دون فعل أي شيء آخر.</StepChecklistItem>
<StepChecklistItem>كتابة `n` تلغي بنظافة، وكتابة `e` تتيح لك كتابة رسالة بديلة قبل المتابعة.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تُعيد `draft_commit_message` مبكرًا بسلسلة فارغة عندما يكون الفرق فارغًا، قبل حتى بناء عميل `OpenAI`. لماذا يستحق التحقق أولًا، ثم استدعاء API، أن يُفعل عمدًا، بدلًا من ترك prompt فارغ يذهب ببساطة إلى النموذج؟
- لو أنتج تشغيلان مختلفان لـ`draft_commit_message` على *نفس* الفرق staged تمامًا رسالتين مختلفتين بوضوح، هل سيفاجئك ذلك؟ ما الذي يقترحه ذلك بشأن سبب وجود خيار `r` (إعادة التوليد) أصلًا، بدلًا من الثقة العمياء بالمسودة الأولى؟

## الخطوة 4: اربطها لكي تلتزم فعليًا — فقط عند التأكيد

القطعة الأخيرة: استبدل العنصر النائب "(كنت سألتزم هنا...)" من الخطوة 3 بدالة تُشغِّل فعليًا `git commit -m`، تُستدعى من مكان واحد بالضبط — مباشرة بعد أن يكتب المستخدم `y`.

```python
# commit_helper.py (continued)
def _commit(message: str) -> None:
    """Runs the actual `git commit -m <message>`.

    This is the ONLY function in this file that commits anything. It's only
    ever called from run_interactive_loop, only ever after an explicit 'y'
    from a human. There is no other code path that reaches it.
    """
    result = subprocess.run(
        ["git", "commit", "-m", message],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(f"git commit failed:\n{result.stderr}")
    print(result.stdout)
    print("Committed.")


def run_interactive_loop(diff: str) -> None:
    if not diff.strip():
        print("No staged changes. Stage something first with `git add`.")
        return

    print(f"Drafting a commit message from {len(diff)} characters of staged diff...\n")
    message = draft_commit_message(diff)

    while True:
        print("-" * 60)
        print(message)
        print("-" * 60)
        choice = input("\nUse this message? [y]es / [e]dit / [r]egenerate / [n]o, cancel: ").strip().lower()

        if choice in ("n", "no"):
            print("Cancelled -- nothing was committed.")
            return
        if choice in ("r", "regenerate"):
            message = draft_commit_message(diff)
            continue
        if choice in ("e", "edit"):
            message = input("Type your edited message: ").strip() or message
            continue
        if choice in ("y", "yes"):
            _commit(message)
            return

        print("Please answer y, e, r, or n.")
```

جرّب الحلقة الكاملة ضد تغيير حقيقي:

```bash
# make a small, real change
git add <the file you changed>
uv run python commit_helper.py
# read the draft, then type e to tweak it, r to try again, or y to commit for real
```

تحقق أن ذلك حدث فعليًا:

```bash
git log -1
```

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>كتابة `y` عند المُوجِّه تُنشئ فعليًا التزامًا حقيقيًا — يُظهر `git log -1` الرسالة التي قبلتها.</StepChecklistItem>
<StepChecklistItem>كتابة `n` عند المُوجِّه تترك تغييراتك في stage محفوظة وغير مُثبَّتة — لم يحدث شيء.</StepChecklistItem>
<StepChecklistItem>يمكنك الإشارة إلى سطر الكود الوحيد الذي يُستدعى فيه `git commit` فعليًا، وشرح لماذا يمكن الوصول إليه من مكان واحد بالضبط.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- `_commit` دالة صغيرة ومنفصلة بدلًا من أن تكون مُضمَّنة في فرع `y` من الحلقة. ما الذي يُسهِّله إبقاؤها منفصلة لو أردت لاحقًا تسجيل كل التزام حقيقي تُجريه هذه الأداة، أو إضافة علامة `--dry-run` تتخطاها تمامًا؟
- تخيَّل نسخة من هذه الأداة تتخطى مُوجِّه التأكيد وتلتزم تلقائيًا كلما بدت مسودة النموذج "واثقة." ما طريقة واقعية يمكن أن يسوء بها ذلك على فرق لم تراجعه بالكامل بنفسك قبل وضعه في stage؟

:::tip[لا تدع أداة تلتزم أبدًا دون أن يؤكد إنسان الرسالة أولًا]
هذا هو الدرس الأهم في هذا المشروع، أهم من أي سطر كود محدد: أداة *تصوغ* رسالة التزام مفيدة؛ أداة *تلتزم* واحدة بشكل مستقل شيء مختلف جدًا وأكثر خطورة بكثير — مسودة سيئة واحدة، أو فرق مُقتطَع أخفى التغيير الحقيقي، أو نموذج مرّ بيوم سيء، والآن يحمل التاريخ رسالة التزام لا تصف ما حدث فعليًا، وباسمك عليها. `_commit` هي الدالة الوحيدة هنا التي تلمس `git commit`، ولا يمكن الوصول إليها إلا بعد `y` صريحة. هذه ليست ميزة "التزام تلقائي" ناقصة — إنها التصميم. حافظ على ذلك الحد لو وسّعت هذا المشروع بنفسك.
:::

## ⚠️ مآزق شائعة

- **فروق ضخمة تتجاوز نافذة السياق أو حصة الرموز من المستوى المجاني.** فرق من عدة آلاف الأسطر (إعادة هيكلة كبيرة، ترقية تبعية مُدرَجة) قد يتجاوز ما يمكن للنموذج الانتباه إليه فعليًا، أو يتجاوز ببساطة حد الرموز لكل طلب في مستواك المجاني ويفشل مباشرة. تحد `truncate_diff` في الخطوة 3 من هذا، لكن الاقتطاع يعني أن النموذج يصوغ من رؤية جزئية — للتغييرات الكبيرة فعلًا، ضع في stage والتزم بقطع أصغر وأكثر منطقية بدلًا من الثقة بأن فرقًا مُقتطَعًا سينتج رسالة دقيقة.
- **وضع تغييرات غير مرتبطة في stage معًا.** لو التقط `git add` إصلاحين غير مرتبطين دفعة واحدة، لا يستطيع أي system prompt إنتاج رسالة التزام صادقة ومركّزة لكليهما — سيختار النموذج واحدًا ليصفه ويتجاهل الآخر، أو يكتب رسالة غامضة لا تغطي أيًّا منهما جيدًا. يستحق `git add -p` لوضع القطع في stage انتقائيًا أن تتعلمه جنبًا إلى جنب مع هذه الأداة.
- **معاملة المسودة كصحيحة دائمًا.** لا يعرف النموذج *لماذا* أجريت تغييرًا، فقط ما يُظهره الفرق — يمكنه أن يسيء تفسير النية (تسمية إعادة هيكلة متعمَّدة "fix"، مثلًا) بطرق لن يفعلها إنسان ينظر إلى نفس الفرق. قراءة المسودة قبل كتابة `y`، لا مجرد تصفحها سريعًا، هي الغاية الكاملة من خطوة التأكيد.
- **الالتزام بملفات مُولَّدة أو مُدرَجة (vendored) عن طريق الخطأ.** فرق يمسّ `uv.lock`، أو حزمة مُصغَّرة، أو ملف مُولَّد تلقائيًا يهدر رموزًا وعادة ينتج رسالة عامة منخفضة الجودة — راجع ما هو في stage (`git status`، `git diff --staged --stat`) قبل تشغيل الصائغ، لا بعده.

## ما بنيته للتو

أداة CLI حقيقية وعاملة لرسائل الالتزام: تلتقط `git diff` staged الفعلي الخاص بك عبر `subprocess`، وتصوغ رسالة بأسلوب Conventional Commits بنموذج لغوي مجاني موجَّه بـprompt مُصمَّم خصيصًا لهذه المهمة، ولا تُشغِّل `git commit` إلا بعد أن تقرأ المسودة وتقول نعم صراحة. لا شيء هنا محاكاة تجريبية — وجّهها إلى عملك الخاص في stage، أو إلى التزام تاريخي حقيقي من مستودع هذه الدورة نفسه، وستعمل ضد النص الفعلي في كلتا الحالتين.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/commit-message-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/commit-message-agent) في مستودع الدورة نسخة أكمل من الكود أعلاه، مع المزوّدين الستة من الجدول موصَّلين جنبًا إلى جنب (يُختارون بإعداد `LLM_PROVIDER` واحد) ومجموعة خيارات CLI `--dry-run`/`--commit`/`--stdin` مُضمَّنة بالفعل. استنسخه، أو افتح المستودع كاملًا في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وشغّله من هناك.
:::

## إلى أين تذهب من هنا

- اربط هذا كـ[اسم مستعار git](https://git-scm.com/book/en/v2/Git-Basics-Git-Aliases) حقيقي (مثل `git draft-commit = !uv run --project ~/commit-message-agent python commit_helper.py`) لكي يكون على بُعد أمر قصير في أي مستودع، بدلًا من الدخول دائمًا إلى مجلد هذا المشروع.
- أضفه كـprompt داخل خطّاف [pre-commit](https://pre-commit.com/) — بدلًا من استبدال `git commit` تمامًا، اجعل الخطّاف يطبع الرسالة المصوغة كـ*اقتراح* بجانب أي رسالة كتبها المطوّر بالفعل، لكي يبقى رأيًا ثانيًا لا بوابة.
- جرّب مقارنة المسودات بين مزوّدين مختلفين على *نفس* الفرق staged — هل يختاران نفس `type` من Conventional Commits؟ أين يختلفان، وماذا يخبرك ذلك عن مدى الثقة بقراءة نموذج واحد لـ"لماذا" جرى تغيير، مقابل مجرد "ماذا" تغيّر؟

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓

<ProjectProgressCheckbox projectId="2027-commit-message-agent" />
