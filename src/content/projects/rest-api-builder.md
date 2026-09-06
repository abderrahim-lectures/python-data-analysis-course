---
title: "REST API Builder"
description: "Scaffold production-ready REST APIs from a YAML schema with auth, validation, and docs."
difficulty: "advanced"
estimatedMinutes: 120
tags: ["fastapi", "pydantic", "rest-api", "jwt", "openapi"]
learningObjectives:
  - Define API schemas in YAML and parse them with Python
  - Build FastAPI routes with automatic validation and documentation
  - Implement JWT authentication and role-based access control
  - Generate OpenAPI docs and test endpoints with httpx
prerequisites:
  - "Python basics and intermediate OOP"
  - "Familiarity with HTTP methods and REST concepts"
  - "Understanding of JSON and YAML formats"
---

## What You'll Learn

- Parse YAML schemas and generate FastAPI routes from them
- Validate request and response bodies with Pydantic models
- Implement JWT authentication with role-based access control
- Generate interactive OpenAPI documentation automatically
- Test API endpoints programmatically with httpx

## What You'll Build

A code generator that reads a YAML schema and produces a complete FastAPI application with CRUD endpoints, JWT auth, Pydantic validation, and OpenAPI docs. Includes a working user and post management API as the demo output.

## Where to Run It

- **Local with `uv`**: Required — FastAPI needs a server to run
- **JupyterLite**: Not suitable (requires uvicorn server)
- **Google Colab**: Works with `nest_asyncio` for testing

## Setup

```bash
uv init rest-api-builder
cd rest-api-builder
uv add fastapi uvicorn pyyaml pydantic python-jose[cryptography] passlib[bcrypt] httpx
```

## Step 1: Parse a YAML Schema

Define API resources in YAML, then load them into Python dataclasses.

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
            FieldDef(name=fname, field_type=fdef["type"], required=fdef.get("required", False),
                     unique=fdef.get("unique", False), default=fdef.get("default"), enum=fdef.get("enum"))
            for fname, fdef in res_config.get("fields", {}).items()
        ]
        resources[res_name] = ResourceDef(name=res_name, fields=fields, permissions=res_config.get("permissions", {}))
    return resources

resources = parse_schema(SCHEMA_YAML)
for name, res in resources.items():
    print(f"Resource: {name}")
    for f in res.fields:
        print(f"  - {f.name}: {f.field_type} (required={f.required})")
```

## Step 2: Generate Pydantic Models and FastAPI App

Turn the schema into Pydantic models, then build CRUD routes with JWT authentication.

```python
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from datetime import datetime, timedelta
import secrets

SECRET_KEY = secrets.token_hex(32)
ALGORITHM = "HS256"
security = HTTPBearer()
db: dict[str, list[dict]] = {"user": [], "post": []}
id_counter: dict[str, int] = {"user": 0, "post": 0}

TYPE_MAP = {"string": str, "integer": int, "boolean": bool, "float": float}

def generate_pydantic_models(resources):
    models = {}
    for res_name, res in resources.items():
        fields = {}
        for f in res.fields:
            ftype = TYPE_MAP.get(f.field_type, str)
            fields[f.name] = ((ftype, f.default) if f.default is not None
                              else (ftype, ...) if f.required
                              else (ftype | None, None))
        models[res_name] = type(f"Create{res_name.title()}", (BaseModel,), {"__annotations__": fields})
    return models

def create_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=30)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(creds: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        return jwt.decode(creds.credentials, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(401, "Invalid token")

app = FastAPI(title="Auto-Generated API", version="1.0.0")

@app.post("/login")
def login(username: str, password: str):
    if username == "admin" and password == "secret":
        return {"access_token": create_token({"sub": username, "role": "admin"})}
    raise HTTPException(401, "Invalid credentials")

def generate_crud_routes(resource):
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

## Step 3: Test the API

Use `httpx` to test your generated endpoints.

```python
from fastapi.testclient import TestClient

client = TestClient(app)

resp = client.post("/login?username=admin&password=secret")
token = resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Create and list users
resp = client.post("/user", json={"name": "Alice", "email": "alice@example.com", "role": "admin"}, headers=headers)
user = resp.json()
print(f"Created user: {user}")

resp = client.get("/user", headers=headers)
print(f"Users: {resp.json()}")

# Create a post
resp = client.post("/post", json={"title": "Hello World", "content": "My first post", "author_id": user["id"]}, headers=headers)
print(f"Created post: {resp.json()}")

# Test unauthorized access
resp = client.get("/user", headers={"Authorization": "Bearer bad_token"})
print(f"Unauthorized: {resp.status_code}")
```

## Challenges

<details>
<summary><strong>Challenge 1: PUT Endpoint</strong></summary>

Add a `PUT /{resource}/{id}` endpoint for full updates. Validate the request body against the resource schema and return the updated item.
</details>

<details>
<summary><strong>Challenge 2: Query Filtering</strong></summary>

Add query parameters to the list endpoint so users can filter by any field. For example, `GET /user?role=admin` should return only matching users.
</details>

<details>
<summary><strong>Challenge 3: Pagination</strong></summary>

Add `offset` and `limit` query parameters. Return `{"items": [...], "total": N, "offset": 0, "limit": 10}`.
</details>

## Stretch Goals

- [ ] Add rate limiting and request throttling
- [ ] Implement webhook support for event-driven architectures
- [ ] Build a CLI tool for API management and deployment

## What You Learned

- Parsed YAML schemas and generated Python dataclasses from them
- Built FastAPI routes dynamically from resource definitions
- Implemented JWT authentication with role-based access control
- Used Pydantic for automatic request validation and error handling
- Tested API endpoints programmatically with httpx and TestClient
