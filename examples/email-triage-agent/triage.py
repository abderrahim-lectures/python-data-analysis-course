"""Loads sample emails (or, optionally, real ones fetched by
fetch_from_imap.py -- see that file), categorizes and prioritizes each with
a free-tier LLM, and drafts a suggested reply for anything that needs one.

IMPORTANT: this script NEVER sends email and has no code path that could.
It only prints and saves draft text locally, to drafts/, for you to read,
edit, and send yourself by hand from your own email client.

Run with: uv run python triage.py
Or, against a different folder of emails: uv run python triage.py real_emails
"""

import json
import os
import sys
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()  # reads a local .env file, if present; real env vars always win

SAMPLE_EMAILS_DIR = Path(__file__).parent / "sample_emails"
DRAFTS_DIR = Path(__file__).parent / "drafts"

# Every provider below exposes an OpenAI-compatible Chat Completions
# endpoint, so one client class covers all six -- only the base_url, model
# name, and which environment variable holds the key change. Add your own
# here if you want a provider that isn't listed.
PROVIDERS = {
    "github": {
        "base_url": "https://models.github.ai/inference",
        "api_key_env": "GITHUB_TOKEN",
        "model": "gpt-4o-mini",
    },
    "gemini": {
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
        "api_key_env": "GOOGLE_API_KEY",
        "model": "gemini-3.5-flash",
    },
    "groq": {
        "base_url": "https://api.groq.com/openai/v1",
        "api_key_env": "GROQ_API_KEY",
        "model": "llama-3.3-70b-versatile",
    },
    "mistral": {
        "base_url": "https://api.mistral.ai/v1",
        "api_key_env": "MISTRAL_API_KEY",
        "model": "mistral-small-latest",
    },
    "cerebras": {
        "base_url": "https://api.cerebras.ai/v1",
        "api_key_env": "CEREBRAS_API_KEY",
        "model": "llama-3.3-70b",
    },
    "openrouter": {
        "base_url": "https://openrouter.ai/api/v1",
        "api_key_env": "OPENROUTER_API_KEY",
        "model": "meta-llama/llama-3.3-70b-instruct:free",
    },
}


def build_client() -> tuple[OpenAI, str]:
    """Builds an OpenAI-compatible client for LLM_PROVIDER (env var, default
    "github"). Returns (client, model_name). See PROVIDERS above for the
    full list and which key each one needs."""
    provider = os.environ.get("LLM_PROVIDER", "github")
    if provider not in PROVIDERS:
        raise ValueError(f"Unknown LLM_PROVIDER '{provider}'. Choose one of: {', '.join(PROVIDERS)}")
    config = PROVIDERS[provider]
    api_key = os.environ.get(config["api_key_env"])
    if not api_key:
        raise KeyError(
            f"{config['api_key_env']} is not set. Copy .env.example to .env "
            f"and fill in a key for the '{provider}' provider."
        )
    client = OpenAI(api_key=api_key, base_url=config["base_url"])
    return client, config["model"]


@dataclass
class Email:
    filename: str
    sender: str
    subject: str
    date: str
    body: str


def parse_email(path: Path) -> Email:
    """Parses one plain-text sample email: a few `Header: value` lines, a
    blank line, then the body -- the same shape as a real .eml file's
    headers, simplified so no email-parsing library is needed for the
    bundled samples."""
    text = path.read_text(encoding="utf-8")
    header_text, _, body = text.partition("\n\n")
    headers = {}
    for line in header_text.splitlines():
        if ":" in line:
            key, _, value = line.partition(":")
            headers[key.strip().lower()] = value.strip()
    return Email(
        filename=path.name,
        sender=headers.get("from", "unknown"),
        subject=headers.get("subject", "(no subject)"),
        date=headers.get("date", "unknown"),
        body=body.strip(),
    )


def load_emails(directory: Path) -> list[Email]:
    """Loads every .txt file in `directory`, sorted by filename."""
    return [parse_email(p) for p in sorted(directory.glob("*.txt"))]


TRIAGE_PROMPT = """You are an email triage assistant. Read the email below and respond with ONLY a JSON object (no other text, no markdown fence), with these exact keys:

- "category": one of "urgent", "needs-reply", "newsletter", "fyi", "spam-ish"
- "priority": one of "high", "medium", "low"
- "reasoning": one short sentence explaining the category and priority
- "needs_reply": true or false

Email:
From: {sender}
Subject: {subject}
Date: {date}

{body}
"""

DRAFT_REPLY_PROMPT = """Draft a short, professional reply to the email below. Write ONLY the reply body text -- no subject line, no commentary about what you're doing, just the reply itself, as if the recipient is about to review and send it.

Original email:
From: {sender}
Subject: {subject}

{body}
"""


def triage_email(client: OpenAI, model: str, email: Email) -> dict:
    """Asks the LLM to categorize and prioritize one email. Returns the
    parsed JSON verdict. Read-only: never modifies or sends anything."""
    response = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "user",
                "content": TRIAGE_PROMPT.format(
                    sender=email.sender, subject=email.subject, date=email.date, body=email.body
                ),
            }
        ],
    )
    content = response.choices[0].message.content.strip()
    # Models occasionally wrap JSON in a ```json fence despite the prompt --
    # strip it rather than fail outright.
    if content.startswith("```"):
        content = content.strip("`")
        content = content.removeprefix("json").strip()
    return json.loads(content)


def draft_reply(client: OpenAI, model: str, email: Email) -> str:
    """Asks the LLM to draft a reply. The result is ALWAYS just printed and
    saved to a local file for a human to review -- this function has no
    way to actually send anything, on purpose."""
    response = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "user",
                "content": DRAFT_REPLY_PROMPT.format(
                    sender=email.sender, subject=email.subject, body=email.body
                ),
            }
        ],
    )
    return response.choices[0].message.content.strip()


def main() -> None:
    client, model = build_client()
    emails_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else SAMPLE_EMAILS_DIR
    emails = load_emails(emails_dir)
    if not emails:
        print(f"No .txt emails found in {emails_dir}/")
        return

    DRAFTS_DIR.mkdir(exist_ok=True)
    print(f"Triaging {len(emails)} email(s) from {emails_dir}/ with model '{model}'...\n")

    for email in emails:
        verdict = triage_email(client, model, email)
        print(f"[{email.filename}] {email.subject!r}")
        print(f"  category: {verdict['category']}   priority: {verdict['priority']}")
        print(f"  reasoning: {verdict['reasoning']}")

        if verdict.get("needs_reply"):
            reply = draft_reply(client, model, email)
            draft_path = DRAFTS_DIR / f"{Path(email.filename).stem}_draft_reply.txt"
            draft_path.write_text(reply, encoding="utf-8")
            print(f"  -> draft reply saved to {draft_path}  (NOT sent -- review and send yourself)")
        print()

    print(
        "Done. This script only ever printed text and saved files under "
        f"{DRAFTS_DIR}/ -- it has no code path that sends email anywhere. "
        "Read every draft yourself before copying any of it into a real reply."
    )


if __name__ == "__main__":
    main()
