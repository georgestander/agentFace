#!/usr/bin/env python3
"""Convert an image to ASCII art.

Usage:
  python scripts/ascii-face.py <image> --width 120 --chars "@%#*+=-:. "
"""

import argparse
import os
import sys

try:
    from PIL import Image
except ImportError as exc:  # pragma: no cover
    raise SystemExit(
        "Missing dependency: Pillow. Install with `pip install Pillow` and retry."
    ) from exc


def build_ascii_map(chars: str) -> list[str]:
    """Normalize char ramp from darkest -> lightest."""
    if not chars:
        raise ValueError("Character ramp cannot be empty")
    return list(chars)


def luminance_to_char(value: int, chars: list[str]) -> str:
    """Map a 0-255 luminance value to a character."""
    idx = (value * len(chars)) // 256
    if idx >= len(chars):
        idx = len(chars) - 1
    return chars[idx]


def image_to_ascii(
    image_path: str,
    width: int,
    chars: str,
    invert: bool,
    scale: float,
) -> str:
    with Image.open(image_path) as img:
        gray = img.convert("L")

    orig_w, orig_h = gray.size
    if width <= 0:
        raise ValueError("--width must be greater than 0")

    target_h = max(1, int((orig_h / orig_w) * width * scale))
    resized = gray.resize((width, target_h))

    mapping = build_ascii_map(chars)
    if invert:
        mapping = list(reversed(mapping))

    output_lines = []
    pixels = list(resized.getdata())
    for y in range(target_h):
        row = pixels[y * width : (y + 1) * width]
        output_lines.append("".join(luminance_to_char(px, mapping) for px in row))

    return "\n".join(output_lines)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Turn an image into ASCII art")
    parser.add_argument("image", help="Path to image file (jpg, png, webp, etc.)")
    parser.add_argument(
        "--width",
        type=int,
        default=120,
        help="Output character width in columns (default: 120)",
    )
    parser.add_argument(
        "--chars",
        default=" .:-=+*#%@",
        help="ASCII characters from lightest to darkest",
    )
    parser.add_argument(
        "--invert",
        action="store_true",
        help="Invert darkness mapping (dark pixels become light characters)",
    )
    parser.add_argument(
        "--scale",
        type=float,
        default=0.55,
        help="Vertical correction for terminal character aspect ratio",
    )
    parser.add_argument(
        "--output",
        "-o",
        help="Save output to file instead of printing",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    if not os.path.isfile(args.image):
        print(f"Image not found: {args.image}", file=sys.stderr)
        return 1

    try:
        ascii_art = image_to_ascii(
            args.image,
            width=args.width,
            chars=args.chars,
            invert=args.invert,
            scale=args.scale,
        )
    except Exception as exc:  # pragma: no cover
        print(f"Failed to convert image: {exc}", file=sys.stderr)
        return 1

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(ascii_art)
            f.write("\n")
    else:
        print(ascii_art)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
