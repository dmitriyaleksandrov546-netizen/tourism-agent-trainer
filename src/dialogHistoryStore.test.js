import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearCurrentAttempt,
  clearScenarioAttempt,
  createDialogRecord,
  loadCurrentAttempt,
  loadDialogHistory,
  loadScenarioAttempt,
  mergeIncrementalDialogRecords,
  saveCurrentAttempt,
  saveScenarioAttempt,
  upsertDialogRecord
} from './dialogHistoryStore.js';

function installLocalStorage() {
  const store = new Map();
  global.window = {
    localStorage: {
      getItem: (key) => store.has(key) ? store.get(key) : null,
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key)
    }
  };
}

describe('current dialog attempt persistence', () => {
  beforeEach(() => installLocalStorage());

  it('restores active scenario, messages and draft after page refresh', () => {
    const attempt = {
      scenarioId: 'turkey-family-hard',
      messages: [
        { id: 'client-1', role: 'client', text: 'Хочу Турцию', time: 'сейчас' },
        { id: 'agent-1', role: 'agent', text: 'Давайте подберём', time: 'ваш ответ' }
      ],
      draft: 'черновик ответа',
      activePhase: 'dialogue',
      selectionAnalysis: null,
      lastEvaluation: null,
      checkedTravelItems: { 'Турция-1': true },
      dialogRecordId: 'dialog-current-1',
      dialogCreatedAt: '2026-08-17T09:00:00.000Z',
      serverDialogRecordId: 'server-row-1'
    };

    saveCurrentAttempt(attempt);

    expect(loadCurrentAttempt()).toMatchObject(attempt);
  });

  it('clears only the active attempt when manager starts again', () => {
    saveCurrentAttempt({ scenarioId: 'egypt-price-objection', messages: [], draft: '' });
    clearCurrentAttempt();

    expect(loadCurrentAttempt()).toBeNull();
  });

  it('keeps a separate current attempt for each scenario', () => {
    const turkeyAttempt = {
      scenarioId: 'turkey-family-hard',
      messages: [{ id: 'agent-1', role: 'agent', text: 'Подберу Турцию', time: 'ваш ответ' }],
      draft: 'черновик Турция'
    };
    const egyptAttempt = {
      scenarioId: 'egypt-price-objection',
      messages: [{ id: 'agent-2', role: 'agent', text: 'Сравню Египет', time: 'ваш ответ' }],
      draft: 'черновик Египет'
    };

    saveScenarioAttempt(turkeyAttempt);
    saveScenarioAttempt(egyptAttempt);

    expect(loadScenarioAttempt('turkey-family-hard')).toMatchObject(turkeyAttempt);
    expect(loadScenarioAttempt('egypt-price-objection')).toMatchObject(egyptAttempt);
    expect(loadCurrentAttempt()).toMatchObject(egyptAttempt);
  });

  it('clears only the selected scenario attempt on reset', () => {
    saveScenarioAttempt({ scenarioId: 'turkey-family-hard', messages: [{ id: 't', role: 'agent', text: 'T' }], draft: '' });
    saveScenarioAttempt({ scenarioId: 'egypt-price-objection', messages: [{ id: 'e', role: 'agent', text: 'E' }], draft: '' });

    clearScenarioAttempt('turkey-family-hard');

    expect(loadScenarioAttempt('turkey-family-hard')).toBeNull();
    expect(loadScenarioAttempt('egypt-price-objection')?.messages[0].text).toBe('E');
  });

  it('updates one dialog history row when the same attempt receives more messages', () => {
    const scenario = {
      id: 'turkey-family-hard',
      shortTitle: 'Турция: входящий лид',
      shortSubtitle: 'семья с детьми',
      level: 'Лёгкий старт'
    };
    const firstRecord = createDialogRecord({
      scenario,
      id: 'dialog-stable-1',
      createdAt: '2026-08-17T09:00:00.000Z',
      messages: [{ id: 'agent-1', role: 'agent', text: 'Здравствуйте', time: 'ваш ответ' }],
      evaluation: null,
      account: { id: 'admin-default', login: 'admin' }
    });
    const secondRecord = createDialogRecord({
      scenario,
      id: 'dialog-stable-1',
      createdAt: '2026-08-17T09:00:00.000Z',
      messages: [
        { id: 'agent-1', role: 'agent', text: 'Здравствуйте', time: 'ваш ответ' },
        { id: 'client-1', role: 'client', text: 'Хочу Турцию', time: 'AI-клиент' }
      ],
      evaluation: { score: 70, verdict: 'Нормально' },
      account: { id: 'admin-default', login: 'admin' }
    });

    upsertDialogRecord(firstRecord);
    upsertDialogRecord(secondRecord);

    expect(loadDialogHistory()).toHaveLength(1);
    expect(loadDialogHistory()[0]).toMatchObject({
      id: 'dialog-stable-1',
      createdAt: '2026-08-17T09:00:00.000Z',
      score: 70,
      messages: expect.arrayContaining([{ id: 'client-1', role: 'client', text: 'Хочу Турцию', time: 'AI-клиент' }])
    });
  });

  it('merges already duplicated incremental records into one visible dialog', () => {
    const records = [
      {
        id: 'row-1',
        createdAt: '2026-08-17T09:00:00.000Z',
        scenarioId: 'turkey-family-hard',
        scenarioTitle: 'Турция: входящий лид',
        accountId: 'admin-default',
        score: null,
        messages: [{ role: 'client', text: 'Хочу Турцию' }]
      },
      {
        id: 'row-2',
        serverId: 'row-2',
        createdAt: '2026-08-17T09:04:00.000Z',
        scenarioId: 'turkey-family-hard',
        scenarioTitle: 'Турция: входящий лид',
        accountId: 'admin-default',
        score: 0,
        verdict: 'Клиент может пропасть',
        messages: [
          { role: 'client', text: 'Хочу Турцию' },
          { role: 'agent', text: 'Здравствуйте' },
          { role: 'client', text: 'Какие варианты?' }
        ]
      }
    ];

    const merged = mergeIncrementalDialogRecords(records);

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      id: 'row-2',
      serverId: 'row-2',
      score: 0,
      verdict: 'Клиент может пропасть'
    });
    expect(merged[0].messages).toHaveLength(3);
  });
});
