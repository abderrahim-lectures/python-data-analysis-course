"""Given a natural-language query, ranks bookmarks by relevance.

Run with: uv run python search.py "describe what you're looking for"
"""

import sys

import numpy as np
from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"
INDEX_PATH = "index.npy"
RECORDS_PATH = "records.json"

_model = None  # loaded lazily so importing this module doesn't load the model


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def search(query: str, top_k: int = 5) -> list[dict]:
    import json

    embeddings = np.load(INDEX_PATH)
    with open(RECORDS_PATH, encoding="utf-8") as f:
        records = json.load(f)

    query_vector = get_model().encode([query], normalize_embeddings=True)[0]
    similarities = embeddings @ query_vector

    top_indices = np.argsort(similarities)[::-1][:top_k]
    return [
        {**records[i], "score": float(similarities[i])}
        for i in top_indices
    ]


if __name__ == "__main__":
    query = " ".join(sys.argv[1:]) or "course website"
    for r in search(query):
        print(f"{r['score']:.3f}  [{r['folder']}] {r['title']}\n      {r['url']}")
