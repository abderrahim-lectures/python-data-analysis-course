---
title: "Bigram Probability Tables"
description: "Build and normalize bigram count tables that map each word to the words that follow it."
order: 3
section: "python-101"
track: "hard"
difficulty: "advanced"
estimatedHours: 2
lessonCount: 2
tags: ["bigrams", "probability", "nested-dict", "conditional", "nlp"]
prerequisites: ["module-02-tokenization-frequency"]
icon: "🔗"
---

## Why This Matters

A unigram model just counts word frequencies, "the" appears 100 times, "cat" appears 5 times. But this tells us nothing about word ORDER. If you know that "the" appears frequently, that's useful, but it doesn't tell you what comes AFTER "the". Bigrams capture transitions: what word follows "the"? This is the foundation of all sequential language models.

Think about how you read this sentence: you don't process each word in isolation. Your brain predicts what's coming next based on what you just read. After seeing "the", you expect a noun, "cat", "dog", "house". After "I love", you expect an object. Bigrams formalize this intuition: they count how often word B follows word A across the entire corpus. From these counts, you derive probabilities, "given that the current word is 'the', there's a 40% chance the next word is 'cat', a 20% chance it's 'dog', and so on."

This is the conceptual leap from counting to predicting. Frequency counting tells you what words exist. Bigram tables tell you how words connect. Without this transition information, you can't generate coherent text, you'd just be pulling random words from the vocabulary with no regard for whether they make sense together. Bigrams are the simplest model that captures word-to-word relationships, and the same principle scales up to trigrams, n-grams, and even the attention mechanisms in modern transformers.

## What You'll Learn

- Understand what a bigram model captures about word sequences
- Build a nested dict `bigrams = {"the": {"cat": 3, "dog": 1}, ...}` from a token list
- Normalize raw counts into probabilities by dividing by total followers per word
- Handle edge cases: words that never appear as followers, single-word corpora, and end-of-sequence tokens
- Recognize how bigram models relate to more advanced n-gram and neural language models

## The Derivation

**The problem:** You have a list of tokens and you want to know which words tend to follow each other. You need to go from a flat list of words to a structured representation of word transitions.

**The naive approach:** You might iterate through the token list and manually check every pair: for each position `i`, look at `tokens[i]` and `tokens[i+1]`. Count how many times each pair appears. This works, but how do you store the result? A list of all pairs explodes combinatorially. A flat dictionary with tuple keys like `("the", "cat"): 3` is hard to query, you can't easily ask "what are ALL the words that follow 'the'?"

**The solution:** A nested dictionary. The outer dictionary maps each word to an inner dictionary. The inner dictionary maps each follower-word to its count. So `bigrams["the"]["cat"]` gives you the count of how often "cat" follows "the". This structure is natural for conditional lookups, you ask "given word X, what are its followers?" in O(1) time.

**How it works:** Walk through the token list once. For each position `i` from 0 to `len(tokens) - 2`, take the pair `(tokens[i], tokens[i+1])`. If `tokens[i]` isn't in the outer dict yet, create it. Then increment `bigrams[tokens[i]][tokens[i+1]]`. After counting, normalize: for each word, divide every follower count by the total count for that word, producing a probability distribution that sums to 1.0. This normalized table is the engine behind text generation, when you need to pick "the next word after X", you sample from this distribution.

## Gamification

- **XP Reward**: +60 XP per lesson completed (120 XP total for this module)
- **Challenges**: Each lesson has interactive challenges, build bigram tables, normalize counts, verify probability sums
- **Progress**: Complete both lessons to finish this module
- **Streak Bonus**: +15 XP extra per day once your streak passes 3 days
- **PBL Milestone**: Your bigram table is the brain of the text generator you'll build in Module 4

## Projects You Can Build

After completing this module, you'll be ready to tackle these real projects:

- 🤖 **AI Story Writer**, bigram tables drive the word-by-word text generation
- 💬 **Chatbot Builder**, transition probabilities help chatbots produce coherent responses
- 📝 **AI Tutor**, bigram analysis identifies common grammar patterns for teaching
- 🔍 **Semantic Search Engine**, word co-occurrence and transitions improve relevance ranking
- 📰 **Newsletter Builder**, bigram models help generate natural-sounding summaries

## Lessons

1. **Building Bigram Tables**, count consecutive word pairs into a nested dictionary
2. **Normalizing Bigram Counts**, convert raw counts to probability distributions
