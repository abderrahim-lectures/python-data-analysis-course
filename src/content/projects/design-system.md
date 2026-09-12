---
title: "Build a Design System Generator"
description: "Generate a complete design system from one brand color: a cohesive palette, WCAG contrast checks, a typographic scale, and exportable CSS custom properties."
difficulty: "beginner"
estimatedMinutes: 40
tags: ["design", "css", "color-theory", "data-visualization", "matplotlib"]
learningObjectives:
  - "Convert between hex, RGB, and HSL color formats"
  - "Generate harmonious color palettes from a single base color"
  - "Calculate WCAG contrast ratios and verify accessibility"
  - "Build a typographic scale with a modular ratio"
  - "Export design tokens as CSS custom properties"
prerequisites:
  - "Basic Python functions and loops"
  - "Understanding of hex color codes"
  - "Familiarity with CSS variables (helpful but not required)"
---

# 🛠️ 🎨 Build a Design System Generator

Every design system starts from the same place: someone picks one brand color and then asks, "what does the whole palette look like?" This project builds that answer in Python, you'll derive a full palette in one color family, verify every pairing you'd actually use against WCAG contrast rules, build a typographic and spacing scale that stays mathematically consistent, and export everything as CSS custom properties ready to drop into a real stylesheet.

This assumes Python 101 and a rough sense of what a hex color string is, nothing from Data Analysis is required. It's optional and ungraded; see [Real-World Projects](/projects) for the full, growing list.

## 🎯 What you'll do

1. Convert between hex, RGB, and HSL so every color operation happens in the right space.
2. Derive a full, cohesive palette, shades, tints, and grays, from one brand hex color.
3. Score text/background pairs against WCAG contrast rules so accessibility isn't guesswork.
4. Build a typographic scale with a consistent modular ratio and a spacing scale.
5. Render a palette swatch card and save it as a shareable image.
6. Export every token as CSS custom properties you can paste into any web project.

## Where to run this

**Locally with `uv`** is the primary, recommended path, all the math is pure Python, and the two output files (`palette.png` and `design-tokens.css`) land directly in your working directory.

**GitHub Codespaces** works perfectly too: open [the course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) and run from there. Every step behaves identically to local.

**Google Colab and Kaggle Notebooks** are a natural fit for this project, no system dependencies, no files on disk, everything renders inline. If you're working through the course without a local setup, this is one of the projects that actually fits the notebook model cleanly.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/design-system/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/design-system/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fdesign-system%2Fnotebook.ipynb)

## Setup

Everything you need lives in Python's standard library plus one visualization library.

### Install `uv`

`uv` is a single tool that replaces the usual "install Python, then install pip, then install a virtual environment tool, then install packages" chain, it can install and manage Python versions itself, alongside your project's dependencies.

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
uv init design-system
cd design-system
uv add matplotlib
```

`colorsys` comes with Python and handles the color-space math in Step 1; `matplotlib` draws the palette swatch card in Step 5. You need just the one PyPI package.

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `design-system/` exists with a `pyproject.toml`, and `matplotlib` is installed.

## Step 1: Convert between color formats

You can't mix lightness and RGB: HSL is where humans adjust brightness, RGB is where screens deliver color, and hex is how you name them in CSS. Before any palette work, build the four translators you'll lean on for the rest of the project.

### 1.1 Write the four conversion functions

**👟 Starter hint:** Work around Python's `colorsys.rgb_to_hls` (not HSV): its return order is `(hue, lightness, saturation)`, which swaps saturation and lightness compared to every other API you'll meet.

```python
# design_system.py
import colorsys

def hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    """Convert a hex color string to an RGB tuple (0–255 per channel)."""
    h = hex_color.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def rgb_to_hex(r: int, g: int, b: int) -> str:
    """Convert RGB values (0–255) to a lowercase hex string."""
    return f"#{r:02x}{g:02x}{b:02x}"

def hex_to_hsl(hex_color: str) -> tuple[float, float, float]:
    """Convert hex to HSL (h: 0–360, s: 0–100, l: 0–100)."""
    r, g, b = hex_to_rgb(hex_color)
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    return h * 360, s * 100, l * 100

def hsl_to_hex(h: float, s: float, l: float) -> str:
    """Convert HSL (h: 0–360, s: 0–100, l: 0–100) to hex."""
    r, g, b = colorsys.hls_to_rgb(h / 360, l / 100, s / 100)
    return rgb_to_hex(int(r * 255), int(g * 255), int(b * 255))

# Round-trip test
brand = "#3b82f6"
r, g, b = hex_to_rgb(brand)
h, s, l = hex_to_hsl(brand)
print(f"  {brand} -> RGB({r}, {g}, {b}) -> HSL({h:.0f}\u00b0, {s:.0f}%, {l:.0f}%)")
print(f"  Back to hex: {hsl_to_hex(h, s, l)}")
```

`colorsys` uses 0–1 floats for every channel, and the name `rgb_to_hls` reveals the secret: the second and third outputs are lightness then saturation, not the other way round. Getting that wrong early means every shade you generate later has the wrong hue or the wrong mood, it's the foundational bug to kill first. `hsl_to_hex` reverses the same path; both conversions are lossless for whole-number RGB values.

**🎯 Expected output:** Prints `#3b82f6 -> RGB(59, 130, 246) -> HSL(217°, 91%, 60%)` and `Back to hex: #3b82f6` (the round-trip matches).

**🩹 If it's off:** If the round-trip hex doesn't match the input, you're passing saturation and lightness to `hsl_to_hex` in the wrong order, swap the `s` and `l` arguments inside that function. If the hue output is clearly wrong for a known color (you expect purple, you get red), you likely called `colorsys.rgb_to_hsv` instead of `rgb_to_hls`, the functions have different output shapes.

### 1.2 Verify the conversions

**✅ Checklist**

- ✅ Round-tripping a known color (`#3b82f6`) through `hex -> rgb -> hex` and `hex -> hsl -> hex` returns the original string exactly.
- ✅ You can explain why HSL is the right space for the palette work in Step 2, while hex is the right format for CSS.

**🤔 Socratic Question(s)**

- Why do the `rgb_to_hex` and `hsl_to_hex` calls both use `int(...)` on the final values, what would go wrong if you passed a float directly?
- If you brightened a color by adding 10 to each RGB channel instead of adjusting lightness in HSL, would the hue shift? How does HSL prevent that class of problem?

## Step 2: Generate a color palette

A palette is a family of tones and shades that feel like they belong together. The trick is simple: fix the hue and saturation (that's the color's *identity*), then walk only the lightness axis. Every resulting swatch shares DNA with the original brand color, the viewer sees a family, not four unrelated colors.

### 2.1 Build the palette generator

**👟 Starter hint:** Shift lightness in HSL by fixed offsets up and down from the base, using `min`/`max` to keep values inside 0–100.

```python
# design_system.py (continued)
def generate_palette(base_hex: str) -> dict:
    """Generate a full palette from a single brand color."""
    h, s, l = hex_to_hsl(base_hex)

    palette = {
        "brand": base_hex,
        "lightest": hsl_to_hex(h, s, min(l + 35, 95)),
        "lighter":  hsl_to_hex(h, s, min(l + 20, 90)),
        "light":    hsl_to_hex(h, s, min(l + 10, 85)),
        "dark":     hsl_to_hex(h, s, max(l - 10, 10)),
        "darker":   hsl_to_hex(h, s, max(l - 20, 5)),
        "darkest":  hsl_to_hex(h, s, max(l - 35, 0)),
    }

    # Grays: desaturated tint of the brand hue, not pure neutral
    for name, lightness in [("gray-100", 96), ("gray-200", 90), ("gray-300", 80),
                            ("gray-400", 60), ("gray-500", 45), ("gray-600", 30),
                            ("gray-700", 20), ("gray-800", 12), ("gray-900", 6)]:
        palette[name] = hsl_to_hex(h, 5, lightness)

    return palette

palette = generate_palette("#3b82f6")
print("Brand palette:")
for name, color in palette.items():
    if not name.startswith("gray"):
        print(f"  {name:>10}: {color}")
```

The `min(l + 35, 95)` cap prevents washed-out tints at 100% lightness, a palette that keeps a hint of the brand hue in its lightest shade is always more cohesive than pure white. The grays use a constant 5% saturation at the brand's hue rather than 0%, which gives them a warm tint instead of clinical gray; that's a small design choice that quietly makes a palette look expensive.

**🎯 Expected output:** Prints `brand: #3b82f6`, then lighter/darker shades in the same hue family, with the brand hex followed by the six lightness-shifted variants.

**🩹 If it's off:** If the lightest variant isn't recognizably the same color, the saturation is too low or the lightness shift went past 95, you've entered near-white territory where hue is invisible. If two adjacent shades (e.g., `light` and `lighter`) look nearly identical, your offsets are too close, bump them apart.

### 2.2 Verify the palette

**✅ Checklist**

- ✅ Every color in the palette shares the same hue angle (217° for `#3b82f6`), confirmed by calling `hex_to_hsl` on each.
- ✅ The lightest swatch is clearly distinct from pure white, and the darkest isn't completely black.

**🤔 Socratic Question(s)**

- Why not generate a palette by adding 15 to the RGB red channel of the base color instead of walking HSL lightness? What happens to perceived color when you change R, G, and B equally?
- If a brand manager gave you two hex colors and asked you to build a palette with *both* as anchors, what would you fix or throw out in `generate_palette` to make that work?

## Step 3: Check WCAG contrast ratios

Accessibility is not about taste, it's about a ratio. WCAG 2.1 says normal text needs a 4.5:1 contrast ratio against its background (AA) and 3:1 for large text; AAA bumps that to 7:1. These thresholds are concrete, and any tool that generates palettes *must* test them, otherwise you're guessing at whether half your users can actually read the words.

### 3.1 Write the contrast checking functions

**👟 Starter hint:** WCAG relative luminance is *not* a simple average, it applies a piecewise sRGB linearization that's more generous to dark channel values. Implement the two formulas exactly as the spec states them.

```python
# design_system.py (continued)
def relative_luminance(hex_color: str) -> float:
    """Calculate relative luminance per WCAG 2.1 (sRGB linearization)."""
    r, g, b = hex_to_rgb(hex_color)
    channels = []
    for val in (r, g, b):
        srgb = val / 255
        linear = srgb / 12.92 if srgb <= 0.03928 else ((srgb + 0.055) / 1.055) ** 2.4
        channels.append(linear)
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]

def contrast_ratio(color1: str, color2: str) -> float:
    """Calculate WCAG contrast ratio between two hex colors."""
    l1, l2 = relative_luminance(color1), relative_luminance(color2)
    lighter, darker = max(l1, l2), min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)

def check_accessibility(foreground: str, background: str) -> str:
    """Check if a color pair meets WCAG AA and AAA standards."""
    ratio = contrast_ratio(foreground, background)
    aa_normal = ratio >= 4.5
    aa_large  = ratio >= 3.0
    aaa       = ratio >= 7.0
    status = "AAA" if aaa else ("AA" if aa_normal else "Fail")
    size = "normal text" if aa_normal else ("large text" if aa_large else "insufficient")
    return f"  {foreground} on {background}: {ratio:.1f}:1 -> {status} ({size})"

# Test the most common palette combos
print(check_accessibility("#1e293b", "#ffffff"))
print(check_accessibility("#3b82f6", "#ffffff"))
print(check_accessibility("#64748b", "#ffffff"))
print(check_accessibility("#ffffff", "#1e293b"))
```

The linearization formula, `srgb / 12.92` for values below 0.03928, `((srgb + 0.055) / 1.055) ** 2.4` otherwise, looks arbitrary but matches the curve your monitor actually draws. The weighted average `0.2126·R + 0.7152·G + 0.0722·B` reflects that green carries the most luminance in human vision. Getting the ratio right means no guessing about whether `#3b82f6` on white actually passes AA (it does, just barely at ~4.5:1), you've proved it numerically.

**🎯 Expected output:** Four lines: `#1e293b` on white is **AAA** (normal text); `#3b82f6` on white is **AA** (normal text, just at the threshold); `#64748b` on white **fails** normal text but passes large text; and `#ffffff` on `#1e293b` mirrors the first row.

**🩹 If it's off:** If every ratio prints 1.0:1, both colors are identical, you've passed the same hex twice, or `relative_luminance` returns the same value for both (double-check the linearization branch cutoff). If a pair that *should* pass AA fails, your luminance formula is likely using RGB channels in the wrong order (check the `0.2126`/`0.7152`/`0.0722` weights, they correspond to R, G, B, not any other order).

### 3.2 Verify the contrast check

**✅ Checklist**

- ✅ You can name one palette pairing that passes AAA and one that fails AA, and verify both numbers match the spec.
- ✅ You can explain why the two "just at 4.5" cases around `#3b82f6` make the palette generator's lightness choices consequential, not decorative.

**🤔 Socratic Question(s)**

- A designer chooses `gray-400` text on a `gray-100` background. The ratio is ~5.2:1, it passes AA. Should they use it? What happens to that ratio on a cheap laptop screen with poor gamma, and what does that suggest about building safety margins into the palette?
- WCAG 2.2 added an "enhanced" contrast level. How would the code change, and what constraint would you add to `check_accessibility` to output three tiers instead of two?

## Step 4: Build a typographic scale and spacing scale

A font size doesn't exist in isolation, it's a *relationship* to the base size. A modular scale makes that relationship mechanical: every step multiplies by the same ratio, so the rhythm across a page stays visually consistent. Pair that with a clean arithmetic spacing scale, and the whole design system's layout tokens come from two numbers.

### 4.1 Generate the scales

**👟 Starter hint:** Use a base size of 16 px (one CSS `rem` by default) and a ratio of 1.25 (the "Major Third"), producing exactly 8 labels, `xs` through `3xl`.

```python
# design_system.py (continued)
def typography_scale(base: float = 16, ratio: float = 1.25, steps: int = 8) -> dict:
    """Generate a typographic scale from a base size and a modular ratio."""
    labels = ["xs", "sm", "base", "md", "lg", "xl", "2xl", "3xl"]
    scale = {}
    for i, label in enumerate(labels[:steps]):
        size = base * (ratio ** (i - 2))
        scale[label] = {
            "size_px": round(size, 1),
            "size_rem": round(size / 16, 3),
            "line_height": round(1.2 + 0.1 * (steps - i) / steps, 2),
        }
    return scale

def spacing_scale(base: float = 4, steps: int = 10) -> dict:
    """Generate a linear spacing scale in pixels."""
    return {f"{i + 1}": base * (i + 1) for i in range(steps)}

typo = typography_scale()
spacing = spacing_scale()
for label, props in typo.items():
    print(f"  {label:>4}: {props['size_px']:>5.1f}px = {props['size_rem']}rem  (line-height {props['line_height']})")
print("  spacing:", spacing)
```

The `(i - 2)` offset means `base` (index 2) maps exactly to 16 px, with `xs` and `sm` smaller and `lg`–`3xl` larger, the base sits right in the middle, which is where most body copy lives. `spacing_scale` is deliberately linear (1×, 2×, …, 10× the base) rather than geometric because margins and paddings grow additively in layout, not multiplicatively, that's the difference between "the scale grows how designers think" and "the scale grows how math feels".

**🎯 Expected output:** Prints `xs: 10.2px = 0.64rem` (the smallest), `base: 16.0px = 1.0rem`, up to `3xl: 39.1px = 2.44rem`; spacing prints `{1: 4, 2: 8, …, 10: 40}`.

**🩹 If it's off:** If `xs` and `sm` come out reversed, your offset is `(i + 2)` instead of `(i - 2)`. If line heights are all identical, the expression got simplified to a constant, make sure the `(steps - i)` term varies.

### 4.2 Verify the scale

**✅ Checklist**

- ✅ `base` in the typographic scale is exactly 16 px and 1.0 rem.
- ✅ Every step in the typographic scale is exactly 1.25× the previous step (within rounding).

**🤔 Socratic Question(s)**

- What happens if you change the ratio from 1.25 to 1.333 ("Perfect Fourth"), which headings grow the most, and when would you choose one over the other?
- Why not just use `spacing_scale` for font sizes too? What about a linear scale (12, 16, 20, 24…) makes it break down for headings?

## Step 5: Render a palette swatch card

A palette file of hex strings is useful to a computer, not to a person. A swatch card is the same palette as a picture, visual, immediately readable, and shareable. It also gives you a chance to confirm, by *looking*, that the palette actually looks the way the numbers promised.

### 5.1 Build the swatch renderer

**👟 Starter hint:** Use `matplotlib.patches.Rectangle` to draw one filled block per palette color, then add a text label. Keep the axis off and the layout tight.

```python
# design_system.py (continued)
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

def render_palette(palette: dict, filepath: str = "palette.png") -> None:
    """Render a vertical swatch card showing every color in the palette."""
    colors = list(palette.items())
    fig, ax = plt.subplots(figsize=(8, 0.55 * len(colors)))
    for i, (name, hex_color) in enumerate(colors):
        ax.add_patch(mpatches.Rectangle((0, i), 1, 1, color=hex_color, edgecolor="white", linewidth=2))
        ax.text(0.52, i + 0.3, f"{name}: {hex_color}", fontsize=8, color="#1e293b", fontfamily="monospace")
    ax.set_xlim(0, 1)
    ax.set_ylim(0, len(colors))
    ax.axis("off")
    plt.tight_layout()
    plt.savefig(filepath, dpi=150)
    print(f"Saved {filepath}")
    plt.show()

render_palette(palette)
```

Each `Rectangle` occupies the full width (`0` to `1`) and one unit of height (`i` to `i+1`), with white edges creating a visual gutter between swatches. The text color `#1e293b` (a dark charcoal, almost black) is hardcoded to stay legible over light swatches, for a production tool, you'd conditionally switch to white text over dark colors. `plt.show()` displays inline in a notebook and opens a window locally; `plt.savefig` writes the PNG regardless.

**🎯 Expected output:** A PNG `palette.png` with 15 vertical swatches (7 brand shades + 9 gray shades), each labeled in monospace, and either a matplotlib window or an inline display.

**🩹 If it's off:** If the labels run off the right edge, the figure is too narrow, bump `figsize` width. If labels are illegible on dark swatches, the `color="#1e293b"` text needs to flip to white; this is a known simplification and fine for the generator's current scope. If the figure shows only 3 swatches, the palette dict got truncated in the print, make sure all 15 keys exist before calling.

### 5.2 Verify the swatch card

**✅ Checklist**

- ✅ `palette.png` contains exactly 15 labeled rows and can be opened in any image viewer.
- ✅ You can visually confirm that the `gray-*` swatches share a tint consistent with the brand color, not a pure neutral gray.

**🤔 Socratic Question(s)**

- If a teammate says "the swatch looks washed out," where in the pipeline would you change the saturation, and would you change it globally (Step 2) or only for the gray sub-family?
- How would you add a hex label that automatically selects white or dark text based on luminance, and which Step 3 function already does the calculation you'd need?

## Step 6: Export design tokens as CSS

A design system's real test is whether someone can use it without understanding how it was built. CSS custom properties are the most portable deliverable: paste the file into a `<link>` tag or `@import` and every component in the project can reference `--color-brand`, `--font-size-lg`, or `--space-4` with no knowledge of HSL or modular scales.

### 6.1 Build the export function

**👟 Starter hint:** Walk each dictionary (`palette`, `typo`, `spacing`), format every value as a `--variable: value;` line, and write the joined result into a `.css` file.

```python
# design_system.py (continued)
def export_css(palette: dict, typography: dict, spacing: dict, filepath: str = "design-tokens.css") -> str:
    """Export design tokens as a CSS custom properties file."""
    lines = [":root {", "  /* Brand Colors */"]
    for name, color in palette.items():
        lines.append(f"  --color-{name}: {color};")

    lines += ["", "  /* Typography */"]
    for label, props in typography.items():
        lines.append(f"  --font-size-{label}: {props['size_rem']}rem;")
        lines.append(f"  --line-height-{label}: {props['line_height']};")

    lines += ["", "  /* Spacing */"]
    for step, value in spacing.items():
        lines.append(f"  --space-{step}: {value}px;")

    lines += ["}"]
    css = "\n".join(lines)
    with open(filepath, "w") as f:
        f.write(css)
    print(f"Design tokens exported to {filepath}")
    return css

css_output = export_css(palette, typo, spacing)
print("\n" + css_output)
```

Each section comments its category (`/* Brand Colors */`, `/* Typography */`, `/* Spacing */`) because the file will eventually be pasted into a codebase where someone besides you is reading it. `rem` rather than `px` for font sizes is deliberate, it inherits browser zoom settings and is the standard for accessible, responsive CSS. Printing the file content to stdout at the end gives you an instant visual confirmation that the structure is right, even before you open the CSS file in an editor.

**🎯 Expected output:** `design-tokens.css` is written, and its content prints to stdout: `:root {` with 15 `--color-*` custom properties, 16 `--font-size-*` / `--line-height-*` pairs, and 10 `--space-*` values, 42 total tokens.

**🩹 If it's off:** If the CSS file is empty or missing `:root`, check that `lines` is being joined and written, an early `return` before `open()` is the usual culprit. If a line looks like `--color-brand: #3b82f6` without a semicolon, the f-string is missing `;`, the token is syntactically broken and will silently eat every property that follows it in the same rule block.

### 6.2 Verify the export

**✅ Checklist**

- ✅ `design-tokens.css` exists, starts with `:root {`, and contains 42 custom properties in the right three sections.
- ✅ Pasting one line, `h1 { color: var(--color-brand); font-size: var(--font-size-xl); }`, into any HTML file resolves to the correct values.

**🤔 Socratic Question(s)**

- The exported file uses `px` for spacing and `rem` for font sizes. Why is mixing units correct here, and what would happen if you used `px` for `font-size` too, specifically, what happens when a browser's zoom setting is increased?
- If you wanted the same design system available in both light and dark mode, where in this pipeline would you insert a second palette export, and how would you structure the CSS to swap automatically?

## ⚠️ Common pitfalls

- **Confusing `colorsys.rgb_to_hls` with `rgb_to_hsv`.** The two functions have different return shapes and swap where saturation appears. If your generated palette has completely wrong hues, print the raw output of `hex_to_hsl` before anything downstream touches it, the bug is always there.
- **Lightness clamping makes adjacent shades indistinguishable.** `min(l + 35, 95)` puts a ceiling on the lightest shade, but if the base color's lightness is already high (say, a pastel brand at 80), the entire upper half of the palette collapses toward near-white. One practical fix: reduce the step sizes or widen the range dynamically based on the base lightness.
- **Relative luminance weights applied in the wrong channel order.** WCAG specifies `0.2126·R + 0.7152·G + 0.0722·B`, not any other permutation. Getting it backwards produces subtly wrong ratios that can flip a AA pass into a AA fail.
- **Rem vs. px confusion in the typographic scale.** `size_rem` is always `size_px / 16`, if you accidentally output the pixel value with a `rem` label, every size will be exactly 16× too large and the whole page will blow out.
- **Generating a palette without considering the base color's existing lightness.** A dark base color shifted darker by 35 lightness points is already black, the dark end of the palette becomes unreadable. Test the generator against a dark brand hex and a light one before shipping it.

## What you just built

A self-contained design system generator: you picked one brand color, and the script produced a full family of shades and grays, verified every text/background pair against WCAG accessibility rules, generated a typographic and spacing scale with a mathematically consistent ratio, rendered a shareable palette swatch card as a PNG, and exported 42 CSS custom properties ready to drop into any web project. Nothing about the output requires a designer's eye to use, any frontend developer can import the CSS file and reference `--color-brand` without ever opening the Python source.

:::tip[Run a fuller version without any local setup]
[`examples/design-system/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/design-system) in the course repo is a runnable notebook version of every step above: paste in a brand color, run all cells, and get the palette image and CSS file in a single notebook execution. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Add a **dark mode variant**: invert lightness values (swap `l` with `100 - l`) while keeping hue and saturation fixed, then export a second CSS file under a `@media (prefers-color-scheme: dark)` media query so the system auto-switches.
- Build a **palette preview HTML page**: generate a living style guide that shows every color, every font size, and every spacing value in actual use, headings in the scale, padding demos at each spacing level, and serve it locally while you tune the design system.
- Add **component tokens** (button padding, border radius, input height) as a new `/* Components */` section in the CSS export, making the design system directly consumable by a component library like React or Vue.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python that makes CSS think for itself. 🎓