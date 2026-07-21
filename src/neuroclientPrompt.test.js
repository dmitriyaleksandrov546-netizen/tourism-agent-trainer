import { describe, expect, it } from 'vitest';
import { buildNeuroclientPrompt, containsAbuse, createFallbackReply, normalizeClientReply } from './neuroclientPrompt.js';

describe('neuroclientPrompt', () => {
  it('detects abusive agent tone as a real client-breaking event', () => {
    expect(containsAbuse('да блять все мы ответили уже')).toBe(true);
    expect(createFallbackReply('uae-premium-anxious', 'да блять все мы ответили уже', 2, []).text).toContain('матом');
  });

  it('builds a scenario-specific prompt with hotel facts and conversation history', () => {
    const payload = buildNeuroclientPrompt({
      scenarioId: 'uae-premium-anxious',
      agentText: 'Проверю стройку, депозит и пляж.',
      turn: 2,
      history: [{ role: 'client', text: 'Мне нужен отель в Дубае без сюрпризов.' }]
    });

    expect(payload.system).toContain('реального туриста');
    expect(payload.user).toContain('Jumeirah Calm Bay 5*');
    expect(payload.user).toContain('стройку');
  });

  it('normalizes long or quoted model output into a clean client reply', () => {
    const reply = normalizeClientReply('Клиент: Хорошо, но какие источники и даты проверки?\n\nОценка: 80');

    expect(reply).toBe('Хорошо, но какие источники и даты проверки?');
  });
});
