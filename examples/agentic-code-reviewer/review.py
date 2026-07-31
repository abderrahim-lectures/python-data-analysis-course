"""Agentic Code Reviewer -- a CLI tool that reviews a git diff with a free-tier LLM.

See docs/projects/agentic-code-reviewer/index.md for the walkthrough this
file accompanies.

You're free to use whichever free-tier provider you like -- this isn't
locked to any one of them. Set LLM_PROVIDER in a .env file (copy
.env.example) or a real environment variable to pick one; see PROVIDERS
below for the full list and which API key each one needs. Defaults to
"github" (GitHub Models) since it's free with no separate signup, tied to
a GitHub account every student here already has.

Never hardcode a real API key here or commit one to the repo.

Usage:
    uv run python review.py                 # review uncommitted local changes
    uv run python review.py --against main   # review the diff against another ref
    uv run python review.py --commit abc1234 # review one specific past commit
    git diff main | uv run python review.py --stdin   # review a piped-in diff
"""

import argparse
import os
import subprocess
import sys

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()  # reads a local .env file, if present; real env vars always win

# Diffs beyond this many characters get truncated before being sent to the
# model -- see the "huge diffs" pitfall in the lesson for why this matters:
# free-tier context windows and per-request token quotas are both limited,
# and a multi-thousand-line diff can blow past either one.
MAX_DIFF_CHARS = 12_000

SYSTEM_PROMPT = """\
You are an experienced, pragmatic senior software engineer doing a code review.
You will be given a unified git diff. Review ONLY what the diff actually
changes -- do not comment on surrounding code you can't see, and do not
invent context that isn't in the diff.

For each issue you find, report:
- file and, if visible in the diff's @@ hunk header, the approximate line
- category: one of Bug, Style, Missing Test, Unclear Naming, Security, Other
- severity: Critical, Warning, or Suggestion
- a short, concrete explanation of the issue
- a specific suggested fix, not just "consider improving this"

Focus on:
- likely bugs (off-by-one errors, unhandled edge cases, wrong operators,
  mutated shared state)
- style inconsistencies with the surrounding code
- missing or clearly inadequate test coverage for the change
- unclear variable/function names that would confuse the next reader
- obvious security issues (secrets, injection, unsafe deserialization)

If the diff genuinely has no issues, say so plainly and briefly -- do not
invent problems just to have something to say. Never respond with just
"looks good" and nothing else; always state what you checked.

Format your response as a numbered list of issues (or a short "no issues
found, because ..." paragraph), not prose paragraphs.
"""


def get_diff_uncommitted() -> str:
    """The diff between the working tree and the last commit -- staged and unstaged changes."""
    return _run_git(["diff", "HEAD"])


def get_diff_against(ref: str) -> str:
    """The diff between the working tree and another ref, e.g. 'main'."""
    return _run_git(["diff", ref])


def get_diff_for_commit(commit: str) -> str:
    """The diff introduced by one specific past commit, vs. its parent."""
    return _run_git(["show", commit])


def _run_git(args: list[str]) -> str:
    """Runs `git <args>` in the current directory and returns its stdout.

    Uses subprocess directly rather than a git-wrapping library -- git is
    already installed on any machine that can have a repo to review, and
    this is the same subprocess.run(capture_output=True, text=True) pattern
    used elsewhere in this course, just applied to a real, useful command.
    """
    result = subprocess.run(
        ["git", *args],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)} failed:\n{result.stderr}")
    return result.stdout


def truncate_diff(diff: str, max_chars: int = MAX_DIFF_CHARS) -> str:
    """Cuts an oversized diff down to a size that fits comfortably in a free-tier context window.

    Keeps the front of the diff (usually the most-changed files first in git's
    ordering) and appends a clear marker so the model -- and you -- know the
    review is partial, rather than silently reviewing a truncated diff as if
    it were the whole thing.
    """
    if len(diff) <= max_chars:
        return diff
    return diff[:max_chars] + f"\n\n... [diff truncated -- {len(diff) - max_chars} more characters not shown] ..."


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


def review_diff(diff: str, provider: str | None = None) -> str:
    """Sends a diff to a free-tier LLM with the code-review system prompt and returns its feedback."""
    if not diff.strip():
        return "No changes to review -- the diff is empty."

    provider = provider or os.environ.get("LLM_PROVIDER", "github")
    if provider not in PROVIDERS:
        raise ValueError(f"Unknown LLM_PROVIDER '{provider}'. Choose one of: {', '.join(PROVIDERS)}")
    build_client, model = PROVIDERS[provider]
    client = build_client()

    diff = truncate_diff(diff)
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Review this diff:\n\n```diff\n{diff}\n```"},
        ],
    )
    return response.choices[0].message.content


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Review a git diff with a free-tier LLM.")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--against", metavar="REF", help="Review the diff against REF, e.g. 'main'.")
    group.add_argument("--commit", metavar="SHA", help="Review one specific past commit's diff.")
    group.add_argument("--stdin", action="store_true", help="Read the diff from stdin instead of running git.")
    parser.add_argument("--provider", help="Override LLM_PROVIDER for this run, e.g. 'groq'.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    if args.stdin:
        diff = sys.stdin.read()
    elif args.commit:
        diff = get_diff_for_commit(args.commit)
    elif args.against:
        diff = get_diff_against(args.against)
    else:
        diff = get_diff_uncommitted()

    print(f"Reviewing {len(diff)} characters of diff...\n")
    feedback = review_diff(diff, provider=args.provider)
    print(feedback)


if __name__ == "__main__":
    main()
