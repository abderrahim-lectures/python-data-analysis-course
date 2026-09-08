---

title: "Sampling the Next Word"
description: "Use random.choices() to pick the next word from a probability distribution weighted by bigram probabilities."
module: "generate-text"
order: 7
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Use random.choices(population, weights) to perform weighted random selection"
  - "Understand how weights influence the probability of each outcome"
  - "Set a random seed for reproducible results"
  - "Sample from a bigram table to pick the next word given a current word"
prerequisites: ["06-normalizing-bigrams"]
tags: ["python", "random", "sampling", "weighted", "nlp"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "What does random.choices() do for word sampling?"
    options:
      - text: "Picks one word at random"
      - text: "Selects a word weighted by probability"
        correct: true
      - text: "Sorts words by frequency"
      - text: "Removes duplicate words"
  - question: "Why use weights instead of equal probabilities for sampling?"
    options:
      - text: "It runs faster"
      - text: "More frequent words should be more likely to be chosen"
        correct: true
      - text: "It uses less memory"
      - text: "It makes the output shorter"
  - question: "What happens if you sample with weights=[0.5, 0.3, 0.2]?"
    options:
      - text: "Each word has equal chance"
      - text: "First word has 50% chance, second 30%, third 20%"
        correct: true
      - text: "Words are sorted by weight"
      - text: "Only the first word is ever chosen"
---
The engine of text generation

Text generation is, at its core, a sampling problem. Given a current word, you need to pick the next word from a distribution of possibilities — some words are likely, others are rare, but all are possible. `random.choices()` does exactly this.

## Key Concepts

### random.choices() basics

`random.choices()` picks one or more items from a list, weighted by their probabilities:

```python
import random

words = ["cat", "dog", "bird"]
weights = [0.5, 0.3, 0.2]  # probabilities must sum to 1

# Pick one word
result = random.choices(words, weights=weights, k=1)
print(result[0])  # e.g. 'cat'
```

The `k` parameter controls how many items to pick. For text generation, you pick one word at a time.

### Repeated sampling

To see the distribution in action, sample many times:

```python
import random

words = ["cat", "dog", "bird"]
weights = [0.5, 0.3, 0.2]

counts = {w: 0 for w in words}
for _ in range(1000):
    pick = random.choices(words, weights=weights, k=1)[0]
    counts[pick] += 1

print(counts)
# e.g. {'cat': 502, 'dog': 298, 'bird': 200}
```

With 1000 samples, "cat" should appear roughly 500 times (50%), "dog" about 300 times (30%), and "bird" about 200 times (20%).

### Sampling from the bigram model

Given a current word, look up its followers in the normalized model and sample:

```python
def sample_next(model, current_word):
    if current_word not in model:
        return None  # no followers known
    followers = model[current_word]
    words = list(followers.keys())
    weights = list(followers.values())
    return random.choices(words, weights=weights, k=1)[0]

# Example
current = "the"
next_word = sample_next(model, current)
print(f"After '{current}' comes '{next_word}'")
```

If the current word isn't in the model (it has no known followers), return `None`. The caller needs to handle this — either stop generation or pick a random word to continue.

### Reproducibility with seeds

`random.choices()` uses Python's global random state. Setting a seed makes the output reproducible — useful for debugging and testing:

```python
random.seed(42)
print(sample_next(model, "the"))  # always the same word with seed 42

random.seed(99)
print(sample_next(model, "the"))  # might be different
```

### Handling the edge case: no followers

Some words appear only at the end of the corpus and have no known followers. When `sample_next` returns `None`, you have options:

1. **Stop generation** — the most conservative choice
2. **Restart from a random word** — keeps the output going
3. **Restart from a common word** — pick from the top-N most frequent words

Option 3 usually produces the best results:

```python
import random

top_words = ["the", "and", "to", "of", "a"]

def sample_next_or_restart(model, current_word):
    result = sample_next(model, current_word)
    if result is None:
        return random.choice(top_words)  # restart
    return result
```

## Try It

Load the normalized bigram model and sample the next word 10 times after "the":

```python
random.seed(42)
model = load_model("bigram_model.json")  # from previous lesson

for _ in range(10):
    next_word = sample_next(model, "the")
    print(f"the → {next_word}")
```

How consistent are the results? Try changing the seed — do you get different words?

## Key Takeaways

- `random.choices(population, weights, k=1)` performs weighted random selection
- Weights should sum to 1.0 for correct probability interpretation
- `random.seed()` makes output reproducible for debugging
- Handle missing followers by restarting from a common word

## Practice Challenge

Write a function `sample_n(model, word, n)` that returns a list of n sampled next-words for a given current word. Use it to see the distribution of followers for "the":

```python
def sample_n(model, word, n=100):
    results = []
    for _ in range(n):
        results.append(sample_next(model, word))
    from collections import Counter
    return Counter(results).most_common()
```
