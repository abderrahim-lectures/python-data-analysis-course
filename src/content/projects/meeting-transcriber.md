---
title: "Build a Meeting Transcriber & Summarizer"
description: "Turn a raw meeting transcript into a structured report, who said what, the decisions, and a clean action-item list with owners, with zero manual note-taking."
difficulty: "intermediate"
estimatedMinutes: 75
tags: ["cli", "text-processing", "csv", "regex"]
learningObjectives:
  - "Parse a timestamped transcript into structured speaker turns"
  - "Segment and count speakers to spot dominance and silence"
  - "Extract action items with owner names via keyword rules"
  - "Assemble a compressed summary report and share it as a file"
prerequisites: ["python-101/strings", "python-101/file-io", "python-101/loops", "python-101/functions"]
---

# 🎙️ Build a Meeting Transcriber & Summarizer

Every meeting ends the same way: someone volunteers to write the notes, forgets who owned what, and the action items evaporate by Monday. This project builds the summarizer half of a real meeting pipeline, it takes a meeting *transcript* (the text your voice-to-text tool produces) and turns it into the report humans actually want: a speaker breakdown showing who dominated, every decision that was made, and a per-person list of action items extracted automatically from the verbs and owner names in the transcript.

This assumes Python 101, strings, file I/O, loops, and functions. Nothing beyond that: no ML, no audio processing, no external APIs for the core pipeline (real speech-to-text needs a key, and there's an optional step for it). It's optional and ungraded; see [Real-World Projects](/projects) for the full list.

## 🎯 What you'll do

1. Define a transcript file format (timestamp, speaker, turn) and parse every line into a structured turn.
2. Group the turns by speaker and compute each person's share of the talk time.
3. Find the decisions, sentences that conclude with verbs like "agreed", "decided", "confirmed".
4. Extract action items, "X will do Y", with the owner name paired to each task.
5. Assemble everything into one readable summary file and point the tool at real meeting minutes.

## Where to run this

**Locally with `uv`** is the primary path here, the pipeline is pure text processing over a file you control, so the whole "drop a transcript in, get `summary.txt` out" loop is a terminal habit, and the CSV you generate is a file you can open in any spreadsheet.

**GitHub Codespaces** works identically: open [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) and the exact commands below run in a browser tab with Node, Python, and `uv` preinstalled.

**Google Colab, Kaggle Notebooks, and Binder are a genuinely good fit for every step below**, there are no secrets, no GPU, and the whole pipeline is a few cells running over the course's bundled sample transcript (which is a realistic, hand-typed meeting). The honest caveat: the notebook uses that fixed example transcript rather than audio you record. Real speech-to-text would need a free API key, and that bit's covered by an optional step, for *the summarizer itself*, a notebook runs it for real.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/meeting-transcriber/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/meeting-transcriber/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fmeeting-transcriber%2Fnotebook.ipynb)

## Setup

Everything you need before transcribing a single word: `uv`, and a realistic sample transcript to chew on.

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
mkdir meeting-transcriber && cd meeting-transcriber
uv init --bare
```

Zero extra packages, this project is pure standard library.

### Write a realistic sample transcript

Paste this into `transcript.txt` (each line: `[MM:SS] Speaker: words`, the format most transcription tools export, and easy to read by hand):

```
[00:00] Priya: Let's review where we stand on the launch.
[00:08] Tom: Design shipped the landing page yesterday.
[00:15] Priya: Great. We agreed the beta opens next Monday.
[00:22] Tom: I'll block out Thursday to prep the demo video.
[00:30] Zara: I will draft the onboarding email today.
[00:38] Priya: Please send it to me for a quick pass.
[00:44] Tom: We decided the pricing page stays as-is.
[00:52] Zara: So action items: Tom owns the video, I own the email.
[01:00] Priya: And I'll publish the changelog on Friday. Meeting's at 30 minutes? No sooner.
[01:06] Zara: Wait, that's not a decision.
```

Run:

```bash
wc -l transcript.txt
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `transcript.txt` exists with 11 lines, each starting with a `[MM:SS]` timestamp.
- ✅ You can spot the decision verbs (`agreed`, `decided`) and the owner verbs (`will`, `owns`, `publish`) already, those are the words the extractor will learn to catch.

## Step 1: Parse the transcript into turns

The transcript is a flat list of lines; the summary needs a *structured* list of turns, each with a timestamp, a speaker, and the words. Parsing is one honest `split()` away: the timestamp and speaker are fixed-width-ish prefixes, and the message is everything after the third colon.

### 1.1 Write the turn parser

```python
# parse.py
from pathlib import Path

def parse_line(line: str) -> dict:
    line = line.strip()
    time_s = line.split("]")[0].lstrip("[")
    rest = line.split("]", 1)[1].strip()
    speaker, _, message = rest.partition(":")
    return {"time": time_s, "speaker": speaker.strip(), "text": message.strip()}

def load_transcript(path: str) -> list[dict]:
    turns = []
    for line in Path(path).read_text(encoding="utf-8").splitlines():
        if line.strip():
            turns.append(parse_line(line))
    return turns

if __name__ == "__main__":
    for t in load_transcript("transcript.txt")[:3]:
        print(t)
```

`partition(":")` splits on the *first* colon and returns a three-tuple `(before, ":", after)`, safer than `split(":")` because a speaker's text can itself contain colons (look at line 11: "Wait, that's not a decision." with an apostrophe, and imagine a URL or time like `01:06` in the message). The `.split("]", 1)[1]` untangles the timestamp the same way: everything after the *first* `]`, even if the message contains brackets.

**👟 Starter hint:** Parse the file and print the first three turns *before* writing anything else, the goal is seeing `Speaker: Priya` and `text: Let's review...` as clean fields, not mangled prefixes.

**🎯 Expected output:** Three dicts like `{'time': '00:00', 'speaker': 'Priya', 'text': "Let's review where we stand on the launch."}`, with no `[` or `]` leaking into the time field.

**🩹 If it's off:** If `speaker` comes out as `Priya` with a leading space, the `.strip()` after `partition` is missing. If `ValueError: not enough values to unpack` fires, a line lacks a `:`, which is a genuinely malformed transcript, and the fix is deciding whether to skip bad lines or raise; our `strip()`+filter skips blank lines, not malformed ones.

### 1.2 Verify the parser

**✅ Checklist**

- ✅ `load_transcript` returns 11 turns for `transcript.txt`, each a dict with `time`, `speaker`, and `text`.
- ✅ A turn whose message contains a colon (e.g. a URL) still parses with the whole message intact.
- ✅ Whitespace-only lines never create empty turns.
- ✅ You can predict what `parse_line("[05:00] Sam: A: B")` returns, and there's only one right answer for `speaker`.

**🤔 Socratic Question(s)**

- We split the timestamp with `split("]", 1)`. What would break for a message like `[00:30] Zara: the link is [here]`, and is `partition` on the *timestamp* a more robust choice?
- The parser assumes `[MM:SS]` timestamps. If a transcript used `00:04:32` (real clock times), which field would silently change shape, and should the parser *validate* the time format, or stay loosely typed?

## Step 2: Segment speakers and count the airtime

A transcript is two dimensions: who said it, and how much they said. This step aggregates turns into per-speaker totals, words per speaker, turns per speaker, the numbers that show instantly whether one voice ate the meeting. The pattern is `Counter`/group-by-key, the same shape as "group sales by region", applied to talk time.

### 2.1 Aggregate per-speaker stats

```python
# segments.py
from collections import Counter
from parse import load_transcript

def speaker_stats(turns: list[dict]) -> dict[str, dict]:
    stats = {}
    for t in turns:
        s = t["speaker"]
        row = stats.setdefault(s, {"words": 0, "turns": 0})
        row["words"] += len(t["text"].split())
        row["turns"] += 1
    return stats

def word_share(stats: dict[str, dict]) -> dict[str, float]:
    total = sum(r["words"] for r in stats.values()) or 1
    return {s: r["words"] / total for s, r in stats.items()}

if __name__ == "__main__":
    turns = load_transcript("transcript.txt")
    stats = speaker_stats(turns)
    for s, r in sorted(stats.items()):
        print(f"{s:<6} {r['words']:>3} words  {r['turns']} turns  {word_share(stats)[s]:.0%}")
```

`stats.setdefault(s, {...})` returns the existing row if the speaker is already seen, or inserts a fresh zeroed one and returns it, the "build a dict of rows" idiom that keeps the mutation one line. Words are counted with `t["text"].split()`, turns with a plain count, and `word_share` normalizes into a percentage that's robust to an empty meeting thanks to the `or 1` guard.

**👟 Starter hint:** Run the stats, then hand-count Priya's words in the transcript and confirm the number matches, the guard against "trust the tool" is "you already counted once."

**🎯 Expected output:** Three lines like `Priya  41 words  5 turns  43%`, `Tom  30 words  3 turns  ...%`, `Zara  ...  ...  ...%` whose word-shares sum to 100%.

**🩹 If it's off:** If a speaker is missing entirely, their turns were parsed under a different name (trailing space, check `.strip()` on the speaker in Step 1). If shares sum to 99% or 101%, that's float rounding, not a bug, display with `:.0%` or normalize once; if a share prints as `nan%`, you hit the `total = 0` edge and the `or 1` guard isn't in place.

### 2.2 Verify segmentation

**✅ Checklist**

- ✅ Every distinct speaker in the transcript has exactly one row, same-day double mentions dedupe into one running count.
- ✅ A speaker with zero words (if any) shows `0 words`, `0%`, never a missing row.
- ✅ Your hand-counted word total for the whole file matches the sum of the rows.

**🤔 Socratic Question(s)**

- Word share is a *quantity* metric: the person who talks most holds the room. What would a "did Priya dominate or just prompt?" analysis need that words alone can't tell, hints: word *turn* length average, question counts, and the ratio of statements to hand-off lines like "Please send it to me"?
- We bucket by exact speaker string; `Priya` and `priya` would be two people. Where's the right normalization point, at parse time, at aggregation time, or never, and what does the choice say about the tool you're building?

## Step 3: Find the decisions

Summaries that list "stuff that happened" are forgettable; summaries that list **decisions** are the record. This step scans the transcript for the language of finality, verbs like `agreed`, `decided`, `confirmed`, `decided`, and extracts the whole sentence as a decision. Rule-based and shallow, but it's exactly how the first pass of a summary bot behaves.

### 3.1 Scan for decision verbs

```python
# decide.py
from parse import load_transcript

DECIDE_VERBS = ("agreed", "decided", "confirmed", "voted", "ruled", "settled")

def find_decisions(turns: list[dict]) -> list[str]:
    decisions = []
    for t in turns:
        for verb in DECIDE_VERBS:
            if verb in t["text"].lower():
                decisions.append(f"{t['time']} {t['speaker']}: {t['text']}")
                break
    return decisions

if __name__ == "__main__":
    for d in find_decisions(load_transcript("transcript.txt")):
        print(d)
```

The two-loop nest (turns × verbs) is small enough to stay honest O(n·m); the `lower()` guarantees `agreed` matches `Agreed`, and the `break` ensures one verb per turn, a line that says both "agreed" and "confirmed" counts once. A decision is rendered with its `time` and `speaker` attached, so the summary keeps provenance ("at 00:15 Priya decided…") rather than a bare clause.

**👟 Starter hint:** Run it, then eyeball the output against the file, you're checking that "We agreed the beta opens next Monday" *and* "We decided the pricing page stays as-is" both appear, and that Zara's line 9 (`will draft`) does NOT, "drafting" is an action, not a decision, and that distinction is the whole point of this step.

**🎯 Expected output:** Two lines, the `00:15` "beta opens next Monday" turn and the `00:44` "pricing page stays as-is" turn, and nothing from lines 3, 6, or 9.

**🩹 If it's off:** If only one decision appears, a verb was missed because the transcript used a synonym (`agree` instead of `agreed`), either expand the tuple or lowercase *and* stem (try `startswith` on a verb root) consistently. If `[00:08] Tom: Design shipped...` gets included, the word "decided" appears inside a regular sentence ("We decided..."), that's a true positive here, but a *future* `shipped` verb would be a false positive your tuple has to avoid by naming exact words.

### 3.2 Verify decisions

**✅ Checklist**

- ✅ The two real decisions in the sample appear with timestamp and speaker.
- ✅ No "I will draft..." or "I'll block out..." action line is misclassified as a decision.
- ✅ A turn that mentions *no* decision verb contributes nothing to the list.
- ✅ You can explain the deliberate line between "agreed"(decision) and "will draft"(action).

**🤔 Socratic Question(s)**

- Our verb list is a fixed tuple, so a decision worded as "Priya: so the beta is a go" (no decision verb at all) slips through. What's a *second*, independent signal, a question mark, a "right?", a "yes" back-channel, that could flag it, and what false positives does it add?
- `agreed` inside "I agreed with you earlier that the design was rough" is contextually *not* a decision, yet our scan reports it. Is a "no decisions reported" false-negative always acceptable, and where would you draw the precision/recall line for a notes bot (hint: prefer many true positives over an occasional false one, today)?

## Step 4: Extract action items with owners

Decisions say what changed; action items say *who does what by when*, and they're the part people actually live. The extraction pattern: an owner appears as a name immediately followed (within a few words) by a future-tense verb (`will`, `owns`, `publish`). This is a shallow, explainable proxy for what a transformer would do by attention, and for a notes bot, explainable beats magical.

### 4.1 Extract owner + task pairs

```python
# actions.py
from parse import load_transcript

ACTORS = ("Priya", "Tom", "Zara")
TASK_WORDS = ("will", "owns", "draft", "send", "block", "publish", "write", "set")

def extract_actions(turns: list[dict]) -> list[dict]:
    actions = []
    for t in turns:
        lowered = t["text"].lower()
        for actor in ACTORS:
            if actor.lower() not in lowered:
                continue
            for word in TASK_WORDS:
                if word in lowered:
                    actions.append({"time": t["time"], "owner": actor, "task": t["text"]})
                    break
    return actions

if __name__ == "__main__":
    for a in extract_actions(load_transcript("transcript.txt")):
        print(f"{a['time']}  {a['owner']} -> {a['task']}")
```

Two nested loops again, but the *guard order* matters: checking `actor` first and `continue`ing skips a turn entirely if it doesn't mention a known person, that's the whole "ownership" filter. The `break` after the first task-word keeps one line to one action even when it says "will draft the video and then send the email". Task text is the *full* turn (you keep the sentence for context); a fancier tool would slice exactly the substring, note that as a deliberate simplification.

**👟 Starter hint:** Run it and then hand-mark the real actions: Tom → video, Zara → email, Priya → changelog. The output should name each owner and the right turn, and line 6 "send it to me" should *not* steal Tom's action.

**🎯 Expected output:** Three full turns each tagged with an owner: `Tom -> I'll block out Thursday to prep the demo video`, `Zara -> I will draft the onboarding email today`, `Priya -> And I'll publish the changelog on Friday`, in transcript order.

**🩹 If it's off:** If Priya's "publish" line is missing, her name isn't in `ACTORS` or 'publish' isn't in `TASK_WORDS`, both are data you control; add names and verbs, and prefer re-running over "tuning the model". If Tom's line shows with owner `Zara`, the turn text mentions Zara (line 8: "Zara, Tom owns the video") *and* Tom, a genuine ambiguity, resolved for now by *first* actor found, and worth your `TODO` comment, not a hack.

### 4.2 Verify actions

**✅ Checklist**

- ✅ Each of the three real actions appears once, with the right owner and the right turn text.
- ✅ "send it to me" (a request) is not extracted as an action item for Tom or Zara.
- ✅ A speaker with no action verbs (a purely conversational turn) contributes nothing.
- ✅ You can articulate why "owner appears in the same turn as a task word" is a proxy, not the truth.

**🤔 Socratic Question(s)**

- The owner is whoever's *name* appears in a turn, but in "Zara, Tom will own the video", the owner (Tom) and the addressed person (Zara) differ. What data would let you disambiguate, word order, proximity to the *verb*, or subject position, and which is the cheaper signal?
- "I will publish the changelog on Friday" assigns to the *speaker*; "Tom will publish the changelog" assigns to someone *else*. Our extractor treats both as "mention = owner". What would a `speaker == owner` check change about trust in the action list, and is the speaker-first rule a good default for meeting notes?

## Step 5: Compose the summary and ship it

Everything so far produces fragments; the summary is the product. Step 5 assembles the speaker stats, the decisions, and the actions into one readable file, the thing you'd actually paste into the group chat after a meeting, and saves it so anyone can open it.

### 5.1 Assemble and write the report

```python
# summary.py
from pathlib import Path
from parse import load_transcript
from segments import speaker_stats, word_share
from decide import find_decisions
from actions import extract_actions

def build_summary(turns: list[dict]) -> str:
    stats = speaker_stats(turns)
    lines = [f"MEETING SUMMARY — {len(turns)} turns",
             "\nSpeakers by share:",
             *[f"  {s}: {r['words']} words ({word_share(stats)[s]:.0%})"
               for s, r in sorted(stats.items(), key=lambda kv: -kv[1]['words'])],
             "\nDecisions:", *[f"  [{d}]" for d in find_decisions(turns)],
             "\nAction items:", *[f"  [{a['time']}] {a['owner']}: {a['task']}"
                                  for a in extract_actions(turns)]]
    return "\n".join(lines)

if __name__ == "__main__":
    turns = load_transcript("transcript.txt")
    Path("summary.txt").write_text(build_summary(turns), encoding="utf-8")
    print(build_summary(turns))
```

Composing a report from sub-results is the "assembly" stage and the habit to carry into any bigger tool: each earlier step stays a small pure function, and `build_summary` only *composes* them, so the summary can't know more than the parts, and a misbehaving part is one function to test. Sorting speakers by descending words (`key=lambda kv: -kv[1]['words']`) puts the dominant voice first, which is itself a finding.

**👟 Starter hint:** Write `summary.txt`, then open it in a text editor and read it as if you'd missed the whole meeting, your bar for "works" is that a stranger could reconstruct the meeting from this file alone.

**🎯 Expected output:** `summary.txt` containing the header with turn count, all three speakers with word totals and shares, both decisions, and three action items under clear headings, readable top to bottom with no Python artifacts.

**🩹 If it's off:** If the file writes empty sections, a sub-function returned `[]`, check that earlier steps still run from `__main__` *before* composing (a broken import silently forwards `None`). If the output has `None` fragments, an f-string hit a `None` return, every sub-function must return a list/string, not None; run each step's own `__main__` to isolate.

### 5.2 Verify the shipped summary

**✅ Checklist**

- ✅ `summary.txt` exists and contains all four sections under their headings.
- ✅ Each section's contents match what the individual steps printed, nothing added, nothing dropped.
- ✅ A stranger could reconstruct the meeting's speakers, decisions, and owners from the file alone.
- ✅ Re-running the build from a *different* transcript reproduces the same pipeline cleanly.

**🤔 Socratic Question(s)**

- The summary composes finished *fragments*. What would change if the speaker stats had to display differently in the summary than in Step 2 (say, minutes instead of words)? Is `build_summary`'s job to *reformat* or to *transport*, and what does that say about where the display logic should live?
- `summary.txt` is a snapshot. What's the change that turns it into something you'd *re-run after every meeting* rather than a one-off (hint: a `--from` flag and a `meetings/` folder naming scheme)? Name the config decision before you write it.

## ⚠️ Common pitfalls

- **Colons inside messages breaking the parse.** "The demo link: http://..." genuinely contains a colon, and `split(":")` on the full line splits the speaker name *and* the message apart. `partition(":")` after stripping the timestamp is the fix, split on the *first* colon only, never all of them.
- **Speaker-string drift producing phantom people.** `Priya` vs `Priya ` (trailing space) or `priya` vs `Priya` create two rows in Step 2 and two owners in Step 4. Normalize exact names once, at parse time, and let every downstream step trust the string.
- **Airtime measured in words vs. turns.** Word share treats a 40-word monologue and 5 short interjections as equal talkers. Both stats exist; presenting *either* alone silently frames the meeting, the summary should show words and turns, and let dominance be a reading, not an assert.
- **Decision/action confusion.** "We decided the beta opens Monday" is a decision; "I'll block Thursday" is an action. Exactly one tool passes if they're merged, because owners are meaningless for decisions and verb-sequences mislead for actions, keep the two scanners separate, as Steps 3 and 4 do.
- **Writing a summary nobody can audit.** A summary with no timestamps or speakers is opinion; with them it's a record. Every bullet our report emits carries `[time]` and a name, drop those and you've built a tool that paraphrases instead of documents.

## What you just built

A working meeting summarizer: transcript in, a readable `summary.txt` out, speakers ranked by share, both decisions extracted with provenance, and three action items each attached to a real owner. The transferable skill is the whole *text pipeline* habit: parse into structured turns, aggregate and group, recognize patterns with rules, then compose a report, the same skeleton that powers email triage, support-ticket routing, log mining, and (with a heavier model in the middle) every LLM "summarizer" you've ever pasted a call recording into. Yours is transparent, tested line by line, and needs no API key to earn its keep.

:::tip[Run a fuller version without any local setup]
[`examples/meeting-transcriber/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/meeting-transcriber) in the course repo bundles the parser, segments, decisions, actions, and summary modules plus the sample transcript and a notebook that runs every step in order. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and build a summary in a browser tab.
:::

## Where to go from here

- **Real speech-to-text (optional).** If you have a free-tier API key for a transcription service (or your laptop's own whisper-capable tool), swap `load_transcript` for a subprocess call that takes an `.m4a` and emits SRT, every downstream step already runs on the output.
- **Export to CSV.** `csv.writer` turns the action items into rows (`owner, task, time`) you can sort by owner or import into a task tracker, the summary stays human-readable, the CSV becomes machine-readable, and they're two views of one parse.
- **A `--speaker Sam` filter** that summarizes a single person's turns, same pipeline, one filter argument, instantly useful for "what did *I* commit to?"
- **Heavier extraction via an LLM (optional).** Feed the parsed turns to a free-tier model with a system prompt like "return JSON of decisions and actions", the rule-based extractor stays as the offline fallback, the LLM becomes the baseline, and you'll *measure* where one beats the other.

## Share your project with the class

Built something you're proud of, a summary that captured a real meeting, an action list you actually used? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README walks through adding yours via a **pull request** from start to finish: forking, branching, committing, and opening the PR. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓