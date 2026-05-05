#!/usr/bin/env python3
"""Generate Algomind extension icons in required sizes."""

from PIL import Image, ImageDraw, ImageFont
import os

SIZES = [16, 48, 128]
OUTPUT_DIR = "public/icons"

# Algomind brand color (blue from styles.css primary: #2563eb)
PRIMARY = (37, 99, 235)
BG = (9, 9, 11)  # Dark background from styles.css

def create_icon(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Draw rounded rect background
    radius = size // 6
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=PRIMARY)

    # Try to load a font, fall back to default
    text = "AM"
    font_size = int(size * 0.55)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
    except:
        try:
            font = ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", font_size)
        except:
            font = ImageFont.load_default()

    # Get text bounding box for centering
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - int(size * 0.05)

    draw.text((x, y), text, font=font, fill=(255, 255, 255))

    return img

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    for size in SIZES:
        icon = create_icon(size)
        path = os.path.join(OUTPUT_DIR, f"icon-{size}.png")
        icon.save(path)
        print(f"Created {path}")

if __name__ == "__main__":
    main()
