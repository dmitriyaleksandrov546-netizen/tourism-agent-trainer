import { beforeEach, describe, expect, it } from 'vitest';
import { clearCurrentAttempt, loadCurrentAttempt, saveCurrentAttempt } from './dialogHistoryStore.js';

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
});
