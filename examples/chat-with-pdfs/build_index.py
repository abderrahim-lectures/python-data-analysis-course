"""Embeds every chunk from load_pdfs.py and saves the vectors + text
(including source filename and page number) locally, so retrieve() (Step 3)
doesn't need to re-embed anything at query time.

Run with: uv run python build_index.py
Re-run this any time you add, remove, or edit files in pdfs/ -- the saved
index doesn't update itself.
"""

import json

import numpy as np
from sentence_transformers import SentenceTransformer

from load_pdfs import load_chunks

MODEL_NAME = "all-MiniLM-L6-v2"
INDEX_PATH = "index.npy"
CHUNKS_PATH = "chunks.json"


def main() -> None:
    chunks = load_chunks()
    if not chunks:
        print("No chunks found -- add some .pdf files to pdfs/ first "
              "(or run generate_sample_pdfs.py).")
        return

    print(f"Embedding {len(chunks)} chunks with {MODEL_NAME}...")
    model = SentenceTransformer(MODEL_NAME)
    texts = [chunk["text"] for chunk in chunks]
    embeddings = model.encode(texts, normalize_embeddings=True)

    np.save(INDEX_PATH, embeddings)
    with open(CHUNKS_PATH, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)

    print(f"Saved {embeddings.shape[0]} vectors ({embeddings.shape[1]}-dim) to {INDEX_PATH}")
    print(f"Saved chunk text/metadata (source + page) to {CHUNKS_PATH}")


if __name__ == "__main__":
    main()
