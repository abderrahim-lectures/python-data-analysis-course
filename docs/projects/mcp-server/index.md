---
id: mcp-server
title: "Build an MCP Server"
sidebar_label: "Build an MCP Server"
slug: /projects/mcp-server
description: "Graduate from the in-browser playground to real Python: build a Model Context Protocol server exposing your own tools, and connect it to a real AI client like Claude Desktop."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Build an MCP Server

<ProjectPublishedDate projectId="mcp-server" />

<ProjectGreeting />

The [Model Context Protocol](https://modelcontextprotocol.io) (MCP) is a standard way for an AI assistant to call code, tools, and data that live outside of it. An MCP *server* is a small program you write that exposes a handful of tools; an MCP *client* — Claude Desktop, for instance — connects to that server and lets the model call those tools on your behalf, the same way a web browser is a client that talks to a web server. This project builds the server side: your own Python functions, registered as MCP tools, callable by a real AI assistant running on your own machine.

This assumes Python 101 and comfort writing plain functions — nothing from Data Analysis is required. It's optional and ungraded; see [Real-World Projects](/docs/projects) for the full, growing list. It pairs naturally with the [AI Agent project](/docs/projects/ai-agent) — same underlying idea, giving an AI tools it can call, approached from the opposite side: there you built the agent that calls tools directly, in the same Python process; here you build a standalone server that *any* MCP-compatible client can plug into, without that client needing to know anything about your code beyond the protocol.

MCP is one of the more actively adopted patterns for extending AI assistants right now — worth having built once, even a minimal version, while it's still this current.

## 🎯 What you'll do

1. Install `uv` and set up a small project with the official MCP Python SDK.
2. Write an MCP server exposing two of your own tools, using the SDK's `FastMCP` API.
3. Run your server locally and test its tools by hand with the MCP Inspector, before connecting any real AI client.
4. Register your server with Claude Desktop's free tier and watch it actually call your code.

## Where to run this

**Locally with `uv`** is the primary, recommended path for this one, more so than most other projects in this series — the whole point is connecting your server to Claude Desktop, and Claude Desktop is an app installed on your own machine. There's no way around doing at least the last step locally.

**GitHub Codespaces** is a reasonable place to write and test the *tool logic itself*: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed, per the repo's `.devcontainer/devcontainer.json`), write `server.py`, and call your tool functions directly in a Python shell, or even run `mcp dev server.py` and use the Inspector through the Codespace's forwarded port. What a Codespace *can't* be is your final Claude Desktop connection point — Claude Desktop runs on your own desktop and needs to launch a local process it can talk to directly; reaching into a Codespace from it would need extra tunneling that's out of scope for this project. Treat Codespaces as good for Steps 1–2, and do Step 3 locally.

**Google Colab and Kaggle are not a good fit for this project**, unlike most others in this series — skip them here. Neither gives you a persistent local process a desktop AI client can connect to; a notebook cell that "runs a server" in Colab isn't reachable by Claude Desktop on your own machine at all.

## Setup

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

Then set up a project and install the official Python MCP SDK, with its optional `cli` extra (this is what gives you the `mcp dev` command used in Step 2):

```bash
uv init mcp-server
cd mcp-server
uv add "mcp[cli]"
```

## Step 1: Write your first MCP server

The SDK's high-level API, `FastMCP`, turns an ordinary Python function into an MCP tool with one decorator — no protocol-level code to write by hand. Create `server.py`:

```python
# server.py
from pathlib import Path

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("course-tools")  # the name your AI client will show for this server

DOCS_DIR = Path.home() / "path" / "to" / "python-data-analysis-course" / "docs"  # adjust this


@mcp.tool()
def search_course_topics(query: str) -> str:
    """Search this course's lesson files for a topic and report which pages mention it.

    Looks through every .md file under docs/ for `query` (case-insensitive) and
    returns each matching file's name plus one line of context. Call this when
    someone asks whether, or where, a topic is covered in the course.
    """
    query_lower = query.lower()
    matches = []
    for path in sorted(DOCS_DIR.rglob("*.md")):
        for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
            if query_lower in line.lower():
                matches.append(f"{path.name}: \"{line.strip()[:120]}\"")
                break
        if len(matches) >= 5:
            break
    return "Found in:\n" + "\n".join(matches) if matches else f"No lesson pages mention '{query}'."


@mcp.tool()
def count_words(text: str) -> int:
    """Count the words in a piece of text, splitting on whitespace."""
    return len(text.split())


if __name__ == "__main__":
    mcp.run()
```

`@mcp.tool()` is doing all the registration work here: it inspects the function's name, its type-hinted parameters, and its docstring, and builds an MCP tool definition from them automatically — you never hand-write a schema. This is the same idea the [AI Agent project](/docs/projects/ai-agent) teaches for LangChain tools: **the model reads your docstring, not your code, to decide when a tool matches a request.** A vague docstring gives the model nothing to go on; a docstring that says plainly what the tool does and when to call it is what actually makes tool selection work.

`search_course_topics` is deliberately the same idea as the toy tool from the AI Agent project — searching this course's own files for a topic — but exposed through MCP's tool decorator instead of passed straight into an agent's `tools=[...]` list. `count_words` is a smaller, standalone utility, included to show a server exposing more than one tool at once — an MCP client sees both and picks whichever one fits a given question.

:::tip[Check the MCP SDK's current docs before relying on this]
MCP is a young, fast-moving spec — the protocol itself, and the Python SDK's own API, have both changed since early releases. `FastMCP`'s decorator-based style has been stable for a while, but before building anything beyond this lesson, skim the [SDK's own README and docs](https://github.com/modelcontextprotocol/python-sdk) rather than assuming this snippet's specifics still match exactly.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`server.py` saves without syntax errors and defines both `search_course_topics` and `count_words`.</StepChecklistItem>
<StepChecklistItem>Each tool has a real, plain-English docstring — not a placeholder.</StepChecklistItem>
<StepChecklistItem>`DOCS_DIR` points at a real `docs/` folder that actually exists on your machine.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- What would happen if two of your tools had very similar docstrings? How might a model choose between them, and what does that suggest about writing docstrings for a server with many tools?
- `search_course_topics` returns a string, not structured data. What would you lose, or gain, by returning a list of matches instead?

## Step 2: Run and test your server locally

Before wiring this up to any real AI client, run it on its own and confirm the tools actually work. The SDK ships a **dev/inspector** command for exactly this:

```bash
uv run mcp dev server.py
```

This starts your server and opens the **MCP Inspector** — a free, browser-based tool that lets you call `search_course_topics` and `count_words` by hand, pass in test arguments, and see the real return values, with no AI model involved at all. (The first run may prompt you to install a small `npx`-based proxy package the Inspector uses; accept it.)

Test both tools here before moving on: call `search_course_topics` with a query you know appears in `docs/` (e.g. `"groupby"`), and `count_words` with a short sentence. If either misbehaves, you're looking at a bug in your Python function — fix it here, where the only moving part is your own code, rather than debugging it later with Claude Desktop in the loop, where a wrong result could just as easily be a connection problem, a config typo, or the model picking the wrong tool.

You can also just run the server directly, without the Inspector, to confirm it starts cleanly:

```bash
uv run python server.py
```

It won't print anything on its own — an MCP server sits and waits for a client to connect over stdio. Silence here is expected, not a bug; `Ctrl+C` to stop it.

:::tip[Test with the Inspector before touching a real client]
It's tempting to skip straight to Claude Desktop. Resist that — the Inspector isolates your tool code from everything else that can go wrong in a real client connection (config paths, restarts, the model's own tool-picking). Get both tools working there first.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`uv run mcp dev server.py` starts without errors and opens the Inspector in your browser.</StepChecklistItem>
<StepChecklistItem>The Inspector lists both `search_course_topics` and `count_words`.</StepChecklistItem>
<StepChecklistItem>Calling each tool by hand in the Inspector returns a real, correct result — not an error.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- If `search_course_topics` returned an error instead of a result, how would you tell whether the bug is in your Python code or in the MCP connection itself? What does testing with the Inspector first buy you here?
- Why might it matter that the Inspector needs no AI model at all to test your tools?

## Step 3: Connect it to Claude Desktop

[Claude Desktop](https://claude.ai/download)'s free tier supports connecting to local MCP servers. It reads a JSON config file that tells it which servers to launch and how:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

If the file doesn't exist yet, create it. Add your server, using an **absolute** path to your project folder:

```json
{
  "mcpServers": {
    "course-tools": {
      "command": "uv",
      "args": ["run", "--directory", "/absolute/path/to/mcp-server", "python", "server.py"]
    }
  }
}
```

`command` and `args` describe exactly the process Claude Desktop will launch to talk to your server — the same `uv run` invocation you already tested in Step 2, just started by Claude Desktop instead of by you. Using `uv run` (rather than a bare `python`) matters here: Claude Desktop launches this command in its own environment, with no guarantee your project's virtual environment is already active, and `uv run` finds and uses the right one on its own.

**Fully quit and restart Claude Desktop** — a running instance doesn't re-read this file on its own. Once it restarts, your server should show up in its tool/connector list (usually behind a small icon near the message box). Ask it something that should trigger a tool call, e.g.:

> Does the Python course cover groupby? Use the course-tools search if you have it.

Claude Desktop should show it calling `search_course_topics` (often as a small collapsible "used a tool" block in the conversation, with the arguments and result visible if you expand it), then answer using the real result your function returned — not a guess from the model's training data.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`course-tools` (or your chosen server name) appears in Claude Desktop's tool/connector list after a full restart.</StepChecklistItem>
<StepChecklistItem>Asking a question that should trigger `search_course_topics` actually shows Claude calling it, not just answering from memory.</StepChecklistItem>
<StepChecklistItem>The result Claude shows using matches what you saw testing the same call in the Inspector.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Claude Desktop decides on its own whether to call your tool for a given message. What phrasing in your test question made that more or less likely, and why do you think that is?
- If you asked a question completely unrelated to the course, would you expect Claude to call `search_course_topics` anyway? What would that tell you about how the model is actually deciding when a tool is relevant?

## ⚠️ Common pitfalls

- **A relative or wrong path in the config file.** `claude_desktop_config.json` needs an absolute path to your project folder — a relative one has no consistent "current directory" to resolve against when Claude Desktop launches your server, and will just fail to start it.
- **Forgetting to fully restart Claude Desktop after editing the config.** Saving the JSON file alone does nothing — the app only reads it on startup, so closing and reopening a window isn't enough either; quit the app completely first.
- **A docstring too vague for the model to pick the right tool.** `"""Does stuff with text."""` gives the model nothing to match against a real question. Say plainly what the tool does and, ideally, when to call it — exactly like `search_course_topics`'s docstring above.
- **Running the server with plain `python server.py` instead of `uv run python server.py`.** Without `uv run`, the interpreter that starts may not be the one `uv add` installed `mcp` into, and you'll get a `ModuleNotFoundError` for `mcp` even though `uv add` clearly said it installed successfully.

## What you just built

Two small tools is a toy example, but the shape is real: a standalone process that exposes Python functions through a standard protocol, connectable to any MCP-compatible client without that client knowing anything about your code beyond the tool names, arguments, and docstrings. That's the actual point of MCP — the same server you just built would work unmodified with a different MCP client entirely, which isn't true of the tightly-coupled `tools=[...]` list from the AI Agent project.

## Where to go from here

- Give `search_course_topics` (or a new tool) access to something more genuinely useful than lesson text — a small local file, a real dataset, a script that runs a calculation you actually need.
- Read about MCP **resources** and **prompts** — this lesson only covers *tools*, but the protocol also defines ways to expose readable data (resources) and reusable prompt templates (prompts) to a client. The [SDK's own docs](https://github.com/modelcontextprotocol/python-sdk) cover both, with the same `FastMCP` decorator style.
- Since the spec is actively evolving, periodically re-check the [official MCP documentation](https://modelcontextprotocol.io) for anything that's changed since you built this — new transport options and client capabilities have been landing at a steady pace.

:::tip[Run a fuller version without any local setup — for the tool logic, at least]
[`examples/mcp-server/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/mcp-server) in the course repo is a slightly fuller version of the code above, with `search_course_topics` wired to the real `docs/` folder of the repo it's running in (no path to edit by hand). Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), to try both tools with `uv run mcp dev server.py` — remembering that the actual Claude Desktop connection still needs to happen locally, per "Where to run this" above.
:::

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓

<ProjectProgressCheckbox projectId="mcp-server" />
