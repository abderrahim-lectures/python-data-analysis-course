---
id: github-repo-rag
title: "Build a RAG App Over a GitHub Repo"
sidebar_label: "RAG Over a GitHub Repo"
slug: /projects/github-repo-rag
description: "Take the notes-based RAG pipeline one step further: clone a real GitHub repository, chunk its code and docs, embed them locally, and ask questions that come back with file-and-line citations."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🔍 Build a RAG App Over a GitHub Repo

<ProjectPublishedDate projectId="github-repo-rag" />

<ProjectGreeting />

In the [RAG App Over Your Own Notes](/docs/projects/rag-notes) project you built the full pipeline — chunk, embed locally, retrieve with cosine similarity, generate with a free-tier LLM — but the input was a folder of prose notes. This project graduates that pipeline to the messier case that makes it genuinely useful: **a real code repository**. You'll clone a GitHub repo, chunk both its code and its docs (recording which file *and which lines* each chunk came from), embed everything locally, and ask questions that come back with `file.py:line 12-34` citations you can open and verify. This assumes you've done the notes-based RAG project (or are comfortable with `sentence-transformers` + NumPy dot products); nothing from Data Analysis is required.

This is optional and ungraded. See [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Clone a real public GitHub repository (the course repo itself makes a good test subject — you'll be asking questions about the very course you're taking).
2. Split its files into chunks with a critical upgrade over the notes version: **line numbers are tracked per chunk**, and code is chunked at *function and class boundaries* rather than by character windows.
3. Embed every chunk locally, with no API key and no cost, using `sentence-transformers`.
4. Write a script that retrieves the chunks relevant to a question, hands them to a free-tier LLM, and asks it to answer *with citations* back to the exact file and lines it used.

## Where to run this

**Locally with `uv`** is the path this lesson's steps follow, and the recommended one — the whole point is running real Python against a real cloned repository on your own machine.

**GitHub Codespaces** is a zero-setup alternative: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed, per the repo's `.devcontainer/devcontainer.json`) and run the exact same `uv` commands from a terminal in your browser tab.

**Google Colab, Kaggle Notebooks, or Binder** also work, since this project — unlike the fine-tuning one — needs no GPU. A ready-to-run notebook that clones the course repo and runs the whole pipeline over it is included in the repo:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/github-repo-rag/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/github-repo-rag/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fgithub-repo-rag%2Fnotebook.ipynb)

Be honest with yourself about the tradeoff: the notebook runs the same code, but a real local `uv` project gives you the separate files, the repo clone, and the workflow you'd actually use on a codebase you care about. Treat the notebook as the quick experiment path, not the primary one.

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
uv init github-repo-rag
cd github-repo-rag
uv add sentence-transformers numpy python-dotenv openai
```

`sentence-transformers` turns text into vectors locally on your CPU. `numpy` does the similarity math. `python-dotenv` keeps your LLM API key in a local `.env` file. `openai` is the client library that talks to GitHub Models (and, with a different `base_url`, to the other OpenAI-compatible providers in the table below).

### Clone a test repository

You need a real repo to index. The course repo itself is a great test subject — small enough to embed in under a minute, and full of lessons and code you'll actually recognize:

```bash
git clone --depth 1 https://github.com/abderrahim-lectures/python-data-analysis-course
```

`--depth 1` grabs only the latest snapshot with no git history, which is all you need for indexing and keeps the download small. You can use any public repo instead — a library you use, a project you admire, anything with both `.py` (or `.js`/`.ts` — see the tip in Step 2) files and some Markdown docs.

### Get a free LLM API key

Generation (the last step) needs a free-tier LLM API — retrieval itself (embedding and searching) is fully local and needs no key at all. **Pick whichever provider you like** — none of them require a credit card at the time of writing, and this course doesn't favor one over another.

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

`python-dotenv` reads this into `os.environ` automatically. GitHub Models exposes an OpenAI-compatible API, so the plain `openai` client works for it without any extra package.

## Step 1: Walk the repo and chunk its files

Unlike a folder of notes, a repository has a structure: code files that need different chunking than prose, vendored/generated directories you never want indexed (like `.git` or `node_modules`), and line numbers that matter because your answers are going to cite them.

Write a walker that collects the files you actually want to index:

```python
# prepare_repo.py
"""Walks a cloned repo, collects indexable files, and splits them into
chunks that remember their source file and line range.

Run with: uv run python prepare_repo.py /path/to/repo
This prints a summary -- build_index.py (Step 2) imports load_chunks()
from this file.
"""

import sys
from pathlib import Path

SKIP_DIRS = {".git", "node_modules", "__pycache__", "venv", ".venv", "dist", "build"}
CODE_EXTS = {".py", ".js", ".ts", ".go", ".rs", ".java", ".md", ".mdx", ".txt"}

TARGET_CHUNK_SIZE = 500  # characters


def walk_repo(repo_root: Path) -> list[Path]:
    """Returns every indexable file under repo_root, skipping junk dirs."""
    files = []
    for path in sorted(repo_root.rglob("*")):
        if path.is_dir():
            continue
        if any(part in SKIP_DIRS for part in path.relative_to(repo_root).parts):
            continue
        if path.suffix.lower() in CODE_EXTS:
            files.append(path)
    return files


def chunk_code(text: str, source: str) -> list[dict]:
    """Splits a code file at top-level function/class boundaries, so each
    chunk is a self-contained unit -- not a random window that could start
    mid-function."""
    lines = text.splitlines()
    boundaries = [0]
    for i, line in enumerate(lines):
        if line.startswith(("def ", "class ")) and not line.startswith(("    ", "\t")):
            if i > 0:
                boundaries.append(i)
    boundaries.append(len(lines))

    chunks = []
    for start, end in zip(boundaries, boundaries[1:]):
        body = "\n".join(lines[start:end]).strip()
        if not body:
            continue
        chunks.append(
            {"source": source, "start": start + 1, "end": end, "text": body}
        )
    return chunks


def chunk_prose(text: str, source: str) -> list[dict]:
    """Splits a Markdown/text file into paragraph chunks merged up to
    TARGET_CHUNK_SIZE, tracking the line range of each chunk."""
    lines = text.splitlines()
    chunks = []
    current, start = [], None
    for i, line in enumerate(lines):
        if not line.strip():
            if current:
                chunks.append(
                    {
                        "source": source,
                        "start": start + 1,
                        "end": i,
                        "text": "\n".join(current).strip(),
                    }
                )
                current, start = [], None
            continue
        if start is None:
            start = i
        current.append(line)
        if sum(len(l) for l in current) >= TARGET_CHUNK_SIZE:
            chunks.append(
                {"source": source, "start": start + 1, "end": i + 1, "text": "\n".join(current).strip()}
            )
            current, start = [], None
    if current:
        chunks.append(
            {"source": source, "start": start + 1, "end": len(lines), "text": "\n".join(current).strip()}
        )
    return chunks


def load_chunks(repo_root: Path) -> list[dict]:
    chunks = []
    for path in walk_repo(repo_root):
        text = path.read_text(encoding="utf-8", errors="replace")
        source = str(path.relative_to(repo_root))
        if path.suffix.lower() in {".md", ".mdx", ".txt"}:
            chunks.extend(chunk_prose(text, source))
        else:
            chunks.extend(chunk_code(text, source))
    return chunks


if __name__ == "__main__":
    root = Path(sys.argv[1])
    chunks = load_chunks(root)
    print(f"Indexed {len(chunks)} chunks from {len(walk_repo(root))} files")
    for c in chunks[:3]:
        print(f"  {c['source']}:{c['start']}-{c['end']}  {c['text'][:60]}...")
```

```bash
uv run python prepare_repo.py python-data-analysis-course
```

Two decisions here matter more than they look:

- **Code chunks break at function/class boundaries, prose chunks at paragraph boundaries.** A character-window chunk can start halfway through a function definition — the vector for that chunk then represents a meaningless fragment, and the LLM gets asked to answer from it. Chunking *with the language* instead is the same idea as the notes project's "sharper, more specific vectors," applied to code.
- **Every chunk records `start` and `end` line numbers.** That metadata is what lets Step 4 demand citations and what lets *you* verify them — open the file, jump to the cited lines, and check the answer is really grounded there.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python prepare_repo.py python-data-analysis-course` prints a chunk count and per-chunk `file:start-end` previews.</StepChecklistItem>
<StepChecklistItem>No chunk's `text` preview starts or ends mid-function — code chunks look like complete definitions.</StepChecklistItem>
<StepChecklistItem>None of the previewed sources are inside `.git/` or other skipped directories.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- The course repo includes the full `build/` output from this website's static generation. Why would you *want* it skipped? What would a search result pulled from generated HTML look like to the LLM?
- `errors="replace"` silently substitutes unreadable bytes in a file rather than crashing the whole index build. When is "skip the file" a better choice than "replace the bytes"?

## Step 2: Embed every chunk locally

Identical to the notes project — same model, same idea, one new file:

```python
# build_index.py
"""Embeds every chunk from prepare_repo.py and saves the vectors + text
locally, so query.py (Step 4) doesn't re-embed anything at query time.

Run with: uv run python build_index.py /path/to/repo
Re-run this any time the repo changes -- the saved index doesn't update itself.
"""

import json
import sys
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer

from prepare_repo import load_chunks

MODEL_NAME = "all-MiniLM-L6-v2"
INDEX_PATH = "index.npy"
CHUNKS_PATH = "chunks.json"


def main() -> None:
    chunks = load_chunks(Path(sys.argv[1]))
    if not chunks:
        print("No chunks found -- did you pass a valid repo path?")
        return

    print(f"Embedding {len(chunks)} chunks with {MODEL_NAME}...")
    model = SentenceTransformer(MODEL_NAME)
    texts = [c["text"] for c in chunks]
    embeddings = model.encode(texts, normalize_embeddings=True)

    np.save(INDEX_PATH, embeddings)
    with open(CHUNKS_PATH, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)

    print(f"Saved {embeddings.shape[0]} vectors ({embeddings.shape[1]}-dim) to {INDEX_PATH}")
    print(f"Saved chunk text/metadata (including line ranges) to {CHUNKS_PATH}")


if __name__ == "__main__":
    main()
```

```bash
uv run python build_index.py python-data-analysis-course
```

A repository indexes to a few hundred or low-thousands of chunks for a typical small-to-mid repo — well within what a NumPy array in memory handles trivially, which is why this project again avoids a vector database. `normalize_embeddings=True` scales every vector to length 1 so Step 3's cosine similarity reduces to a dot product.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python build_index.py python-data-analysis-course` completes and prints a shape like `(N, 384)`.</StepChecklistItem>
<StepChecklistItem>Both `index.npy` and `chunks.json` now exist in your project folder.</StepChecklistItem>
<StepChecklistItem>The chunk count printed here matches the one from Step 1.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- The notes project embedded a few dozen chunks in about a second each. This repo has far more. Roughly how long do you expect indexing to take — and is that a one-time cost or a per-question cost?
- What happens to the saved index if the repo's `main` branch moves? Does that suggest when you'd want to re-run this step?

## Step 3: Retrieve relevant chunks

Retrieval is exactly the notes version, because nothing about the math cares whether a chunk came from prose or code:

```python
# retrieve.py
"""Given a question, finds the repo chunks most relevant to it.

Imported by query.py (Step 4) -- the __main__ block below lets you try it
standalone.
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
    embeddings = np.load(INDEX_PATH)
    with open(CHUNKS_PATH, encoding="utf-8") as f:
        chunks = json.load(f)

    question_vector = get_model().encode([question], normalize_embeddings=True)[0]
    similarities = embeddings @ question_vector

    top_indices = np.argsort(similarities)[::-1][:top_k]
    return [
        {**chunks[i], "score": float(similarities[i])}
        for i in top_indices
    ]


if __name__ == "__main__":
    for r in retrieve("How does the course build this website?"):
        print(f"{r['score']:.3f}  [{r['source']}:{r['start']}-{r['end']}]  {r['text'][:70]}...")
```

```bash
uv run python retrieve.py
```

Notice the preview line now prints the **line range** alongside the file — that's the citation data Step 4 will demand of the LLM, and it's been riding along in every chunk since Step 1.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python retrieve.py` prints `top_k` results, each with a score and a `file:start-end` citation.</StepChecklistItem>
<StepChecklistItem>The top result for a question about a specific lesson actually points at that lesson's file, not a random one.</StepChecklistItem>
<StepChecklistItem>Scores are between -1 and 1.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Code and prose get embedded by the same model, in the same vector space. A question phrased in plain English like "how do I add a new project page?" might retrieve a Markdown lesson file, while "what does `load_chunks` return?" retrieves code. What do the differing phrasing patterns suggest about how you'd ask questions of a code+docs index?
- Retrieval here scores each chunk independently. If an answer spans two separate files, will the top-3 chunk list necessarily contain both halves? What's a cheap way to make sure the model gets the *whole* story?

## Step 4: Generate an answer with citations

The pay-off step. Retrieval hands the model the actual chunks — including their file and line metadata — and the prompt explicitly demands citations:

```python
# query.py
"""Retrieves relevant chunks for a question, then asks a free-tier LLM to
answer using only that context, citing the exact file and lines it used.

Run with: uv run python query.py "your question here"
"""

import os
import sys

from dotenv import load_dotenv
from openai import OpenAI

from retrieve import retrieve

load_dotenv()

PROMPT_TEMPLATE = """Answer the question using ONLY the context below. The
context is drawn from a real code repository; each block is tagged with the
file and line range it came from. Support every factual claim you make with a
citation in the form [path.py:start-end]. If the context doesn't contain the
answer, say so -- do not make something up, and do not cite anything not in
the context.

Context:
{context}

Question: {question}

Answer:"""


def build_prompt(question: str, chunks: list[dict]) -> str:
    context = "\n\n".join(
        f"[{c['source']}:{c['start']}-{c['end']}]\n{c['text']}" for c in chunks
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
    question = " ".join(sys.argv[1:]) or "How does the course build this website?"
    print(ask(question))
```

```bash
uv run python query.py "How does the course build this website?"
```

Two things make this more than the notes version with fancier input:

- **The citations are *verifiable*.** The model didn't invent them — every `[path:start-end]` it can cite had to come out of the context you handed it. So you can, and should, open the cited file, jump to the cited lines, and check the answer against the source. When retrieval works, this is the strongest grounding RAG offers: not just "the model says so," but "here's the exact line, go read it."
- **The honesty rule matters more on code.** A model trained on millions of public repos may genuinely know an API or a function — but it may "know" a *different* version of it than the repo you cloned. Forcing answers to come only from the context is what makes the answer true *for that repo*, not generically.

:::tip[Using a different provider?]
Swap the `OpenAI(...)` block for your provider's own client, following the same pattern as the [AI Agent project](/docs/projects/ai-agent#step-1-write-your-first-agent) — e.g. Google's `google-genai` package for Gemini, or `groq`'s own client for Groq. Cerebras and OpenRouter are also OpenAI-compatible, so the `openai` package works for them too, just with a different `base_url`.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python query.py "a real question about the repo"` prints an answer with at least one `[path:start-end]` citation.</StepChecklistItem>
<StepChecklistItem>You opened one cited file, jumped to the cited lines, and confirmed the answer is genuinely grounded there.</StepChecklistItem>
<StepChecklistItem>Asking something the repo clearly doesn't cover makes the model say so — and it doesn't cite lines that don't exist.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- The prompt says "do not cite anything not in the context." What happens if you delete that instruction and a repo's chunk happens to be about a topic the model already knows well — does it stay disciplined about citing only what you gave it?
- A citation `[main.py:12-34]` might point at a function *definition*, or at a *call site*. Which is more useful for a question like "how is X called?" vs. "what does X do?"? Can you phrase questions to steer which one retrieval finds?

## ⚠️ Common pitfalls

- **Indexing junk directories.** The course repo's `build/` folder is generated HTML — indexing it pollutes retrieval with pages the model can't use and that aren't "source." If you point the tool at a repo that doesn't have the `SKIP_DIRS` set tuned for it, add the noisy directories before you re-run `build_index.py`.
- **Forgetting to rebuild the index after the repo changes.** `git pull`, a new commit, a new branch — none of it touches `index.npy` until you re-run `uv run python build_index.py`. The index is a snapshot, not a live view.
- **Chunking code with a prose-only splitter.** If you reuse the notes project's paragraph splitter on `.py` files, you get the mid-function fragments Step 1 warned about. The `def `/`class ` boundary splitter exists for exactly this reason — don't skip it.
- **Trusting citations without checking them.** Citations are only as trustworthy as retrieval — if the wrong chunk was retrieved, the model will confidently cite *it*. Always spot-check at least one citation per answer by opening the file at the cited lines.
- **Rate limits on the free LLM tier.** Retrieval (Steps 1-3) is local and unlimited; only Step 4's `ask()` call counts against your free-tier quota. A 429 there is the provider telling you to slow down, not a bug — see the [AI Agent project](/docs/projects/ai-agent#handling-rate-limits) for a retry pattern you can copy.

## What you just built

A real RAG tool over a real code repository: language-aware chunking with line tracking, local embedding, in-memory similarity search, and LLM generation whose answers cite the exact file and lines they're grounded in. The same architecture powers "chat with your codebase" tools across the industry — the differences here are scale (a NumPy array instead of a vector database), scope (one repo instead of a monorepo), and the free tier instead of a paid model. Nothing is a toy: point the same scripts at any public repo and they just work.

## Where to go from here

- Point it at a bigger, real library you use — say, `flask` or `pydantic` — and ask questions about *its* source. Watch what changes about the retrieval: more chunks, more files, and the first time retrieval returns the wrong chunk for a genuinely hard question.
- Add **re-ranking**: retrieve a larger top-k (say, 10) with the fast embedding search, then use a cross-encoder model to re-score just those 10 before sending the final 3-4 to the LLM — a standard two-stage pattern in production RAG.
- Handle more file types: PDFs of design docs (`pypdf`), or structured configs. The chunkers just need to produce `{source, start, end, text}` — the embedder and retriever don't care where a chunk came from.
- Investigate a real vector database like [ChromaDB](https://www.trychroma.com/) when a repo outgrows in-memory search — it does the same nearest-neighbor search with on-disk persistence and filtering.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

You now have a genuinely useful developer tool. 🎓

<ProjectProgressCheckbox projectId="github-repo-rag" />
