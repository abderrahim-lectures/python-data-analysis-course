# MCP Notes Server Example

The local companion to the course's [Build an MCP Server for Your Notes](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/docs/projects/mcp-notes-server) lesson -- a real, runnable [MCP](https://modelcontextprotocol.io) server built with the official Python SDK's `FastMCP` API, indexing a real folder of Markdown notes and exposing tools an AI assistant like Claude Desktop can actually call.

## What's here

- `notes/` -- 7 real sample notes (recipes, book notes, a project ideas list, a meeting template, a troubleshooting reference, a checklist) to index and search over.
- `server.py` -- a `FastMCP` server with three tools:
  - `search_notes(query)` -- searches every `.md` file in `notes/` for a keyword and returns matching notes with surrounding context.
  - `get_note_by_title(title)` -- returns one note's full text, matched by exact or partial title.
  - `list_recent_notes(limit)` -- lists the most recently modified notes, newest first, based on each file's modification time on disk.

No database, no embeddings, no external API -- just reading real files off `notes/` each time a tool runs, which is plenty fast at personal-notes scale.

## Running it locally

```bash
uv run python server.py
```

This starts the server on stdio and waits -- it's not meant to print anything on its own; an MCP client connects to it and calls its tools. To actually see it do something without a full client, use the MCP Inspector that ships with the SDK:

```bash
uv run mcp dev server.py
```

This opens a browser tab where you can call `search_notes`, `get_note_by_title`, and `list_recent_notes` by hand and see their real return values -- the fastest way to confirm your tool code works before wiring up a real AI client.

## Pointing it at your own notes

Change `NOTES_DIR` in `server.py` to any folder of `.md` files on your machine -- an Obsidian vault, a Notion export, a plain folder of Markdown journal entries. The tools only assume each note is a `.md` file with a `# Title` heading somewhere near the top; everything else about your notes' structure is up to you.

## Connecting it to Claude Desktop

Add an entry to Claude Desktop's `claude_desktop_config.json` pointing at this folder (use an **absolute path** -- see the lesson's [Step 4](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/docs/projects/mcp-notes-server#step-4-connect-it-to-claude-desktop-and-try-it) for where that file lives on your OS and the full walkthrough):

```json
{
  "mcpServers": {
    "notes": {
      "command": "uv",
      "args": ["run", "--directory", "/absolute/path/to/examples/mcp-notes-server", "python", "server.py"]
    }
  }
}
```

Restart Claude Desktop after saving, then ask it something like "do I have any notes about sourdough?" or "what have I been working on lately?" -- it should call `search_notes` or `list_recent_notes` and answer using the real result.

## Running it in GitHub Codespaces

Click into a [Codespace for the whole repo](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are preinstalled) to write and test the tool functions themselves -- `uv run mcp dev server.py` and the Inspector both work fine there. What you *can't* do from a Codespace is the last step above: Claude Desktop runs on your own machine and needs a local server it can launch itself, so the actual "connect it to a real AI client" step has to happen locally. See the lesson's [Where to run this](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/docs/projects/mcp-notes-server#where-to-run-this) section for the full picture.

## Try the tool logic in a hosted notebook (Colab/Kaggle)

`notebook.ipynb` in this folder is deliberately narrow: it lets you call `search_notes`, `get_note_by_title`, and `list_recent_notes` as plain Python functions -- no `@mcp.tool()` decorator, no `FastMCP` server, no MCP protocol, no Claude Desktop connection -- in a free hosted notebook, using a small set of sample notes written directly in the notebook. It is **not** the full MCP server project; Colab and Kaggle can't host the persistent local process the real server (and its Claude Desktop connection) needs. Use it to experiment with the tool logic itself; do the real project locally with `uv`.

## A note on staying current

The MCP spec and the `mcp` Python SDK are both young and move fast. The API used here (`FastMCP`, `@mcp.tool()`, `mcp dev`) was verified against a live run while writing this example, but check the [SDK's own docs](https://github.com/modelcontextprotocol/python-sdk) before relying on it, since it may have changed by the time you read this.

## Built your own MCP server?

See [`examples/student-projects/`](../student-projects/) for how to share it with the class via a pull request -- no git experience required, it walks through every step.
