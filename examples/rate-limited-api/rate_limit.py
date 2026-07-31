"""A small, from-scratch sliding-window rate limiter.

This is the interesting part of the project -- deliberately not delegated to
a library like `slowapi`. It tracks, per API key, the timestamps of recent
requests in memory, and decides whether a new request is allowed under a
"N requests per WINDOW seconds" policy.

The sliding window is exact (not bucketed/approximate): it keeps every
request timestamp within the current window and drops ones that have aged
out, rather than resetting a counter at fixed intervals. That avoids the
classic fixed-window bug where a client can burst 2x the limit right across
a window boundary (e.g. all of window 1's quota at 0:59, all of window 2's
quota at 1:00 -- 2x the allowed rate in two real seconds).
"""

from __future__ import annotations

import time
from collections import defaultdict, deque


class SlidingWindowRateLimiter:
    """In-memory, per-key sliding-window rate limiter.

    NOT safe to share across multiple server processes/instances -- see the
    docstring on `check` for why, and the lesson's tip about production
    alternatives (e.g. a shared Redis-backed counter).
    """

    def __init__(self, max_requests: int, window_seconds: float) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        # Each key maps to a deque of the Unix timestamps of its recent
        # requests, oldest first -- a deque gives O(1) popleft for evicting
        # expired entries from the left as the window slides forward.
        self._history: dict[str, deque[float]] = defaultdict(deque)

    def check(self, key: str, now: float | None = None) -> tuple[bool, float]:
        """Record a request attempt for `key` and report whether it's allowed.

        Returns (allowed, retry_after_seconds). When allowed is False,
        retry_after_seconds is how long the caller should wait before the
        oldest request in the window ages out and frees up a slot.

        This state lives in a plain Python dict in this process's memory:
        it resets to empty every time the server restarts, and two separate
        `uvicorn` worker processes (or two replicas behind a load balancer)
        would each track their own, independent counts for the same key --
        letting a client get up to N-times-workers requests through. Fine
        for this lesson and for a single-process deployment; not fine for
        production behind multiple workers without a shared store.
        """
        now = time.monotonic() if now is None else now
        history = self._history[key]

        # Evict timestamps that have fallen outside the window.
        cutoff = now - self.window_seconds
        while history and history[0] <= cutoff:
            history.popleft()

        if len(history) < self.max_requests:
            history.append(now)
            return True, 0.0

        retry_after = history[0] + self.window_seconds - now
        return False, max(retry_after, 0.0)

    def reset(self) -> None:
        """Clear all tracked history -- used by tests to isolate cases."""
        self._history.clear()
