---
title: "Image Editor"
description: "Process images with filters, resizing, watermarking, format conversion, and batch operations."
difficulty: "intermediate"
estimatedMinutes: 60
tags: ["pillow", "image-processing", "filters", "batch-processing"]
learningObjectives:
  - "Apply image filters (blur, sharpen, brightness) using Pillow"
  - "Resize and crop images while preserving aspect ratios"
  - "Add text and image watermarks with custom positioning"
  - "Convert between image formats and run batch operations on folders"
prerequisites: ["Python basics", "File I/O"]
---

# Image Editor

## What You'll Learn
- Use Pillow to open, manipulate, and save images in multiple formats
- Apply creative filters like blur, sharpen, and color adjustments
- Resize images intelligently without distortion
- Add watermarks for branding and content protection
- Process entire directories of images in a single batch

## What You'll Build
An image processing toolkit that can:
- Apply blur, sharpen, brightness, and color adjustments to any image
- Resize and crop images while maintaining aspect ratios
- Add customizable text and image watermarks with opacity control
- Convert between PNG, JPEG, WebP, and other formats
- Process thousands of images with a single command

## Where to Run It
This project works best **locally with `uv`** since Pillow requires native image libraries. It also runs in **Google Colab**. JupyterLite has limited Pillow support but can handle basic operations.

## Setup

```bash
# Create the project
uv init image-editor && cd image-editor

# Add Pillow
uv add Pillow

# Run the editor
uv run python main.py
```

## Step 1 — Load and Inspect an Image

```python
from PIL import Image, ImageFilter, ImageEnhance
from pathlib import Path

def load_image(path: str) -> Image.Image:
    """Load an image and handle common errors."""
    try:
        img = Image.open(path)
        img.load()  # Force load to catch corrupted files early
        return img
    except FileNotFoundError:
        print(f"Error: File '{path}' not found.")
        raise
    except Exception as e:
        print(f"Error loading image: {e}")
        raise

# Load and inspect
img = load_image("photo.jpg")
print(f"Format: {img.format}")
print(f"Size: {img.size[0]}x{img.size[1]} pixels")
print(f"Mode: {img.mode}")  # RGB, RGBA, L, etc.
```

## Step 2 — Apply Filters and Enhancements

```python
def apply_filter(img: Image.Image, filter_name: str, **kwargs) -> Image.Image:
    """Apply a named filter to an image."""
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
        print(f"Unknown filter: {filter_name}. Available: {', '.join(filters)}")
        return img
    return filters[filter_name]()

# Apply multiple filters
bright_img = apply_filter(img, "brightness", factor=1.3)
sharp_img = apply_filter(bright_img, "sharpen")
sharp_img.save("enhanced.jpg", quality=95)
print("Saved enhanced.jpg")
```

## Step 3 — Resize, Crop, and Watermark

```python
def resize_keep_ratio(img: Image.Image, max_width: int) -> Image.Image:
    """Resize image to max width, keeping aspect ratio."""
    ratio = max_width / img.width
    new_height = int(img.height * ratio)
    return img.resize((max_width, new_height), Image.LANCZOS)

def add_text_watermark(img: Image.Image, text: str, position: str = "bottom-right") -> Image.Image:
    """Add a semi-transparent text watermark."""
    from PIL import ImageDraw, ImageFont

    watermarked = img.copy().convert("RGBA")
    overlay = Image.new("RGBA", watermarked.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(overlay)

    # Use a reasonable default font
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
    except (IOError, OSError):
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    margin = 20

    positions = {
        "bottom-right": (watermarked.width - text_width - margin, watermarked.height - text_height - margin),
        "bottom-left": (margin, watermarked.height - text_height - margin),
        "top-right": (watermarked.width - text_width - margin, margin),
        "center": ((watermarked.width - text_width) // 2, (watermarked.height - text_height) // 2),
    }
    x, y = positions.get(position, positions["bottom-right"])
    draw.text((x, y), text, fill=(255, 255, 255, 128), font=font)

    return Image.alpha_composite(watermarked, overlay).convert("RGB")

# Resize and watermark
small = resize_keep_ratio(img, 800)
final = add_text_watermark(small, "My Photo © 2026", "bottom-right")
final.save("watermarked.jpg", quality=95)
```

## Step 4 — Batch Process a Directory

```python
def batch_process(input_dir: str, output_dir: str, operations: list[dict]) -> None:
    """Process all images in a directory with a list of operations."""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    extensions = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff"}
    files = [f for f in Path(input_dir).iterdir() if f.suffix.lower() in extensions]

    print(f"Processing {len(files)} images...")
    for filepath in files:
        try:
            img = load_image(str(filepath))
            result = img

            for op in operations:
                result = apply_filter(result, op["filter"], **op.get("params", {}))

            out_name = f"processed_{filepath.stem}.jpg"
            result.save(output_path / out_name, quality=90)
            print(f"  ✓ {filepath.name} → {out_name}")
        except Exception as e:
            print(f"  ✗ {filepath.name}: {e}")

# Batch enhance all images in a folder
batch_process("input_photos", "output", [
    {"filter": "brightness", "params": {"factor": 1.2}},
    {"filter": "contrast", "params": {"factor": 1.1}},
    {"filter": "sharpen"},
])
```

## 🧩 Challenges

<details>
<summary><strong>Challenge 1: Add an image watermark overlay</strong></summary>

Load a small logo image, resize it to a percentage of the main image, and paste it onto the bottom-right corner with transparency. Use `Image.paste()` with an alpha mask.
</details>

<details>
<summary><strong>Challenge 2: Build a format converter</strong></summary>

Write a function that takes a source path and a target format string (e.g., `"webp"`), converts the image, and saves it with the correct extension. Handle palette modes by converting to RGB before saving to JPEG.
</details>

<details>
<summary><strong>Challenge 3: Create a side-by-side comparison tool</strong></summary>

Given two images of the same size, create a new image that places them side by side with a 4-pixel separator line. If sizes differ, resize both to match the smaller dimensions first.
</details>

## Stretch Goals
- [ ] Add background removal and image segmentation
- [ ] Build a thumbnail generation pipeline with responsive sizing
- [ ] Implement AI-powered upscaling and denoising
- [ ] Create an image collage generator from a grid of input photos
- [ ] Add EXIF metadata extraction and GPS coordinate display

## What You Learned
- Loading, inspecting, and saving images with Pillow
- Applying filters, enhancements, and color adjustments
- Resizing images while preserving aspect ratios
- Adding text watermarks with transparency and positioning
- Building batch processing pipelines for directories
- Handling different image modes and formats gracefully
