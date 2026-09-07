---
title: "Build a Voice Cloning Toolkit"
description: "Build the measuring half of voice cloning: read WAV audio with numpy, extract pitch and energy features, build per-speaker profiles, compare them, and shape one clip toward another voice's statistics. Ethics-first framing."
difficulty: "advanced"
estimatedMinutes: 75
tags: ["audio", "numpy", "signal-processing"]
learningObjectives:
  - Read and normalize WAV audio into numpy arrays
  - "Extract pitch, energy, and zero-crossing features per frame"
  - Build a per-speaker voice profile from the features
  - "Compare two profiles with a distance metric"
  - Shift a clip toward a target pitch range and write the WAV out
prerequisites:
  - "Python basics (functions, loops)"
  - "Comfort with numpy arrays, slicing, and small math"
  - "Intuition for frequency and sample rate (one hour of audio basics)"
---

# 🛠️ 🎙️ Build a Voice Cloning Toolkit

Voice cloning makes headlines, but underneath the magic is a measurement problem: what, precisely, makes one voice sound like *that* person? This toolkit builds the honest, interpretable half of that problem in numpy — read audio as raw numbers, measure pitch and energy per frame, condense a clip into a speaker profile, compare two profiles, and finally shape a clip toward another voice's statistics. You will not produce a celebrity's synthetic voice here; you *will* understand the numbers every real cloning system starts from.

This assumes Python 101, comfort with numpy, and a passing familiarity with sample rate and frequency — nothing from Data Analysis beyond that is required. It's optional and ungraded; see [Real-World Projects](/docs/projects) for the full, growing list.

> **The responsibility clause.** Cloning a voice without consent is impersonation and, in many jurisdictions, fraud — this toolkit is designed as a *measurement* instrument and ships no model that reproduces a real person from a sample. Use it on your own recordings, synthetic clips, and clearly-labeled reference material. Remember what a feature extractor can hold: statistics, not identity.

## 🎯 What you'll do

1. Read a WAV file into a normalized numpy array and inspect its shape.
2. Extract per-frame features — RMS energy, zero-crossing rate, and pitch via autocorrelation.
3. Condense a clip's features into a single speaker profile.
4. Compare two speakers with a distance metric to find the closer match.
5. Shape a target clip's pitch into a reference voice's range and write the WAV out.

## Where to run this

**Locally with `uv`** is the primary path. It's numpy-only, so it installs cleanly anywhere, and it's the only path where *your* WAV files (your own recordings, clearly-labeled reference audio) live on a disk you point at. Real audio work is local work.

**Google Colab, Kaggle Notebooks, and Binder** run every step identically — numpy is pre-installed and floating-point math is the same everywhere. The honest caveat: a notebook has no *speaker's own files* by default, so the example notebook synthesizes sine and formant-style clips to demonstrate feature extraction (as this guide does below), rather than pretending to clone a real recording. Use the badges to see the features and profiles computed end to end; switch to local `uv` when you want to point the toolkit at real, ethically-owned audio.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/voice-cloning-toolkit/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/voice-cloning-toolkit/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fvoice-cloning-toolkit%2Fnotebook.ipynb)

## Setup

Create the project and install the single library the toolkit is built on.

```bash
uv init voice-cloning-toolkit
cd voice-cloning-toolkit
uv add numpy
```

```bash
uv run python -c "import numpy; print('ok')"
```

`numpy` is the whole audio engine: a WAV file becomes a 1-D `float` array, and every feature in this project — energy, crossing rate, pitch — is a numpy expression over that array. `wave` (used in Step 1) ships with Python and handles the WAV container.

**✅ Checklist**

- ✅ `uv add numpy` finished and the import check prints `ok`.
- ✅ A fresh `voice-cloning-toolkit/` project exists with a `pyproject.toml`.

## Step 1: Read a WAV file into a numpy array

Every measurement in this toolkit starts the same way: a `.wav` on disk becomes a 1-D array of values from −1 to 1, one per sample. This step writes a small demo tone, reads it back, and verifies the math that turns bytes into sound.

### 1.1 Write `read_wav` and a demo tone

**👟 Starter hint:** Use the standard-library `wave` module to open the container, pull `framerate` and channel count, decode the raw bytes with `np.frombuffer`, and normalize `int16` values to `[-1, 1]`.

```python
# voicekit.py
import wave
import numpy as np

def read_wav(path: str) -> tuple[np.ndarray, int]:
    """Return (float samples in [-1,1], sample_rate)."""
    with wave.open(path, "rb") as wav:
        sample_rate = wav.getframerate()
        n_channels = wav.getnchannels()
        frames = wav.readframes(wav.getnframes())
    data = np.frombuffer(frames, dtype=np.int16).astype(np.float64)
    if n_channels > 1:
        data = data[::n_channels]
    return data / 32768.0, sample_rate

SR = 22050
seconds = 2
t = np.linspace(0, seconds, SR * seconds, endpoint=False)
tone = 0.3 * np.sin(2 * np.pi * 220 * t)

with wave.open("demo.wav", "wb") as wav:
    wav.setnchannels(1)
    wav.setsampwidth(2)          # 16-bit = 2 bytes/sample
    wav.setframerate(SR)
    wav.writeframes((tone * 32767).astype(np.int16).tobytes())

data, sr = read_wav("demo.wav")
print("shape:", data.shape, "sr:", sr, "peak:", round(float(np.abs(data).max()), 3))
```

The pipeline: `wave` reads the container (how long, how wide, how many channels); `np.frombuffer` reinterprets the raw byte string as `int16` numbers without copying; and dividing by `32768.0` rescales the full 16-bit range into floating-point `[-1, 1]` — the unit convention every audio library shares. Mono is a list index hop away (`data[::n_channels]` on a 2-channel file takes every other sample). The sine at `220 Hz` is pitched mid-baritone, which Step 2 should *measure back*.

**🎯 Expected output:** `shape: (44100,) sr: 22050 peak: 0.3` — one sample per frame at exactly 0.3 peak amplitude.

**🩹 If it's off:** If `shape` reports `(88200,)`, `setnchannels(1)` was skipped or `read_wav` isn't collapsing stereo. If the peak is `0.03`, the `0.3` amplitude divided by `100` means the `int16` scaling step double-normalized. If `wave.ERROR` says the file is not a RIFF wave, `writeframes` wrote unencoded floats — cast to `.astype(np.int16)` first.

### 1.2 Verify the reader

**✅ Checklist**

- ✅ `demo.wav` exists and `read_wav` returns `(44100 samples, 22050 Hz)`.
- ✅ Peak absolute value equals the `0.3` you wrote.
- ✅ Editing `SR` and re-running changes the sample count proportionally.

**🤔 Socratic Question(s)**

- The file stores `int16` values; the reader converts to floats in `[-1, 1]`. Why would a feature extractor *deliberately* avoid integers for energy math — what breaks if you compute RMS on raw `int16` and then on floats?
- A 2-second clip at 22 050 Hz is 44 100 samples. If audio is instantly "sound at a moment in time," why does the toolkit need *frames* (Step 2) instead of treating the whole array as one number?

## Step 2: Extract per-frame features

A voice is not one pitch — it's a pitch *contour* that changes 10 times a second. This step chops the audio into small overlapping frames and measures each one: how loud (`RMS energy`), how noisy (`zero-crossing rate`), and what fundamental it's buzzing at (`autocorrelation pitch`).

### 2.1 Frame the signal and compute energy and crossings

**👟 Starter hint:** Frame with 20 ms windows and 10 ms hops (standard speech settings), then make `rms` and `zero_crossings` one-line numpy functions.

```python
# voicekit.py (continued)
def frame_signal(data: np.ndarray, frame_s: float = 0.02,
                 hop_s: float = 0.01, sr: int = SR):
    frame_n = int(frame_s * sr)
    hop_n = int(hop_s * sr)
    frames = [data[i:i + frame_n]
              for i in range(0, len(data) - frame_n + 1, hop_n)]
    return np.array(frames)

def rms(segment: np.ndarray) -> float:
    return float(np.sqrt(np.mean(segment ** 2)))

def zero_crossings(segment: np.ndarray) -> int:
    return int(np.mean(np.diff(np.sign(segment)) != 0) * len(segment))

frames = frame_signal(data)
energies = np.array([rms(f) for f in frames])
crossings = np.array([zero_crossings(f) for f in frames])
print("frames:", frames.shape[0], "| mean energy:", round(float(energies.mean()), 4))
print("mean crossings/frame:", round(float(crossings.mean()), 1))
```

`frame_signal` is the classic speech-analysis geometry: 20 ms per frame, sliding forward 10 ms — so every sample gets measured more than once, which keeps the pitch contour smooth. `rms` is the definition of loudness (`mean(segment²)` then the square root); `zero_crossings` counts how often the waveform passes through zero, a cheap proxy for brightness/noisiness — a hissy 's' crosses constantly, a warm 'o' rarely. A pure 220 Hz sine's energy is flat, which is exactly what the demo shows.

**🎯 Expected output:** `frames: 199` (2 s at 10 ms hops), a mean energy near `0.21`, and a mean crossings/frame near 9 (a 220 Hz frame spans 4.4 cycles, two crossings each).

**🩹 If it's off:** If `frames: 200`, the `+ 1` boundary in the range is missing so the last partial frame slipped in. If energy varies wildly per frame, `i:i + frame_n` has an off-by-overlap and frames share raw data unevenly. If crossings read ~440, you're counting *both* edges of each cycle — that's twice the expected rate and should be divided in `zero_crossings`.

### 2.2 Estimate pitch by autocorrelation

**👟 Starter hint:** Autocorrelate the centered frame, limit the lag search to 80–400 Hz (the human voice band), find the lag (in samples) that peaks, and convert `lag → Hz` with `sr / lag`.

```python
# voicekit.py (continued)
def autocorr_pitch(segment: np.ndarray, sr: int = SR) -> float:
    seg = segment - segment.mean()
    corr = np.correlate(seg, seg, mode="full")[len(seg) - 1:]
    min_lag = int(sr / 400)   # highest pitch we accept
    max_lag = int(sr / 80)    # lowest pitch we accept
    region = corr[min_lag:max_lag + 1]
    if len(region) == 0 or region.max() <= 0:
        return 0.0
    peak_lag = min_lag + int(np.argmax(region))
    return sr / peak_lag

pitches = np.array([autocorr_pitch(f) for f in frames])
voiced = pitches[pitches > 0]
print("median pitch:", round(float(np.median(voiced)), 1), "Hz")
```

Autocorrelation asks a simple question: *shift the frame against itself, and at what lag does it look most like its neighbor?* For a 220 Hz tone sampled at 22 050 Hz, one full cycle is ~100 samples, so the correlation peaks at lag ≈ 100 → `sr / lag ≈ 220`. Restricting `min_lag`/`max_lag` to the 80–400 Hz band is the part that keeps a breathy or silent frame from matching random noise at some absurd lag; anything outside the human voice band isn't a pitch worth reporting, and `return 0.0` marks a frame unvoiced.

**🎯 Expected output:** A `median pitch` very close to `220.0` Hz — the toolkit measured the tone it was handed.

**🩹 If it's off:** If pitch reads ~110 Hz, `peak_lag` found the *second* peak (exact octave harmonic) because the chosen region is too wide — narrow `max_lag`, or take the first local maximum, not the global one. If pitch is `0.0` everywhere, `region.max() <= 0` is filtering everything out because the segment's mean wasn't subtracted. If frequencies are unstable across frames, the 20 ms frame is so long it pools two different notes — shorten `frame_s`.

### 2.3 Verify the feature set

**✅ Checklist**

- ✅ Frames = ~199, mean energy near 0.21, crossings near 18, median pitch ≈ 220 Hz.
- ✅ Unvoiced frames (silence) are reported as `0.0`, not a random pitch.
- ✅ You can state what one *frame* represents and why overlapping helps.

**🤔 Socratic Question(s)**

- Autocorrelation found the tone's period perfectly on a pure sine. What real-world audio (think: a vocal 's' or a laugh) makes autocorrelation fail or halve, and how would you detect that failure in the pitch contour itself?
- Zero-crossing rate and pitch both rise for high voices. Why do speech tools compute *both* rather than treating the crossing rate as a stand-in for pitch?

## Step 3: Build a speaker profile

Features per frame are the raw material; a *profile* is the condensation a comparison can use — the mean and range of pitch, and mean energy, squeezed from an entire clip into one small dict.

### 3.1 Write `build_profile`

**👟 Starter hint:** Read the file, frame it, run the Step 2 features over every frame, then collect the *voiced* pitches and the overall energy into a single summary dict.

```python
# voicekit.py (continued)
def build_profile(path: str) -> dict:
    data, sr = read_wav(path)
    frames = frame_signal(data, sr=sr)
    pitches = [autocorr_pitch(f, sr) for f in frames]
    voiced = [p for p in pitches if p > 0]
    energy = float(np.mean([rms(f) for f in frames]))
    return {
        "mean_pitch": float(np.mean(voiced)) if voiced else 0.0,
        "pitch_range": (float(min(voiced)), float(max(voiced))) if voiced else (0.0, 0.0),
        "mean_energy": energy,
    }

def make_tone(freq: float, seconds: float = 1.0, sr: int = SR) -> str:
    t = np.linspace(0, seconds, int(sr * seconds), endpoint=False)
    tone = 0.25 * np.sin(2 * np.pi * freq * t)
    path = f"tone_{int(freq)}Hz.wav"
    with wave.open(path, "wb") as wav:
        wav.setnchannels(1); wav.setsampwidth(2)
        wav.setframerate(sr)
        wav.writeframes((tone * 32767).astype(np.int16).tobytes())
    return path

prof_low = build_profile(make_tone(110))
prof_high = build_profile(make_tone(300))
print("low voice:", prof_low)
print("high voice:", prof_high)
```

A profile is exactly four numbers chosen to be *legible*: `mean_pitch` locates the voice in the human range, `pitch_range` captures expressiveness (monotone → wide), and `mean_energy` proxies loudness. Filtering `voiced` matters — silent frames would drag the mean toward 0 and poison the comparison if left in. Reusing `make_tone` gives the toolkit controlled test voices: two pure tones at 110 Hz and 300 Hz whose profiles *should* differ only in `mean_pitch`, so the profile extraction is verifiable before real audio complicates it.

**🎯 Expected output:** Two profiles whose `pitch_range` centers differ — `mean_pitch ≈ 110` for the low tone, `≈ 300` for the high tone — with roughly equal `mean_energy` (`≈ 0.18`).

**🩹 If it's off:** If both pitches read ~0, `voiced` is empty because `autocorr_pitch` never cleared the `region.max() > 0` test. If `mean_energy` differs hugely between tones, `make_tone` amplitudes differ (line `tone = 0.25 * …` uses two different multipliers). If `pitch_range` is a single number instead of a tuple, the wrapping parens in the dict are missing.

### 3.2 Verify profiles

**✅ Checklist**

- ✅ The low-tone profile reports ~110 Hz and the high-tone ~300 Hz.
- ✅ Both `mean_energy` values agree within a few percent.
- ✅ A silence-only clip profiles to `mean_pitch: 0.0` without crashing.

**🤔 Socratic Question(s)**

- The profile is four numbers, yet humans distinguish hundreds of voices. What information are you *throwing away* that a real deepfake model would keep, and why is discarding it actually a safety feature for this toolkit?
- `mean_energy` folds loudness into the profile, but a voice recorded close versus far away changes it. How would you make the profile fair across recording distances — and does that change make comparisons more honest?

## Step 4: Compare two speakers with a distance metric

With profiles as points, "who is closer to whom" becomes arithmetic: a relative distance per feature, summed. This step scores a target voice's distance from each candidate profile and ranks the nearest — the same shape a voice-ID system's last layer uses.

### 4.1 Write `profile_distance` and rank candidates

**👟 Starter hint:** Normalize each feature difference by the reference value (so 10 Hz matters less at 300 Hz than at 100 Hz), sum the two normalized differences, and pick the candidate with the smallest total.

```python
# voicekit.py (continued)
def profile_distance(a: dict, b: dict) -> float:
    pitch_diff = abs(a["mean_pitch"] - b["mean_pitch"]) / (b["mean_pitch"] + 1e-9)
    energy_diff = abs(a["mean_energy"] - b["mean_energy"]) / (b["mean_energy"] + 1e-9)
    return pitch_diff + energy_diff

mid_tone = build_profile(make_tone(200))
candidates = {"low": prof_low, "high": prof_high}
for name, prof in candidates.items():
    print(f"{name:>5} distance: {profile_distance(mid_tone, prof):.3f}")

best = min(candidates, key=lambda n: profile_distance(mid_tone, candidates[n]))
print("closest match to 200 Hz:", best)
```

Dividing each difference by the reference feature is the trick: `|110 − 200| / 110 ≈ 0.82` but `|300 − 200| / 300 ≈ 0.33`, so an absolute gap is judged *relative to the pitch it's happening at* — a 10 Hz boss-voice drift should hurt less than a 10 Hz whisper drift. Adding `1e-9` against a zero reference keeps the formula from dividing by silence. Summing the two normalized terms produces a unit-free "closeness" you can compare across candidates, and `min(..., key=...)` turns the scoreboard into a verdict.

**🎯 Expected output:** `low  distance: 0.82`, `high distance: 0.33`, then `closest match to 200 Hz: high` — the 200 Hz tone is nearer the 300 Hz profile.

**🩹 If it's off:** If distance to 'low' and 'high' are equal, the denominator in one `diff` line is mis-scaled (both using `a` instead of `b`). If the verdict is always 'low', `min` picked the *maximum* distance because `key=` returns `-distance`. If distance prints `inf`, a profile has `mean_pitch == 0.0` and the `1e-9` guard is missing.

### 4.2 Verify comparisons

**✅ Checklist**

- ✅ A 200 Hz tone is judged closest to the 300 Hz profile under this metric.
- ✅ A 150 Hz tone flips the verdict toward low, and you can predict where the boundary is.
- ✅ You can explain *why* normalizing by the reference beats raw absolute differences.

**🤔 Socratic Question(s)**

- This metric weights pitch and energy equally (1:1). For a real "similar sounding" ranking you'd add a third feature, or weight pitch higher. What happens to the verdict if `energy_diff` starts dominating — what kind of wrong answer appears?
- The metric never uses pitch *range*. Two voices with the same mean pitch but one monotone and one animated get distance 0. When does range actually matter for telling voices apart, and what would you trade to include it?

## Step 5: Shape a clip toward a target range

The final move is the toolkit's honest "clone": measure each frame's pitch, and if it lands outside a reference speaker's range, resample that frame so it shifts toward the reference — then write the result as a new WAV. The statistics transfer; identity doesn't.

### 5.1 Write the pitch-fitting step and WAV writer

**👟 Starter hint:** Resample a frame by factor `f` via `np.interp` (shortening raises pitch, lengthening lowers it), clamp each out-of-range frame toward the reference range, and reassemble the frames into one array.

```python
# voicekit.py (continued)
def pitch_shift(segment: np.ndarray, factor: float) -> np.ndarray:
    n = int(len(segment) / factor)
    xs = np.linspace(0, len(segment) - 1, n)
    return np.interp(xs, np.arange(len(segment)), segment)

def fit_to_range(data: np.ndarray, sr: int, target: dict) -> np.ndarray:
    low, high = target["pitch_range"]
    frames = frame_signal(data, sr=sr)
    shaped = []
    for frame in frames:
        p = autocorr_pitch(frame, sr)
        if 0 < p < low:
            shaped.append(pitch_shift(frame, low / p))
        elif p > high:
            shaped.append(pitch_shift(frame, high / p))
        else:
            shaped.append(frame)
    return np.concatenate(shaped)

def write_wav(path: str, data: np.ndarray, sr: int = SR) -> None:
    with wave.open(path, "wb") as wav:
        wav.setnchannels(1); wav.setsampwidth(2); wav.setframerate(sr)
        clip = np.clip(data, -1, 1)
        wav.writeframes((clip * 32767).astype(np.int16).tobytes())

source = read_wav(make_tone(500))       # a 500 Hz tone
shaped_data, sr = source[0], source[1]
shaped = fit_to_range(shaped_data, sr, prof_low)   # target range ~110 Hz
write_wav("shaped.wav", shaped)
after = build_profile("shaped.wav")
print("before:", round(build_profile("tone_500Hz.wav")["mean_pitch"], 1), "Hz")
print("after:", round(after["mean_pitch"], 1), "Hz  (target ~min/mean of low)")
```

`pitch_shift` resamples: for `factor = 2`, it keeps every 2nd-ish sample into half the length, which *raises* the perceived pitch an octave — the physics of playing a recording faster is exactly the same transform. `fit_to_range` applies it only where needed: beneath the reference's `pitch_range` low edge, shift the frame up to `low`; above the high edge, down. It also reveals the honest trade — resampling changes *duration* too, which is why real voice cloning re-synthesizes with a vocoder rather than resampling, and why this toolkit's output is a "shaped" demo, never a parasitic copy.

**🎯 Expected output:** "before: 500.0 Hz", "after:" a value near the low profile's range (`~110–150`), and a playable `shaped.wav` on disk whose pitch you'll hear drop.

**🩹 If it's off:** If "after" still reads ~500 Hz, `build_profile` is being run on `tone_500Hz.wav` instead of `shaped.wav` (the `after` variable). If the pitch drops but the file is silent, `write_wav` clipped everything past `±1` — the resampled frames overflowed before `np.clip`. If you hear artifacts instead of a tone, `np.concatenate` joined frames with misaligned lengths — every `pitch_shift` must reassemble cleanly by filtering *whole frames only*.

### 5.2 Verify end to end

**✅ Checklist**

- ✅ A 500 Hz source drops into the low profile's pitch range.
- ✅ `write_wav` produces a playable `shaped.wav` with `build_profile` consistent on re-read.
- ✅ Out-of-range frames shift; in-range frames pass through untouched.
- ✅ You've reflected on the cloning you did *not* build: no learned model, no identity, no consent problem without the clip's owner.

**🤔 Socratic Question(s)**

- Resampling shifts both pitch and speed, so the shaped voice is shorter. If you wanted to preserve real-time duration, what would you have to do to the *other* frames (hint: the reverse resample), and what artifact appears when the two adjustments collide?
- The toolkit transfers statistics yet explicitly cannot reproduce a voice. Where, precisely, does the line sit between "measuring a voice" and "impersonating a voice" — and which of today's features would you have to *remove*, not add, to keep this tool on the safe side?

## ⚠️ Common pitfalls

- **Reading raw `int16` as amplitude.** Forgetting the `/ 32768.0` rescale passes integers into feature math; energy and crossings come out wildly inflated. Fix: normalize once in `read_wav`, trust every downstream function.
- **Forgetting to center frames before autocorrelation.** A DC-offset segment correlates with *itself* at lag 0 forever, producing bogus near-0-lag peaks. Fix: subtract `segment.mean()` before `np.correlate`.
- **Pitch doubling/laying on octave errors.** The global argmax of the correlation region can land on the second harmonic. Fix: take the *first* local peak after the minimum lag, or narrow `max_lag`.
- **Mixing raw features with voiced filter.** Feeding unvoiced frames (silence → pitch `0.0`) into `np.mean(voiced)` without filtering drags every profile toward zero. Fix: always drop `pitch <= 0` as Step 3 does.
- **Trusting the profile as identity.** Averages are statistics, not a person. Any use of this toolkit that equates "closest profile" with "that's the speaker" — for security, impersonation, or attribution — repeats exactly the mistake the disclaimer at the top warns against.

## What you just built

A pure-numpy voice measurement toolkit that reads WAV audio, extracts pitch/energy/crossing features per frame, condenses clips into comparable profiles, ranks speaker-close-ness with a normalized distance metric, and shapes one clip's pitch into another's statistical range — with the cloning limit stated honestly on every path. The transferable skill is *feature extraction over raw signals*: audio, sensor streams, and waveforms all reward the same recipe of framing, measuring, and condensing before any "intelligence" layer ever sees them.

:::tip[Run a fuller version without any local setup]
[`examples/voice-cloning-toolkit/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/voice-cloning-toolkit) in the course repo is a fuller version of the code above, with formant-style synthesizer tones and a notebook charting the before/after pitch contour. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Add a third feature — spectral centroid via an FFT of each frame — and watch the distance metric sharpen on two voices that share a mean pitch.
- Plot the pitch contour over the clip's duration so you can *see* vibrato and intonation instead of one mean number.
- Implement a zero-crossing-rate brightness check to reject frames that are mostly unvoiced, making `voiced` filtering smarter than "pitch > 0".
- Write `read_wav`, `build_profile`, and `profile_distance` against a few hand-labeled tones in a `test_voicekit.py` so feature regressions can't sneak in silently.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓