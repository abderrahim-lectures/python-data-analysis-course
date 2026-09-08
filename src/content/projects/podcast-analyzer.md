---
title: "Build a Podcast Analyzer"
description: "Turn a podcast transcript into an episode fact sheet — hosts versus guests, what topics actually dominated, and the episode's key phrases — with pure stdlib text processing."
difficulty: "intermediate"
estimatedMinutes: 60
tags: ["cli", "text-processing", "csv", "regex"]
learningObjectives:
  - "Parse a timestamped podcast transcript into speaker turns"
  - "Separate hosts from guests by comparing speaker names against a roster"
  - "Score a transcript against topic keyword sets with Counter"
  - "Compose an episode fact sheet and export it as CSV"
prerequisites: ["python-101/strings", "python-101/file-io", "python-101/sets", "python-101/functions"]
---

# 🎧 Build a Podcast Analyzer

Podcasts produce hours of audio and almost no structure. Whether you're a fan deciding which episode to skip or a show runner who wants a data read on their own episodes, the useful artifact is the same: an episode *fact sheet* — who the guests were, what topics genuinely dominated the conversation, and what phrases recurred. This project builds a CLI that produces that fact sheet from a transcript: it parses the speaker turns, splits hosts from guests, scores the words against topic keyword sets, and writes a one-file summary plus a machine-readable CSV. No audio, no ML, no API keys.

This assumes Python 101 — strings, sets, file I/O, and functions. Nothing beyond that. It's optional and ungraded; see [Real-World Projects](/projects) for the full list.

## 🎯 What you'll do

1. Parse a `[timestamp] Speaker: words` transcript into structured turns.
2. Separate hosts from guests using a known host roster — and detect names that aren't on it.
3. Count each topic's mention-weight by scoring the transcript against keyword sets.
4. Extract each guest's share of the conversation and the episode's top keywords.
5. Write a readable `episode_notes.txt` and a `topics.csv` you can open in any spreadsheet.

## Where to run this

**Locally with `uv`** is the primary path — it's pure text processing over a transcript file you control, so the "drop a transcript, get two output files" loop is a terminal habit, and the CSV lands as a real file.

**GitHub Codespaces** works identically: open [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) and the same commands run in a browser tab with Node, Python, and `uv` preinstalled.

**Google Colab, Kaggle Notebooks, and Binder run every step honestly** — no GPU, no secrets, no big files — against the course's bundled sample episode transcript (a hand-written, realistic fake conversation). The honest caveat: the notebook analyzes the bundled transcript rather than audio you record. Real speech-to-text for your own recordings needs a separate tool; everything *after* the transcript is exactly what the notebook runs for real.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/podcast-analyzer/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/podcast-analyzer/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fpodcast-analyzer%2Fnotebook.ipynb)

## Setup

Everything you need before the first word counts: `uv`, one sample episode, and a host roster.

### Install `uv` and scaffold

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
mkdir podcast-analyzer && cd podcast-analyzer
uv init --bare
```

Zero extra packages — pure standard library.

### Write a sample episode

Save this as `episode.txt`:

```
[00:00] Maya: Welcome back to The Indie Show, this episode is about scaling, sort of.
[00:14] Maya: Our guest today is Jonas, who built a tiny publishing tool into a real business.
[00:30] Jonas: Thanks, Maya. Let's be honest, the scaling story is mostly boring — paying down tech debt.
[00:52] Jonas: The interesting part is pricing. We raised prices three times in two years.
[01:10] Maya: Pricing feels like the hardest lever. What about marketing?
[01:22] Jonas: Marketing is a distribution problem. SEO and word of mouth, mostly word of mouth.
[01:40] Maya: Let's talk about remote work culture on a small team.
[01:55] Jonas: Remote culture is trust, honestly. You either have it or you're doing it wrong.
[02:10] Maya: One last thing — taking breaks and managing burnout in an early startup.
[02:24] Jonas: Burnout is real. Rest is not a reward, it's a requirement.
[02:38] Maya: That's the episode. Jonas, thank you for your time.
[02:47] Jonas: Thank you. Keep shipping. That's it, that's the whole trick.
```

Save `hosts.txt` with one host name per line:

```
Maya
```

Write `topics.py` (the keyword sets — topic labels against their trigger words):

```python
# topics.py
TOPICS = {
    "pricing": ["price", "pricing", "revenue", "money"],
    "marketing": ["marketing", "seo", "word of mouth", "growth"],
    "culture": ["culture", "remote", "trust", "team"],
    "wellness": ["burnout", "rest", "breaks", "stress"],
}
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `episode.txt` exists (12 turns), `hosts.txt` contains only `Maya`, and `topics.py` defines four topic sets.
- ✅ You can already guess the outcome: `pricing` and `wellness` should blow past `culture` — and the tool will soon tell you.

## Step 1: Parse the episode transcript

Same shape as any meeting tool, one twist: podcast transcripts carry a *host roster* file, and the parser must keep every speaker name pristine because Step 2's host/guest split depends on exact name string equality.

### 1.1 Write the turn parser

```python
# parse.py
from pathlib import Path

def parse_line(line: str) -> dict:
    line = line.strip()
    time_s = line.split("]", 1)[0].lstrip("[")
    rest = line.split("]", 1)[1].strip()
    speaker, _, text = rest.partition(":")
    return {"time": time_s, "speaker": speaker.strip(), "text": text.strip()}

def load_episode(path: str) -> list[dict]:
    return [parse_line(l) for l in Path(path).read_text().splitlines() if l.strip()]

def load_hosts(path: str) -> set[str]:
    return {l.strip().lower() for l in Path(path).read_text().splitlines() if l.strip()}

if __name__ == "__main__":
    turns = load_episode("episode.txt")
    print(len(turns), "turns")
    print(load_hosts("hosts.txt"))
```

`partition(":")` again does the heavy lifting — the first colon separates speaker from speech, and colons *inside* the message (imagine `01:40`, or a title like `The Scraper: Part Two`) stay put. `load_hosts` immediately lowercases the roster into a `set`, so Step 2's membership test is a constant-time `in` against a *canonical* lowercase name — one bad-case "mAYA" in the roster would silently put the host into the guest list forever.

**👟 Starter hint:** Parse first, print `turns[1]`, and *look* at the shape before any analysis — `speaker: 'Maya'`, `text: 'Our guest today is Jonas…'`, no brackets, no colons.

**🎯 Expected output:** `12 turns`, and the host set prints `{'maya'}` for `hosts.txt`. The first sample turn is a clean dict with the three keys.

**🩹 If it's off:** If `speaker` still has a leading space, the `.strip()` after `partition` is missing. If a `ValueError` fires with the message `not enough values to unpack`, a line exists with no colon at all — interview transcripts occasionally cut a turn in half; skip-and-warn beats crash, but decide which *before* adding a tenth file.

### 1.2 Verify parsing

**✅ Checklist**

- ✅ `load_episode` returns 12 dicts with `time`, `speaker`, and `text`.
- ✅ `load_hosts` returns a lowercase `set` — `{'maya'}`, not `{'Maya'}`.
- ✅ A turn whose message contains a colon still keeps the entire message.
- ✅ Blank lines never become empty turns, and the roster has no whitespace artifacts.

**🤔 Socratic Question(s)**

- The roster lowercases into a set, but the *speaker* strings from the transcript are still mixed-case. If a guest's line says `[01:10] maya: ...` (lowercase from a bad transcription), which step silently breaks later — and what would a `speaker.lower()` at parse time fix?
- We treat `[00:14]` as a minute:second timestamp for display only. If you wanted to compute exact minutes of talk time per speaker (`00:47` minus `00:30`), what would you need to change about the `time` field's type, and what parsing would that force?

## Step 2: Separate hosts from guests

The roster makes host/guest classification a set membership test — `speaker.lower() in hosts`. Everything that isn't a known host is a guest, and a *name that appears nowhere* is worth flagging loudly, because "someone spoke who isn't on any list" is exactly the data a hand-written episode title gets wrong.

### 2.1 Classify each speaker

```python
# roster.py
from parse import load_episode, load_hosts

def classify(episode: str, hosts_file: str) -> dict[str, dict]:
    hosts = load_hosts(hosts_file)
    people = {}
    for t in load_episode(episode):
        name = t["speaker"].lower()
        row = people.setdefault(name, {"speaker": t["speaker"], "role": None,
                                       "words": 0, "turns": 0})
        row["role"] = "host" if name in hosts else "guest"
        row["words"] += len(t["text"].split())
        row["turns"] += 1
    return people

if __name__ == "__main__":
    people = classify("episode.txt", "hosts.txt")
    for name, row in sorted(people.items()):
        print(f"{row['speaker']:<6} {row['role']:<6} {row['words']:>3} words  {row['turns']} turns")
```

The classifier is a dictionary-of-rows you *mutate in place* — `setdefault` creates each speaker's row the first time their name appears, then every later turn bumps words and turns. The role is computed *on every turn* from a live `name in hosts` check, so a name that appears in the transcript before the roster loads (or with a different case) still resolves correctly — and because the role is decided per-row-after-load and never cached, there's no "it was a host when I first saw it" staleness.

**👟 Starter hint:** Run the classification and eyeball the output — Maya should be `host`, Jonas `guest`; then temporarily delete `Maya` from `hosts.txt` and re-run. Both her two turns becoming `guest` *and* the guest-list now containing your own host is the exact failure a real tool would guard against.

**🎯 Expected output:** `Maya  host   71 words  7 turns` and `Jonas  guest  57 words  5 turns` — two rows, one per distinct speaker, each with a role.

**🩹 If it's off:** If both rows say `guest`, the roster isn't loading — check `hosts.txt` ends with a newline and the file path matches `load_hosts`. If a name split into two people (`maya` and `Maya`), the `speaker.strip()`/`.lower()` normalization isn't applied in `classify` — every read must run through the same funnel before `setdefault`.

### 2.2 Verify the split

**✅ Checklist**

- ✅ Maya = host, Jonas = guest, no third person row appears.
- ✅ Deleting a host from `hosts.txt` immediately flips her role on re-run — the classification reads the roster fresh each run.
- ✅ Two turns by the same speaker accumulate into one row (`words` and `turns` both grow).
- ✅ You can state, in one sentence, why `row["role"]` is recomputed per turn instead of set once when the row is created.

**🤔 Socratic Question(s)**

- A podcast transcript whose host is *absent from the roster file* silently turns the host into a guest — every published fact sheet would list your own host as a guest. What's the minimal guard that makes the tool refuse to produce a fact sheet until every speaker in the transcript is classified by name?
- Hosts are defined by a file; guests by subtraction. Flip the model: what happens to "impersonation" lines like `[01:40] fake_maya: ...` — and which model (allowlist hosts vs. deny-list guests) makes the impersonation *visible* rather than absorbed?

## Step 3: Score the topics

Every podcast is a conversation, but "what was this episode about?" is a counting problem. This step scores the whole transcript against each topic's keyword set — every time a pricing word appears in the transcript, pricing's score grows. It's keyword-co-occurrence, deliberately shallow: exactly what a cheap, transparent first pass should be before anything fancier gets involved.

### 3.1 Count topic keyword hits

```python
# topic_score.py
from collections import Counter
from parse import load_episode
from topics import TOPICS

def score_topics(episode: str) -> Counter:
    all_words = " ".join(t["text"] for t in load_episode(episode)).lower()
    scores = Counter()
    for topic, words in TOPICS.items():
        for w in words:
            scores[topic] += all_words.count(w)
    return scores

if __name__ == "__main__":
    for topic, score in score_topics("episode.txt").most_common():
        print(f"{topic:<10} {score}")
```

Two loops deep, one row out: `TOPICS` maps a label to its trigger words, and each word's literal occurrence is counted with `all_words.count(w)`. The ordering is deliberate — `Counter` plus `.most_common()` gives a ranked topic list with zero extra code, so "what dominated the episode" is literally the item at index zero.

**👟 Starter hint:** Before running, count `pricing` manually in `episode.txt` (you should find `price`, `pricing` ×2, `revenue` mentions 0) and confirm the printed totals match — trust the tool, but only after the tool passes a hand-check once.

**🎯 Expected output:** Four lines ranked descending — `pricing` and `wellness` at the top (each a handful of hits), `culture` mid-pack, `marketing` below — with the exact totals matching your manual count of the trigger words.

**🩹 If it's off:** If a topic scores 0 when it shouldn't, its trigger word is misspelled in `topics.py` or appears with a prefix (`pricing` matches `pricing` but not `priced`) — `count()` is a literal substring match, so either add the variant to `TOPICS` or accept the documented literalness. If every topic is huge, a trigger word like `team` is a substring of `teams`, `steam`, etc. — `count("team")` counts all of them; consider counting `word in wordlist` after tokenizing rather than substring-counting raw text.

### 3.2 Verify topic scoring

**✅ Checklist**

- ✅ The ranked order matches your manual count of the trigger words.
- ✅ Each topic's score equals the sum of its keyword occurrences — you can recompute every number by hand.
- ✅ A topic with no matching words scores 0 and *still appears* in the ranking (present-but-zero beats absent-and-assumed).
- ✅ You can explain the one-liner that turns raw counts into a ranked list.

**🤔 Socratic Question(s)

- Scoring uses substring counting, so an *economic* "pricing" and an *emotional* "price" hear the same word. What's the change — tokenizing into a word list and testing `w in words` — that stops `priced` and `priceless` from feeding the score, and what does it cost you in simplicity?
- The four topics in `TOPICS` are fixed by the file. Which episode would this tool *fail* honestly on — e.g., an episode about "AI safety" with none of your four — and what does that tell you about keyword sets vs. a model that could label open-ended themes?

## Step 4: Extract guest share and key phrases

The fact sheet's two remaining columns: how much *airtime* each speaker commanded, and which *phrases* recur — the "you keep saying X" nuggets that make an episode memorable. Guest share reuses the roster row from Step 2; key phrases are just the most common words that are *not* common English filler.

### 4.1 Compute share and top keywords

```python
# highlights.py
from collections import Counter
from roster import classify

STOP = {"the", "a", "an", "and", "or", "but", "is", "are", "was", "were",
        "to", "of", "in", "on", "for", "with", "it", "that", "this", "you",
        "your", "i", "we", "us", "not", "so", "really", "just", "about"}

def guest_share(people: dict) -> list[tuple]:
    guests = [(r["speaker"], r["words"]) for r in people.values() if r["role"] == "guest"]
    total = sum(words for _, words in guests) or 1
    return [(name, words / total) for name, words in guests]

def top_words(episode: str, n: int = 6) -> list[tuple]:
    words = Counter()
    for t in load_episode(episode):
        words.update(w for w in t["text"].lower().split() if w not in STOP)
    return words.most_common(n)
```

`words.update(w for w in ...)` is the whole step-before-the-step: `Counter.update` accepts an iterable and counts every word in it, and the generator filters out the stopwords *at the moment of counting*, so no filler ever lands in the counter. The stopword set is hand-picked prose chaff; `guest_share` normalizes each guest's words against the guest class total (`or 1` covers an all-host episode), so the numbers always sum to 100%.

**👟 Starter hint:** Run `top_words` on the episode and then scroll the text — every keyword printed should be a *content* word you can point to ("pricing", "trust", "burnout"…), and `the`/`and` should be nowhere.

**🎯 Expected output:** `guest_share` → Jonas `100%` (one guest, he gets all the guest airtime); `top_words` → six content words like `pricing`, `trust`, `burnout`, `rest`, `marketing`, `culture` — no stopwords, in descending frequency.

**🩹 If it's off:** If `top_words` floods with `the`, `and`, `really`, a grammar token isn't in `STOP` — add it; the set is data you maintain. If `guest_share` divides wrong on an all-guest episode, the accumulator counted `guests` only — decide (and print) whether the denominator is *all* speakers or just guests; for "guest airtime," guests is the honest denominator.

### 4.2 Verify highlights

**✅ Checklist**

- ✅ Every keyword in `top_words` is a content word you can locate in the transcript.
- ✅ `guest_share` sums to 100% when there's at least one guest, and to nothing alarming with no guests.
- ✅ Adding a made-up filler word to `STOP` removes it from every future run — the set is a live configuration, not a one-off.
- ✅ The keyword ranking changes when you add an extra `pricing` line — the counter actually updates.

**🤔 Socratic Question(s)**

- The stopword list is *your judgment* ("just", "really" are chaff to you). What's a phrase that your list would wrongly keep or wrongly drop — and does that make the "keyphrase" output bias? Who owns that bias?
- `guest_share` uses *words per guest*, identical in spirit to the meeting tool's airtime. What's the alternative a producer might want — turns, longest single utterance, or words-per-minute — and which one would flatter a guest who speaks slowly but monopolizes?

## Step 5: Compose the fact sheet and export

The analysis is done; the product is two files — a human-readable `episode_notes.txt` a producer pastes into show notes, and a `topics.csv` that plays nicely with any spreadsheet for a whole-season comparison. Composition is the same "assemble from already-tested parts" move as every earlier finishing step.

### 5.1 Write both outputs

```python
# publish.py
import csv
from collections import Counter
from parse import load_episode
from roster import classify
from topic_score import score_topics
from highlights import guest_share, top_words

def publish(episode: str, hosts_file: str) -> None:
    turns = load_episode(episode)
    people = classify(episode, hosts_file)
    topics = score_topics(episode)
    notes = [
        f"EPISODE FACT SHEET — {len(turns)} turns",
        "\nSpeakers:",
        *[f"  {r['speaker']} ({r['role']}, {r['words']} words)"
          for r in people.values()],
        "\nTopics (ranked):",
        *[f"  {t}: {s}" for t, s in topics.most_common()],
        "\nGuest airtime share:",
        *[f"  {n}: {p:.0%}" for n, p in guest_share(people)],
        "\nTop keywords: " + ", ".join(w for w, _ in top_words(episode)),
    ]
    open("episode_notes.txt", "w").write("\n".join(notes))
    with open("topics.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["topic", "word_hits"])
        w.writerows(topics.most_common())

if __name__ == "__main__":
    publish("episode.txt", "hosts.txt")
    print("wrote episode_notes.txt and topics.csv")
```

Two output formats, one source of numbers: the *same* function results (`classify`, `score_topics`, …) feed both the human file and the CSV, so a fact sheet that says `pricing: 4` and a CSV row that says `pricing,4` can never disagree. `csv.writer` handles quoting for you (a topic name with a comma — `"culture, remote"` — survives as one cell), which a naive `",".join` would silently corrupt.

**👟 Starter hint:** Write both files, then *open the CSV in a spreadsheet* (or `python -c "print(open('topics.csv').read())"`) and confirm two columns, four rows, no quoting surprises — the spreadsheet view is a real check, not theater.

**🎯 Expected output:** `episode_notes.txt` containing the header, both speakers with roles and word counts, ranked topics, Jonas at `100%`, and the keyword list — plus `topics.csv` with a `topic,word_hits` header and four data rows that match the printed ranking line for line.

**🩹 If it's off:** If the CSV rows don't match `episode_notes.txt`, the two writes used *different* calls (re-scored somewhere) — both must draw from the `topics` variable computed once, up top. If a topic cell arrives quoted against your wishes, that's `csv` doing its job (protecting commas); if a cell is *wrong*, the `w.writerows` is writing `most_common()` tuples whose order you should print before trusting.

### 5.2 Verify the publication

**✅ Checklist**

- ✅ Both files exist with matching numbers — the fact sheet and the CSV agree on every topic score.
- ✅ The CSV opens as 5 rows × two columns in a spreadsheet, with `topic,word_hits` on top.
- ✅ Regenerating a deleted file is one command (`uv run python publish.py`) — outputs are derived, never hand-maintained.
- ✅ Re-running against a different episode would produce a different, still-welled-formatted pair of files.

**🤔 Socratic Question(s)**

- `episode_notes.txt` and `topics.csv` present the same data twice. Is the duplication wasteful — or is it the *feature* (one file for humans, one for machines)? Name a third consumer (a season-comparison script) and tell me which file it should read.
- The "topic" column is a label you chose; the CSV just records the hits. If two different episodes had different `TOPICS` files, the CSVs couldn't be compared column-safe. What one column (hint: it starts with `episode`) would make the CSV comparable across an entire season?

## ⚠️ Common pitfalls

- **Case-sensitive name normalization.** The transcript says `Maya`, the roster says `maya`, and Step 2 silently creates two people — one host, one guest, both real. Lowercasing *at parse time* and again in the classifier's `name in hosts` check is the funnell; skip one and a perfectly clean roster mis-splits its own hosts.
- **Substring counting inflating topic scores.** `count("team")` finds the `team` inside `steam` and `teams`, so `culture` scores on words that have nothing to do with it. The cheap fix is token-level testing (`w in words`) over word-counting; the *honest* one is documenting that substring counting is a first pass and reading the pitfall section before trusting season-long trends.
- **A roster file that's the single point of failure.** One typo (`Mayya`) makes the whole fact sheet misclassify the show's host as its own guest — and nothing is alerted. Guard with a completeness check: before publishing, every speaker name in the transcript must resolve to either a host or a guest, and unknown names should fail loud or at least print loud.
- **Stopword chaff rawdogging the keywords.** Without the `STOP`-set filter, "the", "and", "really" dominate the "top keywords" output and the fact sheet reads like a rate of speech, not content. The set is a configuration file you must maintain per show — a finance podcast's "ratio" is someone else's "bank," so curate or watch the list drift.
- **CSV quoting surprises.** A topic named `"culture, remote"` breaks a hand-rolled `",".join` output into two cells. `csv.writer` exists precisely for this; use it, and never hand-coat CSV with string concatenation — the escape rules are subtler than they look.

## What you just built

A working podcast analyzer: transcript in, an `episode_notes.txt` fact sheet and a `topics.csv` out — hosts and guests separated, topics ranked by keyword weight, guest airtime quantified, and content keywords distilled. Every number is independently verifiable by hand, because the whole pipeline is parsing, set membership, and `Counter` — with no black box anywhere. The transferable skill is the *keyword-co-occurrence* idea: "what is this text about?" as a counting problem over a dictionary of labels and triggers, the same primitive underneath document tagging, spam filtering, topic modellers, and the first stage of most content-analysis pipelines you'll meet.

:::tip[Run a fuller version without any local setup]
[`examples/podcast-analyzer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/podcast-analyzer) in the course repo bundles the parser, roster, scorer, highlights, and publish modules plus the sample episode and a notebook that runs every step in order. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and produce a fact sheet in a browser tab.
:::

## Where to go from here

- **Season comparison:** loop a `publish` over every episode file, `topics.csv` rows per episode into one season CSV, and rank "this season drifted from pricing to culture" — the CSV column added in Step 5's Socratic question made real.
- **Bigram keywords:** replace single-word counting with two-word windows (`"remote culture"`, `"word of mouth"`) — the same `Counter`, one new tokenizer step, dramatically better keyphrases.
- **A `--episode` label flag** that stamps the episode slug into the notes header and CSV — 10 lines, and instantly makes every output attributable.
- **Transcription hook (optional):** if you have a free-tier speech-to-text tool (whisper.cpp on your laptop counts), a small `subprocess` step converts an `.mp3` into this transcript format first — every step after Step 1 already runs on its output, no changes needed.

## Share your project with the class

Built something you're proud of — a fact sheet that nailed a real episode, a CSV full of your own show's data? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README walks through adding yours via a **pull request** from start to finish: forking, branching, committing, and opening the PR. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓