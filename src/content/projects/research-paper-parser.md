---
title: "Build a Research Paper Parser"
description: "Extract structured data from academic papers — structure, citations, methods, and references — from plain text with pure Python."
difficulty: "advanced"
estimatedMinutes: 240
tags: ["scripting", "regex", "text-processing", "data-extraction", "cli"]
learningObjectives:
  - "Parse a plain-text academic paper into structured sections with heading detection"
  - "Extract citations and build a reference list with a regex-driven parser"
  - "Classify methods and results text by section membership"
  - "Implement a tiny ranked search over parsed paper content"
prerequisites: ["python-101/file-io", "python-101/strings", "python-101/functions", "python-101/dictionaries"]
---

# 📄 Build a Research Paper Parser

Reading a paper is one thing; *indexing* a corpus of them is another. A literature review, a reference manager, a review-generation tool — all of them start with the same unglamorous job: turn a wall of prose into a structure with sections, citations, and a bibliography a machine can work with. This project builds that parser from the ground up in pure Python. You'll take a real academic paper's plain text, detect its section headings by their shape, split the body into structured parts, extract `[1]`, `[2, 3]` style citations and the references they point at, then build a small ranked search over the parsed content. PDF decoding is out of scope and deliberately so — the interesting engineering is the text the moment it's already on your disk: shape recognition, regex, and data structures, none of which needs a PDF library.

This assumes Python 101 — file I/O, strings, functions, and dictionaries. Optional and ungraded; see [Real-World Projects](/docs/projects) for the full list.

## 🎯 What you'll do

1. Load a real paper's plain text and peek at its raw shape.
2. Detect section headings by their typography (numbers, title-case, length) instead of a hand-written list.
3. Split the paper into a structured `{section: text}` map you can query.
4. Extract inline citations and build a references section — with the citation↔reference relationship intact.
5. Build a tiny ranked search (term frequency) over the parsed sections and sanity-check it.

## Where to run this

**Locally with `uv`** is the primary path — the parser operates on plain-text files you can find, touch, and diff, and the stdlib-only rule (`re`, `collections`, `pathlib`) means zero install friction beyond `uv init`.

**GitHub Codespaces** is the identical experience: open [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), clone a public paper's `.txt`, and parse it in a browser tab.

**Google Colab, Kaggle Notebooks, and Binder handle the parsing honestly** — pure Python runs anywhere, and a short plain-text paper pasted or uploaded into the notebook parses exactly as it does locally. The notebook can even generate a *sample paper* on the fly so you have deterministic data before you fetch a real one. The only thing a notebook can't reproduce is the "grab a real `.txt` from arXiv and parse it" joy — that pull is a local/terminal habit.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/research-paper-parser/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/research-paper-parser/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fresearch-paper-parser%2Fnotebook.ipynb)

## Setup

Two things before the first heading lands: `uv` on your PATH, and a genuine plain-text paper to chew on.

### Install `uv`

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
mkdir research-paper-parser && cd research-paper-parser
uv init --bare
```

### Get a plain-text paper

arXiv's `Source` page offers a plain-text `.txt` for most papers, and the course repo ships a small sample:

```bash
mkdir -p papers
# fetch a real one (example: an arXiv paper's HTML -> download source -> extract .txt)
curl -L -o papers/sample.txt https://raw.githubusercontent.com/abderrahim-lectures/python-data-analysis-course/main/examples/research-paper-parser/paper.txt
wc -l papers/sample.txt
```

If the sample isn't available, any `.txt` of a conference paper works — the parser is shape-based, not format-locked.

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `papers/sample.txt` exists and `wc -l` reports a few hundred lines of prose.
- ✅ `head -20 papers/sample.txt` shows a title, then section headings, then body text.

## Step 1: Load and inspect the raw text

Every parser starts by *looking* — printing the file's shape before any logic commits to assumptions. This step reads the whole paper, splits it into lines, and computes the cheap statistics that teach you what "a heading" looks like in *this* file (titles are short, ALL-CAPS or Title Case, numbered; body lines are long sentences). Guessing at headings before this inspection is how parsers fall into format-lock.

**👟 Starter hint:** Start by writing `load(path)` that reads the whole file with `Path(path).read_text(encoding="utf-8", errors="ignore").splitlines()`, then print the line count and a window over the first 25 lines.

```python
# parser.py
from pathlib import Path

def load(path: str) -> list[str]:
    return Path(path).read_text(encoding="utf-8", errors="ignore").splitlines()

lines = load("papers/sample.txt")
print("total lines:", len(lines))
for i in range(0, min(25, len(lines))):
    print(f"{i:4d} | {lines[i][:80]}")
```

`read_text(...)["utf-8", errors="ignore"]` swallows the occasional mojibake byte from an old `.txt` without crashing — a pragmatic choice for a text scraper (losing one corrupt char beats aborting the whole parse). `errors="ignore"` is the reviewer's red flag too: it's a silent data-loss knob, and choosing it *deliberately* with a comment is the professional move. The `[:80]` slice is cheap sanity on what the file actually contains before you write a single matching rule.

**🎯 Expected output:** A count (~300-600 lines typical) and a first-25-lines window showing the title, an Abstract, then numbered section headings like `1. Introduction`, `2. Methods` — the exact shape evidence the next step's heuristics rely on.

**🩹 If it's off:** If the file is empty or the line count is tiny, the download failed or the sample path is wrong — check `papers/sample.txt` exists and has nonzero bytes. If every line prints empty, the file is UTF-16 or otherwise non-UTF-8 — `errors="ignore"` would hide *that* failure by stripping everything; print `repr(lines[5][:50])` to see the raw bytes.

**✅ Checklist**

- ✅ Line count is sane (hundreds) and the first lines include a title + Abstract.
- ✅ You've *seen* the heading styles with your own eyes before coding the detector.
- ✅ `errors="ignore"` is a *deliberate* choice, not an accident — you can say when you'd remove it.

**🤔 Socratic Question(s)**

- Before writing the heading detector, imagine two papers: one with `**3. Results**` (bold, three-word) and one with a plain line `Results and Discussion`. If you write a regex for the *first*, what does the *second* teach you about why shape-over-syntax is the robust move for a parser meant to generalize?
- `errors="ignore"` drops corrupt bytes silently. Name a scenario where that policy causes a *wrong answer instead of a crash* — and the diagnostic that would catch it.

## Step 2: Detect section headings by shape

The brittle approach is a hard-coded list (`if line == "Introduction":`). The robust approach treats "headingness" as a *score* — a line is a heading when it is short, starts on its own, and reads like a title (title-case or ALL-CAPS, possibly numbered). This makes the parser survive titles it has never seen, which is the entire point of shape-based extraction.

**👟 Starter hint:** Start by writing `is_heading(line)` with the three signals — a `^\d+(\.\d+)*\.?\s` numbered prefix, `istitle()`/`isupper()`, and the `known` list — combined with `or`, then scan your Step 1 lines and print everything you flagged.

```python
# parser.py (continued)
import re

def is_heading(line: str) -> bool:
    s = line.strip()
    if not s or len(s) > 80:
        return False
    numbered = bool(re.match(r"^\d+(\.\d+)*\.?\s+\S", s))
    titlecase = s.istitle() or s.isupper()
    # 'Abstract', 'References', 'Conclusion' are single-word famous headings too
    known = s in {"Abstract", "Introduction", "Methods", "Results",
                  "Discussion", "Conclusion", "References"}
    return (numbered or titlecase or known) and len(s.split()) <= 12

headings = [(i, ln) for i, ln in enumerate(lines) if is_heading(ln)]
for i, h in headings[:12]:
    print(f"{i:4d}: {h}")
```

The detector is a compound predicate: a heading is a line that is short (`len<=80`, `<=12 words`), and reads like a title (number-prefixed, title-case, ALL-CAPS, or a famous single-word name). Any one signal is hop on its own; the *union* is how real papers express headings in wildly varied styles. Note the deliberately coarse `<=80` and `<=12`: they reject prose while accepting practically any heading a journal mints, trading a few false matches (a short bold sentence) for the far larger false-negative catastrophe (missing a heading).

**🎯 Expected output:** The first ~10-12 heading lines with their line indices — matching your eyeball check from Step 1, because the rules were derived from that very inspection.

**🩹 If it's off:** If a real heading is missed, its style fell outside the predicate — run it through the three sub-tests (` numbered`, `istitle`, `isupper`) to see which branch failed, then loosen that one. If short prose lines are flagged as headings (a terse sentence under 12 words starting with a capital), that's a known false-positive of shape-detection — the trade is intentional, and the Section bucketing in Step 3 cleanly discards junk body text anyway.

**✅ Checklist**

- ✅ The detected headings match your Step 1 visual reading within a couple of hits.
- ✅ You can say *which* sub-signal caught each heading (numbered vs title-case vs known-word).
- ✅ You can articulate the false-positive tradeoff (short-titled sentences) and why it's worth it.

**🤔 Socratic Question(s)**

- The predicate is "any of several signals." Flip it: what breaks if you require *ALL* of them (short AND numbered AND title-case)? Name a real heading pattern it would reject — that's exactly the over-fitting trap a shape detector is meant to dodge.
- `known` is a hard-coded list of famous section names. Extend the thought: what happens when a paper calls a section "5. Experimental Setup" — which branch catches it, and what's the residual risk if this detector hits a section titled, say, "A Note on Notation"?

## Step 3: Split into a structured section map

Now that headings are found, the payoff: turn a flat list of lines into a `{heading: body_text}` dictionary. Each heading starts a new section, and everything between it and the next heading belongs to it. This is the data structure that turns "read the paper" into "ask the paper questions" — and it reuses the exact detector you already built.

**👟 Starter hint:** Start by writing `split_sections(lines, is_heading)` as a fold: a `current` heading name, a `buf` list, and one `for` loop that closes the bucket into the dict whenever a new heading (with content) fires.

```python
# parser.py (continued)

def split_sections(lines: list[str], is_heading) -> dict[str, str]:
    sections: dict[str, str] = {}
    current = "frontmatter"
    buf: list[str] = []
    for ln in lines:
        if is_heading(ln) and buf:
            sections[current] = "\n".join(buf).strip()
            current = ln.strip()
            buf = []
        else:
            buf.append(ln)
    if buf:
        sections[current] = "\n".join(buf).strip()
    return sections

sections = split_sections(lines, is_heading)
for name, body in sections.items():
    words = len(body.split())
    print(f"{name[:45]:<47} {words:>6} words")
```

The core is an *accumulator fold*: `current` points at the heading you're filling, `buf` gathers its lines, and when a new heading appears you close out the last bucket (only if it had content — `if buf` skips empty drift between back-to-back headings). The frontmatter bucket catches everything before the first real heading — title, authors, abstract — under a synthetic key, keeping the map total with no dropped text. The output is the moment the paper stops being a string and becomes *queryable data*.

**🎯 Expected output:** A `dict` with a `frontmatter` entry and one entry per real section, each printing its name and word count — Methods heavier than Conclusion, frontmatter small but present.

**🩹 If it's off:** If only `frontmatter` and one giant section appear, the heading detector fired once at the top — the first body heading was missed in Step 2; re-run the detector and loosen it. If a heading is *swallowed* into the section above it, `is_heading` returned False for the very heading that starts the bucket boundary — same fix, different line. If sections bleed together, the `if is_heading and buf` guard — not `if is_heading` alone — is dropping an empty buffer close when two headings sit adjacent.

**✅ Checklist**

- ✅ The section map mirrors Step 1's heading list — every detected heading is a dictionary key.
- ✅ No text is lost: the union of all section bodies reconstructs the original lines.
- ✅ `frontmatter` captures the pre-heading block (title + abstract) intact.

**🤔 Socratic Question(s)**

- The fold closes a bucket only when the *next* heading fires. Trace what would happen if a heading sat at the very *end* of a section — how does the code guarantee the final `buf` still lands in the dict (look at the trailing `if buf`)? What bug appears without it?
- Section *boundaries* are defined by headings; but the map's keys are raw heading strings. If you now wanted "the Methods" programmatically, what does a heading like `3. Methods and Materials` vs `Methods` do to exact-match lookups — and why does that argue for normalizing keys as you store them?

## Step 4: Extract citations and build a reference list

A parser isn't done at sections — a *research* parser must find the references. Papers cite with `[12]`, `[3, 5]`, or `[4–7]` inline, and those tokens are the edges of a citation graph back to the numbered bibliography. This step isolates references, extracts the citation numbers, and maps `number → paper` using the reference-list block — turning bracketed noise into a structured `{num: title}` dict.

**👟 Starter hint:** Start by writing `extract_references(text)` to cut everything after the `References` marker, then `citations_from(body)` with `re.findall(r"\[(\d+(?:\s*,\s*\d+)*)\]", ...)` that splits each bracket block into its individual numbers.

```python
# parser.py (continued)
import re

def extract_references(text: str, prefix: str = "References") -> list[str]:
    m = re.search(prefix + r"\s*\n(.*)", text, re.S)
    return [l for l in (m.group(1).splitlines() if m else []) if l.strip()][:20]

refs = extract_references("\n".join(lines))
print("first few references:")
for r in refs[:5]:
    print("  ", r[:90])

def citations_from(body: str) -> list[int]:
    nums = re.findall(r"\[(\d+(?:\s*,\s*\d+)*)\]", body)
    out = []
    for block in nums:
        out += [int(x) for x in re.split(r"\s*,\s*", block)]
    return out

print("citations in frontmatter:", citations_from(sections.get("frontmatter", ""))[:10])
```

`extract_references` splits at the `References` marker and grabs everything after it — a crude but highly effective "the rest of the paper is the bibliography" heuristic (reinforced by slicing `.splitlines()[:~20]`). `citations_from` is the inline-citation engine: `findall` grabs bracketed groups like `[12, 34]`, and the inner `re.split` turns the comma-separated block into individual numbers. The `\d+(?:\s*,\s*\d+)*` pattern matches one-or-many comma-separated numbers, which is exactly the `[4, 7, 12]` case; the `[4–7]` dash-range is a flagged TODO you'd extend. The citation numbers are the *addresses* into the references list — the `{num: title}` join is the bridge between "what the text cites" and "what the bibliography officially lists."

**🎯 Expected output:** The first ~5 reference lines from the bibliography, and a short list of numeric citations pulled from the frontmatter (the abstract usually cites a few) — proving both the section splitter and the citation regex work end to end.

**🩹 If it's off:** If `extract_references` returns an empty list, the `References` marker isn't a plain line — some papers underline or number it (`References` vs `REFERENCES`); try the case-insensitive `re.IGNORECASE` flag. If `citations_from` finds nothing, the paper uses author-year `(Smith, 2020)` citations instead of numeric brackets — that's a genuinely different grammar, and your regex *should* miss it, which is the lesson: know which citation scheme you're targeting. If dash-ranges `[4–7]` aren't expanding, that's the known TODO branch — `int("4–7")` will raise a `ValueError` that's your cue to implement range-expansion.

**✅ Checklist**

- ✅ `extract_references` returns the bibliography's opening lines, not body text.
- ✅ `citations_from` turns `[1, 2]` into `{1, 2}` and `[12]` into `{12}`.
- ✅ You can pair discussion of the numeric scheme vs author-year *before* promises of a universal parser.

**🤔 Socratic Question(s)**

- `findall`'s bracket pattern is greedy over commas: `[12, 34, 56]` yields one block that splits into three numbers. Rewrite in your head what a `[12, 34]` plus a separate `[5]` yields — and think about whether the order of numbers in the output list matches the order in the text when mixed single and multi-cite blocks appear. Does order matter for citation graph edges?
- The `{"References ..."}` splitter assumes "references block = everything after the marker." What happens to the parser if a paper puts an *Appendix* after its references — where does the appendix text land in `extract_references`, and what's the one extra rule that keeps it from polluting the bibliography?

## Step 5: A tiny ranked search over the parsed paper

Sections, citations, references — the engineered artifact is data, and data is only worth it if you can *ask* it questions. This last step builds a minimal ranked search: a query's words are scored by how often they appear in each section (term frequency), and sections are listed best-first. It's a toy, but it completes the pipeline from raw text to something you can actually interrogate.

**👟 Starter hint:** Start by writing `word_counts(body)` with a `[a-z]+` tokenizer and `Counter`, then `search(query, sections)` that scores each section by how many query tokens appear in it and sorts descending.

```python
# parser.py (continued)
from collections import Counter

TOK = re.compile(r"[a-z]+")

def word_counts(body: str) -> Counter:
    return Counter(TOK.findall(body.lower()))

def search(query: str, sections: dict[str, str], top: int = 3) -> list[tuple[str, int]]:
    q = set(TOK.findall(query.lower()))
    scored = []
    for name, body in sections.items():
        counts = word_counts(body)
        score = sum(counts[w] for w in q)
        if score:
            scored.append((name, score))
    return sorted(scored, key=lambda t: t[1], reverse=True)[:top]

for q in ["method data", "conclusion results"]:
    print(f"\nquery: {q!r}")
    for name, score in search(q, sections):
        print(f"   {score:>4}  {name[:50]}")
```

The mechanic is term frequency: tokenize the lowercased text into alphabetic words (`findall` then strip non-letters via `[a-z]+`), tag each section with its `Counter`, and score a section by how many query tokens appear in it. This is not TF-IDF (a common word like "data" isn't downweighted), and not ranked against other documents beyond a single paper — but it's the right *shape* of a search solution, and the `TOK` delimiter (drop anything non-letter so `data,` and `data` unify) is a real tokenization decision. The `if score` filter quietly drops sections with zero matches, so the top-K is honest about "best that *has* the term."

**🎯 Expected output:** For `"method data"`, the Methods section scores far above the others; `"conclusion results"` ranks Results and Conclusion high — the search's output visibly matches the paper's actual structure, which is the sanity check.

**🩹 If it's off:** If the top hit is the frontmatter for every query, sections are tiny or the body never got split — re-check Step 3's map (if the whole paper is one `frontmatter` bucket, nothing is ranked). If `"data"` returns nothing, the `[a-z]+` tokenizer chokes on a hyphenated or apostrophe'd form — that's expected; add `[a-z'-]+` to keep contractions intact, and note the trade. If a high-scoring section is missed, the query's words didn't intersect the section's tokens verbatim — a stemming gap (run/ran) you can acknowledge as the boundary between a toy and a search engine.

**✅ Checklist**

- ✅ `"method data"` ranks Methods first; `"conclusion results"` ranks Results/Conclusion high.
- ✅ Zero-match queries return an empty list (no NaN-score garbage).
- ✅ You can explain *one* limitation (no TF-IDF, no stemming, single-paper corpus) that a real engine fixes.

**🤔 Socratic Question(s)**

- The search is pure *term frequency* — repeated words win. Add "and" or "the" to a query and watch it dominate. What does IDF (the inverse-document-frequency half of TF-IDF) change about junk-common words, and why is it impossible to compute properly on a *single*-document corpus?
- Stemming (`run` == `ran`, `analysis` == `analys*`) is the line between "toy search" and "real search." Build the argument for *why* verbatim tokens still work surprisingly well on academic prose (papers reuse a surprisingly fixed vocabulary across the abstract→methods→results arc) — and the one section where it breaks first.

## ⚠️ Common pitfalls

- **Requiring every signal for a heading.** `numbered AND title-case AND short` rejects "Results and Discussion" — the shape detector's whole value is its *union* of signals. Expect a few short-prose false positives; bucket-in-sections discards them cleanly.
- **Hard-coding section names.** A list `{"Introduction", "Methods", ...}` breaks on "Experimental Setup" or "1. Preliminaries". Keep `known` as one *branch* of the predicate, never the whole detector.
- **Silent `errors="ignore"` data loss.** One corrupt byte can vaporize a line of text without a trace. Prefer `errors="replace"` (visible `�`) when you decode untrusted files so a bad decode is diagnosable instead of invisible.
- **Reliance on one citation grammar.** `[12, 3]`-numeric regex finds nothing in author-year `(Smith, 2020)` papers. Decide the scheme you're targeting up front; a parser that "handles both" silently usually handles the second as empty output.
- **Bibliography bleed from an appendix.** "References = everything after the marker" silently swallows an Appendix. Stop the block at the next heading (reuse `is_heading`) or at a page-break token so post-bibliography prose can't pollute the reference list.

## What you just built

A genuine research-paper parser in pure Python: you detected headings by *shape* instead of a hard-coded list, folded the paper into a queryable `{section: text}` map, extracted numeric citations and a reference block, and ranked sections against a phrase query with term frequency. Two habits here are worth more than the parser itself — the *look-before-you-code* inspection that anchors your heuristics to real data, and the understanding that "the interesting part of parsing is knowing what grammar you're actually targeting." Pipelines like this underlie reference managers, review tools, and literature-mining systems; you've built the honest core of one without a single PDF library.

:::tip[Run a fuller version without any local setup]
[`examples/research-paper-parser/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/research-paper-parser) in the course repo bundles the parser module, a sample plain-text paper, and a notebook that loads, splits, cites, and searches inline. Clone the repo, or open it in a [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and watch the pipeline run start to finish.
:::

## Where to go from here

- **Handle dash-ranges:** expand `[4–7]` into `{4,5,6,7}` with a small `re.split(r"\s*[–-]\s*")` + `range()` — the flagged TODO from Step 4.
- **Author-year support:** add a second citation regex for `(Smith, 2020)` and a name→reference resolver; the same `references` block maps to a *name-keyed* dict.
- **A CLI:** wrap the pipeline in `argparse` (`parse.py paper.txt --search "neural method"`) so it works as a shell tool instead of a pasted snippet.
- **Stop at the appendix:** make `extract_references` end at the next heading, reusing `is_heading`, so post-bibliography text never pollutes the reference list.

## Share your project with the class

Parsed a paper, built a citation graph, or got a search ranking you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README walks through adding yours via a **pull request** from start to finish: forking, branching, committing, and opening the PR. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓