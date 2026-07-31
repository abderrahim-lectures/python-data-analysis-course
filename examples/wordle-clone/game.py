"""Interactive terminal Wordle game loop.

Run with:

    uv run python game.py

Uses `rich` purely for colored terminal output (green/yellow/gray tiles) —
the game logic itself (wordle.py) and stats persistence (stats.py) have no
third-party dependencies at all.
"""

from __future__ import annotations

import random

from rich.console import Console

from stats import format_stats, load_stats, record_result, save_stats
from wordle import GREEN, WORD_LENGTH, YELLOW, is_win, load_words, score_guess

MAX_GUESSES = 6
MARK_STYLE = {GREEN: "bold white on green", YELLOW: "bold black on yellow", "X": "bold white on grey42"}

console = Console()


def render_marks(guess: str, marks: list[str]) -> None:
    for letter, mark in zip(guess.upper(), marks):
        console.print(f" {letter} ", style=MARK_STYLE[mark], end="")
    console.print()


def read_guess(words: set[str]) -> str:
    """Prompt until the player enters a 5-letter word that's actually in
    the word list — real Wordle rejects guesses that aren't real words."""
    while True:
        raw = input(f"Guess ({WORD_LENGTH} letters): ").strip().upper()
        if len(raw) != WORD_LENGTH or not raw.isalpha():
            print(f"  Please enter exactly {WORD_LENGTH} letters.")
            continue
        if raw not in words:
            print(f"  '{raw}' isn't in the word list — try a real word.")
            continue
        return raw


def play_round(words: list[str], word_set: set[str]) -> tuple[bool, int]:
    target = random.choice(words)
    console.print(f"\nGuess the {WORD_LENGTH}-letter word. You have {MAX_GUESSES} tries.\n")

    for attempt in range(1, MAX_GUESSES + 1):
        guess = read_guess(word_set)
        marks = score_guess(guess, target)
        render_marks(guess, marks)
        if is_win(marks):
            console.print(f"\n[bold green]You got it in {attempt}![/bold green]")
            return True, attempt

    console.print(f"\n[bold red]Out of guesses. The word was {target}.[/bold red]")
    return False, MAX_GUESSES


def main() -> None:
    words = load_words()
    word_set = set(words)
    stats = load_stats()

    while True:
        won, attempts = play_round(words, word_set)
        stats = record_result(stats, won, attempts)
        save_stats(stats)
        console.print("\n" + format_stats(stats) + "\n")

        again = input("Play again? [y/N] ").strip().lower()
        if again != "y":
            break

    console.print("Thanks for playing!")


if __name__ == "__main__":
    main()
