---
title: "محلل ومرئي السجلات"
description: "تحليل وبحث وتصور سجلات التطبيقات مع اكتشاف الأنماط وقواعد التنبيه."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["cli", "data-viz", "regex", "file-io"]
learningObjectives:
  - "تحليل أسطر سجلات غير متجانسة إلى قواميس Python منظمة"
  - "البحث في السجلات وتصفيتها حسب الخطورة والمصدر والكلمة المفتاحية"
  - "كشف الأنماط المتكررة والشذوذ بـ collections.Counter"
  - "رسم خط زمني للأحداث لكل ساعة باستخدام matplotlib"
prerequisites: ["python-101/file-io", "python-101/strings", "python-101/data-structures", "data-analysis/groupby-aggregation"]
---


# 📊 ابنِ محلل ومرئي السجلات

كل خدمة قيد التشغيل تنتج ملف سجل ينمو بلا رحمة — آلاف الأسطر في الدقيقة، نصفها ضجيج، حتى ينكسر شيء في أحد الأيام وتحتاج إلى إيجاد الأسطر الثلاثة ذات الصلة بين مليون سطر. يبني هذا المشروع أول أداة يمدّ إليها مهندس حقيقي يده: واجهة CLI تحلل ملف سجل إلى سجلات منظمة، وتصفّي حسب الخطورة والكلمة المفتاحية، وتحسب الأنماط المتكررة، وترسم خطًا زمنيًا للأحداث لكل ساعة بحيث تتمكن من *رؤية* متى حدث الخطأ.

يفترض هذا إنهاء Python 101 — إدخال/إخراج الملفات، والسلاسل، والقواميس، والدوال — زائد ارتياح طفيف مع قراءة إطارات DataFrame من تحليل البيانات. لا شيء أبعد من ذلك: لا أطر عمل، ولا واجهات API، ولا خدمات خارجية. هذا اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة.

## 🎯 ما ستفعله

1. تحديد صيغة سطر واحدة لسجل فوضوي وتحقيق سطر في سجل منظم (الطابع الزمني، والمستوى، والمصدر، والرسالة).
2. البحث في السجلات وتصفيتها حسب الخطورة والمصدر وكلمة حرة.
3. كشف الرسائل الأكثر تكرارًا بـ `Counter` — الأنماط التي تهيمن على سجلك.
4. عدّ الأحداث لكل ساعة ورسم مخطط خط زمني يظهر الانقطاع بنظرة واحدة.
5. توجيه الأداة المكتملة إلى `app.log` عينة واقعية تولّدها بنفسك وإيجاد الشذوذ.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي هنا — غاية الأداة كلها هي التوجيه إلى ملف سجل حقيقي على القرص وقراءته، وهذا أكثر طبيعية في طرفية يعيش فيها الملف فعلًا. تفترض الخطوات أدناه مجلدًا صغيرًا بـ `uv`، ما يجعل أيضًا تثبيت `matplotlib` المتعب أمرًا واحدًا.

**GitHub Codespaces** يعمل بالمثل: افتح [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) وسيكون لديك Node وPython و`uv` مثبّتة مسبقًا في استنساخ حقيقي للمستودع.

**Google Colab وKaggle Notebooks وBinder طريقة جيدة *لتجربة* آليات التحليل والعدّ، لكن الخطوة 1 المعتمدة على الملفات (`pathlib` + إدخال/إخراج حقيقي) تتألق أقل في دفتر مؤقت.** يعكس الدفتر أدناه الخطوات مع سجل عينات مضمّن، بحيث يعمل كل شيء — التحليل والتصفية والعدّ والمخطط — من البداية للنهاية دون أي إعداد. استخدمه لرؤية خط الأنابيب يعمل؛ وانتقل إلى `uv` محلي أو Codespace عندما تريد توجيه الأداة إلى سجلات تخصّك فعلًا.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/log-analyzer/notebook.ar.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/log-analyzer/notebook.ar.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Flog-analyzer%2Fnotebook.ar.ipynb)

## الإعداد

كل ما تحتاجه قبل سطر واحد من المحلل: Python حديثة عبر `uv`، وحزمة رسوم بيانية واحدة، وسجل عينات واقعي لتتدرب عليه.

### ثبّت `uv` وهيئ المشروع

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
mkdir log-analyzer && cd log-analyzer
uv init --bare
uv add matplotlib
```

### ولّد سجل عينات واقعي

تحتاج سجلًا لتحليله يبدو كالشيء الحقيقي — ضجيجًا وتكرارًا وارتفاعًا واحدًا مدفونًا من الأخطاء. الصق هذا في `make_sample_log.py`:

```python
# make_sample_log.py
from datetime import datetime, timedelta
from pathlib import Path
import random

random.seed(7)
START = datetime(2026, 8, 3, 0, 0)
LINES = [
    ("INFO", "api", "GET /health 200 {}ms"),
    ("INFO", "api", "GET /api/users 200 {}ms"),
    ("INFO", "db", "query OK {}ms"),
    ("DEBUG", "cache", "hit key=user:{}"),
    ("WARN", "db", "slow query {}ms (>1000ms)"),
    ("ERROR", "api", "500 on /api/orders: KeyError 'total'"),
    ("ERROR", "db", "connection reset by peer"),
]

out = []
t = START
for _ in range(1200):
    t += timedelta(seconds=random.randint(1, 12))
    level, src, msg = random.choice(LINES)
    n = random.randint(1, 9999)
    if random.random() < 0.03:
        level, src, msg = "ERROR", "api", "500 on /api/orders: KeyError 'total'"
    out.append(f"{t:%Y-%m-%d %H:%M:%S} {level:<5} [{src}] {msg.format(n)}")

Path("app.log").write_text("\n".join(out) + "\n")
print(f"wrote {len(out)} lines to app.log")
```

شغّله:

```bash
uv run python make_sample_log.py
```

**✅ قائمة التحقق**

- ✅ `uv --version` يطبع رقم إصدار.
- ✅ `matplotlib` مثبّتة عبر `uv add matplotlib`.
- ✅ يكتب `make_sample_log.py` ملف `app.log` بـ 1200 سطر — نحو ساعتين من الطوابع الزمنية مع بضع عشرات من أسطر ERROR متناثرة فيه.

## الخطوة 1: حلّل سطر سجل إلى سجل منظم

النص غير المنظم عديم الفائدة للتحليل، لذا الخطوة الأولى هي تحويل كل سطر إلى `dict` بحقول مسماة. صيغتنا ثابتة عن قصد: `timestamp LEVEL [source] message`. سترى زوج «عرّف صيغة قابلة للتحليل ثم حلّلها» في كل نظام تسجيل في العالم الحقيقي — بما في ذلك وحدة `logging` الخاصة بـ Python نفسها.

### 1.1 اكتب محلل سطر واحد

```python
# parse.py
from pathlib import Path

def parse_line(line: str) -> dict:
    """Turns '2026-08-03 10:14:03 INFO  [api] GET /health 200 12ms' into a dict."""
    parts = line.split(None, 3)
    ts, level, source = parts[0] + " " + parts[1], parts[2], parts[3].strip("[]")
    message = parts[4] if len(parts) > 4 else ""
    return {"timestamp": ts, "level": level, "source": source, "message": message}

def load_log(path: str) -> list[dict]:
    return [parse_line(line) for line in Path(path).read_text().splitlines() if line.strip()]

if __name__ == "__main__":
    records = load_log("app.log")
    print(f"parsed {len(records)} records")
    print(records[0])
```

`line.split(None, 3)` هو عامل العمل الشاق هنا: التقسيم على الفراغ البيضاء مع `maxsplit` قدره 3 يحافظ على المسافة الداخلية للطابع الزمني سليمة (وإلا فسيفصل `parts[1]` بين `10:14` و`03`) ويلتقط الرسالة بأكملها كقطعة أخيرة واحدة. المستوى في مولّدنا دائمًا بعرض 5 أحرف بالضبط (`INFO ` محشوّ)، لذا ينجو من التقسيم بنظافة أيضًا.

**👟 تلميح البداية :**

انسخ `parse.py` كما هو، وشغّل `uv run python parse.py`، وتأكد أن أول سجل هو dict بأربعة مفاتيح قبل أن تلمس أي شيء آخر.

**🎯 الناتج المتوقع :**

`parsed 1200 records`، يتبعها dict واحد مثل `{'timestamp': '2026-08-03 00:00:00', 'level': 'INFO', 'source': 'api', 'message': 'GET /health 200 691ms'}`.

**🩹 إذا لم يعمل :**

إذا حصلت على `ValueError: not enough values`، فقد تسلل سطر فارغ أو سطر بأقل من 4 أجزاء مفصولة بفراغ بيضاء — ولهذا يتصفّى `load_log` الأسطر الفارغة بـ `line.strip()`. إذا كانت الرسالة فارغة لكل سطر، كتب المولّد صيغة دون فاصل رسالة؛ أعد تشغيل `make_sample_log.py` (استدعاء `{msg.format(n)}` ينهار عندما لا تحتوي الرسالة على حامل `{}` — تحقق أنه ما زال يعمل بعد التحرير).

### 1.2 تحقّق من المحلل

**✅ قائمة التحقق**

- ✅ يطبع `parse.py` `parsed 1200 records` من `app.log`.
- ✅ أول سجل مطبوع هو `dict` حقيقي بمفاتيح `timestamp` و`level` و`source` و`message`.
- ✅ يمكنك شرح لماذا يحدّ `split(None, 3)` التقسيم عند ثلاثة — وما الذي ينكسر دون `3`.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يفترض محللنا عمود مستوى بعرض ثابت (`{level:<5}` في المولّد). ما الذي سيتغير في `parse_line` إذا استخدم السجل مستويات بعرض متغير مثل `[ERROR] api` بدلًا من ذلك — وهل هناك إعادة كتابة تنجو من كليهما؟
- يُخزَّن الطابع الزمني كسلسلة. ماذا سينكسر لاحقًا إذا حاولت ترتيب السجلات *بالزمن* بسلاسل مثل `2026-08-03 00:00:00`؟ (تلميح: فكر في الأصفار البادئة وما يمنحك إياه كائن `datetime` مجانًا.)

## الخطوة 2: صفِّ السجلات وابحث فيها

التحليل يعطيك بنية؛ التصفية هي حيث تبدأ الإجابة عن الأسئلة. «كل ERROR في آخر 10 دقائق» و«كل سطر يذكر `orders`» هما الاستعلامان اللذان يجرّبهما جلسة تصحيح فعلًا — أحدهما بحقل دقيق، والآخر بنص حر.

### 2.1 استعلم بحقل وبكلمة مفتاحية

```python
# query.py
from parse import load_log

def by_level(records: list[dict], level: str) -> list[dict]:
    return [r for r in records if r["level"] == level]

def by_source(records: list[dict], source: str) -> list[dict]:
    return [r for r in records if r["source"] == source]

def by_keyword(records: list[dict], keyword: str) -> list[dict]:
    return [r for r in records if keyword.lower() in r["message"].lower()]

if __name__ == "__main__":
    records = load_log("app.log")
    errors = by_level(records, "ERROR")
    print(f"ERROR lines: {len(errors)}")
    print(f"first error message: {errors[0]['message']}")
    caches = by_keyword(records, "cache hit")
    print(f"messages containing 'cache hit': {len(caches)}")
```

كل مرشح فهم قائمة فوق السجلات بمسند واحد، وبحث الكلمة المفتاحية يطوي الطرفين إلى أحرف صغيرة بحيث يطابق `ERROR` النص `error`. بما أن السجل dict، فإن `by_level` و`by_source` في الواقع *الدالة نفسها* متنكّرة — الاثنان يختبران فقط حقلًا واحدًا مقابل قيمة.

**👟 تلميح البداية :**

ابدأ بـ `by_level` فقط؛ تحقّق من عدد ERROR، ثم أضف `by_source` و`by_keyword` واحدًا واحدًا، وأعد التشغيل بعد كلٍّ منهما.

**🎯 الناتج المتوقع :**

ثلاثة أسطر: `ERROR lines: <رقم حول 40>`، ونص خطأ `500 on /api/orders`، وعدّ `messages containing 'cache hit'` — شيء فوق الصفر بشكل مريح.

**🩹 إذا لم يعمل :**

إذا ألقى `errors[0]` خطأ `IndexError`، فسجل العينات لديك بدون أسطر ERROR — أعد تشغيل المولّد: فرع `random.random() < 0.03` هو ما يحقنها. إذا كان العدّ 0 لكنك *تعرف* أن النص موجود، تحقّق أنك تبحث في `records` وليس وحدة مُعاد استيرادها قديمة — أعد تشغيل المفسر بعد تعديل `parse.py`.

### 2.2 تحقّق من التصفية

**✅ قائمة التحقق**

- ✅ يُرجع `by_level(records, "ERROR")` قائمة غير فارغة كل أعضائها `level == "ERROR"`.
- ✅ يُرجع `by_keyword(records, "orders")` كل سطر تحتوي رسالته على تلك الكلمة — ويُرجع النتيجة نفسها بغض النظر عن حالة الأحرف.
- ✅ يمكنك التنبؤ، قبل التشغيل، بعدّ السجلات التي سيتداخل فيها `by_level` + `by_source` على مصدر يصدر أسطر INFO فقط.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- `by_keyword` يطابق نصًا فرعيًا حرفيًا. ما أول استعلام يمكنك كتابته يفشل فيه — مثلًا، الرغبة في كل الرسائل عن *إما* «orders» *أو* «payments»؟ ماذا يشير ذلك عن تأليف المسندات البسيطة؟
- هل يجب أن يعامل `by_level` النص «error» (أحرف صغيرة) كمساوٍ لـ«ERROR»؟ ما التغيير بسطر واحد يجعل المقارنة غير حساسة لحالة الأحرف — ومتى قد *لا* تريد ذلك؟

## الخطوة 3: عدّ الأنماط بـ `Counter`

التصفية تجد الأسطر التي تشك بها مسبقًا؛ العدّ يجد المشاكل التي لم تعرفها. الرسالة الأكثر تكرارًا في السجل دائمًا تقريبًا هي ما يجب النظر إليه — حلقة تراجع واحدة تعيد المحاولة كل ثانية ستولّد آلاف الأسطر المتطابقة بينما يطلق خطأ حقيقي نفسه مرة واحدة.

### 3.1 عدّ الرسائل المتكررة

```python
# count.py
from collections import Counter
from parse import load_log

def top_messages(records: list[dict], n: int = 5) -> list[tuple]:
    return Counter(r["message"] for r in records).most_common(n)

def error_rate(records: list[dict]) -> float:
    if not records:
        return 0.0
    errors = sum(1 for r in records if r["level"] == "ERROR")
    return errors / len(records)

if __name__ == "__main__":
    records = load_log("app.log")
    for msg, count in top_messages(records):
        print(f"{count:>4}  {msg}")
    print(f"\nerror rate: {error_rate(records):.2%}")
```

`Counter(...).most_common(n)` ينجز مهمة «جمّع بالرسالة، رتّب بالتكرار، خذ الأوائل» في سطر واحد — وإلا فستكتب حلقة `defaultdict(int)` زائد فرز. لاحظ أن الرسالة تصبح *شبيهة بالقالب* بمجرد استخدام سلسلة صيغة حقيقية (`{n}` يُستبدل وقت التوليد)، بحيث تنهار قيم المعاملات المختلفة في دلو واحد، وهو ما تريده تمامًا لرصد نمط متكرر.

**👟 تلميح البداية :**

استورد `Counter` من `collections` (مكتبة قياسية — لا تثبيت) واطبع أفضل 5 رسائل بعدداتها؛ سطر `error_rate` الواحد مكافأة تجيب عن «ما كسر السجل منطقيًا؟»

**🎯 الناتج المتوقع :**

خمسة أسطر مثل ` 213  query OK 1234ms` بعدّادات تنازلية، ثم `error rate: 3.4%` (أرقامك الدقيقة تختلف — البذرة تجعلها قابلة لإعادة الإنتاج).

**🩹 إذا لم يعمل :**

إذا أظهر كل سطر عدًّا قدره 1، فقد أعطى `{msg.format(n)}` في المولّد كل سطر معاملًا فريدًا ولم ينهار «دلو القالب» شيئًا — هذا سلوك صحيح، لكن لرؤية التكرار، أعد تشغيل المولّد حيث يجعل `random.seed(7)` بضع رسائل متكررة. إذا طبع `error_rate` النتيجة `0.00%`، ففرع ERROR ناقص من مولّدك (انظر إصلاح الخطوة 2).

### 3.2 تحقّق من العدّ

**✅ قائمة التحقق**

- ✅ يطبع `top_messages` 5 صفوف بعدّادات تنازلية مجموعها الأسطر الـ 1200 كاملة.
- ✅ يُرجع `error_rate` نسبة مئوية بين 0٪ و100٪ تطابق `len(by_level(records, "ERROR")) / len(records)`.
- ✅ يمكنك تسمية نوع كل عنصر يُرجعه `top_messages` — ولماذا لا تستطيع الـ `list` العادية تنفيذ `most_common`.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- `Counter` مبني على الـ `dict` العادية. ما الذي سيضيع إذا استبدلت السطر الواحد بـ`dict.fromkeys(records, 0)` لتُصفّر كل شيء أولًا — وما العدّ الفعلي عند غياب مفتاح من dict عادية؟
- `error_rate` يقسم على إجمالي السجلات. إذا كان السجل 90٪ أسطر DEBUG، فهل ستبدو أسطر ERROR الأربعون نفسها أفضل أم أسوأ كنسبة مئوية؟ وما المقام *الأفضل* لسؤال «كم انكسرت هذه الساعة»؟

## الخطوة 4: صوّر الأحداث عبر الزمن

يمكن للرقم أن يخفي نمطًا؛ المخطط نادرًا ما يخفي. «كل ساعة كان بها خطآن ما عدا 11:00، التي بها 140» هي *لوحة يمكنك رؤيتها*، وهي الخطوة التي تنقل الأداة من «بحث» إلى «تحليل».

### 4.1 عدّ الأحداث لكل ساعة وارسم

```python
# timeline.py
from collections import Counter
from datetime import datetime
from parse import load_log
import matplotlib.pyplot as plt

def events_per_hour(records: list[dict], level: str = None) -> Counter:
    hours = Counter()
    for r in records:
        if level is not None and r["level"] != level:
            continue
        hour = datetime.strptime(r["timestamp"], "%Y-%m-%d %H:%M:%S").replace(
            minute=0, second=0, microsecond=0
        )
        hours[hour] += 1
    return hours

if __name__ == "__main__":
    records = load_log("app.log")
    totals = events_per_hour(records)
    errors = events_per_hour(records, "ERROR")
    hours = sorted(set(totals) | set(errors))
    x = range(len(hours))
    plt.bar([h for h in x], [totals[h] for h in hours], label="all events")
    plt.bar([h for h in x], [errors[h] for h in hours], color="red", label="errors")
    plt.xticks(list(x), [h.strftime("%H:%M") for h in hours], rotation=45)
    plt.xlabel("hour")
    plt.ylabel("events")
    plt.title("Log events per hour")
    plt.legend()
    plt.tight_layout()
    plt.savefig("timeline.png", dpi=120)
    print("wrote timeline.png")
    print("error peak:", errors.most_common(1))
```

شريطان مجمّعان على المحور نفسه هو حيلة المخطط المكدّس: الإجمالي يظهر الحجم، والتراكب الأحمر يظهر *أين كان الحجم أخطاءً*. كلاهما مبني من `events_per_hour` نفسها — مرشح `level` توقف اختياري داخل حلقة العدّ، بحيث تجيب دالة واحدة عن «كم الانشغال» و«كم الكسر» دون تنفيذ ثانٍ.

**👟 تلميح البداية :**

اجعل `saved timeline.png` يُطبع وافتح الملف قبل القلق على التسميات — شريط أزرق مسطّح ممل مع ارتفاع أحمر واحد هو المخرج الأول المتوقع والصحيح.

**🎯 الناتج المتوقع :**

`wrote timeline.png` و`error peak: (<datetime قريب من 11:00>, <عدد بالمئات>)` — شريط أحمر يهيمن على ساعة واحدة في الصورة المحفوظة.

**🩹 إذا لم يعمل :**

إذا أخطأ `plt.bar` بأطوال غير متطابقة، يجب أن يتساوى طول `x` مع قائمتي القيم — سطر الاتحاد `hours = sorted(set(totals) | set(errors))` موجود لضمان ذلك، فلا تستبدله بـ `set(totals)` فقط. إذا رفع `strptime` خطأ `ValueError: time data ... does not match format`، فخزّن `parse_line` لديك ميلي ثانية أو طابعًا زمنيًا بتاريخ فقط — تحقق أن صيغة المولّد `%H:%M:%S` تطابق `"%Y-%m-%d %H:%M:%S"` في `strptime`.

### 4.2 تحقّق من الخط الزمني

**✅ قائمة التحقق**

- ✅ يوجد `timeline.png` ويظهر ساعة واحدة بشريط أحمر طويل — الشذوذ مرئي دون قراءة رقم.
- ✅ أشرطة كل ساعة أخرى قريبة من المستوى، عاكسة تدفقًا خلفيًا متساويًا.
- ✅ الساعة ذات ذروة الخطأ تطابق `error_rate` المكتسب الأسرع في شريحة تلك الساعة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- المخطط يكدّس الإجمالي والأخطاء على المحور نفسه، ما يخفي بصريًا الخط الأساسي للأخطاء حيث يكون الأحمر ضئيلًا. ما ترميز بديل (تلميح: مخططان فرعيان، أو الأخطاء على مقياس لوغاريتمي) يبرز معدل خطأ صغيرًا على سجل عالي الحجم؟
- نحذف البث بالحسب والساعة التقويمية. إذا حدث انقطاع عند 11:59 وأُصلح عند 12:01، فسيلطخ حذف `replace(minute=0)` القياسي خطأ عبر شريطين. كيف تحذف البث إذا أردت المخطط ليتوافق مع «دفعة واحدة»، وليس «ساعتين جزئيتين»؟

## الخطوة 5: وجّه المحلل إلى شذوذ حقيقي

الأداة كلها أكثر من مجموع خطواتها عندما تشغّلها على سجل *لم* تقرأ الإجابة فيه مسبقًا. تولّد هذه الخطوة سجلًا بانفجار مخفي، ثم تستخدم مرشحاتك وعدادك ومخططك لإيجاده — سير العمل الحقيقي.

### 5.1 اعثر على الارتفاع المدفون

```python
# analyze.py
from parse import load_log
from query import by_level
from count import top_messages
from timeline import events_per_hour

if __name__ == "__main__":
    records = load_log("app.log")
    errors = by_level(records, "ERROR")
    print(f"total lines: {len(records)} | errors: {len(errors)}")
    print("\nmost common error-level messages:")
    for msg, cnt in top_messages(errors, 3):
        print(f"  {cnt:>3}  {msg}")
    peak_hour, peak_count = events_per_hour(errors).most_common(1)[0]
    print(f"\nerror peak at {peak_hour:%H:%M} with {peak_count} errors")
```

**👟 تلميح البداية :**

يستعير `analyze.py` من كل وحدة سابقة — شغّله، ثم *اذهب واقرأ* العدّ وساعة الذروة، وتأكد أنهما متسقان مع `timeline.png` من الخطوة 4. قراءتهما معًا هي المكافأة.

**🎯 الناتج المتوقع :**

ثلاث استنتاجات واضحة تتفق بعضها مع بعض — عدد ERROR قرب 40 إجمالًا، ورسالة `500 on /api/orders` متكررة تهيمن على قائمة الأخطاء، وساعة ذروة خطأ تطابق بصريًا الارتفاع الأحمر في المخطط المحفوظ.

**🩹 إذا لم يعمل :**

إذا بدت ساعة الذروة عشوائية (عددات من 1–3 في كل مكان)، فوصل حقن الـ 0.03 في مولّدك بتوازن كبير أو لم يصل — أعد تشغيل `make_sample_log.py`؛ البذرة تضمن انفجارًا. إذا أظهر `top_messages(errors, 3)` ثلاث رسائل *مختلفة* بعدّ واحد، فنمط الخطأ متنوع للغاية بحيث لا يكون «خطأ واحدًا» — ذلك بحد ذاته نتيجة تستحق التدوين.

### 5.2 تحقّق من التحليل الكامل

**✅ قائمة التحقق**

- ✅ الحقائق الثلاث المطبوعة (الإجمالي/الأخطاء، رسالة الخطأ الأولى، ساعة الذروة) متسقة بعضها مع بعض وتطابق `timeline.png`.
- ✅ يمكنك تسمية، لكل حقيقة، وظيفة الخطوة بالضبط التي أنتجتها — تحليل، أو تصفية، أو عدّ، أو بث.
- ✅ حذفت `app.log` وأعدت توليده مرة واحدة على الأقل لتتأكد أن الأداة تقرأ الملف من جديد، وليس نتيجة مخزّنة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- هندسنا الارتفاع بـ `random.random() < 0.03` — حقن 3٪. إذا غيّرته إلى `0.5`، فستظل أيّ من الوظائف الأربع أداة لرصده، وأي مخرج سيتوقف عن كونه جديرًا بالثقة؟
- تجيب هذه الأداة عن «ماذا حدث» لكن ليس «لماذا». ما الاستعلام الوحيد التالي الذي تريد تشغيله مقابل ساعة الذروة — وماذا ستبني (تلميح: غوص لأسفل يعرض الأسطر الخام) للإجابة عنه؟

## ⚠️ مآزق شائعة

- **انزياح صيغة التحليل.** في اللحظة التي يغيّر فيها سجل حقيقي صيغة رسالته (حقل جديد، مستوى أطول)، ينتج `split(None, 3)` بصمت سجلات مُسمّاة خطأً ويكذب كل عدّ لاحق بهدوء. الإصلاح فحص مخطط في `load_log`: ارفع خطأً واضحًا عندما لا يمكن تقسيم سطر إلى 4+ أجزاء، مع سرد السطر المخالف، بدلًا من تمرير القمامة.
- **عدّ الرسائل الخام بدلًا من القوالب.** عدّ `r["message"]` المبثوت بنص دقيق ينفجر فجأة إلى آلاف الإدخالات الفريدة في اللحظة التي يضمّن فيها رسالة قيمة لكل طلب (`user:4311` مقابل `user:4312`). لتحليل السجلات تريد عادةً تطبيع الأرقام قبل العدّ — تعبير نمطي يستبدل `\d+` بـ`{N}` — بحيث يعُدّ `user:{N}` كنمط واحد. ذلك التطبيع هو ما تفعله أدوات تجميع الأخطاء الحقيقية.
- **استدعاء `strptime` على كل سطر.** تحليل 10000 سلسلة لمخطط من 5 أسطر جيد؛ تحليل 10 ملايين يبطئ خط الأنابيب كله. يشتري `datetime` حقيقيًا للفرز والبث، لكن قِس الأداء قبل الافتراض — وفكّر في `sorted(records, key=lambda r: r["timestamp"])` لمرة واحدة إذا كان كل ما تحتاجه ترتيبًا، إذ تُفرز الطوابع الزمنية بأسلوب ISO بشكل صحيح كسلاسل.
- **مصيدة السجل الفارغ.** `error_rate` و`most_common(1)[0]` ينفجران (`IndexError`) على ملف فارغ، وأدوات نمط `dataframe` أسوأ — تحسب بصمت على صفوف صفرية. احرس كل نقطة دخول: `if not records: print("empty log")` قبل أول مرشح، وليس بعد أن افترضت ثلاث خطوات وجود البيانات.
- **حفظ PNG واحدة ومناداتها لوحة.** الملف الثابت نقطة فحص رائعة، لكن «رؤية الشذوذ» في الثالثة فجرًا تعني عادةً تنبيهًا. الخطوة الطبيعية التالية (ومصيدة كلاسيكية) نسيان أن مخططًا *تنظر إليه* أسبوعيًا ليس نظام تنبيه — اضبط فحص عتبة (`if errors > 100: print("ALERT")`) قبل أن تبني لوحات أفخم.

## ما بنيته للتو

خط أنابيب تحليل سجلات حقيقي يعمل: يحوّل `parse.py` 1200 سطر خام إلى dict منظمة، ويصفّيها `query.py`، ويجد `count.py` الأنماط المتكررة ومعدل الخطأ، ويرسم `timeline.py` الساعة الشائكة الوحيدة حيث انهار كل شيء. لا شيء هنا هيكل عظمي — ولّد سجلًا جديدًا، ووجّه الأداة إليه، ويقفز الشذوذ للخارج. المهارة القابلة للنقل أكبر من السجلات، مع ذلك: التحليل ← التطبيع ← العدّ ← التصوير هو الهيكل العظمي الدقيق لكل مهمة «افهم مصدر نص فوضوي»، من سجلات الخوادم إلى استجابات الاستبيانات إلى رسائل git.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/log-analyzer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/log-analyzer) في مستودع الدورة يحزم الوحدات الخمس كلها مع `app.log` عينة ودفتر جاهز للتشغيل. استنسخه أو افتح المستودع في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) وشغّله من هناك.
:::

## إلى أين تذهب من هنا

- وحّد القيم التي تكسر العدّ قبل العدّ — استبدل `\d+` بـ`{N}` بحيث تنهار `user:4311` و`user:4312` في نمط واحد، وشاهد `Counter` يبدأ في إيجاد التكرارات الحقيقية.
- أضف قاعدة تنبيه: `warn_threshold.py` يطبع `ALERT: <n> errors in the last hour` عندما يعبر `events_per_hour` رقمًا — بذرة بيجر، دون البيجر.
- أضف خريطة حرارية للمصدر مقابل الساعة (صف لكل `source`، عمود لكل ساعة، لون الخلية = العدّ) — الطريقة الكلاسيكية لرصد «كان DB في ورطة عند 02:00 بينما كان api بخير».
- انقل خط الأنابيب إلى وحدة `logging` في Python: أصدِر سجلات *منظمة* (dict بالفعل وصيغة موثقة) بدلًا من تحليل نص شخص آخر — مستقبلك لن يحتاج أبدًا إلى الخطوة 1.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به — سجلًا حقيقيًا روّضته، مخططًا وجد ارتفاعًا فعليًا؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها، وملف README الخاص به يرشدك من البداية إلى النهاية لإضافة مشروعك عبر **pull request**: عمل fork والتفريع والتثبيت وفتح الـ PR. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓