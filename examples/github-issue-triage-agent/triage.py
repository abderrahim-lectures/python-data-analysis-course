"""Real-World Project example: a GitHub issue triage *drafting* agent.

See docs/projects/github-issue-triage-agent/index.md for the walkthrough
this file accompanies.

Fetches OPEN issues from a real public GitHub repo, asks a free-tier LLM to
suggest a triage label and a one-sentence priority rationale for each one,
and prints a readable report -- for a human maintainer to read and decide
on. This script never applies a label to a real issue. See "Where to go
from here" in the lesson for how you could extend it to actually do that,
carefully, once you trust its suggestions.

You're free to use whichever free-tier LLM provider you like -- this isn't
locked to GitHub Models. Set LLM_PROVIDER in a .env file (copy .env.example)
or a real environment variable to pick one; see PROVIDERS below for the
full list and which API key each one needs.

Never hardcode a real API key here or commit one to the repo.
"""

import os
import time

import requests
from dotenv import load_dotenv

load_dotenv()  # reads a local .env file, if present; real env vars always win

GITHUB_API_URL = "https://api.github.com"
MAX_BODY_CHARS = 2000  # keep each issue's body well inside any model's context window
LABEL_CHOICES = ["bug", "feature", "question", "docs", "duplicate-looking", "other"]


# ---------------------------------------------------------------------------
# LLM provider setup -- same six-provider pattern as examples/ai-agent/agent.py.
# Every builder returns a plain function: str -> str (prompt in, reply out).
# ---------------------------------------------------------------------------


def _openai_compatible_caller(*, api_key: str, base_url: str, model: str):
    from openai import OpenAI

    client = OpenAI(api_key=api_key, base_url=base_url)

    def call(prompt: str) -> str:
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,  # a triage suggestion should be consistent, not creative
        )
        return response.choices[0].message.content or ""

    return call


def _build_github_caller():
    return _openai_compatible_caller(
        api_key=os.environ["GITHUB_TOKEN"],
        base_url="https://models.github.ai/inference",
        model="gpt-4o-mini",
    )


def _build_cerebras_caller():
    return _openai_compatible_caller(
        api_key=os.environ["CEREBRAS_API_KEY"],
        base_url="https://api.cerebras.ai/v1",
        model="llama-3.3-70b",
    )


def _build_openrouter_caller():
    return _openai_compatible_caller(
        api_key=os.environ["OPENROUTER_API_KEY"],
        base_url="https://openrouter.ai/api/v1",
        model="meta-llama/llama-3.3-70b-instruct:free",
    )


def _build_gemini_caller():
    import google.generativeai as genai

    genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
    # Pinned, versioned model ID -- deliberately not a "-latest" alias, which
    # Google has deprecated because it can silently hot-swap model versions.
    model = genai.GenerativeModel("gemini-3.5-flash")

    def call(prompt: str) -> str:
        return model.generate_content(prompt).text

    return call


def _build_groq_caller():
    from groq import Groq

    client = Groq(api_key=os.environ["GROQ_API_KEY"])

    def call(prompt: str) -> str:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
        )
        return response.choices[0].message.content or ""

    return call


def _build_mistral_caller():
    from mistralai import Mistral

    client = Mistral(api_key=os.environ["MISTRAL_API_KEY"])

    def call(prompt: str) -> str:
        response = client.chat.complete(
            model="mistral-small-latest",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
        )
        return response.choices[0].message.content or ""

    return call


# Every builder here is free-tier at the time of writing, with no credit card
# required -- but check the provider's own pricing page before relying on
# that, since free tiers change. GitHub Models, Cerebras, and OpenRouter are
# all OpenAI-compatible, so they share `_openai_compatible_caller`; Gemini,
# Groq, and Mistral use their own SDKs.
PROVIDERS = {
    "github": _build_github_caller,
    "gemini": _build_gemini_caller,
    "groq": _build_groq_caller,
    "mistral": _build_mistral_caller,
    "cerebras": _build_cerebras_caller,
    "openrouter": _build_openrouter_caller,
}


def build_llm_caller(provider: str | None = None):
    """Build a `str -> str` LLM call function using whichever provider you choose."""
    provider = provider or os.environ.get("LLM_PROVIDER", "github")
    if provider not in PROVIDERS:
        raise ValueError(f"Unknown LLM_PROVIDER '{provider}'. Choose one of: {', '.join(PROVIDERS)}")
    return PROVIDERS[provider]()


# ---------------------------------------------------------------------------
# Step 1: fetch open issues from a real public repo via GitHub's REST API.
# ---------------------------------------------------------------------------


def fetch_open_issues(owner: str, repo: str, limit: int = 10, token: str | None = None) -> list[dict]:
    """Fetch up to `limit` OPEN issues from a public GitHub repo.

    Unauthenticated requests are allowed for public repos, but capped at 60
    requests/hour -- fine for trying this out, easy to hit on a busy repo or
    a script you re-run a lot. Pass `token` (any GitHub personal access
    token, no scopes required for public read access) to raise that to
    5,000 requests/hour.

    GitHub's /issues endpoint also returns pull requests (a PR *is* an
    issue, internally) -- each real issue lacks a "pull_request" key, so
    that's filtered out here rather than left for the LLM to notice.
    """
    headers = {"Accept": "application/vnd.github+json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    response = requests.get(
        f"{GITHUB_API_URL}/repos/{owner}/{repo}/issues",
        params={"state": "open", "per_page": min(limit, 100), "sort": "updated"},
        headers=headers,
        timeout=10,
    )
    response.raise_for_status()
    issues = [item for item in response.json() if "pull_request" not in item]
    return issues[:limit]


# ---------------------------------------------------------------------------
# Step 2: build a triage-suggestion prompt for one issue.
# ---------------------------------------------------------------------------


def build_triage_prompt(issue: dict) -> str:
    """Turn one GitHub issue into a prompt asking for a suggested label + rationale.

    The body is truncated to MAX_BODY_CHARS -- some issues run to thousands
    of words (long logs, pasted stack traces) and there's no value in
    spending tokens on more of it than the model needs to get the gist.
    """
    title = issue.get("title") or "(no title)"
    body = (issue.get("body") or "(no description provided)")[:MAX_BODY_CHARS]

    return (
        "You are drafting a SUGGESTION for a human maintainer triaging a GitHub "
        "issue. You are not applying anything -- your output will be reviewed by "
        "a person before any label is added.\n\n"
        f"Choose exactly one label from this list: {', '.join(LABEL_CHOICES)}.\n\n"
        f"Issue title: {title}\n"
        f"Issue body:\n{body}\n\n"
        "Reply in exactly this two-line format, nothing else:\n"
        "Label: <one label from the list>\n"
        "Rationale: <one sentence explaining the suggested label and its priority>"
    )


def parse_triage_reply(reply: str) -> dict:
    """Parse the model's "Label: ...\\nRationale: ..." reply into a dict.

    Falls back to "other" / the raw reply if the model didn't follow the
    format exactly -- free-tier models occasionally add stray text, and a
    triage *draft* that's slightly malformed is still more useful printed
    than dropped silently.
    """
    label, rationale = "other", reply.strip()
    for line in reply.splitlines():
        if line.lower().startswith("label:"):
            candidate = line.split(":", 1)[1].strip().lower()
            label = candidate if candidate in LABEL_CHOICES else candidate or "other"
        elif line.lower().startswith("rationale:"):
            rationale = line.split(":", 1)[1].strip()
    return {"label": label, "rationale": rationale}


# ---------------------------------------------------------------------------
# Step 3 & 4: call the LLM per issue and print a readable triage report.
# ---------------------------------------------------------------------------


def suggest_triage(issue: dict, call_llm) -> dict:
    """Get one suggested label + rationale for one issue. Never touches the real issue."""
    prompt = build_triage_prompt(issue)
    reply = call_llm(prompt)
    return parse_triage_reply(reply)


def print_triage_report(owner: str, repo: str, issues: list[dict], suggestions: list[dict]) -> None:
    print("=" * 72)
    print(f"Triage suggestions for {owner}/{repo} -- {len(issues)} open issue(s)")
    print("These are DRAFT suggestions. Review each one before applying any label.")
    print("=" * 72)
    for issue, suggestion in zip(issues, suggestions):
        print(f"\n#{issue['number']}: {issue['title']}")
        print(f"  {issue['html_url']}")
        print(f"  Suggested label: {suggestion['label']}")
        print(f"  Rationale:       {suggestion['rationale']}")


def run(owner: str, repo: str, limit: int = 10) -> None:
    github_token = os.environ.get("GITHUB_API_TOKEN") or None
    issues = fetch_open_issues(owner, repo, limit=limit, token=github_token)
    if not issues:
        print(f"No open issues found for {owner}/{repo} (or they were all pull requests).")
        return

    call_llm = build_llm_caller()
    suggestions = []
    for issue in issues:
        suggestions.append(suggest_triage(issue, call_llm))
        time.sleep(0.5)  # a small, deliberate gap between LLM calls, same habit as scrape-analyze

    print_triage_report(owner, repo, issues, suggestions)


if __name__ == "__main__":
    repo_slug = os.environ.get("GITHUB_REPO", "psf/requests")
    repo_owner, repo_name = repo_slug.split("/", 1)
    run(repo_owner, repo_name, limit=10)
