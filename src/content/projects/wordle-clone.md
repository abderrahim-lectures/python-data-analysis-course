---
title: "Build a Wordle Clone"
description: "Build a real terminal Wordle game from scratch: correct green/yellow/gray guess feedback (including the classic repeated-letter bug), a custom word list, and persistent stats tracking across sessions."
difficulty: "beginner"
---

# 🎮 Build a Wordle Clone

This project only assumes Python 101-level basics — functions, lists, dictionaries, loops, reading and writing a file. No pandas, no API key, no GPU, no external service of any kind — just a terminal, a word list, and some logic that's trickier to get right than it looks. That makes this a great *earlier* Real-World Project to try, even before some of the pandas- or AI-flavored ones: everything you need is stuff Python 101 already gave you, applied to something genuinely fun to play afterward.

This is optional and ungraded. See [Real-World Projects](/projects) for the full, growing list.

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

The single hardest piece of a Wordle clone, and the one worth getting right on its own before any game loop: given a 5-letter guess and a 5-letter target word, produce one mark per letter — **G**reen if that letter is in the right position, **Y**ellow if it's in the word but the wrong position, gray (**X**) otherwise.

Take this step in three small sub-steps: build a first (deliberately naive) version, discover its flaw with one test case, then replace it with a correct two-pass algorithm.

### 1.1 Write the naive scorer

**👟 Starter hint:** Write a function `score_guess(guess, target)` that returns a list of marks. For each position `i`, ask three questions in order: is `guess[i]` exactly `target[i]`? If not, is `guess[i]` anywhere in `target`? If neither, it's gray. Start by copying this and running it on `"CRANE"`/`"CRANE"`:

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

**🎯 Expected output:** `score_guess_naive("CRANE", "CRANE")` returns `["G","G","G","G","G"]`, and a guess sharing no letters with the target (say `"XXXXX"` against `"CRANE"`) returns five `"X"`s.

**🩹 If it's off:** If you get an `IndexError`, you're iterating a guess longer or shorter than 5 — double-check you're indexing both strings at position `i`. If every letter comes back gray even for an exact match, make sure you're comparing `guess[i]` to `target[i]` (the same index), not `guess[i]` to `target`.

### 1.2 Find the bug with one test case

The naive function *looks* like it works — but it quietly double-counts letters. Try `guess = "SPEED"`, `target = "ERASE"`.

**👟 Starter hint:** Run it and read the output before reading on. The target has exactly **one** `E`. What marks do you get for the two `E`s in `SPEED`?

**🎯 Expected output:** The naive version returns *both* `E`s as yellow (`["Y","X","Y","Y","X"]`) — wrong. Real Wordle would never award two yellow `E`s in a guess when the target only contains one `E`: one guessed `E` deserves a mark, the other has no matching letter left to justify one.

**🩹 If it's off (this is the whole point):** Here's *why* it's wrong. The naive version checks each guessed letter against the whole target string independently — so each `E` runs `"E" in target`, which is `True` both times regardless of how many `E`s the target actually holds. Each guessed letter needs to "consume" a copy of a target letter, and the naive check never consumes anything. That's the bug to design away in the next sub-step.

### 1.3 Replace it with a two-pass algorithm

A correct version keeps a running count of which target letters are still unclaimed, and only awards a yellow when a copy is actually available.

**👟 Starter hint:** Use `collections.Counter`. Pass 1 walks `guess`/`target` together: mark greens, and tally every *non-green* target letter into a `remaining` counter. Pass 2 walks the guess again: a letter that isn't already green gets a yellow only if `remaining` has an unclaimed copy — and claiming one decrements the count, so a repeated guessed letter can't earn two yellows from one target copy.

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

**🎯 Expected output:** `score_guess("SPEED", "ERASE")` now returns `["Y", "X", "Y", "Y", "X"]`. One `E` (position 0) is yellow, the other (position 3) is also yellow because `ERASE` really does have two `E`s. But a guess like `"ELITE"` against a target with only one `E` would correctly give the *second* `E` a gray, not a yellow.

**🩹 If it's off:** A common slip is to forget the `remaining[g] -= 1` after a yellow — without it, you're back to the same double-counting bug, just with extra steps. Check that a duplicate letter in the guess only earns as many yellows as the target actually has copies of.

### 1.4 Confirm it with your own cases

**✅ Checklist**

- ✅ `score_guess("CRANE", "CRANE")` returns all greens.
- ✅ `score_guess("SPEED", "ERASE")` returns exactly two yellow `E`s, not more.
- ✅ A guess and target that share zero letters returns all grays.
- ✅ You've tried a case where the *guess* repeats a letter but the target only has one copy, and confirmed only one mark comes back non-gray.

**🤔 Socratic Question(s)**

Try target `"LLAMA"` and guess `"ALLOY"` by hand before running the code: `LLAMA` has two `L`s and two `A`s. Walk through both passes yourself — which letters end up green, which end up yellow, and which end up gray? Then check your answer against `score_guess`. If you got it wrong on paper, where exactly did your mental model diverge from the two-pass algorithm?

## Step 2: Build the game loop

With scoring solid, wrap it in an actual game: pick a random target from a word list, give the player 6 guesses, and stop as soon as they get all five greens. Two small sub-steps: get the words in, then loop the turns.

### 2.1 Load the word list

**👟 Starter hint:** Create a `words.txt` file with one 5-letter word per line (the real example bundles ~540 common English words), then write a function that reads it into a list of uppercased, whitespace-trimmed lines.

```python
import random

MAX_GUESSES = 6

def load_words(path="words.txt") -> list[str]:
    with open(path) as f:
        return [w.strip().upper() for w in f if w.strip()]
```

**🎯 Expected output:** `load_words()` returns a non-empty list, every entry exactly 5 letters, all uppercase. Calling `print(load_words()[:3])` shows the first three words.

**🩹 If it's off:** An empty list usually means the path is wrong (run it from the same directory as `words.txt`) or every line failed `w.strip()`. Copying a real dictionary's *definitions* would be a licensing problem — a plain word *list* (just facts about which strings are words) is fine to redistribute, which is exactly why the example uses its own ~540-word file.

### 2.2 Write the turn loop

**👟 Starter hint:** Use `random.choice(words)` once for the target, then a `for` loop over `range(1, MAX_GUESSES + 1)`. Each turn: prompt, score with Step 1's `score_guess`, print the marks, and stop with a win message the moment `all(m == "G" for m in marks)`.

```python
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

**🎯 Expected output:** A round plays end to end — a correct guess ends it early with `You got it in <n>!`, and six wrong guesses end with `Out of guesses. The word was ...`.

**🩹 If it's off:** If the word is revealed *before* the game ends, you're printing the target on every loop — move that `print` to just after the loop, not inside it. If a win never ends the round, check that you `return` on the all-green path instead of just printing the message. If the same word repeats every round, `random.choice` is being called in the wrong place — it must sit *inside* `play_round`, not once outside it.

### 2.3 Verify the round end-to-end

**✅ Checklist**

- ✅ Each round picks a genuinely random target from the word list (print it temporarily to confirm, then remove the print — no spoilers once you trust it).
- ✅ The loop stops immediately once all five marks are green, even before 6 guesses are used.
- ✅ After exactly 6 wrong guesses, the loop ends and reveals the target.

**🤔 Socratic Question(s)**

If `random.choice(words)` is called once per round from inside `play_round`, and you call `play_round` in a loop to let someone play again, will the target actually change between rounds? What would happen if you accidentally computed `target` once *outside* the loop instead?

## Step 3: Validate guesses against the word list

Real Wordle doesn't let you guess `"ZZZZZ"` — every guess has to be a real word from its dictionary. Two tiny sub-steps: reject malformed input first, then reject words that aren't in the list.

### 3.1 Reject the wrong shape first

**👟 Starter hint:** Write a `read_guess(word_set)` that loops forever, prompting each time, and only `return`s a valid guess. For the cheapest check first, reject anything that isn't exactly 5 alphabetic letters *before* checking the word list.

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

**🎯 Expected output:** Typing `"crane5"`, `"ab"`, or an empty line prints the shape rejection and re-prompts without ending the game or using up a try.

**🩹 If it's off:** If whitespace sneaks through, your `len()` check is counting the trailing newline — call `.strip()` before checking length. If a valid word like `"abcde"` gets rejected, make sure you `continue` (not `return`) inside each rejection branch, and that only the final `return raw` sits outside all checks.

### 3.2 Reject words that aren't in the list — and why a `set`

**👟 Starter hint:** After the shape check passes, verify the word is real with `if raw not in word_set`. Pass the word list in as a `set` rather than the raw list.

**🎯 Expected output:** `"ZZZZZ"` (a non-word) prints a clear rejection and re-prompts; a valid in-list guess is accepted immediately, lowercase or uppercase.

**🩹 If it's off:** Using a `set` here matters more than it looks: list membership checks scan every entry one by one, while a set check is near-instant regardless of how many words are in it — a genuinely good habit for any "is this value in a big collection" check. If your game got noticeably slower as the word list grew, you were still checking membership against the raw list.

:::tip[Reject bad input early, not mid-game]
Validating the guess's *shape* (5 letters, alphabetic) before checking the word list catches the most common typos with the cheapest check first — no point searching a 540-word set for `"crane5"` when a `len()` and `.isalpha()` check already tells you it's malformed.
:::

### 3.3 Verify the validation

**✅ Checklist**

- ✅ Guessing a non-word (e.g. `"ZZZZZ"`) prints a clear rejection message and re-prompts, without consuming one of the 6 tries.
- ✅ Guessing something that isn't 5 letters (too short, too long, contains a digit) is also rejected before it ever reaches the word-list check.
- ✅ A valid, in-list guess is accepted immediately, lowercase or uppercase.

**🤔 Socratic Question(s)**

Why is it important that `read_guess` re-prompts on a bad guess *inside its own loop*, rather than returning some sentinel value like `None` for the caller (`play_round`) to handle? What would go wrong with the attempt-counting in Step 2 if an invalid guess were allowed to consume one of the 6 tries?

## Step 4: Add persistent stats tracking

The last piece: remember how the player's done, across separate runs of the program, not just within one session. That means writing to a file on disk. Three small sub-steps: persist the storage helpers, record a round's result, then wire it into the game loop.

### 4.1 Persist stats with load/save helpers

**👟 Starter hint:** Use `json` plus `pathlib.Path`. Write `load_stats()` that returns a freshly-zeroed default dict when no file exists yet, and `save_stats(stats)` that dumps to a `stats.json` file.

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
```

**🎯 Expected output:** Running `load_stats()` before any `stats.json` exists returns a dict of zeroes (`played: 0`, `wins: 0`, ...) instead of crashing. After `save_stats(...)`, `stats.json` appears on disk with pretty-printed JSON you can read.

**🩹 If it's off:** `json.loads(json.dumps(DEFAULT_STATS))` is there to make a *copy* — if you `return DEFAULT_STATS` directly and then mutate the result, you'd be mutating the shared default and the next fresh game would "remember" the previous run. A weird `TypeError` when saving usually means a stat value isn't JSON-serializable (e.g. you stored a `set` by mistake).

### 4.2 Record a round's result

**👟 Starter hint:** Write `record_result(stats, won, guesses_used)` that bumps `played` every round, bumps `wins` and adds to `guess_distribution` on a win, and resets `current_streak` to 0 on a loss.

```python
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

**🎯 Expected output:** Winning in 3 guesses (then repeating once more) gives `played: 2`, `wins: 2`, `guess_distribution["3"]: 2`, `current_streak: 2`. Losing on the next round sets `current_streak: 0` while leaving `max_streak: 2` and the distribution untouched.

**🩹 If it's off:** `record_result` only adds to `guess_distribution` on a win — a loss has no meaningful "guesses used to win" value, same as real Wordle's own stats screen. If your loss is bumping the distribution or `max_streak`, check you only touch those inside the `if won:` branch. And remember to *return* the mutated dict so the caller's copy is the same object.

### 4.3 Wire it into the game loop

**👟 Starter hint:** Load stats once at startup, then after every round update them and save. Track your totals and let the player keep playing while watching them climb.

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

**🎯 Expected output:** Quitting and restarting the program shows the same `played`/`wins`/streak numbers as before — they survived, loaded from `stats.json`.

**🩹 If it's off (a real pitfall):** Save after *every* round, not just at exit. Calling `save_stats(stats)` right after `record_result` means an interrupted program (closed terminal, `Ctrl+C`, crash) only ever loses the current round's result at worst — never the whole session's progress. Saving only at the very end throws away everything if the player quits mid-session instead of through the "play again?" prompt.

### 4.4 Verify persistence

**✅ Checklist**

- ✅ Quitting the program and restarting it shows the same `played`/`wins`/streak numbers as before you quit, loaded from `stats.json`.
- ✅ Winning in, say, 3 guesses increments `guess_distribution["3"]` specifically, not some other key.
- ✅ Losing a round resets `current_streak` to 0 but does not touch `guess_distribution` or `max_streak`.
- ✅ Deleting `stats.json` and rerunning the program doesn't crash — it starts a fresh, zeroed stats file instead.

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
