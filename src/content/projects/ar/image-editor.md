---
title: "محرر الصور"
description: "عالج الصور مع الفلاتر والتغيير والعلامة المائية وتحويل الصيغ والعمليات الدفعية."
difficulty: "intermediate"
estimatedMinutes: 60
tags: ["pillow", "image-processing", "filters", "batch-processing"]
learningObjectives:
  - "تحميل الصور وفحصها وحفظها بصيغ متعددة باستخدام Pillow"
  - "تطبيق الفلاتر والتحسينات عبر جدول توزيع واحد"
  - "إعادة التحجيم والقص مع الحفاظ على نسبة الأبعاد"
  - "إضافة علامات مائية نصية وصورية مع الشفافية"
  - "معالجة مجلدات كاملة من الصور دفعة واحدة"
prerequisites:
  - "أساسيات بايثون (دوال، حلقات، قواميس)"
  - "قراءة الملفات وكتابتها والتعامل مع المجلدات"
---


# 🛠️ 🖼️ ابنِ مجموعة أدوات تحرير الصور

كل جهاز يمتلئ بصور تطلب جميعها المعاملة نفسها — تحجيم هنا، علامة مائية هناك، رفع سطوع في كل مكان. يبني هذا المشروع مجموعة أدوات لمعالجة الصور باستخدام Pillow: تحميل الصور وفحصها، وتطبيق فلاتر وتحسينات لونية، والقص والتحجيم دون تشويه، وإضافة علامات مائية شفافة، ومعالجة مجلد كامل من الصور في تمريرة واحدة.

هذا يفترض إنهاء Python 101 وإلمامًا أساسيًا بالملفات والمجلدات — لا يُشترط أي شيء من تحليل البيانات. هذا اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/docs/projects) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. تحميل صور حقيقية وفحص صيغتها وأبعادها ونمط ألوانها.
2. تطبيق تأثيرات التمويه والحدة والحواف والسطوع والتشبع عبر جدول توزيع واحد.
3. إعادة التحجيم والقص دون تمدد، مع الحفاظ على نسبة الأبعاد.
4. إضافة علامة مائية نصية شبه شفافة وتراكب شعار صوري.
5. معالجة مجلد صورك كاملًا في حلقة واحدة.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي. Pillow مكتبة أصلية — مسارات `resize` و`filter` وفك الترميز فيها ترتبط بمخطِّطات صور مُترجَمة — وتُثبَّت بنظافة عبر `uv add`، فتحصل على المجموعة كاملة إضافةً إلى نظام الملفات الحقيقي الذي تتطلبه المعالجة الدفعية.

**دفاتر Google Colab وBinder** تعمل جيدًا أيضًا: يعكس الدفتر كل خطوة، ويُثبَّت Pillow بأمر `!pip install Pillow` واحد، ويمكنك رفع صورة أو استخدام صور الاختبار الحتمية نفسها التي يولّدها الإعداد. **JupyterLite** هو المسار الوحيد الذي يُفضَّل تجنبه: إذ يشغّل Python في المتصفح دون طبقة حزم أصلية، لذا لا يمكن تثبيت Pillow هناك — استخدم شارات الدفاتر أدناه أو المسار المحلي بدلًا منه.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/image-editor/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/image-editor/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fimage-editor%2Fnotebook.ipynb)

## الإعداد

أنشئ المشروع وثبّت Pillow، ثم ولّد ثلاث صور اختبار حتمية حتى تملك كل خطوة في هذا المشروع مادةً تعمل عليها — دون إنترنت أو صور شخصية.

```bash
uv init image-editor
cd image-editor
uv add Pillow
```

**👟 تلميح البداية :**

اكتب الإعداد كسكربت صغير يمكنك إعادة تشغيله: فهو ينشئ مجلدًا ويرسم بضع أشكال ملونة في كل صورة، حتى تحصل دائمًا على مدخلات طازجة ومعروفة.

```python
# make_sample_images.py
from pathlib import Path
from PIL import Image, ImageDraw
import random

def make_sample_images(output: str = "input_photos", count: int = 3, size: int = 480) -> None:
    """Generate `count` deterministic RGB test images for the editor to chew on."""
    out = Path(output)
    out.mkdir(parents=True, exist_ok=True)
    for i in range(1, count + 1):
        rng = random.Random(i)
        img = Image.new("RGB", (size, size), (rng.randint(20, 60), rng.randint(20, 60), rng.randint(20, 60)))
        draw = ImageDraw.Draw(img)
        for _ in range(rng.randint(6, 12)):
            x0, y0 = rng.randint(0, size), rng.randint(0, size)
            x1, y1 = rng.randint(x0, size), rng.randint(y0, size)
            color = (rng.randint(80, 255), rng.randint(80, 255), rng.randint(80, 255))
            if rng.random() < 0.5:
                draw.rectangle((x0, y0, x1, y1), fill=color)
            else:
                draw.ellipse((x0, y0, x1, y1), fill=color)
        img.save(out / f"photo{i}.jpg", quality=92)
    print(f"Generated {count} test images in {output}/")

make_sample_images()
```

الحيلة الأساسية هي `random.Random(i)` — مُولِّد *مُزروع لكل صورة* بدلًا من المُولِّد العام. ولأن كل استدعاء يعيد البذر بالقيمة `i` نفسها، فإن تشغيل السكربت مرتين يُنتج مجلدين متطابقَي البايت، ما يعني أن نواتجك المتوقعة وفحوصات الفشل تبقى قابلة للتكرار بدلًا من تغير شكلها في كل تشغيل. يبدأ `Image.new("RGB", (size, size), color)` كل صورة بخلفية مسطحة، وترسم وكالات `ImageDraw` (`draw.rectangle`، `draw.ellipse`) الأشكال — مذاقك الأول من حلقة Pillow «افتح صورة، احصل على سطح رسم، احفظ».

**🎯 الناتج المتوقع :**

مجلد جديد `input_photos/` يضم `photo1.jpg` و`photo2.jpg` و`photo3.jpg`، كلُّها 480×480 — وإعادة تشغيل السكربت تطبع الرسالة نفسها دون تغيير أي بكسل.

**🩹 إذا لم يعمل :**

إذا كان المجلد فارغًا، فسطر `mkdir(parents=True, exist_ok=True)` مفقود، أو مسار `save` لا يدمج `output` مع اسم الملف. إذا تغيرت الصور في كل تشغيل، فالمُولِّد غير مُزروع لكل ملف — أعد `random.Random(i)` داخل الحلقة.

**✅ قائمة التحقق**

- ✅ يعمل `uv run python --version` وثُبِّت `uv add Pillow` بنظافة.
- ✅ يحتوي `input_photos/` على `photo1.jpg` و`photo2.jpg` و`photo3.jpg` (كلٌّ 480×480).
- ✅ الصور مختلفة عن بعضها بعضًا ومستقرة عبر إعادة التشغيل.

## الخطوة 1: حمّل صورة وافحصها

قبل تحرير صورة عليك أن تعرف ما الذي تحمله: الصيغة، والأبعاد، ونمط الألوان. يفتح Pillow الصورة بكسلاً — يقرأ الترويسة لكنه لن يفك ترميز البكسلات حتى يُجبَر — لذا تبني هذه الخطوة أداة تحميل تلتقط المشاكل *مبكرًا* وتفحص ما حملته.

### 1.1 اكتب أداة تحميل آمنة

**👟 تلميح البداية :**

يمكن لـ `Image.open` أن ينجح على ملف لا يمكن فك ترميزه لاحقًا، فأجبِر فك الترميز بـ `img.load()` داخل كتلة الحماية نفسها وارفع استثناءً عند أي شيء غير معتاد.

```python
# editor.py
from PIL import Image, ImageFilter, ImageEnhance

def load_image(path: str) -> Image.Image:
    """Load an image and handle common errors."""
    try:
        img = Image.open(path)
        img.load()  # force a real decode, so corrupt files fail here, not later
        return img
    except FileNotFoundError:
        print(f"Error: File '{path}' not found.")
        raise
    except Exception as e:
        print(f"Error loading image: {e}")
        raise

img = load_image("input_photos/photo1.jpg")
print(f"Format: {img.format}")
print(f"Size:   {img.width}x{img.height} pixels")
print(f"Mode:   {img.mode}")  # RGB, RGBA, L, etc.
```

استدعاء `img.load()` بعد `Image.open` هو القلب الفلسفي لهذه القطعة. يقرأ `Image.open` ترويسة الملف فقط؛ ويُفك ترميز بيانات البكسلات بكسلاً عند أول استخدام، ما يعني أن الملف المقتطع قد يفشل في عمق استدعاء `save()` لاحقٍ مع خطأ مُربِك. استدعاء `.load()` داخل `try` يُجبِر فك الترميز على الحدوث *الآن*، حيث تستطيع كتلة `except` الإبلاغ عنه بوضوح. كتلة `except FileNotFoundError` المنفصلة تمنحك رسالة محددة وصادقة بأن المشكلة في اسم ملف مفقود.

**🎯 الناتج المتوقع :**

`Format: JPEG`، `Size:   480x480 pixels`، `Mode:   RGB` — وتحميل مسار غير موجود يطبع `Error: File '...' not found.` قبل التتبع الكامل للخطأ.

**🩹 إذا لم يعمل :**

إذا حصلت فقط على `Format: None`، فقد فتحت الصورة لكنك لم تصل أبدًا لبيانات البكسلات، أو حفظت صورة جديدة دون صيغة صريحة — تحميل JPEG/PNG من القرص يُبلِّغ دائمًا عن صيغة. إذا انهار ملف تالف فعلًا لاحقًا في `save()`، فـ`img.load()` ليس داخل `try`. إذا طبع النمط `RGBA` أو `L`، فهذا صحيح لمدخلاتك، لا خطأ — لاحظ فقط أن النمط المعروض يختلف حسب نوع الملف.

### 1.2 جُل في المجلد كاملًا

**👟 تلميح البداية :**

أدر حلقة أداة التحميل الآمنة على كل JPEG في المجلد واطبع سطر فحص واحدًا لكل منها، لتتأكد من أن المحفظة كاملة قابلة للتحميل قبل تعديل أي شيء.

```python
# editor.py (continued)
from pathlib import Path

for path in sorted(Path("input_photos").glob("*.jpg")):
    info = load_image(str(path))
    print(f"{path.name:12} {info.width}x{info.height} {info.mode}")
```

يُعيد `Path("input_photos").glob("*.jpg")` مُكرِّرًا من مسارات الملفات؛ ولف كل مسار بـ `str()` وتمريره إلى `load_image` يُبقي نقطة دخول واحدة ومختبرة جيدًا لفتح الملفات. يلتقط التكرار هنا أيضًا نمط فشل على مستوى المجلد بكامله مبكرًا: إذا كانت صورة واحدة تالفة، تجدها في تقرير من ثلاثة أسطر بدلًا من منتصف دفعة من ثلاثمئة ملف.

**🎯 الناتج المتوقع :**

ثلاثة أسطر — `photo1.jpg    480x480 RGB`، `photo2.jpg    480x480 RGB`، `photo3.jpg    480x480 RGB`.

**🩹 إذا لم يعمل :**

إذا لم تطابق أي ملفات، فأنت تبحث في الدليل الخطأ أو أن الفلتر `*.png` بينما كتب الإعداد `.jpg`. إذا رفع سطر واحد خطأً، فذلك الملف المحدد تالف أو غير قابل للقراءة — امتداد `.jpg` مزيف على ملف نصي يعيد إنتاج هذا تمامًا.

### 1.3 تحقّق

**✅ قائمة التحقق**

- ✅ تُعيد `load_image("input_photos/photo1.jpg")` صورةً وتطبع صيغتها وأبعادها ونمطها الحقيقيين.
- ✅ المسار المفقود يصل إلى فرع `FileNotFoundError` مع الرسالة الواضحة.
- ✅ حلقة المجلد تطبع الصور الثلاث دون تتبع للخطأ.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يوجد `img.load()` لأن `Image.open` كسول. ما الفشل المحدد — وفي أي نقطة من البرنامج — الذي يصير تشخيصه أصعب بكثير إذا تخطيت `load()` وتركت فك الترميز يحدث داخل `save()` لاحق؟
- نفس دالة `load_image` تخدم حالتي الصورة الواحدة وحلقة المجلد. ماذا سيتغير في معالجة الأخطاء إذا أردت تحميلًا *دفعيًا* يجمع الفشل ويواصل، بدلًا من الرفع عند أول ملف تالف؟

## الخطوة 2: طبِّق الفلاتر والتحسينات

تشحن Pillow عائلتين من التعديلات: `ImageFilter` التي تحوّل البكسلات (تمويه، حدة، كشف الحواف)، و`ImageEnhance` التي تقيس جوانب الصورة (سطوع، تباين، لون). تلُف هذه الخطوة الاثنتين في دالة واحدة توزّع بالاسم، وتسلصل تأثيرين معًا إلى صورة نهائية.

### 2.1 ابنِ جدول توزيع الفلاتر

**👟 تلميح البداية :**

ضع تعيين الاسم → العملية في `dict` قيمها دوال استدعاء مصغرة، فإضافة فلتر لاحقًا تعني إضافة سطر واحد، لا فرع `if` آخر.

```python
# editor.py (continued)
def apply_filter(img: Image.Image, filter_name: str, **kwargs) -> Image.Image:
    """Apply a named filter to an image, returning a new image."""
    filters = {
        "blur": lambda: img.filter(ImageFilter.GaussianBlur(radius=kwargs.get("radius", 5))),
        "sharpen": lambda: img.filter(ImageFilter.SHARPEN),
        "edge": lambda: img.filter(ImageFilter.FIND_EDGES),
        "emboss": lambda: img.filter(ImageFilter.EMBOSS),
        "brightness": lambda: ImageEnhance.Brightness(img).enhance(kwargs.get("factor", 1.5)),
        "contrast": lambda: ImageEnhance.Contrast(img).enhance(kwargs.get("factor", 1.5)),
        "saturation": lambda: ImageEnhance.Color(img).enhance(kwargs.get("factor", 2.0)),
    }
    if filter_name not in filters:
        raise ValueError(f"Unknown filter: {filter_name}. Available: {', '.join(filters)}")
    return filters[filter_name]()
```

قاموس اللامدات هو **جدول توزيع**: المفتاح *هو* الفرع، فيحل البحث `filters[filter_name]()` محل سلسلة `if/elif` طويلة. الأسماء المجهولة تفشل بصوت عالٍ (`ValueError`) بدلًا من إعادة الصورة كما هي صامتة، وهذا ما يجعل الأخطاء المطبعية مرئية في المعالجة الدفعية. كل تحسين يلُف *الصورة الحالية* و`.enhance(factor)` يضرب تلك الخاصية — عامل فوق `1.0` يقوّيها، ودون `1.0` يُضعفها.

**🎯 الناتج المتوقع :**

تُعيد `apply_filter(img, "blur", radius=8)` صورةً أكثر نعومة؛ وتُعيد `apply_filter(img, "edge")` صورةً شبه سوداء بخطوط ساطعة. وترفع `apply_filter(img, "nope")` خطأ `ValueError: Unknown filter: nope. Available: blur, sharpen, edge, emboss, brightness, contrast, saturation`.

**🩹 إذا لم يعمل :**

إذا لم يُعثر على `GaussianBlur`، فاستوردت `ImageEnhance` فقط في هذه القطعة — يجب أن يكون `ImageFilter` في سطر `from PIL import ...` نفسه (أو يُضاف إليه). إذا بدت نتيجة «الحواف» كالأصل، فأنت تعيد استخدام أصل قابل للعرض بدلًا من الصورة *المُرجعة* — أعد التعيين دائمًا `img = apply_filter(img, ...)` في سلسلة.

### 2.2 اربط تأثيرين واحفظ

**👟 تلميح البداية :**

طبّق رفعة سطوع، ثم أحِدّ *الناتج*، واحفظ بإعداد جودة JPEG — مُثبِتًا أن الفلاتر تركّب عندما يُعيد كلٌّ منها صورة.

```python
# editor.py (continued)
bright = apply_filter(img, "brightness", factor=1.3)
sharp = apply_filter(bright, "sharpen")
sharp.save("enhanced.jpg", quality=95)
print("Saved enhanced.jpg")
```

يعمل التسلسل لأن كل فلتر يُعيد صورةً جديدة بدلًا من تحوير المدخل — يقرأ `sharp = apply_filter(bright, ...)` *الناتج السابق* كمدخله. وسيطة `quality=95` على `save()` مهمة لـ JPEG تحديدًا: إنها تقايض حجم الملف بالدقة، وبخلاف PNG (بلا فقدان، بلا مقبض جودة)، اختيار قيمة سليمة جزء من إنتاج مخرجات مقبولة.

**🎯 الناتج المتوقع :**

`Saved enhanced.jpg`، والملف الجديد أشد سطوعًا وحدّةً بصريًا من `photo1.jpg` عند فتحه.

**🩹 إذا لم يعمل :**

إذا بدت الصورة المحفوظة مطابقة للمصدر، فقد مررت `img` للاستدعاءين معًا بدلًا من تمرير `bright` إلى الثاني. إذا رفع `save` خطأً بشأن النمط، فالصورة المصدر ليست RGB (إنها `L` أو `RGBA`) — يقبل JPEG صيغة RGB؛ حوّلها بـ `.convert("RGB")` أولًا.

### 2.3 تحقّق

**✅ قائمة التحقق**

- ✅ تُنتج `blur` و`sharpen` و`edge` و`emboss` و`brightness` و`contrast` و`saturation` كلُّها صورًا مختلفة بصريًا.
- ✅ اسم فلتر مجهول يرفع `ValueError` يسرد الأسماء الصالحة.
- ✅ سلسلة التأثيرين حفظت `enhanced.jpg`.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- لامدات قاموس التوزيع كلُّها تلتقط `img` من النطاق المحيط. إذا استدعيت `apply_filter` دون صورةً ومررت لاحقًا لامدا تشير إلى `img`، متى يظهر الخطأ — وماذا يخبرك ذلك عن مدى استعجال تقييم قاموس اللامدات؟
- كلا من `brightness` و`contrast` يضعان افتراضيًا `factor=1.5`. لماذا العامل `1.0` هو القيمة «المحايدة» لـ `ImageEnhance` — وكيف يختلف ذلك عمّا يفعله مفاهيميًا فلتر مثل `FIND_EDGES` (الذي لا يحمل عاملًا أصلًا)؟

## الخطوة 3: أعد التحجيم والقص دون تشويه

تمديد صورة لتلائم عرضًا يُنتج المظهر الكلاسيكي للصورة المعصورة؛ إعادة التحجيم النسبي لا تفعل ذلك. تبني هذه الخطوة تحجيمًا يحافظ على نسبة الأبعاد وقصًّا يلتقط مركز الصورة — العمليتان خلف كل صورة مصغّرة وكل بطل موقع.

### 3.1 أعد التحجيم مع الحفاظ على نسبة الأبعاد

**👟 تلميح البداية :**

احسب النسبة بين العرض المستهدف والعرض الحالي، وطبّقها على الارتفاع، ومرر الحجم الجديد كاملًا إلى `resize` مع فلتر إعادة أخذ عينات عالي الجودة.

```python
# editor.py (continued)
def resize_keep_ratio(img: Image.Image, max_width: int) -> Image.Image:
    """Resize to max_width, keeping the aspect ratio."""
    ratio = max_width / img.width
    new_height = int(img.height * ratio)
    return img.resize((max_width, new_height), Image.LANCZOS)

small = resize_keep_ratio(load_image("input_photos/photo1.jpg"), 640)
print(f"resized -> {small.size}")
```

الفكرة كلها تسكن في خطوة حسابية واحدة: `ratio = max_width / img.width` يعطيك المقياس، وضرب الارتفاع بتلك النسبة نفسها يضمن انكماش العرض والارتفاع معًا — دون تشويه. `Image.LANCZOS` يطلب أفضل فلتر اختزال لدى Pillow، وهو الأمر الأهم عند التصغير (فهو ينعّم الحواف المسنّنة). هذه هي الوصفة القياسية عديمة الأبعاد «التلاؤم داخل عرض» التي يستخدمها كل مُولِّد صور مصغّرة.

**🎯 الناتج المتوقع :**

`resized -> (640, 640)` — صورة الاختبار 480×480 تُقيَّس إلى عرض 640 مع ارتفاع 640، والنسبة سليمة (جرّبها على الأصل وتحقّق أن `height/width` لم يتغير).

**🩹 إذا لم يعمل :**

إذا كانت النتيجة بنسبة مختلفة عن المصدر، فلم يُحسب `new_height` من `img.height * ratio`. إذا حصلت على `AttributeError: 'Image' object has no attribute 'resize'`، فالكائن المُمرَّر ليس صورة Pillow — مرر ناتج `load_image(...)` مباشرة إلى هذه الدالة. إذا أخطأ `Image.LANCZOS` في إصدارات Pillow قديمة جدًا، فحدّث Pillow (الثابت اسم مستعار قديم).

### 3.2 اقصُ المربع المركزي

**👟 تلميح البداية :**

لطول ضلع مطلوب، احسب الصندوق المتمركز على الصورة، ثم أعطِ الصف الرابع (tuple) ذاك إلى `crop` — القص لا يعيد التحجيم أبدًا، إنه يقتطع فقط.

```python
# editor.py (continued)
def crop_center_square(img: Image.Image, side: int) -> Image.Image:
    """Crop the center square of `side` pixels from the middle of an image."""
    left = (img.width - side) // 2
    top = (img.height - side) // 2
    return img.crop((left, top, left + side, top + side))

thumb = crop_center_square(load_image("input_photos/photo1.jpg"), 240)
thumb.save("thumb.jpg", quality=95)
print(f"thumb -> {thumb.size}")
```

يأخذ `crop` صندوقًا `(left, top, right, bottom)` ويُعيد القطعة، محافظًا على دقة البكسلات نفسها داخلها — لذا صورة مصغّرة مصنوعة هكذا تكون *حادّة*: تقصّ المنتصف *ثم* تصغّر إن أردت مربعًا صغيرًا. القسمة الصحيحة `// 2` تتمركز للنافذة عبر توزيع أي فائض فردي بالتساوي. نمط «اعثر على الصندوق، أبقِه مربعًا» هذا هو سلوك قص الصور الرمزية الافتراضي في معظم التطبيقات.

**🎯 الناتج المتوقع :**

`thumb -> (240, 240)`، محفوظة باسم `thumb.jpg`، تصوّر وسط الأصل بدلًا من زاويته العليا اليسرى.

**🩹 إذا لم يعمل :**

إذا لم يكن القص متمركزًا، فأحد `left`/`top` يستخدم قسمة `/` عائمة مفردة، منتجًا إحداثيات كسرية. إذا تجاوز `side` بُعد الصورة، يصبح `left` سالبًا وتتجاوز نافذة القص الصورة — احمِ بتثبيت `side = min(side, img.width, img.height)`. إذا كانت الصورة المصغّرة شريحة صغيرة، فحسابات الصندوق معكوسة (`left + side` مقابل `left - side`).

### 3.3 تحقّق

**✅ قائمة التحقق**

- ✅ يحافظ `resize_keep_ratio(img, 640)` على نسبة الأبعاد (الارتفاع/العرض دون تغيير).
- ✅ يُعيد `crop_center_square(img, 240)` شريحة مركزية مركّزة 240×240.
- ✅ النتيجتان تُحفظان بنجاح.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يقرّب `resize_keep_ratio` `new_height` بـ `int()`. لمستطيل ارتفاعه المقاس الحقيقي كسري، هل ينتج التقريب بعد القص أو التحجيم خطأ نسبة من بكسل واحد يومًا ما — ومتى (إن حدث) يهم بكسل واحد من التشويه عمليًا؟
- القص المركزي ثم الاختزال طريقة واحدة لصنع صورة مصغّرة. كيف سيختلف *الناتج البصري* لو صغّرت أولًا وقصّصت ثانيًا — ولماذا تقص أنظمة الصور الرمزية الحقيقية قبل التحجيم بدلًا من ذاك؟

## الخطوة 4: أضف علامات مائية

العلامة المائية علامة تجارية (أو حماية حقوق) يجب أن تجلس بوضوح فوق الصورة دون إخفائها. الحيلة في Pillow أن الرسم على الصورة *الأصلية* لا يمكنه إنتاج شفافية جزئية على لوحة RGB — لذلك ترسم على طبقة تراكب RGBA منفصلة وتُركّبها.

### 4.1 أضف علامة مائية نصية شفافة

**👟 تلميح البداية :**

انسخ الصورة إلى RGBA، وابنِ طبقة تراكب شفافة تمامًا بنفس الحجم، وارسم نصًا أبيض بشفافية 50% على الطبقة، ثم `alpha_composite` بين الاثنين وأعد التسطيح إلى RGB للحفظ.

```python
# editor.py (continued)
from PIL import ImageDraw, ImageFont

def add_text_watermark(img: Image.Image, text: str, position: str = "bottom-right") -> Image.Image:
    """Add a semi-transparent text watermark and flatten to RGB."""
    watermarked = img.copy().convert("RGBA")
    overlay = Image.new("RGBA", watermarked.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(overlay)

    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
    except (IOError, OSError):
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    margin = 20

    positions = {
        "bottom-right": (img.width - text_w - margin, img.height - text_h - margin),
        "bottom-left": (margin, img.height - text_h - margin),
        "top-right": (img.width - text_w - margin, margin),
        "center": ((img.width - text_w) // 2, (img.height - text_h) // 2),
    }
    x, y = positions.get(position, positions["bottom-right"])
    draw.text((x, y), text, fill=(255, 255, 255, 128), font=font)

    return Image.alpha_composite(watermarked, overlay).convert("RGB")

watermarked = add_text_watermark(load_image("input_photos/photo2.jpg"), "My Photo 2026", "bottom-right")
watermarked.save("watermarked.jpg", quality=95)
print("Saved watermarked.jpg")
```

قيمة ألفا في `fill=(255, 255, 255, 128)` هي النتيجة: `128` على مقياس RGBA من 0–255 هي عتامة 50% بالضبط. رسم ذلك النص الأبيض النصف شفاف على *طبقة تراكب منفصلة*، ثم استدعاء `alpha_composite(watermarked, overlay)`، هو ما يُبقي الصورة تحته دون مساس بينما يظهر النص — فالرسم مباشرةً على صورة RGB كان سيضطر إلى استبدال البكسلات كليًا. `.convert("RGB")` في النهاية يسطّح ألفا بعيدًا حتى يقبل مُرمِّز JPEG (الذي لا يخزن شفافية) الملف.

**🎯 الناتج المتوقع :**

`Saved watermarked.jpg` — الصورة مع `My Photo 2026` طافيةً بعتامة 50% في الأسفل الأيمن، بهامش متمركز بعيدًا عن الحواف بمقدار 20 بكسل.

**🩹 إذا لم يعمل :**

إذا كان النص مصمتًا تمامًا، فقناة الألفا `255` (أو أن `.convert("RGB")` جرى *قبل* التركيب، ليسطّح الشفافية بعيدًا). إذا جلس النص خارج اللوحة جزئيًا، فقيم `text_w`/`text_h` تأتي من `bbox` قديم ولا تطابق الخط المستخدم فعلًا. إذا بدا خط الاحتياطي الافتراضي كضبابية بكسل واحد، فمسار DejaVu غير موجود على نظامك — وجّه `truetype` إلى ملف خط موجود، أو استخدم `load_default(size=...)` على Pillow 10+.

### 4.2 تراكب شعار صوري

**👟 تلميح البداية :**

أعد استخدام الصورة المصغّرة من الخطوة 3 كشعار، وقِسها إلى كسر من عرض الصورة، و`paste` مع قناة الألفا الخاصة بها كقناع حفاظًا على شفافيتها.

```python
# editor.py (continued)
def add_image_watermark(img: Image.Image, logo: Image.Image, scale: float = 0.15, margin: int = 16) -> Image.Image:
    """Paste a scaled logo into the bottom-right corner, keeping its alpha."""
    base = img.convert("RGBA")
    logo_rgba = logo.convert("RGBA")
    new_w = max(1, int(base.width * scale))
    ratio = new_w / logo_rgba.width
    logo_rgba = logo_rgba.resize((new_w, int(logo_rgba.height * ratio)), Image.LANCZOS)
    x = base.width - logo_rgba.width - margin
    y = base.height - logo_rgba.height - margin
    base.paste(logo_rgba, (x, y), logo_rgba)  # third arg = alpha mask
    return base.convert("RGB")

logo = load_image("thumb.jpg")
with_logo = add_image_watermark(load_image("input_photos/photo3.jpg"), logo)
with_logo.save("logo_watermark.jpg", quality=95)
print("Saved logo_watermark.jpg")
```

`paste` مع الصورة المُمرَّرة *كقناعها الخاص* هو السطر الدقيق: `base.paste(logo_rgba, (x, y), logo_rgba)` يلصق البكسلات، والسيطة الثالثة — قناة ألفا الصورة نفسها — تقرر بكسلًا بكسل مدى ظهور الشعار. شعار RGBA ملصوق دون قناع سيلقي مستطيله المشغول؛ ومع قناع، تنجو شفافيته. `scale=0.15` يقيس الشعار نسبةً للصورة، لذا الدالة نفسها تعمل على ملف اختبار 480 بكسل وعلى تصدير DSLR بسعة 6000 بكسل.

**🎯 الناتج المتوقع :**

`Saved logo_watermark.jpg` — يظهر `thumb.jpg` في الأسفل الأيمن من `photo3.jpg` بحوالي 15% من عرض الصورة، دون أن تُظهر زواياه صندوقًا صلبًا.

**🩹 إذا لم يعمل :**

إذا كان للشعار صندوق إحاطة مشغولًا قبيحًا، فوسيطة القناع (وسيطة `paste` الثالثة) مفقودة. إذا كان الشعار عملاقًا أو مجهريًا، فـ`new_w` يستخدم عرض المصدر بدلًا من `base.width * scale`. إذا لم يفعل اللصق شيئًا بصمت، فالشعار المصدر حُمِّل كصورة *كسولة* — استدعِ `.load()` أو أشر إلى البكسلات قبل اللصق.

### 4.3 تحقّق

**✅ قائمة التحقق**

- ✅ العلامة المائية النصية تُحفظ كـ JPEG بعتامة 50% تقريبًا في المواضع الأربعة المسمّاة.
- ✅ الشعار الملصوق مع قناع ألفا يحافظ على زوايا شفافة.
- ✅ كلا الناتجين يُفتحان بنظافة ومحتوى الصورة ما يزال ظاهرًا تحت العلامة المائية.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- `fill=(255, 255, 255, 128)` نصف شفاف. ماذا يحدث نصيًا إذا رسمت على صورة RGB الأصلية بالصف الرباعي نفسه بدلًا من طبقة تراكب RGBA — لماذا لا يمكن للوحة RGB تمثيل «نصف موجود» أصلًا؟
- الطبقة طبقة تراكب منفصلة شفافة تمامًا بنفس حجم الصورة. لماذا هذا التصميم ثنائي الطبقات بدلًا من رسم النص مرةً واحدة وحفظه؟ وماذا ستحتاج إلى تغييره لاحقًا لإعادة وضع علامة مائية دون إعادة رسم الصورة أسفلها؟

## الخطوة 5: عالِج مجلدًا دفعة واحدة

المغزى الكامل من مجموعة الأدوات هو الكم: الخطوات الخمس نفسها، مطبقة على كل صورة في مجلد، دون فتح كل واحدة يدويًا. تبني هذه الخطوة الحلقة التي تحول دوالك إلى معالج مجلدات بأمر واحد.

### 5.1 عالِج كل صورة في مجلد

**👟 تلميح البداية :**

اجمع ملفات الصور بالامتداد، وأنشئ مجلد إخراج، وشغّل سلسلة الفلاتر لكل ملف مع التقاط الأخطاء *لكل ملف* حتى لا توقف صورة سيئة واحدة الدفعة أبدًا.

```python
# editor.py (continued)
def batch_process(input_dir: str, output_dir: str, operations: list[dict]) -> None:
    """Apply a chain of named filter operations to every image in a directory."""
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    extensions = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff"}
    files = [f for f in Path(input_dir).iterdir() if f.suffix.lower() in extensions]

    print(f"Processing {len(files)} images...")
    for filepath in files:
        try:
            img = load_image(str(filepath))
            for op in operations:
                img = apply_filter(img, op["filter"], **op.get("params", {}))
            out_name = f"processed_{filepath.stem}.jpg"
            img.save(out / out_name, quality=90)
            print(f"  OK {filepath.name} -> {out_name}")
        except Exception as e:
            print(f"  SKIP {filepath.name}: {e}")

batch_process("input_photos", "output", [
    {"filter": "brightness", "params": {"factor": 1.2}},
    {"filter": "contrast", "params": {"factor": 1.1}},
    {"filter": "sharpen"},
])
```

التصميم الذي يجعل الدفعة جديرة بالثقة هو `try/except` الداخلي *داخل* الحلقة: ملف تالف، نمط خاطئ، أي فشل لكل ملف يطبع `SKIP photo2.jpg: ...` وتستمر الحلقة — صورة سيئة واحدة لا تقتل المئتين الآخرين. `operations` قائمة قواميس صغيرة تُعيد استخدام توزيع `apply_filter` نفسه من الخطوة 2، لذا خط المعالجة الدفعية ومسار الصورة الواحدة التفاعلي يتشاركان الدلالات نفسها. مجموعة الامتدادات مع `suffix.lower()` تحترم حالة الأحرف (`JPG` مقابل `jpg`) وتتخطى الملفات غير الصورية الشاردة.

**🎯 الناتج المتوقع :**

`Processing 3 images...` ثم سطر `OK photoN.jpg -> processed_photoN.jpg` واحد لكل ملف، ومجلد `output/` يضم ثلاثة JPEG مُعالجة.

**🩹 إذا لم يعمل :**

إذا لم يُعالَج شيء، فمجلد الإخراج موجود لكن مسار الإدخال خاطئ أو فلتر الامتداد يستثني ملفاتك. إذا توقفت الدفعة عند أول خطأ، فـ`try/except` ملفوف حول الحلقة كاملة بدلًا من ملف واحد. إذا كان كل ناتج نسخة الفلتر الافتراضية بغض النظر عن `params`، ففك التعبئة `**op.get("params", {})` مفقود من استدعاء `apply_filter`.

### 5.2 تحقّق

**✅ قائمة التحقق**

- ✅ كل الصور الثلاث في `input_photos/` تُكتب إلى `output/` كـ `processed_*.jpg`.
- ✅ ملف مكسور عمدًا في المجلد يسبب سطر `SKIP` لكنه لا يوقف البقية.
- ✅ الدفعة تستخدم قاموس `apply_filter` نفسه كالخطوات التفاعلية.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تحفظ الدفعة كل نتيجة كـ JPEG. ماذا ستحتاج إلى تغييره لـ*الحفاظ* على صيغة المصدر (PNG تبقى PNG، وWebP تبقى WebP) — وماذا يمنحك `filepath.suffix` مجانًا هنا؟
- يطبع `SKIP` ويستمر عند أي استثناء — غير مشروط. متى يكون الابتلاع-والمتابعة الخيار *الخاطئ*، وأي نوع من العدّادات (أو الإيقاف بعد N) يسمح للدفعة بإظهار مشكلة منظومية بدلًا من إخفائها؟

## ⚠️ مآزق شائعة

- **حفظ RGBA كـ JPEG.** لا يملك JPEG قناة ألفا، لذا صورة موسومة المياه (RGBA) تفشل أو تُسطَّح بلا قابلية للتنبؤ. الحل: `.convert("RGB")` قبل أي `save()` من نوع JPEG — كلمتا العلامة المائية أعلاه تفعلان هذا عمدًا.
- **نسيان `ImageFilter` في الاستيراد.** يعمل `from PIL import Image, ImageEnhance` على ما يرام حتى يُرفع `ImageFilter.GaussianBlur` خطأ `AttributeError` في عمق استدعاء فلتر. الحل: سطر استيراد واحد للثلاثة معًا (`Image` و`ImageFilter` و`ImageEnhance`) — الإعداد يفعلها، فأبقِها كذلك.
- **مسارات خطوط خاصة بالمنصة.** مسار DejaVu موقع معروف في Linux؛ على macOS أو Windows يرفع `truetype` خطأً وتتراجع إلى خط افتراضي صغير. الحل: لف البحث في `try/except` (كما هو معروض)، أو اقبل وسيطة مسار خط حتى يمرر المستدعون خطهم الخاص.
- **عدم إعادة تعيين النتائج المتسلسلة.** `apply_filter(bright, "sharpen")` يُعيد صورةً جديدة؛ وتجاهل القيمة المُرجعة وحفظ المتغير الوسيط يُلغي نصف السلسلة بصمت. الحل: اكتب دائمًا `img = apply_filter(img, ...)` أو أطعم الناتج السابق مباشرةً إلى الاستدعاء التالي.
- **ملف سيئ واحد يقتل دفعة.** حلقة غير محمية تحول JPEG تالفًا واحدًا إلى صفر مخرجات. الحل: أبقِ `try/except` *داخل* الحلقة (الخطوة 5)، وفكّر في تسجيل الملفات التي تخطيتها لتفحصها لاحقًا.

## ما بنيته للتو

مجموعة معالجة صور حقيقية: تحمّل الصور وتفحصها بأمان، وتطبق سبعة تأثيرات فلتر/تحسين عبر جدول توزيع واحد، وتعيد التحجيم والقص دون تشويه، وتُطبق طبقات العلامات المائية النصية والصورة الشفافة، وتشغّل السلسلة كاملة عبر مجلد تلقائيًا. المهارة القابلة للنقل هي *تصميم سلسلة الـtransform*: كل عملية تأخذ صورةً وتُعيد صورة، فتستخدم التعديلات المفردة والدفعات من ألف ملف نفس اللبنات المتطابقة — نمط التركيب نفسه خلف كل مكتبة صور، من الصور المصغّرة إلى مجموعات التحرير الكاملة.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/image-editor/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/image-editor) في مستودع الدورة يَشحن السكربت الكامل إضافةً إلى محوّل صيغ وأداة مقارنة جنبًا إلى جنب. استنسخه، أو افتح المستودع كاملًا في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وشغّله من هناك.
:::

## إلى أين تذهب من هنا

- ابنِ **محوّل الصيغ**: دالة تأخذ مسار مصدر وسلسلة صيغة هدف (`"webp"`، `"png"`) وتحفظ بالامتداد الصحيح — إضافة من ستة أسطر تحوّل مجلدك كاملًا إلى WebP في تمريرة واحدة. التلميح الصغير: `img.save(path.with_suffix("." + target))` يعمل عادةً.
- اصنع **أداة مقارنة جنبًا إلى جنب** تضع صورتي قبل وبعد بجانب بعضهما مع خط فاصل — أنشئ لوحة جديدة بـ `Image.new`، ثم `paste` الصورتين عليها في النصفين.
- استخرج **بيانات EXIF الوصفية** (الكاميرا، GPS، الطابع الزمني) من صور الذكية JPEG بـ `img.getexif()` — قوة خارقة للقراءة فقط تعيد استخدام دالة `load_image` كما هي دون تغيير.
- أضف **نماذج قص بنسب أبعاد** — `crop_center_square` يعمّم بالفعل على قصّات «الغطاء» للوحات 16:9؛ عمّم حساب الصندوق مرة واحدة وكل مقاس يصبح استدعاء دالة واحدًا.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في جعل الحواسيب ترى الصور. 🎓