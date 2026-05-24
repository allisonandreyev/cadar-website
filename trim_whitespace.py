#!/usr/bin/env python3
"""Auto-trim whitespace from PNG figures. Originals saved to figures/originals/."""
import shutil
from pathlib import Path
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None  # allow very large PNGs

FIGURES_DIR = Path("figures")
BACKUP_DIR = FIGURES_DIR / "originals"
PADDING = 20   # pixels of whitespace to leave on each side
THRESHOLD = 245  # pixels with all channels >= this are treated as "white"


def trim(img: Image.Image) -> Image.Image:
    arr = np.array(img.convert("RGB"))
    non_white = np.any(arr < THRESHOLD, axis=2)
    rows = np.any(non_white, axis=1)
    cols = np.any(non_white, axis=0)
    row_idx = np.where(rows)[0]
    col_idx = np.where(cols)[0]
    if not len(row_idx):
        return img  # fully blank
    h, w = arr.shape[:2]
    top    = max(row_idx[0]  - PADDING, 0)
    bottom = min(row_idx[-1] + PADDING, h)
    left   = max(col_idx[0]  - PADDING, 0)
    right  = min(col_idx[-1] + PADDING, w)
    return img.crop((left, top, right, bottom))


def main():
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    pngs = sorted(FIGURES_DIR.glob("*.png"))
    if not pngs:
        print("No PNG files found in figures/")
        return

    for src in pngs:
        img = Image.open(src)
        trimmed = trim(img)

        if trimmed.size == img.size:
            print(f"  skip  {src.name}  (no whitespace to remove)")
            continue

        # Back up original
        shutil.copy2(src, BACKUP_DIR / src.name)

        # Save trimmed (preserve format)
        trimmed.save(src)
        ow, oh = img.size
        nw, nh = trimmed.size
        print(f"  trim  {src.name}  {ow}x{oh} → {nw}x{nh}")

    print(f"\nOriginals backed up to {BACKUP_DIR}/")


if __name__ == "__main__":
    main()
