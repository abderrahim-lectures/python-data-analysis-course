---
title: "Servidor de API GraphQL"
description: "Construye una API GraphQL flexible con resolutores, suscripciones y DataLoader para prevenir N+1."
difficulty: "advanced"
estimatedMinutes: 70
tags: ["api", "graphql", "async"]
learningObjectives:
  - "Definir un esquema GraphQL con consultas, mutaciones y tipos"
  - "Escribir resolutores que obtengan datos de un almacén subyacente"
  - "Usar DataLoader para agrupar consultas de base de datos y prevenir problemas N+1"
  - "Implementar suscripciones en tiempo real para actualizaciones de datos en vivo"
prerequisites:
  - "Python 101"
  - "Análisis de Datos"
---

# 🔷 Servidor de API GraphQL

Las APIs REST te obligan a diseñar un endpoint por recurso, pero los clientes reales a menudo necesitan datos de cinco recursos diferentes en una sola carga de pantalla. GraphQL resuelve esto dejando que el cliente pida exactamente lo que necesita en una sola solicitud. Este proyecto construye un servidor de API GraphQL desde cero: defines un esquema con tipos y consultas, escribes resolutores que obtienen datos reales, usas DataLoader para agrupar búsquedas de base de datos y prevenir el problema de consultas N+1, y añades suscripciones para actualizaciones en tiempo real. El servidor se ejecuta en Strawberry (una biblioteca GraphQL de Python) con un almacén de datos en memoria.

Esto asume Python 101 y comodidad con pandas de Análisis de Datos — nada más allá. Es opcional y no calificado; consulta [Proyectos del mundo real](/es/proyectos) para la lista completa.

## 🎯 Lo que harás

1. Configurar un proyecto con `uv` e instalar las dependencias de GraphQL que necesitarás.
2. Definir un esquema GraphQL con tipos, consultas y mutaciones usando Strawberry.
3. Escribir resolutores que devuelvan datos reales de un almacén en memoria.
4. Implementar DataLoader para agrupar múltiples búsquedas en una sola consulta por solicitud.
5. Añadir suscripciones que empujen actualizaciones en vivo cuando los datos cambien.
6. Ejecutar el servidor y probarlo con el GraphQL Playground.

## Dónde ejecutar esto

**Localmente con `uv`** es el camino principal — este es un servidor que se ejecuta en `localhost` y atiende solicitudes HTTP. Interactuarás con él a través de un GraphQL Playground basado en navegador o una herramienta como `curl`.

**GitHub Codespaces** funciona bien: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) — Python, `uv` y la red ya están configurados, así que cada paso funciona exactamente igual que localmente.

**Google Colab, Kaggle Notebooks y Binder** pueden ejecutar el servidor para una prueba rápida, pero el GraphQL Playground puede no renderizarse en el panel de salida de un notebook. El notebook inicia el servidor en un puerto y lo prueba con `curl` en su lugar.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/graphql-server/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/graphql-server/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fgraphql-server%2Fnotebook.ipynb)

## Configuración

Todo lo que necesitas antes de escribir un esquema: un entorno de Python, la biblioteca Strawberry GraphQL y un framework web asíncrono para servirlo.

### Instala `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Cierra y vuelve a abrir tu terminal, luego confirma:

```bash
uv --version
```

### Crea el scaffold del proyecto

```bash
uv init graphql-server
cd graphql-server
uv add strawberry-graphql uvicorn
```

`strawberry-graphql` es una biblioteca GraphQL code-first para Python — defines tu esquema como tipos de Python, y ella genera el esquema y los resolutores de GraphQL automáticamente. `uvicorn` es el servidor ASGI que ejecuta la aplicación. `asyncio` está en la biblioteca estándar y potencia el agrupamiento de DataLoader.

### Crea la estructura del proyecto

```bash
mkdir -p gql
touch gql/__init__.py gql/types.py gql/schema.py gql/dataloaders.py gql/store.py gql/server.py
```

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `graphql-server/` existe con un `pyproject.toml`, y `strawberry-graphql` y `uvicorn` están instalados.
- ✅ El directorio `gql/` tiene todos los archivos de módulo requeridos.

## Paso 1: Define el almacén de datos y los tipos GraphQL

Antes de que puedas escribir un esquema, necesitas datos que servir y tipos que lo describan. Este paso crea un almacén simple en memoria de usuarios y publicaciones, y luego define los tipos GraphQL que los reflejan.

### 1.1 Crea el almacén de datos en memoria

**👟 Pista inicial :** Crea `gql/store.py` con usuarios y publicaciones de muestra.

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

El almacén es deliberadamente simple — diccionarios planos con valores dataclass. Esto mantiene el enfoque en la mecánica de GraphQL en lugar de en los drivers de base de datos. En producción, reemplazarías estos diccionarios con una base de datos, pero la capa de GraphQL se mantiene idéntica.

**🎯 Resultado esperado :** `USERS[1].name` devuelve `"Alice"`; `POSTS[101].author_id` devuelve `1`.

**🩹 Si sale mal :** Si `USERS` está vacío después de definirlo, verifica que la sintaxis del diccionario sea correcta (no falten comas entre las entradas).

### 1.2 Define los tipos GraphQL de Strawberry

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

Strawberry usa los type hints de Python para generar el esquema GraphQL. Cada clase `@strawberry.type` se convierte en un `type` de GraphQL, y cada campo se convierte en un campo de GraphQL. El campo `author` en `PostType` está marcado como un `UserType` — su resolución real (cargar al usuario por `author_id`) ocurre en un resolutor, no en la definición del tipo. Esta separación es lo que hace a GraphQL flexible: el cliente puede pedir `post.author.name` o solo `post.title`, y solo los resolutores necesarios para los campos solicitados se ejecutan realmente.

**🎯 Resultado esperado :** `UserType(id=1, name="Alice", email="alice@example.com")` crea un tipo de Strawberry que se serializa correctamente.

**🩹 Si sale mal :** Si `@strawberry.type` no se reconoce, verifica que `strawberry` se importe desde la ruta correcta. Si la cadena de tipo del campo `author`, `"UserType"`, causa un error, usa `from __future__ import annotations` en la parte superior del archivo.

### 1.3 Verifica los tipos

**✅ Lista de verificación**

- ✅ `USERS` y `POSTS` guardan datos como diccionarios planos.
- ✅ `UserType` y `PostType` son tipos de Strawberry con los campos correctos.
- ✅ El campo `author` en `PostType` referencia a `UserType`.

**🤔 Pregunta(s) socrática(s)**

- En REST, tendrías `/users/1` y `/posts/101` como endpoints separados. En GraphQL, ambos son campos en la misma raíz `Query`. ¿Qué ventaja le da esto a un cliente que necesita juntos los datos de usuario y de publicación?
- El campo `author` está tipado pero aún no se resuelve. ¿Cómo hace la resolución perezosa de GraphQL que el servidor nunca cargue más datos de los que el cliente realmente pide?

## Paso 2: Escribe resolutores para las consultas

Los resolutores son funciones que obtienen datos para cada campo. Cuando un cliente pide `posts { author { name } }`, el resolutor de `posts` devuelve la lista de publicaciones, y el resolutor de `author` en cada publicación devuelve el usuario correspondiente.

### 2.1 Escribe los resolutores de consulta

**👟 Pista inicial :** Crea `gql/schema.py` con resolutores para las consultas `users`, `posts` y `user`.

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

El objeto `schema` es el punto de entrada — Strawberry genera el esquema GraphQL completo a partir de él, incluyendo la introspección. La función `resolve_author` se adjunta directamente a `PostType.author`, así que cuando un cliente solicita `post.author`, esta función se ejecuta. Cuando el cliente no solicita `author`, nunca se ejecuta — esa es la eficiencia central de GraphQL.

**🎯 Resultado esperado :** `schema.execute_sync("{ users { name } }")` devuelve la lista de usuarios. `schema.execute_sync("{ posts { title author { name } } }")` devuelve las publicaciones con los nombres de sus autores.

**🩹 Si sale mal :** Si `resolve_posts` devuelve `author=None` incluso cuando el cliente lo pide, el resolutor `PostType.author` no está adjuntado. Si `schema.execute_sync` lanza un error de campo faltante, la cadena de consulta no coincide con los nombres de campo del esquema.

### 2.2 Añade una consulta con argumentos

```python
# gql/schema.py (continued)
# The resolve_user resolver already takes an id argument.
# Strawberry infers the GraphQL argument from the Python function signature.
```

El parámetro `id: int` en `resolve_user` se convierte automáticamente en un argumento GraphQL requerido `user(id: Int!)`. No se necesita configuración extra — Strawberry lee la firma de la función.

**🎯 Resultado esperado :** `schema.execute_sync("{ user(id: 1) { name email } }")` devuelve los datos de Alice. `schema.execute_sync("{ user(id: 999) { name } }")` devuelve `null` para el usuario.

**🩹 Si sale mal :** Si el argumento no se reconoce en el esquema, el nombre del parámetro o el type hint de la función no coinciden con lo que Strawberry espera.

### 2.3 Verifica los resolutores

**✅ Lista de verificación**

- ✅ `schema.execute_sync("{ users { name } }")` devuelve los tres usuarios.
- ✅ `schema.execute_sync("{ user(id: 1) { name } }")` devuelve a Alice.
- ✅ `schema.execute_sync("{ posts { title } }")` devuelve todas las publicaciones.
- ✅ Solo se devuelven los campos solicitados — sin sobre-obtención.

**🤔 Pregunta(s) socrática(s)**

- Si un cliente pide `posts { author { email } }`, el resolutor `resolve_posts` se ejecuta primero (devolviendo todas las publicaciones con `author=None`), luego `resolve_author` se ejecuta para cada publicación. Esas son tres llamadas separadas a `USERS.get`. ¿Cómo agruparía DataLoader esas tres en una sola llamada?
- ¿Qué pasa si `resolve_user` devuelve `None` para un ID desconocido? ¿GraphQL devuelve `null` en la respuesta, o un error? ¿En qué se diferencia de un 404 de REST?

## Paso 3: Implementa DataLoader para prevenir el problema N+1

El problema N+1: obtener una lista de 100 publicaciones y luego resolver el autor de cada publicación individualmente significa 101 consultas a la base de datos (1 por las publicaciones + 100 por los autores). DataLoader resuelve esto recolectando todos los IDs de autores de un solo ciclo de solicitud y agrupándolos en una sola búsqueda.

### 3.1 Construye el DataLoader

**👟 Pista inicial :** Crea `gql/dataloaders.py` con un `UserLoader` que agrupe las búsquedas de usuarios por ID.

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

La magia real está en `_batch_load`: en lugar de llamar a `USERS.get` una vez por publicación, DataLoader recolecta todos los IDs de usuarios de un solo ciclo de solicitud y llama a `_batch_load` una vez con todos ellos. La instrucción `print` prueba el agrupamiento — deberías ver una línea de log con todos los IDs, no una por publicación. En producción, este patrón de DataLoader (popularizado por la biblioteca `dataloader` de Facebook para JavaScript) reduce los viajes de ida y vuelta a la base de datos de N+1 a 2.

**🎯 Resultado esperado :** `await loader.load(1)` devuelve `USERS[1]` e imprime una línea de log de agrupamiento. Cargar los usuarios 1, 2, 3 en secuencia imprime una línea de log con `[1, 2, 3]`.

**🩹 Si sale mal :** Si ves múltiples líneas de log (una por llamada de carga), el agrupamiento no funciona — verifica que el DataLoader esté recolectando los IDs antes de llamar a `batch_fn`.

### 3.2 Integra DataLoader en los resolutores

```python
# gql/schema.py (continued, replace resolve_author)
from gql.dataloaders import UserLoader

# Create a loader per request (in practice, use context)
_user_loader = UserLoader()

async def resolve_author_with_loader(post: PostType, info) -> UserType | None:
    user = await _user_loader.load(post.author_id)
    return UserType(id=user.id, name=user.name, email=user.email) if user else None

PostType.author = resolve_author_with_loader
```

**🎯 Resultado esperado :** Consultar `posts { author { name } }` imprime una línea de log de agrupamiento (no tres), confirmando que DataLoader fusionó las búsquedas.

**🩹 Si sale mal :** Si el resolutor sigue siendo síncrono, añade `async` y `await`. Si el log muestra múltiples llamadas de agrupamiento, el loader no se está compartiendo entre los resolutores.

### 3.3 Verifica el agrupamiento de DataLoader

**✅ Lista de verificación**

- ✅ Cargar múltiples usuarios imprime una línea de log de agrupamiento, no una por usuario.
- ✅ Cada usuario cargado coincide con los datos esperados del almacén.
- ✅ El DataLoader guarda en caché los resultados — cargar el mismo ID dos veces no re-agrupa.

**🤔 Pregunta(s) socrática(s)**

- En una aplicación real, `_batch_load` golpearía una base de datos. Si dos solicitudes llegan simultáneamente, compartirían el mismo `_user_loader` y mezclarían sus IDs. ¿Cómo limitarías el loader a una sola solicitud?
- DataLoader guarda en caché por clave dentro de una solicitud. ¿Qué pasa si el usuario 1 cambia su nombre entre dos consultas en la misma sesión? ¿Es el dato obsoleto un problema, y cómo lo arreglarías?

## Paso 4: Añade suscripciones en tiempo real

Las suscripciones empujan actualizaciones a los clientes cuando los datos cambian — a diferencia de las consultas (tirar una vez) o las mutaciones (empujar una vez), las suscripciones mantienen una conexión abierta. Este paso añade una suscripción que notifica a los clientes cuando se publica una publicación nueva.

### 4.1 Define una suscripción

**👟 Pista inicial :** Crea una suscripción `post_published` que genere publicaciones nuevas a medida que se crean.

```python
# gql/schema.py (continued)
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

Las suscripciones usan la sintaxis de `async generator` de Python — `yield` envía cada actualización al cliente. En producción, reemplazarías el `asyncio.sleep` con una fuente de eventos real (Redis pub/sub, un disparador de base de datos o una cola de mensajes). Strawberry maneja el protocolo WebSocket que mantiene la conexión abierta y entrega cada valor generado.

**🎯 Resultado esperado :** `schema.execute_sync` no se usa para suscripciones — en su lugar, la suscripción se ejecuta asíncronamente y genera la publicación después de 1 segundo.

**🩹 Si sale mal :** Si la suscripción no genera nada, el `async generator` no está configurado correctamente — revisa el type hint `AsyncGenerator` y la declaración `yield`.

### 4.2 Conecta la suscripción al esquema

```python
# gql/schema.py (update the schema creation)
schema = strawberry.Schema(query=Query, mutation=Mutation, subscription=Subscription)
```

**🎯 Resultado esperado :** `schema.as_str()` incluye `type Subscription { postPublished: PostType! }` en la definición del esquema.

**🩹 Si sale mal :** Si el tipo de suscripción no aparece en el esquema, la clase `Subscription` no se está pasando a `strawberry.Schema`.

### 4.3 Verifica las suscripciones

**✅ Lista de verificación**

- ✅ El esquema incluye un tipo `Subscription` con el campo `postPublished`.
- ✅ Un async generator genera publicaciones cuando la suscripción se ejecuta.
- ✅ El objeto `schema` incluye las suscripciones al imprimirse.

**🤔 Pregunta(s) socrática(s)**

- Las suscripciones mantienen una conexión WebSocket abierta. ¿Qué pasa con esa conexión si el servidor se reinicia? ¿Cómo detectaría y se recuperaría un cliente de una suscripción caída?
- Para una aplicación de chat, necesitarías suscripciones para mensajes nuevos, indicadores de escritura y presencia. ¿Cómo combinarías múltiples tipos de suscripción sin crear un WebSocket separado para cada uno?

## Paso 5: Ejecuta el servidor y pruébalo

Todo se une en el servidor: el esquema, los resolutores, el DataLoader y la suscripción. Strawberry incluye un GraphQL Playground integrado para pruebas interactivas.

### 5.1 Escribe el punto de entrada del servidor

**👟 Pista inicial :** Crea `gql/server.py` que ejecute el servidor de Strawberry con el playground habilitado.

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

La integración de Strawberry con ASGI significa que puedes ejecutarlo directamente con `uvicorn`. El indicador `reload=True` vigila los cambios de archivo durante el desarrollo. El GraphQL Playground está disponible en `http://localhost:8000/graphql` en tu navegador — proporciona autocompletado, documentación del esquema e historial de tus consultas.

**🎯 Resultado esperado :** Ejecutar `uv run python -m gql.server` inicia un servidor en `http://localhost:8000/graphql`. Abrir esa URL en un navegador muestra el GraphQL Playground.

**🩹 Si sale mal :** Si el puerto 8000 ya está en uso, cambia el número del puerto. Si el playground no carga, verifica que `strawberry[fastapi]` o la integración correcta esté instalada.

### 5.2 Prueba con curl

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

Las pruebas de `curl` confirman que el servidor funciona fuera del navegador — útil para scripting, CI y depuración. La respuesta es un objeto JSON con una clave `data` que contiene los resultados de la consulta.

**🎯 Resultado esperado :** El primer curl devuelve `{"data": {"users": [{"name": "Alice", ...}, ...]}}`. El segundo devuelve las publicaciones con los nombres de los autores resueltos.

**🩹 Si sale mal :** Si `curl` devuelve un error de conexión, el servidor no está ejecutándose. Si la respuesta tiene una clave `errors`, la cadena de consulta no coincide con el esquema.

### 5.3 Verifica el servidor

**✅ Lista de verificación**

- ✅ `uv run python -m gql.server` inicia un servidor en `http://localhost:8000/graphql`.
- ✅ El GraphQL Playground carga en un navegador con autocompletado y documentación del esquema.
- ✅ Las consultas de `curl` devuelven respuestas JSON correctas con los campos solicitados.

**🤔 Pregunta(s) socrática(s)**

- La introspección de GraphQL permite que los clientes descubran todo el esquema consultando `__schema`. En producción, esto es un riesgo de seguridad — ¿qué harías para deshabilitar la introspección mientras mantienes la API funcional?
- Si añadieras una mutación `createPost`, ¿cómo dispararías la suscripción `post_published` para que todos los clientes conectados vean la publicación nueva aparecer en tiempo real?

## ⚠️ Errores comunes

- **El problema de consultas N+1.** Sin DataLoader, la resolución del autor de cada publicación es una llamada separada a la base de datos. Para una página que muestra 50 publicaciones, eso son 51 consultas. Usa siempre DataLoader para la resolución de relaciones en GraphQL — es la ganancia de rendimiento más grande de todas.
- **Sobre-obtención en los resolutores.** El punto completo de GraphQL es que los clientes soliciten solo lo que necesitan. Si tu resolutor carga toda la tabla de la base de datos y la convierte toda a tipos de Strawberry, perdiste la ganancia de eficiencia. Filtra y pagina en el resolutor.
- **Suscripciones que mantienen conexiones abiertas.** Cada suscripción mantiene una conexión WebSocket. Si tienes miles de suscriptores concurrentes, necesitas escalado horizontal (Redis pub/sub o un broker de mensajes) — un solo servidor no puede mantener miles de conexiones persistentes de forma eficiente.
- **Olvidar que los errores de GraphQL no detienen la ejecución.** Un resolutor de campo que lanza una excepción devuelve `null` para ese campo más un error en el arreglo `errors` — el resto de la consulta todavía devuelve datos. Esto es diferente de REST, donde un 500 mata toda la respuesta.
- **Introspección en producción.** La introspección de GraphQL deja que cualquiera descubra todo el esquema de tu API. En producción, deshabilítala a menos que estés construyendo una API pública.

## Lo que acabas de construir

Un servidor completo de API GraphQL: un esquema con tipos y consultas, resolutores que obtienen datos de un almacén en memoria, agrupamiento DataLoader para prevenir consultas N+1, suscripciones en tiempo real para actualizaciones en vivo y un playground interactivo para probar. La arquitectura — diseño esquema-primero, resolutor-por-campo, DataLoader para el agrupamiento — es el mismo patrón que usan los servidores GraphQL en producción en empresas como GitHub, Shopify y Airbnb.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/graphql-server/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/graphql-server) en el repositorio del curso tiene una versión más rica con mutaciones, un backend de base de datos real y el DataLoader conectado de extremo a extremo. Clónalo, o abre todo el repositorio en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), y ejecútalo desde ahí.
:::

## A dónde ir desde aquí

- Añade una mutación `createPost` que acepte `title`, `body` y `authorId`, guarde la publicación nueva y dispare la suscripción `post_published`.
- Implementa paginación con paginación estilo relay basada en cursores (argumentos `first`, `after`) para que los conjuntos de resultados grandes se carguen en fragmentos.
- Añade middleware de autenticación que verifique un token Bearer en cada solicitud y exponga al usuario actual a los resolutores vía el `info.context`.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo y amigable para principiantes sobre cómo agregar el tuyo vía un **pull request**, incluso si nunca has usado git antes: hacer fork del repositorio, crear una rama, confirmar tus archivos y abrir el PR, un paso a la vez. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓