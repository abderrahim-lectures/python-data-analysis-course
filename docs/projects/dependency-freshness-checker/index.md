---
id: 2027-dependency-freshness-checker
title: "Build a Dependency-Freshness Checker"
sidebar_label: "Dependency-Freshness Checker"
slug: /projects/dependency-freshness-checker
description: "Build a real CLI tool that reads a pyproject.toml, checks PyPI for newer versions of every dependency, and reports what's outdated — no API key needed."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Build a Dependency-Freshness Checker

<ProjectPublishedDate projectId="2027-dependency-freshness-checker" />

<ProjectGreeting />

Every real Python project accumulates dependencies, and every dependency eventually falls behind — a security fix ships, a bug gets patched, a new feature lands, and your `pyproject.toml` just... doesn't know. This project builds the tool that tells you: a real CLI that reads a `pyproject.toml`, asks PyPI's public API what the current version of each dependency actually is, and reports which ones you're behind on — the same category of tool as `pip list --outdated`, but one you understand completely because you built it yourself.

This is optional and ungraded — a good fit once you've finished Python 101 (no Data Analysis or API-key experience needed, this project uses no paid or gated service at all). See [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. **Parse** a real `pyproject.toml` file and **extract** its dependency list.
2. **Query** PyPI's public JSON API to find each dependency's current published version.
3. **Compare** your pinned/installed version against the latest, using real semantic-version parsing — not naive string comparison.
4. **Produce** a clean, categorized freshness report (up to date / outdated / unable to check).

## Where to run this

**Locally with `uv`** is the path this lesson's steps follow, and the recommended one — you'll point it at a real `pyproject.toml` (this course's own repo has several, or use any project of yours). The Setup section below walks through installing it.

**GitHub Codespaces** is a zero-setup alternative if you'd rather not install anything locally yet: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed) and run the exact same `uv` commands from a terminal in your browser tab — plus you'll have plenty of real `pyproject.toml` files nearby to point the tool at.

**Google Colab, Kaggle Notebooks, or Binder** also work, since this project needs no API key or GPU — a real, runnable notebook version lives at [`examples/dependency-freshness-checker/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/dependency-freshness-checker/notebook.ipynb). Click a badge to launch it directly, no local install at all:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/dependency-freshness-checker/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/dependency-freshness-checker/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdependency-freshness-checker%2Fnotebook.ipynb)

Be honest with yourself about the tradeoff, though: a notebook can only check whatever sample `pyproject.toml` content you paste into it, not point at a real project folder on disk the way the local CLI can.

## Setup

`uv` is a single tool that replaces the usual "install Python, then install pip, then install a virtual environment tool, then install packages" chain — it can install and manage Python versions itself, alongside your project's dependencies.

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
uv init dependency-checker
cd dependency-checker
uv add requests packaging
```

No API key is needed anywhere in this project — PyPI's JSON API (`https://pypi.org/pypi/<package>/json`) is public, free, and requires no signup or authentication. `requests` handles the HTTP calls; `packaging` gives you real, correct semantic-version parsing (`packaging.version.Version`) instead of comparing version strings character by character, which breaks the moment you compare `"2.9"` against `"2.10"` as plain text.

:::tip[Why not just string-compare versions?]
`"2.10.0" > "2.9.0"` is `True` mathematically, but as plain strings, `"2.10.0" < "2.9.0"` — because `"1" < "9"` character-by-character, Python never gets far enough to notice `10 > 9`. Real version comparison has to parse each part as a number first. The `packaging` library (the same one `pip` itself uses internally) does this correctly, including pre-release versions like `2.0.0rc1`.
:::

## Step 1: Parse a real `pyproject.toml`

Python 3.11+ ships `tomllib` in the standard library — no install needed to *read* TOML (only `uv add`-ing a package if you needed to *write* TOML, which this project doesn't).

```python
# parse_deps.py
import tomllib
from pathlib import Path


def load_dependencies(pyproject_path: str) -> list[str]:
    """Read a pyproject.toml and return its raw dependency specifier strings,
    e.g. ["requests>=2.31", "packaging"]."""
    with Path(pyproject_path).open("rb") as f:
        data = tomllib.load(f)
    return data.get("project", {}).get("dependencies", [])


if __name__ == "__main__":
    deps = load_dependencies("pyproject.toml")
    for dep in deps:
        print(dep)
```

```bash
uv run python parse_deps.py
```

<StepChecklist>
  <StepChecklistItem>Running this against your own project's `pyproject.toml` prints each dependency's raw specifier string.</StepChecklistItem>
  <StepChecklistItem>You can explain why `tomllib` needs the file opened in binary mode (`"rb"`), not text mode.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**: A `pyproject.toml`'s `dependencies` list holds strings like `"requests>=2.31"` — not just package names. What's the *name* on its own, separate from any version constraint attached to it? You'll need to split those apart cleanly in the next step, and a real dependency string can be sloppier than it looks (extra spaces, extras like `"requests[socks]>=2.31"`, exact-pin `==` instead of `>=`) — which of those would break a naive `.split(">=")`?

## Step 2: Look up each package's current version on PyPI

```python
# check_pypi.py
import re

import requests


def parse_package_name(specifier: str) -> str:
    """Extract just the package name from a specifier like 'requests>=2.31'
    or 'requests[socks]==2.31.0'."""
    match = re.match(r"^[A-Za-z0-9_.-]+", specifier.strip())
    if not match:
        raise ValueError(f"Could not parse a package name from {specifier!r}")
    return match.group(0)


def get_latest_version(package_name: str) -> str | None:
    """Query PyPI's public JSON API for a package's current published
    version. Returns None if the package isn't found (a typo, or a private
    package not on PyPI)."""
    url = f"https://pypi.org/pypi/{package_name}/json"
    response = requests.get(url, timeout=10)
    if response.status_code == 404:
        return None
    response.raise_for_status()
    return response.json()["info"]["version"]


if __name__ == "__main__":
    for specifier in ["requests>=2.31", "packaging", "not-a-real-package-xyz"]:
        name = parse_package_name(specifier)
        latest = get_latest_version(name)
        print(f"{name}: latest is {latest!r}")
```

```bash
uv run python check_pypi.py
```

Notice the deliberately-broken `"not-a-real-package-xyz"` in the test list — it should print `latest is None`, not crash. A real tool has to handle a typo'd or private package name gracefully, not assume every name in a `pyproject.toml` resolves.

<StepChecklist>
  <StepChecklistItem>Real packages print their real, current PyPI version — you can cross-check one against pypi.org in your browser.</StepChecklistItem>
  <StepChecklistItem>The fake package name prints `None` instead of crashing the script.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**: `response.raise_for_status()` runs *after* the explicit 404 check above it — why single out 404 specially instead of letting `raise_for_status()` handle every non-2xx status the same way? What would happen to this script's control flow if that 404 check weren't there?

## Step 3: Compare versions correctly

```python
# compare.py
from packaging.version import InvalidVersion, Version


def is_outdated(current: str, latest: str) -> bool | None:
    """Compare two version strings properly. Returns None (not True/False)
    if either string isn't a version packaging can parse — e.g. a git URL
    or a local path used as a 'version', which pyproject.toml permits."""
    try:
        return Version(current) < Version(latest)
    except InvalidVersion:
        return None


if __name__ == "__main__":
    print(is_outdated("2.9.0", "2.10.0"))  # True — real semantic comparison
    print(is_outdated("2.10.0", "2.9.0"))  # False
    print(is_outdated("2.10.0", "2.10.0"))  # False — equal, not outdated
    print(is_outdated("not-a-version", "2.10.0"))  # None — can't compare
```

```bash
uv run python compare.py
```

<StepChecklist>
  <StepChecklistItem>`is_outdated("2.9.0", "2.10.0")` prints `True`, proving this isn't naive string comparison.</StepChecklistItem>
  <StepChecklistItem>An unparseable version string returns `None`, not a crash or a silently-wrong `True`/`False`.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**: Why does `is_outdated` return three possible outcomes (`True`, `False`, `None`) instead of just two? What real, non-hypothetical situation in a `pyproject.toml` would make `None` the *only* honest answer?

## Step 4: Put it together into a real freshness report

```python
# freshness_report.py
from dataclasses import dataclass

from check_pypi import get_latest_version, parse_package_name
from compare import is_outdated
from parse_deps import load_dependencies


@dataclass
class DependencyStatus:
    name: str
    current_specifier: str
    latest: str | None
    outdated: bool | None


def build_report(pyproject_path: str) -> list[DependencyStatus]:
    report = []
    for specifier in load_dependencies(pyproject_path):
        name = parse_package_name(specifier)
        latest = get_latest_version(name)
        # A specifier with no pinned version (just "requests") has nothing
        # concrete to compare against — treat that case as "unknown" too.
        pinned = specifier[len(name) :].lstrip(">=<~! ")
        outdated = is_outdated(pinned, latest) if pinned and latest else None
        report.append(DependencyStatus(name, specifier, latest, outdated))
    return report


def print_report(report: list[DependencyStatus]) -> None:
    outdated = [d for d in report if d.outdated is True]
    fresh = [d for d in report if d.outdated is False]
    unknown = [d for d in report if d.outdated is None]

    if outdated:
        print(f"⚠️  {len(outdated)} outdated:")
        for d in outdated:
            print(f"   {d.name}: pinned {d.current_specifier!r}, latest is {d.latest}")
    if fresh:
        print(f"✅ {len(fresh)} up to date: {', '.join(d.name for d in fresh)}")
    if unknown:
        print(f"❓ {len(unknown)} could not be checked: {', '.join(d.name for d in unknown)}")


if __name__ == "__main__":
    import sys

    path = sys.argv[1] if len(sys.argv) > 1 else "pyproject.toml"
    print_report(build_report(path))
```

```bash
uv run python freshness_report.py pyproject.toml
```

Try pointing it at a `pyproject.toml` from a real, older project you have lying around (or this course repo's own `examples/*/pyproject.toml` files) — that's where you'll actually see the "outdated" bucket populate with real results, not just up-to-date dependencies you added five minutes ago.

<StepChecklist>
  <StepChecklistItem>Running the report against your project's own `pyproject.toml` prints a categorized ✅/⚠️/❓ summary.</StepChecklistItem>
  <StepChecklistItem>Pointing it at an intentionally older `pyproject.toml` shows at least one real outdated dependency.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**: This script makes one HTTP request per dependency, one after another. For a `pyproject.toml` with 40 dependencies, what's the user-experienced cost of that — and what's a concrete way you'd speed it up (hint: these requests don't depend on each other's results at all)?

## ⚠️ Common pitfalls

- **Naive string version comparison.** `"2.9" > "2.10"` as plain strings — this is the single most common bug in a hand-rolled version checker. Always parse with `packaging.version.Version`, never compare version strings directly.
- **Assuming every dependency name resolves on PyPI.** Private/internal packages, typos, and git-URL "dependencies" are all real things `pyproject.toml` permits — your script has to degrade gracefully (a `None`/"unknown" bucket), not crash the whole report over one unusual entry.
- **Treating an unpinned dependency (`"requests"` with no version at all) as "outdated".** There's nothing to compare against — that's a different, honest "unknown" case, not a false positive.
- **Hammering PyPI without a timeout.** Always pass `timeout=...` to `requests.get()` — a single hung request without one can freeze the whole tool indefinitely.

## What you just built

A real freshness-checking CLI — the same core idea behind `pip list --outdated`, GitHub's Dependabot, and Renovate, built from first principles: parse a manifest, query a real public API, compare versions *correctly*, and report the result clearly. Nothing here was hidden behind a library that does version comparison for you — you now know exactly why naive string comparison breaks and how to avoid it, a detail that trips up plenty of hand-rolled tools in the wild.

## Where to go from here

- Speed it up with concurrent requests (`concurrent.futures.ThreadPoolExecutor` or `asyncio` + `httpx`) — the Socratic question above is your starting point.
- Add a `--fix` mode that rewrites the `pyproject.toml`'s version constraints to the latest versions automatically (careful: always show a diff or require confirmation before writing to a real file — the same safety principle used elsewhere in this course's projects).
- Check PyPI's release date, not just version number, and flag anything untouched for over a year as possibly abandoned — a genuinely different, complementary signal from "is this outdated".
- Compare against `uv.lock`'s actually-installed versions too, not just the `pyproject.toml` specifiers — the two can legitimately disagree.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓

<ProjectProgressCheckbox projectId="2027-dependency-freshness-checker" />

