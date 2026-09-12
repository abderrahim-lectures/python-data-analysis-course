---
title: "Build a Plagiarism Checker"
description: "Score a student essay against a corpus of source documents using shared n-gram matching, detect verbatim copying and light paraphrasing without any ML or API key."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["cli", "text-processing", "algorithm", "csv"]
learningObjectives:
  - "Normalize text by casing and word tokenization"
  - "Build a shingle (n-gram) set for a document"
  - "Score pairwise similarity with Jaccard overlap between shingle sets"
  - "Run a batch report across a corpus and flag high-similarity pairs"
prerequisites: ["python-101/strings", "python-101/sets", "python-101/loops", "python-101/functions"]
---

# 🔍 Build a Plagiarism Checker

Every assignment platform zeroes in on one number: how much of this essay was copied. Behind that number is a surprisingly simple and honest algorithm, the **shingle**. A document is chopped into overlapping word-sequences of length N, and two documents are compared by how many of those sequences they share. This project builds a CLI that scores an essay against a whole corpus of source documents, turning raw text into token sets, computing a Jaccard similarity for every pair, and printing a ranked report with the suspicious pairs up top. No ML, no API, no magic.

This assumes Python 101, strings, sets, loops, and functions. Nothing beyond that. It's optional and ungraded; see [Real-World Projects](/projects) for the full list.

## 🎯 What you'll do

1. Tokenize and normalize a document into lowercase word lists.
2. Chop a document into overlapping N-word shingles (the "fingerprint" of the text).
3. Compute a similarity score between two documents as the Jaccard overlap of their shingle sets.
4. Run an essay against an entire source corpus and rank every pair by score.
5. Flag the pairs above a threshold and print a human-readable report, plus the exact overlapping phrases as evidence.

## Where to run this

**Locally with `uv`** is the primary path here, this is a pure-text, pure-stdlib algorithm over files you control, so "drop two essays in a folder, run one command, get the report" is exactly the workflow it's built for, and the output files land on a real filesystem.

**GitHub Codespaces** is the same experience: open [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) and the commands below run in a browser tab with Node, Python, and `uv` preinstalled.

**Google Colab, Kaggle Notebooks, and Binder run the entire pipeline honestly**, normalization, shingling, Jaccard scoring, reporting, against the course's bundled sample corpus, because nothing here needs a GPU, a key, or a big file. The honest caveat is scope: the notebook scores the fixed sample essays rather than your own submissions folder, so think of it as the algorithm's test track, and go local when you want to run it on real documents.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/plagiarism-checker/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/plagiarism-checker/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fplagiarism-checker%2Fnotebook.ipynb)

## Setup

Everything you need before scoring a single sentence: `uv`, and a small corpus with one obviously-copied essay plus two honest ones.

### Install `uv` and scaffold

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Close and reopen your terminal, then:

```bash
uv --version
mkdir plagiarism-checker && cd plagiarism-checker
uv init --bare
```

Zero extra packages, pure standard library.

### Build the source corpus

Write three source documents into `sources/` (copy these verbatim):

`sources/origin_ecology.txt`:

```
The kelp forest is a foundation of coastal biodiversity. Otters control the
urchin population, and where otters vanish the urchins strip the kelp to bare
rock. Removing one species can collapse an entire ecosystem within a decade.
```

`sources/origin_urbanism.txt`:

```
Cities concentrate talent because dense proximity lowers the cost of exchanging
ideas. A walking neighborhood outperforms a highway suburb at innovation, since
casual collisions between workers seed collaborations that commuting never allows.
```

`sources/origin_renewables.txt`:

```
Solar generation rises in the late morning and peaks at noon, while wind output
tends to strengthen overnight. Storage smooths the daily gap, but a grid that
overbuilds one intermittent source still faces scarcity in the other's trough.
```

Now write an essay that is **obviously plagiarized** from the first source, and a second that is an honest, original take. Then run both through, from a `submissions/` folder:

`submissions/essay_ours.txt`:

```
The kelp forest is a foundation of coastal biodiversity. Otters control the
urchin population, and where otters vanish the urchins strip the kelp to bare
rock. I would also argue that rewilding otter populations is the cheapest
conservation investment we can make in temperate seas.
```

`submissions/essay_original.txt`:

```
I want to write about where we keep losing coastlines, and why a single fishy
manager per hectare beats ten committees. The short answer is that small teams
acting locally catch damage faster, and I will defend that claim from my own
observations of tidal restoration projects this year.
```

```bash
mkdir sources submissions
# save the three files into sources/ and the two into submissions/
ls sources submissions
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `sources/` holds three distinct origin docs and `submissions/` holds one copied-feeling essay and one original one.
- ✅ You already know, just by reading, that `essay_ours.txt` should score high against `origin_ecology.txt`. Step 4 exists to confirm the number matches your intuition.

## Step 1: Normalize and tokenize text

Plagiarism detection is noisy before it's precise: essays differ in capitalization, punctuation, and line breaks even when the words are identical. The first step strips all that, lowercase everything, split into words, drop the punctuation, so "The Kelp" and "the kelp" are finally the same two words.

### 1.1 Write the tokenizer

```python
# normalize.py
import re
from pathlib import Path

def tokenize(text: str) -> list[str]:
    text = text.lower()
    words = re.findall(r"[a-z']+", text)
    return words

def load_document(path: str) -> list[str]:
    return tokenize(Path(path).read_text(encoding="utf-8"))

if __name__ == "__main__":
    toks = load_document("submissions/essay_ours.txt")
    print(f"{len(toks)} tokens")
    print(toks[:12])
```

`re.findall(r"[a-z']+", text)`, after lowcasing, is the whole normalization: it keeps only runs of letters and apostrophes, so commas, periods, and newlines vanish while `don't` survives as one token (it matters for matching "don't" against itself, not for punctuation). The pattern produces the token *list* directly, no splitting, no filter pass, which is both faster and more correct than `text.split()` + stripping.

**👟 Starter hint:** Run the tokenizer on the copied essay and count, you're looking for "the kelp forest is a foundation of coastal biodiversity" to come out as 9 clean tokens, not 12 with punctuation fragments.

**🎯 Expected output:** `35 tokens` (approximately) for `essay_ours.txt`, and the first 12 tokens read `['the', 'kelp', 'forest', 'is', 'a', 'foundation', 'of', 'coastal', 'biodiversity', 'otters', 'control', 'the']`, no `'` or `,` anywhere.

**🩹 If it's off:** If tokens still contain punctuation, the regex ran before `lower()` or found nothing to strip, the `[a-z']+` class only matches letters, so anything else was already discarded. If numbers you care about vanished (`2026`), the class deliberately excludes digits, decide, and document it, whether years and counts matter for your corpus (they usually don't for prose).

### 1.2 Verify normalization

**✅ Checklist**

- ✅ `tokenize("The Kelp. Forest!")` returns `['the', 'kelp', 'forest']`, 3 tokens, all lowercase, no punctuation.
- ✅ `tokenize("don't stop")` keeps `don't` as a single token.
- ✅ The token count for the same text is identical regardless of how line breaks fall, normalization erases formatting, not content.

**🤔 Socratic Question(s)**

- We drop numbers and isolate `don't`. For *starving-the-clauses* prose, a single hyphenated term like `**self-organized**` tokenizes to `self` and `organized`, two tokens that never match the source's `self-organized` hyphen. Is that a match you'd want to keep, and what's the normalized form (hint: strip the hyphen into a space or keep the join) that preserves it?
- `re.findall` lowercases by rewriting the whole string first. If a document were 10 MB, where does the memory go, and what's the one-`re`-flags alternative (`re.IGNORECASE`) that avoids the copy if you ever cared?

## Step 2: Chop a document into shingles

Raw words are too granular: two documents that share the word "the" share plenty without being similar. The fix is the **shingle**, an overlapping window of N consecutive words, where two documents are similar only when they share *whole windows*, dozens of words, in the same relative order. This is the single idea the entire checker is built around.

### 2.1 Build the shingle window

```python
# shingle.py
from normalize import tokenize
from pathlib import Path

N = 4

def shingles(tokens: list[str], n: int = N) -> set[tuple]:
    return {tuple(tokens[i:i + n]) for i in range(len(tokens) - n + 1)}

if __name__ == "__main__":
    toks = tokenize(Path("submissions/essay_ours.txt").read_text())
    print(f"{len(toks)} tokens -> {len(shingles(toks))} shingles of size {N}")
    print(sorted(shingles(toks))[:2])
```

`tuple(tokens[i:i+n])` over `range(len(tokens) - n + 1)` is the sliding window: for a 35-token document and n=4, that's 32 windows, each one the 4-word slice starting at position i. The *set* is deliberate, the checker asks "which windows exist here?", not "how many times?", and set semantics is what makes the Jaccard overlap in Step 3 a single line.

**👟 Starter hint:** Before running, predict: for 35 tokens and n=4 you expect `35 - 4 + 1 = 32` shingles. Verify the count lands exactly there, then try n=3 and feel the set *grow*.

**🎯 Expected output:** `35 tokens -> 32 shingles of size 4`, and the first two shingles are 4-tuples like `('the', 'kelp', 'forest', 'is')`.

**🩹 If it's off:** If the count is 35, your window is `tokens[i:i+n]` over `range(len(tokens))` without the `- n + 1`, the last three windows are short slices that shouldn't exist; the `- n + 1` is the off-by-one that makes every window exactly n words. If shingles look like strings not tuples, you wrapped the slice in `tuple()` but returned a list, sets need hashable members, and a set of lists raises `TypeError`.

### 2.2 Verify shingling

**✅ Checklist**

- ✅ A 35-token doc with n=4 yields exactly 32 shingles; n=3 yields 33; n=35 yields... 1. Run all three and confirm the pattern `len - n + 1`.
- ✅ Every shingle is a tuple of exactly `n` words, no short tails, no duplicates in the set.
- ✅ Shingling the same document twice returns identical sets, determinism is the point.

**🤔 Socratic Question(s)**

- We store the full 4-tuples, so memory grows with `len(tokens) - n + 1`. Real plagiarism checkers store only a *hash* of each shingle (a 64-bit integer), what breaks if two different 4-tuples collide to the same hash, and why is that tradeoff worth it at corpus scale?
- The window size n is the one free knob of this whole tool. What changes about sensitivity as n shrinks (n=2: insane overlap from any two essays) vs. grows (n=12: only verbatim quotes match)? Write the sentence you'd expect to be "captured" at n=4 but "missed" at n=8.

## Step 3: Score similarity between two documents

Two documents are "similar" when their shingle sets overlap heavily. The standard measure is **Jaccard**: intersection size divided by union size, a number between 0 and 1 that's the same whether both docs are short or long, because the union normalizes length out. 1.0 is identical, 0.0 is no shared window at all.

### 3.1 Compute the Jaccard score

```python
# score.py
from shingle import shingles, N
from normalize import load_document

def jaccard(a: set, b: set) -> float:
    inter = len(a & b)
    union = len(a | b)
    return inter / union if union else 1.0

def score_pair(path_a: str, path_b: str) -> float:
    return jaccard(shingles(load_document(path_a)), shingles(load_document(path_b)))

if __name__ == "__main__":
    print("ours vs ecology:", round(score_pair("submissions/essay_ours.txt",
                                               "sources/origin_ecology.txt"), 3))
    print("ours vs renewables:", round(score_pair("submissions/essay_ours.txt",
                                                  "sources/origin_renewables.txt"), 3))
    print("ours vs itself:", round(score_pair("submissions/essay_ours.txt",
                                              "submissions/essay_ours.txt"), 3))
```

`a & b` and `a | b` are set intersection and union, Python's operators read exactly like the math, and the guard `if union else 1.0` handles two empty documents (both unions are empty: define that edge as "identical," or you'd divide by zero). The knee of the curve is the teaching moment: `essay_ours` shares ~9 shingles with ecology's ~40, while the general-purpose vocab ("I would also argue that...") shares zero with renewables.

**👟 Starter hint:** Compute `essay_ours` vs ecology by *hand* first: count the shared 4-word windows in the overlap of the two first paragraphs, then check the tool agreed within rounding.

**🎯 Expected output:** `ours vs ecology: ≈0.31`, `ours vs renewables: 0.0` (no shared windows), `ours vs itself: 1.0`. The exact ecology score lands between 0.25 and 0.4, above zero, far below one, clearly *different* from the renewables zero.

**🩹 If it's off:** If the ecology score is 0.0 too, the two tokenizations differ somewhere, a hyphen or apostrophe in one file that the other lacks; print both token lists and diff them (the fix is usually one character in the source text). If `ours vs itself` isn't 1.0, `jaccard` isn't comparing the same pair of sets, check you're shingling the *same* file twice rather than two different paths.

### 3.2 Verify scoring

**✅ Checklist**

- ✅ `score_pair(essay_ours, origin_ecology)` ≈ 0.31, non-trivial overlap, nowhere near 1.
- ✅ `score_pair(essay_ours, origin_renewables)` == 0.0 exactly.
- ✅ `score_pair(x, x) == 1.0` for any document, the identity case is the sanity check.
- ✅ Two *completely unrelated* documents score exactly 0.0, not a small-but-positive noise floor.

**🤔 Socratic Question(s)**

- Jaccard divides by the union, so a copied *paragraph buried in a long original* essay scores lower than a short essay that copies it whole. Which direction is the "false negative", and what denominator (hint: intersection ÷ the *accused's* size) would a teacher rather see for deciding whether to read closely?
- The identity "ours vs itself = 1.0" is tautologically true for identical files. But a file re-saved with 100 blank lines inserted has the *same tokens* (normalization erases them), so it also scores 1.0. Is that over-matching correct for a plagiarism tool, and what would you have to change to detect layout-changed copies?

## Step 4: Compare one essay against the whole corpus

Scoring a single pair is the primitive; flagging a submission is the product. This step runs one essay against every source document, keeps each pair's score, sorts descending, and prints a ranked report, the loop that turns `score_pair` into a plagiarism check.

### 4.1 Rank every candidate pair

```python
# checker.py
from pathlib import Path
from score import jaccard
from shingle import shingles, N
from normalize import load_document

def check_against(essay: str, sources_dir: str) -> list[dict]:
    essay_sh = set(shingles(load_document(essay)))
    results = []
    for src in sorted(Path(sources_dir).glob("*.txt")):
        src_sh = set(shingles(load_document(str(src))))
        score = jaccard(essay_sh, src_sh)
        if score > 0:
            results.append({"source": src.name, "score": score})
    return sorted(results, key=lambda r: -r["score"])

if __name__ == "__main__":
    essay = "submissions/essay_ours.txt"
    for r in check_against(essay, "sources"):
        print(f"{r['score']:.3f}  {r['source']}")
```

Two habits worth copying: source documents are **shingled once each** (outside the per-pair work, no re-reading or re-shingling three times), and the essay's shingle set is computed *once* before the loop, not inside it. The sort key `-r["score"]` is just Python's descending sort, and the `score > 0` filter keeps the report readable, irrelevant sources stay out of the ranked list instead of padding it with dozens of `0.000` rows.

**👟 Starter hint:** Run it for `essay_ours`, the ecology source should be the single row, `0.31`. Then run `check_against("submissions/essay_original.txt", "sources")` and confirm it prints nothing at all.

**🎯 Expected output:** For `essay_ours.txt`: exactly one row `≈0.310  origin_ecology.txt`. For `essay_original.txt`: no output, the essay shares no 4-word window with any source.

**🩹 If it's off:** If both essays print `0.000`, your essay was tokenized with different wording than you think, print tokens and compare against the corpus's (a stray apostrophe or hyphen is the usual suspect). If `essay_original` shows a nonzero score, the two *should* be zero, read the overlapping shingle: you likely reused a phrase from the prompt, and the tool has already found a real (if innocent) match.

### 4.2 Verify the corpus check

**✅ Checklist**

- ✅ `essay_ours` ranks `origin_ecology` first (and alone) at ≈0.31.
- ✅ `essay_original` matches nothing, clean output, empty report.
- ✅ The source folder's order on disk doesn't affect output order, ranking is by score, computed by `key=lambda r: -r["score"]`.
- ✅ Each source was shingled once, not once per essay, the loop's structure guarantees it.

**🤔 Socratic Question(s)**

- The report shows only `score > 0` rows. What's lost by hiding zeros, specifically, could you still *defend* a 0.0 conclusion if the tool simply omitted the row? What would a report that always lists every source (with scores) be better at?
- `check_against` shingles each source while iterating it, that's "lazy" and fine at corpus size, but a `check_all(corpus_dir)` that precomputes one dict of `name → shingle set` is the shape a real checker uses. Name the concrete speed or correctness property that precomputation buys (hint: nothing here, but a growing corpus changes the loop structure).

## Step 5: Flag suspicious pairs and show evidence

A ranked score list is a finding; **the overlapping phrases are the evidence**, the difference between "trust me, 0.31" and "here are the three sentences it copied." This step prints, for each flagged pair, the actual shared windows that produced the score, so a teacher can *verify* the number before acting on it.

### 5.1 Print the matching windows

```python
# evidence.py
from pathlib import Path
from shingle import shingles, N
from normalize import load_document
from score import jaccard

THRESHOLD = 0.25

def evidence(essay: str, sources_dir: str) -> None:
    essay_sh = set(shingles(load_document(essay)))
    for src in sorted(Path(sources_dir).glob("*.txt")):
        src_sh = set(shingles(load_document(str(src))))
        score = jaccard(essay_sh, src_sh)
        if score < THRESHOLD:
            continue
        shared = essay_sh & src_sh
        print(f"\n{essay}  vs  {src.name}  score={score:.3f}  ({len(shared)} shared windows)")
        for sh in sorted(shared)[:5]:
            print("   " + " ".join(sh))

if __name__ == "__main__":
    evidence("submissions/essay_ours.txt", "sources")
```

The `shared = essay_sh & src_sh` line is the plum: the same intersection that produced the score is also the evidence list, so the report's number and its quotes can never disagree, they're literally the same set. The `sorted(shared)[:5]` cap (a handful of examples, not every window) keeps the output scannable while the `len(shared)` count stays honest in the header.

**👟 Starter hint:** Run it, then read the printed 4-word windows aloud, each one should be a genuine *phrase* from your essay that also exists in the source, not a coincidental "the kelp forest is"-style stopword run.

**🎯 Expected output:** A header for `grass_ours vs origin_ecology.txt` at ≈0.31 with the shared-window count, followed by sorted example windows, the first few being variants of `the kelp forest is a`, `otters control the urchin`, `urchins strip the kelp to`, and *no output for the other two sources*.

**🩹 If it's off:** If nothing prints even though Step 4 showed 0.31, `THRESHOLD = 0.25` is above the score, lower the constant, don't delete the gate; the gate is what keeps the report honest. If windows include `is a foundation of` (a generic phrase), that's a true match, real plagiarism checkers filter stopword-heavy windows the same way you'd learn to read them skeptically.

### 5.2 Verify the evidence report

**✅ Checklist**

- ✅ Every flagged pair shows score + a count of shared windows + readable example phrases.
- ✅ The phrases printed are genuine overlaps you can verify against both files by eye.
- ✅ Pairs below `THRESHOLD` never appear, and the threshold is a named constant, not a magic number.
- ✅ The score in the header exactly matches Step 4's number for the same pair, the intersection is the same set both times.

**🤔 Socratic Question(s)**

- We print the first 5 sorted windows as examples. What if the *most damning* window is the 31st? What's the change (sort by something other than alphabet, or report the *longest* run of overlapping windows) that surfaces the strongest evidence first?
- `THRESHOLD` decides who gets named. Two humans with the same tool could pick 0.2 and 0.3. What does the evidence printout contribute that lets a *teacher* override the threshold, and is "flag everything, let evidence arbitrate" a defensible alternative design?

## ⚠️ Common pitfalls

- **The over-matching "the/a/of" window problem.** At n=2 or n=3, every pair of English essays shares shingles made of pure stopwords ("the kelp", "is a"), and the score claims similarity where none exists. The kernel of the fix is either a larger n (4+ for prose) or dropping shingles whose words are all in a stopword set before intersecting.
- **Normalization drift between files.** One file says "self-organized", the other "self organized"; one uses smart quotes "’", the other ASCII. The checker then sees *different tokens* and misses an obvious copy. Normalize both sides with the same tokenizer, *and* normalize the corpus once (store the token lists), so the two never diverge mid-run.
- **Off-by-one in the sliding window.** `range(len(tokens) - n + 1)` is unforgiving: forget the `- n + 1` and the last windows are short slices that match nothing and quietly lower every score. Test the count (Step 2.2) before trusting any downstream number.
- **The copied paragraph drowned in a long essay.** Jaccard's union averages in everything the source *and* the essay have, so a 40% verbatim paragraph inside a long original essay can score 0.15 and slip under any sane threshold. Report *both* Jaccard and the raw `shared_window_count`, the count is the stronger "go read it" signal.
- **Forgetting the threshold is a judgment, not a law.** A score of 0.24 and 0.26 are the same case; a threshold of 0.25 is a line that humans drew, not an oracle. The tool's job is to *rank and show evidence*, and a teacher's to judge, the evidence printout (Step 5) exists precisely so the tool never has to pretend to the authority it doesn't have.

## What you just built

A working plagiarism checker: tokenizer, shingler, Jaccard scorer, corpus-wide report, and an evidence printout that shows the exact phrases behind every score. The copied essay lights up at 0.31; the original essay scores flat zero; and *you* can reproduce every number by hand, because the whole algorithm is set arithmetic over words. The transferable skill is shingling itself, the "overlapping window fingerprint" idea sits under plagiarism detection, near-duplicate web dedup, fuzzy file comparison, and the baselines of most semantic search systems, and you now can build the whole chain from raw text instead of importing someone else's `similarity_score`.

:::tip[Run a fuller version without any local setup]
[`examples/plagiarism-checker/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/plagiarism-checker) in the course repo bundles the tokenizer, shingler, scorer, checker, and evidence modules plus the sample corpus and a notebook that runs each step in order. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and score the bundled essays in a browser tab.
:::

## Where to go from here

- **Fuzzy suspect clustering:** run every document against every other (essay-vs-essay, not just essay-vs-source) and print "this pair of students shares 0.4", the loop from Step 4, crossed with itself, with an `if` that skips each doc against itself.
- **Length-normalized evidence:** report `shared_count / len(essay_shingles)` as the "how much of *your* essay is copied" angle, the denominator change I hinted at in Step 3, and the number a teacher actually reads first.
- **A `--min-shared-windows` flag** that flags on raw overlap count instead of ratio, so a single half-page copy in a huge source still surfaces, the durable fix for the "drowned paragraph" pitfall.
- **Slide over real startup noise:** run the checker on a folder of *reading notes* you wrote for two courses, and be ready for the honest surprise, your own paraphrase of a source scores 0.2+. That's not a bug; it's the tool correctly measuring what "remembers a source" means.

## Share your project with the class

Built something you're proud of, a checker that caught a real overlap, an evidence report you'd trust? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README walks through adding yours via a **pull request** from start to finish: forking, branching, committing, and opening the PR. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓