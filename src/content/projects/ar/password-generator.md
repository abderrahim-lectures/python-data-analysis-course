---
title: "مدير كلمات المرور"
description: "ولّد واحفظ ودقّق كلمات المرور مع كشف الاختراقات والمشاركة الجماعية."
difficulty: "beginner"
estimatedMinutes: 45
tags: ["security", "cryptography", "cli", "hashing"]
xpReward: 50
learningObjectives:
  - ولّد كلمات مرور عشوائية آمنة تشفيريًا مع مجموعات محارف قابلة للتخصيص
  - احسب إنتروبيا كلمة المرور وخصّص تسميات قوة للنتائج
  - افحص كلمات المرور مقابل قاعدة بيانات الاختراقات Have I Been Pwned باستخدام k-anonymity
  - خزّن بيانات الاعتماد واسترجِعها في ملف خزنة مشفّر بـ AES
  - ابنِ واجهة سطر أوامر باستخدام argparse
  - تتبّع عمر كلمة المرور وعلّم المدخلات المنتهية الصلاحية
  - أنتج تقارير طرفية منسّقة وملوّنة
prerequisites:
  - أساسيات سلاسل النصوص والدوال في Python
  - فهم القوائم والحلقات
  - إلمام بـ pip/uv لتثبيت الحزم
---

# مدير كلمات المرور

تستخدم كلمة المرور نفسها في كل مكان لأن ابتكار واحدة جديدة في كل مرة أمر ممل. في هذا المشروع ستبني أداة تقوم بالجزء الممل بدلًا منك: تولّد كلمات مرور قوية، وتقيس مدى صعوبة اختراقها، وتفحص إن كانت قد ظهرت سابقًا في اختراق للبيانات، وتخزّنها في خزنة مشفّرة يمكنك فتحها بكلمة مرور رئيسية.

يفترض هذا المشروع أساسيات Python 101 فقط ، الدوال، والقوائم، والقواميس، والحلقات، وتنسيق السلاسل النصية. لا أطر عمل، ولا قواعد بيانات، ولا خدمات سحابية. كل ما تحتاجه يأتي من المكتبة القياسية بالإضافة إلى حزمة تشفير صغيرة واحدة.

هذا اختياري وغير مُقيَّم. راجع [مشاريع من العالم الحقيقي](/ar/مشاريع) للاطلاع على القائمة الكاملة.

## 🎯 ما ستفعله

1. توليد كلمات مرور آمنة تشفيريًا مع مجموعات محارف قابلة للتخصيص باستخدام وحدة `secrets`.
2. تحليل قوة كلمة المرور عن طريق حساب الإنتروبيا ، المقياس الرياضي لعدم القدرة على التوقع.
3. فحص كلمات المرور مقابل قاعدة بيانات الاختراقات Have I Been Pwned دون إرسال كلمة المرور الكاملة أبدًا (k-anonymity).
4. بناء خزنة مشفّرة تخزّن بيانات الاعتماد محمية بكلمة مرور رئيسية باستخدام AES-256.
5. إنشاء واجهة سطر أوامر باستخدام `argparse` ليعمل المشروع من سطر الأوامر.
6. إضافة متتبّع انتهاء صلاحية كلمة المرور يعلّم المدخلات الأقدم من 90 يومًا.
7. صقل المخرجات بتنسيق طرفية ملوّن وتقرير ملخّص.

## أين تُشغّل هذا

- **محليًا باستخدام `uv` (موصى به).** يحتاج هذا المشروع إلى حزمة خارجية واحدة (`cryptography`) للتشفير ، مرشّح جيد لتشغيل Python على جهازك الخاص. قسم الإعداد أدناه يشرح ذلك خطوة بخطوة.
- **ملاعب JupyterLite.** الصق كتل التعليمات البرمجية في خلايا وشغّلها في المتصفح. خطوة فحص الاختراقات تحتاج إلى اتصال بالشبكة؛ وخطوة الخزنة تُنشئ ملفات في التخزين المؤقت للمتصفح.
- **Google Colab.** انقر على شارة Colab في صفحة المشروع للتشغيل في دفتر ملاحظات سحابي. لاحظ أن ملفات الخزنة التي تُنشأ في Colab لا تبقى بين الجلسات.

- **شغّله في المتصفح.** هناك دفتر ملاحظات تفاعلي جاهز ، افتحه على Colab أو Kaggle أو Binder وتابع خطوة بخطوة.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/password-generator/notebook.ar.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/password-generator/notebook.ar.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fpassword-generator%2Fnotebook.ar.ipynb)

## الإعداد

`uv` أداة واحدة تحل محل السلسلة المعتادة "ثبّت Python، ثم ثبّت pip، ثم ثبّت بيئة افتراضية، ثم ثبّت الحزم" ، تدير إصدارات Python وتبعيات المشروع معًا.

**macOS / Linux** (الطرفية):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

أغلق طرفيتك وأعد فتحها، ثم تأكد من أن التثبيت تم:

```bash
uv --version
```

ثم أعِدَّ المشروع:

```bash
uv init password-generator
cd password-generator
uv add secrets hashlib cryptography httpx
```

وحدة `secrets` تأتي مع Python وتوفر أرقامًا عشوائية قوية تشفيريًا. حزمة `cryptography` توفر تشفير AES للخزنة. حزمة `httpx` تدير طلبات HTTP إلى واجهة فحص الاختراقات. وحدة `hashlib` (مدمجة أيضًا) تحسب تجزئات SHA-1 لبحث k-anonymity.

## الخطوة 1: ولّد كلمات مرور آمنة

لبنة البناء الأولى: دالة تُنتج كلمة مرور عشوائية بأنواع المحارف الذي تريده بالضبط. الرؤية الأساسية هي *أي* وحدة عشوائية يجب استخدامها ، وحدة `random` في Python مصممة للمحاكاة، لا للأمن. إنها محدّدة السلوك إذا عرفت البذرة (seed). وحدة `secrets` تستخدم مصدر العشوائية الحقيقي لنظام التشغيل وهي الخيار الصحيح لأي شيء متعلق بالأمن.

### 1.1 ابنِ مجموعة المحارف

**👟 تلميح البداية :** استورد `secrets` و`string`. اكتب دالة `generate_password` تقبل وسيطات كلمات مفتاحية تتحكم في أنواع المحارف التي ستضمّنها (`use_uppercase`, `use_lowercase`, `use_digits`, `use_symbols`). ابدأ ببناء سلسلة `charset` من الأنواع التي يريدها المستدعي.

```python
import secrets
import string

SYMBOLS = "!@#$%^&*()-_=+[]{}|;:,.<>?"

def generate_password(
    length: int = 16,
    use_uppercase: bool = True,
    use_lowercase: bool = True,
    use_digits: bool = True,
    use_symbols: bool = True,
) -> str:
    """Generate a cryptographically secure random password."""
    charset = ""
    required = []

    if use_lowercase:
        charset += string.ascii_lowercase
        required.append(secrets.choice(string.ascii_lowercase))
    if use_uppercase:
        charset += string.ascii_uppercase
        required.append(secrets.choice(string.ascii_uppercase))
    if use_digits:
        charset += string.digits
        required.append(secrets.choice(string.digits))
    if use_symbols:
        charset += SYMBOLS
        required.append(secrets.choice(SYMBOLS))

    if not charset:
        raise ValueError("At least one character type must be selected")

    remaining = length - len(required)
    password_chars = required + [secrets.choice(charset) for _ in range(remaining)]

    # Shuffle so required characters are not clustered at the start
    secrets.SystemRandom().shuffle(password_chars)
    return "".join(password_chars)
```

الخدعة تكمن في قائمة `required`: نختار حرفًا واحدًا من كل نوع مُفعّل *أولًا*، ثم نملأ باقي كلمة المرور من المجموعة الكاملة. يضمن هذا ظهور كل نوع مطلوب مرة واحدة على الأقل. بعد ذلك، يخلط `SystemRandom().shuffle` المواضع حتى لا يكون الحرف الصغير الذي ضمنّته دائمًا هو الحرف صفر.

**🎯 الناتج المتوقع :** ولّد بضعة أمثلة وتفقّدها:

```python
for i in range(3):
    pw = generate_password(length=20)
    print(f"  {pw}")
```

```
  k7G!mP2xQ#nR9wL@jT4f
  aB3$vN8&kD5*pY1!mW6h
  Rj4#Xp7!cF2@nM9&wL5s
```

يجب أن يكون كل ناتج بطول 20 محرفًا، ويتضمن على الأقل محرفًا صغيرًا واحدًا، ومحرفًا كبيرًا واحدًا، ورقمًا واحدًا، ورمزًا واحدًا.

### 1.2 تحقّق من الضمانات

**👟 تلميح البداية :** اكتب فحصًا سريعًا يثبت أن كل نوع محارف حاضر في كلمة المرور المولّدة. هذا فحص سلامة عقلية، لا كود إنتاج ، فقط تأكد من أن منطق `required` الخاص بك يعمل.

```python
def verify_password(pw: str) -> bool:
    """Check that a password contains at least one of each type."""
    checks = [
        any(c in string.ascii_lowercase for c in pw),
        any(c in string.ascii_uppercase for c in pw),
        any(c in string.digits for c in pw),
        any(c in SYMBOLS for c in pw),
    ]
    return all(checks)

# Generate 100 passwords and verify each one
for _ in range(100):
    pw = generate_password(length=16)
    assert verify_password(pw), f"Failed for: {pw}"
print("All 100 passwords passed verification.")
```

**🩹 إذا لم يعمل :** إذا فشل تأكيد (assertion)، فمن المحتمل أن مجموعة المحارف فارغة لأحد الأنواع. تحقق من أن كتل `if use_*` تضيف كل منها إلى كلٍّ من `charset` و`required`. إذا حصلت على `ValueError: At least one character type must be selected`، فكل الأعلام الأربعة `False` ، مرّر `use_lowercase=True` على الأقل.

### 1.3 تأكد من الصحة

**✅ قائمة التحقق**

- `generate_password(length=20)` تُرجع سلسلة بطول 20 محرفًا بالضبط.
- كل كلمة مرور مولّدة تحتوي على محرف صغير واحد ومحرف كبير واحد ورقم واحد ورمز واحد على الأقل.
- توليد 100 كلمة مرور في حلقة ينتج 100 نتيجة مختلفة (بدون تكرار).
- تمرير `use_symbols=False` ينتج كلمات مرور دون رموز.
- تمرير `length=8` مع تفعيل كل الأنواع يُرجع سلسلة بطول 8 محارف.

**🤔 سؤال (أسئلة) سقراطي(ة)** إذا استبدلت `secrets.choice` بـ`random.choice` في كامل هذه الدالة، فهل سيبدو الناتج *مختلفًا* للعين البشرية؟ وماذا عن شخص يعرف البذرة؟ لماذا يهم هذا التمييز بالنسبة لكلمات المرور؟

## الخطوة 2: حلّل قوة كلمة المرور

السلسلة العشوائية قوية بقدر المجموعة التي سُحبت منها. المقياس الرياضي هو **الإنتروبيا** ، عدد بتات المعلومات التي يحتاج المهاجم إلى تخمينها لكلمة المرور. كلمة مرور مسحوبة من مجموعة من 70 محرفًا، بطول 16 محرفًا، لها إنتروبيا log2(70^16) ≈ 97.4 بت. إنه رقم مفيد لأنه يترجم مباشرة إلى عدد المحاولات التي يحتاجها هجوم القوة الغاشمة.

### 2.1 احسب الإنتروبيا

**👟 تلميح البداية :** اكتب `calculate_entropy(password)` تحدّد أي مجموعات المحارف حاضرة (الصغيرة والكبيرة والأرقام والرموز)، وتجمع مقاييسها في `charset_size`، وتُعيد `len(password) * math.log2(charset_size)`.

```python
import math

def calculate_entropy(password: str) -> float:
    """Calculate the entropy of a password in bits."""
    charset_size = 0
    if any(c in string.ascii_lowercase for c in password):
        charset_size += 26
    if any(c in string.ascii_uppercase for c in password):
        charset_size += 26
    if any(c in string.digits for c in password):
        charset_size += 10
    if any(c in SYMBOLS for c in password):
        charset_size += 30

    if charset_size == 0:
        return 0.0

    return len(password) * math.log2(charset_size)
```

**🎯 الناتج المتوقع :** جرّب بعض الحالات المعروفة:

```python
print(calculate_entropy("abc"))          # short, lowercase only
print(calculate_entropy("password123"))  # common pattern
print(calculate_entropy(generate_password(16)))  # random, full pool
```

```
15.1
33.2
97.4
```

كلمة المرور العشوائية بطول 16 محرفًا تصل إلى نحو 97 بتًا ، أعلى بكثير من عتبة الـ80 بتًا التي تعتبرها أغلب إرشادات الأمن "قوية جدًا".

### 2.2 اربط الإنتروبيا بتسميات مقروءة

الأرقام دقيقة لكنها ليست بديهية. دالة `strength_label` تحوّل الإنتروبيا إلى شيء يمكن للإنسان التصرف بناءً عليه.

```python
def strength_label(entropy: float) -> str:
    """Return a human-readable strength label."""
    if entropy < 28:
        return "Very Weak"
    elif entropy < 36:
        return "Weak"
    elif entropy < 60:
        return "Moderate"
    elif entropy < 80:
        return "Strong"
    else:
        return "Very Strong"
```

### 2.3 اطبع شريط قوة مرئيًا

اجمع كل شيء في دالة `analyze_password` تطبع تقريرًا منسّقًا.

```python
def analyze_password(password: str) -> dict:
    """Full strength analysis of a password."""
    entropy = calculate_entropy(password)
    label = strength_label(entropy)
    bar_len = min(int(entropy / 4), 30)
    bar = "\u2588" * bar_len + "\u2591" * (30 - bar_len)

    print(f"\n  Password: {'*' * len(password)}")
    print(f"  Length:    {len(password)} characters")
    print(f"  Entropy:   {entropy:.1f} bits")
    print(f"  Strength:  [{bar}] {label}")

    return {"password": password, "entropy": entropy, "label": label}
```

**🎯 الناتج المتوقع :**

```python
for pw in ["abc", "password123", generate_password(16), generate_password(24)]:
    analyze_password(pw)
```

```
  Password: ***
  Length:    3 characters
  Entropy:   15.1 bits
  Strength:  [███░░░░░░░░░░░░░░░░░░░░░░░░░░░] Very Weak

  Password: ***********
  Length:    11 characters
  Entropy:   33.2 bits
  Strength:  [████████░░░░░░░░░░░░░░░░░░░░░░] Weak

  Password: ****************
  Length:    16 characters
  Entropy:   97.4 bits
  Strength:  [██████████████████████████████] Very Strong

  Password: ************************
  Length:    24 characters
  Entropy:   146.1 bits
  Strength:  [██████████████████████████████] Very Strong
```

يمتلئ الشريط بشكل متناسب: مربع واحد لكل ~4 بتات إنتروبيا، بحد أقصى 30 مربعًا لعرض الشريط.

**🩹 إذا لم يعمل :** إذا ظهرت كلمة مرور عشوائية واضحة كـ"Weak"، فتحقق من أن `calculate_entropy` تكتشف مجموعات المحارف الأربع جميعها. خطأ شائع هو ترميز سلسلة الرموز يدويًا بدلًا من إعادة استخدام الثابت `SYMBOLS` ، إذا اختلفت السلسلة المرمزة يدويًا بحرف واحد فقط، فإن فحص الرموز يفوّت بعض كلمات المرور بصمت. إذا كانت `entropy` هي `NaN`، فـ`charset_size` صفر، وهذا يعني أن `calculate_entropy` لم تجد أيًا من المجموعات الأربع ، تأكد من أن كلمة المرور ليست فارغة.

### 2.4 تحقّق من التحليل

**✅ قائمة التحقق**

- `"abc"` (3 محارف، صغيرة فقط) تُسمّى "Very Weak" وإنتروبيتها أقل من 20 بتًا.
- `"password123"` (نمط شائع) يُسمّى "Weak" رغم كونه بطول 11 محرفًا، لأن مجموع محروفه صغيرة.
- كلمة مرور عشوائية بطول 16 محرفًا من الخطوة 1 تُسمّى "Very Strong" وإنتروبيتها أعلى من 95 بتًا.
- كلمة مرور عشوائية بطول 24 محرفًا تُظهر إنتروبيا أعلى من النسخة ذات الـ16 محرفًا.
- تصوير الشريط يمتلئ أكثر لكلمات المرور الأقوى.

**🤔 سؤال (أسئلة) سقراطي(ة)** لماذا يكون لـ`"password123"` إنتروبيا منخفضة رغم طوله 11 محرفًا؟ إذا عرف المهاجم أن الناس تميل إلى اختيار كلمات من القاموس مع أرقام، فكيف يغيّر ذلك مجموع المحارف *الفعال* مقارنة بما تفترضه `calculate_entropy`؟

## الخطوة 3: افحص مقابل قواعد بيانات الاختراقات

حتى كلمة المرور عالية الإنتروبيا لا قيمة لها إذا ظهرت سابقًا في اختراق للبيانات. تتيح لك واجهة Have I Been Pwned (HIBP) الفحص ، لكن يجب ألا ترسل كلمة المرور الفعلية أبدًا إلى خادم طرف ثالث. الحل هو **k-anonymity**: ترسل فقط أول 5 محارف من تجزئة SHA-1 لكلمة المرور وتستلم قائمة بلواحق التجزئة المطابقة. كلمة المرور الكاملة لا تغادر جهازك أبدًا.

### 3.1 افهم بروتوكول k-anonymity

التدفق يعمل هكذا:

1. جزّئ كلمة المرور بـ SHA-1: `SHA1("password123") = "CBFDAC6008F9CAB4083784CBD1874F76618D2A97"`
2. أرسل أول 5 محارف (`CBFDA`) إلى `https://api.pwnedpasswords.com/range/CBFDA`
3. تستجيب الواجهة بآلاف الأسطر، كل سطر عبارة عن لاحقة تجزئة وعدد: `C6008F9CAB4083784CBD1874F76618D2A97:42`
4. ابحث في الاستجابة عن لاحقة تجزئتك الكاملة (`C6008F9CAB4083784CBD1874F76618D2A97`). إذا وجدتها، فكلمة مرورك ظهرت في `42` اختراقًا.
5. يعرف الخادم فقط بادئة من 5 محارف تطابق ملايين كلمات المرور المحتملة ، لا يمكنه تحديد كلمة المرور المحددة التي تفحصها.

### 3.2 نفّذ فاحص الاختراقات

**👟 تلميح البداية :** تحتاج `hashlib` (مدمجة) لـ SHA-1 و`httpx` لطلب HTTP. جسم الاستجابة نص عادي مع لاحقة تجزئة واحدة في كل سطر.

```python
import hashlib
import httpx

def check_breach(password: str) -> tuple[bool, int]:
    """Check if a password appears in known breaches using HIBP k-anonymity."""
    sha1 = hashlib.sha1(password.encode("utf-8")).hexdigest().upper()
    prefix, suffix = sha1[:5], sha1[5:]

    try:
        response = httpx.get(
            f"https://api.pwnedpasswords.com/range/{prefix}",
            timeout=10,
        )
        response.raise_for_status()

        for line in response.text.splitlines():
            hash_suffix, count = line.split(":")
            if hash_suffix == suffix:
                return True, int(count)

        return False, 0
    except Exception as e:
        print(f"Breach check failed: {e}")
        return False, 0
```

**🎯 الناتج المتوقع :** اختبر بكلمة مرور تعلم أنها خُرقت، وأخرى ولّدتها للتو:

```python
is_breached, count = check_breach("password123")
if is_breached:
    print(f"This password appeared in {count:,} breaches. Do not use it.")
else:
    print("This password was not found in known breaches.")
```

```
This password appeared in 3,862,431 breaches. Do not use it.
```

```python
fresh = generate_password(20)
is_breached, count = check_breach(fresh)
print(f"Fresh password: breached={is_breached}, count={count}")
```

```
Fresh password: breached=False, count=0
```

كلمة مرور عشوائية مولّدة حديثًا يجب ألا تظهر في قاعدة بيانات الاختراقات أبدًا. إذا ظهرت، فمصدر العشوائية معطوب ، عد إلى الخطوة 1 وتأكد من استخدامك لـ`secrets` لا `random`.

**🩹 إذا لم يعمل :** إذا حصلت على `Breach check failed: ...`، فقد تحجب شبكتك الطلب أو تكون الواجهة معطلة مؤقتًا ، تُعيد الدالة `False, 0` عند الفشل حتى لا تتعطل الأداة. إذا حصلت على `ConnectionError`، تحقق من اتصالك بالإنترنت. إذا حصلت على `403`، فإن الواجهة تفرض حدود معدل الطلبات ، انتظر لحظة وأعد المحاولة. إذا عادت كلمة مرور خُرقت معروفة مثل `"password123"` على أنها غير مخترقة، تحقق من أن تجزئة SHA-1 بأحرف كبيرة وأن مقارنة اللاحقة دقيقة (لا مسافات زائدة، ولا `.strip()` مطلوبة على الجانب الأيمن من `split(":")`).

### 3.3 تحقّق من فاحص الاختراقات

**✅ قائمة التحقق**

- `"password123"` تُرجع `True` بعدد بالملايين.
- `"123456"` تُرجع `True` بعدد مرتفع جدًا.
- كلمة مرور مولّدة حديثًا من الخطوة 1 تُرجع `False, 0`.
- تتعامل الدالة مع أخطاء الشبكة بأناقة ، لا traceback، فقط تحذير و`False, 0`.
- لا تظهر كلمة المرور الكاملة في أي جملة طباعة أو سجل.

**🤔 سؤال (أسئلة) سقراطي(ة)** تُرجع الواجهة نتائج لملايين تجزئات كلمات المرور التي تتشارك نفس البادئة المكونة من 5 محارف. إذا كانت بادئة كلمة مرورك هي `CBFDA`، فكم كلمة مرور *أخرى* تسرّب معلومات عنهنّ إلى الخادم بمجرد إجراء الطلب؟ ولماذا يعد ذلك مقبولًا في هذا التصميم؟

## الخطوة 4: ابنِ خزنة مشفّرة

توليد كلمات مرور قوية نصف القيمة فقط ، تحتاج أيضًا إلى تخزينها في مكان ما. كتابتها في ملف نصي عادي يفوّت الغرض. بدلًا من ذلك، سنشفّر الخزنة بـ **AES-256** باستخدام تنفيذ Fernet في حزمة `cryptography`. تُفك تشفير الخزنة وقت التشغيل باستخدام كلمة مرور رئيسية تكتبها مرة واحدة.

### 4.1 اشتق مفتاح التشفير من كلمة المرور الرئيسية

يحتاج Fernet إلى مفتاح من 32 بايتًا مرمّزًا base64 بطريقة آمنة لعناوين URL. نشتقه من كلمة المرور الرئيسية باستخدام SHA-256 (في الإنتاج ستستخدم PBKDF2 أو argon2 لاشتقاق مفتاح أبطأ، لكن هذا يوضح سير العمل).

**👟 تلميح البداية :** جزّئ كلمة المرور الرئيسية بـ SHA-256 ثم مرمّز النتيجة base64.

```python
from cryptography.fernet import Fernet
import base64

def derive_key(master_password: str) -> bytes:
    """Derive an AES key from a master password."""
    key = hashlib.sha256(master_password.encode()).digest()
    return base64.urlsafe_b64encode(key)
```

### 4.2 احفظ الخزنة

**👟 تلميح البداية :** اكتب `save_vault(vault, master_password, filepath)` تحوّل قاموس الخزنة إلى سلسلة، وتشفّرها بـ Fernet، وتكتب النص المشفّر إلى القرص.

```python
def save_vault(vault: dict, master_password: str, filepath: str = "vault.enc"):
    """Encrypt and save the vault to disk."""
    key = derive_key(master_password)
    f = Fernet(key)
    data = str(vault).encode()
    encrypted = f.encrypt(data)

    with open(filepath, "wb") as file:
        file.write(encrypted)
    print(f"Vault saved to {filepath}")
```

### 4.3 حمّل الخزنة

**👟 تلميح البداية :** اكتب `load_vault(master_password, filepath)` تقرأ النص المشفّر، وتفك تشفيره، وتحوّل السلسلة إلى قاموس. تعامل مع حالتَي الفشل: ملف غير موجود (ابدأ من جديد) وكلمة مرور خاطئة (فك تشفير تالف).

```python
def load_vault(master_password: str, filepath: str = "vault.enc") -> dict:
    """Load and decrypt the vault from disk."""
    key = derive_key(master_password)
    f = Fernet(key)

    try:
        with open(filepath, "rb") as file:
            encrypted = file.read()
        decrypted = f.decrypt(encrypted)
        return eval(decrypted.decode())
    except FileNotFoundError:
        print("No vault file found. Starting fresh.")
        return {}
    except Exception:
        print("Wrong master password or corrupted vault.")
        return {}
```

**🎯 الناتج المتوقع :** أنشئ خزنة بمدخلين، واحفظها، وأعد تحميلها، وتحقق:

```python
vault = {
    "github": {"username": "alice", "password": generate_password(20)},
    "email": {"username": "alice@example.com", "password": generate_password(20)},
}

save_vault(vault, "my-master-password")
loaded = load_vault("my-master-password")
print(f"Vault loaded with {len(loaded)} entries.")
for service, creds in loaded.items():
    print(f"  {service}: {creds['username']}")
```

```
Vault saved to vault.enc
Vault loaded with 2 entries.
  github: alice
  email: alice@example.com
```

الآن جرّب التحميل بكلمة المرور الخاطئة:

```python
loaded_bad = load_vault("wrong-password")
```

```
Wrong master password or corrupted vault.
```

كلمة المرور الخاطئة تنتج قاموسًا فارغًا ورسالة خطأ واضحة ، لا traceback، ولا تعطل.

**🩹 إذا لم يعمل :** إذا حصلت على `InvalidToken` مع traceback بدلًا من الرسالة الودية، فكتلة `except Exception` لا تلتقط خطأ Fernet. تحقق من أن `from cryptography.fernet import Fernet` في أعلى ملفك ، إذا كان الاستيراد مفقودًا، فـ`Fernet` غير معرّف وكتلة `except` تفشل قبل أن تتمكن من معالجة الخطأ. إذا كان ملف الخزنة دائمًا فارغًا بعد إعادة التحميل، فقد يكون تحويل `str(vault)` منتجًا شيئًا لا يستطيع `eval()` تحليله ، تحقق من أن قاموس الخزنة يحتوي سلاسل فقط، لا كائنات أو دوال.

:::warning[`eval()` خطر في بيئة الإنتاج]
`eval()` ينفّذ كود Python تعسفيًا. هذا مقبول لمشروع تعلم شخصي تتحكم فيه في ملف الخزنة، لكن في الإنتاج يجب أن تستخدم `json.loads()` بدلًا من `eval()` لإلغاء التسلسل. ستحتاج صيغة الخزنة إلى استخدام أنواع متوافقة مع JSON (لا tuples، ولا مجموعات، ولا كائنات مخصصة).
:::

### 4.4 تحقّق من الخزنة

**✅ قائمة التحقق**

- حفظ خزنة بمدخلين يُنشئ ملف `vault.enc` على القرص.
- التحميل بكلمة المرور الرئيسية الصحيحة يُرجع المدخلين مع أسماء المستخدمين وكلمات المرور سليمة.
- التحميل بكلمة مرور رئيسية خاطئة يطبع خطأ ويُرجع قاموسًا فارغًا.
- التحميل عند عدم وجود ملف خزنة يطبع رسالة ويُرجع قاموسًا فارغًا.
- محتويات ملف `vault.enc` نص مشفّر ثنائي، لا نص قابل للقراءة.

**🤔 سؤال (أسئلة) سقراطي(ة)** إذا سرق شخص ملف `vault.enc` الخاص بك، فكم محاولة تخمين يحتاجها لفك تشفيره؟ وكيف يتغير هذا الرقم إذا عرف أن كلمة مرورك الرئيسية هي 8 أحرف صغيرة فقط مقابل كلمة مرور عشوائية بطول 20 محرفًا من الخطوة 1؟

## الخطوة 5: واجهة سطر الأوامر

تعمل الأداة في غلاف Python، لكن الأدوات الحقيقية تعيش في سطر الأوامر. سنغلّف كل شيء في `argparse` ليتمكن المستخدمون من توليد كلمات المرور وفحصها وتخزينها وسردها دون فتح Python.

### 5.1 جهّز argparse

**👟 تلميح البداية :** استخدم أوامر فرعية مع `add_subparsers` ، واحد لـ`generate`، وواحد لـ`check`، وواحد لـ`store`، وواحد لـ`list`. لكل أمر فرعي أعلامه الخاصة.

```python
import argparse
import sys

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Password Generator — create, analyze, and store secure passwords."
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # generate
    gen = sub.add_parser("generate", help="Generate a new password")
    gen.add_argument("-l", "--length", type=int, default=16, help="Password length (default: 16)")
    gen.add_argument("-n", "--count", type=int, default=1, help="Number of passwords to generate")
    gen.add_argument("--no-symbols", action="store_true", help="Exclude symbols")
    gen.add_argument("--no-uppercase", action="store_true", help="Exclude uppercase letters")
    gen.add_argument("--no-digits", action="store_true", help="Exclude digits")

    # check
    chk = sub.add_parser("check", help="Check password strength and breach status")
    chk.add_argument("password", nargs="?", help="Password to check (will prompt if omitted)")

    # store
    sto = sub.add_parser("store", help="Store a credential in the encrypted vault")
    sto.add_argument("service", help="Service name (e.g. github)")
    sto.add_argument("-u", "--username", required=True, help="Username or email")
    sto.add_argument("-p", "--password", help="Password (will generate if omitted)")
    sto.add_argument("--master", required=True, help="Master password for the vault")

    # list
    lst = sub.add_parser("list", help="List all entries in the vault")
    lst.add_argument("--master", required=True, help="Master password for the vault")

    return parser
```

### 5.2 اربط الأوامر

**👟 تلميح البداية :** اكتب دالة `main()` تحلّل الوسيطات وتوجّهها إلى الدوال المناسبة من الخطوات 1-4.

```python
def main():
    parser = build_parser()
    args = parser.parse_args()

    if args.command == "generate":
        for _ in range(args.count):
            pw = generate_password(
                length=args.length,
                use_uppercase=not args.no_uppercase,
                use_symbols=not args.no_symbols,
                use_digits=not args.no_digits,
            )
            print(pw)

    elif args.command == "check":
        password = args.password
        if not password:
            password = input("Enter password to check: ").strip()
        analyze_password(password)
        is_breached, count = check_breach(password)
        if is_breached:
            print(f"  WARNING: Found in {count:,} breaches!")
        else:
            print("  Not found in known breaches.")

    elif args.command == "store":
        vault = load_vault(args.master)
        pw = args.password or generate_password(20)
        vault[args.service] = {"username": args.username, "password": pw}
        save_vault(vault, args.master)
        print(f"Stored {args.service} for {args.username}.")

    elif args.command == "list":
        vault = load_vault(args.master)
        if not vault:
            print("Vault is empty.")
        else:
            print(f"\n  {'Service':<15} {'Username':<25} {'Password':<20}")
            print(f"  {'-'*15} {'-'*25} {'-'*20}")
            for service, creds in vault.items():
                print(f"  {service:<15} {creds['username']:<25} {creds['password']:<20}")

if __name__ == "__main__":
    main()
```

**🎯 الناتج المتوقع :** شغّل من الطرفية:

```bash
python password_generator.py generate --length 20 --count 3
```

```
k7G!mP2xQ#nR9wL@jT4f
aB3$vN8&kD5*pY1!mW6h
Rj4#Xp7!cF2@nM9&wL5s
```

```bash
python password_generator.py check "password123"
```

```
  Password: ***********
  Length:    11 characters
  Entropy:   33.2 bits
  Strength:  [████████░░░░░░░░░░░░░░░░░░░░░░] Weak
  WARNING: Found in 3,862,431 breaches!
```

```bash
python password_generator.py store github -u alice --master "my-master-password"
python password_generator.py list --master "my-master-password"
```

```
  Service         Username                  Password
  --------------- ------------------------- --------------------
  github          alice                     k7G!mP2xQ#nR9wL@jT4f
```

**🩹 إذا لم يعمل :** إذا حصلت على `error: the following arguments are required`، نسيت تمرير علم مطلوب (مثل `--master` أو `-u`). إذا حصلت على `unrecognized arguments`، تحقق من ترتيب الأمر الفرعي ، `generate` يأتي قبل الأعلام لا بعدها. إذا لم تطبع `generate` شيئًا، فقد يكون `--count` مضبوطًا على 0. إذا أظهر `list` نصًا مشوّهًا، فخزنتك حُفظت بصيغة `str()` من إصدار Python مختلف ، أعِد توليدها.

### 5.3 تحقّق من واجهة سطر الأوامر

**✅ قائمة التحقق**

- `generate --length 20 --count 3` يطبع ثلاث كلمات مرور بطول 20 محرفًا، واحدة في كل سطر.
- `generate --no-symbols` ينتج كلمات مرور دون رموز.
- `check "password123"` يُظهر "Weak" و"Found in ... breaches."
- `store github -u alice --master X` يُنشئ ملف الخزنة أو يحدّثه.
- `list --master X` يُظهر كل المدخلات المخزنة في جدول منسّق.
- تشغيل `list` بكلمة المرور الرئيسية الخاطئة يطبع خطأ، لا traceback.

**🤔 سؤال (أسئلة) سقراطي(ة)** لماذا يطبع `generate` إلى stdout بدلًا من الحفظ في ملف؟ وما الميزة التي يعطيها ذلك لأداة سطر أوامر مقارنة بالكتابة دائمًا إلى القرص؟

## الخطوة 6: متتبّع انتهاء صلاحية كلمات المرور

كلمات المرور تتقادم. كلمة المرور المولّدة قبل 90 يومًا قد تكون خُرقت الآن. بإضافة طابع زمني إلى كل مدخل في الخزنة، يمكننا تعليم كلمات المرور القديمة وتذكير المستخدم بتدويرها.

### 6.1 أضف طوابع زمنية إلى مدخلات الخزنة

**👟 تلميح البداية :** عند تخزين بيانات الاعتماد، أضف مفتاح `"created_at"` بطابع ISO الزمني الحالي. عند سرد المدخلات، قارن العمر بعتبة معيّنة.

```python
from datetime import datetime, timedelta

MAX_PASSWORD_AGE_DAYS = 90

def store_credential(vault: dict, service: str, username: str, password: str) -> dict:
    """Add a credential entry with a creation timestamp."""
    vault[service] = {
        "username": username,
        "password": password,
        "created_at": datetime.now().isoformat(),
    }
    return vault
```

### 6.2 افحص كلمات المرور المنتهية الصلاحية

**👟 تلميح البداية :** اكتب `check_expiry(vault, max_age_days)` تُرجع قائمة من tuples بصيغة `(service, created_at, days_old)` للمدخلات الأقدم من العتبة.

```python
def check_expiry(vault: dict, max_age_days: int = MAX_PASSWORD_AGE_DAYS) -> list[tuple[str, str, int]]:
    """Find passwords older than max_age_days."""
    now = datetime.now()
    expired = []

    for service, creds in vault.items():
        created_str = creds.get("created_at")
        if not created_str:
            continue
        created = datetime.fromisoformat(created_str)
        days_old = (now - created).days
        if days_old > max_age_days:
            expired.append((service, created_str, days_old))

    return expired
```

### 6.3 أظهر انتهاء الصلاحية في عرض القائمة

**👟 تلميح البداية :** حدّث أمر `list` ليعرض عمر كل مدخل ويعلّم المنتهية الصلاحية برمز تحذير.

```python
def list_vault_with_expiry(vault: dict):
    """List vault entries with password age indicators."""
    now = datetime.now()

    print(f"\n  {'Service':<15} {'Username':<20} {'Age':<10} {'Status'}")
    print(f"  {'-'*15} {'-'*20} {'-'*10} {'-'*20}")

    for service, creds in vault.items():
        username = creds["username"]
        created_str = creds.get("created_at")

        if created_str:
            created = datetime.fromisoformat(created_str)
            days_old = (now - created).days
            age_str = f"{days_old}d"
            status = "EXPIRED" if days_old > MAX_PASSWORD_AGE_DAYS else "OK"
        else:
            age_str = "unknown"
            status = "no timestamp"

        marker = " [!]" if status == "EXPIRED" else ""
        print(f"  {service:<15} {username:<20} {age_str:<10} {status}{marker}")

    expired = check_expiry(vault)
    if expired:
        print(f"\n  {len(expired)} password(s) older than {MAX_PASSWORD_AGE_DAYS} days. Rotate them.")
```

**🎯 الناتج المتوقع :**

```
  Service         Username             Age        Status
  --------------- -------------------- ---------- --------------------
  github          alice                95d        EXPIRED [!]
  email           alice@example.com    12d        OK

  1 password(s) older than 90 days. Rotate them.
```

**🩹 إذا لم يعمل :** إذا أظهرت كل المدخلات عمرًا "unknown"، فمفتاح `created_at` لم يُضف أثناء التخزين ، عد إلى دالة `store_credential` وتأكد من أنها تُستدعى بدلًا من بناء القاموس يدويًا. إذا بدا حساب العمر خاطئًا، تحقق من أن `datetime.now()` و`datetime.fromisoformat()` تستخدمان نفس الوعي بالمنطقة الزمنية (كلا التاريخين naive، أو كليهما aware ، لا تخلط بينهما).

### 6.4 تحقّق من متتبّع انتهاء الصلاحية

**✅ قائمة التحقق**

- مدخل مخزّن حديثًا يُظهر حالة "OK" بعمر 0d.
- مدخل `created_at` خاصته مضبوط على قبل 100 يوم يُظهر حالة "EXPIRED [!]".
- مدخل دون مفتاح `created_at` يُظهر عمر "unknown"، لا تعطلًا.
- سطر الملخص في الأسفل يعدّ المدخلات المنتهية فقط.

**🤔 سؤال (أسئلة) سقراطي(ة)** ماذا يحدث إذا غيّر المستخدم ساعة نظامه إلى الوراء 100 يوم بعد تخزين كلمة مرور؟ هل سيظل فحص انتهاء الصلاحية يعمل بشكل صحيح؟ وما المشكلة الواقعية التي يكشفها هذا بشأن فحوصات الأمن القائمة على الطوابع الزمنية على جهة العميل؟

## الخطوة 7: اصقل المخرجات

النص الخام وظيفي لكنه صعب المسح البصري. إضافة اللون إلى مخرجات الطرفية تجعل كلمات المرور القوية مقابل الضعيفة، والمخترقة مقابل السليمة، والمنتهية مقابل الطازجة متميزة بصريًا بنظرة واحدة.

### 7.1 أضف رموز ألوان ANSI

**👟 تلميح البداية :** عرّف ثوابت ألوان باستخدام سلاسل هروب ANSI. لفِّ النص بها لمخرجات الطرفية فقط ، لا تكتب رموز الهروب في الملفات.

```python
class Color:
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    RESET = "\033[0m"

def colored(text: str, color: str) -> str:
    """Wrap text in an ANSI color code."""
    return f"{color}{text}{Color.RESET}"
```

### 7.2 لوّن شريط القوة

**👟 تلميح البداية :** حدّث `analyze_password` لتلوين الشريط حسب تسمية القوة ، أحمر للضعيف، وأصفر للمتوسط، وأخضر للقوي.

```python
def analyze_password_colored(password: str) -> dict:
    """Full strength analysis with colored output."""
    entropy = calculate_entropy(password)
    label = strength_label(entropy)
    bar_len = min(int(entropy / 4), 30)

    if entropy < 36:
        bar_color = Color.RED
    elif entropy < 60:
        bar_color = Color.YELLOW
    else:
        bar_color = Color.GREEN

    filled = colored("\u2588" * bar_len, bar_color)
    empty = colored("\u2591" * (30 - bar_len), Color.DIM)

    print(f"\n  {colored('Password:', Color.BOLD)} {'*' * len(password)}")
    print(f"  {colored('Length:', Color.BOLD)}    {len(password)} characters")
    print(f"  {colored('Entropy:', Color.BOLD)}   {entropy:.1f} bits")
    print(f"  {colored('Strength:', Color.BOLD)} [{filled}{empty}] {label}")

    return {"password": password, "entropy": entropy, "label": label}
```

### 7.3 لوّن فحص الاختراقات

```python
def check_breach_colored(password: str) -> tuple[bool, int]:
    """Check breach status with colored output."""
    is_breached, count = check_breach(password)
    if is_breached:
        print(colored(f"  WARNING: Found in {count:,} breaches!", Color.RED))
    else:
        print(colored("  Not found in known breaches.", Color.GREEN))
    return is_breached, count
```

### 7.4 ابنِ تقريرًا ملخّصًا

**👟 تلميح البداية :** اكتب `print_report` تأخذ قائمة كلمات مرور، وتحلل كلًا منها، وتطبع جدولًا ملخّصًا بعدد النتائج حسب مستوى القوة ومتوسط الإنتروبيا.

```python
def print_report(passwords: list[str]):
    """Print a formatted strength report for a list of passwords."""
    results = [analyze_password_colored(pw) for pw in passwords]

    # Summary
    labels = {}
    for r in results:
        labels[r["label"]] = labels.get(r["label"], 0) + 1

    avg_entropy = sum(r["entropy"] for r in results) / len(results) if results else 0

    print(f"\n  {colored('Summary', Color.BOLD)}")
    print(f"  {'─' * 40}")
    for label in ["Very Weak", "Weak", "Moderate", "Strong", "Very Strong"]:
        count = labels.get(label, 0)
        print(f"  {label:<15} {count}")
    print(f"  {'─' * 40}")
    print(f"  {'Avg entropy:':<15} {avg_entropy:.1f} bits")
    print(f"  {'Total:':<15} {len(results)}")
```

**🎯 الناتج المتوقع :**

```python
passwords = ["abc", "password123", generate_password(12), generate_password(16), generate_password(24)]
print_report(passwords)
```

```
  Password: ***
  Length:    3 characters
  Entropy:   15.1 bits
  Strength:  [███░░░░░░░░░░░░░░░░░░░░░░░░░░░] Very Weak
  ...
  Summary
  ────────────────────────────────────────
  Very Weak      1
  Weak           1
  Strong         1
  Very Strong    2
  ────────────────────────────────────────
  Avg entropy:   72.3 bits
  Total:         5
```

**🩹 إذا لم يعمل :** إذا لم تظهر الألوان، فقد لا تدعم طرفيتك رموز ANSI ، جرّب `export TERM=xterm-256color` قبل التشغيل. إذا رأيت سلاسل هروب خام مثل `[91m` في الناتج، فمحارف الهروب لا تُفسَّر ، تأكد من استخدامك لـ`\033[` (محرف ESC الفعلي)، لا السلسلة الحرفية backslash-zero-three-three.

### 7.5 تحقّق من الناتج المصقول

**✅ قائمة التحقق**

- شريط القوة أحمر لكلمات المرور الضعيفة، وأصفر للمتوسطة، وأخضر للقوية.
- تحذير الاختراق أحمر عند العثور على كلمة المرور في الاختراقات.
- جدول الملخص يُظهر أعدادًا صحيحة لكل مستوى قوة.
- حساب متوسط الإنتروبيا صحيح.
- التشغيل في طرفية تدعم رموز ANSI يُظهر الألوان؛ وإعادة التوجيه إلى ملف لا تتضمن سلاسل الهروب.

**🤔 سؤال (أسئلة) سقراطي(ة)** لماذا يجب استخدام دالة `colored()` مع مخرجات الطرفية فقط وليس الكتابة إلى ملفات السجل؟ وماذا يحدث إذا أنبّبت الناتج الملوّن إلى `less` أو أعدت توجيهه إلى ملف؟

## ⚠️ مآزق شائعة

- **استخدام `random` بدلًا من `secrets`.** وحدة `random` محدّدة السلوك ويمكن توقعها. لأي شيء متعلق بالأمن ، كلمات المرور، والرموز، والمفاتيح ، استخدم `secrets` دائمًا. هذا أهم قرار في هذا المشروع بأكمله.
- **نسيان خلط المحارف المطلوبة.** إذا ألحقت المحارف المطلوبة أولًا ثم ملأت الباقي، فستكون المحارف الأولى دائمًا نوعًا واحدًا من كل نوع بترتيب ثابت. بادئة مثل "aB1!" نمط يعرف المهاجمون فحصه أولًا. اخلط دائمًا.
- **إرسال كلمة المرور الكاملة إلى واجهة الاختراقات.** تصميم k-anonymity الخاص بـ HIBP قائم تحديدًا لتجنب هذا. يجب ألا تغادر جهازك سوى أول 5 محارف من تجزئة SHA-1.
- **استخدام `eval()` في كود الإنتاج.** `eval()` ينفّذ Python تعسفيًا. لمشروع تعلم شخصي هي طريقة سريعة لإلغاء تسلسل الخزنة، لكن في الإنتاج استخدم `json.loads()` مع صيغة خزنة متوافقة مع JSON.
- **حفظ الخزنة عند الخروج فقط.** إذا تعطّل البرنامج في منتصف الجلسة، تضيع التغييرات غير المحفوظة. احفظ بعد كل تحوير ، استدعاء `save_vault` في `store` يقوم بهذا بالفعل.
- **خلط التواريخ الواعية بالوقت وغير الواعية.** `datetime.now()` تُرجع تاريخًا naive (بدون منطقة زمنية). إذا قارنتها بتاريخ واعٍ بالوقت من `datetime.now(timezone.utc)`، فستحصل على `TypeError`. أبقِها متسقة.

## ما بنيته للتو

أداة إدارة كلمات مرور كاملة بلغة Python خالصة: توليد كلمات مرور آمنة تشفيريًا، وتحليل قوة بالإنتروبيا، وكشف اختراقات مقابل قاعدة بيانات عامة باستخدام k-anonymity، وخزنة مشفّرة بـ AES-256، وواجهة سطر أوامر، وتتبّع انتهاء صلاحية كلمات المرور، ومخرجات طرفية ملوّنة. كل قطعة تبني على أساسيات Python 101 ، السلاسل، والقوائم، والقواميس، والحلقات، والدوال ، مطبّقة على مشكلة حقيقية تواجهها كل يوم.

أنماط الأمن هنا تتجاوز كلمات المرور بكثير: k-anonymity يُستخدم في بيانات الصحة وخصوصية المواقع، وتشفير AES هو المعيار للبيانات في حالة السكون، وحساب الإنتروبيا هو أساس كل مقاييس القوة. فهم *لماذا* تعمل هذه الأمور (لا فقط كيفية استدعائها) هو ما يفصل السكربت عن أداة يمكنك الوثوق بها.

## إلى أين تذهب من هنا

- **استخدم KDF حقيقيًا.** استبدل اشتقاق المفتاح بـ SHA-256 بـ PBKDF2 (`cryptography.hazmat.primitives.kdf.pbkdf2`) أو argon2 لمقاومة القوة الغاشمة. تجزئة SHA-256 سريعة ، يمكن للمهاجم تجربة مليارات في الثانية. PBKDF2 بـ 600,000 تكرار يبطئ ذلك بمعامل 600,000.
- **أضف أمر نسخ إلى الحافظة.** أمر `copy` فرعي يضع كلمة المرور في الحافظة ويمسحها بعد 30 ثانية أكثر عملية من الطباعة إلى stdout.
- **نفّذ كشف إعادة استخدام كلمات المرور.** قبل تخزين بيانات اعتماد جديدة، افحص إن كانت كلمة المرور تظهر سابقًا في مدخل آخر ، كلمة المرور القوية المعاد استخدامها ما زالت نقطة فشل واحدة.
- **أضف صيغة خزنة JSON.** انتقل من `eval()`/`str()` إلى `json.dumps()`/`json.loads()` للتوافق والسلامة. JSON لا يدعم tuples أو مجموعات Python، لكن الخزنة لا تحتاج سوى سلاسل.
- **ابنِ أمر `rotate`.** ولّد كلمة مرور جديدة لمدخل قائم، وحدّث الطابع الزمني، وانسخ كلمة المرور الجديدة اختياريًا إلى الحافظة ، كل ذلك في أمر واحد.

## شارك مشروعك مع الصف

هل بنيت شيئًا تفخر به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض للمشاريع التي قدّمها طلاب آخرون ، وملف README الخاص به يحتوي شرحًا كاملًا مبتدئًا لإضافة مشروعك عبر **طلب سحب (pull request)**، حتى لو لم تستخدم git من قبل: تفرع المستودع، وإنشاء فرع، والالتزام بملفاتك، وفتح PR، خطوة بخطوة. لا يُفترض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح.