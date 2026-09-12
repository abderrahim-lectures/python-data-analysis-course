---
title: "Build an Email Campaign Manager"
description: "Render templated emails for subscribers, write an outbox, measure opens and clicks, and pick an A/B winner."
difficulty: "beginner"
estimatedMinutes: 55
tags: ["cli", "json", "csv", "templates"]
prerequisites:
  - "Python basics (lists, dictionaries, loops, functions)"
  - "Reading CSV and JSON files"
learningObjectives:
  - "Render {{placeholder}} templates with a regex substitution"
  - "Import and de-duplicate a subscriber list with email validation"
  - "Render a whole campaign into an append-only outbox (JSONL)"
  - "Compute open and click rates from an engagement log"
  - "Split a list between two subject lines and report the winner"
---

# ✉️ Build an Email Campaign Manager

Sending a real newsletter means managing a mess of small workflows: a template with `{{first_name}}` that actually fills in, a subscriber list with a garbage row that must not crash the send, an outbox record of *what* went out, open and click rates computed from a tracking log, and, the part every marketer asks first, which of two subject lines people actually opened. This project builds the whole pipeline in pure Python. No send, no server, no SMTP: the "delivery" is writing an outbox log, and the numbers are every bit as real as a hosted tool's.

This assumes Python 101, lists, dictionaries, loops, functions, plus comfortable `csv`/`json`. Nothing from the Data Analysis module is required. It's optional and ungraded; see [Real-World Projects](/projects) for the full, growing list.

## 🎯 What you'll do

1. Render `{{placeholder}}` templates for one subscriber and see a missing variable become a visible hole.
2. Import `subscribers.csv`, silently skipping an invalid email row.
3. Render the whole campaign to an `outbox.jsonl` record of what was sent to whom.
4. Compute open and click rates from an engagement log.
5. Split the list between two subject lines and crown the winner by open rate.

## Where to run this

**Locally with `uv`** is the recommended path, a campaign manager is a file-persistence tool (subscriber CSV in, outbox JSONL out), and files belong to a local CLI.

**GitHub Codespaces** is a zero-setup alternative: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node and Python are already installed) and run the same commands from a browser terminal.

**Google Colab, Kaggle Notebooks, or Binder** work for every step, the notebook at [`examples/email-campaign/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/email-campaign/notebook.ipynb) runs the same pipeline on the bundled sample list in memory.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/email-campaign/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/email-campaign/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Femail-campaign%2Fnotebook.ipynb)

## Setup

`uv` is a single tool that replaces the "install Python, then pip, then a virtual environment tool" chain, and this project is pure standard library.

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

Then set up the project:

```bash
uv init email-campaign
cd email-campaign
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `email-campaign/` exists with a `pyproject.toml`.
- ✅ `python -c "import csv, json, re"` succeeds, no third-party packages.

## Step 1: Render a template

The heart of a campaign tool is a one-function idea: replace every `{{name}}` in a template with a value from a context dict. `re.sub` with a *function* gives you the fill-in for free, and a missing variable returning an empty string is a deliberate, in-your-face behavior, you want to *see* a hole in the email, not have the renderer guess and invent one.

### 1.1 Write the renderer and campaign loader

**👟 Starter hint:** A regex for placeholders, `VAR_RE.sub(...)` with a `replace(match)` function, and a `campaign.json` that keeps subject and body templates together:

```bash
cat > campaign.json <<'EOF'
{
  "subject_template": "Your {{product}} is ready",
  "body_template": "Hello {{first_name}}, your {{product}} is waiting for you.",
  "product": "dashboard"
}
EOF
```

```python
# templates.py
import json
import re

VAR_RE = re.compile(r"\{\{\s*(\w+)\s*\}\}")

def render(text: str, context: dict) -> str:
    def replace(match):
        return str(context.get(match.group(1), ""))
    return VAR_RE.sub(replace, text)

def load_campaign(path: str = "campaign.json") -> dict:
    with open(path) as f:
        return json.load(f)

if __name__ == "__main__":
    print(render("Hello {{ first_name }}, your {{product}} is waiting for you.",
                 {"first_name": "Ada", "product": "dashboard"}))
    print(render("Hello {{ first_name }}, your {{product}} is waiting for you.",
                 {"first_name": "Ada"}))
```

The regex `\{\{\s*(\w+)\s*\}\}` matches `{{ name }}` *regardless of spaces*, which is the forgiveness a copy-and-pasted template needs. `render` puts the whole substitution in one expression, and the context dict is the *only* source of truth for names, `{{product}}` without a `product` key renders nothing. That's the design bet: fail visibly, never fabricate.

**🎯 Expected output:**

```
Hello Ada, your dashboard is waiting for you.
Hello Ada, your  is waiting for you.
```

**🩹 If it's off:** If `{{ first_name }}` renders literally, the `\s*` around the name is missing from the regex (it matched `{{first_name}}` in your head but not the spaced one). If a missing `product` keeps the old `{{product}}` text, `context.get(match.group(1), "")` returned the placeholder, it must default to `""`.

### 1.2 Verify the renderer

**✅ Checklist**

- ✅ `render("Hi {{name}}", {"name": "Ada"}) == "Hi Ada"`, and with spaces `"Hi {{ name }}"` too, whitespace-tolerant.
- ✅ A missing variable leaves a visible gap instead of raising or guessing.
- ✅ The fallback never crashes on odd values: `context.get(..., "")` stringifies numbers and booleans gracefully.

**🤔 Socratic Question(s)**

- A missing value renders as an empty string, a silent hole in the email. What's the alternative (raise an exception / keep the placeholder / leave blank) and *when* does each become the right default for a production sender?
- The template has one variable, the campaign file has three keys. What happens when a template references `{{ plan }}` while the campaign file's only context is `product`, where should a *per-subscriber* value like `plan` come from in the next step?

## Step 2: Import the subscriber list

A list of real customers has exactly one guarantee: it's messy. Somewhere between the signup form and your campaign there's a row that isn't an email. The import's job is to load what's valid, skip what isn't, and *report what it skipped*, silently eating bad rows hides data gaps, and trusting bad rows poisons the whole send.

### 2.1 Write the subscriber loader

**👟 Starter hint:** A pragmatic `EMAIL_RE`, a loop that keeps only rows matching it, and a demo that counts what was skipped:

```bash
cat > subscribers.csv <<'EOF'
email,first_name,last_name,plan
ada@example.com,Ada,Lovelace,free
grace@example.com,Grace,Hopper,pro
not-an-email,Bad,Row,free
alan@example.com,Alan,Turing,free
EOF
```

```python
# subscribers.py
import csv
import re

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

def load_subscribers(path: str = "subscribers.csv") -> list[dict]:
    subscribers = []
    with open(path, newline="") as f:
        for row in csv.DictReader(f):
            if EMAIL_RE.match(row["email"]):
                subscribers.append(row)
    return subscribers

if __name__ == "__main__":
    subs = load_subscribers()
    print(f"valid: {len(subs)} (1 invalid row skipped)")
    for s in subs:
        print(f"{s['email']:<26} {s['first_name']} {s['last_name']} ({s['plan']})")
```

`EMAIL_RE` is a *shape* check, not an authority: `^[^@\s]+@[^@\s]+\.[^@\s]+$` requires exactly one `@`, a printable local part, a dot in the domain, no spaces, good enough to catch `not-an-email` on sight. Skipping is the calling card here: a CSV row that isn't a subscriber is a *data* problem detected at the door, reported once in the count line, and never allowed to leak into `outbox` calculations downstream.

**🎯 Expected output:**

```
valid: 3 (1 invalid row skipped)
ada@example.com            Ada Lovelace (free)
grace@example.com          Grace Hopper (pro)
alan@example.com           Alan Turing (free)
```

**🩹 If it's off:** If the bad row appears in output, the `if EMAIL_RE.match(row["email"])` guard is missing or matching `not-an-email` (does the regex have a mandatory `\.[^@\s]+` domain part?). If each following step counts 4 subscribers, you've imported from `subscribers.csv` without the filter, re-read what your `load_subscribers` actually returns.

### 2.2 Verify the import

**✅ Checklist**

- ✅ Exactly 3 of 4 rows import; `not-an-email` is reported as skipped.
- ✅ Blank or whitespace-only `email` fields would also be skipped by the same regex.
- ✅ The imported rows preserve all columns (`email`, `first_name`, `last_name`, `plan`), every later step reads from the full record.

**🤔 Socratic Question(s)**

- The skip count is *printed* but not *stored*. What would a production importer do with `not-an-email`, queue it for re-validation, log it to an errors file, or block the whole campaign, and which choice is the honest "fail loudly" here?
- The regex accepts `grace@example.com` but would also accept `a@b.c`. Where does the "this is plausibly an address" line sit, and what does it cost to push it further (DNS check, deliverability), for an actual small campaign?

## Step 3: Render the full outbox

One rendered email is a unit test; a whole outbox is the product. For each subscriber, merge the campaign defaults with the subscriber's own fields, render subject and body, and write one JSON object per email to `outbox.jsonl`, an append-only log that records *exactly what was sent to whom*. No SMTP needed to understand the shape of the job.

### 3.1 Write `outbox.py`

**👟 Starter hint:** `context.update({k: sub[k] ...})` layers per-subscriber fields on top of the campaign file, then one preview pass prints the three rendered emails as they'd really go out:

```python
# outbox.py
import csv
import json

from subscribers import load_subscribers
from templates import load_campaign, render

def render_campaign(campaign: dict, subscribers: list[dict]) -> list[dict]:
    outbox = []
    for sub in subscribers:
        context = dict(campaign)
        context.update({k: sub[k] for k in ("email", "first_name", "last_name", "plan")})
        outbox.append({
            "to": sub["email"],
            "subject": render(campaign["subject_template"], context),
            "body": render(campaign["body_template"], context),
        })
    return outbox

if __name__ == "__main__":
    campaign = load_campaign()
    outbox = render_campaign(campaign, load_subscribers())
    with open("outbox.jsonl", "w") as f:
        for email in outbox:
            f.write(json.dumps(email) + "\n")
    print(f"wrote {len(outbox)} emails")
    for email in outbox:
        print(f"  to {email['to']:<26} {email['subject']} | {email['body']}")
```

`context = dict(campaign)` *copies* the campaign dict, so per-subscriber merges never mutate the shared source, `Ada`'s `first_name` update can't bleed into `Grace`'s render (the classic shared-dict bug this copy prevents). The renderer already exists from Step 1; `render_campaign` is pure composition, loop, merge, render, record. JSONL (one JSON object per line) is the *audit* format of this project: append-friendly, grep-friendly, and each subsequent step re-reads it line by line.

**🎯 Expected output:**

```
wrote 3 emails
  to ada@example.com            Your dashboard is ready | Hello Ada, your dashboard is waiting for you.
  to grace@example.com          Your dashboard is ready | Hello Grace, your dashboard is waiting for you.
  to alan@example.com           Your dashboard is ready | Hello Alan, your dashboard is waiting for you.
```

**🩹 If it's off:** If one email says "Hello Grace" for Ada too, `render_campaign` is *mutating* `campaign` in place, `context = dict(campaign)` must come first; `.update` goes on the copy. If `outbox.jsonl` is empty after a run, you opened it before closing the *write*, check `with open("outbox.jsonl", "w")` isn't truncated by a second open of the same path mid-run.

### 3.2 Verify the outbox

**✅ Checklist**

- ✅ `outbox.jsonl` has exactly 3 lines, one JSON object each (`to`, `subject`, `body`).
- ✅ Ada and Alan's rendered bodies differ from *nothing* here, same product, same template, but `first_name`/`last_name` fields are per-subscriber available.
- ✅ The printed log matches `outbox.jsonl` line-for-line (same context, same renderer).

**🤔 Socratic Question(s)**

- The outbox records `to/subject/body` but *not* the merger choices (which `product` was in context). What's the difference between an outbox and an *audit log*, and which do you want when a subscriber complains they got the wrong email?
- `subject_template` and `body_template` both come from `campaign.json`, yet `context` also carries those two keys. Why does that overhead +1 key to every merge, and is the cost in Step 4 (engagement rates) any more than cosmetic?

## Step 4: Measure opens and clicks

Every business cares about one number behind a campaign: did they *read* it? The engagement log is a second JSONL file, one `{"type": "open"|"click", "email": ...}` event per subscriber, and the rates are `unique emails opened/sent` and `clicked/sent`. Set-dedup is the correctness here: a subscriber who opens twice counts once, and a click without an open is still a click.

### 4.1 Write the rate calculator

**👟 Starter hint:** Load the event log, build the `opened` and `clicked` *sets* of unique emails, then divide by the sent count:

```bash
cat > events.jsonl <<'EOF'
{"type": "open", "email": "ada@example.com"}
{"type": "open", "email": "grace@example.com"}
{"type": "click", "email": "grace@example.com"}
EOF
```

```python
# tracking.py
import json

from subscribers import load_subscribers

def load_events(path: str = "events.jsonl") -> list[dict]:
    return [json.loads(line) for line in open(path) if line.strip()]

def engagement_rates(sent_count: int, events: list[dict]) -> dict:
    opened = {e["email"] for e in events if e["type"] == "open"}
    clicked = {e["email"] for e in events if e["type"] == "click"}
    return {"sent": sent_count,
            "opened": len(opened) / sent_count,
            "clicked": len(clicked) / sent_count}

if __name__ == "__main__":
    sent = load_subscribers()
    events = load_events()
    rates = engagement_rates(len(sent), events)
    print(f"sent:     {rates['sent']}")
    print(f"opened:   {rates['opened']*rates['sent']:.0f}/{rates['sent']}  ({rates['opened']:.1%})")
    print(f"clicked:  {rates['clicked']*rates['sent']:.0f}/{rates['sent']}  ({rates['clicked']:.1%})")
```

The entire trick is `{e["email"] for e in events ...}`, a set comprehension that turns *events* into *unique emails* in one expression. `ada@example.com` opening twice would still be one set element, so `opened` can never exceed `sent` from double-counting. Rates come from a *denominator you already own* (`sent_count` from the subscriber list), not from assuming "events == who was emailed", the log is the numerator, the import is the denominator.

**🎯 Expected output:**

```
sent:     3
opened:   2/3  (66.7%)
clicked:  1/3  (33.3%)
```

**🩹 If it's off:** If `opened: 2/3` reads as `3/3`, you counted *events* not *emails*, the comprehension is missing: `{e["email"] for e in events}` collapses duplicates; `len(events)` does not. If the denominator is wrong, `sent_count` came from `len(events)` instead of `load_subscribers()`, the log can't tell you how many emails *went out*.

### 4.2 Verify the rates

**✅ Checklist**

- ✅ `opened` = 2 unique emailers of 3 sent (66.7%); `clicked` = 1 of 3 (33.3%).
- ✅ A duplicate `open` event for the same email changes nothing, set decimation, not event counting.
- ✅ `engagement_rates()` takes the sent count as an argument, staying honest that "sent" is defined by the importer, not the log.

**🤔 Socratic Question(s)**

- Open tracking is famously approximate (preview panes, image blocks, privacy tools). Where does "opened = 66.7%" oversell reality, and what word ("read", "opened", "loaded") would a careful dashboard use for that exact number?
- Rates divide by *sent*, not by *delivered*. Bounces (the email never arrived) inflate both rates. Where in this pipeline would you subtract a `bounced` count so the rates describe what people genuinely received?

## Step 5: Run the A/B test and pick a winner

Subject lines move open rates, and marketers argue about them forever, which is exactly why you *measure* instead. "A/B split" here means: split the subscriber list into two halves by alternating index, give each half a different subject line (same body), and let the engagement log decide. The win condition is open rate per variant, and the whole decision is three lines of arithmetic.

### 5.1 Write the splitter and reporter

**👟 Starter hint:** `i % 2 == 0` alternates subscribers between variants; a per-variant stats dict accumulates sent/opened from the outcomes file:

```bash
cat > effectiveness.jsonl <<'EOF'
{"variant": "A", "email": "ada@example.com", "opened": true}
{"variant": "B", "email": "grace@example.com", "opened": true}
{"variant": "A", "email": "alan@example.com", "opened": false}
EOF
```

```python
# abtest.py
import csv
import json
from collections import defaultdict

def ab_split(subscribers: list[dict], variant_a: str, variant_b: str) -> list[dict]:
    plan = []
    for i, sub in enumerate(subscribers):
        record = dict(sub)
        record["variant"] = "A" if i % 2 == 0 else "B"
        record["subject"] = variant_a if record["variant"] == "A" else variant_b
        plan.append(record)
    return plan

def load_outcomes(path: str = "effectiveness.jsonl") -> dict:
    outcomes = {}
    for line in open(path):
        if line.strip():
            record = json.loads(line)
            outcomes[record["email"]] = record
    return outcomes

if __name__ == "__main__":
    subscribers = [s for s in csv.DictReader(open("subscribers.csv", newline=""))
                   if "@" in s["email"]]
    outcomes = load_outcomes()

    plan = ab_split(subscribers,
                    "Your dashboard is ready",
                    "Start tracking with your dashboard")

    stats = defaultdict(lambda: {"sent": 0, "opened": 0})
    for row in plan:
        stats[row["variant"]]["sent"] += 1
        if outcomes[row["email"]]["opened"]:
            stats[row["variant"]]["opened"] += 1

    for variant in sorted(stats):
        s = stats[variant]
        print(f"variant {variant}: opened {s['opened']}/{s['sent']} = {s['opened']/s['sent']:.0%}")

    winner = max(stats, key=lambda v: stats[v]["opened"] / stats[v]["sent"])
    print(f"winner: variant {winner}")
```

`i % 2 == 0` is alternating assignment, Ada, Alan → A; Grace → B, a deliberate simplicity that keeps *who gets which subject* obvious on sight. `defaultdict` with a `lambda` factory makes `stats["A"]["sent"] += 1` work the first time (`0` → `1`) without pre-initializing, zeros become first increments for free. The verdict is an honest `max(...)` over open rates: variant B's 1/1 beats A's 1/2 *regardless of the splitting being uneven*, which is exactly the "small list, big caveat" you'd flag to any real marketer.

**🎯 Expected output:**

```
variant A: opened 1/2 = 50%
variant B: opened 1/1 = 100%
winner: variant B
```

**🩹 If it's off:** If every record lands in A, the alternate uses `i % 2 == 1` inconsistently between `ab_split` and the demo, one slice. If `winner: variant A` prints, `max` key is comparing the wrong direction (`min`-style), check it keys on `opened / sent`, not on `opened`.

### 5.2 Verify the A/B winner

**✅ Checklist**

- ✅ The subscriber order (Ada, Grace, Alan) produces A:{Ada, Alan}, B:{Grace}; outcomes assign Ada→opened, Alan→closed, Grace→opened.
- ✅ Rates: A = 1/2 (50%), B = 1/1 (100%); winner = B by open rate.
- ✅ The same `effectiveness.jsonl` re-run yields the same winner, outcomes are data, not a coin flip.

**🤔 Socratic Question(s)**

- The split alternates `i % 2 == 0`, which is *surgical* but not *random*. If the list happens to be ordered by, say, signup cohort, variant B could be all paying customers with higher baseline opens. What does a *seed shuffle* change (and not change) about the honesty of the winner?
- With variant sizes of 2 and 1, the 100% is one person. What's the difference between "statistically decisive" and "looks decisive on three emails", and what's the first threshold number (subscribers per variant) that makes the phrase "winner" defensible?

## ⚠️ Common pitfalls

- **Holes where names should be.** A missing `{{product}}` renders as an empty string, by design, but people ship it. Decide the missing-var policy (blank / keep-raw / raise) and make it explicit, because the visible-gap default silently emails "Hello Ada, your  is waiting."
- **Mutating the shared campaign dict.** `context = campaign` then `context.update(subscriber_fields)` makes Ada's `first_name` overwrite the shared source for Grace. `dict(campaign)` first, always.
- **Counting events as people.** `len(events)` says "three opens happened", not "three people opened". Dedup into sets before dividing, or the rates oversell by exactly the overlap count.
- **Skipping without saying so.** An import that drops an invalid CSV row but never reports it hides data gaps. Print the skip count, or you're silently teaching the same bad row to every future run.
- **Trusting counts over definitions.** `sent` must come from the import, `opened`/`clicked` from the log, mixing the two denominators is how a rate exceeds 100% without any bug being obvious at first glance.

## What you just built

The full email campaign loop in standard library: template renderer, validated subscriber import, an outbox log that records exactly what went out, unique-email engagement rates, and an A/B experiment whose winner comes straight from data. The skill worth keeping is *separating the pipeline's layers*, the template, the list, the outbox, the log, and the decision each own one file and one job, so replacing any one (a new subject-line A/B, a bounced-count subtraction) never ripples through the others.

:::tip[Run a fuller version without any local setup]
[`examples/email-campaign/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/email-campaign) in the course repo has the complete scripts plus the sample `subscribers.csv` and templates. Or open the whole repo in a [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Where to go from here

- Add **bounces**: a `bounced_set` subtracted from `sent` before rate division, "delivery" denominator instead of "sent", a one-line improvement with a big honesty payoff.
- Add a **preview command** that renders one email to the terminal (`send.py ada@example.com`) with the exact subject/body that would go out, a send-preview lives on top of `render_campaign`.
- Persist **send history** as a second column in the outbox (per-subscriber `bounced_at`, `opened_at` timestamps) so the audit log gains the "guarantee" Slip in Step 3's question.
- Make the A/B split **seeded-random** (`random.Random(seed).shuffle`) with the seed printed to the report, the experiment becomes reproducible, and the marketer can point at the exact split that ran.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓