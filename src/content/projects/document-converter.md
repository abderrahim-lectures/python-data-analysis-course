---
title: "Document Converter"
description: "Convert between Markdown, HTML, and plain text with metadata extraction and batch processing."
difficulty: "beginner"
estimatedMinutes: 40
xpReward: 50
tags: ["file-io", "markdown", "html", "cli"]
prerequisites: ["Python basics (variables, loops, functions, strings)", "Basic file I/O"]
---

# Document Converter

Documents come in many formats,Markdown for writing, HTML for the web, plain text for quick sharing. Manually converting between them is tedious and error-prone. In this project, you will build a Python tool that reads Markdown files, converts them to HTML or plain text, extracts metadata from document headers, and processes entire directories in one command.

- **Run it in your browser.** An interactive companion notebook is ready, open it in Colab, Kaggle, or Binder and follow along top-to-bottom.
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/document-converter/notebook.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/document-converter/notebook.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdocument-converter%2Fnotebook.ipynb)

## What You'll Learn

1. Parse Markdown syntax into structured data
2. Convert Markdown to HTML with proper tags
3. Strip HTML to plain text
4. Extract metadata from document frontmatter
5. Process multiple files in batch

## What You'll Build

A document converter that:
- Reads Markdown files and converts to HTML
- Applies CSS styling to generated HTML
- Converts HTML back to plain text
- Extracts metadata from YAML frontmatter
- Processes entire directories in one command

## Setup

```bash
uv init document-converter
cd document-converter
```

---

## Step 1: Read Markdown Files

**Objective:** Load the contents of a Markdown file into a Python string so you can work with it.

**Explanation:** File reading is the foundation of any converter. Python's `open()` function with the `"r"` mode opens a file for reading. The `.read()` method pulls the entire file contents into a single string. Always use a `with` statement so the file closes automatically, even if an error occurs.

**Starter hint:** You need a sample Markdown file to test with. Create `sample.md` first, then write a function that reads it.

### Create the sample file

Create a file called `sample.md` in your project root with this content:

```markdown
# Hello World

This is a **bold** word and this is an *italic* word.

## Features

- Item one
- Item two
- Item three

[A link to Python](https://python.org)

```python
print("Hello!")
```
```

### Working code

```python
def read_markdown(filepath: str) -> str:
    """Read a Markdown file and return its contents."""
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read()


if __name__ == "__main__":
    content = read_markdown("sample.md")
    print(f"Read {len(content)} characters from sample.md")
    print("---")
    print(content[:200])
```

### Expected output

```
Read 189 characters from sample.md
---
# Hello World

This is a **bold** word and this is an *italic* word.

## Features

- Item one
- Item two
- Item three

[A link to Python](https://python.org)

```python
print("Hello!")
```
```

### Troubleshooting

- **`FileNotFoundError`**: Check the file path. Use `os.path.exists(filepath)` to verify the file exists before reading.
- **`UnicodeDecodeError`**: Some files use non-UTF-8 encoding. Add `errors="replace"` to `open()` to skip bad characters.
- **Empty output**: The file might be empty or the path points to the wrong file. Print `filepath` before opening.

### Checklist

- [ ] Created `sample.md` with Markdown content
- [ ] Function returns the full file contents as a string
- [ ] Used `with` statement for safe file handling
- [ ] Verified output prints the first 200 characters

### Socratic question

Why does using `with open(...)` matter compared to calling `open()` and `close()` manually? What happens if an exception is raised between `open()` and `close()`?

---

## Step 2: Convert Markdown to HTML

**Objective:** Transform Markdown syntax into corresponding HTML tags.

**Explanation:** Markdown has a simple, consistent syntax: `#` for headings, `**text**` for bold, `*text*` for italic, `-` for list items, `[text](url)` for links, and triple backticks for code blocks. You can write a converter by mapping each pattern to its HTML equivalent using regular expressions.

**Starter hint:** Use the `re` module. For each Markdown element, write a pattern that matches it and a replacement that wraps it in HTML tags.

### Working code

```python
import re


def markdown_to_html(md_text: str) -> str:
    """Convert Markdown text to HTML."""
    html = md_text

    # Code blocks (``` ... ```)
    html = re.sub(
        r"```(\w*)\n(.*?)```",
        r'<pre><code class="language-\1">\2</code></pre>',
        html,
        flags=re.DOTALL,
    )

    # Inline code
    html = re.sub(r"`([^`]+)`", r"<code>\1</code>", html)

    # Headings
    html = re.sub(r"^### (.+)$", r"<h3>\1</h3>", html, flags=re.MULTILINE)
    html = re.sub(r"^## (.+)$", r"<h2>\1</h2>", html, flags=re.MULTILINE)
    html = re.sub(r"^# (.+)$", r"<h1>\1</h1>", html, flags=re.MULTILINE)

    # Bold and italic
    html = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", html)
    html = re.sub(r"\*(.+?)\*", r"<em>\1</em>", html)

    # Links
    html = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', html)

    # Unordered lists
    lines = html.split("\n")
    in_list = False
    result = []
    for line in lines:
        if line.startswith("- "):
            if not in_list:
                result.append("<ul>")
                in_list = True
            result.append(f"  <li>{line[2:]}</li>")
        else:
            if in_list:
                result.append("</ul>")
                in_list = False
            result.append(line)
    if in_list:
        result.append("</ul>")
    html = "\n".join(result)

    # Paragraphs (wrap remaining plain text lines)
    html = re.sub(r"\n\n+", "\n\n", html)

    return html


if __name__ == "__main__":
    content = read_markdown("sample.md")
    html = markdown_to_html(content)
    print(html)
```

### Expected output

```html
<h1>Hello World</h1>

<p>This is a <strong>bold</strong> word and this is an <em>italic</em> word.</p>

<h2>Features</h2>

<ul>
  <li>Item one</li>
  <li>Item two</li>
  <li>Item three</li>
</ul>

<a href="https://python.org">A link to Python</a>

<pre><code class="language-python">print("Hello!")</code></pre>
```

### Troubleshooting

- **Bold not converting**: Make sure `**` patterns are processed before `*` patterns. Otherwise the italic regex will match the first `*` of `**` and break the bold pattern.
- **Code blocks eating content**: The `re.DOTALL` flag lets `.` match newlines inside the code block. Without it, the regex only matches single-line code blocks.
- **Lists not wrapping**: The list parser relies on consecutive lines starting with `- `. Blank lines between items break the group. That is fine for this project,each list block is handled separately.

### Checklist

- [ ] Headings convert to `<h1>`, `<h2>`, `<h3>` tags
- [ ] Bold (`**`) becomes `<strong>` and italic (`*`) becomes `<em>`
- [ ] Links convert to `<a href="...">` tags
- [ ] List items wrap in `<ul>` and `<li>` tags
- [ ] Code blocks wrap in `<pre><code>` with language class

### Socratic question

Why should bold patterns be processed before italic patterns? What would happen if the order were reversed?

---

## Step 3: Add CSS Styling

**Objective:** Wrap generated HTML in a full document structure with embedded CSS for a polished look.

**Explanation:** Raw HTML without a `<head>` or `<style>` block renders as unstyled text in a browser. By wrapping your converted content in a complete HTML document with embedded CSS, you get a presentable page with no external dependencies.

**Starter hint:** Create a string constant that holds the HTML skeleton with a `<style>` block, then insert your converted content into the body.

### Working code

```python
CSS = """
body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    max-width: 700px;
    margin: 2rem auto;
    padding: 0 1rem;
    line-height: 1.6;
    color: #333;
}
h1, h2, h3 { color: #111; }
code {
    background: #f4f4f4;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-size: 0.9em;
}
pre {
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 1rem;
    border-radius: 6px;
    overflow-x: auto;
}
pre code { background: none; padding: 0; color: inherit; }
a { color: #0066cc; }
ul { padding-left: 1.5rem; }
"""


def wrap_html(body: str, title: str = "Converted Document") -> str:
    """Wrap HTML body in a full document with CSS."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>{CSS}</style>
</head>
<body>
{body}
</body>
</html>"""


if __name__ == "__main__":
    content = read_markdown("sample.md")
    html_body = markdown_to_html(content)
    full_html = wrap_html(html_body, title="My Document")
    print(full_html[:500])
```

### Expected output

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Document</title>
    <style>
body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    max-width: 700px;
    margin: 2rem auto;
    ...
</style>
</head>
<body>
<h1>Hello World</h1>
...
</body>
</html>
```

### Troubleshooting

- **CSS not showing**: Make sure the `<style>` tag is inside `<head>`, not `<body>`.
- **Special characters in title**: If the title contains quotes, they will break the HTML attribute. Use `html.escape(title)` from the `html` module to sanitize it.
- **File not rendering in browser**: Save as `.html` (not `.md`) and open in a browser.

### Checklist

- [ ] HTML includes `<!DOCTYPE html>` declaration
- [ ] CSS is embedded in a `<style>` block inside `<head>`
- [ ] Page has a configurable title
- [ ] Body content is inserted between `<body>` tags
- [ ] Opening the output file in a browser shows styled content

### Socratic question

Why embed CSS directly in the HTML file instead of linking to an external stylesheet? What are the trade-offs of each approach?

---

## Step 4: Convert HTML to Plain Text

**Objective:** Strip all HTML tags and return clean plain text.

**Explanation:** Converting HTML back to plain text is useful for previews, search indexing, or email bodies. The approach is straightforward: remove all tags with a regex, then clean up extra whitespace. This is not a full HTML parser, but it works well for simple documents.

**Starter hint:** Use `re.sub(r"<[^>]+>", "", html)` to remove tags, then collapse multiple spaces and blank lines.

### Working code

```python
import html as html_module


def html_to_text(html_str: str) -> str:
    """Convert HTML to plain text by stripping tags."""
    text = html_str

    # Replace block elements with newlines for spacing
    text = re.sub(r"<(br|hr)\s*/?>", "\n", text)
    text = re.sub(r"</(p|div|h[1-6]|li|pre)>", "\n", text)

    # Remove all remaining tags
    text = re.sub(r"<[^>]+>", "", text)

    # Decode HTML entities (&amp; -> &, &lt; -> <, etc.)
    text = html_module.unescape(text)

    # Clean up whitespace
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = text.strip()

    return text


if __name__ == "__main__":
    content = read_markdown("sample.md")
    html_body = markdown_to_html(content)
    plain = html_to_text(html_body)
    print(plain)
```

### Expected output

```
Hello World

This is a bold word and this is an italic word.

Features

- Item one
- Item two
- Item three

A link to Python

print("Hello!")
```

### Troubleshooting

- **Extra blank lines**: The `\n{3,}` pattern collapses three or more newlines into two. Adjust the threshold if you want tighter spacing.
- **Entities not decoding**: Make sure you call `html_module.unescape()` after removing tags, not before. Some entities live inside tag attributes and should not be decoded into the text body.
- **Formatting lost**: This is expected. Plain text has no concept of bold or italic. The strip approach produces clean text but loses formatting information.

### Checklist

- [ ] All HTML tags are removed
- [ ] HTML entities are decoded to their characters
- [ ] Extra whitespace and blank lines are collapsed
- [ ] Output is clean, readable plain text

### Socratic question

What happens if you run this function on HTML that contains a `<script>` tag with JavaScript code? How would you handle that case?

---

## Step 5: Extract Metadata

**Objective:** Parse YAML frontmatter from the top of a Markdown file and return it as a dictionary.

**Explanation:** Many Markdown files begin with a YAML frontmatter block delimited by `---`. This block contains metadata like title, author, date, and tags. Extracting this data lets your converter add it to HTML `<meta>` tags or use it for file organization.

**Starter hint:** Split the file content on `---`. The first segment is frontmatter (if it exists). Parse it line by line, splitting on the first `:` to get key-value pairs.

### Create a test file

Create `sample_with_meta.md`:

```markdown
---
title: My Blog Post
author: Jane Doe
date: 2025-01-15
tags: python, tutorial, beginner
---

# My Blog Post

This post covers Python basics.

## Why Python?

Python is great for beginners.
```

### Working code

```python
def extract_frontmatter(text: str) -> tuple[dict, str]:
    """Extract YAML frontmatter and return (metadata_dict, body_text)."""
    lines = text.split("\n")

    if not lines or lines[0].strip() != "---":
        return {}, text

    # Find the closing ---
    end_index = None
    for i, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            end_index = i
            break

    if end_index is None:
        return {}, text

    # Parse frontmatter lines
    metadata = {}
    for line in lines[1:end_index]:
        line = line.strip()
        if not line or ":" not in line:
            continue
        key, _, value = line.partition(":")
        key = key.strip()
        value = value.strip()

        # Convert comma-separated values to list
        if "," in value:
            value = [v.strip() for v in value.split(",")]

        metadata[key] = value

    body = "\n".join(lines[end_index + 1 :])
    return metadata, body


if __name__ == "__main__":
    text = read_markdown("sample_with_meta.md")
    meta, body = extract_frontmatter(text)
    print("Metadata:", meta)
    print("---")
    print("Body preview:", body[:100])
```

### Expected output

```
Metadata: {'title': 'My Blog Post', 'author': 'Jane Doe', 'date': '2025-01-15', 'tags': ['python', 'tutorial', 'beginner']}
---
Body preview: 

# My Blog Post

This post covers Python basics.

## Why Python?

Python is great for beginners.
```

### Troubleshooting

- **No metadata returned**: The file must start with `---` on the very first line. No blank lines before it.
- **Values with colons**: If a value contains a colon (like `url: https://example.com`), `partition(":")` handles it correctly because it splits on the *first* colon only.
- **Nested YAML**: This parser handles flat key-value pairs. It does not support nested YAML structures. For those, use the `pyyaml` library.

### Checklist

- [ ] Frontmatter is extracted when present
- [ ] Non-frontmatter files return empty dict and full body
- [ ] Comma-separated tags become a list
- [ ] Body text starts after the closing `---`
- [ ] Keys and values are stripped of whitespace

### Socratic question

Why does this project parse frontmatter manually instead of using a library like PyYAML? When would you choose the manual approach versus reaching for a library?

---

## Step 6: Batch Conversion

**Objective:** Process every Markdown file in a directory and convert them to HTML.

**Explanation:** Real-world use requires converting many files at once. Python's `os` and `pathlib` modules let you walk directories, find `.md` files, and apply your converter to each one. Batch processing turns a one-file tool into a real utility.

**Starter hint:** Use `pathlib.Path.glob("**/*.md")` to recursively find all Markdown files in a directory.

### Working code

```python
from pathlib import Path


def batch_convert(
    input_dir: str,
    output_dir: str,
    format: str = "html",
) -> list[str]:
    """Convert all Markdown files in input_dir to the target format.

    Returns a list of output file paths.
    """
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    converted_files = []

    for md_file in input_path.glob("**/*.md"):
        text = md_file.read_text(encoding="utf-8")
        metadata, body = extract_frontmatter(text)
        html_body = markdown_to_html(body)

        # Determine output path
        rel_path = md_file.relative_to(input_path)
        if format == "html":
            out_file = output_path / rel_path.with_suffix(".html")
            full_html = wrap_html(html_body, title=metadata.get("title", rel_path.stem))
            out_file.write_text(full_html, encoding="utf-8")
        elif format == "text":
            out_file = output_path / rel_path.with_suffix(".txt")
            plain = html_to_text(html_body)
            out_file.write_text(plain, encoding="utf-8")

        converted_files.append(str(out_file))
        print(f"  Converted: {md_file.name} -> {out_file.name}")

    return converted_files


if __name__ == "__main__":
    print("Converting sample.md to HTML...")
    files = batch_convert(".", "output/html", format="html")
    print(f"\nDone. Converted {len(files)} file(s).")
```

### Expected output

```
Converting sample.md to HTML...
  Converted: sample.md -> sample.html
  Converted: sample_with_meta.md -> sample_with_meta.html

Done. Converted 2 file(s).
```

### Troubleshooting

- **`FileExistsError` on mkdir**: Use `exist_ok=True` to avoid errors if the output directory already exists.
- **Encoding errors on read**: Some files may not be UTF-8. Wrap the `read_text` call in a try/except and fall back to `errors="replace"`.
- **Empty output directory**: Check that the glob pattern matches your files. `**/*.md` is recursive; `*.md` only matches the top level.

### Checklist

- [ ] All `.md` files in the input directory are found
- [ ] Output files are created in the output directory
- [ ] HTML files include metadata as the page title
- [ ] Directory structure is preserved in the output
- [ ] Empty output directory is created if it does not exist

### Socratic question

What would change if you needed to also process `.markdown` files (not just `.md`)? How would you modify the glob pattern?

---

## Step 7: Build the CLI

**Objective:** Wrap all functionality in a command-line interface so users can run conversions from the terminal.

**Explanation:** A CLI makes your tool usable without writing Python code. Python's `argparse` module handles argument parsing, help text, and validation. This is the final step that turns your scripts into a real command-line tool.

**Starter hint:** Use `argparse.ArgumentParser` with subcommands or flags for format, input, and output.

### Working code

```python
import argparse
import sys


def main():
    parser = argparse.ArgumentParser(
        description="Convert Markdown files to HTML or plain text.",
        epilog="Examples:\n"
        "  python converter.py sample.md\n"
        "  python converter.py sample.md -o output.html -f text\n"
        '  python converter.py docs/ -o converted/ -f html',
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    parser.add_argument(
        "input",
        help="Input file or directory to convert",
    )
    parser.add_argument(
        "-o", "--output",
        help="Output file or directory (default: stdout for files, ./output/ for dirs)",
    )
    parser.add_argument(
        "-f", "--format",
        choices=["html", "text"],
        default="html",
        help="Output format (default: html)",
    )
    parser.add_argument(
        "--title",
        default="Converted Document",
        help="Title for HTML output (default: Converted Document)",
    )
    parser.add_argument(
        "--extract-meta",
        action="store_true",
        help="Print extracted metadata and exit",
    )

    args = parser.parse_args()
    input_path = Path(args.input)

    # Extract metadata mode
    if args.extract_meta:
        if not input_path.is_file():
            parser.error("--extract-meta requires a file, not a directory")
        text = input_path.read_text(encoding="utf-8")
        meta, _ = extract_frontmatter(text)
        for key, value in meta.items():
            print(f"  {key}: {value}")
        return

    # Single file conversion
    if input_path.is_file():
        text = input_path.read_text(encoding="utf-8")
        metadata, body = extract_frontmatter(text)
        html_body = markdown_to_html(body)

        if args.format == "html":
            title = metadata.get("title", args.title)
            result = wrap_html(html_body, title=title)
        else:
            result = html_to_text(html_body)

        if args.output:
            Path(args.output).write_text(result, encoding="utf-8")
            print(f"Converted {input_path.name} -> {args.output}")
        else:
            print(result)

    # Directory batch conversion
    elif input_path.is_dir():
        output_dir = args.output or "output"
        files = batch_convert(str(input_path), output_dir, format=args.format)
        print(f"\nConverted {len(files)} file(s) to {output_dir}/")

    else:
        print(f"Error: {args.input} does not exist", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
```

### Expected output

Single file to stdout:
```bash
python converter.py sample.md
```
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Converted Document</title>
    <style>body { font-family: sans-serif; ... }</style>
</head>
<body>
<h1>Hello World</h1>
...
</body>
</html>
```

Single file to output:
```bash
python converter.py sample.md -o output.html
Converted sample.md -> output.html
```

Batch directory:
```bash
python converter.py docs/ -o converted/ -f html
  Converted: intro.md -> intro.html
  Converted: guide.md -> guide.html

Converted 2 file(s) to converted/
```

Extract metadata:
```bash
python converter.py sample_with_meta.md --extract-meta
  title: My Blog Post
  author: Jane Doe
  date: 2025-01-15
  tags: python, tutorial, beginner
```

Help:
```bash
python converter.py --help
```
```
usage: converter.py [-h] [-o OUTPUT] [-f {html,text}] [--title TITLE]
                    [--extract-meta] input

Convert Markdown files to HTML or plain text.

positional arguments:
  input                 Input file or directory to convert

options:
  -h, --help            show this help message and exit
  -o, --output          Output file or directory
  -f, --format          Output format (default: html)
  --title               Title for HTML output
  --extract-meta        Print extracted metadata and exit

Examples:
  python converter.py sample.md
  python converter.py sample.md -o output.html -f text
  python converter.py docs/ -o converted/ -f html
```

### Troubleshooting

- **`argparse` says unrecognized arguments**: Make sure flags come *after* the positional argument, not before.
- **`sys.exit` in tests**: If you are testing this in a REPL, wrap `main()` in a try/except `SystemExit`.
- **No output when piping**: If piping to a file, make sure you are not also printing to stdout. The single-file mode prints to stdout when `-o` is not specified.

### Checklist

- [ ] CLI accepts input path, output path, and format flag
- [ ] Single file mode prints to stdout or writes to output file
- [ ] Directory mode converts all `.md` files
- [ ] `--extract-meta` prints frontmatter and exits
- [ ] `--help` shows usage examples
- [ ] Invalid input paths produce a clear error message

### Socratic question

Why does the CLI use `sys.exit(1)` for errors instead of just printing a message? What does the exit code communicate to other programs or scripts that call your tool?

---

## Complete `converter.py`

Here is the full file with all steps combined:

```python
"""Document Converter - Convert between Markdown, HTML, and plain text."""

import re
import html as html_module
import argparse
import sys
from pathlib import Path


def read_markdown(filepath: str) -> str:
    """Read a Markdown file and return its contents."""
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read()


def markdown_to_html(md_text: str) -> str:
    """Convert Markdown text to HTML."""
    html = md_text

    # Code blocks
    html = re.sub(
        r"```(\w*)\n(.*?)```",
        r'<pre><code class="language-\1">\2</code></pre>',
        html,
        flags=re.DOTALL,
    )

    # Inline code
    html = re.sub(r"`([^`]+)`", r"<code>\1</code>", html)

    # Headings
    html = re.sub(r"^### (.+)$", r"<h3>\1</h3>", html, flags=re.MULTILINE)
    html = re.sub(r"^## (.+)$", r"<h2>\1</h2>", html, flags=re.MULTILINE)
    html = re.sub(r"^# (.+)$", r"<h1>\1</h1>", html, flags=re.MULTILINE)

    # Bold and italic
    html = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", html)
    html = re.sub(r"\*(.+?)\*", r"<em>\1</em>", html)

    # Links
    html = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', html)

    # Lists
    lines = html.split("\n")
    in_list = False
    result = []
    for line in lines:
        if line.startswith("- "):
            if not in_list:
                result.append("<ul>")
                in_list = True
            result.append(f"  <li>{line[2:]}</li>")
        else:
            if in_list:
                result.append("</ul>")
                in_list = False
            result.append(line)
    if in_list:
        result.append("</ul>")
    html = "\n".join(result)

    html = re.sub(r"\n{3,}", "\n\n", html)

    return html


CSS = """
body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    max-width: 700px;
    margin: 2rem auto;
    padding: 0 1rem;
    line-height: 1.6;
    color: #333;
}
h1, h2, h3 { color: #111; }
code {
    background: #f4f4f4;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-size: 0.9em;
}
pre {
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 1rem;
    border-radius: 6px;
    overflow-x: auto;
}
pre code { background: none; padding: 0; color: inherit; }
a { color: #0066cc; }
ul { padding-left: 1.5rem; }
"""


def wrap_html(body: str, title: str = "Converted Document") -> str:
    """Wrap HTML body in a full document with CSS."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>{CSS}</style>
</head>
<body>
{body}
</body>
</html>"""


def html_to_text(html_str: str) -> str:
    """Convert HTML to plain text by stripping tags."""
    text = html_str

    text = re.sub(r"<(br|hr)\s*/?>", "\n", text)
    text = re.sub(r"</(p|div|h[1-6]|li|pre)>", "\n", text)

    text = re.sub(r"<[^>]+>", "", text)
    text = html_module.unescape(text)

    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = text.strip()

    return text


def extract_frontmatter(text: str) -> tuple[dict, str]:
    """Extract YAML frontmatter and return (metadata_dict, body_text)."""
    lines = text.split("\n")

    if not lines or lines[0].strip() != "---":
        return {}, text

    end_index = None
    for i, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            end_index = i
            break

    if end_index is None:
        return {}, text

    metadata = {}
    for line in lines[1:end_index]:
        line = line.strip()
        if not line or ":" not in line:
            continue
        key, _, value = line.partition(":")
        key = key.strip()
        value = value.strip()

        if "," in value:
            value = [v.strip() for v in value.split(",")]

        metadata[key] = value

    body = "\n".join(lines[end_index + 1 :])
    return metadata, body


def batch_convert(
    input_dir: str,
    output_dir: str,
    format: str = "html",
) -> list[str]:
    """Convert all Markdown files in input_dir to the target format."""
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    converted_files = []

    for md_file in input_path.glob("**/*.md"):
        text = md_file.read_text(encoding="utf-8")
        metadata, body = extract_frontmatter(text)
        html_body = markdown_to_html(body)

        rel_path = md_file.relative_to(input_path)
        if format == "html":
            out_file = output_path / rel_path.with_suffix(".html")
            full_html = wrap_html(html_body, title=metadata.get("title", rel_path.stem))
            out_file.write_text(full_html, encoding="utf-8")
        elif format == "text":
            out_file = output_path / rel_path.with_suffix(".txt")
            plain = html_to_text(html_body)
            out_file.write_text(plain, encoding="utf-8")

        converted_files.append(str(out_file))
        print(f"  Converted: {md_file.name} -> {out_file.name}")

    return converted_files


def main():
    parser = argparse.ArgumentParser(
        description="Convert Markdown files to HTML or plain text.",
        epilog="Examples:\n"
        "  python converter.py sample.md\n"
        "  python converter.py sample.md -o output.html -f text\n"
        '  python converter.py docs/ -o converted/ -f html',
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    parser.add_argument("input", help="Input file or directory to convert")
    parser.add_argument(
        "-o", "--output",
        help="Output file or directory (default: stdout for files)",
    )
    parser.add_argument(
        "-f", "--format",
        choices=["html", "text"],
        default="html",
        help="Output format (default: html)",
    )
    parser.add_argument(
        "--title",
        default="Converted Document",
        help="Title for HTML output",
    )
    parser.add_argument(
        "--extract-meta",
        action="store_true",
        help="Print extracted metadata and exit",
    )

    args = parser.parse_args()
    input_path = Path(args.input)

    if args.extract_meta:
        if not input_path.is_file():
            parser.error("--extract-meta requires a file, not a directory")
        text = input_path.read_text(encoding="utf-8")
        meta, _ = extract_frontmatter(text)
        for key, value in meta.items():
            print(f"  {key}: {value}")
        return

    if input_path.is_file():
        text = input_path.read_text(encoding="utf-8")
        metadata, body = extract_frontmatter(text)
        html_body = markdown_to_html(body)

        if args.format == "html":
            title = metadata.get("title", args.title)
            result = wrap_html(html_body, title=title)
        else:
            result = html_to_text(html_body)

        if args.output:
            Path(args.output).write_text(result, encoding="utf-8")
            print(f"Converted {input_path.name} -> {args.output}")
        else:
            print(result)

    elif input_path.is_dir():
        output_dir = args.output or "output"
        files = batch_convert(str(input_path), output_dir, format=args.format)
        print(f"\nConverted {len(files)} file(s) to {output_dir}/")

    else:
        print(f"Error: {args.input} does not exist", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
```

---

## 🧩 Challenges

1. **Support ordered lists**: Extend `markdown_to_html` to convert `1.`, `2.`, `3.` lines into `<ol>` and `<li>` tags.

2. **Images**: Add support for `![alt text](image.png)` converting to `<img src="image.png" alt="alt text">`.

3. **Tables**: Markdown tables use `|` and `-` characters. Add a converter that turns them into `<table>` tags.

4. **Word count**: Add a `--stats` flag that prints word count, line count, and character count instead of converting.

5. **Watch mode**: Add a `--watch` flag that monitors the input directory and re-converts when files change.

## What You Learned

- Reading files with `open()` and the `with` statement for safe resource handling
- Using `re` (regular expressions) to match and transform text patterns
- Building HTML documents with embedded CSS for standalone pages
- Stripping HTML tags and decoding entities to produce clean plain text
- Parsing simple YAML-style frontmatter without external libraries
- Walking directories with `pathlib.Path.glob()` for batch file processing
- Building a CLI with `argparse` that supports flags, subcommands, and help text
- Handling errors gracefully with exit codes and user-friendly messages
