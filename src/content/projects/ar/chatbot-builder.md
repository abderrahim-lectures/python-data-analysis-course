---
title: "منشئ الشات بوت بدون كود"
description: "منشئ شات بوت بصري بالسحب والإفلات مع تدفقات محادثة وNLU ونشر متعدد القنوات."
difficulty: "beginner"
estimatedMinutes: 45
xpReward: 50
tags: ["Chatbots", "regex", "classes", "cli"]
prerequisites:
  - "أساسيات Python (متغيرات، حلقات، دوال، قواميس، صفوف)"
  - "تعبيرات نمطية أساسية"
learningObjectives:
  - "مطابقة مدخل المستخدم مع الأنماط باستخدام وحدة re"
  - "بناء نظام توليد ردود بقوالب وسياق"
  - "تتبع حالة المحادثة بصف"
  - "إعطاء الشات بوت شخصية ومزاجًا متسقين"
  - "معالجة المدخلات المجهولة ببدائل سلسة"
---

# منشئ الشات بوت

ابنِ شات بوت قائمًا على القواعد يميِّز التحيات والأسئلة والأوامر ، ويستجيب بشخصية، لا بيانات فقط. يشرح هذا المشروع مطابقة الأنماط بالتعبيرات النمطية، وتوليد الردود، وسياق المحادثة، وحلقة CLI نظيفة، كلها من المكتبة القياسية.

هذا اختياري وغير مُقيَّم. راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة.

## ما ستفعله

1. مطابقة مدخل المستخدم مع أنماط regex لتحديد النية.
2. بناء نظام توليد ردود بقوالب.
3. تتبع سياق المحادثة عبر دورات متعددة.
4. إضافة شخصية ومزاج إلى البوت.
5. معالجة المدخلات المجهولة ببدائل سلسة.
6. ربط كل شيء في حلقة دردشة تجمع الأجزاء معًا.

## أين تُشغّل هذا

- **محليًا باستخدام `uv` (موصى به).** يستخدم هذا المشروع المكتبة القياسية فقط ، لا حزم طرف ثالث ، لكن `uv` يُبقي بنية المشروع نظيفة. يشرح قسم الإعداد أدناه ذلك.
- **Google Colab أو Kaggle Notebooks.** الصق خلايا الكود مباشرة في دفتر. يعمل `input()` في مطالبات الدردشة، وإن كانت الحلقة تعمل أفضل في طرفية حقيقية.
- **ملعب JupyterLite.** الصق خلايا الكود مباشرة في دفتر ، حلقة الدردشة تعمل، لكن أبقِ الجلسات قصيرة إذ لا توجد طرفية مستمرة.

- **شغّله في المتصفح.** هناك دفتر ملاحظات تفاعلي جاهز ، افتحه على Colab أو Kaggle أو Binder وتابع خطوة بخطوة.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/chatbot-builder/notebook.ar.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/chatbot-builder/notebook.ar.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fchatbot-builder%2Fnotebook.ar.ipynb)

## الإعداد

`uv` أداة واحدة تستبدل سلسلة «ثبّت Python, ثم pip, ثم بيئة افتراضية» ، يستطيع تثبيت وإدارة إصدارات Python جنب تبعيات مشروعك.

**macOS / Linux** (طرفية):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

أغلق طرفيتك وأعد فتحها، ثم أكّد التثبيت:

```bash
uv --version
```

أنشئ المشروع:

```bash
uv init chatbot
cd chatbot
```

لا حزم لتضيفها ، يستخدم الشات بوت مكتبة Python القياسية فقط (`re`, `random`, `dataclasses`, `collections`).

## الخطوة 1 ، مطابقة مدخل المستخدم بالتعبيرات النمطية

مطابقة الأنماط هي كيف يكتشف البوت ما يعنيه المستخدم. قد يكتب المستخدم «Hello!» أو «hi» أو «hey there» أو «good morning» ، لكن النية خلفها جميعًا تحية واحدة. تجعلنا التعبيرات النمطية نطويها في نمط واحد.

### 1.1 عرّف أنماط النوايا

**👟 تلميح البداية :** أنشئ ملف `patterns.py` بقاموس يربط أسماء النوايا بقوائم أنماط regex. استخدم `re.IGNORECASE` كي تطابق «Hello» و«hello» و«HELLO» النمط ذاته.

```python
# patterns.py
"""Regex patterns that map user input to intents. Each intent maps to a list
of patterns — the first match wins."""

import re

INTENT_PATTERNS: dict[str, list[str]] = {
    "greeting": [
        r"\b(hi|hello|hey|howdy|hola|good\s*(morning|afternoon|evening))\b",
        r"^yo\b",
        r"^sup\b",
    ],
    "farewell": [
        r"\b(bye|goodbye|see\s*ya|later|quit|exit|done)\b",
        r"^cya\b",
    ],
    "time": [
        r"\bwhat\s*time\s*is\s*it\b",
        r"\btell\s*me\s*the\s*time\b",
        r"\bcurrent\s*time\b",
    ],
    "date": [
        r"\bwhat('s|\s+is)\s*(the\s*)?date\b",
        r"\btoday('s|\s+is)\s*date\b",
        r"\bwhat\s*day\s*is\s*it\b",
    ],
    "name": [
        r"\bwhat('s|\s+is)\s*your\s*name\b",
        r"\bwho\s*are\s*you\b",
        r"\bwhat\s*should\s*I\s*call\s*you\b",
    ],
    "help": [
        r"\bhelp\b",
        r"\bwhat\s*can\s*you\s*do\b",
        r"\bcommands\b",
    ],
    "mood": [
        r"\bhow('re|\s+are)\s*you\b",
        r"\bhow\s*do\s*you\s*feel\b",
        r"\bhow('s|\s+is)\s*it\s*going\b",
    ],
    "thanks": [
        r"\bthanks?\b",
        r"\bthank\s*you\b",
        r"\bcheers\b",
    ],
    "question": [
        r"\b(tell\s*me\s*about|what\s+is|what\s+are|who\s+is|who\s+are|"
        r"where\s+is|where\s+are|when\s+is|why\s+do|how\s+do|how\s+does)\b",
    ],
}
```

**🎯 الناتج المتوقع :** يجب أن يعمل الاستيراد وفحص الأنماط هكذا:

```python
from patterns import INTENT_PATTERNS

def classify(text: str) -> str | None:
    for intent, pattern_list in INTENT_PATTERNS.items():
        for pattern in pattern_list:
            if re.search(pattern, text, re.IGNORECASE):
                return intent
    return None

print(classify("hello there"))
print(classify("what time is it"))
print(classify("purple elephant"))
```

يجب أن يطبع:

```
greeting
time
None
```

**🩹 إذا لم يعمل :** إذا أعاد كل مدخل `None`، فنسيت `re.IGNORECASE` ، «Hello» لن تطابق `r"\bhi\b"` حين يكون التعبير النمطي حساسًا للحالة ويُستهل الحرف الأول بحرف كبير. إذا طابقت `greeting` كلمة «good morning» لا «goodnight»، فتحقق أن goodnight ليست في قائمة وداعك أو نمط تحية ، إنها ليست سلسلة فرعية من النمط `good\s*(morning|afternoon|evening)`.

### 1.2 تعامل مع مجاميع التعبيرات النمطية للبيانات المستخرجة

بعض الأنماط تحتاج سحب معلومات، لا مطابقة فقط. قد يريد نمط التحية معرفة *أي* تحية استُخدمت، وتحتاج أنماط الوقت/التاريخ العمل مهما كانت الصياغة.

**👟 تلميح البداية :** أضف دالة `classify_with_matches` تعيد النية وأي مجاميع مقتنصة من التعبير النمطي معًا:

```python
import re
from dataclasses import dataclass

@dataclass
class MatchResult:
    intent: str
    matched_text: str
    groups: tuple

def classify_with_matches(text: str) -> MatchResult | None:
    for intent, pattern_list in INTENT_PATTERNS.items():
        for pattern in pattern_list:
            m = re.search(pattern, text, re.IGNORECASE)
            if m:
                return MatchResult(
                    intent=intent,
                    matched_text=m.group(0),
                    groups=m.groups(),
                )
    return None
```

**🎯 الناتج المتوقع:**

```python
result = classify_with_matches("good evening!")
print(result.intent, result.matched_text, result.groups)

result = classify_with_matches("what's your name")
print(result.intent, result.matched_text, result.groups)
```

يجب أن يطبع:

```
greeting good evening ('evening',)
name what's your name ()
```

**🩹 إذا لم يعمل :** إذا كانت `groups` هي `()` عند توقعك التقاطًا، فالأقواس في تعبيرك النمطي مجاميع غير مقتنصة ، استخدم `(...)` لا `(?:...)` للمجاميع التي تريد استخراجها. إذا كانت `matched_text` فارغة، فقد وجد `re.search` مطابقة عند الموضع 0 لكن حد الكلمة `\b` يجرّد المطابقة ، حاول إزالة مثبتات `\b` من النمط المحدد.

### 1.3 تحقّق من المصنّف

**✅ قائمة التحقق**

- ✅ يربط `INTENT_PATTERNS` أسماء النوايا بقوائم سلاسل regex.
- ✅ يعيد `classify()` اسم نية أو `None` للمدخل المجهول.
- ✅ يعيد `classify_with_matches()` كائن `MatchResult` بالنية والنص المطابق والمجاميع المقتنصة.
- ✅ المطابقة غير الحساسة للحالة تعمل لكل الأنماط.
- ✅ المدخل المجهول مثل «purple elephant» يعيد `None`.

**🤔 سؤال (أسئلة) سقراطي(ة) :**

- لماذا يربط كل نية قائمة *أنماط* لا نمطًا واحدًا؟ ماذا يحدث حين يكتب المستخدم «hey» مقابل «good afternoon»؟
- ما الفرق بين `re.search` و`re.match` هنا؟ هل كان سيكسر شيئًا تبديلك إلى `re.match`؟

## الخطوة 2 ، ولّد ردودًا من القوالب

الآن بعد أن يعرف البوت *ماذا* عنى المستخدم، يحتاج أن يقول شيئًا في المقابل. نظام ردود مبني من قوالب وخيارات عشوائية يُبقي البوت بعيدًا عن إحساس الآلة.

### 2.1 ابنِ سجل الردود

**👟 تلميح البداية :** أنشئ `responses.py` بقاموس يربط النوايا بقوالب ردود. استخدم `random.choice` لاختيار واحد عشوائيًا، كي لا ينتج المدخل ذاته الإجابة نفسها دائمًا.

```python
# responses.py
"""Response templates keyed by intent. Each intent maps to a list of
strings — random.choice picks one at random for variety."""

import random
from datetime import datetime

RESPONSES: dict[str, list[str]] = {
    "greeting": [
        "Hey there! How can I help?",
        "Hello! What's on your mind?",
        "Hi! Ready to chat.",
        "Hey! What can I do for you?",
    ],
    "farewell": [
        "Goodbye! Have a great day!",
        "See you later!",
        "Bye! Come back anytime.",
        "Take care!",
    ],
    "time": [
        f"The current time is {datetime.now().strftime('%H:%M')}.",
        f"It's {datetime.now().strftime('%I:%M %p')} right now.",
    ],
    "date": [
        f"Today is {datetime.now().strftime('%A, %B %d, %Y')}.",
        f"It's {datetime.now().strftime('%B %d, %Y')}.",
    ],
    "name": [
        "I'm Chatbot, your rule-based assistant!",
        "You can call me Chatbot.",
        "I'm Chatbot — nice to meet you!",
    ],
    "mood": [
        "I'm doing great, thanks for asking!",
        "All systems operational!",
        "Couldn't be better — I'm a bot, after all!",
        "Pretty good! How about you?",
    ],
    "thanks": [
        "You're welcome!",
        "Happy to help!",
        "Anytime!",
        "No problem at all!",
    ],
    "help": [
        "I can tell you the time, the date, my name, or how I'm doing. "
        "Just ask naturally!",
        "Try asking: 'What time is it?', 'What's your name?', or 'How are you?'",
    ],
    "question": [
        "That's an interesting question! I'm still learning, so I don't have "
        "a full answer yet.",
        "Good question — I'd need to look that up. Try asking me about the "
        "time or date instead!",
    ],
}


def get_response(intent: str) -> str:
    """Return a random response for the given intent."""
    options = RESPONSES.get(intent)
    if options:
        return random.choice(options)
    return ""
```

**🎯 الناتج المتوقع:**

```python
from responses import get_response

print(get_response("greeting"))
print(get_response("greeting"))  # same intent, different response
```

يجب أن يطبع تحيتين مختلفتين (النص الدقيق يختلف):

```
Hey there! How can I help?
Hi! Ready to chat.
```

**🩹 إذا لم يعمل :** إذا حصلت على سلسلة فارغة، فاسم النية لا يطابق أي مفتاح في `RESPONSES` ، تحقق من أخطاء كتابة مثل `"Greeting"` بغلة كبيرة مقابل `"greeting"`. إذا ظهر نفس الرد في كل مرة، فنسيت `random.choice` وتستخدم الفهرس `[0]` أو مدخلًا ثابتًا بدلًا.

### 2.2 أضف ردودًا ديناميكية بـf-سلاسل

بعض الردود تحتاج بيانات حية ، الوقت والتاريخ يتغيران كل ثانية. استخدام f-سلاسل في سلاسل القوالب سيقِّيّم عند زمن الاستيراد، مجمِّدًا القيم. عوضًا عنه، استخدم ردودًا قابلة للاستدعاء.

**👟 تلميح البداية :** استبدل السلاسل الساكنة بـlambdas للنوايا التي تحتاج بيانات ديناميكية:

```python
def get_response(intent: str) -> str:
    """Return a random response for the given intent."""
    options = RESPONSES.get(intent)
    if not options:
        return ""
    choice = random.choice(options)
    if callable(choice):
        return choice()
    return choice
```

ثم حدّث `RESPONSES` كي تكون مداخل الوقت والتاريخ دوالًا:

```python
"time": [
    lambda: f"The current time is {datetime.now().strftime('%H:%M')}.",
    lambda: f"It's {datetime.now().strftime('%I:%M %p')} right now.",
],
"date": [
    lambda: f"Today is {datetime.now().strftime('%A, %B %d, %Y')}.",
    lambda: f"It's {datetime.now().strftime('%B %d, %Y')}.",
],
```

**🎯 الناتج المتوقع :** استدعاء `get_response("time")` مرتين توالياً يعيد الوقت الحالي، لا الوقت الذي استُوردت منه الوحدة أولًا:

```python
import time
print(get_response("time"))
time.sleep(2)
print(get_response("time"))
```

كلاهما يطبع الوقت نفسه (بفارق ثانيتين فقط)، لكن إذا انتظرت دقيقة كاملة بين الاستدعاءين، سيختلفان ، دليل أن lambda تُقيَّم عند كل استدعاء، لا مرة عند الاستيراد.

**🩹 إذا لم يعمل :** إذا أعاد `callable(choice)` قيمة `False` لأجل lambda، فتحقق أن lambda معرَّفة صحيحًا ، `lambda: f"..."` لا `f"..."` (فf-سلسلة مجردة سلسلة، لا دالة). إذا حصلت على `TypeError: 'str' object is not callable`, فاختلطت سلسلة ساكنة في قائمة تُستدعى الآن ، تأكد أن مداخل lambdas فقط موجودة في القوائم الديناميكية.

### 2.3 تحقّق من توليد الردود

**✅ قائمة التحقق**

- ✅ يعيد `get_response()` سلسلة عشوائية من قائمة النية.
- ✅ الردود الديناميكية (الوقت، التاريخ) تعيد القيمة الحالية، لا مجمَّدة.
- ✅ فحص `callable()` يتعامل مع السلاسل والـlambdas بلباقة.
- ✅ كل نية في `INTENT_PATTERNS` لها مدخل مطابق في `RESPONSES`.

**🤔 سؤال (أسئلة) سقراطي(ة) :**

- لماذا استخدام `callable()` لفحص كل رد بدل وضع كل الردود الديناميكية في قاموس منفصل؟ ما ميزة خلط السلاسل والـlambdas في قائمة واحدة؟
- إذا أردت أن يتذكر البوت *ماذا* سأل المستخدم عنه (لا النية فقط)، فأين تخزّن تلك المعلومات؟

## الخطوة 3 ، تتبع سياق المحادثة

شات بوت ينظر إلى الرسالة الحالية فقط منسيّ. يتيح تتبع السياق للبوت تذكر ما قاله المستخدم مسبقًا ، فأسئلة المتابعة مثل «what about tomorrow?» أو «and you?» تصبح ذات معنى.

### 3.1 عرّف صف سياق المحادثة

**👟 تلميح البداية :** استخدم dataclass لحمْل حالة المحادثة. تتبع النية الأخيرة، ورسائل قليلة الأخيرة، وعَدّاد دور، وأي كيانات مستخرجة:

```python
# context.py
"""Tracks conversation state across turns. The ChatContext class holds
what the bot remembers between messages."""

from dataclasses import dataclass, field
from collections import deque

@dataclass
class ChatContext:
    """Stores conversation state across turns."""
    last_intent: str | None = None
    last_user_message: str = ""
    last_bot_response: str = ""
    turn_count: int = 0
    message_history: deque = field(default_factory=lambda: deque(maxlen=10))
    entities: dict[str, str] = field(default_factory=dict)

    def update(self, user_message: str, intent: str, bot_response: str) -> None:
        """Record a new turn in the conversation."""
        self.last_intent = intent
        self.last_user_message = user_message
        self.last_bot_response = bot_response
        self.turn_count += 1
        self.message_history.append({
            "user": user_message,
            "bot": bot_response,
            "intent": intent,
        })

    def get_recent_intents(self, n: int = 3) -> list[str]:
        """Return the last n intents as a list."""
        return [msg["intent"] for msg in list(self.message_history)[-n:]]

    def was_recent_intent(self, intent: str) -> bool:
        """Check if any of the last 3 intents match."""
        return intent in self.get_recent_intents()

    def store_entity(self, key: str, value: str) -> None:
        """Store an extracted entity (e.g. topic, name)."""
        self.entities[key] = value

    def get_entity(self, key: str) -> str | None:
        """Retrieve a stored entity."""
        return self.entities.get(key)
```

**🎯 الناتج المتوقع:**

```python
from context import ChatContext

ctx = ChatContext()
ctx.update("hello", "greeting", "Hey there!")
ctx.update("what time is it", "time", "It's 14:30.")
ctx.update("and you?", "mood", "All systems operational!")

print(f"Turns: {ctx.turn_count}")
print(f"Last intent: {ctx.last_intent}")
print(f"Recent intents: {ctx.get_recent_intents()}")
print(f"Was recent greeting? {ctx.was_recent_intent('greeting')}")
```

يجب أن يطبع:

```
Turns: 3
Last intent: mood
Recent intents: ['greeting', 'time', 'mood']
Was recent greeting? True
```

**🩹 إذا لم يعمل :** إذا كان `turn_count` دائمًا 1، فنسيت استدعاء `update()` ، لا يزداد وحده. إذا كانت `message_history` أطول من 10 مداخل، فحد `deque(maxlen=10)` لا يعمل ، تحقق أنك تمرر `maxlen=10` في `default_factory`, لا في جسم الصف كقيمة افتراضية.

### 3.2 استخدم السياق لتحسين الردود

**👟 تلميح البداية :** دالة رد واعية بالسياق يمكن أن تفحص النية الأخيرة للتعامل مع أسئلة المتابعة. إذا سأل المستخدم «what about tomorrow?» بعد سؤال وقت، فينبغي أن يستنتج البوت أنه يريد التاريخ.

```python
from context import ChatContext

def context_adjusted_intent(raw_intent: str, user_message: str,
                            context: ChatContext) -> str:
    """Refine the raw intent using conversation context."""
    if raw_intent == "question" and context.last_intent == "time":
        if "tomorrow" in user_message.lower() or "date" in user_message.lower():
            return "date"
    if raw_intent == "question" and context.last_intent == "mood":
        if "you" in user_message.lower():
            return "mood"
    return raw_intent
```

**🎯 الناتج المتوقع:**

```python
ctx = ChatContext()
ctx.update("what time is it", "time", "It's 14:30.")

adjusted = context_adjusted_intent("question", "what about tomorrow?", ctx)
print(adjusted)  # "date" — context infers date intent
```

يجب أن يطبع:

```
date
```

**🩹 إذا لم يعمل :** إذا كانت النية المعدَّلة ما زالت `"question"` عند توقع `"date"`، فتحقق من `context.last_intent` ، يجب أن تكون `"time"` لتنطلق الفرع الأول. إذا لم يحتوِ `user_message.lower()` على «tomorrow», فلن تطابق فحص السلسلة الفرعية ، تأكد أن مدخل المستخدم يحوي الكلمة فعلًا.

### 3.3 تحقّق من تتبع السياق

**✅ قائمة التحقق**

- ✅ يسجل `ChatContext.update()` كل دور ويزيد العدّاد.
- ✅ يعيد `get_recent_intents()` آخر N نوايا كقائمة.
- ✅ يستخدم `context_adjusted_intent()` النية الأخيرة لتحسين أسئلة المتابعة.
- ✅ تخزين الكيانات واسترجاعها يعملان مع `store_entity` و`get_entity`.
- ✅ `message_history` مكبل عند 10 مداخل عبر `deque(maxlen=10)`.

**🤔 سؤال (أسئلة) سقراطي(ة) :**

- لماذا تكبيل `message_history` عند 10 مداخل بـ`deque`؟ ماذا يحدث لاستهلاك الذاكرة إذا خزّنت كل رسالة في قائمة عادية لمحادثة طويلة؟
- تفحص `context_adjusted_intent` `last_intent` فقط. ماذا كان سيتغير لو أردت اعتبار آخر *ثلاث* نوايا بدل واحدة؟

## الخطوة 4 ، أضف الشخصية

بوت يجيب كل سؤال بعبارة مسطحة يبدو بلا حياة. تأتي الشخصية من سمات متسقة ، اسم، ونبرة، وعادات دردشة قصيرة، وتتبع مزاج ينزاح عبر المحادثة.

### 4.1 أنشئ صف الشخصية

**👟 تلميح البداية :** عرّف dataclass باسم `Personality` يحمل اسم البوت ونبرته ومزاجه وعباراته المفضلة. أضف أساليب لتغييرات المزاج وردودًا مبنية على السمات.

```python
# personality.py
"""Defines the chatbot's personality — name, tone, mood, and traits
that shape how it responds."""

import random
from dataclasses import dataclass, field

MOODS = ["happy", "neutral", "curious", "excited", "tired"]

@dataclass
class Personality:
    name: str = "Chatbot"
    mood: str = "happy"
    tone: str = "friendly"
    traits: list[str] = field(default_factory=lambda: ["curious", "helpful", "witty"])
    greeting_count: int = 0
    joke_count: int = 0

    def greet(self) -> str:
        """Return a personality-flavoured greeting."""
        self.greeting_count += 1
        if self.greeting_count == 1:
            return f"Hi! I'm {self.name}. Nice to meet you!"
        if self.greeting_count == 2:
            return f"Hey again! Back for more? I'm {self.name}."
        return random.choice([
            f"We meet again! I'm {self.name}, remember?",
            f"Oh, it's you! {self.name} here, at your service.",
            f"Welcome back! {self.name} is always happy to chat.",
        ])

    def shift_mood(self) -> None:
        """Randomly shift mood based on conversation flow."""
        weights = [3, 5, 2, 1, 1]  # happy and neutral more likely
        self.mood = random.choices(MOODS, weights=weights, k=1)[0]

    def get_mood_response(self) -> str:
        """Describe current mood in a personality-flavoured way."""
        mood_phrases = {
            "happy": "I'm in a great mood! Ready to help.",
            "neutral": "Doing okay — nothing special to report.",
            "curious": "I'm feeling curious! Tell me more.",
            "excited": "I'm so excited I could process data all day!",
            "tired": "A bit tired... but still here for you.",
        }
        return mood_phrases.get(self.mood, "I'm doing fine.")

    def get_trait_descriptor(self) -> str:
        """Return a random trait as a self-description."""
        return random.choice(self.traits)
```

**🎯 الناتج المتوقع:**

```python
from personality import Personality

bot = Personality(name="HAL")
print(bot.greet())
print(bot.greet())
print(bot.get_mood_response())
bot.shift_mood()
print(f"After shift: {bot.mood}")
```

يجب أن يطبع (يختلف):

```
Hi! I'm HAL. Nice to meet you!
Hey again! Back for more? I'm HAL.
I'm in a great mood! Ready to help.
After shift: curious
```

**🩹 إذا لم يعمل :** إذا كانت التحية الثانية مطابقة للأولى، فـ`greeting_count` لا يزداد ، تأكد أن `self.greeting_count += 1` داخل الأسلوب، لا على مستوى الوحدة. إذا لم ينتج `shift_mood` كلمة «excited» أبدًا، فوزنها 1 يجعلها نادرة ، شغّل الإزاحة بعض المرات وستظهر في النهاية.

### 4.2 ادمج الشخصية مع الردود

**👟 تلميح البداية :** حدّث نظام الردود كي نكهّ الشخصية الناتج. البوت «السعيد» يستخدم صياغة مختلفة عن «المتعب»:

```python
# responses.py (updated get_response)

from personality import Personality

def get_response(intent: str, personality: Personality | None = None) -> str:
    """Return a random response, optionally shaped by personality."""
    options = RESPONSES.get(intent)
    if not options:
        return ""
    choice = random.choice(options)
    if callable(choice):
        base = choice()
    else:
        base = choice

    if personality is None:
        return base

    # Add personality flavour
    if intent == "greeting":
        return personality.greet()
    if intent == "mood":
        return personality.get_mood_response()

    # Occasionally add a mood-influenced prefix
    if personality.mood == "excited" and random.random() < 0.3:
        base = f"Ooh! {base}"
    elif personality.mood == "tired" and random.random() < 0.3:
        base = f"*yawn* {base}"

    return base
```

**🎯 الناتج المتوقع:**

```python
from personality import Personality

bot = Personality()
bot.mood = "excited"
for _ in range(5):
    print(get_response("mood", bot))
print("---")
for _ in range(3):
    print(get_response("greeting", bot))
```

يجب أن يطبع تحيات وردود مزاج بنكهة الشخصية (يختلف):

```
I'm so excited I could process data all day!
Ooh! I'm in a great mood! Ready to help.
I'm so excited I could process data all day!
I'm in a great mood! Ready to help.
Ooh! I'm doing fine.
---
Hi! I'm Chatbot. Nice to meet you!
We meet again! I'm Chatbot, remember?
Hey again! Back for more? I'm Chatbot.
```

**🩹 إذا لم يعمل :** إذا لم تظهر بادئات المزاج أبدًا، فإن `random.random() < 0.3` يعني أنها تظهر بنسبة 30% فقط ، شغّلها أكثر. إذا أعادت التحيات القالب الساكن بدل `personality.greet()`, فنسيت فرع `if intent == "greeting": return personality.greet()` في `get_response` المحدثة.

### 4.3 تحقّق من الشخصية

**✅ قائمة التحقق**

- ✅ يعيد `Personality.greet()` رسائل مختلفة عند الاستدعاءات المتتابعة.
- ✅ يغيّر `shift_mood()` المزاج، باحتمالات مرجَّحة.
- ✅ يستخدم `get_response("greeting", bot)` دالة `personality.greet()` بدل القالب الساكن.
- ✅ تظهر البادئات المتأثرة بالمزاج أحيانًا بناء على المزاج الحالي.

**🤔 سؤال (أسئلة) سقراطي(ة) :**

- لماذا استخدام اختيارات عشوائية مرجَّحة لـ`shift_mood` بدل اختيار موحَّد عشوائي؟ ماذا يمهذج ذلك عن شخصية حقيقية؟
- إذا أردت أن يتذكر البوت اسم مستخدم من مبكر المحادثة، فأين تخزّنه ، في `Personality` أم `ChatContext`؟ ولماذا؟

## الخطوة 5 ، تعامل مع البدائل

لن يغطي أي نمط كل مدخل ممكن. بوت يتحطم أو لا يجيب على مدخل غير متوقع يبدو مكسورًا. البدائل السلسة تُبقي المحادثة جارية.

### 5.1 ابنِ نظام ردود احتياطي

**👟 تلميح البداية :** أنشئ وحدة `fallback.py` تولّد ردودًا مفيدة للمدخلات غير المطابقة. تتبع كم بديلًا يحدث توالياً ، إذا فشل البوت في الفهم مرات كثيرة متتالية، اعرض المساعدة مباشرة أكثر.

```python
# fallback.py
"""Handles inputs that don't match any known pattern. Tracks consecutive
fallbacks and adjusts the response to offer help after repeated misses."""

import random

FALLBACK_RESPONSES = [
    "I'm not sure I understand. Could you rephrase that?",
    "Hmm, I don't have an answer for that. Try asking about the time or date!",
    "That's beyond my abilities right now. I can help with time, date, or just chat!",
    "I didn't catch that. Type 'help' to see what I can do.",
]

OFFER_HELP_RESPONSES = [
    "It seems like we're having trouble connecting. Would you like me to list what I can do?",
    "I've missed a few in a row now. Type 'help' and I'll show you my commands!",
    "Let's try something different — ask me about the time, the date, or just say hi!",
]


class FallbackTracker:
    """Tracks consecutive unmatched inputs and adjusts responses."""

    def __init__(self, help_threshold: int = 3):
        self.consecutive_fallbacks = 0
        self.help_threshold = help_threshold
        self.total_fallbacks = 0

    def record_fallback(self) -> str:
        """Record a fallback and return an appropriate response."""
        self.consecutive_fallbacks += 1
        self.total_fallbacks += 1

        if self.consecutive_fallbacks >= self.help_threshold:
            return random.choice(OFFER_HELP_RESPONSES)
        return random.choice(FALLBACK_RESPONSES)

    def record_success(self) -> None:
        """Reset consecutive counter on a successful match."""
        self.consecutive_fallbacks = 0

    def get_stats(self) -> dict:
        """Return fallback statistics."""
        return {
            "consecutive": self.consecutive_fallbacks,
            "total": self.total_fallbacks,
        }
```

**🎯 الناتج المتوقع:**

```python
from fallback import FallbackTracker

tracker = FallbackTracker(help_threshold=3)
print(tracker.record_fallback())
print(tracker.record_fallback())
print(tracker.record_fallback())  # 3rd consecutive — triggers offer
print(tracker.get_stats())
```

يجب أن يطبع (يختلف):

```
I'm not sure I understand. Could you rephrase that?
Hmm, I don't have an answer for that. Try asking about the time or date!
It seems like we're having trouble connecting. Would you like me to list what I can do?
{'consecutive': 3, 'total': 3}
```

**🩹 إذا لم يعمل :** إذا لم يظهر عرض المساعدة أبدًا، فتحقق أن `consecutive_fallbacks` يزداد ، إذا استُدعي `record_success()` بين البدائل، يعود العدّاد إلى الصفر. إذا أظهرت الإحصاءات `consecutive: 3` لكنك استدعيت `record_fallback` مرتين فقط، فتحقق أن `record_success` لا يُستدعى حيث لا ينبغي.

### 5.2 ادمج البدائل مع المصنّف الرئيسي

**👟 تلميح البداية :** ركّب متتبِّع البدائل في حلقة التصنيف والاستجابة الرئيسية. إذا أعاد `classify` قيمة `None`, فاستخدم البديل عوضًا:

```python
# bot.py (main loop — grows through this project)
import re
from patterns import INTENT_PATTERNS, classify_with_matches
from responses import get_response
from context import ChatContext
from personality import Personality
from fallback import FallbackTracker


def respond(user_input: str, context: ChatContext,
            personality: Personality, tracker: FallbackTracker) -> str:
    """Process user input and return a response."""
    match = classify_with_matches(user_input)

    if match is None:
        tracker.record_success()  # reset — not used here, see Step 5
        return tracker.record_fallback()

    tracker.record_success()
    intent = match.intent
    response = get_response(intent, personality)
    context.update(user_input, intent, response)
    personality.shift_mood()
    return response
```

مهلاً ، هذا يعيد ضبط المتتبِّع عند *النجاح*، لكن متتبِّع البدائل يجب أن يُضبط عند النجاح، لا الفشل. لنصلح ذلك:

```python
def respond(user_input: str, context: ChatContext,
            personality: Personality, tracker: FallbackTracker) -> str:
    """Process user input and return a response."""
    match = classify_with_matches(user_input)

    if match is None:
        return tracker.record_fallback()

    tracker.record_success()  # reset consecutive counter on success
    intent = match.intent
    response = get_response(intent, personality)
    context.update(user_input, intent, response)
    personality.shift_mood()
    return response
```

**🎯 الناتج المتوقع :** كتابة ثلاثة مدخلات مجهولة توالياً تنتج رسائل بديل مفيدة متصاعدة:

```
You: asdfghjkl
Bot: I'm not sure I understand. Could you rephrase that?
You: qwerty
Bot: Hmm, I don't have an answer for that. Try asking about the time or date!
You: zxcvbnm
Bot: It seems like we're having trouble connecting. Would you like me to list what I can do?
You: hello
Bot: Hi! I'm Chatbot. Nice to meet you!
```

بعد «hello» الناجحة، يعاد ضبط العدّاد المتتالي ، يبدأ المدخل المجهول التالي من أول رسالة بديل مجددًا.

**🩹 إذا لم يعمل :** إذا لم يُعاد ضبط عدّاد البدائل بعد مدخل ناجح، فدالة `tracker.record_success()` لا تُستدعى ، تأكد أن فرع `if match is None: ... else: tracker.record_success()` صحيح. إذا رد البوت بسلسلة فارغة على مجهول، فإن `record_fallback()` لمتعقّب البدائل لا يعيد سلسلة ، تحقق من الاستيراد.

### 5.3 تحقّق من معالجة البدائل

**✅ قائمة التحقق**

- ✅ المدخل المجهول يطلق رد بديل، لا سلسلة فارغة ولا تحطمًا.
- ✅ ثلاثة بدائل متتالية تطلق رسالة عرض المساعدة.
- ✅ مدخل ناجح يعيد ضبط عدّاد البدائل المتتالي.
- ✅ إحصاءات البدائل تتبع العدَّتين المتتالية والكلية.

**🤔 سؤال (أسئلة) سقراطي(ة) :**

- لماذا تتبع البدائل المتتالية بدل البدائل الكلية فقط؟ ماذا كان سيحدث لو عرض البوت المساعدة بعد كل مدخل مجهول؟
- إذا أردت أن يسجّل البوت أي المدخلات أطلقت بدائل (للتحليل لاحقًا), فأين تخزّن ذلك السجل ، في `FallbackTracker` أم `ChatContext` أم وحدة منفصلة؟

## الخطوة 6 ، ابنِ حلقة الدردشة

كل القطع جاهزة. هذه الخطوة تصلها في دالة `main()` واحدة بحلقة REPL نظيفة، والتحقق من المدخلات، وخروج لطيف.

### 6.1 أنشئ نقطة الدخول الرئيسية

**✏️ الملف الكامل: `main.py`**

```python
# main.py
"""The main chat loop. Ties together pattern matching, response generation,
context tracking, personality, and fallback handling into an interactive REPL."""

import sys
from patterns import classify_with_matches
from responses import get_response
from context import ChatContext
from personality import Personality
from fallback import FallbackTracker


BANNER = """
╔══════════════════════════════════════════════╗
║           CHATBOT BUILDER v1.0               ║
║  Type 'help' to see commands                ║
║  Type 'bye' to exit                         ║
╚══════════════════════════════════════════════╝
"""


def respond(user_input: str, context: ChatContext,
            personality: Personality, tracker: FallbackTracker) -> str:
    """Process user input and return a response."""
    match = classify_with_matches(user_input)

    if match is None:
        return tracker.record_fallback()

    tracker.record_success()
    intent = match.intent

    # Handle special commands
    if intent == "farewell":
        return get_response(intent, personality)

    response = get_response(intent, personality)
    context.update(user_input, intent, response)
    personality.shift_mood()
    return response


def main() -> None:
    """Run the chatbot REPL."""
    context = ChatContext()
    personality = Personality(name="Chatbot")
    tracker = FallbackTracker(help_threshold=3)

    print(BANNER)
    print(f"Bot: {personality.greet()}")
    print()

    while True:
        try:
            user_input = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print(f"\nBot: {get_response('farewell', personality)}")
            break

        if not user_input:
            continue

        response = respond(user_input, context, personality, tracker)
        print(f"Bot: {response}")

        # Exit on farewell
        match = classify_with_matches(user_input)
        if match and match.intent == "farewell":
            break

    # Print conversation summary
    print(f"\n--- Conversation Summary ---")
    print(f"Turns: {context.turn_count}")
    print(f"Fallbacks: {tracker.total_fallbacks}")
    print(f"Final mood: {personality.mood}")


if __name__ == "__main__":
    main()
```

**🎯 الناتج المتوقع :** تشغيل `uv run python main.py` ينتج:

```
╔══════════════════════════════════════════════╗
║           CHATBOT BUILDER v1.0               ║
║  Type 'help' to see commands                ║
║  Type 'bye' to exit                         ║
╚══════════════════════════════════════════════╝

Bot: Hi! I'm Chatbot. Nice to meet you!

You: hello
Bot: Hey again! Back for more? I'm Chatbot.
You: what time is it
Bot: It's 02:45 PM right now.
You: asdfgh
Bot: I'm not sure I understand. Could you rephrase that?
You: help
Bot: I can tell you the time, the date, my name, or how I'm doing. Just ask naturally!
You: bye
Bot: Take care!

--- Conversation Summary ---
Turns: 4
Fallbacks: 1
Final mood: curious
```

**🩹 إذا لم يعمل :** إذا تحطم `main.py` بـ`ModuleNotFoundError`, فالوحدات الأخرى (`patterns.py`, `responses.py`, `context.py`, `personality.py`, `fallback.py`) ليست بنفس المجلد ، أبقِ كل الملفات في جذر المشروع. إذا خرجت حلقة REPL فورًا، فدالة `input()` ترفع `EOFError` ، يحدث هذا في بعض بيئات الدفاتر؛ شغّلها في طرفية حقيقية بدل ذلك.

### 6.2 أضف التحقق من المدخلات والحالات الحدية

**👟 تلميح البداية :** احترس من أخطاء المستخدم الشائعة ، مدخل فارغ، ورسائل طويلة جدًا، ومحارف تحكم:

```python
def validate_input(text: str) -> str | None:
    """Validate and sanitise user input. Returns cleaned text or None
    if the input should be silently ignored."""
    text = text.strip()
    if not text:
        return None
    if len(text) > 500:
        return text[:500]  # truncate instead of rejecting
    # Strip control characters except newlines
    text = "".join(ch for ch in text if ch.isprintable() or ch == "\n")
    return text if text else None
```

ركّبه في الحلقة الرئيسية:

```python
while True:
    try:
        raw_input = input("You: ").strip()
    except (EOFError, KeyboardInterrupt):
        print(f"\nBot: {get_response('farewell', personality)}")
        break

    user_input = validate_input(raw_input)
    if user_input is None:
        continue

    response = respond(user_input, context, personality, tracker)
    print(f"Bot: {response}")
```

**🎯 الناتج المتوقع :** الضغط على Enter دون كتابة شيء يتابع الحلقة بصمت. كتابة 600 محرفًا تقطَع إلى 500. تُنزع محارف التحكم.

**🩹 إذا لم يعمل :** إذا جعل الضغط على Enter البوت يرد ببديل، ففحص السلسلة الفارغة بعد `validate_input` لا قبله ، تأكد أن `validate_input` يعيد `None` للسلاسل الفارغة وأن الحلقة الرئيسية تتخطى قيم `None`.

### 6.3 تحقّق من الشات بوت الكامل

**✅ قائمة التحقق**

- ✅ يعمل `main.py` كـREPL يقرأ مدخلات ويطبع ردودًا.
- ✅ التحيات والوقت والتاريخ والاسم والمزاج والمساعدة والوداع كلها تعمل.
- ✅ المدخل المجهول يطلق ردود بديل بمساعدة متصاعدة.
- ✅ المدخل الفارغ يُتجاهل بصمت.
- ✅ يطبع `bye` أو `exit` وداعًا ويخرج نظيفًا.
- ✅ ملخص محادثة يطبع عند الخروج بعدّاد دورات وعدد بدائل ومزاج نهائي.
- ✅ الوحدات الخمس (`patterns.py`, `responses.py`, `context.py`, `personality.py`, `fallback.py`) كلها في نفس المجلد.

## ⚠️ مآزق شائعة

- **نسيان `re.IGNORECASE`.** بدونه، لن تطابق «Hello» النمط `r"\bhi\b"` لأن التعبيرات النمطية حسّاسة للحالة افتراضيًا. كل استدعاء `re.search` و`re.match` في المصنّف يحتاج هذا العلم.
- **خلط f-سلاسل وlambdas في قوالب الردود.** f-سلسلة مثل `f"The time is {datetime.now()}"` تُقيَّم *مرة عند الاستيراد*, مجمِّدةً القيمة. استخدم `lambda: f"..."` عوضًا كي تُقيَّم عند كل استدعاء.
- **عدّاد البدائل يُعاد ضبطه كثيرًا.** `record_success()` يعيد ضبط العدّاد المتتالي ، إذا استدعيته لكل مدخل (بما فيه البدائل)، فلن ينطلق حد «الثلاثة توالياً» أبدًا. استدعه فقط حين يطابق المصنّف فعلًا.
- **`deque(maxlen=10)` لا يعمل.** يجب تمرير `maxlen` إلى lambda في `default_factory`, لا كافتراضي على مستوى الصف: `field(default_factory=lambda: deque(maxlen=10))`, لا `deque: deque = deque(maxlen=10)`.
- **REX داخل الدفاتر.** `input()` في Colab/Kaggle يعمل، لكن حلقة الدردشة لا تخرج نظيفًا عند `Ctrl+C` ، ترفع `KeyboardInterrupt` الذي تحتاج التقاطه. يولي `try/except (EOFError, KeyboardInterrupt)` في `main.py` ذلك.

## ما بنيته للتو

شات بوت قائم على القواعد مبني بالكامل من مكتبة Python القياسية: مطابقة أنماط regex لتصنيف النوايا، وتوليد ردود بقوالب مع بيانات ديناميكية، وتتبع سياق المحادثة عبر الدورات، وشخصية مع تحولات مزاج، ونظام بديل يصعّد المساعدة بعد إخفاقات متكررة. خمس وحدات ، `patterns.py`, `responses.py`, `context.py`, `personality.py`, `fallback.py` ، كل منها اختُبرت مستقلة قبل وصلها معًا في `main.py`. يميِّز الشات بوت التحيات وأسئلة الوقت/التاريخ/الاسم/المزاج وطلبات المساعدة والوداع، ويستجيب بتنويع مدفوع بالشخصية بدل سلاسل ثابتة.

## إلى أين تذهب من هنا

- **أضف قاعدة معرفة بسيطة.** خزّن حقائق يستطيع البوت البحث عنها ، «Python ابتكرها غيدو فان روسوم» ، ورد على نوايا `question` بالبحث في قاعدة المعرفة بدل إجابة عامة «لا أعرف».
- **تاريخ محادثة ثابت.** احفظ سجل الدردشة في ملف JSON لتراجع محادثات سابقة، أو حمّل سياق جلسة سابقة حين يعاد تشغيل البوت.
- **دعم متعدد المستخدمين.** تعرّف على `ChatContext` بمعرّف المستخدم بدل سياق عام واحد ، يحصل مستخدمون مختلفون على تواريخ محادثة مستقلة.
- **تحسينات التعبيرات النمطية.** استخدم نمط `re.VERBOSE` لكتابة أنماط أسهل قراءة مع تعليقات، أو اجمع الأنماط بـ`re.compile` لأداء أفضل على قوائم أنماط كبيرة.
- **بديل LLM.** حين يعيد مصنّف regex القيمة `None`, مرّر المدخل إلى LLM بنسخة مجانية بدل رد بديل ساكن ، أفضل العالمين: مطابقة أنماط سريعة للحالات الشائعة، وذكاء اصطناعي مرن لكل الباقي.

## شارك مشروعك مع الصف

بنيت شيئًا تفخر به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع قدّمها طلاب آخرون ، وREADME الخاص به يحوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓