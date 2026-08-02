"""Multi-hop question answering over a small Wikipedia-style sample.

A two-round retrieval pipeline. Most RAG apps do a single retrieval pass and
then ask the model to answer -- this project's thesis is that a whole class of
questions *needs more than one pass*: questions whose answer only exists once
facts from two different documents are combined. Single-hop RAG retrieves one
of the two documents, the model has to guess the rest, and you get a
plausible-sounding but wrong answer.

The multi-hop pipeline here is deliberately minimal:
  Round 1: retrieve the top-K chunks for the question, and ask the model to
           answer *or* to say the evidence is incomplete.
  Round 2: if incomplete, the model writes a follow-up search query, we
           retrieve a second set of chunks with it, and answer from the
           combined evidence.

Both paths print side by side with the evidence chunks each one actually used,
so you can audit exactly why one got a question wrong and the other got it right.

The sample corpus lives in data/articles/*.md -- short, plain-text summaries of
a handful of fictional-but-Wikipedia-style articles, crafted so that a few of
the bundled test questions genuinely need facts from two of them.

You're free to use whichever free-tier provider you like. Set LLM_PROVIDER in
a .env file (copy .env.example) or a real environment variable to pick one;
defaults to "github" (GitHub Models). Never hardcode a real API key here or
commit one to the repo.

Usage:
    uv run python main.py                         # run the bundled test questions
    uv run python main.py --question "..."        # answer one question
    uv run python main.py --query                 # interactive mode
    uv run python main.py --rebuild               # force-rebuild the index
    uv run python main.py --provider groq "..."   # pick a provider for this run
"""

import argparse
import json
import os
import sys
import textwrap
from pathlib import Path

import numpy as np
from dotenv import load_dotenv
from openai import OpenAI
from sentence_transformers import SentenceTransformer

load_dotenv()  # reads a local .env file, if present; real env vars always win

BASE_DIR = Path(__file__).resolve().parent
ARTICLES_DIR = BASE_DIR / "data" / "articles"
INDEX_PATH = BASE_DIR / "data" / "index.npy"
CHUNKS_PATH = BASE_DIR / "data" / "chunks.json"
TEST_QUESTIONS_PATH = BASE_DIR / "data" / "test_questions.json"

MODEL_NAME = "all-MiniLM-L6-v2"
TARGET_CHUNK_SIZE = 600  # characters -- small enough to stay focused, large
                         # enough to hold a full thought (same reasoning as
                         # the RAG App project's prepare_notes.py)
TOP_K = 3

_model = None  # loaded lazily so importing this module doesn't load the model


# ---------------------------------------------------------------------------
# Corpus + chunking
# ---------------------------------------------------------------------------


def load_articles() -> list[dict]:
    """Returns a list of {"source": filename, "text": full text} per article."""
    articles = []
    for path in sorted(ARTICLES_DIR.glob("*.md")):
        articles.append({"source": path.name, "text": path.read_text(encoding="utf-8")})
    if not articles:
        raise FileNotFoundError(f"No articles found in {ARTICLES_DIR} -- add some .md files.")
    return articles


def split_into_paragraphs(text: str) -> list[str]:
    """Splits on blank lines, dropping empty paragraphs."""
    paragraphs = [p.strip() for p in text.split("\n\n")]
    return [p for p in paragraphs if p]


def merge_short_paragraphs(paragraphs: list[str], target_size: int) -> list[str]:
    """Greedily merges consecutive short paragraphs up to target_size characters,
    so a chunk isn't just one short line with barely any context in it."""
    chunks = []
    current = ""
    for paragraph in paragraphs:
        if current and len(current) + len(paragraph) > target_size:
            chunks.append(current)
            current = paragraph
        else:
            current = f"{current}\n\n{paragraph}" if current else paragraph
    if current:
        chunks.append(current)
    return chunks


def chunk_articles(articles: list[dict]) -> list[dict]:
    """Returns a list of {"text": ..., "source": ...} dicts, one per chunk,
    across every article. Deterministic: given the same files it always
    produces the same chunks in the same order, which is what lets a saved
    embedding index stay aligned with the articles on disk."""
    chunks = []
    for article in articles:
        paragraphs = split_into_paragraphs(article["text"])
        for chunk_text in merge_short_paragraphs(paragraphs, TARGET_CHUNK_SIZE):
            chunks.append({"text": chunk_text, "source": article["source"]})
    return chunks


# ---------------------------------------------------------------------------
# Embedding index
# ---------------------------------------------------------------------------


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def build_index(rebuild: bool = False) -> None:
    """Embeds every chunk and saves the vectors + text locally.

    The embedding model downloads on first run (~80MB, one time). Re-run this
    any time you add or edit articles -- the saved index doesn't update itself.
    """
    if INDEX_PATH.exists() and CHUNKS_PATH.exists() and not rebuild:
        print(f"Index found at {INDEX_PATH} -- pass --rebuild to rebuild it.")
        return

    articles = load_articles()
    chunks = chunk_articles(articles)
    if not chunks:
        raise RuntimeError("No chunks found -- are the articles empty?")

    print(f"Embedding {len(chunks)} chunks from {len(articles)} articles with {MODEL_NAME}...")
    model = get_model()
    texts = [chunk["text"] for chunk in chunks]
    embeddings = model.encode(texts, normalize_embeddings=True)

    np.save(INDEX_PATH, embeddings)
    with open(CHUNKS_PATH, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)

    print(f"Saved {embeddings.shape[0]} vectors ({embeddings.shape[1]}-dim) to {INDEX_PATH}")
    print(f"Saved chunk text/metadata to {CHUNKS_PATH}")


def load_index() -> tuple[np.ndarray, list[dict]]:
    """Loads the saved vectors and their chunk text."""
    if not INDEX_PATH.exists() or not CHUNKS_PATH.exists():
        raise FileNotFoundError(
            f"No index at {INDEX_PATH} -- run `uv run python main.py --rebuild` first."
        )
    embeddings = np.load(INDEX_PATH)
    with open(CHUNKS_PATH, encoding="utf-8") as f:
        chunks = json.load(f)
    return embeddings, chunks


def retrieve(question: str, embeddings: np.ndarray, chunks: list[dict], top_k: int = TOP_K) -> list[dict]:
    """Returns the top_k chunks most similar to `question`, each with its
    cosine-similarity score, ranked highest first."""
    question_vector = get_model().encode([question], normalize_embeddings=True)[0]
    # Every row of `embeddings` is unit-length and so is question_vector, so
    # this dot product *is* the cosine similarity.
    similarities = embeddings @ question_vector
    top_indices = np.argsort(similarities)[::-1][:top_k]
    return [
        {**chunks[i], "score": float(similarities[i])}
        for i in top_indices
    ]


# ---------------------------------------------------------------------------
# LLM plumbing (same free-tier providers as the Agentic Code Reviewer project)
# ---------------------------------------------------------------------------


def _build_github_client() -> OpenAI:
    return OpenAI(api_key=os.environ["GITHUB_TOKEN"], base_url="https://models.github.ai/inference")


def _build_gemini_client() -> OpenAI:
    return OpenAI(
        api_key=os.environ["GOOGLE_API_KEY"],
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    )


def _build_groq_client() -> OpenAI:
    return OpenAI(api_key=os.environ["GROQ_API_KEY"], base_url="https://api.groq.com/openai/v1")


def _build_mistral_client() -> OpenAI:
    return OpenAI(api_key=os.environ["MISTRAL_API_KEY"], base_url="https://api.mistral.ai/v1")


def _build_cerebras_client() -> OpenAI:
    return OpenAI(api_key=os.environ["CEREBRAS_API_KEY"], base_url="https://api.cerebras.ai/v1")


def _build_openrouter_client() -> OpenAI:
    return OpenAI(api_key=os.environ["OPENROUTER_API_KEY"], base_url="https://openrouter.ai/api/v1")


# Every provider here is free-tier at the time of writing, with no credit card
# required -- but check each provider's own pricing page before relying on that.
PROVIDERS = {
    "github": (_build_github_client, "gpt-4o-mini"),
    "gemini": (_build_gemini_client, "gemini-3.5-flash"),
    "groq": (_build_groq_client, "llama-3.3-70b-versatile"),
    "mistral": (_build_mistral_client, "mistral-small-latest"),
    "cerebras": (_build_cerebras_client, "llama-3.3-70b"),
    "openrouter": (_build_openrouter_client, "meta-llama/llama-3.3-70b-instruct:free"),
}


def chat(messages: list[dict], provider: str, temperature: float = 0.2) -> str:
    """Sends a chat completion to whichever provider is selected and returns the reply."""
    build_client, model = PROVIDERS[provider]
    client = build_client()
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
    )
    return response.choices[0].message.content


# ---------------------------------------------------------------------------
# The two pipelines
# ---------------------------------------------------------------------------

ANSWER_PROMPT = """Answer the question using ONLY the context below. If the
context doesn't contain the answer, say so plainly -- do not make something up.

Context:
{context}

Question: {question}

Answer:"""

SUFFICIENCY_PROMPT = """You get ONE retrieval pass of evidence, which may not
be enough to answer the question -- the answer might need facts that live in a
document this retrieval didn't return.

Context:
{context}

Question: {question}

Decide whether the Context above contains enough information to answer the
Question. Reply with exactly one of these two forms:

If YES -- SUFFICIENT, followed by your answer on the next line(s):
    SUFFICIENT
    <answer using only the context>

If NO -- do NOT try to answer. Reply:
    INSUFFICIENT
    <one follow-up search query, single line, that would find the missing
    information -- name the specific entity or fact you need>

Never output both forms."""


def format_context(chunks: list[dict]) -> str:
    return "\n\n".join(f"[{c['source']}] {c['text']}" for c in chunks)


def parse_sufficiency(text: str) -> tuple[str, str]:
    """Returns ("sufficient", answer) or ("insufficient", followup_query)."""
    lines = [line.strip() for line in text.strip().splitlines() if line.strip()]
    if lines and "INSUFFICIENT" in lines[0].upper():
        followup = lines[1] if len(lines) > 1 else ""
        return "insufficient", followup
    answer = "\n".join(lines[1:]) if lines and lines[0].upper().startswith("SUFFICIENT") else text
    return "sufficient", answer.strip()


def single_hop(question: str, embeddings: np.ndarray, chunks: list[dict], provider: str, top_k: int) -> dict:
    """Retrieve once, answer from that one retrieval pass. The baseline."""
    retrieved = retrieve(question, embeddings, chunks, top_k=top_k)
    prompt = ANSWER_PROMPT.format(context=format_context(retrieved), question=question)
    answer = chat(
        [{"role": "user", "content": prompt}],
        provider=provider,
    )
    return {"answer": answer, "evidence": retrieved}


def multi_hop(question: str, embeddings: np.ndarray, chunks: list[dict], provider: str, top_k: int) -> dict:
    """Two rounds: retrieve, ask the model whether the evidence is enough, and
    if not, retrieve a second round guided by the model's own follow-up query."""
    round1 = retrieve(question, embeddings, chunks, top_k=top_k)
    prompt = SUFFICIENCY_PROMPT.format(context=format_context(round1), question=question)
    verdict = chat(
        [{"role": "user", "content": prompt}],
        provider=provider,
    )

    status, followup = parse_sufficiency(verdict)
    if status == "sufficient":
        return {
            "answer": followup,
            "evidence": round1,
            "followup": None,
            "rounds": [round1],
        }

    round2 = retrieve(followup, embeddings, chunks, top_k=top_k)
    combined = merge_dedupe(round1, round2)
    final_prompt = ANSWER_PROMPT.format(context=format_context(combined), question=question)
    answer = chat(
        [{"role": "user", "content": final_prompt}],
        provider=provider,
    )
    return {
        "answer": answer,
        "evidence": combined,
        "followup": followup,
        "rounds": [round1, round2],
    }


def merge_dedupe(*chunk_lists: list[dict]) -> list[dict]:
    """Merges chunk lists, dropping chunks whose text was already seen."""
    seen: set[str] = set()
    merged: list[dict] = []
    for chunk_list in chunk_lists:
        for chunk in chunk_list:
            if chunk["text"] not in seen:
                seen.add(chunk["text"])
                merged.append(chunk)
    return merged


def answer_matches(answer: str, expected: str) -> bool:
    """Loose, case-insensitive check that `expected` appears in the answer."""
    return expected.lower() in (answer or "").lower()


# ---------------------------------------------------------------------------
# Printing
# ---------------------------------------------------------------------------


def wrap_lines(text: str, width: int) -> list[str]:
    lines = []
    for paragraph in text.split("\n"):
        lines.extend(textwrap.wrap(paragraph, width) or [""])
    return lines


def side_by_side(left: str, right: str, width: int = 118, left_label: str = "SINGLE-HOP", right_label: str = "MULTI-HOP") -> str:
    """Prints two blocks of text as aligned columns, like `diff -y`."""
    col = (width - 3) // 2
    left_lines = wrap_lines(left, col)
    right_lines = wrap_lines(right, col)
    rows = max(len(left_lines), len(right_lines))
    left_lines += [""] * (rows - len(left_lines))
    right_lines += [""] * (rows - len(right_lines))
    header = f" {left_label:<{col}} │ {right_label:<{col}} "
    sep = "─" * width
    body = "\n".join(f" {l:<{col}} │ {r:<{col}} " for l, r in zip(left_lines, right_lines))
    return f"{header}\n{sep}\n{body}\n{sep}"


def evidence_block(chunks: list[dict], max_chars: int = 180) -> str:
    """A chunk list rendered as audit-friendly bullet lines."""
    if not chunks:
        return "(no evidence retrieved)"
    lines = []
    for i, chunk in enumerate(chunks, 1):
        snippet = " ".join(chunk["text"].split())
        if len(snippet) > max_chars:
            snippet = snippet[:max_chars] + "..."
        lines.append(f"  {i}. [{chunk['source']}] score {chunk['score']:.3f}: {snippet}")
    return "\n".join(lines)


def build_column(label: str, answer: str, extra: str, evidence: list[dict]) -> str:
    parts = [f"{label}", ""]
    if extra:
        parts.append(extra)
        parts.append("")
    parts.append(f"Answer: {answer.strip()}")
    parts.append("")
    parts.append("Evidence used:")
    parts.append(evidence_block(evidence))
    return "\n".join(parts)


def run_comparison(question: str, embeddings: np.ndarray, chunks: list[dict], provider: str, top_k: int) -> dict:
    single = single_hop(question, embeddings, chunks, provider, top_k)
    multi = multi_hop(question, embeddings, chunks, provider, top_k)

    multi_extra = ""
    if multi["followup"]:
        n_round1 = len(multi["rounds"][0]) if multi["rounds"] else 0
        n_round2 = len(multi["rounds"][1]) if len(multi["rounds"]) > 1 else 0
        multi_extra = f"Round 2 (guided by follow-up query): {multi['followup'].strip()}\n"
        multi_extra += f"({n_round1} chunks round 1 + {n_round2} new chunks round 2, merged)"
    else:
        multi_extra = "Evidence was sufficient in round 1 -- no second retrieval needed."

    left = build_column("SINGLE-HOP", single["answer"], "", single["evidence"])
    right = build_column("MULTI-HOP", multi["answer"], multi_extra, multi["evidence"])

    print(f"\nQuestion: {question}")
    print(side_by_side(left, right))
    return single, multi


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def load_test_questions() -> list[dict]:
    with open(TEST_QUESTIONS_PATH, encoding="utf-8") as f:
        return json.load(f)["questions"]


def run_all_test_questions(embeddings: np.ndarray, chunks: list[dict], provider: str, top_k: int) -> None:
    questions = load_test_questions()
    print(f"\nRunning {len(questions)} bundled test questions "
          f"({sum(1 for q in questions if q['hops'] == 2)} of them multi-hop) "
          f"with provider '{provider}'...")

    single_correct = 0
    multi_correct = 0
    for q in questions:
        question = q["question"]
        single, multi = run_comparison(question, embeddings, chunks, provider, top_k)

        single_hit = answer_matches(single["answer"], q["expected"])
        multi_hit = answer_matches(multi["answer"], q["expected"])
        single_correct += int(single_hit)
        multi_correct += int(multi_hit)

        hop_badge = "multi-hop" if q["hops"] == 2 else "single-hop"
        print(f"Expected: {q['expected']}   ({hop_badge})")
        print(f"  single-hop: {'✓' if single_hit else '✗'}   multi-hop: {'✓' if multi_hit else '✗'}")

    print(f"\nScoreboard (expected answers from data/test_questions.json):")
    print(f"  single-hop: {single_correct}/{len(questions)} correct")
    print(f"  multi-hop:  {multi_correct}/{len(questions)} correct")


def interactive_mode(embeddings: np.ndarray, chunks: list[dict], provider: str, top_k: int) -> None:
    print("\nInteractive mode -- type a question, or 'quit' to exit.")
    while True:
        try:
            question = input("\n> ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break
        if not question or question.lower() in {"quit", "exit", "q"}:
            break
        run_comparison(question, embeddings, chunks, provider, top_k)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Two-round (multi-hop) question answering over a small Wikipedia-style sample.",
    )
    group = parser.add_mutually_exclusive_group()
    group.add_argument("question", nargs="?", help="Answer one question, e.g. 'Who founded Volta Dynamics?'")
    group.add_argument("--question", dest="question_flag", help="Same as the positional question argument.")
    group.add_argument("--query", action="store_true", help="Interactive mode: keep asking questions.")
    parser.add_argument("--rebuild", action="store_true", help="Force-rebuild the embedding index.")
    parser.add_argument("--provider", help="Override LLM_PROVIDER for this run, e.g. 'groq'.")
    parser.add_argument("--top-k", type=int, default=TOP_K, help=f"Chunks retrieved per round (default {TOP_K}).")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    provider = args.provider or os.environ.get("LLM_PROVIDER", "github")
    if provider not in PROVIDERS:
        raise ValueError(f"Unknown LLM_PROVIDER '{provider}'. Choose one of: {', '.join(PROVIDERS)}")

    build_index(rebuild=args.rebuild)
    embeddings, chunks = load_index()

    question = args.question or args.question_flag
    if args.query:
        interactive_mode(embeddings, chunks, provider, args.top_k)
    elif question:
        run_comparison(question, embeddings, chunks, provider, args.top_k)
    else:
        run_all_test_questions(embeddings, chunks, provider, args.top_k)


if __name__ == "__main__":
    main()
