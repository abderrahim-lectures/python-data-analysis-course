---
title: "Build a Font Pairing Tool"
slug: /projects/font-scanner
description: "Scan system fonts with Pillow, score and rank pairings by contrast and weight balance, render preview images, and generate CSS font-family fallback chains."
difficulty: "beginner"
estimatedMinutes: 40
tags: ["fonts", "design-tools", "google-fonts", "pillow"]
learningObjectives:
  - "Scan system fonts and extract metadata with Pillow"
  - "Classify fonts by typeface category using heuristic rules"
  - "Score and rank font pairings based on contrast and weight balance"
  - "Render font preview images showing heading and body text"
  - "Generate CSS font-family fallback chains with web-safe generics"
prerequisites: ["Python basics", "Pillow basics"]
---

# 🛠️ 🔤 Build a Font Pairing Tool

Typography is the most visible design decision on any web page, and pairing two fonts well — one for headings, one for body text — is a skill backed by a small number of concrete rules: contrast in category (serif vs. sans-serif) and contrast in weight (bold heading, regular body). This project builds a tool that applies those rules mechanically: it scans the font files actually installed on your system, classifies each one, scores every possible pair, ranks the best, renders a preview image showing the pairing, and exports a production-ready CSS `font-family` stack with cross-platform fallbacks.

This assumes Python 101 and a basic familiarity with PIL/Pillow — nothing from Data Analysis is required. It's optional and ungraded; see [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Scan real font files on your system with Pillow and extract family name, weight, and style.
2. Classify each font as serif, sans-serif, monospace, or display.
3. Score every pair of fonts by category contrast and weight balance, and rank the best.
4. Render a heading/body preview image of a pairing to confirm the result visually.
5. Generate CSS `font-family` stacks with web-safe generic fallbacks.

## Where to run this

**Locally with `uv`** is the primary, recommended path — the scan step reads font files from your system directories (`/usr/share/fonts`, `~/.fonts`, `/System/Library/Fonts`), and the results depend on what you have installed.

**GitHub Codespaces** works well: open [the course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course). Debian-based container images ship with a handful of DejaVu and Liberation fonts — fewer than a typical desktop, but enough to exercise every step.

**Google Colab and Kaggle Notebooks** are a genuine way to run this — a notebook has a small set of fonts bundled with its Linux image. The honest caveat is that the font scan will return fewer results than a desktop with a full DE installed, which is actually *useful*: it lets you see how the tool behaves when fonts are sparse, and the preview/render step still works with whatever is available. The notebook below uses the notebook's own system fonts so every piece of the tool runs on real files. Use it to see the pipeline work end to end; switch to local `uv` or a Codespace once you want a richer scan.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/font-scanner/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/font-scanner/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Ffont-scanner%2Fnotebook.ipynb)

## Setup

Everything you need is one PyPI package — no API keys, no external services.

### Install `uv`

`uv` is a single tool that replaces the usual "install Python, then install pip, then install a virtual environment tool, then install packages" chain — it can install and manage Python versions itself, alongside your project's dependencies.

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Close and reopen your terminal, then confirm it installed:

```bash
uv --version
```

### Set up the project

```bash
uv init font-scanner
cd font-scanner
uv add Pillow
```

`Pillow` is the only package you need — it reads TrueType and OpenType files, renders text to images, and loads default fonts for labeling. Everything else comes from Python's `pathlib` and `colorsys`.

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `font-scanner/` exists with a `pyproject.toml`, and `Pillow` is installed.

## Step 1: Scan your system's fonts

A font is just a file — `.ttf` or `.otf` — sitting in a known directory. Pillow's `ImageFont.truetype(path)` either loads it successfully or raises an error, which gives you a natural filter: every file that loads without an error is a font your system can actually render. The scan walks the common directories, reads a sample at 20px (enough to verify it's real), and builds a list of dicts with path, family name, weight, and style.

### 1.1 Build the font scanner

**👟 Starter hint:** Walk `~/.fonts`, `/usr/share/fonts`, `/System/Library/Fonts` (macOS), and `C:/Windows/Fonts` (Windows); for each `.ttf`/`.otf` file, attempt `ImageFont.truetype` and catch `OSError` for broken or unreadable files.

```python
# font_scanner.py
from pathlib import Path
from PIL import ImageFont

def scan_system_fonts(limit: int = 60) -> list[dict]:
    """Find loadable fonts in common system directories."""
    font_dirs = [
        Path.home() / ".fonts",
        Path("/usr/share/fonts"),
        Path("/System/Library/Fonts"),
        Path("C:/Windows/Fonts"),
    ]
    fonts = []
    for font_dir in font_dirs:
        if not font_dir.exists():
            continue
        for ext in ("*.ttf", "*.otf", "*.ttc"):
            for font_path in font_dir.rglob(ext):
                try:
                    _font = ImageFont.truetype(str(font_path), size=20)
                except OSError:
                    continue
                family = font_path.stem.replace("-", " ").replace("_", " ").title()
                fonts.append({
                    "path": str(font_path),
                    "family": family,
                    "weight": "bold" if any(w in family.lower() for w in ("bold", "black", "heavy")) else "regular",
                    "style": "italic" if "italic" in family.lower() else "normal",
                })
                if len(fonts) >= limit:
                    return fonts
    return fonts

fonts = scan_system_fonts()
print(f"Found {len(fonts)} fonts")
for f in fonts[:5]:
    print(f"  {f['family']} — {f['weight']}, {f['style']}")
```

The `limit=60` cap is a practical guard: some systems have thousands of font files (especially macOS), and loading every single one just to rank the top 10 pairs is slow and unnecessary. The family name extraction — replacing hyphens and underscores with spaces, then title-casing — is a heuristic that works well for standard font names (DejaVu Sans, Liberation Serif) but not for all; it's good enough for classification, which is the next step. The `except OSError` catches files that Pillow can't parse (corrupted files, font formats Pillow doesn't support) without crashing the entire scan.

**🎯 Expected output:** Prints `Found N fonts` where N is between 5 (sparse container) and 60 (capped), followed by the first five font families with their inferred weight and style.

**🩹 If it's off:** If `Found 0 fonts` on a system that definitely has fonts installed, the font directories are non-standard — add your system's actual font path to `font_dirs`. If the scan is very slow, the `limit` is too high or one directory is enormous — reduce it to 30 and see which directories contribute the most. If `ImageFont.truetype` raises `OSError` on every file, your Pillow install may be incomplete — `uv add Pillow` again to rebuild.

### 1.2 Verify the scan

**✅ Checklist**

- ✅ `fonts` is a list of dicts, each with keys `path`, `family`, `weight`, and `style`.
- ✅ You can explain why `limit=60` is a reasonable cap — what happens if you remove it on a Mac with 5,000+ system fonts?

**🤔 Socratic Question(s)**

- The family name is derived from the filename (`font_path.stem`), not from the font's internal metadata. What kind of mismatch would that introduce, and what Pillow API would give you the *actual* family name encoded inside the file?
- `.ttc` files (TrueType Collections) contain multiple fonts in one file. How does `ImageFont.truetype` handle them, and what's the risk if the first font in a `.ttc` isn't the one you'd use?

## Step 2: Classify fonts by category

Fonts fall into four broad families — serif, sans-serif, monospace, and display — and a good pairing always contrasts two different families. This classifier uses the font's name (as extracted in Step 1) as a fast heuristic: the word "Mono" in the name almost always means monospace, "Serif" means serif, and so on. It's not perfect, but it's right often enough to produce useful rankings.

### 2.1 Write `classify_font`

**👟 Starter hint:** Check the lowercase family name for keyword hits in a specific order — monospace first (it's the most distinctive), then serif, then display, with sans-serif as the catch-all default.

```python
# font_scanner.py (continued)
def classify_font(font_info: dict) -> str:
    """Classify a font as sans-serif, serif, monospace, or display based on its family name."""
    name = font_info["family"].lower()
    if any(kw in name for kw in ("mono", "code", "courier", "console")):
        return "monospace"
    if any(kw in name for kw in ("serif", "times", "georgia", "bodoni")):
        return "serif"
    if any(kw in name for kw in ("display", "script", "decorative")):
        return "display"
    return "sans-serif"

for f in fonts[:5]:
    print(f"  {f['family']:>30s} -> {classify_font(f)}")
```

The keyword lists are deliberately small and conservative: "Times" catches Times New Roman and Times; "Georgia" catches the one most common web-safe serif. Broadening the list too much risks false positives — a font named "Playfair Display" is correctly caught by "display", but a font named "Open Sans" should *not* match "serif" just because the string happens to contain it. The fallthrough to `sans-serif` is correct because sans-serif is the most common default in modern systems — the majority of system fonts that aren't obviously something else are sans-serif.

**🎯 Expected output:** One line per font showing its family name and assigned category — e.g., `DejaVu Sans -> sans-serif`, `Liberation Serif -> serif`, `DejaVu Sans Mono -> monospace`.

**🩹 If it's off:** If a font you know is serif is classified as sans-serif, its name doesn't contain any of the heuristic keywords — add the font's name to the list, or accept that name-based classification has limits (noted in the pitfalls). If a sans-serif font is misclassified as serif, check for accidental substring matches (the `in` operator is case-sensitive here, but the name is lowercased first).

### 2.2 Verify the classification

**✅ Checklist**

- ✅ Every font in `fonts` has a `category` that is one of the four expected strings.
- ✅ At least one font in the scan is classified as `sans-serif` — the most common default.

**🤔 Socratic Question(s)**

- A font named "Source Code Pro" — what does the classifier return, and is that correct? What about "Source Sans Pro"?
- What's the fundamental limitation of name-based classification, and what would an *accurate* classifier need to do instead? (Hint: it would have to read something inside the font file itself.)

## Step 3: Score and rank pairings

The two core typography rules for pairing are: (1) the two fonts should belong to *different* categories (contrast in shape), and (2) one should be bold while the other is regular (contrast in weight). This step applies those rules mechanically: score every pair, rank by total, and surface the top matches.

### 3.1 Write `score_pairing` and find the best pairs

**👟 Starter hint:** Score category contrast at 10 (different) vs. 3 (same), and weight balance at 8 (one bold + one regular) vs. 4 (both the same weight) — the total is out of 20.

```python
# font_scanner.py (continued)
def score_pairing(font_a: dict, font_b: dict) -> dict:
    """Score a font pairing based on contrast and weight-balance rules."""
    class_a = classify_font(font_a)
    class_b = classify_font(font_b)

    contrast = 10 if class_a != class_b else 3
    weight_a = 1 if font_a["weight"] == "bold" else 0
    weight_b = 1 if font_b["weight"] == "bold" else 0
    weight_balance = 8 if weight_a != weight_b else 4

    total = contrast + weight_balance
    rating = "excellent" if total >= 16 else "good" if total >= 10 else "fair"

    return {
        "font_a": font_a["family"],
        "font_b": font_b["family"],
        "class_a": class_a,
        "class_b": class_b,
        "contrast": contrast,
        "weight_balance": weight_balance,
        "total_score": total,
        "rating": rating,
    }

results = []
for i, fa in enumerate(fonts[:10]):
    for fb in fonts[i + 1:15]:
        score = score_pairing(fa, fb)
        if score["rating"] == "excellent":
            results.append(score)

results.sort(key=lambda x: x["total_score"], reverse=True)
print(f"\nTop pairings ({len(results)} excellent):")
for r in results[:3]:
    print(f"  {r['font_a']} + {r['font_b']} — {r['rating']} ({r['total_score']}/20)")
```

The nested loop `for i, fa in enumerate(fonts[:10]): for fb in fonts[i + 1:15]:` deliberately limits the search space — comparing the first 10 fonts against the next 5 gives you 45 pairs to evaluate, which is enough to surface meaningful results without combinatorial explosion. `results.sort(key=lambda x: x["total_score"], reverse=True)` ensures the best scores appear first, and filtering to `rating == "excellent"` (score ≥ 16) keeps the output focused on genuinely strong pairings rather than a long list of mediocre ones.

**🎯 Expected output:** A sorted list of excellent pairings, each printing two font names, a rating of "excellent", and a score out of 20. The top pair has a score of 18 (different category = 10 + weight balance = 8).

**🩹 If it's off:** If the results list is empty, no pair scored ≥ 16 — either all fonts in the scan are the same category, or none have contrasting weights. Widen the search range (`fonts[:20]` instead of `[:10]`). If a pair you know is great scores only "fair", the classifier or weight heuristic got both fonts wrong — trace `classify_font` and the weight field for both.

### 3.2 Verify the rankings

**✅ Checklist**

- ✅ The top-scored pair has a total of 18 (10 contrast + 8 weight balance) — confirming both rules fired.
- ✅ You can name one pair that scored "good" but not "excellent" and explain why the total fell below 16.

**🤔 Socratic Question(s)**

- Two fonts are both sans-serif but one is `bold` — the score is 3 + 8 = 11 ("good"). A font pairing guide would still call this usable. What's the cost of your tool *excluding* it from "excellent," and how would you change the thresholds if you wanted to include it?
- The scoring function treats all category contrasts equally (serif vs. sans-serif and monospace vs. display both score 10). Is that realistic — which pairings actually create the strongest visual contrast, and how would you encode that difference?

## Step 4: Render a pairing preview

A score is a number; a preview is a picture. The same fonts you just ranked can be rendered as a heading in the first font and a body paragraph in the second, laid out like a real page — and saved as a PNG you can send to a designer. This step is the visual confirmation that the scoring actually produced a good-looking result.

### 4.1 Build `render_preview`

**👟 Starter hint:** Create a white 800×500 Pillow `Image`, draw the heading in the first font at 36px, draw a horizontal rule, and wrap the body text manually so it doesn't overflow the canvas width.

```python
# font_scanner.py (continued)
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

def render_preview(heading_font_path: str, body_font_path: str,
                   heading_text: str = "The Quick Brown Fox Jumps",
                   body_text: str = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. "
                                   "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
                   output_path: str = "preview.png") -> None:
    """Render a heading + body font pairing preview image."""
    width, height = 800, 500
    img = Image.new("RGB", (width, height), "#ffffff")
    draw = ImageDraw.Draw(img)

    try:
        heading_font = ImageFont.truetype(heading_font_path, 36)
        body_font    = ImageFont.truetype(body_font_path, 18)
    except OSError as e:
        print(f"Error loading fonts: {e}")
        return

    draw.text((40, 40), heading_text, fill="#1a1a1a", font=heading_font)
    draw.line([(40, 100), (760, 100)], fill="#cccccc", width=1)

    y = 130
    line = ""
    for word in body_text.split():
        test = f"{line} {word}".strip()
        if draw.textbbox((0, 0), test, font=body_font)[2] > 720:
            draw.text((40, y), line, fill="#333333", font=body_font)
            y += 28
            line = word
        else:
            line = test
    if line:
        draw.text((40, y), line, fill="#333333", font=body_font)

    label_font = ImageFont.load_default()
    draw.text((40, height - 50), f"Heading: {Path(heading_font_path).stem}", fill="#888888", font=label_font)
    draw.text((400, height - 50), f"Body: {Path(body_font_path).stem}", fill="#888888", font=label_font)

    img.save(output_path, quality=95)
    print(f"Preview saved to {output_path}")

if len(fonts) >= 2:
    render_preview(fonts[0]["path"], fonts[1]["path"], output_path="my_pairing.png")
```

The word-wrapping loop is the most interesting piece: it builds a line word by word, tests its width with `draw.textbbox` (which returns the bounding box), and only commits the line when the next word would exceed 720 px. This is the simplest correct wrapping algorithm — more sophisticated versions handle hyphens and variable-width spaces, but for a preview image, this produces clean, readable output. The `label_font = ImageFont.load_default()` at the bottom uses Pillow's built-in 10px bitmap font — it's ugly but guaranteed to load on every Pillow install, which is exactly the right trade-off for a small label.

**🎯 Expected output:** A file `my_pairing.png` showing a large heading in the first font, a thin horizontal rule, and a wrapped body paragraph in the second font, with tiny labels at the bottom.

**🩹 If it's off:** If the image is blank or the text doesn't appear, the font file path is wrong or the font doesn't support the characters you're rendering — try a different font from the `fonts` list. If body text overflows vertically, the word-wrap limit (720) is too large for the font size, or the text is too long for a 500px-tall canvas — shorten the body text or increase the canvas height. If `render_preview` exits early with an `OSError`, one of the two font paths is invalid.

### 4.2 Verify the preview

**✅ Checklist**

- ✅ `my_pairing.png` exists and shows clearly different fonts for heading and body text.
- ✅ The heading text is larger than the body text and both are legible at their respective sizes.

**🤔 Socratic Question(s)**

- The preview uses a white background with dark text — the most common web convention. What changes would you make to `render_preview` to test the pairing on a dark background (white text on `#1a1a1a`), and which of the design-system project's contrast-check functions would you use to verify it?
- The heading and body fonts are rendered at fixed sizes (36px and 18px). On a real web page, those sizes are controlled by CSS, not the image. What does the preview *actually* tell you about the pairing that CSS alone wouldn't?

## Step 5: Generate CSS font-family stacks

A font name on your system is not the same as a font name on a visitor's system. A `font-family` stack lists the desired font first, then a chain of web-safe fallbacks that get progressively more generic — the browser uses the first one it can find. This step turns your scanned and paired fonts into CSS stacks that work cross-platform.

### 5.1 Build `generate_css_stack`

**👟 Starter hint:** Map each category to its standard web-safe fallback family, and return a comma-separated string: `'Desired Font', fallback1, fallback2, generic-category`.

```python
# font_scanner.py (continued)
FALLBACKS = {
    "sans-serif": "Arial, Helvetica, sans-serif",
    "serif":      "Georgia, 'Times New Roman', Times, serif",
    "monospace":  "'Courier New', Courier, monospace",
    "display":    "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif",
}

def generate_css_stack(font_family: str, category: str) -> str:
    """Build a CSS font-family stack with web-safe fallbacks."""
    generic = FALLBACKS.get(category, FALLBACKS["sans-serif"])
    return f"'{font_family}', {generic}"

print("/* Recommended font stacks */")
for r in results[:3]:
    css_heading = generate_css_stack(r["font_a"], r["class_a"])
    css_body    = generate_css_stack(r["font_b"], r["class_b"])
    print(f"h1 {{ font-family: {css_heading}; }}")
    print(f"body {{ font-family: {css_body}; }}")
    print()
```

The fallback order matters: the *specific* font first, then progressively more common ones, ending with the generic category (`sans-serif`, `serif`, etc.) as the final catch-all. If the browser can't find "DejaVu Sans" on the user's machine, it falls through to Arial, then Helvetica, then the browser's default sans-serif — that chain guarantees the page *always* looks acceptable, even if it doesn't look identical to your design. Single quotes around `'Courier New'` are required because the font name contains a space.

**🎯 Expected output:** A CSS block with `h1` and `body` declarations for each of the top three pairings, each using the scanned font name followed by the standard fallback chain.

**🩹 If it's off:** If the CSS uses a font name with a comma in it (some fonts have them), it needs single quotes around the entire name — the current `f"'{font_family}'"` handles this correctly, but if you rewrote it without quotes, the comma would be parsed as a stack separator. If the fallback generic doesn't match the category, check the `FALLBACKS` dict for typos.

### 5.2 Verify the CSS stacks

**✅ Checklist**

- ✅ Every generated `font-family` line starts with a single-quoted font name and ends with a bare generic keyword (`sans-serif`, `serif`, `monospace`, or `display`).
- ✅ You can explain why the generic keyword is always last in the chain — what happens if you put it first?

**🤔 Socratic Question(s)**

- If a web visitor has your exact font installed but at a different version (e.g., DejaVu Sans v2.35 vs. your v2.37), would the CSS change — and what does that tell you about the limits of font stacks for visual consistency?
- How would you modify the tool to detect when a font on your system *doesn't* have a well-known web-safe fallback, and suggest one? What would "well-known" even mean in this context?

## ⚠️ Common pitfalls

- **Name-based classification is a heuristic, not a guarantee.** A font named "Source Sans Pro" is correctly classified as sans-serif, but a font named "Fira" (which is actually sans-serif) gets classified as `sans-serif` by fallthrough rather than by positive identification. For production use, read the font's internal metadata (`font.getname()`) or its `sfnt` table to determine the real category.
- **`.ttc` files may load the wrong face.** A TrueType Collection bundles multiple fonts in one file; `ImageFont.truetype(path, index=0)` loads the first one by default, which may not be the one you'd want for headings. For pairing work, prefer individual `.ttf` or `.otf` files where the face is unambiguous.
- **Font count of zero on minimal systems.** A fresh container or a minimal cloud VM may have no system fonts at all — the scanner returns `[]` and every downstream step crashes on an empty list. Guard with `if not fonts: print("No fonts found; install DejaVu or Liberation fonts.")` and exit early, or provide a fallback font bundled with the project.
- **Preview overflow on small canvases.** Body text that's too long for a 500px-tall canvas will be clipped by Pillow without warning. Shorten the default `body_text` parameter or increase the canvas height — don't rely on the caller to guess the right length.
- **Font weights inferred from names are unreliable.** A font named "DejaVu Sans" may actually contain a bold variant at a different path — your scanner treats it as "regular" because "bold" isn't in the filename. For accurate weight detection, try loading the font at a heavier weight and catch the `OSError`, or parse the font's `name` table.

## What you just built

A working font analysis and pairing tool: it scans real font files on your system, classifies them by category using name-based heuristics, scores every pair by two concrete typographic rules, ranks the best pairings, renders a heading/body preview image confirming the result visually, and generates production-ready CSS `font-family` stacks with cross-platform fallbacks. Nothing here is a mock — the font paths are real files, the preview image uses the actual typefaces, and the CSS output is copy-pasteable into a live stylesheet.

:::tip[Run a fuller version without any local setup]
[`examples/font-scanner/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/font-scanner) in the course repo is a runnable notebook version: the scan, classification, scoring, and preview all execute in one notebook pass using the kernel's own system fonts. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- **Query the Google Fonts API**: fetch the top 50 Google Fonts by popularity, filter by category, and return them as a list of dicts with `family`, `category`, and `variants` — extend the tool beyond local fonts to the full web catalog.
- **Build a font specimen sheet**: given a single font, render the full alphabet (upper and lowercase), numbers 0–9, common punctuation, and a paragraph of sample text at multiple sizes (12, 18, 24, 36, 48px) on a single image — the standard deliverable for font evaluation.
- **Add a contrast analyzer**: render a white-on-white text sample at different contrast ratios and check each against WCAG AA (4.5:1) and AAA (7:1) using relative luminance — connecting this project to the accessibility math from the Design System Generator.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to making Python read your fonts. 🎓