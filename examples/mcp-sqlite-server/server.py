"""A FastMCP server exposing the sample library database for plain-English queries.

Run `python seed.py` once first to create library.db, then run this server (see
README.md) and connect an MCP client like Claude Desktop or the MCP Inspector.
Each tool below is a thin wrapper around a plain function in db_tools.py -- the
actual logic, including the read-only safety checks, lives there and is tested
in isolation in notebook.ipynb.
"""

from mcp.server.fastmcp import FastMCP

from db_tools import DB_PATH, UnsafeQueryError, describe_table, list_tables, run_read_only_query

mcp = FastMCP("library-db")


@mcp.tool()
def list_db_tables() -> list[str]:
    """List every table in the library database.

    Call this first when you don't yet know what data is available -- it
    returns table names only, with no columns or rows.
    """
    return list_tables(DB_PATH)


@mcp.tool()
def describe_db_table(table_name: str) -> list[dict]:
    """Describe a table's columns: name, type, nullability, and primary key.

    Call this after list_db_tables() to learn a table's shape -- column
    names and types -- before writing a SELECT query against it.
    """
    return describe_table(table_name, DB_PATH)


@mcp.tool()
def query_db(sql: str) -> list[dict]:
    """Run a read-only SELECT query against the library database and return the rows.

    Only a single SELECT statement is allowed -- no semicolons chaining a
    second statement, and no INSERT/UPDATE/DELETE/DROP/ALTER/CREATE or other
    write/DDL keywords anywhere in the query. Call list_db_tables() and
    describe_db_table() first if you're not sure what tables or columns
    exist. Raises an error, rather than running the query, if it isn't a
    plain read-only SELECT.
    """
    try:
        return run_read_only_query(sql, DB_PATH)
    except UnsafeQueryError as exc:
        # Re-raised as a plain string result rather than letting the
        # exception propagate, so the calling model sees a clear reason its
        # query was rejected instead of an opaque protocol-level error.
        return [{"error": str(exc)}]


if __name__ == "__main__":
    mcp.run()
