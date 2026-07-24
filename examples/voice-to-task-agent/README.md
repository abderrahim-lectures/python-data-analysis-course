# Voice-to-Task Agent Example

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/abderrahim-lectures/python-data-analysis-course)

A real, runnable version of the pipeline built step by step in the course's [Build a Voice-to-Task Agent](../../docs/projects/voice-to-task-agent/index.md) project: transcribe a voice memo locally with OpenAI's open-source [Whisper](https://github.com/openai/whisper) model, then ask a free-tier LLM to turn the transcript into a structured task list.

## Objective

Turn a rambling voice memo into a short, structured task list, with two very different kinds of "free" stacked together:

- **Transcription is local and free, no key needed.** `sample_audio/` ships three short synthetic voice-memo clips so this runs with zero setup — no microphone, no recording, no API key for this half of the pipeline.
- **Action-item extraction uses a free-tier LLM.** You still need an API key from one of six supported providers (see below) for this half.

## Sample audio

`sample_audio/` has three short (~15–20s) synthetic voice memos, generated with a local open-source text-to-speech model so the repo doesn't depend on anyone's real recording:

- `memo_1_work_followups.wav` — meeting follow-ups with a deadline and a "no rush" item
- `memo_2_personal_errands.wav` — personal errands, one flagged urgent
- `memo_3_project_planning.mp3` — project tasks mixing a high-priority blocker and a low-priority nice-to-have

Feel free to record your own memo and pass its path in instead — see "Running it" below.

## Running it

**You're free to use whichever free-tier provider you like** for the extraction step — this isn't locked to any one of them. Six are wired up already: **GitHub Models** (the default — no separate signup, uses a GitHub account you already have), Gemini, Groq, Mistral, Cerebras, and OpenRouter.

1. **Get a free-tier API key** from your chosen provider — see the table in the [lesson](../../docs/projects/voice-to-task-agent/index.md#step-3-get-a-free-llm-api-key) for where to get one for each.
2. **Copy `.env.example` to `.env`** and fill in the key for your provider (and `LLM_PROVIDER` if you're not using the default):
   ```bash
   cp .env.example .env
   # then edit .env
   ```
   `.env` is already gitignored — never commit a real key.
3. **Run it with `uv`** — no manual virtual environment setup needed:
   ```bash
   uv run python voice_to_tasks.py sample_audio/memo_1_work_followups.wav
   ```
   Omit the path to fall back to `memo_1_work_followups.wav` by default. The first run downloads the Whisper `base` model (~140MB) to `~/.cache/whisper` and reuses it after that.

The script prints the raw transcript, then the extracted action items with a priority marker, then saves the same list as JSON to `tasks.json` in the current folder.

### Using it from your own code

```python
from voice_to_tasks import transcribe, extract_action_items, print_tasks

transcript = transcribe("sample_audio/memo_2_personal_errands.wav")
tasks = extract_action_items(transcript)
print_tasks(tasks)
```

## Running it in GitHub Codespaces

Click the badge above, or go to the [repo's Codespaces page](https://github.com/abderrahim-lectures/python-data-analysis-course), to get a ready-to-go cloud dev environment (Node + Python + `uv` preinstalled via [`.devcontainer/devcontainer.json`](../../.devcontainer/devcontainer.json)). Once it's open, add your API key as a [Codespaces secret](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-encrypted-secrets-for-your-repository-and-organization#adding-secrets-for-a-repository) named for whichever provider you're using (`GITHUB_TOKEN` for the default, `GOOGLE_API_KEY` for Gemini, etc. — see `.env.example`), or just `export` it in the Codespace's terminal for a one-off session, then run:

```bash
cd examples/voice-to-task-agent
uv run python voice_to_tasks.py sample_audio/memo_1_work_followups.wav
```

Transcription is CPU work, so a Codespace handles it fine, just somewhat slower than a modern laptop.

## A note on staying current

Model names and provider API details in this space change fast — the model IDs and endpoints here were verified against live runs while writing this example, but may have drifted by the time you read this. See the callout in the [lesson](../../docs/projects/voice-to-task-agent/index.md) for what to check before relying on this code.

## Built your own project?

See [`examples/student-projects/`](../student-projects/) for how to share it with the class via a pull request — no git experience required, it walks through every step.
