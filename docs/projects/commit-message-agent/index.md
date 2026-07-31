---
id: commit-message-agent
title: "Build a Git Commit-Message Generator"
sidebar_label: "Build a Git Commit-Message Generator"
slug: /projects/commit-message-agent
description: "Build a CLI tool that reads a real staged git diff via subprocess, drafts a Conventional-Commits-style message with a free-tier LLM, and only commits it after you explicitly confirm."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Build a Git Commit-Message Generator

<ProjectPublishedDate projectId="2027-commit-message-agent" />

<ProjectGreeting />

"wip", "fix stuff", "asdf" — every developer has typed a lazy commit message at 6pm on a Friday. This project builds a CLI tool that removes the excuse: it captures your real **staged** `git diff` with Python's `subprocess` module, hands it to a free-tier language model with a system prompt designed specifically for writing Conventional-Commits-style messages, and shows you a draft you can accept, edit, or throw away — before anything is ever committed. The tool never commits on its own; a human always confirms the final message first.

This assumes Python 101 and enough comfort with git to know what `git add` and `git commit` do — nothing from Data Analysis is required. It's optional and ungraded; see [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Install `uv`, get a free-tier LLM API key, and set up a small project — all in one place, before any building starts.
2. Use Python's `subprocess` module to run `git diff --staged` for real and capture its output as text.
3. Design a system prompt that turns a general-purpose LLM into a focused Conventional-Commits-style message drafter.
4. Build an interactive CLI loop: show the draft, let the user accept, edit, or regenerate it.
5. Wire the loop up to actually run `git commit -m "..."` — but only after the user explicitly confirms.

## Where to run this

**Locally with `uv`** is the primary, recommended path here, more so than for most other projects in this series — this tool's entire premise is reading `git diff --staged` from a real local git repository and, if you say so, committing to it. That means it needs an actual `.git` folder with staged changes on disk to work against (your own project, or a clone of this course's repo).

**GitHub Codespaces** works well too: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, `uv`, and git are already installed) — it's a real clone with a real place to stage changes, so every step below works exactly as it does locally.

**Google Colab and Kaggle Notebooks are a reasonable way to *try* the drafting logic, but not to run the tool for real.** Neither gives you a real local git repository with staged changes by default, and the whole premise of this tool is drafting a message for *your own* in-progress work — a notebook's ephemeral filesystem has none of that, and there's nothing sensible to actually commit to. The notebook below works around this honestly, rather than pretending the gap doesn't exist: it `!git clone`s this course's own repository into the notebook and drafts a message for one real, small, historical commit from it with `git show`, so the diff capture, the system prompt, and the LLM call all run against real, real-looking output — it's just drafting for a fixed example commit, and it stops there; it does **not** demo the interactive accept/edit/commit loop, since committing only makes sense against a repo you're really working in. Use it to see the drafting logic work end to end with zero setup; switch to local `uv` or a Codespace once you want the full interactive tool pointed at your own actual changes.

{/* TODO: update these badge links to point at main once this PR merges */}
[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/commit-message-agent/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/commit-message-agent/notebook.ipynb)

## Setup

Everything you need before you write a line of the drafter itself: a real Python, a free API key, and a small project to hold both.

### Install `uv`

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

### Set up the project

```bash
uv init commit-message-agent
cd commit-message-agent
uv add openai python-dotenv
```

`openai`'s client library works here for every provider in the table below, not just OpenAI itself — GitHub Models, Gemini, Groq, Mistral, Cerebras, and OpenRouter all expose an OpenAI-compatible chat endpoint, so one client, pointed at a different `base_url`, is all this project needs. `python-dotenv` lets you keep your API key in a local `.env` file instead of `export`-ing it every session.

### Get a free LLM API key

**Pick whichever provider you like** — none of them require a credit card at the time of writing, and this course doesn't favor one over another. The fuller example in the course repo ([`examples/commit-message-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/commit-message-agent)) supports all six out of the box, selected with one setting.

| Provider | Where to get a key | Why you might pick it |
|---|---|---|
| **GitHub Models** *(suggested default)* | [github.com/settings/tokens](https://github.com/settings/tokens) — a personal access token with the `models: read` scope | No separate signup — you already have a GitHub account. More generous free-tier limits than Gemini's. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | The most commonly referenced option; also exposes an OpenAI-compatible endpoint, used below. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Fast inference, generous free tier, no card. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | One of the more generous permanent free quotas. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | High daily token volume, no card. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | One API, many free models — good for comparing providers. |

Whichever you pick, the process is the same:

1. Sign in and generate an API key on that provider's site.
2. **Never paste this key directly into code or commit it to a repository.** Create a `.env` file in your project folder instead (never commit this):

```bash
# .env
LLM_PROVIDER=github
GITHUB_TOKEN=your-key-here
```

An API key is a secret, exactly like a password — anyone with it can use your account's quota. Treating it as an environment variable rather than a hardcoded string is the standard practice for exactly this reason.

:::tip[A .env file is often more convenient than export]
Instead of `export`-ing a key in every new terminal session, `python-dotenv` reads a `.env` file in your project folder into `os.environ` automatically, the first time your script runs — see `load_dotenv()` in Step 1 below.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv --version` prints a version number.</StepChecklistItem>
<StepChecklistItem>`commit-message-agent/` exists with a `pyproject.toml`, and `openai` and `python-dotenv` are installed.</StepChecklistItem>
<StepChecklistItem>You have a real API key from one provider, saved in a `.env` file in your project folder — not pasted into any script.</StepChecklistItem>
</StepChecklist>

## Step 1: Capture a staged git diff with `subprocess`

Python's `subprocess` module runs another program and captures its output as text — here, that program is `git diff --staged`, not the plain `git diff` you might reach for first. That's a deliberate choice: a commit message should describe what's actually about to be committed, which is whatever you've staged with `git add`, not every unstaged change sitting in your working tree.

Create `commit_helper.py`:

```python
# commit_helper.py
import subprocess

from dotenv import load_dotenv

load_dotenv()  # reads .env into the environment, if present


def get_diff_staged() -> str:
    """The diff between the index (staged changes) and the last commit."""
    return _run_git(["diff", "--staged"])


def _run_git(args: list[str]) -> str:
    """Runs `git <args>` in the current directory and returns its stdout."""
    result = subprocess.run(
        ["git", *args],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)} failed:\n{result.stderr}")
    return result.stdout


if __name__ == "__main__":
    diff = get_diff_staged()
    print(diff if diff.strip() else "No staged changes. Stage something first with `git add`.")
```

`subprocess.run([...], capture_output=True, text=True)` is the key line: passing the command as a **list** of arguments (`["git", "diff", "--staged"]`) rather than one shell string avoids a whole class of shell-quoting and injection bugs, `capture_output=True` grabs stdout/stderr instead of letting them print directly to your terminal, and `text=True` decodes that output as a string instead of raw bytes. `check=False` plus a manual `if result.returncode != 0` is deliberate here rather than `check=True`: it lets this function raise its *own* clear error message (including git's real stderr) instead of a generic `CalledProcessError`.

Try it against this project itself — edit a file, `git add` it, then run:

```bash
uv run python commit_helper.py
```

:::tip[This is the same subprocess pattern as any other CLI wrapper]
`subprocess.run` doesn't care that the program being run is `git` — it works identically for any command-line tool: `ls`, a shell script, another Python program. Once this pattern clicks, "let Python drive an existing CLI tool and use its output" becomes available for a lot more than just git.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`get_diff_staged()` returns real diff text after `git add`-ing a change, and an empty string when nothing is staged.</StepChecklistItem>
<StepChecklistItem>Running `commit_helper.py` inside a folder that isn't a git repo at all raises a clear `RuntimeError`, not a confusing traceback from deep inside `subprocess`.</StepChecklistItem>
<StepChecklistItem>You can explain, in your own words, why this tool reads `git diff --staged` instead of plain `git diff` (unstaged changes).</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- If you `git add`ed one file and left another modified-but-unstaged, what would `get_diff_staged()` show, and what would plain `git diff` (no `--staged`) show instead? Why does a commit-message tool specifically want the former?
- What would `_run_git(["diff", "--staged"])` return in a repo with uncommitted changes that are all unstaged? Why does handling an empty diff, rather than assuming there's always something staged, matter for a tool meant to run as part of a normal commit workflow?

## Step 2: Design the commit-message system prompt

A language model with no instructions might write a message that's too vague ("update code"), too verbose (a full paragraph for a one-line typo fix), or in no consistent format at all. The **system prompt** is what turns a general-purpose chat model into a drafter that behaves like a disciplined project maintainer: what format to use, what mood to write in, and when to bother with more than one line.

```python
SYSTEM_PROMPT = """\
You are an experienced software engineer writing a git commit message for a
staged diff. You will be given a unified git diff. Base the message ONLY on
what the diff actually changes -- do not invent context you can't see, and
do not guess at a ticket number or issue reference that isn't in the diff.

Write the message in the Conventional Commits style:

    <type>(<optional scope>): <short summary, imperative mood, no period>

    <optional body: a few lines explaining WHY the change was made, not
    just restating what the diff shows -- wrap around 72 characters>

Valid types: feat, fix, docs, style, refactor, perf, test, build, ci, chore.
Pick the type that best matches the *dominant* change -- if a diff touches
both a fix and its test, "fix" usually still wins over "test".

Rules:
- The summary line must stay under 72 characters and use the imperative
  mood ("add", not "added" or "adds").
- Only include a body if it adds real information beyond the summary --
  for a small, self-explanatory diff, the summary line alone is enough.
- Never wrap the whole message in a fenced code block or add commentary
  before/after it -- output ONLY the commit message text itself, nothing
  else, so it can be used directly as a commit message.
"""
```

Three deliberate design choices worth noticing:

- **A fixed structure (`type(scope): summary`, optional body)** is what makes the output usable as an actual commit message, not a chat reply that happens to describe the diff — [Conventional Commits](https://www.conventionalcommits.org/) is a widely-used convention specifically because tools (changelogs, semantic-release, CI) can parse it reliably.
- **"Only include a body if it adds real information"** stops the model from padding out a one-line typo fix with three sentences of restated diff content — the same instinct a human reviewer has when they see a bloated commit message for a trivial change.
- **"Base the message ONLY on what the diff actually changes... do not guess at a ticket number"** exists because models are happy to hallucinate a plausible-looking `JIRA-1234` or issue reference if you don't explicitly forbid it — a fabricated reference in a commit message is worse than no reference at all.

:::tip[Iterate on the prompt like you would on code]
Treat this system prompt as a first draft, not a finished spec. Run it against a diff you already know deserves a specific `type` (a pure test addition, a docs-only change, a real bug fix) — if the model picks the wrong type or the summary runs long, tighten the wording and try again.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>You can explain, in your own words, why the prompt forbids inventing a ticket number or issue reference that isn't in the diff.</StepChecklistItem>
<StepChecklistItem>The prompt specifies a concrete output format (`type(scope): summary`, optional body), not just "write a commit message."</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- If you removed the "only include a body if it adds real information" instruction, what kind of commit messages would you expect for very small, self-explanatory diffs?
- The prompt lists ten valid Conventional Commits types. What would go wrong for a real project's changelog tooling if the model were free to invent its own types instead of picking from a fixed list?

## Step 3: Call the LLM and build the interactive loop

Wire the diff-capturing code from Step 1 and the system prompt from Step 2 together, then add the part that makes this a real tool instead of a one-shot script: a loop that shows the draft and lets a human accept, edit, or regenerate it.

```python
# commit_helper.py (continued -- add these imports and functions)
import os

from openai import OpenAI

MAX_DIFF_CHARS = 12_000  # see the "huge diffs" pitfall below


def truncate_diff(diff: str, max_chars: int = MAX_DIFF_CHARS) -> str:
    """Cuts an oversized diff down to a size that fits a free-tier context window."""
    if len(diff) <= max_chars:
        return diff
    return diff[:max_chars] + f"\n\n... [diff truncated -- {len(diff) - max_chars} more characters not shown] ..."


def draft_commit_message(diff: str) -> str:
    """Sends a diff to the configured free-tier LLM and returns a drafted commit message.

    Returns a plain string. That's the whole job of this function -- it has
    no idea a terminal or a `git commit` call exists anywhere. See Step 4
    for the only place this tool actually commits.
    """
    if not diff.strip():
        return ""

    client = OpenAI(
        api_key=os.environ["GITHUB_TOKEN"],
        base_url="https://models.github.ai/inference",
    )
    diff = truncate_diff(diff)
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # confirm this still has a free tier before running
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Write a commit message for this staged diff:\n\n```diff\n{diff}\n```"},
        ],
    )
    return response.choices[0].message.content.strip()


def run_interactive_loop(diff: str) -> None:
    """Drafts a message and lets the user accept, edit, or regenerate it -- see Step 4
    for where (and only where) an accepted message actually gets committed."""
    if not diff.strip():
        print("No staged changes. Stage something first with `git add`.")
        return

    print(f"Drafting a commit message from {len(diff)} characters of staged diff...\n")
    message = draft_commit_message(diff)

    while True:
        print("-" * 60)
        print(message)
        print("-" * 60)
        choice = input("\nUse this message? [y]es / [e]dit / [r]egenerate / [n]o, cancel: ").strip().lower()

        if choice in ("n", "no"):
            print("Cancelled -- nothing was committed.")
            return
        if choice in ("r", "regenerate"):
            message = draft_commit_message(diff)
            continue
        if choice in ("e", "edit"):
            message = input("Type your edited message: ").strip() or message
            continue
        if choice in ("y", "yes"):
            print(f"\n(Would commit here with message:\n{message}\n)")
            return

        print("Please answer y, e, r, or n.")


if __name__ == "__main__":
    diff = get_diff_staged()
    run_interactive_loop(diff)
```

`truncate_diff` matters more here than it might first appear — see the pitfalls section below for why a large diff isn't just slow, it can silently fail or produce a shallow, generic message. The loop deliberately does **not** call `git commit` yet — Step 4 adds that as its own small, explicit function, so it's obvious exactly where and how committing happens.

Run it:

```bash
uv run python commit_helper.py
```

:::tip[Using a different provider?]
Swap the `OpenAI(...)` block for a different `base_url` and key — e.g. `base_url="https://api.groq.com/openai/v1"` with `api_key=os.environ["GROQ_API_KEY"]` for Groq, or `base_url="https://generativelanguage.googleapis.com/v1beta/openai/"` with `api_key=os.environ["GOOGLE_API_KEY"]` for Gemini's OpenAI-compatible endpoint. Everything else in this file stays the same. See [`examples/commit-message-agent/commit_helper.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/commit-message-agent/commit_helper.py) in the course repo for all six wired up side by side, selectable with one environment variable.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python commit_helper.py` prints a Conventional-Commits-style draft for a real staged diff.</StepChecklistItem>
<StepChecklistItem>Typing `r` at the prompt asks the model again and prints a (possibly different) draft, without doing anything else.</StepChecklistItem>
<StepChecklistItem>Typing `n` cancels cleanly, and typing `e` lets you type a replacement message before continuing.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- `draft_commit_message` returns early with an empty string when the diff is empty, before ever building an `OpenAI` client. Why is checking first, calling the API second, worth doing deliberately, rather than just letting an empty prompt go to the model?
- If two different runs of `draft_commit_message` on the *exact same* staged diff produced two visibly different messages, would that surprise you? What does that suggest about why the `r` (regenerate) option exists at all, rather than trusting the first draft blindly?

## Step 4: Wire it up to actually commit — only on confirmation

The last piece: replace the "(Would commit here...)" placeholder from Step 3 with a function that actually runs `git commit -m`, called from exactly one place — right after the user types `y`.

```python
# commit_helper.py (continued)
def _commit(message: str) -> None:
    """Runs the actual `git commit -m <message>`.

    This is the ONLY function in this file that commits anything. It's only
    ever called from run_interactive_loop, only ever after an explicit 'y'
    from a human. There is no other code path that reaches it.
    """
    result = subprocess.run(
        ["git", "commit", "-m", message],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(f"git commit failed:\n{result.stderr}")
    print(result.stdout)
    print("Committed.")


def run_interactive_loop(diff: str) -> None:
    if not diff.strip():
        print("No staged changes. Stage something first with `git add`.")
        return

    print(f"Drafting a commit message from {len(diff)} characters of staged diff...\n")
    message = draft_commit_message(diff)

    while True:
        print("-" * 60)
        print(message)
        print("-" * 60)
        choice = input("\nUse this message? [y]es / [e]dit / [r]egenerate / [n]o, cancel: ").strip().lower()

        if choice in ("n", "no"):
            print("Cancelled -- nothing was committed.")
            return
        if choice in ("r", "regenerate"):
            message = draft_commit_message(diff)
            continue
        if choice in ("e", "edit"):
            message = input("Type your edited message: ").strip() or message
            continue
        if choice in ("y", "yes"):
            _commit(message)
            return

        print("Please answer y, e, r, or n.")
```

Try the full loop against a real change:

```bash
# make a small, real change
git add <the file you changed>
uv run python commit_helper.py
# read the draft, then type e to tweak it, r to try again, or y to commit for real
```

Check that it actually happened:

```bash
git log -1
```

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>Typing `y` at the prompt actually creates a real commit — `git log -1` shows the message you accepted.</StepChecklistItem>
<StepChecklistItem>Typing `n` at the prompt leaves your staged changes staged and uncommitted — nothing happened.</StepChecklistItem>
<StepChecklistItem>You can point to the single line of code where `git commit` is actually invoked, and explain why it's reachable from exactly one place.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- `_commit` is a tiny, separate function instead of being inlined into the `y` branch of the loop. What does keeping it separate make easier if you later wanted to log every real commit this tool makes, or add a `--dry-run` flag that skips it entirely?
- Imagine a version of this tool that skips the confirmation prompt and commits automatically whenever the model's draft looks "confident." What's a realistic way that could go wrong on a diff you didn't fully review yourself before staging it?

:::tip[Never let a tool commit without a human confirming the message first]
This is the single most important lesson in this project, more important than any specific line of code: a tool that *drafts* a commit message is useful; a tool that *commits* one autonomously is a very different, much riskier thing — one bad draft, one truncated diff that hid the real change, or one model having a bad day, and history now has a commit message that doesn't describe what actually happened, with your name on it. `_commit` is the only function here that touches `git commit`, and it's only reachable after an explicit `y`. That's not a missing "auto-commit" feature — it's the design. Keep that boundary if you extend this project yourself.
:::

## ⚠️ Common pitfalls

- **Huge diffs blowing past the context window or free-tier token quota.** A multi-thousand-line diff (a big refactor, a vendored dependency bump) can exceed what the model can actually attend to, or simply exceed your free tier's per-request token limit and fail outright. `truncate_diff` in Step 3 caps this, but truncation means the model is drafting from a partial view — for genuinely large changes, stage and commit in smaller, more logical chunks rather than trusting a truncated diff to produce an accurate message.
- **Staging unrelated changes together.** If `git add` picks up two unrelated fixes at once, no system prompt can produce one honest, focused commit message for both — the model will either pick one to describe and ignore the other, or write a vague message that covers neither well. `git add -p` to stage hunks selectively is worth learning alongside this tool.
- **Treating the draft as always correct.** The model doesn't know *why* you made a change, only what the diff shows — it can misread intent (calling a deliberate refactor a "fix", for example) in ways a human glancing at the same diff wouldn't. Reading the draft before typing `y`, not just skimming it, is the entire point of the confirmation step.
- **Committing generated or vendored files by accident.** A diff that touches `uv.lock`, a minified bundle, or an auto-generated file wastes tokens and usually produces a low-quality, generic message — review what's staged (`git status`, `git diff --staged --stat`) before running the drafter, not after.

## What you just built

A real, working commit-message CLI: it captures your actual staged `git diff` via `subprocess`, drafts a Conventional-Commits-style message with a free-tier LLM guided by a prompt engineered specifically for this task, and only ever runs `git commit` after you've read the draft and explicitly said yes. Nothing here is a toy simulation — point it at your own staged work, or a real historical commit from this course's own repository, and it works against the actual text either way.

:::tip[Run a fuller version without any local setup]
[`examples/commit-message-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/commit-message-agent) in the course repo is a fuller version of the code above, with all six providers from the table wired up side by side (selected with one `LLM_PROVIDER` setting) and a `--dry-run`/`--commit`/`--stdin` set of CLI options already included. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Wire this up as a real [git alias](https://git-scm.com/book/en/v2/Git-Basics-Git-Aliases) (e.g. `git draft-commit = !uv run --project ~/commit-message-agent python commit_helper.py`) so it's one short command away in any repo, instead of always `cd`-ing into this project's folder.
- Add it as a prompt inside a [pre-commit](https://pre-commit.com/) hook — rather than replacing `git commit` outright, have the hook print the drafted message as a *suggestion* alongside whatever message the developer already typed, so it stays a second opinion rather than a gate.
- Try comparing drafts across two different providers on the *same* staged diff — do they pick the same Conventional Commits `type`? Where do they disagree, and what does that tell you about how much to trust any single model's read of "why" a change was made, versus just "what" changed?

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓

<ProjectProgressCheckbox projectId="2027-commit-message-agent" />
