---
id: codebase-qa
title: "Build a Codebase Q&A Tool — Where Is X Implemented?"
sidebar_label: "Codebase Q&A"
slug: /projects/codebase-qa
description: "Answer two different questions about a real repo with the right tool for each: exact symbol lookup for 'where is X defined?' and embedding search for 'how does X work?' — then ground the answer with an LLM that must cite file:line."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🧭 Build a Codebase Q&A Tool — Where Is X Implemented?

<ProjectPublishedDate projectId="codebase-qa" />

<ProjectGreeting />

"Where is X implemented?" is the most common question a developer asks of an unfamiliar codebase — and it's secretly *two different questions* that need different tools:

- **"Where is `train_test_split` defined?"** is an *exact* question. The answer is a fact: file, line, done. Keyword and symbol search nail it; semantic search is overkill and often misses it.
- **"How does the training loop work?"** is a *fuzzy* question. The answer is a *concept* spread across several functions in several files. Embedding search excels here; symbol lookup fails.

This project builds a small tool that answers both, honestly saying which mode it's using: an **AST symbol index** (exact definitions and imports, via Python's built-in `ast` module) and an **embedding index** (meaning search, via `sentence-transformers`), with a free-tier LLM that must ground its answer in the retrieved `file:line` citations. This assumes Python 101 and comfort with either the AST ideas from [Turn a Codebase into a Knowledge Graph](/docs/projects/codebase-knowledge-graph) or the embedding ideas from the [RAG projects](/docs/projects/rag-notes); nothing from Data Analysis is required.

This is optional and ungraded. See [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Clone a real repository and walk its Python files, extracting every function/class definition and import with its **line number** — using nothing but the standard library's `ast`.
2. Build a second index the same repo the semantic way: embed code chunks and docs locally with `sentence-transformers`.
3. Write a query dispatcher that decides which mode fits the question: exact symbol lookup for "where is X?", embedding search for "how does X work?".
4. Add a free-tier LLM that answers using only the retrieved context, citing the exact `file.py:line` — and verify one citation by opening the file.

## Where to run this

**Locally with `uv`** is the path this lesson's steps follow, and the recommended one — it's real Python against a real cloned repo on your own machine.

**GitHub Codespaces** is a zero-setup alternative: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed, per the repo's `.devcontainer/devcontainer.json`) and run the exact same `uv` commands from a terminal in your browser tab.

**Google Colab, Kaggle Notebooks, or Binder** also work, since this project needs no GPU. A ready-to-run notebook that writes a tiny sample repo inline (hosted notebooks have no local files) and runs both query modes over it is included in the repo:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/codebase-qa/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/codebase-qa/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcodebase-qa%2Fnotebook.ipynb)

Be honest with yourself about the tradeoff: the notebook runs the same code over a sample repo, but the real payoff — answering questions about a codebase you actually care about — comes from the local `uv` path.

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
uv init codebase-qa
cd codebase-qa
uv add sentence-transformers numpy python-dotenv openai
```

`sentence-transformers` turns code and docs into vectors locally on your CPU. `numpy` does the similarity math. `python-dotenv` keeps your LLM API key in a local `.env` file. `openai` is the client that talks to GitHub Models (and, with a different `base_url`, to the other OpenAI-compatible providers). The symbol index needs **no extra dependency at all** — `ast` is in the standard library.

### Clone a test repository

The course repo itself is a good test subject (small, and you'll recognize its code), but this project is even more fun on a small real library you actually use — anything with a handful of `.py` files and some docs:

```bash
git clone --depth 1 https://github.com/abderrahim-lectures/python-data-analysis-course
```

`--depth 1` grabs only the latest snapshot with no git history — all you need for indexing.

### Get a free LLM API key

Generation (the last step) needs a free-tier LLM API — the symbol and embedding indexes are fully local and need no key. **Pick whichever provider you like** — none of them require a credit card at the time of writing, and this course doesn't favor one over another.

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

## Step 1: Extract exact symbols with `ast`

The `ast` module parses Python source into a tree, and the tree *knows line numbers*: every `FunctionDef` and `ClassDef` node carries `.lineno`. That's everything "where is X defined?" needs. The trick used by the [knowledge-graph project](/docs/projects/codebase-knowledge-graph#step-1-parse-a-single-files-ast) is to walk **only top-level statements** — `tree.body`, not `ast.walk(tree)` — so a helper function nested inside another isn't mistaken for a module-level definition:

```python
# symbols.py
"""Builds an exact symbol index of a Python repo using only `ast`.

Run with: uv run python symbols.py /path/to/repo
This prints a summary -- build_index.py (Step 2) imports load_symbols()
from this file.
"""

import ast
import json
import sys
from pathlib import Path

SKIP_DIRS = {".git", "node_modules", "__pycache__", "venv", ".venv", "dist", "build"}


def walk_py_files(repo_root: Path) -> list[Path]:
    files = []
    for path in sorted(repo_root.rglob("*.py")):
        if any(part in SKIP_DIRS for part in path.relative_to(repo_root).parts):
            continue
        files.append(path)
    return files


def extract_symbols(path: Path) -> list[dict]:
    """Returns one record per top-level def/class/import in a file, each
    with its line number."""
    source = path.read_text(encoding="utf-8", errors="replace")
    try:
        tree = ast.parse(source, filename=str(path))
    except SyntaxError as exc:
        print(f"⚠️  Skipping {path}: syntax error ({exc.msg} at line {exc.lineno})")
        return []

    symbols = []
    for node in tree.body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            symbols.append({"kind": "function", "name": node.name, "line": node.lineno, "file": str(path)})
        elif isinstance(node, ast.ClassDef):
            symbols.append({"kind": "class", "name": node.name, "line": node.lineno, "file": str(path)})
            for item in node.body:
                if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    symbols.append(
                        {"kind": "method", "name": f"{node.name}.{item.name}", "line": item.lineno, "file": str(path)}
                    )
        elif isinstance(node, ast.Import):
            for alias in node.names:
                symbols.append({"kind": "import", "name": alias.name.split(".")[0], "line": node.lineno, "file": str(path)})
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                symbols.append({"kind": "import", "name": node.module.split(".")[0], "line": node.lineno, "file": str(path)})
    return symbols


def load_symbols(repo_root: Path) -> list[dict]:
    symbols = []
    for path in walk_py_files(repo_root):
        symbols.extend(extract_symbols(path))
    return symbols


if __name__ == "__main__":
    symbols = load_symbols(Path(sys.argv[1]))
    print(f"Indexed {len(symbols)} symbols")
    for s in symbols[:5]:
        print(f"  {s['kind']:9s} {s['name']} @ {s['file']}:{s['line']}")
```

```bash
uv run python symbols.py python-data-analysis-course
```

Note the honest limitations built in from the start: `ast` handles Python only, it can't see through imports you haven't resolved, and a call inside a function body isn't a *definition* — this index answers "where is it defined?" precisely *because* it's deliberately narrow.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python symbols.py python-data-analysis-course` prints a symbol count and `kind name @ file:line` previews.</StepChecklistItem>
<StepChecklistItem>Nested helper functions don't appear as module-level symbols — only top-level defs/classes/methods do.</StepChecklistItem>
<StepChecklistItem>Every symbol has a `file` and a non-zero `line`.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Why does `ast` count as "exact" while embedding search doesn't? What could make a symbol lookup *wrong* that embeddings would still get right?
- A function defined in `utils.py` and imported into `main.py` produces an `import` record in both files. If you search "where is `train_test_split` defined?", which record is the answer — and which one is the *trap*?

## Step 2: Build the semantic index

Exact lookup answers "where is the definition", but "how does the training loop work?" needs the *meaning* of code — and that's the embedding index from the RAG-over-a-GitHub-repo project, pointed at the same repo:

```python
# build_index.py
"""Builds the exact (symbols.json) and semantic (index.npy/chunks.json)
indexes for a repo. Query (Step 3) reads both.

Run with: uv run python build_index.py /path/to/repo
Re-run this any time the repo changes.
"""

import json
import sys
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer

from prepare_repo import load_chunks
from symbols import load_symbols

MODEL_NAME = "all-MiniLM-L6-v2"
INDEX_PATH = "index.npy"
CHUNKS_PATH = "chunks.json"
SYMBOLS_PATH = "symbols.json"


def main() -> None:
    repo = Path(sys.argv[1])

    symbols = load_symbols(repo)
    with open(SYMBOLS_PATH, "w", encoding="utf-8") as f:
        json.dump(symbols, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(symbols)} symbols to {SYMBOLS_PATH}")

    chunks = load_chunks(repo)
    if not chunks:
        print("No chunks found -- did you pass a valid repo path?")
        return

    print(f"Embedding {len(chunks)} chunks with {MODEL_NAME}...")
    model = SentenceTransformer(MODEL_NAME)
    embeddings = model.encode([c["text"] for c in chunks], normalize_embeddings=True)

    np.save(INDEX_PATH, embeddings)
    with open(CHUNKS_PATH, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)

    print(f"Saved {embeddings.shape[0]} vectors ({embeddings.shape[1]}-dim) to {INDEX_PATH}")


if __name__ == "__main__":
    main()
```

This project pairs the two indexes deliberately rather than picking one: the symbol index is *precise but narrow* (it knows where things are, not what they do), the embedding index is *broad but fuzzy* (it knows what code is about, not that this is *the* definition). Both are cheap to build and together they answer both halves of "where/how is X implemented?".

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python build_index.py python-data-analysis-course` completes and creates `symbols.json`, `index.npy`, and `chunks.json`.</StepChecklistItem>
<StepChecklistItem>The symbol count in the output matches Step 1's.</StepChecklistItem>
<StepChecklistItem>The embedding shape's first number equals the chunk count and the second is 384.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Both indexes describe the same repo, but one is JSON and one is vectors. Which one answers "how does X work?" — and what would a tool that only had the symbol index be unable to do?
- The semantic index reuses the *code-aware* chunker (function/class boundaries) from the RAG-over-GitHub-repo project. Why would paragraph-style chunks be worse here specifically for "how does X work?" questions?

## Step 3: Dispatcher — pick the right tool per question

The interesting engineering is the dispatcher: look at the question, decide which index answers it, and be explicit about the choice. A practical rule: if the question asks **where** something is, or names a symbol directly, use the symbol index; otherwise use semantic search:

```python
# query.py
"""Answers "where is X?" (exact) and "how does X work?" (semantic) over a
repo, then grounds a free-tier LLM answer in the retrieved file:line context.

Run with: uv run python query.py "where is train_test_split defined?"
Run with: uv run python query.py "how does the training loop work?"
"""

import json
import os
import re
import sys

import numpy as np
from dotenv import load_dotenv
from openai import OpenAI
from sentence_transformers import SentenceTransformer

from retrieve import retrieve

load_dotenv()

MODEL_NAME = "all-MiniLM-L6-v2"
INDEX_PATH = "index.npy"
CHUNKS_PATH = "chunks.json"
SYMBOLS_PATH = "symbols.json"

_WHERE_RE = re.compile(r"where (?:is|are|does)\s+(.+?)(?:\?|$)", re.IGNORECASE)


def looks_like_where_question(question: str) -> bool:
    """Heuristic: questions asking where something *is* usually want the
    exact symbol index; everything else gets semantic search."""
    return bool(_WHERE_RE.search(question))


def _extract_symbol_query(question: str) -> str:
    """Pulls the symbol name out of a 'where is X defined?' question,
    stripping trailing verbs like 'defined'/'located'/'declared'."""
    match = _WHERE_RE.search(question)
    if not match:
        return ""
    name = match.group(1).strip().strip("?")
    for trailing in (" defined", " located", " declared", " implemented"):
        if name.endswith(trailing):
            name = name[: -len(trailing)].strip()
            break
    return name


def find_symbol(name: str) -> list[dict]:
    """Exact lookup: every symbol whose name matches, with file + line."""
    with open(SYMBOLS_PATH, encoding="utf-8") as f:
        symbols = json.load(f)
    query_name = name.strip().strip("?")
    return [s for s in symbols if s["name"] == query_name or query_name in s["name"]]


def ask_llm(question: str, context_blocks: list[str]) -> str:
    client = OpenAI(
        api_key=os.environ["GITHUB_TOKEN"],
        base_url="https://models.github.ai/inference",
    )
    prompt = f"""Answer the question using ONLY the context below. Each block
is tagged with the file and line range it came from. Support every factual
claim with a citation in the form [path.py:start-end]. If the context doesn't
contain the answer, say so -- do not make something up.

Context:
{chr(10).join(context_blocks)}

Question: {question}

Answer:"""
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # confirm this still has a free tier before running
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content


def answer(question: str, top_k: int = 4) -> str:
    if looks_like_where_question(question):
        name = _extract_symbol_query(question)
        hits = find_symbol(name) if name else []
        if hits:
            lines = "\n".join(
                f"  [{s['kind']}] {s['name']} @ {s['file']}:{s['line']}" for s in hits[:10]
            )
            return f"Exact symbol lookup for {name!r}:\n{lines}"
        # No symbol matched -- fall through to semantic rather than guessing.
        print("(no exact symbol match; trying semantic search)")

    chunks = retrieve(question, top_k=top_k)
    context_blocks = [
        f"[{c['source']}:{c['start']}-{c['end']}]\n{c['text']}" for c in chunks
    ]
    return ask_llm(question, context_blocks)


if __name__ == "__main__":
    question = " ".join(sys.argv[1:]) or "how does the course build this website?"
    print(answer(question))
```

```bash
uv run python query.py "where is train_test_split defined?"
uv run python query.py "how does the course build this website?"
```

The dispatcher is deliberately simple — a regex for "where is X?" — and honest about its limits: it prints `(no exact symbol match; trying semantic search)` instead of pretending a miss is a hit. The fallthrough matters: a "where" question about a concept rather than a symbol still gets a grounded answer, just via the other index.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python query.py "where is X defined?"` (real symbol name) prints exact `kind name @ file:line` hits, no LLM call.</StepChecklistItem>
<StepChecklistItem>The same query with a made-up name prints the "no exact symbol match" note and falls through to semantic search without crashing.</StepChecklistItem>
<StepChecklistItem>`uv run python query.py "how does ... work?"` prints a cited LLM answer.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- The "where" heuristic keys on the word "where". What questions start with "where" but want a *semantic* answer — and what happens to them in this dispatcher?
- The fallthrough prints a note and uses semantic search. Why is that better than either (a) returning "not found" or (b) silently switching modes? What would silent switching cost a user?

## Step 4: Verify the citations

Both modes produce something you should actually check — the symbol hits by opening the file at the line, the semantic answers by opening each cited range:

```bash
uv run python query.py "where is ProjectPublishedDate defined?"
# -> Exact symbol lookup for 'ProjectPublishedDate':
#    [class] ProjectPublishedDate @ src/components/ProjectPublishedDate.tsx:1
```

Open `src/components/ProjectPublishedDate.tsx` at line 1 — the definition should be right there. For semantic answers, the citations in the answer (like `[docs/projects/index.mdx:149-160]`) point at ranges you can jump to the same way. This step isn't optional diligence: it's the whole trust model of the tool. A citation is only worth something if the cited lines really contain what the answer claims.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>You opened at least one exact-lookup hit and confirmed the definition is at the cited line.</StepChecklistItem>
<StepChecklistItem>You opened at least one semantic-answer citation and confirmed the cited range supports the claim.</StepChecklistItem>
<StepChecklistItem>You can name one case where the tool gave a confident-sounding but wrong citation — and what retrieved the wrong chunk.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Which mode is more likely to produce a *confidently wrong* answer — exact symbol lookup or semantic search — and why? What does that asymmetry suggest about where to focus verification effort?
- The symbol index answers "where is it defined?" but not "what does it do?". If a user asks the LLM to explain a function, it retrieves the function *definition* chunk. Is the docstring in the chunk enough, or would you also want the call sites?

## ⚠️ Common pitfalls

- **Forgetting this is Python-only.** The `ast` index is language-specific by design. Point this tool at a TypeScript repo and `walk_py_files` finds nothing; the embedding index still works, but the exact half goes quiet. That's the honest limitation, not a bug.
- **"Where" heuristics over-triggering.** "Where should I put this import?" is a *judgment* question, not a symbol lookup — the dispatcher will match the regex and find no symbol, then fall through. Read the fallthrough message when it appears.
- **Trusting citations without checking.** Both indexes can hand the LLM the wrong chunk; the LLM will cite it confidently anyway. Always open at least one citation per answer.
- **Stale indexes after the repo changes.** `git pull` doesn't rebuild `symbols.json` or `index.npy`. Re-run `build_index.py` after any change.
- **Rate limits on the free LLM tier.** Only the LLM call in `query.py` counts against your free-tier quota — the indexes are local and unlimited. A 429 is the provider telling you to slow down; see the [AI Agent project](/docs/projects/ai-agent#handling-rate-limits) for a retry pattern.

## What you just built

A two-tool Q&A system over a real codebase that is honest about what each tool is good at: an exact `ast`-based symbol index for "where is X defined?", an embedding index for "how does X work?", and an LLM that grounds its answers in verifiable `file:line` citations. The pairing — precision *and* recall, deliberately kept separate instead of blurred into one — is the architecture of production "chat with your codebase" tools, with scale and paid models being the only differences.

## Where to go from here

- **Add a symbol-based "who calls this?" mode** using the call-resolution trick from the [knowledge-graph project](/docs/projects/codebase-knowledge-graph): a repo-wide short-name index turns every call site into an O(1) lookup.
- **Improve the dispatcher.** Instead of one regex, classify questions with a small prompt to the free LLM itself: "is this asking where something is, or how something works?" — and see whether LLM routing beats your heuristic on a test set.
- **Extend exact lookup to other languages** via tree-sitter grammars, or keep it Python-only and be explicit about the boundary — both are defensible designs.
- **Add re-ranking** to the semantic half: retrieve a larger top-k with embeddings, re-score with a cross-encoder, send the best few to the LLM.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to a developer tool you'll actually use every week. 🎓

<ProjectProgressCheckbox projectId="codebase-qa" />
