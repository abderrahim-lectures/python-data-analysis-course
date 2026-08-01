---
id: 2027-webcam-object-counter
title: "عُدّ الأشياء في الوقت الفعلي باستخدام كاميرا ويب"
sidebar_label: "عدّاد الأشياء بكاميرا الويب"
slug: /projects/webcam-object-counter
description: "عُدّ الأشياء مباشرة من بثّ كاميرا ويب بـOpenCV ونموذج YOLO11n مُدرَّب مسبقًا — أو شغّل نفس الكشف على صورة أو فيديو نموذجي مرفق دون أي كاميرا على الإطلاق."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 عُدّ الأشياء في الوقت الفعلي باستخدام كاميرا ويب

<ProjectPublishedDate projectId="2027-webcam-object-counter" />

<ProjectGreeting />

يفترض هذا المشروع أنك مرتاح مع Python بمستوى 101 — الدوال، والحلقات، وتثبيت الحزم — ولا يحتاج أي خلفية سابقة في تحليل البيانات أو التعلم الآلي. إنها أول غزوة لهذا المساق في الرؤية الحاسوبية: بدلًا من تحميل نموذج مُدرَّب مسبقًا يقرأ نصًا أو صفوفًا جدولية، ستحمّل نموذجًا يقرأ بكسلًا، وتستخدمه للإجابة عن سؤال عملي حقًا في الوقت الفعلي — "كم عدد *هذا* أمام الكاميرا الآن؟"

هذا اختياري وغير مُقيَّم. راجع [مشاريع من العالم الحقيقي](/docs/projects) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. تثبيت `uv` وإعداد مشروع محلي بـOpenCV ونموذج كشف أشياء مُدرَّب مسبقًا.
2. تشغيل الكشف على صورة نموذجية واحدة مرفقة ورسم صناديق إحاطة حول ما يجده.
3. عدّ الأشياء من فئة هدف واحدة (مثل `person`) وطباعة إجمالٍ متنامٍ.
4. معالجة فيديو نموذجي قصير مرفق إطارًا بإطار.
5. توصيل حلقة الكشف نفسها بكاميرا ويب الخاصة بك للعدّ الحي في الوقت الفعلي.

## أين تُشغّل هذا

**محليًا بـ`uv` هو السبيل الوحيد لتجربة كاميرا الويب الحية الكاملة.** كاميرا ويب فيزيائية موصولة بجهازك هي عتاد — لا يوجد طريق من تبويب متصفح يعمل في السحابة إلى كاميرا على مكتبك. تفترض الخطوات 1–5 أدناه هذا المسار، والخطوة 5 تحديدًا لن تعمل ببساطة في أي مكان آخر.

- **GitHub Codespaces** يمنحك بيئة تطوير سحابية بدون أي إعداد (Node، وPython، و`uv` مثبَّتة بالفعل — انظر [`.devcontainer/devcontainer.json`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/.devcontainer/devcontainer.json))، والخطوات 1–4 (الصورة النموذجية، والعدّ، والفيديو النموذجي) تعمل بشكل جيد هناك. الخطوة 5 لن — فمساحة Codespace تعمل على خادم بعيد دون وصول إلى كاميرا ويب المحلية لديك أيضًا.
- **Google Colab أو Kaggle Notebooks أو Binder** مناسبة لنسخة **الصورة-النموذجية-فقط** من هذا المشروع، لا كاميرا الويب الحية. دفتر ملاحظات حقيقي وقابل للتشغيل يحمّل الصور النموذجية المرفقة ويشغّل كود الكشف نفسه موجود في [`examples/webcam-object-counter/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/webcam-object-counter/notebook.ipynb) (سيشير إلى `main` بمجرد الدمج). انقر على شارة لتشغيله مباشرة:

  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/webcam-object-counter/notebook.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/webcam-object-counter/notebook.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fwebcam-object-counter%2Fnotebook.ipynb)

  كن صادقًا مع نفسك حول ما يمنحك إياه هذا: كشف الصور النموذجية فقط، لا بثّ كاميرا حي. إنها طريقة جيدة حقًا لرؤية النموذج يعمل دون أي تثبيت، لكنها ليست نفس مشروع الخطوة 5.

## الإعداد

`uv` أداة واحدة تحلّ محل السلسلة المعتادة "ثبّت Python، ثم ثبّت pip، ثم ثبّت أداة بيئة افتراضية، ثم ثبّت الحزم" — يمكنه تثبيت وإدارة إصدارات Python بنفسه، إلى جانب اعتماديات مشروعك.

**macOS / Linux** (الطرفية):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

أغلق الطرفية وأعد فتحها، ثم أكّد أنه ثُبِّت:

```bash
uv --version
```

ثم أعد إعداد المشروع:

```bash
uv init webcam-object-counter
cd webcam-object-counter
uv add opencv-python ultralytics
```

لا حاجة لأي مفتاح API في أي مكان في هذا المشروع — يعمل الكشف محليًا بالكامل، دون أي خدمة خارجية. انتبه للحجم، مع ذلك: `opencv-python` و`ultralytics` (التي تجرّ معها PyTorch) تحميل حقيقي — توقع أن يستغرق هذا `uv add` بضع دقائق وبضع مئات من الميجابايت من مساحة القرص في المرة الأولى.

:::tip[طريقتان لكشف الأشياء — اختر ما يناسبك]
تشحن OpenCV **تسلسلات Haar** مدمجة — صغيرة وسريعة، بلا تحميل إضافي، لكنها ضيقة: كل تسلسل مُدرَّب لشيء محدد واحد (المثال الكلاسيكي هو `haarcascade_frontalface_default.xml` للوجوه الأمامية) ويعمل أفضل على رؤية أمامية نظيفة إلى حد معقول. يستخدم هذا المشروع بدلًا من ذلك **YOLO11n** عبر حزمة `ultralytics` — نموذج كشف أشياء صغير (بضعة ميجابايت) لكنه حديث حقًا، مُدرَّب مسبقًا على فئات الأجسام اليومية الثمانين لمجموعة بيانات COCO (شخص، وسيارة، وكلب، وحافلة، وكرسي، والمزيد)، يتعرّف على أكثر بكثير من الوجوه ويتعامل مع المشاهد الواقعية الفوضوية بشكل أفضل بكثير. المقايضة الصادقة: YOLO11n تثبيت أكبر وأبطأ قليلًا لكل إطار من تسلسل Haar، لكنه يكشف أشياء حقيقية، لا وجوهًا فقط، وهو بيت القصيد في مشروع "عدّ الأشياء" ذي الأغراض العامة. إذا كنت لا تحتاج إلا إلى كشف الوجوه، فإن تسلسل Haar بديل معقول تمامًا وأخف وزنًا يستحق معرفته.
:::

## الخطوة 1: اكشف الأشياء في صورة نموذجية واحدة

يعيد كل سكربت أدناه استخدام هذه الفكرة الأساسية نفسها. `yolo11n.pt` نقطة تحقق مُدرَّبة مسبقًا — يحمّلها `ultralytics` تلقائيًا في المرة الأولى التي تُنشئ فيها `YOLO(...)`، ويخزّنها محليًا بعد ذلك:

```python
# detect_image.py
import cv2
from ultralytics import YOLO

model = YOLO("yolo11n.pt")

results = model("samples/street.jpg")
result = results[0]

print(f"Detected {len(result.boxes)} object(s):")
for box in result.boxes:
    class_name = model.names[int(box.cls)]
    confidence = float(box.conf)
    print(f"  - {class_name} ({confidence:.0%} confidence)")

annotated = result.plot()  # draws boxes + labels on a copy of the image
cv2.imwrite("output_street.jpg", annotated)
```

```bash
uv run python detect_image.py
```

`model(image_path)` يشغّل خط أنابيب الكشف الكامل في استدعاء واحد: غيّر حجم الصورة، ومرّرها عبر الشبكة، وحوّل المخرجات الخام إلى قائمة صناديق، كل واحد مع تسمية فئة ودرجة ثقة. `result.boxes` هي تلك القائمة — `box.cls` مؤشر فئة داخل `model.names` (قاموس لكل أسماء فئات COCO الثمانين)، و`box.conf` هي ثقة النموذج بأن الصندوق يحتوي فعلًا تلك الفئة. `result.plot()` طريقة ملائمة ترسم كل ذلك على الصورة لك، بحيث لا تضطر إلى كتابة حلقة رسم الصناديق الخاصة بك بـ`cv2.rectangle`.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>تشغيل السكربت يطبع على الأقل جسمًا مكتشفًا واحدًا مع اسم فئة ودرجة ثقة.</StepChecklistItem>
<StepChecklistItem>يوجد `output_street.jpg`، وعند فتحه في عارض صور، يظهر صناديق مرسومة حول أشياء حقيقية في الصورة.</StepChecklistItem>
<StepChecklistItem>تستطيع أن تشرح، في جملة واحدة، ما يمثله كل من `box.cls` و`box.conf`.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

يعيد النموذج درجة ثقة لكل صندوق، لا مجرد نعم/لا "يوجد جسم هنا". إذا صفّيت أي صندوق بثقة أقل من 90%، هل تتوقع أن ترى كشوفات خاطئة أكثر أم كشوفات مفقودة أكثر — وأي من هذين الخطأين يهم أكثر لمشروع بيت قصده *عدّ* دقيق؟

## الخطوة 2: عدّ فئة هدف واحدة واحتفظ بإجمالٍ متنامٍ

كشف كل شيء بداية جيدة، لكن "عدّ الأشياء" عادةً يعني عدّ *نوع واحد* من الأشياء — أشخاص يمشون عبر مدخل، سيارات في موقف، وهكذا:

```python
# count_class.py
from ultralytics import YOLO

model = YOLO("yolo11n.pt")

target_class = "person"
image_paths = ["samples/street.jpg", "samples/people.jpg"]

running_total = 0
for image_path in image_paths:
    result = model(image_path, verbose=False)[0]
    count = sum(1 for box in result.boxes if model.names[int(box.cls)] == target_class)
    running_total += count
    print(f"{image_path}: {count} {target_class}(s) -- running total: {running_total}")

print(f"\nTotal {target_class}(s): {running_total}")
```

```bash
uv run python count_class.py
```

العدّ مجرد تصفية-وجمع فوق `result.boxes`، مقارنًا اسم فئة كل صندوق بالذي يهمك. يخفت `verbose=False` تسجيل `ultralytics` الخاص بكل استدعاء لكي لا تُدفن عبارات `print` الخاصة بك تحته.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يطبع السكربت عددًا لكل صورة وإجماليًا متناميًا لا يرتفع إلا صعودًا.</StepChecklistItem>
<StepChecklistItem>تغيير `target_class` إلى فئة COCO مختلفة (مثل `"bus"`) يغيّر الأعداد المطبوعة وفقًا لذلك.</StepChecklistItem>
<StepChecklistItem>تفهم لماذا يعيد هذا استخدام `model.names[int(box.cls)]` بدلًا من ترميز رقم مؤشر فئة.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

إذا وقف شخصان في صورة متقاربين جدًا بحيث تتداخل صناديق إحاطتهما تقريبًا بالكامل، فهل هناك أي طريقة واقعية يمكن أن يعدّ بهما هذا النهج ناقصًا أو زائدًا؟ ماذا ستنظر إليه في `result.boxes` للتحقق؟

## الخطوة 3: عالج فيديو نموذجيًا قصيرًا إطارًا بإطار

الفيديو مجرد تسلسل من الصور — نفس كود الكشف لكل صورة بالضبط من الخطوتين 1–2، يُشغَّل مرة واحدة لكل إطار في حلقة:

```python
# detect_video.py
import cv2
from ultralytics import YOLO

model = YOLO("yolo11n.pt")
target_class = "person"

cap = cv2.VideoCapture("samples/sample_street.mp4")
fps = cap.get(cv2.CAP_PROP_FPS) or 15
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
writer = cv2.VideoWriter("output_video.mp4", cv2.VideoWriter_fourcc(*"mp4v"), fps, (width, height))

while True:
    ok, frame = cap.read()
    if not ok:
        break  # end of the video file, not a broken camera

    result = model(frame, verbose=False)[0]
    count = sum(1 for box in result.boxes if model.names[int(box.cls)] == target_class)

    annotated = result.plot()
    cv2.putText(annotated, f"{target_class}s: {count}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
    writer.write(annotated)

cap.release()
writer.release()
```

```bash
uv run python detect_video.py
```

يقرأ `cv2.VideoCapture` ملف فيديو (أو، في الخطوة 4، كاميرا حية) إطارًا واحدًا في كل مرة عبر `.read()`، التي تعيد `(ok, frame)` — يكون `ok` هو `False` بمجرد عدم وجود أطر بعد. `cv2.VideoWriter` هو الفكرة نفسها بالعكس: إنه يراكم الأطر التي تسلّمها له في ملف فيديو جديد. لاحظ أن `if not ok: break` هنا تعني "انتهى الملف" — تعيد الخطوة 4 استخدام هذا الفحص نفسه بالضبط، لكنه هناك يعني شيئًا مختلفًا بأهمية.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يوجد `output_video.mp4` ويُشغَّل، ويُظهر صناديق إحاطة وعددًا حيًا متراكبًا على كل إطار.</StepChecklistItem>
<StepChecklistItem>تستطيع أن تشرح ماذا تُعيد `cap.read()` ولماذا تفحص الحلقة `ok` قبل استخدام `frame`.</StepChecklistItem>
<StepChecklistItem>لاحظت أن العدد يمكن أن يومض من إطار لآخر حتى لو لم يتغير شيء في المشهد بشكل مرئي.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

العدد الذي تطبعه هو لقطة لكل إطار، لا إجماليًا لكل فيديو — تمرير نفس الشخص أمام الكاميرا لثلاث ثوانٍ قد يُعدّ في كل إطار. ماذا سيتطلب "عدّ كم شخصًا *مميزًا* عبر الإطار"، إلى جانب ما يفعله هذا السكربت حاليًا؟

## الخطوة 4: انطلق مباشرًا مع كاميرا الويب الخاصة بك

نفس الحلقة، سطر واحد مختلف: بدّل مسار ملف الفيديو بـ`0`، مؤشر الكاميرا الافتراضية لجهازك:

```python
# detect_webcam.py
import cv2
from ultralytics import YOLO

model = YOLO("yolo11n.pt")
target_class = "person"

cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("Could not open the webcam. Check that one is connected, that no other "
          "app is using it, and that this program has camera permission.")
else:
    print("Webcam opened. Press 'q' in the video window to quit.")
    while True:
        ok, frame = cap.read()
        if not ok:
            print("Lost the camera feed. Stopping.")
            break

        result = model(frame, verbose=False)[0]
        count = sum(1 for box in result.boxes if model.names[int(box.cls)] == target_class)

        annotated = result.plot()
        cv2.putText(annotated, f"{target_class}s: {count}", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.imshow("Webcam Object Counter (press q to quit)", annotated)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()
```

```bash
uv run python detect_webcam.py
```

يفتح `cv2.VideoCapture(0)` كاميرتك الافتراضية بنفس الطريقة التي فتح بها `VideoCapture("some_file.mp4")` ملفًا في الخطوة 3 — نفس حلقة `.read()`، نفس شكل `(ok, frame)`. الفرقان المهمان: `.isOpened()` يُفحص *مقدمًا* هنا، بما أن "لا توجد كاميرا ويب متاحة" فشل حقيقي وشائع يجب أن يُنتج رسالة واضحة بدلًا من انهيار محيّر في عمق الحلقة؛ وبمجرد التشغيل، تحوّل `ok` إلى `False` في منتصف الحلقة يعني أن اتصال الكاميرا فُقد (فُصلت، أو سُحبت الصلاحية)، لا "وصلت إلى النهاية"، بما أن الكاميرا الحية لا نهاية لها. يفتح `cv2.imshow` نافذة حية — نافذة واجهة رسومية حقيقية، لذا لن يُنتج هذا السكربت مخرجات مرئية في طرفية بعيدة بسيطة دون شاشة.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>تُفتح نافذة تُظهر بثّ كاميرا الويب الحي الخاص بك مع صناديق إحاطة وعددًا متناميًا مرسومين عليها.</StepChecklistItem>
<StepChecklistItem>رفع عدد مختلف من الجسم الهدف (مثل نفسك، ثم نفسك وشخص ثانٍ) يغيّر العدد المطبوع/الظاهر على الشاشة وفقًا لذلك.</StepChecklistItem>
<StepChecklistItem>فصل الكاميرا أو تغطيتها أثناء التشغيل يُنتج رسالة "فُقد بثّ الكاميرا"، لا تعليقًا صامتًا.</StepChecklistItem>
<StepChecklistItem>الضغط على "q" يغلق النافذة بنظافة بدلًا من الحاجة إلى إجبار-إغلاق.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

تستخدم الخطوتان 3 و4 `if not ok: break` في نفس الموضع تمامًا في الكود، لكن هذا السطر يعني شيئًا مختلفًا في كل منهما ("نهاية الملف" مقابل "مشكلة في الكاميرا"). لماذا يستحق كتابة رسالة مميزة لكل حالة في الكود الحقيقي، بدلًا من معاملة كلتيهما كخطأ عام واحد؟

## ⚠️ مآزق شائعة

- **رُفض إذن كاميرا الويب.** تطلب macOS وWindows الوصول إلى الكاميرا في المرة الأولى التي يحاول فيها تطبيق استخدامها — إذا تجاهلت تلك المطالبة (أو ظهرت خلف نافذة أخرى)، سيعيد `cv2.VideoCapture(0).isOpened()` قيمة `False` حتى مع كاميرا تعمل بشكل مثالي. تحقق من إعدادات خصوصية الكاميرا في نظام تشغيلك لتطبيق الطرفية أو مترجم Python خاصتك تحديدًا.
- **التشغيل الأول بطيء ويحتاج اتصالًا بالإنترنت.** يحمّل `ultralytics` ملف `yolo11n.pt` من خوادم Ultralytics في المرة الأولى التي تُنشئ فيها `YOLO(...)` — بعد ذلك يُخزَّن محليًا (عادةً تحت `~/.cache` أو الدليل الحالي) وكل تشغيل لاحق دون اتصال بالكامل. إذا بدا أن التشغيل الأول علق، فالأرجح أنه ما زال يحمّل، لا عالق.
- **الخلط بين "لم يُكتشف أي جسم" و"الكاميرا لا تعمل".** يبدوان متطابقين للوهلة الأولى — عدد فارغ في كلتا الحالتين — لكن لهما إصلاحين مختلفين تمامًا. افحص `cap.isOpened()` وما إذا كان `cv2.imshow` يُظهر صورة حية على الإطلاق *قبل* القلق حول سبب كون العدد صفرًا؛ بثّ يعمل مع عدد فارغ حقًا (لا يوجد في الإطار ما يطابق فئة هدفك) ليس خطأ.
- **عدم تطابق مؤشر الكاميرا على أجهزة بأكثر من كاميرا.** يفتح `VideoCapture(0)` الكاميرا التي يعتبرها نظام تشغيلك الافتراضية، وهي ليست دائمًا التي تتوقعها على حاسوب محمول مع كاميرا ويب خارجية موصولة — جرّب `1`، و`2`، إلخ إذا كان `0` يفتح الخاطئة.

## ما بنيته للتو

خط أنابيب رؤية حاسوبية حقيقي وعامل: حمّل نموذجًا مُدرَّبًا مسبقًا، وشغّله على بكسل بدلًا من صفوف أو نص، وحوّل مخرجاته الخام (صناديق، ومؤشرات فئة، ودرجات ثقة) إلى شيء يريده شخص فعليًا — عدًّا حيًا لنوع محدد من الأشياء. نفس الشكل المكوّن من ثلاث خطوات (كشف لكل صورة → تصفية إلى فئة واحدة → حلقة على الأطر) يتدرج من صورة واحدة إلى بثّ كاميرا حي حقًا مع تغيّر مصدر الإدخال فقط.

:::tip[هذا يُعمَّم أبعد من "عدّ الأشياء"]
كل شيء هنا — كاشف مُدرَّب مسبقًا، حلقة على الأطر، عدّ متنامٍ — هو أيضًا العمود الفقري لأشياء مثل حساسات عدّ الأشخاص عند مداخل المتاجر، وكاميرات عدّ المرور الأساسية، وعدّادات الأنواع في كاميرات الفخ في الحياة البرية. منطق العدّ في الخطوة 2 مبسَّط عمدًا (بلا تتبع للأجسام بين الأطر، لذا فالشخص الذي يقف ثابتًا لعشرة أطر يُعدّ في العشرة جميعًا)، وهو تبسيط صادق، لا خطأ مخفي — انظر قسم "إلى أين تذهب من هنا" لما تضيفه الأنظمة الحقيقية فوقه.
:::

## إلى أين تذهب من هنا

- **تتبع الأشياء، لا الكشف فقط.** يشير السؤال السقراطي في الخطوة 3 إلى الفجوة الحقيقية: يعدّ هذا المشروع الأشياء *لكل إطار*، لا أشياء مميزة *عبر* الفيديو. مكتبات مثل وضع التتبع المدمج الخاص بـ`ultralytics` نفسه (`model.track(...)`، باستخدام خوارزميات مثل ByteTrack) تُسند معرّفًا دائمًا لكل جسم عبر الأطر، لذا تصبح "كم شخصًا *مميزًا* عبر الإطار" قابلة للإجابة بدلًا من مجرد "كم في الإطار الآن؟"
- **نموذج أكبر وأدق.** يتاجر `yolo11n.pt` (علامة "n" تعني nano) ببعض الدقة مقابل السرعة والحجم. يشحن `ultralytics` نقاط تحقق أكبر (`yolo11s.pt`، و`yolo11m.pt`، وما فوق) تكشف بشكل أكثر موثوقية، خاصةً على الأجسام الصغيرة أو المغطاة جزئيًا، على حساب الحاجة لحوسبة أكثر لكل إطار — يستحق التجربة إذا بدت أعداد الخطوة 4 الحية غير موثوقة على إعدادك الخاص.
- **فئة مخصصة، لا فئات COCO الثمانين فقط.** يتعرّف YOLO11n فقط على ما تدرب عليه. الضبط الدقيق لنموذج YOLO على صورك المصنفة الخاصة (نسخة أصغر بكثير من الفكرة نفسها كـ[مشروع Fine-tune a Small Language Model](/docs/projects/finetune-llm-unsloth)) يتيح لك عدّ شيء لم تضمّنه COCO أبدًا — منتج محدد على رف، أداة محددة، أي شيء يمكنك تصنيف بضع مئات من الأمثلة منه.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓

<ProjectProgressCheckbox projectId="2027-webcam-object-counter" />
