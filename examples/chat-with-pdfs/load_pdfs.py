"""Loads every PDF in pdfs/, extracts text page by page, and splits each
page into small chunks -- keeping the source filename and page number
attached to every chunk, so later answers can cite exactly where a fact
came from.

Run with: uv run python load_pdfs.py

This only prints a summary -- build_index.py (Step 2) imports load_chunks()
from this file and does the actual embedding.
"""

from pathlib import Path

from pypdf import PdfReader

PDFS_DIR = Path("pdfs")
TARGET_CHUNK_SIZE = 500  # characters -- small enough to stay focused,
                         # large enough to hold a full thought


def split_into_paragraphs(text: str) -> list[str]:
    """Splits on blank lines, dropping empty paragraphs. Falls back to
    splitting on single newlines if a page has no blank-line breaks at
    all, which is common in PDFs extracted from single-column layouts."""
    paragraphs = [p.strip() for p in text.split("\n\n")]
    paragraphs = [p for p in paragraphs if p]
    if len(paragraphs) <= 1:
        paragraphs = [p.strip() for p in text.split("\n")]
        paragraphs = [p for p in paragraphs if p]
    return paragraphs


def merge_short_paragraphs(paragraphs: list[str], target_size: int) -> list[str]:
    """Greedily merges consecutive short paragraphs up to target_size
    characters, so a chunk isn't just one short line with barely any
    context in it."""
    chunks = []
    current = ""
    for paragraph in paragraphs:
        if current and len(current) + len(paragraph) > target_size:
            chunks.append(current)
            current = paragraph
        else:
            current = f"{current}\n\n{paragraph}" if current else paragraph
    if current:
        chunks.append(current)
    return chunks


def load_chunks() -> list[dict]:
    """Returns a list of {"text", "source", "page"} dicts, one per chunk,
    across every PDF in PDFS_DIR. `page` is 1-indexed, matching what a
    human reading the PDF would call "page N" -- pypdf's own page indices
    are 0-based, so every page number here has +1 applied."""
    chunks = []
    for path in sorted(PDFS_DIR.glob("*.pdf")):
        reader = PdfReader(str(path))
        for page_index, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            paragraphs = split_into_paragraphs(text)
            for chunk_text in merge_short_paragraphs(paragraphs, TARGET_CHUNK_SIZE):
                chunks.append({
                    "text": chunk_text,
                    "source": path.name,
                    "page": page_index + 1,
                })
    return chunks


if __name__ == "__main__":
    chunks = load_chunks()
    print(f"Loaded {len(chunks)} chunks from {PDFS_DIR}/")
    for chunk in chunks[:3]:
        preview = chunk["text"][:80].replace("\n", " ")
        print(f"  [{chunk['source']} p{chunk['page']}] {preview}...")
