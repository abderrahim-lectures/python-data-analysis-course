---
title: "Operators & Expressions"
description: "Arithmetic, comparison, and boolean operators, the building blocks of every expression."
order: 2
section: "python-101"
track: "normal"
difficulty: "beginner"
estimatedHours: 2
lessonCount: 3
tags: ["operators", "arithmetic", "comparison", "boolean", "precedence"]
prerequisites: ["module-01-python-basics"]
icon: "🔢"
---

## Why This Matters

Every time you write `x + y`, you're using an operator. Operators are the verbs of programming, they take your data and *do something* with it. Without them, you could store values but never compute anything. A calculator app that can't add is just a display screen.

Consider building a shopping cart. You need to calculate subtotals (`price * quantity`), apply discounts (`subtotal * 0.9`), check if the user has enough money (`total <= balance`), and determine if shipping is free (`subtotal >= 50`). Each of these is an operator expression. And the order you evaluate them matters, `3 + 4 * 2` is 11, not 14, because multiplication happens before addition. Misunderstand precedence, and your totals come out wrong.

Boolean operators (`and`, `or`, `not`) let you combine conditions. "Is the user logged in AND has a valid subscription?", that's `is_logged_in and has_subscription`. Without understanding how these operators work together, you can't express real-world logic in code.

## What You'll Learn

- Arithmetic operators including Python's floor division (`//`) and modulo (`%`)
- Comparison operators (`==`, `!=`, `<`, `>`, `<=`, `>=`) and chained comparisons (`1 < x < 10`)
- Boolean operators (`and`, `or`, `not`) for combining conditions
- Operator precedence and when to use parentheses for clarity
- Short-circuit evaluation: how Python avoids unnecessary computation
- Assignment operators (`+=`, `-=`, `*=`) for concise updates

## The Derivation

**The Problem:** You have data, and you need to transform it. A price needs to be multiplied by a quantity. A temperature needs to be compared to a threshold. Two conditions need to be checked together. Without operators, you'd need to call functions for every tiny operation: `multiply(price, quantity)` or `is_greater_than(temp, 100)`. Code would be verbose and unreadable.

**The Naive Approach:** Some languages (like Lisp) use prefix notation everywhere: `(* price quantity)`. It's consistent but hard to read when you're used to math notation.

**The Elegant Solution:** Python uses infix notation, `price * quantity`, just like mathematics. This makes expressions read naturally. You also get comparison operators that chain: `0 < temperature < 100` reads exactly like the mathematical inequality it represents. No other mainstream language does this as cleanly.

**Arithmetic Beyond Basic Math:** Python's `//` (floor division) and `%` (modulo) exist because real-world problems need them. `//` gives you the integer part of division, essential for splitting items into pages (100 items / 10 per page = 10 pages). `%` gives you the remainder, essential for checking even/odd numbers (`x % 2 == 0`) or cycling through values (`x % 3` rotates through 0, 1, 2).

**Boolean Logic as a Language:** `and`, `or`, `not` read like English. `if is_admin and has_permission` is clear to anyone. But there's a deeper mechanic: *short-circuit evaluation*. `if x != 0 and y / x > 1`, Python stops at `x != 0` if it's false, never evaluating `y / x` and avoiding a division-by-zero error. The operators aren't just syntax; they're safety mechanisms.

**Precedence:** The order of operations (`*` before `+`) is inherited from mathematics. Python adds `not` before `and` before `or`. When in doubt, use parentheses, they cost nothing and prevent bugs.

## Gamification

- **XP Reward**: +60 XP per lesson completed (180 XP total for this module)
- **Challenges**: Each lesson includes interactive expression-building challenges
- **Progress**: Complete all 3 lessons to finish this module
- **Streak Bonus**: +15 XP extra per day once your streak passes 3 days

### Lesson Challenges

| Lesson | Challenge | XP |
|--------|-----------|-----|
| Arithmetic | Build a tip calculator using floor division and modulo | +60 |
| Comparison | Chain 3 comparisons to validate a phone number format | +60 |
| Boolean Logic | Combine 4 conditions with and/or/not to model a game rule | +60 |

## Projects You Can Build

After completing this module, you'll be ready to tackle these real projects:

- 🛒 **Shopping Cart Calculator**, arithmetic operators compute totals, discounts, and tax
- 🎯 **Number Guessing Game**, comparison operators give "higher" or "lower" hints
- 📊 **Grade Calculator**, boolean operators determine pass/fail with multiple criteria
- ⏰ **Countdown Timer**, modulo operator converts seconds into hours, minutes, seconds

## Lessons

1. **Arithmetic Operators**, `+`, `-`, `*`, `/`, `//`, `%`, `**`, and assignment operators (`+=`, `-=`, etc.)
2. **Comparison Operators**, `==`, `!=`, `<`, `>`, `<=`, `>=`, chained comparisons, and `is` vs `==`
3. **Boolean Operators & Precedence**, `and`, `or`, `not`, short-circuit evaluation, and operator precedence rules
