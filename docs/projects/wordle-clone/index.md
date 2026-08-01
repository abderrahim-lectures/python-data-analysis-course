---
id: wordle-clone
title: "Build a Wordle Clone"
sidebar_label: "Build a Wordle Clone"
slug: /projects/wordle-clone
description: "Build a real terminal Wordle game from scratch: correct green/yellow/gray guess feedback (including the classic repeated-letter bug), a custom word list, and persistent stats tracking across sessions."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Build a Wordle Clone

<ProjectPublishedDate projectId="2027-wordle-clone" />

<ProjectGreeting />

This project only assumes Python 101-level basics — functions, lists, dictionaries, loops, reading and writing a file. No pandas, no API key, no GPU, no external service of any kind — just a terminal, a word list, and some logic that's trickier to get right than it looks. That makes this a great *earlier* Real-World Project to try, even before some of the pandas- or AI-flavored ones: everything you need is stuff Python 101 already gave you, applied to something genuinely fun to play afterward.

This is optional and ungraded. See [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Implement the core guess-feedback logic — comparing a guess to a target word and producing green/yellow/gray marks per letter, correctly handling repeated letters (the classic Wordle logic bug).
2. Build an interactive game loop backed by a real word list, giving the player 6 guesses.
3. Validate guesses against the word list and give clear feedback when a guess is rejected.
4. Add persistent stats tracking — win rate, current streak, and a guess-count distribution — saved to a local JSON file so it survives across runs.

## Where to run this

- **Locally with `uv` (recommended).** This project needs nothing beyond the standard library plus one small terminal-color library — a good candidate for actually installing Python for real on your own machine. The Setup section below walks through it, and Steps 1–4 follow this path.
- **GitHub Codespaces.** Open [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) for a cloud dev environment with Node, Python, and `uv` already installed (see [`.devcontainer/devcontainer.json`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/.devcontainer/devcontainer.json)) — the same commands below work from a browser tab, no local install at all.
- **Google Colab, Kaggle Notebooks, or Binder.** This project needs zero external dependencies, which makes it an excellent notebook fit in one sense — but a notebook's `input()` prompt is a bit different from a real interactive terminal: no in-place colored tiles redrawn on one line, and (on Colab/Kaggle) a session's local files don't reliably survive between separate visits, which cuts against the "stats persist across sessions" part of this project. [`notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/wordle-clone/notebook.ipynb) is still a real, playable version — worth trying — just know the full experience (colored terminal tiles, stats that persist between separate days of play) is really a "run it locally" thing.

  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/wordle-clone/notebook.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/wordle-clone/notebook.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fwordle-clone%2Fnotebook.ipynb)

## Setup

`uv` is a single tool that replaces the usual "install Python, then install pip, then install a virtual environment tool, then install packages" chain — it can install and manage Python versions itself, alongside your project's dependencies.

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Close and reopen your terminal, then confirm it installed:

```bash
uv --version
```

Then set up the project:

```bash
uv init wordle-clone
cd wordle-clone
uv add rich
```

`rich` is the only third-party dependency this whole project needs, and it's used purely for colored terminal output (green/yellow/gray tiles) — every bit of actual game logic below is plain standard-library Python. No API key, no signup, nothing to configure before you can run a single line of code.

## Step 1: Score a guess against the target word

Start with the piece that's easy to get *almost* right and satisfying to get *actually* right: given a 5-letter guess and a 5-letter target word, produce one mark per letter — green if that letter is in the right position, yellow if it's in the word but the wrong position, gray otherwise.

A first attempt tends to look like this, checking each guessed letter independently:

```python
# A tempting first version — has a bug, keep reading
def score_guess_naive(guess: str, target: str) -> list[str]:
    marks = []
    for i, letter in enumerate(guess):
        if letter == target[i]:
            marks.append("G")
        elif letter in target:
            marks.append("Y")
        else:
            marks.append("X")
    return marks
```

Try it on `guess = "SPEED"`, `target = "ERASE"`. The target has exactly **one** `E`. The naive version checks each guessed letter against the whole target string independently — so *both* `E`s in `SPEED` get checked against `"E" in target`, which is `True` both times, and both get marked yellow. That's wrong: real Wordle would never award two yellow `E`s in a guess when the target only contains one `E` — one guessed `E` deserves a mark, the other doesn't have a matching letter left to justify one.

The fix is a two-pass algorithm:

```python
from collections import Counter

WORD_LENGTH = 5

def score_guess(guess: str, target: str) -> list[str]:
    guess, target = guess.upper(), target.upper()
    marks = ["X"] * WORD_LENGTH

    # Pass 1: greens, and tally which target letters are still "available"
    # (i.e. not already accounted for by a green) for the yellow pass.
    remaining = Counter()
    for i, (g, t) in enumerate(zip(guess, target)):
        if g == t:
            marks[i] = "G"
        else:
            remaining[t] += 1

    # Pass 2: yellows, consuming from that same pool of remaining letters
    # so a letter can never be flagged more times than it truly occurs.
    for i, g in enumerate(guess):
        if marks[i] == "G":
            continue
        if remaining[g] > 0:
            marks[i] = "Y"
            remaining[g] -= 1
        # else stays "X"

    return marks
```

Pass 1 marks every exact-position match green, and separately tallies (in `remaining`) how many copies of each *non-green* target letter are still "up for grabs." Pass 2 then walks the guess again: any letter not already green only gets a yellow mark if `remaining` still has an unclaimed copy of it — and claiming one decrements the count, so a second guessed copy of the same letter won't also get a yellow unless the target genuinely has a second copy too.

Run it on the tricky case:

```python
print(score_guess("SPEED", "ERASE"))  # ['Y', 'X', 'Y', 'Y', 'X']
```

One `E` (position 0) is yellow, the other (position 3) is also yellow because `ERASE` really does have two `E`s — but a guess like `"ELITE"` against a target with only one `E` would correctly give the *second* `E` a gray, not a yellow.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`score_guess("CRANE", "CRANE")` returns all greens.</StepChecklistItem>
<StepChecklistItem>`score_guess("SPEED", "ERASE")` returns exactly two yellow `E`s, not more.</StepChecklistItem>
<StepChecklistItem>A guess and target that share zero letters returns all grays.</StepChecklistItem>
<StepChecklistItem>You've tried a case where the *guess* repeats a letter but the target only has one copy, and confirmed only one mark comes back non-gray.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

Try target `"LLAMA"` and guess `"ALLOY"` by hand before running the code: `LLAMA` has two `L`s and two `A`s. Walk through both passes yourself — which letters end up green, which end up yellow, and which end up gray? Then check your answer against `score_guess`. If you got it wrong on paper, where exactly did your mental model diverge from the two-pass algorithm?

## Step 2: Build the game loop

With scoring solid, wrap it in an actual game: pick a random target from a word list, give the player 6 guesses, and stop as soon as they get all five greens.

```python
import random

MAX_GUESSES = 6

def load_words(path="words.txt") -> list[str]:
    with open(path) as f:
        return [w.strip().upper() for w in f if w.strip()]

def play_round(words: list[str]) -> tuple[bool, int]:
    target = random.choice(words)
    for attempt in range(1, MAX_GUESSES + 1):
        guess = input(f"Guess {attempt}/{MAX_GUESSES}: ").strip().upper()
        marks = score_guess(guess, target)
        print(" ".join(f"{l}:{m}" for l, m in zip(guess, marks)))
        if all(m == "G" for m in marks):
            print(f"You got it in {attempt}!")
            return True, attempt
    print(f"Out of guesses. The word was {target}.")
    return False, MAX_GUESSES
```

`words.txt` is a plain text file, one word per line — the real example bundles a list of about 540 common English 5-letter words for exactly this purpose. A word *list* like this (just facts about which strings are English words, no creative expression) is fine to use and redistribute freely, unlike copying, say, a dictionary's actual definitions.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>Each round picks a genuinely random target from the word list (print it temporarily to confirm, then remove the print — no spoilers once you trust it).</StepChecklistItem>
<StepChecklistItem>The loop stops immediately once all five marks are green, even before 6 guesses are used.</StepChecklistItem>
<StepChecklistItem>After exactly 6 wrong guesses, the loop ends and reveals the target.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

If `random.choice(words)` is called once per round from inside `play_round`, and you call `play_round` in a loop to let someone play again, will the target actually change between rounds? What would happen if you accidentally computed `target` once *outside* the loop instead?

## Step 3: Validate guesses against the word list

Real Wordle doesn't let you guess `"ZZZZZ"` — every guess has to be a real word from its dictionary. Add that check before scoring:

```python
def read_guess(word_set: set[str]) -> str:
    while True:
        raw = input(f"Guess ({WORD_LENGTH} letters): ").strip().upper()
        if len(raw) != WORD_LENGTH or not raw.isalpha():
            print(f"  Please enter exactly {WORD_LENGTH} letters.")
            continue
        if raw not in word_set:
            print(f"  '{raw}' isn't in the word list — try a real word.")
            continue
        return raw
```

Using a `set` here instead of checking `raw in words` against the list directly matters more than it might look: list membership checks scan every entry one by one, while a set check is near-instant regardless of how many words are in it — a small but genuinely good habit for any "is this value in a big collection" check.

:::tip[Reject bad input early, not mid-game]
Validating the guess's *shape* (5 letters, alphabetic) before checking the word list catches the most common typos with the cheapest check first — no point searching a 540-word set for `"crane5"` when a `len()` and `.isalpha()` check already tells you it's malformed.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>Guessing a non-word (e.g. `"ZZZZZ"`) prints a clear rejection message and re-prompts, without consuming one of the 6 tries.</StepChecklistItem>
<StepChecklistItem>Guessing something that isn't 5 letters (too short, too long, contains a digit) is also rejected before it ever reaches the word-list check.</StepChecklistItem>
<StepChecklistItem>A valid, in-list guess is accepted immediately, lowercase or uppercase.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

Why is it important that `read_guess` re-prompts on a bad guess *inside its own loop*, rather than returning some sentinel value like `None` for the caller (`play_round`) to handle? What would go wrong with the attempt-counting in Step 2 if an invalid guess were allowed to consume one of the 6 tries?

## Step 4: Add persistent stats tracking

The last piece: remember how the player's done, across separate runs of the program, not just within one session. That means writing to a file on disk.

```python
import json
from pathlib import Path

STATS_FILE = Path("stats.json")

DEFAULT_STATS = {
    "played": 0,
    "wins": 0,
    "current_streak": 0,
    "max_streak": 0,
    "guess_distribution": {str(n): 0 for n in range(1, MAX_GUESSES + 1)},
}

def load_stats() -> dict:
    if not STATS_FILE.exists():
        return json.loads(json.dumps(DEFAULT_STATS))  # a fresh copy
    with STATS_FILE.open() as f:
        return json.load(f)

def save_stats(stats: dict) -> None:
    with STATS_FILE.open("w") as f:
        json.dump(stats, f, indent=2)

def record_result(stats: dict, won: bool, guesses_used: int) -> dict:
    stats["played"] += 1
    if won:
        stats["wins"] += 1
        stats["current_streak"] += 1
        stats["max_streak"] = max(stats["max_streak"], stats["current_streak"])
        stats["guess_distribution"][str(guesses_used)] += 1
    else:
        stats["current_streak"] = 0
    return stats
```

`load_stats` handles the very first run gracefully — no file exists yet, so it hands back a fresh set of zeroed defaults rather than crashing on a missing file. Every other run loads whatever was saved last time. `record_result` only adds to `guess_distribution` on a win — a loss doesn't have a meaningful "guesses used to win" value, same as real Wordle's own stats screen.

The full game loop ties it together: load stats once at startup, update and save them after every round.

```python
words = load_words()
stats = load_stats()

while True:
    won, attempts = play_round(words)
    stats = record_result(stats, won, attempts)
    save_stats(stats)
    print(f"Played: {stats['played']}  Win rate: {stats['wins']/stats['played']:.0%}  "
          f"Streak: {stats['current_streak']}")
    if input("Play again? [y/N] ").strip().lower() != "y":
        break
```

:::tip[Save after every round, not just at exit]
Calling `save_stats(stats)` right after `record_result`, every round, means an interrupted program (closed terminal, `Ctrl+C`, crash) only ever loses the *current* round's result at worst — never the whole session's progress. Saving only once at the very end of the program would throw away everything if the player quits mid-session instead of through the "play again?" prompt.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>Quitting the program and restarting it shows the same `played`/`wins`/streak numbers as before you quit, loaded from `stats.json`.</StepChecklistItem>
<StepChecklistItem>Winning in, say, 3 guesses increments `guess_distribution["3"]` specifically, not some other key.</StepChecklistItem>
<StepChecklistItem>Losing a round resets `current_streak` to 0 but does not touch `guess_distribution` or `max_streak`.</StepChecklistItem>
<StepChecklistItem>Deleting `stats.json` and rerunning the program doesn't crash — it starts a fresh, zeroed stats file instead.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

`max_streak` is computed as `max(stats["max_streak"], stats["current_streak"])` after every win, rather than only being updated when the *game* ends. Why does updating it after every single win (instead of trying to compute it later from history) correctly track the best streak ever reached, even if the player is still on their best streak right now and hasn't lost yet?

## ⚠️ Common pitfalls

- **The repeated-letter bug (Step 1).** By far the most common mistake: checking `letter in target` independently for each guessed letter, without tracking which copies of a repeated letter have already been "claimed." This over-awards yellow marks whenever either the guess or the target repeats a letter. Always use the two-pass, copy-consuming approach — greens first, then yellows against a pool of *remaining* target letters.
- **Guesses that aren't real words.** Without validating against a word list (Step 3), players can guess `"AEIOU"` or any other non-word purely to probe which letters are in the target — a strategy real Wordle explicitly blocks by requiring every guess to be a dictionary word.
- **Case sensitivity.** `"crane" == "CRANE"` is `False` in Python. Normalize every guess and target to the same case (this project uses `.upper()` throughout) the moment they enter your code, or comparisons will silently fail for perfectly valid guesses.
- **Losing stats on a crash.** Only writing `stats.json` once at program exit means any crash, `Ctrl+C`, or closed terminal loses that entire session's progress. Save after every round instead (see the tip in Step 4).
- **A stats file from an older version of your code.** If you add a new field to `DEFAULT_STATS` later, `load_stats` as written above will happily load an *old* `stats.json` that's missing that field, and then crash the first time your code tries to read it. Worth handling defensively (see how `examples/wordle-clone/stats.py` merges loaded data over a fresh copy of the defaults) if you plan to keep tweaking the stats schema.

## What you just built

A real Wordle clone: correct guess-feedback logic (including the repeated-letter edge case that trips up a lot of first attempts), an interactive game loop backed by a real word list with proper guess validation, and stats that genuinely persist across separate runs of the program — not just within one session. None of it needed anything beyond the standard library and one small color library, which is worth noticing: a project can be substantial and genuinely fun without needing an API key, a framework, or a cloud service.

:::tip[Verify tricky logic with test cases, not just play-testing]
It's easy to play a few rounds, see reasonable-looking output, and assume the scoring logic is correct — but the repeated-letter bug specifically only shows up on guesses or targets with repeated letters, which won't come up in every round you happen to play by hand. Writing a handful of explicit test cases (like the `SPEED`/`ERASE` example in Step 1) that specifically target that edge case catches bugs that casual play-testing can miss entirely.
:::

## Where to go from here

- **Hard mode.** Real Wordle's hard mode requires every subsequent guess to reuse any greens/yellows already revealed — enforcing that means tracking known constraints across guesses within a round, not just scoring one guess in isolation.
- **A hint system.** Reveal one random unguessed letter's correct position on request, at the cost of it counting against the player's guess total (or some other tradeoff you design).
- **Multiplayer or a shared daily word.** Real Wordle famously gives everyone the same word each day. Deriving today's target deterministically from the date (e.g. hashing the date string to pick an index into the word list) would let every player see the same word without a server — a nice small exercise in deterministic randomness.
- **A simple solver, as a stretch goal.** Given the marks returned so far, filter the word list down to only the words still consistent with every constraint revealed — a fun reversal of the game logic you just wrote, and a good exercise in the same repeated-letter reasoning from Step 1, applied in the opposite direction.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓

<ProjectProgressCheckbox projectId="2027-wordle-clone" />
