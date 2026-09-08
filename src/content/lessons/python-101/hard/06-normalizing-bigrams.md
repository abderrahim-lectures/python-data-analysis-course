---

title: "Normalizing Bigram Counts"
description: "Convert raw bigram counts into probability distributions that sum to 1.0 for each word."
module: "bigram-tables"
order: 6
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Normalize raw bigram counts into probabilities by dividing by total followers"
  - "Understand why probability distributions are needed for weighted sampling"
  - "Handle edge cases: zero counts, single-follower words, missing keys"
  - "Verify that probabilities sum to 1.0 for each word"
prerequisites: ["05-building-bigrams"]
tags: ["python", "probability", "normalization", "bigrams", "nlp"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "Why normalize bigram counts?"
    options:
      - text: "To make them look like percentages"
      - text: "To compare probabilities across different contexts"
        correct: true
      - text: "To reduce memory usage"
      - text: "To sort them alphabetically"
  - question: "What is P(word2 | word1) for a bigram?"
    options:
      - text: "count(word1, word2) / count(word1)"
        correct: true
      - text: "count(word1) / count(word2)"
      - text: "count(word1, word2) / total_words"
      - text: "count(word1) * count(word2)"
  - question: "If the appears 1000 times and (the, cat) appears 50 times, what is P(cat | the)?"
    options:
      - text: "0.05"
        correct: true
      - text: "0.5"
      - text: "50"
      - text: "0.005"
---
From counts to probabilities

Raw counts tell you that "the" → "cat" appeared 15 times and "the" → "dog" appeared 5 times. But to **sample** the next word, you need probabilities: "cat" should be chosen 75% of the time and "dog" 25%. Normalizing converts counts into a distribution where all followers sum to 1.0.

## Key Concepts

### Normalizing with a loop

For each word, sum its follower counts, then divide each count by that total:

```python
def normalize_bigrams(bigrams):
    normalized = {}
    for word, followers in bigrams.items():
        total = sum(followers.values())
        normalized[word] = {w: c / total for w, c in followers.items()}
    return normalized
```

Now `normalized["the"]["cat"]` returns a float between 0 and 1 — the probability that "cat" follows "the."

### Example

```python
raw_bigrams = {"the": {"cat": 15, "dog": 5, "bird": 10}}
norm = normalize_bigrams(raw_bigrams)

print(norm["the"])
# {'cat': 0.5, 'dog': 0.1667, 'bird': 0.3333}
```

The probabilities sum to 1.0:
```python
print(sum(norm["the"].values()))  # 1.0
```

### Why normalization matters for sampling

`random.choices()` needs weights that represent relative likelihood. If you pass raw counts (15, 5, 10), it works — but having proper probabilities (0.5, 0.167, 0.333) makes the model portable and comparable across different corpus sizes.

```python
import random

followers = list(norm["the"].keys())
weights = list(norm["the"].values())
next_word = random.choices(followers, weights=weights, k=1)[0]
print(f"Next word: {next_word}")
```

### Handling edge cases

Some words have no followers (the last word in the corpus, or words that only appear at the end of a sentence). The bigram table won't have entries for them:

```python
def normalize_bigrams(bigrams):
    normalized = {}
    for word, followers in bigrams.items():
        if not followers:
            continue  # skip words with no followers
        total = sum(followers.values())
        normalized[word] = {w: c / total for w, c in followers.items()}
    return normalized
```

Skipping empty entries prevents division-by-zero errors.

### A complete pipeline

Here's how normalization fits into the full pipeline:

```python
texts = load_corpus("slm-corpus.csv")
tokens = tokenize(" ".join(texts))
bigrams = build_bigrams(tokens)
model = normalize_bigrams(bigrams)

# Check a sample
print(f"Words in model: {len(model)}")
print(f"Followers of 'the': {list(model.get('the', {}).keys())[:5]}")
```

### Saving the model

You might want to save the normalized bigram table for reuse. Since it's a nested dict of floats, `json` works well:

```python
import json

with open("bigram_model.json", "w") as f:
    json.dump(model, f)

# Reload later
with open("bigram_model.json") as f:
    model = json.load(f)
```

## Try It

Build and normalize the bigram table, then verify:
1. Do the probabilities for "the" sum to 1.0?
2. How many words have zero followers?
3. What's the most likely word to follow "the"?

```python
model = normalize_bigrams(bigrams)
the_followers = model.get("the", {})
top_follower = max(the_followers, key=the_followers.get)
print(f"Most likely after 'the': '{top_follower}' ({the_followers[top_follower]:.3f})")
```

## Key Takeaways

- Normalization converts raw counts to probabilities that sum to 1.0 per word
- `random.choices()` uses these probabilities as weights for weighted sampling
- Skip words with no followers to avoid division by zero
- Save normalized models with `json.dump()` for reuse across scripts

## Practice Challenge

Write a function `bigram_stats(model)` that prints for each word: the word, number of followers, and the most probable next word. Limit output to the top 10 words by total follower count.

```python
def bigram_stats(model, top_n=10):
    words = sorted(model, key=lambda w: sum(model[w].values()), reverse=True)
    for word in words[:top_n]:
        followers = model[word]
        total = sum(followers.values())
        best = max(followers, key=followers.get)
        print(f"'{word}': {len(followers)} followers, best=''{best}'' ({followers[best]:.3f})")
```
