---

title: "Building Bigram Tables"
description: "Count consecutive word pairs into a nested dictionary that maps each word to its follower distribution."
module: "bigram-tables"
order: 5
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Understand what a bigram captures about word-to-word transitions"
  - "Build a nested dict bigrams = {'the': {'cat': 3, 'dog': 1}, ...} from a token list"
  - "Handle sentence boundaries and unknown starting words"
  - "Inspect the bigram table to verify correctness"
prerequisites: ["04-word-frequency"]
tags: ["python", "bigrams", "nested-dict", "transitions", "nlp"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "What is a bigram?"
    options:
      - text: "A word with two syllables"
      - text: "A pair of consecutive words"
        correct: true
      - text: "A two-letter word"
      - text: "A word that appears twice"
  - question: "How do you create bigrams from a list of tokens?"
    options:
      - text: "tokens[0:2]"
      - text: "zip(tokens, tokens[1:])"
        correct: true
      - text: "tokens * 2"
      - text: "tokens.split()"
  - question: "If tokens = the, cat, sat, what bigrams do you get?"
    options:
      - text: "the, cat, sat"
      - text: "(the, cat), (cat, sat)"
        correct: true
      - text: "(the, the), (cat, cat), (sat, sat)"
      - text: "(the, cat, sat)"
---
From word counts to word transitions

Word frequency tells you *what* words appear. Bigrams tell you *what follows what*. "The cat" is far more common than "the refrigerator" — a bigram table captures that relationship. It's the simplest form of a language model: given a word, what words tend to come next?

## Key Concepts

### What is a bigram?

A bigram is a pair of consecutive words. In the sentence "the cat sat on the mat", the bigrams are:

```
(the, cat), (cat, sat), (sat, on), (on, the), (the, mat)
```

Each pair represents a transition from one word to the next. By counting all transitions in the corpus, you build a statistical model of word sequences.

### Building the nested dict

The bigram table is a dict of dicts. The outer key is the current word; the inner dict maps follower-words to their counts:

```python
def build_bigrams(tokens):
    bigrams = {}
    for i in range(len(tokens) - 1):
        current = tokens[i]
        next_word = tokens[i + 1]
        if current not in bigrams:
            bigrams[current] = {}
        bigrams[current][next_word] = bigrams[current].get(next_word, 0) + 1
    return bigrams
```

Walk through the token list with a sliding window of size 2. For each pair `(tokens[i], tokens[i+1])`, increment the count in `bigrams[tokens[i]][tokens[i+1]]`.

### Example walk-through

For tokens `["the", "cat", "sat", "the", "dog"]`:

```
i=0: current="the", next="cat" → bigrams["the"]["cat"] = 1
i=1: current="cat", next="sat" → bigrams["cat"]["sat"] = 1
i=2: current="sat", next="the" → bigrams["sat"]["the"] = 1
i=3: current="the", next="dog" → bigrams["the"]["dog"] = 1
```

Result:
```python
{
    "the": {"cat": 1, "dog": 1},
    "cat": {"sat": 1},
    "sat": {"the": 1},
}
```

### Using defaultdict for cleaner code

```python
from collections import defaultdict

def build_bigrams(tokens):
    bigrams = defaultdict(lambda: defaultdict(int))
    for i in range(len(tokens) - 1):
        bigrams[tokens[i]][tokens[i + 1]] += 1
    return dict(bigrams)
```

The `lambda: defaultdict(int)` creates a new inner dict automatically for each new word, so you never need to check if a key exists.

### Inspecting the bigram table

Verify your table looks reasonable:

```python
bigrams = build_bigrams(tokens)

# How many words have followers?
print(f"Words with followers: {len(bigrams)}")

# Show the top word's followers
top_word = max(bigrams, key=lambda w: sum(bigrams[w].values()))
print(f"Most connected word: '{top_word}'")
print(f"  Followers: {bigrams[top_word]}")
```

### Sentence boundaries

When building bigrams from multiple sentences, the last word of one sentence and the first word of the next become a bigram. This is usually fine for a small model — the model doesn't know about sentence structure anyway. But if you want cleaner results, you can add sentence boundary markers:

```python
def build_bigrams(tokens, add_boundaries=True):
    bigrams = defaultdict(lambda: defaultdict(int))
    for i in range(len(tokens) - 1):
        bigrams[tokens[i]][tokens[i + 1]] += 1
    if add_boundaries:
        bigrams["<END>"] = defaultdict(int)
        bigrams[tokens[-1]]["<END>"] = bigrams[tokens[-1]].get("<END>", 0) + 1
    return dict(bigrams)
```

This lets you track which words commonly end sentences.

## Try It

Build a bigram table from the corpus and answer:
1. How many unique bigram pairs exist?
2. What are the top 3 most common (word, follower) pairs?
3. Does "the" have more followers than any other word?

```python
from collections import defaultdict

texts = load_corpus("slm-corpus.csv")
tokens = tokenize(" ".join(texts))
bigrams = build_bigrams(tokens)

total_pairs = sum(sum(f.values()) for f in bigrams.values())
print(f"Unique bigram pairs: {total_pairs}")
```

## Key Takeaways

- A bigram is a pair of consecutive words — the simplest sequence model
- The bigram table is a nested dict: `bigrams[word] = {follower: count}`
- `defaultdict(lambda: defaultdict(int))` simplifies nested counting
- Sentence boundaries can be tracked with special tokens like `<END>`

## Practice Challenge

Write a function `most_common_bigram(bigrams)` that returns the single most frequent `(word, follower)` pair as a tuple. Then use it to find the most common bigram in the corpus.

```python
def most_common_bigram(bigrams):
    best = (None, None)
    best_count = 0
    for word, followers in bigrams.items():
        for follower, count in followers.items():
            if count > best_count:
                best = (word, follower)
                best_count = count
    return best, best_count
```
