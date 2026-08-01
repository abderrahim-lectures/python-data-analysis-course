---
id: resume-tailor-agent
title: "Build a Resume & Cover-Letter Tailoring Agent"
sidebar_label: "Build a Resume & Cover-Letter Tailoring Agent"
slug: /projects/resume-tailor-agent
description: "Graduate from the in-browser playground to real Python: build a CLI tool that reads your resume and a job description, asks a free-tier LLM to score the match, draft a tailored cover letter, and suggest concrete resume edits — always from what's actually on your resume, never invented."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Build a Resume & Cover-Letter Tailoring Agent

<ProjectPublishedDate projectId="resume-tailor-agent" />

<ProjectGreeting />

Every job description is written to be read quickly, and the resumes that get shortlisted are the ones that look like they were written for *that specific posting* — not a generic document mailed to a hundred employers. This project builds a CLI tool that does the first draft of that tailoring for you: it reads your resume and a job description as plain text files, asks a free-tier language model to (1) score how well you match, (2) write a cover letter draft shaped around that specific posting, and (3) list concrete resume edits — with one hard rule baked into the system prompt: **only ever use facts that are already on your resume. Never invent skills, titles, or dates.**

This assumes Python 101 and nothing from Data Analysis. It's optional and ungraded; see [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Install `uv`, get a free-tier LLM API key, and set up a small project — all in one place, before any building starts.
2. Load your resume and a job description from real text files with `pathlib`, so the tool works on documents you already have.
3. Design a system prompt that turns a general-purpose LLM into a strict tailoring assistant with an explicit "no fabrication" rule.
4. Send both documents to the model and print back a structured result: a match score, a cover-letter draft, and a list of concrete resume edits.
5. Run the whole tool against a sample resume and a real job description, then judge whether the output is honest and useful.

## Where to run this

**Locally with `uv`** is the primary, recommended path here — the tool's whole job is reading *your own* resume and job descriptions from files on your machine, so it works best where those documents actually live.

**GitHub Codespaces** works fine too: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed), and run the same `uv` commands from a terminal in your browser tab. There's even a sample resume and a sample job description bundled in the example folder to try it on immediately.

**Google Colab, Kaggle Notebooks, and Binder** work for trying the idea out — nothing here needs a GPU. The notebook version of this project asks for your API key interactively with `getpass`, uses the bundled sample resume, and lets you paste a real job description (or fetch one from a URL). Use it to see the tool work end to end with zero setup; switch to local `uv` once you want it pointed at your real resume:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/resume-tailor-agent/notebook.ipynb)
[![Open in Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/resume-tailor-agent/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fresume-tailor-agent%2Fnotebook.ipynb)

**opencode** *(optional)* — a free, open-source AI coding agent that runs in your terminal. If you'd rather have an agent write and run this project for you than type the code yourself, install it with `curl -fsSL https://opencode.ai/install | bash` (or `npm install -g opencode-ai`) and point it at this repo with the same API key from Setup below. It's optional — this project's whole point is building it yourself, so treat it as a bonus, not a shortcut.

## Setup

Everything you need before you write a line of the tailor itself: a real Python, a free API key, and a small project to hold both.

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
uv init resume-tailor-agent
cd resume-tailor-agent
uv add openai python-dotenv
```

`openai`'s client library works here for every provider in the table below, not just OpenAI itself — GitHub Models, Gemini, Groq, Mistral, Cerebras, and OpenRouter all expose an OpenAI-compatible chat endpoint, so one client, pointed at a different `base_url`, is all this project needs. `python-dotenv` lets you keep your API key in a local `.env` file instead of `export`-ing it every session.

### Get a free LLM API key

**Pick whichever provider you like** — none of them require a credit card at the time of writing, and this course doesn't favor one over another. The fuller example in the course repo ([`examples/resume-tailor-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/resume-tailor-agent)) supports all six out of the box, selected with one setting.

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
<StepChecklistItem>`resume-tailor-agent/` exists with a `pyproject.toml`, and `openai` and `python-dotenv` are installed.</StepChecklistItem>
<StepChecklistItem>You have a real API key from one provider, saved in a `.env` file in your project folder — not pasted into any script.</StepChecklistItem>
</StepChecklist>

## Step 1: Read the resume and job description from files

`pathlib.Path` is Python's modern way of handling file paths, and `.read_text()` turns a whole file into one string. The tool needs two inputs — your resume and the job description — so the first decision is *where they come from*. Two files passed on the command line is the simplest, most honest design, and it means the tool works on documents you already have on disk:

```python
# tailor.py
import argparse
from pathlib import Path


def load_text(path: str | Path) -> str:
    """Reads a plain-text file and returns its contents as a single string."""
    return Path(path).read_text(encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Tailor a resume and draft a cover letter for a specific job description."
    )
    parser.add_argument("resume", help="Path to your resume as a .txt or .md file.")
    parser.add_argument("job", help="Path to the job description as a .txt or .md file.")
    parser.add_argument("--provider", help="Override LLM_PROVIDER for this run, e.g. 'groq'.")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    resume = load_text(args.resume)
    job = load_text(args.job)
    print(f"Loaded resume: {len(resume)} characters")
    print(f"Loaded job description: {len(job)} characters")
```

`encoding="utf-8"` matters more than it might seem — without it, Python falls back to a platform-dependent default encoding, and the same script can silently misread accented characters on Windows versus macOS/Linux. Being explicit about the encoding is the reliable choice for text that may contain them (names, languages, and job titles often do).

:::tip[Resumes and job descriptions are just text]
A `.docx` or PDF is a real resume, but for this project the honest input is plain text: export your resume to `.txt` or `.md` (any text editor can do this), and copy a job description's text into a file. The model reads characters, not formatting — bold, bullets, and page layout are irrelevant to it anyway.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>You can run `uv run python tailor.py path/to/resume.txt path/to/job.txt` and it prints the character counts of both files.</StepChecklistItem>
<StepChecklistItem>You have a copy of your real resume as a `.txt` or `.md` file, and at least one real job description saved the same way.</StepChecklistItem>
<StepChecklistItem>Running the script with a typo'd file path raises a clear `FileNotFoundError`, not a confusing error from somewhere deeper.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Why read the resume and job description from files rather than hardcoding them as strings in the script? What does that choice buy you beyond "the script is shorter"?
- The script reads two files but does nothing with their contents yet. What's the value of building and testing this input-handling step before the LLM part exists, instead of writing the whole thing at once?

## Step 2: Design the tailoring system prompt

The difference between a helpful tailoring assistant and a liability is almost entirely in the system prompt. A model told only "tailor my resume" will happily invent plausible-sounding skills, rename your job titles, and stretch dates — producing a document that sounds great and gets you into trouble in an interview. The prompt below makes honesty the whole point of the tool:

```python
SYSTEM_PROMPT = """\
You are a meticulous, honest resume-and-cover-letter tailoring assistant.

You will be given a RESUME and a JOB DESCRIPTION. Your job is to help the
candidate apply for THIS job, using ONLY facts that already exist in their
resume. This is non-negotiable:

- NEVER invent skills, technologies, tools, titles, employers, projects,
  dates, numbers, or credentials that are not already on the resume.
- NEVER reword an existing bullet point into something that is not plainly
  supported by it. Rephrase and re-order freely, but do not upgrade.
- If the resume is missing something the job clearly asks for, say so in
  the resume edits list instead of pretending the candidate has it.

Produce exactly three sections:

1. MATCH SCORE: A number from 0-100 with a two-sentence rationale. Be
   honest -- an 82 with a clear explanation beats a 95 that can't be backed
   up by the resume.

2. COVER LETTER DRAFT: A complete, ready-to-edit cover letter of 2-3 short
   paragraphs, addressed to a hiring manager, that connects specific items
   already on the resume to the specific requirements of THIS job. Every
   claim it makes must trace back to the resume.

3. RESUME EDITS: A numbered list of concrete, actionable changes to make
   to the resume for this job -- reordering bullets, swapping which
   projects get highlighted, removing irrelevant lines, adding keywords
   that genuinely match existing experience. Each edit states what to
   change and why. Where the resume genuinely lacks something the job
   wants, state that plainly as a gap, never as a fake achievement.

Be specific and concrete throughout. Do not pad. Do not flatter.
"""
```

Four deliberate design choices worth noticing:

- **The no-fabrication rule is stated first and absolutely** ("This is non-negotiable"), because it's the one failure mode that actively hurts the user — a cover letter full of invented experience isn't a bad first draft, it's a liability.
- **"Do not upgrade"** closes a subtler hole: a model that refuses to *invent* might still happily turn "used pandas" into "built production data pipelines with pandas". The prompt forbids rephrasing that isn't plainly supported by the original bullet.
- **A required output structure** (score → letter → edits) makes the result actionable and keeps the model from drifting into generic career advice.
- **The "say it's a gap" instruction** channels the model's tendency to please into something useful: instead of quietly papering over a missing requirement, it tells you exactly what to go learn or honestly address.

:::tip[The prompt is a spec you will iterate on]
Run this against your real resume and a real job description, then read the output critically. If the score feels inflated, tighten the scoring instructions. If the letter drifts toward generic, re-read the "connect specific items ... to the specific requirements" line. Treat the prompt like code with bugs in it, not a finished artifact.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>You can explain, in your own words, the difference between "never invent" and "do not upgrade", and why a tailoring tool needs both.</StepChecklistItem>
<StepChecklistItem>The prompt specifies a concrete output structure (score, cover letter, edits), not just "help me apply".</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- A model given only "tailor this resume to this job" will often invent experience. What specifically in the prompt above is meant to stop that, and where do you think a model might still slip through — and why does that mean the prompt alone isn't a complete safety guarantee?
- The prompt asks the model to report missing requirements as gaps instead of hiding them. How is that more useful to the candidate than a cover letter that quietly avoids mentioning the missing requirement?

## Step 3: Call the LLM and print the tailored result

Wire the file-reading from Step 1 and the system prompt from Step 2 together into one working tool:

```python
# tailor.py (continued -- add these imports and functions)
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()  # reads .env into the environment, if present

MAX_TEXT_CHARS = 30_000  # see the "overlong documents" pitfall below


def truncate(text: str, max_chars: int = MAX_TEXT_CHARS) -> str:
    """Cuts an oversized document down to a size that fits a free-tier context window."""
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + f"\n\n... [truncated -- {len(text) - max_chars} more characters not shown] ..."


def tailor(resume: str, job: str, provider: str | None = None) -> str:
    """Sends a resume + job description to a free-tier LLM and returns the tailored result."""
    client = OpenAI(
        api_key=os.environ["GITHUB_TOKEN"],
        base_url="https://models.github.ai/inference",
    )
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # confirm this still has a free tier before running
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"RESUME:\n```\n{truncate(resume)}\n```\n\nJOB DESCRIPTION:\n```\n{truncate(job)}\n```",
            },
        ],
    )
    return response.choices[0].message.content


if __name__ == "__main__":
    args = parse_args()
    resume = load_text(args.resume)
    job = load_text(args.job)
    print(f"Loaded resume: {len(resume)} characters")
    print(f"Loaded job description: {len(job)} characters\n")
    print("Generating match score, cover letter draft, and resume edits...\n")
    print(tailor(resume, job))
```

`truncate` matters more here than it might first appear — see the pitfalls section below for why a very long resume or job description isn't just slow, it can silently fail or get a shallow result. Wrapping each document in a fenced code block in the user message, rather than pasting it in raw, is a small but real signal to the model about where one document ends and the other begins.

Run it against the bundled sample files (or your real ones):

```bash
uv run python tailor.py sample_resume.txt sample_job.txt
```

:::tip[Using a different provider?]
Swap the `OpenAI(...)` block for a different `base_url` and key — e.g. `base_url="https://api.groq.com/openai/v1"` with `api_key=os.environ["GROQ_API_KEY"]` for Groq, or `base_url="https://generativelanguage.googleapis.com/v1beta/openai/"` with `api_key=os.environ["GOOGLE_API_KEY"]` for Gemini's OpenAI-compatible endpoint. Everything else in this file stays the same. See [`examples/resume-tailor-agent/tailor.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/resume-tailor-agent/tailor.py) in the course repo for all six wired up side by side, selectable with one environment variable.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python tailor.py sample_resume.txt sample_job.txt` prints all three sections: a match score with rationale, a cover-letter draft, and a numbered list of resume edits.</StepChecklistItem>
<StepChecklistItem>Every claim in the cover letter draft traces back to something actually in the resume — you can verify it by reading the two side by side.</StepChecklistItem>
<StepChecklistItem>The resume edits are concrete ("reorder these two bullets", "drop this line"), not vague ("make it better").</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- The user message fenced the resume and the job description as two separate code blocks. What would likely go wrong if they were sent as one blob of text with no clear boundary between them?
- If you ran this tool twice on the same resume and job description, would you expect identical output? What does that tell you about treating the match score as a definitive number versus a rough, conversation-starting estimate?

## Step 4: Use it for real and judge the output

The tool is only as good as your willingness to read its output critically. Two realistic ways to use it, both worth trying:

**1. A full run on your real resume and a real job description** — the everyday use case. Save both as text files, then:

```bash
uv run python tailor.py my_resume.txt my_job.txt
```

**2. The "no-fabrication" audit** — a deliberate quality check that this tool is uniquely well-suited for. Make a copy of the cover letter draft and, next to each claim, write the resume line it comes from. Any claim without a supporting line is a fabrication — and should not have been there. This is the same discipline the system prompt tries to bake in, and it's worth doing by hand at least once so you know how well your chosen model follows the rule:

```bash
uv run python tailor.py my_resume.txt my_job.txt > draft.txt
# then annotate draft.txt claim-by-claim against your resume
```

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>You've run the tool on your real resume + a real job description, not just the samples.</StepChecklistItem>
<StepChecklistItem>You did the no-fabrication audit on the resulting cover letter and found every claim traced back to the resume — or found the fabricated ones and noted what the model invented.</StepChecklistItem>
<StepChecklistItem>You can name at least one resume edit the tool suggested that you actually agree with, and one you'd reject — the tool's output is a starting point, not gospel.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- After the no-fabrication audit, if you found the model invented a skill you don't have, would you consider that a failure of the system prompt, of the model, or of the whole idea of automating this? How would you change the prompt to reduce it?
- The tool's resume edits sometimes suggest removing content to make room. How is a tailored resume different from a "best" resume, and why would one tool deliberately do that tradeoff for you?

## ⚠️ Common pitfalls

- **Fabricated experience slipping through.** The no-fabrication rule reduces inventing dramatically but doesn't eliminate it — language models are trained to be fluent, and "do not upgrade" can lose against a particularly eager model on a particularly tempting bullet point. This is exactly why Step 4's audit exists: the tool drafts, *you* verify. Never submit a generated cover letter without reading it against your resume line by line.
- **Overlong documents blowing past the context window or free-tier token quota.** A resume is usually short, but a verbose job description (some postings are paragraphs of boilerplate plus a long "requirements" list) can exceed what the model can attend to, or simply exceed your free tier's per-request token limit. `truncate` in Step 3 caps this, but truncation means a partial view — for genuinely long postings, paste the "requirements" section rather than the whole page.
- **Job descriptions that are scraped or PDF-converted garbage.** Copying text from a web page can drag in navigation menus, cookie banners, and formatting artifacts that waste tokens and confuse the model. Clean the text file before running the tool, and skim it once — if it has obvious junk, the output will be worse.
- **Treating the match score as objective truth.** The score is one model's opinion on one read, and it can be inflated, deflated, or swayed by how the posting is worded. Use it as a rough triage signal (which of several jobs to prioritize) rather than a verdict you optimize against by editing your resume's honesty.
- **Over-trusting the generated letter as final.** The draft is a strong starting point, not a finished letter in your voice. Run it, edit it, and make it sound like you — an AI-flavored generic letter is a recognizable (and counterproductive) first impression.

## What you just built

A real, working resume-tailoring CLI: it reads your resume and a job description from plain-text files, hands both to a free-tier LLM guided by a system prompt engineered specifically for honest tailoring — score, cover letter draft, and concrete edits — with a hard no-fabrication rule baked in. Nothing here is a toy simulation: point it at your actual resume and a real posting, and it produces a genuinely useful first draft of the work you'd otherwise do by hand, with the honesty boundary making it safe to use rather than a trap.

:::tip[Run a fuller version without any local setup]
[`examples/resume-tailor-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/resume-tailor-agent) in the course repo is a fuller version of the code above, with all six providers from the table wired up side by side (selected with one `LLM_PROVIDER` setting), a bundled sample resume and job description, and the `--provider` option from Step 4 already included. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Add a `--output` flag that writes the cover letter draft to its own file, so you can open it in your editor and start editing immediately instead of copying from the terminal.
- Accept a job description **URL** as an alternative to a file, using `urllib.request` (or `requests`) to fetch the page and strip obvious HTML — handy when you find a posting in a browser and want to run it without saving a file first.
- Add a second pass that takes the first cover letter draft *and* your critique of it, and rewrites — an iterative refinement loop that models how you'd actually edit a draft by hand.
- Batch a whole folder of saved job descriptions: loop over them, generate a tailored output per posting, and sort them by match score to triage which applications deserve the most effort. That turns the single-posting tool into a genuine job-search workflow.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓

<ProjectProgressCheckbox projectId="resume-tailor-agent" />
