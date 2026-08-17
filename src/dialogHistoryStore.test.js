import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearCurrentAttempt,
  clearScenarioAttempt,
  loadCurrentAttempt,
  loadScenarioAttempt,
  saveCurrentAttempt,
  saveScenarioAttempt
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
      checkedTravelItems: { 'Турция-1': true }
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
});
