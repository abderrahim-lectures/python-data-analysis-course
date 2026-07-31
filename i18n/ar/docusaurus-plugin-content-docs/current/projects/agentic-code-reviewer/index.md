---
id: agentic-code-reviewer
title: "بناء مُراجِع كود عامل (Agentic)"
sidebar_label: "بناء مُراجِع كود عامل"
slug: /projects/agentic-code-reviewer
description: "تخرّج من بيئة البرمجة في المتصفح إلى Python فعلي: ابنِ أداة CLI تقرأ فرق git diff حقيقيًا عبر subprocess وتطلب من نموذج لغوي من مستوى مجاني مراجعته كما يفعل إنسان."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 بناء مُراجِع كود عامل (Agentic)

<ProjectPublishedDate projectId="agentic-code-reviewer" />

<ProjectGreeting />

كل طلب دمج (pull request) يقرأه في النهاية مراجع بشري يبحث عن الأخطاء، ومشاكل الأسلوب، والاختبارات الناقصة، والأسماء المُربِكة — لكن قبل ذلك، هو مجرد نص: مخرجات `git diff`. يبني هذا المشروع أداة CLI تقوم بهذه المراجعة الأولى تلقائيًا: تلتقط فرقًا حقيقيًا (diff) باستخدام وحدة `subprocess` في Python، وتسلّمه إلى نموذج لغوي من مستوى مجاني مع system prompt مُصمَّم بعناية كمراجع، وتطبع ملاحظات منظَّمة وقابلة للتنفيذ — ليست "يبدو جيدًا" غامضة، بل مشاكل محددة تحمل ملفًا، وفئة، ودرجة خطورة، وإصلاحًا مقترحًا.

هذا يفترض إنهاء Python 101 وإلمامًا كافيًا بـ git لمعرفة ما يعرضه `git diff` — لا يُشترط أي شيء من تحليل البيانات. هذا اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/docs/projects) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. تثبيت `uv`، والحصول على مفتاح API لنموذج لغوي من مستوى مجاني، وإعداد مشروع صغير — كل ذلك في مكان واحد، قبل البدء بالبناء.
2. استخدام وحدة `subprocess` في Python لتشغيل `git diff` فعليًا والتقاط مخرجاته كنص.
3. تصميم system prompt يحوّل نموذج دردشة عام إلى مراجع كود مركّز ومنظَّم.
4. إرسال فرق (diff) إلى النموذج وطباعة ملاحظاته بتنسيق واضح وسهل القراءة.
5. تشغيل الأداة كاملةً مقابل فرق حقيقي — تغييراتك الخاصة غير المُثبَّتة (uncommitted)، والتزام (commit) محدد من الماضي من تاريخ مستودع هذه الدورة نفسها.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي والموصى به هنا، أكثر من معظم المشاريع الأخرى في هذه السلسلة — فكرة هذه الأداة بأكملها تقوم على تشغيل `git diff` مقابل مستودع git محلي حقيقي، وهذا يعني أنها تحتاج إلى مجلد `.git` فعلي على القرص للإشارة إليه (مشروعك الخاص، أو نسخة من مستودع هذه الدورة).

**GitHub Codespaces** يعمل جيدًا أيضًا: افتح [مستودع الدورة كاملًا في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython وuv وgit مثبّتة بالفعل) — إنه نسخة حقيقية بتاريخ حقيقي، لذا كل خطوة أدناه، بما فيها عرض "مراجعة التزام حقيقي من الماضي"، تعمل تمامًا كما تعمل محليًا.

**Google Colab وKaggle Notebooks وBinder طريقة معقولة *لتجربة* الأداة، لكن ليست لتشغيلها فعليًا.** لا يوفر أي منها افتراضيًا مستودع git محلي حقيقي بتاريخ التزامات، وفكرة هذه الأداة بأكملها هي مراجعة عملك الخاص *الجاري* — نظام الملفات المؤقت في دفتر الملاحظات لا يملك شيئًا من ذلك. يتجاوز دفتر الملاحظات أدناه هذا بصدق، بدلًا من التظاهر بأن الفجوة غير موجودة: فهو يستنسخ (`!git clone`) مستودع هذه الدورة نفسه داخل دفتر الملاحظات ويراجع التزامًا تاريخيًا صغيرًا وحقيقيًا منه باستخدام `git show`، لذا كل جزء من الأداة (التقاط الفرق عبر `subprocess`، وsystem prompt، واستدعاء النموذج اللغوي، والمخرجات المنظَّمة) لا يزال يعمل مقابل مخرجات حقيقية وواقعية المظهر — الفرق فقط أنه يراجع التزامًا مثاليًا ثابتًا بدلًا من شيء كتبته أنت شخصيًا. استخدمه لرؤية الأداة تعمل من البداية للنهاية دون أي إعداد؛ وانتقل إلى `uv` محليًا أو إلى Codespace عندما تريد توجيهها إلى تغييراتك الفعلية الخاصة.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/agentic-code-reviewer/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/agentic-code-reviewer/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fagentic-code-reviewer%2Fnotebook.ipynb)

## الإعداد

كل ما تحتاجه قبل كتابة أي سطر من المراجع نفسه: Python فعلي، ومفتاح API مجاني، ومشروع صغير يحتوي كليهما.

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
uv init agentic-code-reviewer
cd agentic-code-reviewer
uv add openai python-dotenv
```

مكتبة عميل `openai` تعمل هنا مع كل مزوّد في الجدول أدناه، وليس OpenAI نفسها فقط — GitHub Models وGemini وGroq وMistral وCerebras وOpenRouter، كلها تعرض نقطة نهاية دردشة متوافقة مع OpenAI، لذا عميل واحد، موجَّه إلى `base_url` مختلفة، هو كل ما يحتاجه هذا المشروع. تتيح لك `python-dotenv` الاحتفاظ بمفتاح API في ملف `.env` محلي بدلًا من تنفيذ `export` في كل جلسة.

### احصل على مفتاح API مجاني لنموذج لغوي

**اختر المزوّد الذي تفضّله** — لا يتطلب أي منها بطاقة ائتمان وقت كتابة هذا، ولا تفضّل هذه الدورة أحدهم على الآخر. المثال الأوسع في مستودع الدورة ([`examples/agentic-code-reviewer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/agentic-code-reviewer)) يدعم الستة جاهزين للاستخدام، ويُختار بينهم بإعداد واحد.

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
بدلًا من تنفيذ `export` لمفتاح في كل جلسة طرفية جديدة، تقرأ `python-dotenv` ملف `.env` في مجلد مشروعك إلى `os.environ` تلقائيًا، في أول مرة يعمل فيها سكربتك — انظر `load_dotenv()` في الخطوة 3 أدناه.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>`uv --version` يطبع رقم إصدار.</StepChecklistItem>
<StepChecklistItem>`agentic-code-reviewer/` موجود مع `pyproject.toml`، وحزمتا `openai` و`python-dotenv` مثبَّتتان.</StepChecklistItem>
<StepChecklistItem>لديك مفتاح API حقيقي من مزوّد واحد، محفوظ في ملف `.env` في مجلد مشروعك — غير مُلصَق في أي سكربت.</StepChecklistItem>
</StepChecklist>

## الخطوة 1: التقط فرق git باستخدام `subprocess`

تُشغِّل وحدة `subprocess` في Python برنامجًا آخر وتلتقط مخرجاته كنص — هنا، ذلك البرنامج هو `git` نفسه. هذا استخدام واقعي فعلًا لـ `subprocess`: أنت لا تحاكي شيئًا، بل تُشغّل نفس أمر `git diff` الذي كنت لتكتبه يدويًا، وتقرأ بالضبط ما كان سيطبعه في طرفيتك.

أنشئ `review.py`:

```python
# review.py
import subprocess


def get_diff_uncommitted() -> str:
    """الفرق بين شجرة العمل وآخر التزام -- التغييرات المُهيَّأة وغير المُهيَّأة."""
    return _run_git(["diff", "HEAD"])


def get_diff_against(ref: str) -> str:
    """الفرق بين شجرة العمل ومرجع آخر، مثل 'main'."""
    return _run_git(["diff", ref])


def get_diff_for_commit(commit: str) -> str:
    """الفرق الذي أدخله التزام محدد من الماضي، مقابل والده."""
    return _run_git(["show", commit])


def _run_git(args: list[str]) -> str:
    """يُشغّل `git <args>` في الدليل الحالي ويُعيد مخرجاته القياسية."""
    result = subprocess.run(
        ["git", *args],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)} فشل:\n{result.stderr}")
    return result.stdout


if __name__ == "__main__":
    diff = get_diff_uncommitted()
    print(diff if diff.strip() else "لا توجد تغييرات غير مُثبَّتة لمراجعتها.")
```

`subprocess.run([...], capture_output=True, text=True)` هو السطر الأساسي: تمرير الأمر كـ **قائمة** من الوسائط (`["git", "diff", "HEAD"]`) بدلًا من سلسلة نصية واحدة للشِل يتجنّب فئة كاملة من أخطاء اقتباس الشِل والحقن، و`capture_output=True` يلتقط stdout/stderr بدلًا من تركهما يُطبَعان مباشرة إلى طرفيتك، و`text=True` يفكّ ترميز تلك المخرجات كسلسلة نصية بدلًا من بايتات خام. `check=False` مع `if result.returncode != 0` يدويًا خيار متعمّد هنا بدلًا من `check=True`: يسمح لهذه الدالة برفع رسالة خطأ واضحة *خاصة بها* (تتضمن stderr الفعلي لـ git) بدلًا من `CalledProcessError` عام.

جرّبها ضد هذا المشروع نفسه — عدّل أي ملف، لا تُثبّته، ثم شغّل:

```bash
uv run python review.py
```

:::tip[هذا نفس نمط subprocess لأي مُغلِّف CLI آخر]
لا يهم `subprocess.run` أن يكون البرنامج المُشغَّل هو `git` — يعمل بشكل مطابق لأي أداة سطر أوامر: `ls`، سكربت شِل، برنامج Python آخر. بمجرد أن يترسّخ هذا النمط، يصبح "دَع Python يقود أداة CLI موجودة ويستخدم مخرجاتها" متاحًا لأكثر بكثير من git وحدها.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>تُعيد `get_diff_uncommitted()` نص فرق حقيقي عندما تملك تغييرات غير مُثبَّتة، وسلسلة فارغة عندما لا تملك.</StepChecklistItem>
<StepChecklistItem>تشغيل `review.py` داخل مجلد ليس مستودع git على الإطلاق يرفع `RuntimeError` واضحًا، لا تتبّعًا مُربِكًا من أعماق `subprocess`.</StepChecklistItem>
<StepChecklistItem>يمكنك أن تشرح، بكلماتك الخاصة، لماذا يُمرَّر الأمر كقائمة (`["git", "diff", "HEAD"]`) بدلًا من السلسلة الواحدة `"git diff HEAD"`.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- ماذا ستُعيد `_run_git(["diff", "HEAD"])` لمستودع git جديد تمامًا بالتزام واحد فقط ودون تغييرات غير مُثبَّتة؟ لماذا التعامل مع فرق فارغ، بدلًا من افتراض وجود شيء دائمًا لمراجعته، جزء من كتابة هذه الدالة بشكل صحيح؟
- `check=False` كان خيارًا متعمّدًا أعلاه. ماذا سيتغير بشأن الخطأ الذي يراه المُستدعي لو استخدمت `check=True` بدلًا من ذلك وتركت `subprocess.CalledProcessError` ينتشر دون معالجة؟

## الخطوة 2: صمِّم system prompt المراجعة

نموذج لغوي بلا تعليمات سيُنتج بسعادة "يبدو جيدًا!" لكل شيء تقريبًا — عديم الفائدة كمراجع. **system prompt** هو ما يحوّل نموذج دردشة عام إلى مراجع يتصرّف بثبات: ماذا يبحث، وماذا يتجاهل، وأي شكل يجب أن تأخذه إجابته.

```python
SYSTEM_PROMPT = """\
You are an experienced, pragmatic senior software engineer doing a code review.
You will be given a unified git diff. Review ONLY what the diff actually
changes -- do not comment on surrounding code you can't see, and do not
invent context that isn't in the diff.

For each issue you find, report:
- file and, if visible in the diff's @@ hunk header, the approximate line
- category: one of Bug, Style, Missing Test, Unclear Naming, Security, Other
- severity: Critical, Warning, or Suggestion
- a short, concrete explanation of the issue
- a specific suggested fix, not just "consider improving this"

Focus on:
- likely bugs (off-by-one errors, unhandled edge cases, wrong operators,
  mutated shared state)
- style inconsistencies with the surrounding code
- missing or clearly inadequate test coverage for the change
- unclear variable/function names that would confuse the next reader
- obvious security issues (secrets, injection, unsafe deserialization)

If the diff genuinely has no issues, say so plainly and briefly -- do not
invent problems just to have something to say. Never respond with just
"looks good" and nothing else; always state what you checked.

Format your response as a numbered list of issues (or a short "no issues
found, because ..." paragraph), not prose paragraphs.
"""
```

ثلاثة قرارات تصميمية متعمَّدة تستحق الملاحظة:

- **"راجِع فقط ما يغيّره الفرق فعليًا"** يمنع النموذج من اختلاق شكاوى تبدو معقولة عن كود لا يمكنه رؤيته فعليًا — يُظهر الفرق أسطرًا مُغيَّرة بالإضافة إلى سياق محيط قليل، لا الملف كاملًا.
- **بنية مطلوبة** (ملف، فئة، درجة خطورة، شرح، إصلاح) هي ما يحوّل الدردشة الحرة إلى شيء يمكنك التصرف بناءً عليه بسرعة فعلًا، نفس السبب الذي يجعل "LGTM مع تعليقين" من مراجع بشري أكثر فائدة من فقرة انطباعات غامضة.
- **تعليمة صريحة بالقول عندما لا شيء خاطئ** موجودة لأن النماذج تميل للمجاملة — بدون هذا السطر، تختلق بعض النماذج ملاحظات صغيرة لمجرد الظهور بمظهر شامل، مما يدربك على التوقف عن الثقة بمخرجات الأداة.

:::tip[كرِّر على الـ prompt كما تفعل مع الكود]
عامِل هذا الـ system prompt كمسودة أولى، لا مواصفة نهائية. شغّله ضد فرق تعرف مسبقًا أنه يحتوي خطأً محددًا — إذا فاته النموذج، أو انحرف تنسيق الإجابة، شدِّد الصياغة وحاول مجددًا. هندسة الـ prompt لمهمة مركّزة كهذه أقرب إلى كتابة مواصفة دقيقة جدًا من "الطلب بلطف".
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يمكنك أن تشرح، بكلماتك الخاصة، لماذا يخبر الـ prompt النموذج بأن يقول عندما لا يجد شيئًا خاطئًا، بدلًا من ترك ذلك دون ذكر.</StepChecklistItem>
<StepChecklistItem>يحدد الـ prompt بنية مخرجات ملموسة (ملف، فئة، درجة خطورة، شرح، إصلاح)، لا مجرد "أعطِ ملاحظات".</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لو أزلت تعليمة "راجِع فقط ما يغيّره الفرق فعليًا"، أي نوع من الأخطاء تتوقع أن يبدأ النموذج بارتكابه في فرق يغيّر سطرًا واحدًا فقط في منتصف دالة كبيرة؟
- يطلب الـ prompt درجة خطورة لكل مشكلة. ما الذي ستكون أداة مراجعة تُبلِّغ عن *كل* مشكلة بنفس الأهمية أسوأ فيه، مقارنةً بأداة تميّز بين Critical وSuggestion؟

## الخطوة 3: استدعِ النموذج اللغوي واطبع ملاحظات منظَّمة

اربط كود التقاط الفرق من الخطوة 1 وsystem prompt من الخطوة 2 معًا في مراجع يعمل فعليًا:

```python
# review.py (تابع -- أضف هذه الاستيرادات والدوال)
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()  # يقرأ .env إلى البيئة، إن وُجد

MAX_DIFF_CHARS = 12_000  # انظر مأزق "الفروق الضخمة" أدناه


def truncate_diff(diff: str, max_chars: int = MAX_DIFF_CHARS) -> str:
    """يقص فرقًا ضخمًا إلى حجم يناسب نافذة سياق من مستوى مجاني."""
    if len(diff) <= max_chars:
        return diff
    return diff[:max_chars] + f"\n\n... [تم اقتطاع الفرق -- {len(diff) - max_chars} حرفًا إضافيًا غير معروض] ..."


def review_diff(diff: str) -> str:
    """يرسل فرقًا إلى النموذج اللغوي المجاني المُعدّ ويُعيد مراجعته كنص."""
    if not diff.strip():
        return "لا توجد تغييرات لمراجعتها -- الفرق فارغ."

    client = OpenAI(
        api_key=os.environ["GITHUB_TOKEN"],
        base_url="https://models.github.ai/inference",
    )
    diff = truncate_diff(diff)
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # تأكد أن هذا لا يزال يملك مستوى مجانيًا قبل التشغيل
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Review this diff:\n\n```diff\n{diff}\n```"},
        ],
    )
    return response.choices[0].message.content


if __name__ == "__main__":
    diff = get_diff_uncommitted()
    print(f"مراجعة {len(diff)} حرفًا من الفرق...\n")
    print(review_diff(diff))
```

تُهم `truncate_diff` هنا أكثر مما قد يبدو للوهلة الأولى — انظر قسم المآزق أدناه لمعرفة لماذا فرق كبير ليس بطيئًا فقط، بل قد يفشل بصمت أو يحصل على مراجعة سطحية. لفّ الفرق في كتلة كود بعلامات ` ```diff ` في رسالة المستخدم، بدلًا من لصقه خامًا، إشارة صغيرة لكن حقيقية للنموذج عن نوع النص الذي ينظر إليه.

شغّله:

```bash
uv run python review.py
```

:::tip[تستخدم مزوّدًا مختلفًا؟]
استبدل كتلة `OpenAI(...)` بـ `base_url` ومفتاح مختلفين — مثل `base_url="https://api.groq.com/openai/v1"` مع `api_key=os.environ["GROQ_API_KEY"]` لـ Groq، أو `base_url="https://generativelanguage.googleapis.com/v1beta/openai/"` مع `api_key=os.environ["GOOGLE_API_KEY"]` لنقطة نهاية Gemini المتوافقة مع OpenAI. كل شيء آخر في هذا الملف يبقى كما هو. انظر [`examples/agentic-code-reviewer/review.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/agentic-code-reviewer/review.py) في مستودع الدورة لرؤية الستة مُوصَّلين جنبًا إلى جنب، ويمكن اختيارهم بمتغيّر بيئة واحد.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يطبع `uv run python review.py` قائمة مرقّمة من مشاكل حقيقية (أو رسالة واضحة "لم يُعثر على مشاكل") لفرق تعرف أنه يحتوي تغييرات.</StepChecklistItem>
<StepChecklistItem>كل مشكلة مُبلَّغ عنها تسمّي ملفًا وفئة، لا مجرد تعليق غامض.</StepChecklistItem>
<StepChecklistItem>تشغيله بفرق فارغ يطبع "لا توجد تغييرات لمراجعتها" بدلًا من إجراء أي استدعاء API على الإطلاق.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تُعيد `review_diff` مبكرًا بسلسلة ثابتة عندما يكون الفرق فارغًا، قبل حتى بناء عميل `OpenAI`. لماذا هذا الترتيب — التحقق أولًا، ثم استدعاء API — يستحق أن يُفعل عمدًا، بدلًا من ترك prompt فارغ يذهب ببساطة إلى النموذج؟
- لو أنتج تشغيلان مختلفان لـ `review_diff` على *نفس* الفرق تمامًا قائمتين مختلفتين من المشاكل، هل سيفاجئك ذلك؟ ما الذي يقترحه ذلك بشأن معاملة مخرجات هذه الأداة كقائمة تحقق تُثَق بها عمياء مقابل نقطة انطلاق لمراجعة بشرية؟

## الخطوة 4: شغّلها ضد فرق حقيقي، من البداية للنهاية

طريقتان واقعيتان لاستخدام هذه الأداة، تستحقان التجربة كلتاهما:

**1. راجِع تغييراتك الخاصة غير المُثبَّتة** — حالة الاستخدام اليومية. أجرِ تغييرًا صغيرًا ومتعمَّدًا في أي ملف (أدخل خطأً واضحًا عمدًا، إذا أردت اختبارًا واضحًا)، ثم:

```bash
uv run python review.py
```

**2. راجِع التزامًا محددًا من تاريخ هذه الدورة نفسها** — طريقة جيدة لرؤية الأداة تعمل على فرق حقيقي لم تكتبه أنت. أضف خيار CLI صغيرًا لتتمكن من توجيهها إلى أي التزام عبر تجزئته (hash):

```python
# review.py (تابع)
import argparse
import sys


def get_diff_for_commit(commit: str) -> str:
    """الفرق الذي أدخله التزام محدد من الماضي، مقابل والده."""
    return _run_git(["show", commit])


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="راجع فرق git بنموذج لغوي من مستوى مجاني.")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--against", metavar="REF", help="راجع الفرق مقابل REF، مثل 'main'.")
    group.add_argument("--commit", metavar="SHA", help="راجع التزامًا محددًا من الماضي.")
    group.add_argument("--stdin", action="store_true", help="اقرأ الفرق من stdin بدلًا من تشغيل git.")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    if args.stdin:
        diff = sys.stdin.read()
    elif args.commit:
        diff = get_diff_for_commit(args.commit)
    elif args.against:
        diff = get_diff_against(args.against)
    else:
        diff = get_diff_uncommitted()

    print(f"مراجعة {len(diff)} حرفًا من الفرق...\n")
    print(review_diff(diff))
```

استنسخ أو افتح مستودع هذه الدورة، ثم وجّه الأداة إلى التزام حقيقي من الماضي:

```bash
git log --oneline -10          # ابحث عن تجزئة (hash) التزام حقيقي لتجربته
uv run python review.py --commit <hash>
```

يمكنك أيضًا مقارنة فرعك الحالي بفرع آخر، أو تمرير فرق مباشرة عبر أنبوب (pipe) بدلًا من ترك السكربت يُشغّل `git` بنفسه — مفيد في مهمة CI تملك الفرق كملف بالفعل:

```bash
uv run python review.py --against main
git diff main | uv run python review.py --stdin
```

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يطبع `uv run python review.py --commit <تجزئة حقيقية>` ملاحظات حقيقية عن التغييرات الفعلية لذلك الالتزام.</StepChecklistItem>
<StepChecklistItem>ينتج كل من `uv run python review.py --against main` والتمرير عبر `--stdin` مخرجات منطقية في مستودع يحتوي أكثر من فرع واحد.</StepChecklistItem>
<StepChecklistItem>شغّلت الأداة على فرق كتبته أنت بنفسك على الأقل، وقرأت الملاحظات بعناية كافية لتوافقها أو تختلف معها.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- اختر التزامًا من تاريخ هذه الدورة الحقيقي وراجعه بأداتك. هل تطابق الملاحظات ما كنت تتوقع أن يقوله مراجع بشري عن ذلك التغيير؟ أين تساعد بوضوح، وأين تفوتها سياق كان سيمتلكه إنسان (مثل *سبب* إجراء التغيير)؟
- يسمح `--stdin` لشيء آخر بتوليد الفرق بدلًا من استدعاءات `subprocess` الخاصة بهذا السكربت. ما مثال على سير عمل حقيقي (تلميح: خط أنابيب CI، خطّاف pre-commit) حيث تهم هذه المرونة أكثر من الراحة؟

## ⚠️ مآزق شائعة

- **فروق ضخمة تتجاوز نافذة السياق أو حصة الرموز (tokens) من المستوى المجاني.** فرق من عدة آلاف الأسطر (إعادة هيكلة كبيرة، ترقية تبعية مُدرَجة) قد يتجاوز ما يمكن للنموذج الانتباه إليه فعليًا، أو يتجاوز ببساطة حد الرموز لكل طلب في مستواك المجاني ويفشل مباشرة. تحد `truncate_diff` في الخطوة 3 من هذا، لكن الاقتطاع يعني مراجعة جزئية — للتغييرات الكبيرة فعلًا، راجعها في قطع أصغر (ملف واحد أو التزام منطقي واحد في كل مرة) بدلًا من الثقة بأن مرورًا مُقتطَعًا رأى كل شيء.
- **مراجعة ملفات مُولَّدة أو مُدرَجة (vendored).** فرق يمسّ `uv.lock`، أو حزمة مُصغَّرة (minified bundle)، أو ملف هجرة مُولَّد تلقائيًا يهدر رموزًا على نص لم يكتبه أي إنسان ولا يحتاج تعليقًا عليه، وقد يُغرِق الملاحظات الحقيقية عن الملفات التي تهم فعلًا. صفِّها قبل استدعاء `git diff` (مثل `git diff -- . ':!uv.lock' ':!*.min.js'`) بدلًا من إرسال كل شيء.
- **الثقة المفرطة بمراجعة الذكاء الاصطناعي كبديل لمراجعة بشرية.** هذه الأداة مرور أول سريع، لا مراجع يملك سياقًا كاملًا عن المشروع، وقواعد الفريق، والقدرة على سؤالك *لماذا* أجريت تغييرًا. عامِل مخرجاتها كما تعامل تعليقات زميل سريع جدًا لكن قليل الخبرة نوعًا ما — تستحق القراءة، لا تستحق الدمج (merge) بناءً عليها وحدها.
- **عدم التعامل مع فرق فارغ أو مفقود.** تشغيل الأداة دون تغييرات غير مُثبَّتة ودون علامة `--commit`/`--against` ضد مستودع لا يوجد فيه شيء لمقارنته سينتج فرقًا فارغًا — العودة المبكرة لـ `review_diff` للمدخلات الفارغة (الخطوة 3) موجودة تحديدًا كي لا يتحول هذا إلى استدعاء API مُهدَر أو استجابة فارغة ومُربِكة من النموذج.

## ما بنيته للتو

أداة CLI حقيقية وعاملة لمراجعة الكود: تلتقط فرق git حقيقيًا عبر `subprocess` — نفس الأمر الذي كنت لتكتبه يدويًا — وتحوّله إلى ملاحظات منظَّمة وقابلة للتنفيذ من نموذج لغوي مجاني، موجَّهة بـ system prompt مُصمَّم خصيصًا لمراجعة الكود بدلًا من الدردشة العامة. لا شيء هنا محاكاة تجريبية: وجّهها إلى التزام حقيقي من تاريخ هذه الدورة نفسها، أو إلى عملك الخاص غير المُثبَّت، وستراجع النص الفعلي، لا مثالًا معلَّبًا.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/agentic-code-reviewer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/agentic-code-reviewer) في مستودع الدورة نسخة أكمل من الكود أعلاه، مع المزوّدين الستة من الجدول موصَّلين جنبًا إلى جنب (يُختارون بإعداد `LLM_PROVIDER` واحد) وخيارات `--against`/`--commit`/`--stdin` من الخطوة 4 مُضمَّنة بالفعل. استنسخه، أو افتح المستودع كاملًا في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وشغّله من هناك.
:::

## إلى أين تذهب من هنا

- أضف علامة `--severity-min` تُصفّي مخرجات النموذج لتُبقي فقط مشاكل `Critical` و`Warning` — مفيدة بمجرد أن تشغّل هذا على فروق أكبر وتريد الفرز بسرعة بدلًا من قراءة كل `Suggestion`.
- اربط هذا بخطّاف pre-commit أو مهمة GitHub Actions حتى يحصل كل pull request في مشاريعك الخاصة تلقائيًا على تعليق مراجعة أولى — خيار `--stdin` من الخطوة 4 هو بالضبط الشكل الذي تحتاجه مهمة CI (تملك الفرق بالفعل، مُولَّدًا بطريقة أخرى).
- جرّب مقارنة الملاحظات بين مزوّدين مختلفين على *نفس* الفرق — هل يُبلِّغان عن نفس المشاكل؟ أين يختلفان، وماذا يخبرك ذلك عن الاعتماد على مراجعة نموذج واحد كحقيقة مطلقة؟

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓

<ProjectProgressCheckbox projectId="agentic-code-reviewer" />
