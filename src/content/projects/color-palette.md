---
title: "Build a Color Palette Generator"
description: "Generate harmonious color palettes from base colors with accessibility contrast checking."
difficulty: "beginner"
estimatedMinutes: 50
tags: ["colors", "cli", "stdlib", "design"]
prerequisites:
  - "Python basics (variables, loops, functions)"
learningObjectives:
  - "Convert between hex, RGB, and HSV color spaces"
  - "Generate complementary, analogous, and triadic palettes from a base hue"
  - "Compute WCAG contrast ratios and judge AA/AAA compliance"
  - "Export palettes as CSS variables and JSON"
  - "Wrap the whole tool in a small command-line interface"
---

# 🎨 Build a Color Palette Generator

Picking colors that actually go together is the difference between a professional-looking app and a clown-car one, yet "harmonious" is usually a vibe, not a formula. It turns out matters less than it feels like it should: the color **wheel** gives you precise rules, complementary colors sit 180° apart, triadic ones 120°, analogous neighbors 30°. This project builds a tool that applies those rules to *any* base color, then checks each candidate against the WCAG contrast guidelines so you never hand someone a palette where the text vanishes into the background.

This assumes Python 101, variables, loops, functions, and basic `print`, nothing from Data Analysis is required. It's optional and ungraded; see [Real-World Projects](/projects) for the full, growing list.

## 🎯 What you'll do

1. Convert colors between hex (`#3366cc`), RGB `(51, 102, 204)`, and HSV hue/saturation/value space round-trip.
2. Generate complementary, analogous, and triadic palettes from a single base color.
3. Compute the WCAG contrast ratio between any two colors and judge whether they pass AA.
4. Export any palette as CSS variables and as JSON.
5. Wrap everything in a small CLI that prints a palette plus its contrast report from one command.

## Where to run this

**Locally with `uv`** is the recommended path, this project uses only Python's standard library (the `colorsys` module), so setup is just "get a Python and a project folder." The Setup section below walks through it.

**GitHub Codespaces** is a zero-install alternative: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node and Python are already installed) and run the same commands from a terminal in your browser tab.

**Google Colab, Kaggle Notebooks, or Binder** are a fine way to *play* with the color math, since it needs no API keys or GPU, a runnable notebook lives at [`examples/color-palette/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/color-palette/notebook.ipynb). Click a badge to launch it with zero local setup:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/color-palette/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/color-palette/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fcolor-palette%2Fnotebook.ipynb)

Be honest about the tradeoff, though: a notebook runs the *same* sample palette every time. The local CLI is where you type in your own brand color and get a real report back.

## Setup

`uv` is a single tool that replaces the "install Python, then pip, then a virtual environment tool" chain, and since this project needs no third-party packages at all, setup is genuinely just "get a Python and a folder."

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

Then set up the project:

```bash
uv init color-palette
cd color-palette
```

That's it, no `uv add` line. Everything this project imports (`colorsys`, `json`, `argparse`) ships inside Python itself, which is worth noticing: a surprising amount of genuinely useful tooling needs zero dependencies, and knowing where the standard library's color tools live is part of this project.

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `color-palette/` exists with a `pyproject.toml`.
- ✅ `python -c "import colorsys"` succeeds without installing anything.

## Step 1: Convert colors between spaces

Colors live in several notations. Hex (`#3366cc`) and RGB `(51, 102, 204)` are the ones humans type and browsers accept, but *neither* makes it easy to craft a palette, "turn this color 30° toward green" is gibberish in RGB, yet a one-line change in **HSV**, where hue *is* the position on the color wheel. So the whole project rests on a round-trip: hex → RGB → HSV and back, losing nothing along the way.

### 1.1 Write the four conversion functions

**👟 Starter hint:** Put four small functions in `color_math.py`, `hex_to_rgb`, `rgb_to_hsv`, `hsv_to_rgb`, `rgb_to_hex`, and verify each with a `print` in the `__main__` block:

```python
# color_math.py
import colorsys

def hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    """'#1a2b3c' -> (26, 43, 60). A leading '#' is optional."""
    h = hex_color.lstrip("#")
    if len(h) != 6:
        raise ValueError(f"{hex_color!r} is not a 6-digit hex color")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def rgb_to_hsv(rgb: tuple[int, int, int]) -> tuple[float, float, float]:
    """Return (hue_in_degrees, saturation, value), each rounded."""
    r, g, b = (v / 255.0 for v in rgb)
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    return round(h * 360.0, 2), round(s, 3), round(v, 3)

def hsv_to_rgb(h: float, s: float, v: float) -> tuple[int, int, int]:
    """Inverse of rgb_to_hsv: hue in degrees, s/v in [0, 1]."""
    r, g, b = colorsys.hsv_to_rgb(h / 360.0, s, v)
    return tuple(round(c * 255.0) for c in (r, g, b))

def rgb_to_hex(rgb: tuple[int, int, int]) -> str:
    return "#{:02x}{:02x}{:02x}".format(*rgb)

if __name__ == "__main__":
    print(hex_to_rgb("#3366cc"))           # (51, 102, 204)
    print(rgb_to_hsv((51, 102, 204)))      # (220.0, 0.75, 0.8)
    print(rgb_to_hex(hsv_to_rgb(220.0, 0.75, 0.8)))  # #3366cc -- round trip
```

The two conversions worth your attention: `rgb_to_hsv` scales every channel into `[0, 1]` and hands it to `colorsys.rgb_to_hsv`, then multiplies the returned hue by `360` to get degrees, the standard library works in fractions of a color wheel by default, and the ×360 is exactly the "one formula, one unit change" step. `hsv_to_rgb` must undo that same scaling (÷360 before calling `colorsys.hsv_to_rgb`) or every palette you build is silently wrong.

**🎯 Expected output:**

```
(51, 102, 204)
(220.0, 0.75, 0.8)
#3366cc
```

**🩹 If it's off:** A `ValueError` saying "not a 6-digit hex color" means you passed the color with an unexpected leading `#` or extra whitespace, `lstrip("#")` only strips *one* prefix, and `.strip()` on the input first fixes whitespace. If the round-trip prints `#3266cb` or similar, your `hsv_to_rgb` rounds down in the wrong place, that last `round(c * 255.0)` belongs in `hsv_to_rgb`, not in `rgb_to_hex`.

### 1.2 Verify the round trip

**✅ Checklist**

- ✅ `hex_to_rgb("#3366cc")` returns `(51, 102, 204)`.
- ✅ `rgb_to_hsv((51, 102, 204))` returns `(220.0, 0.75, 0.8)`.
- ✅ Converting hex → RGB → HSV → RGB → hex returns the original color exactly.

**🤔 Socratic Question(s)**

- In RGB, `(51, 102, 204)` changes to `(51, 102, 205)` by bumping one channel. What does that same tiny change *mean* in HSV terms, is it a hue change, a brightness change, or both, and why does that make HSV the right space for "nudge this color 30°"?
- Why does `rgb_to_hsv` return rounded floats while `hsv_to_rgb` has to round to whole integers at all? Where would a floating-point `round` deeply break the round-trip guarantee?

## Step 2: Generate harmonious palettes

Now the payoff of converting to HSV: palette rules become arithmetic on one number. The standard schemes are all pure hue offsets with saturation and value held constant, complementary is `hue + 180`, triadic is `hue`/`+120`/`+240`, analogous is `hue ± 30`.

### 2.1 Write the hue-offset rules and the palette builder

**👟 Starter hint:** Three tiny functions, `complementary`, `analogous`, `triadic`, each returning a list of hues via `% 360` wraparound, plus `build_palette`, which looks up the base color's hue/saturation/value once and applies all three rules to it:

```python
# palettes.py
from color_math import hex_to_rgb, hsv_to_rgb, rgb_to_hsv, rgb_to_hex

def complementary(base_hue: float) -> list[float]:
    return [base_hue, (base_hue + 180.0) % 360.0]

def analogous(base_hue: float, spread: float = 30.0) -> list[float]:
    return [(base_hue + offset) % 360.0 for offset in (-spread, 0.0, spread)]

def triadic(base_hue: float) -> list[float]:
    return [base_hue, (base_hue + 120.0) % 360.0, (base_hue + 240.0) % 360.0]

def build_palette(base_color: str) -> dict[str, list[str]]:
    base_hue, sat, val = rgb_to_hsv(hex_to_rgb(base_color))
    palettes = {}
    for name, hues in (
        ("complementary", complementary(base_hue)),
        ("analogous", analogous(base_hue)),
        ("triadic", triadic(base_hue)),
    ):
        palettes[name] = [rgb_to_hex(hsv_to_rgb(h, sat, val)) for h in hues]
    return palettes

if __name__ == "__main__":
    palette = build_palette("#3366cc")
    for name, colors in palette.items():
        print(f"{name}: {colors}")
```

`% 360` on every offset is the entire trick of the color wheel: `hue + 180` on a color at 250° isn't 430° (which no color space accepts), it wraps to 70°. Holding `sat` and `val` fixed while only hue moves is also a *design* choice, not just a shortcut, it guarantees every color in the palette shares the same vibrancy and lightness, which is what makes a scheme feel cohesive rather than random.

**🎯 Expected output:**

```
complementary: ['#3366cc', '#cc9933']
analogous: ['#33b3cc', '#3366cc', '#4d33cc']
triadic: ['#3366cc', '#66cc33', '#cc3366']
```

**🩹 If it's off:** If every palette is a flat gray, `sat` or `val` came out `0` from `rgb_to_hsv`, which only happens for a purely saturated-less input like `#ffffff`, so check your base color. If the hues are right but the *order* looks scrambled, remember `hsv_to_rgb` expects degrees while `colorsys` wants a fraction, passing a raw degree value like `220.0` straight into `colorsys.hsv_to_rgb` throws off every conversion.

### 2.2 Verify the hue rules

**✅ Checklist**

- ✅ `build_palette("#3366cc")` returns the five colors above, in that order.
- ✅ Every generated color differs from the base only in hue, saturation and value are identical everywhere.
- ✅ Feeding your own base color (try `#e63946`) produces a valid palette instead of crashing.

**🤔 Socratic Question(s)**

- The analogous rule uses `spread=30`. What happens to the palette if you raise it to `spread=60`, and where, on the color wheel, would it become *visually indistinguishable* from a triadic palette? Why?
- `complementary` returns the base color *and* its opposite. If a designer only wants the two new colors, why might returning the base anyway still be the better choice for a library function?

## Step 3: Check WCAG contrast

A palette can be mathematically perfect and still useless if the text color doesn't clear the background. WCAG defines contrast as a *ratio* computed from each color's relative luminance, a bit of per-channel gamma math, then `(L_light + 0.05) / (L_dark + 0.05)`. The thresholds are fixed: 4.5:1 for normal AA text, 3:1 for large text, 7:1 for AAA.

### 3.1 Write luminance, ratio, and the pass/fail judge

**👟 Starter hint:** Three functions, `relative_luminance` (the piecewise gamma transform), `contrast_ratio` (which must sort the two luminances so the bigger one is divided), and `passes_wcag` with a thresholds dictionary:

```python
# contrast.py
from color_math import hex_to_rgb

def relative_luminance(rgb: tuple[int, int, int]) -> float:
    def channel(c: int) -> float:
        c /= 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (channel(v) for v in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def contrast_ratio(fg: str, bg: str) -> float:
    l1 = relative_luminance(hex_to_rgb(fg))
    l2 = relative_luminance(hex_to_rgb(bg))
    lighter, darker = max(l1, l2), min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)

def passes_wcag(ratio: float, level: str = "AA") -> bool:
    thresholds = {"AA": 4.5, "AA-large": 3.0, "AAA": 7.0, "AAA-large": 3.0}
    return ratio >= thresholds[level]

if __name__ == "__main__":
    ratio = contrast_ratio("#ffffff", "#3366cc")
    print(f"white on #3366cc: {ratio:.2f}:1")
    print("passes AA normal text:", passes_wcag(ratio, "AA"))
```

The huge-weight line is the `0.2126/0.7152/0.0722` coefficients: the human eye does not weigh red, green, and blue equally, and WCAG encodes that. The `max/min` sort in `contrast_ratio` matters too, the formula is asymmetrical and would silently produce a *wrong-but-valid-looking* number if you divided in the arbitrary call order, so the function defensively normalizes.

**🎯 Expected output:**

```
white on #3366cc: 5.37:1
passes AA normal text: True
```

**🩹 If it's off:** If `passes_wcag` keeps returning `True` for obviously-dark-on-dark pairs, your `relative_luminance` is melting the gamma step, check the `** 2.4` against the branching (`c <= 0.04045`), a missing `+0.055` corrupts every dark color. If the ratio prints as `1.00:1` exactly, both luminances are equal, you likely forgot the `max/min` sort and divided a color against itself by passing the same hex twice.

### 3.2 Verify the contrast math

**✅ Checklist**

- ✅ `contrast_ratio("#ffffff", "#3366cc")` prints `5.37:1`.
- ✅ `contrast_ratio("#ffffff", "#ffffff")` prints `1.00:1` (a color against itself).
- ✅ You can explain why `0.2196*1.0` would be wrong for a pure-white input.

**🤔 Socratic Question(s)**

- `contrast_ratio` sorts the two luminances defensively. Where could a caller still get a `1.00:1`-ish answer *by design* rather than by bug, and is that ratio always a sign of a broken palette?
- AAA normal text needs 7:1. Given that white-on-`#3366cc` lands at 5.37:1, what has to change about the *foreground* to reach AAA, and what does that trade against aesthetically?

## Step 4: Export palettes as CSS and JSON

A palette nobody can use is academic. The two formats that actually ship into products are CSS custom properties (`--brand-1: #3366cc`) and JSON (for config files, Tailwind themes, and scripts). Exporting teaches the deeper lesson that a *model* (a dict of named color families) and its *renderings* (CSS text, JSON text) are separate layers, you can add ten more exporters without touching the color code.

### 4.1 Write the two exporters

**👟 Starter hint:** Two one-idea functions, `to_css` builds `:root { --family-N: ... }` lines with a list comprehension, `to_json` hands the whole palette dict to `json.dumps` with `indent=2`:

```python
# exporter.py
import json

def to_css(palette: dict[str, list[str]]) -> str:
    lines = [":root {"]
    for name, colors in palette.items():
        for i, color in enumerate(colors):
            lines.append(f"  --{name}-{i + 1}: {color};")
    lines.append("}")
    return "\n".join(lines)

def to_json(palette: dict[str, list[str]]) -> str:
    return json.dumps(palette, indent=2)

if __name__ == "__main__":
    from palettes import build_palette
    palette = build_palette("#3366cc")
    print(to_css(palette))
    with open("palette.json", "w") as f:
        f.write(to_json(palette))
    print("Saved palette.json")
```

The data-to-text distinction is the idea to hold onto: `build_palette` returns a plain dict, and each exporter owns *only* the "dict → text" question. `f"  --{name}-{i + 1}: {color};"` is a nice showcase of an f-string doing real work, interpolation plus an `enumerate`-style offset in one line. Note the JSON side does the same job with *zero* string formatting, which is exactly why structured formats exist.

**🎯 Expected output:** The terminal prints a 16-line CSS block starting with `:root {`, listing three families of color variables; a file `palette.json` is written that `json.load(open("palette.json"))` can read back as the original dict.

**🩹 If it's off:** If the CSS prints `--complementary-0` (zero-based), your `enumerate(colors)` isn't adding `+ 1`, CSS authors expect families to start at 1. If the JSON file differs from `palette.json` printed earlier, check that `json.dumps(..., indent=2)` is what ran at write time rather than the single-line default.

### 4.2 Verify the exports

**✅ Checklist**

- ✅ `to_css(palette)` output begins with `:root {` and ends with `}` and includes `--triadic-3: #cc3366`.
- ✅ `palette.json` exists and loads back as a dict with the same three keys.
- ✅ No color value in either export has an uppercase letter or a missing `#`.

**🤔 Socratic Question(s)**

- The dict created in Step 2 is consumed by *two* exporters here. What does that suggest about where you'd add a third format, say, a Tailwind config, and why doesn't the color code need to change for it?
- Why is JSON described as needing "zero string formatting" while CSS needs an f-string? What property does JSON have that human-written CSS doesn't?

## Step 5: Wrap it in a CLI

The final polish is turning a library into a tool someone actually types: `python palette.py .e63946 --bg ffffff` prints the whole report. The `argparse` module handles argument parsing, defaults, and helpful `--help` text for free.

### 5.1 Build the summarizing CLI

**👟 Starter hint:** One `summarize` function that prints each family and then the contrast verdict for every unique color against the chosen background, wired into `argparse` with positional `base` and a defaulted `--bg`:

```python
# palette.py
import argparse

from color_math import hex_to_rgb
from contrast import contrast_ratio, passes_wcag
from palettes import build_palette

def summarize(base_color: str, background: str) -> None:
    palettes = build_palette(base_color)
    for name, colors in palettes.items():
        print(f"{name}: {' '.join(colors)}")

    print()
    print(f"Contrast vs {background}:")
    for color in sorted({c for family in palettes.values() for c in family}):
        ratio = contrast_ratio(color, background)
        verdict = "AA" if passes_wcag(ratio, "AA") else "FAIL"
        print(f"  {color}: {ratio:.2f}:1  {verdict}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Palettes + WCAG contrast from one hex color.")
    parser.add_argument("base", help="Base hex color, e.g. #3366cc")
    parser.add_argument("--bg", default="#ffffff", help="Background to check against (default: #ffffff)")
    args = parser.parse_args()
    hex_to_rgb(args.base)  # validate before doing any work
    hex_to_rgb(args.bg)
    summarize(args.base, args.bg)
```

```bash
uv run python palette.py #3366cc
```

Two deliberate touches: an explicit `ValidationError`-style validation *before* any generation (you fail fast with a readable error instead of a mid-palette crash), and a set comprehension collecting every exported color once so the contrast report doesn't repeat the same color for each family it appears in.

**🎯 Expected output:** Three palette lines (`complementary:` … up to `triadic:`), a blank line, then one `Contrast vs #ffffff:` line per unique color, each ending in `AA` or `FAIL`, with `#3366cc: 5.37:1  AA` among them.

**🩹 If it's off:** If typing the color with its `#` fails the parser, you're on a shell that treats `#` as a comment start, quote the argument (`"#3366cc"`) or drop the `#`. If `--bg 000000` still reports most colors as `FAIL`, that's the honest answer, not a bug, dark-on-black is low contrast *by design*; pass a lighter background.

### 5.2 Verify the CLI

**✅ Checklist**

- ✅ `uv run python palette.py #3366cc` prints three palettes and a contrast report that includes a `5.37:1  AA` line.
- ✅ `uv run python palette.py --help` lists the `base` positional and the `--bg` option.
- ✅ An invalid hex like `uv run python palette.py zzz` prints a clear `ValueError`, not a silent empty report.

**🤔 Socratic Question(s)**

- The set comprehension deduplicates colors before the contrast loop. What would happen to the *output* if you removed it, and why is duplicated reporting, not a crash, the exact class of bug a `set` quietly prevents?
- `argparse` gives you `--bg` with a default. What's a real situation where a *user supplying nothing* and a *user supplying the default explicitly* must behave differently, and does this CLI have one yet?

## ⚠️ Common pitfalls

- **Forgetting that `colorsys` works in fractions, not degrees.** `rgb_to_hsv` returns hue in `[0,1)`; multiply by 360 going in, divide by 360 going out. The classic bug is multiplying in one direction and not undoing it in the other, every palette then renders scrambled and *nothing* round-trips.
- **Dividing contrast the wrong way.** The WCAG formula divides lighter by darker. Skip the `max/min` sort and `#ffffff` on `#000000` gives you the *right* ratio by luck while a reversed call order returns a wrong number that still *looks* plausible (like `0.19:1`).
- **Treating RGB as a good space for palette math.** "Analogous" is arithmetic on hues; in RGB it's guesswork. If you find yourself subtracting 30 from each channel "to make it match," you've left HSV and re-entered guesswork.
- **Skipping validation and crashing mid-report.** `hex_to_rgb` validating `len(h) != 6` up front means a typo'd color fails as one clear error, not as a palette of `None`s or a confusing `TypeError` deep in `colorsys`.
- **Hardcoding the output format into the palette builder.** The moment `build_palette` prints CSS itself, JSON export needs a duplicate function. Keep the model and the exporters separate, that separation is the reusable idea.

## What you just built

A real palette tool: it takes one color, applies genuine color-theory rules to produce three harmonious families, checks every result against the WCAG contrast guidelines, and exports both CSS variables and JSON, all in under a hundred lines of standard-library Python. The transferable skill is the *pipeline*: convert to a working space (HSV), do math there, convert back, the same shape behind color work, coordinate systems, and timezone handling everywhere.

:::tip[Run a fuller version without any local setup]
[`examples/color-palette/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/color-palette) in the course repo has the complete scripts above, runnable end to end. Or open the whole repo in a [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) and run them from there.
:::

## Where to go from here

- Add a `--levels` flag that checks each palette color against **every** WCAG level (AA, AA-large, AAA) and annotates the report, you already have the thresholds dictionary, this is one loop.
- Generate *shades* of a base color (same hue, decreasing value) so a palette ships with hover, border, and disabled states, reuse `hsv_to_rgb` with step 2's builder.
- Export to a **Tailwind-compatible** flat config or a Markdown swatch table, you'll discover how much of a new exporter is just choosing strings.
- Add color-blindness simulation: convert each color to a rough protanopia/deuteranopia space and flag palettes where two entries become indistinguishable.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓