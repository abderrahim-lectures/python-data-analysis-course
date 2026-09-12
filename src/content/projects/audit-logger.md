---
title: "Build an Audit Logger"
description: "Append-only event log with a SHA-256 hash chain: every entry links to its predecessor, a verify pass proves nothing was altered, queries filter by severity and source, retention prunes old entries while keeping the chain valid, and a compliance export ships JSONL for dashboards."
difficulty: "intermediate"
estimatedMinutes: 90
xpReward: 100
tags: ["Security", "Backend", "Data Visualization"]
prerequisites:
  - "Python classes, methods, and instance state"
  - "Reading and writing text files line by line"
  - "Hashlib basics: what a SHA-256 hex digest is"
learningObjectives:
  - "Model an append-only event log whose rows carry a chained hash of their predecessor"
  - "Prove tamper-evidence by recomputing and comparing every link in the chain"
  - "Query the log by severity and source and aggregate counts for a dashboard"
  - "Prune old entries with retention while re-anchoring a still-valid chain"
  - "Export a JSONL compliance feed verified against the source log"
---

# 🛠️ 🔐 Build an Audit Logger

An audit log is the record you show the investigator *after* something went wrong: who did what, in which order, and, critically, whether any of it was quietly altered afterwards. A log file of text lines proves nothing by itself; a plain text edit looks identical to a real event. This project builds the structure that makes rewriting detectable: an append-only log where every entry carries a SHA-256 hash of its own content **plus** the hash of the previous entry, forming a chain. Alter one line anywhere and every subsequent link breaks; a single `verify()` pass reports exactly which entry was touched. Around that core you'll add queries by severity and source, a retention prune that keeps the chain valid, and a JSONL export for dashboards and compliance tools. Everything runs on the standard library and is deterministic, the same sixteen events verify the same way every time.

This assumes classes, methods, file I/O, and a first look at `hashlib.sha256`. It is an optional, ungraded project, see [Real-World Projects](/projects) for the full, growing list.

## 🎯 What you'll do

1. Write an append-only logger that stores events as one line each.
2. Add a hash chain, then prove it catches a doctored entry.
3. Query by severity and source, and count events per severity.
4. Prune old entries with retention while keeping verification green.
5. Export a JSONL compliance feed and human-readable summary.

## Where to run this

**Locally with `uv`** is the recommended path, the logger is pure standard library (`hashlib`, `pathlib`, `json`), so a `uv init` is all you need.

**Google Colab, Kaggle Notebooks, and Binder** run every step unmodified. Use a project-local path (e.g. `audit.log`) rather than a system path; notebooks and Binder both let that file live next to the code.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/audit-logger/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/audit-logger/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Faudit-logger%2Fnotebook.ipynb)

## Setup

Everything needed before the first event.

### Set up the project

```bash
uv init audit-logger
cd audit-logger
```

No dependencies. The log is a `.txt` file with one event per line; the logistic of "append-only" is just `open(..., "a")`.

**✅ Checklist**

- ✅ `uv init audit-logger` creates the project and a `main.py`.
- ✅ `uv run python3 -c "import hashlib, pathlib, json"` succeeds, all standard library.

**🤔 Socratic Question(s)**

- A log line like `INFO auth login ok` alone proves nothing about its own authenticity. What two properties must a *tamper-evident* log have beyond "it's a file someone wrote"?
- The chain hashes each entry against its predecessor, so the *order* is part of the evidence. Why does ordering matter for an audit log, what would a forged but re-ordered log hide?

## Step 1: An append-only event log

First, ordinary honest append-only logging: events become lines in a file. The tamper-evidence comes in Step 2.

### 1.1 The digest helper

**👟 Starter hint:** Write `digest(*parts)` that joins parts with `|` and returns the SHA-256 hex digest, the glue for every hash you'll compute.

```python
# main.py
import hashlib, pathlib, json

def digest(*parts):
    return hashlib.sha256("|".join(parts).encode()).hexdigest()

print(digest("1", "2025-06-01T10:00:00", "INFO", "auth", "login ok"))
```

`"|".join(parts)` makes the string you hash unambiguous: without a separator, `"a" + "bc"` and `"ab" + "c"` collide; with `|`, `("a","bc")` and `("ab","c")` differ in bytes. The hex digest is deterministic, same inputs, same output, forever, which is the property the whole chain leans on.

**🎯 Expected output:** A 64-character hex string (e.g. `f0c2…`): SHA-256 digests are always 64 hex chars regardless of input length.

**🩹 If it's off:** If the output length differs from 64, you're not calling `sha256` (`md5` gives 32). If `TypeError` appears, a non-string part slipped in, encode/`str()` it first.

### 1.2 Append events as lines

**👟 Starter hint:** Write `AuditLog(path)` with an `append(severity, source, message, ts)` that appends one pipe-joined line per event.

```python
# main.py (continued)
class AuditLog:
    def __init__(self, path):
        self.path = pathlib.Path(path)
        self._seq = 0

    def append(self, severity, source, message, ts="2025-06-01T10:00:00"):
        self._seq += 1
        payload = [str(self._seq), ts, severity, source, message]
        with self.path.open("a") as f:
            f.write("|".join(payload) + "\n")
        return self._seq

log = AuditLog("audit.log")
log.append("INFO", "auth", "login ok", ts="2025-06-01T10:00:00")
log.append("INFO", "auth", "logout ok", ts="2025-06-01T10:01:00")
print(log.path.read_text())
```

`open("a")` is the *mode* that makes the append-only promise real: each call writes at the end and never rewrites earlier bytes. The `seq` counter gives events an explicit order that survives even if timestamps are equal. The pipe-joined payload is the log's data record, the chain in Step 2 wraps around it.

**🎯 Expected output:**

```
1|2025-06-01T10:00:00|INFO|auth|login ok
2|2025-06-01T10:01:00|INFO|auth|logout ok
```

**🩹 If it's off:** If the file overwrites instead of appends, `open` used mode `"w"`. If lines run together, the trailing `\n` is missing from the write.

### 1.3 Have a genesis

**👟 Starter hint:** Add `GENESIS = digest("GENESIS")` so the first entry has a hash to point at.

```python
# main.py (continued)
GENESIS = digest("GENESIS")
print(GENESIS[:16], "...")
```

Every chain needs a first link's predecessor. `GENESIS` is that constant anchor: entry 1 points *at* it, and once entry 1 exists, the chain references only real entries. There's nothing secret about the string `"GENESIS"`, its role is to be a **fixed, known** starting point everyone verifies against.

**🎯 Expected output:** Sixteen hex chars followed by `...` (the full 64 are on the first line of Step 1.1's region, same helper, same function).

**🩹 If it's off:** If `GENESIS` varies between runs, you're hashing a time-dependent part. It must be a literal.

### 1.4 Verify the append layer

**✅ Checklist**

- ✅ Two `append` calls produce exactly two pipe-joined lines, in order.
- ✅ Reopening the same `AuditLog` path and appending writes the third line at the end.
- ✅ `GENESIS` is a constant, same value each interpreter run.

**🤔 Socratic Question(s)**

- Append-only is a *policy* here (you control the code that writes it). Where does the real proof of "nobody rewrote history" have to live, in the writing convention, or in something checkable later? That checkable thing is Step 2.
- The file has the events in clear text, readable by anyone. Is that a weakness for an *audit* log, and what would you add, encryption, signatures, or permissions, without breaking the chain?

## Step 2: The hash chain, and the tamper test

Now the payoff: each entry stores the previous entry's hash, making any edit break the chain. Then you verify it, and watch it catch a planted edit.

### 2.1 Link each entry to its predecessor

**👟 Starter hint:** In `append`, read the last stored hash (starting at `GENESIS`), compute the next link as `digest(*payload, prev)`, and store `prev` and the new hash on the line.

```python
# main.py (continued)
    def rows(self):
        return [line.split("|") for line in self.path.read_text().splitlines()]

    def _last_hash(self):
        if not self.path.exists() or not self.path.read_text().strip():
            return GENESIS
        return self.rows()[-1][-1]

    def append(self, severity, source, message, ts="2025-06-01T10:00:00"):
        self._seq += 1
        prev = self._last_hash()
        payload = [str(self._seq), ts, severity, source, message]
        h = digest(*payload, prev)
        with self.path.open("a") as f:
            f.write("|".join(payload + [prev, h]) + "\n")
        return self._seq, h

log.append("WARN", "payments", "retry #1", ts="2025-06-01T10:02:00")
row = log.rows()[-1]
print(row)
```

Each line is now seven fields: the five data fields, the previous hash, and the entry's own hash `digest(*payload, prev)`. The hash *includes* `prev`, so the order is part of the proof. The next entry reads this entry's last hash and wraps it forward, a literal chain, one link per line.

**🎯 Expected output:** A 7-field list whose last field is a 64-char hash, e.g. `['3', '2025-06-01T10:02:00', 'WARN', 'payments', 'retry #1', '…', '…']`.

**🩹 If it's off:** If the line has six fields, `payload + [prev, h]` wasn't joined. If the stored hash doesn't change between entries, `_last_hash` isn't reading the previous line.

### 2.2 Verify the chain

**👟 Starter hint:** Write `verify()` that walks the rows, recomputing each expected hash from the payload and `prev`, and returns `(ok, position)` where a break is.

```python
# main.py (continued)
    def verify(self):
        expected = GENESIS
        for i, row in enumerate(self.rows()):
            payload, prev, stored = row[:5], row[5], row[6]
            if prev != expected:
                return False, i
            expected = digest(*payload, prev)
            if stored != expected:
                return False, i
        n = len(self.rows())
        return (True, n) if n else (False, 0)

log.append("ERROR", "payments", "charge declined", ts="2025-06-01T10:03:00")
log.append("ERROR", "net", "timeout", ts="2025-06-01T10:04:00")
log.append("WARN", "payments", "charge recovered", ts="2025-06-01T10:05:00")
print("verify:", log.verify())
```

`verify` replays the exact function `append` used: start at `GENESIS`, and at each row confirm the stored `prev` matches where the walk is, then confirm the stored hash equals the hash that `append` would have written. An untouched chain walks all six rows to `(True, 6)`.

**🎯 Expected output:** `verify: (True, 6)`.

**🩹 If it's off:** If `(True, 6)` prints as `(False, 0)`, the payload slice in `verify` dropped the message field, many beginners use `row[:4]` and break every hash. Use `row[:5]` (all five data fields).

### 2.3 Plant a tamper and catch it

**👟 Starter hint:** Corrupt row 4's message, then verify again, the break should point exactly at that entry.

```python
# main.py (continued)
lines = open("audit.log").readlines()                 # read all lines first
fields = lines[3].rstrip("\n").split("|")
fields[4] = fields[4].replace("declined", "DECLINED")
lines[3] = "|".join(fields) + "\n"
open("audit.log", "w").write("".join(lines))          # truncate only at the end

print("after edit:", log.verify())
```

Rewriting the file isn't special, the point is the tool *notices*. Row 4's payload changed, so its stored hash no longer matches `digest(*payload, prev)`, and `verify` reports the break at row index 3. Any edit anywhere is caught, because each subsequent chain link would also disagree. (Restore the file, rewrite it from scratch, before Step 3.)

**🎯 Expected output:** `after edit: (False, 3)`, the tampered entry is entry 4 (index 3).

**🩹 If it's off:** If verification reports a later index, the edit changed bytes that feed a *later* stored hash only, check you mutated the message field (index 4), not the hash field (index 6).

### 2.4 Verify the chain

**✅ Checklist**

- ✅ Six honest entries verify as `(True, 6)`.
- ✅ Editing the message of entry 4 yields `(False, 3)`.
- ✅ Editing *any* entry, message, severity, or order, breaks at or after that entry.

**🤔 Socratic Question(s)**

- The chain catches edits but not the *deletion of the whole file* or a wholesale restore. What distinguishes tamper-evidence (this step) from digital signatures (your private key), and which concern does each solve?
- `verify` recomputes from `GENESIS` each time. If the log were one million entries, where would the cost go, and what cheap addition (store the last hash, re-verify from there) keeps spot-checks fast?

## Step 3: Query and aggregate

A tamper-evident pile of lines still needs to be *asked questions*. Step 3 adds filters and counts.

### 3.1 Filter by severity and source

**👟 Starter hint:** Write `select(severity=None, source=None)` returning matching rows as the four data fields people read.

```python
# main.py (continued)
    def select(self, *, severity=None, source=None):
        out = []
        for row in self.rows():
            if severity and row[2] != severity:
                continue
            if source and row[3] != source:
                continue
            out.append(row[:4])
        return out

# fresh, intact log with the full six-event feed
fresh = AuditLog("audit2.log")
for s, src, msg, ts in [
    ("INFO", "auth", "login ok", "2025-06-01T10:00:00"),
    ("INFO", "auth", "logout ok", "2025-06-01T10:01:00"),
    ("WARN", "payments", "retry #1", "2025-06-01T10:02:00"),
    ("ERROR", "payments", "charge declined", "2025-06-01T10:03:00"),
    ("ERROR", "net", "timeout", "2025-06-01T10:04:00"),
    ("WARN", "payments", "charge recovered", "2025-06-01T10:05:00"),
]:
    fresh.append(s, src, msg, ts=ts)

print([r[2:4] for r in fresh.select(severity="ERROR")])
print([r[:2] for r in fresh.select(source="payments")])
```

`select` is a pure filter over `rows()`: no state, no mutation, the same rows in, the same answers out, deterministically. Holding the *data* fields row[:4] (dropping the two hashes) makes the result list readable and keeps the hashes visible in `rows()` when you need to verify.

**🎯 Expected output:**

```
[['ERROR', 'payments'], ['ERROR', 'net']]
[['1', '2025-06-01T10:00:00'], ['3', '2025-06-01T10:02:00'], ['4', '2025-06-01T10:03:00'], ['6', '2025-06-01T10:05:00']]
```

**🩹 If it's off:** If a filter returns nothing, the severity/source casing differs from the log (stored `ERROR` vs queried `error`). If both filters return the whole log, `continue` skips were replaced by appends, or the keyword args never reached the method.

### 3.2 Counts for a dashboard

**👟 Starter hint:** Use `Counter` on the severity field to get per-severity totals in one line.

```python
# main.py (continued)
from collections import Counter

def counts(rows):
    return dict(Counter(r[2] for r in rows))

print(counts(fresh.rows()))
```

`Counter(r[2] for r in rows)` buckets every log line by severity and returns the tallies: these are the numbers your "errors last 24h" widget renders. Because it operates on `rows()` (which still carries the chain), the same data feeds both the dashboard and the verification.

**🎯 Expected output:** `{'INFO': 2, 'WARN': 2, 'ERROR': 2}`.

**🩹 If it's off:** If a severity is missing from the dict, `Counter` only keys what it counted, a severity with zero events won't appear. If counts sum to more than six, the file has leftover duplicate lines from Step 2's tamper demo, start fresh with `audit2.log`.

### 3.3 Verify the query layer

**✅ Checklist**

- ✅ `select(severity="ERROR")` returns exactly entries 4 and 5.
- ✅ `select(source="payments")` returns four entries: seqs 3, 4, and 6.
- ✅ `counts(rows)` returns `{'INFO': 2, 'WARN': 2, 'ERROR': 2}` on the intact log.

**🤔 Socratic Question(s)**

- `select` returns *copies* (`row[:4]`), never handles to internal rows. If a caller mutated a returned entry (changed a severity), would the file change too, and is that the property you want for an audit log?
- A dashboard shows `ERROR: 2`. Same file as Step 2's would-be tampered version shows different numbers. What does "verify the log *before* you trust the dashboard numbers" buy you that the dashboard alone can't?

## Step 4: Retention, prune without breaking the chain

Logs grow forever; retention policies cap them. Step 4 trims old entries **and** re-anchors the surviving chain so a pruned log still verifies.

### 4.1 Trim old entries

**👟 Starter hint:** Write `retain(since_seq)` that keeps rows with `seq >= since_seq` and rewrites the file.

```python
# main.py (continued)
    def retain(self, since_seq):
        kept = [r for r in self.rows() if int(r[0]) >= since_seq]
        with self.path.open("w") as f:
            expected = GENESIS
            for row in kept:
                payload = row[:5]
                prev = row[5]
                if prev != expected:
                    prev = expected
                expected = digest(*payload, prev)
                f.write("|".join(payload + [prev, expected]) + "\n")
        return len(kept)

print("kept:", fresh.retain(3))
print(fresh.path.read_text())
```

Dropping rows that carried the old chain's links would orphan the survivors' `prev` values. `retain` fixes that by restarting the walk at `GENESIS` and recomputing each survivor's `prev`/hash as it rewrites, the file shrinks, and the chain re-anchors to the first kept entry. Retention is *data* policy, not magic: keep the newest N, keep everything past a date, keep only a severity, the same rewrite logic handles it.

**🎯 Expected output:**

```
kept: 4
3|2025-06-01T10:02:00|WARN|payments|retry #1|…|…
4|2025-06-01T10:03:00|ERROR|payments|charge declined|…|…
5|2025-06-01T10:04:00|ERROR|net|timeout|…|…
6|2025-06-01T10:05:00|WARN|payments|charge recovered|…|…
```

**🩹 If it's off:** If `kept` is 0, you pruned everything (`since_seq` too high), harmless but check the count. If survivors' `prev` still points at dropped rows, the `if prev != expected: prev = expected` re-anchor is missing and the chain will fail verify.

### 4.2 Re-verify the pruned chain

**👟 Starter hint:** Run `verify()` again, the retained chain must come back green.

```python
# main.py (continued)
print("post-retention verify:", fresh.verify())
from collections import Counter
print(dict(Counter(r[2] for r in fresh.rows())))
```

A good retention policy leaves a *smaller but still trustworthy* log. `verify()` recomputing from `GENESIS` proves the pruned chain is self-consistent, and the counts show the policy's data: the two `INFO` login entries are gone, their evidence summarized only by what survived.

**🎯 Expected output:**

```
post-retention verify: (True, 4)
{'WARN': 2, 'ERROR': 2}
```

**🩹 If it's off:** If `verify()` returns `(False, …)` after pruning, the re-anchor rewrote `prev` but forgot to recompute that row's own hash, or the first kept row still stored the old (dropped) predecessor.

### 4.3 Verify retention

**✅ Checklist**

- ✅ `retain(3)` on a 6-entry log keeps exactly 4 rows and returns `4`.
- ✅ The pruned file re-verifies as `(True, 4)`.
- ✅ Counts after pruning reflect only the surviving rows.

**🤔 Socratic Question(s)**

- Retention keeps the newest N entries and re-anchors to `GENESIS`. A regulatory requirement might want "kept for 90 days then deleted", what does "deleted" *mean* for a chain that's supposed to be append-only, and who gets a copy before the prune runs?
- After pruning, the survivor list begins at `WARN retry #1`, the `INFO login ok` events are gone from the summary too. Would you want a *retention marker* entry ("two INFO events pruned on 2025-06-08") written into the log, and what would that do to the chain?

## Step 5: Compliance export

Audit logs get consumed, by dashboards, SIEMs, spreadsheets. Step 5 exports the log as data a consumer can use, plus a human-readable summary.

### 5.1 Export JSONL

**👟 Starter hint:** Write `export_jsonl()` returning one JSON object per row, fields intact.

```python
# main.py (continued)
    def export_jsonl(self):
        lines = []
        for row in self.rows():
            lines.append(json.dumps({"seq": int(row[0]), "ts": row[1],
                                     "severity": row[2], "source": row[3],
                                     "message": row[4]}))
        return lines

for line in fresh.export_jsonl():
    print(line)
```

JSON Lines (`.jsonl`) is the interchange format dashboards and log aggregators expect: one self-describing JSON object per line, each line a full event. Exported *after* validation (Step 4.2) it represents "the content we trust", separate from the raw row format the chain lives in, the export is the interface, the chain is the backstop.

**🎯 Expected output:**

```
{"seq": 3, "ts": "2025-06-01T10:02:00", "severity": "WARN", "source": "payments", "message": "retry #1"}
{"seq": 4, "ts": "2025-06-01T10:03:00", "severity": "ERROR", "source": "payments", "message": "charge declined"}
{"seq": 5, "ts": "2025-06-01T10:04:00", "severity": "ERROR", "source": "net", "message": "timeout"}
{"seq": 6, "ts": "2025-06-01T10:05:00", "severity": "WARN", "source": "payments", "message": "charge recovered"}
```

**🩹 If it's off:** If `message` shows a 64-char hash instead of the text, you exported `row[5]`/`row[6]` (the chain fields) instead of `row[4]`. If `json.dumps` errors, a field holds a non-string (all fields here are strings, check `seq` is first cast to `int`).

### 5.2 The human summary

**👟 Starter hint:** Print a short compliance summary: event count, per-source and per-severity tallies, and the verification verdict.

```python
# main.py (continued)
def summary(log):
    rows = log.rows()
    verdict, span = log.verify()
    return f"SIGNALS on {log.path.name}: verified={verdict} events={span} " \
           f"severities={dict(Counter(r[2] for r in rows))}"

print(summary(fresh))
```

One line a compliance reviewer can quote: "verified=True, events=4, severities=…". Tying the *verdict* into the same string as the counts prevents the dashboard from showing numbers the chain wouldn't endorse, the export and the trust statement travel together.

**🎯 Expected output:** `SIGNALS on audit2.log: verified=True events=4 severities={'WARN': 2, 'ERROR': 2}`.

**🩹 If it's off:** If `verified=False`, the export ran over a tampered/retained-misaligned file. Rebuild the log (Step 2.3 restore) and re-run, the summary is only as honest as the chain.

### 5.3 Verify the export

**✅ Checklist**

- ✅ `export_jsonl()` emits 4 lines for the retained log, messages intact.
- ✅ The summary line couples `verified=True` with the counts in one string.
- ✅ Round-tripping the JSONL (`json.loads`) reproduces the rows' data fields exactly.

**🤔 Socratic Question(s)**

- The export feeds a dashboard; the chain proves the file it exported from. A consumer who only ever saw `export_jsonl()` output has no chain, what would you ship alongside the JSONL so a downstream SIEM can check it, without shipping your whole codebase?
- `summary` reports `events=4` and `verified=True` together. If verification failed, would you rather the summary print `None` for counts, print them anyway with a warning, or refuse to run? Defend your choice with a compliance audience in mind.

## ⚠️ Common pitfalls

- **Payload slice off-by-one.** `row[:4]` drops the message and every recomputed hash silently disagrees with what `append` wrote. The payload is always five fields (`[:5]`); the chain fields are `row[5]` (prev) and `row[6]` (hash).
- **Mode `"w"` on the live log.** One wrong `open` flag wipes the chain mid-drug. Reserve `"w"` for `retain` and rebuilds; live appends must be `"a"`.
- **Pruning without re-anchoring.** Truncating the file but leaving survivors' `prev` pointing at removed rows makes the chain fail verification. Recompute `prev`/hash from `GENESIS` as you rewrite, as `retain` does.
- **Hashes that include time.** `digest(str(time.time()), …)` makes every verify nondeterministic. Fixed timestamps in the guide keep chains reproducible; if you log wall-clock times, they must be *stable fields*, written once, hashed over, not recomputed at verify time.
- **Querying the wrong field numbers.** Fields are `[0]=seq [1]=ts [2]=severity [3]=source [4]=message [5]=prev [6]=hash`. Filtering on `row[1]` filters timestamps, not severities.
- **Exporting chain fields as data.** Sending `row[5]`/`row[6]` to a dashboard leaks hashes into the message column. Export only `row[:5]`.

## What you just built

A tamper-evident, queryable, retentable audit logger: append-only event rows, a hash chain anchored at `GENESIS`, a `verify()` that points at the exact tampered entry, filters plus severity counts, a retention prune that re-anchors the chain, and a JSONL compliance export whose summary carries the verification verdict. The core idea is that *audit integrity is a design property, not an attitude*: you don't promise not to doctor the log, you make doctoring **detectable** by chaining every entry to its predecessor and recomputing the link on demand. That single trick, one hash per line, including the previous hash, is the same shape used by blockchains, git, and deduplicated backup manifests, because the object-graph is small and the proof is cheap.

:::tip[Run a fuller version without any local setup]
[`examples/audit-logger/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/audit-logger) in the course repo is the complete logger as a notebook, append, verify, tamper-demo, filters, retention, and the JSONL export, runnable in Colab/Kaggle/Binder. Clone the repo or [open it in a Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Where to go from here

- Add HMAC-style integrity: sign each entry's hash with a secret key (via `hmac.new`) so only key-holders can author valid entries, covert teamwork by outsiders is then caught too, not just accidental edits.
- Ship the JSONL to a file with `.write_text("\n".join(export_jsonl()))` and a dashboard that ingests it, plotting `ERROR` count per hour from the `ts` field.
- Implement `tamper_demo()` as a step that randomly flips one character in the log, re-verifies, and prints which entry broke, a built-in self-test for the class.
- Tie retention to a date (`retain_since("2025-06-01T10:03:00")`) and log a `RETENTION` marker entry each time it prunes, so removed history is itself evidenced.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓