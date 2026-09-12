---
title: "Build a Meeting-Notes Summarizer"
description: "Graduate from the in-browser playground to real Python: write a script that turns a raw meeting transcript into a structured summary, decisions, action items, and open questions, using a free-tier LLM and careful prompt design."
difficulty: "intermediate"
---

# 🤖 Build a Meeting-Notes Summarizer

Everything in the course so far ran in a sandboxed, in-browser playground, so you could start writing Python on day one with zero setup. This project is the graduation step: install Python for real on your own machine, then use it to build a tool that solves a genuinely annoying real-world problem, turning a wall of raw meeting-transcript text into a short, structured summary: what got decided, who owes what, and what's still unresolved. This assumes Python 101; nothing from Data Analysis is required.

This is optional and ungraded. See [Real-World Projects](/projects) for the full, growing list.

## 🎯 What you'll do

1. Install `uv`, a fast, modern tool for managing Python itself and your project's dependencies.
2. Get a free-tier LLM API key, any of six providers work.
3. Load a real meeting transcript (three realistic samples ship with this project, so it runs with zero setup).
4. Design a prompt that asks the model to return **structured JSON**, not free-flowing prose, the core, transferable skill of this project.
5. Call the model, then parse and validate its JSON response, handling the case where it comes back slightly malformed, which happens more often than you'd like.
6. Format the structured result as both readable Markdown and a `.json` file, and run the whole thing end to end on a real transcript.

## Where to run this

**Locally with `uv`** is the path this lesson's steps follow, and the recommended one, it's real Python running on your own machine, the same "graduate to real Python" move as every other project in this section. The Setup section below walks through installing it.

**GitHub Codespaces** is a zero-setup alternative if you'd rather not install anything locally yet: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed, per the repo's `.devcontainer/devcontainer.json`) and run the exact same `uv` commands from a terminal in your browser tab.

**Google Colab, Kaggle Notebooks, or Binder** work well too, and are genuinely good options here, this project is a lightweight script that makes a handful of API calls, not something that needs a GPU or a real project structure to be useful. A ready-to-run notebook version ships with this project, click a badge below to open it, no local setup required, or create your own notebook, run `!pip install openai python-dotenv` in a cell, paste the scripts below in as notebook cells, and set your API key with a notebook secret (Colab) or environment variable instead of a `.env` file.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/meeting-notes-summarizer/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/meeting-notes-summarizer/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fmeeting-notes-summarizer%2Fnotebook.ipynb)

## Setup

Everything you need before writing any summarization code, installing `uv`, creating the project, getting a free API key, and setting it up as an environment variable, lives in this one section, so you only have to do it once.

### 1. Install `uv`

`uv` is a single tool that replaces the usual "install Python, then install pip, then install a virtual environment tool, then install packages" chain, it can install and manage Python versions itself, alongside your project's dependencies.

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

`uv` can also fetch and manage an actual Python interpreter directly:

```bash
uv python install 3.12
```

### 2. Create the project

```bash
uv init meeting-notes-summarizer
cd meeting-notes-summarizer
uv add openai python-dotenv
```

`uv init` creates a small project (a `pyproject.toml` tracking your dependencies) and `uv add` installs packages into an isolated environment automatically, no manual virtual-environment setup. `openai` is used here because several free-tier providers, including the suggested default, expose an OpenAI-compatible API, so the one client library works across all of them, just pointed at a different `base_url`. `python-dotenv` lets you keep your API key in a local `.env` file instead of `export`-ing it every session.

### 3. Get a free LLM API key

**Pick whichever provider you like**, none of them require a credit card at the time of writing, and this course doesn't favor one over another.

| Provider | Where to get a key | Why you might pick it |
|---|---|---|
| **GitHub Models** *(suggested default)* | [github.com/settings/tokens](https://github.com/settings/tokens), a personal access token with the `models: read` scope | No separate signup, you already have a GitHub account. More generous free-tier limits than Gemini's. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | The most commonly referenced option. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Fast inference, generous free tier, no card. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | One of the more generous permanent free quotas. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | High daily token volume, no card. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | One API, many free models, good for comparing providers. |

Whichever you pick, the process is the same: sign in and generate an API key on that provider's site.

### 4. Create your `.env` file

**Never paste an API key directly into code or commit it to a repository.** Create a `.env` file in your project folder instead (and make sure `.env` is listed in `.gitignore`, right alongside `.venv`):

```bash
# .env
GITHUB_TOKEN=your-key-here
```

:::tip[A .env file beats `export`-ing every session]
`python-dotenv`'s `load_dotenv()` reads `.env` into `os.environ` automatically the moment your script starts, so you never have to remember to `export` a key in every new terminal window. See this course's [`examples/meeting-notes-summarizer/.env.example`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/meeting-notes-summarizer) for a template covering all six providers.
:::

With setup done, everything below is about the actual summarizer.

## Step 1: Load a sample transcript

A transcript is just speaker-labeled plain text, nothing fancier:

```text
Maria: Let's start with the API migration. Where are we?
James: About 70% done. I should finish the auth endpoints by Friday.
Maria: Good. Can you also write the migration guide for the team?
James: Yeah, I'll own that too.
Priya: Quick question -- are we still deprecating the v1 endpoints next month?
Maria: Let's hold off on that decision until James finishes the migration. I don't want to commit to a date yet.
```

### 1.1 Set up your transcripts folder and sample files

**👟 Starter hint:** Create a `transcripts/` folder and drop a plain-text meeting transcript into it, or copy one of the three realistic samples that ship with this project's repo example: a daily standup, a product-planning meeting, and an incident review (see [`examples/meeting-notes-summarizer/sample_transcripts/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/meeting-notes-summarizer/sample_transcripts)).

**🎯 Expected output:** A `transcripts/` folder containing at least one readable `.txt` transcript whose lines look like the speaker-labeled sample above.

**🩹 If it's off:** If there's nothing to load later, you've skipped this. Use the repo's bundled samples so the rest of the project runs with zero setup, a transcript you wrote won't hurt, but a realistic one makes the later extraction easier to sanity-check.

### 1.2 Write the loader

Loading it is the smallest possible step, deliberately:

```python
# load_transcript.py
"""Loads a plain-text meeting transcript from disk.

Run with: uv run python load_transcript.py transcripts/standup.txt
"""

import sys
from pathlib import Path

def load_transcript(path: str) -> str:
    """Reads a transcript file and returns its raw text."""
    text = Path(path).read_text(encoding="utf-8")
    if not text.strip():
        raise ValueError(f"{path} is empty -- nothing to summarize.")
    return text

if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "transcripts/standup.txt"
    transcript = load_transcript(path)
    print(f"Loaded {len(transcript)} characters from {path}")
    print(transcript[:200] + ("..." if len(transcript) > 200 else ""))
```

**👟 Starter hint:** Create `load_transcript.py` and run it on your sample file. It reads the file with `pathlib`, returns the raw text, and guards the single edge case a transcript reader actually cares about, an empty file.

**🎯 Expected output:** `uv run python load_transcript.py transcripts/standup.txt` prints a nonzero character count and a preview that looks like real transcript text.

**🩹 If it's off:** If the count prints `0`, the file path is wrong (run it from the same directory as `transcripts/`) or the file is empty. If it throws instead of loading, `Path.read_text(encoding="utf-8")` can't find or decode the file, double-check the path and that the file is plain UTF-8 text.

### 1.3 Verify the loader

**✅ Checklist**

- ✅ `uv run python load_transcript.py <path>` prints a nonzero character count and a preview that looks like real transcript text.
- ✅ Running it on a path that doesn't exist raises a clear Python error rather than silently doing nothing.
- ✅ Running it on an empty file raises the `ValueError` you wrote, not a confusing downstream error later.

**🤔 Socratic Question(s)**

- Why check for an empty transcript here, in Step 1, instead of just letting a blank prompt reach the LLM in a later step and seeing what happens?
- This function assumes the whole transcript fits comfortably in one prompt. What real-world transcript would break that assumption, and roughly how would you know before running this?

## Step 2: Design a structured-extraction prompt

This is the actual skill this project teaches: instead of asking a model for a free-form paragraph summary ("Please summarize this meeting"), you ask it to return **JSON in a specific shape**, a schema you define, so the output is something your own code can reliably parse, store, and act on afterward. This is the same idea as an API contract, just enforced through prompt wording instead of a type system.

The schema for this project: three lists, `decisions`, `action_items` (each with a `task` and an optional `owner`, when the transcript actually names one), and `open_questions`.

### 2.1 Write the system prompt and schema description

```python
# extract_prompt.py
"""Builds the structured-extraction prompt sent to the LLM.

Imported by summarize.py (Step 3) -- not meant to be run directly.
"""

SYSTEM_PROMPT = """You are an assistant that extracts structured information \
from meeting transcripts. You always respond with a single JSON object and \
nothing else -- no markdown code fences, no commentary before or after it."""

# The exact shape we require back. Spelling this out in the prompt itself,
# field by field, is what makes a small/free-tier model actually follow it --
# vague instructions like "return the decisions and action items as JSON"
# produce far less consistent shapes across runs.
JSON_SCHEMA_DESCRIPTION = """Respond with a JSON object with EXACTLY these keys:

{
  "decisions": ["short string describing one decision that was made", ...],
  "action_items": [
    {"task": "short string describing the task", "owner": "person's name, or null if not stated"},
    ...
  ],
  "open_questions": ["short string describing one unresolved question", ...]
}

Rules:
- Only include a decision if the transcript shows the group actually agreeing on something -- not just discussing an option.
- Only include an action item if someone (or the group) commits to doing it.
- "owner" must be null (not the string "null", not "TBD") when no specific person is named for that task.
- If a category has nothing to report, use an empty list -- never omit the key.
- Do not invent information that isn't in the transcript."""
```

**👟 Starter hint:** Start by defining `SYSTEM_PROMPT` and `JSON_SCHEMA_DESCRIPTION` as constants in `extract_prompt.py`, the system prompt pins the output to a single JSON object, and the schema description spells out the exact keys and the rules that keep the model honest.

**🎯 Expected output:** Two module-level constants exist: a system prompt that declares "respond with a single JSON object and nothing else," and a schema description that lists `decisions`, `action_items`, and `open_questions` with concrete rules.

**🩹 If it's off:** If the schema were described only in prose ("give me the decisions and action items as JSON"), a small/free-tier model produces far less consistent shapes across runs. That's why the exact keys and example shape are written out literally, don't skip the literal example.

### 2.2 Define `build_prompt`

**👟 Starter hint:** Add a `build_prompt(transcript)` function that returns a two-message chat list, one `system` message with `SYSTEM_PROMPT`, and one `user` message that stitches the schema description and the transcript together.

```python
def build_prompt(transcript: str) -> list[dict]:
    """Returns the chat messages list ready to send to the LLM."""
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": f"{JSON_SCHEMA_DESCRIPTION}\n\nTranscript:\n{transcript}",
        },
    ]
```

**🎯 Expected output:** `build_prompt(transcript)` returns a list of two message dicts (`system`, `user`), with the transcript text actually embedded in the user message.

**🩹 If it's off:** If the transcript isn't in the returned user message, your later LLM call will have nothing to extract from. Make sure the f-string actually interpolates the transcript into the `user` content, a common slip is leaving the placeholder unused.

### 2.3 Review why the prompt is designed this way

Three things make this prompt design deliberate, not accidental:

1. **The schema is spelled out literally**, key by key, with an example shape, not described in prose. Models are far more consistent at matching an example than at inferring a schema from a description.
2. **`owner` is explicitly allowed to be `null`**, with an explicit rule for when to use it. Without that rule, models tend to invent a plausible-sounding name, or write the string `"TBD"`, a value your Python code would then have to special-case forever.
3. **The system prompt states the output format as a hard constraint** ("nothing else -- no markdown code fences, no commentary"), because the single most common way this goes wrong (see Step 3) is a model wrapping its JSON in a ```` ```json ```` code fence out of habit, even when told not to.

**🎯 Expected output:** You could point to the exact sentence that tells the model what to do when no owner is named, and explain in one sentence why the schema is a literal JSON example rather than prose.

**🩹 If it's off:** If you can't name why each of the three rules exists, you're likely to skip a rule the next time you write a prompt, and each omitted rule is a specific failure mode (invented owners, wrapped JSON, leaked decisions) your parse code will later have to defend against.

### 2.4 Verify the prompt design

**✅ Checklist**

- ✅ `build_prompt(transcript)` returns a list of two message dicts (`system`, `user`), with the transcript text actually embedded in the user message.
- ✅ You can point to the exact sentence in `JSON_SCHEMA_DESCRIPTION` that tells the model what to do when no owner is named.
- ✅ You could explain, in one sentence, why the schema is written as a literal JSON example instead of a paragraph description.

**🤔 Socratic Question(s)**

- If you removed the "Only include a decision if the group actually agreed on something -- not just discussing an option" rule, what kind of items do you think would start leaking into `decisions` on a transcript full of back-and-forth debate?
- The prompt asks for `owner: null` rather than omitting the field entirely. Why might that be easier for your Python code to handle than a schema where a field is sometimes present and sometimes just missing?

## Step 3: Call the LLM and parse the JSON response

Now send the prompt and turn whatever text comes back into real Python data, a `dict` you can loop over, not a string you have to eyeball. This is where structured-extraction projects most often break in practice: even a well-designed prompt occasionally gets a response wrapped in a code fence, with a trailing comment, or with a stray comma, and a naive `json.loads()` call crashes on all three.

### 3.1 Write `call_llm`

```python
# summarize.py (part 1 -- LLM call + parsing)
"""Calls a free-tier LLM to extract a structured summary from a transcript,
then parses and validates the JSON it returns.

Run with: uv run python summarize.py transcripts/standup.txt
"""

import json
import os
import re
import sys

from dotenv import load_dotenv
from openai import OpenAI

from extract_prompt import build_prompt
from load_transcript import load_transcript

load_dotenv()

REQUIRED_KEYS = {"decisions", "action_items", "open_questions"}

def call_llm(transcript: str) -> str:
    """Sends the structured-extraction prompt and returns the model's raw text reply."""
    client = OpenAI(
        api_key=os.environ["GITHUB_TOKEN"],
        base_url="https://models.github.ai/inference",
    )
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # confirm this still has a free tier before running
        messages=build_prompt(transcript),
        temperature=0,  # deterministic-as-possible extraction, not creative writing
    )
    return response.choices[0].message.content
```

**👟 Starter hint:** Start `summarize.py` with `call_llm(transcript)`, build the `OpenAI` client from your `.env` key, send `build_prompt(transcript)`, and return the raw text reply. Note `temperature=0`: extraction should be repeatable, not creative.

**🎯 Expected output:** Calling `call_llm` returns the model's raw reply as a string, and an environment-variable misconfiguration raises a clear `KeyError` at `os.environ["GITHUB_TOKEN"]` rather than failing silently.

**🩹 If it's off:** If you get a `KeyError` or authentication error, your `.env` key isn't loaded, confirm `load_dotenv()` runs and the variable name matches. If you forgot `temperature=0`, identical transcripts can produce visibly different output between runs, which makes debugging your prompt harder.

### 3.2 Write `extract_json`

**👟 Starter hint:** Add `extract_json(raw_text)` to strip the two most common things a model wraps around otherwise-valid JSON: a ```` ```json ... ``` ```` markdown fence, and stray prose before/after the object. Fall back to grabbing between the first `{` and last `}` when there's no fence.

```python
def extract_json(raw_text: str) -> str:
    """Strips common wrapping the model adds around JSON despite being told not to.

    Handles the two most frequent offenders: a ```json ... ``` markdown fence,
    and leading/trailing prose sentences around an otherwise-valid object.
    """
    text = raw_text.strip()
    fenced = re.search(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL)
    if fenced:
        return fenced.group(1).strip()
    # No fence -- fall back to grabbing everything between the first "{" and
    # the last "}", in case the model added a sentence before or after the object.
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start : end + 1]
    return text
```

**🎯 Expected output:** A response wrapped in ```` ```json ... ``` ```` gets stripped to just the JSON, and a response with a stray sentence around it still yields the object.

**🩹 If it's off:** Skipping `extract_json` and calling `json.loads()` directly on the raw response crashes on exactly the fence the model is most likely to add. If your fallback grabs too much or picks the wrong braces, remember it only runs when there's no fence, keep the fence branch first.

### 3.3 Write `parse_summary`

**👟 Starter hint:** Add `parse_summary(raw_text)` that cleans with `extract_json`, `json.loads` it, then validates: it must be a `dict` containing at least `REQUIRED_KEYS`, and each list field must really be a list (coerce a single object into a one-item list if not).

```python
def parse_summary(raw_text: str) -> dict:
    """Parses and validates the model's response, raising a clear error if it
    doesn't match the schema after the best-effort cleanup in extract_json()."""
    cleaned = extract_json(raw_text)
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as error:
        raise ValueError(
            f"Model response wasn't valid JSON even after cleanup: {error}\n"
            f"Raw response was:\n{raw_text}"
        ) from error

    if not isinstance(data, dict) or not REQUIRED_KEYS.issubset(data.keys()):
        raise ValueError(f"Response is missing required keys {REQUIRED_KEYS}. Got: {data!r}")

    # Normalize: make sure each list field really is a list, even if the
    # model returned a single object instead of a one-item list somewhere.
    for key in ("decisions", "action_items", "open_questions"):
        if not isinstance(data[key], list):
            data[key] = [data[key]]

    return data
```

**🎯 Expected output:** A well-formed response parses to a `dict` with all three keys as lists, and a genuinely malformed response raises a clear `ValueError` with the raw text attached, not a `KeyError` or `JSONDecodeError` three functions later.

**🩹 If it's off:** If you don't validate and just `json.loads`, a model that returns a dict missing `action_items` will crash with a mysterious `KeyError` later. The coercive normalization also matters, models sometimes return a single object where you asked for a list, and treating that as a one-item list beats crashing on `.append` of a `dict`.

### 3.4 Run `summarize.py` and inspect the output

**👟 Starter hint:** Wire everything into `__main__`, load a transcript, call the model, parse the summary, and print the JSON.

```python
if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "transcripts/standup.txt"
    transcript = load_transcript(path)
    raw = call_llm(transcript)
    summary = parse_summary(raw)
    print(json.dumps(summary, indent=2))
```

```bash
uv run python summarize.py transcripts/standup.txt
```

:::tip[Never trust an LLM's output shape blindly]
Treat a language model's response the same way you'd treat data from an untrusted API or a user-uploaded CSV: validate it before using it, don't assume it. `extract_json` handles the common wrapping issues, and `parse_summary` still raises a clear, specific error, with the raw text attached, if the result truly doesn't match the schema, rather than letting a `KeyError` three functions later leave you guessing what went wrong. Silently returning an empty summary on a parse failure would be worse than crashing: you'd never notice the extraction quietly stopped working.
:::

**🎯 Expected output:** `uv run python summarize.py transcripts/standup.txt` prints valid, readable JSON with all three required keys.

**🩹 If it's off:** If printing shows an empty/odd list where you expected content, scrub the transcript or re-run, extraction with `temperature=0` is deterministic, so varying output points at a prompt or parsing bug, not randomness.

### 3.5 Verify the parsing

**✅ Checklist**

- ✅ `uv run python summarize.py transcripts/standup.txt` prints valid, readable JSON with all three required keys.
- ✅ You can explain what `extract_json` does with a response wrapped in ```` ```json ... ``` ````, versus one with no fence at all.
- ✅ Temporarily changing `REQUIRED_KEYS` to include a key you know isn't in the schema and re-running produces your own clear `ValueError`, not a crash somewhere else.

**🤔 Socratic Question(s)**

- `extract_json`'s fallback, grabbing everything between the first `{` and the last `}`, would break on a transcript that literally contains curly braces in someone's spoken text (e.g. quoting a code snippet). Can you think of a more robust approach, even if it's more work to implement?
- Why does `parse_summary` raise an exception with the raw response attached, instead of just returning `None` when parsing fails?

## Step 4: Format the result as readable Markdown

The parsed `dict` is exactly what you'd want for saving to a database or feeding into another script, but it's not something a teammate wants to read in a Slack message. Convert it into a short, skimmable Markdown summary too, the same data, formatted for a human instead of a program.

### 4.1 Write the Markdown formatter

```python
# format_summary.py
"""Formats a parsed summary dict as readable Markdown.

Imported by summarize.py (Step 5) -- not meant to be run directly.
"""

def format_markdown(summary: dict, source: str) -> str:
    lines = [f"# Meeting Summary — {source}", ""]

    lines.append("## Decisions")
    if summary["decisions"]:
        lines += [f"- {d}" for d in summary["decisions"]]
    else:
        lines.append("_No decisions recorded._")
    lines.append("")

    lines.append("## Action Items")
    if summary["action_items"]:
        for item in summary["action_items"]:
            owner = item.get("owner") or "unassigned"
            lines.append(f"- [ ] {item['task']} — **{owner}**")
    else:
        lines.append("_No action items recorded._")
    lines.append("")

    lines.append("## Open Questions")
    if summary["open_questions"]:
        lines += [f"- {q}" for q in summary["open_questions"]]
    else:
        lines.append("_No open questions recorded._")

    return "\n".join(lines)
```

**👟 Starter hint:** Create `format_summary.py` with `format_markdown(summary, source)` that builds one line at a time, one section per list, a bullet per item, and an `_No ... recorded._` fallback whenever a list is empty.

**🎯 Expected output:** `format_markdown(summary, "standup.txt")` returns a string starting with a `# Meeting Summary` heading, with each category rendered as a section.

**🩹 If it's off:** If an empty list renders as a blank/broken section, you skipped the `else` fallback, every empty category should still produce a readable `_No ... recorded._` line, never an empty section.

### 4.2 Handle a missing owner

`item.get("owner") or "unassigned"` is doing double duty: it handles both a literal `None` (what the prompt asks the model to use when no owner is named) and, defensively, an empty string or the word `"null"` some smaller models occasionally produce despite the instructions, either way, the reader sees "unassigned" instead of a blank or a confusing literal `null`.

**👟 Starter hint:** Run `format_markdown` against a test summary where one action item has `owner: None` and another has `owner: "null"` (as a string), and check what each renders to.

**🎯 Expected output:** An action item with no named owner renders as "unassigned", not a blank or the word "None" or the literal `"null"`.

**🩹 If it's off:** If `"unassigned"` doesn't show up for both cases, you're likely reading `owner` without the `or "unassigned"` fallback, a bare `None` needs that guard, and a literal string `"null"` is falsy too, so `or` handles both.

### 4.3 Verify the formatter

**✅ Checklist**

- ✅ `format_markdown(summary, "standup.txt")` returns a string starting with a `# Meeting Summary` heading.
- ✅ An action item with no named owner renders as "unassigned", not a blank or the word "None".
- ✅ Passing a summary where every list is empty still produces valid, readable Markdown (the `_No ... recorded._` lines), not an empty or broken section.

**🤔 Socratic Question(s)**

- The action items render as `- [ ] task`, GitHub-Flavored Markdown checkbox syntax. Where might that be genuinely useful versus purely decorative, depending on where this file ends up (a GitHub issue, a Slack message, a plain text file)?
- Why build the Markdown from the *already-parsed* `dict`, instead of asking the LLM to directly generate Markdown in Step 3 and skipping this step?

## Step 5: Run it end to end

Wire the pieces together: load a transcript, call the model, parse and validate the JSON, then write both a `.md` and a `.json` file next to the input.

### 5.1 Write the `summarize` pipeline

```python
# summarize.py (part 2 -- appended to part 1 above)

from pathlib import Path

from format_summary import format_markdown

def summarize(path: str) -> dict:
    """Runs the full pipeline for one transcript and writes both output files."""
    transcript = load_transcript(path)
    raw = call_llm(transcript)
    summary = parse_summary(raw)

    stem = Path(path).stem
    Path(f"{stem}_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    Path(f"{stem}_summary.md").write_text(format_markdown(summary, source=path), encoding="utf-8")

    return summary

if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "transcripts/standup.txt"
    summary = summarize(path)
    print(format_markdown(summary, source=path))
    print(f"\n(also wrote {Path(path).stem}_summary.json and {Path(path).stem}_summary.md)")
```

**👟 Starter hint:** Add a `summarize(path)` function to `summarize.py` that chains everything you've built: `load_transcript` → `call_llm` → `parse_summary`, then writes both a `.json` and a `.md` file named after the input's stem.

**🎯 Expected output:** `uv run python summarize.py transcripts/standup.txt` prints a readable Markdown summary and reports writing two output files.

**🩹 If it's off:** If only one file appears, check both `write_text` calls, the `.json` and `.md` must both be written. If the stem is wrong (files named oddly), re-check how `Path(path).stem` strips the extension.

### 5.2 Run it on all three transcripts

```bash
uv run python summarize.py transcripts/standup.txt
uv run python summarize.py transcripts/product_planning.txt
uv run python summarize.py transcripts/incident_review.txt
```

Run it on all three sample transcripts (or the repo's fuller [`examples/meeting-notes-summarizer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/meeting-notes-summarizer) version, which ships all three ready to go) and compare the outputs: a standup, a planning meeting, and an incident review each stress the schema differently, the incident review, for instance, tends to produce far more open questions than action items.

:::tip[Rate limits are expected, not a bug]
Every free tier caps requests per minute or per day, and each call to `summarize()` is exactly one API call, so running this across several transcripts back to back can occasionally hit a `429` error. That's the provider telling you to slow down, not a sign anything is broken; wait the suggested number of seconds and re-run. See the [AI Agent project](/projects/ai-agent#handling-rate-limits) for a `try`/`except`-with-retry pattern you can copy directly if you want this to recover automatically.
:::

**🎯 Expected output:** Each transcript produces its own `.json` and `.md` file, and the incident review visibly yields more open questions than action items, each file reflecting *that* transcript's content, not a copy of the first run's output.

**🩹 If it's off:** If running multiple transcripts back to back hits a `429` rate-limit error, that's the provider pacing you, not a bug, wait and re-run. If two different transcripts produce near-identical summaries, check that `summarize` is actually using each transcript's content rather than a hardcoded path.

### 5.3 Verify end to end

**✅ Checklist**

- ✅ `uv run python summarize.py transcripts/standup.txt` prints a readable Markdown summary and reports writing two output files.
- ✅ Both `standup_summary.json` and `standup_summary.md` exist afterward, and the JSON file is valid (open it, or re-parse it with `json.load`).
- ✅ Running it on a second, different transcript produces a summary that actually reflects *that* transcript's content, not a copy of the first one's output.

**🤔 Socratic Question(s)**

- If a teammate handed you a transcript with no clear decisions at all, just open-ended brainstorming, what would you expect `decisions` to look like, and does your prompt's wording actually guarantee that?
- What would break if you ran this on a two-hour, 15,000-word transcript instead of these short samples? At what point would you need a strategy like the chunking approach from the [RAG project](/projects/rag-notes) instead of sending the whole thing in one prompt?

## ⚠️ Common pitfalls

- **The model wraps its JSON in a markdown code fence anyway**, even when explicitly told not to, especially on smaller/free-tier models. `extract_json` in Step 3 strips this automatically; don't skip it and call `json.loads()` directly on the raw response.
- **`owner` comes back as the string `"null"`, `"TBD"`, or `"N/A"`** instead of a real `null`/`None`. `format_markdown`'s `item.get("owner") or "unassigned"` catches the falsy cases, but a literal string like `"TBD"` will slip through as-is, worth normalizing explicitly (e.g. `if owner in ("null", "TBD", "N/A", ""): owner = None`) if you see it happen often with your chosen provider.
- **Forgetting `temperature=0`.** Extraction tasks want the same transcript to produce a consistent, repeatable summary, not creative variation between runs. Leaving the default (often `~1.0`) makes results noticeably less stable run to run, which makes debugging your prompt harder because you can't tell if a change in output came from your prompt edit or just randomness.
- **Rate limits on the free LLM tier.** Every call to `summarize()` costs one request against your provider's quota; running it across many transcripts quickly can trigger a 429. See the tip above.

## What you just built

A small, complete structured-extraction pipeline: load raw text, design a prompt that pins down an exact output schema, call a free-tier LLM, defensively parse and validate what comes back, and render the result for both machines (JSON) and humans (Markdown). This isn't a toy simplification, the exact same shape (schema-constrained prompt → parse → validate → fall back gracefully) is how production systems extract structured data from resumes, invoices, support tickets, and contracts. Swap the schema and the prompt, and this pipeline still works.

## Where to go from here

- Extend the schema with a `sentiment` or `meeting_type` field, or a `priority` on each action item, the pattern (describe the field in the prompt, validate it after parsing) is identical to what you already built.
- Try feeding the model a transcript in a completely different format (a chat export, a raw closed-caption `.vtt` file) and see how much cleanup `load_transcript` needs before the results stay good.
- Look into a schema-validation library like `pydantic` for a much stricter version of `parse_summary`, instead of hand-checking keys, define a `Summary` model once and let it validate (and even coerce) types for you, raising a structured error on anything that doesn't fit.
- Combine this with the [AI Agent project](/projects/ai-agent): give an agent a tool that calls `summarize()` on a transcript file, so it can decide *when* to summarize as part of a larger task instead of you always running the script by hand.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓
