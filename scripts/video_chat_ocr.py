#!/usr/bin/env python3
"""Video/screencast OCR pipeline for historical amoCRM/Wazzup chats.

Usage:
  python3 scripts/video_chat_ocr.py private-data/video-inbox/chats.mp4 --fps 0.5 --ocr

The script:
1. extracts frames with ffmpeg,
2. deduplicates visually similar frames,
3. optionally calls OpenAI Vision to OCR each frame,
4. writes reconstructed text into private-data/manual-chats/inbox/ so manual_chat_ingest.py can score it.

Private inputs/outputs live under private-data/ and are git-ignored.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import subprocess
import sys
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from PIL import Image, ImageStat

ROOT = Path(__file__).resolve().parents[1]
VIDEO_DIR = ROOT / "private-data" / "video-chats"
MANUAL_INBOX = ROOT / "private-data" / "manual-chats" / "inbox"


def load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


def init_env() -> None:
    load_env_file(ROOT / "private-data" / "amocrm" / ".env")
    load_env_file(Path.home() / ".hermes" / ".env")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def run(command: list[str]) -> None:
    subprocess.run(command, check=True)


def extract_frames(video_path: Path, frames_dir: Path, fps: float) -> list[Path]:
    frames_dir.mkdir(parents=True, exist_ok=True)
    for old in frames_dir.glob("frame-*.jpg"):
        old.unlink()
    run([
        "ffmpeg",
        "-hide_banner",
        "-loglevel", "error",
        "-i", str(video_path),
        "-vf", f"fps={fps},scale=1600:-1",
        "-q:v", "3",
        str(frames_dir / "frame-%06d.jpg"),
    ])
    return sorted(frames_dir.glob("frame-*.jpg"))


def image_fingerprint(path: Path, size: int = 16) -> tuple[int, ...]:
    image = Image.open(path).convert("L").resize((size, size))
    pixels = list(image.tobytes())
    avg = sum(pixels) / len(pixels)
    return tuple(1 if pixel > avg else 0 for pixel in pixels)


def hamming(a: tuple[int, ...], b: tuple[int, ...]) -> int:
    return sum(x != y for x, y in zip(a, b))


def crop_similarity_key(path: Path) -> tuple[int, ...]:
    """Fingerprint mostly the central/right chat area, not browser chrome."""
    image = Image.open(path).convert("RGB")
    w, h = image.size
    crop = image.crop((int(w * 0.22), int(h * 0.08), int(w * 0.98), int(h * 0.94)))
    tmp = path.with_suffix(".crop.tmp.jpg")
    crop.save(tmp, quality=70)
    try:
        return image_fingerprint(tmp)
    finally:
        tmp.unlink(missing_ok=True)


def dedupe_frames(frames: list[Path], output_dir: Path, max_hamming: int) -> list[Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    for old in output_dir.glob("*.jpg"):
        old.unlink()
    selected: list[Path] = []
    last_key: tuple[int, ...] | None = None
    for frame in frames:
        key = crop_similarity_key(frame)
        if last_key is not None and hamming(key, last_key) <= max_hamming:
            continue
        target = output_dir / frame.name
        target.write_bytes(frame.read_bytes())
        selected.append(target)
        last_key = key
    return selected


def image_to_data_url(path: Path) -> str:
    data = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:image/jpeg;base64,{data}"


def call_openai_vision(frame: Path, previous_text: str = "") -> dict[str, Any]:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is missing")
    model = os.environ.get("OPENAI_VISION_MODEL") or os.environ.get("OPENAI_MODEL") or "gpt-4.1-mini"
    prompt = (
        "Ты OCR-анализатор скриншотов amoCRM/Wazzup. "
        "Вытащи только видимый текст переписки: сообщения клиента и менеджера, даты/время если видны. "
        "Игнорируй меню, рекламу, кнопки, системный мусор. "
        "Если это тот же экран/дублирующий кадр — верни только новый текст, которого не было в previous_text. "
        "Верни строго JSON: {\"messages\":[{\"role\":\"client|agent|unknown\",\"text\":\"...\",\"time\":\"...\"}],\"visible_context\":\"...\",\"quality\":\"good|medium|bad\"}."
    )
    payload = {
        "model": model,
        "temperature": 0,
        "max_tokens": 1800,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": prompt},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": f"previous_text:\n{previous_text[-4000:]}"},
                    {"type": "image_url", "image_url": {"url": image_to_data_url(frame)}},
                ],
            },
        ],
    }
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as response:
        data = json.loads(response.read().decode("utf-8"))
    content = data["choices"][0]["message"]["content"]
    return json.loads(content)


def append_messages_as_text(items: list[dict[str, Any]]) -> str:
    lines: list[str] = []
    for item in items:
        role = item.get("role") or "unknown"
        role_ru = {"client": "Клиент", "agent": "Агент", "unknown": "Неизвестно"}.get(role, role)
        text = str(item.get("text") or "").strip()
        time_value = str(item.get("time") or "").strip()
        if not text:
            continue
        prefix = f"{role_ru}"
        if time_value:
            prefix += f" ({time_value})"
        lines.append(f"{prefix}: {text}")
    return "\n".join(lines)


def result_to_text(result: dict[str, Any]) -> str:
    messages_text = append_messages_as_text(result.get("messages") or [])
    if messages_text:
        return messages_text
    visible_context = str(result.get("visible_context") or "").strip()
    if visible_context:
        return f"Неизвестно: {visible_context}"
    return ""


def process_video(video_path: Path, fps: float, ocr: bool, max_frames: int | None, max_hamming: int) -> dict[str, Any]:
    video_path = video_path.resolve()
    digest = sha256_file(video_path)
    run_id = f"video-{digest[:12]}"
    out_dir = VIDEO_DIR / run_id
    frames_dir = out_dir / "frames"
    unique_dir = out_dir / "unique-frames"
    out_dir.mkdir(parents=True, exist_ok=True)
    MANUAL_INBOX.mkdir(parents=True, exist_ok=True)

    frames = extract_frames(video_path, frames_dir, fps)
    unique_frames = dedupe_frames(frames, unique_dir, max_hamming=max_hamming)
    if max_frames:
        unique_frames = unique_frames[:max_frames]

    manifest = {
        "run_id": run_id,
        "source_video": str(video_path),
        "source_sha256": digest,
        "processed_at": datetime.now(timezone.utc).isoformat(),
        "fps": fps,
        "frames_total": len(frames),
        "frames_unique": len(unique_frames),
        "ocr": ocr,
    }
    (out_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    if not ocr:
        return manifest

    ocr_path = out_dir / "ocr.jsonl"
    reconstructed_lines: list[str] = []
    previous_text = ""
    with ocr_path.open("w", encoding="utf-8") as file:
        for index, frame in enumerate(unique_frames, start=1):
            try:
                result = call_openai_vision(frame, previous_text=previous_text)
            except Exception as error:
                result = {"error": f"{type(error).__name__}: {error}", "messages": [], "quality": "bad"}
            record = {"frame": frame.name, "index": index, "result": result}
            file.write(json.dumps(record, ensure_ascii=False) + "\n")
            text = result_to_text(result)
            if text:
                reconstructed_lines.append(f"\n# frame {index} / {frame.name}\n{text}")
                previous_text += "\n" + text
            print(json.dumps({"frame": index, "messages": len(result.get("messages") or []), "quality": result.get("quality"), "error": result.get("error")}, ensure_ascii=False), flush=True)
            time.sleep(0.2)

    reconstructed_text = "\n".join(reconstructed_lines).strip()
    manifest.update({"ocr_jsonl": str(ocr_path), "reconstructed_chars": len(reconstructed_text)})
    if reconstructed_text:
        inbox_path = MANUAL_INBOX / f"{run_id}.md"
        inbox_path.write_text(reconstructed_text + "\n", encoding="utf-8")
        manifest["manual_inbox_file"] = str(inbox_path)
    (out_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return manifest


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("video", type=Path)
    parser.add_argument("--fps", type=float, default=0.5, help="frames per second to sample; 0.5 = one frame every 2s")
    parser.add_argument("--ocr", action="store_true", help="call OpenAI Vision OCR")
    parser.add_argument("--max-frames", type=int, default=None)
    parser.add_argument("--max-hamming", type=int, default=6, help="dedupe threshold; lower keeps more frames")
    args = parser.parse_args()

    init_env()
    result = process_video(args.video, fps=args.fps, ocr=args.ocr, max_frames=args.max_frames, max_hamming=args.max_hamming)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
