"""Non-Discord trivia round logic: picking a question (bank or LLM-generated),
formatting it as text, and checking a submitted answer letter.

Kept separate from bot.py's Discord-specific timing and message-sending
code on purpose, so this half can be tested (and demoed in the notebook)
with plain function calls and fake "players" answering, no live Discord
connection required at all -- the same split docs-qa-bot uses between
retrieve.py (testable alone) and bot.py (the Discord wiring around it).
"""

from generate import generate_question
from questions import random_question

OPTION_LETTERS = "ABCD"


def pick_question(topic: str | None = None) -> dict:
    """The fixed bank if no topic is given, otherwise a freshly
    LLM-generated question about that topic."""
    if topic:
        return generate_question(topic)
    return random_question()


def format_question(question: dict) -> str:
    """Renders a question dict as the text a Discord message (or a notebook
    print()) would show a player."""
    lines = [f"**{question['question']}**"]
    for letter, option in zip(OPTION_LETTERS, question["options"]):
        lines.append(f"{letter}) {option}")
    return "\n".join(lines)


def check_answer(question: dict, letter: str) -> bool:
    """True if `letter` (e.g. "b", " B", "B") is the correct option for
    `question`. Case- and whitespace-insensitive, since that's exactly the
    kind of thing a real player typing into Discord will vary."""
    letter = letter.strip().upper()
    valid_letters = OPTION_LETTERS[: len(question["options"])]
    if letter not in valid_letters:
        return False
    return valid_letters.index(letter) == question["answer_index"]


if __name__ == "__main__":
    q = random_question()
    print(format_question(q))
    correct_letter = OPTION_LETTERS[q["answer_index"]]
    print("Correct guess?", check_answer(q, correct_letter))
    print("Wrong guess?", check_answer(q, OPTION_LETTERS[(q["answer_index"] + 1) % 4]))
