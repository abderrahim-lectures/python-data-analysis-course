---
id: 2027-dependency-freshness-checker
title: "بناء مدقق حداثة التبعيات"
sidebar_label: "مدقق حداثة التبعيات"
slug: /projects/dependency-freshness-checker
description: "ابنِ أداة CLI حقيقية تقرأ pyproject.toml، وتتحقق من PyPI عن إصدارات أحدث لكل تبعية، وتُبلِّغ عمّا هو قديم — بلا حاجة لمفتاح API."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 بناء مدقق حداثة التبعيات

<ProjectPublishedDate projectId="2027-dependency-freshness-checker" />

<ProjectGreeting />

كل مشروع Python حقيقي يتراكم عليه تبعيات، وكل تبعية تتخلف عن الركب في النهاية — يصدر إصلاح أمني، يُرقَّع خطأ، تصل ميزة جديدة، وملف `pyproject.toml` الخاص بك ببساطة... لا يعرف. يبني هذا المشروع الأداة التي تخبرك: أداة CLI حقيقية تقرأ `pyproject.toml`، وتسأل واجهة PyPI البرمجية العامة عن الإصدار الحالي الفعلي لكل تبعية، وتُبلِّغ عن أيها متأخر عنه — نفس فئة الأداة مثل `pip list --outdated`، لكنها واحدة تفهمها بالكامل لأنك بنيتها بنفسك.

هذا اختياري وغير مُقيَّم — مناسب بمجرد إنهائك Python 101 (لا تُشترط خبرة تحليل بيانات أو مفاتيح API، هذا المشروع لا يستخدم أي خدمة مدفوعة أو مقيَّدة على الإطلاق). راجع [مشاريع من العالم الحقيقي](/docs/projects) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. تحليل ملف `pyproject.toml` حقيقي واستخراج قائمة تبعياته.
2. استعلام واجهة JSON العامة لـPyPI لإيجاد الإصدار المنشور الحالي لكل تبعية.
3. مقارنة إصدارك المُثبَّت/المُحدَّد مقابل الأحدث، باستخدام تحليل إصدار دلالي حقيقي — لا مقارنة نصية ساذجة.
4. طباعة تقرير حداثة نظيف ومُصنَّف (محدَّث / قديم / تعذَّر التحقق).

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الذي تتبعه خطوات هذا الدرس، والموصى به — ستوجّهه إلى `pyproject.toml` حقيقي (مستودع هذه الدورة نفسه فيه عدة ملفات، أو استخدم أي مشروع لك). يشرح قسم الإعداد أدناه كيفية تثبيته.

**GitHub Codespaces** بديل بلا إعداد إذا كنت تفضّل عدم تثبيت أي شيء محليًا بعد: افتح [مستودع الدورة كاملًا في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython وuv مثبّتة بالفعل) وشغّل نفس أوامر `uv` تمامًا من طرفية في تبويب متصفحك — بالإضافة إلى أن لديك الكثير من ملفات `pyproject.toml` الحقيقية قريبة لتوجيه الأداة إليها.

**Google Colab وKaggle Notebooks أو Binder** تعمل أيضًا، لأن هذا المشروع لا يحتاج مفتاح API ولا GPU — نسخة دفتر ملاحظات حقيقية وقابلة للتشغيل موجودة في [`examples/dependency-freshness-checker/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/dependency-freshness-checker/notebook.ipynb). انقر على شارة لتشغيله مباشرة، دون أي تثبيت محلي على الإطلاق:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/dependency-freshness-checker/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/dependency-freshness-checker/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdependency-freshness-checker%2Fnotebook.ipynb)

كن صادقًا مع نفسك بشأن المقايضة، مع ذلك: يمكن لدفتر الملاحظات التحقق فقط من محتوى `pyproject.toml` النموذجي الذي تلصقه فيه، لا التوجه إلى مجلد مشروع حقيقي على القرص كما يمكن لـCLI المحلي.

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
uv init dependency-checker
cd dependency-checker
uv add requests packaging
```

لا يُحتاج أي مفتاح API في أي مكان في هذا المشروع — واجهة JSON العامة لـPyPI (`https://pypi.org/pypi/<package>/json`) عامة، مجانية، ولا تتطلب تسجيلًا ولا مصادقة. تتعامل `requests` مع استدعاءات HTTP؛ تمنحك `packaging` تحليلًا حقيقيًا وصحيحًا للإصدار الدلالي (`packaging.version.Version`) بدلًا من مقارنة سلاسل الإصدار حرفًا بحرف، والذي ينهار في اللحظة التي تقارن فيها `"2.9"` مقابل `"2.10"` كنص عادي.

:::tip[لماذا لا نقارن الإصدارات كسلاسل نصية فقط؟]
`"2.10.0" > "2.9.0"` صحيح `True` رياضيًا، لكن كسلاسل نصية بسيطة، `"2.10.0" < "2.9.0"` — لأن `"1" < "9"` حرفًا بحرف، لا يصل Python أبدًا بعيدًا بما يكفي لملاحظة أن `10 > 9`. يجب على المقارنة الحقيقية للإصدارات تحليل كل جزء كرقم أولًا. تفعل مكتبة `packaging` (نفس المكتبة التي يستخدمها `pip` داخليًا) هذا بشكل صحيح، بما في ذلك إصدارات ما قبل الإصدار مثل `2.0.0rc1`.
:::

## الخطوة 1: حلّل `pyproject.toml` حقيقيًا

يشحن Python 3.11+ وحدة `tomllib` في المكتبة القياسية — لا حاجة لتثبيت *لقراءة* TOML (ستحتاج فقط لـ`uv add` لحزمة لو احتجت *لكتابة* TOML، وهو ما لا يفعله هذا المشروع).

```python
# parse_deps.py
import tomllib
from pathlib import Path


def load_dependencies(pyproject_path: str) -> list[str]:
    """Read a pyproject.toml and return its raw dependency specifier strings,
    e.g. ["requests>=2.31", "packaging"]."""
    with Path(pyproject_path).open("rb") as f:
        data = tomllib.load(f)
    return data.get("project", {}).get("dependencies", [])


if __name__ == "__main__":
    deps = load_dependencies("pyproject.toml")
    for dep in deps:
        print(dep)
```

```bash
uv run python parse_deps.py
```

<StepChecklist>
  <StepChecklistItem>تشغيل هذا مقابل `pyproject.toml` الخاص بمشروعك يطبع سلسلة المُحدِّد الخام لكل تبعية.</StepChecklistItem>
  <StepChecklistItem>يمكنك أن تشرح لماذا تحتاج `tomllib` أن يُفتَح الملف في الوضع الثنائي (`"rb"`)، لا وضع النص.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**: تحتوي قائمة `dependencies` في `pyproject.toml` سلاسل مثل `"requests>=2.31"` — لا أسماء حزم فقط. ما هو *الاسم* وحده، منفصلًا عن أي قيد إصدار مُرفَق به؟ ستحتاج لفصل هذه بنظافة في الخطوة التالية، وسلسلة تبعية حقيقية قد تكون أكثر فوضى مما تبدو (مسافات إضافية، إضافات مثل `"requests[socks]>=2.31"`، تثبيت دقيق `==` بدلًا من `>=`) — أي منها سيكسر `.split(">=")` ساذجًا؟

## الخطوة 2: ابحث عن الإصدار الحالي لكل حزمة على PyPI

```python
# check_pypi.py
import re

import requests


def parse_package_name(specifier: str) -> str:
    """Extract just the package name from a specifier like 'requests>=2.31'
    or 'requests[socks]==2.31.0'."""
    match = re.match(r"^[A-Za-z0-9_.-]+", specifier.strip())
    if not match:
        raise ValueError(f"Could not parse a package name from {specifier!r}")
    return match.group(0)


def get_latest_version(package_name: str) -> str | None:
    """Query PyPI's public JSON API for a package's current published
    version. Returns None if the package isn't found (a typo, or a private
    package not on PyPI)."""
    url = f"https://pypi.org/pypi/{package_name}/json"
    response = requests.get(url, timeout=10)
    if response.status_code == 404:
        return None
    response.raise_for_status()
    return response.json()["info"]["version"]


if __name__ == "__main__":
    for specifier in ["requests>=2.31", "packaging", "not-a-real-package-xyz"]:
        name = parse_package_name(specifier)
        latest = get_latest_version(name)
        print(f"{name}: latest is {latest!r}")
```

```bash
uv run python check_pypi.py
```

لاحظ `"not-a-real-package-xyz"` المكسور عمدًا في قائمة الاختبار — يجب أن يطبع `latest is None`، لا أن يتعطل. يجب على أداة حقيقية التعامل بأناقة مع اسم حزمة به خطأ إملائي أو خاصة، لا افتراض أن كل اسم في `pyproject.toml` يُحلّ.

<StepChecklist>
  <StepChecklistItem>الحزم الحقيقية تطبع إصدارها الحقيقي الحالي من PyPI — يمكنك التحقق التقاطعي من واحدة مقابل pypi.org في متصفحك.</StepChecklistItem>
  <StepChecklistItem>اسم الحزمة الوهمي يطبع `None` بدلًا من تعطيل السكربت.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**: يعمل `response.raise_for_status()` *بعد* التحقق الصريح من 404 أعلاه — لماذا نفرد 404 خصيصًا بدلًا من ترك `raise_for_status()` يتعامل مع كل حالة غير-2xx بنفس الطريقة؟ ماذا سيحدث لتدفق تحكم هذا السكربت لو لم يكن ذلك التحقق من 404 موجودًا؟

## الخطوة 3: قارن الإصدارات بشكل صحيح

```python
# compare.py
from packaging.version import InvalidVersion, Version


def is_outdated(current: str, latest: str) -> bool | None:
    """Compare two version strings properly. Returns None (not True/False)
    if either string isn't a version packaging can parse -- e.g. a git URL
    or a local path used as a 'version', which pyproject.toml permits."""
    try:
        return Version(current) < Version(latest)
    except InvalidVersion:
        return None


if __name__ == "__main__":
    print(is_outdated("2.9.0", "2.10.0"))  # True -- real semantic comparison
    print(is_outdated("2.10.0", "2.9.0"))  # False
    print(is_outdated("2.10.0", "2.10.0"))  # False -- equal, not outdated
    print(is_outdated("not-a-version", "2.10.0"))  # None -- can't compare
```

```bash
uv run python compare.py
```

<StepChecklist>
  <StepChecklistItem>يطبع `is_outdated("2.9.0", "2.10.0")` قيمة `True`، مثبتًا أن هذه ليست مقارنة نصية ساذجة.</StepChecklistItem>
  <StepChecklistItem>سلسلة إصدار غير قابلة للتحليل تُعيد `None`، لا تعطلًا أو `True`/`False` خاطئًا بصمت.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**: لماذا تُعيد `is_outdated` ثلاث نتائج ممكنة (`True`، `False`، `None`) بدلًا من اثنتين فقط؟ ما الموقف الحقيقي وغير الافتراضي في `pyproject.toml` الذي يجعل `None` الإجابة الصادقة *الوحيدة*؟

## الخطوة 4: اجمعها معًا في تقرير حداثة حقيقي

```python
# freshness_report.py
from dataclasses import dataclass

from check_pypi import get_latest_version, parse_package_name
from compare import is_outdated
from parse_deps import load_dependencies


@dataclass
class DependencyStatus:
    name: str
    current_specifier: str
    latest: str | None
    outdated: bool | None


def build_report(pyproject_path: str) -> list[DependencyStatus]:
    report = []
    for specifier in load_dependencies(pyproject_path):
        name = parse_package_name(specifier)
        latest = get_latest_version(name)
        # A specifier with no pinned version (just "requests") has nothing
        # concrete to compare against -- treat that case as "unknown" too.
        pinned = specifier[len(name) :].lstrip(">=<~! ")
        outdated = is_outdated(pinned, latest) if pinned and latest else None
        report.append(DependencyStatus(name, specifier, latest, outdated))
    return report


def print_report(report: list[DependencyStatus]) -> None:
    outdated = [d for d in report if d.outdated is True]
    fresh = [d for d in report if d.outdated is False]
    unknown = [d for d in report if d.outdated is None]

    if outdated:
        print(f"⚠️  {len(outdated)} outdated:")
        for d in outdated:
            print(f"   {d.name}: pinned {d.current_specifier!r}, latest is {d.latest}")
    if fresh:
        print(f"✅ {len(fresh)} up to date: {', '.join(d.name for d in fresh)}")
    if unknown:
        print(f"❓ {len(unknown)} could not be checked: {', '.join(d.name for d in unknown)}")


if __name__ == "__main__":
    import sys

    path = sys.argv[1] if len(sys.argv) > 1 else "pyproject.toml"
    print_report(build_report(path))
```

```bash
uv run python freshness_report.py pyproject.toml
```

جرّب توجيهه إلى `pyproject.toml` من مشروع حقيقي وأقدم لديك (أو ملفات `examples/*/pyproject.toml` الخاصة بمستودع هذه الدورة نفسه) — هناك حيث سترى فعليًا سلة "قديم" تمتلئ بنتائج حقيقية، لا مجرد تبعيات محدَّثة أضفتها قبل خمس دقائق.

<StepChecklist>
  <StepChecklistItem>تشغيل التقرير مقابل `pyproject.toml` الخاص بمشروعك يطبع ملخصًا مُصنَّفًا ✅/⚠️/❓.</StepChecklistItem>
  <StepChecklistItem>توجيهه إلى `pyproject.toml` أقدم عمدًا يُظهر تبعية واحدة قديمة حقيقية على الأقل.</StepChecklistItem>
</StepChecklist>

**🤔 سؤال (أسئلة) سقراطي(ة)**: يُجري هذا السكربت طلب HTTP واحدًا لكل تبعية، واحدًا تلو الآخر. لـ`pyproject.toml` به 40 تبعية، ما التكلفة التي يعانيها المستخدم من ذلك — وما طريقة ملموسة كنت لتسرّعها بها (تلميح: هذه الطلبات لا تعتمد على نتائج بعضها البعض إطلاقًا)؟

## ⚠️ مآزق شائعة

- **مقارنة الإصدارات نصيًا بسذاجة.** `"2.9" > "2.10"` كسلاسل نصية بسيطة — هذا هو الخطأ الأكثر شيوعًا في مدقق إصدارات مصنوع يدويًا. حلّل دائمًا بـ`packaging.version.Version`، ولا تقارن سلاسل الإصدار مباشرة أبدًا.
- **افتراض أن كل اسم تبعية يُحلّ على PyPI.** الحزم الخاصة/الداخلية، والأخطاء الإملائية، و"تبعيات" رابط git كلها أشياء حقيقية يسمح بها `pyproject.toml` — يجب على سكربتك أن يتدهور بأناقة (سلة `None`/"غير معروف")، لا أن يعطّل التقرير بأكمله بسبب مُدخَل غير عادي.
- **معاملة تبعية غير مثبَّتة (`"requests"` بلا أي إصدار على الإطلاق) كـ"قديمة".** لا يوجد شيء للمقارنة معه — هذه حالة مختلفة وصادقة من "غير معروف"، لا إيجابية كاذبة.
- **قصف PyPI بلا مهلة زمنية.** مرّر دائمًا `timeout=...` إلى `requests.get()` — طلب معلَّق واحد بلا مهلة يمكن أن يجمّد الأداة بأكملها إلى أجل غير مسمى.

## ما بنيته للتو

CLI حقيقي للتحقق من الحداثة — نفس الفكرة الأساسية خلف `pip list --outdated`، وDependabot من GitHub، وRenovate، مبني من المبادئ الأولى: تحليل بيان، استعلام واجهة برمجية عامة حقيقية، مقارنة الإصدارات *بشكل صحيح*، والإبلاغ عن النتيجة بوضوح. لا شيء هنا كان مخفيًا خلف مكتبة تقوم بمقارنة الإصدارات نيابة عنك — تعرف الآن بالضبط لماذا تنهار المقارنة النصية الساذجة وكيف تتجنبها، تفصيل يُعثِر الكثير من الأدوات المصنوعة يدويًا في الواقع.

## إلى أين تذهب من هنا

- سرّعها بطلبات متزامنة (`concurrent.futures.ThreadPoolExecutor` أو `asyncio` + `httpx`) — السؤال السقراطي أعلاه هو نقطة انطلاقك.
- أضف وضع `--fix` يعيد كتابة قيود إصدار `pyproject.toml` تلقائيًا إلى أحدث الإصدارات (احذر: اعرض دائمًا فرقًا أو اطلب تأكيدًا قبل الكتابة إلى ملف حقيقي — نفس مبدأ الأمان المُستخدَم في أماكن أخرى من مشاريع هذه الدورة).
- تحقق من تاريخ إصدار PyPI، لا رقم الإصدار فقط، وضع علامة على أي شيء لم يُلمَس منذ أكثر من سنة على أنه ربما مهجور — إشارة مختلفة ومكمّلة فعليًا لـ"هل هذا قديم".
- قارن أيضًا مقابل الإصدارات المثبَّتة فعليًا في `uv.lock`، لا مُحدِّدات `pyproject.toml` فقط — يمكن أن يختلف الاثنان بشكل مشروع.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓

<ProjectProgressCheckbox projectId="2027-dependency-freshness-checker" />
