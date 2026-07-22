---
id: 2026-ai-agent
title: "2026 Capstone: Graduate to Real Python + Build an AI Agent"
sidebar_label: "2026: Build an AI Agent"
slug: /bonus/2026-ai-agent
description: "Graduate from the in-browser playground to real Python: install Python locally and build your first AI agent with LangChain's deepagents."
---

import CapstoneProgressCheckbox from '@site/src/components/CapstoneProgressCheckbox';

# 🎁 2026 Capstone: Graduate to Real Python + Build an AI Agent

**Congratulations on finishing the course.** Everything so far ran in a sandboxed, in-browser playground — so you could start writing Python on day one with zero setup. This capstone is the graduation step: install Python for real on your own machine, then use it to build something the playground could never run — an AI agent with its own API key, calling out to a real language model.

This is optional and ungraded. It's here because finishing 10 weeks of fundamentals deserves a payoff that points toward what comes next. It's also this year's project — every year adds a new one, and past years' projects stay available; see [Choose your Capstone](/docs/bonus) for the full list.

## 🎯 What you'll do

1. Install `uv`, a fast, modern tool for managing Python itself and your project's dependencies — no separate Python installer needed.
2. Get a free-tier AI API key. **You're free to use whichever provider you like** — GitHub Models is the suggested default below since it needs no separate signup (you already have a GitHub account), but Gemini, Groq, Mistral, Cerebras, and OpenRouter all have workable free tiers too.
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

**Pick whichever provider you like** — none of them require a credit card at the time of writing, and this course doesn't favor one over another. The example agent in the course repo ([`examples/capstone-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/capstone-agent)) supports all six out of the box, selected with one setting.

| Provider | Where to get a key | Why you might pick it |
|---|---|---|
| **GitHub Models** *(suggested default)* | [github.com/settings/tokens](https://github.com/settings/tokens) — a personal access token with the `models: read` scope | No separate signup — you already have a GitHub account. More generous free-tier limits than Gemini's. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | The most commonly referenced option; used in earlier drafts of this page. |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Fast inference, generous free tier, no card. |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | One of the more generous permanent free quotas. |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | High daily token volume, no card. |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | One API, many free models — good for comparing providers. |

Whichever you pick, the process is the same:

1. Sign in and generate an API key on that provider's site.
2. **Never paste this key directly into code or commit it to a repository.** Set it as an environment variable instead:

```bash
# macOS / Linux (add to ~/.bashrc or ~/.zshrc to persist it)
export GITHUB_TOKEN="your-key-here"   # or GOOGLE_API_KEY, GROQ_API_KEY, etc. -- match your provider

# Windows (PowerShell)
$env:GITHUB_TOKEN = "your-key-here"
```

An API key is a secret, exactly like a password — anyone with it can use your account's quota. Treating it as an environment variable rather than a hardcoded string is the standard practice for exactly this reason, and it's the first real-world security habit this course asks you to build.

:::tip[A .env file is often more convenient than export]
Instead of `export`-ing a key in every new terminal session, you can put it in a `.env` file in your project folder (see the repo example's `.env.example`) and load it automatically with the `python-dotenv` package — covered in Step 4.
:::

## Step 3: Set up the project with `uv`

```bash
uv init capstone-agent
cd capstone-agent
uv add deepagents langchain-openai python-dotenv
```

`uv init` creates a small project (a `pyproject.toml` tracking your dependencies) and `uv add` installs packages into an isolated environment for that project — automatically, with no manual virtual-environment setup. `deepagents` is LangChain's framework for building agents with planning, tool use, and sub-agent delegation built in; `langchain-openai` is the integration package this example uses to talk to GitHub Models (its API is OpenAI-compatible, so the OpenAI integration package works for it — see the tip below if you picked a different provider); `python-dotenv` lets you keep your API key in a local `.env` file instead of `export`-ing it every session.

If you picked a different provider in Step 2, swap `langchain-openai` for that provider's own package — `langchain-google-genai` (Gemini), `langchain-groq` (Groq), or `langchain-mistralai` (Mistral). Cerebras and OpenRouter are also OpenAI-compatible, so they use `langchain-openai` too, just with a different `base_url`.

:::tip[Check the current docs — and the model name]
Agent frameworks move fast, and so do model names: they get renamed and retired on a timescale of months, not years. `create_deep_agent`'s own keyword arguments have already changed once since earlier drafts of this page (it's `system_prompt`, not `instructions`) — a reminder that this snippet can drift out of date even after being checked once. Use an explicit, versioned model ID rather than a `-latest` alias: several providers, including Google, have deprecated those because they silently hot-swap to a new model version, which can break working code with no warning. Before running this, check your provider's current pricing/model page, and skim `deepagents`' own README for its current API.
:::

## Step 4: Write your first agent

Create a `.env` file (never commit this) with the key for whichever provider you picked:

```bash
# .env
GITHUB_TOKEN=your-key-here
```

Then create `agent.py`:

```python
import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from deepagents import create_deep_agent

load_dotenv()  # reads .env into the environment, if present

def search_course_topics(query: str) -> str:
    """A toy tool: pretends to look up whether a topic was covered in this course."""
    topics = ["variables", "loops", "functions", "csv files", "pandas", "dataframes", "groupby"]
    matches = [t for t in topics if query.lower() in t]
    return f"Matching topics: {matches}" if matches else "No matching topics found."

def count_weeks_remaining(current_week: int) -> str:
    """A second toy tool: how many weeks are left in the 10-week course."""
    remaining = max(0, 10 - current_week)
    return f"{remaining} week(s) remaining out of 10."

model = ChatOpenAI(
    model="gpt-4o-mini",  # confirm this still has a free tier before running — see the tip above
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)

agent = create_deep_agent(
    model=model,
    tools=[search_course_topics, count_weeks_remaining],
    system_prompt="You help students figure out whether a topic was covered in their course.",
)

if __name__ == "__main__":
    result = agent.invoke({"messages": [{"role": "user", "content": "Did we cover groupby?"}]})
    print(result["messages"][-1].content)  # just the final answer, not the full internal trace
```

Run it — with `uv`, no manual environment activation is needed:

```bash
uv run python agent.py
```

`load_dotenv()` reads your `.env` file into `os.environ` before anything else runs, so `os.environ["GITHUB_TOKEN"]` finds the key you set in Step 2 — the same `os` module concept as `input()` reading from the keyboard, just reading from a file instead. `create_deep_agent` wires the model together with a list of Python functions the agent can call as **tools** — this is the core idea behind agents: a language model that can not just respond with text, but decide to call your code, read the result, and use it to inform its answer.

Notice `tools=[search_course_topics, count_weeks_remaining]` — two tools, not one. The model picks *which* tool (if any) fits the question, entirely on its own: ask "Did we cover groupby?" and it calls `search_course_topics`; ask "How many weeks are left if I'm on week 4?" and it calls `count_weeks_remaining` instead. You never write an `if`/`elif` chain routing questions to tools yourself — the docstring on each function (the triple-quoted string right after `def`) is what the model reads to decide which tool matches which request, exactly like Python 101 Week 4's docstrings, except here a language model is the one reading them, not a human skimming your code.

### How the agent actually decides what to do

Nothing here is magic — `create_deep_agent` builds a loop, and every iteration of that loop is one ordinary API call to the model you configured:

1. Your question goes to the model, along with the *list* of available tools (their names, parameters, and docstrings — not their code).
2. The model replies with either a final text answer, **or** a request to call one specific tool with specific arguments.
3. If it requested a tool call, your own Python code (not the model) actually runs that function and gets a real result.
4. That result goes back to the model as new context, and the loop repeats from step 2 — the model might call another tool, or now have enough information to answer.
5. Once the model replies with text and no further tool request, the loop stops and that's your final answer.

This is exactly why a rate-limit error (see below) can happen even for what feels like "one question" — a question needing two tool calls costs at least three round trips to the model (decide to call tool A, decide to call tool B, produce the final answer), not one.

### What you should see

A single printed line — the agent's final answer, something like:

```
Yes, "groupby" was covered in the course.
```

If instead you see a Python traceback, check which kind:

- **`KeyError: 'GITHUB_TOKEN'`** — the environment variable/`.env` value isn't being found. Confirm `.env` is in the same folder as `agent.py` and has no typo in the variable name, or that you actually ran `export` in the same terminal session you're running the script from.
- **An authentication error (401/403)** — the key itself is wrong, expired, or (for GitHub Models) missing the `models: read` scope. Regenerate it.
- **A rate-limit error (429)** — see the next section. This one is common and expected, not a sign anything is broken.

### Understanding the full internal trace

`result["messages"][-1].content` above deliberately shows only the final answer. If you print the *whole* `result` instead, you'll see something much noisier — every message LangGraph tracked internally, each carrying bookkeeping fields alongside the actual content:

```python
result = agent.invoke({"messages": [{"role": "user", "content": "Did we cover groupby?"}]})
for message in result["messages"]:
    print(type(message).__name__, "->", message)
```

Stripped down to what actually matters, the trace behind that one question looks like this:

| # | Message type | What it holds |
|---|---|---|
| 1 | `HumanMessage` | Your question: `"Did we cover groupby?"` |
| 2 | `AIMessage` (no text) | The model decided to call `search_course_topics(query="groupby")` — no answer yet, just a tool request |
| 3 | `ToolMessage` | The *real* return value of your Python function: `"Matching topics: ['groupby']"` |
| 4 | `AIMessage` (final) | The model's actual answer, now that it has the tool's result: `"Yes, groupby was covered."` |

The noisy parts you can safely ignore when reading a raw trace: `id`/`tool_call_id` fields (bookkeeping to match a tool call to its result), provider-specific internal reasoning traces (not meant to be human-readable), and `usage_metadata` (token counts, useful for cost tracking, irrelevant to the conversation itself). This 4-row shape — question, tool call, tool result, answer — is the entire agent loop from the previous section, just written out as data instead of as a numbered list.

### Handling rate limits

Every free tier here caps how many requests you can make per minute or per day, and each turn of the agent — deciding to call a tool, then reading the result — uses at least one request. Run a few questions back to back and you may well see something like:

```
Error calling model ... (RESOURCE_EXHAUSTED): 429 RESOURCE_EXHAUSTED.
...Please retry in 41.7s.
```

This isn't a bug in your code — it's the provider telling you to slow down. Two ways to handle it:

1. **Simplest**: just wait the suggested number of seconds and run the script again.
2. **More robust**: wrap the `agent.invoke(...)` call in a `try`/`except` that catches the error, waits, and retries automatically — exactly the pattern taught as bonus content back in Python 101 Week 4. The repo's fuller example does this for real: see `ask()` in [`examples/capstone-agent/agent.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/capstone-agent/agent.py) for a working version you can copy, including parsing the provider's suggested retry delay out of the error message.

:::tip[Using a different provider?]
Swap the `ChatOpenAI(...)` block for your provider's own client — e.g. `ChatGoogleGenerativeAI(model="gemini-3.5-flash", google_api_key=os.environ["GOOGLE_API_KEY"])` for Gemini, or `ChatGroq(model="llama-3.3-70b-versatile", api_key=os.environ["GROQ_API_KEY"])` for Groq. Everything else in this file stays the same — `deepagents` doesn't care which provider is behind the model. See [`examples/capstone-agent/agent.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/capstone-agent) in the course repo for all six wired up side by side, selectable with one environment variable.
:::

## What you just built

`search_course_topics` is deliberately trivial — a real agent's tools might search the web, query a database, or run code. But the shape is the same one powering far more capable systems: a model that reasons about a task, decides which tool to call and with what arguments, reads the tool's output, and continues — sometimes calling several tools in sequence before responding. You just built the smallest possible version of that loop, locally, with your own key.

:::tip[Run a fuller version without any local setup]
[`examples/capstone-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/capstone-agent) in the course repo is **not a copy of the code above** — it's a deliberately fuller version, with real tools (it searches this course's actual lesson files and analyzes its actual datasets with pandas, instead of a hardcoded topic list) and support for all six providers from the table above, selected with one setting. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` already installed) and run it from there.
:::

## Where to go from here

- Give your agent a genuinely *useful* tool, not just a toy one — one that reads a real local file, or calls a real public API. The [`examples/capstone-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/capstone-agent) copy in the repo already does this: it searches this course's real lesson files and analyzes its real datasets with pandas, instead of guessing.
- Look at `deepagents`' support for **sub-agents** — delegating part of a task to a separately-instructed agent, similar to how a manager might delegate a sub-task to a specialist:

```python
from deepagents import create_deep_agent

research_subagent = {
    "name": "topic-researcher",
    "description": "Looks up whether a topic was covered in the course, in detail.",
    "system_prompt": "You research course topics thoroughly using the available tools.",
    "tools": [search_course_topics],
}

agent = create_deep_agent(
    model=model,
    tools=[search_course_topics, count_weeks_remaining],
    subagents=[research_subagent],
    system_prompt="Delegate topic-research questions to the topic-researcher sub-agent.",
)
```

The main agent can now hand off a sub-task to `topic-researcher` instead of doing everything itself — useful once a single agent's instructions and tool list start growing too large to reason about in one place.
- Revisit the bonus `try`/`except` and `class` content from Python 101 — real agent code leans on both constantly (catching a failed tool call, wrapping related state in a class) in ways this course's core curriculum deliberately avoided.

## Share your agent with the class

Built something you're proud of? [`examples/student-agents/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-agents) is a gallery of agents other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓

<CapstoneProgressCheckbox capstoneId="2026-ai-agent" />
