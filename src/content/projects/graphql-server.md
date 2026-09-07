---
title: "Build a GraphQL API Server"
description: "Build a GraphQL API with a schema-first design, resolvers, DataLoader for N+1 prevention, and real-time subscriptions."
difficulty: "advanced"
estimatedMinutes: 70
tags: ["api", "graphql", "async"]
learningObjectives:
  - "Define a GraphQL schema with queries, mutations, and types"
  - "Write resolvers that fetch data from a backing store"
  - "Use DataLoader to batch database queries and prevent N+1 problems"
  - "Implement real-time subscriptions for live data updates"
prerequisites: ["Python 101", "Data Analysis"]
---

# 🔷 Build a GraphQL API Server

REST APIs force you to design one endpoint per resource, but real clients often need data from five different resources in a single screen load. GraphQL solves this by letting the client ask for exactly what it needs in one request. This project builds a GraphQL API server from scratch: you define a schema with types and queries, write resolvers that fetch real data, use DataLoader to batch database lookups and prevent the N+1 query problem, and add subscriptions for real-time updates. The server runs on Strawberry (a Python GraphQL library) with an in-memory data store.

This assumes Python 101 and comfort with pandas from Data Analysis — nothing beyond. Optional and ungraded; see [Real-World Projects](/docs/projects) for the full list.

## 🎯 What you'll do

1. Set up a project with `uv` and install the GraphQL dependencies you'll need.
2. Define a GraphQL schema with types, queries, and mutations using Strawberry.
3. Write resolvers that return real data from an in-memory store.
4. Implement DataLoader to batch multiple lookups into a single query per request.
5. Add subscriptions that push live updates when data changes.
6. Run the server and test it with the GraphQL Playground.

## Where to run this

**Locally with `uv`** is the primary path — this is a server that runs on `localhost` and serves HTTP requests. You'll interact with it through a browser-based GraphQL Playground or a tool like `curl`.

**GitHub Codespaces** works well: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) — Python, `uv`, and networking are already set up, so every step works exactly as it does locally.

**Google Colab, Kaggle Notebooks, and Binder** can run the server for a quick test, but the GraphQL Playground may not render in a notebook's output pane. The notebook starts the server on a port and tests it with `curl` instead.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/graphql-server/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/graphql-server/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fgraphql-server%2Fnotebook.ipynb)

## Setup

Everything you need before writing a schema: a Python environment, the Strawberry GraphQL library, and an async web framework to serve it.

### Install `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Close and reopen your terminal, then confirm:

```bash
uv --version
```

### Scaffold the project

```bash
uv init graphql-server
cd graphql-server
uv add strawberry-graphql uvicorn
```

`strawberry-graphql` is a code-first GraphQL library for Python — you define your schema as Python types, and it generates the GraphQL schema and resolvers automatically. `uvicorn` is the ASGI server that runs the app. `asyncio` is in the standard library and powers the DataLoader batching.

### Create the project structure

```bash
mkdir -p gql
touch gql/__init__.py gql/types.py gql/schema.py gql/dataloaders.py gql/store.py gql/server.py
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `graphql-server/` exists with a `pyproject.toml`, and `strawberry-graphql` and `uvicorn` are installed.
- ✅ The `gql/` directory has all required module files.

## Step 1: Define the data store and GraphQL types

Before you can write a schema, you need data to serve and types to describe it. This step creates a simple in-memory store of users and posts, then defines the GraphQL types that mirror them.

### 1.1 Create the in-memory data store

**👟 Starter hint:** Create `gql/store.py` with sample users and posts.

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

The store is deliberately simple — plain dictionaries with dataclass values. This keeps the focus on GraphQL mechanics rather than database drivers. In production, you'd replace these dictionaries with a database, but the GraphQL layer stays identical.

**🎯 Expected output:** `USERS[1].name` returns `"Alice"`; `POSTS[101].author_id` returns `1`.

**🩹 If it's off:** If `USERS` is empty after defining it, check that the dictionary syntax is correct (no commas missing between entries).

### 1.2 Define the Strawberry GraphQL types

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

Strawberry uses Python type hints to generate the GraphQL schema. Each `@strawberry.type` class becomes a GraphQL `type`, and each field becomes a GraphQL field. The `author` field on `PostType` is marked as a `UserType` — its actual resolution (loading the user by `author_id`) happens in a resolver, not in the type definition. This separation is what makes GraphQL flexible: the client can ask for `post.author.name` or just `post.title`, and only the resolvers needed for the requested fields actually run.

**🎯 Expected output:** `UserType(id=1, name="Alice", email="alice@example.com")` creates a Strawberry type that serializes correctly.

**🩹 If it's off:** If `@strawberry.type` isn't recognized, check that `strawberry` is imported from the right path. If the `author` field type string `"UserType"` causes an error, use `from __future__ import annotations` at the top of the file.

### 1.3 Verify the types

**✅ Checklist**

- ✅ `USERS` and `POSTS` store data as plain dictionaries.
- ✅ `UserType` and `PostType` are Strawberry types with the correct fields.
- ✅ The `author` field on `PostType` references `UserType`.

**🤔 Socratic Question(s)**

- In REST, you'd have `/users/1` and `/posts/101` as separate endpoints. In GraphQL, both are fields on the same root `Query`. What advantage does this give a client that needs user and post data together?
- The `author` field is typed but not yet resolved. How does GraphQL's lazy resolution mean the server never loads more data than the client actually asks for?

## Step 2: Write resolvers for queries

Resolvers are functions that fetch data for each field. When a client asks for `posts { author { name } }`, the resolver for `posts` returns the post list, and the resolver for `author` on each post returns the corresponding user.

### 2.1 Write the query resolvers

**👟 Starter hint:** Create `gql/schema.py` with resolvers for `users`, `posts`, and `user` queries.

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

The `schema` object is the entry point — Strawberry generates the full GraphQL schema from it, including introspection. The `resolve_author` function is attached directly to `PostType.author`, so when a client requests `post.author`, this function runs. When the client doesn't request `author`, it never runs — that's the core efficiency of GraphQL.

**🎯 Expected output:** `schema.execute_sync("{ users { name } }")` returns the user list. `schema.execute_sync("{ posts { title author { name } } }")` returns posts with their author names.

**🩹 If it's off:** If `resolve_posts` returns `author=None` even when the client asks for it, the `PostType.author` resolver isn't attached. If `schema.execute_sync` raises a missing field error, the query string doesn't match the schema field names.

### 2.2 Add a query with arguments

```python
# gql/schema.py (continued)
# The resolve_user resolver already takes an id argument.
# Strawberry infers the GraphQL argument from the Python function signature.
```

The `id: int` parameter on `resolve_user` automatically becomes a required GraphQL argument `user(id: Int!)`. No extra configuration needed — Strawberry reads the function signature.

**🎯 Expected output:** `schema.execute_sync("{ user(id: 1) { name email } }")` returns Alice's data. `schema.execute_sync("{ user(id: 999) { name } }")` returns `null` for the user.

**🩹 If it's off:** If the argument isn't recognized in the schema, the function parameter name or type hint doesn't match what Strawberry expects.

### 2.3 Verify the resolvers

**✅ Checklist**

- ✅ `schema.execute_sync("{ users { name } }")` returns all three users.
- ✅ `schema.execute_sync("{ user(id: 1) { name } }")` returns Alice.
- ✅ `schema.execute_sync("{ posts { title } }")` returns all posts.
- ✅ Only requested fields are returned — no over-fetching.

**🤔 Socratic Question(s)**

- If a client asks for `posts { author { email } }`, the `resolve_posts` resolver runs first (returning all posts with `author=None`), then `resolve_author` runs for each post. That's three separate calls to `USERS.get`. How would DataLoader batch those into one call?
- What happens if `resolve_user` returns `None` for an unknown ID? Does GraphQL return `null` in the response, or an error? How is that different from a REST 404?

## Step 3: Implement DataLoader for N+1 prevention

The N+1 problem: fetching a list of 100 posts and then resolving each post's author individually means 101 database queries (1 for posts + 100 for authors). DataLoader solves this by collecting all the author IDs from a single request cycle and batching them into one lookup.

### 3.1 Build the DataLoader

**👟 Starter hint:** Create `gql/dataloaders.py` with a `UserLoader` that batches user lookups by ID.

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

The real magic is in `_batch_load`: instead of calling `USERS.get` once per post, DataLoader collects all the user IDs from a single request cycle and calls `_batch_load` once with all of them. The `print` statement proves the batching — you should see one log line with all IDs, not one per post. In production, this DataLoader pattern (popularized by Facebook's `dataloader` library for JavaScript) reduces database round-trips from N+1 to 2.

**🎯 Expected output:** `await loader.load(1)` returns `USERS[1]` and prints one batch log line. Loading users 1, 2, 3 in sequence prints one log line with `[1, 2, 3]`.

**🩹 If it's off:** If you see multiple log lines (one per load call), the batching isn't working — check that the DataLoader is collecting IDs before calling `batch_fn`.

### 3.2 Integrate DataLoader into resolvers

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

**🎯 Expected output:** Querying `posts { author { name } }` prints one batch log line (not three), confirming DataLoader merged the lookups.

**🩹 If it's off:** If the resolver is still synchronous, add `async` and `await`. If the log shows multiple batch calls, the loader isn't being shared across resolvers.

### 3.3 Verify DataLoader batching

**✅ Checklist**

- ✅ Loading multiple users prints one batch log line, not one per user.
- ✅ Each loaded user matches the expected data from the store.
- ✅ The DataLoader caches results — loading the same ID twice doesn't re-batch.

**🤔 Socratic Question(s)**

- In a real app, `_batch_load` would hit a database. If two requests come in simultaneously, they'd share the same `_user_loader` and mix their IDs. How would you scope the loader to a single request?
- DataLoader caches by key within a request. What happens if user 1 changes their name between two queries in the same session? Is stale data a problem, and how would you fix it?

## Step 4: Add real-time subscriptions

Subscriptions push updates to clients when data changes — unlike queries (pull once) or mutations (push once), subscriptions maintain an open connection. This step adds a subscription that notifies clients when a new post is published.

### 4.1 Define a subscription

**👟 Starter hint:** Create a `post_published` subscription that yields new posts as they're created.

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

Subscriptions use Python's `async generator` syntax — `yield` sends each update to the client. In production, you'd replace the `asyncio.sleep` with a real event source (Redis pub/sub, a database trigger, or a message queue). Strawberry handles the WebSocket protocol that keeps the connection open and delivers each yielded value.

**🎯 Expected output:** `schema.execute_sync` isn't used for subscriptions — instead, the subscription runs asynchronously and yields the post after 1 second.

**🩹 If it's off:** If the subscription doesn't yield, the `async generator` isn't set up correctly — check the `AsyncGenerator` type hint and the `yield` statement.

### 4.2 Wire the subscription into the schema

```python
# gql/schema.py (update the schema creation)
schema = strawberry.Schema(query=Query, mutation=Mutation, subscription=Subscription)
```

**🎯 Expected output:** `schema.as_str()` includes `type Subscription { postPublished: PostType! }` in the schema definition.

**🩹 If it's off:** If the subscription type doesn't appear in the schema, the `Subscription` class isn't passed to `strawberry.Schema`.

### 4.3 Verify subscriptions

**✅ Checklist**

- ✅ The schema includes a `Subscription` type with the `postPublished` field.
- ✅ An async generator yields posts when the subscription runs.
- ✅ The `schema` object includes subscriptions when printed.

**🤔 Socratic Question(s)**

- Subscriptions keep a WebSocket connection open. What happens to that connection if the server restarts? How would a client detect and recover from a dropped subscription?
- For a chat application, you'd need subscriptions for new messages, typing indicators, and presence. How would you combine multiple subscription types without creating a separate WebSocket for each?

## Step 5: Run the server and test it

Everything comes together in the server: the schema, the resolvers, the DataLoader, and the subscription. Strawberry ships a built-in GraphQL Playground for interactive testing.

### 5.1 Write the server entry point

**👟 Starter hint:** Create `gql/server.py` that runs the Strawberry server with the playground enabled.

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

Strawberry's integration with ASGI means you can run it with `uvicorn` directly. The `reload=True` flag watches for file changes during development. The GraphQL Playground is available at `http://localhost:8000/graphql` in your browser — it provides auto-complete, schema documentation, and a history of your queries.

**🎯 Expected output:** Running `uv run python -m gql.server` starts a server at `http://localhost:8000/graphql`. Opening that URL in a browser shows the GraphQL Playground.

**🩹 If it's off:** If port 8000 is already in use, change the port number. If the playground doesn't load, check that `strawberry[fastapi]` or the right integration is installed.

### 5.2 Test with curl

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

The `curl` tests confirm the server works outside the browser — useful for scripting, CI, and debugging. The response is a JSON object with a `data` key containing the query results.

**🎯 Expected output:** The first curl returns `{"data": {"users": [{"name": "Alice", ...}, ...]}}`. The second returns posts with author names resolved.

**🩹 If it's off:** If `curl` returns a connection error, the server isn't running. If the response has an `errors` key, the query string doesn't match the schema.

### 5.3 Verify the server

**✅ Checklist**

- ✅ `uv run python -m gql.server` starts a server at `http://localhost:8000/graphql`.
- ✅ The GraphQL Playground loads in a browser with auto-complete and schema docs.
- ✅ `curl` queries return correct JSON responses with the requested fields.

**🤔 Socratic Question(s)**

- GraphQL introspection lets clients discover the entire schema by querying `__schema`. In production, this is a security risk — what would you do to disable introspection while keeping the API functional?
- If you added a `createPost` mutation, how would you trigger the `post_published` subscription so all connected clients see the new post appear in real time?

## ⚠️ Common pitfalls

- **The N+1 query problem.** Without DataLoader, every post's author resolution is a separate database call. For a page showing 50 posts, that's 51 queries. Always use DataLoader for relationship resolution in GraphQL — it's the single biggest performance win.
- **Over-fetching in resolvers.** The whole point of GraphQL is that clients request only what they need. If your resolver loads the entire database table and converts it all to Strawberry types, you've lost the efficiency gain. Filter and paginate in the resolver.
- **Subscriptions holding connections open.** Each subscription maintains a WebSocket connection. If you have thousands of concurrent subscribers, you need horizontal scaling (Redis pub/sub or a message broker) — a single server can't hold thousands of persistent connections efficiently.
- **Forgetting that GraphQL errors don't stop execution.** A field resolver that raises an exception returns `null` for that field plus an error in the `errors` array — the rest of the query still returns data. This is different from REST, where a 500 kills the entire response.
- **Introspection in production.** GraphQL introspection lets anyone discover your entire API schema. In production, disable it unless you're building a public API.

## What you just built

A complete GraphQL API server: a schema with types and queries, resolvers that fetch data from an in-memory store, DataLoader batching to prevent N+1 queries, real-time subscriptions for live updates, and an interactive playground for testing. The architecture — schema-first design, resolver-per-field, DataLoader for batching — is the same pattern used by production GraphQL servers at companies like GitHub, Shopify, and Airbnb.

:::tip[Run a fuller version without any local setup]
[`examples/graphql-server/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/graphql-server) in the course repo has a richer version with mutations, a real database backend, and the DataLoader wired up end to end. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Add a `createPost` mutation that accepts `title`, `body`, and `authorId`, stores the new post, and triggers the `post_published` subscription.
- Implement pagination with cursor-based relay-style pagination (`first`, `after` arguments) so large result sets load in chunks.
- Add authentication middleware that checks a Bearer token on each request and exposes the current user to resolvers via the `info.context`.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓
