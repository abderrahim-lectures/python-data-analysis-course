"""Turns fetched commits into a categorized, cited changelog.

Run with: uv run python generate.py 50
(Set your API key in .env first.)
"""

import os
import sys

from dotenv import load_dotenv
from openai import OpenAI

from fetch_commits import load_commits

load_dotenv()

PROMPT_TEMPLATE = """You are writing a release changelog from commit messages.
Below is a list of recent commits, each tagged with a short hash. Write a
clean changelog with these rules:

- Group entries into sections: **Added**, **Changed**, **Fixed**.
- Merge commits that clearly belong to the same change; drop pure noise
  (merge commits, "wip", formatting-only messages) unless they hint at a real
  change, in which case include the change.
- Every entry must end with the commit hash(es) it came from, like "(abc1234)".
- Do NOT invent commits, features, or fixes. If a message is too vague to
  classify, put it in a final "Other / unclear" section rather than guessing.

Commits (hash: subject):
{commits}

Changelog:
"""


def build_prompt(commits: list[dict]) -> str:
    lines = [f"{c['hash'][:8]}: {c['subject']}" for c in commits]
    return PROMPT_TEMPLATE.format(commits="\n".join(lines))


def generate_changelog(commits: list[dict]) -> str:
    client = OpenAI(
        api_key=os.environ["GITHUB_TOKEN"],
        base_url="https://models.github.ai/inference",
    )
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # confirm this still has a free tier before running
        messages=[{"role": "user", "content": build_prompt(commits)}],
    )
    return response.choices[0].message.content


if __name__ == "__main__":
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 50
    print(generate_changelog(load_commits(limit)))
