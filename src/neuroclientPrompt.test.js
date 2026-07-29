import { describe, expect, it } from 'vitest';
import { buildNeuroclientPrompt, containsAbuse, createFallbackReply, normalizeClientReply } from './neuroclientPrompt.js';

describe('neuroclientPrompt', () => {
  it('accepts a polite process reply instead of attacking it as too generic', () => {
    const reply = createFallbackReply('turkey-family-hard', 'Да, конечно, сейчас подберу варианты и посмотрим, что реально проходит по бюджету.', 1, []).text;

    expect(reply).toMatch(/ок|хорошо|жду|ожидаю|давайте/i);
    expect(reply).not.toContain('общими словами');
    expect(reply).not.toContain('что именно вы проверили');
  });

  it('sets a firm boundary for rude or abusive tone instead of normalizing it', () => {
    expect(containsAbuse('да блять все мы ответили уже')).toBe(true);
    const reply = createFallbackReply('uae-premium-anxious', 'да блять проверю депозит пляж и стройку', 2, []).text;

    expect(reply).toContain('без мата');
    expect(reply).toContain('не продолжаю');
  });

  it('only threatens to leave after repeated rude tone in the dialogue history', () => {
    const reply = createFallbackReply('uae-premium-anxious', 'да блять уже сказал', 3, [
      { role: 'agent', text: 'блять я же объясняю' }
    ]).text;

    expect(reply).toContain('другому агенту');
  });

  it('builds a scenario-specific prompt with hotel facts and conversation history', () => {
    const payload = buildNeuroclientPrompt({
      scenarioId: 'uae-premium-anxious',
      agentText: 'Проверю стройку, депозит и пляж.',
      turn: 2,
      history: [{ role: 'client', text: 'Мне нужен отель в Дубае без сюрпризов.' }]
    });

    expect(payload.system).toContain('реального туриста');
    expect(payload.system).toContain('стандартный клиент');
    expect(payload.system).toContain('сначала согласись и подожди');
    expect(payload.system).toContain('сразу поставь дистанцию');
    expect(payload.user).toContain('Jumeirah Calm Bay 5*');
    expect(payload.user).toContain('стройку');
  });

  it('normalizes long or quoted model output into a clean client reply', () => {
    const reply = normalizeClientReply('Клиент: Хорошо, но какие источники и даты проверки?\n\nОценка: 80');

    expect(reply).toBe('Хорошо, но какие источники и даты проверки?');
  });
});
