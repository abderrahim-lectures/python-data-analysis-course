"""Resume & Cover-Letter Tailoring Agent -- a CLI that tailors a resume and
drafts a cover letter for a specific job description, using a free-tier LLM.

See docs/projects/resume-tailor-agent/index.md for the walkthrough this
file accompanies.

You're free to use whichever free-tier provider you like -- this isn't
locked to any one of them. Set LLM_PROVIDER in a .env file (copy
.env.example) or a real environment variable to pick one; see PROVIDERS
below for the full list and which API key each one needs. Defaults to
"github" (GitHub Models) since it's free with no separate signup, tied to
a GitHub account every student here already has.

Never hardcode a real API key here or commit one to the repo.

Usage:
    uv run python tailor.py sample_resume.txt sample_job.txt
    uv run python tailor.py my_resume.txt my_job.txt --provider groq
"""

import argparse
import os
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()  # reads a local .env file, if present; real env vars always win

# Documents longer than this get truncated before being sent to the model --
# see the "overlong documents" pitfall in the lesson for why this matters:
# free-tier context windows and per-request token quotas are both limited.
MAX_TEXT_CHARS = 30_000

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


def load_text(path: str | Path) -> str:
    """Reads a plain-text file and returns its contents as a single string."""
    return Path(path).read_text(encoding="utf-8")


def truncate(text: str, max_chars: int = MAX_TEXT_CHARS) -> str:
    """Cuts an oversized document down to a size that fits a free-tier context window.

    Keeps the front of the document (usually the most information-dense
    part) and appends a clear marker so the model -- and you -- know the
    tailoring was based on a partial view, rather than silently trimming.
    """
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + f"\n\n... [truncated -- {len(text) - max_chars} more characters not shown] ..."


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


def tailor(resume: str, job: str, provider: str | None = None) -> str:
    """Sends a resume + job description to a free-tier LLM and returns the tailored result."""
    provider = provider or os.environ.get("LLM_PROVIDER", "github")
    if provider not in PROVIDERS:
        raise ValueError(f"Unknown LLM_PROVIDER '{provider}'. Choose one of: {', '.join(PROVIDERS)}")
    build_client, model = PROVIDERS[provider]
    client = build_client()

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"RESUME:\n```\n{truncate(resume)}\n```\n\nJOB DESCRIPTION:\n```\n{truncate(job)}\n```",
            },
        ],
    )
    return response.choices[0].message.content


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Tailor a resume and draft a cover letter for a specific job description."
    )
    parser.add_argument("resume", help="Path to your resume as a .txt or .md file.")
    parser.add_argument("job", help="Path to the job description as a .txt or .md file.")
    parser.add_argument("--provider", help="Override LLM_PROVIDER for this run, e.g. 'groq'.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    resume = load_text(args.resume)
    job = load_text(args.job)

    print(f"Loaded resume: {len(resume)} characters")
    print(f"Loaded job description: {len(job)} characters\n")
    print("Generating match score, cover letter draft, and resume edits...\n")
    print(tailor(resume, job, provider=args.provider))


if __name__ == "__main__":
    main()
