---
id: mcp-server
title: "بناء خادم MCP"
sidebar_label: "بناء خادم MCP"
slug: /projects/mcp-server
description: "تخرّج من بيئة البرمجة في المتصفح إلى Python فعلي: ابنِ خادم بروتوكول سياق النموذج (MCP) يعرض أدواتك الخاصة، واربطه بعميل ذكاء اصطناعي حقيقي مثل Claude Desktop."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 بناء خادم MCP

<ProjectPublishedDate projectId="mcp-server" />

<ProjectGreeting />

[بروتوكول سياق النموذج](https://modelcontextprotocol.io) (MCP) هو طريقة معيارية يستدعي بها مساعد ذكاء اصطناعي كودًا وأدوات وبيانات تعيش خارجه. *خادم* MCP هو برنامج صغير تكتبه يعرض حفنة من الأدوات؛ و*عميل* MCP — Claude Desktop مثلًا — يتصل بذلك الخادم ويتيح للنموذج استدعاء تلك الأدوات نيابةً عنك، بنفس الطريقة التي يكون بها متصفح الويب عميلًا يتحدث مع خادم ويب. يبني هذا المشروع جانب الخادم: دوال Python الخاصة بك، مُسجَّلة كأدوات MCP، قابلة للاستدعاء من مساعد ذكاء اصطناعي حقيقي يعمل على جهازك الخاص.

هذا يفترض إنهاء Python 101 والارتياح لكتابة دوال عادية — لا يُشترط أي شيء من تحليل البيانات. إنه اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/docs/projects) للاطلاع على القائمة الكاملة، والتي تنمو باستمرار. يتناسب هذا المشروع طبيعيًا مع [مشروع وكيل الذكاء الاصطناعي](/docs/projects/ai-agent) — نفس الفكرة الجوهرية، منح الذكاء الاصطناعي أدوات يمكنه استدعاؤها، لكن من الجهة المقابلة: هناك بنيت الوكيل الذي يستدعي الأدوات مباشرة، في نفس عملية Python؛ هنا تبني خادمًا مستقلاً يستطيع *أي* عميل متوافق مع MCP الاتصال به، دون أن يحتاج ذلك العميل معرفة أي شيء عن كودك سوى البروتوكول.

MCP هو أحد الأنماط الأكثر تبنّيًا حاليًا لتوسيع مساعدي الذكاء الاصطناعي — يستحق أن تكون قد بنيته مرة، ولو نسخة مصغّرة، ما دام لا يزال بهذا الحداثة.

## 🎯 ما ستفعله

1. تثبيت `uv` وإعداد مشروع صغير بحزمة MCP الرسمية لـ Python.
2. كتابة خادم MCP يعرض أداتين من أدواتك الخاصة، باستخدام واجهة `FastMCP` من الحزمة.
3. تشغيل خادمك محليًا واختبار أدواته يدويًا بأداة MCP Inspector، قبل ربط أي عميل ذكاء اصطناعي حقيقي.
4. تسجيل خادمك مع مستوى Claude Desktop المجاني ومشاهدته يستدعي كودك فعليًا.

## أين تشغّل هذا

**محليًا بـ `uv`** هو المسار الأساسي والموصى به لهذا المشروع، أكثر من معظم المشاريع الأخرى في هذه السلسلة — كل الهدف هو ربط خادمك بـ Claude Desktop، وClaude Desktop تطبيق مُثبَّت على جهازك الخاص. لا مفرّ من فعل الخطوة الأخيرة على الأقل محليًا.

**GitHub Codespaces** مكان معقول لكتابة واختبار *منطق الأدوات نفسه*: افتح [مستودع الدورة كاملاً في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython وuv مثبّتون مسبقًا، وفق ملف `.devcontainer/devcontainer.json` الخاص بالمستودع)، اكتب `server.py`، واستدعِ دوال أدواتك مباشرة في واجهة Python، أو حتى شغّل `mcp dev server.py` واستخدم Inspector عبر المنفذ المُحوَّل الخاص بـ Codespace. ما لا يمكن لـ Codespace أن يكونه هو نقطة اتصالك النهائية بـ Claude Desktop — يعمل Claude Desktop على سطح مكتبك الخاص ويحتاج تشغيل عملية محلية يستطيع التحدث معها مباشرة؛ الوصول إلى Codespace منه يحتاج نفقًا (tunneling) إضافيًا خارج نطاق هذا المشروع. تعامل مع Codespaces كخيار جيد للخطوات 1-3، وأنجز الخطوة 4 محليًا.

**Google Colab وKaggle ليسا خيارًا مناسبًا لهذا المشروع**، على خلاف معظم المشاريع الأخرى في هذه السلسلة — تخطّهما هنا. لا يمنحك أيٌّ منهما عملية محلية مستمرة يستطيع عميل ذكاء اصطناعي على سطح المكتب الاتصال بها؛ خلية دفتر ملاحظات "تشغّل خادمًا" في Colab لا يمكن لـ Claude Desktop على جهازك الوصول إليها إطلاقًا.

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

ثم أعدّ مشروعًا وثبّت حزمة MCP الرسمية لـ Python، بإضافتها الاختيارية `cli` (هذا ما يمنحك أمر `mcp dev` المستخدم في الخطوة 3):

```bash
uv init mcp-server
cd mcp-server
uv add "mcp[cli]"
```

## الخطوة 2: اكتب أول خادم MCP خاص بك

واجهة الحزمة عالية المستوى، `FastMCP`، تحوّل دالة Python عادية إلى أداة MCP بمزخرِف (decorator) واحد — لا كود على مستوى البروتوكول تكتبه يدويًا. أنشئ `server.py`:

```python
# server.py
from pathlib import Path

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("course-tools")  # the name your AI client will show for this server

DOCS_DIR = Path.home() / "path" / "to" / "python-data-analysis-course" / "docs"  # adjust this


@mcp.tool()
def search_course_topics(query: str) -> str:
    """Search this course's lesson files for a topic and report which pages mention it.

    Looks through every .md file under docs/ for `query` (case-insensitive) and
    returns each matching file's name plus one line of context. Call this when
    someone asks whether, or where, a topic is covered in the course.
    """
    query_lower = query.lower()
    matches = []
    for path in sorted(DOCS_DIR.rglob("*.md")):
        for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
            if query_lower in line.lower():
                matches.append(f"{path.name}: \"{line.strip()[:120]}\"")
                break
        if len(matches) >= 5:
            break
    return "Found in:\n" + "\n".join(matches) if matches else f"No lesson pages mention '{query}'."


@mcp.tool()
def count_words(text: str) -> int:
    """Count the words in a piece of text, splitting on whitespace."""
    return len(text.split())


if __name__ == "__main__":
    mcp.run()
```

`@mcp.tool()` يقوم بكل عمل التسجيل هنا: يفحص اسم الدالة، ومعاملاتها المُنمَّطة (type-hinted)، وسلسلة توثيقها، ويبني منها تعريف أداة MCP تلقائيًا — لن تكتب مخططًا (schema) يدويًا أبدًا. هذه نفس الفكرة التي يعلّمها [مشروع وكيل الذكاء الاصطناعي](/docs/projects/ai-agent) لأدوات LangChain: **النموذج يقرأ سلسلة توثيقك، لا كودك، ليقرر متى تناسب أداة ما طلبًا معينًا.** سلسلة توثيق غامضة لا تمنح النموذج شيئًا يعتمد عليه؛ سلسلة توثيق تقول بوضوح ماذا تفعل الأداة ومتى تُستدعى هي ما يجعل اختيار الأداة يعمل فعليًا.

`search_course_topics` هي عمدًا نفس فكرة الأداة التجريبية من مشروع وكيل الذكاء الاصطناعي — البحث في ملفات هذه الدورة نفسها عن موضوع — لكنها معروضة عبر مزخرِف أداة MCP بدلاً من تمريرها مباشرة إلى قائمة `tools=[...]` لوكيل. `count_words` أداة مساعدة أصغر ومستقلة، أُدرجت لتوضيح خادم يعرض أكثر من أداة واحدة في آن واحد — يرى عميل MCP كلتيهما ويختار أيًّا منهما يناسب سؤالاً معينًا.

:::tip[تحقق من الوثائق الحالية لحزمة MCP قبل الاعتماد على هذا]
MCP مواصفة فتية وسريعة التطور — تغيّر البروتوكول نفسه، وواجهة حزمة Python الخاصة به، منذ الإصدارات الأولى. ظل أسلوب `FastMCP` القائم على المزخرِفات مستقرًا لفترة، لكن قبل بناء أي شيء يتجاوز هذا الدرس، تصفّح [ملف README الخاص بالحزمة ووثائقها](https://github.com/modelcontextprotocol/python-sdk) بدلاً من افتراض أن تفاصيل هذا المقتطف لا تزال تطابق تمامًا.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يُحفظ `server.py` دون أخطاء صياغية ويُعرِّف كلًّا من `search_course_topics` و`count_words`.</StepChecklistItem>
<StepChecklistItem>لكل أداة سلسلة توثيق حقيقية بلغة إنجليزية واضحة — لا عنصر نائب (placeholder).</StepChecklistItem>
<StepChecklistItem>يشير `DOCS_DIR` إلى مجلد `docs/` حقيقي موجود فعلاً على جهازك.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي**

- ماذا سيحدث لو كانت لأداتين لديك سلسلتا توثيق متشابهتان جدًا؟ كيف قد يختار النموذج بينهما، وماذا يوحي ذلك بشأن كتابة سلاسل التوثيق لخادم بأدوات كثيرة؟
- تُعيد `search_course_topics` سلسلة نصية، لا بيانات مُهيكلة. ماذا قد تخسر، أو تكسب، لو أعادت قائمة من التطابقات بدلاً من ذلك؟

## الخطوة 3: شغّل واختبر خادمك محليًا

قبل ربط هذا بأي عميل ذكاء اصطناعي حقيقي، شغّله بمفرده وتأكد أن الأدوات تعمل فعلاً. تشحن الحزمة أمر **تطوير/فحص** (dev/inspector) لهذا بالضبط:

```bash
uv run mcp dev server.py
```

يبدأ هذا خادمك ويفتح **MCP Inspector** — أداة مجانية قائمة على المتصفح تتيح لك استدعاء `search_course_topics` و`count_words` يدويًا، وتمرير معاملات اختبار، ومشاهدة القيم المُعادة الحقيقية، دون أي نموذج ذكاء اصطناعي مُتضمَّن إطلاقًا. (قد يطلب منك التشغيل الأول تثبيت حزمة وسيطة صغيرة قائمة على `npx` يستخدمها Inspector؛ اقبل ذلك.)

اختبر كلتا الأداتين هنا قبل المتابعة: استدعِ `search_course_topics` باستعلام تعرف أنه موجود في `docs/` (مثلًا `"groupby"`)، و`count_words` بجملة قصيرة. إن أساءت إحداهما التصرف، فأنت تنظر إلى خطأ في دالة Python الخاصة بك — أصلحه هنا، حيث الجزء المتحرك الوحيد هو كودك أنت، بدلاً من تصحيحه لاحقًا مع Claude Desktop في الحلقة، حيث قد تكون النتيجة الخاطئة بنفس السهولة مشكلة اتصال، أو خطأ إملائي في الإعداد، أو النموذج يختار الأداة الخاطئة.

يمكنك أيضًا تشغيل الخادم مباشرة، دون Inspector، للتأكد أنه يبدأ بسلاسة:

```bash
uv run python server.py
```

لن يطبع شيئًا من تلقاء نفسه — خادم MCP يجلس وينتظر اتصال عميل عبر stdio. الصمت هنا متوقَّع، لا خطأ؛ اضغط `Ctrl+C` لإيقافه.

:::tip[اختبر بـ Inspector قبل لمس عميل حقيقي]
من المغري القفز مباشرة إلى Claude Desktop. قاوم ذلك — يعزل Inspector كود أدواتك عن كل شيء آخر يمكن أن يخطئ في اتصال عميل حقيقي (مسارات الإعداد، إعادة التشغيل، اختيار النموذج نفسه للأداة). اجعل كلتا الأداتين تعملان هناك أولاً.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يبدأ `uv run mcp dev server.py` دون أخطاء ويفتح Inspector في متصفحك.</StepChecklistItem>
<StepChecklistItem>يُدرج Inspector كلًّا من `search_course_topics` و`count_words`.</StepChecklistItem>
<StepChecklistItem>استدعاء كل أداة يدويًا في Inspector يُعيد نتيجة حقيقية وصحيحة — لا خطأ.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي**

- لو أعادت `search_course_topics` خطأً بدلاً من نتيجة، كيف تستطيع معرفة ما إذا كان الخلل في كود Python الخاص بك أم في اتصال MCP نفسه؟ ماذا يمنحك الاختبار بـ Inspector أولاً هنا؟
- لماذا قد يكون مهمًا أن Inspector لا يحتاج أي نموذج ذكاء اصطناعي إطلاقًا لاختبار أدواتك؟

## الخطوة 4: اربطه بـ Claude Desktop

يدعم مستوى [Claude Desktop](https://claude.ai/download) المجاني الاتصال بخوادم MCP محلية. يقرأ ملف إعداد بصيغة JSON يخبره بأي الخوادم يشغّل وكيف:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

إن لم يكن الملف موجودًا بعد، أنشئه. أضف خادمك، باستخدام مسار **مطلق** إلى مجلد مشروعك:

```json
{
  "mcpServers": {
    "course-tools": {
      "command": "uv",
      "args": ["run", "--directory", "/absolute/path/to/mcp-server", "python", "server.py"]
    }
  }
}
```

يصف `command` و`args` بالضبط العملية التي سيشغّلها Claude Desktop للتحدث مع خادمك — نفس استدعاء `uv run` الذي اختبرته بالفعل في الخطوة 3، فقط يبدأه Claude Desktop بدلاً منك. استخدام `uv run` (بدلاً من `python` مجردة) مهم هنا: يشغّل Claude Desktop هذا الأمر في بيئته الخاصة، دون ضمان أن بيئة مشروعك الافتراضية نشطة بالفعل، ويجد `uv run` ويستخدم البيئة الصحيحة من تلقاء نفسه.

**أغلق Claude Desktop تمامًا وأعد تشغيله** — لا تعيد نسخة قيد التشغيل قراءة هذا الملف من تلقاء نفسها. بمجرد إعادة تشغيله، يجب أن يظهر خادمك في قائمة الأدوات/الموصِّلات الخاصة به (عادةً خلف أيقونة صغيرة قرب صندوق الرسائل). اسأله شيئًا يجب أن يُحفّز استدعاء أداة، مثل:

> هل تغطي دورة Python موضوع groupby؟ استخدم بحث course-tools إن كان متاحًا لديك.

يجب أن يُظهر Claude Desktop استدعاءه لـ `search_course_topics` (غالبًا ككتلة صغيرة قابلة للطي بعنوان "استخدم أداة" في المحادثة، مع ظهور المعاملات والنتيجة إن وسّعتها)، ثم يجيب باستخدام النتيجة الحقيقية التي أعادتها دالتك — لا تخمينًا من بيانات تدريب النموذج.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يظهر `course-tools` (أو اسم الخادم الذي اخترته) في قائمة أدوات/موصِّلات Claude Desktop بعد إعادة تشغيل كاملة.</StepChecklistItem>
<StepChecklistItem>طرح سؤال يجب أن يُحفّز `search_course_topics` يُظهر فعلاً أن Claude يستدعيها، لا مجرد الإجابة من الذاكرة.</StepChecklistItem>
<StepChecklistItem>النتيجة التي يعرضها Claude تطابق ما رأيته أثناء اختبار نفس الاستدعاء في Inspector.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي**

- يقرر Claude Desktop بمفرده ما إذا كان سيستدعي أداتك لرسالة معينة. ما الصياغة في سؤال اختبارك التي جعلت ذلك أكثر أو أقل احتمالًا، ولماذا برأيك؟
- لو طرحت سؤالاً لا علاقة له إطلاقًا بالدورة، هل تتوقع أن يستدعي Claude `search_course_topics` رغم ذلك؟ ماذا يخبرك ذلك عن كيفية تقرير النموذج فعليًا متى تكون الأداة ذات صلة؟

## ⚠️ أخطاء شائعة

- **مسار نسبي أو خاطئ في ملف الإعداد.** يحتاج `claude_desktop_config.json` مسارًا مطلقًا إلى مجلد مشروعك — المسار النسبي ليس له "دليل حالي" ثابت يُحلَّل بالنسبة إليه عندما يشغّل Claude Desktop خادمك، وسيفشل ببساطة في تشغيله.
- **نسيان إعادة تشغيل Claude Desktop بالكامل بعد تعديل الإعداد.** حفظ ملف JSON وحده لا يفعل شيئًا — يقرأه التطبيق فقط عند بدء التشغيل، لذا إغلاق وإعادة فتح نافذة ليس كافيًا أيضًا؛ أغلق التطبيق تمامًا أولاً.
- **سلسلة توثيق غامضة جدًا بحيث لا يستطيع النموذج اختيار الأداة الصحيحة.** لا تمنح `"""تفعل أشياء بالنص."""` النموذج شيئًا يطابقه بسؤال حقيقي. قل بوضوح ماذا تفعل الأداة، ومثاليًا، متى تُستدعى — تمامًا مثل سلسلة توثيق `search_course_topics` أعلاه.
- **تشغيل الخادم بـ `python server.py` مجردة بدلاً من `uv run python server.py`.** دون `uv run`، قد لا يكون المفسِّر الذي يبدأ هو نفسه الذي ثبّت فيه `uv add` حزمة `mcp`، وستحصل على `ModuleNotFoundError` لحزمة `mcp` رغم أن `uv add` قال بوضوح إنها ثُبِّتت بنجاح.

## ما بنيته للتو

أداتان صغيرتان مثال تجريبي، لكن الشكل حقيقي: عملية مستقلة تعرض دوال Python عبر بروتوكول معياري، قابلة للاتصال بأي عميل متوافق مع MCP دون أن يحتاج ذلك العميل معرفة أي شيء عن كودك سوى أسماء الأدوات ومعاملاتها وسلاسل توثيقها. هذا هو الهدف الفعلي من MCP — نفس الخادم الذي بنيته للتو سيعمل دون تعديل مع عميل MCP مختلف تمامًا، وهو ما لا ينطبق على قائمة `tools=[...]` المرتبطة بإحكام من مشروع وكيل الذكاء الاصطناعي.

## إلى أين من هنا

- امنح `search_course_topics` (أو أداة جديدة) وصولاً إلى شيء أكثر فائدة حقيقية من نص الدروس — ملف محلي صغير، مجموعة بيانات حقيقية، سكربت يشغّل حسابًا تحتاجه فعلاً.
- اقرأ عن **الموارد** (resources) و**المُوجِّهات** (prompts) في MCP — يغطي هذا الدرس *الأدوات* فقط، لكن البروتوكول يُعرِّف أيضًا طرقًا لعرض بيانات قابلة للقراءة (الموارد) وقوالب موجِّهات قابلة لإعادة الاستخدام (المُوجِّهات) لعميل ما. تغطي [وثائق الحزمة نفسها](https://github.com/modelcontextprotocol/python-sdk) كليهما، بنفس أسلوب مزخرِف `FastMCP`.
- بما أن المواصفة تتطور بنشاط، أعد التحقق دوريًا من [توثيق MCP الرسمي](https://modelcontextprotocol.io) بشأن أي شيء تغيّر منذ أن بنيت هذا — خيارات نقل جديدة وقدرات عملاء جديدة تصدر بوتيرة ثابتة.

:::tip[شغّل نسخة أوفى دون أي إعداد محلي — لمنطق الأدوات على الأقل]
[`examples/mcp-server/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/mcp-server) في مستودع الدورة نسخة أوفى قليلاً من الكود أعلاه، بربط `search_course_topics` بمجلد `docs/` الحقيقي للمستودع الذي تعمل فيه (لا مسار تعدّله يدويًا). استنسخها، أو افتح المستودع كاملاً في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، لتجربة كلتا الأداتين بـ `uv run mcp dev server.py` — مع تذكّر أن اتصال Claude Desktop الفعلي لا يزال يحتاج أن يحدث محليًا، وفق "أين تشغّل هذا" أعلاه.
:::

## شارك مشروعك مع الصف

بنيت شيئًا تفتخر به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع أرسلها طلاب آخرون — وملف README الخاص به يحتوي شرحًا كاملاً وودودًا للمبتدئين لإضافة مشروعك عبر **طلب سحب (pull request)**، حتى لو لم تستخدم git من قبل: عمل fork للمستودع، إنشاء فرع، تثبيت ملفاتك، وفتح طلب السحب، خطوة بخطوة. لا يُفترض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓

<ProjectProgressCheckbox projectId="mcp-server" />
