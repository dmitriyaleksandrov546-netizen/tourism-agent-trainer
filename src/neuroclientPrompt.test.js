import { describe, expect, it } from 'vitest';
import { buildNeuroclientPrompt, createFallbackReply } from './neuroclientPrompt.js';

const realAnalysis = {
  phase: 'selection-review',
  qualityScore: 62,
  criteria: ['Турция', '5*', 'детская инфраструктура'],
  gaps: ['По одному отелю нет отзывов Tripadvisor.'],
  clientReply: 'Я открыла подборку. Side Family Resort 5* подходит по пляжу, но по Яндексу есть жалобы на очереди.',
  managerTask: 'Объяснить компромисс или заменить отель.',
  source: 'live-selection-analysis'
};

describe('neuroclientPrompt', () => {
  it('builds a selection-review prompt only from provided real analysis context', () => {
    const payload = buildNeuroclientPrompt({
      scenarioId: 'turkey-family-hard',
      agentText: 'Вот ссылка на подборку, выбирайте.',
      turn: 3,
      history: [],
      phase: 'selection-review',
      selectionAnalysis: realAnalysis
    });

    expect(payload.system).toContain('selection-review');
    expect(payload.system).toContain('качество подборки');
    expect(payload.user).toContain('Этап: selection-review');
    expect(payload.user).toContain('Анализ подборки после ссылки');
    expect(payload.user).toContain('Side Family Resort 5*');
    expect(payload.user).toContain('По одному отелю нет отзывов Tripadvisor.');
  });

  it('does not invent selection analysis when no real selection context exists', () => {
    const payload = buildNeuroclientPrompt({
      scenarioId: 'turkey-family-hard',
      agentText: 'Вот ссылка на подборку, выбирайте.',
      turn: 3,
      history: [],
      phase: 'selection-review'
    });

    expect(payload.user).not.toContain('Анализ подборки после ссылки');
    expect(payload.user).not.toContain('Side Family Resort 5*');
  });

  it('keeps local fallback in the selection-review client role without fake hotels', () => {
    const reply = createFallbackReply('turkey-family-hard', 'Вот ссылка на подборку, выбирайте.', 3, [], { phase: 'selection-review' });

    expect(reply.text).toContain('не видела саму подборку');
    expect(reply.text).toContain('Пришлите ссылку');
    expect(reply.text).not.toContain('Side Family Resort 5*');
    expect(reply.risk).toBe('selection-review-needs-manager-decision');
  });
});
