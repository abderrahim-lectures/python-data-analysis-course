"""Real-World Project example: a meeting-notes summarizer with structured extraction.

See docs/projects/meeting-notes-summarizer/index.md for the walkthrough this
file accompanies. This version is deliberately fuller than the lesson's
step-by-step snippets: all six free-tier providers are wired up (selected
with one environment variable), and both output formats are always written.

You're free to use whichever free-tier provider you like. Set LLM_PROVIDER in
a .env file (copy .env.example) or a real environment variable to pick one;
see PROVIDERS below for the full list and which API key each one needs.
Defaults to "github" (GitHub Models) since it's free with no separate
signup, tied to a GitHub account every student here already has.

Never hardcode a real API key here or commit one to the repo.

Objective: take a plain-text meeting transcript and extract a structured
summary -- decisions made, action items (with owner if the transcript names
one), and open questions -- as both a readable Markdown file and a validated
JSON file, by asking the model for a specific JSON shape and defensively
parsing whatever comes back.
"""

import json
import os
import re
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()  # reads a local .env file, if present; real env vars always win

REQUIRED_KEYS = {"decisions", "action_items", "open_questions"}

SYSTEM_PROMPT = """You are an assistant that extracts structured information \
from meeting transcripts. You always respond with a single JSON object and \
nothing else -- no markdown code fences, no commentary before or after it."""

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


# ---------------------------------------------------------------------------
# Provider setup -- same six-provider pattern as examples/ai-agent/agent.py
# and examples/rag-notes/ask.py. Every builder here returns an OpenAI-style
# chat-completions caller, since all six providers are (or emulate) an
# OpenAI-compatible API.
# ---------------------------------------------------------------------------


def _github_client():
    from openai import OpenAI

    return OpenAI(api_key=os.environ["GITHUB_TOKEN"], base_url="https://models.github.ai/inference"), "gpt-4o-mini"


def _gemini_client():
    from openai import OpenAI

    # Gemini exposes an OpenAI-compatible endpoint too, which keeps this
    # file to a single client library instead of six different SDKs.
    return OpenAI(
        api_key=os.environ["GOOGLE_API_KEY"],
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    ), "gemini-2.5-flash"


def _groq_client():
    from openai import OpenAI

    return OpenAI(api_key=os.environ["GROQ_API_KEY"], base_url="https://api.groq.com/openai/v1"), "llama-3.3-70b-versatile"


def _mistral_client():
    from openai import OpenAI

    return OpenAI(api_key=os.environ["MISTRAL_API_KEY"], base_url="https://api.mistral.ai/v1"), "mistral-small-latest"


def _cerebras_client():
    from openai import OpenAI

    return OpenAI(api_key=os.environ["CEREBRAS_API_KEY"], base_url="https://api.cerebras.ai/v1"), "llama-3.3-70b"


def _openrouter_client():
    from openai import OpenAI

    return OpenAI(
        api_key=os.environ["OPENROUTER_API_KEY"], base_url="https://openrouter.ai/api/v1"
    ), "meta-llama/llama-3.3-70b-instruct:free"


# Every builder here is free-tier at the time of writing, with no credit card
# required -- but check the provider's own pricing page before relying on
# that, since free tiers change. Each returns (client, model_name).
PROVIDERS = {
    "github": _github_client,
    "gemini": _gemini_client,
    "groq": _groq_client,
    "mistral": _mistral_client,
    "cerebras": _cerebras_client,
    "openrouter": _openrouter_client,
}


def load_transcript(path: str) -> str:
    """Reads a transcript file and returns its raw text."""
    text = Path(path).read_text(encoding="utf-8")
    if not text.strip():
        raise ValueError(f"{path} is empty -- nothing to summarize.")
    return text


def build_prompt(transcript: str) -> list[dict]:
    """Returns the chat messages list ready to send to the LLM."""
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"{JSON_SCHEMA_DESCRIPTION}\n\nTranscript:\n{transcript}"},
    ]


def call_llm(transcript: str, provider: str | None = None) -> str:
    """Sends the structured-extraction prompt and returns the model's raw text reply.

    `provider` defaults to the LLM_PROVIDER environment variable, or "github"
    if that isn't set either -- see PROVIDERS above for the full list.
    """
    provider = provider or os.environ.get("LLM_PROVIDER", "github")
    if provider not in PROVIDERS:
        raise ValueError(f"Unknown LLM_PROVIDER '{provider}'. Choose one of: {', '.join(PROVIDERS)}")
    client, model = PROVIDERS[provider]()
    response = client.chat.completions.create(
        model=model,
        messages=build_prompt(transcript),
        temperature=0,  # deterministic-as-possible extraction, not creative writing
    )
    return response.choices[0].message.content


def extract_json(raw_text: str) -> str:
    """Strips common wrapping the model adds around JSON despite being told not to.

    Handles the two most frequent offenders: a ```json ... ``` markdown fence,
    and leading/trailing prose sentences around an otherwise-valid object.
    """
    text = raw_text.strip()
    fenced = re.search(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL)
    if fenced:
        return fenced.group(1).strip()
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start : end + 1]
    return text


def parse_summary(raw_text: str) -> dict:
    """Parses and validates the model's response, raising a clear error if it
    doesn't match the schema after the best-effort cleanup in extract_json()."""
    cleaned = extract_json(raw_text)
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as error:
        raise ValueError(
            f"Model response wasn't valid JSON even after cleanup: {error}\nRaw response was:\n{raw_text}"
        ) from error

    if not isinstance(data, dict) or not REQUIRED_KEYS.issubset(data.keys()):
        raise ValueError(f"Response is missing required keys {REQUIRED_KEYS}. Got: {data!r}")

    for key in ("decisions", "action_items", "open_questions"):
        if not isinstance(data[key], list):
            data[key] = [data[key]]

    return data


def format_markdown(summary: dict, source: str) -> str:
    """Renders a parsed summary dict as short, skimmable Markdown."""
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


def summarize(path: str, provider: str | None = None) -> dict:
    """Runs the full pipeline for one transcript and writes both output files."""
    transcript = load_transcript(path)
    raw = call_llm(transcript, provider=provider)
    summary = parse_summary(raw)

    stem = Path(path).stem
    out_dir = Path(path).parent
    (out_dir / f"{stem}_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    (out_dir / f"{stem}_summary.md").write_text(format_markdown(summary, source=path), encoding="utf-8")

    return summary


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "sample_transcripts/standup.txt"
    result = summarize(path)
    print(format_markdown(result, source=path))
    stem = Path(path).stem
    print(f"\n(also wrote {stem}_summary.json and {stem}_summary.md next to {path})")
