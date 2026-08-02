"""Journal Search-and-Summarize -- index and search a folder of dated markdown
journal entries, and summarize a date range with a free-tier LLM.

See docs/projects/journal-search-summarize/index.md for the walkthrough this
file accompanies.

Your journal lives in data/journal/ as one Markdown file per day, with the date
in the filename (YYYY-MM-DD.md). Two of the three commands need no API key at
all: `index` embeds every entry locally with sentence-transformers, and
`search` finds the entries most relevant to a question using plain NumPy.
Only `summarize` calls out to an LLM -- and that one's free-tier, picked from
the same 6-provider table as the rest of this course. Set LLM_PROVIDER in a
.env file (copy .env.example) or a real environment variable to choose one;
defaults to "github" (GitHub Models).

Never hardcode a real API key here or commit one to the repo.

Usage:
    uv run python main.py index
    uv run python main.py search "when did I last mention planning a trip?"
    uv run python main.py search "running" --top-k 3
    uv run python main.py summarize 2026-07-06 2026-07-12
    uv run python main.py summarize 2026-07-06 2026-07-12 --provider groq
    uv run python main.py --interactive     # loop: type queries until 'quit'
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path

import numpy as np
from dotenv import load_dotenv
from openai import OpenAI
from sentence_transformers import SentenceTransformer

load_dotenv()  # reads a local .env file, if present; real env vars always win

JOURNAL_DIR = Path("data/journal")
INDEX_PATH = Path("data/index.npy")
CHUNKS_PATH = Path("data/chunks.json")
MODEL_NAME = "all-MiniLM-L6-v2"

DATE_RE = re.compile(r"(\d{4}-\d{2}-\d{2})")
CITED_DATE_RE = re.compile(r"\[(\d{4}-\d{2}-\d{2})\]")

_model = None  # loaded lazily so importing this module doesn't load the model


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def load_entries() -> list[dict]:
    """Returns [{"date", "source", "text"}] for every data/journal/*.md file,
    sorted by date. The date comes from the YYYY-MM-DD filename -- files
    without one are skipped with a warning instead of crashing the run."""
    entries = []
    for path in sorted(JOURNAL_DIR.glob("*.md")):
        match = DATE_RE.search(path.name)
        if match is None:
            print(f"Skipping {path.name}: no YYYY-MM-DD date in the filename.")
            continue
        text = path.read_text(encoding="utf-8").strip()
        entries.append({"date": match.group(1), "source": path.name, "text": text})
    return entries


def build_index() -> None:
    """Embeds every journal entry locally and saves the vectors + text, so
    `search` doesn't need to re-embed anything at query time. Re-run this any
    time you add or edit entries -- the saved index doesn't update itself."""
    entries = load_entries()
    if not entries:
        print("No journal entries found -- add some YYYY-MM-DD.md files to data/journal/ first.")
        return

    print(f"Embedding {len(entries)} entries with {MODEL_NAME}...")
    texts = [f"[{e['date']}] {e['text']}" for e in entries]
    embeddings = get_model().encode(texts, normalize_embeddings=True)

    INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)
    np.save(INDEX_PATH, embeddings)
    CHUNKS_PATH.write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Saved {embeddings.shape[0]} vectors ({embeddings.shape[1]}-dim) to {INDEX_PATH}")
    print(f"Saved entry text/metadata to {CHUNKS_PATH}")


def search(query: str, top_k: int = 5) -> list[dict]:
    """Returns the top_k journal entries most similar to `query`, each with its
    similarity score, ranked highest first. The index must already exist."""
    if not INDEX_PATH.exists() or not CHUNKS_PATH.exists():
        print("No index found -- run 'uv run python main.py index' first.")
        return []

    embeddings = np.load(INDEX_PATH)
    entries = json.loads(CHUNKS_PATH.read_text(encoding="utf-8"))

    # Every row of `embeddings` is already unit-length (see build_index), and
    # so is the query vector, so this dot product IS the cosine similarity.
    query_vector = get_model().encode([query], normalize_embeddings=True)[0]
    similarities = embeddings @ query_vector

    top_indices = np.argsort(similarities)[::-1][:top_k]
    return [{**entries[i], "score": float(similarities[i])} for i in top_indices]


def _build_github_client() -> OpenAI:
    return OpenAI(api_key=os.environ["GITHUB_TOKEN"], base_url="https://models.github.ai/inference")


def _build_gemini_client() -> OpenAI:
    # Gemini exposes an OpenAI-compatible endpoint, so the same openai client
    # works here too, just with a different base_url and key.
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


# Every provider here is free-tier at the time of writing, with no credit
# card required -- but check the provider's own pricing page before relying
# on that, since free tiers change. Each tuple is (client builder, model ID).
PROVIDERS = {
    "github": (_build_github_client, "gpt-4o-mini"),
    "gemini": (_build_gemini_client, "gemini-3.5-flash"),
    "groq": (_build_groq_client, "llama-3.3-70b-versatile"),
    "mistral": (_build_mistral_client, "mistral-small-latest"),
    "cerebras": (_build_cerebras_client, "llama-3.3-70b"),
    "openrouter": (_build_openrouter_client, "meta-llama/llama-3.3-70b-instruct:free"),
}

SUMMARIZE_PROMPT = """Summarize this personal journal from {start} to {end}.

Below is the journal text for each day in that range, each tagged with its date
in brackets. Write a short summary of what happened during this period, one
bullet per distinct event or theme. Begin every bullet with the date it comes
from, in the same [YYYY-MM-DD] form. For example:

[2026-07-18] Dinner with the whole family for mom's birthday.

Use ONLY facts that appear in the journal text below. Do not invent events,
dates, or details, and do not add opinions. If the range contains no entries,
say so in one sentence.

Journal:
{context}

Summary:"""


def entries_in_range(start: str, end: str) -> list[dict]:
    """Every journal entry whose date falls within [start, end], inclusive.
    Lexicographic comparison is correct here because dates are YYYY-MM-DD."""
    return [e for e in load_entries() if start <= e["date"] <= end]


def call_llm(prompt: str, provider: str | None = None) -> str:
    """Sends `prompt` to the chosen free-tier LLM and returns its response."""
    provider = provider or os.environ.get("LLM_PROVIDER", "github")
    if provider not in PROVIDERS:
        raise ValueError(f"Unknown LLM_PROVIDER '{provider}'. Choose one of: {', '.join(PROVIDERS)}")
    build_client, model = PROVIDERS[provider]

    try:
        client = build_client()
    except KeyError:
        raise RuntimeError(
            f"No API key found for provider '{provider}' -- copy .env.example to .env "
            f"and fill in the {provider} key (see the lesson's Setup section)."
        ) from None

    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content


def summarize(start: str, end: str, provider: str | None = None) -> tuple[str, list[str]]:
    """Summarizes the entries between `start` and `end` with a free-tier LLM.

    Returns (summary_text, cited_dates): cited_dates is the sorted, deduplicated
    list of YYYY-MM-DD dates the model actually cited in its summary -- that's
    the audit trail that lets you check each sentence against its source entry.
    """
    entries = entries_in_range(start, end)
    if not entries:
        return f"No journal entries found between {start} and {end}.", []

    context = "\n\n".join(f"[{e['date']}]\n{e['text']}" for e in entries)
    prompt = SUMMARIZE_PROMPT.format(start=start, end=end, context=context)

    text = call_llm(prompt, provider=provider)
    cited_dates = sorted({d for d in CITED_DATE_RE.findall(text) if start <= d <= end})
    return text, cited_dates


def print_search_results(results: list[dict]) -> None:
    if not results:
        return
    for r in results:
        snippet = r["text"].replace("\n", " ")[:100]
        print(f"{r['score']:.3f}  [{r['date']}]  {snippet}...")


def print_summary(summary_text: str, cited_dates: list[str]) -> None:
    print(summary_text)
    print()
    if not cited_dates:
        print("Sources cited: none detected -- check the summary by hand.")
        return
    print("Sources cited (audit trail -- each bullet's date, mapped back to its file):")
    for date in cited_dates:
        print(f"  {date}  data/journal/{date}.md")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="journal-search-summarize",
        description="Search your own dated markdown journal semantically, and summarize a date range with a free-tier LLM.",
    )
    subparsers = parser.add_subparsers(dest="command")

    subparsers.add_parser("index", help="Embed every entry in data/journal/ and save the index.")

    search_parser = subparsers.add_parser("search", help="Find the entries most relevant to a query.")
    search_parser.add_argument("query", help="The question or phrase to search for.")
    search_parser.add_argument("--top-k", type=int, default=5, help="How many entries to return (default: 5).")

    summarize_parser = subparsers.add_parser("summarize", help="Summarize the journal between two dates with a free-tier LLM.")
    summarize_parser.add_argument("start", metavar="START", help="Start date, YYYY-MM-DD, inclusive.")
    summarize_parser.add_argument("end", metavar="END", help="End date, YYYY-MM-DD, inclusive.")
    summarize_parser.add_argument("--provider", help="Override LLM_PROVIDER for this run, e.g. 'groq'.")

    parser.add_argument("--interactive", action="store_true", help="Loop: type search queries until you enter 'quit'.")
    return parser.parse_args()


def interactive_loop() -> None:
    print("Interactive search. Type a query and press Enter ('quit' to exit).")
    while True:
        try:
            query = input("> ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break
        if not query:
            continue
        if query.lower() in {"quit", "exit", "q"}:
            break
        print_search_results(search(query))


def main() -> None:
    args = parse_args()

    if args.interactive:
        interactive_loop()
        return
    if args.command is None:
        print("Pick a command: index, search '<query>', or summarize START END (or run with --interactive).")
        sys.exit(1)

    if args.command == "index":
        build_index()
    elif args.command == "search":
        print_search_results(search(args.query, top_k=args.top_k))
    elif args.command == "summarize":
        if not (re.fullmatch(r"\d{4}-\d{2}-\d{2}", args.start) and re.fullmatch(r"\d{4}-\d{2}-\d{2}", args.end)):
            print("Dates must look like YYYY-MM-DD.")
            sys.exit(1)
        if args.start > args.end:
            print(f"Start date {args.start} is after end date {args.end}.")
            sys.exit(1)
        print(f"Summarizing journal from {args.start} to {args.end}...\n")
        summary_text, cited_dates = summarize(args.start, args.end, provider=args.provider)
        print_summary(summary_text, cited_dates)


if __name__ == "__main__":
    main()
