---
title: "Python Basics"
description: "Your first steps: printing output, naming values, understanding types, and converting between them."
order: 1
section: "python-101"
track: "normal"
difficulty: "beginner"
estimatedHours: 2
lessonCount: 4
tags: ["fundamentals", "output", "variables", "types"]
prerequisites: []
icon: "🐍"
---

## Why This Matters

Imagine you're building a weather dashboard. You need to store today's temperature (72.5), a city name ("Portland"), whether it's raining (True), and the number of active weather stations (14). Without a way to store these values under readable names, you'd have to hardcode `72.5` everywhere — and the moment you want to change it, you'd have to hunt through your entire program, swapping numbers one by one. Variables solve this by giving you named handles for every piece of data.

But it goes deeper. Python doesn't just store values — it tracks what *kind* of value each variable holds. The number `72.5` behaves differently from the text `"72.5"`. You can multiply two numbers, but you can't multiply two strings the same way. You can compare a boolean to `True`, but you can't add it to an integer without an error. Understanding types — `int`, `float`, `str`, `bool` — is what lets you predict what your code will actually do instead of guessing.

Every program you'll ever write starts with these building blocks: storing data, checking what kind of data it is, and sometimes converting between types. Skip this foundation, and every later module becomes harder. Master it, and you'll write code that's predictable, readable, and easy to debug.

## What You'll Learn

- Print output to the screen with `print()` and understand what it returns
- Store values under names (variables) and reassign them safely
- Identify Python's four core types: `int`, `float`, `str`, `bool`
- Convert between types explicitly with `int()`, `float()`, `str()`, `bool()`
- Understand dynamic typing and why Python doesn't require type declarations
- Recognize common type-related errors before they happen

## The Derivation

**The Problem:** Computers need to work with data — numbers, text, flags. But raw memory addresses (like `0x7FFF5FBFF8D0`) are meaningless to humans. You can't build a weather app by remembering that the temperature lives at address `0x7FFF5FBFF8D0` while the city name is at `0x7FFF5FBFF8E0`.

**The Naive Approach:** Early programming languages (like assembly) forced you to manage memory directly. You'd allocate bytes, track addresses, and hope nothing overlapped. This was error-prone and slow to develop.

**The Elegant Solution:** Python (and most modern languages) introduced *variables* — human-readable names that point to values. When you write `temperature = 72.5`, Python creates a float object in memory and makes the name `temperature` refer to it. You never think about memory addresses again.

**Why Dynamic Typing?** Python takes this further. Unlike C or Java, you don't declare `float temperature = 72.5`. You just write `temperature = 72.5` and Python figures out the type automatically. This is *dynamic typing* — the type lives with the value, not the variable name. The same variable can hold a number, then a string, then a list. This flexibility makes Python fast to write and easy to prototype with, though it means you need to understand types to avoid surprises.

**Type Conversion:** Sometimes you need to bridge types. A user types `"72.5"` into a form — that's a string. You need to do math with it, so you convert it to a float with `float("72.5")`. Python calls this *casting*. It's explicit: you always know when a conversion happens, because you write the conversion function yourself.

## Gamification

- **XP Reward**: +100 XP per lesson completed (400 XP total for this module)
- **Challenges**: Each lesson includes interactive coding challenges in the browser playground
- **Progress**: Complete all 4 lessons to unlock Module 02 (Operators & Expressions)
- **Streak Bonus**: Complete this module in one sitting for +10 XP bonus
- **Achievement Unlocked**: "First Steps" — print your first output to the console

### Lesson Challenges

| Lesson | Challenge | XP |
|--------|-----------|-----|
| Printing | Output a formatted welcome message with multiple `print()` calls | +100 |
| Variables | Store 5 different values and reassign two of them | +100 |
| Types | Identify the type of 10 different values without running code | +100 |
| Type Conversion | Convert a user's text input into a number and compute a result | +100 |

## Projects You Can Build

After completing this module, you'll be ready to tackle these real projects:

- 🎮 **Wordle Clone** — uses variables to store guesses, track attempts, and manage game state
- 📝 **Note-Taking App** — stores text data in variables and displays it back to the user
- 🔐 **Password Generator** — combines string variables, loops, and random choices to build secure passwords
- 💰 **Expense Tracker** — stores numerical values and calculates running totals

## Lessons

1. **Printing Output** — `print()`, string arguments, multiple arguments, and the `end` parameter
2. **Variables** — assignment, naming rules, reassignment, and why variable names matter
3. **Data Types** — `int`, `float`, `str`, `bool`, `type()`, and the concept of dynamic typing
4. **Type Conversion** — casting between types with `int()`, `float()`, `str()`, `bool()`, and common pitfalls
