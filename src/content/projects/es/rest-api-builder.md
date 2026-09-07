---
title: "Constructor de API REST"
description: "Genera APIs REST listas para producción a partir de un esquema YAML con autenticación, validación y documentación."
difficulty: "advanced"
estimatedMinutes: 120
tags: ["fastapi", "pydantic", "rest-api", "jwt", "openapi"]
learningObjectives:
  - "Analiza esquemas YAML y construye dataclasses de Python a partir de ellos"
  - "Genera rutas de FastAPI dinámicamente desde definiciones de recursos"
  - "Implementa autenticación JWT con control de acceso basado en roles"
  - "Prueba los endpoints de la API con httpx y el TestClient de FastAPI"
prerequisites:
  - "Conceptos básicos de Python y POO intermedia"
  - "Familiaridad con métodos HTTP y conceptos REST"
  - "Comprensión de formatos JSON y YAML"
---

# 🛠️ 🚀 Construye un Constructor de API REST

La mayoría de las APIs del mundo real siguen el mismo patrón: recursos con endpoints CRUD, autenticación, validación y documentación. Escribir cada una a mano se vuelve tedioso rápido — este proyecto construye un generador de código que lee un esquema YAML y produce una aplicación FastAPI completa con autenticación JWT, validación Pydantic y documentación OpenAPI autogenerada, para que definas tu API una vez en YAML y obtengas un servidor funcional.

Esto asume conceptos básicos de Python, POO intermedia y suficiente conocimiento de HTTP para saber qué hace una solicitud POST — nada de Análisis de Datos se requiere. Es opcional y no calificado; consulta [Proyectos del mundo real](/docs/projects) para la lista completa y creciente.

## 🎯 Lo que harás

1. Definir recursos de API en un esquema YAML y analizarlos en dataclasses de Python.
2. Generar modelos Pydantic a partir del esquema para la validación automática de solicitudes.
3. Implementar autenticación JWT con `python-jose` y `passlib`.
4. Construir rutas CRUD dinámicamente con comprobaciones de permisos basadas en roles.
5. Probar toda la API de punta a punta con `httpx` y el `TestClient` de FastAPI.

## Dónde ejecutar esto

**Localmente con `uv`** es el único camino práctico — FastAPI necesita un servidor real (uvicorn) para ejecutarse, lo que significa una terminal real y un sistema de archivos real. Ningún parque de juegos basado en navegador puede alojar un servidor ASGI en ejecución.

**GitHub Codespaces** funciona bien: abre [todo el repositorio del curso en un Codespace gratuito](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python y `uv` ya están instalados) y ejecuta los mismos comandos exactos de `uv` desde una terminal.

**Google Colab** puede probar endpoints individuales con `nest_asyncio`, pero es una solución improvisada, no un encaje natural — sin servidor persistente, sin sistema de archivos real para tu proyecto. Úsalo para probar cosas, no para construir.

## Configuración

Todo lo que necesitas antes de escribir una línea de la propia API: un Python real, los paquetes correctos y una carpeta de proyecto funcional.

### Instala `uv`

`uv` es una sola herramienta que reemplaza la cadena habitual de "instalar Python, luego instalar pip, luego instalar una herramienta de entorno virtual, luego instalar paquetes" — puede instalar y gestionar versiones de Python por sí misma, junto con las dependencias de tu proyecto.

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Cierra y vuelve a abrir tu terminal, luego confirma que se instaló:

```bash
uv --version
```

### Configura el proyecto

```bash
uv init rest-api-builder
cd rest-api-builder
uv add fastapi uvicorn pyyaml pydantic python-jose[cryptography] passlib[bcrypt] httpx
```

`fastapi` es el framework web; `uvicorn` es el servidor ASGI que lo ejecuta; `pyyaml` analiza tu esquema; `pydantic` maneja la validación de solicitud/respuesta; `python-jose` y `passlib` manejan los tokens JWT y el hash de contraseñas; `httpx` es el cliente HTTP asíncrono que usarás para probar endpoints.

**✅ Lista de verificación**

- ✅ `uv --version` imprime un número de versión.
- ✅ `rest-api-builder/` existe con un `pyproject.toml`, y los seis paquetes están instalados.
- ✅ Puedes ejecutar `uv run python -c "import fastapi; print(fastapi.__version__)"` sin errores.

## Paso 1: Analiza un esquema YAML en dataclasses de Python

Toda API empieza con una forma: qué recursos existen, qué campos tiene cada uno y quién puede hacer qué con ellos. Un esquema YAML captura esa forma en una forma legible y editable por humanos — y analizarlo en dataclasses de Python es el puente entre una config de texto plano y el código real que genera rutas.

### 1.1 Define y analiza el esquema

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

**👟 Pista inicial:** Pega este bloque tal cual — el string `SCHEMA_YAML` define dos recursos (`user` y `post`) con campos, tipos y reglas de permiso. `yaml.safe_load` analiza el YAML en un dict simple, y las dos dataclasses (`FieldDef`, `ResourceDef`) te dan acceso tipado a cada pieza. El bucle de abajo imprime lo analizado para que puedas verificar que coincide con el YAML.

**🎯 Resultado esperado:**
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

**🩹 Si sale mal:** Un `yaml.YAMLError` significa que el string YAML tiene un problema de sintaxis — comprueba la indentación y los dos puntos. Un `KeyError: 'resources'` significa que el YAML cargó pero no tenía la clave de nivel superior que tu código espera — verifica que la clave externa `resources:` está presente. Si faltan campos, el valor por defecto `get("fields", {})` está vacío, así que la estructura del YAML importa.

### 1.2 Verifica el análisis del esquema

**✅ Lista de verificación**

- ✅ `parse_schema(SCHEMA_YAML)` devuelve un dict con dos claves: `"user"` y `"post"`.
- ✅ Cada `ResourceDef` tiene el número correcto de entradas `FieldDef` (3 para user, 3 para post).
- ✅ El dict de permisos mapea cada acción (`"create"`, `"read"`, etc.) a una lista de roles.

**🤔 Pregunta(s) socrática(s)**

- ¿Qué pasaría si añadieras un tercer recurso al YAML (digamos `comment`) y volvieras a ejecutar `parse_schema` — necesitaría cambiar algún código fuera del propio string YAML? ¿Por qué es deseable?
- El YAML usa `unique: true` en `email`. Tu `FieldDef` almacena esto como un bool, pero nada en el código impone la unicidad todavía. ¿Dónde en el pipeline de la API añadirías esa comprobación, y por qué es mejor atraparla ahí que a nivel de la base de datos?

## Paso 2: Genera modelos Pydantic a partir del esquema

Los modelos Pydantic son lo que FastAPI usa para validar las solicitudes entrantes y las respuestas salientes — convierten JSON suelto en objetos Python tipados y comprobados. Construirlos dinámicamente a partir de tu esquema significa que añadir un nuevo recurso al YAML genera automáticamente la validación correcta sin tocar código Python.

### 2.1 Construye el generador de modelos

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

**👟 Pista inicial:** La llamada `type(...)` crea una clase de modelo Pydantic dinámicamente — `type("CreateUser", (BaseModel,), {"__annotations__": {...}})` es exactamente lo que hace `class CreateUser(BaseModel): ...`, pero el cuerpo de la clase viene del esquema en lugar de código escrito a mano. Los campos requeridos obtienen `...` (elipsis) como valor por defecto, que Pydantic trata como "este campo es obligatorio".

**🎯 Resultado esperado:**
```
user: CreateUser fields = ['name', 'email', 'role']
post: CreatePost fields = ['title', 'content', 'author_id']
```

**🩹 Si sale mal:** Si a `CreateUser` le faltan campos, la búsqueda en `TYPE_MAP` podría haberse degradado silenciosamente a `str` para un tipo no reconocido. Comprueba los valores `type:` de tu YAML contra el mapa. Si FastAPI se queja de la validación más tarde, la ramificación `(ftype, ...)` vs `(ftype | None, None)` es la parte a inspeccionar — un campo requerido sin `...` se vuelve opcional por accidente.

### 2.2 Verifica la generación de modelos

**✅ Lista de verificación**

- ✅ `generate_pydantic_models(resources)` devuelve dos clases de modelo: `CreateUser` y `CreatePost`.
- ✅ Cada modelo tiene exactamente los campos definidos en el esquema YAML.
- ✅ Los campos requeridos lanzan un `ValidationError` si se omiten; los campos opcionales se comportan por defecto como `None`.

**🤔 Pregunta(s) socrática(s)**

- ¿Qué se rompería si añadieras un campo con `type: datetime` al YAML? ¿Cómo extenderías `TYPE_MAP` para manejarlo?
- El `BaseModel` de Pydantic valida al instanciar. ¿Por qué es esto mejor que validar dentro de cada manejador de ruta, donde llamarías `model(**payload)` manualmente?

## Paso 3: Implementa la autenticación JWT

La autenticación separa "cualquiera puede usar esto" de "solo los usuarios conectados pueden usar esto". Los tokens JWT son el estándar para la autenticación de API sin estado: el servidor firma un token con una clave secreta, el cliente lo envía de vuelta en cada solicitud, y el servidor lo verifica sin una búsqueda en la base de datos.

### 3.1 Configura la creación y verificación de tokens

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

**👟 Pista inicial:** `create_token` empaqueta un dict (nombre de usuario, rol) en un JWT firmado con un vencimiento de 30 minutos. `verify_token` es una dependencia de FastAPI — `Depends(security)` significa que FastAPI lee el encabezado `Authorization: Bearer <token>` automáticamente y pasa el payload decodificado a cualquier ruta que declare `user=Depends(verify_token)`.

**🎯 Resultado esperado:** `SECRET_KEY` imprime sus primeros 8 caracteres. Crear un token y decodificarlo inmediatamente hace un round-trip sin error.

**🩹 Si sale mal:** Un `jose.JWTError` al decodificar significa que el token se firmó con una clave diferente — `secrets.token_hex(32)` genera una clave nueva cada vez que el módulo carga, así que los tokens de una ejecución anterior no se decodificarán. Un `403` de FastAPI (no `401`) significa que el encabezado `Authorization` falta por completo — el cliente no está enviando ningún token.

### 3.2 Verifica la autenticación

**✅ Lista de verificación**

- ✅ `create_token({"sub": "alice", "role": "admin"})` devuelve un string que `verify_token` puede decodificar de vuelta al mismo dict.
- ✅ Un token firmado con un `SECRET_KEY` diferente lanza `HTTPException(401)`.
- ✅ Puedes explicar por qué `secrets.token_hex(32)` se genera al cargar el módulo, no dentro de `create_token`.

**🤔 Pregunta(s) socrática(s)**

- Los tokens JWT llevan su vencimiento en el propio token (la reclamación `exp`). ¿Qué pasa si el token de un usuario vence a mitad de una solicitud? ¿Es un problema, y cómo lo manejaría una app real?
- Este proyecto no almacena contraseñas de usuarios — `verify_token` comprueba la firma del token, no una base de datos. ¿Qué necesitarías añadir si quisieras soportar también el inicio de sesión basado en contraseña?

## Paso 4: Construye rutas CRUD con acceso basado en roles

El núcleo de la API: generar dinámicamente endpoints POST, GET y DELETE para cada recurso del esquema, con comprobaciones de permiso que impiden que un viewer cree posts o que un no-admin elimine usuarios.

### 4.1 Crea la app y la ruta de inicio de sesión

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

**👟 Pista inicial:** La ruta de inicio de sesión está codificada a mano para un usuario con fines de demo — en una app real harías hash de las contraseñas con `passlib` y comprobarías contra una base de datos. El punto clave: `/login` devuelve un token JWT, que cada solicitud posterior envía en el encabezado `Authorization`.

**🎯 Resultado esperado:** `POST /login?username=admin&password=secret` devuelve `{"access_token": "eyJ..."}`.

**🩹 Si sale mal:** Si el inicio de sesión devuelve `401` para credenciales correctas, comprueba la URL — `username` y `password` son parámetros de consulta aquí, no un cuerpo JSON. Si el token parece truncado, `secrets.token_hex(32)` genera 64 caracteres hexadecimales; el propio JWT será mucho más largo (encabezado + payload + firma).

### 4.2 Genera rutas CRUD a partir del esquema

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

**👟 Pista inicial:** `generate_crud_routes` es una función que *define y registra* rutas de FastAPI — `@app.post(f"/{name}")` se llama dentro de la función, no en el nivel superior. Esta es la parte de generación dinámica: un bucle sobre `resources.values()` crea todas las rutas POST/GET/DELETE tanto para `user` como para `post`. Cada ruta declara `user=Depends(verify_token)` para que FastAPI ejecute la comprobación de auth antes de ejecutar el cuerpo de la ruta.

**🎯 Resultado esperado:** `POST /user` crea un usuario (con un token), `GET /user` lista todos los usuarios, `DELETE /user/1` elimina el usuario con id 1. Una solicitud sin un token válido obtiene un `401`.

**🩹 Si sale mal:** Un `405 Method Not Allowed` significa que la ruta coincide pero el método HTTP no — comprueba si estás enviando GET a un endpoint solo-POST. Un `403 Insufficient permissions` significa que el campo `role` del token no está en la lista de permisos del recurso — comprueba la sección `permissions` del YAML y qué rol lleva tu token. Si el dict `db` está vacío entre solicitudes, estás ejecutando el servidor fuera del proceso de este script — `db` está en memoria y se reinicia cuando el proceso se reinicia.

### 4.3 Verifica las rutas CRUD

**✅ Lista de verificación**

- ✅ `POST /user` con un token de admin válido devuelve un usuario con un `id` auto-incrementado.
- ✅ `GET /user` lista todos los usuarios creados.
- ✅ `DELETE /user/1` con un token de admin devuelve `{"deleted": true}`.
- ✅ Un token de rol viewer golpeando `POST /user` obtiene un `403 Insufficient permissions`.

**🤔 Pregunta(s) socrática(s)**

- El dict `db` está en memoria — ¿qué le pasa a tus datos cuando reinicias el servidor? ¿Por qué lo intercambiarías en una aplicación real?
- ¿Por qué `generate_crud_routes` toma un objeto `ResourceDef` en lugar de solo un string con el nombre del recurso? ¿Qué información faltaría si solo tuviera el nombre?

## Paso 5: Prueba la API de punta a punta

El `TestClient` de FastAPI te deja golpear cada endpoint sin iniciar un servidor real — ejecuta la app en-proceso y devuelve objetos de respuesta estilo `httpx`. Esta es la comprobación de "¿de verdad funciona?".

### 5.1 Ejecuta la secuencia de prueba completa

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

**👟 Pista inicial:** `TestClient(app)` envuelve toda la app FastAPI — puedes hacer `POST` a `/login`, tomar el token y luego golpear cada otro endpoint con ese token en los encabezados. Ejecútalo como un solo script: el inicio de sesión ocurre primero, luego cada prueba se construye sobre la salida de la anterior.

**🎯 Resultado esperado:**
```
Created user: {'id': 1, 'name': 'Alice', 'email': 'alice@example.com', 'role': 'admin'}
Users: [{'id': 1, 'name': 'Alice', 'email': 'alice@example.com', 'role': 'admin'}]
Created post: {'id': 1, 'title': 'Hello World', 'content': 'My first post', 'author_id': 1}
Unauthorized: 401
```

**🩹 Si sale mal:** Un `422 Unprocessable Entity` significa que la validación automática de FastAPI rechazó el cuerpo de la solicitud — comprueba que las claves JSON coinciden exactamente con los campos del modelo Pydantic. Un `401` en los pasos de crear/listar significa que el token no se pasó correctamente — verifica el formato `Authorization: Bearer <token>`, no solo `Authorization: <token>`. Si `Users` devuelve `[]` en lugar del usuario creado, el dict `db` no se compartió entre las rutas de inicio de sesión y de creación — confirma que todas están en el mismo archivo de script.

### 5.2 Verifica la punta a punta

**✅ Lista de verificación**

- ✅ La secuencia completa se ejecuta sin errores: inicio de sesión, crear usuario, listar usuarios, crear post, probar acceso no autorizado.
- ✅ La solicitud no autorizada devuelve `401`, no `403` o `200`.
- ✅ Los elementos creados tienen campos `id` auto-incrementados que empiezan en 1.

**🤔 Pregunta(s) socrática(s)**

- Probaste con un token de admin. ¿Qué cambiaría si crearas un segundo token con `{"role": "viewer"}` e intentaras `POST /user` — qué respuesta esperarías, y por qué es importante probar ambos roles?
- `TestClient` se ejecuta en-proceso sin HTTP real. ¿Cuál es una cosa del comportamiento de tu API que esta prueba *no puede* atrapar y que un cliente `httpx` real contra un servidor en ejecución sí podría?

## ⚠️ Errores comunes

- **`secrets.token_hex(32)` se regenera en cada carga de módulo.** Los tokens firmados con una clave no se decodificarán con la clave de la siguiente ejecución — esto es correcto para desarrollo (te obliga a re-iniciar sesión cada vez) pero se rompería en producción donde la clave debe persistir. Usa un secreto fijo de una variable de entorno para cualquier cosa más allá de las pruebas locales.
- **`db` en memoria pierde todo al reiniciar.** El dict `db` es una conveniencia de enseñanza, no una solución de almacenamiento. Si estás probando persistencia (p. ej., "crea un usuario, reinicia el servidor, comprueba que se fue"), ese es el comportamiento esperado — no un bug.
- **Falta `status_code=201` en las rutas POST.** FastAPI se comporta por defecto como `200 OK`. La especificación HTTP dice que `201 Created` es correcto para la creación de recursos — olvidarlo hace que las respuestas de tu API sean técnicamente incorrectas y más difíciles de probar con clientes que comprueban códigos de estado.
- **Parámetros de consulta vs cuerpo JSON para `/login`.** La demo usa parámetros de consulta (`/login?username=admin&password=secret`) por simplicidad, pero las APIs reales envían las credenciales en un cuerpo JSON. Cambiarlo requiere cambiar la firma de la función para aceptar un modelo Pydantic en su lugar — un ejercicio útil pero un cambio que rompe la secuencia de prueba.

## Lo que acabas de construir

Un generador de código que convierte un esquema YAML legible por humanos en una aplicación FastAPI funcional — autenticado con JWT, validado con Pydantic y autodocumentado. No escribiste a mano una sola ruta; el esquema impulsó todo. Este es el mismo patrón detrás de los generadores de API reales: una forma declarativa, un generador de código y la aplicación en tiempo de ejecución de las reglas que declaraste.

:::tip[Ejecuta una versión más completa sin configuración local]
[`examples/rest-api-builder/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/rest-api-builder) en el repositorio del curso es una versión más completa del código de arriba, con documentación OpenAPI habilitada, hash de contraseñas con `passlib` y endpoints adicionales para actualizaciones PUT y filtrado por consulta. Clónalo, o abre todo el repositorio en un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) y ejecútalo desde ahí.
:::

## A dónde ir desde aquí

- Añade un endpoint `PUT /{resource}/{id}` que valide el cuerpo de la solicitud contra el esquema del recurso y devuelva el elemento actualizado — la función `generate_crud_routes` es exactamente donde va esto.
- Añade parámetros de consulta al endpoint de lista (`GET /user?role=admin`) para que los usuarios puedan filtrar por cualquier campo sin escribir código nuevo — el esquema ya sabe qué campos existen y sus tipos.
- Prueba añadir un tercer recurso al YAML (digamos `comment` con `text`, `author_id` y `post_id`) y observa cómo crece la API sin tocar ningún Python — ese es el pago del enfoque impulsado por esquema.

## Comparte tu proyecto con la clase

¿Construiste algo de lo que estás orgulloso? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) es una galería de proyectos que otros estudiantes han enviado — y su README tiene un recorrido completo, amigable para principiantes, para agregar el tuyo vía un **pull request**, incluso si nunca usaste git antes: hacer fork del repo, crear una rama, commitear tus archivos y abrir el PR, paso a paso. No se asume experiencia previa con git.

Bienvenido a escribir Python fuera del navegador. 🎓
