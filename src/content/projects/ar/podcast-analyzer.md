---
title: " محلل البودكاست"
description: "حوّل ولخّص واستخرج الأفكار من حلقات البودكاست مع كشف المواضيع."
difficulty: "intermediate"
estimatedMinutes: 60
tags: ["cli", "text-processing", "csv", "regex"]
learningObjectives:
  - "حلّل نص حوار بودكاست بخواتم زمنية إلى أدوار متحدثين"
  - "افصل المقدمين عن الضيوف بمقارنة أسماء المتحدثين بقائمة الجرد"
  - "قيّم النص مقابل مجموعات كلمات مفتاحية للمواضيع باستخدام Counter"
  - "ألّف ورقة حقائق للحلقة وصَدّرها بصيغة CSV"
prerequisites: ["python-101/strings", "python-101/file-io", "python-101/sets", "python-101/functions"]
---

# محلل البودكاست

تنتج البودكاستات ساعات من الصوت وتقريبًا لا بنية. سواء كنت مستمعًا يقرر أي حلقة يتخطى، أو مقدمًا يريد قراءة بيانات على حلقاته، فالمنتج المطلوب هو نفسه: ورقة *حقائق للحلقة* ، من هم الضيوف، وما المواضيع التي هيمنت فعلًا على الحوار، وما العبارات التي تكررت. يبني هذا المشروع أداة سطر أوامر تنتج ورقة الحقائق هذه من النص: تحلل أدوار المتحدثين، وتفصل المقدمين عن الضيوف، وتقيّم الكلمات مقابل مجموعات كلمات المواضيع، وتكتب ملخصًا في ملف واحد إضافة إلى CSV مقروء آليًا. لا صوت، ولا ML، ولا مفاتيح API.

يفترض هذا Python 101 ، السلاسل، والمجموعات، وإدخال/إخراج الملفات، والدوال. لا شيء بعد ذلك. هذا اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة.

## 🎯 ما ستفعله

1. حلّل نص حوار بصيغة `[الطابع الزمني] المتحدث: الكلمات` إلى أدوار منظَّمة.
2. افصل المقدمين عن الضيوف بقائمة جرد مقدمين معروفة ، واكتشف الأسماء غير المدرجة فيها.
3. احسب وزن ذكر كل موضوع بتقييم النص مقابل مجموعات كلمات مفتاحية.
4. استخرج حصة كل ضيف من الحوار وأهم الكلمات المفتاحية في الحلقة.
5. اكتب `episode_notes.txt` مقروءًا و`topics.csv` يمكنك فتحه في أي جدول بيانات.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي ، معالجة نصية خالصة على ملف نص فلسي تتحكم فيه، لذا فإن حلقة "ضع نصًا، احصل على ملفي مخرجات" هي عادة طرفية، ويهبط ملف CSV كملف حقيقي.

**GitHub Codespaces** يعمل بشكل مطابق: افتح [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) وتشغَّل الأوامر نفسها في نافذة متصفح مع Node وPython و`uv` مثبّتة مسبقًا.

**Google Colab وKaggle Notebooks وBinder يشغّلون كل خطوة بأمانة** ، لا GPU ولا أسرار ولا ملفات ضخمة ، مقابل نص حلقة العينة المرافق للدورة (محادثة مزيفة واقعية مكتوبة يدويًا). التحفظ الصادق: يحلل الدفتر النص المرافق بدلًا من صوت تسجّله أنت. تحويل الكلام إلى نص فعلي لتسجيلاتك الخاصة يحتاج أداة منفصلة؛ كل ما بعد *النص* هو بالضبط ما يشغّله الدفتر فعليًا.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/podcast-analyzer/notebook.ar.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/podcast-analyzer/notebook.ar.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fpodcast-analyzer%2Fnotebook.ar.ipynb)

## الإعداد

كل ما تحتاجه قبل عدّ الكلمات الأولى: `uv`، وحلقة عينة واحدة، وقائمة جرد للمقدمين.

### ثبّت `uv` وجهّز المشروع

**macOS / Linux** (الطرفية):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

أغلق طرفيتك وأعد فتحها، ثم:

```bash
uv --version
mkdir podcast-analyzer && cd podcast-analyzer
uv init --bare
```

صفر حزم إضافية ، مكتبة قياسية خالصة.

### اكتب حلقة عينة

احفظ هذا كـ`episode.txt`:

```
[00:00] Maya: Welcome back to The Indie Show, this episode is about scaling, sort of.
[00:14] Maya: Our guest today is Jonas, who built a tiny publishing tool into a real business.
[00:30] Jonas: Thanks, Maya. Let's be honest, the scaling story is mostly boring — paying down tech debt.
[00:52] Jonas: The interesting part is pricing. We raised prices three times in two years.
[01:10] Maya: Pricing feels like the hardest lever. What about marketing?
[01:22] Jonas: Marketing is a distribution problem. SEO and word of mouth, mostly word of mouth.
[01:40] Maya: Let's talk about remote work culture on a small team.
[01:55] Jonas: Remote culture is trust, honestly. You either have it or you're doing it wrong.
[02:10] Maya: One last thing — taking breaks and managing burnout in an early startup.
[02:24] Jonas: Burnout is real. Rest is not a reward, it's a requirement.
[02:38] Maya: That's the episode. Jonas, thank you for your time.
[02:47] Jonas: Thank you. Keep shipping. That's it, that's the whole trick.
```

احفظ `hosts.txt` باسم مقدم واحد في كل سطر:

```
Maya
```

اكتب `topics.py` (مجموعات الكلمات المفتاحية ، تسميات المواضيع مقابل كلماتها المثيرة):

```python
# topics.py
TOPICS = {
    "pricing": ["price", "pricing", "revenue", "money"],
    "marketing": ["marketing", "seo", "word of mouth", "growth"],
    "culture": ["culture", "remote", "trust", "team"],
    "wellness": ["burnout", "rest", "breaks", "stress"],
}
```

**✅ قائمة التحقق**

- ✅ `uv --version` يطبع رقم إصدار.
- ✅ `episode.txt` موجود (12 دورًا)، و`hosts.txt` يحتوي `Maya` فقط، و`topics.py` يعرّف أربع مجموعات مواضيع.
- ✅ يمكنك بالفعل تخمين النتيجة: يجب أن يتجاوز `pricing` و`wellness` `culture` بفارق واضح ، وستخبرك الأداة بذلك قريبًا.

## الخطوة 1: حلّل نص الحلقة

نفس شكل أي أداة اجتماعات، مع لمسة واحدة: تحمل نصوص البودكاست ملف *قائمة جرد المقدمين*، ويجب على المحلل أن يُبقي كل اسم متحدث نقيًا لأن تقسيم الخطوة 2 بين المقدم والضيف يعتمد على مساواة سلسلة الاسم الدقيقة.

### 1.1 اكتب مُحلِّل الأدوار

```python
# parse.py
from pathlib import Path

def parse_line(line: str) -> dict:
    line = line.strip()
    time_s = line.split("]", 1)[0].lstrip("[")
    rest = line.split("]", 1)[1].strip()
    speaker, _, text = rest.partition(":")
    return {"time": time_s, "speaker": speaker.strip(), "text": text.strip()}

def load_episode(path: str) -> list[dict]:
    return [parse_line(l) for l in Path(path).read_text().splitlines() if l.strip()]

def load_hosts(path: str) -> set[str]:
    return {l.strip().lower() for l in Path(path).read_text().splitlines() if l.strip()}

if __name__ == "__main__":
    turns = load_episode("episode.txt")
    print(len(turns), "turns")
    print(load_hosts("hosts.txt"))
```

تقوم `partition(":")` بالعمل الشاق مجددًا ، النقطتان الأولى تفصلان المتحدث عن الكلام، والنقطتان *داخل* الرسالة (تخيّل `01:40`، أو عنوانًا مثل `The Scraper: Part Two`) تبقيا في مكانهما. تحوّل `load_hosts` قائمة الجرد فورًا إلى أحرف صغيرة في `set`، فيكون اختبار عضوية الخطوة 2 `in` بوقت ثابت مقابل اسم *قنوني* بأحرف صغيرة ، حالة سيئة واحدة "mAYA" في قائمة الجرد ستضع المقدمة في قائمة الضيوف إلى الأبد.

**👟 تلميح البداية :** حلّل أولًا، واطبع `turns[1]`، *وانظر* إلى الشكل قبل أي تحليل ، `speaker: 'Maya'`، `text: 'Our guest today is Jonas…'`، دون أقواس أو نقطتين.

**🎯 الناتج المتوقع :** `12 turns`، وتُطبع مجموعة المقدمين `{'maya'}` لـ`hosts.txt`. أول دور تجريبي قاموس نظيف بالمفاتيح الثلاثة.

**🩹 إذا لم يعمل :** إذا كان `speaker` ما يزال يحمل مسافة بادئة، فـ`.strip()` بعد `partition` مفقود. إذا اشتعل `ValueError` برسالة `not enough values to unpack`، فثمة سطر بلا نقطتين إطلاقًا ، نصوص المقابلات تقطع الدور أحيانًا إلى نصفين؛ التخطي مع تحذير أفضل من الانهيار، لكن اقرر *قبل* إضافة ملف عاشر.

### 1.2 تحقّق من التحليل

**✅ قائمة التحقق**

- ✅ `load_episode` يُرجع 12 قاموسًا بالمفاتيح `time` و`speaker` و`text`.
- ✅ `load_hosts` يُرجع `set` بأحرف صغيرة ، `{'maya'}` لا `{'Maya'}`.
- ✅ دور تحتوي رسالته نقطتين يظل محتفظًا برسالته كاملة.
- ✅ الأسطر الفارغة لا تصبح أبدًا أدوارًا فارغة، وقائمة الجرد بلا آثار مسافات.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تقلّص قائمة الجرد إلى مجموعة بأحرف صغيرة، لكن سلاسل *المتحدثين* من النص ما زالت مختلطة الأحرف. إذا قال سطر ضيف `[01:10] maya: ...` (بأحرف صغيرة من نسخة صوتية رديئة)، فأي خطوة تنكسر بصمت لاحقًا ، وما الذي يصلحه `speaker.lower()` في وقت التحليل؟
- نتعامل مع `[00:14]` كختم «دقيقة:ثانية» للعرض فقط. إذا أردت حساب دقائق كلام دقيقة لكل متحدث (`00:47` ناقص `00:30`)، فما الذي يجب أن تغيّره في نوع حقل `time`، وما التحليل الذي يفرضه ذلك؟

## الخطوة 2: افصل المقدمين عن الضيوف

تجعل قائمة الجرد تصنيف المقدم/الضيف اختبار عضوية في مجموعة ، `speaker.lower() in hosts`. كل ما ليس مقدمًا معروفًا ضيف، والاسم *الذي لا يظهر في أي مكان* يستحق تعليمًا صاخبًا، لأن "الشخص الذي تحدث ليس في أي قائمة" هو تحديدًا البيانات التي يخطئ فيها عنوان حلقة مكتوب يدويًا.

### 2.1 صَنِّف كل متحدث

```python
# roster.py
from parse import load_episode, load_hosts

def classify(episode: str, hosts_file: str) -> dict[str, dict]:
    hosts = load_hosts(hosts_file)
    people = {}
    for t in load_episode(episode):
        name = t["speaker"].lower()
        row = people.setdefault(name, {"speaker": t["speaker"], "role": None,
                                       "words": 0, "turns": 0})
        row["role"] = "host" if name in hosts else "guest"
        row["words"] += len(t["text"].split())
        row["turns"] += 1
    return people

if __name__ == "__main__":
    people = classify("episode.txt", "hosts.txt")
    for name, row in sorted(people.items()):
        print(f"{row['speaker']:<6} {row['role']:<6} {row['words']:>3} words  {row['turns']} turns")
```

المصنّف قاموسٌ من الصفوف *تعدّله في مكانه* ، `setdefault` يُنشئ صف كل متحدث عند أول ظهور لاسمه، ثم يرفع كل دور لاحق الكلمات والأدوار. يُحسب الدور *في كل دور* من فحص `name in hosts` الحي، فاسم يظهر في النص قبل تحميل قائمة الجرد (أو بحالة مختلفة) ما يزال يتحلّ بشكل صحيح ، ولأن الدور يُقرر لكل صف بعد التحميل ولا يُخزَّن مؤقتًا أبدًا، لا يوجد "كان مقدمًا عندما رأيته أول مرة" متخلف.

**👟 تلميح البداية :** شغّل التصنيف وتفقّد الناتج ، يجب أن تكون Maya `host` وJonas `guest`؛ ثم احذف `Maya` من `hosts.txt` مؤقتًا وأعد التشغيل. أن تتحوّل دورَاها إلى `guest` *وأن* تحتوي قائمة الضيوف الآن على مقدمتك نفسها هو بالضبط الفشل الذي تحرس منه أداة حقيقية.

**🎯 الناتج المتوقع :** `Maya  host   71 words  7 turns` و`Jonas  guest  57 words  5 turns` ، صفان، واحد لكل متحدث مميز، ولكل منهما دور.

**🩹 إذا لم يعمل :** إذا قال الصفان `guest`، فقائمة الجرد لا تُحمَّل ، تحقق أن `hosts.txt` تنتهي بسطر جديد وأن مسار الملف يطابق `load_hosts`. إذا انقسم اسم إلى شخصين (`maya` و`Maya`)، فإن تطبيع `speaker.strip()`/`.lower()` لا يطبَّق في `classify` ، كل قراءة يجب أن تمر عبر نفس القمع قبل `setdefault`.

### 2.2 تحقّق من الانقسام

**✅ قائمة التحقق**

- ✅ Maya = مقدمة، Jonas = ضيف، ولا يظهر صف لشخص ثالث.
- ✅ حذف مقدم من `hosts.txt` يقلب دورها فورًا عند إعادة التشغيل ، يقرأ التصنيف قائمة الجرد من جديد في كل مرة.
- ✅ دوران لنفس المتحدث يتجمعان في صف واحد (`words` و`turns` ينموان معًا).
- ✅ يمكنك قول جملة واحدة تشرح لماذا يُعاد حساب `row["role"]` في كل دور بدلًا من ضبطه مرة واحدة عند إنشاء الصف.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- نص بودكاست مقدمه *غائب من ملف قائمة الجرد* يحوّل المقدم بصمت إلى ضيف ، وكل ورقة حقائق منشورة ستدرج مقدمك على أنه ضيفك. ما الحارس الأدنى الذي يجعل الأداة ترفض إنتاج ورقة حقائق حتى يُصنَّف كل متحدث في النص بالاسم؟
- المقدمون معرّفون بملف؛ والضيوف بالخصم. اقلب النموذج: ماذا يحدث لأسطر "الانتحال الصوتي" مثل `[01:40] fake_maya: ...` ، وأي نموذج (قائمة يُسمح بها للمقدمين مقابل قائمة يُمنع فيها الضيوف) يجعل الانتحال *مرئيًا* بدلًا من امتصاصه؟

## الخطوة 3: قيّم المواضيع

كل بودكاست حوار، لكن "عم كانت هذه الحلقة؟" مسألة عدّ. تسجّل هذه الخطوة النص كاملًا مقابل مجموعة كلمات كل موضوع ، كل مرة تظهر كلمة تسعير في النص، تنمو درجة التسعير. إنها تلازمُ كلماتٍ عمدًا سطحي: بالضبط ما يجب أن تكون عليه التمريرة الأولى الرخيصة الشفافة قبل إدخال أي شيء أشد فخامة.

### 3.1 عدّ إصابات الكلمات المفتاحية للمواضيع

```python
# topic_score.py
from collections import Counter
from parse import load_episode
from topics import TOPICS

def score_topics(episode: str) -> Counter:
    all_words = " ".join(t["text"] for t in load_episode(episode)).lower()
    scores = Counter()
    for topic, words in TOPICS.items():
        for w in words:
            scores[topic] += all_words.count(w)
    return scores

if __name__ == "__main__":
    for topic, score in score_topics("episode.txt").most_common():
        print(f"{topic:<10} {score}")
```

حلقتان في العمق، صف واحد للخارج: يربط `TOPICS` التسمية بكلماتها المثيرة، ويُعدّ كل ظهور حرفي لكلمة عبر `all_words.count(w)`. الترتيب مقصود ، يعطي `Counter` مع `.most_common()` قائمة مواضيع مرتّبة بصفر كود إضافي، حتى يكون "ما الذي هيمن على الحلقة" حرفيًا العنصر عند الفهرس صفر.

**👟 تلميح البداية :** قبل التشغيل، عدّ `pricing` يدويًا في `episode.txt` (يجب أن تجد `price`، و`pricing` ×2، وأصفار ذكر `revenue`) وتأكد أن الإجماليات المطبوعة تطابق ، ثق بالأداة، لكن بعد أن تجتاز فحصًا يدويًا مرة واحدة.

**🎯 الناتج المتوقع :** أربعة أسطر مرتبة تنازليًا ، `pricing` و`wellness` في الأعلى (لكل منهما حفنة إصابات)، و`culture` في المنتصف، و`marketing` أدنى ، مع تطابق الإجماليات الدقيقة عدّك اليدوي للكلمات المثيرة.

**🩹 إذا لم يعمل :** إذا سجّل موضوع 0 وهو لا يجب، فكلمته المثيرة مكتوبة خطأً في `topics.py` أو تظهر ببادئة (`pricing` يطابق `pricing` لا `priced`) ، `count()` تطابق سلسلة حرفي، لذا إما أضف التنويع إلى `TOPICS` أو اقبل الإفراط الحرفي الموثّق. إذا كان كل موضوع ضخمًا، فكلمة مثيرة مثل `team` سلسلة فرعية من `teams` و`steam` وغيرهما ، تعدّ `count("team")` كلهن؛ فكّر في عدّ `word in wordlist` بعد التقسيم بدلًا من عدّ السلاسل الفرعية في النص الخام.

### 3.2 تحقّق من تقييم المواضيع

**✅ قائمة التحقق**

- ✅ الترتيب الناتج يطابق عدّك اليدوي للكلمات المثيرة.
- ✅ درجة كل موضوع تساوي مجموع تكرارات كلماته المفتاحية ، يمكنك إعادة حساب كل رقم يدويًا.
- ✅ موضوع بلا كلمات مطابقة يسجّل 0 *ويبقى ظاهرًا* في الترتيب (الحاضر-عدا-الصفر أفضل من الغائب-المفترض).
- ✅ يمكنك شرح سطر الكود الذي يحوّل العدّات الخام إلى قائمة مرتّبة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يستخدم التقييم عدّ السلاسل الفرعية، فيسمع "pricing" *الاقتصادي* و"price" *العاطفي* الكلمة نفسها. ما التغيير ، التقسيم إلى قائمة كلمات واختبار `w in words` ، الذي يمنع `priced` و`priceless` من تغذية الدرجة، وما ثمنه في البساطة؟
- المواضيع الأربعة في `TOPICS` ثابتة بالملف. أي حلقة تفشل بها هذه الأداة بأمانة ، مثلًا حلقة عن "السلامة في الذكاء الاصطناعي" بلا أيٍّ من مواضيعك الأربعة ، وماذا يخبرك ذلك عن مجموعات الكلمات المفتاحية مقابل نموذج يستطيع تسمية مواضيع مفتوحة النهاية؟

## الخطوة 4: استخرج حصة الضيف والعبارات المفتاحية

عمودا ورقة الحقائق الباقيان: مقدار *وقت البث* الذي حازه كل متحدث، والعبارات التي *تكررت* ، جواهر "أنت تظل تقول X" التي تجعل الحلقة لا تُنسى. تعيد حصة الضيف استخدام صف قائمة الجرد من الخطوة 2؛ والعبارات المفتاحية هي ببساطة الكلمات الأكثر شيوعًا التي *ليست* حشوًا إنجليزيًّا شائعًا.

### 4.1 احسب الحصة وأهم الكلمات المفتاحية

```python
# highlights.py
from collections import Counter
from roster import classify

STOP = {"the", "a", "an", "and", "or", "but", "is", "are", "was", "were",
        "to", "of", "in", "on", "for", "with", "it", "that", "this", "you",
        "your", "i", "we", "us", "not", "so", "really", "just", "about"}

def guest_share(people: dict) -> list[tuple]:
    guests = [(r["speaker"], r["words"]) for r in people.values() if r["role"] == "guest"]
    total = sum(words for _, words in guests) or 1
    return [(name, words / total) for name, words in guests]

def top_words(episode: str, n: int = 6) -> list[tuple]:
    words = Counter()
    for t in load_episode(episode):
        words.update(w for w in t["text"].lower().split() if w not in STOP)
    return words.most_common(n)
```

`words.update(w for w in ...)` هي الخطوة التي تسبق الخطوة كلها: يقبل `Counter.update` متواليةً ويعدّ كل كلمة فيها، والمولّد يفلتر كلمات الحشو *لحظة العدّ*، فلا يهبط حشو إلى العداد أبدًا. مجموعة الحشو قشور نثرية منتقاة يدويًا؛ يطبّع `guest_share` كلمات كل ضيف مقابل إجمالي فئة الضيوف (`or 1` يغطي حلقة مقدمين فقط)، فتظل الأرقام دومًا مجموعها 100%.

**👟 تلميح البداية :** شغّل `top_words` على الحلقة ثم تصفح النص ، كل كلمة مفتاحية مطبوعة يجب أن تكون كلمة *محتوى* يمكنك الإشارة إليها ("pricing"، "trust"، "burnout"…)، ولا أثر لـ`the`/`and`.

**🎯 الناتج المتوقع :** `guest_share` → Jonas `100%` (ضيف واحد، فيحوز كل وقت بث الضيوف)؛ `top_words` → ست كلمات محتوى مثل `pricing`، `trust`، `burnout`، `rest`، `marketing`، `culture` ، بلا كلمات حشو، بتردد تنازلي.

**🩹 إذا لم يعمل :** إذا فاض `top_words` بـ`the`، `and`، `really`، فرمز نحوي ليس في `STOP` ، أضفه؛ المجموعة بيانات صيانتها. إذا انقسمت `guest_share` خطأً مع حلقة ضيوف كاملة، فالمجمّع عدّ `guests` فقط ، قرّر (واطبع) ما إذا كان المقام *كل* المتحدثين أو الضيوف فقط؛ لـ"وقت بث الضيوف"، الضيوف هما المقام الصادق.

### 4.2 تحقّق من الإبرازات

**✅ قائمة التحقق**

- ✅ كل كلمة مفتاحية في `top_words` كلمة محتوى يمكنك تحديد موقعها في النص.
- ✅ مجموع `guest_share` يساوي 100% عند وجود ضيف واحد على الأقل، ولا شيء مقلق عند عدم وجود ضيوف.
- ✅ إضافة كلمة حشو مختلقة إلى `STOP` تزيلها من كل تشغيل مستقبلي ، المجموعة إعداد حي، لا لمرة واحدة.
- ✅ يتغير ترتيب الكلمات المفتاحية عند إضافة سطر `pricing` إضافي ، فالمعداد يحدث فعلًا.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- قائمة الحشو *حكمك أنت* ("just"، "really" قشور بالنسبة لك). ما عبارة تحتفظ بها قائمتك خطأً أو تحذفها خطأً ، وهل يجعل ذلك مخرجات "الكلمة المفتاحية" منحازة؟ من يملك ذلك الانحياز؟
- تستخدم `guest_share` *كلمات لكل ضيف*، مطابقة في روحها وقت بث أداة الاجتماعات. ما البديل الذي قد يريده منتج ، أدوارًا، أو أطول عبارة مفردة، أو كلمات في الدقيقة ، وأيها يمجّد ضيفًا يتحدث ببطء لكنه يحتكر؟

## الخطوة 5: ألّف ورقة الحقائق وصَدّر

اكتمل التحليل؛ المنتج ملفان ، `episode_notes.txt` مقروء إنسانًا يلصقه منتج في ملاحظات العرض، و`topics.csv` ينسجم مع أي جدول بيانات لمقارنة موسم كامل. التأليف هو نفس حركة "اجمع من أجزاء مُختبرة سلفًا" في كل خطوة لاحقة سابقة.

### 5.1 اكتب المخرجاتَين

```python
# publish.py
import csv
from collections import Counter
from parse import load_episode
from roster import classify
from topic_score import score_topics
from highlights import guest_share, top_words

def publish(episode: str, hosts_file: str) -> None:
    turns = load_episode(episode)
    people = classify(episode, hosts_file)
    topics = score_topics(episode)
    notes = [
        f"EPISODE FACT SHEET — {len(turns)} turns",
        "\nSpeakers:",
        *[f"  {r['speaker']} ({r['role']}, {r['words']} words)"
          for r in people.values()],
        "\nTopics (ranked):",
        *[f"  {t}: {s}" for t, s in topics.most_common()],
        "\nGuest airtime share:",
        *[f"  {n}: {p:.0%}" for n, p in guest_share(people)],
        "\nTop keywords: " + ", ".join(w for w, _ in top_words(episode)),
    ]
    open("episode_notes.txt", "w").write("\n".join(notes))
    with open("topics.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["topic", "word_hits"])
        w.writerows(topics.most_common())

if __name__ == "__main__":
    publish("episode.txt", "hosts.txt")
    print("wrote episode_notes.txt and topics.csv")
```

صيغتا مخرجات، مصدرُ أرقامٍ واحد: نتائج الدوال *نفسها* (`classify`، `score_topics`، …) تغذّيان الملف البشري وCSV معًا، فلا يمكن لورقة حقائق تقول `pricing: 4` وصف CSV يقول `pricing,4` أن يختلفا أبدًا. يتولى `csv.writer` الاقتباس لك (اسم موضوع بفاصلة ، `"culture, remote"` ، ينجو كخلية واحدة)، وهو ما يفسده `",".join` ساذج بصمت.

**👟 تلميح البداية :** اكتب الملفين، ثم *افتح CSV في جدول بيانات* (أو `python -c "print(open('topics.csv').read())"`) وتأكد من عمودين وأربعة صفوف وبلا مفاجآت اقتباس ، عرض الجدول فحص حقيقي لا مسرح.

**🎯 الناتج المتوقع :** `episode_notes.txt` يحتوي الترويسة، والمتحدثين بدَورَيهما وعدّادَي كلماتهما، والمواضيع المرتّبة، وJonas عند `100%`، وقائمة الكلمات المفتاحية ، إضافة إلى `topics.csv` بترويسة `topic,word_hits` وأربعة صفوف بيانات تطابق الترتيب المطبوع سطرًا بسطر.

**🩹 إذا لم يعمل :** إذا لم تطابق صفوف CSV `episode_notes.txt`، فكِتابتا الملفين استخدمتا *استدعاءات مختلفة* (أعيد تقييمها في مكان ما) ، كلاهما يجب أن يسحب من متغير `topics` المحسوب مرة واحدة في الأعلى. إذا وصلت خلية موضوع مقتبسة رغم رغبتك، فهذا `csv` يؤدي عمله (حماية الفواصل)؛ وإذا كانت الخلية *خاطئة*، فـ`w.writerows` يكتب tuples من `most_common()` يجب أن تطبع ترتيبها قبل الوثوق بها.

### 5.2 تحقّق من النشر

**✅ قائمة التحقق**

- ✅ الملفان موجودان بأرقام متطابقة ، تتفق ورقة الحقائق وCSV على كل درجة موضوع.
- ✅ يُفتح CSV كـ5 صفوف × عمودين في جدول بيانات، مع `topic,word_hits` في الأعلى.
- ✅ إعادة توليد ملف محذوف أمر واحد (`uv run python publish.py`) ، المخرجات مشتقّة، لا تُدار يدويًا أبدًا.
- ✅ إعادة التشغيل على حلقة مختلفة ستنتج ملفين مختلفين لكن بصيغة لا تزال سليمة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يقدم `episode_notes.txt` و`topics.csv` البيانات نفسها مرتين. هل التكرار هدر ، أم هو *الميزة* (ملف للبشر، وملف للآلات)؟ سمِّ مستهلكًا ثالثًا (سكربت مقارنة مواسم) وأخبرني أي ملف يجب أن يقرأ.
- عمود "topic" تسمية اخترتها؛ يسجّل CSV الإصابات فقط. إذا اختلفت ملفات `TOPICS` لحلقتين مختلفتين، فلن يمكن مقارنة الـCSV بشكل آمن عموديًا. ما العمود الواحد (تلميح: يبدأ بـ`episode`) الذي يجعل CSV قابلة للمقارنة عبر موسم كامل؟

## ⚠️ مآزق شائعة

- **تطبيع الأسماء الحساس لحالة الأحرف.** يقول النص `Maya`، وتقول قائمة الجرد `maya`، وتنشئ الخطوة 2 شخصين بصمت ، مقدمةً وضيفًا، كليهما حقيقي. التصغير *في وقت التحليل* ومعا في فحص `name in hosts` للتصنيف هو القمع؛ تخطَّ واحدًا وستخطئ قائمة جرد نظيفة تمامًا في تقسيم مقدميها.
- **عد السلاسل الفرعية يضخم درجات المواضيع.** يجد `count("team")` الـ`team` داخل `steam` و`teams`، فتُسجّل `culture` درجات على كلمات لا علاقة لها بها. الإصلاح الرخيص اختبار على مستوى الرمز (`w in words`) بدلًا من عدّ الكلمات؛ و*الصادق* توثيق أن عدّ السلاسل الفرعية تمريرة أولى وقراءة قسم المآزق قبل الوثوق باتجاهات موسم كامل.
- **ملف قائمة جرد كنقطة فشل وحيدة.** خطأ إملائي واحد (`Mayya`) يجعل ورقة الحقائق كلها تخطئ في تصنيف مقدمة العرض على أنها ضيفته ، ولا شيء يُنبَّه. احرس بفحص اكتمال: قبل النشر، يجب أن يتحلّ كل اسم متحدث في النص إلى مقدم أو ضيف، وأن تفشل الأسماء المجهولة بصوت عالٍ أو تطبع بصوت عالٍ على الأقل.
- **حشو قائمة الإيقاف يخرب الكلمات المفتاحية.** دون فلتر `STOP`، تهيمن "the" و"and" و"really" على مخرجات "أهم الكلمات" وتقرأ ورقة الحقائق كمعدل كلام لا محتوى. المجموعة ملف إعداد يجب أن تصونه لكل عرض ، "ratio" عند بودكاست مالي "bank" عند شخص آخر ، فراقبها أو شاهد القائمة تتزحزح.
- **مفاجآت اقتباس CSV.** اسم موضوع مثل `"culture, remote"` يكسر مخرجات `",".join` مبنية يدويًا إلى خليتين. `csv.writer` موجود تحديدًا لهذا؛ استخدمه، ولا تضفِ الطلاء يدويًا على CSV بتسلسل سلاسل أبدًا ، قواعد الهروب أدق مما تبدو.

## ما بنيته للتو

محلل بودكاست يعمل: نص وارد، و`episode_notes.txt` بيان حقائق و`topics.csv` صادران ، مقدمون وضيوف منفصلون، ومواضيع مرتّبة بوزن الكلمات، ووقت بث الضيوف كميًّا، وكلمات محتوى مقطّرة. كل رقم قابل للتحقق يدويًا، لأن خط الأنابيب كله تحليل، وعضوية في مجموعات، و`Counter` ، دون أي صندوق أسود. المهارة القابلة للنقل فكرة *تلازم الكلمات المفتاحية*: "عم يدور هذا النص؟" كمسألة عدّ عبر قاموس من التسميات والمثيرات، وهي اللبنة نفسها تحت وضع العلامات على المستندات، وفلترة البريد العشوائي، ونمذجة المواضيع، والمرحلة الأولى من معظم خطوط تحليل المحتوى التي ستصادفها.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/podcast-analyzer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/podcast-analyzer) في مستودع الدورة يضمّ وحدات المحلل وقائمة الجرد والمقيّم والإبرازات والنشر مع حلقة العينة ودفترًا يشغّل كل خطوة بالترتيب. استنسخه، أو افتح المستودع كاملًا في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وأنتج ورقة حقائق في نافذة متصفح.
:::

## إلى أين تذهب من هنا

- **مقارنة المواسم:** حلّق بـ`publish` على كل ملف حلقة، واجمع صفوف `topics.csv` لكل حلقة في CSV موسم واحد، ورتّب "هذا الموسم انزاح من التسعير إلى الثقافة" ، عمود الـCSV المضاف في سؤال الخطوة 5 السقراطي أصبح حقيقيًا.
- **كلمات مفتاحية ثنائية:** استبدل عدّ الكلمات المفردة بنوافذ كلمتين (`"remote culture"`، `"word of mouth"`) ، نفس `Counter`، وخطوة مقسّم واحدة جديدة، وعبارات مفتاحية أفضل بأشواط.
- **علم تسمية `--episode`** يختم أكبر الحلقة في ترويسة الملاحظات وCSV ، 10 أسطر، ويجعل كل مخرج قابلًا للإسناد فورًا.
- **خطاف نقص الكتابة (اختياري):** إذا كان لديك أداة تحويل كلام إلى نص من المستوى المجاني (whisper.cpp على حاسوبك المحمول يعدّ)، فخطوة `subprocess` صغيرة تحوّل `.mp3` إلى صيغة النص هذه أولًا ، كل خطوة بعد الخطوة 1 تعمل على مخرجاته فعلًا، دون تغييرات.

## شارك مشروعك مع الصف

هل بنيت شيئًا تفخر به ، ورقة حقائق أصابت حلقة حقيقية، CSV بما فيه من بيانات عرضك؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع قدّمها طلاب آخرون، ويشرح README إضافة مشروعك عبر **طلب سحب (pull request)** من البداية للنهاية: التفرع، وفرع العمل، والالتزام، وفتح PR. لا يُفترض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓