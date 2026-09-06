---
title: "Font Pairing Tool"
description: "Find complementary font pairings with preview rendering and web-safe fallbacks."
difficulty: "beginner"
estimatedMinutes: 40
tags: ["fonts", "design-tools", "google-fonts", "pillow"]
learningObjectives:
  - "Scan system fonts and extract metadata (weight, style, spacing)"
  - "Score font pairings based on contrast and harmony rules"
  - "Render font preview images using Pillow"
  - "Generate CSS font-family fallback chains for web use"
prerequisites: ["Python basics", "Pillow basics"]
---

# Font Pairing Tool

## What You'll Learn
- Scan and catalog fonts installed on your system
- Evaluate font pairings using contrast and readability heuristics
- Render font previews with custom text using Pillow
- Generate web-ready CSS font stacks with fallback chains
- Query the Google Fonts API for additional typeface options

## What You'll Build
A font analysis and pairing toolkit that can:
- Scan local fonts and extract metadata like weight, family, and style
- Score font combinations based on design contrast principles
- Render preview images showing heading and body text pairings
- Generate CSS `font-family` stacks with cross-platform fallbacks

## Where to Run It
This project works best **locally with `uv`** since it accesses system fonts. It also works in **Google Colab** with uploaded font files. JupyterLite has limited support but can render previews with embedded fonts.

## Setup

```bash
# Create the project
uv init font-pairing && cd font-pairing

# Add dependencies
uv add Pillow requests

uv run python main.py
```

## Step 1 — Scan Local Fonts

```python
import os
from pathlib import Path
from PIL import ImageFont

def scan_system_fonts() -> list[dict]:
    """Find fonts in common system directories and extract metadata."""
    font_dirs = [
        Path.home() / ".fonts",
        Path("/usr/share/fonts"),
        Path("/System/Library/Fonts"),  # macOS
        Path("C:/Windows/Fonts"),       # Windows
    ]

    fonts = []
    for font_dir in font_dirs:
        if not font_dir.exists():
            continue
        for ext in ("*.ttf", "*.otf", "*.woff"):
            for font_path in font_dir.rglob(ext):
                try:
                    font = ImageFont.truetype(str(font_path), size=20)
                    # Extract family name from the font file
                    family = font_path.stem.replace("-", " ").replace("_", " ").title()
                    fonts.append({
                        "path": str(font_path),
                        "family": family,
                        "weight": "bold" if "bold" in family.lower() else "regular",
                        "style": "italic" if "italic" in family.lower() else "normal",
                    })
                except Exception:
                    continue  # Skip unreadable fonts

    print(f"Found {len(fonts)} fonts across {len(font_dirs)} directories")
    return fonts

fonts = scan_system_fonts()
for f in fonts[:5]:
    print(f"  {f['family']} — {f['weight']}, {f['style']}")
```

## Step 2 — Score Font Pairings

```python
def classify_font(font_info: dict) -> str:
    """Classify a font as sans-serif, serif, monospace, or display based on name."""
    name_lower = font_info["family"].lower()
    if any(kw in name_lower for kw in ("mono", "code", "courier", "console")):
        return "monospace"
    if any(kw in name_lower for kw in ("serif", "times", "georgia", "bodoni")):
        return "serif"
    if any(kw in name_lower for kw in ("display", "script", "decorative")):
        return "display"
    return "sans-serif"

def score_pairing(font_a: dict, font_b: dict) -> dict:
    """Score a font pairing based on contrast and readability rules."""
    class_a = classify_font(font_a)
    class_b = classify_font(font_b)

    # Contrast score: different classifications = better pairing
    contrast = 10 if class_a != class_b else 3

    # Weight balance: one bold + one regular is ideal
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

# Score some pairings
results = []
for i, fa in enumerate(fonts[:10]):
    for fb in fonts[i+1:15]:
        score = score_pairing(fa, fb)
        if score["rating"] == "excellent":
            results.append(score)

results.sort(key=lambda x: x["total_score"], reverse=True)
for r in results[:3]:
    print(f"  {r['font_a']} + {r['font_b']} — {r['rating']} ({r['total_score']}/20)")
```

## Step 3 — Render Font Previews

```python
from PIL import Image, ImageDraw, ImageFont

def render_preview(heading_font_path: str, body_font_path: str,
                   heading_text: str = "The Quick Brown Fox",
                   body_text: str = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
                   output_path: str = "preview.png") -> None:
    """Render a font pairing preview image."""
    width, height = 800, 500
    img = Image.new("RGB", (width, height), "#ffffff")
    draw = ImageDraw.Draw(img)

    try:
        heading_font = ImageFont.truetype(heading_font_path, 36)
        body_font = ImageFont.truetype(body_font_path, 18)
    except (IOError, OSError) as e:
        print(f"Error loading fonts: {e}")
        return

    draw.text((40, 40), heading_text, fill="#1a1a1a", font=heading_font)
    draw.line([(40, 100), (760, 100)], fill="#cccccc", width=1)

    # Word-wrap body text
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

# Generate a preview
if len(fonts) >= 2:
    render_preview(fonts[0]["path"], fonts[1]["path"], output_path="my_pairing.png")
```

## Step 4 — Generate CSS Fallback Chains

```python
def generate_css_stack(font_family: str, category: str) -> str:
    """Generate a CSS font-family stack with web-safe fallbacks."""
    fallbacks = {
        "sans-serif": "Arial, Helvetica, sans-serif",
        "serif": "Georgia, 'Times New Roman', Times, serif",
        "monospace": "'Courier New', Courier, monospace",
        "display": "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif",
    }
    generic = fallbacks.get(category, fallbacks["sans-serif"])
    return f"'{font_family}', {generic}"

# Build CSS for recommended pairings
print("/* Recommended font stacks */")
for r in results[:3]:
    css_a = generate_css_stack(r["font_a"], r["class_a"])
    css_b = generate_css_stack(r["font_b"], r["class_b"])
    print(f"h1 {{ font-family: {css_a}; }}")
    print(f"body {{ font-family: {css_b}; }}")
    print()
```

## 🧩 Challenges

<details>
<summary><strong>Challenge 1: Query Google Fonts API</strong></summary>

Write a function that fetches the top 50 Google Fonts by popularity, filters by category (sans-serif, serif), and returns them as a list of dictionaries with `family`, `category`, and `variants`. Use the endpoint `https://www.googleapis.com/webfonts/v1/webfonts?key=YOUR_KEY`.
</details>

<details>
<summary><strong>Challenge 2: Build a contrast analyzer</strong></summary>

Render a white-on-white text sample at different contrast ratios. Check if each combination meets WCAG AA (4.5:1) and AAA (7:1) contrast requirements using relative luminance calculations.
</details>

<details>
<summary><strong>Challenge 3: Create a font specimen sheet</strong></summary>

Given a single font, generate a specimen page showing the full alphabet in upper and lowercase, numbers 0–9, common punctuation, and a paragraph of sample text at multiple sizes (12px, 18px, 24px, 36px, 48px).
</details>

## Stretch Goals
- [ ] Add AI-powered pairing suggestions based on design trends
- [ ] Build a font specimen generator for design presentations
- [ ] Implement variable font support with weight and width sliders
- [ ] Create a font download manager that fetches from Google Fonts
- [ ] Build a readability scoring tool using Flesch-Kincaid grade level

## What You Learned
- Scanning and cataloging fonts from system directories
- Classifying fonts by typeface category
- Scoring pairings based on contrast and weight balance rules
- Rendering font previews with Pillow
- Generating CSS font-family stacks with cross-platform fallbacks
- Working with font metadata and TrueType/OpenType files
