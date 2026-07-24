---
id: voice-to-task-agent
title: "Build a Voice-to-Task Agent"
sidebar_label: "Build a Voice-to-Task Agent"
slug: /projects/voice-to-task-agent
description: "Graduate from the in-browser playground to real Python: transcribe a voice memo locally and for free with OpenAI's open-source Whisper model, then use a free-tier LLM to turn it into a structured task list."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Build a Voice-to-Task Agent

<ProjectPublishedDate projectId="voice-to-task-agent" />

<ProjectGreeting />

Everything in the course so far ran in a sandboxed, in-browser playground — so you could start writing Python on day one with zero setup. This project is the graduation step: install Python for real on your own machine, then use it to build something genuinely useful — a small pipeline that takes a rambling voice memo and turns it into a short, structured task list, without you having to type or organize any of it by hand. This assumes Python 101; nothing from Data Analysis is required.

This is optional and ungraded. See [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Transcribe a short voice memo to text, entirely locally and for free, using OpenAI's *open-source* Whisper model (`openai-whisper`, run on your own CPU) — not the paid Whisper API.
2. Write a prompt that asks a free-tier LLM to read that transcript and pull out structured action items: a task, an optional due date, an optional priority.
3. Run the whole pipeline end to end on a provided sample recording (or your own), and save the result as a simple task list.

## Where to run this

**Locally with `uv`** is the primary, recommended path — transcription is CPU work (no GPU needed for a short clip with a small Whisper model), so it runs comfortably on an ordinary laptop. Setup below walks through installing `uv`.

**GitHub Codespaces** works too: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed) and run the exact same `uv` commands from a terminal in your browser tab. It's a bit slower than a modern laptop for the transcription step, since Codespaces machines are CPU-only, but perfectly workable for the short sample clips here.

**Google Colab is a notably good fit for this one** — better than for most other projects in this series. Whisper's transcription speed scales a lot with hardware, and Colab gives you a free GPU that a local CPU-only laptop doesn't: `!pip install openai-whisper` in a cell, then a GPU runtime, and even the larger Whisper model sizes (more accurate, normally too slow to consider on a CPU) become practical. If you want to experiment with model size vs. accuracy (see the tip in Step 1), Colab is where to do it.

## Setup

Everything needed before you write any pipeline code — installing `uv`, creating the project, and getting an LLM API key — lives here, once, up front. The actual build starts at Step 1, assuming all of this is already in place.

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
uv init voice-to-task-agent
cd voice-to-task-agent
uv add openai-whisper openai python-dotenv
```

`openai-whisper` is the open-source speech-to-text model itself — despite the package name, this installs and runs *locally*, with no API key and no per-minute cost; it just happens to be published by OpenAI and shares a name with their separate, paid, hosted API. `openai` is the plain API client used in Step 2 to call whichever free-tier LLM provider you pick — several of them expose an OpenAI-compatible endpoint, so one client library covers all six. `python-dotenv` lets you keep your LLM API key in a local `.env` file instead of `export`-ing it every session.

:::tip[The first run downloads the model]
`openai-whisper` doesn't bundle its model weights — the first time your code calls `whisper.load_model(...)` (Step 1), it downloads the weights to `~/.cache/whisper` (about 140MB for the `"base"` size used in this project) and reuses them on every run after that. The first transcription will feel slow; that's the download, not the transcription itself.
:::

### Get a free LLM API key

**Pick whichever provider you like** — none of them require a credit card at the time of writing, and this course doesn't favor one over another. The example in the course repo ([`examples/voice-to-task-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/voice-to-task-agent)) supports all six out of the box, selected with one setting.

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
2. **Never paste this key directly into code or commit it to a repository.** Create a `.env` file in your project folder instead (never commit this):

```bash
# .env
GITHUB_TOKEN=your-key-here
```

An API key is a secret, exactly like a password — anyone with it can use your account's quota. Treating it as an environment variable rather than a hardcoded string is the standard practice for exactly this reason, and it's the same habit built in the [AI Agent project](/docs/projects/ai-agent) if you've done that one.

:::tip[A .env file is often more convenient than export]
Instead of `export`-ing a key in every new terminal session, a `.env` file in your project folder, loaded automatically with `python-dotenv`, persists across sessions without you having to remember it. See the repo example's `.env.example` for the full list of variable names, one per provider.
:::

With setup done, everything below assumes: `uv` is installed, your project has `openai-whisper`, `openai`, and `python-dotenv` in it, and `.env` has a real key in it for the provider you picked.

## Step 1: Transcribe a sample voice memo locally

You don't need a microphone or a real recording to start — the course repo ships three short sample voice-memo clips at [`examples/voice-to-task-agent/sample_audio/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/voice-to-task-agent/sample_audio). Grab one (or record your own with any phone/laptop voice memo app and copy it into your project — `.wav` and `.mp3` both work).

Create `voice_to_tasks.py`:

```python
# voice_to_tasks.py
import sys

import whisper

WHISPER_MODEL_SIZE = "base"  # tiny / base / small / medium / large -- see the tip below

_whisper_model = None  # loaded lazily so importing this module doesn't load it


def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        print(f"Loading Whisper '{WHISPER_MODEL_SIZE}' model...")
        _whisper_model = whisper.load_model(WHISPER_MODEL_SIZE)
    return _whisper_model


def transcribe(audio_path: str) -> str:
    """Transcribes an audio file to plain text, entirely locally."""
    model = get_whisper_model()
    result = model.transcribe(audio_path)
    return result["text"].strip()


if __name__ == "__main__":
    audio_path = sys.argv[1] if len(sys.argv) > 1 else "sample_audio/memo_1_work_followups.wav"
    print(transcribe(audio_path))
```

```bash
uv run python voice_to_tasks.py sample_audio/memo_1_work_followups.wav
```

`whisper.load_model("base")` loads a neural network trained on a huge amount of multilingual speech data; `model.transcribe(audio_path)` runs it on your audio file and returns a dict whose `"text"` key is the full transcript — Whisper handles the audio decoding itself (via `ffmpeg` under the hood) and works on `.wav`, `.mp3`, and most other common formats without you converting anything by hand first.

:::tip[Model size is a speed/accuracy tradeoff]
Whisper ships in five sizes — `tiny`, `base`, `small`, `medium`, `large` — each one more accurate and slower than the last. `"base"` is a reasonable default on a laptop CPU for short, clear English speech like the sample clips; noisy audio, accents the model handles less well, or non-English speech often benefit from `"small"` or `"medium"`, at the cost of a noticeably longer transcription time. This is exactly the kind of tradeoff that's worth trying a GPU for — see "Where to run this" above for why Colab is a good fit here specifically.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python voice_to_tasks.py sample_audio/memo_1_work_followups.wav` prints a real transcript, not a traceback.</StepChecklistItem>
<StepChecklistItem>The printed text roughly matches what the sample memo actually says — Whisper won't be perfect, but it should be clearly recognizable.</StepChecklistItem>
<StepChecklistItem>Running it again is noticeably faster than the first run (the model weights are now cached locally, not re-downloaded).</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- `transcribe()` never sends your audio anywhere over the network. What does that mean for using this on a genuinely private voice memo, compared to a cloud-hosted transcription API?
- If you ran this on a memo with background music playing, or two people talking over each other, what would you expect to happen to transcript quality? Try it on your own recording if you have one that fits.

## Step 2: Extract structured action items with a free LLM

A transcript is just a wall of text — useful, but not yet a task list. This step hands the transcript to a free-tier LLM with a prompt asking it to read it and return actual structured data: one entry per action item, each with a task description and, where the transcript implies them, a due date and a priority.

Add the LLM call to `voice_to_tasks.py`:

```python
# voice_to_tasks.py (additions)
import json
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

# All six free-tier providers from the table above happen to expose an
# OpenAI-compatible chat completions endpoint, so one client class covers
# all of them -- only base_url and model change.
PROVIDERS = {
    "github": {"env": "GITHUB_TOKEN", "base_url": "https://models.github.ai/inference", "model": "gpt-4o-mini"},
    "gemini": {"env": "GOOGLE_API_KEY", "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/", "model": "gemini-3.5-flash"},
    "groq": {"env": "GROQ_API_KEY", "base_url": "https://api.groq.com/openai/v1", "model": "llama-3.3-70b-versatile"},
    "mistral": {"env": "MISTRAL_API_KEY", "base_url": "https://api.mistral.ai/v1", "model": "mistral-small-latest"},
    "cerebras": {"env": "CEREBRAS_API_KEY", "base_url": "https://api.cerebras.ai/v1", "model": "llama-3.3-70b"},
    "openrouter": {"env": "OPENROUTER_API_KEY", "base_url": "https://openrouter.ai/api/v1", "model": "meta-llama/llama-3.3-70b-instruct:free"},
}

EXTRACTION_PROMPT = """You extract action items from a voice memo transcript.

Return a JSON object shaped exactly like this, with no other text before or
after it, and no markdown code fences:

{{"tasks": [{{"task": "...", "due_date": "...", "priority": "..."}}]}}

Rules:
- "task" is a short, clear action (e.g. "Email the client the revised
  proposal"), not a raw quote from the transcript.
- "due_date" is null if the transcript doesn't mention one -- do not invent
  a specific date that was never said.
- "priority" is "high", "medium", or "low" only if the transcript implies
  one; otherwise null.
- If there are no action items at all, return {{"tasks": []}}.

Transcript:
\"\"\"
{transcript}
\"\"\"
"""


def extract_action_items(transcript: str, provider: str | None = None) -> list[dict]:
    provider = provider or os.environ.get("LLM_PROVIDER", "github")
    config = PROVIDERS[provider]
    client = OpenAI(api_key=os.environ[config["env"]], base_url=config["base_url"])

    response = client.chat.completions.create(
        model=config["model"],
        messages=[{"role": "user", "content": EXTRACTION_PROMPT.format(transcript=transcript)}],
    )
    return json.loads(response.choices[0].message.content)["tasks"]
```

```bash
uv run python -c "
from voice_to_tasks import transcribe, extract_action_items
transcript = transcribe('sample_audio/memo_1_work_followups.wav')
print(extract_action_items(transcript))
"
```

The prompt is doing the real work here: it tells the model exactly what shape to return (a JSON object with a `"tasks"` list, not free-form prose), and gives explicit rules for the tricky parts — don't invent a due date that was never said, don't guess a priority that isn't actually implied. This is the same idea as the [RAG project's](/docs/projects/rag-notes) prompt telling the model to answer *only* from retrieved context: a clear, specific instruction narrows what the model does, instead of hoping it infers the right shape on its own.

`json.loads(...)["tasks"]` assumes the model actually followed the instruction and returned clean JSON — free-tier models occasionally don't (a stray sentence before the JSON, a markdown fence around it despite being told not to). The fuller version in [`examples/voice-to-task-agent/voice_to_tasks.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/voice-to-task-agent) strips a code fence if one shows up and raises a clear error instead of a confusing traceback if the JSON still won't parse — worth copying if you plan to run this on more than a couple of memos.

:::tip[Using a different provider?]
Everything above already works for all six providers in the table — just set `LLM_PROVIDER` in your `.env` (or pass a provider name straight to `extract_action_items`). This works because GitHub Models, Gemini, Groq, Mistral, Cerebras, and OpenRouter all expose an OpenAI-compatible endpoint; unlike the [AI Agent project](/docs/projects/ai-agent), you don't need a different client library per provider here, since this script isn't using LangChain.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`extract_action_items(transcript)` returns a Python list of dicts, not an error.</StepChecklistItem>
<StepChecklistItem>Each dict has `"task"`, `"due_date"`, and `"priority"` keys — even when a value is `None`.</StepChecklistItem>
<StepChecklistItem>Running it on `memo_1_work_followups.wav` finds roughly three separate tasks, matching the three follow-ups actually mentioned in that memo.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- The prompt explicitly says "do not invent a specific date that was never said." What would you expect to happen if you removed that instruction and the transcript said "sometime next week"? Try it — does the model add a real calendar date anyway?
- If the transcript mentions the same task twice, phrased slightly differently each time (people do this when thinking out loud), would you expect one task in the output or two? What does your answer suggest about a limitation of asking a model to do this in a single pass, with no de-duplication step of its own?

## Step 3: Run it end to end and save a task list

Put the two pieces together into one script that transcribes, extracts, prints a readable list, and saves it as JSON:

```python
# voice_to_tasks.py (additions)
def print_tasks(tasks: list[dict]) -> None:
    if not tasks:
        print("No action items found in this memo.")
        return
    markers = {"high": "\U0001f534", "medium": "\U0001f7e1", "low": "\U0001f7e2"}
    for item in tasks:
        marker = markers.get((item.get("priority") or "").lower(), "⚪")
        due = f" (due: {item['due_date']})" if item.get("due_date") else ""
        print(f"{marker} {item['task']}{due}")


def main() -> None:
    audio_path = sys.argv[1] if len(sys.argv) > 1 else "sample_audio/memo_1_work_followups.wav"

    print(f"Transcribing {audio_path} ...")
    transcript = transcribe(audio_path)
    print("\n--- Transcript ---")
    print(transcript)

    print("\nExtracting action items...")
    tasks = extract_action_items(transcript)

    print("\n--- Action items ---")
    print_tasks(tasks)

    with open("tasks.json", "w", encoding="utf-8") as f:
        json.dump(tasks, f, indent=2, ensure_ascii=False)
    print(f"\nSaved {len(tasks)} task(s) to tasks.json")


if __name__ == "__main__":
    main()
```

```bash
uv run python voice_to_tasks.py sample_audio/memo_3_project_planning.mp3
```

Try all three sample clips, and — if you have a way to record one — your own voice memo too. A short grocery list, a set of meeting follow-ups, or a list of chores are all good tests: anything with a handful of distinct, sentence-length action items, spoken the way you'd actually talk to yourself, not a formally structured list.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python voice_to_tasks.py` (with any of the three sample clips) prints a transcript, then a marked-up task list, then a "Saved N task(s)" line.</StepChecklistItem>
<StepChecklistItem>A `tasks.json` file now exists in your project folder, and its contents match what was printed.</StepChecklistItem>
<StepChecklistItem>Running it on a memo with no real action items in it (try just describing your day) prints "No action items found" rather than inventing fake ones.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- `tasks.json` overwrites itself every run, with no merging of an old list and a new one. What would you need to add to make this a genuinely useful running task list across multiple memos, recorded on different days?
- This pipeline has two failure points that behave very differently: Whisper mishearing a word, and the LLM misreading a correctly-transcribed sentence. If a task comes out wrong, how would you tell which of the two stages actually caused it?

## ⚠️ Common pitfalls

- **Confusing open-source Whisper with the paid Whisper API.** `openai-whisper` (this project) runs entirely on your own machine, for free, with no API key — it is not the same thing as `client.audio.transcriptions.create(...)`, OpenAI's *hosted*, paid transcription endpoint. Both are named "Whisper" and both come from OpenAI, which is exactly why it's worth being explicit about which one any given piece of code is using.
- **A very long first run, mistaken for a hang.** The first call to `whisper.load_model(...)` downloads model weights (see the Setup tip) — on a slow connection this can take a while with no progress bar in older versions. Let it finish once; every run after that is fast.
- **The LLM's JSON reply isn't quite valid JSON.** Free-tier models occasionally wrap their answer in a markdown code fence, or add a stray sentence, despite an explicit instruction not to. Treat `json.loads(...)` failing here as an expected, occasional occurrence — not a sign your prompt is fundamentally broken — and see the fuller example's `_parse_tasks_response` for a fence-stripping fix.
- **Rate limits on the free LLM tier.** Transcription (Step 1) is local and unlimited; only Step 2's extraction call counts against your provider's free-tier quota. A 429 error there is the provider telling you to slow down, not a bug — see the [AI Agent project](/docs/projects/ai-agent#handling-rate-limits) for the same pattern and a retry approach you can copy.

## What you just built

A small but complete pipeline connecting two genuinely different kinds of AI model: a local, free, open-weights speech-to-text model doing the listening, and a hosted, free-tier language model doing the reading-and-structuring. Nothing here was faked — swap in a longer, messier real recording, and the same two steps (transcribe, then extract) are still the whole pipeline. This is also a small, concrete example of a broader pattern worth noticing: not every AI task needs a giant hosted model. Whisper is small enough to run locally for free; only the part of the job that actually benefits from a large language model's reasoning — turning loose, spoken language into clean structured data — reaches out to one.

:::tip[Run a fuller version without any local setup for the code]
[`examples/voice-to-task-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/voice-to-task-agent) in the course repo is a slightly fuller version of the code above — the same two-step pipeline, plus the fence-stripping fix mentioned above and clearer error messages. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it against any of the three sample clips in `sample_audio/`.
:::

## Where to go from here

- Try a bigger Whisper model size (`"small"` or `"medium"`) on a longer, messier recording — background noise, multiple speakers, or a non-English memo — and see where `"base"` starts falling short. This is a great excuse to try the Colab GPU path from "Where to run this" above.
- Group extracted tasks by priority, or sort them by however the model reports due dates, instead of printing them in transcript order.
- Make `tasks.json` cumulative: load the existing file (if any), append the newly extracted tasks instead of overwriting, and de-duplicate anything that looks like the same task said twice.
- Wire this into something that actually consumes the task list — appending to a real to-do app's API, a calendar, or even just a running Markdown checklist file — instead of a JSON file nothing else reads yet.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓

<ProjectProgressCheckbox projectId="voice-to-task-agent" />
