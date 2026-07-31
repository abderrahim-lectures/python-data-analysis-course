"""Core Wordle game logic: word list loading and guess-feedback scoring.

This module has no I/O beyond reading the bundled word list — it's kept
separate from game.py (the interactive loop) and stats.py (persistence) so
each piece can be tested and reasoned about on its own.
"""

from __future__ import annotations

from collections import Counter
from pathlib import Path

WORD_LENGTH = 5
WORDS_FILE = Path(__file__).parent / "words.txt"

# Feedback marks, matching real Wordle's colors.
GREEN = "G"   # right letter, right position
YELLOW = "Y"  # right letter, wrong position
GRAY = "X"    # letter not in the word (or no more copies of it left to flag)


def load_words(path: Path = WORDS_FILE) -> list[str]:
    """Load the bundled word list as uppercase words."""
    words = [w.strip().upper() for w in path.read_text().splitlines() if w.strip()]
    for w in words:
        if len(w) != WORD_LENGTH:
            raise ValueError(f"word list contains a non-{WORD_LENGTH}-letter entry: {w!r}")
    return words


def score_guess(guess: str, target: str) -> list[str]:
    """Score a guess against the target word, returning one mark per letter.

    This is the classic Wordle logic bug spot: repeated letters. The real
    rules are a *two-pass* algorithm, not "is this letter anywhere in the
    word":

    Pass 1 (greens): mark every letter that's in the exact right position.
    Those letters are "used up" — they can't also justify a yellow mark
    somewhere else.

    Pass 2 (yellows/grays): for every letter *not* already green, check
    whether the target still has an unused copy of it. If yes, mark yellow
    and consume that copy. If no more unused copies remain, mark gray.

    Example: target "LLAMA", guess "ALLOY". The target has two Ls and two
    As. Naively marking every guess-letter that "appears in the target"
    would over-count — this two-pass, copy-consuming approach is what makes
    the letter counts come out right, matching real Wordle.
    """
    guess = guess.upper()
    target = target.upper()
    if len(guess) != WORD_LENGTH or len(target) != WORD_LENGTH:
        raise ValueError("guess and target must both be 5 letters")

    marks = [GRAY] * WORD_LENGTH

    # Pass 1: greens, and tally the target letters that are still "available"
    # (i.e. not already matched by a green) for the yellow pass.
    remaining = Counter()
    for i, (g, t) in enumerate(zip(guess, target)):
        if g == t:
            marks[i] = GREEN
        else:
            remaining[t] += 1

    # Pass 2: yellows, consuming from the same `remaining` pool so a letter
    # can never be flagged more times than it actually occurs in the target.
    for i, g in enumerate(guess):
        if marks[i] == GREEN:
            continue
        if remaining[g] > 0:
            marks[i] = YELLOW
            remaining[g] -= 1
        # else stays GRAY

    return marks


def is_win(marks: list[str]) -> bool:
    return all(m == GREEN for m in marks)
