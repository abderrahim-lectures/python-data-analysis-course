"""Capstone example: a tool-calling AI agent with real, useful tools.

See docs/bonus/capstone-ai-agent.md for the walkthrough this file accompanies.
Requires a GOOGLE_API_KEY environment variable (see .env.example) — never
hardcode a real key here or commit one to the repo.

Objective: a "course study assistant" that can answer questions about this
course by actually looking things up — searching the real lesson content in
docs/ and running real pandas analysis on the real datasets in
static/datasets/ — rather than guessing from what the model already knows.
"""

import os
from pathlib import Path

import pandas as pd
from deepagents import create_deep_agent
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage
from langchain_google_genai import ChatGoogleGenerativeAI

REPO_ROOT = Path(__file__).resolve().parents[2]
DOCS_DIR = REPO_ROOT / "docs"
DATASETS_DIR = REPO_ROOT / "static" / "datasets"


def search_course_docs(query: str) -> str:
    """Search the course's real lesson files for a topic and return matching pages.

    Looks through every .md/.mdx file under docs/ for the query (case-insensitive)
    and returns the file path plus one line of surrounding context per match, so
    the agent can point to *where* something was actually covered.
    """
    query_lower = query.lower()
    matches = []
    for path in sorted(DOCS_DIR.rglob("*.md*")):
        text = path.read_text(encoding="utf-8", errors="ignore")
        lines = text.splitlines()
        for i, line in enumerate(lines):
            if query_lower in line.lower():
                snippet = line.strip()[:160]
                matches.append(f"{path.relative_to(REPO_ROOT)}: \"{snippet}\"")
                break  # one hit per file is enough context
        if len(matches) >= 5:
            break
    if not matches:
        return f"No lesson pages mention '{query}'."
    return "Found in:\n" + "\n".join(matches)


def list_datasets() -> str:
    """List the real datasets bundled with the course, so the agent knows what exists."""
    names = sorted(p.stem for p in DATASETS_DIR.glob("*.csv"))
    return "Available datasets: " + ", ".join(names)


def analyze_dataset(name: str) -> str:
    """Load one of the course's real datasets with pandas and summarize it.

    `name` must match one of the course's actual bundled datasets (checked
    against an explicit allowlist derived from static/datasets/) -- never opens
    an arbitrary path, since that would let a model-controlled string read
    anything on disk.
    """
    available = {p.stem: p for p in DATASETS_DIR.glob("*.csv")}
    if name not in available:
        return f"Unknown dataset '{name}'. {list_datasets()}"
    df = pd.read_csv(available[name])
    numeric_summary = df.describe(include="number").round(2).to_string()
    return (
        f"{name}.csv: {df.shape[0]} rows x {df.shape[1]} columns\n"
        f"Columns: {', '.join(df.columns)}\n\n"
        f"Numeric summary:\n{numeric_summary}"
    )


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
        tools=[search_course_docs, list_datasets, analyze_dataset],
        system_prompt=(
            "You are a study assistant for the Python & Data Analysis course. "
            "Answer questions about the course's content and datasets by actually "
            "using your tools to look things up -- never guess at what a lesson "
            "covers or what a dataset contains when you can check for real."
        ),
    )


def ask(agent, question: str) -> dict:
    """Run one question through the agent and return the raw LangGraph result."""
    return agent.invoke({"messages": [HumanMessage(content=question)]})


def print_conversation(result: dict) -> None:
    """Pretty-print an agent result as a readable step-by-step trace.

    The raw LangGraph result is a flat list of message objects carrying a lot
    of internal bookkeeping (ids, token usage, provider-specific metadata).
    This strips all of that down to what a reader actually cares about: who
    said what, which tool got called with which arguments, and what it
    returned.
    """
    for message in result["messages"]:
        if isinstance(message, HumanMessage):
            print(f"🧑 You: {message.content}")
        elif isinstance(message, ToolMessage):
            content = str(message.content)
            if len(content) > 300:
                content = content[:300] + "…"
            print(f"🔧 Tool result ({message.name}): {content}")
        elif isinstance(message, AIMessage):
            for call in message.tool_calls:
                print(f"🤖 Agent → calling {call['name']}({call['args']})")
            text = message.content
            if isinstance(text, list):  # Gemini sometimes returns structured content blocks
                text = "".join(block.get("text", "") for block in text if isinstance(block, dict))
            if text:
                print(f"🤖 Agent: {text}")


def final_answer(result: dict) -> str:
    """Just the last message's text -- useful when you don't need the full trace."""
    last = result["messages"][-1]
    content = last.content
    if isinstance(content, list):
        return "".join(block.get("text", "") for block in content if isinstance(block, dict))
    return str(content)


if __name__ == "__main__":
    agent = build_agent()

    questions = [
        "Which lessons cover groupby, and what dataset could I practice it on?",
        "Summarize the titanic dataset -- how many rows, and what does survival rate look like across the numeric columns?",
    ]
    for question in questions:
        print("=" * 70)
        result = ask(agent, question)
        print_conversation(result)
        print()
