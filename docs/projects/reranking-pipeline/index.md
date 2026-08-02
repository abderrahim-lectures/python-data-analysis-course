---
id: reranking-pipeline
title: "Build a Re-Ranking Pipeline"
sidebar_label: "Build a Re-Ranking Pipeline"
slug: /projects/reranking-pipeline
description: "Retrieve fast with a cheap keyword stage, re-rank the top-K hits with a stronger cross-encoder model, and benchmark whether the extra compute actually buys better precision@1 — no API key, no LLM."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Build a Re-Ranking Pipeline

<ProjectPublishedDate projectId="reranking-pipeline" />

<ProjectGreeting />

Every search system has the same problem: there is no single way to find "the right document" that is both fast *and* accurate. The cheapest retriever is a pure keyword matcher — milliseconds, no model, but it only sees word overlap, so "biggest" and "largest" look unrelated, and Python-the-snake and Python-the-language look identical. The most accurate scorer is a neural model that reads the query and each document *together* — far smarter, but hundreds of times slower per document.

Production systems don't pick one. They run **two stages**: a fast, cheap first stage that retrieves a shortlist of candidates, and then a slower, stronger **re-ranker** that spends its expensive compute only on that shortlist — a few dozen documents instead of the whole corpus. That's what you'll build here, using the `sentence-transformers` library for a **cross-encoder** model, and you'll do something the marketing rarely does: measure honestly whether the extra compute actually buys better results.

This assumes Python 101 and the basics of `numpy` arrays — nothing from Data Analysis is required, and there's no API key, no `.env` file, and no LLM anywhere in the project. It's optional and ungraded; see [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Build a small corpus of ~25 short passages on varied topics, deliberately seeded with "same word, different meaning" traps (a river bank vs. a money bank, Python the language vs. the snake), plus a set of test queries with ground-truth answers.
2. Write the fast first stage: a pure-Python keyword-overlap scorer that ranks the whole corpus in milliseconds — no model, no download.
3. Run the fast stage and watch it make plausible-but-wrong top picks: it can't tell "biggest" from "smallest," and it matches "company" with "computers."
4. Load a **cross-encoder** (`cross-encoder/ms-marco-MiniLM-L-6-v2`) and re-rank just the top-K shortlist by having it read each query–document pair together.
5. Compare the two pipelines side by side on the same queries and see the re-ranker fix the fast stage's ordering mistakes.
6. Benchmark both on the same 12 test queries — `precision@1`, `precision@3`, and time per query — and read the tradeoff honestly: re-ranking helps, and it costs on the order of a hundred times more.

## Where to run this

**Locally with `uv`** is the primary, recommended path — real Python on your own machine, reading real `.txt` files from a real `data/corpus/` folder on disk. The Setup section below walks through installing `uv`.

**GitHub Codespaces** works great here too: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed, per the repo's `.devcontainer/devcontainer.json`) and run the exact same `uv` commands from a terminal in your browser tab — the `data/corpus/` folder and everything else are already in the repo.

**Google Colab or Kaggle Notebooks** are a genuinely easy option too — this project needs no GPU, no long-running server process, and no API key, just `pip install`s and local computation. The cross-encoder downloads once (~80MB) and then scores pairs on whatever CPU you have.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/reranking-pipeline/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/reranking-pipeline/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Freranking-pipeline%2Fnotebook.ipynb)

A ready-made notebook with all of the code below — including the corpus written out inline, so there's nothing to upload or clone — is at [`examples/reranking-pipeline/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/reranking-pipeline/notebook.ipynb). Click a badge above to launch it directly.

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
uv init reranking
cd reranking
uv add sentence-transformers numpy
```

`sentence-transformers` is the library that provides both stages' models — here, the cross-encoder re-ranker. `numpy` does the fast stage's ranking math (`np.argpartition` for finding the top-K without sorting everything) and the benchmark's statistics.

That's the whole setup. **No API key, no `.env` file, no free-tier signup.** The only thing that downloads is the cross-encoder model (~80MB) on its first run — it's a local model that scores query–document pairs on your own CPU, and once cached it loads in a second or two on later runs.

:::tip[Why "no LLM"?]
Re-ranking is often talked about as a RAG ingredient — you retrieve with embeddings, re-rank, and *then* hand the top hits to a language model for generation. But the re-ranking step itself is model-based without being an LLM: a cross-encoder is a small transformer that outputs a single relevance score per query–document pair. No generation, no tokens, no API key — just math on pairs. This project isolates that step so you can see it clearly.
:::

## Step 1: Create the corpus and test queries

Every retrieval demo needs two things: a **corpus** to search over, and **test queries** with known answers so you can measure whether retrieval improved. The companion example ships both in `examples/reranking-pipeline/data/`: a `corpus/` folder of 25 short passages and a `test_queries.json` with 12 queries, each labeled with the id of the passage that truly answers it.

The corpus is deliberately engineered to expose what a naive keyword stage can't see. Several passages share a word with entirely different meanings:

```
data/corpus/python_programming.txt   "Python is a high-level programming language known for its readable syntax..."
data/corpus/python_snake.txt         "The python is a large non-venomous snake that kills its prey by constriction..."
data/corpus/mercury_planet.txt       "Mercury is the smallest planet in the solar system and the closest one to the Sun."
data/corpus/mercury_god.txt          "In Roman mythology, Mercury was the messenger god, famous for his winged sandals..."
data/corpus/money_bank.txt           "A bank is a business that keeps your money safe, pays interest on savings..."
data/corpus/river_bank.txt           "A river bank is the strip of land along the water, where plants and trees take root..."
```

Start by copying these two pieces of data into your project and loading them:

```python
# load_data.py
import json
from pathlib import Path

def load_documents(corpus_dir=Path("data/corpus")):
    """Reads every *.txt file into a list of {"id", "text"} dicts."""
    documents = []
    for path in sorted(corpus_dir.glob("*.txt")):
        text = path.read_text(encoding="utf-8").strip()
        if text:
            documents.append({"id": path.name, "text": text})
    return documents

def load_test_queries(path=Path("data/test_queries.json")):
    """Reads [{"query": ..., "relevant": [doc ids]}, ...]."""
    with open(path, encoding="utf-8") as f:
        return json.load(f)

documents = load_documents()
queries = load_test_queries()
print(f"{len(documents)} documents, {len(queries)} test queries")
```

:::tip[Why the ground-truth `relevant` list matters]
You can't measure whether re-ranking helps without knowing what the *right* answer is. Each test query names the passage that genuinely answers it (e.g. `"relevant": ["jupiter.txt"]` for "What is the biggest planet in the solar system?"). That turns every query into a tiny labeled evaluation set — the same idea behind big public retrieval benchmarks like MS MARCO or BEIR, just small enough to hold in one file.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python load_data.py` prints a nonzero document count and test-query count.</StepChecklistItem>
<StepChecklistItem>Every `corpus/*.txt` file is 1–3 sentences and reads like a real, self-contained passage.</StepChecklistItem>
<StepChecklistItem>You can name at least three pairs of passages where the same word means different things (e.g. bank, Mercury, Python).</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- The corpus uses filenames like `python_snake.txt` and `python_programming.txt`. Why might splitting two meanings of one word into *two separate passages* — rather than one longer passage covering both — make retrieval cleaner to study?
- `test_queries.json` uses a *single* relevant id per query. What does that simplify away compared to a real benchmark, where a query can have several equally-good answers?

## Step 2: Write the fast stage

The fast stage is the "retrieve" half of the pipeline, and this version is deliberately naive: it tokenizes the query, drops stopwords, and scores each document by how much its words overlap with the query's. No model, no download — pure Python plus one NumPy call.

```python
# fast_stage.py
import re
from collections import Counter

import numpy as np

STOPWORDS = frozenset("""
    a an and are as at be by for from how in is it of on or that the this
    to was what when where which who with you your
""".split())

def tokenize(text):
    """Lowercases, splits on non-alphanumerics, drops stopwords."""
    tokens = re.findall(r"[a-z0-9]+", text.lower())
    return Counter(tok for tok in tokens if tok not in STOPWORDS)

def tokens_overlap(query_tokens, doc_tokens):
    """How many query tokens the document shares, using a naive 3-character
    prefix match so 'hunts'/'hunt' and 'planet'/'planets' still count as the
    same word. Intentionally crude -- this is the *cheap* stage."""
    overlap = 0.0
    for q_tok, q_count in query_tokens.items():
        for d_tok, d_count in doc_tokens.items():
            if q_tok == d_tok or q_tok[:3] == d_tok[:3]:
                overlap += q_count * min(q_count, d_count)
                break
    return overlap

def lexical_scores(query, documents):
    """One overlap score per document."""
    qt = tokenize(query)
    return np.array([tokens_overlap(qt, tokenize(doc["text"])) for doc in documents])
```

The 3-character prefix rule (`q_tok[:3] == d_tok[:3]`) is doing quiet work: without it, the *plural* "insects" wouldn't match the passage's "insects," and singular-vs-plural alone would sink this stage. But the same rule is also the source of the stage's blindness — it happily matches "company" with "computers" because both start with "com". That's not a bug to fix; it's a *feature* of this project. The cheap stage is supposed to be a blunt instrument.

Ranking uses `np.argpartition`, which finds the top-K elements without sorting the whole array — O(n) instead of O(n log n). That's the difference between a retrieval stage that scales and one that doesn't:

```python
def top_k_indices(scores, k):
    """Indices of the k highest-scoring documents, best first."""
    if k >= len(scores):
        return np.argsort(scores)[::-1]
    idx = np.argpartition(scores, -k)[-k:]
    return idx[np.argsort(scores[idx])[::-1]]
```

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`lexical_scores("Which snake squeezes its prey to death?", documents)` scores the `python_snake.txt` passage highest, because "snake", "squeezes"/"squeezing", and "prey" all overlap.</StepChecklistItem>
<StepChecklistItem>Stopwords like "the", "is", and "which" contribute zero to any score.</StepChecklistItem>
<StepChecklistItem>You can explain why `np.argpartition(scores, -k)` is cheaper than a full `np.argsort(scores)`.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- The prefix rule makes `tokens_overlap` match "company" with "computers" (both start with "com"). Can you find another false match like that in the corpus? Would the rule be better with 4 characters? Why is there no universally "right" prefix length?
- Why does `top_k_indices` fall back to a full `np.argsort` when `k >= len(scores)`? Is the fallback ever actually necessary here, given the corpus has only 25 documents?

## Step 3: See the fast stage go wrong

Retrieval pipelines don't fail by returning nothing — they fail by returning the *right document in the wrong place*. Run the fast stage on the three trickiest queries and look at position 1:

```python
# fast_stage.py (append to Step 2, at the bottom)
def show(query):
    scores = lexical_scores(query, documents)
    idx = top_k_indices(scores, 5)
    print("Query:", query)
    for i, j in enumerate(idx[:3], 1):
        print(f"  {i}. {scores[j]:6.2f}  {documents[j]['id']}")

show("What is the biggest planet in the solar system?")
show("How does a computer run Python code?")
show("Which company makes the iPhone smartphone?")
```

On a typical run you'll see the fast stage put `mercury_planet.txt`, `python_snake.txt`, or `microchip.txt` at position 1 — even though `jupiter.txt`, `python_programming.txt`, and `apple_iphone.txt` are the actual answers. Each case is a different flavour of the same failure:

- **"biggest" vs. "largest".** Mercury is the *smallest* planet in the solar system, Jupiter the *largest* — the passage wording is nearly identical, so both tie on word overlap, and the tie is broken by a coin flip, not by meaning.
- **A word in common is not the same word.** "Python" appears in both the language passage and the snake passage; a computer "running Python" is about code, but overlap alone can't tell.
- **False friends.** "Company" and "computers" share the "com" prefix, so the microchip passage out-ranks the one about the iPhone.

```bash
uv run python fast_stage.py
```

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>For at least one of the three queries above, the fast stage's position 1 is *not* the relevant passage — even though the relevant passage is present somewhere in the top 5.</StepChecklistItem>
<StepChecklistItem>You can name, for each wrong pick, which word overlap caused it (the "biggest"/"largest" tie, the shared "python", or the "com" prefix).</StepChecklistItem>
<StepChecklistItem>You can explain why the relevant passage being *in the shortlist* is the crucial detail — re-ranking can only fix ordering, not retrieval.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- What would happen to these three queries if you removed the 3-character prefix rule and matched exact words only? Would the fast stage get *more* or *fewer* of them wrong? Why?
- "Biggest" and "smallest" both live in sentences shaped like "X is the ...est planet in the solar system," so both passages score the same. Is that a fair failure for a keyword stage to have — or is the corpus "cheating" by being so symmetric?

## Step 4: The re-ranker — a cross-encoder

The keyword stage scores each document by *its own words*. A **cross-encoder** does something fundamentally different: it takes the query and one candidate document **together**, as a single pair, and reads them jointly to output a relevance score. Because both texts are in the same context window, the model can see that "biggest planet" matches "Jupiter is the largest planet" — that "largest" and "biggest" mean the same thing — even though no word overlaps.

The catch is cost. Every document needs a full forward pass through the transformer with the query; there's no way to pre-compute document vectors and reuse them, the way there is with an embedding model. That's precisely why this project runs the cross-encoder only on the top-K shortlist the fast stage produced, not on the whole corpus:

```python
# rerank.py
from sentence_transformers import CrossEncoder

MODEL_NAME = "cross-encoder/ms-marco-MiniLM-L-6-v2"
model = CrossEncoder(MODEL_NAME)  # downloads ~80MB on first run

def rerank(query, candidates):
    """Re-ranks candidate documents by cross-encoder relevance score."""
    pairs = [(query, doc["text"]) for doc in candidates]
    scores = model.predict(pairs)
    return sorted(zip(map(float, scores), candidates), key=lambda t: t[0], reverse=True)
```

`CrossEncoder` is the second model family in `sentence-transformers`, and it's trained specifically to *rank* — this particular one was trained on the MS MARCO dataset, i.e. real search queries paired with human-judged passages. You're handing it `(query, candidate)` pairs and asking "does this document answer this query?", which is exactly the task it was built for. The scores it returns are raw logits (they can be negative); only their *ordering* matters.

:::tip[Cross-encoder vs. embedding model]
An embedding model (like `all-MiniLM-L6-v2` from the RAG project) encodes the query and each document *separately*, so you can pre-compute every document vector once and then search — fast, but it only ever compares two fixed vectors. A cross-encoder has no such shortcut: it must see every query–document pair together, so it's far more accurate and far more expensive. Re-ranking pipelines get both by using one stage of each.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`CrossEncoder(MODEL_NAME)` loads without errors on the first run (expect an ~80MB download), and loads from cache quickly on later runs.</StepChecklistItem>
<StepChecklistItem>You can explain why re-ranking can't run the cross-encoder over the whole corpus "for free" the way the keyword stage can.</StepChecklistItem>
<StepChecklistItem>You can explain what the numbers returned by `model.predict(pairs)` are (raw relevance logits — larger is more relevant, but only ordering matters).</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- `rerank()` sorts by score descending and returns the *whole* shortlist. If you wanted the final answer set to be just the top 3, where would you slice — inside `rerank`, or at the call site? What difference does it make?
- The cross-encoder "sees both texts together." What specific information does a pair (query, candidate) expose that a query vector plus a document vector, compared by cosine similarity, *cannot*?

## Step 5: Run both stages as one pipeline

Now assemble the two-stage pipeline: fast retrieval to get the shortlist, re-ranking to get the ordering right.

```python
# pipeline.py
def retrieve(query, documents, top_k=5, rerank_flag=False):
    """Best-first ranking of length top_k."""
    scores = lexical_scores(query, documents)
    shortlist = [documents[i] for i in top_k_indices(scores, top_k)]
    if rerank_flag:
        return rerank(query, shortlist)
    return [(float(scores[documents.index(doc)]), doc) for doc in shortlist]
```

The function takes a boolean precisely so you can compare the two pipelines on identical inputs — the same query, the same corpus, the same top-k. With `rerank_flag=False` you get the raw keyword ranking; with `True` you get the cross-encoder's re-ordering of that same shortlist. Re-run the three trap queries from Step 3 through `retrieve(..., rerank_flag=True)` and the cross-encoder promotes the right document to position 1 in every case:

```
Query: What is the biggest planet in the solar system?
  fast-only top-3 : ['mercury_planet.txt', 'jupiter.txt', 'photosynthesis.txt']
  re-ranked top-3 : ['jupiter.txt', 'mercury_planet.txt', 'photosynthesis.txt']
  relevant        : ['jupiter.txt']
```

The single most important sentence in this project: **the relevant passage was already in the fast stage's top-5 in all three cases.** Re-ranking didn't find new documents — it re-ordered the ones that were already there. If the fast stage had missed the right document entirely, the cross-encoder would have had nothing to rescue.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`retrieve()` returns the same-length ranking whether or not re-ranking is enabled, so the two pipelines are directly comparable.</StepChecklistItem>
<StepChecklistItem>For the Step 3 trap queries, `rerank_flag=True` puts the relevant passage at position 1.</StepChecklistItem>
<StepChecklistItem>You can point to one query where re-ranking *didn't* change the answer — and explain why that's fine.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- `top_k` is the knob that trades recall against cost. What happens to the pipeline if you set `top_k=25` (re-rank everything)? What if you set `top_k=1`? Where does the sweet spot sit, and what decides it?
- The cross-encoder re-ranks whatever the fast stage hands it. Can you construct a query where the right passage wouldn't make it into the top-k at all — and confirm that no re-ranker could fix it?

## Step 6: Benchmark — does re-ranking pay for itself?

The whole point of this project is to answer that question with numbers. Loop every test query through both pipelines, record precision@1, precision@3, and per-query time, and print a summary. `precision@k` is simple: for a single query, it's 1 if any of the top-k results is relevant, else 0 — averaged over all queries.

```python
# benchmark.py
import time

def precision_at(ranking, relevant, k):
    """1 if any of the top-k is relevant, else 0."""
    return int(any(doc["id"] in relevant for _, doc in ranking[:k]))

fast_p1, fast_p3, fast_ms = [], [], []
rerank_p1, rerank_p3, rerank_ms = [], [], []

for item in test_queries:
    q = item["query"]
    relevant = set(item["relevant"])

    t0 = time.perf_counter()
    fast = retrieve(q, documents, top_k=5, rerank_flag=False)
    fast_ms.append((time.perf_counter() - t0) * 1000)

    t0 = time.perf_counter()
    smart = retrieve(q, documents, top_k=5, rerank_flag=True)
    rerank_ms.append((time.perf_counter() - t0) * 1000)

    fast_p1.append(precision_at(fast, relevant, 1))
    fast_p3.append(precision_at(fast, relevant, 3))
    rerank_p1.append(precision_at(smart, relevant, 1))
    rerank_p3.append(precision_at(smart, relevant, 3))
```

The companion example's `main.py` wires all of this together, including a per-query table and a summary. Running it on a typical laptop produces something close to:

```
method                  p@1    p@3  avg ms/query
-----------------------------------------------
fast-only (keyword)    0.75   1.00        1.0 ms
fast + re-rank         1.00   1.00      183.0 ms
```

Read those numbers honestly, because they tell three separate stories:

- **Re-ranking fixed ordering.** p@1 went from 0.75 to 1.00 — the fast stage's three wrong position-1 picks got corrected. That's the win this project is about.
- **p@3 was already perfect.** On this small, well-matched corpus the fast stage already had the right passage in its top-3 for *every* query. Re-ranking didn't rescue any misses because there were none at depth 3. That's a real result, not a bug — the lesson generalizes to big messy corpora, where depth-3 misses are routine.
- **The cost is real.** Re-ranking took ~180× longer per query. For 25 passages nobody cares; for a billion-document search index, that multiplier is exactly why you'd never run a cross-encoder on everything.

Your exact numbers may differ slightly — when several documents tie on keyword overlap, NumPy's tie-breaking can vary between runs and versions — but the *direction* won't: re-ranking improves p@1 at a large compute cost.

```bash
uv run python main.py
```

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python main.py` prints a per-query table and a summary with p@1, p@3, and avg ms/query for both pipelines.</StepChecklistItem>
<StepChecklistItem>The fast stage shows at least one query where position 1 is wrong but the relevant passage is still in the top-5.</StepChecklistItem>
<StepChecklistItem>Re-ranking's p@1 is ≥ the fast stage's p@1, and its per-query time is visibly (orders of magnitude) slower.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- p@3 is 1.00 for the fast stage on this corpus. Does that mean re-ranking is useless? What would a corpus look like where p@3 *also* drops without re-ranking — and what would the benchmark table show then?
- The benchmark reports `avg ms/query`, which hides the cross-encoder's *fixed* cost (model loading) behind the amortized average. When does that fixed cost matter more than the per-pair cost — and does that change how you'd size `top_k`?

## ⚠️ Common pitfalls

- **Re-ranking can't fix retrieval misses — only ordering.** The cross-encoder scores whatever the fast stage hands it. If the right document never makes the shortlist, p@3 stays 0 no matter how good the re-ranker is. When the benchmark looks bad, check the shortlist first, not the re-ranker.
- **A keyword stage's "fast" is a different scale than you might expect.** Tokenizing and overlapping every query against every document is O(query × corpus). For 25 passages it's microseconds; for millions of documents it stops being free — which is exactly why real systems use inverted indexes or approximate nearest-neighbour search, and why `np.argpartition` rather than a full sort matters.
- **Treating re-ranking as free.** Each re-ranked candidate is a full transformer forward pass with the query. Doubling `top_k` roughly doubles the re-ranking time while usually adding little at the top. Measure p@1 vs. time across a few `top_k` values before choosing one.
- **Expecting the cross-encoder to be an oracle.** It was trained on one domain (search queries and web passages); on your own quirky corpus its ordering will sometimes be wrong too. The benchmark's job is to quantify *how often* it helps, not to assume it always does.
- **Reading precision without the timing column.** A pipeline that's perfect but 10,000× slower is a different product from one that's slightly better and 2× slower. This project's whole point is that you can't judge re-ranking from quality alone — the two numbers belong on the same line.

## What you just built

A two-stage retrieval pipeline with an honest benchmark attached: a milliseconds-fast keyword stage that gets you into the right neighborhood, and a cross-encoder that spends real compute re-reading the top few candidates to get the ordering right. You measured — not assumed — that re-ranking lifted precision@1 from 0.75 to 1.00 on the bundled corpus, and you saw that it costs roughly two orders of magnitude more per query. That "retrieve fast, re-rank smart" shape is the same architecture behind production search and RAG systems, and nothing about it was faked into a toy: swap in a bigger corpus, a real index for stage one, and the two-stage pipeline is unchanged.

## Where to go from here

- Swap the keyword stage for the embedding-based retrieval from the [RAG App Over Your Own Notes](/docs/projects/rag-notes) project (`all-MiniLM-L6-v2` plus a `numpy` dot product). You now know the full two-stage recipe: embed-and-retrieve for stage one, cross-encoder for stage two.
- Add **hybrid retrieval**: run both the keyword scorer and the embedding search, then merge their shortlists before re-ranking. Two cheap-but-different retrievers catch more than either alone.
- Replace precision@1/p@3 with **NDCG** — a metric that rewards *how high* the relevant passage ranks, not just whether it's in the top-k. You'll need a relevance grade per passage (e.g. 0/1/2) instead of a yes/no, and it'll separate "improved top-1" from "improved top-3" more finely.
- Try a bigger, noisier corpus — the course's own documentation, or a scrape from a site you like — and re-run the benchmark. The p@3 gap between the two pipelines should widen as plausible-but-wrong candidates multiply, which is the honest argument for re-ranking at scale.
- Swap in a stronger cross-encoder (`cross-encoder/ms-marco-electra-base`, or `BAAI/bge-reranker-v2-m3`) and watch both the accuracy and the wall-clock time go up. Same pipeline, same benchmark, different tradeoff point.

## Related projects

- [RAG App Over Your Own Notes](/docs/projects/rag-notes) — build the embedding-based retrieval stage this project's re-ranker complements.
- [Chat with Your PDFs](/docs/projects/chat-with-pdfs) — multi-document RAG over a folder of PDFs; the "retrieve, then generate" pipeline a re-ranker slots into.
- [Codebase Knowledge Graph](/docs/projects/codebase-knowledge-graph) — another no-API-key project that turns a data structure into a real tool.
- [Build an AI Agent](/docs/projects/ai-agent) — the first real-Python project if you haven't done one yet.
- [Build an Agentic Code Reviewer](/docs/projects/agentic-code-reviewer) — a CLI tool that reads a real git diff, in the same install-Python-for-real spirit.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓

<ProjectProgressCheckbox projectId="reranking-pipeline" />
