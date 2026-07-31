"""CLI: log today's (or a given date's) check-in for a habit.

Usage:
    uv run python checkin.py "Exercise"
    uv run python checkin.py "Exercise" --done y
    uv run python checkin.py "Exercise" --date 2026-06-01 --done n
"""

from __future__ import annotations

import argparse
import datetime as dt
from pathlib import Path

from log import append_checkin

LOG_PATH = Path(__file__).parent / "checkins.csv"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Log a daily habit check-in.")
    parser.add_argument("habit", help='Habit name, e.g. "Exercise" or "Read 10 pages"')
    parser.add_argument(
        "--date",
        default=None,
        help="ISO date (YYYY-MM-DD) to log for. Defaults to today.",
    )
    parser.add_argument(
        "--done",
        choices=["y", "n"],
        default=None,
        help="Skip the interactive prompt and log this answer directly.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    date = args.date or dt.date.today().isoformat()

    if args.done is not None:
        answer = args.done
    else:
        answer = input(f"Did you do '{args.habit}' on {date}? (y/n): ").strip().lower()

    done = answer.startswith("y")
    append_checkin(LOG_PATH, date, args.habit, done)
    print(f"Logged: {date} — {args.habit} — {'done' if done else 'missed'}")


if __name__ == "__main__":
    main()
