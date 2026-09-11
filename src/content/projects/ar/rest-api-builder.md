---
title: "منشئ واجهة برمجة REST"
description: "إنشاء واجهات برمجة REST جاهزة للإنتاج من مخطط YAML مع التوثيق والتحقق والمصادقة."
difficulty: "advanced"
estimatedMinutes: 120
tags: ["fastapi", "pydantic", "rest-api", "jwt", "openapi"]
learningObjectives:
  - "تحليل مخططات YAML وبناء dataclasses بايثون منها"
  - "توليد مسارات FastAPI ديناميكيًّا من تعاريف الموارد"
  - "تنفيذ مصادقة JWT مع التحكم بالوصول القائم على الأدوار"
  - "اختبار نقاط نهاية API بـhttpx وTestClient الخاص بـFastAPI"
prerequisites: ["أساسيات Python وOOP المتوسط", "ألفة بطرق HTTP ومفاهيم REST", "فهم صيغتي JSON وYAML"]
---

# 🛠️ 🚀 منشئ واجهة برمجة REST

معظم واجهات البرمجة الواقعية تتبع النمط نفسه: موارد مع نقاط CRUD، ومصادقة، وتحقق، ووثائق. كتابة كل واحدة يدويًّا سرعان ما تصبح مملة — يبني هذا المشروع مولد كود يقرأ مخطط YAML وينتج تطبيق FastAPI كاملًا بمصادقة JWT وتحقق Pydantic ووثائق OpenAPI مولدة تلقائيًّا، فتعرّف واجهتك مرة واحدة في YAML وتحصل على خادم يعمل.

يفترض هذا أساسيات Python وOOP متوسطًا ودراية HTTP كافية لمعرفة ما يفعله طلب POST — لا شيء من تحليل البيانات مطلوب. إنه اختياري وغير مصنّف؛ راجع [المشاريع الواقعية](/ar/مشاريع) للقائمة الكاملة والمتنامية.

## 🎯 ما ستفعله

1. عرّف موارد API في مخطط YAML وحللها إلى dataclasses بايثون.
2. ولّد نماذج Pydantic من المخطط للتحقق التلقائي من الطلبات.
3. نفّذ مصادقة JWT بـ`python-jose` و`passlib`.
4. ابنِ مسارات CRUD ديناميكيًّا مع فحوص أذونات قائمة على الأدوار.
5. اختبر واجهة API كاملة من طرف إلى طرف بـ`httpx` و`TestClient` الخاص بـFastAPI.

## أين تُشغّل هذا

**محليًا مع `uv`** هو المسار العملي الوحيد — يحتاج FastAPI إلى خادم حقيقي (uvicorn) ليعمل، ما يعني طرفية حقيقية ونظام ملفات حقيقيًا. لا يمكن لأي ملعب قائم على المتصفح استضافة خادم ASGI يعمل.

**يعمل GitHub Codespaces جيدًا:** افتح [مستودع المساق كاملًا في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node وPython و`uv` مثبتة بالفعل) وشغّل أوامر `uv` نفسها من طرفية.

**يمكن لـGoogle Colab اختبار نقاط نهاية فردية بـ`nest_asyncio`، لكنه عمل حلّ، لا ملاءمة طبيعية — لا خادم ثابت، ولا نظام ملفات حقيقي لمشروعك. استخدمه للتجربة لا للبناء.**

- **شغّله في المتصفح.** هناك دفتر ملاحظات تفاعلي جاهز — افتحه على Colab أو Kaggle أو Binder وتابع خطوة بخطوة.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/rest-api-builder/notebook.ar.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/rest-api-builder/notebook.ar.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Frest-api-builder%2Fnotebook.ar.ipynb)

## الإعداد

كل ما تحتاجه قبل كتابة سطر من واجهة البرمجة نفسها: Python حقيقيًا، والحزم الصحيحة، ومجلد مشروع يعمل.

### ثبّت `uv`

`uv` أداة واحدة تحل محل سلسلة "ثبّت Python، ثم ثبّت pip، ثم ثبّت أداة بيئة افتراضية، ثم ثبّت الحزم" المعتادة — يمكنها تثبيت نسخ Python وإدارتها بنفسها، جنبًا إلى جنب مع اعتماديات مشروعك.

**macOS / Linux** (الطرفية):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

أغلق وأعد فتح طرفيتك، ثم تأكد من التثبيت:

```bash
uv --version
```

### هيّئ المشروع

```bash
uv init rest-api-builder
cd rest-api-builder
uv add fastapi uvicorn pyyaml pydantic python-jose[cryptography] passlib[bcrypt] httpx
```

`fastapi` إطار الويب؛ و`uvicorn` خادم ASGI الذي يشغّله؛ و`pyyaml` يحلل مخططك؛ و`pydantic` يتولى تحقق الطلب/الاستجابة؛ و`python-jose` و`passlib` يتوليان رموز JWT وتجزئة كلمات المرور؛ و`httpx` عميل HTTP غير المتزامن الذي ستستخدمه لاختبار نقاط النهاية.

**✅ قائمة التحقق**

- ✅ يطبع `uv --version` رقم نسخة.
- ✅ `rest-api-builder/` موجود مع `pyproject.toml`، وكل الحزم الست مثبتة.
- ✅ يمكنك تشغيل `uv run python -c "import fastapi; print(fastapi.__version__)"` دون أخطاء.

## الخطوة 1: حلل مخطط YAML إلى dataclasses بايثون

تبدأ كل واجهة برمجة بشكل: ما الموارد الموجودة، وما الحقول التي يملكها كلٌّ منها، ومن يستطيع فعل ماذا بها. يلتقط مخطط YAML ذلك الشكل بصيغة مقروءة قابلة للتحرير البشري — وتحليله إلى dataclasses بايثون هو الجسر بين تكوين نصي صريح وكود فعلي يولّد المسارات.

### 1.1 عرّف المخطط وحلله

```python
import yaml
from dataclasses import dataclass, field

SCHEMA_YAML = """
resources:
  user:
    fields:
      name: { type: string, required: true }
      email: { type: string, required: true, unique: true }
      role: { type: string, enum: [admin, editor, viewer], default: viewer }
    permissions:
      create: [admin]
      read: [admin, editor, viewer]
      update: [admin, editor]
      delete: [admin]
  post:
    fields:
      title: { type: string, required: true }
      content: { type: string, required: true }
      author_id: { type: integer, required: true }
    permissions:
      create: [admin, editor]
      read: [admin, editor, viewer]
      update: [admin, editor]
      delete: [admin]
"""

@dataclass
class FieldDef:
    name: str
    field_type: str
    required: bool = False
    unique: bool = False
    default: object = None
    enum: list[str] | None = None

@dataclass
class ResourceDef:
    name: str
    fields: list[FieldDef] = field(default_factory=list)
    permissions: dict[str, list[str]] = field(default_factory=dict)

def parse_schema(yaml_str: str) -> dict[str, ResourceDef]:
    data = yaml.safe_load(yaml_str)
    resources = {}
    for res_name, res_config in data["resources"].items():
        fields = [
            FieldDef(
                name=fname,
                field_type=fdef["type"],
                required=fdef.get("required", False),
                unique=fdef.get("unique", False),
                default=fdef.get("default"),
                enum=fdef.get("enum"),
            )
            for fname, fdef in res_config.get("fields", {}).items()
        ]
        resources[res_name] = ResourceDef(
            name=res_name,
            fields=fields,
            permissions=res_config.get("permissions", {}),
        )
    return resources

resources = parse_schema(SCHEMA_YAML)
for name, res in resources.items():
    print(f"Resource: {name}")
    for f in res.fields:
        print(f"  - {f.name}: {f.field_type} (required={f.required})")
```

**👟 تلميح البداية :** الصق هذه الكتلة كما هي — تعرّف سلسلة `SCHEMA_YAML` موردين (`user` و`post`) بحقول وأنواع وقواعد أذونات. يحلل `yaml.safe_load` YAML إلى قاموس صريح، ويمنحك الـdataclasses (أن `FieldDef` و`ResourceDef`) وصولًا مكتوبًا لكل قطعة. تطبع الحلقة في الأسفل ما حُلل لتتحقق أنه يطابق YAML.

**🎯 الناتج المتوقع :**
```
Resource: user
  - name: string (required=True)
  - email: string (required=True)
  - role: string (required=False)
Resource: post
  - title: string (required=True)
  - content: string (required=True)
  - author_id: integer (required=True)
```

**🩹 إذا لم يعمل :** يعني `yaml.YAMLError` أن سلسلة YAML فيها مشكلة صياغة — تحقق من المسافات البادئة والنقطتين. يعني `KeyError: 'resources'` أن YAML حُمّل لكنه لا يملك مفتاح المستوى الأعلى الذي يتوقعه كودك — تحقق من وجود مفتاح `resources:` الخارجي. إذا كانت الحقول مفقودة، فالافتراضي `get("fields", {})` فارغ، لذا بنية YAML هي ما يهم.

### 1.2 تحقّق من تحليل المخطط

**✅ قائمة التحقق**

- ✅ يعيد `parse_schema(SCHEMA_YAML)` قاموسًا بمفتاحين: `"user"` و`"post"`.
- ✅ لكل `ResourceDef` العدد الصحيح من إدخالات `FieldDef` (3 لـuser، و3 لـpost).
- ✅ يرسل قاموس الأذونات كل إجراء (`"create"` و`"read"` وما إليه) إلى قائمة أدوار.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- ماذا يحدث إذا أضفت موردًا ثالثًا إلى YAML (لنقل `comment`) وأعدت تشغيل `parse_schema` — هل يحتاج أي كود خارج سلسلة YAML نفسها إلى التغيير؟ لماذا ذلك مرغوب؟
- يستخدم YAML `unique: true` على `email`. يخزن `FieldDef` هذا كقيمة منطقية، لكن لا شيء في الكود يفرض التفرد بعد. أين في خط أنابيب API تضيف ذلك الفحص، ولماذا الأفضل الإمساك به هناك لا على مستوى قاعدة البيانات؟

## الخطوة 2: ولّد نماذج Pydantic من المخطط

نماذج Pydantic هي ما يستخدمه FastAPI للتحقق من الطلبات والاستجابات الواردة والصادرة — تحول JSON الفضفاض إلى كائنات بايثون مكتوبة ومفحوصة. بناؤها ديناميكيًّا من مخططك يعني أن إضافة مورد جديد إلى YAML تولّد التحقق الصحيح تلقائيًّا دون لمس كود بايثون.

### 2.1 ابنِ مولد النماذج

```python
from pydantic import BaseModel

TYPE_MAP = {"string": str, "integer": int, "boolean": bool, "float": float}

def generate_pydantic_models(resources: dict[str, ResourceDef]) -> dict[str, type[BaseModel]]:
    models = {}
    for res_name, res in resources.items():
        fields = {}
        for f in res.fields:
            ftype = TYPE_MAP.get(f.field_type, str)
            if f.default is not None:
                fields[f.name] = (ftype, f.default)
            elif f.required:
                fields[f.name] = (ftype, ...)
            else:
                fields[f.name] = (ftype | None, None)
        models[res_name] = type(
            f"Create{res_name.title()}", (BaseModel,), {"__annotations__": fields}
        )
    return models

models = generate_pydantic_models(resources)
for name, model in models.items():
    print(f"{name}: {model.__name__} fields = {list(model.model_fields.keys())}")
```

**👟 تلميح البداية :** ينشئ استدعاء `type(...)` صنف نموذج Pydantic ديناميكيًّا — `type("CreateUser", (BaseModel,), {"__annotations__": {...}})` هو بالضبط ما يفعله `class CreateUser(BaseModel): ...`، لكن جسم الصنف يأتي من المخطط بدل كود مكتوب يدويًّا. تحصل الحقول المطلوبة على `...` (النقاط الثلاث) كافتراضي، وهو ما تتعامل معه Pydantic بأنه "هذا الحقل إلزامي."

**🎯 الناتج المتوقع :**
```
user: CreateUser fields = ['name', 'email', 'role']
post: CreatePost fields = ['title', 'content', 'author_id']
```

**🩹 إذا لم يعمل :** إذا كانت حقول `CreateUser` ناقصة، فربما سقط بحث `TYPE_MAP` بصمت إلى `str` لنوع غير معروف. تحقق من قيم `type:` في YAML مقارنة بالخريطة. إذا اشتكى FastAPI من التحقق لاحقًا، فتفرّع `(ftype, ...)` مقابل `(ftype | None, None)` هو الجزء الذي يجب فحصه — حقل مطلوب دون `...` يصبح اختياريًّا بالصدفة.

### 2.2 تحقّق من توليد النموذج

**✅ قائمة التحقق**

- ✅ يعيد `generate_pydantic_models(resources)` صنفي نموذج: `CreateUser` و`CreatePost`.
- ✅ لكل نموذج بالضبط الحقول المعرفة في مخطط YAML.
- ✅ ترفع الحقول المطلوبة `ValidationError` إذا حُذفت؛ والحقول الاختيارية تتراجع إلى `None`.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- ما الذي ينكسر إذا أضفت حقلًا بـ`type: datetime` إلى YAML؟ كيف توسّع `TYPE_MAP` للتعامل معه؟
- يتحقق `BaseModel` من Pydantic عند الاستنساخ. لماذا هذا أفضل من التحقق داخل كل معالج مسار، حيث ستدعو `model(**payload)` يدويًّا؟

## الخطوة 3: نفّذ مصادقة JWT

تفصل المصادقة بين "يمكن لأي أحد استخدام هذا" و"يمكن فقط للمستخدمين المسجلين استخدام هذا." رموز JWT هي المعيار لمصادقة API عديمة الحالة: يوقع الخادم رمزًا بمفتاح سري، ويعيده العميل في كل طلب، ويتحقق الخادم منه دون بحث في قاعدة بيانات.

### 3.1 هيّئ إنشاء الرمز والتحقق منه

```python
import secrets
from datetime import datetime, timedelta
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

SECRET_KEY = secrets.token_hex(32)
ALGORITHM = "HS256"
security = HTTPBearer()

def create_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=30)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(
    creds: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    try:
        return jwt.decode(creds.credentials, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(401, "Invalid token")

print(f"SECRET_KEY set (first 8 chars): {SECRET_KEY[:8]}...")
```

**👟 تلميح البداية :** يحزم `create_token` قاموسًا (اسم المستخدم، الدور) في JWT موقع بصلاحية 30 دقيقة. `verify_token` اعتمادية FastAPI — تعني `Depends(security)` أن FastAPI يقرأ ترويسة `Authorization: Bearer <token>` تلقائيًّا ويمرر الحمولة المفكوكة إلى أي مسار يعلن `user=Depends(verify_token)`.

**🎯 الناتج المتوقع :** يطبع `SECRET_KEY` أول 8 أحرف. إنشاء رمز وفك ترميزه فورًا يرجع ويخرج دون خطأ.

**🩹 إذا لم يعمل :** يعني `jose.JWTError` عند فك الترميز أن الرمز وُقع بمفتاح مختلف — يولّد `secrets.token_hex(32)` مفتاحًا جديدًا كل مرة يُحمَّل فيها الوحدة، لذا لن تُفك رموز تشغيل سابق. يعني `403` من FastAPI (لا `401`) أن ترويسة `Authorization` مفقودة تمامًا — العميل لا يرسل رمزًا أصلًا.

### 3.2 تحقّق من المصادقة

**✅ قائمة التحقق**

- ✅ يعيد `create_token({"sub": "alice", "role": "admin"})` سلسلة يمكن لـ`verify_token` فك ترميزها إلى نفس القاموس.
- ✅ رمز موقَّع بـ`SECRET_KEY` مختلف يثير `HTTPException(401)`.
- ✅ يمكنك شرح لماذا يُولَّد `secrets.token_hex(32)` عند تحميل الوحدة، لا داخل `create_token`.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تحمل رموز JWT صلاحيتها في الرمز نفسه (وصيغة `exp`). ماذا يحدث إذا انتهت صلاحية رمز مستخدم في منتصف الطلب؟ هل ذلك مشكلة، وكيف سيتعامل معها تطبيق حقيقي؟
- لا يخزن هذا المشروع كلمات مرور مستخدمين — يفحص `verify_token` توقيع الرمز، لا قاعدة بيانات. ما الذي ستحتاج إضافته إذا أردت دعم تسجيل الدخول القائم على كلمة المرور أيضًا؟

## الخطوة 4: ابنِ مسارات CRUD بالوصول القائم على الأدوار

جوهر API: توليد نقاط POST وGET وDELETE ديناميكيًّا لكل مورد في المخطط، مع فحوص أذونات تمنع مشاهِدًا من إنشاء منشورات أو غير-مسؤول من حذف مستخدمين.

### 4.1 أنشئ التطبيق ومسار تسجيل الدخول

```python
from fastapi import FastAPI

db: dict[str, list[dict]] = {"user": [], "post": []}
id_counter: dict[str, int] = {"user": 0, "post": 0}

app = FastAPI(title="Auto-Generated API", version="1.0.0")

@app.post("/login")
def login(username: str, password: str):
    if username == "admin" and password == "secret":
        return {"access_token": create_token({"sub": username, "role": "admin"})}
    raise HTTPException(401, "Invalid credentials")
```

**👟 تلميح البداية :** مسار تسجيل الدخول مقسّى لمستخدم واحد لأغراض العرض — في تطبيق حقيقي ستجزئ كلمات المرور بـ`passlib` وتتحقق من قاعدة بيانات. النقطة الأساسية: يعيد `/login` رمز JWT، يرسله كل طلب لاحق في ترويسة `Authorization`.

**🎯 الناتج المتوقع :** يعيد `POST /login?username=admin&password=secret` النتيجة `{"access_token": "eyJ..."}`.

**🩹 إذا لم يعمل :** إذا أعاد تسجيل الدخول `401` لبيانات اعتماد صحيحة، فتحقق من URL — `username` و`password` سمتا استعلام هنا، لا جسم JSON. إذا بدا الرمز مبتورًا، فإن `secrets.token_hex(32)` يولّد 64 حرفًا سداسيًّا؛ وسيكون JWT نفسه أطول بكثير (ترويسة + حمولة + توقيع).

### 4.2 ولّد مسارات CRUD من المخطط

```python
def generate_crud_routes(resource: ResourceDef) -> None:
    name = resource.name

    @app.post(f"/{name}", status_code=201)
    def create_item(payload: dict, user=Depends(verify_token)):
        if user["role"] not in resource.permissions.get("create", []):
            raise HTTPException(403, "Insufficient permissions")
        id_counter[name] += 1
        item = {"id": id_counter[name], **payload}
        db[name].append(item)
        return item

    @app.get(f"/{name}")
    def list_items(user=Depends(verify_token)):
        return db[name]

    @app.get(f"/{name}/{{item_id}}")
    def get_item(item_id: int, user=Depends(verify_token)):
        for item in db[name]:
            if item["id"] == item_id:
                return item
        raise HTTPException(404, f"{name.title()} not found")

    @app.delete(f"/{name}/{{item_id}}")
    def delete_item(item_id: int, user=Depends(verify_token)):
        if user["role"] not in resource.permissions.get("delete", []):
            raise HTTPException(403, "Insufficient permissions")
        for i, item in enumerate(db[name]):
            if item["id"] == item_id:
                db[name].pop(i)
                return {"deleted": True}
        raise HTTPException(404, f"{name.title()} not found")

for res in resources.values():
    generate_crud_routes(res)
```

**👟 تلميح البداية :** `generate_crud_routes` دالة *تعرف وتسجّل* مسارات FastAPI — يُستدعى `@app.post(f"/{name}")` داخل الدالة، لا في المستوى الأعلى. هذا هو الجزء الديناميكي: حلقة واحدة فوق `resources.values()` تنشئ كل مسارات POST/GET/DELETE لكليهما `user` و`post`. يعلن كل مسار `user=Depends(verify_token)` فيشغّل FastAPI فحص المصادقة قبل تنفيذ جسم المسار.

**🎯 الناتج المتوقع :** ينشئ `POST /user` مستخدمًا (برمز)، ويسرد `GET /user` كل المستخدمين، ويحذف `DELETE /user/1` المستخدم ذا المعرّف 1. طلب دون رمز صالح يحصل على `401`.

**🩹 إذا لم يعمل :** يعني `405 Method Not Allowed` أن مسار الطلب يطابق لكن طريقة HTTP لا تطابق — تحقق هل ترسل GET إلى نقطة POST فقط. يعني `403 Insufficient permissions` أن حقل `role` في الرمز ليس في قائمة أذونات المورد — تحقق من قسم `permissions` في YAML والدور الذي يحمله رمزك. إذا كان قاموس `db` فارغًا بين الطلبات، فأنت تشغّل الخادم خارج عملية هذا السكربت — `db` في الذاكرة وتُصفَّر عند إعادة تشغيل العملية.

### 4.3 تحقّق من مسارات CRUD

**✅ قائمة التحقق**

- ✅ `POST /user` برمز مسؤول صالح يعيد مستخدمًا بـ`id` متزايد تلقائيًّا.
- ✅ يسرد `GET /user` كل المستخدمين المنشئين.
- ✅ `DELETE /user/1` برمز مسؤول يعيد `{"deleted": true}`.
- ✅ رمز بدور مشاهِد يضرب `POST /user` يحصل على `403 Insufficient permissions`.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- قاموس `db` في الذاكرة — ماذا يحدث لبياناتك عند إعادة تشغيل الخادم؟ بماذا تبدّله في تطبيق حقيقي؟
- لماذا يأخذ `generate_crud_routes` كائن `ResourceDef` لا مجرد سلسلة اسم مورد؟ ما المعلومات التي ستكون ناقصة لو كان لديه الاسم فقط؟

## الخطوة 5: اختبر API من طرف إلى طرف

يسمح لك `TestClient` الخاص بـFastAPI بضرب كل نقطة نهاية دون تشغيل خادم حقيقي — يشغّل التطبيق داخل العملية ويعيد كائنات استجابة بنمط `httpx`. هذا فحص "هل يعمل فعلًا؟".

### 5.1 شغّل تسلسل الاختبار الكامل

```python
from fastapi.testclient import TestClient

client = TestClient(app)

# Log in
resp = client.post("/login?username=admin&password=secret")
token = resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Create a user
resp = client.post(
    "/user",
    json={"name": "Alice", "email": "alice@example.com", "role": "admin"},
    headers=headers,
)
user = resp.json()
print(f"Created user: {user}")

# List users
resp = client.get("/user", headers=headers)
print(f"Users: {resp.json()}")

# Create a post
resp = client.post(
    "/post",
    json={"title": "Hello World", "content": "My first post", "author_id": user["id"]},
    headers=headers,
)
post = resp.json()
print(f"Created post: {post}")

# Test unauthorized access
resp = client.get("/user", headers={"Authorization": "Bearer bad_token"})
print(f"Unauthorized: {resp.status_code}")
```

**👟 تلميح البداية :** يغلّف `TestClient(app)` تطبيق FastAPI كله — يمكنك `POST` إلى `/login`، والتقاط الرمز، ثم ضرب كل نقطة نهاية أخرى بذلك الرمز في الترويسات. شغّل هذا كسكربت واحد: يحدث تسجيل الدخول أولًا، ثم يبني كل اختبار على مخرج السابق.

**🎯 الناتج المتوقع :**
```
Created user: {'id': 1, 'name': 'Alice', 'email': 'alice@example.com', 'role': 'admin'}
Users: [{'id': 1, 'name': 'Alice', 'email': 'alice@example.com', 'role': 'admin'}]
Created post: {'id': 1, 'title': 'Hello World', 'content': 'My first post', 'author_id': 1}
Unauthorized: 401
```

**🩹 إذا لم يعمل :** يعني `422 Unprocessable Entity` أن التحقق التلقائي لـFastAPI رفض جسم الطلب — تحقق أن مفاتيح JSON تطابق حقول نموذج Pydantic بالضبط. يعني `401` في خطوات الإنشاء/الإدراج أن الرمز لم يُمرَّر صحيحًا — تحقق من صيغة `Authorization: Bearer <token>`، لا `Authorization: <token>` فقط. إذا أعاد `Users` `[]` بدل المستخدم المنشأ، فلم تُشارَك قاعدة `db` بين مسارَي تسجيل الدخول والإنشاء — تأكد أنهما في نفس ملف السكربت.

### 5.2 تحقّق من النهاية إلى النهاية

**✅ قائمة التحقق**

- ✅ يمر التسلسل الكامل دون أخطاء: تسجيل الدخول، إنشاء المستخدم، إدراج المستخدمين، إنشاء المنشور، اختبار الوصول غير المصرح به.
- ✅ يعيد الطلب غير المصرح به `401`، لا `403` ولا `200`.
- ✅ للعناصر المنشأة حقول `id` متزايدة تلقائيًّا تبدأ من 1.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- اختبرت برمز مسؤول. ما الذي يتغير إذا أنشأت رمزًا ثانيًا بـ`{"role": "viewer"}` وحاولت `POST /user` — ما الاستجابة التي تتوقعها، ولماذا يهم اختبار كلا الدورين؟
- يعمل `TestClient` داخل العملية بلا HTTP حقيقي. ما الشيء الواحد في سلوك واجهتك الذي *لن* يلتقطه هذا الاختبار ويستطيع عميل `httpx` حقيقي مقابل خادمٍ يعمل التقاطه؟

## ⚠️ مآزق شائعة

- **`secrets.token_hex(32)` يتولد من جديد عند كل تحميل وحدة.** لن تُفك رموز موقعًا بمفتاح واحد بمفتاح تشغيل التالي — هذا صحيح للتطوير (يرغمك على إعادة تسجيل الدخول كل مرة) لكنه سينكسر في الإنتاج حيث يجب أن يستمر المفتاح. استخدم سرًّا ثابتًا من متغير بيئة لأي شيء وراء الاختبار المحلي.
- **`db` في الذاكرة تخسر كل شيء عند إعادة التشغيل.** قاموس `db` تسهيل تعليمي، لا حل تخزين. إذا كنت تختبر الاستمرارية (مثلًا "أنشئ مستخدماً، أعد تشغيل الخادم، تحقق أنه اختفى")، فهذا السلوك المتوقع — لا خطأ.
- **فقدان `status_code=201` على مسارات POST.** يتخلف FastAPI إلى `200 OK`. تقول مواصفات HTTP أن `201 Created` هو الصحيح لإنشاء الموارد — نسيانها يجعل استجابات واجهتك خاطئة تقنيًّا وأصعب اختبارًا مع عملاء يفحصون رموز الحالة.
- **سمات الاستعلام مقابل جسم JSON لـ`/login`.** يستخدم العرض سمتَي استعلام (`/login?username=admin&password=secret`) للبساطة، لكن واجهات البرمجة الحقيقية ترسل بيانات الاعتماد في جسم JSON. يتطلب التبديل تغيير توقيع الدالة ليقبل نموذج Pydantic — تمرين مفيد لكنه تغيير مكسّر لتسلسل الاختبار.

## ما بنيته للتو

مولّد كود يحول مخطط YAML مقروءًا بشريًّا إلى تطبيق FastAPI يعمل — مصادقًا بـJWT ومتحققًا بـPydantic وموثقًا تلقائيًّا. لم تكتب مسارًا واحدًا يدويًّا؛ قاد المخطط كل شيء. هذا النمط نفسه وراء مولّدات واجهات البرمجة الحقيقية: شكل تعريفي، ومولد كود، وفرض مرحلي للقواعد التي أعلنتها.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/rest-api-builder/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/rest-api-builder) في مستودع المساق نسخة أكمل من الكود أعلاه، مع تفعيل وثائق OpenAPI وتجزئة كلمات المرور بـ`passlib` ونقاط نهاية إضافية لتحديثات PUT وتصفية الاستعلام. استنسخه، أو افتح المستودع كله في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) وشغّله من هناك.
:::

## إلى أين تذهب من هنا

- أضف نقطة نهاية `PUT /{resource}/{id}` تتحقق من جسم الطلب مقابل مخطط المورد وتعيد العنصر المحدَّث — دالة `generate_crud_routes` هي المكان بالضبط لذلك.
- أضف سمتَي استعلام إلى نقطة الإدراج (`GET /user?role=admin`) ليتمكن المستخدمون من التصفية بأي حقل دون كتابة كود جديد — المخطط يعرف بالفعل ما الحقول الموجودة وأنواعها.
- جرّب إضافة مورد ثالث إلى YAML (لنقل `comment` بـ`text` و`author_id` و`post_id`) وشاهد واجهة البرمجة تنمو دون لمس أي بايثون — ذلك ثمار النهج المدفوع بالمخطط.

## شارك مشروعك مع الصف

بنيت شيئًا تفتخر به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع قدّمها طلاب آخرون — وREADME الخاص به يحتوي إرشادًا كاملًا صديقًا للمبتدئين لإضافة مشروعك عبر **طلب سحب**، حتى لو لم تستخدم git من قبل: الشوكة، والفرع، والالتزام، وفتح الـPR، خطوة خطوة. لا خبرة git مسبقة مفترضة.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓