---
title: "Build a Customer Support Dashboard"
description: "Manage support tickets with priority queues, skill-based routing, SLA tracking, and CSAT metrics."
difficulty: "beginner"
estimatedMinutes: 55
tags: ["cli", "csv", "dataclasses", "stdlib"]
prerequisites:
  - "Python basics (variables, loops, functions, dictionaries)"
learningObjectives:
  - "Model tickets as dataclasses and order a queue by priority"
  - "Route tickets to agents by skill match and workload"
  - "Track response and resolution times against SLA limits from CSV logs"
  - "Compute per-agent CSAT scores from survey data"
  - "Print a combined support summary report"
---

# 🎧 Build a Customer Support Dashboard

A support team's reality arrives as a stream of *unordered* events, a frantic billing complaint, a sleepy "how do I reset my password", a feature wish, and the whole craft of support tooling is imposing order on that stream: which ticket gets an agent first, which agent is even *able* to handle it, whether the team is answering inside its response-time promise, and whether customers are actually satisfied. This project builds the engine behind a support dashboard, a priority queue for tickets, skill- and load-based routing, SLA breach detection measured in hours from a real log file, and a CSAT summary, all rendered into one terminal report.

This assumes Python 101, functions, dictionaries, lists, and importing the standard `csv` module. Nothing from Data Analysis is required. It's optional and ungraded; see [Real-World Projects](/projects) for the full, growing list.

## 🎯 What you'll do

1. Model tickets as dataclasses with a priority enum and pull the highest priority from a queue.
2. Route each ticket to the free agent whose skills match its subject, falling back to the least busy.
3. Measure response and resolution times from a CSV log and flag every SLA breach.
4. Compute per-agent CSAT averages from a survey CSV.
5. Print one combined report: breaches + agent satisfaction in a single read.

## Where to run this

**Locally with `uv`** is the recommended path, this project reads real CSV files off disk, and the whole thing is standard library, so setup is a single command.

**GitHub Codespaces** is a zero-setup alternative: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node and Python are already installed) and run the same commands from a browser terminal.

**Google Colab, Kaggle Notebooks, or Binder** work well for the queue and routing logic, the notebook at [`examples/customer-support/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/customer-support/notebook.ipynb) runs every function on bundled sample CSVs. The honest limitation: the notebook's CSV files are fixed samples, whereas the local version lets you feed it *your* support logs.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/customer-support/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/customer-support/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcustomer-support%2Fnotebook.ipynb)

## Setup

`uv` is a single tool that replaces the "install Python, then pip, then a virtual environment tool" chain, and this project has no third-party imports, so setup is genuinely one step.

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
uv init customer-support
cd customer-support
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `customer-support/` exists with a `pyproject.toml`.
- ✅ `python -c "import csv"` succeeds, no third-party packages needed.

## Step 1: Model tickets and build a priority queue

A queue that serves tickets in *arrival* order would be a fine queue but a bad support queue: an urgent billing issue would sit behind three feature requests. The fix is a priority ordering, urgent over high over medium over low, with *arrival order within the same priority*, which is exactly what a sort by a reverse `Priority` value gives you.

### 1.1 Write the ticket model and the queue

**👟 Starter hint:** Define a `Priority` enum (an `IntEnum`, so it sorts numerically), a `Ticket` dataclass, and a `SupportQueue` that appends on `add` and pops the highest `priority` on `next`:

```python
# tickets.py
from dataclasses import dataclass
from enum import IntEnum

class Priority(IntEnum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    URGENT = 4

@dataclass
class Ticket:
    ticket_id: int
    customer: str
    subject: str
    priority: Priority
    assigned_to: str | None = None

class SupportQueue:
    def __init__(self) -> None:
        self._items: list[Ticket] = []

    def add(self, ticket: Ticket) -> None:
        self._items.append(ticket)

    def next(self) -> Ticket | None:
        if not self._items:
            return None
        self._items.sort(key=lambda t: t.priority, reverse=True)
        return self._items.pop(0)

    def __len__(self) -> int:
        return len(self._items)

if __name__ == "__main__":
    queue = SupportQueue()
    queue.add(Ticket(1, "Ana", "Can't log in", Priority.MEDIUM))
    queue.add(Ticket(2, "Bo", "Billing charge", Priority.URGENT))
    queue.add(Ticket(3, "Cam", "Feature idea", Priority.LOW))
    while (ticket := queue.next()) is not None:
        print(f"#{ticket.ticket_id} {ticket.priority.name}: {ticket.subject}")
```

`IntEnum` earns its keep here: `Priority.URGENT > Priority.LOW` works *because* it's an integer under the hood, so `sort(key=lambda t: t.priority, reverse=True)` orders the whole list with one expression, no custom comparator needed. The `pop(0)` inside `next` deliberately removes the served ticket, so a dashboard loop "keeps serving" until empty: the `while (ticket := queue.next()) is not None` pattern is the sentinel that stops the loop when the queue finally returns `None`.

**🎯 Expected output:**

```
#2 URGENT: Billing charge
#1 MEDIUM: Can't log in
#3 LOW: Feature idea
```

**🩹 If it's off:** If LOW comes out first, the `reverse=True` is missing, without it the lowest number sorts first. If tickets vanish between runs, remember `next()` is *destructive*: it removes the ticket, so an empty queue prints nothing the second time you loop.

### 1.2 Verify the queue

**✅ Checklist**

- ✅ Serving the sample queue yields `#2`, then `#1`, then `#3`, in that order.
- ✅ `len(queue)` decreases by exactly one after every `next()` call.
- ✅ An empty queue's `next()` returns `None` instead of raising `IndexError`.

**🤔 Socratic Question(s)**

- Two tickets share `Priority.URGENT`. The current code sorts by priority and pops `index 0`, does that guarantee *stroke of arrival order* between them, or does something else rewrite positions? Read the sort+pop pair and decide.
- The queue stores tickets in a plain list and sorts on *every* pop. For a small support desk that's fine, but what operation would become the bottleneck at 10,000 queued tickets, and what data structure exists precisely for "remove the max" without re-sorting?

## Step 2: Route tickets to the right agent

Sorting answers "which ticket first?"; routing answers "which *agent*?" The real constraint set: the agent must be free (under a max workload) and ideally *skilled* for this ticket. The pragmatic heuristic is text-matching, count how many of an agent's skills appear in the ticket subject and route to the best-matching free agent.

### 2.1 Write `Agent` and the `assign` function

**👟 Starter hint:** An `Agent` dataclass with a skills list and a live workload counter, then `assign` that filters to free agents, scores them by skill overlap with the subject, and returns the best match:

```python
# routing.py
from dataclasses import dataclass, field

from tickets import Ticket

@dataclass
class Agent:
    name: str
    skills: list[str] = field(default_factory=list)
    active_tickets: int = 0
    max_work: int = 3

    def is_free(self) -> bool:
        return self.active_tickets < self.max_work

def assign(ticket: Ticket, agents: list[Agent]) -> Agent | None:
    """Route to the best free skill match; returns None only if every
    agent is at max_work."""
    needle = ticket.subject.lower()

    def skill_score(agent: Agent) -> int:
        return sum(1 for skill in agent.skills if skill.lower() in needle)

    free = [a for a in agents if a.is_free()]
    if not free:
        return None
    best = max(free, key=skill_score)
    best.active_tickets += 1
    return best

if __name__ == "__main__":
    agents = [
        Agent("Priya", skills=["billing", "refund"]),
        Agent("Tom", skills=["login", "password"]),
        Agent("Una", skills=["feature"]),
    ]
    subjects = ["Billing charge gone wrong", "Can't log in",
                "New feature idea", "Refund request"]
    for subject in subjects:
        ticket = Ticket(hash(subject) % 1000, "customer", subject, 2)
        agent = assign(ticket, agents)
        print(f"-> {subject!r}: {agent.name if agent else 'no free agent'}")
```

Two decisions hide in twelve lines. `skill_score` counts *overlaps* rather than requiring an exact tag match, so a subject like "Billing charge gone wrong" scores 1 for the `billing` skill even though the words differ, a deliberately forgiving matcher for a demo, worth revisiting the moment false matches matter. `active_tickets` is incremented when a ticket is assigned, so the busy/free decision reflects *accepted workload*, and `max(free, key=skill_score)` picks the best match purely declaratively, with ties falling to the first free agent in the list.

**🎯 Expected output:**

```
-> 'Billing charge gone wrong': Priya
-> 'Can't log in': Tom
-> 'New feature idea': Una
-> 'Refund request': Priya
```

**🩹 If it's off:** If *every* ticket routes to Priya, `max(free, key=skill_score)` is picking the highest sum, check that `score` uses `in needle`, not `== needle`. If a ticket routes to an agent already at `max_work`, the `is_free()` filter isn't in the list comprehension, a busy agent is never even a candidate.

### 2.2 Verify routing

**✅ Checklist**

- ✅ All four sample subjects route to the skill-matched agent.
- ✅ Setting every agent's `active_tickets` to `max_work` makes `assign` return `None`, the "all busy" case degrades to a queue, not a crash.
- ✅ After a ticket is assigned, that agent's `active_tickets` went up by exactly one.

**🤔 Socratic Question(s)**

- The skill matcher counts substring hits. What's a real subject that would score a *false positive* for a skill (hint: "password reset" containing "pass"), and what would a more exact matching strategy cost you in effort?
- `active_tickets` increments at assignment and is never decremented in this project. What behavior breaks if you never release agents, and where in a real support system would that decrement happen?

## Step 3: Track SLA compliance over time

SLAs are promises with clock math attached: respond within 4 hours, resolve within 24. The raw material is a *log*, for each ticket, when it opened, when someone first responded, when it resolved. This step turns CSV text into hour differences and compares each against the promise.

### 3.1 Load the log and measure breaches

**👟 Starter hint:** Write a sample `support_log.csv` with one row per ticket, load it with `csv.DictReader`, convert ISO-ish timestamps to hourly floats with a small helper, and compare `response`/`resolution` hours against thresholds:

```python
# sla.py
import csv
from datetime import datetime

LOG = """ticket_id,opened_at,responded_at,resolved_at
1,2026-09-01 09:00,2026-09-01 09:30,2026-09-01 10:00
2,2026-09-01 09:00,,2026-09-01 09:15
3,2026-09-01 09:00,2026-09-01 20:00,
4,2026-09-01 09:00,2026-09-01 09:05,2026-09-02 11:00
"""

def load_activity(path: str = "support_log.csv") -> list[dict]:
    with open(path, newline="") as f:
        return list(csv.DictReader(f))

def hours(ts: str, fmt: str = "%Y-%m-%d %H:%M") -> float | None:
    """Parse a timestamp to hours-since-epoch; None for an empty cell."""
    if not ts.strip():
        return None
    return datetime.strptime(ts, fmt).timestamp() / 3600

def sla_report(log: list[dict], response_sla: int = 4, resolution_sla: int = 24) -> list[str]:
    breaches = []
    for row in log:
        opened = hours(row["opened_at"])
        responded = hours(row["responded_at"])
        resolved = hours(row["resolved_at"])
        if opened is not None and responded is not None and (responded - opened) > response_sla:
            breaches.append(
                f"ticket {row['ticket_id']}: response {(responded - opened):.1f}h > {response_sla}h SLA"
            )
        if opened is not None and resolved is not None and (resolved - opened) > resolution_sla:
            breaches.append(
                f"ticket {row['ticket_id']}: resolution {(resolved - opened):.1f}h > {resolution_sla}h SLA"
            )
    return breaches

if __name__ == "__main__":
    with open("support_log.csv", "w") as f:
        f.write(LOG)
    for breach in sla_report(load_activity()):
        print(breach)
```

The empty-cell policy is the subtle correctness call: `hours("")` returns `None`, and every comparison guards with `is not None`, an unresolved ticket is `None`, *not* zero, which means you never report a fake "instant" breach for a ticket nobody has ever touched. The `.1f` formatting is cosmetic but meaningful: someone reading "11.0h" instantly sees "over 4h", while a raw float like `11.000000000000002` invites needless second-guessing.

**🎯 Expected output:**

```
ticket 3: response 11.0h > 4h SLA
ticket 4: resolution 26.0h > 24h SLA
```

**🩹 If it's off:** If *every* ticket reports a breach with absurd hour values, `hours` probably parsed the format wrong and `strptime` is silently... it isn't, a format mismatch raises `ValueError`. If nothing breaches even for ticket 3, check whether `LOG` actually contains ticket 3's `responded_at` of `2026-09-01 20:00`, and that the file was rewritten before `load_activity` reads it.

### 3.2 Verify the SLA math

**✅ Checklist**

- ✅ Exactly two breaches print: ticket 3 response, ticket 4 resolution.
- ✅ Ticket 2's *empty* response cell produces no response breach, a not-yet-answered ticket is not an instant violation.
- ✅ Conversion: `hours("2026-09-02 11:00") - hours("2026-09-01 09:00")` equals `26.0`.

**🤔 Socratic Question(s)**

- An unanswered ticket has `responded_at=""`, so response time is `None`, but wait, is an unanswered ticket *breaching right now* or merely *unmeasurable right now*? Which choice is more honest, and what would an implementation that treats empty as `0` wrongly claim?
- `sla_report` hardcodes the promises as default arguments. What changes about the function's usefulness if a *per-ticket* SLA (priority URGENT gets 1 hour, LOW gets 24) replaces the single threshold, and which layer should own that mapping?

## Step 4: Compute CSAT from surveys

Throughput says nothing about *feelings*; CSAT (customer satisfaction) does, typically a post-ticket survey where a customer rates from 1 to 5. The honest aggregation averages per agent so the report answers both "how are we doing overall" and "who's carrying the rating".

### 4.1 Load surveys and summarize per agent

**👟 Starter hint:** A `csat.csv` of `agent,rating` survey rows, loaded with `csv.DictReader`, bucketed with a `defaultdict(list)`, then averaged per agent:

```python
# csat.py
import csv
from collections import defaultdict

SURVEYS = """agent,rating
Priya,5
Tom,4
Priya,4
Una,3
Tom,5
Priya,5
"""

def load_surveys(path: str = "csat.csv") -> list[dict]:
    with open(path, newline="") as f:
        return list(csv.DictReader(f))

def summarize(surveys: list[dict]) -> dict[str, float]:
    per_agent: dict[str, list[int]] = defaultdict(list)
    for row in surveys:
        per_agent[row["agent"]].append(int(row["rating"]))
    return {name: sum(vals) / len(vals) for name, vals in per_agent.items()}

if __name__ == "__main__":
    with open("csat.csv", "w") as f:
        f.write(SURVEYS)
    for agent, avg in summarize(load_surveys()).items():
        print(f"{agent}: {avg:.1f}/5")
```

`defaultdict(list)` removes the whole `if agent not in per_agent: per_agent[agent] = []` ceremony: appending to a key that doesn't exist auto-creates a list. The one-line comprehension on the way out turns each list into its mean. The `int(row["rating"])` cast is the entire "trust the file" gamble, CSV gives you *strings*, and dividing a string would crash a plain `sum`; the cast moves that failure to the load point where it's readable.

**🎯 Expected output:**

```
Priya: 4.7/5
Tom: 4.5/5
Una: 3.0/5
```

**🩹 If it's off:** If a `TypeError: unsupported operand type(s) for/: 'int' and 'str'` appears, a rating cell is missing the `int(...)` cast. If Priya's average looks wrong, check that *all three* of her survey rows (5, 4, 5) made it into the CSV, a missing line quietly changes the mean.

### 4.2 Verify CSAT

**✅ Checklist**

- ✅ `summarize(load_surveys())` returns `{'Priya': 4.666..., 'Tom': 4.5, 'Una': 3.0}`.
- ✅ A survey file with one row still works (no division-by-zero on non-empty input).
- ✅ Every rating is cast to `int` *before* arithmetic, string `"5"` + `"4"` would concatenate, not sum.

**🤔 Socratic Question(s)**

- CSAT aggregates per *agent*. What other grouping would a support manager want (per queue, per shift, per product area), and how much of `summarize` has to change per grouping, or does it already *mean* "group by any one column"?
- The mean rewards consistency and punishes everything equally. What does a 3.5 average *hide* about a 30-agent team where half score 5 and half score 2, and what aggregate would show that?

## Step 5: The combined report

Every metric so far lives in its own script. The final step composes them into the artifact a stakeholder actually reads: one `report.py` that surfaces SLA breaches and agent CSAT together, because a support team that answers fast but makes customers angry needs to see *both* numbers at once.

### 5.1 Compose the report

**👟 Starter hint:** Reuse every loader and aggregator you've built, `load_activity` → `sla_report`, `load_surveys` → `summarize`, and print both sections with simple `===` headers, sorting agents by CSAT so the list reads top-to-bottom:

```python
# report.py
from csat import load_surveys, summarize
from sla import load_activity, sla_report

def build_report(log_csv: str = "support_log.csv", csat_csv: str = "csat.csv") -> None:
    print("=== SLA breaches ===")
    breaches = sla_report(load_activity(log_csv))
    print("\n".join(breaches) if breaches else "no breaches - all within SLA")

    print("\n=== CSAT by agent (best first) ===")
    for agent, avg in sorted(
        summarize(load_surveys(csat_csv)).items(),
        key=lambda pair: pair[1],
        reverse=True,
    ):
        print(f"  {agent}: {avg:.1f}/5")

if __name__ == "__main__":
    build_report()
```

Every line here is reuse, the report contains *no new business logic*, only presentation. That's the design worth copying: the composite layer stays brittle-safe by owning only "call the existing functions, order the output". `sorted(..., key=lambda pair: pair[1], reverse=True)` sorts by the *average*, the `[1]` index of each `(agent, avg)` pair, which keeps the display "best first" without touching the CSAT function.

**🎯 Expected output:**

```
=== SLA breaches ===
ticket 3: response 11.0h > 4h SLA
ticket 4: resolution 26.0h > 24h SLA

=== CSAT by agent (best first) ===
  Priya: 4.7/5
  Tom: 4.5/5
  Una: 3.0/5
```

**🩹 If it's off:** A `FileNotFoundError` means the report can't find the CSVs, run it from the folder where Steps 3–4 wrote them, or pass paths (`build_report("logs/support_log.csv", ...)`). If agent order is alphabetical instead of best-first, the `reverse=True` is missing from the `sorted`.

### 5.2 Verify the report

**✅ Checklist**

- ✅ `uv run python report.py` prints both sections exactly in the order above.
- ✅ Removing the `sla_report` call's file argument and passing an empty-log path shows `no breaches`.
- ✅ `report.py` contains no duplicated CSV-reading or aggregation code, it imports it.

**🤔 Socratic Question(s)**

- The report orders agents best-first, but a manager sorting this way might reward the top name without asking *why* Una scores 3.0, what's the argument that the report should also print volume (number of surveys) next to the average, and what appears when you do?
- `build_report` strings two independent analyses together with `print`. Where's the pressure to evolve this into producing a *file* (JSON/HTML) instead of terminal text, and what stays the same if that happens?

## ⚠️ Common pitfalls

- **Popping wrong end of the queue.** `pop(0)` after a descending sort is correct; `pop()` (last element) after an *ascending* sort serves the opposite end. One reversed word silently turns the triage upside down.
- **Letting busy agents stay in the candidate pool.** The routing filter `is_free()` is not a hint, removing it routes tickets onto overloaded agents and the whole workload system lies. Keep the filter inside `assign`.
- **Treating empty cells as zero.** `hours("")` must mean "not measured", never `0`. Summing an unanswered ticket as instantly-resolved fabricates fake SLA data. The `is not None` guards are the contract.
- **Forgetting CSV gives strings.** `row["rating"]` is `"5"`, not `5`. Division and comparison break until you cast; cast at load time so one failure is readable.
- **Mixing date *formats*.** `%Y-%m-%d %H:%M` and `%Y/%m/%d` are both valid timestamps and mutually unparseable. Standardize on one format in the log before any `strptime` runs.

## What you just built

A real support dashboard engine: tickets modeled as data, a priority queue that sorts *and* serves, skill-and-load-aware routing, SLA math measured in hours from an actual CSV log, per-agent CSAT, and one composite report, all standard library, all runnable from a terminal. The transferable skill is measuring a service against promises: any operation with timelines (deliveries, deployments, responses) can be modeled as "record timestamps, compute deltas, compare to a threshold, surface breaches."

:::tip[Run a fuller version without any local setup]
[`examples/customer-support/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/customer-support) in the course repo has these complete scripts plus sample CSVs. Or open the whole repo in a [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Where to go from here

- Add **workload balance to routing**: among tie-scores, prefer the agent with the fewest `active_tickets`, one extra line in `max(...)`'s key function.
- Persist the queue between runs by dumping `SupportQueue` to JSON on exit and reloading on start, the tickets are already serializable dataclasses.
- Emit the report as a **static HTML file** that a team could open in a browser, using an f-string template wrapped around the same `SLA breaches`/`CSAT` data.
- Add per-priority SLAs (URGENT 1h, HIGH 4h, MEDIUM 8h, LOW 24h) by passing the ticket's `Priority` through `sla_report`, the honest answer to the Step 3 Socratic question.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓