---
id: docs-qa-bot
title: "بناء بوت Discord لأسئلة وأجوبة التوثيق مدعوم بـRAG"
sidebar_label: "بناء بوت Discord لأسئلة وأجوبة التوثيق"
slug: /projects/docs-qa-bot
description: "تخرّج من بيئة البرمجة في المتصفح إلى Python فعلي: غلّف خط أنابيب الاسترجاع الخاص بمشروع تطبيق RAG في بوت Discord حي يجيب عن أسئلة من مجلد توثيق."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 بناء بوت Discord لأسئلة وأجوبة التوثيق مدعوم بـRAG

<ProjectPublishedDate projectId="docs-qa-bot" />

<ProjectGreeting />

يأخذ هذا المشروع خط أنابيب التوليد المعزَّز بالاسترجاع من [بناء تطبيق RAG](/docs/projects/rag-notes) — تضمينات محلية، بحث تشابه جيب التمام بـNumPy، نموذج لغوي من مستوى مجاني للإجابة النهائية — ويضع عليه واجهة أمامية مختلفة: بدلًا من سكربت تُشغّله من طرفية سؤالًا واحدًا في كل مرة، يجيب نفس خط الأنابيب عن الأسئلة حيًّا، داخل خادم Discord، كلما ذكر أحدهم البوت. لا شيء يتعلق بـ*كيفية* الاسترجاع أو التوليد يتغير؛ فقط الواجهة تتغير.

هذا يفترض Python 101. يُنصَح بشدة ببناء [بناء تطبيق RAG](/docs/projects/rag-notes) أولًا — يعيد هذا المشروع استخدام كود التضمين/الاسترجاع الخاص به مباشرة ويتجاوز بسرعة الأجزاء التي شرحها بالفعل بعمق.

هذا اختياري وغير مُقيَّم. راجع [مشاريع من العالم الحقيقي](/docs/projects) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. إنشاء تطبيق بوت Discord والحصول على رمزه (token) من بوابة مطوري Discord المجانية.
2. تثبيت `uv`، وإعداد مشروع، وإضافة `discord.py` جنبًا إلى جنب مع نفس مكتبات التضمين/الاسترجاع من مشروع تطبيق RAG.
3. إعادة استخدام وتكييف خط أنابيب استرجاع تطبيق RAG على مجلد توثيق بدلًا من ملاحظات شخصية.
4. ربط معالج رسائل `discord.py` لكي يسترجع البوت وثائق ذات صلة ويولّد إجابة كلما ذُكِر.
5. دعوة البوت إلى خادم اختبار وطرح أسئلة حقيقية عليه، من البداية للنهاية.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو الخيار العملي الوحيد فعليًا هنا، أكثر من معظم المشاريع الأخرى في هذه السلسلة. بوت Discord ليس سكربتًا يعمل مرة واحدة وينتهي — إنه يحافظ على اتصال مفتوح بـDiscord ويحتاج أن يستمر في العمل طالما تريد للبوت أن يستجيب، وهذا يعني عملية محلية (أو مُستضافة) طويلة التشغيل حقيقية، لا أمرًا لمرة واحدة.

**GitHub Codespaces** يعمل أيضًا، وهو بديل معقول إذا كنت تفضّل عدم تثبيت أي شيء محليًا: افتح [مستودع الدورة كاملًا في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython وuv مثبّتة بالفعل، وفق `.devcontainer/devcontainer.json` الخاص بالمستودع) وشغّل `uv run python bot.py` في طرفية هناك — يبقى يعمل طالما بقيت تلك الطرفية (وCodespace) مفتوحة، نفس متطلب "العملية طويلة التشغيل" مثل تشغيله محليًا.

**Google Colab وKaggle Notebooks وBinder غير مناسبة للبوت الفعلي** — كن صادقًا مع نفسك بشأن ذلك بدلًا من مقاومته. بُنيت دفاتر الملاحظات حول تشغيل خلية، والحصول على مخرجات، والانتقال إلى الخلية التالية؛ ليست مصممة لعملية في الخلفية تجلس وتنتظر الأحداث إلى أجل غير مسمى. *يمكنك* بدء حلقة أحداث بوت في خلية دفتر ملاحظات، لكن في اللحظة التي يُعاد فيها تدوير بيئة تشغيل دفتر الملاحظات، أو تنقطع، أو تُغلق التبويب، يسقط البوت معها — تخطَّ Colab/Kaggle/Binder للبوت الحي واستخدم بدلًا من ذلك عملية محلية فعلية أو Codespaces.

مع ذلك، خط أنابيب RAG *تحت* البوت — التقسيم، والتضمين، والاسترجاع، والتوليد — مجرد كود عادي يعمل خلية في كل مرة، وهذا بالضبط ما تُجيد فيه دفاتر الملاحظات. تفتح الشارات أدناه دفتر ملاحظات يستعرض ذلك خط الأنابيب الأساسي مقابل وثائق العينة الخاصة بالمشروع ويطبع إجابات حقيقية مُسترجَعة ومُولَّدة، لكي تراه يعمل دون تثبيت أي شيء محليًا. يتوقف عمدًا قبل طبقة Discord — لذلك، عد إلى هنا وشغّل `bot.py` محليًا أو في Codespaces كما هو موصوف أعلاه.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/docs-qa-bot/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/docs-qa-bot/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdocs-qa-bot%2Fnotebook.ipynb)

## الإعداد

كل شيء في هذا القسم يحتاج أن يحدث مرة واحدة فقط، قبل كتابة أي سطر من البوت نفسه: تثبيت `uv`، وإنشاء تطبيق بوت Discord والحصول على رمزه، والحصول على مفتاح LLM مجاني، وإعداد المشروع. كل خطوة بعد هذه تفترض أن كل ذلك تم بالفعل.

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

### أنشئ تطبيق بوت Discord واحصل على رمز

[بوابة المطورين](https://discord.com/developers/applications) الخاصة بـDiscord مجانية ولا تحتاج بطاقة:

1. سجّل الدخول وانقر على **New Application**، أعطه اسمًا (مثل "docs-qa-bot")، وأنشئه.
2. افتح تبويب **Bot** على اليسار. تضيف Discord مستخدم بوت لتطبيقك تلقائيًا.
3. انقر على **Reset Token** (أو **View Token** إن كانت هذه أول مرة) وانسخه. هذا الرمز مثل كلمة مرور تمامًا — أي شخص يملكه يمكنه التحكم ببوتك — لذا عامِله بنفس الطريقة التي تعامل بها بالفعل مفتاح API لنموذج لغوي: لا تلصقه أبدًا في الكود، ولا ترفعه أبدًا.
4. في نفس تبويب **Bot**، مرّر للأسفل إلى **Privileged Gateway Intents** وفعّل **Message Content**. هذا مطلوب لكي يرى البوت فعليًا نص الرسائل التي يُذكَر فيها — بدونه، تستقبل `discord.py` سلسلة فارغة لمحتوى كل رسالة بغض النظر عن الكود الذي تكتبه.

:::tip[رمز البوت سرّ، تمامًا مثل مفتاح API]
كل ما علّمه [مشروع تطبيق RAG](/docs/projects/rag-notes) عن معالجة مفاتيح API للنماذج اللغوية ينطبق هنا أيضًا، لسرّ ثانٍ: لا تُبرمج رمز البوت أبدًا كنص ثابت، لا ترفعه أبدًا، واحتفظ به في ملف `.env` محلي (أدناه) بدلًا من ذلك.
:::

### احصل على مفتاح API مجاني لنموذج لغوي

يحتاج نصف التوليد من خط الأنابيب هذا نفس نوع مفتاح النموذج اللغوي من مستوى مجاني مثل [مشروع تطبيق RAG](/docs/projects/rag-notes) — **اختر المزوّد الذي تفضّله**، لا يتطلب أي منها بطاقة ائتمان وقت كتابة هذا:

| المزوّد | أين تحصل على مفتاح | لماذا قد تختاره |
|---|---|---|
| **GitHub Models** *(الافتراضي المقترح)* | [github.com/settings/tokens](https://github.com/settings/tokens) — رمز وصول شخصي بنطاق `models: read` | لا تسجيل منفصل — لديك حساب GitHub بالفعل. حدود مستوى مجاني أكثر سخاءً من Gemini. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | الخيار الأكثر ذكرًا شيوعًا. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | استدلال سريع، مستوى مجاني سخي، بلا بطاقة. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | واحدة من أكثر الحصص المجانية الدائمة سخاءً. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | حجم رموز يومي مرتفع، بلا بطاقة. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | واجهة برمجة واحدة، نماذج مجانية عديدة — جيدة لمقارنة المزوّدين. |

إذا كان لديك بالفعل مفتاح من عمل مشروع تطبيق RAG، يعمل نفسه هنا — لا حاجة لتوليد مفتاح ثانٍ.

### أعِدَّ المشروع

```bash
uv init docs-qa-bot
cd docs-qa-bot
uv add discord.py sentence-transformers numpy python-dotenv openai
```

`discord.py` هي المكتبة التي تتحدث فعليًا مع Discord — تتصل ببوابته (Gateway)، وتستقبل أحداث الرسائل، وترسل الردود. `sentence-transformers` و`numpy` هما نفس مكتبتي الاسترجاع من مشروع تطبيق RAG، تقومان بنفس العمل هنا: تضمينات محلية وبحث تشابه جيب التمام، فقط على التوثيق بدلًا من الملاحظات. تتحدث `openai` إلى نقطة نهاية GitHub Models المتوافقة مع OpenAI للمزوّد الافتراضي أعلاه؛ استبدلها بحزمة مزوّدك الخاص إن اخترت واحدًا مختلفًا، تمامًا كما يصف مشروع تطبيق RAG.

أنشئ ملف `.env` في مجلد المشروع (لا ترفعه أبدًا) بـ**كلا** السرَّين من هذا القسم:

```bash
# .env
DISCORD_BOT_TOKEN=رمز-البوت-الخاص-بك-هنا
GITHUB_TOKEN=مفتاح-النموذج-اللغوي-الخاص-بك-هنا
```

تقرأ `python-dotenv` هذا الملف إلى `os.environ` تلقائيًا، نفس النمط كأي مشروع آخر في هذه السلسلة.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>تطبيق وبوت Discord موجودان في بوابة المطورين، ونسخت رمزه.</StepChecklistItem>
<StepChecklistItem>"Message Content" مُفعَّل تحت Privileged Gateway Intents.</StepChecklistItem>
<StepChecklistItem>لديك مفتاح API لنموذج لغوي من مستوى مجاني من مزوّد اخترته.</StepChecklistItem>
<StepChecklistItem>اكتمل `uv init`/`uv add` دون أخطاء، ولدى `.env` كل من `DISCORD_BOT_TOKEN` ومفتاح نموذجك اللغوي مضبوطين.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لماذا تتطلب Discord منك تفعيل "Message Content" صراحة كـintent *مُميَّز*، بدلًا من إعطاء كل بوت وصولًا إلى نص الرسائل افتراضيًا؟
- كل من رمز البوت ومفتاح API للنموذج اللغوي سرّان، لكنهما يصادقان مع خدمتين مختلفتين تمامًا. ماذا سيسوء لو بدّلت عن طريق الخطأ أي متغيّر بيئة يحمل أي قيمة؟

## الخطوة 1: أعِدَّ وضمّن مجلد توثيق

هذه الخطوة هي الخطوتان 2 و3 من مشروع تطبيق RAG، بلا تغيير في الجوهر، فقط موجَّهة إلى مجلد `docs/` من التوثيق بدلًا من ملاحظات شخصية:

```python
# prepare_docs.py
"""Splits every .md/.txt file in docs/ into a list of text chunks.

Run with: uv run python prepare_docs.py
Same chunking approach as prepare_notes.py in the RAG App project.
"""

from pathlib import Path

DOCS_DIR = Path("docs")
TARGET_CHUNK_SIZE = 500  # characters


def split_into_paragraphs(text: str) -> list[str]:
    paragraphs = [p.strip() for p in text.split("\n\n")]
    return [p for p in paragraphs if p]


def merge_short_paragraphs(paragraphs: list[str], target_size: int) -> list[str]:
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
    chunks = []
    for path in sorted(DOCS_DIR.glob("*.md")) + sorted(DOCS_DIR.glob("*.txt")):
        text = path.read_text(encoding="utf-8")
        paragraphs = split_into_paragraphs(text)
        for chunk_text in merge_short_paragraphs(paragraphs, TARGET_CHUNK_SIZE):
            chunks.append({"text": chunk_text, "source": path.name})
    return chunks


if __name__ == "__main__":
    chunks = load_chunks()
    print(f"Loaded {len(chunks)} chunks from {DOCS_DIR}/")
```

ضع أي توثيق تريد للبوت أن يجيب منه في مجلد `docs/` كملفات `.md`/`.txt` — ملف README لمشروع وصفحات wiki، دليل تشغيل داخلي لفريق، ملفات دروس هذه الدورة نفسها، أي شيء حقيقي. ثم ضمّنه، معيدًا استخدام `build_index.py` من مشروع تطبيق RAG حرفيًا (فقط الاستيراد يتغير، من `prepare_notes` إلى `prepare_docs`):

```python
# build_index.py
"""Embeds every chunk from prepare_docs.py and saves the vectors + text
locally. Run with: uv run python build_index.py
Re-run any time docs/ changes -- nothing rebuilds this automatically.
"""

import json

import numpy as np
from sentence_transformers import SentenceTransformer

from prepare_docs import load_chunks

MODEL_NAME = "all-MiniLM-L6-v2"
INDEX_PATH = "index.npy"
CHUNKS_PATH = "chunks.json"


def main() -> None:
    chunks = load_chunks()
    if not chunks:
        print("No chunks found -- add some .md/.txt files to docs/ first.")
        return

    print(f"Embedding {len(chunks)} chunks with {MODEL_NAME}...")
    model = SentenceTransformer(MODEL_NAME)
    texts = [chunk["text"] for chunk in chunks]
    embeddings = model.encode(texts, normalize_embeddings=True)

    np.save(INDEX_PATH, embeddings)
    with open(CHUNKS_PATH, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)

    print(f"Saved {embeddings.shape[0]} vectors ({embeddings.shape[1]}-dim) to {INDEX_PATH}")


if __name__ == "__main__":
    main()
```

```bash
uv run python prepare_docs.py
uv run python build_index.py
```

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>مجلد `docs/` موجود مع بضعة ملفات `.md`/`.txt` حقيقية على الأقل فيه.</StepChecklistItem>
<StepChecklistItem>يعمل `uv run python build_index.py` دون أخطاء ويُبلِّغ عن عدد أجزاء غير صفري.</StepChecklistItem>
<StepChecklistItem>`index.npy` و`chunks.json` موجودان الآن في مجلد مشروعك.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- هذا هو نفس كود التقسيم والتضمين تمامًا من مشروع تطبيق RAG، مع تغيير اسم مجلد فقط. ماذا يخبرك ذلك عن مدى قابلية إعادة استخدام نصف الاسترجاع من خط أنابيب RAG عبر حالات استخدام مختلفة تمامًا؟
- لو كان مجلد التوثيق الخاص بك يحتوي ملفًا بتنسيق غير متسق جدًا (بلا أسطر فارغة، كتلة نص عملاقة واحدة)، ماذا تتوقع أن يحدث لجودة الأجزاء التي ينتجها؟

## الخطوة 2: استرجع الأجزاء ذات الصلة

الاسترجاع أيضًا بلا تغيير من مشروع تطبيق RAG — ضمّن السؤال بنفس النموذج، ثم صنّف كل جزء بتشابه جيب التمام، الذي ينهار إلى ناتج نقطي بسيط لأن كل متجه كان قد طُبِّع بالفعل إلى طول 1 وقت التضمين:

```python
# retrieve.py
"""Given a question, finds the docs chunks most relevant to it.
Identical retrieval logic to the RAG App project's retrieve.py.
"""

import json

import numpy as np
from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"
INDEX_PATH = "index.npy"
CHUNKS_PATH = "chunks.json"

_model = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def retrieve(question: str, top_k: int = 3) -> list[dict]:
    embeddings = np.load(INDEX_PATH)
    with open(CHUNKS_PATH, encoding="utf-8") as f:
        chunks = json.load(f)

    question_vector = get_model().encode([question], normalize_embeddings=True)[0]
    similarities = embeddings @ question_vector

    top_indices = np.argsort(similarities)[::-1][:top_k]
    return [
        {**chunks[i], "score": float(similarities[i])}
        for i in top_indices
    ]


if __name__ == "__main__":
    results = retrieve("How do I enable the message content intent?")
    for r in results:
        print(f"{r['score']:.3f}  [{r['source']}]  {r['text'][:80]}...")
```

```bash
uv run python retrieve.py
```

إذا شعرت أن هذا سريع جدًا، فذلك متعمَّد — يغطي [مشروع تطبيق RAG](/docs/projects/rag-notes#step-4-retrieve-relevant-chunks) بالضبط لماذا يعمل تشابه جيب التمام بهذه الطريقة، وماذا يمنحك التطبيع، وكيف ترتبط الرياضيات بضرب مصفوفة-متجه، بعمق أكبر بكثير مما ستضيفه إعادته هنا.

:::tip[اختبر الاسترجاع قبل لمس Discord على الإطلاق]
اجعل `retrieve.py` يُعيد أجزاءً ذات صلة فعليًا لبضعة أسئلة اختبارية *قبل* كتابة أي كود بوت. إذا كان الاسترجاع خاطئًا، سيقدّم بوت مُغلَّف حوله ببساطة إجابات خاطئة بثقة في قناة Discord — أصعب بكثير للتصحيح حيًّا من سكربت طرفية هادئ.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يطبع `uv run python retrieve.py` نتائج مُصنَّفة بدرجات تشابه حقيقية.</StepChecklistItem>
<StepChecklistItem>النتيجة الأولى لسؤال اختباري سهل تبدو ذات صلة فعليًا عند قراءتها.</StepChecklistItem>
<StepChecklistItem>جرّبت سؤالًا واحدًا على الأقل لا يغطيه مجلد التوثيق الخاص بك بوضوح، وأكّدت أن الدرجة الأولى أقل بشكل ملحوظ.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- قد يُسأل بوت Discord نفس الأسئلة أو أسئلة مشابهة جدًا بشكل متكرر من مستخدمين مختلفين في خادم مزدحم. تُعيد `retrieve()` حاليًا تضمين السؤال وإعادة تحميل `index.npy`/`chunks.json` من القرص في كل استدعاء. ماذا كنت لتخزّن مؤقتًا لجعل الأسئلة المتكررة أرخص، وما مخاطر التخزين المؤقت بعدوانية زائدة؟
- لو قال ملفا توثيق أشياء متضاربة قليلًا (واحد قديم وواحد محدَّث)، ماذا تتوقع أن تفعله `retrieve()`، وكيف كنت لتلاحظ المشكلة من إجابات البوت وحدها؟

## الخطوة 3: اربط معالج رسائل البوت

هذا هو الجزء الجديد الفعلي من هذا المشروع: معالج أحداث `discord.py` يستدعي `retrieve()`، ويبني نفس prompt "أجب باستخدام هذا السياق فقط" من مشروع تطبيق RAG، ويردّ بإجابة النموذج.

النمط الأساسي لـ`discord.py` هو حلقة أحداث: تُنشئ `Client` بمجموعة من `intents` (أي فئات أحداث يُسمَح لها باستقبالها)، ثم تُسجِّل دوال `async def` مُزيَّنة بـ`@client.event` للأحداث التي تهمك — الأكثر شيوعًا `on_ready` (يُطلَق مرة واحدة، عند إنشاء الاتصال) و`on_message` (يُطلَق لكل رسالة يستطيع البوت رؤيتها):

```python
# bot.py
import os

import discord
from dotenv import load_dotenv
from openai import OpenAI

from retrieve import retrieve

load_dotenv()

PROMPT_TEMPLATE = """Answer the question using ONLY the context below. If the
context doesn't contain the answer, say so -- do not make something up.
Keep the answer concise; this will be posted in a Discord message.

Context:
{context}

Question: {question}

Answer:"""

MAX_DISCORD_MESSAGE_LENGTH = 2000  # Discord's hard cap on a single message

intents = discord.Intents.default()
intents.message_content = True  # requires the portal toggle from Setup, too

client = discord.Client(intents=intents)
llm_client = OpenAI(
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)


def build_prompt(question: str, chunks: list[dict]) -> str:
    context = "\n\n".join(f"[{c['source']}] {c['text']}" for c in chunks)
    return PROMPT_TEMPLATE.format(context=context, question=question)


def answer(question: str, top_k: int = 3) -> str:
    chunks = retrieve(question, top_k=top_k)
    prompt = build_prompt(question, chunks)
    response = llm_client.chat.completions.create(
        model="gpt-4o-mini",  # confirm this still has a free tier before running
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content


@client.event
async def on_ready():
    print(f"Logged in as {client.user} -- ready in {len(client.guilds)} server(s).")


@client.event
async def on_message(message: discord.Message):
    if message.author == client.user:
        return  # never reply to yourself -- avoids an infinite reply loop

    if client.user not in message.mentions:
        return  # only answer when actually mentioned

    question = message.content.replace(f"<@{client.user.id}>", "").strip()
    if not question:
        await message.reply("Mention me with a question, e.g. `@docs-qa-bot how do I install uv?`")
        return

    async with message.channel.typing():
        try:
            reply = answer(question)
        except Exception as error:
            print(f"Error answering question: {error!r}")
            reply = "Something went wrong answering that -- see the bot's console log for details."

    if len(reply) > MAX_DISCORD_MESSAGE_LENGTH:
        reply = reply[: MAX_DISCORD_MESSAGE_LENGTH - 1] + "…"
    await message.reply(reply)


if __name__ == "__main__":
    client.run(os.environ["DISCORD_BOT_TOKEN"])
```

`answer()` هي نفس فكرة `ask()` من مشروع تطبيق RAG سطرًا بسطر — استرجع، ابنِ prompt، استدعِ النموذج اللغوي — لكنها تُعيد سلسلة نصية بدلًا من طباعتها، لكي يستطيع `on_message` تسليم تلك السلسلة إلى `message.reply(...)`. كل ما فوق `on_ready`/`on_message` يعمل مرة واحدة عند البدء؛ كل ما داخل تلك الدالتين يعمل مرة واحدة لكل حدث، طالما يحافظ `client.run(...)` على الاتصال حيًّا.

الحارس `if message.author == client.user: return` يهم أكثر مما قد يبدو: بدونه، لو صادف أن رد البوت نفسه يذكر نفسه (لن يحدث هذا هنا، لكنه خطأ سهل بشكل عام)، سيُطلِق `on_message` مجددًا على مخرجاته الخاصة — حلقة لا نهائية من بوت يرد على نفسه.

:::tip[async def وawait ليسا اختياريين هنا]
`discord.py` مبنية بالكامل على `asyncio` الخاصة ببايثون — يجب أن يُعلَن كل معالج أحداث كـ`async def`، وأي استدعاء ينتظر على الشبكة (إرسال رسالة، جلب بيانات) يجب أن يُسبَق بـ`await`. نسيان أي منهما من أكثر الأخطاء الأولى شيوعًا: نسيان `async` على `on_message` يرفع خطأً فورًا، ونسيان `await` على `message.reply(...)` لا يفعل شيئًا على الإطلاق بصمت، لأنه فقط ينشئ coroutine غير مُنتظَرة بدلًا من تشغيلها فعليًا.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يُعرِّف `bot.py` كلًّا من `on_ready` و`on_message`، كلاهما كـ`async def`، كلاهما مُزيَّن بـ`@client.event`.</StepChecklistItem>
<StepChecklistItem>يتحقق `on_message` من `message.author == client.user` قبل فعل أي شيء آخر.</StepChecklistItem>
<StepChecklistItem>تستدعي `answer()` نفس `retrieve()` من الخطوة 2، دون تغيير.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لماذا التحقق من `client.user not in message.mentions` بدلًا من مجرد التحقق مما إذا كان اسم البوت يظهر في مكان ما في `message.content` كسلسلة فرعية؟
- يلتقط `try`/`except` حول `answer(reply)` *أي* استثناء ويرد برسالة خطأ عامة بدلًا من التعطل. ما المقايضة بين الالتقاط بهذا الاتساع في بوت طويل التشغيل مقابل ترك خطأ حقيقي يعطّل العملية بصوت عالٍ؟

## الخطوة 4: ادعُ البوت وجرّبه من البداية للنهاية

عد إلى بوابة مطوري Discord، وافتح **OAuth2 → URL Generator**. تحت **Scopes**، حدّد `bot`؛ تحت **Bot Permissions**، حدّد على الأقل **Send Messages** و**Read Message History**. انسخ الرابط المُولَّد، افتحه في متصفح، واختر خادمًا تتحكم به (أنشئ خادم اختبار مجاني إن لم يكن لديك واحد بالفعل) لإضافة البوت إليه.

شغّله:

```bash
uv run python bot.py
```

يجب أن ترى `Logged in as docs-qa-bot#1234 -- ready in 1 server(s).` مطبوعة — الصمت بعد ذلك طبيعي؛ العملية فقط تجلس وتنتظر أحداث بوابة Discord، نفس فكرة "لا مخرجات يعني أنه يعمل" مثل خادم MCP ينتظر على stdio. في خادم الاختبار، اذكر البوت بسؤال حقيقي عن أي شيء في مجلد `docs/` الخاص بك:

```
@docs-qa-bot how do I enable the message content intent?
```

خلال ثوانٍ قليلة يجب أن ترى مؤشر كتابة، ثم ردًّا مؤسَّسًا على توثيقك الفعلي — لا تخمينًا من بيانات التدريب العامة للنموذج.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يظهر البوت متصلًا في قائمة أعضاء خادم اختبارك بعد تشغيل `uv run python bot.py`.</StepChecklistItem>
<StepChecklistItem>ذكره بسؤال حقيقي ينتج مؤشر كتابة، ثم ردًّا.</StepChecklistItem>
<StepChecklistItem>محتوى الرد يعكس فعليًا مجلد `docs/` الخاص بك، وسؤال لا تغطيه مستنداتك يحصل على "لا أعرف" صادقة بدلًا من تخمين واثق.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لو أوقفت `bot.py` (`Ctrl+C`) وذكرت البوت مجددًا، ماذا يحدث من جانب Discord؟ ماذا يخبرك ذلك عن أين يعيش "حضور" البوت فعليًا؟
- اختبرت الاسترجاع واستدعاء النموذج اللغوي بشكل منفصل في الخطوتين 1–2 قبل ربطهما بـDiscord في الخطوة 3. لو أعطى البوت الآن إجابة خاطئة، كيف كنت لتستخدم `retrieve.py` وحده لمعرفة ما إذا كان الخطأ في الاسترجاع أو في الربط مع Discord حوله؟

## ⚠️ مآزق شائعة

- **نسيان intent "Message Content" المُميَّز.** يجب تفعيل هذا في مكانين *اثنين* — `intents.message_content = True` في الكود، **و**المفتاح تحت Bot → Privileged Gateway Intents في بوابة المطورين. فوِّت مفتاح البوابة ويصبح `message.content` سلسلة فارغة بصمت لكل رسالة، دون أي خطأ يخبرك بالسبب.
- **حدود المعدل في مستوى النموذج اللغوي المجاني، تتفاقم بحركة مرور البوت الحقيقية.** سكربت CLI مثل `ask.py` الخاص بمشروع تطبيق RAG يستدعي النموذج اللغوي فقط عند تشغيله؛ يمكن لبوت حي أن يستقبل عدة أسئلة في تتابع سريع من أشخاص مختلفين في خادم مزدحم، وكل واحد استدعاء منفصل ضد حصة مستوى مزوّدك المجاني. خطأ 429 تحت الحمل ليس خطأً برمجيًا — انظر [مآزق مشروع تطبيق RAG](/docs/projects/rag-notes#️-common-pitfalls) لنفس نمط حد المعدل وكيفية إضافة إعادة محاولة.
- **عدم إعادة بناء الفهرس بعد تغيير `docs/`.** تمامًا كمشروع تطبيق RAG: يعمل `build_index.py` فقط عندما تُشغّله. أضف أو عدّل وثيقة ويستمر البوت في الإجابة من الفهرس *القديم* حتى تُعيد تشغيل `uv run python build_index.py` وتعيد تشغيل البوت.
- **تشغيل البوت برمز قديم أو خاطئ بعد إعادة توليده.** يؤدي النقر على "Reset Token" في بوابة المطورين إلى إبطال الرمز القديم فورًا — إذا كان `.env` لا يزال يحمل القيمة القديمة، يفشل `client.run(...)` في تسجيل الدخول. حدِّث `.env` في كل مرة تُعيد فيها ضبط الرمز، ولا تفترض أبدًا أن القيمة التي نسختها مرة لا تزال صالحة.

## ما بنيته للتو

بوت Discord حي يجيب عن أسئلة حقيقية من توثيق حقيقي، مؤسَّس على نص مُسترجَع بدلًا من المعرفة العامة للنموذج — نفس خط أنابيب RAG بالضبط من [مشروع تطبيق RAG](/docs/projects/rag-notes)، مع حلقة أحداث `discord.py` تحل محل سكربت CLI كواجهة. لم يتغير كود الاسترجاع والتوليد بأي طريقة ذات مغزى؛ فقط كيفية دخول سؤال وخروج إجابة تغيّرت. هذا شيء مفيد ملاحظته بشكل عام: المنطق الأساسي لخط أنابيب RAG مستقل عن الواجهة، ويمكن لنفس زوج `retrieve()`/`answer()` هنا أن يجلس بسهولة خلف بوت Slack، أو استمارة ويب، أو نقطة نهاية API بدلًا من ذلك.

## إلى أين تذهب من هنا

- أضف **أمر شرطة مائلة** (`/ask <سؤال>`) باستخدام `app_commands` الخاصة بـ`discord.py` بالإضافة إلى، أو بدلًا من، الردود القائمة على الذكر — تظهر أوامر الشرطة المائلة في واجهة Discord بإكمال تلقائي ولا تتطلب كتابة `@ذكر`، مقابل قليل من كود التسجيل الإضافي.
- تتبّع أي مصدر من `docs/` استشهد به كل رد فعليًا، واجعل البوت يتضمن سطر "المصدر: file.md" في رده — ميزة صغيرة لكن حقيقية لبناء الثقة لأي شخص يقرأ الإجابة.
- بمجرد أن يفوق مجلد التوثيق الخاص بك ما يناسب الذاكرة بارتياح، انظر إلى قاعدة بيانات متجهية حقيقية مثل [ChromaDB](https://www.trychroma.com/)، تمامًا كما اقتُرح في ["إلى أين تذهب من هنا" الخاص بمشروع تطبيق RAG](/docs/projects/rag-notes#where-to-go-from-here) — لا شيء بخصوص طبقة Discord يحتاج للتغيير لدعم ذلك.
- انشر البوت في مكان يبقى نشطًا دون أن يعمل حاسوبك المحمول الخاص — جهاز افتراضي صغير دائم التشغيل، أو مستوى مجاني على منصة مثل Railway أو Fly.io — لكي يستمر في الإجابة عن الأسئلة حتى عندما لا تكون عند جهازك.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓

<ProjectProgressCheckbox projectId="docs-qa-bot" />
