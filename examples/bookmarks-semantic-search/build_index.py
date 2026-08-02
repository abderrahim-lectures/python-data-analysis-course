"""Embeds every bookmark from parse_bookmarks.py and saves the vectors +
records locally, so search.py (Step 3) doesn't re-embed at query time.

Run with: uv run python build_index.py bookmarks.html
Re-run this any time you add or edit bookmarks -- the saved index doesn't
update itself.
"""

import json
import sys
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer

from parse_bookmarks import load_bookmarks

MODEL_NAME = "all-MiniLM-L6-v2"
INDEX_PATH = "index.npy"
RECORDS_PATH = "records.json"


def main() -> None:
    records = load_bookmarks(Path(sys.argv[1]))
    if not records:
        print("No bookmarks parsed -- is this a Netscape-format export?")
        return

    print(f"Embedding {len(records)} bookmarks with {MODEL_NAME}...")
    model = SentenceTransformer(MODEL_NAME)
    texts = [r["title"] for r in records]
    embeddings = model.encode(texts, normalize_embeddings=True)

    np.save(INDEX_PATH, embeddings)
    with open(RECORDS_PATH, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    print(f"Saved {embeddings.shape[0]} vectors ({embeddings.shape[1]}-dim) to {INDEX_PATH}")
    print(f"Saved bookmark records to {RECORDS_PATH}")


if __name__ == "__main__":
    main()
