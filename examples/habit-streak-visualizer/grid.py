"""Lay a year (or any date range) of days out into a GitHub-contributions
-style grid: 7 rows (one per weekday) x N columns (one per week), read
left-to-right, top-to-bottom within each column.

The layout math, spelled out:
- Pick a fixed "week 0" anchor: the Monday on/before the first day in the
  series. Every date's column is just `(date - anchor).days // 7` — plain
  integer division on a day offset, not a calendar week number. This is
  deliberately *not* `date.isocalendar()[1]` (the ISO week number):
  ISO weeks reset to 1 every January, so a habit log spanning a year
  boundary would have late-December dates and early-January dates land in
  *the same low week numbers*, scrambling the grid. An offset from a fixed
  anchor increases monotonically no matter how many years the log spans.
- Each date's row is its weekday (0=Monday ... 6=Sunday), i.e. exactly
  `date.weekday()`.
- Any grid cell that falls before the first logged day or after the last
  (because the first day isn't necessarily a Monday, and the last isn't
  necessarily a Sunday) is left as NaN — masked out when rendering rather
  than drawn as "missed".
"""

from __future__ import annotations

import numpy as np
import pandas as pd


def build_grid(daily: pd.Series) -> tuple[np.ndarray, pd.DatetimeIndex, int]:
    """daily: a dense (no gaps) boolean Series indexed by date, intensity
    already resolved to True/False done-or-not (see streaks.py).

    Returns (grid, dates, anchor_weekday) where grid is a
    (7, num_weeks) float array of intensity values in [0, 1] (NaN for
    days outside the logged range), and dates is the original index.
    """
    dates = daily.index
    start = dates[0]
    anchor = start - pd.Timedelta(days=start.weekday())  # Monday on/before start

    day_offsets = (dates - anchor).days
    weeks = day_offsets // 7
    rows = dates.weekday  # 0=Monday..6=Sunday

    num_weeks = int(weeks.max()) + 1
    grid = np.full((7, num_weeks), np.nan)

    intensity = _streak_intensity(daily)
    for row, week, value in zip(rows, weeks, intensity):
        grid[row, week] = value

    return grid, dates, start.weekday()


def _streak_intensity(daily: pd.Series) -> list[float]:
    """Color intensity per day: 0 for a missed/unlogged day, otherwise a
    value that grows with the *current* streak length that day is part of
    (capped), so a long run of consecutive check-ins visibly darkens as it
    goes, GitHub-heatmap style, instead of every "done" day looking
    identical."""
    values: list[float] = []
    run = 0
    cap = 10  # streak length at which intensity maxes out
    for done in daily:
        if done:
            run += 1
            values.append(min(run, cap) / cap)
        else:
            run = 0
            values.append(0.0)
    return values
