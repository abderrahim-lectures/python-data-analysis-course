---
id: rag-notes
title: "Build a RAG App Over Your Own Notes"
sidebar_label: "Build a RAG App"
slug: /projects/rag-notes
description: "Graduate from the in-browser playground to real Python: build a retrieval-augmented generation app that lets you chat with your own notes, with local embeddings and a free-tier LLM."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Build a RAG App Over Your Own Notes

<ProjectPublishedDate projectId="rag-notes" />

<ProjectGreeting />

Everything in the course so far ran in a sandboxed, in-browser playground — so you could start writing Python on day one with zero setup. This project is the graduation step: install Python for real on your own machine, then use it to build a tool you might actually keep using — an app that answers questions about a folder of your own notes, by searching them first and only then asking a language model to answer using what it found. This assumes Python 101; nothing from Data Analysis is required, though it helps if `numpy` arrays already feel familiar.

This is optional and ungraded. See [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Install `uv`, a fast, modern tool for managing Python itself and your project's dependencies.
2. Take a folder of your own `.md`/`.txt` notes and split them into small, searchable chunks.
3. Turn each chunk into a vector — a list of numbers capturing its meaning — entirely locally, with no API key and no cost, using `sentence-transformers`.
4. Write a small local search function that finds the chunks most relevant to a question, using nothing but `numpy`.
5. Get a free-tier LLM API key and write a script that retrieves relevant chunks, then asks the model to answer *using only that context*.

## Where to run this

**Locally with `uv`** is the path this lesson's steps follow, and the recommended one — it's real Python running on your own machine, the same "graduate to real Python" move as every other project in this section. Step 1 below walks through installing it.

**GitHub Codespaces** is a zero-setup alternative if you'd rather not install anything locally yet: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed, per the repo's `.devcontainer/devcontainer.json`) and run the exact same `uv` commands from a terminal in your browser tab.

**Google Colab or Kaggle Notebooks** also work, since this project — unlike the fine-tuning one — needs no GPU: create a new notebook, run `!pip install sentence-transformers numpy` in a cell, then paste the scripts below in as notebook cells, adapting file paths as needed. Be honest with yourself about the tradeoff, though: this is a lower-fidelity way to experience the project than a real local `uv` project — no separate files, no real project structure, just cells in a notebook. Treat it as a quick way to experiment, not the primary path.

## Step 1: Install `uv`

`uv` is a single tool that replaces the usual "install Python, then install pip, then install a virtual environment tool, then install packages" chain — it can install and manage Python versions itself, alongside your project's dependencies.

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

Then set up a project:

```bash
uv init rag-notes
cd rag-notes
uv add sentence-transformers numpy python-dotenv
```

`sentence-transformers` is the library that turns text into vectors locally, on your own CPU — no API call, no key. `numpy` does the actual math for comparing vectors. `python-dotenv` lets you keep your LLM API key (Step 5) in a local `.env` file.

## Step 2: Prepare your notes

Put your notes in a `notes/` folder as plain `.md` or `.txt` files — lecture notes, a journal, documentation you've written, anything. The app you're building only ever answers from what's actually in these files.

You can't hand a whole file to an embedding model and expect a useful search result back. Two reasons:

- **Embedding models have a context limit.** `all-MiniLM-L6-v2`, the model this project uses, truncates input past 256 word-pieces — feed it a 2,000-word file and everything past the limit is silently ignored.
- **A big chunk's vector is a blurry average.** If a note covers five different subtopics, its single embedding vector ends up somewhere in the middle of all five — close to none of them precisely. Search a question about just one subtopic, and that vector may not rank highly even though the answer is right there in the text. Smaller, more focused chunks each get a sharper, more specific vector, so retrieval finds the *actual* relevant passage instead of a whole file that's only partly relevant.

Split each file into chunks by paragraph, then re-merge tiny paragraphs up to a target size so you're not left with dozens of one-line fragments:

```python
# prepare_notes.py
"""Splits every .md/.txt file in notes/ into a list of text chunks.

Run with: uv run python prepare_notes.py

This only prints a summary -- build_index.py (Step 3) imports load_chunks()
from this file and does the actual embedding.
"""

from pathlib import Path

NOTES_DIR = Path("notes")
TARGET_CHUNK_SIZE = 500  # characters -- small enough to stay focused,
                         # large enough to hold a full thought


def split_into_paragraphs(text: str) -> list[str]:
    """Splits on blank lines, dropping empty paragraphs."""
    paragraphs = [p.strip() for p in text.split("\n\n")]
    return [p for p in paragraphs if p]


def merge_short_paragraphs(paragraphs: list[str], target_size: int) -> list[str]:
    """Greedily merges consecutive short paragraphs up to target_size characters,
    so a chunk isn't just one short line with barely any context in it."""
    chunks = []
    current = ""
    for paragraph in paragraphs:
        if current and len(current) + len(paragraph) > target_size:
            chunks.append(current)
            current = paragraph
        else:
            current = f"{current}\n\n{paragraph}" if current else paragraph
    if current:
        chunks.append(current)
    return chunks


def load_chunks() -> list[dict]:
    """Returns a list of {"text": ..., "source": ...} dicts, one per chunk,
    across every .md/.txt file in NOTES_DIR."""
    chunks = []
    for path in sorted(NOTES_DIR.glob("*.md")) + sorted(NOTES_DIR.glob("*.txt")):
        text = path.read_text(encoding="utf-8")
        paragraphs = split_into_paragraphs(text)
        for chunk_text in merge_short_paragraphs(paragraphs, TARGET_CHUNK_SIZE):
            chunks.append({"text": chunk_text, "source": path.name})
    return chunks


if __name__ == "__main__":
    chunks = load_chunks()
    print(f"Loaded {len(chunks)} chunks from {NOTES_DIR}/")
    for chunk in chunks[:3]:
        preview = chunk["text"][:80].replace("\n", " ")
        print(f"  [{chunk['source']}] {preview}...")
```

```bash
uv run python prepare_notes.py
```

:::tip[Chunk size is a tradeoff, not a fixed rule]
Smaller chunks retrieve more precisely (a question matches a narrow, specific piece of text) but lose surrounding context (the model sees an isolated fragment, not the paragraph around it). Larger chunks keep more context but retrieve less precisely, for the same reason a whole file does, just less severely. 500 characters is a reasonable starting point for prose notes — there's no universally correct number, and it's worth trying a few sizes on your own notes to see what retrieves better.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python prepare_notes.py` runs without errors and prints a nonzero chunk count.</StepChecklistItem>
<StepChecklistItem>The printed previews look like real fragments of your notes, not empty strings or giant walls of merged text.</StepChecklistItem>
<StepChecklistItem>`NOTES_DIR` points at a folder that actually contains `.md`/`.txt` files.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- If you split on blank lines but one of your notes files has no blank lines at all (just one giant paragraph), what would `split_into_paragraphs` return, and what would that do to retrieval later?
- What would happen to retrieval quality if you made `TARGET_CHUNK_SIZE` much larger — say, 5,000 characters? Much smaller, like 50? Why?

## Step 3: Embed your notes locally

An **embedding** is a list of numbers — a vector — that represents a piece of text's *meaning*, not its exact wording. `all-MiniLM-L6-v2` maps each chunk to a point in 384-dimensional space, and it's trained so that chunks with similar meaning end up close together in that space, while unrelated chunks end up far apart. You already have the core intuition for this: it's the same idea as plotting numeric data on axes, just with 384 axes instead of 2, and "close together" measured the same way you'd measure distance in any space of numbers.

This model is small (about 80MB), runs entirely on your CPU in about a second per chunk on a typical laptop, needs no API key, and costs nothing — unlike the LLM in Step 5, embedding is fully local.

```python
# build_index.py
"""Embeds every chunk from prepare_notes.py and saves the vectors + text
locally, so retrieve() (Step 4) doesn't need to re-embed anything at query time.

Run with: uv run python build_index.py
Re-run this any time you add or edit files in notes/ -- the saved index
doesn't update itself.
"""

import json

import numpy as np
from sentence_transformers import SentenceTransformer

from prepare_notes import load_chunks

MODEL_NAME = "all-MiniLM-L6-v2"
INDEX_PATH = "index.npy"
CHUNKS_PATH = "chunks.json"


def main() -> None:
    chunks = load_chunks()
    if not chunks:
        print("No chunks found -- add some .md/.txt files to notes/ first.")
        return

    print(f"Embedding {len(chunks)} chunks with {MODEL_NAME}...")
    model = SentenceTransformer(MODEL_NAME)
    texts = [chunk["text"] for chunk in chunks]
    embeddings = model.encode(texts, normalize_embeddings=True)

    np.save(INDEX_PATH, embeddings)
    with open(CHUNKS_PATH, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)

    print(f"Saved {embeddings.shape[0]} vectors ({embeddings.shape[1]}-dim) to {INDEX_PATH}")
    print(f"Saved chunk text/metadata to {CHUNKS_PATH}")


if __name__ == "__main__":
    main()
```

```bash
uv run python build_index.py
```

This deliberately avoids a vector database — for a personal folder of notes (hundreds or low thousands of chunks, not millions), a plain NumPy array that fits comfortably in memory is simpler, has no extra service to install or run, and is fully transparent: `index.npy` is a matrix, `chunks.json` is the text it came from, nothing more.

`normalize_embeddings=True` scales every vector to length 1 — worth doing now rather than at query time, since it's what makes Step 4's cosine similarity reduce to a single dot product.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python build_index.py` completed without errors.</StepChecklistItem>
<StepChecklistItem>An `index.npy` file and a `chunks.json` file now exist in your project folder.</StepChecklistItem>
<StepChecklistItem>The printed shape's first number matches the chunk count from Step 2, and the second number is 384.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Two chunks use the word "Python" in completely different senses — one about the programming language, one about a snake. Do you expect their embedding vectors to end up close together or far apart? What does that tell you about what the embedding model is actually capturing?
- Why save the embeddings to a file at all, instead of just re-embedding all your notes every time you ask a question?

## Step 4: Retrieve relevant chunks

To find which chunks are relevant to a question, embed the question with the *same* model, then rank every chunk by how close its vector is to the question's vector. The standard way to measure "close" for embeddings is **cosine similarity** — the cosine of the angle between two vectors, which cares about *direction* (meaning) and ignores *magnitude* (roughly, text length):

$$
\text{cosine\_similarity}(a, b) = \frac{a \cdot b}{\|a\| \, \|b\|}
$$

Since every vector was already normalized to length 1 when it was saved ($\|a\| = \|b\| = 1$), the denominator is just 1, and cosine similarity collapses to a plain dot product — one reason to normalize at embedding time rather than skip it:

```python
# retrieve.py
"""Given a question, finds the notes chunks most relevant to it.

Imported by ask.py (Step 5) -- not meant to be run directly, though the
__main__ block below lets you try it standalone.
"""

import json

import numpy as np
from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"
INDEX_PATH = "index.npy"
CHUNKS_PATH = "chunks.json"

_model = None  # loaded lazily so importing this module doesn't load the model


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def retrieve(question: str, top_k: int = 3) -> list[dict]:
    """Returns the top_k chunks most similar to `question`, each with its
    similarity score, ranked highest first."""
    embeddings = np.load(INDEX_PATH)
    with open(CHUNKS_PATH, encoding="utf-8") as f:
        chunks = json.load(f)

    question_vector = get_model().encode([question], normalize_embeddings=True)[0]

    # Every row of `embeddings` is already unit-length (Step 3), and so is
    # question_vector, so this dot product *is* the cosine similarity.
    similarities = embeddings @ question_vector

    top_indices = np.argsort(similarities)[::-1][:top_k]
    return [
        {**chunks[i], "score": float(similarities[i])}
        for i in top_indices
    ]


if __name__ == "__main__":
    results = retrieve("What is this course about?")
    for r in results:
        print(f"{r['score']:.3f}  [{r['source']}]  {r['text'][:80]}...")
```

```bash
uv run python retrieve.py
```

`embeddings @ question_vector` is matrix-vector multiplication: every row of the matrix dotted with the question vector, all at once, in one NumPy call — the same operation from the course's linear algebra material, here doing the actual work of comparing one question against every chunk in the notes.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python retrieve.py` prints `top_k` results, each with a similarity score and a source filename.</StepChecklistItem>
<StepChecklistItem>The top-ranked chunk for an easy, obvious test question actually looks relevant when you read it.</StepChecklistItem>
<StepChecklistItem>Scores are between -1 and 1 (the valid range for cosine similarity) — if you see numbers far outside that, one of the vectors probably wasn't normalized.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- `np.argsort(similarities)[::-1][:top_k]` sorts *all* similarities before taking the top few. For a personal notes folder this is fine, but why might sorting the entire array become a problem if you had ten million chunks instead of a few hundred?
- What would you expect to happen to the top result's score if you asked a question that has no real answer anywhere in your notes? Try it — does the score confirm your prediction?

## Step 5: Generate an answer with a free LLM

Retrieval alone gives you back raw chunks of your own notes — useful, but not a written answer. The last step hands those chunks to a language model as context and asks it to answer *using them*. This is what "RAG" (retrieval-augmented generation) means: generation, augmented by a retrieval step run first.

**Pick whichever provider you like** — none of them require a credit card at the time of writing, and this course doesn't favor one over another.

| Provider | Where to get a key | Why you might pick it |
|---|---|---|
| **GitHub Models** *(suggested default)* | [github.com/settings/tokens](https://github.com/settings/tokens) — a personal access token with the `models: read` scope | No separate signup — you already have a GitHub account. More generous free-tier limits than Gemini's. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | The most commonly referenced option. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Fast inference, generous free tier, no card. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | One of the more generous permanent free quotas. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | High daily token volume, no card. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | One API, many free models — good for comparing providers. |

Whichever you pick, the process is the same:

1. Sign in and generate an API key on that provider's site.
2. **Never paste this key directly into code or commit it to a repository.** Put it in a `.env` file instead (already gitignored if you followed Step 1):

```bash
# .env
GITHUB_TOKEN=your-key-here
```

`python-dotenv` (installed in Step 1) reads this file into `os.environ` automatically, the same pattern used throughout the [AI Agent project](/docs/projects/ai-agent) if you've done that one — GitHub Models happens to expose an OpenAI-compatible API, so the plain `openai` client library works for it without any extra package:

```bash
uv add openai
```

```python
# ask.py
"""Retrieves relevant chunks for a question, then asks a free-tier LLM to
answer using only that context.

Run with: uv run python ask.py "your question here"
"""

import os
import sys

from dotenv import load_dotenv
from openai import OpenAI

from retrieve import retrieve

load_dotenv()

PROMPT_TEMPLATE = """Answer the question using ONLY the context below. If the
context doesn't contain the answer, say so -- do not make something up.

Context:
{context}

Question: {question}

Answer:"""


def build_prompt(question: str, chunks: list[dict]) -> str:
    context = "\n\n".join(f"[{c['source']}] {c['text']}" for c in chunks)
    return PROMPT_TEMPLATE.format(context=context, question=question)


def ask(question: str, top_k: int = 3) -> str:
    chunks = retrieve(question, top_k=top_k)
    prompt = build_prompt(question, chunks)

    client = OpenAI(
        api_key=os.environ["GITHUB_TOKEN"],
        base_url="https://models.github.ai/inference",
    )
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # confirm this still has a free tier before running
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content


if __name__ == "__main__":
    question = " ".join(sys.argv[1:]) or "What is this course about?"
    print(ask(question))
```

```bash
uv run python ask.py "What is this course about?"
```

`build_prompt` is the whole idea of RAG in one function: it doesn't ask the model to answer from what it already knows, it hands the model the *actual retrieved text* and asks it to answer from that — which is why a RAG app can correctly answer questions about notes the underlying model has never seen before, written yesterday, on your own machine.

:::tip[Using a different provider?]
Swap the `OpenAI(...)` block for your provider's own client, following the same pattern as the [AI Agent project](/docs/projects/ai-agent#step-4-write-your-first-agent) — e.g. Google's `google-genai` package for Gemini, or `groq`'s own client for Groq. Cerebras and OpenRouter are also OpenAI-compatible, so the `openai` package works for them too, just with a different `base_url`.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python ask.py "a real question about your notes"` prints an answer, not a traceback.</StepChecklistItem>
<StepChecklistItem>The answer actually reflects the content of your notes, not generic knowledge the model already had.</StepChecklistItem>
<StepChecklistItem>Asking something your notes clearly don't cover makes the model say so, rather than confidently making something up.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- The prompt template explicitly says "using ONLY the context below" and "if the context doesn't contain the answer, say so." What do you think would happen if you removed that instruction and just handed the model the context and question with no guidance? Try it.
- If `retrieve()` returns the *wrong* chunks for a question — relevant-looking but not actually the answer — can a good language model still get the answer right? What does that suggest about which part of this pipeline matters more when something goes wrong: retrieval or generation?

## ⚠️ Common pitfalls

- **Chunks too large or too small.** Too large and retrieval gets blurry (Step 2); too small and a chunk loses the surrounding context the model needs to answer well. If answers feel off, try a different `TARGET_CHUNK_SIZE` and re-run `build_index.py`.
- **Forgetting to rebuild the index after editing `notes/`.** `build_index.py` only runs when you run it — add a new note, and `retrieve()` won't find anything in it until you re-run `uv run python build_index.py`. There's no file-watcher here; this is a manual step by design, so you always know exactly what's indexed.
- **Embedding the question with a different model than the one used to build the index.** `retrieve.py` and `build_index.py` both hardcode `MODEL_NAME = "all-MiniLM-L6-v2"` on purpose — vectors from two different embedding models aren't comparable to each other at all, even if both are "384-dimensional." Change the model in one file and you must change it in both, then rebuild the index.
- **Rate limits on the free LLM tier.** Retrieval (Steps 3-4) is local and unlimited; only Step 5's `ask()` call counts against your provider's free-tier quota. A 429 error there is the provider telling you to slow down, not a bug — see the [AI Agent project](/docs/projects/ai-agent#handling-rate-limits) for the same pattern and a retry approach you can copy.

## What you just built

A small but complete RAG pipeline: chunking, local embedding, in-memory similarity search, and a final generation step grounded in your own retrieved text — the same architecture behind much larger production systems, just with a flat NumPy array standing in for a vector database and a free-tier API standing in for a paid one. Nothing here was faked or simplified into a toy that doesn't generalize; swap in a bigger notes folder and a paid model, and the same four steps are still the whole pipeline.

## Where to go from here

- Once your notes folder outgrows what comfortably fits in memory (tens of thousands of chunks), look at a real vector database like [ChromaDB](https://www.trychroma.com/) — it does the same nearest-neighbor search as `retrieve()` above, just indexed for speed at a much larger scale, with the on-disk persistence and filtering this flat-file version doesn't have.
- Try **re-ranking**: retrieve a larger top-k (say, 10) with the fast embedding search, then use a slower, more accurate cross-encoder model to re-score just those 10 before picking the final 3 to send to the LLM — a common two-stage pattern in production RAG systems.
- Extend `prepare_notes.py` to handle more file types — PDFs (`pypdf`), or even your own past chat exports — the chunking and embedding steps downstream don't care where the text came from.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓

<ProjectProgressCheckbox projectId="rag-notes" />
