---
title: "Build a Document Q&A Engine"
description: "Ask plain-language questions of a small document corpus using chunking, an inverted index, scoring, and extractive answers."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["cli", "retrieval", "indexing", "nlp-basics"]
prerequisites:
  - "Python basics (dicts, sets, comprehensions)"
  - "Regular expressions and reading files with pathlib"
learningObjectives:
  - "Chunk a corpus into queryable text units with stable ids"
  - "Build an inverted index mapping terms to chunks"
  - "Score and rank chunks for an arbitrary query with term frequency"
  - "Extract a sentence-level answer from the top chunk with a source citation"
  - "Wrap retrieval + answers in an interactive CLI that never depends on a network"
---

# 📄 Build a Document Q&A Engine

In the pre-LLM world — and in every edge environment where an LLM is too heavy, too slow, or too unaffordable — "ask questions of your documents" is a *search problem with nice formatting*. The machinery is honest and teaches you more than the chat wrapper: break the corpus into chunks, index every term to the chunks it appears in, score chunks for a query, pick the sentence that best answers it, and cite where it came from. This project builds all five layers in pure Python, and you'll see a real engine do a real thing: nobody's guesswork, every answer carries the file it came from.

This assumes Python 101 plus comfortable `re` and `pathlib`. Nothing from the Data Analysis module is required. It's optional and ungraded; see [Real-World Projects](/projects) for the full, growing list.

## 🎯 What you'll do

1. Ingest a three-file markdown corpus and slice it into chunks with stable ids.
2. Build an inverted index — for every term, the list of chunks it appears in and how often.
3. Rank chunks for a query by normalized term frequency.
4. Extract the best sentence from the top chunk and cite its source file.
5. Wrap it in an interactive `ask.py` CLI — type a question, get ranked hits and an answer with a source.

## Where to run this

**Locally with `uv`** is the recommended path — an index is a living object you load once and query repeatedly, and a CLI does that better than a notebook cell.

**GitHub Codespaces** is a zero-setup alternative: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node and Python are already installed) and run the same commands from a browser terminal.

**Google Colab, Kaggle Notebooks, or Binder** work for every step — the notebook at [`examples/document-qa-engine/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/document-qa-engine/notebook.ipynb) runs the same engine over the bundled corpus in memory.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/document-qa-engine/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/document-qa-engine/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdocument-qa-engine%2Fnotebook.ipynb)

## Setup

`uv` is a single tool that replaces the "install Python, then pip, then a virtual environment tool" chain — and this project is pure standard library.

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

Then set up the project:

```bash
uv init document-qa-engine
cd document-qa-engine
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `document-qa-engine/` exists with a `pyproject.toml`.
- ✅ `python -c "import re, pathlib, collections"` succeeds — no third-party packages.

## Step 1: Ingest the corpus into chunks

Before any question can be asked, the documents have to become a list of *chunks* — small, self-contained text units the engine can score and cite. Chunking by blank-line paragraphs is deliberately simple: a wiki page about geckos becomes one chunk, and the chunk's identity is its `source#index`, which is exactly what an answer cites later.

### 1.1 Create the corpus and the reader

**👟 Starter hint:** Three one-paragraph markdown files are the whole corpus; `load_corpus` reads them, splits on blank lines, and stamps each chunk with a stable id:

```bash
mkdir -p docs
cat > docs/gecko.md <<'EOF'
Geckos are nocturnal lizards. They can climb smooth glass using tiny lamellae. Geckos eat insects such as crickets. Keep a warm branch in their tank.
EOF
cat > docs/hamster.md <<'EOF'
Hamsters are nocturnal rodents. They hoard seeds and nuts in their cheek pouches. Hamsters need soft bedding and a running wheel.
EOF
cat > docs/hermit.md <<'EOF'
Hermit crabs are decapod crustaceans. They carry a borrowed shell for protection. Hermit crabs need high humidity. They eat fruit, vegetables, and shrimp.
EOF
```

```python
# ingest.py
import re
from pathlib import Path

def tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z']+", text.lower())

def load_corpus(directory: str = "docs") -> list[dict]:
    chunks = []
    for path in sorted(Path(directory).glob("*.md")):
        paragraphs = [p.strip() for p in path.read_text().split("\n\n") if p.strip()]
        for i, text in enumerate(paragraphs):
            chunks.append({"id": f"{path.name}#{i}", "source": path.name, "text": text})
    return chunks

if __name__ == "__main__":
    for chunk in load_corpus():
        print(f"{chunk['id']:<12} {len(tokenize(chunk['text'])):>3} words  {chunk['text'][:38]}...")
```

`tokenize` is the one sentence both ingest and (later) querying share: lowercase everything, keep letters and apostrophes only — so `Climb`, `climb`, and `climb,` all index as the same term `climb`. The blank-line paragraph split is the chunking *unit*; production systems split on sentences or fixed window sizes, but the contract is identical (id + source + text), which is exactly why you could swap the chunker without touching the index or the answerer.

**🎯 Expected output:**

```
gecko.md#0    25 words  Geckos are nocturnal lizards. They can...
hamster.md#0  21 words  Hamsters are nocturnal rodents. They h...
hermit.md#0   23 words  Hermit crabs are decapod crustaceans. ...
```

**🩹 If it's off:** If files don't appear at all, `Path(directory).glob("*.md")` found none — confirm `docs/` sits *next to* `ingest.py` (same directory as the script you run from). If chunk ids show `docs/gecko.md#0`, you passed `directory="docs"` but `path.name` is including the path — use `path.name`, not `str(path)`.

### 1.2 Verify ingestion

**✅ Checklist**

- ✅ `load_corpus()` yields exactly three chunks: `gecko.md#0`, `hamster.md#0`, `hermit.md#0`.
- ✅ `tokenize("Climb, CLIMB climb") == ["climb", "climb", "climb"]` — case- and punctuation-insensitive.
- ✅ Word counts (25 / 21 / 23) tell you the corpus size without reading prose — the counts drive the Step 3 normalization.

**🤔 Socratic Question(s)**

- Paragraph = one chunk means a *long* paragraph dominates retrieval later. What chunking unit would you pick so the answer engine can distinguish "page mentions lizards" from "*in two sentences* they're nocturnal"? How does the id scheme change?
- The corpus has three one-paragraph files, so everything is `#0`. When would `source#index` ids become ambiguous — and what's the first chunker that would produce a `#1`?

## Step 2: Build the inverted index

The brute-force way to find "where does 'nocturnal' live" is to re-read all three files each time. The inverted index flips that: *term → {chunk id: count}*, so a lookup for any term is a single dict hit that returns exactly the chunks it's in and how many times. Memory traded for speed, and the answer engine's entire speed built in like ten lines of construction.

### 2.1 Write `build_index`

**👟 Starter hint:** Per chunk, count each term's appearances, then push `(term → chunk id → count)` into a nested defaultdict:

```python
# index.py
from collections import defaultdict

from ingest import load_corpus, tokenize

def build_index(chunks: list[dict]) -> dict[str, dict[str, int]]:
    index: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for chunk in chunks:
        seen = {}
        for term in tokenize(chunk["text"]):
            seen[term] = seen.get(term, 0) + 1
        for term, count in seen.items():
            index[term][chunk["id"]] = count
    return index

def word_counts(chunks: list[dict]) -> dict[str, int]:
    return {c["id"]: len(tokenize(c["text"])) for c in chunks}

if __name__ == "__main__":
    chunks = load_corpus()
    index = build_index(chunks)
    for term in ("nocturnal", "climb", "humidity", "shell"):
        print(f"{term:<10} -> {dict(index[term]) if term in index else {}}")
    print("word counts:", word_counts(chunks))
```

The `defaultdict(lambda: defaultdict(int))` is the whole shape: an outer dict keyed by term that, for missing keys, springs into existence a *nested* dict keyed by chunk that starts counting at 0. Reading `index["nocturnal"]` is fast whether the term has one hit or a million, and you never checked membership before touching it. Two structures leave this step: `index` answers *"where does this term appear"* and `word_counts` answers *"how long is this chunk"* — Step 3 needs both.

**🎯 Expected output:**

```
nocturnal  -> {'gecko.md#0': 1, 'hamster.md#0': 1}
climb      -> {'gecko.md#0': 1}
humidity   -> {'hermit.md#0': 1}
shell      -> {'hermit.md#0': 1}
word counts: {'gecko.md#0': 25, 'hamster.md#0': 21, 'hermit.md#0': 23}
```

**🩹 If it's off:** If the demo prints every term with an empty dict, `build_index` tokenized an empty text (a `path.read_text()` on a file the glob didn't find) — check you're in the `document-qa-engine/` directory. If `index["climb"]` returns `defaultdict` garbage when printed, you're printing a defaultdict that was never converted with `dict(...)` — cosmetic, but the `dict(index[term])` conversion is what makes it render like a real read of the index.

### 2.2 Verify the index

**✅ Checklist**

- ✅ `nocturnal` maps to both gecko and hamster chunks; `climb`/`humidity` each map to exactly one.
- ✅ A term that appears twice in a chunk (like `geckos`) has count `2` in that chunk's entry.
- ✅ Querying a term that doesn't exist returns an empty mapping rather than raising.

**🤔 Socratic Question(s)**

- The index is a *plain dict of dicts*. What would it take to support "find chunks by any of several terms in one lookup" (a union of dict keys) with no new dependency — and why is that the natural next query type?
- This index remembers *how many times* a term appears but not *where in the chunk* (position). What would knowing the position unlock — and is it worth the memory when a chunk is 25 words?

## Step 3: Score and rank chunks for a query

"Which chunk answers my question?" now has a mechanical answer: tokenize the query, look up each term's per-chunk count, and give every chunk a **normalized score** = (sum of matching term counts) ÷ (chunk word count). Long chunks get punished for their length, which is the entire point of the division, and it's the difference between "matches" and "matches *densely*".

### 3.1 Write `search`

**👟 Starter hint:** Unique query terms, one double loop over chunks, normalized score, then `sorted(... reverse=True)`:

```python
# search.py
from ingest import load_corpus, tokenize
from index import build_index, word_counts

def search(query: str, chunks: list[dict], index: dict, counts: dict[str, int]) -> list[tuple[float, dict]]:
    terms = set(tokenize(query))
    scored = []
    for chunk in chunks:
        score = sum(index[t].get(chunk["id"], 0) for t in terms) / counts[chunk["id"]]
        scored.append((score, chunk))
    return sorted(scored, key=lambda pair: pair[0], reverse=True)

if __name__ == "__main__":
    chunks = load_corpus()
    index = build_index(chunks)
    counts = word_counts(chunks)
    for i, (score, chunk) in enumerate(search("nocturnal", chunks, index, counts)[:3], 1):
        print(f"{i}. {chunk['id']:<12} score {score:.4f}  {chunk['text'][:30]}...")
```

The term-frequency (TF) score is deliberately basic — no position weighting, no phrase bonus — and its basicness is the lesson: even this naked TF+normalization already produces *rankings that are simply right* for a keyword question on a small corpus. Querying `nocturnal` finds it in two files, and — here's the subtle bit — the hamster file *outranks* the gecko file (0.0476 → 0.0400) not because it mentions the word twice, but because `normalized` divides by chunk length and the hamster chunk is shorter. Retrieval quality is a constant argument about scoring functions; you now own the simplest honest one.

**🎯 Expected output:**

```
1. hamster.md#0 score 0.0476  Hamsters are nocturnal rodents...
2. gecko.md#0   score 0.0400  Geckos are nocturnal lizards. ...
3. hermit.md#0  score 0.0000  Hermit crabs are decapod crust...
```

**🩹 If it's off:** If scores are all `inf`/`ZeroDivisionError`, a chunk's `counts` entry is missing (chunk ids don't line up between `load_corpus` and `word_counts` — they must both derive from the same `chunks` list). If a chunk gets `nan`, dividing by `0` slipped through — an empty chunk; `load_corpus` filters `if p.strip()`, so confirm your chunker kept that guard.

### 3.2 Verify ranking

**✅ Checklist**

- ✅ `nocturnal` ranks hamster & gecko by *normalized* score — hamster (21 words) above gecko (25 words) with identical term counts.
- ✅ A multi-word query sums per-term counts: `geckos eat` scores gecko at `(2+1)/25 = 0.120`.
- ✅ `sorted(..., reverse=True)` returns the highest score first; ties keep corpus order.

**🤔 Socratic Question(s)**

- `nocturnal` appears once in two chunks, yet they rank differently. Is that *correct* behavior or an artifact — what question about the two documents does the ranking genuinely encode?
- This is term-frequency only, no IDF (inverse document frequency). A term like `the`, present in every chunk, would score a recycle bin of hits equally. What does IDF subtract from each chunk's score — and what does a stop-word list buy you instead, at the cost of hard-coding a list?

## Step 4: Extract a sentence as the answer

Ranking found the *chunk*; the question deserves a *sentence*. Splitting the top chunk into sentences and scoring each by how many query terms it contains is extractive answering, the honest second layer: query terms present in a sentence mean the sentence is likely to carry the answer. What you gain is a citation ("gecko.md") that no fact-generation step can fake — and what you learn is precisely where extraction stops being impressive.

### 4.1 Write `extract_answer`

**👟 Starter hint:** Reuse `search` for the top chunk, split on sentence boundaries with a lookbehind regex, score sentences by distinct query tokens present:

```python
# answer.py
import re

from ingest import load_corpus, tokenize
from index import build_index, word_counts
from search import search

def sentences(text: str) -> list[str]:
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]

def extract_answer(query: str, chunks: list[dict], index: dict, counts: dict[str, int]):
    top = search(query, chunks, index, counts)[0][1]
    terms = set(tokenize(query))
    best_sentence, best_score = "", -1.0
    for sentence in sentences(top["text"]):
        score = sum(1 for t in terms if t in tokenize(sentence))
        if score > best_score:
            best_score, best_sentence = score, sentence
    return best_sentence, top["source"]

if __name__ == "__main__":
    chunks = load_corpus()
    index = build_index(chunks)
    counts = word_counts(chunks)
    for query in ("what is nocturnal", "geckos eat", "climb"):
        answer, source = extract_answer(query, chunks, index, counts)
        print(f"Q: {query}")
        print(f"A: {answer}")
        print(f"  source: {source}\n")
```

The regex `(?<=[.!?])\s+` splits *after* punctuation and eats the following whitespace — a sentence splitter good enough for tidy prose. Scoring a sentence by `distinct` query tokens (`geckos` counts once, not twice) keeps a sentence that merely repeats the subject from beating one that answers the verb. The gratuitous honesty of the extractor: ask "climb" and it returns "They can climb smooth glass using tiny lamellae." *and the file it came from* — the citation is the feature, because the reader can check the work.

**🎯 Expected output:**

```
Q: what is nocturnal
A: Hamsters are nocturnal rodents.
  source: hamster.md

Q: geckos eat
A: Geckos eat insects such as crickets.
  source: gecko.md

Q: climb
A: They can climb smooth glass using tiny lamellae.
  source: gecko.md
```

**🩹 If it's off:** If "what is nocturnal" answers from gecko.md instead of hamster.md, the *chunk* ranking changed — the answerer can't be smarter than its search, and `search` currently favors the shorter chunk. If a best sentence is missing, `sentences()` shrank the split (regex missed an `\n\n` inside paragraph text) — that's exactly when you'd move chunking to sentence units.

### 4.2 Verify extraction

**✅ Checklist**

- ✅ Every answer cites `source` from the chunk it was found in — never fabricated.
- ✅ For `what is nocturnal`, source = the rank-1 chunk (`hamster.md`), consistent with Step 3.
- ✅ Sentence scoring reads distinct terms, so `geckos` appearing three times in one sentence doesn't dominate purely by repetition.

**🤔 Socratic Question(s)**

- "What do hamsters eat?" would search `hamsters`' chunk and extract "Hamsters are nocturnal rodents." — a sentence that *contains the word* but doesn't *answer the question*. What breaks that behavior (chunk -> sentence granularity, missing semantics), and what would a stop-word-plus-synonym step fix?
- The citation is the entire accountability layer: every answer points at a source file a human can open. What changes about trusting the answer if the citation were *summarized* ("from hamster.md-ish") rather than exact?

## Step 5: The interactive CLI

Everything so far is functions; the product is a loop. `ask.py` loads the corpus once, builds the index once, then prompts: ranks the top three chunks for a typed question, prints the extractive answer with its source, accepts the next question, and only stops on an empty line (or Ctrl-D). A real "chat with your docs" that runs entirely offline.

### 5.1 Write `ask.py`

**👟 Starter hint:** Silently compose ingest + index + search + extract under the hood; loop on `input()` until empty or EOF:

```python
# ask.py
from answer import extract_answer
from ingest import load_corpus
from index import build_index, word_counts
from search import search

def main() -> None:
    chunks = load_corpus()
    index = build_index(chunks)
    counts = word_counts(chunks)
    while True:
        try:
            query = input("ask> ").strip()
        except EOFError:
            break
        if not query:
            break
        for rank, (score, chunk) in enumerate(search(query, chunks, index, counts)[:3], 1):
            print(f"{rank}. {chunk['id']} ({score:.3f})")
            print(f"   {chunk['text']}")
        answer, source = extract_answer(query, chunks, index, counts)
        print(f"answer: {answer} [{source}]")

if __name__ == "__main__":
    main()
```

```bash
uv run python ask.py
```

`while True:` with `break` on empty input is the whole interactive contract — a question per turn, silence when the human is done, and a `try/except EOFError` so Ctrl-D (EOF) exits as gracefully as an empty line. The three-line loop over `search(...)[:3]` is where the ranked chunks *become* the chat, and the final `answer:` line is where retrieval becomes a response. Try `nocturnal`, then `climb`, then `humidity`, and notice the engine cites different files for different facts.

**🎯 Expected output** (a genuine session, one query after another):

```
ask> geckos eat
1. gecko.md#0 (0.120)
   Geckos are nocturnal lizards. They can climb smooth glass using tiny lamellae. Geckos eat insects such as crickets. Keep a warm branch in their tank.
2. hermit.md#0 (0.043)
   Hermit crabs are decapod crustaceans. They carry a borrowed shell for protection. Hermit crabs need high humidity. They eat fruit, vegetables, and shrimp.
3. hamster.md#0 (0.000)
   Hamsters are nocturnal rodents. They hoard seeds and nuts in their cheek pouches. Hamsters need soft bedding and a running wheel.
answer: Geckos eat insects such as crickets. [gecko.md]
ask> nocturnal
1. hamster.md#0 (0.048)
   Hamsters are nocturnal rodents. They hoard seeds and nuts in their cheek pouches. Hamsters need soft bedding and a running wheel.
2. gecko.md#0 (0.040)
   Geckos are nocturnal lizards. They can climb smooth glass using tiny lamellae. Geckos eat insects such as crickets. Keep a warm branch in their tank.
3. hermit.md#0 (0.000)
   Hermit crabs are decapod crustaceans. They carry a borrowed shell for protection. Hermit crabs need high humidity. They eat fruit, vegetables, and shrimp.
answer: Hamsters are nocturnal rodents. [hamster.md]
ask> 
```

**🩹 If it's off:** If the prompt repeats without accepting input, the `input` is inside the loop but the `break` on empty is missing — every empty line that isn't blank continues. If `ask.py` crashes on the first query, an import chain is broken (one of the four modules) — `uv run python -c "import ask"` surfaces exactly which.

### 5.2 Verify the CLI

**✅ Checklist**

- ✅ `uv run python ask.py` starts, answers `geckos eat` as in the session above, and exits on an empty line.
- ✅ An empty answer never appears: `extract_answer` always returns the best (possibly weak) sentence, never `""`.
- ✅ Terminating with Ctrl-D exits cleanly without a traceback.

**🤔 Socratic Question(s)**

- The CLI composes four modules but depends on them *by filename*. What would break if a teammate renamed `answer.py` to `answers.py` — and what does that tell you about importing whole modules versus importing functions?
- The session transcript is deterministic *because* the corpus and index are deterministic. What's the first thing that makes output non-deterministic (hint: Step 1's `sorted()` and Step 5's fixed top-3) — and which choice protects your tests?

## ⚠️ Common pitfalls

- **Chunk ids from paths.** `f"{path}"` stamps `docs/gecko.md#0` into every id and quietly breaks the citation contract. Use `path.name` — short, stable, human-readable.
- **Scoring before normalizing.** Raw term counts make the 25-word gecko chunk look stronger than the 21-word hamster chunk for the same single hit. Divide by chunk length, or the "retrieval quality" you debug is mostly "length bias".
- **Re-indexing per query.** An index built inside `search()` runs the expensive part on every question. Build once, query many — the CLI's `main()` loads it before the loop for exactly that reason.
- **Sentences that were punctuation-aware, then not.** `text.split(". ")` misses `!`, `?`, and trailing whitespace; the `(?<=[.!?])\s+` lookbehind handles all three. Split sloppily, answer late.
- **Treating the index as the answer.** The index finds chunks; `extract_answer` picks sentences; neither "understands". If a demo answer is wrong, check whether search ranked correctly and the sentence scorer mis-placed terms — the bug is usually one layer lower than the symptom.

## What you just built

A four-layer retrieval engine with no dependencies: chunker → inverted index → ranker → extractor, wrapped in an interactive CLI, and every answer cites its source file. The transferable architecture is *layered recall*: you never ask the index for an answer — you ask it for candidates, score the candidates, and extract from the best. Swap the chunker, the scorer (IDF, BM25), or the extractor (summarizer) independently, and the pipeline's shape — candidates, not answers — is what survives.

:::tip[Run a fuller version without any local setup]
[`examples/document-qa-engine/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/document-qa-engine) in the course repo has the complete scripts plus the same three-file corpus. Or open the whole repo in a [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Where to go from here

- Add **IDF weighting**: rare terms boost a chunk's score while ubiquitous ones (`the`) shrink it — the single biggest accuracy jump under a dozen lines in `search`.
- Move the chunker to **sentence units**: split on `sentences()` in `load_corpus` so "which sentence mentions X" is pre-computed, burning chunk memory for answer quality.
- Add a **synonym table** map (`lizard → gecko`, `crustacean → hermit crab`) expanded at index time — cheap recall, and the natural next answering win.
- Persist the index (**`index.json` dump/load**) so a big corpus builds once and `ask.py` restarts instantly without re-reading every file.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓