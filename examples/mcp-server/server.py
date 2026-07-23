"""MCP server example: exposes two real tools via FastMCP.

See docs/projects/mcp-server/index.md for the full walkthrough this file
accompanies -- this is the fuller, standalone version of the server.py
written step by step there, wired up to search the *actual* course repo
it's running in, not a hardcoded example.

Run it locally:

    uv run python server.py       # runs the server directly (stdio transport)
    uv run mcp dev server.py      # runs it with the MCP Inspector, for manual testing

Connect it to Claude Desktop by pointing claude_desktop_config.json's "args"
at this file's absolute path and "cwd" (or --directory) at this folder --
see the README and the lesson's Step 4 for the full JSON snippet.
"""

from pathlib import Path

from mcp.server.fastmcp import FastMCP

# A FastMCP instance is the whole server -- its name ("course-tools") is what
# shows up in an MCP client's tool/server list.
mcp = FastMCP("course-tools")

# This file lives at examples/mcp-server/server.py, so two levels up is the
# repo root -- the same layout examples/ai-agent/agent.py uses for the same
# reason (a real tool needs to find the real docs/ folder).
REPO_ROOT = Path(__file__).resolve().parents[2]
DOCS_DIR = REPO_ROOT / "docs"


@mcp.tool()
def search_course_topics(query: str) -> str:
    """Search this course's real lesson files for a topic and report which pages mention it.

    Looks through every .md/.mdx file under docs/ for `query` (case-insensitive)
    and returns each matching file's path plus one line of surrounding context,
    so an assistant can point to *where* in the course something was actually
    covered instead of guessing. Call this whenever someone asks whether, or
    where, this course covers a given topic.
    """
    if not DOCS_DIR.exists():
        return f"docs/ not found at {DOCS_DIR} -- run this from inside the course repo."

    query_lower = query.lower()
    matches = []
    for path in sorted(DOCS_DIR.rglob("*.md*")):
        text = path.read_text(encoding="utf-8", errors="ignore")
        for line in text.splitlines():
            if query_lower in line.lower():
                snippet = line.strip()[:160]
                matches.append(f'{path.relative_to(REPO_ROOT)}: "{snippet}"')
                break  # one hit per file is enough context
        if len(matches) >= 5:
            break

    if not matches:
        return f"No lesson pages mention '{query}'."
    return "Found in:\n" + "\n".join(matches)


@mcp.tool()
def count_words(text: str) -> int:
    """Count the words in a piece of text.

    A small, genuinely useful utility tool: splits on whitespace, so this is
    a word count in the everyday sense, not a strict tokenizer count. Call
    this whenever someone asks how long a piece of text is, in words.
    """
    return len(text.split())


if __name__ == "__main__":
    # stdio is the transport an MCP client like Claude Desktop expects for a
    # local server -- it talks to this process over stdin/stdout, not a port.
    mcp.run()
