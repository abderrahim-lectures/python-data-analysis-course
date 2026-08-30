---
title: "Week 1: Loading a Text Corpus from CSV"
section: python-101
track: hard
week: 1
description: "Start the Python 101 Hard track: load and explore a small text corpus from CSV, the first step toward building a tiny language model."
---

:::tip[First time here?]
This course runs Python right in your browser — no install needed. The editor on the right lets you type and run code instantly. **Take a quick look at the editor panel →**
:::

# Week 1: Building a Tiny Language Model — Loading the Corpus

<span class="gamified-flourish">🧠 Over the next 5 weeks you'll build a tiny language model — the same basic idea behind tools like ChatGPT — using nothing but plain Python. No libraries, no shortcuts. By Week 5 you'll feel exactly why real language models don't do it this way, and that discomfort is the whole point: it's your motivation for Section 2.</span>

## 🎯 Learning objectives

By the end of this week you can:
- Explain, at a high level, what a language model is: a system that predicts the next word given previous words.
- Load a small text corpus from a CSV file into a Python list of sentences using only the standard library.
- Split sentences into lists of words (a first, naive tokenizer), and explain its limits.
- Compute basic descriptive statistics about a text corpus: sentence count, vocabulary size, average length.

## Lesson

### What is a language model?

A language model assigns a probability to sequences of words — informally, it answers "given the words so far, what word is likely to come next?" If you've seen the phrase "the cat sat on the ___", you already predicted "mat" before finishing this sentence. That's the task, formalized: given words $w_1, \dots, w_{n-1}$, estimate

$$
P(w_n \mid w_1, \dots, w_{n-1})
$$

Real models (including large ones) estimate this probability using huge neural networks trained on huge datasets. This week starts a much smaller version: we'll estimate it using nothing but **counting**, using a tiny hand-written corpus, and pure Python. It will work, and by Week 5 it will also be slow — deliberately, so that the *reason* tools like pandas and numpy exist stops being an abstract claim and becomes something you've personally felt.

Why does *counting* let you estimate a probability at all? Because probability itself, in the simplest ("frequentist") sense, is just "how often did this happen, out of everything that could have happened" — $P(\text{event}) \approx \frac{\text{count of that event}}{\text{count of all events}}$. Everything this whole track builds, from Week 2's word frequencies through Week 4's text generation, is exactly that ratio, applied to different questions about which word follows which.

### The corpus

This track works with [`slm-corpus.csv`](/datasets/slm-corpus.csv), a small hand-written set of simple sentences, one per row under a `sentence` column. A "corpus" is just the dataset of text a language model learns from — ours is deliberately tiny (20 sentences) so every step stays fast enough to run and inspect by hand this early in the course.

:::tip[This file is already available in the playground]
The FAB's playground has `slm-corpus.csv` pre-loaded — no need to copy/paste anything, `load_corpus("slm-corpus.csv")` below will just find it directly.
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

`load_corpus` returns a plain `list[str]` — one string per sentence. Every value from `csv.DictReader` is a `str`, just like `input()`. Notice the function does exactly one job (turn a file path into a list of sentence strings) and nothing else — it doesn't tokenize, doesn't count, doesn't print anything beyond what the caller asks for. Keeping each function narrowly scoped like this is what lets you build the rest of this track's pipeline as small, separately testable pieces, rather than one long tangled script.

### A first tokenizer

Before we can count words, we need to split a sentence string into a list of individual words — this step is called **tokenization**. The simplest possible tokenizer just splits on whitespace:

```python
def tokenize(sentence):
    return sentence.lower().split()

tokenize("The cat sat on the mat")
# ['the', 'cat', 'sat', 'on', 'the', 'mat']
```

`.lower()` matters: without it, `"The"` and `"the"` would be counted as two different words later, which would make our word counts (next week) less meaningful. `.split()` with no arguments splits on any run of whitespace, which is good enough for this corpus's simple, punctuation-free sentences.

A slightly more robust version strips basic punctuation before splitting, which matters the moment your corpus stops being deliberately clean:

```python
import string

def tokenize_robust(sentence):
    no_punct = sentence.translate(str.maketrans("", "", string.punctuation))
    return no_punct.lower().split()

tokenize_robust("The cat sat on the mat.")
# ['the', 'cat', 'sat', 'on', 'the', 'mat']  -- the trailing period is gone
```

`string.punctuation` is a ready-made string of common punctuation characters; `str.maketrans("", "", string.punctuation)` builds a translation table that maps each of those characters to nothing, and `.translate(...)` applies it, effectively deleting them. This track sticks with the simpler `tokenize` for the rest of the weeks (the corpus is punctuation-free on purpose), but it's worth seeing what a "real" preprocessing step looks like — this exact gap is one of many reasons production NLP tools use dedicated tokenizer libraries rather than a single `.split()` call.

### Basic corpus statistics

Before building anything probabilistic, it's worth just looking at the data — the same instinct Section 2's EDA track will formalize into a whole methodology:

```python
tokenized = [tokenize(s) for s in corpus]
lengths = [len(tokens) for tokens in tokenized]

print("Sentences:", len(corpus))
print("Shortest sentence:", min(lengths), "words")
print("Longest sentence:", max(lengths), "words")
print("Average sentence length:", sum(lengths) / len(lengths))
```

Even this small amount of profiling tells you something useful: if every sentence in the corpus were exactly the same length, that would suggest a very artificial (or very repetitive) dataset — worth knowing before you trust any statistics computed from it later.

## ⚠️ Common pitfalls

- **Forgetting `.lower()`.** Without it, `"The"` and `"the"` are two different tokens as far as Python is concerned, silently splitting what should be one word's count into two.
- **Assuming `.split()` handles punctuation.** `"mat.".split()` on a whole sentence gives you a token `"mat."` (with the period attached) as one piece, not `"mat"` and `"."` separately — a real gap this week's challenges ask you to notice directly.
- **Re-reading the file every time you need the corpus.** `load_corpus` does file I/O, which is comparatively slow — call it once, store the result in a variable, and reuse that variable, rather than calling `load_corpus(...)` again inside a loop.

## 🧩 Challenges

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Using `load_corpus` and `tokenize` together, produce a list where each element is the tokenized (list-of-words) version of one sentence from the corpus.

<p class="challenge__answer">💡 <strong>Answer:</strong> Call <code>load_corpus</code>, then use a list comprehension: <code>[tokenize(s) for s in corpus]</code>. This produces a list of lists — each inner list is one sentence's tokens.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Compute the average number of words per sentence in the corpus.

<p class="challenge__answer">💡 <strong>Answer:</strong> Loop over the tokenized sentences and take <code>len(tokens)</code> for each, then use <code>sum(...) / len(...)</code> across all of them — the same average pattern from Python 101 Normal Week 4/5, just applied to token counts instead of scores.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Compute the size of the corpus's **vocabulary** — the number of *distinct* words that appear anywhere in the corpus (not counting repeats).

<p class="challenge__answer">💡 <strong>Answer:</strong> Build a <code>set()</code> and add every token from every tokenized sentence to it (or use a set comprehension over a flattened list); <code>len(...)</code> of that set is the vocabulary size — the count of *distinct* words, unlike total word count which counts repeats.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

The corpus's sentences deliberately contain no punctuation. What would go wrong with `tokenize`'s simple `.split()` approach if a sentence *did* contain punctuation, like `"The cat sat on the mat."`? Try it on that string and inspect the result.

<p class="challenge__answer">💡 <strong>Answer:</strong> A naive <code>.split()</code> tokenizer would treat <code>"mat."</code> and <code>"mat"</code> as different tokens, and <code>"Amina's"</code> would stay glued to its apostrophe — punctuation attached to a word isn't stripped off. Real tokenizers (and this course's corpus) sidestep this by keeping sentences punctuation-free for now.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Run the same punctuated sentence from Challenge 4 through `tokenize_robust` instead. Does it produce the token list you'd expect?

<p class="challenge__answer">💡 <strong>Answer:</strong> Call <code>tokenize_robust("The cat sat on the mat.")</code> and compare to <code>tokenize("The cat sat on the mat.")</code> — the robust version strips the trailing period before splitting, producing <code>"mat"</code> instead of <code>"mat."</code> as the last token.</p>

</div>
</details>

<details class="challenge">
<summary>🧩 Challenge — think first, then reveal</summary>
<div class="challenge__body">

Find the *most common* sentence length in the corpus (in words) — not the average, the length that occurs most often.

<p class="challenge__answer">💡 <strong>Answer:</strong> Loop over the tokenized sentences, build a frequency count for sentence lengths (e.g. a dict mapping each length to how many sentences have it), and find the length with the highest count — the same "track a running maximum over a dict" pattern from Python 101 Normal Week 3.</p>

</div>
</details>

## 🤔 Socratic Questions

- $P(w_n \mid w_1, \dots, w_{n-1})$ conditions on *every* previous word. Our small corpus has only 20 sentences — do you think we'll have enough data to estimate a probability conditioned on long histories? What might we have to simplify?
- Why does `tokenize` lowercase the sentence before splitting? What word-frequency question from next week would give a misleading answer if we skipped that step?
- `load_corpus` and `tokenize` are both small, single-purpose functions rather than one big function that does everything. What did you learn in Python 101 Normal Week 4 that explains why this is useful here, beyond just "it's tidier"?
- `tokenize_robust` strips *all* punctuation, including apostrophes inside contractions like `"don't"`, turning it into `"dont"`. Is that actually correct behavior for a real tokenizer? What would you need to change to handle contractions specially?
- Given the frequentist idea that "probability ≈ count / total," what do you think happens to your probability estimates as the corpus grows from 20 sentences to 20,000? Would you expect the estimates to become more or less trustworthy, and why?

## ✅ Weekly quiz

<div class="quiz" data-quiz="python-101-hard-week-1">
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">1. A language model estimates which of the following?</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">The exact next word with 100% certainty</button>
        <button class="quiz-q__opt" data-idx="1">The probability of the next word given the previous words</button>
        <button class="quiz-q__opt" data-idx="2">Whether a sentence is grammatically correct</button>
        <button class="quiz-q__opt" data-idx="3">The total number of words in a document</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="2">
        <p class="quiz-q__prompt">2. Why does tokenize() call .lower() before .split()?</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">It makes the code run faster</button>
        <button class="quiz-q__opt" data-idx="1">It ensures csv.DictReader works correctly</button>
        <button class="quiz-q__opt" data-idx="2">So &quot;The&quot; and &quot;the&quot; are counted as the same word later</button>
        <button class="quiz-q__opt" data-idx="3">It is required by Python syntax</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="1">
        <p class="quiz-q__prompt">3. What does load_corpus() return?</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">A single long string</button>
        <button class="quiz-q__opt" data-idx="1">A list of strings, one per sentence</button>
        <button class="quiz-q__opt" data-idx="2">A dict mapping words to counts</button>
        <button class="quiz-q__opt" data-idx="3">A CSV file object</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <div class="quiz-q" data-answer="2">
        <p class="quiz-q__prompt">4. What does &quot;vocabulary size&quot; mean for a corpus?</p>
        <div class="quiz-q__options">
        <button class="quiz-q__opt" data-idx="0">The total word count including repeats</button>
        <button class="quiz-q__opt" data-idx="1">The number of sentences</button>
        <button class="quiz-q__opt" data-idx="2">The number of distinct words</button>
        <button class="quiz-q__opt" data-idx="3">The average sentence length</button>
        </div>
        <p class="quiz-q__feedback" hidden></p>
      </div>
      <p class="quiz__summary" data-quiz-summary hidden></p>
    </div>
