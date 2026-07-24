---
id: multi-agent-research
title: "Build a Multi-Agent Research Assistant"
sidebar_label: "Build a Multi-Agent Research Assistant"
slug: /projects/multi-agent-research
description: "Graduate from the in-browser playground to real Python: build a small multi-agent system — a planner, a researcher, and a writer — that breaks down a research question and synthesizes a real report, using LangChain's deepagents sub-agents and a free-tier LLM."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Build a Multi-Agent Research Assistant

<ProjectPublishedDate projectId="multi-agent-research" />

<ProjectGreeting />

A single agent with a pile of tools and one long system prompt works fine for small tasks, but it starts to strain once a task has genuinely different *phases* that call for different instructions — planning what to look into, actually looking into each piece, then writing it all up. This project splits that work across three small, narrowly-instructed agents instead of one big one: a **planner** that breaks a research question into a handful of sub-questions, a **researcher** that answers each sub-question on its own, and a **writer** that synthesizes everything into one final report — coordinated with LangChain's `deepagents` sub-agent feature.

This assumes Python 101, and it builds directly on the [AI Agent project](/docs/projects/ai-agent) — same `deepagents` library, same free-tier API setup, same idea of a model deciding what to call and when, just applied to delegating whole sub-tasks instead of calling individual tools. Doing that project first isn't strictly required, but it's a much smoother on-ramp than starting here cold.

This is optional and ungraded. See [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Install `uv`, a fast, modern tool for managing Python itself and your project's dependencies.
2. Get a free-tier AI API key — the same six-provider choice as the AI Agent project.
3. Set up a small project and install `deepagents`.
4. Define three sub-agents — planner, researcher, writer — each with its own narrow system prompt.
5. Wire them together into one top-level agent and run it on a real research question, end to end.

## Where to run this

**Locally with `uv`** is the path this lesson's steps follow, and the recommended one — real Python running on your own machine, the same "graduate to real Python" move as every other project in this series. The Setup section below walks through installing it.

**GitHub Codespaces** is a zero-setup alternative if you'd rather not install anything locally yet: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed, per the repo's `.devcontainer/devcontainer.json`) and run the exact same `uv` commands from a terminal in your browser tab.

**Google Colab or Kaggle Notebooks** work fine too, since nothing here needs a GPU — every step is just an API call to a free-tier LLM. Run `!pip install deepagents langchain-openai python-dotenv` (swap the provider package if you picked a different one) in a cell, then paste the scripts below in as notebook cells. It's a lower-fidelity way to experience the project than a real local `uv` project, but perfectly workable for trying the idea out quickly.

## Setup

Everything below gets your environment fully ready before any building starts: installing `uv`, getting a free API key, setting up the project, and configuring your `.env` file.

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

### Get a free AI API key

**Pick whichever provider you like** — none of them require a credit card at the time of writing, and this course doesn't favor one over another. The example agent in the course repo ([`examples/multi-agent-research/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/multi-agent-research)) supports all six out of the box, selected with one setting, the same pattern as the AI Agent project.

| Provider | Where to get a key | Why you might pick it |
|---|---|---|
| **GitHub Models** *(suggested default)* | [github.com/settings/tokens](https://github.com/settings/tokens) — a personal access token with the `models: read` scope | No separate signup — you already have a GitHub account. More generous free-tier limits than Gemini's. |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | The most commonly referenced option. |
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

:::tip[A .env file is often more convenient than export]
Instead of `export`-ing a key in every new terminal session, you can put it in a `.env` file in your project folder (see the repo example's `.env.example`) and load it automatically with the `python-dotenv` package — covered next.
:::

### Set up the project with `uv`

```bash
uv init multi-agent-research
cd multi-agent-research
uv add deepagents langchain-openai python-dotenv
```

`deepagents` is the same LangChain framework used in the AI Agent project, and it's what makes this whole project small: alongside tool use, it has a built-in **sub-agent** feature — a way to hand off part of a task to a separately-instructed agent, rather than hand-rolling your own loop that calls the model three times with three different prompts and stitches the results together yourself. `langchain-openai` talks to GitHub Models (its API is OpenAI-compatible); swap it for `langchain-google-genai`, `langchain-groq`, or `langchain-mistralai` if you picked a different provider above — Cerebras and OpenRouter are also OpenAI-compatible, so `langchain-openai` covers them too, just with a different `base_url`, exactly as in the AI Agent project.

Create a `.env` file (never commit this) with the key for whichever provider you picked:

```bash
# .env
GITHUB_TOKEN=your-key-here
```

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv add deepagents langchain-openai python-dotenv` completed with no errors.</StepChecklistItem>
<StepChecklistItem>A `.env` file exists in the project folder with a real key, and it is not tracked by git (`uv init` gives you a `.gitignore` — confirm `.env` is in it).</StepChecklistItem>
</StepChecklist>

## Step 1: Define the planner, researcher, and writer sub-agents

Each sub-agent in `deepagents` is just a plain dict: a `name`, a `description` (used by the top-level agent to decide when to delegate to it), a `system_prompt` (its own narrow instructions), and optionally its own `tools`. Create `agent.py`:

```python
import os

from deepagents import create_deep_agent
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv()

model = ChatOpenAI(
    model="gpt-4o-mini",  # confirm this still has a free tier before running
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
)

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
```

:::tip[Be honest about what "research" means here]
The researcher sub-agent above answers from the model's own training knowledge — there is no real web search tool wired in. That is a deliberate simplification, not a hidden shortcut: it keeps this project small and free-tier friendly, but it means answers can be stale or wrong on anything the model wasn't trained on well, with no way to verify against a live source. See "Where to go from here" for how to plug in a real search tool once you're comfortable with this version.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`agent.py` defines `planner_subagent`, `researcher_subagent`, and `writer_subagent`, each with a distinct `system_prompt`.</StepChecklistItem>
<StepChecklistItem>Each `system_prompt` says clearly what that one role does and does *not* do — e.g. the planner's prompt says not to answer the sub-questions it generates.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- The planner's system prompt explicitly forbids it from answering its own sub-questions. What do you think would happen to the rest of the pipeline if it ignored that instruction and answered them anyway?
- Why might it matter that each sub-agent's `description` is written for the *top-level agent* to read, not for a human? What would a vague description (`"does research stuff"`) cost you here?

## Step 2: Wire the sub-agents together and run it

The top-level agent doesn't do any research itself — its whole job is delegation, in order: plan, then research each sub-question, then write. Add this to the bottom of `agent.py`:

```python
agent = create_deep_agent(
    model=model,
    subagents=[planner_subagent, researcher_subagent, writer_subagent],
    system_prompt=(
        "You coordinate a research task using your sub-agents, strictly in this order: "
        "1) delegate to the 'planner' sub-agent to get a numbered list of sub-questions. "
        "2) delegate each sub-question, one at a time, to the 'researcher' sub-agent. "
        "3) delegate to the 'writer' sub-agent, giving it the original question plus every "
        "sub-question/answer pair, and have it produce the final report. "
        "Return ONLY the writer's final report as your answer -- no intermediate steps."
    ),
)

if __name__ == "__main__":
    question = "What makes a programming language good for beginners to learn first?"
    result = agent.invoke({"messages": [{"role": "user", "content": question}]})
    print(result["messages"][-1].content)
```

Run it:

```bash
uv run python agent.py
```

`subagents=[...]` is the whole mechanism: the top-level agent sees each sub-agent's `name` and `description` the same way it would see a tool's name and docstring, and decides when to hand off to which one, based on the top-level `system_prompt`'s instructions and the state of the conversation so far. This is the identical idea taught in the AI Agent project's "Where to go from here" section, just used for the entire pipeline here instead of for one extra specialist alongside a general-purpose agent.

### What you should see

A single printed block of text — the writer's final synthesized report, a few paragraphs covering the sub-questions the planner came up with. If you print the full `result["messages"]` list instead (the same pattern as the AI Agent project), you'll see the whole trace: the planner's numbered list, each researcher call and its answer, then the writer's final pass — all as real messages passed between the top-level agent and each sub-agent.

If instead you see a traceback, check which kind — the same three categories as the AI Agent project: a missing/wrong environment variable (`KeyError`), a bad key (401/403), or a rate limit (429, see the pitfall below).

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run python agent.py` prints a final report, not a traceback.</StepChecklistItem>
<StepChecklistItem>The report actually reads like a synthesis of several sub-questions, not a single shallow paragraph.</StepChecklistItem>
<StepChecklistItem>Printing the full `result["messages"]` list shows all three roles actually being invoked — planner, researcher (multiple times), then writer.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Try a much narrower research question (something with basically one obvious sub-question) and a much broader one (something that could split into ten sub-questions). How does the planner's behavior change, and does the final report's quality track with how well the question actually decomposes?
- The top-level `system_prompt` says "return ONLY the writer's final report." What would you expect to see in the output if you removed that instruction?

:::tip[Check the current docs before relying on this]
`deepagents`' sub-agent API is newer and less battle-tested than its plain tool-calling API, and both have already changed shape once since earlier drafts of the AI Agent project. Before building on this beyond the lesson, skim `deepagents`' own README for its current `subagents=[...]` shape, the same advice given in the AI Agent project for `create_deep_agent`'s other keyword arguments.
:::

## ⚠️ Common pitfalls

- **Role bleed.** If a sub-agent's `system_prompt` isn't narrow enough, it starts doing another role's job — a planner that also answers its own questions, or a writer that invents new sub-questions instead of synthesizing the ones it was given. If output looks off, the fix is almost always to tighten the offending sub-agent's prompt, not to add more instructions to the top-level one.
- **Rate limits multiply fast.** One research question here costs at least one planner call, one researcher call *per sub-question* (typically 3-5), and one writer call — six to eight round trips minimum, versus the single-digit calls a simple tool-calling agent makes. Expect to hit a 429 sooner than you did in the AI Agent project; the same retry-with-delay pattern from that project's `ask()` function applies here unchanged.
- **The researcher hallucinating with confidence.** With no real search tool, the researcher sub-agent can produce a fluent, wrong-sounding-right answer on anything obscure or recent. Its system prompt asks it to flag low confidence explicitly, but a language model following that instruction perfectly every time isn't guaranteed — spot-check answers on questions where you already know the answer.
- **The writer losing sub-question answers instead of citing them.** If the top-level `system_prompt` doesn't clearly tell the top-level agent to pass *every* sub-question/answer pair to the writer, it may summarize only some of them, or invent connections between answers it never actually saw. Print the full trace (Step 2) to confirm the writer actually received everything the researcher produced.

## What you just built

A small pipeline where three narrowly-instructed agents, each with a system prompt scoped to exactly one job, produce a result none of them could produce well alone — a planner good at decomposing, not answering; a researcher good at answering one focused question, not managing a whole report; a writer good at synthesizing, not researching. This is the same idea behind larger multi-agent systems in production: not one enormous prompt trying to do everything, but several small ones, each easy to reason about and debug on its own, coordinated by a top-level agent that only decides *who* goes next.

## Where to go from here

- **Give the researcher a real search tool.** The biggest honesty gap in this version is that "research" here means "the model's own training knowledge," not an actual web search. Several providers have free-tier search APIs (Tavily and DuckDuckGo's unofficial API are common starting points) — wire one in as a tool on `researcher_subagent["tools"]`, the same `tools=[...]` pattern from the AI Agent project, and the researcher can now cite real, current sources instead of recalling from training data.
- **Add a fourth role**, like a critic sub-agent that reviews the writer's report against the original sub-questions and flags gaps before the final output — a common pattern once a pipeline has more than a couple of stages.
- **Stream intermediate output** instead of only printing the final report, so you can watch the planner's sub-questions and each researcher answer arrive in real time rather than waiting for the whole pipeline to finish silently.
- Revisit the AI Agent project's section on the full internal trace (`result["messages"]`) — the same technique for turning a noisy raw result into a readable step-by-step account applies here, just with three roles' messages interleaved instead of one.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓

<ProjectProgressCheckbox projectId="multi-agent-research" />
