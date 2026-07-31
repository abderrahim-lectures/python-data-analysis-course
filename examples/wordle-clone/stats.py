"""Persistent stats tracking for the Wordle clone — win rate, streak, and a
guess-count distribution — saved to a local JSON file across runs.

Kept deliberately dependency-free (stdlib `json` only) so this example needs
no `pip install` beyond an optional `rich` for nicer terminal color output.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

STATS_FILE = Path(__file__).parent / "stats.json"
MAX_GUESSES = 6

DEFAULT_STATS: dict[str, Any] = {
    "played": 0,
    "wins": 0,
    "current_streak": 0,
    "max_streak": 0,
    # "1" -> games won in exactly 1 guess, ... "6" -> won in 6 guesses.
    "guess_distribution": {str(n): 0 for n in range(1, MAX_GUESSES + 1)},
}


def load_stats(path: Path = STATS_FILE) -> dict[str, Any]:
    """Load stats from disk, or return fresh defaults if the file doesn't
    exist yet (first run) or is corrupted (don't crash the game over it)."""
    if not path.exists():
        return json.loads(json.dumps(DEFAULT_STATS))  # deep copy
    try:
        with path.open() as f:
            data = json.load(f)
        merged = json.loads(json.dumps(DEFAULT_STATS))
        merged.update(data)
        merged["guess_distribution"] = {
            **merged["guess_distribution"],
            **data.get("guess_distribution", {}),
        }
        return merged
    except (json.JSONDecodeError, OSError):
        return json.loads(json.dumps(DEFAULT_STATS))


def save_stats(stats: dict[str, Any], path: Path = STATS_FILE) -> None:
    with path.open("w") as f:
        json.dump(stats, f, indent=2)


def record_result(stats: dict[str, Any], won: bool, guesses_used: int) -> dict[str, Any]:
    """Update `stats` in place for one finished game and return it.

    `guesses_used` is only meaningful when `won` is True — a loss doesn't
    count toward the guess-count distribution, same as real Wordle's stats.
    """
    stats["played"] += 1
    if won:
        stats["wins"] += 1
        stats["current_streak"] += 1
        stats["max_streak"] = max(stats["max_streak"], stats["current_streak"])
        stats["guess_distribution"][str(guesses_used)] += 1
    else:
        stats["current_streak"] = 0
    return stats


def win_rate(stats: dict[str, Any]) -> float:
    if stats["played"] == 0:
        return 0.0
    return stats["wins"] / stats["played"]


def format_stats(stats: dict[str, Any]) -> str:
    lines = [
        "Stats",
        f"  Played: {stats['played']}",
        f"  Win rate: {win_rate(stats):.0%}",
        f"  Current streak: {stats['current_streak']}",
        f"  Max streak: {stats['max_streak']}",
        "  Guess distribution:",
    ]
    max_count = max(stats["guess_distribution"].values(), default=0)
    for n in range(1, MAX_GUESSES + 1):
        count = stats["guess_distribution"][str(n)]
        bar_len = round(10 * count / max_count) if max_count else 0
        lines.append(f"    {n}: {'█' * bar_len} {count}")
    return "\n".join(lines)
