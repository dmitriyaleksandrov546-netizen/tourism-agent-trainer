const STORAGE_KEY = 'ttrainer.dialogHistory.v1';
const MAX_RECORDS = 50;

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

export function loadDialogHistory() {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

export function saveDialogHistory(records = []) {
  if (!canUseStorage()) return [];
  const normalized = Array.isArray(records) ? records.slice(0, MAX_RECORDS) : [];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function createDialogRecord({ scenario, messages, evaluation }) {
  const agentMessages = messages.filter((message) => message.role === 'agent');
  const clientMessages = messages.filter((message) => message.role === 'client');
  const lastAgent = agentMessages.at(-1)?.text || '';
  const lastClient = clientMessages.at(-1)?.text || '';

  return {
    id: `dialog-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    scenarioId: scenario.id,
    scenarioTitle: scenario.shortTitle,
    scenarioSubtitle: scenario.shortSubtitle,
    level: scenario.level,
    score: evaluation?.score ?? null,
    verdict: evaluation?.verdict || '',
    messages,
    lastAgent,
    lastClient
  };
}

export function upsertDialogRecord(record) {
  const current = loadDialogHistory();
  const withoutSame = current.filter((item) => item.id !== record.id);
  return saveDialogHistory([record, ...withoutSame].slice(0, MAX_RECORDS));
}

export function removeDialogRecord(id) {
  return saveDialogHistory(loadDialogHistory().filter((item) => item.id !== id));
}

export function clearDialogHistory() {
  if (!canUseStorage()) return [];
  window.localStorage.removeItem(STORAGE_KEY);
  return [];
}

export function formatDialogRecord(record) {
  const lines = [
    `Сценарий: ${record.scenarioTitle} — ${record.scenarioSubtitle}`,
    `Уровень: ${record.level}`,
    record.createdAt ? `Дата: ${new Date(record.createdAt).toLocaleString('ru-RU')}` : '',
    record.score !== null ? `Балл: ${record.score}/100` : '',
    record.verdict ? `Вердикт: ${record.verdict}` : '',
    '',
    ...(record.messages || []).map((message) => `${message.role === 'client' ? 'Клиент' : 'Агент'}: ${message.text}`)
  ];

  return lines.filter((line, index) => line || index > 4).join('\n').trim();
}
