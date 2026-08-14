import { describe, expect, it } from 'vitest';
import { corpusInsights, analyzeSelectionLink, evaluateAgentReply, getNextClientReply, getScenarioById } from './simulatorEngine.js';

describe('simulatorEngine', () => {
  it('exposes corpus and methodic sources from calls, Wazzup and training materials', () => {
    expect(corpusInsights.totalCalls).toBeGreaterThan(2300);
    expect(corpusInsights.wazzupDialogs).toBeGreaterThan(2300);
    expect(corpusInsights.trainingMaterials.salesScripts).toBeGreaterThan(10);
    expect(corpusInsights.rulePacks.map((rule) => rule.id)).toContain('next_step_deadline');
    expect(corpusInsights.sourceCoverage.calls).toBeGreaterThan(2300);
    expect(corpusInsights.sourceCoverage.trainingMaterials).toBe(28);
    expect(corpusInsights.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });

  it('finds the family turkey scenario with source refs and hidden needs', () => {
    const scenario = getScenarioById('turkey-family-hard');

    expect(scenario.shortTitle).toBe('Семья в Турцию');
    expect(scenario.clientProfile.children).toEqual(['2 года', '11 лет']);
    expect(scenario.sourceRefs.length).toBeGreaterThan(1);
    expect(scenario.requiredConcepts).toContain('kidsAges');
  });

  it('requires scenario-specific relevance, not generic consulting words', () => {
    const scenario = getScenarioById('turkey-family-hard');
    const generic = evaluateAgentReply('Уточню бюджет, даты, риски, отзывы и предложу варианты. Сегодня отправлю подборку.', scenario);
    const relevant = evaluateAgentReply('Понял: младшему 2 года нужен безопасный вход в море, старшему 11 — активности. В 180 тысяч по Турции 5* первая линия будет компромисс: либо проще отель, либо ловим даты. Сегодня до 18:00 отправлю 3 варианта в WhatsApp с плюсами, минусами и отзывами.', scenario);

    expect(relevant.score).toBeGreaterThan(generic.score);
    expect(relevant.score).toBeGreaterThan(80);
    expect(generic.missing).toContain('возраст детей и разные потребности');
  });

  it('penalizes keyword stuffing and dangerous promises', () => {
    const scenario = getScenarioById('uae-premium-anxious');
    const spam = evaluateAgentReply('Бюджет риск варианты созвон дети честно проверю отзывы цена бронь.', scenario);
    const promise = evaluateAgentReply('Гарантирую идеальный вариант без сюрпризов, точно понравится.', scenario);

    expect(spam.score).toBeLessThan(35);
    expect(spam.verdict).toContain('слова есть');
    expect(promise.score).toBeLessThan(35);
    expect(promise.penalties.map((item) => item.key)).toContain('dangerousPromise');
  });

  it('returns UI evidence, missing items and top fixes instead of only hits', () => {
    const scenario = getScenarioById('egypt-budget-objections');
    const result = evaluateAgentReply('Давайте сравним не только цену: риф, пляж, номер, рейс и что входит. Дешевле может быть с риском, нормальный риф — чуть дороже. Сегодня до 17:00 пришлю 3 варианта.', scenario);

    expect(result.dimensions[0]).toHaveProperty('status');
    expect(result.topFixes.length).toBeLessThanOrEqual(3);
    expect(result.corpusSignals.length).toBeGreaterThan(0);
  });

  it('client reply follows the most critical missed methodic', () => {
    const reply = getNextClientReply('turkey-family-hard', 'Я подберу хороший отель, вам понравится.', 1);

    expect(reply).toContain('общими словами');
    expect(reply).toContain('бюджет');
  });

  it('waits when agent promised to send a selection by a concrete deadline', () => {
    const reply = getNextClientReply(
      'turkey-family-hard',
      'Понимаю: младшему нужен безопасный пляж, старшему активности. Сегодня до 18:00 пришлю 3 варианта с плюсами, минусами и отзывами.',
      1
    );

    expect(reply).toContain('жду');
    expect(reply).not.toContain('А какие минусы');
    expect(reply).not.toContain('общими словами');
  });

  it('analyzes a sent hotel selection as a client using criteria, compromises and review sources', () => {
    const analysis = analyzeSelectionLink('turkey-family-hard');

    expect(analysis.clientReply).toContain('Яндекс');
    expect(analysis.clientReply).toContain('Tripadvisor');
    expect(analysis.clientReply).toContain('Side Family Resort 5*');
    expect(analysis.clientReply).toMatch(/компромисс|уступ/i);
    expect(analysis.qualityScore).toBeLessThan(100);
    expect(analysis.gaps).toContain('Не все варианты честно закрывают исходные критерии клиента.');
    expect(analysis.hotelFindings[0]).toMatchObject({ country: 'Турция', stars: '5*' });
  });

  it('scores manager follow-up after selection review, not the bare fact of sending a link', () => {
    const weak = evaluateAgentReply('Вот ссылка на подборку, выбирайте.', 'turkey-family-hard', { phase: 'selection-review' });
    const strong = evaluateAgentReply('Да, вижу компромисс: подборка по Турции и Side Family Resort 5* подходит по пляжу, питанию и детям, но по отзывам на Яндексе есть очереди в ресторане. Поэтому либо оставляем его как дешевле, либо я сегодня до 18:00 заменю на вариант с питанием сильнее и честно покажу разницу по цене.', 'turkey-family-hard', { phase: 'selection-review' });

    expect(weak.score).toBeLessThan(45);
    expect(weak.topFixes.join(' ')).toContain('разбери качество подборки');
    expect(strong.score).toBeGreaterThan(weak.score);
    expect(strong.detected).toContain('selectionQuality');
    expect(strong.detected).toContain('reviewSources');
    expect(strong.detected).toContain('managerDecision');
  });
});
