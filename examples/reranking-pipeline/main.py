"""Retrieve Fast, Re-Rank Smart -- a two-stage retrieval demo.

Stage 1 (fast, free): a tiny lexical scorer. It tokenizes the query and
counts how much each corpus document's words overlap with it. Pure Python
plus one NumPy call -- milliseconds per query, no model, no download.

Stage 2 (slow, accurate): a cross-encoder re-ranker. The
cross-encoder/ms-marco-MiniLM-L-6-v2 model reads the query and each
candidate document *together* and scores how well the document answers the
query. Far more accurate, far slower -- so you only run it on the top-K
shortlist that stage 1 produced.

This project is about making that tradeoff visible: run the same test
queries through both pipelines and compare precision@1 / precision@3 and
time per query.

Run with:
    uv run python main.py                          # benchmark over data/test_queries.json
    uv run python main.py --query "what is a bank"  # one interactive query
    uv run python main.py --top-k 8                 # re-rank 8 candidates instead of 5
"""

from __future__ import annotations

import argparse
import json
import re
import time
from collections import Counter
from pathlib import Path

import numpy as np

CORPUS_DIR = Path("data/corpus")
TEST_QUERIES_PATH = Path("data/test_queries.json")
DEFAULT_CROSS_ENCODER = "cross-encoder/ms-marco-MiniLM-L-6-v2"

# Words that carry no retrieval signal. The fast stage ignores them, which
# is already a step up from naive string matching -- but it is still just
# word overlap, so it has no idea that "biggest" and "largest" are related.
STOPWORDS = frozenset(
    """
    a an and are as at be by for from how in is it of on or that the this
    to was what when where which who with you your
    """.split()
)

_reranker = None  # loaded lazily so --query-less runs stay cheap to import


def load_documents(corpus_dir: Path) -> list[dict]:
    """Reads every *.txt file in corpus_dir into {"id", "path", "text"} dicts."""
    documents = []
    for path in sorted(corpus_dir.glob("*.txt")):
        text = path.read_text(encoding="utf-8").strip()
        if text:
            documents.append({"id": path.name, "path": str(path), "text": text})
    return documents


def load_test_queries(path: Path) -> list[dict]:
    """Reads [{"query": ..., "relevant": [doc ids]}, ...] from test_queries.json."""
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def tokenize(text: str) -> Counter:
    """Lowercases, splits on non-alphanumerics, drops stopwords."""
    tokens = re.findall(r"[a-z0-9]+", text.lower())
    return Counter(tok for tok in tokens if tok not in STOPWORDS)


def tokens_overlap(query_tokens: Counter, doc_tokens: Counter) -> float:
    """How many query tokens the document shares, using a naive 3-character
    prefix match so that "hunts"/"hunt" and "planet"/"planets" still count
    as the same word. Intentionally crude -- this is the *cheap* stage."""
    overlap = 0.0
    for q_tok, q_count in query_tokens.items():
        for d_tok, d_count in doc_tokens.items():
            if q_tok == d_tok or q_tok[:3] == d_tok[:3]:
                overlap += q_count * min(q_count, d_count)
                break
    return overlap


def lexical_scores(query: str, documents: list[dict]) -> np.ndarray:
    """Fast stage: returns one overlap score per document."""
    query_tokens = tokenize(query)
    return np.array([tokens_overlap(query_tokens, tokenize(doc["text"])) for doc in documents])


def top_k_indices(scores: np.ndarray, k: int) -> np.ndarray:
    """Indices of the k highest-scoring documents, highest first.

    Uses np.argpartition instead of a full sort -- O(n) to find the top-k
    no matter how large the corpus is, which is the whole point of a stage
    meant to stay fast at scale.
    """
    if k >= len(scores):
        return np.argsort(scores)[::-1]
    idx = np.argpartition(scores, -k)[-k:]
    return idx[np.argsort(scores[idx])[::-1]]


def get_reranker(model_name: str):
    """Loads (and caches) the cross-encoder. Downloads ~80MB on first run."""
    global _reranker
    if _reranker is None:
        from sentence_transformers import CrossEncoder

        print(f"Loading cross-encoder {model_name} (downloads ~80MB on first run)...")
        _reranker = CrossEncoder(model_name)
    return _reranker


def rerank(query: str, candidates: list[dict], model_name: str) -> list[tuple[float, dict]]:
    """Re-ranks the candidate documents by cross-encoder relevance score.

    The model reads (query, document) as a *pair*, so it can compare the
    two directly instead of comparing two separately-computed vectors.
    """
    model = get_reranker(model_name)
    pairs = [(query, doc["text"]) for doc in candidates]
    scores = model.predict(pairs)
    ranked = sorted(zip(map(float, scores), candidates), key=lambda t: t[0], reverse=True)
    return ranked


def retrieve(query: str, documents: list[dict], top_k: int, rerank_flag: bool,
             model_name: str) -> tuple[list[tuple[float, dict]], float]:
    """Runs the chosen pipeline and returns (ranking, elapsed_seconds).

    ranking is a list of (score, document) sorted best-first, always of
    length top_k: the fast stage's own top-k when rerank_flag is False,
    the cross-encoder's re-ranking of that same shortlist otherwise.
    """
    start = time.perf_counter()
    scores = lexical_scores(query, documents)
    shortlist = [documents[i] for i in top_k_indices(scores, top_k)]
    if rerank_flag:
        ranking = rerank(query, shortlist, model_name)
    else:
        ranking = [(float(scores[documents.index(doc)]), doc) for doc in shortlist]
    elapsed = time.perf_counter() - start
    return ranking, elapsed


def precision_at(ranking: list[tuple[float, dict]], relevant: set[str], k: int) -> int:
    """1 if any of the top-k documents is relevant, else 0 (per-query, so 0/1)."""
    top_ids = {doc["id"] for _, doc in ranking[:k]}
    return int(bool(top_ids & relevant))


def print_ranking(ranking: list[tuple[float, dict]], limit: int, label: str, relevant: set[str]) -> None:
    """Prints a ranked list with scores and a checkmark on relevant hits."""
    print(f"  {label}")
    for score, doc in ranking[:limit]:
        hit = "  <-- relevant" if doc["id"] in relevant else ""
        print(f"    {score:8.3f}  {doc['id']}{hit}")
    print()


def run_query_mode(query: str, documents: list[dict], top_k: int, show: int,
                   model_name: str) -> None:
    relevant = set()  # interactive queries have no ground truth to mark
    fast_ranking, fast_time = retrieve(query, documents, top_k, False, model_name)
    rerank_ranking, rerank_time = retrieve(query, documents, top_k, True, model_name)
    print(f"\nQuery: {query}\n")
    print_ranking(fast_ranking, show, f"fast-only top-{show} (keyword overlap, {fast_time * 1000:.1f} ms)", relevant)
    print_ranking(rerank_ranking, show, f"re-ranked top-{show} (cross-encoder, {rerank_time * 1000:.1f} ms)", relevant)


def run_benchmark(documents: list[dict], test_queries: list[dict], top_k: int,
                  model_name: str) -> None:
    # Load the cross-encoder once, before any timing starts, so the numbers
    # below measure retrieval/re-ranking only -- not the one-time ~80MB
    # download or the model load, which happen on every cold start.
    get_reranker(model_name)

    print(f"\nBenchmark: {len(test_queries)} test queries, top_k={top_k} candidates")
    print("=" * 76)
    print(f"{'query':<62} {'fast top1':>9} {'rerank top1':>11}")
    print("-" * 76)

    fast_p1, fast_p3 = [], []
    rerank_p1, rerank_p3 = [], []
    fast_times, rerank_times = [], []

    for item in test_queries:
        query = item["query"]
        relevant = set(item["relevant"])

        fast_ranking, fast_time = retrieve(query, documents, top_k, False, model_name)
        rerank_ranking, rerank_time = retrieve(query, documents, top_k, True, model_name)

        fast_p1.append(precision_at(fast_ranking, relevant, 1))
        fast_p3.append(precision_at(fast_ranking, relevant, 3))
        rerank_p1.append(precision_at(rerank_ranking, relevant, 1))
        rerank_p3.append(precision_at(rerank_ranking, relevant, 3))
        fast_times.append(fast_time)
        rerank_times.append(rerank_time)

        fast_top = fast_ranking[0][1]["id"] if fast_ranking else "-"
        rerank_top = rerank_ranking[0][1]["id"] if rerank_ranking else "-"
        print(f"{query[:60]:<62} {fast_top:>9} {rerank_top:>11}")

    print("-" * 76)
    print(f"\n{'method':<28} {'p@1':>6} {'p@3':>6} {'avg ms/query':>13}")
    print("-" * 58)
    print(f"{'fast-only (keyword)':<28} {np.mean(fast_p1):>6.2f} {np.mean(fast_p3):>6.2f} "
          f"{np.mean(fast_times) * 1000:>10.1f} ms")
    print(f"{'fast + re-rank':<28} {np.mean(rerank_p1):>6.2f} {np.mean(rerank_p3):>6.2f} "
          f"{np.mean(rerank_times) * 1000:>10.1f} ms")
    print(f"\nRe-ranking improved p@1 by "
          f"{np.mean(rerank_p1) - np.mean(fast_p1):+.2f} and p@3 by "
          f"{np.mean(rerank_p3) - np.mean(fast_p3):+.2f}, at "
          f"{np.mean(rerank_times) / max(np.mean(fast_times), 1e-9):.0f}x the per-query cost.")
    print("(Per-query times exclude the one-time model download/load.)")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Two-stage retrieval: fast keyword stage + cross-encoder re-ranker."
    )
    parser.add_argument("--query", type=str, default=None,
                        help="Run one interactive query instead of the benchmark.")
    parser.add_argument("--top-k", type=int, default=5,
                        help="How many candidates the fast stage hands to the re-ranker.")
    parser.add_argument("--show", type=int, default=3,
                        help="How many results to display per ranking.")
    parser.add_argument("--corpus-dir", type=Path, default=CORPUS_DIR,
                        help="Folder of *.txt passages to search over.")
    parser.add_argument("--test-queries", type=Path, default=TEST_QUERIES_PATH,
                        help="JSON file of test queries for the benchmark.")
    parser.add_argument("--cross-encoder", type=str, default=DEFAULT_CROSS_ENCODER,
                        help="sentence-transformers CrossEncoder model name.")
    args = parser.parse_args()

    documents = load_documents(args.corpus_dir)
    if not documents:
        parser.error(f"no *.txt passages found in {args.corpus_dir}")

    if args.query:
        run_query_mode(args.query, documents, args.top_k, args.show, args.cross_encoder)
        return

    test_queries = load_test_queries(args.test_queries)
    run_benchmark(documents, test_queries, args.top_k, args.cross_encoder)


if __name__ == "__main__":
    main()
