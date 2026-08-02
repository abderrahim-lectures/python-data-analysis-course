---
id: hybrid-search
title: "Build a Hybrid Search Demo (Keyword + Embedding)"
sidebar_label: "Build a Hybrid Search Demo"
slug: /projects/hybrid-search
description: "Run keyword (BM25-style), embedding-based, and hybrid retrieval side by side on the same small corpus, and see where each approach wins and loses — no API key, no LLM."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Build a Hybrid Search Demo (Keyword + Embedding)

<ProjectPublishedDate projectId="hybrid-search" />

<ProjectGreeting />

"Search" sounds like one thing, but underneath it's at least three, and they disagree more often than you'd think. A query like `Neptune planet winds` is trivially easy to match by vocabulary — the words appear verbatim in one passage, so any system that counts word overlaps finds it instantly. A query like `an icy mystery world charted by pure calculation` shares *no words at all* with the corpus, yet a human reads it and knows exactly which passage it's about — a machine can only do that if it understands meaning, not spelling. In this project you'll build a small tool that runs **three retrieval methods side by side on the same ten-passage corpus**: a from-scratch **BM25-style keyword scorer**, **embedding-based semantic search** with `sentence-transformers`, and a **hybrid** that combines both. The payoff is seeing, with your own eyes and real scores, where each approach wins and where it falls flat.

The honest framing — the point of the whole project — is that **there is no "best" retriever in the abstract**. Exact-match and vocabulary queries favor keyword search; paraphrased and synonym queries favor embeddings; hybrid is the best of both because each method carries the queries the other one is blind to. Real systems like web search engines and documentation search run blended ranking for exactly this reason, and this project is a transparent, readable miniature of that same idea.

This assumes Python 101 and comfort with functions and imports; the Data Analysis material helps too, since the embedding math is just vectors and distances. There's **no LLM, no API key, no `.env` file anywhere** — the only download is the small local embedding model, which runs on your own CPU. It's optional and ungraded; see [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Assemble a small corpus of ten short passages, deliberately written so keyword and semantic retrieval disagree — including two *paraphrase* passages that say the same thing as a neighbor without sharing its vocabulary.
2. Write a proper keyword scorer from scratch — a compact **BM25**-style function with inverse document frequency, term-frequency saturation, and length normalization.
3. Embed the corpus once into a matrix of 384-dimensional vectors with `sentence-transformers`, saved to disk so queries don't re-embed it.
4. Add semantic search: embed a query, then rank passages by **cosine similarity** with nothing but `numpy`.
5. Combine the two into a **hybrid** retriever by min-max normalizing each method's scores and taking a weighted average.
6. Run the finished CLI on single queries and on a bundled set of test queries, and read the winners table that shows which method won where.

## Where to run this

**Locally with `uv`** is the primary, recommended path — real Python on your own machine, where the model downloads once and the `data/` folder lives on disk.

**GitHub Codespaces** works great here too: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed, per the repo's `.devcontainer/devcontainer.json`) and run the exact same `uv` commands from a terminal in your browser tab.

**Google Colab or Kaggle Notebooks** are a genuinely easy option too, not just a fallback — this project needs no GPU and no API key, just `pip install`s and pure computation. The ready-made notebook embeds the corpus and test queries inline, so there's nothing to clone or upload:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/hybrid-search/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/hybrid-search/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fhybrid-search%2Fnotebook.ipynb)

A ready-made notebook with all of the code below — including the corpus passages written out inline as Python strings, so there's nothing to upload or clone — is at [`examples/hybrid-search/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/hybrid-search/notebook.ipynb). Click a badge above to launch it directly.

> **opencode** *(optional)* — a free, open-source AI coding agent that runs in your terminal. If you'd rather have an agent write and run this project for you than type the code yourself, install it with `curl -fsSL https://opencode.ai/install | bash` (or `npm install -g opencode-ai`) and point it at this repo with the same API key from Setup below. It's optional — this project's whole point is building it yourself, so treat it as a bonus, not a shortcut.

## Setup

Since there's no API key or `.env` file anywhere in this project, setup is unusually short.

**Install `uv`**, a single tool that replaces the usual "install Python, then install pip, then install a virtual environment tool, then install packages" chain:

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Close and reopen your terminal, then confirm it installed:

```bash
uv --version
```

**Set up a project and install dependencies:**

```bash
uv init hybrid-search
cd hybrid-search
uv add sentence-transformers numpy
```

`sentence-transformers` is the library that turns text into vectors locally, on your own CPU — no API call, no key. `numpy` does the vector math for comparing and combining scores. That's the whole dependency list, and there's no `.env` to create.

## Step 1: Build a corpus where the methods disagree

The demo is only as good as its data: if every query were exact-match, keyword search would "win" everything and the project would teach nothing. You want passages chosen so keyword and semantic retrieval genuinely diverge. Two ingredients make that happen:

- **Rare, distinctive vocabulary.** A passage about `chromatic aberration` or `crema` is found trivially by any lexical scorer, because those words appear nowhere else.
- **Paraphrases without the vocabulary.** A passage that says "the distant ice giant located by calculation" without ever writing the word *Neptune* will be invisible to keyword search but perfectly findable by meaning.

The companion example ships eleven such passages under `data/corpus/`, one `.txt` per passage. Create the folder and add a couple yourself so you own the data:

```bash
mkdir -p data/corpus
```

```text
# data/corpus/neptune.txt
Neptune is the eighth and farthest planet from the Sun, a deep-blue ice giant
with the strongest recorded winds in the solar system. It was discovered in
1846 by astronomers who predicted its position mathematically from
disturbances in the orbit of Uranus, long before any telescope had ever seen it.
```

```text
# data/corpus/paraphrase_neptune.txt
The most distant ice giant in our solar system spins far beyond Saturn and
Uranus. Astronomers located it by working out where a hidden planet must be
to explain a strange wobble in Uranus's motion, then pointed their telescopes
there and found it within a degree of the predicted spot.
```

The second passage is the same story as the first — same ice giant, same calculation, same Uranus wobble — but the word *Neptune* never appears. That pair is the heart of the whole project: an exact-match query finds the first one, a paraphrase query can only find the second by meaning, and you get to watch both happen. Write a handful more passages on topics of your own (the example uses coffee, deep sea, piano, cycling, sourdough, and so on), then load them into a small function that turns the folder into a list of `{"id", "text"}` dicts:

```python
# corpus.py
from pathlib import Path

CORPUS_DIR = Path("data/corpus")


def load_corpus() -> list[dict]:
    """One {"id", "text"} dict per .txt file in data/corpus/, sorted by filename."""
    documents = []
    for path in sorted(CORPUS_DIR.glob("*.txt")):
        documents.append({"id": path.name, "text": path.read_text(encoding="utf-8").strip()})
    return documents
```

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>You have a `data/corpus/` folder with at least eight short `.txt` passages, each one to three sentences.</StepChecklistItem>
<StepChecklistItem>At least one pair of passages describes the same idea — one using the rare vocabulary, one paraphrasing it without those words.</StepChecklistItem>
<StepChecklistItem>`load_corpus()` returns one dict per file with `id` (the filename) and `text` (the full passage).</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Look at the two Neptune passages above. List every word they share, then every word only one of them has. For a keyword scorer, the shared words are "free" matches and the exclusive ones are the signal — which side of that ledger do you think matters more for finding *either* passage?
- The example's paraphrase_espresso passage ("a short, intensely flavored shot...") never writes the word *espresso*. If you didn't know the corpus existed, how many of that passage's words would you expect to appear in *any* other passage? Why does that matter for the keyword-vs-embedding contrast?

## Step 2: Write a BM25-style keyword scorer from scratch

"Keyword search" deserves a real lexical scorer, not `if term in text`. The classic is **BM25**, and its whole idea is three questions you can answer about every query term: *how rare is this term across the corpus* (inverse document frequency), *how often does it appear in this document* (term frequency, with saturation so one word-stuffed document doesn't dominate), and *how long is the document* (length normalization, so a 200-word passage matching a term counts more than a 2,000-word one matching it once).

First, tokenize: lowercase, split on word boundaries, and drop a small stopword list so common filler words ("the", "does", "with") don't give every document a tiny, nearly identical score that muddies the ranking.

```python
# keyword.py
import math
import re
from collections import Counter

import numpy as np

_WORD_RE = re.compile(r"[a-z0-9']+")

STOPWORDS = frozenset("the a an and or of to in on for with at by from is are ...".split())


def tokenize(text: str) -> list[str]:
    """Lowercases text, splits into word tokens, drops stopwords."""
    return [t for t in _WORD_RE.findall(text.lower()) if t not in STOPWORDS]


class KeywordScorer:
    """BM25-ish lexical scoring over the corpus, computed on the fly."""

    K1 = 1.5  # term-frequency saturation
    B = 0.75  # length normalization strength

    def __init__(self, documents: list[dict]) -> None:
        self.doc_ids = [doc["id"] for doc in documents]
        self.lengths = np.array([len(tokenize(doc["text"])) for doc in documents], dtype=float)
        self.avgdl = float(self.lengths.mean())

        self.doc_terms = []
        df: Counter[str] = Counter()  # document frequency per term
        for doc in documents:
            terms = Counter(tokenize(doc["text"]))
            self.doc_terms.append(terms)
            df.update(terms.keys())

        n_docs = len(documents)
        self.idf = {
            term: math.log(1.0 + (n_docs - freq + 0.5) / (freq + 0.5))
            for term, freq in df.items()
        }

    def score(self, query: str) -> np.ndarray:
        """Raw BM25 score per document; higher is better, 0 = no shared vocabulary."""
        scores = np.zeros(len(self.doc_ids))
        for term in set(tokenize(query)):
            idf = self.idf.get(term, 0.0)
            if idf == 0.0:
                continue
            for i, terms in enumerate(self.doc_terms):
                tf = terms.get(term, 0)
                if tf:
                    denom = tf + self.K1 * (1 - self.B + self.B * self.lengths[i] / self.avgdl)
                    scores[i] += idf * (tf * (self.K1 + 1)) / denom
        return scores
```

Read the `idf` formula once, slowly: a term appearing in one document out of ten gets `ln(1 + (10 - 1 + 0.5) / (1 + 0.5)) ≈ ln(7.3) ≈ 2.0`, while a term in nine documents gets `ln(1 + (10 - 9 + 0.5) / (9 + 0.5)) ≈ ln(1.16) ≈ 0.15`. Rare words carry roughly thirteen times more weight — which is exactly why the `paraphrase_neptune.txt` passage, full of common words, scores almost nothing against an exact-match query while `neptune.txt` lights up.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`KeywordScorer(documents).score("Neptune planet winds")` returns an array with a clearly higher value for `neptune.txt` than for any other passage.</StepChecklistItem>
<StepChecklistItem>`score()` on a query with no vocabulary overlap returns all zeros (not a crash).</StepChecklistItem>
<StepChecklistItem>A term that appears in only one passage scores higher per hit than a term in every passage — check `scorer.idf` directly to confirm.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- The `B` parameter blends document length into the denominator. With `B = 0`, what does the `(1 - B + B * length / avgdl)` term become, and what behavior does that remove? Why might that be a bad idea on a corpus with mixed-length passages?
- Why does `score()` iterate over `set(tokenize(query))` instead of the raw token list? What would change — scores, or just runtime — if you counted a repeated query word twice?

## Step 3: Embed the corpus once, locally

An **embedding** is a list of numbers — a vector — representing a piece of text's *meaning*. `all-MiniLM-L6-v2` maps each passage to a point in 384-dimensional space, trained so that similar meanings sit close together and unrelated meanings far apart. The model is small (about 80MB), runs entirely on your CPU, needs no API key, and costs nothing — the same local-embedding move as the [RAG App project](/docs/projects/rag-notes), minus the LLM step at the end.

```python
# build_index.py
import numpy as np
from sentence_transformers import SentenceTransformer

from corpus import load_corpus

MODEL_NAME = "all-MiniLM-L6-v2"
INDEX_PATH = "data/index.npy"


def main() -> None:
    documents = load_corpus()
    print(f"Embedding {len(documents)} documents with {MODEL_NAME}...")
    model = SentenceTransformer(MODEL_NAME)
    embeddings = model.encode([doc["text"] for doc in documents], normalize_embeddings=True)
    np.save(INDEX_PATH, embeddings)
    print(f"Saved {embeddings.shape[0]} x {embeddings.shape[1]} matrix to {INDEX_PATH}")


if __name__ == "__main__":
    main()
```

```bash
uv run python build_index.py
```

You should see `Saved 11 x 384 matrix to data/index.npy` (or your own passage count). `normalize_embeddings=True` scales every vector to length 1 — that's what makes Step 4's cosine similarity reduce to a single dot product. `data/index.npy` is generated, so it's gitignored; re-run this step any time you add or edit a passage.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python build_index.py` runs without errors and prints a matrix whose first dimension is your passage count and second is 384.</StepChecklistItem>
<StepChecklistItem>`data/index.npy` exists on disk (and is listed in your `.gitignore`).</StepChecklistItem>
<StepChecklistItem>Embedding the corpus twice and comparing the two saved matrices gives near-identical numbers (deterministic enough to trust).</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Why save the embeddings to a file at all instead of re-embedding every passage every time you ask a question? Where does that tradeoff break down — at what corpus size would you stop caring?
- The model was trained long before this project existed, so it has never seen your passages. How can its vectors still "know" that the two Neptune passages mean the same thing when they share almost no words?

## Step 4: Semantic search with cosine similarity

To answer a query, embed it with the *same* model, then rank every passage by how close its vector is to the query's vector. The standard closeness measure is **cosine similarity** — the cosine of the angle between two vectors, which cares about direction (meaning) and ignores magnitude (roughly, text length):

$$
\text{cosine\_similarity}(a, b) = \frac{a \cdot b}{\|a\| \, \|b\|}
$$

Because every vector was already normalized to length 1 when it was saved, the denominator is 1 and cosine similarity collapses to a plain dot product — one line of `numpy`:

```python
# semantic.py
import numpy as np
from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"
INDEX_PATH = "data/index.npy"

_model = None  # loaded lazily so importing this module doesn't download 80MB


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def semantic_scores(query: str, embeddings: np.ndarray) -> np.ndarray:
    """Cosine similarity of the query against every document embedding."""
    query_vector = get_model().encode([query], normalize_embeddings=True)[0]
    return embeddings @ query_vector
```

`embeddings @ query_vector` is matrix-vector multiplication: every row of the matrix dotted with the query vector, all at once, in one NumPy call. Try it on both sides of the Neptune pair and the contrast is immediate — the exact-match query scores high on `neptune.txt`, while a paraphrase like *"an icy mystery world charted by pure calculation"* scores high on `paraphrase_neptune.txt`, because the model reads meaning, not spelling.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`semantic_scores("Neptune planet winds", embeddings)` ranks `neptune.txt` first with a score near 0.6-0.7.</StepChecklistItem>
<StepChecklistItem>An all-paraphrase query ranks the paraphrase passage first, even though keyword search would find nothing.</StepChecklistItem>
<StepChecklistItem>Scores stay in roughly [-1, 1] — if you see bigger numbers, a vector probably wasn't normalized.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- On a paraphrase query, semantic search returns a *meaning*-based answer with no shared vocabulary. Can you name a case where that same strength becomes a weakness — where meaning-matching would confidently return a passage that a human would call wrong?
- `semantic_scores` re-embeds the query every call but never re-embeds the corpus. Roughly how many times faster is a query than a fresh full-corpus embed, and why does that make the saved index in Step 3 worth it?

## Step 5: Combine into a hybrid retriever

Keyword scores and cosine similarities live on different scales — BM25 scores reach the tens, cosine similarities stay near 0-1 — so you can't average them directly. The fix is **min-max normalization**: for one query, shift each method's score array so its minimum becomes 0 and its maximum becomes 1. Then take a weighted average:

$$
\text{hybrid} = \alpha \cdot \text{norm(keyword)} + (1 - \alpha) \cdot \text{norm(semantic)}
$$

With the default `\alpha = 0.5`, both methods get equal say; lowering it leans semantic, raising it leans keyword.

```python
# hybrid.py
import numpy as np


def minmax_normalize(scores: np.ndarray) -> np.ndarray:
    """Scale a score array to [0, 1] for one query. All-equal arrays map to zeros."""
    lo, hi = float(scores.min()), float(scores.max())
    if hi - lo < 1e-12:
        return np.zeros_like(scores)
    return (scores - lo) / (hi - lo)


def hybrid_scores(keyword: np.ndarray, semantic: np.ndarray, alpha: float = 0.5) -> np.ndarray:
    return alpha * minmax_normalize(keyword) + (1 - alpha) * minmax_normalize(semantic)
```

Notice the elegant failure mode this creates: on a paraphrase query, keyword scores are *all zero*, so every normalized keyword score is 0 and the hybrid collapses exactly onto the semantic ranking. Hybrid search doesn't decide which method is better — it lets whichever method has information carry the query, and the other contributes nothing. That's the entire philosophy of blended retrieval in one function.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`hybrid_scores` on an exact-match query ranks the keyword winner first (keyword dominates the blend).</StepChecklistItem>
<StepChecklistItem>`hybrid_scores` on an all-zero keyword array produces the same ranking as `semantic_scores` alone.</StepChecklistItem>
<StepChecklistItem>Raising `alpha` toward 1.0 makes the hybrid ranking match keyword more closely; lowering it toward 0 matches semantic.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- The min-max normalization is done *per query*. Why does that matter — what would go wrong if you normalized keyword scores using the global max over all queries ever asked?
- One document matching a rare query term can produce a keyword score of 8 while everything else is 0, so after normalization that document gets 1.0 and the rest 0.0 — the hybrid then effectively ignores the semantic side for those passages. Is that a bug, or an acceptable behavior of a 50/50 blend? What would you change if you wanted the semantic side to always keep some influence?

## Step 6: Run it end-to-end and read the winners

The companion example in [`examples/hybrid-search/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/hybrid-search) wires Steps 1-5 into one runnable `main.py` with three modes. First build the index, then ask a single query:

```bash
uv run python main.py --build
uv run python main.py "Neptune planet winds"
```

Each query prints three small tables — keyword, semantic, hybrid — with top hits and a score each. Run the exact-match query and a pure-paraphrase query back to back and the lesson writes itself: keyword nails the first and prints `(no hits)` for the second, embeddings flip that around, and hybrid inherits whichever side has the answer.

The most interesting output is the winners table, which runs a bundled set of ten test queries — each naming the passage that *should* rank first and whether it's an exact-match or paraphrase query — and counts how often each method got it right:

```bash
uv run python main.py --evaluate
```

The example's test queries are in `data/test_queries.json`, so you can read exactly why each one is labeled keyword or semantic. On the bundled corpus the table comes out something like this, and the takeaway is the whole project:

```text
Winners summary: how often each method got the expected doc to rank 1
    keyword:  5/10
   semantic: 10/10
     hybrid: 10/10
```

Keyword alone gets the five exact-match queries and none of the paraphrases. Embeddings get everything on this small corpus. Hybrid matches the best of both. Notice what the table is *not* saying: it's not "semantic is better" — it's that on a corpus deliberately built to include vocabulary-light paraphrases, meaning-based search carries the hard queries, while keyword carries the exact matches. On a corpus of technical identifiers or code, the columns would look completely different. That dependence on data is the honest lesson.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python main.py "Neptune planet winds"` prints three tables with `neptune.txt` first in each.</StepChecklistItem>
<StepChecklistItem>`uv run python main.py "grinding uphill against gravity"` prints `(no hits)` for keyword, with `cycling.txt` first for semantic and hybrid.</StepChecklistItem>
<StepChecklistItem>`uv run python main.py --evaluate` prints a winners table where keyword wins the exact-match queries, semantic and hybrid win everything, and every line is explained by a test-query note.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- The winners count is over a curated, tiny corpus with two paraphrase pairs hand-built to make semantic win. How should you *read* a winners table like this — as evidence about retrieval in general, or as evidence about this corpus? What would you change to make the measurement more honest (more queries? longer passages? random topics)?
- `--evaluate` uses `alpha = 0.5`. Re-run it with `--alpha 0.9` and `--alpha 0.1` and watch which queries change hands. Does anything shift? What does that tell you about how sensitive this particular corpus is to the blend weight?

## ⚠️ Common pitfalls

- **Stopwords swamp a tiny corpus.** Without a stopword filter, a query full of "the"/"of"/"with" gives nearly every document a small, almost-equal BM25 score, and after min-max normalization those tiny differences get amplified into confident-looking rankings. Filter them on both the query and the document side — Step 2's `STOPWORDS` is doing real work, not tidying up.
- **Combining scores without normalizing first.** Raw BM25 scores (up to the tens) will completely drown cosine similarities (~0-1) in the hybrid. The min-max normalize in Step 5 must happen per query, per method, before the weighted average — that's the whole reason `hybrid_scores` exists as its own step.
- **Forgetting to rebuild the index after editing the corpus.** `build_index.py` only runs when you run it. Add a passage, and semantic search won't know it exists until you re-embed. This is a manual step by design, so you always know exactly what's indexed — exactly like the [RAG App project's](/docs/projects/rag-notes) index step.
- **Reading the winners table as a verdict about retrieval in general.** It's a verdict about *this corpus*. The whole point of the project is that the answer depends on the queries and the data — if your takeaway is "embeddings are better than keyword search," the demo has been misread. Re-run it on your own passages and the columns will move.
- **Treating embeddings as free.** The model downloads ~80MB on first run and runs on CPU; that's fine, but the corpus embeddings are cached in `data/index.npy` (gitignored) precisely so queries don't pay that cost again.

## What you just built

A small, fully local tool that runs three retrieval methods on the same corpus and shows you the tradeoffs with real numbers instead of marketing. You wrote a real BM25 scorer from scratch — idf, term-frequency saturation, length normalization — so you can read every line of the math. You embedded a corpus into 384-dimensional vectors with `sentence-transformers` and ranked queries by cosine similarity. And you combined the two with a per-query min-max normalization and a weighted average, producing a hybrid that automatically inherits whichever method has information for a given query. The winners table is the honest summary: no single retriever is best in the abstract, and the practical answer to "which do I use?" is "usually both." The same three-way comparison — lexical, semantic, hybrid — is exactly how real search engines and retrieval-augmented systems structure their ranking, so nothing you built here is a toy that stops scaling; only the corpus is small.

## Where to go from here

- **Tune the blend per query.** Instead of one global `alpha`, try a confidence-based rule — if the top keyword score is near zero, lean fully semantic; if a rare term matched exactly, lean keyword. That's a rudimentary form of the adaptive weighting real search systems use.
- **Swap in your own corpus and write your own test queries.** The honesty of the winners table depends on query design. Write passages on a topic you know well, label ten queries by hand, and see whether the pattern (keyword wins exact matches, embeddings win paraphrases) holds — and where it doesn't.
- **Try a two-stage pipeline.** Retrieve a larger top-k (say, 10) with the fast hybrid, then re-rank with a slower cross-encoder model — the standard production pattern this project's scoring is a simplified version of. The [RAG App project](/docs/projects/rag-notes) mentions the same idea in its final section.
- **Add a fourth method and compare.** Bring in `rank_bm25` (a battle-tested BM25 implementation) or a different embedding model, and extend the winners table to four columns — then check whether your from-scratch scorer holds its own.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓

<ProjectProgressCheckbox projectId="hybrid-search" />
