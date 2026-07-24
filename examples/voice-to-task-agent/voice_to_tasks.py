"""Voice-to-Task Agent: transcribe a voice memo locally and for free with
OpenAI's open-source Whisper model, then ask a free-tier LLM to pull
structured action items (task / due date / priority) out of the transcript.

See docs/projects/voice-to-task-agent/index.md for the full walkthrough this
file accompanies.

Two very different kinds of "free" are stacked here, worth being precise
about:

- Transcription (Whisper) is local and free with no key at all -- this is
  the open-source `openai-whisper` pip package, running the model on your
  own CPU. It is NOT the paid OpenAI Whisper *API* -- no network call, no
  OpenAI account needed for this half of the pipeline.
- Action-item extraction calls out to a real hosted LLM, and free here means
  "free tier" -- you still need an API key from one of the six providers
  below, and each has its own rate limits.

You're free to use whichever free-tier provider you like for extraction --
this isn't locked to GitHub Models. Set LLM_PROVIDER in a .env file (copy
.env.example) or a real environment variable to pick one; see PROVIDERS
below for the full list and which key each one needs.
"""

import json
import os
import sys
from pathlib import Path

import whisper
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()  # reads a local .env file, if present; real env vars always win

REPO_ROOT = Path(__file__).resolve().parent
SAMPLE_AUDIO_DIR = REPO_ROOT / "sample_audio"
DEFAULT_SAMPLE = SAMPLE_AUDIO_DIR / "memo_1_work_followups.wav"

# "tiny", "base", "small", "medium", or "large" -- bigger is more accurate
# and slower. "base" is a good default on a laptop CPU; see the tip in the
# lesson for the full size/speed/accuracy tradeoff table.
WHISPER_MODEL_SIZE = "base"

# All six providers below happen to expose an OpenAI-compatible chat
# completions endpoint, so one client class (openai.OpenAI) works for all of
# them -- just point base_url and model at whichever provider you picked.
# Every entry here is free-tier at the time of writing, with no credit card
# required -- but check the provider's own pricing page before relying on
# that, since free tiers change.
PROVIDERS = {
    "github": {
        "env": "GITHUB_TOKEN",
        "base_url": "https://models.github.ai/inference",
        "model": "gpt-4o-mini",
    },
    "gemini": {
        "env": "GOOGLE_API_KEY",
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
        # Pinned, versioned model ID -- deliberately not a "-latest" alias,
        # which Google has deprecated because it can silently hot-swap
        # model versions.
        "model": "gemini-3.5-flash",
    },
    "groq": {
        "env": "GROQ_API_KEY",
        "base_url": "https://api.groq.com/openai/v1",
        "model": "llama-3.3-70b-versatile",
    },
    "mistral": {
        "env": "MISTRAL_API_KEY",
        "base_url": "https://api.mistral.ai/v1",
        "model": "mistral-small-latest",
    },
    "cerebras": {
        "env": "CEREBRAS_API_KEY",
        "base_url": "https://api.cerebras.ai/v1",
        "model": "llama-3.3-70b",
    },
    "openrouter": {
        "env": "OPENROUTER_API_KEY",
        "base_url": "https://openrouter.ai/api/v1",
        "model": "meta-llama/llama-3.3-70b-instruct:free",
    },
}

_whisper_model = None  # loaded lazily -- only the first call pays the load cost


def get_whisper_model():
    """Loads (and caches) the local Whisper model. Downloads the weights to
    ~/.cache/whisper on first use -- ~140MB for "base" -- then reuses them."""
    global _whisper_model
    if _whisper_model is None:
        print(f"Loading Whisper '{WHISPER_MODEL_SIZE}' model (first run downloads it)...")
        _whisper_model = whisper.load_model(WHISPER_MODEL_SIZE)
    return _whisper_model


def transcribe(audio_path: str) -> str:
    """Transcribes an audio file to plain text, entirely locally.

    Accepts .wav, .mp3, and most other common audio formats -- Whisper
    decodes them via ffmpeg under the hood, not by a hardcoded extension
    check, so this isn't limited to the sample files' formats.
    """
    model = get_whisper_model()
    result = model.transcribe(audio_path)
    return result["text"].strip()


def build_client(provider: str | None = None) -> tuple[OpenAI, str]:
    """Builds an OpenAI-compatible client for whichever provider you choose.

    `provider` defaults to the LLM_PROVIDER environment variable, or
    "github" if that isn't set either. Pass it explicitly to override
    without touching your .env, e.g. build_client("groq").
    """
    provider = provider or os.environ.get("LLM_PROVIDER", "github")
    if provider not in PROVIDERS:
        raise ValueError(f"Unknown LLM_PROVIDER '{provider}'. Choose one of: {', '.join(PROVIDERS)}")
    config = PROVIDERS[provider]
    api_key = os.environ.get(config["env"])
    if not api_key:
        raise KeyError(
            f"{config['env']} is not set -- copy .env.example to .env and fill it in "
            f"for provider '{provider}'."
        )
    client = OpenAI(api_key=api_key, base_url=config["base_url"])
    return client, config["model"]


EXTRACTION_PROMPT = """You extract action items from a voice memo transcript.

Read the transcript below and return a JSON object shaped exactly like this,
with no other text before or after it, and no markdown code fences:

{{"tasks": [{{"task": "...", "due_date": "...", "priority": "..."}}]}}

Rules:
- "task" is a short, clear description of what needs to be done, rewritten
  as an action (e.g. "Email the client the revised proposal"), not a raw
  quote from the transcript.
- "due_date" is null if the transcript doesn't mention one, otherwise a
  short phrase as stated (e.g. "Friday", "next week") -- do not invent a
  specific calendar date that was never said.
- "priority" is "high", "medium", or "low" if the transcript implies one
  (e.g. "urgent", "no rush"), otherwise null. Don't guess a priority that
  isn't actually implied.
- If the transcript contains no action items at all, return {{"tasks": []}}.

Transcript:
\"\"\"
{transcript}
\"\"\"
"""


def _parse_tasks_response(raw_text: str) -> list[dict]:
    """Parses the model's JSON reply into a list of task dicts.

    Free-tier models occasionally wrap JSON in a ```json ... ``` fence
    despite being told not to -- this strips that before parsing, rather
    than crashing on otherwise-valid JSON.
    """
    text = raw_text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        text = text[4:] if text.startswith("json") else text
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError as error:
        raise ValueError(f"Model reply wasn't valid JSON:\n{raw_text}") from error
    tasks = parsed.get("tasks")
    if tasks is None:
        raise ValueError(f"Model reply had no 'tasks' key:\n{raw_text}")
    return tasks


def extract_action_items(transcript: str, provider: str | None = None) -> list[dict]:
    """Asks a free-tier LLM to pull structured action items out of a transcript.

    Returns a list of {"task": str, "due_date": str | None, "priority": str | None}
    dicts -- an empty list if the transcript has no action items in it.
    """
    if not transcript.strip():
        return []
    client, model = build_client(provider)
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": EXTRACTION_PROMPT.format(transcript=transcript)}],
    )
    return _parse_tasks_response(response.choices[0].message.content)


def print_tasks(tasks: list[dict]) -> None:
    """Pretty-prints the task list with a priority marker per line."""
    if not tasks:
        print("No action items found in this memo.")
        return
    markers = {"high": "\U0001f534", "medium": "\U0001f7e1", "low": "\U0001f7e2"}
    for item in tasks:
        marker = markers.get((item.get("priority") or "").lower(), "⚪")
        due = f" (due: {item['due_date']})" if item.get("due_date") else ""
        print(f"{marker} {item['task']}{due}")


def main() -> None:
    audio_path = sys.argv[1] if len(sys.argv) > 1 else str(DEFAULT_SAMPLE)
    if not Path(audio_path).exists():
        print(f"Audio file not found: {audio_path}")
        print(f"Usage: uv run python voice_to_tasks.py [path/to/audio.wav]")
        sys.exit(1)

    print(f"Transcribing {audio_path} ...")
    transcript = transcribe(audio_path)
    print("\n--- Transcript ---")
    print(transcript)

    print("\nExtracting action items...")
    tasks = extract_action_items(transcript)

    print("\n--- Action items ---")
    print_tasks(tasks)

    out_path = Path("tasks.json")
    out_path.write_text(json.dumps(tasks, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nSaved {len(tasks)} task(s) to {out_path}")


if __name__ == "__main__":
    main()
