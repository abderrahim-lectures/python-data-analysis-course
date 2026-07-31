"""Generate the bundled sample_checkins.csv — several months of
semi-realistic check-in data for a couple of habits, with real streaks and
real gaps, so the heatmap demo looks genuinely interesting without anyone
having to log anything by hand first.

Not part of the lesson steps — a one-off data-generation script, run once
and committed. Deterministic (fixed seed) so the bundled CSV is reproducible.
"""

from __future__ import annotations

import csv
import datetime as dt
import random
from pathlib import Path

random.seed(42)

OUT_PATH = Path(__file__).parent / "sample_checkins.csv"
START = dt.date(2026, 1, 1)
END = dt.date(2026, 7, 22)


def generate_exercise() -> dict[dt.date, bool]:
    """A habit with a rocky start, a long strong streak in the middle, and
    a slump near the end — the kind of shape that makes "current streak"
    vs. "longest streak" a meaningfully different number to look at."""
    result: dict[dt.date, bool] = {}
    day = START
    while day <= END:
        if day < dt.date(2026, 1, 20):
            # Rocky start: about 40% of days.
            result[day] = random.random() < 0.4
        elif day < dt.date(2026, 4, 10):
            # A strong run: about 90% of days, rare misses.
            result[day] = random.random() < 0.9
        elif day < dt.date(2026, 5, 1):
            # A real slump: mostly missed.
            result[day] = random.random() < 0.15
        else:
            # Recovery, settling into a solid habit.
            result[day] = random.random() < 0.75
        day += dt.timedelta(days=1)
    return result


def generate_reading() -> dict[dt.date, bool]:
    """A second habit, logged less consistently overall (not every day has
    a row at all — some days are just missing from the log, not explicitly
    marked "n"), to exercise the reindex-to-dense-timeline step."""
    result: dict[dt.date, bool] = {}
    day = START
    while day <= END:
        if random.random() < 0.15:
            day += dt.timedelta(days=1)
            continue  # simulate forgetting to log entirely some days
        result[day] = random.random() < 0.6
        day += dt.timedelta(days=1)
    return result


def main() -> None:
    rows = []
    for date, done in generate_exercise().items():
        rows.append((date.isoformat(), "Exercise", "y" if done else "n"))
    for date, done in generate_reading().items():
        rows.append((date.isoformat(), "Read 10 pages", "y" if done else "n"))

    rows.sort(key=lambda r: (r[0], r[1]))

    with OUT_PATH.open("w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["date", "habit", "done"])
        writer.writerows(rows)

    print(f"Wrote {len(rows)} rows to {OUT_PATH}")


if __name__ == "__main__":
    main()
