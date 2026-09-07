---
title: "Build an Image Caption Generator"
description: "Generate natural language descriptions for images using a vision-language model through a simple Python CLI."
difficulty: "intermediate"
estimatedMinutes: 45
tags: ["ai", "computer-vision", "cli"]
learningObjectives:
  - "Load and preprocess images for vision-language model input"
  - "Send images to a free-tier vision API and parse caption responses"
  - "Process batches of images with progress tracking"
  - "Embed generated captions into image EXIF metadata"
prerequisites: ["Python 101"]
---

# 🖼️ Build an Image Caption Generator

Every photo on the web needs a text description — for accessibility, for search engines, for people who can't load the image. Writing captions by hand is slow; a vision-language model can generate them in seconds. This project builds a CLI tool that takes an image (from a file path or URL) and produces a human-readable caption using a free-tier vision API. You'll handle image preprocessing, API calls, batch processing with progress tracking, and even write captions back into image metadata.

This assumes Python 101 — nothing from Data Analysis is required. Optional and ungraded; see [Real-World Projects](/docs/projects) for the full list.

## 🎯 What you'll do

1. Set up a project with `uv` and install the dependencies you'll need.
2. Load and resize images for API consumption using Pillow.
3. Send an image to a free-tier vision-language model and parse the caption.
4. Build a batch processor that handles directories of images with progress tracking.
5. Embed generated captions into image EXIF metadata for portable storage.
6. Wire everything into a CLI that captions single images or entire folders.

## Where to run this

**Locally with `uv`** is the primary path — this tool reads image files from disk and writes modified images with embedded metadata.

**Google Colab, Kaggle Notebooks, and Binder** work for trying the tool. The notebook uses the same code and includes sample images for testing. You'll need a free-tier API key (GitHub Models, Gemini, or Groq) set as an environment variable.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/image-caption-generator/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/image-caption-generator/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fimage-caption-generator%2Fnotebook.ipynb)

## Setup

Everything you need before captioning: a Python environment, an image library, an HTTP client, and a free API key.

### Install `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Close and reopen your terminal, then confirm:

```bash
uv --version
```

### Scaffold the project

```bash
uv init image-caption-generator
cd image-caption-generator
uv add Pillow requests click python-dotenv
```

`Pillow` handles image loading, resizing, and EXIF metadata. `requests` sends images to the vision API. `click` builds the CLI, and `python-dotenv` loads your API key from a `.env` file.

### Get a free vision API key

You need a provider that supports image inputs. GitHub Models and Gemini both work:

| Provider | Where to get a key | Vision model |
|---|---|---|
| **GitHub Models** *(suggested)* | [github.com/settings/tokens](https://github.com/settings/tokens) with `models: read` scope | `gpt-4o-mini` |
| Gemini | [Google AI Studio](https://aistudio.google.com/) | `gemini-1.5-flash` |

```bash
# .env
GITHUB_TOKEN=your-key-here
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `image-caption-generator/` exists with a `pyproject.toml`, and `Pillow`, `requests`, `click`, and `python-dotenv` are installed.
- ✅ You have a `.env` file with a valid API key — not pasted into any script.

## Step 1: Load and preprocess images

Vision APIs have size limits — sending a 20 MB raw photo wastes bandwidth and may be rejected. Preprocessing loads the image, resizes it to a reasonable dimension, and converts it to a format the API accepts (base64-encoded JPEG or PNG).

### 1.1 Load and resize an image

**👟 Starter hint:** Create `caption/preprocess.py` with a function that loads an image and resizes it to fit within 1024×1024 pixels.

```python
# caption/preprocess.py
from PIL import Image
import base64
from io import BytesIO
from pathlib import Path

MAX_DIMENSION = 1024

def load_and_resize(image_path: str) -> Image.Image:
    """Load an image and resize it to fit within MAX_DIMENSION."""
    img = Image.open(image_path)
    img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)
    return img

def image_to_base64(img: Image.Image, format: str = "JPEG") -> str:
    """Convert a PIL Image to a base64-encoded string."""
    buffer = BytesIO()
    img.convert("RGB").save(buffer, format=format)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")
```

The `thumbnail` method resizes the image while preserving its aspect ratio — a 4000×3000 photo becomes 1024×768, not a distorted 1024×1024. The `convert("RGB")` call ensures the image is in a format JPEG can encode, even if the original was RGBA (transparent PNG) or grayscale. The base64 string is what the API expects in the request body.

**🎯 Expected output:** `load_and_resize("photo.jpg")` returns a PIL Image with both dimensions ≤ 1024. `image_to_base64(img)` returns a long string of characters (A-Z, a-z, 0-9, +, /).

**🩹 If it's off:** If `thumbnail` doesn't resize, the image is already smaller than the max — that's correct behavior, not a bug. If `base64` encoding fails, the image format may not be supported by PIL.

### 1.2 Verify preprocessing

```python
from caption.preprocess import load_and_resize, image_to_base64
from PIL import Image

# Create a test image
img = Image.new("RGB", (2000, 1500), color="red")
img.save("/tmp/test_large.jpg")

# Resize
small = load_and_resize("/tmp/test_large.jpg")
assert small.width <= 1024
assert small.height <= 1024

# Encode
b64 = image_to_base64(small)
assert len(b64) > 100  # base64 string is non-trivial
```

**🎯 Expected output:** All assertions pass; the resized image fits within 1024×1024 and the base64 string is non-empty.

**🩹 If it's off:** If the width or height is still above 1024, `thumbnail` isn't being called — check that the method is chained on the `img` object.

### 1.3 Verify image preprocessing

**✅ Checklist**

- ✅ `load_and_resize` returns an image with both dimensions ≤ 1024.
- ✅ Aspect ratio is preserved (not stretched or squashed).
- ✅ `image_to_base64` returns a valid base64 string.

**🤔 Socratic Question(s)**

- Why resize to 1024×1024 instead of sending the full-resolution image? What's the cost of sending a 20 MB photo to a vision API versus a 200 KB resized version?
- If the input image is a screenshot (1920×1080), the thumbnail is 1024×576. What would change if you needed square crops for a social media app?

## Step 2: Send an image to a vision API and parse the caption

The vision API takes an image and a text prompt, and returns a description. You'll use the OpenAI-compatible endpoint (which works for GitHub Models, Gemini, and others) to send the image as a base64 data URL.

### 2.1 Write the API caller

**👟 Starter hint:** Create `caption/api.py` with a function that sends an image to the vision model and returns the caption.

```python
# caption/api.py
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

def get_client() -> OpenAI:
    """Create an OpenAI-compatible client for GitHub Models."""
    return OpenAI(
        api_key=os.environ.get("GITHUB_TOKEN", ""),
        base_url="https://models.github.ai/inference",
    )

def caption_image(client: OpenAI, image_b64: str, prompt: str = "Describe this image in one detailed sentence.") -> str:
    """Send a base64 image to the vision model and return the caption."""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}},
            ],
        }],
        max_tokens=200,
    )
    return response.choices[0].message.content.strip()
```

The `data:image/jpeg;base64,{image_b64}` format is how vision APIs accept inline images — the model receives the raw pixel data encoded as text, not a URL it needs to fetch. The `max_tokens=200` keeps captions concise. The prompt is configurable so you can ask for different caption styles ("one sentence," "detailed paragraph," "alt text for screen readers").

**🎯 Expected output:** `caption_image(client, base64_string)` returns a string like "A red bicycle parked against a brick wall on a sunny afternoon."

**🩹 If it's off:** If the API returns an error, check that the `GITHUB_TOKEN` environment variable is set. If the response is empty, the model may not support vision — try a different model name.

### 2.2 Handle errors gracefully

```python
# caption/api.py (continued)
def safe_caption(client: OpenAI, image_b64: str, prompt: str = "Describe this image.") -> str:
    """Caption an image with error handling."""
    try:
        return caption_image(client, image_b64, prompt)
    except Exception as e:
        return f"[Error: {e}]"
```

**🎯 Expected output:** If the API call succeeds, returns the caption. If it fails (network error, invalid key, rate limit), returns an error string instead of crashing.

**🩹 If it's off:** If errors aren't caught, the `try/except` block is missing or the exception type isn't broad enough.

### 2.3 Verify the API caller

**✅ Checklist**

- ✅ `caption_image` returns a string (the caption) for a valid image.
- ✅ `safe_caption` returns an error message instead of crashing on failure.
- ✅ The client can be created from a `.env` file without hardcoding the key.

**🤔 Socratic Question(s)**

- The caption is a string. If you wanted structured output (objects, colors, scene type), how would you change the prompt to get parseable JSON back from the model?
- If you send the same image twice with different prompts, you get different captions. How would you benchmark which prompt produces the most useful captions for your use case?

## Step 3: Build a batch processor with progress tracking

Captioning one image is straightforward; captioning a directory of 500 images needs progress tracking, error handling per image, and a summary of what worked.

### 3.1 Write the batch processor

**👟 Starter hint:** Create `caption/batch.py` with a function that processes a directory of images.

```python
# caption/batch.py
from pathlib import Path
from caption.preprocess import load_and_resize, image_to_base64
from caption.api import get_client, safe_caption

def caption_directory(
    directory: str,
    extensions: tuple[str, ...] = (".jpg", ".jpeg", ".png", ".webp"),
) -> list[dict]:
    """Caption all images in a directory. Returns a list of {path, caption, error} dicts."""
    client = get_client()
    results = []
    image_files = sorted(
        p for p in Path(directory).iterdir()
        if p.suffix.lower() in extensions
    )
    total = len(image_files)
    for i, path in enumerate(image_files, 1):
        print(f"[{i}/{total}] {path.name}...", end=" ", flush=True)
        try:
            img = load_and_resize(str(path))
            b64 = image_to_base64(img)
            caption = safe_caption(client, b64)
            results.append({"path": str(path), "caption": caption, "error": None})
            print("OK")
        except Exception as e:
            results.append({"path": str(path), "caption": None, "error": str(e)})
            print(f"FAIL: {e}")
    print(f"\nDone: {total - len([r for r in results if r['error']])}/{total} succeeded")
    return results
```

The function walks the directory, filters by image extension, and processes each file with a progress counter. The `end=" "` and `flush=True` on the print keep the progress on one line. Each result is a dictionary with the path, caption, and error (if any) — this makes it easy to filter successes from failures afterward.

**🎯 Expected output:** For a directory with 5 images, the output shows `[1/5] photo1.jpg... OK` through `[5/5] photo5.jpg... OK`, ending with "Done: 5/5 succeeded".

**🩹 If it's off:** If no files are found, check that the path is correct and files have image extensions. If all files fail with the same error, the API key is likely invalid.

### 3.2 Add rate limiting

```python
# caption/batch.py (continued)
import time

def caption_directory_with_delay(
    directory: str,
    delay_seconds: float = 1.0,
    **kwargs,
) -> list[dict]:
    """Caption with a delay between API calls to respect rate limits."""
    client = get_client()
    results = []
    image_files = sorted(
        p for p in Path(directory).iterdir()
        if p.suffix.lower() in kwargs.get("extensions", (".jpg", ".jpeg", ".png", ".webp"))
    )
    total = len(image_files)
    for i, path in enumerate(image_files, 1):
        print(f"[{i}/{total}] {path.name}...", end=" ", flush=True)
        try:
            img = load_and_resize(str(path))
            b64 = image_to_base64(img)
            caption = safe_caption(client, b64)
            results.append({"path": str(path), "caption": caption, "error": None})
            print("OK")
        except Exception as e:
            results.append({"path": str(path), "caption": None, "error": str(e)})
            print(f"FAIL: {e}")
        if i < total:
            time.sleep(delay_seconds)
    return results
```

Free-tier API providers often have rate limits (requests per minute). The `time.sleep(delay_seconds)` call between requests prevents you from hitting those limits and getting throttled. One second between requests is conservative enough for most providers.

**🎯 Expected output:** The batch processor pauses briefly between each image, and all requests succeed without 429 (rate limit) errors.

**🩹 If it's off:** If you still hit rate limits, increase the delay. If the batch is too slow, decrease it — but monitor for errors.

### 3.3 Verify batch processing

**✅ Checklist**

- ✅ `caption_directory` processes all image files in a directory.
- ✅ Progress is printed as `[i/total] filename... OK/FAIL`.
- ✅ Results include both successful captions and error messages.

**🤔 Socratic Question(s)**

- If a batch of 1000 images is interrupted halfway (network error, Ctrl+C), how would you resume from where it left off instead of re-captioning the first 500?
- The batch processor prints progress to stdout. For a real tool, how would you add a progress bar (like `tqdm`) that shows ETA and throughput?

## Step 4: Embed captions into image EXIF metadata

Storing captions as separate text files is fragile — the caption gets separated from the image. EXIF metadata is embedded in the image file itself, so the caption travels with the image wherever it goes.

### 4.1 Write EXIF metadata

**👟 Starter hint:** Create `caption/metadata.py` with a function that writes a caption into an image's EXIF UserComment field.

```python
# caption/metadata.py
from PIL import Image
from PIL.ExifTags import Base as ExifBase
import piexif

def write_caption_to_exif(image_path: str, caption: str, output_path: str | None = None):
    """Write a caption into an image's EXIF UserComment field."""
    output = output_path or image_path
    img = Image.open(image_path)

    # Build EXIF data
    exif_dict = {"0th": {}, "Exif": {}, "GPS": {}, "1st": {}}

    # UserComment tag (0x9286)
    exif_dict["Exif"][piexif.ExifIFD.UserComment] = caption.encode("utf-8")

    # Write back
    exif_bytes = piexif.dump(exif_dict)
    img.save(output, exif=exif_bytes, quality=95)
    print(f"Caption written to {output}")
```

The EXIF `UserComment` tag (0x9286) is the standard field for arbitrary text metadata in images. Using `piexif` gives you direct access to the raw EXIF structure instead of relying on Pillow's limited EXIF support. The `output_path` parameter lets you write to a new file instead of modifying the original.

**🎯 Expected output:** `write_caption_to_exif("photo.jpg", "A sunset over the ocean")` saves the image with the caption embedded in its EXIF data.

**🩹 If it's off:** If `piexif` isn't installed, add it: `uv add piexif`. If the EXIF data is lost after saving, the quality parameter may be causing re-encoding — try `quality=100`.

### 4.2 Read EXIF captions

```python
# caption/metadata.py (continued)
def read_caption_from_exif(image_path: str) -> str | None:
    """Read the caption from an image's EXIF UserComment field."""
    try:
        img = Image.open(image_path)
        exif = img.getexif()
        if piexif.ExifIFD.UserComment in exif:
            return exif[piexif.ExifIFD.UserComment].decode("utf-8")
    except Exception:
        pass
    return None
```

**🎯 Expected output:** Reading the caption back returns the exact string that was written.

**🩹 If it's off:** If the read returns `None` after writing, the EXIF tag number may not match — check `piexif.ExifIFD.UserComment`.

### 4.3 Verify EXIF embedding

**✅ Checklist**

- ✅ `write_caption_to_exif` embeds the caption in the image file.
- ✅ `read_caption_from_exif` returns the exact caption string.
- ✅ The modified image is visually identical to the original.

**🤔 Socratic Question(s)**

- EXIF metadata is stripped by most social media platforms and messaging apps. If you needed captions to survive upload, where else would you store them?
- If you wanted to embed captions in multiple languages, how would you store them in EXIF without overwriting the previous language?

## Step 5: Build the CLI

Wire everything together with commands for single-image captioning, batch processing, and metadata operations.

### 5.1 Build the CLI

**👟 Starter hint:** Create `caption/cli.py` with `caption`, `batch`, and `embed` subcommands.

```python
# caption/cli.py
import json
import click
from caption.preprocess import load_and_resize, image_to_base64
from caption.api import get_client, safe_caption
from caption.batch import caption_directory
from caption.metadata import write_caption_to_exif

@click.group()
def cli():
    """Image Caption Generator — caption images with AI vision models."""
    pass

@cli.command()
@click.argument("image_path", type=click.Path(exists=True))
@click.option("--prompt", default="Describe this image in one detailed sentence.")
def caption(image_path, prompt):
    """Generate a caption for a single image."""
    client = get_client()
    img = load_and_resize(image_path)
    b64 = image_to_base64(img)
    result = safe_caption(client, b64, prompt)
    click.echo(f"Caption: {result}")

@cli.command()
@click.argument("directory", type=click.Path(exists=True))
@click.option("--output", "-o", default="captions.json", help="Output JSON file")
def batch(directory, output):
    """Caption all images in a directory."""
    results = caption_directory(directory)
    with open(output, "w") as f:
        json.dump(results, f, indent=2)
    click.echo(f"Results saved to {output}")

@cli.command()
@click.argument("image_path", type=click.Path(exists=True))
@click.option("--caption-text", "-c", required=True, help="Caption to embed")
def embed(image_path, caption_text):
    """Embed a caption into an image's EXIF metadata."""
    write_caption_to_exif(image_path, caption_text)
    click.echo("Caption embedded successfully")

if __name__ == "__main__":
    cli()
```

The three commands map to the three main use cases: caption one image (quick test), caption a directory (batch work), and embed a caption (metadata management). Each command delegates to the library code and prints a human-readable result.

**🎯 Expected output:** `uv run python -m caption.cli caption photo.jpg` prints "Caption: A red bicycle parked against a wall."

**🩹 If it's off:** If `get_client()` fails, check your `.env` file. If the image path isn't found, run the command from the directory containing the image.

### 5.2 End-to-end smoke test

```python
from caption.preprocess import load_and_resize, image_to_base64
from caption.metadata import write_caption_to_exif, read_caption_from_exif
from PIL import Image

# Create a test image
img = Image.new("RGB", (800, 600), color="blue")
img.save("/tmp/test_caption.jpg")

# Preprocess
small = load_and_resize("/tmp/test_caption.jpg")
b64 = image_to_base64(small)
assert len(b64) > 100

# Metadata round-trip
write_caption_to_exif("/tmp/test_caption.jpg", "A blue rectangle")
capt = read_caption_from_exif("/tmp/test_caption.jpg")
assert capt == "A blue rectangle"
```

This tests the full pipeline: create, preprocess, encode, embed, read back. Each piece was tested individually; this confirms the handoff between them is clean.

**🎯 Expected output:** All assertions pass; the caption round-trips through EXIF metadata.

**🩹 If it's off:** If the EXIF read fails, check that `piexif` is installed and the file wasn't corrupted by the write.

### 5.3 Verify the CLI pipeline

**✅ Checklist**

- ✅ `caption` generates a text description for a single image.
- ✅ `batch` processes all images in a directory and saves results to JSON.
- ✅ `embed` writes a caption into EXIF metadata that can be read back.

**🤔 Socratic Question(s)**

- If you wanted to caption images from URLs instead of local files, what would change about the preprocessing step?
- How would you add a `--compare` command that captions the same image with two different prompts and shows the differences side by side?

## ⚠️ Common pitfalls

- **Sending full-resolution images to the API.** A 20 MB photo wastes bandwidth, costs more tokens, and may exceed the API's size limit. Always resize to ≤ 1024 pixels on the longest side before sending.
- **Forgetting that EXIF data is stripped on upload.** Most social media platforms and messaging apps remove EXIF metadata. If your captions need to survive upload, store them in a sidecar file or database as well.
- **Not handling API rate limits in batch mode.** Free-tier providers limit requests per minute. Without a delay between requests in batch processing, you'll hit 429 errors after a few images.
- **Sending RGBA images to JPEG encoding.** JPEG doesn't support transparency. The `convert("RGB")` call in `image_to_base64` handles this, but forgetting it causes a `cannot write mode RGBA as JPEG` error.
- **Trusting the first caption as ground truth.** Vision models sometimes hallucinate objects that aren't in the image or miss obvious details. For production use, you'd add a verification step or human review.

## What you just built

An image caption generator that takes any image and produces a human-readable description using a free-tier vision model. The pipeline — preprocess, encode, caption, embed metadata — handles the full lifecycle of AI-generated alt text. The batch processor turns a folder of hundreds of images into a JSON file of captions in minutes, and the EXIF embedding ensures captions stay attached to their images.

:::tip[Run a fuller version without any local setup]
[`examples/image-caption-generator/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/image-caption-generator) in the course repo has a richer version with multiple provider support, sample images, and the CLI wired up end to end. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Add a `--compare` mode that sends the same image to two different models and shows the captions side by side for quality comparison.
- Build a web interface with Gradio or Streamlit that lets you drag-and-drop images and see captions instantly.
- Implement caption quality scoring: use a second model to rate the caption's accuracy, detail, and grammar on a 1–5 scale.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓
