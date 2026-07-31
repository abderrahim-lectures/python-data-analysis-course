"""Read/write the habit check-in log.

The log is a plain CSV: one row per (date, habit) check-in, with columns
`date`, `habit`, `done`. Using a flat CSV (instead of, say, one file per
habit) means several habits can share a single log and still be filtered
independently with plain pandas boolean indexing.
"""

from __future__ import annotations

import csv
from pathlib import Path

COLUMNS = ["date", "habit", "done"]


def ensure_log(path: Path) -> None:
    """Create the log file with a header row if it doesn't exist yet."""
    if not path.exists():
        with path.open("w", newline="") as f:
            csv.writer(f).writerow(COLUMNS)


def append_checkin(path: Path, date: str, habit: str, done: bool) -> None:
    """Append one check-in row. Does not deduplicate — see load_log() for
    how same-day re-logging is resolved (last entry for a date wins)."""
    ensure_log(path)
    with path.open("a", newline="") as f:
        csv.writer(f).writerow([date, habit, "y" if done else "n"])


def load_log(path: Path):
    """Load the log as a pandas DataFrame, deduplicated so that if a
    student re-runs check-in for the same date/habit twice (e.g. correcting
    a mistake), the most recent row wins rather than double-counting."""
    import pandas as pd

    if not path.exists():
        return pd.DataFrame(columns=["date", "habit", "done"])

    df = pd.read_csv(path, parse_dates=["date"])
    df["done"] = df["done"].astype(str).str.lower().isin(["y", "yes", "true", "1"])
    df = df.drop_duplicates(subset=["date", "habit"], keep="last")
    return df.sort_values("date").reset_index(drop=True)
