import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  attachAccountToDialogRecord,
  buildAccountAnalytics,
  buildAdminSummary,
  createTrainingAccount,
  getActiveTrainingAccount,
  loadTrainingAccounts
} from './adminStore.js';

beforeEach(() => {
  const store = new Map();
  global.window = {
    localStorage: {
      getItem: (key) => store.has(key) ? store.get(key) : null,
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key),
      clear: () => store.clear()
    }
  };
  vi.useRealTimers();
});

describe('adminStore', () => {
  it('creates accounts and selects the new account', () => {
    const result = createTrainingAccount({ name: 'Ирина', role: 'Менеджер' });

    expect(result.ok).toBe(true);
    expect(loadTrainingAccounts()).toHaveLength(1);
    expect(getActiveTrainingAccount().name).toBe('Ирина');
  });

  it('rejects duplicate account names', () => {
    createTrainingAccount({ name: 'Ирина' });
    const duplicate = createTrainingAccount({ name: 'ирина' });

    expect(duplicate.ok).toBe(false);
    expect(loadTrainingAccounts()).toHaveLength(1);
  });

  it('attaches active account fields to dialog records', () => {
    const account = createTrainingAccount({ name: 'Олег' }).account;
    const record = attachAccountToDialogRecord({ id: 'dialog-1' }, account);

    expect(record.accountId).toBe(account.id);
    expect(record.accountName).toBe('Олег');
  });

  it('builds account analytics from dialog records', () => {
    const irina = { id: 'a1', name: 'Ирина', role: 'Агент', status: 'active' };
    const oleg = { id: 'a2', name: 'Олег', role: 'Агент', status: 'active' };
    const records = [
      { accountId: 'a1', accountName: 'Ирина', scenarioTitle: 'Турция', score: 80, createdAt: '2026-01-03T10:00:00.000Z' },
      { accountId: 'a1', accountName: 'Ирина', scenarioTitle: 'Египет', score: 40, createdAt: '2026-01-04T10:00:00.000Z' },
      { accountId: 'a2', accountName: 'Олег', scenarioTitle: 'Турция', score: null, createdAt: '2026-01-02T10:00:00.000Z' }
    ];

    const analytics = buildAccountAnalytics(records, [irina, oleg]);
    const irinaRow = analytics.find((row) => row.account.id === 'a1');
    const olegRow = analytics.find((row) => row.account.id === 'a2');

    expect(irinaRow.attempts).toBe(2);
    expect(irinaRow.completed).toBe(2);
    expect(irinaRow.averageScore).toBe(60);
    expect(irinaRow.bestScore).toBe(80);
    expect(irinaRow.weakScenarios).toEqual(['Египет']);
    expect(olegRow.attempts).toBe(1);
    expect(olegRow.completed).toBe(0);
  });

  it('builds admin summary', () => {
    const summary = buildAdminSummary([
      { accountId: 'a1', score: 80, createdAt: new Date().toISOString() },
      { accountId: 'a1', score: 60, createdAt: new Date().toISOString() }
    ], [{ id: 'a1', name: 'Ирина' }]);

    expect(summary.accountCount).toBe(1);
    expect(summary.attempts).toBe(2);
    expect(summary.completed).toBe(2);
    expect(summary.averageScore).toBe(70);
  });
});
