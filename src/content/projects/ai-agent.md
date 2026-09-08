---
title: "Build an AI Agent"
description: "Graduate from the in-browser playground to real Python: install Python locally and build your first AI agent with LangChain's deepagents."
---

# 🤖 Build an AI Agent

Everything in the course so far ran in a sandboxed, in-browser playground — so you could start writing Python on day one with zero setup. This project is the graduation step: install Python for real on your own machine, then use it to build something the playground could never run — an AI agent with its own API key, calling out to a real language model.

This is optional and ungraded — a good fit once you've finished Python 101 (data-handling basics from Data Analysis are a bonus, not a requirement). See [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Install `uv`, a fast, modern tool for managing Python itself and your project's dependencies — no separate Python installer needed.
2. Get a free-tier AI API key. **You're free to use whichever provider you like** — GitHub Models is the suggested default below since it needs no separate signup (you already have a GitHub account), but Gemini, Groq, Mistral, Cerebras, and OpenRouter all have workable free tiers too.
3. Set up a small project and install LangChain's `deepagents`.
4. Write one small agent with two toy tools, run it locally, and see it pick the right tool for each question.
5. Add error handling for rate limits and an interactive chat loop so you can ask questions repeatedly without restarting the script.

## Where to run this

**Locally with `uv`** is the path this lesson's steps follow, and the recommended one — it's real Python running on your own machine, the same "graduate to real Python" move as every other project in this section. The Setup section below walks through installing it.

**GitHub Codespaces** is a zero-setup alternative if you'd rather not install anything locally yet: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed, per the repo's `.devcontainer/devcontainer.json`) and run the exact same `uv` commands from a terminal in your browser tab.

**Google Colab, Kaggle Notebooks, or Binder** also work, since this project needs no GPU — a real, runnable notebook version of this project's agent (the same toy tools and `create_deep_agent` setup as Step 1 below) lives at [`examples/ai-agent/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-agent/notebook.ipynb). Click a badge to launch it directly, no local install at all:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-agent/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-agent/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fai-agent%2Fnotebook.ipynb)

Be honest with yourself about the tradeoff, though: this is a lower-fidelity way to experience the project than a real local `uv` project — no separate files, no real project structure, just cells in a notebook. Treat it as a quick way to experiment, not the primary path.

## Setup

Everything you need before writing a line of the agent itself: a real Python, a free API key, and a small project to hold both.

### Install `uv`

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

### Get a free AI API key

**Pick whichever provider you like** — none of them require a credit card at the time of writing, and this course doesn't favor one over another. The example agent in the course repo ([`examples/ai-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-agent)) supports all six out of the box, selected with one setting.

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
Instead of `export`-ing a key in every new terminal session, you can put it in a `.env` file in your project folder (see the repo example's `.env.example`) and load it automatically with the `python-dotenv` package — covered below.
:::

### Set up the project with `uv`

```bash
uv init ai-agent
cd ai-agent
uv add deepagents langchain-openai python-dotenv
```

`uv init` creates a small project (a `pyproject.toml` tracking your dependencies) and `uv add` installs packages into an isolated environment for that project — automatically, with no manual virtual-environment setup. `deepagents` is LangChain's framework for building agents with planning, tool use, and sub-agent delegation built in; `langchain-openai` is the integration package this example uses to talk to GitHub Models (its API is OpenAI-compatible, so the OpenAI integration package works for it — see the tip below if you picked a different provider); `python-dotenv` lets you keep your API key in a local `.env` file instead of `export`-ing it every session.

If you picked a different provider above, swap `langchain-openai` for that provider's own package — `langchain-google-genai` (Gemini), `langchain-groq` (Groq), or `langchain-mistralai` (Mistral). Cerebras and OpenRouter are also OpenAI-compatible, so they use `langchain-openai` too, just with a different `base_url`.

:::tip[Check the current docs — and the model name]
Agent frameworks move fast, and so do model names: they get renamed and retired on a timescale of months, not years. `create_deep_agent`'s own keyword arguments have already changed once since earlier drafts of this page (it's `system_prompt`, not `instructions`) — a reminder that this snippet can drift out of date even after being checked once. Use an explicit, versioned model ID rather than a `-latest` alias: several providers, including Google, have deprecated those because they silently hot-swap to a new model version, which can break working code with no warning. Before running this, check your provider's current pricing/model page, and skim `deepagents`' own README for its current API.
:::

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `ai-agent/` exists with a `pyproject.toml`, and `deepagents`, `langchain-openai`, and `python-dotenv` are installed.
- ✅ You have a real API key from one provider, exported as an environment variable or saved in a `.env` file in your project folder — not pasted into any script.

## Step 1: Write your first agent

This is the core step: two plain Python functions that become the agent's tools, a model wired to your API key, and `create_deep_agent` binding them together. The docstrings on each function are what the model reads to decide which tool fits a question — not the code inside them.

### 1.1 Write `agent.py`

Create a `.env` file (never commit this) with the key for whichever provider you picked:

```bash
# .env
GITHUB_TOKEN=your-key-here
```

Now create `agent.py`:

**👟 Starter hint:** Two plain Python functions with type hints and docstrings become the agent's tools; `create_deep_agent(model=..., tools=[...], system_prompt=...)` wires them to the model — the docstrings are what the model reads to decide which tool fits a question, not the code inside them:

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

**🎯 Expected output:** `uv run python agent.py` prints a single line — the agent's final answer, something like `Yes, "groupby" was covered in the course.`

**🩹 If it's off:** A `KeyError: 'GITHUB_TOKEN'` means the environment variable/`.env` value isn't being found — confirm `.env` is in the same folder as `agent.py`, with no typo in the variable name. A `401`/`403` means the key itself is wrong, expired, or missing the right scope — regenerate it. A `429` rate-limit error is expected and covered in Step 3, not a bug.

### 1.2 Understand what `load_dotenv` and `create_deep_agent` do

`load_dotenv()` reads your `.env` file into `os.environ` before anything else runs, so `os.environ["GITHUB_TOKEN"]` finds the key you set during Setup — the same `os` module concept as `input()` reading from the keyboard, just reading from a file instead. `create_deep_agent` wires the model together with a list of Python functions the agent can call as **tools** — this is the core idea behind agents: a language model that can not just respond with text, but decide to call your code, read the result, and use it to inform its answer.

Notice `tools=[search_course_topics, count_weeks_remaining]` — two tools, not one. The model picks *which* tool (if any) fits the question, entirely on its own: ask "Did we cover groupby?" and it calls `search_course_topics`; ask "How many weeks are left if I'm on week 4?" and it calls `count_weeks_remaining` instead. You never write an `if`/`elif` chain routing questions to tools yourself — the docstring on each function (the triple-quoted string right after `def`) is what the model reads to decide which tool matches which request, exactly like Python 101 Week 4's docstrings, except here a language model is the one reading them, not a human skimming your code.

### 1.3 Verify the agent

**✅ Checklist**

- ✅ `uv run python agent.py` prints a single, coherent answer — not a stack trace or an empty string.
- ✅ The answer references the tool's data (mentions "groupby" being a course topic), not a generic response.
- ✅ You can explain, in your own words, why `tools=[search_course_topics, count_weeks_remaining]` passes two functions and the model picks one on its own.

**🤔 Socratic Question(s)**

- If you added a third tool `def get_weather(city: str) -> str: ...` and asked "Did we cover groupby?", would the model call it? Why or why not — what prevents the model from calling tools that don't match the question?
- The docstring on `search_course_topics` says "pretends to look up." A real agent would search a database or file system instead. What would change in the `create_deep_agent` call if the function's implementation changed — would the agent's behavior change, or just the tool's internal logic?

## Step 2: Understand how the agent loop works

Nothing here is magic — `create_deep_agent` builds a loop, and every iteration of that loop is one ordinary API call to the model you configured. Understanding this loop is what separates "I ran code someone wrote" from "I can build and debug agents myself."

### 2.1 The five-step loop

Every agent interaction follows the same pattern:

1. Your question goes to the model, along with the *list* of available tools (their names, parameters, and docstrings — not their code).
2. The model replies with either a final text answer, **or** a request to call one specific tool with specific arguments.
3. If it requested a tool call, your own Python code (not the model) actually runs that function and gets a real result.
4. That result goes back to the model as new context, and the loop repeats from step 2 — the model might call another tool, or now have enough information to answer.
5. Once the model replies with text and no further tool request, the loop stops and that's your final answer.

This is exactly why a rate-limit error (see Step 3) can happen even for what feels like "one question" — a question needing two tool calls costs at least three round trips to the model (decide to call tool A, decide to call tool B, produce the final answer), not one.

### 2.2 Inspect the full internal trace

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

### 2.3 Verify the loop understanding

**✅ Checklist**

- ✅ You can trace the 4-row shape (HumanMessage → AIMessage → ToolMessage → AIMessage) in your own run's output.
- ✅ You can explain why a question that requires two tool calls produces at least 3 API round trips, not 1.
- ✅ You can point to which row in the trace is the *actual* tool result (from your Python code), not the model's prediction.

**🤔 Socratic Question(s)**

- The model sees tool names and docstrings, not source code. What would happen if two tools had the same docstring — would the model pick one at random, or could it still distinguish them? How does that affect how you write tool docstrings in real projects?
- Row 2 in the trace has no text — it's just a tool request. If you only printed `message.content` for each message, what would you see for that row, and why does that make `message.content` alone an incomplete view of what happened?

## Step 3: Handle rate limits with retries

Every free tier here caps how many requests you can make per minute or per day, and each turn of the agent — deciding to call a tool, then reading the result — uses at least one request. Run a few questions back to back and you'll likely hit the limit. This step builds proper retry handling so your agent doesn't crash when it does.

### 3.1 Write the retry wrapper

**👟 Starter hint:** Wrap the `agent.invoke(...)` call in a `try`/`except` that catches the error, waits, and retries automatically — exactly the pattern from Python 101 Week 4:

```python
import time

def ask_with_retry(agent, question: str, max_retries: int = 3) -> str:
    """Ask the agent a question, retrying automatically on rate-limit errors."""
    for attempt in range(max_retries):
        try:
            result = agent.invoke({"messages": [{"role": "user", "content": question}]})
            return result["messages"][-1].content
        except Exception as e:
            error_str = str(e)
            if "RESOURCE_EXHAUSTED" in error_str or "429" in error_str:
                wait = 30 * (attempt + 1)
                print(f"  Rate limited — waiting {wait}s before retry {attempt + 1}/{max_retries}...")
                time.sleep(wait)
            else:
                raise
    raise RuntimeError(f"Failed after {max_retries} retries due to rate limits.")

answer = ask_with_retry(agent, "Did we cover groupby?")
print(answer)
```

**🎯 Expected output:** The same answer as Step 1, but if you hit a rate limit, the function prints a "Rate limited — waiting 30s..." message and retries silently.

**🩹 If it's off:** If you see the retry message but the final answer is still a rate-limit error, `max_retries` isn't high enough or the wait time is too short — try increasing both. If non-rate-limit errors are being swallowed, the `if "RESOURCE_EXHAUSTED"` check isn't catching the right string — print `error_str` to see the exact error message your provider returns.

### 3.2 Verify the retry handler

**✅ Checklist**

- ✅ `ask_with_retry(agent, "Did we cover groupby?")` returns the same answer as the raw `agent.invoke` call.
- ✅ A rate-limit error triggers a retry (you see the "Rate limited" message), not an immediate crash.
- ✅ After `max_retries` consecutive rate-limit errors, the function raises `RuntimeError`, not silently returning `None`.

**🤔 Socratic Question(s)**

- The retry waits `30 * (attempt + 1)` seconds — 30s, 60s, 90s. Where does this number come from, and what would happen if you used a fixed 5-second wait instead on a provider that suggests waiting 60 seconds?
- What would happen if you retried on *every* exception, not just rate-limit errors? Give one concrete scenario where retrying immediately would make a problem worse.

## Step 4: Build an interactive chat loop

A one-shot question is a demo. An interactive loop — where you type questions and the agent answers, one after another, until you decide to quit — is a tool you'd actually use. This step wires the retry handler into a REPL that runs in your terminal.

### 4.1 Write the chat loop

**👟 Starter hint:** `while True` is the standard REPL pattern — prompt, read, process, print, repeat. The `input()` check for quit is the exit condition:

```python
def chat(agent):
    """Interactive REPL: type questions, get answers, type 'quit' to exit."""
    print("Agent chat — type 'quit' to exit.\n")
    while True:
        try:
            question = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye!")
            break
        if not question:
            continue
        if question.lower() in {"quit", "exit", "q"}:
            print("Goodbye!")
            break
        answer = ask_with_retry(agent, question)
        print(f"Agent: {answer}\n")

if __name__ == "__main__":
    chat(agent)
```

**🎯 Expected output:** The script prints "Agent chat — type 'quit' to exit." and waits for input. Each question produces an answer from the agent, and typing `quit` exits cleanly.

**🩹 If it's off:** If `input()` immediately raises `EOFError` (happens in some notebook environments), you're not in a real terminal — use `uv run python agent.py` from a terminal instead of running inside a notebook cell. If the script prints "Goodbye!" without prompting, the `input()` call was skipped — check that `chat(agent)` is inside the `if __name__ == "__main__":` block.

### 4.2 Verify the interactive loop

**✅ Checklist**

- ✅ `uv run python agent.py` enters an interactive loop and prompts "You: ".
- ✅ Typing a question prints an answer; typing `quit` or `exit` exits cleanly.
- ✅ `Ctrl+C` (KeyboardInterrupt) also exits the loop cleanly with "Goodbye!".

**🤔 Socratic Question(s)**

- The chat loop calls `ask_with_retry` on every question, which means rate-limit retries happen inside the loop. What happens if a user types a question, hits a rate limit, and the retry waits 30 seconds — the user is staring at a blank terminal. How would you improve the UX during the wait?
- This loop has no conversation memory — each question is independent. What would change in `agent.invoke({"messages": [...]})` if you wanted the agent to remember the last three questions and answers? How does `messages` as a list already support this?

## ⚠️ Common pitfalls

- **`KeyError: 'GITHUB_TOKEN'` at startup.** The `.env` file is in the wrong directory (it must be in the same folder as `agent.py`), or the environment variable wasn't exported in the current terminal session. Check with `echo $GITHUB_TOKEN` (macOS/Linux) or `echo $env:GITHUB_TOKEN` (PowerShell) — if it prints nothing, the key isn't loaded.
- **Rate-limit errors (`429 RESOURCE_EXHAUSTED`) on back-to-back questions.** This isn't a bug — it's the free tier's per-minute request cap. Each agent turn (decide tool call → read result → answer) costs 2–3 API calls, so you hit the limit faster than you'd expect. The retry handler in Step 3 handles this; waiting the suggested duration and re-running is also fine.
- **The model ignores your tools and answers from general knowledge.** If the model answers "I don't have access to course data" instead of calling a tool, the system prompt or tool docstrings aren't clear enough about what the tools do. Make the system prompt explicit: "Use the provided tools to answer questions. Do not answer from general knowledge."
- **`create_deep_agent` API changes between versions.** The `system_prompt` keyword argument was named `instructions` in earlier versions — if you see a `TypeError: unexpected keyword argument 'system_prompt'`, check `deepagents`' current README and update to match. Agent frameworks evolve fast; pin your dependencies in `pyproject.toml` if you want reproducibility.

## What you just built

A working AI agent with its own API key, two callable tools, a retry handler for rate limits, and an interactive chat loop — running locally on your machine with real Python, not inside a browser sandbox. The tools are deliberately trivial, but the shape is the same one powering far more capable systems: a model that reasons about a task, decides which tool to call and with what arguments, reads the tool's output, and continues — sometimes calling several tools in sequence before responding. You just built the smallest possible version of that loop, from scratch.

:::tip[Run a fuller version without any local setup]
[`examples/ai-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-agent) in the course repo is **not a copy of the code above** — it's a deliberately fuller version, with real tools (it searches this course's actual lesson files and analyzes its actual datasets with pandas, instead of a hardcoded topic list) and support for all six providers from the table above, selected with one setting. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` already installed) and run it from there.
:::

## Where to go from here

- Give your agent a genuinely *useful* tool, not just a toy one — one that reads a real local file, or calls a real public API. The [`examples/ai-agent/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-agent) copy in the repo already does this: it searches this course's real lesson files and analyzes its real datasets with pandas, instead of guessing.
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

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of agents other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓
