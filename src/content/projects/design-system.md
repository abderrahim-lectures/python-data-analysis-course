---
title: "Design System Generator"
description: "Generate a design system from brand colors — typography, spacing, components, and CSS variables."
difficulty: "beginner"
estimatedMinutes: 35
tags: ["design", "css", "color-theory", "data-visualization", "matplotlib"]
learningObjectives:
  - Generate harmonious color palettes from a base color
  - Calculate WCAG accessibility contrast ratios
  - Build a typographic scale with consistent spacing
  - Export design tokens as CSS custom properties
prerequisites:
  - Basic Python functions and loops
  - Understanding of hex color codes
  - Familiarity with CSS variables (helpful but not required)
---

# Design System Generator

Generate a complete design system from brand colors. You'll create color palettes with accessibility checking, a typographic scale, spacing tokens, and export everything as ready-to-use CSS.

## What You'll Learn

- How to generate harmonious color palettes from a single brand color
- How to calculate WCAG contrast ratios and verify accessibility
- How to build a typographic scale using a modular ratio
- How to export design tokens as CSS custom properties

## What You'll Build

A Python script that:

- Takes a brand hex color and generates primary, secondary, accent, and neutral palettes
- Checks contrast ratios between text and background colors for WCAG compliance
- Generates a typographic scale with font sizes, line heights, and spacing values
- Exports the full design system as a CSS file with custom properties

## Where to Run It

This project runs anywhere Python is available. You can use:

- **JupyterLite playground** — paste code blocks into cells and run them in the browser
- **Local with uv** — install dependencies and run from your terminal
- **Google Colab** — click the Colab badge on the project page to run in a cloud notebook

## Setup

Create a new project and install dependencies:

```bash
uv init design-system
cd design-system
uv add matplotlib
```

The `colorsys` module comes with Python and handles the color space conversions. `matplotlib` is used for visualizing the generated palettes.

## Step 1 — Convert Between Color Formats

You'll need to move between hex strings, RGB tuples, and HSL for palette generation. Build helpers for each direction.

```python
import colorsys

def hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    """Convert a hex color string to RGB tuple (0-255)."""
    h = hex_color.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def rgb_to_hex(r: int, g: int, b: int) -> str:
    """Convert RGB values to a hex color string."""
    return f"#{r:02x}{g:02x}{b:02x}"

def hex_to_hsl(hex_color: str) -> tuple[float, float, float]:
    """Convert hex to HSL (h: 0-360, s: 0-100, l: 0-100)."""
    r, g, b = hex_to_rgb(hex_color)
    r_norm, g_norm, b_norm = r / 255, g / 255, b / 255
    h, l, s = colorsys.rgb_to_hls(r_norm, g_norm, b_norm)
    return h * 360, s * 100, l * 100

def hsl_to_hex(h: float, s: float, l: float) -> str:
    """Convert HSL (h: 0-360, s: 0-100, l: 0-100) to hex."""
    r, g, b = colorsys.hls_to_rgb(h / 360, l / 100, s / 100)
    return rgb_to_hex(int(r * 255), int(g * 255), int(b * 255))

# Test conversions
brand = "#3b82f6"
r, g, b = hex_to_rgb(brand)
h, s, l = hex_to_hsl(brand)
print(f"  {brand} -> RGB({r}, {g}, {b}) -> HSL({h:.0f}°, {s:.0f}%, {l:.0f}%)")
print(f"  Back to hex: {hsl_to_hex(h, s, l)}")
```

These four functions are the foundation for every color manipulation in the project.

## Step 2 — Generate a Color Palette

Create lighter and darker variants of a brand color by adjusting lightness in HSL space.

```python
def generate_palette(base_hex: str) -> dict:
    """Generate a full palette from a base brand color."""
    h, s, l = hex_to_hsl(base_hex)

    palette = {
        "brand": base_hex,
        "lightest": hsl_to_hex(h, s, min(l + 35, 95)),
        "lighter": hsl_to_hex(h, s, min(l + 20, 90)),
        "light": hsl_to_hex(h, s, min(l + 10, 85)),
        "dark": hsl_to_hex(h, s, max(l - 10, 10)),
        "darker": hsl_to_hex(h, s, max(l - 20, 5)),
        "darkest": hsl_to_hex(h, s, max(l - 35, 0)),
    }

    # Generate neutral grays based on the brand hue
    palette["gray-100"] = hsl_to_hex(h, 5, 96)
    palette["gray-200"] = hsl_to_hex(h, 5, 90)
    palette["gray-300"] = hsl_to_hex(h, 5, 80)
    palette["gray-400"] = hsl_to_hex(h, 5, 60)
    palette["gray-500"] = hsl_to_hex(h, 5, 45)
    palette["gray-600"] = hsl_to_hex(h, 5, 30)
    palette["gray-700"] = hsl_to_hex(h, 5, 20)
    palette["gray-800"] = hsl_to_hex(h, 5, 12)
    palette["gray-900"] = hsl_to_hex(h, 5, 6)

    return palette

palette = generate_palette("#3b82f6")
print("  Brand palette:")
for name, color in palette.items():
    if name.startswith("gray"):
        continue
    print(f"    {name:>10}: {color}")
```

By shifting lightness while keeping the same hue and saturation, every variant feels cohesive with the brand.

## Step 3 — Check WCAG Contrast Ratios

Verify that text and background color combinations meet accessibility standards.

```python
def relative_luminance(hex_color: str) -> float:
    """Calculate relative luminance per WCAG 2.1."""
    r, g, b = hex_to_rgb(hex_color)
    channels = []
    for val in (r, g, b):
        srgb = val / 255
        linear = srgb / 12.92 if srgb <= 0.03928 else ((srgb + 0.055) / 1.055) ** 2.4
        channels.append(linear)
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]

def contrast_ratio(color1: str, color2: str) -> float:
    """Calculate WCAG contrast ratio between two hex colors."""
    l1 = relative_luminance(color1)
    l2 = relative_luminance(color2)
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)

def check_accessibility(foreground: str, background: str) -> str:
    """Check if a color pair meets WCAG AA and AAA standards."""
    ratio = contrast_ratio(foreground, background)
    aa_normal = ratio >= 4.5
    aa_large = ratio >= 3.0
    aaa = ratio >= 7.0

    status = "AAA" if aaa else ("AA" if aa_normal else "Fail")
    size = "normal text" if aa_normal else ("large text" if aa_large else "insufficient")

    return f"  {foreground} on {background}: {ratio:.1f}:1 -> {status} ({size})"

# Test common combinations
print(check_accessibility("#1e293b", "#ffffff"))
print(check_accessibility("#3b82f6", "#ffffff"))
print(check_accessibility("#64748b", "#ffffff"))
print(check_accessibility("#ffffff", "#1e293b"))
```

WCAG AA requires a 4.5:1 ratio for normal text and 3:1 for large text. AAA requires 7:1. Always check your palette against both light and dark backgrounds.

## Step 4 — Build a Typography Scale and Export CSS

Generate a modular typographic scale and export the entire design system as CSS custom properties.

```python
def typography_scale(base: float = 16, ratio: float = 1.25, steps: int = 8) -> dict:
    """Generate a typographic scale from a base size and ratio."""
    scale = {}
    labels = ["xs", "sm", "base", "md", "lg", "xl", "2xl", "3xl"]
    for i, label in enumerate(labels[:steps]):
        size = base * (ratio ** (i - 2))
        scale[label] = {
            "size_px": round(size, 1),
            "size_rem": round(size / 16, 3),
            "line_height": round(1.2 + (0.1 * (steps - i) / steps), 2),
        }
    return scale

def spacing_scale(base: float = 4, steps: int = 10) -> dict:
    """Generate a spacing scale using a linear progression."""
    return {f"{i+1}": base * (i + 1) for i in range(steps)}

def export_css(palette: dict, typography: dict, spacing: dict, filepath: str = "design-tokens.css"):
    """Export design tokens as a CSS custom properties file."""
    lines = [":root {", "  /* Brand Colors */"]

    for name, color in palette.items():
        lines.append(f"  --color-{name}: {color};")

    lines.append("")
    lines.append("  /* Typography */")
    for label, props in typography.items():
        lines.append(f"  --font-size-{label}: {props['size_rem']}rem;")
        lines.append(f"  --line-height-{label}: {props['line_height']};")

    lines.append("")
    lines.append("  /* Spacing */")
    for step, value in spacing.items():
        lines.append(f"  --space-{step}: {value}px;")

    lines.append("}")

    css = "\n".join(lines)
    with open(filepath, "w") as f:
        f.write(css)
    print(f"Design tokens exported to {filepath}")
    return css

typo = typography_scale()
spacing = spacing_scale()
css_output = export_css(palette, typo, spacing)
print(f"\n{css_output}")
```

The exported CSS file can be dropped into any web project. Every component can reference `--color-brand`, `--font-size-lg`, `--space-4`, and so on.

## 🧩 Challenges

### Challenge 1 — Visualize the Palette

Use matplotlib to render a horizontal bar chart showing every color in the palette as a filled rectangle with the hex label below it. Save the chart as `palette.png`. This gives you a visual reference card you can share with a team.

### Challenge 2 — Generate a Dark Mode Variant

Write a function that takes your light-mode palette and inverts the lightness values (light becomes dark, dark becomes light) while keeping hues and saturation the same. Export a second CSS file called `design-tokens-dark.css` with `@media (prefers-color-scheme: dark)` wrapping the variables.

### Challenge 3 — Add Component Tokens

Define token sets for common components: button padding, border radius, card shadow, and input height. Add them to the CSS export under a `/* Components */` section.

## Stretch Goals

- [ ] Add Figma and Sketch plugin export for design tool integration
- [ ] Build a dark mode variant generator from light theme tokens
- [ ] Implement responsive breakpoint tokens for mobile-first design
- [ ] Generate a preview HTML page that shows all colors, typography, and spacing in a living style guide

## What You Learned

You converted between color formats, generated harmonious palettes, verified WCAG accessibility, built a typographic scale, and exported everything as CSS custom properties. These are the same steps professional design systems use to keep visual consistency across large applications.
