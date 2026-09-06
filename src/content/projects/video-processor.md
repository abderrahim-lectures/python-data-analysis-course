---
title: "Video Processor"
description: "Process videos with trimming, effects, subtitle embedding, and format conversion."
difficulty: "advanced"
estimatedMinutes: 75
tags: ["moviepy", "video-processing", "ffmpeg", "subtitles"]
learningObjectives:
  - "Trim and cut videos to specific time ranges"
  - "Apply visual effects and filters to video clips"
  - "Overlay subtitles and text on video frames"
  - "Convert between video formats and extract audio"
prerequisites: ["Python basics", "File I/O", "FFmpeg installed"]
---

# Video Processor

## What You'll Learn
- Use MoviePy to load, edit, and export video files
- Trim videos to precise time ranges
- Apply text overlays and visual effects
- Extract and replace audio tracks
- Convert between MP4, WebM, and other formats

## What You'll Build
A video processing toolkit that can:
- Cut videos to specific time ranges with frame-level precision
- Add text overlays with custom fonts, positions, and animations
- Extract audio tracks from video files
- Convert between MP4, WebM, AVI, and other formats
- Generate thumbnail images from any frame in a video

## Where to Run It
This project works best **locally with `uv`** since MoviePy requires ffmpeg. It also works in **Google Colab** with pre-installed dependencies. JupyterLite does not support MoviePy.

## Setup

```bash
# Create the project
uv init video-processor && cd video-processor

# Add dependencies
uv add moviepy

# Ensure ffmpeg is installed:
# macOS: brew install ffmpeg
# Ubuntu: sudo apt install ffmpeg
# Windows: choco install ffmpeg

uv run python main.py
```

## Step 1 — Load and Inspect Video

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

# Load and inspect
video = load_video("sample.mp4")
print(f"Duration: {video.duration:.1f} seconds")
print(f"Resolution: {video.size[0]}x{video.size[1]}")
print(f"FPS: {video.fps}")
print(f"Has audio: {video.audio is not None}")

# Always close clips when done to free resources
# video.close()  # call when finished
```

## Step 2 — Trim, Extract Audio, and Generate Thumbnails

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

# Trim a 15-second clip
clip = trim_video(video, 10, 25)
clip.write_videofile("trimmed.mp4", codec="libx264", audio_codec="aac")

# Extract audio
extract_audio(video, "audio_track.wav")

# Generate a thumbnail at the 5-second mark
generate_thumbnail(video, 5.0, "thumb.jpg")

video.close()
```

## Step 3 — Add Text Overlays

```python
def add_text_overlay(video_path: str, text: str, start: float, end: float,
                     font_size: int = 24, position: str = "center",
                     output_path: str = "overlay.mp4") -> None:
    """Add a text overlay to a video segment."""
    video = load_video(video_path)

    positions = {
        "center": ("center", "center"),
        "top": ("center", 40),
        "bottom": ("center", video.h - 60),
        "top-left": (40, 40),
    }

    txt_clip = (TextClip(
        text=text,
        font_size=font_size,
        color="white",
        bg_color="black",
        text_align="center",
        size=(video.w * 0.8, None),
        method="caption",
    ).with_position(positions.get(position, positions["center"]))
      .with_start(start)
      .with_end(end))

    result = video.with_composite([txt_clip])
    result.write_videofile(output_path, codec="libx264", audio_codec="aac")
    video.close()
    print(f"Saved {output_path}")

# Add a title card for the first 3 seconds
add_text_overlay("sample.mp4", "Welcome to My Video", start=0, end=3, output_path="titled.mp4")
```

## Step 4 — Convert Formats

```python
def convert_video(input_path: str, output_path: str, codec: str = "libx264",
                  fps: int = 24, bitrate: str = "5000k") -> None:
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

# Convert to WebM
convert_video("sample.mp4", "sample.webm", codec="libvpx-vp9")

# Create a smaller compressed version
convert_video("sample.mp4", "sample_low.mp4", bitrate="1000k")

# Batch convert all videos in a directory
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

## 🧩 Challenges

<details>
<summary><strong>Challenge 1: Build a video compressor</strong></summary>

Write a function that compresses a video to a target file size. Calculate the current bitrate, determine the target bitrate from the desired file size and duration, then re-encode. Report the compression ratio.
</details>

<details>
<summary><strong>Challenge 2: Create a highlight reel</strong></summary>

Given a list of `(start, end)` timestamps from a long video, extract each segment, add a 0.5s crossfade between them, and concatenate into a single highlight reel. Use `concatenate_videoclips(method="compose")` with crossfade.
</details>

<details>
<summary><strong>Challenge 3: Add animated watermark</strong></summary>

Create a watermark that slowly pans from left to right across the video. Use a `make_frame` function with time-dependent x-offset calculations to position the watermark clip.
</details>

## Stretch Goals
- [ ] Add audio extraction and replacement capabilities
- [ ] Build a thumbnail generation system from video frames
- [ ] Implement scene detection for automatic chapter markers
- [ ] Create a picture-in-picture overlay system for reaction videos
- [ ] Build a video GIF converter with frame sampling options

## What You Learned
- Loading and inspecting video metadata with MoviePy
- Trimming videos with precise start and end timestamps
- Extracting audio tracks and generating thumbnail frames
- Adding text overlays with positioning and timing control
- Converting between video formats and compressing for web
- Working with ffmpeg-backed video processing pipelines
