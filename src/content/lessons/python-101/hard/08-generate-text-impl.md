---

title: "Implementing generate_text()"
description: "Chain the sampling loop into a complete function that builds a sequence of words from the bigram model."
module: "generate-text"
order: 8
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Write a generate_text(bigrams, start_word, length) function"
  - "Chain sample_next() calls in a loop to build word sequences"
  - "Handle dead ends (no known followers) gracefully"
  - "Control output length and debug generation with logging"
prerequisites: ["07-sampling-next-word"]
tags: ["python", "function", "text-generation", "loop", "nlp"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "What is the core loop of text generation?"
    options:
      - text: "Read the entire file at once"
      - text: "Look up bigrams for the current word, sample next word, repeat"
        correct: true
      - text: "Randomly pick any word from the vocabulary"
      - text: "Sort all words alphabetically"
  - question: "How does the generator know which words can follow the current word?"
    options:
      - text: "It guesses based on word length"
      - text: "It looks up the bigram table for the current word"
        correct: true
      - text: "It always picks the most frequent word"
      - text: "It reads from the original file each time"
  - question: "What limits the generated text length?"
    options:
      - text: "A fixed number of words (num_words)"
        correct: true
      - text: "The file size"
      - text: "Python's recursion limit"
      - text: "The number of unique words"
---
Putting it all together

You can load data, tokenize, count words, build bigrams, normalize probabilities, and sample the next word. Now you combine these into a single function that generates text: pick a starting word, sample the next word, feed it back in, and repeat until you've produced enough words.

The cells below reuse the `load_corpus`, `tokenize`, `build_bigrams`, and `normalize_bigrams` helpers from lessons 01–06 and the `sample_next` helper from lesson 07. Every lesson page starts with a fresh Python session, so run this setup cell first:

```python
import csv
import string
import random
from collections import defaultdict

with open("slm-corpus.csv", newline="") as f:
    reader = csv.DictReader(f)
    texts = [row["text"] for row in reader]

def load_corpus(path):
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        return [row["text"] for row in reader]

def tokenize(text):
    text = text.lower()
    for char in string.punctuation:
        text = text.replace(char, " ")
    return text.split()

def build_bigrams(tokens):
    bigrams = defaultdict(lambda: defaultdict(int))
    for i in range(len(tokens) - 1):
        bigrams[tokens[i]][tokens[i + 1]] += 1
    return dict(bigrams)

def normalize_bigrams(bigrams):
    normalized = {}
    for word, followers in bigrams.items():
        if not followers:
            continue
        total = sum(followers.values())
        normalized[word] = {w: c / total for w, c in followers.items()}
    return normalized

def sample_next(model, current_word):
    if current_word not in model:
        return None
    followers = model[current_word]
    words = list(followers.keys())
    weights = list(followers.values())
    return random.choices(words, weights=weights, k=1)[0]

model = normalize_bigrams(build_bigrams(tokenize(" ".join(texts))))
```

## Key Concepts

### The generation loop

The core logic is a simple loop:

```python
import random

def generate_text(model, start_word, length=20):
    word = start_word
    result = [word]

    for _ in range(length - 1):
        next_word = sample_next(model, word)
        if next_word is None:
            break  # dead end
        result.append(next_word)
        word = next_word

    return " ".join(result)
```

Start with `start_word`, sample the next word, append it to the result, and set it as the new current word. Repeat `length - 1` times (the first word is already in the list).

### Handling dead ends

When `sample_next()` returns `None` (the current word has no known followers), you have three options. The simplest is to stop:

```python
import random
random.seed(7)

word = "the"
result = [word]
for _ in range(10):
    next_word = sample_next(model, word)
    if next_word is None:
        break  # dead end — stop
    result.append(next_word)
    word = next_word

print(" ".join(result))
```

This produces shorter output but is guaranteed to be correct. For longer output, restart from a common word:

```python
import random
random.seed(7)

word = "the"
result = [word]
for _ in range(10):
    next_word = sample_next(model, word)
    if next_word is None:
        next_word = random.choice(["the", "and", "to", "of", "a"])  # restart
    result.append(next_word)
    word = next_word

print(" ".join(result))
```

### Choosing a starting word

The starting word shapes the output dramatically. Starting with "the" produces generic English; starting with a rare word might produce unusual output:

```python
def generate_from_random(model, length=20):
    start = random.choice(list(model.keys()))
    return generate_text(model, start, length)
```

For more control, let the user specify the starting word.

### Testing with a fixed seed

Debugging generation requires reproducible output. Set the seed before calling:

```python
random.seed(42)
print(generate_text(model, "the", length=10))
# Always produces the same output with seed 42
```

### A more robust version

Add logging to trace what's happening:

```python
def generate_text(model, start_word, length=20, verbose=False):
    word = start_word
    result = [word]

    for i in range(length - 1):
        next_word = sample_next(model, word)
        if verbose:
            print(f"  Step {i+1}: '{word}' → '{next_word}'")
        if next_word is None:
            if verbose:
                print(f"  Dead end at step {i+1}")
            break
        result.append(next_word)
        word = next_word

    return " ".join(result)
```

With `verbose=True`, you can watch the generation step by step.

### What the output looks like

Running on the corpus:

```python
random.seed(123)
text = generate_text(model, "the", length=15)
print(text)
```

Might produce something like:

```
the old man had been a good teacher and he had a
```

The output won't be grammatically perfect, this is a tiny model with only bigram context. But it captures real English word sequences because the bigram probabilities come from actual text.

## Try It

Generate 5 different texts of length 20, each starting with a different word:

```python
random.seed(42)
starts = ["the", "a", "he", "she", "it"]
for word in starts:
    text = generate_text(model, word, length=20)
    print(f"\n[{word}] {text}")
```

## Key Takeaways

- `generate_text()` chains `sample_next()` calls in a loop to build word sequences
- Dead ends occur when a word has no known followers, handle by stopping or restarting
- Starting word selection dramatically affects output quality
- Use `random.seed()` and `verbose=True` for debugging

## Practice Challenge

Write `generate_until(model, start_word, stop_words)` that generates text until it hits a word in `stop_words` or reaches 50 words. Use it to generate text that stops at sentence-ending words:

```python
def generate_until(model, start_word, stop_words=None, max_length=50):
    if stop_words is None:
        stop_words = set()
    word = start_word
    result = [word]
    for _ in range(max_length - 1):
        next_word = sample_next(model, word)
        if next_word is None or next_word in stop_words:
            break
        result.append(next_word)
        word = next_word
    return " ".join(result)
```
