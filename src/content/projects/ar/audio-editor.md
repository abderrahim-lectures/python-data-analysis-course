---
title: "محرر الصوت"
description: "حرر ملفات الصوت مع القص وإزالة الضوضاء وتحويل الصيغ وعرض الموجات الصوتية."
difficulty: "intermediate"
estimatedMinutes: 50
tags: ["pydub", "audio-processing", "matplotlib", "waveform", "numpy"]
prerequisites: ["أساسيات Python", "قراءة/كتابة الملفات (File I/O)"]
learningObjectives:
  - "توليف نغمة اختبار نظيفة من رياضيات العينات الخام"
  - "قص ووصال ملفات الصوت بدقة المللي ثانية"
  - "تطبيق تلاشيات وتسوية جهارة وتحويل صيغ"
  - "دمج مقاطع متعددة في مسار واحد"
  - "توليد تصويرات موجية لتحليل الصوت"
---

# 🛠️ 🎧 محرر الصوت

كل حلقة بودكاست ونغمة رنين ومؤثر صوتي في لعبة فيديو مرّ بالمسار نفسه: قصَّ أحدهم الأجزاء الجيدة, وخفتت الحواف كي لا ينقر شيء, وضبط الجهارة, وخاطَ الأجزاء معًا. تفعل الاستوديوهات المحترفة ذلك في تطبيقات ثقيلة; يبني هذا المشروع محرر صوت صغيرًا في Python يعمل عبر سطر الأوامر يفعل ذلك كله على ملفات صوت حقيقية عبر `pydub` ، قصٌّ بدقة المللي ثانية, وتلاشيات, وتسوية جهارة, وتحويل صيغ, ووصال مقاطع, وصورة موجية لترى *بالعين* بالضبط ما غيّرته.

هذا يفترض Python 101 وقراءة/كتابة ملفات أساسية ، لا شيء من تحليل البيانات مطلوب. إنه اختياري وغير مُقيَّم; راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. تثبيت `uv` وحزمة `pydub`/`numpy`/`matplotlib` و`ffmpeg` عامل كي يكون للصيغ المضغوطة مشفّر حقيقي خلفها.
2. توليف نغمة اختبار نظيفة من الصفر ، مصدر صوت مضمون مهما كانت الملفات التي تملكها.
3. قص وتلاشٍ وتسوية جهارة مقطع بدقة المللي ثانية.
4. التحويل بين WAV وMP3 وOGG ووصال مقاطع عدة في مونتاج سلس واحد.
5. عرض موجة لترى بالعين بالضبط ما فعلته تعديلاتك بالصوت.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي الموصى به ، يفوّض `pydub` ترميز MP3/OGG إلى ثنائي `ffmpeg`, وهذا هو الاعتماد الوحيد الذي لا يستطيع هذا المشروع تثبيته لك من PyPI. ستثبّت `ffmpeg` عبر مدير حزم نظامك في الإعداد; كل ما بعد ذلك يعمل من طرفيتك.

**GitHub Codespaces** يعمل جيدًا أيضًا: افتح [مستودع الدورة كله في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) ، `ffmpeg` مثبت هناك فعلًا, فكل خطوة أدناه (بما فيها تحويلات الصيغ في الخطوة 3) تعمل دون لمس النظام.

**Google Colab وKaggle Notebooks وBinder طريق حقيقي لتشغيل هذا شبه من طرف إلى طرف** ، أصدق من معظم المشاريع, لأن شيئًا هنا لا يعتمد على تاريخ git المحلي. التحفظ الصادق هو مدخل الصوت: الدفتر لا يملك أيًّا من ملفاتك الصوتية, فالدفتر أدناه *يولِّف نفس نغمة الاختبار التي* تبنيها في الخطوة 1 ويعمل بها. كما يستطيع تثبيت ثنائي `ffmpeg` لخطوة تحويل الصيغ, حتى تحويل MP3/OGG يعمل ، إنه مجرد تحويل نغمة لم يسجّلها أحد, لا مقطعًا يهمك. استخدمه لرؤية المسار كله يعمل بصفر إعداد; وانتقل إلى `uv` محلي أو Codespace حين تريد توجيهه إلى تسجيلاتك.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/audio-editor/notebook.ar.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/audio-editor/notebook.ar.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Faudio-editor%2Fnotebook.ar.ipynb)

## الإعداد

كل ما تحتاجه قبل كتابة سطر من المحرر نفسه: مجموعة أدوات Python حديثة, ومكتبات الصوت, والثنائي النظامي الوحيد الذي لا يستطيع `pydub` العيش من دونه.

### ثبّت `uv`

`uv` أداة واحدة تستبدل سلسلة «ثبّت Python, ثم ثبّت pip, ثم ثبّت أداة بيئة افتراضية, ثم ثبّت الحزم» المعتادة ، يستطيع تثبيت وإدارة إصدارات Python نفسها, جنب تبعيات مشروعك.

**macOS / Linux** (طرفية):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

أغلق طرفيتك وأعد فتحها, ثم أكّد تثبيته:

```bash
uv --version
```

### أعِدَّ المشروع

```bash
uv init audio-editor
cd audio-editor
uv add pydub numpy matplotlib
```

`pydub` هو محرر الصوت نفسه ، يحمّل ويقطع ويصدّر الصوت. يحوّل `numpy` عيّنات الصوت الخام إلى مصفوفة يمكنك تحليلها, ويرسم `matplotlib` الشكل الموجي الذي ستعرضه في الخطوة 5. تثبَّت الثلاثة من PyPI في أمر واحد.

### ثبّت `ffmpeg`

يتعامل `pydub` مع WAV غير المضغوط فقط بصورة أصلية. لحظة تصديرك MP3 أو OGG (الخطوة 3), يأمر ثنائي `ffmpeg` على نظامك:

- **macOS**: `brew install ffmpeg`
- **Ubuntu/Debian**: `sudo apt install ffmpeg`
- **Windows** (choco): `choco install ffmpeg` ، أو ثبّت البناء من ffmpeg.org وأضفه إلى PATH

أكّد أنه مرئي لصدفتك:

```bash
ffmpeg -version
```

**✅ قائمة التحقق**

- ✅ يطبع `uv --version` رقم إصدار.
- ✅ يوجد `audio-editor/` مع `pyproject.toml`, وقد ثُبّتت `pydub` و`numpy` و`matplotlib`.
- ✅ يطبع `ffmpeg -version` لافتة إصدار FFmpeg (يغتفر إن لمست WAV فقط ، ستضرب الجدار في الخطوة 3 سوى ذلك).

## الخطوة 1: ولِّد نغمة اختبار وافحصها

تبدأ معظم مشاريع الصوت بـ«حمّل ملفًا تملكه» ، وهو ما يفشل بصمت حين لا يملك المتعلم `.mp3` في متناول اليد. فيبدأ هذا المشروع بالطريقة الأخرى: ستبني *موجة جيب نظيفة* من 3 ثوانٍ من أرقام خام, ثم تفحصها كما لو كانت ملفًا مستوردًا. توليد الصوت أيضًا أسرع طريقة ممكنة لفهم ما هي العيّنة فعلًا: عدد صحيح موقّع لكل إطار, و«العلو/النغمة (pitch)» مجرد كم سرعة تذبذب ذلك العدد الصحيح.

### 1.1 ابنِ نغمة من عينات خام

**👟 تلميح البداية :** ابدأ بموجة جيب أحادية 16-بت 44.1 كيلوهرتز عند 440 هرتز (نغمة A القياسية) باستخدام وحدة `array` في المكتبة القياسية فقط, ثم لفّ البايتات الناتجة في `AudioSegment` من pydub.

```python
# audio_editor.py
import math
from array import array
from pathlib import Path

from pydub import AudioSegment

def make_test_tone(freq: float = 440.0, ms: int = 3000, gain_db: float = -12.0, sample_rate: int = 44100) -> AudioSegment:
    """A clean 16-bit sine wave: `freq` Hz, `ms` milliseconds long, at `gain_db` dB."""
    n_samples = int(ms / 1000 * sample_rate)
    raw = array("h", (int(32767 * 0.5 * math.sin(2 * math.pi * freq * t / sample_rate)) for t in range(n_samples)))
    return AudioSegment(raw.tobytes(), frame_rate=sample_rate, sample_width=2, channels=1).apply_gain(gain_db)

tone = make_test_tone()
print(f"Duration: {len(tone) / 1000:.1f} seconds")
print(f"Channels: {tone.channels} (mono)")
print(f"Sample rate: {tone.frame_rate} Hz")
print(f"Sample width: {tone.sample_width} bytes (16-bit)")
print(f"Loudness: {tone.dBFS:.1f} dBFS")
tone.export(Path("tone.wav"), format="wav")
print("Saved tone.wav")
```

كل سطر هنا يعلّم مفهومًا صوتيًا حقيقيًا. يكتب `array("h", ...)` أعدادًا صحيحة موقعة 16-بت ، البايتان (`sample_width=2`) اللذان يؤلفان كل عيّنة في ملف بجودة الأقراص المضغوطة القياسية. يحسب التعبير داخله `sin(2π·freq·t / sample_rate)`: ضرب وسيطة الجيب في `t/sample_rate` يحوّل *العيّنات* المنقضية إلى *ثوانٍ* منقضية, فمعنى 440 هرتز أن الموجة تكمل 440 دورة كاملة في الثانية. `apply_gain` يقيس الجهارة في نطاق الديسيبل, وهو كيف تتحدث الآذان (وبقية هذا المشروع) عن الصوت العالي.

**🎯 الناتج المتوقع :** يطبع `Duration: 3.0 seconds` و`Channels: 1 (mono)` و`Sample rate: 44100 Hz` و`Sample width: 2 bytes (16-bit)` وقراءة جهارة قرب **-21 dBFS** و`Saved tone.wav`.

**🩹 إذا لم يعمل :** إن رفع `apply_gain` أو استدعاء pydub آخر خطأً معتمًا, فربما لديك إصدار pydub قديم ، أعد `uv add pydub` للحصول على حديث. إن لم تكن قراءة الجهارة قرب -21 dBFS, فتذكر أن `dBFS` جهارة *RMS*: موجة جيب نصف-السعة تبلغ ذروتها -6 dBFS لكنها تقرأ أهدأ بـ3 ديسيبلات تقريبًا في المتوسط, وتحريك `-12` يزحزح القراءة كلها إلى الأسفل. إن فشل تصدير WAV, فليس ffmpeg ، WAV هو المسار الأصلي لـpydub; تحقق أن مسار الملف قابل للكتابة.

### 1.2 تحقّق من النغمة

**✅ قائمة التحقق**

- ✅ يعيد `make_test_tone()` `AudioSegment` بسعة 3.0 ث وبأحادية و44.1 كيلوهرتز و16-بت, ويوجد `tone.wav`.
- ✅ تستطيع قراءة, بكلماتك, كيف يحوّل `t / sample_rate` فهرس العيّنة إلى ثوانٍ.
- ✅ تستطيع القول لماذا يخزّن الصوت 16-بت كل عيّنة في 2 بايت.

**🤔 سؤال (أسئلة) سقراطي(ة) :**

- ماذا يتغير في النغمة لو أزلت `* 0.5` قبل `int(...)` في تعبير الجيب? (تلك طريقة سريعة للإحساس بالفرق بين «القص (clipping)» و«الصوت الهادئ».)
- لماذا مضاعفة التردد من 440 إلى 880 هرتز *نصف* فترة النغمة لكنها تُبقي المدة المتطابقة 3 ثوانٍ بالضبط؟

## الخطوة 2: اقصف, وقصر, وسوِّ المقطع

الصوت الحقيقي ليس عاليًا بشكل موحّد قط ولا يبدأ عند تقاطع-صفر مناسب أبدًا. ثلاثة تعديلات تصلح ذلك: **القص** يزيل الأجزاء التي لا تريدها, و**التلاشي** يدرّج الجهارة عند الحواف كي لا تسمع نقرة, و**التسوية** تزحزح الجهارة الكلية إلى مستوى هدف كي يجلس مقطعك باستمرار إلى جانب غيره.

### 2.1 اكتب دوال التعديل الثلاث

**👟 تلميح البداية :** اكتب دوالًا عادية ، `trim_audio(audio, start_ms, end_ms)` و`apply_fades(...)` و`normalize_volume(...)` ، كل واحدة تعيد `AudioSegment` *جديدًا*, ولا تحوّر المدخل أبدًا.

```python
# audio_editor.py (continued)
def trim_audio(audio: AudioSegment, start_ms: int, end_ms: int) -> AudioSegment:
    """Extract the segment between start_ms and end_ms, clamped to valid bounds."""
    start_ms = max(0, start_ms)
    end_ms = min(len(audio), end_ms)
    return audio[start_ms:end_ms]

def apply_fades(audio: AudioSegment, fade_in_ms: int = 1000, fade_out_ms: int = 1000) -> AudioSegment:
    """Ramp volume up over fade_in_ms and back down over fade_out_ms to avoid clicks."""
    return audio.fade_in(fade_in_ms).fade_out(fade_out_ms)

def normalize_volume(audio: AudioSegment, target_db: float = -20.0) -> AudioSegment:
    """Shift the whole clip so its average (RMS) loudness lands on target_db."""
    return audio.apply_gain(target_db - audio.dBFS)
```

تقطيع `AudioSegment` بـ`[start_ms:end_ms]` يعمل تمامًا كتقطيع قائمة, لكن الوحدات ميلي ثانية ، وبخلاف إنسان بشفرة حلاقة, يصنع Python *نسخة* دائمًا, فينجو `tone` الأصلي من كل قص. التلاشي بالمقدمة ليس زينة: شكل موجي يبدأ بسعة كاملة ينتقل من الصمت إلى الصراخ في عيّنة واحدة, فيبدو كنقرة; تلاشٍ على بضع مئات من الميلي ثانية يسمح للأذن بتتبع التغيير. التسوية طرح واحد في نطاق الديسيبل ، الديسيبلات لوغاريتمية, فـ`target_db - audio.dBFS` هو بالضبط التصحيح المطلوب (لا ضرب مطلوب, لأن إضافة ديسيبلات هي ضرب السعات).

**🎯 الناتج المتوقع :** الدوال معرّفة; يعيد `len(trim_audio(tone, 500, 2500))` القيمة 2000 (2.0 ثانية) مع أنك طلبت نصف ثانية داخل نغمة 3 ثوانٍ.

**🩹 إذا لم يعمل :** إن أعاد قص مقطعًا (شبه) فارغ, فـ`start_ms` أكبر من أو يساوي `end_ms` ، التقطيع فارغ, ولن يشتكي pydub. إن رفع تسوية مقطع *صامت* أو طبعت رقمًا غريبًا, فذلك لأن الصمت له `dBFS = -inf`: طرح `-inf` يعطي ما لا نهاية, وهو غير معروف ككسب ، سوِّ دائمًا صوتًا فيه صوت فعليًا.

### 2.2 طبّق التعديلات وصدّر

**👟 تلميح البداية :** اقص النغمة إلى 500–2500 مللي ثانية, وتلاشٍ دخولًا 200 مللي ثانية وخروجًا 400, وسوِّ إلى -18 dBFS, وصدّر `clip.wav`.

```python
clip = trim_audio(tone, 500, 2500)
clip = apply_fades(clip, fade_in_ms=200, fade_out_ms=400)
clip = normalize_volume(clip, target_db=-18.0)
clip.export("clip.wav", format="wav")
print(f"Exported clip.wav ({len(clip) / 1000:.1f}s)")
```

**🎯 الناتج المتوقع :** يطبع `Exported clip.wav (2.0s)` ويكتب WAV من ثانيتين شكله الموجي يدرّج صعودًا عند البداية.

**🩹 إذا لم يعمل :** إن طبع `0.0s`, فشريحة القص كانت عكسية (انظر 2.1). إن كان المقطع *مبهرًا* أو صامتًا بعد التسوية, فـ`target_db` التي اخترتها بعيدة عمّا بدأت منه النغمة ، `apply_gain` سيدفعها إليه بسعادة, وهذا صحيح لكنه قد يفاجئك; أدر `target_db` إلى -18 واسمع مستوى مريحًا.

### 2.3 تحقّق من التعديلات

**✅ قائمة التحقق**

- ✅ `clip.wav` طوله ثانيتان بالضبط ويعزف بتلاشٍ ناعم دخولًا وخروجًا.
- ✅ `tone.wav` الأصلي غير ملموس عند 3.0 ثوانٍ ، لم يحوّر القص المصدر.
- ✅ تستطيع شرح لماذا التسوية *جمع/طرح بالديسيبل* لا ضرب للعينات الخام.

**🤔 سؤال (أسئلة) سقراطي(ة) :**

- لو طبقت التلاشي *بعد* التسوية, هل ما زالت الجهارة النهائية تقيس -18 dBFS? لماذا *ترتيب* تلاشٍ-ثم-تسوية (أو تسوية-ثم-تلاشٍ) قرار حقيقي بنتيجة مختلفة؟
- يعيد `apply_fades` `audio.fade_in(...).fade_out(...)`, مسلسلًا استدعاءين. ما الذي ينكسر لو أعاد `fade_in` القيمة `None` ، وماذا يخبرك ذلك عن سبب إرجاع طرائق pydub مقاطع جديدة؟

## الخطوة 3: حوّل بين الصيغ

ملف WAV واحد هو المعادل الصوتي لملف `.txt` ، غير مضغوط وعملاق. المشاركة تعني عادةً MP3 (للناس), أو OGG (لخطوط الأنابيب مفتوحة المصدر), أو FLAC (للأرشيفات بلا فقد). تحويل الصيغ هو الخطوة الوحيدة في هذا المشروع التي تستدعي ثنائيًا منفصلًا: يكتب `pydub` ما تأمره به, لكن `ffmpeg` يقوم بفعل الترميز.

### 3.1 اكتب `convert_format`

**👟 تلميح البداية :** اكتب دالة واحدة تحمّل *أي* مسار مقروء وتعيد تصديره بصيغة مختلفة, آخذة الصيغة صراحة كي لا تخمين من الامتدادات.

```python
# audio_editor.py (continued)
def convert_format(input_path: str, output_path: str, fmt: str = "wav") -> None:
    """Load any pydub-supported file and re-save it as `fmt`."""
    audio = AudioSegment.from_file(input_path)
    audio.export(output_path, format=fmt)
    print(f"Converted {input_path} -> {Path(output_path).name}")

convert_format("clip.wav", "clip.mp3", fmt="mp3")
convert_format("clip.wav", "clip.ogg", fmt="ogg")
```

يتشمّم `AudioSegment.from_file` الصيغة من الملف, فيبقى الحمّال عامًا ، وتمرير `format=` إلى `export` يزيل أي غموض فيما طلبت. لاحظ أنه لا توجد معالجة أخطاء حول تصديراته المدعومة بـffmpeg: إن غاب الثنائي, يرفع `pydub` `FileNotFoundError` واضحًا يسميه, وهو الفشل الذي نريدك أن تراه *مرة* كي لا تنسى أبدًا أن الخطوة 1 انتقلت إلى هذه اللحظة.

**🎯 الناتج المتوقع :** يطبع `Converted clip.wav -> clip.mp3` و`Converted clip.wav -> clip.ogg`, وكل الملفين الجديدين موجودان بحجمين **أصغر بكثير** من `clip.wav` (MP3/OGG ضغط بخسارة).

**🩹 إذا لم يعمل :** إذا حصلت على `FileNotFoundError: ffmpeg not found` (أو مشابه), فـ`ffmpeg` ليس في PATH ، شغّل خطوة الإعداد التي تخطيتها وتحقق من `ffmpeg -version`. إذا نجح تصدير MP3 وفشل OGG, فقد يفتقد بناء ffmpeg لديك مشفِّر OGG, وهي فجوة خاصة بالبناء; حوّل إلى `.ogg` عبر `ffmpeg` مباشرة مرة في طرفية لتأكيد وجود المرمّز.

### 3.2 تحقّق من التحويل

**✅ قائمة التحقق**

- ✅ يوجد `clip.mp3` و`clip.ogg` وكلاهما أصغر بشكل هائل من `clip.wav`.
- ✅ تستطيع تسمية خطوة هذا المشروع التي لا تستطيع فعلًا العمل دون ثنائي غير Python.

**🤔 سؤال (أسئلة) سقراطي(ة) :**

- يفقد WAV → MP3 معلومات; يحافظ MP3 → WAV عليها لكنه *لا يستعيد* ما فُقد. ماذا يعني ذلك بشأن تحويل ملف ذهابًا وإيابًا مرارًا, ومتى يكون كل اتجاه القرار الصحيح؟
- لماذا لا يحتاج دالة الحمّل وسيطة `format=` بينما تصبح تصدير الدالة مساوية لها؟

## الخطوة 4: اجمع المقاطع في مونتاج

التحرير ليس فقط القصَّ ، بل أيضًا وضع القطع معًا. نفس عامل `+` الذي استخدمته لإحساس التقطيع يصل المقاطع نهاية إلى نهاية, و`AudioSegment.silent(...)` صريحة تتيح لك إدخال فجوات سكون متعمدة بينها, كما يُدخل بودكاست توقفة بين المقاطع.

### 4.1 اكتب `combine_clips`

**👟 تلميح البداية :** عالج حالة القائمة الفارغة مقدمًا, ثم طوِ المقاطع معًا بـ`+=`, وأدخل `gap_ms` من الصمت بين المقاطع المتتالية.

```python
# audio_editor.py (continued)
def combine_clips(clips: list[AudioSegment], gap_ms: int = 0) -> AudioSegment:
    """Concatenate clips with `gap_ms` of silence between consecutive ones."""
    if not clips:
        return AudioSegment.empty()
    silence = AudioSegment.silent(duration=gap_ms)
    combined = clips[0]
    for clip in clips[1:]:
        combined += silence + clip
    return combined

intro = trim_audio(tone, 0, 1000)
middle = trim_audio(tone, 1200, 2200)
outro = trim_audio(tone, 2400, 3000)
montage = combine_clips([intro, middle, outro], gap_ms=250)
montage.export("montage.wav", format="wav")
print(f"Montage: {len(montage) / 1000:.1f}s")
```

العادة المهمة هنا هي فحص القائمة الفارغة أولًا: وصل قائمة فارغة سيحطم اللحظة التي تفهرس فيها `clips[0]`, و*محرر صوت* يحطم على الصمت محرج. نمط التراكم ، ابدأ بـ`clips[0]`, ثم ألحق `silence + clip` لكل باقٍ ، نسخة باطلة من ثنية بأسلوب `sum`, وهو معتاد لأي شيء (صوت, قوائم, أجزاء HTML) لا يكون فيه العنصر الرابط هو المحايد.

**🎯 الناتج المتوقع :** يطبع `Montage: 3.1s` ، ثلاثة مقاطع مجموعها 2.6 ثانية *زائد* فجوتين سكون بمقدار 250 مللي ثانية ، ويكتب `montage.wav`.

**🩹 إذا لم يعمل :** إن تحطم `combine_clips([])` بخطأ فهرس, فالحارس أُسقط ، أعد `if not clips: return` المبكر. إن لم يكن الطول الإجمالي 2.6 ثانية + (n-1)·فجوة, فواحدة من شرائح `trim_audio` تمتد خارج النغمة وقُصّت (طلبت أكثر من 3.0 ثانية), فلتحقق من المدَد الخام لـ`intro`/`middle`/`outro`.

### 4.2 تحقّق من المونتاج

**✅ قائمة التحقق**

- ✅ `montage.wav` طوله 3.1 ثانية بالضبط ويعزف مقاطع النغمة الثلاثة مفصولة بفجوات هادئة.
- ✅ يعيد `combine_clips([], gap_ms=250)` مقطعًا فارغًا صالحًا دون تحطم.

**🤔 سؤال (أسئلة) سقراطي(ة) :**

- بُني `montage` بلا تلاشيات بين المقاطع. اذكر المشكلتين اللتين تتوقع *سماعهما* عند كل وصلة, وأين في دوال الخطوة 2 تُدخل إصلاحًا.
- تضاف الفجوة كـ`combined += silence + clip`, لكن لا بين أول مقطع ولا شيء. كيف تعدّل الحلقة لتضع فجوة `gap_ms` *موحّدة* بين كل زوج مقاطع؟

## الخطوة 5: اعرض الشكل الموجي

بحلول الآن حوّلت الصوت أربع طرق لكنك لم *ترَ* شيئًا منه. يحوّل الشكل الموجي تاريخ السعة إلى شكل ، تستطيع حرفيًا تشخيص قصٍّ سيئ (جرف مفاجئ), أو تلاشٍ مفقود (سقوط عمودي), أو مقطعًا مُسوًّى (ارتفاع موحّد) بلمحة واحدة. هذه خطوة الثمرة: تصبح الأرقام صورة.

### 5.1 اكتب `plot_waveform`

**👟 تلميح البداية :** اسحب العيّنات الخام من المقطع بـ`get_array_of_samples()`, وارسم فهرس *العيّنة* إلى *ثوانٍ* بـ`np.linspace`, ومثّل السعة ضد الزمن ، ثم احفظ وأظهر النتيجة.

```python
# audio_editor.py (continued)
import numpy as np
import matplotlib.pyplot as plt

def plot_waveform(audio: AudioSegment, title: str = "Waveform") -> None:
    """Plot sample amplitude against time and save a PNG."""
    samples = np.array(audio.get_array_of_samples())
    if audio.channels == 2:
        samples = samples[::2]
    times = np.linspace(0, len(audio) / 1000, num=len(samples))
    plt.figure(figsize=(12, 4))
    plt.plot(times, samples, linewidth=0.5, color="#2563eb")
    plt.fill_between(times, samples, alpha=0.3, color="#2563eb")
    plt.title(title)
    plt.xlabel("Time (seconds)")
    plt.ylabel("Amplitude")
    plt.tight_layout()
    plt.savefig("waveform.png", dpi=150)
    print("Saved waveform.png")

plot_waveform(clip, "Trimmed + Faded + Normalized Clip")
```

يمدّك `get_array_of_samples()` بنفس الأعداد الصحيحة 16-بت الكامنة التي *أنشأتها* في الخطوة 1 ، التحليل والتركيب وجهان لعملة واحدة. حيلة الاستريو `samples[::2]` تقشّر: أخذ كل عيّنة ثانية يستخرج قناة واحدة بالضبط, لأن القنوات متشابكة يسار-يمين-يسار-يمين. يعيد `linspace(0, len(audio)/1000, num=len(samples))` استخدام بصيرة الخطوة 1 ، يرسم فهرس العيّنة إلى الزمن بقسمته على معدل العيّنات ، فيكون محور الزمن بالثواني الأمينة.

**🎯 الناتج المتوقع :** نافذة matplotlib زائد `waveform.png` تُظهر أثرًا من ثانيتين يتناقص صعودًا قرب `t=0` (التلاشي بالمقدمة) ويهبط قرب `t≈1.6 ثانية` (التلاشي بالختام).

**🩹 إذا لم يعمل :** إن لم تفتح نافذة على آلة بلا رأس أو في دفتر, فهذا متوقع ، كتب `plt.savefig` الـPNG فعلًا, ويحصل مستخدمو الدفاتر على الرسم الداخلي بدل ذلك; لا شيء معطوب. إن أظهر الرسم كتلة زرقاء صلبة, فالنغمة كثيفة جدًا عند 44.1 كيلوهرتز لتُحل ، قرّب أو ارسم شريحة أقصر مثل `tone[0:200]`. إن لطّخت القناتان إحداهما الأخرى, فتنقيص `[::2]` مفقود.

### 5.2 تحقّق من التصور

**✅ قائمة التحقق**

- ✅ يوجد `waveform.png` ويُظهر منحدر تلاشٍ بالمقدمة واضحًا ومنحدر تلاشٍ بالختام ومنتصفًا مسطحًا نسبيًا.
- ✅ تستطيع الإشارة إلى التلاشي في الصورة *قبل* النظر إلى الكود الذي صنعه.

**🤔 سؤال (أسئلة) سقراطي(ة) :**

- كيف يبدو `plot_waveform(tone, ...)` (3 ثوانٍ, بلا تلاشيات) مختلفًا عن `plot_waveform(clip, ...)`, وماذا تخبرك تلك المقارنة عن استخدام الأشكال الموجية للتحقق من تعديلاتك؟
- يظهر الشكل الموجي السعة, لا الجهارة. خفقة 20 هرتز هادئة وهسيس 20 كيلوهرتز عالٍ كلاهما يتأرجح بين ±0.5 ، ما القياس *الإضافي* (تلميح: مطبوع فعلًا في الخطوة 1) الذي يميّزهما, ولماذا؟

## ⚠️ مآزق شائعة

- **`ffmpeg` مفقود.** تصدير MP3/OGG هو الخطوة الوحيدة التي تعتمد على ثنائي غير Python. يرفع `pydub` `FileNotFoundError` يسمي `ffmpeg` ، فشل أمين وتعليمي ، لكنك تستطيع تخطي صنف الأخطاء كله بتشغيل فحص الإعداد `ffmpeg -version` مرة قبل الخطوة 3.
- **القصّ ما بعد النهاية يقصّ بصمت.** `audio[start:end]` لا يشتكي أبدًا حين يتجاوز `end` المدة; يعيد فقط صوتًا أقل مما طلبت. يبدأ تحرّي «مونتاجي أقصر من المتوقع» بجمع أطوال القطع, لا بمنطق الجمع.
- **تسوية الصمت ترفع خطأً غريبًا.** المقطع الصامت له `dBFS = -inf`, فـ`target_db - audio.dBFS` هو `inf`, و`apply_gain(inf)` غير معروف. حوِّط بفحص `if audio.dBFS == float('-inf')` قبل التسوية, أو لا تسوِّ أبدًا مقطعًا لم تتحقق أنه فيه صوت.
- **تصوير ملفات طويلة بمصفوفات هائلة.** `get_array_of_samples()` على ملف استريو طويل يعيد ملايين العيّنات; رسمها كلها بطيء ويبدو ككتلة صلبة. اقص المقطع فرعيًا (`audio[start:end]`) أو قلّص العينات قبل الرسم.
- **نسيان أن الديسيبل لوغاريتمي.** كسب `+6 dB` لا يضاعف قيم العيّنات ، بل يضاعف *الطاقة*. المضاعفة الرقمية لقيم `int(...)` تعزيز ~6 ديسيبل, وخلط الاثنين هو كيف ينتهي الجهارات بفارق 6 ديسيبل عن هدف.
- **افتراض أن الاستريو نسختان من نفس البيانات.** القنوات المتشابكة تعني أن `samples[::2]` *قناة واحدة*, لا «البيانات الزوجية». تخطي التنقيص يلطّخ شكل الموجة.

## ما بنيته للتو

محرر صوت عامل في سطر الأوامر: يولِّد صوتًا من رياضيات عيّنات خام, ويقصّه بدقة المللي ثانية, ويخفّت ويوَسّع في نطاق الديسيبل, ويحوّل الصيغ عبر مشفِّر خارجي حقيقي, ويوصّل مقاطع عدة في مونتاج, ويثبت كل تعديل بصريًا بشكل موجي مُقدَّم. لا شيء هنا محاكاة ، `tone.wav` و`clip.wav` و`montage.wav` ملفات صوت قابلة للعزف تفتحها في أي مشغل وسائط.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/audio-editor/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/audio-editor) في مستودع الدورة نسخة أكمل من الكود أعلاه كدفتر قابل للتشغيل منفردًا: يولّف نغمة الاختبار, ويشغّل كل تعديل من الخطوات 1–5, ويعرض الشكل الموجي داخليًا. استنسخه, أو افتح المستودع كله في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), وشغّله من هناك.
:::

## إلى أين تذهب من هنا

- ابنِ **كاشف صمت**: `split_on_silence(tone)` يقطع ملفًا صوتيًا عند نقاط هادئة ويطبع `(start_ms, end_ms)` لكل مقطع ، يبني pydub `audio.split_on_silence(...)` جاهزًا للاستخدام, ويجعل التقسيم التلقائي لتسجيل طويل شبه مجاني.
- اكتب **داعم بودكاست** يصل مقدمة وعدة مقاطع حلقة مع خاتمة بـ`clip.crossfade(duration)` لانتقالات ناعمة بدل فجوات حادة ، لديك فعلًا `combine_clips`, فاستبدال `AudioSegment.silent(...)` بـ`crossfade` تفكير في سطر واحد.
- أضف **تحكمًا بالسرعة حافظًا على النغمة**: `audio._spawn(data, overrides={'frame_rate': new_rate}).set_frame_rate(original_rate)` يعزف نفس الصوت أسرع دون صوت سنجاب ، رياضيات العيّنات من الخطوة 1 تجعل هذه تبدو كلفّة انتصار.

## شارك مشروعك مع الصف

بنيت شيئًا تفخر به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع قدّمها طلاب آخرون ، وREADME الخاص به يحوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**, حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع, وإنشاء فرع, وتثبيت ملفاتك, وفتح الـ PR, خطوة بخطوة. لا يُفترض أي خبرة سابقة بـ git.

مرحبًا بك في جعل Python تُحدث ضجيجًا. 🎓