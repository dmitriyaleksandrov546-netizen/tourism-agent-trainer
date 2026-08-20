const API_URL = '/api/dialog-logs';

export async function fetchServerDialogHistory() {
  try {
    const response = await fetch(API_URL, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`API ${response.status}`);
    const data = await response.json();
    if (!data?.ok || !Array.isArray(data.records)) return { ok: false, configured: Boolean(data?.configured), records: [] };
    return { ok: true, configured: true, records: data.records.map(mapServerRecord) };
  } catch (error) {
    return { ok: false, configured: false, records: [], error: error?.message || 'dialog logs unavailable' };
  }
}

export async function saveServerDialogRecord(record) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ record })
    });
    const data = await response.json();
    if (!response.ok || !data?.ok) return { ok: false, configured: Boolean(data?.configured), error: data?.error };
    return { ok: true, configured: true, record: mapServerRecord(data.record) };
  } catch (error) {
    return { ok: false, configured: false, error: error?.message || 'failed to save dialog log' };
  }
}

export async function deleteServerDialogRecord(id) {
  try {
    const response = await fetch(API_URL, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id })
    });
    const data = await response.json();
    return { ok: response.ok && Boolean(data?.ok), configured: Boolean(data?.configured ?? true) };
  } catch (error) {
    return { ok: false, configured: false, error: error?.message || 'failed to delete dialog log' };
  }
}

function mapServerRecord(row = {}) {
  return {
    id: row.id,
    createdAt: row.created_at,
    scenarioId: row.scenario_id,
    scenarioTitle: row.scenario_title,
    scenarioSubtitle: row.scenario_subtitle,
    level: row.level,
    score: row.score,
    verdict: row.verdict,
    accountId: row.account_id || row.accountId || '',
    accountName: row.account_name || row.accountName || 'Без аккаунта',
    accountRole: row.account_role || row.accountRole || '',
    messages: row.messages || [],
    lastAgent: row.last_agent || '',
    lastClient: row.last_client || ''
  };
}
