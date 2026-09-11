---
title: "فاحص الانتحال"
description: "اكتشف الانتحال في تقديمات النصوص مع تقييم التشابه وتحديد المصادر."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["cli", "text-processing", "algorithm", "csv"]
learningObjectives:
  - "طبّع النص من حيث حالة الأحرف وتقسيم الكلمات"
  - "ابنِ مجموعة shingle (n-gram) لكل مستند"
  - "قيّم التشابه الزوجي بتراكب Jaccard بين مجموعتَي shingle"
  - "شغّل تقريرًا جماعيًا عبر مجموعة مستندات وعلّم الأزواج عالية التشابه"
prerequisites: ["python-101/strings", "python-101/sets", "python-101/loops", "python-101/functions"]
---

# فاحص الانتحال

كل منصة تقديمات تركّز على رقم واحد: كم من هذا المقال منسوخ. خلف هذا الرقم خوارزمية بسيطة وصادقة بشكل مدهش — **shingle**. يُقطع المستند إلى تسلسلات كلمات متداخلة ذات طول N، وتُقارَن وثيقتان بعدد التسلسلات التي تتقاسمانها. يبني هذا المشروع أداة سطر أوامر تُقيّم مقالًا مقابل مجموعة كاملة من المستندات المصدرية — تحويل النص الخام إلى مجموعات رموز، وحساب تشابه Jaccard لكل زوج، وطباعة تقرير مرتّب مع الأزواج المشبوهة في الأعلى. لا ML، ولا API، ولا سحر.

يفترض هذا Python 101 — السلاسل، والمجموعات، والحلقات، والدوال. لا شيء بعد ذلك. هذا اختياري وغير مُقيَّم؛ راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة.

## 🎯 ما ستفعله

1. تقسيم المستند وتطبيعه إلى قوائم كلمات بأحرف صغيرة.
2. تقطيع المستند إلى shingles متداخلة من N كلمات ("البصمة" النصية).
3. حساب درجة تشابه بين وثيقتين على شكل تراكب Jaccard لمجموعتَيهما من shingles.
4. تشغيل مقال مقابل مجموعة المصادر بأكملها وترتيب كل زوج بالدرجة.
5. تعليم الأزواج التي تتجاوز عتبة معيّنة وطباعة تقرير مقروء — مع العبارات المتطابقة الدقيقة كدليل.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الأساسي هنا — هذه خوارزمية نصية خالصة بمكتبة قياسية خالصة على ملفات تتحكم فيها، لذا فإن "ضع مقالَين في مجلد، شغّل أمرًا واحدًا، احصل على التقرير" هو تحديدًا سير العمل الذي بُني من أجله، وتقع ملفات المخرجات على نظام ملفات حقيقي.

**GitHub Codespaces** تجربة مطابقة: افتح [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) وتشغَّل الأوامر أدناه في نافذة متصفح مع Node وPython و`uv` مثبّتة مسبقًا.

**Google Colab وKaggle Notebooks وBinder تشغّل خط الأنابيب بأكمله بأمانة** — التطبيع، والتقطيع، وتقييم Jaccard، والتقارير — مقابل مجموعة العينات المرفقة بالدورة، لأن لا شيء هنا يحتاج GPU أو مفتاحًا أو ملفًا ضخمًا. التحفظ الصادق في النطاق: الدفتر يُقيّم المقالات النموذجية الثابتة بدلًا من مجلد تقديماتك الخاص، فاعتبرها مضمار اختبارٍ للخوارزمية، وانتقل إلى التشغيل المحلي عندما تريد تشغيلها على مستندات حقيقية.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/plagiarism-checker/notebook.ar.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/plagiarism-checker/notebook.ar.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fplagiarism-checker%2Fnotebook.ar.ipynb)

## الإعداد

كل ما تحتاجه قبل تقييم جملة واحدة: `uv`، ومجموعة صغيرة تضم مقالًا منسوخًا بوضوح وإثنين صادقين.

### ثبّت `uv` وجهّز المشروع

**macOS / Linux** (الطرفية):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

أغلق طرفيتك وأعد فتحها، ثم:

```bash
uv --version
mkdir plagiarism-checker && cd plagiarism-checker
uv init --bare
```

صفر حزم إضافية — مكتبة قياسية خالصة.

### ابنِ مجموعة المصادر

اكتب ثلاثة مستندات مصدرية في `sources/` (انسخها حرفيًا):

`sources/origin_ecology.txt`:

```
The kelp forest is a foundation of coastal biodiversity. Otters control the
urchin population, and where otters vanish the urchins strip the kelp to bare
rock. Removing one species can collapse an entire ecosystem within a decade.
```

`sources/origin_urbanism.txt`:

```
Cities concentrate talent because dense proximity lowers the cost of exchanging
ideas. A walking neighborhood outperforms a highway suburb at innovation, since
casual collisions between workers seed collaborations that commuting never allows.
```

`sources/origin_renewables.txt`:

```
Solar generation rises in the late morning and peaks at noon, while wind output
tends to strengthen overnight. Storage smooths the daily gap, but a grid that
overbuilds one intermittent source still faces scarcity in the other's trough.
```

الآن اكتب مقالًا منسوخًا **بشكل واضح** من المصدر الأول، وثانيًا صادقًا وأصليًا. ثم شغّل كليهما، من مجلد `submissions/`:

`submissions/essay_ours.txt`:

```
The kelp forest is a foundation of coastal biodiversity. Otters control the
urchin population, and where otters vanish the urchins strip the kelp to bare
rock. I would also argue that rewilding otter populations is the cheapest
conservation investment we can make in temperate seas.
```

`submissions/essay_original.txt`:

```
I want to write about where we keep losing coastlines, and why a single fishy
manager per hectare beats ten committees. The short answer is that small teams
acting locally catch damage faster, and I will defend that claim from my own
observations of tidal restoration projects this year.
```

```bash
mkdir sources submissions
# save the three files into sources/ and the two into submissions/
ls sources submissions
```

**✅ قائمة التحقق**

- ✅ `uv --version` يطبع رقم إصدار.
- ✅ `sources/` يحتوي ثلاثة مستندات مصدرية مميزة و`submissions/` يحتوي مقالًا ذا إحساس منسوخ وآخر أصليًا.
- ✅ تعلم سلفًا — بمجرد القراءة — أن `essay_ours.txt` يجب أن يسجّل درجة عالية مقابل `origin_ecology.txt`. الخطوة 4 موجودة لتأكيد أن الرقم يطابق حدسك.

## الخطوة 1: طبّع النص واقسمه إلى رموز

كشف الانتحال صاخب قبل أن يكون دقيقًا: تختلف المقالات في حالة الأحرف، وعلامات الترقيم، وفواصل الأسطر حتى عندما تكون الكلمات متطابقة. الخطوة الأولى تجرّد كل ذلك — حوّل كل شيء إلى أحرف صغيرة، واقسم إلى كلمات، وأسقط علامات الترقيم — حتى يصبح "The Kelp" و"the kelp" الكلمتين نفسهما أخيرًا.

### 1.1 اكتب المقسم

```python
# normalize.py
import re
from pathlib import Path

def tokenize(text: str) -> list[str]:
    text = text.lower()
    words = re.findall(r"[a-z']+", text)
    return words

def load_document(path: str) -> list[str]:
    return tokenize(Path(path).read_text(encoding="utf-8"))

if __name__ == "__main__":
    toks = load_document("submissions/essay_ours.txt")
    print(f"{len(toks)} tokens")
    print(toks[:12])
```

`re.findall(r"[a-z']+", text)` — بعد التطبيع إلى أحرف صغيرة — هو التطبيع بأكمله: يحتفظ فقط بتتابعات الحروف والفواصل العليا، لتختفي الفواصل والنقاط والأسطر الجديدة بينما يبقى `don't` رمزًا واحدًا (المسألة مطابقة `don't` مع نفسه، لا علامات الترقيم). ينتج النمط قائمة الرموز مباشرة — لا تقسيم ولا مرحلة فلترة — وهو أسرع وأصح من `text.split()` مع التنظيف.

**👟 تلميح البداية :** شغّل المقسم على المقال المنسوخ وعدّ — أنت تبحث عن أن يخرج "the kelp forest is a foundation of coastal biodiversity" كـ 9 رموز نظيفة، لا 12 مع شظايا ترقيم.

**🎯 الناتج المتوقع :** `35 tokens` (تقريبًا) لـ`essay_ours.txt`، وتقرأ أول 12 رمزًا `['the', 'kelp', 'forest', 'is', 'a', 'foundation', 'of', 'coastal', 'biodiversity', 'otters', 'control', 'the']` — دون `'` أو `,` في أي مكان.

**🩹 إذا لم يعمل :** إذا كانت الرموز لا تزال تحتوي علامات ترقيم، فقد عمل النمط قبل `lower()` أو لم يجد شيئًا يزيله — فئة `[a-z']+` تطابق الحروف فقط، فأي شيء آخر أُهمل فعلًا. إذا اختفت أرقام تهتم بها (`2026`)، فالفئة تستبعد الأرقام عمدًا — قرر ووثق ما إذا كانت السنوات والعددات مهمة لمجموعتك (عادةً لا تكون كذلك للنثر).

### 1.2 تحقّق من التطبيع

**✅ قائمة التحقق**

- ✅ `tokenize("The Kelp. Forest!")` يُرجع `['the', 'kelp', 'forest']` — 3 رموز، كلها صغيرة، دون ترقيم.
- ✅ `tokenize("don't stop")` يُبقي `don't` رمزًا واحدًا.
- ✅ عدد الرموز للنص نفسه متطابق بغض النظر عن كيفية توزع فواصل الأسطر — التطبيع يمسح التنسيق، لا المحتوى.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- نحذف الأرقام ونعزل `don't`. بالنسبة للنثر الذي يفصل بين جملاته، يتحول المصطلح الموحّد الواحد مثل `**self-organized**` إلى `self` و`organized` — رمزين لا يطابقان أبدًا واصلة `self-organized` في المصدر. هل هذا تطابق تريد الاحتفاظ به، وما الصيغة المطبَّعة (تلميح: امسح الواصلة لتصبح مسافة أو أبقِ الربط) التي تحافظ عليه؟
- تُصغّر `re.findall` الحروف بإعادة كتابة السلسلة كاملة أولًا. إذا كان المستند بحجم 10 MB، فأين تذهب الذاكرة — وما البديل ذو العلم الواحد (`re.IGNORECASE`) الذي يتجنب النسخة لو اهتممتَ يومًا؟

## الخطوة 2: قطّع المستند إلى shingles

الكلمات الخام حبيباتها خشنة جدًا: وثيقتان تتقاسمان كلمة "the" تتقاسمان الكثير دون أن تكونا متشابهتين. الحل هو **shingle** — نافذة متداخلة من N كلمات متتالية — حيث تتشابه وثيقتان فقط عندما تتقاسمان *نوافذ كاملة*، عشرات الكلمات، بنفس الترتيب النسبي. هذه هي الفكرة الوحيدة التي بُني حولها الفاحص بأكمله.

### 2.1 ابنِ نافذة shingle

```python
# shingle.py
from normalize import tokenize
from pathlib import Path

N = 4

def shingles(tokens: list[str], n: int = N) -> set[tuple]:
    return {tuple(tokens[i:i + n]) for i in range(len(tokens) - n + 1)}

if __name__ == "__main__":
    toks = tokenize(Path("submissions/essay_ours.txt").read_text())
    print(f"{len(toks)} tokens -> {len(shingles(toks))} shingles of size {N}")
    print(sorted(shingles(toks))[:2])
```

`tuple(tokens[i:i+n])` عبر `range(len(tokens) - n + 1)` هي النافذة المنزلقة: لمستند من 35 رمزًا وn=4، تلك 32 نافذة، كل واحدة شريحة من 4 كلمات تبدأ عند الموضع i. الـ*مجموعة* (set) مقصودة — يسأل الفاحص "أي نوافذ موجودة هنا؟" لا "كم مرة؟" — وأداة دلالات المجموعة هي ما يجعل تراكب Jaccard في الخطوة 3 سطرًا واحدًا.

**👟 تلميح البداية :** قبل التشغيل، توقّع: لـ35 رمزًا وn=4 تتوقع `35 - 4 + 1 = 32` shingle. تحقق أن العدد يهبط هناك بالضبط، ثم جرّب n=3 ولاحظ *نمو* المجموعة.

**🎯 الناتج المتوقع :** `35 tokens -> 32 shingles of size 4`، وأول shingleين عبارة عن 4-tuples مثل `('the', 'kelp', 'forest', 'is')`.

**🩹 إذا لم يعمل :** إذا كان العدد 35، فالنافذة لديك هي `tokens[i:i+n]` عبر `range(len(tokens))` دون `- n + 1` — النوافذ الثلاث الأخيرة شرائح قصيرة لا يجب أن توجد؛ `- n + 1` هو التصحيح للمسافة واحد الذي يجعل كل نافذة n كلمة بالضبط. إذا بدت shingles كسلاسل لا كـ tuples، فقد غلّفت الشريحة بـ `tuple()` لكنك أرجعت قائمة — تتطلب المجموعات أعضاء قابلة للتجزئة (hashable)، ومجموعة من قوائم ترفع `TypeError`.

### 2.2 تحقّق من التقطيع

**✅ قائمة التحقق**

- ✅ مستند من 35 رمزًا مع n=4 يعطي 32 shingle بالضبط؛ وn=3 يعطي 33؛ وn=35 يعطي... 1. شغّل الثلاثة وتأكد من النمط `len - n + 1`.
- ✅ كل shingle عبارة عن tuple من n كلمة بالضبط — لا ذيول قصيرة، ولا تكرار في المجموعة.
- ✅ تقطيع المستند نفسه مرتين يُرجع مجموعتين متطابقتين — الحتمية هي المقصود.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- نخزّن 4-tuples الكاملة، لذا تنمو الذاكرة بمقدار `len(tokens) - n + 1`. فاحصات الانتحال الحقيقية تخزّن *تجزئة* كل shingle فقط (عددًا صحيحًا بـ 64 بت) — ما الذي يفسد إذا تصادمت 4-tuple مختلفة على نفس التجزئة، ولماذا يستحق هذا المقايض الثمن على مقياس المجموعة؟
- حجم النافذة n هو المقبض الحر الوحيد لهذه الأداة كلها. ماذا يتغير في الحساسية عندما تصغر n (n=2: تشابك مجنون من أي مقالَين) مقارنةً بكبره (n=12: التطابق الحرفي فقط تطابقات)؟ اكتب الجملة التي تتوقع أن "تُلتقط" عند n=4 و"تُفوَّت" عند n=8.

## الخطوة 3: قيّم التشابه بين وثيقتين

وثيقتان "متشابهتان" عندما تتراكب مجموعتا shingle بشدة. المقياس المعياري هو **Jaccard**: حجم التقاطع مقسومًا على حجم الاتحاد — رقم بين 0 و1 لا يتغير سواء كانت الوثيقتان قصيرتين أو طويلتين، لأن الاتحاد يطبّع الطول. 1.0 متطابقتان، و0.0 لا نافذة مشتركة على الإطلاق.

### 3.1 احسب درجة Jaccard

```python
# score.py
from shingle import shingles, N
from normalize import load_document

def jaccard(a: set, b: set) -> float:
    inter = len(a & b)
    union = len(a | b)
    return inter / union if union else 1.0

def score_pair(path_a: str, path_b: str) -> float:
    return jaccard(shingles(load_document(path_a)), shingles(load_document(path_b)))

if __name__ == "__main__":
    print("ours vs ecology:", round(score_pair("submissions/essay_ours.txt",
                                               "sources/origin_ecology.txt"), 3))
    print("ours vs renewables:", round(score_pair("submissions/essay_ours.txt",
                                                  "sources/origin_renewables.txt"), 3))
    print("ours vs itself:", round(score_pair("submissions/essay_ours.txt",
                                              "submissions/essay_ours.txt"), 3))
```

`a & b` و`a | b` هما تقاطع المجموعات واتحادها — عوامل Python تقرأ تمامًا كالرياضيات، ويقف الشرط `if union else 1.0` أمام وثيقتين فارغتين (كلا الاتحادين فارغ: عرّف هذه الحافة على أنها "متطابقة"، وإلا ستقسم على صفر). منعطف المنحنى هو لحظة التعلم: يتقاسم `essay_ours` ~9 shingles مع ~40 لـ ecology، بينما المفردات العامة ("I would also argue that...") لا تتقاسم شيئًا مع renewables.

**👟 تلميح البداية :** احسب `essay_ours` مقابل ecology *يدويًا* أولًا: عدّ نوافذ الأربع كلمات المشتركة في تداخل الفقرتين الأوليين، ثم تحقق أن الأداة وافقت ضمن التقريب.

**🎯 الناتج المتوقع :** `ours vs ecology: ≈0.31`, `ours vs renewables: 0.0` (لا نوافذ مشتركة), `ours vs itself: 1.0`. درجة ecology الدقيقة تقع بين 0.25 و0.4 — فوق الصفر، وأدنى بكثير من الواحد، ومختلفة بوضوح عن صفر renewables.

**🩹 إذا لم يعمل :** إذا كانت درجة ecology 0.0 أيضًا، فتتباين عمليتا التقسيم في مكان ما — واصلة أو فاصلة علوية في ملف واحد تفتقدها الآخر؛ اطبع قائمتي الرموز وقارنهما (الإصلاح عادةً محرف واحد في نص المصدر). إذا لم يكن `ours vs itself` مساويًا لـ1.0، فـ`jaccard` لا يقارن نفس زوج المجموعات — تحقق من أنك تقطّع *نفس* الملف مرتين لا مسارين مختلفين.

### 3.2 تحقّق من التقييم

**✅ قائمة التحقق**

- ✅ `score_pair(essay_ours, origin_ecology)` ≈ 0.31 — تراكب غير تافه، ليس قريبًا من 1.
- ✅ `score_pair(essay_ours, origin_renewables)` == 0.0 بالضبط.
- ✅ `score_pair(x, x) == 1.0` لأي مستند — حالة الهوية هي فحص سلامة العقل.
- ✅ وثيقتان *غير مرتبطتين إطلاقًا* تسجّلان 0.0 بالضبط، لا أرضية ضجيج صغيرة لكنها إيجابية.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يقسم Jaccard على الاتحاد، لذا ففقرة منسوخة *مدفونة في مقال أصلي طويل* تسجّل درجة أدنى من مقال قصير ينسخها كلها. أي اتجاه هو "السلبي الكاذب" — وأي مقام (تلميح: التقاطع ÷ حجم *المتَّهم*) يفضّله معلّم لاتخاذ قرار القراءة المتأنية؟
- هوية "ours vs itself = 1.0" صحيحة توتولوجيًا للملفات المطابقة. لكن ملفًا أُعيد حفظه مع 100 سطر فارغ مُدرج له *نفس الرموز* (التطبيع يمسحها) — فيسجّل 1.0 أيضًا. هل هذه المطابقة الزائدة صحيحة لأداة انتحال، وما الذي يجب أن تغيّره لكشف النسخ المتغيّر التخطيط؟

## الخطوة 4: قارن مقالًا واحدًا مع المجموعة بأكملها

تقييم زوج واحد هو اللبنة الأولية؛ تعليم تقديمٍ هو المنتج. تشغّل هذه الخطوة مقالًا واحدًا مقابل كل مستند مصدرية، وتُبقي درجة كل زوج، وترتب تنازليًا، وتطبع تقريرًا مرتّبًا — الحلقة التي تحوّل `score_pair` إلى فحص انتحال.

### 4.1 رتّب كل زوج مرشح

```python
# checker.py
from pathlib import Path
from score import jaccard
from shingle import shingles, N
from normalize import load_document

def check_against(essay: str, sources_dir: str) -> list[dict]:
    essay_sh = set(shingles(load_document(essay)))
    results = []
    for src in sorted(Path(sources_dir).glob("*.txt")):
        src_sh = set(shingles(load_document(str(src))))
        score = jaccard(essay_sh, src_sh)
        if score > 0:
            results.append({"source": src.name, "score": score})
    return sorted(results, key=lambda r: -r["score"])

if __name__ == "__main__":
    essay = "submissions/essay_ours.txt"
    for r in check_against(essay, "sources"):
        print(f"{r['score']:.3f}  {r['source']}")
```

عاداتان جديرتان بالنسخ: المستندات المصدرية **تُقطَّع مرة واحدة لكل منها** (خارج عمل كل زوج — لا إعادة قراءة ولا إعادة تقطيع ثلاث مرات)، ومجموعة shingle الخاصة بالمقال تُحسب *مرة واحدة* قبل الحلقة، لا داخلَها. مفتاح الترتيب `-r["score"]` هو مجرد فرز Python التنازلي، وفلتر `score > 0` يُبقي التقرير مقروءًا — المصادر غير ذات الصلة تبقى خارج القائمة المرتّبة بدلًا من حشوها بعشرات صفوف `0.000`.

**👟 تلميح البداية :** شغّلها لـ`essay_ours` — يجب أن يكون مصدر ecology الصف الوحيد، `0.31`. ثم شغّل `check_against("submissions/essay_original.txt", "sources")` وتأكد أنه لا يطبع شيئًا أصلًا.

**🎯 الناتج المتوقع :** لـ`essay_ours.txt`: صف واحد بالضبط `≈0.310  origin_ecology.txt`. لـ`essay_original.txt`: لا ناتج — لا يتقاسم المقال أي نافذة من 4 كلمات مع أي مصدر.

**🩹 إذا لم يعمل :** إذا طبع المقالان `0.000`، فقد قُسّمت مقالتك بكلمات مختلفة عما تظن — اطبع الرموز وقارنها برموز المجموعة (فاصلة علوية شاردة أو واصلة هي المشتبه المعتاد). إذا أظهر `essay_original` درجة غير صفرية، فيجب أن تكون الاثنتان صفرًا — اقرأ shingle المتداخل: غالبًا ما أعدت استخدام عبارة من التلميح، وقد عثرت الأداة على تطابق حقيقي (ولو بريء).

### 4.2 تحقّق من فحص المجموعة

**✅ قائمة التحقق**

- ✅ `essay_ours` يضع `origin_ecology` أولًا (ووحيدًا) عند ≈0.31.
- ✅ `essay_original` لا يطابق شيئًا — ناتج نظيف، تقرير فارغ.
- ✅ ترتيب مجلد المصادر على القرص لا يؤثر على ترتيب المخرجات — الترتيب بالدرجة، محسوبة بـ `key=lambda r: -r["score"]`.
- ✅ كل مصدر قُطع مرة واحدة، لا مرة لكل مقال — بنية الحلقة تضمن ذلك.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يعرض التقرير صفوف `score > 0` فقط. ما المفقود بإخفاء الأصفر — تحديدًا، هل يمكنك *الدفاع* عن استنتاج 0.0 إذا حذفت الأداة الصف ببساطة؟ وما الذي سيكون عليه أفضل حالًا في تقرير يسرد دائمًا كل مصدر (مع درجاته)؟
- `check_against` تقطّع كل مصدر أثناء تكرارها عليه — هذا "كسول" ومقبول على مقياس مجموعة، لكن `check_all(corpus_dir)` التي تحسب مسبقًا قاموسًا واحدًا من `الاسم → مجموعة shingle` هي الشكل الذي يستخدمه فاحص حقيقي. سمِّ خاصية السرعة أو الصحة الملموسة التي تشتريها الحسابات المسبقة (تلميح: لا شيء هنا، لكن المجموعة المتنامية تغير بنية الحلقة).

## الخطوة 5: علّم الأزواج المشبوهة وأظهر الدليل

قائمة درجات مرتّبة نتيجة؛ **العبارات المتداخلة هي الدليل** — الفرق بين "ثق بي، 0.31" و"هذه الجمل الثلاث التي نسخها". تطبع هذه الخطوة، لكل زوج مُعلَّم، النوافذ المشتركة الفعلية التي أنتجت الدرجة، ليتمكن المعلّم من *التحقق* من الرقم قبل التصرف بناءً عليه.

### 5.1 اطبع النوافذ المطابقة

```python
# evidence.py
from pathlib import Path
from shingle import shingles, N
from normalize import load_document
from score import jaccard

THRESHOLD = 0.25

def evidence(essay: str, sources_dir: str) -> None:
    essay_sh = set(shingles(load_document(essay)))
    for src in sorted(Path(sources_dir).glob("*.txt")):
        src_sh = set(shingles(load_document(str(src))))
        score = jaccard(essay_sh, src_sh)
        if score < THRESHOLD:
            continue
        shared = essay_sh & src_sh
        print(f"\n{essay}  vs  {src.name}  score={score:.3f}  ({len(shared)} shared windows)")
        for sh in sorted(shared)[:5]:
            print("   " + " ".join(sh))

if __name__ == "__main__":
    evidence("submissions/essay_ours.txt", "sources")
```

سطر `shared = essay_sh & src_sh` هو الكرزة: التقاطع نفسه الذي أنتج الدرجة هو أيضًا قائمة الدليل، لذا لا يمكن لرقم التقرير واقتباساته أن يختلفا أبدًا — إنهما حرفيًا نفس المجموعة. حد `sorted(shared)[:5]` (حفنة من الأمثلة، لا كل نافذة) يُبقي المخرجات قابلة للمسح بينما يبقى عدّاد `len(shared)` صادقًا في الترويسة.

**👟 تلميح البداية :** شغّلها، ثم اقرأ نوافذ الأربع كلمات المطبوعة بصوت عالٍ — يجب أن تكون كل واحدة *عبارة* حقيقية من مقالتك موجودة أيضًا في المصدر، لا تتابع محرّفات عامة مصادف مثل "the kelp forest is".

**🎯 الناتج المتوقع :** ترويسة لـ`essay_ours vs origin_ecology.txt` عند ≈0.31 مع عدّاد النوافذ المشتركة، تليها نوافذ أمثلة مرتّبة — أولها تنويعات من `the kelp forest is a`، `otters control the urchin`، `urchins strip the kelp to` — و*لا ناتج للمصدرين الآخرين*.

**🩹 إذا لم يعمل :** إذا لم يطبع شيء رغم أن الخطوة 4 أظهرت 0.31، فإن `THRESHOLD = 0.25` فوق الدرجة — أنزل الثابت، ولا تحذف البوابة؛ البوابة هي ما يُبقي التقرير صادقًا. إذا تضمنت النوافذ `is a foundation of` (عبارة عامة)، فهذا تطابق حقيقي — فاحصات الانتحال الحقيقية تفلتر النوافذ المكتظة بالمحرّفات العامة تمامًا كما تتعلّم أن تقرأها بعين ناقدة.

### 5.2 تحقّق من تقرير الأدلة

**✅ قائمة التحقق**

- ✅ كل زوج مُعلَّم يُظهر الدرجة + عدّاد النوافذ المشتركة + عبارات أمثلة مقروءة.
- ✅ العبارات المطبوعة تداخلات حقيقية يمكنك التحقق منها مقابل الملفين بالعين.
- ✅ الأزواج دون `THRESHOLD` لا تظهر أبدًا، والعتبة ثابت مُسمّى لا رقم سحري.
- ✅ الدرجة في الترويسة تطابق رقم الخطوة 4 للزوج نفسه بالضبط — التقاطع هو نفس المجموعة في المرتين.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- نطبع أول 5 نوافذ مرتّبة كأمثلة. ماذا لو كانت النافذة * الأكثر إدانة* هي الحادية والثلاثون؟ ما التغيير (فرز على أساس شيء آخر غير الأبجدية، أو التقرير عن *أطول سلسلة* من النوافذ المتداخلة) الذي يُبرز أقوى دليل أولًا؟
- `THRESHOLD` يقرر من يُسمّى. إنسانان بنفس الأداة قد يختاران 0.2 و0.3. ما الذي يساهم به تقرير الأدلة ليتمكن *المعلّم* من تجاوز العتبة — وهل "علّم كل شيء، ودع الأدلة تحكم" تصميم بديل قابل للدفاع؟

## ⚠️ مآزق شائعة

- **مشكلة النافذة فوق-المطابقة "the/a/of".** عند n=2 أو n=3، يتقاسم كل زوج من المقالات الإنجليزية shingles مصنوعة من محرّفات عامة خالصة ("the kelp"، "is a")، وتدّعي الدرجة تشابهًا لا وجود له. جوهر الإصلاح إما n أكبر (4+ للنثر) أو إسقاط shingles التي كل كلماتها في مجموعة محرّفات عامة قبل التقاطع.
- **الانحراف في التطبيع بين الملفات.** ملف واحد يقول "self-organized"، والآخر "self organized"؛ واحد يستخدم اقتباسات ذكية "’"، والآخر ASCII. يرى الفاحص حينها *رموزًا مختلفة* ويفوّت نسخًا واضحًا. طبّع الطرفين بنفس المقسم، *وطبّع* المجموعة مرة واحدة (خزّن قوائم الرموز)، حتى لا يتباينا منتصف التشغيل أبدًا.
- **خطأ المسافة الواحد في النافذة المنزلقة.** `range(len(tokens) - n + 1)` لا يرحم: انسَ `- n + 1` وستكون النوافذ الأخيرة شرائح قصيرة لا تطابق شيئًا وتخفض كل درجة بصمت. اختبر العدد (الخطوة 2.2) قبل الوثوق بأي رقم لاحق.
- **الفقرة المنسوخة الغارقة في مقال طويل.** متوسطات اتحاد Jaccard في كل ما يملكه المصدر *و*المقال، لذا يمكن لفقرة حرفية 40% داخل مقال أصلي طويل أن تسجّل 0.15 وتنزلق تحت أي عتبة معقولة. أبلغ *كلا* Jaccard و`shared_window_count` الخام — العدد هو إشارة "اقرأه" الأقوى.
- **نسيان أن العتبة حكم لا قانون.** درجتا 0.24 و0.26 هما القضية نفسها؛ عتبة 0.25 خطٌّ رسمه البشر لا نبيٌّ. وظيفة الأداة *الترتيب وعرض الأدلة*، ووظيفة المعلّم الحكم — تقرير الأدلة (الخطوة 5) موجود تحديدًا حتى لا تتظاهر الأداة أبدًا بسلطة لا تملكها.

## ما بنيته للتو

فاحص انتحال يعمل: مقسّم، ومقطّع shingles، ومقيّم Jaccard، وتقرير شامل للمجموعة، وتقرير أدلة يُظهر العبارات الدقيقة خلف كل درجة. المقال المنسوخ يضيء عند 0.31؛ والمقال الأصلي يسجّل صفرًا صريحًا؛ و*يمكنك* إعادة إنتاج كل رقم يدويًا، لأن الخوارزمية كلها حساب مجموعاتٍ على كلمات. المهارة القابلة للنقل هي التقطيع نفسه — فكرة "بصمة النافذة المتداخلة" تقع تحت كشف الانتحال، وإزالة تكرارات الويب شبه المطابقة، والمقارنة الضبابية للملفات، وخطوط الأساس لمعظم أنظمة البحث الدلالي، ويمكنك الآن بناء السلسلة كاملة من نص خام بدلًا من استيراد `similarity_score` لشخص آخر.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/plagiarism-checker/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/plagiarism-checker) في مستودع الدورة يضمّ المقسم والمقطّع والمقيّم والفاحص ووحدات الأدلة مع مجموعة العينات ودفترًا يشغّل كل خطوة بالترتيب. استنسخه، أو افتح المستودع كاملًا في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وقيّم المقالات المرفقة في نافذة متصفح.
:::

## إلى أين تذهب من هنا

- **تجميع المشبوهين الضبابي:** شغّل كل مستند ضد كل مستند آخر (مقال مقابل مقال، لا مقال مقابل مصدر فقط) واطبع "هذا الزوج من الطلاب يتقاسمان 0.4" — حلقة الخطوة 4، متقاطعة مع نفسها، مع `if` يتخطى كل مستند ضد نفسه.
- **أدلة ذات تطبيع طولي:** أبلغ عن `shared_count / len(essay_shingles)` بزاوية "كم من *مقالتك* منسوخ" — تغيير المقام الذي لمّحت إليه في الخطوة 3، والرقم الذي يقرؤه المعلّم أولًا فعلًا.
- **علم `--min-shared-windows`** يُعلّم على عدّاد التداخل الخام بدلًا من النسبة، فتظهر نسخة نصف صفحة واحدة داخل مصدر ضخم مع ذلك — الإصلاح الدائم لمآزق "الفقرة الغارقة".
- **انزلق فوق ضجيج الشركات الناشئة الحقيقي:** شغّل الفاحص على مجلد من *ملاحظات القراءة* التي كتبتها لدورتين، وكن مستعدًا للمفاجأة الصادقة — إعادة صياغتك الخاصة لمصدر تسجّل 0.2+. ليس هذا خللًا؛ إنها الأداة تقيس بدقة ما يعنيه "تذكّر مصدرًا".

## شارك مشروعك مع الصف

هل بنيت شيئًا تفخر به — فاحصًا كشف تداخلًا حقيقيًا، تقرير أدلة تثق به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع قدّمها طلاب آخرون، ويشرح README إضافة مشروعك عبر **طلب سحب (pull request)** من البداية للنهاية: التفرع، وفرع العمل، والالتزام، وفتح PR. لا يُفترض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓