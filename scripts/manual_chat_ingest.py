#!/usr/bin/env python3
"""Manual chat import + scoring pipeline for historical Wazzup/amoCRM conversations.

Drop copied/exported chat files into private-data/manual-chats/inbox/.
The script redacts PII, scores each file as one conversation, and writes JSONL/JSON artifacts.

Supported input: .txt, .md, .csv, .json, .html/.htm
Ignored by git: private-data/
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import html
import json
import os
import re
import shutil
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "private-data" / "manual-chats"
INBOX_DIR = DATA_DIR / "inbox"
PROCESSED_DIR = DATA_DIR / "processed"
FAILED_DIR = DATA_DIR / "failed"
REDACTED_DIR = DATA_DIR / "redacted"
SCORED_DIR = DATA_DIR / "scored"
STATE_DIR = DATA_DIR / "state"
INDEX_PATH = SCORED_DIR / "index.jsonl"
SUMMARY_PATH = SCORED_DIR / "summary.json"
SUPPORTED_EXTENSIONS = {".txt", ".md", ".csv", ".json", ".html", ".htm"}


@dataclass
class ProcessResult:
    path: str
    conversation_id: str
    status: str
    score: int | None = None
    error: str | None = None


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def ensure_dirs() -> None:
    for directory in [INBOX_DIR, PROCESSED_DIR, FAILED_DIR, REDACTED_DIR, SCORED_DIR, STATE_DIR]:
        directory.mkdir(parents=True, exist_ok=True)


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


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def read_input_file(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix in {".txt", ".md"}:
        return path.read_text(encoding="utf-8", errors="ignore")
    if suffix in {".html", ".htm"}:
        raw = path.read_text(encoding="utf-8", errors="ignore")
        raw = re.sub(r"(?is)<(script|style).*?>.*?</\\1>", " ", raw)
        raw = re.sub(r"(?is)<br\s*/?>", "\n", raw)
        raw = re.sub(r"(?is)</p>|</div>|</li>|</tr>", "\n", raw)
        return html.unescape(re.sub(r"(?is)<[^>]+>", " ", raw))
    if suffix == ".csv":
        rows: list[str] = []
        with path.open("r", encoding="utf-8", errors="ignore", newline="") as file:
            sample = file.read(4096)
            file.seek(0)
            dialect = csv.Sniffer().sniff(sample, delimiters=",;\t|") if sample.strip() else csv.excel
            reader = csv.reader(file, dialect)
            for row in reader:
                rows.append(" | ".join(cell.strip() for cell in row if cell and cell.strip()))
        return "\n".join(row for row in rows if row)
    if suffix == ".json":
        data = json.loads(path.read_text(encoding="utf-8", errors="ignore"))
        return flatten_json(data)
    raise ValueError(f"unsupported extension: {suffix}")


def flatten_json(data: Any, prefix: str = "") -> str:
    lines: list[str] = []
    if isinstance(data, dict):
        for key, value in data.items():
            next_prefix = f"{prefix}.{key}" if prefix else str(key)
            if isinstance(value, (dict, list)):
                nested = flatten_json(value, next_prefix)
                if nested:
                    lines.append(nested)
            else:
                lines.append(f"{next_prefix}: {value}")
    elif isinstance(data, list):
        for index, value in enumerate(data):
            nested = flatten_json(value, f"{prefix}[{index}]")
            if nested:
                lines.append(nested)
    else:
        lines.append(f"{prefix}: {data}")
    return "\n".join(lines)


def normalize_text(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def redact_pii(text: str) -> str:
    text = re.sub(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", "[EMAIL]", text)
    text = re.sub(r"(?<!\d)(?:\+?7|8)[\s\-()]*\d{3}[\s\-()]*\d{3}[\s\-()]*\d{2}[\s\-()]*\d{2}(?!\d)", "[PHONE]", text)
    text = re.sub(r"(?<!\d)\d{10,15}(?!\d)", "[LONG_NUMBER]", text)
    text = re.sub(r"\b\d{4}\s?\d{6}\b", "[PASSPORT]", text)
    text = re.sub(r"https?://\S+", "[URL]", text)
    return text


def parse_messages(redacted_text: str) -> list[dict[str, str]]:
    messages: list[dict[str, str]] = []
    current_role = "unknown"
    buffer: list[str] = []

    role_patterns = [
        (re.compile(r"^(клиент|client|customer|покупатель|турист)\s*[:：-]\s*(.*)$", re.I), "client"),
        (re.compile(r"^(агент|agent|manager|менеджер|оператор|сотрудник)\s*[:：-]\s*(.*)$", re.I), "agent"),
    ]

    def flush() -> None:
        nonlocal buffer, current_role
        text = "\n".join(buffer).strip()
        if text:
            messages.append({"role": current_role, "text": text})
        buffer = []

    for raw_line in redacted_text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        matched = False
        for pattern, role in role_patterns:
            match = pattern.match(line)
            if match:
                flush()
                current_role = role
                tail = match.group(2).strip()
                if tail:
                    buffer.append(tail)
                matched = True
                break
        if not matched:
            buffer.append(line)
    flush()

    if len(messages) <= 1:
        return [{"role": "dialogue", "text": redacted_text}]
    return messages


def build_score_prompt(conversation_id: str, messages: list[dict[str, str]], redacted_text: str) -> dict[str, str]:
    clipped = redacted_text[:18000]
    system = """Ты эксперт по продажам в туризме и QA руководителя турагентства.
Твоя задача — разобрать реальную обезличенную переписку/диалог и вернуть СТРОГО JSON без markdown.
Не выдумывай факты. Если данных нет — пиши null/unknown.
Оценивай конкретные действия менеджера: выявление потребностей, бюджет, даты, состав туристов, дети, отели, риски, возражения, альтернативы, следующий шаг, тон.
"""
    user = f"""conversation_id: {conversation_id}

Диалог/переписка:
{clipped}

Верни JSON по схеме:
{{
  "conversation_id": "...",
  "score": 0-100,
  "readiness": "good|control_needed|risk",
  "client_type": "...",
  "direction_or_request": "...",
  "outcome_guess": "won|lost|unknown",
  "objections": ["..."],
  "agent_strong_moves": ["..."],
  "agent_mistakes": ["..."],
  "missed_questions": ["..."],
  "risk_flags": ["..."],
  "best_client_phrases_for_simulator": ["..."],
  "training_scenario_seed": {{
    "title": "...",
    "client_start_message": "...",
    "hidden_need": "...",
    "difficulty": "standard|medium|hard"
  }},
  "manager_summary": "коротко по-русски, что делать с этим менеджером/сценарием"
}}
"""
    return {"system": system, "user": user}


def call_openai_json(prompt: dict[str, str]) -> dict[str, Any]:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is missing")
    model = os.environ.get("OPENAI_MODEL", "gpt-4.1-mini")
    payload = {
        "model": model,
        "temperature": 0.2,
        "max_tokens": 1800,
        "messages": [
            {"role": "system", "content": prompt["system"]},
            {"role": "user", "content": prompt["user"]},
        ],
        "response_format": {"type": "json_object"},
    }
    request = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=90) as response:
        data = json.loads(response.read().decode("utf-8"))
    content = data["choices"][0]["message"]["content"]
    return json.loads(content)


def fallback_score(conversation_id: str, redacted_text: str) -> dict[str, Any]:
    text = redacted_text.lower()
    checks = {
        "budget": any(word in text for word in ["бюджет", "сколько", "сумма", "₽", "руб"]),
        "dates": any(word in text for word in ["дата", "вылет", "когда", "ноч", "дней"]),
        "composition": any(word in text for word in ["дет", "взрос", "сем", "человек", "летит"]),
        "hotel": any(word in text for word in ["отель", "пляж", "питание", "номер", "территория"]),
        "next_step": any(word in text for word in ["созвон", "бронь", "предоплат", "пришлю", "подберу", "вернусь", "согласуем"]),
        "risk": any(word in text for word in ["риск", "предупреж", "отзывы", "строй", "депозит", "не гарантир"]),
    }
    score = 25 + sum(12 for ok in checks.values() if ok)
    score = min(92, score)
    missed = [name for name, ok in checks.items() if not ok]
    return {
        "conversation_id": conversation_id,
        "score": score,
        "readiness": "good" if score >= 75 else "control_needed" if score >= 55 else "risk",
        "client_type": "unknown",
        "direction_or_request": "unknown",
        "outcome_guess": "unknown",
        "objections": [],
        "agent_strong_moves": [name for name, ok in checks.items() if ok],
        "agent_mistakes": [],
        "missed_questions": missed,
        "risk_flags": ["fallback_rule_based_score_no_llm"],
        "best_client_phrases_for_simulator": [],
        "training_scenario_seed": {
            "title": "Ручной импорт переписки",
            "client_start_message": "unknown",
            "hidden_need": "unknown",
            "difficulty": "standard",
        },
        "manager_summary": "Скоринг сделан rule-based, без LLM. Для полноценного разбора нужен OPENAI_API_KEY.",
    }


def process_file(path: Path, use_ai: bool) -> ProcessResult:
    raw_bytes = path.read_bytes()
    digest = sha256_bytes(raw_bytes)
    conversation_id = f"manual-{digest[:12]}"
    score_path = SCORED_DIR / f"{conversation_id}.json"
    if score_path.exists():
        destination = PROCESSED_DIR / path.name
        if path.exists() and path.resolve() != destination.resolve():
            shutil.move(str(path), str(destination))
        existing = json.loads(score_path.read_text(encoding="utf-8"))
        return ProcessResult(str(path), conversation_id, "already_processed", existing.get("score"))

    try:
        raw_text = normalize_text(read_input_file(path))
        if len(raw_text) < 20:
            raise ValueError("file has too little text")
        redacted_text = redact_pii(raw_text)
        messages = parse_messages(redacted_text)

        redacted_path = REDACTED_DIR / f"{conversation_id}.txt"
        redacted_path.write_text(redacted_text + "\n", encoding="utf-8")

        if use_ai:
            try:
                scoring = call_openai_json(build_score_prompt(conversation_id, messages, redacted_text))
            except Exception as error:
                scoring = fallback_score(conversation_id, redacted_text)
                scoring["ai_error"] = f"{type(error).__name__}: {error}"
        else:
            scoring = fallback_score(conversation_id, redacted_text)

        scoring.update({
            "conversation_id": conversation_id,
            "source_file": path.name,
            "source_sha256": digest,
            "processed_at": utc_now(),
            "message_count_detected": len(messages),
            "redacted_path": str(redacted_path.relative_to(ROOT)),
        })
        score_path.write_text(json.dumps(scoring, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        with INDEX_PATH.open("a", encoding="utf-8") as index:
            index.write(json.dumps(scoring, ensure_ascii=False) + "\n")

        shutil.move(str(path), str(PROCESSED_DIR / path.name))
        update_summary()
        return ProcessResult(str(path), conversation_id, "processed", int(scoring.get("score", 0)))
    except Exception as error:
        FAILED_DIR.mkdir(parents=True, exist_ok=True)
        error_path = FAILED_DIR / f"{path.name}.error.txt"
        error_path.write_text(f"{utc_now()} {type(error).__name__}: {error}\n", encoding="utf-8")
        shutil.move(str(path), str(FAILED_DIR / path.name))
        return ProcessResult(str(path), conversation_id, "failed", None, f"{type(error).__name__}: {error}")


def update_summary() -> None:
    items: list[dict[str, Any]] = []
    if INDEX_PATH.exists():
        for line in INDEX_PATH.read_text(encoding="utf-8", errors="ignore").splitlines():
            if line.strip():
                try:
                    items.append(json.loads(line))
                except json.JSONDecodeError:
                    pass
    total = len(items)
    avg = round(sum(int(item.get("score", 0)) for item in items) / total, 1) if total else 0
    readiness: dict[str, int] = {}
    objections: dict[str, int] = {}
    mistakes: dict[str, int] = {}
    for item in items:
        readiness[item.get("readiness", "unknown")] = readiness.get(item.get("readiness", "unknown"), 0) + 1
        for objection in item.get("objections", []) or []:
            objections[objection] = objections.get(objection, 0) + 1
        for mistake in item.get("agent_mistakes", []) or []:
            mistakes[mistake] = mistakes.get(mistake, 0) + 1
    summary = {
        "updated_at": utc_now(),
        "total_conversations": total,
        "average_score": avg,
        "readiness": readiness,
        "top_objections": sorted(objections.items(), key=lambda kv: kv[1], reverse=True)[:20],
        "top_agent_mistakes": sorted(mistakes.items(), key=lambda kv: kv[1], reverse=True)[:20],
    }
    SUMMARY_PATH.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def iter_inbox_files() -> list[Path]:
    files = [path for path in INBOX_DIR.iterdir() if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS]
    return sorted(files, key=lambda p: p.stat().st_mtime)


def run_once(limit: int | None, use_ai: bool, quiet_idle: bool = False) -> list[ProcessResult]:
    ensure_dirs()
    files = iter_inbox_files()
    if limit is not None:
        files = files[:limit]
    results: list[ProcessResult] = []
    for path in files:
        result = process_file(path, use_ai=use_ai)
        results.append(result)
        print(json.dumps(result.__dict__, ensure_ascii=False), flush=True)
    if not files and not quiet_idle:
        print(json.dumps({"status": "idle", "inbox": str(INBOX_DIR)}, ensure_ascii=False), flush=True)
    return results


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--watch", action="store_true", help="keep scanning inbox forever")
    parser.add_argument("--once", action="store_true", help="process current inbox once")
    parser.add_argument("--interval", type=int, default=30, help="watch interval seconds")
    parser.add_argument("--limit", type=int, default=None, help="max files per pass")
    parser.add_argument("--no-ai", action="store_true", help="disable OpenAI scoring and use rule fallback")
    parser.add_argument("--quiet-idle", action="store_true", help="do not print anything when inbox is empty")
    args = parser.parse_args()

    init_env()
    ensure_dirs()
    use_ai = not args.no_ai

    if not args.watch:
        run_once(args.limit, use_ai, quiet_idle=args.quiet_idle)
        return 0

    print(json.dumps({"status": "watching", "inbox": str(INBOX_DIR), "interval": args.interval, "ai": use_ai}, ensure_ascii=False), flush=True)
    while True:
        run_once(args.limit, use_ai, quiet_idle=args.quiet_idle)
        time.sleep(args.interval)


if __name__ == "__main__":
    raise SystemExit(main())
