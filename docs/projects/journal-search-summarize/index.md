---
id: journal-search-summarize
title: "Search and Summarize Your Own Journal"
sidebar_label: "Journal Search & Summarize"
slug: /projects/journal-search-summarize
description: "Graduate from the in-browser playground to real Python: index a folder of your own dated journal entries with local embeddings, search them semantically — 'when did I last mention planning a trip?' — and summarize a date range with a free-tier LLM that cites the dates behind every claim."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Search and Summarize Your Own Journal

<ProjectPublishedDate projectId="journal-search-summarize" />

<ProjectGreeting />

A journal is the least structured kind of personal writing there is: dated files, no fixed categories, recurring themes scattered across weeks. Two obvious ways to search it both fail. `grep` only matches exact words — it can't find "when did I last mention planning a trip?" in a journal that says "booked the riad" without the word "trip" in that entry. Reading everything works, but stops working the moment the journal grows past a few weeks. This project builds the third way: a tool that turns each dated entry into a vector, searches them by *meaning* instead of wording, and summarizes a date range with a free-tier LLM. It's the same retrieval-and-generation pattern as the [RAG project](/docs/projects/rag-notes), pointed at the one corpus you'll never run out of questions for — your own life.

That's the promise, and it deserves an honest caveat up front. An LLM summary is a *compression* — it can flatten nuance, overgeneralize, or quietly drop the one detail that mattered to you. So the tool's summarize command enforces the same "no invented facts" discipline as this course's changelog work: it makes the model write one bullet per event with the date it came from, in `[YYYY-MM-DD]` form, and then the script extracts those citations and prints an **audit trail** mapping every cited date back to its source file. Every sentence of the summary can be checked against the entry it claims to describe. You're building a tool you can trust because you can verify it, not because you're asked to take its word for it.

This assumes Python 101 and basic comfort with files and functions — nothing from Data Analysis is required, though it helps if `numpy` arrays already feel familiar. It's optional and ungraded; see [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Build a small journal corpus: dated Markdown files in `data/journal/`, and a `load_entries()` function that reads them all with the date pulled from each filename.
2. Embed every entry locally — no API key, no cost — with `sentence-transformers`, and save the vectors to an index.
3. Write a semantic search command that finds the entries most relevant to a question using nothing but NumPy.
4. Write a summarize command that hands a date range's entries to a free-tier LLM and asks for a *dated* summary — one bullet per event, each starting with the date it came from.
5. Print an audit trail of the dates the summary actually cited, and run the whole tool against the bundled sample queries.

## Where to run this

**Locally with `uv`** is the path this lesson's steps follow, and the recommended one — it's real Python running on your own machine, reading real files from a real folder on disk, the same "graduate to real Python" move as every other project in this section. The Setup section below walks through installing it.

**GitHub Codespaces** is a zero-setup alternative if you'd rather not install anything locally yet: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed, per the repo's `.devcontainer/devcontainer.json`) and run the exact same `uv` commands from a terminal in your browser tab — the bundled sample journal in `examples/journal-search-summarize/data/journal/` is already sitting there for you.

**Google Colab, Kaggle Notebooks, or Binder** also work, since this project — unlike the fine-tuning one — needs no GPU. A ready-to-run notebook with the sample journal already embedded in it is included in the repo, so you don't have to copy-paste cells by hand:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/journal-search-summarize/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/journal-search-summarize/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fjournal-search-summarize%2Fnotebook.ipynb)

Click a badge, run the cells top to bottom, and paste in a free-tier LLM API key when prompted. Be honest with yourself about the tradeoff, though: this is a lower-fidelity way to experience the project than a real local `uv` project — no separate files, no real project structure, just cells in a notebook. Treat it as a quick way to experiment, not the primary path.

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
uv init journal-search-summarize
cd journal-search-summarize
uv add sentence-transformers numpy python-dotenv openai
```

`sentence-transformers` is the library that turns text into vectors locally, on your own CPU — no API call, no key. `numpy` does the actual math for comparing vectors. `python-dotenv` lets you keep your LLM API key in a local `.env` file. `openai` is the client library for the generation step — it works for every provider in the table below, since they all expose an OpenAI-compatible endpoint.

### Get a free LLM API key

Generation (Step 4's summarize command) needs a free-tier LLM API — retrieval itself (embedding and searching your journal) is fully local and needs no key at all, but it's simplest to get this set up now, before you start building, rather than pausing partway through.

**Pick whichever provider you like** — none of them require a credit card at the time of writing, and this course doesn't favor one over another. The fuller example in the course repo ([`examples/journal-search-summarize/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/journal-search-summarize)) supports all six out of the box, selected with one setting.

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

An API key is a secret, exactly like a password — anyone with it can use your account's quota. Treating it as an environment variable rather than a hardcoded string is the standard practice for exactly this reason. `python-dotenv` reads this file into `os.environ` automatically the first time your script runs (see `load_dotenv()` in Step 4).

## Step 1: Build your journal corpus

Everything the tool does starts from one assumption: a folder of dated Markdown files, one per day. Create `data/journal/` and drop in a few of your own entries — or, to follow along with the code below exactly, write the same twelve sample entries that ship in the example folder (they cover about two and a half weeks: work on a data pipeline, a side-project finance tracker, a trip to Chefchaouen being planned with friends, and a family birthday). The name of each file carries the date:

```
data/journal/2026-07-06.md
data/journal/2026-07-07.md
data/journal/2026-07-08.md
...
```

The tool needs to read every entry and know which date each one belongs to. A single `load_entries()` function does both — glob the folder, pull the `YYYY-MM-DD` out of each filename with a regex, and read the text:

```python
# main.py (excerpt -- Step 1)
import json
import re
from pathlib import Path

import numpy as np

JOURNAL_DIR = Path("data/journal")
DATE_RE = re.compile(r"(\d{4}-\d{2}-\d{2})")


def load_entries() -> list[dict]:
    """Returns [{"date", "source", "text"}] for every data/journal/*.md file,
    sorted by date. The date comes from the YYYY-MM-DD filename -- files
    without one are skipped with a warning instead of crashing the run."""
    entries = []
    for path in sorted(JOURNAL_DIR.glob("*.md")):
        match = DATE_RE.search(path.name)
        if match is None:
            print(f"Skipping {path.name}: no YYYY-MM-DD date in the filename.")
            continue
        text = path.read_text(encoding="utf-8").strip()
        entries.append({"date": match.group(1), "source": path.name, "text": text})
    return entries
```

Three choices here are worth noticing, because they'll carry through the whole project:

- **The date lives in the filename, not in the file.** That keeps the tool simple and predictable: no frontmatter to parse, no format guessing. `sorted()` on the paths then gives you the entries in chronological order for free, since `YYYY-MM-DD` sorts correctly as a string.
- **Entries are stored whole, not chunked.** The [RAG project](/docs/projects/rag-notes) had to split long notes into small chunks because an embedding model can only see so much text at once. A journal entry is usually a paragraph or two — well under that limit — so one entry equals one chunk. This is a deliberate simplification, and it keeps the tool's unit of retrieval intuitive: search returns *days*, not fragments.
- **A file without a date is skipped with a warning, not a crash.** Real folders contain stray files (`TODO.md`, `notes.md`). One of them shouldn't take down the whole tool.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>You have a `data/journal/` folder with at least a few `YYYY-MM-DD.md` files (the twelve sample entries from the example folder are enough).</StepChecklistItem>
<StepChecklistItem>`load_entries()` returns one dict per file, each with a `date`, a `source` filename, and the entry's `text`.</StepChecklistItem>
<StepChecklistItem>A file named without a date in the folder gets skipped with a warning instead of crashing the call.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Why is it safe to compare dates as strings (`"2026-07-06" <= "2026-07-22"`) with this filename convention, when comparing numbers stored as strings is usually a bug? What would break if a filename used `2026-7-6` instead?
- The regex `DATE_RE.search(path.name)` looks for a date *anywhere* in the filename. What's a real filename where that would match the wrong thing — and is a full `fullmatch`-style check worth the extra strictness for a personal tool?

## Step 2: Embed the journal into an index

An **embedding** is a list of numbers — a vector — that represents a piece of text's *meaning*, not its exact wording. `all-MiniLM-L6-v2` maps each entry to a point in 384-dimensional space, trained so that entries with similar meaning end up close together while unrelated entries end up far apart. That's the same intuition as plotting numeric data on axes, just with 384 axes instead of 2.

The `index` command embeds every entry and saves the results, so searching later doesn't have to re-embed the whole journal:

```python
# main.py (excerpt -- Step 2)
from sentence_transformers import SentenceTransformer

INDEX_PATH = Path("data/index.npy")
CHUNKS_PATH = Path("data/chunks.json")
MODEL_NAME = "all-MiniLM-L6-v2"


def build_index() -> None:
    """Embeds every journal entry locally and saves the vectors + text, so
    `search` doesn't need to re-embed anything at query time. Re-run this any
    time you add or edit entries -- the saved index doesn't update itself."""
    entries = load_entries()
    if not entries:
        print("No journal entries found -- add some YYYY-MM-DD.md files to data/journal/ first.")
        return

    print(f"Embedding {len(entries)} entries with {MODEL_NAME}...")
    texts = [f"[{e['date']}] {e['text']}" for e in entries]
    embeddings = get_model().encode(texts, normalize_embeddings=True)

    INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)
    np.save(INDEX_PATH, embeddings)
    CHUNKS_PATH.write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Saved {embeddings.shape[0]} vectors ({embeddings.shape[1]}-dim) to {INDEX_PATH}")
    print(f"Saved entry text/metadata to {CHUNKS_PATH}")
```

This deliberately avoids a vector database — for a personal journal (hundreds or low thousands of entries, not millions), a plain NumPy array that fits comfortably in memory is simpler, has no extra service to install or run, and is fully transparent: `data/index.npy` is a matrix, `data/chunks.json` is the text it came from, nothing more. Both files are gitignored because they're generated artifacts — rebuild them any time the journal changes.

`normalize_embeddings=True` scales every vector to length 1 — worth doing now rather than at query time, since it's what makes Step 3's cosine similarity reduce to a single dot product. And notice the date is prefixed onto each entry before embedding: it becomes part of the vector, which lets a query like "what happened in the second week of July?" lean on actual dates in the text, not just their meanings.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python main.py index` completes without errors.</StepChecklistItem>
<StepChecklistItem>A `data/index.npy` file and a `data/chunks.json` file now exist in your project folder.</StepChecklistItem>
<StepChecklistItem>The printed shape's first number matches your entry count, and the second number is 384.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- The model truncates input past 256 word-pieces. What would happen to the *last* part of an entry if you dumped a 2,000-word "year in review" file in with a `YYYY-MM-DD` name — and would the date prefix survive the truncation?
- Why save the embeddings to a file at all, instead of just re-embedding the journal every time you ask a question?

## Step 3: Search it semantically

To find which entries are relevant to a question, embed the question with the *same* model, then rank every entry by how close its vector is to the question's vector. The standard measure is **cosine similarity** — the cosine of the angle between two vectors, which cares about *direction* (meaning) and ignores *magnitude* (roughly, text length):

$$
\text{cosine\_similarity}(a, b) = \frac{a \cdot b}{\|a\| \, \|b\|}
$$

Since every vector was already normalized to length 1 when it was saved ($\|a\| = \|b\| = 1$), the denominator is just 1, and cosine similarity collapses to a plain dot product:

```python
# main.py (excerpt -- Step 3)
def search(query: str, top_k: int = 5) -> list[dict]:
    """Returns the top_k journal entries most similar to `query`, each with its
    similarity score, ranked highest first. The index must already exist."""
    if not INDEX_PATH.exists() or not CHUNKS_PATH.exists():
        print("No index found -- run 'uv run python main.py index' first.")
        return []

    embeddings = np.load(INDEX_PATH)
    entries = json.loads(CHUNKS_PATH.read_text(encoding="utf-8"))

    # Every row of `embeddings` is already unit-length (Step 2), and so is
    # the query vector, so this dot product IS the cosine similarity.
    query_vector = get_model().encode([query], normalize_embeddings=True)[0]
    similarities = embeddings @ query_vector

    top_indices = np.argsort(similarities)[::-1][:top_k]
    return [{**entries[i], "score": float(similarities[i])} for i in top_indices]
```

`embeddings @ query_vector` is matrix-vector multiplication: every row of the matrix dotted with the query vector, all at once, in one NumPy call — the same operation from the course's linear algebra material, here doing the actual work of comparing one question against every entry in the journal.

Run it against the sample journal:

```bash
uv run python main.py search "when did I last mention planning a trip?"
```

The top results should be the entries where the Chefchaouen trip actually gets discussed — comparing riads, confirming dates, booking the riad — even though the query never uses the words "Chefchaouen" or "riad". That's the whole point of semantic over literal search: the question and the answer don't have to share vocabulary.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python main.py search "<a real question about your journal>"` prints `top_k` entries, each with a similarity score, a date, and a text snippet.</StepChecklistItem>
<StepChecklistItem>The top-ranked entry for an easy, obvious test question actually looks relevant when you read it.</StepChecklistItem>
<StepChecklistItem>Scores are between -1 and 1 (the valid range for cosine similarity) — if you see numbers far outside that, one of the vectors probably wasn't normalized.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Run the search with `--top-k 1` on the phrase "when did I last mention planning a trip?" — the top hit is the *first* planning discussion, not the most recent one. Semantic search ranks by similarity to the words, not by recency. What would you have to add to the tool to make it answer the word "last" honestly?
- `np.argsort(similarities)[::-1][:top_k]` sorts *all* entries before taking the top few. For a personal journal this is fine — but why might sorting the entire array become a problem if you had ten million entries instead of a few hundred?

## Step 4: Summarize a date range with a free LLM

Search answers "when did X happen?" by pointing you at specific days. The second command answers the opposite question — "what happened between these two dates?" — and it's where the LLM comes in. `summarize` gathers every entry whose date falls in the range, tags each with its date, and asks the model to write a *dated* summary: one bullet per distinct event, every bullet beginning with the date it came from.

```python
# main.py (excerpt -- Step 4)
SUMMARIZE_PROMPT = """Summarize this personal journal from {start} to {end}.

Below is the journal text for each day in that range, each tagged with its date
in brackets. Write a short summary of what happened during this period, one
bullet per distinct event or theme. Begin every bullet with the date it comes
from, in the same [YYYY-MM-DD] form. For example:

[2026-07-18] Dinner with the whole family for mom's birthday.

Use ONLY facts that appear in the journal text below. Do not invent events,
dates, or details, and do not add opinions. If the range contains no entries,
say so in one sentence.

Journal:
{context}

Summary:"""


def entries_in_range(start: str, end: str) -> list[dict]:
    """Every journal entry whose date falls within [start, end], inclusive.
    Lexicographic comparison is correct here because dates are YYYY-MM-DD."""
    return [e for e in load_entries() if start <= e["date"] <= end]


def summarize(start: str, end: str, provider: str | None = None) -> tuple[str, list[str]]:
    """Summarizes the entries between `start` and `end` with a free-tier LLM.

    Returns (summary_text, cited_dates): cited_dates is the sorted, deduplicated
    list of YYYY-MM-DD dates the model actually cited in its summary -- that's
    the audit trail that lets you check each sentence against its source entry.
    """
    entries = entries_in_range(start, end)
    if not entries:
        return f"No journal entries found between {start} and {end}.", []

    context = "\n\n".join(f"[{e['date']}]\n{e['text']}" for e in entries)
    prompt = SUMMARIZE_PROMPT.format(start=start, end=end, context=context)

    text = call_llm(prompt, provider=provider)
    cited_dates = sorted({d for d in CITED_DATE_RE.findall(text) if start <= d <= end})
    return text, cited_dates
```

Notice what `summarize` does *not* do: it doesn't embed anything. Retrieval for a range is just a date filter — `load_entries()` plus `start <= e["date"] <= end` — which is honest about what each technique is for. Embeddings earn their keep for *fuzzy* questions ("when did I last mention…"); a date range is a *precise* question, so it gets a precise answer. Blending the two, rather than forcing every query through one mechanism, is a genuinely realistic design decision.

The prompt is doing three jobs at once. **"Begin every bullet with the date it comes from"** creates the citation format the audit needs. **"Use ONLY facts that appear in the journal text below"** is the anti-hallucination line — the same "no invented facts" instruction this course's changelog project leans on. **"If the range contains no entries, say so"** stops the model from improvising a plausible-sounding week when there's nothing to summarize.

The generation step itself goes through `call_llm()`, which selects a provider from the same six-entry table used across this course (GitHub Models by default, Gemini, Groq, Mistral, Cerebras, or OpenRouter — all through the `openai` client pointed at each provider's OpenAI-compatible endpoint). Copy `.env.example` to `.env` from the example folder and fill in one key; `--provider groq` overrides the choice for a single run.

Run it:

```bash
uv run python main.py summarize 2026-07-13 2026-07-22
```

The script prints the model's dated summary, then its audit trail — every date the summary actually cited, mapped back to the file it came from:

```
Sources cited (audit trail -- each bullet's date, mapped back to its file):
  2026-07-14  data/journal/2026-07-14.md
  2026-07-15  data/journal/2026-07-15.md
  2026-07-16  data/journal/2026-07-16.md
  ...
```

This audit trail is the whole honesty mechanism. The moment you wonder "did the week really include that?", you open `data/journal/2026-07-16.md` and check the bullet against the source. If a sentence cites a date that isn't in the range — or the summary claims something no entry supports — the trail makes it visible. You can *verify* the summary, which is different from trusting it.

:::tip[The extraction is deliberately strict]
`CITED_DATE_RE.findall(text)` only collects dates that actually appear inside the summary text in `[YYYY-MM-DD]` form, and only ones inside the requested range. If the model wrote a nice paragraph without following the citation format, the audit trail comes back empty — and that visible failure tells you the model didn't follow instructions, which is exactly the kind of thing you want a tool to surface rather than hide.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python main.py summarize <start> <end>` (with a key in `.env`) prints a dated, bulleted summary, not a traceback.</StepChecklistItem>
<StepChecklistItem>Every bullet's date falls inside the requested range, and each bullet reflects facts actually present in that day's entry.</StepChecklistItem>
<StepChecklistItem>Running `summarize` on an empty range (e.g. two dates with no entries between them) prints a clear "no entries" message instead of inventing a summary.</StepChecklistItem>
<StepChecklistItem>Asking for `start` after `end`, or a malformed date, produces a clear error before any API call is made.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- The prompt tells the model to say when the range has no entries. What do you think happens if you delete that line and summarize an empty week — and what does that tell you about why an explicit "say no" instruction is worth including?
- Find a summary sentence that surprises you, open its cited file, and check it against the real text. Does the sentence stay faithful to the entry, or does it stretch it? What does your answer suggest about *where* in this pipeline mistakes show up — retrieval (wrong entry selected) or generation (right entry, loose paraphrase)?

## Step 5: Run it end-to-end with the bundled sample queries

Everything so far has been building toward one thing: pointing the finished tool at a real set of entries and seeing it actually answer questions. The companion example in [`examples/journal-search-summarize/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/journal-search-summarize) wires up all of Steps 1–4 into one runnable `main.py`, with a committed sample journal in `data/journal/` and a set of example queries in `data/sample_queries.json` — each with a note naming the entries that hold the ground truth, so you can check whether the tool actually found them.

If you've cloned this course's repo, everything is already on disk:

```bash
cd examples/journal-search-summarize
uv sync
uv run python main.py index
```

Then try each sample query and check its answer against the note:

```bash
uv run python main.py search "how often did I go running in the past two weeks?"
uv run python main.py search "what is the finance tracker project about?"
uv run python main.py search "when are my friends and I going to Chefchaouen?"
```

And, with a key in `.env` (copy from `.env.example`), summarize a window the sample queries don't cover:

```bash
uv run python main.py summarize 2026-07-06 2026-07-12
```

Once it works on the sample journal, point it at your own: replace `data/journal/` with your own `YYYY-MM-DD.md` files, re-run `uv run python main.py index`, and search for the things you'd actually want to remember. The tool doesn't care whose entries it's reading — that's the design goal. A folder of your own dated writing is the one corpus where the effort of embedding is repaid by every future "when did that happen?" question.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`main.py index` and every command in `data/sample_queries.json` run without errors against the sample journal.</StepChecklistItem>
<StepChecklistItem>Each search's top results match the ground-truth entries named in its query's `note`.</StepChecklistItem>
<StepChecklistItem>You've run the tool against at least one entry set that isn't the sample journal — your own entries, or a modified copy — and re-built the index.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- One sample query asks "when are my friends and I going to Chefchaouen?" and the top result names the date in the text. Another asks "when did I last mention planning a trip?" and the top result doesn't contain the word "trip" at all. Both are answered by the same mechanism — how does the second one *have* a right answer if the words don't overlap?
- The index is built once and searched many times. What happens if you add a new entry and *don't* re-run `index`? Is "the index is stale" an obvious failure or a silent one — and what does that say about making the rebuild step explicit rather than automatic?

## ⚠️ Common pitfalls

- **Forgetting to rebuild the index after editing `data/journal/`.** `index` only runs when you run it — add an entry, and `search` won't find anything in it until you re-run `uv run python main.py index`. There's no file-watcher here; this is a manual step by design, so you always know exactly what's indexed.
- **Embedding the query with a different model than the one used to build the index.** `build_index` and `search` both use `MODEL_NAME = "all-MiniLM-L6-v2"` on purpose — vectors from two different embedding models aren't comparable to each other at all, even if both are "384-dimensional." Change the model and you must rebuild the index.
- **A `data/index.npy` that's stale after editing an entry's text.** The index stores vectors, not text — `data/chunks.json` holds the entry text search displays. If you edit an entry's text but only the chunk file updates (or vice versa), search can rank by an embedding of the old text while showing the new text. Rebuilding the index refreshes both together.
- **Rate limits on the free LLM tier.** Retrieval (Steps 2–3) is local and unlimited; only `summarize` counts against your provider's free-tier quota. A 429 error there is the provider telling you to slow down, not a bug — see the [AI Agent project](/docs/projects/ai-agent) for the same pattern and a retry approach you can copy.
- **Over-trusting the summary.** The audit trail makes the tool verifiable, but verification is still your job. A summary that "feels right" but drops a detail you cared about is the tool working as designed — compressions lose information. Read the cited entries for anything that matters.

## What you just built

A small but complete search-and-summarize tool for your own writing: dated entries in, embeddings and a flat NumPy index in the middle, and two honest answers on the other side — fuzzy questions answered by meaning-similarity, date ranges answered by a free-tier LLM whose every claim is tethered to a citable source entry. Nothing here was faked or simplified into a toy that doesn't generalize: swap in a bigger journal and a paid model, and the same three mechanisms — local embedding, in-memory similarity search, grounded generation — are still the whole pipeline.

## Where to go from here

- **Make search recency-aware.** As the Step 3 Socratic question noted, similarity isn't recency. Try blending a small time-decay factor into the score (`score * (1 - age_weight)`) so "last" in a query tends toward recent entries — a genuinely useful tweak for a journal, which is nothing but a timeline.
- **Chunk long entries.** If you start writing essays, not paragraphs, `load_entries`'s one-entry-one-vector simplification breaks down — reuse the [RAG project's](/docs/projects/rag-notes) chunking and you'll retrieve the right *passage* of a long day instead of the whole day at once.
- **Try a real vector store.** Once your journal outgrows what comfortably fits in memory, look at [ChromaDB](https://www.trychroma.com/) — it does the same nearest-neighbor search as `search()` above, indexed for speed at a much larger scale, with on-disk persistence and filtering the flat-file version doesn't have.
- **Summarize over the whole journal.** The prompt's range mechanic extends naturally: summarize a month, a quarter, or the whole year by widening the dates — and the audit trail scales with it, so a year-end "this year in review" stays checkable entry by entry.
- **Analyze the recurring themes.** A journal's embedding vectors can do more than retrieve: cluster them and see which weeks belong to the same themes, a natural next step after this course's [ML classifier project](/docs/projects/ml-classifier).

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Your journal is the one dataset that's genuinely, irreplaceably yours — and now you have a tool that can find things in it. Welcome to writing Python outside the browser. 🎓

<ProjectProgressCheckbox projectId="journal-search-summarize" />
