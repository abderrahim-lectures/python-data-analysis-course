---
id: email-triage-agent
title: "Build a Personal Email-Triage Agent"
sidebar_label: "Build a Personal Email-Triage Agent"
slug: /projects/email-triage-agent
description: "Graduate from the in-browser playground to real Python: build an agent that categorizes, prioritizes, and drafts (but never sends) replies for your email, using a free-tier LLM."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Build a Personal Email-Triage Agent

<ProjectPublishedDate projectId="email-triage-agent" />

<ProjectGreeting />

Everything in the course so far ran in a sandboxed, in-browser playground — so you could start writing Python on day one with zero setup. This project is the graduation step: install Python for real on your own machine, then use it to build something genuinely useful — an agent that reads a batch of emails, tells you which ones actually matter, and drafts a suggested reply for the ones that need one. This assumes Python 101; nothing from Data Analysis is required.

This is optional and ungraded. See [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Load a bundled folder of sample emails — no real inbox, password, or IMAP setup required to complete this project.
2. Get a free-tier AI API key and write a prompt that categorizes each email (urgent / needs-reply / newsletter / fyi / spam-ish) and assigns it a priority.
3. Write a second prompt that drafts a suggested reply for anything that needs one — and build in a hard rule this agent never breaks: **it never sends anything, ever**. Every draft is only printed and saved locally for you to read and send yourself.
4. Run the whole pipeline end to end and read what it produced.
5. *(Optional, "go further")* Point the same script at your own real inbox over IMAP instead of the sample emails, using a Gmail "app password" — not your real password.

## Where to run this

**Locally with `uv`** is the primary, recommended path — it's real Python running on your own machine, the same "graduate to real Python" move as every other project in this series. The core lesson (Steps 1–4) needs nothing but the bundled sample emails, so there's no privacy tradeoff to worry about even running locally. Setup below walks through installing `uv`.

**GitHub Codespaces** works fine for the core lesson: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed, per the repo's `.devcontainer/devcontainer.json`) and run the exact same `uv` commands from a terminal in your browser tab. The bundled sample emails make this a genuinely complete way to do the whole project with zero local setup.

**Google Colab or Kaggle Notebooks** also work for the core lesson — create a new notebook, run `!pip install openai python-dotenv` in a cell, then paste the scripts below in as notebook cells. This is a lower-fidelity way to experience the project than a real local `uv` project (no separate files, no real project structure), so treat it as a quick way to experiment rather than the primary path.

**A note on the optional IMAP extension**: none of the three options above are a good place to type in a real email password, app password or not. If you try the optional "go further" step, do it locally, in a `.env` file that never leaves your machine — not in a notebook cell or a cloud IDE you don't fully control.

## Setup

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
uv init email-triage-agent
cd email-triage-agent
uv add openai python-dotenv
```

`openai` is the client library this project uses to call the LLM — every provider in the table below happens to expose an OpenAI-compatible Chat Completions endpoint, so one small client class works for all six, just pointed at a different `base_url`. `python-dotenv` lets you keep your API key in a local `.env` file instead of `export`-ing it every session.

### Get a free AI API key

**Pick whichever provider you like** — none of them require a credit card at the time of writing, and this course doesn't favor one over another.

| Provider | Where to get a key | Why you might pick it |
|---|---|---|
| **GitHub Models** *(suggested default)* | [github.com/settings/tokens](https://github.com/settings/tokens) — a personal access token with the `models: read` scope | No separate signup — you already have a GitHub account. More generous free-tier limits than Gemini's. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | The most commonly referenced option; used in earlier drafts of this page. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Fast inference, generous free tier, no card. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | One of the more generous permanent free quotas. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | High daily token volume, no card. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | One API, many free models — good for comparing providers. |

Whichever you pick, the process is the same:

1. Sign in and generate an API key on that provider's site.
2. **Never paste this key directly into code or commit it to a repository.** Create a `.env` file in your project folder instead:

```bash
# .env
LLM_PROVIDER=github
GITHUB_TOKEN=your-key-here
```

`LLM_PROVIDER` tells the script which provider you picked (`github`, `gemini`, `groq`, `mistral`, `cerebras`, or `openrouter`); it defaults to `github` if you leave it out. Only fill in the one key you actually need — the full list of variable names is in the repo example's `.env.example`.

:::tip[A .env file is often more convenient than export]
Instead of `export`-ing a key in every new terminal session, `python-dotenv` reads `.env` automatically the moment your script calls `load_dotenv()` — no per-session setup, and it's already excluded from git via `.gitignore` so you can't accidentally commit a real key.
:::

An API key is a secret, exactly like a password — anyone with it can use your account's quota. Treating it as an environment variable rather than a hardcoded string is the standard practice for exactly this reason, and it's the same real-world security habit taught in the [AI Agent project](/docs/projects/ai-agent).

With `uv` installed, the project set up, and `.env` filled in, you're ready to build — every step from here on assumes this is already done.

## Step 1: Load and inspect the sample emails

The repo example ships six short, realistic sample emails in `sample_emails/` — an urgent client request, a newsletter, two messages that genuinely need a reply, a spammy promo, and an automated FYI notification. They're plain text files shaped like a simplified `.eml`: a few `Header: value` lines, a blank line, then the body.

Create `triage.py` and start with a small parser:

```python
# triage.py
"""Loads sample emails and will, by the end of this lesson, categorize,
prioritize, and draft replies for them using a free-tier LLM.

Run with: uv run python triage.py
"""

from dataclasses import dataclass
from pathlib import Path

SAMPLE_EMAILS_DIR = Path("sample_emails")


@dataclass
class Email:
    filename: str
    sender: str
    subject: str
    date: str
    body: str


def parse_email(path: Path) -> Email:
    """Parses one plain-text sample email: a few `Header: value` lines, a
    blank line, then the body -- the same shape as a real .eml file's
    headers, simplified so no email-parsing library is needed."""
    text = path.read_text(encoding="utf-8")
    header_text, _, body = text.partition("\n\n")
    headers = {}
    for line in header_text.splitlines():
        if ":" in line:
            key, _, value = line.partition(":")
            headers[key.strip().lower()] = value.strip()
    return Email(
        filename=path.name,
        sender=headers.get("from", "unknown"),
        subject=headers.get("subject", "(no subject)"),
        date=headers.get("date", "unknown"),
        body=body.strip(),
    )


def load_emails(directory: Path) -> list[Email]:
    """Loads every .txt file in `directory`, sorted by filename."""
    return [parse_email(p) for p in sorted(directory.glob("*.txt"))]


if __name__ == "__main__":
    emails = load_emails(SAMPLE_EMAILS_DIR)
    print(f"Loaded {len(emails)} email(s) from {SAMPLE_EMAILS_DIR}/\n")
    for email in emails:
        print(f"[{email.filename}] {email.subject!r} from {email.sender}")
```

Copy the six sample files from the repo example's [`sample_emails/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/email-triage-agent/sample_emails) folder into your own project's `sample_emails/` folder, then run:

```bash
uv run python triage.py
```

`text.partition("\n\n")` is doing the real work here: it splits the file into exactly two pieces at the *first* blank line — everything before it (the headers) and everything after (the body) — which is enough structure to work with without pulling in a full email-parsing library for text this simple.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python triage.py` runs without errors and prints six loaded emails.</StepChecklistItem>
<StepChecklistItem>Each printed line shows a real subject and sender, not `"unknown"` or `"(no subject)"`.</StepChecklistItem>
<StepChecklistItem>`sample_emails/` exists in your project folder and contains the six `.txt` files.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- `parse_email` looks for the *first* blank line to separate headers from body. What would go wrong if one of the sample emails had a blank line somewhere inside its own body text?
- Real `.eml` files can have dozens of headers (`Message-ID`, `Content-Type`, `X-Mailer`, and more) that this parser silently ignores by only reading `from`, `subject`, and `date`. Why is ignoring the rest the right call for this project?

## Step 2: Categorize and prioritize each email with an LLM

Now hand each parsed email to a language model and ask it to sort it into a category and a priority — the actual triage step. Add this to `triage.py`:

```python
import json
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

# Every provider below exposes an OpenAI-compatible Chat Completions
# endpoint, so one client class covers all six -- only the base_url, model
# name, and which environment variable holds the key change.
PROVIDERS = {
    "github": {
        "base_url": "https://models.github.ai/inference",
        "api_key_env": "GITHUB_TOKEN",
        "model": "gpt-4o-mini",
    },
    "gemini": {
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
        "api_key_env": "GOOGLE_API_KEY",
        "model": "gemini-3.5-flash",
    },
    "groq": {
        "base_url": "https://api.groq.com/openai/v1",
        "api_key_env": "GROQ_API_KEY",
        "model": "llama-3.3-70b-versatile",
    },
    "mistral": {
        "base_url": "https://api.mistral.ai/v1",
        "api_key_env": "MISTRAL_API_KEY",
        "model": "mistral-small-latest",
    },
    "cerebras": {
        "base_url": "https://api.cerebras.ai/v1",
        "api_key_env": "CEREBRAS_API_KEY",
        "model": "llama-3.3-70b",
    },
    "openrouter": {
        "base_url": "https://openrouter.ai/api/v1",
        "api_key_env": "OPENROUTER_API_KEY",
        "model": "meta-llama/llama-3.3-70b-instruct:free",
    },
}


def build_client() -> tuple[OpenAI, str]:
    """Builds an OpenAI-compatible client for LLM_PROVIDER (default "github").
    Returns (client, model_name)."""
    provider = os.environ.get("LLM_PROVIDER", "github")
    config = PROVIDERS[provider]
    client = OpenAI(api_key=os.environ[config["api_key_env"]], base_url=config["base_url"])
    return client, config["model"]


TRIAGE_PROMPT = """You are an email triage assistant. Read the email below and respond with ONLY a JSON object (no other text, no markdown fence), with these exact keys:

- "category": one of "urgent", "needs-reply", "newsletter", "fyi", "spam-ish"
- "priority": one of "high", "medium", "low"
- "reasoning": one short sentence explaining the category and priority
- "needs_reply": true or false

Email:
From: {sender}
Subject: {subject}
Date: {date}

{body}
"""


def triage_email(client: OpenAI, model: str, email: Email) -> dict:
    """Asks the LLM to categorize and prioritize one email. Read-only:
    never modifies or sends anything -- just returns the model's verdict."""
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": TRIAGE_PROMPT.format(
            sender=email.sender, subject=email.subject, date=email.date, body=email.body,
        )}],
    )
    content = response.choices[0].message.content.strip()
    if content.startswith("```"):
        content = content.strip("`").removeprefix("json").strip()
    return json.loads(content)
```

Update the `if __name__ == "__main__":` block to actually call it:

```python
if __name__ == "__main__":
    client, model = build_client()
    emails = load_emails(SAMPLE_EMAILS_DIR)
    print(f"Triaging {len(emails)} email(s) with model '{model}'...\n")
    for email in emails:
        verdict = triage_email(client, model, email)
        print(f"[{email.filename}] {email.subject!r}")
        print(f"  category: {verdict['category']}   priority: {verdict['priority']}")
        print(f"  reasoning: {verdict['reasoning']}\n")
```

```bash
uv run python triage.py
```

The prompt asking for "ONLY a JSON object" and then parsing it with `json.loads` is what turns a free-text model response into something your code can actually branch on (`verdict["category"]`, `verdict["needs_reply"]`) — the same idea as `int(input(...))` turning free-typed keyboard text into something your code can do arithmetic on, just with a language model standing in for the keyboard. Models occasionally wrap JSON in a ```` ```json ```` fence despite being told not to; the `content.strip("`")` line is there specifically to survive that without crashing.

:::tip[Ask for a fixed set of categories, not free text]
`TRIAGE_PROMPT` spells out the exact five allowed category strings rather than asking the model to "come up with a category." A model given a fixed, explicit list is far more consistent from one email to the next than one asked to invent labels freely — which matters here, since downstream code (Step 3's `if verdict["needs_reply"]`) depends on the values being predictable.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python triage.py` prints a category, priority, and reasoning line for all six sample emails.</StepChecklistItem>
<StepChecklistItem>The urgent client email and the newsletter get visibly different categories and priorities.</StepChecklistItem>
<StepChecklistItem>No `JSONDecodeError` — if you see one, print the raw `content` string before parsing to see what the model actually returned.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- The spammy promo email (`04_spammy_promo.txt`) uses urgency language ("act now," "expires in 24 hours") very similar to the genuinely urgent client email. What in the *content* of each email (beyond just tone) would let a careful reader — or a careful prompt — tell them apart?
- What would you expect to happen if you removed the "respond with ONLY a JSON object" instruction and just asked the model to "categorize this email"? Try it, and look at what breaks in your Python code as a result.

## Step 3: Draft (but never send) a reply

This is the step where "agent" starts to mean something more than "categorizer" — for anything the model marked `needs_reply: true`, ask it to draft an actual reply. But this is also where this project draws a hard line: **the agent only ever drafts text. It never sends anything, to anyone, under any condition.** There is no SMTP code in this project at all — not commented out, not behind a flag, simply not present, because a script that *can* send email is one bug or one bad prompt away from actually doing it.

Add this to `triage.py`:

```python
DRAFT_REPLY_PROMPT = """Draft a short, professional reply to the email below. Write ONLY the reply body text -- no subject line, no commentary about what you're doing, just the reply itself, as if the recipient is about to review and send it.

Original email:
From: {sender}
Subject: {subject}

{body}
"""


def draft_reply(client: OpenAI, model: str, email: Email) -> str:
    """Asks the LLM to draft a reply. The result is ALWAYS just printed and
    saved to a local file for a human to review -- this function has no
    way to actually send anything, on purpose."""
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": DRAFT_REPLY_PROMPT.format(
            sender=email.sender, subject=email.subject, body=email.body,
        )}],
    )
    return response.choices[0].message.content.strip()
```

:::tip[Never let an agent send anything without you in the loop]
This is the single most important lesson in this project, more important than any specific line of code: an agent that can *draft* a reply is useful; an agent that can *send* one autonomously is a very different, much riskier thing — one wrong categorization, one prompt-injected instruction hidden in a message body, or one model having a bad day, and it's sent something you never approved, to someone real, that you can't take back. This project's `draft_reply` function returns a string and does nothing else — no `smtplib`, no "auto-send if confidence is high," no automatic anything. That's not a missing feature. It's the design. Keep that boundary if you extend this project yourself.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`draft_reply` is defined, takes an `Email`, and returns a plain string — nothing about it touches the network except the one LLM API call.</StepChecklistItem>
<StepChecklistItem>You can point to the exact place in your code where a reply would need to be sent from, and confirm that code doesn't exist.</StepChecklistItem>
<StepChecklistItem>You understand *why* this matters, not just that it's a rule — see the Socratic questions below.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Imagine a version of this project that auto-sends a reply whenever the model reports high confidence. What's a realistic way that could go wrong — for the urgent client email specifically, or for the spammy promo one?
- One of the sample emails (`04_spammy_promo.txt`) contains manipulative language designed to make a reader act fast without thinking. If a real attacker crafted an email specifically to manipulate an *AI agent* reading it (rather than a human), what might that look like, and how would never-auto-send protect against it even if the categorization step got fooled?

## Step 4: Run it end to end and review the output

Wire everything together — categorize every email, draft a reply for the ones that need one, and save each draft to a local `drafts/` folder instead of printing walls of text to the terminal:

```python
DRAFTS_DIR = Path("drafts")

if __name__ == "__main__":
    client, model = build_client()
    emails = load_emails(SAMPLE_EMAILS_DIR)
    DRAFTS_DIR.mkdir(exist_ok=True)
    print(f"Triaging {len(emails)} email(s) with model '{model}'...\n")

    for email in emails:
        verdict = triage_email(client, model, email)
        print(f"[{email.filename}] {email.subject!r}")
        print(f"  category: {verdict['category']}   priority: {verdict['priority']}")
        print(f"  reasoning: {verdict['reasoning']}")

        if verdict.get("needs_reply"):
            reply = draft_reply(client, model, email)
            draft_path = DRAFTS_DIR / f"{Path(email.filename).stem}_draft_reply.txt"
            draft_path.write_text(reply, encoding="utf-8")
            print(f"  -> draft reply saved to {draft_path}  (NOT sent -- review and send yourself)")
        print()

    print(f"Done. Review anything in {DRAFTS_DIR}/ yourself before sending.")
```

```bash
uv run python triage.py
```

Open the files in `drafts/` and actually read them — this is the point of the whole project. Would you send what the model drafted, as-is? Would you edit it first? For at least one draft, rewrite it in your own words before you'd consider it "done" — that editorial pass is exactly the human-in-the-loop step this project is built around, not an afterthought bolted on top of it.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python triage.py` runs to completion and prints a triage line for all six sample emails.</StepChecklistItem>
<StepChecklistItem>`drafts/` contains a saved reply for each email the model marked `needs_reply: true`, and no file for the ones it didn't.</StepChecklistItem>
<StepChecklistItem>You've actually opened and read at least one draft reply, and could say whether you'd send it as-is or would edit it first.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Read the draft reply for `03_needs_reply_coworker.txt` (the Q3 numbers discrepancy). Does it actually resolve the discrepancy, or does it just acknowledge the question? What does that tell you about what a drafting model can and can't do on its own?
- If you ran this script twice on the same email, would you expect the two draft replies to be identical? Try it. What does the answer tell you about relying on a single LLM output as if it were a fixed, deterministic function?

## Optional, "go further": connect this to a real inbox

Everything above runs entirely on the bundled sample emails — no real inbox, no real password, nothing that leaves your machine. This section is deliberately **not** the primary path: it's an optional extension for once you're comfortable with how the script behaves, not something to reach for on day one.

Gmail (and most providers) support **App Passwords** — a separate, revocable, limited-purpose password you generate specifically for one application, instead of handing that application your real account password. If your real password ever needs to change, an app password can be revoked independently; if it ever needs to change, it doesn't touch your real login credentials at all. To create one for Gmail: enable 2-Step Verification on your Google account, then visit [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) and generate a new app password for "Mail." Use *that* generated password, never your real Gmail password, anywhere in this project.

Install the optional `imap-tools` package (not part of the core lesson's dependencies) and add your IMAP credentials to `.env`:

```bash
uv add imap-tools
```

```bash
# .env — add these three lines
IMAP_HOST=imap.gmail.com
IMAP_USER=you@gmail.com
IMAP_APP_PASSWORD=your-app-password-here
```

The repo example's [`fetch_from_imap.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/email-triage-agent/fetch_from_imap.py) fetches your most recent unread messages **read-only** — `mark_seen=False` means downloading a message here doesn't mark it as read in your real inbox — and saves each one as a local `.txt` file shaped exactly like `triage.py`'s sample emails:

```bash
uv run python fetch_from_imap.py
uv run python triage.py real_emails
```

If you don't use Gmail, most providers support IMAP with an app password or equivalent — check your provider's account security settings for the equivalent option, and adjust `IMAP_HOST` accordingly.

:::tip[Least privilege, applied to your own inbox]
An app password scoped to "Mail" only, that you can revoke at any time without touching your real login, is the same *least-privilege* idea behind API keys, file permissions, and scoped access tokens elsewhere in this course — grant the smallest amount of access that gets the job done, not your full account. Never use your real Gmail password here, and never skip 2-Step Verification to make setup faster.
:::

## ⚠️ Common pitfalls

- **The model doesn't return valid JSON.** Despite the prompt's "ONLY a JSON object" instruction, a model can still occasionally add a stray sentence or wrap the output in a code fence. If `json.loads` raises, print the raw `content` string first to see exactly what came back before assuming your code is at fault.
- **Confusing "drafted" with "sent."** A saved file in `drafts/` is not a sent email — nothing has gone anywhere yet. If you want to actually reply, open your real email client and copy the draft in yourself; that's the design, not a missing step.
- **Rate limits on the free LLM tier.** Six emails is two LLM calls each (triage, plus a draft for anything needing a reply) — enough to occasionally hit a 429 on a free tier. This isn't a bug; see the [AI Agent project](/docs/projects/ai-agent)'s "Handling rate limits" section for the same pattern and a retry approach you can copy.
- **Treating the category/priority labels as ground truth.** The model's `"urgent"` or `"spam-ish"` verdict is a suggestion, not a fact — it can misjudge a terse but genuinely urgent message as low priority, or a legitimate mailing list as spam. Skim the categorization yourself before trusting it blindly, especially early on.

## What you just built

A small but complete triage pipeline: parse, categorize with an LLM, draft with a second LLM call, and — critically — stop there. Nothing here is a toy simplification of the safety boundary; a production email assistant handling your real inbox should draw the exact same line between "the agent decides what to say" and "a human decides whether to actually say it," just with more emails and possibly more categories. The size of the inbox changes; the boundary shouldn't.

## Where to go from here

- Add more categories or a finer priority scale, and see how the prompt needs to change to keep the model consistent as the label set grows.
- Extend `parse_email` to handle real `.eml` files (Python's built-in `email` module parses these properly, including attachments and multipart bodies) instead of the simplified plain-text format used here.
- Try a second LLM call that reviews the *first* model's draft before saving it — a simple two-pass "draft, then critique" pattern, and a gentle first taste of multi-step agent pipelines like the ones in the [AI Agent project](/docs/projects/ai-agent).

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓

<ProjectProgressCheckbox projectId="email-triage-agent" />
