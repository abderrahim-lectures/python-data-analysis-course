"""Given a question, finds the PDF chunks most relevant to it, across every
document in pdfs/ -- each result carries its source filename and page number.

Imported by ask.py (Step 4) -- not meant to be run directly, though the
__main__ block below lets you try it standalone.
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


def retrieve(question: str, top_k: int = 4) -> list[dict]:
    """Returns the top_k chunks most similar to `question`, each with its
    similarity score, source document, and page number, ranked highest
    first -- possibly drawn from several different PDFs at once."""
    embeddings = np.load(INDEX_PATH)
    with open(CHUNKS_PATH, encoding="utf-8") as f:
        chunks = json.load(f)

    question_vector = get_model().encode([question], normalize_embeddings=True)[0]

    # Every row of `embeddings` is already unit-length (Step 2), and so is
    # question_vector, so this dot product *is* the cosine similarity.
    similarities = embeddings @ question_vector

    top_indices = np.argsort(similarities)[::-1][:top_k]
    return [
        {**chunks[i], "score": float(similarities[i])}
        for i in top_indices
    ]


if __name__ == "__main__":
    results = retrieve("How many days of paid time off do employees get?")
    for r in results:
        print(f"{r['score']:.3f}  [{r['source']} p{r['page']}]  {r['text'][:80]}...")
