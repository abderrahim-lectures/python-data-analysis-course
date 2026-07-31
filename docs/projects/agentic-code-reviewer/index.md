---
id: agentic-code-reviewer
title: "Build an Agentic Code Reviewer"
sidebar_label: "Build an Agentic Code Reviewer"
slug: /projects/agentic-code-reviewer
description: "Graduate from the in-browser playground to real Python: build a CLI tool that reads a real git diff via subprocess and asks a free-tier LLM to review it like a human would."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Build an Agentic Code Reviewer

<ProjectPublishedDate projectId="agentic-code-reviewer" />

<ProjectGreeting />

Every pull request eventually gets read by a human reviewer looking for bugs, style problems, missing tests, and confusing names — before that, though, it's just text: the output of `git diff`. This project builds a CLI tool that does that first pass automatically: it captures a real diff with Python's `subprocess` module, hands it to a free-tier language model with a carefully-designed reviewer system prompt, and prints back structured, actionable feedback — not a vague "looks good," but specific issues with a file, a category, a severity, and a suggested fix.

This assumes Python 101 and enough comfort with git to know what `git diff` shows you — nothing from Data Analysis is required. It's optional and ungraded; see [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Install `uv`, get a free-tier LLM API key, and set up a small project — all in one place, before any building starts.
2. Use Python's `subprocess` module to run `git diff` for real and capture its output as text.
3. Design a system prompt that turns a general-purpose LLM into a focused, structured code reviewer.
4. Send a diff to the model and print its feedback in a clear, readable format.
5. Run the whole tool against a real diff — your own uncommitted changes, and a specific past commit from this course's own repo history.

## Where to run this

**Locally with `uv`** is the primary, recommended path here, more so than for most other projects in this series — this tool's entire premise is running `git diff` against a real local git repository, and that means it needs an actual `.git` folder on disk to point at (your own project, or a clone of this course's repo).

**GitHub Codespaces** works well too: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, `uv`, and git are already installed) — it's a real clone with real history, so every step below, including the "review a real past commit" demo, works exactly as it does locally.

**Google Colab, Kaggle Notebooks, and Binder are a reasonable way to *try* the tool, but not to run it for real.** Neither gives you a real local git repository with commit history by default, and the whole premise of this tool is reviewing *your own* in-progress work — a notebook's ephemeral filesystem has none of that. The notebook below works around this honestly, rather than pretending the gap doesn't exist: it `!git clone`s this course's own repository into the notebook and reviews one real, small, historical commit from it with `git show`, so every piece of the tool (the `subprocess` diff capture, the system prompt, the LLM call, the structured output) still runs against real, real-looking output — it's just reviewing a fixed example commit instead of anything you personally wrote. Use it to see the tool work end to end with zero setup; switch to local `uv` or a Codespace once you want it pointed at your own actual changes.

{/* TODO: update these badge links to point at main once this PR merges */}
[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/add-agentic-code-reviewer-project/examples/agentic-code-reviewer/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/add-agentic-code-reviewer-project/examples/agentic-code-reviewer/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/add-agentic-code-reviewer-project?filepath=examples%2Fagentic-code-reviewer%2Fnotebook.ipynb)

## Setup

Everything you need before you write a line of the reviewer itself: a real Python, a free API key, and a small project to hold both.

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
uv init agentic-code-reviewer
cd agentic-code-reviewer
uv add openai python-dotenv
```

`openai`'s client library works here for every provider in the table below, not just OpenAI itself — GitHub Models, Gemini, Groq, Mistral, Cerebras, and OpenRouter all expose an OpenAI-compatible chat endpoint, so one client, pointed at a different `base_url`, is all this project needs. `python-dotenv` lets you keep your API key in a local `.env` file instead of `export`-ing it every session.

### Get a free LLM API key

**Pick whichever provider you like** — none of them require a credit card at the time of writing, and this course doesn't favor one over another. The fuller example in the course repo ([`examples/agentic-code-reviewer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/agentic-code-reviewer)) supports all six out of the box, selected with one setting.

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
Instead of `export`-ing a key in every new terminal session, `python-dotenv` reads a `.env` file in your project folder into `os.environ` automatically, the first time your script runs — see `load_dotenv()` in Step 3 below.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv --version` prints a version number.</StepChecklistItem>
<StepChecklistItem>`agentic-code-reviewer/` exists with a `pyproject.toml`, and `openai` and `python-dotenv` are installed.</StepChecklistItem>
<StepChecklistItem>You have a real API key from one provider, saved in a `.env` file in your project folder — not pasted into any script.</StepChecklistItem>
</StepChecklist>

## Step 1: Capture a git diff with `subprocess`

Python's `subprocess` module runs another program and captures its output as text — here, that program is `git` itself. This is a genuinely realistic use of `subprocess`: you're not simulating anything, you're running the exact same `git diff` command you'd type by hand, and reading back exactly what it would print to your terminal.

Create `review.py`:

```python
# review.py
import subprocess


def get_diff_uncommitted() -> str:
    """The diff between the working tree and the last commit -- staged and unstaged changes."""
    return _run_git(["diff", "HEAD"])


def get_diff_against(ref: str) -> str:
    """The diff between the working tree and another ref, e.g. 'main'."""
    return _run_git(["diff", ref])


def get_diff_for_commit(commit: str) -> str:
    """The diff introduced by one specific past commit, vs. its parent."""
    return _run_git(["show", commit])


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
    diff = get_diff_uncommitted()
    print(diff if diff.strip() else "No uncommitted changes to review.")
```

`subprocess.run([...], capture_output=True, text=True)` is the key line: passing the command as a **list** of arguments (`["git", "diff", "HEAD"]`) rather than one shell string avoids a whole class of shell-quoting and injection bugs, `capture_output=True` grabs stdout/stderr instead of letting them print directly to your terminal, and `text=True` decodes that output as a string instead of raw bytes. `check=False` plus a manual `if result.returncode != 0` is deliberate here rather than `check=True`: it lets this function raise its *own* clear error message (including git's real stderr) instead of a generic `CalledProcessError`.

Try it against this project itself — edit any file, don't commit, then run:

```bash
uv run python review.py
```

:::tip[This is the same subprocess pattern as any other CLI wrapper]
`subprocess.run` doesn't care that the program being run is `git` — it works identically for any command-line tool: `ls`, a shell script, another Python program. Once this pattern clicks, "let Python drive an existing CLI tool and use its output" becomes available for a lot more than just git.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`get_diff_uncommitted()` returns real diff text when you have uncommitted changes, and an empty string when you don't.</StepChecklistItem>
<StepChecklistItem>Running `review.py` inside a folder that isn't a git repo at all raises a clear `RuntimeError`, not a confusing traceback from deep inside `subprocess`.</StepChecklistItem>
<StepChecklistItem>You can explain, in your own words, why the command is passed as a list (`["git", "diff", "HEAD"]`) instead of the single string `"git diff HEAD"`.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- What would `_run_git(["diff", "HEAD"])` return for a brand-new git repo with a single commit and no uncommitted changes? Why is handling an empty diff, rather than assuming there's always something to review, part of writing this function correctly?
- `check=False` was a deliberate choice above. What would change about the error a caller sees if you used `check=True` instead and let `subprocess.CalledProcessError` propagate unhandled?

## Step 2: Design the review system prompt

A language model with no instructions will happily produce "looks good to me!" for almost anything — useless as a reviewer. The **system prompt** is what turns a general-purpose chat model into a reviewer that behaves consistently: what to look for, what to ignore, and what shape its answer should take.

```python
SYSTEM_PROMPT = """\
You are an experienced, pragmatic senior software engineer doing a code review.
You will be given a unified git diff. Review ONLY what the diff actually
changes -- do not comment on surrounding code you can't see, and do not
invent context that isn't in the diff.

For each issue you find, report:
- file and, if visible in the diff's @@ hunk header, the approximate line
- category: one of Bug, Style, Missing Test, Unclear Naming, Security, Other
- severity: Critical, Warning, or Suggestion
- a short, concrete explanation of the issue
- a specific suggested fix, not just "consider improving this"

Focus on:
- likely bugs (off-by-one errors, unhandled edge cases, wrong operators,
  mutated shared state)
- style inconsistencies with the surrounding code
- missing or clearly inadequate test coverage for the change
- unclear variable/function names that would confuse the next reader
- obvious security issues (secrets, injection, unsafe deserialization)

If the diff genuinely has no issues, say so plainly and briefly -- do not
invent problems just to have something to say. Never respond with just
"looks good" and nothing else; always state what you checked.

Format your response as a numbered list of issues (or a short "no issues
found, because ..." paragraph), not prose paragraphs.
"""
```

Three deliberate design choices worth noticing:

- **"Review ONLY what the diff actually changes"** stops the model from inventing plausible-sounding complaints about code it can't actually see — a diff shows changed lines plus a little surrounding context, not the whole file.
- **A required structure** (file, category, severity, explanation, fix) is what turns free-form chat into something you can actually act on quickly, the same reason a human reviewer's "LGTM with two comments" is more useful than a paragraph of vague impressions.
- **An explicit instruction to say when nothing's wrong** exists because models tend toward being agreeable — without this line, some models manufacture minor nitpicks just to seem thorough, which trains you to stop trusting the tool's output.

:::tip[Iterate on the prompt like you would on code]
Treat this system prompt as a first draft, not a finished spec. Run it against a diff you already know has a specific bug in it — if the model misses it, or the response format drifts, tighten the wording and try again. Prompt engineering for a focused task like this is closer to writing a very precise spec than "asking nicely."
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>You can explain, in your own words, why the prompt tells the model to say when it finds nothing wrong, instead of leaving that unstated.</StepChecklistItem>
<StepChecklistItem>The prompt specifies a concrete output structure (file, category, severity, explanation, fix), not just "give feedback."</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- If you removed the "Review ONLY what the diff actually changes" instruction, what kind of mistake would you expect the model to start making on a diff that only changes one line in the middle of a large function?
- The prompt asks for a severity level per issue. What would a reviewer tool that reported *every* issue as equally important actually be worse at, compared to one that distinguishes Critical from Suggestion?

## Step 3: Call the LLM and print structured feedback

Wire the diff-capturing code from Step 1 and the system prompt from Step 2 together into one working reviewer:

```python
# review.py (continued -- add these imports and functions)
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()  # reads .env into the environment, if present

MAX_DIFF_CHARS = 12_000  # see the "huge diffs" pitfall below


def truncate_diff(diff: str, max_chars: int = MAX_DIFF_CHARS) -> str:
    """Cuts an oversized diff down to a size that fits a free-tier context window."""
    if len(diff) <= max_chars:
        return diff
    return diff[:max_chars] + f"\n\n... [diff truncated -- {len(diff) - max_chars} more characters not shown] ..."


def review_diff(diff: str) -> str:
    """Sends a diff to the configured free-tier LLM and returns its review as text."""
    if not diff.strip():
        return "No changes to review -- the diff is empty."

    client = OpenAI(
        api_key=os.environ["GITHUB_TOKEN"],
        base_url="https://models.github.ai/inference",
    )
    diff = truncate_diff(diff)
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # confirm this still has a free tier before running
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Review this diff:\n\n```diff\n{diff}\n```"},
        ],
    )
    return response.choices[0].message.content


if __name__ == "__main__":
    diff = get_diff_uncommitted()
    print(f"Reviewing {len(diff)} characters of diff...\n")
    print(review_diff(diff))
```

`truncate_diff` matters more here than it might first appear — see the pitfalls section below for why a large diff isn't just slow, it can silently fail or get a shallow review. Wrapping the diff in a fenced ` ```diff ` code block in the user message, rather than pasting it in raw, is a small but real signal to the model about what kind of text it's looking at.

Run it:

```bash
uv run python review.py
```

:::tip[Using a different provider?]
Swap the `OpenAI(...)` block for a different `base_url` and key — e.g. `base_url="https://api.groq.com/openai/v1"` with `api_key=os.environ["GROQ_API_KEY"]` for Groq, or `base_url="https://generativelanguage.googleapis.com/v1beta/openai/"` with `api_key=os.environ["GOOGLE_API_KEY"]` for Gemini's OpenAI-compatible endpoint. Everything else in this file stays the same. See [`examples/agentic-code-reviewer/review.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/agentic-code-reviewer/review.py) in the course repo for all six wired up side by side, selectable with one environment variable.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python review.py` prints a numbered list of real issues (or a clear "no issues found" message) for a diff you know has changes in it.</StepChecklistItem>
<StepChecklistItem>Each reported issue names a file and a category, not just a vague comment.</StepChecklistItem>
<StepChecklistItem>Running it with an empty diff prints "No changes to review" instead of making an API call at all.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- `review_diff` returns early with a fixed string when the diff is empty, before ever building an `OpenAI` client. Why is that ordering — checking first, calling the API second — worth doing deliberately, rather than just letting an empty prompt go to the model?
- If two different runs of `review_diff` on the *exact same* diff produced two different lists of issues, would that surprise you? What does that suggest about treating this tool's output as a checklist to blindly trust versus a starting point for a human review?

## Step 4: Run it against a real diff, end to end

Two realistic ways to use this tool, both worth trying:

**1. Review your own uncommitted changes** — the everyday use case. Make a small, deliberate change to any file (introduce an obvious bug on purpose, if you want a clean test), then:

```bash
uv run python review.py
```

**2. Review a specific commit from this course's own history** — a good way to see the tool work on a real diff you didn't write yourself. Add a small CLI option so you can point it at any commit by its hash:

```python
# review.py (continued)
import argparse
import sys


def get_diff_for_commit(commit: str) -> str:
    """The diff introduced by one specific past commit, vs. its parent."""
    return _run_git(["show", commit])


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Review a git diff with a free-tier LLM.")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--against", metavar="REF", help="Review the diff against REF, e.g. 'main'.")
    group.add_argument("--commit", metavar="SHA", help="Review one specific past commit's diff.")
    group.add_argument("--stdin", action="store_true", help="Read the diff from stdin instead of running git.")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    if args.stdin:
        diff = sys.stdin.read()
    elif args.commit:
        diff = get_diff_for_commit(args.commit)
    elif args.against:
        diff = get_diff_against(args.against)
    else:
        diff = get_diff_uncommitted()

    print(f"Reviewing {len(diff)} characters of diff...\n")
    print(review_diff(diff))
```

Clone or open this course's repo, then point the tool at a real past commit:

```bash
git log --oneline -10          # find a real commit hash to try
uv run python review.py --commit <hash>
```

You can also compare your current branch against another one, or pipe a diff in directly instead of letting the script run `git` itself — handy in a CI job that already has the diff as a file:

```bash
uv run python review.py --against main
git diff main | uv run python review.py --stdin
```

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python review.py --commit <a real hash>` prints real feedback about that commit's actual changes.</StepChecklistItem>
<StepChecklistItem>`uv run python review.py --against main` and piping via `--stdin` both produce sensible output on a repo with more than one branch.</StepChecklistItem>
<StepChecklistItem>You've run the tool on at least one diff you wrote yourself, and read the feedback closely enough to agree or disagree with it.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Pick a commit from this course's real history and review it with your tool. Does the feedback match what you'd expect a human reviewer to say about that change? Where does it clearly help, and where does it miss context a human would have had (like *why* the change was made)?
- `--stdin` lets something else generate the diff instead of this script's own `subprocess` calls. What's an example of a real workflow (hint: a CI pipeline, a pre-commit hook) where that flexibility matters more than convenience?

## ⚠️ Common pitfalls

- **Huge diffs blowing past the context window or free-tier token quota.** A multi-thousand-line diff (a big refactor, a vendored dependency bump) can exceed what the model can actually attend to, or simply exceed your free tier's per-request token limit and fail outright. `truncate_diff` in Step 3 caps this, but truncation means a partial review — for genuinely large changes, review it in smaller pieces (one file or one logical commit at a time) rather than trusting a truncated pass to have seen everything.
- **Reviewing generated or vendored files.** A diff that touches `uv.lock`, a minified bundle, or an auto-generated migration file wastes tokens on text no human wrote or needs commentary on, and can drown out real feedback about the files that actually matter. Filter these out before calling `git diff` (e.g. `git diff -- . ':!uv.lock' ':!*.min.js'`) rather than sending everything.
- **Over-trusting the AI review as a replacement for a human one.** This tool is a fast first pass, not a reviewer with full project context, team conventions, or the ability to ask you *why* you made a change. Treat its output the way you'd treat a very fast, slightly inexperienced colleague's comments — worth reading, not worth merging on alone.
- **Not handling an empty or missing diff.** Running the tool with no uncommitted changes and no `--commit`/`--against` flag against a repo with nothing to compare will produce an empty diff — `review_diff`'s early return for empty input (Step 3) exists specifically so this doesn't turn into a wasted API call or a confusing empty response from the model.

## What you just built

A real, working code-review CLI: it captures an actual git diff via `subprocess` — the same command you'd type by hand — and turns it into structured, actionable feedback from a free-tier LLM, guided by a system prompt engineered specifically for reviewing code rather than chatting generically. Nothing here is a toy simulation: point it at a real commit from this course's own history, or your own uncommitted work, and it reviews the actual text, not a canned example.

:::tip[Run a fuller version without any local setup]
[`examples/agentic-code-reviewer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/agentic-code-reviewer) in the course repo is a fuller version of the code above, with all six providers from the table wired up side by side (selected with one `LLM_PROVIDER` setting) and the `--against`/`--commit`/`--stdin` options from Step 4 already included. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Add a `--severity-min` flag that filters the model's output down to only `Critical` and `Warning` issues — useful once you're running this on larger diffs and want to triage quickly rather than read every `Suggestion`.
- Wire this into a pre-commit hook or a GitHub Actions job so every pull request in your own projects gets an automatic first-pass review comment — the `--stdin` option from Step 4 is exactly the shape a CI job needs (it already has the diff, generated another way).
- Try comparing feedback across two different providers on the *same* diff — do they flag the same issues? Where do they disagree, and what does that tell you about relying on any single model's review as ground truth?

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓

<ProjectProgressCheckbox projectId="agentic-code-reviewer" />
