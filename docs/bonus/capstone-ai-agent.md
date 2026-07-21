---
id: capstone-ai-agent
title: "Capstone Bonus: Graduate to Real Python + Build an AI Agent"
slug: /bonus/capstone-ai-agent
---

# 🎁 Capstone Bonus: Graduate to Real Python + Build an AI Agent

**Congratulations on finishing the course.** Everything so far ran in a sandboxed, in-browser playground — Trinket or JupyterLite — so you could start writing Python on day one with zero setup. This capstone is the graduation step: install Python for real on your own machine, then use it to build something neither playground could run — an AI agent with its own API key, calling out to a real language model.

This is optional and ungraded. It's here because finishing 10 weeks of fundamentals deserves a payoff that points toward what comes next.

## 🎯 What you'll do

1. Install `uv`, a fast, modern tool for managing Python itself and your project's dependencies — no separate Python installer needed.
2. Get a free-tier AI API key (Gemini via Google AI Studio is the suggested default).
3. Set up a small project and install LangChain's `deepagents`.
4. Write and run one small agent, locally, from your own terminal.

## Step 1: Install `uv`

`uv` is a single tool that replaces the usual "install Python, then install pip, then install a virtual environment tool, then install packages" chain — it can install and manage Python versions itself, alongside your project's dependencies.

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Close and reopen your terminal, then confirm it installed:

```bash
uv --version
```

### Installing a real Python interpreter

Unlike the in-browser playgrounds, `uv` can fetch and manage an actual Python interpreter on your machine directly — you don't need to separately visit python.org:

```bash
uv python install 3.12
```

This is your graduation moment: a real Python, installed and managed on your own computer, not inside a browser sandbox.

## Step 2: Get a free AI API key

This capstone uses **Gemini's free-tier API** via [Google AI Studio](https://aistudio.google.com/) as the default — no credit card required for the free tier at the time of writing. Any other free-tier LLM API (OpenAI's trial credits, Anthropic's, etc.) works the same way; only the specific LangChain integration package in Step 4 would differ.

1. Visit Google AI Studio and sign in with a Google account.
2. Generate an API key.
3. **Never paste this key directly into code or commit it to a repository.** Set it as an environment variable instead:

```bash
# macOS / Linux (add to ~/.bashrc or ~/.zshrc to persist it)
export GOOGLE_API_KEY="your-key-here"

# Windows (PowerShell)
$env:GOOGLE_API_KEY = "your-key-here"
```

An API key is a secret, exactly like a password — anyone with it can use your account's quota. Treating it as an environment variable rather than a hardcoded string is the standard practice for exactly this reason, and it's the first real-world security habit this course asks you to build.

## Step 3: Set up the project with `uv`

```bash
uv init capstone-agent
cd capstone-agent
uv add deepagents langchain-google-genai
```

`uv init` creates a small project (a `pyproject.toml` tracking your dependencies) and `uv add` installs packages into an isolated environment for that project — automatically, with no manual virtual-environment setup. `deepagents` is LangChain's framework for building agents with planning, tool use, and sub-agent delegation built in; `langchain-google-genai` is the integration package connecting LangChain to the Gemini API from Step 2.

:::tip Check the current docs — and the model name
Agent frameworks move fast, and so do Gemini's model names: they get renamed and retired on a timescale of months, not years. `create_deep_agent`'s own keyword arguments have already changed once since earlier drafts of this page (it's `system_prompt`, not `instructions`) — a reminder that this snippet can drift out of date even after being checked once. Use an explicit, versioned model ID like `gemini-3.5-flash` below rather than a `-latest` alias: Google has deprecated those aliases because they silently hot-swap to a new model version, which can break working code with no warning. Before running this, check [Google AI Studio](https://aistudio.google.com/) or the [Gemini API pricing page](https://ai.google.dev/gemini-api/docs/pricing) for whichever model currently has a free tier, and skim `deepagents`' own README for its current API.
:::

## Step 4: Write your first agent

Create `agent.py`:

```python
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from deepagents import create_deep_agent

def search_course_topics(query: str) -> str:
    """A toy tool: pretends to look up whether a topic was covered in this course."""
    topics = ["variables", "loops", "functions", "csv files", "pandas", "dataframes", "groupby"]
    matches = [t for t in topics if query.lower() in t]
    return f"Matching topics: {matches}" if matches else "No matching topics found."

model = ChatGoogleGenerativeAI(
    model="gemini-3.5-flash",  # confirm this still has a free tier before running — see the tip above
    google_api_key=os.environ["GOOGLE_API_KEY"],
)

agent = create_deep_agent(
    model=model,
    tools=[search_course_topics],
    system_prompt="You help students figure out whether a topic was covered in their course.",
)

if __name__ == "__main__":
    result = agent.invoke({"messages": [{"role": "user", "content": "Did we cover groupby?"}]})
    print(result)
```

Run it — with `uv`, no manual environment activation is needed:

```bash
uv run python agent.py
```

`os.environ["GOOGLE_API_KEY"]` reads the environment variable you set in Step 2 — the same `os` module concept as `input()` reading from the keyboard, just reading from your shell's environment instead. `create_deep_agent` wires the model together with a list of Python functions the agent can call as **tools** — this is the core idea behind agents: a language model that can not just respond with text, but decide to call your code, read the result, and use it to inform its answer.

## What you just built

`search_course_topics` is deliberately trivial — a real agent's tools might search the web, query a database, or run code. But the shape is the same one powering far more capable systems: a model that reasons about a task, decides which tool to call and with what arguments, reads the tool's output, and continues — sometimes calling several tools in sequence before responding. You just built the smallest possible version of that loop, locally, with your own key.

:::tip Run it without any local setup
A real, runnable copy of this exact agent lives in the course repo at [`examples/capstone-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/capstone-agent) — clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` already installed) and run it from there.
:::

## Where to go from here

- Give your agent a second, more useful tool — maybe one that reads a local file, or calls a public API. The [`examples/capstone-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/capstone-agent) copy in the repo already does this: it searches this course's real lesson files and analyzes its real datasets with pandas, instead of guessing.
- Look at `deepagents`' support for **sub-agents** — delegating part of a task to a separately-instructed agent, similar to how a manager might delegate a sub-task to a specialist.
- Revisit the bonus `try`/`except` and `class` content from Python 101 — real agent code leans on both constantly (catching a failed tool call, wrapping related state in a class) in ways this course's core curriculum deliberately avoided.

## Share your agent with the class

Built something you're proud of? [`examples/student-agents/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-agents) is a gallery of agents other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓
