"""Main script: load a check-in log, compute streaks, render the
GitHub-style calendar heatmap, and save it as a PNG.

Usage:
    uv run python visualize.py                       # uses bundled sample data
    uv run python visualize.py checkins.csv           # uses your own real log
    uv run python visualize.py checkins.csv --habit "Exercise"
"""

from __future__ import annotations

import argparse
from pathlib import Path

from grid import build_grid
from heatmap import render_heatmap
from log import load_log
from streaks import compute_streaks, habit_daily_series

HERE = Path(__file__).parent
SAMPLE_LOG = HERE / "sample_checkins.csv"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Render a habit-streak heatmap.")
    parser.add_argument(
        "log_path",
        nargs="?",
        default=str(SAMPLE_LOG),
        help="Path to a check-ins CSV (defaults to the bundled sample data).",
    )
    parser.add_argument(
        "--habit",
        default=None,
        help="Which habit to visualize. Defaults to the first habit found in the log.",
    )
    parser.add_argument(
        "--out",
        default=None,
        help="Output PNG path. Defaults to '<habit>_heatmap.png'.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    df = load_log(Path(args.log_path))
    if df.empty:
        print(f"No check-ins found in {args.log_path}. Log some with checkin.py first.")
        return

    habit = args.habit or df["habit"].iloc[0]
    start, end = df["date"].min(), df["date"].max()

    daily = habit_daily_series(df, habit, start, end)
    stats = compute_streaks(daily)

    print(f"Habit: {habit}")
    print(f"  Logged range: {start.date()} -> {end.date()} ({stats['total_days']} days)")
    print(f"  Days done: {stats['total_done']} / {stats['total_days']}")
    print(f"  Current streak: {stats['current_streak']} day(s)")
    print(f"  Longest streak: {stats['longest_streak']} day(s)")

    grid, dates, _ = build_grid(daily)
    fig = render_heatmap(
        grid,
        dates,
        habit,
        title_suffix=f"  (current: {stats['current_streak']}, longest: {stats['longest_streak']})",
    )

    out_path = args.out or f"{habit.lower().replace(' ', '_')}_heatmap.png"
    fig.savefig(out_path, bbox_inches="tight")
    print(f"Saved heatmap to {out_path}")


if __name__ == "__main__":
    main()
