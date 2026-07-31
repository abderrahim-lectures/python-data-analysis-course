"""Step 1: run object detection on a single bundled sample image and draw boxes.

Usage:
    uv run python detect_image.py
"""

import cv2
from ultralytics import YOLO

IMAGE_PATH = "samples/street.jpg"
OUTPUT_PATH = "output_street.jpg"


def main() -> None:
    # yolo11n.pt ("n" = nano) is the smallest YOLO11 checkpoint -- a few
    # megabytes, fast enough to run on a CPU. Ultralytics downloads it
    # automatically the first time you construct YOLO(...) and caches it
    # locally after that (see the "Common pitfalls" section in the lesson).
    model = YOLO("yolo11n.pt")

    results = model(IMAGE_PATH)
    result = results[0]

    print(f"Detected {len(result.boxes)} object(s) in {IMAGE_PATH}:")
    for box in result.boxes:
        class_name = model.names[int(box.cls)]
        confidence = float(box.conf)
        print(f"  - {class_name} ({confidence:.0%} confidence)")

    # .plot() returns a copy of the image with boxes + labels drawn on it.
    annotated = result.plot()
    cv2.imwrite(OUTPUT_PATH, annotated)
    print(f"\nSaved annotated image to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
