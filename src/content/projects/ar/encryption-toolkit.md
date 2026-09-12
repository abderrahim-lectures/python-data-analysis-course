---
title: "حزمة الأدوات المشفرة"
description: "شفر وفكّر الملفات والرسائل باستخدام AES-256 وRSA وتبادل المفاتيح الآمن."
difficulty: "intermediate"
estimatedMinutes: 80
tags: ["cli", "cryptography", "files", "security"]
prerequisites:
  - "أساسيات Python (دوال، ملفات، بايتات)"
  - "راحة في تحرير وتشغيل السكربتات في الطرفية"
learningObjectives:
  - "تشفير رسالة وفك تشفيرها بمفتاح متماثل"
  - "اشتقاق مفتاح قوي من كلمة مرور عبر PBKDF2 وملح عشوائي"
  - "تشفير وفك تشفير ملفات على القرص، مع إثبات سلامة الدارة"
  - "تشفير مفتاح جلسة مشترك بأزواج RSA العامة/الخاصة"
  - "توقيع رسالة والتحقق منها مقابل نسخة مُعبثة"
---

# 🔐 ابنِ حزمة أدوات تشفير

"ملف تخزين المفاتيح (keystore). ابنه." ، طلب فريق حقيقي هذا بالضبط: ملف Python يقفل أسرار الخدمات عند السكون. يبني هذا المشروع تلك الحزمة من الأساس: رسالة نصية واحدة → نص مشفر، وكلمة مرور تُحوَّل إلى مفتاح حقيقي، وملف يجتاز التشفير دون تغيّر بايت واحد، وRSA يقفل مفتاح جلسة حتى يتمكن طرفان من مشاركة سر متماثل دون مشاركة السر نفسه، وتوقيع يثبت أن الرسالة غير معدَّلة وأن من أرسلها يملك مفتاحًا خاصًا. بحلول النهاية ستمسك بالبدائيات الخمس التي تشحنها كل مكتبة أمان، مستخدمةً بشكل صحيح.

هذا يفترض إنهاء Python 101 ، قوائم، وقواميس، ودوال، وملفات ، مع راحة في التعامل مع البايتات و`with open(...)`. الاعتماد الوحيد هو `cryptography`، مكتبة أمان من الطرف الأول (تستخدمها pip وTLS وأدوات GitHub) لا تتنازل عن شيء لمكتبة `openssl` لأغراض التعلم ، التشفير المُصادَق، واشتقاق المفاتيح، وRSA كلها في مكتبة واحدة.

## 🎯 ما ستفعله

1. تولّد مفتاح Fernet وتمرِّر رسالة ذهابًا وإيابًا، نصًا مشفرًا وعودة.
2. تشتق مفتاحًا حتميًا من كلمة مرور عبر PBKDF2 + ملح عشوائي ، وترى كلمة المرور الخاطئة تنتج هراءً لا يمكنه فك القفل.
3. تشفّر ملفًا إلى `.enc` وتعيده بايتًا مقابل بايت.
4. تلفّ مفتاح جلسة Fermet بـ RSA بحيث يفتحه المفتاح العام للمستلم، لكن مفتاحه الخاص وحده يقرؤه أبدًا.
5. توقّع رسالة بمفتاحك الخاص وتتحقق من نسخة سليمة وأخرى مُعبثة.

## أين تُشغّل هذا

**محليًا باستخدام `uv`** هو المسار الموصى به ، اشتقاق المفاتيح وتشفير الملفات أدوات CLI محلية، و`uv` يدير اعتماد `cryptography` بدقة.

**GitHub Codespaces** بديل بلا إعداد: افتح [مستودع الدورة كاملًا في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython مثبّتان بالفعل) وشغّل الأوامر نفسها من طرفية في المتصفح.

**Google Colab أو Kaggle Notebooks أو Binder** تعمل ، الدفتر في [`examples/encryption-toolkit/notebook.ar.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/encryption-toolkit/notebook.ar.ipynb) يثبّت `cryptography` مسبقًا ويشغّل كل خطوة في الذاكرة.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/encryption-toolkit/notebook.ar.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/encryption-toolkit/notebook.ar.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fencryption-toolkit%2Fnotebook.ar.ipynb)

## الإعداد

`uv` أداة واحدة تحل محل "ثبّت Python، ثم pip، ثم أداة بيئة افتراضية" ، والاعتماد الخارجي الوحيد، `cryptography`، يُثبَّت في ثوانٍ.

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

ثم أعدّ المشروع مع حزمة cryptography:

```bash
uv init encryption-toolkit
cd encryption-toolkit
uv add cryptography
```

**✅ قائمة التحقق**

- ✅ يطبع `uv --version` رقم إصدار.
- ✅ ينتهي `uv add cryptography` بعبارة "Prepared ... cryptography" في السجل.
- ✅ ينجح `uv run python -c "from cryptography.fernet import Fernet"`.

## الخطوة 1: دارة متماثلة بمفتاح Fernet

التشفير باب: *المفتاح* يفتحه، و*النص المشفر* هو ما يخفيه الباب. Fernet هي "الإعداد الحكيم الافتراضي" في `cryptography` ، AES-128-CBC مع MAC، مشفرة بـ base64، كائن واحد تفعل `encrypt` و`decrypt` فيه المهمة كلها. ثابت الدارة ، `decrypt(encrypt(x)) == x` ، هو الخاصية التي يتّكئ عليها كل ما يأتي لاحقًا، لذا أول عرض تجريبي يثبتها.

### 1.1 جرّب Fernet على قدراتها

**👟 تلميح البداية :** `Fernet.generate_key()` يصنع مفتاحًا جديدًا؛ وكائن `Fernet(key)` نفسه يشفّر ويفك تشفيرًا معًا:

```python
# symmetric.py
from cryptography.fernet import Fernet

key = Fernet.generate_key()
print("key:", key.decode())

fernet = Fernet(key)
message = b"top secret: launch at midnight"
token = fernet.encrypt(message)
print("token:", token.decode())

plain = fernet.decrypt(token)
print("round-trip ok:", plain == message)
print("key bytes:", len(key))
print("token bytes:", len(token))
```

شغّله:

```bash
uv run symmetric.py
```

`key` و`token` نصا base64 آمنان لعناوين URL يمكنك وضعهما في إعداد YAML أو سطر سجل ، يبدوان *مرتبَين* وهما بالضبط كذلك من الشذوذ: `key` هو الـ 32 بايتًا العشوائية التي يحتاجها Fernet، و`token` نص مشفر مع MAC وطابع زمني، ولا يشبه أيٌّ منهما الرسالة بأي شكل بشري. `decrypt` تتحقق أيضًا من السلامة: الرمز المُحوَّر يرفع `InvalidToken` بدلًا من إرجاع هراء ، MAC يجعل كشف التزوير مجانيًا مع كل قراءة.

**🎯 الناتج المتوقع :** (بايتات `key`/`token` تختلف على جهازك ، عشوائية جديدة كل تشغيل)

```
key: mlELRCZYDLnXiLKv6S3s0stB92jE_qVhxx6-R3AycKk=
token: gAAAAABqndOYC911dXqRml78PYZngKgnwQTQbqes0eTFGn7fd7H7ZbVrplSQ406cDYBvxK2D6yG64eKtpOy5Cni5n5i2C1bgjWzSdpCrM9vC9c_W7A7WfN4=
round-trip ok: True
key bytes: 44
token bytes: 120
```

**🩹 إذا لم يعمل :** إذا كانت `round-trip ok: False`، فأحد العمليتين لا تستخدم المفتاح نفسه ، تحقق من عدم وجود `Fernet(...)` ثانٍ يبني مفتاحًا جديدًا. إذا رفعت `decrypt` خطأ `InvalidToken`، فالـ `token` كُتب بعد `encrypt` (تحرير الصورة يسوّي `=` الأخيرة فيكسر base64)، أو فككت رمزًا من *تشغيل* سابق بمفتاح *جديد* ، الباب يحتاج المفتاح نفسه الذي أغلقه.

### 1.2 تحقّق من الدارة

**✅ قائمة التحقق**

- ✅ `key` طوله 44 حرفًا (32 بايتًا، base64) و`token` 120 حرفًا لرسالة من 25 بايتًا.
- ✅ `plain == message` ، يعيد فك التشفير البايتات الأصلية بالضبط.
- ✅ إفساد حرف واحد من `token` (غيّر `A` إلى `B`) يجعل `decrypt` ترفع `InvalidToken`، لا أن تعيد نصًا خاطئًا.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- المفتاح مخزَّن ، أين؟ إذا كتب هذا السكربت `key` إلى ملف بجوار النص المشفر، فالقفل زخرفي: مهاجم يقرأ الاثنين. ما قاعدة التخزين الأدنى التي تجعل المفتاح سرًّا فعلًا (ملف منفصل، متغير بيئة، مدير أسرار)؟
- Fernet تشفير *مُصادَق*: فك تشفير رمز مُعبث يَفشل بصوت عالٍ. لماذا يهم هذا السلوك الواحد لـ"ملفات الإعدادات عند السكون" أكثر مما يهم في عرض تجريبي ، وما الخلل البديل الصامت الذي يمنعه؟

## الخطوة 2: اشتق مفتاحًا من كلمة مرور

لا أحد يتذكر 32 بايتًا عشوائيًا؛ الجميع يتذكر كلمة مرور. PBKDF2 يمطّ كلمة المرور الضعيفة إلى مفتاح قوي ، *و* إلى تجزئة، لذا `"correct-horse-battery-staple"` + نفس الملح يعطي دائمًا نفس مفتاح الـ 32 بايت، بينما `"correct-horse-battery-staple"` + ملح مختلف يعطي شيئًا غير مرتبط. الملح هو أداة التذكر: مخزَّن بجوار التجزئة، وليس سرًّا أبدًا، ويقيّد كل اشتقاق بمفاتيح هذا المستخدم الواحد.

### 2.1 اشتق بـ PBKDF2

**👟 تلميح البداية :** `PBKDF2HMAC(hashes.SHA256(), length=32, salt=..., iterations=600_000).derive(password)` ، نفس الملح، نفس الاشتقاق، نفس المفتاح:

```python
# keys.py
import os
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

def derive_key(password: bytes, salt: bytes, length: int = 32) -> bytes:
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=length,
                     salt=salt, iterations=600_000)
    return kdf.derive(password)

password = b"correct-horse-battery-staple"
salt = os.urandom(16)

key1 = derive_key(password, salt)
key2 = derive_key(password, salt)
key_wrong = derive_key(b"wrong-password", salt)

print("same password + salt -> same key:", key1 == key2)
print("wrong password -> different key:", key1 != key_wrong)
print("key bytes:", len(key1))
print("salt bytes:", len(salt))
```

شغّله:

```bash
uv run keys.py
```

الدالة متعمَّدة فيما تحذفه: تأخذ *كلمة مرور* و*ملحًا* وتُرجع بايتات `length` بالضبط ، لا استمرار، ولا كتابة ملفات، فيقرر المُستدعي ما يخزنه. `iterations=600_000` في PBKDF2 هي "مطبخ السرعة": كل اشتقاق ينجز 600 ألف جولة من HMAC-SHA256، لذا فك كلمة مرور بالقوة الغاشمة يكلف المهاجم ستمائة ألف ضعف ما يكلفك إياه. أملاح `os.urandom(16)` لا تتكرر عمليًا، فتُبطل جداول قوس قزح ، وثمن تكرار الملح هو انهيار كل مفتاح مشتق إلى مفتاح واحد.

**🎯 الناتج المتوقع :**

```
same password + salt -> same key: True
wrong password -> different key: True
key bytes: 32
salt bytes: 16
```

**🩹 إذا لم يعمل :** إذا كانت `same password + salt -> same key: False`، فقد التقط استدعاء `derive` نسخة من `salt` تغيّرت بين الاستدعاءين (`os.urandom` داخل الدالة سيسبب هذا أيضًا ، يجب أن يكون الملح قيمة تمرَّر). إذا كانت `iterations` ناقصة، فمرحبًا بك في عالم إنذارات المفاتيح الضعيفة: العرض التجريبي ما زال ينجح، لكن تكلفة كسر المفتاح بالقوة الغاشمة انخفضت ست مرات من حيث الحجم.

### 2.2 تحقّق من الاشتقاق

**✅ قائمة التحقق**

- ✅ نفس زوج `(password, salt)` يعطي مفاتيح متطابقة بايتًا في استدعاءين منفصلين.
- ✅ كلمة مرور خاطئة في كلمة واحدة تعطي مفتاحًا مختلفًا بـ 32 بايتًا حتى مع نفس الملح.
- ✅ ملح `os.urandom(16)` جديد مع نفس كلمة المرور يكسر المفتاح الأقدم ، الأملاح تُقيّد المفاتيح.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- الملح *ليس* سرًّا، ومع ذلك إسقاطه يُضعف النظام. ما الذي يحمي منه الملح بالضبط ، ولماذا إعادة استخدام ملح واحد عبر كل المستخدمين هي مكافئ حشو الاعتمادات؟
- `600_000` تكرار رقم من معيار رياضي، لا قانون. ما الذي يدفعه للأعلى على خادم حقيقي (مكاسب وحدات المعالجة، منصات تكسير GPU)، وما تكلفة اختيار قيمة أعلى مما يلزم (كل إقلاع تطبيق، كل تسجيل دخول)؟

## الخطوة 3: شفِّر الملفات وفكِّ تشفيرها

الآن تتحول الحزمة إلى العملية: تشفّر `secret.txt` إلى `secret.txt.enc`، ثم تعيده إلى `restored.txt`. الدارة هي *العقد كله* ، نص عادي داخَل، ونص مشفر على القرص، ونص عادي بايتًا مقابل بايت خارجَ ، والمكسب "النص المشفر يخفي النص العادي" هو الشيء الذي يفتح متشكك ملف `.enc` ليتحقق منه.

### 3.1 اكتب مُشفِّر الملفات

**👟 تلميح البداية :** دوال الخدمة تأخذ `src/dst/key` وتُرجع الأحجام؛ والعرض التجريبي يقودها بنص عادي من 32 بايتًا ومفتاح Fernet:

```python
# encrypt_file.py
from cryptography.fernet import Fernet

def encrypt_file(src, dst, key):
    fernet = Fernet(key)
    with open(src, "rb") as f:
        ciphertext = fernet.encrypt(f.read())
    with open(dst, "wb") as f:
        f.write(ciphertext)
    return len(ciphertext)

def decrypt_file(src, dst, key):
    fernet = Fernet(key)
    with open(src, "rb") as f:
        plaintext = fernet.decrypt(f.read())
    with open(dst, "wb") as f:
        f.write(plaintext)
    return len(plaintext)

if __name__ == "__main__":
    from pathlib import Path
    key = Fernet.generate_key()

    Path("secret.txt").write_bytes(b"meeting moved to the labs at 9pm")
    before = Path("secret.txt").read_bytes()

    size_enc = encrypt_file("secret.txt", "secret.txt.enc", key)
    restored = decrypt_file("secret.txt.enc", "restored.txt", key)

    print(f"plaintext size:  {len(before):4d} bytes")
    print(f"ciphertext size: {size_enc:4d} bytes")
    print(f"restored matches: {Path('restored.txt').read_bytes() == before}")
    print(f"ciphertext hides plaintext: {b'labs' not in Path('secret.txt.enc').read_bytes()}")
```

شغّله:

```bash
uv run encrypt_file.py
```

دالتان متطابقتان كصورة معكوسة (تشفير يقرأ نصًا ويكتب نصًا مشفرًا؛ وفك تشفير يقرأ نصًا مشفرًا ويكتب نصًا) تجعلان خط الأنابيب يُقرأ من اليسار إلى اليمين قبل تشغيله حتى. `Path.write_bytes`/`read_bytes` تخفيان الإطارات النمطية لـ `with` وتحافظان على تماسك العرض التجريبي؛ والملفات الحقيقية تعيش على القرص، لذا *يمكنك* تنفيذ `cat secret.txt.enc` بعد ذلك وتأكيد عدم بقاء أي شيء قابل للقراءة. النص المشفر 140 بايتًا مقابل 32 نصًا عاديًا ، MAC الخاص بـ Fernet مع كتلة الإصدار ، الضريبة التي تدفعها للتشفير المُصادَق، وهي تستحق كل قرش.

**🎯 الناتج المتوقع :**

```
plaintext size:   32 bytes
ciphertext size:  140 bytes
restored matches: True
ciphertext hides plaintext: True
```

**🩹 إذا لم يعمل :** إذا كانت `restored matches: False`، فـ `src` في فك التشفير أشار إلى *الملف الأصلي* (بلا `.enc`) أو اختلف المفتاح بين الاستدعاءين ، فك شفرة النص المشفر بالمفتاح نفسه الذي أنتجه. إذا عادت الأحجام `0`، فالسكربت كتب بايتات إلى `secret.txt.enc` عبر `open(dst, "w")` (وضع نص) ، التشفير يحتاج `"wb"`/`"rb"`، الوضع الثنائي في الاتجاهين.

### 3.2 تحقّق من دارة الملف

**✅ قائمة التحقق**

- ✅ يوجد `secret.txt.enc`، وهو أكبر من المصدر بـ 108 بايتات، و`cat` يُظهر هراء base64 فقط.
- ✅ `restored.txt` مطابق بـ بايتات لـ `secret.txt` (فحص `==`، لا فحص عين).
- ✅ حذف `restored.txt` وإعادة تشغيل `decrypt_file` فقط يعيد إنتاجه ، قراءات قابلة للتكرار.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- `encrypt_file` تضغط الملف كله في رمز Fernet واحد ، أمر جيد لملاحظة من 32 بايتًا. لنسخة احتياطية من 2 جيجابايت، رمز واحد يعني فشل MAC واحد يُهلك الملف كله بعد عدم فك تشفير شيء. ما الشكل التشغيلي لمشفّر *متدفق (streaming)*، ولماذا قد يختار أداة حقيقية الملف كله مع ذلك لحمولات بحجم ملفات إعدادات؟
- امتداد `.enc` وتسمية "النص مشفر" اتفاقية، لا ضمانة. أين في هذه الحزمة ستُثبت (لا توحي) أن شريكًا يفك التشفير يملك المفتاح الصحيح ، قبل أن يثق بايتات "المستعادة"؟

## الخطوة 4: لُفَّ مفتاح جلسة بـ RSA (تشفير هجين)

RSA يشفّر على الأكثر ~245 بايتًا من مفتاح بـ 2048 بت ، عديم الفائدة لملف من 2 جيجابايت، ومثالي لمفتاح *الجلسة* الذي يستخدمه ملفك مع Fernet. هذا هو التشفير الهجين، البنية وراء TLS: شفِّر الحمولة بمفتاح متماثل سريع، ولُفَّ المفتاح المتماثل الصغير بـ RSA البطيء القابل للمشاركة، وانقل المفتاح الملفوف فقط. المفتاح *العام* للمستلم يشفّر؛ ومفتاحه *الخاص* فقط يفك التشفير.

### 4.1 شفِّر حمولة ولُفَّ المفتاح

**👟 تلميح البداية :** ولّد زوج RSA، وشفِّر الرسالة بمفتاح Fernet جديد، ثم `public_key.encrypt(session_key, padding.OAEP(...))` ، وفكّ اللفّ في الجهة الخاصة:

```python
# hybrid.py
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes

private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
public_key = private_key.public_key()
print("RSA key size (bits):", private_key.key_size)

message = b"launch at midnight; team Tango is clear to deploy"
session_key = Fernet.generate_key()
fernet = Fernet(session_key)

ciphertext = fernet.encrypt(message)

wrapped = public_key.encrypt(
    session_key,
    padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()),
                 algorithm=hashes.SHA256(), label=None),
)
print("wrapped key length (bytes):", len(wrapped))

unwrapped = private_key.decrypt(
    wrapped,
    padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()),
                 algorithm=hashes.SHA256(), label=None),
)
print("hybrid round-trip ok:", Fernet(unwrapped).decrypt(ciphertext) == message)
```

شغّله:

```bash
uv run hybrid.py
```

كل جانب من جوانب التسليم يقوم بمهمة واحدة بالضبط: `public_key.encrypt` يلفّ *المفتاح* (RSA بـ 2048 بت، لذا مفتاح الجلسة ~32 بايتًا يَسَع مع حشوة OAEP ، لهذا يكون الطول الملفوف 256، حجم معامل RSA). *الحمولة* تبقى على Fernet، ولهذا لا يلمس نص الرسالة RSA أبدًا. فك التشفير يعني إعادة بناء مفتاح الجلسة أولًا ، `unwrapped` يغذي مباشرة `Fernet(...)` وتُغلق الدارة. لا توجد طريقة لقراءة الرسالة بالمفتاح الخاص وحده أو بمفتاح الجلسة وحده؛ التشفير عملية "و" (AND)، وهذا الكود يجعل ذلك مرئيًا.

**🎯 الناتج المتوقع :**

```
RSA key size (bits): 2048
wrapped key length (bytes): 256
hybrid round-trip ok: True
```

**🩹 إذا لم يعمل :** إذا رفعت `public_key.encrypt` خطأ `ValueError: too large`، فقد تجاوز `session_key` سعة OAEP البالغة ~245 بايتًا ، هذا متوقع للحمولات الحقيقية ولهذا بالتحديد يكون المخطط هجينًا (Fernet تحمل الرسالة، وRSA المفتاح فقط). إذا فشل فك التشفير بحشوة بذات المظهر، فمزيج `MGF1`/`algorithm` في أحد الجانبين مختلف ، يجب أن تتطابق معاملات الحشوة في التشفير وفك التشفير بدقة.

### 4.2 تحقّق من التسليم الهجين

**✅ قائمة التحقق**

- ✅ المفتاح الملفوف 256 بايتًا (معامل RSA) بغض النظر عن طول الرسالة ، RSA يحمل المفتاح، وFernet تحمل الرسالة.
- ✅ حمولة حتى ~16 كيلوبايت تمر؛ وRSA لا يرى الحمولة أبدًا.
- ✅ محاكاة "المستلم" ، إبقاء `session_key` سرًّا مشتركًا بين المُشفِّر وفكّ اللفّ فقط ، تُنتج `True` فقط عندما يستخدمه النصفان معًا.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- العرض التجريبي يولّد زوج RSA *و* مفتاح الجلسة في سكربت واحد ، لاعب واحد يرتدي قبعتَين. في تسليم حقيقي، من يملك `private_key`، ومن يشحن `wrapped` (وكيف)، وما الذي لا يراه *المستلم* أبدًا (مفتاح الجلسة نفسه)؟
- حشوة OAEP تبدو إلزامية وسهلة النسخ. ما الفشل عندما يستبدل شريك Java/TLS حشوة OAEP بـ `PKCS1v15` ، ولماذا يكسر "إنها نفس RSA" العقد بصمت؟

## الخطوة 5: وقِّع وتحقق ، أثبت أنها لك، غير معدَّلة

التشفير يثبت السرية؛ والتوقيعات تثبت *الهوية والسلامة*: "من كتب هذا، وهل تغيّر في الطريق؟" التوقيع يستخدم مفتاحك الخاص فوق تجزئة الرسالة؛ والتحقق يستخدم مفتاحك العام و*يفشل بصوت عالٍ* إذا اختلف بايت واحد من الرسالة. مفتاحان، اتجاهان، خاصية واحدة لكل منهما.

### 5.1 وقِّع ملاحظة إصدار واقبض على العبث

**👟 تلميح البداية :** `private_key.sign(message, padding.PSS(...), hashes.SHA256())`، ثم استدعاءا `public_key.verify` ، الأول للبايتات السليمة، والثاني لطابع زمني أحدث بثانية واحدة:

```python
# signverify.py
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes

message = b"release v2.4 to production at 18:00 UTC"

private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
public_key = private_key.public_key()

signature = private_key.sign(
    message,
    padding.PSS(mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH),
    hashes.SHA256(),
)
print("signature length (bytes):", len(signature))

def verify(m: bytes) -> bool:
    try:
        public_key.verify(
            signature, m,
            padding.PSS(mgf=padding.MGF1(hashes.SHA256()),
                        salt_length=padding.PSS.MAX_LENGTH),
            hashes.SHA256(),
        )
        return True
    except Exception:
        return False

print("verify(original):", verify(message))
print("verify(tampered):", verify(b"release v2.4 to production at 18:01 UTC"))
```

شغّله:

```bash
uv run signverify.py
```

المساعد `verify` يلفّ `public_key.verify` الرافعة ، اتفاقية `cryptography` هي *عدم رفع شيء* عند النجاح و`InvalidSignature` عند الفشل، لذا الإمساك يحوّلها إلى قيمة منطقية. `hashes.SHA256()` يؤدي مهمة مزدوجة: PSS يملّح التجزئة والتوقيع يغطي الملخص فقط، لذا توقيع ملف من 2 جيجابايت يكلف نفس تكلفة توقيع هذه الملاحظة من 45 بايتًا. درس العرض التجريبي في السطر الثاني: تغيّر الطابع الزمني بدقيقة واحدة، بقي التوقيع مرتاحًا دون تغيير، والتحقق يقول **لا** ، لأن التحقق دائمًا يكون مقابل *البايتات الفعلية أمامك*، لا الرسالة التي ادعى أحدٌ أنه أرسلها.

**🎯 الناتج المتوقع :**

```
signature length (bytes): 256
verify(original): True
verify(tampered): False (raised InvalidSignature)
```

**🩹 إذا لم يعمل :** إذا كانت `verify(original): False`، فـ `signature` بُني من كائن `message` *مختلف* (سطر جديد زائد أو تغيير حالة أحرف) ، التوقيع والتحقق يجب أن يجزّآ البايتات المتطابقة تمامًا. إذا أعادت `verify(tampered)` أيضًا `True`، فالدالة التي عدّلتها ليست المُختبَرة (نسخة `bytes(...)` مقابل الحرفية)، أو `verify` يبتلع الاستثناء ويُرجع `True` عند `except`.

### 5.2 تحقّق من منطق التوقيع

**✅ قائمة التحقق**

- ✅ رسالة لم تُمس تتحقق بـ `True`؛ وفرق بايت واحد يتحقق بـ `False`.
- ✅ مفاتيح مختلفة → `False`: مفتاح التوقيع ومفتاح التحقق يجب أن يكونا الزوج المطابق.
- ✅ التوقيع 256 بايتًا لأي حجم رسالة (RSA بـ 2048 بت يجزّئ ملخص الرسالة، لا الرسالة).

**🤔 سؤال (أسئلة) سقراطي(ة)**

- التوقيع يستخدم المفتاح *الخاص* والتحقق *العام* ، صورة معكوسة لتشفير RSA. لماذا يجعل هذا التبديل مثاليًّا لعبارة "أنشر مفتاحي، يفحص الجميع إصداراتي"، ويجعل رفع ملفات مشفرة إلى خادم نفس الرياضيات بالاتجاهات المقلوبة؟
- التوقيع يثبت أن البايتات غير معدَّلة *لمن يملك المفتاح العام*. ما الفشل البشري الواحد (نشر مفتاح خاص إلى مستودع، نشر المفتاح العام الخطأ) الذي يجعل المخطط كله مسرحًا ، وما قاعدة "إذًا افعل هذا بدلًا منه"؟

## ⚠️ مآزق شائعة

- **إعادة استخدام مفتاح واحد لكل شيء.** مفاتيح Fernet رخيصة؛ والأملاح مجانية. إعادة اشتقاق مفتاح بملح قديم، أو مشاركة نفس ملف المفتاح عبر أجهزة، طريقةٌ يتسرّب بها ملف مخترَق إلى كل ما سواه.
- **تخزين المفتاح فعلًا.** ملف `.enc` بجوار `key.txt` في المجلد نفسه مسرح تشفير. المفتاح ينتمي خارج شجرة النص المشفر ، وحدة تخزين منفصلة، أو متغير بيئة، أو مدير أسرار.
- **الوضع الثنائي أو لا شيء.** `open(dst, "w")` يفسد البايتات المشفرة عبر ترجمة أسطر جديدة وافتراضات UTF-8. إنها `"wb"` و`"rb"`، دائمًا.
- **تبديل الحشوات بصمت.** OAEP وPKCS1v15 يبدوان قابلَين للاستبدال وهما ليسا كذلك. حشوة أو تجزئة غير متطابقة بين التشفير وفك التشفير (أو التوقيع والتحقق) تفشل في أسوأ لحظة: في الإنتاج، مقابل تنفيذ شريك.
- **توقيع السرد، لا البايتات.** "الرسالة التي أرسلتها" مقابل `message` في الذاكرة كائنان مختلفان. وقِّع البايتات المنقولة فعليًا وتحقق منها، وإلا فأنت تتحقق من سلسلة بايتات تغيّرت قبل دقيقتين.

## ما بنيته للتو

خمس بدائيات، كل واحدة أداة تشفير كاملة عاملة: دارة Fernet متماثلة، واشتقاق كلمة مرور→مفتاح مع ملح، وتشفير ملفات يعيد بايتًا لبايت، وتسليم مفتاح جلسة ملفوف بـ RSA، وتوقيع بمفتاح خاص مع فشل صاخب عند العبث. الخيط الداخلي هو البنية لا الرياضيات: صادِق على نصك المشفر، وملِّح كل اشتقاق، ولا تخزّن مفتاحًا بجوار ما يُقفله، ولُفَّ مادة المفتاح الصغيرة في RSA بينما تحمل Fernet الحمولات، وتحقق دائمًا من البايتات أمامك.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/encryption-toolkit/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/encryption-toolkit) في مستودع الدورة يحتوي السكربتات الكاملة (متماثل، ومفاتيح، ودارة ملف، وهجين، وتوقيع/تحقق) معًا. أو افتح المستودع كاملًا في [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## إلى أين تذهب من هنا

- التسليم الهجين مخزن مفاتيح بسيط: ولّد `key.json` لكل بيئة، واحتفظ بمفتاح RSA الخاص منفصلًا، وفك تشفير إعداد في لحظة إقلاع التطبيق. هذه نسخة إنتاجية v1 من 40 سطرًا للملف الذي طلبته الفريق.
- أضف **استمرار PEM** لزوج الخطوة 4: `private_bytes(PublishingFormat.PKCS8, NoEncryption())` و`public_bytes(...)` إلى `private.pem`/`public.pem`، ثم أعد تحميلهما بـ `load_pem_private_key` ، الجسر من عرض في الذاكرة إلى ملفات على القرص.
- **دوّر مخزن المفاتيح**: أعد تشفير `secret.txt` بمفتاح Fernet جديد وملح جديد، واحتفظ بـ `.enc` القديم حتى يصبح كل قارئ على المفتاح الجديد، وسجّل التدوير. التدوير هو العملية التي يمارسها أمان الإنتاج فعلًا يوميًا.
- لخزنة آمنة حقًا، اطلب كلمة المرور *في وقت التشغيل* (لا تضعها في الكود أبدًا) وغذِّ `derive_key` في دوال ملفات الخطوة 3 ، فالنصفان يلتقيان أخيرًا.

## شارك مشروعك مع الصف

بنيت شيئًا فخورًا به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع طلاب آخرين قدَّموها ، وملف README الخاص به يحتوي شرحًا كاملًا وودودًا للمبتدئين لإضافة مشروعك عبر **pull request**، حتى لو لم تستخدم git من قبل قط: عمل fork للمستودع، وإنشاء فرع، وتثبيت ملفاتك، وفتح الـ PR، خطوة بخطوة. لا يُفترَض أي خبرة سابقة بـ git.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓