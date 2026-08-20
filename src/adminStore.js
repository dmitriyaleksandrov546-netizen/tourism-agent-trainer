const ACCOUNTS_KEY = 'ttrainer.adminAccounts.v1';
const ACTIVE_ACCOUNT_KEY = 'ttrainer.activeAccountId.v1';
const MAX_ACCOUNT_NAME_LENGTH = 48;

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

function normalizeAccount(account = {}) {
  const name = String(account.name || '').trim().slice(0, MAX_ACCOUNT_NAME_LENGTH);
  if (!name) return null;
  return {
    id: account.id || `account-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    role: account.role || 'Агент',
    status: account.status || 'active',
    createdAt: account.createdAt || new Date().toISOString(),
    lastActiveAt: account.lastActiveAt || null
  };
}

export function loadTrainingAccounts() {
  if (!canUseStorage()) return [];
  return safeParseArray(window.localStorage.getItem(ACCOUNTS_KEY))
    .map(normalizeAccount)
    .filter(Boolean);
}

export function saveTrainingAccounts(accounts = []) {
  if (!canUseStorage()) return [];
  const normalized = accounts.map(normalizeAccount).filter(Boolean);
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(normalized));
  return normalized;
}

export function createTrainingAccount({ name, role = 'Агент' } = {}) {
  const current = loadTrainingAccounts();
  const account = normalizeAccount({ name, role });
  if (!account) return { ok: false, error: 'Укажите имя аккаунта', accounts: current, account: null };
  const duplicate = current.find((item) => item.name.toLowerCase() === account.name.toLowerCase());
  if (duplicate) return { ok: false, error: 'Аккаунт с таким именем уже есть', accounts: current, account: duplicate };
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
  if (!canUseStorage()) return '';
  return window.localStorage.getItem(ACTIVE_ACCOUNT_KEY) || '';
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
  if (!account) return { ...record, accountId: '', accountName: 'Без аккаунта', accountRole: '' };
  return {
    ...record,
    accountId: account.id,
    accountName: account.name,
    accountRole: account.role || 'Агент'
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
  const unassigned = {
    account: { id: '', name: 'Без аккаунта', role: '', status: 'system' },
    attempts: 0,
    completed: 0,
    averageScore: null,
    bestScore: null,
    lastActivityAt: null,
    weakScenarios: [],
    scenarioCounts: {}
  };
  const scoreBuckets = new Map();

  for (const record of records) {
    const id = record.accountId || '';
    let row = id ? rowById.get(id) : unassigned;
    if (!row && id) {
      const account = accountMap.get(id) || { id, name: record.accountName || 'Удалённый аккаунт', role: record.accountRole || 'Агент', status: 'archived' };
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

  if (unassigned.attempts > 0) rows.push(unassigned);

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

export function buildAdminSummary(records = [], accounts = []) {
  const analytics = buildAccountAnalytics(records, accounts);
  const completedScores = records.map((record) => record.score).filter((score) => typeof score === 'number');
  return {
    accountCount: accounts.length,
    attempts: records.length,
    completed: completedScores.length,
    averageScore: completedScores.length ? Math.round(completedScores.reduce((sum, score) => sum + score, 0) / completedScores.length) : null,
    activeToday: analytics.filter((row) => row.lastActivityAt && new Date(row.lastActivityAt).toDateString() === new Date().toDateString()).length,
    analytics
  };
}
