"""Deterministically generates the tiny sample PDFs in data/sample/pdfs/.

This project deliberately uses no LLM and no heavyweight PDF library: pypdf
(the project's only document dependency) can *read* PDFs but doesn't ship a
text-layout writer, so instead of pulling in reportlab we hand-craft the PDFs
here with the same plain-byte technique anyone can use to make a minimal,
valid PDF -- objects, a content stream with BT/ET text-drawing operators, and
a computed xref table.

Run with:  uv run python make_pdf_data.py

The output PDFs are small (a few KB each) and are committed to the repo so
everything works out of the box; this script is here so you can inspect or
regenerate them. If you regenerate, re-run build_graph.py afterwards -- the
graph only shows what pypdf can extract from the files that actually exist.
"""

from __future__ import annotations

from pathlib import Path

OUTPUT_DIR = Path("data/sample/pdfs")


def _escape_pdf_string(text: str) -> str:
    """Escapes a PDF literal string. Content stays ASCII so latin-1 bytes work."""
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _wrap(text: str, width: int = 88) -> list[str]:
    """A tiny whitespace-aware word-wrapping loop (no textwrap import needed)."""
    lines: list[str] = []
    current = ""
    for word in text.split():
        candidate = f"{current} {word}".strip()
        if len(candidate) <= width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def make_pdf(title: str, paragraphs: list[str]) -> bytes:
    """Builds a minimal, valid single-page PDF that draws `title` and text.

    The content stream uses the classic BT/ET block with the standard
    Helvetica fonts -- the most widely supported way to draw text in a
    hand-made PDF. Returns raw bytes ready to be written to a .pdf file.
    """
    lines: list[tuple[str, str, int]] = [(title, "F2", 20)]
    for paragraph in paragraphs:
        for chunk in _wrap(paragraph):
            lines.append((chunk, "F1", 11))
        lines.append(("", "F1", 9))  # blank spacer line

    y = 740
    stream_lines: list[str] = []
    for text, font, size in lines:
        if y < 60:  # don't draw past the bottom margin
            break
        if text:
            stream_lines.append(f"BT /{font} {size} Tf 50 {y} Td ({_escape_pdf_string(text)}) Tj ET")
            y -= size + 5
        else:
            y -= 12

    content = "\n".join(stream_lines)
    content_bytes = content.encode("latin-1")

    objects: list[tuple[int, str]] = [
        (1, "<< /Type /Catalog /Pages 2 0 R >>"),
        (2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
        (
            3,
            "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            "/Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
        ),
        (4, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"),
        (5, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"),
        (6, f"<< /Length {len(content_bytes)} >>\nstream\n{content}\nendstream"),
    ]

    out = bytearray()
    out += b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"
    offsets: dict[int, int] = {}
    for obj_num, body in objects:
        offsets[obj_num] = len(out)
        out += f"{obj_num} 0 obj\n".encode("ascii")
        out += body.encode("latin-1")
        out += b"\nendobj\n"

    xref_offset = len(out)
    count = len(objects)
    out += b"xref\n"
    out += f"0 {count + 1}\n".encode("ascii")
    out += b"0000000000 65535 f \n"
    for obj_num in range(1, count + 1):
        out += f"{offsets[obj_num]:010d} 00000 n \n".encode("ascii")
    out += b"trailer\n"
    out += f"<< /Size {count + 1} /Root 1 0 R >>\n".encode("ascii")
    out += b"startxref\n"
    out += f"{xref_offset}\n".encode("ascii")
    out += b"%%EOF\n"
    return bytes(out)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    pdfs: list[tuple[str, str, list[str]]] = [
        (
            "architecture.pdf",
            "System Architecture",
            [
                "The bookstore app has four layers: web, auth, database, and reporting.",
                "The auth module reads the users and sessions tables, and is configured through auth.ini.",
                "The [database] section of app.toml sets the connection and the seed_tables list.",
                "Orders flow from the web layer into the orders table, and each order_item links back to a book.",
            ],
        ),
        (
            "onboarding.pdf",
            "Developer Onboarding",
            [
                "Welcome to the bookstore codebase. Start by reading the SQL schema in data/sample/sql.",
                "The users table stores login credentials; sessions holds the active tokens.",
                "Run the migrations to create orders, order_items, books, and tax_rates.",
                "Set jwt_secret in auth.ini before the first deploy.",
            ],
        ),
        (
            "data-model.pdf",
            "Data Model Overview",
            [
                "This document defines the database tables used across the service.",
                "users: identity records. sessions: login tokens linked to a user.",
                "orders: purchases placed by a user. order_items: line items referencing a book.",
                "books: catalog entries. tax_rates: the VAT rate per country.",
                "A config key like seed_tables in app.toml controls which tables are pre-filled.",
            ],
        ),
    ]

    for filename, title, paragraphs in pdfs:
        data = make_pdf(title, paragraphs)
        (OUTPUT_DIR / filename).write_bytes(data)
        print(f"Wrote {OUTPUT_DIR / filename} ({len(data)} bytes)")

    print(f"\nRegenerated {len(pdfs)} sample PDFs. Re-run build_graph.py to rebuild the graph.")


if __name__ == "__main__":
    main()
