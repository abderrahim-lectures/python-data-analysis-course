---
id: multihop-wikipedia-qa
title: "Build a Multi-Hop Question-Answering Tool Over a Small Wikipedia Sample"
sidebar_label: "Build a Multi-Hop QA Tool"
slug: /projects/multihop-wikipedia-qa
description: "Go beyond single-pass RAG: build a two-round retrieval pipeline over a bundled Wikipedia-style sample that answers questions whose facts live in two different articles — and audit every evidence chunk it used."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Build a Multi-Hop Question-Answering Tool

<ProjectPublishedDate projectId="multihop-wikipedia-qa" />

<ProjectGreeting />

The [RAG App project](/docs/projects/rag-notes) retrieves the most relevant chunks of your notes once, and asks a language model to answer from them. That works beautifully when the answer lives in a single document. But a whole class of questions — the kind real search engines and research assistants are judged on — need facts from **two** documents combined: "Who founded the company that built the thing in that city?" requires knowing *who* from one article and *which company did the thing* from another. A single retrieval pass usually finds one of the two, the model is left to guess the rest, and you get a plausible-sounding but **wrong** answer.

This project builds a small, practical version of the fix: a **two-round** retrieval pipeline over a bundled sample of a handful of Wikipedia-style articles. Round one retrieves the top chunks for the question; the model decides whether that evidence is enough; and if it isn't, the model writes a follow-up search query, the tool retrieves a second round with it, and only then answers from the combined evidence. Both paths print the evidence chunks they used, so you can always audit exactly why one pipeline got a question wrong and the other got it right.

Let's be honest about what this is and isn't. *Multi-hop reasoning* — where the model itself reasons across documents — is genuinely hard research territory, and whole systems exist just to improve at it. This project is deliberately minimal: the "multi-hop" is **iterative retrieval** (retrieve → check → retrieve again), one extra round, over a tiny corpus small enough that a single person can read every chunk. That's a real technique used in production RAG, but it's a starting point, not the state of the art. The value here is seeing the *mechanism* with your own eyes, and being able to audit it line by line.

This assumes Python 101; it also helps a lot to have already built the RAG App project, since this one reuses its whole architecture — chunking, local embeddings, cosine-similarity retrieval — and only adds the second round and the evidence audit on top. It's optional and ungraded. See [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Set up a small `uv` project with local embeddings (`sentence-transformers`, `numpy`) and a free-tier LLM client (`openai`, `python-dotenv`).
2. Read the bundled sample: six short Wikipedia-style articles (biographies, companies, cities, an event), crafted so a few questions genuinely need facts from two of them.
3. Split the articles into chunks and embed them locally into an index — the same local, no-API-key step as the RAG App project.
4. Write a retrieval function that finds the chunks most relevant to a question using nothing but NumPy.
5. Build the **single-hop** pipeline: retrieve once, ask the LLM to answer using only that context.
6. Build the **multi-hop** pipeline: retrieve, ask the model whether the evidence is enough, and if not, retrieve a second round guided by the model's own follow-up query, then answer from the merged evidence.
7. Run both pipelines side by side on the bundled test questions, and audit the evidence chunks each one used.

## Where to run this

**Locally with `uv`** is the path this lesson's steps follow, and the recommended one — it's real Python running on your own machine, the same "graduate to real Python" move as every other project in this section. The Setup section below walks through installing it.

**GitHub Codespaces** is a zero-setup alternative if you'd rather not install anything locally yet: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed, per the repo's `.devcontainer/devcontainer.json`) and run the exact same `uv` commands from a terminal in your browser tab.

**Google Colab, Kaggle Notebooks, or Binder** also work, since this project needs no GPU — a real, runnable notebook version of this project's pipeline (the same corpus, chunking, local embedding, and two-pipeline comparison as the steps below) lives at [`examples/multihop-wikipedia-qa/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/multihop-wikipedia-qa/notebook.ipynb). Click a badge to launch it directly, no local install at all:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/multihop-wikipedia-qa/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/multihop-wikipedia-qa/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fmultihop-wikipedia-qa%2Fnotebook.ipynb)

Be honest with yourself about the tradeoff, though: this is a lower-fidelity way to experience the project than a real local `uv` project — no separate files, no real project structure, just cells in a notebook. Treat it as a quick way to experiment, not the primary path.

> **opencode** *(optional)* — a free, open-source AI coding agent that runs in your terminal. If you'd rather have an agent write and run this project for you than type the code yourself, install it with `curl -fsSL https://opencode.ai/install | bash` (or `npm install -g opencode-ai`) and point it at this repo with the same API key from Setup below. It's optional — this project's whole point is building it yourself, so treat it as a bonus, not a shortcut.

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
uv init multihop-qa
cd multihop-qa
uv add sentence-transformers numpy python-dotenv openai
```

`sentence-transformers` turns text into vectors locally, on your own CPU — no API call, no key. `numpy` does the math for comparing vectors. `python-dotenv` keeps your LLM API key in a local `.env` file. `openai` is the client used to talk to whichever free-tier provider you pick — every provider in the table below exposes an OpenAI-compatible chat endpoint, so one client, pointed at a different `base_url`, is all this project needs.

### Get a free LLM API key

Retrieval — embedding the articles, searching the chunks — is fully local and needs no key at all. Only the *generation* step (asking the model to answer) needs a free-tier LLM API, and it's simplest to set that up now, before you start building, rather than pausing partway through.

**Pick whichever provider you like** — none of them require a credit card at the time of writing, and this course doesn't favor one over another.

| Provider | Where to get a key | Why you might pick it |
|---|---|---|
| **GitHub Models** *(suggested default)* | [github.com/settings/tokens](https://github.com/settings/tokens) — a personal access token with the `models: read` scope | No separate signup — you already have a GitHub account. More generous free-tier limits than Gemini's. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | The most commonly referenced option; also exposes an OpenAI-compatible endpoint, used below. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Fast inference, generous free tier, no card. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | One of the more generous permanent free quotas. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | High daily token volume, no card. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | One API, many free models — good for comparing providers. |

Whichever you pick, the process is the same:

1. Sign in and generate an API key on that provider's site.
2. **Never paste this key directly into code or commit it to a repository.** Create a `.env` file in your project folder instead (never commit this):

```bash
# .env
LLM_PROVIDER=github
GITHUB_TOKEN=your-key-here
```

An API key is a secret, exactly like a password — anyone with it can use your account's quota. Treating it as an environment variable rather than a hardcoded string is the standard practice for exactly this reason. `python-dotenv` (installed above) reads this file into `os.environ` automatically, the same pattern used throughout the [AI Agent project](/docs/projects/ai-agent) if you've done that one.

The fuller example in the course repo ([`examples/multihop-wikipedia-qa/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/multihop-wikipedia-qa)) supports all six providers out of the box, selected with one setting — copy its `.env.example` to `.env` and fill in the key for your provider.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv --version` prints a version number.</StepChecklistItem>
<StepChecklistItem>`multihop-qa/` exists with a `pyproject.toml`, and `sentence-transformers`, `numpy`, `python-dotenv`, and `openai` are installed.</StepChecklistItem>
<StepChecklistItem>You have a real API key from one provider, saved in a `.env` file in your project folder — not pasted into any script.</StepChecklistItem>
</StepChecklist>

## Step 1: The corpus — articles crafted for two-hop questions

The example comes with a small bundled corpus at `examples/multihop-wikipedia-qa/data/articles/`: six short, plain-text Wikipedia-style articles (fictional but realistic — biographies, companies, cities, an event), each a couple of kilobytes. They're not a random sample; they're *crafted* so that a few specific questions genuinely need facts from two articles at once.

Read a couple of them and you'll notice a deliberate design: the fact that bridges two articles is **split across them**. For example, the article about the battery company says the company was founded "by the winner of the 2009 European Energy Innovation Prize" — a clue, not a name. The name of that founder only appears in her own biography article. So "Who founded the company that powered TransLisboa's electric buses?" needs one fact from the transit/city article (which company did it), one from the company article (how it's described), and one from the biography (the founder's name). A single retrieval pass over the original question gets the first two and misses the biography — the answer isn't there, so the model either says so or guesses.

Copy the corpus into your project:

```bash
cp -r ../examples/multihop-wikipedia-qa/data/articles ./data
```

Then read the files in `data/articles/`. Before writing any code, write down, in one or two sentences, what fact each article holds that *no other article* holds — because those are exactly the facts single-hop retrieval will miss.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`data/articles/` contains the six bundled `.md` articles.</StepChecklistItem>
<StepChecklistItem>You can name at least one question that requires combining facts from two different articles.</StepChecklistItem>
<StepChecklistItem>For each article, you can point to one fact that appears in no other article.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- The company article says the firm was founded "by the winner of the 2009 European Energy Innovation Prize" without naming anyone. Why do you think the corpus was written that way, instead of just naming the founder in both articles? What would that change about whether the question needs two hops?
- If every article restated all of its "shared" facts, the questions would stop being two-hop. What's the real-world equivalent of this — think about how a single sentence in a real Wikipedia article rarely tells you everything about its subject.

## Step 2: Chunk and embed locally

You can't hand a whole article to an embedding model and expect a useful search result — the same two reasons as the RAG App project: embedding models truncate input past a few hundred tokens, and a big chunk's vector is a blurry average of every subtopic in it. So split each article into chunks the same way as the RAG App project: by paragraph, then re-merge tiny paragraphs up to a target size so you're not left with dozens of one-line fragments.

```python
# prepare.py
"""Splits every article in data/articles/ into a list of text chunks."""

from pathlib import Path

ARTICLES_DIR = Path("data/articles")
TARGET_CHUNK_SIZE = 600  # characters


def split_into_paragraphs(text: str) -> list[str]:
    """Splits on blank lines, dropping empty paragraphs."""
    paragraphs = [p.strip() for p in text.split("\n\n")]
    return [p for p in paragraphs if p]


def merge_short_paragraphs(paragraphs: list[str], target_size: int) -> list[str]:
    """Greedily merges consecutive short paragraphs up to target_size characters."""
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


def load_articles() -> list[dict]:
    """Returns a list of {"source": filename, "text": full text} per article."""
    articles = []
    for path in sorted(ARTICLES_DIR.glob("*.md")):
        articles.append({"source": path.name, "text": path.read_text(encoding="utf-8")})
    return articles


def load_chunks() -> list[dict]:
    """Returns a list of {"text": ..., "source": ...} dicts, one per chunk."""
    chunks = []
    for article in load_articles():
        paragraphs = split_into_paragraphs(article["text"])
        for chunk_text in merge_short_paragraphs(paragraphs, TARGET_CHUNK_SIZE):
            chunks.append({"text": chunk_text, "source": article["source"]})
    return chunks


if __name__ == "__main__":
    chunks = load_chunks()
    print(f"Loaded {len(chunks)} chunks from {ARTICLES_DIR}/")
    for chunk in chunks[:3]:
        preview = chunk["text"][:80].replace("\n", " ")
        print(f"  [{chunk['source']}] {preview}...")
```

```bash
uv run python prepare.py
```

Then embed those chunks and save the vectors, exactly as the RAG App project does — `all-MiniLM-L6-v2`, a small (~80MB) model that runs on your CPU in about a second per chunk, no key, no cost:

```python
# build_index.py
"""Embeds every chunk and saves the vectors + chunk text locally.

Re-run this any time you add or edit articles -- the saved index doesn't
update itself.
"""

import json

import numpy as np
from sentence_transformers import SentenceTransformer

from prepare import load_chunks

MODEL_NAME = "all-MiniLM-L6-v2"
INDEX_PATH = "index.npy"
CHUNKS_PATH = "chunks.json"


def main() -> None:
    chunks = load_chunks()
    if not chunks:
        print("No chunks found -- add some .md files to data/articles/ first.")
        return

    print(f"Embedding {len(chunks)} chunks with {MODEL_NAME}...")
    model = SentenceTransformer(MODEL_NAME)
    embeddings = model.encode(
        [chunk["text"] for chunk in chunks],
        normalize_embeddings=True,
    )

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

This deliberately avoids a vector database — a handful of articles is a few dozen chunks, and a plain NumPy array that fits in memory is simpler, has nothing extra to install, and is fully transparent: `index.npy` is a matrix, `chunks.json` is the text it came from, nothing more. `normalize_embeddings=True` scales every vector to length 1 — the thing that makes Step 3's cosine similarity reduce to a single dot product.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python prepare.py` runs without errors and prints a nonzero chunk count.</StepChecklistItem>
<StepChecklistItem>`uv run python build_index.py` completed without errors, and `index.npy` and `chunks.json` now exist in your project folder.</StepChecklistItem>
<StepChecklistItem>The printed shape's first number matches the chunk count, and the second number is 384.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- The corpus is small enough that you could search it by hand. Why build an index at all? What does this step buy you that scales to a corpus you can't read in an afternoon?
- Chunk order matters here: `chunks.json` and the rows of `index.npy` are aligned by position. What would go wrong if you rebuilt one without the other — say, if you edited an article and re-ran `build_index.py` without deleting the old `index.npy`? (Hint: it's why the example re-saves both files together.)

## Step 3: Retrieve relevant chunks

To find which chunks are relevant to a question, embed the question with the *same* model, then rank every chunk by how close its vector is to the question's vector — cosine similarity, which collapses to a plain dot product because every vector is already unit-length:

```python
# retrieve.py
"""Given a question, finds the article chunks most relevant to it."""

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
    cosine-similarity score, ranked highest first."""
    embeddings = np.load(INDEX_PATH)
    with open(CHUNKS_PATH, encoding="utf-8") as f:
        chunks = json.load(f)

    question_vector = get_model().encode([question], normalize_embeddings=True)[0]

    # Every row of `embeddings` is unit-length and so is question_vector, so
    # this dot product *is* the cosine similarity.
    similarities = embeddings @ question_vector

    top_indices = np.argsort(similarities)[::-1][:top_k]
    return [
        {**chunks[i], "score": float(similarities[i])}
        for i in top_indices
    ]


if __name__ == "__main__":
    results = retrieve("Who founded the company that powered TransLisboa's electric buses?")
    for r in results:
        print(f"{r['score']:.3f}  [{r['source']}]  {r['text'][:80]}...")
```

```bash
uv run python retrieve.py
```

Do this before writing any more code, and look at what comes back for the two-hop questions. Notice which article is *missing* from the top results — for "Who founded the company that powered TransLisboa's electric buses?" the top chunks are the transit article and the company article, not the biography. That missing chunk is the whole motivation for Step 5.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python retrieve.py` prints `top_k` results, each with a similarity score and a source filename.</StepChecklistItem>
<StepChecklistItem>For a genuinely two-hop question, the article holding the missing fact does **not** appear in the top chunks.</StepChecklistItem>
<StepChecklistItem>For a single-article question, the right article *does* appear at the top.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- `np.argsort(similarities)[::-1][:top_k]` sorts *all* similarities before taking the top few. Fine for a few dozen chunks — why would this become a problem on a corpus of ten million chunks, and what structure would you reach for instead?
- The two-hop question retrieves the company article, which contains a *clue* ("the winner of the 2009 European Energy Innovation Prize") but not the name. If you pasted just that chunk into the LLM, would you expect a good answer, a wrong guess, or an honest "I can't tell"? Try it in Step 4 and see which you actually get.

## Step 4: Single-hop — the baseline that fails two-hop questions

Now the baseline pipeline: retrieve the top chunks once, hand them to the LLM, ask it to answer *using only that context*. This is exactly the RAG App project's last step — and it's the pipeline this whole project exists to improve on. Write `ask.py` with a prompt template, and add the provider plumbing (the same OpenAI-compatible clients as the Agentic Code Reviewer project — pick whichever free-tier provider you set up in Setup; the bundled example wires all six in one `endpoints` dict, as below):

```python
# ask.py
"""Single-hop baseline: retrieve once, answer from only that context."""

import os

from dotenv import load_dotenv
from openai import OpenAI

from retrieve import retrieve

load_dotenv()

ANSWER_PROMPT = """Answer the question using ONLY the context below. If the
context doesn't contain the answer, say so plainly -- do not make something up.

Context:
{context}

Question: {question}

Answer:"""


def _build_client(provider: str) -> OpenAI:
    endpoints = {
        "github": ("https://models.github.ai/inference", "GITHUB_TOKEN"),
        "gemini": ("https://generativelanguage.googleapis.com/v1beta/openai/", "GOOGLE_API_KEY"),
        "groq": ("https://api.groq.com/openai/v1", "GROQ_API_KEY"),
        "mistral": ("https://api.mistral.ai/v1", "MISTRAL_API_KEY"),
        "cerebras": ("https://api.cerebras.ai/v1", "CEREBRAS_API_KEY"),
        "openrouter": ("https://openrouter.ai/api/v1", "OPENROUTER_API_KEY"),
    }
    base_url, env_var = endpoints[provider]
    return OpenAI(api_key=os.environ[env_var], base_url=base_url)


def format_context(chunks: list[dict]) -> str:
    return "\n\n".join(f"[{c['source']}] {c['text']}" for c in chunks)


def single_hop(question: str, provider: str | None = None, top_k: int = 3) -> tuple[str, list[dict]]:
    """Baseline: retrieve once, answer from that one retrieval pass."""
    provider = provider or os.environ.get("LLM_PROVIDER", "github")
    retrieved = retrieve(question, top_k=top_k)
    prompt = ANSWER_PROMPT.format(context=format_context(retrieved), question=question)
    response = _build_client(provider).chat.completions.create(
        model="gpt-4o-mini",  # confirm this still has a free tier before running
        messages=[{"role": "user", "content": prompt}],
    )
    answer = response.choices[0].message.content
    return answer, retrieved
```

> **If you're not using GitHub Models:** the client is OpenAI-compatible but `gpt-4o-mini` only exists on GitHub Models. If you picked another provider in Setup, swap `model` for one that provider serves (e.g. `gemini-3.5-flash` on Gemini, `llama-3.3-70b-versatile` on Groq, `mistral-small-latest` on Mistral). The bundled `main.py` example wires the right model per provider in its `PROVIDERS` dict.

Now run it on the two-hop question:

```bash
uv run python -c "from ask import single_hop; a, ev = single_hop('Who founded the company that powered TransLisboa\'s electric buses?'); print(a)"
```

Watch what happens. The retrieved context contains the clue but not the name, so the model either says "the context doesn't say who founded it" or — because the context is full of plausible names-adjacent facts — makes up a plausible-sounding but **wrong** answer. Either outcome is the point: the pipeline doesn't have the fact it needs, and no amount of prompt-wording fixes that, because the fact never got retrieved.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`single_hop()` runs against your free-tier provider and prints an answer, not a traceback.</StepChecklistItem>
<StepChecklistItem>On a genuinely two-hop question, the answer is wrong or explicitly says the information isn't in the context.</StepChecklistItem>
<StepChecklistItem>You can explain, in one sentence, why a *better* prompt could not fix this — the missing fact was never retrieved.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- The context for the two-hop question contains the clue "founded by the winner of the 2009 European Energy Innovation Prize". If the model *does* hallucinate a founder, where do you think the hallucinated name comes from — the context, the model's prior knowledge, or neither? What does that tell you about how confidently you should trust a single-hop answer on a question you haven't verified?
- Run `single_hop()` on the same question three times. Is the answer stable across runs? Would a user be able to tell the wrong answers apart from a correct one without checking the evidence?

## Step 5: Multi-hop — a second round guided by a follow-up query

The fix this project teaches: don't accept "not enough evidence" as the end. Add a second retrieval round, guided by the model itself. Write `ask_multihop.py` with a new prompt whose job is *not* to answer the question but to **decide whether the retrieved evidence is enough to answer it** — and, if not, to produce a follow-up search query that would find the missing fact:

```python
# ask_multihop.py
"""Two-round (multi-hop) retrieval: retrieve, check sufficiency, and if needed
retrieve again guided by the model's follow-up query."""

import os

from dotenv import load_dotenv
from openai import OpenAI

from ask import ANSWER_PROMPT, _build_client, format_context
from retrieve import retrieve

load_dotenv()

SUFFICIENCY_PROMPT = """You get ONE retrieval pass of evidence, which may not
be enough to answer the question -- the answer might need facts that live in a
document this retrieval didn't return.

Context:
{context}

Question: {question}

Decide whether the Context above contains enough information to answer the
Question. Reply with exactly one of these two forms:

If YES -- SUFFICIENT, followed by your answer on the next line(s):
    SUFFICIENT
    <answer using only the context>

If NO -- do NOT try to answer. Reply:
    INSUFFICIENT
    <one follow-up search query, single line, that would find the missing
    information -- name the specific entity or fact you need>

Never output both forms."""


def parse_sufficiency(text: str) -> tuple[str, str]:
    """Returns ("sufficient", answer) or ("insufficient", followup_query)."""
    lines = [line.strip() for line in text.strip().splitlines() if line.strip()]
    if lines and "INSUFFICIENT" in lines[0].upper():
        followup = lines[1] if len(lines) > 1 else ""
        return "insufficient", followup
    answer = "\n".join(lines[1:]) if lines and lines[0].upper().startswith("SUFFICIENT") else text
    return "sufficient", answer.strip()


def merge_dedupe(*chunk_lists: list[dict]) -> list[dict]:
    """Merges chunk lists, dropping chunks whose text was already seen."""
    seen: set[str] = set()
    merged: list[dict] = []
    for chunk_list in chunk_lists:
        for chunk in chunk_list:
            if chunk["text"] not in seen:
                seen.add(chunk["text"])
                merged.append(chunk)
    return merged


def complete(question: str, context: list[dict], client: OpenAI, model: str) -> str:
    """Asks the model to answer `question` using ONLY the given context."""
    prompt = ANSWER_PROMPT.format(context=format_context(context), question=question)
    return client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
    ).choices[0].message.content


def multi_hop(question: str, provider: str | None = None, top_k: int = 3) -> dict:
    """Two rounds: retrieve, ask whether the evidence is enough, and if not,
    retrieve a second round guided by the model's own follow-up query."""
    provider = provider or os.environ.get("LLM_PROVIDER", "github")
    client = _build_client(provider)
    model = "gpt-4o-mini"  # confirm this still has a free tier before running

    round1 = retrieve(question, top_k=top_k)
    verdict = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": SUFFICIENCY_PROMPT.format(
            context=format_context(round1), question=question)}],
    ).choices[0].message.content

    status, followup = parse_sufficiency(verdict)
    if status == "sufficient":
        return {"answer": followup, "evidence": round1, "followup": None, "rounds": [round1]}

    round2 = retrieve(followup, top_k=top_k)
    combined = merge_dedupe(round1, round2)
    final = complete(question, combined, client, model)
    return {"answer": final, "evidence": combined, "followup": followup, "rounds": [round1, round2]}
```

(Again, use a model ID your chosen provider actually serves, per the note above.)

Now run it on the same two-hop question:

```bash
uv run python -c "
from ask_multihop import multi_hop
r = multi_hop('Who founded the company that powered TransLisboa\'s electric buses?')
print('follow-up query:', r['followup'])
print()
print(r['answer'])
"
```

Two things happen that single-hop never did. First, the follow-up query — the model looked at the evidence, saw the clue "winner of the 2009 European Energy Innovation Prize" and no name, and wrote a search that would find the name. Second, that follow-up query, run through `retrieve()`, pulls the biography article that the original question never surfaced — the missing fact. The final answer is grounded in the *combined* evidence of both rounds.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`multi_hop()` prints a follow-up query for the two-hop question — evidence the model judged the first round insufficient.</StepChecklistItem>
<StepChecklistItem>The second round's retrieval includes the article holding the missing fact, which round one missed.</StepChecklistItem>
<StepChecklistItem>The final answer to the two-hop question is now correct, and you can point at the exact chunk that supplies the missing fact.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- The sufficiency prompt forbids the model from answering when evidence is insufficient — it must instead emit a follow-up query. Why is forcing this explicit *two-step* behavior (verdict first, answer later) more reliable than just asking "if you don't know, say so" in the answer prompt? What happens if a model that was told "just answer" sees a plausible-looking clue and runs with it?
- The follow-up query is generated by the same model that just failed to answer. Why might a model that couldn't answer the *question* still be good at writing a *search query*? (Hint: what's easier — solving a problem, or saying what's missing?)
- What could go wrong if the follow-up query is bad? Can you sketch the failure mode where round two retrieves the same chunks as round one?

## Step 6: Run both side by side and audit the evidence

A comparison you can't audit is just a claim. The final piece is printing both pipelines' answers **side by side, with every evidence chunk each one used** — the source filename, the similarity score, and the snippet — so a wrong answer has an explanation attached to it. Write `main.py` that:

1. Builds the index if it's missing (or re-embeds on request).
2. For a question, runs `single_hop()` and `multi_hop()`.
3. Prints both answers as aligned columns — a simple `diff -y`-style two-column printer that wraps each block to half the terminal width and joins them with a `│` separator — followed by each pipeline's evidence list.
4. Defaults to running the bundled test questions from `data/test_questions.json` (a few of which are genuinely two-hop), with each question's `expected` answer shown so you can check both pipelines against it and see a small scoreboard at the end.

The complete `main.py` — the two-column printer, the scoreboard, the `--query` interactive mode, and the `--rebuild`/`--provider`/`--top-k` flags — is the companion example in [`examples/multihop-wikipedia-qa/main.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/multihop-wikipedia-qa/main.py). Run it:

```bash
uv run python main.py
```

You'll see something like this shape for each question (answers and scores abbreviated here):

```
Question: Who founded the company that powered TransLisboa's electric buses?
 SINGLE-HOP                                   │ MULTI-HOP
──────────────────────────────────────────────│──────────────────────────────
 SINGLE-HOP                                   │ MULTI-HOP
 Answer: The context doesn't name the founder │ Answer: Elena Marchetti
                                              │ Round 2 (guided by follow-up
 Evidence used:                               │   query): Who won the 2009
   1. [lisbon.md] score 0.701: The city's ... │   European Energy Innovation
   2. [volta-dynamics.md] score 0.554: ...    │   Prize?
   3. [volta-dynamics.md] score 0.455: ...    │ Evidence used:
                                              │   1. [lisbon.md] score 0.701 ...
                                              │   2. [volta-dynamics.md] ...
                                              │   3. [elena-marchetti.md] ...
```

The right column's third evidence chunk is the whole story: single-hop never saw the biography, multi-hop retrieved it in round two, and the answer changed accordingly. Audit the multi-hop questions yourself — read each evidence chunk and confirm the answer only makes sense given the *combination*.

```bash
uv run python main.py --question "In which city was the company that launched AquaPro founded?"
uv run python main.py --query     # interactive mode
```

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python main.py` prints both answers side by side for every bundled test question, each with its evidence chunks.</StepChecklistItem>
<StepChecklistItem>The multi-hop pipeline gets at least the two clearly two-hop questions right, and its evidence for each includes the second-round article.</StepChecklistItem>
<StepChecklistItem>You can explain, from the printed evidence alone, why single-hop's answer on those questions is wrong.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- On such a tiny corpus, single-hop will sometimes *accidentally* retrieve the right chunk for a two-hop question and get it right by luck. How would you detect that happening — what would the evidence columns look like compared to a genuinely multi-hop answer? Does "right answer, wrong evidence" still count as correct?
- The scoreboard at the end of the test-question run counts how many answers match the `expected` value. What does that scoreboard *not* measure? Can you imagine a plausible wrong answer that still contains the expected string?

## ⚠️ Common pitfalls

- **A small corpus means single-hop sometimes gets lucky.** With a few dozen chunks, the missing fact will occasionally sneak into the top-K anyway, and single-hop will answer a two-hop question correctly. That's a property of small corpora, not a bug — it's exactly why the tool prints evidence and a scoreboard: judge the *trend*, not any single question, and always check whether the evidence actually supports the answer.
- **Forgetting to rebuild the index after editing `data/articles/`.** `build_index.py` only runs when you run it. Edit an article and `retrieve()` won't see the change until you re-run it. The example's `main.py` checks for a missing index and rebuilds on `--rebuild`, but it never detects a stale one — that's a manual step by design.
- **A stale index out of sync with `chunks.json`.** The rows of `index.npy` and the entries of `chunks.json` are aligned by position. Rebuilding one without the other (or editing an article between the two writes) silently mislabels every chunk. The example saves both together in one function for exactly this reason.
- **Embedding the follow-up query with a different model than the index.** Every retrieval path must use the same `MODEL_NAME`. Vectors from two different embedding models aren't comparable at all, even if both are "384-dimensional."
- **The follow-up query can be bad, and that's a real limitation.** If round two retrieves the same chunks as round one, multi-hop silently degrades into single-hop. The sufficiency prompt nudges the model to name the specific missing entity, but nothing guarantees it. Watch the follow-up query in the output — if it's unhelpful, that's the honest limit of this minimal version, not a bug to paper over.
- **Rate limits on the free LLM tier.** Retrieval is local and unlimited; each `single_hop`/`multi_hop` call counts against your provider's quota, and multi-hop uses up to *two* calls per question. A 429 error is the provider telling you to slow down, not a bug — the [AI Agent project](/docs/projects/ai-agent) has a retry approach you can copy for the same pattern.

## What you just built

A two-round retrieval pipeline that answers a class of questions single-pass RAG can't: questions whose answer only exists once facts from two documents are combined. Same local embedding and NumPy search as the RAG App project, plus one new mechanism — retrieve, ask the model whether the evidence is enough, and if not retrieve again guided by the model's own follow-up query — and a habit the RAG App project didn't force: printing the evidence *beside* every answer so a wrong answer comes with an explanation attached. Nothing here was faked into a toy that doesn't generalize: iterative retrieval is a real technique in production RAG systems, and the "show your evidence" discipline is exactly what real answer-verification systems do. Swap the bundled corpus for a real folder of documents and the same two-round loop is the whole pipeline.

## Where to go from here

- **Try a larger, real corpus.** Point the same two-round loop at a real folder of documents (the course repo's own `docs/` is a good candidate). The multi-hop questions become genuinely hard once single-hop can't accidentally stumble onto the answer.
- **Add re-ranking.** Retrieve a larger top-k in each round with the fast embedding search, then re-score just those candidates with a slower cross-encoder before sending them to the LLM — a common two-stage pattern that sharpens which chunk counts as "the missing fact."
- **Cap or chain more rounds.** Real iterative-retrieval systems loop until the model says "sufficient" or a budget runs out, instead of a fixed two rounds. Add a `max_rounds` parameter and a guard so the loop can't spin forever — then watch what happens when a question needs *three* documents.
- **Score the whole thing properly.** Instead of the eyeball scoreboard, run the bundled questions against a hardcoded expected answer and report precision — a first step toward the kind of evaluation harness real RAG systems are judged with.

## Related projects

- [Build a RAG App Over Your Own Notes](/docs/projects/rag-notes) — the single-hop pipeline this project extends; build it first if you haven't.
- [Chat with Your PDFs](/docs/projects/chat-with-pdfs) — multi-document RAG over a folder of PDFs, with page-number citations instead of a second retrieval round.
- [Build an Agentic Code Reviewer](/docs/projects/agentic-code-reviewer) — the same free-tier `PROVIDERS` pattern, applied to a single-prompt code-review tool.
- [Build a RAG-Backed Docs Q&A Discord Bot](/docs/projects/docs-qa-bot) — wraps a RAG pipeline in a live chat interface you can actually query from Discord.
- [Build a Multi-Agent Research Assistant](/docs/projects/multi-agent-research) — a different answer to "one pass isn't enough": multiple LLM agents each owning a piece of a research question.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓

<ProjectProgressCheckbox projectId="multihop-wikipedia-qa" />
