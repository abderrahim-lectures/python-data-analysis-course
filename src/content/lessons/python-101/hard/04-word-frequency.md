---


title: "Word Frequency Counting"
description: "Tally tokens into a frequency dict, extract vocabulary stats, and identify the most and least common words."
module: "tokenization-frequency"
order: 4
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Build a word_frequency(tokens) function that counts token occurrences in a dict"
  - "Use dict.get() or collections.defaultdict for safe counting"
  - "Extract vocabulary stats: total tokens, unique words, top-N most frequent"
  - "Understand Zipf's law and why a few words dominate frequency counts"
prerequisites: ["03-tokenization-basics"]
tags: ["python", "frequency", "dict", "vocabulary", "nlp"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "According to Zipfs law, the most frequent word in English text typically appears:"
    options:
      - text: "10% of the time"
      - text: "About 7% of the time"
        correct: true
      - text: "50% of the time"
      - text: "1% of the time"
  - question: "What is the purpose of sorting word counts in descending order?"
    options:
      - text: "To remove duplicates"
      - text: "To see the most frequent words first"
        correct: true
      - text: "To count total words"
      - text: "To calculate average word length"
  - question: "If word A appears 1000 times and word B appears 500 times, what is their frequency ratio?"
    options:
      - text: "1:2"
      - text: "2:1"
        correct: true
      - text: "1:1"
      - text: "1000:500"
---
Counting words

Once you have tokens, the next step is counting how often each word appears. These frequency counts tell the language model which words are common (likely to appear anywhere) and which are rare (predictive when they do appear).

## Key Concepts

### Building a frequency dict

The counting pattern uses a dict where each key is a word and the value is its count. The `get()` method handles the "first time we see this word" case:

```python
def word_frequency(tokens):
    freq = {}
    for token in tokens:
        freq[token] = freq.get(token, 0) + 1
    return freq

tokens = ["the", "cat", "sat", "the", "dog", "sat", "the"]
freq = word_frequency(tokens)
print(freq)
# {'the': 3, 'cat': 1, 'sat': 2, 'dog': 1}
```

`freq.get(token, 0)` returns the current count if the word exists, or `0` if it's the first time we've seen it. Adding 1 increments the count.

### The defaultdict approach

An alternative uses `collections.defaultdict`, which automatically creates missing keys:

```python
from collections import defaultdict

def word_frequency(tokens):
    freq = defaultdict(int)
    for token in tokens:
        freq[token] += 1
    return dict(freq)
```

Both approaches produce the same result. The `defaultdict` version is slightly cleaner but requires an import.

### Vocabulary statistics

With a frequency dict, you can compute useful stats:

```python
freq = word_frequency(tokenize(full_text))

total_tokens = sum(freq.values())
unique_words = len(freq)

print(f"Total tokens: {total_tokens:,}")
print(f"Unique words: {unique_words:,}")
print(f"Vocabulary richness: {unique_words / total_tokens:.4f}")
```

**Vocabulary richness** (unique / total) measures how diverse the text is. A value close to 1.0 means almost every word is unique; a value close to 0.0 means heavy repetition.

### Most and least frequent words

Sort the frequency dict to find the extremes:

```python
sorted_words = sorted(freq.items(), key=lambda item: item[1], reverse=True)

print("Top 10 words:")
for word, count in sorted_words[:10]:
    print(f"  {word}: {count}")

print("\nBottom 10 words:")
for word, count in sorted_words[-10:]:
    print(f"  {word}: {count}")
```

In most English text, "the", "of", "and", "to", and "a" dominate the top of the list. This follows **Zipf's law** — the most frequent word appears roughly twice as often as the second, three times as often as the third, and so on.

### Why frequency matters for generation

A language model uses frequency to weight predictions. If "the" appears 500 times and "platypus" appears 2 times, "the" should be chosen more often — but not always. The bigram model refines this by conditioning on the previous word, which is what makes generated text readable rather than just a stream of "the the the."

## Try It

Load the corpus, tokenize it, and build a frequency dict. Then answer:
1. How many total tokens are there?
2. What are the top 5 most frequent words?
3. What percentage of the vocabulary consists of words that appear only once?

```python
texts = load_corpus("slm-corpus.csv")
full_text = " ".join(texts)
tokens = tokenize(full_text)
freq = word_frequency(tokens)

total = sum(freq.values())
hapax = sum(1 for w, c in freq.items() if c == 1)
print(f"Total tokens: {total}")
print(f"Words appearing once: {hapax} ({hapax/len(freq)*100:.1f}%)")
```

## Key Takeaways

- `dict.get(key, default)` is the foundation of frequency counting
- Vocabulary richness (unique / total) measures text diversity
- Zipf's law: a small number of words dominate the frequency distribution
- Frequency counts are the raw material for bigram probability tables

## Practice Challenge

Write a function `top_n(freq, n)` that returns the top N most frequent words as a list of `(word, count)` tuples. Then use it to find the top 20 words in the corpus.

```python
def top_n(freq, n):
    return sorted(freq.items(), key=lambda item: item[1], reverse=True)[:n]
```

## Projects You Can Build

Here are a few real-world projects that reinforce these concepts:

- 🎨 **AI Story Writer** - Analyze word frequencies to guide text generation and style matching
- 🤖 **Chatbot Builder** - Use word frequency to prioritize common responses and keywords
- 📝 **Sentiment Dashboard** - Compute word frequencies for keyword-based sentiment analysis
