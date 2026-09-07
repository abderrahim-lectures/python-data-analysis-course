---
title: "Build an Image Editor Toolkit"
slug: /projects/image-editor
description: "Process real images with Pillow: load and inspect, apply filters, crop and resize without distortion, watermark for branding, and batch-process an entire folder in one pass."
difficulty: "intermediate"
estimatedMinutes: 60
tags: ["pillow", "image-processing", "filters", "batch-processing"]
learningObjectives:
  - "Load, inspect, and save images in multiple formats with Pillow"
  - "Apply filters and enhancements through one dispatch table"
  - "Resize and crop while preserving aspect ratios"
  - "Add text and image watermarks with transparency"
  - "Batch-process entire directories of images"
prerequisites:
  - "Python basics (functions, loops, dictionaries)"
  - "File I/O and working with folders"
---

# 🛠️ 🖼️ Build an Image Editor Toolkit

Every device fills up with photos that all need the same treatment — a resize here, a watermark there, a brightness bump everywhere. This project builds an image-processing toolkit with Pillow that can load and inspect images, apply filters and color enhancements, crop and resize without distortion, add transparent watermarks, and process an entire folder of images in a single pass.

This assumes Python 101 and basic comfort with files and folders — nothing from Data Analysis is required. It's optional and ungraded; see [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Load real images and inspect their format, dimensions, and color mode.
2. Apply blur, sharpen, edge, brightness, and saturation effects through a single dispatch table.
3. Resize and crop without stretching, preserving the aspect ratio.
4. Add a semi-transparent text watermark and an image logo overlay.
5. Batch-process your whole image folder with one loop.

## Where to run this

**Locally with `uv`** is the primary path. Pillow is a native library — its `resize`, `filter`, and decode paths link against compiled image codecs — and it installs cleanly with `uv add`, giving you the full toolkit plus the real filesystem that batch-processing wants.

**Google Colab and Binder notebook runs** work well too: the notebook mirrors every step, Pillow installs with a single `!pip install Pillow`, and you can upload a photo or use the same deterministic test images the setup generates. **JupyterLite** is the one path to steer around: it runs Python in the browser without a native package layer, so Pillow can't install there — use the notebook badges below or the local path instead.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/image-editor/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/image-editor/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fimage-editor%2Fnotebook.ipynb)

## Setup

Create the project and install Pillow, then generate three deterministic test images so every step in this project has material to work on — no internet or personal photos required.

```bash
uv init image-editor
cd image-editor
uv add Pillow
```

**👟 Starter hint:** Write the setup as a tiny script you can re-run: it makes a folder and draws a few colored shapes per image, so you always have fresh, known input.

```python
# make_sample_images.py
from pathlib import Path
from PIL import Image, ImageDraw
import random

def make_sample_images(output: str = "input_photos", count: int = 3, size: int = 480) -> None:
    """Generate `count` deterministic RGB test images for the editor to chew on."""
    out = Path(output)
    out.mkdir(parents=True, exist_ok=True)
    for i in range(1, count + 1):
        rng = random.Random(i)
        img = Image.new("RGB", (size, size), (rng.randint(20, 60), rng.randint(20, 60), rng.randint(20, 60)))
        draw = ImageDraw.Draw(img)
        for _ in range(rng.randint(6, 12)):
            x0, y0 = rng.randint(0, size), rng.randint(0, size)
            x1, y1 = rng.randint(x0, size), rng.randint(y0, size)
            color = (rng.randint(80, 255), rng.randint(80, 255), rng.randint(80, 255))
            if rng.random() < 0.5:
                draw.rectangle((x0, y0, x1, y1), fill=color)
            else:
                draw.ellipse((x0, y0, x1, y1), fill=color)
        img.save(out / f"photo{i}.jpg", quality=92)
    print(f"Generated {count} test images in {output}/")

make_sample_images()
```

The key trick is `random.Random(i)` — a *seeded per-image* generator instead of the global one. Because every call re-seeds with the same `i`, running this script twice produces byte-identical folders, which means your expected outputs and failure checks stay reproducible instead of changing shape every run. `Image.new("RGB", (size, size), color)` starts each image as a flat background, and `ImageDraw` proxies (`draw.rectangle`, `draw.ellipse`) paint the shapes — your first taste of Pillow's "open an image, get a drawing surface, save" loop.

**🎯 Expected output:** A new `input_photos/` folder containing `photo1.jpg`, `photo2.jpg`, and `photo3.jpg`, each 480×480 — and re-running the script prints the same message without changing any pixels.

**🩹 If it's off:** If the folder is empty, the `mkdir(parents=True, exist_ok=True)` line is missing, or the `save` path doesn't join `output` and the filename. If the images change every run, the generator isn't seeded per-file — swap `random.Random(i)` back in inside the loop.

**✅ Checklist**

- ✅ `uv run python --version` works and `uv add Pillow` installed cleanly.
- ✅ `input_photos/` contains `photo1.jpg`, `photo2.jpg`, and `photo3.jpg` (480×480 each).
- ✅ The images look different from one another and are stable across re-runs.

## Step 1: Load and inspect an image

Before you edit a photo you need to know what you're holding: the format, the dimensions, and the color mode. Pillow opens an image lazily — it reads the header but won't decode the pixels until forced to — so this step builds a loader that catches problems *early* and inspects what it loaded.

### 1.1 Write a safe loader

**👟 Starter hint:** `Image.open` can succeed on a file that later can't be decoded, so force the decode with `img.load()` inside the same protected block and raise on anything unusual.

```python
# editor.py
from PIL import Image, ImageFilter, ImageEnhance

def load_image(path: str) -> Image.Image:
    """Load an image and handle common errors."""
    try:
        img = Image.open(path)
        img.load()  # force a real decode, so corrupt files fail here, not later
        return img
    except FileNotFoundError:
        print(f"Error: File '{path}' not found.")
        raise
    except Exception as e:
        print(f"Error loading image: {e}")
        raise

img = load_image("input_photos/photo1.jpg")
print(f"Format: {img.format}")
print(f"Size:   {img.width}x{img.height} pixels")
print(f"Mode:   {img.mode}")  # RGB, RGBA, L, etc.
```

The `img.load()` call after `Image.open` is the philosophical core of this chunk. `Image.open` only reads the file header; the pixel data is decoded lazily on first use, which means a truncated file can fail deep inside a later `save()` call with a confusing error. Calling `.load()` inside the `try` forces the decode to happen *now*, where the `except` block can report it clearly. The separate `except FileNotFoundError` gives you a specific, honest message that a missing filename is the problem.

**🎯 Expected output:** `Format: JPEG`, `Size:   480x480 pixels`, `Mode:   RGB` — and loading a nonexistent path prints `Error: File '...' not found.` before the traceback.

**🩹 If it's off:** If you only get `Format: None`, you opened the image but never accessed pixel data, or saved a fresh image without an explicit format — loading JPEG/PNG from disk always reports a format. If a genuinely corrupt file crashes later in a `save()`, `img.load()` isn't inside the `try`. If the mode prints `RGBA` or `L`, that's correct for your input, not a bug — just note the mode shown differs per file type.

### 1.2 Tour the whole folder

**👟 Starter hint:** Loop the safe loader over every JPEG in the folder and print one inspection line each, so you confirm the whole portfolio is loadable before editing anything.

```python
# editor.py (continued)
from pathlib import Path

for path in sorted(Path("input_photos").glob("*.jpg")):
    info = load_image(str(path))
    print(f"{path.name:12} {info.width}x{info.height} {info.mode}")
```

`Path("input_photos").glob("*.jpg")` returns an iterable of file paths; wrapping each in `str()` and passing it to `load_image` keeps a single, well-tested entry point for opening files. Looping here also catches a whole-folder failure mode early: if one image is corrupt, you find it in a three-line report rather than halfway through a three-hundred-file batch.

**🎯 Expected output:** Three lines — `photo1.jpg    480x480 RGB`, `photo2.jpg    480x480 RGB`, `photo3.jpg    480x480 RGB`.

**🩹 If it's off:** If no files match, you're globbing the wrong directory or the filter is `*.png` while the setup wrote `.jpg`. If one line raises an error, that single file is corrupt or unreadable — a fake `.jpg` extension on a text file reproduces this nicely.

### 1.3 Verify loading and inspection

**✅ Checklist**

- ✅ `load_image("input_photos/photo1.jpg")` returns an image and prints its real format, size, and mode.
- ✅ A missing path hits the `FileNotFoundError` branch with the clear message.
- ✅ The folder loop prints all three images without a traceback.

**🤔 Socratic Question(s)**

- `img.load()` exists because `Image.open` is lazy. What specific failure — and at what point in the program — becomes much harder to diagnose if you skip `load()` and let the decode happen inside a later `save()`?
- The same `load_image` function serves both the single-image and the folder-loop cases. What would change about error handling if you wanted *batch* loading to collect failures and keep going, instead of raising on the first bad file?

## Step 2: Apply filters and enhancements

Pillow ships two families of adjustments: `ImageFilter`, which transforms pixels (blur, sharpen, edge detection), and `ImageEnhance`, which scales aspects of the image (brightness, contrast, color). This step wraps them in one function that dispatches by name, and chains two effects into a final image.

### 2.1 Build the filter dispatch table

**👟 Starter hint:** Put the mapping of name → operation in a `dict` whose values are small callables, so adding a new filter later means adding one line, not another `if` branch.

```python
# editor.py (continued)
def apply_filter(img: Image.Image, filter_name: str, **kwargs) -> Image.Image:
    """Apply a named filter to an image, returning a new image."""
    filters = {
        "blur": lambda: img.filter(ImageFilter.GaussianBlur(radius=kwargs.get("radius", 5))),
        "sharpen": lambda: img.filter(ImageFilter.SHARPEN),
        "edge": lambda: img.filter(ImageFilter.FIND_EDGES),
        "emboss": lambda: img.filter(ImageFilter.EMBOSS),
        "brightness": lambda: ImageEnhance.Brightness(img).enhance(kwargs.get("factor", 1.5)),
        "contrast": lambda: ImageEnhance.Contrast(img).enhance(kwargs.get("factor", 1.5)),
        "saturation": lambda: ImageEnhance.Color(img).enhance(kwargs.get("factor", 2.0)),
    }
    if filter_name not in filters:
        raise ValueError(f"Unknown filter: {filter_name}. Available: {', '.join(filters)}")
    return filters[filter_name]()
```

The `dict`-of-lambdas is a **dispatch table**: the key *is* the branch, so the lookup `filters[filter_name]()` replaces a long `if/elif` chain. Unknown names fail loudly (`ValueError`) rather than silently returning the image unchanged, which is what makes typos visible in batch processing. Each enhancement wraps the *current* image and `.enhance(factor)` multiplies that property — a factor over `1.0` strengthens it, under `1.0` weakens it.

**🎯 Expected output:** `apply_filter(img, "blur", radius=8)` returns a softer image; `apply_filter(img, "edge")` returns an almost-black image with bright outlines. `apply_filter(img, "nope")` raises `ValueError: Unknown filter: nope. Available: blur, sharpen, edge, emboss, brightness, contrast, saturation`.

**🩹 If it's off:** If `GaussianBlur` is not found, you imported only `ImageEnhance` this chunk — `ImageFilter` must be in the same `from PIL import ...` line (or added). If the "edge" result looks like the original, you're reusing a displayable original instead of the *returned* image — always reassign `img = apply_filter(img, ...)` in a chain.

### 2.2 Chain two effects and save

**👟 Starter hint:** Apply a brightness lift, then sharpen the *result*, and save with a JPEG quality setting — proving filters compose when each returns an image.

```python
# editor.py (continued)
bright = apply_filter(img, "brightness", factor=1.3)
sharp = apply_filter(bright, "sharpen")
sharp.save("enhanced.jpg", quality=95)
print("Saved enhanced.jpg")
```

Chaining works because every filter returns a new image rather than mutating the input — `sharp = apply_filter(bright, ...)` reads the *previous* output as its input. The `quality=95` argument on `save()` matters for JPEG specifically: it trades file size for fidelity, and unlike PNG (lossless, no quality knob), picking a sane value is part of producing acceptable output.

**🎯 Expected output:** `Saved enhanced.jpg`, and the new file is visibly brighter and crisper than `photo1.jpg` when opened.

**🩹 If it's off:** If the saved image looks identical to the source, the chain passed `img` to both calls instead of passing `bright` into the second. If `save` raises about the mode, the source image isn't RGB (it's `L` or `RGBA`) — JPEG accepts RGB; convert with `.convert("RGB")` first.

### 2.3 Verify the filter pipeline

**✅ Checklist**

- ✅ `blur`, `sharpen`, `edge`, `emboss`, `brightness`, `contrast`, and `saturation` all produce visibly different images.
- ✅ An unknown filter name raises a `ValueError` that lists the valid names.
- ✅ The two-effect chain saved `enhanced.jpg`.

**🤔 Socratic Question(s)**

- The dispatch dict's lambdas each capture `img` from the enclosing scope. If you called `apply_filter` with no image and a later lambda referenced `img`, when would the error surface — and what does that tell you about how eagerly a dict of lambdas is evaluated?
- `brightness` and `contrast` both default to `factor=1.5`. Why is a factor of `1.0` the "neutral" value for `ImageEnhance` — and how does that differ from what a filter like `FIND_EDGES` (which has no factor at all) conceptually does instead?

## Step 3: Resize and crop without distortion

Stretching an image to fit a width produces the classic squashed-photo look; resizing proportionally doesn't. This step builds a resize that preserves the aspect ratio and a crop that grabs the center of the image — the two operations behind every thumbnail and every site hero.

### 3.1 Resize keeping the aspect ratio

**👟 Starter hint:** Compute the ratio between the target width and the current width, apply it to the height, and pass the whole new size to `resize` with a high-quality resampling filter.

```python
# editor.py (continued)
def resize_keep_ratio(img: Image.Image, max_width: int) -> Image.Image:
    """Resize to max_width, keeping the aspect ratio."""
    ratio = max_width / img.width
    new_height = int(img.height * ratio)
    return img.resize((max_width, new_height), Image.LANCZOS)

small = resize_keep_ratio(load_image("input_photos/photo1.jpg"), 640)
print(f"resized -> {small.size}")
```

The whole idea lives in one arithmetic step: `ratio = max_width / img.width` gives you the scale, and multiplying the height by that same ratio guarantees the width and height shrink together — no distortion. `Image.LANCZOS` asks Pillow's best downsampling filter, which matters most when shrinking (it smooths jagged edges). This is the canonical dimensionless "fit inside a width" recipe used by every thumbnail generator.

**🎯 Expected output:** `resized -> (640, 640)` — the 480×480 test image scales to width 640 with height 640, ratio intact (try it on the original and verify `height/width` is unchanged).

**🩹 If it's off:** If the result is a different ratio than the source, `new_height` wasn't computed from `img.height * ratio`. If you get `AttributeError: 'Image' object has no attribute 'resize'`, the object being passed isn't a Pillow image — run the result of `load_image(...)` directly into this function. If `Image.LANCZOS` errors on very old Pillow versions, upgrade Pillow (the constant is a longstanding alias).

### 3.2 Crop the center square

**👟 Starter hint:** For a requested side length, compute the box that centers on the image, then hand that four-tuple to `crop` — cropping never resizes, it just slices.

```python
# editor.py (continued)
def crop_center_square(img: Image.Image, side: int) -> Image.Image:
    """Crop the center square of `side` pixels from the middle of an image."""
    left = (img.width - side) // 2
    top = (img.height - side) // 2
    return img.crop((left, top, left + side, top + side))

thumb = crop_center_square(load_image("input_photos/photo1.jpg"), 240)
thumb.save("thumb.jpg", quality=95)
print(f"thumb -> {thumb.size}")
```

`crop` takes a box `(left, top, right, bottom)` and returns the slice, keeping the same pixel resolution within it — which is why a thumbnail made this way is *sharp*: you center-crop *then* downscale if you want a small square. The `// 2` integer division centers the window by distributing any odd leftover evenly. This "find the box, keep it square" pattern is the default avatar-crop behavior in most apps.

**🎯 Expected output:** `thumb -> (240, 240)`, saved as `thumb.jpg`, depicting the middle of the original rather than its top-left corner.

**🩹 If it's off:** If the crop isn't centered, one of `left`/`top` uses single `/` float division, producing fractional coordinates. If `side` exceeds the image dimension, `left` goes negative and the crop window exceeds the image — guard by clamping `side = min(side, img.width, img.height)`. If the thumb is a tiny slice, the box arithmetic is inverted (`left + side` vs `left - side`).

### 3.3 Verify resize and crop

**✅ Checklist**

- ✅ `resize_keep_ratio(img, 640)` preserves the aspect ratio (height/width unchanged).
- ✅ `crop_center_square(img, 240)` returns a focused 240×240 center slice.
- ✅ Both results save successfully.

**🤔 Socratic Question(s)**

- `resize_keep_ratio` rounds `new_height` with `int()`. For a rectangle whose true scaled height is fractional, does cropping or resizing *then* rounding ever produce a one-pixel ratio error — and when (if ever) does a single pixel of distortion matter in practice?
- Center-crop then downscale is one way to make a thumbnail. How would the *visual result* differ if you downscaled first and cropped second — and why do real avatar systems crop before scaling instead?

## Step 4: Add watermarks

A watermark is branding (or copyright protection) that has to sit visibly on top of the photo without hiding the photo. The trick in Pillow is that drawing on the *original* image can't produce partial transparency on an RGB canvas — so you draw on a separate RGBA overlay layer and composite it.

### 4.1 Add a transparent text watermark

**👟 Starter hint:** Copy the image to RGBA, build a fully transparent overlay of the same size, draw white text at 50% alpha on the overlay, then `alpha_composite` the two and flatten back to RGB for saving.

```python
# editor.py (continued)
from PIL import ImageDraw, ImageFont

def add_text_watermark(img: Image.Image, text: str, position: str = "bottom-right") -> Image.Image:
    """Add a semi-transparent text watermark and flatten to RGB."""
    watermarked = img.copy().convert("RGBA")
    overlay = Image.new("RGBA", watermarked.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(overlay)

    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
    except (IOError, OSError):
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    margin = 20

    positions = {
        "bottom-right": (img.width - text_w - margin, img.height - text_h - margin),
        "bottom-left": (margin, img.height - text_h - margin),
        "top-right": (img.width - text_w - margin, margin),
        "center": ((img.width - text_w) // 2, (img.height - text_h) // 2),
    }
    x, y = positions.get(position, positions["bottom-right"])
    draw.text((x, y), text, fill=(255, 255, 255, 128), font=font)

    return Image.alpha_composite(watermarked, overlay).convert("RGB")

watermarked = add_text_watermark(load_image("input_photos/photo2.jpg"), "My Photo 2026", "bottom-right")
watermarked.save("watermarked.jpg", quality=95)
print("Saved watermarked.jpg")
```

The alpha value in `fill=(255, 255, 255, 128)` is the payoff: `128` on an RGBA scale of 0–255 is exactly 50% opacity. Drawing that white half-transparent text on a *separate overlay*, then calling `alpha_composite(watermarked, overlay)`, is what keeps the photo underneath untouched while the text shows through — drawing directly on an RGB image would have to replace pixels outright. `.convert("RGB")` at the end flattens the alpha away so the JPEG encoder (which stores no transparency) accepts the file.

**🎯 Expected output:** `Saved watermarked.jpg` — the photo with `My Photo 2026` floating at 50% opacity in the bottom-right, centered margin at 20 px from the edges.

**🩹 If it's off:** If the text is fully solid, the alpha channel is `255` (or the `.convert("RGB")` ran *before* compositing, flattening transparency away). If the text sits partially off-canvas, `text_w`/`text_h` come from a stale `bbox` and don't match the font actually used. If the fallback default font looks like a 1-pixel blur, the DejaVu path wasn't found on your system — point `truetype` at an existing font file, or use `load_default(size=...)` on Pillow 10+.

### 4.2 Overlay an image logo

**👟 Starter hint:** Reuse the thumbnail from Step 3 as a logo, scale it to a fraction of the image width, and `paste` it with its own alpha channel as the mask so its transparency is preserved.

```python
# editor.py (continued)
def add_image_watermark(img: Image.Image, logo: Image.Image, scale: float = 0.15, margin: int = 16) -> Image.Image:
    """Paste a scaled logo into the bottom-right corner, keeping its alpha."""
    base = img.convert("RGBA")
    logo_rgba = logo.convert("RGBA")
    new_w = max(1, int(base.width * scale))
    ratio = new_w / logo_rgba.width
    logo_rgba = logo_rgba.resize((new_w, int(logo_rgba.height * ratio)), Image.LANCZOS)
    x = base.width - logo_rgba.width - margin
    y = base.height - logo_rgba.height - margin
    base.paste(logo_rgba, (x, y), logo_rgba)  # third arg = alpha mask
    return base.convert("RGB")

logo = load_image("thumb.jpg")
with_logo = add_image_watermark(load_image("input_photos/photo3.jpg"), logo)
with_logo.save("logo_watermark.jpg", quality=95)
print("Saved logo_watermark.jpg")
```

`paste` with the image passed *as its own mask* is the subtle line: `base.paste(logo_rgba, (x, y), logo_rgba)` pastes the pixels, and the third argument — the image's own alpha channel — decides pixel-by-pixel how strongly the logo shows through. An RGBA logo pasted without a mask would plonk down its opaque rectangle; with a mask, its transparency survives. `scale=0.15` sizes the logo relative to the image, so the same function works on a 480-px test file and on a 6000-px DSLR export.

**🎯 Expected output:** `Saved logo_watermark.jpg` — `thumb.jpg` appears bottom-right of `photo3.jpg` at roughly 15% of the image width, with its corners not showing a hard box.

**🩹 If it's off:** If the logo has an ugly opaque bounding box, the mask argument (third `paste` arg) is missing. If the logo is gigantic or microscopic, `new_w` uses the source width rather than `base.width * scale`. If the paste silently does nothing, the source logo loaded as a *lazy* image — call `.load()` or reference pixels before pasting.

### 4.3 Verify the watermark step

**✅ Checklist**

- ✅ The text watermark saves as a JPEG at ~50% opacity in all four named positions.
- ✅ A logo pasted with its alpha mask keeps transparent corners.
- ✅ Both outputs open cleanly and the photo content is still visible under the watermark.

**🤔 Socratic Question(s)**

- `fill=(255, 255, 255, 128)` is half transparent. What would happen textually if you drew on the original RGB image with that same 4-tuple instead of on an RGBA overlay — why can't an RGB canvas represent "half-there" at all?
- The overlay is a separate, fully transparent image the same size as the photo. Why this two-layer design instead of drawing the text once and saving? What would you have to change to later reposition a watermark without re-drawing the photo underneath?

## Step 5: Batch-process a directory

The whole point of a toolkit is scale: the same five steps, applied to every image in a folder, without opening each one by hand. This step builds the loop that turns your functions into a one-command folder processor.

### 5.1 Process every image in a folder

**👟 Starter hint:** Collect the image files by extension, make an output folder, and run the filter chain per file while catching errors *per file* so one bad image never aborts the batch.

```python
# editor.py (continued)
def batch_process(input_dir: str, output_dir: str, operations: list[dict]) -> None:
    """Apply a chain of named filter operations to every image in a directory."""
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    extensions = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff"}
    files = [f for f in Path(input_dir).iterdir() if f.suffix.lower() in extensions]

    print(f"Processing {len(files)} images...")
    for filepath in files:
        try:
            img = load_image(str(filepath))
            for op in operations:
                img = apply_filter(img, op["filter"], **op.get("params", {}))
            out_name = f"processed_{filepath.stem}.jpg"
            img.save(out / out_name, quality=90)
            print(f"  OK {filepath.name} -> {out_name}")
        except Exception as e:
            print(f"  SKIP {filepath.name}: {e}")

batch_process("input_photos", "output", [
    {"filter": "brightness", "params": {"factor": 1.2}},
    {"filter": "contrast", "params": {"factor": 1.1}},
    {"filter": "sharpen"},
])
```

The design that makes a batch trustworthy is the inner `try/except` *inside* the loop: a corrupt file, a wrong mode, any per-file failure prints `SKIP photo2.jpg: ...` and the loop moves on — one bad image doesn't kill the other two hundred. `operations` is a list of small dicts that reuse the exact `apply_filter` dispatch from Step 2, so the batch pipeline and the interactive single-image path share the same semantics. The extension set plus `suffix.lower()` respects case (`JPG` vs `jpg`) and skips stray non-image files.

**🎯 Expected output:** `Processing 3 images...` then one `OK photoN.jpg -> processed_photoN.jpg` line per file, and an `output/` folder containing three processed JPEGs.

**🩹 If it's off:** If nothing processes, the output folder exists but the input path is wrong or the extension filter excludes your files. If the batch stops at the first error, the `try/except` is wrapped around the whole loop instead of a single file. If every output is a filter's default version regardless of `params`, the `**op.get("params", {})` unpacking is missing from the `apply_filter` call.

### 5.2 Verify the batch pass

**✅ Checklist**

- ✅ All three images in `input_photos/` get written to `output/` as `processed_*.jpg`.
- ✅ A deliberately broken file in the folder causes a `SKIP` line but doesn't stop the rest.
- ✅ The batch uses the same `apply_filter` dictionary as the interactive steps.

**🤔 Socratic Question(s)**

- The batch saves every result as JPEG. What would you need to change to *preserve* the source format (PNG stays PNG, WebP stays WebP), and what does `filepath.suffix` give you for free here?
- `SKIP` prints and continues on any exception — unconditional. When is swallowing-and-continuing the *wrong* choice, and what kind of counter (or stop-after-N) would let the batch surface a systemic problem instead of hiding it?

## ⚠️ Common pitfalls

- **Saving RGBA as JPEG.** JPEG has no alpha channel, so a watermarked (RGBA) image fails or flattens unpredictably. Fix: `.convert("RGB")` before any JPEG `save()` — both watermark functions above do this deliberately.
- **Forgetting `ImageFilter` in the import.** `from PIL import Image, ImageEnhance` works fine until `ImageFilter.GaussianBlur` raises `AttributeError` deep in a filter call. Fix: one import line for all three (`Image`, `ImageFilter`, `ImageEnhance`) — the setup does it, keep it that way.
- **Platform-specific font paths.** The DejaVu path is a Linux well-known location; on macOS or Windows `truetype` raises and you fall back to a tiny default font. Fix: wrap the lookup in `try/except` (as shown), or accept a font path argument so callers pass their own.
- **Not reassigning chained results.** `apply_filter(bright, "sharpen")` returns a new image; ignoring the return and saving the middle variable quietly undoes half the chain. Fix: always write `img = apply_filter(img, ...)` or feed the previous result directly into the next call.
- **One bad file killing a batch.** An unguarded loop turns one corrupt JPEG into zero outputs. Fix: keep `try/except` *inside* the loop (Step 5), and consider logging which files were skipped so you can inspect them later.

## What you just built

A real image-processing toolkit: it loads and inspects images safely, applies seven filter/enhancement effects through one dispatch table, resizes and crops without distortion, layers transparent text and logo watermarks, and runs the whole chain over a folder automatically. The transferable skill is *the transform-chain design*: every operation takes an image and returns an image, so single edits and thousand-file batches use identical building blocks — the same composition pattern behind every image library, from thumbnails to full editing suites.

:::tip[Run a fuller version without any local setup]
[`examples/image-editor/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/image-editor) in the course repo ships the complete script plus a format converter and a side-by-side comparison tool. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Build a **format converter**: a function that takes a source path and a target format string (`"webp"`, `"png"`) and saves with the right extension — a six-line addition that converts your whole folder to WebP in one pass. The tiny hint: `img.save(path.with_suffix("." + target))` usually just works.
- Make a **side-by-side comparison tool** that places before and after images next to each other with a separator line — create a new canvas with `Image.new`, then `paste` both images onto it at the two halves.
- Extract **EXIF metadata** (camera, GPS, timestamp) from smartphone JPEGs with `img.getexif()` — a read-only superpower that reuses your `load_image` function unchanged.
- Add **aspect-cropping presets** — `crop_center_square` already generalizes to "cover" crops for 16:9 banners; generalize the box arithmetic once and every size is a function call.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to making computers see pictures. 🎓