---
title: "Control Flow"
description: "Make decisions with if/elif/else and repeat actions with for and while loops."
order: 3
section: "python-101"
track: "normal"
difficulty: "beginner"
estimatedHours: 3
lessonCount: 3
tags: ["if", "elif", "else", "for", "while", "loops", "conditionals"]
prerequisites: ["module-02-operators"]
icon: "🔀"
---

## Why This Matters

A program that always does the same thing is just a script. A program that *decides* is software. Control flow is what makes programs intelligent — it lets your code respond to different inputs, repeat tasks, and handle edge cases.

Think about a login system. If the username exists AND the password matches, let them in. If the username exists but the password is wrong, show "incorrect password." If the username doesn't exist, show "account not found." Without `if/elif/else`, you'd need nested ternary operators that read like gibberish. Python's control flow syntax exists so you can write logic that reads like a human decision tree.

Now imagine processing a CSV file with 10,000 rows. You can't write 10,000 lines of code — one per row. Loops (`for` and `while`) let you write the logic once and apply it to every row automatically. The `for` loop iterates over a sequence. The `while` loop repeats until a condition changes. Together, they handle repetition at any scale — from processing a list of 5 names to analyzing millions of data points.

## What You'll Learn

- `if`, `elif`, `else` blocks for conditional logic with clear branching
- `for` loops for iterating over sequences (lists, strings, ranges, dictionaries)
- `while` loops for repeated execution until a condition is met
- `break`, `continue`, and `pass` for fine-tuned loop control
- Nested conditionals and when to flatten them with guard clauses
- The `range()` function for numeric iteration patterns

## The Derivation

**The Problem:** Real-world logic branches. "If it's raining, take an umbrella. Otherwise, wear sunglasses." A computer needs the same decision-making ability. And sometimes the decision is "do this 100 times" — like checking every student's grade.

**The Naive Approach:** Without structured control flow, you'd use `goto` statements (as in early BASIC or assembly). `goto line 50` jumps to a line number. Programs became tangled webs of jumps — impossible to read, debug, or maintain. This was the "spaghetti code" era.

**The Elegant Solution:** Python's `if/elif/else` reads like a decision tree written in English. The indentation isn't just cosmetic — it defines the structure. Unlike C's braces `{}`, Python's whitespace makes the logic visually clear. You can see at a glance what's inside each branch.

```python
if temperature > 100:
    status = "dangerously hot"
elif temperature > 80:
    status = "warm"
else:
    status = "comfortable"
```

**For vs. While:** The `for` loop is for *known* sequences — "do this for every item in this list." The `while` loop is for *unknown* durations — "keep asking for input until they type 'quit'." This distinction matters because `for` loops always terminate (the list ends), while `while` loops can run forever if the exit condition is never met. Choose the wrong one, and you get infinite loops or unnecessary complexity.

**Loop Control:** `break` exits the loop immediately. `continue` skips to the next iteration. `pass` does nothing — it's a placeholder. These exist because real loops aren't always clean. Sometimes you need to bail out early (`break` on finding a target), skip bad data (`continue` on invalid input), or reserve a spot for future logic (`pass` in an empty block).

## Gamification

- **XP Reward**: +100 XP per lesson completed (300 XP total for this module)
- **Challenges**: Each lesson includes interactive coding challenges
- **Progress**: Complete all 3 lessons to unlock Module 04 (Functions)
- **Streak Bonus**: Complete this module in one sitting for +10 XP bonus
- **Achievement Unlocked**: "Branching Out" — write a program with 3 nested if/elif/else branches

### Lesson Challenges

| Lesson | Challenge | XP |
|--------|-----------|-----|
| Conditionals | Build a tier classifier (bronze/silver/gold) based on score ranges | +100 |
| For Loops | Iterate over a list of names and print a greeting for each | +100 |
| While Loops | Create a number-guessing loop that exits on the correct answer | +100 |

## Projects You Can Build

After completing this module, you'll be ready to tackle these real projects:

- 🎮 **Text Adventure Game** — if/elif/else branches create different story paths based on player choices
- 🔍 **FizzBuzz Challenge** — for loops with modulo logic to solve the classic interview problem
- 🎯 **Number Guessing Game** — while loops with break for interactive gameplay
- 📋 **Task Manager CLI** — loops process user commands until they choose to quit

## Lessons

1. **Conditionals** — `if`, `elif`, `else`, nested conditionals, and guard clauses
2. **For Loops** — iterating over sequences, `range()`, `enumerate()`, and loop patterns
3. **While Loops & Loop Control** — `while`, `break`, `continue`, `pass`, and avoiding infinite loops
