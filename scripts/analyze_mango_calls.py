#!/usr/bin/env python3
"""Download, transcribe and score Mango call recordings linked from amoCRM notes.

Private outputs live under private-data/mango-calls/ and are git-ignored.
"""
from __future__ import annotations

import argparse
import json
import os
import pathlib
import re
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

ROOT = pathlib.Path(__file__).resolve().parents[1]
AMO_ENV = ROOT / "private-data" / "amocrm" / ".env"
DATA_DIR = ROOT / "private-data" / "mango-calls"
AUDIO_DIR = DATA_DIR / "audio"
TRANSCRIPT_DIR = DATA_DIR / "transcripts"
SCORED_DIR = DATA_DIR / "scored"
SUMMARY_PATH = DATA_DIR / "summary.json"
INDEX_PATH = DATA_DIR / "index.jsonl"


@dataclass
class CallCandidate:
    lead_id: int
    lead_name: str
    responsible_user_id: int | None
    note_id: int
    created_at: int | None
    duration: int | None
    link: str


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def ensure_dirs() -> None:
    for directory in [DATA_DIR, AUDIO_DIR, TRANSCRIPT_DIR, SCORED_DIR]:
        directory.mkdir(parents=True, exist_ok=True)


def load_env_file(path: pathlib.Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip()
        os.environ.setdefault(key.strip(), value.strip())
    return values


def init_env() -> dict[str, str]:
    values = load_env_file(AMO_ENV)
    load_env_file(pathlib.Path.home() / ".hermes" / ".env")
    return values


def write_env_file(path: pathlib.Path, values: dict[str, str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    existing_order: list[str] = []
    if path.exists():
        for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
            if "=" in line and not line.strip().startswith("#"):
                key = line.split("=", 1)[0]
                if key not in existing_order:
                    existing_order.append(key)
    for key in values:
        if key not in existing_order:
            existing_order.append(key)
    path.write_text("\n".join(f"{key}={values[key]}" for key in existing_order if key in values) + "\n", encoding="utf-8")


def refresh_amo_token(env: dict[str, str]) -> dict[str, str]:
    payload = {
        "client_id": env["AMOCRM_CLIENT_ID"],
        "client_secret": env["AMOCRM_CLIENT_SECRET"],
        "grant_type": "refresh_token",
        "refresh_token": env["AMOCRM_REFRESH_TOKEN"],
        "redirect_uri": env.get("AMOCRM_REDIRECT_URI", "https://oauth.pstmn.io/v1/callback"),
    }
    req = urllib.request.Request(
        env["AMOCRM_BASE_URL"].rstrip("/") + "/oauth2/access_token",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as response:
        data = json.loads(response.read().decode("utf-8"))
    env["AMOCRM_ACCESS_TOKEN"] = data["access_token"]
    env["AMOCRM_REFRESH_TOKEN"] = data["refresh_token"]
    env["AMOCRM_TOKEN_EXPIRES_IN"] = str(data.get("expires_in", ""))
    env["AMOCRM_TOKEN_RECEIVED_AT"] = str(int(time.time()))
    write_env_file(AMO_ENV, env)
    return env


def amo_get(base_url: str, token: str, path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    url = base_url.rstrip("/") + path
    if params:
        url += "?" + urllib.parse.urlencode(params, doseq=True)
    req = urllib.request.Request(
        url,
        headers={"Authorization": f"Bearer {token}", "User-Agent": "tourism-mango-call-analyzer/0.1"},
    )
    with urllib.request.urlopen(req, timeout=60) as response:
        raw = response.read().decode("utf-8")
        if not raw.strip():
            return {}
        return json.loads(raw)


def fetch_leads(base_url: str, token: str, limit: int, updated_since: int | None = None) -> list[dict[str, Any]]:
    leads: list[dict[str, Any]] = []
    page = 1
    while len(leads) < limit:
        params: dict[str, Any] = {
            "limit": min(250, limit - len(leads)),
            "page": page,
            "order[updated_at]": "desc",
            "with": "contacts",
        }
        if updated_since:
            params["filter[updated_at][from]"] = updated_since
        data = amo_get(base_url, token, "/api/v4/leads", params)
        page_leads = ((data.get("_embedded") or {}).get("leads") or [])
        if not page_leads:
            break
        leads.extend(page_leads)
        if not (data.get("_links") or {}).get("next"):
            break
        page += 1
        time.sleep(0.2)
    return leads


def extract_link_from_note(note: dict[str, Any]) -> str | None:
    params = note.get("params") or {}
    for key in ["link", "record_link", "url", "record_url"]:
        value = params.get(key)
        if isinstance(value, str) and value.startswith("http"):
            return value
    # Some amo notes store links in text / text_html.
    for key in ["text", "text_html", "service_message"]:
        value = note.get(key) or params.get(key)
        if isinstance(value, str):
            match = re.search(r"https?://[^\s\"'<>]+", value)
            if match and "mango" in match.group(0).lower():
                return match.group(0)
    return None


def fetch_call_candidates(base_url: str, token: str, lead_limit: int, call_limit: int) -> list[CallCandidate]:
    leads = fetch_leads(base_url, token, lead_limit)
    candidates: list[CallCandidate] = []
    seen_links: set[str] = set()
    for lead in leads:
        lead_id = lead.get("id")
        if not lead_id:
            continue
        try:
            notes = amo_get(base_url, token, f"/api/v4/leads/{lead_id}/notes", {"limit": 250})
        except urllib.error.HTTPError:
            continue
        for note in ((notes.get("_embedded") or {}).get("notes") or []):
            note_type = str(note.get("note_type") or note.get("type") or "").lower()
            link = extract_link_from_note(note)
            if not link or "mango" not in link.lower() or link in seen_links:
                continue
            seen_links.add(link)
            params = note.get("params") or {}
            duration = params.get("duration") or params.get("call_duration")
            try:
                duration_int = int(duration) if duration is not None else None
            except Exception:
                duration_int = None
            candidates.append(CallCandidate(
                lead_id=int(lead_id),
                lead_name=str(lead.get("name") or ""),
                responsible_user_id=lead.get("responsible_user_id"),
                note_id=int(note.get("id") or 0),
                created_at=note.get("created_at"),
                duration=duration_int,
                link=link,
            ))
            if len(candidates) >= call_limit:
                return candidates
        time.sleep(0.15)
    return candidates


def download_call(candidate: CallCandidate) -> pathlib.Path:
    filename = f"lead-{candidate.lead_id}-note-{candidate.note_id}.mp3"
    target = AUDIO_DIR / filename
    if target.exists() and target.stat().st_size > 1024:
        return target
    req = urllib.request.Request(candidate.link, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=120) as response, target.open("wb") as out:
        while True:
            chunk = response.read(1024 * 1024)
            if not chunk:
                break
            out.write(chunk)
    return target


def media_duration_seconds(path: pathlib.Path) -> float | None:
    try:
        proc = subprocess.run([
            "ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nokey=1:noprint_wrappers=1", str(path)
        ], text=True, capture_output=True, check=True, timeout=30)
        return round(float(proc.stdout.strip()), 2)
    except Exception:
        return None


def clip_audio(input_path: pathlib.Path, max_seconds: int) -> pathlib.Path:
    if max_seconds <= 0:
        return input_path
    duration = media_duration_seconds(input_path)
    if not duration or duration <= max_seconds:
        return input_path
    clipped = input_path.with_name(input_path.stem + f"-first{max_seconds}s.mp3")
    if clipped.exists() and clipped.stat().st_size > 1024:
        return clipped
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(input_path), "-t", str(max_seconds), "-ac", "1", "-ar", "16000", str(clipped)
    ], check=True, timeout=120)
    return clipped


def split_audio_chunks(audio_path: pathlib.Path, chunk_seconds: int) -> list[pathlib.Path]:
    duration = media_duration_seconds(audio_path) or 0
    if chunk_seconds <= 0 or duration <= chunk_seconds and audio_path.stat().st_size < 24 * 1024 * 1024:
        return [audio_path]
    chunks_dir = AUDIO_DIR / "chunks" / audio_path.stem
    chunks_dir.mkdir(parents=True, exist_ok=True)
    existing = sorted(chunks_dir.glob("chunk-*.mp3"))
    if existing:
        return existing
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(audio_path),
        "-f", "segment", "-segment_time", str(chunk_seconds), "-ac", "1", "-ar", "16000",
        str(chunks_dir / "chunk-%03d.mp3"),
    ], check=True, timeout=max(180, int(duration) + 60))
    return sorted(chunks_dir.glob("chunk-*.mp3"))


def transcribe_audio(audio_path: pathlib.Path, chunk_seconds: int = 600) -> dict[str, Any]:
    out_path = TRANSCRIPT_DIR / (audio_path.stem + ".json")
    if out_path.exists():
        return json.loads(out_path.read_text(encoding="utf-8"))
    from openai import OpenAI
    client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    model = os.environ.get("OPENAI_TRANSCRIBE_MODEL", "gpt-4o-mini-transcribe")
    chunks = split_audio_chunks(audio_path, chunk_seconds)
    parts: list[dict[str, Any]] = []
    for index, chunk in enumerate(chunks, start=1):
        with chunk.open("rb") as file:
            result = client.audio.transcriptions.create(
                model=model,
                file=file,
                language="ru",
                response_format="json",
            )
        if hasattr(result, "model_dump"):
            part = result.model_dump()
        else:
            part = json.loads(result.json())
        part["chunk_index"] = index
        part["chunk_file"] = str(chunk)
        parts.append(part)
    data = {
        "text": "\n".join(str(part.get("text") or "").strip() for part in parts if str(part.get("text") or "").strip()),
        "parts": parts,
    }
    data["audio_file"] = str(audio_path)
    data["chunk_count"] = len(chunks)
    data["transcribed_at"] = utc_now()
    out_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return data


def build_scoring_prompt(candidate: CallCandidate, transcript: str, audio_duration: float | None) -> list[dict[str, str]]:
    clipped = transcript[:20000]
    system = """Ты руководитель отдела продаж в туризме и методолог обучения турагентов.
Анализируешь транскрипт звонка. Не выдумывай то, чего в звонке нет. Персональные данные игнорируй.
Верни строго JSON без markdown.
Оценивай практично: выявление потребностей, бюджет, даты, состав туристов, дети, отельные риски, альтернативы, следующий шаг, тон, закрытие.
"""
    user = f"""lead_id: {candidate.lead_id}
note_id: {candidate.note_id}
audio_duration_sec: {audio_duration}

Транскрипт звонка:
{clipped}

Верни JSON:
{{
  "lead_id": {candidate.lead_id},
  "score": 0-100,
  "readiness": "good|control_needed|risk",
  "call_type": "first_contact|selection|objection|booking|post_sale|unknown",
  "direction_or_request": "направление/запрос или unknown",
  "client_need": "коротко",
  "outcome_guess": "next_step_set|needs_followup|lost_risk|unknown",
  "agent_strong_moves": ["..."],
  "agent_mistakes": ["..."],
  "missed_questions": ["..."],
  "risk_flags": ["..."],
  "useful_client_phrases_for_simulator": ["..."],
  "training_scenario_seed": {{"title":"...","client_start_message":"...","hidden_need":"...","difficulty":"standard|medium|hard"}},
  "manager_summary": "1-2 предложения по-русски"
}}
"""
    return [{"role": "system", "content": system}, {"role": "user", "content": user}]


def score_transcript(candidate: CallCandidate, transcript: str, audio_duration: float | None, force: bool = False) -> dict[str, Any]:
    out_path = SCORED_DIR / f"lead-{candidate.lead_id}-note-{candidate.note_id}.json"
    if out_path.exists() and not force:
        return json.loads(out_path.read_text(encoding="utf-8"))
    from openai import OpenAI
    client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    response = client.chat.completions.create(
        model=os.environ.get("OPENAI_SCORING_MODEL", "gpt-4.1-mini"),
        messages=build_scoring_prompt(candidate, transcript, audio_duration),
        temperature=0.2,
        response_format={"type": "json_object"},
        max_tokens=1800,
    )
    content = response.choices[0].message.content or "{}"
    data = json.loads(content)
    data.update({
        "lead_id": candidate.lead_id,
        "note_id": candidate.note_id,
        "responsible_user_id": candidate.responsible_user_id,
        "call_created_at": candidate.created_at,
        "audio_duration_sec": audio_duration,
        "processed_at": utc_now(),
    })
    out_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    with INDEX_PATH.open("a", encoding="utf-8") as index:
        index.write(json.dumps(data, ensure_ascii=False) + "\n")
    return data


def write_summary(items: list[dict[str, Any]]) -> dict[str, Any]:
    all_items_by_key: dict[str, dict[str, Any]] = {}
    for path in SCORED_DIR.glob("*.json"):
        try:
            item = json.loads(path.read_text(encoding="utf-8"))
            key = f"{item.get('lead_id')}:{item.get('note_id')}"
            all_items_by_key[key] = item
        except Exception:
            continue
    for item in items:
        key = f"{item.get('lead_id')}:{item.get('note_id')}"
        all_items_by_key[key] = item
    items = list(all_items_by_key.values())
    total = len(items)
    avg = round(sum(int(item.get("score") or 0) for item in items) / total, 1) if total else 0
    readiness: dict[str, int] = {}
    mistakes: dict[str, int] = {}
    directions: dict[str, int] = {}
    for item in items:
        readiness[item.get("readiness", "unknown")] = readiness.get(item.get("readiness", "unknown"), 0) + 1
        direction = item.get("direction_or_request") or "unknown"
        directions[direction] = directions.get(direction, 0) + 1
        for mistake in item.get("agent_mistakes") or []:
            mistakes[mistake] = mistakes.get(mistake, 0) + 1
    summary = {
        "updated_at": utc_now(),
        "total_calls": total,
        "average_score": avg,
        "readiness": readiness,
        "top_directions": sorted(directions.items(), key=lambda kv: kv[1], reverse=True)[:10],
        "top_mistakes": sorted(mistakes.items(), key=lambda kv: kv[1], reverse=True)[:20],
        "calls": [
            {
                "lead_id": item.get("lead_id"),
                "score": item.get("score"),
                "readiness": item.get("readiness"),
                "call_type": item.get("call_type"),
                "direction_or_request": item.get("direction_or_request"),
                "outcome_guess": item.get("outcome_guess"),
                "manager_summary": item.get("manager_summary"),
            }
            for item in items
        ],
    }
    SUMMARY_PATH.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    return summary


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lead-limit", type=int, default=80)
    parser.add_argument("--call-limit", type=int, default=5)
    parser.add_argument("--max-seconds", type=int, default=240, help="clip long calls to first N seconds for quick pass")
    parser.add_argument("--chunk-seconds", type=int, default=600, help="split long/full audio into chunks before transcription")
    parser.add_argument("--force-rescore", action="store_true", help="overwrite existing call score JSON files")
    parser.add_argument("--download-only", action="store_true")
    args = parser.parse_args()

    ensure_dirs()
    env = init_env()
    base_url = env.get("AMOCRM_BASE_URL")
    token = env.get("AMOCRM_ACCESS_TOKEN")
    if not base_url or not token:
        raise RuntimeError("AMOCRM_BASE_URL / AMOCRM_ACCESS_TOKEN missing in private-data/amocrm/.env")
    try:
        env = refresh_amo_token(env)
        base_url = env["AMOCRM_BASE_URL"]
        token = env["AMOCRM_ACCESS_TOKEN"]
        print(json.dumps({"stage": "amo_token_refreshed"}, ensure_ascii=False), flush=True)
    except Exception as error:
        print(json.dumps({"stage": "amo_token_refresh_failed", "error": f"{type(error).__name__}: {error}"}, ensure_ascii=False), flush=True)
    if not os.environ.get("OPENAI_API_KEY") and not args.download_only:
        raise RuntimeError("OPENAI_API_KEY missing")

    candidates = fetch_call_candidates(base_url, token, args.lead_limit, args.call_limit)
    (DATA_DIR / "candidates.json").write_text(json.dumps([candidate.__dict__ for candidate in candidates], ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"stage": "candidates", "count": len(candidates)}, ensure_ascii=False), flush=True)

    scored: list[dict[str, Any]] = []
    for candidate in candidates:
        audio = download_call(candidate)
        duration = media_duration_seconds(audio)
        print(json.dumps({"stage": "downloaded", "lead_id": candidate.lead_id, "note_id": candidate.note_id, "bytes": audio.stat().st_size, "duration": duration}, ensure_ascii=False), flush=True)
        if args.download_only:
            continue
        clipped = clip_audio(audio, args.max_seconds)
        clipped_duration = media_duration_seconds(clipped)
        transcription = transcribe_audio(clipped, chunk_seconds=args.chunk_seconds)
        transcript = transcription.get("text") or ""
        score = score_transcript(candidate, transcript, clipped_duration, force=args.force_rescore)
        scored.append(score)
        print(json.dumps({"stage": "scored", "lead_id": candidate.lead_id, "score": score.get("score"), "readiness": score.get("readiness")}, ensure_ascii=False), flush=True)
    if scored:
        summary = write_summary(scored)
        print(json.dumps({"stage": "summary", "path": str(SUMMARY_PATH), "total_calls": summary["total_calls"], "average_score": summary["average_score"]}, ensure_ascii=False), flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
