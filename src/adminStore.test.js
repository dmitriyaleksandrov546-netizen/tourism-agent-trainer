import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  attachAccountToDialogRecord,
  buildAccountAnalytics,
  buildAdminSummary,
  buildTestResume,
  createTrainingAccount,
  filterRecordsByAccount,
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
  it('creates login/password accounts and selects the new account', () => {
    const result = createTrainingAccount({ login: 'irina', password: '12345' });

    expect(result.ok).toBe(true);
    expect(loadTrainingAccounts()).toHaveLength(1);
    expect(getActiveTrainingAccount().login).toBe('irina');
    expect(getActiveTrainingAccount().password).toBe('12345');
  });

  it('requires password and rejects duplicate logins', () => {
    expect(createTrainingAccount({ login: 'irina' }).ok).toBe(false);
    createTrainingAccount({ login: 'irina', password: '12345' });
    const duplicate = createTrainingAccount({ login: 'IRINA', password: '67890' });

    expect(duplicate.ok).toBe(false);
    expect(loadTrainingAccounts()).toHaveLength(1);
  });

  it('attaches account login fields to dialog records without roles', () => {
    const account = createTrainingAccount({ login: 'oleg', password: 'secret' }).account;
    const record = attachAccountToDialogRecord({ id: 'dialog-1' }, account);

    expect(record.accountId).toBe(account.id);
    expect(record.accountName).toBe('oleg');
    expect(record.accountLogin).toBe('oleg');
    expect(record.accountRole).toBeUndefined();
  });

  it('filters dialog records by selected account', () => {
    const records = [
      { accountId: 'a1', scenarioTitle: 'Турция' },
      { accountId: 'a2', scenarioTitle: 'Египет' },
      { accountId: '', scenarioTitle: 'Без аккаунта' }
    ];

    expect(filterRecordsByAccount(records, 'a1')).toEqual([{ accountId: 'a1', scenarioTitle: 'Турция' }]);
    expect(filterRecordsByAccount(records, '')).toEqual([]);
  });

  it('builds account analytics from dialog records', () => {
    const irina = { id: 'a1', login: 'irina', status: 'active' };
    const oleg = { id: 'a2', login: 'oleg', status: 'active' };
    const records = [
      { accountId: 'a1', accountLogin: 'irina', scenarioTitle: 'Турция', score: 80, createdAt: '2026-01-03T10:00:00.000Z' },
      { accountId: 'a1', accountLogin: 'irina', scenarioTitle: 'Египет', score: 40, createdAt: '2026-01-04T10:00:00.000Z' },
      { accountId: 'a2', accountLogin: 'oleg', scenarioTitle: 'Турция', score: null, createdAt: '2026-01-02T10:00:00.000Z' },
      { accountId: '', scenarioTitle: 'Без аккаунта', score: 100, createdAt: '2026-01-05T10:00:00.000Z' }
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
    expect(analytics.find((row) => row.account.name === 'Без аккаунта')).toBeUndefined();
  });

  it('builds admin summary for selected account only', () => {
    const summary = buildAdminSummary([
      { accountId: 'a1', score: 80, createdAt: new Date().toISOString() },
      { accountId: 'a1', score: 60, createdAt: new Date().toISOString() },
      { accountId: 'a2', score: 10, createdAt: new Date().toISOString() }
    ], [{ id: 'a1', login: 'irina' }, { id: 'a2', login: 'oleg' }], 'a1');

    expect(summary.accountCount).toBe(2);
    expect(summary.attempts).toBe(2);
    expect(summary.completed).toBe(2);
    expect(summary.averageScore).toBe(70);
  });

  it('builds test resume for dialog log panel', () => {
    const resume = buildTestResume({
      accountLogin: 'irina',
      scenarioTitle: 'Турция',
      score: 50,
      verdict: 'Клиент может пропасть',
      messages: [
        { role: 'client', text: 'Хочу Турцию' },
        { role: 'agent', text: 'Подберу' }
      ]
    });

    expect(resume.account).toBe('irina');
    expect(resume.resultLabel).toBe('50/100 · Клиент может пропасть');
    expect(resume.turns).toBe(1);
    expect(resume.clientMessages).toBe(1);
  });
});
