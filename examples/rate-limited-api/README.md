# Rate-Limited API Service Example

The local companion to the course's [Build a Rate-Limited API Service](../../docs/projects/rate-limited-api/index.md) project -- a real, runnable [FastAPI](https://fastapi.tiangolo.com/) app wrapping a bundled quotes dataset, with genuine API-key auth and a from-scratch sliding-window rate limiter.

## What's here

- `quotes_data.py` -- 130 real quotes and jokes (hand-collected for this course, spanning `programming`, `humor`, `wisdom`, `science`, and `life`), loaded once at import time as plain Python data -- no framework imports, so it's testable in complete isolation.
- `rate_limit.py` -- `SlidingWindowRateLimiter`, a from-scratch, in-memory, per-key sliding-window rate limiter. No `slowapi`, no external service -- just a `dict` of `deque`s and a docstring explaining exactly why an *exact* sliding window avoids the classic fixed-window burst bug.
- `main.py` -- the FastAPI app itself: paginated/filterable `GET /quotes`, `GET /quotes/{id}`, `GET /categories`, `POST /keys` to self-issue an API key, and a protected, rate-limited `GET /me`.

Nothing here needs an external API key or service -- this project *is* the API.

## Running it locally

```bash
uv sync
uv run uvicorn main:app --reload
```

The server starts on `http://127.0.0.1:8000`. Interactive docs (generated automatically by FastAPI from the route type hints) are at `http://127.0.0.1:8000/docs`.

## Trying it with curl

List the first few quotes:

```bash
curl "http://127.0.0.1:8000/quotes?limit=3"
```

```json
{"items":[{"id":1,"text":"Programs must be written for people to read...","author":"Harold Abelson","category":"programming"}, ...],"total":130,"limit":3,"offset":0}
```

Filter by category and paginate:

```bash
curl "http://127.0.0.1:8000/quotes?category=science&limit=2&offset=2"
```

Filter by author (case-insensitive substring match):

```bash
curl "http://127.0.0.1:8000/quotes?author=sagan"
```

Hit a protected endpoint with no key -- a real `401`, not a hint of what the key should be:

```bash
curl -i "http://127.0.0.1:8000/me"
# HTTP/1.1 401 Unauthorized
# {"detail":"Missing or invalid API key. Get one from POST /keys."}
```

Issue yourself a key:

```bash
curl -X POST "http://127.0.0.1:8000/keys"
# {"api_key":"aCnyosJr2dxkQuhAlk0vSyiX5q1c8BJQ"}
```

Use it:

```bash
curl -i -H "X-API-Key: aCnyosJr2dxkQuhAlk0vSyiX5q1c8BJQ" "http://127.0.0.1:8000/me"
# HTTP/1.1 200 OK
# x-ratelimit-limit: 5
# x-ratelimit-window-seconds: 10
# {"api_key":"aCnyosJr2dxkQuhAlk0vSyiX5q1c8BJQ","requests_remaining_hint":"Up to 5 requests per 10s window."}
```

Fire more than 5 requests in that same 10-second window (a quick loop, or hammer the `/docs` "Try it out" button) and the 6th gets a real `429`:

```bash
curl -i -H "X-API-Key: aCnyosJr2dxkQuhAlk0vSyiX5q1c8BJQ" "http://127.0.0.1:8000/me"
# HTTP/1.1 429 Too Many Requests
# retry-after: 10
# {"detail":"Rate limit exceeded: max 5 requests per 10s. Retry after 10s."}
```

`main.py` sets `RATE_LIMIT_MAX_REQUESTS = 5` and `RATE_LIMIT_WINDOW_SECONDS = 10.0` deliberately low, so you can trigger a real `429` in a few seconds by hand instead of scripting hundreds of requests -- turn them up for anything beyond local testing.

## Running it in GitHub Codespaces

Open [a Codespace for the whole repo](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are preinstalled), run the same `uv run uvicorn main:app --reload` command from its terminal, then forward port 8000 (Codespaces will usually prompt automatically) to reach it from your own browser or `curl`.

## A note on the in-memory rate limiter

`SlidingWindowRateLimiter` keeps all of its state in a plain Python dict inside this one process. That's genuinely fine for a single local server -- but it resets on every restart, and it wouldn't share counts across multiple `uvicorn` workers or replicas behind a load balancer. See the lesson's tip on this for the honest production version of the story (a shared store like Redis, or a library like [`slowapi`](https://github.com/laurentS/slowapi) that already solves the shared-state problem for you).

## Built your own rate-limited API?

See [`examples/student-projects/`](../student-projects/) for how to share it with the class via a pull request -- no git experience required, it walks through every step.
