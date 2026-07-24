"""Real-World Project example: a small multi-agent research assistant.

See docs/projects/multi-agent-research/index.md for the walkthrough this
file accompanies.

You're free to use whichever free-tier provider you like -- this isn't
locked to GitHub Models. Set LLM_PROVIDER in a .env file (copy .env.example)
or a real environment variable to pick one; see PROVIDERS below for the full
list and which API key each one needs. Defaults to "github" (GitHub Models)
since it's free with no separate signup, tied to a GitHub account every
student here already has.

Never hardcode a real API key here or commit one to the repo.

Objective: given a research question, a "planner" sub-agent breaks it into
a handful of focused sub-questions, a "researcher" sub-agent answers each
one, and a "writer" sub-agent synthesizes all the answers into one final
report -- three narrowly-instructed agents coordinated by deepagents'
sub-agent feature, instead of one big agent trying to do everything.

Honesty note: the researcher sub-agent answers from the model's own
training knowledge -- there is no real web search tool wired in here. That
keeps this example small and free-tier friendly, but it means answers can
be stale or wrong on anything the model wasn't trained on well. See the
lesson's "Where to go from here" for how to add a real search tool.
"""

import os
import re
import time

from deepagents import create_deep_agent
from dotenv import load_dotenv
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage

load_dotenv()  # reads a local .env file, if present; real env vars always win


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


planner_subagent = {
    "name": "planner",
    "description": "Breaks a research question down into 3-5 focused, independently-answerable sub-questions.",
    "system_prompt": (
        "You are a research planner. Given a broad research question, break it "
        "into 3 to 5 specific, independently-answerable sub-questions that together "
        "cover the topic well. Output ONLY a numbered list of sub-questions -- no "
        "preamble, no answers, just the questions themselves."
    ),
}

researcher_subagent = {
    "name": "researcher",
    "description": "Answers one specific sub-question at a time, concisely and factually.",
    "system_prompt": (
        "You are a researcher. Answer the single sub-question you are given as "
        "accurately and concisely as you can, using your own knowledge. You have "
        "no web search tool in this version -- if you are not confident about a "
        "fact, say so explicitly rather than guessing. Answer in 2-4 sentences."
    ),
}

writer_subagent = {
    "name": "writer",
    "description": "Synthesizes a set of sub-question answers into one coherent final report.",
    "system_prompt": (
        "You are a writer. Given a research question and a set of sub-question/answer "
        "pairs, synthesize them into one coherent, well-organized report of a few "
        "paragraphs. Do not just concatenate the answers -- connect them into prose "
        "that reads as a single piece of writing, and note plainly if the underlying "
        "research flagged low confidence anywhere."
    ),
}

TOP_LEVEL_SYSTEM_PROMPT = (
    "You coordinate a research task using your sub-agents, strictly in this order: "
    "1) delegate to the 'planner' sub-agent to get a numbered list of sub-questions. "
    "2) delegate each sub-question, one at a time, to the 'researcher' sub-agent. "
    "3) delegate to the 'writer' sub-agent, giving it the original question plus every "
    "sub-question/answer pair, and have it produce the final report. "
    "Return ONLY the writer's final report as your answer -- no intermediate steps."
)


def build_agent(provider: str | None = None):
    """Build the top-level research agent using whichever provider you choose.

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
        subagents=[planner_subagent, researcher_subagent, writer_subagent],
        system_prompt=TOP_LEVEL_SYSTEM_PROMPT,
    )


_RATE_LIMIT_SIGNALS = ("429", "RESOURCE_EXHAUSTED", "rate_limit", "Too Many Requests", "rate limit")


def _retry_delay_seconds(error_message: str) -> float | None:
    """Parse "Please retry in 41.7s" (or similar) out of a provider's error message, if present."""
    match = re.search(r"retry in ([\d.]+)s", error_message)
    return float(match.group(1)) if match else None


def ask(agent, question: str, max_retries: int = 1) -> dict | None:
    """Run one research question through the pipeline and return the raw LangGraph result.

    A single research question here costs at least one planner call, one
    researcher call per sub-question (typically 3-5), and one writer call --
    six to eight round trips minimum, several times more than a simple
    tool-calling agent. That means hitting a free-tier rate limit is more
    likely here, not a sign anything is broken. This catches it, waits for a
    suggested delay if the provider gave one (otherwise a fixed fallback),
    and retries once before giving up on the question -- the same pattern
    used in examples/ai-agent/agent.py.
    """
    try:
        return agent.invoke({"messages": [HumanMessage(content=question)]})
    except Exception as error:
        message = str(error)
        if not any(signal in message for signal in _RATE_LIMIT_SIGNALS):
            raise  # a real bug, not a rate limit -- don't hide it
        delay = _retry_delay_seconds(message) or 30.0
        if max_retries <= 0:
            print(f"⚠️  Rate limited and out of retries -- giving up on this question. ({message[:200]})")
            return None
        print(f"⚠️  Rate limited by the free tier. Waiting {delay:.0f}s before retrying...")
        time.sleep(delay)
        return ask(agent, question, max_retries=max_retries - 1)


def print_conversation(result: dict) -> None:
    """Pretty-print an agent result as a readable step-by-step trace.

    Shows every delegation -- planner, each researcher call, and the writer --
    stripped down to who said what, instead of the raw, noisy LangGraph
    message list.
    """
    for message in result["messages"]:
        if isinstance(message, HumanMessage):
            print(f"🧑 You: {message.content}")
        elif isinstance(message, ToolMessage):
            content = str(message.content)
            if len(content) > 300:
                content = content[:300] + "…"
            print(f"🔧 Sub-agent result ({message.name}): {content}")
        elif isinstance(message, AIMessage):
            for call in message.tool_calls:
                print(f"🤖 Agent → delegating to {call['name']}({call['args']})")
            text = message.content
            if isinstance(text, list):  # Gemini sometimes returns structured content blocks
                text = "".join(block.get("text", "") for block in text if isinstance(block, dict))
            if text:
                print(f"🤖 Agent: {text}")


def final_answer(result: dict) -> str:
    """Just the writer's final report text -- useful when you don't need the full trace."""
    last = result["messages"][-1]
    content = last.content
    if isinstance(content, list):
        return "".join(block.get("text", "") for block in content if isinstance(block, dict))
    return str(content)


if __name__ == "__main__":
    agent = build_agent()

    question = "What makes a programming language good for beginners to learn first?"
    print("=" * 70)
    result = ask(agent, question)
    if result is not None:
        print_conversation(result)
        print()
        print("Final report:")
        print(final_answer(result))
