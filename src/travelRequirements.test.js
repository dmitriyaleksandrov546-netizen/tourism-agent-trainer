import { describe, expect, it } from 'vitest';
import { buildTravelDocumentChecklist, inferCountryFromScenario } from './travelRequirements.js';
import { getScenarioById } from './simulatorEngine.js';

describe('travelRequirements', () => {
  it('infers Turkey and exposes a concrete ready-to-send document memo', () => {
    const scenario = getScenarioById('turkey-family-hard');
    const checklist = buildTravelDocumentChecklist(scenario);

    expect(inferCountryFromScenario(scenario)).toBe('Турция');
    expect(checklist.country).toBe('Турция');
    expect(checklist.clientContext).toContain('дети: 2 года, 11 лет');
    expect(checklist.readyItems.map((item) => item.label)).toEqual(['Виза', 'Загранпаспорт', 'Обратный билет', 'Страховка', 'Дети', 'Транзит']);
    expect(checklist.readyItems[0].text).toBe('не нужна для РФ до 60 дней');
    expect(checklist.readyItems[1].text).toBe('120+ дней с даты въезда');
    expect(checklist.readyItems.every((item) => item.text.length <= 70)).toBe(true);
    expect(checklist.requiredDocuments.join(' ')).toContain('Обратный');
    expect(checklist.notRequired.join(' ')).toContain('Туристическая виза');
    expect(checklist.checkSeparately.join(' ')).toContain('Пересадка');
    expect(checklist.managerPhrase.length).toBeLessThan(170);
    expect(checklist.checks.map((item) => item.text).join(' ')).toContain('Виза: не нужна');
  });

  it('keeps monitoring as change detection, not as vague replacement for the memo', () => {
    const checklist = buildTravelDocumentChecklist(getScenarioById('uae-premium-anxious'));

    expect(checklist.country).toBe('ОАЭ');
    expect(checklist.readyItems.find((item) => item.label === 'Виза')?.text).toContain('не нужна');
    expect(checklist.readyItems.find((item) => item.label === 'Загранпаспорт')?.text).toContain('6 месяцев');
    expect(checklist.sourceNotes.length).toBeGreaterThanOrEqual(3);
    expect(checklist.dailyMonitoring.schedule).toBe('daily');
    expect(checklist.dailyMonitoring.managerOutcome).toContain('нужно / не нужно / проверить отдельно');
    expect(checklist.sourcePolicy).toContain('готовая памятка выше');
    expect(checklist.warning).toContain('гражданства');
  });
});
