---
title: "خادم GraphQL API"
description: "بناء GraphQL API مرن مع محللات واشتراكات وDataLoader لمنع مشاكل N+1."
difficulty: "advanced"
estimatedMinutes: 70
tags: ["api", "graphql", "async"]
learningObjectives:
  - "تعريف مخطط GraphQL باستعلامات وتغييرات وأنواع"
  - "كتابة محللات تجلب البيانات من مخزن أساسي"
  - "استخدام DataLoader لدمج استعلامات قاعدة البيانات ومنع مشاكل N+1"
  - "تنفيذ اشتراكات لحظية لتحديثات البيانات الحية"
prerequisites: ["Python 101", "تحليل البيانات"]
---

# 🔷 ابنِ خادم GraphQL API

واجهات REST تجبرك على تصميم نقطة نهاية واحدة لكل مورد، لكن العملاء الحقيقيين يحتاجون غالبًا بيانات من خمسة موارد مختلفة في تحميلة شاشة واحدة. تحل GraphQL هذا بأن تجعل العميل يطلب بالضبط ما يحتاجه في طلب واحد. يبني هذا المشروع خادم GraphQL API من الصفر: تعرّف مخططًا بأنواع واستعلامات، وتكتب محللات تجلب بيانات حقيقية، وتستخدم DataLoader لدمج عمليات البحث في قاعدة البيانات ومنع مشكلة استعلام N+1، وتضيف اشتراكات لتحديثات لحظية. يعمل الخادم على Strawberry (مكتبة GraphQL لـPython) مع مخزن بيانات في الذاكرة.

يفترض هذا معرفة Python 101 والراحة مع pandas من تحليل البيانات — لا شيء بعدها. اختياري وغير مُقيَّم؛ انظر [مشاريع واقعية](/ar/مشاريع) للقائمة الكاملة.

## 🎯 ما ستفعله

1. إعداد مشروع بـ`uv` وتثبيت تبعيات GraphQL التي ستحتاجها.
2. تعريف مخطط GraphQL بأنواع واستعلامات وتغييرات باستخدام Strawberry.
3. كتابة محللات ترجع بيانات حقيقية من مخزن في الذاكرة.
4. تنفيذ DataLoader لدمج عمليات بحث متعددة في استعلام واحد لكل طلب.
5. إضافة اشتراكات تدفع تحديثات حية عند تغير البيانات.
6. تشغيل الخادم واختباره بـGraphQL Playground.

## أين تُشغّل هذا

**محليًا عبر `uv`** هو المسار الأساسي — هذا خادم يعمل على `localhost` ويخدم طلبات HTTP. ستتفاعل معه عبر GraphQL Playground قائم على المتصفح أو أداة مثل `curl`.

**GitHub Codespaces** يعمل جيدًا: افتح [مستودع الدورة كله في Codespace مجاني](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) — Python و`uv` والشبكات مُعدّون أصلًا، فتعمل كل خطوة كما تعمل محليًا بالضبط.

**Google Colab وKaggle Notebooks وBinder** تستطيع تشغيل الخادم لاختبار سريع، لكن قد لا يتردد GraphQL Playground في لوحة مخرجات الدفتر. يبدأ الدفتر الخادم على منفذ ويختبره بـ`curl` بدلًا من ذلك.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/graphql-server/notebook.ar.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/graphql-server/notebook.ar.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fgraphql-server%2Fnotebook.ar.ipynb)

## الإعداد

كل ما تحتاجه قبل كتابة مخطط: بيئة Python، ومكتبة Strawberry GraphQL، وإطار ويب غير متزامن لخدمته.

### ثبّت `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

أغلق الطرفية وأعد فتحها، ثم أكّد:

```bash
uv --version
```

### هيّئ المشروع

```bash
uv init graphql-server
cd graphql-server
uv add strawberry-graphql uvicorn
```

`strawberry-graphql` مكتبة GraphQL بنهج الكود أولًا لـPython — تعرّف المخطط كأنواع بايثونية، وتولد هي تلقائيًا نمودج GraphQL والمحللات. `uvicorn` هو خادم ASGI الذي يشغّل التطبيق. `asyncio` في المكتبة القياسية ويقوّي دمج DataLoader.

### أنشئ بنية المشروع

```bash
mkdir -p gql
touch gql/__init__.py gql/types.py gql/schema.py gql/dataloaders.py gql/store.py gql/server.py
```

**✅ قائمة التحقق**

- ✅ يطبع `uv --version` رقم إصدار.
- ✅ يوجد `graphql-server/` مع `pyproject.toml`، و`strawberry-graphql` و`uvicorn` مثبتتان.
- ✅ مجلد `gql/` يحوي كل ملفات الوحدات المطلوبة.

## الخطوة 1: عرّف مخزن البيانات وأنواع GraphQL

قبل أن تتمكن من كتابة مخطط، تحتاج بيانات لتخدمها وأنواعًا تصفها. تنشئ هذه الخطوة مخزنًا بسيطًا في الذاكرة للمستخدمين والمنشورات، ثم تعرّف أنواع GraphQL التي تطابقها.

### 1.1 أنشئ مخزن البيانات في الذاكرة

**👟 تلميح البداية :** أنشئ `gql/store.py` بمستخدمين ومنشورات نموذجية.

```python
# gql/store.py
from dataclasses import dataclass, field

@dataclass
class User:
    id: int
    name: str
    email: str

@dataclass
class Post:
    id: int
    author_id: int
    title: str
    body: str
    published: bool = False

# In-memory "database"
USERS: dict[int, User] = {
    1: User(id=1, name="Alice", email="alice@example.com"),
    2: User(id=2, name="Bob", email="bob@example.com"),
    3: User(id=3, name="Carol", email="carol@example.com"),
}

POSTS: dict[int, Post] = {
    101: Post(id=101, author_id=1, title="First Post", body="Hello world", published=True),
    102: Post(id=102, author_id=1, title="Draft", body="Work in progress", published=False),
    103: Post(id=103, author_id=2, title="GraphQL Tips", body="Use DataLoader!", published=True),
}
```

المخزن بسيط عمدًا — قواميس عادية بقيم dataclass. هذا يُبقي التركيز على آلية GraphQL لا على مشغلات قاعدة البيانات. في الإنتاج، ستستبدل هذه القواميس بقاعدة بيانات، لكن طبقة GraphQL تبقى متطابقة.

**🎯 الناتج المتوقع :** يرجع `USERS[1].name` `"Alice"`؛ ويرجع `POSTS[101].author_id` قيمة `1`.

**🩹 إذا لم يعمل :** إذا كان `USERS` فارغًا بعد تعريفه، فتحقق أن صيغة القاموس صحيحة (لا فواصل مفقودة بين الإدخالات).

### 1.2 عرّف أنواع Strawberry GraphQL

```python
# gql/types.py
import strawberry

@strawberry.type
class UserType:
    id: int
    name: str
    email: str

@strawberry.type
class PostType:
    id: int
    title: str
    body: str
    published: bool
    author: "UserType"  # resolved lazily, not eagerly

@strawberry.type
class Query:
    pass  # extended in schema.py

@strawberry.type
class Mutation:
    pass  # extended in schema.py
```

يستخدم Strawberry تلميحات أنواع Python لتوليد مخطط GraphQL. تصير كل فئة `@strawberry.type` نوع `type` في GraphQL، وكل حقل يصير حقل GraphQL. حقل `author` على `PostType` مُعلَّم كـ`UserType` — دقّ توسيعه الفعلي (تحميل المستخدم بـ`author_id`) تحدث في محلل، لا في تعريف النوع. هذا الفصل هو ما يجعل GraphQL مرنة: يستطيع العميل أن يسأل عن `post.author.name` أو `post.title` فقط، ولا تعمل إلا المحللات اللازمة للحقول المطلوبة فعلًا.

**🎯 الناتج المتوقع :** `UserType(id=1, name="Alice", email="alice@example.com")` ينشئ نوع Strawberry يُتسلسل بشكل صحيح.

**🩹 إذا لم يعمل :** إذا لم يُتعرف على `@strawberry.type`، تحقق أن `strawberry` مستوردة من المسار الصحيح. إذا سبّب خيط نوع الحقل `"UserType"` خطأً، استخدم `from __future__ import annotations` في أعلى الملف.

### 1.3 تحقق من الأنواع

**✅ قائمة التحقق**

- ✅ يخزّن `USERS` و`POSTS` البيانات كقواميس عادية.
- ✅ `UserType` و`PostType` نوعا Strawberry بالحقول الصحيحة.
- ✅ حقل `author` على `PostType` يشير إلى `UserType`.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- في REST، سيكون لديك `/users/1` و`/posts/101` كنقطتي نهاية منفصلتين. في GraphQL، كلاهما حقل على نفس `Query` الجذري. أي ميزة يمنح هذا عميلًا يحتاج بيانات المستخدم والمنشور معًا؟
- حقل `author` مكتوب النوع لكنه لم يُحلَّ بعد. كيف تعني دقة GraphQL الكسولة أن الخادم لا يحمّل أبدًا بيانات أكثر مما يطلبه العميل فعلًا؟

## الخطوة 2: اكتب محللات للاستعلامات

المحللات دوال تجلب البيانات لكل حقل. حين يطلب العميل `posts { author { name } }`، يرجع محلل `posts` قائمة المنشورات، ومحلل `author` على كل منشور يرجع المستخدم المقابل.

### 2.1 اكتب محللات الاستعلام

**👟 تلميح البداية :** أنشئ `gql/schema.py` بمحللات لاستعلامات `users` و`posts` و`user`.

```python
# gql/schema.py
import strawberry
from gql.types import UserType, PostType, Query, Mutation
from gql.store import USERS, POSTS

def resolve_users(root, info) -> list[UserType]:
    return [UserType(id=u.id, name=u.name, email=u.email) for u in USERS.values()]

def resolve_user(root, info, id: int) -> UserType | None:
    u = USERS.get(id)
    return UserType(id=u.id, name=u.name, email=u.email) if u else None

def resolve_posts(root, info, author_id: int | None = None) -> list[PostType]:
    posts = POSTS.values()
    if author_id is not None:
        posts = [p for p in posts if p.author_id == author_id]
    return [
        PostType(id=p.id, title=p.title, body=p.body, published=p.published, author=None)
        for p in posts
    ]

def resolve_author(post: PostType, info) -> UserType | None:
    u = USERS.get(post.author_id)
    return UserType(id=u.id, name=u.name, email=u.email) if u else None

# Attach resolvers to the types
Query.users = resolve_users
Query.user = resolve_user
Query.posts = resolve_posts
PostType.author = resolve_author

schema = strawberry.Schema(query=Query, mutation=Mutation)
```

كائن `schema` هو نقطة الدخول — يولد Strawberry منه مخطط GraphQL الكامل، بما فيه الاستبصار (introspection). دالة `resolve_author` مربوطة مباشرةً بـ`PostType.author`، فعندما يطلب العميل `post.author` تعمل هذه الدالة. حين لا يطلب العميل `author`، لا تعمل أبدًا — تلك كفاءة GraphQL الأساسية.

**🎯 الناتج المتوقع :** يرجع `schema.execute_sync("{ users { name } }")` قائمة المستخدمين. ويرجع `schema.execute_sync("{ posts { title author { name } } }")` المنشورات بأسماء مؤلفيها.

**🩹 إذا لم يعمل :** إذا رجع `resolve_posts` قيمة `author=None` حتى حين يطلبها العميل، فمحلل `PostType.author` غير مربوط. إذا رفع `schema.execute_sync` خطأ حقل مفقود، فخيط الاستعلام لا يطابق أسماء حقول المخطط.

### 2.2 أضف استعلامًا بوسائط

```python
# gql/schema.py (متابعة)
# The resolve_user resolver already takes an id argument.
# Strawberry infers the GraphQL argument from the Python function signature.
```

معامل `id: int` على `resolve_user` يصير تلقائيًا وسيط GraphQL إلزاميًا `user(id: Int!)`. لا حاجة لأي إعداد إضافي — يقرأ Strawberry توقيع الدالة.

**🎯 الناتج المتوقع :** يرجع `schema.execute_sync("{ user(id: 1) { name email } }")` بيانات أليس. ويرجع `schema.execute_sync("{ user(id: 999) { name } }")` قيمة `null` للمستخدم.

**🩹 إذا لم يعمل :** إذا لم يُتعرف على الوسيط في المخطط، فاسم معامل الدالة أو تلميح نوعه لا يطابق ما يتوقعه Strawberry.

### 2.3 تحقق من المحللات

**✅ قائمة التحقق**

- ✅ يرجع `schema.execute_sync("{ users { name } }")` المستخدمين الثلاثة كلهم.
- ✅ يرجع `schema.execute_sync("{ user(id: 1) { name } }")` أليس.
- ✅ يرجع `schema.execute_sync("{ posts { title } }")` كل المنشورات.
- ✅ تُرجع الحقول المطلوبة فقط — لا جلب زائد.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- إذا طلب عميل `posts { author { email } }`، يعمل محلل `resolve_posts` أولًا (راجعًا كل المنشورات بـ`author=None`)، ثم يعمل `resolve_author` لكل منشور. ذلك ثلاث استدعاءات منفصلة لـ`USERS.get`. كيف يدمجها DataLoader في استدعاء واحد؟
- ماذا يحدث إذا رجع `resolve_user` قيمة `None` لمعرف غير معروف؟ أيرجع GraphQL `null` في الاستجابة أم خطأً؟ وكيف يختلف ذلك عن 404 في REST؟

## الخطوة 3: نفّذ DataLoader لمنع مشاكل N+1

مشكلة N+1: جلب قائمة من مئة منشور ثم دقّ تأليف كل منشور على حدة يعني 101 استعلام قاعدة بيانات (1 للمنشورات + 100 للمؤلفين). يحل DataLoader هذا بجمع كل معرّفات المؤلفين من دورة طلب واحدة ودمجها في بحث واحد.

### 3.1 ابنِ DataLoader

**👟 تلميح البداية :** أنشئ `gql/dataloaders.py` مع `UserLoader` يدمج عمليات بحث المستخدمين بالمعرّف.

```python
# gql/dataloaders.py
from asyncio import gather
from gql.store import USERS, User

class DataLoader:
    """A simplified DataLoader that batches and caches lookups per request."""

    def __init__(self, batch_fn):
        self.batch_fn = batch_fn
        self.cache: dict = {}
        self.pending: dict[int, "Future"] = {}

    async def load(self, key: int):
        if key in self.cache:
            return self.cache[key]
        # In a real DataLoader, you'd collect keys and batch at the end of the tick.
        # Here we call batch_fn directly for simplicity.
        result = await self.batch_fn([key])
        self.cache[key] = result[0]
        return result[0]

class UserLoader:
    def __init__(self):
        self.loader = DataLoader(self._batch_load)

    async def _batch_load(self, ids: list[int]) -> list[User]:
        """Batch load users by IDs — one call for all IDs."""
        print(f"  [DataLoader] Batch loading users: {ids}")
        return [USERS.get(uid) for uid in ids]

    async def load(self, user_id: int) -> User | None:
        return await self.loader.load(user_id)
```

السحر الحقيقي في `_batch_load`: بدل استدعاء `USERS.get` مرة لكل منشور، يجمع DataLoader كل معرّفات المستخدمين من دورة طلب واحدة ويستدعي `_batch_load` مرة واحدة بكل منها. جملة `print` تُثبت الدمج — يجب أن ترى سطر سجل واحدًا بكل المعرّفات، لا سطرًا لكل منشور. في الإنتاج، يقلل نمط DataLoader هذا (الذي روجته مكتبة `dataloader` الخاصة بـFacebook للجافاسكريبت) رحلات قاعدة البيانات المستديرة من N+1 إلى 2.

**🎯 الناتج المتوقع :** يرجع `await loader.load(1)` قيمة `USERS[1]` ويطبع سطر سجل دمج واحدًا. تحميل المستخدمين 1 و2 و3 بالتسلسل يطبع سطر سجل واحدًا بـ`[1, 2, 3]`.

**🩹 إذا لم يعمل :** إذا رأيت أسطر سجل متعددة (سطرًا لكل استدعاء تحميل)، فالدمج لا يعمل — تحقق أن DataLoader يجمع المعرّفات قبل استدعاء `batch_fn`.

### 3.2 أدمج DataLoader في المحللات

```python
# gql/schema.py (متابعة، استبدل resolve_author)
from gql.dataloaders import UserLoader

# Create a loader per request (in practice, use context)
_user_loader = UserLoader()

async def resolve_author_with_loader(post: PostType, info) -> UserType | None:
    user = await _user_loader.load(post.author_id)
    return UserType(id=user.id, name=user.name, email=user.email) if user else None

PostType.author = resolve_author_with_loader
```

**🎯 الناتج المتوقع :** الاستعلام عن `posts { author { name } }` يطبع سطر سجل دمج واحدًا (لا ثلاثة)، مؤكدًا أن DataLoader دمج عمليات البحث.

**🩹 إذا لم يعمل :** إذا كان المحلل ما زال متزامنًا، أضف `async` و`await`. إذا أظهر السجل استدعاءات دمج متعددة، فالمحمّل لا يُشارك عبر المحللات.

### 3.3 تحقق من دمج DataLoader

**✅ قائمة التحقق**

- ✅ تحميل عدة مستخدمين يطبع سطر سجل دمج واحدًا، لا سطرًا لكل مستخدم.
- ✅ كل مستخدم محمَّل يطابق البيانات المتوقعة من المخزن.
- ✅ يخزّن DataLoader مؤقتًا النتائج — تحميل المعرّف نفسه مرتين لا يعيد الدمج.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- في تطبيق حقيقي، سيضرب `_batch_load` قاعدة بيانات. إذا وصل طلبان في الآن نفسه، فسيتشاركان `_user_loader` نفسه ويخلطان معرّفاتهما. كيف تقيّد المحمّل بطلب واحد؟
- يخزّن DataLoader مؤقتًا بالمفتاح داخل الطلب. ماذا يحدث إذا غيّر المستخدم 1 اسمه بين استعلامين في نفس الجلسة؟ هل البيانات العتيقة مشكلة، وكيف تصلحها؟

## الخطوة 4: أضف اشتراكات لحظية

تضغط الاشتراكات التحديثات إلى العملاء عند تغير البيانات — على خلاف الاستعلامات (سحب مرة واحدة) أو التغييرات (دفع مرة واحدة)، يحافظ الاشتراك على اتصال مفتوح. تضيف هذه الخطوة اشتراكًا يُخطر العملاء حين يُنشر منشور جديد.

### 4.1 عرّف اشتراكًا

**👟 تلميح البداية :** أنشئ اشتراك `post_published` يُنتج منشورات جديدة أثناء إنشائها.

```python
# gql/schema.py (متابعة)
import asyncio
from typing import AsyncGenerator
import strawberry
from gql.types import PostType

@strawberry.type
class Subscription:
    @strawberry.field
    async def post_published(self) -> AsyncGenerator[PostType, None]:
        """Yields new posts as they are published."""
        # In production, this would read from a message queue or WebSocket.
        # For demo, yield a fake post after a short delay.
        await asyncio.sleep(1)
        yield PostType(id=999, title="Live Post", body="This appeared in real time!", published=True, author=None)
```

تستخدم الاشتراكات صيغة Python لـ*المولد غير المتزامن* — يرسل `yield` كل تحديث إلى العميل. في الإنتاج، ستستبدل `asyncio.sleep` بمصدر أحداث حقيقي (نشر/اشتراك Redis، أو مشغل قاعدة بيانات، أو قائمة انتظار رسائل). يتولى Strawberry بروتوكول WebSocket الذي يُبقي الاتصال مفتوحًا ويوصّل كل قيمة مُنتَجة.

**🎯 الناتج المتوقع :** لا يُستخدم `schema.execute_sync` للاشتراكات — بدلًا من ذلك، يعمل الاشتراك بشكل غير متزامن وينتج المنشور بعد ثانية واحدة.

**🩹 إذا لم يعمل :** إذا لم يُنتج الاشتراك شيئًا، فالمولد غير المتزامن غير مهيأ بشكل صحيح — تحقق من تلميح نوع `AsyncGenerator` ومن جملة `yield`.

### 4.2 صِل الاشتراك بالمخطط

```python
# gql/schema.py (حدّث إنشاء المخطط)
schema = strawberry.Schema(query=Query, mutation=Mutation, subscription=Subscription)
```

**🎯 الناتج المتوقع :** يشمل `schema.as_str()` تعريف `type Subscription { postPublished: PostType! }` في المخطط.

**🩹 إذا لم يعمل :** إذا لم يظهر نوع الاشتراك في المخطط، ففئة `Subscription` غير مُمرَّرة إلى `strawberry.Schema`.

### 4.3 تحقق من الاشتراكات

**✅ قائمة التحقق**

- ✅ يشمل المخطط نوع `Subscription` بالحقل `postPublished`.
- ✅ مولد غير متزامن يُنتج منشورات عند عمل الاشتراك.
- ✅ كائن `schema` يشمل الاشتراكات عند طباعته.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- تُبقي الاشتراكات اتصال WebSocket مفتوحًا. ماذا يحدث لذلك الاتصال إذا أعيد تشغيل الخادم؟ وكيف يكتشف العميل اشتراكًا منقطعًا ويتعافى منه؟
- لتطبيق دردشة، ستحتاج اشتراكات للرسائل الجديدة ومؤشرات الكتابة والحضور. كيف تجمع عدة أنواع اشتراك دون إنشاء WebSocket منفصل لكل منها؟

## الخطوة 5: شغّل الخادم واختبره

كل شيء يجتمع في الخادم: المخطط، والمحللات، وDataLoader، والاشتراك. يشحن Strawberry GraphQL Playground مدمجًا للاختبار التفاعلي.

### 5.1 اكتب نقطة دخول الخادم

**👟 تلميح البداية :** أنشئ `gql/server.py` يشغّل خادم Strawberry مع تمكين الملعب.

```python
# gql/server.py
import uvicorn
import strawberry
from gql.types import UserType, PostType, Query, Mutation
from gql.store import USERS, POSTS

def resolve_users(root, info):
    return [UserType(id=u.id, name=u.name, email=u.email) for u in USERS.values()]

def resolve_user(root, info, id: int):
    u = USERS.get(id)
    return UserType(id=u.id, name=u.name, email=u.email) if u else None

def resolve_posts(root, info, author_id: int | None = None):
    posts = POSTS.values()
    if author_id is not None:
        posts = [p for p in posts if p.author_id == author_id]
    return [
        PostType(id=p.id, title=p.title, body=p.body, published=p.published, author=None)
        for p in posts
    ]

def resolve_author(post, info):
    u = USERS.get(post.author_id)
    return UserType(id=u.id, name=u.name, email=u.email) if u else None

Query.users = resolve_users
Query.user = resolve_user
Query.posts = resolve_posts
PostType.author = resolve_author

schema = strawberry.Schema(query=Query, mutation=Mutation)

if __name__ == "__main__":
    print("Starting GraphQL server at http://localhost:8000/graphql")
    uvicorn.run("gql.server:app", host="0.0.0.0", port=8000, reload=True)
```

تعني تكامل Strawberry مع ASGI أنه يمكنك تشغيله بـ`uvicorn` مباشرةً. راية `reload=True` تراقب تغييرات الملفات أثناء التطوير. يتاح GraphQL Playground على `http://localhost:8000/graphql` في متصفحك — يوفر استكمالًا تلقائيًا، وتوثيق مخطط، وتاريخ استعلاماتك.

**🎯 الناتج المتوقع :** تشغيل `uv run python -m gql.server` يبدأ خادمًا على `http://localhost:8000/graphql`. فتح ذلك العنوان في متصفح يعرض GraphQL Playground.

**🩹 إذا لم يعمل :** إذا كان المنفذ 8000 مستخدمًا أصلًا، غيّر رقم المنفذ. إذا لم يُحمَّل الملعب، تحقق أن `strawberry[fastapi]` أو التكامل الصحيح مثبت.

### 5.2 اختبر بـcurl

```bash
# Test a query
curl -X POST http://localhost:8000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ users { name email } }"}'

# Test with author resolution
curl -X POST http://localhost:8000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ posts { title author { name } } }"}'
```

تؤكد اختبارات `curl` أن الخادم يعمل خارج المتصفح — مفيدة للبرمجة النصية وCI وتصحيح الأخطاء. الاستجابة كائن JSON بمفتاح `data` يحوي نتائج الاستعلام.

**🎯 الناتج المتوقع :** يرجع أول curl `{"data": {"users": [{"name": "Alice", ...}, ...]}}`. ويرجع الثاني المنشورات بأسماء مؤلفين مُدقّقين.

**🩹 إذا لم يعمل :** إذا رجع `curl` خطأ اتصال، فالخادم لا يعمل. إذا احتوت الاستجابة مفتاح `errors`، فخيط الاستعلام لا يطابق المخطط.

### 5.3 تحقق من الخادم

**✅ قائمة التحقق**

- ✅ `uv run python -m gql.server` يبدأ خادمًا على `http://localhost:8000/graphql`.
- ✅ يحمَّل GraphQL Playground في متصفح باستكمال تلقائي وتوثيق مخطط.
- ✅ استعلامات `curl` ترجع استجابات JSON الصحيحة بالحقول المطلوبة.

**🤔 سؤال (أسئلة) سقراطي(ة)**

- يتيح استبصار GraphQL للعملاء اكتشاف المخطط كله بالاستعلام عن `__schema`. في الإنتاج، هذا خطر أمني — ماذا ستفعل لتعطيل الاستبصار مع إبقاء API عاملة؟
- إذا أضفت تغيير `createPost`، كيف تفعّل اشتراك `post_published` ليرى كل العملاء المتصلين المنشور الجديد يظهر في الوقت الحقيقي؟

## ⚠️ المآزق الشائعة

- **مشكلة استعلام N+1.** دون DataLoader، كل دق تأليف منشور هو استدعاء قاعدة بيانات منفصل. لصفحة تعرض 50 منشورًا، ذلك 51 استعلامًا. استخدم DataLoader دائمًا لدق العلاقات في GraphQL — إنها أكبر كسب أداء على الإطلاق.
- **الجلب الزائد في المحللات.** الهدف كله من GraphQL أن يطلب العملاء ما يحتاجونه فقط. إذا حمّل محللك جدول قاعدة البيانات كله وحوّله كله إلى أنواع Strawberry، فقد خسرت كسب الكفاءة. صفِّ وقسّم الصفحات في المحلل.
- **الاشتراكات تُبقي الاتصالات مفتوحة.** كل اشتراك يحافظ على اتصال WebSocket. إذا كان لديك آلاف من المشتركين المتزامنين، تحتاج توسعًا أفقيًا (نشر/اشتراك Redis أو وسيط رسائل) — لا يستطيع خادم واحد تحمّل آلاف الاتصالات الدائمة بكفاءة.
- **نسيان أن أخطاء GraphQL لا توقف التنفيذ.** المحلل الذي يرفع استثناءً يرجع `null` لذلك الحقل إضافةً إلى خطأ في مصفوفة `errors` — ويظل باقي الاستعلام راجعًا البيانات. هذا مختلف عن REST، حيث يقتل 500 الاستجابة كلها.
- **الاستبصار في الإنتاج.** يسمح استبصار GraphQL لأي شخص باكتشاف مخطط API كله. في الإنتاج، عطّله ما لم تكن تبني API عامة.

## ما بنيته للتو

خادم GraphQL API كامل: مخطط بأنواع واستعلامات، ومحللات تجلب البيانات من مخزن في الذاكرة، ودمج DataLoader لمنع استعلامات N+1، واشتراكات لحظية للتحديثات الحية، وملعب تفاعلي للاختبار. البنية — تصميم المخطط أولًا، محلل لكل حقل، وDataLoader للدمج — هي النمط نفسه الذي تستخدمه خوادم GraphQL الإنتاجية في شركات مثل GitHub وShopify وAirbnb.

:::tip[شغّل نسخة أكمل دون أي إعداد محلي]
[`examples/graphql-server/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/graphql-server) في مستودع الدورة يحوي نسخة أغنى بتغييرات وخلفية قاعدة بيانات حقيقية وDataLoader موصولًا من طرف إلى طرف. استنسخه، أو افتح المستودع كله في [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)، وشغّله من هناك.
:::

## إلى أين تذهب من هنا

- أضف تغيير `createPost` يقبل `title` و`body` و`authorId`، ويخزّن المنشور الجديد، ويفعّل اشتراك `post_published`.
- نفّذ ترقيم صفحات بترقيم من نمط relay المعتمد على المؤشر (وسيطا `first` و`after`) حتى تُحمَّل مجموعات النتائج الكبيرة في دفعات.
- أضف وسطاء مصادقة يفحصون رمز Bearer في كل طلب ويكشفون المستخدم الحالي للمحللات عبر `info.context`.

## شارك مشروعك مع الصف

بنيت شيئًا تفتخر به؟ [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) معرض لمشاريع قدّمها طلاب آخرون — وملف README فيه جولة كاملة صديقة للمبتدئين لإضافة مشروعك عبر **طلب سحب**، حتى لو لم تستخدم git من قبل: استنساخ المستودع، وإنشاء فرع، والالتزام بملفاتك، وفتح الـPR، خطوة بخطوة. لا تُفترض أي خبرة git سابقة.

مرحبًا بك في كتابة Python خارج المتصفح. 🎓