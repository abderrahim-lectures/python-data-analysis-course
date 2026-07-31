"""Git Commit-Message Generator -- a CLI tool that drafts a conventional-commit-style
message from a real git diff with a free-tier LLM.

See docs/projects/commit-message-agent/index.md for the walkthrough this
file accompanies.

You're free to use whichever free-tier provider you like -- this isn't
locked to any one of them. Set LLM_PROVIDER in a .env file (copy
.env.example) or a real environment variable to pick one; see PROVIDERS
below for the full list and which API key each one needs. Defaults to
"github" (GitHub Models) since it's free with no separate signup, tied to
a GitHub account every student here already has.

Never hardcode a real API key here or commit one to the repo.

This tool NEVER commits anything on its own. It reads `git diff --staged`,
drafts a message, shows it to you, and only runs `git commit -m "..."` after
you explicitly type "y" at the confirmation prompt. There is no "auto-commit"
mode -- see the lesson's tip on why that boundary is deliberate.

Usage:
    uv run python commit_helper.py               # draft from staged changes, ask before committing
    uv run python commit_helper.py --dry-run      # draft and print only, never offer to commit
    git diff --staged | uv run python commit_helper.py --stdin --dry-run   # draft from a piped-in diff
"""

import argparse
import os
import subprocess
import sys

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()  # reads a local .env file, if present; real env vars always win

# Diffs beyond this many characters get truncated before being sent to the
# model -- a multi-thousand-line diff can blow past a free-tier context
# window or per-request token quota just like it would for a code reviewer.
MAX_DIFF_CHARS = 12_000

SYSTEM_PROMPT = """\
You are an experienced software engineer writing a git commit message for a
staged diff. You will be given a unified git diff. Base the message ONLY on
what the diff actually changes -- do not invent context you can't see, and
do not guess at a ticket number or issue reference that isn't in the diff.

Write the message in the Conventional Commits style:

    <type>(<optional scope>): <short summary, imperative mood, no period>

    <optional body: a few lines explaining WHY the change was made, not
    just restating what the diff shows -- wrap around 72 characters>

Valid types: feat, fix, docs, style, refactor, perf, test, build, ci, chore.
Pick the type that best matches the *dominant* change -- if a diff touches
both a fix and its test, "fix" usually still wins over "test".

Rules:
- The summary line must stay under 72 characters and use the imperative
  mood ("add", not "added" or "adds").
- Only include a body if it adds real information beyond the summary --
  for a small, self-explanatory diff, the summary line alone is enough.
- Never wrap the whole message in a fenced code block or add commentary
  before/after it -- output ONLY the commit message text itself, nothing
  else, so it can be used directly as a commit message.
"""


def get_diff_staged() -> str:
    """The diff between the index (staged changes) and the last commit.

    Deliberately `--staged`, not the full working-tree diff: a commit message
    should describe what's about to actually be committed, which is whatever
    is staged with `git add` -- not unstaged changes the author isn't ready
    to commit yet.
    """
    return _run_git(["diff", "--staged"])


def get_diff_for_commit(commit: str) -> str:
    """The diff introduced by one specific past commit, vs. its parent.

    Useful for trying the drafter against real history instead of your own
    staged changes -- see Step 1 of the lesson and the notebook demo.
    """
    return _run_git(["show", commit])


def _run_git(args: list[str]) -> str:
    """Runs `git <args>` in the current directory and returns its stdout.

    Same subprocess.run(capture_output=True, text=True) pattern used
    throughout this course for wrapping a real CLI tool: the command is
    passed as a list (not one shell string) to avoid shell-quoting and
    injection issues, and `check=False` plus a manual returncode check lets
    this function raise its own clear error instead of a generic one.
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
    """Cuts an oversized diff down to a size that fits comfortably in a free-tier context window."""
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


def draft_commit_message(diff: str, provider: str | None = None) -> str:
    """Sends a diff to a free-tier LLM with the commit-message system prompt and returns a draft.

    Returns a string. That's it -- this function has no idea a terminal or a
    `git commit` call exists. Committing is handled separately, later, only
    after a human has seen and accepted this draft. See the CLI loop below.
    """
    if not diff.strip():
        return ""

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
            {"role": "user", "content": f"Write a commit message for this staged diff:\n\n```diff\n{diff}\n```"},
        ],
    )
    return response.choices[0].message.content.strip()


def run_interactive_loop(diff: str, provider: str | None, dry_run: bool) -> None:
    """Drafts a message, lets the user accept/edit/regenerate it, then -- only on explicit
    confirmation -- runs `git commit -m`. Never commits without that confirmation.
    """
    if not diff.strip():
        print("No staged changes to describe. Stage something first with `git add`.")
        return

    print(f"Drafting a commit message from {len(diff)} characters of staged diff...\n")
    message = draft_commit_message(diff, provider=provider)

    while True:
        print("-" * 60)
        print(message)
        print("-" * 60)

        if dry_run:
            print("\n(--dry-run: not offering to commit.)")
            return

        choice = input("\nUse this message? [y]es / [e]dit / [r]egenerate / [n]o, cancel: ").strip().lower()

        if choice in ("n", "no"):
            print("Cancelled -- nothing was committed.")
            return
        if choice in ("r", "regenerate"):
            message = draft_commit_message(diff, provider=provider)
            continue
        if choice in ("e", "edit"):
            print("Enter your edited message (finish with an empty line):")
            lines = []
            while (line := input()) != "":
                lines.append(line)
            message = "\n".join(lines) or message
            continue
        if choice in ("y", "yes"):
            _commit(message)
            return

        print("Please answer y, e, r, or n.")


def _commit(message: str) -> None:
    """Runs the actual `git commit -m <message>`. Only ever called after an explicit 'y'
    from a human in run_interactive_loop -- never called automatically anywhere else."""
    result = subprocess.run(
        ["git", "commit", "-m", message],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(f"git commit failed:\n{result.stderr}")
    print(result.stdout)
    print("Committed.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Draft a commit message for staged changes with a free-tier LLM.")
    parser.add_argument("--commit", metavar="SHA", help="Draft a message for one specific past commit's diff, instead of staged changes.")
    parser.add_argument("--stdin", action="store_true", help="Read the diff from stdin instead of running git.")
    parser.add_argument("--provider", help="Override LLM_PROVIDER for this run, e.g. 'groq'.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the draft and exit -- never offer to run `git commit`.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    if args.stdin:
        diff = sys.stdin.read()
    elif args.commit:
        diff = get_diff_for_commit(args.commit)
    else:
        diff = get_diff_staged()

    run_interactive_loop(diff, provider=args.provider, dry_run=args.dry_run or bool(args.commit) or args.stdin)


if __name__ == "__main__":
    main()
