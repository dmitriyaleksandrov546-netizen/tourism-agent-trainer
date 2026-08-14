import { describe, expect, it } from 'vitest';
import { buildNeuroclientPrompt, createFallbackReply } from './neuroclientPrompt.js';

describe('neuroclientPrompt', () => {
  it('builds a selection-review prompt where live client analyzes the sent hotel selection', () => {
    const payload = buildNeuroclientPrompt({
      scenarioId: 'turkey-family-hard',
      agentText: 'Вот ссылка на подборку, выбирайте.',
      turn: 3,
      history: [],
      phase: 'selection-review'
    });

    expect(payload.system).toContain('selection-review');
    expect(payload.system).toContain('качество подборки');
    expect(payload.user).toContain('Этап: selection-review');
    expect(payload.user).toContain('Анализ подборки после ссылки');
    expect(payload.user).toContain('Яндекс');
    expect(payload.user).toContain('Tripadvisor');
    expect(payload.user).toContain('Side Family Resort 5*');
  });

  it('keeps local fallback in the selection-review client role', () => {
    const reply = createFallbackReply('turkey-family-hard', 'Вот ссылка на подборку, выбирайте.', 3, [], { phase: 'selection-review' });

    expect(reply.text).toContain('Яндекс');
    expect(reply.text).toContain('Tripadvisor');
    expect(reply.text).toContain('что оставляем, что меняем');
    expect(reply.risk).toBe('selection-review-needs-manager-decision');
  });
});
