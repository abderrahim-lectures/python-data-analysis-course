"""OPTIONAL "go further" extension -- NOT part of the main lesson path.

Fetches your most recent unread emails from a real inbox over IMAP and
saves them as local .txt files that triage.py can read, instead of (not in
addition to) the bundled sample_emails/.

Read-only, on purpose:
- Logs in with an IMAP "app password", never your real account password.
- mark_seen=False below means fetching a message here does NOT mark it as
  read in your real inbox.
- This script only ever downloads text and writes it to disk. It cannot
  delete, modify, or send anything -- there is no code path here that does.

Needs the optional imap-tools package (not installed by default, since the
main lesson path doesn't need it):
    uv add imap-tools

And IMAP credentials in .env -- see the lesson's "Optional: connect to a
real inbox" step for how to safely create a Gmail "app password".

Run with: uv run python fetch_from_imap.py
Then triage what it downloaded with: uv run python triage.py real_emails
"""

import os
from pathlib import Path

from dotenv import load_dotenv
from imap_tools import AND, MailBox

load_dotenv()

OUTPUT_DIR = Path(__file__).parent / "real_emails"
FETCH_LIMIT = 10  # how many recent unread messages to pull


def main() -> None:
    host = os.environ["IMAP_HOST"]
    user = os.environ["IMAP_USER"]
    password = os.environ["IMAP_APP_PASSWORD"]

    OUTPUT_DIR.mkdir(exist_ok=True)

    with MailBox(host).login(user, password, initial_folder="INBOX") as mailbox:
        messages = list(
            mailbox.fetch(AND(seen=False), limit=FETCH_LIMIT, mark_seen=False, reverse=True)
        )
        print(f"Fetched {len(messages)} unread message(s) -- none marked as read in your inbox.")

        for i, msg in enumerate(messages, start=1):
            text = (
                f"From: {msg.from_}\n"
                f"Subject: {msg.subject}\n"
                f"Date: {msg.date}\n\n"
                f"{msg.text or msg.html or '(no body)'}"
            )
            out_path = OUTPUT_DIR / f"real_{i:02d}.txt"
            out_path.write_text(text, encoding="utf-8")
            print(f"  saved {out_path}")

    print(f"\nDone. Now run: uv run python triage.py {OUTPUT_DIR.name}")


if __name__ == "__main__":
    main()
