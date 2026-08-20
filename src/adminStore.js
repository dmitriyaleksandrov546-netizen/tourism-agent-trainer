const ACCOUNTS_KEY = 'ttrainer.adminAccounts.v1';
const ACTIVE_ACCOUNT_KEY = 'ttrainer.activeAccountId.v1';
const MAX_LOGIN_LENGTH = 48;
const MAX_PASSWORD_LENGTH = 80;
export const DEFAULT_ADMIN_ACCOUNT = {
  id: 'admin-default',
  login: 'admin',
  name: 'admin',
  password: '',
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  lastActiveAt: null,
  isDefault: true
};

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function safeParseArray(raw) {
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function normalizeLogin(value = '') {
  return String(value || '').trim().slice(0, MAX_LOGIN_LENGTH);
}

function normalizePassword(value = '') {
  return String(value || '').trim().slice(0, MAX_PASSWORD_LENGTH);
}

function normalizeAccount(account = {}) {
  const login = normalizeLogin(account.login || account.name);
  if (!login) return null;
  return {
    id: account.id || `account-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    login,
    name: login,
    password: normalizePassword(account.password),
    status: account.status || 'active',
    createdAt: account.createdAt || new Date().toISOString(),
    lastActiveAt: account.lastActiveAt || null,
    isDefault: Boolean(account.isDefault)
  };
}

export function loadTrainingAccounts() {
  if (!canUseStorage()) return [DEFAULT_ADMIN_ACCOUNT];
  const stored = safeParseArray(window.localStorage.getItem(ACCOUNTS_KEY))
    .map(normalizeAccount)
    .filter(Boolean);
  const hasAdmin = stored.some((account) => account.id === DEFAULT_ADMIN_ACCOUNT.id || account.login.toLowerCase() === DEFAULT_ADMIN_ACCOUNT.login);
  const accounts = hasAdmin ? stored : [DEFAULT_ADMIN_ACCOUNT, ...stored];
  if (!hasAdmin) window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  return accounts;
}

export function saveTrainingAccounts(accounts = []) {
  if (!canUseStorage()) return [DEFAULT_ADMIN_ACCOUNT];
  const normalized = accounts.map(normalizeAccount).filter(Boolean);
  const hasAdmin = normalized.some((account) => account.id === DEFAULT_ADMIN_ACCOUNT.id || account.login.toLowerCase() === DEFAULT_ADMIN_ACCOUNT.login);
  const withAdmin = hasAdmin ? normalized : [DEFAULT_ADMIN_ACCOUNT, ...normalized];
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(withAdmin));
  return withAdmin;
}

export function createTrainingAccount({ login, name, password } = {}) {
  const current = loadTrainingAccounts();
  const account = normalizeAccount({ login: login || name, password });
  if (!account) return { ok: false, error: 'Укажите логин', accounts: current, account: null };
  if (!account.password) return { ok: false, error: 'Укажите пароль', accounts: current, account: null };
  const duplicate = current.find((item) => item.login.toLowerCase() === account.login.toLowerCase());
  if (duplicate) {
    if (duplicate.id === DEFAULT_ADMIN_ACCOUNT.id) {
      const accounts = saveTrainingAccounts(current.map((item) => item.id === duplicate.id ? { ...item, password: account.password } : item));
      setActiveTrainingAccount(duplicate.id);
      return { ok: true, accounts, account: accounts.find((item) => item.id === duplicate.id) };
    }
    return { ok: false, error: 'Аккаунт с таким логином уже есть', accounts: current, account: duplicate };
  }
  const accounts = saveTrainingAccounts([account, ...current]);
  setActiveTrainingAccount(account.id);
  return { ok: true, accounts, account };
}

export function setActiveTrainingAccount(accountId) {
  if (!canUseStorage()) return '';
  if (!accountId) {
    window.localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
    return '';
  }
  window.localStorage.setItem(ACTIVE_ACCOUNT_KEY, accountId);
  return accountId;
}

export function loadActiveTrainingAccountId() {
  if (!canUseStorage()) return DEFAULT_ADMIN_ACCOUNT.id;
  return window.localStorage.getItem(ACTIVE_ACCOUNT_KEY) || DEFAULT_ADMIN_ACCOUNT.id;
}

export function getActiveTrainingAccount(accounts = loadTrainingAccounts()) {
  const activeId = loadActiveTrainingAccountId();
  return accounts.find((account) => account.id === activeId) || accounts[0] || null;
}

export function touchTrainingAccount(accountId) {
  if (!accountId) return loadTrainingAccounts();
  const accounts = loadTrainingAccounts();
  return saveTrainingAccounts(accounts.map((account) => (
    account.id === accountId ? { ...account, lastActiveAt: new Date().toISOString() } : account
  )));
}

export function attachAccountToDialogRecord(record = {}, account = null) {
  if (!account) return { ...record, accountId: '', accountName: 'Без аккаунта', accountLogin: '' };
  return {
    ...record,
    accountId: account.id,
    accountName: account.login || account.name,
    accountLogin: account.login || account.name
  };
}

export function filterRecordsByAccount(records = [], accountId = '') {
  if (!accountId) return [];
  if (accountId === DEFAULT_ADMIN_ACCOUNT.id) {
    return records.map(assignUnownedRecordToDefaultAdmin).filter((record) => record.accountId === DEFAULT_ADMIN_ACCOUNT.id);
  }
  return records.filter((record) => record.accountId === accountId);
}

export function assignUnownedRecordToDefaultAdmin(record = {}) {
  if (record.accountId) return record;
  return {
    ...record,
    accountId: DEFAULT_ADMIN_ACCOUNT.id,
    accountName: DEFAULT_ADMIN_ACCOUNT.login,
    accountLogin: DEFAULT_ADMIN_ACCOUNT.login
  };
}

export function normalizeHistoryRecordsForAdmin(records = []) {
  return records.map(assignUnownedRecordToDefaultAdmin);
}

export function buildTestResume(record = {}) {
  const score = typeof record.score === 'number' ? record.score : null;
  const verdict = record.verdict || (score === null ? 'Без финальной оценки' : score >= 80 ? 'Хорошо' : score >= 55 ? 'Нужно доработать' : 'Клиент может пропасть');
  const agentMessages = (record.messages || []).filter((message) => message.role === 'agent');
  const clientMessages = (record.messages || []).filter((message) => message.role === 'client');
  return {
    title: record.scenarioTitle || record.scenarioId || 'Сценарий',
    account: record.accountLogin || record.accountName || 'Без аккаунта',
    score,
    verdict,
    turns: agentMessages.length,
    clientMessages: clientMessages.length,
    lastAgent: record.lastAgent || agentMessages.at(-1)?.text || '',
    lastClient: record.lastClient || clientMessages.at(-1)?.text || '',
    resultLabel: score === null ? 'Без оценки' : `${score}/100 · ${verdict}`
  };
}

export function buildAccountAnalytics(records = [], accounts = []) {
  const accountMap = new Map(accounts.map((account) => [account.id, account]));
  const rows = accounts.map((account) => ({
    account,
    attempts: 0,
    completed: 0,
    averageScore: null,
    bestScore: null,
    lastActivityAt: account.lastActiveAt || null,
    weakScenarios: [],
    scenarioCounts: {}
  }));
  const rowById = new Map(rows.map((row) => [row.account.id, row]));
  const scoreBuckets = new Map();

  for (const rawRecord of records) {
    const record = assignUnownedRecordToDefaultAdmin(rawRecord);
    const id = record.accountId || '';
    if (!id) continue;
    let row = rowById.get(id);
    if (!row) {
      const login = record.accountLogin || record.accountName || 'Удалённый аккаунт';
      const account = accountMap.get(id) || { id, login, name: login, status: 'archived' };
      row = { account, attempts: 0, completed: 0, averageScore: null, bestScore: null, lastActivityAt: null, weakScenarios: [], scenarioCounts: {} };
      rowById.set(id, row);
      rows.push(row);
    }
    row.attempts += 1;
    row.scenarioCounts[record.scenarioTitle || record.scenarioId || 'Сценарий'] = (row.scenarioCounts[record.scenarioTitle || record.scenarioId || 'Сценарий'] || 0) + 1;
    if (record.createdAt && (!row.lastActivityAt || record.createdAt > row.lastActivityAt)) row.lastActivityAt = record.createdAt;
    if (typeof record.score === 'number') {
      row.completed += 1;
      const bucket = scoreBuckets.get(row.account.id) || [];
      bucket.push(record.score);
      scoreBuckets.set(row.account.id, bucket);
      row.bestScore = row.bestScore === null ? record.score : Math.max(row.bestScore, record.score);
      if (record.score < 55) row.weakScenarios.push(record.scenarioTitle || record.scenarioId || 'Сценарий');
    }
  }

  return rows.map((row) => {
    const scores = scoreBuckets.get(row.account.id) || [];
    const topScenario = Object.entries(row.scenarioCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
    return {
      ...row,
      averageScore: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null,
      topScenario,
      weakScenarios: [...new Set(row.weakScenarios)].slice(0, 3)
    };
  }).sort((a, b) => (b.lastActivityAt || '').localeCompare(a.lastActivityAt || ''));
}

export function buildAdminSummary(records = [], accounts = [], accountId = '') {
  const normalizedRecords = normalizeHistoryRecordsForAdmin(records);
  const scopedRecords = accountId ? filterRecordsByAccount(normalizedRecords, accountId) : normalizedRecords.filter((record) => record.accountId);
  const analytics = buildAccountAnalytics(normalizedRecords, accounts);
  const completedScores = scopedRecords.map((record) => record.score).filter((score) => typeof score === 'number');
  return {
    accountCount: accounts.length,
    attempts: scopedRecords.length,
    completed: completedScores.length,
    averageScore: completedScores.length ? Math.round(completedScores.reduce((sum, score) => sum + score, 0) / completedScores.length) : null,
    activeToday: analytics.filter((row) => row.lastActivityAt && new Date(row.lastActivityAt).toDateString() === new Date().toDateString()).length,
    analytics
  };
}
