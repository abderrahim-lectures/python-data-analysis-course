---
title: "Build a Semantic Search Engine"
description: "Build a search engine that understands meaning, not just keywords — embed documents, compute cosine similarity in NumPy, and search by sense instead of exact terms."
difficulty: "advanced"
estimatedMinutes: 240
tags: ["machine-learning", "numpy", "embeddings", "search", "cosine-similarity", "sentence-transformers"]
learningObjectives:
  - "Embed a small document collection into dense vectors with a hosted transformer model"
  - "Store and query the embedding matrix with NumPy"
  - "Rank documents by cosine similarity to a natural-language query"
  - "Diagnose when keywords beat semantics (and vice versa) with a hybrid probe"
prerequisites: ["python-101/libraries", "numpy-101/arrays", "data-analysis/pandas"]
---

# 🧠 Build a Semantic Search Engine

Keyword search is literal: type "car engine" and the system looks for those two exact tokens. Semantic search is *lazy with language*: type "vehicle motor" and it should still find the paragraph about engines, because it represents meaning as a vector in a high-dimensional space where similar ideas sit close together. In 2026 that trick runs on small transformer models you can run in a notebook, so the whole pipeline fits in your hands: embed a document collection into dense vectors, keep them in a NumPy matrix, then answer a natural-language query by computing which embedded paragraphs are closest in cosine distance. This project builds that engine end to end, then confronts the honest limit — when semantic shine fails and a plain keyword match wins on a proper noun — and shows you how a hybrid probes which regime you're in.

This assumes Python 101 plus the course's NumPy and pandas modules. It's optional and ungraded; see [Real-World Projects](/projects) for the full list.

## 🎯 What you'll do

1. Load a small, real collection of document chunks and inspect them.
2. Embed every chunk into a dense vector with a small transformer model.
3. Store the vectors in a NumPy matrix and normalize them once.
4. Answer natural-language queries by ranking cosine similarity to the query embedding.
5. Build a keyword-vs-semantic hybrid and find the query where each approach wins.

## Where to run this

**Locally with `uv`** is the primary path for the *small* model — `sentence-transformers` downloads a ~100 MB model once, then embeds and searches on CPU in milliseconds. `uv add sentence-transformers numpy pandas` covers everything; the first run fetches weights, later runs use the cache.

**GitHub Codespaces** gives the identical experience: open [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) and the same commands run in a browser tab against a small bundled corpus.

**Google Colab, Kaggle Notebooks, and Binder handle this project better than any other in the course** — a small transformer runs happily on Colab/Kaggle's free CPU (sometimes CUDA), the `all-MiniLM-L6-v2`-class model downloads automatically, and the entire embed→search loop renders inline with the vectors visible. The one honest caveat: you download weights on first run (a few hundred MB), and if you're offline, the model won't load — so the *pure-vector-math* parts still work with `numpy` you've precomputed, but the live embed step needs a network reach to Hugging Face.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/semantic-search-engine/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/semantic-search-engine/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fsemantic-search-engine%2Fnotebook.ipynb)

## Setup

Toolchain, one library with a model download, and a small corpus of document chunks to search.

### Install `uv` and `sentence-transformers`

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
mkdir semantic-search-engine && cd semantic-search-engine
uv init --bare
uv add sentence-transformers numpy pandas
```

First-run model download (one time):

```python
# fetch_model.py
from sentence_transformers import SentenceTransformer
SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
print("model ready")
```

```bash
uv run python fetch_model.py
```

### Tiny sample corpus

The course repo ships a small collection of short "facts about animals" paragraphs — concrete enough to tell semantics apart from keywords:

```python
# corpus.py
CORPUS = {
    0: "Dolphins communicate using clicks and whistles underwater.",
    1: "The tallest mountain on Earth is Mount Everest in Asia.",
    2: "Octopuses have three hearts and blue blood.",
    3: "Cats spend most of their day sleeping.",
    4: "Mount Kilimanjaro is a dormant volcano in Africa.",
    5: "Dogs are descendants of gray wolves, domesticated over thousands of years.",
}
```

Feel free to swap in your own text (course notes, stories) — any short chunks work.

**✅ Checklist**

- ✅ `uv --version` prints a version; `sentence-transformers`, `numpy`, `pandas` installed.
- ✅ `uv run python fetch_model.py` prints `model ready` (a few hundred MB cached on first run).
- ✅ Your corpus is a Python dict of a few short chunk strings.

## Step 1: Load and inspect the chunks

Before any math touches a model, look at the raw material — the corpus is small on purpose, so you can *know* each chunk on sight. The habit of "print your data before you transform it" is what separates a script that trusts the model from one that can *read* the model's inputs.

**👟 Starter hint:** Start by importing `CORPUS`, building parallel `ids` and `texts` lists from its keys and values, and printing the chunk count with each chunk's text before any embedding runs.

```python
# search.py
from corpus import CORPUS

ids = list(CORPUS.keys())
texts = list(CORPUS.values())
print(f"{len(ids)} chunks, {sum(len(t.split()) for t in texts)} words total")
for i, (cid, t) in enumerate(CORPUS.items()):
    print(f"{cid:>2}  {t[:70]}")
```

The mapping `id → text` is the reference you'll keep through every later step: the *embedding* is the machine-readable form, but the *text* is the human-facing answer, and a search engine returns the one it thinks a person wants to read. Keeping `ids` and `texts` as parallel lists (or the dict you started with) is the discipline that stops you from returning "vector 14.7" when the user asked a question.

**🎯 Expected output:** A count (6 chunks, ~40 words total) and a numbered list of the paragraph strings — the exact content you'll search in Steps 2–5.

**🩹 If it's off:** If the import fails, `corpus.py` isn't on the import path — run from the same directory, or put `CORPUS` directly in `search.py`. If the print shows fewer lines than expected, a trailing backslash silently escaped a newline — the `CORPUS` literal needs `\{` handled; quoting with `"""` is the robust fix.

**✅ Checklist**

- ✅ The corpus prints in full with stable integer ids.
- ✅ You can recite, from memory, one "tricky" chunk (a shared concept like `mountains` across 1 and 4) to test semantics later.
- ✅ `ids`, `texts` are in sync (same order) for the rest of the pipeline.

**🤔 Socratic Question(s)**

- Two chunks both mention "mountain" (1 and 4) but describe *different* mountains. A keyword search can't tell them apart by that token; what makes them *semantically* distinct, and why is that distinction exactly the thing embeddings are supposed to capture?
- The corpus is tiny. What's the *practical* reason to prototype on 6 sentences before scaling to 6,000 — what bug would a 6-doc corpus reveal that a 6,000-doc one would bury?

## Step 2: Embed every chunk

The jump from words to numbers is the core of the project. A sentence-transformer model reads each chunk and outputs a fixed-size dense vector (here 384 floats) where semantically-similar sentences land near each other and unrelated ones land far apart. "Meaning" becomes geometry: a direction in embedding space.

**👟 Starter hint:** Start by loading the model once (`SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")`) and calling `model.encode(texts, normalize_embeddings=True, convert_to_numpy=True)` — then print `X.shape` and the first row's norm.

```python
# search.py (continued)
from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def embed(texts: list[str]) -> np.ndarray:
    return model.encode(texts, normalize_embeddings=True, convert_to_numpy=True)

X = embed(texts)
print("embedding matrix:", X.shape)          # (6, 384) in this model
print("row norm[0]     :", round(float(np.linalg.norm(X[0])), 4))
```

`model.encode(..., normalize_embeddings=True)` returns a `(n_chunks, 384)` matrix, each row a unit vector (norm ≈ 1.0). Normalizing once up front means every later similarity is a *cosine* — and with unit vectors, cosine similarity collapses to a plain dot product, so the entire search arithmetic in Step 3 is a single `X @ q`. The 384-dimension number is the model's design choice; you don't tune *that*, you choose a model, but you *do* engineer around its output.

**🎯 Expected output:** `embedding matrix: (6, 384)` and `row norm[0]`: `1.0` (within float rounding).

**🩹 If it's off:** If the model download stalls or errors, network access to Hugging Face is blocked — the `fetch_model.py` step from Setup must succeed first; behind a proxy, point `HF_ENDPOINT` at a mirror. If `X` isn't `(6, 384)`, you routed the wrong texts into `encode` — `convert_to_numpy=True` guarantees a matrix; a stray list-of-lists means you missed the array conversion.

**✅ Checklist**

- ✅ `X.shape == (6, 384)` and every row norm ≈ 1.0.
- ✅ Two semantically-similar chunks produce close vectors — check `np.dot(X[1], X[4])` ("mountain" pair) is higher than `np.dot(X[1], X[2])`.
- ✅ You can say what "unit vector" buys you later (cosine == dot product).

**🤔 Socratic Question(s)**

- `normalize_embeddings=True` forces unit length, so "how much did this text say" is dropped and only "which direction does it point" remains. When would *length* be a meaningful signal you'd *want* to keep (a query that demands a super long, winding answer vs a terse one)? Why does search generally prefer direction-only?
- The same model embeds a *word* and its *whole context*. A chunk about a "python script" and one about a "python snake" — same token, different embeddings, because the model looks at the surrounding words. Trace what that means for a domain with ambiguous keywords, and where it silently fails (homonyms the model hasn't disambiguated well).

## Step 3: Search by cosine similarity

The engine, in two lines of math: embed the user's query, then rank every stored chunk by cosine similarity to it. Because Steps 2 normalized the rows, cosine and dot product are the same thing, and `X @ q` returns a score for every chunk in one vectorized step. The ranking is the whole product.

**👟 Starter hint:** Start by writing `search(query, X, texts, ids, k)` that encodes the query exactly like the documents, scores every chunk with `X @ q`, and returns the top `k` by `np.argsort(scores)[::-1]`.

```python
# search.py (continued)

def search(query: str, X: np.ndarray, texts: list[str], ids: list[int],
           k: int = 3) -> list[tuple[int, float, str]]:
    q = model.encode([query], normalize_embeddings=True, convert_to_numpy=True)[0]
    scores = X @ q
    order = np.argsort(scores)[::-1][:k]
    return [(ids[i], float(scores[i]), texts[i]) for i in order]

for q in ["an animal that lives in the sea", "a very tall landform", "sleeping pet"]:
    print(f"\nquery: {q!r}")
    for cid, score, text in search(q, X, texts, ids):
        print(f"   {score:>0.3f}  [{cid}] {text[:60]}")
```

The query follows the *identical* embedding path as the documents — same model, same normalization — so the query vector lives in the same semantic space, and `X @ q` is the cosine-similarity dot product. `np.argsort(scores)[::-1]` ranks descending and slices the top `k`. The payoff is visible in the first query: "an animal that lives in the sea" should rank the *dolphin* chunk (0) and the *octopus* chunk (2) — even though neither chunk contains the words "sea" or "animal". That's semantics: the cloud gave meaning, the dot product ranked by it.

**🎯 Expected output:** For `"an animal that lives in the sea"`, top hits are the dolphin (0) and octopus (2) chunks with scores well above the mountains (1, 4); for `"sleeping pet"`, the cat chunk (3) should top — because your query words ("sea", "pet") appear in *no* document, the match is purely semantic.

**🩹 If it's off:** If the sea query bottoms out at the mountain chunks, the model didn't generalize the way you hoped — try a more idiomatic query ("marine creature"); embedding quality varies with phrasing. If all scores are 0, the query normalization differs from the corpus normalization — both must use `normalize_embeddings=True`. If `np.argsort` returns a `IndexError` shape mismatch, `X` and `q` aren't both `(..., 384)` — a wrong model pipeline (e.g. a different model producing a different dim) collides; re-check the matrix shape from Step 2.

**✅ Checklist**

- ✅ The sea query ranks dolphin + octopus above mountains — meaning, not tokens.
- ✅ Scores are in `[0, 1]` (unit vectors), and rank order is stable across runs.
- ✅ You can point at the *exact* line that does the search (`X @ q` + `argsort`).

**🤔 Socratic Question(s)**

- The whole search is `X @ q` after normalization. If you *hadn't* normalized, what two quantities would you be mixing (magnitude of documents × magnitude of query) and why would that visibly mis-rank a long informative doc against a short one for the same topic?
- `argsort(scores)[::-1]` sorts ascending then flips. What's the subtle difference between that and `scores.argsort()[: -(k+1) : -1]` — and why does either work here? (Think about what "reverse a sorted ascending array" does to ties.)

## Step 4: A hybrid — keywords when they matter

Semantic search is powerful but not omnipotent: when the query contains a *proper noun or a rare exact token*, the lexical match can be more reliable than the model's guess. A real engine blends both — a keyword score (exact/overlapping tokens) fused with a semantic score — and exposes the knob so you can see each side win. This step builds the hybrid and confronts honest failure.

**👟 Starter hint:** Start by writing `keyword_score(query, text)` that counts query tokens found in the chunk divided by the chunk's token count, then blend it into `hybrid(...)` as `alpha * sem + (1 - alpha) * kw`.

```python
# search.py (continued)
import re

TOK = re.compile(r"[a-z0-9]+")

def keyword_score(query: str, text: str) -> float:
    q = set(TOK.findall(query.lower()))
    t = TOK.findall(text.lower())
    return sum(1 for w in t if w in q) / max(1, len(t))

def hybrid(query: str, X: np.ndarray, texts: list[str], ids: list[int],
           alpha: float = 0.5, k: int = 3) -> list[tuple[int, float, str]]:
    q = model.encode([query], normalize_embeddings=True, convert_to_numpy=True)[0]
    sem = X @ q
    kw = np.array([keyword_score(query, t) for t in texts])
    blended = alpha * sem + (1 - alpha) * kw
    order = np.argsort(blended)[::-1][:k]
    return [(ids[i], float(blended[i]), texts[i]) for i in order]

for q in ["Mount Everest", "an animal that lives in the sea"]:
    print(f"\nquery: {q!r}")
    for alpha in (0.0, 1.0):
        print(f"  alpha={alpha}")
        for cid, s, text in hybrid(q, X, texts, ids, alpha=alpha):
            print(f"     {s:>0.3f}  [{cid}] {text[:50]}")
```

`keyword_score` counts how many of the chunk's tokens appear in the query, normalized by the chunk's token count — a naive but honest lexical signal. `hybrid` blends it with the semantic scores (already `[0,1]`-normalized, so the `alpha` sum stays comparable) and ranks. The drama is in the two queries: for "Mount Everest" (a proper noun the model may have *seen* but the keyword matcher nails by exactness), `alpha=0` keyword search should do as well as or better than the semantic arm; for the paraphrase-y "animal that lives in the sea", keywords are *powerless* (those words are in no document) and only `alpha=1` semantics works. The hybrid's job is holding *both* — and the printed score gap is your evidence of which regime you're in.

**🎯 Expected output:** For "Mount Everest", the Everest chunk (1) tops both alpha arms, but the *gap* between rank-1 and a rank-2 (Kilimanjaro, 4) is typically sharper for keyword (`alpha=0`); for the sea query, `alpha=0` finds nothing (the words are in no doc), while `alpha=1` ranks dolphin+octopus first — the two regimes visible in one table.

**🩹 If it's off:** If the sea query at `alpha=0` returns *something* (a chunk with a random shared token like "a"), your `keyword_score` matches articles/stopwords — add a small stopword filter, or accept it as the model's known bias and let the gap teach you. If "Mount Everest" ranks *worse* at `alpha=1` than at 0, the transformer under-weights rare proper nouns — exactly the failure keyword search patches, which is the punchline: alpha blends, neither arm is always right.

**✅ Checklist**

- ✅ Proper-noun queries rank well via keywords; paraphrase-y queries only via semantics.
- ✅ `alpha` visibly shifts the ranking across the two query classes.
- ✅ `keyword_score` is bounded in `[0, 1]`, same range as `sem`, so the blend is apples-to-apples.

**🤔 Socratic Question(s)**

- The blend assumes both scores live on `[0, 1]`. `keyword_score` divides by the chunk's length so long docs don't win by volume. But *what* does normalizing by max(1, len) cost when a 3-word chunk deserves to match — and isn't the *un*normalized "how many query terms appear here" sometimes the better business signal?
- `alpha` has no "right" value in general. What's the *experimental* way to pick it for *your* corpus — a small set of queries with known best answers, then pick the alpha that ranks them correctly most often — and the pitfall of tuning alpha on the same queries you report?

## Step 5: Diagnose when it breaks

The last step is intellectual honesty: a search engine that only ever shows you winners hides the moments it's *wrong*. This step deliberately hunts the failure — a query whose top rank is semantically close but factually wrong, or a paraphrase the model misreads — and characterizes it, so you leave understanding both the power *and* the boundary.

**👟 Starter hint:** Start by writing `show_all(query, X, texts, ids)` — encode the query, score with `X @ q`, and print every chunk with its score in descending order instead of just the top `k`.

```python
# search.py (continued)

def show_all(query: str, X: np.ndarray, texts: list[str], ids: list[int]) -> None:
    q = model.encode([query], normalize_embeddings=True, convert_to_numpy=True)[0]
    scores = X @ q
    order = np.argsort(scores)[::-1]
    print(f"\nquery: {query!r}")
    for i in order:
        print(f"   {scores[i]:>0.3f}  [{ids[i]}] {texts[i][:60]}")

show_all("the tallest mountain in Africa", X, texts, ids)
show_all("a creature with three hearts", X, texts, ids)
```

`show_all` prints *every* chunk with its score instead of just the top-k, so you can *see* the full ranking and locate the boundary case. The "tallest mountain in Africa" probe is the trap: the model has *probably* tied "mountain" strongly to Everest (1) from its training data, so rank-1 may be the Everest chunk even though the correct *factual* answer is Kilimanjaro (4). That's the honest diagnostic — embeddings measure *statistical association*, not *ground-truth fact* — and naming it is the real skill.

**🎯 Expected output:** For "the tallest mountain in Africa", a full ranking where Everest (1) may outrank Kilimanjaro (4) — a perfect illustration that this engine measures *relatedness to the phrase "tallest mountain"*, not *verification of the fact*. "A creature with three hearts" should cleanly top octopus (2).

**🩹 If it's off:** If the Africa probe unexpectedly ranks Kilimanjaro first, our risk assessment was wrong *in your favor* — the model picked the context correctly; that's the variance step, and re-running with a slightly different phrase ("very high peak in Africa") will usually shift it back to the trap. If *everything* is a clean flat line (every chunk ≈ 0.5), your corpus is too homogeneous — swap in more distinct topics so the scores spread.

**✅ Checklist**

- ✅ `show_all` prints every chunk with a score, not just the top-3.
- ✅ The Africa probe *may* rank Everest above Kilimanjaro — and you can explain why (association ≠ fact).
- ✅ You can articulate the one-word limit of this engine: it searches *associated text*, not *truth*.

**🤔 Socratic Question(s)**

- The model encodes "tallest mountain in Africa" with strong residual ties to Everest from training. Is that a *bug* in the model, or a *feature of statistical language models* that a fact-verification layer would have to correct? Argue both sides briefly.
- Every chunk is ranked, but the top score being *highest* doesn't mean it's *good* — a correlated-but-wrong paragraph can still score 0.8. What would a *threshold* (no answer if max score < θ) add, and what's its risk when the true answer just isn't in the corpus?

## ⚠️ Common pitfalls

- **Forgetting to normalize.** Without `normalize_embeddings=True` on both documents *and* the query, cosine degenerates into a raw dot product that cries "long document, higher score" and mis-ranks by length. Normalize once, everywhere.
- **Mismatched models.** Embedding with one model and querying with another (different dim, different space) silently mis-ranks. Encode documents and queries with the *same* `SentenceTransformer` instance.
- **Returning vectors, not text.** A search that returns "chunk 3, score 0.9" is broken UX. Keep `id → text` synchronized (parallel lists) so every ranked hit maps back to something a human can read.
- **Treating semantic scores as truth.** Embeddings encode *statistical association*, not *facts* — "tallest mountain in Africa" can rank Everest because the model learned Everest is famous. Add a verification layer (keyword-check or retrieval over a factual field) for anything fact-sensitive.
- **Tuning alpha on the query, not the corpus.** Picking α to flatter one demo query overfits. Choose it with a held-out set of (query, expected-hit) pairs and report the hit-rate — the same discipline that made the hybrid trustworthy.

## What you just built

A working semantic search engine: you embedded a small corpus into a 6×384 NumPy matrix, normalized the rows so cosine became a single `X @ q` dot product, ranked natural-language queries by similarity, blended in a keyword arm with a tunable `alpha`, and then — hardest part — *looked at the full ranking* and named exactly where it's naive. The transferable ideas go far beyond search: the "normalize once, then geometry is arithmetic" habit, the "associate, don't verify" boundary every embedding model ships with, and the discipline of printing all your scores, not just the winners.

:::tip[Run a fuller version without any local setup]
[`examples/semantic-search-engine/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/semantic-search-engine) in the course repo bundles a richer corpus, the embed-and-search module, and a notebook that loads, embeds, ranks, blends, and shows the full score spread inline. Clone the repo, or open it in a [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run the five steps end to end.
:::

## Where to go from here

- **A bigger corpus:** read documents from a folder (`pathlib.glob`) and chunk them into paragraphs before embedding — the 6-item toy becomes a real index.
- **Persist the index:** save `X` with `np.save` and load it without re-embedding, so cold starts are a file read, not a model call.
- **An API:** wrap `search` in a `FastAPI` `/search?q=...` endpoint returning `{id, score, text}` JSON — the same function, now reachable over HTTP.
- **Fact-check the top hit:** add a keyword re-check (the Step 4 `keyword_score`) as a guard before the rank-1 reaches a user, closing the "association isn't fact" gap.

## Share your project with the class

Embedded a collection, found a semantic win, or photographed a proper-noun failure? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README walks through adding yours via a **pull request** from start to finish: forking, branching, committing, and opening the PR. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓