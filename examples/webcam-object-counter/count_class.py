"""Step 2: count objects of one target class across all bundled sample images.

Usage:
    uv run python count_class.py
    uv run python count_class.py --target car
"""

import argparse
import glob

from ultralytics import YOLO

SAMPLE_IMAGES = sorted(glob.glob("samples/*.jpg"))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--target",
        default="person",
        help="COCO class name to count, e.g. person, car, dog, bus (default: person)",
    )
    args = parser.parse_args()

    model = YOLO("yolo11n.pt")

    if args.target not in model.names.values():
        raise SystemExit(
            f"'{args.target}' isn't a COCO class this model knows. "
            f"Try one of: {', '.join(sorted(model.names.values()))}"
        )

    running_total = 0
    for image_path in SAMPLE_IMAGES:
        result = model(image_path, verbose=False)[0]
        count = sum(1 for box in result.boxes if model.names[int(box.cls)] == args.target)
        running_total += count
        print(f"{image_path}: {count} {args.target}(s) -- running total: {running_total}")

    print(f"\nTotal {args.target}(s) across {len(SAMPLE_IMAGES)} image(s): {running_total}")


if __name__ == "__main__":
    main()
