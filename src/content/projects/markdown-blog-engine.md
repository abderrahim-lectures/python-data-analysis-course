---
title: "Build a Markdown Blog Engine"
description: "Build a static site generator that turns a folder of Markdown posts into a real HTML blog, frontmatter parsing, markup rendering, and a tag-filtered index page."
difficulty: "intermediate"
estimatedMinutes: 90
tags: ["cli", "frontend", "data-pipeline", "file-io"]
learningObjectives:
  - "Parse YAML frontmatter from Markdown files by hand"
  - "Convert Markdown source into HTML with the markdown library"
  - "Render templates with Python f-strings and string.Template"
  - "Assemble posts and a tag index into a complete static site"
prerequisites: ["python-101/file-io", "python-101/strings", "python-101/data-structures", "python-101/functions"]
---

# 📝 Build a Markdown Blog Engine

The web is built on static sites, a folder of plain-text posts, one render step, and a pile of HTML files that need no server, no database, and no JavaScript framework to serve. This project builds a miniature static site generator: it reads a `posts/` folder of Markdown files, parses each one's YAML frontmatter for title/date/tags, renders the body to HTML, and outputs a complete `site/` with an index page and tag-filtered post listings, the same shape as the engines behind a thousand real blogs.

This assumes Python 101, file I/O, strings, dictionaries, and functions. Nothing beyond that: no framework, no database, no external services. It's optional and ungraded; see [Real-World Projects](/projects) for the full list.

## 🎯 What you'll do

1. Design one Markdown-plus-frontmatter file format and split it cleanly into metadata and body.
2. Parse the YAML frontmatter into a Python dict, a tiny parser that handles quoting and lists.
3. Render the Markdown body to HTML with a library, and escape anything dangerous.
4. Build an index page that lists all posts, plus per-tag filtered pages.
5. Run the generator over a folder of real posts and inspect the finished site in a browser.

## Where to run this

**Locally with `uv`** is the primary path here. The reward of this project is opening `site/index.html` in a real browser, and the "write a folder of posts, run one command, published site" loop is most honest when the posts and the output live on an actual filesystem you can poke at.

**GitHub Codespaces** is an equally good path, open [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and everything below, including the browser preview, works the same from a Cloudflare- or `python -m http.server`-served tab. There's no local GitHub Page claim here, it's just a dev box where the commands are identical.

**Google Colab, Kaggle Notebooks, and Binder are a decent way to *see the machinery run*, but weak for the pay-off.** The notebook below generates a pretend `posts/` folder in memory and renders the full site to a directory you can inspect cell-by-cell, so parsing, templating, and assembly all run honestly. What it can't do well is the real loop of *you writing your own post.md and refreshing the page*; that's a filesystem-plus-browser workout, which is what the local or Codespace path gives you. Use the notebook to learn the steps; switch to `uv` when you want to publish.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/markdown-blog-engine/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/markdown-blog-engine/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fmarkdown-blog-engine%2Fnotebook.ipynb)

## Setup

Everything you need before writing the generator: `uv` for a modern Python, one Markdown library, and a `posts/` folder with two realistic posts to chew on.

### Install `uv` and the one dependency

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Close and reopen your terminal, then:

```bash
uv --version
mkdir markdown-blog-engine && cd markdown-blog-engine
uv init --bare
uv add markdown
```

### Write two starter posts

Paste these into `posts/hello.md` and `posts/python-tips.md`:

```markdown
---
title: "Hello, world from Markdown"
date: "2026-08-03"
tags: "intro, meta"
---

A blog in **Markdown**? Sure. Here is the first post, rendered by *our own* tool.

## Why this exists

We are about to write a static site generator. This paragraph is **bold** on purpose, so the render step has something to do.
```

```markdown
---
title: "Three Python tips"
date: "2026-08-04"
tags: "python, tips"
---

1. Use `enumerate` instead of `range(len(...))`.
2. Prefer dicts to parallel lists.
3. **Test** your parser on bad input.
```

```bash
mkdir posts
# save the two blocks above as posts/hello.md and posts/python-tips.md
ls -la posts
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `markdown` installed via `uv add markdown`.
- ✅ `posts/hello.md` and `posts/python-tips.md` exist, each starting with a `---`-delimited frontmatter block.

## Step 1: Split a file into frontmatter and body

A static-site post is really two parts in one file: a small YAML block of metadata between two `---` lines, then the Markdown body. The generator's first job is a clean, boring split: up to the second `---` is frontmatter, everything after is the body. Getting this split *robust* before any fancy rendering is the difference between a tool you trust and one that silently drops posts.

### 1.1 Write the splitter

```python
# engine.py
from pathlib import Path

def read_post(path: str) -> dict:
    text = Path(path).read_text(encoding="utf-8")
    if not text.startswith("---"):
        raise ValueError(f"{path}: no frontmatter block")
    lines = text.splitlines()
    end = next(i for i, l in enumerate(lines[1:], start=1) if l.strip() == "---")
    frontmatter = "\n".join(lines[1:end])
    body = "\n".join(lines[end + 1:])
    return {"path": path, "frontmatter": frontmatter, "body": body}

if __name__ == "__main__":
    for p in sorted(Path("posts").glob("*.md")):
        post = read_post(str(p))
        print(f"--- {p} ---")
        print("frontmatter:", post["frontmatter"].splitlines()[0])
        print("body starts:", repr(post["body"].splitlines()[0]))
```

`next((i for i, l in enumerate(...) if ...))` finds the *second* `---` line in one pass, the first is consumed by `startswith`, and everything after the second is body. The generator expression raises `StopIteration` on a malformed file, which is a loud, honest failure rather than half-parsed garbage flowing silently downstream.

**👟 Starter hint:** Run `engine.py` on the two starter posts and confirm the split places the right first lines into each half, frontmatter first line is a title, body first line is prose.

**🎯 Expected output:** For each post, one line showing a `frontmatter` first line like `title: "Hello, world from Markdown"` and one showing a `body` first line like `'A blog in **Markdown**? Sure. ...'`.

**🩹 If it's off:** If `StopIteration` crawls up as a traceback, a post lacks its closing `---`, add it (the split *must* see a second separator). If the body includes the closing `---`, your `end` index is off by one, check `lines[end + 1:]` starts *after* that line, not on it.

### 1.2 Verify the split

**✅ Checklist**

- ✅ Both starter posts split into a frontmatter string and a body string with no `---` lines leaking into either.
- ✅ Removing the leading `---` from a post file makes `read_post` raise a clear `ValueError` with the filename.
- ✅ You can predict what `read_post` returns for a file with *three* `---` lines (the split uses the second one; the third becomes body).

**🤔 Socratic Question(s)**

- We find the closing `---` by scanning for a line that's exactly `---`. What would happen with a body line that is itself `---`? Is the failure mode a silent wrong split or a loud one, and which would you rather have?
- The splitter returns the raw frontmatter *string*. What does that imply about the empty-string edge case where two posts together have stray blank lines, and where in the pipeline do you think parsing should happen?

## Step 2: Parse the YAML frontmatter

Now the frontmatter string becomes a real dict, `title`, `date`, `tags`, so the rest of the engine can do `post["title"]` instead of re-parsing text. YAML is a rabbit hole; a generator only needs the ~4 rules that cover our own files: `key: value`, quoted values with colons, and comma-separated lists.

### 2.1 Write a tiny YAML-subset parser

```python
# engine.py (continued)

def parse_frontmatter(raw: str) -> dict:
    data = {}
    for line in raw.splitlines():
        if not line.strip():
            continue
        key, value = line.split(":", 1)
        value = value.strip()
        if value.startswith('"') and value.endswith('"'):
            value = value[1:-1]
        elif "," in value:
            value = [v.strip() for v in value.split(",")]
        elif not value:
            value = []
        data[key.strip()] = value
    return data

if __name__ == "__main__":
    for p in sorted(Path("posts").glob("*.md")):
        meta = parse_frontmatter(read_post(str(p))["frontmatter"])
        print(p, "->", meta)
```

`line.split(":", 1)` is the line that makes this safe: splitting once keeps any colons *inside the value* (like `08:30` or `https://...`) untouched, because the second part isn't split again. The value then takes one of three shapes, unquoted string, quoted string with quotes stripped, or comma list, which is the whole YAML subset we promised.

**👟 Starter hint:** Print the parsed dict for both posts before writing a single line of the renderer, you want to see `tags` become a list, not a string.

**🎯 Expected output:** Two lines like `posts/hello.md -> {'title': 'Hello, world from Markdown', 'date': '2026-08-03', 'tags': ['intro', 'meta']}`, note `tags` is a real list.

**🩹 If it's off:** If `title` keeps its quotes, the `startswith/endswith` quote-stripping branch isn't matching, check for a trailing space *after* the closing quote in the file (we `strip()` quotes but the value was already stripped). If `tags` comes out as one string `'intro, meta'`, the `"," in value` check ran before stripping, order matters: strip first, then branch.

### 2.2 Verify YAML parsing

**✅ Checklist**

- ✅ `parse_frontmatter` returns a dict where `tags` is a `list` and `title` is a bare string with no quotes.
- ✅ A value like `date: "2026-08-04"` parses to `'2026-08-04'` with quotes removed.
- ✅ A frontmatter line *missing* its value (`author:`) yields an empty list, and you can explain why `[]` is chosen over `None`.

**🤔 Socratic Question(s)**

- Our parser can't handle a nested list or a block `oneline: | ...`. Write the smallest frontmatter that would *silently* misparse, and decide whether that's acceptable for a personal blog engine (hint: name the failure loud vs. quiet).
- A real YAML parser (like `PyYAML`, the library real tools use) supports anchors, multi-line strings, and 100 more features. What's the cost of dragging that into a project whose files you control? When does "just install PyYAML" become the right call?

## Step 3: Render Markdown to HTML

Parsing produces text; rendering produces a page. The `markdown` library converts `**bold**`, `# heading`, and fenced code into `<strong>`, `<h1>`, and `<pre>` tags. There's a security wrinkle in the HTML that comes out, the body might contain raw HTML, and a hostile one can carry JavaScript. The tried-and-true fix, `bleach`, may already be on your wheel. So the renderer does two jobs: convert, then sanitize.

### 3.1 Convert and sanitize

```python
# render.py
from pathlib import Path

try:
    from bleach import clean
except ImportError:
    def clean(text: str, **kwargs) -> str:
        return text

import markdown as md

def to_html(body: str) -> str:
    raw = md.markdown(body, extensions=["fenced_code", "tables"])
    return clean(raw, tags={"p", "h1", "h2", "h3", "em", "strong", "code",
                            "pre", "ul", "ol", "li", "blockquote", "img",
                            "a", "table", "thead", "tbody", "tr", "td", "th"},
                  attributes={"a": {"href", "title"}, "img": {"src", "alt"}})

if __name__ == "__main__":
    body = "**Bold here** with <script>alert('x')</script> and `code`."
    print(to_html(body))
```

`bleach` is the *allowlist* mindset in action: instead of trying to catch every malicious thing (a losing game), you declare exactly which tags and attributes may survive, and everything else, the `<script>`, is dropped. The `try/except` import is deliberate: the code runs even on a bare install, degrading to no sanitization, and prints a warning-free fallback so the notebook and full install share one file.

**👟 Starter hint:** Install bleach with `uv add bleach`, then run `render.py` and confirm the `<script>` tag is gone from the output while `**Bold**` became `<strong>`.

**🎯 Expected output:** HTML where `<strong>Bold here</strong>` is present and `<script>`/`alert(...)` are entirely absent, the script tags removed by the allowlist.

**🩹 If it's off:** If `<script>` still appears in the output, you're hitting the degraded `clean` fallback, check `uv add bleach` succeeded and the import path (`from bleach import clean`) is correct. If bold didn't render, `md.markdown` with `extensions=["fenced_code", "tables"]` is being called on the *body string that still has frontmatter*, make sure `read_post` split it off first.

### 3.2 Verify rendering

**✅ Checklist**

- ✅ `to_html("**x**")` returns HTML containing `<strong>x</strong>`.
- ✅ `to_html("<script>...")` returns HTML with no `<script>`, `<iframe>`, or `onclick=` attributes.
- ✅ Fenced code blocks (```` ```python ````) survive rendering as `<pre>`/`<code>`.

**🤔 Socratic Question(s)**

- We strip raw HTML *after* Markdown conversion. Most real Markdown engines pass raw HTML through untouched, which is why `md` + a sanitizer is the "convert, then allowlist" belt-and-suspenders order. What attack would survive if you sanitized *before* conversion instead (hint: every `<` in a code block is meaningful to the converter)?
- The allowlist keeps `img` but only `src`/`alt` attributes. What's the concrete risk if you added `onerror` to the allowed attributes, write the one-line HTML that fires it.

## Step 4: Assemble the pages

Now the generator earns the word "site": each post becomes its own `.html` file, and the index/tag pages are *derived* from the posts. Derivation is the core trick of static generation, you never hand-write the index; you compute it every run, so "add a post, rerun, index updates" is always true.

### 4.1 Build the page template and the writer

```python
# sitegen.py
from pathlib import Path
from engine import read_post, parse_frontmatter
from render import to_html

PAGE = """<!doctype html>
<html><head><meta charset="utf-8">
<title>{title}</title></head>
<body>
<header><a href="index.html">All posts</a></header>
<h1>{title}</h1>
<p class="meta">{date} &middot; {tags}</p>
<article>{body_html}</article>
<footer><p><a href="index.html">&larr; back to index</a></p></footer>
</body></html>"""

def build_post(post_path: str, out_dir: Path) -> dict:
    raw = read_post(post_path)
    meta = parse_frontmatter(raw["frontmatter"])
    meta.setdefault("title", "Untitled")
    meta.setdefault("date", "unknown")
    tags = ", ".join(meta.get("tags", []))
    html = PAGE.format(title=meta["title"], date=meta["date"],
                       tags=tags, body_html=to_html(raw["body"]))
    out = out_dir / f"{Path(post_path).stem}.html"
    out.write_text(html, encoding="utf-8")
    return {"slug": Path(post_path).stem, "title": meta["title"],
            "date": meta["date"], "tags": meta.get("tags", [])}

if __name__ == "__main__":
    out = Path("site")
    out.mkdir(exist_ok=True)
    posts = sorted((build_post(str(p), out) for p in Path("posts").glob("*.md")),
                   key=lambda d: d["date"], reverse=True)
    print("built:", [p["slug"] for p in posts])
```

`PAGE` is a tiny template with `{name}` slots filled by `.format()`, model, view, and controller squashed into one string, which is *enough* for a generator of this size. The sort by date (newest first) is the first *view* that depends on metadata, and `build_post`'s return value, not the file it wrote, is what the index page will consume, so the index never re-parses files twice.

**👟 Starter hint:** Run `sitegen.py`, then `open site/hello.html` (or `start`/`xdg-open` on your OS) and look at a real rendered post before building the index.

**🎯 Expected output:** `built: ['python-tips', 'hello']` (newest first, `python-tips` dates 2026-08-04) and two hand-sized `.html` files under `site/` that render in a browser with a title, meta line, and article body.

**🩹 If it's off:** If `KeyError: 'title'` fires, a post's frontmatter lacks `title`, the `setdefault` calls in `build_post` exist to absorb that; if you see the error, the setdefaults were placed *after* a `.format` that already ran. If `site/` accumulates stale pages from deleted posts, that's expected for now: clean `site/` before each build, or call it a feature and delete by hand.

### 4.2 Build the index with per-tag links

```python
# sitegen.py (continued)

def build_index(posts: list[dict], out_dir: Path) -> None:
    items = "\n".join(
        f'<li><a href="{p["slug"]}.html">{p["title"]}</a> '
        f'<small>({p["date"]})</small></li>' for p in posts)
    (out_dir / "index.html").write_text(
        f"""<!doctype html><html><head><meta charset="utf-8"><title>My blog</title></head>
<body><h1>My blog</h1><ul>{items}</ul>
<p>Tags: {tags_block(posts)}</p></body></html>""", encoding="utf-8")

def tags_block(posts: list[dict]) -> str:
    by_tag = {}
    for p in posts:
        for t in p["tags"]:
            by_tag.setdefault(t, []).append(p["slug"])
    return " ".join(f'<a href="tag-{t}.html">{t}</a>' for t in sorted(by_tag))

if __name__ == "__main__":
    # ...build_post loop as above, then:
    build_index(posts, out)  # referenced 'posts' from the previous block
    print("index written")
```

`by_tag.setdefault(t, []).append(...)` is the "build a dict of lists" idiom in one line, the alternative `if t not in by_tag: by_tag[t] = []` is the same thing spelled out. The index is entirely *derived*: it contains zero handwritten HTML, so it can never disagree with the posts folder. That invariant is the whole reason static generation beats hand-maintaining an index.

**👟 Starter hint:** Add `build_index` and `tags_block`, re-run, then open `index.html` and click a tag link, *read* the 404 before fixing it; you'll see exactly what the next micro-step must create.

**🎯 Expected output:** `site/index.html` lists both posts newest-first, shows a "Tags:" line with `intro`, `meta`, `python`, `tips` linking to `tag-intro.html` etc., and each post's own page links back to the index.

**🩹 If it's off:** If a tag link 404s, that's *correct behavior*, the target pages don't exist yet, and Step 5 is specifically the generation of `tag-*.html`. If index shows posts in the wrong order, the `sorted(..., key=lambda d: d["date"], reverse=True)` must run on the collected list *before* `build_index`, not after.

### 4.3 Verify assembly

**✅ Checklist**

- ✅ `site/hello.html` and `site/python-tips.html` open in a browser with real title, meta, and rendered body.
- ✅ `index.html` lists both posts newest-first and points at existing `.html` files (tag links may 404 until Step 5).
- ✅ Re-running the build after editing a post produces updated HTML, the index and pages never disagree with `posts/`.

**🤔 Socratic Question(s)**

- `build_index` receives a *list of dicts* rather than re-reading the filesystem. What breaks, concretely, if it instead re-parsed `posts/*.md` itself? (Hint: two sources of truth and a sorting inconsistency.)
- The index page and the tag page both depend on `posts`. If a post has tags `["a", "b"]`, the index joins them with a comma but the tag page *groups* by them. Name one place where these two derivations could diverge, and what rule would keep them identical.

## Step 5: Generate per-tag pages

The index is one derived view; a "shows only posts with tag X" page is a *filtered* derived view. The loop that writes one page per tag is the same shape as every "generate one artifact per item in a collection" tool, a per-item template with the item substituted in.

### 5.1 Write the tag pages

```python
# sitegen.py (continued)

def build_tag_pages(posts: list[dict], out_dir: Path) -> None:
    by_tag = {}
    for p in posts:
        for t in p["tags"]:
            by_tag.setdefault(t, []).append(p)
    for tag, tagged in sorted(by_tag.items()):
        items = "\n".join(
            f'<li><a href="{p["slug"]}.html">{p["title"]}</a></li>'
            for p in tagged)
        (out_dir / f"tag-{tag}.html").write_text(
            f"""<!doctype html><html><head><meta charset="utf-8"><title>tag: {tag}</title></head>
<body><h1>Posts tagged "{tag}"</h1><ul>{items}</ul>
<p><a href="index.html">&larr; index</a></p></body></html>""",
            encoding="utf-8")

if __name__ == "__main__":
    build_tag_pages(posts, out)
    print("tag pages written:", sorted(t for t in Path("site").glob("tag-*.html")))
```

The grouping here is `setdefault` again, the same idiom from Step 4, now retained per tag into `tagged` which is a list of *post dicts*, not slugs, so the template has title and slug at hand. Each tag page is a one-item-per-post `<li>`, exactly like the index minus the date and minus every non-matching post.

**👟 Starter hint:** Re-run the build and click every tag link on the index, this step converts each previous 404 into a real page.

**🎯 Expected output:** `tag-intro.html`, `tag-meta.html`, `tag-python.html`, `tag-tips.html` exist under `site/`, each listing the matching posts, and every tag link on the index now resolves.

**🩹 If it's off:** If a tag page contains the wrong posts, the grouping appended `p`, the whole dict, while `items` builds from `p["slug"]`; a wrong grouping means you grouped by a stale copy of `posts`. If a tag with no posts shows an empty `<ul>`, you built `by_tag` from an empty posts list, re-check that `build_tag_pages` runs *after* `posts` is collected.

### 5.2 Verify the finished site

**✅ Checklist**

- ✅ Every link on `index.html`, posts *and* tags, resolves to an existing file.
- ✅ `tag-python.html` lists `Three Python tips` and not `Hello, world`.
- ✅ `site/` contains exactly: `hello.html`, `python-tips.html`, a `tag-*.html` per distinct tag, and `index.html`.

**🤔 Socratic Question(s)**

- The tag page template repeats the index template with two differences. It works, but when would you refactor both into one shared `post_list_page(title, posts)`? Name the concrete smell that triggers the refactor.
- We write `tag-{tag}.html` with a raw tag string from an untrusted frontmatter. If a post's tag were `../evil`, what does the file path become, and what's the minimal sanitization you'd add before using any tag in a filename? (Hint: think `slugify`.)

## ⚠️ Common pitfalls

- **The second-`---` search being off by one.** Both `next(...)` and the slice `lines[end + 1:]` must agree on which line is "the" separator; a one-line slip silently attaches the closing `---` to the body, which the Markdown renderer then happily renders as a `<hr>`. Fix it by asserting `body` never starts with `---` in a small test.
- **Unterminated frontmatter.** A post you were editing in the middle of gets saved without its closing `---`; the generator then can't find the split and dies with a cryptic traceback. Verifying the split *exists* up front, and raising `ValueError` with the filename, turns a 30-minute mystery into a two-second fix.
- **Sanitizing *or* rendering, not both.** Rendering to HTML without passing through `bleach` lets a `post.md` carry `<script>` into your visitors' browsers; sanitizing without rendering leaves Markdown visible as raw text. The belt-and-suspenders order (convert, then allowlist) is the whole point of Step 3, real engines get this wrong too.
- **Two sources of truth.** Hand-editing `index.html` "just to fix one thing" while the generator still derives it from `posts/` guarantees your next build silently overwrites the edit. Rule: the site is generated, never hand-maintained, every artifact must be reproducible from the posts folder alone.
- **Missing test coverage on the "full pipeline."** The steps each pass alone, but a post whose frontmatter says `date: "2026-08-04"` with a *space* after the key, or a tag with a capital letter, is where the assemble step breaks the whole build. A two-line smoke test (`build`, then assert every generated file exists and every `<a href>` resolves) catches the class of failure before you publish.

## What you just built

A working static site generator: two posts in, one command, and a `site/` folder of hand-readable HTML, pages, index, and per-tag listings all derived from the posts so the build can never disagree with the source. The transferable skill is the whole *static-generation mental model*: a small, pure pipeline (parse → render → assemble) that turns plain text files into a deployable artifact you can host anywhere, from a spare folder to a CDN, with nothing running at request time. That model is what powers Jekyll, Hugo, Gatsby, and a thousand personal blogs, and now it's yours.

:::tip[Run a fuller version without any local setup]
[`examples/markdown-blog-engine/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/markdown-blog-engine) in the course repo bundles the engine, both sample posts, and a notebook that runs every step in order. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and inspect the generated `site/` right in the tree.
:::

## Where to go from here

- Add an RSS feed, one XML file listing every post's title, link, and date, regenerated on every build; the derive-from-posts habit makes that a 15-line addition.
- Add reading-time estimates, count words in the body, divide by ~200, round up, and show "4 min read" on the index; the counter is one line, the templating is the fun part.
- Write a date-aware archive (`archive-2026.html`) grouped by year, the exact `setdefault` grouping from Step 5, one more key.
- Deploy: push `site/` to a GitHub Pages repo (or a single branch) and let a free web host serve it, the whole point of the static model is that the output is shippable with zero moving parts.

## Share your project with the class

Built something you're proud of, a blog engine that rendered your own posts? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README walks through adding yours via a **pull request** from start to finish: forking, branching, committing, and opening the PR. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓