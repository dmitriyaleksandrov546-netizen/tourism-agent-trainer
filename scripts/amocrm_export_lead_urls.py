#!/usr/bin/env python3
"""Export amoCRM lead URLs for browser scraping.

Uses existing private-data/amocrm/.env OAuth token.
Writes private-data/browser-scrape/lead-urls.txt.
"""
from __future__ import annotations

import argparse
import json
import os
import pathlib
import time
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / "private-data" / "amocrm" / ".env"
OUT_DIR = ROOT / "private-data" / "browser-scrape"


def load_env() -> dict[str, str]:
    vals: dict[str, str] = {}
    for line in ENV_PATH.read_text(encoding="utf-8", errors="ignore").splitlines():
        if "=" in line and not line.strip().startswith("#"):
            key, value = line.split("=", 1)
            vals[key] = value
    return vals


def get_json(base_url: str, token: str, path: str, params: dict[str, object] | None = None) -> dict:
    url = base_url.rstrip("/") + path
    if params:
        url += "?" + urllib.parse.urlencode(params, doseq=True)
    request = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}", "User-Agent": "tourism-platform-browser-export/0.1"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=200)
    parser.add_argument("--pipeline-id", default=None)
    parser.add_argument("--status-id", default=None)
    parser.add_argument("--query", default=None)
    args = parser.parse_args()

    vals = load_env()
    base_url = vals["AMOCRM_BASE_URL"]
    token = vals["AMOCRM_ACCESS_TOKEN"]
    hostname = urllib.parse.urlparse(base_url).hostname or ""
    subdomain = vals.get("AMOCRM_SUBDOMAIN") or hostname.split(".")[0]
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    urls: list[str] = []
    page = 1
    while len(urls) < args.limit:
        params: dict[str, object] = {"limit": min(250, args.limit - len(urls)), "page": page, "order[updated_at]": "desc"}
        if args.pipeline_id:
            params["filter[pipeline_id]"] = args.pipeline_id
        if args.status_id:
            params["filter[statuses][0][status_id]"] = args.status_id
        if args.query:
            params["query"] = args.query
        data = get_json(base_url, token, "/api/v4/leads", params)
        leads = ((data.get("_embedded") or {}).get("leads") or [])
        if not leads:
            break
        for lead in leads:
            lead_id = lead.get("id")
            if lead_id:
                urls.append(f"https://{subdomain}.amocrm.ru/leads/detail/{lead_id}")
        if not (data.get("_links") or {}).get("next"):
            break
        page += 1
        time.sleep(0.2)

    out = OUT_DIR / "lead-urls.txt"
    out.write_text("\n".join(urls) + "\n", encoding="utf-8")
    print(json.dumps({"ok": True, "count": len(urls), "path": str(out)}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
