"""Compares semantic search against simple keyword search on the same index.

Run with: uv run python compare.py "your query here"
"""

import json
import sys

from search import search


def keyword_search(query: str, records: list[dict], top_k: int = 5) -> list[dict]:
    """Ranks records by how many query words appear in their title, treating
    it as the closest thing to what a browser's bookmark search does."""
    words = [w.lower() for w in query.split() if len(w) > 2]
    scored = []
    for record in records:
        title_lower = record["title"].lower()
        hits = sum(1 for w in words if w in title_lower)
        if hits:
            scored.append({**record, "score": hits})
    scored.sort(key=lambda r: r["score"], reverse=True)
    return scored[:top_k]


def main() -> None:
    query = " ".join(sys.argv[1:]) or "how do I split data into train and test"
    with open("records.json", encoding="utf-8") as f:
        records = json.load(f)

    print("Keyword search:")
    for r in keyword_search(query, records):
        print(f"  {r['score']} hit(s)  [{r['folder']}] {r['title']}")

    print("\nSemantic search:")
    for r in search(query):
        print(f"  {r['score']:.3f}  [{r['folder']}] {r['title']}")


if __name__ == "__main__":
    main()
