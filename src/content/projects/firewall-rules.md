---
title: "Build a Firewall Rule Manager"
description: "Build a CLI tool that validates, simulates, and deploys firewall rules with conflict detection and rollback support."
difficulty: "intermediate"
estimatedMinutes: 55
tags: ["cli", "security", "data-validation"]
learningObjectives:
  - "Model firewall rules as Python dataclasses with validation"
  - "Detect rule conflicts and overlapping port ranges"
  - "Simulate traffic against a rule set to predict accept/deny outcomes"
  - "Generate deploy diffs and roll back to previous rule sets"
prerequisites: ["Python 101"]
---

# 🔥 Build a Firewall Rule Manager

Firewall rules are the guardrails of network security — a single misconfigured rule can open a port to the internet or block legitimate traffic silently. This project builds a CLI tool that manages a rule set as structured data: you write rules in Python, validate them for conflicts, simulate how real traffic would flow through the rules, and deploy changes as a diff against the current state with one-command rollback. The goal is a tool that makes firewall management auditable and reversible instead of scary and mysterious.

This assumes Python 101 — nothing from Data Analysis is required. Optional and ungraded; see [Real-World Projects](/docs/projects) for the full list.

## 🎯 What you'll do

1. Set up a project with `uv` and install the dependencies you'll need.
2. Model firewall rules as Python dataclasses with fields for action, protocol, port range, and source.
3. Write a validator that detects conflicting rules and invalid port ranges.
4. Build a traffic simulator that matches incoming packets against a rule set.
5. Implement diff-based deployment that shows exactly what changes before applying.
6. Add a rollback command that reverts to the previous rule set in one step.

## Where to run this

**Locally with `uv`** is the primary path — this is a CLI tool that reads and writes rule files on disk and simulates traffic patterns.

**Google Colab, Kaggle Notebooks, and Binder** work for trying the tool. The notebook installs the same packages and uses the same code; it uses sample rules and simulated traffic instead of touching real firewall configurations.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/firewall-rules/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/firewall-rules/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Ffirewall-rules%2Fnotebook.ipynb)

## Setup

Everything you need before writing a single rule: a Python environment, a package for building the CLI, and a project directory.

### Install `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Close and reopen your terminal, then confirm:

```bash
uv --version
```

### Scaffold the project

```bash
uv init firewall-rules
cd firewall-rules
uv add click pydantic
```

`click` builds the CLI interface, and `pydantic` gives us rule validation with clear error messages. The project structure keeps rules, validation, simulation, and deployment in separate files for clarity.

### Create the project structure

```bash
mkdir -p fw
touch fw/__init__.py fw/rules.py fw/validate.py fw/simulate.py fw/deploy.py fw/cli.py
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `firewall-rules/` exists with a `pyproject.toml`, and `click` and `pydantic` are installed.
- ✅ The `fw/` directory has all required module files.

## Step 1: Model firewall rules as data

Every firewall rule has the same shape: an action (allow or deny), a protocol (TCP, UDP, or ICMP), a port range, and an optional source IP or CIDR block. Modeling this as a Pydantic model gives you automatic validation — a rule with port `99999` or an action of `"maybe"` fails immediately instead of silently corrupting the rule set.

### 1.1 Define the rule schema

**👟 Starter hint:** Create `fw/rules.py` with a Pydantic model that validates every field on creation.

```python
# fw/rules.py
from enum import Enum
from pydantic import BaseModel, field_validator
from ipaddress import ip_network

class Action(str, Enum):
    ALLOW = "allow"
    DENY = "deny"

class Protocol(str, Enum):
    TCP = "tcp"
    UDP = "udp"
    ICMP = "icmp"

class FirewallRule(BaseModel):
    name: str
    action: Action
    protocol: Protocol
    port_start: int
    port_end: int
    source: str = "0.0.0.0/0"  # CIDR, defaults to all

    @field_validator("port_start", "port_end")
    @classmethod
    def check_port(cls, v):
        if not 1 <= v <= 65535:
            raise ValueError(f"Port must be 1-65535, got {v}")
        return v

    def model_post_init(self, __context):
        if self.port_start > self.port_end:
            raise ValueError(
                f"port_start ({self.port_start}) must be <= port_end ({self.port_end})"
            )
        ip_network(self.source, strict=False)  # validates CIDR syntax
```

Pydantic catches bad data at construction time — `port_start > port_end`, invalid CIDR blocks, or unrecognized protocols all raise `ValueError` with a clear message. The `source` field defaults to `0.0.0.0/0` (any IP), which is the common case for most rules.

**🎯 Expected output:** `FirewallRule(name="web", action="allow", protocol="tcp", port_start=80, port_end=443)` creates a valid rule. `FirewallRule(name="bad", action="allow", protocol="tcp", port_start=99999, port_end=99999)` raises a `ValidationError`.

**🩹 If it's off:** If `ip_network` doesn't catch a bad CIDR, you may be importing from the wrong module — use `from ipaddress import ip_network`. If Pydantic doesn't run the port validator, make sure the `@field_validator` decorator is present.

### 1.2 Verify rule creation

```python
# Quick test
from fw.rules import FirewallRule

r = FirewallRule(name="ssh", action="allow", protocol="tcp", port_start=22, port_end=22)
assert r.action.value == "allow"
assert r.port_start == 22
print(r.model_dump())
```

The model round-trips cleanly: create a rule, access its fields, and serialize it back to a dictionary.

**🎯 Expected output:** The assertion passes; `model_dump()` prints a dictionary with all fields.

**🩹 If it's off:** If `model_dump()` doesn't exist, you're on an older Pydantic version — use `.dict()` instead.

### 1.3 Verify the rule model

**✅ Checklist**

- ✅ A valid rule creates successfully with all fields accessible.
- ✅ An invalid port (out of 1–65535) raises a clear `ValidationError`.
- ✅ An invalid CIDR source (like `"not-an-ip"`) raises a clear error.

**🤔 Socratic Question(s)**

- Why model rules as Pydantic models instead of plain dictionaries? What validation guarantees do you get for free?
- If two rules have the same name but different actions, is that a conflict or valid? How would you decide?

## Step 2: Detect rule conflicts

A rule set is only useful if its rules don't contradict each other. Two rules that match the same traffic with different actions create ambiguity — most firewalls handle this with a "first match wins" order, but you still need to warn the user.

### 2.1 Write the conflict detector

**👟 Starter hint:** Create `fw/validate.py` with a function that compares every pair of rules and flags overlapping port ranges on the same protocol.

```python
# fw/validate.py
from fw.rules import FirewallRule

def find_conflicts(rules: list[FirewallRule]) -> list[tuple[FirewallRule, FirewallRule, str]]:
    """Find pairs of rules that overlap in protocol and port range."""
    conflicts = []
    for i, a in enumerate(rules):
        for b in rules[i + 1:]:
            if a.protocol != b.protocol:
                continue
            ports_overlap = a.port_start <= b.port_end and b.port_start <= a.port_end
            if not ports_overlap:
                continue
            if a.source == b.source or a.source == "0.0.0.0/0" or b.source == "0.0.0.0/0":
                reason = f"Both match {a.protocol.value} ports {max(a.port_start, b.port_start)}-{min(a.port_end, b.port_end)}"
                conflicts.append((a, b, reason))
    return conflicts
```

The overlap check `a.port_start <= b.port_end and b.port_start <= a.port_end` is the standard interval overlap test. The source check is important: two rules with different source IPs can overlap without conflict because they match different traffic. But when one rule covers all sources (`0.0.0.0/0`), it overlaps with everything.

**🎯 Expected output:** Two rules matching TCP 80–443 from any source produce one conflict. Two rules matching TCP 80 but from different specific IPs produce no conflict.

**🩹 If it's off:** If rules with different protocols are flagged as conflicting, the protocol check is missing. If rules with different specific sources are flagged, the source overlap logic is too strict.

### 2.2 Add a validation summary

```python
# fw/validate.py (continued)
def validate_ruleset(rules: list[FirewallRule]) -> dict:
    """Validate a full rule set and return a summary."""
    conflicts = find_conflicts(rules)
    issues = []
    for a, b, reason in conflicts:
        issues.append(f"CONFLICT: '{a.name}' vs '{b.name}': {reason}")
    return {"valid": len(issues) == 0, "issues": issues, "rule_count": len(rules)}
```

**🎯 Expected output:** A rule set with no overlaps returns `{"valid": True, "issues": [], "rule_count": N}`. A conflicting set returns `{"valid": False, "issues": [...], ...}` with human-readable conflict descriptions.

**🩹 If it's off:** If the summary always shows `"valid": True`, the issues list isn't being populated — check `find_conflicts` returns the right tuples.

### 2.3 Verify conflict detection

**✅ Checklist**

- ✅ Two rules matching the same protocol and port range from the same source are flagged.
- ✅ Rules matching different protocols or different sources are not flagged.
- ✅ The validation summary returns `"valid": False` with readable issue descriptions.

**🤔 Socratic Question(s)**

- Most real firewalls use "first match wins" ordering. How would adding rule priority change the conflict detection logic — would overlapping rules still be conflicts, or just ordering concerns?
- What happens if a rule set has a `deny all` rule in the middle? Would your validator flag the rules below it as redundant?

## Step 3: Simulate traffic against the rule set

Validation tells you if the rules are internally consistent; simulation tells you what they actually *do*. Given a list of simulated traffic packets (source IP, protocol, port), you can walk through the rules in order and predict whether each packet is allowed or denied.

### 3.1 Build the simulator

**👟 Starter hint:** Create `fw/simulate.py` with a function that walks rules in order for each packet and returns the first matching action.

```python
# fw/simulate.py
from ipaddress import ip_address
from fw.rules import FirewallRule

def simulate_packet(
    rules: list[FirewallRule],
    source_ip: str,
    protocol: str,
    port: int,
) -> tuple[str, FirewallRule | None]:
    """Simulate one packet. Returns (action, matching_rule) or ('deny', None)."""
    for rule in rules:
        if rule.protocol.value != protocol:
            continue
        if not (rule.port_start <= port <= rule.port_end):
            continue
        src_net = ip_address(source_ip) in __import__("ipaddress").ip_network(rule.source, strict=False)
        if src_net:
            return rule.action.value, rule
    return "deny", None  # default: deny if no rule matches
```

Walking the rules in order and returning on the first match is how most firewalls actually work. If no rule matches, the default action is deny — this is the secure default. The `ipaddress` module handles CIDR matching correctly, including edge cases like `192.168.1.0/24`.

**🎯 Expected output:** A rule set with `allow tcp 80-80` and `deny tcp 1-1023` produces `("allow", rule)` for a packet to port 80 from any source, and `("deny", rule)` for port 22 from any source.

**🩹 If it's off:** If port 80 returns `deny`, the rules aren't ordered correctly — first match matters. If CIDR matching doesn't work, check that you're using `ip_network` with `strict=False`.

### 3.2 Add batch simulation

```python
# fw/simulate.py (continued)
def simulate_traffic(rules: list[FirewallRule], packets: list[dict]) -> list[dict]:
    """Simulate multiple packets and return results."""
    results = []
    for pkt in packets:
        action, matched = simulate_packet(rules, pkt["source"], pkt["protocol"], pkt["port"])
        results.append({
            **pkt,
            "action": action,
            "matched_rule": matched.name if matched else None,
        })
    return results
```

**🎯 Expected output:** A batch of three packets produces three result dictionaries, each with the original packet fields plus `action` and `matched_rule`.

**🩹 If it's off:** If the results list is empty, the input list isn't being iterated. If `matched_rule` is always `None`, the `simulate_packet` function isn't returning the matched rule.

### 3.3 Verify the simulator

**✅ Checklist**

- ✅ A packet matching the first rule gets that rule's action.
- ✅ A packet matching no rules gets `"deny"` with `matched_rule=None`.
- ✅ `simulate_traffic` returns one result per input packet.

**🤔 Socratic Question(s)**

- If you reversed the rule order, which packets would change their outcome? Does this tell you something about why rule ordering matters in real firewalls?
- What would it take to add logging — recording *which* rules were checked but didn't match — so you can debug a denied packet after the fact?

## Step 4: Diff-based deployment with rollback

Deploying firewall rules safely means showing the user exactly what changes before any change is applied, and being able to undo it instantly. This step builds a deployer that snapshots the current rules, computes a diff against the new set, and stores the previous version for rollback.

### 4.1 Build the deployer

**👟 Starter hint:** Create `fw/deploy.py` with `deploy` (snapshot + diff + apply) and `rollback` (restore previous snapshot).

```python
# fw/deploy.py
import json
from pathlib import Path
from fw.rules import FirewallRule

RULES_FILE = Path("rules.json")
HISTORY_DIR = Path("rule_history")

def save_rules(rules: list[FirewallRule]):
    """Save the current rule set to disk."""
    RULES_FILE.write_text(json.dumps([r.model_dump() for r in rules], indent=2))

def load_rules() -> list[FirewallRule]:
    """Load the current rule set from disk."""
    if not RULES_FILE.exists():
        return []
    data = json.loads(RULES_FILE.read_text())
    return [FirewallRule(**r) for r in data]

def deploy(new_rules: list[FirewallRule]) -> dict:
    """Snapshot current rules, compute diff, and apply new rules."""
    HISTORY_DIR.mkdir(exist_ok=True)
    old_rules = load_rules()

    # Snapshot old rules
    import time
    snapshot_name = f"snapshot_{int(time.time())}.json"
    (HISTORY_DIR / snapshot_name).write_text(
        json.dumps([r.model_dump() for r in old_rules], indent=2)
    )

    # Compute diff
    old_names = {r.name for r in old_rules}
    new_names = {r.name for r in new_rules}
    added = new_names - old_names
    removed = old_names - new_names
    changed = []
    old_map = {r.name: r for r in old_rules}
    for r in new_rules:
        if r.name in old_map and r.model_dump() != old_map[r.name].model_dump():
            changed.append(r.name)

    save_rules(new_rules)
    return {
        "added": sorted(added),
        "removed": sorted(removed),
        "changed": sorted(changed),
        "snapshot": snapshot_name,
        "total_rules": len(new_rules),
    }
```

The deploy function snapshots first, then computes, then applies — this ordering ensures you always have a rollback point even if the new rules are malformed. The diff report tells the operator exactly what changed: which rules are new, which are gone, and which were modified.

**🎯 Expected output:** Deploying rules that add one, remove one, and modify one produces a diff dict with `added: ["new_rule"]`, `removed: ["old_rule"]`, `changed: ["modified_rule"]`.

**🩹 If it's off:** If the snapshot file isn't created, `HISTORY_DIR.mkdir()` isn't called before writing. If the diff shows everything as added, `old_rules` loaded as an empty list — check `rules.json` exists before deploy.

### 4.2 Add rollback

```python
# fw/deploy.py (continued)
def rollback() -> str:
    """Restore the most recent snapshot."""
    if not HISTORY_DIR.exists():
        return "No history to rollback."
    snapshots = sorted(HISTORY_DIR.glob("snapshot_*.json"))
    if not snapshots:
        return "No snapshots found."
    latest = snapshots[-1]
    rules_data = json.loads(latest.read_text())
    rules = [FirewallRule(**r) for r in rules_data]
    save_rules(rules)
    return f"Rolled back to {latest.name} ({len(rules)} rules)"
```

Rollback reads the most recent snapshot and writes it back to `rules.json`. The timestamp-based naming makes the order unambiguous, and returning the snapshot name gives the operator a record of which version was restored.

**🎯 Expected output:** Calling `rollback()` after a deploy reverts `rules.json` to the previous version and returns the snapshot name.

**🩹 If it's off:** If rollback returns "No snapshots found", the `rule_history/` directory is empty — deploy must run before rollback. If the restored rules are wrong, the snapshot naming isn't sorted chronologically.

### 4.3 Verify deployment

**✅ Checklist**

- ✅ `deploy` creates a timestamped snapshot in `rule_history/` before applying changes.
- ✅ The diff report correctly identifies added, removed, and changed rules.
- ✅ `rollback` restores the most recent snapshot and overwrites `rules.json`.

**🤔 Socratic Question(s)**

- In a production firewall, "apply" might mean running a system command with real network impact. How does the snapshot-then-apply ordering protect you if the apply step fails halfway?
- If two people deploy at the same time, what happens to the snapshots? How would you handle concurrent deploys?

## Step 5: Build the CLI

Wire everything together with three commands: `validate`, `deploy`, and `rollback`.

### 5.1 Write the CLI

**👟 Starter hint:** Create `fw/cli.py` with `click` commands for each operation.

```python
# fw/cli.py
import json
import click
from fw.rules import FirewallRule
from fw.validate import validate_ruleset
from fw.simulate import simulate_traffic
from fw.deploy import deploy, rollback

@click.group()
def cli():
    """Firewall Rule Manager — validate, deploy, rollback."""
    pass

@cli.command()
@click.argument("rules_file", type=click.Path(exists=True))
def validate(rules_file):
    """Validate a rules file for conflicts."""
    data = json.loads(open(rules_file).read())
    rules = [FirewallRule(**r) for r in data]
    result = validate_ruleset(rules)
    if result["valid"]:
        click.echo(f"Valid: {result['rule_count']} rules, no conflicts.")
    else:
        for issue in result["issues"]:
            click.echo(f"  {issue}")
        raise SystemExit(1)

@cli.command()
@click.argument("rules_file", type=click.Path(exists=True))
def deploy_cmd(rules_file):
    """Deploy a new ruleset (snapshot + diff + apply)."""
    data = json.loads(open(rules_file).read())
    rules = [FirewallRule(**r) for r in data]
    result = deploy(rules)
    click.echo(f"Deployed {result['total_rules']} rules.")
    click.echo(f"  Added: {result['added']}")
    click.echo(f"  Removed: {result['removed']}")
    click.echo(f"  Changed: {result['changed']}")
    click.echo(f"  Snapshot: {result['snapshot']}")

@cli.command()
def rollback_cmd():
    """Rollback to the most recent snapshot."""
    msg = rollback()
    click.echo(msg)

if __name__ == "__main__":
    cli()
```

The CLI is thin — each command is a few lines that parse input, call the library function, and print the result. This separation means the library code (`rules.py`, `validate.py`, `simulate.py`, `deploy.py`) is testable without the CLI, and the CLI is trivial to extend with new commands.

**🎯 Expected output:** `uv run python -m fw.cli validate rules.json` prints "Valid: N rules, no conflicts" for a clean rule set, or lists conflicts and exits with code 1.

**🩹 If it's off:** If the CLI can't find `click`, check that `click` is in `pyproject.toml`. If `validate` always shows valid, the rules aren't being loaded from the file — check the file read path.

### 5.2 End-to-end smoke test

```python
# Quick end-to-end test
from fw.rules import FirewallRule
from fw.validate import validate_ruleset
from fw.simulate import simulate_traffic
from fw.deploy import deploy

rules = [
    FirewallRule(name="web", action="allow", protocol="tcp", port_start=80, port_end=443),
    FirewallRule(name="ssh", action="allow", protocol="tcp", port_start=22, port_end=22),
    FirewallRule(name="block_trojan", action="deny", protocol="tcp", port_start=4444, port_end=4444),
]

# Validate
result = validate_ruleset(rules)
assert result["valid"]

# Simulate
packets = [
    {"source": "10.0.0.1", "protocol": "tcp", "port": 80},
    {"source": "10.0.0.1", "protocol": "tcp", "port": 22},
    {"source": "10.0.0.1", "protocol": "tcp", "port": 4444},
]
results = simulate_traffic(rules, packets)
assert results[0]["action"] == "allow"
assert results[1]["action"] == "allow"
assert results[2]["action"] == "deny"

# Deploy
diff = deploy(rules)
assert diff["total_rules"] == 3
```

This runs the full pipeline: validate, simulate, deploy. Each piece was tested individually; this confirms the handoff between them is clean.

**🎯 Expected output:** All assertions pass; deploy reports 3 rules with no added, removed, or changed rules (first deploy is always a "clean" diff).

**🩹 If it's off:** If simulation produces wrong actions, check rule ordering. If deploy shows unexpected added/removed rules, the `rules.json` file may have stale data from a previous run.

### 5.3 Verify the CLI pipeline

**✅ Checklist**

- ✅ `validate` detects conflicting rules and exits with code 1.
- ✅ `deploy` creates a snapshot and reports added/removed/changed rules.
- ✅ `rollback` restores the most recent snapshot.

**🤔 Socratic Question(s)**

- What would it take to add a `simulate` CLI command that reads a rules file and a traffic CSV, then prints a table of allow/deny results?
- If the deploy command partially writes `rules.json` and then crashes, what state is the file in? How would you make the write atomic?

## ⚠️ Common pitfalls

- **Forgetting that rule order matters.** The simulator walks rules top-to-bottom and returns on first match. A `deny all` rule above an `allow http` rule blocks HTTP traffic. Always put specific allow rules before broad deny rules.
- **Port ranges that silently wrap.** A rule with `port_start=80` and `port_end=80` is correct; `port_start=443` and `port_end=80` should fail validation but won't if the range check is missing. Always validate `port_start <= port_end`.
- **Not snapshotting before deploy.** If you apply new rules without saving the old ones first, there's no rollback point. The deploy function always snapshots first — don't skip that step.
- **CIDR matching without `strict=False`.** `ip_network("192.168.1.1/24")` raises a `ValueError` because the host bits are set. Using `strict=False` silently masks the host bits, which is the correct behavior for firewall source matching.
- **Treating validation as deployment.** A rule set that passes validation can still cause problems in production (wrong order, missing defaults). Validation catches conflicts; simulation catches logical errors. Run both before deploying.

## What you just built

A firewall rule management tool that models rules as validated Python objects, detects conflicts before they reach production, simulates real traffic against the rule set, and deploys changes with a snapshot-and-diff workflow that makes every change auditable and reversible. The architecture — model, validate, simulate, deploy — is the same pattern used in infrastructure-as-code tools like Terraform and Pulumi.

:::tip[Run a fuller version without any local setup]
[`examples/firewall-rules/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/firewall-rules) in the course repo has a richer version with more rule types, a traffic CSV for batch simulation, and sample rule files. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Add a `--dry-run` flag to the deploy command that shows the diff without applying it.
- Build a rule template system: predefined templates for common patterns like "allow HTTP," "allow SSH," "block all inbound" that generate correctly structured rules.
- Implement rule priority/ordering: auto-sort rules so that the most specific matches come first, reducing the chance of ordering bugs.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓
