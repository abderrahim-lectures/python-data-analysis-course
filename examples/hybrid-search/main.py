"""Hybrid search demo: run keyword (BM25-style), embedding (semantic), and
hybrid retrieval side by side over a small bundled corpus, and see where each
approach wins and loses.

No LLM, no API key, no .env — the only heavyweight dependency is the local
embedding model, which sentence-transformers downloads on first run.

See docs/projects/hybrid-search/index.md for the full walkthrough.

Usage:
    uv run python main.py build                 # build the embedding index once
    uv run python main.py "some query"          # compare all three methods
    uv run python main.py "some query" --top-k 5
    uv run python main.py --evaluate            # run the bundled test queries
    uv run python main.py --evaluate --top-k 3  #   and print a winners table
"""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
from collections import Counter
from pathlib import Path

import numpy as np

CORPUS_DIR = Path("data/corpus")
INDEX_PATH = Path("data/index.npy")
TEST_QUERIES_PATH = Path("data/test_queries.json")
MODEL_NAME = "all-MiniLM-L6-v2"
DEFAULT_ALPHA = 0.5  # hybrid = alpha * keyword_score + (1 - alpha) * semantic_score

_WORD_RE = re.compile(r"[a-z0-9']+")

# Words too common to carry any search signal, on either the document or the
# query side. Without this filter, queries full of stopwords give every
# document a tiny, near-identical BM25 score, which muddies the ranking.
STOPWORDS = frozenset(
    """
    a an the and or but if then so of to in on for with at by from as is are
    was were be been being do does did has have had it its this that these
    those i you he she we they them their there here how why what which who
    whom when where than too very can could will would should may might must
    not no yes over under up down out off again all any both each few more
    most other some such only own same about into through during before after
    above below between because against rather
    """.split()
)


def tokenize(text: str) -> list[str]:
    """Lowercases text, splits it into word tokens, and drops stopwords."""
    return [t for t in _WORD_RE.findall(text.lower()) if t not in STOPWORDS]


# ---------------------------------------------------------------------------
# Corpus
# ---------------------------------------------------------------------------


def load_corpus() -> list[dict]:
    """Returns one {"id", "text"} dict per .txt file in CORPUS_DIR, sorted by filename."""
    documents = []
    for path in sorted(CORPUS_DIR.glob("*.txt")):
        documents.append({"id": path.name, "text": path.read_text(encoding="utf-8").strip()})
    if not documents:
        raise SystemExit(
            f"No corpus found under {CORPUS_DIR}/ — run this from the examples/hybrid-search "
            "directory (or add some .txt files yourself)."
        )
    return documents


# ---------------------------------------------------------------------------
# Keyword: a small BM25-style scorer, built from scratch
# ---------------------------------------------------------------------------


class KeywordScorer:
    """BM25-ish lexical scoring over the corpus, computed on the fly.

    idf(t) = ln(1 + (N - df(t) + 0.5) / (df(t) + 0.5)), and each document gets
    a sum over query terms of idf(t) * tf_saturation(t, doc). The two constants
    k1 and b control term-frequency saturation and length normalization — the
    standard BM25 values work fine for a corpus this small.
    """

    K1 = 1.5
    B = 0.75

    def __init__(self, documents: list[dict]) -> None:
        self.doc_ids = [doc["id"] for doc in documents]
        self.lengths = np.array([len(tokenize(doc["text"])) for doc in documents], dtype=float)
        self.avgdl = float(self.lengths.mean())

        self.doc_terms: list[Counter] = []
        df: Counter[str] = Counter()
        for doc in documents:
            terms = Counter(tokenize(doc["text"]))
            self.doc_terms.append(terms)
            df.update(terms.keys())

        n_docs = len(documents)
        self.idf: dict[str, float] = {
            term: math.log(1.0 + (n_docs - freq + 0.5) / (freq + 0.5))
            for term, freq in df.items()
        }

    def score(self, query: str) -> np.ndarray:
        """Returns a raw BM25 score per document, higher is better."""
        scores = np.zeros(len(self.doc_ids))
        for term in set(tokenize(query)):
            idf = self.idf.get(term, 0.0)
            if idf == 0.0:
                continue
            for i, terms in enumerate(self.doc_terms):
                tf = terms.get(term, 0)
                if tf:
                    denom = tf + self.K1 * (1 - self.B + self.B * self.lengths[i] / self.avgdl)
                    scores[i] += idf * (tf * (self.K1 + 1)) / denom
        return scores


# ---------------------------------------------------------------------------
# Semantic: local embeddings + cosine similarity
# ---------------------------------------------------------------------------


_model = None


def get_model():
    """Loads the sentence-transformers model lazily, so importing this module
    (or running keyword-only paths) doesn't download 80MB for nothing."""
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer

        _model = SentenceTransformer(MODEL_NAME)
    return _model


def embed_texts(texts: list[str]) -> np.ndarray:
    return get_model().encode(texts, normalize_embeddings=True)


def semantic_scores(question: str, embeddings: np.ndarray) -> np.ndarray:
    """Cosine similarity of the question against every stored document embedding.

    Every vector is unit-length (normalize_embeddings=True), so the dot product
    already is the cosine similarity.
    """
    question_vector = embed_texts([question])[0]
    return embeddings @ question_vector


# ---------------------------------------------------------------------------
# Hybrid
# ---------------------------------------------------------------------------


def minmax_normalize(scores: np.ndarray) -> np.ndarray:
    """Scales a score array to [0, 1] per query, so BM25's arbitrary magnitude
    can be combined with cosine similarity. An all-equal array maps to zeros."""
    lo, hi = float(scores.min()), float(scores.max())
    if hi - lo < 1e-12:
        return np.zeros_like(scores)
    return (scores - lo) / (hi - lo)


def hybrid_scores(keyword: np.ndarray, semantic: np.ndarray, alpha: float) -> np.ndarray:
    return alpha * minmax_normalize(keyword) + (1 - alpha) * minmax_normalize(semantic)


# ---------------------------------------------------------------------------
# Ranking + pretty printing
# ---------------------------------------------------------------------------

METHODS = ("keyword", "semantic", "hybrid")


def rank(documents: list[dict], scores: np.ndarray, top_k: int, drop_zeros: bool = False) -> list[dict]:
    """Top-k documents for a score array, highest first. With drop_zeros=True
    (used for keyword, whose scores are exactly 0 for documents that share no
    vocabulary with the query), genuine matches only."""
    order = np.argsort(scores)[::-1][:top_k]
    hits = []
    for i in order:
        if drop_zeros and scores[i] <= 0:
            continue
        hits.append({"id": documents[i]["id"], "score": float(scores[i]), "text": documents[i]["text"]})
    return hits


def retrieve_all(documents, embeddings, query, alpha, top_k):
    kw_scores = KeywordScorer(documents).score(query)
    sem_scores = semantic_scores(query, embeddings)
    hy_scores = hybrid_scores(kw_scores, sem_scores, alpha)
    return {
        "keyword": rank(documents, kw_scores, top_k, drop_zeros=True),
        "semantic": rank(documents, sem_scores, top_k),
        "hybrid": rank(documents, hy_scores, top_k),
    }


def preview(text: str, width: int = 70) -> str:
    one_line = " ".join(text.split())
    return one_line if len(one_line) <= width else one_line[: width - 1] + "…"


def print_query_table(query: str, results: dict[str, list[dict]], expected: str | None = None) -> None:
    print(f"\nQuery: {query}")
    if expected:
        print(f"Expected best match: {expected}")
    for method in METHODS:
        print(f"\n  [{method}]")
        for hit in results[method]:
            marker = "  <= expected" if expected and hit["id"] == expected else ""
            print(f"    {hit['score']:>6.3f}  {hit['id']}{marker}")
            print(f"             {preview(hit['text'])}")
        if not results[method]:
            print("    (no hits)")


# ---------------------------------------------------------------------------
# Evaluate mode
# ---------------------------------------------------------------------------


def winner_for(expected: str, results: dict[str, list[dict]]) -> list[str]:
    """Every method that put the expected document at rank 1."""
    return [m for m in METHODS if results[m] and results[m][0]["id"] == expected]


def run_evaluation(documents, embeddings, test_queries, alpha, top_k) -> None:
    from collections import defaultdict

    wins = defaultdict(int)
    print(f"Running {len(test_queries)} test queries (top-{top_k}, alpha={alpha})...")

    for item in test_queries:
        query = item["query"]
        expected = item["expected"]
        results = retrieve_all(documents, embeddings, query, alpha, top_k)
        print_query_table(query, results, expected=expected)
        winners = winner_for(expected, results)
        print(f"  -> won by: {', '.join(winners) if winners else 'nobody (expected doc missed)'}")
        for method in winners:
            wins[method] += 1

    print("\n" + "=" * 60)
    print("Winners summary: how often each method got the expected doc to rank 1")
    print("=" * 60)
    for method in METHODS:
        print(f"  {method:>9}: {wins[method]:>2}/{len(test_queries)}")
    print("\nThere is no single 'best' retriever — keyword wins on vocabulary "
          "queries, embeddings on paraphrase queries, and hybrid keeps both.")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__.splitlines()[0],
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__[__doc__.find("Usage:"):],
    )
    parser.add_argument("query", nargs="*", help="The search query (quoted). Omit it to only build the index or run --evaluate.")
    parser.add_argument("--build", action="store_true", help="Embed the corpus and save data/index.npy, then exit.")
    parser.add_argument("--evaluate", action="store_true", help="Run the bundled test queries in data/test_queries.json.")
    parser.add_argument("--top-k", type=int, default=3, help="How many top hits to print per method (default 3).")
    parser.add_argument("--alpha", type=float, default=DEFAULT_ALPHA, help="Hybrid weight on keyword vs semantic, 0-1 (default 0.5).")
    parser.add_argument("--reuse-index", action="store_true", help="Reuse an existing data/index.npy instead of re-embedding.")
    args = parser.parse_args()

    documents = load_corpus()
    print(f"Loaded {len(documents)} documents from {CORPUS_DIR}/")

    if args.build or (not args.reuse_index and not INDEX_PATH.exists()):
        print(f"Embedding {len(documents)} documents with {MODEL_NAME}...")
        embeddings = embed_texts([doc["text"] for doc in documents])
        INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)
        np.save(INDEX_PATH, embeddings)
        print(f"Saved {embeddings.shape[0]} x {embeddings.shape[1]} embedding matrix to {INDEX_PATH}")
    else:
        embeddings = np.load(INDEX_PATH)
        print(f"Loaded {embeddings.shape[0]} x {embeddings.shape[1]} embeddings from {INDEX_PATH}")

    if args.build:
        return

    if args.evaluate:
        if not TEST_QUERIES_PATH.exists():
            raise SystemExit(f"No {TEST_QUERIES_PATH} found — run this from the examples/hybrid-search directory.")
        test_queries = json.loads(TEST_QUERIES_PATH.read_text(encoding="utf-8"))
        run_evaluation(documents, embeddings, test_queries, args.alpha, args.top_k)
        return

    query = " ".join(args.query).strip()
    if not query:
        parser.print_help()
        return

    results = retrieve_all(documents, embeddings, query, args.alpha, args.top_k)
    print_query_table(query, results)


if __name__ == "__main__":
    main()
