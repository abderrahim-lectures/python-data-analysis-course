---
title: "دردشة WebSocket"
description: "ابنِ دردشة متعددة المستخدمين في الوقت الفعلي باستخدام WebSocket."
difficulty: "intermediate"
estimatedMinutes: 60
tags: ["networking", "async", "cli"]
learningObjectives:
  - "انقل الرسائل عبر WebSocket بمعالج coroutine"
  - بثّ إلى عدة عملاء متصلين باستخدام asyncio
  - "وجّه الرسائل إلى الغرف باستخدام مسار الاتصال"
  - "أعد تشغيل السجل وأحداث الحضور للوافدين الجدد"
  - "شغّل عميل دردشة من stdin باستخدام run_in_executor"
prerequisites:
  - "Python basics (functions, sets, tuples)"
  - "asyncio basics (async def, await, asyncio.run, asyncio.gather)"
  - "A second terminal open for the live two-terminal demo"
---

# 🛠️ 💬 ابنِ دردشة WebSocket

تطبيق الدردشة ألطف مقدمة ممكنة للشبكات: تخرج الرسائل من مقبس، وتدخل، وتتكرر. كل تجربة "حية" تقريبًا — تعدد اللاعبين، والإشعارات، والمؤشرات التعاونية — هي هذه الحلقة بملابس أخرى. يبني هذا المشروع واحدة حقيقية: معالج صدى، ثم بثًا حسب الغرفة، ثم سجل الحضور وإعادة تشغيله لأي منضمّ متأخر، وأخيرًا عميل طرفية يمكنك الدردشة به فعلًا عبر طرفيتين. كل شيء هو `asyncio` + `websockets`، بلا متصفح وبلا حشو.

هذا يفترض Python 101 مع القليل من اللاasync — لا شيء من تحليل البيانات مطلوب. هذا اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للقائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. دفع رسائل وسحبها عبر WebSocket بمعالج كوروتين.
2. بث رسالة عميل واحد إلى كل عميل متصل آخر.
3. توجيه الرسائل إلى غرف منفصلة عبر مسار الاتصال.
4. إعادة تشغيل سجل الغرفة وأحداث الحضور لعميل ينضم متأخرًا.
5. بناء عميل طرفية مقاد من stdin والدردشة عبر طرفيتين.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المكان الوحيد الذي تعمل فيه *الدردشة الحية بين طرفيتين*، لأن خادم الدردشة عملية يجب أن تبقى قيد التشغيل. لكن كل خطوة حتى العرض الحي النهائي تُبقي الخادم وعملاء الاختبار في `asyncio.run()` واحد، فتعمل الخلايا نفسها دون تعديل في السحابة.

**Google Colab وKaggle Notebooks وBinder** تشغّل كل عرض داخل-العملية تمامًا كما كُتب: الخادم في سياق كوروتين واحد، والعملاء الافتراضيون في آخر، كل ذلك داخل `asyncio.run` واحد. التحفظ الصادق: لا يستطيع دفتر أن يبقي *طرفيتين* مفتوحتين، فيبقى عرض "اكتب من الطرفية B" الأخير محليًا. استخدم الشارات لترى حلقة الرسائل؛ واستخدم طرفية للمحادثة الحقيقية.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/websocket-chat/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/websocket-chat/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fwebsocket-chat%2Fnotebook.ipynb)

## الإعداد

أنشئ المشروع. `websockets` هي التبعية الوحيدة؛ و`asyncio` مكتبة قياسية. يتربط الخادم بـ `localhost` فقط، ما يُبقي كل شيء على جهازك — ونشر حقيقي وسّع ذلك، وواحد من المآزق الشائعة يشرح لماذا.

```bash
uv init websocket-chat
cd websocket-chat
```

```bash
uv add websockets
```

```bash
uv run python -c "import websockets, asyncio; print('ws', websockets.__version__)"
```

يمنحك `asyncio` الكوروتينات — دوال `async def` تستطيع أن تتوقف عند `await` دون أن تفقد مكانها — وهو بالضبط ما يحتاجه الخادم بينما ينتظر على مقابس كثيرة في آن واحد. يحوّل `websockets` الـ TCP الخام إلى استدعاءات `send`/`recv` نظيفة، فيركّز كودك على *ما يحدث عند كل رسالة* بدلًا من تنسيق البايتات. يُفترَض Python 3.11+ من أجل `asyncio.timeout`؛ أي إصدار أقدم يستبدل سطري المهلة.

**✅ قائمة التحقق**

- ✅ أنشأ `uv init websocket-chat` مشروعًا مع `pyproject.toml`.
- ✅ نجح `uv add websockets`؛ طبع فحص الإصدار `ws 1x.x`.
- ✅ لديك طرفية ثانية متاحة للعرض النهائي.

## الخطوة 1: الصدى — أبسط خادم يتكلم

يبدأ كل خادم دردشة من هنا: معالج يجري مرة واحدة لكل اتصال، ويحلّق على الرسائل الواردة، ويعيد شيئًا ما. معالجنا يصدّي. ولأن الخادم وعميل الاختبار يعيشان في `asyncio.run` *واحد*، يمكنك تشغيله في أي مكان.

### 1.1 اكتب خادم الصدى وعرضًا داخل العملية

**👟 تلميح البداية :** يبدأ `async with websockets.serve(...)` الخادم؛ وداخله يفتح `websockets.connect(...)` عميلًا. يشارك الكوروتينان حلقة الأحداث نفسها، فيقفز `await` بينهما.

```python
# chat.py
import asyncio

import websockets

async def echo(websocket):
    async for message in websocket:
        await websocket.send(f"echo: {message}")

async def demo_echo():
    async with websockets.serve(echo, "localhost", 8765):
        async with websockets.connect("ws://localhost:8765") as socket:
            await socket.send("hello")
            print(await socket.recv())

asyncio.run(demo_echo())
```

الحيلة كلها في اللاasync هي *الإنتاجية دون التخلي عن المكان*: `await socket.recv()` يعلّق هذا الكوروتين بينما تتقدم كوروتينات أخرى (مثل `recv` معالج الصدى نفسه)، ثم يستأنف من حيث توقف بالضبط. `async for message in websocket` هو تلك الحلقة مكتوبة حرفيًا — تنتظر الرسالة التالية، تشغّل النص، تنتظر التالية. يُعيد `websockets.serve` كائنًا غير متزامن يشغّل مدير سياقه الخادم *أثناء* الكتلة ويُطفئه بعدها، فيعيش الخادم والعميل ويموتان معًا في استدعاء واحد.

**🎯 الناتج المتوقع :** `echo: hello`.

**🩹 إذا لم يعمل :** إذا لم يُطبع شيء، فتسابق `recv()` العميل مع إرسال المعالج — مع رسالة واحدة قيد النقل يعني ذلك عادةً أن الخادم لم يقبل الاتصال أبدًا (تحقق من نظافة المنفذ 8765). إذا رأيت `ConnectionRefusedError`، فرُمي سطر `serve` قبل تشغيل `connect` — تتبّع الأثر الذي يخبرك أي كوروتين فشل هو التشخيص كله. إذا ظهر `await` داخل دالة ليست `async def`، فذلك خطأ صياغة برسالة محددة جدًا: *"await outside async function"*.

### 1.2 تحقق من الصدى

**✅ قائمة التحقق**

- ✅ يطبع `uv run python chat.py` ما يلي: `echo: hello`.
- ✅ ينتج إرسال ثلاث رسائل ثلاثة أصداء ذهابًا وإيابًا: `echo: one` و`echo: two` و`echo: three`.
- ✅ يستهدف `websockets.connect` نفس مضيف/منفذ `serve`.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يستمر `async for` في المعالج في الانتظار إلى الأبد. ماذا سيفعل الخادم لو اتصل عميل و*لم يرسل شيئًا أبدًا* — وما الذي تفعله حلقة الأحداث في هذه الأثناء؟
- يصدّي الصدى أي ما يصل، لكن عليه أن *يصدّق* أن الرسالة نص. ماذا يحدث لو أرسل عميل بايتات أو حمولة 100 MB ضخمة، وأين (في `websockets` أو في معالجك) ستدفع عنها دفاعًا؟

## الخطوة 2: البث — مُرسل واحد، مستمعون كثيرون

غرف الدردشة إرسالات جماعية. تتتبع هذه الخطوة كل مقبس متصل في مجموعة، وعندما يتكلم عميل، يصل المقطع إلى *كل شخص ما عدا المتكلم*. تلك المجموعة بذرة كل ما تحتاجه الغرفة.

### 2.1 اكتب معالج البث

**👟 تلميح البداية :** أضف كل اتصال إلى مجموعة `connections` على مستوى الوحدة، واجمع الإرسالات بـ `await asyncio.gather(...)` حتى لا يبطّئ المستمعون البطيئون الأسرعَين، وطرد المقبس عند خروجه.

```python
# chat.py (continued)
connections: set[websockets.WebSocketServerProtocol] = set()

async def broadcast(websocket):
    connections.add(websocket)
    try:
        async for message in websocket:
            for peer in connections - {websocket}:
                await peer.send(message)
    finally:
        connections.discard(websocket)
```

تقوم المجموعة بوظيفتين صعبتين: إزالة التكرار (لا يمكن للمقبس الانضمام إلا مرة واحدة، فـ `add` مُبطل أثر التكرار عمليًا) ومنحك حساب المجموعات — `connections - {websocket}` هو ببساطة "كل الباقين". `finally` هنا ليست اختيارية: إذا انفصل عميل في منتصف رسالة، تُنظَّف المجموعة مهما كانت طريقة خروج الحلقة، وإلا استمرت الأشباح في الاستقبال إلى الأبد. إرسال `async for` الداخلي متتالٍ (await واحد كل مرة)؛ ويأتي `asyncio.gather` في نسخة كل-غرفة بالخطوة 3 عندما تتنافس غرف متعددة.

**🎯 الناتج المتوقع :** مع عميلين متصلين، تظهر رسالة أحدهما عند الآخر فقط — المرسل لا يرى بثّه أبدًا.

**🩹 إذا لم يعمل :** إذا استلم *المرسل* نسخته أيضًا، فخطأ حساب الطرح `connections - {websocket}` (أو يدرج `peer` نفسه بصدق). إذا ما زال عميل منفصل يظهر في عدد الغرفة، فكتلة `finally` مفقودة. إذا أوقف عميل بطيء الجميع، فالإرسالات تحظر بالتتابع — وإنها ترقية `gather`.

### 2.2 تحقق من البث

**✅ قائمة التحقق**

- ✅ يعرض عرض ثنائي-العميل وصول كل رسالة بالضبط مرة واحدة عند العميل *الآخر*.
- ✅ لا يستلم المرسل رسالته الخاصة.
- ✅ فصل عميل ثم إعادة اتصاله يُظهر تبادلًا ثنائيًا جديدًا — بلا أشباح.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- البث هنا هشّ عن قصد: إذا علّق إرسال أحد الأقران، حظر `async for` الحلقة كلها. أين كان `asyncio.gather` (أو `gather(return_exceptions=True)`) ليغير ذلك، وما المقايضة التي يخفيها "أرسل للجميع، وافشل بصوت عالٍ"؟
- يستبعد `connections - {websocket}` المتكلم من رسالته. يعرض WhatsApp *رسالتك* أنت بأسلوب مختلف بدلًا من إخفائها. أي رسائل تصِل للمرسل قرار تصميم — ماذا يفشل إذا أخطأت ذلك في بروتوكول حقيقي؟

## الخطوة 3: الغرف — توجيه عبر مسار الاتصال

تطبيق الدردشة غرف، لا كتلة واحدة. تستخدم هذه الخطوة مسار عنوان الاتصال (`ws://localhost:8765/general` ← غرفة `general`) كمفتاح توجيه: تملك كل غرفة مجموعتها الخاصة من المقابس، وتنتشر الرسائل فقط إلى أعضاء تلك الغرفة.

### 3.1 اكتب موجِّه الغرف

**👟 تلميح البداية :** احتفظ بـ `dict[str, set]` من الغرفة ← المقابس؛ اقرأ الغرفة من `websocket.path`؛ انضم وبثّ ثم نظّف في `finally`.

```python
# chat.py (continued)
rooms: dict[str, set[websockets.WebSocketServerProtocol]] = {}

async def room_chat(websocket):
    room = websocket.path.strip("/") or "general"
    peers = rooms.setdefault(room, set())
    peers.add(websocket)
    try:
        async for message in websocket:
            targets = [peer for peer in peers if peer is not websocket]
            if targets:
                await asyncio.gather(*(peer.send(f"[{room}] {message}") for peer in targets))
    finally:
        peers.discard(websocket)

async def demo_rooms():
    seen = []

    async def listener(name, room):
        async with websockets.connect(f"ws://localhost:8765/{room}") as socket:
            await asyncio.sleep(0.05)  # let both clients join before anyone speaks
            await socket.send(f"{name} voted yes")
            try:
                with asyncio.timeout(1):
                    seen.append(await socket.recv())
            except TimeoutError:
                seen.append(f"{name} heard nothing")

    async with websockets.serve(room_chat, "localhost", 8765):
        await asyncio.gather(listener("alice", "general"), listener("bob", "off-topic"))

    print(sorted(seen))

asyncio.run(demo_rooms())
```

`websocket.path` معلومات توجيه مجانية: الانضمام إلى غرفة `off-topic` هو مجرد الاتصال بذلك العنوان، ويشتقّ السطر الأول في المعالج *الغرفة* بدلًا من تخزينها. تنشئ `rooms.setdefault(room, set())` الغرفة عند أول انضمام دون فرع if. يجمع `asyncio.gather(*(...))` إرسال كل رفيق-غرفة بالتزامن، فلا يستطيع مستمع بطيء واحد احتجاز الغرفة رهينة — والثمن أن الإرسال الفاشل يرفع، وتنظيف `finally` يُبقي الغرفة مرتبة رغم ذلك. يثبت `timeout(1)` في العرض العزل: بوب لا يسمع شيئًا لأن رسالة أليس ذهبت بصدق إلى غرفة مختلفة.

**🎯 الناتج المتوقع :** `['[general] alice voted yes', 'bob heard nothing']`.

**🩹 إذا لم يعمل :** إذا تسربت رسالة أليس إلى غرفة بوب، فمفاتيح `room` لم تختلف أبدًا — العرض ثبّت الاثنين على المسار نفسه. إذا علّق العرض كله بدلًا من انتهاء المهلة، فحارس `asyncio.timeout` مفقود أو لم ينضم `listener` قبل إرسال الرسالة (رفع `sleep`). إذا نمت غرفة إلى الأبد، فـ `peers.discard` في `finally` مفقود.

### 3.2 تحقق من توجيه الغرف

**✅ قائمة التحقق**

- ✅ تستقبل `general` و`off-topic` رسائلهما الخاصة فقط.
- ✅ الهبوط على `ws://localhost:8765` المجرد يقع في غرفة `general` الاحتياطية.
- ✅ انفصال مستمع يُسقطه من الغرفة: إعادة الاتصال تعيدك بعضوية انضمام جديدة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- اسم غرفة مجرد سلسلة حرة في العنوان. ماذا يحدث عندما يتصل عميل بـ `ws://localhost:8765/../../etc` — هل هي غرفة أم ثغرة أمان؟ ماذا كنت ستتحقق منه قبل الوثوق بـ `websocket.path`؟
- يخدم `serve` على منفذ واحد *كل* الغرف. تقسّم أنظمة الدردشة الحقيقية الغرف *عبر* خوادم وتوجّه الانضمام إلى الصحيح. كيف يبدو سجل غرف مشترك دائم التشغيل مقارنةً باحتضان كل غرفة في ذاكرة عملية واحدة؟

## الخطوة 4: السجل والحضور — ما يستحقه المنضمّون المتأخرون

الغرفة التي تنسى ماضيها عديمة الفائدة للقادم الجديد. تمنح هذه الخطوة كل غرفة سجل تاريخ بسقف-وإفلات، وتعيد تشغيله لكل منضمّ جديد، وتعلن الانضمامات والمغادرات فينجو الحضور من الثرثرة.

### 4.1 أضف السجل والحضور إلى معالج الغرفة

**👟 تلميح البداية :** احتفظ بـ `deque` (maxlen=50) لكل غرفة من `(sender, text)`؛ عند الانضمام، أعد تشغيله قبل حلقة الدردشة؛ وأرسل سطر حضور ملفوفًا في نفس البث المستخدم للدردشة.

```python
# chat.py (continued)
from collections import deque

history: dict[str, deque] = {}
HISTORY_SIZE = 50
PRESENCE = True

def log_message(room: str, sender: str, text: str) -> None:
    log = history.setdefault(room, deque(maxlen=HISTORY_SIZE))
    log.append((sender, text))

async def replay(websocket, room: str) -> None:
    for sender, text in history.get(room, deque()):
        await websocket.send(f"[history] {sender}: {text}")

async def room_chat_v2(websocket):
    room = websocket.path.strip("/") or "general"
    peers = rooms.setdefault(room, set())
    peers.add(websocket)
    sender = f"guest-{websocket.remote_address[1]}"
    log_message(room, "system", f"{sender} joined")
    await replay(websocket, room)
    for peer in peers - {websocket}:
        await peer.send(f"* {sender} joined {room}")
    try:
        async for message in websocket:
            log_message(room, sender, message)
            targets = [peer for peer in peers if peer is not websocket]
            if targets:
                await asyncio.gather(*(peer.send(f"{sender}: {message}") for peer in targets))
    finally:
        peers.discard(websocket)
        log_message(room, "system", f"{sender} left")
        for peer in peers:
            await peer.send(f"* {sender} left {room}")
```

`deque(maxlen=50)` هو بنية البيانات المثالية لـ"احتفظ بآخر N": الإلحاقات بعد السقف تُسقط الأقدم بصمت، فلا يمكن للتاريخ أن ينفخ. الترتيب مهم في تسلسل الانضمام — `replay` يسلّم القادم الجديد الماضي أولًا، *ثم* تعلن الغرفة القادم للباقين، فلا يرى أحد "انضم أليس" قبل أن يكون لدى أليس سياق. `f"guest-{port}"` اسم مستعار صادق رخيص: منفذ مصدر النظير فريد لكل اتصال عمليًا، وهو ما يتفوّق على سؤال الأسماء قبل أن يكون لديك نظام مصادقة.

**🎯 الناتج المتوقع :** توصيل عميل ثانٍ يطبع السجل المعاد تشغيله (الانضمام + الرسائل الأخيرة) ثم سطر `* guest-XXXX joined` للغرفة الحية؛ وانفصاله يطبع `* guest-XXXX left`.

**🩹 إذا لم يعمل :** إذا رأى القادم الإعلان قبل السجل، فسطرا `replay` والبث انقلبا. إذا أُعيد السجل *بلا نهاية*، فـ `maxlen` مفقود — يكبر الـ deque إلى الأبد. إذا خُزِّن انضمام كـ `system` لكن أُعيد كـ `history`، فاسم `sender` المشتق للانضمامات يختلف عن سطور الدردشة وفق التصميم؛ أبقِ الاثنين بنفس التنسيق أو قرأ السجل كصوتين.

### 4.2 تحقق من السجل والحضور

**✅ قائمة التحقق**

- ✅ يستلم القادم جديد الأرشيف *قبل* أي رسالة حية.
- ✅ بعد 60 رسالة، يبقى السجل عند 50 — الأقدم يُسقط والأحدث يبقى.
- ✅ يُنتج الانضمام والمغادرة كلٌّ سطر حضور `* ...` واحد بالضبط لبقية الغرفة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- هذا السجل ذاكرة-لكل-عملية: أعد تشغيل الخادم وتصبح الغرفة صماء تجاه ماضيها. كيف تبدو خطوة "ثم قاعدة بيانات"، وأين تختلف فعليًا ذاكرة *سجلية البنية* عن ذاكرة *مُصدّرة الأحداث*؟
- الحضور هنا مُبلَّغ ذاتيًا: عميل ينفصل دون تشغيل `finally` (مصدر طاقة قُطع) يبث `left` فقط إذا جرى التنظيف. ما الذي يميز "مات الاتصال" عن "انسحب المستخدم" على مستوى البروتوكول، وأيهما أأمن للعرض كـ `left`؟

## الخطوة 5: عميل طرفية حقيقي — دردش عبر طرفيتين

اكتمل الخادم؛ الآن تحتاج الناس لفم. تكتب هذه الخطوة `chat_client.py`، عميلًا مقادًا من stdin يطبع ما تقوله الغرفة ويرسل ما تكتبه — شغّله في طرفية ثانية بينما يخدم `chat.py` في الأولى، وستدردش حقًا.

### 5.1 اكتب العميل

**👟 تلميح البداية :** كوروتينان — أحدهما يقرأ من المقبس إلى الأبد، والآخر يقرأ `sys.stdin` عبر المنفّذ — و`asyncio.gather` يبقي الاثنين جنبًا إلى جنب.

```python
# chat_client.py
import asyncio
import sys

import websockets

async def print_incoming(socket):
    async for message in socket:
        print(f"\r{message}\n> ", end="")

async def read_stdin(socket):
    loop = asyncio.get_running_loop()
    while True:
        line = await loop.run_in_executor(None, sys.stdin.readline)
        if not line:
            break
        await socket.send(line.strip())
        await asyncio.sleep(0)

async def main():
    url = sys.argv[1] if len(sys.argv) > 1 else "ws://localhost:8765/general"
    async with websockets.connect(url) as socket:
        await asyncio.gather(print_incoming(socket), read_stdin(socket))

asyncio.run(main())
```

`loop.run_in_executor(None, sys.stdin.readline)` هي الحيلة التي تجعل `input()` الحاجب يتعايش مع المقبس: الاستدعاء الحاجب يجري على خيط عامل بينما تفعل حلقة الأحداث كل شيء آخر، ويستأنف `await` عند وصول سطر أخيرًا. خدعة `\r` + `> ` تعيد رسم سطر الموجه فلا تُكتَب الرسائل الواردة فوق كتابتك. يدمج `gather` الحلقتين، وعندما تنتهي إحداهما (تغلق stdin بـ Ctrl+D)، يتفكك العميل كله بنظافة.

**🎯 الناتج المتوقع :** الطرفية A تشغّل `uv run python chat.py` وتعرض سجل خادم حيًا؛ والطرفية B تشغّل `uv run python chat_client.py`، وتكتب `hello`، وتطبع عملاء A `guest-XXXX: hello` — بموجه جديد كل مرة.

**🩹 إذا لم يعمل :** إذا اتصلت B لكن A لم تُظهر رسالة أبدًا، فيجب أن تشترك العمليتان في المنفذ الدقيق نفسه وأن يطابق مسار غرفة عنوان العميل — تحقق أن سطر خدمة `room_chat_v2` هو ما *يُقدَّم فعلًا*. إذا كتبت فوق الرسائل الحية، فإعادة رسم `\r` مفقودة من `print_incoming`. إذا عرض إغلاق B كًل A، فارتفع `gather` على إلغاء-عند-أول-اكتمال — `readline` الحاجبة لم تنتهِ، فــ Ctrl+D من B هو المهم.

### 5.2 تحقق من الدردشة الحية

**✅ قائمة التحقق**

- ✅ الطرفية A: `uv run python chat.py` تخدم `ws://localhost:8765`.
- ✅ الطرفية B: يتصل `uv run python chat_client.py` ويظهر موجهه `> `.
- ✅ تسجيل الكتابة في B يصدّى كـ `live guest-XXXX: <text>` في A؛ ويطبع العميل نفسه رسائل الجميع فوق `> ` جديد.
- ✅ انضمام عميل ثانٍ يطلق سطري `* guest-XXXX joined` عند العميلين — لديك غرفة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- الرسائل هنا غير مصادَقة وغير مشفرة — أي شخص على الشبكة يستطيع القراءة أو الكلام. مرّ على الأماكن الثلاثة التي ستضيف فيها هوية (الاسم عند الاتصال)، وسرية (TLS)، وثقة (فحوصات الأصول) لو شحنت هذا إلى شبكة محلية.
- يتعارض العميل والموجه على السطر نفسه. أين ينكسر هذا التصميم مع رسائل *ثنائية* أو رسائل *أطول من عرض الطرفية* — وما الذي كان سيتطلبه TUI لائق (مثل `curses`) من هذا العميل الناجح-السعيد الذي يتجاوزه؟

## ⚠️ المآزق الشائعة

- **مقابس لا تغادر المجموعة أبدًا.** دون `finally: peers.discard(...)`، يبقى عميل منفصل "حاضرًا" ويرفع `send` له إلى الأبد. الإصلاح: التنظيف يعمل دائمًا، حتى عند الخطأ.
- **إرسالات حاجبة تجوّع الغرفة.** إرسال مستمع بطيء يمسك الجميع إذا انتُظر واحدًا-تلو-واحد. الإصلاح: `asyncio.gather` لكل رسالة — وكن مستعدًا لرفع `gather` عند أول فشل (`return_exceptions=True` إذا أردت الباقي ينجز).
- **أسماء غرف موثوق بها عمياء.** `websocket.path` مدخلات يقدّمها المهاجم. الإصلاح: قائمة بيضاء لأسماء الغرف عند الانضمام، وإلا أصبحت "الغرفة" ناقل حقن نظام-ملفات/توجيه.
- **إخفاء هوية المرسل.** اسم مستعار مبني على المنفذ فريد لكنه قابل للانتحال والنسيان. الإصلاح: اطلب رسالة أولى `HELLO name` وتوقف عن الوثوق به بعد وجود المصادقة.
- **سجل بلا سقف.** يقصّ `deque(maxlen=N)` عند الكتابة أبدًا لا عند القراءة — أي شيء بدونه ينمو بلا حد لكل غرفة.

## ما بنيته للتو

نظام دردشة بطرطيتين عملي: معالج صدى غير متزامن، وبثًا قائمًا على الغرف عبر مسارات العناوين، وسجلًا محدودًا يُعاد للأواخر وصولًا، وإعلانات حضور، وعميل stdin — كله صغير بما يكفي ليُحمل في رأسك. الدرس القابل للنقل هو *شكل* الأنظمة الحية: حلقة تنتظر، ومجموعة أقران متصلين، وحالة مشتقة (الغرف)، ودلالات إعادة تشغيل (سجل/حضور). كل لعبة متعددة اللاعبين، ولوحة معلومات، ومحرر تعاوني هو نفس الهيكل تحت وسائل راحة إضافية.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/websocket-chat/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/websocket-chat) في مستودع الدورة نسخة أكمل من الكود أعلاه، مع دردشة ويب متعددة الغرف وملف إرشاد TLS. استنسخه، أو افتح المستودع كاملًا في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وشغّله من هناك.
:::

## إلى أين تذهب من هنا

- حوّل الحضور إلى حدث *مصنّف* — `typing` و`online` و`away` — واعرض `guest-XXXX is typing…` فقط بينما يكون صادقًا، بمهلة 3 ثوانٍ.
- استبدل اسم `guest-port` بمصافحة `HELLO` كأول رسالة، ثم ارفض الرسائل المرسلة قبلها.
- أبقِ السجل في ملف SQLite (أو ملف سجل-البنية) حتى تحتفظ إعادة التشغيل بالغرفة؛ سؤال الخطوة 4 أطّره بالضبط كيف.
- لفّ الخادم في `uvicorn` مع ملاحظات `wss`/TLS وقائمة بيضاء لأسماء الغرف، واسمِّه ذا شكل إنتاجي.

## شارك مشروعك مع الصف

بَنيت شيئًا تفتخر به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع قدّمها طلاب آخرون — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل: عمل fork للمستودع، وإنشاء فرع، والالتزام بملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓