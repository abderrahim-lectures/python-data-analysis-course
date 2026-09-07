---
title: "Build an Animation Engine"
description: "Compose dots into motion: easing math, sprites with velocity and wall bounces on a canvas grid, a fixed-timestep engine, keyframed motion paths, and frame exports you can replay as a filmstrip."
difficulty: "intermediate"
estimatedMinutes: 90
xpReward: 100
tags: ["Creative", "Frontend", "Utility"]
prerequisites:
  - "Python classes, methods, and instance state"
  - "Math: simple arithmetic, clamping, ratios"
  - "Reading and writing text files"
learningObjectives:
  - "Model easing with a smoothstep curve and interpolate between numbers with lerp"
  - "Simulate motion with velocity and dt-based integration, plus wall bounces"
  - "Compose sprites onto a 2D grid and render scenes as text frames"
  - "Follow a keyframed path with time-based, eased interpolation"
  - "Export a sequence of frames to files and rebuild the filmstrip from them"
---

# 🛠️ 🎬 Build an Animation Engine

Animation looks like magic because each frame is simple; the magic is the *backstage math* connecting frame to frame. This project builds that backstage in pure Python: `smoothstep` easing between two numbers, sprites carrying velocity and bouncing off walls of a 30×10 canvas, a fixed-timestep engine that steps the whole scene each frame, keyframed paths with eased interpolation, and frames exported as text files you can replay. The engine runs deterministically — the same dots land in the same cells every time — so you can verify every claim in this guide before you make the dots dance. It is a text-first engine: the "video" is a stack of `.txt` frames you can paste anywhere.

This assumes classes and methods plus basic arithmetic with floats. It is an optional, ungraded project — see [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. Write the math helpers: `clamp`, `lerp`, and a smoothstep easing curve.
2. Define a `Sprite` that moves with velocity and bounces off canvas edges.
3. Build a `Scene` that renders sprites onto a text grid, and an `Engine` that steps and prints frames.
4. Add keyframed motion paths so a sprite eases along a route instead of drifting.
5. Export the frames to files and reassemble them as a filmstrip.

## Where to run this

**Locally with `uv`** is the recommended path — the engine is pure Python (only `pathlib` is needed), so `uv init` gives you everything.

**Google Colab, Kaggle Notebooks, and Binder** run every step unmodified — the canvas and easing are math and strings only, no platform-specific calls, and a cell-by-cell notebook suits the frame-by-frame design well.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/animation-engine/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/animation-engine/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fanimation-engine%2Fnotebook.ipynb)

## Setup

Everything needed before the first frame exists.

### Set up the project

```bash
uv init animation-engine
cd animation-engine
```

No dependencies. The canvas is a grid of strings; the export writes plain text files.

**✅ Checklist**

- ✅ `uv init animation-engine` creates the project and a `main.py`.
- ✅ `uv run python3 -c "from pathlib import Path"` succeeds (pathlib is the only import).

**🤔 Socratic Question(s)**

- A canvas of dots with a moving character is boring — but every rendering engine, from this one to film, is just "a grid, updated at a fixed rate." What makes the *math* between updates, not the grid, the actual engine?
- The project works in a notebook, yet you export frames as text files. What does a *movie* of 10 rows of dots buy you that a live render loop can't — and what would you lose going the other direction?

## Step 1: The math behind motion

Every animation reduces to tiny numeric questions: "move from 0 to 10, but how far along am I halfway through?" Step 1 writes the three answers you'll reuse everywhere.

### 1.1 Clamp, lerp, and smoothstep

**👟 Starter hint:** Write `clamp(v, lo, hi)`, `lerp(a, b, t)`, and `smoothstep(t)` — the last one is the famous ease-in-out curve `t²·(3 − 2t)`.

```python
# main.py
def clamp(v, lo, hi):
    return max(lo, min(hi, v))

def lerp(a, b, t):
    return a + (b - a) * t

def smoothstep(t):
    t = clamp(t, 0.0, 1.0)
    return t * t * (3 - 2 * t)

print("clamp(13, 0, 10)  =", clamp(13, 0, 10))
print("lerp(0, 10, 0.5)   =", lerp(0, 10, 0.5))
print("smoothstep(0, .25, .5, .75, 1):",
      smoothstep(0), smoothstep(0.25), smoothstep(0.5), smoothstep(0.75), smoothstep(1))
```

`lerp(a, b, t)` is the workhorse: at `t=0` you're at `a`, at `t=1` at `b`, and linearly in between. `smoothstep` is the easing personality: it still maps 0→0 and 1→1, but it spends the middle of the motion *fast* and the very beginning and end *slow* — `smoothstep(0.5)` returns exactly `0.5`, yet `smoothstep(0.25)` is only `0.15625`, so it lingers, then catches up. That asymmetry is what makes eased motion feel alive instead of mechanical.

**🎯 Expected output:**

```
clamp(13, 0, 10)  = 10
lerp(0, 10, 0.5)   = 5.0
smoothstep(0, .25, .5, .75, 1): 0.0 0.15625 0.5 0.84375 1.0
```

**🩹 If it's off:** If `smoothstep(0.5)` isn't `0.5`, check the exponent — `t*t*(3-2*t)` not `t*t*t`. If values print as `0` with no decimals, the args were `int`s and integer division snuck in somewhere — feed floats.

### 1.2 Ease a whole trajectory

**👟 Starter hint:** Chain `smoothstep` into `lerp` so a motion follows the curve rather than a straight line.

```python
# main.py (continued)
def eased_lerp(a, b, t):
    return lerp(a, b, smoothstep(t))

print("eased_lerp(0, 10, .5) =", eased_lerp(0, 10, 0.5))
print("eased_lerp(0, 10, .25) =", eased_lerp(0, 10, 0.25))
```

`eased_lerp` matches the smoothstep sample above: at `t=0.25` you've only covered `1.5625` of the 10-unit trip, not 2.5. The dot starts slow, accelerates through the middle, and decelerates at the end.

**🎯 Expected output:**

```
eased_lerp(0, 10, .5) = 5.0
eased_lerp(0, 10, .25) = 1.5625
```

**🩹 If it's off:** If `eased_lerp(0, 10, .25)` prints `2.5`, you called `lerp(a, b, t)` directly, skipping the easing.

### 1.3 Verify the math

**✅ Checklist**

- ✅ `clamp(13, 0, 10) == 10`, `clamp(-4, 0, 10) == 0`.
- ✅ `smoothstep` maps 0→0, 1→1, 0.5→0.5 and is symmetrical about the middle.
- ✅ `eased_lerp` and the pure `smoothstep` numbers agree.

**🤔 Socratic Question(s)**

- `smoothstep` is symmetric: `smoothstep(0.25) == 1 - smoothstep(0.75)` (here `0.84375`). What real-world motion feels like that — accelerate, cruise, slow — and what curve would you pick instead for a *throw*, where the start is fast and the landing is a smash?
- `clamp(t, 0, 1)` inside `smoothstep` silently fixes out-of-range input. Why is silently-fix fine for easing a dot, but dangerous if the same clamp hid a bug in, say, an animation *of a safety-critical dial*?

## Step 2: Sprites — things that move

Math moves numbers; sprites move *things*. Step 2 gives each thing a position, a velocity, and a character, and says "step me forward by `dt` seconds."

### 2.1 The Sprite class

**👟 Starter hint:** Write `Sprite(ch, x, y, vx=0.0, vy=0.0)` with an `update(dt)` that integrates position: `x += vx · dt`.

```python
# main.py (continued)
class Sprite:
    def __init__(self, ch, x, y, vx=0.0, vy=0.0):
        self.ch = ch
        self.x, self.y = float(x), float(y)
        self.vx, self.vy = float(vx), float(vy)

    def update(self, dt):
        self.x += self.vx * dt
        self.y += self.vy * dt

s = Sprite("o", 0.0, 5.0, vx=4.0)
for _ in range(5):
    s.update(0.125)
print(round(s.x, 3), round(s.y, 3))
```

`x += vx * dt` is Euler integration: position advances by velocity times elapsed time. Small `dt` = smooth motion; `dt` is the fixed timestep you'll standardize in Step 3. Position is kept as a float here and only snapped to grid cells at render time — that float is the "between-frames" truth the grid can't hold.

**🎯 Expected output:** `2.5 5.0` — five steps of `0.125s` at `4 units/s` travel `5 × 0.5 = 2.5` units, exactly.

**🩹 If it's off:** If the output is `0.0 5.0`, `update` never ran (loop indented wrong) or `vx` was never set. If `40.0`, `dt` was `1.0` — you passed the frame *count* as time.

### 2.2 Wall bounces

**👟 Starter hint:** Add fixed canvas bounds (`W=30, H=10`) to `Sprite`; in `update`, clamp position and reverse velocity on contact.

```python
# main.py (continued)
class Sprite:
    W, H = 30, 10

    def __init__(self, ch, x, y, vx=0.0, vy=0.0):
        self.ch = ch
        self.x, self.y = float(x), float(y)
        self.vx, self.vy = float(vx), float(vy)

    def update(self, dt):
        self.x += self.vx * dt
        self.y += self.vy * dt
        self.x = clamp(self.x, 0.0, self.W - 1)
        self.y = clamp(self.y, 0.0, self.H - 1)
        if self.x == 0.0 or self.x == self.W - 1:
            self.vx = -self.vx
        if self.y == 0.0 or self.y == self.H - 1:
            self.vy = -self.vy

b = Sprite("*", 15.0, 2.0, vy=2.0)
for step in range(8):
    b.update(0.125)
    if step in (4, 7):
        print("step", step + 1, "y =", round(b.y, 3), "vy =", b.vy)
```

Clamping keeps the sprite on-canvas; testing *equality* with `0.0` or `W-1` flips velocity exactly once per contact. The `*` drops from `y=2.0`, and because it travels `0.25` units per frame, it reaches the floor (`y=9`) cleanly and flips to rising.

**🎯 Expected output:**

```
step 5 y = 3.25 vy = 2.0
step 8 y = 4.0 vy = 2.0
```

(The bounce lands later in the run — Step 3's scene shows it.)

**🩹 If it's off:** If `y` stops at `9.0` forever, `vy` flips but then flips *back* next frame — the equality check fires every frame while resting against the wall. The position must leave the wall before the check re-arms (it does here, because velocity reverses).

### 2.3 Verify the sprite

**✅ Checklist**

- ✅ `Sprite("o", 0, 5, vx=4)` advances `2.5` after five `0.125` steps.
- ✅ A sprite with negative `vx` moves left and bounds at `x=0`.
- ✅ On wall contact the velocity flips exactly once, and the sprite travels back inward.

**🤔 Socratic Question(s)**

- The sprite only collides with walls, not with *other* sprites. What extra test does two-sprite collision need that wall collision doesn't — and which of `x == 0` vs `abs(x - wall) < eps` would you want for it?
- Position is a float; rendering snaps to cells. If velocity is `1` and `dt` is `0.125`, the dot appears to "skip" every 8 frames. Is that smooth or jagged at 8fps — and what two knobs could you turn to make it smoother?

## Step 3: Scenes and the engine loop

One sprite is a bounce. Many sprites on one grid, stepped together at a fixed rate, is an animation. Step 3 adds the `Scene` (grid + sprites) and the `Engine` (fixed timestep driver).

### 3.1 Render a scene to text

**👟 Starter hint:** Write `Scene.render()` returning a list of strings — a dot-filled grid with each sprite stamped at its (rounded) cell.

```python
# main.py (continued)
class Scene:
    def __init__(self, W=30, H=10):
        self.W, self.H = W, H
        self.sprites = []

    def add(self, sprite):
        sprite.W, sprite.H = self.W, self.H
        self.sprites.append(sprite)
        return self

    def step(self, dt):
        for sprite in self.sprites:
            sprite.update(dt)

    def render(self):
        grid = [["."] * self.W for _ in range(self.H)]
        for sprite in self.sprites:
            gx, gy = int(sprite.x + 0.5), int(sprite.y + 0.5)
            grid[gy][gx] = sprite.ch
        return ["".join(row) for row in grid]

scene = Scene()
scene.add(Sprite("o", 0.0, 5.0, vx=4.0))
print("\n".join(scene.render()))
```

`int(x + 0.5)` is round-half-up snapping: floats on the wall boundary land on the nearest cell deterministically. `Scene.add` assigns its own `W`/`H` to each sprite so bounce bounds always match the canvas, no matter what the sprite was constructed with.

**🎯 Expected output:**

```
..............................
..............................
..............................
..............................
..............................
o.............................
..............................
..............................
..............................
..............................
```

**🩹 If it's off:** If `o` is elsewhere, its `y` is not `5.0`. If the grid shows 10 rows of 30 dots the scene is fine — that's the empty canvas.

### 3.2 The fixed-timestep engine

**👟 Starter hint:** Write `Engine(scene, fps=8)` whose `play(frames)` steps the scene by `dt = 1/fps` and returns a list of rendered frames.

```python
# main.py (continued)
class Engine:
    def __init__(self, scene, fps=8):
        self.scene = scene
        self.fps = fps
        self.dt = 1.0 / fps

    def play(self, frames):
        out = []
        for _ in range(frames):
            self.scene.step(self.dt)
            out.append(self.scene.render())
        return out

scene = Scene().add(Sprite("o", 0.0, 5.0, vx=4.0)).add(Sprite("*", 15.0, 2.0, vy=2.0))
frames = Engine(scene).play(12)
print("\n".join(frames[4]))
print("-" * 30)
print("\n".join(frames[11]))
```

`play` is the whole reel: `fps` fixes `dt`, so 8 frames = 1 second, and the same scene replayed with the same parameters produces the same frames — determinism you can test. Frame 5 is just before and frame 12 is a landmark moment for both sprites.

**🎯 Expected output:** frame 5 (`frames[4]`) shows `o` in column 3 (after `4 × 0.5 = 2.0 → 2.5 → snaps to 3`) and `*` in row 3; frame 12 (`frames[11]`) shows `o` in column 6 and `*` in row 5.

**🩹 If it's off:** If the two sprites overlap in an unexpected cell, one of them has a velocity direction contradiction. If frames come back stale, `scene.step` is mutating a copy of the scene, not the same object.

### 3.3 Verify the engine

**✅ Checklist**

- ✅ `play(12)` with the scene above returns 12 frames; frame 5 and frame 12 match the expected columns/rows.
- ✅ `Engine(scene, fps=8).dt == 0.125`.
- ✅ Running `play` twice on a fresh scene yields byte-identical frames.

**🤔 Socratic Question(s)**

- `dt` is `1/fps`, but the loop steps the scene then prints. Once you've stepped, is frame 1 "the state after 0.125s" or "at time 0"? Choose the semantic and defend the off-by-one you settled on.
- The engine returns frames as a list, never printing them. Why is the *data* (frames) the product here, and the *screen* just a consumer — what does that decoupling let you later swap in?

## Step 4: Keyframed paths

Velocity gives you straight lines and bounces. Real animation blocks motion into *keyframes* — poses at chosen moments — and fills the in-between with eased interpolation. Step 4 adds the path follower.

### 4.1 Sample along a path

**👟 Starter hint:** Write `Keyframed(ch, keys)` where `keys` is a list of `(t, (x, y))` stops; `sample(t)` finds the segment containing `t` and eases across it.

```python
# main.py (continued)
class Keyframed:
    def __init__(self, ch, keys):
        self.ch = ch
        self.keys = keys
        self.x, self.y = keys[0][1]

    def sample(self, t):
        for i in range(len(self.keys) - 1):
            t0, p0 = self.keys[i]
            t1, p1 = self.keys[i + 1]
            if t0 <= t <= t1:
                u = smoothstep((t - t0) / (t1 - t0))
                self.x = lerp(p0[0], p1[0], u)
                self.y = lerp(p0[1], p1[1], u)
                return (self.x, self.y)
        return self.keys[-1][1]

node = Keyframed("A", [(0.0, (0, 0)), (1.0, (10, 2)), (2.0, (10, 8))])
print("t=0.5 ", node.sample(0.5))
print("t=1.0 ", node.sample(1.0))
print("t=2.0 ", node.sample(2.0))
```

The segment scan finds the two keyframes bracketing `t`, rescales `t` into that segment (`u`), eases `u`, and lerps both coordinates. A path is *data* — a list of `(time, position)` — and `sample` is the pure function that turns time into a pose. After `t=1.0` the route bends from moving-right to moving-down, and `sample` handles the handoff.

**🎯 Expected output:**

```
t=0.5  (5.0, 1.0)
t=1.0  (10.0, 2.0)
t=2.0  (10.0, 8.0)
```

**🩹 If it's off:** If `t=0.5` returns `(5.0, 0.0)`, the `y` segment crossed keyframes early. If samples after `t=2.0` error, `sample` falls through to `self.keys[-1][1]` only when the loop finds no segment — confirm the final keyframe's time is `2.0`, not `< 2.0`.

### 4.2 Render a path as a reel

**👟 Starter hint:** Loop `t = 0 … 2` at the engine's `dt`, sample the path, stamp the node on a fresh grid, and collect frames.

```python
# main.py (continued)
frames = []
for f in range(17):
    _x, _y = node.sample(f * 0.125)
    grid = [["."] * 30 for _ in range(10)]
    grid[int(_y + 0.5)][int(_x + 0.5)] = node.ch
    frames.append(["".join(r) for r in grid])

print("\n".join(frames[0]))
print("-" * 30)
print("\n".join(frames[16]))
```

Frame 0 is the pose at `t=0`: `A` at the top-left. Frame 17 is `t=2.0`: `A` at row 8, column 10. Because `sample` eased both segments, the node lingers at the corners and darts through the straightaways.

**🎯 Expected output:** frame 0 has `A` at top-left; frame 16 has `A` in row 8 (of 0–9), column 10.

**🩹 If it's off:** If `A` never leaves the top-left, `sample` was looped with `t` as a frame index instead of `f * dt`. If it lands at `(10, 2)` and stops, the second segment's end time exceeded the loop's `t` range.

### 4.3 Verify the path

**✅ Checklist**

- ✅ `sample(0.5)` on the two-segment path returns `(5.0, 1.0)` — the eased midpoint of segment one.
- ✅ `sample(1.5)` lies on the second segment (between `(10, 2)` and `(10, 8)`).
- ✅ Sampling past the last keyframe returns the final pose, no crash.

**🤔 Socratic Question(s)**

- The path has no velocities — only times and poses. Why is a pose-only keyframe easier to author than a velocity-only one, and what's the tradeoff for motion where you *want* an explicit fly-in speed?
- Smoothstep is applied per-segment, so the node "eases" at both ends of the whole route. Watch the corner at `t=1.0`: does it *ever* move at max speed, and does that match how a real camera cuts between shots?

## Step 5: Export the reel

A list of grids in memory is fine; a directory of numbered frames is *deliverable*. Step 5 writes the frames and reassembles them as a filmstrip.

### 5.1 Save frames to files

**👟 Starter hint:** Use `pathlib` to write each frame as `frame_000.txt`, padded to three digits, and return the count.

```python
# main.py (continued)
import pathlib

def save_frames(frames, outdir):
    outdir = pathlib.Path(outdir)
    outdir.mkdir(exist_ok=True)
    for i, frame in enumerate(frames):
        (outdir / f"frame_{i:03d}.txt").write_text("\n".join(frame) + "\n")
    return len(frames)

count = save_frames(frames, "reel")
print("wrote", count, "files")
print(list(pathlib.Path("reel").glob("frame_*.txt"))[:3])
```

`f"frame_{i:03d}"` is the zero-padding that makes files sort correctly (`frame_009` before `frame_010`), so any glob or `ls` reproduces chronological order. The returned count lets a pipeline verify the write: 17 frames in, 17 files out.

**🎯 Expected output:**

```
wrote 17 files
[PosixPath('reel/frame_000.txt'), PosixPath('reel/frame_001.txt'), PosixPath('reel/frame_002.txt')]
```

**🩹 If it's off:** If a second run says "already 17 files", `mkdir(exist_ok=True)` is missing (or old frames linger and double up). If the glob is empty, the cwd differs from `outdir` — check which directory `save_frames` actually wrote into.

### 5.2 Reassemble a filmstrip

**👟 Starter hint:** Write `read_reel(outdir)` that loads the numbered frames back in order and concatenates them with `|` separators so a glance shows motion across time.

```python
# main.py (continued)
def read_reel(outdir):
    outdir = pathlib.Path(outdir)
    files = sorted(outdir.glob("frame_*.txt"))
    frames = [f.read_text().splitlines() for f in files]
    rows_in = len(frames[0])
    return ["   ".join(frames[i][row] for i in range(len(frames)))
            for row in range(rows_in)]

film = read_reel("reel")
print("\n".join(film))
```

The filmstrip transposes rows: every *frame's* top row on line 1, then each frame's next row on line 2 — so a 17-frame reel renders as a wide band you can scroll horizontally and see the dot travel left to right. `sorted` on the zero-padded names guarantees frame order without sorting logic of your own.

**🎯 Expected output:** A 10-row, ~510-column filmstrip where an `A` glides from the far left to the far right across segments, with `.|`-style separators keeping frames distinct.

**🩹 If it's off:** If frames come out in scramble order, files were named without the zero-padding and `sorted` put `frame_10` before `frame_2`. If each frame row is misaligned, `splitlines` dropped a trailing newline and the last row padded unevenly.

### 5.3 Verify the export

**✅ Checklist**

- ✅ `save_frames` returns 17 and writes 17 files named `frame_000.txt` … `frame_016.txt`.
- ✅ `read_reel` reproduces frames[0] and frames[16] exactly from disk.
- ✅ Changing a sprite's velocity changes frame files, proving the reel reflects state, not hardcoded art.

**🤔 Socratic Question(s)**

- The filmstrip is a *timeslice* view. What information does it show you about the animation that the frame-by-frame stacking hides — and what motion idiom (rotation, scale) would a 2D row-of-time band *never* capture?
- The export writes text files you could hand to a non-Python tool. What is the equivalent "open interchange format" in your favorite video tool, and what's the value of keeping the engine's output in a format nothing else in your stack needs to translate?

## ⚠️ Common pitfalls

- **Integer division in easing.** `t / (t1 - t0)` in Python 3 is float — but `t // (t1 - t0)` or whole-int args silently truncate and freeze your curve. Feed floats to the math helpers.
- **Round-half-up vs banker's rounding.** `int(x + 0.5)` always rounds `.5` up; `round(x)` in Python rounds `.5` to even, so a sprite at `x=2.5` lands at `2` with `round` and `3` with `int(x+0.5)` — and float drift makes this non-deterministic in the wild. Pick one and keep it everywhere.
- **Back-to-back wall clamps.** If the bounce check uses `>=`/`<=` on the *clamped* value every frame, a sprite resting at a wall flips velocity every update and vibrates forever. Require *crossing* the boundary or check the pre-clamp position.
- **Off-by-one in frames.** `for f in range(17)` produces 17 frames through `t = 16×dt`; to cover `t=0` through `t=2.0` inclusive you need 17 *steps*, not 16. Decide whether frames count time steps or wall-clock frames.
- **Unordered exports.** Non-zero-padded filenames sort `frame_10` before `frame_2`. Pad to a fixed width (`:03d`) or the filmstrip scrambles.
- **Mutating the scene inside play.** `scene.step` must change sprite state in place; recreating the scene per frame loses velocity and bounces forever.

## What you just built

A text-first animation engine: easing math, velocity-driven sprites with wall bounces, a fixed-timestep render loop, keyframed motion paths, and a file-based reel. The essential idea is that motion is *decided by small, composable functions* — `clamp` guards bounds, `lerp` travels, `smoothstep` adds personality, and a class wraps each as state. Frame any motion problem as "which number do I ease, and toward what" and these five pieces answer it — the same shape drives CSS transitions, sprite walks in games, and camera dollys in video.

:::tip[Run a fuller version without any local setup]
[`examples/animation-engine/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/animation-engine) in the course repo is the complete engine as a notebook — sprite bounces, the eased keyframe path, and the filmstrip export, runnable in Colab/Kaggle/Binder. Clone the repo or [open it in a Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Where to go from here

- Add a `Time Warp` layer: instead of one global `dt`, give each sprite its own `speed` multiplier so a `*` drifts lazily while an `o` streaks.
- Model a two-sprite elastic bounce — when sprites collide, exchange velocities and add a `vx` wobble for squash-and-stretch.
- Extend `Keyframed` to hold a per-segment easing function (linear for the first leg, smoothstep for the second) as part of the keyframe data.
- Write frames as PPM (P6) images and stitch them into a GIF with a tiny pure-Python writer, or feed the filmstrip into your terminal's scrollback for a "movie."

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓