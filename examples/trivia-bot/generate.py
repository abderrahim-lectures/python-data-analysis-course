"""Generates a fresh trivia question on a topic using a free-tier LLM,
instead of drawing from the fixed QUESTION_BANK in questions.py.

Returns the exact same shape as questions.py's bank entries --
{"question": str, "options": list[str], "answer_index": int} -- so round.py
and bot.py don't need to know or care whether a question came from the
fixed bank or was freshly generated for a topic.

Uses GitHub Models by default (see .env.example) -- swap the OpenAI(...)
client below for your own provider's client if you picked a different one
from the table in the lesson.
"""

import json
import os

from openai import OpenAI

llm_client = OpenAI(
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)

PROMPT_TEMPLATE = """Write one multiple-choice trivia question about: {topic}

Respond with ONLY a JSON object, no other text, in exactly this shape:
{{"question": "...", "options": ["...", "...", "...", "..."], "answer_index": 0}}

Requirements:
- Exactly 4 options.
- Exactly one is correct; put its index (0-3) in answer_index.
- The wrong options must be plausible, not obviously silly.
- Keep the question and every option short enough to fit in a Discord message."""


def generate_question(topic: str) -> dict:
    """Asks the LLM for one question about `topic` and validates the shape
    of what comes back before handing it to the rest of the bot -- an LLM
    asked for JSON can still return something malformed, and a trivia round
    that crashes on a bad question is worse than one that never starts."""
    response = llm_client.chat.completions.create(
        model="gpt-4o-mini",  # confirm this still has a free tier before running
        messages=[{"role": "user", "content": PROMPT_TEMPLATE.format(topic=topic)}],
        response_format={"type": "json_object"},
    )
    question = json.loads(response.choices[0].message.content)

    options = question.get("options")
    answer_index = question.get("answer_index")
    if not question.get("question") or not isinstance(options, list) or len(options) != 4:
        raise ValueError(f"LLM returned a malformed question: {question!r}")
    if not isinstance(answer_index, int) or not (0 <= answer_index < 4):
        raise ValueError(f"LLM returned an invalid answer_index: {question!r}")

    return question


if __name__ == "__main__":
    print(generate_question("classic video games"))
