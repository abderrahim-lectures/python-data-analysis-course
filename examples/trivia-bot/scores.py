"""Per-player score persistence, stored as a small JSON file (scores.json)
next to the bot -- a real Discord server's trivia leaderboard doesn't need
a database, just something that survives the bot restarting.

Scores are keyed by Discord user id (as a string -- JSON object keys must
be strings), not by username or display name, so a player's score survives
a nickname or username change. The display name is still stored alongside
the score purely so the leaderboard has something readable to print.
"""

import json
from pathlib import Path

SCORES_PATH = Path("scores.json")


def load_scores() -> dict:
    """user_id (str) -> {"name": str, "score": int}. Empty dict if no
    rounds have ever been played yet."""
    if not SCORES_PATH.exists():
        return {}
    return json.loads(SCORES_PATH.read_text(encoding="utf-8"))


def save_scores(scores: dict) -> None:
    SCORES_PATH.write_text(json.dumps(scores, indent=2), encoding="utf-8")


def award_point(scores: dict, user_id: int, display_name: str) -> dict:
    """Gives one point to a player, saves immediately, and returns the
    updated scores dict. Saving on every point (instead of batching) keeps
    scores.json correct even if the bot process is killed mid-round."""
    key = str(user_id)
    entry = scores.get(key, {"name": display_name, "score": 0})
    entry["name"] = display_name  # keep the stored name fresh
    entry["score"] += 1
    scores[key] = entry
    save_scores(scores)
    return scores


def leaderboard_text(scores: dict, top_n: int = 10) -> str:
    """Renders the top N players as a numbered, ready-to-post string."""
    if not scores:
        return "No scores yet -- play a round with `/trivia`!"
    ranked = sorted(scores.values(), key=lambda entry: entry["score"], reverse=True)
    lines = [f"{i}. {entry['name']} — {entry['score']}" for i, entry in enumerate(ranked[:top_n], start=1)]
    return "\n".join(lines)


if __name__ == "__main__":
    demo_scores: dict = {}
    demo_scores = award_point(demo_scores, user_id=111, display_name="Alice")
    demo_scores = award_point(demo_scores, user_id=222, display_name="Bob")
    demo_scores = award_point(demo_scores, user_id=111, display_name="Alice")
    print(leaderboard_text(demo_scores))
    SCORES_PATH.unlink(missing_ok=True)  # clean up this demo's file
