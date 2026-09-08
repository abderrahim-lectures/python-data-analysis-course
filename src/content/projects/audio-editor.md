---
title: "Build an Audio Editor"
description: "Build a command-line audio editor in Python: synthesize a test tone, trim and fade clips with millisecond precision, convert formats, splice montages, and render waveforms."
difficulty: "intermediate"
estimatedMinutes: 50
tags: ["pydub", "audio-processing", "matplotlib", "waveform", "numpy"]
learningObjectives:
  - "Synthesize a clean test tone from raw sample math"
  - "Trim and splice audio files with millisecond precision"
  - "Apply fades, volume normalization, and format conversion"
  - "Combine multiple clips into a single track"
  - "Generate waveform visualizations for audio analysis"
prerequisites: ["Python basics", "File I/O"]
---

# 🛠️ 🎧 Build an Audio Editor

Every podcast episode, ringtone, and video game sound effect went through the same pipeline: someone trimmed the good parts, faded the edges so nothing clicks, adjusted the loudness, and stitched pieces together. Professional studios do this in heavyweight apps; this project builds a small command-line audio editor in Python that does all of it on real audio files with `pydub` — millisecond-precise trimming, fades, volume normalization, format conversion, clip splicing, and a waveform picture so you can *see* exactly what you changed.

This assumes Python 101 and basic file I/O — nothing from Data Analysis is required. It's optional and ungraded; see [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Install `uv`, the `pydub`/`numpy`/`matplotlib` stack, and a working `ffmpeg` so compressed formats have a real encoder behind them.
2. Synthesize a clean test tone from scratch — a guaranteed source of audio no matter what files you own.
3. Trim, fade, and volume-normalize a clip with millisecond precision.
4. Convert between WAV, MP3, and OGG and splice several clips into one seamless montage.
5. Render a waveform so you can see exactly what your edits did to the sound.

## Where to run this

**Locally with `uv`** is the primary, recommended path — `pydub` delegates MP3/OGG encoding to the `ffmpeg` binary, and that's the one dependency this project can't install for you from PyPI. You'll install `ffmpeg` through your system package manager in Setup; everything after that runs from your terminal.

**GitHub Codespaces** works well too: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) — `ffmpeg` is already installed there, so every step below (including the format conversions in Step 3) runs without touching the system.

**Google Colab, Kaggle Notebooks, and Binder are a genuine way to run this nearly end to end** — more honest than most projects, because nothing here depends on your local git history. The honest caveat is audio input: a notebook has none of your audio files, so the notebook below *synthesizes the same test tone* you build in Step 1 and works with that. It can also install an `ffmpeg` binary for the format-conversion step, so even MP3/OGG conversion works — it's just converting a tone nobody recorded, rather than a clip you care about. Use it to see the whole pipeline run with zero setup; switch to local `uv` or a Codespace once you want it pointed at your own recordings.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/audio-editor/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/audio-editor/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Faudio-editor%2Fnotebook.ipynb)

## Setup

Everything you need before you write a line of the editor itself: a modern Python toolchain, the audio libraries, and the one system binary `pydub` can't live without.

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

### Set up the project

```bash
uv init audio-editor
cd audio-editor
uv add pydub numpy matplotlib
```

`pydub` is the audio editor itself — it loads, slices, and exports audio. `numpy` turns the audio's raw samples into an array you can analyze, and `matplotlib` draws the waveform you'll render in Step 5. All three install from PyPI in one command.

### Install `ffmpeg`

`pydub` only handles uncompressed WAV natively. The moment you export MP3 or OGG (Step 3), it shells out to the `ffmpeg` binary on your system:

- **macOS**: `brew install ffmpeg`
- **Ubuntu/Debian**: `sudo apt install ffmpeg`
- **Windows** (choco): `choco install ffmpeg` — or install the build from ffmpeg.org and add it to your PATH

Confirm it's visible to your shell:

```bash
ffmpeg -version
```

**✅ Checklist**

- ✅ `uv --version` prints a version number.
- ✅ `audio-editor/` exists with a `pyproject.toml`, and `pydub`, `numpy`, and `matplotlib` are installed.
- ✅ `ffmpeg -version` prints the FFmpeg version banner (Skips fine if you only ever touch WAV — you'll hit the wall in Step 3 otherwise).

## Step 1: Synthesize and inspect a test tone

Most audio projects start with "load a file you have" — which quietly fails the moment the learner has no `.mp3` handy. So this project starts the other way: you'll *build* a clean 3-second sine wave from raw numbers, then inspect it like it were any imported file. Generating audio is also the fastest possible way to understand what a sample actually is: a signed integer per frame, and the "pitch" is just how fast that integer oscillates.

### 1.1 Build a tone from raw samples

**👟 Starter hint:** Start with a mono, 16-bit, 44.1 kHz sine wave at 440 Hz (concert A) using only the standard-library `array` module, then wrap the resulting bytes in a `pydub` `AudioSegment`.

```python
# audio_editor.py
import math
from array import array
from pathlib import Path

from pydub import AudioSegment

def make_test_tone(freq: float = 440.0, ms: int = 3000, gain_db: float = -12.0, sample_rate: int = 44100) -> AudioSegment:
    """A clean 16-bit sine wave: `freq` Hz, `ms` milliseconds long, at `gain_db` dB."""
    n_samples = int(ms / 1000 * sample_rate)
    raw = array("h", (int(32767 * 0.5 * math.sin(2 * math.pi * freq * t / sample_rate)) for t in range(n_samples)))
    return AudioSegment(raw.tobytes(), frame_rate=sample_rate, sample_width=2, channels=1).apply_gain(gain_db)

tone = make_test_tone()
print(f"Duration: {len(tone) / 1000:.1f} seconds")
print(f"Channels: {tone.channels} (mono)")
print(f"Sample rate: {tone.frame_rate} Hz")
print(f"Sample width: {tone.sample_width} bytes (16-bit)")
print(f"Loudness: {tone.dBFS:.1f} dBFS")
tone.export(Path("tone.wav"), format="wav")
print("Saved tone.wav")
```

Every line here teaches a real audio concept. `array("h", ...)` writes signed 16-bit integers — the two bytes (`sample_width=2`) that make up each sample in a standard CD-quality file. The expression inside computes `sin(2π·freq·t / sample_rate)`: multiplying the sine's argument by `t/sample_rate` converts elapsed *samples* into elapsed *seconds*, so 440 Hz means the wave completes 440 full cycles per second. `apply_gain` scales loudness in the decibel domain, which is how ears (and the rest of this project) talk about volume.

**🎯 Expected output:** Prints `Duration: 3.0 seconds`, `Channels: 1 (mono)`, `Sample rate: 44100 Hz`, `Sample width: 2 bytes (16-bit)`, a loudness reading around **-21 dBFS**, and `Saved tone.wav`.

**🩹 If it's off:** If `apply_gain` or another pydub call raises an opaque error, you may have a stale pydub version — `uv add pydub` again to get a recent one. If the loudness printout isn't near -21 dBFS, remember `dBFS` is *RMS* loudness: a half-scale sine peaks at -6 dBFS but reads ~3 dB quieter on average, and your `-12` gain shifts that whole reading down. If WAV export fails, it's not ffmpeg — WAV is pydub's native path; check the file path is writable.

### 1.2 Verify the tone

**✅ Checklist**

- ✅ `make_test_tone()` returns a 3.0 s, mono, 44.1 kHz, 16-bit `AudioSegment`, and `tone.wav` exists.
- ✅ You can read back, in your own words, how `t / sample_rate` converts sample index into seconds.
- ✅ You can say why 16-bit audio stores each sample in 2 bytes.

**🤔 Socratic Question(s)**

- What would change about the tone if you removed the `* 0.5` before `int(...)` in the sine expression? (That's a quick way to feel the difference between "clipping" and "quiet audio".)
- Why would doubling the frequency from 440 to 880 Hz *halve* the pitch period but keep the exactly-3-second duration identical?

## Step 2: Trim, fade, and normalize a clip

Real audio is never uniformly loud and never starts at a convenient zero-crossing. Three edits fix that: **trimming** removes the parts you don't want, **fading** ramps the volume at the edges so you don't hear a click, and **normalization** shifts overall loudness to a target level so your clip sits consistently next to others.

### 2.1 Write the three edit functions

**👟 Starter hint:** Write plain functions — `trim_audio(audio, start_ms, end_ms)`, `apply_fades(...)`, and `normalize_volume(...)` — each returning a *new* `AudioSegment`, never mutating the input.

```python
# audio_editor.py (continued)
def trim_audio(audio: AudioSegment, start_ms: int, end_ms: int) -> AudioSegment:
    """Extract the segment between start_ms and end_ms, clamped to valid bounds."""
    start_ms = max(0, start_ms)
    end_ms = min(len(audio), end_ms)
    return audio[start_ms:end_ms]

def apply_fades(audio: AudioSegment, fade_in_ms: int = 1000, fade_out_ms: int = 1000) -> AudioSegment:
    """Ramp volume up over fade_in_ms and back down over fade_out_ms to avoid clicks."""
    return audio.fade_in(fade_in_ms).fade_out(fade_out_ms)

def normalize_volume(audio: AudioSegment, target_db: float = -20.0) -> AudioSegment:
    """Shift the whole clip so its average (RMS) loudness lands on target_db."""
    return audio.apply_gain(target_db - audio.dBFS)
```

Slicing an `AudioSegment` with `[start_ms:end_ms]` works exactly like slicing a list, but the units are milliseconds — and unlike a human with a razor blade, Python always makes a *copy*, so your original `tone` survives every trim. Fading in is not decoration: a waveform that starts at full amplitude snaps from silence to a scream in one sample, which sounds like a click; a fade over a few hundred milliseconds lets the ear track the change. Normalization is a single subtraction in the decibel domain — decibels are logarithmic, so `target_db - audio.dBFS` is precisely the correction needed (no multiplication required, because adding decibels is multiplying amplitudes).

**🎯 Expected output:** The functions are defined; `len(trim_audio(tone, 500, 2500))` returns 2000 (2.0 seconds) even though you asked for a half-second inside a 3-second tone.

**🩹 If it's off:** If a trim returns a (near-)empty segment, your `start_ms` is greater than or equal to `end_ms` — the slice is empty, and pydub won't complain. If normalizing a *silent* clip raises or prints a bizarre number, that's because silence has `dBFS = -inf`: subtracting `-inf` gives infinity, which is undefined as a gain — always normalize audio that actually has sound in it.

### 2.2 Apply the edits and export

**👟 Starter hint:** Cut the tone down to 500–2500 ms, fade in 200 ms and out 400 ms, normalize to -18 dBFS, and export `clip.wav`.

```python
clip = trim_audio(tone, 500, 2500)
clip = apply_fades(clip, fade_in_ms=200, fade_out_ms=400)
clip = normalize_volume(clip, target_db=-18.0)
clip.export("clip.wav", format="wav")
print(f"Exported clip.wav ({len(clip) / 1000:.1f}s)")
```

**🎯 Expected output:** Prints `Exported clip.wav (2.0s)` and writes a 2-second WAV whose waveform ramps up at the start.

**🩹 If it's off:** If it prints `0.0s`, the trim slice was backwards (see 2.1). If the clip is *blindingly* loud or silent after normalization, the `target_db` you chose is far from where the tone started — `apply_gain` will happily push it there, which is correct but can surprise you; dial `target_db` to -18 and hear a comfortable level.

### 2.3 Verify the edits

**✅ Checklist**

- ✅ `clip.wav` is exactly 2.0 seconds long and plays with a smooth fade-in and fade-out.
- ✅ The original `tone.wav` is untouched at 3.0 seconds — trimming didn't mutate the source.
- ✅ You can explain why normalization is *addition/subtraction in dB* rather than multiplication of the raw samples.

**🤔 Socratic Question(s)**

- If you applied the fade *after* normalizing, would the final loudness still measure -18 dBFS? Why is the *order* of fade-then-normalize (or normalize-then-fade) a real decision with a different outcome?
- `apply_fades` returns `audio.fade_in(...).fade_out(...)`, chaining two calls. What would break if `fade_in` returned `None` — and what does that tell you about why pydub methods return new segments?

## Step 3: Convert between formats

A single WAV file is the audio equivalent of a `.txt` — uncompressed and giant. Sharing usually means MP3 (for people), OGG (for open-source pipelines), or FLAC (for lossless archives). Format conversion is the one step in this project that calls out to a separate binary: `pydub` writes what you tell it to, but `ffmpeg` does the actual encoding.

### 3.1 Write `convert_format`

**👟 Starter hint:** Write one function that loads *any* readable path and re-exports it under a different format, taking the format explicitly so there's no guessing from extensions.

```python
# audio_editor.py (continued)
def convert_format(input_path: str, output_path: str, fmt: str = "wav") -> None:
    """Load any pydub-supported file and re-save it as `fmt`."""
    audio = AudioSegment.from_file(input_path)
    audio.export(output_path, format=fmt)
    print(f"Converted {input_path} -> {Path(output_path).name}")

convert_format("clip.wav", "clip.mp3", fmt="mp3")
convert_format("clip.wav", "clip.ogg", fmt="ogg")
```

`AudioSegment.from_file` sniffs the format from the file, so the loader stays generic — and passing `format=` to `export` removes any ambiguity about what you asked for. Notice there's no error handling around the `ffmpeg`-backed exports: if the binary is missing, `pydub` raises a clear `FileNotFoundError` that names it, which is the failure we want you to see *once* so you never forget Step 1 translated to this moment.

**🎯 Expected output:** Prints `Converted clip.wav -> clip.mp3` and `Converted clip.wav -> clip.ogg`, and both new files exist with **far smaller** sizes than `clip.wav` (MP3/OGG are lossy compression).

**🩹 If it's off:** If you get `FileNotFoundError: ffmpeg not found` (or similar), `ffmpeg` isn't on PATH — run the Setup step you skipped and check `ffmpeg -version`. If MP3 export succeeds but OGG fails, your ffmpeg build may lack the OGG encoder, which is a build-specific gap; convert to `.ogg` via `ffmpeg` directly once in a terminal to confirm the codec is present.

### 3.2 Verify the conversion

**✅ Checklist**

- ✅ `clip.mp3` and `clip.ogg` exist and are both dramatically smaller than `clip.wav`.
- ✅ You can name which step of this project genuinely can't run without a non-Python binary.

**🤔 Socratic Question(s)**

- WAV → MP3 loses information; MP3 → WAV preserves it but does *not* restore what was lost. What does that imply about converting a file back and forth repeatedly, and when would each direction be the right call?
- Why does the load function need no `format=` argument while the export function benefits from one?

## Step 4: Combine clips into a montage

Editing isn't only cutting things down — it's also putting pieces together. The same `+` operator you used to feel out slicing joins segments end to end, and an explicit `AudioSegment.silent(...)` lets you insert deliberate gaps of dead air between them, the way a podcast inserts a beat between segments.

### 4.1 Write `combine_clips`

**👟 Starter hint:** Handle the empty-list case up front, then fold the clips together with `+=`, inserting `gap_ms` of silence between consecutive clips.

```python
# audio_editor.py (continued)
def combine_clips(clips: list[AudioSegment], gap_ms: int = 0) -> AudioSegment:
    """Concatenate clips with `gap_ms` of silence between consecutive ones."""
    if not clips:
        return AudioSegment.empty()
    silence = AudioSegment.silent(duration=gap_ms)
    combined = clips[0]
    for clip in clips[1:]:
        combined += silence + clip
    return combined

intro = trim_audio(tone, 0, 1000)
middle = trim_audio(tone, 1200, 2200)
outro = trim_audio(tone, 2400, 3000)
montage = combine_clips([intro, middle, outro], gap_ms=250)
montage.export("montage.wav", format="wav")
print(f"Montage: {len(montage) / 1000:.1f}s")
```

The important habit here is the empty-list check first: concatenating an empty list would crash the moment you index `clips[0]`, and an *audio editor* that crashes on silence is embarrassing. The build-up pattern — start with `clips[0]`, then append `silence + clip` for each remaining one — is a falsy version of a `sum`-style fold, and it's idiomatic for anything (audio, lists, HTML fragments) where the joining element isn't the identity.

**🎯 Expected output:** Prints `Montage: 3.1s` — three segments totalling 2.6 s *plus* two 250 ms gaps of silence — and writes `montage.wav`.

**🩹 If it's off:** If `combine_clips([])` crashes with an index error, the guard got dropped — bring back the early `if not clips: return`. If the total length isn't 2.6 s + (n-1)·gap, one of your `trim_audio` slices spans outside the tone and got clamped (you asked for more than 3.0 s), so check the raw durations of `intro`/`middle`/`outro`.

### 4.2 Verify the montage

**✅ Checklist**

- ✅ `montage.wav` is exactly 3.1 s and plays three pitch segments separated by quiet gaps.
- ✅ `combine_clips([], gap_ms=250)` returns a valid empty segment without crashing.

**🤔 Socratic Question(s)**

- `montage` was built without fades between segments. List the two problems you'd expect to *hear* at each junction, and where in Step 2's functions you'd insert a fix.
- The gap is added as `combined += silence + clip`, but never between the very first clip and nothing. How would you adjust the loop to put *uniform* `gap_ms` silence between every pair of segments?

## Step 5: Visualize the waveform

By now you've transformed audio four ways but *seen* none of it. A waveform turns amplitude history into a shape — you can literally diagnose a bad trim (abrupt cliff), a missing fade (vertical drop), or a normalized clip (uniform height) with one glance. This is the payoff step: the numbers become a picture.

### 5.1 Write `plot_waveform`

**👟 Starter hint:** Pull the raw samples out of the segment with `get_array_of_samples()`, map sample *index* to *seconds* with `np.linspace`, and plot amplitude against time — then save and show the result.

```python
# audio_editor.py (continued)
import numpy as np
import matplotlib.pyplot as plt

def plot_waveform(audio: AudioSegment, title: str = "Waveform") -> None:
    """Plot sample amplitude against time and save a PNG."""
    samples = np.array(audio.get_array_of_samples())
    if audio.channels == 2:
        samples = samples[::2]
    times = np.linspace(0, len(audio) / 1000, num=len(samples))
    plt.figure(figsize=(12, 4))
    plt.plot(times, samples, linewidth=0.5, color="#2563eb")
    plt.fill_between(times, samples, alpha=0.3, color="#2563eb")
    plt.title(title)
    plt.xlabel("Time (seconds)")
    plt.ylabel("Amplitude")
    plt.tight_layout()
    plt.savefig("waveform.png", dpi=150)
    print("Saved waveform.png")

plot_waveform(clip, "Trimmed + Faded + Normalized Clip")
```

`get_array_of_samples()` hands you the same underlying 16-bit integers you *created* in Step 1 — analysis and synthesis are two sides of one coin. The stereo `samples[::2]` trick decimates: taking every second sample extracts exactly one channel, because channels are interleaved left-right-left-right. `linspace(0, len(audio)/1000, num=len(samples))` reuses the Step 1 insight — sample index maps to time by dividing by the sample rate — so the time axis is in honest seconds.

**🎯 Expected output:** A matplotlib window plus `waveform.png` showing a 2-second trace that tapers up near `t=0` (the fade-in) and tapers down near `t≈1.6 s` (the fade-out).

**🩹 If it's off:** If no window opens on a headless machine or in a notebook, that's expected — `plt.savefig` already wrote the PNG, and notebook users get the inline plot instead; nothing is broken. If the plot shows a solid blue block, the tone is too dense at 44.1 kHz to resolve — zoom in, or plot a shorter slice like `tone[0:200]`. If two channels smear each other, the `[::2]` decimation is missing.

### 5.2 Verify the visualization

**✅ Checklist**

- ✅ `waveform.png` exists and shows a clear fade-in ramp, a fade-out ramp, and a relatively flat middle.
- ✅ You can point at the fade in the picture *before* looking at the code that made it.

**🤔 Socratic Question(s)**

- How would `plot_waveform(tone, ...)` (3 seconds, no fades) look different from `plot_waveform(clip, ...)`, and what does that comparison tell you about using waveforms to verify your own edits?
- The waveform shows amplitude, not loudness. A quiet 20 Hz thump and a loud 20 kHz hiss both swing between ±0.5 — what *additional* measurement (hint: it's already printed in Step 1) distinguishes them, and why?

## ⚠️ Common pitfalls

- **Missing `ffmpeg`.** MP3/OGG export is the one step that depends on a non-Python binary. `pydub` raises a `FileNotFoundError` naming `ffmpeg` — an honest, instructive failure — but you can skip the entire class of errors by running the Setup check `ffmpeg -version` once before Step 3.
- **Trimming past the end silently clamps.** `audio[start:end]` never complains when `end` exceeds the duration; it just returns less audio than you asked for. Debugging "my montage is shorter than expected" starts with summing the lengths of the pieces, not with the combine logic.
- **Normalizing silence raises a weird error.** A silent clip has `dBFS = -inf`, so `target_db - audio.dBFS` is `inf`, and `apply_gain(inf)` is undefined. Guard with a `if audio.dBFS == float('-inf')` check before normalizing, or never normalize a segment you haven't verified has sound.
- **Visualizing long files with huge arrays.** `get_array_of_samples()` on a long stereo file returns millions of samples; plotting all of them is slow and looks like a solid blob. Sub-slice the segment (`audio[start:end]`) or downsample before you plot.
- **Forgetting that dB is logarithmic.** A gain of `+6 dB` doesn't double the sample values — it doubles the *power*. Numerically doubling `int(...)` values is a ~6 dB boost, and mixing up the two is how volumes end up 6 dB off from a target.
- **Assuming stereo is two copies of the same data.** Interleaved channels mean `samples[::2]` is *one* channel, not "the even data". Skipping the decimation smears your waveform.

## What you just built

A working command-line audio editor: it synthesizes sound from raw sample math, trims it with millisecond precision, fades and normalizes it in the decibel domain, converts formats through a real external encoder, splices multiple clips into a montage, and proves every edit visually with a rendered waveform. Nothing here is a simulation — `tone.wav`, `clip.wav`, and `montage.wav` are playable audio files you can open in any media player.

:::tip[Run a fuller version without any local setup]
[`examples/audio-editor/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/audio-editor) in the course repo is a fuller version of the code above as a single runnable notebook: it synthesizes the test tone, runs every edit from Steps 1–5, and displays the waveform inline. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Build a **silence detector**: `split_on_silence(tone)` segments an audio file at quiet points and prints each segment's `(start_ms, end_ms)` — pydub ships `audio.split_on_silence(...)` ready to use, and it makes auto-splitting a long recording nearly free.
- Write a **podcast combiner** that joins an intro, several episode segments, and an outro with `clip.crossfade(duration)` for smooth transitions instead of hard gaps — you've already got `combine_clips`, so replacing `AudioSegment.silent(...)` with `crossfade` is one line of thinking.
- Add **pitch-preserving speed control**: `audio._spawn(data, overrides={'frame_rate': new_rate}).set_frame_rate(original_rate)` plays the same audio faster without a chipmunk voice — the sample math from Step 1 makes this one feel like a victory lap.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to making Python make noise. 🎓