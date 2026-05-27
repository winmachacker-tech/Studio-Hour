#!/usr/bin/env python3
"""
Generate Studio Hour app icon and splash assets.

Concept: Abstract hour mark — a broken circle (like a clock face with
one segment in Danielle Teal) on Night Plum background. Minimal,
premium, reads at small sizes.

Uses only Python stdlib (no PIL/Pillow needed).
"""

import struct
import zlib
import math
import os

# Colors
NIGHT_PLUM = (0x13, 0x0D, 0x1A)
TEAL = (0x11, 0x99, 0x99)
GOLD = (0xD4, 0xA8, 0x43)
CREAM = (0xF5, 0xEE, 0xF8)
PLUM_LIGHT = (0x25, 0x16, 0x40)


def make_png(width, height, pixels):
    """Create a PNG file from raw pixel data (list of (r,g,b) tuples or flat)."""
    def chunk(chunk_type, data):
        c = chunk_type + data
        crc = struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)
        return struct.pack(">I", len(data)) + c + crc

    header = b"\x89PNG\r\n\x1a\n"
    ihdr = chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))

    raw = bytearray()
    for y in range(height):
        raw.append(0)  # filter byte
        for x in range(width):
            idx = y * width + x
            r, g, b = pixels[idx]
            raw.extend([r, g, b])

    compressed = zlib.compress(bytes(raw), 9)
    idat = chunk(b"IDAT", compressed)
    iend = chunk(b"IEND", b"")

    return header + ihdr + idat + iend


def draw_circle_segment(pixels, w, h, cx, cy, radius, thickness, start_deg, end_deg, color):
    """Draw an arc segment."""
    for y in range(h):
        for x in range(w):
            dx = x - cx
            dy = y - cy
            dist = math.sqrt(dx * dx + dy * dy)
            if abs(dist - radius) > thickness / 2:
                continue
            angle = math.degrees(math.atan2(-dy, dx)) % 360
            if start_deg <= end_deg:
                in_range = start_deg <= angle <= end_deg
            else:
                in_range = angle >= start_deg or angle <= end_deg
            if in_range:
                # Anti-alias at edges
                edge_dist = abs(dist - radius) / (thickness / 2)
                if edge_dist < 0.85:
                    pixels[y * w + x] = color
                elif edge_dist < 1.0:
                    alpha = 1.0 - (edge_dist - 0.85) / 0.15
                    bg = pixels[y * w + x]
                    pixels[y * w + x] = (
                        int(bg[0] + (color[0] - bg[0]) * alpha),
                        int(bg[1] + (color[1] - bg[1]) * alpha),
                        int(bg[2] + (color[2] - bg[2]) * alpha),
                    )


def draw_dot(pixels, w, h, cx, cy, radius, color):
    """Draw a filled circle."""
    for y in range(max(0, int(cy - radius - 1)), min(h, int(cy + radius + 2))):
        for x in range(max(0, int(cx - radius - 1)), min(w, int(cx + radius + 2))):
            dx = x - cx
            dy = y - cy
            dist = math.sqrt(dx * dx + dy * dy)
            if dist <= radius:
                pixels[y * w + x] = color
            elif dist <= radius + 1:
                alpha = 1.0 - (dist - radius)
                bg = pixels[y * w + x]
                pixels[y * w + x] = (
                    int(bg[0] + (color[0] - bg[0]) * alpha),
                    int(bg[1] + (color[1] - bg[1]) * alpha),
                    int(bg[2] + (color[2] - bg[2]) * alpha),
                )


def generate_icon(size):
    """Generate the Studio Hour icon at a given size."""
    pixels = [NIGHT_PLUM] * (size * size)
    cx, cy = size / 2, size / 2
    radius = size * 0.32
    thickness = size * 0.055

    # Main circle in cream (broken — 30° to 320°)
    draw_circle_segment(pixels, size, size, cx, cy, radius, thickness, 30, 320, CREAM)

    # Teal accent arc (320° to 30° — the "hour" segment)
    draw_circle_segment(pixels, size, size, cx, cy, radius, thickness * 1.3, 325, 25, TEAL)

    # Gold dot at 12 o'clock position (the hour mark)
    dot_x = cx + radius * math.cos(math.radians(90))
    dot_y = cy - radius * math.sin(math.radians(90))
    draw_dot(pixels, size, size, dot_x, dot_y, size * 0.035, GOLD)

    # Small teal dot at center
    draw_dot(pixels, size, size, cx, cy, size * 0.025, TEAL)

    return pixels


def generate_foreground(size):
    """Generate adaptive icon foreground (transparent-safe on solid bg)."""
    # Same as icon but the mark is centered in the safe zone (inner 66%)
    pixels = [NIGHT_PLUM] * (size * size)
    cx, cy = size / 2, size / 2
    # Adaptive icons have a safe zone of 66%, so scale the mark to fit
    radius = size * 0.22
    thickness = size * 0.04

    draw_circle_segment(pixels, size, size, cx, cy, radius, thickness, 30, 320, CREAM)
    draw_circle_segment(pixels, size, size, cx, cy, radius, thickness * 1.3, 325, 25, TEAL)

    dot_x = cx + radius * math.cos(math.radians(90))
    dot_y = cy - radius * math.sin(math.radians(90))
    draw_dot(pixels, size, size, dot_x, dot_y, size * 0.025, GOLD)
    draw_dot(pixels, size, size, cx, cy, size * 0.018, TEAL)

    return pixels


def generate_splash(size):
    """Generate splash icon — smaller mark on plum."""
    pixels = [NIGHT_PLUM] * (size * size)
    cx, cy = size / 2, size / 2
    radius = size * 0.2
    thickness = size * 0.03

    draw_circle_segment(pixels, size, size, cx, cy, radius, thickness, 30, 320, CREAM)
    draw_circle_segment(pixels, size, size, cx, cy, radius, thickness * 1.3, 325, 25, TEAL)

    dot_x = cx + radius * math.cos(math.radians(90))
    dot_y = cy - radius * math.sin(math.radians(90))
    draw_dot(pixels, size, size, dot_x, dot_y, size * 0.018, GOLD)
    draw_dot(pixels, size, size, cx, cy, size * 0.012, TEAL)

    return pixels


def generate_monochrome(size):
    """Monochrome icon — white mark on black for themed icons."""
    pixels = [(0, 0, 0)] * (size * size)
    cx, cy = size / 2, size / 2
    radius = size * 0.22
    thickness = size * 0.04
    white = (255, 255, 255)

    draw_circle_segment(pixels, size, size, cx, cy, radius, thickness, 30, 320, white)
    draw_circle_segment(pixels, size, size, cx, cy, radius, thickness * 1.3, 325, 25, white)

    dot_x = cx + radius * math.cos(math.radians(90))
    dot_y = cy - radius * math.sin(math.radians(90))
    draw_dot(pixels, size, size, dot_x, dot_y, size * 0.025, white)
    draw_dot(pixels, size, size, cx, cy, size * 0.018, white)

    return pixels


def generate_background(size):
    """Solid Night Plum background for adaptive icon."""
    return [NIGHT_PLUM] * (size * size)


if __name__ == "__main__":
    assets_dir = os.path.join(os.path.dirname(__file__), "..", "assets")

    print("Generating icon.png (1024x1024)...")
    pixels = generate_icon(1024)
    with open(os.path.join(assets_dir, "icon.png"), "wb") as f:
        f.write(make_png(1024, 1024, pixels))

    print("Generating android-icon-foreground.png (1024x1024)...")
    pixels = generate_foreground(1024)
    with open(os.path.join(assets_dir, "android-icon-foreground.png"), "wb") as f:
        f.write(make_png(1024, 1024, pixels))

    print("Generating android-icon-background.png (1024x1024)...")
    pixels = generate_background(1024)
    with open(os.path.join(assets_dir, "android-icon-background.png"), "wb") as f:
        f.write(make_png(1024, 1024, pixels))

    print("Generating android-icon-monochrome.png (1024x1024)...")
    pixels = generate_monochrome(1024)
    with open(os.path.join(assets_dir, "android-icon-monochrome.png"), "wb") as f:
        f.write(make_png(1024, 1024, pixels))

    print("Generating splash-icon.png (512x512)...")
    pixels = generate_splash(512)
    with open(os.path.join(assets_dir, "splash-icon.png"), "wb") as f:
        f.write(make_png(512, 512, pixels))

    print("Generating favicon.png (48x48)...")
    pixels = generate_icon(48)
    with open(os.path.join(assets_dir, "favicon.png"), "wb") as f:
        f.write(make_png(48, 48, pixels))

    print("Done.")
