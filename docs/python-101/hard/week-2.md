---
title: "Week 2: Word Frequencies"
sidebar_position: 2
section: python-101
track: hard
week: 2
description: "Tokenize text and count word frequencies with Python dictionaries, framing frequency tables as discrete probability distributions."
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Week 2: Word Frequencies as a Discrete Distribution

<span className="gamified-flourish">🎲 A word-count table looks like bookkeeping. It's actually a probability distribution in disguise.</span>

## 🎯 Learning objectives

By the end of this week you can:
- Build a word-frequency table (`dict[str, int]`) from a tokenized corpus.
- Convert raw counts into probabilities, and explain why they form a valid discrete probability distribution.
- Reason about what this "unigram" model can and can't predict.
- Recognize the shape of a Zipfian (power-law) word-frequency distribution.

## Lesson

### Counting words

Given a list of tokenized sentences (from last week), counting how often each word appears is exactly the frequency-table pattern from Python 101 Normal Week 3:

```python
def count_words(tokenized_sentences):
    counts = {}
    for tokens in tokenized_sentences:
        for word in tokens:
            counts[word] = counts.get(word, 0) + 1
    return counts

counts = count_words(tokenized)
counts["the"]   # however many times "the" appears across the whole corpus
```

The standard library actually has a purpose-built tool for exactly this pattern, `collections.Counter` — worth knowing about even though we'll keep writing it out by hand in this track to stay dependency-free:

```python
from collections import Counter

counts = Counter(word for tokens in tokenized for word in tokens)
counts.most_common(5)   # the 5 most frequent (word, count) pairs, already sorted
```

`Counter` is a `dict` subclass, so everything you already know about dicts (`.get()`, `.items()`, membership with `in`) still applies to it — it just adds a couple of counting-specific conveniences like `.most_common()`.

### From counts to probabilities

A frequency table becomes a **probability distribution** once you divide every count by the total number of word occurrences. If $c(w)$ is the count of word $w$ and $N = \sum_w c(w)$ is the total word count, then:

$$
P(w) = \frac{c(w)}{N}
$$

```python
def to_probabilities(counts):
    total = sum(counts.values())
    return {word: count / total for word, count in counts.items()}

probs = to_probabilities(counts)
probs["the"]   # e.g. 0.18 — an 18% chance any randomly picked word slot is "the"
```

Two properties make this a genuine probability distribution, not just "some numbers":
1. Every $P(w) \ge 0$ — a count can never be negative.
2. $\sum_w P(w) = 1$ — every word occurrence is accounted for by exactly one word, so the probabilities of all possible outcomes sum to 1, the same requirement as any distribution you've studied in a stats course.

You can verify property 2 directly: `sum(probs.values())` should be (very close to) `1.0` — "very close" because of the floating-point imprecision from Week 1 of Normal track.

### This is a *unigram* model

Estimating $P(w)$ this way ignores all context — it's the same probability for "the" whether it follows "sat on" or starts a brand-new sentence. This is called a **unigram** model: it looks at one word at a time, with no memory of what came before. It's a real, valid language model — just an extremely weak one, since real language is highly context-dependent ("bank" after "river" vs. after "money" means different things). Next week fixes this, one step at a time, by conditioning on **one** previous word — a **bigram** model.

### A pattern you'll see everywhere: Zipf's law

Sort your word counts from most to least frequent and look at the shape: a handful of words (like "the", "a", "on") account for a huge share of all word occurrences, while most words in the vocabulary appear only once or twice. This isn't specific to our tiny corpus — it's an extremely robust empirical pattern in real text called **Zipf's law**: a word's frequency is roughly inversely proportional to its rank, $c(w) \propto \frac{1}{\text{rank}(w)}$. The most common word appears roughly twice as often as the second-most-common, three times as often as the third-most-common, and so on. You can see a rough version of this shape even in a 20-sentence corpus:

```python
ranked = sorted(counts.items(), key=lambda pair: pair[1], reverse=True)
for rank, (word, count) in enumerate(ranked[:10], start=1):
    print(rank, word, count)
```

`enumerate(ranked[:10], start=1)` numbers the top 10 entries starting from 1 instead of Python's usual 0 — useful whenever "rank" or "position" is meant in the everyday, one-indexed sense.

## ⚠️ Common pitfalls

- **Looking up a word directly instead of with `.get()`.** `counts[word] + 1` on a word's very first appearance raises a `KeyError`, since the word isn't a key yet — `.get(word, 0) + 1` handles the "haven't seen this yet" case gracefully.
- **Forgetting the denominator changes per corpus.** `probs["the"]` from one corpus and `probs["the"]` from a different, larger corpus are not directly comparable in general — they're each relative to their own corpus's total word count $N$.
- **Confusing "vocabulary size" with "total word count."** $N = \sum_w c(w)$ counts every occurrence (with repeats); vocabulary size (Week 1) counts only *distinct* words. `to_probabilities` divides by $N$, not by vocabulary size — mixing these up breaks the "sums to 1" property.

## 🧩 Challenges

<Challenge id="python101-hard-w2-c1" answer={<>Use <code>sorted(counts, key=lambda w: counts[w], reverse=True)[:5]</code>, or equivalently sort the <code>counts.items()</code> pairs by count — the same sorted-by-a-key pattern from Python 101 Normal Week 5's summary program.</>}>

Given `counts` from `count_words`, find the 5 most frequent words in the corpus.

</Challenge>

<Challenge id="python101-hard-w2-c2" answer={<>Loop over <code>probs.values()</code> and sum them, or simply <code>sum(probs.values())</code>; it should print something extremely close to 1.0 (like 0.9999999999999999) due to floating-point rounding, not exactly 1.0.</>}>

Verify property 2 from the lesson: compute `sum(probs.values())` for your corpus and confirm it's (almost exactly) `1.0`.

</Challenge>

<Challenge id="python101-hard-w2-c3" answer={<>Words that appear only once will each have the same, smallest, nonzero probability — computable as <code>1 / total</code>. You can find them by filtering <code>counts</code> for entries where the count equals 1.</>}>

Words that appear only once in the corpus are called **hapax legomena**. Find all of them, and explain what probability `to_probabilities` assigns to each.

</Challenge>

<Challenge id="python101-hard-w2-c4" answer={<>A word never seen in the corpus has count 0, so it's simply absent from the <code>counts</code>/<code>probs</code> dict — looking it up directly with <code>probs["giraffe"]</code> raises a <code>KeyError</code> rather than returning 0, which is why <code>.get(word, 0)</code> matters here too.</>}>

What probability does this model assign to a word that never appeared anywhere in the corpus, like `"giraffe"`? What actually happens if you write `probs["giraffe"]` directly?

</Challenge>

<Challenge id="python101-hard-w2-c5" answer={<>Use collections.Counter directly: Counter(word for tokens in tokenized for word in tokens).most_common(5). Compare its output to your Challenge 1 answer -- they should list the same 5 words in the same order, just computed with a built-in tool instead of sorted() by hand.</>}>

Rewrite Challenge 1 (the 5 most frequent words) using `collections.Counter` and `.most_common()` instead of `sorted()`. Do you get the same answer?

</Challenge>

<Challenge id="python101-hard-w2-c6" answer={<>Print rank and count side by side for the top 10 ranked words, then compute count / rank for each — for a corpus following Zipf's law reasonably well, this ratio should stay roughly similar (close to the top word's own count) across the ranks, since c(w) times rank is approximately constant under c(w) ∝ 1/rank.</>}>

Using the `ranked` list from the Zipf's law example, compute `count * rank` for each of the top 10 words. Zipf's law predicts this product should be roughly constant. Is it, for our small corpus?

</Challenge>

## 🤔 Socratic Questions

- The unigram model gives "the" a high, constant probability everywhere in a sentence, including at the very start. Does that match your intuition about which words tend to *start* an English sentence versus appear in the middle? What's missing from this model that would fix that?
- Two different sentences, "the cat sat on the mat" and "mat the on sat cat the" (the words scrambled), produce the *exact same* word-frequency table. What does that tell you about what information a unigram model does and doesn't capture?
- Why divide by total word count $N$ (all word occurrences) rather than by vocabulary size (distinct words) when computing $P(w)$? What would go wrong with the "sums to 1" property if you divided by vocabulary size instead?
- Zipf's law shows up in far more than just word frequencies — city population sizes, wealth distribution, and website traffic all show a similar "a few huge, many tiny" shape. Why might counting-based phenomena in general tend to produce this pattern, rather than everything being roughly equal?
- Our corpus only has 20 sentences, so most words are hapax legomena (appear exactly once). What do you think happens to the *proportion* of hapax legomena as a corpus grows much larger — does it shrink toward zero, or does Zipf's law suggest it stays surprisingly high even for huge corpora?

## ✅ Weekly quiz

<WeeklyQuiz
  weekId="python-101-hard-week-2"
  questions={[
    {
      id: 'q1',
      prompt: 'For a valid probability distribution over words, what must sum(probs.values()) equal (approximately)?',
      options: ['0', '1', 'The vocabulary size', 'The total word count'],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: 'A "unigram" model estimates word probability based on:',
      options: [
        'The previous 2 words',
        'The entire sentence so far',
        'No context at all — just overall frequency',
        'The next word only',
      ],
      correctOptionIndex: 2,
    },
    {
      id: 'q3',
      prompt: 'What probability does the unigram model assign to a word never seen in the corpus?',
      options: ['1.0', 'A very small positive number', '0 (it is simply absent from the table)', 'It raises an error at model-building time'],
      correctOptionIndex: 2,
    },
    {
      id: 'q4',
      prompt: 'counts.get(word, 0) + 1 is used instead of counts[word] + 1 because:',
      options: [
        'It runs faster',
        'It avoids a KeyError the first time a word is seen',
        'It only works for numbers',
        'They behave identically, it is just style',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q5',
      prompt: "Zipf's law describes what kind of relationship between a word's rank and its frequency?",
      options: [
        'Frequency increases with rank',
        'Frequency is roughly constant regardless of rank',
        'Frequency is roughly inversely proportional to rank',
        'There is no general relationship',
      ],
      correctOptionIndex: 2,
    },
  ]}
/>

<ProgressCheckbox weekId="python-101-hard-week-2" />
