"""Fetches a repo's recent commit history as structured records.

Run with: uv run python fetch_commits.py [max_commits]
This prints a summary -- generate.py (Step 2) imports load_commits().
Run from inside a git repo (or a folder that is one).
"""

import subprocess
import sys


def _run_git(args: list[str]) -> str:
    """Runs `git <args>` in the current directory and returns its stdout."""
    result = subprocess.run(
        ["git", *args],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)} failed:\n{result.stderr}")
    return result.stdout


def load_commits(max_commits: int = 50) -> list[dict]:
    """Returns the last `max_commits` commits, newest first."""
    raw = _run_git(
        [
            "log",
            f"-{max_commits}",
            # One record per commit, fields separated by a NUL byte so that
            # neither subject text nor hashes can accidentally blur together.
            "--format=%H%x00%an%x00%ad%x00%s%x00%x00",
            "--date=short",
        ]
    )
    commits = []
    for block in raw.split("\x00\x00"):
        block = block.strip("\n")
        if not block:
            continue
        parts = block.split("\x00")
        if len(parts) < 4:
            continue
        commit = {
            "hash": parts[0],
            "author": parts[1],
            "date": parts[2],
            "subject": parts[3],
        }
        commits.append(commit)
    return commits


if __name__ == "__main__":
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 50
    commits = load_commits(limit)
    print(f"Fetched {len(commits)} commits")
    for c in commits[:5]:
        print(f"  {c['hash'][:8]} {c['date']}  {c['author']}: {c['subject']}")
