"""A small, real FastAPI service wrapping a bundled quotes dataset --
the local companion to the course's "Build a Rate-Limited API Service"
lesson.

Endpoints:
    GET  /quotes                 -- paginated list, filterable by author/category
    GET  /quotes/{quote_id}      -- a single quote
    GET  /categories             -- the list of available categories
    POST /keys                   -- issue a new API key (no auth needed)
    GET  /me                     -- info about the calling key (requires a key)

`/quotes` and `/quotes/{quote_id}` are open (no key required) so anyone can
browse the dataset. `/me` is a protected example endpoint that requires a
valid API key and is subject to the rate limiter -- in a real product,
you'd protect whichever endpoints actually cost you money or capacity
(here, that's illustrated by ``/me``; feel free to guard ``/quotes`` too by
adding the same dependency).

Run it with:
    uv run uvicorn main:app --reload
"""

from __future__ import annotations

import secrets
import time

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Response
from pydantic import BaseModel

from quotes_data import CATEGORIES, QUOTES
from rate_limit import SlidingWindowRateLimiter

app = FastAPI(
    title="Quotes API",
    description="A small rate-limited REST API wrapping a bundled quotes dataset.",
    version="1.0.0",
)

# -- API key storage -----------------------------------------------------
# A plain in-memory set is enough for this lesson; a real service would
# persist keys in a database and hash them at rest rather than storing the
# raw value. See the "Where to go from here" section of the lesson.
_VALID_KEYS: set[str] = set()

# -- Rate limiter ---------------------------------------------------------
RATE_LIMIT_MAX_REQUESTS = 5
RATE_LIMIT_WINDOW_SECONDS = 10.0
limiter = SlidingWindowRateLimiter(
    max_requests=RATE_LIMIT_MAX_REQUESTS,
    window_seconds=RATE_LIMIT_WINDOW_SECONDS,
)


class ApiKeyResponse(BaseModel):
    api_key: str


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


class MeResponse(BaseModel):
    api_key: str
    requests_remaining_hint: str


def require_api_key(x_api_key: str | None = Header(default=None)) -> str:
    """FastAPI dependency: validate the `X-API-Key` header.

    Raises 401 if the header is missing or doesn't match a key issued by
    POST /keys. Returns the validated key so route handlers (and the rate
    limiter dependency below) can key their per-client state off of it.
    """
    if x_api_key is None or x_api_key not in _VALID_KEYS:
        raise HTTPException(status_code=401, detail="Missing or invalid API key. Get one from POST /keys.")
    return x_api_key


def enforce_rate_limit(response: Response, api_key: str = Depends(require_api_key)) -> str:
    """FastAPI dependency: apply the sliding-window rate limit to `api_key`.

    Runs after `require_api_key`, so an invalid key is rejected with 401
    before it ever counts against a rate-limit budget. On success, sets
    informational headers; on failure, raises 429 with `Retry-After`.
    """
    allowed, retry_after = limiter.check(api_key, now=time.monotonic())
    if not allowed:
        # An HTTPException builds its own Response under the hood, discarding
        # whatever this dependency wrote to the injected `response` object --
        # so headers on a 4xx/5xx must be passed to HTTPException itself,
        # not set on `response`, or they silently never reach the client.
        retry_after_seconds = str(int(retry_after) + 1)
        raise HTTPException(
            status_code=429,
            detail=(
                f"Rate limit exceeded: max {RATE_LIMIT_MAX_REQUESTS} requests per "
                f"{int(RATE_LIMIT_WINDOW_SECONDS)}s. Retry after {retry_after_seconds}s."
            ),
            headers={
                "Retry-After": retry_after_seconds,
                "X-RateLimit-Limit": str(RATE_LIMIT_MAX_REQUESTS),
                "X-RateLimit-Window-Seconds": str(int(RATE_LIMIT_WINDOW_SECONDS)),
            },
        )

    response.headers["X-RateLimit-Limit"] = str(RATE_LIMIT_MAX_REQUESTS)
    response.headers["X-RateLimit-Window-Seconds"] = str(int(RATE_LIMIT_WINDOW_SECONDS))
    return api_key


@app.post("/keys", response_model=ApiKeyResponse)
def issue_api_key() -> ApiKeyResponse:
    """Issue a brand-new API key. No auth needed to call this -- it's how
    a new client gets started."""
    new_key = secrets.token_urlsafe(24)
    _VALID_KEYS.add(new_key)
    return ApiKeyResponse(api_key=new_key)


@app.get("/categories", response_model=list[str])
def list_categories() -> list[str]:
    return CATEGORIES


@app.get("/quotes", response_model=QuotesPage)
def list_quotes(
    limit: int = Query(default=20, ge=1, le=100, description="Max items to return."),
    offset: int = Query(default=0, ge=0, description="Number of items to skip."),
    category: str | None = Query(default=None, description="Filter by exact category."),
    author: str | None = Query(default=None, description="Case-insensitive substring match on author."),
) -> QuotesPage:
    """List quotes, paginated, with optional category/author filters."""
    filtered = QUOTES
    if category is not None:
        filtered = [q for q in filtered if q["category"] == category]
    if author is not None:
        needle = author.lower()
        filtered = [q for q in filtered if needle in q["author"].lower()]

    page = filtered[offset : offset + limit]
    return QuotesPage(items=[QuoteOut(**q) for q in page], total=len(filtered), limit=limit, offset=offset)


@app.get("/quotes/{quote_id}", response_model=QuoteOut)
def get_quote(quote_id: int) -> QuoteOut:
    for quote in QUOTES:
        if quote["id"] == quote_id:
            return QuoteOut(**quote)
    raise HTTPException(status_code=404, detail=f"No quote with id {quote_id}.")


@app.get("/me", response_model=MeResponse)
def whoami(api_key: str = Depends(enforce_rate_limit)) -> MeResponse:
    """A protected, rate-limited endpoint -- proves a key is valid and
    counts against that key's rate-limit budget."""
    return MeResponse(
        api_key=api_key,
        requests_remaining_hint=(
            f"Up to {RATE_LIMIT_MAX_REQUESTS} requests per {int(RATE_LIMIT_WINDOW_SECONDS)}s window."
        ),
    )
