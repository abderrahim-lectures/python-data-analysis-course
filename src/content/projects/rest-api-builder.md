---
title: "Build a REST API Builder"
description: "Scaffold a production-ready REST API from a YAML schema — auto-generate FastAPI routes, JWT auth, Pydantic validation, and OpenAPI docs."
difficulty: "advanced"
estimatedMinutes: 120
tags: ["fastapi", "pydantic", "rest-api", "jwt", "openapi"]
learningObjectives:
  - Parse YAML schemas and build Python dataclasses from them
  - Generate FastAPI routes dynamically from resource definitions
  - Implement JWT authentication with role-based access control
  - Test API endpoints with httpx and FastAPI's TestClient
prerequisites:
  - "Python basics and intermediate OOP"
  - "Familiarity with HTTP methods and REST concepts"
  - "Understanding of JSON and YAML formats"
---

# 🛠️ 🚀 Build a REST API Builder

Most real-world APIs follow the same pattern: resources with CRUD endpoints, authentication, validation, and docs. Writing each one by hand gets tedious fast — this project builds a code generator that reads a YAML schema and produces a complete FastAPI application with JWT authentication, Pydantic validation, and auto-generated OpenAPI docs, so you define your API once in YAML and get a working server.

This assumes Python basics, intermediate OOP, and enough HTTP knowledge to know what a POST request does — nothing from Data Analysis is required. It's optional and ungraded; see [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Define API resources in a YAML schema and parse them into Python dataclasses.
2. Generate Pydantic models from the schema for automatic request validation.
3. Implement JWT authentication with `python-jose` and `passlib`.
4. Build CRUD routes dynamically with role-based permission checks.
5. Test the entire API end to end with `httpx` and FastAPI's `TestClient`.

## Where to run this

**Locally with `uv`** is the only practical path — FastAPI needs a real server (uvicorn) to run, which means a real terminal and a real file system. No browser-based playground can host a running ASGI server.

**GitHub Codespaces** works well: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed) and run the exact same `uv` commands from a terminal.

**Google Colab** can test individual endpoints with `nest_asyncio`, but it's a workaround, not a natural fit — no persistent server, no real file system for your project. Use it to try things, not to build.

## Setup

Everything you need before writing a line of the API itself: a real Python, the right packages, and a working project folder.

### Install `uv`

`uv` is a single tool that replaces the usual "install Python, then install pip, then install a virtual environment tool, then install packages" chain — it can install and manage Python versions itself, alongside your project's dependencies.

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Close and reopen your terminal, then confirm it installed:

```bash
uv --version
```

### Set up the project

```bash
uv init rest-api-builder
cd rest-api-builder
uv add fastapi uvicorn pyyaml pydantic python-jose[cryptography] passlib[bcrypt] httpx
```

`fastapi` is the web framework; `uvicorn` is the ASGI server that runs it; `pyyaml` parses your schema; `pydantic` handles request/response validation; `python-jose` and `passlib` handle JWT tokens and password hashing; `httpx` is the async HTTP client you'll use to test endpoints.

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `rest-api-builder/` exists with a `pyproject.toml`, and all six packages are installed.
- ✅ You can run `uv run python -c "import fastapi; print(fastapi.__version__)"` without errors.

## Step 1: Parse a YAML schema into Python dataclasses

Every API starts with a shape: what resources exist, what fields each one has, and who can do what with them. A YAML schema captures that shape in a readable, human-editable form — and parsing it into Python dataclasses is the bridge between a plain-text config and actual code that generates routes.

### 1.1 Define and parse the schema

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

**👟 Starter hint:** Paste this block as-is — the `SCHEMA_YAML` string defines two resources (`user` and `post`) with fields, types, and permission rules. `yaml.safe_load` parses the YAML into a plain dict, and the two dataclasses (`FieldDef`, `ResourceDef`) give you typed access to each piece. The loop at the bottom prints what was parsed so you can verify it matches the YAML.

**🎯 Expected output:**
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

**🩹 If it's off:** A `yaml.YAMLError` means the YAML string has a syntax issue — check indentation and colons. A `KeyError: 'resources'` means the YAML loaded but didn't have the top-level key your code expects — verify the outer `resources:` key is present. If fields are missing, the `get("fields", {})` default is empty, so the YAML structure matters.

### 1.2 Verify the schema parse

**✅ Checklist**

- ✅ `parse_schema(SCHEMA_YAML)` returns a dict with two keys: `"user"` and `"post"`.
- ✅ Each `ResourceDef` has the correct number of `FieldDef` entries (3 for user, 3 for post).
- ✅ The permissions dict maps each action (`"create"`, `"read"`, etc.) to a list of roles.

**🤔 Socratic Question(s)**

- What would happen if you added a third resource to the YAML (say `comment`) and re-ran `parse_schema` — would any code outside the YAML string itself need to change? Why is that desirable?
- The YAML uses `unique: true` on `email`. Your `FieldDef` stores this as a bool, but nothing in the code enforces uniqueness yet. Where in the API pipeline would you add that check, and why is it better to catch it there rather than at the database level?

## Step 2: Generate Pydantic models from the schema

Pydantic models are what FastAPI uses to validate incoming requests and outgoing responses — they turn loose JSON into typed, checked Python objects. Dynamically building them from your schema means adding a new resource to the YAML automatically generates the right validation without touching Python code.

### 2.1 Build the model generator

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

**👟 Starter hint:** The `type(...)` call creates a Pydantic model class dynamically — `type("CreateUser", (BaseModel,), {"__annotations__": {...}})` is exactly what `class CreateUser(BaseModel): ...` does, but the class body comes from the schema instead of hand-written code. Required fields get `...` (ellipsis) as the default, which Pydantic treats as "this field is mandatory."

**🎯 Expected output:**
```
user: CreateUser fields = ['name', 'email', 'role']
post: CreatePost fields = ['title', 'content', 'author_id']
```

**🩹 If it's off:** If `CreateUser` is missing fields, the `TYPE_MAP` lookup might have silently fallen back to `str` for an unrecognized type. Check your YAML's `type:` values against the map. If FastAPI complains about validation later, the `(ftype, ...)` vs `(ftype | None, None)` branching is the part to inspect — a required field without `...` becomes optional by accident.

### 2.2 Verify the model generation

**✅ Checklist**

- ✅ `generate_pydantic_models(resources)` returns two model classes: `CreateUser` and `CreatePost`.
- ✅ Each model has exactly the fields defined in the YAML schema.
- ✅ Required fields raise a `ValidationError` if omitted; optional fields default to `None`.

**🤔 Socratic Question(s)**

- What would break if you added a field with `type: datetime` to the YAML? How would you extend `TYPE_MAP` to handle it?
- Pydantic's `BaseModel` validates on instantiation. Why is this better than validating inside each route handler, where you'd call `model(**payload)` manually?

## Step 3: Implement JWT authentication

Authentication separates "anyone can use this" from "only logged-in users can use this." JWT tokens are the standard for stateless API auth: the server signs a token with a secret key, the client sends it back on every request, and the server verifies it without a database lookup.

### 3.1 Set up token creation and verification

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

**👟 Starter hint:** `create_token` packs a dict (username, role) into a signed JWT with a 30-minute expiry. `verify_token` is a FastAPI dependency — `Depends(security)` means FastAPI reads the `Authorization: Bearer <token>` header automatically and passes the decoded payload to any route that declares `user=Depends(verify_token)`.

**🎯 Expected output:** `SECRET_KEY` prints its first 8 characters. Creating a token and immediately decoding it round-trips without error.

**🩹 If it's off:** A `jose.JWTError` on decode means the token was signed with a different key — `secrets.token_hex(32)` generates a new key each time the module loads, so tokens from a previous run won't decode. A `403` from FastAPI (not `401`) means the `Authorization` header is missing entirely — the client isn't sending a token at all.

### 3.2 Verify authentication

**✅ Checklist**

- ✅ `create_token({"sub": "alice", "role": "admin"})` returns a string that `verify_token` can decode back to the same dict.
- ✅ A token signed with a different `SECRET_KEY` raises `HTTPException(401)`.
- ✅ You can explain why `secrets.token_hex(32)` is generated at module load, not inside `create_token`.

**🤔 Socratic Question(s)**

- JWT tokens carry their expiry in the token itself (`exp` claim). What happens if a user's token expires mid-request? Is that a problem, and how would a real app handle it?
- This project stores no user passwords — `verify_token` checks the token's signature, not a database. What would you need to add if you wanted to support password-based login as well?

## Step 4: Build CRUD routes with role-based access

The core of the API: dynamically generating POST, GET, and DELETE endpoints for every resource in the schema, with permission checks that prevent a viewer from creating posts or a non-admin from deleting users.

### 4.1 Create the app and login route

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

**👟 Starter hint:** The login route is hardcoded to one user for demo purposes — in a real app you'd hash passwords with `passlib` and check against a database. The key point: `/login` returns a JWT token, which every subsequent request sends in the `Authorization` header.

**🎯 Expected output:** `POST /login?username=admin&password=secret` returns `{"access_token": "eyJ..."}`.

**🩹 If it's off:** If login returns `401` for correct credentials, check the URL — `username` and `password` are query parameters here, not a JSON body. If the token looks truncated, `secrets.token_hex(32)` generates 64 hex characters; the JWT itself will be much longer (header + payload + signature).

### 4.2 Generate CRUD routes from the schema

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

**👟 Starter hint:** `generate_crud_routes` is a function that *defines and registers* FastAPI routes — `@app.post(f"/{name}")` is called inside the function, not at the top level. This is the dynamic generation part: one loop over `resources.values()` creates all the POST/GET/DELETE routes for both `user` and `post`. Each route declares `user=Depends(verify_token)` so FastAPI runs the auth check before executing the route body.

**🎯 Expected output:** `POST /user` creates a user (with a token), `GET /user` lists all users, `DELETE /user/1` deletes the user with id 1. A request without a valid token gets a `401`.

**🩹 If it's off:** A `405 Method Not Allowed` means the route path matches but the HTTP method doesn't — check whether you're sending GET to a POST-only endpoint. A `403 Insufficient permissions` means the token's `role` field isn't in the resource's permission list — check the YAML's `permissions` section and what role your token carries. If the `db` dict is empty between requests, you're running the server outside this script's process — `db` is in-memory and resets when the process restarts.

### 4.3 Verify the CRUD routes

**✅ Checklist**

- ✅ `POST /user` with a valid admin token returns a user with an auto-incremented `id`.
- ✅ `GET /user` lists all created users.
- ✅ `DELETE /user/1` with an admin token returns `{"deleted": true}`.
- ✅ A viewer-role token hitting `POST /user` gets a `403 Insufficient permissions`.

**🤔 Socratic Question(s)**

- The `db` dict is in-memory — what happens to your data when you restart the server? What would you swap it for in a real application?
- Why does `generate_crud_routes` take a `ResourceDef` object rather than just a resource name string? What information would be missing if it only had the name?

## Step 5: Test the API end to end

FastAPI's `TestClient` lets you hit every endpoint without starting a real server — it runs the app in-process and returns `httpx`-style response objects. This is the "does it actually work?" check.

### 5.1 Run the full test sequence

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

**👟 Starter hint:** `TestClient(app)` wraps the whole FastAPI app — you can `POST` to `/login`, grab the token, and then hit every other endpoint with that token in the headers. Run this as a single script: the login happens first, then each test builds on the previous one's output.

**🎯 Expected output:**
```
Created user: {'id': 1, 'name': 'Alice', 'email': 'alice@example.com', 'role': 'admin'}
Users: [{'id': 1, 'name': 'Alice', 'email': 'alice@example.com', 'role': 'admin'}]
Created post: {'id': 1, 'title': 'Hello World', 'content': 'My first post', 'author_id': 1}
Unauthorized: 401
```

**🩹 If it's off:** A `422 Unprocessable Entity` means FastAPI's automatic validation rejected the request body — check that the JSON keys match the Pydantic model fields exactly. A `401` on the create/list steps means the token wasn't passed correctly — verify the `Authorization: Bearer <token>` format, not just `Authorization: <token>`. If `Users` returns `[]` instead of the created user, the `db` dict wasn't shared between the login and create routes — confirm they're all in the same script file.

### 5.2 Verify the end to end

**✅ Checklist**

- ✅ The full sequence runs without errors: login, create user, list users, create post, test unauthorized access.
- ✅ The unauthorized request returns `401`, not `403` or `200`.
- ✅ Created items have auto-incremented `id` fields starting at 1.

**🤔 Socratic Question(s)**

- You tested with an admin token. What would change if you created a second token with `{"role": "viewer"}` and tried to `POST /user` — what response would you expect, and why is testing both roles important?
- `TestClient` runs in-process with no real HTTP. What's one thing about your API's behavior that this test *can't* catch that a real `httpx` client against a running server could?

## ⚠️ Common pitfalls

- **`secrets.token_hex(32)` regenerates on every module load.** Tokens signed with one key won't decode with the next run's key — this is correct for development (it forces you to re-login each time) but would break in production where the key must persist. Use a fixed secret from an environment variable for anything beyond local testing.
- **In-memory `db` loses everything on restart.** The `db` dict is a teaching convenience, not a storage solution. If you're testing persistence (e.g., "create a user, restart the server, check it's gone"), that's the expected behavior — not a bug.
- **Missing `status_code=201` on POST routes.** FastAPI defaults to `200 OK`. The HTTP spec says `201 Created` is correct for resource creation — forgetting it makes your API's responses technically wrong and harder to test with clients that check status codes.
- **Query params vs JSON body for `/login`.** The demo uses query parameters (`/login?username=admin&password=secret`) for simplicity, but real APIs send credentials in a JSON body. Switching requires changing the function signature to accept a Pydantic model instead — a useful exercise but a breaking change to the test sequence.

## What you just built

A code generator that turns a human-readable YAML schema into a working FastAPI application — JWT-authenticated, Pydantic-validated, and auto-documented. You didn't hand-write a single route; the schema drove everything. This is the same pattern behind real API generators: a declarative shape, a code generator, and runtime enforcement of the rules you declared.

:::tip[Run a fuller version without any local setup]
[`examples/rest-api-builder/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/rest-api-builder) in the course repo is a fuller version of the code above, with OpenAPI docs enabled, password hashing with `passlib`, and additional endpoints for PUT updates and query filtering. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) and run it from there.
:::

## Where to go from here

- Add a `PUT /{resource}/{id}` endpoint that validates the request body against the resource schema and returns the updated item — the `generate_crud_routes` function is exactly where this goes.
- Add query parameters to the list endpoint (`GET /user?role=admin`) so users can filter by any field without writing new code — the schema already knows which fields exist and their types.
- Try adding a third resource to the YAML (say `comment` with `text`, `author_id`, and `post_id`) and watch the API grow without touching any Python — that's the payoff of the schema-driven approach.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓
