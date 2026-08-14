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
    expect(prompt.maxTokens).toBeGreaterThanOrEqual(700);
    expect(prompt.system).toContain('не выдумывай');
    expect(prompt.user).toContain('https://example.com/selection');
    expect(prompt.user).toContain('Side Family Resort 5*');
    expect(prompt.user).toContain('Отзывы: на Яндексе');
    expect(prompt.user).toContain('Критерии клиента');
  });

  it('fallback explains that a URL-only selection was inaccessible and asks for real accessible content', () => {
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

  it('does not mislabel pasted hotel text as an inaccessible link when LLM analysis fails', () => {
    const fallback = createSelectionAnalysisFallback({
      scenarioId: 'turkey-family-hard',
      selectionInput: 'Seven Seas Hotel Life 5*, Кемер, 310 000 ₽, семейный отель, отзывы 4.6/5.',
      fetchError: 'LLM returned invalid JSON'
    });

    expect(fallback.clientReply).toContain('Я вижу подборку');
    expect(fallback.clientReply).not.toContain('не смогла открыть');
    expect(fallback.gaps.join(' ')).not.toContain('ссылка недоступна');
  });
});
