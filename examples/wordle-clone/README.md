# Wordle Clone Example

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)
[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/add-wordle-clone-project/examples/wordle-clone/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/add-wordle-clone-project/examples/wordle-clone/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/add-wordle-clone-project?filepath=examples%2Fwordle-clone%2Fnotebook.ipynb)

<!-- Badges above point at this PR's branch; will point at `main` once merged. -->

The local companion to the course's [Build a Wordle Clone](../../docs/projects/wordle-clone/index.md) Real-World Project — a real, runnable terminal Wordle game with a bundled word list and persistent stats saved across runs.

## What's here

- `wordle.py` — the core, dependency-free game logic: loading the bundled word list and scoring a guess against a target word (green/yellow/gray), including the correct two-pass handling of repeated letters.
- `stats.py` — persistent stats tracking (games played, win rate, current/max streak, guess-count distribution), saved to and loaded from `stats.json` in this folder.
- `game.py` — the interactive terminal game loop, using [`rich`](https://github.com/Textualize/rich) for colored tiles.
- `words.txt` — a bundled list of ~540 common 5-letter English words, used both as the pool of possible target words and as the dictionary of accepted guesses.
- `notebook.ipynb` — a Colab/Kaggle/Binder-friendly version of this same game (see the badges above).

Nothing here needs an API key, a GPU, or an internet connection — everything runs locally, for free, entirely offline after `uv` installs `rich`.

## Running it

```bash
uv run python game.py
```

`uv` reads `pyproject.toml` and creates an isolated environment for this project automatically on first run. Type a 5-letter word and press Enter to guess; the game rejects guesses that aren't 5 letters or aren't in `words.txt`. After each round it prints your updated stats and asks if you want to play again — your streak and guess distribution persist in `stats.json` even if you quit and come back later.

## Expected output

Something like:

```
Guess the 5-letter word. You have 6 tries.

Guess (5 letters): crane
 C  R  A  N  E
Guess (5 letters): could
 C  O  U  L  D

You got it in 2!

Stats
  Played: 1
  Win rate: 100%
  Current streak: 1
  Max streak: 1
  Guess distribution:
    1: 0
    2: ██████████ 1
    3: 0
    4: 0
    5: 0
    6: 0

Play again? [y/N]
```

(Colored tiles won't show in plain text here — run it in a real terminal to see the green/yellow/gray highlighting.)

## Resetting your stats

Delete `stats.json` in this folder — a fresh one with all-zero stats will be created the next time you play.

See the full [lesson](../../docs/projects/wordle-clone/index.md) for the step-by-step walkthrough, including why the repeated-letter feedback logic is trickier than it looks, and how the stats persistence works.
