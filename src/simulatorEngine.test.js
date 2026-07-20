import { describe, expect, it } from 'vitest';
import { evaluateAgentReply, getNextClientReply, getScenarioById } from './simulatorEngine.js';

describe('simulatorEngine', () => {
  it('finds the family turkey scenario with a realistic starting client brief', () => {
    const scenario = getScenarioById('turkey-family-hard');

    expect(scenario.title).toContain('Семья');
    expect(scenario.clientProfile.children).toEqual(['2 года', '11 лет']);
    expect(scenario.startMessage).toContain('180');
  });

  it('scores strong agent replies higher when they ask needs, warn about risks and move to next step', () => {
    const weak = evaluateAgentReply('Берите этот отель, он хороший, всё будет отлично.');
    const strong = evaluateAgentReply('Уточню возраст детей, бюджет, пляж и питание. Сразу предупрежу по рискам: за 180 тысяч нужна честная вилка вариантов. Предложу 2 отеля и созвон на 10 минут, чтобы зафиксировать бронь.');

    expect(strong.score).toBeGreaterThan(weak.score);
    expect(strong.detected).toContain('needs');
    expect(strong.detected).toContain('risk');
    expect(strong.detected).toContain('nextStep');
  });

  it('returns a tougher objection after a reply that misses budget and risks', () => {
    const reply = getNextClientReply('turkey-family-hard', 'Да, хороший отель, вам понравится.', 1);

    expect(reply).toContain('бюджет');
    expect(reply).toContain('отзывы');
  });
});
