"""Retrieves relevant chunks for a question, then asks a free-tier LLM to
answer using only that context, citing the exact file and lines it used.

Run with: uv run python query.py "your question here"
"""

import os
import sys

from dotenv import load_dotenv
from openai import OpenAI

from retrieve import retrieve

load_dotenv()

PROMPT_TEMPLATE = """Answer the question using ONLY the context below. The
context is drawn from a real code repository; each block is tagged with the
file and line range it came from. Support every factual claim you make with a
citation in the form [path.py:start-end]. If the context doesn't contain the
answer, say so -- do not make something up, and do not cite anything not in
the context.

Context:
{context}

Question: {question}

Answer:"""


def build_prompt(question: str, chunks: list[dict]) -> str:
    context = "\n\n".join(
        f"[{c['source']}:{c['start']}-{c['end']}]\n{c['text']}" for c in chunks
    )
    return PROMPT_TEMPLATE.format(context=context, question=question)


def ask(question: str, top_k: int = 4) -> str:
    chunks = retrieve(question, top_k=top_k)
    prompt = build_prompt(question, chunks)

    client = OpenAI(
        api_key=os.environ["GITHUB_TOKEN"],
        base_url="https://models.github.ai/inference",
    )
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # confirm this still has a free tier before running
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content


if __name__ == "__main__":
    question = " ".join(sys.argv[1:]) or "How does the course build this website?"
    print(ask(question))
