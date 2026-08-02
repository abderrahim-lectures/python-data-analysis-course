---
id: bookmarks-semantic-search
title: "Build Semantic Search Over Your Browser Bookmarks"
sidebar_label: "Semantic Bookmark Search"
slug: /projects/bookmarks-semantic-search
description: "Turn your browser bookmarks export into a searchable library: parse the HTML export, embed every bookmark locally, and find the page you saved months ago by describing what you remember — not by guessing the title."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🔖 Build Semantic Search Over Your Browser Bookmarks

<ProjectPublishedDate projectId="bookmarks-semantic-search" />

<ProjectGreeting />

Everyone's bookmarks bar is a graveyard: hundreds of saved pages, and the moment you actually need one you can't find it, because browser search only matches *words in the title*. The page you saved as "Why databases are like cars" won't come up when you search "how does indexing speed up queries" — even though that's exactly what it was about. This project fixes that with the same embedding machinery as the [RAG projects](/docs/projects/rag-notes): parse your browser's bookmarks export, embed every bookmark's title and folder locally, and then search by *meaning* — describe what you remember, and the right bookmark surfaces. This assumes Python 101 and comfort with the embedding + cosine-similarity idea from the notes RAG project (or the ability to pick it up quickly); nothing from Data Analysis is required.

This is optional and ungraded. See [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Export your browser bookmarks and parse the standard HTML format Chrome, Firefox, and Edge all produce.
2. Understand why this is a different shape than the notes RAG project: a large collection of *tiny* records (title + URL + folder) rather than a few large documents — so the search challenge shifts from chunking to *indexing records*.
3. Embed every bookmark locally with `sentence-transformers`, no API key and no cost.
4. Write a search CLI that ranks bookmarks against a natural-language query using cosine similarity, showing the folder path, title, and URL for each hit — and compare that against what plain keyword search would have found.

## Where to run this

**Locally with `uv`** is the path this lesson's steps follow, and the recommended one — it's real Python on your own machine, and it's the only way to search your *actual* bookmarks export.

**GitHub Codespaces** is a zero-setup alternative: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed, per the repo's `.devcontainer/devcontainer.json`) and run the exact same `uv` commands from a terminal in your browser tab — using the bundled sample bookmarks, since your own export lives on your own machine.

**Google Colab, Kaggle Notebooks, or Binder** also work, since this project needs no GPU. A ready-to-run notebook with a sample bookmarks export embedded in it is included in the repo:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/bookmarks-semantic-search/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/bookmarks-semantic-search/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fbookmarks-semantic-search%2Fnotebook.ipynb)

Be honest with yourself about the tradeoff: the notebook is a great way to try the pipeline, but it searches a sample set, not your own bookmarks. The real payoff — finding *your* lost pages — requires the local `uv` path with your own export.

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
uv init bookmarks-semantic-search
cd bookmarks-semantic-search
uv add sentence-transformers numpy python-dotenv
```

`sentence-transformers` turns text into vectors locally on your CPU — no API call, no key. `numpy` does the similarity math. (`python-dotenv` is included for symmetry with the other projects and in case you later add a "summarize this folder's bookmarks" LLM step — this project itself needs **no API key at all**.)

### Get your bookmarks export

The whole pipeline runs on a plain HTML file that every major browser can produce:

- **Chrome / Edge:** `⋮` menu → Bookmarks → Bookmark manager → `⋮` → Export bookmarks.
- **Firefox:** Library → Bookmarks → Import and Backup → Export bookmarks to HTML.

This produces a file that looks roughly like this:

```html
<!DOCTYPE NETSCAPE-Bookmark-file-1>
<DL><p>
    <DT><H3>Bookmarks bar</H3>
    <DL><p>
        <DT><A HREF="https://github.com/">GitHub</A>
        <DT><A HREF="https://docs.python.org/3/">Python docs</A>
    </DL><p>
    <DT><H3>Course</H3>
    <DL><p>
        <DT><A HREF="https://abderrahim-lectures.github.io/python-data-analysis-course/">PYDA course</A>
    </DL><p>
</DL><p>
```

The structure is deliberately plain: `<H3>` tags are **folder names**, `<A>` tags are **bookmarks** with their URL in the `HREF` attribute and the title as the tag's text. The `<DL>` nesting records which folder each bookmark lives in. There's no JSON, no schema version to chase — which is exactly why this format has survived for two decades. Save your export as `bookmarks.html`.

## Step 1: Parse the export into records

The whole point of this project is that a bookmark is a *tiny* record, not a document. Each one is three fields: title, URL, and folder path. Parsing the HTML is a job for Python's standard library — `html.parser` can walk the nested structure and record the folder stack as it goes:

```python
# parse_bookmarks.py
"""Parses a Netscape-format bookmarks HTML export into a list of records.

Run with: uv run python parse_bookmarks.py bookmarks.html
This only prints a summary -- build_index.py (Step 2) imports load_bookmarks()
from this file.
"""

import sys
from html.parser import HTMLParser
from pathlib import Path


class BookmarkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.folder_stack: list[str] = []
        self.pending_folder: str | None = None
        self.records: list[dict] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        attrs = dict(attrs)
        if tag == "h3":
            # A folder header: "<DT><H3>Name</H3>" -- the name arrives in
            # handle_data, and the folder itself is the nested <DL> that
            # follows, so we hold the name until that <DL> starts.
            self.pending_folder = ""
        elif tag == "dl":
            if self.pending_folder is not None:
                name = " ".join(self.pending_folder.split())
                self.folder_stack.append(name)
                self.pending_folder = None
            else:
                self.folder_stack.append("")  # anonymous top-level <DL>
        elif tag == "a":
            # A bookmark's title is the text between <A> and </A>, so store
            # the URL now and grab the title on handle_data.
            self._pending = {"href": attrs.get("href", ""), "text": ""}

    def handle_endtag(self, tag: str) -> None:
        if tag == "dl" and self.folder_stack:
            self.folder_stack.pop()
        elif tag == "a" and hasattr(self, "_pending"):
            title = " ".join(self._pending["text"].split()).strip()
            record = {
                "title": title or self._pending["href"],
                "url": self._pending["href"],
                "folder": "/".join(name for name in self.folder_stack if name),
            }
            if record["url"]:
                self.records.append(record)
            del self._pending

    def handle_data(self, data: str) -> None:
        if self.pending_folder is not None:
            self.pending_folder += data
        elif hasattr(self, "_pending"):
            self._pending["text"] += data


def load_bookmarks(path: Path) -> list[dict]:
    parser = BookmarkParser()
    parser.feed(path.read_text(encoding="utf-8", errors="replace"))
    return parser.records


if __name__ == "__main__":
    records = load_bookmarks(Path(sys.argv[1]))
    print(f"Parsed {len(records)} bookmarks")
    for r in records[:5]:
        print(f"  [{r['folder']}] {r['title']} -> {r['url']}")
```

```bash
uv run python parse_bookmarks.py bookmarks.html
```

A few details worth noticing:

- **The folder stack is pushed when a `<DL>` opens and popped when it closes.** The subtlety: in this format a folder header is `<DT><H3>Name</H3>` followed by a *nested* `<DL>` holding its contents — so the parser holds the `<H3>` name in `pending_folder` until the nested `<DL>` starts, then pushes it. That's how "Bookmarks bar/Course" becomes a folder path: you're tracking a stack as you walk a tree, the same idea as the folder walker in the RAG-over-a-GitHub-repo project.
- **A bookmark's title is text between tags**, so the parser has to stash the URL when it sees `<A>` and fill the title in when the text arrives. That's just how this format is shaped.
- **`title or href` handles bookmarks with empty titles** — better to index the URL than to drop the record entirely.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python parse_bookmarks.py bookmarks.html` prints a bookmark count and folder-qualified previews.</StepChecklistItem>
<StepChecklistItem>The previewed folder paths match your actual bookmarks bar structure (folders nested correctly).</StepChecklistItem>
<StepChecklistItem>Every parsed record has a URL — no empty `url` fields in the output.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Some browsers export the same URL in multiple folders. After parsing, how would you detect duplicates? Would you expect them to have identical embedding vectors?
- The folder path is included in the record but *not* in what gets embedded in Step 2 — the embedding input is just the title. What searches would adding the folder path to the embedding help with? What would it hurt?

## Step 2: Build a searchable index

Now the shape difference from the notes RAG project shows up. There, one note split into many chunks; here, one bookmark is already the atomic unit. There's no chunking — every record *is* a document, and the "index" is one embedding per bookmark:

```python
# build_index.py
"""Embeds every bookmark from parse_bookmarks.py and saves the vectors +
records locally, so search.py (Step 3) doesn't re-embed at query time.

Run with: uv run python build_index.py bookmarks.html
Re-run this any time you add or edit bookmarks -- the saved index doesn't
update itself.
"""

import json
import sys
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer

from parse_bookmarks import load_bookmarks

MODEL_NAME = "all-MiniLM-L6-v2"
INDEX_PATH = "index.npy"
RECORDS_PATH = "records.json"


def main() -> None:
    records = load_bookmarks(Path(sys.argv[1]))
    if not records:
        print("No bookmarks parsed -- is this a Netscape-format export?")
        return

    print(f"Embedding {len(records)} bookmarks with {MODEL_NAME}...")
    model = SentenceTransformer(MODEL_NAME)
    texts = [r["title"] for r in records]
    embeddings = model.encode(texts, normalize_embeddings=True)

    np.save(INDEX_PATH, embeddings)
    with open(RECORDS_PATH, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    print(f"Saved {embeddings.shape[0]} vectors ({embeddings.shape[1]}-dim) to {INDEX_PATH}")
    print(f"Saved bookmark records to {RECORDS_PATH}")


if __name__ == "__main__":
    main()
```

```bash
uv run python build_index.py bookmarks.html
```

If your bookmarks bar is a few hundred entries, this completes in well under a minute on a laptop CPU. `normalize_embeddings=True` again makes Step 3's cosine similarity reduce to a dot product.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python build_index.py bookmarks.html` completes and prints a shape like `(N, 384)`.</StepChecklistItem>
<StepChecklistItem>Both `index.npy` and `records.json` now exist in your project folder.</StepChecklistItem>
<StepChecklistItem>The bookmark count here matches the one from Step 1.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- A bookmark title is usually 3-10 words. Why does embedding such a short piece of text still work — what does the embedding model have to "know" to make "django admin how to customize" land near "Customizing the Django admin site"?
- The notes project warned about embedding past the model's context limit. Why is that warning mostly irrelevant here?

## Step 3: Search by meaning

Search is the same dot product as every other project in this section — one query vector compared against the whole index:

```python
# search.py
"""Given a natural-language query, ranks bookmarks by relevance.

Run with: uv run python search.py "describe what you're looking for"
"""

import sys

import numpy as np
from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"
INDEX_PATH = "index.npy"
RECORDS_PATH = "records.json"

_model = None  # loaded lazily so importing this module doesn't load the model


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def search(query: str, top_k: int = 5) -> list[dict]:
    import json

    embeddings = np.load(INDEX_PATH)
    with open(RECORDS_PATH, encoding="utf-8") as f:
        records = json.load(f)

    query_vector = get_model().encode([query], normalize_embeddings=True)[0]
    similarities = embeddings @ query_vector

    top_indices = np.argsort(similarities)[::-1][:top_k]
    return [
        {**records[i], "score": float(similarities[i])}
        for i in top_indices
    ]


if __name__ == "__main__":
    query = " ".join(sys.argv[1:]) or "course website"
    for r in search(query):
        print(f"{r['score']:.3f}  [{r['folder']}] {r['title']}\n      {r['url']}")
```

```bash
uv run python search.py "how do I split my data into train and test sets"
```

Now the payoff: this query has almost no words in common with a bookmark titled "Scikit-learn: Train/Test Split" — but both embed near each other in meaning-space, so it ranks near the top. That's the whole difference between semantic and keyword search, in one command.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python search.py "..."` prints `top_k` results with score, folder, title, and URL.</StepChecklistItem>
<StepChecklistItem>Describing a bookmark in your own words (not its title) still surfaces it near the top.</StepChecklistItem>
<StepChecklistItem>Scores are between -1 and 1.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Search a query that *is* a bookmark title almost verbatim. Then search the same bookmark's *meaning* in totally different words. Which returns the higher score — and is the score difference what you'd expect?
- Browser keyword search is exact and instant; this is semantic and slower to set up. What search do you run when you know the title, and what search do you run when you only remember the *idea*? Can you think of a tool that should offer both?

## Step 4: Compare against keyword search

Semantic search isn't strictly better than keyword search — it's *different*, and the interesting lesson is seeing where each wins. Browser Ctrl+F only matches words in titles, so to make the comparison fair, add a tiny keyword ranker of your own to the same records:

```python
# compare.py
"""Compares semantic search against simple keyword search on the same index.

Run with: uv run python compare.py "your query here"
"""

import json
import sys

from search import search


def keyword_search(query: str, records: list[dict], top_k: int = 5) -> list[dict]:
    """Ranks records by how many query words appear in their title, treating
    it as the closest thing to what a browser's bookmark search does."""
    words = [w.lower() for w in query.split() if len(w) > 2]
    scored = []
    for record in records:
        title_lower = record["title"].lower()
        hits = sum(1 for w in words if w in title_lower)
        if hits:
            scored.append({**record, "score": hits})
    scored.sort(key=lambda r: r["score"], reverse=True)
    return scored[:top_k]


def main() -> None:
    query = " ".join(sys.argv[1:]) or "how do I split data into train and test"
    with open("records.json", encoding="utf-8") as f:
        records = json.load(f)

    print("Keyword search:")
    for r in keyword_search(query, records):
        print(f"  {r['score']} hit(s)  [{r['folder']}] {r['title']}")

    print("\nSemantic search:")
    for r in search(query):
        print(f"  {r['score']:.3f}  [{r['folder']}] {r['title']}")


if __name__ == "__main__":
    main()
```

```bash
uv run python compare.py "scikit learn train test split"
```

Keyword search finds nothing (or almost nothing) unless the words appear in a title. Semantic search finds the *idea*. The comparison makes the tradeoff concrete: keyword is fast, exact, and transparent about *why* something matched; semantic catches meaning but can't tell you exactly which word triggered it — it matched a pattern across all of them.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python compare.py "scikit learn train test split"` runs and prints both result lists.</StepChecklistItem>
<StepChecklistItem>The keyword list is empty or shorter than the semantic list for a meaning-based query.</StepChecklistItem>
<StepChecklistItem>You can articulate, in one sentence each, when you'd trust keyword vs. semantic results.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Keyword search only counts words *in the title*. A bookmark titled "Salesforce REST API docs" wouldn't match "how do I call an API". Is that a failure of the title, or a failure of keyword search? What would a hybrid that fixes it look like?
- `keyword_search` here counts hits and sorts. Why does this feel more "transparent" than the embedding score — and is transparency always worth the loss in recall?

## ⚠️ Common pitfalls

- **Forgetting to re-export.** The index is a snapshot of the export you parsed. Save new bookmarks, re-export the HTML, and re-run `build_index.py` — nothing updates automatically.
- **Parsing errors on unusual exports.** Some browsers add extra attributes to `<A>` tags or nest folders in slightly different ways. If a bookmark count looks suspiciously low, print a few raw records and check whether the parser's folder stack is being thrown off by an unexpected tag.
- **Bookmarks with empty or duplicate titles.** Empty titles fall back to the URL; duplicate titles produce near-identical vectors but distinct URLs. Decide deliberately whether duplicates are a bug or a feature (one URL saved in two folders is arguably both).
- **A long tail of dead links.** Semantic search will happily surface a dead or single-use bookmark that happens to match. The tool finds *matches*, not *value* — pruning your bookmarks bar is still on you.
- **Treating semantic search as strictly better.** For the searches where you half-remember a title, keyword wins. This project exists to show the difference, not to declare a winner.

## What you just built

A real, local, no-API-key tool that makes years of saved bookmarks actually searchable by meaning: parse a standard HTML export, embed every record, rank with cosine similarity, and compare against keyword search to see where each wins. The pattern generalizes well beyond bookmarks — any collection of small records with a text field (contacts, code snippets, commands you keep forgetting) can be indexed with this same shape. Nothing here is a toy: the parser handles a real-world format, and the search runs on your actual data.

## Where to go from here

- **Add folder context to the embedding:** embed `folder/title` instead of just `title`, and watch what changes about which searches get better. Is the folder noise or signal for your bookmarks?
- **Prune by score distribution:** find the bookmarks whose vectors are *furthest* from every other bookmark — those outliers are often the long tail of dead links worth deleting or moving.
- **Extend to other record collections:** a list of commands from your shell history, or your notes' headings. The parser changes; `build_index.py` and `search.py` don't care.
- **Add a "why did this match" view:** for the top result, have an LLM (free tier, like the [AI Agent project](/docs/projects/ai-agent)) explain in a sentence what makes it relevant — the transparency that pure embedding scores lack.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Your bookmarks bar will never feel the same. 🎓

<ProjectProgressCheckbox projectId="bookmarks-semantic-search" />
