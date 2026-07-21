---
title: "Week 5: A CLI Generator, Temperature, and the Speed Wall"
sidebar_position: 5
section: python-101
track: hard
week: 5
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';
import BonusContent from '@site/src/components/BonusContent';

# Week 5: Assembling the CLI, Tuning Temperature, and Feeling the Speed Wall

<span className="gamified-flourish">⏱️ This is the week the whole "pure Python, no numpy" constraint stops being an inconvenience and starts being the point.</span>

## 🎯 Learning objectives

By the end of this week you can:
- Assemble every piece from Weeks 1–4 into one end-to-end command-line text generator.
- Add a **temperature** parameter that controls how random vs. predictable the generated text is.
- Time your pure-Python pipeline on a larger corpus and explain, from firsthand measurement, why this motivates Section 2.

## Lesson

### Assembling the pipeline

Every function from Weeks 1–4 composes into one pipeline — load, tokenize, count, convert to probabilities, generate:

```python
import csv
import random

def load_corpus(path):
    with open(path, newline="") as f:
        return [row["sentence"] for row in csv.DictReader(f)]

def tokenize(sentence):
    return sentence.lower().split()

def bigrams(tokens):
    return [(tokens[i], tokens[i + 1]) for i in range(len(tokens) - 1)]

def build_bigram_probabilities(sentences):
    counts_table = {}
    for sentence in sentences:
        for first, second in bigrams(tokenize(sentence)):
            counts_table.setdefault(first, {})
            counts_table[first][second] = counts_table[first].get(second, 0) + 1
    probs_table = {}
    for word, next_counts in counts_table.items():
        total = sum(next_counts.values())
        probs_table[word] = {w: c / total for w, c in next_counts.items()}
    return probs_table

def generate_text(probs_table, start_word, max_words=10):
    words, current = [start_word], start_word
    for _ in range(max_words - 1):
        if current not in probs_table:
            break
        next_words = list(probs_table[current].keys())
        weights = list(probs_table[current].values())
        current = random.choices(next_words, weights=weights, k=1)[0]
        words.append(current)
    return " ".join(words)

if __name__ == "__main__":
    corpus = load_corpus("slm-corpus.csv")
    probs_table = build_bigram_probabilities(corpus)
    print(generate_text(probs_table, "the", max_words=8))
```

`dict.setdefault(key, {})` in `build_bigram_probabilities` is a small shortcut for the `if key not in table: table[key] = {}` pattern from Week 3 — it does the same thing in one line. `if __name__ == "__main__":` is the standard way to mark "run this when the file is executed directly" — you'll see this convention constantly once you install Python locally in the Capstone Bonus.

### Temperature: tuning randomness

**Temperature** is a single knob that stretches or flattens a probability distribution before sampling from it, without changing which outcomes are possible — only how close to uniform (flat) or how close to greedy (peaked) the sampling behaves:

$$
P_T(w) = \frac{P(w)^{1/T}}{\sum_{w'} P(w')^{1/T}}
$$

- $T = 1$: unchanged — normal sampling from the original distribution.
- $T < 1$ (e.g. $0.5$): sharpens the distribution — high-probability words become *even* more likely, pushing generation toward the greedy behavior from last week.
- $T > 1$ (e.g. $2.0$): flattens the distribution — low-probability words get relatively more likely, producing more surprising, more chaotic text.

```python
def apply_temperature(probs, temperature):
    adjusted = {w: p ** (1 / temperature) for w, p in probs.items()}
    total = sum(adjusted.values())
    return {w: v / total for w, v in adjusted.items()}

def sample_next(word, probs_table, temperature=1.0):
    if word not in probs_table:
        return None
    probs = probs_table[word]
    if temperature != 1.0:
        probs = apply_temperature(probs, temperature)
    return random.choices(list(probs.keys()), weights=list(probs.values()), k=1)[0]
```

This is the exact same "temperature" concept you'll see referenced in real large language model APIs — you're implementing a simplified version of a real, widely-used control knob.

### Timing it: feeling the speed wall

Here's the exercise this whole track has been building toward. Time your pipeline on a **larger** corpus — say, a version of the corpus repeated 200 times to simulate more data (`corpus * 200`, using list multiplication) — using Python's built-in `time` module:

```python
import time

big_corpus = corpus * 200   # simulate a much larger dataset
start = time.time()
big_probs_table = build_bigram_probabilities(big_corpus)
elapsed = time.time() - start
print(f"Built bigram table for {len(big_corpus)} sentences in {elapsed:.3f} seconds")
```

Run this in the playground and note your actual number. It's probably still fast at this size — but watch what happens as you multiply the corpus size again (`* 1000`, `* 5000`): the nested-loop, dict-of-dicts approach from Week 3 does real work for *every single word occurrence*, with no shortcuts. There's no way to "vectorize" a plain Python `for` loop the way specialized numeric libraries can. **That gap — between what plain Python can do comfortably and what real-sized text/data problems need — is exactly what Section 2 exists to close.** Pandas and numpy don't just make code shorter; they make operations like this run orders of magnitude faster, by pushing the actual looping down into optimized, compiled code instead of Python's own interpreter loop.

## 🧩 Challenges

<Challenge id="python101-hard-w5-c1" answer={<>Wrap the CLI's <code>generate_text</code> call in a loop reading <code>input("Start word: ")</code>, and use <code>input("Max words: ")</code> converted with <code>int(...)</code> — the same input-then-convert pattern from Python 101 Normal Week 1, now feeding a generation pipeline instead of a simple calculation.</>}>

Extend the `if __name__ == "__main__":` block so it asks the user (via `input()`) for a start word and a max word count, instead of hardcoding them.

</Challenge>

<Challenge id="python101-hard-w5-c2" answer={<>Call <code>generate_text</code> (using the temperature-aware <code>sample_next</code>) three times each at <code>temperature=0.5</code> and <code>temperature=2.0</code> with the same start word, and compare: the low-temperature runs should look more repetitive/predictable, the high-temperature runs more erratic.</>}>

Generate text at `temperature=0.5` and `temperature=2.0` with the same start word, several times each. Describe the qualitative difference you observe.

</Challenge>

<Challenge id="python101-hard-w5-c3" answer={<>Time <code>build_bigram_probabilities</code> at a few different corpus-repeat multipliers (e.g. 1x, 50x, 200x, 1000x) and print the elapsed time for each — the growth should look roughly linear (or worse) in the number of word occurrences, since every occurrence triggers dict operations.</>}>

Time `build_bigram_probabilities` at increasing corpus sizes (`corpus * 1`, `* 50`, `* 200`, `* 1000`) and print a small table of size vs. elapsed time. Does the growth look linear, or worse than linear?

</Challenge>

<Challenge id="python101-hard-w5-c4" answer={<>At temperature exactly 1.0, <code>apply_temperature</code> raises every probability to the power <code>1/1 = 1</code>, i.e. leaves them unchanged, then renormalizes by dividing by their (already-1) sum — so it's mathematically a no-op, which is exactly why <code>sample_next</code> special-cases <code>temperature != 1.0</code> to skip the (redundant) computation entirely.</>}>

Why does `sample_next` special-case `temperature != 1.0` instead of always calling `apply_temperature`? What does `apply_temperature` actually compute when `temperature == 1.0`?

</Challenge>

## 🤔 Socratic Questions

- You just personally measured plain-Python's performance on a text-processing task. Do you think the slowdown you saw is mainly about Python's `for` loop, the dict operations, or something else? What would you need to test to isolate the cause?
- Temperature reshapes a probability distribution but never changes *which* outcomes are possible (a word with probability 0 stays at probability 0 no matter the temperature). Why is that an important property for a "randomness knob" to have?
- Section 2 begins with a demo showing the same kind of word-counting task running dramatically faster with numpy/pandas than the pure-Python version you just built. Based on what you now know about how your `build_bigram_probabilities` actually works (nested loops, dict lookups), what do you predict a vectorized version would need to do differently to be faster?

## ✅ Weekly quiz

<WeeklyQuiz
  weekId="python-101-hard-week-5"
  questions={[
    {
      id: 'q1',
      prompt: 'A temperature below 1.0 (e.g. 0.5) makes generated text:',
      options: [
        'More random/chaotic',
        'More predictable/repetitive, closer to greedy',
        'Exactly identical to temperature 1.0',
        'Impossible to generate (raises an error)',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: "What does dict.setdefault(key, {}) do if key is already present?",
      options: [
        'Overwrites the existing value with {}',
        'Raises a KeyError',
        'Leaves the existing value unchanged',
        'Deletes the key',
      ],
      correctOptionIndex: 2,
    },
    {
      id: 'q3',
      prompt: 'This week\'s timing exercise on a larger corpus is meant to demonstrate:',
      options: [
        'That Python is always too slow to be useful',
        'A concrete, felt motivation for why vectorized tools like numpy/pandas exist',
        'That bigram models are faster than unigram models',
        'How to fix slow code using multithreading',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'if __name__ == "__main__": is used to:',
      options: [
        'Declare the main class of the program',
        'Mark code that should run only when the file is executed directly',
        'Import the standard library',
        'Speed up the script',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

## 🎁 Bonus: packaging the model as a class

<BonusContent weekId="python-101-hard-week-5">

Every function this track wrote takes a `probs_table` as an explicit argument, passed around from function to function. A `class` lets you bundle the table and the functions that operate on it into one object:

```python
class BigramModel:
    def __init__(self, corpus_path):
        sentences = load_corpus(corpus_path)
        self.probs_table = build_bigram_probabilities(sentences)

    def generate(self, start_word, max_words=10, temperature=1.0):
        return generate_text(self.probs_table, start_word, max_words)

model = BigramModel("slm-corpus.csv")
model.generate("the")
```

This isn't part of the core curriculum — the whole track was deliberately solvable with functions and dicts, to keep focus on the *ideas* (counting, conditional probability, sampling) rather than object-oriented design. But now that you've felt where plain functions get unwieldy (passing `probs_table` into every single call), you're in a good position to appreciate what a class buys you. Try wrapping this week's full pipeline as a `BigramModel` class, then compare: does it feel cleaner, or just different?

</BonusContent>

<ProgressCheckbox weekId="python-101-hard-week-5" />

---

**🎉 You've finished Python 101.** You built a working (if simple) language model using nothing but the Python standard library — and you personally measured where it starts to strain. That's exactly the door Section 2, **Pandas & Data Analysis**, opens next.
