"""Streak computation: current streak and longest streak, from a habit's
daily done/missed history.

A "streak" here means consecutive *calendar days* logged as done, with no
gap — a day that was never logged at all counts the same as a day
explicitly logged "n" (both break the streak). That's a deliberate choice:
it keeps the definition simple (no separate "unknown" state) at the cost of
punishing forgetting to log at all the same as actually skipping the habit.
"""

from __future__ import annotations

import pandas as pd


def habit_daily_series(df: pd.DataFrame, habit: str, start: str, end: str) -> pd.Series:
    """Reindex one habit's check-ins onto *every* calendar day in
    [start, end], filling missing days with False. This is the step that
    turns a sparse log (only the days someone bothered to log) into a dense
    day-by-day timeline, which both the streak math and the grid layout
    need."""
    habit_df = df[df["habit"] == habit].set_index("date")["done"]
    full_index = pd.date_range(start=start, end=end, freq="D")
    return habit_df.reindex(full_index, fill_value=False)


def compute_streaks(daily: pd.Series) -> dict:
    """Given a dense day-by-day boolean series (see habit_daily_series),
    return the current streak (consecutive done days ending at the last day
    in the series) and the longest streak anywhere in the history."""
    longest = 0
    current_run = 0
    streak_ending_at_last_day = 0

    for i, done in enumerate(daily):
        if done:
            current_run += 1
        else:
            current_run = 0
        longest = max(longest, current_run)
        if i == len(daily) - 1:
            streak_ending_at_last_day = current_run

    return {
        "current_streak": streak_ending_at_last_day,
        "longest_streak": longest,
        "total_done": int(daily.sum()),
        "total_days": len(daily),
    }
