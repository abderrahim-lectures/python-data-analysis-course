---
id: github-issue-triage-agent
title: "Build a GitHub Issue Triage Agent"
sidebar_label: "Build a GitHub Issue Triage Agent"
slug: /projects/github-issue-triage-agent
description: "Graduate from the in-browser playground to real Python: fetch open issues from a real public GitHub repo and use a free-tier LLM to draft triage-label suggestions for a human maintainer to review."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Build a GitHub Issue Triage Agent

<ProjectPublishedDate projectId="github-issue-triage-agent" />

<ProjectGreeting />

Every open-source repo with any traffic accumulates a backlog of untriaged issues — bug reports, feature requests, questions, and duplicates, all sitting there unlabeled until a maintainer has time to sort through them by hand. This project builds a small script that does the first pass for them: it fetches a real public repo's OPEN issues straight from GitHub's own API, sends each one to a free-tier LLM, and prints a report suggesting a triage label and a one-sentence rationale for each issue — the kind of thing a maintainer could skim in a minute instead of reading every issue from scratch.

This assumes Python 101 — nothing from Data Analysis is required. It's optional and ungraded; see [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Install `uv`, get a free-tier LLM API key, and set up a small project.
2. Fetch OPEN issues from a real public GitHub repo using GitHub's free REST API — no authentication required for public reads.
3. Write a prompt that turns one issue's title and body into a request for a suggested triage label and a one-sentence rationale.
4. Call the LLM for each issue and parse its reply.
5. Print a readable triage report, and run the whole thing end to end against a real repo.

## Where to run this

**Locally with `uv`** is the primary, recommended path — the same "graduate to real Python" move as every other project in this section.

**GitHub Codespaces** works just as well, and is notably convenient for this particular project: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed, per the repo's `.devcontainer/devcontainer.json`) and you're already sitting inside a `git`/`gh`-aware environment with a real GitHub identity attached — a natural fit for a project that's all about GitHub repos and issues.

**Google Colab or Kaggle Notebooks** are also fine here — this is a lightweight, API-calling script with no local file server or long-running process to manage, so `!pip install requests python-dotenv openai` in a cell followed by pasting the code in as notebook cells works without much adaptation. A ready-made notebook version is in [`examples/github-issue-triage-agent/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/github-issue-triage-agent/notebook.ipynb) if you'd rather not paste the code in yourself:

{/* TODO: update these badge links to point at main once this PR merges */}
[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/add-github-issue-triage-agent-project/examples/github-issue-triage-agent/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/add-github-issue-triage-agent-project/examples/github-issue-triage-agent/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/add-github-issue-triage-agent-project?filepath=examples%2Fgithub-issue-triage-agent%2Fnotebook.ipynb)

## Setup

### 1. Install `uv`

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

### 2. Set up the project

```bash
uv init github-issue-triage-agent
cd github-issue-triage-agent
uv add requests python-dotenv openai
```

`requests` fetches issues from GitHub's REST API; `python-dotenv` loads your API key from a local `.env` file; `openai` is the client used to call GitHub Models by default (its API is OpenAI-compatible) — see the tip below if you pick a different LLM provider.

### 3. Get a free LLM API key

**Pick whichever provider you like** — none of them require a credit card at the time of writing, and this course doesn't favor one over another. The fuller example in the course repo ([`examples/github-issue-triage-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/github-issue-triage-agent)) supports all six out of the box, selected with one setting.

| Provider | Where to get a key | Why you might pick it |
|---|---|---|
| **GitHub Models** *(suggested default)* | [github.com/settings/tokens](https://github.com/settings/tokens) — a personal access token with the `models: read` scope | No separate signup — you already have a GitHub account, and this project already needs one for the issues API. More generous free-tier limits than Gemini's. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | The most commonly referenced option; used in earlier drafts of this page. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Fast inference, generous free tier, no card. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | One of the more generous permanent free quotas. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | High daily token volume, no card. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | One API, many free models — good for comparing providers. |

Whichever you pick, the process is the same: sign in and generate an API key on that provider's site, then **never paste it directly into code or commit it to a repository** — put it in a `.env` file instead (next section).

:::tip[Using a different provider than GitHub Models?]
The code in this lesson uses the `openai` package to call GitHub Models, since GitHub Models, Cerebras, and OpenRouter are all OpenAI-compatible (same client, different `base_url`). Gemini, Groq, and Mistral need their own SDK — `uv add google-generativeai`, `uv add groq`, or `uv add mistralai` respectively — and a small swap in `call_llm` below. The repo's fuller example ([`examples/github-issue-triage-agent/triage.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/github-issue-triage-agent)) already has all six wired up side by side.
:::

### 4. Create your `.env` file

```bash
# .env
LLM_PROVIDER=github
GITHUB_TOKEN=your-llm-provider-key-here

# Optional -- see Step 1 below. Raises GitHub's API rate limit; not required.
GITHUB_API_TOKEN=
```

`GITHUB_TOKEN` here is your **LLM provider** key (GitHub Models specifically) — not required to be the same token as `GITHUB_API_TOKEN`, which is a completely separate, optional token used only for the issues-fetching step below. It's fine for them to be the same personal access token if you generated one with both uses in mind, but neither this project nor GitHub requires that.

## Step 1: Fetch open issues from a real repo

GitHub exposes a free REST API for reading public repo data — no authentication needed to read issues from a public repo. Create `triage.py`:

```python
# triage.py
import requests

GITHUB_API_URL = "https://api.github.com"


def fetch_open_issues(owner: str, repo: str, limit: int = 10) -> list[dict]:
    """Fetch up to `limit` OPEN issues from a public GitHub repo."""
    response = requests.get(
        f"{GITHUB_API_URL}/repos/{owner}/{repo}/issues",
        params={"state": "open", "per_page": min(limit, 100), "sort": "updated"},
        headers={"Accept": "application/vnd.github+json"},
        timeout=10,
    )
    response.raise_for_status()
    # GitHub's /issues endpoint also returns pull requests -- a PR *is* an
    # issue internally. Real issues lack a "pull_request" key, so filter it.
    issues = [item for item in response.json() if "pull_request" not in item]
    return issues[:limit]


if __name__ == "__main__":
    issues = fetch_open_issues("psf", "requests", limit=10)
    for issue in issues:
        print(f"#{issue['number']}: {issue['title']}")
```

```bash
uv run python triage.py
```

You should see up to 10 lines, each a real, currently-open issue number and title from [`psf/requests`](https://github.com/psf/requests). `params={"state": "open", ...}` is doing the important filtering here — GitHub's default would include closed issues too, and this project only cares about ones that still need triage.

:::tip[GitHub's unauthenticated rate limit is low]
Unauthenticated requests to GitHub's REST API are capped at **60 requests/hour, per IP address** — easy to hit if you're re-running this script a lot while developing, or sharing an IP with classmates on the same network. This lesson only makes one API request per run (one call fetches up to 100 issues at once), so you likely won't hit it just following along — but if you do see a `403` with a message about rate limiting, that's what happened. Setting `GITHUB_API_TOKEN` (any personal access token, no scopes required for public reads) in your `.env` raises the limit to 5,000 requests/hour — see the optional step in Setup above.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python triage.py` runs without errors and prints real issue numbers and titles.</StepChecklistItem>
<StepChecklistItem>No printed line is a pull request — check a couple of the printed numbers against the repo's actual Issues tab on GitHub.</StepChecklistItem>
<StepChecklistItem>Changing `owner`/`repo` to a different real public repo still works.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- The `"pull_request" not in item` filter runs *after* the request comes back, on data GitHub already sent you. Could you instead ask GitHub to exclude pull requests in the request itself? What would you need to check in GitHub's API docs to find out?
- `sort="updated"` means the 10 issues you get are the 10 most *recently updated*, not the 10 oldest or newest-created. Why might "most recently updated" be a more useful default for a triage tool than "most recently created"?

## Step 2: Write a triage-suggestion prompt per issue

Each issue needs to become a prompt asking the model for exactly two things: a label from a fixed list, and a one-sentence rationale. Add this to `triage.py`:

```python
MAX_BODY_CHARS = 2000  # keep each issue's body well inside any model's context window
LABEL_CHOICES = ["bug", "feature", "question", "docs", "duplicate-looking", "other"]


def build_triage_prompt(issue: dict) -> str:
    title = issue.get("title") or "(no title)"
    body = (issue.get("body") or "(no description provided)")[:MAX_BODY_CHARS]

    return (
        "You are drafting a SUGGESTION for a human maintainer triaging a GitHub "
        "issue. You are not applying anything -- your output will be reviewed by "
        "a person before any label is added.\n\n"
        f"Choose exactly one label from this list: {', '.join(LABEL_CHOICES)}.\n\n"
        f"Issue title: {title}\n"
        f"Issue body:\n{body}\n\n"
        "Reply in exactly this two-line format, nothing else:\n"
        "Label: <one label from the list>\n"
        "Rationale: <one sentence explaining the suggested label and its priority>"
    )
```

Two deliberate choices here. First, `MAX_BODY_CHARS` truncates the issue body — some issues run to thousands of words (pasted stack traces, long logs), and there's no benefit to spending tokens on more of it than the model needs to get the gist; see the pitfalls section below for what happens if you skip this. Second, the prompt asks for a fixed, simple two-line reply format (`Label: ...` / `Rationale: ...`) rather than JSON — easier for a small free-tier model to follow reliably, and easy enough to parse with plain string methods in the next step.

:::tip["Suggest, don't apply" is a load-bearing instruction, not a nicety]
Notice the prompt explicitly tells the model it's drafting a suggestion for human review, not applying anything. This script backs that up with real behavior, not just wording: nothing in `triage.py` ever calls a GitHub endpoint that would add a label or comment to a real issue — it only reads issues and prints text to your terminal. That's a deliberate safety boundary, the same principle behind any AI tool that touches other people's things: draft confidently, act only with a human in the loop, especially for something as easy to get subtly wrong as a one-sentence read of somebody else's bug report.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`build_triage_prompt` includes the real issue title and (truncated) body, not placeholder text.</StepChecklistItem>
<StepChecklistItem>The prompt lists all of `LABEL_CHOICES` explicitly, not a vague "pick a label" instruction.</StepChecklistItem>
<StepChecklistItem>Printing `build_triage_prompt(issues[0])` for a real fetched issue produces a well-formed, readable prompt.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Why constrain the model to a fixed `LABEL_CHOICES` list instead of letting it invent any label it wants? What would you lose if you removed that constraint?
- If an issue's body is empty (some issues really do have none), what does `build_triage_prompt` currently send the model? Is that a reasonable prompt, or would you improve it?

## Step 3: Call the LLM and parse its reply

Now wire up a real LLM call, and turn its two-line reply back into a usable Python `dict`:

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)


def call_llm(prompt: str) -> str:
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # confirm this still has a free tier before relying on it
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,  # a triage suggestion should be consistent, not creative
    )
    return response.choices[0].message.content or ""


def parse_triage_reply(reply: str) -> dict:
    label, rationale = "other", reply.strip()
    for line in reply.splitlines():
        if line.lower().startswith("label:"):
            candidate = line.split(":", 1)[1].strip().lower()
            label = candidate if candidate in LABEL_CHOICES else candidate or "other"
        elif line.lower().startswith("rationale:"):
            rationale = line.split(":", 1)[1].strip()
    return {"label": label, "rationale": rationale}


def suggest_triage(issue: dict) -> dict:
    reply = call_llm(build_triage_prompt(issue))
    return parse_triage_reply(reply)
```

Don't forget `from dotenv import load_dotenv` plus `load_dotenv()` near the top of the file, so `os.environ["GITHUB_TOKEN"]` actually finds the key from your `.env` file — same pattern as the [AI Agent project](/docs/projects/ai-agent).

`parse_triage_reply` deliberately falls back to `label="other"` and the raw reply as the rationale if the model doesn't follow the requested two-line format exactly — free-tier models occasionally add stray text or skip a line, and a slightly malformed triage *draft* is still more useful printed for a human to skim than dropped silently on a parsing error.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>Calling `suggest_triage` on one real fetched issue returns a `dict` with a real `label` and a real, sentence-length `rationale` — not an error or empty strings.</StepChecklistItem>
<StepChecklistItem>The returned `label` is always one of `LABEL_CHOICES` (or the `"other"` fallback), never arbitrary text leaking through unparsed.</StepChecklistItem>
<StepChecklistItem>Deliberately feeding `parse_triage_reply` a malformed reply (e.g. just `"I think this is a bug"`, no `Label:`/`Rationale:` lines) doesn't crash — it falls back gracefully.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- `temperature=0.2` biases the model toward its most likely, least "creative" response. Why might a low temperature matter more for a triage tool than it would for, say, a creative writing assistant?
- If you ran `suggest_triage` on the *same* issue twice, would you expect the exact same rationale both times? What does your answer suggest about how much a maintainer should trust a single suggestion versus treating it as one data point?

## Step 4: Print the report and run it end to end

Put the whole pipeline together — fetch, suggest, report:

```python
import time


def print_triage_report(owner: str, repo: str, issues: list[dict], suggestions: list[dict]) -> None:
    print("=" * 72)
    print(f"Triage suggestions for {owner}/{repo} -- {len(issues)} open issue(s)")
    print("These are DRAFT suggestions. Review each one before applying any label.")
    print("=" * 72)
    for issue, suggestion in zip(issues, suggestions):
        print(f"\n#{issue['number']}: {issue['title']}")
        print(f"  {issue['html_url']}")
        print(f"  Suggested label: {suggestion['label']}")
        print(f"  Rationale:       {suggestion['rationale']}")


if __name__ == "__main__":
    owner, repo = "psf", "requests"
    issues = fetch_open_issues(owner, repo, limit=10)

    suggestions = []
    for issue in issues:
        suggestions.append(suggest_triage(issue))
        time.sleep(0.5)  # a small, deliberate gap between LLM calls

    print_triage_report(owner, repo, issues, suggestions)
```

```bash
uv run python triage.py
```

You should see a full report: a header naming the repo and issue count, then one block per issue with its number, title, real GitHub URL, suggested label, and one-sentence rationale — plus that reminder line up top that these are drafts, not applied changes. Try pointing `owner`/`repo` at a different real, active public repo (anything with open issues works) and confirm the report adapts to genuinely different issue content, not just repeating the same output.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>Running `triage.py` end to end prints a full report with no unhandled tracebacks.</StepChecklistItem>
<StepChecklistItem>Every issue in the report has a real GitHub URL, a suggested label, and a non-empty rationale.</StepChecklistItem>
<StepChecklistItem>Running it against a second, different real public repo produces genuinely different suggestions, not a copy-pasted-looking report.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- If two issues in the same repo are near-duplicates of each other, would this script notice? What would it take to add a "possible duplicate of #N" suggestion — what extra information would the prompt need?
- Right now every issue gets its own separate LLM call. What would change, for better or worse, if you instead sent all 10 issues to the model in a single prompt and asked for 10 labeled suggestions back at once?

## ⚠️ Common pitfalls

- **Hitting GitHub's unauthenticated rate limit on a busy repo or a fast dev loop.** 60 requests/hour sounds like a lot until you're re-running the script every minute while debugging. A `403` mentioning rate limiting means this, not a bug in your code — set `GITHUB_API_TOKEN` in `.env` to raise it to 5,000/hour.
- **Issues with very long bodies blowing past a model's context, or just wasting tokens/quota.** Some issues include full stack traces, pasted logs, or embedded screenshots-as-text that run to thousands of words. `MAX_BODY_CHARS` truncates this — remove that truncation and you risk a request that's slow, expensive against your free-tier quota, or in rare cases too large for the model entirely.
- **Treating the LLM's suggestion as ground truth instead of a draft.** A free-tier model reading a title and a truncated body has no access to the repo's actual conventions, its label taxonomy, or context from related issues — it can mislabel a real bug as a "question," or miss that two issues are duplicates. Always frame this as speeding up a human's first pass, never as a replacement for one.
- **Forgetting that GitHub's `/issues` endpoint also returns pull requests.** Skip the `"pull_request" not in item` filter from Step 1 and you'll end up asking an LLM to triage PRs as if they were bug reports — a confusing, wrong result for something that isn't an issue at all.

## What you just built

A real fetch → prompt → suggest → report pipeline against a live, public GitHub repo — not a toy dataset. The shape here generalizes well beyond triage: any workflow where you want an LLM to draft a first-pass judgment on a batch of real-world items (support tickets, pull request descriptions, customer messages) for a human to review follows the same fetch-one-item, build-a-focused-prompt, call-the-model, report-the-result loop you just wrote.

## Where to go from here

- **Actually apply labels — carefully, once you trust the suggestions.** The [`gh` CLI](https://cli.github.com/) (`gh issue edit 123 --add-label bug`) or the GitHub API's own issues-edit endpoint can add a label for real. If you build this, keep a human explicitly in the loop — e.g. print the suggestions first, prompt for confirmation per issue (or per batch) before calling the API, and never auto-apply a label straight from a model's first pass. Treat write access to someone else's repo's issues with real caution, especially one you don't maintain yourself.
- **Batch multiple issues into one LLM call** instead of one call per issue — fewer round trips, but a more complex prompt and a harder parsing problem (structured output/JSON mode is worth exploring here).
- **Add a "possible duplicate" check** by embedding issue titles (see the [RAG project](/docs/projects/rag-notes) for the embeddings pattern) and flagging pairs that are suspiciously similar, instead of relying on the LLM to remember every other open issue on its own.
- **Cache results** so re-running the script doesn't re-triage issues you've already reviewed — a simple JSON file keyed by issue number, checked before each LLM call, is enough for a first version.

:::tip[Run a fuller version without any local setup]
[`examples/github-issue-triage-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/github-issue-triage-agent) in the course repo is a fuller version of the code above, with all six providers from the table wired up side by side, selected with one setting, plus an optional `GITHUB_API_TOKEN` for the higher GitHub rate limit. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` already installed) and run it from there.
:::

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓

<ProjectProgressCheckbox projectId="github-issue-triage-agent" />
