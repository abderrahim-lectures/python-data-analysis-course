---
title: "بناء تطبيق RAG فوق ملاحظاتك الخاصة"
slug: /projects/rag-notes
description: "تخرّج من بيئة البرمجة في المتصفح إلى Python فعلي: ابنِ تطبيق توليد معزَّز بالاسترجاع (RAG) يتيح لك محادثة ملاحظاتك الخاصة، بتضمينات محلية ونموذج لغوي من مستوى مجاني."
---

# 📚 بناء تطبيق RAG فوق ملاحظاتك الخاصة

كل شيء في الدورة حتى الآن عمل في بيئة تجريبية معزولة داخل المتصفح — حتى تتمكن من البدء بكتابة Python من اليوم الأول بلا أي إعداد. هذا المشروع هو خطوة التخرّج: ثبّت Python فعليًا على جهازك الخاص، ثم استخدمها لبناء أداة قد تستمر فعلاً في استخدامها — تطبيق يجيب عن أسئلة حول مجلد من ملاحظاتك الخاصة، عبر البحث فيها أولاً ثم سؤال نموذج لغوي أن يجيب بالاعتماد على ما وجده. هذا يفترض إنهاء Python 101؛ لا يُشترط أي شيء من تحليل البيانات، وإن كان يساعد أن تكون مصفوفات `numpy` مألوفة لديك بالفعل.

هذا اختياري وغير مُقيَّم. راجع [مشاريع من العالم الحقيقي](/docs/projects) للاطلاع على القائمة الكاملة، والتي تنمو باستمرار.

## 🎯 ما ستفعله

1. أخذ مجلد من ملاحظاتك الخاصة بصيغة `.md`/`.txt` وتقسيمها إلى أجزاء صغيرة قابلة للبحث.
2. تحويل كل جزء إلى متجه (vector) — قائمة من الأرقام تلتقط معناه — محليًا بالكامل، دون مفتاح API ودون أي تكلفة، باستخدام `sentence-transformers`.
3. كتابة دالة بحث محلية صغيرة تجد الأجزاء الأكثر صلة بسؤال ما، معتمدة فقط على `numpy`.
4. كتابة سكربت يسترجع الأجزاء ذات الصلة، ثم يسأل نموذجًا لغويًا من مستوى مجاني أن يجيب *باستخدام ذلك السياق فقط*.

## أين تُشغّل هذا

**محليًا بـ `uv`** هو المسار الذي تتبعه خطوات هذا الدرس، والمسار الموصى به — إنها Python حقيقية تعمل على جهازك الخاص، نفس حركة "التخرّج إلى Python حقيقية" كما في كل مشروع آخر في هذا القسم. يشرح قسم الإعداد أدناه كيفية تثبيتها.

**GitHub Codespaces** بديل بلا إعداد إن كنت تفضّل عدم تثبيت أي شيء محليًا الآن: افتح [مستودع الدورة كاملاً في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython وuv مثبّتون مسبقًا، وفق ملف `.devcontainer/devcontainer.json` الخاص بالمستودع) وشغّل نفس أوامر `uv` تمامًا من طرفية داخل تبويب المتصفح.

**Google Colab أو Kaggle Notebooks أو Binder** تعمل أيضًا، لأن هذا المشروع — على خلاف مشروع الضبط الدقيق — لا يحتاج وحدة معالجة رسومية. يتضمن المستودع دفتر ملاحظات جاهزًا للتشغيل مع ملاحظات العينة المضمّنة فيه بالفعل، بحيث لا تضطر لنسخ الخلايا يدويًا:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/rag-notes/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/rag-notes/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Frag-notes%2Fnotebook.ipynb)

انقر على شارة، وشغّل الخلايا من الأعلى إلى الأسفل، وألصق مفتاح API لنموذج لغوي من مستوى مجاني عند الطلب. لكن كن صادقًا مع نفسك بشأن المقايضة: هذه طريقة أقل دقة لتجربة المشروع من مشروع `uv` محلي حقيقي — لا ملفات منفصلة، ولا بنية مشروع حقيقية، مجرد خلايا في دفتر. تعامل معها كطريقة سريعة للتجريب، لا المسار الأساسي.

## الإعداد

### ثبّت `uv`

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

ثم أعدّ مشروعًا:

```bash
uv init rag-notes
cd rag-notes
uv add sentence-transformers numpy python-dotenv
```

`sentence-transformers` هي المكتبة التي تحوّل النص إلى متجهات محليًا، على معالجك الخاص (CPU) — دون استدعاء واجهة برمجية، ودون مفتاح. تقوم `numpy` بالحساب الفعلي لمقارنة المتجهات. تتيح لك `python-dotenv` الاحتفاظ بمفتاح API الخاص بنموذجك اللغوي في ملف `.env` محلي.

### احصل على مفتاح API لنموذج لغوي مجاني

يحتاج التوليد (خطوة هذا المشروع الأخيرة) إلى واجهة برمجية لنموذج لغوي من مستوى مجاني — الاسترجاع نفسه (تضمين ملاحظاتك والبحث فيها) محلي بالكامل ولا يحتاج مفتاحًا إطلاقًا، لكن من الأبسط إعداده الآن، قبل أن تبدأ البناء، بدلاً من التوقف في منتصف الطريق.

**اختر أي مزوّد تفضله** — لا يتطلب أيٌّ منها بطاقة ائتمان وقت كتابة هذا النص، وهذه الدورة لا تفضّل واحدًا على آخر.

| المزوّد | أين تحصل على مفتاح | لماذا قد تختاره |
|---|---|---|
| **GitHub Models** *(الافتراضي المقترح)* | [github.com/settings/tokens](https://github.com/settings/tokens) — رمز وصول شخصي بصلاحية `models: read` | لا تسجيل منفصل — لديك بالفعل حساب GitHub. حدود مستوى مجاني أكثر سخاءً من Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | الخيار الأكثر شيوعًا في المراجع. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | استدلال سريع، مستوى مجاني سخي، بلا بطاقة. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | من أكثر الحصص المجانية الدائمة سخاءً. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | حجم رموز يومي مرتفع، بلا بطاقة. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | واجهة برمجة واحدة، نماذج مجانية عديدة — جيدة لمقارنة المزوّدين. |

أيًّا كان اختيارك، العملية نفسها:

1. سجّل الدخول وولّد مفتاح API على موقع ذلك المزوّد.
2. **لا تلصق هذا المفتاح مطلقًا مباشرة في الكود أو تُودعه في مستودع.** ضعه في ملف `.env` بدلاً من ذلك (مُستثنى من git بالفعل):

```bash
# .env
GITHUB_TOKEN=your-key-here
```

تقرأ `python-dotenv` (المُثبَّتة أعلاه) هذا الملف تلقائيًا إلى `os.environ`، وهو نفس النمط المستخدم في [مشروع وكيل الذكاء الاصطناعي](/docs/projects/ai-agent) إن أنجزت ذلك المشروع — يصادف أن GitHub Models تعرض واجهة برمجية متوافقة مع OpenAI، لذا تعمل مكتبة عميل `openai` العادية معها دون أي حزمة إضافية:

```bash
uv add openai
```

إذا اخترت مزوّدًا مختلفًا، استبدل بعميل ذلك المزوّد الخاص عند وصولك إلى خطوة التوليد أدناه (انظر التلميح هناك).

## الخطوة 1: حضّر ملاحظاتك

ضع ملاحظاتك في مجلد `notes/` كملفات `.md` أو `.txt` عادية — ملاحظات محاضرات، يوميات، توثيق كتبته أنت، أي شيء. التطبيق الذي تبنيه يجيب فقط مما هو موجود فعلاً في هذه الملفات.

لا يمكنك تسليم ملف كامل لنموذج تضمين (embedding) وتوقع نتيجة بحث مفيدة. لسببين:

- **نماذج التضمين لديها حد سياق.** `all-MiniLM-L6-v2`، النموذج الذي يستخدمه هذا المشروع، يقتطع المُدخل بعد 256 قطعة كلمة (word-piece) — أطعمه ملفًا من 2000 كلمة وكل ما بعد الحد يُتجاهل بصمت.
- **متجه جزء كبير هو متوسط ضبابي.** إذا غطّت ملاحظة خمسة مواضيع فرعية مختلفة، ينتهي متجه التضمين الوحيد لها في مكان ما وسط الخمسة جميعًا — قريب من لا شيء منها بدقة. ابحث عن سؤال يخص موضوعًا فرعيًا واحدًا فقط، وقد لا يحصل ذلك المتجه على ترتيب عالٍ رغم أن الإجابة موجودة فعلاً في النص. كل جزء أصغر وأكثر تركيزًا يحصل على متجه أوضح وأكثر تحديدًا، بحيث يجد الاسترجاع المقطع *الفعلي* ذا الصلة بدلاً من ملف كامل ذي صلة جزئية فقط.

قسّم كل ملف إلى أجزاء حسب الفقرة، ثم أعد دمج الفقرات الصغيرة جدًا حتى حجم مستهدف حتى لا تنتهي بعشرات الشظايا ذات السطر الواحد:

### 1.1 اكتب نص التقسيم

**👟 تلميح البداية :** أصغر خطوة أولى هي نص يحسب فقط عدد الأجزاء التي يُنتجها مجلد `notes/` قبل أي تضمين. انسخ `prepare_notes.py` أدناه — يقسم على الأسطر الفارغة، ويدمج الفقرات الصغيرة حتى `TARGET_CHUNK_SIZE`، ويطبع ملخصًا:

```python
# prepare_notes.py
"""Splits every .md/.txt file in notes/ into a list of text chunks.

Run with: uv run python prepare_notes.py

This only prints a summary -- build_index.py (Step 2) imports load_chunks()
from this file and does the actual embedding.
"""

from pathlib import Path

NOTES_DIR = Path("notes")
TARGET_CHUNK_SIZE = 500  # characters -- small enough to stay focused,
                         # large enough to hold a full thought

def split_into_paragraphs(text: str) -> list[str]:
    """Splits on blank lines, dropping empty paragraphs."""
    paragraphs = [p.strip() for p in text.split("\n\n")]
    return [p for p in paragraphs if p]

def merge_short_paragraphs(paragraphs: list[str], target_size: int) -> list[str]:
    """Greedily merges consecutive short paragraphs up to target_size characters,
    so a chunk isn't just one short line with barely any context in it."""
    chunks = []
    current = ""
    for paragraph in paragraphs:
        if current and len(current) + len(paragraph) > target_size:
            chunks.append(current)
            current = paragraph
        else:
            current = f"{current}\n\n{paragraph}" if current else paragraph
    if current:
        chunks.append(current)
    return chunks

def load_chunks() -> list[dict]:
    """Returns a list of {"text": ..., "source": ...} dicts, one per chunk,
    across every .md/.txt file in NOTES_DIR."""
    chunks = []
    for path in sorted(NOTES_DIR.glob("*.md")) + sorted(NOTES_DIR.glob("*.txt")):
        text = path.read_text(encoding="utf-8")
        paragraphs = split_into_paragraphs(text)
        for chunk_text in merge_short_paragraphs(paragraphs, TARGET_CHUNK_SIZE):
            chunks.append({"text": chunk_text, "source": path.name})
    return chunks

if __name__ == "__main__":
    chunks = load_chunks()
    print(f"Loaded {len(chunks)} chunks from {NOTES_DIR}/")
    for chunk in chunks[:3]:
        preview = chunk["text"][:80].replace("\n", " ")
        print(f"  [{chunk['source']}] {preview}...")
```

```bash
uv run python prepare_notes.py
```

:::tip[حجم الجزء مقايضة، لا قاعدة ثابتة]
الأجزاء الأصغر تُسترجع بدقة أكبر (يطابق السؤال قطعة نص ضيقة ومحددة) لكنها تفقد السياق المحيط (يرى النموذج شظية معزولة، لا الفقرة المحيطة بها). الأجزاء الأكبر تحافظ على سياق أكثر لكنها تُسترجع بدقة أقل، لنفس سبب الملف الكامل، فقط بحدة أقل. 500 حرف نقطة بداية معقولة للملاحظات النثرية — لا يوجد رقم صحيح عالميًا، ويستحق تجربة بضعة أحجام على ملاحظاتك الخاصة لترى أيها يُسترجع بشكل أفضل.
:::

**🎯 الناتج المتوقع :** يطبع `uv run python prepare_notes.py` عددًا غير صفري من الأجزاء، وتبدو الأجزاء المعاينة كشظايا حقيقية من ملاحظاتك — لا سلاسل فارغة ولا كتلة عملاقة من كل شيء مدمج معًا.

**🩹 إذا لم يعمل :** عدد أجزاء يساوي 0 يعني أن `NOTES_DIR` لا يشير إلى مجلد يحتوي أي ملفات `.md`/`.txt` — تحقق جيدًا من المسار من حيث تشغّل النص. وأخيرًا، كتلة عملاقة واحدة لكل ملف تعني عادةً أن ملاحظاتك لا تحتوي فواصل أسطر فارغة بين الفقرات، فيتعامل `split_into_paragraphs` مع الملف كله كفقرة واحدة — مما سيُضبب الاسترجاع لاحقًا (انظر السؤال السقراطي).

### 1.2 تحقق من التقسيم

**✅ قائمة التحقق**

- ✅ يعمل `uv run python prepare_notes.py` دون أخطاء ويطبع عددًا غير صفري من الأجزاء.
- ✅ المعاينات المطبوعة تبدو كشظايا حقيقية من ملاحظاتك، لا سلاسل فارغة أو كتلًا هائلة من نص مدمج.
- ✅ يشير `NOTES_DIR` إلى مجلد يحتوي فعلاً ملفات `.md`/`.txt`.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- إن قسّمت حسب الأسطر الفارغة لكن أحد ملفات ملاحظاتك لا يحتوي أي سطر فارغ على الإطلاق (مجرد فقرة واحدة عملاقة)، ماذا سيُعيد `split_into_paragraphs`، وماذا سيفعل ذلك بالاسترجاع لاحقًا؟
- ماذا سيحدث لجودة الاسترجاع لو جعلت `TARGET_CHUNK_SIZE` أكبر بكثير — لنقل 5000 حرف؟ أو أصغر بكثير، مثل 50؟ لماذا؟

## الخطوة 2: ضمّن ملاحظاتك محليًا

**التضمين** (embedding) هو قائمة من الأرقام — متجه — يمثّل *معنى* قطعة نص، لا صياغتها الدقيقة. يحوّل `all-MiniLM-L6-v2` كل جزء إلى نقطة في فضاء بـ384 بُعدًا، وهو مُدرَّب بحيث تنتهي الأجزاء ذات المعنى المتشابه قريبة من بعضها في ذلك الفضاء، بينما تنتهي الأجزاء غير المرتبطة بعيدة عن بعضها. لديك بالفعل الحدس الجوهري لهذا: إنها نفس فكرة رسم بيانات رقمية على محاور، فقط بـ384 محورًا بدلاً من 2، و"القرب" يُقاس بنفس الطريقة التي تقيس بها المسافة في أي فضاء من الأرقام.

هذا النموذج صغير (حوالي 80 ميغابايت)، يعمل بالكامل على معالجك في حوالي ثانية واحدة لكل جزء على حاسوب محمول نموذجي، لا يحتاج مفتاح API، ولا يكلّف شيئًا — على خلاف النموذج اللغوي في الخطوة 4، التضمين محلي بالكامل.

### 2.1 ابنِ فهرس التضمين

**👟 تلميح البداية :** أصغر خطوة أولى هي نص يضمّن كل جزء ويحفظ المتجهات. انسخ `build_index.py` أدناه — يحمّل أجزاءك من الخطوة 1، ويضمّنها محليًا بـ `all-MiniLM-L6-v2`، ويكتب ملفين (`index.npy` للمتجهات، و`chunks.json` للنص)، بحيث لا يضطر وقت الاستعلام إلى إعادة تضمين أي شيء:

```python
# build_index.py
"""Embeds every chunk from prepare_notes.py and saves the vectors + text
locally, so retrieve() (Step 3) doesn't need to re-embed anything at query time.

Run with: uv run python build_index.py
Re-run this any time you add or edit files in notes/ -- the saved index
doesn't update itself.
"""

import json

import numpy as np
from sentence_transformers import SentenceTransformer

from prepare_notes import load_chunks

MODEL_NAME = "all-MiniLM-L6-v2"
INDEX_PATH = "index.npy"
CHUNKS_PATH = "chunks.json"

def main() -> None:
    chunks = load_chunks()
    if not chunks:
        print("No chunks found -- add some .md/.txt files to notes/ first.")
        return

    print(f"Embedding {len(chunks)} chunks with {MODEL_NAME}...")
    model = SentenceTransformer(MODEL_NAME)
    texts = [chunk["text"] for chunk in chunks]
    embeddings = model.encode(texts, normalize_embeddings=True)

    np.save(INDEX_PATH, embeddings)
    with open(CHUNKS_PATH, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)

    print(f"Saved {embeddings.shape[0]} vectors ({embeddings.shape[1]}-dim) to {INDEX_PATH}")
    print(f"Saved chunk text/metadata to {CHUNKS_PATH}")

if __name__ == "__main__":
    main()
```

```bash
uv run python build_index.py
```

هذا يتجنب عمدًا قاعدة بيانات متجهات — لمجلد شخصي من الملاحظات (مئات أو آلاف قليلة من الأجزاء، لا الملايين)، مصفوفة NumPy عادية تسع بارتياح في الذاكرة أبسط، لا تحتاج خدمة إضافية للتثبيت أو التشغيل، وشفافة بالكامل: `index.npy` مصفوفة، و`chunks.json` هو النص الذي جاءت منه، لا أكثر.

`normalize_embeddings=True` يضبط طول كل متجه ليصبح 1 — يستحق فعل ذلك الآن بدلاً من وقت الاستعلام، لأنه ما يجعل تشابه جيب التمام (cosine similarity) في الخطوة 3 يختزل إلى ضرب نقطي واحد.

**🎯 الناتج المتوقع :** يكتمل `uv run python build_index.py` ويطبع الشكل المحفوظ — رقم أول يطابق عدد أجزاء خطوتك 1 ورقم ثانٍ هو `384` — وملفا `index.npy` و`chunks.json` موجودان الآن في مجلد مشروعك.

**🩹 إذا لم يعمل :** إذا طبع "No chunks found"، فمجلد `notes/` فارغ أو أن `load_chunks` لا يرى ملفاتك — تحقق من `NOTES_DIR` وأعد تشغيل `prepare_notes.py`. إذا لم يكن الرقم الثاني من الشكل 384، فأنتج نموذجك بُعدًا مختلفًا للتضمين، وهذا جيد طالما واصلت استخدام *نفس* النموذج للاستعلامات.

### 2.2 تحقق من الفهرس

**✅ قائمة التحقق**

- ✅ اكتمل `uv run python build_index.py` دون أخطاء.
- ✅ ملف `index.npy` وملف `chunks.json` موجودان الآن في مجلد مشروعك.
- ✅ الرقم الأول من الشكل (shape) المطبوع يطابق عدد الأجزاء من الخطوة 1، والرقم الثاني هو 384.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يستخدم جزآن كلمة "Python" بمعنيين مختلفين تمامًا — أحدهما عن لغة البرمجة، والآخر عن الثعبان. هل تتوقع أن تنتهي متجهات تضمينهما قريبة من بعضها أم بعيدة؟ ماذا يخبرك ذلك عمّا يلتقطه نموذج التضمين فعليًا؟
- لماذا تحفظ التضمينات في ملف أصلاً، بدلاً من إعادة تضمين كل ملاحظاتك في كل مرة تطرح فيها سؤالاً؟

## الخطوة 3: استرجع الأجزاء ذات الصلة

لإيجاد الأجزاء ذات الصلة بسؤال ما، ضمّن السؤال بنفس النموذج، ثم رتّب كل جزء حسب مدى قرب متجهه من متجه السؤال. الطريقة المعيارية لقياس "القرب" للتضمينات هي **تشابه جيب التمام** (cosine similarity) — جيب تمام الزاوية بين متجهين، والذي يهتم بـ*الاتجاه* (المعنى) ويتجاهل *المقدار* (تقريبًا، طول النص):

$$
\text{cosine\_similarity}(a, b) = \frac{a \cdot b}{\|a\| \, \|b\|}
$$

بما أن كل متجه طُبِّع بالفعل إلى طول 1 عند حفظه ($\|a\| = \|b\| = 1$)، فإن المقام يساوي 1 فقط، ويختزل تشابه جيب التمام إلى ضرب نقطي عادي — سبب آخر للتطبيع وقت التضمين بدلاً من تخطي ذلك.

### 3.1 اكتب دالة الاسترجاع

**👟 تلميح البداية :** أصغر خطوة أولى هي دالة `retrieve(question, top_k)` تحمّل الفهرس المحفوظ وتعيد الأجزاء الأكثر تشابهًا. انسخ `retrieve.py` أدناه — يضمّن السؤال بـ *نفس* النموذج، ويضربه نقطيًا في كل متجه محفوظ، ويرتب حسب الدرجة:

```python
# retrieve.py
"""Given a question, finds the notes chunks most relevant to it.

Imported by ask.py (Step 4) -- not meant to be run directly, though the
__main__ block below lets you try it standalone.
"""

import json

import numpy as np
from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"
INDEX_PATH = "index.npy"
CHUNKS_PATH = "chunks.json"

_model = None  # loaded lazily so importing this module doesn't load the model

def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model

def retrieve(question: str, top_k: int = 3) -> list[dict]:
    """Returns the top_k chunks most similar to `question`, each with its
    similarity score, ranked highest first."""
    embeddings = np.load(INDEX_PATH)
    with open(CHUNKS_PATH, encoding="utf-8") as f:
        chunks = json.load(f)

    question_vector = get_model().encode([question], normalize_embeddings=True)[0]

    # Every row of `embeddings` is already unit-length (Step 2), and so is
    # question_vector, so this dot product *is* the cosine similarity.
    similarities = embeddings @ question_vector

    top_indices = np.argsort(similarities)[::-1][:top_k]
    return [
        {**chunks[i], "score": float(similarities[i])}
        for i in top_indices
    ]

if __name__ == "__main__":
    results = retrieve("What is this course about?")
    for r in results:
        print(f"{r['score']:.3f}  [{r['source']}]  {r['text'][:80]}...")
```

```bash
uv run python retrieve.py
```

`embeddings @ question_vector` هو ضرب مصفوفة في متجه: كل صف من المصفوفة يُضرب نقطيًا بمتجه السؤال، دفعة واحدة، في استدعاء NumPy واحد — نفس العملية من مادة الجبر الخطي في الدورة، تقوم هنا فعليًا بمقارنة سؤال واحد مقابل كل جزء في الملاحظات.

**🎯 الناتج المتوقع :** يطبع `uv run python retrieve.py` نتائج `top_k`، كل واحدة بدرجة تشابه واسم ملف مصدر، والجزء الأعلى ترتيبًا لسؤال اختبار سهل وواضح يبدو فعلاً ذا صلة عند قراءته.

**🩹 إذا لم يعمل :** درجات بعيدة جدًا عن نطاق -1 إلى 1 تعني دائمًا تقريبًا أن أحد المتجهات لم يُطبَّع — ارجع وتأكد من تشغيل `normalize_embeddings=True` في كلٍّ من `build_index.py` و`retrieve()`. إذا أخطأت `retrieve` بـ `FileNotFoundError`، ففهرس الخطوة 2 غير موجود — أعد تشغيل `uv run python build_index.py` أولاً.

### 3.2 تحقق من الاسترجاع

**✅ قائمة التحقق**

- ✅ يطبع `uv run python retrieve.py` نتائج `top_k`، كل واحدة بدرجة تشابه واسم ملف مصدر.
- ✅ الجزء الأعلى ترتيبًا لسؤال اختبار سهل وواضح يبدو فعلاً ذا صلة عند قراءته.
- ✅ الدرجات بين -1 و1 (النطاق الصالح لتشابه جيب التمام) — إن رأيت أرقامًا بعيدة عن ذلك النطاق كثيرًا، فمن المرجح أن أحد المتجهين لم يُطبَّع.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يرتب `np.argsort(similarities)[::-1][:top_k]` *كل* درجات التشابه قبل أخذ القلة الأعلى. لمجلد ملاحظات شخصي هذا لا بأس به، لكن لماذا قد يصبح ترتيب المصفوفة بأكملها مشكلة لو كان لديك عشرة ملايين جزء بدلاً من بضع مئات؟
- ماذا تتوقع أن يحدث لدرجة النتيجة الأعلى لو طرحت سؤالاً لا توجد له إجابة حقيقية في أي مكان من ملاحظاتك؟ جرّب ذلك — هل تؤكد الدرجة توقعك؟

## الخطوة 4: ولّد إجابة بنموذج لغوي مجاني

الاسترجاع وحده يعيد لك أجزاءً خامًا من ملاحظاتك الخاصة — مفيد، لكنه ليس إجابة مكتوبة. الخطوة الأخيرة تسلّم تلك الأجزاء لنموذج لغوي كسياق وتطلب منه أن يجيب *باستخدامها*. هذا ما تعنيه "RAG" (التوليد المعزَّز بالاسترجاع): توليد، معزَّز بخطوة استرجاع تُشغَّل أولاً. لقد حصلت بالفعل على مفتاح API من مستوى مجاني وثبّت عميل `openai` أثناء الإعداد أعلاه.

### 4.1 اكتب `ask.py`

**👟 تلميح البداية :** أصغر خطوة أولى هي نص يلصق الاسترجاع بالتوليد. انسخ `ask.py` أدناه — يسترجع الأجزاء العليا، ويبني موجِّهًا (prompt) يسلّم النموذج ذلك السياق فقط، ويطبع الإجابة:

```python
# ask.py
"""Retrieves relevant chunks for a question, then asks a free-tier LLM to
answer using only that context.

Run with: uv run python ask.py "your question here"
"""

import os
import sys

from dotenv import load_dotenv
from openai import OpenAI

from retrieve import retrieve

load_dotenv()

PROMPT_TEMPLATE = """Answer the question using ONLY the context below. If the
context doesn't contain the answer, say so -- do not make something up.

Context:
{context}

Question: {question}

Answer:"""

def build_prompt(question: str, chunks: list[dict]) -> str:
    context = "\n\n".join(f"[{c['source']}] {c['text']}" for c in chunks)
    return PROMPT_TEMPLATE.format(context=context, question=question)

def ask(question: str, top_k: int = 3) -> str:
    chunks = retrieve(question, top_k=top_k)
    prompt = build_prompt(question, chunks)

    client = OpenAI(
        api_key=os.environ["GITHUB_TOKEN"],
        base_url="https://models.github.ai/inference",
    )
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # confirm this still has a free tier before running
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content

if __name__ == "__main__":
    question = " ".join(sys.argv[1:]) or "What is this course about?"
    print(ask(question))
```

```bash
uv run python ask.py "What is this course about?"
```

`build_prompt` هي فكرة RAG بأكملها في دالة واحدة: لا تطلب من النموذج الإجابة مما يعرفه بالفعل، بل تسلّمه *النص المُسترجَع الفعلي* وتطلب منه الإجابة انطلاقًا منه — وهذا سبب قدرة تطبيق RAG على الإجابة بشكل صحيح عن أسئلة حول ملاحظات لم يرَ النموذج الأساسي أيًّا منها من قبل، كُتبت بالأمس، على جهازك الخاص.

:::tip[تستخدم مزوّدًا مختلفًا؟]
استبدل كتلة `OpenAI(...)` بعميل مزوّدك الخاص، متبعًا نفس النمط الموضّح في [مشروع وكيل الذكاء الاصطناعي](/docs/projects/ai-agent#step-1-write-your-first-agent) — مثل حزمة `google-genai` من Google لـ Gemini، أو عميل `groq` الخاص لـ Groq. Cerebras وOpenRouter متوافقان أيضًا مع OpenAI، لذا تعمل حزمة `openai` معهما أيضًا، فقط بـ `base_url` مختلف.
:::

**🎯 الناتج المتوقع :** يطبع `uv run python ask.py "سؤال حقيقي عن ملاحظاتك"` إجابة، ليس تتبّع خطأ — والإجابة تعكس محتوى ملاحظاتك، لا معرفة عامة كان النموذج يملكها بالفعل.

**🩹 إذا لم يعمل :** `KeyError` على `GITHUB_TOKEN` يعني أن `load_dotenv()` لا يلتقط ملف `.env` الخاص بك — تحقق من وجود الملف بجوار المكان الذي تشغّل منه النص. إذا كانت الإجابة معرفة عامة بدلاً من محتوى ملاحظاتك، فأعاد الاسترجاع أجزاءً خاطئة (أعد التحقق من الخطوة 3) أو تجاهل النموذج السياق. إذا أنتج سؤالٌ لا تغطيه ملاحظاتك بوضوح إجابةً مختلقة بثقة، فتعليمة "قل ذلك" لا تُنفَّذ — هذا بالضبط ما يستكشفه السؤال السقراطي في الخطوة 4.

### 4.2 تحقق من إجابة RAG

**✅ قائمة التحقق**

- ✅ يطبع `uv run python ask.py "سؤال حقيقي عن ملاحظاتك"` إجابة، لا تتبّع خطأ (traceback).
- ✅ الإجابة تعكس فعلاً محتوى ملاحظاتك، لا معرفة عامة كان النموذج يملكها بالفعل.
- ✅ طرح شيء لا تغطيه ملاحظاتك بوضوح يجعل النموذج يقول ذلك، بدلاً من اختلاق شيء بثقة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يقول قالب المُوجِّه صراحة "باستخدام السياق أدناه فقط" و"إذا لم يحتوِ السياق على الإجابة، قل ذلك." ما الذي تعتقد أنه سيحدث لو أزلت تلك التعليمة وسلّمت النموذج السياق والسؤال فقط دون أي توجيه؟ جرّب ذلك.
- إذا أعادت `retrieve()` الأجزاء *الخاطئة* لسؤال ما — تبدو ذات صلة لكنها ليست الإجابة فعلاً — هل يستطيع نموذج لغوي جيد أن يصل مع ذلك إلى الإجابة الصحيحة؟ ماذا يوحي ذلك بشأن أي جزء من هذا الأنبوب (pipeline) أهم عندما يحدث خطأ ما: الاسترجاع أم التوليد؟

## ⚠️ المآزق الشائعة

- **أجزاء كبيرة جدًا أو صغيرة جدًا.** كبيرة جدًا فيصبح الاسترجاع ضبابيًا (الخطوة 1)؛ صغيرة جدًا فيفقد الجزء السياق المحيط الذي يحتاجه النموذج للإجابة جيدًا. إن شعرت أن الإجابات غير دقيقة، جرّب `TARGET_CHUNK_SIZE` مختلفًا وأعد تشغيل `build_index.py`.
- **نسيان إعادة بناء الفهرس بعد تعديل `notes/`.** يعمل `build_index.py` فقط عندما تشغّله — أضف ملاحظة جديدة، ولن تجد `retrieve()` أي شيء فيها حتى تعيد تشغيل `uv run python build_index.py`. لا يوجد مراقب ملفات هنا؛ هذه خطوة يدوية بتصميم متعمد، حتى تعرف دائمًا بالضبط ما هو مُفهرَس.
- **تضمين السؤال بنموذج مختلف عن ذلك المستخدم لبناء الفهرس.** يُثبِّت كل من `retrieve.py` و`build_index.py` قيمة `MODEL_NAME = "all-MiniLM-L6-v2"` عمدًا — المتجهات من نموذجَي تضمين مختلفين غير قابلة للمقارنة إطلاقًا، حتى لو كان كلاهما "بـ384 بُعدًا." غيّر النموذج في ملف واحد ويجب أن تغيّره في كليهما، ثم تعيد بناء الفهرس.
- **حدود المعدل على مستوى النموذج اللغوي المجاني.** الاسترجاع (الخطوتان 2-3) محلي وبلا حدود؛ فقط استدعاء `ask()` في الخطوة 4 يُحتسب ضمن حصة مستوى مزوّدك المجاني. خطأ 429 هناك هو المزوّد يخبرك بالتمهل، لا خطأ برمجي — انظر [مشروع وكيل الذكاء الاصطناعي](/docs/projects/ai-agent) لنفس النمط ومنهج إعادة محاولة يمكنك نسخه.

## ما بنيته للتو

أنبوب RAG صغير لكن كامل: تقسيم إلى أجزاء، تضمين محلي، بحث تشابه في الذاكرة، وخطوة توليد نهائية مرتكزة على نصك المُسترجَع الخاص — نفس البنية المعمارية وراء أنظمة إنتاجية أكبر بكثير، فقط بمصفوفة NumPy مسطّحة تحل محل قاعدة بيانات متجهات وواجهة برمجية من مستوى مجاني تحل محل واحدة مدفوعة. لم يُزيَّف أو يُبسَّط شيء هنا إلى لعبة لا تعمم؛ استبدل بمجلد ملاحظات أكبر ونموذج مدفوع، وتبقى نفس الخطوات الأربع هي الأنبوب بأكمله.

## إلى أين تذهب من هنا

- بمجرد أن يكبر مجلد ملاحظاتك عما يسع بارتياح في الذاكرة (عشرات الآلاف من الأجزاء)، انظر إلى قاعدة بيانات متجهات حقيقية مثل [ChromaDB](https://www.trychroma.com/) — تقوم بنفس بحث الجار الأقرب الذي تقوم به `retrieve()` أعلاه، فقط مُفهرَسة للسرعة على مقياس أكبر بكثير، مع استمرارية على القرص وتصفية لا تملكهما هذه النسخة ذات الملف المسطّح.
- جرّب **إعادة الترتيب** (re-ranking): استرجع top-k أكبر (لنقل، 10) ببحث التضمين السريع، ثم استخدم نموذج مُشفِّر متقاطع (cross-encoder) أبطأ وأكثر دقة لإعادة تقييم تلك العشرة فقط قبل اختيار الثلاثة النهائية لإرسالها إلى النموذج اللغوي — نمط شائع من مرحلتين في أنظمة RAG الإنتاجية.
- وسّع `prepare_notes.py` للتعامل مع أنواع ملفات أكثر — ملفات PDF (`pypdf`)، أو حتى تصديرات محادثاتك القديمة — خطوات التقسيم والتضمين اللاحقة لا يهمها من أين جاء النص.

## شارك مشروعك مع الصف

بنيت شيئًا تفتخر به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع أرسلها طلاب آخرون — وملف README الخاص به يحتوي شرحًا كاملاً وودودًا للمبتدئين لإضافة مشروعك عبر **طلب سحب (pull request)**، حتى لو لم تستخدم git من قبل: عمل fork للمستودع، إنشاء فرع، تثبيت ملفاتك، وفتح طلب السحب، خطوة بخطوة. لا يُفترض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓
