"""Capstone example: a tool-calling AI agent with real, useful tools.

See docs/bonus/capstone-ai-agent.md for the walkthrough this file accompanies.

You're free to use whichever free-tier provider you like -- this isn't
locked to Gemini. Set LLM_PROVIDER in a .env file (copy .env.example) or a
real environment variable to pick one; see PROVIDERS below for the full
list and which API key each one needs. Defaults to "github" (GitHub Models)
since it's free with no separate signup, tied to a GitHub account every
student here already has, and its free tier (150 req/day on gpt-4o-mini at
the time of writing) is far more forgiving than Gemini's free tier
(as low as 5 req/minute), which is what most students will hit first.

Never hardcode a real API key here or commit one to the repo.

Objective: a "course study assistant" that can answer questions about this
course by actually looking things up — searching the real lesson content in
docs/ and running real pandas analysis on the real datasets in
static/datasets/ — rather than guessing from what the model already knows.
"""

import os
import re
import time
from pathlib import Path

import pandas as pd
from deepagents import create_deep_agent
from dotenv import load_dotenv
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage

load_dotenv()  # reads a local .env file, if present; real env vars always win

REPO_ROOT = Path(__file__).resolve().parents[2]
DOCS_DIR = REPO_ROOT / "docs"
DATASETS_DIR = REPO_ROOT / "static" / "datasets"


def _build_github_model():
    from langchain_openai import ChatOpenAI

    return ChatOpenAI(
        model="gpt-4o-mini",
        api_key=os.environ["GITHUB_TOKEN"],
        base_url="https://models.github.ai/inference",
    )


def _build_gemini_model():
    from langchain_google_genai import ChatGoogleGenerativeAI

    return ChatGoogleGenerativeAI(
        # Pinned, versioned model ID -- deliberately not a "-latest" alias, which
        # Google has deprecated because it can silently hot-swap model versions.
        model="gemini-3.5-flash",
        google_api_key=os.environ["GOOGLE_API_KEY"],
    )


def _build_groq_model():
    from langchain_groq import ChatGroq

    return ChatGroq(model="llama-3.3-70b-versatile", api_key=os.environ["GROQ_API_KEY"])


def _build_mistral_model():
    from langchain_mistralai import ChatMistralAI

    return ChatMistralAI(model="mistral-small-latest", api_key=os.environ["MISTRAL_API_KEY"])


def _build_cerebras_model():
    from langchain_openai import ChatOpenAI

    return ChatOpenAI(
        model="llama-3.3-70b",
        api_key=os.environ["CEREBRAS_API_KEY"],
        base_url="https://api.cerebras.ai/v1",
    )


def _build_openrouter_model():
    from langchain_openai import ChatOpenAI

    return ChatOpenAI(
        model="meta-llama/llama-3.3-70b-instruct:free",
        api_key=os.environ["OPENROUTER_API_KEY"],
        base_url="https://openrouter.ai/api/v1",
    )


# Every builder here is free-tier at the time of writing, with no credit card
# required -- but check the provider's own pricing page before relying on
# that, since free tiers change. Add your own here if you want a provider
# that isn't listed; the shape is always the same (a LangChain chat model
# instance, reading its own key from an environment variable).
PROVIDERS = {
    "github": _build_github_model,
    "gemini": _build_gemini_model,
    "groq": _build_groq_model,
    "mistral": _build_mistral_model,
    "cerebras": _build_cerebras_model,
    "openrouter": _build_openrouter_model,
}


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


def build_agent(provider: str | None = None):
    """Build the agent using whichever provider you choose.

    `provider` defaults to the LLM_PROVIDER environment variable, or "github"
    if that isn't set either -- see PROVIDERS above for the full list. Pass
    it explicitly to override without touching your .env, e.g.
    build_agent("groq").
    """
    provider = provider or os.environ.get("LLM_PROVIDER", "github")
    if provider not in PROVIDERS:
        raise ValueError(f"Unknown LLM_PROVIDER '{provider}'. Choose one of: {', '.join(PROVIDERS)}")
    model = PROVIDERS[provider]()
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


_RATE_LIMIT_SIGNALS = ("429", "RESOURCE_EXHAUSTED", "rate_limit", "Too Many Requests", "rate limit")


def _retry_delay_seconds(error_message: str) -> float | None:
    """Parse "Please retry in 41.7s" (or similar) out of a provider's error message, if present."""
    match = re.search(r"retry in ([\d.]+)s", error_message)
    return float(match.group(1)) if match else None


def ask(agent, question: str, max_retries: int = 1) -> dict | None:
    """Run one question through the agent and return the raw LangGraph result.

    Every free-tier provider here rate-limits you, and every agent turn --
    deciding to call a tool, then reading its result -- burns at least one
    request, so running several questions back to back can hit that limit
    easily. Rather than letting the whole script crash, this catches it,
    waits for a suggested delay if the provider gave one (otherwise a fixed
    fallback), and retries once before giving up on that question.

    Different providers raise different exception classes for this (Gemini's
    ChatGoogleGenerativeAIError, OpenAI-compatible providers' RateLimitError,
    Groq's and Mistral's own equivalents) -- rather than importing and
    special-casing each one, this catches broadly and inspects the message
    text for a rate-limit signal, re-raising anything that isn't one so real
    bugs are never silently swallowed.
    """
    try:
        return agent.invoke({"messages": [HumanMessage(content=question)]})
    except Exception as error:
        message = str(error)
        if not any(signal in message for signal in _RATE_LIMIT_SIGNALS):
            raise  # a real bug, not a rate limit -- don't hide it
        delay = _retry_delay_seconds(message) or 30.0
        if max_retries <= 0:
            print(f"⚠️  Rate limited and out of retries -- skipping this question. ({message[:200]})")
            return None
        print(f"⚠️  Rate limited by the free tier. Waiting {delay:.0f}s before retrying...")
        time.sleep(delay)
        return ask(agent, question, max_retries=max_retries - 1)


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
        if result is not None:
            print_conversation(result)
        print()
