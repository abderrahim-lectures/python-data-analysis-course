---
id: chat-with-pdfs
title: "تحدث مع ملفات PDF الخاصة بك"
sidebar_label: "تحدث مع ملفات PDF"
slug: /projects/chat-with-pdfs
description: "ابنِ تطبيق RAG متعدد المستندات فوق مجلد من ملفات PDF، بتضمينات محلية، ونموذج لغوي من مستوى مجاني، واستشهادات برقم الصفحة في كل إجابة."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 تحدث مع ملفات PDF الخاصة بك

<ProjectPublishedDate projectId="2027-chat-with-pdfs" />

<ProjectGreeting />

[مشروع تطبيق RAG](/docs/projects/rag-notes) يتحدث مع مجلد من ملاحظات نصية بسيطة. يأخذ هذا المشروع نفس الفكرة إلى مكان أكثر فائدة: مجلد من ملفات PDF حقيقية — تقارير، أدلة، كتيبات، أوراق بحثية — بإجابات تستشهد بالضبط بأي مستند وأي صفحة جاءت منها حقيقة ما، تمامًا كما يفعل مساعد بحث. هذا يفترض Python 101؛ يساعد كثيرًا أيضًا أن تكون قد بنيت مشروع تطبيق RAG بالفعل، إذ يعيد هذا المشروع استخدام بنيته بالكامل ولا يغيّر إلا كيفية قراءة المستندات المصدر والاستشهاد بها، لكنه ليس شرطًا صارمًا إذا كنت مرتاحًا مع المفاهيم.

هذا اختياري وغير مُقيَّم. راجع [مشاريع من العالم الحقيقي](/docs/projects) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. استخراج النص من مجلد من ملفات PDF، صفحة بصفحة، وتقسيمه إلى أجزاء صغيرة — مع الاحتفاظ باسم ملف المصدر ورقم الصفحة مرفقين بكل جزء.
2. تحويل كل جزء إلى متجه (vector)، محليًا بالكامل، بلا مفتاح API وبلا تكلفة، باستخدام `sentence-transformers`.
3. استرجاع الأجزاء الأكثر صلة بسؤال عبر *كل* ملفات PDF في آنٍ واحد، ثم سؤال نموذج لغوي من مستوى مجاني الإجابة باستخدام ذلك السياق فقط — مع استشهاد `(المصدر، الصفحة N)` مطلوب لكل حقيقة.
4. تغليف كل هذا في حلقة تفاعلية صغيرة لكي تستمر في طرح الأسئلة دون إعادة تشغيل سكربت في كل مرة.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الذي تتبعه خطوات هذا الدرس، والموصى به — إنه Python فعلي يعمل على جهازك الخاص، نفس خطوة "التخرّج إلى Python فعلي" كأي مشروع آخر في هذا القسم. يشرح قسم الإعداد أدناه كيفية تثبيته.

**GitHub Codespaces** بديل بلا إعداد إذا كنت تفضّل عدم تثبيت أي شيء محليًا بعد: افتح [مستودع الدورة كاملًا في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython وuv مثبّتة بالفعل، وفق `.devcontainer/devcontainer.json` الخاص بالمستودع) وشغّل نفس أوامر `uv` تمامًا من طرفية في تبويب متصفحك.

**Google Colab وKaggle Notebooks أو Binder** تعمل أيضًا، لأن هذا المشروع لا يحتاج GPU — نسخة دفتر ملاحظات حقيقية وقابلة للتشغيل من خط أنابيب هذا المشروع (نفس تقسيم PDF، والتضمين المحلي، وتوليد الإجابات المُستشهد بها كما في الخطوات أدناه) موجودة في [`examples/chat-with-pdfs/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/chat-with-pdfs/notebook.ipynb). انقر على شارة لتشغيله مباشرة، دون أي تثبيت محلي على الإطلاق:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/chat-with-pdfs/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/chat-with-pdfs/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fchat-with-pdfs%2Fnotebook.ipynb)

كن صادقًا مع نفسك بشأن المقايضة، مع ذلك: هذه طريقة أقل دقة لتجربة المشروع من مشروع `uv` محلي فعلي — بلا ملفات منفصلة، بلا بنية مشروع حقيقية، مجرد خلايا في دفتر ملاحظات. عامِلها كطريقة سريعة للتجربة، لا المسار الأساسي.

## الإعداد

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

ثم أعِدَّ مشروعًا:

```bash
uv init chat-with-pdfs
cd chat-with-pdfs
uv add pypdf sentence-transformers numpy openai python-dotenv
```

تقرأ `pypdf` النص من ملفات PDF. `sentence-transformers` هي المكتبة التي تحوّل النص إلى متجهات محليًا، على وحدة المعالجة المركزية الخاصة بك — بلا استدعاء API، بلا مفتاح. تقوم `numpy` بالحسابات الفعلية لمقارنة المتجهات. تتيح لك `python-dotenv` الاحتفاظ بمفتاح API الخاص بالنموذج اللغوي في ملف `.env` محلي.

### احصل على مفتاح API مجاني لنموذج لغوي

يحتاج التوليد (الجزء الأخير من الخطوة 3) واجهة برمجية لنموذج لغوي من مستوى مجاني — الاستخراج والتقسيم والتضمين والاسترجاع كلها محلية تمامًا ولا تحتاج أي مفتاح على الإطلاق، لكن من الأبسط إعداد هذا الآن، قبل أن تبدأ البناء، بدلًا من التوقف في المنتصف.

**اختر المزوّد الذي تفضّله** — لا يتطلب أي منها بطاقة ائتمان وقت كتابة هذا، ولا تفضّل هذه الدورة أحدهم على الآخر.

| المزوّد | أين تحصل على مفتاح | لماذا قد تختاره |
|---|---|---|
| **GitHub Models** *(الافتراضي المقترح)* | [github.com/settings/tokens](https://github.com/settings/tokens) — رمز وصول شخصي بنطاق `models: read` | لا تسجيل منفصل — لديك حساب GitHub بالفعل. حدود مستوى مجاني أكثر سخاءً من Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | الخيار الأكثر ذكرًا شيوعًا. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | استدلال سريع، مستوى مجاني سخي، بلا بطاقة. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | واحدة من أكثر الحصص المجانية الدائمة سخاءً. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | حجم رموز يومي مرتفع، بلا بطاقة. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | واجهة برمجة واحدة، نماذج مجانية عديدة — جيدة لمقارنة المزوّدين. |

أيًّا كان الذي تختاره، العملية واحدة:

1. سجّل الدخول وأنشئ مفتاح API على موقع ذلك المزوّد.
2. **لا تلصق هذا المفتاح أبدًا مباشرة في الكود ولا ترفعه إلى مستودع.** ضعه بدلًا من ذلك في ملف `.env` (مُستثنى بالفعل في gitignore):

```bash
# .env
GITHUB_TOKEN=مفتاحك-هنا
```

تقرأ `python-dotenv` (المثبَّتة أعلاه) هذا الملف إلى `os.environ` تلقائيًا، نفس النمط المُستخدَم في [مشروع تطبيق RAG](/docs/projects/rag-notes) و[مشروع وكيل الذكاء الاصطناعي](/docs/projects/ai-agent) إن أكملت أيًّا منهما — يصادف أن GitHub Models تعرض واجهة برمجية متوافقة مع OpenAI، لذا تعمل مكتبة عميل `openai` البسيطة لها دون أي حزمة إضافية:

```bash
uv add openai
```

إذا اخترت مزوّدًا مختلفًا، استبدل بعميل ذلك المزوّد الخاص عندما تصل إلى خطوة التوليد أدناه (انظر التلميح هناك).

### احصل على بعض ملفات PDF

ضع حفنة من ملفات PDF حقيقية — تقارير، أدلة، أوراق بحثية، أي شيء فيه نص فعلي (لا صور مُمسوحة ضوئيًا) — في مجلد `pdfs/` داخل مشروعك. إذا لم يكن لديك أي منها في متناول اليد، انسخ ملفات PDF النموذجية الثلاثة القصيرة من [`examples/chat-with-pdfs/pdfs/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/chat-with-pdfs/pdfs)، أو ولِّد ملفاتك الخاصة بسكربت [`generate_sample_pdfs.py` من المثال](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/chat-with-pdfs/generate_sample_pdfs.py).

## الخطوة 1: حمّل وقسّم ملفات PDF الخاصة بك

تستخرج `pypdf` النص من PDF صفحة واحدة في كل مرة، وهذا بالضبط مستوى التفصيل الذي يحتاجه هذا المشروع — إنه ما يجعل من الممكن قول *من أي صفحة* جاءت إجابة لاحقًا. كما في مشروع تطبيق RAG، تكون الصفحة كاملة عادة لا تزال كبيرة جدًا وغير مركّزة بما يكفي للتضمين الجيد، لذا تُقسَّم كل صفحة إلى أجزاء أصغر — لكن على عكس ذلك المشروع، يجب على كل جزء هنا أيضًا أن يتذكر من أي ملف وأي صفحة جاء.

```python
# load_pdfs.py
"""Loads every PDF in pdfs/, extracts text page by page, and splits each
page into small chunks -- keeping the source filename and page number
attached to every chunk, so later answers can cite exactly where a fact
came from.

Run with: uv run python load_pdfs.py

This only prints a summary -- build_index.py (Step 2) imports load_chunks()
from this file and does the actual embedding.
"""

from pathlib import Path

from pypdf import PdfReader

PDFS_DIR = Path("pdfs")
TARGET_CHUNK_SIZE = 500  # characters -- small enough to stay focused,
                         # large enough to hold a full thought


def split_into_paragraphs(text: str) -> list[str]:
    """Splits on blank lines, dropping empty paragraphs. Falls back to
    splitting on single newlines if a page has no blank-line breaks at
    all, which is common in PDFs extracted from single-column layouts."""
    paragraphs = [p.strip() for p in text.split("\n\n")]
    paragraphs = [p for p in paragraphs if p]
    if len(paragraphs) <= 1:
        paragraphs = [p.strip() for p in text.split("\n")]
        paragraphs = [p for p in paragraphs if p]
    return paragraphs


def merge_short_paragraphs(paragraphs: list[str], target_size: int) -> list[str]:
    """Greedily merges consecutive short paragraphs up to target_size
    characters, so a chunk isn't just one short line with barely any
    context in it."""
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
    """Returns a list of {"text", "source", "page"} dicts, one per chunk,
    across every PDF in PDFS_DIR. `page` is 1-indexed, matching what a
    human reading the PDF would call "page N" -- pypdf's own page indices
    are 0-based, so every page number here has +1 applied."""
    chunks = []
    for path in sorted(PDFS_DIR.glob("*.pdf")):
        reader = PdfReader(str(path))
        for page_index, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            paragraphs = split_into_paragraphs(text)
            for chunk_text in merge_short_paragraphs(paragraphs, TARGET_CHUNK_SIZE):
                chunks.append({
                    "text": chunk_text,
                    "source": path.name,
                    "page": page_index + 1,
                })
    return chunks


if __name__ == "__main__":
    chunks = load_chunks()
    print(f"Loaded {len(chunks)} chunks from {PDFS_DIR}/")
    for chunk in chunks[:3]:
        preview = chunk["text"][:80].replace("\n", " ")
        print(f"  [{chunk['source']} p{chunk['page']}] {preview}...")
```

```bash
uv run python load_pdfs.py
```

:::tip[مستندات متعددة، خط أنابيب واحد]
لا شيء بعد `load_chunks()` يحتاج لمعرفة أو الاهتمام بعدد ملفات PDF الموجودة، أو من أيها جاء جزء ما — يحمل كل جزء `source` و`page` الخاصين به، لذا يبحث الاسترجاع طبيعيًا عبر *كل* ملفات PDF الخاصة بك في آنٍ واحد، ويمكن للإجابة النهائية أن تمزج حقائق من عدة مستندات مختلفة في إجابة واحدة، كل واحدة مُنسوبة بشكل صحيح.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يعمل `uv run python load_pdfs.py` دون أخطاء ويطبع عدد أجزاء غير صفري.</StepChecklistItem>
<StepChecklistItem>المعاينات المطبوعة تبدو كأجزاء حقيقية من نص ملفات PDF الخاصة بك، لا سلاسل فارغة أو أحرف مشوَّهة.</StepChecklistItem>
<StepChecklistItem>يُظهر كل جزء مطبوع اسم ملف ورقم صفحة يطابقان ما كنت لتراه لو فتحت PDF بنفسك.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لماذا استخراج النص *لكل صفحة* بدلًا من قراءة PDF كاملًا في سلسلة نصية كبيرة واحدة وتقسيم ذلك؟ ما المعلومات التي كنت ستفقدها؟
- PDF مُمسوح ضوئيًا (صورة لمستند ورقي، بلا نص مُضمَّن فعلي) سيجعل `page.extract_text()` تُعيد سلسلة فارغة لكل صفحة. كيف كنت ستلاحظ أن هذا حدث، وماذا ستحتاج أن تضيف للتعامل معه (تلميح: ابحث عن "OCR")؟

## الخطوة 2: ضمّن أجزاءك محليًا

هذه الخطوة مماثلة بالروح لخطوة التضمين في مشروع تطبيق RAG — نفس النموذج، نفس المنطق، فقط تضمين أجزاء مُستخرَجة من PDF بدلًا من أجزاء ملاحظات. يُخطِّط `all-MiniLM-L6-v2` كل جزء إلى نقطة في فضاء 384 بُعدًا، مُدرَّب بحيث تنتهي الأجزاء ذات المعنى المتشابه قريبة من بعضها البعض. إنه صغير (حوالي 80 ميغابايت)، ويعمل بالكامل على وحدة المعالجة المركزية الخاصة بك في حوالي ثانية واحدة لكل جزء على حاسوب محمول نموذجي، ولا يحتاج مفتاح API، ولا يكلف شيئًا.

```python
# build_index.py
"""Embeds every chunk from load_pdfs.py and saves the vectors + text
(including source filename and page number) locally, so retrieve() (Step 3)
doesn't need to re-embed anything at query time.

Run with: uv run python build_index.py
Re-run this any time you add, remove, or edit files in pdfs/ -- the saved
index doesn't update itself.
"""

import json

import numpy as np
from sentence_transformers import SentenceTransformer

from load_pdfs import load_chunks

MODEL_NAME = "all-MiniLM-L6-v2"
INDEX_PATH = "index.npy"
CHUNKS_PATH = "chunks.json"


def main() -> None:
    chunks = load_chunks()
    if not chunks:
        print("No chunks found -- add some .pdf files to pdfs/ first.")
        return

    print(f"Embedding {len(chunks)} chunks with {MODEL_NAME}...")
    model = SentenceTransformer(MODEL_NAME)
    texts = [chunk["text"] for chunk in chunks]
    embeddings = model.encode(texts, normalize_embeddings=True)

    np.save(INDEX_PATH, embeddings)
    with open(CHUNKS_PATH, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)

    print(f"Saved {embeddings.shape[0]} vectors ({embeddings.shape[1]}-dim) to {INDEX_PATH}")
    print(f"Saved chunk text/metadata (source + page) to {CHUNKS_PATH}")


if __name__ == "__main__":
    main()
```

```bash
uv run python build_index.py
```

تمامًا كمشروع تطبيق RAG، هذا يتجنب عمدًا قاعدة بيانات متجهية — لمجلد شخصي من ملفات PDF (عشرات إلى مئات قليلة من المستندات، لا ملايين)، مصفوفة NumPy بسيطة أبسط، ولا تملك خدمة إضافية للتثبيت أو التشغيل، وشفافة تمامًا. `normalize_embeddings=True` تُحجِّم كل متجه إلى طول 1، وهذا ما يجعل تشابه جيب التمام في الخطوة 3 يختزل إلى ناتج نقطي واحد.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>اكتمل `uv run python build_index.py` دون أخطاء.</StepChecklistItem>
<StepChecklistItem>ملف `index.npy` وملف `chunks.json` موجودان الآن في مجلد مشروعك.</StepChecklistItem>
<StepChecklistItem>عند فتح `chunks.json`، كل مُدخَل يحتوي حقول `text` و`source` و`page`.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لو صادف أن يحتوي ملفا PDF مختلفان جملًا متطابقة تقريبًا (لنقل، كلاهما يقتبس نفس اللائحة)، ماذا تتوقع أن تبدو عليه متجهات التضمين الخاصة بهما نسبة لبعضهما؟
- لماذا نُعيد تضمين *الأجزاء* هنا لا ملفات PDF نفسها؟ ماذا سيخسر تضمين ملف PDF كامل كمتجه واحد، مقارنة بتضمين كل جزء منه على حدة؟

## الخطوة 3: استرجع وولِّد إجابة مُستشهَد بها

يعمل الاسترجاع تمامًا كمشروع تطبيق RAG — ضمّن السؤال، صنّف كل جزء بتشابه جيب التمام، خذ الأعلى القليل — إلا أن التصنيف الآن يعمل عبر كل جزء من كل PDF في آنٍ واحد، لذا قد تأتي النتيجة الأكثر صلة بسؤال من أي من مستنداتك.

```python
# retrieve.py
"""Given a question, finds the PDF chunks most relevant to it, across every
document in pdfs/ -- each result carries its source filename and page number.

Imported by ask.py -- not meant to be run directly, though the __main__
block below lets you try it standalone.
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


def retrieve(question: str, top_k: int = 4) -> list[dict]:
    """Returns the top_k chunks most similar to `question`, each with its
    similarity score, source document, and page number, ranked highest
    first -- possibly drawn from several different PDFs at once."""
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
    results = retrieve("How many days of paid time off do employees get?")
    for r in results:
        print(f"{r['score']:.3f}  [{r['source']} p{r['page']}]  {r['text'][:80]}...")
```

```bash
uv run python retrieve.py
```

الآن التوليد. الـ prompt هو فكرة RAG-مع-استشهادات بأكملها في مكان واحد: يسلّم النموذج الأجزاء المُسترجَعة *مُوسَّمة بمصدرها وصفحتها*، ويتطلب أن تُتبَع كل حقيقة في الإجابة باستشهاد `(المصدر، الصفحة N)` مُنسوخ من تلك الوسيمة — النموذج لا يخترع استشهادات، بل يُعيد ما هو مُرفَق بالفعل بالنص الذي أُعطي له.

```python
# ask.py
"""Retrieves relevant chunks across every PDF in pdfs/, then asks a
free-tier LLM to answer using only that context -- citing which document
and page each part of the answer came from.

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

Every fact you use MUST be followed by a citation in the form
(source, page N), taken from the [source, page N] tag on the context chunk
it came from. If your answer draws on more than one chunk, cite each one.

Context:
{context}

Question: {question}

Answer:"""


def build_prompt(question: str, chunks: list[dict]) -> str:
    context = "\n\n".join(
        f"[{c['source']}, page {c['page']}] {c['text']}" for c in chunks
    )
    return PROMPT_TEMPLATE.format(context=context, question=question)


def ask(question: str, top_k: int = 4) -> str:
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
    question = " ".join(sys.argv[1:]) or "How many days of paid time off do employees get?"
    print(ask(question))
```

```bash
uv run python ask.py "How many days of paid time off do employees get?"
```

:::tip[تستخدم مزوّدًا مختلفًا؟]
استبدل كتلة `OpenAI(...)` بعميل مزوّدك الخاص، متّبعًا نفس نمط [مشروع تطبيق RAG](/docs/projects/rag-notes) و[مشروع وكيل الذكاء الاصطناعي](/docs/projects/ai-agent) — مثل حزمة `google-genai` من جوجل لـGemini، أو عميل `groq` الخاص لـGroq. Cerebras وOpenRouter متوافقان أيضًا مع OpenAI، لذا تعمل حزمة `openai` لهما أيضًا، فقط بـ`base_url` مختلفة.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يطبع `uv run python retrieve.py` نتائج من ملفات PDF الخاصة بك بأسماء ملفات مصدر وأرقام صفحات ذات مظهر معقول.</StepChecklistItem>
<StepChecklistItem>يطبع `uv run python ask.py "سؤال حقيقي"` إجابة، لا تتبّعًا (traceback).</StepChecklistItem>
<StepChecklistItem>كل ادعاء واقعي في الإجابة يُتبَع باستشهاد `(المصدر، الصفحة N)`، وصفحة كل استشهاد تحتوي فعليًا تلك الحقيقة عندما تتحقق من PDF.</StepChecklistItem>
<StepChecklistItem>سؤال شيء لا تغطيه ملفات PDF الخاصة بك بوضوح يجعل النموذج يقول ذلك، بدلًا من اختلاق شيء بثقة (بما في ذلك استشهاد مزيف).</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يتطلب الـ prompt استشهادًا لـ*كل* حقيقة. ماذا تتوقع أن يحدث لو أزلت ذلك المتطلب — هل سيميل النموذج للاستمرار في الإجابة بدقة، أم أن طلب الاستشهادات يغيّر فعليًا مدى حرصه على التقيّد بالسياق؟ جرّب كليهما وقارن.
- لو استخرجت `retrieve()` أعلى جزء من الصفحة الصحيحة لكن من PDF *خاطئ* (لنقل، منتجان مختلفان كلاهما يذكر "الضمان")، هل كنت ستلاحظ ذلك من قراءة الاستشهاد وحده؟ ماذا يقترح ذلك بشأن التحقق دائمًا من الاستشهادات بدلًا من الوثوق بإجابة لمجرد أن لديها واحدًا؟

## الخطوة 4: حلقة تفاعلية صغيرة

إعادة تشغيل `ask.py` بوسيط سطر أوامر جديد لكل سؤال يعمل، لكنه بطيء للتكرار. غلّفه بدلًا من ذلك في حلقة صغيرة، لكي تستمر في الدردشة مع ملفات PDF الخاصة بك في جلسة واحدة قيد التشغيل.

```python
# chat.py
"""A small interactive loop: keep asking questions about the PDFs in pdfs/
until you type "quit" or "exit".

Run with: uv run python chat.py
"""

from ask import ask


def main() -> None:
    print("Chat with your PDFs -- ask a question, or type 'quit' to stop.\n")
    while True:
        question = input("> ").strip()
        if not question:
            continue
        if question.lower() in {"quit", "exit"}:
            break
        answer = ask(question)
        print(f"\n{answer}\n")


if __name__ == "__main__":
    main()
```

```bash
uv run python chat.py
```

:::tip[هذا هو التطبيق بأكمله]
لا يوجد خادم، ولا إطار عمل، ولا مجموعة أدوات واجهة مستخدم هنا — حلقة `while True` حول `ask()` *هي* تطبيق دردشة مشروع. كل منتج "تحدث مع بياناتك" رأيته هو نفس هذه الحلقة تحت السطح، مع واجهة أمامية على الويب، وإجابات تُبَث تدفقيًا، وتاريخ محادثة مُضاف فوقها. لا شيء من تلك الطبقات يغيّر ما يحدث فعليًا: استرجع، ثم ولِّد، ثم اطبع.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يبدأ `uv run python chat.py`، ويقبل سؤالًا، ويطبع إجابة مُستشهَد بها، ويعود إلى موجّه `>` جديد.</StepChecklistItem>
<StepChecklistItem>كتابة `quit` أو `exit` تُنهي الحلقة بنظافة.</StepChecklistItem>
<StepChecklistItem>يمكنك طرح سؤالين مختلفين عن ملفي PDF مختلفين في نفس الجلسة دون إعادة تشغيل أي شيء.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تُعيد كل استدعاء لـ`ask()` تحميل `index.npy` و`chunks.json` من القرص وتُعيد تحميل نموذج التضمين. لسؤال واحد هذا جيد — ماذا كنت لتغيّر في `chat.py` و`retrieve.py` لو أردت أن تشعر الحلقة بمزيد من السرعة بعد السؤال الأول؟
- ليس لهذه الحلقة أي ذاكرة للأسئلة السابقة — كل استدعاء لـ`ask()` مستقل. ماذا سيتعطل لو سألت متابعة مثل "ماذا عن الثاني؟" مباشرة بعد سؤال آخر؟ ماذا ستحتاج أن تضيف لدعم ذلك؟

## ⚠️ مآزق شائعة

- **ملفات PDF المُمسوحة ضوئيًا، صورة فقط، لا تُعيد أي نص.** تقرأ `extract_text()` في `pypdf` فقط النص المُضمَّن فعليًا في PDF — PDF مصنوع من صفحات مُصوَّرة أو مُمسوحة ضوئيًا ليس فيه أي نص مُضمَّن على الإطلاق، لذا سينتج `load_pdfs.py` صفر أجزاء بصمت لذلك الملف. إذا لم يظهر مستند تتوقع رؤية إجابات منه أبدًا، تحقق أولًا مما إذا كان يمكنك تحديد/نسخ نصه في عارض PDF عادي؛ إن لم تستطع، فهو يحتاج OCR (خارج نطاق هذا المشروع) قبل أن يستطيع خط الأنابيب هذا استخدامه.
- **أجزاء كبيرة جدًا أو صغيرة جدًا.** نفس مقايضة مشروع تطبيق RAG: كبير جدًا فيصبح الاسترجاع ضبابيًا، صغير جدًا فيفقد الجزء السياق المحيط الذي يحتاجه النموذج للإجابة جيدًا. إذا شعرت أن الإجابات ليست دقيقة، جرّب `TARGET_CHUNK_SIZE` مختلفًا وأعد تشغيل `build_index.py`.
- **نسيان إعادة بناء الفهرس بعد تغيير `pdfs/`.** يعمل `build_index.py` فقط عندما تُشغّله — أضف، أو احذف، أو عدّل PDF، ولن تعكس `retrieve()` التغيير حتى تُعيد تشغيل `uv run python build_index.py`.
- **الثقة باستشهاد دون التحقق منه.** يطلب الـ prompt من النموذج الاستشهاد فقط بما هو موجود فعليًا في السياق المُسترجَع، وفي الممارسة العملية يفعل ذلك بشكل موثوق — لكن لا شيء هنا يضمن ذلك رياضيًا. تحقق عشوائيًا من بضعة استشهادات مقابل صفحات PDF الفعلية، خاصة قبل الاعتماد على هذا لأي شيء مهم.
- **حدود المعدل في مستوى النموذج اللغوي المجاني.** الاستخراج والتقسيم والتضمين والاسترجاع كلها محلية وغير محدودة؛ فقط استدعاء النموذج اللغوي في `ask()` يُحتسَب ضد حصة مستوى مزوّدك المجاني. خطأ 429 هناك هو المزوّد يخبرك بالتباطؤ، لا خطأ برمجي — انظر [مشروع وكيل الذكاء الاصطناعي](/docs/projects/ai-agent) لنفس النمط ونهج إعادة محاولة يمكنك نسخه.

## ما بنيته للتو

خط أنابيب RAG متعدد المستندات مع استشهادات: استخراج وتقسيم PDF واعٍ بالصفحات، تضمين محلي، بحث تشابه في الذاكرة عبر عدد اعتباطي من المستندات، وخطوة توليد نهائية مُلزَمة بالإشارة بالضبط إلى من أين جاءت كل حقيقة — نفس شكل النظام خلف منتجات "تحدث مع مستنداتك" الحقيقية، ناقص قاعدة البيانات المتجهية والواجهة البرمجية المدفوعة، مُستبدَلتين بواجهة مجانية ومصفوفة NumPy مسطّحة.

## إلى أين تذهب من هنا

- بمجرد أن يفوق مجلد ملفات PDF الخاص بك ما يناسب الذاكرة بارتياح (عشرات آلاف الأجزاء)، انظر إلى قاعدة بيانات متجهية حقيقية مثل [ChromaDB](https://www.trychroma.com/) — نفس بحث أقرب الجيران الذي تستخدمه `retrieve()` أعلاه، مفهرَسة للسرعة على نطاق أوسع بكثير، مع تصفية بيانات وصفية (مثل "ابحث فقط في ملفات PDF من 2024") لا تملكها هذه النسخة المسطّحة من الملفات.
- أضف **مُرشِّح مصدر**: دع سؤالًا يُقيِّد الاسترجاع إلى PDF واحد فقط (`retrieve(question, source="warranty.pdf")`)، مفيد بمجرد أن يحمل مجلدك مستندات عن مواضيع مختلفة جدًا لا ينبغي مزجها معًا.
- جرّب **OCR** بمكتبة مثل `pytesseract` لملفات PDF المُمسوحة ضوئيًا، لكي تنضم المستندات ذات الصور فقط إلى خط الأنابيب بدلًا من المساهمة بصمت بصفر أجزاء.
- وسِّع الاستشهادات لتشمل **مقتطفًا**، لا مجرد رقم صفحة — أعِد الجملة الدقيقة التي جاءت منها الحقيقة إلى جانب `(المصدر، الصفحة N)`، لكي تتحقق من إجابة دون فتح PDF بنفسك.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓

<ProjectProgressCheckbox projectId="2027-chat-with-pdfs" />
