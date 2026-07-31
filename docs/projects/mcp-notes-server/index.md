---
id: 2027-mcp-notes-server
title: "Build an MCP Server for Your Notes"
sidebar_label: "Build an MCP Server for Your Notes"
slug: /projects/mcp-notes-server
description: "Index a real folder of Markdown notes and expose it to Claude Desktop as searchable tools with the Model Context Protocol -- a genuinely useful personal-knowledge-base MCP server, not a toy."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Build an MCP Server for Your Notes

<ProjectPublishedDate projectId="2027-mcp-notes-server" />

<ProjectGreeting />

This assumes Python 101 and comfort writing plain functions -- and it helps a lot to have already built the [Build an MCP Server](/docs/projects/mcp-server) project first, since this one reuses the same `FastMCP` decorator pattern and only adds real content to search over instead of two toy tools. It's optional and ungraded; see [Real-World Projects](/docs/projects) for the full, growing list.

If you keep notes in Obsidian, Notion, or just a plain folder of Markdown files, this project turns that folder into something an AI assistant can actually search and read from directly -- not by pasting note contents into a chat window, but by giving Claude Desktop real tools: search your notes by keyword, pull up one note in full by title, or list what you've touched most recently. It's the same Model Context Protocol idea as the earlier MCP project, aimed at something you'll plausibly keep using afterward.

## 🎯 What you'll do

1. Install `uv` and set up a small project with the official MCP Python SDK.
2. Index a real folder of sample Markdown notes -- load them off disk, pull out titles and modification times.
3. Write search and lookup functions as plain Python, and test them before any MCP code is involved.
4. Wire those functions up as MCP tools with `FastMCP`, and connect the server to Claude Desktop.

## Where to run this

**Locally with `uv`** is the primary, recommended path here, more so than most projects in this series -- the whole point is connecting your server to Claude Desktop, and Claude Desktop is an app installed on your own machine that needs to launch a local process it can talk to directly. There's no way around doing at least the last step locally.

**GitHub Codespaces** is a reasonable place to write and test the indexing and search logic itself: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are already installed, per the repo's `.devcontainer/devcontainer.json`), write `server.py` and a folder of sample notes, and call your functions directly in a Python shell, or run `mcp dev server.py` and use the Inspector through the Codespace's forwarded port. What a Codespace *can't* be is your final Claude Desktop connection point -- reaching into a Codespace from a desktop app would need extra tunneling that's out of scope for this project. Treat Codespaces as good for Steps 1–3, and do Step 4 locally.

**Google Colab and Kaggle are not a good fit for the actual server**, same as the earlier MCP project -- skip them for the real thing. Neither gives you a persistent local process a desktop AI client can connect to; a notebook cell that "runs a server" in Colab isn't reachable by Claude Desktop on your own machine at all.

That said, if you just want to poke at the search and lookup functions as plain Python -- no MCP protocol, no server process, no Claude Desktop -- a narrower notebook exists for exactly that. It demos the underlying search/lookup functions in isolation, not the live MCP server:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/add-mcp-notes-server-project/examples/mcp-notes-server/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/add-mcp-notes-server-project/examples/mcp-notes-server/notebook.ipynb)

(will point at `main` once merged)

It calls the same tool logic directly as ordinary functions, with no decorator, no server, and no client connection -- useful for experimenting with the code, not a substitute for the actual project below.

## Setup

`uv` is a single tool that replaces the usual "install Python, then install pip, then install a virtual environment tool, then install packages" chain -- it can install and manage Python versions itself, alongside your project's dependencies.

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

Then set up a project and install the official Python MCP SDK, with its optional `cli` extra (this is what gives you the `mcp dev` command used later):

```bash
uv init mcp-notes-server
cd mcp-notes-server
uv add "mcp[cli]"
```

No API key needed anywhere in this project -- it's pure local search over files already on your disk, with no language model call involved in the indexing or search logic itself.

## Step 1: Index a folder of sample notes

Create a `notes/` folder next to where `server.py` will live, and drop a handful of real `.md` files into it -- a recipe, a couple of book notes, a project ideas list, whatever you actually have lying around. Each note just needs a `# Title` heading near the top; nothing else about its structure matters. If you don't have real notes handy yet, write 4–5 short ones now -- genuinely different topics, not four variations on the same thing, so search results later actually mean something.

Then write the loading code in `server.py`:

```python
# server.py
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

NOTES_DIR = Path.home() / "path" / "to" / "notes"  # adjust this to your real notes folder


@dataclass
class Note:
    path: Path
    title: str
    body: str
    modified: float


def _load_note(path: Path) -> Note:
    """Read one .md file off disk and pull its title from the first '# ' heading."""
    text = path.read_text(encoding="utf-8", errors="ignore")
    title = path.stem
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("# "):
            title = stripped[2:].strip()
            break
    return Note(path=path, title=title, body=text, modified=path.stat().st_mtime)


def _all_notes() -> list[Note]:
    """Load every .md file in NOTES_DIR fresh each call -- cheap at personal-notes
    scale, and it means edits on disk show up immediately, with no cache to invalidate."""
    if not NOTES_DIR.exists():
        return []
    return [_load_note(p) for p in sorted(NOTES_DIR.glob("*.md"))]
```

Nothing here is MCP-specific yet -- it's ordinary file I/O. That's deliberate: get the indexing right on its own, with a plain Python shell, before any protocol code enters the picture.

```bash
uv run python -c "from server import _all_notes; print([n.title for n in _all_notes()])"
```

You should see every note's title printed back. If the list is empty, `NOTES_DIR` is wrong before anything else is.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`notes/` contains at least 4 real, genuinely different `.md` notes, each with a `# Title` heading.</StepChecklistItem>
<StepChecklistItem>`_all_notes()` returns one `Note` per file, with the right title pulled from each heading.</StepChecklistItem>
<StepChecklistItem>`NOTES_DIR` points at a real folder that actually exists on your machine.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- `_all_notes()` reloads every file from disk on every call, with no caching. At what point -- hundreds of notes? thousands? -- would that stop being "cheap enough," and what would you change first?
- What happens right now if a note has no `# ` heading at all? Is that the behavior you want, or would you rather it fail loudly?

## Step 2: Build the search and lookup functions

With notes loading correctly, write the functions that actually answer questions about them -- still plain Python, still testable without any AI client in the loop:

```python
import time


def search_notes(query: str) -> str:
    """Search every note for a keyword and report which notes mention it."""
    query_lower = query.lower()
    matches = []
    for note in _all_notes():
        for line in note.body.splitlines():
            if query_lower in line.lower():
                matches.append(f'"{note.title}": {line.strip()[:160]}')
                break  # one hit per note is enough context
    if not matches:
        return f"No notes mention '{query}'."
    return "Found in:\n" + "\n".join(matches)


def get_note_by_title(title: str) -> str:
    """Return the full text of one note, matched by exact or partial title."""
    title_lower = title.lower()
    notes = _all_notes()

    exact = [n for n in notes if n.title.lower() == title_lower]
    if len(exact) == 1:
        return exact[0].body

    partial = [n for n in notes if title_lower in n.title.lower()]
    if len(partial) == 1:
        return partial[0].body
    if len(partial) > 1:
        titles = ", ".join(f'"{n.title}"' for n in partial)
        return f"Multiple notes match '{title}': {titles}. Be more specific."

    return f"No note titled '{title}' found."


def list_recent_notes(limit: int = 5) -> str:
    """List the most recently modified notes, newest first."""
    notes = sorted(_all_notes(), key=lambda n: n.modified, reverse=True)[:limit]
    if not notes:
        return "No notes found."

    now = time.time()
    lines = []
    for note in notes:
        age_days = (now - note.modified) / 86400
        age = "today" if age_days < 1 else f"{int(age_days)} days ago"
        lines.append(f'"{note.title}" ({age})')
    return "\n".join(lines)
```

`get_note_by_title` deliberately refuses to guess when a partial title matches more than one note, rather than silently returning the first match -- returning the wrong note's full content to an AI assistant (and, downstream, to you) is worse than asking for a more specific title.

Test all three by hand before moving on, the same way you tested `_all_notes()`:

```bash
uv run python -c "from server import search_notes; print(search_notes('your-keyword'))"
```

:::tip[Test plain functions before any protocol code touches them]
Every bug is easier to find here than after `@mcp.tool()`, the Inspector, and Claude Desktop are all in the mix at once. If `search_notes` returns the wrong thing right now, you know for certain the bug is in this function -- not in a connection, a config file, or the model's own tool-picking.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`search_notes` finds a keyword you know is in one of your notes, and returns a real, correct snippet.</StepChecklistItem>
<StepChecklistItem>`get_note_by_title` returns full note text for an exact title, and a real "be more specific" message for an ambiguous partial one.</StepChecklistItem>
<StepChecklistItem>`list_recent_notes` returns notes in the right order -- most recently edited first.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- `search_notes` returns at most one snippet per note, even if a keyword appears many times in the same file. What would you lose, or gain, by returning every matching line instead?
- If you had two notes with identical titles (different folders, say), which of today's three functions would misbehave first, and how?

## Step 3: Wire them up as MCP tools with FastMCP

Everything so far has been plain Python. Turning it into an MCP server is one decorator per function -- no protocol-level code to write by hand:

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("notes")  # the name your AI client will show for this server


@mcp.tool()
def search_notes(query: str) -> str:
    """Search every note for a keyword and report which notes mention it.

    Looks through each .md file in the notes folder (case-insensitive) and
    returns each matching note's title plus one line of surrounding context.
    Call this when someone asks whether, or where, a topic comes up in their
    notes -- e.g. "do I have any notes about sourdough?".
    """
    ...  # same body as Step 2


@mcp.tool()
def get_note_by_title(title: str) -> str:
    """Return the full text of one note, matched by title.

    Matching is case-insensitive and allows a partial match as long as
    exactly one note matches; ambiguous partial matches are reported
    instead of guessed. Call this once search_notes (or the user) has
    identified which note they want in full, not as a first-pass search tool.
    """
    ...  # same body as Step 2


@mcp.tool()
def list_recent_notes(limit: int = 5) -> str:
    """List the most recently modified notes, newest first.

    Reports each note's title and how long ago it was last edited. Call
    this when someone asks what they've been working on lately, or wants
    a quick overview of the notes folder without searching for anything
    specific.
    """
    ...  # same body as Step 2


if __name__ == "__main__":
    mcp.run()
```

`@mcp.tool()` inspects each function's name, type-hinted parameters, and docstring, and builds an MCP tool definition automatically -- the model reads your docstring, not your code, to decide when a tool matches a request. With three tools now instead of one, docstrings that clearly distinguish *when* to call each one matter more than they did with a single tool: notice that `get_note_by_title`'s docstring explicitly says it's for after search, not instead of it.

Before touching any real AI client, run the SDK's dev/inspector command and test all three tools by hand:

```bash
uv run mcp dev server.py
```

This opens the **MCP Inspector** -- a free, browser-based tool that lets you call each tool with real arguments and see real return values, with no AI model involved. Confirm all three tools work here first.

:::tip[Three tools is more than enough to see docstrings matter]
With one tool, the model has nothing to choose between. With three, try asking the Inspector's underlying prompts (or, once connected, Claude Desktop itself) something ambiguous, like "tell me about my pasta note" -- and watch whether it reaches for `search_notes` or `get_note_by_title` first. If it picks the "wrong" one, that's almost always a docstring problem, not a bug in your function.
:::

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`server.py` defines all three tools with `@mcp.tool()` and real, specific docstrings.</StepChecklistItem>
<StepChecklistItem>`uv run mcp dev server.py` starts without errors and the Inspector lists all three tools.</StepChecklistItem>
<StepChecklistItem>Calling each tool by hand in the Inspector returns the same correct results you already saw in Step 2.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- Now that there are three tools instead of one, how would you decide whether a new tool belongs on this server, or should stay a private helper function no client ever sees?
- If `list_recent_notes`'s docstring didn't mention "what have I been working on lately," would you expect the model to still call it for that phrasing? What does that suggest about how literally to write these?

## Step 4: Connect it to Claude Desktop and try it

[Claude Desktop](https://claude.ai/download)'s free tier supports connecting to local MCP servers. It reads a JSON config file that tells it which servers to launch and how:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

If the file doesn't exist yet, create it. Add your server, using an **absolute** path to your project folder:

```json
{
  "mcpServers": {
    "notes": {
      "command": "uv",
      "args": ["run", "--directory", "/absolute/path/to/mcp-notes-server", "python", "server.py"]
    }
  }
}
```

`command` and `args` describe exactly the process Claude Desktop will launch to talk to your server -- the same `uv run` invocation you already tested in Step 3, just started by Claude Desktop instead of by you. Using `uv run` (rather than a bare `python`) matters here: Claude Desktop launches this command in its own environment, with no guarantee your project's virtual environment is already active, and `uv run` finds and uses the right one on its own.

**Fully quit and restart Claude Desktop** -- a running instance doesn't re-read this file on its own. Once it restarts, your server should show up in its tool/connector list. Try questions like:

> Do I have any notes about sourdough? Use the notes tools if you have them.
>
> What have I been working on most recently, based on my notes?
>
> Pull up my full "side project ideas" note.

Claude Desktop should show it calling `search_notes`, `list_recent_notes`, or `get_note_by_title` (often as a small collapsible "used a tool" block, with the arguments and result visible if you expand it), then answer using the real result your function returned -- not a guess.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`notes` (or your chosen server name) appears in Claude Desktop's tool/connector list after a full restart.</StepChecklistItem>
<StepChecklistItem>Asking about a topic you know is in one of your notes actually shows Claude calling a tool, not just answering from memory or guessing.</StepChecklistItem>
<StepChecklistItem>Asking Claude to pull up one specific note by name returns its real, full content.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

- If you asked Claude Desktop something your notes say nothing about, would you expect it to call a tool anyway and report "nothing found," or answer from general knowledge instead? Which happened, and why do you think that is?
- Now that this is wired up for real, what's the first thing about your actual notes folder that would break these functions if you pointed `NOTES_DIR` at it today?

## ⚠️ Common pitfalls

- **A relative or wrong path in the config file.** `claude_desktop_config.json` needs an absolute path to your project folder -- a relative one has no consistent "current directory" to resolve against when Claude Desktop launches your server, and will just fail to start it.
- **Forgetting to fully restart Claude Desktop after editing the config.** Saving the JSON file alone does nothing -- the app only reads it on startup, so closing and reopening a window isn't enough either; quit the app completely first.
- **`get_note_by_title` silently returning the wrong note.** If you skip the "more than one partial match" check and just return the first hit, a title like "notes" will quietly match the wrong file the moment you have two similarly-named notes -- worth testing with intentionally ambiguous titles before you trust it.
- **A docstring too vague for the model to pick the right tool among three.** `"""Gets a note."""` gives the model nothing to distinguish `get_note_by_title` from `search_notes`. Say plainly what each tool does and when to call it, the way the docstrings above do.
- **Running the server with plain `python server.py` instead of `uv run python server.py`.** Without `uv run`, the interpreter that starts may not be the one `uv add` installed `mcp` into, and you'll get a `ModuleNotFoundError` for `mcp` even though `uv add` clearly said it installed successfully.

## What you just built

A standalone MCP server that turns a real folder of your own notes into something an AI assistant can search and read from directly, using three tools with genuinely different jobs -- keyword search, exact lookup, and recency listing -- instead of one catch-all function. The same server works unmodified with any MCP-compatible client, not just Claude Desktop, and the indexing logic underneath has nothing MCP-specific about it at all: it's just files on disk, read fresh each call.

## Where to go from here

- Point `NOTES_DIR` at your real Obsidian vault, Notion export, or plain notes folder instead of the sample notes you started with, and see what breaks -- inconsistent heading styles, huge files, non-Markdown attachments mixed in.
- Add a tool that filters by tag, if your real notes use a `tags:` convention like the sample notes here do -- same shape as `search_notes`, but matching a structured field instead of free text.
- Read about MCP **resources** and **prompts** -- this lesson only covers *tools*, but the protocol also defines ways to expose readable data (resources) and reusable prompt templates (prompts) to a client. The [SDK's own docs](https://github.com/modelcontextprotocol/python-sdk) cover both, with the same `FastMCP` decorator style.
- Since the spec is actively evolving, periodically re-check the [official MCP documentation](https://modelcontextprotocol.io) for anything that's changed since you built this.

:::tip[Run a fuller version without any local setup -- for the tool logic, at least]
[`examples/mcp-notes-server/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/mcp-notes-server) in the course repo is a slightly fuller version of the code above, with 7 real sample notes already written and all three tools implemented. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), to try all three tools with `uv run mcp dev server.py` -- remembering that the actual Claude Desktop connection still needs to happen locally, per "Where to run this" above.
:::

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted -- and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓

<ProjectProgressCheckbox projectId="2027-mcp-notes-server" />
