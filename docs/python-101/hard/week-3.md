---
title: "Week 3: Bigram Probability Tables"
sidebar_position: 3
section: python-101
track: hard
week: 3
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';

# Week 3: Bigram Probability Tables

<span className="gamified-flourish">🔗 Last week: "what word is likely at all?" This week: "what word is likely *right after this one*?"</span>

## 🎯 Learning objectives

By the end of this week you can:
- Extract **bigrams** (consecutive word pairs) from tokenized sentences.
- Build a nested dictionary `dict[str, dict[str, float]]` mapping each word to a probability distribution over the words that follow it.
- Explain, with an example, why bigrams capture context the unigram model couldn't.

## Lesson

### Bigrams: consecutive word pairs

A **bigram** is a pair of consecutive words. For the tokenized sentence `["the", "cat", "sat"]`, the bigrams are `("the", "cat")` and `("cat", "sat")` — one pair for each adjacent position:

```python
def bigrams(tokens):
    return [(tokens[i], tokens[i + 1]) for i in range(len(tokens) - 1)]

bigrams(["the", "cat", "sat"])
# [('the', 'cat'), ('cat', 'sat')]
```

This is the same `range(len(...) - 1)` pattern that shows up whenever you need to look at pairs of neighbors in a sequence — the `-1` exists because the *last* word has no word after it to pair with.

### A conditional probability table

Now we estimate $P(w_n \mid w_{n-1})$ — the probability of the next word, *given only the immediately previous word*. This is a **bigram model**: still limited context (memory of exactly one word), but strictly more than the unigram model's memory of none.

The natural data structure is a dict of dicts: for each word $w_{n-1}$, a nested dict mapping each possible next word $w_n$ to its probability, conditioned on being preceded by $w_{n-1}$:

```python
def bigram_counts(tokenized_sentences):
    table = {}   # word -> {next_word: count}
    for tokens in tokenized_sentences:
        for first, second in bigrams(tokens):
            if first not in table:
                table[first] = {}
            table[first][second] = table[first].get(second, 0) + 1
    return table

def bigram_probabilities(counts_table):
    probs_table = {}
    for word, next_counts in counts_table.items():
        total = sum(next_counts.values())
        probs_table[word] = {w: c / total for w, c in next_counts.items()}
    return probs_table
```

`bigram_probabilities` reuses the exact same "counts → divide by total" idea as last week's `to_probabilities` — the only difference is it's applied separately to *each* word's own row of the table, since each word has its own distribution over what follows it. Each inner dict `probs_table[word]` sums to 1 on its own, the same "sums to 1" property from last week, just one distribution per word instead of one distribution for the whole vocabulary.

```python
probs_table["the"]
# {'cat': 0.35, 'dog': 0.3, 'mouse': 0.1, 'mat': 0.15, ...}
```

Read `probs_table["the"]["cat"]` as $P(\text{"cat"} \mid \text{"the"})$: given the previous word was "the", how likely is "cat" to come next?

## 🧩 Challenges

<Challenge id="python101-hard-w3-c1" answer={<>Build the full bigram table with <code>bigram_counts</code> then <code>bigram_probabilities</code>, and look up <code>probs_table["the"]["cat"]</code> and <code>probs_table["the"]["dog"]</code> directly. Whichever has the larger probability is more likely to follow "the" in this corpus.</>}>

Using the corpus from Week 1, compute the bigram probability table. Which is more likely to directly follow "the": "cat" or "dog"?

</Challenge>

<Challenge id="python101-hard-w3-c2" answer={<>Loop over <code>probs_table</code> and print <code>len(probs_table[word])</code> for each, or use <code>max(probs_table, key=lambda w: len(probs_table[w]))</code> to find the word with the most distinct followers directly.</>}>

Which word in the corpus is followed by the *most* distinct other words (i.e. has the largest inner dict in `probs_table`)?

</Challenge>

<Challenge id="python101-hard-w3-c3" answer={<>The last word of a sentence never appears as the <code>first</code> element of a bigram (only as the <code>second</code>), so it's missing as a top-level key in <code>probs_table</code> unless it also happens to appear mid-sentence elsewhere in the corpus. Looking it up directly, e.g. <code>probs_table["mat"]</code>, would raise a <code>KeyError</code> if "mat" never starts a bigram anywhere in the corpus.</>}>

Pick a word that only ever appears as the *last* word of a sentence in the corpus. Is it a top-level key in `probs_table`? Why or why not, given how `bigrams()` is defined?

</Challenge>

<Challenge id="python101-hard-w3-c4" answer={<>Extend <code>bigrams</code> to a general <code>ngrams(tokens, n)</code> that returns tuples of <code>n</code> consecutive tokens using <code>range(len(tokens) - n + 1)</code> and slicing, e.g. <code>tuple(tokens[i:i+n])</code>. Bigrams are just the special case n=2.</>}>

Generalize `bigrams(tokens)` into a `trigrams(tokens)` function that returns all consecutive *triples* of words. How would you further generalize it to an `ngrams(tokens, n)` function?

</Challenge>

## 🤔 Socratic Questions

- Look up `probs_table["the"]` and compare it to last week's overall `probs`. Are they the same distribution? What does that tell you about whether "the" changes what's likely to come next?
- A trigram model (conditioning on the previous *two* words) captures more context than a bigram model. Given how small our 20-sentence corpus is, what practical problem do you predict trigram counts would run into that bigram counts mostly avoid?
- `bigram_probabilities` builds one full probability distribution *per word* in the vocabulary. If the vocabulary has $V$ distinct words, roughly how many numbers could the full bigram table contain in the worst case (every word following every other word at least once)? What does that suggest about how table size scales with vocabulary size?

## ✅ Weekly quiz

<WeeklyQuiz
  weekId="python-101-hard-week-3"
  questions={[
    {
      id: 'q1',
      prompt: 'A bigram is:',
      options: [
        'A single word',
        'A pair of consecutive words',
        'The full vocabulary of a corpus',
        'A probability threshold',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: 'probs_table["the"]["cat"] represents:',
      options: [
        'P(the)',
        'P(cat)',
        'P(cat | the) — probability of "cat" given the previous word was "the"',
        'The total count of "the" in the corpus',
      ],
      correctOptionIndex: 2,
    },
    {
      id: 'q3',
      prompt: "What does each inner dict probs_table[word] sum to (approximately)?",
      options: ['0', '1', 'The vocabulary size', 'It varies per word with no fixed total'],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'Compared to a unigram model, a bigram model:',
      options: [
        'Uses less context (no memory at all)',
        'Uses one word of previous context',
        'Uses the entire sentence as context',
        'Cannot be represented as a dict',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="python-101-hard-week-3" />
