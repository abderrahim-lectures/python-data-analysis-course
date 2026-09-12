---
title: "مولّد لوحة الألوان"
description: "أنشئ لوحة ألوان متناغمة من ألوان أساسية مع فحص تباين إمكانية الوصول."
difficulty: "beginner"
estimatedMinutes: 50
tags: ["colors", "cli", "stdlib", "design"]
prerequisites:
  - "أساسيات Python (متغيّرات، حلقات، دوال)"
learningObjectives:
  - "التحويل بين فراغات الألوان hex وRGB وHSV"
  - "توليد لوحات مكمّلة ومتشابهة وثلاثية من درجة لون أساسية"
  - "حساب نسب تباين WCAG والحكم على الامتثال AA/AAA"
  - "تصدير اللوحات كمتغيّرات CSS وJSON"
  - "لفّ الأداة كلها في واجهة سطر أوامر صغيرة"
---

# 🎨 ابنِ مولّد لوحة ألوان

اختيار ألوان تنسجم فعلًا هو الفرق بين تطبيق يبدو احترافيًا وآخر مثل سيارة المهرج، ومع ذلك "المتناغم" عادة إحساس، لا معادلة. يتبين أن الأمر أقل أهمية مما يبدو: **عجلة** الألوان تعطيك قواعد دقيقة ، تتباعد الألوان المكمّلة 180°، والثلاثية 120°، والمتشابهة المتجاورة 30°. يبني هذا المشروع أداة تطبّق تلك القواعد على *أي* لون أساسي، ثم تفحص كل مرشّح مقابل إرشادات تباين WCAG حتى لا تسلم أحدًا لوحة تختفي فيها النصوص خلف الخلفية.

هذا يفترض Python 101 ، متغيّرات، حلقات، دوال، و`print` أساسي ، لا يُشترط شيء من تحليل البيانات. إنه اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. حوّل الألوان بين hex (`#3366cc`) وRGB `(51, 102, 204)` وفراغ درجة اللون/الإشباع/القيمة HSV رحلة ذهابًا وإيابًا.
2. ولّد لوحات مكمّلة ومتشابهة وثلاثية من لون أساسي واحد.
3. احسب نسبة تباين WCAG بين أي لونين واحكم هل يجتازان AA.
4. صدّر أي لوحة كمتغيّرات CSS وكـ JSON.
5. لفّ كل شيء في CLI صغير يطبع لوحة مع تقرير تباينها من أمر واحد.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الموصى به ، يستخدم هذا المشروع مكتبة Python القياسية فقط (وحدة `colorsys`)، لذا فالإعداد ببساطة "احصل على Python ومجلد مشروع". قسم الإعداد أدناه يشرحه خطوة بخطوة.

**GitHub Codespaces** بديل بلا تثبيت: افتح [مستودع الدورة كاملًا في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython مثبّتان بالفعل) وشغّل نفس الأوامر من طرفية في تبويب متصفحك.

**Google Colab أو Kaggle Notebooks أو Binder** طريقة ممتازة *للتلاعب* بحسابات الألوان، لأنها لا تحتاج مفاتيح API أو GPU ، يوجد دفتر ملاحظات قابل للتشغيل في [`examples/color-palette/notebook.ar.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/color-palette/notebook.ar.ipynb). انقر شارة لتشغيله دون أي إعداد محلي:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/color-palette/notebook.ar.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/color-palette/notebook.ar.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcolor-palette%2Fnotebook.ar.ipynb)

كن صادقًا بشأن المفاضلة رغمًا عن ذلك: دفتر الملاحظات يشغّل *نفس* اللوحة النموذجية في كل مرة. الـ CLI المحلي هو حيث تكتب لون علامتك التجارية وتحصل على تقرير حقيقي.

## الإعداد

`uv` أداة واحدة تحل محل سلسلة "ثبّت Python، ثم pip، ثم أداة بيئة افتراضية" ، وبما أن هذا المشروع لا يحتاج أي حزم خارجية إطلاقًا، فالإعداد حقًا مجرد "احصل على Python ومجلدًا".

**macOS / Linux** (الطرفية):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

أغلق طرفيتك وأعد فتحها، ثم تأكد أنها ثُبِّتت:

```bash
uv --version
```

ثم جهّز المشروع:

```bash
uv init color-palette
cd color-palette
```

هذا كل شيء ، لا سطر `uv add`. كل ما يستورده هذا المشروع (`colorsys`، `json`، `argparse`) مدمج داخل Python نفسه، وهو ما يستحق الانتباه: كمية مدهشة من الأدوات المفيدة حقًا تحتاج صفر تبعيات، ومعرفة أين تعيش أدوات الألوان في المكتبة القياسية جزء من هذا المشروع.

**✅ قائمة التحقق**

- ✅ يطبع `uv --version` رقم إصدار.
- ✅ يوجد `color-palette/` مع `pyproject.toml`.
- ✅ ينجح `python -c "import colorsys"` دون تثبيت أي شيء.

## الخطوة 1: حوّل الألوان بين الفراغات

تعيش الألوان في عدة ترميزات. hex (`#3366cc`) وRGB `(51, 102, 204)` هما اللذان يكتبهما البشر وتقبلهما المتصفحات، لكن *لا* يسهّل أيّ منهما صناعة لوحة ، "أدر هذا اللون 30° نحو الأخضر" هراء في RGB، لكنه تغيير بسطر واحد في **HSV**، حيث درجة اللون *هي* الموضع على عجلة الألوان. لذا يرتكز المشروع كله على رحلة ذهاب وإياب: hex ← RGB ← HSV والعودة، بلا خسارة في الطريق.

### 1.1 اكتب دوال التحويل الأربع

**👟 تلميح البداية :** ضع أربع دوال صغيرة في `color_math.py` ، `hex_to_rgb`، `rgb_to_hsv`، `hsv_to_rgb`، `rgb_to_hex` ، وتحقق من كل واحدة بـ `print` في كتلة `__main__`:

```python
# color_math.py
import colorsys

def hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    """'#1a2b3c' -> (26, 43, 60). A leading '#' is optional."""
    h = hex_color.lstrip("#")
    if len(h) != 6:
        raise ValueError(f"{hex_color!r} is not a 6-digit hex color")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def rgb_to_hsv(rgb: tuple[int, int, int]) -> tuple[float, float, float]:
    """Return (hue_in_degrees, saturation, value), each rounded."""
    r, g, b = (v / 255.0 for v in rgb)
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    return round(h * 360.0, 2), round(s, 3), round(v, 3)

def hsv_to_rgb(h: float, s: float, v: float) -> tuple[int, int, int]:
    """Inverse of rgb_to_hsv: hue in degrees, s/v in [0, 1]."""
    r, g, b = colorsys.hsv_to_rgb(h / 360.0, s, v)
    return tuple(round(c * 255.0) for c in (r, g, b))

def rgb_to_hex(rgb: tuple[int, int, int]) -> str:
    return "#{:02x}{:02x}{:02x}".format(*rgb)

if __name__ == "__main__":
    print(hex_to_rgb("#3366cc"))           # (51, 102, 204)
    print(rgb_to_hsv((51, 102, 204)))      # (220.0, 0.75, 0.8)
    print(rgb_to_hex(hsv_to_rgb(220.0, 0.75, 0.8)))  # #3366cc -- round trip
```

التحويلان اللذان يستحقان انتباهك: `rgb_to_hsv` يكبّر كل قناة إلى `[0, 1]` ويسلّمها إلى `colorsys.rgb_to_hsv`، ثم يضرب درجة اللون الناتجة في `360` للحصول على الدرجات ، تعمل المكتبة القياسية بكسور دائرة الألوان افتراضيًا، والضرب في 360 هو بالضبط خطوة "معادلة واحدة، تغيير وحدة واحد". يجب أن يلغي `hsv_to_rgb` نفس التكبّر (القسمة على 360 قبل استدعاء `colorsys.hsv_to_rgb`) أو تكون كل لوحة تبنيها خاطئة بصمت.

**🎯 الناتج المتوقع :**

```
(51, 102, 204)
(220.0, 0.75, 0.8)
#3366cc
```

**🩹 إذا لم يعمل :** `ValueError` تقول "ليس لون hex من 6 أرقام" تعني أنك مرّرت اللون بـ `#` بادئ غير متوقع أو مسافات زائدة ، `lstrip("#")` يجرّد *بادئة واحدة* فقط، و`.strip()` على المدخل أولًا يصلح المسافات. إذا طبعت الرحلة `#3266cb` أو ما شابه، فدالة `hsv_to_rgb` الخاصة بك تقرّب في المكان الخاطئ ، ذلك `round(c * 255.0)` الأخير يجب أن يكون في `hsv_to_rgb`، لا في `rgb_to_hex`.

### 1.2 تحقّق من الرحلة

**✅ قائمة التحقق**

- ✅ تُرجع `hex_to_rgb("#3366cc")` القيمة `(51, 102, 204)`.
- ✅ تُرجع `rgb_to_hsv((51, 102, 204))` القيمة `(220.0, 0.75, 0.8)`.
- ✅ تحويل hex ← RGB ← HSV ← RGB ← hex يعيد اللون الأصلي بالضبط.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- في RGB، يتحول `(51, 102, 204)` إلى `(51, 102, 205)` برفع قناة واحدة. ماذا يعني هذا التغيير الصغير نفسه بمصطلحات HSV ، تغيير درجة لون أو سطوع أو كلاهما، ولماذا يجعل ذلك HSV الفراغ الصحيح لـ "ادفع هذا اللون 30°"؟
- لماذا تُرجع `rgb_to_hsv` أعدادًا عشرية مقرّبة بينما يجب على `hsv_to_rgb` تقريب أعداد صحيحة كاملة أصلًا؟ أين قد يكسر `round` عائم قطعًا ضمان الرحلة ذهابًا وإيابًا؟

## الخطوة 2: ولّد لوحات متناغمة

الآن عائد التحويل إلى HSV: تصبح قواعد اللوحة حسابًا على رقم واحد. المخططات القياسية كلها إزاحات درجة لون خالصة مع بقاء الإشباع والقيمة ثابتين ، المكمّل `hue + 180`، والثلاثي `hue`/`+120`/`+240`، والمتشابه `hue ± 30`.

### 2.1 اكتب قواعد إزاحة الدرجة وباني اللوحة

**👟 تلميح البداية :** ثلاث دوال صغيرة ، `complementary`، `analogous`، `triadic` ، كل واحدة تُرجع قائمة درجات عبر الالتفاف `% 360`، إلى جانب `build_palette`، التي تجد درجة اللون/الإشباع/القيمة للون الأساسي مرة واحدة وتطبّق القواعد الثلاث عليه:

```python
# palettes.py
from color_math import hex_to_rgb, hsv_to_rgb, rgb_to_hsv, rgb_to_hex

def complementary(base_hue: float) -> list[float]:
    return [base_hue, (base_hue + 180.0) % 360.0]

def analogous(base_hue: float, spread: float = 30.0) -> list[float]:
    return [(base_hue + offset) % 360.0 for offset in (-spread, 0.0, spread)]

def triadic(base_hue: float) -> list[float]:
    return [base_hue, (base_hue + 120.0) % 360.0, (base_hue + 240.0) % 360.0]

def build_palette(base_color: str) -> dict[str, list[str]]:
    base_hue, sat, val = rgb_to_hsv(hex_to_rgb(base_color))
    palettes = {}
    for name, hues in (
        ("complementary", complementary(base_hue)),
        ("analogous", analogous(base_hue)),
        ("triadic", triadic(base_hue)),
    ):
        palettes[name] = [rgb_to_hex(hsv_to_rgb(h, sat, val)) for h in hues]
    return palettes

if __name__ == "__main__":
    palette = build_palette("#3366cc")
    for name, colors in palette.items():
        print(f"{name}: {colors}")
```

`% 360` على كل إزاحة هو حيلة عجلة الألوان بأكملها: `hue + 180` على لون عند 250° ليس 430° (الذي لا يقبله أي فراغ لوني)، بل يلتف إلى 70°. إبقاء `sat` و`val` ثابتين بينما تتحرك درجة اللون فقط هو أيضًا خيار *تصميمي*، لا مجرد اختصار ، يضمن أن كل لون في اللوحة يتشارك نفس الحيوية والخفوت، وهو ما يجعل المخطط متماسكًا لا عشوائيًا.

**🎯 الناتج المتوقع :**

```
complementary: ['#3366cc', '#cc9933']
analogous: ['#33b3cc', '#3366cc', '#4d33cc']
triadic: ['#3366cc', '#66cc33', '#cc3366']
```

**🩹 إذا لم يعمل :** إذا كانت كل لوحة رمادية مسطحة، خرج `sat` أو `val` بالقيمة `0` من `rgb_to_hsv` ، وهذا يحدث فقط لمدخل خالٍ تمامًا من الإشباع مثل `#ffffff`، لذا تحقق من لونك الأساسي. إذا كانت الدرجات صحيحة لكن يبدو *الترتيب* مبعثرًا، تذكر أن `hsv_to_rgb` يتوقع الدرجات بينما يريد `colorsys` كسرًا ، تمرير قيمة درجات خام مثل `220.0` مباشرة إلى `colorsys.hsv_to_rgb` يفسد كل تحويل.

### 2.2 تحقّق من قواعد الدرجات

**✅ قائمة التحقق**

- ✅ تُرجع `build_palette("#3366cc")` الألوان الخمسة أعلاه، بنفس الترتيب.
- ✅ لا يختلف أي لون ولّدته عن الأساسي إلا في درجة اللون ، التشبّع والقيمة متماثلان في كل مكان.
- ✅ تغذية لون أساسي خاص بك (جرّب `#e63946`) تنتج لوحة صالحة بدلًا من الانهيار.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تستخدم قاعدة المتشابه `spread=30`. ماذا يحدث للوحة إذا رفعته إلى `spread=60` ، وأين، على عجلة الألوان، يصبح *مميزًا بصريًا* عن لوحة ثلاثية؟ ولماذا؟
- تُرجع `complementary` اللون الأساسي *ونقيضه*. إذا أراد مصمّم اللونين الجديدين فقط، فلماذا قد يكون إرجاع الأساسي معهما مع ذلك الخيار الأفضل لدالة مكتبة؟

## الخطوة 3: تحقق من تباين WCAG

يمكن أن تكون اللوحة مثالية رياضيًا وما زالت عديمة الفائدة إذا كان لون النص لا يتجاوز الخلفية. يعرّف WCAG التباين كـ *نسبة* محسوبة من الإنارة النسبية لكل لون ، قليل من حسابات غاما لكل قناة، ثم `(L_light + 0.05) / (L_dark + 0.05)`. العتبات ثابتة: 4.5:1 للنص AA العادي، و3:1 للنص الكبير، و7:1 لـ AAA.

### 3.1 اكتب الإنارة والنسبة وحكم النجاح/الفشل

**👟 تلميح البداية :** ثلاث دوال ، `relative_luminance` (تحويل غاما التقطيعي)، و`contrast_ratio` (التي يجب أن تفرز الإنارتين بحيث تُقسم الأكبر)، و`passes_wcag` مع قاموس عتبات:

```python
# contrast.py
from color_math import hex_to_rgb

def relative_luminance(rgb: tuple[int, int, int]) -> float:
    def channel(c: int) -> float:
        c /= 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (channel(v) for v in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def contrast_ratio(fg: str, bg: str) -> float:
    l1 = relative_luminance(hex_to_rgb(fg))
    l2 = relative_luminance(hex_to_rgb(bg))
    lighter, darker = max(l1, l2), min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)

def passes_wcag(ratio: float, level: str = "AA") -> bool:
    thresholds = {"AA": 4.5, "AA-large": 3.0, "AAA": 7.0, "AAA-large": 3.0}
    return ratio >= thresholds[level]

if __name__ == "__main__":
    ratio = contrast_ratio("#ffffff", "#3366cc")
    print(f"white on #3366cc: {ratio:.2f}:1")
    print("passes AA normal text:", passes_wcag(ratio, "AA"))
```

سطر الأوزان الضخمة هو معاملات `0.2126/0.7152/0.0722`: العين البشرية لا تزن الأحمر والأخضر والأزرق بالتساوي، وWCAG يرمّز ذلك. فرز `max/min` في `contrast_ratio` مهم أيضًا ، المعادلة غير متماثلة وستنتج بصمت رقمًا *خاطئًا لكن يبدو صالحًا* إذا قسمت بترتيب الاستدعاء التعسفي، لذا تطبّع الدالة دفاعيًا.

**🎯 الناتج المتوقع :**

```
white on #3366cc: 5.37:1
passes AA normal text: True
```

**🩹 إذا لم يعمل :** إذا ظل `passes_wcag` يُرجع `True` لأزواج داكن-على-داكن بشكل واضح، فـ `relative_luminance` الخاصة بك تُذييب خطوة غاما ، تحقق من `** 2.4` مقابل التفرع (`c <= 0.04045`)؛ فقود `+0.055` يفسد كل لون داكن. إذا طُبعت النسبة كـ `1.00:1` بالضبط، فكلتا الإنارتين متساويتان ، على الأرجح نسيت فرز `max/min` وقسّمت لونًا على نفسه بتمرير نفس الـ hex مرتين.

### 3.2 تحقّق من حساب التباين

**✅ قائمة التحقق**

- ✅ يطبع `contrast_ratio("#ffffff", "#3366cc")` القيمة `5.37:1`.
- ✅ يطبع `contrast_ratio("#ffffff", "#ffffff")` القيمة `1.00:1` (لون مقابل نفسه).
- ✅ يمكنك شرح لماذا سيكون `0.2196*1.0` خطأ لمدخل أبيض نقي.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يفرز `contrast_ratio` الإنارتين دفاعيًا. أين قد يحصل المتصل مع ذلك على إجابة شبيهة بـ `1.00:1` *بتصميم* لا بخطأ ، وهل تلك النسبة دائمًا علامة لوحة معطوبة؟
- يحتاج النص AAA العادي 7:1. بما أن الأبيض-على-`#3366cc` يهبط عند 5.37:1، ما الذي يجب أن يتغير في *المقدمة* للوصول إلى AAA، وماذا يفادي ذلك جماليًا؟

## الخطوة 4: صدّر اللوحات كـ CSS وJSON

لوحة لا يستطيع أحد استخدامها أكاديمية. الصيغتان اللتان تشحنان فعلًا في المنتجات هما خصائص CSS المخصصة (`--brand-1: #3366cc`) وJSON (للملفات الإعدادية وثيمات Tailwind والسكربتات). يعلّم التصدير درسًا أعمق بأن *النموذج* (قاموس عائلات ألوان مسماة) و*عروضه* (نص CSS، نص JSON) طبقتان منفصلتان ، يمكنك إضافة عشرة مصدرات أخرى دون لمس كود الألوان.

### 4.1 اكتب المصدرين

**👟 تلميح البداية :** دالتان بفكرة واحدة ، `to_css` تبني سطور `:root { --family-N: ... }` بفهم قائمة، و`to_json` تسلّم قاموس اللوحة كاملًا إلى `json.dumps` مع `indent=2`:

```python
# exporter.py
import json

def to_css(palette: dict[str, list[str]]) -> str:
    lines = [":root {"]
    for name, colors in palette.items():
        for i, color in enumerate(colors):
            lines.append(f"  --{name}-{i + 1}: {color};")
    lines.append("}")
    return "\n".join(lines)

def to_json(palette: dict[str, list[str]]) -> str:
    return json.dumps(palette, indent=2)

if __name__ == "__main__":
    from palettes import build_palette
    palette = build_palette("#3366cc")
    print(to_css(palette))
    with open("palette.json", "w") as f:
        f.write(to_json(palette))
    print("Saved palette.json")
```

التمييز بين البيانات والنص هو الفكرة التي تستحق الإمساك بها: تُرجع `build_palette` قاموسًا عاديًا، ويملك كل مصدّر *فقط* مسألة "قاموس ← نص". `f"  --{name}-{i + 1}: {color};"` عرض جميل لـ f-string يعمل عملًا حقيقيًا ، استيفاء مع إزاحة بأسلوب `enumerate` في سطر واحد. لاحظ أن جانب JSON يقوم بنفس العمل بـ *صفر* تنسيق سلاسل، وهو بالضبط سبب وجود الصيغ المنظمة.

**🎯 الناتج المتوقع :** تطبع الطرفية كتلة CSS من 16 سطرًا تبدأ بـ `:root {`، مدرجة ثلاث عائلات من متغيّرات الألوان؛ ويُكتب ملف `palette.json` يمكن لـ `json.load(open("palette.json"))` قراءته عائدًا كالقاموس الأصلي.

**🩹 إذا لم يعمل :** إذا طبعت CSS `--complementary-0` (فهرسة من الصفر)، فـ `enumerate(colors)` الخاص بك لا يضيف `+ 1` ، يتوقع مؤلفو CSS أن تبدأ العائلات من 1. إذا اختلف ملف JSON عن `palette.json` المطبوع سابقًا، تحقق أن `json.dumps(..., indent=2)` هو ما عمل عند وقت الكتابة لا التلقائي بسطر واحد.

### 4.2 تحقّق من التصدير

**✅ قائمة التحقق**

- ✅ يبدأ مخرج `to_css(palette)` بـ `:root {` وينتهي بـ `}` ويتضمن `--triadic-3: #cc3366`.
- ✅ يوجد `palette.json` ويُحمّل عائدًا كقاموس بنفس المفاتيح الثلاثة.
- ✅ لا يحتوي أي لون في أي من التصديرين على حرف كبير أو `#` ناقص.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يستهلك هنا القاموس الذي أُنشئ في الخطوة 2 *مصدّران*. ماذا يقترح ذلك عن أين كنت ستضيف صيغة ثالثة ، مثلًا إعداد Tailwind ، ولماذا لا يحتاج كود الألوان إلى التغيير لذلك؟
- لماذا يُوصف JSON بأنه يحتاج "صفر تنسيق سلاسل" بينما يحتاج CSS إلى f-string؟ ما الخاصية التي يملكها JSON ولا تملكها CSS المكتوبة بشرًا؟

## الخطوة 5: لفّها في CLI

اللمسة النهائية هي تحويل مكتبة إلى أداة يكتبها أحدهم فعلًا: `python palette.py .e63946 --bg ffffff` يطبع التقرير كاملًا. وحدة `argparse` تتولى تحليل الوسائط والافتراضات ونص `--help` المفيد مجانًا.

### 5.1 ابنِ CLI الملخّص

**👟 تلميح البداية :** دالة `summarize` واحدة تطبع كل عائلة ثم حكم التباين لكل لون فريد مقابل الخلفية المختارة، موصولة إلى `argparse` بوسيط موضعي `base` و`--bg` بقيمة افتراضية:

```python
# palette.py
import argparse

from color_math import hex_to_rgb
from contrast import contrast_ratio, passes_wcag
from palettes import build_palette

def summarize(base_color: str, background: str) -> None:
    palettes = build_palette(base_color)
    for name, colors in palettes.items():
        print(f"{name}: {' '.join(colors)}")

    print()
    print(f"Contrast vs {background}:")
    for color in sorted({c for family in palettes.values() for c in family}):
        ratio = contrast_ratio(color, background)
        verdict = "AA" if passes_wcag(ratio, "AA") else "FAIL"
        print(f"  {color}: {ratio:.2f}:1  {verdict}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Palettes + WCAG contrast from one hex color.")
    parser.add_argument("base", help="Base hex color, e.g. #3366cc")
    parser.add_argument("--bg", default="#ffffff", help="Background to check against (default: #ffffff)")
    args = parser.parse_args()
    hex_to_rgb(args.base)  # validate before doing any work
    hex_to_rgb(args.bg)
    summarize(args.base, args.bg)
```

```bash
uv run python palette.py #3366cc
```

لمستان متعمدتان: تحقق صريح بأسلوب `ValidationError` *قبل* أي توليد (تفشل سريعًا بخطأ مقروء بدلًا من انهيار في منتصف اللوحة)، وفهم مجموعة يجمع كل لون مُصدَّر مرة واحدة حتى لا يكرر تقرير التباين نفس اللون لكل عائلة يظهر فيها.

**🎯 الناتج المتوقع :** ثلاثة أسطر لوحات (`complementary:` … حتى `triadic:`)، وسطر فارغ، ثم سطر `Contrast vs #ffffff:` واحد لكل لون فريد ، كلٌّ ينتهي بـ `AA` أو `FAIL`، ومن بينها `#3366cc: 5.37:1  AA`.

**🩹 إذا لم يعمل :** إذا فشل المحلل عند كتابة اللون مع `#` الخاص به، فأنت على شِل يعامل `#` كبداية تعليق ، اقتبس الوسيطة (`"#3366cc"`) أو اترك `#` للخارج. إذا لم يزل `--bg 000000` يبلّغ معظم الألوان كـ `FAIL`، فهذا هو الجواب الصادق، لا خطأ ، داكن-على-أسود تباين منخفض *بتصميم*؛ مرّر خلفية أفتح.

### 5.2 تحقّق من الـ CLI

**✅ قائمة التحقق**

- ✅ يطبع `uv run python palette.py #3366cc` ثلاث لوحات وتقرير تباين يتضمن سطر `5.37:1  AA`.
- ✅ يسرد `uv run python palette.py --help` الوسيط الموضعي `base` وخيار `--bg`.
- ✅ يطبع hex غير صالح مثل `uv run python palette.py zzz` `ValueError` واضحًا، لا تقريرًا فارغًا صامتًا.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يزيل فهم المجموعة تكرار الألوان قبل حلقة التباين. ماذا كان سيحدث لـ *المخرج* إذا أزلته ، ولماذا الإبلاغ المكرر، لا الانهيار، هو بالضبط فئة الخطأ التي يمنعها `set` بصمت؟
- يمنحك `argparse` خيار `--bg` بقيمة افتراضية. ما الموقف الحقيقي الذي يجب أن يتصرف فيه *مستخدم لا يقدّم شيئًا* و*مستخدم يقدّم الافتراضي صراحةً* بشكل مختلف، وهل يملك هذا الـ CLI واحدًا بعد؟

## ⚠️ المآزق الشائعة

- **نِسيان أن `colorsys` يعمل بالكسور، لا بالدرجات.** يُرجع `rgb_to_hsv` درجة اللون في `[0,1)`؛ اضرب في 360 داخلًا، واقسم على 360 خارجًا. الخطأ الكلاسيكي هو الضرب في اتجاه واحد وعدم إلغائه في الآخر ، ثم تُعرض كل لوحة مبعثرة ولا يعود *أي شيء* ذهابًا وإيابًا.
- **قسمة التباين بالاتجاه الخاطئ.** تقسم معادلة WCAG الفاتح على الداكن. تجاوز فرز `max/min` ويعطيك `#ffffff` على `#000000` النسبة *الصحيحة* صدفة بينما يعيد ترتيب استدعاء معكوس رقمًا خاطئًا ما زال *يبدو* معقولًا (مثل `0.19:1`).
- **معاملة RGB كفراغ جيد لحسابات اللوحة.** "المتشابه" حساب على الدرجات؛ في RGB تخمين. إذا وجدت نفسك تطرح 30 من كل قناة "لتجعلها متطابقة"، فقد غادرت HSV ودخلت التخمين مجددًا.
- **تخطي التحقق والانهيار في منتصف التقرير.** تحقق `hex_to_rgb` من `len(h) != 6` مقدمًا يعني أن لونًا كتبت فيه خطأ يفشل كخطأ واحد واضح، لا كلوحة من `None` أو `TypeError` محيّر في عمق `colorsys`.
- **ترميز صيغة المخرج ثابتًا في باني اللوحة.** اللحظة التي تطبع فيها `build_palette` CSS نفسها، يحتاج تصدير JSON دالة مكررة. أبقِ النموذج والمصدرين منفصلين ، ذلك الفصل هو الفكرة القابلة لإعادة الاستخدام.

## ما بنيته للتو

أداة لوح حقيقية: تأخذ لونًا واحدًا، وتطبّق قواعد نظرية ألوان حقيقية لإنتاج ثلاث عائلات متناغمة، وتفحص كل نتيجة مقابل إرشادات تباين WCAG، وتصدّر متغيّرات CSS وJSON ، كل ذلك في أقل من مئة سطر من Python مكتبتها القياسية. المهارة القابلة للنقل هي *خط الأنابيب*: حوّل إلى فراغ عملي (HSV)، واعمل الحساب هناك، ثم حوّل عائدًا ، نفس الشكل الكامن خلف عمل الألوان وأنظمة الإحداثيات ومعالجة المناطق الزمنية في كل مكان.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
لدى [`examples/color-palette/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/color-palette) في مستودع الدورة السكربتات الكاملة أعلاه، قابلة للتشغيل من البداية للنهاية. أو افتح المستودع كاملًا في [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) وشغّلها من هناك.
:::

## إلى أين تذهب من هنا

- أضف علمًا `--levels` يفحص كل لون لوحة مقابل **كل** مستوى WCAG (AA، AA-large، AAA) ويعلّق على التقرير ، لديك قاموس العتبات بالفعل، هذا حلقة واحدة.
- ولّد *درجات* لون أساسي (نفس درجة اللون، قيمة متناقصة) حتى تصل اللوحة مع حالات التحويم والحدود والتعطيل ، أعد استخدام `hsv_to_rgb` مع باني الخطوة 2.
- صدّر إلى إعداد مسطّح **متوافق مع Tailwind** أو جدول ألوان Markdown ، ستكتشف كم من المصدر الجديد مجرد اختيار سلاسل.
- أضف محاكاة عمى الألوان: حوّل كل لون إلى فراغ تقريبي protanopia/deuteranopia وعلّم اللوحات التي يصبح فيها مدخلان غير قابلين للتمييز.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها ، وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓