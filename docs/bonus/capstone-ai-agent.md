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

:::tip A .env file is often more convenient than export
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

:::tip Check the current docs — and the model name
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

model = ChatOpenAI(
    model="gpt-4o-mini",  # confirm this still has a free tier before running — see the tip above
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)

agent = create_deep_agent(
    model=model,
    tools=[search_course_topics],
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

### What you should see

A single printed line — the agent's final answer, something like:

```
Yes, "groupby" was covered in the course.
```

If instead you see a Python traceback, check which kind:

- **`KeyError: 'GITHUB_TOKEN'`** — the environment variable/`.env` value isn't being found. Confirm `.env` is in the same folder as `agent.py` and has no typo in the variable name, or that you actually ran `export` in the same terminal session you're running the script from.
- **An authentication error (401/403)** — the key itself is wrong, expired, or (for GitHub Models) missing the `models: read` scope. Regenerate it.
- **A rate-limit error (429)** — see the next section. This one is common and expected, not a sign anything is broken.

### Handling rate limits

Every free tier here caps how many requests you can make per minute or per day, and each turn of the agent — deciding to call a tool, then reading the result — uses at least one request. Run a few questions back to back and you may well see something like:

```
Error calling model ... (RESOURCE_EXHAUSTED): 429 RESOURCE_EXHAUSTED.
...Please retry in 41.7s.
```

This isn't a bug in your code — it's the provider telling you to slow down. Two ways to handle it:

1. **Simplest**: just wait the suggested number of seconds and run the script again.
2. **More robust**: wrap the `agent.invoke(...)` call in a `try`/`except` that catches the error, waits, and retries automatically — exactly the pattern taught as bonus content back in Python 101 Week 4. The repo's fuller example does this for real: see `ask()` in [`examples/capstone-agent/agent.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/capstone-agent/agent.py) for a working version you can copy, including parsing the provider's suggested retry delay out of the error message.

:::tip Using a different provider?
Swap the `ChatOpenAI(...)` block for your provider's own client — e.g. `ChatGoogleGenerativeAI(model="gemini-3.5-flash", google_api_key=os.environ["GOOGLE_API_KEY"])` for Gemini, or `ChatGroq(model="llama-3.3-70b-versatile", api_key=os.environ["GROQ_API_KEY"])` for Groq. Everything else in this file stays the same — `deepagents` doesn't care which provider is behind the model. See [`examples/capstone-agent/agent.py`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/capstone-agent) in the course repo for all six wired up side by side, selectable with one environment variable.
:::

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
