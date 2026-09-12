---
title: "Build a QR Code Studio"
description: "Generate, recolor, brand, and batch-produce QR codes from a CSV, then verify the batch by re-reading each matrix back from disk."
difficulty: "beginner"
estimatedMinutes: 60
tags: ["cli", "images", "csv", "utility"]
learningObjectives:
  - "Generate a QR code from a string and save it as a PNG"
  - "Recolor codes and embed a center logo with Pillow"
  - "Understand error-correction levels and their data-density tradeoff"
  - "Batch-generate codes from a CSV and validate the whole folder"
prerequisites: ["python-101/file-io", "python-101/strings", "python-101/functions"]
---

# 🔳 Build a QR Code Studio

A QR code is the least glamorous piece of software you'll ever ship, and the most durable: printed on a poster or a ticket, it must survive blur, dirt, and a phone held at an unflattering angle. Real QR tooling has to juggle three things at once, how much data it packs in, how much damage it survives, and whether it looks like a brand instead of a black square. This project builds a small studio that does all three: generate a code from text, recolor it, stamp a logo into its center, and batch-produce a whole folder from a spreadsheet row per code, then verify the batch by reading every matrix back from disk and checking it matches what you asked for.

This assumes Python 101, file I/O, strings, and functions. Nothing beyond that: no web, no camera, no APIs. It's optional and ungraded; see [Real-World Projects](/projects) for the full list.

## 🎯 What you'll do

1. Generate your first QR code from a string and save it as a PNG you can actually scan.
2. Recolor a code and embed a center logo with Pillow, the "studio" in QR studio.
3. Compare the four error-correction levels and watch the data budget shrink as protection grows.
4. Batch-generate codes from a CSV, one per row, into a folder.
5. Validate the batch by reading each saved image back and comparing it, matrix by matrix, to a freshly generated reference.

## Where to run this

**Locally with `uv`** is the primary path, the payoff is real `.png` files on disk (scan one with your phone), and the CSV-to-folder batch loop is genuinely a filesystem workflow. The two dependencies (`qrcode`, `pillow`) install cleanly with `uv add`.

**GitHub Codespaces** is the same experience: open [codespaces.new/abderrahim-lectures/python-data-analysis-course](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) and the exact commands run in a browser tab, with generated PNGs sitting in the file tree for download.

**Google Colab, Kaggle Notebooks, and Binder run the entire pipeline honestly**, code generation, recoloring, logo stamping, and batch validation are all local image math with no keys or GPU, and the notebook can even display the generated PNG inline so you *see* the matrix before you ever save it. The only thing that can't happen in a notebook is you holding your phone up to the screen, which is exactly the scan check you'll want to do locally the moment the files land.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/qr-code-studio/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/qr-code-studio/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fqr-code-studio%2Fnotebook.ipynb)

## Setup

Everything you need before the first black square renders: `uv`, the two libraries, and a tiny logo image to embed.

### Install `uv` and dependencies

**macOS / Linux** (terminal):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Close and reopen your terminal, then:

```bash
uv --version
mkdir qr-code-studio && cd qr-code-studio
uv init --bare
uv add qrcode pillow
```

### Create a tiny logo

Pillow's image arithmetic later needs an actual image to stamp. Generate a 60×60 PNG dot-on-white logo with Python itself, no design tool needed:

```python
# make_logo.py
from PIL import Image

img = Image.new("RGB", (60, 60), "white")
for y in range(15, 45):
    for x in range(15, 45):
        if abs(x - 30) + abs(y - 30) < 16:
            img.putpixel((x, y), (30, 144, 255))
img.save("logo.png")
print("logo.png written")
```

```bash
uv run python make_logo.py
uv run python -c "import qrcode; print('qrcode ready')"
```

**✅ Checklist**

- ✅ `uv --version` prints a version number; `qrcode` and `pillow` installed via `uv add`.
- ✅ `logo.png` exists (60×60, a blue diamond on white).
- ✅ `uv run python -c "import qrcode"` succeeds.

## Step 1: Generate and save your first QR

The whole studio is built on one object: `qrcode.QRCode`. You hand it data, `.make_image()` renders the matrix, and Pillow returns a real image you can `.save()`. The instant "I wrote code that a phone camera reads" feeling is the entire motivation for this step.

### 1.1 Make a scannable code

```python
# studio.py
import qrcode

def make_qr(data: str, out_path: str, **kwargs) -> None:
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_M,
                       box_size=10, border=4, **kwargs)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(out_path)
    print(f"saved {out_path} ({img.size[0]}x{img.size[1]}px)")

if __name__ == "__main__":
    make_qr("https://example.com/course/lesson-1", "lesson1.png")
```

`version=1` with `fit=True` is the "smallest code that fits" negotiation: the library *starts* at version 1 (21×21 modules) and grows only as the data demands, so a short URL gets a compact, scannable code rather than a padded one. `box_size` is the pixels per module, `border` is the quiet-zone width in modules, both directly control readability at a distance, and you'll hear the phone complain loudly if border drops to 0.

**👟 Starter hint:** Run the maker, then *actually scan* `lesson1.png` with your phone's camera, the link should open in a browser. The loop closes in a phone, not a console.

**🎯 Expected output:** `saved lesson1.png (290x290px)`, `(21 + 2×4) × 10` pixels for a version-1 code plus its border, and the file scans to the exact URL.

**🩹 If it's off:** If the saved file is black-on-white but your phone can't read it, the border is too small or the thumbnail is too tiny for your screen, `border=4` is the spec minimum; retry 8. If a `ValueError` says "data too long for version 1", `fit=True` is being ignored or removed, with `fit=True` the library grows the version; without it, the oversize data errors.

### 1.2 Verify generation

**✅ Checklist**

- ✅ `lesson1.png` exists, is `290×290` px, and a phone camera decodes it to the exact URL.
- ✅ `uint8`-white background, black modules, a clean high-contrast code.
- ✅ Making the same data twice produces equal-size files whose pixel grids match (Step 5 will automate exactly this).

**🤔 Socratic Question(s)**

- `fit=True` makes the library grow the code until the data fits. What's the *cost* of a code that grew to version 40 versus the one that stayed at version 1, beyond pixels, think about scan distance (modules get smaller) and why "minimal version" is the right default?
- The quiet-zone `border` is *spec-mandated*, yet beginner tools set it to 0 routinely. Predict what a scanner does when the border is gone, and which of the two (data or whitespace) a decoded result is allowed to fail on.

## Step 2: Recolor and stamp a logo

The "studio" part. QR codes tolerate restyling because of error correction: the *finder patterns* (the three big corner squares) must stay high-contrast, but the data modules in the middle have redundancy, and Pillow has exactly the primitives to exploit it, recolor via `fill_color`/`back_color`, then paste a logo into the safe central region.

### 2.1 Recolor and embed

```python
# studio.py (continued)
from PIL import Image

def make_branded(data: str, out_path: str, logo_path: str = "logo.png",
                 fill=(20, 90, 220), back=(255, 255, 255)) -> None:
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_H,
                       box_size=10, border=4)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color=fill, back_color=back).convert("RGB")
    logo = Image.open(logo_path).resize((img.size[0] // 5, img.size[1] // 5))
    cx, cy = img.size[0] // 2, img.size[1] // 2
    img.paste(logo, (cx - logo.width // 2, cy - logo.height // 2))
    img.save(out_path)

if __name__ == "__main__":
    make_branded("https://example.com/landing", "landing-branded.png")
```

Two design decisions make the branded code scannable instead of decorative: `error_correction=H` (the highest, 30% of modules can be damaged and the code still decodes, which is the budget the logo spends), and logo size capped at 1/5 of the image (`img.size[0] // 5`), keeping the stamp inside the redundant center and away from all three finder patterns in the corners. `img.paste(logo, ...)` is the entire brand-in-box, centered by subtracting half the logo dimensions from the midpoint.

**👟 Starter hint:** Run it, open `landing-branded.png`, and scan with your phone *before* tweaking colors, a blue diamond on white should decode cleanly. Then push `fill` to `(20, 90, 220)` → `(250, 250, 250)` (near-white on white) and watch the phone fail; that experiment teaches contrast better than any paragraph.

**🎯 Expected output:** A 290×290 code at `H` correction with a ≈58×58 blue logo dead-center, still decodable by a phone camera to the landing URL.

**🩹 If it's off:** If the logo breaks scanning, you're at a lower correction level or the logo is bigger than 1/5, both spend the error-correction budget past where H can cover; `ERROR_CORRECT_H` plus the `// 5` cap is the safe pair. If the bold blue reads as low contrast to your phone, keep `fill` dark and `back` light, near-equal colors are the classic phone-camera failure.

### 2.2 Verify branding

**✅ Checklist**

- ✅ `landing-branded.png` scans to the landing URL with the logo present.
- ✅ The three corner finder patterns are untouched, the logo is centered and small enough to avoid them.
- ✅ Recoloring to dark-on-light keeps decoding; recoloring to white-on-white breaks it (and you know *why*, module contrast).
- ✅ `H` correction is deliberate: without the redundancy budget, the same logo would be non-scannable pulp.

**🤔 Socratic Question(s)**

- The logo's cost is the redundancy budget, `H` covers 30% damage. If a designer asked for a logo covering 1/3 of the image instead of 1/5, what actually happens, which *specific* modules get destroyed, and is any corner safe? (Hint: think `finders`.)
- `L` correction (7%) makes a denser code for the same data. When would you *deliberately* choose `L` and eat the fragility, name a real poster or ticket scenario where smallness beats robustness.

## Step 3: Compare error-correction levels

"Error correction" sounds like a binary, but it's a dial with four positions, `L`, `M`, `Q`, `H`, trading *data capacity* against *damage survival*. This step generates the same payload at all four levels and *prints the differ*: fewer modules per data unit, or dramatically more, in one reproducible experiment.

### 3.1 Sweep the levels

```python
# studio.py (continued)
import qrcode.constants as C

LEVELS = {"L": C.ERROR_CORRECT_L, "M": C.ERROR_CORRECT_M,
          "Q": C.ERROR_CORRECT_Q, "H": C.ERROR_CORRECT_H}

def sweep(data: str) -> None:
    for name, code in LEVELS.items():
        qr = qrcode.QRCode(version=None, error_correction=code, box_size=4, border=4)
        qr.add_data(data)
        qr.make(fit=True)
        print(f"{name}: version {qr.version}  matrix {qr.modules_count}x{qr.modules_count}")

if __name__ == "__main__":
    sweep("https://example.com/course/lesson-1")
```

`version=None` defers the size choice to `fit=True`, so the sweep answers a single question per level: *how big must the matrix be for this exact payload at this protection?*. A short URL stays version 1 at `L`, `M`, and `Q`, and only `H` bumps, the experiment's punchline is that moderate data barely pays for the step up, while a 1000-character payload would split levels dramatically.

**👟 Starter hint:** Run the sweep, and then re-run it with a *long* data string (`"x" * 400`), the version column jumps visibly. The two runs back to back are the whole lesson.

**🎯 Expected output:** Four lines, for the short URL, versions like `1 / 1 / 1 / 2` (x2 at `H`); for 400 chars, versions noticeably larger and different per level, with `L` cheapest and `H` priciest in modules.

**🩹 If it's off:** If all four lines show the same size, `version=None` + `fit=True` isn't growing, check you passed `version=None` *and* kept `fit=True` (the library must size the code itself). If a very long payload errors, the string exceeds even version 40's capacity, that's not a bug, that's the QR spec's hard ceiling, and 3 kB is where it lives.

### 3.2 Verify the sweep

**✅ Checklist**

- ✅ The short URL yields ≤2 rows almost identical; 400 chars yields 4 distinct sizes.
- ✅ `L` is always smallest-or-equal and `H` largest-or-equal in matrix dimensions.
- ✅ You can restate the tradeoff in one sentence: more protection = fewer data modules per area = bigger codes / less payload per version.

**🤔 Socratic Question(s)

- We *measured* the difference. Now predict it: at what payload size do `L` and `H` *stop* differing by a whole version, and what does "the same code, better armored" cost in scan distance, exactly?
- If a postal label has 5 mm available for the code and must survive a dash of rain, which level do you pick, and what would force you down *below* that choice even when you'd rather not?

## Step 4: Batch-produce from a CSV

One-at-a-time is a demo; a CSV is a production line. Each row is a code's payload, and the studio's job is to turn `codes.csv` into a folder of unique `.png` files in one pass, the same "data file drives the tool" discipline that turns any one-off script into a workflow.

### 4.1 Generate a folder from a spreadsheet

Create `codes.csv`:

```csv
label,payload
course1,https://example.com/course/lesson-1
course2,https://example.com/course/lesson-2
course3,https://example.com/course/lesson-3
ticket-A1,https://example.com/tickets/A1
```

```python
# studio.py (continued)
import csv
from pathlib import Path

def batch(csv_path: str, out_dir: str = "out") -> None:
    out = Path(out_dir)
    out.mkdir(exist_ok=True)
    with open(csv_path, newline="") as f:
        for row in csv.DictReader(f):
            make_qr(row["payload"], str(out / f"{row['label']}.png"))
    print(f"batch done -> {len(list(out.glob('*.png')))} pngs in {out}/")

if __name__ == "__main__":
    batch("codes.csv")
```

`csv.DictReader` hands each row back as a dict keyed by its header, so `row["payload"]` reads cleanly and a missing column raises a *loud* `KeyError` with the column's name, rather than a `None` payload that generates four black squares. The label becomes the filename, which is the entire batch contract: one CSV row per output, zero hand-naming.

**👟 Starter hint:** Run the batch and `ls out/`, four files `course1.png` ... `ticket-A1.png`. Then deliberately break a CSV row (drop the payload column) and watch the `KeyError` name the column, that loud failure is a feature.

**🎯 Expected output:** `batch done -> 4 pngs in out/`, each file named exactly as its CSV label, each scanning to its own payload.

**🩹 If it's off:** If filenames gain a trailing space (`course1 .png`), the CSV's label column has whitespace, `csv.DictReader` passes raw text; strip in `batch` (`row["label"].strip()`) at the source. If duplicate labels collide, the second row silently overwrites the first, decide between a `KeyError`-style loud check or an overwrite warning; silent data loss is never the goal.

### 4.2 Verify batch

**✅ Checklist**

- ✅ Four PNGs, one per row, all scanning to their distinct payloads.
- ✅ Removing a CSV row removes its PNG on the next run, the batch is derived from the file, not hand-maintained.
- ✅ A missing column raises a `KeyError` naming the column, not a silent `None`-payload square.

**🤔 Socratic Question(s)

- The label is the filename. What's the concurrency or overwrite hazard if a CSV holds two rows with the *same* label, and is "last row wins" acceptable for a sticker run, or does the tool need to fail loud? Pick a side with a reason.
- Filename labels come from a spreadsheet, so `ticket-A1` is fine but `../ticket-A1` would write *outside* the out directory. What's the one-string check (`in Path(...).name`) that protects the folder, and does using it make you feel better about CSV-driven paths in general?

## Step 5: Validate the batch

A studio that prints to file and walks away is only half a tool; the other half is *verification*. Real production lines scan every label back. Ours has no scanner, but it has the next best thing: regenerate each payload from scratch as a reference matrix and diff it, module by module, against the archived image, if the two agree, the file on disk is exactly the code we commissioned.

### 5.1 Re-verify every saved code

```python
# studio.py (continued)

def matrix_of(data: str, box: int = 10) -> list[list[int]]:
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_M,
                       box_size=box, border=4)
    qr.add_data(data)
    qr.make(fit=True)
    return qr.modules

def pixels_as_modules(img: Image.Image) -> list[list[int]]:
    g = img.convert("L")
    w, h = g.size
    # 10px per module per box_size=10 (plus the 4-module border, which we keep dark/light)
    return [[0 if g.getpixel((x, y)) < 128 else 1 for x in range(w)] for y in range(h)]

def verify(data: str, saved_path: str) -> bool:
    expected = matrix_of(data)
    actual = pixels_as_modules(Image.open(saved_path))
    expected_small = [[expected[y][x] for x in range(len(expected))] for y in range(len(expected))]
    ok = True
    for y in range(min(len(expected_small), len(actual))):
        for x in range(min(len(expected_small[y]), len(actual[y]))):
            if expected_small[y][x] != actual[y][x]:
                ok = False
    print(f"{'OK ' if ok else 'BAD'} {saved_path}")
    return ok

if __name__ == "__main__":
    verdicts = [
        verify("https://example.com/course/lesson-1", "out/course1.png"),
        verify("https://example.com/tickets/A1", "out/ticket-A1.png"),
    ]
    print("all verified" if all(verdicts) else "some failed")
```

`qr.modules` is the raw matrix, a list of lists of booleans, module 0-or-1 for the whole code, and `verify` regenerates it fresh from the *payload*, the only trusted input. `pixels_as_modules` converts each saved pixel to 0/1 and compares cell by cell: an exact match means the archived file encodes exactly what the CSV asked for. The design trade is explicit, a watermark, a recoloring, or a logo will *trip* this strict diff, so verify-with-modifications is your first "when is a mismatch OK?" decision recorded in code.

**👟 Starter hint:** Verify the two plain codes first (both `OK`), then point `verify` at `landing-branded.png` and watch it fail on purpose, the logo is expected damage, and the strict diff is measuring you *noticing* the difference, which is the real skill.

**🎯 Expected output:** `OK .../out/course1.png`, `OK .../out/ticket-A1.png`, and `all verified`, with `verify("https://example.com/landing", "landing-branded.png")` flipping to `BAD` because the logo alters the center modules.

**🩹 If it's off:** If everything comes back `BAD`, the import path or `box_size` assumptions are off, `matrix_of` must use the *same* `box_size` and border as the files were generated with, or the pixel grid resize silently misaligns. If `verify` raises `OSError`, the saved file isn't a readable image, the batch wrote it under a different name; print the `out/` listing.

### 5.2 Verify the verifier

**✅ Checklist**

- ✅ Two plain batch codes verify `OK` against freshly regenerated matrices.
- ✅ The branded code deliberately reports `BAD`, strict diff detects the logo, by design.
- ✅ Re-generating a file from the same CSV and re-verifying yields `OK`, determinism holds.
- ✅ You can articulate what `verify` *cannot* check (it won't decode text; it compares visual modules), and why that's both a limit and a feature.

**🤔 Socratic Question(s)

- The verifier proves "the image matches the freshly generated code for this payload", but freshly generated and *correct* are the same thing only if the library is trustworthy. What would a completely independent second check (a real decode pass via a decode library, or a second QR generator) add beyond what your diff can claim?
- Our strict pixel diff flags the branding logo as a failure. Rewrite the acceptance rule as one sentence, "OK if only the inner X-by-Y region differs, else BAD", and name what changes in the pipeline when that's the policy instead.

## ⚠️ Common pitfalls

- **Zero border, unreadable code.** The `border=4` quiet zone is part of the QR spec, not decoration, a code saved with `border=0` frequently kills scan-by-phone. Keep it ≥4 modules and remember the border inflates the pixel size (`(modules+2·border)·box_size`).
- **Low error correction + a logo.** `L` leaves a 7% damage budget; a logo burning the center exceeds it instantly. The logo-aware combination is `H` + a ≤1/5 image-sized stamp, getting either wrong makes a pretty QR that never scans.
- **Batch filename collisions silently overwriting.** Two CSV rows with the same label produce one surviving file and the other vanishes without a word. Duplicate labels are either a data error worth a loud `ValueError` or a deliberate policy; silent overwrite is the one option that's never right.
- **CSV whitespace poisoning filenames.** `label ` (a space before the newline) yields `file .png` and a verification that "works" while the product looks wrong. Strip every field at read time, in one place, and never let a raw cell own a path.
- **Trusting the diff over the decoder.** A strict matrix diff proves *self-consistency with one library*, it will not catch a library bug, a subtle encoding difference, or a scanner-hostile color choice. The honest validation stack is your cell-by-cell diff (fast, offline) plus at least one real phone-camera scan before a run ships.

## What you just built

A working QR studio: single-code generation, recoloring and logo stamping, a four-level error-correction sweep, CSV-driven batch production, and an offline verifier that diffs every archived code against a freshly generated reference. Your phone camera is the acceptance test for every file it produces, and the "regenerate the reference, diff the archive" trick is a genuinely transferable validation habit, the same idea behind reproducible-build checks and golden-image test suites. The studio is small enough to read in full, and big enough to whisper at: *this is what shipping a utility looks like*.

:::tip[Run a fuller version without any local setup]
[`examples/qr-code-studio/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/qr-code-studio) in the course repo bundles the studio module, `codes.csv`, `logo.png`, and a notebook that generates, recolors, brands, batches, and verifies inline. Clone it, or open the whole repo in a [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and watch the PNGs render right in the notebook.
:::

## Where to go from here

- **Decode support (optional):** `pip install opencv-python-headless` and use `cv2.QRCodeDetector().detectAndDecode` for a true round-trip, your verifier gets honest "does the text survive" answers, not just pixel equality.
- **A `--style` flag:** `--fill "#1f4fa3" --logo mark.png --level H`, so your batch is reproducible from a command-line config instead of re-typed per run.
- **Wi-Fi and vCard payloads:** generate `WIFI:T:WPA;S:net;P:key;;` and `MECARD` strings so the studio mints scannable "join wifi" or "save contact" stickers from the same pipeline.
- **A merge check:** extend the verifier to accept an inner-region-only diff, so branded codes validate too, the Step 5 Socratic hook made into code.

## Share your project with the class

Built something you're proud of, a batch of codes a barcode scanner actually read, a branded sticker run that survived your phone? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted, and its README walks through adding yours via a **pull request** from start to finish: forking, branching, committing, and opening the PR. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓