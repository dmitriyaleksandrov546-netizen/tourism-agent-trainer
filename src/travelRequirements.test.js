import { describe, expect, it } from 'vitest';
import { buildTravelDocumentChecklist, inferCountryFromScenario } from './travelRequirements.js';
import { getScenarioById } from './simulatorEngine.js';

describe('travelRequirements', () => {
  it('infers country from scenario direction and exposes manager checklist', () => {
    const scenario = getScenarioById('turkey-family-hard');
    const checklist = buildTravelDocumentChecklist(scenario);

    expect(inferCountryFromScenario(scenario)).toBe('Турция');
    expect(checklist.country).toBe('Турция');
    expect(checklist.clientContext).toContain('дети: 2 года, 11 лет');
    expect(checklist.questions.join(' ')).toContain('Гражданство');
    expect(checklist.checks.length).toBeGreaterThanOrEqual(6);
    expect(checklist.checks.map((item) => item.text).join(' ')).toContain('Перед оплатой');
  });

  it('keeps source freshness policy explicit until automated source URLs are connected', () => {
    const checklist = buildTravelDocumentChecklist(getScenarioById('uae-premium-anxious'));

    expect(checklist.country).toBe('ОАЭ');
    expect(checklist.sourceNotes.length).toBeGreaterThanOrEqual(3);
    expect(checklist.sourcePolicy).toContain('после загрузки URL базы');
    expect(checklist.warning).toContain('гражданства');
  });
});
