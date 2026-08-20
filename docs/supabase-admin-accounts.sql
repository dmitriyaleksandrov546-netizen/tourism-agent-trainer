-- T-TRAINER admin/accounts analytics fields for existing dialog_logs table.
-- Run once in Supabase SQL editor before relying on shared cross-device admin analytics.
-- Passwords are not written into dialog_logs.

alter table public.dialog_logs
  add column if not exists account_id text,
  add column if not exists account_name text,
  add column if not exists account_login text;

create index if not exists dialog_logs_account_id_idx
  on public.dialog_logs (account_id);

create index if not exists dialog_logs_account_created_idx
  on public.dialog_logs (account_id, created_at desc);
