"""Parses a Netscape-format bookmarks HTML export into a list of records.

Run with: uv run python parse_bookmarks.py bookmarks.html
This only prints a summary -- build_index.py (Step 2) imports load_bookmarks()
from this file.
"""

import sys
from html.parser import HTMLParser
from pathlib import Path


class BookmarkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.folder_stack: list[str] = []
        self.pending_folder: str | None = None
        self.records: list[dict] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        attrs = dict(attrs)
        if tag == "h3":
            # A folder header: "<DT><H3>Name</H3>" -- the name arrives in
            # handle_data, and the folder itself is the nested <DL> that
            # follows, so we hold the name until that <DL> starts.
            self.pending_folder = ""
        elif tag == "dl":
            if self.pending_folder is not None:
                name = " ".join(self.pending_folder.split())
                self.folder_stack.append(name)
                self.pending_folder = None
            else:
                self.folder_stack.append("")  # anonymous top-level <DL>
        elif tag == "a":
            # A bookmark's title is the text between <A> and </A>, so store
            # the URL now and grab the title on handle_data.
            self._pending = {"href": attrs.get("href", ""), "text": ""}

    def handle_endtag(self, tag: str) -> None:
        if tag == "dl" and self.folder_stack:
            self.folder_stack.pop()
        elif tag == "a" and hasattr(self, "_pending"):
            title = " ".join(self._pending["text"].split()).strip()
            record = {
                "title": title or self._pending["href"],
                "url": self._pending["href"],
                "folder": "/".join(name for name in self.folder_stack if name),
            }
            if record["url"]:
                self.records.append(record)
            del self._pending

    def handle_data(self, data: str) -> None:
        if self.pending_folder is not None:
            self.pending_folder += data
        elif hasattr(self, "_pending"):
            self._pending["text"] += data


def load_bookmarks(path: Path) -> list[dict]:
    parser = BookmarkParser()
    parser.feed(path.read_text(encoding="utf-8", errors="replace"))
    return parser.records


if __name__ == "__main__":
    records = load_bookmarks(Path(sys.argv[1]))
    print(f"Parsed {len(records)} bookmarks")
    for r in records[:5]:
        print(f"  [{r['folder']}] {r['title']} -> {r['url']}")
