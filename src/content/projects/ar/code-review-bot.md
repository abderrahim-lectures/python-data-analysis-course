---
title: "بوت مراجعة الكود بالذكاء الاصطناعي"
description: "مراجعة كود تلقائية تكتشف الأخطاء وتقترح تحسينات وتنفذ إرشادات الأسلوب."
difficulty: "intermediate"
estimatedMinutes: 75
xpReward: 100
tags: ["AI Agents", "Developer Tools", "APIs"]
prerequisites:
  - "الدوال، القوائم، والقواميس"
  - "فهم القوائم والقواميس بالتضمين (comprehensions)"
  - "قراءة ملف نصي وكتابة JSON"
learningObjectives:
  - "نمذجة طلب دمج كأسطر كود مع اسم ملف"
  - "ترميز قواعد المراجعة كبيانات (اسم، خطورة، اختبار) بدلًا من الفروع الشرطية if"
  - "إرفاق تعليقات لكل سطر وتجميعها حسب الخطورة"
  - "حساب حُكم APPROVE/REJECT وتصدير المراجعة كـ JSON"
  - "إعادة مراجعة الفرق المُصحح ورؤية الحُكم ينقلب"
---

# 🛠️ 🤖 ابنِ بوت مراجعة كود

بوتات المراجعة تقرأ كل طلب دمج حتى لا يضطر البشر لذلك — وقبل دخول أي نموذج لغوي، بوت المراجعة هو في معظمه *قواعد*. يبني هذا المشروع واحدًا: **عامل مراجعة كود** حتمي يأخذ فرق طلب دمج محاكى (`payment.py`)، ويطبّق سجلّ قواعد (طول السطر، المسافات البالية، `except` العاري، `print` التصحيحي، `TODO` غير المُنجز، docstrings الناقصة)، ويرفق تعليقًا لكل سطر يخترقه، ويجمّعها حسب الخطورة، ويقرر `REJECT` عند وجود مشكلة كبرى، ويصدّر المراجعة كاملة كحمولة JSON، ثم يعيد مراجعة الفرق *المُصحح* ليرى الحُكم ينقلب إلى `APPROVE`. لا شبكة، لا عشوائية — نفس الفرق يُنتج دائمًا نفس المراجعة، وهذا بالضبط ما يجعل بوتات القواعد قابلة للتدقيق: كل تعليق قابل للتتبع إلى اختبار.

هذا يفترض إلمامًا بالدوال والمجموعات وإدخال/إخراج الملفات وJSON. إنه مشروع اختياري غير مُقيَّم — راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة والنامية.

## 🎯 ما ستفعله

1. نمذجة طلب دمج كقائمة مسماة من الأسطر.
2. كتابة القواعد كبيانات — سجلّ يمرّ البوت فوقه.
3. مراجعة فرق، وإرفاق تعليقات، وتجميعها حسب الخطورة.
4. حساب الحُكم وتصدير التقرير كـ JSON.
5. إصلاح العوائق، وإعادة المراجعة، ورؤية `REJECT` ← `APPROVE`.

## أين تُشغّل هذا

**محليًا** هو الموطن الطبيعي لأداة مراجعة تقرأ وتكتب الملفات.

```bash
mkdir code-review-bot && cd code-review-bot
touch review_bot.py
```

**Google Colab وKaggle Notebooks وBinder** تشغّل كل شيء دون تغيير — كل كتلة Python نقية. تصدير JSON ما زال ملفًا يمكنك فتحه.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/code-review-bot/notebook.ar.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/code-review-bot/notebook.ar.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcode-review-bot%2Fnotebook.ar.ipynb)

## الإعداد

لا حزم؛ ملف عيّنة واحد للمراجعة.

### أنشئ PR العينة

```bash
mkdir code-review-bot && cd code-review-bot
touch review_bot.py
```

احفظ هذا باسم `payment.py` — "الـ PR قيد المراجعة". لاحظ سطرَي المسافات البالية و`except:` عن قصد:

```python
def process_payment(total, tax_rate):       
    """Compute the final total."""
    discount = 0
    if total > 100:
        discount = total * 0.1
    try:
        final = total + (total * tax_rate) - discount
    except:  # noqa: E722
        print("something went wrong")
    return final

# TODO: add tests for negative totals
def apply_coupon(order_total, coupon):
    return order_total - coupon
# This comment is deliberately stretched out far beyond 72 chars to flag long lines. xxxxxxxxxxxxxxxx  
```

**✅ قائمة التحقق**

- ✅ يحتوي `payment.py` على **15 سطرًا**؛ السطر 1 والسطر 15 ينتهيان بمسافات بائية (ما زالت مرئية في محرر).
- ✅ `final` في السطر 7 — الدالة التي حصلت على docstring — تعمل كخط أساس صحي.
- ✅ يعمل `python3 review_bot.py` بلا مخرجات بعد.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- مراجع ذكي *يحكم*؛ هذا البوت *يختبر* فقط. أين الحدود بين قاعدة يمكنك ترميزها كـ `True/False` وحُكم يحتاج نموذج لغويًا أو إنسانًا؟
- حُكم البوت إما `APPROVE` أو `REJECT`. ما المعلومات التي كانت حالة ثالثة (`COMMENT`) لتضيفها لعملية دمج تكون فيها "الموافقة مع تعليقات" خطوة حقيقية — وأي قاعدة من قواعد هنا كانت ستنتجها أبدًا؟

## الخطوة 1: نمذجة الـ PR

بوت المراجعة يمشي فوق الأسطر. أولًا، دالة `load_pr` تحوّل الملف إلى بنية يستطيع البوت فحصها.

### 1.1 الـ PR كأسطر

**👟 تلميح البداية :** حزمة صغيرة بلا dataclass: `{"file": "payment.py", "lines": [...]}`.

```python
# review_bot.py
import json

def load_pr(path):
    with open(path) as f:
        return {"file": path, "lines": f.read().splitlines()}

pr = load_pr("payment.py")
print("file:", pr["file"], "| lines:", len(pr["lines"]))
for i, ln in enumerate(pr["lines"], 1):
    print(f"{i:>2} |{ln}|")
```

`splitlines()` يتخلص من `\n`، لذا `pr["lines"]` *محتوى نقي* — قائمة فهرسها (كرقم سطر) هو ما سيشير إليه التعليق. حزمة القاموس (اسم ملف + أسطر) هي أصغر شكل يمكن لأداة مراجعة أن تسلمه إلى محرك قواعد، وهي تحاكي كيف تستقبل البوتات الحقيقية طلب دمج (اسمًا، ثم أسطرًا متغيرة).

**🎯 الناتج المتوقع :**

```
file: payment.py | lines: 15
 1 |def process_payment(total, tax_rate):       |
 2 |    """Compute the final total."""|
 3 |    discount = 0|
 4 |    if total > 100:|
 5 |        discount = total * 0.1|
 6 |    try:|
 7 |        final = total + (total * tax_rate) - discount|
 8 |    except:  # noqa: E722|
 9 |        print("something went wrong")|
10 |    return final|
11 ||
12 |# TODO: add tests for negative totals|
13 |def apply_coupon(order_total, coupon):|
14 |    return order_total - coupon|
15 |# This comment is deliberately stretched out far beyond 72 chars to flag long lines. xxxxxxxxxxxxxxxx  |
```

**🩹 إذا لم يعمل :** إذا أظهر `lines` العدد 16، أضاف سطر جديد بائل عنصرًا فارغًا (أو أضافه محررك) — يتعامل معه `splitlines()`، لكن أعد عدّ الملف. إذا فقدت أغلفة `|…|` المسافات البالية للسطر 1، شذّب محررك العيّنة تلقائيًا (أعد لصقها).

### 1.2 تحقّق من النموذج

**✅ قائمة التحقق**

- ✅ `pr` قاموس فيه `file` و`lines`؛ 15 سطرًا إجمالًا.
- ✅ السطران 1 و15 يعرضان بصريًا مسافات بائية داخل `|…|`.
- ✅ الفهرسة مطابقة: `pr["lines"][7]` هو سطر `except:` (فهرسة من الصفر) — مواقع القواعد تحاكي `i+1`.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يجمّع القاموس `file` و`lines`. إذا راجعت PR جيثب *حقيقيًا*، ما الحقلان أو الثلاثة التي يحتاجها مدخل البوت إلى ما وراء المحتوى (مثلًا commit SHA، المؤلف)؟ ولماذا تُعد تلك جزءًا من *مسار تدقيق* التعليق؟
- أرقام الأسطر تبدأ من 1 للبشر لكن Python يفهرس من 0. كل تعليق تنتجه سيحمل `line = i + 1`. أين ينتظر الخطأ إذا نسي أحد القواعد `+1`؟

## الخطوة 2: القواعد كبيانات

ذكاء البوت هو *سجلّ* — قواعد مرمّزة كبيانات يمرّ المحرك فوقها، بحيث إضافة قاعدة تعني إضافة قاموس، لا فرع if.

### 2.1 السجلّ

**👟 تلميح البداية :** كل قاعدة `(name, severity, test)` حيث `test(line) -> bool`؛ و`MAX_LINE` يحدّ طول السطر.

```python
# review_bot.py (continued)
MAX_LINE = 72

RULES = [
    {"name": "line-length", "severity": "minor",
     "test": lambda ln: len(ln) > MAX_LINE},
    {"name": "trailing-space", "severity": "minor",
     "test": lambda ln: ln != ln.rstrip()},
    {"name": "bare-except", "severity": "major",
     "test": lambda ln: ln.lstrip().startswith("except:")},
    {"name": "debug-print", "severity": "minor",
     "test": lambda ln: "print(" in ln},
    {"name": "todo-marker", "severity": "info",
     "test": lambda ln: "TODO" in ln or "FIXME" in ln},
    {"name": "missing-docstring", "severity": "minor",
     "test": lambda ln: False},  # needs line context, wired next
]
```

كل قاعدة قاموس عادي: اسم، وخطورة، واختبار نقي. اختبار bare-except تطابق زائد صادق (`except:`)، و`missing-docstring` مُثبَّت عمدًا على `False` حتى تعطيه الخطوة 2.2 سياقًا. السجلّ المبني من بيانات هو ما يجعل البوت *قابلًا للصيانة* — يمكنك توسيعه من ملف إعدادات لاحقًا دون تعديل المحرك.

**🎯 الناتج المتوقع :** لا شيء بعد — RULES بيانات. تحقق يدويًا من كل اختبار: `len("…") > 72` لطول السطر؛ `ln != ln.rstrip()` للمسافات البالية.

### 2.2 Docstrings تحتاج سياقًا

**👟 تلميح البداية :** اختبار docstring ينظر إلى الأسطر القليلة *بعد* `def` — الدالة تملك docstring إذا كان سطرها التالي غير الفارغ يبدأ بـ `'"""'`.

```python
# review_bot.py (continued)
def has_docstring(lines, idx):
    for ln in lines[idx:idx + 3]:
        if ln.strip() == "":
            continue
        return ln.lstrip().startswith('"""')
    return False

RULES.append({"name": "missing-docstring", "severity": "minor",
              "test": lambda ln: ln.lstrip().startswith("def ") and
                                 not has_docstring(pr["lines"], 0)})
```

مهلاً — اللامدا لا يمكنها بلوغ فهرس *السطر الحالي*، لذا هذا الربط الساذج سيفحص `pr["lines"][0]` إلى الأبد. الشكل الصحيح اختبار يأخذ *الفهرس*، لا السطر. أعد كتابة السجلّ بحيث يحصل كل اختبار على `(lines, i)`:

```python
# review_bot.py (continued)
def t_missing_docstring(lines, i):
    return lines[i].lstrip().startswith("def ") and not has_docstring(lines, i)

RULES = [
    {"name": "line-length", "severity": "minor",
     "test": lambda lines, i: len(lines[i]) > MAX_LINE},
    {"name": "trailing-space", "severity": "minor",
     "test": lambda lines, i: lines[i] != lines[i].rstrip()},
    {"name": "bare-except", "severity": "major",
     "test": lambda lines, i: lines[i].lstrip().startswith("except:")},
    {"name": "debug-print", "severity": "minor",
     "test": lambda lines, i: "print(" in lines[i]},
    {"name": "todo-marker", "severity": "info",
     "test": lambda lines, i: "TODO" in lines[i] or "FIXME" in lines[i]},
    {"name": "missing-docstring", "severity": "minor",
     "test": t_missing_docstring},
]
```

كل الاختبارات الآن تستقبل `(lines, i)` — معظمها يتجاهل الفهرس؛ قاعدة docstring تحتاجه. ذلك التوحيد هو العقد الذي يُبقي المحرك (الخطوة 3) غبيًا وصحيحًا.

**🎯 الناتج المتوقع :** لا شيء — لكن بإعادة قراءة القائمة، يمكنك بالفعل توقع أي الأسطر سيُطلق عليه كل اختبار (1 و15 للمسافات البالية، و8 لـ bare-except، و9 لـ debug-print، و12 لـ todo، و13 للـ docstring، و15 للطول).

### 2.3 تحقّق من السجلّ

**✅ قائمة التحقق**

- ✅ ست قواعد مسماة بخطورات؛ كل واحدة اختبار نقي على `(lines, i)`.
- ✅ تستخدم `missing-docstring` اختبار السياق `t_missing_docstring`، لا المُثبّت الساذج.
- ✅ الخطورات تتطابق مع السياسة: `major` فقط لـ bare-`except`؛ والباقي `minor`/`info`.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يطابق اختبار bare-except `except:` لكن ليس `except Exception:` — الأخير *أكثر* تحديدًا و، مقارنةً، مقبول. هل كنت سترمّز `except Exception:` كقاعدة خاصة بها أو تعلّم الاختبار عن `except ValueError:`؟ ما الترقية المكوّنة من سطر واحد؟
- القواعد-كبيانات تعني أن المحرك لا يعرف معنى "قاعدة". إذا أضاف بوت مستقبلي قاعدة *تعلم آلة* («هذا السطر تفوح منه رائحة خطأ»)، كيف ستُسند الخطورة هناك — وما الذي يجعل القواعد الحتمية هنا خطًا أساسيًا *جيدًا* تُقارن به قاعدة تعلم الآلة؟

## الخطوة 3: شغّل المراجعة

المحرك: مرّر كل قاعدة على كل سطر، وأرفق تعليقًا لكل إصابة.

### 3.1 محرك التعليقات

**👟 تلميح البداية :** `review(pr)` يمرّ عبر `(rule, line_index)`، ويشغّل `rule["test"]`، ويرفق قاموس تعليق.

```python
# review_bot.py (continued)
def review(pr):
    comments = []
    lines = pr["lines"]
    for i in range(len(lines)):
        for rule in RULES:
            if rule["test"](lines, i):
                comments.append({
                    "file": pr["file"],
                    "line": i + 1,            # 1-based for humans
                    "rule": rule["name"],
                    "severity": rule["severity"],
                    "code": lines[i].rstrip(),
                })
    return comments

comments = review(pr)
print("comments:", len(comments))
for c in comments:
    print(f"{c['line']:>2} {c['severity']:<5} {c['rule']:<16} {c['code'][:40]}")
```

حلقة متداخلة واحدة فوق القواعد × الأسطر هي المحرك كاملًا — إضافة قاعدة أو سطر لا يغيّر شيئًا هنا. يحمل كل تعليق `file`، و`line` يبدأ من 1، و`rule`، و`severity`، ومقتطف الكود *المجرّد*، حتى يستطيع إنسان قراءته دون فتح الملف. `code = lines[i].rstrip()` يُبقي الرسالة قصيرة بينما يُثبّت `line` الموضع الدقيق.

**🎯 الناتج المتوقع :**

```
comments: 7
 1 minor trailing-space    def process_payment(total, tax_rate):
 8 major bare-except       except:  # noqa: E722
 9 minor debug-print       print("something went wrong")
12 info  todo-marker       # TODO: add tests for negative totals
13 minor missing-docstring def apply_coupon(order_total, coupon):
15 minor line-length       # This comment is deliberately stretched out far beyond 72 chars to flag long line
15 minor trailing-space    # This comment is deliberately stretched out far beyond 72 chars to flag long line
```

**🩹 إذا لم يعمل :** إذا ظهر السطر 15 مرة واحدة فقط، لم ينطلق أحد قاعدتيه (إنه *طويل* *و* بمسافات بائية — اختباران مستقلان، تعليقان). إذا كان السطر 8 مفقودًا، تعثّر `lstrip().startswith("except:")` عند لاحقة `  # noqa` — لا ينبغي؛ القاعدة تختبر البداية.

### 3.2 ملخص الخطورة

**👟 تلميح البداية :** `Counter` فوق الخطورات، ثم الحُكم: `REJECT` عند وجود أي `major`.

```python
# review_bot.py (continued)
from collections import Counter

counts = Counter(c["severity"] for c in comments)
print("BY SEVERITY:", dict(counts))
verdict = "REJECT" if counts.get("major", 0) else "APPROVE"
print("VERDICT:", verdict)
```

سبعة تعليقات ضجيج؛ `{major:1, minor:5, info:1}` هو الإشارة. الحُكم قيمة منطقية واحدة: `except` العاري الذي يبتلع كل أنواع الاستثناءات هو العائق — والباقي تلميع. تجميع الخطورة هو ما يحوّل سورًا من التعليقات إلى قرار دمج.

**🎯 الناتج المتوقع :**

```
BY SEVERITY: {'major': 1, 'minor': 5, 'info': 1}
VERDICT: REJECT
```

**🩹 إذا لم يعمل :** إذا بلغ `minor` 4، توقفت قاعدة (مثلًا `missing-docstring` ما زالت على المُثبّت من قبل الخطوة 2.2 — تضيف واحدًا). إذا قرأ الحُكم `APPROVE`، تحوّل `counts.get("major", 0)` إلى `counts["major"]` وانهار/تعطّل — أبقِ `.get`.

### 3.3 تحقّق من التشغيل

**✅ قائمة التحقق**

- ✅ 7 تعليقات: مسافات بائية ×2 (1، 15)، طول السطر (15)، bare-except (8)، debug-print (9)، todo (12)، missing-docstring (13).
- ✅ `{'major': 1, 'minor': 5, 'info': 1}`؛ `VERDICT: REJECT`.
- ✅ يحمل كل تعليق ملفًا وسطرًا يبدأ من 1 وقاعدة وخطورة ومقتطف كود مجردًا.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- كسب السطر 15 *تعليقين* من *قاعدتين*. هل يوجد شيء مثل تعليقات كثيرة جدًا على سطر واحد — وما سياسة إزالة التكرار (مثلًا تعليق واحد لكل قاعدة لكل سطر، أو التكثيف حسب السطر) التي كان مراجع بشري سيشكر البوت عليها؟
- يتجاهل الحُكم `info` تمامًا. إذا كانت سياسة المستودع "يجب حل TODOs للدمج"، لكان `todo-marker` يصبح *major*. ماذا يقول ذلك عن سياسة من يرمّز البوت — وكيف ستميّزها حسب المستودع دون إعادة كتابة القواعد؟

## الخطوة 4: صدّر التقرير

مراجعة لا يستطيع أحد التصرف بناءً عليها فكرة عابرة. تصدّر الخطوة 4 التعليقات كـ JSON وتطبع ملخصًا بشريًا.

### 4.1 حمولة JSON

**👟 تلميح البداية :** `json.dump` المراجعة الكاملة كحمولة بشكل API: `verdict`، `counts`، `comments`.

```python
# review_bot.py (continued)
report = {
    "verdict": verdict,
    "counts": dict(counts),
    "comments": comments,
}

with open("review.json", "w") as f:
    json.dump(report, f, indent=2)
print("Wrote review.json with", len(comments), "comments")
```

`review.json` هو المُسلَّم *الآلي* — حمولة بشكل API (`verdict`, `counts`, `comments`) يمكن لأداة أخرى (بوت جيثب، بوابة CI، خطاف إشعارات) استهلاكها دون إعادة تشغيل منطق Python. `indent=2` يُبقي الملف مقروءًا بشريًا أيضًا.

**🎯 الناتج المتوقع :** `Wrote review.json with 7 comments` — والملف يُفتح على

```json
{
  "verdict": "REJECT",
  "counts": {
    "major": 1,
    "minor": 5,
    "info": 1
  },
  "comments": [...]
}
```

**🩹 إذا لم يعمل :** إذا كان JSON سطرًا واحدًا غير قابل للضغط، فقد أُسقط `indent=2`. إذا رُسم `report["comments"]` كـ `[]`، فأنت ألحقت كل قاموس تعليق على *نسخة* (مثلًا `c = review(pr)` مرتين) — استدعِ `review` مرة واحدة.

### 4.2 الملخص البشري

**👟 تلميح البداية :** اطبع "ماذا تُصلح أولًا" للأعلى 3 من `major` ثم بترتيب الخطورة، وأين تنظر.

```python
# review_bot.py (continued)
order = {"major": 0, "minor": 1, "info": 2}
lines_by_rule = {}
for c in comments:
    lines_by_rule.setdefault(c["rule"], []).append(c["line"])

print("SUMMARY")
print(f"  verdict: {verdict}")
print(f"  comments: {len(comments)} ({counts.get('major', 0)} major, "
      f"{counts.get('minor', 0)} minor, {counts.get('info', 0)} info)")
for rule in sorted(lines_by_rule, key=lambda r: order.get(
        RULES[[x['name'] for x in RULES].index(r)]['severity'], 2)):
    print(f"  {rule}: lines {sorted(lines_by_rule[rule])}")
```

يعيد الملخص ترتيب القواعد حسب الخطورة بحيث يكون *أول* شيء يقرؤه المطوّر هو العائق، ثم بنود التلميع. أرقام الأسطر المرتبة تتيح لهم القفز مباشرة إلى كل إصلاح.

**🎯 الناتج المتوقع :**

```
SUMMARY
  verdict: REJECT
  comments: 7 (1 major, 5 minor, 1 info)
  bare-except: lines [8]
  line-length: lines [15]
  missing-docstring: lines [13]
  trailing-space: lines [1, 15]
  debug-print: lines [9]
  todo-marker: lines [12]
```

**🩹 إذا لم يعمل :** إذا كان ترتيب القواعد أبجديًا بغض النظر عن الخطورة، فبحث تعيين `key` معطل — تلك رقصة الفهرس هشّة؛ بسّطها بتخزين `severity` داخل كل تعليق وفرز التعليقات مباشرة (`sorted(comments, key=lambda c: order[c["severity"]])`).

### 4.3 تحقّق من التصدير

**✅ قائمة التحقق**

- ✅ لدى `review.json` verdict، counts، comments؛ 7 تعليقات بداخله.
- ✅ يسرد الملخص البشري bare-except أولًا (الـ major الوحيد)، والبقية مجمّعين حسب القاعدة بأرقام أسطر مرتبة.
- ✅ يروي JSON والملخص نفس القصة — عدادات مطابقة في الموضعين.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يحمل قاموس `comment` بالفعل `severity`، ومع ذلك يستنتجه الملخص مجددًا من `RULES` بالاسم. ما الخطأ الذي يكشفه ذلك البحث (قاعدة أعيدت تسميتها) عن *التكرار* بين مصدر الحقيقة والتقرير — وما التغيير المكوّن من سطر واحد الذي يجعل التعليقات ذاتية الوصف؟
- بوت حقيقي ينشر `review.json` إلى نقطة نهاية API. ما الحقول التي كنت *ستضيفها* قبل إرسالها إلى API جيثب — مثلًا `commit_sha`، `pull_request`، `author` — ولماذا يريد التدقيق وجودها في الحمولة لا في السجل فقط؟

## الخطوة 5: إعادة المراجعة بعد الإصلاحات

العائد: مطوّر يصلح العوائق، البوت يعيد التشغيل، والحُكم ينقلب.

### 5.1 أصلح الفرق

**👟 تلميح البداية :** رقّع المشكلتين المرتبطتين بـ `major` — استثناء محدد بدلًا من `except` العاري، وسطر 15 معقول.

```python
# review_bot.py (continued)
fixed_lines = list(pr["lines"])
fixed_lines[7] = "    except ValueError:  # noqa: E722"
fixed_lines[14] = "# This comment is now a sane length."

fixed_pr = {"file": "payment.py", "lines": fixed_lines}
fixed_comments = review(fixed_pr)
fixed_counts = Counter(c["severity"] for c in fixed_comments)
fixed_verdict = "REJECT" if fixed_counts.get("major", 0) else "APPROVE"
print("FIXED BY SEVERITY:", dict(fixed_counts))
print("NEW VERDICT:", fixed_verdict)
```

نسخة قائمة (`list(pr["lines"])`) ثم كتابات فهرس مستهدفة تمثّل "تحريرات المطوّر". يجعل `except ValueError:` المعالج محددًا (يجب أن يصبح `except` العاري استثناءً *مسمى* أو تظل القاعدة تنطلق).

**🎯 الناتج المتوقع :**

```
FIXED BY SEVERITY: {'minor': 3, 'info': 1}
NEW VERDICT: APPROVE
```

**🩹 إذا لم يعمل :** إذا ما زال `major` يساوي 1، لم يقع الاستبدال على `fixed_lines[7]` (الفهرس 7 هو السطر 8 — تحقق من فهرسة الصفر!). إذا ما زال minor 5، لم يُقصّر السطر 15 فعلًا إلى ما دون 72 حرفًا.

### 5.2 حلقة العامل الكاملة

**👟 تلميح البداية :** دالة `run_review(pr)` تُرجع حُكمًا + تقريرًا، حتى يستطيع المتصل المراجعة والإصلاح وإعادة المراجعة في حلقة.

```python
# review_bot.py (continued)
def run_review(pr, out="review.json"):
    comments = review(pr)
    counts = Counter(c["severity"] for c in comments)
    verdict = "REJECT" if counts.get("major", 0) else "APPROVE"
    report = {"verdict": verdict, "counts": dict(counts), "comments": comments}
    with open(out, "w") as f:
        json.dump(report, f, indent=2)
    return verdict, report

v1, r1 = run_review(pr)
v2, r2 = run_review(fixed_pr, out="review_v2.json")
print(v1, "->", v2)
print("comments", len(r1["comments"]), "->", len(r2["comments"]))
```

لفّ خط الأنابيب كاملًا في `run_review(pr, out=…)` واحدة يجعل البوت *قابلًا لإعادة الاستخدام* — راجِع وأصلح وأعد الراجعة باستدعاءين. ملف المخرجات المنسوخ (`review_v2.json`) هو مسار التدقيق الذي تنتجه الحلقة.

**🎯 الناتج المتوقع :**

```
REJECT -> APPROVE
comments 7 -> 4
```

**🩹 إذا لم يعمل :** إذا طبع السطر الأول `APPROVE -> APPROVE`، لم يرث `run_review` منطق الخطورة (انجراف نسخ-ولصق بين `review` وسطر الحُكم). إذا قرأ العدّادان `7 -> 5`، فالسطر 15 المُصلح ما زال يحمل مسافة بائية.

### 5.3 تحقّق من الحلقة

**✅ قائمة التحقق**

- ✅ المراجعة الأولى: 7 تعليقات، `REJECT` (bare-except كبرى).
- ✅ بعد إصلاح `except:` ← `except ValueError:` وتقصير السطر 15: 4 تعليقات، `APPROVE`.
- ✅ كُتب كلاهما `review.json` و`review_v2.json` — تاريخ قرارات البوت الكامل ينجو.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- الحلقة يدوية هنا (شغّلت `run_review` مرتين). بوت حقيقي كان ليستدعي `run_review` عند *كل* push. ما شرط الإيقاف أو المهلة التي كانت لتمنع بوتًا مستقلًا من إعادة المراجعة إلى الأبد على PR لا يتقارب أبدًا؟
- يعني `REJECT` هنا "مشكلة كبرى واحدة". لا يملك هذا البوت مفهومًا لـ *معدل الاسترجاع* (هل فاته خطأ حقيقي؟) أو *الدقة* (هل كانت تعليقاته ضجيجًا؟). تُضبَط بوتات المراجعة عادة على الاثنين. إذا كان لديك مجموعة من PRs مدمجة بالفعل، كيف كنت ستقيس دقة القواعد الست مقابل استرجاعها؟

## ⚠️ المآزق الشائعة

- **انحراف الفهرسة من الصفر مقابل من 1.** المحرك يفهرس `lines[i]` من الصفر؛ كل *تعليق* يبلّغ عن `i + 1`. قاعدة واحدة تنسى `+1` تُثبّت تعليقها على سطر خاطئ إلى الأبد.
- **قواعد السياق كلامدا.** تتطلب `t_missing_docstring` `(lines, i)`؛ لامدا عالقة تفحص `pr["lines"][0]` تُعلّم كل `def` بصمت (أو، أسوأ، لا تُعلّم شيئًا). أعطِ *كل* القواعد نفس تواقيع `(lines, i)`.
- **سلبيات كاذبة لـ bare-except.** يُلتقط `except:`؛ ولا يُلتقط `except Exception:`. قرّر السياسة ورمّز الـ startswith بالضبط (`except:`)، ولا `"except" in line` أبدًا (وهي تنطلق على تعليقات مثل `# except: …`).
- **السطر المقصوص = أسطر مسافات-فقط.** سطر من ثلاث مسافات يفشل `ln != ln.rstrip()` — يُعلَّم كمسافات بائية، وهو بقدر ما *ضجيج سطر فارغ*. عطّل متتاليات الفراغ قبل حلقة المراجعة إذا كان ذلك يسيء إلى التقرير.
- **تحوير العيّنة في مكانها.** `fixed_lines = pr["lines"]` (بلا نسخ) كان ليعدّل *الأصل* بينما "تصلحه" — و`review.json` ليعكس التحريرات بصمت. انسخ قبل إعادة الكتابة.
- **التحقق من JSON مرتين.** فتح `review.json` قبل انتهاء `run_review` (أو إعادة تشغيل `review` مرتين) يعطي حمولات قديمة أو مضاعفة. استدعاء `run_review` واحد لكل حالة، وكتابة واحدة.

## ما بنيته للتو

بوت مراجعة كود من البداية للنهاية: PR مُنموذج كـ `{file, lines}`، وسجلّ قواعد-كبيانات من ستة اختبارات حتمية، ومحرك من سطرين يسجّل كل قاعدة × كل سطر، وتعليقات لكل سطر بخطورة ومقتطف كود، وحُكم `REJECT`/`APPROVE` مقيَّد بـ `major`، وحمولة JSON إلى جانب ملخص بشري، وحلقة إعادة مراجعة قلبت الحُكم بمجرد تسمية `except` العاري. العمود الفقري القابل للنقل — **قواعد كبيانات حتى يبقى المحرك عامًا**، **تعليقات مثبّتة على أرقام أسطر تبدأ من 1 مع حمولة آليّة**، **تجميع الخطورة يقود حُكمًا منطقيًا واحدًا**، **فرق مُصلح يُعاد مراجعته لإثبات الحلقة** — هو بالضبط كيف تُبنى بوتات مراجعة CI حقيقية قبل (أو جنبًا إلى جنب مع) أي طبقة حكم نموذج لغوي.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
يحوي [`examples/code-review-bot/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/code-review-bot) في مستودع الدورة البوت كاملًا كدفتر ملاحظات — نموذج PR، وسجلّ قواعد، ومحرك، وتصدير JSON، وحلقة الإصلاح-وإعادة-المراجعة، قابل للتشغيل في Colab/Kaggle/Binder. استنسخ المستودع أو [افتحه في Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## إلى أين تذهب من هنا

- كل شيء بيانات — **حمّل القواعد من JSON** بدلًا من ترميز `RULES` ثابتًا، حتى يبقى `review_bot.py` بلا تغيير عندما تتغير قاعدة.
- اجعل البوت **CLI**: `python3 review_bot.py payment.py [--out review.json]`، قارئًا `sys.argv` مثل المشاريع السابقة.
- أضف قاعدة **سياقية**: علّم كتل `try:` التي يكون `except` فيها *عاريًا* فقط عندما تهمّ السعة الواسعة — أو قاعدة تفحص `return` في كل فرع من `if`.
- قارن مع مراجع حقيقي: شغّل **ruff** (`pip install ruff`) على `payment.py` واربط كل رمز `E…`/`W…` بقواعدك — تدقيق صادق لما تفوته القواعد المكتوبة يدويًا.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها — وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓