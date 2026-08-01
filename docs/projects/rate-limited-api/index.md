---
id: rate-limited-api
title: "Build a Rate-Limited API Service"
sidebar_label: "Build a Rate-Limited API Service"
slug: /projects/rate-limited-api
description: "Graduate from the in-browser playground to real Python: build a FastAPI service wrapping your own dataset, with genuine API-key auth and a rate limiter you build from scratch."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Build a Rate-Limited API Service

<ProjectPublishedDate projectId="2027-rate-limited-api" />

<ProjectGreeting />

Every other project in this section builds a *client* of some kind — a script or agent that calls somebody else's API. This one flips that around: you build the API. This project stands up a real [FastAPI](https://fastapi.tiangolo.com/) service wrapping a dataset of a few hundred quotes and jokes that ships with the project, with the two things every real public API needs and toy examples usually skip — API-key authentication and rate limiting — built by hand, not imported from a library. It assumes Python 101; nothing from Data Analysis is required.

This is optional and ungraded; see [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. **Set up** a local FastAPI project with `uv` — no external API key needed, since this project ships its own dataset.
2. **Build** paginated `list`/`get` endpoints over a bundled dataset.
3. **Implement** filtering by category and author with query parameters.
4. **Build** real API-key issuance and a dependency that validates a key on protected endpoints.
5. **Implement** a from-scratch sliding-window rate limiter and **return** real `429 Too Many Requests` responses with a `Retry-After` header once a key exceeds its budget.

## Where to run this

**Locally with `uv`** is the primary, recommended path — this project's whole point is running a real, long-lived server process and hitting it with real HTTP requests, the same way any production API works.

**GitHub Codespaces** works well too: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed, per the repo's `.devcontainer/devcontainer.json`), run the server the same way you would locally, and forward the port — Codespaces usually prompts to do this automatically the moment `uvicorn` starts listening. Once forwarded, you can `curl` it from your own machine's terminal, or open the forwarded URL's `/docs` page in a browser, exactly as if it were running locally.

**Notebooks are a genuinely good fit here, unlike most other long-running-server projects in this series** — with a catch. A notebook cell can't hold open a real listening port the way Colab, Kaggle, and Binder sandbox networking, so it's a poor fit for *actually running* `uvicorn` and hitting it over real HTTP. But FastAPI ships a `TestClient` that talks to your `app` object directly, in-process, with no socket or port involved at all — the exact same routes, status codes, and headers, just invoked as Python function calls instead of network requests. That's a legitimately good notebook demo of the pagination, filtering, auth, and rate-limiting logic, and [`examples/rate-limited-api/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/rate-limited-api/notebook.ipynb) does exactly that:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/rate-limited-api/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/rate-limited-api/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Frate-limited-api%2Fnotebook.ipynb)

Treat the notebook as a way to *see* the API's behavior quickly, not a replacement for actually running `uvicorn` locally and firing real requests at it — the steps below do the real thing.

## Setup

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

Then set up a project and install FastAPI and a server to run it:

```bash
uv init rate-limited-api
cd rate-limited-api
uv add fastapi "uvicorn[standard]"
```

Notice what's *not* here: no API key to request, no free-tier signup, nothing to configure before your first request. This project ships its own dataset and issues its own keys — you're building the thing other projects in this series consume.

## Step 1: Bundle the dataset and build basic endpoints

Real APIs serve real data. Create `quotes_data.py` with a small, hand-written dataset — a plain Python list of dicts is enough; no database needed yet:

```python
# quotes_data.py
_RAW_QUOTES = [
    # (text, author, category)
    ("Programs must be written for people to read, and only incidentally for machines to execute.", "Harold Abelson", "programming"),
    ("The unexamined life is not worth living.", "Socrates", "wisdom"),
    ("Why do programmers prefer dark mode? Because light attracts bugs.", "Anonymous", "humor"),
    # ... a few hundred more, spanning several categories
]

QUOTES = [
    {"id": i, "text": text, "author": author, "category": category}
    for i, (text, author, category) in enumerate(_RAW_QUOTES, start=1)
]

CATEGORIES = sorted({q["category"] for q in QUOTES})
```

Write your own — a few dozen is enough to start, aim for a couple hundred by the time you're done, spanning at least three or four categories. Then create `main.py` with the app and two read endpoints:

```python
# main.py
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel

from quotes_data import QUOTES

app = FastAPI(title="Quotes API")


class QuoteOut(BaseModel):
    id: int
    text: str
    author: str
    category: str


class QuotesPage(BaseModel):
    items: list[QuoteOut]
    total: int
    limit: int
    offset: int


@app.get("/quotes", response_model=QuotesPage)
def list_quotes(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> QuotesPage:
    page = QUOTES[offset : offset + limit]
    return QuotesPage(items=[QuoteOut(**q) for q in page], total=len(QUOTES), limit=limit, offset=offset)


@app.get("/quotes/{quote_id}", response_model=QuoteOut)
def get_quote(quote_id: int) -> QuoteOut:
    for quote in QUOTES:
        if quote["id"] == quote_id:
            return QuoteOut(**quote)
    raise HTTPException(status_code=404, detail=f"No quote with id {quote_id}.")
```

Run it:

```bash
uv run uvicorn main:app --reload
```

Then in another terminal:

```bash
curl "http://127.0.0.1:8000/quotes?limit=3"
curl "http://127.0.0.1:8000/quotes/1"
curl -i "http://127.0.0.1:8000/quotes/99999"   # a real 404
```

`limit`/`offset` pagination is the same pattern behind almost every public REST API's list endpoint — it caps how much data one response can return (`le=100` here), and lets a client walk the full dataset page by page using `total` to know when to stop.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run uvicorn main:app --reload` starts without errors.</StepChecklistItem>
<StepChecklistItem>`GET /quotes?limit=3` returns exactly 3 items and a `total` matching your full dataset size.</StepChecklistItem>
<StepChecklistItem>`GET /quotes/{a-real-id}` returns that quote; `GET /quotes/99999` returns a real `404`, not a `500` or an empty `200`.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Why cap `limit` at 100 (`le=100`) instead of letting a client request all your quotes in one response? What would a client with a slow connection, or a malicious one, do differently if there were no cap?
- `get_quote` loops over the whole list to find one id. At a few hundred quotes this is instant; at a few million it wouldn't be. What data structure would make lookup by id fast regardless of dataset size?

## Step 2: Add filtering

Extend `list_quotes` with optional query parameters for category and author:

```python
@app.get("/categories", response_model=list[str])
def list_categories() -> list[str]:
    from quotes_data import CATEGORIES
    return CATEGORIES


@app.get("/quotes", response_model=QuotesPage)
def list_quotes(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    category: str | None = Query(default=None, description="Filter by exact category."),
    author: str | None = Query(default=None, description="Case-insensitive substring match on author."),
) -> QuotesPage:
    filtered = QUOTES
    if category is not None:
        filtered = [q for q in filtered if q["category"] == category]
    if author is not None:
        needle = author.lower()
        filtered = [q for q in filtered if needle in q["author"].lower()]

    page = filtered[offset : offset + limit]
    return QuotesPage(items=[QuoteOut(**q) for q in page], total=len(filtered), limit=limit, offset=offset)
```

```bash
curl "http://127.0.0.1:8000/quotes?category=science&limit=5"
curl "http://127.0.0.1:8000/quotes?author=sagan"
curl "http://127.0.0.1:8000/categories"
```

`total` in the response reflects the *filtered* count, not the whole dataset — that matters for a client trying to paginate through only the science quotes, which would otherwise think there are far more pages left than there actually are.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`?category=<a-real-category>` returns only quotes in that category, and `total` reflects the filtered count.</StepChecklistItem>
<StepChecklistItem>`?author=<partial-name>` matches case-insensitively (e.g. `sagan` matches `Carl Sagan`).</StepChecklistItem>
<StepChecklistItem>Combining `category` and `author` together narrows results further, not just one or the other.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- What should `GET /quotes?category=nonexistent` return — an empty list with `total: 0`, or a `404`? Which did you build, and why is that the more RESTful choice for a *collection* endpoint versus the single-item `GET /quotes/{id}`?
- If you added a second filter that also needs "any of several values" (e.g. multiple categories at once), how would you extend the query parameter to accept a list?

## Step 3: API-key issuance and validation

A real API needs to know who's calling it. Add self-service key issuance and a dependency that checks a key on protected routes:

```python
import secrets

from fastapi import Depends, Header

_VALID_KEYS: set[str] = set()


class ApiKeyResponse(BaseModel):
    api_key: str


@app.post("/keys", response_model=ApiKeyResponse)
def issue_api_key() -> ApiKeyResponse:
    new_key = secrets.token_urlsafe(24)
    _VALID_KEYS.add(new_key)
    return ApiKeyResponse(api_key=new_key)


def require_api_key(x_api_key: str | None = Header(default=None)) -> str:
    if x_api_key is None or x_api_key not in _VALID_KEYS:
        raise HTTPException(status_code=401, detail="Missing or invalid API key. Get one from POST /keys.")
    return x_api_key


@app.get("/me")
def whoami(api_key: str = Depends(require_api_key)) -> dict:
    return {"api_key": api_key}
```

`secrets.token_urlsafe` — not `random`, which isn't cryptographically secure — generates a key nobody can guess. `Depends(require_api_key)` is FastAPI's dependency-injection system: any route that takes `api_key: str = Depends(require_api_key)` as a parameter runs `require_api_key` first, and only proceeds if it returns successfully instead of raising.

```bash
curl -i "http://127.0.0.1:8000/me"                                   # 401, no key
curl -X POST "http://127.0.0.1:8000/keys"                            # {"api_key": "..."}
curl -i -H "X-API-Key: <your-key>" "http://127.0.0.1:8000/me"        # 200
```

:::tip[This in-memory key store forgets everything on restart, and that's fine here]
`_VALID_KEYS` lives in a plain Python `set` in this process's memory — restart the server and every previously issued key stops working. A real product would persist keys in a database (and store a *hash* of each key, not the raw value, the same way passwords are hashed — so a database leak doesn't leak usable keys directly). For a local learning project, the in-memory version is honest and sufficient; just don't be surprised when your key stops working after `--reload` restarts the process.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`GET /me` with no `X-API-Key` header returns a real `401`, with a body that says how to get a key.</StepChecklistItem>
<StepChecklistItem>`POST /keys` returns a new key every time you call it.</StepChecklistItem>
<StepChecklistItem>`GET /me` with a valid key in `X-API-Key` returns `200`; with a made-up key it still returns `401`.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- `require_api_key` reads the key from a custom `X-API-Key` header rather than a query parameter (`?api_key=...`). Query parameters routinely end up in server access logs and browser history. What does that suggest about which approach is safer for a secret value?
- Right now anyone can call `POST /keys` as many times as they like with no limit at all. Is that a problem for *this* project? What would you add if it were a real public service?

## Step 4: Real rate limiting

This is the actual point of the project. Build a sliding-window rate limiter that tracks each key's recent request timestamps and rejects requests once a key exceeds its budget within a window:

```python
# rate_limit.py
import time
from collections import defaultdict, deque


class SlidingWindowRateLimiter:
    def __init__(self, max_requests: int, window_seconds: float) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._history: dict[str, deque[float]] = defaultdict(deque)

    def check(self, key: str, now: float | None = None) -> tuple[bool, float]:
        now = time.monotonic() if now is None else now
        history = self._history[key]

        cutoff = now - self.window_seconds
        while history and history[0] <= cutoff:
            history.popleft()

        if len(history) < self.max_requests:
            history.append(now)
            return True, 0.0

        retry_after = history[0] + self.window_seconds - now
        return False, max(retry_after, 0.0)
```

Each key gets its own `deque` of timestamps, oldest first. On every check, timestamps older than `window_seconds` are dropped from the left before counting what's left — this is an **exact** sliding window, not a bucketed approximation that resets on a fixed clock boundary. That distinction matters: a *fixed*-window limiter (say, "reset the counter every 10 seconds on the clock") lets a client burst its full quota right at the end of one window and its full quota again right at the start of the next, getting up to 2x its intended rate in a couple of real seconds. Tracking actual timestamps avoids that.

Wire it into a dependency and use it on `/me`:

```python
from fastapi import Response

RATE_LIMIT_MAX_REQUESTS = 5
RATE_LIMIT_WINDOW_SECONDS = 10.0
limiter = SlidingWindowRateLimiter(RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_SECONDS)


def enforce_rate_limit(response: Response, api_key: str = Depends(require_api_key)) -> str:
    allowed, retry_after = limiter.check(api_key, now=time.monotonic())
    if not allowed:
        retry_after_seconds = str(int(retry_after) + 1)
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded: max {RATE_LIMIT_MAX_REQUESTS} per {int(RATE_LIMIT_WINDOW_SECONDS)}s.",
            headers={"Retry-After": retry_after_seconds},
        )
    response.headers["X-RateLimit-Limit"] = str(RATE_LIMIT_MAX_REQUESTS)
    return api_key


@app.get("/me")
def whoami(api_key: str = Depends(enforce_rate_limit)) -> dict:
    return {"api_key": api_key}
```

Notice the headers are set two different ways depending on the outcome — that's not a stylistic choice, it's required. Fire six requests in quick succession with the same key:

```bash
KEY=$(curl -s -X POST "http://127.0.0.1:8000/keys" | python3 -c "import sys,json;print(json.load(sys.stdin)['api_key'])")
for i in 1 2 3 4 5 6; do curl -s -o /dev/null -w "%{http_code}\n" -H "X-API-Key: $KEY" "http://127.0.0.1:8000/me"; done
```

The first five should print `200`; the sixth should print `429`. Check the headers on that last one:

```bash
curl -i -H "X-API-Key: $KEY" "http://127.0.0.1:8000/me"
```

:::tip[HTTPException headers, not `response.headers`, on the error path]
It's tempting to set `response.headers["Retry-After"] = ...` right before raising `HTTPException`, the same way the success path sets `X-RateLimit-Limit`. Don't — when FastAPI turns a raised `HTTPException` into an actual HTTP response, it builds a **fresh** response object from the exception, discarding whatever was written to the injected `response` parameter along the way. Any header that needs to appear on an error response has to be passed to `HTTPException(..., headers={...})` directly, or it silently never reaches the client. This bit the very first version of this lesson's own example code — verify your `429` actually carries `Retry-After` with `curl -i`, don't just trust that setting `response.headers` worked.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>The first `RATE_LIMIT_MAX_REQUESTS` requests from one key within the window succeed with `200`.</StepChecklistItem>
<StepChecklistItem>The next request from that same key, still inside the window, returns a real `429`.</StepChecklistItem>
<StepChecklistItem>The `429` response actually carries a `Retry-After` header — verified with `curl -i`, not assumed.</StepChecklistItem>
<StepChecklistItem>Waiting past the window and retrying succeeds again (the limit isn't permanent).</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Why key the rate limiter's history by API key rather than by IP address? What would change (for better or worse) if you keyed it by IP instead, especially for clients behind a shared corporate NAT?
- The limiter's `check` method takes `now` as an optional parameter instead of always calling `time.monotonic()` internally. What does that buy you when writing a test for it — try writing one that fakes time passing without an actual `time.sleep()`.

:::tip[This is a toy-scale limiter on purpose — production has a real answer]
`SlidingWindowRateLimiter` is genuinely correct, but it's also genuinely single-process: state lives in one Python dict, in one `uvicorn` worker. Run this behind two workers, or two server replicas behind a load balancer, and each one tracks its own independent count for the same key — a client could get up to N-times-instances the intended rate through. Production rate limiting for a multi-instance service almost always moves this state into something shared, like Redis (`INCR` with a `TTL` is a common building block), so every instance sees the same count. Libraries like [`slowapi`](https://github.com/laurentS/slowapi) exist specifically to wrap that pattern into a decorator — worth knowing about, even though this lesson deliberately built the interesting part by hand instead of importing it.
:::

## ⚠️ Common pitfalls

- **Setting headers on `response` before raising an `HTTPException`.** As covered above — they get discarded. Pass them to `HTTPException(headers={...})` instead.
- **Forgetting `raise_for_status`-style checks nowhere apply here — this project is the server, not the client.** It's easy to reflexively add error handling for *calling* an API when this project's whole point is *being* one; the errors that matter here are the ones your own endpoints return to callers (`401`, `404`, `429`), not ones you receive.
- **Using `random` instead of `secrets` for API keys.** `random` is not cryptographically secure and its output can, in principle, be predicted — `secrets.token_urlsafe()` is built specifically for security-sensitive tokens like this.
- **Testing rate limiting with requests spaced a second or more apart by hand.** Typing `curl` commands one at a time, waiting for each result, easily takes longer than a short rate-limit window — the window keeps sliding and you'll never see a `429`. Fire several requests back-to-back (a shell loop, or a short Python script) instead.
- **A rate limit so low it blocks normal browsing of `/quotes` while testing.** This lesson deliberately puts the rate limiter only on `/me`, not on the open `/quotes` endpoints, so you can browse the dataset freely while testing auth and limiting separately. Keep that separation in mind if you extend it.

## What you just built

A real REST API: paginated, filterable list and detail endpoints over a dataset you wrote yourself, self-service API-key issuance, a dependency that actually enforces auth, and a rate limiter you built line-by-line instead of importing — sliding-window logic, `429` responses, and a correct `Retry-After` header included. That's the same shape of API-key-plus-rate-limit design used by real public APIs everywhere, just without a third-party service standing behind it.

## Where to go from here

- Persist API keys (hashed, not raw) and rate-limit counters in a real datastore — SQLite for keys, Redis for the rate-limit counters — so both survive a restart and work correctly across more than one server process.
- Add per-key rate-limit tiers (a "free" key gets 5 requests per 10 seconds, a "pro" key gets 50) by storing a tier alongside each issued key and looking it up inside `enforce_rate_limit`.
- Actually deploy this somewhere reachable from outside your own machine (a small always-on host, or a serverless platform that supports ASGI apps) and hit it from a phone or a friend's machine — a project like this one is complete only once something other than `localhost` can call it.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓

<ProjectProgressCheckbox projectId="2027-rate-limited-api" />

