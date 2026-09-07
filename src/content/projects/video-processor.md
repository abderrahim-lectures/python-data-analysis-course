---
title: "Build a Video Processor"
description: "Process videos with trimming, text overlays, audio extraction, and format conversion using MoviePy and ffmpeg."
difficulty: "advanced"
estimatedMinutes: 75
tags: ["moviepy", "video-processing", "ffmpeg", "subtitles"]
learningObjectives:
  - Trim and cut videos to specific time ranges with frame-level precision
  - Apply text overlays with custom fonts, positions, and timing
  - Extract audio tracks and generate thumbnail images from any frame
  - Convert between video formats and compress for different use cases
prerequisites:
  - "Python basics (functions, strings, f-strings)"
  - "FFmpeg installed on your system (covered in Setup)"
  - "A sample video file to work with (any MP4 will do)"
---

# 🎬 Build a Video Processor

Video editing is traditionally point-and-click, but every operation — trimming, overlaying text, extracting audio, converting formats — is actually a deterministic function applied to frames and time ranges. This project builds a toolkit that wraps MoviePy (which wraps ffmpeg) in clean Python functions, so you can script video processing tasks the same way you'd script any other data transformation: load, operate, save.

This assumes Python basics and a working ffmpeg installation (covered in Setup). It's optional and ungraded; see [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Load a video file and inspect its metadata (duration, resolution, FPS, audio).
2. Trim videos to precise time ranges and extract audio tracks.
3. Generate thumbnail images from any frame in a video.
4. Add text overlays with positioning, timing, and font control.
5. Convert between video formats and compress for web delivery.

## Where to run this

**Locally with `uv`** is the primary and recommended path — MoviePy requires ffmpeg (a system-level binary, not a Python package), and a real file system to read and write video files. No browser-based playground can do this.

**Google Colab** works with a minor setup step — ffmpeg is pre-installed on Colab's runtime, and you can `!pip install moviepy` to get started. You'll need to upload your sample video or download one from a URL. This is a good "try it first" path before committing to a local install.

**JupyterLite does not support MoviePy** — no file system access, no ffmpeg binary, and no `write_videofile` capability. Don't use it for this project.

**Binder** may work if ffmpeg is available in the runtime image, but is slow and unreliable for video I/O. Stick with local or Colab.

## Setup

Everything you need before writing a line of video processing: Python, ffmpeg, and MoviePy.

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

### Install ffmpeg

ffmpeg is a system-level binary that MoviePy uses under the hood — you need it installed separately from any Python package. MoviePy will raise a clear `FileNotFoundError` if it can't find it.

**macOS** (Homebrew):

```bash
brew install ffmpeg
```

**Ubuntu / Debian:**

```bash
sudo apt update && sudo apt install ffmpeg
```

**Windows** (Chocolatey):

```powershell
choco install ffmpeg
```

Confirm it installed:

```bash
ffmpeg -version
```

### Set up the project

```bash
uv init video-processor
cd video-processor
uv add moviepy pillow
```

`moviepy` wraps ffmpeg in a Python-friendly API for loading, editing, and exporting video clips. `pillow` is used by `generate_thumbnail` to save frames as images. Both are pure Python packages with no native dependencies — but they require `ffmpeg` at runtime.

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `ffmpeg -version` prints ffmpeg's version info (not "command not found").
- ✅ `video-processor/` exists with a `pyproject.toml`, and `moviepy` and `pillow` are installed.

## Step 1: Load a video and inspect its metadata

The first step in any video processing task is to know what you're working with: how long is it, what's the resolution, what frame rate, and does it have an audio track? `VideoFileClip` loads the video and exposes all of this as simple attributes.

### 1.1 Write the loader

```python
from moviepy import VideoFileClip, AudioFileClip, TextClip, concatenate_videoclips
from pathlib import Path

def load_video(path: str) -> VideoFileClip:
    """Load a video file and handle common errors."""
    try:
        clip = VideoFileClip(path)
        return clip
    except FileNotFoundError:
        print(f"Error: File '{path}' not found.")
        raise
    except Exception as e:
        print(f"Error loading video: {e}")
        raise

video = load_video("sample.mp4")
print(f"Duration: {video.duration:.1f} seconds")
print(f"Resolution: {video.size[0]}x{video.size[1]}")
print(f"FPS: {video.fps}")
print(f"Has audio: {video.audio is not None}")
```

**👟 Starter hint:** `VideoFileClip(path)` loads the video lazily — the actual frame data is read frame-by-frame as needed, so loading a 10-minute video doesn't consume 10 minutes of RAM. The attributes `.duration`, `.size`, and `.fps` are read from the file's header by ffmpeg. Always check `video.audio is not None` before trying to access audio — some videos are silent.

**🎯 Expected output:** For a typical MP4 file:
```
Duration: 10.0 seconds
Resolution: 1920x1080
FPS: 30.0
Has audio: True
```

**🩹 If it's off:** A `FileNotFoundError` means the path is wrong — use a full path or confirm you're in the right directory. If you get an ffmpeg error, ffmpeg isn't installed or not on your `PATH` — run `ffmpeg -version` to confirm. A corrupted or partially-downloaded video may load metadata but fail during frame access later.

### 1.2 Verify the metadata

**✅ Checklist**

- ✅ `load_video("sample.mp4")` returns a `VideoFileClip` object without errors.
- ✅ `.duration` is a positive number (seconds), `.size` is a `[width, height]` list, `.fps` is a positive number.
- ✅ `.audio` is either an `AudioFileClip` or `None`, and you can handle both cases.

**🤔 Socratic Question(s)**

- A video has `.fps = 29.97` instead of 30. What does the 0.03 difference mean for frame-level operations like trimming at exactly 5.0 seconds — would you get the exact frame you expected?
- `.size` gives you `[width, height]` (x-first), which is the opposite of mathematical `[row, col]` ordering. Why do video tools use this convention, and where might the mismatch cause a bug in your code?

## Step 2: Trim videos and extract audio

Trimming is the most common video editing operation — taking a clip between two timestamps. Extracting audio is equally straightforward: separate the sound track from the video frames and save it as its own file. Both operations produce new files on disk.

### 2.1 Trim and extract audio

```python
def trim_video(video: VideoFileClip, start: float, end: float) -> VideoFileClip:
    """Extract a segment between start and end (in seconds)."""
    if start < 0 or end > video.duration:
        print(f"Warning: clamping to valid range (0–{video.duration:.1f}s)")
        start = max(0, start)
        end = min(video.duration, end)
    return video.subclipped(start, end)

def extract_audio(video: VideoFileClip, output_path: str) -> None:
    """Extract the audio track from a video."""
    if video.audio is None:
        print("No audio track found in this video.")
        return
    video.audio.write_audiofile(output_path)
    print(f"Audio saved to {output_path}")

def generate_thumbnail(video: VideoFileClip, timestamp: float, output_path: str) -> None:
    """Save a single frame as a thumbnail image."""
    frame = video.get_frame(timestamp)
    from PIL import Image
    img = Image.fromarray(frame)
    img.save(output_path, quality=90)
    print(f"Thumbnail at {timestamp}s saved to {output_path}")

clip = trim_video(video, 10, 25)
clip.write_videofile("trimmed.mp4", codec="libx264", audio_codec="aac")

extract_audio(video, "audio_track.wav")

generate_thumbnail(video, 5.0, "thumb.jpg")

video.close()
```

**👟 Starter hint:** `video.subclipped(start, end)` returns a new `VideoFileClip` that contains only the frames between `start` and `end` seconds — it doesn't modify the original clip. `write_videofile` then encodes and saves the trimmed clip to disk: `codec="libx264"` is the standard video codec, and `audio_codec="aac"` is the standard audio codec. `get_frame(timestamp)` returns a single frame as a NumPy array, which PIL can save as a JPEG or PNG. Always `close()` clips when done to free the ffmpeg process handle.

**🎯 Expected output:**
```
trimmed.mp4 — a 15-second video (from 10s to 25s of the original)
audio_track.wav — the full audio track
thumb.jpg — a single frame at the 5-second mark
```

**🩹 If it's off:** If `trimmed.mp4` has no audio, the original video likely has no audio track (`video.audio is None`). If `write_videofile` errors, ffmpeg isn't installed — the codec parameters (`libx264`, `aac`) are ffmpeg-specific. If `thumb.jpg` is mostly black, the frame at that timestamp is a fade-in or title card — try a different timestamp.

### 2.2 Verify trim and extraction

**✅ Checklist**

- ✅ `trimmed.mp4` exists and has a duration equal to `end - start` seconds.
- ✅ `audio_track.wav` is a playable audio file (or `extract_audio` printed "No audio track").
- ✅ `thumb.jpg` is a valid JPEG image of the correct resolution.

**🤔 Socratic Question(s)**

- `trim_video` clamps `start` and `end` to the valid range rather than raising an error. Is that the right choice for a library function, or would raising an error be better? What are the tradeoffs in a script vs. a user-facing tool?
- `video.close()` is called at the end. What happens if you forget to call it — would Python's garbage collector eventually clean up, or does that ffmpeg process stick around? How would you know if you leaked a process?

## Step 3: Add text overlays

Text overlays turn a raw clip into something with context — titles, labels, subtitles, watermarks. MoviePy's `TextClip` creates a text layer, and compositing it onto the video positions it at specific coordinates and times.

### 3.1 Build the overlay function

```python
def add_text_overlay(
    video_path: str,
    text: str,
    start: float,
    end: float,
    font_size: int = 24,
    position: str = "center",
    output_path: str = "overlay.mp4",
) -> None:
    """Add a text overlay to a video segment."""
    video = load_video(video_path)

    positions = {
        "center": ("center", "center"),
        "top": ("center", 40),
        "bottom": ("center", video.h - 60),
        "top-left": (40, 40),
    }

    txt_clip = (
        TextClip(
            text=text,
            font_size=font_size,
            color="white",
            bg_color="black",
            text_align="center",
            size=(video.w * 0.8, None),
            method="caption",
        )
        .with_position(positions.get(position, positions["center"]))
        .with_start(start)
        .with_end(end)
    )

    result = video.with_composite([txt_clip])
    result.write_videofile(output_path, codec="libx264", audio_codec="aac")
    video.close()
    print(f"Saved {output_path}")

add_text_overlay("sample.mp4", "Welcome to My Video", start=0, end=3, output_path="titled.mp4")
```

**👟 Starter hint:** `TextClip` creates a video layer from a string — `method="caption"` wraps the text at `size=(video.w * 0.8, None)` (80% of the video width, auto-height), and `bg_color="black"` draws a dark background behind white text for readability. `.with_start(start).with_end(end)` makes the text appear only during that time window. `video.with_composite([txt_clip])` overlays the text layer onto the video; the original audio track passes through unchanged.

**🎯 Expected output:** `titled.mp4` plays the video with "Welcome to My Video" visible for the first 3 seconds (0–3), then disappears for the remainder.

**🩹 If it's off:** If the text appears but has no background, `bg_color` isn't being applied — check that you're passing it as a `TextClip` keyword argument, not to `.with_position()`. If `write_videofile` fails with a codec error, confirm ffmpeg is installed (`ffmpeg -version`). If the text is cut off or wraps oddly, the `size=(video.w * 0.8, None)` is too narrow — increase the width ratio.

### 3.2 Verify the text overlay

**✅ Checklist**

- ✅ `titled.mp4` exists and has the same duration as `sample.mp4`.
- ✅ The text is visible during the specified time window and absent outside it.
- ✅ The original audio track plays throughout, unaffected by the text overlay.

**🤔 Socratic Question(s)**

- The overlay function hardcodes `"white"` text on `"black"` background. What would you change to support dynamic colors per call — and what color combinations are guaranteed readable against any video background?
- `method="caption"` wraps text automatically. What would `method="label"` do instead — and when would you want unwrapped text in a video overlay?

## Step 4: Convert between formats

Different platforms require different video formats — YouTube accepts MP4, Discord prefers WebM, some older systems need AVI. This step builds a converter that re-encodes a video into a target format, with optional compression for web delivery.

### 4.1 Convert a single file

```python
def convert_video(
    input_path: str,
    output_path: str,
    codec: str = "libx264",
    fps: int = 24,
    bitrate: str = "5000k",
) -> None:
    """Convert a video to a different format or encoding."""
    video = load_video(input_path)
    video.write_videofile(
        output_path,
        codec=codec,
        fps=fps,
        bitrate=bitrate,
        audio_codec="aac",
    )
    video.close()
    print(f"Converted {input_path} → {output_path}")

convert_video("sample.mp4", "sample.webm", codec="libvpx-vp9")
convert_video("sample.mp4", "sample_low.mp4", bitrate="1000k")
```

**👟 Starter hint:** `codec="libvpx-vp9"` produces WebM files (VP9 is Google's video codec for WebM); `bitrate="1000k"` produces a much smaller file than the default `5000k` by reducing quality — this is the tradeoff you control: lower bitrate = smaller file = lower quality. The `fps=24` parameter resamples the video to 24fps if the original is higher, which is a common web optimization.

**🎯 Expected output:**
```
sample.webm — a WebM file (VP9 codec, same duration)
sample_low.mp4 — a compressed MP4 at lower bitrate (smaller file size)
```

**🩹 If it's off:** If `sample.webm` won't play, the decoder isn't available on your system — VLC and most modern browsers handle VP9, but some older players don't. If `sample_low.mp4` is barely smaller than the original, `bitrate="1000k"` isn't low enough for the video's resolution — try `"500k"` or reduce the resolution (MoviePy has a `resize` method).

### 4.2 Batch-convert a directory

```python
def batch_convert(input_dir: str, output_dir: str, target_format: str = "mp4") -> None:
    """Convert all video files in a directory."""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    extensions = {".avi", ".mov", ".webm", ".mkv", ".flv"}
    for filepath in Path(input_dir).iterdir():
        if filepath.suffix.lower() in extensions:
            out = output_path / f"{filepath.stem}.{target_format}"
            try:
                convert_video(str(filepath), str(out))
            except Exception as e:
                print(f"  ✗ {filepath.name}: {e}")

batch_convert("raw_videos", "converted")
```

**👟 Starter hint:** `Path(input_dir).iterdir()` lists every file in the directory; `suffix.lower()` catches `.AVI` and `.avi` as the same extension; the `try/except` inside the loop prevents one failed file from killing the whole batch. This is the "production" version of the one-file converter — bulk operations need error handling per item, not per batch.

**🎯 Expected output:** Every `.avi`, `.mov`, `.webm`, `.mkv`, or `.flv` file in `raw_videos/` produces an `.mp4` equivalent in `converted/`, with any errors printed per file.

**🩹 If it's off:** If the `converted/` directory doesn't exist, the `mkdir(parents=True, exist_ok=True)` creates it — confirm you didn't add a `exist_ok=False` variant. If some files silently fail, the `try/except` is printing the error but you might not see it — redirect stdout to a log file if running in bulk.

### 4.3 Verify the conversion

**✅ Checklist**

- ✅ `convert_video` produces a new file with the correct extension (`.webm`, `.mp4`, etc.).
- ✅ `batch_convert` produces one output file per input file, with errors logged per-file rather than aborting the whole batch.
- ✅ The converted file plays correctly in VLC or a browser — duration and audio match the original.

**🤔 Socratic Question(s)**

- `convert_video` accepts a `codec` and `bitrate` as separate parameters, but setting both a high bitrate with a low-quality codec (like `mpeg4`) might not improve quality. How would you document which codec/bitrate combinations are sensible?
- `batch_convert` silently skips files that aren't in the extension set. What if you wanted to also process `.mp4` files (re-encoding for quality)? How would you avoid re-converting files that are already in the target format?

## ⚠️ Common pitfalls

- **ffmpeg not installed or not on `PATH`.** MoviePy's errors don't always say "ffmpeg missing" — you might see a cryptic `OSError` or `FileNotFoundError` on a path you didn't write. Always run `ffmpeg -version` as the first diagnostic step. MoviePy 2.x bundles its own ffmpeg in some installations, but the system install is more reliable.
- **Forgetting `video.close()`.** Every `VideoFileClip` opens an ffmpeg subprocess. Without `close()`, those processes accumulate — you'll see zombie `ffmpeg` processes in your system monitor, and your script will hold file locks that prevent re-encoding the same file. Use a `try/finally` block or context managers if processing many files.
- **Text overlay resolution mismatch.** `TextClip` renders text at a fixed pixel size; if the video is 4K (3840×2160) and `font_size=24`, the text will be tiny relative to the frame. Scale `font_size` with `video.w / 1920` to keep text proportional across resolutions.
- **`write_videofile` blocks the script.** Encoding is CPU-intensive and synchronous — a 10-minute video can take minutes to encode. In a Jupyter notebook, this freezes the kernel until it's done. In a real pipeline, you'd run encoding in a subprocess or background thread.
- **WebM codec not available on all players.** VP9 (`libvpx-vp9`) is widely supported in browsers but not in all media players. If your target is a media player (not a browser), stick with `libx264` (MP4) — it's the most universally compatible codec.

## What you just built

A video processing toolkit that wraps MoviePy's ffmpeg-backed API in clean, reusable Python functions: trimming, audio extraction, thumbnail generation, text overlays, and format conversion. Every function handles its own error cases and documents its parameters, so you can compose them into larger pipelines. You also learned the key MoviePy idiom: load a clip, apply operations that return new clips, and write the result to disk.

:::tip[Run a fuller version without any local setup]
[`examples/video-processor/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/video-processor) in the course repo is a fuller version with a highlight reel function (extracts multiple segments and crossfades between them), an animated watermark, and a CLI interface for batch processing. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) and run it from there.
:::

## Where to go from here

- Build a highlight reel: given a list of `(start, end)` timestamps from a long video, extract each segment, add a 0.5s crossfade between them, and concatenate into a single highlight reel using `concatenate_videoclips(method="compose")`.
- Add an animated watermark: create a watermark that slowly pans from left to right across the video using a `make_frame` function with time-dependent x-offset calculations.
- Build a video compressor: calculate the current bitrate from file size and duration, compute the target bitrate for a desired file size, and re-encode — report the compression ratio.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓
