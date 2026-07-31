"""Step 4: run live object detection and counting on your own webcam feed.

This is the only script in this folder that touches real hardware -- it
will NOT run in a hosted notebook (Colab/Kaggle/Binder), only on a machine
that actually has a webcam attached and a local Python install. See the
"Where to run this" section of the lesson.

Usage:
    uv run python detect_webcam.py
    uv run python detect_webcam.py --target car
    (press "q" in the video window to quit)
"""

import argparse

import cv2
from ultralytics import YOLO


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--target", default="person", help="COCO class name to count (default: person)")
    parser.add_argument("--camera-index", type=int, default=0, help="Which camera to open (default: 0)")
    args = parser.parse_args()

    model = YOLO("yolo11n.pt")

    cap = cv2.VideoCapture(args.camera_index)
    if not cap.isOpened():
        # A closed/missing camera fails right here, at .isOpened() -- not
        # buried inside the detection loop -- so it's never confused with
        # "the model just isn't detecting anything" (see the pitfalls
        # section in the lesson).
        print(
            f"Could not open camera index {args.camera_index}. "
            "No webcam available -- check that one is connected, that no "
            "other app is using it, and that this program has camera "
            "permission (macOS/Windows both prompt for this on first use)."
        )
        return

    print("Webcam opened. Press 'q' in the video window to quit.")

    while True:
        ok, frame = cap.read()
        if not ok:
            print("Lost the camera feed (unplugged mid-run?). Stopping.")
            break

        result = model(frame, verbose=False)[0]
        count = sum(1 for box in result.boxes if model.names[int(box.cls)] == args.target)

        annotated = result.plot()
        cv2.putText(
            annotated,
            f"{args.target}s: {count}",
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 255, 0),
            2,
        )
        cv2.imshow("Webcam Object Counter (press q to quit)", annotated)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
