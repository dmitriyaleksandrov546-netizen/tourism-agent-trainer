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

  it('does not repeat the same neuroclient phrase on repeated weak replies', () => {
    const firstReply = getNextClientReply('egypt-budget-objections', 'Добрый день. Речь идёт о разных отелях?', 1);
    const secondReply = getNextClientReply('egypt-budget-objections', 'Да, конечно проверяли.', 2, [
      { role: 'client', text: firstReply }
    ]);

    expect(secondReply).not.toEqual(firstReply);
    expect(secondReply).toContain('что именно');
  });

  it('uses scenario-specific objections instead of one generic script', () => {
    const egyptReply = getNextClientReply('egypt-budget-objections', 'Подберу вариант.', 2);
    const uaeReply = getNextClientReply('uae-premium-anxious', 'Подберу вариант.', 2);

    expect(egyptReply).toContain('дешевле');
    expect(uaeReply).toContain('стройк');
  });

  it('keeps dialogue state from previous agent turns instead of repeating the same budget pushback', () => {
    const firstReply = getNextClientReply('turkey-family-hard', 'Сейчас посмотрю, что реально проходит в бюджет 180, и не буду обещать лишнего.', 1, []);
    const history = [
      { role: 'client', text: firstReply },
      { role: 'agent', text: 'Сейчас посмотрю, что реально проходит в бюджет 180, и не буду обещать лишнего.' }
    ];
    const secondReply = getNextClientReply('turkey-family-hard', 'Проверю отзывы и риски, пришлю варианты сегодня вечером.', 2, history);

    expect(secondReply).not.toEqual(firstReply);
    expect(secondReply).toMatch(/дет|агрегатор|вариант/i);
    expect(secondReply).not.toContain('в бюджет 180 тысяч это реально');
  });

  it('does not give family-with-children advice in a premium UAE scenario without children', () => {
    const result = evaluateAgentReply('Красивый отель, точно без проблем.', 'uae-premium-anxious');

    expect(result.advice.join(' ')).not.toContain('дети');
    expect(result.advice.join(' ')).toContain('депозит');
  });

  it('marks rude agent tone as a client-losing failure', () => {
    const result = evaluateAgentReply('да блять все мы ответили уже', 'uae-premium-anxious');

    expect(result.score).toBe(0);
    expect(result.verdict).toContain('грубость');
  });
});
