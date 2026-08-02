"""Given a question, finds the repo chunks most relevant to it.

Imported by query.py (Step 3) -- the __main__ block below lets you try it
standalone.
"""

import json

import numpy as np
from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"
INDEX_PATH = "index.npy"
CHUNKS_PATH = "chunks.json"

_model = None  # loaded lazily so importing this module doesn't load the model


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def retrieve(question: str, top_k: int = 3) -> list[dict]:
    embeddings = np.load(INDEX_PATH)
    with open(CHUNKS_PATH, encoding="utf-8") as f:
        chunks = json.load(f)

    question_vector = get_model().encode([question], normalize_embeddings=True)[0]
    similarities = embeddings @ question_vector

    top_indices = np.argsort(similarities)[::-1][:top_k]
    return [
        {**chunks[i], "score": float(similarities[i])}
        for i in top_indices
    ]


if __name__ == "__main__":
    for r in retrieve("How does the course build this website?"):
        print(f"{r['score']:.3f}  [{r['source']}:{r['start']}-{r['end']}]  {r['text'][:70]}...")
