---
id: chat-with-pdfs
title: "Chat with Your PDFs"
sidebar_label: "Chat with Your PDFs"
slug: /projects/chat-with-pdfs
description: "Build a multi-document RAG app over a folder of PDFs, with local embeddings, a free-tier LLM, and page-number citations in every answer."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Chat with Your PDFs

<ProjectPublishedDate projectId="2027-chat-with-pdfs" />

<ProjectGreeting />

The [RAG App project](/docs/projects/rag-notes) chats with a folder of plain-text notes. This project takes the same idea somewhere more useful: a folder of real PDFs — reports, guides, handbooks, papers — with answers that cite exactly which document and which page a fact came from, the way a research assistant would. This assumes Python 101; it also helps a lot to have already built the RAG App project, since this one reuses its whole architecture and only changes how the source documents are read and cited, but it isn't a strict requirement if you're comfortable with the concepts.

This is optional and ungraded. See [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Extract text from a folder of PDFs, page by page, and split it into small chunks — keeping each chunk's source filename and page number attached.
2. Turn each chunk into a vector, entirely locally, with no API key and no cost, using `sentence-transformers`.
3. Retrieve the chunks most relevant to a question across *all* the PDFs at once, then ask a free-tier LLM to answer using only that context — with a `(source, page N)` citation required for every fact.
4. Wrap it all in a small interactive loop so you can keep asking questions without re-running a script each time.

## Where to run this

**Locally with `uv`** is the path this lesson's steps follow, and the recommended one — it's real Python running on your own machine, the same "graduate to real Python" move as every other project in this section. The Setup section below walks through installing it.

**GitHub Codespaces** is a zero-setup alternative if you'd rather not install anything locally yet: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed, per the repo's `.devcontainer/devcontainer.json`) and run the exact same `uv` commands from a terminal in your browser tab.

**Google Colab, Kaggle Notebooks, or Binder** also work, since this project needs no GPU — a real, runnable notebook version of this project's pipeline (the same PDF chunking, local embedding, and cited-answer generation as the steps below) lives at [`examples/chat-with-pdfs/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/add-chat-with-pdfs-project/examples/chat-with-pdfs/notebook.ipynb). Click a badge to launch it directly, no local install at all (these currently point at this project's branch; they'll point at `main` once merged):

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/add-chat-with-pdfs-project/examples/chat-with-pdfs/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/add-chat-with-pdfs-project/examples/chat-with-pdfs/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/add-chat-with-pdfs-project?filepath=examples%2Fchat-with-pdfs%2Fnotebook.ipynb)

Be honest with yourself about the tradeoff, though: this is a lower-fidelity way to experience the project than a real local `uv` project — no separate files, no real project structure, just cells in a notebook. Treat it as a quick way to experiment, not the primary path.

## Setup

### Install `uv`

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
uv init chat-with-pdfs
cd chat-with-pdfs
uv add pypdf sentence-transformers numpy openai python-dotenv
```

`pypdf` reads text out of PDF files. `sentence-transformers` is the library that turns text into vectors locally, on your own CPU — no API call, no key. `numpy` does the actual math for comparing vectors. `python-dotenv` lets you keep your LLM API key in a local `.env` file.

### Get a free LLM API key

Generation (the last part of Step 3) needs a free-tier LLM API — extraction, chunking, embedding, and retrieval are all fully local and need no key at all, but it's simplest to get this set up now, before you start building, rather than pausing partway through.

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
2. **Never paste this key directly into code or commit it to a repository.** Put it in a `.env` file instead (already gitignored):

```bash
# .env
GITHUB_TOKEN=your-key-here
```

`python-dotenv` (installed above) reads this file into `os.environ` automatically, the same pattern used in the [RAG App project](/docs/projects/rag-notes) and the [AI Agent project](/docs/projects/ai-agent) if you've done either of those — GitHub Models happens to expose an OpenAI-compatible API, so the plain `openai` client library works for it without any extra package:

```bash
uv add openai
```

If you picked a different provider, swap in that provider's own client when you get to the generation step below (see the tip there).

### Get some PDFs

Put a handful of real PDFs — reports, guides, papers, anything with actual text in it (not scanned images) — into a `pdfs/` folder inside your project. If you don't have any handy, copy the three short sample PDFs from [`examples/chat-with-pdfs/pdfs/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/chat-with-pdfs/pdfs), or generate your own with the [example's `generate_sample_pdfs.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/chat-with-pdfs/generate_sample_pdfs.py) script.

## Step 1: Load and chunk your PDFs

`pypdf` extracts text from a PDF one page at a time, which is exactly the granularity this project needs — it's what makes it possible to say *which page* an answer came from later. As with the RAG App project, a whole page is usually still too big and too unfocused to embed well, so each page gets split into smaller chunks — but unlike that project, every chunk here must also remember which file and which page it came from.

```python
# load_pdfs.py
"""Loads every PDF in pdfs/, extracts text page by page, and splits each
page into small chunks -- keeping the source filename and page number
attached to every chunk, so later answers can cite exactly where a fact
came from.

Run with: uv run python load_pdfs.py

This only prints a summary -- build_index.py (Step 2) imports load_chunks()
from this file and does the actual embedding.
"""

from pathlib import Path

from pypdf import PdfReader

PDFS_DIR = Path("pdfs")
TARGET_CHUNK_SIZE = 500  # characters -- small enough to stay focused,
                         # large enough to hold a full thought


def split_into_paragraphs(text: str) -> list[str]:
    """Splits on blank lines, dropping empty paragraphs. Falls back to
    splitting on single newlines if a page has no blank-line breaks at
    all, which is common in PDFs extracted from single-column layouts."""
    paragraphs = [p.strip() for p in text.split("\n\n")]
    paragraphs = [p for p in paragraphs if p]
    if len(paragraphs) <= 1:
        paragraphs = [p.strip() for p in text.split("\n")]
        paragraphs = [p for p in paragraphs if p]
    return paragraphs


def merge_short_paragraphs(paragraphs: list[str], target_size: int) -> list[str]:
    """Greedily merges consecutive short paragraphs up to target_size
    characters, so a chunk isn't just one short line with barely any
    context in it."""
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
    """Returns a list of {"text", "source", "page"} dicts, one per chunk,
    across every PDF in PDFS_DIR. `page` is 1-indexed, matching what a
    human reading the PDF would call "page N" -- pypdf's own page indices
    are 0-based, so every page number here has +1 applied."""
    chunks = []
    for path in sorted(PDFS_DIR.glob("*.pdf")):
        reader = PdfReader(str(path))
        for page_index, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            paragraphs = split_into_paragraphs(text)
            for chunk_text in merge_short_paragraphs(paragraphs, TARGET_CHUNK_SIZE):
                chunks.append({
                    "text": chunk_text,
                    "source": path.name,
                    "page": page_index + 1,
                })
    return chunks


if __name__ == "__main__":
    chunks = load_chunks()
    print(f"Loaded {len(chunks)} chunks from {PDFS_DIR}/")
    for chunk in chunks[:3]:
        preview = chunk["text"][:80].replace("\n", " ")
        print(f"  [{chunk['source']} p{chunk['page']}] {preview}...")
```

```bash
uv run python load_pdfs.py
```

:::tip[Multiple documents, one pipeline]
Nothing downstream of `load_chunks()` needs to know or care how many PDFs there are, or which one a chunk came from — every chunk carries its own `source` and `page`, so retrieval naturally searches across *all* your PDFs at once, and the eventual answer can mix facts from several different documents in one response, each correctly attributed.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python load_pdfs.py` runs without errors and prints a nonzero chunk count.</StepChecklistItem>
<StepChecklistItem>The printed previews look like real fragments of your PDFs' text, not empty strings or garbled characters.</StepChecklistItem>
<StepChecklistItem>Each printed chunk shows both a filename and a page number that match what you'd see opening the PDF yourself.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Why extract text *per page* rather than reading the whole PDF into one big string and chunking that? What information would you lose?
- A scanned PDF (a photo of a paper document, with no real embedded text) would make `page.extract_text()` return an empty string for every page. How would you notice this had happened, and what would you need to add to handle it (hint: look up "OCR")?

## Step 2: Embed your chunks locally

This step is identical in spirit to the RAG App project's embedding step — the same model, the same reasoning, just embedding PDF-derived chunks instead of notes chunks. `all-MiniLM-L6-v2` maps each chunk to a point in 384-dimensional space, trained so that chunks with similar meaning end up close together. It's small (about 80MB), runs entirely on your CPU in about a second per chunk on a typical laptop, needs no API key, and costs nothing.

```python
# build_index.py
"""Embeds every chunk from load_pdfs.py and saves the vectors + text
(including source filename and page number) locally, so retrieve() (Step 3)
doesn't need to re-embed anything at query time.

Run with: uv run python build_index.py
Re-run this any time you add, remove, or edit files in pdfs/ -- the saved
index doesn't update itself.
"""

import json

import numpy as np
from sentence_transformers import SentenceTransformer

from load_pdfs import load_chunks

MODEL_NAME = "all-MiniLM-L6-v2"
INDEX_PATH = "index.npy"
CHUNKS_PATH = "chunks.json"


def main() -> None:
    chunks = load_chunks()
    if not chunks:
        print("No chunks found -- add some .pdf files to pdfs/ first.")
        return

    print(f"Embedding {len(chunks)} chunks with {MODEL_NAME}...")
    model = SentenceTransformer(MODEL_NAME)
    texts = [chunk["text"] for chunk in chunks]
    embeddings = model.encode(texts, normalize_embeddings=True)

    np.save(INDEX_PATH, embeddings)
    with open(CHUNKS_PATH, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)

    print(f"Saved {embeddings.shape[0]} vectors ({embeddings.shape[1]}-dim) to {INDEX_PATH}")
    print(f"Saved chunk text/metadata (source + page) to {CHUNKS_PATH}")


if __name__ == "__main__":
    main()
```

```bash
uv run python build_index.py
```

Just like the RAG App project, this deliberately avoids a vector database — for a personal folder of PDFs (dozens to low hundreds of documents, not millions), a plain NumPy array is simpler, has no extra service to install or run, and is fully transparent. `normalize_embeddings=True` scales every vector to length 1, which is what makes Step 3's cosine similarity reduce to a single dot product.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python build_index.py` completed without errors.</StepChecklistItem>
<StepChecklistItem>An `index.npy` file and a `chunks.json` file now exist in your project folder.</StepChecklistItem>
<StepChecklistItem>Opening `chunks.json`, each entry has a `text`, `source`, and `page` field.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- If two different PDFs happen to contain nearly identical sentences (say, both quote the same regulation), what would you expect their embedding vectors to look like relative to each other?
- Why re-embed the *chunks* here but not the PDFs themselves? What would embedding a whole PDF as a single vector lose, compared to embedding each of its chunks separately?

## Step 3: Retrieve and generate a cited answer

Retrieval works exactly like the RAG App project — embed the question, rank every chunk by cosine similarity, take the top few — except now the ranking runs across every chunk from every PDF at once, so the most relevant result for a question might come from any of your documents.

```python
# retrieve.py
"""Given a question, finds the PDF chunks most relevant to it, across every
document in pdfs/ -- each result carries its source filename and page number.

Imported by ask.py -- not meant to be run directly, though the __main__
block below lets you try it standalone.
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


def retrieve(question: str, top_k: int = 4) -> list[dict]:
    """Returns the top_k chunks most similar to `question`, each with its
    similarity score, source document, and page number, ranked highest
    first -- possibly drawn from several different PDFs at once."""
    embeddings = np.load(INDEX_PATH)
    with open(CHUNKS_PATH, encoding="utf-8") as f:
        chunks = json.load(f)

    question_vector = get_model().encode([question], normalize_embeddings=True)[0]

    # Every row of `embeddings` is already unit-length (Step 2), and so is
    # question_vector, so this dot product *is* the cosine similarity.
    similarities = embeddings @ question_vector

    top_indices = np.argsort(similarities)[::-1][:top_k]
    return [
        {**chunks[i], "score": float(similarities[i])}
        for i in top_indices
    ]


if __name__ == "__main__":
    results = retrieve("How many days of paid time off do employees get?")
    for r in results:
        print(f"{r['score']:.3f}  [{r['source']} p{r['page']}]  {r['text'][:80]}...")
```

```bash
uv run python retrieve.py
```

Now generation. The prompt is the whole idea of RAG-with-citations in one place: it hands the model the retrieved chunks *labeled with their source and page*, and requires every fact in the answer to be followed by a `(source, page N)` citation copied from that label — the model isn't inventing citations, it's echoing back the ones already attached to the text it was given.

```python
# ask.py
"""Retrieves relevant chunks across every PDF in pdfs/, then asks a
free-tier LLM to answer using only that context -- citing which document
and page each part of the answer came from.

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

Every fact you use MUST be followed by a citation in the form
(source, page N), taken from the [source, page N] tag on the context chunk
it came from. If your answer draws on more than one chunk, cite each one.

Context:
{context}

Question: {question}

Answer:"""


def build_prompt(question: str, chunks: list[dict]) -> str:
    context = "\n\n".join(
        f"[{c['source']}, page {c['page']}] {c['text']}" for c in chunks
    )
    return PROMPT_TEMPLATE.format(context=context, question=question)


def ask(question: str, top_k: int = 4) -> str:
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
    question = " ".join(sys.argv[1:]) or "How many days of paid time off do employees get?"
    print(ask(question))
```

```bash
uv run python ask.py "How many days of paid time off do employees get?"
```

:::tip[Using a different provider?]
Swap the `OpenAI(...)` block for your provider's own client, following the same pattern as the [RAG App project](/docs/projects/rag-notes) and the [AI Agent project](/docs/projects/ai-agent) — e.g. Google's `google-genai` package for Gemini, or `groq`'s own client for Groq. Cerebras and OpenRouter are also OpenAI-compatible, so the `openai` package works for them too, just with a different `base_url`.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python retrieve.py` prints results from your PDFs with plausible-looking source filenames and page numbers.</StepChecklistItem>
<StepChecklistItem>`uv run python ask.py "a real question"` prints an answer, not a traceback.</StepChecklistItem>
<StepChecklistItem>Every factual claim in the answer is followed by a `(source, page N)` citation, and each citation's page actually contains that fact when you check the PDF.</StepChecklistItem>
<StepChecklistItem>Asking something your PDFs clearly don't cover makes the model say so, rather than confidently making something up (including a fake citation).</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- The prompt requires a citation for *every* fact. What do you expect to happen if you remove that requirement — would the model still tend to answer accurately, or does asking for citations actually change how carefully it sticks to the context? Try both and compare.
- If `retrieve()` pulls the top chunk from the right page but the *wrong* PDF (say, two different products both mention "warranty"), would you notice from reading the citation alone? What does that suggest about always checking citations rather than trusting an answer just because it has one?

## Step 4: A small interactive loop

Re-running `ask.py` with a new command-line argument for every question works, but it's slow to iterate with. Wrap it in a small loop instead, so you can keep chatting with your PDFs in one running session.

```python
# chat.py
"""A small interactive loop: keep asking questions about the PDFs in pdfs/
until you type "quit" or "exit".

Run with: uv run python chat.py
"""

from ask import ask


def main() -> None:
    print("Chat with your PDFs -- ask a question, or type 'quit' to stop.\n")
    while True:
        question = input("> ").strip()
        if not question:
            continue
        if question.lower() in {"quit", "exit"}:
            break
        answer = ask(question)
        print(f"\n{answer}\n")


if __name__ == "__main__":
    main()
```

```bash
uv run python chat.py
```

:::tip[This is the whole app]
There's no server, no framework, no UI toolkit here — a `while True` loop around `ask()` *is* a legitimate chat app. Every "chat with your data" product you've seen is this same loop underneath, with a web frontend, streaming responses, and conversation history layered on top. None of those layers change what's actually happening: retrieve, then generate, then print.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python chat.py` starts, accepts a question, prints a cited answer, and loops back to a new `>` prompt.</StepChecklistItem>
<StepChecklistItem>Typing `quit` or `exit` ends the loop cleanly.</StepChecklistItem>
<StepChecklistItem>You can ask two different questions about two different PDFs in the same session without restarting anything.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Each call to `ask()` re-loads `index.npy` and `chunks.json` from disk and reloads the embedding model. For a single question that's fine — what would you change in `chat.py` and `retrieve.py` if you wanted the loop to feel snappier after the first question?
- This loop has no memory of earlier questions — each `ask()` call is independent. What would break if you asked a follow-up like "what about the second one?" right after another question? What would you need to add to support that?

## ⚠️ Common pitfalls

- **Scanned, image-only PDFs return no text.** `pypdf`'s `extract_text()` only reads text that's actually embedded in the PDF — a PDF made from photographed or scanned pages has no embedded text at all, so `load_pdfs.py` will silently produce zero chunks for that file. If a document you expect to see answers from never shows up, check whether you can select/copy its text in a normal PDF viewer first; if you can't, it needs OCR (outside this project's scope) before this pipeline can use it.
- **Chunks too large or too small.** Same tradeoff as the RAG App project: too large and retrieval gets blurry, too small and a chunk loses the surrounding context the model needs to answer well. If answers feel off, try a different `TARGET_CHUNK_SIZE` and re-run `build_index.py`.
- **Forgetting to rebuild the index after changing `pdfs/`.** `build_index.py` only runs when you run it — add, remove, or edit a PDF, and `retrieve()` won't reflect the change until you re-run `uv run python build_index.py`.
- **Trusting a citation without checking it.** The prompt *asks* the model to cite only what's actually in the retrieved context, and in practice it does this reliably — but nothing here mathematically guarantees it. Spot-check a few citations against the actual PDF pages, especially before relying on this for anything that matters.
- **Rate limits on the free LLM tier.** Extraction, chunking, embedding, and retrieval are all local and unlimited; only `ask()`'s LLM call counts against your provider's free-tier quota. A 429 error there is the provider telling you to slow down, not a bug — see the [AI Agent project](/docs/projects/ai-agent) for the same pattern and a retry approach you can copy.

## What you just built

A multi-document RAG pipeline with citations: page-aware PDF extraction and chunking, local embedding, in-memory similarity search across an arbitrary number of documents, and a final generation step that's required to point back at exactly where each fact came from — the same shape of system behind real "chat with your documents" products, minus the vector database and paid API standing in for a free one and a flat NumPy array.

## Where to go from here

- Once your PDF folder outgrows what comfortably fits in memory (tens of thousands of chunks), look at a real vector database like [ChromaDB](https://www.trychroma.com/) — same nearest-neighbor search as `retrieve()` above, indexed for speed at a much larger scale, with metadata filtering (e.g. "only search PDFs from 2024") this flat-file version doesn't have.
- Add a **source filter**: let a question restrict retrieval to just one PDF (`retrieve(question, source="warranty.pdf")`), useful once your folder holds documents about very different topics that shouldn't be blended together.
- Try **OCR** with a library like `pytesseract` for scanned PDFs, so image-only documents can join the pipeline instead of silently contributing zero chunks.
- Extend citations to include a **snippet**, not just a page number — return the exact sentence the fact came from alongside `(source, page N)`, so you can verify an answer without opening the PDF yourself.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓

<ProjectProgressCheckbox projectId="2027-chat-with-pdfs" />
