"""A small fixed bank of trivia questions -- the question source before
Step 3 adds LLM-generated questions on top of it.

Every question, whether it comes from this bank or is generated later by
generate.py, is a plain dict of the same shape:

    {"question": str, "options": list[str], "answer_index": int}

`answer_index` is which entry in `options` is correct. Keeping both sources
returning this exact shape is what lets round.py and bot.py stay completely
unaware of where a question actually came from.
"""

import random

QUESTION_BANK = [
    {
        "question": "What year was Python first released?",
        "options": ["1989", "1991", "1995", "2000"],
        "answer_index": 1,
    },
    {
        "question": "Which planet is known as the Red Planet?",
        "options": ["Venus", "Jupiter", "Mars", "Saturn"],
        "answer_index": 2,
    },
    {
        "question": "What does 'HTTP' stand for?",
        "options": [
            "HyperText Transfer Protocol",
            "High Transfer Text Process",
            "HyperText Transmission Program",
            "Host Transfer Text Protocol",
        ],
        "answer_index": 0,
    },
    {
        "question": "Who wrote 'Romeo and Juliet'?",
        "options": ["Charles Dickens", "William Shakespeare", "Mark Twain", "Jane Austen"],
        "answer_index": 1,
    },
    {
        "question": "What is the largest ocean on Earth?",
        "options": ["Atlantic", "Indian", "Arctic", "Pacific"],
        "answer_index": 3,
    },
    {
        "question": "In programming, what does 'CLI' stand for?",
        "options": [
            "Command Line Interface",
            "Computer Language Index",
            "Code Line Iterator",
            "Central Logic Input",
        ],
        "answer_index": 0,
    },
    {
        "question": "Which gas do plants primarily absorb for photosynthesis?",
        "options": ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
        "answer_index": 2,
    },
    {
        "question": "What is the smallest prime number?",
        "options": ["0", "1", "2", "3"],
        "answer_index": 2,
    },
]


def random_question() -> dict:
    """Picks a uniformly random question from the fixed bank above."""
    return random.choice(QUESTION_BANK)


if __name__ == "__main__":
    print(random_question())
