---
id: 2027-browser-automation-agent
title: "بناء وكيل أتمتة متصفح"
sidebar_label: "وكيل أتمتة متصفح"
slug: /projects/browser-automation-agent
description: "ادمج أتمتة متصفح Playwright مع وكيل نموذج لغوي مجاني يستدعي أدوات ويملأ استمارة ويب حقيقية للتدريب بمفرده."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 بناء وكيل أتمتة متصفح

<ProjectPublishedDate projectId="2027-browser-automation-agent" />

<ProjectGreeting />

كل مشروع آخر في هذا القسم إما يتحدث مع واجهة برمجية أو يقرأ ملفات محلية. هذا المشروع يقود متصفحًا فعليًا — ينقر، ويكتب، ويقرأ صفحة حقيقية — ثم يسلّم ذلك التحكم إلى وكيل نموذج لغوي، لكي يقرر *أي* حقل يملأ بـ*ماذا*، بدلًا من أن تُبرمج كل مُحدِّد (selector) يدويًا بنفسك. الخلفية المفترضة: Python 101، بالإضافة إلى بناء [مشروع وكيل الذكاء الاصطناعي](/docs/projects/ai-agent) مسبقًا — يعيد هذا المشروع استخدام نمط استدعاء الأدوات الخاص به (`deepagents`، مفتاح API من مستوى مجاني) ويضيف تحكمًا فعليًا بالمتصفح فوقه، لذا فهو ليس المكان المناسب للبدء بالوكلاء من الصفر.

هذا اختياري وغير مُقيَّم. راجع [مشاريع من العالم الحقيقي](/docs/projects) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. تثبيت [Playwright](https://playwright.dev/python/) لبايثون وثنائي متصفح Chromium فعلي.
2. كتابة سكربت مُبرمَج يدويًا يملأ استمارة تدريب حقيقية — ورؤية بالضبط كم هو هش.
3. تغليف قراءة الصفحة وملء الحقول كـ**أدوات** يمكن لوكيل نموذج لغوي استدعاؤها.
4. إعطاء الوكيل هدفًا بلغة إنجليزية بسيطة ("املأ هذه الاستمارة بهذه التفاصيل") وتركه يقرر أي حقول تُقابِل أي استدعاءات أدوات، ثم تشغيله من البداية للنهاية والتحقق من الإرسال الفعلي.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الذي تتبعه خطوات هذا الدرس، والطريقة الوحيدة الأمينة تمامًا لعمل هذا المشروع: يحتاج Playwright إلى ثنائي متصفح فعلي مُثبَّت ليقوده، وهذا يعني جهازًا حقيقيًا (أو افتراضيًا) بشاشة عرض حقيقية. يشرح قسم الإعداد أدناه كيفية تثبيت كل من `uv` وثنائي المتصفح ذاك.

**GitHub Codespaces** يعمل جيدًا هنا أيضًا، وهو بديل حقيقي بلا إعداد إذا كنت تفضّل عدم تثبيت أي شيء محليًا بعد: افتح [مستودع الدورة كاملًا في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython وuv مثبّتة بالفعل) وشغّل `uv run playwright install chromium` من طرفية في تبويب متصفحك — تثبيت المتصفح يعمل بنفس الطريقة تمامًا هناك كما على جهازك الخاص، والوضع الخفي (headless) لا يحتاج شاشة عرض فعلية في كلتا الحالتين.

**Google Colab وKaggle Notebooks وBinder غير مناسبة لهذا المشروع بالتحديد**، وتتخطى هذه الصفحة عمدًا نسخة دفتر ملاحظات بدلًا من فرض واحدة — يحتاج متصفح Playwright الفعلي إلى ثنائي متصفح حقيقي بالإضافة إلى عملية مستمرة يتحكم بها خطوة بخطوة، وهذا لا يتوافق بسلاسة مع نموذج خلايا دفتر الملاحظات عديمة الحالة وبلا نافذة متصفح محلية، كما تفعل استدعاءات `requests` في [مشروع scrape-analyze](/docs/projects/scrape-analyze). إذا أردت التجربة في دفتر ملاحظات على أي حال، فالنسخة الصادقة من ذلك **ليست** تحكمًا فعليًا بمتصفح على الإطلاق: حاكِ "صفحة" وهمية كقاموس Python بسيط لأسماء الحقول وأنواعها، وأعطِ الوكيل أدوات تقرأ/تكتب ذلك القاموس بدلًا من صفحة Playwright فعلية، واستخدمه لعرض *اتخاذ القرار* الخاص بالوكيل فقط — أي حقل يعتقد أنه يطابق أي معلومة — دون فتح أي متصفح فعلي في أي مكان. هذه طريقة مشروعة لاستكشاف منطق الخطوة 3 بمعزل، لكنها ليست هذا المشروع؛ عاملها كلعبة، لا كبديل عن الإعداد أدناه.

## الإعداد

### ثبّت `uv`

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

### أعِدَّ المشروع وثبّت ثنائي متصفح Playwright

```bash
uv init browser-automation-agent
cd browser-automation-agent
uv add playwright deepagents langchain-openai python-dotenv
uv run playwright install chromium
```

ذلك الأمر الأخير هو الخطوة التي يسهل نسيانها، والخاصة بـPlaywright تحديدًا: حزمة `playwright` التي ثبّتها للتو بـ`uv add` هي فقط مُشغِّل بايثون — لا تتضمن متصفحًا فعليًا. يقوم `playwright install chromium` بتنزيل بناء (build) حقيقية ومُثبَّتة الإصدار من Chromium (تطابق إصدار Playwright الدقيق الذي لديك) في ذاكرة تخزين مؤقت محلية يقودها الحزمة بعدها. تجاهله، وكل سكربت أدناه يفشل فورًا برسالة خطأ تخبرك بأن ملف متصفح تنفيذي مفقود.

:::tip[هذا هو Playwright الخاص ببايثون، وليس Playwright الخاص بـNode في هذا المستودع]
إذا تصفّحت مستودع هذه الدورة نفسه، فربما لاحظت أن `playwright` مُدرَجة بالفعل كتبعية تطوير لـNode في `package.json` الجذري — تلك النسخة أداة غير متعلقة يستخدمها هذا الموقع لاختباراته الخاصة من البداية للنهاية، المكتوبة بـJavaScript/TypeScript. **حزمة pip** `playwright` التي ثبّتها للتو بـ`uv add` مكتبة بايثون منفصلة تمامًا بتثبيتها الخاص، وذاكرتها المؤقتة الخاصة بالمتصفح، وواجهتها البرمجية الخاصة (`sync_playwright()`، وليس `require('playwright')`). يتشاركان اسمًا ومحرك أتمتة متصفح أساسيًا، لكن لا يؤثر أي تثبيت على الآخر، ولا تحتاج إلى تثبيت Node.js على الإطلاق لعمل هذا المشروع.
:::

### احصل على مفتاح API مجاني للذكاء الاصطناعي

**اختر المزوّد الذي تفضّله** — لا يتطلب أي منها بطاقة ائتمان وقت كتابة هذا.

| المزوّد | أين تحصل على مفتاح | لماذا قد تختاره |
|---|---|---|
| **GitHub Models** *(الافتراضي المقترح)* | [github.com/settings/tokens](https://github.com/settings/tokens) — رمز وصول شخصي بنطاق `models: read` | لا تسجيل منفصل — لديك حساب GitHub بالفعل. حدود مستوى مجاني أكثر سخاءً من Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | الخيار الأكثر ذكرًا شيوعًا؛ استُخدِم في مسودات سابقة من هذه الصفحة. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | استدلال سريع، مستوى مجاني سخي، بلا بطاقة. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | واحدة من أكثر الحصص المجانية الدائمة سخاءً. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | حجم رموز يومي مرتفع، بلا بطاقة. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | واجهة برمجة واحدة، نماذج مجانية عديدة — جيدة لمقارنة المزوّدين. |

نفس القاعدة كأي مشروع آخر هنا: **لا** تلصق أبدًا مفتاحًا مباشرة في الكود ولا ترفعه إلى مستودع — اضبطه كمتغيّر بيئة، أو ضعه في ملف `.env` محلي (لا ترفع ذلك أيضًا) وحمِّله بـ`python-dotenv`، تمامًا كمشروع وكيل الذكاء الاصطناعي.

```bash
# .env
GITHUB_TOKEN=مفتاحك-هنا
```

## الخطوة 1: سكربت مُبرمَج يدويًا، بلا نموذج لغوي بعد

قبل اللجوء إلى وكيل، اكتب النسخة البسيطة المصنوعة يدويًا — يستحق الأمر أن تشعر بالضبط بمدى هشاشتها قبل إصلاح تلك المشكلة. هدف هذا المشروع بأكمله هو [httpbin.org/forms/post](https://httpbin.org/forms/post)، استمارة "طلب بيتزا" صغيرة ومعروفة جيدًا ومستقرة، بُنيت خصيصًا لاختبار أدوات كهذه — بلا تسجيل دخول، بلا بيانات عملاء حقيقية، لا شيء خلف تصريح، وصندوق رمل عام وودود مع شروط الخدمة لاختبار الاستمارات استخدمه الطلاب والدروس التعليمية لسنوات.

أنشئ `scripted_fill.py`:

```python
from playwright.sync_api import sync_playwright

FORM_URL = "https://httpbin.org/forms/post"

ORDER = {
    "custname": "Ada Lovelace",
    "custtel": "555-0100",
    "custemail": "ada@example.com",
    "size": "medium",
    "topping": ["bacon", "cheese"],
    "delivery": "18:30",
    "comments": "Please ring the bell twice.",
}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False, slow_mo=250)
    page = browser.new_page()
    page.goto(FORM_URL)

    page.fill('input[name="custname"]', ORDER["custname"])
    page.fill('input[name="custtel"]', ORDER["custtel"])
    page.fill('input[name="custemail"]', ORDER["custemail"])
    page.check(f'input[name="size"][value="{ORDER["size"]}"]')
    for topping in ORDER["topping"]:
        page.check(f'input[name="topping"][value="{topping}"]')
    page.fill('input[name="delivery"]', ORDER["delivery"])
    page.fill('textarea[name="comments"]', ORDER["comments"])
    page.click('button[type="submit"]')

    page.wait_for_selector("pre")
    print(page.locator("pre").inner_text())
    browser.close()
```

شغّله:

```bash
uv run python scripted_fill.py
```

تظهر نافذة Chromium فعلية ومرئية (`headless=False`)، تكتب في كل حقل، وتُرسِل — يعيد httpbin البيانات المُرسَلة كـJSON، والذي يجب أن تراه مطبوعًا في طرفيتك.

الآن تخيَّل أن صاحب الاستمارة يعيد تسمية `custname` إلى `customer_name`، أو يضيف حقلًا مطلوبًا جديدًا. يتعطل هذا السكربت فورًا، دون أي فكرة عن *السبب* — لم ينظر إلى الصفحة أبدًا، بل أعاد فقط تشغيل سلسلة ثابتة من المُحدِّدات (selectors). تلك الهشاشة هي المشكلة الفعلية التي يحلّها هذا المشروع.

<StepChecklist>
  <StepChecklistItem>يفتح `uv run python scripted_fill.py` متصفحًا مرئيًا، ويملأ الاستمارة، ويطبع JSON المُرسَل.</StepChecklistItem>
  <StepChecklistItem>يمكنك الإشارة إلى اسم حقل واحد على الأقل أو مُحدِّد في السكربت سيتعطل بصمت لو تغيرت الاستمارة.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**: لو لم تكن تتحكم بالموقع المستهدف وغيّر استمارته غدًا، كيف كنت لتعرف حتى أن هذا السكربت تعطل، بخلاف تشغيله وقراءة الخطأ؟

## الخطوة 2: غلِّف المتصفح كأدوات

لا يمكن لوكيل نموذج لغوي استدعاء واجهة Playwright البرمجية في بايثون مباشرة — أدوات `deepagents` هي دوال بسيطة بوسائط بسيطة ومتوافقة مع JSON، نفس الشكل الذي رأيته في مشروع وكيل الذكاء الاصطناعي. إذًا حل هشاشة الخطوة 1 هو إعطاء النموذج مجموعة صغيرة وثابتة من *القدرات* بدلًا من سكربت ثابت، وتركه يقرر متى يستخدم كل واحدة.

أنشئ `browser_tools.py` (أو أضف هذا في أعلى `agent.py` — كلاهما يعمل):

```python
from playwright.sync_api import sync_playwright

class BrowserSession:
    def __init__(self, headless: bool = True) -> None:
        self._playwright = sync_playwright().start()
        self.browser = self._playwright.chromium.launch(headless=headless)
        self.page = self.browser.new_page()

    def close(self) -> None:
        self.browser.close()
        self._playwright.stop()

_session: BrowserSession | None = None

def _page():
    if _session is None:
        raise RuntimeError("No active browser session -- call navigate() first.")
    return _session.page

def navigate(url: str) -> str:
    """Open a URL in the browser. Always call this first."""
    _page().goto(url)
    return f"Navigated to {url}"

def read_form_fields() -> str:
    """List every form field on the current page: its name, type, and (for
    radio/checkbox groups) its available option values."""
    fields = _page().eval_on_selector_all(
        "input, textarea, select",
        "els => els.map(el => ({name: el.getAttribute('name'), "
        "type: el.getAttribute('type') || el.tagName.toLowerCase(), "
        "value: el.getAttribute('value')}))",
    )
    return "\n".join(f"- name={f['name']!r} type={f['type']} value={f['value']!r}" for f in fields)

def fill_text_field(name: str, value: str) -> str:
    """Type a value into a text-like field (text, email, tel, time, textarea) by its name."""
    _page().fill(f'[name="{name}"]', value)
    return f"Filled '{name}' with '{value}'"

def select_option(name: str, value: str) -> str:
    """Check a radio button or checkbox by its name and option value."""
    _page().check(f'input[name="{name}"][value="{value}"]')
    return f"Selected '{value}' for '{name}'"

def click_submit() -> str:
    """Click the form's submit button."""
    _page().click('button[type="submit"], input[type="submit"]')
    _page().wait_for_load_state("networkidle")
    return "Submitted."

def read_page_text() -> str:
    """Read back the visible text of the current page -- use this to verify what happened."""
    return _page().inner_text("body")[:2000]
```

لاحظ ما تغيّر من الخطوة 1: لا شيء هنا يذكر `custname` أو `size` أو أي حقل محدد. تكتشف `read_form_fields` أيًّا كانت الحقول الموجودة فعليًا في أي صفحة تشير إليها — الوكيل، لا هذا الكود، هو المسؤول عن مطابقة "اسم العميل" مع `name="custname"`.

<StepChecklist>
  <StepChecklistItem>يمكنك أن تشرح، في جملة واحدة، لماذا تأخذ دوال الأدوات هذه سلاسل نصية بسيطة (رابط، اسم حقل، قيمة) بدلًا من كائن `Page` من Playwright كوسيط.</StepChecklistItem>
  <StepChecklistItem>تُعيد `read_form_fields()` المُستدعاة يدويًا ضد صفحة حقيقية قائمة حقيقية بأسماء حقول الصفحة الفعلية — لا تخمينًا ثابتًا في الكود.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**: لا تقتطع `read_form_fields` شيئًا وتُعيد بنية الصفحة *الفعلية* إلى النموذج. ماذا يمكن أن يحدث خطأً لو وثقت بدلًا من ذلك بأن يخمّن النموذج أسماء الحقول دون استدعائها أبدًا؟

## الخطوة 3: أعطِ الوكيل هدفًا بلغة إنجليزية بسيطة

الآن اربط تلك الأدوات بوكيل `deepagents`، نفس نمط `create_deep_agent` من مشروع وكيل الذكاء الاصطناعي، وأعطه هدفًا بلغة عادية بدلًا من سكربت خطوة بخطوة:

```python
import os
from deepagents import create_deep_agent
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv()

model = ChatOpenAI(
    model="gpt-4o-mini",
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)

agent = create_deep_agent(
    model=model,
    tools=[navigate, read_form_fields, fill_text_field, select_option, click_submit, read_page_text],
    system_prompt=(
        "You are a browser-automation agent. Navigate to the given URL, call "
        "read_form_fields to see the real fields on the page, then map the given "
        "details onto the real field names and types you found -- never guess a "
        "field name read_form_fields didn't show you. Fill what you can confidently "
        "match, submit, then read the page back to confirm."
    ),
)

_session = BrowserSession(headless=False)
goal = (
    "Go to https://httpbin.org/forms/post and fill it out with these details: "
    "Customer name: Grace Hopper. Phone: 555-0199. Email: grace@example.com. "
    "Pizza size: large. Toppings: mushroom and cheese. Delivery time: 19:00. "
    "Comments: leave at the front desk. Then submit it."
)
result = agent.invoke({"messages": [{"role": "user", "content": goal}]})
print(result["messages"][-1].content)
_session.close()
```

شغّله وراقب نافذة المتصفح: يستدعي الوكيل `navigate`، ثم `read_form_fields`، ثم سلسلة من استدعاءات `fill_text_field`/`select_option` اختارها بنفسه — بترتيب اختاره بنفسه، مستخدمًا أسماء حقول قرأها من الصفحة الفعلية بدلًا من تلك التي أخبرته بها في نص الهدف.

<StepChecklist>
  <StepChecklistItem>تُظهر استدعاءات أدوات الوكيل (اطبع `result["messages"]` وابحث عن مدخلات استدعاء أداة `AIMessage`، تمامًا كتتبع مشروع وكيل الذكاء الاصطناعي) أنه يستدعي `read_form_fields` قبل أي استدعاء `fill_text_field`/`select_option`.</StepChecklistItem>
  <StepChecklistItem>غيّرت تفصيلًا واحدًا في الهدف بلغة إنجليزية بسيطة (مثل إضافة مختلفة) وأعدت تشغيله دون لمس كود الأدوات، وتغيّر الإرسال بناءً على ذلك.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**: يقول system prompt صراحة "لا تخمّن أبدًا اسم حقل لم تُظهره لك `read_form_fields`." لماذا تهم تلك التعليمة هنا أكثر مما كانت تهم للأدوات التجريبية في مشروع وكيل الذكاء الاصطناعي؟

## الخطوة 4: شغّله من البداية للنهاية وتحقق من الإرسال الفعلي

شغّل السكربت الكامل وتأكد أن الحلقة بأكملها عملت فعليًا، لا أنها فقط لم تتعطل:

```bash
uv run python agent.py
```

تحقق من نص الصفحة النهائي المطبوع (من `read_page_text`) مقابل ما يعيده httpbin فعليًا — يجب أن يكون كتلة JSON تحت `"form"` تحتوي كل قيمة طلبتها، مستخدمة أسماء الحقول الفعلية التي اكتشفها الوكيل، لا الأسماء بلغة إنجليزية بسيطة من هدفك.

<StepChecklist>
  <StepChecklistItem>يحتوي نص الصفحة النهائي الذي يعرضه الوكيل كل قيمة من هدفك، مطابقة بشكل صحيح للحقل الصحيح.</StepChecklistItem>
  <StepChecklistItem>شغّلته مرة ثانية بـ`headless=True` واكتمل دون نافذة مرئية، مؤكدًا أنه لا يعتمد سرًّا على مراقبتك له.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**: لو أرسل الوكيل الاستمارة بحقل خاطئ — لنقل، الإضافة الخاطئة — كيف كنت لتعرف، بخلاف قراءة نص التأكيد بنفسك؟ ماذا سيتطلب الأمر ليتحقق الوكيل من عمله بنفسه؟

:::tip[أتمتة المواقع التي لديك إذن بها فقط]
اختير `httpbin.org/forms/post` عمدًا لأنه أداة عامة بُنيت *لأجل* هذا النوع بالتحديد من التدريب — أتمتته متوقعة، لا انتهاك لأي شيء. هذا ليس صحيحًا لمعظم مواقع الويب. لا توجّه أبدًا كود أتمتة متصفح إلى صفحات تسجيل دخول، أو دفع، أو حساب في موقع إنتاج حقيقي دون إذن صريح من صاحب الموقع — تحظر شروط الخدمة لمعظم المواقع الإرسال الآلي للاستمارات، والاستخراج (scraping)، أو إجراءات الحسابات الجماعية، و"كانت الاستمارة قابلة للوصول علنيًا تقنيًا" ليس نفس "كان لديّ إذن بأتمتتها." عامِل هذا كما تعامل أي بيانات اعتماد أو حساب آخر: احصل على إذن صريح قبل أتمتة أهداف حقيقية غير تدريبية.
:::

:::tip[المُحدِّدات (selectors) عقد مع صفحة لا تتحكم بها]
كل استدعاء `page.fill(...)` و`page.check(...)` أعلاه يعتمد على عدم تغيّر HTML الفعلي للموقع المستهدف — سمة `name` أُعيدت تسميتها، `<div>` استُبدِل بـ`<button>` فعلي، أو استمارة أُعيد تصميمها يعطّل سكربتًا مُبرمَجًا يدويًا فورًا وبصمت. لهذا السبب بالضبط توجد أداة `read_form_fields` من الخطوة 2: وكيل *يقرأ* الصفحة قبل التصرف يتكيّف مع تغييرات صغيرة لا يستطيع سكربت مُبرمَج يدويًا التكيّف معها، رغم أنه ليس محصّنًا ضد صفحة تغيّر بنيتها أو معناها بالكامل.
:::

## ⚠️ مآزق شائعة

- **نسيان `uv run playwright install chromium`** — الفشل الأكثر شيوعًا. `uv add playwright` تثبّت فقط مُشغِّل بايثون؛ تخبرك رسالة الخطأ ("Executable doesn't exist...") بهذا بالضبط، لكن يسهل تفويتها في أول قراءة.
- **هشاشة المُحدِّدات (selectors)** — مُحدِّد مثل `input[name="custname"]` يعمل فقط لأن هذه هي السمة الفعلية في *هذه* الصفحة اليوم. نسخ المُحدِّدات من موقع إلى موقع مختلف، أو إعادة استخدامها بعد إعادة تصميم، هو المصدر الأكثر شيوعًا لسكربت "كان يعمل سابقًا."
- **الخلط بين الوضع الخفي (headless) ووضع الواجهة** — `headless=False` (نافذة مرئية) رائع للتطوير والتصحيح، لكنه أبطأ ويتطلب شاشة عرض حقيقية؛ `headless=True` (الافتراضي) هو ما تريده لأي شيء غير مُراقَب، مثل CI، لكنه يجعل تصحيح الفشل أصعب لأنك لا تستطيع مراقبته يحدث. بدِّل عمدًا، لا تتركه على الوضع الذي بدأت به.
- **التوقيت وحالات السباق** — النقر على إرسال قبل أن تنتهي صفحة من التحميل، أو قراءة نص الصفحة قبل اكتمال إعادة توجيه، ينتج فشلًا متقطعًا وصعب إعادة إنتاجه. توجد `wait_for_load_state` و`wait_for_selector` من Playwright، وانتظارها التلقائي المدمج في معظم الإجراءات، خصيصًا لتجنّب استدعاءات `time.sleep()` المصنوعة يدويًا، التي تُخفي أخطاء التوقيت بدلًا من إصلاحها.

## ما بنيته للتو

وكيل لا "يتحدث" فقط — بل يتخذ إجراءات حقيقية وقابلة للتحقق في متصفح فعلي، يقرر أيًّا من مجموعة صغيرة من القدرات يستخدم وبأي ترتيب، بناءً على ما يلاحظه فعليًا على الصفحة بدلًا من سكربت كتبته مسبقًا. هذه هي نفس حلقة استدعاء الأدوات من مشروع وكيل الذكاء الاصطناعي، لكن الآن لدى "الأدوات" آثار جانبية في العالم الحقيقي بدلًا من إعادة نص فقط، وهذا بالضبط شكل معظم وكلاء الأتمتة المفيدين فعليًا.

## إلى أين تذهب من هنا

- أضف أداة تعيد قراءة القيمة *المحددة* في حقل بعد ملئه (لا الصفحة بأكملها فقط)، لكي يتحقق الوكيل من كل عملية ملء قبل الانتقال إلى التالية، بدلًا من التحقق فقط في النهاية.
- جرّب استمارة بأنواع حقول أكثر — قائمة منسدلة `<select>`، استمارة متعددة الصفحات، حقل بتحقق فوري من جانب العميل — وانظر أي أدوات من الخطوة 2 تحتاج إلى التطور للتعامل معه.
- قارن هذا بـ[مشروع وكيل الذكاء الاصطناعي](/docs/projects/ai-agent): أدوات ذلك المشروع تعيد نصًا فقط دائمًا؛ هذه الأدوات تغيّر حالة المتصفح الفعلية. فكّر فيما تعنيه هذه الفروقات لمدى حرصك على اختبار مجموعة أدوات وكيل قبل الثقة به دون إشراف.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓

<ProjectProgressCheckbox projectId="2027-browser-automation-agent" />
