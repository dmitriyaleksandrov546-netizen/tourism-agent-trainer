const STORAGE_KEY = 'ttrainer.travelDocumentMonitoring.v1';

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

export function loadTravelMonitoringSnapshots(country) {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return Array.isArray(parsed[country]) ? parsed[country] : [];
  } catch (_error) {
    return [];
  }
}

export function saveTravelMonitoringSnapshots(country, snapshots = []) {
  if (!canUseStorage()) return snapshots;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[country] = snapshots;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch (_error) {
    // storage is best-effort only
  }
  return snapshots;
}

export async function requestTravelDocumentMonitoring({ country }) {
  const previousSnapshots = loadTravelMonitoringSnapshots(country);
  const response = await fetch(`/api/travel-documents/monitor?country=${encodeURIComponent(country)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ previousSnapshots })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) throw new Error(data?.error || `travel document monitor API ${response.status}`);
  if (Array.isArray(data.snapshots)) saveTravelMonitoringSnapshots(country, data.snapshots);
  return data;
}
