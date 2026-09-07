---
title: "Build a Wiki Engine"
description: "Store Markdown pages on disk, render them to HTML, keep version-history diffs, compute [[backlink]] maps, and rank full-text search results — pure standard library."
difficulty: "intermediate"
estimatedMinutes: 60
tags: ["markdown", "cli", "automation"]
learningObjectives:
  - "Store wiki pages as Markdown files with a slug naming scheme"
  - Read and render pages to HTML with a small Markdown-lite renderer
  - "Keep an append-only version history and diff any two versions"
  - "Scan [[links]] to compute a reverse backlink index"
  - "Tokenize and rank full-text search by term frequency"
prerequisites:
  - "Python basics (functions, dictionaries, file I/O)"
  - "Comfortable with basic regex (findall, sub)"
  - "Usage of pathlib paths for reading and listing files"
---

# 🛠️ 📚 Build a Wiki Engine

A wiki is *pages on disk plus three indexes*. The pages are Markdown files; the indexes are backlinks (which pages point here?), history (what did this page used to say?), and search (which pages mention these words?). This project builds all three from scratch with the standard library: a slug naming scheme, a tiny Markdown-lite renderer, append-only version history with diffs, a `[[Page]]` backlink map, and a tokenizing search that ranks by term frequency. When you're done you can turn your own notes into a wiki.

This assumes Python 101 plus a little regex — nothing from Data Analysis is required. It's optional and ungraded; see [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Model a page as `slug + title + body` stored in a Markdown file.
2. Read, write, and render pages to HTML with a Markdown-lite renderer.
3. Create a small wiki and route titles through a collision-proof slugifier.
4. Keep append-only version history and diff any two saved versions.
5. Scan `[[Page]]` links and compute the reverse backlink index.
6. Tokenize and rank full-text search by term frequency.

## Where to run this

**Locally with `uv`** is the primary home — a wiki is files on disk, and this engine's whole point is round-tripping through a `wiki/` folder you can open in any editor. The engine is pure standard library, so every cell runs identically in the cloud too.

**Google Colab, Kaggle Notebooks, and Binder** run all six steps unmodified — the cells create a `wiki/` directory and inspect it as they go, so the notebook *demonstrates* the engine against its own pages. The honest caveat: cloud filesystems are ephemeral, so a wiki you actually keep lives local. Use the badges to watch the engine work; use `uv` where your notes live.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/wiki-engine/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/wiki-engine/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fwiki-engine%2Fnotebook.ipynb)

## Setup

Create the project. The engine uses the standard library only — `re` for slugging/parsing, `json` for history, `difflib` for diffs, and `pathlib` for the file tree. No packages to install.

```bash
uv init wiki-engine
cd wiki-engine
```

```bash
uv run python -c "import re, json, difflib; from pathlib import Path; print('stdlib ok')"
```

Seriously, that's the whole dependency list. `difflib` gives you `unified_diff` for free — the same output `git diff` shows — `re` carves slugs and `[[links]]` out of text, and `pathlib` makes "list every `.md` file" a one-liner. The `wiki/` directory you'll create in Step 1 is the database.

**✅ Checklist**

- ✅ `uv init wiki-engine` created a project with a `pyproject.toml`.
- ✅ The import check printed `stdlib ok` — no packages added.

## Step 1: Model a page and slugify its name

A wiki's simplest truth is one file per page. This step defines the `Page` dataclass (`slug`, `title`, `body`), decides where files live (`wiki/<slug>.md`), and writes the slugifier — the function that turns "Data Analysis" into a URL-safe, unique `data-analysis`.

### 1.1 Write `Page`, `slugify`, and `page_path`

**👟 Starter hint:** Slugify by lowercasing and collapsing any run of non-alphanumerics into a single hyphen; keep `Page` a pure value so the file layout and the page's meaning stay separate.

```python
# wiki.py
import re
from dataclasses import dataclass
from pathlib import Path

WIKI_DIR = Path("wiki")

@dataclass
class Page:
    slug: str
    title: str
    body: str

def slugify(title: str) -> str:
    slug = title.lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return slug.strip("-")

def page_path(slug: str) -> Path:
    return WIKI_DIR / f"{slug}.md"

for title in ["Data Analysis", "Sci-kit & Tools!", "  Pandas  "]:
    print(f"{title!r:26} -> {slugify(title)}")
```

The slug is the wiki's *identity*: it's what filenames, `[[links]]`, and search results all key on, so making it deterministic ("Data Analysis" and "data analysis" land on the same file) prevents duplicate pages for the same idea. `re.sub(r"[^a-z0-9]+", "-", ...)` collapses spaces, punctuation, and even multiple separators into one hyphen, and the trailing `.strip("-")` keeps edges clean. Nesting `WIKI_DIR / f"{slug}.md"` inside `page_path` funnels every file write through one convention — no page can escape the wiki folder.

**🎯 Expected output:** `'Data Analysis'            -> data-analysis`, `'Sci-kit & Tools!'         -> sci-kit-tools`, `'  Pandas  '               -> pandas`.

**🩹 If it's off:** If slug gaps stay as spaces, the `strip("-")` edge-trim ran but the collapse regex didn't — check the `+` quantifier. If `Sci-kit & Tools!` renders as `sci-kit--tools`, a double hyphen wasn't merged — again the `+`. If a slug is empty, the title was all non-ASCII/emoji; decide a fallback (`"page"`) before pages start colliding.

### 1.2 Verify slugging

**✅ Checklist**

- ✅ Titles differing only in case and punctuation produce *one* slug.
- ✅ `slugify("Data Analysis") == slugify("Data Analysis!") == "data-analysis"`.
- ✅ `page_path("data-analysis")` resolves inside `wiki/` (`wiki/data-analysis.md`).

**🤔 Socratic Question(s)**

- Two real pages "Plotting" and "Plotting & Plots" slug into the same file — one clobbers the other silently. What would a *collision check* look like at save time, and is failing loudly better than overwriting?
- Slugs are derived from titles here. If a user renames "Data Analysis" to "Analysis", what happens to every file and every `[[Data Analysis]]` link? Where does that argue for an *immutable* slug that outlives title edits?

## Step 2: Read, write, and render pages

Pages must survive the round trip: `Page` → file on disk → `Page` again, then render to HTML. This step writes `save_page`/`load_page` (with a `# Title` first line as the convention) and a Markdown-lite renderer that turns `**bold**` and `[[links]]` into HTML.

### 2.1 Write `save_page`, `load_page`, and `render_html`

**👟 Starter hint:** Store the title as the first `# ` line of the file and the body as everything after; render by regex-substituting bold and `[[link]]` per line, wrapping the rest in `<p>`.

```python
# wiki.py (continued)
def save_page(page: Page) -> Path:
    WIKI_DIR.mkdir(exist_ok=True)
    target = page_path(page.slug)
    target.write_text(f"# {page.title}\n\n{page.body}")
    return target

def load_page(slug: str) -> Page:
    lines = page_path(slug).read_text().splitlines()
    title = lines[0].lstrip("# ").strip()
    body = "\n".join(lines[2:]).strip()
    return Page(slug=slug, title=title, body=body)

def render_html(page: Page) -> str:
    html = [f"<h1>{page.title}</h1>"]
    for line in page.body.splitlines():
        line = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", line)
        line = re.sub(r"\[\[([^\]]+)\]\]", r'<a href="/\1">\1</a>', line)
        if line.strip():
            html.append(f"<p>{line}</p>")
    return "\n".join(html)

demo = Page("welcome", "Welcome", "This wiki covers **Python**. See [[Data Analysis]].")
save_page(demo)
print(render_html(load_page("welcome")))
```

The `# Title`-first-line convention means the file is both a spec and a page: any editor can open `wiki/welcome.md`, change text under the heading, and the wiki picks it up — no hidden database schema. `render_html` deliberately converts *exactly* `**bold**` and `[[wiki-links]]` and wraps everything else in `<p>`; a teacher-aware subset beats a half-baked full Markdown parser, and the two regexes are the whole "renderer". `load_page` round-trips body as-is, so edits made in a text editor survive guessing.

**🎯 Expected output:** `<h1>Welcome</h1>\n<p>This wiki covers <strong>Python</strong>. See <a href="/Data Analysis">Data Analysis</a>.</p>` — note the link targets the raw title; link-resolution to *slugs* comes in Step 5.

**🩹 If it's off:** If the title leaks into the body, the `lines[2:]` slice assumed a blank line after `# Title` when there is none. If nothing renders bold, the `\*\*(.+?)\*\*` regex is missing the `?` (greedy) and spans whole paragraphs. If `save_page` raised `FileNotFoundError`, `WIKI_DIR.mkdir` never ran — create the folder once up front.

### 2.2 Verify the round trip

**✅ Checklist**

- ✅ `render_html(load_page("welcome"))` matches the output above verbatim.
- ✅ Editing `wiki/welcome.md` in any text editor and re-loading shows the edit — files are the source of truth, not Python.
- ✅ A page with no links renders as plain `<p>` paragraphs — no link regex crash on absence.

**🤔 Socratic Question(s)**

- The link anchor renders the *title*, but the wiki keys on *slugs*. Where do these two diverge (a linked page that gets renamed), and what does a correct renderer need to look up before writing the `<a href>`?
- `render_html` substitutes regex on each line, so a `**bold**` marker across two lines won't render. When is that a *feature* (predictable subset) and when is it a trap for users who expect full Markdown?

## Step 3: Version history and diffs

A wiki that forgets what pages used to say can't be trusted. This step adds an append-only history: every save appends `{before, after}` to `wiki/history.json`, and `diff_versions` shows the change between any two versions in `git`-style unified diff.

### 3.1 Write `log_version`, `history_for`, and `diff_versions`

**👟 Starter hint:** Keep history as one JSON dict of `slug -> [{"before", "after"}]`; append-then-write over the whole file, and let `difflib.unified_diff` produce the human-readable hunk.

```python
# wiki.py (continued)
import json
import difflib

HISTORY_FILE = WIKI_DIR / "history.json"

def log_version(slug: str, before: str, after: str) -> None:
    history = json.loads(HISTORY_FILE.read_text()) if HISTORY_FILE.exists() else {}
    history.setdefault(slug, []).append({"before": before, "after": after})
    HISTORY_FILE.write_text(json.dumps(history, indent=2))

def history_for(slug: str) -> list[dict]:
    if not HISTORY_FILE.exists():
        return []
    return json.loads(HISTORY_FILE.read_text()).get(slug, [])

def diff_versions(slug: str, index: int = -1) -> str:
    entry = history_for(slug)[index]
    return "\n".join(difflib.unified_diff(
        entry["before"].splitlines(), entry["after"].splitlines(), lineterm=""))
```

The *append* in `history.setdefault(...).append(...)` is the discipline that makes history trustworthy: older versions are never edited, only added to, so the log is an audit trail rather than a cache. `difflib.unified_diff` is exactly the algorithm `git diff` uses; returning it as a string keeps formatting out of the data layer. Writing the whole JSON on every save is fine at wiki scale and makes the file inspectable by hand — a trade-off any big version store has already made differently, which the question below pokes at.

**🎯 Expected output:** After two edits, `history_for("welcome")` has two entries, and `print(diff_versions("welcome", -1))` shows `-` and `+` lines marking exactly what changed.

**🩹 If it's off:** If history never grows beyond one entry, `log_version` is being called with the *same* `before` on every save (the old text was captured too late). If `diff_versions(-1)` shows a full-file rewrite, the `after` was saved as an empty body (caption the non-empty case). If JSON gets written mangled, a body containing raw `\n` wasn't `json.dumps`-escaped — it always is by `write_text(json.dumps(...))`, so suspect manual edits to `history.json`.

### 3.2 Verify history

**✅ Checklist**

- ✅ Editing a page twice yields two entries; the first `before` equals the page's *original* text.
- ✅ `diff_versions` output begins with `-`/`+` markers (`---`/`+++` headers optional) and shows only changed lines.
- ✅ Switching `index` back to `0` replays the whole change history forward, in order.

**🤔 Socratic Question(s)**

- History stores full `before`/`after` snapshots. For a large wiki that's O(file × edits) disk. What does storing *deltas* (only the changed regions per version) save, and what does reconstruction cost at read time?
- This history records page *text* but not *who* edited or *when*. Which of those two latents — author or timestamp — would you add first, and where does a wiki's history stop being a safety net and start being a governance record?

## Step 4: Backlinks — the reverse page map

Links are only half a wiki; the *backlink* (who points at me?) is the other half, and it's what turns pages into a navigable web. This step scans every page body for `[[Target]]` and builds the reverse map `target -> [pages that link to it]`.

### 4.1 Write `outbound_links` and `backlink_index`

**👟 Starter hint:** `findall` every `[[..]]` token, then walk all `.md` files one per outbound link and register the *source* under the *target*'s slug.

```python
# wiki.py (continued)
LINK_PATTERN = re.compile(r"\[\[([^\]]+)\]\]")

def outbound_links(page: Page) -> list[str]:
    return LINK_PATTERN.findall(page.body)

def backlink_index() -> dict[str, list[str]]:
    backlinks = {}
    for file in WIKI_DIR.glob("*.md"):
        page = load_page(file.stem)
        for target in outbound_links(page):
            backlinks.setdefault(slugify(target), []).append(page.slug)
    return backlinks

for slug, source in sorted(backlink_index().items()):
    print(f"{slug:16} <- {', '.join(source)}")
```

`outbound_links` answers "where does this page point?" and `backlink_index` inverts it into "what points here?" — the standard index inversion, one file-glob and one `setdefault` at a time. Keying by `slugify(target)` is the payoff of Step 1's deterministic slugs: a body saying `[[Data Analysis]]` and one saying `[[data-analysis]]` both register under `data-analysis`, so the index survives naming variance. Walking `WIKI_DIR.glob("*.md")` means the file tree *is* the page list — no separate registry to keep in sync.

**🎯 Expected output:** With the `welcome` page ("See [[Data Analysis]]") and a matching `data-analysis` page, the printout shows `data-analysis     <- welcome`.

**🩹 If it's off:** If a target maps to the empty list, backlinked pages exist but the target-scan found no source — check the regex targets came from body text. If backlinks list the page itself, `findall` is reading the *title* line (links live in bodies only; `[[self]]` is honestly self-referential — decide whether it counts). If a slug tuple-but-scrambled list appears, multiple sources link one target and that's correct — the ordering is just glob order.

### 4.2 Verify backlinks

**✅ Checklist**

- ✅ Two pages each `[[...]]`-linking the other produce one entry per target with the source listed.
- ✅ Renaming a link target in text updates the index via `slugify` without code changes.
- ✅ `backlink_index()` contains no key that isn't a real landing page (see the question on broken links).

**🤔 Socratic Question(s)**

- A link to `[[Missing Page]]` registers a backlink entry for a page that doesn't exist. What would your engine report for "orphan" targets, and why does a dead-link report matter more in a wiki than in a book?
- Backlinks here are computed on every call. If a wiki grows to thousands of pages, what would you *cache* — and what event would invalidate that cache so it never serves stale links?

## Step 5: Full-text search

The last index: given a query, which pages mention these terms, ranked by frequency. This step tokenizes text into lowercase words, drops a small stopword list, scores each page by how many query terms it contains, and returns a ranked list.

### 5.1 Write `tokenize` and `search`

**👟 Starter hint:** Tokenize with `re.findall` on `[a-z0-9]+`, filter stopwords, then score each page as `sum(tokens.count(term) for term in query_terms)`.

```python
# wiki.py (continued)
STOPWORDS = {"the", "a", "an", "and", "of", "to", "in", "for", "on",
             "with", "this", "that", "is", "it", "see", "use"}

def tokenize(text: str) -> list[str]:
    words = re.findall(r"[a-z0-9]+", text.lower())
    return [word for word in words if word not in STOPWORDS and len(word) > 1]

def search(query: str) -> list[tuple[str, int]]:
    terms = tokenize(query)
    results = []
    for file in WIKI_DIR.glob("*.md"):
        page = load_page(file.stem)
        tokens = tokenize(page.title + "\n" + page.body)
        score = sum(tokens.count(term) for term in terms)
        if score:
            results.append((page.slug, score))
    return sorted(results, key=lambda item: -item[1])

save_page(Page("data-analysis", "Data Analysis",
               "Use pandas for grouping. Keep the visual step [[welcome]]."))
for slug, score in search("pandas grouping"):
    print(f"{score:3}  {slug}")
```

Tokenizing title *and* body means a page whose title says "Pandas" ranks for a "pandas" query even if the body never spells it — pages advertise themselves. Dropping stopwords ("this", "see") is the cheapest precision win a search engine makes: `[[see]]` isn't something anyone searches for. Scoring by raw term count is deliberately naive — the question below points at why "Pandas" appearing twice in the *title* over-trusts a ten-word page — but it's a complete, honest ranking where more mentions beats fewer.

**🎯 Expected output:** `search("pandas")` ranks a page whose title/body mentions `pandas` (score 1+) above any page that never uses the word; `search("pandas grouping")` scores the `data-analysis` page at 2 (one hit for each query term) while the `welcome` page scores 0.

**🩹 If it's off:** If a one-character word like `R` (the language!) vanishes, `len(word) > 1` filtered it — that's a stopword-policy leak, remove the length gate for real use. If nothing ever matches, `tokenize` got a non-string (title `None`) or the regex class was `.`, matching punctuation. If results return in glob order regardless of score, the `key=lambda item: -item[1]` sort is missing.

### 5.2 Verify search

**✅ Checklist**

- ✅ `search("pandas")` returns the `pandas` page first with score ≥ 1.
- ✅ A two-term query returns a multi-term page above a single-term page.
- ✅ Case-insensitivity holds: `search("PANDAS")` equals `search("pandas")`.

**🤔 Socratic Question(s)**

- Raw term-count scoring rewards *long* pages and punishes *concise* ones. What normalizers (divide by page length, cap title weights) would make "short and exactly on-topic" beat "long and rambling"...
- Search reads every page on every call. At what wiki size does a prebuilt `term -> [slugs]` inverted index (built once in Step 4's spirit) beat rescoring all files, and what must you update when a page is edited?

## ⚠️ Common pitfalls

- **Slug collisions clobbering pages.** "Plotting" and "Plotting & Plots" map to one file, silently overwriting each other. Fix: check `page_path(slug)` exists before save, and fail loudly instead of writing over.
- **Links pointing at titles, not slugs.** `[[Data Analysis]]` must resolve to `data-analysis` or the link 404s in any real renderer. Fix: route `[[...]]` through `slugify` in the renderer and the backlink index (Step 5's renderer upgrade).
- **Bodies that have lost their title.** Parsing `lines[2:]` assumes a blank line after `# Title`. Fix: `load_page` reads the first `# ` line as the title and *everything else* as body, tolerant of missing blanks.
- **History recording the wrong "before".** Capturing `before` *after* saving the new text makes every diff a no-op. Fix: read the old body first, then `log_version` before the page is overwritten.
- **Search that treats every word equally.** ", " and "the" dominate rankings. Fix: a stopword set (and a length floor), then move up to term-frequency weighting from the Step 5 question.

## What you just built

A complete, dependency-free wiki engine: slugified pages on disk, a Markdown-lite renderer, append-only version history with git-style diffs, a reverse `[[link]]` index, and ranked full-text search. The transferable lesson is that *a wiki is three indexes over a file tree* — same-file scan for backlinks, a log for history, a token counter for search — and that indexing is simply "precompute the answers nobody wants to recompute". Every static-site generator you've ever used is this same loop wearing a front end.

:::tip[Run a fuller version without any local setup]
[`examples/wiki-engine/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/wiki-engine) in the course repo is a fuller version of the code above, with a Markdown-lite renderer that resolves links to slugs and a page-count dashboard. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Resolve `[[links]]` to *slugs* in the renderer (Step 2's question), so hits never render as `href="/Data Analysis"` but as `href="/data-analysis"`.
- Add a `broken_links()` report that flags `[[Target]]` where `page_path(slugify(Target))` doesn't exist — the wiki's own dead-link scanner.
- Store deltas instead of full snapshots in history, reconstructing a body on demand — the Step 3 question's upgrade made real.
- Build a precomputed inverted index for search (term → slugs), rebuild it on save, and let titles outrank body text.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓