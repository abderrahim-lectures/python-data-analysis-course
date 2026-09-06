---
title: "Audio Editor"
description: "Edit audio files with trimming, noise removal, format conversion, and waveform visualization."
difficulty: "intermediate"
estimatedMinutes: 50
tags: ["pydub", "audio-processing", "matplotlib", "waveform"]
learningObjectives:
  - "Trim and splice audio files with millisecond precision"
  - "Apply noise reduction and audio enhancements"
  - "Convert between common audio formats"
  - "Generate waveform visualizations for audio analysis"
prerequisites: ["Python basics", "File I/O"]
---

# Audio Editor

## What You'll Learn
- Use pydub to load, edit, and export audio files
- Trim and splice audio with precise timestamps
- Apply volume adjustments and fade effects
- Convert between MP3, WAV, FLAC, and OGG formats
- Visualize audio waveforms using matplotlib

## What You'll Build
An audio editing toolkit that can:
- Extract specific segments from audio files with millisecond precision
- Normalize volume levels and apply fade-in/fade-out effects
- Convert between popular audio formats
- Generate waveform visualizations for audio analysis
- Combine multiple audio clips into a single track

## Where to Run It
This project works best **locally with `uv`** since pydub requires ffmpeg for format conversion. Basic WAV operations work in **Google Colab**. JupyterLite has limited support but can handle simple edits.

## Setup

```bash
# Create the project
uv init audio-editor && cd audio-editor

# Add dependencies
uv add pydub matplotlib

# pydub needs ffmpeg for format conversion — install it
uv add ffmpeg-python

# Or install ffmpeg directly on your system:
# macOS: brew install ffmpeg
# Ubuntu: sudo apt install ffmpeg
# Windows: choco install ffmpeg

uv run python main.py
```

## Step 1 — Load and Inspect Audio

```python
from pydub import AudioSegment
from pathlib import Path

def load_audio(path: str) -> AudioSegment:
    """Load an audio file, detecting format from extension."""
    try:
        return AudioSegment.from_file(path)
    except FileNotFoundError:
        print(f"Error: File '{path}' not found.")
        raise
    except Exception as e:
        print(f"Error loading audio: {e}")
        raise

# Load a sample
audio = load_audio("song.mp3")

# Inspect
print(f"Duration: {len(audio) / 1000:.1f} seconds")
print(f"Channels: {audio.channels}")
print(f"Sample rate: {audio.frame_rate} Hz")
print(f"Sample width: {audio.sample_width} bytes")
print(f"Bitrate: {audio.bitrate} bps")
```

## Step 2 — Trim, Fade, and Normalize

```python
def trim_audio(audio: AudioSegment, start_ms: int, end_ms: int) -> AudioSegment:
    """Extract a segment between start_ms and end_ms."""
    if start_ms < 0 or end_ms > len(audio):
        print(f"Warning: trimming to valid range (0–{len(audio)}ms)")
        start_ms = max(0, start_ms)
        end_ms = min(len(audio), end_ms)
    return audio[start_ms:end_ms]

def apply_fades(audio: AudioSegment, fade_in_ms: int = 1000, fade_out_ms: int = 1000) -> AudioSegment:
    """Apply fade-in and fade-out effects."""
    return audio.fade_in(fade_in_ms).fade_out(fade_out_ms)

def normalize_volume(audio: AudioSegment, target_db: float = -20.0) -> AudioSegment:
    """Normalize audio to a target decibel level."""
    change = target_db - audio.dBFS
    return audio.apply_gain(change)

# Trim a 30-second clip from 0:45 to 1:15
clip = trim_audio(audio, 45_000, 75_000)

# Apply fades and normalize
clip = apply_fades(clip, fade_in_ms=500, fade_out_ms=1000)
clip = normalize_volume(clip, target_db=-18.0)

clip.export("clip.wav", format="wav")
print(f"Exported clip.wav ({len(clip) / 1000:.1f}s)")
```

## Step 3 — Convert Formats and Combine Clips

```python
def convert_format(input_path: str, output_path: str, fmt: str = "wav") -> None:
    """Convert audio to a different format."""
    audio = load_audio(input_path)
    audio.export(output_path, format=fmt)
    print(f"Converted {input_path} → {output_path}")

def combine_clips(clips: list[AudioSegment], gap_ms: int = 0) -> AudioSegment:
    """Concatenate multiple clips with an optional gap between them."""
    if not clips:
        print("No clips to combine.")
        return AudioSegment.empty()

    silence = AudioSegment.silent(duration=gap_ms)
    combined = clips[0]
    for clip in clips[1:]:
        combined += silence + clip
    return combined

# Convert formats
convert_format("recording.wav", "recording.mp3", fmt="mp3")
convert_format("recording.wav", "recording.ogg", fmt="ogg")

# Combine multiple clips
clip_a = trim_audio(audio, 0, 10_000)
clip_b = trim_audio(audio, 30_000, 40_000)
clip_c = trim_audio(audio, 60_000, 70_000)

montage = combine_clips([clip_a, clip_b, clip_c], gap_ms=500)
montage.export("montage.wav", format="wav")
print(f"Montage: {len(montage) / 1000:.1f}s")
```

## Step 4 — Generate a Waveform Visualization

```python
import matplotlib.pyplot as plt
import numpy as np

def plot_waveform(audio: AudioSegment, title: str = "Waveform") -> None:
    """Plot the audio waveform using matplotlib."""
    # Convert to numpy array
    samples = np.array(audio.get_array_of_samples())

    # Stereo: take one channel
    if audio.channels == 2:
        samples = samples[::2]

    time_axis = np.linspace(0, len(audio) / 1000, num=len(samples))

    plt.figure(figsize=(12, 4))
    plt.plot(time_axis, samples, linewidth=0.5, color="#2563eb")
    plt.title(title)
    plt.xlabel("Time (seconds)")
    plt.ylabel("Amplitude")
    plt.fill_between(time_axis, samples, alpha=0.3, color="#2563eb")
    plt.tight_layout()
    plt.savefig("waveform.png", dpi=150)
    plt.show()
    print("Saved waveform.png")

plot_waveform(clip, "Trimmed Clip Waveform")
```

## 🧩 Challenges

<details>
<summary><strong>Challenge 1: Build a silence detector</strong></summary>

Write a function that finds all silent segments in an audio file (below a dBFS threshold). Return a list of `(start_ms, end_ms)` tuples and print the total silence duration.
</details>

<details>
<summary><strong>Challenge 2: Create a podcast episode combiner</strong></summary>

Given an intro clip, several episode segments, and an outro clip, build a pipeline that combines them with crossfade transitions between each segment. Use `audio.crossfade(duration)` for smooth transitions.
</details>

<details>
<summary><strong>Challenge 3: Add audio speed control</strong></summary>

Write a function that speeds up or slows down audio while preserving pitch. Use pydub's `audio._spawn(data, overrides={'frame_rate': new_rate})` followed by `set_frame_rate(original_rate)`.
</details>

## Stretch Goals
- [ ] Add audio normalization and loudness standards compliance
- [ ] Build a music mixing tool with track layering
- [ ] Implement speech-to-text transcription integration
- [ ] Create a volume envelope editor with custom gain curves
- [ ] Build a podcast RSS feed generator from processed episodes

## What You Learned
- Loading and inspecting audio metadata with pydub
- Trimming audio with millisecond precision
- Applying fade-in, fade-out, and volume normalization
- Converting between MP3, WAV, and OGG formats
- Combining multiple clips into a single track
- Generating waveform visualizations with matplotlib
