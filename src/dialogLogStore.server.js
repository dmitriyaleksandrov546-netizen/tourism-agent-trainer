const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TABLE = process.env.SUPABASE_DIALOG_LOGS_TABLE || 'dialog_logs';

export function getDialogLogStoreStatus() {
  return {
    provider: 'supabase',
    configured: Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY),
    table: TABLE
  };
}

function supabaseRestUrl(path = '') {
  return `${SUPABASE_URL?.replace(/\/$/, '')}/rest/v1/${TABLE}${path}`;
}

async function requestSupabase(path, { method = 'GET', body } = {}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    const error = new Error('Supabase dialog log store is not configured');
    error.code = 'SUPABASE_NOT_CONFIGURED';
    throw error;
  }

  const response = await fetch(supabaseRestUrl(path), {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: method === 'POST' || method === 'PATCH' ? 'return=representation' : 'return=minimal'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = new Error(data?.message || `Supabase ${response.status}`);
    error.status = response.status;
    error.details = data;
    throw error;
  }
  return data;
}

export async function listDialogLogs({ limit = 50 } = {}) {
  return requestSupabase(`?select=*&order=created_at.desc&limit=${encodeURIComponent(limit)}`);
}

function buildDialogPayload(record, { accountMode = 'login' } = {}) {
  const payload = {
    scenario_id: record.scenarioId,
    scenario_title: record.scenarioTitle,
    scenario_subtitle: record.scenarioSubtitle,
    level: record.level,
    score: record.score,
    verdict: record.verdict,
    messages: record.messages,
    last_agent: record.lastAgent,
    last_client: record.lastClient,
    source: record.source || 'web'
  };
  if (accountMode !== 'none') {
    payload.account_id = record.accountId || '';
    payload.account_name = record.accountName || record.accountLogin || 'Без аккаунта';
  }
  if (accountMode === 'login') {
    payload.account_login = record.accountLogin || record.accountName || '';
  }
  return payload;
}

export async function createDialogLog(record) {
  try {
    const rows = await requestSupabase('', { method: 'POST', body: buildDialogPayload(record) });
    return Array.isArray(rows) ? rows[0] : rows;
  } catch (error) {
    const accountLoginMissing = error?.status === 400 && /account_login/i.test(`${error.message || ''} ${JSON.stringify(error.details || {})}`);
    const accountColumnsMissing = error?.status === 400 && /account_/i.test(`${error.message || ''} ${JSON.stringify(error.details || {})}`);
    if (accountLoginMissing) {
      const rows = await requestSupabase('', { method: 'POST', body: buildDialogPayload(record, { accountMode: 'legacy' }) });
      return Array.isArray(rows) ? rows[0] : rows;
    }
    if (!accountColumnsMissing) throw error;
    const rows = await requestSupabase('', { method: 'POST', body: buildDialogPayload(record, { accountMode: 'none' }) });
    return Array.isArray(rows) ? rows[0] : rows;
  }
}

export async function updateDialogLog(id, record) {
  if (!id) return createDialogLog(record);
  try {
    const rows = await requestSupabase(`?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: buildDialogPayload(record) });
    return Array.isArray(rows) ? rows[0] : rows;
  } catch (error) {
    const accountLoginMissing = error?.status === 400 && /account_login/i.test(`${error.message || ''} ${JSON.stringify(error.details || {})}`);
    const accountColumnsMissing = error?.status === 400 && /account_/i.test(`${error.message || ''} ${JSON.stringify(error.details || {})}`);
    if (accountLoginMissing) {
      const rows = await requestSupabase(`?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: buildDialogPayload(record, { accountMode: 'legacy' }) });
      return Array.isArray(rows) ? rows[0] : rows;
    }
    if (!accountColumnsMissing) throw error;
    const rows = await requestSupabase(`?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: buildDialogPayload(record, { accountMode: 'none' }) });
    return Array.isArray(rows) ? rows[0] : rows;
  }
}

export async function deleteDialogLog(id) {
  return requestSupabase(`?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
}
