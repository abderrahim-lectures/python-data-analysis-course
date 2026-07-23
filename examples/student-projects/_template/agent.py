"""Starter template for a capstone agent submission.

Copy this whole folder to examples/student-agents/your-name/ and edit from
here — see the README in this folder (and the one one level up) for the full
walkthrough, including how to open a pull request with your finished agent.

Requires an API key as an environment variable -- never hardcode a real key
here or commit one to the repo. Uses GitHub Models by default (no separate
signup needed), but you're free to use any provider you like -- see the
Capstone Bonus doc's provider table, or examples/capstone-agent/agent.py for
several wired up side by side.
"""

import os

from deepagents import create_deep_agent
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv()  # reads a local .env file, if present


def example_tool(text: str) -> str:
    """Replace this with a tool that actually does something real.

    A good tool reads or computes something the model can't just guess --
    search real files, call a real API, run a real calculation. See
    examples/capstone-agent/agent.py for tools that search the course's real
    lesson files and analyze real datasets with pandas.
    """
    return f"You said: {text}"


def build_agent():
    model = ChatOpenAI(
        # Check your provider's current model/pricing page before relying on
        # this -- model names and free-tier availability change often.
        model="gpt-4o-mini",
        api_key=os.environ["GITHUB_TOKEN"],
        base_url="https://models.github.ai/inference",
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
