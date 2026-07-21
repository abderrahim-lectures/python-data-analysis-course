---
title: "Week 3: Bigram Probability Tables"
sidebar_position: 3
section: python-101
track: hard
week: 3
description: "Build bigram probability tables as nested dictionaries — the statistical core of a from-scratch tiny language model."
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
- Handle the "unseen context" problem: what to do when a word has no known followers at all.

## Lesson

### Bigrams: consecutive word pairs

A **bigram** is a pair of consecutive words. For the tokenized sentence `["the", "cat", "sat"]`, the bigrams are `("the", "cat")` and `("cat", "sat")` — one pair for each adjacent position:

```python
def bigrams(tokens):
    return [(tokens[i], tokens[i + 1]) for i in range(len(tokens) - 1)]

bigrams(["the", "cat", "sat"])
# [('the', 'cat'), ('cat', 'sat')]
```

This is the same `range(len(...) - 1)` pattern that shows up whenever you need to look at pairs of neighbors in a sequence — the `-1` exists because the *last* word has no word after it to pair with. For a sentence with $k$ tokens, there are always exactly $k - 1$ bigrams.

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

### The unseen-context problem

A word that only ever appears at the *end* of a sentence never starts a bigram, so it's simply missing as a top-level key in `probs_table` — there's no row for it at all, since `bigram_counts` only ever adds a key for words that appear as the *first* element of some bigram. This matters a lot for Week 4, where you'll need to check `word in probs_table` before looking anything up, exactly the same defensive pattern as checking a key exists before indexing a plain dict.

```python
def next_word_distribution(word, probs_table):
    if word not in probs_table:
        return None   # this word never starts a bigram in our corpus
    return probs_table[word]
```

This "the model has literally never seen this situation" case is a real, unavoidable limitation of any counting-based approach — it can only ever say something about patterns it actually observed in training data, a theme that will come back explicitly in Week 4.

## ⚠️ Common pitfalls

- **Assuming every word is a top-level key in `probs_table`.** Only words that appear as the *first* element of at least one bigram get a row — see "the unseen-context problem" above.
- **Confusing `probs_table[word]` with `probs_table[word][other_word]`.** The first is a whole distribution (a dict); the second is a single probability (a float). Forgetting which one you have leads to confusing `TypeError`s down the line.
- **Building the counts table and probability table in the same pass.** Keeping `bigram_counts` and `bigram_probabilities` as two separate functions (rather than merging them) means you still have the raw counts available afterward — useful for sanity-checking, and for Week 5's timing experiment, which cares about the *counting* step specifically.

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

<Challenge id="python101-hard-w3-c5" answer={<>Use the next_word_distribution helper: call it with a word you know is never a top-level key (e.g. a word that only ends sentences), and confirm it returns None instead of raising a KeyError, then handle that None case explicitly wherever you call it.</>}>

Use `next_word_distribution` to safely look up a word you already identified in Challenge 3 as never starting a bigram. Confirm it returns `None` instead of crashing.

</Challenge>

<Challenge id="python101-hard-w3-c6" answer={<>For each key in the bigram counts table, sum its inner dict's values to get that word's total bigram occurrences, and compare it to that same word's count from Week 2's unigram counts dict -- they should match exactly, since every occurrence of a word (except possibly the very last word of a sentence) starts exactly one bigram.</>}>

For a word that appears in *both* Week 2's unigram `counts` and this week's `bigram_counts`, compare its unigram count to the sum of its bigram row's values (`sum(bigram_counts[word].values())`). Should these match? Check a few words and explain any small discrepancies you find.

</Challenge>

## 🤔 Socratic Questions

- Look up `probs_table["the"]` and compare it to last week's overall `probs`. Are they the same distribution? What does that tell you about whether "the" changes what's likely to come next?
- A trigram model (conditioning on the previous *two* words) captures more context than a bigram model. Given how small our 20-sentence corpus is, what practical problem do you predict trigram counts would run into that bigram counts mostly avoid?
- `bigram_probabilities` builds one full probability distribution *per word* in the vocabulary. If the vocabulary has $V$ distinct words, roughly how many numbers could the full bigram table contain in the worst case (every word following every other word at least once)? What does that suggest about how table size scales with vocabulary size?
- The unseen-context problem means a bigram model can be completely silent about words it never saw start a bigram. Can you think of a way to make the model *always* have something to say, even for an unseen word — perhaps by falling back to something from last week?
- Challenge 6 asks you to compare unigram counts to summed bigram counts. For most words these match, but the very *last* word of a sentence is systematically undercounted by one in the bigram version. Why exactly one, and why only the last word?

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
    {
      id: 'q5',
      prompt: 'A word that never appears as the FIRST element of any bigram in the corpus is:',
      options: [
        'Automatically assigned probability 0 for every possible next word',
        'Missing entirely as a top-level key in probs_table',
        'Still included, with an empty distribution {}',
        'Impossible -- every word starts at least one bigram',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

<ProgressCheckbox weekId="python-101-hard-week-3" />
