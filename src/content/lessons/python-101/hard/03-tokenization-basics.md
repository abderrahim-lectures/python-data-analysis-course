---

title: "Tokenization Basics"
description: "Build a tokenize() function that splits raw text into clean word tokens using only string methods."
module: "tokenization-frequency"
order: 3
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Write a tokenize(text) function using str.lower(), str.split(), and str.strip()"
  - "Remove punctuation from text before splitting"
  - "Understand why tokenization decisions affect model output"
  - "Compare different tokenization strategies and their trade-offs"
prerequisites: ["02-exploring-corpus"]
tags: ["python", "tokenization", "string-methods", "nlp"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "What does text.lower().split() do?"
    options:
      - text: "Splits on punctuation then lowercases"
      - text: "Lowercases then splits on whitespace"
        correct: true
      - text: "Splits on whitespace then removes punctuation"
      - text: "Lowercases and removes all non-alpha characters"
  - question: "Why do we replace punctuation with spaces instead of just deleting it?"
    options:
      - text: "It is faster"
      - text: "Deleting would join adjacent words together"
        correct: true
      - text: "Spaces are needed for split() to work"
      - text: "It preserves the original text length"
  - question: "What token does the string cant produce with our tokenize() function?"
    options:
      - text: "cant"
      - text: "cant"
      - text: "can, t"
        correct: true
      - text: "can, t"
---
From raw text to tokens

Raw text is just a string of characters. To build a language model, you need to split it into discrete units — **tokens** — that the model can count and predict. For simplicity, we'll use words as tokens. More advanced models use subword tokens (BPE, SentencePiece), but word-level tokenization is enough to demonstrate the core ideas.

## Key Concepts

### The simplest tokenizer

The most basic approach is `str.split()`:

```python
text = "The cat sat on the mat"
tokens = text.split()
print(tokens)  # ['The', 'cat', 'sat', 'on', 'the', 'mat']
```

This works, but notice: "The" and "the" are treated as different tokens because of capitalization. For a frequency-based model, we want them counted as the same word.

### Lowercasing

Converting everything to lowercase merges case variants:

```python
text = "The cat sat on the Mat"
tokens = text.lower().split()
print(tokens)  # ['the', 'cat', 'sat', 'on', 'the', 'mat']
```

Now "The" and "mat" map to the same tokens as "the" and "Mat" elsewhere in the corpus.

### Stripping punctuation

Punctuation attached to words creates false tokens — "hello," and "hello" become different words. Strip it before splitting:

```python
import string

def strip_punctuation(text):
    for char in string.punctuation:
        text = text.replace(char, " ")
    return text

text = "Hello, world! How's it going?"
clean = strip_punctuation(text)
print(clean.lower().split())
# ['hello', 'world', 'how', 's', 'it', 'going']
```

Each punctuation character is replaced with a space, then splitting gives clean tokens. Note that "How's" becomes two tokens: "how" and "s". This is a known trade-off of simple tokenization — more advanced tools handle contractions differently.

### Combining into a tokenize() function

Put it all together:

```python
import string

def tokenize(text):
    text = text.lower()
    for char in string.punctuation:
        text = text.replace(char, " ")
    return text.split()

# Test it
sample = "The quick brown fox jumps over the lazy dog."
print(tokenize(sample))
# ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'the', 'lazy', 'dog']
```

This function does three things in sequence: lowercase, strip punctuation, split on whitespace. It's simple, fast, and sufficient for a tiny language model.

### Why tokenization matters

Different tokenization strategies produce different vocabularies and different model behavior:

| Input | Split result | Lowercase result |
|-------|-------------|-----------------|
| "New York" | ["New", "York"] | ["new", "york"] |
| "can't" | ["can't"] | ["can't"] |
| "hello,world" | ["hello,world"] | ["hello,world"] |

The last example shows a problem: without stripping punctuation first, "hello,world" stays as one token. Our `strip_punctuation` step handles this. There's no single "right" tokenization — it depends on what your model needs to learn.

## Try It

Tokenize the following text and count the resulting tokens:

```python
text = "To be, or not to be, that is the question. To be is to exist."
tokens = tokenize(text)
print(f"Tokens: {tokens}")
print(f"Count: {len(tokens)}")
```

How many unique tokens do you get? Which word appears most often?

## Key Takeaways

- `str.split()` splits on whitespace — the simplest tokenizer
- Lowercasing merges case variants so "The" and "the" count as one token
- Punctuation stripping prevents tokens like "hello," and "hello" from being different
- Tokenization is a design choice — there's no single right answer for all models

## Practice Challenge

Extend `tokenize()` to also remove numeric tokens (words that are only digits). Write a test:

```python
import string

def tokenize(text):
    text = text.lower()
    for char in string.punctuation:
        text = text.replace(char, " ")
    tokens = text.split()
    return [t for t in tokens if not t.isdigit()]

sample = "I have 3 cats and 2 dogs in year 2024"
print(tokenize(sample))
# ['i', 'have', 'cats', 'and', 'dogs', 'in', 'year']
```
