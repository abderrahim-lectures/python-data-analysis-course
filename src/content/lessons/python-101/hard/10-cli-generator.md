---

title: "CLI Text Generator"
description: "Wire all pipeline stages into a single command-line script with argparse for user-friendly text generation."
module: "cli-text-generator"
order: 10
difficulty: "advanced"
estimatedMinutes: 25
learningObjectives:
  - "Integrate load → tokenize → count → bigrams → normalize → generate into one script"
  - "Use argparse to accept command-line arguments for word count, start word, and temperature"
  - "Build a complete end-to-end pipeline that runs from the terminal"
  - "Test the full system and produce plausible English text"
prerequisites: ["09-temperature-tuning"]
tags: ["python", "cli", "argparse", "pipeline", "final-project"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "python-101"
track: "hard"
quiz:
  - question: "What Python module is used for command-line argument parsing?"
    options:
      - text: "os"
      - text: "argparse"
        correct: true
      - text: "sys"
      - text: "cli"
  - question: "What does argparse.ArgumentParser() create?"
    options:
      - text: "A file handle"
      - text: "A parser that can read command-line arguments"
        correct: true
      - text: "A network connection"
      - text: "A database connection"
  - question: "How do you access a parsed argument named --words?"
    options:
      - text: "args['words']"
      - text: "args.words"
        correct: true
      - text: "args.getWords()"
      - text: "argparse.words"
---
The final assembly

Every piece is built and tested individually. Now you wire them into a single script that a user can run from the command line. This is the culmination of the entire project — a tiny language model that reads a CSV corpus and generates new text.

## Key Concepts

### The complete pipeline

Here's the full integration in one function:

```python
import csv
import string
import random
import json
from collections import defaultdict

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

def apply_temperature(probs, temperature):
    import math
    log_probs = [math.log(p + 1e-10) for p in probs]
    scaled = [lp / temperature for lp in log_probs]
    max_s = max(scaled)
    exp_s = [math.exp(s - max_s) for s in scaled]
    total = sum(exp_s)
    return [e / total for e in exp_s]

def sample_next(model, current_word, temperature=1.0):
    if current_word not in model:
        return None
    followers = model[current_word]
    words = list(followers.keys())
    probs = list(followers.values())
    if temperature != 1.0:
        probs = apply_temperature(probs, temperature)
    return random.choices(words, weights=probs, k=1)[0]

def generate_text(model, start_word, length=20, temperature=1.0):
    word = start_word
    result = [word]
    for _ in range(length - 1):
        next_word = sample_next(model, word, temperature)
        if next_word is None:
            next_word = random.choice(["the", "and", "to", "of", "a"])
        result.append(next_word)
        word = next_word
    return " ".join(result)
```

### Adding argparse

`argparse` parses command-line arguments so users can control the output:

```python
import argparse

def main():
    parser = argparse.ArgumentParser(description="Tiny Language Model Text Generator")
    parser.add_argument("--corpus", default="slm-corpus.csv", help="Path to CSV corpus")
    parser.add_argument("--start", default="the", help="Starting word")
    parser.add_argument("--words", type=int, default=20, help="Number of words to generate")
    parser.add_argument("--temperature", type=float, default=1.0, help="Temperature (0.1-2.0)")
    parser.add_argument("--seed", type=int, default=None, help="Random seed for reproducibility")
    parser.add_argument("--model", default=None, help="Path to save/load JSON model")

    args = parser.parse_args()

    if args.seed is not None:
        random.seed(args.seed)

    # Load or build model
    if args.model:
        try:
            with open(args.model) as f:
                model = json.load(f)
            print(f"Loaded model from {args.model}")
        except FileNotFoundError:
            print(f"Model not found, building from {args.corpus}...")
            texts = load_corpus(args.corpus)
            tokens = tokenize(" ".join(texts))
            bigrams = build_bigrams(tokens)
            model = normalize_bigrams(bigrams)
            with open(args.model, "w") as f:
                json.dump(model, f)
            print(f"Model saved to {args.model}")
    else:
        texts = load_corpus(args.corpus)
        tokens = tokenize(" ".join(texts))
        bigrams = build_bigrams(tokens)
        model = normalize_bigrams(bigrams)

    # Generate
    output = generate_text(model, args.start, args.words, args.temperature)
    print(f"\n{output}")

if __name__ == "__main__":
    main()
```

### Running from the terminal

```bash
# Default settings
python generate.py

# Custom options
python generate.py --start "the" --words 30 --temperature 0.7 --seed 42

# Save and reuse model
python generate.py --model bigram_model.json --start "he" --words 15
```

### Testing the pipeline

Run end-to-end tests to verify everything works:

```python
def test_pipeline():
    texts = load_corpus("slm-corpus.csv")
    assert len(texts) > 0, "No data loaded"

    tokens = tokenize(" ".join(texts))
    assert len(tokens) > 0, "No tokens produced"

    bigrams = build_bigrams(tokens)
    assert len(bigrams) > 0, "No bigrams built"

    model = normalize_bigrams(bigrams)
    assert len(model) > 0, "Model is empty"

    text = generate_text(model, "the", length=10)
    assert len(text.split()) > 0, "No text generated"

    print("All tests passed!")
    print(f"Generated: {text}")

test_pipeline()
```

### What you've built

In five weeks, you've constructed a complete NLP pipeline from scratch:

1. **Week 1**: Loaded a CSV corpus into Python
2. **Week 2**: Tokenized text and counted word frequencies
3. **Week 3**: Built and normalized bigram probability tables
4. **Week 4**: Implemented weighted random sampling for text generation
5. **Week 5**: Assembled everything into a CLI tool with temperature control

This is the same fundamental pipeline used in production language models — just with bigger data, more parameters, and neural networks instead of bigram tables. The core ideas (tokenization → counting → probability → sampling) are identical.

## Try It

Run the complete generator with different settings and observe the output:

```bash
python generate.py --start "the" --words 20 --temperature 0.5 --seed 1
python generate.py --start "the" --words 20 --temperature 1.0 --seed 1
python generate.py --start "the" --words 20 --temperature 1.5 --seed 1
```

Compare the outputs. Which temperature produces the most readable text?

## Key Takeaways

- The complete pipeline: load → tokenize → count → bigrams → normalize → generate
- `argparse` provides a clean command-line interface with `--flag value` arguments
- Model caching with JSON avoids rebuilding from scratch on every run
- This pipeline mirrors the architecture of real language models, just at a tiny scale

## Practice Challenge

Extend the CLI with a `--interactive` flag that enters a REPL loop:

```python
parser.add_argument("--interactive", action="store_true", help="Interactive mode")

# In main():
if args.interactive:
    print("Interactive mode. Type 'quit' to exit.")
    while True:
        word = input("Start word: ").strip()
        if word == "quit":
            break
        temp = float(input("Temperature (0.1-2.0): ") or "1.0")
        text = generate_text(model, word, args.words, temp)
        print(f"\n{text}\n")
```
