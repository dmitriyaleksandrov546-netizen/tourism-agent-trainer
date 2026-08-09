import { describe, expect, it } from 'vitest';
import { filterTourvisionHotels, tourvisionHotels } from './tourvisionData.js';

describe('tourvisionData', () => {
  it('returns all hotels for an empty query', () => {
    expect(filterTourvisionHotels('')).toHaveLength(tourvisionHotels.length);
  });

  it('filters hotels by several hotel parameters', () => {
    const results = filterTourvisionHotels('Турция Белек');
    expect(results.map((hotel) => hotel.name)).toContain('Belek Aqua Club 5*');
    expect(results.every((hotel) => hotel.country === 'Турция')).toBe(true);
  });

  it('keeps source and confidence on every hotel card', () => {
    for (const hotel of tourvisionHotels) {
      expect(hotel.source).toBeTruthy();
      expect(hotel.checkedAt).toBeTruthy();
      expect(hotel.confidence).toBeTruthy();
    }
  });
});
