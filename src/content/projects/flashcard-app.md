---
title: "Flashcard App"
description: "Build a spaced-repetition flashcard system with progress tracking and study statistics."
difficulty: "beginner"
estimatedMinutes: 40
xpReward: 50
tags: ["cli", "json", "spaced-repetition", "file-io"]
prerequisites: ["Python basics (variables, loops, functions, dictionaries)", "Basic file I/O"]
---

# Flashcard App

Build a terminal flashcard app that uses the SM-2 spaced repetition algorithm to schedule reviews at scientifically optimal intervals. You'll learn to model data with dictionaries, implement a study loop with user interaction, apply an algorithm that adapts to your performance, and persist everything to JSON so your progress survives across sessions.

## What You'll Learn

1. Model data with dictionaries and lists
2. Implement a study session with user interaction
3. Apply the SM-2 spaced repetition algorithm
4. Track learning progress with statistics
5. Persist data to JSON files

## What You'll Build

A terminal flashcard app that:
- Stores flashcards with front/back content and tags
- Runs study sessions with flip-to-reveal
- Uses spaced repetition to schedule reviews
- Tracks mastery and accuracy over time
- Saves progress between sessions

## Where to run this

- **Locally with `uv` (recommended).** This project uses only the standard library, so it runs anywhere Python runs. The Setup section below walks through it.
- **Google Colab or Kaggle Notebooks.** Paste the code cells directly into a notebook. The `input()` calls work for study prompts, but file I/O (Step 6) works differently in the browser.
- **JupyterLite playground.** Paste the code cells directly into a notebook, note that file persistence (Step 6) only works locally.

- **Run it in your browser.** An interactive companion notebook is ready, open it in Colab, Kaggle, or Binder and follow along top-to-bottom.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/flashcard-app/notebook.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/flashcard-app/notebook.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fflashcard-app%2Fnotebook.ipynb)

## Setup

```bash
uv init flashcard-app
cd flashcard-app
```

## Step 1: Define the Data Model

Before building any features, decide how a flashcard lives in memory. Each card is a dictionary with fields for its content, metadata, and spaced repetition state. A list holds all cards in a deck. This flat structure keeps things simple, no classes needed yet.

### 1.1 Create the card structure

**👟 Starter hint:** Each card needs `front`, `back`, `tags`, and the SM-2 fields: `interval` (days until next review), `ease_factor` (how fast intervals grow), `repetitions` (consecutive correct reviews), and `next_review` (when to show it again). Use `datetime.now().isoformat()` for timestamps.

```python
from datetime import datetime, timedelta

def create_card(front: str, back: str, tags: list[str] | None = None) -> dict:
    return {
        "front": front,
        "back": back,
        "tags": tags or [],
        "interval": 1,
        "ease_factor": 2.5,
        "repetitions": 0,
        "next_review": datetime.now().isoformat(),
        "created_at": datetime.now().isoformat(),
    }
```

**🎯 Expected output:** `create_card("What is Python?", "A programming language")` returns a dict with all fields:

```python
>>> card = create_card("What is Python?", "A programming language")
>>> card["front"]
'What is Python?'
>>> card["back"]
'A programming language'
>>> card["interval"]
1
>>> card["ease_factor"]
2.5
>>> card["tags"]
[]
```

**🩹 If it's off:** If you get a `TypeError`, make sure `datetime.now().isoformat()` is called with parentheses, `datetime.now().isoformat()` is correct, `datetime.now.isoformat` (without parens) references the method without calling it. If tags default to a shared mutable list, you used `tags or []` incorrectly, make sure the `or` is inside the function body, not in the default argument.

### 1.2 Create the deck structure

**👟 Starter hint:** A deck is a dictionary with a `name` and a `cards` list. Start with an empty list.

```python
def create_deck(name: str) -> dict:
    return {
        "name": name,
        "cards": [],
        "created_at": datetime.now().isoformat(),
    }
```

**🎯 Expected output:**

```python
>>> deck = create_deck("Python Basics")
>>> deck["name"]
'Python Basics'
>>> len(deck["cards"])
0
```

**🩹 If it's off:** If `deck["cards"]` is `None` instead of `[]`, you forgot to include the `"cards"` key in the return dict.

### 1.3 Add cards to a deck

**👟 Starter hint:** Append a card to the deck's `cards` list. Print a confirmation message.

```python
def add_card(deck: dict, front: str, back: str, tags: list[str] | None = None) -> None:
    card = create_card(front, back, tags)
    deck["cards"].append(card)
    print(f"Added: {front}")
```

**🎯 Expected output:**

```python
>>> deck = create_deck("Python Basics")
>>> add_card(deck, "What is Python?", "A programming language")
Added: What is Python?
>>> add_card(deck, "What is a list?", "An ordered mutable collection", tags=["data structures"])
Added: What is a list?
>>> len(deck["cards"])
2
```

**🩹 If it's off:** If the card doesn't appear in the deck, check that you're appending to `deck["cards"]`, not a local variable. If two cards share the same data, you're reusing the same dict reference, make sure `create_card` returns a new dict each time.

### 1.4 Verify the data model

**✅ Checklist**

- ✅ `create_card` returns a dict with `front`, `back`, `tags`, `interval`, `ease_factor`, `repetitions`, `next_review`, and `created_at`.
- ✅ Tags default to empty list `[]` if not provided.
- ✅ `next_review` is set to the current time as an ISO string.
- ✅ `create_deck` returns a dict with `name` and an empty `cards` list.
- ✅ `add_card` creates a card and appends it to the deck.

**🤔 Socratic Question(s)**

Why store `next_review` as an ISO string instead of a datetime object? What tradeoff does JSON serialization impose, and what would you lose if you stored a unix timestamp instead?

---

## Step 2: Create and List Flashcards

With the data model in place, let's build functions to populate a deck and display its contents. This is the foundation for everything that follows.

### 2.1 Build a sample deck

**👟 Starter hint:** Create a deck with 5–6 cards covering different topics. Use varied tags so filtering works later.

```python
def build_sample_deck() -> dict:
    deck = create_deck("Python Basics")
    cards = [
        ("What is Python?", "A high-level interpreted programming language", ["fundamentals"]),
        ("What is a list?", "An ordered mutable collection", ["data structures"]),
        ("What does `len()` return?", "The number of items in a collection", ["functions"]),
        ("What is a dictionary?", "A collection of key-value pairs", ["data structures"]),
        ("What is a string?", "An immutable sequence of characters", ["data structures"]),
        ("What is a function?", "A reusable block of code that performs a task", ["fundamentals"]),
    ]
    for front, back, tags in cards:
        add_card(deck, front, back, tags)
    return deck
```

**🎯 Expected output:**

```python
>>> deck = build_sample_deck()
Added: What is Python?
Added: What is a list?
Added: What does `len()` return?
Added: What is a dictionary?
Added: What is a string?
Added: What is a function?
>>> len(deck["cards"])
6
```

### 2.2 List all cards

**👟 Starter hint:** Iterate over `deck["cards"]` and print each card's front, back, and tags. Number the cards for easy reference.

```python
def list_cards(deck: dict) -> None:
    if not deck["cards"]:
        print("No cards in this deck.")
        return
    print(f"\n{'='*50}")
    print(f"  {deck['name']} ({len(deck['cards'])} cards)")
    print(f"{'='*50}")
    for i, card in enumerate(deck["cards"], 1):
        tags = ", ".join(card["tags"]) if card["tags"] else "no tags"
        print(f"  {i}. {card['front']}")
        print(f"     -> {card['back']}  [{tags}]")
    print(f"{'='*50}")
```

**🎯 Expected output:**

```
==================================================
  Python Basics (6 cards)
==================================================
  1. What is Python?
     -> A high-level interpreted programming language  [fundamentals]
  2. What is a list?
     -> An ordered mutable collection  [data structures]
  3. What does `len()` return?
     -> The number of items in a collection  [functions]
  4. What is a dictionary?
     -> A collection of key-value pairs  [data structures]
  5. What is a string?
     -> An immutable sequence of characters  [data structures]
  6. What is a function?
     -> A reusable block of code that performs a task  [fundamentals]
==================================================
```

**🩹 If it's off:** If tags show as `['data structures']` instead of `data structures`, you forgot to join them with `", ".join(...)`. If the count is wrong, check that `enumerate` starts at 1, not 0.

### 2.3 Verify listing

**✅ Checklist**

- ✅ `build_sample_deck` creates a deck with exactly 6 cards.
- ✅ `list_cards` prints each card's front, back, and tags.
- ✅ Empty decks print "No cards in this deck." without crashing.
- ✅ Tags are displayed as comma-separated strings, not raw lists.

**🤔 Socratic Question(s)**

Why store the deck as a plain dictionary instead of a class with methods? What do you gain by keeping the data structure simple at this stage?

---

## Step 3: Study Mode

Now the fun part: a study session where you flip cards, reveal the answer, and rate how well you knew it. The quality rating you give feeds directly into the SM-2 algorithm in the next step.

### 3.1 Write the study session loop

**👟 Starter hint:** Filter cards to those due for review (`next_review <= now`). For each card, show the front, wait for the user to press Enter, then show the back. After revealing, ask for a quality rating (0–5). Collect ratings and return them.

```python
from datetime import datetime

def get_due_cards(deck: dict) -> list[dict]:
    now = datetime.now()
    due = []
    for card in deck["cards"]:
        next_review = datetime.fromisoformat(card["next_review"])
        if next_review <= now:
            due.append(card)
    return due

def study_session(deck: dict) -> list[dict]:
    due = get_due_cards(deck)
    if not due:
        print("\nNo cards due for review! Great job.")
        return []

    print(f"\n{'='*50}")
    print(f"  STUDY SESSION — {len(due)} card(s) due")
    print(f"{'='*50}")

    results = []
    for i, card in enumerate(due, 1):
        print(f"\n  Card {i}/{len(due)}")
        print(f"  Front: {card['front']}")
        input("  Press Enter to reveal the answer...")
        print(f"  Back:  {card['back']}")

        quality = get_quality_rating()
        results.append({"card": card, "quality": quality})
        print(f"  Rated: {quality}/5")

    print(f"\n  Session complete! Reviewed {len(results)} card(s).")
    return results
```

**🎯 Expected output:** When you run `study_session(deck)` with due cards, you'll see the front of each card, press Enter, see the back, then type a rating. Cards that aren't due yet are skipped.

### 3.2 Get quality rating from user

**👟 Starter hint:** Prompt the user for a rating from 0 to 5. Validate the input, reject anything that isn't a number in range. Re-prompt on bad input.

```python
def get_quality_rating() -> int:
    print("  How well did you know it?")
    print("  0 - Complete blank")
    print("  1 - Wrong, but recognized when shown")
    print("  2 - Wrong, but it was close")
    print("  3 - Correct with serious difficulty")
    print("  4 - Correct with hesitation")
    print("  5 - Perfect, instant recall")
    while True:
        try:
            rating = int(input("  Rating (0-5): ").strip())
            if 0 <= rating <= 5:
                return rating
            print("  Please enter a number between 0 and 5.")
        except ValueError:
            print("  Please enter a valid number.")
```

**🎯 Expected output:**

```
  How well did you know it?
  0 - Complete blank
  1 - Wrong, but recognized when shown
  2 - Wrong, but it was close
  3 - Correct with serious difficulty
  4 - Correct with hesitation
  5 - Perfect, instant recall
  Rating (0-5): 4
```

**🩹 If it's off:** If the loop never exits, you're not returning from inside the `while True`, make sure `return rating` is inside the `if 0 <= rating <= 5` block. If entering "abc" crashes, you forgot the `try/except ValueError`.

### 3.3 Verify study mode

**✅ Checklist**

- ✅ `get_due_cards` only returns cards where `next_review` is in the past.
- ✅ `study_session` shows the front, waits for Enter, then reveals the back.
- ✅ `get_quality_rating` rejects input outside 0–5 and re-prompts.
- ✅ The session prints a summary when complete.
- ✅ Empty due list prints "No cards due for review!" without crashing.

**🤔 Socratic Question(s)**

Why does the user press Enter to reveal the answer instead of having it appear immediately? How does the physical act of recalling before seeing the answer improve retention?

---

## Step 4: Spaced Repetition (SM-2)

The SM-2 algorithm is the engine that makes this more than a simple flashcard app. It adjusts the interval and ease factor after every review based on how well you knew the answer. Cards you struggle with come back sooner; cards you know well get pushed further into the future.

### 4.1 Implement the SM-2 update

**👟 Starter hint:** The algorithm modifies three fields on the card: `repetitions`, `interval`, and `ease_factor`. If quality >= 3 (correct), increment repetitions and grow the interval. If quality < 3 (forgot), reset repetitions to 0 and set interval back to 1. The ease factor adjusts based on quality, it goes up for easy answers and down for hard ones.

```python
def update_card_sm2(card: dict, quality: int) -> dict:
    if quality >= 3:
        if card["repetitions"] == 0:
            card["interval"] = 1
        elif card["repetitions"] == 1:
            card["interval"] = 6
        else:
            card["interval"] = round(card["interval"] * card["ease_factor"])
        card["repetitions"] += 1
    else:
        card["repetitions"] = 0
        card["interval"] = 1

    card["ease_factor"] = max(
        1.3,
        card["ease_factor"] + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02),
    )

    card["next_review"] = (
        datetime.now() + timedelta(days=card["interval"])
    ).isoformat()

    return card
```

**🎯 Expected output:** Testing the algorithm on a card through several reviews:

```python
>>> card = create_card("Test", "Answer")
>>> # First review — correct (quality 4)
>>> update_card_sm2(card, 4)
>>> card["repetitions"]
1
>>> card["interval"]
1
>>> # Second review — correct (quality 4)
>>> update_card_sm2(card, 4)
>>> card["repetitions"]
2
>>> card["interval"]
6
>>> # Third review — correct (quality 4)
>>> update_card_sm2(card, 4)
>>> card["repetitions"]
3
>>> card["interval"]
15
>>> # Forgot — resets everything
>>> update_card_sm2(card, 1)
>>> card["repetitions"]
0
>>> card["interval"]
1
```

**🩹 If it's off:** If the interval doesn't grow after the third review, check that you have the `elif card["repetitions"] == 1` branch returning 6, without it, the formula `round(interval * ease_factor)` gives `round(1 * 2.5) = 2` instead of 6 for the second correct answer. If `ease_factor` drops below 1.3, the `max(1.3, ...)` clamp isn't there.

### 4.2 Apply SM-2 after each review

**👟 Starter hint:** In the study session loop, after getting the quality rating, call `update_card_sm2` on the card. Print the next review date so the user knows when they'll see it again.

```python
def study_session(deck: dict) -> list[dict]:
    due = get_due_cards(deck)
    if not due:
        print("\nNo cards due for review! Great job.")
        return []

    print(f"\n{'='*50}")
    print(f"  STUDY SESSION — {len(due)} card(s) due")
    print(f"{'='*50}")

    results = []
    for i, card in enumerate(due, 1):
        print(f"\n  Card {i}/{len(due)}")
        print(f"  Front: {card['front']}")
        input("  Press Enter to reveal the answer...")
        print(f"  Back:  {card['back']}")

        quality = get_quality_rating()
        update_card_sm2(card, quality)
        next_review = card["next_review"][:10]
        print(f"  -> Next review: {next_review}")
        results.append({"card": card, "quality": quality})

    print(f"\n  Session complete! Reviewed {len(results)} card(s).")
    return results
```

**🎯 Expected output:** After rating each card, you'll see when it's scheduled next:

```
  Card 1/3
  Front: What is Python?
  Press Enter to reveal the answer...
  Back:  A high-level interpreted programming language
  How well did you know it?
  Rating (0-5): 4
  -> Next review: 2026-09-07
```

Cards rated 0–2 appear again tomorrow; cards rated 3–5 get pushed out based on the SM-2 schedule.

**🩹 If it's off:** If the next review date is always tomorrow regardless of rating, `update_card_sm2` isn't modifying the card's `interval`, make sure you're modifying `card["interval"]` in place, not creating a local variable. If the date is in the past, you forgot to add `timedelta(days=card["interval"])` to `datetime.now()`.

### 4.3 Verify SM-2

**✅ Checklist**

- ✅ Quality >= 3 increments `repetitions` and grows the interval.
- ✅ Quality < 3 resets `repetitions` to 0 and interval to 1.
- ✅ The ease factor never drops below 1.3.
- ✅ `next_review` is set to `now + interval` days.
- ✅ After the study session, the card's fields reflect the new schedule.

**🤔 Socratic Question(s)**

Why does the SM-2 algorithm use a multiplicative ease factor instead of a fixed increment? What happens to review frequency if you always rate a card as 3 (correct with difficulty) versus always 5 (perfect)?

---

## Step 5: Track Progress

A study session is only useful if you can see your progress over time. Let's build statistics that show how many cards you've mastered, your overall accuracy, and how many cards are due.

### 5.1 Compute deck statistics

**👟 Starter hint:** Walk through all cards and count: total, mastered (repetitions >= 3), learning (repetitions 1–2), and new (repetitions == 0). Also compute average ease factor.

```python
def deck_stats(deck: dict) -> dict:
    cards = deck["cards"]
    if not cards:
        return {
            "total": 0, "mastered": 0, "learning": 0, "new": 0,
            "due": 0, "avg_ease": 0.0,
        }

    now = datetime.now()
    mastered = sum(1 for c in cards if c["repetitions"] >= 3)
    learning = sum(1 for c in cards if 1 <= c["repetitions"] < 3)
    new_cards = sum(1 for c in cards if c["repetitions"] == 0)
    due = sum(
        1 for c in cards
        if datetime.fromisoformat(c["next_review"]) <= now
    )
    avg_ease = sum(c["ease_factor"] for c in cards) / len(cards)

    return {
        "total": len(cards),
        "mastered": mastered,
        "learning": learning,
        "new": new_cards,
        "due": due,
        "avg_ease": round(avg_ease, 2),
    }
```

**🎯 Expected output:**

```python
>>> deck = build_sample_deck()
>>> stats = deck_stats(deck)
>>> stats
{'total': 6, 'mastered': 0, 'learning': 0, 'new': 6, 'due': 6, 'avg_ease': 2.5}
```

After a study session, the numbers shift, mastered and learning go up, new goes down, due drops.

**🩹 If it's off:** If `due` is always 0 after studying, `get_due_cards` compares strings instead of datetimes, make sure you call `datetime.fromisoformat()` on the `next_review` string. If `avg_ease` is wrong, you're dividing by the wrong count, use `len(cards)`, not `sum(...)`.

### 5.2 Display statistics as a progress bar

**👟 Starter hint:** Use a Unicode block character to draw a progress bar. Show mastered, learning, and new counts alongside it.

```python
def show_stats(deck: dict) -> None:
    stats = deck_stats(deck)
    total = stats["total"]

    print(f"\n{'='*50}")
    print(f"  {deck['name']} — Progress")
    print(f"{'='*50}")
    print(f"  Total cards:   {stats['total']}")
    print(f"  Due now:       {stats['due']}")
    print(f"  Mastered:      {stats['mastered']}")
    print(f"  Learning:      {stats['learning']}")
    print(f"  New:           {stats['new']}")
    print(f"  Avg ease:      {stats['avg_ease']}")

    if total > 0:
        mastered_pct = stats["mastered"] / total * 100
        bar_len = 30
        filled = int(bar_len * stats["mastered"] / total)
        bar = "█" * filled + "░" * (bar_len - filled)
        print(f"\n  Progress: [{bar}] {mastered_pct:.0f}%")

    print(f"{'='*50}")
```

**🎯 Expected output:**

```
==================================================
  Python Basics — Progress
==================================================
  Total cards:   6
  Due now:       6
  Mastered:      0
  Learning:      0
  New:           6
  Avg ease:      2.5

  Progress: [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 0%
==================================================
```

After studying all cards and rating 4–5 on each, the progress bar fills up.

**🩹 If it's off:** If the progress bar overflows past 30 characters, `filled` exceeds `bar_len`, add `min(filled, bar_len)` as a safety clamp. If percentages don't add up, check that `mastered + learning + new == total`.

### 5.3 Verify progress tracking

**✅ Checklist**

- ✅ `deck_stats` returns total, mastered, learning, new, due, and avg_ease.
- ✅ `show_stats` prints a formatted summary with a progress bar.
- ✅ Empty decks don't crash, they show all zeros.
- ✅ After a study session, the stats reflect the updated card states.

**🤔 Socratic Question(s)**

Why does SM-2 define "mastered" as `repetitions >= 3` rather than a higher number? What would happen to your review schedule if you raised the bar to 5?

---

## Step 6: Save and Load

Your progress disappears when you close the program. Fix that by writing the deck to a JSON file on disk and loading it back at startup.

### 6.1 Save deck to JSON

**👟 Starter hint:** Use `json.dump` to write the deck dict to a file. Use `indent=2` for readable output. The `datetime` objects are already stored as ISO strings, so they serialize without issues.

```python
import json
from pathlib import Path

def save_deck(deck: dict, filename: str = "deck.json") -> None:
    with open(filename, "w") as f:
        json.dump(deck, f, indent=2)
    print(f"Saved {len(deck['cards'])} cards to {filename}")
```

**🎯 Expected output:**

```python
>>> deck = build_sample_deck()
>>> save_deck(deck)
Saved 6 cards to deck.json
```

The file `deck.json` now contains the full deck as readable JSON.

**🩹 If it's off:** If you get `TypeError: Object of type datetime is not JSON serializable`, you stored a `datetime` object directly instead of calling `.isoformat()`, go back to `create_card` and make sure the timestamp is a string. If the file is empty, you opened it with `"w"` mode (which truncates) before calling `json.dump`.

### 6.2 Load deck from JSON

**👟 Starter hint:** Use `json.load` to read the file back. Handle the case where the file doesn't exist, start with an empty deck in that case.

```python
def load_deck(filename: str = "deck.json") -> dict:
    path = Path(filename)
    if not path.exists():
        print(f"No saved deck found — starting fresh.")
        return create_deck("My Deck")
    with path.open() as f:
        deck = json.load(f)
    print(f"Loaded {len(deck['cards'])} cards from {filename}")
    return deck
```

**🎯 Expected output:** On first run (no file): `No saved deck found, starting fresh.` On subsequent runs: `Loaded 6 cards from deck.json`.

**🩹 If it's off:** If you get `FileNotFoundError`, you're not checking `path.exists()` before opening. If the loaded deck has `None` for `cards`, the JSON file is malformed, open it in a text editor to check.

### 6.3 Verify persistence

**✅ Checklist**

- ✅ After saving, `deck.json` exists and contains valid JSON with all card fields.
- ✅ After loading, the deck has the same cards, tags, and SM-2 state.
- ✅ Missing the JSON file doesn't crash, it starts with an empty deck.
- ✅ The saved file is human-readable with `indent=2`.

**🤔 Socratic Question(s)**

What happens if you edit `deck.json` by hand and introduce a typo in the `ease_factor` field? How would you add validation when loading to catch corrupted data?

---

## Step 7: Polish the CLI

Bring everything together into an interactive menu. The user picks actions from a numbered list, input is validated, and the experience feels complete.

### 7.1 Build the main menu

**👟 Starter hint:** Write a `main()` function that loads the deck at startup, loops with a menu, and saves after every change. Use a `while True` loop that breaks on the "quit" option.

```python
def show_menu() -> None:
    print("\n=== Flashcard App ===")
    print("1. Study (due cards)")
    print("2. View all cards")
    print("3. Add a card")
    print("4. Show progress")
    print("5. Save deck")
    print("6. Quit")

def add_card_interactive(deck: dict) -> None:
    front = input("Front of card: ").strip()
    if not front:
        print("  Front cannot be empty.")
        return
    back = input("Back of card: ").strip()
    if not back:
        print("  Back cannot be empty.")
        return
    tags_input = input("Tags (comma-separated, or blank): ").strip()
    tags = [t.strip() for t in tags_input.split(",") if t.strip()] if tags_input else []
    add_card(deck, front, back, tags)

def main() -> None:
    deck = load_deck()

    while True:
        show_menu()
        choice = input("Choose (1-6): ").strip()

        if choice == "1":
            study_session(deck)
            save_deck(deck)
        elif choice == "2":
            list_cards(deck)
        elif choice == "3":
            add_card_interactive(deck)
            save_deck(deck)
        elif choice == "4":
            show_stats(deck)
        elif choice == "5":
            save_deck(deck)
        elif choice == "6":
            save_deck(deck)
            print("Goodbye!")
            break
        else:
            print("Invalid choice — pick 1 through 6.")

if __name__ == "__main__":
    main()
```

**🎯 Expected output:** Running `main()` shows a numbered menu, performs the selected action, and returns to the menu. The deck saves automatically after studying or adding cards.

```
=== Flashcard App ===
1. Study (due cards)
2. View all cards
3. Add a card
4. Show progress
5. Save deck
6. Quit
Choose (1-6): 1

No cards due for review! Great job.

=== Flashcard App ===
1. Study (due cards)
...
```

**🩹 If it's off:** If you get `UnboundLocalError`, the `deck` variable isn't defined before the `while True` loop, make sure `deck = load_deck()` runs first. If cards aren't saved after studying, you forgot `save_deck(deck)` inside the `"1"` branch.

### 7.2 Add coloured feedback

**👟 Starter hint:** Use ANSI escape codes for terminal colours. Wrap correct/wrong feedback in green/red. No external libraries needed.

```python
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BOLD = "\033[1m"
RESET = "\033[0m"

def coloured(text: str, color: str) -> str:
    return f"{color}{text}{RESET}"
```

**🎯 Expected output:** After rating a card, the feedback appears in colour, green for high ratings (4–5), yellow for medium (3), red for low (0–2).

**🩹 If it's off:** If you see raw escape codes like `[92m` instead of colours, most modern terminals support ANSI codes, but Windows Command Prompt may need `os.system("")` called once at startup to enable them.

### 7.3 Verify the full application

**✅ Checklist**

- ✅ The menu displays six options and accepts input without crashing.
- ✅ "Study" runs a study session with SM-2 updates and saves the deck.
- ✅ "View all cards" lists every card with front, back, and tags.
- ✅ "Add a card" validates non-empty front/back and saves immediately.
- ✅ "Show progress" displays stats and a progress bar.
- ✅ "Save deck" writes to `deck.json` and confirms.
- ✅ "Quit" saves and exits cleanly.
- ✅ Invalid input prints an error and returns to the menu.

---

## ⚠️ Common pitfalls

- **Forgetting to save after changes.** If you study cards but don't call `save_deck`, all SM-2 updates are lost when you exit. Always save right after a data-changing operation.
- **String comparison for dates.** Comparing ISO date strings lexicographically works for `YYYY-MM-DD` format, but `datetime.fromisoformat()` is safer for calculations like "is this card due?"
- **Mutating the default list.** If `get_due_cards` modifies the deck's `cards` list instead of filtering into a new list, you'll remove cards from the deck. Always create a filtered copy.
- **Ease factor below 1.3.** The SM-2 algorithm can push ease_factor below 1.3 with very low ratings. The `max(1.3, ...)` clamp prevents intervals from shrinking forever.
- **Overwriting the JSON on load.** `load_deck` should *read* the file, not write to it. A common slip is importing the wrong function or calling `save` inside `load`.

## 🧩 Challenges

Ready to push further? Try these:

1. **Tag filtering**, Add a command to study only cards with a specific tag. Filter `get_due_cards` by checking if the tag is in `card["tags"]`.

2. **Deck import/export**, Let users export a deck as a plain-text file (one card per line, front|back format) and import it back. This makes decks shareable without JSON.

3. **Session history**, Track how many cards you reviewed each day, your average rating, and accuracy. Store the history in a separate JSON file and show a weekly summary.

## What You Learned

- **Dictionary-based data modeling**, Represented cards and decks as plain Python dicts with clear field names and defaults.
- **SM-2 spaced repetition**, Implemented the algorithm that adjusts review intervals based on how well you know each card.
- **User interaction**, Built a study session with flip-to-reveal, input validation, and quality ratings.
- **Progress tracking**, Computed mastery statistics and visualized progress with a terminal progress bar.
- **JSON persistence**, Saved and loaded deck data across sessions using `json.dump` and `json.load`.
- **CLI design**, Built a menu-driven interface with input validation, coloured feedback, and automatic saves.

You now have a fully functional flashcard app. The dictionary-based architecture makes it easy to extend, add images by storing URLs in a `"image"` field, implement Leitner boxes by adding a `"box"` field, or build a shared deck system by reading JSON from a URL.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓
