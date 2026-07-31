---
id: habit-streak-visualizer
title: "بناء أداة تصور سلاسل العادات"
sidebar_label: "أداة تصور سلاسل العادات"
slug: /projects/habit-streak-visualizer
description: "تتبّع تسجيلات دخول عادات يومية محليًا واعرض خريطة حرارية تقويمية بأسلوب رسم مساهمات GitHub، بـpandas وmatplotlib — بلا تعلّم آلي، بلا مفتاح API."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 بناء أداة تصور سلاسل العادات

<ProjectPublishedDate projectId="2027-habit-streak-visualizer" />

<ProjectGreeting />

يفترض هذا المشروع أنك مرتاح مع Python 101 — المتغيرات، والدوال، وقراءة وكتابة الملفات، والحلقات الأساسية. بعض pandas وmatplotlib من تحليل البيانات (`DataFrame`s، و`.groupby()`، ورسم مخطط بسيط) ستجعل بعض الخطوات تبدو مألوفة، لكن لا شيء هنا يحتاج أكثر من ذلك: لا تعلّم آلي، لا واجهة برمجية خارجية، ولا مجموعة بيانات لتنزيلها. تجلب بياناتك الخاصة، يومًا واحدًا في كل مرة.

هذا اختياري وغير مُقيَّم. راجع [مشاريع من العالم الحقيقي](/docs/projects) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. تصميم تنسيق سجل تسجيل دخول بسيط (CSV: تاريخ، عادة، تم) وكتابة CLI للإضافة إليه.
2. حساب السلسلة الحالية والسلسلة الأطول لعادة من ذلك السجل.
3. توزيع نطاق من الأيام في شبكة بأسلوب رسم مساهمات GitHub: سبعة صفوف أيام أسبوع بعدد أعمدة الأسابيع التي يحتاجها النطاق.
4. عرض تلك الشبكة كخريطة حرارية بـmatplotlib، مُلوَّنة بحسب مدة السلسلة التي كانت تُبنى في كل يوم، باستخدام عدة أشهر من بيانات نموذجية واقعية المظهر لكي تبدو الصورة مثيرة للاهتمام فعليًا.

## أين تُشغّل هذا

ثلاث طرق معقولة لعمل هذا المشروع — اختر ما يناسب إعدادك:

- **محليًا باستخدام `uv` (موصى به).** لا يملك هذا المشروع تبعيات خارجية بخلاف `pandas` و`matplotlib`، بلا مفتاح API، بلا GPU — خالٍ من الاحتكاك تقريبًا بقدر ما يمكن أن يكون عليه "مشروع Python فعلي على جهازك الخاص". تفترض الخطوات 1–4 أدناه هذا المسار، ويعيش سجل تسجيل الدخول الخاص بك كملف CSV بسيط تستمر في الإضافة إليه مع مرور الوقت.
- **GitHub Codespaces.** افتح [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) للحصول على بيئة تطوير سحابية بـNode وPython وuv مثبّتة بالفعل (انظر [`.devcontainer/devcontainer.json`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/.devcontainer/devcontainer.json)) — نفس الأوامر بالضبط أدناه تعمل من تبويب متصفح، بلا تثبيت محلي على الإطلاق.
- **Google Colab وKaggle Notebooks أو Binder.** ملاءمة جيدة فعليًا: لا شيء هنا يحتاج GPU أو مفتاح API، وخط الأنابيب بأكمله (تحميل سجل، حساب سلاسل، بناء شبكة، عرض خريطة حرارية) يناسب براحة بضع خلايا دفتر ملاحظات مقابل بيانات العينة المُرفَقة بالدورة.

  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/habit-streak-visualizer/notebook.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/habit-streak-visualizer/notebook.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fhabit-streak-visualizer%2Fnotebook.ipynb)

  كن صادقًا مع نفسك بشأن المقايضة، مع ذلك: دفتر الملاحظات طريقة أقل دقة لتجربة هذا المشروع من مشروع `uv` محلي فعلي بملف `checkins.csv` خاص به تضيف إليه يومًا بعد يوم — عامِله كطريقة سريعة لاستكشاف الكود، لا المسار الأساسي.

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
uv init habit-streak-visualizer
cd habit-streak-visualizer
uv add pandas matplotlib
```

لا يُحتاج أي مفتاح API في أي مكان في هذا المشروع — كل شيء يعمل على بيانات تعيش بالكامل على جهازك الخاص.

## الخطوة 1: صمِّم سجل تسجيل الدخول وCLI لكتابته

السجل هو CSV بسيط بثلاثة أعمدة: `date`، و`habit`، و`done`. صف واحد لكل تسجيل دخول. ملف مسطّح كهذا — بدلًا من، لنقل، ملف منفصل لكل عادة — يعني أن عدة عادات يمكنها مشاركة سجل واحد وما زالت قابلة للتصفية بشكل مستقل بفهرسة بولية عادية من pandas لاحقًا.

```python
# log.py
import csv
from pathlib import Path

COLUMNS = ["date", "habit", "done"]

def ensure_log(path: Path) -> None:
    if not path.exists():
        with path.open("w", newline="") as f:
            csv.writer(f).writerow(COLUMNS)

def append_checkin(path: Path, date: str, habit: str, done: bool) -> None:
    ensure_log(path)
    with path.open("a", newline="") as f:
        csv.writer(f).writerow([date, habit, "y" if done else "n"])
```

يغلّف CLI صغير هذا بتفاعل "هل فعلتها اليوم؟ y/n":

```python
# checkin.py
import argparse
import datetime as dt
from pathlib import Path
from log import append_checkin

LOG_PATH = Path(__file__).parent / "checkins.csv"

parser = argparse.ArgumentParser()
parser.add_argument("habit")
parser.add_argument("--date", default=None)
parser.add_argument("--done", choices=["y", "n"], default=None)
args = parser.parse_args()

date = args.date or dt.date.today().isoformat()
answer = args.done or input(f"Did you do '{args.habit}' on {date}? (y/n): ").strip().lower()
append_checkin(LOG_PATH, date, args.habit, answer.startswith("y"))
print(f"Logged: {date} — {args.habit} — {'done' if answer.startswith('y') else 'missed'}")
```

```bash
uv run python checkin.py "Exercise"
```

شغّل ذلك عدة مرات مع `--date`/`--done` لأيام مختلفة لبناء تاريخ صغير للاختبار به، قبل المتابعة.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>تشغيل `checkin.py` مرتين لنفس العادة والتاريخ، مرة "y" ومرة "n"، يترك السجل بكلا الصفين — ستحتاج لتقرير (الخطوة التالية) أيهما يفوز.</StepChecklistItem>
<StepChecklistItem>فتح `checkins.csv` في محرر نصوص يُظهر بالضبط ثلاثة أعمدة، صف واحد لكل تسجيل دخول، قابل للقراءة البشرية.</StepChecklistItem>
<StepChecklistItem>يمكنك تسجيل تسجيل دخول لتاريخ ماضٍ بـ`--date` و`--done`، دون المُوجِّه التفاعلي.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

لو سجّلت نفس العادة مرتين لنفس التاريخ (مرة بالخطأ، ومرة لتصحيحها)، هل يجب أن يحتفظ السجل بكلا الصفين، أم يستبدل الأول، أم شيء آخر؟ ماذا سيفعل كل اختيار بـ`.groupby("date")` لاحق على هذا الملف؟

## الخطوة 2: احسب السلاسل

السلسلة هي سلسلة من *أيام تقويمية متتالية* مُسجَّلة كمُنجَزة، بلا فجوة. القرار التصميمي المهم: يوم لم يُسجَّل أبدًا يُعامَل تمامًا مثل يوم مُسجَّل صراحة كـ"n" — كلاهما يكسر السلسلة. هذا أبسط من إضافة حالة ثالثة "غير معروفة"، بتكلفة معاقبة نسيان التسجيل بنفس طريقة معاقبة تخطي العادة فعليًا.

يجب أن تصبح قراءة سجل متناثر (فقط الأيام التي كلّف أحدهم نفسه عناء تسجيلها) سلسلة *كثيفة* يوم بيوم قبل أن تكون للسلاسل معنى — وإلا ستبدو فجوة في السجل مطابقة لانقطاع حقيقي، لكن لا يمكنك معرفة في أي يوم حدث دون تقويم كامل للمقارنة معه:

```python
import pandas as pd

df = pd.read_csv("checkins.csv", parse_dates=["date"])
df["done"] = df["done"].astype(str).str.lower().isin(["y", "yes", "true", "1"])
df = df.drop_duplicates(subset=["date", "habit"], keep="last")  # last logged answer wins

habit_df = df[df["habit"] == "Exercise"].set_index("date")["done"]
daily = habit_df.reindex(pd.date_range(df["date"].min(), df["date"].max(), freq="D"), fill_value=False)
```

`reindex` تقوم بالعمل الفعلي هنا: تأخذ `Series` بالتواريخ الموجودة فعليًا فقط وتوسّعها على *كل* تاريخ في النطاق، ملأ أي شيء مفقود بـ`False`. الآن السلاسل هي مجرد مسح متسلسل بسيط:

```python
def compute_streaks(daily: pd.Series) -> dict:
    longest = 0
    current_run = 0
    for i, done in enumerate(daily):
        current_run = current_run + 1 if done else 0
        longest = max(longest, current_run)
        if i == len(daily) - 1:
            streak_ending_at_last_day = current_run
    return {
        "current_streak": streak_ending_at_last_day,
        "longest_streak": longest,
        "total_done": int(daily.sum()),
        "total_days": len(daily),
    }
```

`current_streak` هي السلسلة المنتهية في *آخر* يوم في السلسلة (اليوم، إن كان سجلك محدَّثًا) — تُعاد إلى 0 في اللحظة التي تتحقق فيها من اليوم التالي لفوات. `longest_streak` هي أفضل سلسلة في أي مكان في التاريخ بأكمله، والتي يمكن أن تكون أكبر بكثير بوضوح، ولا تتقلص أبدًا.

:::tip[تحتاج `current_streak` سجلًّا محدَّثًا لكي تعني شيئًا]
إن لم تسجّل اليوم بعد، فآخر يوم في `daily` هو `False` افتراضيًا (من ملء `reindex`)، لذا تُبلِّغ `current_streak` عن 0 حتى لو مدّد الأمس سلسلة حقيقية. إما سجّل كل يوم قبل التحقق من سلسلتك، أو احسب `current_streak` مقابل الأمس بدلًا من "آخر صف في السلسلة" إن أردتها تتسامح مع عدم تسجيل اليوم بعد.
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>يحتوي `daily.index` كل يوم تقويمي بين أول وآخر مُدخَل سجل خاص بك، بلا فجوات — يطابق `len(daily)` عدد تلك الأيام بالضبط.</StepChecklistItem>
<StepChecklistItem>عدّ سلسلة معروفة من أيام "y" متتالية في سجل اختبارك يدويًا يطابق ما يُبلِّغ عنه `compute_streaks` لـ`longest_streak`.</StepChecklistItem>
<StepChecklistItem>تسجيل "n" (أو تخطي يوم) يُعيد `current_streak` إلى 0 المرة التالية التي تحسبها.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

لماذا يحتاج `daily = habit_df.reindex(...)` أن يحدث *قبل* حلقة عدّ السلاسل، بدلًا من مجرد التكرار على صفوف `df` مباشرة؟ ماذا سيسوء تحديدًا بـ`longest_streak` لو تخطيته؟

## الخطوة 3: وزّع الأيام في شبكة بأسلوب GitHub

هذه هي اللحظة التعليمية الحقيقية للمشروع. رسم مساهمات GitHub هو شبكة: سبعة صفوف (واحد لكل يوم أسبوع) بعدد أعمدة يحتاجها العام (تقريبًا 52-53)، تُقرأ من الأعلى للأسفل ثم من اليسار لليمين. تحويل قائمة بسيطة من التواريخ إلى ذلك التخطيط ثنائي الأبعاد يأخذ قطعتين من حساب التواريخ:

**الصف** هو ببساطة يوم الأسبوع: تُعيد `date.weekday()` 0 للاثنين حتى 6 للأحد، قابل للاستخدام مباشرة كفهرس صف.

**العمود** هو الجزء الصعب. الاختصار المُغري هو `date.isocalendar()[1]`، رقم أسبوع ISO — لكن أرقام أسابيع ISO تُعاد إلى 1 كل يناير. سجل عادة يمتد عبر حدود سنة (لنقل، من ديسمبر إلى يناير) سيجعل تواريخ أواخر ديسمبر وأوائل يناير تقع في *نفس أرقام الأسابيع المنخفضة*، مُخلِّطة الشبكة إلى أعمدة متداخلة بدلًا من خط زمني نظيف من اليسار لليمين. الإصلاح: اختر تاريخ ارتكاز ثابتًا واحدًا — الاثنين في أو قبل أول يوم مُسجَّل — واحسب كل عمود كإزاحة يوم بسيطة من ذلك الارتكاز:

```python
import numpy as np

def build_grid(daily: pd.Series):
    dates = daily.index
    anchor = dates[0] - pd.Timedelta(days=dates[0].weekday())  # Monday on/before the first day
    weeks = (dates - anchor).days // 7
    rows = dates.weekday

    num_weeks = int(weeks.max()) + 1
    grid = np.full((7, num_weeks), np.nan)
    for row, week, done in zip(rows, weeks, daily):
        grid[row, week] = 1.0 if done else 0.0

    return grid, dates
```

`(dates - anchor).days // 7` تزداد دائمًا فقط — لا يهمها إن كان السجل يمتد سنة واحدة أو خمس سنوات. الخلايا التي تقع خارج النطاق المُسجَّل الفعلي (لأن أول يوم مُسجَّل ليس بالضرورة اثنين، أو آخر يوم ليس بالضرورة أحد) تُترَك كـ`NaN`، لكي يمكن رسمها بشكل مختلف عن يوم "فائت" فعلي في الخطوة التالية.

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>`grid.shape[0]` هو بالضبط 7 (صف واحد لكل يوم أسبوع)، بغض النظر عن طول نطاق التاريخ.</StepChecklistItem>
<StepChecklistItem>تغذية `build_grid` بنطاق تاريخ يعبر أول يناير *لا* ينتج مجموعتين من أعمدة أرقام أسابيع منخفضة — تزداد الأعمدة باطراد عبر الحد.</StepChecklistItem>
<StepChecklistItem>أول وآخر بضع خلايا في الشبكة (قبل أول يوم مُسجَّل، بعد الأخير) هي `NaN`، لا `0`.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

يبدأ رسم مساهمات GitHub نفسه الأسابيع بالأحد، لا الاثنين. ماذا ستحتاج لتغييره في `build_grid` لمطابقة تلك الاتفاقية — وهل سيغيّر ذلك أي *عمود* يقع فيه تاريخ معين، أي *صف*، أم كليهما؟

## الخطوة 4: اعرضها كخريطة حرارية

يجب ألا تكون كثافة اللون ثنائية فقط (تم/لم يتم) — يجب أن يُقرَأ يوم هو الخامس عشر في صف من سلسلة كمختلف بصريًا عن اليوم الأول جدًّا لسلسلة جديدة، رغم أن كليهما "تم". احسب الكثافة كدالة لطول السلسلة *الحالية* في كل يوم، مُقيَّدة كي لا تستمر في التغميق إلى الأبد:

```python
def streak_intensity(daily: pd.Series, cap: int = 10) -> list[float]:
    values, run = [], 0
    for done in daily:
        run = run + 1 if done else 0
        values.append(min(run, cap) / cap if done else 0.0)
    return values
```

غذِّ ذلك إلى `build_grid` مكان الملء البسيط 0/1، ثم اعرض بـmatplotlib — تدرج تسلسلي بلون واحد (أزرق فاتح إلى داكن)، لا قوس قزح، بما أن هذا مقدار متصل واحد، لا عدة فئات:

```python
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap, ListedColormap

sequential_blue = LinearSegmentedColormap.from_list(
    "habit_blue", ["#eaf2fc", "#9ec5f4", "#3987e5", "#0d366b"]
)

fig, ax = plt.subplots(figsize=(max(6, grid.shape[1] * 0.32), 2.4))
display = np.where(np.isnan(grid), 0.0, grid)
ax.imshow(display, cmap=sequential_blue, vmin=0, vmax=1, aspect="equal")

no_data = np.ma.masked_where(~np.isnan(grid), np.ones_like(grid))
ax.imshow(no_data, cmap=ListedColormap(["#e8e8ea"]), aspect="equal")

ax.set_yticks(range(7))
ax.set_yticklabels(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])
fig.savefig("habit_heatmap.png", bbox_inches="tight")
```

النسخة الكاملة — بتسميات أشهر على طول المحور السيني وخطوط شبكة بين الخلايا — تعيش في [`examples/habit-streak-visualizer/heatmap.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/habit-streak-visualizer/heatmap.py). شغّلها ضد بيانات العينة المُرفَقة (عدة أشهر، عادتان، سلاسل حقيقية وانتكاسة حقيقية) لرؤية الصورة الكاملة فورًا، دون تسجيل أي شيء يدويًا أولًا:

```bash
uv run python visualize.py --habit "Exercise"
```

:::tip[الرمادي "بلا بيانات" ليس نفس الأزرق "كثافة 0"]
رسم الخلايا غير المُسجَّلة عند الدرجة الأشحب من نفس التدرج الأزرق كفوات فعلي سيدّعي بصريًا "هذه العادة كانت موجودة وتخطّيتها" لأيام قبل أن تبدأ حتى بالتتبع. تلوينها برمادي محايد مسطّح، مُرصَّف فوقه باستدعاء `imshow` منفصل ومصفوفة مقنَّعة، يُبقي "بلا بيانات" مميَّزًا بصدق عن "بيانات، والإجابة كانت لا."
:::

**✅ قائمة التحقق**

<StepChecklist>
<StepChecklistItem>تُظلِم الخريطة الحرارية المعروضة بوضوح عبر سلسلة حقيقية متعددة الأيام في بياناتك، بدلًا من أن تبدو كل خلية "منجَزة" متطابقة.</StepChecklistItem>
<StepChecklistItem>تُعرَض الخلايا خارج نطاق تاريخك المُسجَّل برمادي مسطّح، قابل للتمييز بلمحة عن يوم "فائت" أزرق شاحب.</StepChecklistItem>
<StepChecklistItem>تشغيل أداة التصور ضد بيانات العينة المُرفَقة ينتج شبكة يمكن التعرف على شكلها كرسم مساهمات GitHub: سبعة صفوف، أعمدة كثيرة، محور زمني واضح من اليسار لليمين.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**

لو تتبعت عادتين وأردت مقارنتهما جنبًا إلى جنب، هل تفضّل رؤية خريطتين حراريتين منفصلتين متراكمتين رأسيًا، أم خريطة حرارية واحدة حيث تُشفِّر كل خلية *كلتا* العادتين بطريقة ما؟ ماذا ستخسر في كلتا الحالتين؟

## ⚠️ مآزق شائعة

- **أخطاء إزاحة بواحد في يوم الأسبوع/التاريخ.** `date.weekday()` مُفهرَسة من 0 بدءًا من الاثنين؛ `date.isoweekday()` مُفهرَسة من 1 بدءًا من الاثنين؛ `date.strftime("%w")` مُفهرَسة من 0 بدءًا من *الأحد*. خلط هذه هو الطريقة الأسهل الوحيدة للانتهاء بشبكة مُزاحة بدقة بصف واحد.
- **مشاكل المنطقة الزمنية من `datetime.now()`.** لو حسب CLI الخاص بك "اليوم" بـ`datetime.now()` بدلًا من `date.today()`، يمكن لتسجيل دخول مُسجَّل متأخرًا في الليل أن يقع في اليوم التقويمي الخاطئ حسب المنطقة الزمنية للجهاز، خصوصًا لو شغّلت السكربت يومًا من منطقة زمنية مختلفة (أو دفتر ملاحظات سحابي، الذي على الأرجح UTC). التزم بكائنات `date` البسيطة لأي شيء يُفترَض أن يمثل يومًا تقويميًا لا لحظة في الزمن.
- **أخطاء حدود السنة في تخطيط الشبكة**، مُغطَّاة في الخطوة 3 — استخدام رقم أسبوع `isocalendar()` مباشرة كعمود شبكة بدلًا من إزاحة يوم بارتكاز ثابت. اختبر هذا صراحة بنطاق تاريخ يعبر أول يناير، لأنه من السهل كتابة كود يبدو صحيحًا مقابل سنة واحدة من بيانات العينة وينكسر فقط بمجرد أن يمتد النطاق عبر سنتين.
- **نسيان `drop_duplicates(..., keep="last")`** عند تحميل السجل — لو سُجِّلت عادة/تاريخ مرتين (تصحيح فعلي، أو تشغيل مزدوج عرضي لـCLI)، ترك كلا الصفين يعني أن `.groupby()` أو reindex لاحق قد يختار بصمت أيهما جاء أولًا، لا الإجابة النهائية المقصودة.

## ما بنيته للتو

أداة محلية صغيرة بقطعتين حقيقيتين وقابلتين للفصل: طبقة استمرارية بيانات (CSV إضافة فقط، مُزال التكرار عند التحميل) وتصور شبكة تقويمية من الصفر، من النوع المخفي عادة خلف استدعاء مكتبة. بناء تخطيط الشبكة بنفسك — بدلًا من استيراد حزمة "خريطة حرارية GitHub" جاهزة — هو ما يجعل حساب التواريخ في الخطوة 3 يترسّخ فعليًا: الفرق بين رقم أسبوع ISO وإزاحة يوم بارتكاز ثابت هو خطأ حقيقي كنت ستصادفه في أي مشروع يوزّع بيانات سلاسل زمنية على تقويم، لا هذا فقط.

:::tip[نفس تنسيق السجل هذا يتوسع إلى أكثر من خريطة حرارية]
لا شيء بخصوص `checkins.csv` خاص بالخريطة الحرارية — إنه فقط سجل أحداث مؤرَّخ. يمكن لنفس الملف تغذية مخطط أعمدة لمعدل إنجاز أسبوعي، أو ملخص شهري بـ`.groupby(df["date"].dt.month)`، أو عد تنازلي بسيط لـ"كم يومًا حتى أتفوق على أطول سلسلة لي." الخريطة الحرارية عرض واحد على بيانات مفيدة في أشكال أخرى كثيرة أيضًا.
:::

## إلى أين تذهب من هنا

- **عدة عادات جنبًا إلى جنب.** وسّع `visualize.py` لعرض خريطة حرارية واحدة لكل عادة، مُكدَّسة في شكل واحد بـ`plt.subplots(nrows=...)`، لكي تستطيع مقارنة الاتساق عبر العادات بلمحة.
- **نسخة ASCII للطرفية فقط.** تخطَّ matplotlib تمامًا واطبع الشبكة كمربعات Unicode مُلوَّنة (`░▒▓█` أو ألوان خلفية ANSI) مباشرة إلى الطرفية — نفس منطق تخطيط الشبكة بالضبط من الخطوة 3، فقط مُصيِّر مختلف، وطريقة لطيفة للتحقق من سلسلتك دون فتح صورة.
- **التصدير كصورة قابلة للمشاركة.** `fig.savefig(..., dpi=300)` لصورة PNG واضحة، أو اربط سكربتًا صغيرًا يُعيد توليد الخريطة الحرارية تلقائيًا بعد كل تشغيل لـ`checkin.py`، لكي تكون هناك دائمًا صورة محدَّثة جاهزة للمشاركة.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓

<ProjectProgressCheckbox projectId="2027-habit-streak-visualizer" />
