---
id: blog-post-generator
title: "Build an Outline→Blog Post Generator"
sidebar_label: "Build an Outline→Blog Post Generator"
slug: /projects/blog-post-generator
description: "Graduate from the in-browser playground to real Python: build a CLI tool that turns a rough bullet-point outline into a polished blog post draft with a free-tier LLM — you own the structure and ideas, the model does the writing."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Build an Outline→Blog Post Generator

<ProjectPublishedDate projectId="blog-post-generator" />

<ProjectGreeting />

The hardest part of writing anything long isn't usually the typing — it's deciding what goes where. Once you have a solid outline, the actual prose is a mechanical (if tedious) job of turning each bullet into real sentences. This project builds a CLI tool that does exactly that: it reads a rough Markdown outline from a file, hands it to a free-tier language model with a carefully designed "expand this outline into prose" prompt, and prints back a polished blog post draft. You stay in charge of the structure, the ideas, and the voice; the model handles the grunt work of writing it out.

This assumes Python 101 and nothing from Data Analysis. It's optional and ungraded; see [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Install `uv`, get a free-tier LLM API key, and set up a small project — all in one place, before any building starts.
2. Load a Markdown outline from a real file with `pathlib`, so the tool works on outlines you already have.
3. Design a system prompt that turns a general-purpose LLM into a disciplined outline-expander: faithful to your structure, no invented sections.
4. Send the outline to the model and print back a complete, well-structured blog post draft.
5. Run the whole tool against a sample outline, then edit the result — and make a small change to your outline to see how the output tracks it.

## Where to run this

**Locally with `uv`** is the primary, recommended path here — the tool's whole job is reading *your own* outlines from files on your machine, so it works best where those files actually live.

**GitHub Codespaces** works fine too: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed), and run the same `uv` commands from a terminal in your browser tab. There's even a sample outline bundled in the example folder to try it on immediately.

**Google Colab, Kaggle Notebooks, and Binder** work for trying the idea out — nothing here needs a GPU. The notebook version of this project asks for your API key interactively with `getpass` and uses a bundled sample outline fetched from the repo. Use it to see the tool work end to end with zero setup; switch to local `uv` once you want it pointed at your real outlines:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/blog-post-generator/notebook.ipynb)
[![Open in Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/blog-post-generator/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fblog-post-generator%2Fnotebook.ipynb)

**opencode** *(optional)* — a free, open-source AI coding agent that runs in your terminal. If you'd rather have an agent write and run this project for you than type the code yourself, install it with `curl -fsSL https://opencode.ai/install | bash` (or `npm install -g opencode-ai`) and point it at this repo with the same API key from Setup below. It's optional — this project's whole point is building it yourself, so treat it as a bonus, not a shortcut.

## Setup

Everything you need before you write a line of the generator itself: a real Python, a free API key, and a small project to hold both.

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
uv init blog-post-generator
cd blog-post-generator
uv add openai python-dotenv
```

`openai`'s client library works here for every provider in the table below, not just OpenAI itself — GitHub Models, Gemini, Groq, Mistral, Cerebras, and OpenRouter all expose an OpenAI-compatible chat endpoint, so one client, pointed at a different `base_url`, is all this project needs. `python-dotenv` lets you keep your API key in a local `.env` file instead of `export`-ing it every session.

### Get a free LLM API key

**Pick whichever provider you like** — none of them require a credit card at the time of writing, and this course doesn't favor one over another. The fuller example in the course repo ([`examples/blog-post-generator/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/blog-post-generator)) supports all six out of the box, selected with one setting.

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
<StepChecklistItem>`blog-post-generator/` exists with a `pyproject.toml`, and `openai` and `python-dotenv` are installed.</StepChecklistItem>
<StepChecklistItem>You have a real API key from one provider, saved in a `.env` file in your project folder — not pasted into any script.</StepChecklistItem>
</StepChecklist>

## Step 1: Read the outline from a file

`pathlib.Path` is Python's modern way of handling file paths, and `.read_text()` turns a whole file into one string. The tool's input is a Markdown outline — a nested list of headings and bullets that captures your structure without any prose. The simplest, most honest design takes one file on the command line:

```python
# generate.py
import argparse
from pathlib import Path


def load_outline(path: str | Path) -> str:
    """Reads a Markdown outline file and returns its contents as a single string."""
    return Path(path).read_text(encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Turn a rough Markdown outline into a polished blog post draft."
    )
    parser.add_argument("outline", help="Path to your outline as a .md or .txt file.")
    parser.add_argument("--provider", help="Override LLM_PROVIDER for this run, e.g. 'groq'.")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    outline = load_outline(args.outline)
    print(f"Loaded outline: {len(outline)} characters")
```

`encoding="utf-8"` matters more than it might seem — without it, Python falls back to a platform-dependent default encoding, and the same script can silently misread accented characters on Windows versus macOS/Linux. Being explicit about the encoding is the reliable choice for text that may contain them (which outlines of any real topic usually do).

:::tip[An outline is a spec for your prose]
The quality of the generated draft is bounded by the quality of the outline. A terse outline ("Intro", "Main point", "Conclusion") gives the model nothing to work with and produces a shallow, generic post; a specific one ("Why Python's list comprehensions beat for-loops for this task — with the two examples from last week") gives it real material. This project rewards the same skill the course has been building all along: being specific about what you mean.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>You can run `uv run python generate.py my_outline.md` and it prints the outline's character count.</StepChecklistItem>
<StepChecklistItem>You have a real Markdown outline you'd actually write about, saved as a file — not just the bundled sample.</StepChecklistItem>
<StepChecklistItem>Running the script with a typo'd file path raises a clear `FileNotFoundError`, not a confusing error from somewhere deeper.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Why read the outline from a file rather than hardcoding it as a string in the script? What does that choice buy you beyond "the script is shorter"?
- The script reads a file but does nothing with its contents yet. What's the value of building and testing this input-handling step before the LLM part exists, instead of writing the whole thing at once?

## Step 2: Design the outline-expansion system prompt

A language model told only "write a blog post about this outline" will cheerfully invent new sections, pad with filler, and drift far from what you actually wanted. The system prompt below is what turns a general-purpose chat model into a disciplined expander — faithful to your structure, and honest about not inventing material:

```python
SYSTEM_PROMPT = """\
You are an experienced, clear-writing blog post editor who expands outlines
into prose.

You will be given a Markdown outline. Expand it into a complete, well-
structured blog post draft. Follow these rules:

- Faithfulness: Cover every section and bullet in the outline, in the order
  given. NEVER invent sections, claims, or examples that are not in the
  outline. If a bullet is a question or a placeholder ("TODO", "need an
  example here"), write it as an honest rough passage and mark it with a
  bracketed note like [expand: find a concrete example], rather than
  inventing something to fill it.
- Structure: Preserve the outline's headings (##, ###) as your section
  headings. Add an engaging intro paragraph after the title, and a short
  conclusion, IF the outline calls for them -- but do not add sections the
  outline doesn't imply.
- Prose: Write in clear, conversational but professional prose. Expand each
  bullet into one or more paragraphs. Do not pad with fluff, repetition, or
  generic filler sentences.
- Voice: Write in the first person, in a confident but plain voice, as if
  the outline's author were writing it.

Output ONLY the draft. No preamble, no "here is your draft", no commentary.
"""
```

Three deliberate design choices worth noticing:

- **The faithfulness rule is stated first and absolutely** ("NEVER invent sections, claims, or examples that are not in the outline"), because a draft that adds made-up material isn't a bad draft — it's actively misleading about what you believe.
- **The placeholder handling** ("[expand: find a concrete example]") gives the model an honest escape hatch instead of forcing it to fabricate: when your outline has a hole, you get a clearly-marked hole in the draft, not a made-up fact to catch later.
- **"Output ONLY the draft"** keeps the result clean — no "here is your draft" wrapper, no editorializing, just the prose you asked for, ready to edit.

:::tip[The prompt is a spec you will iterate on]
Treat this system prompt as a first draft, not a finished spec. Run it against an outline you care about, then read the output critically: if it padded, tighten the "no filler" instruction; if it invented an example, strengthen the faithfulness rule. Prompt engineering for a focused task like this is closer to writing a very precise spec than "asking nicely."
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>You can explain, in your own words, why the prompt tells the model to write a bracketed placeholder instead of inventing content for a "TODO" bullet.</StepChecklistItem>
<StepChecklistItem>The prompt specifies the output's structure (headings preserved, no wrapper text), not just "write a blog post".</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- If you removed the "NEVER invent sections" instruction, what kind of mistake would you expect the model to start making on an outline that's missing an obvious section a typical blog post would have?
- The prompt asks for first-person, plain prose "as if the outline's author were writing it." How does that single instruction change what the draft feels like compared to a generic third-person "this article will explain..." style?

## Step 3: Call the LLM and print the draft

Wire the file-reading from Step 1 and the system prompt from Step 2 together into one working tool:

```python
# generate.py (continued -- add these imports and functions)
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()  # reads .env into the environment, if present

MAX_OUTLINE_CHARS = 12_000  # see the "overlong outlines" pitfall below


def truncate(outline: str, max_chars: int = MAX_OUTLINE_CHARS) -> str:
    """Cuts an oversized outline down to a size that fits a free-tier context window."""
    if len(outline) <= max_chars:
        return outline
    return outline[:max_chars] + f"\n\n... [outline truncated -- {len(outline) - max_chars} more characters not shown] ..."


def generate(outline: str, provider: str | None = None) -> str:
    """Sends an outline to a free-tier LLM and returns the expanded blog post draft."""
    client = OpenAI(
        api_key=os.environ["GITHUB_TOKEN"],
        base_url="https://models.github.ai/inference",
    )
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # confirm this still has a free tier before running
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Here is my outline:\n\n```markdown\n{truncate(outline)}\n```"},
        ],
    )
    return response.choices[0].message.content


if __name__ == "__main__":
    args = parse_args()
    outline = load_outline(args.outline)
    print(f"Loaded outline: {len(outline)} characters\n")
    print("Generating your draft...\n")
    print(generate(outline))
```

`truncate` matters more here than it might first appear — see the pitfalls section below for why a very long outline isn't just slow, it can silently fail or get a shallow result. Wrapping the outline in a fenced ` ```markdown ` code block in the user message, rather than pasting it in raw, is a small but real signal to the model about what kind of text it's looking at.

Run it against the bundled sample outline (or your own):

```bash
uv run python generate.py sample_outline.md
```

:::tip[Using a different provider?]
Swap the `OpenAI(...)` block for a different `base_url` and key — e.g. `base_url="https://api.groq.com/openai/v1"` with `api_key=os.environ["GROQ_API_KEY"]` for Groq, or `base_url="https://generativelanguage.googleapis.com/v1beta/openai/"` with `api_key=os.environ["GOOGLE_API_KEY"]` for Gemini's OpenAI-compatible endpoint. Everything else in this file stays the same. See [`examples/blog-post-generator/generate.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/blog-post-generator/generate.py) in the course repo for all six wired up side by side, selectable with one environment variable.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python generate.py sample_outline.md` prints a complete draft with your outline's headings preserved.</StepChecklistItem>
<StepChecklistItem>Every section and bullet from the outline appears in the draft — and no new sections were invented.</StepChecklistItem>
<StepChecklistItem>The draft has no wrapper text (no "here is your draft" preamble).</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- The user message fenced the outline in a `markdown` code block. What would likely go wrong if the outline were pasted in as raw text with no code fence?
- If you ran this tool twice on the exact same outline, would you expect identical drafts? What does that tell you about treating the output as a final post versus a starting point you edit in your own voice?

## Step 4: Iterate — edit the draft, then change the outline and regenerate

The tool becomes genuinely useful the moment you treat it as a *draft engine in a loop you control*, not a one-shot text factory. Two ways to work with it, both worth trying:

**1. Generate, then edit by hand.** Produce a draft and edit it in your editor — tighten sentences, fix anything the model got slightly wrong about your topic, add your own examples. The generated prose is the scaffolding; your edit is the actual writing. Save the result as a new file:

```bash
uv run python generate.py my_outline.md > draft.md
# open draft.md in your editor, edit it, save
```

**2. Change the outline, regenerate, and watch the draft track it.** This is the iteration that shows you the division of labor. Move one bullet to a different section, delete a section, or make one bullet more specific, then rerun:

```bash
# edit my_outline.md, then:
uv run python generate.py my_outline.md
```

The new draft should reflect your changes — the section moves, the deleted one disappears, the sharpened bullet produces sharper prose. When it *doesn't* track a change you made, that's a signal your prompt's faithfulness rule needs strengthening (Step 2), not a reason to shrug.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>You edited a generated draft by hand and saved the result — the model's draft is now visibly *your* writing, not its output verbatim.</StepChecklistItem>
<StepChecklistItem>You made at least one structural change to an outline and confirmed the regenerated draft tracked it (section moved, removed, or sharpened).</StepChecklistItem>
<StepChecklistItem>You can name a place where the tool genuinely helped you and a place where it clearly needed your judgment — the honest assessment this project is really teaching.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- If the regenerated draft *doesn't* reflect a change you made to the outline, is that more likely a prompt problem, a model limitation, or a sign you're using the tool wrong? How would you diagnose it?
- The lesson claims the quality of the output is bounded by the quality of the outline. Where in this project did you see that claim play out in practice?

## ⚠️ Common pitfalls

- **The model inventing sections or examples.** The faithfulness rule reduces this but doesn't eliminate it — a language model with a partial outline will sometimes "helpfully" fill in an obvious section you deliberately omitted. Always read the draft against your outline and strike anything you didn't write. The bracketed-placeholder instruction exists precisely because inventing is the failure mode that most damages trust in this tool.
- **Overlong outlines blowing past the context window or free-tier token quota.** A very detailed outline (or one where you pasted in full notes under each bullet) can exceed what the model can attend to, or simply exceed your free tier's per-request token limit. `truncate` in Step 3 caps this, but truncation means a partial expansion — for genuinely long material, split it into two generation runs and stitch the drafts together.
- **The draft being in "AI voice" — overpolished, hedged, or filler-heavy.** This is the most common reason generated drafts are recognizable as generated. The "no padding" and "first person, plain voice" instructions help; your own editing helps more. If every draft comes out the same bland tone regardless of what you wrote, tighten the voice instruction in the prompt.
- **Treating the output as publish-ready.** A model expanding your outline has no idea about facts, references, or your real opinions — it writes fluently from the outline alone. Publishing a generated draft unedited means publishing a draft that *you* didn't really write and may not even agree with. Edit it until it's yours, then it's a post.
- **Blurry outlines producing generic posts.** Feed a model "Intro / Body / Conclusion" and you get a generic blog post. Feed it a specific outline and you get a draft worth editing. If the output feels hollow, the fix is almost always more specificity in the outline, not a bigger model.

## What you just built

A real, working outline-expansion CLI: it reads a Markdown outline from a file, hands it to a free-tier LLM guided by a system prompt engineered specifically for disciplined expansion — faithful to your structure, honest about holes, no invented sections — and prints back a complete draft. You control the ideas and the structure; the model does the mechanical work of turning bullets into prose. It's a tool with a deliberately narrow, honest job, and that's exactly what makes it useful.

:::tip[Run a fuller version without any local setup]
[`examples/blog-post-generator/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/blog-post-generator) in the course repo is a fuller version of the code above, with all six providers from the table wired up side by side (selected with one `LLM_PROVIDER` setting), a bundled sample outline, and the `--provider` option already included. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Add a `--output` flag that writes the draft to a file, so you can open it in your editor immediately instead of copying from the terminal (or use shell redirection as in Step 4).
- Accept an outline from **stdin** with a `--stdin` flag, so you can pipe an outline from another tool: `cat outline.md | uv run python generate.py --stdin`.
- Add a **second pass** that takes your first draft *and* your specific critique of it, and rewrites just the passages you flagged — an iterative refinement loop that models how you'd actually edit a draft by hand.
- Generate a draft **section by section** instead of in one pass, so each section gets its own focused generation (and you can regenerate one section without rewriting the whole post).

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓

<ProjectProgressCheckbox projectId="blog-post-generator" />
