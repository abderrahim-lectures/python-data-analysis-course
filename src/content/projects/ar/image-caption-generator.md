---
title: "مولد تعليقات الصور"
description: "توليد أوصاف باللغة الطبيعية للصور باستخدام نماذج الرؤية واللغة."
difficulty: "intermediate"
estimatedMinutes: 45
tags: ["ai", "computer-vision", "cli"]
learningObjectives:
  - "تحميل الصور ومعالجتها مسبقًا لتكون مناسبة لمدخلات نموذج الرؤية واللغة"
  - "إرسال الصور إلى واجهة برمجية رؤية مجانية وتحليل استجابات التعليقات"
  - "معالجة دفعات من الصور مع تتبع التقدم"
  - "دمج التعليقات المولّدة في بيانات EXIF الوصفية للصور"
prerequisites: ["Python 101"]
---


# 🖼️ ابنِ مولد تعليقات الصور

كل صورة على الويب تحتاج وصفًا نصيًا — من أجل إمكانية الوصول، ولمحركات البحث، وللأشخاص الذين لا يستطيعون تحميل الصورة. كتابة التعليقات يدويًا بطيئة؛ والنموذج الرؤية-واللغة يولّدها في ثوانٍ. يبني هذا المشروع أداة CLI تأخذ صورة (من مسار ملف أو رابط URL) وتنتج تعليقًا مقروءًا للإنسان باستخدام واجهة برمجية رؤية مجانية. ستتعامل مع المعالجة المسبقة للصور، واستدعاءات الواجهة البرمجية، والمعالجة الدفعية مع تتبع التقدم، وحتى كتابة التعليقات مجددًا في البيانات الوصفية للصورة.

هذا يفترض إنهاء Python 101 — لا يُشترط أي شيء من تحليل البيانات. هذا اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة.

## 🎯 ما ستفعله

1. إعداد مشروع باستخدام `uv` وتثبيت التبعيات التي ستحتاجها.
2. تحميل الصور وإعادة تحجيمها للاستهلاك عبر الواجهة البرمجية باستخدام Pillow.
3. إرسال صورة إلى نموذج رؤية-ولغة من المستوى المجاني وتحليل التعليق.
4. بناء معالج دفعي يتعامل مع مجلدات من الصور مع تتبع التقدم.
5. دمج التعليقات المولّدة في بيانات EXIF الوصفية للصور للتخزين القابل للنقل.
6. ربط كل شيء في أداة CLI تُعلِّق على صورة واحدة أو مجلدات كاملة.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي — هذه الأداة تقرأ ملفات الصور من القرص وتكتب صورًا معدَّلة تحمل بيانات وصفية مدمجة.

**Google Colab وKaggle Notebooks وBinder** تصلح لتجربة الأداة. يستخدم دفتر الملاحظات الكود نفسه ويتضمن صورًا عينات للاختبار. ستحتاج إلى مفتاح API مجاني (GitHub Models أو Gemini أو Groq) مضبوطًا كمتغير بيئة.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/image-caption-generator/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/image-caption-generator/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fimage-caption-generator%2Fnotebook.ipynb)

## الإعداد

كل ما تحتاجه قبل إضافة التعليقات: بيئة Python، ومكتبة للصور، وعميل HTTP، ومفتاح API مجاني.

### ثبّت `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

أغلق طرفيتك وأعد فتحها ثم أكِّد:

```bash
uv --version
```

### أعِدَّ المشروع

```bash
uv init image-caption-generator
cd image-caption-generator
uv add Pillow requests click python-dotenv
```

تتولى `Pillow` تحميل الصور وإعادة التحجيم وبيانات EXIF الوصفية. ويرسل `requests` الصور إلى الواجهة البرمجية للرؤية. يبني `click` أداة CLI، ويحمّل `python-dotenv` مفتاح API من ملف `.env`.

### احصل على مفتاح API مجاني للرؤية

تحتاج إلى مزوّد يدعم مدخلات الصور. يعمل كلٌّ من GitHub Models وGemini:

| المزوّد | من أين تحصل على المفتاح | نموذج الرؤية |
|---|---|---|
| **GitHub Models** *(المقترح)* | [github.com/settings/tokens](https://github.com/settings/tokens) بنطاق `models: read` | `gpt-4o-mini` |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | `gemini-1.5-flash` |

```bash
# .env
GITHUB_TOKEN=your-key-here
```

**✅ قائمة التحقق**

- ✅ `uv --version` يطبع رقم إصدار.
- ✅ يوجد مجلد `image-caption-generator/` مع `pyproject.toml`، و`Pillow` و`requests` و`click` و`python-dotenv` مثبَّتة.
- ✅ لديك ملف `.env` بمفتاح API صالح — غير مُلصَق في أي سكربت.

## الخطوة 1: حمِّل الصور وعالجها مسبقًا

للواجهات البرمجية للرؤية حدود على الحجم — إرسال صورة خام بحجم 20 ميجابايت يهدر النطاق وقد يُرفض. المعالجة المسبقة تحمّل الصورة، وتحجّمها إلى بُعد معقول، وتحولها إلى صيغة تقبلها الواجهة البرمجية (JPEG أو PNG مشفَّرة base64).

### 1.1 حمِّل صورةً وأعد تحجيمها

**👟 تلميح البداية :**

أنشئ `caption/preprocess.py` مع دالة تحمّل صورةً وتعيد تحجيمها لتناسب 1024×1024 بكسل.

```python
# caption/preprocess.py
from PIL import Image
import base64
from io import BytesIO
from pathlib import Path

MAX_DIMENSION = 1024

def load_and_resize(image_path: str) -> Image.Image:
    """Load an image and resize it to fit within MAX_DIMENSION."""
    img = Image.open(image_path)
    img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)
    return img

def image_to_base64(img: Image.Image, format: str = "JPEG") -> str:
    """Convert a PIL Image to a base64-encoded string."""
    buffer = BytesIO()
    img.convert("RGB").save(buffer, format=format)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")
```

طريقة `thumbnail` تعيد تحجيم الصورة مع الحفاظ على نسبة الأبعاد — صورة بحجم 4000×3000 تصبح 1024×768، وليست 1024×1024 مشوّهة. استدعاء `convert("RGB")` يضمن أن الصورة في صيغة يمكن لـ JPEG ترميزها، حتى لو كان الأصل RGBA (PNG شفافة) أو تدرّج رمادي. سلسلة base64 هي ما تتوقعه الواجهة البرمجية في نصّ الطلب.

**🎯 الناتج المتوقع :**

تُعيد `load_and_resize("photo.jpg")` صورة PIL ببُعدين كلاهما ≤ 1024. وتُعيد `image_to_base64(img)` سلسلة طويلة من المحارف (A-Z، a-z، 0-9، +، /).

**🩹 إذا لم يعمل :**

إذا لم يُعد `thumbnail` التحجيم، فالصورة أصغر بالفعل من الحد الأقصى — هذا سلوك صحيح، لا خطأ. إذا فشل ترميز base64، فقد لا تدعم PIL صيغة الصورة.

### 1.2 تحقّق

```python
from caption.preprocess import load_and_resize, image_to_base64
from PIL import Image

# Create a test image
img = Image.new("RGB", (2000, 1500), color="red")
img.save("/tmp/test_large.jpg")

# Resize
small = load_and_resize("/tmp/test_large.jpg")
assert small.width <= 1024
assert small.height <= 1024

# Encode
b64 = image_to_base64(small)
assert len(b64) > 100  # base64 string is non-trivial
```

**🎯 الناتج المتوقع :**

تمر جميع التوكيدات؛ الصورة المعاد تحجيمها تناسب 1024×1024 وسلسلة base64 غير فارغة.

**🩹 إذا لم يعمل :**

إذا ما زال العرض أو الارتفاع فوق 1024، فـ`thumbnail` لا يُستدعى — تحقّق من أن الطريقة مُتسلسلة على كائن `img`.

### 1.3 تحقّق

**✅ قائمة التحقق**

- ✅ تُعيد `load_and_resize` صورة ببُعدين كلاهما ≤ 1024.
- ✅ نسبة الأبعاد محفوظة (غير ممطوطة أو معصورة).
- ✅ تُعيد `image_to_base64` سلسلة base64 صالحة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لماذا نعيد تحجيمها إلى 1024×1024 بدلًا من إرسال الصورة بكامل الدقة؟ وما تكلفة إرسال صورة بحجم 20 ميجابايت إلى واجهة رؤية برمجية مقارنةً بنسخة معاد تحجيمها 200 كيلوبايت؟
- إذا كانت صورة الإدخال لقطة شاشة (1920×1080)، فالصورة المصغّرة 1024×576. ماذا سيتغير إذا احتجت قصًّا مربعًا لتطبيق وسائط اجتماعية؟

## الخطوة 2: أرسل صورة إلى واجهة رؤية برمجية وحلِّل التعليق

تأخذ الواجهة البرمجية للرؤية صورةً ومطالبة نصية وتُعيد وصفًا. ستستخدم نقطة النهاية المتوافقة مع OpenAI (التي تعمل مع GitHub Models وGemini وغيرهما) لإرسال الصورة كرابط بيانات base64.

### 2.1 اكتب مُنادي الواجهة البرمجية

**👟 تلميح البداية :**

أنشئ `caption/api.py` مع دالة ترسل صورةً إلى نموذج الرؤية وتُعيد التعليق.

```python
# caption/api.py
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

def get_client() -> OpenAI:
    """Create an OpenAI-compatible client for GitHub Models."""
    return OpenAI(
        api_key=os.environ.get("GITHUB_TOKEN", ""),
        base_url="https://models.github.ai/inference",
    )

def caption_image(client: OpenAI, image_b64: str, prompt: str = "Describe this image in one detailed sentence.") -> str:
    """Send a base64 image to the vision model and return the caption."""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}},
            ],
        }],
        max_tokens=200,
    )
    return response.choices[0].message.content.strip()
```

صيغة `data:image/jpeg;base64,{image_b64}` هي كيف تقبل واجهات الرؤية البرمجية الصور المضمَّنة — يستلم النموذج بيانات البكسل الخام مشفَّرة كنص، لا رابطًا يحتاج إلى جلب. يُبقي `max_tokens=200` التعليقات موجزة. والمطالبة قابلة للضبط فتستطيع طلب أنماط مختلفة من التعليقات («جملة واحدة»، «فقرة مفصَّلة»، «نص بديل لقارئات الشاشة»).

**🎯 الناتج المتوقع :**

تُعيد `caption_image(client, base64_string)` سلسلة مثل «دراجة حمراء متوقفة بجانب جدار من الطوب في ظهيرة مشمسة».

**🩹 إذا لم يعمل :**

إذا أعادت الواجهة البرمجية خطأً، تحقّق من أن متغير البيئة `GITHUB_TOKEN` مضبوط. إذا كانت الاستجابة فارغة، فقد لا يدعم النموذج الرؤية — جرّب اسم نموذج مختلفًا.

### 2.2 تعامل مع الأخطاء بأمان

```python
# caption/api.py (continued)
def safe_caption(client: OpenAI, image_b64: str, prompt: str = "Describe this image.") -> str:
    """Caption an image with error handling."""
    try:
        return caption_image(client, image_b64, prompt)
    except Exception as e:
        return f"[Error: {e}]"
```

**🎯 الناتج المتوقع :**

إذا نجح استدعاء الواجهة البرمجية، تُعيد التعليق. وإذا فشل (خطأ شبكة، مفتاح غير صالح، حد معدل)، تُعيد سلسلة خطأ بدلًا من الانهيار.

**🩹 إذا لم يعمل :**

إذا لم تُلتقط الأخطاء، فكتلة `try/except` مفقودة أو نوع الاستثناء غير شامل بما يكفي.

### 2.3 تحقّق

**✅ قائمة التحقق**

- ✅ تُعيد `caption_image` سلسلة (التعليق) لصورة صالحة.
- ✅ تُعيد `safe_caption` رسالة خطأ بدلًا من الانهيار عند الفشل.
- ✅ يمكن إنشاء العميل من ملف `.env` دون ترميز المفتاح مباشرةً في الكود.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- التعليق سلسلة نصية. إذا أردت مخرجات منظَّمة (كائنات، ألوان، نوع مشهد)، كيف تعدّل المطالبة لتحصل على JSON قابل للتحليل من النموذج؟
- إذا أرسلت الصورة نفسها مرتين بمطالبتين مختلفتين، ستحصل على تعليقين مختلفين. كيف تضع معيارًا لقياس أي مطالبة تُنتج التعليقات الأكثر فائدة لحالتك؟

## الخطوة 3: ابنِ معالجًا دفعيًا مع تتبع التقدم

إضافة تعليق لصورة واحدة أمر مباشر؛ أما إضافته لمجلد فيه 500 صورة فيتطلب تتبع تقدم، ومعالجة أخطاء لكل صورة، وملخصًا لما نجح.

### 3.1 اكتب المعالج الدفعي

**👟 تلميح البداية :**

أنشئ `caption/batch.py` مع دالة تعالج مجلدًا من الصور.

```python
# caption/batch.py
from pathlib import Path
from caption.preprocess import load_and_resize, image_to_base64
from caption.api import get_client, safe_caption

def caption_directory(
    directory: str,
    extensions: tuple[str, ...] = (".jpg", ".jpeg", ".png", ".webp"),
) -> list[dict]:
    """Caption all images in a directory. Returns a list of {path, caption, error} dicts."""
    client = get_client()
    results = []
    image_files = sorted(
        p for p in Path(directory).iterdir()
        if p.suffix.lower() in extensions
    )
    total = len(image_files)
    for i, path in enumerate(image_files, 1):
        print(f"[{i}/{total}] {path.name}...", end=" ", flush=True)
        try:
            img = load_and_resize(str(path))
            b64 = image_to_base64(img)
            caption = safe_caption(client, b64)
            results.append({"path": str(path), "caption": caption, "error": None})
            print("OK")
        except Exception as e:
            results.append({"path": str(path), "caption": None, "error": str(e)})
            print(f"FAIL: {e}")
    print(f"\nDone: {total - len([r for r in results if r['error']])}/{total} succeeded")
    return results
```

تتجاوز الدالة المجلد، وتصفّي حسب امتداد الصورة، وتعالج كل ملف بعدّاد تقدم. `end=" "` و`flush=True` في الطباعة يُبقيان التقدم على سطر واحد. كل نتيجة قاموس يحمل المسار والتعليق والخطأ (إن وُجد) — ما يسهّل فصل الناجح عن الفاشل لاحقًا.

**🎯 الناتج المتوقع :**

لمجلد فيه 5 صور، يعرض الناتج `[1/5] photo1.jpg... OK` حتى `[5/5] photo5.jpg... OK`، وينتهي بـ «Done: 5/5 succeeded».

**🩹 إذا لم يعمل :**

إذا لم تُعثر على ملفات، تحقّق من صحة المسار ومن أن الملفات تحمل امتدادات صور. إذا فشلت كل الملفات بالخطأ نفسه، فمفتاح API غير صالح غالبًا.

### 3.2 أضف تحديد معدل الطلبات

```python
# caption/batch.py (continued)
import time

def caption_directory_with_delay(
    directory: str,
    delay_seconds: float = 1.0,
    **kwargs,
) -> list[dict]:
    """Caption with a delay between API calls to respect rate limits."""
    client = get_client()
    results = []
    image_files = sorted(
        p for p in Path(directory).iterdir()
        if p.suffix.lower() in kwargs.get("extensions", (".jpg", ".jpeg", ".png", ".webp"))
    )
    total = len(image_files)
    for i, path in enumerate(image_files, 1):
        print(f"[{i}/{total}] {path.name}...", end=" ", flush=True)
        try:
            img = load_and_resize(str(path))
            b64 = image_to_base64(img)
            caption = safe_caption(client, b64)
            results.append({"path": str(path), "caption": caption, "error": None})
            print("OK")
        except Exception as e:
            results.append({"path": str(path), "caption": None, "error": str(e)})
            print(f"FAIL: {e}")
        if i < total:
            time.sleep(delay_seconds)
    return results
```

مزوّدو المستوى المجاني غالبًا ما يفرضون حدود معدل (طلبات لكل دقيقة). استدعاء `time.sleep(delay_seconds)` بين الطلبات يمنعك من الوصول لتلك الحدود والتعرض للتقليص. ثانية واحدة بين الطلبات تحفظيّة بما يكفي لمعظم المزوّدين.

**🎯 الناتج المتوقع :**

يتوقف المعالج الدفعي لحظة وجيزة بين كل صورة، وتنجح جميع الطلبات دون أخطاء 429 (حد معدل).

**🩹 إذا لم يعمل :**

إذا ما زلت تصل لحدود المعدل، زِد التأخير. إذا كانت الدفعة بطيئة جدًا، قلّله — لكن راقب الأخطاء.

### 3.3 تحقّق

**✅ قائمة التحقق**

- ✅ يعالج `caption_directory` جميع ملفات الصور في مجلد.
- ✅ يُطبع التقدم بصيغة `[i/total] filename... OK/FAIL`.
- ✅ تشمل النتائج التعليقات الناجحة ورسائل الأخطاء معًا.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- إذا انقطعت دفعة من 1000 صورة في منتصفها (خطأ شبكة، Ctrl+C)، كيف تستأنف من حيث توقفت بدلًا من إعادة إضافة التعليقات لأول 500؟
- يطبع المعالج الدفعي التقدم إلى stdout. لأداة حقيقية، كيف تضيف شريط تقدم (مثل `tqdm`) يعرض الوقت المقدَّر والإنتاجية؟

## الخطوة 4: ادمج التعليقات في بيانات EXIF الوصفية للصور

تخزين التعليقات كملفات نصية منفصلة أمر هشّ — ينفصل التعليق عن الصورة. بيانات EXIF الوصفية مدمجة في ملف الصورة نفسه، لذلك يرافق التعليق الصورة أينما ذهبت.

### 4.1 اكتب بيانات EXIF الوصفية

**👟 تلميح البداية :**

أنشئ `caption/metadata.py` مع دالة تكتب تعليقًا في حقل EXIF UserComment للصورة.

```python
# caption/metadata.py
from PIL import Image
from PIL.ExifTags import Base as ExifBase
import piexif

def write_caption_to_exif(image_path: str, caption: str, output_path: str | None = None):
    """Write a caption into an image's EXIF UserComment field."""
    output = output_path or image_path
    img = Image.open(image_path)

    # Build EXIF data
    exif_dict = {"0th": {}, "Exif": {}, "GPS": {}, "1st": {}}

    # UserComment tag (0x9286)
    exif_dict["Exif"][piexif.ExifIFD.UserComment] = caption.encode("utf-8")

    # Write back
    exif_bytes = piexif.dump(exif_dict)
    img.save(output, exif=exif_bytes, quality=95)
    print(f"Caption written to {output}")
```

وسم `UserComment` في EXIF (0x9286) هو الحقل القياسي لأي نص وصفي عشوائي في الصور. استخدام `piexif` يمنحك وصولًا مباشرًا إلى بنية EXIF الخام بدلًا من الاعتماد على دعم Pillow المحدود لـ EXIF. معامل `output_path` يتيح لك الكتابة إلى ملف جديد بدلًا من تعديل الأصل.

**🎯 الناتج المتوقع :**

تحفظ `write_caption_to_exif("photo.jpg", "غروب شمس فوق المحيط")` الصورة مع تعليق مدمج في بيانات EXIF الخاصة بها.

**🩹 إذا لم يعمل :**

إذا لم تكن `piexif` مثبَّتة، أضفها: `uv add piexif`. إذا فُقدت بيانات EXIF بعد الحفظ، فقد يتسبب معامل الجودة في إعادة ترميز — جرّب `quality=100`.

### 4.2 اقرأ تعليقات EXIF

```python
# caption/metadata.py (continued)
def read_caption_from_exif(image_path: str) -> str | None:
    """Read the caption from an image's EXIF UserComment field."""
    try:
        img = Image.open(image_path)
        exif = img.getexif()
        if piexif.ExifIFD.UserComment in exif:
            return exif[piexif.ExifIFD.UserComment].decode("utf-8")
    except Exception:
        pass
    return None
```

**🎯 الناتج المتوقع :**

قراءة التعليق مجددًا تُعيد السلسلة نفسها المكتوبة تمامًا.

**🩹 إذا لم يعمل :**

إذا أعادت القراءة `None` بعد الكتابة، فقد لا يتطابق رقم وسم EXIF — تحقّق من `piexif.ExifIFD.UserComment`.

### 4.3 تحقّق

**✅ قائمة التحقق**

- ✅ تدمج `write_caption_to_exif` التعليق في ملف الصورة.
- ✅ تُعيد `read_caption_from_exif` سلسلة التعليق نفسها تمامًا.
- ✅ الصورة المعدَّلة مطابقة بصريًا للأصل.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تُجرَّد بيانات EXIF من معظم منصات التواصل الاجتماعي وتطبيقات المراسلة. إذا احتجت تعليقات تنجو من الرفع، أين تخزنها أيضًا؟
- إذا أردت تضمين تعليقات بلغات متعددة، كيف تخزنها في EXIF دون الكتابة فوق اللغة السابقة؟

## الخطوة 5: ابنِ أداة CLI

اربط كل شيء معًا بأوامر لإضافة التعليق لصورة واحدة، ومعالجة الدفعات، وعمليات البيانات الوصفية.

### 5.1 ابنِ أداة CLI

**👟 تلميح البداية :**

أنشئ `caption/cli.py` بأوامر فرعية `caption` و`batch` و`embed`.

```python
# caption/cli.py
import json
import click
from caption.preprocess import load_and_resize, image_to_base64
from caption.api import get_client, safe_caption
from caption.batch import caption_directory
from caption.metadata import write_caption_to_exif

@click.group()
def cli():
    """Image Caption Generator — caption images with AI vision models."""
    pass

@cli.command()
@click.argument("image_path", type=click.Path(exists=True))
@click.option("--prompt", default="Describe this image in one detailed sentence.")
def caption(image_path, prompt):
    """Generate a caption for a single image."""
    client = get_client()
    img = load_and_resize(image_path)
    b64 = image_to_base64(img)
    result = safe_caption(client, b64, prompt)
    click.echo(f"Caption: {result}")

@cli.command()
@click.argument("directory", type=click.Path(exists=True))
@click.option("--output", "-o", default="captions.json", help="Output JSON file")
def batch(directory, output):
    """Caption all images in a directory."""
    results = caption_directory(directory)
    with open(output, "w") as f:
        json.dump(results, f, indent=2)
    click.echo(f"Results saved to {output}")

@cli.command()
@click.argument("image_path", type=click.Path(exists=True))
@click.option("--caption-text", "-c", required=True, help="Caption to embed")
def embed(image_path, caption_text):
    """Embed a caption into an image's EXIF metadata."""
    write_caption_to_exif(image_path, caption_text)
    click.echo("Caption embedded successfully")

if __name__ == "__main__":
    cli()
```

الأوامر الثلاثة تقابل حالات الاستخدام الرئيسية الثلاث: تعليق صورة واحدة (اختبار سريع)، وتعليق مجلد (عمل دفعي)، ودمج تعليق (إدارة البيانات الوصفية). يفوض كل أمر الكود إلى المكتبة ويطبع نتيجة مقروءة للإنسان.

**🎯 الناتج المتوقع :**

يطبع `uv run python -m caption.cli caption photo.jpg` «Caption: A red bicycle parked against a wall».

**🩹 إذا لم يعمل :**

إذا فشل `get_client()`، تفقّد ملف `.env`. إذا لم يُعثر على مسار الصورة، شغّل الأمر من المجلد الذي يضم الصورة.

### 5.2 اختبار دخاني من طرف إلى طرف

```python
from caption.preprocess import load_and_resize, image_to_base64
from caption.metadata import write_caption_to_exif, read_caption_from_exif
from PIL import Image

# Create a test image
img = Image.new("RGB", (800, 600), color="blue")
img.save("/tmp/test_caption.jpg")

# Preprocess
small = load_and_resize("/tmp/test_caption.jpg")
b64 = image_to_base64(small)
assert len(b64) > 100

# Metadata round-trip
write_caption_to_exif("/tmp/test_caption.jpg", "A blue rectangle")
capt = read_caption_from_exif("/tmp/test_caption.jpg")
assert capt == "A blue rectangle"
```

يختبر هذا المسار الكامل: إنشاء، معالجة مسبقة، ترميز، دمج، قراءة مجددًا. اختُبرت كل قطعة على حدة؛ وهذا يؤكد أن التسليم بينها سليم.

**🎯 الناتج المتوقع :**

تمر جميع التوكيدات؛ ينتقل التعليق ذهابًا وإيابًا عبر بيانات EXIF الوصفية.

**🩹 إذا لم يعمل :**

إذا فشلت قراءة EXIF، تحقّق من أن `piexif` مثبَّتة ومن أن الكتابة لم تُتلف الملف.

### 5.3 تحقّق

**✅ قائمة التحقق**

- ✅ يولّد `caption` وصفًا نصيًا لصورة واحدة.
- ✅ يعالج `batch` جميع الصور في مجلد ويحفظ النتائج إلى JSON.
- ✅ يكتب `embed` تعليقًا في بيانات EXIF الوصفية يمكن قراءته مجددًا.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- إذا أردت إضافة التعليقات لصور من روابط URL بدلًا من الملفات المحلية، ماذا سيتغير في خطوة المعالجة المسبقة؟
- كيف تضيف أمر `--compare` يُعلِّق على الصورة نفسها بمطالبتين مختلفتين ويعرض الاختلافات جنبًا إلى جنب؟

## ⚠️ مآزق شائعة

- **إرسال صور بكامل الدقة إلى الواجهة البرمجية.** صورة بحجم 20 ميجابايت تهدر النطاق، وتكلف رموزًا أكثر، وقد تتجاوز حد حجم الواجهة البرمجية. أعِد التحجيم دائمًا إلى ≤ 1024 بكسل على أطول ضلع قبل الإرسال.
- **نسيان أن بيانات EXIF تُجرَّد عند الرفع.** معظم منصات التواصل الاجتماعي وتطبيقات المراسلة تزيل بيانات EXIF الوصفية. إذا احتاجت تعليقاتك إلى النجاة من الرفع، خزّنها في ملف جانبي أو قاعدة بيانات كذلك.
- **عدم التعامل مع حدود معدل الواجهة البرمجية في الوضع الدفعي.** مزوّدو المستوى المجاني يحدّون الطلبات لكل دقيقة. دون تأخير بين الطلبات في المعالجة الدفعية، ستصطدم بأخطاء 429 بعد بضع صور.
- **إرسال صور RGBA إلى ترميز JPEG.** لا يدعم JPEG الشفافية. استدعاء `convert("RGB")` في `image_to_base64` يتولى هذا الأمر، لكن نسيانه يسبب خطأ `cannot write mode RGBA as JPEG`.
- **الثقة بأول تعليق كحقيقة مطلقة.** نماذج الرؤية أحيانًا تهلوس كائنات ليست في الصورة أو تفوّت تفاصيل واضحة. للاستخدام الإنتاجي، ستضيف خطوة تحقق أو مراجعة بشرية.

## ما بنيته للتو

مولّد تعليقات صور يأخذ أي صورة وينتج وصفًا مقروءًا للإنسان باستخدام نموذج رؤية من المستوى المجاني. المسار — معالجة مسبقة، ترميز، تعليق، دمج البيانات الوصفية — يتولى دورة الحياة الكاملة لنص بديل يولّده الذكاء الاصطناعي. المعالج الدفعي يحول مجلدًا فيه مئات الصور إلى ملف JSON من التعليقات في دقائق، ودمج EXIF يضمن بقاء التعليقات ملتصقة بصورها.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/image-caption-generator/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/image-caption-generator) في مستودع الدورة نسخة أغنى تدعم عدة مزوّدين، مع صور عينات وأداة CLI موصولة من البداية للنهاية. استنسخه، أو افتح المستودع كاملًا في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وشغّله من هناك.
:::

## إلى أين تذهب من هنا

- أضف وضع `--compare` يرسل الصورة نفسها إلى نموذجين مختلفين ويعرض التعليقات جنبًا إلى جنب لمقارنة الجودة.
- ابنِ واجهة ويب بـ Gradio أو Streamlit تتيح لك سحب الصور وإفلاتها ورؤية التعليقات فورًا.
- نفّذ تقييم جودة التعليقات: استخدم نموذجًا ثانيًا لتصنيف دقة التعليق وتفصيله وقواعده على مقياس 1–5.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓