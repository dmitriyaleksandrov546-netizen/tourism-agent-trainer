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
    expect(checklist.readyRules.visa).toContain('не нужна');
    expect(checklist.readyRules.passport).toContain('120 дней');
    expect(checklist.requiredDocuments.join(' ')).toContain('Обратный');
    expect(checklist.notRequired.join(' ')).toContain('Туристическая виза');
    expect(checklist.checkSeparately.join(' ')).toContain('Пересадка');
    expect(checklist.managerPhrase).toContain('виза обычно не нужна');
    expect(checklist.checks.map((item) => item.text).join(' ')).toContain('Виза: отметить');
  });

  it('keeps monitoring as change detection, not as vague replacement for the memo', () => {
    const checklist = buildTravelDocumentChecklist(getScenarioById('uae-premium-anxious'));

    expect(checklist.country).toBe('ОАЭ');
    expect(checklist.readyRules.visa).toContain('не нужна');
    expect(checklist.readyRules.passport).toContain('6 месяцев');
    expect(checklist.sourceNotes.length).toBeGreaterThanOrEqual(3);
    expect(checklist.dailyMonitoring.schedule).toBe('daily');
    expect(checklist.dailyMonitoring.managerOutcome).toContain('нужно / не нужно / проверить отдельно');
    expect(checklist.sourcePolicy).toContain('готовая памятка выше');
    expect(checklist.warning).toContain('гражданства');
  });
});
