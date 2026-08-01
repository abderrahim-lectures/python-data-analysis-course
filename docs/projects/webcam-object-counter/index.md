---
id: 2027-webcam-object-counter
title: "Count Objects in Real Time with a Webcam"
sidebar_label: "Webcam Object Counter"
slug: /projects/webcam-object-counter
description: "Count objects live from a webcam feed with OpenCV and a pretrained YOLO11n model — or run the same detection on a bundled sample image or video with no camera at all."
---

import ProjectProgressCheckbox from '@site/src/components/ProjectProgressCheckbox';
import ProjectPublishedDate from '@site/src/components/ProjectPublishedDate';
import ProjectGreeting from '@site/src/components/ProjectGreeting';
import {StepChecklist, StepChecklistItem} from '@site/src/components/StepChecklist';

# 🌍 Count Objects in Real Time with a Webcam

<ProjectPublishedDate projectId="2027-webcam-object-counter" />

<ProjectGreeting />

This project assumes you're comfortable with Python 101 — functions, loops, and installing packages — and needs no prior data-analysis or machine-learning background. It's this course's first foray into computer vision: instead of loading a pretrained model that reads text or tabular rows, you'll load one that reads pixels, and use it to answer a genuinely practical question in real time — "how many of *this* are in front of the camera right now?"

This is optional and ungraded. See [Real-World Projects](/docs/projects) for the full, growing list.

## 🎯 What you'll do

1. **Set up** a local project with `uv`, OpenCV, and a pretrained object-detection model.
2. **Run** detection on a single bundled sample image and **draw** bounding boxes around what it finds.
3. **Count** objects of one target class (e.g. `person`) and **print** a running total.
4. **Process** a short bundled sample video frame-by-frame.
5. **Apply** the same detection loop to your own webcam for live, real-time counting.

## Where to run this

**Locally with `uv` is the only way to get the full, live-webcam experience.** A physical webcam attached to your computer is hardware — there is no route from a browser tab running in the cloud to a camera sitting on your desk. Steps 1–5 below assume this path, and Step 5 specifically will simply not work anywhere else.

- **GitHub Codespaces** gets you a zero-setup cloud dev environment (Node, Python, and `uv` already installed — see [`.devcontainer/devcontainer.json`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/.devcontainer/devcontainer.json)), and Steps 1–4 (sample image, counting, sample video) work fine there. Step 5 will not — a Codespace runs on a remote server with no access to your local webcam either.
- **Google Colab, Kaggle Notebooks, or Binder** are good for the **sample-image-only** variant of this project, not the live webcam. A real, runnable notebook that downloads the bundled sample images and runs the same detection code lives at [`examples/webcam-object-counter/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/webcam-object-counter/notebook.ipynb). Click a badge to launch it directly:

  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/webcam-object-counter/notebook.ipynb)
  [![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/webcam-object-counter/notebook.ipynb)
  [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fwebcam-object-counter%2Fnotebook.ipynb)

  Be honest with yourself about what this gets you: sample-image detection only, not a live camera feed. It's a genuinely good way to see the model work with zero install, but it is not the same project as Step 5.

## Setup

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

Then set up the project:

```bash
uv init webcam-object-counter
cd webcam-object-counter
uv add opencv-python ultralytics
```

No API key is needed anywhere in this project — detection runs fully locally, no external service involved. Be mindful of size, though: `opencv-python` and `ultralytics` (which pulls in PyTorch) are a real download — expect this `uv add` to take a few minutes and a few hundred megabytes of disk space the first time.

:::tip[Two ways to detect objects — pick the one that fits]
OpenCV ships **Haar cascades** built in — small, fast, no extra download, but narrow: each cascade is trained for one specific thing (the classic example is `haarcascade_frontalface_default.xml` for frontal faces) and works best on a fairly clean, front-facing view. This project instead uses **YOLO11n** via the `ultralytics` package — a small (a few megabytes) but genuinely modern object-detection model, pretrained on the COCO dataset's 80 everyday object classes (person, car, dog, bus, chair, and more), that recognizes far more than faces and handles messier real-world scenes much better. The honest tradeoff: YOLO11n is a bigger install and a bit slower per frame than a Haar cascade, but it detects real objects, not just faces, which is the whole point of a general-purpose "count objects" project. If you only ever need to detect faces, a Haar cascade is a perfectly reasonable, lighter-weight alternative worth knowing about.
:::

## Step 1: Detect objects in a single sample image

Every script below reuses this same core idea. `yolo11n.pt` is a pretrained checkpoint — `ultralytics` downloads it automatically the first time you construct `YOLO(...)`, and caches it locally after that:

```python
# detect_image.py
import cv2
from ultralytics import YOLO

model = YOLO("yolo11n.pt")

results = model("samples/street.jpg")
result = results[0]

print(f"Detected {len(result.boxes)} object(s):")
for box in result.boxes:
    class_name = model.names[int(box.cls)]
    confidence = float(box.conf)
    print(f"  - {class_name} ({confidence:.0%} confidence)")

annotated = result.plot()  # draws boxes + labels on a copy of the image
cv2.imwrite("output_street.jpg", annotated)
```

```bash
uv run python detect_image.py
```

`model(image_path)` runs the full detection pipeline in one call: resize the image, run it through the network, and convert the raw output into a list of boxes, each with a class label and a confidence score. `result.boxes` is that list — `box.cls` is a class index into `model.names` (a dict of all 80 COCO class names), and `box.conf` is the model's confidence that the box actually contains that class. `result.plot()` is a convenience method that draws all of that back onto the image for you, so you don't have to write your own box-drawing loop with `cv2.rectangle`.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>Running the script prints at least one detected object with a class name and a confidence score.</StepChecklistItem>
<StepChecklistItem>`output_street.jpg` exists and, opened in an image viewer, shows boxes drawn around real objects in the picture.</StepChecklistItem>
<StepChecklistItem>You can explain, in one sentence, what `box.cls` and `box.conf` each represent.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

The model returns a confidence score for every box, not just a yes/no "object here." If you filtered out any box with confidence below 90%, would you expect to see more false detections or more missed detections — and which of those two mistakes matters more for a project whose whole point is an accurate *count*?

## Step 2: Count one target class and keep a running total

Detecting everything is a good start, but "count objects" usually means counting *one kind* of thing — people walking through a doorway, cars in a lot, and so on:

```python
# count_class.py
from ultralytics import YOLO

model = YOLO("yolo11n.pt")

target_class = "person"
image_paths = ["samples/street.jpg", "samples/people.jpg"]

running_total = 0
for image_path in image_paths:
    result = model(image_path, verbose=False)[0]
    count = sum(1 for box in result.boxes if model.names[int(box.cls)] == target_class)
    running_total += count
    print(f"{image_path}: {count} {target_class}(s) -- running total: {running_total}")

print(f"\nTotal {target_class}(s): {running_total}")
```

```bash
uv run python count_class.py
```

The count is just a filter-and-sum over `result.boxes`, comparing each box's class name against the one you care about. `verbose=False` quiets `ultralytics`'s own per-call logging so your own `print` statements aren't buried under it.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>The script prints a per-image count and a running total that only ever goes up.</StepChecklistItem>
<StepChecklistItem>Changing `target_class` to a different COCO class (e.g. `"bus"`) changes the printed counts accordingly.</StepChecklistItem>
<StepChecklistItem>You understand why this reuses `model.names[int(box.cls)]` rather than hardcoding a class index number.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

If two people in a photo are standing so close together that their bounding boxes almost fully overlap, is there any realistic way this counting approach could under-count or over-count them? What would you look at in `result.boxes` to check?

## Step 3: Process a short sample video frame-by-frame

A video is just a sequence of images — the exact same per-image detection code from Steps 1–2, run once per frame in a loop:

```python
# detect_video.py
import cv2
from ultralytics import YOLO

model = YOLO("yolo11n.pt")
target_class = "person"

cap = cv2.VideoCapture("samples/sample_street.mp4")
fps = cap.get(cv2.CAP_PROP_FPS) or 15
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
writer = cv2.VideoWriter("output_video.mp4", cv2.VideoWriter_fourcc(*"mp4v"), fps, (width, height))

while True:
    ok, frame = cap.read()
    if not ok:
        break  # end of the video file, not a broken camera

    result = model(frame, verbose=False)[0]
    count = sum(1 for box in result.boxes if model.names[int(box.cls)] == target_class)

    annotated = result.plot()
    cv2.putText(annotated, f"{target_class}s: {count}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
    writer.write(annotated)

cap.release()
writer.release()
```

```bash
uv run python detect_video.py
```

`cv2.VideoCapture` reads a video file (or, in Step 4, a live camera) one frame at a time via `.read()`, which returns `(ok, frame)` — `ok` is `False` once there are no more frames. `cv2.VideoWriter` is the same idea in reverse: it accumulates frames you hand it into a new video file. Note the `if not ok: break` here means "the file ended" — Step 4 reuses this exact same check, but there it means something importantly different.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>`output_video.mp4` exists and plays, showing bounding boxes and a live count overlaid on each frame.</StepChecklistItem>
<StepChecklistItem>You can explain what `cap.read()` returns and why the loop checks `ok` before using `frame`.</StepChecklistItem>
<StepChecklistItem>You've noticed the count can flicker frame-to-frame even though nothing in the scene visibly changed.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

The count you print is a per-frame snapshot, not a per-video total — running the same person past the camera for three seconds could get counted in every single frame. What would "count how many *distinct* people crossed the frame" require, beyond what this script currently does?

## Step 4: Go live with your webcam

Same loop, one line different: swap the video file path for `0`, the index of your computer's default camera:

```python
# detect_webcam.py
import cv2
from ultralytics import YOLO

model = YOLO("yolo11n.pt")
target_class = "person"

cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("Could not open the webcam. Check that one is connected, that no other "
          "app is using it, and that this program has camera permission.")
else:
    print("Webcam opened. Press 'q' in the video window to quit.")
    while True:
        ok, frame = cap.read()
        if not ok:
            print("Lost the camera feed. Stopping.")
            break

        result = model(frame, verbose=False)[0]
        count = sum(1 for box in result.boxes if model.names[int(box.cls)] == target_class)

        annotated = result.plot()
        cv2.putText(annotated, f"{target_class}s: {count}", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.imshow("Webcam Object Counter (press q to quit)", annotated)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()
```

```bash
uv run python detect_webcam.py
```

`cv2.VideoCapture(0)` opens your default camera the same way `VideoCapture("some_file.mp4")` opened a file in Step 3 — same `.read()` loop, same `(ok, frame)` shape. The two important differences: `.isOpened()` is checked *up front* here, since "no webcam available" is a real, common failure that should produce a clear message rather than a confusing crash deep in the loop; and once running, `ok` turning `False` mid-loop means the camera connection was lost (unplugged, permission revoked), not "reached the end," since a live camera has no end. `cv2.imshow` opens a live window — a real GUI window, so this script won't produce visible output in a plain remote terminal with no display.

**✅ Checklist**

<StepChecklist>
<StepChecklistItem>A window opens showing your live camera feed with bounding boxes and a running count drawn on it.</StepChecklistItem>
<StepChecklistItem>Holding up a different number of the target object (e.g. yourself, then you and a second person) changes the printed/on-screen count accordingly.</StepChecklistItem>
<StepChecklistItem>Unplugging or covering the camera mid-run produces the "lost the camera feed" message, not a silent hang.</StepChecklistItem>
<StepChecklistItem>Pressing "q" closes the window cleanly instead of needing a force-quit.</StepChecklistItem>
</StepChecklist>

**🤔 Socratic Question(s)**

Steps 3 and 4 use `if not ok: break` in the exact same spot in the code, but that line means something different in each ("end of file" vs. "camera problem"). Why is it worth writing a distinct message for each case in real code, rather than treating both as the same generic error?

## ⚠️ Common pitfalls

- **Webcam permission denied.** macOS and Windows both prompt for camera access the first time an app tries to use it — if you dismissed that prompt (or it appeared behind another window), `cv2.VideoCapture(0).isOpened()` will return `False` even with a perfectly working camera. Check your OS's camera privacy settings for your terminal app or Python interpreter specifically.
- **The first run is slow and needs an internet connection.** `ultralytics` downloads `yolo11n.pt` from Ultralytics' servers the first time you construct `YOLO(...)` — after that it's cached locally (typically under `~/.cache` or the current directory) and every later run is fully offline. If the very first run seems to hang, it's probably still downloading, not stuck.
- **Confusing "no objects detected" with "the camera isn't working."** These look identical at first glance — an empty count either way — but they have completely different fixes. Check `cap.isOpened()` and whether `cv2.imshow` shows a live picture at all *before* worrying about why the count is zero; a working feed with a genuinely empty count (nothing that matches your target class is in frame) is not a bug.
- **Camera index mismatches on machines with more than one camera.** `VideoCapture(0)` opens whichever camera your OS considers the default, which isn't always the one you expect on a laptop with an external webcam plugged in — try `1`, `2`, etc. if `0` opens the wrong one.

## What you just built

A real, working computer-vision pipeline: load a pretrained model, run it on pixels instead of rows or text, and turn its raw output (boxes, class indices, confidence scores) into something a person actually wants — a live count of a specific kind of object. The same three-step shape (per-image detection → filter to one class → loop over frames) scales from a single photo up to a genuinely live camera feed with only the input source changing.

:::tip[This generalizes past "count objects"]
Everything here — a pretrained detector, a loop over frames, a running count — is also the backbone of things like people-counting sensors at store entrances, basic traffic-counting cameras, and wildlife camera-trap species counters. The counting logic in Step 2 is deliberately simple (no object tracking between frames, so a person standing still for ten frames gets counted in all ten), which is an honest simplification, not a hidden bug — see the "Where to go from here" section for what real systems add on top.
:::

## Where to go from here

- **Object tracking, not just detection.** Step 3's Socratic question points at the real gap: this project counts objects *per frame*, not distinct objects *across* a video. Libraries like `ultralytics`'s own built-in tracking mode (`model.track(...)`, using algorithms like ByteTrack) assign a persistent ID to each object across frames, so "how many distinct people crossed the frame" becomes answerable instead of just "how many are in frame right now."
- **A bigger, more accurate model.** `yolo11n.pt` ("n" for nano) trades some accuracy for speed and size. `ultralytics` ships larger checkpoints (`yolo11s.pt`, `yolo11m.pt`, and up) that detect more reliably, especially on small or partially obscured objects, at the cost of needing more compute per frame — worth trying if Step 4's live counts feel unreliable on your particular setup.
- **A custom class, not just COCO's 80.** YOLO11n only recognizes what it was trained on. Fine-tuning a YOLO model on your own labeled images (a much smaller version of the same idea as the [Fine-tune a Small Language Model project](/docs/projects/finetune-llm-unsloth)) lets you count something COCO never included — a specific product on a shelf, a specific tool, anything you can label a few hundred examples of.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓

<ProjectProgressCheckbox projectId="2027-webcam-object-counter" />

