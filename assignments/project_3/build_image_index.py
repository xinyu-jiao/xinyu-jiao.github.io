#!/usr/bin/env python3
"""Generate an indexed Excel sheet for project_3 images."""

from __future__ import annotations

import argparse
import base64
import colorsys
import json
import logging
from dataclasses import dataclass
from getpass import getpass
from pathlib import Path
from typing import Any, Iterable, Union

import pandas as pd
from json_repair import repair_json
from openai import OpenAI
from PIL import Image, ImageStat
from tqdm import tqdm

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"}
GITHUB_IMAGE_PREFIX = (
    "https://raw.githubusercontent.com/xinyu-jiao/xinyu-jiao.github.io/refs/heads/master/"
    "assignments/project_3/images/"
)
MODEL_NAME = "gpt-4o"
TAG_WHITELIST = {"Installation", "Model", "Painting", "Photography", "Concept"}
SYSTEM_PROMPT = (
    "You are an expert visual curator. You must answer using a compact JSON object "
    'containing exactly two keys: "title" and "tag". Never add narration or markdown.'
)
USER_PROMPT = (
    "Analyze the provided image and respond ONLY with a minified JSON object (no prose) "
    "that satisfies:\n"
    '- "title": evocative English title, max 12 words.\n'
    '- "tag": exactly one from {Installation, Model, Painting, Photography, Concept}.\n'
    'Example response: {"title":"Neon Cascade Over Steel","tag":"Installation"}\n'
    "Respond with nothing else."
)


@dataclass(frozen=True)
class ColorBucket:
    """Represents a hue bucket within the spectrum-based ordering."""

    name: str
    start: float
    end: float
    order: int


HUE_BUCKETS: tuple[ColorBucket, ...] = (
    ColorBucket("navy", 200, 225, 20),
    ColorBucket("blue", 225, 245, 30),
    ColorBucket("azure", 245, 260, 35),
    ColorBucket("indigo", 260, 280, 40),
    ColorBucket("violet", 280, 300, 45),
    ColorBucket("magenta", 300, 320, 50),
    ColorBucket("crimson", 320, 340, 55),
    ColorBucket("scarlet", 340, 360, 60),
    ColorBucket("scarlet", 0, 10, 60),  # wrap-around for reds
    ColorBucket("orange", 10, 35, 65),
    ColorBucket("amber", 35, 50, 70),
    ColorBucket("yellow", 50, 70, 75),
    ColorBucket("chartreuse", 70, 90, 80),
    ColorBucket("lime", 90, 110, 85),
    ColorBucket("green", 110, 140, 90),
    ColorBucket("emerald", 140, 165, 95),
    ColorBucket("teal", 165, 190, 100),
    ColorBucket("cyan", 190, 200, 105),
)


def main() -> None:
    args = parse_args()
    logging.basicConfig(level=logging.INFO, format="%(message)s")

    api_key = args.api_key or prompt_api_key()
    client = OpenAI(api_key=api_key)

    script_dir = Path(__file__).resolve().parent
    images_dir = script_dir / "images"
    output_path = script_dir / "image_index.xlsx"

    if not images_dir.exists():
        raise SystemExit(f"Image directory not found: {images_dir}")

    image_paths = sorted(iter_image_paths(images_dir))
    if not image_paths:
        raise SystemExit(f"No images discovered inside {images_dir}")

    logging.info("Starting annotation for %s images", len(image_paths))

    records = []
    failures = 0
    for path in tqdm(image_paths, desc="Indexing images"):
        title, tag, anno = annotate_image(client, path)
        if not title or tag not in TAG_WHITELIST:
            failures += 1
        record = build_record(path, title, tag, anno)
        records.append(record)

    df = pd.DataFrame(records, columns=["title", "image", "tag", "color_family", "anno"])
    df.to_excel(output_path, index=False)

    logging.info("Processed %s images (annotation failures: %s)", len(df), failures)
    logging.info("Excel index created at: %s", output_path.relative_to(script_dir))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build project_3 image index.")
    parser.add_argument(
        "--api-key",
        dest="api_key",
        help="OpenAI API key (optional, will prompt if omitted).",
    )
    return parser.parse_args()


def prompt_api_key() -> str:
    api_key = ""
    while not api_key:
        api_key = getpass("Enter OpenAI API key: ").strip()
    return api_key


def iter_image_paths(images_dir: Path) -> Iterable[Path]:
    """Yield image file paths inside the provided directory (non-recursive)."""
    for path in images_dir.iterdir():
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS:
            yield path


def build_record(image_path: Path, title: str, tag: str, anno: str) -> dict[str, str]:
    """Construct the dataframe row for a single image."""
    hex_color = extract_average_hex(image_path)
    family, order = determine_color_family(hex_color)
    color_descriptor = f"{order:03d}|{family}|{hex_color}"

    return {
        "title": title,
        "image": f"{GITHUB_IMAGE_PREFIX}{image_path.name}",
        "tag": tag if tag in TAG_WHITELIST else "",
        "color_family": color_descriptor,
        "anno": anno,
    }


def annotate_image(client: OpenAI, image_path: Path) -> tuple[str, str, str]:
    """Call OpenAI to fetch title and tag for an image."""
    try:
        image_b64, mime = encode_image(image_path)
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": USER_PROMPT},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime};base64,{image_b64}",
                            "details": "high",
                        },
                    },
                ],
            },
        ]
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
            stream=False,
            max_tokens=300,
            temperature=0,
        )
        text = extract_chat_text(response)
        payload, fallback = parse_annotation_payload(text)
        if payload:
            title = payload.get("title", "").strip()
            tag = normalize_tag(payload.get("tag", ""))
            return title, tag, ""
        logging.warning("Annotation parsing failed for %s; storing raw output.", image_path.name)
        return "", "", fallback or text
    except Exception as exc:  # noqa: BLE001
        logging.warning("Annotation failed for %s: %s", image_path.name, exc)
        return "", "", ""


def encode_image(image_path: Path) -> tuple[str, str]:
    """Return base64 payload and mime type for OpenAI image input."""
    suffix = image_path.suffix.lower()
    mime = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".bmp": "image/bmp",
        ".webp": "image/webp",
    }.get(suffix, "image/jpeg")

    with image_path.open("rb") as fp:
        encoded = base64.b64encode(fp.read()).decode("utf-8")
    return encoded, mime


def extract_chat_text(response) -> str:
    """Pull the textual content from a chat completion response."""
    choices = getattr(response, "choices", [])
    if not choices:
        raise ValueError("No choices returned by the completion.")

    message = choices[0].message
    content: Union[str, list] = getattr(message, "content", "")
    if isinstance(content, str):
        return content

    for block in content:
        block_type = block.get("type")
        if block_type == "text":
            return block.get("text", "")

    raise ValueError("No text block returned by the model.")


def parse_annotation_payload(text: str) -> tuple[dict[str, Any] | None, str]:
    """Attempt to coerce the model output into JSON, retaining fallback text."""
    raw = text.strip()
    if not raw:
        return None, ""
    try:
        repaired = repair_json(raw)
        payload = json.loads(repaired)
        if isinstance(payload, dict):
            return payload, ""
        return None, raw
    except Exception:
        try:
            payload = json.loads(raw)
            if isinstance(payload, dict):
                return payload, ""
        except Exception:
            pass
    return None, raw


def normalize_tag(raw_tag: str) -> str:
    """Map arbitrary tag responses into the allowed whitelist."""
    cleaned = raw_tag.strip().capitalize()
    for allowed in TAG_WHITELIST:
        if cleaned.lower() == allowed.lower():
            return allowed
    return ""


def extract_average_hex(image_path: Path) -> str:
    """Calculate the dominant color (rough average) and return a HEX string."""
    with Image.open(image_path) as img:
        img = img.convert("RGB")
        img.thumbnail((256, 256))  # downscale for speed while keeping fidelity
        stats = ImageStat.Stat(img)
        r, g, b = (int(round(value)) for value in stats.mean[:3])
    return f"#{r:02x}{g:02x}{b:02x}"


def determine_color_family(hex_color: str) -> tuple[str, int]:
    """Map the HEX color to a spectrum family and ordering key."""
    r, g, b = hex_to_rgb(hex_color)
    h, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
    hue_deg = h * 360

    # Low saturation colors are treated as grayscale to preserve the dark -> light flow.
    if s < 0.15:
        if v < 0.12:
            return "black", 0
        if v < 0.35:
            return "charcoal", 10
        if v < 0.7:
            return "gray", 120
        return "white", 140

    for bucket in HUE_BUCKETS:
        if bucket.start <= bucket.end:
            if bucket.start <= hue_deg < bucket.end:
                return bucket.name, bucket.order
        else:  # wrap-around bucket (e.g., reds)
            if hue_deg >= bucket.start or hue_deg < bucket.end:
                return bucket.name, bucket.order

    return "spectrum", 150


def hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    """Convert a HEX string to RGB integers."""
    hex_value = hex_color.lstrip("#")
    if len(hex_value) != 6:
        raise ValueError(f"Unexpected HEX code: {hex_color}")
    r = int(hex_value[0:2], 16)
    g = int(hex_value[2:4], 16)
    b = int(hex_value[4:6], 16)
    return r, g, b


if __name__ == "__main__":
    main()

