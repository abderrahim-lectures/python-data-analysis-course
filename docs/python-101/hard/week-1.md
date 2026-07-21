---
title: "Week 1: Loading a Text Corpus from CSV"
sidebar_position: 1
section: python-101
track: hard
week: 1
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Week 1: Building a Tiny Language Model — Loading the Corpus

<span className="gamified-flourish">🧠 Over the next 5 weeks you'll build a tiny language model — the same basic idea behind tools like ChatGPT — using nothing but plain Python. No libraries, no shortcuts. By Week 5 you'll feel exactly why real language models don't do it this way, and that discomfort is the whole point: it's your motivation for Section 2.</span>

## 🎯 Learning objectives

By the end of this week you can:
- Explain, at a high level, what a language model is: a system that predicts the next word given previous words.
- Load a small text corpus from a CSV file into a Python list of sentences using only the standard library.
- Split sentences into lists of words (a first, naive tokenizer).

## Lesson

### What is a language model?

A language model assigns a probability to sequences of words — informally, it answers "given the words so far, what word is likely to come next?" If you've seen the phrase "the cat sat on the ___", you already predicted "mat" before finishing this sentence. That's the task, formalized: given words $w_1, \dots, w_{n-1}$, estimate

$$
P(w_n \mid w_1, \dots, w_{n-1})
$$

Real models (including large ones) estimate this probability using huge neural networks trained on huge datasets. This week starts a much smaller version: we'll estimate it using nothing but **counting**, using a tiny hand-written corpus, and pure Python. It will work, and by Week 5 it will also be slow — deliberately, so that the *reason* tools like pandas and numpy exist stops being an abstract claim and becomes something you've personally felt.

### The corpus

This track works with [`slm-corpus.csv`](pathname:///datasets/slm-corpus.csv), a small hand-written set of simple sentences, one per row under a `sentence` column. A "corpus" is just the dataset of text a language model learns from — ours is deliberately tiny (20 sentences) so every step stays fast enough to run and inspect by hand this early in the course.

:::tip Using this file in the Trinket playground
Open the dataset link above, copy its contents, then in Trinket create a file named `slm-corpus.csv` and paste it in, exactly like Python 101 Normal Week 5.
:::

### Loading it

You already know `csv.DictReader` from... actually, you don't yet — that's Normal track Week 5, a week ahead of where the Hard track is right now. Since this track skips straight into a real project, here's the same idea, self-contained:

```python
import csv

def load_corpus(path):
    sentences = []
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            sentences.append(row["sentence"])
    return sentences

corpus = load_corpus("slm-corpus.csv")
print(len(corpus), "sentences loaded")
print(corpus[0])
```

`load_corpus` returns a plain `list[str]` — one string per sentence. Every value from `csv.DictReader` is a `str`, just like `input()`.

### A first tokenizer

Before we can count words, we need to split a sentence string into a list of individual words — this step is called **tokenization**. The simplest possible tokenizer just splits on whitespace:

```python
def tokenize(sentence):
    return sentence.lower().split()

tokenize("The cat sat on the mat")
# ['the', 'cat', 'sat', 'on', 'the', 'mat']
```

`.lower()` matters: without it, `"The"` and `"the"` would be counted as two different words later, which would make our word counts (next week) less meaningful. `.split()` with no arguments splits on any run of whitespace, which is good enough for this corpus's simple, punctuation-free sentences.

## 🧩 Challenges

<Challenge id="python101-hard-w1-c1" answer={<>Call <code>load_corpus</code>, then use a list comprehension: <code>[tokenize(s) for s in corpus]</code>. This produces a list of lists — each inner list is one sentence's tokens.</>}>

Using `load_corpus` and `tokenize` together, produce a list where each element is the tokenized (list-of-words) version of one sentence from the corpus.

</Challenge>

<Challenge id="python101-hard-w1-c2" answer={<>Loop over the tokenized sentences and take <code>len(tokens)</code> for each, then use <code>sum(...) / len(...)</code> across all of them — the same average pattern from Python 101 Normal Week 4/5, just applied to token counts instead of scores.</>}>

Compute the average number of words per sentence in the corpus.

</Challenge>

<Challenge id="python101-hard-w1-c3" answer={<>Build a <code>set()</code> and add every token from every tokenized sentence to it (or use a set comprehension over a flattened list); <code>len(...)</code> of that set is the vocabulary size — the count of *distinct* words, unlike total word count which counts repeats.</>}>

Compute the size of the corpus's **vocabulary** — the number of *distinct* words that appear anywhere in the corpus (not counting repeats).

</Challenge>

<Challenge id="python101-hard-w1-c4" answer={<>A naive <code>.split()</code> tokenizer would treat <code>"mat."</code> and <code>"mat"</code> as different tokens, and <code>"Amina's"</code> would stay glued to its apostrophe — punctuation attached to a word isn't stripped off. Real tokenizers (and this course's corpus) sidestep this by keeping sentences punctuation-free for now.</>}>

The corpus's sentences deliberately contain no punctuation. What would go wrong with `tokenize`'s simple `.split()` approach if a sentence *did* contain punctuation, like `"The cat sat on the mat."`? Try it on that string and inspect the result.

</Challenge>

## 🤔 Socratic Questions

- $P(w_n \mid w_1, \dots, w_{n-1})$ conditions on *every* previous word. Our small corpus has only 20 sentences — do you think we'll have enough data to estimate a probability conditioned on long histories? What might we have to simplify?
- Why does `tokenize` lowercase the sentence before splitting? What word-frequency question from next week would give a misleading answer if we skipped that step?
- `load_corpus` and `tokenize` are both small, single-purpose functions rather than one big function that does everything. What did you learn in Python 101 Normal Week 4 that explains why this is useful here, beyond just "it's tidier"?

## ✅ Weekly quiz

<WeeklyQuiz
  weekId="python-101-hard-week-1"
  questions={[
    {
      id: 'q1',
      prompt: 'A language model estimates which of the following?',
      options: [
        'The exact next word with 100% certainty',
        'The probability of the next word given the previous words',
        'Whether a sentence is grammatically correct',
        'The total number of words in a document',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: 'Why does tokenize() call .lower() before .split()?',
      options: [
        'It makes the code run faster',
        'It ensures csv.DictReader works correctly',
        'So "The" and "the" are counted as the same word later',
        'It is required by Python syntax',
      ],
      correctOptionIndex: 2,
    },
    {
      id: 'q3',
      prompt: 'What does load_corpus() return?',
      options: [
        'A single long string',
        'A list of strings, one per sentence',
        'A dict mapping words to counts',
        'A CSV file object',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'What does "vocabulary size" mean for a corpus?',
      options: [
        'The total word count including repeats',
        'The number of sentences',
        'The number of distinct words',
        'The average sentence length',
      ],
      correctOptionIndex: 2,
    },
  ]}
/>

<ProgressCheckbox weekId="python-101-hard-week-1" />
