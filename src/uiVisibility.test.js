import { describe, expect, it } from 'vitest';
import { shouldRenderAnswerReview, shouldRenderDailySourceControl, shouldRenderFreshSources } from './uiVisibility.js';

describe('UI visibility flags', () => {
  it('keeps answer review panel hidden while the feature is paused', () => {
    expect(shouldRenderAnswerReview({ score: 80 })).toBe(false);
    expect(shouldRenderAnswerReview(null)).toBe(false);
  });

  it('keeps daily source control panel hidden while the feature is paused', () => {
    expect(shouldRenderDailySourceControl({ dailyMonitoring: { schedule: 'daily' } })).toBe(false);
    expect(shouldRenderDailySourceControl(null)).toBe(false);
  });

  it('shows fresh-check source list when there are sources for the memo', () => {
    expect(shouldRenderFreshSources({ sourceNotes: ['МИД', 'Посольство'] })).toBe(true);
    expect(shouldRenderFreshSources({ sourceNotes: [] })).toBe(false);
    expect(shouldRenderFreshSources(null)).toBe(false);
  });
});
