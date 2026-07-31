"""Step 3: process a short bundled sample video frame-by-frame and count objects.

Usage:
    uv run python detect_video.py
"""

import cv2
from ultralytics import YOLO

VIDEO_PATH = "samples/sample_street.mp4"
OUTPUT_PATH = "output_video.mp4"
TARGET_CLASS = "person"


def main() -> None:
    model = YOLO("yolo11n.pt")

    cap = cv2.VideoCapture(VIDEO_PATH)
    if not cap.isOpened():
        raise SystemExit(f"Could not open {VIDEO_PATH}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 15
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    writer = cv2.VideoWriter(OUTPUT_PATH, cv2.VideoWriter_fourcc(*"mp4v"), fps, (width, height))

    frame_count = 0
    max_count_seen = 0

    while True:
        ok, frame = cap.read()
        if not ok:
            # End of the video, not a broken camera -- see the pitfalls
            # section for why this distinction matters once Step 4 swaps
            # this file-backed capture for a live one.
            break

        frame_count += 1
        result = model(frame, verbose=False)[0]
        count = sum(1 for box in result.boxes if model.names[int(box.cls)] == TARGET_CLASS)
        max_count_seen = max(max_count_seen, count)

        annotated = result.plot()
        cv2.putText(
            annotated,
            f"{TARGET_CLASS}s: {count}",
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 255, 0),
            2,
        )
        writer.write(annotated)

    cap.release()
    writer.release()

    print(f"Processed {frame_count} frames from {VIDEO_PATH}")
    print(f"Most {TARGET_CLASS}s seen in a single frame: {max_count_seen}")
    print(f"Saved annotated video to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
