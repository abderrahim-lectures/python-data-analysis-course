"""Outline→Blog Post Generator -- a CLI that turns a rough Markdown outline
into a polished blog post draft using a free-tier LLM.

See docs/projects/blog-post-generator/index.md for the walkthrough this
file accompanies.

You're free to use whichever free-tier provider you like -- this isn't
locked to any one of them. Set LLM_PROVIDER in a .env file (copy
.env.example) or a real environment variable to pick one; see PROVIDERS
below for the full list and which API key each one needs. Defaults to
"github" (GitHub Models) since it's free with no separate signup, tied to
a GitHub account every student here already has.

Never hardcode a real API key here or commit one to the repo.

Usage:
    uv run python generate.py sample_outline.md
    uv run python generate.py my_outline.md --provider groq
"""

import argparse
import os
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()  # reads a local .env file, if present; real env vars always win

# Outlines longer than this get truncated before being sent to the model --
# see the "overlong outlines" pitfall in the lesson for why this matters:
# free-tier context windows and per-request token quotas are both limited.
MAX_OUTLINE_CHARS = 12_000

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


def load_outline(path: str | Path) -> str:
    """Reads a Markdown outline file and returns its contents as a single string."""
    return Path(path).read_text(encoding="utf-8")


def truncate(outline: str, max_chars: int = MAX_OUTLINE_CHARS) -> str:
    """Cuts an oversized outline down to a size that fits a free-tier context window.

    Keeps the front of the outline (usually the most structure-dense part)
    and appends a clear marker so the model -- and you -- know the draft was
    based on a partial view, rather than silently trimming.
    """
    if len(outline) <= max_chars:
        return outline
    return outline[:max_chars] + f"\n\n... [outline truncated -- {len(outline) - max_chars} more characters not shown] ..."


def _build_github_client() -> OpenAI:
    return OpenAI(api_key=os.environ["GITHUB_TOKEN"], base_url="https://models.github.ai/inference")


def _build_gemini_client() -> OpenAI:
    # Gemini exposes an OpenAI-compatible endpoint, so the same openai client
    # works here too, just with a different base_url and key.
    return OpenAI(
        api_key=os.environ["GOOGLE_API_KEY"],
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    )


def _build_groq_client() -> OpenAI:
    return OpenAI(api_key=os.environ["GROQ_API_KEY"], base_url="https://api.groq.com/openai/v1")


def _build_mistral_client() -> OpenAI:
    return OpenAI(api_key=os.environ["MISTRAL_API_KEY"], base_url="https://api.mistral.ai/v1")


def _build_cerebras_client() -> OpenAI:
    return OpenAI(api_key=os.environ["CEREBRAS_API_KEY"], base_url="https://api.cerebras.ai/v1")


def _build_openrouter_client() -> OpenAI:
    return OpenAI(api_key=os.environ["OPENROUTER_API_KEY"], base_url="https://openrouter.ai/api/v1")


# Every provider here is free-tier at the time of writing, with no credit
# card required -- but check the provider's own pricing page before relying
# on that, since free tiers change. Each tuple is (client builder, model ID).
PROVIDERS = {
    "github": (_build_github_client, "gpt-4o-mini"),
    "gemini": (_build_gemini_client, "gemini-3.5-flash"),
    "groq": (_build_groq_client, "llama-3.3-70b-versatile"),
    "mistral": (_build_mistral_client, "mistral-small-latest"),
    "cerebras": (_build_cerebras_client, "llama-3.3-70b"),
    "openrouter": (_build_openrouter_client, "meta-llama/llama-3.3-70b-instruct:free"),
}


def generate(outline: str, provider: str | None = None) -> str:
    """Sends an outline to a free-tier LLM and returns the expanded blog post draft."""
    provider = provider or os.environ.get("LLM_PROVIDER", "github")
    if provider not in PROVIDERS:
        raise ValueError(f"Unknown LLM_PROVIDER '{provider}'. Choose one of: {', '.join(PROVIDERS)}")
    build_client, model = PROVIDERS[provider]
    client = build_client()

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Here is my outline:\n\n```markdown\n{truncate(outline)}\n```"},
        ],
    )
    return response.choices[0].message.content


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Turn a rough Markdown outline into a polished blog post draft."
    )
    parser.add_argument("outline", help="Path to your outline as a .md or .txt file.")
    parser.add_argument("--provider", help="Override LLM_PROVIDER for this run, e.g. 'groq'.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    outline = load_outline(args.outline)

    print(f"Loaded outline: {len(outline)} characters\n")
    print("Generating your draft...\n")
    print(generate(outline, provider=args.provider))


if __name__ == "__main__":
    main()
