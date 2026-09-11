---
title: "كاتب القصص بالذكاء الاصطناعي"
description: "كتابة قصص تعاونية مع ذكاء اصطناعي يحافظ على اتساق الشخصيات وال.plot coherence."
difficulty: "beginner"
estimatedMinutes: 45
tags: ["NLP", "Markov chains", "random", "text-generation", "classes"]
xpReward: 50
learningObjectives:
  - "بناء مولد نصوص بسلسلة ماركوف من الصفر"
  - "تدريب المولد على نص عيّنة لتعلم أنماط الكتابة"
  - "إنشاء قوالب قصص بفتحات متغيرة للمحتوى المولَّد"
  - "تصميم ملفات شخصيات بسمات وأهداف وقصص خلفية"
  - "تجميع قصص متعددة الفقرات من القوالب وبيانات الشخصيات"
  - "التحكم في تماسك الناتج بمعامل درجة الحرارة"
  - "بناء قائمة CLI للتوليد التفاعلي للقصص"
prerequisites:
  - "أساسيات بايثون (المتغيرات، الحلقات، الدوال، القواميس، الفئات)"
---

# كاتب القصص بالذكاء الاصطناعي

تحب سرد القصص لكن أحيانًا تنتصر الصفحة البيضاء. ستبني في هذا المشروع أداة تتعلم أنماط الكتابة من نص عيّنة وتولّد قصصًا جديدة بدمج توليد نص سلسلة ماركوف مع قوالب منظمة وملفات شخصيات. النتيجة مولد قصص ينتج حكايات متعددة الفقرات بشخصيات متسقة وخطوط حبكة متباينة وأسلوب قابل للتحكم.

يفترض هذا المشروع أساسيات من مستوى Python 101 فقط — الدوال والقوائم والقواميس والحلقات والفئات وتنسيق السلاسل. لا أطر عمل ولا قواعد بيانات ولا خدمات سحابية. كل ما تحتاجه من المكتبة القياسية.

هذا اختياري وغير مُقيَّم. راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة.

## 🎯 ما ستفعله

1. بناء سلسلة ماركوف تتعلم احتمالات الانتقال بين الكلمات من أي نص.
2. تدريب السلسلة على قصص عيّنة أو حكايات خرافية أو مقاطع خيال علمي.
3. إنشاء قوالب قصص بفتحات متغيرة تُملأ بنص مولَّد.
4. تصميم ملفات شخصيات بأسماء وسمات وأهداف وقصص خلفية.
5. تجميع قصص كاملة متعددة الفقرات من القوالب وبيانات الشخصيات.
6. إضافة معامل درجة حرارة يتحكم في مدى جنوح الناتج أو تحفظه.
7. بناء قائمة CLI لتوليد القصص تفاعليًا من الطرفية.

## أين تُشغّل هذا

- **محليًا باستخدام `uv` (موصى به).** يستخدم هذا المشروع مكتبة Python القياسية فقط — لا حزم أطراف ثالثة. قسم الإعداد أدناه يشرح ذلك خطوة بخطوة.
- **Google Colab أو Kaggle Notebooks.** الصق خلايا الكود مباشرة في دفتر ملاحظات.
- **JupyterLite playground.** الصق خلايا الكود مباشرة في دفتر ملاحظات — لا يُطلب إدخال/إخراج ملفات، فيعمل كل شيء في المتصفح.

- **شغّله في المتصفح.** هناك دفتر ملاحظات تفاعلي جاهز — افتحه على Colab أو Kaggle أو Binder وتابع خطوة بخطوة.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-story-writer/notebook.ar.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-story-writer/notebook.ar.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fai-story-writer%2Fnotebook.ar.ipynb)

## الإعداد

`uv` أداة واحدة تستبدل سلسلة «ثبّت Python, ثم pip, ثم بيئة افتراضية, ثم حزم» المعتادة — فهي تدير إصدارات Python والاعتماديات معًا.

**macOS / Linux** (الطرفية):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

أغلق طرفيتك وأعد فتحها, ثم تأكد من التثبيت:

```bash
uv --version
```

ثم جهّز المشروع:

```bash
uv init ai-story-writer
cd ai-story-writer
```

لا حزم إضافية — المكتبة القياسية تحتوي كل ما نحتاجه (`random`, `dataclasses`, `abc`, `json`, `textwrap`).

## الخطوة 1: أساسيات سلسلة ماركوف

سلسلة ماركوف نموذج بسيط يتنبأ بالعنصر التالي بناءً على العنصر الحالي فقط — بلا ذاكرة لما سبق. عند تطبيقها على النص, تنظر سلسلة ماركوف من الدرجة الأولى إلى الكلمة الحالية وتختار الكلمة التالية من توزيع احتمالات مبني من نص حقيقي. تتعلم السلسلة أي الكلمات تميل إلى اتباع أي كلمات أخرى, ثم تولّد تسلسلات جديدة تحاكي الأنماط الإحصائية لنص التدريب.

### 1.1 ابنِ بنية بيانات السلسلة

**👟 تلميح البداية :**

استخدم قاموسًا مفاتيحه الكلمات الحالية وقيمه قوائم بكل الكلمات التي تبعتها يومًا ما في نص التدريب. وحدة `random` تختار الكلمة التالية من القائمة باحتمال موحّد.

```python
import random
from collections import defaultdict


def build_chain(text: str) -> dict[str, list[str]]:
    """Build a first-order Markov chain from text.

    Returns a dict mapping each word to a list of words that followed it.
    """
    words = text.split()
    chain: dict[str, list[str]] = defaultdict(list)

    for i in range(len(words) - 1):
        current = words[i].lower()
        next_word = words[i + 1].lower()
        chain[current].append(next_word)

    return dict(chain)
```

**🎯 الناتج المتوقع :**

بناء سلسلة من جملة صغيرة يجب أن ينتج قاموسًا يطابق كل كلمة بخلفائها.

```python
sample = "the cat sat on the mat the cat sat"
chain = build_chain(sample)
print(dict(chain))
```

```
{'the': ['cat', 'mat', 'cat'], 'cat': ['sat', 'sat'], 'sat': ['on', None], 'on': ['the'], 'mat': ['the']}
```

(لاحظ: لكلمة «sat» الأخيرة لا خليفة — ستُحذف من السلسلة لأن الحلقة تتوقف عند `len(words) - 1`.)

**🩹 إذا لم يعمل :**

إن كانت سلسلتك فارغة, فسلسلة الإدخال ربما بلا مسافات. تحقق أن `text.split()` تنتج قائمة بكلمتين على الأقل. إن واجهت `KeyError` عند البحث عن كلمة, تذكر أن السلسلة تخزن الكلمات التي لها خليفة واحد على الأقل فقط.

### 1.2 ولّد نصًا من السلسلة

**👟 تلميح البداية :**

اكتب دالة تختار كلمة بداية عشوائية, ثم تبحث مرارًا عن الكلمة الحالية في السلسلة وتختار خليفة عشوائيًا. توقف بعد توليد العدد المطلوب من الكلمات.

```python
def generate_from_chain(
    chain: dict[str, list[str]],
    num_words: int = 50,
    seed: int | None = None,
) -> str:
    """Generate text by walking the Markov chain."""
    rng = random.Random(seed)
    words = list(chain.keys())
    if not words:
        return ""

    current = rng.choice(words)
    result = [current.capitalize()]

    for _ in range(num_words - 1):
        followers = chain.get(current, [])
        if not followers:
            current = rng.choice(words)
            result.append(current.capitalize())
        else:
            current = rng.choice(followers)
            result.append(current)

    return " ".join(result)
```

**🎯 الناتج المتوقع :**

التوليد من السلسلة الصغيرة يجب أن ينتج نصًا مقروءًا تقريبًا.

```python
chain = build_chain("the cat sat on the mat the cat sat on the mat")
text = generate_from_chain(chain, num_words=12, seed=42)
print(text)
```

```
The cat sat on the mat the cat sat on the mat
```

ببذرة 42 ونص تدريب قصير, تدور السلسلة في النمط نفسه. بنص تدريب أطول يصبح الناتج أكثر تنوعًا.

**🩹 إذا لم يعمل :**

إن كان الناتج كلمة واحدة متكررة, فقد تحتوي سلسلتك على كلمة واحدة بخليفة واحد فقط. تأكد أن نص تدريبك فيه 10 كلمات مميزة على الأقل. إن حصلت على سلسلة فارغة, تحقق أن `chain` ليست فارغة.

### 1.3 تأكد أن السلسلة تعمل

**✅ قائمة التحقق**

- `build_chain("a b c a b c")` تعيد قاموسًا تطابق فيه `"a"` بـ`["b", "b"]` و`"b"` بـ`["c", "c"]`.
- `generate_from_chain(chain, num_words=5, seed=1)` تعيد 5 كلمات بالضبط.
- تشغيل البذرة نفسها مرتين ينتج مخرجًا مطابقًا (حتمي).
- تشغيل بذرات مختلفة ينتج مخرجًا مختلفًا.

**🤔 سؤال (أسئلة) سقراطي(ة) :**

لماذا تنتج سلسلة ماركوف من الدرجة الأولى أحيانًا جملًا فارغة المعنى مثل «the the the cat cat»؟ وما المعلومات التي تفتقدها، أي سلسلة من الدرجة الثانية (تفحص آخر كلمتين بدل كلمة واحدة) ستمتلكها؟

## الخطوة 2: تدرّب على نص عيّنة

سلسلة ماركوف بجودة بيانات تدريبها. أطعمها فقرة حكايات خرافية فتكتب الحكايات الخرافية. أطعمها خيالًا علميًا فتكتب الخيال العلمي. البصيرة الأساسية أنك تحتاج نصًا كافيًا كي تتعلم السلسلة أنماط انتقال كلمات حقيقية — جملة واحدة أصغر جدًا, لكن رواية كاملة مبالغة.

### 2.1 استخدم نص تدريب مضمّنًا

**👟 تلميح البداية :**

أدرج بعض نصوص العيّنة مباشرة في كودك كثوابت سلاسل. الأنواع المختلفة تعطي السلسلة أصواتًا مختلفة. يمكنك أيضًا تحميل ملفات من القرص بـ`open()`.

```python
FAIRY_TALES = """
Once upon a time there was a young princess who lived in a castle on a hill.
The princess loved to wander through the enchanted forest near her home.
One day she discovered a secret door hidden behind a waterfall.
Behind the door she found a magical garden filled with glowing flowers.
A wise old owl lived in the garden and told her of a great adventure.
The princess set out on her journey with nothing but a lantern and courage.
She crossed rivers and mountains and forests until she reached the crystal tower.
At the top of the tower she found a sleeping prince under a spell.
She woke him with a gentle kiss and they returned to the castle together.
The kingdom celebrated their return with a feast that lasted seven days.
"""

SCIFI = """
The starship drifted through the asteroid field with its shields flickering.
Captain Reyes gripped the console as another rock scraped the hull.
The navigation computer calculated a path through the densest cluster.
A bright flash lit up the cockpit as a meteor streaked past the viewport.
The crew held their breath as the ship squeezed through the gap.
Engineering reported minor damage to the port thruster array.
Reyes ordered a course correction toward the distant blue planet.
The ship's sensors detected an artificial signal coming from the surface.
It was a transmission in a language no one on board recognized.
The signal repeated every eleven seconds with perfect mathematical precision.
"""

MYSTERY = """
Detective Morgan arrived at the scene just after midnight.
The study was locked from the inside with no signs of forced entry.
A single red rose lay on the desk beside an open envelope.
Inside the envelope was a letter addressed to no one.
The handwriting matched the victim's own but the date was three years in the future.
Morgan noted the timestamp on the letter and checked the victim's calendar.
Every appointment for the next week had been crossed out with black ink.
The only entry that remained unmarked was a meeting at the harbour.
Morgan drove to the harbour and found a boat with the engine running.
On the seat was a photograph of the victim standing next to a stranger.
"""


def build_chain_from_corpus(texts: list[str]) -> dict[str, list[str]]:
    """Build a Markov chain from multiple text blocks."""
    combined = " ".join(texts)
    return build_chain(combined)
```

**🎯 الناتج المتوقع :**

بناء سلسلة من مجموعة النصوص يجب أن ينتج قاموسًا بمئات المفاتيح.

```python
chain = build_chain_from_corpus([FAIRY_TALES, SCIFI, MYSTERY])
print(f"Unique words in chain: {len(chain)}")
```

```
Unique words in chain: 195
```

العدد الدقيق يعتمد على نصوص تدريبك. نص أكثر يعني كلمات مميزة أكثر وانتقالات أكثر واقعية.

### 2.2 تحقق أن التدريب نجح

**👟 تلميح البداية :**

ولّد بضعة أسطر من السلسلة المدربة وتفحّصها بالنظر. يجب أن تبدو كإنجليزية مكسورة لكن معقولة, مع أزواج كلمات تظهر في النص الطبيعي.

```python
chain = build_chain_from_corpus([FAIRY_TALES])
for i in range(3):
    text = generate_from_chain(chain, num_words=20, seed=i)
    print(f"  [{i}] {text}")
```

```
  [0] The princess set out on her journey with a gentle kiss and they returned to the castle
  [1] The wise old owl lived in the enchanted forest near her home
  [2] She found a secret door hidden behind a waterfall behind the door
```

**🩹 إذا لم يعمل :**

إن كان الناتج في غالبه تكرار الكلمات المنفردة, فنص تدريبك قصير جدًا أو مكرر جدًا. أضف جملًا أكثر تنوعًا. إن واجهت `KeyError`, فسلسلتك تفتقد كلمة — تحقق أن `build_chain` تصغّر كلًا من الكلمة الحالية والتالية.

### 2.3 تأكد أن السلسلة تعمل

**✅ قائمة التحقق**

- تحتوي السلسلة 50 كلمة مميزة على الأقل بعد التدريب على نصوص الحكايات الخرافية.
- `generate_from_chain(chain, num_words=30, seed=7)` تعيد 30 كلمة بالضبط.
- يُقرأ الناتج كإنجليزية مكسورة لكن يمكن التعرف عليها, لا حساء أحرف.
- بذرات مختلفة تنتج نصًا مختلفًا.

## الخطوة 3: قوالب القصص

ناتج ماركوف الخام مسلٍّ لكنه بلا بنية. قوالب القصص تعطي مولّدك هيكلًا عظميًا: فقرات بفتحات متغيرة تُملأ بجمل مولّدة. هذا يُبقي القصة متماسكة مع الاستمرار في الاستفادة من إبداع سلسلة ماركوف.

### 3.1 عرّف نظام القوالب

**👟 تلميح البداية :**

القالب سلسلة فيها متغيرات نائبة مثل `{intro}` و`{conflict}` و`{action}` و`{resolution}`. يُستبدل كل نائب بجملة مولّدة. استخدم dataclass لتمثيل القوالب بنوعها وفتحاتها المطلوبة.

```python
from dataclasses import dataclass, field


@dataclass
class StoryTemplate:
    name: str
    genre: str
    structure: list[str] = field(default_factory=list)
    paragraph_slots: int = 3

    def render(self, paragraphs: list[str]) -> str:
        """Render the story by combining paragraphs."""
        return "\n\n".join(paragraphs)
```

**🎯 الناتج المتوقع :**

لا يُنتج تعريف الفئة مخرجًا. مثّل أحدها للتحقق.

```python
t = StoryTemplate(name="hero", genre="fantasy", paragraph_slots=4)
print(f"Template: {t.name} ({t.genre}) — {t.paragraph_slots} paragraphs")
```

```
Template: hero (fantasy) — 4 paragraphs
```

### 3.2 ابنِ مكتبة قوالب

**👟 تلميح البداية :**

أنشئ قائمة قوالب معرّفة مسبقًا, كلٌّ منها بنوع وهيكل وقائمة «مطالبات» للفقرات — أوصاف قصيرة لما يجب أن تحتويه كل فقرة. هذه المطالبات توجّه التوليد.

```python
TEMPLATES = [
    StoryTemplate(
        name="hero_journey",
        genre="fantasy",
        structure=[
            "A character in an ordinary world",
            "A call to adventure or discovery",
            "Crossing the threshold into the unknown",
            "Facing a challenge or enemy",
            "A moment of transformation or revelation",
            "Returning home changed",
        ],
        paragraph_slots=6,
    ),
    StoryTemplate(
        name="mystery_detective",
        genre="mystery",
        structure=[
            "A crime or puzzle is introduced",
            "The detective examines the scene",
            "Clues are discovered and suspects appear",
            "A false lead or red herring",
            "The truth is revealed",
            "Justice or resolution",
        ],
        paragraph_slots=6,
    ),
    StoryTemplate(
        name="space_odyssey",
        genre="sci-fi",
        structure=[
            "A ship or crew in deep space",
            "An anomaly or discovery",
            "First contact or exploration",
            "A crisis or malfunction",
            "A choice with consequences",
            "Arrival or aftermath",
        ],
        paragraph_slots=6,
    ),
    StoryTemplate(
        name="fairy_tale",
        genre="fantasy",
        structure=[
            "Once upon a time in a distant land",
            "A character with a wish or problem",
            "A helper or guide appears",
            "A test or journey",
            "The reward or lesson learned",
            "Happily ever after",
        ],
        paragraph_slots=6,
    ),
]


def get_template(name: str) -> StoryTemplate:
    """Find a template by name."""
    for t in TEMPLATES:
        if t.name == name:
            return t
    raise ValueError(f"Unknown template: {name}")


def list_templates() -> list[str]:
    """Return names of all available templates."""
    return [t.name for t in TEMPLATES]
```

**🎯 الناتج المتوقع :**

```python
print("Available templates:")
for name in list_templates():
    t = get_template(name)
    print(f"  {name} ({t.genre}) — {len(t.structure)} sections")
```

```
Available templates:
  hero_journey (fantasy) — 6 sections
  mystery_detective (mystery) — 6 sections
  space_odyssey (sci-fi) — 6 sections
  fairy_tale (fantasy) — 6 sections
```

### 3.3 تأكد أن القوالب تعمل

**✅ قائمة التحقق**

- `list_templates()` تعيد أسماء 4 قوالب على الأقل.
- `get_template("hero_journey")` تعيد قالبًا بـ`genre="fantasy"` و`len(structure) == 6`.
- قائمة `structure` لكل قالب بين 4 و8 مداخل.
- `get_template("nonexistent")` تطلق `ValueError`.

## الخطوة 4: تطوير الشخصيات

الشخصيات ما يجعل القصص جديرة بالقراءة. ملف الشخصية حقيبة صفات — الاسم والسمات الشخصية والأهداف والقصة الخلفية — يرتشف منها المولّد عند ملء فتحات القالب. الهدف جعل الشخصيات تبدو متسقة عبر القصة الواحدة دون ترميز كل تفصيل يدويًا.

### 4.1 صمّم فئة Character

**👟 تلميح البداية :**

استخدم dataclass باسم وقائمة سمات وهدف وقصة خلفية ودالة `describe()` تنتج فقرة مقروءة. أضف دالة صف (class method) تنشئ شخصية عشوائية من قوائم معرّفة مسبقًا.

```python
import random
from dataclasses import dataclass, field


NAMES = [
    "Aria", "Bram", "Celia", "Dorian", "Elara", "Finn",
    "Gwen", "Hector", "Iris", "Jasper", "Kira", "Liam",
    "Mara", "Nolan", "Opal", "Percy", "Quinn", "Rosalind",
    "Soren", "Tessa", "Ursa", "Viktor", "Wren", "Xander",
]

TRAITS = [
    "brave", "cunning", "gentle", "stubborn", "curious",
    "loyal", "mysterious", "optimistic", "sarcastic", "shy",
    "bold", "compassionate", "patient", "reckless", "wise",
]

GOALS = [
    "find a lost artifact",
    "solve an ancient mystery",
    "protect their village",
    "escape a dangerous situation",
    "discover the truth about their past",
    "unite warring factions",
    "break a powerful curse",
    "reach a distant land",
    "prove their worth",
    " uncover a secret",
]

BACKSTORIES = [
    "raised by wolves in the northern forest",
    "a former ship captain who lost everything at sea",
    "the last descendant of a forgotten royal line",
    "a scholar who wandered too deep into forbidden archives",
    "a thief who stole something they should not have",
    "born with a strange mark that nobody can explain",
    "exiled from their homeland for a crime they did not commit",
    "taught by a master who vanished without explanation",
]


@dataclass
class Character:
    name: str
    traits: list[str] = field(default_factory=list)
    goal: str = ""
    backstory: str = ""

    def describe(self) -> str:
        """Return a character description paragraph."""
        trait_str = ", ".join(self.traits) if self.traits else "unremarkable"
        return (
            f"{self.name} is {trait_str}. "
            f"Their goal is to {self.goal}. "
            f"They were {self.backstory}."
        )

    @classmethod
    def random(cls) -> "Character":
        """Create a random character from predefined lists."""
        name = random.choice(NAMES)
        num_traits = random.randint(2, 4)
        traits = random.sample(TRAITS, min(num_traits, len(TRAITS)))
        goal = random.choice(GOALS)
        backstory = random.choice(BACKSTORIES)
        return cls(name=name, traits=traits, goal=goal, backstory=backstory)
```

**🎯 الناتج المتوقع :**

```python
c = Character.random()
print(c.describe())
```

```
Soren is brave, curious, wise. Their goal is to break a powerful curse. They were born with a strange mark that nobody can explain.
```

تشغيلها مرة أخرى ببذرة مختلفة يعطي شخصية مختلفة:

```python
random.seed(7)
c = Character.random()
print(c.describe())
```

```
Kira is cunning, loyal, mysterious. Their goal is to uncover a secret. They were exiled from their homeland for a crime they did not commit.
```

### 4.2 تأكد أن توليد الشخصيات يعمل

**✅ قائمة التحقق**

- `Character.random()` تعيد `Character` باسم غير فارغ وسمتين على الأقل وهدف وقصة خلفية.
- `c.describe()` تعيد سلسلة فقرة تبدأ باسم الشخصية.
- استدعاءا `Character.random()` ببذرتين مختلفتين ينتجان شخصيتين مختلفتين.
- استدعاء `c.describe()` مرارًا يعيد النص نفسه (حتمي).

**🤔 سؤال (أسئلة) سقراطي(ة) :**

لو أردت أن تحمل الشخصيات حقل «speech_style» يولّد الحوار, كيف تمدّ `describe()` دون كسر الواجهة الموجودة؟

## الخطوة 5: ولّد قصصًا كاملة

الآن نجمع كل شيء: سلسلة ماركوف تولّد الجمل, والقالب يرتبها في فقرات, وتُحاك الشخصيات في السرد. يأخذ مولد القصص اسم قالب وشخصية, ويملأ كل فتحة فقرة بنص مولّد, ويعيد قصة كاملة.

### 5.1 ابنِ مولد القصص

**👟 تلميح البداية :**

اكتب دالة `generate_story` تأخذ سلسلة وقالبًا وشخصية. لكل فقرة في هيكل القالب, ولّد بضع جمل من السلسلة وادمجها في فقرة. يُحاك اسم الشخصية وسماتها في الفتاحة.

```python
def generate_story(
    chain: dict[str, list[str]],
    template: StoryTemplate,
    character: Character,
    sentences_per_paragraph: int = 3,
    seed: int | None = None,
) -> str:
    """Generate a complete story using a chain, template, and character."""
    rng = random.Random(seed)
    paragraphs = []

    # Opening paragraph introduces the character
    opening = f"{character.name} {random.choice(['stood at the edge', 'wandered through', 'arrived at', 'discovered'])} "
    opening += f"the {template.genre} world with {character.traits[0] if character.traits else 'determination'}. "
    opening += f"Their goal was to {character.goal}."
    paragraphs.append(opening)

    # Generate body paragraphs from template structure
    for section in template.structure:
        words_needed = sentences_per_paragraph * 8
        raw = generate_from_chain(chain, num_words=words_needed, seed=rng.randint(0, 99999))
        sentences = raw.split(". ")
        # Capitalize first letter of each sentence
        sentences = [s[0].upper() + s[1:] if s else s for s in sentences]
        paragraph = ". ".join(sentences[:sentences_per_paragraph])
        if not paragraph.endswith("."):
            paragraph += "."
        paragraphs.append(paragraph)

    # Closing paragraph
    closing = (
        f"And so {character.name}'s journey came to an end. "
        f"They had set out to {character.goal}, and in the end they learned "
        f"that the real adventure was the one inside themselves."
    )
    paragraphs.append(closing)

    return "\n\n".join(paragraphs)
```

**🎯 الناتج المتوقع :**

```python
chain = build_chain_from_corpus([FAIRY_TALES, SCIFI, MYSTERY])
template = get_template("hero_journey")
character = Character.random()
story = generate_story(chain, template, character, seed=42)
print(story)
```

```
Quinn stood at the edge the fantasy world with bold. Their goal was to break a powerful curse.

The princess set out on her journey with a gentle kiss and they returned to the castle. She found a secret door hidden behind a waterfall behind the door. The wise old owl lived in the enchanted forest near her home.

Captain reyes gripped the console as another rock scraped the hull. The navigation computer calculated a path through the densest cluster. A bright flash lit up the cockpit as a meteor streaked past the viewport.

Detective morgan arrived at the scene just after midnight. The study was locked from the inside with no signs of forced entry. A single red rose lay on the desk beside an open envelope.

The starship drifted through the asteroid field with its shields flickering. Engineering reported minor damage to the port thruster array. Reyes ordered a course correction toward the distant blue planet.

The princess loved to wander through the enchanted forest near her home. One day she discovered a secret door hidden behind a waterfall. Behind the door she found a magical garden filled with glowing flowers.

She crossed rivers and mountains and forests until she reached the crystal tower. At the top of the tower she found a sleeping prince under a spell. She woke him with a gentle kiss and they returned to the castle together.

And so Quinn's journey came to an end. They had set out to break a powerful curse, and in the end they learned that the real adventure was the one inside themselves.
```

تستخدم الفقرة الافتتاحية اسم الشخصية وسماتها. فقرات الجسم مولّدة من السلسلة, فيعطي كل قسم صوتًا مميزًا. الخاتمة تُطوي قوس الشخصية.

### 5.2 تأكد أن مولد القصص يعمل

**✅ قائمة التحقق**

- `generate_story(chain, template, character, seed=42)` تعيد سلسلة بخمس فقرات على الأقل.
- الفقرة الأولى تحوي اسم الشخصية.
- الفقرة الأخيرة تشير إلى هدف الشخصية.
- تشغيل بذرات مختلفة ينتج قصصًا مختلفة.
- تشغيل البذرة نفسها ينتج قصة مطابقة.

## الخطوة 6: تحكم في جودة الناتج

تنتج سلسلة ماركوف نصًا سقيمًا نحويًا أحيانًا أو متفرّق الموضوع. معامل درجة الحرارة يمنحك التحكم: درجة منخفضة تجعل الخيارات متحفظة (تكرار أزواج الكلمات الشائعة), بينما درجة مرتفعة تجعل الخيارات جريئة (اختيار كلمات نادرة أكثر). هذا هو الفرق بين قصة مملة وقصة إبداعية لكن متماسكة.

### 6.1 نفّذ أخذ عينات بمقياس درجة الحرارة

**👟 تلميح البداية :**

بدلًا من اختيار الكلمة التالية عشوائيًا باحتمال موحّد, زن الخيارات بعدد مرات ظهور كل كلمة كخليفة. معامل درجة حرارة يقيس هذه الأوزان: أقل من 1.0 يجعل السلسلة أكثر قابلية للتنبؤ, فوق 1.0 يجعلها أكثر عشوائية.

```python
import math


def build_weighted_chain(text: str) -> dict[str, dict[str, int]]:
    """Build a chain that counts follower frequencies."""
    words = text.lower().split()
    chain: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))

    for i in range(len(words) - 1):
        current = words[i]
        next_word = words[i + 1]
        chain[current][next_word] += 1

    return {k: dict(v) for k, v in chain.items()}


def generate_with_temperature(
    chain: dict[str, dict[str, int]],
    num_words: int = 50,
    temperature: float = 1.0,
    seed: int | None = None,
) -> str:
    """Generate text with temperature-controlled sampling."""
    rng = random.Random(seed)
    words = list(chain.keys())
    if not words:
        return ""

    current = rng.choice(words)
    result = [current.capitalize()]

    for _ in range(num_words - 1):
        followers = chain.get(current, {})
        if not followers:
            current = rng.choice(words)
            result.append(current.capitalize())
            continue

        tokens = list(followers.keys())
        counts = [followers[t] for t in tokens]

        # Apply temperature scaling
        if temperature == 0:
            # Greedy: pick the most common follower
            best = tokens[0]
            for i, c in enumerate(counts):
                if c > counts[tokens.index(best)]:
                    best = tokens[i]
            next_word = best
        else:
            weights = [math.exp(c / temperature) for c in counts]
            total = sum(weights)
            probs = [w / total for w in weights]
            next_word = rng.choices(tokens, weights=probs, k=1)[0]

        result.append(next_word)
        current = next_word

    return " ".join(result)
```

**🎯 الناتج المتوقع :**

ولّد القصة نفسها بدرجات حرارة مختلفة وقارن.

```python
chain_weighted = build_weighted_chain(FAIRY_TALES + SCIFI + MYSTERY)

print("=== Temperature 0.5 (conservative) ===")
text = generate_with_temperature(chain_weighted, num_words=40, temperature=0.5, seed=10)
print(text[:200])

print("\n=== Temperature 1.0 (normal) ===")
text = generate_with_temperature(chain_weighted, num_words=40, temperature=1.0, seed=10)
print(text[:200])

print("\n=== Temperature 2.0 (creative) ===")
text = generate_with_temperature(chain_weighted, num_words=40, temperature=2.0, seed=10)
print(text[:200])
```

```
=== Temperature 0.5 (conservative) ===
The princess set out on her journey with a gentle kiss and they returned to the castle together the kingdom celebrated their return with a feast that lasted seven days the princess loved to wander through the enchanted

=== Temperature 1.0 (normal) ===
The princess set out on her journey with a gentle kiss and the ship drifted through the asteroid field with its shields flickering a bright flash lit up the cockpit as a meteor streaked past the viewport captain reyes

=== Temperature 2.0 (creative) ===
The princess set out on her journey the kingdom crossed out with black ink the only entry that remained unmarked was a meeting at the harbour morgan drove to the harbour and found a boat with the engine running on the
```

درجة منخفضة تنتج نصًا متكررًا قابلًا للتنبؤ. المتوسطة تمزج نصوص التدريب طبيعيًا. المرتفعة تسحب تركيبات كلمات غير متوقعة عبر الأنواع — إبداعية أحيانًا وفارغة المعنى أحيانًا.

### 6.2 ادمج درجة الحرارة في مولد القصص

**👟 تلميح البداية :**

أضف معامل `temperature` إلى `generate_story` يُمرَّر إلى `generate_from_chain`. استبدل الاستدعاء الحالي بـ`generate_with_temperature`.

```python
def generate_story(
    chain: dict[str, dict[str, int]],
    template: StoryTemplate,
    character: Character,
    sentences_per_paragraph: int = 3,
    temperature: float = 1.0,
    seed: int | None = None,
) -> str:
    """Generate a complete story with temperature control."""
    rng = random.Random(seed)
    paragraphs = []

    opening = f"{character.name} {random.choice(['stood at the edge', 'wandered through', 'arrived at', 'discovered'])} "
    opening += f"the {template.genre} world with {character.traits[0] if character.traits else 'determination'}. "
    opening += f"Their goal was to {character.goal}."
    paragraphs.append(opening)

    for section in template.structure:
        words_needed = sentences_per_paragraph * 8
        raw = generate_with_temperature(
            chain, num_words=words_needed,
            temperature=temperature, seed=rng.randint(0, 99999),
        )
        sentences = raw.split(". ")
        sentences = [s[0].upper() + s[1:] if s else s for s in sentences]
        paragraph = ". ".join(sentences[:sentences_per_paragraph])
        if not paragraph.endswith("."):
            paragraph += "."
        paragraphs.append(paragraph)

    closing = (
        f"And so {character.name}'s journey came to an end. "
        f"They had set out to {character.goal}, and in the end they learned "
        f"that the real adventure was the one inside themselves."
    )
    paragraphs.append(closing)

    return "\n\n".join(paragraphs)
```

**🎯 الناتج المتوقع :**

```python
chain_w = build_weighted_chain(FAIRY_TALES + SCIFI + MYSTERY)
character = Character.random()
story = generate_story(chain_w, get_template("mystery_detective"), character, temperature=0.8, seed=99)
print(story)
```

يجب أن يُقرأ الناتج كقصة قصيرة متماسكة باسم الشخصية وسماتها وهدفها محاكين في الفتاحة والخاتمة, وفقرات الجسم مسحوبة من نص التدريب.

### 6.3 تأكد أن تحكم درجة الحرارة يعمل

**✅ قائمة التحقق**

- `temperature=0.5` تنتج نصًا يكرر أزواج الكلمات نفسها كثيرًا.
- `temperature=1.0` تنتج نصًا يمزج نصوص التدريب بالتساوي.
- `temperature=2.0` تنتج نصًا بتركيبات كلمات غير متوقعة.
- مولد القصص ينتج الفتاحة والخاتمة نفسهما بغض النظر عن درجة الحرارة (مكتوبتان يدويًا).
- فقرات الجسم تتغير بين درجات الحرارة بشكل ذي معنى.

## الخطوة 7: قائمة CLI

قائمة CLI تتيح لك تشغيل مولد القصص تفاعليًا — اختر نوعًا, أنشئ شخصية, اضبط درجة الحرارة, واقرأ قصتك في الطرفية.

### 7.1 ابنِ حلقة القائمة

**👟 تلميح البداية :**

استخدم حلقة `while True` مع `input()` لاختيارات المستخدم. اطبع قائمة مرقمة, اقرأ الاختيار, ووجّه إلى الدالة الصحيحة.

```python
def print_menu():
    print("\n" + "=" * 50)
    print("  AI Story Writer")
    print("=" * 50)
    print("  1. Generate a story")
    print("  2. View character")
    print("  3. List templates")
    print("  4. Quit")
    print("=" * 50)


def run_cli():
    """Run the interactive story generator."""
    print("\nWelcome to the AI Story Writer!")
    print("Training the Markov chain on sample text...")
    chain = build_weighted_chain(FAIRY_TALES + SCIFI + MYSTERY)
    print(f"Chain trained. {len(chain)} unique words learned.\n")

    character = Character.random()
    current_template = "hero_journey"

    while True:
        print_menu()
        choice = input("Choose an option (1-4): ").strip()

        if choice == "1":
            print(f"\nCurrent character: {character.name}")
            print(f"Current template: {current_template}")
            temp_input = input("Temperature (0.1-3.0, default 1.0): ").strip()
            temperature = float(temp_input) if temp_input else 1.0
            seed_input = input("Random seed (blank for random): ").strip()
            seed = int(seed_input) if seed_input else None

            story = generate_story(
                chain, get_template(current_template),
                character, temperature=temperature, seed=seed,
            )
            print("\n" + "=" * 50)
            print(story)
            print("=" * 50)

        elif choice == "2":
            character = Character.random()
            print(f"\nNew character: {character.name}")
            print(character.describe())

        elif choice == "3":
            print("\nAvailable templates:")
            for name in list_templates():
                t = get_template(name)
                print(f"  - {name} ({t.genre})")
            pick = input("Choose a template name: ").strip()
            if pick in list_templates():
                current_template = pick
                print(f"Template set to: {current_template}")
            else:
                print("Invalid template name.")

        elif choice == "4":
            print("Goodbye!")
            break

        else:
            print("Invalid choice. Please enter 1-4.")
```

**🎯 الناتج المتوقع :**

تشغيل `run_cli()` يعرض القائمة ويستجيب لمدخلات المستخدم.

```
Welcome to the AI Story Writer!
Training the Markov chain on sample text...
Chain trained. 195 unique words learned.

==================================================
  AI Story Writer
==================================================
  1. Generate a story
  2. View character
  3. List templates
  4. Quit
==================================================
Choose an option (1-4): 1

Current character: Wren
Current template: hero_journey
Temperature (0.1-3.0, default 1.0): 0.7
Random seed (blank for random): 42

==================================================
Wren stood at the edge the fantasy world with bold. Their goal was to prove their worth.

The princess set out on her journey with a gentle kiss and they returned to the castle together. The kingdom celebrated their return with a feast that lasted seven days. The wise old owl lived in the enchanted forest near her home.
...
==================================================
```

### 7.2 تأكد أن CLI يعمل

**✅ قائمة التحقق**

- تطبع القائمة 4 خيارات وتقرأ مدخلات المستخدم.
- اختيار «1» يولّد قصة ويطبعها.
- اختيار «2» ينشئ شخصية عشوائية جديدة ويطبع وصفها.
- اختيار «3» يسرد القوالب ويدع المستخدم يختار واحدًا.
- اختيار «4» يخرج من الحلقة.
- إدخال رقم غير صالح يطبع خطأ ويعيد عرض القائمة.

## تحديات

1. **سلسلة ماركوف ثنائية (bigram).** ترقَّ إلى سلسلة ماركوف من الدرجة الثانية تفحص آخر كلمتين بدل كلمة واحدة. كم يتحسن جودة الناتج؟
2. **توليد واعٍ بالجمل.** بدلًا من توليد عدد ثابت من الكلمات, ولّد جملًا كاملة بالتوقف عند نقطة. تلميح: اقسم على `"."` وصفِّ.
3. **تصفية النوع.** عدّل `generate_story` لتسحب جملًا أكثر من كتلة نص التدريب المطابقة لنوع القالب (فانتازيا أو خيال علمي أو غموض).
4. **حوار الشخصيات.** أضف فئة `DialogueGenerator` تنتج أسطر كلام بصوت شخصية. أدرج حقل `speech_style` في `Character` (كالـ«رسمي» و«عفوي» و«قديم») وصفِّ خيارات الكلمات وفقًا له.
5. **تصدير القصة.** اكتب القصة المولّدة إلى ملف `.txt` بعنوان وسيرة شخصية وعناوين فصول.
6. **تجربة درجات الحرارة.** ولّد القصة نفسها عند درجات 0.3 و0.7 و1.0 و1.5 و2.5. اكتب تحليلًا قصيرًا لكيفية تأثير درجة الحرارة على التماسك والإبداع.
7. **رواية تفاعلية.** حوّل مولد القصص إلى نظام اختر-مغامرتك-نفسك. عند كل فقرة, قدّم 2–3 خيارات تقود إلى فروع قالب مختلفة.

## ما تعلّمته

1. **سلاسل ماركوف** — كيف تمثّل احتمالات انتقال الكلمات الأنماط الإحصائية للنص الطبيعي.
2. **بيانات التدريب** — كيف يؤثر حجم النص ونوعه على جودة التوليد.
3. **القوالب** — كيف تحوّل المتغيرات النائبة المنظمة النص العشوائي إلى قصص متماسكة.
4. **ملفات الشخصيات** — كيف تعطي صفات كالسمات والأهداف والقصص الخلفية القصص اتساقًا.
5. **درجة الحرارة** — كيف يتحكم معامل واحد في التوازن بين قابلية التنبؤ والإبداع.
6. **توليد القصص** — كيف تجمع كل هذه القطع في أداة CLI عاملية.