---
title: "Week 2: Word Frequencies"
sidebar_position: 2
section: python-101
track: hard
week: 2
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

## 🤔 Socratic Questions

- The unigram model gives "the" a high, constant probability everywhere in a sentence, including at the very start. Does that match your intuition about which words tend to *start* an English sentence versus appear in the middle? What's missing from this model that would fix that?
- Two different sentences, "the cat sat on the mat" and "mat the on sat cat the" (the words scrambled), produce the *exact same* word-frequency table. What does that tell you about what information a unigram model does and doesn't capture?
- Why divide by total word count $N$ (all word occurrences) rather than by vocabulary size (distinct words) when computing $P(w)$? What would go wrong with the "sums to 1" property if you divided by vocabulary size instead?

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
  ]}
/>

<ProgressCheckbox weekId="python-101-hard-week-2" />
