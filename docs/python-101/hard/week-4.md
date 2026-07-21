---
title: "Week 4: Generating Text"
sidebar_position: 4
section: python-101
track: hard
week: 4
description: "Generate text by sampling from bigram probabilities with random.choices, completing your tiny language model's core loop."
---

import Challenge from '@site/src/components/Challenge';
import ProgressCheckbox from '@site/src/components/ProgressCheckbox';
import WeeklyQuiz from '@site/src/components/WeeklyQuiz';
import BonusContent from '@site/src/components/BonusContent';

# Week 4: Generating Text by Sampling

<span className="gamified-flourish">🎰 A probability table is potential energy. This week you spend it — actually generating new sentences, word by word.</span>

## 🎯 Learning objectives

By the end of this week you can:
- Explain the difference between *always picking the most likely next word* and *sampling* from the distribution.
- Use `random.choices` to sample a next word weighted by bigram probabilities.
- Write a `generate_text()` function that produces a new sentence, one word at a time, from the bigram table.
- Make random generation reproducible with `random.seed`, when that's useful.

## Lesson

### Two ways to pick the "next" word

Given `probs_table["the"] = {"cat": 0.35, "dog": 0.3, "mouse": 0.1, "mat": 0.15, ...}`, there are two different strategies for choosing what comes next:

1. **Greedy**: always take the single most likely word (`"cat"`, at 35%). This is deterministic — the same input always produces the same output — and quickly gets repetitive, since the highest-probability word after "cat" is probably always the same too.
2. **Sampling**: pick a word *at random*, but weighted by its probability — so `"cat"` is picked about 35% of the time, `"dog"` about 30%, and so on, matching a weighted die roll where each face has a different-sized area, exactly like sampling from any discrete distribution $P(w)$.

This week uses sampling, because it's what makes generated text vary from run to run — the same reason a language model doesn't give you the identical response every single time you ask it the same question.

### Sampling with `random.choices`

Python's `random.choices(population, weights)` implements exactly this: given a list of possible outcomes and a matching list of weights, it returns one outcome chosen with probability proportional to its weight.

```python
import random

def sample_next(word, probs_table):
    if word not in probs_table:
        return None   # no known continuation — dead end
    next_words = list(probs_table[word].keys())
    weights = list(probs_table[word].values())
    return random.choices(next_words, weights=weights, k=1)[0]

sample_next("the", probs_table)   # e.g. "cat" — but not every time
```

`weights` don't need to sum to exactly 1 for `random.choices` to work correctly (it normalizes internally) — but ours already do, since they came straight from last week's `bigram_probabilities`.

### Reproducibility with `random.seed`

Randomness is exactly what we want for variety, but it makes debugging and sharing results awkward — "it generated a weird sentence" is hard to investigate if you can't reproduce the exact same run. `random.seed(n)` fixes Python's random number generator to a specific starting point, so every `random.choices(...)` call after it becomes deterministic *for that run*:

```python
random.seed(42)
print(generate_text(probs_table, "the"))   # always the same output, every time you run this

random.seed()   # re-randomizes, back to normal unpredictable behavior
```

This is a general technique, not specific to language models — any time you need "random, but reproducible for testing," `random.seed` is the tool.

### Generating a whole sentence

Starting from a seed word, repeatedly sample the next word and feed it back in as the new "previous word" — a loop, stopping either at a fixed length or when `sample_next` hits a dead end:

```python
def generate_text(probs_table, start_word, max_words=10):
    words = [start_word]
    current = start_word
    for _ in range(max_words - 1):
        next_word = sample_next(current, probs_table)
        if next_word is None:
            break
        words.append(next_word)
        current = next_word
    return " ".join(words)

generate_text(probs_table, "the")
# e.g. "the cat sat on the rug" — will differ run to run
```

This is the generative core of the whole language model: nothing but repeated weighted sampling from a table built out of counting. It's a real, working (if very weak) language model — genuinely the same *idea* as the next-token sampling loop inside far larger models, just estimated from 20 sentences of counting instead of billions of parameters trained on huge datasets.

### Generating several candidates at once

Because each call to `generate_text` is random, generating several sentences and looking them over is a natural way to explore what the model can produce — the same "sample a few, pick the best" pattern used when working with any generative system:

```python
def generate_many(probs_table, start_word, n=5, max_words=10):
    return [generate_text(probs_table, start_word, max_words) for _ in range(n)]

for sentence in generate_many(probs_table, "the", n=5):
    print(sentence)
```

## ⚠️ Common pitfalls

- **Forgetting to check for `None` from `sample_next`.** If `generate_text` didn't check `if next_word is None: break`, it would crash the next time it tried to look up `None` as a key in `probs_table`.
- **Assuming `random.choices` needs weights that sum to exactly 1.** It doesn't — it normalizes whatever weights you give it. This matters if you ever pass in raw counts instead of already-normalized probabilities.
- **Forgetting `random.seed()` (no argument) re-randomizes.** After debugging with a fixed seed, forgetting to call `random.seed()` again means every subsequent "random" call in that session stays deterministic, which can look like a bug in unrelated code.
- **Expecting grammatically perfect output.** A bigram model has no concept of subject-verb agreement, sentence-level meaning, or anything beyond "what usually follows this one word" — this is a genuine limitation, not a bug to fix, and it's exactly what the Socratic Questions below ask you to notice directly.

## 🧩 Challenges

<Challenge id="python101-hard-w4-c1" answer={<>Call <code>generate_text(probs_table, "the")</code> five times in a row and print each result — since sampling is random, you should see at least some different sentences even with the exact same starting word.</>}>

Call `generate_text` five times with the same `start_word`. Are the outputs identical? Why or why not?

</Challenge>

<Challenge id="python101-hard-w4-c2" answer={<>Pick a word that never starts a bigram in the corpus (e.g. a word that only ever appears as the last word of a sentence) as <code>start_word</code>; <code>sample_next</code> will immediately return <code>None</code> since that word isn't a key in <code>probs_table</code>, so <code>generate_text</code> returns just that one seed word.</>}>

Call `generate_text` with a `start_word` that never appears as the *first* word of a bigram anywhere in the corpus (you found candidates for this in last week's Challenge 3). What happens, and why?

</Challenge>

<Challenge id="python101-hard-w4-c3" answer={<>Add a check: if <code>next_word == current</code> repeatedly (e.g. track the last few words in a small list/deque and break if the same word repeats more than, say, 3 times in a row), stop generation early. This won't happen often on this small corpus, but it's a real failure mode of naive sampling loops on larger ones.</>}>

Modify `generate_text` so it stops early if the same word gets picked 3 times in a row (a simple guard against repetitive loops). Under what corpus conditions do you think this could actually happen?

</Challenge>

<Challenge id="python101-hard-w4-c4" answer={<>Change <code>sample_next</code> to pick <code>max(probs_table[word], key=lambda w: probs_table[word][w])</code> instead of <code>random.choices</code> — this is the "greedy" strategy from the lesson. Calling <code>generate_text</code> repeatedly with the same start word will now always produce the exact same sentence.</>}>

Write a `sample_next_greedy(word, probs_table)` that always picks the single *most likely* next word instead of sampling randomly. Run `generate_text` (using this greedy version) five times with the same start word — what do you notice?

</Challenge>

<Challenge id="python101-hard-w4-c5" answer={<>Call random.seed(1), then generate_text(...), then random.seed(1) again, then generate_text(...) with the same arguments -- the two outputs should be identical, since resetting to the same seed replays the exact same sequence of "random" choices.</>}>

Call `random.seed(1)` before generating a sentence, note the result, then call `random.seed(1)` again before generating another sentence with the same arguments. Are the two results identical? Why?

</Challenge>

<Challenge id="python101-hard-w4-c6" answer={<>Use generate_many to produce, say, 20 sentences, then pick the one with the most words (using max(..., key=len) on the split sentences, or comparing len(sentence.split())) as a simple proxy for "most developed" output.</>}>

Using `generate_many`, generate 20 candidate sentences from the same start word, then print whichever one is *longest* (has the most words).

</Challenge>

## 🤔 Socratic Questions

- Sampling introduces randomness on purpose. Can you think of a real-world use case for a language model where you'd actually *want* the greedy, always-the-same-answer behavior instead?
- `sample_next` returns `None` when the current word has no known continuation. What real-world analogy does this "dead end" have — is it more like the model being uncertain, or the model having literally never seen this situation before?
- This bigram model can only ever generate word sequences that are *statistically plausible given single-word transitions* — it has no concept of the sentence "making sense" as a whole. Generate several sentences and look for ones that are grammatically odd or nonsensical despite each individual word pair being locally plausible. What does this suggest about the limits of only ever looking one word back?
- `random.seed` makes a random process reproducible for debugging, but real applications of language models (like a chatbot) usually don't fix the seed. Why might *not* fixing it be the right choice there, even though it makes bugs harder to reproduce?

## ✅ Weekly quiz

<WeeklyQuiz
  weekId="python-101-hard-week-4"
  questions={[
    {
      id: 'q1',
      prompt: 'What does random.choices(population, weights=weights) do?',
      options: [
        'Always returns the highest-weighted item',
        'Returns items with probability proportional to their weight',
        'Returns every item exactly once, in a random order',
        'Ignores the weights and picks uniformly at random',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q2',
      prompt: 'Why does calling generate_text() multiple times with the same start word give different results?',
      options: [
        'It is a bug',
        'probs_table changes between calls',
        'sample_next uses random sampling, not a fixed greedy choice',
        'Python dicts are unordered',
      ],
      correctOptionIndex: 2,
    },
    {
      id: 'q3',
      prompt: 'sample_next returns None when:',
      options: [
        'The weights do not sum to 1',
        'The given word is not a key in probs_table (no known continuation)',
        'max_words is reached',
        'random.choices always eventually returns None',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q4',
      prompt: 'The "greedy" next-word strategy differs from sampling because it:',
      options: [
        'Is faster but otherwise identical',
        'Always picks the single most likely word, so it is deterministic',
        'Picks uniformly at random ignoring probabilities',
        'Only works with unigram models, not bigram models',
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'q5',
      prompt: 'What does random.seed(42) do?',
      options: [
        'Generates exactly 42 random numbers',
        'Fixes the random number generator so subsequent random calls become reproducible',
        'Sets the maximum value random.choices can return',
        'Has no effect on random.choices',
      ],
      correctOptionIndex: 1,
    },
  ]}
/>

## 🎁 Bonus: error handling for a bad start word

<BonusContent weekId="python-101-hard-week-4">

Right now, calling `generate_text(probs_table, "zzz")` for a word that isn't even in the vocabulary at all quietly returns `"zzz"` — no crash, but also no useful signal that something's off. A more defensive version might raise a clear error instead:

```python
def generate_text_safe(probs_table, start_word, max_words=10):
    if start_word not in probs_table:
        raise ValueError(f"'{start_word}' never appears as a starting word in this corpus")
    try:
        return generate_text(probs_table, start_word, max_words)
    except Exception as e:
        print(f"Generation failed: {e}")
        return start_word
```

This isn't part of the core curriculum, but it's the same `try`/`except` idea Python 101 Normal Week 4 introduced, applied here to a generation pipeline instead of an average calculation. Try triggering the `ValueError` on purpose, and think about where else in this week's `generate_text` a similar guard might be worth adding.

</BonusContent>

<ProgressCheckbox weekId="python-101-hard-week-4" />
