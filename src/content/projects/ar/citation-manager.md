---
title: "مدير الاستشهادات"
description: "أدر المراجع الببليوغرافية مع تنسيق تلقائي بصيغ APA وMLA وChicago وBibTeX."
difficulty: "intermediate"
estimatedMinutes: 75
xpReward: 100
tags: ["Science", "Productivity", "Utility"]
prerequisites:
  - "القواميس المتداخلة وطرق السلاسل"
  - "المجموعات (sets) وفهم القوائم"
  - "قراءة وكتابة ملفات JSON"
learningObjectives:
  - "نمذجة قائمة مراجع كقاموس من قواميس المدخلات بمفاتيح ثابتة"
  - "تنسيق المدخلات إلى نص APA موحّد بدالة واحدة"
  - "البحث عبر المؤلفين والعناوين والأماكن بمطابقة السلاسل الفرعية"
  - "إيجاد المراجع المفقودة وغير المستخدمة بفرق المجموعات"
  - "كشف شبه التكرارات بالعنوان المطبَّع وتوليد قسم References مرتب"
---

# 🛠️ 📚 مدير الاستشهادات

الأوراق لا تكتب نفسها — لكن قائمة المراجع تكاد تفعل. يبني هذا المشروع **مدير استشهادات** صغيرًا: مخزنًا للمدخلات الببليوغرافية (مفتاح ← مؤلف/عنوان/سنة/مكان/نوع)، ومنسّقًا يحوّل أي مدخل إلى سطر واحد متسق بأسلوب APA تقريبًا، وبحثًا يعمل عبر المؤلفين والعناوين والأماكن، ومدققًا لـ«المفقود وغير المستخدم» مبنيًّا على فرق المجموعات يلتقط أخطاء قائمة المراجع قبل أن يلتقطها المراجع، مع كشف شبه التكرارات الذي يصطاد نفس الكتاب المُدخل مرتين باختلاف الحروف، وعدّادات الأنواع، وأخيرًا مولدًا يفرز المكتبة كاملة حسب السنة ثم المؤلف ويكتب قسم `References` ونسخة احتياطية JSON. كل شيء حتمي — بيانات صغيرة منسَّقة يدويًا، بلا عشوائية، مكتبة قياسية خالصة.

هذا يفترض معرفة القواميس المتداخلة والمجموعات وفهم القوائم وأساسيات JSON. المشروع اختياري وغير مُقيَّم — راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للقائمة الكاملة المتنامية. ملف واحد، مكتبة قياسية فقط.

## 🎯 ما ستفعله

1. بناء مخزن المراجع الببليوغرافية ونسّق أسلوب APA.
2. البحث في المخزن عبر المؤلف والعنوان والمكان.
3. فحص استشهادات مخطوطة في النص عن المفاتيح المفقودة وغير المستخدمة.
4. كشف المدخلات شبه المكررة وعدّ الأنواع.
5. توليد قسم References مفروزًا بالسنة ثم المؤلف وحفظه في JSON.

## أين تُشغّل هذا

في أي مكان يعمل Python 3.10+ — محليًا، أو Colab، أو Kaggle، أو Binder. المشروع كله `json` + بنيات اللغة، فلا شيء لتثبيته ولا فرق بيئي بين مكان وآخر.

```bash
mkdir citation-manager && cd citation-manager
touch citations.py
```

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/citation-manager/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/citation-manager/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcitation-manager%2Fnotebook.ipynb)

## الإعداد

صفر تبعيات: فقط أكّد المفسر وأنشئ الملف.

### فحص البيئة

```bash
python3 --version
```

**✅ قائمة التحقق**

- ✅ `python3 --version` يعرض 3.10+.
- ✅ `citations.py` موجود؛ و`import json` و`import itertools` يعملان.
- ✅ لا `pip install` — المكتبة القياسية هي التي تعمل.

**🤔 سؤال (أسئلة) سقراطي(ة) :**

- قائمة المراجع *تعيين* (mapping): تستشهد بـ`[knuth1984]` في النص ويوسّعه قسم References. أين في هذا المشروع يكون القاموس الشكل الصحيح، وأين تُفقد قائمة عادية المعلومات؟
- يدير المدير التنسيق بنفسه. لماذا دالة تنسيق *واحدة* أفضل من كتابة سطر مرجعي يدويًا لكل مرجع — وما الخطر الذي تقدّمه هذه التجريدية حين يغيّر مكانٌ أسلوبه في منتصف المشروع؟

## الخطوة 1: مخزن المراجع الببليوغرافية

ابدأ بنموذج البيانات: قاموس مفاتيحه مقابض الاستشهاد (`shannon1948`) وقيمه قواميس المدخلات.

### 1.1 المدخلات

**👟 تلميح البداية :** قاموس من ستة مدخلات، كل منها بـ`authors`, `title`, `year`, `venue`, `type`.

```python
# citations.py
import json
import itertools

bib = {
    "knuth1984": {"authors": "Donald E. Knuth", "title": "The TeXbook",
                  "year": 1984, "venue": "Addison-Wesley", "type": "book"},
    "turing1950": {"authors": "Alan M. Turing", "title": "Computing machinery and intelligence",
                   "year": 1950, "venue": "Mind 59 (236)", "type": "article"},
    "shannon1948": {"authors": "Claude E. Shannon", "title": "A mathematical theory of communication",
                    "year": 1948, "venue": "Bell System Technical Journal", "type": "article"},
    "hopper1978": {"authors": "Grace M. Hopper", "title": "The education of a computer",
                   "year": 1978, "venue": "IEEE Transactions on Computers", "type": "article"},
    "ritchie1974": {"authors": "Dennis M. Ritchie; Ken Thompson", "title": "The UNIX time-sharing system",
                    "year": 1974, "venue": "Communications of the ACM", "type": "article"},
    "lamport1994": {"authors": "Leslie Lamport", "title": "LaTeX: A Document Preparation System",
                    "year": 1994, "venue": "Addison-Wesley", "type": "book"},
}
```

المقبض هو كيف يستشهد النص بمصدر؛ والمدخل يحمل الحقائق الببليوغرافية. هذا الفصل — *مفتاح ثابت* مقابل *بيانات قابلة للتغيير* — هو ما يُبقي إعادة التنسيق أو البحث من كسر كل استشهاد في النص.

**🎯 الناتج المتوقع :** لا شيء بعد — بيانات فقط. تحقّق من الشكل: المدخلات الستة كلها تحمل الحقول الخمسة نفسها.

**🩹 إذا لم يعمل :** `venue` ناقص في أحد المدخلات لن يكسر *هنا* لكنه سيُنسّق لاحقًا إلى `None` — راجع القواميس قبل المتابعة.

### 1.2 منسّق واحد، كل المدخلات

**👟 تلميح البداية :** `format_apa(entry)` → `"{authors} ({year}). {title}. {venue}."`, مطبَّقة بحلقة على `bib`.

```python
# citations.py (continued)
def format_apa(entry):
    return f"{entry['authors']} ({entry['year']}). {entry['title']}. {entry['venue']}."

for key, entry in bib.items():
    print(f"[{key:>10}] {format_apa(entry)}")
```

كل استشهاد يصبح سطرًا واحدًا بالضبط من دالة واحدة. غيّر الأسلوب (APA → MLA) في مكان واحد وتتبع المكتبة بأكملها.

**🎯 الناتج المتوقع :**

```
[ knuth1984] Donald E. Knuth (1984). The TeXbook. Addison-Wesley.
[turing1950] Alan M. Turing (1950). Computing machinery and intelligence. Mind 59 (236).
[shannon1948] Claude E. Shannon (1948). A mathematical theory of communication. Bell System Technical Journal.
[hopper1978] Grace M. Hopper (1978). The education of a computer. IEEE Transactions on Computers.
[ritchie1974] Dennis M. Ritchie; Ken Thompson (1974). The UNIX time-sharing system. Communications of the ACM.
[lamport1994] Leslie Lamport (1994). LaTeX: A Document Preparation System. Addison-Wesley.
```

**🩹 إذا لم يعمل :** إذا اختلف ترتيب حروف `abecedarian`، فلا فرز يحدث بعد — هذا ترتيب إدراج (ترتيب أسطر القاموس). إذا ظهر سطر بـ`None`, فأحد المدخلات ينقصه مفتاح `venue`.

### 1.3 تحقّق من المخزن

**✅ قائمة التحقق**

- ✅ ستة مدخلات، كل منها بـ`authors`, `title`, `year`, `venue`, `type`.
- ✅ ثلاثة تحويلات إلى ستة أسطر منسَّقة — دالة واحدة، خمسة حقول، بلا تكرار.
- ✅ المقابض معرّفات ثابتة؛ يمكن أن تتغير البيانات دون كسر الاستشهادات.

**🤔 سؤال (أسئلة) سقراطي(ة) :**

- تطبع `format_apa` السنة بين قوسين *داخل* السلسلة مع `(entry['year'])`. ماذا سينكسر لو كانت `year` عددًا صحيحًا في كل مرة *إلا* مدخلًا واحدًا مخزنًا كسلسلة `"1984"`؟ صمّم تحويلًا واحدًا يُصلح كل المدخلات.
- أعمال المؤلفين الاثنين مخزنة كـ`"Dennis M. Ritchie; Ken Thompson"` — سلسلة واحدة بفاصل. أين يبدأ تسريب هذا الاصطلاح إلى المنسّق، وما الذي قد تشتريه لك نموذج `authors: [list]` سليم؟

## الخطوة 2: البحث عبر المخزن

اعثر على استشهاد وأنت تعرف عنه *شيئًا* فقط — مؤلفًا، أو كلمة في العنوان، أو مكانًا، أو سنة.

### 2.1 بحث السلاسل الفرعية

**👟 تلميح البداية :** `search(query)` يعيد كل مفتاح يحوي مدخلُه الاستعلام (غير حساس للحالة) في المؤلف أو العنوان أو المكان، أو يطابق السنة تمامًا.

```python
# citations.py (continued)
def search(query):
    q = query.casefold()
    hits = []
    for key, entry in bib.items():
        haystack = " ".join([
            entry["authors"], entry["title"], entry["venue"],
            str(entry["year"])]).casefold()
        if q in haystack:
            hits.append(key)
    return hits

print("search('turing')      ->", search("turing"))
print("search('addison')     ->", search("addison"))
print("search('1984')        ->", search("1984"))
```

ضمّ كل الحقول في كومة بحث واحدة صغيرة الحروف يعني اختبار سلسلة فرعية واحدًا يغطي كل الحقول بسطر منطق واحد — يظهر الاستعلام في *أي* حقل فيطابق. ونسخ الأحرف يجعل `unix` مساويًا لـ`UNIX`.

**🎯 الناتج المتوقع :**

```
search('turing')      -> ['turing1950']
search('addison')     -> ['knuth1984', 'lamport1994']
search('1984')        -> ['knuth1984']
```

**🩹 إذا لم يعمل :** إذا أعاد `search('UNIX')` قيمة `[]`, فإن `casefold()` طُبِّق على الاستعلام فقط. إذا طابق `search('1984')` عنوانًا يحوي «1984» *و* السنة الفعلية، فكومة البحث تدمج الحقول بالسلاسل — قرّر هل يجب أن تطابق السنة تمامًا أم كسلسلة فرعية (هنا: سلسلة فرعية).

### 2.2 افهم النتائج

**👟 تلميح البداية :** اطبع أسطر APA لنتائج استعلام.

```python
# citations.py (continued)
for key in search("addison"):
    print(f"[{key:>10}] {format_apa(bib[key])}")
```

إعادة `search('addison')` لنتيجتين لحظة تعليمية: «Addison» *ناشر*, وهي تظهر في `venue` الكتابين معًا. لا يميّز بحث الكلمات المفتاحية مؤلفًا عن ناشر عن سنة — إنه يجد نصًّا فحسب.

**🎯 الناتج المتوقع :**

```
[ knuth1984] Donald E. Knuth (1984). The TeXbook. Addison-Wesley.
[lamport1994] Leslie Lamport (1994). LaTeX: A Document Preparation System. Addison-Wesley.
```

**🩹 إذا لم يعمل :** إذا طبعت الحلقة أسطرًا أكثر أو أقل مما أبلغ `search`, فدالة البحث وهذه الحلقة مختلفتان — أعد استخدام `search`, لا تعِد كتابة منطقها.

### 2.3 تحقّق من البحث

**✅ قائمة التحقق**

- ✅ مطابقة غير حساسة للحالة عبر المؤلف والعنوان والمكان.
- ✅ `search('addison')` → كتابان (مطابقة ناشر)، `search('1984')` → Knuth فقط.
- ✅ البحث دالة خالصة من `bibliography` + الاستعلام — نفس المخزن، نفس النتائج.

**🤔 سؤال (أسئلة) سقراطي(ة) :**

- الاستعلام سلسلة فرعية: `'a'` يطابق كل شيء تقريبًا، و`'e'` أكثر. أي نوع من المجموعات سيجعل مطابقة النص الكامل بلا قيمة، وأي ترقية بسطرَين (مثل بحث مقيّد بحقل `author:knuth`) قد تصلحه؟
- دمْج الحقول في كومة بحث واحدة يفقد *أين* حدثت المطابقة. كيف توسّع `search` لتعيد أزواج `(key, field)` — ولماذا قد يريد مدير قوائم المراجع الإبلاغ عن «طابقت في venue» مقابل «طابقت في title»؟

## الخطوة 3: افحص كل استشهاد في النص

يجب أن تحوي قائمة المراجع كل عمل استُشهد به، ولا يجوز أن يفقد المخزن ما يُستشهد به. الحساب على المجموعات يفعل هذا في سطرين.

### 3.1 المفقود وغير المستخدم

**👟 تلميح البداية :** تستشهد مخطوطة بـ`in_text`؛ احسب `missing = cited − stored` و`unused = stored − cited`.

```python
# citations.py (continued)
in_text = ["knuth1984", "turing1950", "shannon1948", "hopper1978",
           "lamport1994", "smith2021"]

missing = sorted(set(in_text) - set(bib))
unused = sorted(set(bib) - set(in_text))
print("MISSING (cited but no entry) :", missing)
print("UNUSED  (stored but not cited):", unused)
```

`set(in_text) - set(bib)` تعني «استشهادات بلا موطن» — `smith2021` في النص لكنه ليس في المخزن. و`set(bib) - set(in_text)` تعني «مدخلات مخزنة لم يُذكر أحد منهم» — `ritchie1974` في المكتبة لكن لا جملة تستشهد به. سطر واحد في كل اتجاه، وأكثر ما يحب المراجعون اكتشافه (مرجع مفقود) يبرز فورًا.

**🎯 الناتج المتوقع :**

```
MISSING (cited but no entry) : ['smith2021']
UNUSED  (stored but not cited): ['ritchie1974']
```

**🩹 إذا لم يعمل :** إذا انقلب `missing` و`unused`, فترتيب الطرح انعكس — المعامل الأول هو «ما لدينا»، والثاني هو «ما نريد». إذا لم يظهر `smith2021`, فقائمة المخطوطة والمخزن يستخدمان مقابض غير متسقة (أخطاء كتابة) — وحّد المفاتيح قبل الفرق.

### 3.2 الإصلاح

**👟 تلميح البداية :** أضف المدخل المفقود، ثم أعد التحقق في الاتجاهين ليرينا فارغين.

```python
# citations.py (continued)
bib["smith2021"] = {
    "authors": "Barbara J. Smith", "title": "Design patterns for tiny data pipelines",
    "year": 2021, "venue": "Journal of Small Systems", "type": "article"}

missing = sorted(set(in_text) - set(bib))
unused = sorted(set(bib) - set(in_text))
print("MISSING after fix :", missing)
print("UNUSED  after fix :", unused)
```

إضافة المدخل يعيد توازن المجموعات: `smith2021` أصبح يُحَلّ الآن، فصار `missing` فارغًا. ويبقى `ritchie1974` غير مستخدم — نتيجة حقيقية: المكتبة تحوي مصدرًا لا تذكره المخطوطة إطلاقًا (إما استشهِد به صراحةً أو أزله).

**🎯 الناتج المتوقع :**

```
MISSING after fix : []
UNUSED  after fix : ['ritchie1974']
```

**🩹 إذا لم يعمل :** إذا ما زال `UNUSED` يسرد `smith2021`, فمفتاح المدخل ومقبض النص يختلفان بالحالة أو المسافات — اجعل `set(in_text)` و`set(bib)` يتشاركان تحويلًا موحّدًا. إذا ابتلع الإصلاح `missing` القديم بصمت, فتعيين `bib["smith2021"]` جاء بعد إعادة الفحص (الترتيب!).

### 3.3 تحقّق من المدقق

**✅ قائمة التحقق**

- ✅ المفقود (smith2021) وغير المستخدم (ritchie1974) وُجدا بفرق واحد لكل منهما.
- ✅ بعد تسجيل smith2021, يكون `missing` فارغًا و`unused` هو `['ritchie1974']` فقط.
- ✅ لا يتداخل `missing`/`unused` أبدًا — خطأ تخطيطي (كنسخ نسختين من `bib`) يصير مستحيلًا بمجرد أن تصبح المجموعات متميزة.

**🤔 سؤال (أسئلة) سقراطي(ة) :**

- ترتيب `set` اعتباطي لقائمة سلاسل؛ أنت فرزت النتيجتين. لماذا يهمّ *الفرز* في التقرير للقارئ البشري، وأين قد يضلل الناتج المفرز فعلًا (مثل الفرز بسنة الاكتشاف لا بالمقبض)؟
- «مدخل غير مستخدم» قد يعني «لم يُستشهد به بعد» أو «بقايا قديمة عديمة الفائدة». ما الأثر الجانبي لإزالة مدخل غير مستخدم على التشغيل التالي — ولماذا تحذير بأسلوب lint (بلا حذف تلقائي أبدًا) سلوك أأمن للأداة؟

## الخطوة 4: نظّف المكررات وعدّ الأنواع

تتضاعف قوائم المراجع بهدوء — نفس الكتاب المُدخل مرتين بحقول مختلفة قليلًا. الخطوة 4 تطبِّع العناوين لتلتقط التكرار وتعدّ الأنواع.

### 4.1 شبه المكرر

**👟 تلميح البداية :** زوّد المخزن بكتاب واحد موجود أصلًا تحت مقبض ثانٍ بحروف/طبعة مختلفة.

```python
# citations.py (continued)
duplicates = {
    "lamport1994": {"authors": "Leslie Lamport", "title": "LaTeX: A Document Preparation System",
                    "year": 1994, "venue": "Addison-Wesley", "type": "book"},
    "lamport94": {"authors": "L. Lamport", "title": "LaTeX: a document preparation system",
                  "year": 1994, "venue": "Addison-Wesley Pub.", "type": "book"},
}

def norm_title(title):
    return " ".join(title.casefold().split())

dups = []
for a, b in itertools.combinations(duplicates, 2):
    if norm_title(duplicates[a]["title"]) == norm_title(duplicates[b]["title"]):
        dups.append((a, b))
print("NEAR-DUPLICATES:", dups)
```

رتّب `norm_title` المسافات ووحّد حروف العنوان — `"LaTeX: A Document Preparation System"` و`"LaTeX: a document preparation system"` يصيران السلسلة نفسها، فيُعلَّم المقبضان كعمل واحد. اختبار مساواة خام سيفوّت هذا لفرق الحروف؛ الطبْع هو ما يحوّل «شبه متطابق» إلى «متطابق».

**🎯 الناتج المتوقع :** `NEAR-DUPLICATES: [('lamport1994', 'lamport94')]`

**🩹 إذا لم يعمل :** إذا لم يُعلَّم أي زوج، فالمطبِّع لم يجرِ (قارن العناوين الخام — تختلف الحروف). إذا عُلِّم أكثر من زوج، فإن `itertools.combinations(…, 2)` جال على مخزن يحوي المكررات فعلًا — اختبر على قاموس `duplicates` الصغير، لا على `bib`.

### 4.2 عدّ الأنواع

**👟 تلميح البداية :** عدّ المدخلات لكل `type` بقاموس كنمط مدرّج.

```python
# citations.py (continued)
types = {}
for entry in bib.values():
    types[entry["type"]] = types.get(entry["type"], 0) + 1
print("BY TYPE:", types)
```

مدرّج الأنواع جردٌ بسطر واحد: كم مقالًا مقابل كتب يشكّل قسم المنهجية لديك. `get(type, 0) + 1` هو اصطلاح العداد الذي رأيته في متتبع الكربون — أول ظهور يبدأ من الصفر.

**🎯 الناتج المتوقع :** `BY TYPE: {'book': 2, 'article': 4}`

**🩹 إذا لم يعمل :** إذا بلغت الكتب 3، فقد تسلل مدخل مكرر إلى `bib` — المشكلة التي توجد الخطوة 4 ليُلتقطها. إذا كان العدّ ثابتًا (`{'book': 1}`)، فتحدّث الحلقة المفتاح نفسه في كل مرة بدل كل مدخل.

### 4.3 تحقّق من التنظيف

**✅ قائمة التحقق**

- ✅ `lamport1994` مقابل `lamport94` مُعلَّمان شبه مكررين بالعنوان المطبَّع.
- ✅ مدرّج الأنواع `{'book': 2, 'article': 4}`.
- ✅ التطبيع (توحيد الحروف + المسافات) هو *سبب* تطابق الأزواج والمجاميع لكل نوع.

**🤔 سؤال (أسئلة) سقراطي(ة) :**

- يطوي `norm_title` الحالات والمسافات لكن لا علامات الترقيم — `"The UNIX Operating System"` مقابل `"The UNIX Operating System."` لن يطابقا. أي مطبِّعَين سيجعلانهما يطابقان، وما الزوج «الصديق الكاذب» الذي قد يدمانه خطأً؟
- السنة ليست جزءًا من فحص التكرار. طبعتان *مختلفتان* لكتاب مدخلان صحيحان، ومع ذلك لهما عنوانان شبه متطابقين. كيف تترك «نفس العنوان، سنة مختلفة» يمر — ومتى ينبغي *للطبعة الأحدث* أن تستبدل القديمة تلقائيًا؟

## الخطوة 5: ولّد قسم References

النتيجة النهائية: قائمة مراجع مفروزة على الشاشة، وفي ملف، ونسخة JSON احتياطية للمخزن.

### 5.1 افرز بالسنة، ثم المؤلف

**👟 تلميح البداية :** `sorted(bib, key=lambda k: (bib[k]["year"], bib[k]["authors"].casefold()))`, مرقّمة.

```python
# citations.py (continued)
order = sorted(bib, key=lambda k: (bib[k]["year"], bib[k]["authors"].casefold()))
for i, key in enumerate(order, start=1):
    print(f"{i:>2}. {format_apa(bib[key])}")
```

فرزها بالسنة أولًا ثم المؤلف يحاكي ترتيب قائمة المراجع النموذجي (كرونولوجي، تُكسر التعادلات أبجديًا). المفتاح الثابت ينجو من الفرز — لم تُنسخ المدخلات خارج مواضعها قط.

**🎯 الناتج المتوقع :**

```
 1. Claude E. Shannon (1948). A mathematical theory of communication. Bell System Technical Journal.
 2. Alan M. Turing (1950). Computing machinery and intelligence. Mind 59 (236).
 3. Dennis M. Ritchie; Ken Thompson (1974). The UNIX time-sharing system. Communications of the ACM.
 4. Grace M. Hopper (1978). The education of a computer. IEEE Transactions on Computers.
 5. Donald E. Knuth (1984). The TeXbook. Addison-Wesley.
 6. Leslie Lamport (1994). LaTeX: A Document Preparation System. Addison-Wesley.
```

**🩹 إذا لم يعمل :** إذا كانت التواريخ في غير موضعها (1948 بعد 1984), فقد فُرزت `year` *كسلسلة* — حوّلها إلى عدد صحيح أو قارن عدديًا. إذا اختلف المؤلفون داخل سنة واحدة، فلم يعمل حسم التعادل على `authors.casefold()`.

### 5.2 احفظ وأعد التحميل

**👟 تلميح البداية :** اكتب أسطر المراجع إلى `references.txt` والمخزن إلى `bib.json`, ثم أعد تحميل المخزن وأثبت أن `len` والمفاتيح نجت.

```python
# citations.py (continued)
with open("references.txt", "w") as f:
    for key in order:
        f.write(format_apa(bib[key]) + "\n")

with open("bib.json", "w") as f:
    json.dump(bib, f, indent=2)

loaded = json.load(open("bib.json"))
print("bib.json round-trip:", len(loaded), "entries,",
      "keys match" if sorted(loaded) == sorted(bib) else "KEYS MISMATCH")
```

`references.txt` هو الناتج البشري (قسم References كنص عادي). و`bib.json` هو الناتج الآلي — المخزن كله مسلسلًا كي يعيد تحميله تشغيلٌ لاحق دون إعادة كتابة المدخلات. يحوّل JSON القاموس المتداخل إلى نص قابل للنقل وبالعكس.

**🎯 الناتج المتوقع :**

```
bib.json round-trip: 7 entries, keys match
```

…و`references.txt` يحوي الأسطر الستة المفرزة من 5.1 — إضافة إلى `bib.json` مستعادًا بسبعة مدخلات (الستة الأصلية و`smith2021`).

**🩹 إذا لم يعمل :** إذا أبلغ الترميز الدائري مدخلات أقل، فقد أسقط JSON بصمت مدخلًا لم تكن قيمته قابلة للتسلسل (مثل `datetime`). إذا طبع `keys match` عدم تطابق، فمفاتيح إعادة التحميل تختلف ترتيبًا أو تهجئة — قارنها كمجموعات؛ ترتيب كائن JSON محفوظ عمليًا لكنه غير مضمون أبدًا.

### 5.3 تحقّق من الناتج

**✅ قائمة التحقق**

- ✅ قائمة المراجع مفروزة بالسنة ثم المؤلف — Shannon 1948 أولًا، وLamport 1994 أخيرًا.
- ✅ `references.txt` يحوي 6 أسطر نظيفة؛ و`bib.json` يعيد تحميل 7 مدخلات بمفاتيح مطابقة.
- ✅ أنتج `format_apa` نفسه كل سطر — الشاشة والملف وJSON لا يختلفون أبدًا.

**🤔 سؤال (أسئلة) سقراطي(ة) :**

- فُرز قسم References زمنيًا — لكن كثيرًا من المجلات تفرز *أبجديًا* بالمؤلف. أي سطر واحد يحوّل السياسة إلى الأبجدي، ولماذا يبقى *المنسّق* دون مساس في الحالتين؟
- `json.dump(bib, f, indent=2)` لا يعيد ترتيب شيء لكن الملف يكبر. والترميزات الدائرية التي تتقاسم `sorted(…) == sorted(…)` تخفي الترتيب؛ كيف تطبع `bib.json` برقم نسخة (مثل حقل `"schema": 2`) كي يرفض تحميلٌ مستقبلي ملفًا غير متوافق بأناقة؟

## ⚠️ مآزق شائعة

- **المفاتيح مقابل البيانات.** المقبض يعرّف العمل؛ والمدخل يصفه. تحرير *المفتاح* عند إعادة تسمية يكسر الاستشهادات في النص؛ تحرير *الحقول* لا يكسرها قط. أبقِ المفاتيح ثابتة.
- **الحالة في المطابقة.** يجب أن يستخدم `search` و`norm_title` كلاهما `casefold()`. اختبار `in` الخام على عناوين مختلطة الحالة يفوّت كل شبه تكرار ونصف عمليات البحث.
- **المفرز مقابل ترتيب الإدراج.** ترتيب إدراج القاموس لطيف لكنه ليس *سياسة*؛ يفرز قسم References صراحةً بـ`(year, author)`. لا تعتمد على ترتيب القاموس كأنه الفرز.
- **فروق المجموعات في الاتجاه الصحيح.** `set(in_text) - set(bib)` = استُشهد ولم يُخزن (مفقود)، وعكسه = غير مستخدم. اتجاه واحد منكوس ويبلّغك عن مدخلات شبحية بدل مفقودة.
- **السنوات الوتّرية تُفرز خطأ.** `"1978" < "1948"` *كسلسلتين* هو `False` — حوّل السنوات إلى `int` (أو حشوها) قبل الفرز الزمني.
- **شبه المكررات تحتاج حوض مقارنة.** فحص كل مدخل ضد «قائمة بعناوين معروفة» مكتوبة يدويًا يفوّت أزواجًا *داخل* المخزن — استخدم `itertools.combinations(keys, 2)` على العناوين المخزنة.

## ما بنيته للتو

مدير استشهادات ينتقل من الحقائق الببليوغرافية الخام إلى قائمة مراجع تقاوم المراجعين: مخزن قاموس-داخل-قاموس بمقابض ثابتة، ودالة `format_apa` واحدة تمتلك الأسلوب، وبحثًا بسلاسل فرعية عبر الحقول، وفحص صحة بسطرين بفرق المجموعات يجد الاستشهادات المفقودة وغير المستخدمة قبل أن يفعلها بشري، وكشف تكرارات بالعنوان المطبَّع، ومدرّج أنواع، ومولدًا مفروزًا بالسنة/المؤلف يكتب ملف `References` بشريًا ونسخة JSON احتياطية. الأفكار تتجاوز قوائم المراجع كثيرًا: **أبقِ المعرّفات الثابتة منفصلة عن السجلات القابلة للتغيير**؛ **وفوّض لتنسيق واحد امتلاك كل عرض**؛ **طبِّع قبل المقارنة**؛ **واجعل فحص الصحة فرق مجموعات** — الأنماط الثلاثة نفسها تشغّل أدلة الموظفين وبيانات الحزم وذاكرات الترجمة.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/citation-manager/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/citation-manager) في مستودع المقرر هو المدير الكامل كملف دفتر — مخزن، ومنسّق، وبحث، وفحوصات المفقود/غير المستخدم، وإزالة التكرار، وقسم References المفرز + ترميز JSON دائري، يعمل في Colab/Kaggle/Binder. استنسخ المستودع أو [افتحه في Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## إلى أين تذهب من هنا

- حمّل ملف BibTeX `.bib` حقيقيًا بدل كتابة المدخلات يدويًا — حلّل أسطر `@article{key, field = value}` وغذِّ بها `bib`.
- أضف بحثًا مقيّد الحقل (`author:knuth`, `year:1974`) يعيد أزواج `(key, field)` بدل كومة بحث مدمجة.
- نفّذ **«التحويل إلى MLA»**: منسّق ثانٍ ومعامل `style` في `format_apa` — إثباتًا أن قرار الأسلوب معزول في مكان واحد.
- رتّب المجلات: اعمل مدرّجًا لقيم `venue` وأبرز أي المنافذ تعتمد عليها مراجعك.

## شارك مشروعك مع الصف

بنيت شيئًا تفخر به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع قدّمها طلاب آخرون — وREADME الخاص به يحوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓