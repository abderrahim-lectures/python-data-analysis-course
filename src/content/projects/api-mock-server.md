---
title: "Build an API Mock Server"
description: "Turn a route table into a fake API: template paths become regex dispatchers, query strings and JSON bodies are reflected back, errors are simulated on a schedule, and every call is recorded for replay as a mini regression test."
difficulty: "intermediate"
estimatedMinutes: 90
xpReward: 100
tags: ["APIs", "Developer Tools", "Testing"]
prerequisites:
  - "Python functions, classes, and lambdas"
  - "JSON serialization and dict access"
  - "Very light regex: what a named group is"
learningObjectives:
  - "Compile route templates into regular expressions that extract path parameters"
  - "Dispatch requests to response factories with params, query strings, and bodies"
  - "Simulate failures with a counter-based flaky route and report a clean 404"
  - "Read, reflect, and validate a JSON POST body end to end"
  - "Record every call to a transcript and replay it to check response stability"
---

# 🛠️ 🎛️ Build an API Mock Server

Every real app is eventually blocked on a backend that isn't ready — a payment service with no sandbox, a weather feed that's down, a colleague's API still in design. A *mock server* is the honest substitute: it runs on your machine, speaks HTTP on localhost, and answers the same paths your real backend will, so your frontend, tests, and demo never wait on someone else's deploy. This project builds that server from scratch: route templates like `/users/<id>` become dispatchers that extract parameters, query strings and JSON bodies reflect back for inspection, a flaky route fails on a schedule, and a built-in recorder replays every call to catch regressions before production exists. It runs on the standard library. Every example in this guide is deterministic — the same dispatch returns the same JSON every time — so you can verify each claim as you build.

This assumes functions, classes, and JSON handling. It is an optional, ungraded project — see [Real-World Projects](/projects) for the full, growing list.

## 🎯 What you'll do

1. Compile route templates into regexes that capture path parameters.
2. Build a dispatcher that routes method + path to a response factory.
3. Reflect query strings and simulated failures, including a scheduled 500 and a clean 404.
4. Add a JSON echo endpoint that reads and returns a POST body.
5. Record every call to a transcript and replay it as a regression check.

## Where to run this

**Locally with `uv`** is the recommended path — the mock server is pure standard library (`http.server`, `http.client`, `urllib.parse`, `json`), so a `uv init` is all you need.

**Google Colab, Kaggle Notebooks, and Binder** run every step unmodified. Notebook networking is permissive enough for the in-process dispatcher parts; the final live-wire optional block also works on Binder and locally — keep it ephemeral (port `0`) so it never collides with another process.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/api-mock-server/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/api-mock-server/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fapi-mock-server%2Fnotebook.ipynb)

## Setup

Everything needed before the first request.

### Set up the project

```bash
uv init api-mock-server
cd api-mock-server
```

No dependencies. The pieces: a route table (method + template + response factory), a `MockAPI` dispatcher, and later a recorder.

**✅ Checklist**

- ✅ `uv init api-mock-server` creates the project and a `main.py`.
- ✅ `uv run python3 -c "import json, re, http.server"` succeeds — all standard library.

**🤔 Socratic Question(s)**

- A mock server returns *fake* data by definition. What still gives it integrity — the response shape, the status codes, the latency, or the *promise that it's deterministic*? Which of those can lull you into shipping something that breaks against the real backend?
- The mock advertises `{"status": "ok"}` on a route the real API hasn't built yet. If your frontend passes tests against the mock, what single property of the *real* backend could still break it — and where would a `version` field help?

## Step 1: Routes as templates

A route is three things: an HTTP method, a path (maybe with `<params>`), and a function that builds the response. Step 1 defines the route table and the template compiler.

### 1.1 The template compiler

**👟 Starter hint:** Write `route_regex(template)` that converts `/users/<uid>` into a regex with a named capture group `<uid>`.

```python
# main.py
import re
from urllib.parse import urlparse, parse_qs

def route_regex(template):
    pattern = re.sub(r"<(\w+)>", r"(?P<\1>[^/]+)", template)
    return re.compile("^" + pattern + "$")

m = route_regex("/users/<uid>").match("/users/42")
print(m.groupdict())
```

`re.sub(r"<(\w+)>", r"(?P<\1>[^/]+)", template)` rewrites each `<name>` into a named regex group: `/users/<uid>` becomes `/users/(?P<uid>[^/]+)`. `[^/]+` matches any non-slash run, so `42`, `grace`, and `x-7` all bind to `uid`. Anchoring with `^…$` makes the match exact, so `/users/42/extra` won't half-match.

**🎯 Expected output:** `{'uid': '42'}`.

**🩹 If it's off:** If the output is empty or `{}`, `.match` anchored at an incompatible position — check the leading `^`. If a `re.error` appears, the template's brackets are unbalanced or a capture name contains a non-word character.

### 1.2 Register the health route

**👟 Starter hint:** Define `add(method, template, response)` storing a compiled matcher plus the response factory, then register a `/health` endpoint.

```python
# main.py (continued)
class MockAPI:
    def __init__(self, base="/api/v1"):
        self.base = base
        self.routes = []

    def add(self, method, template, response):
        self.routes.append({
            "method": method,
            "match": route_regex(self.base + template),
            "response": response,
        })
        return self

api = MockAPI()
api.add("GET", "/health", lambda **kwargs: {"healthy": True, "version": "1.0.0"})
print(len(api.routes), "route registered")
```

The route table is just a list of dicts — config as data. Each entry pairs an HTTP verb with the compiled matcher for the *prefixed* path (`/api/v1` + `/health`), and a function that will build the payload later. Lambdas keep route definitions one line; a named function works identically.

**🎯 Expected output:** `1 route registered`.

**🩹 If it's off:** If `len(api.routes)` is 0, `add` forgot `self.routes.append(...)` or returned before appending. If it prints `2 routes`, a copy of the list leaked — check for an accidental `routes = self.routes` aliasing.

### 1.3 Verify the template layer

**✅ Checklist**

- ✅ `route_regex("/users/<uid>")` matches `/users/42` with `groupdict() == {"uid": "42"}`.
- ✅ `route_regex("/users/<uid>")` does *not* match `/users/42/orders`.
- ✅ `add` stores method, matcher, and factory; the base prefix is applied at registration.

**🤔 Socratic Question(s)**

- Why a *regex* rather than `path.split("/")`? Convert `/users/<uid>/orders/<oid>` to a split-based lookup in your head — what breaks on variable-length segments and on query strings? Regex is the compact answer to "any number of segments, with names".
- Template `/users/<uid>` and `/users/search` both begin with `/users/`. If you registered `<uid>` first, which one would a request to `/users/search` hit — and what rule decides it?

## Step 2: The dispatcher

Templates sit idle until something looks up a request. Step 2 turns the route table into a dispatcher: method + path in, `(status, payload)` out.

### 2.1 Handle a static route

**👟 Starter hint:** Implement `dispatch(method, path)` scanning routes, matching method then path, and calling the picked factory.

```python
# main.py (continued)
    def dispatch(self, method, path, body=None):
        for route in self.routes:
            if route["method"] != method:
                continue
            m = route["match"].match(path)
            if not m:
                continue
            kwargs = dict(m.groupdict())
            return 200, route["response"](**kwargs)
        return 404, {"error": "not found"}

print(api.dispatch("GET", "/api/v1/health"))
print(api.dispatch("GET", "/api/v1/health"))
print(api.dispatch("GET", "/api/v1/missing"))
print(api.dispatch("POST", "/api/v1/health"))
```

`dispatch` is a linear scan: two cheap filters (`method ==`, matcher match) before the expensive call. The first matching route wins, so registration order is the tiebreaker (see Step 1's Socratic). A fully-missed request returns a `404` **payload** — not an exception — so every call has a definite `(status, payload)` answer.

**🎯 Expected output:**

```
(200, {'healthy': True, 'version': '1.0.0'})
(200, {'healthy': True, 'version': '1.0.0'})
(404, {'error': 'not found'})
(404, {'error': 'not found'})
```

**🩹 If it's off:** If the wrong route answers, first-match order picked the wrong entry — reorder registration. If `/missing` raises instead of returning `(404, …)`, the loop fell through to an un-guarded `routes[0]`.

### 2.2 Path parameters and query strings

**👟 Starter hint:** Extend `dispatch` to pass path params *and* parsed query params into the factory via `kwargs`.

```python
# main.py (continued)
    def dispatch(self, method, path, body=None):
        parsed = urlparse(path)
        query = {k: v[0] for k, v in parse_qs(parsed.query).items()}
        for route in self.routes:
            if route["method"] != method:
                continue
            m = route["match"].match(parsed.path)
            if not m:
                continue
            kwargs = dict(m.groupdict())
            return 200, route["response"](**kwargs, params=query)
        return 404, {"error": "not found"}

api.add("GET", "/users/<uid>",
        lambda **kw: {"user": {"id": kw["uid"], "name": "Ada", "role": "admin"}})
api.add("GET", "/search",
        lambda **kw: {"query": kw["params"].get("q", ""),
                      "results": [f"result-{i+1}"
                                  for i in range(int(kw["params"].get("limit", "1")))]})

print(api.dispatch("GET", "/api/v1/users/42"))
print(api.dispatch("GET", "/api/v1/search?q=cats&limit=3"))
print(api.dispatch("GET", "/api/v1/search"))
```

`urlparse` separates the path from the query; `parse_qs` turns `?q=cats&limit=3` into `{"q": ["cats"], "limit": ["3"]}`, unwrapped to first-value strings. Path params arrive via `**kwargs` (from the regex groups); query params arrive via a `params` dict. The response factory names the params it wants and defaults the rest.

**🎯 Expected output:**

```
(200, {'user': {'id': '42', 'name': 'Ada', 'role': 'admin'}})
(200, {'query': 'cats', 'results': ['result-1', 'result-2', 'result-3']})
(200, {'query': '', 'results': ['result-1']})
```

**🩹 If it's off:** If `uid` is missing from the response, `**kwargs` didn't include it — check the matcher captured `uid` (Step 1.1). If `limit=3` returns 1 result, `parse_qs` gave lists and the factory indexed a list instead of a string — confirm the `v[0]` unwrap.

### 2.3 Verify the dispatcher

**✅ Checklist**

- ✅ `dispatch` returns `(200, payload)` for registered GETs and `(404, {"error": "not found"})` for everything else, matching on method too.
- ✅ `/users/<uid>` and `/search` both resolve, with path params in `kwargs` and query params in `params`.
- ✅ The same dispatcher answers repeatedly — no state is consumed by a call.

**🤔 Socratic Question(s)**

- `%7B`-style URL-encoded characters sit in the *path*; spaces sit in the *query*. Where does `urlparse` draw the line, and what would break if you parsed query params from `parsed.path` instead of `parsed.query`?
- The factory for `/users/<uid>` returns the same "Ada" for every id. For a *mock*, is that a bug or a feature? Frame the tradeoff between "realistic variety" and "deterministic tests".

## Step 3: Simulate the failure modes

Real APIs fail. A good mock fails *on purpose*, on a schedule, so your code can't dodge failure paths. Step 3 adds scheduled errors and a body-aware echo.

### 3.1 The flaky route

**👟 Starter hint:** Extend `add` with an optional `flaky={"every": n, "message": ...}`; count hits per path and return a 500 on every `n`-th.

```python
# main.py (continued)
    def __init__(self, base="/api/v1"):
        self.base = base
        self.routes = []
        self._counter = {}

    def add(self, method, template, response, *, flaky=None):
        self.routes.append({"method": method,
                            "match": route_regex(self.base + template),
                            "response": response,
                            "flaky": flaky})

    def dispatch(self, method, path, body=None):
        parsed = urlparse(path)
        query = {k: v[0] for k, v in parse_qs(parsed.query).items()}
        for route in self.routes:
            if route["method"] != method:
                continue
            m = route["match"].match(parsed.path)
            if not m:
                continue
            kwargs = dict(m.groupdict())
            if route["flaky"] is not None:
                n = self._counter.setdefault(path, 0) + 1
                self._counter[path] = n
                if n % route["flaky"]["every"] == 0:
                    return 500, {"error": route["flaky"]["message"]}
            return 200, route["response"](**kwargs, params=query)
        return 404, {"error": "not found"}

api.add("GET", "/flaky", lambda **kw: {"ok": True},
        flaky={"every": 3, "message": "Simulated outage"})
print(api.dispatch("GET", "/api/v1/flaky"))
print(api.dispatch("GET", "/api/v1/flaky"))
print(api.dispatch("GET", "/api/v1/flaky"))
```

`_counter` counts hits *per path* (`setdefault(path, 0)`), so a flaky route fails on hits 3, 6, 9 — a deterministic schedule your tests can assert against. The two healthy calls succeed, then the third fails with a crisp error payload. This is how you test a retry loop: give it a "succeeds twice, fails once" rhythm.

**🎯 Expected output:**

```
(200, {'ok': True})
(200, {'ok': True})
(500, {'error': 'Simulated outage'})
```

**🩹 If it's off:** If all three fail, `every` is `1` (or the modulo is inverted — `n % every == 0` only fires on exact multiples). If none fail, the `flaky` branch never runs because `add` wasn't called with `flaky=` as a keyword.

### 3.2 Bad input is a 4xx, not a crash

**👟 Starter hint:** Wrap the factory call in try/except so an *exception in the mock* becomes a 422 payload, never a stack trace.

```python
# main.py (continued)
    def dispatch(self, method, path, body=None):
        parsed = urlparse(path)
        query = {k: v[0] for k, v in parse_qs(parsed.query).items()}
        for route in self.routes:
            if route["method"] != method:
                continue
            m = route["match"].match(parsed.path)
            if not m:
                continue
            kwargs = dict(m.groupdict())
            if route["flaky"] is not None:
                n = self._counter.setdefault(path, 0) + 1
                self._counter[path] = n
                if n % route["flaky"]["every"] == 0:
                    return 500, {"error": route["flaky"]["message"]}
            try:
                payload = route["response"](**kwargs, params=query, body=body)
            except Exception as e:
                return 422, {"error": str(e)}
            return 200, payload
        return 404, {"error": "not found"}

api.add("GET", "/divide", lambda **kw: {"n": 1 / int(kw["params"]["by"])})
print(api.dispatch("GET", "/api/v1/divide?by=2"))
print(api.dispatch("GET", "/api/v1/divide?by=0"))
```

The try/except draws a hard line: the *mock* has a bug or the caller sent nonsense, and either way the response is structured JSON with status `422` — a client can branch on it. Without the guard, a bad `by=0` would propagate a `ZeroDivisionError` and crash the whole server thread.

**🎯 Expected output:**

```
(200, {'n': 0.5})
(422, {'error': 'division by zero'})
```

**🩹 If it's off:** If `by=0` crashes, the try/except is outside the loop or the factory is called elsewhere. If it returns `500` instead of `422`, the `except` re-raised or mapped the wrong status.

### 3.3 Verify the failure modes

**✅ Checklist**

- ✅ A flaky route fails exactly when `n % every == 0` — hit 3 of a 3-schedule fails.
- ✅ Failed factories return `(422, {"error": ...})`; unmatched paths return `(404, ...)`.
- ✅ All simulated failures are data, never raised exceptions.

**🤔 Socratic Question(s)**

- The flaky counter is *per path*, not per rule. Two callers hitting `/api/v1/flaky` share the count. Would you want instead one counter per *caller* when mocking a distributed system — and what would you key on to tell which caller is which?
- 422 vs 500: one says "the request was wrong", the other "the server failed". When you **mock**, you control both sides — so why still bother distinguishing them?

## Step 4: Read and echo a JSON body

GETs carry params in the URL. POSTs carry a JSON body. Step 4 makes the mock body-aware: read it, reflect it, and return the object — the whole round-trip a frontend needs to develop against.

### 4.1 Echo a POST body

**👟 Starter hint:** Register `/echo`; the factory decodes `body` (a raw string) with `json.loads` and returns `{"echo": <decoded>}`.

```python
# main.py (continued)
api.add("POST", "/echo",
        lambda **kw: {"echo": json.loads(kw["body"]) if kw["body"] else {}})

print(api.dispatch("POST", "/api/v1/echo", body='{"name": "Grace"}'))
print(api.dispatch("POST", "/api/v1/echo", body=""))
```

`body` enters `dispatch` as a raw string (the HTTP layer reads it from the request in Step 5); `json.loads` turns it into a Python object for the echo response. A missing body becomes `{}` — still a valid echo, not an exception.

**🎯 Expected output:**

```
(200, {'echo': {'name': 'Grace'}})
(200, {'echo': {}})
```

**🩹 If it's off:** If `json.loads` errors on a valid JSON string, the body arrived double-encoded (quote the JSON twice) or with a stray byte. If an empty body echoes as `None`, the falsy ternary flipped.

### 4.2 Chained params: body + path + query

**👟 Starter hint:** Register a storage endpoint whose response combines the path param, a query param, and the decoded body.

```python
# main.py (continued)
api.add("POST", "/users/<uid>/notes",
        lambda **kw: {"user": kw["uid"],
                      "tag": kw["params"].get("tag", "general"),
                      "note": json.loads(kw["body"]) or {"text": ""}})

print(api.dispatch("POST", "/api/v1/users/7/notes?tag=idea",
                   body='{"text": "ship by Friday"}'))
```

One route now exercises every input channel at once — the path name, a query tag, and the JSON body — which is exactly the shape a real `/users/<id>/notes` endpoint has. Reading all three into one response proves the dispatcher carries each channel independently.

**🎯 Expected output:**

```
(200, {'user': '7', 'tag': 'idea', 'note': {'text': 'ship by Friday'}})
```

**🩹 If it's off:** If `tag` is missing, `query` wasn't threaded into the factory. If `user` is `None`, `kw["uid"]` wasn't captured (the group name in the template didn't match the key used here).

### 4.3 Verify the body pipeline

**✅ Checklist**

- ✅ `/echo` returns the decoded JSON body object; an empty body echoes `{}`.
- ✅ Path, query, and body can be combined in a single route's response.
- ✅ Malformed JSON in a body maps to a 422 via the Step 3 guard, not a crash.

**🤔 Socratic Question(s)**

- The echo route *trusts* `json.loads`. If a client sends `{"text": "ship by Friday"}` but the real API expects `{"content": ...}`, a mock echo of the wrong shape passes tests silently. Where would you put a *schema check* — in the route factory, or in the dispatcher — and why?
- `json.loads(kw["body"])` returns any JSON type: list, number, null. If you wanted `/echo` to *only* accept objects, what one-line change would reject the rest?

## Step 5: Record and replay

A mock that answers but forgets can't verify. Step 5 records every call to a transcript, then replays it — re-running the exact requests and asserting the responses didn't drift. That's a regression test born from a mock.

### 5.1 Record the transcript

**👟 Starter hint:** Add a `recorded` list; log method, path, body, status, and payload in `dispatch`, seeded by the calls you've already made.

```python
# main.py (continued)
    def __init__(self, base="/api/v1"):
        self.base = base
        self.routes = []
        self._counter = {}
        self.recorded = []

    def _finish(self, method, path, body, status, payload):
        self.recorded.append({"method": method, "path": path, "body": body,
                              "status": status, "payload": payload})
        return status, payload

    def transcript(self):
        return json.loads(json.dumps(self.recorded))

    # Now route dispatch returns self._finish(...) on every path — the
    # matching routes and the fallback 404 alike (add that in this section).

print("calls recorded so far:", len(api.transcript()))
print(api.transcript()[0])
```

Recording the *request* (method, path, body) alongside the *response* (status, payload) makes the transcript a truthful trace — you can replay any entry later without guessing what it sent. A deep copy via `json.dumps(json.loads(...))` keeps the returned transcript isolated from further mutation. (To make the counts below match, have `dispatch` end each path — match or 404 — with `return self._finish(method, path, body, status, payload)`, returning either `(status, payload)` directly.)

**🎯 Expected output:**

```
calls recorded so far: 9
{'method': 'GET', 'path': '/api/v1/health', 'body': None, 'status': 200, 'payload': {'healthy': True, 'version': '1.0.0'}}
```

(The count is 9 because every earlier `dispatch` call in this guide was recorded.)

**🩹 If it's off:** If the transcript is empty, `_finish` (or the append inside it) isn't on the return path of `dispatch`. If entries mutate later, the deep copy in `transcript()` is missing.

### 5.2 Replay as a regression check

**👟 Starter hint:** Implement `replay()` that re-dispatches every recorded request and collects the paths whose responses drifted.

```python
# main.py (continued)
    def replay(self):
        mismatches = []
        for call in self.transcript():
            st, payload = self.dispatch(call["method"], call["path"],
                                        body=call["body"])
            if (st, payload) != (call["status"], call["payload"]):
                mismatches.append(call["path"])
        return mismatches

fresh = MockAPI()
fresh.add("GET", "/health", lambda **kw: {"healthy": True, "version": "1.0.0"})
fresh.add("GET", "/users/<uid>",
          lambda **kw: {"user": {"id": kw["uid"], "name": "Ada", "role": "admin"}})
fresh.add("GET", "/search", lambda **kw: {"query": kw["params"].get("q", ""),
                                          "results": [f"result-{i+1}"
                                                      for i in range(int(kw["params"].get("limit", "1")))]})
fresh.dispatch("GET", "/api/v1/health")
fresh.dispatch("GET", "/api/v1/search?q=cats&limit=3")
fresh.dispatch("GET", "/api/v1/users/7")

print("replay:", fresh.replay())
```

`replay` re-sends each recorded *request* (with its exact body) and compares the fresh response to the recorded one. Zero mismatches means "the server still behaves exactly as it did during the run" — your cheap, deterministic regression test. (A flaky route flips on a counter, so replay it on a fresh instance or restart the counter — that non-determinism is the point of testing it separately.)

**🎯 Expected output:** `replay: []`.

**🩹 If it's off:** If a `search` call mismatches, query `limit` strings aren't round-tripping (int vs str). If `users/7` mismatches, the response depends on live time or a global — freeze it.

### 5.3 Wire it live (optional)

**👟 Starter hint:** Plug the dispatcher into `http.server`: a `BaseHTTPRequestHandler` reads the body, calls `dispatch`, and writes status + JSON — served on an ephemeral port so it never collides.

```python
# main.py (continued)
import json as _json, threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

class Handler(BaseHTTPRequestHandler):
    api = None
    def dispatch_here(self):
        length = int(self.headers.get("Content-Length", 0) or 0)
        body = self.rfile.read(length).decode() if length else None
        status, payload = self.api.dispatch(self.command, self.path, body=body)
        data = _json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)
    do_GET = dispatch_here
    do_POST = dispatch_here
    def log_message(self, *args): pass

Handler.api = fresh
server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
port = server.server_address[1]
threading.Thread(target=server.serve_forever, daemon=True).start()

import http.client
conn = http.client.HTTPConnection("127.0.0.1", port)
conn.request("GET", "/api/v1/health")
r = conn.getresponse()
print("GET /health ->", r.status, _json.loads(r.read()))
conn.request("POST", "/api/v1/echo", body=_json.dumps({"name": "Grace"}),
             headers={"Content-Type": "application/json"})
r = conn.getresponse()
print("POST /echo  ->", r.status, _json.loads(r.read()))
server.shutdown()
```

Port `0` asks the OS for a free port, so `serve_forever` never fights an existing process. The handler mirrors `dispatch`'s contract — read body, dispatch, JSON-encode the payload — so the live server and the in-process dispatcher answer identically. `log_message` is silenced so the console stays clean.

**🎯 Expected output:**

```
GET /health -> 200 {'healthy': True, 'version': '1.0.0'}
POST /echo  -> 200 {'echo': {'name': 'Grace'}}
```

**🩹 If it's off:** If `ConnectionRefusedError`, the server thread died (an exception inside `serve_forever`) or `shutdown()` ran early. If a POST's body is empty, the `Content-Length` header didn't reach the handler — most clients send it, some ad-hoc tooling doesn't.

### 5.4 Verify the recorder

**✅ Checklist**

- ✅ `transcript()` returns an isolated deep copy of every recorded call.
- ✅ `replay()` returns `[]` on a stable route set with no drift.
- ✅ The live handler returns exactly the same JSON the in-process dispatcher returns.

**🤔 Socratic Question(s)**

- Replay answers "did the response change?" but not "is the response *right*?". What does a transcript that ships as golden data let a future test assert that a live mock alone never can — and what's the risk of the golden data going stale?
- The live handler re-reads `self.rfile` per request. `ThreadingHTTPServer` serves each connection on its own thread — what breaks if two replay calls race on `self._counter`, and would `BaseHTTPRequestHandler`'s per-instance state survive that cleanly?

## ⚠️ Common pitfalls

- **Unanchored route regexes.** `/users/<uid>` matched without `^…$` also matches `/api/v1/users/42/orders` and produces a half-captured request. Always anchor the compiled pattern.
- **Method forgetting.** Matching only the path lets a `POST /health` hit the `GET /health` route. Filter on `route["method"] == method` *before* the regex match.
- **`parse_qs` returns lists.** `parse_qs("?limit=3")["limit"]` is `["3"]`, not `"3"`. Open with `{k: v[0] …}` or indexing breaks every multi-value parse.
- **Fake failures that crash.** An unguarded `ZeroDivisionError` inside a route crashes the handler thread. Let the try/except map exceptions to a `422` payload — that's the mock's job.
- **Shared state in replay.** The flaky counter is per-path and monotonic; a `replay()` that re-sends the 3rd flaky call gets a fresh 500. Test flaky routes on a fresh instance.
- **Non-serializable payloads.** `json.dumps` in `transcript()` and the live handler both choke on a `datetime` or a numpy int. Keep payloads to plain Python types.

## What you just built

A local, deterministic, standard-library API server: template routes compiled to regex dispatchers, path params and query params flowing into response factories, failures simulated on a schedule, JSON bodies echoed back, and a full request transcript that replays as a regression check. The core idea is that *a mock replaces an external system with a promise you control* — every `(status, payload)` is data, never a surprise exception, so your code can be developed, demoed, and regression-tested long before the real backend exists. Swap the route table for the real base URL later and the same client keeps working, which is precisely the seam a mock is meant to hold.

:::tip[Run a fuller version without any local setup]
[`examples/api-mock-server/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/api-mock-server) in the course repo is the complete server as a notebook — route templating, flaky failures, the echo endpoint, transcript replay, and the optional live-wire handler, runnable in Colab/Kaggle/Binder. Clone the repo or [open it in a Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Where to go from here

- Add `latency_ms` to routes and have the dispatcher sleep before responding, so retry tests exercise actual timeouts — then record measured latencies in the transcript alongside status and payload.
- Implement a `Content-Type` check in `dispatch` that rejects non-JSON bodies with 415 instead of letting `json.loads` throw.
- Persist the transcript to a JSON file with `json.dump` at shutdown and load it at startup, so the recorder becomes regression data that survives restarts.
- Add a `record = True/False` mode so a recording run captures real API calls (via `http.client`) and replays them as a mock later — the classic record-and-replay proxy.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓