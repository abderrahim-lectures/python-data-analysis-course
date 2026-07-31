# Webcam Object Counter Example

The local companion to the course's [Count Objects in Real Time with a Webcam](../../docs/projects/webcam-object-counter/index.md) Real-World Project — real, runnable scripts that detect and count objects with OpenCV and a pretrained YOLO11n model, on a bundled sample image, a bundled sample video, and (locally only) a live webcam.

## What's here

- `samples/street.jpg`, `samples/people.jpg` — two small bundled sample images (Ultralytics' own public demo assets) so the image-detection path runs standalone, no webcam or internet download beyond the model weights needed.
- `samples/sample_street.mp4` — a short (3-second) sample video generated from `street.jpg`, so the video path also runs standalone.
- `detect_image.py` — Step 1: runs detection on a single sample image and saves an annotated copy with bounding boxes drawn.
- `count_class.py` — Step 2: counts objects of one target COCO class (default `person`) across all bundled sample images and prints a running total.
- `detect_video.py` — Step 3: processes the bundled sample video frame-by-frame, counting a target class in each frame, and saves an annotated output video.
- `detect_webcam.py` — Step 4: the only script here that touches real hardware. Opens your machine's webcam with OpenCV's `VideoCapture(0)` and runs live detection and counting, with a graceful message if no webcam is available. This one will not run in a hosted notebook.

Nothing here needs an API key or a signup — the model (`yolo11n.pt`, a few megabytes) is pulled from Ultralytics' public release the first time you run any script, and cached locally after that. No internet connection is needed once that first download finishes.

## Running it

```bash
uv run python detect_image.py
uv run python count_class.py --target person
uv run python detect_video.py
uv run python detect_webcam.py   # needs a real, connected webcam
```

`uv` reads `pyproject.toml` and creates an isolated environment for this project automatically on first run — no manual virtual environment setup needed. Be aware `opencv-python` and `ultralytics` (which pulls in PyTorch) are a real download the first time — expect this to take a few minutes and a few hundred megabytes of disk space.

## Expected output

`detect_image.py` on `samples/street.jpg` prints something like:

```
Detected 5 object(s) in samples/street.jpg:
  - bus (94% confidence)
  - person (89% confidence)
  - person (88% confidence)
  - person (86% confidence)
  - person (62% confidence)

Saved annotated image to output_street.jpg
```

Exact confidence numbers can shift slightly between `ultralytics` versions as the underlying weights get refreshed, but the object counts on these particular sample images should stay stable.

See the full [lesson](../../docs/projects/webcam-object-counter/index.md) for the step-by-step walkthrough, including the tradeoffs between a full YOLO model and OpenCV's lighter Haar cascades, and how to read a webcam permission failure versus "no objects detected."
