"""Capstone example: a minimal tool-calling agent built with LangChain's deepagents.

See docs/bonus/capstone-ai-agent.md for the full walkthrough this file accompanies.
Requires a GOOGLE_API_KEY environment variable (see .env.example) — never hardcode
a real key here or commit one to the repo.
"""

import os

from deepagents import create_deep_agent
from langchain_google_genai import ChatGoogleGenerativeAI

COURSE_TOPICS = ["variables", "loops", "functions", "csv files", "pandas", "dataframes", "groupby"]


def search_course_topics(query: str) -> str:
    """A toy tool: pretends to look up whether a topic was covered in this course."""
    matches = [t for t in COURSE_TOPICS if query.lower() in t]
    return f"Matching topics: {matches}" if matches else "No matching topics found."


def build_agent():
    model = ChatGoogleGenerativeAI(
        # Pinned, versioned model ID -- deliberately not a "-latest" alias, which
        # Google has deprecated because it can silently hot-swap model versions.
        # Confirm this still has a free tier at https://ai.google.dev/gemini-api/docs/pricing
        # before relying on it; model names change on a timescale of months.
        model="gemini-3.5-flash",
        google_api_key=os.environ["GOOGLE_API_KEY"],
    )
    return create_deep_agent(
        model=model,
        tools=[search_course_topics],
        system_prompt="You help students figure out whether a topic was covered in their course.",
    )


if __name__ == "__main__":
    agent = build_agent()
    result = agent.invoke({"messages": [{"role": "user", "content": "Did we cover groupby?"}]})
    print(result)
