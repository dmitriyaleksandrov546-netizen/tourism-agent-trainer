import { describe, expect, it } from 'vitest';
import { corpusInsights, evaluateAgentReply, getNextClientReply, getScenarioById } from './simulatorEngine.js';

describe('simulatorEngine', () => {
  it('finds the family turkey scenario with a realistic starting client brief', () => {
    const scenario = getScenarioById('turkey-family-hard');

    expect(scenario.title).toContain('Семья');
    expect(scenario.clientProfile.children).toEqual(['2 года', '11 лет']);
    expect(scenario.startMessage).toContain('180');
  });

  it('exposes corpus insights from the OBS call base for the trainer', () => {
    expect(corpusInsights.totalCalls).toBeGreaterThan(2300);
    expect(corpusInsights.silenceTriggers[0].label).toContain('поверхностного разговора');
    expect(corpusInsights.behaviorRules).toContain('Reveal progressively');
  });

  it('scores strong agent replies higher when they diagnose, warn about risks and set a next step', () => {
    const weak = evaluateAgentReply('Берите этот отель, он хороший, всё будет отлично.');
    const strong = evaluateAgentReply('Уточню возраст детей, бюджет, пляж и питание. Сразу предупрежу по рискам: за 180 тысяч нужна честная вилка вариантов. Предложу 2 отеля и созвон на 10 минут, чтобы зафиксировать бронь.');

    expect(strong.score).toBeGreaterThan(weak.score);
    expect(strong.detected).toContain('diagnosis');
    expect(strong.detected).toContain('riskHonesty');
    expect(strong.detected).toContain('nextStep');
  });

  it('penalizes keyword stuffing that has buzzwords but no real answer', () => {
    const spam = evaluateAgentReply('Бюджет риск варианты созвон дети честно проверю отзывы цена бронь.');
    const useful = evaluateAgentReply('Понял: двое взрослых и двое детей, младшему важен безопасный вход в море, старшему — активности. В 180 тысяч первая линия 5* без толпы почти наверняка будет компромиссом: либо отель проще, либо даты ловим. Я проверю свежие отзывы и дам три варианта с минусами: в бюджет, комфортнее и безопаснее для детей. После этого созвон на 10 минут и фиксируем следующий шаг.');

    expect(spam.score).toBeLessThan(50);
    expect(spam.verdict).toContain('слишком поверхностно');
    expect(useful.score).toBeGreaterThan(78);
  });

  it('uses corpus-backed silence logic for vague answers without concrete next step', () => {
    const reply = getNextClientReply('turkey-family-hard', 'Да, хороший вариант, посмотрим и подберём.', 1);

    expect(reply).toContain('общими словами');
    expect(reply).toContain('бюджет');
  });
});
