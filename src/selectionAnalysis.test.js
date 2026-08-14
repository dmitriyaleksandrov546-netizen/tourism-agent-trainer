import { describe, expect, it } from 'vitest';
import { buildSelectionAnalysisPrompt, createSelectionAnalysisFallback, normalizeSelectionInput } from './selectionAnalysis.js';

describe('selectionAnalysis', () => {
  it('rejects empty selection input instead of inventing a fake hotel review', () => {
    expect(() => normalizeSelectionInput('')).toThrow(/selection content is required/i);
    expect(() => normalizeSelectionInput('   https://example.com   ')).not.toThrow();
  });

  it('builds analysis prompt from the actual pasted link/text and scenario criteria', () => {
    const prompt = buildSelectionAnalysisPrompt({
      scenarioId: 'turkey-family-hard',
      selectionInput: 'https://example.com/selection\nSide Family Resort 5*, Турция, песчаный пляж, но питание среднее.',
      fetchedText: 'Отзывы: на Яндексе ругают очереди, Tripadvisor пишет про уставшие номера.'
    });

    expect(prompt.system).toContain('анализируешь реальную подборку');
    expect(prompt.system).toContain('не выдумывай');
    expect(prompt.user).toContain('https://example.com/selection');
    expect(prompt.user).toContain('Side Family Resort 5*');
    expect(prompt.user).toContain('Отзывы: на Яндексе');
    expect(prompt.user).toContain('Критерии клиента');
  });

  it('fallback explains that only a link/text was received and asks for real accessible content when needed', () => {
    const fallback = createSelectionAnalysisFallback({
      scenarioId: 'turkey-family-hard',
      selectionInput: 'https://private.example.com/selection',
      fetchError: 'Failed to fetch'
    });

    expect(fallback.qualityScore).toBeLessThan(60);
    expect(fallback.clientReply).toContain('не смогла открыть');
    expect(fallback.clientReply.toLowerCase()).toContain('пришлите');
    expect(fallback.clientReply).not.toContain('Side Family Resort 5*');
  });
});
