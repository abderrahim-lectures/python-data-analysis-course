---
title: "Build an AI Tutor Assistant"
description: "Load a small flashcard deck, run a spaced-repetition practice session that updates real intervals with SM-2, persist progress to JSON, and attach an optional LLM 'tutor hint' that nudges without giving away the answer."
difficulty: "intermediate"
estimatedMinutes: 90
xpReward: 100
tags: ["Education", "AI Agents", "NLP"]
prerequisites:
  - "Functions, dicts, lists, and a basic loop"
  - "Reading/writing a JSON file with json.dump / json.load"
  - "No ML or LLM API experience needed, the core tutor is pure Python, and the LLM layer degrades gracefully"
learningObjectives:
  - "Model a flashcard deck as a list of dicts carrying per-card scheduling state"
  - "Implement a simplified SM-2 scheduler that grows or resets intervals based on self-scored quality"
  - "Run an interactive practice loop that updates the same list in-place per review"
  - "Round-trip progress to and from JSON to survive across sessions"
  - "Compose a tutor-hint prompt and degrade gracefully when no API key is configured"
---

# 🛠️ 📚 Build an AI Tutor Assistant

A tutor that only knows the correct answer is just a quiz app. This project builds the other kind: a spaced-repetition tutor that *remembers what you're weak on*, grows the interval between reviews when you're doing well, and shortens it when you're not. The scheduling engine is a clean re-implementation of SM-2, a widely used algorithm that depends only on `interval` (days since last review) and a `quality` score (0–5) you supply after each attempt. A persistence layer saves the full deck state to JSON so progress survives across sessions, and an optional LLM layer drafts a one-sentence "tutor hint" that nudges without revealing the answer. The core is pure Python; the LLM layer is genuine but optional, the tutor is fully functional with no API key at all.

This assumes dict-and-list fluency, basic JSON, and no machine-learning background; nothing here is graded, it's optional and ungraded, see [Real-World Projects](/projects) for the full, growing list.

## 🎯 What you'll do

1. Define the flashcard data model and inspect which cards are due right now.
2. Implement a simplified SM-2 interval scheduler that returns an updated card copy.
3. Run a practice session that reviews only due cards, reads self-scores, and updates the deck.
4. Persist progress to JSON and verify a load/dump round-trip.
5. Compose an optional LLM tutor-hint prompt and skip the API call gracefully when no key is present.

## Where to run this

**Locally with `uv`** is the recommended path, this project writes and reads `progress.json` and has no external dependencies, so a fresh `uv init` and a local terminal are all you need.

**Google Colab, Kaggle Notebooks, and Binder** will run every step: the tutor has zero pip dependencies, so every code cell runs unmodified. The one caveat is that `progress.json` lives in the notebook's ephemeral file system, download it between sessions if you want to persist across Colab runs.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-tutor/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-tutor/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fai-tutor%2Fnotebook.ipynb)

## Setup

Everything needed before the first practice run: a project with `json` (no `uv add` required) and a starter deck whose scheduling state is partway through a plausible learning arc.

### Create the project

```bash
uv init ai-tutor
cd ai-tutor
```

No `uv add` needed, `json` is in the standard library, and the SM-2 engine is five lines of arithmetic.

### Load the starter deck

**👟 Starter hint:** Build `new_card` as a tiny factory so every card starts with sane defaults (`interval=0`, `due=0`) while still allowing real-world overrides for cards already learned.

```python
# tutor.py
import json

def new_card(card_id, front, back, hint, interval=0, due=0):
    return {"id": card_id, "front": front, "back": back, "hint": hint,
            "interval": interval, "due": due}

DECK = [
    new_card("py-1", "What does `zip(a, b)` do?",
             "Pairs items from a and b into tuples, stopping at the shorter.",
             "Sounds like a zipper."),
    new_card("py-2", "When does `dict.get(k, d)` return `d`?",
             "When `k` is missing from the dict.",
             "Think of a safe default value.", interval=1, due=2),
    new_card("py-3", "What does `sorted(d.items())` return?",
             "A new list of `(key, value)` tuples, sorted by key.",
             "It's the items view, but sorted.", interval=6, due=5),
    new_card("py-4", "Name one difference between a list and a tuple.",
             "Lists are mutable; tuples are not.",
             "One uses [], the other uses ().", interval=6, due=8),
]

print(len(DECK), "cards")
today = 5
due = [c for c in DECK if c["due"] <= today]
print(len(due), "due now", [c["id"] for c in due])
```

The deck captures a realistic mix: `py-1` was never reviewed (`interval=0, due=0`), `py-2` was reviewed a few days ago (`due=2`, now overdue), `py-3` is due today, and `py-4` is scheduled for the future. `due <= today` is the "now" predicate, an overdue card *and* a card due today both count.

**🎯 Expected output:** `4 cards` and `3 due now ['py-1', 'py-2', 'py-3']`.

**🩹 If it's off:** If `due` prints the wrong cards, check whether `due` is a raw integer field (not a datetime), this project uses a day count, not a date. If the count is wrong, the `<=` should be `<`, an overdue card (due day 2, today day 5) counts, and a card due today (day 5) counts, but a future card (day 8) does not.

## Step 2: Implement the SM-2 scheduler

The scheduler is a pure function: give it the current `interval` and the self-scored `quality` (0–5, where 3 and above means "I got it"), and it returns the next interval, no side effects, no I/O.

### 2.1 Write `sm2_interval`

**👟 Starter hint:** Translate the SM-2 rules: quality below 3 resets to short repeat; interval 0 moves to 1 day; interval 1 moves to 6 days; otherwise double-and-a-half the current interval.

```python
# tutor.py (continued)
def sm2_interval(interval: int, quality: int) -> int:
    if quality < 3:
        return 0
    if interval == 0:
        return 1
    if interval == 1:
        return 6
    return round(interval * 2.5)

print(sm2_interval(0, 5), sm2_interval(1, 5), sm2_interval(6, 4), sm2_interval(6, 2))
```

Quality below 3 means "I didn't know it", the card resets for a short repeat. Once quality is ≥ 3, the interval *grows*: a never-seen card (0 → 1 day) → a one-day card (1 → 6 days) → a six-day card (6 → 15 days). The growth is not linear: `round(interval * 2.5)` makes a card that has been correct three times in a row grow much faster than the first few reviews, which is the whole reason spaced repetition saves time.

**🎯 Expected output:** `1 6 15 0`, first review succeeds, second review opens the long arc, third review grows it again, and a failed review on a mature card resets it.

**🩹 If it's off:** If `sm2_interval(0, 3)` prints `0` instead of `1`, the `quality >= 3` check is placed after the `interval == 0` check (early return). If it prints a float like `15.0`, `round()` was removed.

### 2.2 Write the `review` function

**👟 Starter hint:** `review` takes a card, a quality score, and today's day count; it returns an *updated copy*, no side effects.

```python
# tutor.py (continued)
def review(card: dict, quality: int, today: int) -> dict:
    updated = dict(card)
    if quality >= 3:
        updated["interval"] = sm2_interval(card["interval"], quality)
        updated["due"] = today + updated["interval"]
    else:
        updated["interval"] = max(1, card["interval"])
        updated["due"] = today
    updated["last"] = today
    return updated

c = review({"id": "x", "interval": 0, "due": 0}, 5, 0)
print(c["interval"], c["due"])
c = review({"id": "x", "interval": 1, "due": 0}, 5, 0)
print(c["interval"], c["due"])
c = review({"id": "x", "interval": 6, "due": 0}, 2, 0)
print(c["interval"], c["due"])
```

`dict(card)` creates a shallow copy, the original deck isn't mutated, which means the caller chooses whether to persist the change (this is a deliberate, stageable design). Quality ≥ 3 grows the interval and pushes `due` forward by that many days. Quality below 3 resets the card: the interval stays at least 1 (so the card remains in rotation) and the card is due immediately today, not tomorrow, because the learner hasn't yet shown they know it.

**🎯 Expected output:** `1 1`, `6 6`, `6 0`, the three cases: first review, second review, failed review.

**🩹 If it's off:** If the third line prints `0 0` instead of `6 0`, the "fail" branch is resetting the interval to 0 instead of keeping `max(1, card["interval"])`. If `c["due"]` on a grow fails with a `TypeError`, `card["due"]` was a string, make sure `due` stays an integer throughout.

### 2.3 Verify the scheduler

**✅ Checklist**

- ✅ `sm2_interval` is deterministic: same `interval` + `quality` → same result every time.
- ✅ `review` returns a new dict, the caller chooses whether to accept the update.
- ✅ Quality below 3 resets the card, but never to `interval=0`, the card stays in rotation.

**🤔 Socratic Question(s)**

- `review` returns a copy instead of mutating the card in place. Why is this important for a *session* that reviews multiple cards, and what would be the risk of a mutating `review` if you later want to show the learner "here's how your deck would change" *before* accepting?
- SM-2 says "repeat immediately on failure", and this implementation sets `due = today`. Why is `due = today` a better choice than `due = tomorrow`, and what happens in a learner's brain when a failed card shows up again in the same session?

## Step 3: Practice session

Now the tutor does its job: it filters due cards, prompts the learner for an answer and a quality grade, applies `review`, and updates the deck.

### 3.1 Build the interactive loop

**👟 Starter hint:** `run_session` takes the deck, the day count, and an `ask` callable. The callable is what prompts the learner, and what makes the session testable.

```python
# tutor.py (continued)
def run_session(cards: list[dict], today: int, ask) -> list[dict]:
    due = [i for i, c in enumerate(cards) if c["due"] <= today]
    print(f"{len(due)} due today")
    for idx in due:
        card = cards[idx]
        print("Q:", card["front"])
        _ = ask()           # learner's typed answer (free response)
        print("A:", card["back"])
        quality = int(ask()) # grade: 0 (blackout) to 5 (instant recall)
        cards[idx] = review(card, quality, today)
    return cards
```

`cards[idx] = review(...)` is the one deliberate mutation in the whole project: the deck is updated in place, which is what you want for a real session where the same list survives across the script's lifetime. Passing `ask` instead of using `input()` directly is what makes the loop deterministic, the script calls it with the same sequence of answers every time.

**🎯 Expected output (scripted):** `3 due today`, the three cards with `due <= 5` are reviewed, one by one.

**🩹 If it's off:** If the count is wrong, the `due` list was filtered against a different `today` value. If `ask()` is called only once per card (instead of twice, answer + grade), the loop is short-circuiting on the `_ = ask()` line.

### 3.2 Simulate a session with fixed answers

**👟 Starter hint:** Build a tiny iterator that feeds `ask`, one free-response answer, then one integer grade, per due card, so the session is fully deterministic.

```python
# tutor.py (continued)
script = iter([
    "pear",  "5",    # py-1: correct, confident
    "pear",  "2",    # py-2: wrong answer
    "pear",  "4",    # py-3: close, thoughtful
])

run_session(DECK, today=5, ask=script.__next__)
print("after session:")
for c in DECK:
    print("  ", c["id"], "interval", c["interval"], "due", c["due"])
print("still due now:", [c["id"] for c in DECK if c["due"] <= 5])
```

A `list.__iter__` gives the same values in the same order every run, this is how you get a reproducible expected output from a loop that, in real use, would be `input()`. After the session, `py-1` grows (0 → 1 day, due day 6), `py-2` resets (still due today at day 5), and `py-3` jumps (6 → 15 days, due day 20). The final line asks "who is still due", and only the failed `py-2` qualifies.

**🎯 Expected output:**

```
3 due today
Q: What does `zip(a, b)` do?
A: Pairs items from a and b into tuples, stopping at the shorter.
Q: When does `dict.get(k, d)` return `d`?
A: When `k` is missing from the dict.
Q: What does `sorted(d.items())` return?
A: A new list of `(key, value)` tuples, sorted by key.
after session:
   py-1 interval 1 due 6
   py-2 interval 1 due 5
   py-3 interval 15 due 20
   py-4 interval 6 due 8
still due now: ['py-2']
```

**🩹 If it's off:** If `still due now` shows `['py-2', 'py-3']`, `py-3`'s new `due` was computed as `5 + 15 = 20`, which is *not* `<= 5`, so the list would be wrong if `py-3` shows up; check that `due` is set to `today + interval`, not `today + quality`.

### 3.3 Verify the session

**✅ Checklist**

- ✅ Exactly 3 cards are due, and after the session exactly 1 (`py-2`) remains due.
- ✅ A successful first review (`py-1`) sets `interval=1` and `due=6`.
- ✅ A failed review (`py-2`) resets `due` to `today`, not `today + 1`.

**🤔 Socratic Question(s)**

- The script shows "pear" three times as the learner's answer, the *real* learner would type a different word for each. Why does a scripted `iter` make the output deterministic, and what would `input()` inside the loop change about that?
- After the session, `py-2` is still due. What would you do in the *next* call to `run_session` so that the learner sees the failed card again without re-seeing the cards they already know?

## Step 4: Persist progress and summarize

A tutor that forgets the learner between sessions is just a quiz app with extra steps. This step saves the deck to JSON and verifies the round-trip.

### 4.1 Save and load

**👟 Starter hint:** Write `save_deck` and `load_deck`, two tiny functions, each one line of `json.dump`/`json.load`, keeping the data format open for future inspection.

```python
# tutor.py (continued)
def save_deck(cards: list[dict], path: str = "progress.json") -> None:
    with open(path, "w") as f:
        json.dump(cards, f, indent=2)
    print(f"saved {len(cards)} cards to {path}")

def load_deck(path: str = "progress.json") -> list[dict]:
    with open(path) as f:
        return json.load(f)

save_deck(DECK)
loaded = load_deck()
print("round-trip ok:", loaded == DECK)
```

`indent=2` is the formatting choice that makes the JSON human-readable in a terminal and diff-friendly in git, a one-line decision that pays for itself every time someone has to read the file by hand. The `round-trip ok: True` check is a simple but real integrity test: the file on disk equals the in-memory deck, which means save + load didn't lose or reorder anything.

**🎯 Expected output:** `saved 4 cards to progress.json` and `round-trip ok: True`.

**🩹 If it's off:** If the round-trip prints `False`, check whether `last` was added after the JSON was saved (the saved file won't have it, but the in-memory deck does, either save after the `last` update or save before). If `json.dump` errors with `TypeError: Object of type ndarray is not JSON serializable`, one of the interval or due values was a numpy integer, wrap with `int(...)`.

### 4.2 Verify persistence

**✅ Checklist**

- ✅ `progress.json` exists and contains 4 card objects, each with `interval`, `due`, and `last` fields.
- ✅ `load_deck()` returns a list equal to the deck that was saved.
- ✅ Deleting the deck from memory and reloading produces the same state.

**🤔 Socratic Question(s)**

- This persistence format stores the *entire* deck every time. When the deck grows to 1000 cards, is that wasteful? What single-row `json.dump` change (a different structure) would let you update one card without rewriting the whole file?
- The `last` field was only added inside `review`, so cards that *weren't* reviewed during the session don't have it. How would that inconsistency affect a future "review history" feature, and what's the simplest fix?

## Step 5: Optional LLM tutor hint

A scheduler tells you *when* to review; a tutor hint tells you *how* to think. This step builds a deterministic prompt and, when a key is present, sends it to an LLM. The tutor works perfectly without it.

### 5.1 Compose the hint prompt

**👟 Starter hint:** Build a prompt that gives the LLM the card and the wrong answer, and asks for a nudge, not the solution.

```python
# tutor.py (continued)
def tutor_prompt(card: dict, wrong_answer: str) -> str:
    return (
        f"The learner answered '{wrong_answer}' for flashcard '{card['id']}'. "
        f"The card asks '{card['front']}' and the correct answer is "
        f"'{card['back']}'. Write a one-sentence hint nudging them toward the "
        f"answer without giving it away."
    )

missed = DECK[1]   # py-2, which was answered wrong
print(tutor_prompt(missed, "When the key equals the default"))
```

Embedding the wrong answer in the prompt gives the LLM something to *correct*, it can write "the default `d` is only returned on a *miss*, not a *hit*" instead of a generic explanation. The constraint "one sentence" keeps the hint from turning into a lecture.

**🎯 Expected output:** A single sentence beginning with `The learner answered 'When the key equals the default' for flashcard 'py-2'. The card asks 'When does \`dict.get(k, d)\` return \`d\`?' and the correct answer is 'When \`k\` is missing from the dict.'. Write a one-sentence hint nudging them toward the answer without giving it away.`, note the full prompt, not the LLM's response.

**🩹 If it's off:** If the card ID is `py-1` instead of `py-2`, `DECK[1]` was used against an unsorted deck, check the card order, or change the index to match the failed card from Step 3.

### 5.2 Execute the hint (optional)

**👟 Starter hint:** Check `OPENAI_API_KEY` first; if absent, save the prompt for manual use. Never block the tutor on a missing key.

```python
# tutor.py (continued)
def maybe_hint(prompt: str) -> None:
    import getpass, os
    key = os.environ.get("OPENAI_API_KEY") or getpass.getpass("OpenAI key (blank to skip): ")
    if not key:
        with open("hint_prompt.txt", "w") as f:
            f.write(prompt)
        print("no key — prompt saved to hint_prompt.txt")
        return
    print("key present — a real API call would go here")

maybe_hint(tutor_prompt(DECK[1], "When the key equals the default"))
```

Same graceful pattern as earlier optional layers: the env var handles CI, `getpass` handles a terminal, and the empty string is the off-ramp. Saving the prompt means the hint step is never the bottleneck, paste it into any model, get a hint, copy it back into the practice loop's printed output.

**🎯 Expected output:** `no key, prompt saved to hint_prompt.txt`.

**🩹 If it's off:** If the file is empty, the prompt string was consumed by the first `print` (f-strings are evaluated once), reassign it, don't print it twice. If it prints `GetPassWarning`, the terminal is non-interactive and no `OPENAI_API_KEY` is set, export the variable instead.

### 5.3 Verify the tutor layer

**✅ Checklist**

- ✅ `tutor_prompt` always returns a string embedding the card's actual fields, no generic placeholders.
- ✅ With no key, `hint_prompt.txt` exists and contains the exact prompt string.
- ✅ The tutor hint layer runs at the end of the pipeline, so a failure here never blocks the scheduler or persistence.

**🤔 Socratic Question(s)**

- The tutor prompt asks for "a nudge without giving it away." What one-sentence change would make the prompt *safely injectable* across card types, and why does explicit quoting (escaping `'`) in `wrong_answer` matter when the string enters a prompt?
- The `getpass` key path is interactive; the `OPENAI_API_KEY` path isn't. For what kind of deployment is the env-var path actually *more* secure, and what is the common mistake that makes both equally insecure?

## ⚠️ Common pitfalls

- **Mutating the card instead of returning a copy.** `review` is a pure function by design, its output is a new dict. If you mutate the original card in `review`, the session loop can't show a before/after diff, and you lose the ability to "undo" a mis-score.
- **Using `due = today + quality` instead of `today + interval`.** The interval grows; the quality is a small integer from 0–5. Mixing them produces nonsensical future due dates, and the error is invisible until the next session.
- **Calling `ask()` inside `input()` for the scriptable loop.** `input()` in a test script hangs. Pass `ask` as a callable and build a real `input`-based wrapper for interactive use, this is the pattern that makes the tutor both testable and usable.
- **Persisting before `last` is set.** The `last` field is only added during `review`, so cards that weren't reviewed in a session won't have it in the saved file, and a future load will see a schema inconsistency. Either initialize `last` in `new_card` or save only after a full session.
- **Saving as a flat list.** A list of dicts works for a small deck, but two learners can't share the same file, and there's no per-deck metadata. A dict keyed by deck name is a low-effort upgrade that future-proofs the format.

## What you just built

A tutor that remembers what you're weak on, schedules reviews with real math, persists its state honestly, and can draft a nudging hint when an LLM is available. The SM-2 engine is a five-line function; the rest is clean data plumbing, a deck of dicts, a loop that filters and mutates, and a JSON file. The transferable shape, *pure function for the core logic, mutable session loop for the state updates, JSON for persistence, optional LLM for intelligence*, is the same skeleton behind planners, habit trackers, and any lightweight stateful tool.

:::tip[Run a fuller version without any local setup]
[`examples/ai-tutor/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-tutor) in the course repo is the complete tutor as a notebook, the same starter deck, scripted session, persistence check, and optional LLM hint, all runnable in Colab/Kaggle/Binder. Clone the repo or [open it in a Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Where to go from here

- Add a `hint = card["hint"]` fallback line: when the learner gets a card wrong and there's no API key, print the *stored* hint immediately, the tutor now helps even without an LLM.
- Build a `stats()` function that reads `progress.json` and prints the learner's longest successful streak, average quality, and cards due in the next 7 days.
- Add a second deck (e.g. a vocabulary deck) and a `--deck` flag so the same CLI serves multiple subjects.
- Store a session log as a second JSON file with a list of `{id, quality, timestamp}` rows, the raw data for a progress chart later.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓