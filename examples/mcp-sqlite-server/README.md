# MCP SQLite Server Example

The local companion to the course's [Query a Database in Plain English with MCP](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/docs/projects/mcp-sqlite-server) lesson -- a real, runnable [MCP](https://modelcontextprotocol.io) server built with the official Python SDK's `FastMCP` API, exposing a small SQLite database (a neighborhood library) so an AI client like Claude Desktop can answer plain-English questions about it by writing and running its own SQL.

## What's here

- `seed.py` -- builds `library.db`, a small sample SQLite database with four related tables: `authors`, `books`, `members`, and `loans`.
- `db_tools.py` -- plain Python functions with no MCP dependency: `list_tables()`, `describe_table()`, and `run_read_only_query()`. The last one is the interesting one -- it rejects anything that isn't a single, standalone `SELECT` statement (no semicolon-chained second statement, no write/DDL keywords) and additionally opens the database file itself in SQLite's read-only mode as a second, independent layer of defense.
- `server.py` -- a `FastMCP` server wrapping those three functions as MCP tools: `list_db_tables`, `describe_db_table`, and `query_db`.
- `notebook.ipynb` -- calls the functions in `db_tools.py` directly, with no MCP protocol involved, to demo the query/schema logic in isolation. It is **not** a way to run the actual MCP server or talk to a client -- see the lesson's "Where to run this" for why that step needs to happen locally.

## Running it locally

Build the sample database once:

```bash
uv run python seed.py
```

Then start the server:

```bash
uv run python server.py
```

This starts the server on stdio and waits -- it's not meant to print anything on its own; an MCP client connects to it and calls its tools. To actually see it do something without a full client, use the MCP Inspector that ships with the SDK:

```bash
uv run mcp dev server.py
```

This opens a browser tab where you can call `list_db_tables`, `describe_db_table`, and `query_db` by hand and see their real return values -- try `query_db` with `SELECT title FROM books WHERE genre = 'Fiction'`, then try it with something like `DROP TABLE books` to see the safety check reject it.

## Connecting it to Claude Desktop

Add an entry to Claude Desktop's `claude_desktop_config.json` pointing at this folder (use an **absolute path** -- see the lesson's Step 4 for where that file lives on your OS and the full walkthrough):

```json
{
  "mcpServers": {
    "library-db": {
      "command": "uv",
      "args": ["run", "--directory", "/absolute/path/to/examples/mcp-sqlite-server", "python", "server.py"]
    }
  }
}
```

Restart Claude Desktop after saving, then ask it something like "Which books has this library not gotten back yet?" -- it should call `list_db_tables`, `describe_db_table`, and `query_db` in sequence, writing its own SQL, and answer using the real result.

## Running it in GitHub Codespaces

Click into a [Codespace for the whole repo](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are preinstalled) to write and test `db_tools.py` and `server.py` -- `uv run mcp dev server.py` and the Inspector both work fine there. What you *can't* do from a Codespace is the last step above: Claude Desktop runs on your own machine and needs a local server it can launch itself, so the actual "connect it to a real AI client" step has to happen locally.

## A note on staying current

The MCP spec and the `mcp` Python SDK are both young and move fast. The API used here (`FastMCP`, `@mcp.tool()`, `mcp dev`) was verified against a live run while writing this example, but check the [SDK's own docs](https://github.com/modelcontextprotocol/python-sdk) before relying on it, since it may have changed by the time you read this.

## Built your own MCP server?

See [`examples/student-projects/`](../student-projects/) for how to share it with the class via a pull request -- no git experience required, it walks through every step.
