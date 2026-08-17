import { describe, expect, it } from 'vitest';
import { scenarios } from './simulatorEngine.js';

const REALITY_DATE = '2026-08-17';
const DAY_MS = 24 * 60 * 60 * 1000;

describe('scenario simulated current dates', () => {
  it('gives every scenario its own invented current dialogue date', () => {
    const dates = scenarios.map((scenario) => scenario.simulatedToday?.iso);

    expect(dates).toHaveLength(scenarios.length);
    expect(new Set(dates).size).toBe(scenarios.length);

    for (const scenario of scenarios) {
      expect(scenario.simulatedToday).toMatchObject({
        iso: expect.any(String),
        label: expect.any(String),
        marketContext: expect.any(String),
        selectionTrainingFocus: expect.any(String)
      });
      expect(scenario.simulatedToday.iso).not.toBe(REALITY_DATE);
      expect(scenario.simulatedToday.label).not.toMatch(/–|—/);
      expect(scenario.simulatedToday.marketContext.toLowerCase()).toMatch(/сезон|цен|бюджет|спрос|налич/i);
    }
  });

  it('spreads simulated current dates over more than half a year for seasonality practice', () => {
    const timestamps = scenarios.map((scenario) => new Date(`${scenario.simulatedToday.iso}T00:00:00.000Z`).getTime());
    const minDate = Math.min(...timestamps);
    const maxDate = Math.max(...timestamps);

    expect((maxDate - minDate) / DAY_MS).toBeGreaterThan(183);
  });
});
