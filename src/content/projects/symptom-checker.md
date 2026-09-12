---
title: "Build a Symptom Checker"
description: "Build a deterministic triage engine from a symptom-condition knowledge base: weighted matching, urgency scoring, plain-language recommendations, and a safe, interactive CLI with a strict medical disclaimer."
difficulty: "advanced"
estimatedMinutes: 75
tags: ["health", "cli", "domain-modeling"]
learningObjectives:
  - Model a small symptom-condition knowledge base as structured data
  - Score conditions by weighted symptom overlap
  - "Compute a bounded urgency score from severity and duration"
  - Generate banded, plain-language care recommendations
  - Build an interactive CLI with normalized symptom input
prerequisites:
  - "Python basics (functions, loops, dictionaries, sets)"
  - "Comfort with dataclasses or plain dictionaries for domain data"
  - "Basic CLI input handling (input and sys.argv)"
---

# 🛠️ 🩺 Build a Symptom Checker

Symptom checkers have a bad reputation for good reasons: they mix real triage rules with a homepage full of worst-case outcomes. The version you build here sidesteps the drama by doing the part an engine can do *honestly*, matching symptoms to conditions with weighted overlap, scoring an urgency band from severity and duration, and turning that band into plain-language next steps. It is a rule engine over a small, curated knowledge base, and it says so: no AI, no diagnosis, and a disclaimer standing at every exit.

This assumes Python 101 plus basic dictionaries and sets, nothing beyond that is required, and no external packages. It's optional and ungraded; see [Real-World Projects](/projects) for the full, growing list.

> **Educational purposes only.** This project's output is not medical advice, cannot diagnose, and must always point at a real clinician. The build teaches domain modeling and tiered rules, the medical claims stop where this disclaimer starts.

## 🎯 What you'll do

1. Encode a curated symptom-to-condition knowledge base as data, not logic.
2. Score conditions by weighted symptom overlap and rank the matches.
3. Combine severity and duration into one bounded 0–10 urgency score.
4. Map an urgency band to plain-language care recommendations.
5. Wrap it in an interactive CLI with normalized symptom input and a disclaimer.

## Where to run this

**Locally with `uv`** is the primary path. The engine is pure standard library, so `uv init` gets you running immediately, and the interactive `cli` mode needs a real terminal (a script you run, not a cell you execute) to read `input()`.

**Google Colab, Kaggle Notebooks, and Binder** run the scoring engine identically, all four scoring steps are plain functions on plain data. The honest caveat: `input()`-driven interaction is awkward in a notebook, so those paths run the seeded *demo* mode (Step 5's default) rather than a live Q&A. Use the badges to see the engine work end to end, and switch to local `uv` for the full interactive experience.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/symptom-checker/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/symptom-checker/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fsymptom-checker%2Fnotebook.ipynb)

## Setup

Create the project. The checker needs only the standard library.

```bash
uv init symptom-checker
cd symptom-checker
```

```bash
uv run python -c "import sys, typing; print('ok')"
```

`sys` is used by Step 5 to switch between demo and interactive modes, and `typing` gives the smaller function signatures (`dict[str, ...]`) that keep the domain data readable as the knowledge base grows across the steps.

**✅ Checklist**

- ✅ `uv init symptom-checker` created a folder with a `pyproject.toml`.
- ✅ `uv run python -c "import sys, typing"` prints `ok`, zero packages added.

## Step 1: Model the symptom-condition knowledge base

Everything this checker "knows" lives in one dictionary. Keeping the medical facts as *data* rather than `if` statements is what lets the scoring logic stay generic, add a condition later and the engine scores it with zero code changes.

### 1.1 Encode conditions and their weighted symptoms

**👟 Starter hint:** Represent each condition as a dict of `symptom → weight`, and give every symptom a stable machine key plus a human-readable label the CLI can print.

```python
# checker.py
KNOWLEDGE: dict[str, dict[str, int]] = {
    "Common cold":   {"cough": 3, "runny_nose": 3, "sore_throat": 2, "sneezing": 2, "fatigue": 1},
    "Seasonal allergies": {"sneezing": 3, "itchy_eyes": 3, "runny_nose": 3, "headache": 1},
    "Flu":           {"fever": 3, "body_aches": 3, "fatigue": 3, "cough": 2, "headache": 2},
    "Strep throat":  {"sore_throat": 3, "fever": 2, "swollen_lymph": 2},
    "Food poisoning": {"nausea": 3, "vomiting": 3, "diarrhea": 3, "stomach_pain": 2},
    "Migraine":      {"headache": 3, "light_sensitivity": 2, "nausea": 2},
    "UTI":           {"burning_urination": 3, "frequent_urination": 3},
    "Dehydration":   {"dry_mouth": 3, "dizziness": 2, "fatigue": 2, "headache": 1},
}

SYMPTOM_LABELS = {
    "cough": "cough", "runny_nose": "runny nose", "sore_throat": "sore throat",
    "sneezing": "sneezing", "fatigue": "fatigue", "itchy_eyes": "itchy eyes",
    "headache": "headache", "fever": "fever", "body_aches": "body aches",
    "swollen_lymph": "swollen glands", "nausea": "nausea", "vomiting": "vomiting",
    "diarrhea": "diarrhea", "stomach_pain": "stomach pain",
    "light_sensitivity": "light sensitivity", "burning_urination": "burning urination",
    "frequent_urination": "frequent urination", "dry_mouth": "dry mouth",
    "dizziness": "dizziness",
}

ALL_SYMPTOMS = {s for weights in KNOWLEDGE.values() for s in weights}
print(f"conditions: {len(KNOWLEDGE)}  distinct symptoms: {len(ALL_SYMPTOMS)}")
```

Two data shapes do the real work. The `weight` per symptom (1–3) encodes *how strongly* a symptom points at a condition, a 3 means "so typical it's near-defining", a 1 means "appears but non-specific", so a cough alone nudges flu less than fever does. `SYMPTOM_LABELS` keeps one stable machine key (`"burning_urination"`) mapped to one human phrase, which means the CLI in Step 5 can print and accept symptoms without ever string-matching the words people might type. `ALL_SYMPTOMS` is derived from the knowledge base itself rather than maintained by hand, so it can't drift from the data.

**🎯 Expected output:** `conditions: 8  distinct symptoms: 19`.

**🩹 If it's off:** If the count is lower, a condition dict is missing or two condition keys collide (space vs underscore). If `ALL_SYMPTOMS` errors, a value in `KNOWLEDGE` isn't a dict, check a stray string in one condition. If counts are higher, a condition contains a symptom key that isn't in `SYMPTOM_LABELS`, which Step 5's CLI will refuse to print.

### 1.2 Verify the model

**✅ Checklist**

- ✅ `uv run python checker.py` prints `conditions: 8  distinct symptoms: 19`.
- ✅ Every symptom key in `KNOWLEDGE` also appears as a key in `SYMPTOM_LABELS`.
- ✅ You can describe, in your own words, what the `3` next to a symptom *means* as a modeling decision.

**🤔 Socratic Question(s)**

- A sneeze points at allergies and cold roughly equally. Both are scored 3 above, what modeling change would express "appears in both, but doesn't disambiguate them"?
- The weights are integers. What does using 1–3 gain over a simple binary yes/no symptom list, and what *problem* does an expert-curated weight table like this create for a real medical product when new evidence arrives?

## Step 2: Score conditions by weighted overlap

Now the engine decides: given a small set of present symptoms, which conditions does the evidence point at? The score is a ratio of that condition's typcal evidence that matched, so a partial match ranks below a full one.

### 2.1 Rank conditions by matched evidence

**👟 Starter hint:** For each condition, sum the weights of the symptoms the user has, divide by the condition's total weight, and sort descending, one comprehension, no branchy logic.

```python
# checker.py (continued)
def score_conditions(present: set[str]) -> list[tuple[str, float]]:
    ranked = []
    for condition, symptom_weights in KNOWLEDGE.items():
        covered = sum(w for s, w in symptom_weights.items() if s in present)
        total = sum(symptom_weights.values())
        ratio = covered / total if total else 0.0
        ranked.append((condition, round(ratio, 2)))
    ranked.sort(key=lambda item: item[1], reverse=True)
    return ranked

demo = {"fever", "cough", "body_aches", "fatigue"}
for condition, ratio in score_conditions(demo):
    print(f"{ratio:>4.2f}  {condition}")
```

The ratio is the whole algorithm. `covered` counts the weights of *matched* symptoms, `total` is the condition's full signature, so a user matching every weighted symptom of a condition scores exactly `1.0` and a partial match lands between. That normalization is the key decision: a condition with a big signature (flu) is judged by how much of *its own* evidence appears, not by raw symptom count, otherwise the condition with the most listed symptoms would always win. `sorted(... reverse=True)` turns the scored pairs into a rank list the rest of the pipeline consumes.

**🎯 Expected output:** `Flu` first at `1.00` (fever, body aches, fatigue, cough are exactly its top-four), `Common cold` second, the rest below.

**🩹 If it's off:** If flu doesn't rank first for that exact set, a weight in the flu dict is mistyped (e.g. `cough` accidentally 1). If *everything* scores `1.00`, `s in present` is matching wrongly because `present` holds labels while `KNOWLEDGE` keys are machine keys, keep `demo` in machine keys. If scores look tiny, you divided by the wrong total and `covered`/`total` are swapped.

### 2.2 Verify scoring

**✅ Checklist**

- ✅ The demo set ranks `Flu` at `1.00`, `Common cold` second.
- ✅ A one-symptom set (`{"headache"}`) scores *below* 1.0 for every condition that lists headache.
- ✅ You can explain why normalization (dividing by each condition's own total) matters more when conditions differ in signature size.

**🤔 Socratic Question(s)**

- `{"runny_nose", "sneezing", "itchy_eyes"}` should rank allergies above the cold, which shares two of those symptoms. Work through the ratio math and say where the two conditions diverge, and why a *shorter* signature can outrank a longer one.
- This scoring ignores how long symptoms have lasted. What kind of wrong call does a duration-blind ranker make, and is that a scoring problem or a scoring-plus-urgency problem?

## Step 3: Compute a bounded urgency score

Reaching a rank list is not reaching a triage decision. This step adds the two columns a real assessment needs, how severe each symptom feels and how long it has lasted, and collapses everything into one bounded 0–10 urgency score the recommendation bands in Step 4 can act on.

### 3.1 Blend severity and duration into a number

**👟 Starter hint:** Start from the top ratio, add small penalties for severe symptoms and for symptoms lasting past a week, and cap the result at 10, keep each contribution small enough that high severity alone never overrides everything else.

```python
# checker.py (continued)
WARNING_SYMPTOMS = {"difficulty_breathing", "chest_pain", "confusion", "faintish"}

def urgency_score(present: set[str], severities: dict[str, str],
                  durations_days: dict[str, float]) -> float:
    top_ratio = score_conditions(present)[0][1]
    base = top_ratio * 5
    severe_bonus = sum(1 for s in present if severities.get(s) == "severe") * 0.5
    chronic_bonus = sum(1 for s, d in durations_days.items() if d > 7) * 0.3
    warning_bonus = 4 if present & WARNING_SYMPTOMS else 0
    return round(min(10, base + severe_bonus + chronic_bonus + warning_bonus), 1)

demo_dur = {"fever": 2, "cough": 3, "body_aches": 1, "fatigue": 10}
demo_sev = {"fever": "high", "body_aches": "severe", "fatigue": "moderate"}
print("urgency:", urgency_score({"fever", "cough", "body_aches", "fatigue"},
                                demo_sev, demo_dur))
```

Each term earns its keep through its pairs. `base` scales with how strongly the evidence matches (the Step 2 ratio × 5, so a perfect match starts at 5); `severe_bonus` and `chronic_bonus` add small increments for symptoms flagged `severe` or lasting past a week, deliberate and modest so they nudge, not dominate; and `warning_bonus` is big (4 points) because the four `WARNING_SYMPTOMS` translate to "seek urgent care" independently of any condition match. The `min(10, …)` cap is what makes the output a *bounded* score bands can trust. Notice `present & WARNING_SYMPTOMS` reuses set intersection, no loop needed to ask "do we have any red-flag symptom?"

**🎯 Expected output:** A single score between 0 and 10, for the demo above, around `7.0–8.0`, since a perfect flu match plus two severe/red-flag-adjacent signs lands in the high band.

**🩹 If it's off:** If the score exceeds 10, the `min(10, …)` cap is missing. If it stays tiny despite `severe` symptoms, `severities.get(s)` is looking up symptom *labels* while `present` holds machine keys. If a *chronic but mild* case (one symptom for 12 days) outranks an urgent one, `warning_bonus` isn't being added, check that `WARNING_SYMPTOMS` keys match real machine keys.

### 3.2 Verify the urgency score

**✅ Checklist**

- ✅ The demo returns a number strictly between 0 and 10.
- ✅ Adding `"chest_pain"` to `present` raises the same case's score by at least 3.
- ✅ The same symptoms with shorter durations score lower than with longer ones.

**🤔 Socratic Question(s)**

- `warning_bonus` is a flat +4 regardless of which warning symptom appears. Would weighting each warning (e.g. `difficulty_breathing` worth more than `faintish`) improve the bands' honesty, and what would it cost in simplicity?
- The score is a sum of independently-designed terms. What score would a user get with *no* matching condition but one severe warning symptom, and is that the answer you want a triage band to produce?

## Step 4: Map scores to plain-language recommendations

A score without a message is a number a worried person can't act on. This step brackets the 0–10 range into four bands, each bound to a concrete next step, and generates a readable summary from the top-ranked condition plus the band.

### 4.1 Write the care banding and summary

**👟 Starter hint:** Define the bands by upper bound in one ordered list, walk it to find the band the score lands in, then compose a one-paragraph summary from the top condition, the score, and that band.

```python
# checker.py (continued)
BANDS = [
    (8.0, "Seek urgent or emergency care now. Call your local emergency line."),
    (5.0, "Book an appointment with a doctor within 24 hours."),
    (3.0, "Monitor for 24-48 hours. Hydrate and rest; book a visit if it worsens."),
    (0.0, "Likely self-care. Rest, hydrate, and re-check if symptoms change."),
]

def recommendation(score: float) -> str:
    for cutoff, message in BANDS:
        if score >= cutoff:
            return message
    return BANDS[-1][1]

def summarize(present: set[str], severities: dict[str, str],
              durations_days: dict[str, float]) -> str:
    ranked = score_conditions(present)
    top_condition, _ = ranked[0]
    score = urgency_score(present, severities, durations_days)
    lines = [
        f"Top match: {top_condition}",
        f"Urgency score: {score}/10",
        "Next step: " + recommendation(score),
        "Consult a qualified health professional before acting on this.",
    ]
    return "\n".join(lines)

print(summarize(demo, demo_sev, demo_dur))
```

The banding keeps medical caution *in the data*, not scattered through `if`s. Each band declares a lower cutoff and an action; `for` walks the list in descending order and the first cutoff the score clears wins, so 9.5 hits urgent care, 4.2 hits "within 24 hours", and 2.5 lands in monitor/self-care. The closing disclaimer line in `summarize` is deliberate, not decorative: every path out of this engine, high band or low, carries it, because the rule engine that ranked the conditions has exactly zero medical authority.

**🎯 Expected output:** A 4-line block naming `Flu`, a score out of 10, a single matching band message, and the consultation disclaimer.

**🩹 If it's off:** If a 9.9 score routes to "self-care", the `BANDS` list is ordered ascending and `score >= cutoff` hits the low cutoff first. If the score shows but the message says `None`, `recommendation` fell through without a return, check the loop covers every possible score, with the `(0.0, …)` last line as the floor. If the top condition looks wrong, `ranked[0]` is unpacking a non-sorted list.

### 4.2 Verify the banding

**✅ Checklist**

- ✅ Scores ≥ 8 map to urgent care, ≥ 5 to a 24-hour appointment, ≥ 3 to monitoring, below to self-care.
- ✅ The summary always ends with the consultation disclaimer line.
- ✅ You can explain what the band structure buys over a bare score.

**🤔 Socratic Question(s)**

- The bands have crisp cutoffs, so 4.9 says "book an appointment" and 5.0 says the same, but 5.0 also triggers the *same* text as 7.9. What information do those two users actually need to differ on, and would one more band fix it?
- Real triage systems use `AND`/`OR` combinations (fever AND rash) rather than pure scores. Where in this pipeline would you insert a rule that *overrides* the score, and why should top-level medical logic live outside the numeric banding?

## Step 5: Build the interactive CLI

The last step wires everything to a person: the CLI lists the catalog, lets the user pick symptoms from numbered menu, collects severity and duration for each, runs the whole pipeline, and prints the summary. A `demo` default keeps the script runnable without typing.

### 5.1 Add input handling and a default demo

**👟 Starter hint:** Number the `SYMPTOM_LABELS` for the menu, accept comma-separated numbers, translate them back to machine keys, then call `summarize`. Guard the interactive path behind an explicit `cli` argument so the default run stays non-interactive.

```python
# checker.py (continued)
import sys

def run_cli() -> None:
    order = sorted(SYMPTOM_LABELS)
    print("Which symptoms? Enter numbers, comma-separated:")
    for i, key in enumerate(order, 1):
        print(f"  {i:>2}. {SYMPTOM_LABELS[key]}")

    raw = input("> ")
    try:
        picks = [int(x.strip()) for x in raw.split(",")]
    except ValueError:
        print("Please enter numbers like: 1, 3, 7"); return

    present = {order[p - 1] for p in picks if 1 <= p <= len(order)}
    if not present:
        print("No valid symptoms selected. Nothing to score."); return

    severities = {}
    durations_days = {}
    for key in present:
        sev = input(f"{SYMPTOM_LABELS[key]} severity (mild/moderate/severe): ").strip().lower()
        dur = input(f"{SYMPTOM_LABELS[key]} duration in days: ").strip()
        severities[key] = sev if sev in {"mild", "moderate", "severe"} else "moderate"
        try:
            durations_days[key] = float(dur)
        except ValueError:
            durations_days[key] = 1.0

    print("\n" + summarize(present, severities, durations_days))

def run_demo() -> None:
    severity = {"fever": "high", "body_aches": "severe", "fatigue": "moderate", "cough": "moderate"}
    duration = {"fever": 2, "cough": 3, "body_aches": 1, "fatigue": 10}
    print(summarize(demo, severity, duration))

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "cli":
        run_cli()
    else:
        run_demo()
```

The menu does input *sanitization* in three deliberate spots: `int(x.strip())` converts typed numbers and ignores whitespace, `if 1 <= p <= len(order)` silently drops out-of-range picks instead of crashing, and bad severity/duration answers fall back to recorded defaults (`moderate`, `1 day`) rather than aborting the session. The `demo` path exists because a notebook, CI run, or a first-time read needs a zero-input way to exercise the whole pipeline, the interactive `cli` mode needs a real human at a real keyboard.

**🎯 Expected output:** Running `uv run python checker.py` prints the demo summary (no input needed). Running `uv run python checker.py cli` shows the numbered menu, collects your answers, and prints a summary for the symptoms you picked.

**🩹 If it's off:** If `cli` mode crashes on a non-numeric pick, the `except ValueError` guard around the list comprehension is missing. If the menu keys don't match scored symptoms, `order` (from `SYMPTOM_LABELS`) and `KNOWLEDGE` machine keys disagree, the Step 1 check should have caught it. If `input()` blocks forever in a notebook, you're in the interactive path without a keyboard, stick to the no-argument demo there.

### 5.2 Verify the CLI end to end

**✅ Checklist**

- ✅ `uv run python checker.py` prints the demo summary without any input.
- ✅ `uv run python checker.py cli` lists a numbered menu, accepts comma-separated picks, and prints a summary.
- ✅ Garbage input like `abc` or `99` doesn't crash the CLI, it warns and carries on.
- ✅ Running both modes ends with the consultation disclaimer.

**🤔 Socratic Question(s)**

- Users will type the same symptom as "sore throat", "Sore Throat", and "throat". The menu sidesteps this with numbers, what is the cost of that cleanup, and how would a fuzzy-text matcher introduce *new* risks here that numbers don't have?
- The demo path is default and the interactive path is opt-in. In a safety-adjacent tool, why is defaulting to the least-interactive, deterministic path the defensible choice, and what would tempt you to invert it?

## ⚠️ Common pitfalls

- **Mixing human labels and machine keys.** Users type "itchy eyes", the knowledge base stores `itchy_eyes`; matching `s in present` against one and printing the other yields silent no-matches. Fix: keep `SYMPTOM_LABELS` as the only human↔machine translation and never hand raw user text to scoring.
- **Scores that exceed 10 or drift without bound.** Each term in `urgency_score` must be repaid by a `min(10, …)` cap, or a long-duration + severe case blows past the banding's designed range and a 12.4 "score" silently matches the urgent band.
- **A rank that ignores duration.** A `{"headache"}` for 9 days ranks like a fresh `{"headache"}`, the score can't explain chronic *anything*. The `chronic_bonus` term exists precisely so "lasts past a week" moves the score.
- **Band cutoffs ordered wrong.** If `BANDS` is ascending, a high score hits the wrong (first) band. Keep them descending and let the first `score >= cutoff` win, as in Step 4.
- **Treating the top ratio as a diagnosis.** The engine matches symptoms to known patterns; overlap does not equal causation, and the disclaimer line must survive every code path. Remove it from any one summary and you've overstepped what a rule engine can claim.

## What you just built

A working symptom triage engine with a real data model, a weighed knowledge base, normalized matching scores, a bounded urgency score blending severity and duration, four care bands, and a sanitized interactive CLI, all in pure Python with a disclaimer standing behind every recommendation. The transferable skill is *turning domain knowledge into scored data structures*: the same weighted-overlap-and-band pattern generalizes to job matching, quiz grading, feature gating, and any place a product must rank options against partial evidence.

:::tip[Run a fuller version without any local setup]
[`examples/symptom-checker/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/symptom-checker) in the course repo is a fuller version of the code above, with a richer symptom catalog and the CLI demo pre-run in the notebook. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Add a symptom *history* tab: track the user's scores over the last week of answers and surface "getting better / getting worse" as a band on its own.
- Let users type a body location (head, throat, gut) and filter the menu to symptoms in that area, a simple category field on each condition.
- Persist conditions to a separate `conditions.json` the engine loads at startup, so adding a condition never requires editing scoring code.
- Write a small `test_checker.py` pinning the score for five hand-picked cases (including the two examples from Step 3's questions), so a future refactor can't silently change triage results.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓