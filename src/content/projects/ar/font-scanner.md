---
title: "أداة إقران الخطوط"
description: "ابحث عن إقرانات خطوط متناغمة مع عرض معايير وبدائل آمنة للويب."
difficulty: "beginner"
estimatedMinutes: 40
tags: ["fonts", "design-tools", "google-fonts", "pillow"]
prerequisites:
  - "أساسيات Python"
  - "أساسيات Pillow"
learningObjectives:
  - "مسح خطوط النظام واستخراج البيانات الوصفية باستخدام Pillow"
  - "تصنيف الخطوط حسب فئة النوع باستخدام قواعد إرشادية"
  - "تقييم وترتيب إقرانات الخطوط بناءً على التناقض وتوازن الوزن"
  - "عرض صور معاينة للخطوط تُظهر نص العنوان والجسم"
  - "توليد سلاسل بدائل CSS font-family بعناصر عامة آمنة للويب"
---

# 🛠️ 🔤 ابنِ أداة إقران الخطوط

الطباعة هي أكثر قرارات التصميم ظهورًا في أي صفحة ويب، وإقران خطّين جيدًا ، واحد للعناوين وآخر لنص الجسم ، مهارة تستند إلى عدد صغير من القواعد الملموسة: تناقض في الفئة (serif مقابل sans-serif) وتناقض في الوزن (عنوان عريض، جسم عادي). يبني هذا المشروع أداة تطبّق تلك القواعد ميكانيكيًا: تمسح ملفات الخطوط المثبّتة فعلًا على نظامك، وتصنّف كل خط، وتقيّم كل زوج ممكن، وترتّب الأفضل، وتعرض صورة معاينة تُظهر الإقران، وتصدّر سلسلة `font-family` بجاهزية إنتاج مع بدائل متعددة المنصات.

هذا يفترض Python 101 وإلمامًا أساسيًا بـ PIL/Pillow ، لا يُشترط أي شيء من تحليل البيانات. هذا اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. تمسح ملفات خطوط حقيقية على نظامك باستخدام Pillow وتستخرج اسم العائلة والوزن والأسلوب.
2. تصنّف كل خط كسيريف أو بلا سيريف أو أحادي المسافة أو عرضي.
3. تقيّم كل زوج من الخطوط وفق تناقض الفئة وتوازن الوزن، وترتّب الأفضل.
4. تعرض صورة معاينة عنوان/جسم لإقران لتؤكد النتيجة بصريًا.
5. تولّد سلاسل `font-family` في CSS ببدائل عامة آمنة للويب.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي والموصى به ، خطوة الفحص تقرأ ملفات الخطوط من مجلدات نظامك (`/usr/share/fonts` و`~/.fonts` و`/System/Library/Fonts`)، وتعتمد النتائج على ما هو مثبّت لديك.

**GitHub Codespaces** يعمل جيدًا: افتح [مستودع الدورة كاملًا في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course). تحوي صور الحاويات القائمة على Debian حفنة من خطوط DejaVu وLiberation ، أقل من سطح مكتب نموذجي، لكنها كافية لتمرين كل خطوة.

**Google Colab وKaggle Notebooks** طريقة حقيقية لتشغيل هذا ، يملك الدفتر مجموعة صغيرة من الخطوط مرفقة مع صورته المبنية على Linux. التحفظ الصادق أن فحص الخطوط سيعيد نتائج أقل من سطح مكتب ممتلئ ببيئة سطح مكتب كاملة، وهذا في الواقع *مفيد*: يتيح لك رؤية سلوك الأداة عندما تكون الخطوط متفرّقة، ولا تزال خطوة المعاينة/العرض تعمل مع أي شيء متاح. يستخدم الدفتر أدناه خطوط نظام الدفتر نفسها فيعمل كل جزء من الأداة على ملفات حقيقية. استخدمه لرؤية خط الأنابيب يعمل من طرف إلى طرف؛ وانتقل إلى `uv` محلي أو Codespace متى أردت فحصًا أكثر ثراءً.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/font-scanner/notebook.ar.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/font-scanner/notebook.ar.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Ffont-scanner%2Fnotebook.ar.ipynb)

## الإعداد

كل ما تحتاجه حزمة PyPI واحدة ، لا مفاتيح API، لا خدمات خارجية.

### ثبّت `uv`

`uv` أداة واحدة تحل محل سلسلة "ثبّت Python، ثم pip، ثم أداة بيئة افتراضية، ثم ثبّت الحزم" ، يمكنها تثبيت وإدارة إصدارات Python بنفسها، إلى جانب تبعيات مشروعك.

**macOS / Linux** (الطرفية):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

أغلق الطرفية وأعد فتحها، ثم تحقق من التثبيت:

```bash
uv --version
```

### أعد إعداد المشروع

```bash
uv init font-scanner
cd font-scanner
uv add Pillow
```

`Pillow` هي الحزمة الوحيدة التي تحتاجها ، تقرأ ملفات TrueType وOpenType، وتعرض نصًا على الصور، وتحمّل خطوطًا افتراضية للتسمية. كل شيء آخر يأتي من `pathlib` و`colorsys` في Python.

**✅ قائمة التحقق**

- ✅ يطبع `uv --version` رقم إصدار.
- ✅ يوجد مجلد `font-scanner/` مع `pyproject.toml`، وPillow مثبّتة.

## الخطوة 1: امسح خطوط نظامك

الخط مجرد ملف ، `.ttf` أو `.otf` ، يجلس في مجلد معروف. إما أن يحمّله `ImageFont.truetype(path)` من Pillow بنجاح أو يرفع خطأ، وهذا يمنحك مرشحًا طبيعيًا: كل ملف يُحمَّل دون خطأ هو خط يمكن لنظامك عرضه فعلًا. يتجول الفحص عبر المجلدات الشائعة، ويقرأ عينة بمقاس 20px (كافية للتحقق أنه حقيقي)، ويبني قائمة قواميس بالمسار واسم العائلة والوزن والأسلوب.

### 1.1 ابنِ ماسح الخطوط

**👟 تلميح البداية :** مرّر عبر `~/.fonts` و`/usr/share/fonts` و`/System/Library/Fonts` (macOS) و`C:/Windows/Fonts` (Windows)؛ ولكل ملف `.ttf`/`.otf`، جرّب `ImageFont.truetype` والتقط `OSError` للملفات التالفة أو غير القابلة للقراءة.

```python
# font_scanner.py
from pathlib import Path
from PIL import ImageFont

def scan_system_fonts(limit: int = 60) -> list[dict]:
    """Find loadable fonts in common system directories."""
    font_dirs = [
        Path.home() / ".fonts",
        Path("/usr/share/fonts"),
        Path("/System/Library/Fonts"),
        Path("C:/Windows/Fonts"),
    ]
    fonts = []
    for font_dir in font_dirs:
        if not font_dir.exists():
            continue
        for ext in ("*.ttf", "*.otf", "*.ttc"):
            for font_path in font_dir.rglob(ext):
                try:
                    _font = ImageFont.truetype(str(font_path), size=20)
                except OSError:
                    continue
                family = font_path.stem.replace("-", " ").replace("_", " ").title()
                fonts.append({
                    "path": str(font_path),
                    "family": family,
                    "weight": "bold" if any(w in family.lower() for w in ("bold", "black", "heavy")) else "regular",
                    "style": "italic" if "italic" in family.lower() else "normal",
                })
                if len(fonts) >= limit:
                    return fonts
    return fonts

fonts = scan_system_fonts()
print(f"Found {len(fonts)} fonts")
for f in fonts[:5]:
    print(f"  {f['family']} — {f['weight']}, {f['style']}")
```

سقف `limit=60` حارس عملي: تملك بعض الأنظمة آلاف ملفات الخطوط (خاصة macOS)، وتحميل كل واحد فقط لترتيب أفضل 10 إقرانات بطيء وغير ضروري. استخراج اسم العائلة ، استبدال الواصلات والشرطات السفلية بمسافات، ثم تكبير الأحرف ، تخمين إرشادي يعمل جيدًا مع أسماء الخطوط القياسية (DejaVu Sans وLiberation Serif) لكن ليس مع كل شيء؛ وهو كافٍ للتصنيف، الذي هو الخطوة التالية. يلتقط `except OSError` الملفات التي لا تستطيع Pillow تحليلها (ملفات تالفة، صيغ خطوط لا تدعمها Pillow) دون تعطيل الفحص كاملًا.

**🎯 الناتج المتوقع :** يطبع `Found N fonts` حيث يتراوح N بين 5 (حاوية متفرّقة) و60 (السقف)، يليه أول خمس عائلات خطوط مع وزنها وأسلوبها المستنتجَين.

**🩹 إذا لم يعمل :** إذا طبع `Found 0 fonts` على نظام يملك خطوطًا مثبّتة بالتأكيد، فمجلدات الخطوط غير قياسية ، أضف مسار خطوط نظامك الفعلي إلى `font_dirs`. إذا كان الفحص بطيئًا جدًا، فـ `limit` مرتفع أو أحد المجلدات ضخم ، اخفضه إلى 30 وانظر أي المجلدات يبذل الأكثر. إذا رفع `ImageFont.truetype` خطأ `OSError` مع كل ملف، فقد يكون تثبيت Pillow لديك ناقصًا ، أعد `uv add Pillow` لإعادة البناء.

### 1.2 تحقّق من الفحص

**✅ قائمة التحقق**

- ✅ `fonts` قائمة قواميس، بكل مفتاح من `path` و`family` و`weight` و`style`.
- ✅ يمكنك شرح لماذا `limit=60` سقف معقول ، ماذا يحدث إذا أزلته على Mac فيه 5,000+ خط نظام؟

**🤔 سؤال (أسئلة) سقراطي(ة)**

- اسم العائلة مشتق من اسم الملف (`font_path.stem`)، لا من البيانات الوصفية الداخلية للخط. أي نوع من عدم التطابق يُدخل هذا، وما واجهة Pillow التي ستعطيك اسم العائلة *الفعلي* المشفَّر داخل الملف؟
- ملفات `.ttc` (مجموعات TrueType) تحتوي خطوطًا متعددة في ملف واحد. كيف تتعامل `ImageFont.truetype` معها، وما المخاطرة إذا لم يكن الخط الأول في `.ttc` هو الذي تود استخدامه؟

## الخطوة 2: صنّف خطوطك حسب الفئة

تقع الخطوط في أربع عائلات عريضة ، سيريف وبلا سيريف وأحادي المسافة وعرضي ، والإقران الجيد دائمًا يضاد فئتين مختلفتين. يستخدم هذا المصنّف اسم الخط (كما استُخرج في الخطوة 1) كتخمين سريع: كلمة "Mono" في الاسم تعني دائمًا تقريبًا أحادي المسافة، و"Serif" تعني سيريف، وهكذا. ليس مثاليًا، لكنه صحيح بما يكفي غالبًا لإنتاج ترتيبات مفيدة.

### 2.1 اكتب `classify_font`

**👟 تلميح البداية :** افحص اسم العائلة بحروف صغيرة عن ضربات كلمات رئيسية بترتيب محدد ، أحادي المسافة أولًا (هو الأكثر تميزًا)، ثم السيريف، ثم العرضي، مع بلا سيريف كافتراضي اللاقط-الكل.

```python
# font_scanner.py (متابعة)
def classify_font(font_info: dict) -> str:
    """Classify a font as sans-serif, serif, monospace, or display based on its family name."""
    name = font_info["family"].lower()
    if any(kw in name for kw in ("mono", "code", "courier", "console")):
        return "monospace"
    if any(kw in name for kw in ("serif", "times", "georgia", "bodoni")):
        return "serif"
    if any(kw in name for kw in ("display", "script", "decorative")):
        return "display"
    return "sans-serif"

for f in fonts[:5]:
    print(f"  {f['family']:>30s} -> {classify_font(f)}")
```

قوائم الكلمات الرئيسية صغيرة ومتحفظة عمدًا: "Times" يلتقط Times New Roman وTimes؛ و"Georgia" يلتقط السيريف الآمن-للويب الأكثر شيوعًا. توسيع القائمة أكثر من اللازم يخاطر بإيجابيات كاذبة ، خط يُدعى "Playfair Display" يلتقطه "display" بشكل صحيح، لكن خطًا يُدعى "Open Sans" يجب *ألا* يطابق "serif" لمجرد أن السلسلة تحتويه مصادفة. السقوط إلى `sans-serif` صحيح لأن بلا سيريف هو الأكثر شيوعًا كافتراضي في الأنظمة الحديثة ، غالبية خطوط النظام التي لا تبدو واضحة كشيء آخر هي بلا سيريف.

**🎯 الناتج المتوقع :** سطر لكل خط يعرض اسم عائلته وفئته المحددة ، مثل `DejaVu Sans -> sans-serif` و`Liberation Serif -> serif` و`DejaVu Sans Mono -> monospace`.

**🩹 إذا لم يعمل :** إذا صُنّف خط تعرف أنه سيريف كبلا سيريف، فاسمه لا يحتوي أي كلمة من الكلمات الرئيسية الإرشادية ، أضف اسم الخط إلى القائمة، أو اقبل أن التصنيف القائم على الاسم له حدود (مذكورة في المآزق). إذا صُنّف خط بلا سيريف خطأً كسيريف، فتحقق من التطابق النصّي الفرعي العرضي (المعامل `in` حساس لحالة الأحرف هنا، لكن الاسم يُصغَّر أولًا).

### 2.2 تحقّق من التصنيف

**✅ قائمة التحقق**

- ✅ كل خط في `fonts` له `category` هي إحدى السلاسل الأربع المتوقعة.
- ✅ خط واحد على الأقل في الفحص صُنّف `sans-serif` ، الافتراضي الأكثر شيوعًا.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- خط يُدعى "Source Code Pro" ، ماذا يرجع المصنّف، وهل ذلك صحيح؟ وماذا عن "Source Sans Pro"؟
- ما القيد الأساسي للتصنيف القائم على الاسم، وما الذي سيتوجب على مصنّف *دقيق* فعله بدلًا من ذلك؟ (تلميح: سيتعين عليه قراءة شيء داخل ملف الخط نفسه.)

## الخطوة 3: قيّم الإقرانات ورتّبها

قاعدتا الطباعة الجوهريتان للإقران هما: (1) يجب أن ينتمي الخطان إلى فئتين *مختلفتين* (تناقض في الشكل)، و(2) يجب أن يكون أحدهما عريضًا والآخر عاديًا (تناقض في الوزن). تطبّق هذه الخطوة القاعدتين ميكانيكيًا: قيّم كل زوج، ورتّب بالمجموع، وأبرز أفضل المطابقات.

### 3.1 اكتب `score_pairing` واعثر على أفضل الإقرانات

**👟 تلميح البداية :** قيّم تناقض الفئة بـ10 (مختلفان) مقابل 3 (متطابقان)، وتوازن الوزن بـ8 (عريض + عادي) مقابل 4 (كلاهما بنفس الوزن) ، المجموع من 20.

```python
# font_scanner.py (متابعة)
def score_pairing(font_a: dict, font_b: dict) -> dict:
    """Score a font pairing based on contrast and weight-balance rules."""
    class_a = classify_font(font_a)
    class_b = classify_font(font_b)

    contrast = 10 if class_a != class_b else 3
    weight_a = 1 if font_a["weight"] == "bold" else 0
    weight_b = 1 if font_b["weight"] == "bold" else 0
    weight_balance = 8 if weight_a != weight_b else 4

    total = contrast + weight_balance
    rating = "excellent" if total >= 16 else "good" if total >= 10 else "fair"

    return {
        "font_a": font_a["family"],
        "font_b": font_b["family"],
        "class_a": class_a,
        "class_b": class_b,
        "contrast": contrast,
        "weight_balance": weight_balance,
        "total_score": total,
        "rating": rating,
    }

results = []
for i, fa in enumerate(fonts[:10]):
    for fb in fonts[i + 1:15]:
        score = score_pairing(fa, fb)
        if score["rating"] == "excellent":
            results.append(score)

results.sort(key=lambda x: x["total_score"], reverse=True)
print(f"\nTop pairings ({len(results)} excellent):")
for r in results[:3]:
    print(f"  {r['font_a']} + {r['font_b']} — {r['rating']} ({r['total_score']}/20)")
```

الحلقة المتداخلة `for i, fa in enumerate(fonts[:10]): for fb in fonts[i + 1:15]:` تحدّ فضاء البحث عمدًا ، مقارنة أول 10 خطوط بالخمسة التالية يعطي 45 زوجًا للتقييم، وهو ما يكفي لإبراز نتائج ذات معنى دون انفجار اندماجي. يضمن `results.sort(key=lambda x: x["total_score"], reverse=True)` ظهور أفضل النقاط أولًا، والفلترة إلى `rating == "excellent"` (نقاط ≥ 16) تُبقي المخرجات مركّزة على الإقرانات القوية فعلًا بدلًا من قائمة طويلة من المتوسط.

**🎯 الناتج المتوقع :** قائمة مرتبة من الإقرانات الممتازة، يطبع كل سطر اسمَي خطين، وتقييم "excellent"، ونقاطًا من 20. أفضل إقران نقاطه 18 (فئة مختلفة = 10 + توازن وزن = 8).

**🩹 إذا لم يعمل :** إذا كانت قائمة النتائج فارغة، فلا زوج نال ≥ 16 ، إما كل خطوط الفحص في فئة واحدة، أو لا يملك أحد الإقرانات أوزانًا متضادة. وسّع نطاق البحث (`fonts[:20]` بدلًا من `[:10]`). إذا سجّل إقران تعرف أنه رائع "fair" فقط، فقد أخطأ المصنّف أو تخمين الوزن مع كليهما ، تتبّع `classify_font` وعمود الوزن لكليهما.

### 3.2 تحقّق من الترتيبات

**✅ قائمة التحقق**

- ✅ الإقران الأعلى نقاطًا مجموع 18 (10 تناقض + 8 توازن وزن) ، مؤكدًا أن القاعدتين أطلقتا.
- ✅ يمكنك تسمية إقران واحد سجّل "good" لكن ليس "excellent" وشرح لماذا هبط المجموع دون 16.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- خطّان كلاهما بلا سيريف لكن أحدهما `bold` ، النتيجة 3 + 8 = 11 ("good"). ما زال دليل إقران الخطوط يسمي هذا قابلًا للاستخدام. ما تكلفة استبعاد أدواتك له من "excellent"، وكيف تغيّر العتبات إذا أردت إدراجه؟
- دالة التقييم تعامل كل تناقضات الفئات بالتساوي (serif مقابل sans-serif وmonospace مقابل display كلاهما 10). هل هذا واقعي ، أي الإقرانات تخلق فعلًا أقوى تناقض بصري، وكيف ترمّز هذا الفرق؟

## الخطوة 4: اعرض معاينة الإقران

النقاط رقم؛ والمعاينة صورة. يمكن عرض الخطوط نفسها التي رتبتها للتو كعنوان في الخط الأول وفقرة جسم في الثاني، مخطَّطة كصفحة حقيقية ، وحفظها كصورة PNG ترسلها لمصمم. هذه الخطوة هي التأكيد البصري أن التقييم أنتج فعلًا نتيجة جميلة الشكل.

### 4.1 ابنِ دالة `render_preview`

**👟 تلميح البداية :** أنشئ صورة Pillow بيضاء 800×500، وارسم العنوان بالخط الأول بمقاس 36px، وارسم فاصلًا أفقيًا، ولفّ نص الجسم يدويًا حتى لا يتجاوز عرض اللوحة.

```python
# font_scanner.py (متابعة)
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

def render_preview(heading_font_path: str, body_font_path: str,
                   heading_text: str = "The Quick Brown Fox Jumps",
                   body_text: str = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. "
                                   "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
                   output_path: str = "preview.png") -> None:
    """Render a heading + body font pairing preview image."""
    width, height = 800, 500
    img = Image.new("RGB", (width, height), "#ffffff")
    draw = ImageDraw.Draw(img)

    try:
        heading_font = ImageFont.truetype(heading_font_path, 36)
        body_font    = ImageFont.truetype(body_font_path, 18)
    except OSError as e:
        print(f"Error loading fonts: {e}")
        return

    draw.text((40, 40), heading_text, fill="#1a1a1a", font=heading_font)
    draw.line([(40, 100), (760, 100)], fill="#cccccc", width=1)

    y = 130
    line = ""
    for word in body_text.split():
        test = f"{line} {word}".strip()
        if draw.textbbox((0, 0), test, font=body_font)[2] > 720:
            draw.text((40, y), line, fill="#333333", font=body_font)
            y += 28
            line = word
        else:
            line = test
    if line:
        draw.text((40, y), line, fill="#333333", font=body_font)

    label_font = ImageFont.load_default()
    draw.text((40, height - 50), f"Heading: {Path(heading_font_path).stem}", fill="#888888", font=label_font)
    draw.text((400, height - 50), f"Body: {Path(body_font_path).stem}", fill="#888888", font=label_font)

    img.save(output_path, quality=95)
    print(f"Preview saved to {output_path}")

if len(fonts) >= 2:
    render_preview(fonts[0]["path"], fonts[1]["path"], output_path="my_pairing.png")
```

حلقة لفّ الكلمات هي الجزء الأكثر إثارة للاهتمام: تبني سطرًا كلمةً كلمة، وتختبر عرضه بـ `draw.textbbox` (الذي يرجع الصندوق المحيط)، ولا تثبّت السطر إلا حين تتجاوز الكلمة التالية 720px. هذا أبسط خوارزمية لفّ صحيحة ، نسخ أكثر تطورًا تتعامل مع الواصلات والمسافات متغيرة العرض، لكن لصورة معاينة، هذا ينتج مخرجات نظيفة وقابلة للقراءة. `label_font = ImageFont.load_default()` في الأسفل يستخدم خط نقطي مدمج بمقاس 10px من Pillow ، قبيح لكنه مضمون التحميل على كل تثبيت Pillow، وهي المقايضة الصحيحة تمامًا لتسمية صغيرة.

**🎯 الناتج المتوقع :** ملف `my_pairing.png` يعرض عنوانًا كبيرًا بالخط الأول، وفاصلًا أفقيًا رفيعًا، وفقرة جسم ملفوفة بالخط الثاني، مع تسميتين صغيرتين في الأسفل.

**🩹 إذا لم يعمل :** إذا كانت الصورة فارغة أو لم يظهر النص، فمسار ملف الخط خاطئ أو لا يدعم الخط الأحرف التي تعرضها ، جرّب خطًا مختلفًا من قائمة `fonts`. إذا تجاوز نص الجسم الحدود عموديًا، فحد لفّ الكلمات (720) أكبر من اللازم لمقاس الخط، أو النص أطول مما تحتمل لوحة بطول 500px ، قصّر نص الجسم أو ارفع ارتفاع اللوحة. إذا خرجت `render_preview` مبكرًا بخطأ `OSError`، فأحد مساري الخطّين غير صالح.

### 4.2 تحقّق من المعاينة

**✅ قائمة التحقق**

- ✅ `my_pairing.png` موجودة وتظهر خطين مختلفة بوضوح للعنوان ونص الجسم.
- ✅ نص العنوان أكبر من نص الجسم وكلاهما مقروء في مقاسيه.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تستخدم المعاينة خلفية بيضاء مع نص داكن ، اصطلاح الويب الأكثر شيوعًا. ما التغييرات التي ستجريها على `render_preview` لاختبار الإقران على خلفية داكنة (نص أبيض على `#1a1a1a`)، وأي دالة فحص تناقض من مشروع نظام التصميم ستستخدمها للتحقق؟
- يُعرض خطّا العنوان والجسم بمقاسات ثابتة (36px و18px). في صفحة ويب حقيقية، تتحكم CSS بهذه المقاسات، لا الصورة. ما الذي تخبرك به المعاينة *فعلًا* عن الإقران مما لا تخبرك به CSS وحدها؟

## الخطوة 5: ولّد سلاسل font-family في CSS

اسم خط على نظامك ليس نفسه اسم خط على نظام زائر. تُدرج سلسلة `font-family` الخط المرغوب أولًا، ثم سلسلة بدائل آمنة للويب تصير أكثر عمومية تدريجيًا ، يستخدم المتصفح أول ما يجده. هذه الخطوة تحوّل خطوطك الممسوحة والمقرونة إلى سلاسل CSS تعمل عبر المنصات.

### 5.1 ابنِ دالة `generate_css_stack`

**👟 تلميح البداية :** اربط كل فئة بعائلة البديل الآمن-للويب القياسية لها، وأرجع سلسلة مفصولة بفواصل: `'Desired Font', fallback1, fallback2, generic-category`.

```python
# font_scanner.py (متابعة)
FALLBACKS = {
    "sans-serif": "Arial, Helvetica, sans-serif",
    "serif":      "Georgia, 'Times New Roman', Times, serif",
    "monospace":  "'Courier New', Courier, monospace",
    "display":    "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif",
}

def generate_css_stack(font_family: str, category: str) -> str:
    """Build a CSS font-family stack with web-safe fallbacks."""
    generic = FALLBACKS.get(category, FALLBACKS["sans-serif"])
    return f"'{font_family}', {generic}"

print("/* Recommended font stacks */")
for r in results[:3]:
    css_heading = generate_css_stack(r["font_a"], r["class_a"])
    css_body    = generate_css_stack(r["font_b"], r["class_b"])
    print(f"h1 {{ font-family: {css_heading}; }}")
    print(f"body {{ font-family: {css_body}; }}")
    print()
```

ترتيب البدائل مهم: الخط *المحدد* أولًا، ثم ما يزداد شيوعًا تدريجيًا، وينتهي بالفئة العامة (`sans-serif`، `serif`، إلخ) كلاقط نهائي. إذا لم يجد المتصفح "DejaVu Sans" على جهاز المستخدم، فيسقط إلى Arial ثم Helvetica ثم سيريف-بلا الخط الافتراضي للمتصفح ، السلسلة تضمن أن الصفحة *دائمًا* تبدو مقبولة، حتى لو لم تبدُ مطابقة لتصميمك. الاقتباسات المفردة حول `'Courier New'` مطلوبة لأن اسم الخط يحتوي مسافة.

**🎯 الناتج المتوقع :** كتلة CSS بإعلانات `h1` و`body` لكل من أفضل ثلاثة إقرانات، يستخدم كل منها اسم الخط الممسوح يتبعه سلسلة البدائل القياسية.

**🩹 إذا لم يعمل :** إذا استخدمت CSS اسم خط يحتوي فاصلة (بعض الخطوط تملكها)، فتحتاج اقتباسات مفردة حول الاسم كاملًا ، `f"'{font_family}'"` الحالية تتعامل مع هذا بشكل صحيح، لكن إذا أعدت كتابتها دون اقتباسات فسوف تُفسَّر الفاصلة كمحدد للسلسلة. إذا لم يطابق البديل العام الفئة، فتحقق من قاموس `FALLBACKS` عن أخطاء إملائية.

### 5.2 تحقّق من سلاسل CSS

**✅ قائمة التحقق**

- ✅ كل سطر `font-family` مولَّد يبدأ باسم خط بين اقتباسات مفردة وينتهي بكلمة عامة عارية (`sans-serif` و`serif` و`monospace` أو `display`).
- ✅ يمكنك شرح لماذا الكلمة العامة دائمًا آخر السلسلة ، ماذا يحدث إذا وضعتها أولًا؟

**🤔 سؤال (أسئلة) سقراطي(ة)**

- إذا كان لدى زائر ويب خطّك بالضبط مثبّتًا لكن بإصدار مختلف (مثل DejaVu Sans v2.35 مقابل إصدارك v2.37)، فهل تتغير CSS ، وما الذي يكشفه ذلك عن حدود سلاسل الخطوط للاتساق البصري؟
- كيف تعدّل الأداة لاكتشاف متى لا يملك خطّ على نظامك بديلًا معروفًا وآمنًا للويب، واقتراح واحد؟ وما الذي قد يعنيه "معروف" في هذا السياق؟

## ⚠️ المآزق الشائعة

- **التصنيف القائم على الاسم تخمين إرشادي، لا ضمانة.** خط يُدعى "Source Sans Pro" يُصنَّف بلا سيريف بشكل صحيح، لكن خطًا يُدعى "Fira" (وهو فعلًا بلا سيريف) يُصنَّف `sans-serif` بالسقوط لا بالتعرف الإيجابي. للاستخدام الإنتاجي، اقرأ البيانات الوصفية الداخلية للخط (`font.getname()`) أو جدول `sfnt` الخاص به لتحديد الفئة الحقيقية.
- **ملفات `.ttc` قد تحمّل الوجه الخاطئ.** تحزم مجموعة TrueType خطوطًا متعددة في ملف واحد؛ يحمّل `ImageFont.truetype(path, index=0)` الأول افتراضيًا، الذي قد لا يكون الذي تريده للعناوين. لعمل الإقران، فضّل ملفات `.ttf` أو `.otf` منفردة حيث يكون الوجه غير غامض.
- **عدد الخطوط صفر على الأنظمة الأصغر.** قد لا يملك حاوية نظيفة أو جهاز افتراضي سحابي أدنى أي خطوط نظام إطلاقًا ، يرجع الماسح `[]` وتنهار كل خطوة لاحقة على قائمة فارغة. احرس بـ `if not fonts: print("No fonts found; install DejaVu or Liberation fonts.")` واخرج مبكرًا، أو وفّر خطًا بديلًا مرفقًا بالمشروع.
- **فيض المعاينة على اللوحات الصغيرة.** نص جسم أطول مما تحتمل لوحة بطول 500px سيقصّه Pillow دون تحذير. قصّر معامل `body_text` الافتراضي أو ارفع ارتفاع اللوحة ، لا تعتمد على المتصل ليخمن الطول الصحيح.
- **أوزان الخطوط المستنتجة من الأسماء غير موثوقة.** خط يُدعى "DejaVu Sans" قد يحتوي فعلًا تنويعة عريضة بمسار مختلف ، يعامله ماسحك كـ"regular" لأن "bold" ليست في اسم الملف. لرصد الوزن بدقة، جرّب تحميل الخط بوزن أثقل والتقط خطأ `OSError`، أو اقرأ جدول `name` للخط.

## ما بنيته للتو

أداة عمل لتحليل الخطوط وإقرانها: تمسح ملفات خطوط حقيقية على نظامك، وتصنّفها بالتصميم الحقيقي والفئة المستقاة من أسمائها، وتقيّم كل زوج بقاعدتين مطبعيتين ملموستين، وترتّب أفضل الإقرانات، وتعرض صورة معاينة عنوان/جسم تؤكد النتيجة بصريًا، وتولّد سلاسل `font-family` بجاهزية إنتاج مع بدائل متعددة المنصات. لا شيء هنا زائف ، مسارات الخطوط ملفات حقيقية، وصورة المعاينة تستخدم المحارف الفعلية، ومخرجات CSS صالحة للصق مباشرة في ورقة أنماط حية.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/font-scanner/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/font-scanner) في مستودع الدورة نسخة دفتر قابل للتشغيل: الفحص والتصنيف والتقييم والمعاينة كلها تُنفَّذ في تمريرة دفتر واحدة باستخدام خطوط نظام الكيرنل نفسها. استنسخه، أو افتح المستودع كاملًا في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وشغّله من هناك.
:::

## إلى أين تذهب من هنا

- **استعلم واجهة Google Fonts API**: اجلب أفضل 50 خط Google Fonts من حيث الشعبية، وصفِّ بالتصنيف الحقيقي، وأرجعها كقائمة قواميس بـ `family` و`category` و`variants` ، ومدّ الأداة إلى ما وراء الخطوط المحلية بفهرس الويب كاملًا.
- **ابنِ ورقة عينة خطوط**: لخط واحد، اعرض الأبجدية كاملة (علوية وسفلية)، والأرقام 0–9، وعلامات الترقيم الشائعة، وفقرة نص عينة بمقاسات متعددة (12 و18 و24 و36 و48px) على صورة واحدة ، التسليمات القياسية لتقييم الخطوط.
- **أضف محلل تناقض**: اعرض عينة نص أبيض على أبيض بنسب تناقض مختلفة وافحص كلًا مقابل WCAG AA (4.5:1) وAAA (7:1) باستخدام اللمعان النسبي ، وربطًا هذا المشروع برياضيات إمكانية الوصول من مولد نظام التصميم.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها ، وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في جعل Python يقرأ خطوطك. 🎓