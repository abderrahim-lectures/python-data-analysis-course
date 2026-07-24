# MCP Server Example

The local companion to the course's [Build an MCP Server](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/docs/projects/mcp-server) lesson -- a real, runnable [MCP](https://modelcontextprotocol.io) server built with the official Python SDK's `FastMCP` API, exposing two tools an AI assistant like Claude Desktop can actually call.

## What's here

- `server.py` -- a `FastMCP` server with two tools:
  - `search_course_topics(query)` -- really searches every lesson file under this repo's `docs/` folder for a topic and returns the actual matching pages, the same idea as [`examples/ai-agent/`](../ai-agent/)'s `search_course_docs`, exposed here as an MCP tool instead of a LangChain one.
  - `count_words(text)` -- a small utility tool that counts words in a piece of text.

## Running it locally

```bash
uv run python server.py
```

This starts the server on stdio and waits -- it's not meant to print anything on its own; an MCP client connects to it and calls its tools. To actually see it do something without a full client, use the MCP Inspector that ships with the SDK:

```bash
uv run mcp dev server.py
```

This opens a browser tab where you can call `search_course_topics` and `count_words` by hand and see their real return values -- the fastest way to confirm your tool code works before wiring up a real AI client. See the lesson's [Step 3](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/docs/projects/mcp-server#step-3-run-and-test-your-server-locally) for more on why this step matters.

## Connecting it to Claude Desktop

Add an entry to Claude Desktop's `claude_desktop_config.json` pointing at this folder (use an **absolute path** -- see the lesson's [Step 4](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/docs/projects/mcp-server#step-4-connect-it-to-claude-desktop) for where that file lives on your OS and the full walkthrough):

```json
{
  "mcpServers": {
    "course-tools": {
      "command": "uv",
      "args": ["run", "--directory", "/absolute/path/to/examples/mcp-server", "python", "server.py"]
    }
  }
}
```

Restart Claude Desktop after saving, then ask it something like "does this course cover groupby?" -- it should call `search_course_topics` and answer using the real result.

## Running it in GitHub Codespaces

Click into a [Codespace for the whole repo](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node, Python, and `uv` are preinstalled) to write and test the tool functions themselves -- `uv run mcp dev server.py` and the Inspector both work fine there. What you *can't* do from a Codespace is the last step above: Claude Desktop runs on your own machine and needs a local server it can launch itself, so the actual "connect it to a real AI client" step has to happen locally. See the lesson's [Where to run this](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/docs/projects/mcp-server#where-to-run-this) section for the full picture.

## Try the tool logic in a hosted notebook (Colab/Kaggle)

`notebook.ipynb` in this folder is deliberately narrow: it lets you call `search_course_topics` and `count_words` as plain Python functions -- no `@mcp.tool()` decorator, no `FastMCP` server, no MCP protocol, no Claude Desktop connection -- in a free hosted notebook, with a shallow clone of this repo for `search_course_topics` to search over. It is **not** the full MCP server project; per "Running it in GitHub Codespaces" and the lesson's [Where to run this](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/docs/projects/mcp-server#where-to-run-this) section, Colab and Kaggle can't host the persistent local process the real server (and its Claude Desktop connection) needs. Use it to experiment with the tool logic itself; do the real project locally with `uv`.

## A note on staying current

The MCP spec and the `mcp` Python SDK are both young and move fast. The API used here (`FastMCP`, `@mcp.tool()`, `mcp dev`) was verified against a live run while writing this example, but check the [SDK's own docs](https://github.com/modelcontextprotocol/python-sdk) before relying on it, since it may have changed by the time you read this.

## Built your own MCP server?

See [`examples/student-projects/`](../student-projects/) for how to share it with the class via a pull request -- no git experience required, it walks through every step.
