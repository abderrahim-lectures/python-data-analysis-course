"""Creates a small sample git repo with realistically messy commit history,
so the changelog tool has something to work with out of the box.

Run with: uv run python make_sample_repo.py
Creates ./sample_repo with ~15 commits (mix of features, fixes, docs, and
noise like merge commits and "wip"), then prints the fetched commit list.
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

REPO = Path("sample_repo")

STEPS = [
    ("feat: add user login with email verification", "app.py", "def login():\n    pass\n"),
    ("wip", "app.py", "def login():\n    return email\n"),
    ("fix: handle empty email in login", "app.py", "def login(email):\n    return email.strip() or None\n"),
    ("add README", "README.md", "# Sample App\n"),
    ("feat: password reset flow", "auth.py", "def reset_password():\n    pass\n"),
    ("Merge branch 'feature/reset'", "auth.py", "def reset_password():\n    return True\n"),
    ("docs: clarify setup steps in README", "README.md", "# Sample App\n\n## Setup\n1. Install\n"),
    ("fix: reset token expiry", "auth.py", "from datetime import timedelta\nTOKEN_TTL = timedelta(hours=1)\n"),
    ("refactor utils", "utils.py", "def normalize(s):\n    return s\n"),
    ("feat: dark mode toggle", "theme.py", "def toggle_theme():\n    pass\n"),
    ("tweak", "theme.py", "def toggle_theme():\n    return 'dark'\n"),
    ("fix: flash on toggle", "theme.py", "def toggle_theme():\n    from time import sleep\n    sleep(0)\n    return 'dark'\n"),
    ("feat: export CSV report", "reports.py", "def export_csv():\n    return []\n"),
    ("bump version to 1.2.0", "pyproject.toml", "version = \"1.2.0\"\n"),
]


def make_repo() -> None:
    if REPO.exists():
        import shutil

        shutil.rmtree(REPO)
    REPO.mkdir()
    os.chdir(REPO)

    def git(*args: str) -> None:
        subprocess.run(["git", *args], check=True, capture_output=True)

    git("init", "-q")
    git("config", "user.email", "student@example.com")
    git("config", "user.name", "Student")

    for subject, filename, content in STEPS:
        Path(filename).write_text(content)
        git("add", "-A")
        git("commit", "-q", "-m", subject)
    os.chdir("..")
    print(f"Created {REPO}/ with {len(STEPS)} commits")


if __name__ == "__main__":
    make_repo()
    sys.path.insert(0, ".")
    from fetch_commits import load_commits

    os.chdir(REPO)
    for c in load_commits(50):
        print(f"  {c['hash'][:8]} {c['date']}  {c['author']}: {c['subject']}")
