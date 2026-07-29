#!/usr/bin/env python3
"""Stream all amoCRM leads page-by-page and analyze every Mango call recording found.

This avoids collecting all leads up front. It can run for hours and keeps writing progress.
"""
from __future__ import annotations

import argparse
import json
import pathlib
import sys
import time
import urllib.error
from typing import Any

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import analyze_mango_calls as core  # noqa: E402


def lead_pages(base_url: str, token: str, start_page: int, max_pages: int, limit_per_page: int):
    page = start_page
    pages_seen = 0
    while True:
        if max_pages and pages_seen >= max_pages:
            return
        params = {
            "limit": limit_per_page,
            "page": page,
            "order[updated_at]": "desc",
            "with": "contacts",
        }
        data = core.amo_get(base_url, token, "/api/v4/leads", params)
        leads = ((data.get("_embedded") or {}).get("leads") or [])
        print(json.dumps({"stage": "leads_page", "page": page, "leads": len(leads)}, ensure_ascii=False), flush=True)
        if not leads:
            return
        yield page, leads
        pages_seen += 1
        if not (data.get("_links") or {}).get("next"):
            return
        page += 1
        time.sleep(0.2)


def candidate_from_note(lead: dict[str, Any], note: dict[str, Any], link: str) -> core.CallCandidate:
    params = note.get("params") or {}
    duration = params.get("duration") or params.get("call_duration")
    try:
        duration_int = int(duration) if duration is not None else None
    except Exception:
        duration_int = None
    lead_id = lead.get("id")
    if lead_id is None:
        raise ValueError("lead id is missing")
    return core.CallCandidate(
        lead_id=int(lead_id),
        lead_name=str(lead.get("name") or ""),
        responsible_user_id=lead.get("responsible_user_id"),
        note_id=int(note.get("id") or 0),
        created_at=note.get("created_at"),
        duration=duration_int,
        link=link,
    )


def existing_keys() -> set[str]:
    keys: set[str] = set()
    for path in core.SCORED_DIR.glob("*.json"):
        try:
            item = json.loads(path.read_text(encoding="utf-8"))
            keys.add(f"{item.get('lead_id')}:{item.get('note_id')}")
        except Exception:
            continue
    return keys


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--start-page", type=int, default=1)
    parser.add_argument("--max-pages", type=int, default=0, help="0 = until amoCRM has no next page")
    parser.add_argument("--limit-per-page", type=int, default=250)
    parser.add_argument("--max-seconds", type=int, default=0, help="0 = full audio")
    parser.add_argument("--chunk-seconds", type=int, default=600)
    parser.add_argument("--force-rescore", action="store_true")
    parser.add_argument("--max-calls", type=int, default=0, help="0 = no limit")
    parser.add_argument("--summary-every", type=int, default=10)
    args = parser.parse_args()

    core.ensure_dirs()
    env = core.init_env()
    try:
        env = core.refresh_amo_token(env)
        print(json.dumps({"stage": "amo_token_refreshed"}, ensure_ascii=False), flush=True)
    except Exception as error:
        print(json.dumps({"stage": "amo_token_refresh_failed", "error": f"{type(error).__name__}: {error}"}, ensure_ascii=False), flush=True)

    base_url = env["AMOCRM_BASE_URL"]
    token = env["AMOCRM_ACCESS_TOKEN"]
    processed = 0
    skipped_existing = 0
    failed = 0
    scored_items: list[dict[str, Any]] = []
    seen_links: set[str] = set()
    keys = existing_keys()

    for page, leads in lead_pages(base_url, token, args.start_page, args.max_pages, args.limit_per_page):
        for lead in leads:
            lead_id = lead.get("id")
            if not lead_id:
                continue
            try:
                notes_data = core.amo_get(base_url, token, f"/api/v4/leads/{lead_id}/notes", {"limit": 250})
            except urllib.error.HTTPError as error:
                print(json.dumps({"stage": "notes_error", "lead_id": lead_id, "code": error.code}, ensure_ascii=False), flush=True)
                continue
            except Exception as error:
                print(json.dumps({"stage": "notes_error", "lead_id": lead_id, "error": f"{type(error).__name__}: {error}"}, ensure_ascii=False), flush=True)
                continue

            notes = ((notes_data.get("_embedded") or {}).get("notes") or [])
            for note in notes:
                link = core.extract_link_from_note(note)
                if not link or "mango" not in link.lower() or link in seen_links:
                    continue
                seen_links.add(link)
                candidate = candidate_from_note(lead, note, link)
                key = f"{candidate.lead_id}:{candidate.note_id}"
                if key in keys and not args.force_rescore:
                    skipped_existing += 1
                    continue
                try:
                    audio = core.download_call(candidate)
                    duration = core.media_duration_seconds(audio)
                    clipped = core.clip_audio(audio, args.max_seconds)
                    clipped_duration = core.media_duration_seconds(clipped)
                    transcription = core.transcribe_audio(clipped, chunk_seconds=args.chunk_seconds)
                    transcript = transcription.get("text") or ""
                    score = core.score_transcript(candidate, transcript, clipped_duration, force=args.force_rescore)
                    scored_items.append(score)
                    keys.add(key)
                    processed += 1
                    print(json.dumps({
                        "stage": "scored",
                        "page": page,
                        "lead_id": candidate.lead_id,
                        "note_id": candidate.note_id,
                        "duration": duration,
                        "score": score.get("score"),
                        "readiness": score.get("readiness"),
                        "processed": processed,
                    }, ensure_ascii=False), flush=True)
                    if processed % args.summary_every == 0:
                        summary = core.write_summary(scored_items)
                        print(json.dumps({"stage": "summary", "total_calls": summary["total_calls"], "average_score": summary["average_score"]}, ensure_ascii=False), flush=True)
                    if args.max_calls and processed >= args.max_calls:
                        summary = core.write_summary(scored_items)
                        print(json.dumps({"stage": "done_max_calls", "processed": processed, "skipped_existing": skipped_existing, "failed": failed, "summary_total": summary["total_calls"]}, ensure_ascii=False), flush=True)
                        return 0
                except Exception as error:
                    failed += 1
                    print(json.dumps({"stage": "call_error", "lead_id": candidate.lead_id, "note_id": candidate.note_id, "error": f"{type(error).__name__}: {error}", "failed": failed}, ensure_ascii=False), flush=True)
            time.sleep(0.05)

    summary = core.write_summary(scored_items)
    print(json.dumps({"stage": "done_all_pages", "processed": processed, "skipped_existing": skipped_existing, "failed": failed, "summary_total": summary["total_calls"], "average_score": summary["average_score"]}, ensure_ascii=False), flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
