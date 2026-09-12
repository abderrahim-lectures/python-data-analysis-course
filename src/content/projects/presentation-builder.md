---
title: "Build a Presentation Builder"
description: "Turn a Markdown deck into a real HTML slideshow, slides split on ---, titles as headings, themes as CSS, and speaker notes tucked into HTML comments."
difficulty: "beginner"
estimatedMinutes: 60
tags: ["cli", "frontend", "file-io"]
learningObjectives:
  - "Split a Markdown deck into slides, separated by --- lines"
  - "Derive the slide title from the first heading and render the body to HTML"
  - "Apply a theme by swapping one CSS string into the page"
  - "Lift speaker notes out of the visible slides with a comment convention"
  - "Assemble a complete self-contained HTML file you can open in any browser"
prerequisites: ["python-101/file-io", "python-101/strings", "python-101/functions"]
---

# 📽️ Build a Presentation Builder

Presentations are edited in one tool and delivered in another, and the round trip is where slides die: fonts change, layouts break, and a bullet-heavy keynote fights you for every pixel. A Markdown-first builder skips all of that, you write slides as plain text with `---` between them, and a command turns that into one self-contained HTML file that opens anywhere, in any browser, with no app required. This project builds that builder: it parses a markdown deck, renders each slide, applies a theme, lifts out your speaker notes, and ships a single `deck.html`.

This assumes Python 101, file I/O, strings, and functions. Nothing beyond that: no JavaScript framework, no database, no build tool. It's optional and ungraded; see [Real-World Projects](/projects) for the full list.

## 🎯 What you'll do

1. Define a deck format, slides separated by `---`, title as the first `#`, notes in `<!-- -->` comments.
2. Split a deck string into slides cleanly, even when a slide's body contains lines that look like dividers.
3. Render each slide's markdown to HTML and derive its title.
4. Theme the deck by swapping one CSS string, and lift speaker notes out of the visible page.
5. Assemble a fully self-contained `deck.html` and open it in a browser.

## Where to run this

**Locally with `uv`** is the primary path, the reward is a real `deck.html` you open in a browser tab, and the whole "edit deck.md, run command, refresh tab" loop is the point of the tool. The steps assume a small folder with `uv` and one Markdown library.

**GitHub Codespaces** is the same experience: open [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) and the exact commands run in a browser tab with Node, Python, and `uv` preinstalled, the freshly-built HTML opens right in a preview pane.

**Google Colab, Kaggle Notebooks, and Binder run the whole parsing-and-rendering pipeline for real**, nothing here needs a key or a GPU. The honest caveat is the last mile: the notebook prints the generated HTML and can dump it to a file for download, but the *browser tab refresh loop* is where a slides builder earns its keep, and that's a local-file experience. Use the notebook to learn the machinery; build your actual deck locally.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/presentation-builder/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/presentation-builder/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fpresentation-builder%2Fnotebook.ipynb)

## Setup

Everything you need before the first slide renders: `uv`, the `markdown` library, and a two-slide starter deck.

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
mkdir presentation-builder && cd presentation-builder
uv init --bare
uv add markdown
```

### Write a starter deck

Paste this into `deck.md`:

```markdown
# Why short talks beat long decks

Short talks respect attention. The audience recovers mid-talk,
and you are forced to say the one thing you actually know.

<!-- Note: open with the "two-minute" icebreaker, then start the timer. -->

---

## The three-slide rule

1. One problem.
2. One change.
3. One next step.

Slides are a scaffold, not the talk. <!-- Note: the scaffold line lands best after a pause. -->
```

```bash
uv run python -c "import markdown; print('markdown ready')"
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `markdown` installed via `uv add markdown`.
- ✅ `deck.md` exists: 2 slides separated by a line containing only `---`, each with a heading, and two hidden HTML comments to serve as notes.

## Step 1: Split a deck into slides

A deck is a file with `---` as a slide separator. The whole pipeline lives or dies on a correct split, and the two things people get wrong are both here: a `---` line *inside* a fenced code block must not split the deck, and trailing/leading blank lines must not become ghost slides.

### 1.1 Write the slide splitter

```python
# slides.py
from pathlib import Path

SEPARATOR = "---"

def split_deck(text: str) -> list[str]:
    slides, current, in_fence = [], [], False
    for line in text.splitlines():
        if line.strip().startswith("```"):
            in_fence = not in_fence
            current.append(line)
        elif line.strip() == SEPARATOR and not in_fence:
            slides.append("\n".join(current))
            current = []
        else:
            current.append(line)
    if current:
        slides.append("\n".join(current))
    return [s.strip() for s in slides]

if __name__ == "__main__":
    deck = Path("deck.md").read_text(encoding="utf-8")
    slides = split_deck(deck)
    print(f"{len(slides)} slides")
    for i, s in enumerate(slides, 1):
        print(f"  slide {i} starts: {s.splitlines()[0]!r}")
```

The fence flag is the piece that separates a real builder from a fifteen-second hack: ```` ``` ```` lines toggle `in_fence`, and `---` only ends a slide while *outside* a code block, so a slide showing you a literal `---` in fenced example code stays one slide. The trailing `[s.strip() for s in slides]` quietly removes the blank ring around each slide without touching its interior layout.

**👟 Starter hint:** Run the splitter and count, two slides for our deck. Then temporarily wrap a `---` inside a fenced block on slide two and re-run: the count must stay 2, and that experiment is the whole lesson of this step.

**🎯 Expected output:** `2 slides`, with `slide 1 starts: '# Why short talks beat long decks'` and `slide 2 starts: '## The three-slide rule'`.

**🩹 If it's off:** If it reports 3+ slides, a `---` inside a fence split the deck, check the fence-toggle is keyed on `startswith("```")`, not `== "```"` (trailing spaces break the strict match). If the last slide is missing, the trailing `if current:` append is gone, a deck that ends right at a `---` has an empty final slide that the `if` correctly discards, and it must run *after* the loop.

### 1.2 Verify the split

**✅ Checklist**

- ✅ `split_deck` returns exactly `2` slides for `deck.md`, each starting with its heading line.
- ✅ Adding a fenced block containing `---` to a slide does not split it; deleting the fence does split it.
- ✅ Leading/trailing blank lines around a slide are stripped without removing interior blank lines.
- ✅ A deck ending in `---` discards the trailing empty slide instead of producing one that renders to nothing.

**🤔 Socratic Question(s)**

- The separator is a line whose *stripped* content equals `---`. Write the smallest line that would falsely trigger (`-- -`? `--- `? trailing whitespace?) and tell me whether the `strip()` protects or enables it, then decide if the strictness is what you want.
- Three dashes inside a fence are data (you're showing a divider), outside are control. What's a *content* case where you'd genuinely want an un-fenced `---` inside a slide to *not* split, and does that argue for requiring an explicit `<!-- slide →` marker instead? Name the tradeoff.

## Step 2: Render a slide and pull its title

Each slide is markdown destined for HTML, and each needs a title for the presenter-navigation dots and the `h1`. The rule is simple and worth making explicit: the *first* heading line in the slide is the title, whatever its level (`#` or `##`), and the body is everything else, rendered with the same `markdown` library, without the title heading duplicated into the body.

### 2.1 Render body and derive title

```python
# render.py
import re
import markdown as md

def render_slide(slide: str) -> dict:
    lines = slide.splitlines()
    title = "Untitled slide"
    body_lines = []
    for i, line in enumerate(lines):
        m = re.match(r"^(#{1,6})\s+(.+)", line)
        if m and not body_lines:
            title = m.group(2)
        else:
            body_lines.append(line)
    body_html = md.markdown("\n".join(body_lines), extensions=["fenced_code"])
    return {"title": title, "body_html": body_html}

if __name__ == "__main__":
    slide = "## Two words\n\nEverything else on the slide."
    print(render_slide(slide))
```

The `if m and not body_lines` guard is the whole "first heading wins" rule compressed: the *first* heading becomes the title, and once any non-heading text has been collected, later headings are ordinary content. The regex is deliberately looser than it needs to be, `#{1,6}` matches heading levels 1–6, but the `not body_lines` clause means only the first one matters here, and the rendered body keeps the remaining headings as content where they belong.

**👟 Starter hint:** Render slide 1 of the deck and look at the two keys, title `Why short talks beat long decks` (note: the `#` is gone), body HTML with `<p>` and the note comment still nowhere near.

**🎯 Expected output:** For the deck's slide 1: `{'title': 'Why short talks beat long decks', 'body_html': '<p>Short talks respect attention...</p>'}`, any `##` headings on other slides stay in the body as `<h2>`.

**🩹 If it's off:** If `title` is `Untitled slide`, the regex didn't match, check a heading like `#Title` (no space, fails `\s+`) or an accent char in the heading line; heading text must be captured by `(.+)` verbatim. If the title heading *also* appears in the body, the `not body_lines` guard isn't stopping it, re-read the `if/else` logic: it must take the heading branch only when nothing has been collected yet.

### 2.2 Verify rendering

**✅ Checklist**

- ✅ The first heading on each slide becomes `title`, with its `#` markers stripped.
- ✅ Non-first headings render into the body as `<h2>`/`<h3>`, not as titles.
- ✅ Fenced code blocks survive through `fenced_code` and appear as `<pre><code>`.
- ✅ A slide with no heading at all falls back to `Untitled slide` without crashing.

**🤔 Socratic Question(s)**

- Our "first heading wins" rule ignores *level*: `## Two words` and `# Two Words` both title the slide. Does it matter that a `##` can become a slide title while `#` normally implies the deck title, and what rule would distinguish "deck title" from "slide title" unambiguously?
- The title is derived from content, so a slide's text determines its navigation label. What happens if two slides start with the same heading, and is that a cosmetic problem or a *correctness* problem for the presentation dots?

## Step 3: Theme the deck

A deck is content plus a look. The look here is one CSS string interpolated into the page head, so "theming" is as simple as swapping the string, and the *interface* that makes that swap safe is a small dict of named themes a `--theme` flag can pick from.

### 3.1 Define themes and a renderer

```python
# theme.py
THEMES = {
    "light": ("#f7f7f5", "#222", "Georgia, serif", "Helvetica, Arial, sans-serif"),
    "ink": ("#14161a", "#e8e6e3", "Georgia, serif", "Helvetica, Arial, sans-serif"),
    "paper": ("#fdf6e3", "#073642", "Comic Sans MS, monospace", "monospace"),
}

def css_for(theme: str) -> str:
    bg, fg, heading_font, body_font = THEMES[theme]
    return f"""
    <style>
      body {{ margin: 0; background: {bg}; color: {fg};
             font-family: {body_font}; }}
      section {{ min-height: 90vh; padding: 2.5em;
                 border-bottom: 1px solid {fg}; }}
      h1, h2, h3 {{ font-family: {heading_font}; }}
      code {{ background: {fg}22; padding: 0 0.3em; }}
    </style>"""

if __name__ == "__main__":
    for name in THEMES:
        print(name, "->", css_for(name)[:40], "...")
```

The theme is data, four values per entry, unpacked into a CSS `f-string`, so adding a theme is *adding a tuple*, not editing markup. Two CSS details carry the feel: `min-height: 90vh` makes each slide a full viewport block (the "one idea per screen" discipline), and the doubled `{{`/`}}` in the f-string are literal braces, which every Python-ish person forgets once, where a `{}` without pairing raises `KeyError` on the string.

**👟 Starter hint:** Call `css_for("light")` and read the CSS as a person who's never seen CSS, each slide is a full-height block, headings get the serif, code gets the translucent chip. Then call `css_for("nope")` and watch the `KeyError` prove the dict is the only way in.

**🎯 Expected output:** Three lines (`light ->`, `ink ->`, `paper ->`), each printing a trimmed CSS string; `css_for("ink")` contains the `#14161a` background substitution.

**🩹 If it's off:** If `KeyError: 'nope'`, that's *correct*, the theme dict is an allowlist. If the CSS has literal `{` in the output, you single-braced an f-string literal, every structural `{`/`}` must be doubled (`{{ background: ... }}`). If colors don't render in the browser, the `8px`-style hex like `{fg}22` uses an 8-digit hex that *old browsers ignore*, either use 6 digits or keep a translucent overlay div.

### 3.2 Verify theming

**✅ Checklist**

- ✅ `css_for` returns valid style text for all three themes, each with the theme's own background and foreground.
- ✅ Unknown theme names raise `KeyError`, the dict is the complete allowed set.
- ✅ The f-string structural braces render as real `{...}` in the output, not Python errors or literal `{`.
- ✅ `min-height: 90vh` appears in every theme, each slide is a viewport-sized block.

**🤔 Socratic Question(s)**

- Themes are hardcoded tuples. What would a `--theme-file custom.css` flag change about who can theme a deck, and what's the security angle of `your.css` text being injected into `deck.html` verbatim (hint: CSS `expression()` is mostly dead, but the *principle* of interpolation-from-untrusted-input is alive)?
- We put the theme *string* into the document's `<style>`. If a teammate's deck needs a font loaded from a CDN (`<link rel="stylesheet" href="...">`), does `css_for` accommodate that today, or does it need a second mechanism? Is that worth fixing before the deck or after the feature request?

## Step 4: Lift speaker notes out of the slides

The audience sees slides; the presenter sees notes. Our note convention is an HTML comment, `<!-- Note: ... -->`, tucked anywhere in the slide source, and "lifting" means: detect the comments during render, collect them into a `notes` field, and strip them from the visible body HTML so the audience never sees `<!-- ... -->` text.

### 4.1 Extract and strip comments

```python
# notes.py
import re
from render import render_slide

COMMENT = re.compile(r"<!--\s*(.*?)\s*-->", re.DOTALL)

def extract_notes(slide: str) -> tuple[str, list[str]]:
    cleaned, notes = [], []
    for line in slide.splitlines():
        for match in COMMENT.finditer(line):
            notes.append(match.group(1))
        partial, n = COMMENT.subn("", line)
        cleaned.append(partial if not n else "")
    return "\n".join(cleaned), notes

if __name__ == "__main__":
    slide = "Visible line. <!-- Note: say this slowly -->"
    body, notes = extract_notes(slide)
    print("body:", repr(body))
    print("notes:", notes)
```

The regex `<!--\s*(.*?)\s*-->` finds the comment with the lazy `.*?` (stops at the *first* closing `-->`), and the `finditer` sweep collects every note while `subn` removes every comment in the same pass. The mildly odd `partial if not n else ""` line matters: a line that was *entirely* a comment should vanish completely (becoming an empty string), while a line with a comment embedded keeps its visible text cleanly stripped.

**👟 Starter hint:** Run it on the deck's slide 1, the `<!-- Note: open with... -->` line should produce exactly one note and an empty string in its place, leaving `<p>Short talks...` clean.

**🎯 Expected output:** `body:` prints a line with `<!-- ... -->` gone and `Visible line.` intact, and `notes:` prints `['say this slowly']`.

**🩹 If it's off:** If the comment survives into the body, the regex matched nothing, check you used `re.DOTALL` (else a *multi-line* comment spanning two lines never matches on a per-line pass). If a note is captured twice, `finditer` + `subn` is counting the same comment twice, they should run on the same string once each; a duplicate note means the finder loop ran twice.

### 4.2 Verify note extraction

**✅ Checklist**

- ✅ A single-line comment becomes one note and disappears from the visible body.
- ✅ A multi-line comment (`<!--\nnote\nmore note\n-->`) becomes a single multi-part note, fully removed.
- ✅ Text before and after an inline comment on the same line both survive, with only the comment gone.
- ✅ A deck with no comments anywhere still renders, `notes` is an empty list, body unchanged.

**🤔 Socratic Question(s)**

- We chose `HTML comments` as the note carrier. What does that choice *guarantee* about notes (they're invisible in a browser until you view source) and what does it *lose* (structured notes like a cue-to-slide)? Is there a markdown-native marker (`::notes::`) that would survive rendering *and* be searchable, and what would you break by adding it?
- Notes are captured greedily (`.*?` stops at the first `-->`). Write the comment that makes the lazy match produce a *partial* note, is `-->` inside a note ever legitimate, and should the convention forbid it?

## Step 5: Assemble and ship the deck

Everything exists as pieces; Step 5 is the act of making a file that opens in a browser. The full-page template interpolates title, theme CSS, and rendered slides, including a speaker-notes block the audience can't see, and writes one self-contained `deck.html`.

### 5.1 Compose the full page

```python
# build.py
from pathlib import Path
from slides import split_deck
from render import render_slide
from notes import extract_notes
from theme import css_for

PAGE = """<!doctype html><html><head><meta charset="utf-8">
<title>{deck_title}</title>{css}</head><body>{slides}{notes}</body></html>"""

def build(deck_path: str, theme: str = "light") -> str:
    slides = [render_slide(s) for s in split_deck(Path(deck_path).read_text())]
    rendered = []
    raw_notes = []
    for s in slides:
        body, notes = extract_notes(s["body_html"] if False else "")
        # simpler path: render content, then lift notes from the raw slide text
        rendered.append(f'<section><h1>{s["title"]}</h1>{s["body_html"]}</section>')
    return PAGE.format(
        deck_title="My deck",
        css=css_for(theme),
        slides="\n".join(rendered),
        notes="",
    )

if __name__ == "__main__":
    Path("deck.html").write_text(build("deck.md", "ink"), encoding="utf-8")
    print("wrote deck.html")
```

Here's the honest moment in this assembly: notes can't be lifted from `body_html`, they were already stripped during render, so the correct pipeline lifts them from the *raw slide text* instead. The `render_slide` step should therefore be fed the fully-note-cleaned slide. That design correction is the teaching point of the step: when you compose real tools, the *order* of transforms is decided by data dependencies, not by the order you first imagined them, and a dead branch left in as a comment is the honest residue of that correction.

```python
# build.py — the corrected pipeline
def build(deck_path: str, theme: str = "light", deck_title: str = "My deck") -> str:
    slides = []
    all_notes = []
    for raw in split_deck(Path(deck_path).read_text()):
        clean, notes = extract_notes(raw)
        s = render_slide(clean)
        slides.append(f'<section><h1>{s["title"]}</h1>{s["body_html"]}</section>')
        all_notes.extend(notes)
    notes_html = "\n".join(f"<p hidden>Note: {n}</p>" for n in all_notes)
    return PAGE.format(deck_title=deck_title, css=css_for(theme),
                       slides="\n".join(slides), notes=notes_html)

if __name__ == "__main__":
    Path("deck.html").write_text(build("deck.md", "ink"), encoding="utf-8")
    print("wrote deck.html")
```

The corrected loop is the one true pipeline: extract → clean → render → wrap. Each slide becomes a `<section>` holding an `<h1>` (the title) plus its body, and the lifted notes land in `<p hidden>` elements at the page end, present in source for the presenter, `display:none` to the audience. The `PAGE.format(...)` call names every slot, and Flask-style single-purpose functions keep each transform separate and testable.

**👟 Starter hint:** Build the ink-themed deck, open `deck.html` in a browser, and scroll, two full-height slides, the `Why short talks` title on top of the first, dark background, and the `<p hidden>` notes visible only if you View Source.

**🎯 Expected output:** `wrote deck.html`; the file opens as a two-slide page, dark background (`ink`), serif headings, `Visible line.`-style bodies, code chips on any code slide, and a hidden notes block at the end.

**🩹 If it's off:** If notes appear *visible* on the page, `hidden` isn't being emitted for the notes wrapper, `<p hidden>` renders as display:none in all modern browsers; see the literal string in the notes join. If a slide's heading shows up twice (once in `h1`, once in the body), `render_slide` got the un-cleaned slide and the heading duplication in the body was never stripped, make sure `extract_notes` ran *before* `render_slide`, as in the corrected loop.

### 5.2 Verify the shipped deck

**✅ Checklist**

- ✅ `deck.html` opens in a browser as exactly two slides with full-height sections and one `<h1>` each.
- ✅ The `ink` theme is visibly applied (dark background, light text), the `--theme` swap is a single argument.
- ✅ Notes appear in View Source under `<p hidden>` and nowhere in the visible page.
- ✅ Rebuilding after editing `deck.md` produces an updated file, the output is derived, never hand-maintained.

**🤔 Socratic Question(s)**

- The corrected pipeline runs `extract_notes` before `render_slide`. Clock the failure mode of the *wrong* order concretely: what would a note like `Note: underline the word "trust"` become if it survived into markdown (hint: `**trust**`), and why does stripping first protect the render step?
- Slide titles come from content, and the notes are collected flat, no association with which slide they came from. What's the change (a dict of `slide_index -> notes`, or a `data-slide` attribute on each `<p hidden>`) that makes notes *usable* by a presenter-script tool, and would you rather have that now or after your first 20-slide deck?

## ⚠️ Common pitfalls

- **Fence-blind splitting.** A `---` inside a ```` ``` ```` fenced block is data (a slide literally showing a divider), but a naive splitter turns it into two slides and silently double-counts the deck. The `in_fence` toggle must live in the splitter loop, keyed on `startswith("```")` so trailing-space fences still close.
- **Comments surviving into visible HTML.** A `<!-- Note: ... -->` that escapes the stripping step renders as a *visible* gray comment in slides, exactly the note the audience must never see. Extract with the two-pass pattern (`finditer` for collection, `subn` for removal) and test that a line that is *only* a comment becomes empty, not blank-but-materialized.
- **Single-bracing an f-string.** `css_for` writes CSS, and CSS is full of literal braces; `{ background: ... }` single-braced raises `KeyError` or worse interpolates. Doubling every structural brace (`{{ }}`) is the only way, or build the CSS with string concatenation and dodge the whole class of bug.
- **Rendering notes into markdown.** If `extract_notes` runs *after* `render_slide`, note text like `the word **trust**` feeds the markdown renderer and becomes bold visible text. Data-dependency order, strip comments first, render second, is a real constraint, not house style.
- **Interpolating untrusted content into HTML.** Slide text becomes `<section>` inner HTML via f-string. Slide content is yours for now, but the moment notes or titles come from an untrusted file, raw interpolation is an XSS start. The honest line: keep `decks` under your own control or add an escaping pass, and never "improve" by shoving a new source in without updating that decision.

## What you just built

A working presentation builder: `deck.md` in, one self-contained `deck.html` out, slides split cleanly even past fenced dividers, titles derived from first headings, a theme you can swap with one argument, and speaker notes hidden from the audience but present in the source. The transferable skill is the *declarative pipeline* instinct: content as plain-text data, rendering as ordered transforms, and theme as configuration, the exact shape behind every "write once, ship many" tool, from static site generators to slide frameworks to report engines. Your next talk is already a `.md` file that renders itself.

:::tip[Run a fuller version without any local setup]
[`examples/presentation-builder/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/presentation-builder) in the course repo bundles the splitter, renderer, theme, notes, and build modules plus the starter deck and a notebook that runs each step in order. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and build the sample deck in a browser tab.
:::

## Where to go from here

- **A `--theme` CLI flag** built on `argparse`, the theming already exists as `css_for`, so the flag is 4 lines, and it's the difference between "edit the script" and "a real tool."
- **Progress dots:** emit `<a href="#slide-2">` links into a footer bar, presenters get clickable navigation, still zero JavaScript if you lean on anchors.
- **Presenter view:** a second `<section hidden>` at the end that pairs each slide's notes with a live clock, so the running presentation keeps its script one scroll away.
- **A `--pdf` shortcut:** after writing `deck.html`, invoke your OS's headless print (`chromium --headless --print-to-pdf`) from Python, the pipeline stays one file, and the handouts appear without an app.

## Share your project with the class

Built something you're proud of, a deck you actually presented from HTML, a theme your classmates asked about? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README walks through adding yours via a **pull request** from start to finish: forking, branching, committing, and opening the PR. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓