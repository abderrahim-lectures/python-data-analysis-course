---
title: "Tokenization & Word Frequency"
description: "Split raw text into tokens, count word frequencies, and build the vocabulary for our language model."
order: 2
section: "python-101"
track: "hard"
difficulty: "advanced"
estimatedHours: 2
lessonCount: 2
tags: ["tokenization", "word-frequency", "dict", "vocabulary", "nlp"]
prerequisites: ["module-01-loading-corpus"]
icon: "🔤"
---

## Why This Matters

Every time you use autocomplete, ask Siri a question, or see a chatbot respond — there's a language model behind it. These models learn patterns from text. But computers don't read words, they read characters. Tokenization is the bridge between human language and machine understanding.

When you feed raw text into a model without tokenizing it first, the model sees "The" and "the" as completely different words. It counts "running," "run," and "runs" as three separate vocabulary entries. This fragments the learning signal and bloats the vocabulary unnecessarily. Worse, if you don't handle punctuation and casing, the model thinks "hello!" and "hello" are unrelated. These seemingly small decisions cascade through every downstream computation — bigram counts, probability estimates, and generated text all depend on getting tokenization right.

Word frequency counting is the next critical step. Before a language model can predict what word comes next, it needs to know which words exist and how common they are. A word that appears 10,000 times in the corpus is fundamentally different from one that appears once. Frequency distributions are the first statistical fingerprint of any text — they tell you what the text is about, what vocabulary it uses, and where the important patterns live. Without this step, you're flying blind.

## What You'll Learn

- Write a `tokenize(text)` function that lowercases, strips punctuation, and splits text into a list of word tokens
- Build a `word_frequency(tokens)` function that counts occurrences of each token using a dict
- Understand why tokenization decisions (lowercasing, punctuation handling) affect downstream model quality
- Compute basic corpus statistics: total tokens, unique words, most/least frequent words
- Recognize the tradeoffs between aggressive and conservative tokenization strategies

## The Derivation

**The problem:** You have a raw text string — something like `"The cat sat on the mat."` — and you need to break it into individual words so you can count and analyze them.

**The naive approach:** You might split on spaces: `"The cat sat on the mat.".split()` → `["The", "cat", "sat", "on", "the", "mat."]`. This almost works, but notice: `"The"` ≠ `"the"` (casing), and `"mat."` includes a period (punctuation). If you build a frequency table from this, "mat" and "mat." are counted as different words, and "The" and "the" are separate entries. Your vocabulary is inflated and your counts are wrong.

**The solution:** A proper `tokenize()` function applies a sequence of transformations: (1) lowercase everything so "The" and "the" collapse into one token, (2) strip punctuation from the edges of each word, (3) split on whitespace to get individual tokens. This produces a clean list where each element is a single, normalized word.

**How it works in practice:** The function chains Python string methods — `.lower()` for case normalization, `.strip(string.punctuation)` to remove trailing/leading punctuation, and `.split()` to tokenize on whitespace. For word frequency counting, you iterate through the token list, maintaining a dictionary where each key is a word and each value is its count. This `dict` becomes the vocabulary — the complete set of words your model knows about, weighted by how often they appear. These two functions (`tokenize` and `word_frequency`) are the skeleton of every NLP pipeline, from simple bigram models to modern transformer architectures.

## Gamification

- **XP Reward**: +150 XP per lesson (advanced track bonus)
- **Challenges**: Each lesson has interactive challenges — build a tokenizer, count frequencies, compute corpus stats
- **Progress**: Complete both lessons to unlock the bigram tables module
- **Streak Bonus**: Complete this module after Module 1 for +15 XP bonus
- **PBL Milestone**: Your tokenized vocabulary is the foundation for the bigram model in Module 3

## Projects You Can Build

After completing this module, you'll be ready to tackle these real projects:

- 🤖 **AI Story Writer** — tokenization feeds directly into the text generation pipeline
- 💬 **Chatbot Builder** — tokenizing user input is how chatbots understand messages
- 📝 **AI Tutor** — word frequency analysis helps identify key concepts in educational text
- 🔍 **Semantic Search Engine** — tokenization and frequency weighting are core to text matching
- 📰 **Newsletter Builder** — frequency analysis identifies the most important topics in source material

## Lessons

1. **Tokenization Basics** — build a `tokenize()` function from string methods
2. **Word Frequency Counting** — tally tokens into a frequency dict and extract vocabulary stats
