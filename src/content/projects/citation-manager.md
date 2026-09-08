---
title: "Build a Citation Manager"
description: "A bibliography toolkit in Python: a dict-of-dicts citation store, APA-style formatting, cross-field search, a missing-and-unused references checker using set arithmetic, near-duplicate detection by normalized title, type counts, and a References section generator with JSON persistence."
difficulty: "intermediate"
estimatedMinutes: 75
xpReward: 100
tags: ["Science", "Productivity", "Utility"]
prerequisites:
  - "Nested dictionaries and string methods"
  - "Sets and list comprehensions"
  - "Reading and writing JSON files"
learningObjectives:
  - "Model a bibliography as a dict of entry dicts with stable keys"
  - "Format entries into consistent APA-style text with one function"
  - "Search across authors, titles, and venues with substring matching"
  - "Find missing and unused references with set difference"
  - "Detect near-duplicates by normalized title and generate a sorted References section"
---

# 🛠️ 📚 Build a Citation Manager

Papers don't write themselves — but the bibliography can almost do it. This project builds a small **citation manager**: a store of bibliographic entries (key → author/title/year/venue/type), a formatter that turns any entry into one consistent APA-ish line, a search that works across authors, titles, and venues, a *missing-and-unused* checker built on set difference that finds reference-list mistakes before a reviewer does, near-duplicate detection that catches the same book entered twice with different casing, type counts, and a final generator that sorts the whole library by year-and-author and writes a `References` section plus a JSON backup. Everything is deterministic — small, hand-curated data, no randomness, pure standard library.

This assumes nested dicts, sets, comprehensions, and basic JSON. It is an optional, ungraded project — see [Real-World Projects](/projects) for the full, growing list. One file, standard-library only.

## 🎯 What you'll do

1. Build the bibliography store and an APA formatter.
2. Search the store across author, title, and venue.
3. Check a manuscript's in-text citations for missing and unused keys.
4. Detect near-duplicate entries and tally types.
5. Generate a year-and-author sorted References section and persist it to JSON.

## Where to run this

Anywhere Python 3.10+ runs — locally, Colab, Kaggle, or Binder. The whole project is `json` + built-ins, so there's nothing to install and no environment difference.

```bash
mkdir citation-manager && cd citation-manager
touch citations.py
```

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/citation-manager/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/citation-manager/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcitation-manager%2Fnotebook.ipynb)

## Setup

Zero dependencies: just confirm the interpreter and create the file.

### Check the environment

```bash
python3 --version
```

**✅ Checklist**

- ✅ `python3 --version` shows 3.10+.
- ✅ `citations.py` exists; `import json` and `import itertools` work.
- ✅ No `pip install` — this is the standard library doing the work.

**🤔 Socratic Question(s)**

- A bibliography is a *mapping*: you cite `[knuth1984]` in the text and the References section expands it. Where in this project is the dict the right shape, and where would a plain list lose information?
- The manager formats entries itself. Why is a *single* formatting function better than hand-writing each reference line — and what risk does that abstraction introduce when a venue changes style mid-project?

## Step 1: The bibliography store

Start with the data model: a dict whose keys are citation handles (`shannon1948`) and whose values are entry dicts.

### 1.1 The entries

**👟 Starter hint:** A dict of six entries, each with `authors`, `title`, `year`, `venue`, `type`.

```python
# citations.py
import json
import itertools

bib = {
    "knuth1984": {"authors": "Donald E. Knuth", "title": "The TeXbook",
                  "year": 1984, "venue": "Addison-Wesley", "type": "book"},
    "turing1950": {"authors": "Alan M. Turing", "title": "Computing machinery and intelligence",
                   "year": 1950, "venue": "Mind 59 (236)", "type": "article"},
    "shannon1948": {"authors": "Claude E. Shannon", "title": "A mathematical theory of communication",
                    "year": 1948, "venue": "Bell System Technical Journal", "type": "article"},
    "hopper1978": {"authors": "Grace M. Hopper", "title": "The education of a computer",
                   "year": 1978, "venue": "IEEE Transactions on Computers", "type": "article"},
    "ritchie1974": {"authors": "Dennis M. Ritchie; Ken Thompson", "title": "The UNIX time-sharing system",
                    "year": 1974, "venue": "Communications of the ACM", "type": "article"},
    "lamport1994": {"authors": "Leslie Lamport", "title": "LaTeX: A Document Preparation System",
                    "year": 1994, "venue": "Addison-Wesley", "type": "book"},
}
```

The handle is how the manuscript cites a source; the entry carries the bibliographic facts. That separation — *stable key* vs *mutable data* — is what keeps a re-format or a search from breaking every citation in the text.

**🎯 Expected output:** None yet — data only. Sanity-check the shape: all six entries have the same five fields.

**🩹 If it's off:** A missing `venue` on one entry won't crash *here* but will later format as `None` — review the dicts before moving on.

### 1.2 One formatter, all entries

**👟 Starter hint:** `format_apa(entry)` → `"{authors} ({year}). {title}. {venue}."`, looped over `bib`.

```python
# citations.py (continued)
def format_apa(entry):
    return f"{entry['authors']} ({entry['year']}). {entry['title']}. {entry['venue']}."

for key, entry in bib.items():
    print(f"[{key:>10}] {format_apa(entry)}")
```

Every citation becomes exactly one line from one function. Change the style (APA → MLA) in one place and the whole bibliography follows.

**🎯 Expected output:**

```
[ knuth1984] Donald E. Knuth (1984). The TeXbook. Addison-Wesley.
[turing1950] Alan M. Turing (1950). Computing machinery and intelligence. Mind 59 (236).
[shannon1948] Claude E. Shannon (1948). A mathematical theory of communication. Bell System Technical Journal.
[hopper1978] Grace M. Hopper (1978). The education of a computer. IEEE Transactions on Computers.
[ritchie1974] Dennis M. Ritchie; Ken Thompson (1974). The UNIX time-sharing system. Communications of the ACM.
[lamport1994] Leslie Lamport (1994). LaTeX: A Document Preparation System. Addison-Wesley.
```

**🩹 If it's off:** If the case of `abecedarian` order differs, no sort is happening yet — this is insertion order (line order of the dict). If a line shows `None`, that entry is missing the `venue` key.

### 1.3 Verify the store

**✅ Checklist**

- ✅ Six entries, each with `authors`, `title`, `year`, `venue`, `type`.
- ✅ Three turns into six formatted lines — one function, five fields, no duplication.
- ✅ Handles are stable identifiers; data can change without breaking citations.

**🤔 Socratic Question(s)**

- `format_apa` prints the year in parentheses *inside* the string with `(entry['year'])`. What would break if `year` were an int every time *except* one entry stored as a string `"1984"`? Design one cast that repairs all entries.
- Two-author works are stored as `"Dennis M. Ritchie; Ken Thompson"` — one string with a separator. Where does that split convention start to leak through the formatter, and what would a proper `authors: [list]` model buy you?

## Step 2: Search across the store

Find a citation knowing only *something* about it — an author, a word in the title, a venue, a year.

### 2.1 The substring search

**👟 Starter hint:** `search(query)` returns every key whose entry contains the query (case-insensitive) in author, title, venue, or exactly the year.

```python
# citations.py (continued)
def search(query):
    q = query.casefold()
    hits = []
    for key, entry in bib.items():
        haystack = " ".join([
            entry["authors"], entry["title"], entry["venue"],
            str(entry["year"])]).casefold()
        if q in haystack:
            hits.append(key)
    return hits

print("search('turing')      ->", search("turing"))
print("search('addison')     ->", search("addison"))
print("search('1984')        ->", search("1984"))
```

Joining all fields into one lowercase haystack means one substring test covers every field with a single line of logic — the query appears in *any* field and it matches. Case-folding makes `unix` equal to `UNIX`.

**🎯 Expected output:**

```
search('turing')      -> ['turing1950']
search('addison')     -> ['knuth1984', 'lamport1994']
search('1984')        -> ['knuth1984']
```

**🩹 If it's off:** If `search('UNIX')` returns `[]`, `casefold()` was applied to the query only. If `search('1984')` matches a title containing "1984" *and* the real year, the haystack string-joins fields — decide whether year should match exactly or as substring (here: substring).

### 2.2 Understand the hits

**👟 Starter hint:** Print APA lines for the results of a query.

```python
# citations.py (continued)
for key in search("addison"):
    print(f"[{key:>10}] {format_apa(bib[key])}")
```

`search('addison')` returning two results is a teaching moment: "Addison" is a *publisher*, and it appears in the `venue` of both books. A keyword search can't tell author from publisher from year — it just finds text.

**🎯 Expected output:**

```
[ knuth1984] Donald E. Knuth (1984). The TeXbook. Addison-Wesley.
[lamport1994] Leslie Lamport (1994). LaTeX: A Document Preparation System. Addison-Wesley.
```

**🩹 If it's off:** If the loop prints more or fewer lines than `search` reported, the search function and this loop differ — reuse `search`, don't re-type its logic.

### 2.3 Verify the search

**✅ Checklist**

- ✅ Case-insensitive matches across author, title, and venue.
- ✅ `search('addison')` → two books (publisher match), `search('1984')` → Knuth only.
- ✅ Search is a pure function of `bibliography` + query — same store, same hits.

**🤔 Socratic Question(s)**

- The query is a *substring*: `'a'` matches nearly everything, `'e'` even more. What kind of corpus would make full-text matching useless, and what two-command upgrade (e.g. field-scoped `author:knuth`) would fix it?
- Joining fields into one haystack loses *where* the match happened. How would you extend `search` to return `(key, field)` pairs — and why might a bibliography manager want to report "matched in venue" vs "matched in title"?

## Step 3: Check every in-text citation

The reference list must contain every work cited, and nothing cited can be missing from the store. Set arithmetic does this in two lines.

### 3.1 Missing and unused

**👟 Starter hint:** A manuscript cites `in_text`; compute `missing = cited − stored` and `unused = stored − cited`.

```python
# citations.py (continued)
in_text = ["knuth1984", "turing1950", "shannon1948", "hopper1978",
           "lamport1994", "smith2021"]

missing = sorted(set(in_text) - set(bib))
unused = sorted(set(bib) - set(in_text))
print("MISSING (cited but no entry) :", missing)
print("UNUSED  (stored but not cited):", unused)
```

`set(in_text) - set(bib)` is "citations without a home" — `smith2021` is in the text but not in the store. `set(bib) - set(in_text)` is "stored entries never mentioned" — `ritchie1974` sits in the library but no sentence cites it. Meetings that `@staticmethod` Socratic-style you into re-checking: one line each way, and the reviewer's favorite finding (a missing reference) jumps out.

**🎯 Expected output:**

```
MISSING (cited but no entry) : ['smith2021']
UNUSED  (stored but not cited): ['ritchie1974']
```

**🩹 If it's off:** If `missing` and `unused` are swapped, the subtraction order got flipped — first operand is "what we have", second is "what we want". If `smith2021` doesn't appear, the manuscript list and the store use inconsistent handles (typos) — normalize keys before diffing.

### 3.2 The fix

**👟 Starter hint:** Add the missing entry, then re-verify both directions report empty.

```python
# citations.py (continued)
bib["smith2021"] = {
    "authors": "Barbara J. Smith", "title": "Design patterns for tiny data pipelines",
    "year": 2021, "venue": "Journal of Small Systems", "type": "article"}

missing = sorted(set(in_text) - set(bib))
unused = sorted(set(bib) - set(in_text))
print("MISSING after fix :", missing)
print("UNUSED  after fix :", unused)
```

Adding the entry re-balances the sets: `smith2021` now resolves, so `missing` is empty. `ritchie1974` remains unused — a real finding: the library holds a source the manuscript never mentions (either cite it properly or remove it).

**🎯 Expected output:**

```
MISSING after fix : []
UNUSED  after fix : ['ritchie1974']
```

**🩹 If it's off:** If `UNUSED` still lists `smith2021`, the entry key and the in-text handle differ by case or spacing — make `set(in_text)` and `set(bib)` share one normalization. If the fix silently swallowed the old `missing`, the `bib["smith2021"]` assignment landed after the re-check (order!).

### 3.3 Verify the checker

**✅ Checklist**

- ✅ Missing (smith2021) and unused (ritchie1974) found in one diff each.
- ✅ After registering smith2021, `missing` is empty and `unused` is just `['ritchie1974']`.
- ✅ `missing`/`unused` never overlap — a layout bug (like diffing two copies of `bib`) is impossible once the sets are distinct.

**🤔 Socratic Question(s)**

- `set` order is arbitrary for a list of strings; you sorted both results. Why does *sorting* the report matter for a human reader, and where would sorted output actually mislead (e.g. sorting by year of discovery, not handle)? 
- "Unused entry" can mean "not yet cited" or "obsolete junk." What side effect would a *removed* unused entry have on the next run — and why is a lint-style warning (never auto-delete) the safer tool behavior?

## Step 4: Clean duplicates and tally types

Reference lists quietly double up — the same book entered twice with slightly different fields. Step 4 normalizes titles to catch it and counts types.

### 4.1 A near-duplicate

**👟 Starter hint:** Feed the store one book that already exists under a second handle with different casing/edition.

```python
# citations.py (continued)
duplicates = {
    "lamport1994": {"authors": "Leslie Lamport", "title": "LaTeX: A Document Preparation System",
                    "year": 1994, "venue": "Addison-Wesley", "type": "book"},
    "lamport94": {"authors": "L. Lamport", "title": "LaTeX: a document preparation system",
                  "year": 1994, "venue": "Addison-Wesley Pub.", "type": "book"},
}

def norm_title(title):
    return " ".join(title.casefold().split())

dups = []
for a, b in itertools.combinations(duplicates, 2):
    if norm_title(duplicates[a]["title"]) == norm_title(duplicates[b]["title"]):
        dups.append((a, b))
print("NEAR-DUPLICATES:", dups)
```

`norm_title` whitens and case-folds a title — `"LaTeX: A Document Preparation System"` and `"LaTeX: a document preparation system"` become the same string, so the two handles are flagged as one work. A raw equality test would miss this because of the case difference; normalisation is what makes "near" into "identical".

**🎯 Expected output:** `NEAR-DUPLICATES: [('lamport1994', 'lamport94')]`

**🩹 If it's off:** If no pair is flagged, the normalizer didn't run (compare raw titles — case differs). If *more* pairs than one are flagged, `itertools.combinations(…, 2)` iterated over a store that already contains the dupes — test on the small `duplicates` dict, not on `bib`.

### 4.2 Tail the types

**👟 Starter hint:** Count entries per `type` with a dict-as-histogram.

```python
# citations.py (continued)
types = {}
for entry in bib.values():
    types[entry["type"]] = types.get(entry["type"], 0) + 1
print("BY TYPE:", types)
```

A type histogram is a one-line inventory: how many articles vs books make up your method section. `get(type, 0) + 1` is the counter-idiom you saw in the carbon tracker — first sighting starts at zero.

**🎯 Expected output:** `BY TYPE: {'book': 2, 'article': 4}`

**🩹 If it's off:** If books tallied 3, a dup entry slipped into `bib` — the very problem Step 4 exists to catch. If the count is a constant (`{'book': 1}`), the loop updates same key each pass instead of per-entry.

### 4.3 Verify the cleanup

**✅ Checklist**

- ✅ `lamport1994` vs `lamport94` flagged as near-duplicates by normalised title.
- ✅ Type histogram `{'book': 2, 'article': 4}`.
- ✅ Normalization (casefold + whitespace) is the *reason* both pairs and per-type totals agree.

**🤔 Socratic Question(s)**

- `norm_title` folds case and spaces but not punctuation — `"The UNIX Operating System"` vs `"The UNIX Operating System."` would NOT match. Which two normalizers would make them match, and what "false friend" couple would they now wrongly merge?
- Year is not part of the duplicate check. Two different *editions* of a book truly are different entries, yet they'd have near-identical titles. How would you let "same title, different year" pass — and when should a *newer edition* CTL-replace the old one automatically?

## Step 5: Generate the References section

The deliverable: a sorted reference list on screen, in a file, and a JSON backup of the store.

### 5.1 Sort by year, then author

**👟 Starter hint:** `sorted(bib, key=lambda k: (bib[k]["year"], bib[k]["authors"].casefold()))`, numbered.

```python
# citations.py (continued)
order = sorted(bib, key=lambda k: (bib[k]["year"], bib[k]["authors"].casefold()))
for i, key in enumerate(order, start=1):
    print(f"{i:>2}. {format_apa(bib[key])}")
```

Sorting by `year` first, author second, mimics a typical reference-list order (chronological, ties broken alphabetically). The stable key survives sorting — entries are never copied out of place.

**🎯 Expected output:**

```
 1. Claude E. Shannon (1948). A mathematical theory of communication. Bell System Technical Journal.
 2. Alan M. Turing (1950). Computing machinery and intelligence. Mind 59 (236).
 3. Dennis M. Ritchie; Ken Thompson (1974). The UNIX time-sharing system. Communications of the ACM.
 4. Grace M. Hopper (1978). The education of a computer. IEEE Transactions on Computers.
 5. Donald E. Knuth (1984). The TeXbook. Addison-Wesley.
 6. Leslie Lamport (1994). LaTeX: A Document Preparation System. Addison-Wesley.
```

**🩹 If it's off:** If dates are problems (1948 after 1984), `year` was sorted as a *string* — cast to int or compare numerically. If authors within a year differ, the tie breaker on `authors.casefold()` didn't run.

### 5.2 Persist and reload

**👟 Starter hint:** Write the reference lines to `references.txt` and the store to `bib.json`, then reload the store and prove `len` and keys survive.

```python
# citations.py (continued)
with open("references.txt", "w") as f:
    for key in order:
        f.write(format_apa(bib[key]) + "\n")

with open("bib.json", "w") as f:
    json.dump(bib, f, indent=2)

loaded = json.load(open("bib.json"))
print("bib.json round-trip:", len(loaded), "entries,",
      "keys match" if sorted(loaded) == sorted(bib) else "KEYS MISMATCH")
```

`references.txt` is the human deliverable (a References section as plain text). `bib.json` is the machine deliverable — the whole store serialised so the next session can reload it unchanged instead of re-typing entries. JSON turns the nested dict into portable text and back.

**🎯 Expected output:**

```
bib.json round-trip: 7 entries, keys match
```

…and `references.txt` containing the six sorted lines from 5.1 — plus `bib.json` restored with 7 entries (the six originals and `smith2021`).

**🩹 If it's off:** If the round-trip reports fewer entries, JSON silently dropped an entry whose value wasn't JSON-serialisable (e.g. a `datetime`). If `keys match` prints a mismatch, the reloaded keys differ in order or spelling — compare as sets, order in a JSON object is preserved in practice but never guaranteed.

### 5.3 Verify the deliverable

**✅ Checklist**

- ✅ Reference list sorted by year, then author — Shannon 1948 first, Lamport 1994 last.
- ✅ `references.txt` has 6 clean lines; `bib.json` reloads to 7 entries with matching keys.
- ✅ The same `format_apa` produced every line — screen, file, and JSON never disagree.

**🤔 Socratic Question(s)**

- The References section sorted chronologically — but many journals sort *alphabetically* by author. Which single line would switch the policy to alphabetical, and why does the *formatter* stay untouched either way?
- `json.dump(bib, f, indent=2)` reorders nothing but the file grows bigger. Round-trips that share `sorted(…) == sorted(…)` hide order; how would you version-stamp `bib.json` (e.g. a `"schema": 2` field) so a future load can reject an incompatible file cleanly?

## ⚠️ Common pitfalls

- **Keys vs data.** The handle identifies the work; the entry describes it. Editing the *key* on a rename breaks in-text citations; editing the *fields* never does. Keep keys stable.
- **Case in matching.** `search` and `norm_title` must both `casefold()`. Raw `in` on mixed-case titles makes every near-duplicate and half your searches miss.
- **Sorted vs insertion order.** `dict` insertion order is nice but not a *policy*; the References section sorts explicitly by `(year, author)`. Don't rely on dict order to be the sort.
- **Set differences in the right direction.** `set(in_text) - set(bib)` = cited-but-unstored (missing), the reverse = unused. One swapped direction and you report phantom entries instead of missing ones.
- **String years sort wrong.** `"1978" < "1948"` as *strings* is `False` — cast years to `int` (or pad) before sorting chronologically.
- **Near-duplicates need a basin of comparison.** Checking each entry against a hand-written "list of known titles" misses pairs *within* the store — use `itertools.combinations(keys, 2)` over the stored titles.

## What you just built

A citation manager that goes from raw bibliographic facts to a reviewer-proof reference list: a dict-of-dicts store with stable handles, one `format_apa` function that owns the style, cross-field substring search, a two-line set-difference health check that finds missing and unused citations before a human does, normalised-title duplicate detection, a type histogram, and a year/author sorted generator that writes both a human `References` file and a JSON backup. The ideas transfer way beyond bibliographies: **keep stable identifiers separate from mutable records**; **let a single formatter own every rendering**; **normalise before comparing**; and **make the health check a set difference** — the same three patterns run employee directories, package manifests, and translation caches.

:::tip[Run a fuller version without any local setup]
[`examples/citation-manager/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/citation-manager) in the course repo is the complete manager as a notebook — store, formatter, search, missing/unused checks, dedupe, and the sorted References + JSON round-trip, runnable in Colab/Kaggle/Binder. Clone the repo or [open it in a Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Where to go from here

- Load a real BibTeX `.bib` file instead of typing entries — parse `@article{key, field = value}` lines and feed them into `bib`.
- Add field-scoped search (`author:knuth`, `year:1974`) returning `(key, field)` pairs instead of a joined haystack.
- Implement **"convert to MLA"**: a second formatter and a `style` parameter on `format_apa` — proving the style decision is isolated in one place.
- Rank journals: histogram `venue` values and surface which outlets your references lean on.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓