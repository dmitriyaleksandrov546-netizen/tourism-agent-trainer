const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TABLE = process.env.SUPABASE_TRAVEL_DOCUMENT_SNAPSHOTS_TABLE || 'travel_document_snapshots';

export function getTravelDocumentSnapshotStoreStatus() {
  return {
    provider: 'supabase',
    configured: Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY),
    table: TABLE
  };
}

function supabaseRestUrl(path = '') {
  return `${SUPABASE_URL?.replace(/\/$/, '')}/rest/v1/${TABLE}${path}`;
}

async function requestSupabase(path, { method = 'GET', body, prefer = 'return=representation' } = {}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    const error = new Error('Supabase travel document snapshot store is not configured');
    error.code = 'SUPABASE_NOT_CONFIGURED';
    throw error;
  }

  const response = await fetch(supabaseRestUrl(path), {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: prefer
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

export async function loadTravelDocumentSnapshots(country) {
  const rows = await requestSupabase(`?country=eq.${encodeURIComponent(country)}&select=country,snapshots,last_report,checked_at&limit=1`);
  const row = Array.isArray(rows) ? rows[0] : null;
  return Array.isArray(row?.snapshots) ? row.snapshots : [];
}

export async function saveTravelDocumentSnapshots(country, snapshots = [], report = {}) {
  const payload = {
    country,
    snapshots,
    last_report: report,
    checked_at: report.checkedAt || new Date().toISOString()
  };

  const rows = await requestSupabase('?on_conflict=country', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=representation',
    body: payload
  });
  return Array.isArray(rows) ? rows[0] : rows;
}

export const travelDocumentSnapshotStore = {
  loadSnapshots: loadTravelDocumentSnapshots,
  saveSnapshots: saveTravelDocumentSnapshots
};
