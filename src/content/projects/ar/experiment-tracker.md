---
title: "متتبع التجارب"
description: "تتبع تجارب التعلم الآلي مع المقاييس والمعلمات والمخرجات ولوحات المقارنة."
difficulty: "intermediate"
estimatedMinutes: 70
tags: ["cli", "json", "dataclasses", "logging"]
prerequisites:
  - "أساسيات Python (القوائم، القواميس، الدوال، الصفوف)"
  - "الراحة في التعامل مع الملفات وتشغيل السكربتات في الطرفية"
learningObjectives:
  - "نمذجة تجربة جارية كصف بيانات (dataclass)"
  - "إلحاق التجارب بسجل JSONL مع حارس تكرار المعرفات"
  - "ترتيب التجارب واختيار الأفضل لكل مقياس عبر جدول اتجاهات"
  - "تسجيل ملفات المخرجات بملخصات SHA-256"
  - "تشغيل أوامر الإضافة/العرض/الأفضل من واجهة سطر أوامر صغيرة"
---

# 🧪 أنشئ متتبع تجارب

«أي نموذج فاز؟» هو السؤال المتكرر في أي مشروع يدرب النماذج ، وملف `results.txt` عادٍ لا يستطيع الإجابة عنه: نفس اسم التجربة، أعد تشغيلها مرتين، أعمدة معدّلة، فتدور الإجابة مع ما كتبه أحدهم آخر مرة. يبني هذا المشروع البديل الأمين: سجل `runs.jsonl` حيث كل تجربة صف بيانات (نموذج، مقياس، قيمة، مسار مخرجات)، ومعرفات التكرار تُرفض عند الباب، وأفضل تجربة لكل مقياس تأتي من جدول اتجاهات («رمسه أقل أفضل، الدقة أعلى أفضل»)، والمخرجات تحصل على بصمة SHA-256 يمكنك التحقق منها لاحقًا، وواجهة سطر أوامر بخمسة أوامر (`add`، `list`، `best`) تجعل كل ذلك يبدو أداة حقيقية. كل شيء مكتبة قياسية وقائم على الملفات ، لا قاعدة بيانات ولا مكتبة تعلم آلي مطلوبة.

هذا يفترض أساسيات Python ، القوائم والقواميس والدوال ، إضافة إلى صفوف البيانات (`from dataclasses import dataclass`) وارتياحًا في التعامل مع الملفات. المشروع اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة والمتنامية.

## 🎯 ما ستفعله

1. تعرّف صف بيانات `Run` وترى سجًلا حقيقيًا واحدًا.
2. تلحق التجارب بـ JSONL مع حارس معرفات التكرار الذي يمنع إعادة التسجيل.
3. تعرض كل التجارب وتختار الأفضل لمقياس ما باستخدام جدول اتجاهات.
4. تحسب بصمة SHA-256 لملف مخرجات وتنسخه إلى المستودع.
5. تربط كل ذلك بواجهة سطر أوامر وتسجّل منافسة بين ثلاثة نماذج.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الموصى به ، سجل التجارب أداة مخرجاتها ملفات (قليل داخلي وخارج، `runs.jsonl` خارج)، وملفاتها تخص طرفيتك.

**GitHub Codespaces** بديل بلا إعداد: افتح [مستودع الدورة كاملًا في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython مثبتان مسبقًا) وشغّل الأوامر نفسها من طرفية المتصفح.

**Google Colab أو Kaggle Notebooks أو Binder** كلها تعمل ، دفتر [`examples/experiment-tracker/notebook.ar.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/experiment-tracker/notebook.ar.ipynb) يشغّل المتتبع على سجلات بنمط `runs.jsonl` في الذاكرة وبالشكل نفسه.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/experiment-tracker/notebook.ar.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/experiment-tracker/notebook.ar.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fexperiment-tracker%2Fnotebook.ar.ipynb)

## الإعداد

`uv` أداة واحدة تحل محل «ثبّت Python، ثم pip، ثم أداة البيئة الافتراضية» ، وهذا المشروع مكتبة قياسية خالصة.

**macOS / Linux** (الطرفية):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

أغلق طرفيتك وأعد فتحها، ثم تأكد من تثبيته:

```bash
uv --version
```

ثم أعدّ المشروع:

```bash
uv init experiment-tracker
cd experiment-tracker
```

**✅ قائمة التحقق**

- ✅ يطبع `uv --version` رقم إصدار.
- ✅ يوجد `experiment-tracker/` مع `pyproject.toml`.
- ✅ ينجح `python -c "import json, hashlib, shutil"` ، مكتبة قياسية لا شيء لتثبيته.

## الخطوة 1: صمم تجربة كصف بيانات

مفردات المتتبع سجل واحد: **تجربة** ، نموذج واحد + مجموعة بيانات واحدة + نتيجة واحدة. تخزينها كقاموس عادي يعمل، لكن `@dataclass` يمنحك الحقول كـ*خصائص مصنّفة*: `run.model` بدلًا من `run["model"]`، وقائمة مطلوبة على الصف، و`repr` مجاني للطباعة. حقل `sha256` له قيمة افتراضية `""` حتى يمكن إنشاء تجربة قبل أن يكون لها ملخص مخرجات حقيقي.

### 1.1 عرّف سجل Run

**👟 تلميح البداية :** `@dataclass` فوق صف من الحقول؛ و`asdict(run)` لاحقًا سيسلّمها إلى `json.dumps`:

```python
# tracker.py
import json
from dataclasses import asdict, dataclass
from pathlib import Path

LOG_FILE = "runs.jsonl"

@dataclass
class Run:
    run_id: str
    model: str
    metric: str
    value: float
    artifact: str
    sha256: str = ""

if __name__ == "__main__":
    run = Run("run_001", "ridge", "rmse", 3.42, "artifacts/run_001.joblib")
    print(run)
    print(run.model, run.value)
```

شغّله:

```bash
uv run tracker.py
```

يؤدي صف البيانات عملًا هيكليًا هادئًا: `value: float` تعني أن تجربة تحمل `value="3.42"` (سلسلة) مكتوبة بنوع خاطئ عند الإنشاء، و`sha256: str = ""` توثق حالة «لم تُبصم بعد» عن قصد، و`print(run)` يعرض السجل كاملًا بطريقة يطبعها القاموس العادي بشكل غير مباشر. بناء المفردات كنوع ، لا كتعليق ، يعني أن كل دالة لاحقة (`log_run`، `best_run`) تسمّي توقعاتها في التوقيع.

**🎯 الناتج المتوقع :**

```
Run(run_id='run_001', model='ridge', metric='rmse', value=3.42, artifact='artifacts/run_001.joblib', sha256='')
ridge 3.42
```

**🩹 إذا لم يعمل :** إذا أثار `print(run)` خطأ ترتيب المواضع، فحقول صف البيانات مُعلنة بترتيب مختلف عن ترتيب استدعاء المنشئ ، الترتيب مهم دون وسائط مفتاحية. إذا كان `run.model` يعطي `AttributeError`، فالصف غير مُزيَّن فعلًا (سطر `@dataclass` مفقود فوق `class Run`).

### 1.2 تحقّق من شكل السجل

**✅ قائمة التحقق**

- ✅ `run.run_id` و`run.model` و`run.metric` و`run.value` و`run.artifact` كلها تُستدعى بسلاسة.
- ✅ `run.sha256 == ""` افتراضيًا ، تعمل إشارة «غير المسجّل».
- ✅ يرجع `asdict(run)` قاموسًا عاديًا بالحقول الستة، جاهزًا لـ JSON.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- ستة خصائص اليوم. ماذا سيفعل حقل *سابع* ، `timestamp`، أو `params` كقاموس متداخل ، بصف البيانات هذا، ولماذا ينجو JSONL من التغيير بينما لا ينجو CSV ذو الأعمدة الثابتة؟
- `value: float` يفرض رقمًا، لكنه لا يحدد أي مقياس هو ، `metric` حقل شقيق، لا نوع. أين الخط الذي يصبح فيه *صف لكل مقياس* (RmsRun، AccuracyRun) أفضل من حقل عام، وماذا ينكسر عندما تعبره (أمر add، المقارنة)؟

## الخطوة 2: سجّل التجارب في JSONL مع حارس تكرار

السجل الذي يقبل نفس التجربة مرتين سجل يكذب ، «run_001 ridge» ثم يعلن «run_001 ridge أفضل!» مرتين والجميع يثق بعداد مضاعف. JSONL (JSON لكل سطر) هو الصيغة الملائمة للإلحاق: يقرأ `log_run` السجل الحالي، ويستنتج ما إذا كان `run_id` موجودًا، و**يثير خطأً** إن كان كذلك. إلحاق سطر واحد ذرّي على مستوى الملف ويسلم من `Ctrl+C`.

### 2.1 اكتب المسجِّل وأثبت الحارس

**👟 تلميح البداية :** يقرأ `load_runs` كل سطر موجود؛ ويتحقق `log_run` من التكرار *قبل* الإلحاق بـ `"a"` (وضع الإلحاق):

```python
# tracker.py
import json
from dataclasses import asdict, dataclass
from pathlib import Path

LOG_FILE = "runs.jsonl"

@dataclass
class Run:
    run_id: str
    model: str
    metric: str
    value: float
    artifact: str
    sha256: str = ""

def load_runs(path: str = LOG_FILE) -> list[Run]:
    if not Path(path).exists():
        return []
    return [Run(**json.loads(line)) for line in
            Path(path).read_text().splitlines() if line.strip()]

def log_run(run: Run, path: str = LOG_FILE) -> None:
    if any(r.run_id == run.run_id for r in load_runs(path)):
        raise ValueError(f"duplicate run_id: {run.run_id}")
    with open(path, "a") as f:
        f.write(json.dumps(asdict(run)) + "\n")

if __name__ == "__main__":
    log_run(Run("run_001", "ridge", "rmse", 3.42, "artifacts/run_001.joblib"))
    log_run(Run("run_002", "lasso", "rmse", 4.05, "artifacts/run_002.joblib"))
    print(Path("runs.jsonl").read_text())
    try:
        log_run(Run("run_001", "ridge", "rmse", 3.42, "artifacts/run_001.joblib"))
    except ValueError as e:
        print("duplicate blocked:", e)
    print("loaded runs:", [r.run_id for r in load_runs()])
```

يرجع `load_runs` القيمة `[]` عند غياب الملف ، دليل تجارب *بلا* سجل بعد أمر مشروع لا خطأ. `Run(**json.loads(line))` يفك كل كائن JSON مباشرة إلى صف البيانات، فالتسلسل وإلغاء التسلسل كلٌّ منهما سطر واحد في اتجاهين متعاكسين. يقرأ الحارس السجل *كاملًا* أولًا ، O(n) لكل إلحاق، صحيح لمئات التجارب بمقياس الدفاتر ، و`any(...)` يقصر الدورة عند أول تطابق `run_001`. كتلة `try/except` في العرض التجريبي مقصودة: الرفض *مسموع* (`duplicate blocked:`)، لا استبدال صامت ولا صف مكرر أبدًا.

**🎯 الناتج المتوقع :**

```
{"run_id": "run_001", "model": "ridge", "metric": "rmse", "value": 3.42, "artifact": "artifacts/run_001.joblib", "sha256": ""}
{"run_id": "run_002", "model": "lasso", "metric": "rmse", "value": 4.05, "artifact": "artifacts/run_002.joblib", "sha256": ""}

duplicate blocked: duplicate run_id: run_001
loaded runs: ['run_001', 'run_002']
```

**🩹 إذا لم يعمل :** إذا ألحق ثاني `log_run("run_001")` بدلًا من أن يثير خطأً، فشرط `if any(...)` يثير فقط لتطابق *دقيق* ، تحقق أن `r.run_id == run.run_id` هي المقارنة وأن `load_runs(path)` يتلقى نفس `path`. إذا أثار `Run(**json.loads(line))` خطأ نوع، فبعض الأسطر ليس كائن JSON (السطر الفارغ الشارد يعالجه `if line.strip()`، لكن `{"run_id"` مقطوعًا من انهيار لا يعالج ، احذف ذلك السطر يدويًا).

### 2.2 تحقّق من المسجِّل

**✅ قائمة التحقق**

- ✅ أول تشغيل لـ `tracker.py` ينشئ `runs.jsonl` بسطرين؛ وإعادة تشغيل أول مرة تُحجب لا تُضاعف.
- ✅ `loaded runs: ['run_001', 'run_002']` ، جولة إلغاء التسلسل تعمل نظيفة.
- ✅ `LOG_FILE` ثابت على مستوى الوحدة ، تغيير اسم الملف تعديل واحد يُستخدم في كل مكان.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- الحارس O(n) ، يقرأ السجل كاملًا لكل إلحاق. عند أي عدد من التجارب يصبح ذلك بطيئًا بما يكفي ليهمّ، وما التحسين من سطرين (`run.ids in {r.run_id for r in load_runs()}` ، التكلفة نفسها وقصة مختلفة) مقابل ملف تجزئة مسبق؟
- `log_run` *يثير خطأً* عند التكرار. سمِّ سير عمل واحدًا يكون فيه الرفع هو الرفض الصحيح (حارس إعادة التشغيل) وآخر يكون فيه المعرف المكرر يجب أن *يستبدل* السطر القديم (إعادة تشغيل بقيمة `value` جديدة) ، وماذا يحتاج الثاني مما لا يملكه `add`.

## الخطوة 3: اعرض التجارب واختر الأفضل

الآن يجيب المتتبع عن سؤاله المركزي. يطبع `report` كل تجربة؛ ويأخذ `best_run` مقياسًا ويرجع الفائز ، لكن «الأفضل» يحتاج *اتجاهًا*: rmse أدناه أفضل، والدقة أعلاها أفضل. يحوّل جدول `BEST_DIRECTION` ذلك الحكم إلى بيانات، فيسقط `min` مقابل `max` من استعلام واحد بدلًا من إعادة تقريره في كل موضع استدعاء.

### 3.1 اكتب الترتيب

**👟 تلميح البداية :** فلتر إلى المقياس أولًا، ثم `min(...) if direction == "min" else max(...)` ، الشكل نفسه بمقبض واحد:

```python
# rank.py
from tracker import Run, load_runs

BEST_DIRECTION = {"rmse": "min", "mae": "min", "accuracy": "max"}

def report(runs: list[Run]) -> None:
    for r in runs:
        print(f"  {r.run_id}  {r.model:<18} {r.metric}={r.value:.2f}")

def best_run(runs: list[Run], metric: str) -> Run | None:
    candidates = [r for r in runs if r.metric == metric]
    if not candidates:
        return None
    is_min = BEST_DIRECTION[metric] == "min"
    return (min if is_min else max)(candidates, key=lambda r: r.value)

if __name__ == "__main__":
    runs = load_runs()
    report(runs)
    best = best_run(runs, "rmse")
    print("best:", best.run_id, best.model, best.value)
```

يقوم `best_run` بمهمتين مستقلتين بالترتيب: **التصفية** إلى تجارب المقياس نفسه (حتى لا تتنافس تجربة `accuracy` مع تجربة `rmse`)، ثم **الاختيار** بجدول الاتجاهات. يعلن `| None` في نوع الإرجاع الحالة الفارغة على أنها خاطئة عن قصد ، مقياس بلا تجارب يرجع `None` ولا ينهار `max([])` أبدًا. `report` عرض فقط: السجلات نفسها، بلا تعديل ولا إعادة ترتيب.

**🎯 الناتج المتوقع :**

```
  run_001  ridge              rmse=3.42
  run_002  lasso              rmse=4.05
best: run_001 ridge 3.42
```

**🩹 إذا لم يعمل :** إذا اختار «الأفضل» `run_002` (الأكبر)، فـ `is_min` مقلوب ، `BEST_DIRECTION[metric] == "max"` كان سيختار الأكبر لـ rmse. إذا انهار على مقياس فارغ، فحارس `if not candidates: return None` مفقود تحت التصفية.

### 3.2 تحقّق من الترتيب

**✅ قائمة التحقق**

- ✅ يرجع `best_run(load_runs(), "rmse")` run_001 (3.42 < 4.05).
- ✅ يطبع `report` التجربتين مع `metric=value` محاذًى لمنزلتين عشريتين.
- ✅ إضافة `Run("x", "...", "accuracy", 0.9, ...)` تجعل `best_run(..., "accuracy")` تختار *الأكبر* ، الاتجاه محترم.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- «الأفضل» يعتمد على المقياس *والاتجاه* ، جدول قد ينساه المستدعي (`BEST_DIRECTION[metric]` يعطي `KeyError` لمقياس غير متتبَّع). ماذا *يعلم* `KeyError` هنا المشغِّل مقابل `min` خاطئ صامت، وأين يجب أن يظهر مقياس مجهول (تحقق عند وقت `add`)?
- التعادلات صامتة: تجربتان بنفس `value` ترجع الأولى أوّلاً في السجل. إذا كان كاسر التعادل يجب أن يكون *التجربة الأحدث*، فما الحقل الذي يحتاجه السجل، وما الذي تصبح عليه تركيبة التصفية؟

## الخطوة 4: بصّم وسجّل المخرجات

النتائج تكذب وحدها. «rmse 3.42» لا تعني شيئًا إذا قال السجل غدًا الرقم نفسه لملف pickle *مختلف*. الإصلاح **بصمة**: يجزّئ `sha256_of` ملف المخرجات إلى ملخص من 64 حرفًا سداسيًا، مخزَّنًا *على سجل التجربة*. لاحقًا، إعادة تجزئة `artifacts/run_002.joblib` ومقارنتها مع الملخص المسجَّل تخبرك فورًا ما إذا كان الملف قد مُسَّ منذ التسجيل.

### 4.1 جزّئ مخرجات مرشحة

**👟 تلميح البداية :** `hashlib.sha256(Path(path).read_bytes()).hexdigest()` ، محتوى يدخل، و64 حرفًا سداسيًا تخرج:

```python
# artifacts.py
import hashlib
import shutil
from pathlib import Path

def sha256_of(path: str) -> str:
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

if __name__ == "__main__":
    src = "candidates/ridge.joblib"
    print("sha256 of artifact:", sha256_of(src))
    shutil.copy(src, "artifacts/run_candidate.joblib")
    print("copied:", Path("artifacts/run_candidate.joblib").exists())
    print("same digest after copy:",
          sha256_of(src) == sha256_of("artifacts/run_candidate.joblib"))
```

يقرأ `read_bytes()` الملف كاملًا إلى بايتات ، جيد لنموذج متسلسل، إنه الحدس الصحيح لفحص التكامل. تجزئة *بعد* `shutil.copy` تثبت خاصية تستحق المعرفة: **النسخ يحافظ على المحتوى**، فالملخص مستقر عبر حدود المستودع. سلسلة الـ 64 حرفًا السداسية هي توقيع محتوى الملف *نفسه*: غيّر بايتًا واحدًا من الـ pickle وتتغير البصمة فورًا (تأثير الانهيار)، وعمليًا ، الملخصات المتطابقة تعني ملفات متطابقة بايتًا ببايت.

**🎯 الناتج المتوقع :**

```
sha256 of artifact: ff863fe836434899105f08c56435c6bd35561416798f30465ccd22653e9ec950
copied: True
same digest after copy: True
```

**🩹 إذا لم يعمل :** إذا طبع الملخص أقل من 64 حرفًا، فـ `hexdigest()` استُبدل بعرض مقتطع (`digest()[:16]`) في مكان ما. إذا كانت `copied: False`، فلم يكن `artifacts/` موجودًا قبل النسخ ، `Path("artifacts").mkdir(exist_ok=True)` يجب أن يسبق `shutil.copy`، أو يفشل النسخ على دليل مفقود.

### 4.2 تحقّق من التجزئة

**✅ قائمة التحقق**

- ✅ `ff863fe8...e9ec950` ، الملخص *ليس* عشوائيًا: إنه SHA-256 لتلك السلسلة البايتية بالضبط، قابل لإعادة الإنتاج عبر الأجهزة.
- ✅ ملخص النسخة يطابق ملخص المصدر ، مساران، محتوى واحد.
- ✅ تحرير بايت واحد من المخرجات يغيّر الملخص كليًا ، فحص «المُمس؟» يعمل.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- الملخص يعيش *بجوار* المخرجات (في السجل). مهاجم يستطيع تحرير `run_002.joblib` يستطيع تحرير `runs.jsonl` أيضًا ، سلاسل التجزئة في المجلد نفسه «مسرح إثبات». ما الترقية من خطوة واحدة (تخزين الملخص في ملف `.sha256` منفصل لا تعيد توليده) وضعفها المتبقي؟
- التجزئة تقرأ الملف كاملًا. لملف أوزان حجمه 4 جيجابايت فهذا قراءة قرص كاملة لكل تسجيل ، مقبولة مرة واحدة. أين الخط الذي تتفوق فيه التجزئة المتزايدة لكل جزء (القراءة بشرائح 1 ميجابايت) على `read_bytes()` أحادية اللقطة؟

## الخطوة 5: اربطها بواجهة سطر أوامر

الخطوة الأخيرة تربط كل شيء في أداة يمكنك تشغيلها فعلًا: `add RIDGE RMSE 3.42 candidates/ridge.joblib` تسجّل تجربة (تنسخ المخرجات وتحسب بصمتها)، و`list` تطبع الجدول، و`best rmse` تتوّج الفائز. شريحة الأنابيب الرشيقة ، وسائط أقل، والقراءة من السجل، وجدول الاتجاهات ، تعيش في `cli.py`، مستوردةً المتتبع ومعيدةً استخدام كل ما بُني أعلاه.

### 5.1 اكتب واجهة سطر الأوامر

**👟 تلميح البداية :** `sys.argv[1:]` يفصل اسم البرنامج؛ وكل فرع `cmd` عملية واحدة:

```python
# cli.py
import hashlib
import shutil
import sys
from pathlib import Path

from tracker import Run, load_runs, log_run

ART_DIR = "artifacts"
BEST = {"rmse": "min", "mae": "min", "accuracy": "max"}

def digest(path: str) -> str:
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def register(model: str, metric: str, value: float, src: str) -> Run:
    run_id = f"run_{len(load_runs()) + 1:03d}"
    Path(ART_DIR).mkdir(exist_ok=True)
    dest = f"{ART_DIR}/{run_id}.joblib"
    shutil.copy(src, dest)
    run = Run(run_id, model, metric, value, dest, digest(dest))
    log_run(run)
    return run

if __name__ == "__main__":
    cmd, *args = sys.argv[1:]
    if cmd == "add":
        run = register(args[0], args[1], float(args[2]), args[3])
        print(f"registered {run.run_id} ({run.model}) sha256={run.sha256[:16]}...")
    elif cmd == "list":
        for r in load_runs():
            print(f"{r.run_id:<9} {r.model:<18} {r.metric:<10} {r.value:>8.3f}  {r.artifact}")
    elif cmd == "best":
        cand = [r for r in load_runs() if r.metric == args[0]]
        if not cand:
            print(f"no runs tracked for metric {args[0]}")
        else:
            key = BEST[args[0]]
            best = min(cand, key=lambda r: r.value) if key == "min" \
                else max(cand, key=lambda r: r.value)
            print(f"best {args[0]} ({key}): {best.run_id} {best.model} = {best.value:.3f}")
    else:
        print("usage: cli.py add MODEL METRIC VALUE ARTIFACT | list | best METRIC")
```

`register` هو المكان الوحيد الذي *يُنشئ* حالة: يرقّم التجربة من طول السجل (`run_003` بعد تجربتين)، وينسخ المرشح إلى `artifacts/` تحت اسم التجربة، ويجزّئ *النسخة المخزّنة* (`digest(dest)`، لا المصدر ، الموجود يُبصم)، ويستدعي `log_run` الحارس من الخطوة 2. يحرص أمر `best` في الواجهة على الحالة الفارغة للمقياس («no runs tracked for rmse» تعامل مقياسًا غير متتبَّع بأدب) ويطبع الاتجاه مع الفائز ليرى المشغِّل *السبب* (`best rmse (min)`).

### 5.2 نفّذ منافسة النماذج الثلاثة

**👟 تلميح البداية :** من سجل نظيف، ثلاثة ملفات مرشحة في `candidates/`، ثم ثلاثة `add`s، و`list`، والتتويج (يحافظ `runs.jsonl` الجديد على ترقيم التجارب بدءًا من `run_001` ، في دليلك الخاص ستتخطى السطر الأول، لأن حارس التكرار يحميه على أي حال):

```bash
rm -f runs.jsonl
mkdir -p candidates artifacts
printf 'serialized ridge weights [0.2, -0.1, 0.4]'  > candidates/ridge.joblib
printf 'serialized lasso weights [0.1, 0.3]'        > candidates/lasso.joblib
printf 'serialized gb weights   [0.15, -0.2, 0.5]'  > candidates/gb.joblib
uv run cli.py add ridge rmse 3.42 candidates/ridge.joblib
uv run cli.py add lasso rmse 4.05 candidates/lasso.joblib
uv run cli.py add gradient_boosting rmse 2.87 candidates/gb.joblib
uv run cli.py list
uv run cli.py best rmse
uv run cli.py best accuracy
```

**🎯 الناتج المتوقع :**

```
registered run_001 (ridge) sha256=ff863fe836434899...
registered run_002 (lasso) sha256=5ac5290c4de57d97...
registered run_003 (gradient_boosting) sha256=6a542a94df7113c3...
run_001   ridge              rmse          3.420  artifacts/run_001.joblib
run_002   lasso              rmse          4.050  artifacts/run_002.joblib
run_003   gradient_boosting  rmse          2.870  artifacts/run_003.joblib
best rmse (min): run_003 gradient_boosting = 2.870
no runs tracked for metric accuracy
```

**🩹 إذا لم يعمل :** إذا أبلغ `add` عن ملخصين متطابقين لنموذجين مختلفين، فمرّ نفس الملف كـ `src` مرتين (المرشحات المختلفة يجب أن تكون سلاسل بايتية *مختلفة*). إذا أثار `best accuracy` بدلًا من الطباعة، فحارس `if not cand` مفقود ، `max([])` لا يمكن أن يحدث بوجوده.

### 5.3 تحقّق من المنافسة

**✅ قائمة التحقق**

- ✅ ثلاث تجارب مسجّلة بمعرفات `run_001/2/3` متتابعة وملخصات متميزة؛ و`list` يطابقها.
- ✅ `best rmse` يختار run_003 (2.87) ، اتجاه «min» محترم.
- ✅ `best accuracy` على مقياس لم يُسجَّل قط يطبع رسالة ودودة لا أثر خطأ.
- ✅ يحتوي `artifacts/` الآن على ثلاث نسخ `.joblib` مبصومة إضافة إلى أسطر السجل التي تشير إليها.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- `register` يرقّم التجارب من `len(load_runs())` ، الترتيب يعتمد على السجل، لا على ضمانة. ماذا يحدث عندما تُحذف تجارب من السجل (حُذفت run_002، فالمعرف التالي `run_003` من جديد ← يفعل حارس التكرار)، وما البديل المتين (عدّاد لكل بادئة، معرفات بطوابع زمنية)?
- تقرأ الواجهة السجل عند كل `best` و`list` ، رخيصة اليوم، وO(n) إلى الأبد. ما شكل *عرض ندّي واحد* يمكن بناؤه مرة ومشاركته (`best_of("rmse")` على جلسة محمّلة)؟ هل ذلك تغيير صحة أم تغيير كفاءة؟

## ⚠️ المآزق الشائعة

- **تجارب مكررة بسبب غياب إلغاء التكرار.** `log_run` بلا فحص التكرار يحوّل إعادة التشغيل إلى كذبة. الحارس هو الميزة؛ والإلحاق هو السباكة.
- **Min مقابل max بالذاكرة.** اختيار *الأصغر* لـ rmse واضح؛ اختيار *الأكبر* للدقة هو الشكل نفسه مع `max` واحدة. تجاوز جدول الاتجاهات وستنقلب إجابة «الأفضل» لكل مقياس، بصمت.
- **تجزئة الملف الخاطئ.** بَصْم *قبل* النسخ، أو تجزئة مسار المصدر وتخزينها مقابل نسخة المستودع، لا يتحقق من شيء بمجرد أن تنحرف النسخة. بَصْم ما يعيش: `digest(dest)`.
- **المرشحات الفارغة.** `min([], key=...)` انهيار لا حكم. احرس قبل الاختيار ، «no runs tracked for metric accuracy» معلومة يستطيع المشغِّل التصرف بناءً عليها.
- **معرفات متتابعة من طول السجل.** `len(load_runs()) + 1` يعيد استخدام المعرف إذا حُذفت التجارب، ويفعل حارس التكرار عندئذٍ على إلحاق مشروع. أرقام الترتيب تخص عدّادًا، لا عدًّا.

## ما بنيته للتو

متتبع تجارب بخمسة أوامر يتصرف كأداة MLE حقيقية: سجل `Run` مصنّف، سجل JSONL للإلحاق فقط مع حارس تكرار، مُحدد `best` مدرك للاتجاه، تسجيل مخرجات ببصمات SHA-256، وواجهة سطر أوامر تربط كل ذلك دون استيراد إطار عمل. الأفكار القابلة للنقل ، السجلات كصفوف بيانات، والسجلات للإلحاق فقط، وجداول الاتجاهات، وتجزئة المحتوى ، هي ذرات كل نظام إدارة تجارب جاد، وقد بنيتها في ~65 سطرًا من المكتبة القياسية.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/experiment-tracker/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/experiment-tracker) في مستودع الدورة يحتوي السكربتات الكاملة إضافة إلى ملفات المرشحين النموذجية. أو افتح المستودع كاملًا في [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## إلى أين تذهب من هنا

- أضف أمر **`compare`** ، `best` يختار واحدًا؛ و`compare rmse` يطبع الترتيب الكامل مع الفروقات مقابل الفائز (`+0.55`، `+0.18`)، الناتج الذي سيستهلكه رسم وادٍ.
- احفظ **`params`** كقاموس متداخل لكل تجربة وسجّله ، `Run(... , params={"alpha": 0.1})` يجعل المتتبع يجيب «أي إعداد فاز؟»، لا فقط «أي نموذج؟».
- أضف أمر **`verify`** يعيد تجزئة كل `artifacts/*.joblib` ويبلغ عن التناقضات مقابل السجل في تمريرة واحدة ، يصبح فحص التكامل عادة مجدولة لا تخمينًا.
- بدّل معرف `register` إلى **طابع زمني UTC** (`time.strftime("%Y%m%d_%H%M%S")`) ، تتعذر التصادمات عمليًا وتكتسب إعادة التشغيل هوية قابلة للفرز.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها ، وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓