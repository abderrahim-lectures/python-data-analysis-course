"""Answers "where is X?" (exact symbol lookup) and "how does X work?"
(semantic search) over a repo, then grounds a free-tier LLM answer in the
retrieved file:line context.

Run with: uv run python query.py "where is train_test_split defined?"
Run with: uv run python query.py "how does the training loop work?"
"""

import json
import os
import re
import sys

from dotenv import load_dotenv
from openai import OpenAI

from retrieve import retrieve

load_dotenv()

SYMBOLS_PATH = "symbols.json"

_WHERE_RE = re.compile(r"where (?:is|are|does)\s+(.+?)(?:\?|$)", re.IGNORECASE)


def looks_like_where_question(question: str) -> bool:
    """Heuristic: questions asking where something *is* usually want the
    exact symbol index; everything else gets semantic search."""
    return bool(_WHERE_RE.search(question))


def _extract_symbol_query(question: str) -> str:
    """Pulls the symbol name out of a 'where is X defined?' question,
    stripping trailing verbs like 'defined'/'located'/'declared'."""
    match = _WHERE_RE.search(question)
    if not match:
        return ""
    name = match.group(1).strip().strip("?")
    for trailing in (" defined", " located", " declared", " implemented"):
        if name.endswith(trailing):
            name = name[: -len(trailing)].strip()
            break
    return name


def find_symbol(name: str) -> list[dict]:
    """Exact lookup: every symbol whose name matches, with file + line."""
    with open(SYMBOLS_PATH, encoding="utf-8") as f:
        symbols = json.load(f)
    query_name = name.strip().strip("?")
    return [s for s in symbols if s["name"] == query_name or query_name in s["name"]]


def ask_llm(question: str, context_blocks: list[str]) -> str:
    client = OpenAI(
        api_key=os.environ["GITHUB_TOKEN"],
        base_url="https://models.github.ai/inference",
    )
    prompt = f"""Answer the question using ONLY the context below. Each block
is tagged with the file and line range it came from. Support every factual
claim with a citation in the form [path.py:start-end]. If the context doesn't
contain the answer, say so -- do not make something up.

Context:
{chr(10).join(context_blocks)}

Question: {question}

Answer:"""
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # confirm this still has a free tier before running
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content


def answer(question: str, top_k: int = 4) -> str:
    if looks_like_where_question(question):
        name = _extract_symbol_query(question)
        hits = find_symbol(name) if name else []
        if hits:
            lines = "\n".join(
                f"  [{s['kind']}] {s['name']} @ {s['file']}:{s['line']}" for s in hits[:10]
            )
            return f"Exact symbol lookup for {name!r}:\n{lines}"
        # No symbol matched -- fall through to semantic rather than guessing.
        print("(no exact symbol match; trying semantic search)")

    chunks = retrieve(question, top_k=top_k)
    context_blocks = [
        f"[{c['source']}:{c['start']}-{c['end']}]\n{c['text']}" for c in chunks
    ]
    return ask_llm(question, context_blocks)


if __name__ == "__main__":
    question = " ".join(sys.argv[1:]) or "how does the course build this website?"
    print(answer(question))
