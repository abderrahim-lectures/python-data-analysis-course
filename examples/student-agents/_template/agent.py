"""Starter template for a capstone agent submission.

Copy this whole folder to examples/student-agents/your-name/ and edit from
here — see the README in this folder (and the one one level up) for the full
walkthrough, including how to open a pull request with your finished agent.

Requires an API key as an environment variable -- never hardcode a real key
here or commit one to the repo.
"""

import os

from deepagents import create_deep_agent
from langchain_google_genai import ChatGoogleGenerativeAI


def example_tool(text: str) -> str:
    """Replace this with a tool that actually does something real.

    A good tool reads or computes something the model can't just guess --
    search real files, call a real API, run a real calculation. See
    examples/capstone-agent/agent.py for tools that search the course's real
    lesson files and analyze real datasets with pandas.
    """
    return f"You said: {text}"


def build_agent():
    model = ChatGoogleGenerativeAI(
        # Check https://ai.google.dev/gemini-api/docs/pricing for whichever
        # model currently has a free tier -- model names change often.
        model="gemini-3.5-flash",
        google_api_key=os.environ["GOOGLE_API_KEY"],
    )
    return create_deep_agent(
        model=model,
        tools=[example_tool],
        system_prompt="Describe what your agent should do here.",
    )


if __name__ == "__main__":
    agent = build_agent()
    result = agent.invoke({"messages": [{"role": "user", "content": "Say hello"}]})
    print(result["messages"][-1].content)
