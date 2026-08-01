---
id: wordle-clone
title: "ابنِ نسخة من Wordle"
sidebar_label: "نسخة من Wordle"
slug: /projects/wordle-clone
description: "ابنِ لعبة Wordle حقيقية تعمل في الطرفية من الصفر: تغذية راجعة صحيحة للتخمينات بالأخضر/الأصفر/الرمادي (بما في ذلك خلل الحروف المتكررة الكلاسيكي)، وقائمة كلمات مخصصة، وتتبع إحصائيات دائم عبر الجلسات."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 ابنِ نسخة من Wordle

<ProjectPublishedDate projectId="2027-wordle-clone" />

<ProjectGreeting />

يفترض هذا المشروع فقط الأساسيات بمستوى Python 101 — الدوال، والقوائم، والقواميس، والحلقات، وقراءة وكتابة ملف. بلا pandas، بلا مفتاح API، بلا GPU، بلا أي خدمة خارجية من أي نوع — فقط طرفية، وقائمة كلمات، وبعض المنطق الذي إتقانه أصعب مما يبدو. هذا ما يجعله مشروعًا من العالم الحقيقي *أبكر* ممتازًا لتجربته، حتى قبل بعض المشاريع المتعلقة بـpandas أو الذكاء الاصطناعي: كل ما تحتاجه هو أشياء قد أعطتك إياها Python 101 بالفعل، مطبَّقة على شيء ممتع فعلًا للعب بعده.

هذا اختياري وغير مُقيَّم. راجع [مشاريع من العالم الحقيقي](/docs/projects) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. تنفيذ المنطق الأساسي لتغذية راجعة التخمين — مقارنة تخمين بالكلمة المستهدفة وإنتاج علامات خضراء/صفراء/رمادية لكل حرف، ومعالجة الحروف المتكررة بشكل صحيح (خلل منطق Wordle الكلاسيكي).
2. بناء حلقة لعب تفاعلية مدعومة بقائمة كلمات حقيقية، مع منح اللاعب 6 تخمينات.
3. التحقق من صحة التخمينات مقابل قائمة الكلمات وإعطاء تغذية راجعة واضحة عندما يُرفَض التخمين.
4. إضافة تتبع إحصائيات دائم — معدل الفوز، والسلسلة الحالية، وتوزيع عدد التخمينات — محفوظ في ملف JSON محلي ليبقى بين التشغيلات.

## أين تُشغّل هذا

- **محليًا باستخدام `uv` (موصى به).** لا يحتاج هذا المشروع شيئًا وراء المكتبة القياسية بالإضافة إلى مكتبة ألوان طرفية صغيرة — مرشح جيد لتثبيت Python فعليًا على جهازك الخاص. يشرح قسم الإعداد أدناه ذلك خطوة بخطوة، وتتبع الخطوات 1–4 هذا المسار.
- **GitHub Codespaces.** افتح [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) للحصول على بيئة تطوير سحابية مع تثبيت Node وPython و`uv` مسبقًا (راجع [`.devcontainer/devcontainer.json`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/.devcontainer/devcontainer.json)) — نفس الأوامر أدناه تعمل من تبويب متصفح، دون أي تثبيت محلي على الإطلاق.
- **Google Colab وKaggle Notebooks أو Binder.** لا يحتاج هذا المشروع إلى أي تبعيات خارجية، ما يجعله مناسبًا ممتازًا لدفتر الملاحظات بمعنى ما — لكن موجه `input()` في دفتر الملاحظات مختلف قليلًا عن طرفية تفاعلية حقيقية: لا إعادة رسم للبلاطات الملونة في مكانها على سطر واحد، و(على Colab/Kaggle) لا تنجو الملفات المحلية للجلسة بشكل موثوق بين زيارات منفصلة، وهو ما يضرب ضد جزء "تستمر الإحصائيات عبر الجلسات" من هذا المشروع. يظل [`notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/wordle-clone/notebook.ipynb) نسخة حقيقية قابلة للعب — تستحق التجربة — فقط اعلم أن التجربة الكاملة (البلاطات الملونة في الطرفية، والإحصائيات التي تستمر بين أيام لعب منفصلة) هي فعليًا شيء "شغّله محليًا".

  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/wordle-clone/notebook.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/wordle-clone/notebook.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fwordle-clone%2Fnotebook.ipynb)

  {/* Badges point at this PR's branch; will point at `main` once merged. */}

## الإعداد

`uv` أداة واحدة تحل محل السلسلة المعتادة "ثبّت Python، ثم ثبّت pip، ثم ثبّت أداة بيئة افتراضية، ثم ثبّت الحزم" — يمكنها تثبيت وإدارة إصدارات Python بنفسها، إلى جانب تبعيات مشروعك.

**macOS / Linux** (الطرفية):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

أغلق طرفيتك وأعد فتحها، ثم تأكد من أنها ثُبِّتت:

```bash
uv --version
```

ثم أعِدَّ المشروع:

```bash
uv init wordle-clone
cd wordle-clone
uv add rich
```

`rich` هي التبعية الخارجية الوحيدة التي يحتاجها هذا المشروع بأكمله، وتُستخدم فقط لإخراج الألوان في الطرفية (البلاطات الخضراء/الصفراء/الرمادية) — كل جزء من منطق اللعبة الفعلي أدناه هو Python قياسي من المكتبة القياسية. بلا مفتاح API، بلا تسجيل، لا شيء لإعداده قبل أن تستطيع تشغيل سطر واحد من الكود.

## الخطوة 1: سجّل تخمينًا مقابل الكلمة المستهدفة

ابدأ بالجزء الذي من السهل أن يُتقَن *تقريبًا* ومن المُرضي أن يُتقَن *فعليًا*: بوجود تخمين من 5 حروف وكلمة مستهدفة من 5 حروف، أنتج علامة واحدة لكل حرف — أخضر إذا كان ذلك الحرف في الموضع الصحيح، وأصفر إذا كان في الكلمة لكن في الموضع الخاطئ، ورمادي في غير ذلك.

يميل المحاولة الأولى إلى الظهور هكذا، مع فحص كل حرف مُخمَّن بشكل مستقل:

```python
# A tempting first version — has a bug, keep reading
def score_guess_naive(guess: str, target: str) -> list[str]:
    marks = []
    for i, letter in enumerate(guess):
        if letter == target[i]:
            marks.append("G")
        elif letter in target:
            marks.append("Y")
        else:
            marks.append("X")
    return marks
```

جرّبه على `guess = "SPEED"`, `target = "ERASE"`. تحتوي الكلمة المستهدفة على **حرف** `E` واحد بالضبط. تفحص النسخة الساذجة كل حرف مُخمَّن مقابل سلسلة الهدف كاملة بشكل مستقل — لذا يُفحَص *كلا* حرفي `E` في `SPEED` مقابل `"E" in target`، وهو `True` في المرتين، ويُعلَّم كلاهما باللون الأصفر. هذا خطأ: لن يمنح Wordle الحقيقي أبدًا حرفي `E` أصفرين في تخمين عندما تحتوي الكلمة المستهدفة على `E` واحد فقط — حرف `E` مُخمَّن واحد يستحق علامة، والآخر لا تبقى لديه حرف مطابق يبرر واحدة.

الحل خوارزمية من تمريرين:

```python
from collections import Counter

WORD_LENGTH = 5

def score_guess(guess: str, target: str) -> list[str]:
    guess, target = guess.upper(), target.upper()
    marks = ["X"] * WORD_LENGTH

    # Pass 1: greens, and tally which target letters are still "available"
    # (i.e. not already accounted for by a green) for the yellow pass.
    remaining = Counter()
    for i, (g, t) in enumerate(zip(guess, target)):
        if g == t:
            marks[i] = "G"
        else:
            remaining[t] += 1

    # Pass 2: yellows, consuming from that same pool of remaining letters
    # so a letter can never be flagged more times than it truly occurs.
    for i, g in enumerate(guess):
        if marks[i] == "G":
            continue
        if remaining[g] > 0:
            marks[i] = "Y"
            remaining[g] -= 1
        # else stays "X"

    return marks
```

يميّز التمرير الأول كل تطابق في الموضع الصحيح بالأخضر، ويُحصي بشكل منفصل (في `remaining`) كم نسخة من كل حرف هدف *غير أخضر* ما تزال "متاحة للأخذ". ثم يعيد التمرير الثاني المرور على التخمين: أي حرف ليس أخضر بالفعل لا يحصل على علامة صفراء إلا إذا ما زال في `remaining` نسخة غير مُطالَبة منه — والمطالبة بواحدة تنقص العد، لذا لن تحصل نسخة مُخمَّنة ثانية من نفس الحرف على أصفر أيضًا إلا إذا كان للهدف فعلًا نسخة ثانية أيضًا.

شغّله على الحالة الصعبة:

```python
print(score_guess("SPEED", "ERASE"))  # ['Y', 'X', 'Y', 'Y', 'X']
```

حرف `E` واحد (الموضع 0) أصفر، والآخر (الموضع 3) أصفر أيضًا لأن `ERASE` يحتوي فعلًا على حرفي `E` — لكن تخمينًا مثل `"ELITE"` مقابل كلمة مستهدفة بحرف `E` واحد فقط سيعطي *الثاني* `E` رماديًا بشكل صحيح، لا أصفر.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>`score_guess("CRANE", "CRANE")` returns all greens.</StepChecklistItem>
<StepChecklistItem>`score_guess("SPEED", "ERASE")` returns exactly two yellow `E`s, not more.</StepChecklistItem>
<StepChecklistItem>A guess and target that share zero letters returns all grays.</StepChecklistItem>
<StepChecklistItem>You've tried a case where the *guess* repeats a letter but the target only has one copy, and confirmed only one mark comes back non-gray.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

جرّب الهدف `"LLAMA"` والتخمين `"ALLOY"` يدويًا قبل تشغيل الكود: يحتوي `LLAMA` على حرفي `L` وحرفي `A`. مرّر على التمريرين بنفسك — أي الحروف تنتهي خضراء، وأيها صفراء، وأيها رمادية؟ ثم تحقق من إجابتك مقابل `score_guess`. لو أخطأت على الورق، أين تحديدًا اختلف نموذجك الذهني عن خوارزمية التمريرين؟

## الخطوة 2: ابنِ حلقة اللعبة

بعد إتقان التسجيل، لفِّه في لعبة فعلية: اختر هدفًا عشوائيًا من قائمة كلمات، وامنح اللاعب 6 تخمينات، وتوقف بمجرد أن يحصل على الخمسة الخضراء.

```python
import random

MAX_GUESSES = 6

def load_words(path="words.txt") -> list[str]:
    with open(path) as f:
        return [w.strip().upper() for w in f if w.strip()]

def play_round(words: list[str]) -> tuple[bool, int]:
    target = random.choice(words)
    for attempt in range(1, MAX_GUESSES + 1):
        guess = input(f"Guess {attempt}/{MAX_GUESSES}: ").strip().upper()
        marks = score_guess(guess, target)
        print(" ".join(f"{l}:{m}" for l, m in zip(guess, marks)))
        if all(m == "G" for m in marks):
            print(f"You got it in {attempt}!")
            return True, attempt
    print(f"Out of guesses. The word was {target}.")
    return False, MAX_GUESSES
```

`words.txt` ملف نصي عادي، كلمة واحدة في كل سطر — يرفق المثال الحقيقي قائمة من نحو 540 كلمة إنجليزية شائعة من 5 حروف لهذا الغرض تحديدًا. *قائمة* كلمات كهذه (مجرد حقائق حول أي السلاسل كلمات إنجليزية، بلا تعبير إبداعي) من المقبول استخدامها وإعادة توزيعها بحرية، على عكس نسخ، مثلًا، التعريفات الفعلية لقاموس.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>Each round picks a genuinely random target from the word list (print it temporarily to confirm, then remove the print — no spoilers once you trust it).</StepChecklistItem>
<StepChecklistItem>The loop stops immediately once all five marks are green, even before 6 guesses are used.</StepChecklistItem>
<StepChecklistItem>After exactly 6 wrong guesses, the loop ends and reveals the target.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

لو استُدعيت `random.choice(words)` مرة واحدة لكل جولة من داخل `play_round`، واستدعيت `play_round` في حلقة للسماح لشخص باللعب مجددًا، هل سيتغير الهدف فعلًا بين الجولات؟ ماذا سيحدث لو حسبت `target` عن طريق الخطأ مرة واحدة *خارج* الحلقة بدلًا من ذلك؟

## الخطوة 3: تحقق من صحة التخمينات مقابل قائمة الكلمات

لا يسمح لك Wordle الحقيقي بتخمين `"ZZZZZ"` — كل تخمين يجب أن يكون كلمة حقيقية من قاموسه. أضف ذلك الفحص قبل التسجيل:

```python
def read_guess(word_set: set[str]) -> str:
    while True:
        raw = input(f"Guess ({WORD_LENGTH} letters): ").strip().upper()
        if len(raw) != WORD_LENGTH or not raw.isalpha():
            print(f"  Please enter exactly {WORD_LENGTH} letters.")
            continue
        if raw not in word_set:
            print(f"  '{raw}' isn't in the word list — try a real word.")
            continue
        return raw
```

استخدام `set` هنا بدلًا من فحص `raw in words` ضد القائمة مباشرة يهم أكثر مما يبدو: تفحص عمليات عضوية القائمة كل إدخال واحدًا تلو الآخر، بينما فحص المجموعة شبه فوري بغض النظر عن عدد الكلمات فيها — عادة صغيرة لكنها جيدة فعلًا لأي فحص "هل هذه القيمة في مجموعة كبيرة؟".

:::tip[ارفض المدخلات السيئة مبكرًا، لا في منتصف اللعبة]
التحقق من *شكل* التخمين (5 حروف، أبجدي) قبل فحص قائمة الكلمات يلتقط أكثر أخطاء الكتابة شيوعًا بأرخص فحص أولًا — لا جدوى من البحث عن `"crane5"` في مجموعة من 540 كلمة عندما يخبرك فحص `len()` و`.isalpha()` بالفعل أنه غير سليم.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>Guessing a non-word (e.g. `"ZZZZZ"`) prints a clear rejection message and re-prompts, without consuming one of the 6 tries.</StepChecklistItem>
<StepChecklistItem>Guessing something that isn't 5 letters (too short, too long, contains a digit) is also rejected before it ever reaches the word-list check.</StepChecklistItem>
<StepChecklistItem>A valid, in-list guess is accepted immediately, lowercase or uppercase.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

لماذا يهم أن يعيد `read_guess` السؤال عند تخمين سيئ *داخل حلقته الخاصة*، بدلًا من إعادة قيمة حارسة مثل `None` ليتعامل معها المتصل (`play_round`)؟ ماذا سيسوء في عدّ المحاولات في الخطوة 2 لو سُمح لتخمين غير صالح بأن يستهلك واحدة من المحاولات الست؟

## الخطوة 4: أضف تتبع إحصائيات دائم

القطعة الأخيرة: تذكّر أداء اللاعب عبر تشغيلات منفصلة للبرنامج، لا فقط داخل جلسة واحدة. ذلك يعني الكتابة إلى ملف على القرص.

```python
import json
from pathlib import Path

STATS_FILE = Path("stats.json")

DEFAULT_STATS = {
    "played": 0,
    "wins": 0,
    "current_streak": 0,
    "max_streak": 0,
    "guess_distribution": {str(n): 0 for n in range(1, MAX_GUESSES + 1)},
}

def load_stats() -> dict:
    if not STATS_FILE.exists():
        return json.loads(json.dumps(DEFAULT_STATS))  # a fresh copy
    with STATS_FILE.open() as f:
        return json.load(f)

def save_stats(stats: dict) -> None:
    with STATS_FILE.open("w") as f:
        json.dump(stats, f, indent=2)

def record_result(stats: dict, won: bool, guesses_used: int) -> dict:
    stats["played"] += 1
    if won:
        stats["wins"] += 1
        stats["current_streak"] += 1
        stats["max_streak"] = max(stats["max_streak"], stats["current_streak"])
        stats["guess_distribution"][str(guesses_used)] += 1
    else:
        stats["current_streak"] = 0
    return stats
```

يعالج `load_stats` التشغيل الأول برشاقة — لا يوجد ملف بعد، لذا يعيد مجموعة افتراضيات جديدة مُصفَّرة إلى الصفر بدلًا من الانهيار بسبب ملف مفقود. يحمّل كل تشغيل آخر ما حُفِظ في المرة السابقة. يضيف `record_result` إلى `guess_distribution` فقط عند الفوز — الخسارة لا تحمل قيمة ذات معنى لـ"التخمينات المستخدمة للفوز"، تمامًا مثل شاشة إحصائيات Wordle الحقيقية نفسها.

حلقة اللعبة الكاملة تربط كل شيء: حمّل الإحصائيات مرة واحدة عند بدء التشغيل، وحدّثها واحفظها بعد كل جولة.

```python
words = load_words()
stats = load_stats()

while True:
    won, attempts = play_round(words)
    stats = record_result(stats, won, attempts)
    save_stats(stats)
    print(f"Played: {stats['played']}  Win rate: {stats['wins']/stats['played']:.0%}  "
          f"Streak: {stats['current_streak']}")
    if input("Play again? [y/N] ").strip().lower() != "y":
        break
```

:::tip[احفظ بعد كل جولة، لا فقط عند الخروج]
استدعاء `save_stats(stats)` مباشرة بعد `record_result`، في كل جولة، يعني أن برنامجًا مُقاطَعًا (طرفية مغلقة، `Ctrl+C`، انهيار) يفقد في أسوأ الأحوال نتيجة الجولة *الحالية* فقط — أبدًا تقدم الجلسة كلها. الحفظ مرة واحدة فقط في نهاية البرنامج تمامًا سيرمي كل شيء إذا غادر اللاعب في منتصف الجلسة بدلًا من الخروج عبر موجه "اللعب مجددًا؟".
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>Quitting the program and restarting it shows the same `played`/`wins`/streak numbers as before you quit, loaded from `stats.json`.</StepChecklistItem>
<StepChecklistItem>Winning in, say, 3 guesses increments `guess_distribution["3"]` specifically, not some other key.</StepChecklistItem>
<StepChecklistItem>Losing a round resets `current_streak` to 0 but does not touch `guess_distribution` or `max_streak`.</StepChecklistItem>
<StepChecklistItem>Deleting `stats.json` and rerunning the program doesn't crash — it starts a fresh, zeroed stats file instead.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

تُحسَب `max_streak` كـ`max(stats["max_streak"], stats["current_streak"])` بعد كل فوز، بدلًا من تحديثها فقط عندما تنتهي *اللعبة*. لماذا يتبع تحديثها بعد كل فوز على حدة (بدلًا من محاولة حسابها لاحقًا من السجل) أفضل سلسلة وصل إليها اللاعب بشكل صحيح، حتى لو ما زال اللاعب على أفضل سلسلة له الآن ولم يخسر بعد؟

## ⚠️ مآزق شائعة

- **خلل الحروف المتكررة (الخطوة 1).** بفارق كبير الخطأ الأكثر شيوعًا: فحص `letter in target` بشكل مستقل لكل حرف مُخمَّن، دون تتبع أي نسخ من حرف متكرر "طُولِب بها" بالفعل. يمنح هذا علامات صفراء أكثر مما يجب كلما كرر التخمين أو الهدف حرفًا. استخدم دائمًا نهج التمريرين الذي يستهلك النسخ — الخضراء أولًا، ثم الصفراء ضد مجموعة حروف الهدف *المتبقية*.
- **تخمينات ليست كلمات حقيقية.** دون التحقق من الصحة مقابل قائمة الكلمات (الخطوة 3)، يمكن للاعبين تخمين `"AEIOU"` أو أي غير كلمة أخرى فقط لاستكشاف أي الحروف في الهدف — استراتيجية يحظرها Wordle الحقيقي صراحةً بفرض أن كل تخمين كلمة قاموسية.
- **حساسية حالة الأحرف.** `"crane" == "CRANE"` تساوي `False` في Python. وحّد حالة كل تخمين وهدف إلى نفس الحالة (يستخدم هذا المشروع `.upper()` في كل مكان) لحظة دخولها إلى كودك، وإلا فستفشل المقارنات بصمت لتخمينات صحيحة تمامًا.
- **فقدان الإحصائيات عند الانهيار.** كتابة `stats.json` مرة واحدة فقط عند الخروج من البرنامج تعني أن أي انهيار، أو `Ctrl+C`، أو طرفية مغلقة يفقد تقدم تلك الجلسة كلها. احفظ بعد كل جولة بدلًا من ذلك (راجع النصيحة في الخطوة 4).
- **ملف إحصائيات من نسخة أقدم من كودك.** لو أضفت حقلًا جديدًا إلى `DEFAULT_STATS` لاحقًا، فسيحمّل `load_stats` كما هو مكتوب أعلاه بسعادة ملف `stats.json` *قديمًا* يفتقد ذلك الحقل، ثم ينهار أول مرة يحاول كودك قراءته. يستحق المعالجة الدفاعية (انظر كيف يدمج `examples/wordle-clone/stats.py` البيانات المحمَّلة فوق نسخة جديدة من الافتراضيات) لو كنت تخطط لمواصلة تعديل مخطط الإحصائيات.

## ما بنيته للتو

نسخة Wordle حقيقية: منطق تغذية راجعة صحيح للتخمينات (بما في ذلك الحالة الحدّية للحروف المتكررة التي تتعثر فيها كثير من المحاولات الأولى)، وحلقة لعب تفاعلية مدعومة بقائمة كلمات حقيقية مع تحقق مناسب من صحة التخمين، وإحصائيات تستمر فعلًا عبر تشغيلات منفصلة للبرنامج — لا فقط داخل جلسة واحدة. لم يحتج أي من ذلك إلى شيء وراء المكتبة القياسية ومكتبة ألوان صغيرة واحدة، وهو ما يستحق الانتباه إليه: يمكن أن يكون المشروع متينًا وممتعًا فعلًا دون الحاجة إلى مفتاح API، أو إطار عمل، أو خدمة سحابية.

:::tip[تحقق من المنطق الصعب بحالات اختبار، لا فقط باختبار اللعب]
من السهل لعب بضع جولات، ورؤية مخرجات تبدو معقولة، وافتراض أن منطق التسجيل صحيح — لكن خلل الحروف المتكررة تحديدًا لا يظهر إلا على تخمينات أو أهداف بحروف متكررة، وهي لا تأتي في كل جولة تصادف أن تلعبها يدويًا. كتابة حفنة من حالات الاختبار الصريحة (مثل مثال `SPEED`/`ERASE` في الخطوة 1) التي تستهدف تلك الحالة الحدّية تحديدًا تلتقط أخطاء قد يفوتها اختبار اللعب العادي تمامًا.
:::

## إلى أين تذهب من هنا

- **الوضع الصعب.** يتطلب الوضع الصعب في Wordle الحقيقي أن يعيد كل تخمين لاحق استخدام أي أخضر/أصفر أُظهِر بالفعل — فرض ذلك يعني تتبع القيود المعروفة عبر التخمينات داخل الجولة، لا فقط تسجيل تخمين واحد بمعزل.
- **نظام تلميحات.** اكشف الموضع الصحيح لحرف واحد عشوائي لم يُخمَّن عند الطلب، على حساب عدّه ضد إجمالي تخمينات اللاعب (أو أي مقايضة أخرى تصممها).
- **لعب متعدد أو كلمة يومية مشتركة.** يشتهر Wordle الحقيقي بإعطاء الجميع نفس الكلمة كل يوم. اشتقاق هدف اليوم بشكل حتمي من التاريخ (مثل تجزئة سلسلة التاريخ لاختيار فهرس في قائمة الكلمات) سيسمح لكل لاعب برؤية نفس الكلمة دون خادم — تمرين صغير لطيف في العشوائية الحتمية.
- **محلِّل حلال بسيط، كهدف طموح.** بوجود العلامات المُعادة حتى الآن، صفِّ قائمة الكلمات إلى الكلمات المتوافقة فقط مع كل قيد أُظهِر — انعكاس ممتع لمنطق اللعبة الذي كتبته للتو، وتمرين جيد في نفس منطق الحروف المتكررة من الخطوة 1، مطبَّقًا في الاتجاه المعاكس.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓

<ProjectProgressCheckbox projectId="2027-wordle-clone" />
