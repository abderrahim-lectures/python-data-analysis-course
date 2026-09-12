---
title: "Build an AI Music Composer"
description: "Generate original melodies with a Markov chain trained on a seed motif, stack chords over them, and export real playable MIDI files, a statistical composer you can hear in any media player."
difficulty: "advanced"
estimatedMinutes: 120
xpReward: 100
tags: ["Creative", "Audio", "Machine Learning"]
prerequisites:
  - "Python basics (lists, dicts, functions, loops, random)"
  - "A rough feel for Western scales and that 'middle C' is a thing, no music theory required"
learningObjectives:
  - "Represent notes and rhythms as numbers the machine can reason about"
  - "Learn a transition model from a seed melody with a Markov chain"
  - "Generate a stepwise-varied melody that respects the seed's statistics"
  - "Derive triad chords from scale degrees and layer them as accompaniment"
  - "Write a real MIDI file with midiutil and verify it on disk"
---

# 🛠️ 🎼 Build an AI Music Composer

Composing a melody from nothing is a blank-page problem; composing a *variation* of a melody you already like is a statistics problem. This project builds the second kind of composer: it reads a short seed melody, learns how each note tends to follow the previous one, then generates new melodies from that learned model, stacks chords underneath, and exports the result as a genuine MIDI file, a song file you can open in any player or digital audio workstation. The "AI" here is elegant and honest: a Markov chain, which is nothing more than "based on what I've heard so far, which note typically comes next?"

This assumes Python 101 and nothing from Data Analysis, and it requires zero music theory to get a playable result, though the Harmony step will make far more sense if you hum along. It's optional and ungraded; see [Real-World Projects](/projects) for the full, growing list.

## 🎯 What you'll do

1. Model pitch as MIDI note numbers and rhythm as beat durations, turning music into a Python list of numbers.
2. Build a Markov chain from a seed melody and verify what it learned by reading its transition table.
3. Generate a new melody of any length by walking that chain.
4. Derive triad chords from scale degrees and lay them under the melody.
5. Export a complete piece to a real `.mid` file with midiutil, and verify the file on disk.

## Where to run this

**Locally with `uv`** is the clear recommended path, the output of this project is a `.mid` file on your own disk that you'll want to open in a local player, and the dependency (`midiutil`) is one `uv add` away.

**GitHub Codespaces** works well too: open [the whole course repo in a free Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) and every step below runs unchanged; the generated `.mid` is a downloadable artifact you can grab from the file tree.

**Google Colab, Kaggle Notebooks, and Binder are a genuine way to run every step**, because the generator itself is pure Python plus one pip-installable library (`!pip install midiutil`). The honest caveat: the notebook's filesystem is ephemeral, so the `.mid` you export lives there, download it before the session closes. There's also no audio output in a notebook, so you'll still want to pull the file locally to actually *hear* the result.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-music-composer/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/ai-music-composer/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fai-music-composer%2Fnotebook.ipynb)

## Setup

Everything needed before generation: a project with `midiutil`, and a mental anchor for what a MIDI note number means.

### Set up the project

```bash
uv init ai-music-composer
cd ai-music-composer
uv add midiutil
```

`midiutil` is a dependable little library that turns Python objects into a binary `.mid` file, the same portable format every DAW, phone app, and media player can open. The composer itself will not depend on it until the last step; everything else is the Python standard library.

### Anchor yourself: note → number

**👟 Starter hint:** Print a small note-to-number dictionary so every later number in this project means something musical instead of arbitrary.

```python
# composer.py
from collections import defaultdict
import random

NOTES = ["C", "D", "E", "F", "G", "A", "B"]
SEMITONES = [0, 2, 4, 5, 7, 9, 11]  # semitones of the major scale steps

MIDI: dict[str, int] = {}
for octave in range(3, 6):
    for i, name in enumerate(NOTES):
        MIDI[f"{name}{octave}"] = 60 + 12 * (octave - 4) + SEMITONES[i]

print(MIDI["C4"], MIDI["E4"], MIDI["A4"])
```

MIDI numbers are semitones counted from the bottom of the keyboard, and middle C is `60`. Building the table from the major-scale steps `[0, 2, 4, 5, 7, 9, 11]`, that's whole-whole-half-whole-whole-whole-half, the same pattern as a piano's white keys, means every name in the table is a *legal pitch class in C major* from the start.

**✅ Checklist**

- ✅ `uv add midiutil` completes with no errors.
- ✅ `MIDI["C4"]` prints `60`, `MIDI["E4"]` prints `64`, and `MIDI["A4"]` prints `69`, each exactly four semitones up from the last leap you'd expect.
- ✅ `composer.py` holds the note-number table and both standard-library imports at the top.

## Step 1: Turn a melody into numbers

A score is prose; a Markov chain needs data. This step converts a small seed melody, one you could hum, into a flat list of MIDI numbers, and introduces the "one note follows another" viewpoint that the whole composer is built on.

### 1.1 Write the seed as a list of MIDI values

**👟 Starter hint:** Transcribe the classic seed `C4 D4 E4 D4 C4 E4 F4 G4 A4 G4 F4 E4 D4 C4` (the first phrase of a lullaby) into a list of the numbers from your `MIDI` table.

```python
# composer.py (continued)
SEED = [MIDI["C4"], MIDI["D4"], MIDI["E4"], MIDI["D4"], MIDI["C4"], MIDI["E4"],
        MIDI["F4"], MIDI["G4"], MIDI["A4"], MIDI["G4"], MIDI["F4"], MIDI["E4"],
        MIDI["D4"], MIDI["C4"]]

print(SEED)
```

A melody is a sequence, and sequences are the input Markov chains are built from. Making the seed a list of *numbers* rather than note names is the core abstraction: the generator never needs to know what `64` "sounds like", only that it often follows `62`.

**🎯 Expected output:** `[60, 62, 64, 62, 60, 64, 65, 67, 69, 67, 65, 64, 62, 60]`, 14 notes, starting and ending on `60`.

**🩹 If it's off:** If a number looks wrong, check the octave in the `MIDI` table construction (a `C4` other than `60` means the `(octave - 4)` offset is off). If the list has length problems, count brackets, the line wrap above must not add or drop a value.

### 1.2 Split the melody into observations

**👟 Starter hint:** Pair each note with its successor, `zip(SEED, SEED[1:])`, and confirm the observations read as note → note.

```python
# composer.py (continued)
observations = list(zip(SEED, SEED[1:]))
print(observations[:4])
print("made", len(observations), "pairs from", len(SEED), "notes")
```

`zip(a, a[1:])` is the pattern that separates any sequence into adjacent pairs, note it produces exactly `len(SEED) - 1` pairs, because the final note has no successor. Each pair is one unit of musical "grammar": *given 62, I observed 64.*

**🎯 Expected output:** `[(60, 62), (62, 64), (64, 62), (62, 60)]` and the count `` made 13 pairs from 14 notes ``.

**🩹 If it's off:** If pairs show values not in `SEED`, you zipped the wrong structure (`SEED[:-1]` and `SEED[1:]` is the safer spelling than a mixed slice). If the pair count equals the note count, a slice was reversed, there must be *one fewer* pair than notes.

### 1.3 Verify the numeric encoding

**✅ Checklist**

- ✅ All 14 seed notes produce 13 adjacent pairs.
- ✅ Every pair's second element is the *next* note in the original seed.
- ✅ You can translate `SEED[5]` back to a note name by hand without running code.

**🤔 Socratic Question(s)**

- The seed is in C major and every value stays in one octave. What changes about the observation pairs if you transposed the whole seed up an octave, the structure, or just the numbers? What does that say about where the "music" lives?
- `zip` pairs strictly adjacent notes, ignoring how long each note is held. Which real musical quality, phrase shape, for instance, is invisible to this model, and where in this project do you think it will show up first?

## Step 2: Learn the Markov chain

A Markov chain answers one question per note: "given the current note, what does the data say is likely next?" The composer's version stores every observed successor for each note in a `defaultdict` of lists, cheap, transparent, and inspectable, exactly like a frequency table you can read.

### 2.1 Build the transition table

**👟 Starter hint:** Write `build_chain(sequence)` that returns `{note: [successors]}` using a `defaultdict(list)`, then print the row for one note.

```python
# composer.py (continued)
from collections import defaultdict

def build_chain(sequence: list[int]) -> dict[int, list[int]]:
    chain: dict[int, list[int]] = defaultdict(list)
    for current, nxt in zip(sequence, sequence[1:]):
        chain[current].append(nxt)
    return chain

chain = build_chain(SEED)
print("after 64:", chain[64])
```

`chain[current].append(nxt)` says "when I last saw `current`, this time it was followed by `nxt`". Iterating over the pairs once builds the whole model, the table is, in effect, a frequency distribution per note, and `defaultdict(list)` means you never have to special-case a note that appears for the first time.

**🎯 Expected output:** `after 64: [62, 65, 62]`, the seed's `64` was followed by `62` a first time near the start, by `65` in the run-up to the peak, and by `62` again on the descent.

**🩹 If it's off:** If the row is `[]` or missing, `64` never appeared as a *current* note, check that you're building from `SEED`, not from an empty list. If a row lists dramatically wrong successors, the `zip` in `build_chain` pairs the wrong neighbors, print `list(zip(sequence, sequence[1:]))[:3]` and compare to the seed.

### 2.2 Add randomness with a seed

**👟 Starter hint:** Complete `generate_melody(chain, start, length)`, walk the chain, and when a note has no recorded successor, fall back to the starting note instead of crashing.

```python
# composer.py (continued)
def generate_melody(chain: dict[int, list[int]], start: int, length: int) -> list[int]:
    melody = [start]
    current = start
    for _ in range(length - 1):
        successors = chain[current]
        current = random.choice(successors) if successors else start
        melody.append(current)
    return melody

random.seed(7)
print(generate_melody(chain, MIDI["C4"], 8))
```

`random.choice` is what makes each run a *composer* instead of a recorder, the chain gives the alphabet (which notes may follow), and chance picks within it. The fallback `if successors else start` is the safety valve for notes that only ever ended phrases (like the final `C4`, which has no successor in the seed).

**🎯 Expected output:** A length-8 list starting at `60`, whose later elements are all drawn from `chain`'s successor pools, with `random.seed(7)` this project's output is reproducible, but change the seed and the melody changes legally.

**🩹 If it's off:** If `KeyError: ...` appears, a note reached the end of the melody without a fallback, the `else start` clause is missing or is being skipped because you indexed `chain[current]` with `[]` instead of `.get`. If the output never leaves one note, `successors` resolves to an empty list constantly, meaning the chain is built from the wrong input.

### 2.3 Verify the model really learned

**✅ Checklist**

- ✅ `build_chain(SEED)` produces one row per distinct note, each row listing only notes that really followed it in the seed.
- ✅ `generate_melody` runs with a fixed random seed and repeatedly with varying ones.
- ✅ Every generated note is a note the chain *could* legitimately produce, never an invented pitch.

**🤔 Socratic Question(s)**

- The chain only ever moves forward by one note, it has no memory of "two notes ago". What musical texture would be visible to a *second-order* chain (keyed on pairs) that the current one is blind to?
- `random.seed(7)` makes output reproducible. What is the *danger* of a composer that pretends every run must differ, and what does reproducibility buy you when you're trying to fix a melody you liked from an earlier run?

## Step 3: Give the melody a rhythm

The chain so far produces a stream of pitches with no timing. This step pairs each pitch with a duration in beats, so the piece stops being a machine-gun of equal notes and becomes a phrase a human could tap along to.

### 3.1 Model rhythm as beat durations

**👟 Starter hint:** Define a rhythm annotation as a list of beat-lengths, e.g. half, quarter, quarter, eighth pattern, and a helper to zip pitches with durations into note events.

```python
# composer.py (continued)
def make_phrase(melody: list[int], durations: list[float]) -> list[tuple[int, float]]:
    return list(zip(melody, durations))

phrase = make_phrase(SEED, [1.0, 1.0, 0.5, 0.5, 1.0, 1.0, 1.0, 1.0,
                            0.5, 0.5, 1.0, 1.0, 1.0, 2.0])
print(phrase[:3])
print("phrase spans", sum(d for _n, d in phrase), "beats")
```

Durations are measured in beats, the unit MIDI files actually store: `0.5` is an eighth, `1.0` a quarter, `2.0` a half note. `zip` rebuilds a melody into a list of `(pitch, beats)` events without touching pitch generation, and `sum` of all durations answers the obvious composer question, "how long is this phrase?", directly.

**🎯 Expected output:** `[(60, 1.0), (62, 1.0), (64, 0.5)]` and `phrase spans 13.0 beats` (the last note held a full 2 beats).

**🩹 If it's off:** If the phrase has a different number of items than the melody, the durations list is a different length, `zip` silently truncates to the shorter one, so assert `len(durations) >= len(melody)` early or the tail of the melody goes missing. If the sum looks wrong, check the `2.0` final duration actually landed on the last note.

### 3.2 Loop the phrase into a song structure

**👟 Starter hint:** Repeat the phrase a few times and `melodize` a whole song bar count, so the export step has an actual length to write.

```python
# composer.py (continued)
def make_song(phrase: list[tuple[int, float]], repeats: int, chain, start: int) -> list[tuple[int, float]]:
    song: list[tuple[int, float]] = []
    for _ in range(repeats):
        melody = generate_melody(chain, start, len(phrase))
        song.extend(make_phrase(melody, [d for _n, d in phrase]))
    return song

song = make_song(phrase, 4, chain, MIDI["C4"])
print(len(song), "notes =", sum(d for _n, d in song), "beats")
```

Reusing the same rhythm skeleton for each repeat is the classical way to get structural variety cheaply: the *timing* stays recognizable while the chain varies the pitches. Extending the song note-by-note with `list.extend` keeps the beat total exact, repeated four times, a 13-beat phrase is exactly 52 beats.

**🎯 Expected output:** `52 notes = 52.0 beats`, four copies of the phrase back to back, each with freshly generated (but chain-legal) pitches.

**🩹 If it's off:** If the song is 14 notes instead of 56, the loop body builds one phrase then exits, check `extend`, not `append`, so you accumulate rather than replace. If beats drift to 51 or 53, a generated melody returned a different length than `len(phrase)` and one `zip` truncated early.

### 3.3 Verify rhythm

**✅ Checklist**

- ✅ Phrases pair pitches with beat durations, and duration sums are exact.
- ✅ Multi-phrase songs repeat the rhythm skeleton while letting the melody chain vary.
- ✅ You can predict the total beat count of a song from its phrase and repeat count.

**🤔 Socratic Question(s)**

- Every repeat re-runs `generate_melody` with the same `len(phrase)`. What happens to the song's *length* if a melody ever generates one note more than the phrase, and why does `zip` with a fixed rhythm mask that bug completely?
- The rhythm is currently hard-coded as the seed's. Which note in `phrase` would you expect to land on strong versus weak beats, and what compositional effect does that emphasis have on a phrase that *starts* on the pickup note `D4`?

## Step 4: Stack chords underneath

A lone melody is a sketch; the piece gets its body from harmony. This step derives triads from the major scale, each chord is the scale's 1st, 3rd, and 5th step above a root, and layers them beneath the melody so the whole piece reads as song, not sine.

### 4.1 Build triads from scale degrees

**👟 Starter hint:** Define `scale` as an octave-spanning pitch list, and `triad(degree)` as `[scale[d], scale[d+2], scale[d+4]]` so the chord "walks up the white keys".

```python
# composer.py (continued)
SCALE = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 83]  # C4 up to B5

def triad(degree: int) -> list[int]:
    return [SCALE[degree], SCALE[degree + 2], SCALE[degree + 4]]

print(triad(0), triad(5), triad(3), triad(4))
```

`SCALE` spans two full octaves precisely so that `degree + 4` stays legal for every degree, no octave-wrap bookkeeping needed. Stacking three every-other scale steps produces the classic stack-of-thirds: `C` (`60,64,67`), `Am` (`69,72,76`), `F` (`65,69,72`), `G` (`67,71,74`). A single-octave list would truncate high chords like `Am` down by an octave, so the second octave is what makes the harmony real.

**🎯 Expected output:** `[60, 64, 67]`, `[69, 72, 76]`, `[65, 69, 72]`, `[67, 71, 74]`, the C, A-minor, F, and G triads of C major.

**🩹 If it's off:** Verify a wrong-looking triad by counting semitones from the root, `Am` must be `69, 72, 76` (A–C–E). If every chord lands in the *low* octave like `[69, 60, 64]`, `SCALE` is the single-octave 7-entry list, so `degree + 2` and `degree + 4` wrapped out of range. If every chord is small like `[60, 62, 64]`, you indexed `[d, d+1, d+2]` instead of skipping every other scale step.

### 4.2 Write a chord progression that fits the piece

**👟 Starter hint:** Choose a short degree progression, the classic `I–vi–IV–V` = degrees `[0, 5, 3, 4]`, and expand it across the song's repeated phrases, one chord per two beats.

```python
# composer.py (continued)
def chord_schedule(song: list[tuple[int, float]], progression: list[int]) -> list[list[int]]:
    chords: list[list[int]] = []
    beat = 0.0
    for _n, dur in song:
        degree = progression[int(beat) // 2 % len(progression)]
        chords.append(triad(degree))
        beat += dur
    return chords

chords = chord_schedule(song, [0, 5, 3, 4])
print(chords[0], chords[2], chords[28], chords[55])
```

`int(beat) // 2` slices the song into 2-beat windows, each window carries one chord, and the `% len(progression)` wraps the progression around the song's length. The result is per-note chord labels, which is exactly what the MIDI exporter will consume in Step 5. Note the honest simplification: a real arrangement holds one chord per *bar*, this project holds one per two beats, and the difference is audibly fine for a learning piece.

**🎯 Expected output:** `chords[0]` is the C triad `[60, 64, 67]`, `chords[2]` (which starts at beat 2.0, window 1) is `Am` `[69, 72, 76]`, `chords[5]` (starts at beat 4.0, window 2) is `F` `[65, 69, 72]`, and `chords[8]` (starts at beat 7.0, window 3) is `G` `[67, 71, 74]`, the full I–vi–IV–V turn in the song's first phrase.

**🩹 If it's off:** If a chord index prints a triad outside the progression's four, the `% len(progression)` wrap or the `// 2` windowing is off, recompute by hand for one entry: `chords[8]` starts at beat 7.0, so `int(7.0) // 2 = 3`, `3 % 4 = 3`, degree `4`, triad `G`. If all chords are identical, `progression` was passed as a single-element list.

### 4.3 Verify harmony

**✅ Checklist**

- ✅ Each degree yields a three-note triad stacks a third apart.
- ✅ The `[0, 5, 3, 4]` progression cycles cleanly across an entire song.
- ✅ Every note in the song has an assigned chord without holes.

**🤔 Socratic Question(s)**

- The chord follows a fixed 2-beat window regardless of what the melody is doing. Where in `chord_schedule` would you inject "only actually change the chord when the melody lands on a strong beat", and what musical congestion does that fix?
- All four chords come from one major scale, so every chord is "in key". If you allowed a *borrowed* chord (one accidental note outside `SCALE`), where would the model of Step 2 silently collapse, and why wouldn't the MIDI writer complain?

## Step 5: Export to a real MIDI file

Everything so far lives in Python lists. This step writes them into a genuinely playable `.mid` file with `midiutil`, using two tracks, melody then harmony, and verifies the file on disk so you know the export worked without needing to hear a note.

### 5.1 Lay the song into MIDI events

**👟 Starter hint:** Write `write_midi(song, chords, filename)` with an `addTempo`, a melody track at time 0, and a chord track that starts slightly later so it doesn't overlap the pickup.

```python
# composer.py (continued)
import os
from midiutil import MIDIFile

def write_midi(song: list[tuple[int, float]], chords: list[list[int]], filename: str = "song.mid") -> None:
    midi = MIDIFile(2)  # tracks 0 and 1: melody and chords
    tempo, volume = 120, 96

    melody_time = 0.0
    for note, dur in song:
        midi.addNote(0, 0, note, melody_time, dur, volume)
        melody_time += dur

    chord_time = 0.0
    for chord in chords:
        for note in chord:
            midi.addNote(1, 0, note, chord_time, 2.0, 48)
        chord_time += 2.0

    with open(filename, "wb") as f:
        midi.writeFile(f)

write_midi(song, chords, "song.mid")
print("wrote song.mid in", os.path.getsize("song.mid"), "bytes")
```

`MIDIFile(2)` creates tracks `0` and `1`, melody on 0, chords on 1, and `addTempo(0, 0, 120)` pins the tempo event to the same leading track. One quirk worth knowing: in format 1 the header track count is *`numTracks + 1`* because midiutil always counts a first tempo track, so the file itself will report `3` tracks even though the constructor said `2`, the verifier in 5.2 will confirm exactly that. `addNote(track, channel, pitch, time, duration, volume)` is then the entire translation surface: pitch, start time, and length in beats all map one-to-one from the earlier data structures. A quieter chord volume (`48` vs the melody's `96`) is the mixing decision that keeps a learning piece from turning into noise, and writing bytes with `writeFile` to an open file object is the whole export.

**🎯 Expected output:** `wrote song.mid in <a few thousand> bytes`, and the file exists in the project folder, openable by any MIDI-capable player or DAW.

**🩹 If it's off:** If `FileNotFoundError` or an empty file appears, the write path is wrong or `writeFile` never ran, confirm the `open(..., "wb")` context is the *one* place that writes. If a player reports a corrupt file, a note time went backward (a cumulative `+=` got dropped) and the track timeline is broken.

### 5.2 Verify the file is really a song

**👟 Starter hint:** Peek inside the `.mid`'s raw bytes, the header magic `MThd`, the header's track-count field, and the count of note-on status bytes, to confirm the export is a real, structured MIDI file and not random bytes wearing a `.mid` extension.

```python
# composer.py (continued)
def verify(midi_path: str = "song.mid") -> None:
    with open(midi_path, "rb") as f:
        data = f.read()
    n_tracks = int.from_bytes(data[10:12], "big")  # 'ntrks' header field
    note_ons = sum(1 for byte in data if (byte & 0xF0) == 0x90)
    print("is a MIDI file:", data[:4] == b"MThd")
    print("track count (header):", n_tracks)
    print("note-on events:", note_ons)

verify()
```

Every Standard MIDI File opens with the 4-byte magic `MThd`, so `data[:4]` is the single check that separates a real `.mid` from a renamed text file. MIDI is a byte-level protocol: a status byte in the `0x90–0x9F` range *is* a note-on message, so scanning `data` with `(byte & 0xF0) == 0x90` counts exactly the notes you wrote. The header's bytes 10–12 are the track count, which reads `3` because format 1 counts a leading tempo track on top of your two (`numTracks + 1`).

**🎯 Expected output:** `is a MIDI file: True`, `track count (header): 3` (tempo + melody + chords), and `note-on events: 224`, `len(song)` for the melody plus `3 * len(chords)` for the chords (56 + 168).

**🩹 If it's off:** If the header check fails, the file is not a MIDI file, check what got written under that name. If `note-on events` is short, chords or melody notes were dropped at write time; if it's *longer* than expected, a `0x90`-as-status byte slipped in from a tempo or program-change event and the header track count is the more reliable ground truth. If the track count isn't `3`, the export used a different `MIDIFile(...)` size than the reader assumes.

### 5.3 Verify the export

**✅ Checklist**

- ✅ `song.mid` exists, starts with `MThd`, reports 3 tracks in its header, and scans to the expected 224 note-on events.
- ✅ The melody track and chord track are separate, and their event counts match the structures Step 3 and Step 4 produced.
- ✅ The melody's beat span equals the song's computed beat total.

**🤔 Socratic Question(s)**

- The MIDI spec stores time in *ticks per quarter note*; midiutil picks a resolution for you. What change on the import side, a different DAW's tick resolution, for instance, could make a piece's tempo sound off even though `addTempo` says 120?
- 224 note events is a lot of writes for hand-tuned data. How would the `chord_schedule` function change if you wanted to *omit* the chord track entirely for a solo line, and what does your answer reveal about how coupled the two tracks are at `write_midi` time?

## ⚠️ Common pitfalls

- **Forgetting note 60 is middle C.** Building the `MIDI` table with a wrong `(octave - 4)` offset produces a perfectly legal composer that writes everything an octave off, and MIDI won't complain, only your ears will.
- **`zip` silently truncating.** `make_phrase(melody, durations)` with mismatched lengths drops notes without an error. Add an explicit length check when teaching the composer to pair pitches with timing.
- **A chain with no fallback for end notes.** The seed's final `C4` has no successor; without `if successors else start`, the generator throws `KeyError` on the very melody it's supposed to extend.
- **Overlapping chord windows.** If a chord is given a longer duration than its 2-beat window, chord events stride into the next window and the piece turns to mush, keep the chord duration an exact multiple of the window size.
- **Exporting without verifying the header.** A `.mid` that isn't really a MIDI file (missing `MThd`) will look "done" in the file tree and fail everywhere else. The four-byte header check is the single cheap verification that catches it.

## What you just built

A working statistical composer: it converts a hummed melody into numbers, learns a Markov model of note-to-note transitions, generates legal variations, lays a chord progression underneath, and writes the whole piece to a real MIDI file you can open and listen to. The transferable skill outlives the song: model sequences as frequency observations, generate within what you observed, and keep the model small enough to *read*, that pattern transfers to text, gestures, sensor feeds, and any other data that unfolds in time.

:::tip[Run a fuller version without any local setup]
[`examples/ai-music-composer/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/ai-music-composer) in the course repo is the whole composer as a notebook, from seed to a downloadable `song.mid`. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Where to go from here

- Upgrade to a *second-order* chain keyed on `(current, previous)` pairs, `chain[(60, 62)]`, and hear how the melodies gain phrases that actually repeat instead of merely wandering.
- Add a tempo-control CLI flag (`--tempo 90`) and a `--degree-progression "0 5 3 4"` argument so the same code writes waltz-like or driving pieces without edits.
- Extend the rhythm model to a Markov chain over durations too, so the generator chooses *when* a note starts as well as what pitch it is.
- Export a bass line one octave below the chord roots, then layer all three tracks, the first genuinely multi-textured arrangement this pipeline can produce.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓