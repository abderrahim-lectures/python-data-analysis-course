"""Dedupe listings.csv with pandas, filter to listings matching a keyword,
and print/save only the ones that are *new* since the last run.

Run aggregate.py first to produce listings.csv.
"""
import json
from pathlib import Path

import pandas as pd

LISTINGS_CSV = "listings.csv"
SEEN_FILE = Path("seen.json")

# Case-insensitive keywords to match against title + description. A listing
# matches if ANY keyword appears in either field.
KEYWORDS = ["python"]


def load_seen():
    """dedupe_keys we've already alerted on in a previous run, if any."""
    if SEEN_FILE.exists():
        return set(json.loads(SEEN_FILE.read_text(encoding="utf-8")))
    return set()


def save_seen(dedupe_keys):
    SEEN_FILE.write_text(json.dumps(sorted(dedupe_keys)), encoding="utf-8")


def dedupe_listings(df):
    """Collapses listings posted to more than one board down to one row.

    Keeping the first occurrence is an arbitrary but reasonable choice --
    both copies carry the same title/company, so which board "wins" doesn't
    change what the alert says, only which source column it prints.
    """
    before = len(df)
    deduped = df.drop_duplicates(subset="dedupe_key", keep="first").reset_index(drop=True)
    print(f"Deduped {before} listings -> {len(deduped)} unique jobs "
          f"({before - len(deduped)} duplicate posting(s) removed)")
    return deduped


def keyword_filter(df, keywords):
    """Rows where title or description contains any keyword, case-insensitive."""
    pattern = "|".join(keywords)
    text = df["title"].str.cat(df["description"], sep=" ")
    return df[text.str.contains(pattern, case=False, regex=True, na=False)]


if __name__ == "__main__":
    df = pd.read_csv(LISTINGS_CSV)
    df = dedupe_listings(df)

    matches = keyword_filter(df, KEYWORDS)
    print(f"{len(matches)} unique listing(s) match keywords {KEYWORDS}")

    seen = load_seen()
    new_matches = matches[~matches["dedupe_key"].isin(seen)]

    if new_matches.empty:
        print("No new matches since the last run.")
    else:
        print(f"\n{len(new_matches)} NEW match(es):\n")
        for _, row in new_matches.iterrows():
            print(f"- {row['title']} @ {row['company']} ({row['location']}) [{row['source']}]")
        new_matches.to_csv("new_matches.csv", index=False)
        print("\nSaved to new_matches.csv")

    # Mark every current match (new or already-seen) as seen for next time,
    # so a second run against the same data reports zero new matches.
    save_seen(seen | set(matches["dedupe_key"]))
