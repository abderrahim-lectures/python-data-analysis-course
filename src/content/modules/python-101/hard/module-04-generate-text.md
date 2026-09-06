---
title: "The generate_text() Function"
description: "Use random.choices to sample the next word from a bigram table and generate coherent text sequences."
order: 4
section: "python-101"
track: "hard"
difficulty: "advanced"
estimatedHours: 2
lessonCount: 2
tags: ["random", "sampling", "text-generation", "function", "nlp"]
prerequisites: ["module-03-bigram-tables"]
icon: "🎲"
---

## Why This Matters

This is where the magic happens. You've loaded data, tokenized it, counted word frequencies, and built bigram probability tables. Now you get to watch your model actually speak. The `generate_text()` function is the moment where abstract statistics become language — where a dictionary of numbers produces sentences that a human can read and understand.

Every time you see a "suggested reply" in your messaging app, a "next sentence" prediction in a writing tool, or a autocomplete suggestion while typing — there's a sampling mechanism behind it. The core idea is identical: given a current word, look up a probability distribution over what comes next, then randomly pick one of those candidates weighted by their probability. High-probability words get picked often, low-probability words get picked rarely. The result feels natural because it mirrors the patterns in the training data.

What makes this module particularly exciting is that it's the first time your work produces something visible and tangible. You type a seed word, and your program generates a sequence of words that form coherent (if sometimes surprising) English text. This is the same fundamental mechanism behind GPT-style models — the scale is different, but the principle of sampling from a learned distribution is identical.

## What You'll Learn

- Understand how `random.choices(population, weights)` performs weighted sampling
- Write a `generate_text(bigrams, length)` function that chains word predictions
- Handle missing keys gracefully when a word has no known followers in the corpus
- Control output length and debug generation with a seed for reproducibility
- Understand the relationship between corpus size and generation quality

## The Derivation

**The problem:** You have a bigram probability table and you want to produce a sequence of words that follows the statistical patterns in your corpus. You need to chain predictions: pick a starting word, then repeatedly sample the next word from the current word's distribution.

**The naive approach:** You might use `random.choice()` to pick the next word uniformly at random. But uniform sampling ignores the learned probabilities — it treats "the" and "xylophone" as equally likely followers of "the". The generated text would be nonsensical because it doesn't respect the statistical structure you worked so hard to build.

**The solution:** `random.choices()` with `weights` parameter. This function takes a population (list of candidate words) and a parallel list of weights (their probabilities), and returns a random selection biased toward higher weights. If "cat" has probability 0.4 and "dog" has probability 0.1, "cat" will be chosen roughly 4 times as often. This is the core sampling mechanism.

**How it works:** The `generate_text(bigrams, length)` function: (1) Pick a starting word (randomly or user-specified). (2) Look up `bigrams[current_word]` to get the follower distribution. (3) Extract the candidate words and their probabilities into two lists. (4) Call `random.choices(candidates, weights=probs, k=1)` to sample one follower. (5) Append it to the output, set it as the new current word, and repeat until you reach the target length. Handle the edge case where a word has no known followers by stopping early or picking a random word. With a fixed seed (`random.seed(42)`), you get reproducible output for debugging and testing.

## Gamification

- **XP Reward**: +150 XP per lesson (advanced track bonus)
- **Challenges**: Each lesson has interactive challenges — sample from distributions, build the generator, test edge cases
- **Progress**: Complete both lessons to unlock the final CLI module
- **Streak Bonus**: Complete this module after Modules 1-3 for +15 XP bonus
- **PBL Milestone**: Your `generate_text()` function produces real, readable English — you've built a language model

## Projects You Can Build

After completing this module, you'll be ready to tackle these real projects:

- 🤖 **AI Story Writer** — the `generate_text()` function is the core of any creative writing AI
- 💬 **Chatbot Builder** — text generation is how chatbots produce responses to user input
- 📝 **AI Tutor** — generate explanations and examples by sampling from educational text corpora
- 📰 **Newsletter Builder** — auto-generate article drafts and summaries from source material
- 🎮 **Interactive Fiction Engine** — use text generation to create branching narrative games

## Lessons

1. **Sampling the Next Word** — use `random.choices()` to pick weighted follower words
2. **Implementing generate_text()** — chain the sampling loop into a complete text generator
