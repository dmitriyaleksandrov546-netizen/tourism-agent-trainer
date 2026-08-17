# Dialog logs storage

T-TRAINER can store test dialogues in two modes:

1. **Supabase** — shared server-side history for all testers.
2. **localStorage fallback** — local history in one browser when Supabase env is not configured.

## Supabase table

Create this table in Supabase SQL Editor:

```sql
create table if not exists public.dialog_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  scenario_id text not null,
  scenario_title text not null,
  scenario_subtitle text,
  level text,
  score integer,
  verdict text,
  messages jsonb not null default '[]'::jsonb,
  last_agent text,
  last_client text,
  source text not null default 'web'
);

create index if not exists dialog_logs_created_at_idx
  on public.dialog_logs (created_at desc);

create index if not exists dialog_logs_scenario_id_idx
  on public.dialog_logs (scenario_id);
```

Do **not** expose the service role key in frontend code.

## Travel document monitoring snapshots

Daily Vercel cron jobs need a shared baseline, otherwise every run starts from an empty browser and cannot detect real day-to-day changes. Create this table too:

```sql
create table if not exists public.travel_document_snapshots (
  country text primary key,
  snapshots jsonb not null default '[]'::jsonb,
  last_report jsonb,
  checked_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists travel_document_snapshots_checked_at_idx
  on public.travel_document_snapshots (checked_at desc);
```

The application upserts one row per country. Vercel cron calls `/api/travel-documents/monitor/<country>` every morning, loads the previous snapshots from Supabase, fetches official sources, compares fingerprints and saves the new baseline.

## Vercel env

Add these variables in Vercel project settings:

```text
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-only service role key>
SUPABASE_DIALOG_LOGS_TABLE=dialog_logs
SUPABASE_TRAVEL_DOCUMENT_SNAPSHOTS_TABLE=travel_document_snapshots
```

Keep existing LLM variables:

```text
LLM_PROVIDER=openai
LLM_MODEL=gpt-4.1
OPENAI_API_KEY=<secret>
ALLOWED_ORIGINS=https://www.ttrainer.ru,https://ttrainer.ru
```

## Health check

Open:

```text
https://www.ttrainer.ru/api/neuroclient/health
```

Expected after Supabase setup:

```json
{
  "dialogLogs": {
    "provider": "supabase",
    "configured": true,
    "table": "dialog_logs"
  }
}
```

## UX

In the app:

```text
Меню → История тестов
```

The panel shows whether storage is `Supabase база` or local browser fallback.
