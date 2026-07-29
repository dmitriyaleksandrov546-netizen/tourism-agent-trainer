import { describe, expect, it } from 'vitest';
import { filterHotels, getAgentReadiness, getSectionById, menuSections, trainingTasks } from './appData.js';

describe('appData navigation and demo workflows', () => {
  it('defines every sidebar section as a clickable page', () => {
    expect(menuSections.map((item) => item.id)).toEqual(['dashboard', 'trainer', 'hotels', 'tests', 'agents', 'admin']);
    expect(menuSections.every((item) => item.title && item.headline)).toBe(true);
  });

  it('falls back to dashboard when an unknown section is requested', () => {
    expect(getSectionById('not-real').id).toBe('dashboard');
  });

  it('filters hotels by resort, family fit, risk and confidence text', () => {
    const results = filterHotels('дети риск высокая');

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toContain('Belek');
  });

  it('calculates readiness from completed training tasks', () => {
    const readiness = getAgentReadiness(trainingTasks);

    expect(readiness.completed).toBe(3);
    expect(readiness.total).toBe(6);
    expect(readiness.percent).toBe(50);
  });
});
