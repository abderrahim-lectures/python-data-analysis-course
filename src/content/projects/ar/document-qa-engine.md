---
title: "محرك أسئلة المستندات"
description: "اسأل أسئلة عن ملفات PDF والمستندات والجداول وأحصل على إجابات دقيقة مع إحالات للمصادر."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["cli", "retrieval", "indexing", "nlp-basics"]
prerequisites:
  - "أساسيات بايثون (قواميس، مجموعات، تقييمات القوائم)"
  - "التعبيرات النمطية وقراءة الملفات بـ pathlib"
learningObjectives:
  - "تقطيع نص مؤلَّف إلى وحدات نصية قابلة للاستعلام بمعرفات مستقرة"
  - "بناء فهرس معكوس يربط المصطلحات بالكتل"
  - "تسجيل الكتل وترتيبها لأي استعلام حسب تواتر المصطلح"
  - "استخلاص إجابة على مستوى الجملة من الكتلة العليا مع استشهاد بالمصدر"
  - "تغليف الاسترجاع والإجابات في CLI تفاعلية لا تعتمد على الشبكة أبدًا"
---

# 📄 ابنِ محرك أسئلة للمستندات

في عالم ما قبل نماذج اللغة الكبيرة — وفي كل بيئة طرفية يكون فيها النموذج ثقيلًا جدًا أو بطيئًا جدًا أو باهظًا جدًا — «اسأل مستنداتك» هي *مشكلة بحث مع تنسيق جميل*. الآلية صادقة وتعلّمك أكثر من القشرة الحوارية: قسّم النص المؤلَّف إلى كتل، وفهرِس كل مصطلح إلى الكتل التي يظهر فيها، وسجّل الكتل لاستعلام، واختر الجملة التي تجيب عنه أفضل إجابة، واستشهد بمصدرها. هذا المشروع يبني الطبقات الخمس كلها في بايثون نقي، وسترى محركًا حقيقيًا يفعل شيئًا حقيقيًا: لا تخمين لأحد، وكل إجابة تحمل اسم الملف الذي أتت منه.

يفترض هذا ما يعادل بايثون 101 إضافةً إلى الراحة مع `re` و`pathlib`. لا شيء من وحدة تحليل البيانات مطلوب. هذا المشروع اختياري وغير مقيَّم؛ راجع [المشاريع الواقعية](/docs/projects) للقائمة الكاملة المتزايدة.

## 🎯 ما ستفعله

1. ابتلاع نص مؤلَّف من ثلاثة ملفات Markdown وتقطيعه إلى كتل بمعرفات مستقرة.
2. بناء فهرس معكوس — لكل مصطلح، قائمة الكتل التي يظهر فيها وعدد مرات ظهوره.
3. ترتيب الكتل لاستعلام حسب تواتر المصطلح المعياري.
4. استخراج أفضل جملة من الكتلة الأعلى ترتيبًا والاستشهاد بملف مصدرها.
5. تغليفها في CLI تفاعلية `ask.py` — اكتب سؤالًا، واحصل على نتائج مرتّبة وإجابة بمصدر.

## أين تُشغّل هذا

**محليًا مع `uv`** هو المسار الموصى به — الفهرس كائن حي تحمّله مرة واحدة ثم تستعلم عنه مرارًا، وCLI تفعل ذلك أفضل من خلية دفتر.

**GitHub Codespaces** بديل بلا إعداد: افتح [مستودع المقرر كاملًا في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython مثبتان مسبقًا) وشغّل الأوامر نفسها من طرفية متصفح.

**Google Colab وKaggle Notebooks أو Binder** تعمل مع كل خطوة — يشغّل الدفتر في [`examples/document-qa-engine/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/document-qa-engine/notebook.ipynb) المحرك نفسه على النص المؤلَّف المرفق في الذاكرة.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/document-qa-engine/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/document-qa-engine/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdocument-qa-engine%2Fnotebook.ipynb)

## الإعداد

`uv` أداة واحدة تحل محل سلسلة «ثبّت بايثون، ثم pip، ثم أداة بيئة افتراضية» — وهذا المشروع مكتبة قياسية نقي.

**macOS / Linux** (الطرفية):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

أغلق الطرفية وأعد فتحها، ثم تأكّد من التثبيت:

```bash
uv --version
```

ثم أجهّز المشروع:

```bash
uv init document-qa-engine
cd document-qa-engine
```

**✅ قائمة التحقق**

- ✅ يطبع `uv --version` رقم إصدار.
- ✅ يوجد مجلد `document-qa-engine/` بملف `pyproject.toml`.
- ✅ ينجح `python -c "import re, pathlib, collections"` — لا حزم طرف ثالث.

## الخطوة 1: أدخِل النص المؤلَّف في كتل

قبل أن يُطرح أي سؤال، يجب أن تتحول المستندات إلى قائمة *كتل* — وحدات نصية صغيرة مكتفية ذاتيًا يستطيع المحرك تسجيلها والاستشهاد بها. التقطيع حسب فقرات الأسطر الفارغة بسيط عمدًا: تصبح صفحة ويكيبيديا عن الأبراص كتلةً واحدة، ووحدة كتلتها هي `source#index`، وهي بالضبط ما يستشهد به أي إجابة لاحقًا.

### 1.1 أنشئ النص المؤلَّف والقارئ

**👟 تلميح البداية :** ثلاثة ملفات Markdown من فقرة واحدة هي النص المؤلَّف كله؛ يقرؤها `load_corpus`، ويقسّمها على الأسطر الفارغة، ويختم كل كتلة بمعرف مستقر:

```bash
mkdir -p docs
cat > docs/gecko.md <<'EOF'
Geckos are nocturnal lizards. They can climb smooth glass using tiny lamellae. Geckos eat insects such as crickets. Keep a warm branch in their tank.
EOF
cat > docs/hamster.md <<'EOF'
Hamsters are nocturnal rodents. They hoard seeds and nuts in their cheek pouches. Hamsters need soft bedding and a running wheel.
EOF
cat > docs/hermit.md <<'EOF'
Hermit crabs are decapod crustaceans. They carry a borrowed shell for protection. Hermit crabs need high humidity. They eat fruit, vegetables, and shrimp.
EOF
```

```python
# ingest.py
import re
from pathlib import Path

def tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z']+", text.lower())

def load_corpus(directory: str = "docs") -> list[dict]:
    chunks = []
    for path in sorted(Path(directory).glob("*.md")):
        paragraphs = [p.strip() for p in path.read_text().split("\n\n") if p.strip()]
        for i, text in enumerate(paragraphs):
            chunks.append({"id": f"{path.name}#{i}", "source": path.name, "text": text})
    return chunks

if __name__ == "__main__":
    for chunk in load_corpus():
        print(f"{chunk['id']:<12} {len(tokenize(chunk['text'])):>3} words  {chunk['text'][:38]}...")
```

`tokenize` هي الجملة الوحيدة التي يتشاركها الابتلاع و(لاحقًا) الاستعلام: حوّل كل شيء إلى أحرف صغيرة، وأبقِ الحروف والفواصل العليا فقط — لذا يُفهرَس `Climb` و`climb` و`climb,` كلها كمصطلح واحد `climb`. تقسيم الفقرات على الأسطر الفارغة هو *وحدة* التقطيع؛ تقسّم الأنظمة الإنتاجية على الجُمل أو نوافذ الحجم الثابت، لكن العقد متطابق (id + source + text)، ولهذا تحديدًا يمكنك تبديل المبخِّر دون لمس الفهرس أو المجيب.

**🎯 الناتج المتوقع :**

```
gecko.md#0    25 words  Geckos are nocturnal lizards. They can...
hamster.md#0  21 words  Hamsters are nocturnal rodents. They h...
hermit.md#0   23 words  Hermit crabs are decapod crustaceans. ...
```

**🩹 إذا لم يعمل :** إذا لم تظهر الملفات إطلاقًا، فلن تجد `Path(directory).glob("*.md")` أي شيء — أكّد أن `docs/` بجانب `ingest.py` *نفسها* (نفس الدليل الذي تشغّل منه السكربت). إذا أظهرت معرّفات الكتل `docs/gecko.md#0`، فقد مرّرت `directory="docs"` لكن `path.name` يتضمن المسار — استخدم `path.name`، لا `str(path)`.

### 1.2 تحقّق من الابتلاع

**✅ قائمة التحقق**

- ✅ ينتج `load_corpus()` ثلاث كتل بالضبط: `gecko.md#0` و`hamster.md#0` و`hermit.md#0`.
- ✅ `tokenize("Climb, CLIMB climb") == ["climb", "climb", "climb"]` — غير حساس لحالة الأحرف وعلامات الترقيم.
- ✅ تخبرك أعداد الكلمات (25 / 21 / 23) بحجم النص المؤلَّف دون قراءة نثره — هذه الأعداد تدفع تطبيع الخطوة 3.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- الفقرة = كتلة واحدة تعني أن فقرة *طويلة* تهيمن على الاسترجاع لاحقًا. ما وحدة التقطيع التي ستختارها ليميّز محرك الإجابات «الصفحة تذكر الأبراص» عن «في *جملتين* هم ليليون»؟ وكيف يتغير نظام المعرفات؟
- النص المؤلَّف ثلاث ملفات من فقرة واحدة، لذا كل شيء `#0`. متى تصبح معرّفات `source#index` غامضة — وما أول مبخِّر ينتج `#1`؟

## الخطوة 2: ابنِ الفهرس المعكوس

طريقة القوة الغاشمة لإيجاد «أين تعيش كلمة nocturnal» هي إعادة قراءة الملفات الثلاثة كل مرة. الفهرس المعكوس يقلب ذلك: *مصطلح → {معرف كتلة: عدّاد}*، فيكون أي بحث عن مصطلح ضربة قاموس واحدة تُرجع بالضبط الكتل التي يوجد فيها وعدد مرات وجوده. ذاكرة مقابل سرعة، وبنيت سرعة محرك الإجابات كاملة في نحو عشرة أسطر بناء.

### 2.1 اكتب build_index

**👟 تلميح البداية :** لكل كتلة، عدّ ظهورات كل مصطلح، ثم ادفع `(مصطلح → معرف كتلة → عدّاد)` إلى defaultdict متداخل:

```python
# index.py
from collections import defaultdict

from ingest import load_corpus, tokenize

def build_index(chunks: list[dict]) -> dict[str, dict[str, int]]:
    index: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for chunk in chunks:
        seen = {}
        for term in tokenize(chunk["text"]):
            seen[term] = seen.get(term, 0) + 1
        for term, count in seen.items():
            index[term][chunk["id"]] = count
    return index

def word_counts(chunks: list[dict]) -> dict[str, int]:
    return {c["id"]: len(tokenize(c["text"])) for c in chunks}

if __name__ == "__main__":
    chunks = load_corpus()
    index = build_index(chunks)
    for term in ("nocturnal", "climb", "humidity", "shell"):
        print(f"{term:<10} -> {dict(index[term]) if term in index else {}}")
    print("word counts:", word_counts(chunks))
```

`defaultdict(lambda: defaultdict(int))` هو الشكل كله: قاموس خارجي بمفتاح مصطلح، ينبثق لمفاتيحه الغائبة وجودًا — قاموسًا *متداخلًا* بمفتاح كتلة يبدأ العد من 0. قراءة `index["nocturnal"]` سريعة سواء كان للمصطلح ضربة واحدة أو مليون، ولم تفحص العضوية قبل اللمس. يخرج من هذه الخطوة هيكلان: يجيب `index` عن «أين يظهر هذا المصطلح» ويجيب `word_counts` عن «كم طول هذه الكتلة» — وكلاهما يحتاجه الخطوة 3.

**🎯 الناتج المتوقع :**

```
nocturnal  -> {'gecko.md#0': 1, 'hamster.md#0': 1}
climb      -> {'gecko.md#0': 1}
humidity   -> {'hermit.md#0': 1}
shell      -> {'hermit.md#0': 1}
word counts: {'gecko.md#0': 25, 'hamster.md#0': 21, 'hermit.md#0': 23}
```

**🩹 إذا لم يعمل :** إذا طبع العرض كل مصطلح بقاموس فارغ، فقد رمّز `build_index` نصًا فارغًا (استدعاء `path.read_text()` على ملف لم يجده glob) — تحقّق أنك في دليل `document-qa-engine/`. وإذا أعاد `index["climb"]` قمامة defaultdict عند الطباعة، فأنت تطبع defaultdict لم يُحول منذ `dict(...)` — تجميلي، لكن تحويل `dict(index[term])` هو ما يجعله يُعرض كقراءة حقيقية للفهرس.

### 2.2 تحقّق من الفهرس

**✅ قائمة التحقق**

- ✅ يربط `nocturnal` بكتلتي الأبرص والهامستر معًا؛ يربط كل من `climb`/`humidity` بكتلة واحدة بالضبط.
- ✅ مصطلح يظهر مرتين في كتلة (مثل `geckos`) له عداد `2` في إدخال تلك الكتلة.
- ✅ الاستعلام عن مصطلح غير موجود يعيد تعيينًا فارغًا بدلًا من إطلاق استثناء.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- الفهرس *قاموس قواميس عادي*. ماذا يتطلب دعم «إيجاد كتل بأي من عدة مصطلحات في عملية بحث واحدة» (اتحاد مفاتيح القواميس) بلا أي تبعية جديدة — ولماذا ذلك النوع التالي الطبيعي من الاستعلامات؟
- يتذكر هذا الفهرس *كم مرة* ظهر مصطلح لكن لا *أين في الكتلة* (الموضع). ماذا يفتح لك معرفة الموضع — وهل تستحق ذاكرةً حين تكون الكتلة 25 كلمة؟

## الخطوة 3: سجّل الكتل ورتّبها لاستعلام

«أي كتلة تجيب سؤالي؟» أصبح لها جواب ميكانيكي: رمّز الاستعلام، وابحث عن عداد كل مصطلح في كل كتلة، وامنح كل كتلة **سجلًا معياريًا** = (مجموع عدّادات المصطلحات المطابقة) ÷ (عدد كلمات الكتلة). الكتل الطويلة تُعاقَب على طولها، وهو بيت القصيد من القسمة، وهو الفرق بين «مطابقات» و«مطابقات *كثيفة*».

### 3.1 اكتب search

**👟 تلميح البداية :** مصطلحات استعلام فريدة، حلقة مزدوجة واحدة فوق الكتل، سجل معياري، ثم `sorted(... reverse=True)`:

```python
# search.py
from ingest import load_corpus, tokenize
from index import build_index, word_counts

def search(query: str, chunks: list[dict], index: dict, counts: dict[str, int]) -> list[tuple[float, dict]]:
    terms = set(tokenize(query))
    scored = []
    for chunk in chunks:
        score = sum(index[t].get(chunk["id"], 0) for t in terms) / counts[chunk["id"]]
        scored.append((score, chunk))
    return sorted(scored, key=lambda pair: pair[0], reverse=True)

if __name__ == "__main__":
    chunks = load_corpus()
    index = build_index(chunks)
    counts = word_counts(chunks)
    for i, (score, chunk) in enumerate(search("nocturnal", chunks, index, counts)[:3], 1):
        print(f"{i}. {chunk['id']:<12} score {score:.4f}  {chunk['text'][:30]}...")
```

سجل تواتر المصطلح (TF) بسيط عمدًا — لا وزن موضع، لا مكافأة عبارة — وبساطتها هي الدرس: حتى هذا TF العاري مع التطبيع ينتج *ترتيبًا صحيحًا ببساطة* لسؤال كلمات مفتاحية على نص صغير. البحث عن `nocturnal` يجده في ملفين، وهاكم التفصيل الدقيق — يتفوق ملف الهامستر على ملف الأبرص (0.0476 → 0.0400) ليس لأنه يذكر الكلمة مرتين، بل لأن التطبيع «يقسم على طول الكتلة» وكتلة الهامستر أقصر. جودة الاسترجاع جدال دائم حول دوال التسجيل؛ أنت الآن تملك أبسطها صدقًا.

**🎯 الناتج المتوقع :**

```
1. hamster.md#0 score 0.0476  Hamsters are nocturnal rodents...
2. gecko.md#0   score 0.0400  Geckos are nocturnal lizards. ...
3. hermit.md#0  score 0.0000  Hermit crabs are decapod crust...
```

**🩹 إذا لم يعمل :** إذا كانت كل السجلات `inf`/`ZeroDivisionError`، فإدخال `counts` لكتلة ما مفقود (معرفات الكتل غير متطابقة بين `load_corpus` و`word_counts` — يجب أن يُشتقَّ كلاهما من قائمة `chunks` نفسها). وإذا نالت كتلة `nan`، فالقسمة على `0` تسرّبت — كتلة فارغة؛ يرشّح `load_corpus` بـ`if p.strip()`، فأكّد أن مبخّرك أبقى ذلك الحارس.

### 3.2 تحقّق من الترتيب

**✅ قائمة التحقق**

- ✅ يرتّب `nocturnal` الهامستر والأبرص حسب السجل *المعياري* — الهامستر (21 كلمة) فوق الأبرص (25 كلمة) بعدّادين متطابقين.
- ✅ يجمع الاستعلام متعدد الكلمات عدّادات المصطلحات: `geckos eat` يسجّل الأبرص عند `(2+1)/25 = 0.120`.
- ✅ يُرجع `sorted(..., reverse=True)` أعلى سجل أولًا؛ وتحفظ التعادل ترتيب النص المؤلَّف.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يظهر `nocturnal` مرة واحدة في كتلتين، ومع ذلك تختلف رتبتاهما. هل ذلك *سلوك صحيح* أم أثر جانبي — وما السؤال عن المستندين الذي يرمّزه الترتيب فعلًا؟
- هذا تواتر مصطلح فقط، بلا IDF (تواتر المستند المعكوس). مصطلح مثل `the`، موجود في كل كتلة، سيسجّل سلة إعادة تدوير من الضربات بالتساوي. ماذا يطرح IDF من سجل كل كتلة — وماذا تشتري لك قائمة كلمات التوقف بدلًا منه، بثمن ترميز قائمة يدويًا؟

## الخطوة 4: استخرج جملة كإجابة

وجد الترتيب *الكتلة*؛ يستحق السؤال *جملة*. تقسيم الكتلة العليا إلى جمل وتسجيل كل جملة بعدد مصطلحات الاستعلام التي تحويها هو إجابة استخلاصية، الطبقة الثانية الصادقة: مصطلحات الاستعلام الحاضرة في جملة تعني أن الجملة مرجّح أن تحمل الإجابة. ما تكسبه استشهاد („gecko.md“) لا يمكن لأي خطوة توليد حقائق تزيّفه — وما تتعلمه هو بالضبط حيث تتوقف الإثارة في الاستخلاص.

### 4.1 اكتب extract_answer

**👟 تلميح البداية :** أعد استخدام `search` للكتلة العليا، واقسّم على حدود الجمل بتعبير lookbehind، وسجّل الجمل برموز الاستعلام المميزة الحاضرة:

```python
# answer.py
import re

from ingest import load_corpus, tokenize
from index import build_index, word_counts
from search import search

def sentences(text: str) -> list[str]:
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]

def extract_answer(query: str, chunks: list[dict], index: dict, counts: dict[str, int]):
    top = search(query, chunks, index, counts)[0][1]
    terms = set(tokenize(query))
    best_sentence, best_score = "", -1.0
    for sentence in sentences(top["text"]):
        score = sum(1 for t in terms if t in tokenize(sentence))
        if score > best_score:
            best_score, best_sentence = score, sentence
    return best_sentence, top["source"]

if __name__ == "__main__":
    chunks = load_corpus()
    index = build_index(chunks)
    counts = word_counts(chunks)
    for query in ("what is nocturnal", "geckos eat", "climb"):
        answer, source = extract_answer(query, chunks, index, counts)
        print(f"Q: {query}")
        print(f"A: {answer}")
        print(f"  source: {source}\n")
```

التعبير `(?<=[.!?])\s+` يقسّم *بعد* علامة الترقيم ويلتهم ما يليها من مسافات — مقسّم جمل جيد بما يكفي للنثر المرتّب. تسجيل الجمل بـ*رموز* الاستعلام المميزة (`geckos` تُعد مرة لا مرتين) يمنع جملة تكرر الفاعل ببساطة من التغلب على جملة تجيب الفعل. صدق المجرّد المجاني: اسأل «climb» فيُرجع «They can climb smooth glass using tiny lamellae.» *والملف الذي أتت منه* — الاستشهاد هو الميزة، لأن القارئ يستطيع مراجعة العمل.

**🎯 الناتج المتوقع :**

```
Q: what is nocturnal
A: Hamsters are nocturnal rodents.
  source: hamster.md

Q: geckos eat
A: Geckos eat insects such as crickets.
  source: gecko.md

Q: climb
A: They can climb smooth glass using tiny lamellae.
  source: gecko.md
```

**🩹 إذا لم يعمل :** إذا أجاب «what is nocturnal» من gecko.md بدلًا من hamster.md، فقد تغيّر ترتيب *الكتل* — لا يستطيع المجيب أن يكون أذكى من بحثه، و`search` حاليًا تفضّل الكتلة الأقصر. وإذا غابت أفضل جملة، فقد قلّص `sentences()` التقسيم (أخطأ التعبير في `\n\n` داخل نص فقرة) — تلك هي اللحظة التي تنقل فيها التقطيع إلى وحدات جمل.

### 4.2 تحقّق من الاستخلاص

**✅ قائمة التحقق**

- ✅ كل إجابة تستشهد بـ`source` من الكتلة التي وُجدت فيها — لا اختلاق أبدًا.
- ✅ لـ`what is nocturnal`، المصدر = الكتلة المرتبة أولًا (`hamster.md`)، بما يتسق مع الخطوة 3.
- ✅ تقرأ تسجيل الجمل المصطلحات المميزة، فلا يهيمن `geckos` الظاهر ثلاث مرات في جملة واحدة بمجرد التكرار.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- سيبحث «what do hamsters eat?» في كتلة `hamsters` ويستخرج «Hamsters are nocturnal rodents.» — جملة *تحوي الكلمة* لكنها لا *تجيب السؤال*. ما الذي يكسر هذا السلوك (درجة كتلة ← جملة، دلالات غائبة)، وماذا سيصلح خطوة كلمات توقف زائد مرادفات؟
- الاستشهاد هو طبقة المساءلة كلها: كل إجابة تشير إلى ملف مصدر يمكن للإنسان فتحه. ماذا يتغير في الثقة بالإجابة لو كان الاستشهاد *ملخّصًا* («من hamster.md تقريبًا») بدلًا من دقيق؟

## الخطوة 5: واجهة CLI التفاعلية

كل ما سبق دوال؛ الناتج حلقة. تحمّل `ask.py` النص المؤلَّف مرة، وتبني الفهرس مرة، ثم تطالب: ترتّب أفضل ثلاث كتل لسؤال مطبوع، وتطبع الإجابة الاستخلاصية بمصدرها، وتقبل السؤال التالي، ولا تتوقف إلا عند سطر فارغ (أو Ctrl-D). «دردشة مع مستنداتك» حقيقية تعمل بالكامل دون اتصال.

### 5.1 اكتب ask.py

**👟 تلميح البداية :** ركّب صامتًا الابتلاع + الفهرس + البحث + الاستخلاص تحت الغطاء؛ وحلّق على `input()` حتى فارغ أو EOF:

```python
# ask.py
from answer import extract_answer
from ingest import load_corpus
from index import build_index, word_counts
from search import search

def main() -> None:
    chunks = load_corpus()
    index = build_index(chunks)
    counts = word_counts(chunks)
    while True:
        try:
            query = input("ask> ").strip()
        except EOFError:
            break
        if not query:
            break
        for rank, (score, chunk) in enumerate(search(query, chunks, index, counts)[:3], 1):
            print(f"{rank}. {chunk['id']} ({score:.3f})")
            print(f"   {chunk['text']}")
        answer, source = extract_answer(query, chunks, index, counts)
        print(f"answer: {answer} [{source}]")

if __name__ == "__main__":
    main()
```

```bash
uv run python ask.py
```

`while True:` مع `break` عند إدخال فارغ هو العقد التفاعلي كله — سؤال لكل دور، سكوتٌ حين ينتهي الإنسان، و`try/except EOFError` ليخرج Ctrl-D (EOF) برشاقة مثل السطر الفارغ. الحلقة الثلاثية فوق `search(...)[:3]` هي حيث تصبح الكتل المرتّبة *المحادثة*، وسطر `answer:` الأخير هو حيث يصبح الاسترجاع استجابة. جرّب `nocturnal` ثم `climb` ثم `humidity`، ولاحظ أن المحرك يستشهد بملفات مختلفة لحقائق مختلفة.

**🎯 الناتج المتوقع :** (جلسة حقيقية، سؤال بعد آخر):

```
ask> geckos eat
1. gecko.md#0 (0.120)
   Geckos are nocturnal lizards. They can climb smooth glass using tiny lamellae. Geckos eat insects such as crickets. Keep a warm branch in their tank.
2. hermit.md#0 (0.043)
   Hermit crabs are decapod crustaceans. They carry a borrowed shell for protection. Hermit crabs need high humidity. They eat fruit, vegetables, and shrimp.
3. hamster.md#0 (0.000)
   Hamsters are nocturnal rodents. They hoard seeds and nuts in their cheek pouches. Hamsters need soft bedding and a running wheel.
answer: Geckos eat insects such as crickets. [gecko.md]
ask> nocturnal
1. hamster.md#0 (0.048)
   Hamsters are nocturnal rodents. They hoard seeds and nuts in their cheek pouches. Hamsters need soft bedding and a running wheel.
2. gecko.md#0 (0.040)
   Geckos are nocturnal lizards. They can climb smooth glass using tiny lamellae. Geckos eat insects such as crickets. Keep a warm branch in their tank.
3. hermit.md#0 (0.000)
   Hermit crabs are decapod crustaceans. They carry a borrowed shell for protection. Hermit crabs need high humidity. They eat fruit, vegetables, and shrimp.
answer: Hamsters are nocturnal rodents. [hamster.md]
ask> 
```

**🩹 إذا لم يعمل :** إذا تكررت المطالبة دون قبول إدخال، فـ`input` داخل الحلقة لكن `break` عند الفارغ مفقود — كل سطر فارغ لا يعدّ فارغًا يستمر. إذا انهار `ask.py` عند أول استعلام، فسلسلة الاستيرادات مكسورة (أحد الوحدات الأربع) — يظهر `uv run python -c "import ask"` أيها بالضبط.

### 5.2 تحقّق من CLI

**✅ قائمة التحقق**

- ✅ يبدأ `uv run python ask.py`، ويجيب `geckos eat` كما في الجلسة أعلاه، ويخرج عند سطر فارغ.
- ✅ لا تظهر إجابة فارغة أبدًا: تُرجع `extract_answer` دائمًا أفضل (وربما ضعيفة) جملة، لا `""` أبدًا.
- ✅ الإنهاء بـCtrl-D يخرج بنظافة دون traceback.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تركّب CLI أربع وحدات لكنها تعتمد عليها *بالاسم*. ماذا ينكسر لو أعاد زميل تسمية `answer.py` إلى `answers.py` — وماذا يخبرك ذلك عن استيراد وحدات كاملة مقابل استيراد دوال؟
- نصّ الجلسة قاطع *لأن* النص المؤلَّف والفهرس قاطعان. ما أول ما يجعل الناتج غير قاطع (تلميح: `sorted()` في الخطوة 1 وثلاثة النتائج العليا الثابتة في الخطوة 5) — وأي اختيار يحمي اختباراتك؟

## ⚠️ المآزق الشائعة

- **معرفات الكتل من المسارات.** يختم `f"{path}"` كل معرف بـ`docs/gecko.md#0` ويكسر عقد الاستشهاد بهدوء. استخدم `path.name` — قصير، ومستقر، ومقروء بشريًا.
- **التسجيل قبل التطبيع.** عدّادات المصطلحات الخام تجعل كتلة الأبرص ذات الـ25 كلمة تبدو أقوى من كتلة الهامستر ذات الـ21 كلمة لنفس الضربة الواحدة. اقسم على طول الكتلة، وإلا كانت «جودة الاسترجاع» التي تصحّحها في الغالب «انحياز طول».
- **إعادة الفهرسة عند كل استعلام.** الفهرس المبني داخل `search()` يشغّل الجزء المكلف عند كل سؤال. ابنِ مرة، استعلم مرات — تحمّله `main()` في CLI قبل الحلقة لهذا السبب بالضبط.
- **جملٌ كانت واعية بعلامات الترقيم ثم صارت لا.** يضيع `text.split(". ")` علامتي `!` و`?` ومسافات الذيل؛ تعالج `(?<=[.!?])\s+` lookbehind الثلاثة. اقسم على عجل، تجب متأخرًا.
- **معاملة الفهرس كالإجابة.** يجد الفهرس الكتل؛ ويختار `extract_answer` الجمل؛ ولا شيء منهما «يفهم». إذا كانت إجابة العرض خاطئة، فتحقّق هل رتّب البحث صحيحًا ووضع مقيّس الجمل المصطلحات في موضع خاطئ — الخطأ عادة طبقة أدنى من العَرَض.

## ما بنيته للتو

محرك استرجاع من أربع طبقات بلا تبعيات: مبخِّر ← فهرس معكوس ← مرتّب ← مجرّد، ملفوف في واجهة CLI تفاعلية، وكل إجابة تستشهد بملف مصدرها. البنية المنقولة هي *الاستدعاء الطبقي*: لا تسأل الفهرس أبدًا عن إجابة — تسأله مرشّحين، وتسجّل المرشّحين، وتستخرج من الأفضل. بدّل المبخِّر، أو المقيِّس (IDF, BM25)، أو المجرّد (ملخّص) باستقلال، وشكل خط الأنابيب — مرشّحون لا إجابات — هو ما يبقى.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/document-qa-engine/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/document-qa-engine) في مستودع المقرر يحوي السكربتات الكاملة إضافةً إلى نفس النص المؤلَّف الثلاثي. أو افتح المستودع كاملًا في [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## إلى أين تذهب من هنا

- أضف **توزين IDF**: المصطلحات النادرة ترفع سجل كتلة بينما العامة (`the`) تقلّصه — أكبر قفزة دقة بمجرد أقل من اثني عشر سطرًا في `search`.
- انقل المبخِّر إلى **وحدات جُمل**: اقسم على `sentences()` في `load_corpus` ليُحسَب «أي جملة تذكر X» مسبقًا، بحرق ذاكرة الكتل مقابل جودة الإجابات.
- أضف **جدول مرادفات** (`lizard → gecko`، `crustacean → hermit crab`) يُوسَّع وقت الفهرسة — استدعاء رخيص، والخطوة الطبيعية التالية في كسب الإجابات.
- بَيّتِ الفهرس (تفريغ/تحميل **`index.json`**) ليبني نصّي كبير مَرّ واحد ويُعيد تشغيل `ask.py` فورًا دون إعادة قراءة كل ملف.

## شارك مشروعك مع الصف

بنيت شيئًا تفتخر به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض مشاريع قدّمها طلاب آخرون — ويحوي README الخاص به شرحًا كاملًا صديقًا للمبتدئين لإضافة مشروعك عبر **طلب سحب (pull request)**، حتى لو لم تستخدم git من قبل: نسخ المستودع، وإنشاء فرع، والالتزام بملفاتك، وفتح الطلب، خطوة بخطوة. لا يفترض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة بايثون خارج المتصفح. 🎓