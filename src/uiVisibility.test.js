import { describe, expect, it } from 'vitest';
import { shouldRenderAnswerReview, shouldRenderDailySourceControl } from './uiVisibility.js';

describe('UI visibility flags', () => {
  it('keeps answer review panel hidden while the feature is paused', () => {
    expect(shouldRenderAnswerReview({ score: 80 })).toBe(false);
    expect(shouldRenderAnswerReview(null)).toBe(false);
  });

  it('keeps daily source control panel hidden while the feature is paused', () => {
    expect(shouldRenderDailySourceControl({ dailyMonitoring: { schedule: 'daily' } })).toBe(false);
    expect(shouldRenderDailySourceControl(null)).toBe(false);
  });
});
