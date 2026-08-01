"""Embeds every chunk from prepare_repo.py and saves the vectors + text
locally, so query.py (Step 4) doesn't re-embed anything at query time.

Run with: uv run python build_index.py /path/to/repo
Re-run this any time the repo changes -- the saved index doesn't update itself.
"""

import json
import sys
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer

from prepare_repo import load_chunks

MODEL_NAME = "all-MiniLM-L6-v2"
INDEX_PATH = "index.npy"
CHUNKS_PATH = "chunks.json"


def main() -> None:
    chunks = load_chunks(Path(sys.argv[1]))
    if not chunks:
        print("No chunks found -- did you pass a valid repo path?")
        return

    print(f"Embedding {len(chunks)} chunks with {MODEL_NAME}...")
    model = SentenceTransformer(MODEL_NAME)
    texts = [c["text"] for c in chunks]
    embeddings = model.encode(texts, normalize_embeddings=True)

    np.save(INDEX_PATH, embeddings)
    with open(CHUNKS_PATH, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)

    print(f"Saved {embeddings.shape[0]} vectors ({embeddings.shape[1]}-dim) to {INDEX_PATH}")
    print(f"Saved chunk text/metadata (including line ranges) to {CHUNKS_PATH}")


if __name__ == "__main__":
    main()
