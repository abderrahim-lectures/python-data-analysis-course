---
title: "معالج الفيديو"
description: "عالج مقاطع الفيديو مع القص والتأثيرات ودمج الترجمة وتحويل الصيغ."
difficulty: "advanced"
estimatedMinutes: 75
tags: ["moviepy", "video-processing", "ffmpeg", "subtitles"]
learningObjectives:
  - اقصّ مقاطع الفيديو إلى نطاقات زمنية محددة بدقة مستوى الإطار
  - طبّق تراكبات نصية بخطوط ومواضع وتوقيت مخصص
  - استخرج المسارات الصوتية وولّد صورًا مصغّرة من أي إطار
  - حوّل بين صيغ الفيديو واضغطها لحالات استخدام مختلفة
prerequisites:
  - "Python basics (functions, strings, f-strings)"
  - "FFmpeg installed on your system (covered in Setup)"
  - "A sample video file to work with (any MP4 will do)"
---

# 🎬 اعِد معالج فيديو

تحرير الفيديو تقليديًا نقرة ونقر، لكن كل عملية — القص، وتراكب النص، واستخراج الصوت، وتحويل الصيغ — في الحقيقة دالة حتمية تُطبَّق على الإطارات ونطاقات الوقت. يبني هذا المشروع مجموعة أدوات تغلّف MoviePy (الذي يغلّف ffmpeg) في دوال بايثون نظيفة، فتشبّه مهام معالجة الفيديو بنفس الطريقة التي تشبّه بها أي تحويل بيانات آخر: حمّل، شغّل، احفظ.

يُفترض أساسيات بايثون وتثبيت ffmpeg يعمل (مغطى في الإعداد). هذا اختياري وغير مُقيَّم؛ راجع [المشاريع الواقعية](/ar/مشاريع) للقائمة الكاملة المتنامية.

## 🎯 ما ستفعله

1. حمّل ملف فيديو وافحص بياناته الوصفية (المدة، الدقة، معدل الإطارات، الصوت).
2. اقصّ مقاطع فيديو لنطاقات زمنية دقيقة واستخرج مسارات الصوت.
3. ولّد صورًا مصغّرة من أي إطار في الفيديو.
4. أضف تراكبات نصية مع تحكم بالموضع والتوقيت والخط.
5. حوّل بين صيغ الفيديو واضغط لتوصيل الويب.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي والموصى به — يتطلب MoviePy ffmpeg (ثنائي على مستوى النظام، لا حزمة بايثون) ونظام ملفات حقيقيًا لقراءة وكتابة ملفات الفيديو. لا يمكن لأي ملعب قائم على المتصفح فعل ذلك.

**Google Colab** يعمل بخطوة إعداد صغيرة — ffmpeg مثبّت مسبقًا على بيئة Colab، ويمكنك `!pip install moviepy` للبدء. ستحتاج رفع عيّنة الفيديو أو تنزيلها من رابط. هذا مسار "جرّبه أولًا" جيد قبل الالتزام بتثبيت محلي.

**JupyterLite لا يدعم MoviePy** — لا وصول لنظام الملفات، ولا ثنائي ffmpeg، ولا قدرة `write_videofile`. لا تستخدمه لهذا المشروع.

**Binder** قد يعمل إذا كان ffmpeg متاحًا في صورة البيئة، لكنه بطيء وغير موثوق لإدخال/إخراج الفيديو. التزم بالمحلي أو Colab.

## الإعداد

كل ما تحتاجه قبل كتابة سطر من معالجة الفيديو: بايثون وffmpeg وMoviePy.

### ثبّت `uv`

`uv` أداة واحدة تحل محل سلسلة "تثبيت بايثون، ثم تثبيت pip، ثم تثبيت أداة البيئة الافتراضية، ثم تثبيت الحزم" — يمكنها تثبيت وإدارة إصدارات بايثون نفسها، بالإضافة إلى تبعيات مشروعك.

**macOS / Linux** (طرفية):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

أغلق وأعد فتح طرفتك، ثم تأكد من التثبيت:

```bash
uv --version
```

### ثبّت ffmpeg

ffmpeg ثنائي على مستوى النظام يستخدمه MoviePy تحت الغطاء — تحتاجه مثبّتًا بشكل منفصل عن أي حزمة بايثون. سيرفع MoviePy `FileNotFoundError` واضحًا إذا لم يعثر عليه.

**macOS** (Homebrew):

```bash
brew install ffmpeg
```

**Ubuntu / Debian:**

```bash
sudo apt update && sudo apt install ffmpeg
```

**Windows** (Chocolatey):

```powershell
choco install ffmpeg
```

تأكد من التثبيت:

```bash
ffmpeg -version
```

### أعد إعداد المشروع

```bash
uv init video-processor
cd video-processor
uv add moviepy pillow
```

`moviepy` يغلّف ffmpeg في واجهة بايثون صديقة لتحميل مقاطع الفيديو وتحريرها وتصديرها. `pillow` يستخدمه `generate_thumbnail` لحفظ الإطارات كصور. كلاهما حزم بايثون نقية بلا تبعيات أصلية — لكنهما يحتاجان `ffmpeg` وقت التشغيل.

**✅ قائمة التحقق**

- ✅ `uv --version` يطبع رقم إصدار.
- ✅ `ffmpeg -version` يطبع معلومات إصدار ffmpeg (لا "command not found").
- ✅ `video-processor/` موجود بملف `pyproject.toml`، و`moviepy` و`pillow` مثبّتان.

## الخطوة 1: حمّل فيديو وافحص بياناته الوصفية

الخطوة الأولى في أي مهمة معالجة فيديو هي معرفة ما تعمل عليه: كم مدته، ما دقته، ما معدل إطاره، وهل لديه مسار صوت؟ `VideoFileClip` يحمّل الفيديو ويعرض كل ذلك كسمات بسيطة.

### 1.1 اكتب الحمّالة

```python
from moviepy import VideoFileClip, AudioFileClip, TextClip, concatenate_videoclips
from pathlib import Path

def load_video(path: str) -> VideoFileClip:
    """Load a video file and handle common errors."""
    try:
        clip = VideoFileClip(path)
        return clip
    except FileNotFoundError:
        print(f"Error: File '{path}' not found.")
        raise
    except Exception as e:
        print(f"Error loading video: {e}")
        raise

video = load_video("sample.mp4")
print(f"Duration: {video.duration:.1f} seconds")
print(f"Resolution: {video.size[0]}x{video.size[1]}")
print(f"FPS: {video.fps}")
print(f"Has audio: {video.audio is not None}")
```

**👟 تلميح البداية :** `VideoFileClip(path)` يحمّل الفيديو بتكاسل — تُقرأ بيانات الإطارات الفعلية إطارًا إطارًا عند الحاجة، فتحميل فيديو 10 دقائق لا يستهلك 10 دقائق من الذاكرة. السمات `.duration` و`.size` و`.fps` تُقرأ من ترويسة الملف بواسطة ffmpeg. تحقق دائمًا `video.audio is not None` قبل محاولة الوصول إلى الصوت — بعض الفيديوهات صامتة.

**🎯 الناتج المتوقع :** لملف MP4 نموذجي:
```
Duration: 10.0 seconds
Resolution: 1920x1080
FPS: 30.0
Has audio: True
```

**🩹 إذا لم يعمل :** `FileNotFoundError` تعني المسار خاطئ — استخدم مسارًا كاملًا أو تأكد أنك في الدليل الصحيح. إذا نلت خطأ ffmpeg، فـ ffmpeg غير مثبّت أو ليس على `PATH` — شغّل `ffmpeg -version` للتأكد. فيديو تالف أو منزّل جزئيًا قد يحمّل البيانات الوصفية لكن يفشل عند الوصول إلى الإطارات لاحقًا.

### 1.2 تحقق من البيانات الوصفية

**✅ قائمة التحقق**

- ✅ `load_video("sample.mp4")` يعيد كائن `VideoFileClip` دون أخطاء.
- ✅ `.duration` رقم موجب (بالثواني)، و`.size` قائمة `[width, height]`، و`.fps` رقم موجب.
- ✅ `.audio` إما `AudioFileClip` أو `None`، ويمكنك التعامل مع الحالتين.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- فيديو بـ `.fps = 29.97` بدلاً من 30. ماذا يعني فرق 0.03 لعمليات مستوى الإطارات مثل القص عند 5.0 ثانية تمامًا — هل تحصل على الإطار المتوقع بالضبط؟
- `.size` يعطيك `[width, height]` (العرض أولًا)، وهو عكس ترتيب `[row, col]` الرياضي. لماذا تستخدم أدوات الفيديو هذه الاصطلاح، وأين قد يسبب الزحف خللًا في كودك؟

## الخطوة 2: اقصّ مقاطع الفيديو واستخرج الصوت

القص أكثر عمليات تحرير الفيديو شيوعًا — أخذ مقطع بين طابعي زمن. واستخراج الصوت بالمثل مباشر: افصل مسار الصوت عن إطارات الفيديو واحفظه كملف خاص به. كلتا العمليتين تنتجان ملفات جديدة على القرص.

### 2.1 اقصّ واستخرج الصوت

```python
def trim_video(video: VideoFileClip, start: float, end: float) -> VideoFileClip:
    """Extract a segment between start and end (in seconds)."""
    if start < 0 or end > video.duration:
        print(f"Warning: clamping to valid range (0–{video.duration:.1f}s)")
        start = max(0, start)
        end = min(video.duration, end)
    return video.subclipped(start, end)

def extract_audio(video: VideoFileClip, output_path: str) -> None:
    """Extract the audio track from a video."""
    if video.audio is None:
        print("No audio track found in this video.")
        return
    video.audio.write_audiofile(output_path)
    print(f"Audio saved to {output_path}")

def generate_thumbnail(video: VideoFileClip, timestamp: float, output_path: str) -> None:
    """Save a single frame as a thumbnail image."""
    frame = video.get_frame(timestamp)
    from PIL import Image
    img = Image.fromarray(frame)
    img.save(output_path, quality=90)
    print(f"Thumbnail at {timestamp}s saved to {output_path}")

clip = trim_video(video, 10, 25)
clip.write_videofile("trimmed.mp4", codec="libx264", audio_codec="aac")

extract_audio(video, "audio_track.wav")

generate_thumbnail(video, 5.0, "thumb.jpg")

video.close()
```

**👟 تلميح البداية :** `video.subclipped(start, end)` يعيد `VideoFileClip` جديدًا يحتوي فقط إطارات بين `start` و`end` ثانية — لا يعدّل المقطع الأصلي. `write_videofile` ثم يشفّر المقطع المقصوص ويحفظه على القرص: `codec="libx264"` ترميز الفيديو المعياري، و`audio_codec="aac"` ترميز الصوت المعياري. `get_frame(timestamp)` يعيد إطارًا واحدًا كمصفوفة NumPy، يمكن لـ PIL حفظها كـ JPEG أو PNG. استدعِ `close()` دائمًا عند الانتهاء لتحرير مقبض عملية ffmpeg.

**🎯 الناتج المتوقع :**
```
trimmed.mp4 — فيديو 15 ثانية (من 10 ث إلى 25 ث من الأصل)
audio_track.wav — مسار الصوت الكامل
thumb.jpg — إطار واحد عند علامة 5 ثوانٍ
```

**🩹 إذا لم يعمل :** إذا لم يكن في `trimmed.mp4` صوت، فالأصل غالبًا بلا مسار صوت (`video.audio is None`). إذا أخطأ `write_videofile`، فـ ffmpeg غير مثبّت — معاملات الترميز (`libx264`، `aac`) خاصة بـ ffmpeg. إذا كان `thumb.jpg` أسود في الغالب، فالإطار عند ذلك الطابع الزمني تلاشي دخول أو بطاقة عنوان — جرّب طابعًا زمنيًا مختلفًا.

### 2.2 تحقق من القص والاستخراج

**✅ قائمة التحقق**

- ✅ `trimmed.mp4` موجود ومدته تساوي `end - start` ثانية.
- ✅ `audio_track.wav` ملف صوتي قابل للتشغيل (أو طبع `extract_audio` "No audio track").
- ✅ `thumb.jpg` صورة JPEG صالحة بالدقة الصحيحة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- `trim_video` يقرّب `start` و`end` إلى النطاق الصالح بدلاً من رفع خطأ. هل هذا الاختيار صحيح لدالة مكتبة، أم سيكون رفع خطأ أفضل؟ ما المقايضات في سكربت مقابل أداة مواجهة للمستخدم؟
- `video.close()` يُستدعى في النهاية. ماذا يحدث إذا نسيت استدعاءه — هل ينظّف جامع القمامة في بايثون في النهاية، أم تلتصق عملية ffmpeg تلك؟ كيف تعرف أنك سرّبت عملية؟

## الخطوة 3: أضف تراكبات نصية

التراكبات النصية تحوّل مقطعًا خامًا إلى شيء بسياق — عناوين، تسميات، ترجمات، علامات مائية. `TextClip` من MoviePy ينشئ طبقة نصية، وتركيبها فوق الفيديو يضعها في إحداثيات وأوقات محددة.

### 3.1 ابنِ دالة التراكب

```python
def add_text_overlay(
    video_path: str,
    text: str,
    start: float,
    end: float,
    font_size: int = 24,
    position: str = "center",
    output_path: str = "overlay.mp4",
) -> None:
    """Add a text overlay to a video segment."""
    video = load_video(video_path)

    positions = {
        "center": ("center", "center"),
        "top": ("center", 40),
        "bottom": ("center", video.h - 60),
        "top-left": (40, 40),
    }

    txt_clip = (
        TextClip(
            text=text,
            font_size=font_size,
            color="white",
            bg_color="black",
            text_align="center",
            size=(video.w * 0.8, None),
            method="caption",
        )
        .with_position(positions.get(position, positions["center"]))
        .with_start(start)
        .with_end(end)
    )

    result = video.with_composite([txt_clip])
    result.write_videofile(output_path, codec="libx264", audio_codec="aac")
    video.close()
    print(f"Saved {output_path}")

add_text_overlay("sample.mp4", "Welcome to My Video", start=0, end=3, output_path="titled.mp4")
```

**👟 تلميح البداية :** `TextClip` ينشئ طبقة فيديو من سلسلة — `method="caption"` يلفّ النص عند `size=(video.w * 0.8, None)` (80% من عرض الفيديو، ارتفاع تلقائي)، و`bg_color="black"` يرسم خلفية داكنة خلف نص أبيض للقراءة. `.with_start(start).with_end(end)` يجعل النص يظهر فقط خلال تلك النافذة الزمنية. `video.with_composite([txt_clip])` يركّب طبقة النص فوق الفيديو؛ ويمر مسار الصوت الأصلي دون تغيير.

**🎯 الناتج المتوقع :** يشغّل `titled.mp4` الفيديو مع "Welcome to My Video" ظاهرًا في الثواني الثلاث الأولى (0–3)، ثم يختفي لبقية المدة.

**🩹 إذا لم يعمل :** إذا ظهر النص بلا خلفية، فـ `bg_color` لا يُطبَّق — تحقق أنك تمرره كوسيطة كلمة مفتاحية لـ `TextClip`، لا إلى `.with_position()`. إذا فشل `write_videofile` بخطأ ترميز، تأكد أن ffmpeg مثبّت (`ffmpeg -version`). إذا قُص النص أو التفّ بشكل غريب، فـ `size=(video.w * 0.8, None)` ضيّق جدًا — زد نسبة العرض.

### 3.2 تحقق من التراكب النصي

**✅ قائمة التحقق**

- ✅ `titled.mp4` موجود وله مدة `sample.mp4` نفسها.
- ✅ النص ظاهر خلال النافذة الزمنية المحددة وغائب خارجها.
- ✅ مسار الصوت الأصلي يعمل طوال الوقت، غير متأثر بالتراكب النصي.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- دالة التراكب تصلّب نصًا `"white"` على خلفية `"black"`. ماذا تغيّر لدعم ألوان ديناميكية لكل استدعاء — وما توليفات الألوان المضمونة مقروءة ضد أي خلفية فيديو؟
- `method="caption"` يلفّ النص تلقائيًا. ماذا يفعل `method="label"` بدلاً من ذلك — ومتى تريد نصًا غير ملفوف في تراكب فيديو؟

## الخطوة 4: حوّل بين الصيغ

تتطلب منصات مختلفة صيغ فيديو مختلفة — YouTube يقبل MP4، وDiscord يفضّل WebM، وبعض الأنظمة القديمة تحتاج AVI. تبني هذه الخطوة محوّلًا يعيد ترميز الفيديو إلى صيغة هدف، مع ضغط اختياري لتوصيل الويب.

### 4.1 حوّل ملفًا واحدًا

```python
def convert_video(
    input_path: str,
    output_path: str,
    codec: str = "libx264",
    fps: int = 24,
    bitrate: str = "5000k",
) -> None:
    """Convert a video to a different format or encoding."""
    video = load_video(input_path)
    video.write_videofile(
        output_path,
        codec=codec,
        fps=fps,
        bitrate=bitrate,
        audio_codec="aac",
    )
    video.close()
    print(f"Converted {input_path} → {output_path}")

convert_video("sample.mp4", "sample.webm", codec="libvpx-vp9")
convert_video("sample.mp4", "sample_low.mp4", bitrate="1000k")
```

**👟 تلميح البداية :** `codec="libvpx-vp9"` ينتج ملفات WebM (VP9 ترميز فيديو Google لـ WebM)؛ `bitrate="1000k"` ينتج ملفًا أصغر بكثير من الافتراضي `5000k` بخفض الجودة — هذه هي المقايضة التي تتحكم بها: معدل أقل = ملف أصغر = جودة أقل. معامل `fps=24` يعيد أخذ عينات الفيديو إلى 24fps إذا كان الأصل أعلى، وهو تحسين ويب شائع.

**🎯 الناتج المتوقع :**
```
sample.webm — ملف WebM (ترميز VP9، نفس المدة)
sample_low.mp4 — MP4 مضغوط بمعدل أقل (حجم ملف أصغر)
```

**🩹 إذا لم يعمل :** إذا لم يشغّل `sample.webm`، فمفكك الترميز غير متاح على نظامك — VLC ومعظم المتصفحات الحديثة تتعامل مع VP9، لكن بعض المشغّلات الأقدم لا. إذا كان `sample_low.mp4` أصغر بالكاد من الأصل، فـ `bitrate="1000k"` ليس منخفضًا بما يكفي لدقة الفيديو — جرّب `"500k"` أو اخفض الدقة (لدى MoviePy طريقة `resize`).

### 4.2 حوّل مجلدًا بالجملة

```python
def batch_convert(input_dir: str, output_dir: str, target_format: str = "mp4") -> None:
    """Convert all video files in a directory."""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    extensions = {".avi", ".mov", ".webm", ".mkv", ".flv"}
    for filepath in Path(input_dir).iterdir():
        if filepath.suffix.lower() in extensions:
            out = output_path / f"{filepath.stem}.{target_format}"
            try:
                convert_video(str(filepath), str(out))
            except Exception as e:
                print(f"  ✗ {filepath.name}: {e}")

batch_convert("raw_videos", "converted")
```

**👟 تلميح البداية :** `Path(input_dir).iterdir()` يسرد كل ملف في المجلد؛ `suffix.lower()` يلتقط `.AVI` و`.avi` كامتداد نفسه؛ و`try/except` داخل الحلقة يمنع فشل ملف واحد من قتل الدفعة كلها. هذه نسخة "الإنتاج" من محوّل الملف الواحد — تحتاج العمليات الضخمة معالجة أخطاء لكل عنصر، لا لكل دفعة.

**🎯 الناتج المتوقع :** كل ملف `.avi` أو `.mov` أو `.webm` أو `.mkv` أو `.flv` في `raw_videos/` ينتج مقابلًا `.mp4` في `converted/`، مع طباعة أي أخطاء لكل ملف.

**🩹 إذا لم يعمل :** إذا لم يوجد مجلد `converted/`، فـ `mkdir(parents=True, exist_ok=True)` ينشئه — تأكد أنك لم تضف متغيرًا `exist_ok=False`. إذا فشلت بعض الملفات بصمت، فـ `try/except` يطبع الخطأ لكنك قد لا تراه — وجّه الإخراج القياسي إلى ملف سجل إذا شغّلت بالجملة.

### 4.3 تحقق من التحويل

**✅ قائمة التحقق**

- ✅ `convert_video` ينتج ملفًا جديدًا بالامتداد الصحيح (`.webm`، `.mp4`، إلخ).
- ✅ `batch_convert` ينتج ملف إخراج واحدًا لكل ملف إدخال، مع تسجيل الأخطاء لكل ملف لا إلغاء الدفعة كلها.
- ✅ الملف المحوّل يعمل بشكل صحيح في VLC أو متصفح — المدة والصوت يطابقان الأصل.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- `convert_video` يقبل `codec` و`bitrate` كمعاملين منفصلين، لكن ضبط معدل مرتفع مع ترميز منخفض الجودة (مثل `mpeg4`) قد لا يحسّن الجودة. كيف توثّق أي توليفات الترميز/المعدل معقولة؟
- `batch_convert` يتخطى بصمت الملفات غير الموجودة في مجموعة الامتدادات. ماذا لو أردت معالجة ملفات `.mp4` أيضًا (إعادة ترميز للجودة)؟ كيف تتجنب إعادة تحويل ملفات بصيغة الهدف أصلًا؟

## ⚠️ المآزق الشائعة

- **ffmpeg غير مثبّت أو ليس على `PATH`.** أخطاء MoviePy لا تقول دائمًا "ffmpeg مفقود" — ربما ترى `OSError` أو `FileNotFoundError` غامضًا على مسار لم تكتبه. شغّل `ffmpeg -version` دائمًا كخطوة تشخيص أولى. يحزم MoviePy 2.x ffmpeg خاصًا به في بعض التثبيتات، لكن تثبيت النظام أكثر موثوقية.
- **نسيان `video.close()`.** كل `VideoFileClip` يفتح عملية فرعية ffmpeg. دون `close()`، تتراكم تلك العمليات — سترى عمليات `ffmpeg` زومبي في مراقب النظام، وسيمسك سكربتك أقفال ملفات تمنع إعادة ترميز الملف نفسه. استخدم كتلة `try/finally` أو مديري سياق إذا عالجت ملفات كثيرة.
- **عدم تطابق دقة التراكب النصي.** `TextClip` يقدّم النص بحجم بكسلي ثابت؛ إذا كان الفيديو 4K (3840×2160) و`font_size=24`، سيكون النص صغيرًا نسبيًا للإطار. قِس حجم `font_size` بـ `video.w / 1920` لإبقاء النص متناسبًا عبر الدقات.
- **`write_videofile` يجمّد السكربت.** الترميز مكثّف بالمعالج ومتزامن — فيديو 10 دقائق قد يستغرق دقائق للترميز. في دفتر Jupyter، يجمّد النواة حتى ينتهي. في خط إنتاج حقيقي، تشغّل الترميز في عملية فرعية أو خيط خلفي.
- **ترميز WebM غير متاح على كل المشغّلات.** VP9 (`libvpx-vp9`) مدعوم على نطاق واسع في المتصفحات لكن ليس في كل مشغّلات الوسائط. إذا كان هدفك مشغّل وسائط (لا متصفحًا)، التزم بـ `libx264` (MP4) — الترميز الأكثر توافقًا عالميًا.

## ما بنيته للتو

مجموعة أدوات معالجة فيديو تغلّف واجهة MoviePy المدعومة بـ ffmpeg في دوال بايثون نظيفة قابلة لإعادة الاستخدام: القص، واستخراج الصوت، وتوليد المصغرات، والتراكبات النصية، وتحويل الصيغ. كل دالة تتعامل مع حالات خطئها بنفسها وتوثّق معاملاتها، فبإمكانك تركيبها في خطوط أنابيب أكبر. تعلمت أيضًا اصطلاح MoviePy الأساسي: حمّل مقطعًا، وطبّق عمليات تعيد مقاطع جديدة، واكتب النتيجة إلى القرص.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/video-processor/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/video-processor) في دورة الكود نسخة أكمل بوظيفة شريط أبرز الملامح (تستخرج عدة مقاطع وتعبّر بينها)، وعلامة مائية متحركة، وواجهة CLI للمعالجة بالجملة. استنسخها، أو افتح الدورة الكاملة في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وشغّلها من هناك.
:::

## إلى أين تذهب من هنا

- ابنِ شريط أبرز الملامح: بمعلومية قائمة طوابع `(start, end)` من فيديو طويل، استخرج كل مقطع، أضف عبورًا 0.5 ثانية بينها، واجمعها في شريط واحد عبر `concatenate_videoclips(method="compose")`.
- أضف علامة مائية متحركة: أنشئ علامة تنزلق ببطء من اليسار إلى اليمين عبر الفيديو باستخدام دالة `make_frame` بحسابات إزاحة x معتمدة على الوقت.
- ابنِ ضاغط فيديو: احسب معدل البت الحالي من حجم الملف والمدّة، واحسب معدل البت المستهدف لحجم مرغوب، وأعد الترميز — وبلّغ نسبة الضغط.

## شارك مشروعك مع الفصل

بنيت شيئًا تفتخر به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع قدمها طلاب آخرون — و README الخاص به يحتوي على دليل كامل ومناسب للمبتدئين لإضافة مشروعك عبر **طلب سحب**، حتى لو لم تستخدم git من قبل: تفرّع المستودع، وإنشاء فرع، وعمل commit لملفاتك، وفتح طلب السحب، خطوة بخطوة. لا يُفترض خبرة git مسبقة.

أهلاً بكتابة بايثون خارج المتصفح. 🎓