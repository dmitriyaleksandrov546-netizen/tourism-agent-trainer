import { describe, expect, it } from 'vitest';
import { scenarios } from './simulatorEngine.js';

const REALITY_DATE = new Date('2026-08-17T00:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;

describe('scenario trip dates', () => {
  it('gives every scenario its own invented trip dates for seasonal hotel selection training', () => {
    const starts = scenarios.map((scenario) => scenario.tripDates?.start);

    expect(starts).toHaveLength(scenarios.length);
    expect(new Set(starts).size).toBe(scenarios.length);

    for (const scenario of scenarios) {
      expect(scenario.tripDates).toMatchObject({ start: expect.any(String), end: expect.any(String), label: expect.any(String), priceSeason: expect.any(String), selectionTrainingFocus: expect.any(String) });
      expect(scenario.tripDates.start).not.toBe('2026-08-17');
      expect(scenario.tripDates.end).not.toBe('2026-08-17');
      expect(new Date(scenario.tripDates.end).getTime()).toBeGreaterThan(new Date(scenario.tripDates.start).getTime());
      expect(scenario.tripDates.priceSeason.toLowerCase()).toMatch(/сезон|цена|бюджет|пик|низк|высок/i);
    }
  });

  it('spreads scenario trip dates over more than half a year from the current real date', () => {
    const startDates = scenarios.map((scenario) => new Date(`${scenario.tripDates.start}T00:00:00.000Z`).getTime());
    const minStart = Math.min(...startDates);
    const maxStart = Math.max(...startDates);

    expect((maxStart - minStart) / DAY_MS).toBeGreaterThan(183);
    expect((minStart - REALITY_DATE.getTime()) / DAY_MS).toBeGreaterThan(30);
  });
});
